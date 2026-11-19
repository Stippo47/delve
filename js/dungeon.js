// Run flow. A dungeon is 3 floors; a floor is a forward-only tree of rooms (map.js) ending in a boss.
// A room is a shape made of screen-sized chunks (strips, boxes, L, T, plus...), so it can run several screens in
// both directions; chunks left out are solid rock. Enemies wait in groups around the room until the party comes
// near, and the party walks the room chunk by chunk before heading for the doors. After a room is cleared the party deals with what's in it (chest, fountain, a choice of
// three things), then picks one of the doors ahead. Heroes keep HP and potions between rooms; downed heroes stay
// down until the floor's boss is beaten, then come back at 10% HP.
import { makeWorld, spawn, step, alive } from './sim.js';
import { DEFS, HERO_ORDER, xpToNext, levelHp, levelDmg, TRINKET_IDS } from './units.js';
import { rand, rrange, rint, pick, chance, dist, clamp, angleTo } from './util.js';
import { buildGrid, circleRect, findPath } from './path.js';
import { makeFloor, nodeAt, nextNodes, chooseDoor, advance, LAYERS } from './map.js';

export const H = 480;
export const FLOORS = 3;

export function newRun(save, depth) {
  const heroes = {};
  for (const k of HERO_ORDER) heroes[k] = { hp: null, down: false, potions: 0 }; // a potion to bring in comes from the camp (stage 3)
  const run = { depth, floor: 1, map: makeFloor(), coins: 0, satchel: [], keys: 0, heroes, phase: 'fight', t: 0, fade: 1, save, kills: 0, banner: null, rooms: 0 };
  buildRoom(run);
  return run;
}

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
const COL_LEN = { one: [800, 1100], fountain: [700, 900], decision: [750, 900] };

