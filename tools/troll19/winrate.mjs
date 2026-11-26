// Lane troll19 (round 19): how the troll-shaped kinds do in plain battle-mode fights (the room as the game makes it,
// no staging), so the same script run on the tree before the lane and after it shows whether their strength moved.
//   node tools/troll19/winrate.mjs [--n 40] [--kinds troll,rockTroll,yeti,troll@1,...] [--json out.json]
// Each kind (plain, elite @1, major @2), one, two and three of it, against three hero parties at a level picked so
// the fights are close to even (5 plain, 9 elite, 14 major): how often the trolls' side wins, how long a fight takes,
// how much health the winner has left.
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const FS = await import('node:fs');
const N = +opt('n', 40), DT = 1 / 60;
const save = freshSave(); save.cheat = true;
const PARTIES = ['paladin,archer', 'paladin,berserker,cleric', 'tower,twinfang,archer,cleric'];
const out = {};
let allW = 0, allN = 0;
for (const kind of opt('kinds', 'troll,rockTroll,yeti,troll@1,rockTroll@1,yeti@1,troll@2,rockTroll@2,yeti@2').split(',')) {
  const [k, rank] = kind.split('@');
  const lvl = +opt('level', +rank === 2 ? 14 : +rank === 1 ? 9 : 5);
  let wins = 0, n = 0, time = 0, draws = 0, never = 0, hpT = 0, hpH = 0; const per = [];
  for (const party of PARTIES) for (const cnt of [1, 2, 3]) {
    let w0 = 0;
    for (let i = 0; i < N; i++) {
      setSeed(9000 + i * 17 + cnt);
      for (const id of party.split(',')) { const hv = save.heroes[id]; hv.owned = true; hv.level = lvl; hv.nodes = {}; hv.points = P.START_POINTS + lvl - 1; P.autoSpend(save, id); }
      const run = B.newBattle(save, { arena: B.homeOf(k) || 'crypt', size: i % 2 ? 's' : 'l', a: party.split(',').map((id) => ({ k: id, n: 1 })), b: [{ k, n: cnt, rank: +rank || 0 }] });
      let t = 0; while (!run.summary && t < 300) { B.updateBattle(run, DT); t += DT; }
      n++; if (!run.summary) { never++; continue; }
      const s = run.summary; time += s.time;
      if (s.winner === 'b') { wins++; w0++; hpT += s.sides.b.health; } else if (s.winner === 'a') hpH += s.sides.a.health; else draws++;
    }
    per.push(`${cnt}v${party.split(',').length} ${w0}/${N}`);
  }
  allW += wins; allN += n;
  out[kind] = { fights: n, trollWins: wins, pct: +(100 * wins / n).toFixed(1), secs: +(time / Math.max(1, n - never)).toFixed(1), draws, never, trollHealthLeft: wins ? +(hpT / wins).toFixed(2) : null, heroHealthLeft: n - wins - draws - never ? +(hpH / (n - wins - draws - never)).toFixed(2) : null };
  console.log(`${kind.padEnd(12)} level ${String(lvl).padStart(2)}: trolls won ${String(wins).padStart(3)}/${n} (${(100 * wins / n).toFixed(0)}%), ${(time / Math.max(1, n - never)).toFixed(0)}s a fight, draws ${draws}, never ended ${never} | ${per.join('  ')}`);
}
console.log(`all: trolls won ${allW}/${allN} (${(100 * allW / allN).toFixed(1)}%)`);
if (opt('json')) FS.writeFileSync(opt('json'), JSON.stringify(out, null, 1));
