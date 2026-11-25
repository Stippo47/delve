// the audit's counts split into the monsters' moves and the statuses: node tools/preview18b/split.mjs before.json after.json
import fs from 'node:fs';
for (const f of process.argv.slice(2)) {
  const o = JSON.parse(fs.readFileSync(f, 'utf8')), c = {};
  for (const [k, R] of Object.entries(o)) {
    const t = k.split(':')[0], C = c[t] || (c[t] = { n: 0, locked: 0, never: 0, late: 0, straw: 0, unseen: 0, blows: 0, wrong: 0, helped: 0, fromNothing: 0, blowsOnly: 0 });
    C.n++; if (R[0].locked) { C.locked++; continue; }
    if (R.some((r) => !r.fired)) C.never++;
    if (R.some((r) => r.first == null || r.first > 2.5)) C.late++;
    if (R.some((r) => r.straw > 0)) C.straw++;
    const u = R.reduce((a, r) => a + r.unseen, 0); if (u) { C.unseen++; C.blows += u; }
    if (R.some((r) => r.fired && !r.reached)) C.wrong++;
    if (R.some((r) => r.crutch)) C.helped++;
    if (t === 'status' && R.some((r) => r.fired && r.stFrom !== 'seen')) C.fromNothing++;
    if (t === 'foe' && !k.includes(':attack:') && R.some((r) => r.fired && !r.own)) C.blowsOnly++;
  }
  console.log(f, JSON.stringify(c));
}
