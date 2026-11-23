// Dungeon setting (tools/ability-worth.mjs widened to every build): per hero, --n parties (the hero and two random
// others, every dungeon in turn, the same parties and seeds as ability-worth's draw), each party played once per build
// from the same seed. Bare runs at rank 1; the other two heroes have all three abilities at III.
//   node tools/audit/worth/dungeon.mjs [--n 32] [--shard 0/3] [--heroes a,b] [--out file.json]
// Writes per hero and build: per-run rooms cleared and won, and summed seconds, hero damage, hero downs, party damage
// taken, healing and downs, casts per ability and the hero's damage/heal by source.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { dungeonRun, builds, HERO_IDS, THEME_IDS } from './lib.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 32), seed0 = +opt('seed', 1), out = opt('out', 'dungeon.json'), only = opt('builds') ? opt('builds').split(',') : null;
let heroes = opt('heroes') ? opt('heroes').split(',') : HERO_IDS.slice();
const shard = opt('shard'); if (shard) { const [i, k] = shard.split('/').map(Number); heroes = heroes.filter((_, j) => j % k === i); }
const OUT = { n, seed0, heroes: {} }; let problems = 0; const t0 = Date.now();
const add = (m, src) => { for (const [k, v] of Object.entries(src)) m[k] = (m[k] || 0) + v; };
for (const lead of heroes) {
  const bs = builds(lead), H = OUT.heroes[lead] = {};
  for (const b of Object.keys(bs)) if (!only || only.includes(b)) H[b] = { rooms: [], won: [], secs: 0, dmg: 0, hdowns: 0, taken: 0, heal: 0, downs: 0, casts: {}, src: {}, hsrc: {} };
  // the same draw as tools/ability-worth.mjs at tier 3
  let rs = (seed0 * 7919 + 3 * 31 + HERO_IDS.indexOf(lead) * 104729) & 0x7fffffff; const rnd = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const parties = [];
  for (let i = 0; i < n; i++) {
    const others = HERO_IDS.filter((k) => k !== lead), party = [lead];
    while (party.length < 3) party.push(others.splice(Math.floor(rnd() * others.length), 1)[0]);
    const theme = THEME_IDS[(i + seed0) % THEME_IDS.length], sd = seed0 * 1000003 + i * 7919 + HERO_IDS.indexOf(lead) * 131;
    parties.push(party.join(',') + '@' + theme);
    for (const b of Object.keys(H)) {
      const r = H[b];
      let f; try { f = dungeonRun(lead, party, theme, bs[b], sd); } catch (e) { problems++; console.error(lead, b, i, e.stack.split('\n').slice(0, 3).join(' / ')); r.rooms.push(null); r.won.push(null); continue; }
      r.rooms.push(f.rooms); r.won.push(f.won);
      for (const m of ['secs', 'dmg', 'hdowns', 'taken', 'heal', 'downs']) r[m] += f[m];
      add(r.casts, f.casts); add(r.src, f.src); add(r.hsrc, f.hsrc);
    }
  }
  H._parties = parties;
  process.stderr.write(`${lead} ${((Date.now() - t0) / 1000).toFixed(0)}s; `);
}
OUT.problems = problems;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(OUT));
console.error(`\n${heroes.length} heroes, ${problems} problems, ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${out}`);
