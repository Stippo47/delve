globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js'); const { setSeed } = await import('../../js/util.js');
const [t, id, move, tier] = process.argv.slice(2); setSeed(11);
const S = PS.makeStage(move ? { t, id, move, tier: +tier } : { t, id });
for (let i = 0; i < Math.ceil(4 * S.loop * 30); i++) S.step(1 / 30);
console.log(PS.specKey(S.spec), 'loops', S.loops, 'fired', S.loopsFired);
