// Lane troll19: what a troll-shaped kind does in a fight, to compare the tree before the lane with after it.
//   node tools/troll19/dps.mjs [--kind troll] [--count 3] [--party paladin,archer] [--level 5] [--n 20]
// Per fight: how long, the trolls' damage a second, the heroes' damage a second, and of the trolls' time: holding the
// boulder, bare-handed with it lying loose, with none; how many times it was let go at speed (a throw or a charge's end).
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const N = +opt('n', 20), DT = 1 / 60, kind = opt('kind', 'troll'), cnt = +opt('count', 3), party = opt('party', 'paladin,archer'), lvl = +opt('level', 5);
const [k, rank] = kind.split('@');
const save = freshSave(); save.cheat = true;
let T = 0, dT = 0, dH = 0, held = 0, loose = 0, none = 0, throws = 0, wins = 0, alive = 0;
for (let i = 0; i < N; i++) {
  setSeed(9000 + i * 17 + cnt);
  for (const id of party.split(',')) { const hv = save.heroes[id]; hv.owned = true; hv.level = lvl; hv.nodes = {}; hv.points = P.START_POINTS + lvl - 1; P.autoSpend(save, id); }
  const run = B.newBattle(save, { arena: B.homeOf(k) || 'crypt', size: i % 2 ? 's' : 'l', a: party.split(',').map((id) => ({ k: id, n: 1 })), b: [{ k, n: cnt, rank: +rank || 0 }] });
  const was = new Map();
  let t = 0; while (!run.summary && t < 300) {
    B.updateBattle(run, DT); t += DT;
    for (const u of run.sides.b) { if (u.dead) continue; alive += DT; const b = u.bould || u.snow; if (!b) none += DT; else if (b.held) held += DT; else loose += DT;
      const h = !!(b && b.held), sp = b ? Math.hypot(b.vx, b.vy) : 0; if (was.get(u) && !h && sp > 150) throws++; was.set(u, h); }
  }
  const s = run.summary; if (!s) continue; T += s.time; if (s.winner === 'b') wins++;
  dT += s.sides.b.rows.reduce((n, r) => n + (r.dmg || 0), 0); dH += s.sides.a.rows.reduce((n, r) => n + (r.dmg || 0), 0);
}
console.log(`${kind} x${cnt} v ${party} L${lvl}: trolls won ${wins}/${N}, ${(T / N).toFixed(0)}s a fight; trolls' damage ${(dT / T).toFixed(1)}/s, heroes' ${(dH / T).toFixed(1)}/s; a troll's time: holding ${(100 * held / alive).toFixed(0)}%, boulder loose ${(100 * loose / alive).toFixed(0)}%, none ${(100 * none / alive).toFixed(0)}%; let go at speed ${(throws / (alive / 60)).toFixed(1)} a troll-minute`);
