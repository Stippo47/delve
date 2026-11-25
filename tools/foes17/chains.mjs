// Round 17 (lane foes17): how the chain enemies' bodies hold together. Headless (no browser): js/battle.js.
// Each chain kind in an empty room, its head led about by where the hero is put: a straight run, a sharp turn (the
// hero moved behind it), a stop (the head held still), a hard knock back into its own body, a dive under the sand (the
// serpent). Every step, after the physics: the distance from each piece to the one in front of it, against its link
// (spacing), the nearest two pieces that aren't neighbours (bunching), the head's pace (bursts) and how far its path
// swings either side of its line (the slither).
//   node tools/foes17/chains.mjs [--kinds sandSerpent,chainCrawler] [--n 4]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const save = freshSave(); save.cheat = true;
const DT = 1 / 60, N = +opt('n', 4);
const KINDS = opt('kinds', 'sandSerpent,chainCrawler,sandSerpent@1').split(',');
const R2 = (x) => Math.round(x * 100) / 100;
function stage(kind, seed) {
  setSeed(seed);
  const [k, rank] = kind.split('@');
  const run = B.newBattle(save, { arena: 'crypt', size: 'h', a: [{ k: 'paladin', n: 1 }], b: [{ k, n: 1, rank: +rank || 0 }] });
  const w = run.world, hero = run.sides.a[0], u = run.sides.b[0];
  w.walls = []; w.pillars = [];
  hero.maxHp = hero.hp = 1e6; u.maxHp = u.hp = 1e6; hero.rootT = 1e9; hero.dmgMul = 0;
  u.x = 300; u.y = 480; u.facing = u.mvA = 0; hero.x = 1700; hero.y = 480;
  if (u.bur) u.bur.t = 1e9; // (no diving unless asked)
  return { run, w, hero, u };
}
function measure(S, secs, onT) {
  const { run, u } = S; const st = { min: 9, max: 0, bunch: 9, over: 9, piled: 0, spd: [], lat: [], n: 0 };
  for (let t = 0; t < secs; t += DT) {
    if (onT) onT(t, S);
    B.updateBattle(run, DT);
    if (t < 0.6) continue; // (settled in)
    const segs = u.segs.filter((s) => !s.dead), pcs = [u, ...segs];
    for (let i = 1; i < pcs.length; i++) {
      if (pcs[i].hidden || pcs[i - 1].hidden) continue;
      const r = Math.hypot(pcs[i].x - pcs[i - 1].x, pcs[i].y - pcs[i - 1].y) / (pcs[i].link ?? pcs[i].gap);
      st.min = Math.min(st.min, r); st.max = Math.max(st.max, r);
    }
    for (let i = 0; i < pcs.length; i++) for (let j = i + 2; j < pcs.length; j++) if (!pcs[i].hidden && !pcs[j].hidden) { const d = Math.hypot(pcs[i].x - pcs[j].x, pcs[i].y - pcs[j].y) / segs[0].gap; if (i) st.bunch = Math.min(st.bunch, d); else st.over = Math.min(st.over, d); if (i && d < 0.6) st.piled += DT; } // (links among themselves; the head over its own body)
    st.spd.push(Math.hypot(u.vx, u.vy)); st.lat.push(u.y); st.n++;
  }
  return st;
}
const SCEN = {
  straight: (S) => measure(S, 6),
  turn: (S) => measure(S, 7, (t, S2) => { if (Math.abs(t - 2.5) < DT / 2) { S2.hero.x = 200; S2.hero.y = 470; } }),
  stop: (S) => measure(S, 6, (t, S2) => { if (t > 2) { S2.u.rootT = 1; } }),
  knock: (S) => measure(S, 5, (t, S2) => { if (Math.abs(t - 2) < DT / 2) { S2.u.kx = -700; S2.u.ky = 120; } }),
  dive: (S) => { if (!S.u.def.chain.dirt) return null; return measure(S, 9, (t, S2) => { if (Math.abs(t - 1.5) < DT / 2 && S2.u.bur) S2.u.bur.t = 0; if (Math.abs(t - 1.6) < DT / 2) { S2.hero.x = 250; S2.hero.y = 250; } }); },
};
for (const kind of KINDS) {
  const S0 = stage(kind, 1); B.updateBattle(S0.run, DT);
  const sg = S0.u.segs; console.log(`${kind}: head r ${S0.u.r.toFixed(0)}, ${sg.length - 1} links r ${sg[0].r.toFixed(0)} every ${sg[0].gap.toFixed(1)}, last r ${sg[sg.length - 1].r.toFixed(0)} ${(sg[sg.length - 1].link ?? sg[0].gap).toFixed(1)} behind, body ${(sg[sg.length - 1].at ?? sg.length * sg[0].gap).toFixed(0)} long`);
  for (const [name, f] of Object.entries(SCEN)) {
    const all = []; for (let i = 0; i < N; i++) { const r = f(stage(kind, 10 + i)); if (r) all.push(r); }
    if (!all.length) continue;
    const piled = all.reduce((a, r) => a + r.piled, 0) / all.length, min = Math.min(...all.map((r) => r.min)), max = Math.max(...all.map((r) => r.max)), bunch = Math.min(...all.map((r) => r.bunch)), over = Math.min(...all.map((r) => r.over));
    const sp = all[0].spd.slice(60, 240), lo = Math.min(...sp), hi = Math.max(...sp);
    console.log(`  ${name.padEnd(9)} spacing ${R2(min)}-${R2(max)} of a link   nearest two links not side by side ${R2(bunch)} gaps, head to its body ${R2(over)}${piled ? ` (links on top of each other ${piled.toFixed(2)} s a run)` : ''}${name === 'straight' ? `   pace ${lo.toFixed(0)}-${hi.toFixed(0)} (its speed ${S0.u.def.speed})   path swing +-${((Math.max(...all[0].lat.slice(60, 300)) - Math.min(...all[0].lat.slice(60, 300))) / 2).toFixed(1)}` : ''}`);
  }
}
