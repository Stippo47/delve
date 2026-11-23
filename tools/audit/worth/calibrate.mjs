// Picking the battle panel: every hero, full kit and bare, against candidate foes, a few seeds. Prints win rate and
// health margin per candidate, so a foe can be picked that the middle of the heroes about breaks even with.
//   node tools/audit/worth/calibrate.mjs --cands "rattlerMace:1,orc:1,..." [--seeds 3] [--heroes a,b] [--group]
import { battleFight, setPanel, builds, HERO_IDS } from './lib.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const seeds = +opt('seeds', 3), heroes = opt('heroes') ? opt('heroes').split(',') : HERO_IDS;
const cands = opt('cands').split(';');
for (const c of cands) {
  const b = c.split(',').map((x) => { const [k, rank, n] = x.split(':'); return { k, rank: +rank || 0, n: +n || 1 }; });
  setPanel({ cand: { a: args.includes('--group') ? 'ally' : [], b, name: c } });
  const t0 = Date.now(); let F = { win: 0, m: 0, t: 0, n: 0 }, Z = { win: 0, m: 0, n: 0 }; const per = [];
  for (const h of heroes) {
    const bs = builds(h); let hw = 0;
    for (let s = 0; s < seeds; s++) {
      const f = battleFight(h, 'cand', bs.full, 500 + s); F.win += f.win; F.m += f.margin; F.t += f.t; F.n++; hw += f.win;
      const z = battleFight(h, 'cand', bs.bare, 500 + s); Z.win += z.win; Z.m += z.margin; Z.n++;
    }
    per.push(hw / seeds);
  }
  per.sort((a, b) => a - b);
  const allWin = per.filter((x) => x === 1).length, allLose = per.filter((x) => x === 0).length;
  console.log(`${c.padEnd(40)} full win ${(F.win / F.n).toFixed(2)} margin ${(F.m / F.n).toFixed(2)} | bare win ${(Z.win / Z.n).toFixed(2)} margin ${(Z.m / Z.n).toFixed(2)} | heroes always win ${allWin}, always lose ${allLose} | fight ${(F.t / F.n).toFixed(0)}s game, ${((Date.now() - t0) / (F.n + Z.n)).toFixed(0)} ms real`);
}
