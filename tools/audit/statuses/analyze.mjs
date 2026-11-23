// Reads docs/audit/data/statuses/fights-*.json and prints the tables for docs/audit/statuses.md; also writes
// docs/audit/data/statuses/summary.json (every number the report quotes).
//   node tools/audit/statuses/analyze.mjs
import fs from 'node:fs';
import { MATCHUPS, LADDER, ladderValue, STATUSES, RATES } from './plan.mjs';
const DIR = 'docs/audit/data/statuses';
const D = {}, TAGS = ['flat']; // (extra runs: run.mjs --tag)
for (const M of MATCHUPS) {
  const f = `${DIR}/fights-${M.id}.json`; if (!fs.existsSync(f)) continue;
  D[M.id] = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const g of TAGS.map((t) => `fights-${M.id}-${t}.json`).filter((x) => fs.existsSync(`${DIR}/${x}`))) {
    const e = JSON.parse(fs.readFileSync(`${DIR}/${g}`, 'utf8')); for (const [k, c] of Object.entries(e.conds)) if (k !== 'control') D[M.id].conds[k] = c; D[M.id].fights += e.fights; D[M.id].ms += e.ms;
  }
}
const ids = Object.keys(D);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const sd = (a) => { const m = avg(a); return Math.sqrt(avg(a.map((x) => (x - m) ** 2))); };
const med = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const CAP_HI = 2.0, CAP_LO = -0.3, LEVELS = ['low', 'med', 'high', 'hold', 'flat'];

// worth of a margin shift on one matchup's ladder: the opponent's damage bonus that moves the margin as far
function worthOf(curve, dm) {
  // curve: [[value, dMargin]...] sorted by value; made non-increasing
  const c = curve.map(([v, m]) => [v, m]); for (let i = 1; i < c.length; i++) c[i][1] = Math.min(c[i][1], c[i - 1][1]);
  if (dm >= c[0][1]) return { v: c[0][0], cap: 'lo' };
  if (dm <= c[c.length - 1][1]) return { v: c[c.length - 1][0], cap: 'hi' };
  for (let i = 1; i < c.length; i++) {
    const [v0, m0] = c[i - 1], [v1, m1] = c[i];
    if (dm <= m0 && dm >= m1) return { v: m0 === m1 ? v0 : v0 + (v1 - v0) * (m0 - dm) / (m0 - m1) };
  }
  return { v: NaN };
}
const S = { matchups: {}, status: {}, pairs: {} };
let fights = 0, ms = 0;
for (const id of ids) {
  const d = D[id], C0 = d.conds.control; fights += d.fights; ms += d.ms;
  const winC = avg(C0.win), marC = avg(C0.margin);
  const curve = [[0, 0], ...LADDER.map((l) => { const c = d.conds[`bonus:${l.side}:${l.mul}`]; return [ladderValue(l), avg(c.margin) - marC]; })].sort((a, b) => a[0] - b[0]);
  const wcurve = [[0, 0], ...LADDER.map((l) => { const c = d.conds[`bonus:${l.side}:${l.mul}`]; return [ladderValue(l), avg(c.win) - winC]; })].sort((a, b) => a[0] - b[0]);
  S.matchups[id] = { what: d.matchup.what || id, winC, marC, timeC: C0.time, curve, wcurve, seeds: d.seeds };
  for (const [cid, c] of Object.entries(d.conds)) {
    if (cid === 'control' || cid.startsWith('bonus:')) continue;
    const diffs = c.margin.map((m, i) => m - C0.margin[i]);
    const dm = avg(diffs), se = sd(diffs) / Math.sqrt(diffs.length), dw = avg(c.win) - winC;
    const wv = worthOf(curve, dm);
    const types = c.pair || [c.status];
    const row = { dWin: dw, dMargin: dm, se, worth: wv.v, cap: wv.cap || null, time: c.time, timeC: C0.time,
      dealtPS: c.dmgFed / c.time, dealtPSC: C0.dmgFed / C0.time, dealt: c.dmgFed, dealtC: C0.dmgFed, taken: c.takenFed, takenC: C0.takenFed,
      noStrike: c.noStrike, noStrikeC: C0.noStrike, stunned: c.stunned, stunnedC: C0.stunned,
      blows: c.blowsFed, blowsC: C0.blowsFed, casts: c.castsFed, castsC: C0.castsFed,
      healLost: (c.healAsk || 0) - (c.healCut || 0), healAsk: c.healAsk, heal: c.healFed, healC: C0.healFed,
      hexSelf: c.hexSelf, entWalk: c.entWalk, nullFed: c.nullFed, nullOther: c.nullOther, nullFedC: C0.nullFed, nullOtherC: C0.nullOther,
      per: c.per, firstBurst: c.firstBurst, meanGap: c.meanGap, n: d.matchup.side.reduce((x, s) => x + s.n, 0) };
    if (c.pair) { (S.pairs[cid] || (S.pairs[cid] = {}))[id] = row; continue; }
    ((S.status[c.status] || (S.status[c.status] = {}))[c.level] || (S.status[c.status][c.level] = {}))[id] = row;
  }
}
S.fights = fights; S.cpuSeconds = ms / 1000;
fs.writeFileSync(`${DIR}/summary.json`, JSON.stringify(S, null, 0));

