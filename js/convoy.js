// The wagon (convoy mode; docs/CONVOY.md). The designer's idea (round 6): "escort a slow wagon upward through biomes
// while enemies come from all sides; the party is ~3x faster than the wagon; camps between stretches ...; gold dropped by
// enemies must be picked up or is left behind; meta progression stays." Round 11 built a try; round 13 (lane W) made it
// from the designer's answers (deck v13-convoy): the ground four times as wide, the camera pulled back, a big wagon and
// ox team, a forest edge the foes walk out from under, no Guard / Gather switch (heroes are smart about gold; gatherer
// heroes put gold first), the downed revivable until they scroll off, the roadside camp a shop spending the trip's gold,
// one trip through several biomes.
// A convoy is a run-shaped object ({ mode: 'convoy', world, phase, ... }) so main.js can step and draw it like a run.
// The road runs along the world's x (up the screen in portrait); the wagon is a unit on the party's side that enemies
// can target like anyone. Sides are never read off team names here: the party's side is whatever the wagon's is.
// Phases: 'road' (a stretch), 'roadside' (the shop between stretches: convoy-ui.js shows it), 'over'.
import { makeWorld, spawn, step, alive, puff } from './sim.js';
import { DEFS } from './units.js';
import { floorTheme, themeOf, weighted, DUNGEON_ORDER } from './themes.js';
import { battleFoe, spawnHero, rollTrinket, trinketSlots, FOUND_EXTRA, RANK_MULT, PARTY_SCALE, BOSS_HP, XP_MUL, DUNGEON_RANK, xpScale, placeLevel } from './dungeon.js';
import { buildGrid } from './path.js';
import { newStats, tallyFoe, finishStats, bankTally, tallyRevive } from './stats.js';
import { addXp, runOptions, applyLoadout, RECOVER_DOWN, RECOVER_HURT, HURT_BELOW, trinketInfo, WIPE_LOSS } from './progress.js';
import { HEROES } from './heroes.js';
import { hooksOf } from './kits.js';
import { freshStatuses } from './statuses.js';
import { CARRY_MAX } from './potions.js';
import { rand, rrange, rint, pick, chance, dist, clamp, angleTo, TAU, INK } from './util.js';
import { paintRoadGround, drawCanopy, edgeLayout, lookOf, paintWagon, paintRock } from './convoy-art.js';
export { paintWagon }; // (camp-scene.js parks one at the camp's edge)

// ---------------------------------------------------------------- the numbers
export const THEME = 'wildwood';
export const WAGON_SPEED = 21;   // px/s (a hero walks ~62: the party is ~3x faster)
export const WAGON_HP = 900;
export const STRETCH_LEN = 2300; // road from the start to the gate, a stretch
export const ROAD_W = 2800;      // the world across (designer: "Bigger arena by like 4x in width")
export const EDGE = 350;         // the canopy's line, in from each side (the wood is 350 deep): the open ground between is 2100 across, ~4x the try's ~530
export const ROAD_HALF = 105;    // the track itself
export const ACROSS = 1500;      // world units across a portrait phone at the default zoom (render.js reads w.across)
const AHEAD = 600;               // the camera rides this far ahead of the wagon
export const BEHIND = 640;       // the bottom of the screen at the default zoom: gold and the downed are left behind past it
export const LEASH = 820;        // a hero further than this from the wagon walks back (unless fighting something near it)
const SAFE = 700;                // nothing this near the wagon (or the hero): free to go for gold further off
const REACH = 1000;              // how far from the wagon heroes go for loose gold when it's safe
const GATHER_REACH = 1200;      // gatherers (the hero's data: gatherer: true) go further, and go even mid-fight
export const FLING = 2;          // coins burst this much further from a fallen foe than in a dungeon
export const PAY = 200;          // delivery pay for a wagon in one piece (x its health left)
export const LOSE_CUT = 0.2;     // turned back, or the wagon broken: this share of the trip's gold is lost (the dungeon's 20%)
export { WIPE_LOSS };            // the whole party fell: 75% lost, as a dungeon wipe (round 13 ruling), and nobody rests
export const DELIVER_XP = 60;    // each hero, on delivery
export const GOLD_MUL = 1.1;     // the road's foes carry a little more than the dungeon's (it's a trade route)
const HOLD_BACK = 420; // the wagon waits this far short of the barricade while the end's holders hold it
export const START_X = 700; const WAVE_GAP = [11, 15], RAIDERS = /^(goblin|bandit)/;
// how hard each leg of the trip is, by its place in it (the try's numbers)
const LEG = [{ mult: 1, budget: 1 }, { mult: 1.2, budget: 1 }, { mult: 1.25, budget: 0.8 }];
// The road's own name for each dungeon's country (the underground ones become the land over them), and its stretches.
export const ROADS = {
  wildwood: { name: 'The Wildwood road', legs: ['The Forest Edge', 'The Old Grove', 'The Bandit Camp'] },
  warren: { name: 'The Warren hills', legs: ['The Burrow Downs', 'The Warren Hills', 'The Rat Hollows'] },
  sewers: { name: "The Sewers' mouth", legs: ['The Outfall', 'The Culverts', 'The Drain Road'] },
  crypt: { name: 'The graveyard road', legs: ['The Yew Walk', 'The Graveyard', 'The Barrow Gate'] },
  frost: { name: 'The frozen pass', legs: ['The Snow Pines', 'The Frozen Pass', 'The Ice Gate'] },
  ember: { name: 'The ashen road', legs: ['The Burnt Wood', 'The Ash Road', 'The Cinder Gate'] },
  spire: { name: "The pilgrims' way", legs: ['The White Crags', "The Pilgrims' Way", 'The Spire Steps'] },
  dunes: { name: 'The dune road', legs: ['The Dune Edge', 'The Dune Road', 'The Oasis Gate'] },
  foundry: { name: 'The slag road', legs: ['The Slag Heaps', 'The Slag Road', 'The Foundry Gate'] },
};
// The roadside shop (it takes only the gold picked up on this trip: never the bank's)
export const SHOP = {
  repair: { name: 'Mend the wagon', price: 30, desc: 'A quarter of its health back.' },
  potion: { name: 'A healing draught', price: 12, desc: 'For whoever has fewest.' },
  trinket: { name: 'A trinket', price: 55, desc: 'Worn for the rest of the trip.' },
  sellsword: { name: 'A sellsword', price: 40, desc: 'Fights with you on the next stretch.' },
};
export const REPAIR = 0.25;

