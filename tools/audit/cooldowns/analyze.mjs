// Turns raw fights (run.mjs) into per-ability numbers: how long each lasting effect is up, how much cooldown is left
// when it ends, how often it is ready by then, and the share of the fight it is up (uptime). Also the uptime that the
// proposed rules would give, worked out from the same casts (see docs/audit/cooldowns.md, "How the proposals are
// worked out").
//   node tools/audit/cooldowns/analyze.mjs raw1.json [raw2.json...] [--out summary.json] [--md table.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { WORLD, JUNK } from './classes.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const files = args.filter((a, i) => a.endsWith('.json') && args[i - 1] !== '--out');
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { HEROES } = await import(new URL('../../../js/heroes.js', import.meta.url).href);

const med = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const CLS = ['state', 'ally', 'summon', 'zone', 'foe'];

// G[hero.ab.cls.tier] = everything needed
const G = {};
const key = (h, ab, cls, tier) => `${h}|${ab}|${cls}|${tier}`;
let nFights = 0; const AT = {}, AS = {}, NF = {}; // the hero's standing time, all fights of a tier (and by scenario); fights
for (const f of files) for (const F of JSON.parse(readFileSync(f, 'utf8')).fights) {
  nFights++; const hk = F.hero + '|' + F.tier; AT[hk] = (AT[hk] || 0) + F.aliveT; AS[hk + '|' + F.scenario] = (AS[hk + '|' + F.scenario] || 0) + F.aliveT; NF[hk] = (NF[hk] || 0) + 1;
  const T = F.tier, byAbCls = {};
  for (const c of F.casts) {
    c.comps = c.comps.filter((k) => !JUNK.has(k.key)); for (const k of c.comps) if (WORLD[c.ab] && WORLD[c.ab][k.key]) k.cls = WORLD[c.ab][k.key];
  }
  for (const c of F.casts) for (const cls of CLS) {
    const comps = c.comps.filter((k) => k.cls === cls); if (!comps.length) continue;
    let open = comps.some((k) => k.end == null), end = open ? null : Math.max(...comps.map((k) => k.end));
    // cast again while it was still up (the same buff refreshed, a second wall): this cast's share ends at the next one,
    // with the ability ready (it was just cast)
    const raw = open ? null : end - c.t; // (its whole length, whether or not it was cast again meanwhile)
    const chained = c.next != null && (open || end > c.next);
    if (chained) { open = false; end = c.next; }
    // the cooldown left when the last piece of it ended
    const last = open ? null : chained ? { cdEnd: 0, why: 'recast' } : comps.reduce((a, k) => (k.end >= a.end ? k : a), comps[0]);
    const g = G[key(F.hero, c.ab, cls, T)] || (G[key(F.hero, c.ab, cls, T)] = { hero: F.hero, ab: c.ab, cls, tier: T, casts: 0, full: [], dur: [], open: 0, cdEnd: [], why: { end: 0, cc: 0, down: 0, recast: 0 }, tgtDead: 0,
      re: 0, atk: [], other: [], gaps: [], keys: {}, upT: 0, scen: {}, raw: [] });
    g.casts++; g.full.push(c.cd); if (raw != null) g.raw.push(raw);
    for (const k of comps) g.keys[k.key] = (g.keys[k.key] || 0) + 1;
    if (open) g.open++;
    else { g.dur.push(end - c.t); g.cdEnd.push(last.cdEnd); g.why[last.why] = (g.why[last.why] || 0) + 1; if (last.td) g.tgtDead++; }
    if (c.re) g.re++;
    g.atk.push(c.atk); g.other.push(c.other);
    // the wait after it was both over and ready, before it was cast again (how quickly the hero picks it back up)
    if (c.next != null && !open) g.gaps.push({ dur: end - c.t, full: c.cd, cycle: c.next - c.t, wait: Math.max(0, c.next - Math.max(end, c.t + c.cd)) });
    (byAbCls[c.ab + '|' + cls] || (byAbCls[c.ab + '|' + cls] = [])).push([c.t, open ? F.end : chained ? Math.max(end, ...comps.map((k) => k.end ?? F.end)) : end]);
  }
  // uptime: the time any of an ability's effects (of one kind) is up, over the time the hero is standing
  for (const [k, iv] of Object.entries(byAbCls)) {
    const [ab, cls] = k.split('|'), g = G[key(F.hero, ab, cls, T)];
    iv.sort((a, b) => a[0] - b[0]); let up = 0, s = -1, e = -1;
    for (const [a, b] of iv) { if (a > e) { if (e > s) up += e - s; s = a; e = b; } else e = Math.max(e, b); }
    if (e > s) up += e - s;
    up = Math.min(up, F.aliveT);
    g.upT += up;
    g.scen[F.scenario] = (g.scen[F.scenario] || 0) + up;
    // damage dealt and taken while it is up and while it is not
    const on = F.onTime[ab] && F.onTime[ab][cls];
    if (on) { g.on = g.on || { t: 0, dmg: 0, taken: 0 }; g.off = g.off || { t: 0, dmg: 0, taken: 0 }; g.on.t += on.t; g.on.dmg += on.dmg; g.on.taken += on.taken; g.off.t += F.total.t - on.t; g.off.dmg += F.total.dmg - on.dmg; g.off.taken += F.total.taken - on.taken; }
  }
}

