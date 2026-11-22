// Round 14 (lane S): healer hunters (the designer: "Have a higher chance to go for healer. Not hard targeting."),
// headless: in battles of hunters against a party with a healer, how much of the hunters' time is spent on the healer,
// against plain foes of the same kind of fight. Runs on the round 13 code too (for the before numbers).
//   node tools/test/hunters.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const save = freshSave(); save.cheat = true;
const DT = 1 / 60;
for (const [foe, party] of [['spiderHunter', 'paladin,archer,cleric'], ['hellhound', 'paladin,archer,cleric'], ['wolf', 'paladin,archer,cleric'], ['spiderHunter', 'tower,pyromancer,bard']]) {
  let on = 0, all = 0, wins = 0;
  for (let seed = 1; seed <= 12; seed++) {
    setSeed(seed);
    const run = B.newBattle(save, { arena: 'crypt', a: [{ k: foe, n: 4, rank: 0 }], b: party.split(',').map((k) => ({ k, n: 1, rank: 0 })) });
    const w = run.world;
    for (let t = 0; t < 30 && !run.summary; t += DT) {
      B.updateBattle(run, DT);
      for (const u of w.units) if (u.kind === foe && !u.dead && u.target && !u.target.dead) { all++; if (u.target.def.heroRole === 'support') on++; }
    }
  }
  console.log(`${foe} x4 vs ${party}: on the healer ${Math.round(100 * on / Math.max(1, all))}% of their time (1 in ${party.split(',').length} by chance)`);
}