// ---------------------------------------------------------------- the wagon
// A unit with no brain of its own (convoy.js moves it), fixed in place for the physics (others are pushed off it),
// drawn in code (convoy-art.js). def.cargo marks it for the two places in sim.js that must tell it from a hero (no coin
// pickup, heals mend it at a third). Its body circle covers the bed; the ox team is ahead of it.
DEFS.wagon = {
  team: 'hero', name: 'The Wagon', cargo: true, r: 64, vr: 64, turn: 0, accel: 0, face: 0, mass: 60, hp: WAGON_HP, speed: 0,
  role: 'melee', range: 0, atkCd: 99, dmg: 0, temp: 0.3, commit: 1, noCorpse: true, noElite: true, armor: 3,
  res: { poison: 0, burn: 0.5, chill: 0, shock: 0.5, wet: 0, entangle: 0, stagger: 0, curse: 0, radiance: 0 },
  brain: () => true, draw: drawWagon,
};

// ---------------------------------------------------------------- the trip
// Which dungeons' country the road can run through: the Wildwood always; each next one once its boss has been beaten
// (the same rule that opens the dungeon itself... one step behind: its stretches open as it is BEATEN).
export function openLands(save) {
  const out = ['wildwood'];
  for (const id of DUNGEON_ORDER) if (id !== 'wildwood' && ROADS[id] && save.dungeons && save.dungeons[id] && save.dungeons[id].cleared > 0) out.push(id);
  return out;
}
// Three legs from what's open, climbing (the hardest country last); the last ends at a block held by a floor's
// mini-boss and his men (the Wildwood: the Bandit Chief). Only the Wildwood open: its three floors, as the try had.
let planned = null;
export function planTrip(save, force) {
  const open = force || openLands(save);
  let legs;
  if (open.length === 1) legs = [[open[0], 1], [open[0], 3], [open[0], 2]];
  else {
    const last = open[open.length - 1], a = pick(open.slice(0, -1)), b = pick(open);
    legs = [a, b].sort((x, y) => DUNGEON_RANK[x] - DUNGEON_RANK[y]).map((t) => [t, pick([1, 3])]).concat([[last, 2]]);
  }
  planned = legs.map(([theme, floor], i) => {
    const R = ROADS[theme] || ROADS.wildwood, T = themeOf(theme);
    const end = i === 2 ? (T.floors[1] && T.floors[1].mini) || T.warden || 'banditChief' : null;
    return { theme, floor, name: R.legs[floor === 1 ? 0 : floor === 3 ? 1 : 2], land: R.name, ...LEG[i], end };
  });
  return planned;
}
export const plannedTrip = () => planned;

export function convoyParty(save) { return runOptions(save, THEME, {}, 1).party; }
export function newConvoy(save, opts = {}) {
  const ro = runOptions(save, THEME, {}, 1);
  const party = (opts.party || ro.party).filter((k) => HEROES[k]);
  const heroes = {};
  for (const k of party) {
    const sv = (save.heroes && save.heroes[k]) || {};
    const level = Math.max(1, Math.floor(sv.level || 1));
    heroes[k] = { level, xp: sv.xp || 0, gained: 0, from: level, hp: null, maxHp: null, down: false, potions: 0, trinkets: (sv.trinkets || []).slice(), best: level };
  }
  const legs = opts.legs || (planned && !opts.lands ? planned : planTrip(save, opts.lands)); planned = null;
  const run = { mode: 'convoy', theme: legs[0].theme, legs, party, hired: [], heroes, save, stretch: 0, phase: 'road', t: 0, fade: 1, coins: 0, spent: 0, gems: 0,
    dropped: 0, behind: 0, kills: 0, banner: null, satchel: [], depth: 1, floor: 1, rooms: 0, wagonHp: WAGON_HP, wagonMax: WAGON_HP,
    stats: newStats(party), picks: [], bare: !!opts.bare };
  applyLoadout(run, ro); // trinket levels onto the heroes' lists (progress.js)
  if (opts.stretch) run.stretch = Math.min(legs.length - 1, opts.stretch | 0); // testing: start further up the road
  buildStretch(run);
  return run;
}
export const purse = (run) => run.coins - run.spent; // the trip's gold in hand

const legOf = (run) => run.legs[run.stretch];
const strength = (run, n = 0) => RANK_MULT[DUNGEON_RANK[legOf(run).theme] || 0] * (legOf(run).mult + 0.03 * n);
const goldMul = (run) => GOLD_MUL * (1 + 0.15 * run.stretch);
const sizeScale = (run) => PARTY_SCALE[Math.min(4, Math.max(1, run.party.length + run.hired.length)) - 1] || 1;
const gateOf = () => START_X + STRETCH_LEN;
const last = (run) => run.stretch >= run.legs.length - 1;
const MID = ROAD_W / 2;
export const gatherer = (u) => !!(u.def.hero && HEROES[u.def.hero] && HEROES[u.def.hero].gatherer);

