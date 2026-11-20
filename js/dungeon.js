// Run flow. A dungeon is 3 floors; a floor is a forward-only tree of rooms (map.js) ending in a boss.
// A room is a shape made of screen-sized chunks (strips, boxes, L, T, plus...), so it can run several screens in
// both directions; chunks left out are solid rock. Enemies wait in groups around the room until the party comes
// near, and the party walks the room chunk by chunk before heading for the doors. After a room is cleared the party deals with what's in it (chest, fountain, a choice of
// three things), then picks one of the doors ahead. Heroes keep HP and potions between rooms; downed heroes stay
// down until the floor's boss is beaten, then come back at 10% HP.
import { makeWorld, spawn, step, alive, addStatus, hurt, puff, fx, scatterCoins } from './sim.js';
import { DEFS, xpToNext, levelHp, levelDmg, TRINKET_IDS } from './units.js';
import { trinketHooks, raiseGhost, wears } from './trinkets.js';
import { HEROES, STARTERS, treeFor, freeNodes } from './heroes.js';
import { initKit, refreshKit, hooksOf } from './kits.js';
import { rand, rrange, rint, pick, chance, dist, clamp, angleTo } from './util.js';
import { buildGrid, circleRect, findPath } from './path.js';
import { makeFloor, nodeAt, nextNodes, chooseDoor, advance, LAYERS } from './map.js';
import { themeOf, weighted } from './themes.js';

export const H = 480;
export const FLOORS = 3;

// opts: { theme, party: [heroId...], mercs, depth }. (A number for opts is the old depth argument.)
// Levels start at 1 every run: XP and levels live inside a run, and bought skill-tree nodes switch on as levels come.
export function newRun(save, opts = {}) {
  if (typeof opts === 'number') opts = { depth: opts };
  const dp = debugParam('party'); // testing: ?party=a,b,c
  const party = (dp ? dp.split(',') : opts.party && (opts.party.length || opts.mercs) ? opts.party : save.party && save.party.length ? save.party : STARTERS).filter((k) => HEROES[k]);
  const hired = opts.mercs ? ['knight', 'rogue'] : []; // mercenaries: the old starter kinds, middling, not kept (camp lane B)
  const heroes = {};
  for (const k of hired) heroes[k] = { level: 1, xp: 0, hp: null, down: false, potions: 0, trinkets: [], best: 1, merc: true };
  for (const k of party) {
    const sv = (save.heroes && save.heroes[k]) || {};
    heroes[k] = { level: 1, xp: 0, hp: null, down: false, potions: (opts.potions && opts.potions[k]) || 0, trinkets: (sv.trinkets || []).slice(), best: 1 };
  }
  // testing: ?trinkets=a,b,c (or ?trinkets=all) puts those trinkets on every hero, whatever the slots
  const tq = typeof location !== 'undefined' && new URLSearchParams(location.search).get('trinkets');
  if (tq) for (const k of party) heroes[k].trinkets = tq === 'all' ? TRINKET_IDS.slice() : tq.split(',').filter((id) => TRINKET_IDS.includes(id));
  const theme = themeOf(opts.theme || debugParam('theme')).id;
  const run = { depth: opts.depth || save.depth || 1, theme, mercs: !!opts.mercs, hired, party, floor: 1, map: makeFloor(themeOf(theme).kinds), coins: 0, gems: 0,
    satchel: [], keys: 0, heroes, phase: 'fight', t: 0, fade: 1, save, kills: 0, banner: null, rooms: 0, leaving: false };
  // testing: ?bossroom jumps straight to floor 3's boss room, ?lvl=N starts the heroes at level N
  if (debugParam('bossroom') != null) { run.floor = FLOORS; run.map.L = LAYERS; run.map.i = 0; }
  const lvl = +debugParam('lvl'); if (lvl > 1) for (const k of party) heroes[k].level = heroes[k].best = lvl;
  buildRoom(run);
  return run;
}

function debugParam(k) { try { return typeof location !== 'undefined' ? new URLSearchParams(location.search).get(k) : null; } catch { return null; } }

// Room shapes on a grid of chunks. Columns run forward (the doors out are past the last column; in portrait
// that's up the screen), rows run across. '#' is floor, '.' is rock. Each row is one screen across.
export const ROW = 480;
const SHAPES = {
  one: ['#'], strip2: ['##'], strip3: ['###'], strip4: ['####'],
  box: ['##', '##'], wide: ['###', '###'], square: ['###', '###', '###'],
  L: ['###', '..#'], L2: ['#..', '###'], J: ['..#', '###'], S: ['##.', '.##'],
  T: ['..#', '###', '..#'], Tside: ['###', '.#.'], plus: ['.#.', '###', '.#.'],
};
const KIND_SHAPES = {
  fight: ['strip2', 'strip3', 'strip3', 'strip4', 'box', 'box', 'wide', 'L', 'L2', 'J', 'S', 'T', 'Tside', 'plus', 'square'],
  hazard: ['strip3', 'box', 'L', 'J', 'S', 'Tside'],
  elite: ['one', 'box', 'plus', 'T'],
  treasure: ['one', 'strip2', 'L2'],
  fountain: ['one'], decision: ['one'],
  boss: ['box', 'wide'],
};
const COL_LEN = { one: [680, 920], fountain: [600, 780], decision: [640, 780] }; // round 6: rooms a bit smaller

function makeShape(kind) {
  const name = pick(KIND_SHAPES[kind] || KIND_SHAPES.fight);
  const rows = SHAPES[name], nr = rows.length, nc = rows[0].length;
  const [a, b] = COL_LEN[kind] || (nc === 1 ? COL_LEN.one : [420, 640]);
  const colW = []; for (let c = 0; c < nc; c++) colW.push(Math.round(rrange(a, b)));
  const colX = [0]; for (let c = 0; c < nc; c++) colX.push(colX[c] + colW[c]);
  const cells = [], solid = [];
  for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
    const cell = { c, r, x: colX[c], y: r * ROW, w: colW[c], h: ROW };
    (rows[r][c] === '#' ? cells : solid).push(cell);
  }
  return { name, nr, nc, W: colX[nc], H: nr * ROW, cells, solid };
}
const centre = (cell) => ({ x: cell.x + cell.w / 2, y: cell.y + cell.h / 2 });

