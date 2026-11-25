// Round 16, lane play16: a brand-new player's first room. Each starter alone at level 1 with its one starting point
// spent (tier I of its first ability), the Wildwood's floor 1 room 1, many seeds: how often it dies there, how many levels
// the room is worth, and how often a major or an elite comes (only what spawned before the room ended).
//   node tools/play16/fresh1.mjs [--n 300] [--out file.json]
import './env.mjs';
import fs from 'node:fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const N = +opt('n', 300);
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const out = {};
for (const k of ['archer', 'paladin', 'twinfang']) {
  const o = out[k] = { n: 0, died: 0, levels: 0, lv: [0, 0, 0, 0, 0], major: 0, elite: 0, secs: 0 };
  for (let i = 0; i < N; i++) {
    const s = freshSave(); P.autoSpend(s, k); s.party = [k];
    setSeed(5 + i * 7919);
    const run = newRun(s, { theme: 'wildwood', party: [k], floor: 1 });
    const seen = new Map(); let t = 0;
    while (run.rooms === 1 && run.phase !== 'lost' && t < 600) {
      for (const u of run.world.units) if ((u.trueTeam || u.team) === 'enemy' && !seen.has(u.id)) seen.set(u.id, u);
      update(run, 1 / 60); t += 1 / 60;
    }
    const g = run.heroes[k].level - 1;
    o.n++; o.secs += t; o.levels += g; o.lv[Math.min(4, g)]++;
    if (run.phase === 'lost') o.died++;
    if ([...seen.values()].some((u) => u.major)) o.major++;
    if ([...seen.values()].some((u) => u.elite && !u.major)) o.elite++;
  }
  console.log(`${k}: died in the first room ${(100 * o.died / o.n).toFixed(0)}% of ${o.n}; levels from it ${(o.levels / o.n).toFixed(2)} (0/1/2/3/4+: ${o.lv.join('/')}); a major ${(100 * o.major / o.n).toFixed(1)}%, an elite ${(100 * o.elite / o.n).toFixed(0)}%`);
}
if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify(out, null, 1));
