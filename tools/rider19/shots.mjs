// Lane rider19: does an archer shoot the tumble troll? counts shots, and what its target is.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../js/battle.js'); const { setSeed } = await import('../../js/util.js'); const { freshSave } = await import('../../js/save.js');
setSeed(3); const save = freshSave(); save.cheat = true;
const run = B.newBattle(save, { arena: 'warren', a: [{ k: process.argv[2] || 'archer', n: 1 }], b: [{ k: process.argv[3] || 'tumbleTroll', n: 1 }] });
const w = run.world; let shots = 0; const seen = new Set();
for (let i = 0; i < 600; i++) { B.updateBattle(run, 1 / 60); for (const p of w.projectiles) if (!seen.has(p)) { seen.add(p); shots++; }
  if (i % 60 === 0) { const a = w.units.find((u) => u.kind === (process.argv[2] || 'archer')); const t = w.units.find((u) => u.kind === (process.argv[3] || 'tumbleTroll')); console.log(i / 60, 'shots', shots, 'target', a && a.target && a.target.kind, 'mode', a && a.mode, 'gap', a && t && Math.round(Math.hypot(a.x - t.x, a.y - t.y)), 'troll hp', t && Math.round(t.hp), 'ball', t && t.bould && t.bould.body && Math.round(t.bould.body.hp)); } }