function buildStretch(run) {
  const S = legOf(run), T = floorTheme(S.theme, S.floor), look = lookOf(S.theme);
  const W = gateOf() + 700, H = ROAD_W, mid = MID;
  const w = makeWorld(W, H);
  run.world = w; run.rooms++; run.theme = S.theme;
  w.theme = T; w.stats = run.stats; w.mult = strength(run);
  w.across = ACROSS; w.cacheMax = 6e6; w.looseGap = 130; // render.js: how much shows across; the ground's cache size; sim.js: the party's spacing
  // chunks a screen long (dungeon readers expect cells)
  const cells = []; for (let x = 0, i = 0; x < W; x += 480, i++) cells.push({ c: i, r: 0, x, y: 0, w: Math.min(480, W - x), h: H });
  w.cells = cells; w.shape = 'road'; w.chunks = { nc: cells.length, nr: 1 }; w.entry = cells[0]; w.exits = [cells[cells.length - 1]];
  w.doorIn = { x: 0, y: -600 }; w.doors = []; w.toVisit = []; w.wp = null; w.decor = []; // (no way-in arch: render.js draws one at doorIn)
  // rocks out on the open ground, never on the track, never right at the trees' foot
  for (let x = START_X + 250; x < W - 160; x += rrange(230, 420)) {
    const side = chance(0.5) ? -1 : 1, r = rrange(34, 58), // (30+: env.js draws anything smaller as a brazier)
      y = side < 0 ? rrange(EDGE + 110, mid - ROAD_HALF - 90) : rrange(mid + ROAD_HALF + 90, H - EDGE - 110);
    if (w.pillars.some((p) => dist(p.x, p.y, x, y) < p.r + r + 120)) continue;
    w.pillars.push({ x, y, r, painted: true }); // (painted into the ground by convoy-art.js paintRock, not drawn as a prop)
    if (chance(0.4)) { const a = rand() * TAU, r2 = r * rrange(0.55, 0.75); w.pillars.push({ x: x + Math.cos(a) * (r + r2 + 4), y: y + Math.sin(a) * (r + r2 + 4), r: Math.max(31, r2), painted: true }); } // a smaller one leaning on it
  }
  const trees = edgeLayout(W, H, EDGE, look);
  w.convoy = { gate: gateOf(), last: last(run), name: S.name, camp: !last(run), look, trees, key: S.theme + run.stretch };
  w.paintGround = paintRoad; // render.js paints it into the floor's cached picture
  w.drawOver = (ctx, ww, view) => { drawCanopy(ctx, ww, view, { EDGE, look, trees, key: ww.convoy.key }); drawDowned(ctx, run, view); drawArrows(ctx, run, view); }; // render.js: over the units
  // the end of the road: a barricade across the whole open ground (a gap only on the road), held by a floor's
  // mini-boss and his men in front of it
  if (S.end) {
    const bx = gateOf() - 40;
    run.barricade = { x: bx, parts: [] };
    for (let y = EDGE + 10; y <= H - EDGE - 10; y += 46) {
      const gate = Math.abs(y - mid) < ROAD_HALF + 46;
      const p = { x: bx + rrange(-6, 6) + (gate ? 0 : Math.abs(y - mid) * 0.06), y, r: 22, prop: gate ? (chance(0.6) ? 'crate' : 'barrel') : (chance(0.5) ? 'crate' : 'barrel'), barricade: gate };
      w.pillars.push(p); run.barricade.parts.push(p);
    }
    const n = Math.min(4, run.party.length), rank = DUNGEON_RANK[S.theme] || 0;
    const chief = battleFoe(w, S.end, bx - 130, mid, RANK_MULT[rank] * 1.05, 0);
    chief.maxHp = Math.round(chief.maxHp * (BOSS_HP[n - 1] || 1)); chief.hp = chief.maxHp;
    chief.facing = chief.mvA = Math.PI; chief.floorFoe = true; chief.chief = true; chief.coinMul = goldMul(run) * 1.5;
    run.chief = chief;
    const men = S.theme === 'wildwood' ? [['bandit', 1], ['banditDagger', 1], ['banditSpear', 1], ['poacher', 1]] : T.enemies;
    for (let i = 0; i < Math.round(3 * sizeScale(run)); i++) {
      const u = battleFoe(w, weighted(men, rand), bx - rrange(80, 230), mid + rrange(-260, 260), strength(run, 2), chance(0.2) ? 1 : 0);
      u.facing = u.mvA = Math.PI; u.coinMul = goldMul(run);
    }
  } else { run.barricade = null; run.chief = null; }
  buildGrid(w);
  // the wagon, then the party round it
  const wg = spawn(w, 'wagon', START_X, mid);
  wg.maxHp = run.wagonMax; wg.hp = Math.min(run.wagonMax, run.wagonHp); wg.fixed = true; wg.facing = wg.mvA = 0; wg.roll = 0; wg.aggro = true;
  run.wagon = wg;
  const spots = [[60, -150], [60, 150], [-110, -150], [-110, 150], [260, 0]];
  [...run.party, ...run.hired].forEach((k, i) => {
    const hs = run.heroes[k];
    if (hs.out) return; // (left behind on this stretch: waits at the camp; never set at a stretch's start)
    const [dx, dy] = spots[i % spots.length];
    const u = spawnHero(w, run.save, k, hs, START_X + dx, mid + dy, S.theme);
    hs.maxHp = u.maxHp;
    if (hs.hp != null) u.hp = Math.min(u.maxHp, hs.hp);
    if (run.bare) u.potions = 0;
    u.facing = u.mvA = 0;
  });
  w.on.kill = (u) => onKill(run, u);
  w.on.coin = (p) => { run.coins += p.v; };
  w.on.drank = (u) => { const hs = run.heroes[u.kind]; if (hs) hs.potions = u.potions; };
  run.phase = 'road'; run.t = 0; run.fade = 1; run.waveT = 4; run.waveN = 0; run.stopT = 0; run.hitT = 0; run.lastHp = wg.hp;
  run.doneT = 0; run.atGateT = 0; run.banner = { s: S.name, t: 2.2 }; run.chiefSeen = false; run.chiefDown = false;
  run.camAt = w.camAt = { x: START_X + AHEAD, y: mid };
}

// ---------------------------------------------------------------- who's who
const partySide = (run) => run.wagon.team;
const heroesUp = (run) => run.world.units.filter((u) => u.team === partySide(run) && alive(u) && !u.summon && !u.def.cargo && run.heroes[u.kind]);
const foesOf = (run) => run.world.units.filter((u) => u.team !== partySide(run) && u.team !== 'neutral' && alive(u) && !u.def.trap);

// ---------------------------------------------------------------- the stretch
export function updateConvoy(run, dt) {
  const w = run.world;
  run.fade = Math.max(0, run.fade - dt * 2.5);
  if (run.banner) { run.banner.t -= dt; if (run.banner.t <= 0) run.banner = null; }
  if (run.phase === 'roadside') return;
  if (run.phase === 'over') { run.endT += dt; if (run.endT < 1.6) step(w, dt); else if (!run.summary) summarizeConvoy(run); return; }
  if (w.hitstop > 0) { w.hitstop -= dt; return; }
  run.t += dt; run.time = (run.time || 0) + dt;
  step(w, dt);
  const wg = run.wagon;
  if (!alive(wg) || wg.hp <= 0) { if (!wg.dead) wg.downed = true; return over(run, 'wagon'); }
  const party = heroesUp(run);
  downedTick(run, dt, party);
  if (!party.length && !w.units.some((u) => u.charmed && alive(u))) return over(run, 'party');
  const foes = foesOf(run);
  treeLine(run, dt, foes);
  oxTeam(run);
  const seen = foes.filter((e) => !e.ethereal);
  wagonTick(run, dt, seen);
  // the camera rides ahead of the wagon, and leans across towards where the party is
  const py = party.reduce((a, h) => a + h.y, 0) / party.length;
  // ... and towards the fighting, so a tree line comes into view when the fight is there (the ground is wider than the screen)
  const fight = seen.filter((e) => e.aggro && (dist(e.x, e.y, wg.x, wg.y) < 1000 || party.some((h) => dist(e.x, e.y, h.x, h.y) < 600)));
  const fy = fight.length ? 0.3 * py + 0.7 * fight.reduce((a, e) => a + e.y, 0) / fight.length : py;
  w.camAt.x = wg.x + AHEAD; w.camAt.y = MID + clamp(1.0 * (fy - MID), -(ROAD_W / 2 - EDGE), ROAD_W / 2 - EDGE);
  w.wp = { x: Math.min(w.W - 80, wg.x + 400), y: wg.y }; // (ahead of the oxen: sim.js spreads the party round it)
  leash(run, party);
  coinsTick(run, party, seen);
  // raiders go for the wagon first (they want what's in it)
  for (const e of seen) if (e.raider && dist(e.x, e.y, wg.x, wg.y) < 1400) { e.focus = wg; e.focusT = 0.5; }
  // the end's holder goes for the party: the wagon is his once they're down
  if (run.chief && alive(run.chief) && party.length) { const c = run.chief; let best = null, bd = Infinity; for (const h of party) { const d = dist(h.x, h.y, c.x, c.y); if (d < bd) { bd = d; best = h; } } c.focus = best; c.focusT = 0.5; }
  // stragglers left far behind give up
  for (const e of foes) if (e.x < wg.x - 1100 && !e.def.boss) { e.dead = true; e.gone = true; }
  // waves, until the gate is in sight
  if (wg.x < gateOf() - 600 && !run.chiefSeen) { run.waveT -= dt; if (run.waveT <= 0) { spawnWave(run); run.waveT = rrange(...WAVE_GAP) - Math.min(3, 0.3 * run.waveN); } }
  if (run.chief && !run.chiefSeen && dist(wg.x, wg.y, run.chief.x, run.chief.y) < 1000) { run.chiefSeen = true; run.chief.aggro = true; for (const e of foes) e.aggro = true; }
  if (run.chief && run.chiefDown && run.barricade && !run.barricade.broken) breakBarricade(run);
  // a stand-off at the gate (a shooter kiting round a rock): everyone presses in, then the stragglers wear down
  const atGate = wg.x >= (run.barricade && !run.barricade.broken ? run.barricade.x - HOLD_BACK : gateOf()) - 1;
  run.atGateT = atGate ? run.atGateT + dt : 0;
  w.stale = run.atGateT > 40;
  if (run.atGateT > 70) for (const e of foes) if (!e.chief) e.hp -= e.maxHp * 0.03 * dt;
  // the end of the stretch: at the gate, nothing left standing near: gather the gold in reach, then stop for the night
  if (wg.x >= gateOf() - 1 && !seen.some((e) => dist(e.x, e.y, wg.x, wg.y) < 1000)) {
    run.doneT += dt;
    const loose = w.pickups.filter((p) => p.type === 'coin' && !p.homing && dist(p.x, p.y, wg.x, wg.y) < REACH);
    if (run.doneT > 6 || (!loose.length && run.doneT > 1.2)) return stretchDone(run);
  } else run.doneT = 0;
}