function freeSpot(w, x, y, r) {
  if (x < r || y < r || x > w.W - r || y > w.H - r) return false;
  for (const wl of w.walls) if (circleRect(x, y, r + 14, wl)) return false;
  for (const p of w.pillars) if (dist(x, y, p.x, p.y) < p.r + r + 20) return false;
  for (const h of w.hazards) if (dist(x, y, h.x, h.y) < h.r + r + 8) return false;
  return true;
}
function placeFree(w, r, xmin, xmax, ymin = r + 30, ymax = w.H - r - 30) {
  for (let i = 0; i < 90; i++) { const x = rrange(xmin, xmax), y = rrange(ymin, ymax); if (freeSpot(w, x, y, r)) return { x, y }; }
  // nothing free in that band: the middle of a floor chunk that overlaps it
  const cs = w.cells.filter((c) => c.x < xmax && c.x + c.w > xmin);
  const c = cs.length ? pick(cs) : pick(w.cells);
  return { x: clamp(c.x + c.w / 2, xmin, xmax), y: c.y + c.h / 2 };
}
// A spot in a chunk, kept away from its edges; in the entrance chunk, only its far half.
function inCell(w, cell, r, m = 110) {
  const x0 = cell === w.entry ? cell.x + cell.w * 0.55 : cell.x + m, x1 = cell.x + cell.w - m;
  return placeFree(w, r, x0, Math.max(x0 + 10, x1), cell.y + m, cell.y + cell.h - m);
}

// Shapes: walls that break the room up, kept clear of the way in and the way out.
function addWalls(w) {
  const W = w.W, Hh = w.H, T = 36;
  const shape = pick(['open', 'split', 'corridor', 'zigzag', 'blocks', 'split', 'zigzag']);
  const x0 = rrange(0.3, 0.5) * W;
  if (shape === 'split') {
    const a = rint(50, 130), b = rint(a + 190, Hh - 170);
    w.walls.push({ x: x0, y: 0, w: T, h: a }, { x: x0, y: a + 130, w: T, h: b - a - 130 }, { x: x0, y: b + 130, w: T, h: Hh - b - 130 });
  } else if (shape === 'corridor') {
    const len = Math.min(500, W * 0.3), gap = 190, top = rint(100, Hh - gap - 100);
    w.walls.push({ x: x0, y: 0, w: len, h: top }, { x: x0, y: top + gap, w: len, h: Hh - top - gap });
  } else if (shape === 'zigzag') {
    w.walls.push({ x: x0, y: 0, w: T * 1.6, h: Hh - 170 }, { x: x0 + Math.min(420, W * 0.25), y: 170, w: T * 1.6, h: Hh - 170 });
  } else if (shape === 'blocks') {
    for (let i = 0; i < rint(3, 5); i++) {
      const s = rint(60, 100), x = rrange(300, W - 400), y = rrange(40, Hh - s - 40);
      if (w.walls.every((r) => x + s + 60 < r.x || x > r.x + r.w + 60 || y + s + 60 < r.y || y > r.y + r.h + 60)) w.walls.push({ x, y, w: s, h: s });
    }
  }
  w.shape = shape;
}

// Square blocks to break up a big room, each inside a floor chunk.
function addBlocks(w) {
  for (let i = 0; i < rint(2, 4); i++) {
    const c = pick(w.cells); if (c === w.entry) continue;
    const sz = rint(60, 110), x = rrange(c.x + 120, c.x + c.w - 120 - sz), y = rrange(c.y + 110, c.y + c.h - 110 - sz);
    if (w.walls.every((r) => r.solid || x + sz + 70 < r.x || x > r.x + r.w + 70 || y + sz + 70 < r.y || y > r.y + r.h + 70)) w.walls.push({ x, y, w: sz, h: sz });
  }
  w.shape += '+blocks';
}

// What an enemy is worth from a room's budget, and the group size small things come in (enemies.js defs carry
// cost/pack; these are for the older kinds in units.js).
const OLD_COST = { rat: 1, slime: 2, slimeSmall: 1, skeleton: 3 }, OLD_PACK = { rat: [2, 4] };
const costOf = (k) => DEFS[k].cost ?? OLD_COST[k] ?? 3;
const packOf = (k) => DEFS[k].pack || OLD_PACK[k] || null;
// What a group is made of: kinds from the theme's roster for this floor, spending `budget`. harder: now and then
// a kind from the next floor's roster (later waves bring heavier things).
function rollKinds(run, budget, harder = 0) {
  const kinds = [];
  const T = themeOf(run.theme), at = (f) => T.enemies[Math.min(T.enemies.length, f) - 1];
  for (let guard = 0; budget > 0 && guard < 40; guard++) {
    const roster = chance(harder) ? at(run.floor + 1) : at(run.floor);
    const k = weighted(roster, rand), c = costOf(k), pk = packOf(k);
    if (c > budget + 1.5 && kinds.length) { if (guard > 20) break; continue; } // too big for what's left: something smaller
    const n = pk ? Math.max(1, Math.min(rint(pk[0], pk[1]), Math.ceil(budget / c))) : 1;
    for (let j = 0; j < n; j++) kinds.push(k);
    budget -= n * c;
  }
  return kinds;
}
function enemyPack(w, run, budget, cell) {
  const c = inCell(w, cell, 40, 150);
  for (const k of rollKinds(run, budget)) {
    const p = placeFree(w, DEFS[k].r, c.x - 150, c.x + 150, Math.max(DEFS[k].r + 20, c.y - 150), Math.min(w.H - DEFS[k].r - 20, c.y + 150));
    const u = spawn(w, k, p.x, p.y, { mult: w.mult });
    u.facing = u.mvA = angleTo(p.x, p.y, w.doorIn.x, w.doorIn.y); // facing the way the party comes in
  }
}

