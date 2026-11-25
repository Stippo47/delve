// Prints a worth file as a table: node tools/audit/foes16/show.mjs worth.json [previous.json] [--out-of 0.8,1.25]
import { readFileSync } from 'node:fs';
const oi0 = process.argv.indexOf('--out-of'), pos = process.argv.slice(2).filter((a, i) => !a.startsWith('--') && i + 2 !== oi0 + 1);
const [f, g] = pos;
const rows = JSON.parse(readFileSync(f, 'utf8')).rows, prev = g ? Object.fromEntries(JSON.parse(readFileSync(g, 'utf8')).rows.map((r) => [r.k, r])) : {};
const oi = process.argv.indexOf('--out-of'), band = oi > 0 ? process.argv[oi + 1].split(',').map(Number) : null;
let n = 0, inBand = 0;
for (const r of rows) {
  n++; if (r.worth >= 0.8 && r.worth <= 1.25) inBand++;
  if (band && r.worth >= band[0] && r.worth <= band[1]) continue;
  const p = prev[r.k];
  console.log([r.home.slice(0, 7).padEnd(7), r.k.padEnd(14), String(r.cost).padEnd(4), r.helper ? 'H' : ' ', String(r.worth).padEnd(5), p ? '(was ' + String(p.worth).padEnd(5) + ')' : '', 'panel', String(r.panel).padEnd(5), 'duel', String(r.duel).padEnd(5), 'mixP', String(r.mixP).padEnd(5), 'mixD', r.mixD].join(' '));
}
console.log(`${inBand} of ${n} within 0.80-1.25`);