// Foes come out from under the trees: a new one walks in hidden (ethereal: nobody can see, target or hit it) until it
// steps out past the canopy's line, then it's in the fight. Once out, nobody goes back in under the trees (a soft wall a
// little inside the line), so nothing fights out of sight.
function treeLine(run, dt, foes) {
  const w = run.world, H = w.H;
  for (const e of foes) if (e.hiddenIn) {
    e.hideT = (e.hideT || 0) + dt;
    const out = e.hiddenIn < 0 ? e.y > EDGE - 12 : e.y < H - EDGE + 12;
    if (out || e.hideT > 16) { e.hiddenIn = 0; e.ethereal = false; if (e.forcedGoal && e.forcedGoal.hide) e.forcedGoal = null; }
    else if (e.forcedGoal && e.forcedGoal.hide) e.target = null;
  }
  const lo = EDGE - 34, hi = H - EDGE + 34, k = Math.min(1, dt * 8);
  for (const u of w.units) {
    if (u.dead || u.hiddenIn || u.def.cargo) continue;
    if (u.y < lo) u.y += (lo - u.y) * k; else if (u.y > hi) u.y += (hi - u.y) * k;
  }
}

// The ox team has a body: nobody stands on the oxen (the wagon's own circle covers the bed). A box from the yoke to
// the oxen's noses; whoever overlaps it is pushed out the shortest way.
const OX = { x0: 70, x1: 240, half: 50 };
function oxTeam(run) {
  const wg = run.wagon, w = run.world, x0 = wg.x + OX.x0, x1 = wg.x + OX.x1, y0 = wg.y - OX.half, y1 = wg.y + OX.half;
  for (const u of w.units) {
    if (u === wg || u.dead || u.ethereal || u.hiddenIn) continue;
    const cx = clamp(u.x, x0, x1), cy = clamp(u.y, y0, y1), dx = u.x - cx, dy = u.y - cy, d = Math.hypot(dx, dy);
    if (d >= u.r) continue;
    if (d > 0.01) { u.x = cx + dx / d * u.r; u.y = cy + dy / d * u.r; }
    else { const up = u.y - y0, dn = y1 - u.y, fw = x1 - u.x; if (fw < Math.min(up, dn)) u.x = x1 + u.r; else if (up < dn) u.y = y0 - u.r; else u.y = y1 + u.r; }
  }
}

// The wagon rolls at its own pace; it stops while an enemy stands in its way or it's taking heavy blows, at the
// barricade, and at the gate.
function wagonTick(run, dt, foes) {
  const wg = run.wagon, w = run.world;
  const lost = run.lastHp - wg.hp; run.lastHp = wg.hp;
  run.hitT = Math.max(0, run.hitT * Math.exp(-dt / 1.2) + Math.max(0, lost)); // recent damage, fading over a second or so
  if (run.hitT > wg.maxHp * 0.035) run.stopT = Math.max(run.stopT, 0.8);
  run.stopT = Math.max(0, run.stopT - dt);
  const inWay = foes.some((e) => e.x > wg.x && e.x - e.r < wg.x + 250 && Math.abs(e.y - wg.y) < 58 + e.r); // (in front of the bed, or the oxen)
  const stopAt = run.barricade && !run.barricade.broken ? run.barricade.x - HOLD_BACK : gateOf();
  const want = inWay || run.stopT > 0 || wg.x >= stopAt ? 0 : WAGON_SPEED;
  wg.spd += clamp(want - wg.spd, -60 * dt, 14 * dt); // it takes a moment to get going, and stops short
  wg.blocked = inWay || run.stopT > 0;
  wg.x = Math.min(stopAt, wg.x + wg.spd * dt); wg.roll += wg.spd * dt;
  // a hard-hit wagon smokes a little
  if (wg.hp < wg.maxHp * 0.35 && rand() < dt * 4) w.particles.push({ x: wg.x + rrange(-40, 40), y: wg.y + rrange(-30, 30), vx: 0, vy: 0, rise: 40, up: 0, life: 1.1, max: 1.1, size: rrange(10, 16), color: 'rgba(90,86,92,0.5)', drag: 0.9 });
  // the last stretch: through the broken barricade and the gate: delivered
  if (run.barricade && run.barricade.broken && wg.x >= gateOf() - 1) { run.delivering = (run.delivering || 0) + dt; if (run.delivering > 1.2 && !foes.some((e) => dist(e.x, e.y, wg.x, wg.y) < 700)) over(run, 'delivered'); }
}

// Nobody strays far: a hero further than LEASH from the wagon walks back towards it (whatever it was chasing), to a
// spot of its own on its side of the wagon, not into a heap on it.
function leash(run, party) {
  const wg = run.wagon, L = LEASH;
  for (const h of party) {
    const d = dist(h.x, h.y, wg.x, wg.y), g = h.forcedGoal;
    if (g && (g.revive || g.coin)) continue;
    const near = h.target && alive(h.target) && dist(h.target.x, h.target.y, wg.x, wg.y) < L; // fighting something by the wagon: let it
    const spot = () => { const k = (L * 0.55) / Math.max(1, d); return { x: wg.x + 60 + (h.x - wg.x) * k, y: wg.y + (h.y - wg.y) * k, leash: true }; };
    if (d > L && !near) { h.forcedGoal = spot(); h.target = null; }
    else if (g && g.leash) { if (d < L * 0.65) h.forcedGoal = null; else h.forcedGoal = spot(); }
  }
}

