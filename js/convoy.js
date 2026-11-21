// The wagon (convoy mode, round 11: a try; docs/CONVOY.md). The designer's idea (round 6): "escort a slow wagon upward
// through biomes while enemies come from all sides; the party is ~3x faster than the wagon; camps between stretches ...;
// gold dropped by enemies must be picked up or is left behind; meta progression stays."
// A convoy is a run-shaped object ({ mode: 'convoy', world, phase, ... }) so main.js can step and draw it like a run.
// The road runs along the world's x (up the screen in portrait); the wagon is a unit on the party's side that enemies
// can target like anyone. Sides are never read off team names here: the party's side is whatever the wagon's is.
// Phases: 'road' (a stretch), 'roadside' (the stop between stretches: convoy-ui.js shows the choice), 'over'.
import { makeWorld, spawn, step, alive, puff } from './sim.js';
import { DEFS } from './units.js';
import { floorTheme, weighted } from './themes.js';
import { battleFoe, spawnHero, rollTrinket, trinketSlots, FOUND_EXTRA, RANK_MULT, PARTY_SCALE, BOSS_HP, XP_MUL } from './dungeon.js';
import { buildGrid } from './path.js';
import { newStats, tallyFoe, finishStats, bankTally } from './stats.js';
import { addXp, runOptions, applyLoadout, RECOVER_DOWN, RECOVER_HURT, HURT_BELOW, trinketInfo } from './progress.js';
import { HEROES } from './heroes.js';
import { rand, rrange, rint, pick, chance, dist, clamp, angleTo, TAU, INK } from './util.js';

// ---------------------------------------------------------------- the numbers
export const THEME = 'wildwood';
export const WAGON_SPEED = 21;   // px/s (a hero walks ~62: the party is ~3x faster)
export const WAGON_HP = 900;
export const STRETCH_LEN = 2300; // road from the start to the gate, a stretch
export const ROAD_W = 600;       // the world across (a screen and a bit)
export const ROAD_HALF = 74;     // the track itself
// The player's one say (the HUD's toggle): 'guard' keeps the party close and only sends someone for gold when nothing is
// near the wagon; 'gather' lets them roam further and run for gold even while the wagon is under attack.
export const STANCE = {
  guard: { leash: 320, reach: 330, safe: 420 },
  gather: { leash: 560, reach: 640, safe: 0 },
};
export const LEASH = STANCE.guard.leash;
export const BEHIND = 430;       // gold this far behind the wagon (off the bottom of the screen) is left behind
export const PAY = 200;          // delivery pay for a wagon in one piece (x its health left)
export const LOSE_CUT = 0.2;     // lost or turned back: this share of the gold picked up is lost (the dungeon's 20%)
export const DELIVER_XP = 60;    // each hero, on delivery
export const GOLD_MUL = 1.1;     // the road's foes carry a little more than the dungeon's (it's a trade route)
const HOLD_BACK = 380; // the wagon waits this far short of the barricade while the Chief's men hold it
const START_X = 260, WAVE_GAP = [11, 15], RAIDERS = /^(goblin|bandit)/;
// the three stretches: the Wildwood's floors (their enemies and looks), the hardest roster last but one; the road
// ends at the Bandit Chief's barricade
export const STRETCHES = [
  { floor: 1, name: 'The Forest Edge', mult: 1, budget: 1 },
  { floor: 3, name: 'The Old Grove', mult: 1.2, budget: 1 },
  { floor: 2, name: 'The Bandit Camp', mult: 1.25, budget: 0.8, end: 'banditChief' }, // (bandits come cheap and many, and most go for the wagon)
];
export const CHOICES = {
  repair: { name: 'Mend the wagon', desc: 'Back up by a third of its health.' },
  potions: { name: 'A potion each', desc: 'A healing draught for every hero.' },
  trinket: { name: 'A trinket', desc: 'Worn for the rest of the trip.' },
  sellsword: { name: 'A sellsword', desc: 'Fights with you on the next stretch.' },
};

// ---------------------------------------------------------------- the wagon
// A unit with no brain of its own (convoy.js moves it), fixed in place for the physics (others are pushed off it),
// drawn in code. def.cargo marks it for the two places in sim.js that must tell it from a hero (no coin pickup, heals
// mend it at a third).
DEFS.wagon = {
  team: 'hero', name: 'The Wagon', cargo: true, r: 40, vr: 40, turn: 0, accel: 0, face: 0, mass: 40, hp: WAGON_HP, speed: 0,
  role: 'melee', range: 0, atkCd: 99, dmg: 0, temp: 0.3, commit: 1, noCorpse: true, noElite: true, armor: 3,
  res: { poison: 0, burn: 0.5, chill: 0, shock: 0.5, wet: 0, entangle: 0, stagger: 0, curse: 0, radiance: 0 },
  brain: () => true, draw: drawWagon,
};