// ---------------------------------------------------------------- printing
const CLASS = { heroT1: (id) => id.endsWith('-t1') && !id.startsWith('trio'), heroT3: (id) => id.endsWith('-t3') && !id.startsWith('trio'),
  enemy: (id) => MATCHUPS.find((m) => m.id === id).kind === 'enemy', group: (id) => MATCHUPS.find((m) => m.id === id).kind === 'group' };
const pct = (x, d = 0) => (isFinite(x) ? (x >= 0 ? '+' : '') + (100 * x).toFixed(d) + '%' : '-');
const f1 = (x) => (isFinite(x) ? x.toFixed(1) : '-');
const f0 = (x) => (isFinite(x) ? Math.round(x).toString() : '-');
const worthStr = (rows) => { const v = rows.map((r) => r.worth), m = med(v), hi = rows.filter((r) => r.cap === 'hi').length, lo = rows.filter((r) => r.cap === 'lo').length;
  return (m >= CAP_HI ? '≥' : m <= CAP_LO ? '≤' : '') + pct(m) + (hi ? ` (${hi} off the top)` : '') + (lo ? ` (${lo} helped)` : ''); };
const sum = (o, k) => Object.values(o || {}).reduce((x, v) => x + (v[k] || 0), 0);
const mode = process.argv[2] || 'all';

