// Round 16 (the balance audit, lane audit-heroes): every hero, every ability, tiers I-III, through the fixed scenarios
// in scenarios.mjs, with recorder.mjs counting what each part of the kit does. Measures only.
//   node tools/audit/heroes/run.mjs [--heroes all|paladin,archer] [--tiers 1,2,3] [--seeds 8] [--dseeds 6]
//        [--scen all|duelMelee,swarm,...] [--jobs 3] [--out docs/audit/data/heroes]
//     runs each hero in its own node process, up to --jobs at once, and writes one JSON per hero
//   add --fairEnd (and --scen without the dungeon, --out elsewhere) for the what-if where a battle does not end while
//   a side's last fighter is only out of sight (fights.mjs): used for docs/audit/data/heroes-fairend/
//   node tools/audit/heroes/run.mjs --calibrate [--heroes ...] [--tiers ...] [--seeds 4]
//     prints win rate and fight length per scenario and tier (to set FOE_MULT), writes nothing
// Then: node tools/audit/heroes/report.mjs (docs/audit/heroes.md from the JSON).
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url'), cp = await import('node:child_process');
const here = path.dirname(url.fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const { HEROES, HERO_IDS } = await import('../../../js/heroes.js');
const SC = await import('./scenarios.mjs');
const { battle, dungeon } = await import('./fights.mjs');

const heroes = opt('heroes', 'all') === 'all' ? HERO_IDS.slice() : opt('heroes').split(',');
const tiers = opt('tiers', '1,2,3').split(',').map(Number);
const nSeeds = +opt('seeds', 8), nDSeeds = +opt('dseeds', 6);
const scens = opt('scen', 'all') === 'all' ? SC.SCENARIOS : SC.SCENARIOS.filter((s) => opt('scen').split(',').includes(s.id));
const outDir = path.resolve(repo, opt('out', 'docs/audit/data/heroes'));

// ---------------------------------------------------------------- adding fights up
function addInto(a, b) { // numbers add; objects recurse; `first` becomes a list
  for (const [k, v] of Object.entries(b)) {
    if (v == null) continue;
    if (k === 'first') { (a.firsts || (a.firsts = [])).push(v); continue; }
    if (k === 'tier' || k === 'passive') { a[k] = v; continue; }
    if (k === 'max') { a[k] = Math.max(a[k] || 0, v); continue; }
    if (typeof v === 'number') a[k] = (a[k] || 0) + v;
    else if (typeof v === 'object') addInto(a[k] || (a[k] = {}), v);
  }
  return a;
}
function tidy(o) { // round, drop zeros and empty maps
  if (Array.isArray(o)) return o.map((x) => (typeof x === 'number' ? Math.round(x * 100) / 100 : x));
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'number') { const r = Math.round(v * 100) / 100; if (r !== 0 || k === 'n' || k === 'casts' || k === 'tier') out[k] = r; }
    else if (typeof v === 'boolean') { if (v) out[k] = v; }
    else if (v && typeof v === 'object') { const t = tidy(v); if (Array.isArray(t) ? t.length : Object.keys(t).length) out[k] = t; }
    else if (v != null) out[k] = v;
  }
  return out;
}
function runCell(hero, tier, sc) {
  const agg = { n: 0, win: 0, loss: 0, draw: 0, timeout: 0, t: 0, hpLeft: 0, sideHp: 0, foeHp: 0, rooms: 0, firedIn: {}, data: {} };
  const n = sc.dungeon ? nDSeeds : nSeeds;
  for (let i = 0; i < n; i++) {
    const seed = sc.dungeon ? 5000 + i : 1000 + i * 17 + SC.SCENARIOS.indexOf(sc);
    let r; try { r = sc.dungeon ? dungeon(hero, tier, seed) : battle(hero, tier, sc, seed, true, { fairEnd: args.includes('--fairEnd') }); }
    catch (e) { agg.errors = (agg.errors || 0) + 1; agg.lastError = String(e && e.stack || e).split('\n').slice(0, 3).join(' | '); continue; }
    agg.n++; agg[r.outcome]++; agg.t += r.t; agg.hpLeft += r.hpLeft; agg.sideHp += r.sideHp || 0; agg.foeHp += r.foeHp || 0; agg.rooms += r.rooms || 0;
    for (const [id, A] of Object.entries(r.data.ab)) if (A.casts > 0 || A.triggers > 0) agg.firedIn[id] = (agg.firedIn[id] || 0) + 1; // fights it went off in at least once
    if (r.data.downs > 0) agg.downFights = (agg.downFights || 0) + 1;
    addInto(agg.data, r.data);
  }
  return agg;
}

// ---------------------------------------------------------------- modes
if (args.includes('--calibrate')) {
  const ns = +opt('seeds', 4);
  for (const tier of tiers) for (const sc of scens) {
    const row = [];
    let W = 0, T = 0, N = 0, TO = 0;
    for (const hero of heroes) { let w = 0, t = 0;
      for (let i = 0; i < ns; i++) { const r = sc.dungeon ? dungeon(hero, tier, 5000 + i, false) : battle(hero, tier, sc, 1000 + i * 17, false); if (r.outcome === 'win') w++; if (r.outcome === 'timeout') TO++; t += r.t; }
      W += w; T += t; N += ns; row.push(`${hero.slice(0, 8)} ${Math.round(100 * w / ns)}% ${Math.round(t / ns)}s`); }
    console.log(`t${tier} ${sc.id.padEnd(11)} win ${Math.round(100 * W / N)}% ${Math.round(T / N)}s timeouts ${TO} | ${row.join(', ')}`);
  }
  process.exit(0);
}
if (args.includes('--worker')) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const hero of heroes) {
    const t0 = Date.now(), out = { hero, name: HEROES[hero].name, role: HEROES[hero].role, seeds: nSeeds, dseeds: nDSeeds, foeMult: SC.FOE_MULT, tiers: {} };
    const file = path.join(outDir, hero + '.json');
    if (fs.existsSync(file) && !args.includes('--force')) { const old = JSON.parse(fs.readFileSync(file, 'utf8')); Object.assign(out.tiers, old.tiers || {}); }
    for (const tier of tiers) { const T = out.tiers[tier] || (out.tiers[tier] = {}); for (const sc of scens) T[sc.id] = tidy(runCell(hero, tier, sc)); }
    fs.writeFileSync(file, JSON.stringify(out));
    console.log(`${hero} done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  process.exit(0);
}
const jobs = Math.max(1, Math.min(3, +opt('jobs', 3), heroes.length)), t0 = Date.now();
const pass = args.filter((a, i) => !['--heroes', '--jobs'].includes(a) && !['--heroes', '--jobs'].includes(args[i - 1]));
// one process per hero, at most `jobs` at once: the sim numbers its units from one counter that lives as long as the
// process (sim.js NEXT_ID, and a few things read it), so a hero's numbers only repeat exactly in a fresh process
const queue = heroes.slice();
await Promise.all(Array.from({ length: jobs }, () => (async () => {
  while (queue.length) {
    const hero = queue.shift();
    await new Promise((res) => { const c = cp.fork(url.fileURLToPath(import.meta.url), ['--worker', '--heroes', hero, ...pass], { stdio: 'inherit' }); c.on('exit', res); });
  }
})()));
console.log(`all ${heroes.length} heroes in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