// ---------------------------------------------------------------- a new trip
// save: the camp's. The party is the one at the fire (resting heroes stay behind), as for a dungeon.
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
  const run = { mode: 'convoy', theme: THEME, party, hired: [], heroes, save, stretch: 0, phase: 'road', t: 0, fade: 1, coins: 0, gems: 0,
    dropped: 0, behind: 0, kills: 0, banner: null, satchel: [], depth: 1, floor: 1, rooms: 0, wagonHp: WAGON_HP, wagonMax: WAGON_HP,
    stats: newStats(party), picks: [], stance: opts.stance || 'guard', bare: !!opts.bare, choose: opts.choose || null };
  applyLoadout(run, ro); // trinket levels onto the heroes' lists (progress.js)
  if (opts.stretch) run.stretch = Math.min(STRETCHES.length - 1, opts.stretch | 0); // testing: start further up the road
  buildStretch(run);
  return run;
}

const strength = (run, n = 0) => RANK_MULT[0] * (STRETCHES[run.stretch].mult + 0.03 * n);
const goldMul = (run) => GOLD_MUL * (1 + 0.15 * run.stretch);
const sizeScale = (run) => PARTY_SCALE[Math.min(4, Math.max(1, run.party.length + run.hired.length)) - 1] || 1;
const gateOf = () => START_X + STRETCH_LEN;
const last = (run) => run.stretch >= STRETCHES.length - 1;

