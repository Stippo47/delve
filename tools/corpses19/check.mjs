// Lane corpses19 (round 19; the designer: "Also corpses should not collide or render ontop of anything"): a headless
// count of every push or collision that involves a dead body, in real battle-mode fights and in staged tests.
//   node tools/corpses19/check.mjs [--n 4] [--v]        (no browser; run from the game's folder)
//
// Bodies are of two kinds in the sim: a corpse (w.corpses: thrown by its killing blow, lands, lies there fading) and a
// downed hero (still in w.units, lying grey until revived or bled out). What it counts, step by step:
//   corpse: any change in a body's place or slide that its own throw does not explain (its flight, its bounce on the
//     floor, its slide to a stop). Each is put down to what was there: a pillar, a troll's boulder, a yeti's ball, a
//     crate, a raised wall, the room's own stone walls, the room's edge, a Poltergeist's throw (an ability that throws
//     the body at someone on purpose), or something else; and to whether the body was still thrown (flying or
//     sliding) or lying still. Kept on purpose, not counted: a thrown body stopped by something standing still (it
//     would land inside a crate or a rock), and the Poltergeist's throw. Counted: anything that moves pushing a body
//     (a boulder, a ball), and anything at all moving a body that lies still.
//   downed: any move, or any knock stored on it, while it lies there (not counting a revive or an ability carrying it).
// Staged (one room, set up by hand, the sim run as it is):
//   walk     a villager walks a line through three bodies and a downed hero: how far it is put off its line
//   boulder  a rock troll's boulder rolled through bodies: how far they move
//   shots    arrows shot across bodies at a target behind them: how many stop short
//   wall     a wall raised on a body and a downed hero: how far they move
//   blast    an explosion beside bodies and a downed hero: how far they move, knock stored
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const verbose = args.includes('--v');
const N = +opt('n', 4), DT = 1 / 60;
const B = await import('../../js/battle.js');
const SIM = await import('../../js/sim.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { circleRect, buildGrid } = await import('../../js/path.js');

const save = freshSave(); save.cheat = true;
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
const hyp = Math.hypot;

// A body's own motion for one step, as sim.js corpses() moves it with nothing else there (no walls, pillars, edges).
function freeStep(c, dt) {
  let { x, y, kx, ky, z, vz } = c;
  if (z > 0 || vz > 0) { vz -= 900 * dt; z += vz * dt; if (z <= 0) { z = 0; vz = vz < -160 ? -vz * 0.3 : 0; kx *= 0.7; ky *= 0.7; } }
  const k = Math.exp(-(z > 0 ? 0.8 : 4.5) * dt); kx *= k; ky *= k;
  x += kx * dt; y += ky * dt;
  return { x, y, kx, ky };
}
// What a body at (x, y), radius r, is touching (the first thing found)
function cause(w, c, x, y) {
  const r = (c.r || 20) * 0.6;
  if (c.flungBy) return 'poltergeist throw (an ability)';
  if (x < r + 2 || y < r + 2 || x > w.W - r - 2 || y > w.H - r - 2) return "room's edge"; // (the room first: by a pillar at the edge, it is the edge that stopped it)
  for (const wl of w.walls) if (wl.temp == null && !wl.prop && circleRect(x, y, r + 2, wl)) return "room's stone wall";
  for (const p of w.pillars) if (!p.owner && hyp(x - p.x, y - p.y) < p.r + r + 2) return 'pillar'; // (one standing still first: by a rock and a ball at once, it is the rock)
  for (const p of w.pillars) if (hyp(x - p.x, y - p.y) < p.r + r + 2) return p.boulder ? "troll's boulder" : p.snow || p.snowball ? "yeti's ball" : 'a carried thing';
  for (const wl of w.walls) if (circleRect(x, y, r + 2, wl)) return wl.prop ? 'crate' : 'raised wall';
  return 'something else';
}

// One step watched: snapshot the bodies, run it, compare.
function watch(w, run, tally, stepFn) {
  const t0 = w.time;
  const cs = new Map(w.corpses.map((c) => [c, { x: c.x, y: c.y, kx: c.kx, ky: c.ky, z: c.z, vz: c.vz, flungBy: c.flungBy }]));
  const ds = new Map(w.units.filter((u) => u.downed && !u.dead).map((u) => [u, { x: u.x, y: u.y, kx: u.kx, ky: u.ky }]));
  stepFn();
  const dt = w.time > t0 + 1e-9 ? DT : 0; // (the step is DT: w.time - t0 rounds, and a body just over the floor lands or not by it)
  for (const c of w.corpses) {
    const b = cs.get(c); if (!b) continue;
    const e = dt > 0 ? freeStep(b, dt) : { x: b.x, y: b.y, kx: b.kx, ky: b.ky };
    const off = hyp(c.x - e.x, c.y - e.y), dk = hyp(c.kx - e.kx, c.ky - e.ky);
    if (off > 0.02 || dk > 0.5) { const c0 = cause(w, c, b.x, b.y), c1 = cause(w, c, c.x, c.y), room = (k) => k === "room's edge" || k === "room's stone wall";
      let why = b.flungBy || c.flungBy ? 'poltergeist throw (an ability)' : room(c1) ? c1 : c0 === 'something else' ? c1 : c0; /* (it ended up at the room's edge: the edge stopped it) */
      // a body still thrown (in the air or sliding) that meets something standing still is stopped by it, on purpose (it
      // would land inside a crate or a rock); anything that moves (a boulder, a ball), or anything moving a body that
      // lies still, is a push
      const thrown = b.z > 0 || b.vz > 0 || hyp(b.kx, b.ky) > 1, fixed = why === 'pillar' || why === 'crate' || why === 'raised wall' || room(why);
      if (why !== 'poltergeist throw (an ability)') why = thrown && fixed ? 'thrown body stopped by: ' + why : (thrown ? 'thrown body pushed by: ' : 'lying body pushed by: ') + why;
      tally.corpse[why] = (tally.corpse[why] || 0) + 1; tally.corpseDist[why] = (tally.corpseDist[why] || 0) + off; }
  }
  for (const [u, b] of ds) {
    if (!u.downed || u.dead) continue; // revived, or bled out this step
    const off = hyp(u.x - b.x, u.y - b.y), dk = hyp(u.kx, u.ky) - hyp(b.kx, b.ky);
    if (off > 0.02) { tally.downed.moved = (tally.downed.moved || 0) + 1; tally.downedDist = (tally.downedDist || 0) + off; }
    if (dk > 0.5) tally.downed['knock stored'] = (tally.downed['knock stored'] || 0) + 1;
  }
}
const newTally = () => ({ corpse: {}, corpseDist: {}, downed: {}, downedDist: 0, bodies: 0, downs: 0, steps: 0 });

// ---------------------------------------------------------------- real fights
const SETUPS = [
  ['villagers', 'villager*12', 'villager*12', 'wildwood'],
  ['goblins vs skeletons', 'goblin*8,goblinSpear*4', 'rattler*8,rattlerSpear*4', 'crypt'],
  ['necromancer raising', 'rattler*10,necromancer', 'paladin,tower,archer', 'crypt'],
  ['trolls and boulders', 'troll*2,rockTroll*2', 'villager*14', 'warren'],
  ['yetis and snowballs', 'yeti*3', 'villager*12', 'frost'],
  ['bombers (blasts)', 'goblinBomber*4,goblinSuicide*4', 'villager*12', 'warren'],
  ['heroes going down', 'valkyrie,paladin,cleric,archer,necromancer', 'oldguard,dame,berserker,pyromancer,earthMage', 'crypt'],
  ['the Mob and the Telekinetic', 'mob,telekinetic,warlock', 'rattler*8,brute*2', 'crypt'],
];
// and every hero, five a side, in mixed fights (every ability that pushes, pulls or throws gets its turn near the downed)
{
  const H = B.battleRoster(save).heroes, pick = (i) => H[(i * 7 + 3) % H.length];
  for (let f = 0; f < 12; f++) SETUPS.push([`heroes mixed ${f + 1}`, [0, 1, 2, 3, 4].map((j) => pick(f * 10 + j)).join(','), [5, 6, 7, 8, 9].map((j) => pick(f * 10 + j)).join(','), ['crypt', 'wildwood', 'warren', 'frost'][f % 4]]);
}
const all = newTally();
console.log(`real fights (${N} seeds each):`);
for (const [label, a, b, arena] of SETUPS) {
  const T = newTally();
  for (let i = 0; i < N; i++) {
    setSeed(500 + i);
    const run = B.newBattle(save, { arena, a: parse(a), b: parse(b) }), w = run.world;
    const seen = new WeakSet(), downSeen = new WeakSet(); let t = 0;
    while (!run.summary && t < 200) {
      watch(w, run, T, () => B.updateBattle(run, DT)); t += DT; T.steps++;
      for (const c of w.corpses) if (!seen.has(c)) { seen.add(c); T.bodies++; }
      for (const u of w.units) if (u.downed && !downSeen.has(u)) { downSeen.add(u); T.downs++; }
    }
  }
  const sum = (o) => Object.values(o).reduce((s, v) => s + v, 0);
  console.log(`  ${label.padEnd(28)} bodies ${String(T.bodies).padStart(3)}, downed ${String(T.downs).padStart(2)} | corpse pushes ${sum(T.corpse)} ${JSON.stringify(T.corpse)} | downed ${JSON.stringify(T.downed)}${T.downedDist ? ' moved ' + T.downedDist.toFixed(0) : ''}`);
  for (const k in T.corpse) { all.corpse[k] = (all.corpse[k] || 0) + T.corpse[k]; all.corpseDist[k] = (all.corpseDist[k] || 0) + T.corpseDist[k]; }
  for (const k in T.downed) all.downed[k] = (all.downed[k] || 0) + T.downed[k];
  all.downedDist += T.downedDist; all.bodies += T.bodies; all.downs += T.downs;
}

// ---------------------------------------------------------------- dungeon runs (rooms with stone walls; heroes go down and get revived)
{
  const D = await import('../../js/dungeon.js'), { THEME_IDS } = await import('../../js/themes.js'), { STARTERS } = await import('../../js/heroes.js'), P = await import('../../js/progress.js');
  console.log(`dungeon runs (${THEME_IDS.length} lands, the starting party, up to 300 s each):`);
  for (const theme of THEME_IDS) {
    const T = newTally();
    setSeed(900 + theme.length);
    const s = freshSave(); for (const k of STARTERS) { const h = s.heroes[k]; h.owned = true; h.level = 10; h.points = P.START_POINTS + 9; P.autoSpend(s, k); }
    s.party = STARTERS.slice(); s.unlocks = { slotMini1: true, slotBoss1: true }; s.slots = 4;
    const run = D.newRun(s, { theme, party: STARTERS.slice(), depth: 1, floor: 1 });
    const seen = new WeakSet(), downSeen = new WeakSet(); let t = 0;
    while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < 300) {
      const w = run.world; watch(w, run, T, () => D.update(run, DT)); t += DT; T.steps++;
      for (const c of run.world.corpses) if (!seen.has(c)) { seen.add(c); T.bodies++; }
      for (const u of run.world.units) if (u.downed && !downSeen.has(u)) { downSeen.add(u); T.downs++; }
    }
    const sum = (o) => Object.values(o).reduce((q, v) => q + v, 0);
    console.log(`  ${theme.padEnd(28)} bodies ${String(T.bodies).padStart(3)}, downed ${String(T.downs).padStart(2)} | corpse pushes ${sum(T.corpse)} ${JSON.stringify(T.corpse)} | downed ${JSON.stringify(T.downed)}${T.downedDist ? ' moved ' + T.downedDist.toFixed(0) : ''}`);
    for (const k in T.corpse) { all.corpse[k] = (all.corpse[k] || 0) + T.corpse[k]; all.corpseDist[k] = (all.corpseDist[k] || 0) + T.corpseDist[k]; }
    for (const k in T.downed) all.downed[k] = (all.downed[k] || 0) + T.downed[k];
    all.downedDist += T.downedDist; all.bodies += T.bodies; all.downs += T.downs;
  }
}

