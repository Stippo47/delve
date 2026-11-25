globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js'); const { setSeed } = await import('../../js/util.js');
const M = await import('../preview-measure.mjs');
const [id, move, tier] = process.argv.slice(2); setSeed(11);
const S = M.steadyStage({ t: 'hero', id, move, tier: +tier });
for (let i = 0; i < 6 / (1 / 30); i++) { S.step(1 / 30); if (i % 15 === 0) { const w = S.w; console.log((i / 30).toFixed(1), w.units.filter((u) => !u.dead).map((u) => `${u.kind}${u.team === 'hero' ? '+' : '-'}${Math.round(u.hp)} b${Math.round(u.st.bleed || 0)}`).join(' ')); } }