function buildStretch(run) {
  const S = STRETCHES[run.stretch], T = floorTheme(THEME, S.floor);
  const W = gateOf() + 700, H = ROAD_W, mid = H / 2;
  const w = makeWorld(W, H);
  run.world = w; run.rooms++;
  w.theme = T; w.stats = run.stats; w.mult = strength(run);
  // chunks a screen long, so the floor dressing spreads along the whole road
  const cells = []; for (let x = 0, i = 0; x < W; x += 480, i++) cells.push({ c: i, r: 0, x, y: 0, w: Math.min(480, W - x), h: H });
  w.cells = cells; w.shape = 'road'; w.chunks = { nc: cells.length, nr: 1 }; w.entry = cells[0]; w.exits = [cells[cells.length - 1]];
  w.doorIn = { x: 0, y: mid }; w.doors = []; w.toVisit = []; w.wp = null;
  // rocks along the verges, never on the track
  for (let x = 330; x < W - 120; x += rrange(150, 300)) {
    const side = chance(0.5) ? -1 : 1, r = rrange(26, 40), y = side < 0 ? rrange(40, mid - ROAD_HALF - 70) : rrange(mid + ROAD_HALF + 70, H - 40);
    if (!w.pillars.some((p) => dist(p.x, p.y, x, y) < p.r + r + 60)) w.pillars.push({ x, y, r });
  }
  // dressing off the track
  w.decor = [];
  for (const c of cells) for (const [type, per] of T.props) {
    const n = Math.floor(per) + (chance(per % 1) ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const x = rrange(c.x + 30, c.x + c.w - 30), y = rrange(30, H - 30);
      if (Math.abs(y - mid) < ROAD_HALF + 14 || w.pillars.some((p) => dist(x, y, p.x, p.y) < p.r + 26)) continue;
      w.decor.push({ type, x, y, a: rand() * TAU, s: rrange(0.8, 1.2), v: rint(0, 2) });
    }
  }
  w.convoy = { gate: gateOf(), last: last(run), name: S.name, camp: !last(run), clumps: clumps(W, H) };
  w.paintGround = paintRoad; // render.js paints it into the floor's cached picture
  // the end of the road: the Bandit Chief's barricade across it, his men in front of it
  if (S.end) {
    const bx = gateOf() - 40;
    run.barricade = { x: bx, parts: [] };
    for (let y = mid - ROAD_HALF - 40; y <= mid + ROAD_HALF + 40; y += 46) { const p = { x: bx + rrange(-6, 6), y, r: 22, prop: chance(0.6) ? 'crate' : 'barrel', barricade: true }; w.pillars.push(p); run.barricade.parts.push(p); }
    const n = Math.min(4, run.party.length);
    const chief = battleFoe(w, S.end, bx - 110, mid, RANK_MULT[0] * 1.05, 0); // (about as strong as on the Bandit Camp floor)
    chief.maxHp = Math.round(chief.maxHp * (BOSS_HP[n - 1] || 1)); chief.hp = chief.maxHp;
    chief.facing = chief.mvA = Math.PI; chief.floorFoe = true; chief.chief = true; chief.coinMul = goldMul(run) * 1.5;
    run.chief = chief;
    for (let i = 0; i < Math.round(3 * sizeScale(run)); i++) {
      const k = pick(['bandit', 'banditDagger', 'banditSpear', 'poacher']);
      const u = battleFoe(w, k, bx - rrange(70, 190), mid + rrange(-170, 170), strength(run, 2), chance(0.2) ? 1 : 0);
      u.facing = u.mvA = Math.PI; u.coinMul = goldMul(run);
    }
  } else { run.barricade = null; run.chief = null; }
  buildGrid(w);
  // the wagon, then the party round it
  const wg = spawn(w, 'wagon', START_X, mid);
  wg.maxHp = run.wagonMax; wg.hp = Math.min(run.wagonMax, run.wagonHp); wg.fixed = true; wg.facing = wg.mvA = 0; wg.roll = 0; wg.aggro = true;
  run.wagon = wg;
  const spots = [[-70, -100], [-70, 100], [-150, 0], [-150, -110], [-150, 110]];
  [...run.party, ...run.hired].forEach((k, i) => {
    const hs = run.heroes[k];
    const [dx, dy] = spots[i % spots.length];
    const u = spawnHero(w, run.save, k, hs, START_X + dx, mid + dy, THEME);
    hs.maxHp = u.maxHp;
    if (hs.hp != null) u.hp = Math.min(u.maxHp, hs.hp);
    if (run.bare) u.potions = 0;
    u.facing = u.mvA = 0;
  });
  w.on.kill = (u) => onKill(run, u);
  w.on.coin = (p) => { run.coins += p.v; };
  w.on.drank = (u) => { const hs = run.heroes[u.kind]; if (hs) hs.potions = u.potions; };
  run.phase = 'road'; run.t = 0; run.fade = 1; run.waveT = 3.5; run.waveN = 0; run.stopT = 0; run.hitT = 0; run.lastHp = wg.hp;
  run.doneT = 0; run.atGateT = 0; run.banner = { s: S.name, t: 2.2 };
  run.camAt = w.camAt = { x: START_X + 110, y: mid };
}
// undergrowth along the two edges (painted, no collision): where the side waves come out of the trees
function clumps(W, H) {
  const out = [];
  for (let x = -20; x < W + 40; x += rrange(26, 46)) for (const side of [-1, 1]) out.push({ x, y: side < 0 ? rrange(-6, 22) : H - rrange(-6, 22), r: rrange(18, 34), k: rand() });
  return out;
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
  carryDowned(run, dt);
  const party = heroesUp(run);
  if (!party.length && !w.units.some((u) => u.charmed && alive(u))) return over(run, 'party');
  const foes = foesOf(run);
  wagonTick(run, dt, foes);
  // the camera rides a little ahead of the wagon; the party heads there when nothing's in sight
  w.camAt.x = wg.x + 110; w.camAt.y = ROAD_W / 2 + clamp(party.reduce((a, h) => a + h.y, 0) / party.length - ROAD_W / 2, -90, 90) * 0.4;
  w.wp = { x: Math.min(w.W - 80, wg.x + 250), y: wg.y }; // (ahead of the ox, not on it)
  leash(run, party);
  coinsTick(run, party, foes);
  // raiders go for the wagon first (they want what's in it)
  for (const e of foes) if (e.raider && dist(e.x, e.y, wg.x, wg.y) < 700) { e.focus = wg; e.focusT = 0.5; }
  // the Chief goes for the party: the wagon is his once they're down
  if (run.chief && alive(run.chief) && party.length) { const c = run.chief; let best = null, bd = Infinity; for (const h of party) { const d = dist(h.x, h.y, c.x, c.y); if (d < bd) { bd = d; best = h; } } c.focus = best; c.focusT = 0.5; }
  // stragglers left far behind give up
  for (const e of foes) if (e.x < wg.x - 1000 && !e.def.boss) { e.dead = true; e.gone = true; }
  // waves, until the gate is in sight
  if (wg.x < gateOf() - 380 && !run.chiefSeen) { run.waveT -= dt; if (run.waveT <= 0) { spawnWave(run); run.waveT = rrange(...WAVE_GAP) - Math.min(3, 0.3 * run.waveN); } }
  if (run.chief && !run.chiefSeen && dist(wg.x, wg.y, run.chief.x, run.chief.y) < 720) { run.chiefSeen = true; run.chief.aggro = true; for (const e of foes) e.aggro = true; }
  if (run.chief && run.chiefDown && run.barricade && !run.barricade.broken) breakBarricade(run);
  // a stand-off at the gate (a shooter kiting round a rock): everyone presses in, then the stragglers wear down
  const atGate = wg.x >= (run.barricade && !run.barricade.broken ? run.barricade.x - HOLD_BACK : gateOf()) - 1;
  run.atGateT = atGate ? run.atGateT + dt : 0;
  w.stale = run.atGateT > 40;
  if (run.atGateT > 70) for (const e of foes) if (!e.chief) e.hp -= e.maxHp * 0.03 * dt;
  // the end of the stretch: at the gate, nothing left standing near: gather the gold in reach, then stop for the night
  if (wg.x >= gateOf() - 1 && !foes.some((e) => dist(e.x, e.y, wg.x, wg.y) < 900)) {
    run.doneT += dt;
    const loose = w.pickups.filter((p) => p.type === 'coin' && !p.homing && dist(p.x, p.y, wg.x, wg.y) < 700);
    if (run.doneT > 5 || (!loose.length && run.doneT > 1.2)) return stretchDone(run);
  } else run.doneT = 0;
}

