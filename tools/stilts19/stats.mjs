// Lane stilts19: what happens in the Canopy Idol's fights, counted over n boss-room fights (the boss's own log, read
// from tools/runs.mjs --v): how many stilts were broken, when it collapsed, how many slams, stomps, lianas and pods
// landed, how long.
//   node tools/stilts19/stats.mjs [--n 40] [--level 25] [--party paladin,archer,cleric,twinfang]
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = execFileSync(process.execPath, ['tools/runs.mjs', '--boss', '--theme', 'sewers', '--bossid', 'stiltIdol', '--level', opt('level', '25'), '--party', opt('party', 'paladin,archer,cleric,twinfang'), '--n', opt('n', '40'), '--v'], { encoding: 'utf8', maxBuffer: 1 << 26 });
let n = 0, won = 0, legs = 0, coll = 0, collT = 0, sh = 0, sn = 0, th = 0, tn = 0, vh = 0, vn = 0, ph = 0, pn = 0, T = 0, wT = 0, p2 = 0, p2T = 0;
for (const l of out.split('\n')) {
  const m = /: (\w+) floor .* sim (\d+)s .* boss phase (\d) at (\d+)%, (\d) legs broken(?: \(collapsed (\d+)s\))?, slams (\d+)\/(\d+), stomps (\d+)\/(\d+), vines (\d+)\/(\d+), pods (\d+)\/(\d+)(?: \((\d+)(?:\/(\d+))?s\))?/.exec(l); if (!m) continue;
  n++; if (m[1] === 'won') { won++; wT += +m[2]; } T += +m[2]; legs += +m[5]; if (m[6]) { coll++; collT += +m[6] - (+m[15] || 0); }
  sh += +m[7]; sn += +m[8]; th += +m[9]; tn += +m[10]; vh += +m[11]; vn += +m[12]; ph += +m[13]; pn += +m[14]; if (m[16]) { p2++; p2T += +m[16] - +m[15]; }
}
const r = (x) => Math.round(x * 10) / 10;
console.log(`${n} fights: won ${won}, about ${r(T / n)} s (wins ${won ? r(wT / won) : '-'} s); stilts broken ${r(legs / n)} a fight; collapsed in ${coll} (${coll ? r(collT / coll) : '-'} s in); phase 2 in ${p2} (${p2 ? r(p2T / p2) : '-'} s in); slams landed ${sh} of ${sn}; stomps ${th} of ${tn}; lianas ${vh} of ${vn}; pods ${ph} of ${pn}`);
