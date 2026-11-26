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
import { makeWorld, spawn, step, alive, puff, hurt } from './sim.js';
import { DEFS } from './units.js';
import { floorTheme, themeOf, weighted, DUNGEON_ORDER } from './themes.js';
import { battleFoe, spawnHero, rollTrinket, trinketSlots, FOUND_EXTRA, RANK_MULT, R12_MULT, PARTY_SCALE, BOSS_HP, XP_MUL, DUNGEON_RANK, xpScale, placeLevel } from './dungeon.js';
import { buildGrid, segHitsRect } from './path.js';
import { newStats, tallyFoe, finishStats, bankTally, tallyRevive } from './stats.js';
import { addXp, runOptions, applyLoadout, RECOVER_DOWN, RECOVER_HURT, HURT_BELOW, trinketInfo, WIPE_LOSS } from './progress.js';
import { HEROES } from './heroes.js';
import { hooksOf } from './kits.js';
import { freshStatuses } from './statuses.js';
import { CARRY_MAX } from './potions.js';
import { rand, rrange, rint, pick, chance, dist, clamp, angleTo, TAU, INK, OUTLINES, inkFor } from './util.js'; // (round 19, lane looks19: inkFor)
import { paintRoadGround, drawCanopy, lookOf, paintWagon, paintRock } from './convoy-art.js';
export { paintWagon }; // (camp-scene.js parks one at the camp's edge)