// ---------------------------------------------------------------- staged
// An empty room of the battle's kind, one villager kept for its def, the rest set by hand.
function room() {
  setSeed(7);
  const run = B.newBattle(save, { arena: 'crypt', a: parse('villager'), b: parse('villager') }), w = run.world;
  w.units = []; w.pillars = []; w.walls = w.walls.filter((r) => r.solid && !r.prop); w.corpses = []; buildGrid(w);
  return { run, w };
}
const body = (w, x, y) => { const c = { kind: 'villager', x, y, r: 31, vr: 22, facing: 1, kx: 0, ky: 0, spin: 0, z: 0, vz: 0, age: 5, t: 30, max: 30 }; w.corpses.push(c); return c; };
function downedHero(w, x, y) {
  const u = SIM.spawn(w, 'paladin', x, y, { team: 'hero' }); w.units.push(u);
  u.downed = true; u.hp = 0; u.bleedT = 99; return u;
}
const moved = (list) => list.reduce((s, o) => s + hyp(o.x - o.x0, o.y - o.y0), 0);
const mark = (list) => { for (const o of list) { o.x0 = o.x; o.y0 = o.y; } return list; };
const stagedT = newTally();
const staged = {};
// walk: a villager on its way across the room, its line through the bodies (and the same walk with no bodies there)
for (const withBodies of [true, false]) {
  const { run, w } = room(), CY = w.H / 2;
  const v = SIM.spawn(w, 'villager', 200, CY, { team: 'hero' }); w.units.push(v);
  const bodies = withBodies ? mark([body(w, 400, CY), body(w, 470, CY + 10), body(w, 540, CY - 10), downedHero(w, 620, CY)]) : [];
  let off = 0, steps = 0;
  for (let i = 0; i < 60 * 8 && v.x < 800; i++) { v.forcedGoal = { x: 900, y: CY }; v.target = null; watch(w, run, stagedT, () => SIM.step(w, DT)); steps++; if (v.x > 330 && v.x < 700) off = Math.max(off, Math.abs(v.y - CY)); }
  staged[withBodies ? 'walk' : 'walk0'] = withBodies ? `a villager walking through 3 bodies and a downed hero: furthest off its line ${off.toFixed(1)}, ${(steps / 60).toFixed(2)} s to cross, bodies moved ${moved(bodies).toFixed(1)}`
    : `the same walk with no bodies there: furthest off its line ${off.toFixed(1)}, ${(steps / 60).toFixed(2)} s to cross`;
}
// boulder: a rock troll's boulder rolled through bodies and a downed hero
{
  const { run, w } = room(), CY = w.H / 2;
  const tr = SIM.spawn(w, 'rockTroll', 120, CY + 200, { team: 'enemy' }); w.units.push(tr); // (its brain rolls the boulder: not stunned)
  const b = { x: 260, y: CY, r: 41, prop: 'troll-boulder', boulder: true, owner: tr, team: tr.team, vx: 420, vy: 0, held: false, hits: new Set() };
  tr.bould = b; w.pillars.push(b);
  const bodies = mark([body(w, 420, CY), body(w, 500, CY + 15), downedHero(w, 600, CY - 10)]);
  for (let i = 0; i < 60 * 3; i++) watch(w, run, stagedT, () => SIM.step(w, DT));
  staged.boulder = `a boulder rolled through 2 bodies and a downed hero: it went to x ${b.x.toFixed(0)}, bodies moved ${moved(bodies).toFixed(1)}`;
}
// shots: arrows across bodies at a target behind them
{
  const { run, w } = room(), CY = w.H / 2;
  const tg = SIM.spawn(w, 'villager', 760, CY, { team: 'enemy' }); w.units.push(tg); tg.stunT = 99; tg.maxHp = tg.hp = 99999;
  const bodies = mark([body(w, 420, CY), body(w, 520, CY), downedHero(w, 620, CY)]);
  let landed = 0, short = 0;
  for (let k = 0; k < 10; k++) {
    const p = { kind: 'arrow', x: 250, y: CY + (k - 5) * 2, vx: 700, vy: 0, r: 4, team: 'hero', owner: null, dmg: 1, o: {}, life: 2, a: 0 };
    w.projectiles.push(p);
    for (let i = 0; i < 60 && p.life > 0; i++) watch(w, run, stagedT, () => SIM.step(w, DT));
    if (p.x > 700) landed++; else short++;
  }
  staged.shots = `10 arrows across 2 bodies and a downed hero at a target behind: ${landed} reached it, ${short} stopped short; bodies moved ${moved(bodies).toFixed(1)}`;
}
// wall: a wall raised on a body and a downed hero
{
  const { run, w } = room(), CY = w.H / 2;
  const bodies = mark([body(w, 400, CY), downedHero(w, 600, CY)]);
  SIM.wallRect(w, { x: 380, y: CY - 30, w: 40, h: 60 }, 3, 'stone'); SIM.wallRect(w, { x: 580, y: CY - 30, w: 40, h: 60 }, 3, 'stone');
  for (let i = 0; i < 60; i++) watch(w, run, stagedT, () => SIM.step(w, DT));
  staged.wall = `a wall raised on a body and on a downed hero: they moved ${moved(bodies).toFixed(1)}`;
}
// blast: an explosion beside bodies and a downed hero
{
  const { run, w } = room(), CY = w.H / 2;
  const bodies = mark([body(w, 470, CY), body(w, 530, CY + 20), downedHero(w, 500, CY - 40)]);
  SIM.explode(w, 500, CY, 120, 20, {}, null, '#fff');
  for (let i = 0; i < 60; i++) watch(w, run, stagedT, () => SIM.step(w, DT));
  const knock = bodies.filter((o) => o.kx != null && o.def).reduce((s, o) => s + hyp(o.kx, o.ky), 0);
  staged.blast = `a blast beside 2 bodies and a downed hero: they moved ${moved(bodies).toFixed(1)}, knock stored ${knock.toFixed(0)}`;
}
console.log('staged:');
for (const k in staged) console.log(`  ${k.padEnd(8)} ${staged[k]}`);
if (Object.keys(stagedT.corpse).length || Object.keys(stagedT.downed).length) console.log(`  (staged, step by step: corpse ${JSON.stringify(stagedT.corpse)}, downed ${JSON.stringify(stagedT.downed)})`);

// ---------------------------------------------------------------- the total
const KEPT = { has: (k) => k.startsWith('thrown body stopped by: ') || k === 'poltergeist throw (an ability)' }; // kept on purpose (docs/corpses19.md)
const bad = Object.entries(all.corpse).filter(([k]) => !KEPT.has(k)).reduce((s, [, v]) => s + v, 0) + Object.values(all.downed).reduce((s, v) => s + v, 0)
  + Object.entries(stagedT.corpse).filter(([k]) => !KEPT.has(k)).reduce((s, [, v]) => s + v, 0) + Object.values(stagedT.downed).reduce((s, v) => s + v, 0);
const kept = Object.entries(all.corpse).filter(([k]) => KEPT.has(k));
console.log(`\nbodies ${all.bodies}, downed ${all.downs}. Pushes and collisions involving a body: ${bad}` +
  (kept.length ? `  (kept on purpose: ${kept.map(([k, v]) => `${k} ${v}`).join(', ')})` : ''));
if (verbose) console.log(JSON.stringify(all, null, 1));