// How hard each dungeon type is, easiest first (designer, round 6: each dungeon harder than the last).
export const DUNGEON_RANK = { warren: 0, sewers: 1, crypt: 2 };

function buildRoom(run) {
  const node = nodeAt(run.map);
  const kind = node.kind;
  const T = themeOf(run.theme);
  // the floor's last room: floors 1 and 2 end with the theme's warden, floor 3 with its boss (which may bring an arena)
  const bossKind = kind === 'boss' ? (run.floor >= FLOORS ? T.boss : T.warden) : null;
  const arena = bossKind && DEFS[bossKind].arena;
  const sh = arena ? arenaShape(arena) : makeShape(kind);
  const w = makeWorld(sh.W, sh.H);
  w.theme = T; w.bossAdds = T.bossAdds;
  run.world = w; run.node = node; run.rooms++;
  w.cells = sh.cells; w.shape = sh.name;
  for (const c of sh.solid) w.walls.push({ x: c.x, y: c.y, w: c.w, h: c.h, solid: true, c: c.c, r: c.r });
  w.chunks = { nc: sh.nc, nr: sh.nr };
  w.entry = pick(sh.cells.filter((c) => c.c === 0));
  w.exits = sh.cells.filter((c) => c.c === sh.nc - 1);
  w.doorIn = { x: 0, y: arena ? sh.H / 2 : centre(w.entry).y };
  const L = node.L;
  // enemy strength: the dungeon type, the run's depth, the floor and how far into it (each floor harder than the last)
  w.mult = 1 + 0.12 * (DUNGEON_RANK[run.theme] || 0) + 0.22 * (run.depth - 1) + 0.15 * (run.floor - 1) + 0.03 * L;
  const busy = kind === 'fight' || kind === 'hazard' || kind === 'elite';
  if (arena) buildArena(w, arena);
  else if (sh.nr === 1 && sh.nc > 1) { if ((busy && chance(0.75)) || (kind === 'treasure' && chance(0.5))) addWalls(w); }
  else if (busy && sh.cells.length > 2 && chance(0.55)) addBlocks(w);
  // round pillars and hazards
  const np = arena ? 0 : kind === 'boss' ? 2 : kind === 'fountain' || kind === 'decision' ? 0 : rint(0, 1 + sh.cells.length);
  // pillars keep well clear of walls so they never seal a gap
  for (let i = 0; i < np; i++) { const r = rrange(22, 36); const p = placeFree(w, r + 90, 320, w.W - 300); if (freeSpot(w, p.x, p.y, r + 90)) w.pillars.push({ x: p.x, y: p.y, r }); }
  const nh = arena ? 0 : kind === 'hazard' ? Math.round(sh.cells.length * 1.6) : kind === 'boss' ? 1 : busy && chance(0.4) ? rint(1, 2) : 0;
  for (let i = 0; i < nh; i++) {
    const type = weighted(T.hazards, rand);
    const r = HAZ_R[type] ? rrange(...HAZ_R[type]) : rrange(24, 34);
    const p = placeFree(w, r, 280, w.W - 240); if (freeSpot(w, p.x, p.y, r)) w.hazards.push({ type, x: p.x, y: p.y, r, hidden: type === 'snare' });
  }
  if (T.water && !arena && (busy || kind === 'treasure') && chance(kind === 'hazard' ? 1 : T.water)) addWater(w);
  // what the room holds
  const mid = centre(sh.cells[Math.floor(sh.cells.length / 2)]);
  if (kind === 'fountain') w.pillars.push({ x: w.W * 0.55, y: mid.y, r: 38, fountain: true, used: false });
  if (kind === 'decision') pickRewards(3).forEach((rw, i) => w.pickups.push({ type: 'pedestal', x: w.W * 0.55, y: mid.y - ROW / 2 + ROW * (i + 1) / 4, reward: rw }));
  // doors ahead: one per room the tree leads to, spread along the far edge of the last column's chunks
  const ahead = kind === 'boss' ? [] : nextNodes(run.map);
  const spans = w.exits.map((c) => [c.y + 60, c.y + c.h - 60]), span = spans.reduce((a, [p, q]) => a + q - p, 0);
  w.doors = ahead.map((n, j) => {
    let at = span * (j + 0.5) / ahead.length, y = spans[0][0];
    for (const [p, q] of spans) { if (at <= q - p) { y = p + at; break; } at -= q - p; }
    return { y, kind: n.kind, chosen: false };
  });
  buildGrid(w);
  // every room must be crossable from the way in to every way out; if not, lose the pillars, then the inner walls
  const outs = () => (w.doors.length ? w.doors : [{ y: centre(w.exits[0]).y }]);
  const ok = () => outs().every((d) => findPath(w, 80, w.doorIn.y, w.W - 60, d.y));
  if (!ok()) { w.pillars = w.pillars.filter((p) => p.fountain); buildGrid(w); }
  if (!ok()) { w.walls = w.walls.filter((r) => r.solid); w.shape += '-walls'; buildGrid(w); }
  dress(w, T, sh);
  // the party walks the room chunk by chunk: the nearest chunk not yet seen, the way-out chunks last
  w.toVisit = sh.cells.filter((c) => c !== w.entry).map((c) => ({ ...centre(c), exit: c.c === sh.nc - 1 }));
  w.wp = null;
  // heroes come in at the way in (the bottom of the screen in portrait)
  const y0 = w.doorIn.y, ys = [y0, y0 - 60, y0 + 60];
  [...run.party, ...run.hired].forEach((k, i) => {
    const hs = run.heroes[k];
    // a downed hero stays out until the floor's boss falls; with the Wraith Veil, its ghost comes along
    if (hs.down) { if (wears(hs.trinkets, 'wraithVeil')) raiseGhost(w, { kind: k, x: 70, y: ys[i % 3], level: hs.level, dmgMul: levelDmg(1, hs.level), fake: true }); return; }
    const tank = hs.merc ? k === 'knight' : HEROES[k].role === 'tank';
    const u = spawn(w, k, 70 + (tank ? 40 : 0), ys[i % 3] + Math.floor(i / 3) * 30, { level: hs.level, hp: hs.hp, potions: hs.potions, trinkets: hs.trinkets });
    if (!hs.merc) initKit(u, k, buildFor(run.save, k), hs.level);
    if (hs.hp != null) u.hp = Math.min(u.maxHp, hs.hp);
    u.facing = 0; u.mvA = 0;
  });
  // enemies: groups around the room's chunks, waiting
  const far = pick(w.exits);
  if (kind === 'boss') {
    const fc = centre(far);
    const partyScale = 0.12 + 0.28 * Math.min(4, run.party.length);
    const bx = arena ? w.throne.x : w.W - 260, by = arena ? w.throne.y : fc.y;
    // a smaller party meets a weaker boss (the same party-size idea as the rooms' enemy budget)
    const b = spawn(w, bossKind, bx, by, { mult: w.mult * (run.floor === FLOORS ? 1 : 0.75), hpMul: 0.4 + 0.2 * Math.min(3, run.party.length) });
    b.facing = b.mvA = Math.PI;
    if (!arena) for (let i = 0; i < Math.round((1 + run.floor + Math.floor(run.depth / 2)) * partyScale); i++) {
      const p = inCell(w, far, 30, 90); const u = spawn(w, pick(T.bossAdds), p.x, p.y, { mult: w.mult }); u.facing = Math.PI;
    }
  } else if (kind === 'fight' || kind === 'hazard' || kind === 'elite' || kind === 'treasure') {
    let homes = sh.cells.filter((c) => c !== w.entry);
    if (!homes.length) homes = [w.entry];
    if (kind === 'treasure') homes = [pick(homes)];
    // fewer enemies for a smaller party: one hero faces about 40% of what three do
    const partyScale = 0.12 + 0.28 * Math.min(4, run.party.length + run.hired.length);
    const total = ((kind === 'treasure' ? 3 : 4 + run.depth * 2 + run.floor * 2 + (DUNGEON_RANK[run.theme] || 0)) + L * 0.5) * (kind === 'treasure' ? 1 : 0.55 + 0.18 * sh.cells.length) * partyScale;
    // the first lot is a little smaller than before round 6: the waves after it make up the rest
    for (const cell of homes) enemyPack(w, run, Math.max(2, Math.round(total * (kind === 'treasure' ? 1 : 0.75) / homes.length * rrange(0.8, 1.25))), cell);
    if (kind === 'elite') {
      const p = inCell(w, far, 40);
      const u = spawn(w, T.elite, p.x, p.y, { mult: w.mult * 1.25, scale: 1.15, hpMul: 1.9 }); u.facing = Math.PI; u.elite = true;
    }
    // waves: once the room is clear, more come up out of the floor (1-2, more likely on deeper floors), each about
    // half the room's first lot; the chest (if the room has one) shows up when the last wave is down
    if (kind !== 'treasure') w.waves = { left: kind === 'elite' ? 1 : 1 + (chance(0.25 * (run.floor - 1)) ? 1 : 0), budget: total * 0.4, n: 0 };
    w.chest = kind === 'treasure' || kind === 'elite' || chance(0.3);
  }
  w.on.kill = (u) => onKill(run, u);
  w.on.coin = (p) => { run.coins += p.v; };
  w.on.drank = (u) => { run.heroes[u.kind].potions = u.potions; };
  run.phase = 'fight'; run.t = 0; run.fade = 1; run.task = null; run.quietT = 0;
}

