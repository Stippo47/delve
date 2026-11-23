// Quick look at one setup with the audit's counting: node tools/audit/foes/try.mjs --a rat*2 --b wolf [--n 10] [--scaled]
import { boot, opt, flag } from './lib.mjs';
import { instrument } from './instrument.mjs';
const G = await boot();
const I = instrument(G);
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0, tier: G.DEFS[k] && G.DEFS[k].team === 'hero' ? 1 : undefined }; });
const n = +opt('n', 6), wins = { a: 0, b: 0, draw: 0 };
const t0 = Date.now(); let gt = 0;
for (let i = 0; i < n; i++) {
  const r = I.fight({ arena: opt('arena', 'crypt'), size: 'l', scaled: flag('scaled'), a: parse(opt('a')), b: parse(opt('b')) }, 1000 + i);
  wins[r.winner]++; gt += r.time;
  if (flag('v') || i === 0) {
    console.log(r.winner, r.time.toFixed(1), r.timeUp ? '(time)' : '');
    for (const [k, R] of Object.entries(r.rows)) console.log('  ', k, JSON.stringify({ n: R.n, dmg: Object.fromEntries(Object.entries(R.dmg).map(([a, b]) => [a, Math.round(b)])), fires: R.fires, armed: Object.keys(R.armed), taken: Math.round(R.taken), blocked: Math.round(R.blocked), heal: R.heal, st: R.st, bursts: R.bursts, kills: R.kills, lost: R.lost }));
    if (Object.keys(r.unclaimed).length) console.log('   unclaimed', r.unclaimed);
    if (Object.keys(r.friendly).length) console.log('   friendly', r.friendly);
  }
}
console.log(wins, 'avg', (gt / n).toFixed(1), 's game,', ((Date.now() - t0) / n).toFixed(0), 'ms wall a fight');
