// Round 16 fixes (docs/audit/fixes16.md): plain checks of the five bugs the audit found, each printed as one line.
//   node tools/audit/fixes16/bugs.mjs
// 1 and 2 have their own audit checks too: tools/audit/heroes/vanish-check.mjs and queue-check.mjs.
//   3. a lob's damage counts for its thrower: Frost Shamans (they only lob) against a Paladin, the Shamans' row's damage
//   4. a side of only Saw Blades: the battle page refuses it (setupProblem)
//   5. one seed is one fight: the same setup and seed twice in one process, with a different fight between them
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../../js/battle.js');
const { setSeed } = await import('../../../js/util.js');
const { freshSave } = await import('../../../js/save.js');
const save = freshSave(); save.cheat = true;
const DT = 1 / 60;
function play(setup, seed, limit = 120) {
  setSeed(seed);
  const run = B.newBattle(save, setup); let h = 0;
  while (run.phase === 'fight' && run.t < limit) {
    B.updateBattle(run, DT);
    for (const u of run.world.units) { if (u.kind === 'shadowClone') run.clones = (run.clones || 0) + DT; } // (seconds of shadow clones: the Shade's fight should have some)
    for (const u of run.world.units) h = (h * 31 + u.id * 7 + Math.round(u.x * 100) + Math.round(u.y * 100) * 3 + Math.round(u.hp * 100)) % 1000000007; // every unit, every frame
  }
  run.check = h;
  return run;
}
const sig = (run) => `${run.winner} t=${run.t.toFixed(4)} check=${run.check}${run.clones ? ' clones ' + run.clones.toFixed(1) + ' s' : ''}`;

// 3
{
  let dmg = 0, taken = 0;
  for (let i = 0; i < 6; i++) {
    const run = play({ arena: 'crypt', scaled: false, a: [{ k: 'paladin', n: 1, tier: 1 }], b: [{ k: 'frostShaman', n: 3, rank: 1 }] }, 40 + i, 30);
    const S = run.world.stats.rows; dmg += S[B.keyOf('b', { k: 'frostShaman', rank: 1 })].dmg; taken += S[B.keyOf('a', { k: 'paladin', tier: 1 })].taken;
  }
  console.log(`3. lobs: Frost Shamans' row dealt ${Math.round(dmg)}, the Paladin's row took ${Math.round(taken)} (6 fights of 30 s)`);
}
// 4
{
  const p = B.setupProblem({ a: [{ k: 'sawBlade', n: 3 }], b: [{ k: 'paladin', n: 1 }] });
  const q = B.setupProblem({ a: [{ k: 'sawBlade', n: 3 }, { k: 'rat', n: 2 }], b: [{ k: 'paladin', n: 1 }] });
  console.log(`4. saw blades alone: ${JSON.stringify(p)}; saw blades with rats: ${JSON.stringify(q)}`);
}
// 5 (the Shade too: its shadow clone's spin used Math.random, not the seeded rand)
for (const [a, b] of [[[{ k: 'archer', n: 1, tier: 2 }, { k: 'paladin', n: 1, tier: 2 }], [{ k: 'rat', n: 8 }, { k: 'wolf', n: 2 }]], [[{ k: 'shade', n: 1, tier: 3 }], [{ k: 'golem', n: 2, rank: 2 }]]]) {
  const setup = { arena: 'crypt', scaled: false, a, b };
  const one = sig(play(setup, 7, 40));
  play({ arena: 'crypt', scaled: false, a: [{ k: 'monk', n: 1, tier: 1 }], b: [{ k: 'skeleton', n: 5 }] }, 99, 20);
  const two = sig(play(setup, 7, 40));
  console.log(`5. ${a.map((s) => s.k).join('+')} vs ${b.map((s) => s.k).join('+')}, same seed twice: ${one === two ? 'identical' : 'DIFFERENT'} (${one} | ${two})`);
}