if (mode === 'all' || mode === 'rank') {
  console.log('\n## Ranking (median over matchups of the damage bonus to the opponent that hurts as much)\n');
  console.log('| status | rate | median worth | heroes I | heroes III | enemies | groups | win shift | margin shift | spread (2 SE) |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  const lines = [];
  for (const st of STATUSES) for (const lv of LEVELS) {
    const R = S.status[st] && S.status[st][lv]; if (!R) continue;
    const rows = Object.entries(R);
    const by = (k) => worthStr(rows.filter(([id]) => CLASS[k](id)).map(([, r]) => r));
    const all = rows.map(([, r]) => r);
    lines.push({ st, lv, m: med(all.map((r) => r.worth)), s: `| ${st} | ${lv} | ${worthStr(all)} | ${by('heroT1')} | ${by('heroT3')} | ${by('enemy')} | ${by('group')} | ${pct(avg(all.map((r) => r.dWin)))} | ${pct(avg(all.map((r) => r.dMargin)))} | ±${(200 * avg(all.map((r) => r.se))).toFixed(0)}% |` });
  }
  for (const l of lines.sort((a, b) => b.m - a.m)) console.log(l.s);
}
if (mode === 'all' || mode === 'measured') {
  console.log('\n## Measured, per status and rate (all 26 matchups; per fed unit; medians of each matchup\'s change vs its control)\n');
  console.log('| status | rate | feed /s | bursts a fight | a burst every | first burst | s in burst state | share of fight it couldn\'t strike (control) | status\'s own dmg a fight (share of all it took) | its damage dealt /s | blows landed /s | abilities used /s | heal lost (healers) | fight length (control) | worth |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const st of STATUSES) for (const lv of LEVELS) {
    const R = S.status[st] && S.status[st][lv]; if (!R) continue;
    const all = Object.values(R);
    const burstsU = all.reduce((x, r) => x + r.per[st].bursts / r.n, 0), timeSum = all.reduce((x, r) => x + r.time, 0);
    const own = (r) => r.per[st].stDmg + (st === 'curse' ? r.hexSelf : 0) + (st === 'entangle' ? r.entWalk : 0);
    const ns = all.reduce((x, r) => x + r.noStrike / r.n, 0) / timeSum, nsC = all.reduce((x, r) => x + r.noStrikeC / r.n, 0) / all.reduce((x, r) => x + r.timeC, 0);
    const ratio = (f, g) => med(all.filter((r) => g(r) > 0).map((r) => f(r) / g(r) - 1));
    const hl = all.filter((r) => r.healC > 50) /* (the matchups that heal: a Cleric's, mostly) */, lost = hl.reduce((x, r) => x + r.healLost, 0), ask = hl.reduce((x, r) => x + (r.healAsk || 0), 0);
    console.log(`| ${st} | ${lv} | ${lv === 'hold' ? 'kept at 85' : lv === 'flat' ? 25 : RATES[st][lv].rate} | ${f1(burstsU / all.length)} | ${burstsU > 0.5 ? f1(timeSum / burstsU) + ' s' : 'never'} | ${f1(avg(all.filter((r) => r.firstBurst != null).map((r) => r.firstBurst)))} s | ${f1(avg(all.map((r) => r.per[st].inBurst / r.n)))} | ${pct(ns)} (${pct(nsC)}) | ${f0(avg(all.map((r) => own(r) / r.n)))} (${pct(avg(all.map((r) => own(r) / Math.max(1, r.taken))))}) | ${pct(ratio((r) => r.dealtPS, (r) => r.dealtPSC))} | ${pct(ratio((r) => r.blows / r.time, (r) => r.blowsC / r.timeC))} | ${pct(ratio((r) => r.casts / r.time, (r) => r.castsC / r.timeC))} | ${f0(lost / hl.length)} (${pct(ask ? lost / ask : 0)}) | ${f0(avg(all.map((r) => r.time)))} s (${f0(avg(all.map((r) => r.timeC)))}) | ${worthStr(all)} |`);
  }
}
if (mode === 'all' || mode === 'special') {
  console.log('\n## Per-effect counts (mean per fight over all matchups)\n');
  for (const st of ['radiance', 'charm', 'curse']) for (const lv of LEVELS) {
    const R = S.status[st] && S.status[st][lv]; if (!R) continue; const all = Object.values(R);
    const k = st === 'radiance' ? 'radiant' : st === 'charm' ? 'charm' : 'hex';
    console.log(`${st} ${lv}: fed side's blows nullified ${f1(avg(all.map((r) => r.nullFed[k][0] - r.nullFedC[k][0])))} (dmg ${f0(avg(all.map((r) => r.nullFed[k][1] - r.nullFedC[k][1])))}), opponent's blows nullified ${f1(avg(all.map((r) => r.nullOther[k][0] - r.nullOtherC[k][0])))} (dmg ${f0(avg(all.map((r) => r.nullOther[k][1] - r.nullOtherC[k][1])))}), opponent bursts ${f1(avg(all.map((r) => r.per[st].burstsOther)))}, hex self-dmg ${f0(avg(all.map((r) => r.hexSelf)))}, s in burst state ${f1(avg(all.map((r) => r.per[st].inBurst)))}`);
  }
}
if (mode === 'all' || mode === 'pairs') {
  console.log('\n## Pairs (both at their medium rate) vs each alone\n');
  console.log('| pair | worth | A alone | B alone | win shift | margin shift |');
  console.log('|---|---|---|---|---|---|');
  for (const [pid, R] of Object.entries(S.pairs)) {
    const [x, y] = pid.slice(5).split('+'), all = Object.values(R);
    console.log(`| ${pid.slice(5)} | ${worthStr(all)} | ${worthStr(Object.values(S.status[x].med))} | ${worthStr(Object.values(S.status[y].med))} | ${pct(avg(all.map((r) => r.dWin)))} | ${pct(avg(all.map((r) => r.dMargin)))} |`);
  }
}
if (mode === 'all' || mode === 'matchups') {
  console.log('\n## Matchups (control)\n');
  console.log('| matchup | control win (fed-side label) | control margin | fight length | margin with opponent +50% dmg | +100% |');
  console.log('|---|---|---|---|---|---|');
  for (const [id, m] of Object.entries(S.matchups)) console.log(`| ${id} | ${pct(m.winC)} | ${pct(m.marC)} | ${f1(m.timeC)} s | ${pct(m.curve.find((c) => Math.abs(c[0] - 0.5) < 1e-9)[1])} | ${pct(m.curve.find((c) => Math.abs(c[0] - 1) < 1e-9)[1])} |`);
}
if (mode === 'grid') {
  // one status: worth per matchup and rate
  const st = process.argv[3];
  for (const lv of LEVELS) { const R = S.status[st][lv]; if (!R) continue;
    console.log(st, lv, Object.entries(R).map(([id, r]) => `${id} ${pct(r.worth)}${r.cap ? '*' : ''} (w${pct(r.dWin)} m${pct(r.dMargin)})`).join(', ')); }
}
console.log(`\n${fights} fights, ${(ms / 1000 / 60).toFixed(1)} CPU-minutes over ${ids.length} matchups`);