// Gold lies where it fell (no fading on the road) and what falls a screen behind the wagon is left behind. Heroes pull
// in what's near them as they fight (sim.js: within 220, when what they fight is further than 240). When nothing
// threatens the wagon or them, the nearest free hero goes further for loose gold, the gold about to be left behind
// first. Gatherers put gold first: they go for it further, and even mid-fight unless a foe is on them.
function coinsTick(run, party, foes) {
  const w = run.world, wg = run.wagon;
  let gone = false;
  for (const p of w.pickups) {
    if (p.type !== 'coin') continue;
    if (!p.counted) { p.counted = true; run.dropped += p.v; p.vx *= FLING; p.vy *= FLING; } // (flung wider than in a room)
    p.life = 20; // (sim.js fades coins after 25 s: not on the road)
    if (p.x < wg.x - BEHIND && !p.homing) { p.left = true; gone = true; run.behind += p.v; if (rand() < 0.3) puff(w, p.x, p.y, '#C9B27A', 3, 30, 3, 0.3); }
  }
  if (gone) w.pickups = w.pickups.filter((p) => !p.left);
  const near = (x, y, r) => foes.some((e) => dist(e.x, e.y, x, y) < r);
  const wagonThreat = foes.some((e) => dist(e.x, e.y, wg.x, wg.y) < SAFE || e.target === wg);
  const free = (h) => gatherer(h) ? !near(h.x, h.y, 130) : !wagonThreat && !near(h.x, h.y, 300) && !(h.target && alive(h.target) && dist(h.x, h.y, h.target.x, h.target.y) < 320);
  for (const h of party) { const g = h.forcedGoal; if (g && g.coin && (!w.pickups.includes(g.p) || !free(h))) h.forcedGoal = null; }
  const loose = w.pickups.filter((p) => p.type === 'coin' && !p.homing && !(p.hop > 0) && p.x > wg.x - BEHIND + 40 && p.y > EDGE - 30 && p.y < w.H - EDGE + 30 && dist(p.x, p.y, wg.x, wg.y) < GATHER_REACH)
    .sort((a, b) => a.x - b.x); // (what's about to be left behind first)
  for (const p of loose) {
    if (party.some((h) => h.forcedGoal && h.forcedGoal.coin && dist(h.forcedGoal.p.x, h.forcedGoal.p.y, p.x, p.y) < 120)) continue; // someone's on that patch
    let best = null, bd = Infinity;
    for (const h of party) {
      if (h.forcedGoal || !free(h)) continue;
      if (!gatherer(h) && dist(p.x, p.y, wg.x, wg.y) > REACH) continue;
      const d = dist(h.x, h.y, p.x, p.y) * (gatherer(h) ? 0.5 : 1); // (a gatherer is sent first)
      if (d < bd) { bd = d; best = h; }
    }
    if (best) { best.forcedGoal = { x: p.x, y: p.y, coin: true, p }; best.target = null; }
  }
  for (const h of party) if (h.forcedGoal && h.forcedGoal.coin) { h.forcedGoal.x = h.forcedGoal.p.x; h.forcedGoal.y = h.forcedGoal.p.y; }
}

// The downed lie where they fell and can be revived as in a dungeon (an ally standing over them a few seconds; revive
// abilities work as ever) until they scroll off the bottom of the screen behind the wagon; then they're left behind
// and wait at the next roadside camp (back with 30% health). (The designer: "Makes it so heroes with revival abilities
// aren't useless.")
const REVIVE_T = 3, REVIVE_HP = 0.1;
function downedTick(run, dt, party) {
  const w = run.world, wg = run.wagon, side = partySide(run);
  for (const u of w.units) if (u.revivedByKit) { u.revivedByKit = false; if (run.heroes[u.kind]) run.heroes[u.kind].down = false; } // kits2.js: Valkyrie's Call
  const downed = w.units.filter((u) => u.team === side && u.downed && !u.dead && !u.def.cargo && run.heroes[u.kind]);
  for (const h of party) if (h.forcedGoal && h.forcedGoal.revive && !downed.includes(h.forcedGoal.who)) h.forcedGoal = null;
  for (const d of downed) {
    const hs = run.heroes[d.kind]; hs.down = true;
    // left behind: off the bottom of the screen
    if (d.x < wg.x - BEHIND) {
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; w.particles.push({ x: d.x, y: d.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, rise: 30, up: 0, life: 0.7, max: 0.7, size: 4, color: '#C9C2D0' }); }
      d.dead = true; d.gone = true; hs.hp = 0; hs.potions = d.potions; hs.out = true;
      run.leftBehind = (run.leftBehind || 0) + 1; run.banner = { s: `${HEROES[d.kind] ? HEROES[d.kind].name : 'A hero'} is left behind`, t: 2.4, small: true };
      for (const h of party) if (h.forcedGoal && h.forcedGoal.who === d) h.forcedGoal = null;
      continue;
    }
    const threat = w.units.some((e) => e.team !== side && e.team !== 'neutral' && alive(e) && !e.ethereal && e.aggro && dist(e.x, e.y, d.x, d.y) < 260);
    let helper = null, hd = Infinity;
    for (const h of party) {
      const busy = h.target && dist(h.x, h.y, h.target.x, h.target.y) < 300;
      const dd = dist(h.x, h.y, d.x, d.y);
      if ((!busy || (h.forcedGoal && h.forcedGoal.who === d)) && dd < hd) { hd = dd; helper = h; }
    }
    for (const h of party) if (h !== helper && h.forcedGoal && h.forcedGoal.who === d) h.forcedGoal = null;
    const hunted = helper && w.units.some((e) => e.team !== side && e.team !== 'neutral' && alive(e) && !e.ethereal && e.aggro && dist(e.x, e.y, helper.x, helper.y) < 220);
    if (!helper || threat || hunted) { if (helper && helper.forcedGoal && helper.forcedGoal.who === d) helper.forcedGoal = null; d.reviveT = Math.max(0, (d.reviveT || 0) - dt); continue; }
    helper.forcedGoal = { x: d.x, y: d.y, revive: true, who: d }; helper.target = null;
    if (hd < d.r + helper.r + 18) {
      const rate = Math.max(1, ...hooksOf(helper).map((x) => x.reviveRate || 1));
      d.reviveT = (d.reviveT || 0) + dt * rate; d.reviveHp = Math.max(REVIVE_HP, ...hooksOf(helper).map((x) => x.reviveHp || 0));
      if (rand() < dt * 14) w.particles.push({ x: d.x + rrange(-18, 18), y: d.y + rrange(-18, 18), vx: 0, vy: 0, rise: 40, life: 0.6, max: 0.6, size: 4, color: '#FFE7A0' });
      if (d.reviveT >= REVIVE_T) {
        d.downed = false; d.reviveT = 0; d.hp = d.maxHp * (d.reviveHp || REVIVE_HP); d.invulnT = 1.2; d.st = freshStatuses();
        hs.down = false; helper.forcedGoal = null; tallyRevive(run.stats, helper);
        puff(w, d.x, d.y, '#FFE7A0', 12, 120, 5, 0.5);
      }
    }
  }
}

