globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js'); const { setSeed } = await import('../../js/util.js');
setSeed(11); const S = PS.makeStage({ t: 'trinket', id: 'boneCharm' });
for (let i = 0; i < 150; i++) { const n = S.w.units.length; S.step(1 / 30); if (i % 15 === 0) console.log(S.t.toFixed(2), S.w.units.map((u) => u.kind + (u.dead ? 'X' : '') + (u.gone ? 'g' : '')).join(','), 'fires', S.fires); }
