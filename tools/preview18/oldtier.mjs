// the round 14 check's tier measure (two tiers making the same count of effects, shots, units, zones), on today's stage
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js'); const { setSeed } = await import('../../js/util.js'); const { HEROES } = await import('../../js/heroes.js');
const DT = 1 / 30; let same = 0;
for (const id of Object.keys(HEROES)) for (const ab of HEROES[id].abilities) {
  const sigs = [1, 2, 3].map((tier) => { setSeed(11); const S = PS.makeStage({ t: 'hero', id, move: ab.id, tier }); for (let i = 0; i < Math.ceil(S.loop / DT) - 1; i++) S.step(DT); return JSON.stringify(S.sig); });
  if (sigs[0] === sigs[1] || sigs[1] === sigs[2]) { same++; if (process.argv.includes('--list')) console.log('  ' + id + ':' + ab.id); }
}
console.log('tier steps that make the same things (the round 14 measure): ' + same);