// The wagon rolls at its own pace; it stops while an enemy stands in its way or it's taking heavy blows, at the
// barricade, and at the gate.
function wagonTick(run, dt, foes) {
  const wg = run.wagon, w = run.world;
  const lost = run.lastHp - wg.hp; run.lastHp = wg.hp;
  run.hitT = Math.max(0, run.hitT * Math.exp(-dt / 1.2) + Math.max(0, lost)); // recent damage, fading over a second or so
  if (run.hitT > wg.maxHp * 0.035) run.stopT = Math.max(run.stopT, 0.8);
  run.stopT = Math.max(0, run.stopT - dt);
  const inWay = foes.some((e) => e.x > wg.x && e.x - e.r < wg.x + wg.r + 30 && Math.abs(e.y - wg.y) < wg.r * 0.85 + e.r);
  const stopAt = run.barricade && !run.barricade.broken ? run.barricade.x - HOLD_BACK : gateOf();
  const want = inWay || run.stopT > 0 || wg.x >= stopAt ? 0 : WAGON_SPEED;
  wg.spd += clamp(want - wg.spd, -60 * dt, 14 * dt); // it takes a moment to get going, and stops short
  wg.blocked = inWay || run.stopT > 0;
  wg.x = Math.min(stopAt, wg.x + wg.spd * dt); wg.roll += wg.spd * dt;
  // a hard-hit wagon smokes a little
  if (wg.hp < wg.maxHp * 0.35 && rand() < dt * 4) w.particles.push({ x: wg.x + rrange(-20, 20), y: wg.y + rrange(-14, 14), vx: 0, vy: 0, rise: 40, up: 0, life: 1.1, max: 1.1, size: rrange(7, 12), color: 'rgba(90,86,92,0.5)', drag: 0.9 });
  // the last stretch: through the broken barricade and the gate: delivered
  if (run.barricade && run.barricade.broken && wg.x >= gateOf() - 1) { run.delivering = (run.delivering || 0) + dt; if (run.delivering > 1.2 && !foes.some((e) => dist(e.x, e.y, wg.x, wg.y) < 600)) over(run, 'delivered'); }
}

// Nobody strays far: a hero further than LEASH from the wagon walks back to it (whatever it was chasing).
const stance = (run) => STANCE[run.stance] || STANCE.guard;
function leash(run, party) {
  const wg = run.wagon, L = stance(run).leash;
  for (const h of party) {
    const d = dist(h.x, h.y, wg.x, wg.y), g = h.forcedGoal;
    const near = h.target && alive(h.target) && dist(h.target.x, h.target.y, wg.x, wg.y) < L; // fighting something by the wagon: let it
    if (d > L && !near && !(g && g.coin && d < L + 120)) { h.forcedGoal = { x: wg.x + 40, y: wg.y + clamp(h.y - wg.y, -110, 110), leash: true }; h.target = null; }
    else if (g && g.leash) { if (d < 210) h.forcedGoal = null; else { g.x = wg.x + 40; } }
  }
}

// Gold lies where it fell (no fading on the road). Heroes pull in what's near them as ever; when nothing threatens the
// wagon, the nearest free hero runs for loose gold in reach. What falls a screen behind the wagon is left behind.
function coinsTick(run, party, foes) {
  const w = run.world, wg = run.wagon;
  let gone = false;
  for (const p of w.pickups) {
    if (p.type !== 'coin') continue;
    if (!p.counted) { p.counted = true; run.dropped += p.v; }
    p.life = 20; // (sim.js fades coins after 25 s: not on the road)
    if (p.x < wg.x - BEHIND && !p.homing) { p.left = true; gone = true; run.behind += p.v; if (rand() < 0.3) puff(w, p.x, p.y, '#C9B27A', 3, 30, 3, 0.3); }
  }
  if (gone) w.pickups = w.pickups.filter((p) => !p.left);
  const S = stance(run), threat = S.safe > 0 && foes.some((e) => dist(e.x, e.y, wg.x, wg.y) < S.safe || (e.target && e.target === wg));
  for (const h of party) if (h.forcedGoal && h.forcedGoal.coin && (threat || !w.pickups.includes(h.forcedGoal.p))) h.forcedGoal = null;
  if (threat) return;
  const loose = w.pickups.filter((p) => p.type === 'coin' && !p.homing && !(p.hop > 0) && p.x > wg.x - BEHIND + 30 && dist(p.x, p.y, wg.x, wg.y) < S.reach);
  for (const p of loose) {
    if (party.some((h) => h.forcedGoal && h.forcedGoal.coin && dist(h.forcedGoal.p.x, h.forcedGoal.p.y, p.x, p.y) < 120)) continue; // someone's on that patch
    let best = null, bd = Infinity;
    for (const h of party) { if (h.forcedGoal || (h.target && dist(h.x, h.y, h.target.x, h.target.y) < (S.safe ? 300 : 170))) continue; const d = dist(h.x, h.y, p.x, p.y); if (d < bd) { bd = d; best = h; } }
    if (best) { best.forcedGoal = { x: p.x, y: p.y, coin: true, p }; best.target = null; }
  }
  for (const h of party) if (h.forcedGoal && h.forcedGoal.coin) { h.forcedGoal.x = h.forcedGoal.p.x; h.forcedGoal.y = h.forcedGoal.p.y; }
}