// ---------------------------------------------------------------- waves
// Every wave walks in from under the trees: ahead on both sides, one side (out of the trees beside the wagon), behind,
// or two at once; each a little bigger than the last. Nothing appears on open ground.
function spawnWave(run) {
  const w = run.world, wg = run.wagon, n = run.waveN++, S = legOf(run), T = floorTheme(S.theme, S.floor), H = w.H;
  const budget = (3.8 + 0.5 * n + 0.8 * run.stretch) * S.budget * sizeScale(run) * rrange(0.9, 1.15);
  const kinds = rollKinds(T.enemies, budget);
  const dirs = n === 0 ? ['ahead'] : (() => { const r = rand(); return r < 0.32 ? ['ahead'] : r < 0.6 ? [pick(['left', 'right'])] : r < 0.75 ? ['behind'] : [pick(['ahead', 'behind']), pick(['left', 'right'])]; })();
  const mult = strength(run, n); w.mult = mult;
  const eliteP = Math.min(0.25, 0.04 + 0.025 * run.stretch + 0.012 * n), majorP = Math.min(0.05, 0.006 + 0.004 * run.stretch + 0.003 * n);
  const sideOf = {}; for (const d of dirs) sideOf[d] = d === 'left' ? -1 : d === 'right' ? 1 : chance(0.5) ? -1 : 1;
  kinds.forEach((k, i) => {
    const dir = dirs[i % dirs.length], r = DEFS[k].r;
    const side = dir === 'left' || dir === 'right' ? sideOf[dir] : (i % 3 === 2 ? -sideOf[dir] : sideOf[dir]); // (ahead and behind: mostly one side, some the other)
    let x = dir === 'ahead' ? wg.x + rrange(650, 1250) : dir === 'behind' ? wg.x - rrange(120, 420) : wg.x + rrange(-150, 850);
    x = clamp(x, r + 60, w.W - 160);
    const y = side < 0 ? rrange(EDGE - 200, EDGE - 80) : H - rrange(EDGE - 200, EDGE - 80);
    const rank = chance(majorP) ? 2 : chance(eliteP) ? 1 : 0;
    const u = battleFoe(w, k, x, y, mult, rank);
    u.aggro = true; u.coinMul = goldMul(run); u.flinchT = 0.3;
    u.raider = chance(RAIDERS.test(k) ? 0.5 : 0.15);
    // hidden under the trees until it walks out (treeLine)
    u.hiddenIn = side; u.ethereal = true; u.hideT = 0;
    u.forcedGoal = { x: clamp(x + (wg.x - x) * 0.2 + rrange(-60, 60), 60, w.W - 60), y: side < 0 ? EDGE + 90 : H - EDGE - 90, hide: true };
    u.facing = u.mvA = angleTo(x, y, u.forcedGoal.x, u.forcedGoal.y);
  });
}
function rollKinds(roster, budget) {
  const out = [];
  for (let guard = 0; budget > 0 && guard < 40; guard++) {
    const k = weighted(roster, rand), c = DEFS[k].cost ?? 3, pk = DEFS[k].pack;
    if (c > budget + 1.5 && out.length) { if (guard > 20) break; continue; }
    const m = pk ? Math.max(1, Math.min(rint(pk[0], pk[1]), Math.ceil(budget / c))) : 1;
    for (let j = 0; j < m; j++) out.push(k);
    budget -= m * c;
  }
  return out;
}

function breakBarricade(run) {
  const w = run.world, b = run.barricade;
  b.broken = true;
  for (const p of b.parts) if (p.barricade) puff(w, p.x, p.y, '#B58B5A', 14, 140, 6, 0.6);
  w.pillars = w.pillars.filter((p) => !p.barricade); // (the gap on the road; the rest of the stockade stands)
  w.shake = Math.max(w.shake, 5);
  buildGrid(w);
}

function onKill(run, u) {
  const w = run.world;
  if (u.def.cargo) return;
  run.kills++; tallyFoe(run.stats, u);
  if (u.def.onDeath) u.def.onDeath(w, u);
  if (u.chief) run.chiefDown = true;
  const xp = (u.def.xp || 0) * XP_MUL * Math.sqrt(w.mult || 1) * (u.major ? 7 : u.elite ? 3 : 1) * xpScale(placeLevel(DUNGEON_RANK[legOf(run).theme] || 0, 0.5));
  if (u.chief) run.gems += 1; // the road's last foe drops a gem, as a floor's does
  // everyone in the party gets it, the downed too (dungeon.js shareXp)
  const up = heroesUp(run);
  for (const k of run.party) giveXp(run, up.find((h) => h.kind === k) || { kind: k, down: true }, xp);
}
function giveXp(run, h, xp) {
  const sv = run.heroes[h.kind];
  if (!sv || sv.merc || h.summon) return;
  const n = addXp(sv, xp); if (!n) return;
  sv.gained += n; sv.best = Math.max(sv.best, sv.level); h.level = sv.level;
  if (h.down) return;
  const w = run.world;
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; w.particles.push({ x: h.x, y: h.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.6, max: 0.6, size: 4, color: '#FFE14D' }); }
}