// ---------------------------------------------------------------- dungeon types: hazards, water, dressing, arenas
// Hazard sizes. 'mist' (crypt): cold grave mist, chills. 'gas' (sewers): a standing cloud of sewer gas (poisons; fire
// sets it off). 'snare' (warren): a hidden goblin trap that holds whoever steps on it for a moment, then it's spent.
const HAZ_R = { oil: [34, 52], spikes: [24, 34], mist: [58, 82], gas: [44, 60], snare: [15, 17] };

// Sewer water: a channel running across the room. Wading through it soaks you and slows you down.
function addWater(w) {
  w.water = w.water || [];
  const n = w.W > 1600 && chance(0.5) ? 2 : 1;
  for (let i = 0; i < n; i++) {
    for (let tries = 0; tries < 12; tries++) {
      const cw = rrange(70, 105), x = rrange(300, w.W - 280 - cw);
      if (w.pillars.some((p) => p.x + p.r > x - 20 && p.x - p.r < x + cw + 20)) continue;
      if (w.water.some((c) => x < c.x + c.w + 200 && x + cw > c.x - 200)) continue;
      w.water.push({ x, y: 0, w: cw, h: w.H });
      break;
    }
  }
}

// Floor dressing: drawn into the floor (render.js), no collision. Kept off doors and hazards.
function dress(w, T, sh) {
  w.decor = [];
  for (const cell of sh.cells) for (const [type, per] of T.props) {
    const n = Math.floor(per) + (chance(per % 1) ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const x = rrange(cell.x + 40, cell.x + cell.w - 40), y = rrange(cell.y + 34, cell.y + cell.h - 34);
      if (w.walls.some((r) => circleRect(x, y, 26, r)) || w.pillars.some((p) => dist(x, y, p.x, p.y) < p.r + 26)) continue;
      if (w.hazards.some((h) => dist(x, y, h.x, h.y) < h.r + 22) || x < 90 || x > w.W - 90) continue;
      w.decor.push({ type, x, y, a: rand() * Math.PI * 2, s: rrange(0.8, 1.2), v: rint(0, 2) });
    }
  }
  if (w.arena === 'throne') {
    w.decor.push({ type: 'dais', x: w.throne.x + 30, y: w.throne.y, a: 0, s: 1, v: 0 });
    for (const sy of [-1, 1]) for (const dx of [-40, 60]) w.decor.push({ type: 'candles', x: w.throne.x + dx, y: w.throne.y + sy * 150, a: 0, s: 1.2, v: 1 });
  }
}