// A downed hero is lifted onto the wagon and rides out the stretch (back at the roadside camp with 30% health).
function carryDowned(run, dt) {
  const w = run.world, wg = run.wagon;
  for (const u of w.units) {
    if (!u.downed || u.dead || u.def.cargo || u.summon || !run.heroes[u.kind]) continue;
    const hs = run.heroes[u.kind]; hs.down = true; hs.hp = 0;
    u.carryT = (u.carryT || 0) + dt;
    if (u.carryT < 1.4) continue;
    for (let i = 0; i < 12; i++) { const k = i / 12; w.particles.push({ x: u.x + (wg.x - u.x) * k, y: u.y + (wg.y - u.y) * k, vx: 0, vy: 0, rise: 30, up: 0, life: 0.5 + k * 0.4, max: 0.9, size: 3.5, color: '#FFE7A0' }); }
    u.dead = true; u.gone = true; hs.potions = u.potions;
    wg.riders = (wg.riders || 0) + 1;
  }
}

// ---------------------------------------------------------------- waves
// From ahead, a side (out of the trees), behind, or two at once; each a little bigger than the last.
function spawnWave(run) {
  const w = run.world, wg = run.wagon, n = run.waveN++, T = floorTheme(THEME, STRETCHES[run.stretch].floor), mid = ROAD_W / 2;
  const budget = (3 + 0.35 * n + 0.8 * run.stretch) * STRETCHES[run.stretch].budget * sizeScale(run) * rrange(0.9, 1.15);
  const kinds = rollKinds(T.enemies, budget);
  const dirs = n === 0 ? ['ahead'] : (() => { const r = rand(); return r < 0.32 ? ['ahead'] : r < 0.6 ? [pick(['left', 'right'])] : r < 0.75 ? ['behind'] : [pick(['ahead', 'behind']), pick(['left', 'right'])]; })();
  const mult = strength(run, n); w.mult = mult;
  const eliteP = Math.min(0.25, 0.04 + 0.025 * run.stretch + 0.012 * n), majorP = Math.min(0.05, 0.006 + 0.004 * run.stretch + 0.003 * n);
  kinds.forEach((k, i) => {
    const dir = dirs[i % dirs.length], r = DEFS[k].r;
    let x, y;
    if (dir === 'ahead') { x = wg.x + rrange(600, 760); y = mid + rrange(-190, 190); }
    else if (dir === 'behind') { x = wg.x - rrange(430, 520); y = mid + rrange(-170, 170); }
    else { x = wg.x + rrange(-120, 360); y = dir === 'left' ? r + rrange(6, 30) : ROAD_W - r - rrange(6, 30); }
    x = clamp(x, r + 10, w.W - r - 10);
    for (let t = 0; t < 10 && w.pillars.some((p) => dist(p.x, p.y, x, y) < p.r + r + 8); t++) x += 40;
    const rank = chance(majorP) ? 2 : chance(eliteP) ? 1 : 0;
    const u = battleFoe(w, k, x, y, mult, rank);
    u.aggro = true; u.coinMul = goldMul(run); u.facing = u.mvA = angleTo(x, y, wg.x, wg.y); u.flinchT = 0.3;
    u.raider = chance(RAIDERS.test(k) ? 0.5 : 0.15);
    if (dir === 'left' || dir === 'right') puff(w, x, y, '#5E7A3A', 8, 70, 6, 0.5);
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
  for (const p of b.parts) puff(w, p.x, p.y, '#B58B5A', 14, 140, 6, 0.6);
  w.pillars = w.pillars.filter((p) => !p.barricade);
  w.shake = Math.max(w.shake, 5);
  buildGrid(w);
}

function onKill(run, u) {
  const w = run.world;
  if (u.def.cargo) return;
  run.kills++; tallyFoe(run.stats, u);
  if (u.def.onDeath) u.def.onDeath(w, u);
  if (u.chief) run.chiefDown = true;
  const xp = Math.round((u.def.xp || 0) * XP_MUL * Math.sqrt(w.mult || 1) * (u.major ? 7 : u.elite ? 3 : 1));
  if (u.chief) run.gems += 1; // the road's last foe drops a gem, as a floor's does
  for (const h of heroesUp(run)) giveXp(run, h, xp);
}
function giveXp(run, h, xp) {
  const sv = run.heroes[h.kind];
  if (!sv || sv.merc || h.summon) return;
  const n = addXp(sv, xp); if (!n) return;
  sv.gained += n; sv.best = Math.max(sv.best, sv.level); h.level = sv.level;
  const w = run.world;
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; w.particles.push({ x: h.x, y: h.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.6, max: 0.6, size: 4, color: '#FFE14D' }); }
}

// ---------------------------------------------------------------- between stretches
function keepHp(run) {
  for (const u of run.world.units) if (!u.def.cargo && !u.summon && run.heroes[u.kind] && u.team === partySide(run)) {
    const hs = run.heroes[u.kind]; hs.maxHp = u.maxHp; hs.potions = u.potions;
    if (u.downed || u.dead && !u.gone) hs.down = true; else if (!u.dead) hs.hp = u.hp;
  }
  run.wagonHp = Math.max(0, run.wagon.hp);
  (run.hpLog || (run.hpLog = []))[run.stretch] = run.wagonHp / run.wagonMax;
}
function stretchDone(run) {
  keepHp(run);
  if (last(run)) return over(run, 'delivered');
  run.phase = 'roadside';
  // the night's rest: the downed are back at 30%, everyone mends a quarter
  for (const k of [...run.party, ...run.hired]) {
    const hs = run.heroes[k], max = hs.maxHp || 100;
    if (hs.down) { hs.down = false; hs.hp = max * 0.3; } else hs.hp = Math.min(max, (hs.hp ?? max) + max * 0.25);
  }
  run.hired = []; // a sellsword was for one stretch
  run.offer = offerFor(run);
}
export function offerFor(run) {
  const can = { repair: true, potions: !run.bare, trinket: !run.bare && run.party.some((k) => roomFor(run, k)), sellsword: !!mercKind(run) };
  const pool = Object.keys(CHOICES).filter((c) => can[c]);
  const out = [];
  if (run.wagonHp < run.wagonMax * 0.5) out.push('repair');
  while (out.length < 3 && pool.some((c) => !out.includes(c))) { const c = pick(pool.filter((x) => !out.includes(x))); out.push(c); }
  return out;
}
const roomFor = (run, k) => run.heroes[k] && run.heroes[k].trinkets.length < trinketSlots(run, k) + FOUND_EXTRA;
const mercKind = (run) => ['knight', 'rogue'].find((k) => !run.party.includes(k) && DEFS[k]);
// The player's pick at the roadside (or the headless tool's); then on to the next stretch. Returns what it gave.
export function takeChoice(run, choice) {
  if (run.phase !== 'roadside') return null;
  let got = { choice };
  if (choice === 'repair') { const before = run.wagonHp; run.wagonHp = Math.min(run.wagonMax, run.wagonHp + run.wagonMax * 0.35); got.amount = Math.round(run.wagonHp - before); }
  else if (choice === 'potions') { for (const k of run.party) run.heroes[k].potions++; }
  else if (choice === 'trinket') {
    const k = run.party.filter((h) => roomFor(run, h)).sort((a, b) => run.heroes[a].trinkets.length - run.heroes[b].trinkets.length)[0];
    if (k) { const it = rollTrinket(); run.heroes[k].trinkets.push(it.id); run.satchel.push(it); got.hero = k; got.id = it.id; got.name = trinketInfo(it.id).name; }
  } else if (choice === 'sellsword') {
    const k = mercKind(run);
    if (k) { run.hired = [k]; run.heroes[k] = { level: 1, xp: 0, hp: null, down: false, potions: 0, trinkets: [], best: 1, merc: true }; got.kind = k; }
  }
  run.picks.push(got);
  run.stretch++;
  buildStretch(run);
  return got;
}

// ---------------------------------------------------------------- the end
function over(run, result) {
  if (run.phase === 'over') return;
  if (run.phase === 'road') keepHp(run);
  run.phase = 'over'; run.result = result; run.endT = 0;
  if (result === 'delivered') { run.banner = { s: 'Delivered', t: 2.5 }; for (const k of run.party) { const h = run.world.units.find((u) => u.kind === k && !u.summon && alive(u)); if (h) giveXp(run, h, DELIVER_XP); else addXp(run.heroes[k], DELIVER_XP); } }
}
export function setStance(run, s) { if (STANCE[s]) run.stance = s; }
// The flag button: turn back (the gold picked up, less the cut; no pay).
export function turnBack(run) { if (run.phase === 'over' || run.summary) return; over(run, 'turned'); run.endT = 9; summarizeConvoy(run); }

export function summarizeConvoy(run) {
  if (run.summary) return run.summary;
  const delivered = run.result === 'delivered';
  const health = run.wagonMax ? clamp(run.wagonHp / run.wagonMax, 0, 1) : 0;
  const pay = delivered ? Math.round(PAY * health) : 0;
  const cut = delivered ? 0 : Math.ceil(run.coins * LOSE_CUT);
  const hp = {}, heroes = {}, downed = [];
  for (const k of run.party) {
    const hs = run.heroes[k], u = run.world && run.world.units.find((x) => x.kind === k && !x.summon && !x.def.cargo && !x.gone && !x.dead);
    if (hs.down || (u && u.downed)) downed.push(k);
    hp[k] = u ? Math.max(0, u.hp / u.maxHp) : hs.hp != null && hs.maxHp ? hs.hp / hs.maxHp : 1;
    heroes[k] = { level: hs.level, xp: hs.xp, gained: hs.gained || 0, from: hs.from || hs.level };
  }
  const left = run.world ? run.world.pickups.filter((p) => p.type === 'coin').reduce((a, p) => a + p.v, 0) : 0;
  run.summary = { convoy: true, result: run.result, delivered, stretch: run.stretch + 1, stretches: STRETCHES.length, health, pay, cut, picked: run.coins,
    dropped: run.dropped, behind: run.behind + (delivered ? 0 : left), gold: run.coins - cut + pay, gems: run.gems || 0, kills: run.kills, time: run.time || 0,
    heroes, downed, hp, picks: run.picks.slice(), stats: finishStats(run.stats) };
  return run.summary;
}
// What a finished trip changes in the save: gold (and the gem), heroes' levels, XP and points, rest for the hurt,
// lifetime stats. No checkpoints, slots or dungeons.
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
    if (downed || hurt) h.recoverUntil = Math.max(h.recoverUntil || 0, now + (downed ? RECOVER_DOWN : RECOVER_HURT));
    heroes.push({ id, from, level: h.level, xp: h.xp, gained, points: h.points, downed, hurt });
  }
  bankTally(save, s.stats);
  return { ...s, heroes };
}

