// does stepping other stages first change a hero ability's measure? node tools/preview18b/leak.mjs foe|status [kind]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const [t, only, mv] = process.argv.slice(2);
const PS = await import('../../js/preview-sim.js');
const M = await import('../preview-measure.mjs');
const { setSeed } = await import('../../js/util.js');
const sig = () => JSON.stringify(M.measureAbility('granny', 'oldBones', 1).map((r) => [r.reached, r.sig]));
const a = sig();
const kinds = PS.foeGroups().flatMap((g) => g.kinds);
for (const s of PS.allSpecs(kinds).filter((s) => s.t === t && (!only || s.id === only) && (!mv || s.move === mv))) { setSeed(11); const S = PS.makeStage(s); for (let i = 0; i < 2 * S.loop * 30 + 6; i++) S.step(1 / 30); }
const b = sig();
console.log(a === b ? 'same' : 'DIFFERENT\n' + a + '\n' + b);
