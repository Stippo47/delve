globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const M = await import('../preview-measure.mjs'); const { setSeed } = await import('../../js/util.js'); setSeed(11);
const S = M.steadyStage({ t: 'hero', id: process.argv[2], move: 'trait', tier: 1 });
for (let i = 0; i < 8 * 30; i++) { S.step(1 / 30); if (i % 20 === 0) { const w = S.w, u = w.units.find((x) => x.kind === process.argv[2]); console.log((i / 30).toFixed(1), 'lightT', u.kit.lightT && u.kit.lightT.toFixed(2), 'act', u.act && u.act.type, 'fg', !!u.forcedGoal, 'foes', w.units.filter((o) => o.team !== u.team && !o.dead).map((o) => Math.round(Math.hypot(o.x - u.x, o.y - u.y))).join(',')); } }