// ---------------------------------------------------------------- drawing
// The road, painted once into the floor's cached picture (render.js floor): a dirt track with wheel ruts up the
// middle, undergrowth along both edges, the gate at the top (a roadside camp past it, or the town's arch).
function paintRoad(g, w) {
  const H = w.H, mid = H / 2, C = w.convoy;
  // the track: a soft darker rim, the dirt, ruts
  g.fillStyle = 'rgba(70,58,34,0.22)'; g.fillRect(-60, mid - ROAD_HALF - 10, w.W + 120, ROAD_HALF * 2 + 20);
  g.fillStyle = '#B49B6C'; g.fillRect(-60, mid - ROAD_HALF, w.W + 120, ROAD_HALF * 2);
  g.fillStyle = 'rgba(255,240,200,0.10)'; g.fillRect(-60, mid - ROAD_HALF * 0.45, w.W + 120, ROAD_HALF * 0.9);
  for (const dy of [-30, 30]) { g.fillStyle = 'rgba(90,70,40,0.32)'; g.fillRect(-60, mid + dy - 5, w.W + 120, 10); g.fillStyle = 'rgba(60,46,26,0.25)'; g.fillRect(-60, mid + dy - 1.5, w.W + 120, 3); }
  // pebbles and tufts on the track's edges (fixed by position, so the cache is the same each time)
  for (let x = 0; x < w.W; x += 23) {
    const k = Math.abs(Math.sin(x * 12.9898) * 43758.5453) % 1, side = k < 0.5 ? -1 : 1;
    const y = mid + side * (ROAD_HALF - 4 + (k * 10 % 1) * 12);
    g.fillStyle = k < 0.3 ? 'rgba(80,96,48,0.55)' : 'rgba(120,104,76,0.5)';
    g.beginPath(); g.ellipse(x, y, 4 + k * 5, 3 + k * 3, k * 3, 0, TAU); g.fill();
  }
  // the undergrowth at the edges
  for (const c of C.clumps) {
    g.fillStyle = INK; g.beginPath(); g.arc(c.x, c.y, c.r + 2.4, 0, TAU); g.fill();
  }
  for (const c of C.clumps) {
    g.fillStyle = c.k < 0.33 ? '#4E6A2E' : c.k < 0.66 ? '#5C7A36' : '#46602A'; g.beginPath(); g.arc(c.x, c.y, c.r, 0, TAU); g.fill();
    g.fillStyle = 'rgba(200,240,140,0.16)'; g.beginPath(); g.arc(c.x - c.r * 0.25, c.y - c.r * 0.25, c.r * 0.5, 0, TAU); g.fill();
  }
  // the gate across the road at the top: two posts and a beam
  const gx = C.gate + 150; // (past the ox when the wagon stops at the gate)
  const ink = (fn, fill) => { g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 4.8; g.lineJoin = 'round'; fn(); g.fill(); g.stroke(); g.fillStyle = fill; fn(); g.fill(); };
  ink(() => { g.beginPath(); g.rect(gx - 9, mid - ROAD_HALF - 46, 18, ROAD_HALF * 2 + 92); }, C.last ? '#8A6A4A' : '#7A5A3C');
  for (const s of [-1, 1]) ink(() => { g.beginPath(); g.arc(gx, mid + s * (ROAD_HALF + 46), 15, 0, TAU); }, '#6E4A30');
  if (C.last) { // the town: a banner on the beam
    ink(() => { g.beginPath(); g.rect(gx - 30, mid - 26, 30, 52); }, '#B8423A');
    g.fillStyle = '#F2C14E'; g.beginPath(); g.arc(gx - 15, mid, 8, 0, TAU); g.fill();
  } else { // the roadside camp past the gate: a fire and a tent on the verge
    const fx0 = gx + 150, fy = mid + ROAD_HALF + 70;
    ink(() => { g.beginPath(); g.arc(fx0, fy, 16, 0, TAU); }, '#5A4A3A');
    g.fillStyle = '#FF9A3D'; g.beginPath(); g.arc(fx0, fy, 9, 0, TAU); g.fill(); g.fillStyle = '#FFE08A'; g.beginPath(); g.arc(fx0, fy, 4.5, 0, TAU); g.fill();
    ink(() => { g.beginPath(); g.moveTo(fx0 + 40, fy - 60); g.lineTo(fx0 + 100, fy - 60); g.lineTo(fx0 + 106, fy - 4); g.lineTo(fx0 + 34, fy - 4); g.closePath(); }, '#3F5578');
    g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(fx0 + 70, fy - 62); g.lineTo(fx0 + 70, fy - 2); g.stroke();
  }
}

