globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js'); const { setSeed } = await import('../../js/util.js');
const spec = PS.allSpecs([]).find((s) => s.t === 'status' && s.id === 'dirty');
setSeed(11); const S = (await import('../preview-measure.mjs')).steadyStage(spec);
let last = -1;
for (let i = 0; i < Math.ceil(2 * S.loop * 30) + 6; i++) { S.step(1 / 30);
  const s = S.hero, on = s && ((s.h2 || []).some((h) => h.id === 'dirty') || s.buffs.some((b) => b.id === 'dirty'));
  if (i % 6 === 0 || on !== last) { const by = S.dummies[0]; console.log(S.t.toFixed(2), 'on', on, 'paladin', s.x.toFixed(0), s.y.toFixed(0), 'digger', by.x.toFixed(0), by.y.toFixed(0), by.facing.toFixed(2), 'act', by.act && by.act.type, 'fired', S.loopsFired); last = on; } }
