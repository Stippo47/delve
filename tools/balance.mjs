// Balance batches in Node (no browser). The designer, round 11: "stress test every unit with every ability at lvl 1
// then at lvl 3 (only abilities no trinkets or other upgrades) with random party members multiple times in a row in
// different dungeons to see if the layout is balanced."
//   node tools/balance.mjs --tier 1 [--reps 3] [--size 3] [--rank 0] [--seed 1] [--themes all] [--heroes a,b] [--out file.json] [--cap 900]
// Every hero in turn leads a party with --size-1 random others; everyone has all three abilities at --tier and nothing
// else (no trinkets, no potions, no other skill nodes). Each party plays every dungeon --reps times, each dungeon at
// the strength, numbers and elite odds of dungeon number --rank (0 the Wildwood, 1 the Warren...), so the dungeons differ
// only in what lives in them. A hero's numbers count every run it was in, as the lead or as a random member.
//   rooms: rooms the party got through (how much a hero helps a party is rooms against the average)
//   dmg / heal / taken: the hero's share of its party's damage, healing and damage taken (a third each would be even)
//   downs: times it went down a run;  src: where its damage came from
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const tier = +opt('tier', 1), reps = +opt('reps', 3), size = +opt('size', 3), rank = +opt('rank', 0), seed0 = +opt('seed', 1), cap = +opt('cap', 900);
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const fs = await import('node:fs');
const { newRun, update, summarize } = await import('../js/dungeon.js');
const { setSeed } = await import('../js/util.js');
const { THEME_IDS } = await import('../js/themes.js');
const { HEROES, HERO_IDS } = await import('../js/heroes.js');
const { freshSave } = await import('../js/save.js');
const DT = 1 / 60;
const themes = opt('themes', 'all') === 'all' ? THEME_IDS : opt('themes').split(',');
const leads = opt('heroes', '') ? opt('heroes').split(',') : HERO_IDS;
let rs = seed0 * 7919 + tier; const rnd = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

