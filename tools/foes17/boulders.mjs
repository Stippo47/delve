// Round 17 (lane foes17): do the troll-shaped enemies get their boulders back? Headless (no browser): js/battle.js.
// For each kind (troll, rock troll, elite rock troll, yeti) and each staged spot (open floor, against a wall, in a
// corner, behind a pillar, behind its friends, after a knockback, in a pocket between rocks), the boulder (the yeti's
// snowball) is left loose and still, and the clock runs until the troll has it in its hands again. Then whole fights
// (each kind against a paladin and an archer): every time the boulder is let go, how long until it is taken up again.
//   node tools/foes17/boulders.mjs [--n 20] [--kinds troll,rockTroll] [--json out.json] [--v]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
// --dungeon theme[,theme] --foes troll,rockTroll: dungeon runs with only those kinds in the rooms (runs.mjs --foes)
globalThis.location = { search: opt('dungeon') ? '?foes=' + opt('foes', 'troll,rockTroll') : '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../js/battle.js');
const { setSeed, rrange } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { spawn } = await import('../../js/sim.js');
const { buildGrid } = await import('../../js/path.js');
const save = freshSave(); save.cheat = true;
const DG = await import('../../js/dungeon.js'), HE = await import('../../js/heroes.js'), P = await import('../../js/progress.js'), FS = await import('node:fs');
const DT = 1 / 60, N = +opt('n', 20), V = args.includes('--v'), WITHIN = +opt('within', 6), MAXT = 20;
const KINDS = (opt('kinds', 'troll,rockTroll,rockTroll@1,yeti')).split(',');
const ballOf = (u) => u.bould || u.snow || null;
const isHeld = (u, b) => (u.snow ? b.held && !b.packing : b.held);

