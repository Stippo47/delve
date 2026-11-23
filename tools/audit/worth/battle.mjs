// Battle setting: every hero (or --heroes / --shard i/n), every build (lib.mjs builds), the panel's five fights,
// --seeds seeds each (the same seeds for every build, so the builds are compared fight for fight).
//   node tools/audit/worth/battle.mjs [--seeds 40] [--shard 0/3] [--heroes a,b] [--out file.json]
// Writes per hero, build and fight: per-seed win (1 / 0.5 draw / 0) and health margin (our side's health left minus
// theirs, -1..1), and summed time, damage, taken, healing, casts per ability and the hero's damage/heal by source.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { battleFight, builds, PANEL, HERO_IDS } from './lib.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const nSeeds = +opt('seeds', 40), seed0 = +opt('seed', 9000), out = opt('out', 'battle.json');
let heroes = opt('heroes') ? opt('heroes').split(',') : HERO_IDS.slice();
const shard = opt('shard'); if (shard) { const [i, n] = shard.split('/').map(Number); heroes = heroes.filter((_, j) => j % n === i); }
const scens = opt('scens', Object.keys(PANEL).join(',')).split(',');
const OUT = { seeds: nSeeds, seed0, panel: Object.fromEntries(scens.map((s) => [s, PANEL[s].name])), heroes: {} }; let problems = 0; const t0 = Date.now();
const add = (m, src) => { for (const [k, v] of Object.entries(src)) m[k] = (m[k] || 0) + v; };
for (const h of heroes) {
  const bs = builds(h), H = OUT.heroes[h] = {};
  for (const [b, spec] of Object.entries(bs)) {
    const R = H[b] = {};
    for (const sc of scens) {
      const r = R[sc] = { win: [], margin: [], t: 0, dmg: 0, taken: 0, heal: 0, timeUp: 0, casts: {}, src: {}, hsrc: {} };
      for (let s = 0; s < nSeeds; s++) {
        let f; try { f = battleFight(h, sc, spec, seed0 + s * 101); } catch (e) { problems++; console.error(h, b, sc, s, e.stack.split('\n').slice(0, 3).join(' / ')); r.win.push(null); r.margin.push(null); continue; }
        r.win.push(f.win); r.margin.push(+f.margin.toFixed(3)); r.t += f.t; r.dmg += f.dmg; r.taken += f.taken; r.heal += f.heal; r.timeUp += f.timeUp;
        add(r.casts, f.casts); add(r.src, f.src); add(r.hsrc, f.hsrc);
      }
    }
  }
  process.stderr.write(`${h} ${((Date.now() - t0) / 1000).toFixed(0)}s; `);
}
OUT.problems = problems;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(OUT));
console.error(`\n${heroes.length} heroes, ${problems} problems, ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${out}`);
