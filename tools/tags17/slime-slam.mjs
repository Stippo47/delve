// Round 17 (lane tags17): slimes against heroes whose abilities slam (Tower, Warhelm) or gas (Plague Doctor), tier III,
// before and after the height layers. node tools/tags17/slime-slam.mjs [root]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { pathToFileURL } = await import('node:url');
const root = process.argv[2] || '.', u = (p) => pathToFileURL(root + '/' + p).href;
const { newBattle, updateBattle } = await import(u('js/battle.js'));
const { freshSave } = await import(u('js/save.js'));
const { setSeed } = await import(u('js/util.js'));
const save = freshSave(); save.cheat = true;
for (const [hero, foes] of [['tower', 'slime'], ['warhelm', 'slime'], ['plague', 'slime'], ['tower', 'slimeBig'], ['plague', 'slimePoison']]) {
  let wins = 0, t = 0, left = 0; const N = 16;
  for (let s = 0; s < N; s++) { setSeed(900 + s); const run = newBattle(save, { arena: 'crypt', a: [{ k: hero, n: 1, tier: 3 }], b: [{ k: foes, n: 3 }] });
    let tt = 0; while (run.phase === 'fight' && tt < 120) { updateBattle(run, 1 / 60); tt += 1 / 60; }
    t += tt; if (run.winner === 'a') wins++; const h = run.sides.a[0]; left += h.dead || h.downed ? 0 : h.hp / h.maxHp; }
  console.log(`${hero} III vs ${foes}*3: hero wins ${wins}/${N}, ${(t / N).toFixed(1)} s a fight, hero health left ${(100 * left / N).toFixed(0)}%`);
}
process.exit(0);
