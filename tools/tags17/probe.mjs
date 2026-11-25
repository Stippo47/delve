globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newBattle, updateBattle } = await import('../../js/battle.js'); const { freshSave } = await import('../../js/save.js');
const save = freshSave(); save.cheat = true;
const run = newBattle(save, { arena: 'crypt', a: [{ k: 'pyromancer', n: 1 }], b: [{ k: 'imp', n: 1 }] });
const w = run.world, i = w.units.find((u) => u.kind === 'imp');
for (let f = 0; f < 30; f++) { updateBattle(run, 1 / 60); }
console.log('imp rootT', i.rootT, 'tangle', i.st.entangle, 'buffs', i.buffs.map((b) => b.id), 'h2', (i.h2 || []).map((h) => h.id), 'phase', run.phase);
process.exit(0);
