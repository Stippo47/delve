// Lane spider19: what happens in Old Longlegs' fights, counted over n boss-room fights (the boss's own log, read from
// tools/runs.mjs --v): how many legs were broken, when it collapsed, how many slams and stomps landed, how long.
//   node tools/spider19/stats.mjs [--n 40] [--level 25] [--party paladin,archer,cleric,twinfang]
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = execFileSync(process.execPath, ['tools/runs.mjs', '--boss', '--theme', 'sewers', '--bossid', 'ikSpider', '--level', opt('level', '25'), '--party', opt('party', 'paladin,archer,cleric,twinfang'), '--n', opt('n', '40'), '--v'], { encoding: 'utf8', maxBuffer: 1 << 26 });
let n = 0, won = 0, legs = 0, coll = 0, collT = 0, sh = 0, sn = 0, th = 0, tn = 0, T = 0, wT = 0, p2 = 0, p2T = 0;
for (const l of out.split('\n')) {
  const m = /: (\w+) floor .* sim (\d+)s .* boss phase (\d) at (\d+)%, (\d) legs broken(?: \(collapsed (\d+)s\))?, slams (\d+)\/(\d+), stomps (\d+)\/(\d+)(?: \((\d+)(?:\/(\d+))?s\))?/.exec(l); if (!m) continue;
  n++; if (m[1] === 'won') { won++; wT += +m[2]; } T += +m[2]; legs += +m[5]; if (m[6]) { coll++; collT += +m[6] - (+m[11] || 0); }
  sh += +m[7]; sn += +m[8]; th += +m[9]; tn += +m[10]; if (m[12]) { p2++; p2T += +m[12] - +m[11]; }
}
const r = (x) => Math.round(x * 10) / 10;
console.log(`${n} fights: won ${won}, about ${r(T / n)} s (wins ${won ? r(wT / won) : '-'} s); legs broken ${r(legs / n)} a fight; collapsed in ${coll} (${coll ? r(collT / coll) : '-'} s in); phase 2 in ${p2} (${p2 ? r(p2T / p2) : '-'} s in); slams landed ${sh} of ${sn}; stomps landed ${th} of ${tn}`);
console.log(out.trim().split('\n').pop());
