// quick timing: how long one fight takes to simulate, per matchup
import { runFight } from './lib.mjs';
const ms = [
  [{ k: 'paladin', n: 1, tier: 1 }], [{ k: 'paladin', n: 1, tier: 3 }], [{ k: 'archer', n: 1, tier: 1 }], [{ k: 'cleric', n: 1, tier: 3 }],
  [{ k: 'rattler', n: 1, rank: 0 }], [{ k: 'troll', n: 1, rank: 0 }],
  [{ k: 'paladin', n: 1, tier: 1 }, { k: 'archer', n: 1, tier: 1 }, { k: 'cleric', n: 1, tier: 1 }],
];
for (const side of ms) {
  const t0 = Date.now(); const R = [];
  for (let s = 0; s < 4; s++) R.push(runFight({ a: side, b: side, seed: 100 + s, fed: s % 2 ? 'a' : 'b' }));
  const R2 = []; for (let s = 0; s < 2; s++) R2.push(runFight({ a: side, b: side, seed: 100 + s, fed: 'b', feed: { type: 'burn', rate: 20 } }));
  console.log(side.map((x) => x.k + (x.tier || '')).join('+'), ((Date.now() - t0) / 6).toFixed(0) + ' ms/fight', 'ctl', R.map((r) => r.win + '/' + r.time.toFixed(0) + 's/' + r.margin.toFixed(2)).join(' '), 'burn20', R2.map((r) => r.win + '/' + r.time.toFixed(0) + 's/' + r.margin.toFixed(2) + ' b' + r.bursts.burn + ' gap' + (r.meanGap || 0).toFixed(1) + ' dmg' + r.stDmg.burn.toFixed(0)).join(' '));
}