// ---------------------------------------------------------------- the numbers
export const THEME = 'wildwood';
// Round 14 (deck v15-book-wagon, card wagon2, the designer): "15% less wide. I want everyone to be like 50% slower."
export const PACE = 0.5;         // everyone on the road moves at half their dungeon speed: heroes, foes, summons (paceTick), and the wagon
export const WAGON_SPEED = 21 * PACE; // px/s (10.5; round 13's was 21)
export const WAGON_HP = 900;
export const STRETCH_LEN = 1500; // road from the start to the gate, a stretch (2300 until round 14: at half speed that was an 11-minute trip, so the road is shorter instead)
export const EDGE = 300;         // the tree line, in from each side: where foes step out into sight (the wood's crowns hang a little past it)
export const ROAD_W = 2385;      // the world across: the open ground between the tree lines is 1785, 15% less than round 13's 2100
export const ROAD_HALF = 105;    // the track itself
export const ACROSS = 1500;      // world units across a portrait phone at the default zoom (render.js reads w.across)
const AHEAD = 600;               // the camera rides this far ahead of the wagon
export const BEHIND = 640;       // the bottom of the screen at the default zoom: gold and the downed are left behind past it
// guarding sides (round 14; guardTick): distances from the wagon's outline (its team included)
export const GUARD = 430;        // a foe this near the wagon is the guards' business
export const VIEW = 620;         // how far a hero on the road looks for something to fight ("maybe lower view distance for party members")
export const LEASH = 640;        // nobody goes further from the wagon than this, whatever they're after
const SAFE = 700;                // nothing this near the wagon (or the hero): free to go for gold further off
const HUNT_AFTER = 6;            // seconds stopped at a gate with foes still near before the guards leave their sides to hunt them
const REACH = 340;               // how far from itself a hero leaves its side for loose gold ("close by"; inside its side: anywhere within the leash)
const GATHER_REACH = 1200;      // gatherers (the hero's data: gatherer: true) go this far from the wagon, and go even mid-fight
export const FLING = 2;          // coins burst this much further from a fallen foe than in a dungeon
export const PAY = 200;          // delivery pay for a wagon in one piece (x its health left)
export const LOSE_CUT = 0.2;     // turned back, or the wagon broken: this share of the trip's gold is lost (the dungeon's 20%)
export { WIPE_LOSS };            // the whole party fell: 75% lost, as a dungeon wipe (round 13 ruling), and nobody rests
export const DELIVER_XP = 60;    // each hero, on delivery
export const GOLD_MUL = 1.1;     // the road's foes carry a little more than the dungeon's (it's a trade route)
const HOLD_BACK = 420; // the wagon waits this far short of the barricade while the end's holders hold it
export const START_X = 700; const RAIDERS = /^(goblin|bandit)/;
// Foes come all the time (round 14: "Enemies to spawn continually instead of set waves... Trickle in + bursts sometimes.
// Have them spawn from all sides"). FLOW: how much comes a second (in the roster's cost points: it starts at `rate` and
// grows by `grow` a second, as round 13's waves grew), the share kept back for the bursts, and how often a burst comes.
export const FLOW = { rate: 0.27, grow: 0.003, burst: 0.5, every: [38, 50], first: [22, 28], two: 0.4 };
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
  team: 'hero', name: 'The Wagon', cargo: true, r: 66, vr: 66, turn: 0, accel: 0, face: 0, mass: 60, hp: WAGON_HP, speed: 0,
  role: 'melee', range: 0, atkCd: 99, dmg: 0, temp: 0.3, commit: 1, noCorpse: true, noElite: true, armor: 3,
  res: { poison: 0, burn: 0.5, chill: 0, shock: 0.5, wet: 0, entangle: 0, stagger: 0, curse: 0, radiance: 0, charm: 0, confuse: 0, sleepy: 0, bleed: 0, fear: 0, shackle: 0 },
  brain: () => true, draw: drawWagon,
};
// Round 14 (the designer: "Give the cart a hit box around all of it. The players are walking through it"): the wagon is
// solid from its tail to the oxen's noses. Its own circle covers the middle of the bed; the rest is a row of circles
// along it and one at each corner of the bed (RIG_PARTS: how far along from the wagon's middle, how big, how far across), each a unit set in place that nobody can
// walk through, heroes or foes. A blow or a status on any of them lands on the wagon (sim.js: u.linkTo, as a chain's
// segments; one blow that catches several counts once), so a foe hits whatever part of it he reaches and nobody has to
// get to the middle. def.rig: nobody's friend to stand by, heal or buff (sim.js allies), and drawn by the wagon itself.
// A blow on one of the body's circles counts for RIG_TAKEN of one on the wagon's middle: the whole body can be hit now,
// by three times as many foes at once as could reach round its one circle, and a swarm (a split slime's brood) would
// have it in seconds (round 14's batch: the wagon broke twice as often at level 3 with every blow at full).
const RIG_TAKEN = 0.6;
const RIG_PARTS = [[-64, 66, 0], [42, 62, 0], [128, 56, 0], [188, 54, 0], [-100, 32, -40], [-100, 32, 40], [50, 30, -38], [50, 30, 38]];
export const RIG = { back: -132, front: 242, half: 72 }; // its box, from the wagon's middle: the tail, the oxen's noses, half its width
DEFS.wagonPart = { ...DEFS.wagon, rig: true, segTaken: RIG_TAKEN, hp: 1e6, draw: () => {} };

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
  // (tools: a crowd of n foes from one side now, e.g. run.send('left', 5); wood: -1 or 1 for which wood, for 'ahead' and 'behind'; kinds: which foes, else the leg's own)
  run.send = (dir, n = 5, wood, kinds) => { const S = legOf(run), T = floorTheme(S.theme, S.floor); return comeFrom(run, kinds || rollKinds(T.enemies, n * 3).slice(0, n), dir, true, { wood }); };
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
  w.convoy = { gate: gateOf(), last: last(run), name: S.name, camp: !last(run), look, key: S.theme };
  w.paintGround = paintRoad; // render.js paints it into the floor's cached picture
  w.drawOver = (ctx, ww, view) => { if (SHOW_SIDES) drawSides(ctx, run); drawCanopy(ctx, ww, view, { EDGE, look, key: ww.convoy.key, from: START_X + AHEAD }); drawDowned(ctx, run, view); drawArrows(ctx, run, view); }; // render.js: over the units
  // round 14: each hero keeps to its own side of the wagon (sim.js asks these two)
  w.pick = (u, o) => pickFor(run, u, o);            // may u go for o, and how much it would rather (guarding sides)
  w.detour = (u, tx, ty) => roundRig(run, u, tx, ty); // the way round the wagon to somewhere on its other side
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
    const chief = battleFoe(w, S.end, bx - 130, mid, (DEFS[S.end].boss ? R12_MULT : RANK_MULT)[rank] * 1.05, 0); // (round 17: a boss isn't priced: the old table)
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
  run.rig = RIG_PARTS.map(([a, r, c]) => { const p = spawn(w, 'wagonPart', START_X + a, mid + c); p.r = p.vr = r; p.at = a; p.off = c; p.linkTo = wg; p.fixed = true; p.aggro = true; p.facing = p.mvA = 0; return p; });
  const spots = [[340, -70], [-40, -190], [-40, 190], [-250, 0], [340, 70]];
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
  run.phase = 'road'; run.t = 0; run.fade = 1; run.stopT = 0; run.hitT = 0; run.lastHp = wg.hp;
  run.flow = { purse: 2.4, saved: 0, burstT: rrange(...FLOW.first), n: 0, bursts: 0, last: null }; run.guardKey = '';
  paceTick(w);
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
  paceTick(w);
  step(w, dt);
  const wg = run.wagon;
  if (!alive(wg) || wg.hp <= 0) { if (!wg.dead) wg.downed = true; return over(run, 'wagon'); }
  const party = heroesUp(run);
  downedTick(run, dt, party);
  if (!party.length && !w.units.some((u) => u.charmed && alive(u))) return over(run, 'party');
  const foes = foesOf(run);
  treeLine(run, dt, foes);
  const seen = foes.filter((e) => !e.ethereal);
  wagonTick(run, dt, seen);
  rigTick(run);
  // the camera rides ahead of the wagon, and leans across towards where the party is
  const py = party.reduce((a, h) => a + h.y, 0) / party.length;
  // ... and towards the fighting, so a tree line comes into view when the fight is there (the ground is wider than the screen)
  const fight = seen.filter((e) => e.aggro && (dist(e.x, e.y, wg.x, wg.y) < 1000 || party.some((h) => dist(e.x, e.y, h.x, h.y) < 600)));
  const fy = fight.length ? 0.3 * py + 0.7 * fight.reduce((a, e) => a + e.y, 0) / fight.length : py;
  w.camAt.x = wg.x + AHEAD; w.camAt.y = MID + clamp(1.0 * (fy - MID), -(ROAD_W / 2 - EDGE), ROAD_W / 2 - EDGE);
  if (run.lean != null) w.camAt.y = MID + run.lean * (ROAD_W / 2 - EDGE); // (tools: hold the camera across, -1 the left wood .. 1 the right)
  w.wp = { x: Math.min(w.W - 80, wg.x + 400), y: wg.y }; // (ahead of the oxen: sim.js spreads the party round it)
  guardTick(run, dt, party);
  coinsTick(run, party, seen);
  // raiders go for the wagon first (they want what's in it): for whichever part of it is nearest them
  for (const e of seen) if (e.raider && dist(e.x, e.y, wg.x, wg.y) < 1400) { let best = wg, bd = dist(e.x, e.y, wg.x, wg.y); for (const p of run.rig) { const d = dist(e.x, e.y, p.x, p.y) + wg.r - p.r; if (d < bd) { bd = d; best = p; } } e.focus = best; e.focusT = 0.5; }
  // the end's holder goes for the party: the wagon is his once they're down
  if (run.chief && alive(run.chief) && party.length) { const c = run.chief; let best = null, bd = Infinity; for (const h of party) { const d = dist(h.x, h.y, c.x, c.y); if (d < bd) { bd = d; best = h; } } c.focus = best; c.focusT = 0.5; }
  // stragglers left far behind give up
  for (const e of foes) if (e.x < wg.x - 1100 && !e.def.boss) { e.dead = true; e.gone = true; }
  // foes keep coming, until the gate is in sight
  if (wg.x < gateOf() - FLOW_END && !run.chiefSeen && !(run.calm > 0)) flowTick(run, dt);
  if (run.calm > 0) run.calm -= dt; // (tools: a quiet spell)
  if (run.chief && !run.chiefSeen && dist(wg.x, wg.y, run.chief.x, run.chief.y) < 1000) { run.chiefSeen = true; run.chief.aggro = true; for (const e of foes) e.aggro = true; }
  if (run.chief && run.chiefDown && run.barricade && !run.barricade.broken) breakBarricade(run);
  // a stand-off at the gate (a shooter kiting round a rock, out past where a guard goes): the guards leave their sides and
  // hunt (HUNT_AFTER: pickFor, guardTick), then the foes press in. No wearing down: "fix the source not the symptom".
  const atGate = wg.x >= (run.barricade && !run.barricade.broken ? run.barricade.x - HOLD_BACK : gateOf()) - 1;
  run.atGateT = atGate ? run.atGateT + dt : 0;
  w.stale = run.atGateT > 40;
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
    const g = e.forcedGoal;
    if (out || e.hideT > 30) { e.hiddenIn = 0; e.ethereal = false; if (g && g.hide) { if (g.march) { g.hide = false; e.marchHp = e.hp; e.marchT = 0; } else e.forcedGoal = null; } }
    else if (g && g.hide) e.target = null;
  }
  // the ones sent round to an end of the wagon walk on to the road there, until they're there, they're hurt, or a hero is close
  for (const e of foes) { const g = e.forcedGoal; if (!g || !g.march || g.hide) continue;
    e.marchT += dt;
    if (e.marchT > 30 || e.hp < e.marchHp || dist(e.x, e.y, g.x, g.y) < 110 || w.units.some((h) => h.team === run.wagon.team && !h.dead && !h.downed && !h.def.cargo && dist(h.x, h.y, e.x, e.y) < 290)) e.forcedGoal = null; }
  const lo = EDGE - 34, hi = H - EDGE + 34, k = Math.min(1, dt * 8);
  for (const u of w.units) {
    if (u.dead || u.hiddenIn || u.def.cargo) continue;
    if (u.y < lo) u.y += (lo - u.y) * k; else if (u.y > hi) u.y += (hi - u.y) * k;
  }
}

