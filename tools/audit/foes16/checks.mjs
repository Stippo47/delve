// Round 17, lane foes16: the designer's cases, fight by fight.
//   node tools/audit/foes16/checks.mjs [--seeds 30] [--out file.json]
// Each line: side A against side B, both at rank 0 (the Wildwood's first floor) unless "scaled" (battle mode's
// default: each kind at its own dungeon's first-floor strength), sides swapped every other seed, in the Wildwood.
import { writeFileSync } from 'node:fs';
import { fight, leftOf, opt, r2, costOf } from './lib.mjs';

const S = +opt('seeds', 30);
const CASES = [
  ['wolf', 1, 'slime', 1, false], ['wolf', 2, 'slime', 2, false], ['wolf', 3, 'slime', 3, false],
  ['rat', 2, 'wolf', 1, false], ['rat', 4, 'wolf', 2, false], ['rat', 6, 'wolf', 3, false], ['rat', 1, 'wolf', 1, false],
  ['ratPlague', 2, 'wolf', 1, false],
  ['rat', 1, 'wolf', 1, true], ['rat', 2, 'wolf', 1, true], ['rat', 4, 'wolf', 2, true],
  ['bandit', 1, 'wolf', 1, false], ['bandit', 2, 'wolf', 3, false], ['slime', 3, 'bandit', 2, false],
];
const rows = [];
for (const [a, na, b, nb, scaled] of CASES) {
  let wa = 0, wb = 0, dr = 0, la = 0, lb = 0, t = 0;
  for (let s = 0; s < S; s++) {
    const flip = s % 2 === 1, A = [{ k: a, n: na }], B = [{ k: b, n: nb }];
    const run = fight({ arena: 'wildwood', scaled, a: flip ? B : A, b: flip ? A : B }, 50000 + s * 7919);
    const sa = flip ? 'b' : 'a', sb = flip ? 'a' : 'b';
    if (run.winner === sa) wa++; else if (run.winner === sb) wb++; else dr++;
    la += leftOf(run, sa) / S; lb += leftOf(run, sb) / S; t += run.t / S;
  }
  const row = { a, na, costA: r2(na * costOf(a)), b, nb, costB: r2(nb * costOf(b)), scaled, winsA: wa, winsB: wb, draws: dr, leftA: r2(la), leftB: r2(lb), secs: Math.round(t) };
  rows.push(row);
  console.log(`${na} ${a} (cost ${row.costA}) v ${nb} ${b} (cost ${row.costB})${scaled ? ' scaled' : ''}: ${wa}-${wb}${dr ? ` (${dr} drawn)` : ''}, health left ${row.leftA} / ${row.leftB}, ${row.secs}s`);
}
if (opt('out')) writeFileSync(opt('out'), JSON.stringify({ seeds: S, rows }, null, 1));
