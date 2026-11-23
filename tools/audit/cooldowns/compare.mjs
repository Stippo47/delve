// Today against the two prototypes, for the abilities rules.mjs picked: uptime and ready-at-exit per tier, and what it
// did to the hero (wins, damage dealt and taken a second, how often the hero went down, fight length).
//   node tools/audit/cooldowns/compare.mjs --rules rules.json --today sum-today.json --a sum-a.json --b sum-b.json
//     --fights-today t0.json,t1.json --fights-a a0.json,... --fights-b b0.json,... [--c sum-c.json --fights-c c0.json,...] [--out compare.json]
import { readFileSync, writeFileSync } from 'node:fs';
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { HEROES } = await import(new URL('../../../js/heroes.js', import.meta.url).href);
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const J = (p) => JSON.parse(readFileSync(p, 'utf8'));
const rules = J(opt('rules')), S = { today: J(opt('today')), a: J(opt('a')), b: J(opt('b')), c: opt('c') ? J(opt('c')) : { rows: [] } };
const heroes = new Set(rules.heroes);
// per hero and tier: the fights' outcomes
function outcomes(list) {
  const O = {};
  for (const f of list.split(',')) for (const F of J(f).fights) {
    if (!heroes.has(F.hero)) continue;
    const k = F.hero + '|' + F.tier, o = O[k] || (O[k] = { n: 0, win: 0, dmg: 0, taken: 0, alive: 0, down: 0, time: 0, scen: {} });
    o.n++; if (F.winner === 'a') o.win++; o.dmg += F.total.dmg; o.taken += F.total.taken; o.alive += F.aliveT; o.time += F.time; if (F.aliveT < F.time - 0.05) o.down++;
    const sc = o.scen[F.scenario] || (o.scen[F.scenario] = { n: 0, win: 0, time: 0 }); sc.n++; if (F.winner === 'a') sc.win++; sc.time += F.time;
  }
  return O;
}
const O = { today: outcomes(opt('fights-today')), a: outcomes(opt('fights-a')), b: outcomes(opt('fights-b')), c: opt('fights-c') ? outcomes(opt('fights-c')) : {} };
const row = (R, hero, ab, cls, tier) => R.rows.find((r) => r.hero === hero && r.ab === ab && r.cls === cls && r.tier === tier) || null;
const out = [];
for (const ab of rules.only) {
  const cls = rules.cls[ab], hero = Object.keys(HEROES).find((h) => HEROES[h].abilities.some((a) => a.id === ab) && heroes.has(h));
  for (const tier of [1, 2, 3]) {
    const t = row(S.today, hero, ab, cls, tier), a = row(S.a, hero, ab, cls, tier), b = row(S.b, hero, ab, cls, tier), c = row(S.c, hero, ab, cls, tier); if (!t) continue;
    const k = hero + '|' + tier, st = (o) => o && o[k] ? { win: o[k].win / o[k].n, dps: o[k].dmg / o[k].alive, tps: o[k].taken / o[k].alive, down: o[k].down / o[k].n, time: o[k].time / o[k].n,
      scen: Object.fromEntries(Object.entries(o[k].scen).map(([s, v]) => [s, { win: v.win / v.n, time: v.time / v.n }])) } : null;
    out.push({ hero, name: HEROES[hero].name, ab, abName: HEROES[hero].abilities.find((x) => x.id === ab).name, cls, tier,
      cd: t.cd, dur: t.dur, durRaw: t.durRaw, add: rules.add[ab] && rules.add[ab][tier], cdLeft: t.cdLeft, ready: t.ready, recast: t.recast, why: t.why,
      up: { today: t.uptime, a: a ? a.uptime : null, b: b ? b.uptime : null, c: c ? c.uptime : null, predA: t.upA, predB: t.upB, predC: t.upC },
      readyAfter: { a: a ? a.ready : null, b: b ? b.ready : null, c: c ? c.ready : null }, cdLeftAfter: { b: b ? b.cdLeft : null, c: c ? c.cdLeft : null },
      dpsOn: t.dpsOn, dpsOff: t.dpsOff, takenOn: t.takenOn, takenOff: t.takenOff, atk: t.atk, other: t.other,
      hero_: { today: st(O.today), a: st(O.a), b: st(O.b), c: st(O.c) } });
  }
}
if (opt('out')) writeFileSync(opt('out'), JSON.stringify(out, null, 1));
const pc = (x) => (x == null ? '-' : Math.round(100 * x) + '%'), f1 = (x) => (x == null ? '-' : x.toFixed(1)), sg = (x) => (x == null ? '-' : (x >= 0 ? '+' : '') + Math.round(100 * x) + '%');
console.log('ability                         cls     T   cd   dur  left ready | up now   a    b    c  | dmg/s a   b   c  | win now a b c');
for (const r of out) {
  const h = r.hero_, rel = (k, f) => (h.today && h[k] ? h[k][f] / h.today[f] - 1 : null);
  console.log(`${(r.hero + '.' + r.ab).padEnd(31)} ${r.cls.padEnd(6)} ${r.tier} ${f1(r.cd).padStart(5)} ${f1(r.dur).padStart(5)} ${f1(r.cdLeft).padStart(5)} ${pc(r.ready).padStart(5)} | ${pc(r.up.today).padStart(5)} ${pc(r.up.a).padStart(4)} ${pc(r.up.b).padStart(4)} ${pc(r.up.c).padStart(4)} | ${sg(rel('a', 'dps')).padStart(5)} ${sg(rel('b', 'dps')).padStart(5)} ${sg(rel('c', 'dps')).padStart(5)} | ${pc(h.today && h.today.win)} ${pc(h.a && h.a.win)} ${pc(h.b && h.b.win)} ${pc(h.c && h.c.win)}`);
}