function makeShape(kind) {
  const name = pick(KIND_SHAPES[kind] || KIND_SHAPES.fight);
  const rows = SHAPES[name], nr = rows.length, nc = rows[0].length;
  const [a, b] = COL_LEN[kind] || (nc === 1 ? COL_LEN.one : [480, 760]);
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

function enemyPack(w, run, budget, cell, keyChance) {
  const kinds = [];
  while (budget > 0) {
    const roll = rand();
    const k = roll < 0.42 ? 'rat' : roll < 0.72 ? 'slime' : 'skeleton';
    if (k === 'rat') { const n = Math.min(budget, rint(2, 4)); for (let j = 0; j < n; j++) kinds.push('rat'); budget -= n; continue; }
    kinds.push(k); budget -= { slime: 2, skeleton: 3 }[k];
  }
  const keyIdx = chance(keyChance) ? rint(0, kinds.length - 1) : -1;
  const c = inCell(w, cell, 40, 150);
  kinds.forEach((k, i) => {
    const p = placeFree(w, DEFS[k].r, c.x - 150, c.x + 150, Math.max(DEFS[k].r + 20, c.y - 150), Math.min(w.H - DEFS[k].r - 20, c.y + 150));
    const u = spawn(w, k, p.x, p.y, { mult: w.mult, hasKey: i === keyIdx });
    u.facing = u.mvA = angleTo(p.x, p.y, w.doorIn.x, w.doorIn.y); // facing the way the party comes in
  });
  return keyIdx >= 0;
}

function buildRoom(run) {
  const node = nodeAt(run.map);
  const kind = node.kind;
  const sh = makeShape(kind);
  const w = makeWorld(sh.W, sh.H);
  run.world = w; run.node = node; run.rooms++;
  w.cells = sh.cells; w.shape = sh.name;
  for (const c of sh.solid) w.walls.push({ x: c.x, y: c.y, w: c.w, h: c.h, solid: true, c: c.c, r: c.r });
  w.chunks = { nc: sh.nc, nr: sh.nr };
  w.entry = pick(sh.cells.filter((c) => c.c === 0));
  w.exits = sh.cells.filter((c) => c.c === sh.nc - 1);
  w.doorIn = { x: 0, y: centre(w.entry).y };
  const L = node.L;
  w.mult = 1 + 0.22 * (run.depth - 1) + 0.12 * (run.floor - 1) + 0.025 * L;
  const busy = kind === 'fight' || kind === 'hazard' || kind === 'elite';
  if (sh.nr === 1 && sh.nc > 1) { if ((busy && chance(0.75)) || (kind === 'treasure' && chance(0.5))) addWalls(w); }
  else if (busy && sh.cells.length > 2 && chance(0.55)) addBlocks(w);
  // round pillars and hazards
  const np = kind === 'boss' ? 2 : kind === 'fountain' || kind === 'decision' ? 0 : rint(0, 1 + sh.cells.length);
  // pillars keep well clear of walls so they never seal a gap
  for (let i = 0; i < np; i++) { const r = rrange(22, 36); const p = placeFree(w, r + 90, 320, w.W - 300); if (freeSpot(w, p.x, p.y, r + 90)) w.pillars.push({ x: p.x, y: p.y, r }); }
  const nh = kind === 'hazard' ? Math.round(sh.cells.length * 1.6) : kind === 'boss' ? 1 : busy && chance(0.4) ? rint(1, 2) : 0;
  for (let i = 0; i < nh; i++) {
    const type = chance(0.5) ? 'oil' : 'spikes';
    const r = type === 'oil' ? rrange(34, 52) : rrange(24, 34);
    const p = placeFree(w, r, 280, w.W - 240); if (freeSpot(w, p.x, p.y, r)) w.hazards.push({ type, x: p.x, y: p.y, r });
  }
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
  if (kind === 'treasure') { const p = inCell(w, pick(w.exits), 24); w.pickups.push({ type: 'chest', x: p.x, y: p.y, open: false, free: true }); }
  // the party walks the room chunk by chunk: the nearest chunk not yet seen, the way-out chunks last
  w.toVisit = sh.cells.filter((c) => c !== w.entry).map((c) => ({ ...centre(c), exit: c.c === sh.nc - 1 }));
  w.wp = null;
  // heroes come in at the way in (the bottom of the screen in portrait)
  const y0 = w.doorIn.y, ys = [y0, y0 - 60, y0 + 60];
  HERO_ORDER.forEach((k, i) => {
    const hs = run.heroes[k];
    if (hs.down) return;
    const sv = run.save.heroes[k];
    const u = spawn(w, k, 70 + (k === 'knight' ? 40 : 0), ys[i], { level: sv.level, trinket: sv.trinket ? sv.trinket.id : null, hp: hs.hp, potions: hs.potions });
    u.facing = 0; u.mvA = 0;
  });
  // enemies: groups around the room's chunks, waiting
  const far = pick(w.exits);
  if (kind === 'boss') {
    const fc = centre(far);
    const b = spawn(w, 'boss', w.W - 260, fc.y, { mult: w.mult * (run.floor === FLOORS ? 1 : 0.7) }); b.facing = Math.PI;
    for (let i = 0; i < 1 + run.floor + Math.floor(run.depth / 2); i++) { const p = inCell(w, far, 30, 90); const u = spawn(w, 'skeleton', p.x, p.y, { mult: w.mult }); u.facing = Math.PI; }
  } else if (kind === 'fight' || kind === 'hazard' || kind === 'elite' || kind === 'treasure') {
    let homes = sh.cells.filter((c) => c !== w.entry);
    if (!homes.length) homes = [w.entry];
    if (kind === 'treasure') homes = [pick(homes)];
    const total = ((kind === 'treasure' ? 3 : 4 + run.depth * 2 + run.floor * 2) + L * 0.5) * (kind === 'treasure' ? 1 : 0.55 + 0.18 * sh.cells.length);
    let keyed = false;
    for (const cell of homes) {
      if (enemyPack(w, run, Math.max(2, Math.round(total / homes.length * rrange(0.8, 1.25))), cell, kind === 'treasure' ? 0 : 0.18)) keyed = true;
    }
    if (kind === 'elite') {
      const p = inCell(w, far, 40);
      const u = spawn(w, 'skeleton', p.x, p.y, { mult: w.mult * 1.3, scale: 1.25, hpMul: 2.2 }); u.facing = Math.PI; u.elite = true; u.hasKey = true; keyed = true;
    }
    if (keyed && kind !== 'treasure') { const p = inCell(w, pick(homes), 24); w.pickups.push({ type: 'chest', x: p.x, y: p.y, open: false }); }
  }
  w.on.kill = (u) => onKill(run, u);
  w.on.coin = (p) => { run.coins += p.v; };
  w.on.key = () => { run.keys++; };
  w.on.drank = (u) => { run.heroes[u.kind].potions = u.potions; };
  run.phase = 'fight'; run.t = 0; run.fade = 1; run.task = null; run.quietT = 0;
}

// ---------------------------------------------------------------- rewards
const REWARDS = ['potion', 'xp', 'coins', 'trinket'];
function pickRewards(n) { const out = []; const pool = [...REWARDS]; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]); return out; }
export function rollTrinket() { return { id: pick(TRINKET_IDS), uid: Math.floor(rand() * 1e9) }; }