// A boss's room. 'throne': the Bone King's crypt hall (docs/BOSS-bone-king.md): two chunks by two, a throne on a
// dais at the far end, an aisle between two rows of pillars, four open graves by the side walls.
function arenaShape(name) {
  const colW = name === 'throne' ? [660, 660] : [650, 650];
  const cells = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) cells.push({ c, r, x: c * colW[0], y: r * ROW, w: colW[c], h: ROW });
  return { name, nr: 2, nc: 2, W: colW[0] + colW[1], H: 2 * ROW, cells, solid: [] };
}
function buildArena(w, name) {
  w.arena = name; w.shape = name;
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 170, y: Hh / 2 };
  for (const fx of [0.36, 0.62]) for (const fy of [230, Hh - 230]) w.pillars.push({ x: W * fx, y: fy, r: 34 });
  w.graves = [];
  for (const fx of [0.2, 0.8]) for (const fy of [100, Hh - 100]) w.graves.push({ x: W * fx, y: fy, a: fy < Hh / 2 ? 0 : Math.PI, open: false });
}

// Each tick, after the sim: the theme's own hazards.
function themeTick(w, dt) {
  for (const u of w.units) {
    if (!alive(u)) continue;
    for (const h of w.hazards) {
      if (h.type === 'mist') { if (dist(u.x, u.y, h.x, h.y) < h.r + u.r * 0.3) addStatus(w, u, 'chill', 15 * dt); }
      else if (h.type === 'snare' && !h.sprung && dist(u.x, u.y, h.x, h.y) < h.r + u.r * 0.35) {
        h.sprung = true; h.t = 5; h.max = 5; h.hidden = false;
        u.rootT = Math.max(u.rootT || 0, 1.6); u.x = h.x; u.y = h.y; u.kx = u.ky = 0;
        hurt(w, u, 8, null, { noDodge: true });
        puff(w, h.x, h.y, '#B58B5A', 10, 90, 5, 0.4);
      }
    }
    if (w.water) for (const c of w.water) if (u.x > c.x && u.x < c.x + c.w && u.y > c.y && u.y < c.y + c.h) {
      addStatus(w, u, 'wet', Math.min(24 * dt, Math.max(0, 90 - u.st.wet))); u.inOil = true; // wading: slowed like oil until the sim's next hazard pass
      if (u.spd > 20 && rand() < dt * 8) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.6, y: u.y + rrange(-u.r, u.r) * 0.6, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 5, color: 'rgba(200,235,240,0.8)' });
    }
  }
}

// ---------------------------------------------------------------- rewards
const REWARDS = ['potion', 'xp', 'coins', 'trinket'];
function pickRewards(n) { const out = []; const pool = [...REWARDS]; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]); return out; }
export function rollTrinket() { return { id: pick(TRINKET_IDS), uid: Math.floor(rand() * 1e9) }; }

function grant(run, reward, hero) {
  const w = run.world;
  burst(w, hero ? hero.x : w.W / 2, hero ? hero.y : w.H / 2, { potion: '#E0604B', xp: '#FFE14D', coins: '#F2B53A', trinket: '#C9A7FF' }[reward]);
  if (reward === 'potion') {
    const hs = w.units.filter((u) => u.team === 'hero' && alive(u) && !u.summon).sort((a, b) => a.potions - b.potions || a.hp / a.maxHp - b.hp / b.maxHp);
    const h = hs[0]; if (h) { h.potions++; run.heroes[h.kind].potions = h.potions; }
  } else if (reward === 'xp') {
    for (const h of w.units) if (h.team === 'hero' && alive(h)) giveXp(run, h, 30 + 20 * run.depth);
  } else if (reward === 'coins') {
    const n = rint(10, 18) + run.depth * 6;
    scatterCoins(w, hero ? hero.x : w.W / 2, hero ? hero.y : w.H / 2, n);
  } else if (reward === 'trinket') {
    const it = rollTrinket(); run.satchel.push(it);
    equipFound(run, it.id, hero);
  }
}
// A found trinket goes straight on: the hero who found it if they have a free slot, else whoever does.
// It's worn for the rest of the run only (summary.foundTrinkets lists it; found trinkets aren't kept).
export const trinketSlots = (run, k) => 1 + (buildFor(run.save, k).nodes.slot2 ? 1 : 0);
function equipFound(run, id, finder) {
  const order = [finder && finder.kind, ...run.party].filter((k) => k && run.heroes[k] && !run.heroes[k].down);
  const k = order.find((k) => run.heroes[k].trinkets.length < trinketSlots(run, k)); if (!k) return;
  run.heroes[k].trinkets.push(id);
  const u = run.world.units.find((o) => o.kind === k && !o.summon);
  if (u) { if (u.trinkets !== run.heroes[k].trinkets) u.trinkets = run.heroes[k].trinkets; u.trinketHooks = trinketHooks(u.trinkets); }
}
function burst(w, x, y, color) { for (let i = 0; i < 18; i++) { const a = rand() * Math.PI * 2; w.particles.push({ x, y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, life: 0.7, max: 0.7, size: 5, color }); } }

// The skill-tree nodes a hero has bought (the save's), or everything with ?allnodes in the address (for testing).
function buildFor(save, k) {
  if (typeof location !== 'undefined' && /[?&]allnodes/.test(location.search)) {
    const nodes = {}; for (const n of treeFor(k)) nodes[n.id] = n.max; return { nodes };
  }
  return { nodes: { ...freeNodes(k), ...((save.heroes && save.heroes[k] && save.heroes[k].nodes) || {}) } };
}

function giveXp(run, h, xp) {
  const w = run.world, sv = run.heroes[h.kind];
  if (!sv || h.summon) return;
  sv.xp += xp;
  while (sv.xp >= xpToNext(sv.level)) {
    sv.xp -= xpToNext(sv.level); sv.level++; sv.best = Math.max(sv.best, sv.level);
    const ratio = h.hp / h.maxHp, grow = levelHp(h.def.hp, sv.level) / levelHp(h.def.hp, sv.level - 1);
    h.maxHp = Math.round(h.maxHp * grow); h.hp = Math.min(h.maxHp, h.maxHp * ratio + h.maxHp * 0.25);
    h.dmgMul *= levelDmg(1, sv.level) / levelDmg(1, sv.level - 1); h.level = sv.level;
    refreshKit(h, sv.level);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; w.particles.push({ x: h.x, y: h.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.6, max: 0.6, size: 4, color: '#FFE14D' }); }
  }
}

