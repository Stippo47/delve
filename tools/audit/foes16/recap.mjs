// Re-works a worth file's "worth" column with worth.mjs's current rule (the duel cap), without fighting again.
//   node tools/audit/foes16/recap.mjs file.json
import { readFileSync, writeFileSync } from 'node:fs';
const CAP = 1.6, f = process.argv[2], d = JSON.parse(readFileSync(f, 'utf8'));
const g = (xs) => Math.exp(xs.reduce((a, x) => a + Math.log(Math.max(1e-3, x)), 0) / xs.length), r2 = (x) => Math.round(x * 100) / 100;
for (const r of d.rows) r.worth = r.helper ? r2(g([Math.max(0.05, r.mixP), Math.min(CAP, r.mixD)]) * (r.partnerWorth || 1)) : r2(g([r.panel, Math.min(CAP, r.duel)]));
writeFileSync(f, JSON.stringify(d, null, 1));