function grant(run, reward, hero) {
  const w = run.world;
  burst(w, hero ? hero.x : w.W / 2, hero ? hero.y : w.H / 2, { potion: '#E0604B', xp: '#FFE14D', coins: '#F2B53A', trinket: '#C9A7FF' }[reward]);
  if (reward === 'potion') {
    const hs = w.units.filter((u) => u.team === 'hero' && alive(u)).sort((a, b) => a.potions - b.potions || a.hp / a.maxHp - b.hp / b.maxHp);
    const h = hs[0]; if (h) { h.potions++; run.heroes[h.kind].potions = h.potions; }
  } else if (reward === 'xp') {
    for (const h of w.units) if (h.team === 'hero' && alive(h)) giveXp(run, h, 30 + 20 * run.depth);
  } else if (reward === 'coins') {
    const n = rint(10, 18) + run.depth * 6;
    for (let i = 0; i < n; i++) w.pickups.push({ type: 'coin', x: hero ? hero.x : w.W / 2, y: hero ? hero.y : w.H / 2, vx: rrange(-120, 120), vy: rrange(-120, 120), v: 1 });
  } else if (reward === 'trinket') {
    run.satchel.push(rollTrinket());
  }
}
function burst(w, x, y, color) { for (let i = 0; i < 18; i++) { const a = rand() * Math.PI * 2; w.particles.push({ x, y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, life: 0.7, max: 0.7, size: 5, color }); } }

function giveXp(run, h, xp) {
  const w = run.world, sv = run.save.heroes[h.kind];
  sv.xp += xp;
  while (sv.xp >= xpToNext(sv.level)) {
    sv.xp -= xpToNext(sv.level); sv.level++;
    const ratio = h.hp / h.maxHp;
    h.maxHp = levelHp(h.def.hp, sv.level); h.hp = Math.min(h.maxHp, h.maxHp * ratio + h.maxHp * 0.25);
    h.dmgMul = levelDmg(1, sv.level); h.level = sv.level;
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; w.particles.push({ x: h.x, y: h.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.6, max: 0.6, size: 4, color: '#FFE14D' }); }
  }
}

function onKill(run, u) {
  run.kills++;
  const xp = Math.round((u.def.xp || 0) * (1 + 0.15 * (run.depth - 1)) * (u.elite ? 3 : 1));
  for (const h of run.world.units) if (h.team === 'hero' && alive(h)) giveXp(run, h, xp);
}

const heroesAlive = (run) => run.world.units.filter((u) => u.team === 'hero' && alive(u));
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
  for (const u of w.units) if (u.team === 'hero' && u.downed) run.heroes[u.kind].down = true;
  if (heroesAlive(run).length === 0) { run.phase = 'lost'; return; }
  const enemies = w.units.filter((u) => u.team === 'enemy' && alive(u));
  // a fight that's gone quiet (someone stuck, a group never met): everyone left comes looking
  if (run.phase === 'fight') {
    if (run.kills !== run.lastKills) { run.lastKills = run.kills; run.quietT = 0; } else run.quietT = (run.quietT || 0) + dt;
    if (run.quietT > 25) for (const e of enemies) e.aggro = true;
  }
  revive(run, dt);
  if (run.phase === 'fight') nextWaypoint(w);
  if (run.phase === 'fight' && enemies.length === 0) {
    w.cleared = true; run.phase = 'loot'; run.t = 0;
    for (const h of heroesAlive(run)) h.target = null;
  }
  if (run.phase === 'loot') { if (doTasks(run, dt)) { run.phase = 'choose'; run.t = 0; } return; }
  if (run.phase === 'choose') {
    if (run.node.kind === 'boss') { finishRoomHp(run); endFloor(run); return; }
    const hs = heroesAlive(run);
    if (run.doorK == null) {
      const hp = hs.reduce((a, h) => a + h.hp / h.maxHp, 0) / HERO_ORDER.length;
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
    if (!helper || threat) { if (helper && helper.forcedGoal && helper.forcedGoal.who === d) helper.forcedGoal = null; d.reviveT = Math.max(0, (d.reviveT || 0) - dt); continue; }
    helper.forcedGoal = { x: d.x, y: d.y, revive: true, who: d }; helper.target = null;
    if (hd < d.r + helper.r + 18) {
      d.reviveT = (d.reviveT || 0) + dt;
      if (Math.random() < dt * 14) w.particles.push({ x: d.x + rrange(-18, 18), y: d.y + rrange(-18, 18), vx: 0, vy: 0, rise: 40, life: 0.6, max: 0.6, size: 4, color: '#FFE7A0' });
      if (d.reviveT >= REVIVE_T) {
        d.downed = false; d.reviveT = 0; d.hp = d.maxHp * REVIVE_HP; d.invulnT = 1.2; d.st = { burn: 0, chill: 0, poison: 0 };
        run.heroes[d.kind].down = false; helper.forcedGoal = null;
        burst(w, d.x, d.y, '#FFE7A0');
      }
    }
  }
}

