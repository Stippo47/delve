// Round 16 (lane slimes16): a few fights with slimes, the same seeds every time, so a change to how slimes move and
// hit can be measured before and after. For each setup: who won, how long the fight took (time to kill), and the
// damage each side dealt and took (the battle summary's rows), averaged over the seeds.
//   node tools/slime-fights.mjs [--n 20] [--json out.json]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const B = await import('../js/battle.js');
const { setSeed } = await import('../js/util.js');
const { freshSave } = await import('../js/save.js');
const save = freshSave(); save.cheat = true;
const DT = 1 / 60, N = +opt('n', 20);
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
const SETUPS = [
  ['wolf', 'slime'], ['wolf', 'slimePoison'], ['wolf*2', 'slimeBig'], ['wolf*2', 'fireSlime*2'],
  ['paladin', 'slime*3'], ['berserker', 'slime*3'], ['archer', 'slimeSmall*4'], ['paladin,archer', 'slimeBig,slimePoison*2'],
];
const out = [];
for (const [a, b] of SETUPS) {
  const setup = { arena: B.homeOf(parse(b)[0].k), a: parse(a), b: parse(b) };
  let wins = 0, time = 0, dmgA = 0, dmgB = 0, killT = 0, killN = 0;
  for (let i = 0; i < N; i++) {
    setSeed(100 + i);
    const run = B.newBattle(save, setup); let t = 0;
    // time to the first slime kill, from the battle's own clock
    let first = null, reds = null;
    while (!run.summary && t < 300) {
      B.updateBattle(run, DT); t += DT;
      const w = run.world; if (!w || !w.battle) continue;
      if (!reds) reds = w.units.filter((u) => w.battle.side[u.team] === 'b');
      if (first == null && reds.some((u) => u.dead || u.hp <= 0)) first = t;
    }
    const s = run.summary; if (!s) continue;
    if (s.winner === 'a') wins++;
    time += s.time; if (first != null) { killT += first; killN++; }
    dmgA += s.sides.a.rows.reduce((q, r) => q + r.dmg, 0); dmgB += s.sides.b.rows.reduce((q, r) => q + r.dmg, 0);
  }
  const row = { a, b, aWins: wins, n: N, time: +(time / N).toFixed(1), firstKill: killN ? +(killT / killN).toFixed(1) : null, aDealt: Math.round(dmgA / N), bDealt: Math.round(dmgB / N),
    bDps: +(dmgB / Math.max(1, time)).toFixed(2) };
  out.push(row);
  console.log(`${a.padEnd(16)} vs ${b.padEnd(24)} blue wins ${String(wins).padStart(2)}/${N}  fight ${String(row.time).padStart(5)}s  first slime down ${String(row.firstKill).padStart(5)}s  blue dealt ${String(row.aDealt).padStart(4)}  slimes dealt ${String(row.bDealt).padStart(4)} (${row.bDps}/s)`);
}
if (opt('json')) (await import('node:fs')).writeFileSync(opt('json'), JSON.stringify(out, null, 1));