const rows = [];
for (const g of Object.values(G)) {
  const hk = g.hero + '|' + g.tier; g.aliveT = AT[hk];
  const H = HEROES[g.hero], A = H.abilities.find((a) => a.id === g.ab);
  const dur = med(g.dur), fullM = med(g.full), cd = g.cdEnd.map((x) => Math.max(0, x));
  const gs = g.gaps, sum = (f) => gs.reduce((a, x) => a + f(x), 0);
  const avgDur = mean(g.dur) || 0;
  // today, from whole cycles (cast to next cast); then the same casts under each proposal: a) the cooldown starts when
  // the effect ends, so a cycle is effect + cooldown + the hero's usual wait; b) the cooldown is longer by the effect's
  // average length, so a cycle is the longer of that and the effect, plus the wait
  const upCyc = gs.length ? sum((x) => Math.min(x.dur, x.cycle)) / sum((x) => x.cycle) : null;
  const upA = gs.length ? sum((x) => x.dur) / sum((x) => x.dur + x.full + x.wait) : null;
  const upB = gs.length ? sum((x) => x.dur) / sum((x) => Math.max(x.full + avgDur, x.dur) + x.wait) : null;
  const upC = gs.length ? sum((x) => x.dur) / sum((x) => Math.max(x.full, x.dur + 0.5 * x.full) + x.wait) : null; // c) at least half the cooldown left when it ends
  const scale = upCyc ? (g.upT / g.aliveT) / upCyc : 1; // (cycles leave out the start and end of a fight; scale to the measured uptime)
  const rate = (o) => (o && o.t > 0 ? o.dmg / o.t : null), trate = (o) => (o && o.t > 0 ? o.taken / o.t : null);
  rows.push({ hero: g.hero, name: H.name, ab: g.ab, abName: A.name, cls: g.cls, tier: g.tier, baseCd: A.cd, casts: g.casts, fights: NF[hk],
    cd: fullM, dur, durMean: avgDur, durRaw: mean(g.raw), open: g.open, cdLeft: med(cd), cdLeftMean: mean(cd), ready: g.cdEnd.length ? g.cdEnd.filter((x) => x <= 0).length / g.cdEnd.length : null,
    readyFor: med(g.cdEnd.filter((x) => x <= 0).map((x) => -x)), uptime: g.aliveT ? g.upT / g.aliveT : 0,
    scen: Object.fromEntries(Object.entries(g.scen).map(([k, v]) => [k, v / AS[hk + '|' + k]])),
    upCycle: upCyc, upA: upA == null ? null : Math.min(1, upA * scale), upB: upB == null ? null : Math.min(1, upB * scale), upC: upC == null ? null : Math.min(1, upC * scale), wait: med(gs.map((x) => x.wait)),
    recast: g.re / g.casts, atk: mean(g.atk), other: mean(g.other), why: g.why, tgtDead: g.cdEnd.length ? g.tgtDead / g.cdEnd.length : 0,
    durs: g.dur.map((x) => +x.toFixed(2)), cdEnds: g.cdEnd.map((x) => +x.toFixed(2)),
    dpsOn: rate(g.on), dpsOff: rate(g.off), takenOn: trate(g.on), takenOff: trate(g.off), keys: g.keys });
}
rows.sort((a, b) => b.uptime - a.uptime);
if (opt('out')) writeFileSync(opt('out'), JSON.stringify({ fights: nFights, files: files.map((f) => f.split(/[\\/]/).pop()), rows }));
const f1 = (x, d = 1) => (x == null ? '-' : x.toFixed(d)), pc = (x) => (x == null ? '-' : Math.round(100 * x) + '%');
console.log(`${nFights} fights`);
console.log('hero.ability                     cls     T  casts  cd    dur   cdLeft ready  uptime  upA   upB  recast atk  other  why(end/cc/down/recast)');
for (const r of rows) if (r.cls !== 'foe' && (r.dur ?? 9) >= 1 && r.casts >= 5) console.log(`${(r.hero + '.' + r.ab).padEnd(32)} ${r.cls.padEnd(7)} ${r.tier}  ${String(r.casts).padStart(5)} ${f1(r.cd).padStart(5)} ${f1(r.dur).padStart(5)} ${f1(r.cdLeft).padStart(6)} ${pc(r.ready).padStart(5)} ${pc(r.uptime).padStart(6)} ${pc(r.upA).padStart(5)} ${pc(r.upB).padStart(5)} ${pc(r.recast).padStart(5)} ${f1(r.atk).padStart(4)} ${f1(r.other).padStart(4)}  ${r.why.end}/${r.why.cc}/${r.why.down}/${r.why.recast}`);