function onKill(run, u) {
  run.kills++;
  if (u.def.boss) run.gems += run.floor >= FLOORS ? 2 : 1; // gems: each floor's boss drops one, the last boss two (camp lane B)
  if (u.def.onDeath) u.def.onDeath(run.world, u);
  const xp = Math.round((u.def.xp || 0) * (1 + 0.15 * (run.depth - 1)) * (u.elite ? 3 : 1));
  for (const h of run.world.units) if (h.team === 'hero' && alive(h)) giveXp(run, h, xp);
}

const heroesAlive = (run) => run.world.units.filter((u) => u.team === 'hero' && alive(u) && !u.summon);
function nearestHero(run, x, y) { let best = null, bd = Infinity; for (const h of heroesAlive(run)) { const d = dist(h.x, h.y, x, y); if (d < bd) { bd = d; best = h; } } return best; }

// ---------------------------------------------------------------- the room's flow
export function update(run, dt) {
  const w = run.world;
  run.t += dt;
  run.fade = Math.max(0, run.fade - dt * 2.5);
  if (run.banner) { run.banner.t -= dt; if (run.banner.t <= 0) run.banner = null; }
  if (run.phase === 'won' || run.phase === 'lost' || run.phase === 'retreated') return;
  if (run.phase === 'transition') { run.fadeOut += dt * 2.2; if (run.fadeOut >= 1) nextRoom(run); return; }
  if (w.hitstop > 0) { w.hitstop -= dt; return; } // a beat of stillness on big hits
  step(w, dt);
  themeTick(w, dt);
  for (const u of w.units) if (u.team === 'hero' && u.downed && run.heroes[u.kind]) run.heroes[u.kind].down = true;
  if (heroesAlive(run).length === 0) { run.phase = 'lost'; summarize(run); return; }
  const enemies = w.units.filter((u) => u.team === 'enemy' && alive(u));
  // a fight that's gone quiet (someone stuck, a group never met): everyone left comes looking
  if (run.phase === 'fight') {
    if (run.kills !== run.lastKills) { run.lastKills = run.kills; run.quietT = 0; } else run.quietT = (run.quietT || 0) + dt;
    if (run.quietT > 25) for (const e of enemies) e.aggro = true;
  }
  revive(run, dt);
  if (run.phase === 'fight') nextWaypoint(w);
  if (run.phase === 'fight' && enemies.length === 0) {
    if (w.waves && (w.waves.left > 0 || w.waves.pending)) waveTick(run, dt);
    else roomWon(run);
  }
  if (run.phase === 'loot') { if (doTasks(run, dt)) { run.phase = 'choose'; run.t = 0; } return; }
  if (run.phase === 'choose') {
    if (run.leaving) { finishRoomHp(run); run.phase = 'retreated'; summarize(run); return; } // leaving: the room is done, out we go
    if (run.node.kind === 'boss') { finishRoomHp(run); endFloor(run); return; }
    const hs = heroesAlive(run);
    if (run.doorK == null) {
      const hp = hs.reduce((a, h) => a + h.hp / h.maxHp, 0) / Math.max(1, run.party.length + run.hired.length);
      run.doorK = chooseDoor(run.map, hp, run.keys);
      w.doors[run.doorK].chosen = true;
      run.exitT = 0;
    }
    const door = w.doors[run.doorK];
    hs.forEach((h, i) => { h.forcedGoal = { x: w.W - 24, y: clamp(door.y + (i - 1) * 40, 40, w.H - 40) }; h.target = null; });
    run.exitT += dt;
    if (hs.every((h) => h.x > w.W - 80) || run.exitT > 12) { finishRoomHp(run); run.phase = 'transition'; run.fadeOut = 0; }
  }
}

// A downed hero is revived by an ally standing over them for a few seconds (10% HP). The nearest ally that
// isn't fighting goes over; enemies close by keep them away.
const REVIVE_T = 3, REVIVE_HP = 0.1;
function revive(run, dt) {
  const w = run.world;
  const downed = w.units.filter((u) => u.team === 'hero' && u.downed && !u.dead);
  for (const h of heroesAlive(run)) if (h.forcedGoal && h.forcedGoal.revive && !downed.includes(h.forcedGoal.who)) h.forcedGoal = null;
  for (const d of downed) {
    const threat = w.units.some((e) => e.team === 'enemy' && !e.dead && !e.downed && e.aggro && dist(e.x, e.y, d.x, d.y) < 260);
    let helper = null, hd = Infinity;
    for (const h of heroesAlive(run)) {
      const busy = h.target && dist(h.x, h.y, h.target.x, h.target.y) < 300;
      const dd = dist(h.x, h.y, d.x, d.y);
      if ((!busy || (h.forcedGoal && h.forcedGoal.who === d)) && dd < hd) { hd = dd; helper = h; }
    }
    for (const h of heroesAlive(run)) if (h !== helper && h.forcedGoal && h.forcedGoal.who === d) h.forcedGoal = null;
    // an enemy at the helper's heels is a threat too (else a last hero walks to and fro between the downed, never fighting)
    const hunted = helper && w.units.some((e) => e.team === 'enemy' && !e.dead && !e.downed && e.aggro && dist(e.x, e.y, helper.x, helper.y) < 220);
    if (!helper || threat || hunted) { if (helper && helper.forcedGoal && helper.forcedGoal.who === d) helper.forcedGoal = null; d.reviveT = Math.max(0, (d.reviveT || 0) - dt); continue; }
    helper.forcedGoal = { x: d.x, y: d.y, revive: true, who: d }; helper.target = null;
    if (hd < d.r + helper.r + 18) {
      const rate = Math.max(1, ...hooksOf(helper).map((x) => x.reviveRate || 1));
      d.reviveT = (d.reviveT || 0) + dt * rate; d.reviveHp = Math.max(REVIVE_HP, ...hooksOf(helper).map((x) => x.reviveHp || 0));
      if (rand() < dt * 14) w.particles.push({ x: d.x + rrange(-18, 18), y: d.y + rrange(-18, 18), vx: 0, vy: 0, rise: 40, life: 0.6, max: 0.6, size: 4, color: '#FFE7A0' });
      if (d.reviveT >= REVIVE_T) {
        d.downed = false; d.reviveT = 0; d.hp = d.maxHp * (d.reviveHp || REVIVE_HP); d.invulnT = 1.2; d.st = { burn: 0, chill: 0, poison: 0 };
        run.heroes[d.kind].down = false; helper.forcedGoal = null;
        burst(w, d.x, d.y, '#FFE7A0');
      }
    }
  }
}

