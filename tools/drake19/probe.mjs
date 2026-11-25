// Lane drake19: Cinder fights in Node, measured. Its pace (time in each state, how long between attacks, how fast it
// walks and turns), what each move catches, where its body lies (in a pillar, out of the room), what the party does.
//   node tools/drake19/probe.mjs [--n 20] [--level 44] [--party paladin,archer,cleric,twinfang] [--seed 1] [--v]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 20), level = +opt('level', 44), seed0 = +opt('seed', 1), verbose = args.includes('--v');
globalThis.location = { search: '?bossroom&boss=cinder' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const DT = 1 / 60;
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const CM = await import('../../js/boss-cinder.js');
const party = opt('party', 'paladin,archer,cleric,twinfang').split(',');
const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
export const moveOf = (b) => { const k = b.cd, e = b.el || {}; return b.dead ? 'dead' : k.mv ? k.mv : k.br ? (k.br.t > 0 ? 'scorch-tell' : 'scorch') : k.ch ? (k.ch.t > 0 ? 'rush-tell' : 'rush') : k.ring ? 'ring' : k.roarT > 0 ? 'roar' : e.holdT > 0 ? 'hold' : k.phase ? 'prowl' : 'asleep'; };
const T = { fights: 0, won: 0, secs: 0, st: {}, zones: {}, dmgIn: {}, gaps: [], walkSp: 0, walkS: 0, still: 0, awake: 0, turn: 0, turnMax: 0, inPillar: 0, outRoom: 0, partInPillar: 0, partOut: 0, heroHurt: 0,
  bossHurtBy: {}, cross: 0, kink: 0, tailOut: 0, firstDown: [], phaseT: [[], []], aimOff: 0, aimS: 0, farS: 0, tgtFar: 0, starts: {} };
for (let i = 0; i < n; i++) {
  setSeed(seed0 + i * 7919);
  const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(s, k); }
  s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  const run = newRun(s, { theme: 'ember', party, depth: 1, floor: 1 });
  let t = 0, seenZ = new Set(), firstDown = null, lastAtk = null, lastMv = '', lastF = null, php = new Map(), quiet = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && t < 900) {
    update(run, DT); t += DT;
    const w = run.world, b = w.units.find((u) => u.kind === 'cinder' && u.cd); if (!b) continue;
    const k = b.cd, hs = w.units.filter((u) => u.team === 'hero' && !u.dead && !u.downed && !u.summon);
    if (!firstDown && w.units.some((u) => u.team === 'hero' && u.downed)) firstDown = t;
    if (!k.phase || b.dead) continue;
    const mv = moveOf(b); T.st[mv] = (T.st[mv] || 0) + DT; T.awake += DT;
    if (mv !== lastMv) { T.starts[mv] = (T.starts[mv] || 0) + 1; lastMv = mv; }
    const sp = Math.hypot(b.vx || 0, b.vy || 0);
    if (mv === 'prowl') { T.walkSp += sp * DT; T.walkS += DT; }
    if (sp < 12) T.still += DT;
    if (lastF != null) { const d = Math.abs(wrap(b.facing - lastF)) / DT; T.turn += d * DT; T.turnMax = Math.max(T.turnMax, d); } lastF = b.facing;
    // its own zones that strike: one attack each; who stood in it when it showed, who it caught
    for (const z of w.danger) if ((z.src === b || z.by === b || (z.src && z.src.core === b)) && z.hit && !seenZ.has(z)) { seenZ.add(z);
      z._kind = z.label || (z.shape === 'line' ? 'rush' : z.shape === 'cone' ? (z.src !== b ? 'tail' : z.r > 300 ? 'scorch' : 'bite') : z.r > 200 ? 'roar' : 'fireball');
      z._hp = new Map(hs.map((h) => [h, h.hp])); z._t = t;
      if (z._kind !== 'fireball' || !z._follow) { if (lastAtk != null && z._kind !== 'fireball') T.gaps.push(t - lastAtk); if (z._kind !== 'fireball') lastAtk = t; } }
    for (const z of seenZ) if (z.done && !z._counted) { z._counted = true; const K = T.zones[z._kind] || (T.zones[z._kind] = { n: 0, hit: 0, nobody: 0, dmg: 0 }); K.n++;
      let c = 0; for (const [h, hp] of z._hp) if (h.hp < hp - 1 || h.downed || h.dead) c++; K._ = 0; z._c = c; z._doneT = t; }
    // a blow counted a tick after the zone is done (the hurt lands in the same step or the next)
    for (const z of seenZ) if (z._counted && !z._final && t - z._doneT > 0.05) { z._final = true; const K = T.zones[z._kind]; let c = 0, dmg = 0; for (const [h, hp] of z._hp) if (h.hp < hp - 1 || h.downed || h.dead) c++; K.hit += c; if (!c) K.nobody++; }
    for (const h of hs) { const was = php.get(h); if (was != null && h.hp < was) { T.dmgIn[mv] = (T.dmgIn[mv] || 0) + (was - h.hp) / h.maxHp; } php.set(h, h.hp); }
    if (w.pillars.some((q) => dist(b.x, b.y, q.x, q.y) < q.r + b.r * 0.4)) T.inPillar += DT;
    if (b.x < 20 || b.y < 20 || b.x > w.W - 20 || b.y > w.H - 20) T.outRoom += DT;
    for (const p of k.parts) if (!p.dead) { if (w.pillars.some((q) => dist(p.x, p.y, q.x, q.y) < q.r)) T.partInPillar += DT; if (p.x < 0 || p.y < 0 || p.x > w.W || p.y > w.H) T.partOut += DT; }
    { // the body's shape: does it cross itself (two places 130+ apart along the spine within 56 of each other: the body is 60-90 across), is it kinked (a bend over 0.6 rad in 26 of spine)
      const pts = []; for (let off = 0; off <= CM.LEN; off += 26) pts.push(CM.at_(k, b, off));
      let cross = false, kink = false;
      for (let a = 0; a < pts.length; a++) for (let c = a + 5; c < pts.length; c++) if (dist(pts[a].x, pts[a].y, pts[c].x, pts[c].y) < 56) cross = true;
      if (pts.some((q, i) => i > 1 && w.pillars.some((c) => dist(q.x, q.y, c.x, c.y) < c.r - 6))) T.overPillar = (T.overPillar || 0) + DT;
      for (let a = 2; a < pts.length; a++) { const a0 = Math.atan2(pts[a - 1].y - pts[a - 2].y, pts[a - 1].x - pts[a - 2].x), a1 = Math.atan2(pts[a].y - pts[a - 1].y, pts[a].x - pts[a - 1].x); if (Math.abs(wrap(a1 - a0)) > 0.6) kink = true; }
      if (cross) T.cross += DT; if (kink) T.kink += DT;
      const tip = pts[pts.length - 1]; if (tip.x < 0 || tip.y < 0 || tip.x > w.W || tip.y > w.H) T.tailOut += DT; }
    const tg = b.target; if (tg && mv === 'prowl') { T.aimS += DT; const d = dist(b.x, b.y, tg.x, tg.y); if (d > 330) T.tgtFar += DT; }
  }
  const w = run.world;
  T.fights++; if (run.phase === 'won') T.won++; T.secs += t; if (firstDown) T.firstDown.push(Math.round(firstDown));
  if (verbose) console.log(`#${i} ${run.phase} ${Math.round(t)}s ${w.bossLog ? w.bossLog() : ''} first down ${firstDown ? Math.round(firstDown) + 's' : '-'}`);
}
const pc = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '-');
console.log(`fights ${T.fights} won ${T.won} (${pc(T.won, T.fights)}) avg ${Math.round(T.secs / T.fights)}s`);
console.log('share of the fight in each state:', Object.entries(T.st).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pc(v, T.awake)}`).join('  '));
console.log('times each state began, a minute:', Object.entries(T.starts).map(([k, v]) => `${k} ${(60 * v / T.awake).toFixed(1)}`).join('  '));
const g = T.gaps.sort((a, b) => a - b), med = (q) => (g.length ? g[Math.floor(g.length * q)].toFixed(1) : '-');
console.log(`attacks (not counting fireballs) ${(60 * (g.length + T.fights) / T.awake).toFixed(1)} a minute; time between two: median ${med(0.5)} s, a quarter over ${med(0.75)} s, a tenth over ${med(0.9)} s, longest ${med(0.999)} s`);
for (const [k, K] of Object.entries(T.zones)) console.log(`  ${k}: ${(K.n / T.fights).toFixed(1)} a fight (${(60 * K.n / T.awake).toFixed(2)} a minute); caught ${(K.hit / Math.max(1, K.n)).toFixed(2)} each; caught nobody ${pc(K.nobody, K.n)}`);
console.log('hero health lost while it is in each state (party-healths per fight):', Object.entries(T.dmgIn).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / T.fights).toFixed(2)}`).join('  '));
console.log(`prowl speed ${(T.walkSp / Math.max(1, T.walkS)).toFixed(0)} a second on average; standing still (under 12) ${pc(T.still, T.awake)} of the fight; turning ${(T.turn / T.awake).toFixed(2)} rad/s on average, fastest ${T.turnMax.toFixed(1)}`);
console.log(`while prowling its mark is over 330 away ${pc(T.tgtFar, T.aimS)} of the time`);
console.log(`head in a pillar ${(T.inPillar / T.fights).toFixed(1)} s a fight, at the room's edge ${(T.outRoom / T.fights).toFixed(1)} s; body boxes in a pillar ${(T.partInPillar / T.fights).toFixed(1)} box-s a fight, out of the room ${(T.partOut / T.fights).toFixed(1)}`);
console.log(`its body crosses itself ${pc(T.cross, T.awake)} of the fight, is kinked ${pc(T.kink, T.awake)}; its tail's tip is through a wall ${pc(T.tailOut, T.awake)}; its spine lies across a pillar ${pc(T.overPillar || 0, T.awake)}`);
console.log(`first hero down at (s): ${T.firstDown.sort((a, b) => a - b).join(' ')}`);