// ---------------------------------------------------------------- between stretches: the roadside camp, a shop
function keepHp(run) {
  for (const u of run.world.units) if (!u.def.cargo && !u.summon && run.heroes[u.kind] && u.team === partySide(run)) {
    const hs = run.heroes[u.kind]; hs.maxHp = u.maxHp; hs.potions = u.potions;
    if (u.downed || u.dead) hs.down = true; else hs.hp = u.hp;
  }
  run.wagonHp = Math.max(0, run.wagon.hp);
  (run.hpLog || (run.hpLog = []))[run.stretch] = run.wagonHp / run.wagonMax;
}
function stretchDone(run) {
  keepHp(run);
  if (last(run)) return over(run, 'delivered');
  run.phase = 'roadside';
  // the night's rest: the downed (and the left behind, who walk in to the fire) are back at 30%, everyone mends a quarter
  run.waiting = [];
  for (const k of [...run.party, ...run.hired]) {
    const hs = run.heroes[k], max = hs.maxHp || 100;
    if (hs.out) run.waiting.push(k);
    if (hs.down || hs.out) { hs.down = false; hs.out = false; hs.hp = max * 0.3; } else hs.hp = Math.min(max, (hs.hp ?? max) + max * 0.25);
  }
  run.hired = []; // a sellsword was for one stretch
  run.shop = { trinket: !run.bare && run.party.some((k) => roomFor(run, k)) ? rollTrinket() : null, bought: [] };
  run.offer = Object.keys(SHOP); // (older readers)
}
const roomFor = (run, k) => run.heroes[k] && run.heroes[k].trinkets.length < trinketSlots(run, k) + FOUND_EXTRA;
const mercKind = (run) => ['knight', 'rogue'].find((k) => !run.party.includes(k) && DEFS[k]);
// Can this be bought now? null if so, else why not (for the shop's greyed lines).
export function cantBuy(run, item) {
  if (run.phase !== 'roadside') return 'not now';
  const it = SHOP[item]; if (!it) return 'no such thing';
  if (purse(run) < it.price) return 'not enough gold from this trip';
  if (item === 'repair' && run.wagonHp >= run.wagonMax - 1) return 'the wagon is whole';
  if (item === 'potion' && (run.bare || !run.party.some((k) => run.heroes[k].potions < CARRY_MAX))) return 'every pack is full';
  if (item === 'trinket' && (!run.shop.trinket || run.shop.bought.includes('trinket'))) return run.shop.trinket ? 'sold' : 'nobody has room';
  if (item === 'sellsword' && (run.hired.length || !mercKind(run))) return run.hired.length ? 'hired' : 'nobody for hire';
  return null;
}
// Buy one thing at the roadside with the trip's gold. Returns what it gave, or null.
export function buy(run, item) {
  if (cantBuy(run, item)) return null;
  const it = SHOP[item], got = { choice: item, price: it.price };
  run.spent += it.price; run.shop.bought.push(item);
  if (item === 'repair') { const before = run.wagonHp; run.wagonHp = Math.min(run.wagonMax, run.wagonHp + run.wagonMax * REPAIR); got.amount = Math.round(run.wagonHp - before); }
  else if (item === 'potion') { const k = run.party.filter((h) => run.heroes[h].potions < CARRY_MAX).sort((a, b) => run.heroes[a].potions - run.heroes[b].potions)[0]; run.heroes[k].potions++; got.hero = k; }
  else if (item === 'trinket') {
    const k = run.party.filter((h) => roomFor(run, h)).sort((a, b) => run.heroes[a].trinkets.length - run.heroes[b].trinkets.length)[0];
    const t = run.shop.trinket; run.heroes[k].trinkets.push(t.id); run.satchel.push(t); got.hero = k; got.id = t.id; got.name = trinketInfo(t.id).name;
  } else if (item === 'sellsword') {
    const k = mercKind(run);
    run.hired = [k]; run.heroes[k] = { level: 1, xp: 0, hp: null, down: false, potions: 0, trinkets: [], best: 1, merc: true }; got.kind = k;
  }
  run.picks.push(got);
  return got;
}
// What a sensible player buys (the headless tools and clips): mend a wagon under 60%, a draught for an empty pack,
// keep the rest.
export function autoShop(run) {
  for (let i = 0; i < 4 && run.wagonHp < run.wagonMax * 0.6 && buy(run, 'repair'); i++);
  for (let i = 0; i < 4 && run.party.some((k) => !run.heroes[k].potions) && purse(run) > 50 && buy(run, 'potion'); i++);
}
// On to the next stretch.
export function setOff(run) {
  if (run.phase !== 'roadside') return false;
  run.stretch++;
  buildStretch(run);
  return true;
}
// (the try's one-pick call, kept for old callers: buy it if it can be bought, then set off)
export function takeChoice(run, choice) { const got = choice && buy(run, choice); setOff(run); return got; }

// ---------------------------------------------------------------- the end
function over(run, result) {
  if (run.phase === 'over') return;
  if (run.phase === 'road') keepHp(run);
  run.phase = 'over'; run.result = result; run.endT = 0;
  if (result === 'delivered') { run.banner = { s: 'Delivered', t: 2.5 }; for (const k of run.party) { const h = run.world.units.find((u) => u.kind === k && !u.summon && alive(u)); const xp = DELIVER_XP * xpScale(placeLevel(DUNGEON_RANK[legOf(run).theme] || 0, 0.5)); if (h) giveXp(run, h, xp); else addXp(run.heroes[k], xp); } }
}
// The flag button: turn back (the trip's gold, less the cut; no pay).
export function turnBack(run) { if (run.phase === 'over' || run.summary) return; over(run, 'turned'); run.endT = 9; summarizeConvoy(run); }

export function summarizeConvoy(run) {
  if (run.summary) return run.summary;
  const delivered = run.result === 'delivered', wiped = run.result === 'party';
  const health = run.wagonMax ? clamp(run.wagonHp / run.wagonMax, 0, 1) : 0;
  const pay = delivered ? Math.round(PAY * health) : 0;
  const kept = purse(run), lossPct = delivered ? 0 : wiped ? WIPE_LOSS : LOSE_CUT;
  const cut = Math.ceil(kept * lossPct);
  const hp = {}, heroes = {}, downed = [];
  for (const k of run.party) {
    const hs = run.heroes[k], u = run.world && run.world.units.find((x) => x.kind === k && !x.summon && !x.def.cargo && !x.gone && !x.dead);
    if (hs.down || hs.out || (u && u.downed)) downed.push(k);
    hp[k] = u ? Math.max(0, u.hp / u.maxHp) : hs.hp != null && hs.maxHp ? hs.hp / hs.maxHp : 1;
    heroes[k] = { level: hs.level, xp: hs.xp, gained: hs.gained || 0, from: hs.from || hs.level };
  }
  const left = run.world ? run.world.pickups.filter((p) => p.type === 'coin').reduce((a, p) => a + p.v, 0) : 0;
  run.summary = { convoy: true, result: run.result, delivered, wiped, lossPct, stretch: run.stretch + 1, stretches: run.legs.length, legs: run.legs.map((l) => l.name), land: run.legs[run.legs.length - 1].land,
    health, pay, cut, picked: run.coins, spent: run.spent, dropped: run.dropped, behind: run.behind + (delivered ? 0 : left), gold: kept - cut + pay, gems: run.gems || 0,
    kills: run.kills, time: run.time || 0, heroes, downed, hp, picks: run.picks.slice(), stats: finishStats(run.stats) };
  return run.summary;
}
// What a finished trip changes in the save: gold (and the gem), heroes' levels, XP and points, rest for the hurt
// (none after a wipe, as in a dungeon), lifetime stats. No checkpoints, slots or dungeons.
export function applyConvoy(save, run, now = Date.now()) {
  const s = summarizeConvoy(run);
  save.gold += Math.max(0, Math.floor(s.gold));
  save.gems = (save.gems || 0) + s.gems;
  const heroes = [];
  for (const id of run.party) {
    const h = save.heroes[id]; if (!h) continue;
    const rh = s.heroes[id], from = h.level;
    if (rh && rh.level >= from) { h.level = rh.level; h.xp = rh.xp; }
    const gained = h.level - from;
    h.points = (h.points || 0) + gained; h.best = Math.max(h.best || 1, h.level);
    const downed = s.downed.includes(id), hurt = !downed && s.hp[id] != null && s.hp[id] < HURT_BELOW;
    if ((downed || hurt) && !s.wiped) h.recoverUntil = Math.max(h.recoverUntil || 0, now + (downed ? RECOVER_DOWN : RECOVER_HURT));
    heroes.push({ id, from, level: h.level, xp: h.xp, gained, points: h.points, downed: downed && !s.wiped, hurt: hurt && !s.wiped });
  }
  bankTally(save, s.stats);
  return { ...s, heroes };
}