// Where the party heads when nothing is in sight: the nearest enemy still standing (they don't search empty parts
// of the room). While a wave is on its way they hold together where they are.
function nextWaypoint(w) {
  const hs = w.units.filter((u) => u.team === 'hero' && alive(u)); if (!hs.length) return;
  let cx = 0, cy = 0; for (const h of hs) { cx += h.x; cy += h.y; } cx /= hs.length; cy /= hs.length;
  let best = null, bd = Infinity;
  for (const e of w.units) if (e.team === 'enemy' && alive(e)) { const d = dist(e.x, e.y, cx, cy); if (d < bd) { bd = d; best = e; } }
  w.wp = best ? { x: best.x, y: best.y } : { x: cx, y: cy };
}

// ---------------------------------------------------------------- waves
// The room is clear but more are coming: a short breather, then cracks open in the floor around the party (shown,
// not told: dark rifts, a low rumble of shake) and the next wave climbs out of them, already angry.
const WAVE_GAP = 1.3, RIFT_T = 1.1;
function waveTick(run, dt) {
  const w = run.world, wv = w.waves;
  if (!wv.pending) { wv.pending = { t: WAVE_GAP + RIFT_T, spots: null }; wv.left--; wv.n++; }
  const pd = wv.pending;
  pd.t -= dt;
  if (!pd.spots && pd.t <= RIFT_T) {
    const hs = heroesAlive(run); if (!hs.length) return;
    let cx = 0, cy = 0; for (const h of hs) { cx += h.x; cy += h.y; } cx /= hs.length; cy /= hs.length;
    const kinds = rollKinds(run, Math.max(2, Math.round(wv.budget * rrange(0.85, 1.15))), 0.2 + 0.15 * wv.n);
    // one or two groups, each round a spot a fair way from the party, on open floor
    const groups = kinds.length > 3 && chance(0.6) ? 2 : 1, centres = [];
    for (let g = 0; g < groups; g++) centres.push(waveSpot(w, cx, cy, 60));
    pd.spots = kinds.map((k, i) => {
      const c = centres[i % groups], r = DEFS[k].r;
      let p = null;
      for (let tries = 0; tries < 30 && !p; tries++) { const a = rand() * Math.PI * 2, d = rrange(0, 50 + 12 * kinds.length / groups), x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d; if (freeSpot(w, x, y, r)) p = { x, y }; }
      p = p || c;
      fx(w, { type: 'rift', x: p.x, y: p.y, r: r * 1.1, at: RIFT_T, max: RIFT_T + 0.5 });
      return { k, ...p };
    });
    w.shake = Math.max(w.shake, 3);
  }
  if (pd.t > 0) return;
  for (const sp of pd.spots || []) {
    const u = spawn(w, sp.k, sp.x, sp.y, { mult: w.mult });
    u.aggro = true; u.facing = u.mvA = rand() * Math.PI * 2; u.flinchT = 0.35; // a moment to find its feet
    puff(w, sp.x, sp.y, '#3A2E44', 10, 120, 7, 0.5);
  }
  wv.pending = null;
}
// A spot on open floor 260-420 from (cx, cy), out of the party's way.
function waveSpot(w, cx, cy, r) {
  for (let i = 0; i < 80; i++) {
    const a = rand() * Math.PI * 2, d = rrange(260, 420), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (freeSpot(w, x, y, r) && w.cells.some((c) => x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h)) return { x, y };
  }
  return placeFree(w, r, 60, w.W - 60);
}

// The room is won: spikes sink, and (if the room has one) a chest drops in beside the party.
function roomWon(run) {
  const w = run.world;
  w.cleared = true; run.phase = 'loot'; run.t = 0;
  for (const h of heroesAlive(run)) h.target = null;
  for (const h of w.hazards) if (h.type === 'spikes' && h.up !== false) { h.up = false; puff(w, h.x, h.y, '#B9AE9C', 6, 60, 5, 0.4); }
  if (w.chest) {
    const hs = heroesAlive(run);
    let cx = 0, cy = 0; for (const h of hs) { cx += h.x; cy += h.y; } cx /= hs.length || 1; cy /= hs.length || 1;
    let p = null;
    for (let i = 0; i < 60 && !p; i++) { const a = rand() * Math.PI * 2, d = rrange(70, 150), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      if (freeSpot(w, x, y, 34) && !hs.some((h) => dist(h.x, h.y, x, y) < h.r + 30)) p = { x, y }; }
    p = p || { x: clamp(cx + 90, 60, w.W - 60), y: cy };
    w.pickups.push({ type: 'chest', x: p.x, y: p.y, open: false, free: true, drop: 0.45 }); // drop: falling in (render.js)
  }
}

