// Round 16 fixes: before/after tables from two folders of measure.mjs JSON (one file per group of heroes).
//   node tools/audit/fixes16/compare.mjs <before dir> <after dir> [--md]
// Per target ability (the ones the round 16 fixes retimed), per tier: casts a fight in each scenario before -> after;
// and its hero's wins and health margin per scenario before -> after.
const fs = await import('node:fs'), path = await import('node:path');
const [A, B] = process.argv.slice(2), md = process.argv.includes('--md');
const load = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const before = load(A), after = load(B);
const key = (c) => `${c.hero}|${c.tier}|${c.scen}`;
const bm = new Map(before.map((c) => [key(c), c]));
export const TARGETS = { roll: 'archer', dash: 'twinfang', resupply: 'quartermaster', oilBlades: 'quartermaster', oldTales: 'grandpa', entangle: 'druid', encore: 'bard',
  shockMine: 'engineer', spearThrow: 'valkyrie', valkyrieCall: 'valkyrie', guard: 'paladin', mend: 'cleric', swoop: 'griffon', challenge: 'dame',
  brace: 'bulwark', shieldWall: 'bulwark', darkBargain: 'warlock', cure: 'plague' };
const SC = ['duelMelee', 'boar', 'swarm', 'duo', 'allyTank', 'allyHealer', 'dungeon'];
const f1 = (x) => (x == null ? '-' : x.toFixed(1)), pct = (x) => (x == null ? '-' : Math.round(100 * x) + '');
const lines = [];
for (const [ab, hero] of Object.entries(TARGETS)) for (const tier of [2, 3]) {
  const cells = SC.map((s) => { const a = after.find((c) => key(c) === `${hero}|${tier}|${s}`), b = bm.get(`${hero}|${tier}|${s}`); return { s, a, b }; }).filter((x) => x.a && x.b);
  if (!cells.length) continue;
  const casts = cells.map(({ s, a, b }) => `${s} ${f1((b.ab[ab] || { casts: 0 }).casts / b.n)}->${f1((a.ab[ab] || { casts: 0 }).casts / a.n)}`).join(', ');
  const res = cells.map(({ s, a, b }) => `${s} ${b.win}/${b.n}->${a.win}/${a.n} (${pct(b.margin / b.n)}->${pct(a.margin / a.n)})`).join(', ');
  const tb = cells.reduce((n, { b }) => n + (b.ab[ab] || { casts: 0 }).casts, 0), ta = cells.reduce((n, { a }) => n + (a.ab[ab] || { casts: 0 }).casts, 0);
  const mb = cells.reduce((n, { b }) => n + b.margin / b.n, 0) / cells.length, ma = cells.reduce((n, { a }) => n + a.margin / a.n, 0) / cells.length;
  const wb = cells.reduce((n, { b }) => n + b.win, 0), wa = cells.reduce((n, { a }) => n + a.win, 0), N = cells.reduce((n, { a }) => n + a.n, 0);
  lines.push({ ab, hero, tier, casts, res, tb, ta, mb, ma, wb, wa, N });
}
for (const l of lines) {
  if (md) console.log(`| ${l.ab} (${l.hero}) | ${l.tier} | ${l.tb} -> ${l.ta} | ${l.wb}/${l.N} -> ${l.wa}/${l.N} | ${pct(l.mb)} -> ${pct(l.ma)} |`);
  else console.log(`${l.ab} (${l.hero}) t${l.tier}: casts total ${l.tb} -> ${l.ta}; wins ${l.wb}/${l.N} -> ${l.wa}/${l.N}; mean margin ${pct(l.mb)} -> ${pct(l.ma)}\n   casts/fight: ${l.casts}\n   result: ${l.res}`);
}
