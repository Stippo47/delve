// Round 17, lane foes16: how many elites and majors a room's first lot holds, and what the lot is worth, by dungeon,
// floor and room (dungeon.js takeRanks, eliteP, majorP). Builds rooms only (no fighting).
//   node tools/audit/foes16/ranks.mjs [--n 300]
import { D, freshSave, setSeed, opt } from './lib.mjs';
const N = +opt('n', 300);
const save = freshSave(); for (const k of ['paladin', 'archer', 'cleric', 'twinfang']) save.heroes[k].owned = true; save.party = ['paladin', 'archer', 'cleric', 'twinfang'];
const costOf = (u) => (u.def.cost ?? 3) * (u.major ? 7 : u.elite ? 3 : 1);
// newRun builds a floor's first room; the odds for the later rooms are read off eliteP / majorP
for (const theme of ['wildwood', 'warren', 'sewers', 'foundry']) for (const floor of [1, 2, 3]) {
  const b = { foes: 0, elite: 0, major: 0, worth: 0, owed: 0 };
  for (let i = 0; i < N; i++) {
    setSeed(1000 + i);
    const run = D.newRun(save, { theme, party: save.party, floor });
    const es = run.world.units.filter((u) => u.team === 'enemy');
    b.foes += es.length / N; b.elite += es.filter((u) => u.elite && !u.major).length / N; b.major += es.filter((u) => u.major).length / N;
    b.worth += es.reduce((a, u) => a + costOf(u), 0) / N; b.owed += ((run.world.waves && run.world.waves.owed) || 0) / N;
  }
  const odds = [0, 1, 2, 3, 4, 5].map((L) => `${(100 * D.eliteP({ theme, floor, depth: 1 }, L)).toFixed(1)}/${(100 * D.majorP({ theme, floor, depth: 1 }, L)).toFixed(1)}`).join(' ');
  console.log(`${theme} floor ${floor}, room 1 (${N} rooms): ${b.foes.toFixed(2)} foes, elites ${b.elite.toFixed(3)}, majors ${b.major.toFixed(3)}, points ${b.worth.toFixed(1)}, owed to the waves ${b.owed.toFixed(2)} | elite/major % by room 1-6: ${odds}`);
}