// Round 14, "everyone 50% slower": each unit on the road gets its own kind's def with the speed at PACE (one slowed
// copy a kind, shared). A unit made mid-fight (a summon, a split) or one that changes shape (the werewolf) is caught
// the next tick. Only def.speed changes: walking, and every lunge and charge worked out from it. Dungeons aren't touched.
const slowed = new WeakMap();
function paceTick(w) {
  for (const u of w.units) {
    const d = u.def; if (d.paced) continue;
    let s = slowed.get(d); if (!s) { s = { ...d, speed: (d.speed || 0) * PACE, paced: true }; slowed.set(d, s); }
    u.def = s;
  }
}

// The wagon's body (RIG_PARTS) rides with it. The downed don't lie under it: the team shoulders them aside as it rolls
// over where they fell (physics leaves the downed alone, and nobody could stand over them there to get them up).
function rigTick(run) {
  const wg = run.wagon, w = run.world;
  for (const p of run.rig) { p.x = wg.x + p.at; p.y = wg.y + p.off; p.hp = p.maxHp; if (wg.dead) p.dead = true; }
  for (const u of w.units) {
    if (!u.downed || u.dead || u.def.cargo) continue;
    for (const p of [wg, ...run.rig]) {
      const d = dist(u.x, u.y, p.x, p.y), m = p.r + u.r * 0.6;
      if (d < m) { const s = d > 0.01 ? 1 : 0, nx = s ? (u.x - p.x) / d : 0, ny = s ? (u.y - p.y) / d : (u.id % 2 ? 1 : -1); u.x = p.x + nx * m; u.y = p.y + ny * m; }
    }
  }
}
// How far (a, c) (a place, from the wagon's middle: along the road, across it) is from the wagon's outline; 0 inside it.
const rigGap = (a, c) => Math.hypot(Math.max(RIG.back - a, 0, a - RIG.front), Math.max(Math.abs(c) - RIG.half, 0));
// The way round the wagon (sim.js goalVec asks before heading anywhere). The wagon's box, grown by most of u's own
// size, is what u's middle can't cross. If the straight line from u to (tx, ty) crosses it, u makes for a corner
// instead: of the corners it can see, the one that gives the shortest way round (it sees the next from there). A goal
// inside the box (one of the wagon's own circles, a foe pressed to its side) is judged by the nearest place on the box's
// edge, on u's side if two are about as near; so is u itself when it's pressed to the wagon. null: go straight.
function roundRig(run, u, tx, ty) {
  const wg = run.wagon; if (!wg || u.def.cargo) return null;
  const g = Math.max(4, u.r - 6), x0 = wg.x + RIG.back - g, x1 = wg.x + RIG.front + g, y0 = wg.y - RIG.half - g, y1 = wg.y + RIG.half + g, far = 50;
  if ((u.x < x0 - far && tx < x0 - far) || (u.x > x1 + far && tx > x1 + far) || (u.y < y0 - far && ty < y0 - far) || (u.y > y1 + far && ty > y1 + far)) return null;
  const out = (px, py, nx, ny) => { // (px, py) if it's outside the box, else moved out through a face
    if (px <= x0 || px >= x1 || py <= y0 || py >= y1) return [px, py];
    const c = [[x0 - 1, py, px - x0], [x1 + 1, py, x1 - px], [px, y0 - 1, py - y0], [px, y1 + 1, y1 - py]], m = Math.min(c[0][2], c[1][2], c[2][2], c[3][2]);
    let best = c[0], bd = Infinity;
    for (const q of c) if (q[2] < m + 45) { const d = dist(q[0], q[1], nx, ny); if (d < bd) { bd = d; best = q; } }
    return best;
  };
  const [ux, uy] = out(u.x, u.y, tx, ty), [gx, gy] = out(tx, ty, u.x, u.y);
  const box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, cut = (ax, ay, bx, by) => segHitsRect(ax, ay, bx, by, box, -0.5);
  if (!cut(ux, uy, gx, gy)) return null; // (straight at it: a goal inside the wagon is one of its circles, and u stops at that)
  let best = null, bd = Infinity;
  for (const [x, y] of [[x0 - 24, y0 - 24], [x0 - 24, y1 + 24], [x1 + 24, y0 - 24], [x1 + 24, y1 + 24]]) {
    if (cut(ux, uy, x, y)) continue; // (not in plain sight from here)
    const d = dist(u.x, u.y, x, y) + dist(x, y, gx, gy) + (cut(x, y, gx, gy) ? 420 : 0);
    if (d < bd) { bd = d; best = { x, y }; }
  }
  return best;
}

