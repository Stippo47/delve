// Puts worth files of the same prices on different dice together: each measure is the geometric mean over the files
// whose row for that kind has the same cost, health and hit as the last file's (else the last file's alone).
//   node tools/audit/foes16/combine.mjs out.json a.json b.json [...]
import { readFileSync, writeFileSync } from 'node:fs';
const [out, ...files] = process.argv.slice(2);
const sets = files.map((f) => Object.fromEntries(JSON.parse(readFileSync(f, 'utf8')).rows.map((r) => [r.k, r])));
const last = sets[sets.length - 1], same = (a, b) => a && a.cost === b.cost && a.hp === b.hp && (a.hitMul || 1) === (b.hitMul || 1);
const g = (xs) => Math.exp(xs.reduce((a, x) => a + Math.log(Math.max(1e-3, x)), 0) / xs.length), r2 = (x) => Math.round(x * 100) / 100;
const rows = Object.values(last).map((r) => {
  const like = sets.map((s) => s[r.k]).filter((x) => same(x, r));
  const o = { ...r, sets: like.length };
  for (const m of ['panel', 'duel', 'worth', 'partnerWorth']) if (r[m] != null) o[m] = r2(g(like.map((x) => x[m])));
  for (const m of ['mixP', 'mixD']) o[m] = r2(like.reduce((a, x) => a + x[m], 0) / like.length);
  return o;
});
writeFileSync(out, JSON.stringify({ combined: files, rows }, null, 1));
console.log('wrote', out, rows.filter((r) => r.sets > 1).length, 'of', rows.length, 'kinds from more than one set');