// Where the party heads when nothing is in sight: the nearest chunk it hasn't walked through yet.
function nextWaypoint(w) {
  const hs = w.units.filter((u) => u.team === 'hero' && alive(u)); if (!hs.length) return;
  let cx = 0, cy = 0; for (const h of hs) { cx += h.x; cy += h.y; } cx /= hs.length; cy /= hs.length;
  w.toVisit = w.toVisit.filter((p) => dist(p.x, p.y, cx, cy) > 170 && !hs.some((h) => dist(p.x, p.y, h.x, h.y) < 90));
  const open = w.toVisit.filter((p) => !p.exit), list = open.length ? open : w.toVisit;
  let best = null, bd = Infinity; for (const p of list) { const d = dist(p.x, p.y, cx, cy); if (d < bd) { bd = d; best = p; } }
  w.wp = best;
}

// After the fight: walk over the coins (they fade), then open the chest, drink from the fountain, take one of three things.
function doTasks(run, dt) {
  const w = run.world;
  const loose = w.pickups.filter((p) => p.type === 'coin' || p.type === 'key');
  // reviving first, but never holding the room up for long (they can still be revived on the way out)
  if (run.t < 25 && w.units.some((u) => u.team === 'hero' && u.downed && !u.dead)) return false;
  if (loose.length && run.t < 30) {
    for (const h of heroesAlive(run)) {
      let best = null, bd = Infinity; for (const p of loose) { const d = dist(p.x, p.y, h.x, h.y); if (d < bd) { bd = d; best = p; } }
      h.forcedGoal = { x: best.x, y: best.y, coin: true };
    }
    return false;
  }
  for (const p of loose) if (p.type === 'key') { run.keys++; p.got = true; } // a key out of reach still counts
  w.pickups = w.pickups.filter((p) => !p.got);
  for (const h of heroesAlive(run)) if (h.forcedGoal && h.forcedGoal.coin) h.forcedGoal = null;
  if (!run.task) {
    const chest = w.pickups.find((p) => p.type === 'chest' && !p.open && (p.free || run.keys > 0));
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
      o.open = true; if (!o.free) run.keys--;
      grant(run, pick(['potion', 'potion', 'xp', 'coins', 'coins', 'trinket']), h);
    } else {
      grant(run, o.reward, h);
      w.pickups = w.pickups.filter((p) => p.type !== 'pedestal');
    }
    run.task = null; run.t = 2.2;
  }
  return false;
}

function finishRoomHp(run) {
  for (const u of run.world.units) if (u.team === 'hero') { const hs = run.heroes[u.kind]; hs.hp = u.hp; hs.potions = u.potions; if (u.downed) hs.down = true; }
}

function endFloor(run) {
  if (run.floor >= FLOORS) { run.phase = 'won'; return; }
  run.floor++;
  run.map = makeFloor();
  for (const k of HERO_ORDER) { const hs = run.heroes[k]; if (hs.down) { hs.down = false; hs.hp = levelHp(DEFS[k].hp, run.save.heroes[k].level) * 0.1; } }
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

export function retreat(run) { run.phase = 'retreated'; }
export { LAYERS };