// ---------------------------------------------------------------- drawing
// The ground, painted once into the floor's cached picture (render.js floor): convoy-art.js paints the meadow, the
// road, the shaded verge and what grows at the trees' foot; here, the gate at the top (a roadside camp past it, or the
// town's arch).
function paintRoad(g, w) {
  const H = w.H, mid = H / 2, C = w.convoy;
  paintRoadGround(g, w, { EDGE, ROAD_HALF, look: C.look, trees: C.trees });
  w.pillars.forEach((p, i) => { if (p.painted) paintRock(g, p.x, p.y, p.r * 1.05, C.look, i * 13 + 5); });
  const gx = C.gate + 300; // (past the oxen when the wagon stops at the gate)
  const ink = (fn, fill) => { g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 4.8; g.lineJoin = 'round'; fn(); g.fill(); g.stroke(); g.fillStyle = fill; fn(); g.fill(); };
  ink(() => { g.beginPath(); g.rect(gx - 11, mid - ROAD_HALF - 60, 22, ROAD_HALF * 2 + 120); }, C.last ? '#8A6A4A' : '#7A5A3C');
  for (const s of [-1, 1]) ink(() => { g.beginPath(); g.arc(gx, mid + s * (ROAD_HALF + 60), 20, 0, TAU); }, '#6E4A30');
  if (C.last) { // the town: a banner on the beam
    ink(() => { g.beginPath(); g.rect(gx - 40, mid - 34, 40, 68); }, '#B8423A');
    g.fillStyle = '#F2C14E'; g.beginPath(); g.arc(gx - 20, mid, 10, 0, TAU); g.fill();
  } else { // the roadside camp past the gate: a fire and a tent on the verge
    const fx0 = gx + 200, fy = mid + ROAD_HALF + 110;
    ink(() => { g.beginPath(); g.arc(fx0, fy, 22, 0, TAU); }, '#5A4A3A');
    g.fillStyle = '#FF9A3D'; g.beginPath(); g.arc(fx0, fy, 12, 0, TAU); g.fill(); g.fillStyle = '#FFE08A'; g.beginPath(); g.arc(fx0, fy, 6, 0, TAU); g.fill();
    ink(() => { g.beginPath(); g.moveTo(fx0 + 50, fy - 80); g.lineTo(fx0 + 130, fy - 80); g.lineTo(fx0 + 138, fy - 4); g.lineTo(fx0 + 42, fy - 4); g.closePath(); }, '#3F5578');
    g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(fx0 + 90, fy - 82); g.lineTo(fx0 + 90, fy - 2); g.stroke();
  }
}
// A downed hero carries a ring that runs down as the road carries them towards the bottom of the screen: gold while
// there's time, red and pulsing when they're about to be left behind; the revive's progress fills it in gold-white.
function drawDowned(ctx, run, view) {
  const wg = run.wagon, w = run.world; if (!wg) return;
  // a gatherer on its way to gold: a coin bobbing over its head (so the trait reads)
  for (const u of w.units) {
    if (!u.forcedGoal || !u.forcedGoal.coin || !gatherer(u) || !alive(u)) continue;
    const up = (u.vr + 16 + 3 * Math.sin(w.time * 6)), cx = view && view.rot ? u.x + up : u.x, cy = view && view.rot ? u.y : u.y - up;
    ctx.save(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFE9A0'; ctx.beginPath(); ctx.arc(cx + (view && view.rot ? 2 : -2), cy - 2, 2.6, 0, TAU); ctx.fill(); ctx.restore();
  }
  for (const u of w.units) {
    if (!u.downed || u.dead || u.def.cargo || !run.heroes[u.kind] || u.team !== wg.team) continue;
    const left = clamp((u.x - (wg.x - BEHIND)) / 560, 0, 1), late = left < 0.35, R = u.vr * 1.7 + 8;
    ctx.save(); ctx.lineCap = 'round';
    ctx.globalAlpha = late ? 0.65 + 0.35 * Math.sin(w.time * 11) : 0.9;
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = late ? '#FF6B5A' : '#F2C14E'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, Math.max(0.05, left) * TAU); ctx.stroke();
    if (u.reviveT > 0) { ctx.strokeStyle = '#FFF6D8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(u.x, u.y, R - 7, 0, TAU * Math.min(1, u.reviveT / REVIVE_T)); ctx.stroke(); }
    ctx.restore();
  }
}
// A wave coming from off screen: an arrow at the screen's edge pointing at it (one for each bunch), pulsing, in the
// warning red. Drawn in screen space; render.js keeps the HUD's padding in view.padT / padB.
function drawArrows(ctx, run, view) {
  const wg = run.wagon, w = run.world; if (!wg || !view || !view.m) return;
  const m = view.m, cw = view.cw, ch = view.ch, top = (view.padT || 100) + 18, bot = ch - (view.padB || 140) - 18, lft = 18, rgt = cw - 18;
  const marks = [];
  for (const e of w.units) {
    if (e.team === wg.team || e.team === 'neutral' || e.dead || e.downed || !e.aggro) continue;
    const sx = m[0] * e.x + m[2] * e.y + m[4], sy = m[1] * e.x + m[3] * e.y + m[5];
    if (sx > lft - 6 && sx < rgt + 6 && sy > top - 6 && sy < bot + 6) continue; // on screen (hidden under the trees or not)
    const cx = cw / 2, cy = (top + bot) / 2, dx = sx - cx, dy = sy - cy;
    const k = Math.min((rgt - cx) / Math.max(1e-3, Math.abs(dx)), (bot - cy) / Math.max(1e-3, Math.abs(dy)));
    const px = cx + dx * k, py = cy + dy * k;
    if (marks.some((q) => Math.hypot(q.x - px, q.y - py) < 46)) continue;
    marks.push({ x: px, y: py, a: Math.atan2(dy, dx) });
  }
  if (!marks.length) return;
  const d = view.dpr, pulse = 0.75 + 0.25 * Math.sin(w.time * 7);
  ctx.save(); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineJoin = 'round';
  for (const q of marks) {
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.scale(pulse, pulse);
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -12); ctx.lineTo(-3, 0); ctx.lineTo(-8, 12); ctx.closePath();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#FF6B5A'; ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function drawWagon(ctx, u) {
  ctx.save(); ctx.translate(u.x, u.y);
  paintWagon(ctx, { roll: u.roll || 0, hurt: 1 - u.hp / u.maxHp, flash: u.flashT > 0.06 });
  ctx.restore();
}
