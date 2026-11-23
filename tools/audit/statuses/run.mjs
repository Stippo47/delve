// The status audit's fights. Every matchup is a mirror; every condition runs on the same seeds, with the fed side
// Red on even seeds and Blue on odd ones (the two sides start in different places).
//   node tools/audit/statuses/run.mjs [--only id,id] [--seeds 40] [--cond prefix]
// Writes docs/audit/data/statuses/fights-<matchup>.json (per condition: each seed's win and margin, and means).
import { runFight } from './lib.mjs';
import { MATCHUPS, conditions } from './plan.mjs';
import fs from 'node:fs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const only = opt('only', null), nSeeds = +opt('seeds', 40), condP = opt('cond', null);
const list = MATCHUPS.filter((m) => !only || only.split(',').includes(m.id));
const C = conditions().filter((c) => !condP || c.id === 'control' || c.id.startsWith(condP));
const r2 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
fs.mkdirSync('docs/audit/data/statuses', { recursive: true });
for (const M of list) {
  const t0 = Date.now(), out = { matchup: M, seeds: nSeeds, conds: {} };
  let fights = 0;
  for (const c of C) {
    const R = [];
    for (let i = 0; i < nSeeds; i++) {
      const fed = i % 2 ? 'a' : 'b', other = fed === 'a' ? 'b' : 'a';
      const bonus = c.bonus ? { side: c.bonus.side === 'fed' ? fed : other, mul: c.bonus.mul } : null;
      R.push(runFight({ a: M.side, b: M.side, seed: 1000 + i, fed, feed: c.feed || null, bonus }));
      fights++;
    }
    const mean = (f) => r2(R.reduce((x, r) => x + (f(r) || 0), 0) / R.length);
    const meanNN = (f) => { const v = R.map(f).filter((x) => x != null); return v.length ? r2(v.reduce((x, y) => x + y, 0) / v.length) : null; };
    const types = c.feed ? (Array.isArray(c.feed) ? c.feed.map((f) => f.type) : [c.feed.type]) : [];
    const per = {};
    for (const ty of types) per[ty] = { bursts: mean((r) => r.bursts[ty]), burstsOther: mean((r) => r.burstOther[ty]), inBurst: mean((r) => r.inBurst[ty]), built: mean((r) => r.built[ty]),
      stDmg: mean((r) => r.stDmg[ty]), stDmgOther: mean((r) => r.stDmgOther[ty]), added: mean((r) => r.added[ty]) };
    out.conds[c.id] = { ...c, n: R.length, win: R.map((r) => r.win), margin: R.map((r) => r2(r.margin)),
      time: mean((r) => r.time), timeUps: R.filter((r) => r.timeUp).length, hpFed: mean((r) => r.hpFed), hpOther: mean((r) => r.hpOther),
      dmgFed: mean((r) => r.dmgFed), takenFed: mean((r) => r.takenFed), dmgOther: mean((r) => r.dmgOther), takenOther: mean((r) => r.takenOther),
      healFed: mean((r) => r.healFed), blockedFed: mean((r) => r.blockedFed), stunned: mean((r) => r.stunned), hexSelf: mean((r) => r.hexSelf), entWalk: mean((r) => r.entWalk),
      firstBurst: meanNN((r) => r.firstBurst), meanGap: meanNN((r) => r.meanGap), per };
  }
  out.ms = Date.now() - t0; out.fights = fights;
  fs.writeFileSync(`docs/audit/data/statuses/fights-${M.id}.json`, JSON.stringify(out));
  console.log(M.id.padEnd(14), fights, 'fights', (out.ms / 1000).toFixed(0) + 's');
}
