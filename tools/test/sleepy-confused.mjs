// Round 14 (lane S): Sleepy's wind-ups and Confused's turning and Addled's abilities, headless numbers. Runs on the
// round 13 code too (the before numbers).
//   Sleepy ("Should make all wind ups like 40% longer too. Anything charged up")
//   Confused ("Should also make them turn randomly. Instead of using all abilities at once, will have a chance to
//   trigger randomly while bursted.")
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const S = await import('../../js/sim.js');
const { initKit } = await import('../../js/kits.js');
const { tierBuild } = await import('../../js/heroes.js');
const { setSeed } = await import('../../js/util.js');
const DT = 1 / 60;
const dummy = (w, x, y) => { const h = S.spawn(w, 'paladin', x, y, { level: 20 }); h.invulnT = 1e9; h.stunT = 1e9; return h; };

console.log('Sleepy: how long a wind-up takes (s), awake / sleepy 99 (just short of the burst) / sleepy 50');
for (const [what, setup, done] of [
  ['rattler swing (wind-up 0.4 s)', (w, h) => { const e = S.spawn(w, 'rattler', h.x + 70, h.y, { mult: 1 }); e.aggro = true; e.target = h; e.facing = Math.PI; return e; }, (e) => e.act && e.act.type === 'windup'],
  ['banshee wail (a cone, 0.6 s tell)', (w, h) => { const e = S.spawn(w, 'banshee', h.x + 150, h.y, { mult: 1 }); e.aggro = true; e.target = h; e.facing = Math.PI; e.el = { wail: 0 }; return e; }, (e, w) => w.danger.some((z) => z.src === e && z.t > 0)],
  ['orc charge (0.45 s tell)', (w, h) => { const e = S.spawn(w, 'orc', h.x + 200, h.y, { mult: 1 }); e.aggro = true; e.target = h; e.facing = Math.PI; e.abilT = 0; return e; }, (e) => e.act && e.act.type === 'chargeTell'],
]) {
  const out = [];
  for (const sl of [0, 99, 50]) {
    const lens = [];
    for (const seed of [1, 2, 3, 4]) {
      setSeed(seed);
      const w = S.makeWorld(1000, 480), h = dummy(w, 300, 240), e = setup(w, h);
      let on = null, len = null;
      for (let t = 0; t < 12 && len == null; t += DT) { e.st.sleepy = sl; e.sleepyImmuneT = 0; S.step(w, DT); const d = done(e, w); if (d && on == null) on = t; if (!d && on != null) len = t - on; }
      if (len != null) lens.push(len);
    }
    out.push(lens.length ? (lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(2) : '-');
  }
  console.log(`  ${what}: ${out.join(' / ')}`);
}
{ // a hero's charged shot: the Archer's Barrage (the bow drawn back for 0.4 s, then the fan)
  const out = [];
  for (const sl of [0, 99]) {
    setSeed(5);
    const w = S.makeWorld(1000, 480), t0 = dummy(w, 600, 240), a = S.spawn(w, 'archer', 300, 240, { level: 20 });
    initKit(a, 'archer', { nodes: tierBuild('archer', 3) }, 20); a.target = t0;
    const { ABILITIES } = await import('../../js/kits.js');
    ABILITIES.barrage.use(w, a, t0, 3);
    let t = 0; const n0 = w.projectiles.length;
    for (; t < 3 && w.projectiles.length <= n0; t += DT) { a.st.sleepy = sl; S.step(w, DT); }
    out.push(t.toFixed(2));
  }
  console.log(`  Archer's Barrage, draw to loose: ${out.join(' / ')}`);
}

console.log('Confused (60, held there): turns in 10 s, and the share of the time it spends turned away from its target');
for (const seed of [1, 2, 3]) {
  setSeed(seed);
  const w = S.makeWorld(1400, 600), h = dummy(w, 300, 300), e = S.spawn(w, 'rattler', 700, 300, { mult: 1 }); e.aggro = true; e.target = h;
  let turns = 0, was = false, away = 0, n = 0;
  for (let t = 0; t < 10; t += DT) {
    e.st.confuse = 60; e.confuseImmuneT = 0; S.step(w, DT);
    const on = e.lurchT > 0 || e.faceLockT > 0.45; if (on && !was) turns++; was = on;
    n++; const want = Math.atan2(h.y - e.y, h.x - e.x); let d = Math.abs(e.facing - want) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d; if (d > 1.2) away++;
  }
  console.log(`  seed ${seed}: ${turns} turns, facing away ${Math.round(100 * away / n)}% of the time`);
}
console.log('Addled: when its abilities go off (an Archer, tier III, every ability ready, then addled)');
for (const seed of [1, 2, 3]) {
  setSeed(seed);
  const w = S.makeWorld(1400, 600), d = dummy(w, 900, 300), a = S.spawn(w, 'archer', 500, 300, { level: 20 });
  initKit(a, 'archer', { nodes: tierBuild('archer', 3) }, 20); a.target = d;
  for (const k in a.kit.cd) a.kit.cd[k] = 0;
  const seen = {}, at = [];
  S.addStatus(w, a, 'confuse', 999, d);
  for (let t = 0; t < 4.5; t += DT) { for (const k in a.kit.cd) { if (a.kit.cd[k] > (seen[k] ?? 0) + 0.5) at.push(k + '@' + t.toFixed(1)); seen[k] = a.kit.cd[k]; } S.step(w, DT); }
  console.log(`  seed ${seed}: ${at.join(' ') || 'none'}`);
}