function stage(kind, seed) {
  setSeed(seed);
  const [k, rank] = kind.split('@');
  const run = B.newBattle(save, { arena: 'crypt', a: [{ k: 'paladin', n: 1 }], b: [{ k, n: 1, rank: +rank || 0 }] });
  const w = run.world;
  const hero = run.sides.a[0], u = run.sides.b[0];
  hero.maxHp = hero.hp = 1e6; u.maxHp = u.hp = 1e6;
  for (let i = 0; i < 30; i++) B.updateBattle(run, DT); // (the boulder is made on the first ticks; the yeti packs one: up to ~2 s)
  if (u.def.brain && u.yt) for (let i = 0; i < 240 && !(u.snow && !u.snow.packing); i++) B.updateBattle(run, DT);
  w.walls = w.walls.filter((r) => !r.grid); w.pillars = w.pillars.filter((p) => p.owner); // a clean room (staged rocks below)
  return { run, w, hero, u };
}
// Put the troll at (tx,ty), its boulder loose and still at (bx,by); the hero far off at (hx,hy), rooted
function place(S, tx, ty, bx, by, hx, hy) {
  const { u, hero } = S, b = ballOf(u);
  u.x = tx; u.y = ty; u.vx = u.vy = u.kx = u.ky = 0; u.chg = null; u.bJam = null; u.bouldRest = 0;
  if (u.yt) { u.yt.heave = null; u.yt.rest = 0; u.yt.brawl = 0; }
  b.x = bx; b.y = by; b.vx = b.vy = 0; b.held = false; b.recalled = false;
  hero.x = hx; hero.y = hy; hero.rootT = 1e9;
}
const SPOTS = {
  open: (S) => place(S, 420, 480, 760, 480 + rrange(-60, 60), 1180, 160),
  wall: (S) => { const b = ballOf(S.u); place(S, 640 + rrange(-80, 80), 420, 640, b.r + 1, 1180, 860); },
  corner: (S) => { const b = ballOf(S.u); place(S, 420, 420, b.r + 1, b.r + 1, 1180, 860); },
  pillar: (S) => { place(S, 420, 480, 800, 480 + rrange(-15, 15), 1180, 160); S.w.pillars.push({ x: 640, y: 480, r: 44, prop: 'rock' }); },
  pocket: (S) => { const b = ballOf(S.u); place(S, 640, 520, 640, b.r + 2, 1180, 860); S.w.pillars.push({ x: 640 - b.r - 52, y: 50, r: 46, prop: 'rock' }, { x: 640 + b.r + 52, y: 50, r: 46, prop: 'rock' }); },
  friends: (S) => { place(S, 420, 480, 760, 480, 1180, 160); for (const [dx, dy] of [[-70, -40], [-70, 40], [-10, -80], [-10, 80], [70, 0]]) { const o = spawn(S.w, 'orc', 760 + dx, 480 + dy, { team: S.u.team }); o.rootT = 1e9; o.aggro = true; o.adopt = false; S.run.sides.b.push(o); } },
  knocked: (S) => { place(S, 600, 480, 840, 480, 1180, 160); S.kick = { t: 0.4, kx: -900, ky: rrange(-200, 200) }; },
};
function fetch(kind, spot, seed) {
  const S = stage(kind, seed); SPOTS[spot](S);
  { const own = S.w.pillars.filter((p) => p.owner); S.w.pillars = S.w.pillars.filter((p) => !p.owner); buildGrid(S.w); S.w.pillars.push(...own); } // (the staged rocks in the path grid, as a room's are)
  const { run, u } = S; let t = 0, b = ballOf(u);
  while (t < MAXT) {
    if (S.kick && t >= S.kick.t) { u.kx = S.kick.kx; u.ky = S.kick.ky; S.kick = null; }
    B.updateBattle(run, DT); t += DT;
    const nb = ballOf(u);
    if (!nb) return { t: null, why: 'gone' };
    if (nb !== b) return { t, why: 'new' }; // (a yeti left it and packed a new one)
    if (isHeld(u, nb) && t > 0.05) return { t, why: 'held' };
  }
  return { t: null, why: 'never', x: Math.round(u.x), y: Math.round(u.y), bx: Math.round(b.x), by: Math.round(b.y), rest: u.bouldRest };
}
const out = { fetch: {}, fights: {}, dungeon: {} };
if (opt('dungeon')) { dungeon(); process.exit(0); }
// Dungeon runs: every troll-shaped foe met, each time its boulder is let go, how long until it's taken up again
function dungeon() {
  const { newRun, update } = DG; const { STARTERS } = HE;
  const kinds = new Set(opt('foes', 'troll,rockTroll').split(','));
  for (const theme of opt('dungeon').split(',')) {
    let rel = 0, back = 0, quick = 0, sum = 0, lost = 0, broke = 0, died = 0, waits = [];
    for (let i = 0; i < N; i++) {
      setSeed(700 + i * 7919);
      const s = freshSave(); for (const k of STARTERS) { s.heroes[k].owned = true; s.heroes[k].level = 6; s.heroes[k].points = P.START_POINTS + 5; P.autoSpend(s, k); }
      s.party = STARTERS.slice(); s.unlocks = { slotMini1: true, slotBoss1: true }; 
      const run = newRun(s, { theme, party: STARTERS.slice(), depth: 1, floor: 1 });
      const seen = new Map(); let t = 0, lw = null;
      while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < +opt('secs', 900)) {
        update(run, DT); t += DT;
        const w = run.world; if (w !== lw) { for (const [u, z] of seen) if (z.since != null && !u.dead) lost++; seen.clear(); lw = w; }
        for (const u of w.units) {
          if (!kinds.has(u.kind)) continue;
          const z = seen.get(u) || (seen.set(u, { was: null, since: null, ball: null }), seen.get(u));
          if (u.dead) { if (z.since != null) { died++; z.since = null; } continue; }
          const b = ballOf(u);
          if (!b && u.ripT > 0) continue; // (tearing a new one out of the floor: the wait goes on till it has it)
          if (!b) { if (z.ball && z.since != null) { broke++; z.since = null; } z.ball = null; continue; }
          if (b !== z.ball) { if (z.since != null) { back++; sum += t - z.since; waits.push(t - z.since); if (t - z.since <= WITHIN) quick++; z.since = null; } z.ball = b; z.was = isHeld(u, b); continue; }
          const h = isHeld(u, b);
          if (z.was && !h) { rel++; z.since = t; z.why = (u.bouldRest > 0 ? 'jam' : 'throw'); z.log = null; }
          if (!z.was && h && z.since != null) { back++; sum += t - z.since; waits.push(t - z.since); if (t - z.since <= WITHIN) quick++; z.since = null; if (V && z.log) console.log('   slow', (t - (z.log.t0)).toFixed(1) + 's', JSON.stringify(z.log)); }
          if (z.since != null && t - z.since > WITHIN && !z.log) z.log = { run: i, id: u.id, t0: z.since, why: z.why, d: Math.round(Math.hypot(u.x - b.x, u.y - b.y) - u.r - b.r), rest: +(u.bouldRest || 0).toFixed(1), jam: u.bJam && +u.bJam.t.toFixed(1), bsp: Math.round(Math.hypot(b.vx, b.vy)), held: b.held, mode: u.mode, tgt: u.target && u.target.kind, stun: u.stunT > 0, at: [Math.round(u.x), Math.round(u.y)], b: [Math.round(b.x), Math.round(b.y)], W: [w.W, w.H], hp: Math.round(100 * u.hp / u.maxHp) };
          z.was = h;
        }
      }
    }
    waits.sort((a, b) => a - b);
    out.dungeon[theme] = { releases: rel, back, quick, lost, broke, died, mean: back ? +(sum / back).toFixed(1) : null, p90: waits.length ? +waits[Math.floor(waits.length * 0.9)].toFixed(1) : null };
    console.log(`dungeon ${theme.padEnd(8)} let go ${rel}, taken up again ${back} (within ${WITHIN}s ${quick}, mean ${back ? (sum / back).toFixed(1) : '-'}s, 90% within ${out.dungeon[theme].p90}s), loose when the room ended ${lost}, broken while loose ${broke}, died with it loose ${died}`);
  }
  if (opt('json')) (FS).writeFileSync(opt('json'), JSON.stringify(out, null, 1));
}
for (const kind of KINDS) {
  for (const spot of Object.keys(SPOTS)) {
    const res = []; for (let i = 0; i < N; i++) res.push(fetch(kind, spot, 300 + i));
    const ok = res.filter((r) => r.t != null && r.t <= WITHIN), ts = res.filter((r) => r.t != null).map((r) => r.t).sort((a, b) => a - b);
    const med = ts.length ? ts[ts.length >> 1] : null, never = res.filter((r) => r.why === 'never').length, nw = res.filter((r) => r.why === 'new').length;
    out.fetch[`${kind}/${spot}`] = { ok: ok.length, n: N, med, never, new: nw };
    console.log(`${kind.padEnd(12)} ${spot.padEnd(8)} back within ${WITHIN}s ${String(ok.length).padStart(2)}/${N}  median ${med == null ? '  -  ' : med.toFixed(1).padStart(5)}s  never ${never}${nw ? `  packed anew ${nw}` : ''}`);
    if (V) for (const r of res) if (r.why === 'never') console.log('   ', JSON.stringify(r));
  }
}
// whole fights: each release and how long until it's held again
for (const kind of KINDS) {
  const [k, rank] = kind.split('@');
  let rel = 0, back = 0, quick = 0, lost = 0, sum = 0, broke = 0;
  for (let i = 0; i < N; i++) {
    setSeed(500 + i);
    const run = B.newBattle(save, { arena: B.homeOf(k), a: [{ k: 'paladin', n: 1 }, { k: 'archer', n: 1 }], b: [{ k, n: 1, rank: +rank || 0 }] });
    const u = run.sides.b[0]; u.maxHp = u.hp = u.maxHp * 3; for (const h of run.sides.a) { h.maxHp = h.hp = h.maxHp * 4; }
    let t = 0, was = null, since = null, ball = null;
    while (!run.summary && t < 60 && !u.dead) {
      B.updateBattle(run, 1 / 60); t += 1 / 60;
      const b = ballOf(u); if (!b) { if (ball && since != null) { broke++; since = null; } ball = null; was = null; continue; }
      if (b !== ball) { if (since != null) { back++; sum += t - since; if (t - since <= WITHIN) quick++; since = null; } ball = b; was = isHeld(u, b); continue; }
      const h = isHeld(u, b);
      if (was && !h) { rel++; since = t; }
      if (!was && h && since != null) { back++; sum += t - since; if (t - since <= WITHIN) quick++; since = null; }
      was = h;
    }
    if (since != null) lost++;
  }
  out.fights[kind] = { releases: rel, back, quick, lost, broke, mean: back ? +(sum / back).toFixed(1) : null };
  console.log(`fights ${kind.padEnd(12)} let go ${rel}, taken up again ${back} (within ${WITHIN}s ${quick}, mean ${back ? (sum / back).toFixed(1) : '-'}s), still loose at the end ${lost}, broken while loose ${broke}`);
}
if (opt('json')) (await import('node:fs')).writeFileSync(opt('json'), JSON.stringify(out, null, 1));
