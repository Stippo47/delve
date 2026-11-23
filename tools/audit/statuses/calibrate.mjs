// Pick, for every status, the feed rates that give a burst about every 12, 6 and 3 seconds (low, medium, high).
// Measured on a Paladin (tier I) mirror where neither side can die (health set huge), fed for 90 s; the burst period
// is the time fed over the bursts it gave (90 s / bursts: the wait for the first burst counts, not only the gaps
// after it). Writes docs/audit/data/statuses/rates.json.
//   node tools/audit/statuses/calibrate.mjs
import { runFight, BUILD_IDS, rateFor, LOCK } from './lib.mjs';
import fs from 'node:fs';
const P = { low: 12, med: 6, high: 3 };
const unit = [{ k: 'paladin', n: 1, tier: 1 }];
const WIN = 90;
const gapAt = (type, rate) => { const r = runFight({ a: unit, b: unit, seed: 7, fed: 'b', feed: { type, rate }, immortal: true, maxT: WIN }); return { gap: r.bursts[type] ? WIN / r.bursts[type] : null, n: r.bursts[type], first: r.firstBurst, meanGap: r.meanGap }; };
const out = {};
for (const type of BUILD_IDS) {
  out[type] = { lock: LOCK[type] };
  for (const [lv, want] of Object.entries(P)) {
    // the gap falls as the rate rises: bisect on the rate (1..150 points a second)
    let lo = 1, hi = 150, best = null;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2, g = gapAt(type, mid);
      const gap = g.gap == null ? 999 : g.gap;
      if (!best || Math.abs(gap - want) < Math.abs(best.gap - want)) best = { rate: Math.round(mid * 10) / 10, gap, n: g.n, first: g.first, meanGap: g.meanGap };
      if (gap > want) lo = mid; else hi = mid;
    }
    const fastest = gapAt(type, 150);
    out[type][lv] = { want, rate: best.rate, gotGap: best.gap === 999 ? null : Math.round(best.gap * 100) / 100, bursts90s: best.n, first: best.first, meanGap: best.meanGap && Math.round(best.meanGap * 100) / 100, formula: rateFor(type, want), fastestGap: fastest.gap && Math.round(fastest.gap * 100) / 100 };
  }
  console.log(type.padEnd(9), Object.entries(P).map(([lv]) => `${lv} ${out[type][lv].rate}/s -> ${out[type][lv].gotGap}s`).join('   '), '  fastest possible', out[type].low.fastestGap);
}
fs.mkdirSync('docs/audit/data/statuses', { recursive: true });
fs.writeFileSync('docs/audit/data/statuses/rates.json', JSON.stringify(out, null, 1));