// The wagon, top-down, facing up the road (+x): an ox in its traces, a covered bed on four wheels, crates at the back.
function drawWagon(ctx, u) {
  ctx.save(); ctx.translate(u.x, u.y);
  paintWagon(ctx, { roll: u.roll || 0, hurt: 1 - u.hp / u.maxHp, riders: u.riders || 0, flash: u.flashT > 0.06 });
  ctx.restore();
}
// The wagon at the origin, facing +x (camp-scene.js parks one at the camp's edge with this too).
export function paintWagon(ctx, { roll = 0, hurt = 0, riders = 0, flash = false } = {}) {
  const ink = (fn, fill, lw = 2.4) => { ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = lw * 2; ctx.lineJoin = 'round'; fn(); ctx.fill(); ctx.stroke(); ctx.fillStyle = fill; fn(); ctx.fill(); };
  const rr = (x, y, ww, hh, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, ww, hh, r) : ctx.rect(x, y, ww, hh); };
  ctx.save();
  ctx.fillStyle = 'rgba(30,26,14,0.3)'; ctx.beginPath(); ctx.ellipse(18, 3, 88, 40, 0, 0, TAU); ctx.fill();
  // the traces and the ox
  ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(36, -13); ctx.lineTo(76, -9); ctx.moveTo(36, 13); ctx.lineTo(76, 9); ctx.stroke();
  ctx.strokeStyle = '#8A6A44'; ctx.lineWidth = 2.6; ctx.stroke();
  const step = Math.sin(roll * 0.18) * 5;
  for (const [lx, ly, ph] of [[72, -11, 1], [72, 11, -1], [98, -11, -1], [98, 11, 1]]) ink(() => { ctx.beginPath(); ctx.ellipse(lx + step * ph, ly, 5, 3.6, 0, 0, TAU); }, '#4A3626', 1.4);
  ink(() => { ctx.beginPath(); ctx.ellipse(85, 0, 22, 14.5, 0, 0, TAU); }, '#8E6E4C');
  ctx.fillStyle = 'rgba(255,240,210,0.18)'; ctx.beginPath(); ctx.ellipse(82, -4, 14, 6, 0, 0, TAU); ctx.fill();
  ink(() => { ctx.beginPath(); ctx.ellipse(110, 0, 9.5, 8, 0, 0, TAU); }, '#7A5A3C');
  for (const s of [-1, 1]) ink(() => { ctx.beginPath(); ctx.moveTo(112, s * 6); ctx.quadraticCurveTo(116, s * 15, 122, s * 13); ctx.lineTo(121, s * 10.5); ctx.quadraticCurveTo(116, s * 11, 115, s * 5); ctx.closePath(); }, '#E9DCC0', 1.1);
  // wheels at the sides, spokes going round
  for (const wx of [-26, 20]) for (const s of [-1, 1]) {
    ink(() => rr(wx - 12, s * 31 - 4.5, 24, 9, 3), '#3A2C24', 1.4);
    ctx.fillStyle = '#7A6250'; for (let k = 0; k < 3; k++) { const p = ((roll * 0.9 + k * 8) % 24) - 12; ctx.fillRect(wx + p - 1, s * 31 - 3.5, 2, 7); }
  }
  // the bed and its cover
  ink(() => rr(-48, -27, 86, 54, 6), '#7A5232');
  ink(() => rr(-38, -24, 64, 48, 12), '#E9DCC0', 2);
  ctx.fillStyle = '#B8423A'; ctx.fillRect(-25, -24, 9, 48); ctx.fillRect(1, -24, 9, 48);
  ctx.strokeStyle = 'rgba(43,34,48,0.35)'; ctx.lineWidth = 1.6; for (const rx of [-30, -16, -2, 12]) { ctx.beginPath(); ctx.moveTo(rx, -23); ctx.lineTo(rx, 23); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-36, -21, 60, 9);
  // the driver's bench and the crates at the back
  ink(() => rr(27, -16, 9, 32, 2), '#9A6B40', 1.4);
  ink(() => rr(-56, -20, 16, 18, 2), '#A87C4A', 1.4); ink(() => rr(-56, 3, 16, 16, 2), '#946A3E', 1.4);
  // the downed riding on it: a grey head on the cover each
  for (let i = 0; i < riders; i++) { const hy = -12 + i * 12; ink(() => { ctx.beginPath(); ctx.arc(-6 + (i % 2) * 6, hy, 6, 0, TAU); }, '#A9A2B0', 1.2); }
  // damage: tears in the cover, a broken board
  if (hurt > 0.35) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, -18); ctx.lineTo(-12, -8); ctx.lineTo(-16, 2); ctx.moveTo(8, 10); ctx.lineTo(16, 18); ctx.stroke(); }
  if (hurt > 0.65) { ctx.fillStyle = '#3A2C24'; ctx.fillRect(-46, 18, 22, 7); ctx.fillRect(14, -26, 18, 6); }
  if (flash) { ctx.globalAlpha = 0.45; ctx.fillStyle = '#FFFFFF'; rr(-48, -27, 86, 54, 6); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}
