// Picks the abilities the proposals are tried on, from today's summary (analyze.mjs --out), and writes the --rules file
// run.mjs takes: an ability is picked when one of its lasting effects (not a debuff on an enemy) lasts 2s or more and,
// at some tier, is ready again by the time it ends at least half the time, or is up at least half the fight.
//   node tools/audit/cooldowns/rules.mjs summary-today.json rules.json
import { readFileSync, writeFileSync } from 'node:fs';
const [inp, out] = process.argv.slice(2);
const { rows } = JSON.parse(readFileSync(inp, 'utf8'));
const pick = {};
for (const r of rows) {
  if (r.cls === 'foe' || !(r.durRaw >= 2) || r.casts < 8) continue;
  if (!((r.ready ?? 0) >= 0.5 || r.uptime >= 0.5)) continue;
  const p = pick[r.ab];
  if (!p || (r.cls === 'state' && p.cls !== 'state') || (p.cls !== 'state' && r.uptime > p.up)) pick[r.ab] = { cls: r.cls, up: r.uptime, hero: r.hero };
}
const add = {};
for (const r of rows) if (pick[r.ab] && pick[r.ab].cls === r.cls && r.durRaw != null) (add[r.ab] || (add[r.ab] = {}))[r.tier] = +r.durRaw.toFixed(2);
const only = Object.keys(pick), cls = Object.fromEntries(only.map((k) => [k, pick[k].cls]));
writeFileSync(out, JSON.stringify({ only, cls, add, heroes: [...new Set(only.map((k) => pick[k].hero))] }, null, 1));
console.log(only.length, 'abilities:', only.map((k) => `${pick[k].hero}.${k}[${pick[k].cls}]`).join(' '));
