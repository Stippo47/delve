// The recorder must not change a fight: run the same fights in the same order with it off, then (another process) on.
//   node tools/audit/heroes/same-check.mjs off > a.txt ; node tools/audit/heroes/same-check.mjs on > b.txt ; diff a.txt b.txt
//   (expect no difference but the dungeon's last column: fight time when recording, all time when not)
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { battle, dungeon } = await import('./fights.mjs');
const SC = await import('./scenarios.mjs');
const { HERO_IDS } = await import('../../../js/heroes.js');
const rec = process.argv[2] === 'on', every = +(process.argv[3] || 3);
for (const hero of HERO_IDS.filter((_, i) => i % every === 0)) for (const sc of SC.SCENARIOS) {
  const tier = 1 + (HERO_IDS.indexOf(hero) % 3), seed = 1000 + SC.SCENARIOS.indexOf(sc);
  const a = sc.dungeon ? dungeon(hero, tier, 5000, rec) : battle(hero, tier, sc, seed, rec);
  console.log(hero, tier, sc.id, a.outcome, a.hpLeft.toFixed(6), (a.foeHp || 0).toFixed(6), a.t.toFixed(3));
}