function buildSave(party) {
  const s = freshSave();
  for (const k of party) {
    const h = s.heroes[k]; h.owned = true; h.level = 1; h.trinkets = []; h.nodes = {};
    for (const ab of HEROES[k].abilities) for (let i = 1; i <= tier; i++) h.nodes[ab.id + i] = 1;
  }
  s.party = party.slice(); s.trinkets = []; s.potions = 0; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true };
  return s;
}
const blank = () => ({ n: 0, lead: 0, rooms: 0, secs: 0, dmg: 0, heal: 0, taken: 0, downs: 0, kills: 0, rawDmg: 0, rawHeal: 0, rawTaken: 0, src: {}, by: {} });
const H = Object.fromEntries(HERO_IDS.map((k) => [k, blank()]));
const T = Object.fromEntries(themes.map((t) => [t, { n: 0, rooms: 0, secs: 0, wipes: 0 }]));
let runs = 0, bad = 0, allRooms = 0;
// --merge a.json,b.json: add up batches run side by side (each with its own --heroes) and print the one table
if (opt('merge')) {
  for (const f of opt('merge').split(',')) {
    const d = JSON.parse(fs.readFileSync(f, 'utf8')); runs += d.runs; bad += d.bad; allRooms += d.allRooms;
    for (const [k, h] of Object.entries(d.heroes)) { const t = H[k] || (H[k] = blank());
      for (const f2 of ['n', 'lead', 'rooms', 'secs', 'dmg', 'heal', 'taken', 'downs', 'kills', 'rawDmg', 'rawHeal', 'rawTaken']) t[f2] += h[f2];
      for (const [x, v] of Object.entries(h.src)) t.src[x] = (t.src[x] || 0) + v;
      for (const [x, v] of Object.entries(h.by)) { const o = t.by[x] || (t.by[x] = { n: 0, rooms: 0 }); o.n += v.n; o.rooms += v.rooms; } }
    for (const [k, v] of Object.entries(d.themes)) { const t = T[k] || (T[k] = { n: 0, rooms: 0, secs: 0, wipes: 0 }); for (const f2 of ['n', 'rooms', 'secs', 'wipes']) t[f2] += v[f2]; }
  }
} else
for (const lead of leads) for (const theme of themes) for (let r = 0; r < reps; r++) {
  const others = HERO_IDS.filter((k) => k !== lead), party = [lead];
  while (party.length < size) party.push(others.splice(Math.floor(rnd() * others.length), 1)[0]);
  setSeed(seed0 + runs * 7919);
  let run, t = 0, err = null;
  try {
    run = newRun(buildSave(party), { theme, party, asRank: rank, bare: true });
    while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < cap) { update(run, DT); t += DT; }
  } catch (e) { err = e; }
  runs++;
  if (err || !run) { bad++; console.log(`  ERROR ${theme} ${party.join(',')}: ${err && err.stack.split('\n').slice(0, 3).join(' | ')}`); continue; }
  const S = summarize(run).stats, done = Math.max(0, run.rooms - (run.phase === 'lost' ? 1 : 0));
  const tot = { dmg: 0, heal: 0, taken: 0 };
  for (const k of party) { tot.dmg += S.heroes[k].dmg; tot.heal += S.heroes[k].heal; tot.taken += S.heroes[k].taken; }
  for (const k of party) {
    const h = H[k], s = S.heroes[k];
    h.n++; if (k === lead) h.lead++; h.rooms += done; h.secs += t; h.downs += s.downs; h.kills += s.kills;
    h.dmg += tot.dmg ? s.dmg / tot.dmg : 0; h.heal += tot.heal ? s.heal / tot.heal : 0; h.taken += tot.taken ? s.taken / tot.taken : 0;
    h.rawDmg += s.dmg / t; h.rawHeal += s.heal / t; h.rawTaken += s.taken / t;
    for (const [src, v] of Object.entries(s.src.dmg)) h.src[src] = (h.src[src] || 0) + v;
    const b = h.by[theme] || (h.by[theme] = { n: 0, rooms: 0 }); b.n++; b.rooms += done;
  }
  const tt = T[theme]; tt.n++; tt.rooms += done; tt.secs += t; if (run.phase === 'lost') tt.wipes++;
  allRooms += done;
}
const mean = allRooms / Math.max(1, runs - bad);
const pct = (x) => (100 * x).toFixed(0).padStart(3) + '%';
console.log(`tier ${tier}, parties of ${size}, every dungeon at rank ${rank}: ${runs} runs, ${bad} errors, ${mean.toFixed(2)} rooms a run on average`);
console.log('dungeons: ' + themes.filter((t) => T[t].n).map((t) => `${t} ${(T[t].rooms / Math.max(1, T[t].n)).toFixed(1)} rooms`).join(', '));
{ // by role: what the designer asked about (tanks take it, shooters deal it)
  const R = {}; for (const k of HERO_IDS) { const h = H[k]; if (!h.n) continue; const r = R[HEROES[k].role] || (R[HEROES[k].role] = { n: 0, rooms: 0, dmg: 0, heal: 0, taken: 0, downs: 0 }); r.n += h.n; r.rooms += h.rooms; r.dmg += h.dmg; r.heal += h.heal; r.taken += h.taken; r.downs += h.downs; }
  for (const [r, v] of Object.entries(R)) console.log(`  ${r.padEnd(9)} rooms ${(v.rooms / v.n).toFixed(2)}  damage ${pct(v.dmg / v.n)}  healing ${pct(v.heal / v.n)}  taken ${pct(v.taken / v.n)}  downs ${(v.downs / v.n).toFixed(2)}`);
}
console.log('hero          role      runs  rooms  vs avg   dmg  heal taken  downs  dmg/s  top sources of its damage');
const rows = HERO_IDS.filter((k) => H[k].n).map((k) => ({ k, ...H[k], avg: H[k].rooms / H[k].n })).sort((a, b) => b.avg - a.avg);
for (const h of rows) {
  const srcTot = Object.values(h.src).reduce((a, b) => a + b, 0) || 1;
  const top = Object.entries(h.src).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, v]) => `${s.replace('ab:', '').replace('st:', '~')} ${Math.round(100 * v / srcTot)}%`).join(', ');
  console.log(`${h.k.padEnd(13)} ${HEROES[h.k].role.padEnd(9)} ${String(h.n).padStart(4)}  ${h.avg.toFixed(2).padStart(5)}  ${((h.avg - mean) >= 0 ? '+' : '') + (h.avg - mean).toFixed(2).padStart(5)}  ${pct(h.dmg / h.n)}  ${pct(h.heal / h.n)}  ${pct(h.taken / h.n)}  ${(h.downs / h.n).toFixed(2).padStart(5)}  ${(h.rawDmg / h.n).toFixed(1).padStart(5)}  ${top}`);
}
if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify({ tier, size, rank, runs, bad, mean, allRooms, heroes: H, themes: T }));
process.exit(bad ? 1 : 0);
