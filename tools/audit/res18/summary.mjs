// Round 18, lane res18: bench.mjs's four outputs as one table: each hero's main status landed in each dungeon, as a
// share of what it lands when nothing resists (none), today / proposed base / proposed with every call. And its damage.
//   node tools/audit/res18/summary.mjs > tools/audit/res18/summary.txt
import { readFileSync, readdirSync } from 'node:fs';
const dir = 'tools/audit/res18/';
const rows = readdirSync(dir).filter((f) => /^bench-.*\.json$/.test(f)).flatMap((f) => JSON.parse(readFileSync(dir + f, 'utf8')).rows);
const D = ['wildwood', 'warren', 'sewers', 'crypt', 'frost', 'ember', 'spire', 'dunes', 'foundry'];
const pct = (a, b) => (b > 0 ? Math.round(a / b * 100) : '-');
for (const metric of ['landed', 'dps']) {
  console.log(`\n${metric === 'landed' ? 'main status landed' : 'damage a second'}, % of "nothing resists": today / base / all calls`);
  console.log('hero (status)'.padEnd(22) + D.map((d) => d.padEnd(13)).join(''));
  const heroes = [...new Set(rows.map((r) => r.hero))];
  for (const h of heroes) {
    const st = rows.find((r) => r.hero === h).status;
    console.log(`${h} (${st})`.padEnd(22) + D.map((d) => { const r = rows.find((x) => x.hero === h && x.dungeon === d); if (!r) return ''.padEnd(13);
      return `${pct(r.now[metric], r.none[metric])}/${pct(r.prop[metric], r.none[metric])}/${pct(r.propc[metric], r.none[metric])}`.padEnd(13); }).join(''));
  }
}