// After the fight: walk over the coins (they fade), then open the chest, drink from the fountain, take one of three things.
function doTasks(run, dt) {
  const w = run.world;
  const loose = w.pickups.filter((p) => (p.type === 'coin' || p.type === 'key') && !p.homing); // homing ones come by themselves
  // reviving first, but never holding the room up for long (they can still be revived on the way out)
  if (run.t < 25 && w.units.some((u) => u.team === 'hero' && u.downed && !u.dead)) return false;
  if (loose.length && run.t < 30) {
    for (const h of heroesAlive(run)) {
      // stick with the coin it's walking to until it's picked up (switching every tick swung it about)
      let best = h.forcedGoal && h.forcedGoal.coin && loose.includes(h.forcedGoal.p) ? h.forcedGoal.p : null;
      if (!best) { let bd = Infinity; for (const p of loose) { const d = dist(p.x, p.y, h.x, h.y); if (d < bd) { bd = d; best = p; } } }
      h.forcedGoal = { x: best.x, y: best.y, coin: true, p: best };
    }
    return false;
  }
  for (const p of loose) if (p.type === 'key') { run.keys++; p.got = true; } // a key out of reach still counts
  w.pickups = w.pickups.filter((p) => !p.got);
  for (const h of heroesAlive(run)) if (h.forcedGoal && h.forcedGoal.coin) h.forcedGoal = null;
  if (!run.task) {
    const chest = w.pickups.find((p) => p.type === 'chest' && !p.open && !(p.drop > 0));
    const fountain = w.pillars.find((p) => p.fountain && !p.used);
    const peds = w.pickups.filter((p) => p.type === 'pedestal');
    if (chest) run.task = { type: 'chest', obj: chest };
    else if (fountain) run.task = { type: 'fountain', obj: fountain };
    else if (peds.length) {
      // the party's choice: a potion likelier when hurt, otherwise a mix
      const hs = heroesAlive(run), hp = hs.reduce((a, h) => a + h.hp / h.maxHp, 0) / hs.length;
      const wt = peds.map((p) => ({ potion: 0.6 + 2 * (1 - hp), xp: 1, coins: 0.9, trinket: 1.1 }[p.reward]));
      let r = rand() * wt.reduce((a, b) => a + b, 0), k = 0; for (; k < wt.length - 1; k++) { r -= wt[k]; if (r <= 0) break; }
      run.task = { type: 'pedestal', obj: peds[k] };
    } else return run.t > 0.6;
    run.task.t = 0;
  }
  const task = run.task, o = task.obj;
  task.t += dt;
  if (task.type === 'fountain') {
    const hs = heroesAlive(run);
    hs.forEach((h, i) => { const a = Math.PI + (i - (hs.length - 1) / 2) * 0.9; h.forcedGoal = { x: o.x + Math.cos(a) * (o.r + h.r + 6), y: o.y + Math.sin(a) * (o.r + h.r + 6) }; });
    if (hs.every((h) => dist(h.x, h.y, o.x, o.y) < o.r + h.r + 30) || task.t > 7) {
      for (const h of hs) { h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.4); h.forcedGoal = null; burst(w, h.x, h.y, '#7FD6F5'); }
      o.used = true; run.task = null; run.t = 2.2;
    }
    return false;
  }
  const h = nearestHero(run, o.x, o.y);
  if (!h) return true;
  h.forcedGoal = { x: o.x, y: o.y };
  if (dist(h.x, h.y, o.x, o.y) < h.r + 26 || task.t > 7) {
    h.forcedGoal = null;
    if (task.type === 'chest') {
      // the lid flies open on an empty chest and the coins spill out all round it (they still have to be picked up)
      o.open = true;
      scatterCoins(w, o.x, o.y, rint(6, 10) + run.depth * 3 + run.floor * 2, 1.15);
      w.shake = Math.max(w.shake, 2);
      if (chance(0.06)) run.gems++; // now and then a chest holds a gem
      if (chance(0.5)) grant(run, pick(['potion', 'potion', 'xp', 'trinket']), h);
    } else {
      grant(run, o.reward, h);
      w.pickups = w.pickups.filter((p) => p.type !== 'pedestal');
    }
    run.task = null; run.t = 2.2;
  }
  return false;
}

function finishRoomHp(run) {
  for (const u of run.world.units) if (u.team === 'hero' && !u.summon && run.heroes[u.kind]) { const hs = run.heroes[u.kind]; hs.hp = u.hp; hs.potions = u.potions; if (u.downed) hs.down = true; }
}

function endFloor(run) {
  if (run.floor >= FLOORS) { run.phase = 'won'; summarize(run); return; }
  run.floor++;
  run.map = makeFloor();
  for (const k of run.party) { const hs = run.heroes[k]; if (hs.down) { hs.down = false; hs.hp = levelHp(DEFS[k].hp, hs.level) * 0.1; } }
  run.banner = { s: 'Floor ' + run.floor, t: 1.8 };
  run.doorK = null;
  run.phase = 'transition'; run.fadeOut = 0; run.newFloor = true;
}

function nextRoom(run) {
  if (run.newFloor) run.newFloor = false;
  else advance(run.map, run.doorK);
  run.doorK = null;
  buildRoom(run);
}

// Leaving (the player taps Leave): the room is finished first, then the run ends as 'retreated'. Between rooms it ends
// straight away. retreat(run, false) changes their mind.
export function retreat(run, on = true) {
  run.leaving = on;
  if (on && run.phase === 'transition') { run.phase = 'retreated'; summarize(run); }
}

// What the camp needs from a finished run (docs/BUILD-v1.md): gold, gems, levels reached, who went down.
export function summarize(run) {
  if (run.summary) return run.summary;
  const levels = {}, downed = [];
  for (const k of run.party) { levels[k] = run.heroes[k].best || run.heroes[k].level; if (run.heroes[k].down) downed.push(k); }
  for (const u of (run.world ? run.world.units : [])) if (u.team === 'hero' && u.downed && !downed.includes(u.kind) && run.heroes[u.kind]) downed.push(u.kind);
  const hp = {}; // how hurt each came out (0-1), for the camp's recovery timers
  for (const k of run.party) { const u = run.world && run.world.units.find((x) => x.kind === k && x.team === 'hero' && !x.summon); const hs = run.heroes[k];
    hp[k] = u ? Math.max(0, u.hp / u.maxHp) : hs.hp != null ? hs.hp / levelHp(DEFS[k].hp, hs.level) : 1; }
  run.summary = { gold: run.coins, gems: run.gems || 0, kills: run.kills, floor: run.floor, rooms: run.rooms, levels, downed, hp, foundTrinkets: run.satchel.slice(), result: run.phase };
  return run.summary;
}
export { LAYERS };
