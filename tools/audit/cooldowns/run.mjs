// The batch: every hero (or --heroes a,b), tiers I-III, the three scenarios, --seeds seeds each, under a cooldown rule.
//   node tools/audit/cooldowns/run.mjs [--rule today|a|b] [--rules file.json] [--heroes a,b] [--seeds 6] [--out path] [--shard i/n]
// --rules: { only: [abilityId...], add: { abilityId: seconds }, cls: { abilityId: cls }, keys: { abilityId: [compKey...] } }
// (what rule a and b act on; see lib.mjs setRule). Writes the raw fights as JSON.
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fight, setRule, HERO_IDS, SCENARIOS } from './lib.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const rule = opt('rule', 'today'), nSeeds = +opt('seeds', 6), out = opt('out', `docs/audit/data/cooldowns/raw-${rule}.json`);
let heroes = opt('heroes') ? opt('heroes').split(',') : HERO_IDS.slice();
const shard = opt('shard'); if (shard) { const [i, n] = shard.split('/').map(Number); heroes = heroes.filter((_, j) => j % n === i); }
const tiers = (opt('tiers', '1,2,3')).split(',').map(Number), scen = opt('scenarios', Object.keys(SCENARIOS).join(',')).split(',');
if (rule !== 'today') setRule(rule, JSON.parse(readFileSync(opt('rules'), 'utf8')));
const fights = []; let problems = 0; const t0 = Date.now();
for (const h of heroes) {
  for (const tier of tiers) for (const sc of scen) for (let s = 0; s < nSeeds; s++) {
    try { fights.push(fight(h, tier, sc, 1000 + s)); } catch (e) { problems++; console.error(h, tier, sc, s, e.stack.split('\n').slice(0, 3).join(' / ')); }
  }
  process.stderr.write(h + ' ');
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ rule, seeds: nSeeds, tiers, scenarios: scen, fights }));
console.error(`\n${fights.length} fights, ${problems} problems, ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${out}`);
