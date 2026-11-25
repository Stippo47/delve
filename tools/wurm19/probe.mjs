// Lane wurm19: Sand Wurm fights in Node, measured. What the party does while it is under, how often a breach can be
// stepped out of, where the holes open, what is out of the sand but not where it is drawn, who stands in a hole.
//   node tools/wurm19/probe.mjs [--n 20] [--level 51] [--party paladin,archer,cleric,twinfang] [--seed 1] [--v]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 20), level = +opt('level', 51), seed0 = +opt('seed', 1), verbose = args.includes('--v');
globalThis.location = { search: '?bossroom&boss=sandWurm' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const DT = 1 / 60;
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const party = opt('party', 'paladin,archer,cleric,twinfang').split(',');
const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
const T = { fights: 0, won: 0, secs: 0, st: {}, dmgBy: {}, breach: { n: 0, inAtTell: 0, hit: 0, nobody: 0 }, land: { n: 0, hit: 0 }, lunge: { n: 0, hit: 0, short: 0 }, inhale: { n: 0, hit: 0 }, coil: { n: 0, hit: 0 }, roar: { n: 0, hit: 0 },
  holeNearPillar: 0, holeNearWall: 0, holes: 0, heroInHole: 0, heroSecs: 0, unseenOut: 0, outSecs: 0, bodyInPillar: 0, bodyOutRoom: 0, heroOut: 0, heroInPillar: 0, nan: 0, underSecs: 0, tgtHidden: 0, tgtSecs: 0,
  blocked: 0, adds: 0, addMax: 0, phaseT: [[], [], []], pathPillar: 0, pathOut: 0, paths: 0, pits: 0, heroInPit: 0, idleUnder: 0, frozenAir: 0, deaths: 0, firstDown: [] };
for (let i = 0; i < n; i++) {
  setSeed(seed0 + i * 7919);
  const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(s, k); }
  s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  const run = newRun(s, { theme: 'dunes', party, depth: 1, floor: 1 });
  const prev = new Map(); let t = 0, lastHp = null, seenZ = new Set(), seenPath = null, seenHoles = new Set(), firstDown = null;
  while (run.phase !== 'won' && run.phase !== 'lost' && t < 900) {
    const w0 = run.world, b0 = w0.units.find((u) => u.sw);
    const hpBefore = b0 ? b0.hp : null, stBefore = b0 && b0.sw.st;
    update(run, DT); t += DT;
    const w = run.world, b = w.units.find((u) => u.sw); if (!b) continue;
    const k = b.sw, hs = w.units.filter((u) => u.team === 'hero' && !u.dead && !u.downed && !u.summon);
    if (!firstDown && w.units.some((u) => u.team === 'hero' && u.downed)) firstDown = t;
    T.st[k.st] = (T.st[k.st] || 0) + DT;
    if (hpBefore != null && b.hp < hpBefore) { const key = stBefore + (b.buffs && b.buffs.some((x) => x.id === 'stuck') ? '+stuck' : ''); T.dmgBy[key] = (T.dmgBy[key] || 0) + (hpBefore - b.hp) / b.maxHp; }
    // danger zones of its own: who stood in them when they showed, who was hit
    for (const z of w.danger) if (z.src === b && !seenZ.has(z)) { seenZ.add(z);
      const inside = (h) => z.shape === 'circle' ? dist(h.x, h.y, z.x, z.y) < z.r : z.shape === 'ring' ? (dist(h.x, h.y, z.x, z.y) > z.r0 && dist(h.x, h.y, z.x, z.y) < z.r1) : false;
      z._kind = z.shape === 'line' ? 'lunge' : z.shape === 'ring' ? 'coil' : k.st === 'tell' ? (k.plan === 'roar' ? 'roar' : 'breach') : k.st === 'arc' || k.st === 'coil' ? 'land' : 'inhale';
      z._in = hs.filter(inside).length; z._hp = new Map(hs.map((h) => [h, h.hp])); }
    for (const z of seenZ) if (z.done && !z._counted) { z._counted = true; const K = T[z._kind]; K.n++; K.inAtTell = (K.inAtTell || 0) + z._in;
      // who it caught: inside the shape the frame before it struck
      const inNow = (h) => { const q = prev.get(h) || h; return z.shape === 'circle' ? dist(q.x, q.y, z.x, z.y) < z.r + h.r * 0.5 : z.shape === 'ring' ? (dist(q.x, q.y, z.x, z.y) > z.r0 - h.r * 0.5 && dist(q.x, q.y, z.x, z.y) < z.r1 + h.r * 0.5) : (() => { const dx = z.x2 - z.x1, dy = z.y2 - z.y1, L = Math.hypot(dx, dy) || 1, u = ((q.x - z.x1) * dx + (q.y - z.y1) * dy) / L, v = Math.abs((q.x - z.x1) * dy - (q.y - z.y1) * dx) / L; return u > -h.r && u < L + h.r && v < z.hw + h.r * 0.5; })(); };
      const c = [...prev.keys()].filter(inNow).length; K.hit += c; if (!c) K.nobody = (K.nobody || 0) + 1; }
    prev.clear(); for (const h of hs) prev.set(h, { x: h.x, y: h.y });
    for (const h of hs) { if (!isFinite(h.x) || !isFinite(h.y)) T.nan++; T.heroSecs += DT;
      if (h.x < 0 || h.y < 0 || h.x > w.W || h.y > w.H) T.heroOut += DT;
      if (w.pillars.some((p) => dist(h.x, h.y, p.x, p.y) < p.r - 4)) T.heroInPillar += DT;
      if (k.holes.some((o) => o.open && dist(h.x, h.y, o.x, o.y) < o.r * 0.8)) T.heroInHole += DT;
      if (w.hazards.some((z) => z.wurmPit && dist(h.x, h.y, z.x, z.y) < z.r)) T.heroInPit += DT;
      T.tgtSecs += DT; if (h.target === b && b.hidden) T.tgtHidden += DT; if (b.hidden && !h.target) T.idleUnder += DT; }
    T.pits = Math.max(T.pits, w.hazards.filter((z) => z.wurmPit).length);
    if (b.hidden) T.underSecs += DT;
    const outParts = k.parts.filter((p) => !p.hidden && !p.dead);
    if (outParts.length || !b.hidden) T.outSecs += DT;
    if (b.hidden && outParts.length) T.unseenOut += DT;
    if (!b.hidden && b.frozenT > 0 && (b.hop || 0) > 20) T.frozenAir += DT;
    for (const p of [b, ...outParts]) { if (p === b && b.hidden) continue; if (w.pillars.some((q) => dist(p.x, p.y, q.x, q.y) < q.r + p.r * 0.5)) T.bodyInPillar += DT; if (p.x < 10 || p.y < 10 || p.x > w.W - 10 || p.y > w.H - 10) T.bodyOutRoom += DT; }
    for (const o of k.holes) if (!seenHoles.has(o)) { seenHoles.add(o); T.holes++; if (w.pillars.some((q) => dist(o.x, o.y, q.x, q.y) < q.r + o.r + 10)) T.holeNearPillar++; if (o.x < o.r + 20 || o.y < o.r + 20 || o.x > w.W - o.r - 20 || o.y > w.H - o.r - 20) T.holeNearWall++; }
    if (k.path && k.path !== seenPath && k.path.dive) { seenPath = k.path; T.paths++; let pil = false, outR = false;
      for (let q = 0; q <= k.path.len; q += 10) { const [x, y] = k.path.pt(q); if (w.pillars.some((c) => dist(x, y, c.x, c.y) < c.r + 30)) pil = true; if (x < 30 || y < 30 || x > w.W - 30 || y > w.H - 30) outR = true; }
      if (pil) T.pathPillar++; if (outR) T.pathOut++; }
    const adds = w.units.filter((u) => u.kind === 'scarab' && !u.dead).length; T.adds += adds * DT; T.addMax = Math.max(T.addMax, adds);
  }
  const w = run.world;
  T.fights++; if (run.phase === 'won') T.won++; T.secs += t; if (firstDown) T.firstDown.push(Math.round(firstDown));
  if (verbose) console.log(`#${i} ${run.phase} ${Math.round(t)}s ${w.bossLog ? w.bossLog() : ''} first down ${firstDown ? Math.round(firstDown) + 's' : '-'}`);
}
const pc = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '-');
console.log(`fights ${T.fights} won ${T.won} (${pc(T.won, T.fights)}) avg ${Math.round(T.secs / T.fights)}s`);
console.log('time by state (s per fight):', Object.entries(T.st).map(([k, v]) => `${k} ${(v / T.fights).toFixed(1)}`).join('  '));
console.log('boss health lost by state (% of max, per fight):', Object.entries(T.dmgBy).map(([k, v]) => `${k} ${(100 * v / T.fights).toFixed(1)}`).join('  '));
for (const k of ['breach', 'land', 'lunge', 'inhale', 'coil', 'roar']) { const K = T[k]; console.log(`  ${k}: ${K.n} (${(K.n / T.fights).toFixed(1)} a fight); heroes in it when it showed ${((K.inAtTell || 0) / Math.max(1, K.n)).toFixed(2)}, caught ${(K.hit / Math.max(1, K.n)).toFixed(2)} each; caught nobody ${pc(K.nobody || 0, K.n)}`); }
console.log(`holes ${T.holes}: beside a column ${T.holeNearPillar} (${pc(T.holeNearPillar, T.holes)}), at a wall ${T.holeNearWall}`);
console.log(`arcs ${T.paths}: through a column ${T.pathPillar}, out of the room ${T.pathOut}`);
console.log(`body in a column ${T.bodyInPillar.toFixed(1)} part-s, out of the room ${T.bodyOutRoom.toFixed(1)} part-s`);
console.log(`out of the sand ${(T.outSecs / T.fights).toFixed(1)} s a fight; of that with the head under and rings still out (unseen) ${(T.unseenOut / T.fights).toFixed(1)} s`);
console.log(`heroes: aiming at it while it is under ${pc(T.tgtHidden, T.tgtSecs)} of their time; no target while it is under ${pc(T.idleUnder, T.tgtSecs)}; in an open hole ${pc(T.heroInHole, T.heroSecs)}; in its quicksand ${pc(T.heroInPit, T.heroSecs)}; out of the room ${T.heroOut.toFixed(1)} s; in a column ${T.heroInPillar.toFixed(1)} s; NaN ${T.nan}`);
console.log(`brood: ${(T.adds / T.secs).toFixed(2)} alive on average, most ${T.addMax}; most pits ${T.pits}; frozen in the air ${(T.frozenAir / T.fights).toFixed(1)} s a fight`);
console.log(`first hero down at (s): ${T.firstDown.sort((a, b) => a - b).join(' ')}`);
