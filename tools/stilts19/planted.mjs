// Lane stilts19: do the Canopy Idol's hooves stay where they are put? Its Book stage (js/preview-sim.js: a real fight
// against four heroes) stepped for a minute; every tick, a hoof that is not stepping, stomping or broken (and wasn't on
// the tick before) must be exactly where it was. Also: the furthest any stilt was stretched, and how long the steps took.
//   node tools/stilts19/planted.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const { setSeed } = await import('../../js/util.js');
const { ID, hipOf } = await import('../../js/boss-stilt.js');
const spec = PS.allSpecs(['stiltIdol']).find((s) => s.id === 'stiltIdol' && s.t === 'foe');
setSeed(11);
const S = (await import('../preview-measure.mjs')).steadyStage(spec), DT = 1 / 60;
let slid = 0, ticks = 0, planted = 0, maxStretch = 0, steps = 0, stepT = 0, prev = new Map(), air = 0, airMax = 0, when = '', over = 0;
for (let i = 0; i < 60 * 60; i++) {
  S.step(DT);
  const u = S.hero, k = u && u.si; if (!k) continue;
  ticks++; let up = 0;
  for (const L of k.legs) {
    const free = !!(L.step || L.job || L.broken), p = prev.get(L);
    if (p && p.w === S.w && !free && !p.free) { planted++; if (p.x !== L.x || p.y !== L.y) slid++; }
    if (p && p.w === S.w && p.step && !L.step) { steps++; }
    if (L.step) { stepT += DT; up++; }
    if (!L.broken) { const h = hipOf(u, k, L); const st = Math.hypot(L.x - h.x, L.y - h.y, h.z - L.z) / (ID.leg.l1 + ID.leg.l2); if (st > maxStretch) { maxStretch = st; when = (k.slam ? 'slam ' + k.slam.st : k.fall ? 'fall' : L.job ? 'stomp' : k.pose ? k.pose.kind : 'walk') + ' h ' + Math.round(k.h); } if (st > 1) over++; }
    prev.set(L, { x: L.x, y: L.y, free, step: !!L.step, w: S.w });
  }
  airMax = Math.max(airMax, up); air += up;
}
console.log(`${ticks} ticks: ${planted} hoof-ticks planted, ${slid} of them moved; ${steps} steps, ${(stepT / Math.max(1, steps)).toFixed(2)} s each; at most ${airMax} hooves stepping at once; a stilt stretched to at most ${(maxStretch * 100).toFixed(0)}% of its length (${when}), past its length on ${over} hoof-ticks`);
process.exitCode = slid ? 1 : 0;