// The wagon rolls at its own pace; it stops while an enemy stands in its way or it's taking heavy blows, at the
// barricade, and at the gate.
function wagonTick(run, dt, foes) {
  const wg = run.wagon, w = run.world;
  const lost = run.lastHp - wg.hp; run.lastHp = wg.hp;
  run.hitT = Math.max(0, run.hitT * Math.exp(-dt / 1.2) + Math.max(0, lost)); // recent damage, fading over a second or so
  if (run.hitT > wg.maxHp * 0.035) run.stopT = Math.max(run.stopT, 0.8);
  run.stopT = Math.max(0, run.stopT - dt);
  const inWay = foes.some((e) => e.x > wg.x + RIG.front - 20 && e.x - e.r < wg.x + RIG.front + 40 && Math.abs(e.y - wg.y) < 58 + e.r); // (in front of the oxen: the team is solid, nobody stands on it)
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

// ---------------------------------------------------------------- guarding sides (round 14)
// The designer: "Have heavy pull towards cart shouldn't run off to opposite side of map. Each hero should try to guard 1
// side, be more attracted to 1 direction instead of everyone rushing 1 direction then the other gets swarmed. Maybe
// lower view distance for party members. Maybe split the area around the cart into large overlapping quadrants and
// hero's will try very hard not to leave their quadrants. 1 hero can only be on positions higher than the bottom of
// cart. Then another only lower than the center of the top of the cart. The 2 more for left and right. A lot of area
// overlaps but there is still a lot of area they won't go."
// So each hero standing has a side. A side is: a region (half the ground, cut along one edge of the wagon: `in` gives
// how far inside it a place is, from the wagon's middle, a along the road and c across it), the way it faces (dir: a
// foe that way is its own first), and a post to stand at when nothing's near (ahead of the oxen, behind the tail, out
// from a flank).
const POST = 120, MID_A = (RIG.back + RIG.front) / 2;
const SIDES = {
  front: { dir: [1, 0], post: [RIG.front + POST, 0], in: (a) => a - RIG.back },            // only higher than the bottom of the cart
  back: { dir: [-1, 0], post: [RIG.back - POST, 0], in: (a) => RIG.front - a },             // only lower than the top of the cart
  left: { dir: [0, -1], post: [MID_A, -RIG.half - POST], in: (a, c) => RIG.half - c },      // only left of its right side
  right: { dir: [0, 1], post: [MID_A, RIG.half + POST], in: (a, c) => c + RIG.half },       // only right of its left side
  // three standing: one ahead, and the two on the flanks stand further back and share the rear between them
  backLeft: { dir: [-0.5, -0.87], post: [-70, -RIG.half - POST], in: (a, c) => RIG.half - c },
  backRight: { dir: [-0.5, 0.87], post: [-70, RIG.half + POST], in: (a, c) => c + RIG.half },
  all: { dir: [1, 0], post: [RIG.front + POST, 0], in: () => 1e6 },                         // one left standing: every side is theirs
};
// who gets which, by how many are standing: the sturdiest first (the front, where the wagon is stopped; with two, the
// flanks), then the flanks, and the last (a healer, if there is one: it stands in close, in reach of everyone) a flank
const SIDE_SETS = [[], ['all'], ['left', 'right'], ['front', 'backLeft', 'backRight'], ['front', 'left', 'back', 'right'], ['front', 'left', 'back', 'right', 'front'], ['front', 'left', 'back', 'right', 'front', 'back']];
const STURDY = { tank: 0, melee: 1, skirmish: 2, ranged: 3, caster: 4, support: 5 };
const sturdy = (u) => STURDY[u.def.heroRole] ?? (u.def.role === 'ranged' ? 3 : 1);
function assignSides(run, party) {
  const order = party.slice().sort((a, b) => sturdy(a) - sturdy(b) || a.id - b.id), set = SIDE_SETS[Math.min(order.length, SIDE_SETS.length - 1)];
  order.forEach((h, i) => {
    h.side = set[i % set.length];
    const S = SIDES[h.side], twin = i >= 4 ? 1 : set.indexOf(h.side) !== set.lastIndexOf(h.side) ? -1 : 0; // (two on one side stand apart)
    const tuck = h.def.heroRole === 'support' && S.post[1] ? 0.5 : 1; // a healer stands in by the wagon, in reach of every post
    h.postAt = [S.post[0] + (S.post[1] ? twin * 90 : 0), S.post[1] ? Math.sign(S.post[1]) * (RIG.half + POST * tuck) : twin * 90];
  });
}
export const sideOf = (u) => u.side || null; // (tools)
// May hero u go for foe o, and how much would it rather? (sim.js chooseTarget asks.) null: no, it's not u's to fight:
// past the edge of u's side, further from the wagon than a guard goes, or further off than u looks. A number: yes, and
// more for a foe on u's own side of the wagon, less for one the others are already on.
function pickFor(run, u, o) {
  const S = u.side && SIDES[u.side]; if (!S || u.team !== run.wagon.team) return 0; // (a summon, a foe that changed sides: as ever)
  if (run.atGateT > HUNT_AFTER) return 0; // (stopped at the gate with foes still about: the sides are off, everyone hunts)
  if (o.chief) return 0; // (the road's end: whoever holds it is everyone's, wherever he stands; the party must be able to take the fight to him)
  const wg = run.wagon, a = o.x - wg.x, c = o.y - wg.y, shooter = u.def.role === 'ranged', reach = shooter ? u.def.range : 50 + (u.def.range || 0);
  const inS = S.in(a, c);
  if (inS < -reach) return null;
  // (a foe just past the edge, pressed to the wagon's far flank: the edge there runs along the wagon itself, so there's nowhere on u's side to strike it from)
  if (inS < 0 && !shooter && (S.dir[1] ? o.x > wg.x + RIG.back - u.r && o.x < wg.x + RIG.front + u.r : Math.abs(c) < RIG.half + u.r)) return null;
  const far = rigGap(a, c), d = dist(u.x, u.y, o.x, o.y);
  if (d > Math.max(VIEW, shooter ? u.def.range + 140 : 0)) return null;
  if (far > GUARD + (shooter ? u.def.range * 0.7 : 0) && !(o.target === u && far < LEASH + reach)) return null; // (it may go out to one that's on it, as far as the leash)
  // its own side first; and not where the others already are (two sides attacked at once: the party splits, it doesn't all go one way)
  const l = Math.hypot(a - MID_A, c) || 1; let there = 0;
  for (const h of run.world.units) if (h !== u && h.side && !h.dead && !h.downed && dist(h.x, h.y, o.x, o.y) < 280) there++;
  return 0.7 * ((a - MID_A) * S.dir[0] + c * S.dir[1]) / l - 0.3 * there;
}
// Each hero's side and post, kept up as the wagon rolls and as who's standing changes; and the edge of its side: a
// hero past it (or past the leash) is eased back, and one well past it walks home to its post. On the way to get a
// friend up or to pick up gold it's let go (convoy's own errands), and comes home after.
function guardTick(run, dt, party) {
  const wg = run.wagon, key = party.map((h) => h.id).join();
  if (key !== run.guardKey) { run.guardKey = key; assignSides(run, party); }
  for (const h of party) {
    const S = SIDES[h.side], post = h.post || (h.post = { x: 0, y: 0 });
    post.x = Math.min(run.world.W - 60, wg.x + h.postAt[0]); post.y = wg.y + h.postAt[1];
    const g = h.forcedGoal;
    if (run.atGateT > HUNT_AFTER) { if (g && g.home) h.forcedGoal = null; continue; } // (hunting at the gate: no edge, no leash)
    if ((g && (g.revive || g.coin)) || (h.target && h.target.chief && !(g && g.home))) continue; // (errands; and going for the road's holder)
    const out = -S.in(h.x - wg.x, h.y - wg.y), far = rigGap(h.x - wg.x, h.y - wg.y) - LEASH, over = Math.max(out, far);
    if (out > 0 && S.dir[0] + S.dir[1] !== 0) { const k = Math.min(out * 3, 80) * dt, n = S.dir[1] ? [0, Math.sign(S.dir[1])] : [Math.sign(S.dir[0]), 0]; h.x += n[0] * k; h.y += n[1] * k; } // back over its edge, square to it
    if (far > 0) { const d = dist(h.x, h.y, wg.x + MID_A, wg.y) || 1, k = Math.min(far * 3, 80) * dt / d; h.x += (wg.x + MID_A - h.x) * k; h.y += (wg.y - h.y) * k; }
    if (over > 70) { h.forcedGoal = { x: post.x, y: post.y, home: true }; h.target = null; }
    else if (g && g.home) { if (over < -40 || dist(h.x, h.y, post.x, post.y) < 70) h.forcedGoal = null; else { g.x = post.x; g.y = post.y; } }
  }
}

// Gold lies where it fell (no fading on the road) and what falls a screen behind the wagon is left behind. Heroes pull
// in what's near them as they fight (sim.js: within 220, when what they fight is further than 240). When nothing
// threatens the wagon or them, the nearest free hero goes for loose gold, the gold about to be left behind first: on
// its own side of the wagon as far as the leash, off its side only for gold close by (REACH; round 14: heroes keep to
// their sides). Gatherers put gold first: they go for it anywhere (GATHER_REACH), even mid-fight unless a foe is on
// them, and come home to their side after.
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
      if (!gatherer(h) && !(dist(h.x, h.y, p.x, p.y) < REACH || (h.side && SIDES[h.side].in(p.x - wg.x, p.y - wg.y) > 0 && rigGap(p.x - wg.x, p.y - wg.y) < LEASH))) continue;
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

// ---------------------------------------------------------------- foes: a trickle, and bursts (round 14)
// The designer: "Enemies to spawn continually instead of set waves. (Can still spawn large waves of enemies, just not
// just waves. Trickle in + bursts sometimes. Have them spawn from all sides." Points come in all the time (FLOW: a
// rate that grows through the stretch, as round 13's waves did, and with each leg). Most are spent as they come: one
// foe (or its pack) at a time, from any side, as soon as the purse covers it. The rest is saved for a burst every half
// minute or so: a crowd at once, from one side or from two at once. Everything still walks out from under the trees:
// from the wood beside the wagon (left, right), from the wood up the road and then down it (ahead), or from the wood
// behind and up after it (behind).
const FLOW_END = 350, DIRS4 = ['ahead', 'left', 'right', 'behind'];
function flowTick(run, dt) {
  const F = run.flow, S = legOf(run), T = floorTheme(S.theme, S.floor);
  const rate = (FLOW.rate + FLOW.grow * run.t + 0.03 * run.stretch) * S.budget * sizeScale(run);
  F.purse += rate * (1 - FLOW.burst) * dt; F.saved += rate * FLOW.burst * dt;
  // the trickle: the next foe is rolled ahead, and comes when the purse covers it; never from the same side twice running
  if (!F.next) F.next = rollKinds(T.enemies, 0.5);
  const cost = F.next.reduce((a, k) => a + (DEFS[k].cost ?? 3), 0);
  if (F.purse >= cost) {
    F.purse -= cost;
    const dir = pick(DIRS4.filter((d) => d !== F.last)); F.last = dir;
    comeFrom(run, F.next, dir); F.next = null;
  }
  // a burst: what's been saved, at once, from one side or from two (opposite ones, or two that meet at a corner)
  F.burstT -= dt;
  if (F.burstT <= 0) {
    F.burstT = rrange(...FLOW.every); F.bursts++;
    const kinds = rollKinds(T.enemies, Math.max(3, F.saved)); F.saved = 0;
    const d0 = pick(DIRS4), two = chance(FLOW.two) && kinds.length >= 4;
    const d1 = two ? (chance(0.6) ? { ahead: 'behind', behind: 'ahead', left: 'right', right: 'left' }[d0] : pick(DIRS4.filter((d) => d !== d0))) : d0;
    if (two) { const h = Math.ceil(kinds.length / 2); comeFrom(run, kinds.slice(0, h), d0, true); comeFrom(run, kinds.slice(h), d1, true); }
    else comeFrom(run, kinds, d0, true);
  }
}
// A group walks in from one side. Each is put under the trees (hidden: treeLine) and given somewhere to walk out to:
// beside the wagon for the flanks; onto the road ahead of it, or behind it, for the other two, so it comes at the
// wagon from that end. `opt.wood`: -1 or 1 to say which wood (tools).
export function comeFrom(run, kinds, dir, burst, opt = {}) {
  const w = run.world, wg = run.wagon, H = w.H, n = run.flow.n++, tEq = run.t / 12; // (tEq: where round 13's wave count would be by now)
  const mult = strength(run, tEq); w.mult = mult;
  const eliteP = Math.min(0.25, 0.04 + 0.025 * run.stretch + 0.012 * tEq), majorP = Math.min(0.05, 0.006 + 0.004 * run.stretch + 0.003 * tEq);
  const wood = opt.wood || (dir === 'left' ? -1 : dir === 'right' ? 1 : chance(0.5) ? -1 : 1);
  const at = dir === 'ahead' ? wg.x + rrange(760, 1050) : dir === 'behind' ? wg.x - rrange(460, 760) : wg.x + (RIG.back + RIG.front) / 2 + rrange(-240, 240);
  const out = [];
  kinds.forEach((k, i) => {
    const r = DEFS[k].r, side = (dir === 'ahead' || dir === 'behind') && burst && i % 3 === 2 ? -wood : wood; // (a crowd from an end: mostly one wood, some from the other)
    const x = clamp(at + rrange(-130, 130) * (burst ? 1.6 : 1), r + 60, w.W - 160);
    const y = side < 0 ? rrange(EDGE - 190, EDGE - 70) : H - rrange(EDGE - 190, EDGE - 70);
    const rank = chance(majorP) ? 2 : chance(eliteP) ? 1 : 0;
    const u = battleFoe(w, k, x, y, mult, rank);
    u.aggro = true; u.coinMul = goldMul(run); u.flinchT = 0.3; u.from = dir;
    u.raider = chance(RAIDERS.test(k) ? 0.5 : 0.15);
    // hidden under the trees until it walks out (treeLine); the ones for an end of the wagon walk on to the road first
    u.hiddenIn = side; u.ethereal = true; u.hideT = 0;
    const end = dir === 'ahead' ? wg.x + RIG.front + rrange(300, 420) : dir === 'behind' ? wg.x + RIG.back - rrange(240, 330) : null;
    u.forcedGoal = end == null ? { x: clamp(x + (wg.x - x) * 0.2 + rrange(-60, 60), 60, w.W - 60), y: side < 0 ? EDGE + 90 : H - EDGE - 90, hide: true }
      : { x: clamp(end, 60, w.W - 60), y: MID + side * rrange(60, 300), hide: true, march: true };
    u.facing = u.mvA = angleTo(x, y, u.forcedGoal.x, u.forcedGoal.y);
    out.push(u);
  });
  return out;
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
  const xp = (u.def.xp || 0) * XP_MUL * Math.sqrt((w.mult || 1) * R12_MULT[DUNGEON_RANK[legOf(run).theme] || 0] / RANK_MULT[DUNGEON_RANK[legOf(run).theme] || 0]) * // (round 17: at the old strength, so the pace holds)
    (u.major ? 7 : u.elite ? 3 : 1) * xpScale(placeLevel(DUNGEON_RANK[legOf(run).theme] || 0, 0.5));
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
  paintRoadGround(g, w, { EDGE, ROAD_HALF, look: C.look });
  w.pillars.forEach((p, i) => { if (p.painted) paintRock(g, p.x, p.y, p.r * 1.05, C.look, i * 13 + 5); });
  const gx = C.gate + 300; // (past the oxen when the wagon stops at the gate)
  const ink = (fn, fill) => { if (OUTLINES) { g.fillStyle = g.strokeStyle = inkFor(fill); /* (round 19, lane looks19) */ g.lineWidth = 4.8; g.lineJoin = 'round'; fn(); g.fill(); g.stroke(); } g.fillStyle = fill; fn(); g.fill(); }; // (round 19, lane toggles19)
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
// ?sides in the address (a picture for checking, not part of the game's look): each standing hero's side drawn on the
// road in its own colour: the edge it won't cross (a dashed line, with ticks on the side it keeps to), its post (a
// ring), a ring under the hero; and in white, how far out the guards go for a foe (GUARD) and the leash.
const SHOW_SIDES = (() => { try { return new URLSearchParams(location.search).has('sides'); } catch { return false; } })();
const SIDE_COL = { front: '#FFD45A', back: '#7FD6F5', left: '#FF8A7A', right: '#B5F07A', backLeft: '#FF8A7A', backRight: '#B5F07A', all: '#FFFFFF' };
const SIDE_EDGE = { front: ['a', RIG.back, 1], back: ['a', RIG.front, -1], left: ['c', RIG.half, -1], backLeft: ['c', RIG.half, -1], right: ['c', -RIG.half, 1], backRight: ['c', -RIG.half, 1] };
function drawSides(ctx, run) {
  const wg = run.wagon; if (!wg) return;
  ctx.save(); ctx.lineCap = 'round';
  const box = (grow, dash) => { ctx.setLineDash(dash); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(wg.x + RIG.back - grow, wg.y - RIG.half - grow, RIG.front - RIG.back + grow * 2, RIG.half * 2 + grow * 2, grow); ctx.stroke(); };
  box(GUARD, [4, 16]); box(LEASH, [22, 18]);
  for (const h of heroesUp(run)) {
    const col = SIDE_COL[h.side] || '#FFFFFF', e = SIDE_EDGE[h.side];
    ctx.strokeStyle = col; ctx.setLineDash([]);
    ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 12, 0, TAU); ctx.stroke();
    if (h.post) { ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(h.post.x, h.post.y, 20, 0, TAU); ctx.stroke(); }
    if (!e) continue;
    const [axis, at, keep] = e, L = 1000;
    ctx.lineWidth = 7; ctx.setLineDash([36, 22]); ctx.beginPath();
    if (axis === 'a') { ctx.moveTo(wg.x + at, wg.y - L); ctx.lineTo(wg.x + at, wg.y + L); } else { ctx.moveTo(wg.x - L, wg.y + at); ctx.lineTo(wg.x + L, wg.y + at); }
    ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 5; ctx.beginPath();
    for (let q = -L + 60; q < L; q += 116) { // ticks on the side it keeps to
      if (axis === 'a') { ctx.moveTo(wg.x + at, wg.y + q); ctx.lineTo(wg.x + at + keep * 34, wg.y + q); } else { ctx.moveTo(wg.x + q, wg.y + at); ctx.lineTo(wg.x + q, wg.y + at + keep * 34); }
    }
    ctx.stroke();
  }
  ctx.restore();
}
// A downed hero carries a ring that runs down as the road carries them towards the bottom of the screen: gold while
// there's time, red and pulsing when they're about to be left behind; the revive's progress fills it in gold-white.
function drawDowned(ctx, run, view) {
  const wg = run.wagon, w = run.world; if (!wg) return;
  // a gatherer on its way to gold: a coin bobbing over its head (so the trait reads)
  for (const u of w.units) {
    if (!u.forcedGoal || !u.forcedGoal.coin || !gatherer(u) || !alive(u)) continue;
    const up = (u.vr + 16 + 3 * Math.sin(w.time * 6)), cx = view && view.rot ? u.x + up : u.x, cy = view && view.rot ? u.y : u.y - up;
    ctx.save(); if (OUTLINES) { ctx.fillStyle = inkFor('#F2C14E'); /* (round 19, lane looks19) */ ctx.beginPath(); ctx.arc(cx, cy, 10, 0, TAU); ctx.fill(); }
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
