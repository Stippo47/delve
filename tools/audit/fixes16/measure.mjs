// Round 16 fixes (docs/audit/fixes16.md): a small before/after of when abilities fire. A few heroes, a few seeds, the
// audit-heroes scenarios (tools/audit/heroes/scenarios.mjs, fights.mjs, recorder.mjs), one JSON line per cell.
//   node tools/audit/fixes16/measure.mjs --heroes archer,twinfang [--tiers 2,3] [--seeds 8] [--dseeds 4]
//        [--scen duelMelee,boar,swarm,duo,allyTank,allyHealer,dungeon] [--out scratch/m.json]
// Per hero, tier and scenario: fights, wins, the hero's health left, the health margin (our side's share of health left
// minus theirs, -100..100), and per ability: casts a fight, the share of fights it went off in, and the share of its
// casts followed by something measurable (the recorder's 'productive').
// Compare two runs with: node tools/audit/fixes16/compare.mjs before.json after.json
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fs = await import('node:fs');
const SC = await import('../heroes/scenarios.mjs');
const { battle, dungeon } = await import('../heroes/fights.mjs');
const heroes = opt('heroes', 'archer').split(','), tiers = opt('tiers', '2,3').split(',').map(Number);
const nS = +opt('seeds', 8), nD = +opt('dseeds', 4);
const want = opt('scen', 'duelMelee,boar,swarm,duo,allyTank,allyHealer,dungeon').split(',');
const scens = SC.SCENARIOS.filter((s) => want.includes(s.id));
const out = [];
for (const hero of heroes) for (const tier of tiers) for (const sc of scens) {
  const c = { hero, tier, scen: sc.id, n: 0, win: 0, hp: 0, margin: 0, t: 0, ab: {} };
  const n = sc.dungeon ? nD : nS;
  for (let i = 0; i < n; i++) {
    const seed = sc.dungeon ? 5000 + i : 1000 + i * 17 + SC.SCENARIOS.indexOf(sc);
    const r = sc.dungeon ? dungeon(hero, tier, seed) : battle(hero, tier, sc, seed);
    c.n++; if (r.outcome === 'win') c.win++; c.hp += r.hpLeft; c.t += r.t;
    c.margin += sc.dungeon ? r.hpLeft : (r.sideHp || 0) - (r.foeHp || 0);
    for (const [id, A] of Object.entries(r.data.ab)) {
      const a = c.ab[id] || (c.ab[id] = { casts: 0, fired: 0, productive: 0 });
      a.casts += A.casts || 0; if ((A.casts || 0) > 0) a.fired++; a.productive += A.productive || 0;
    }
  }
  out.push(c);
  const abs = Object.entries(c.ab).map(([id, a]) => `${id} ${(a.casts / c.n).toFixed(1)}`).join(', ');
  console.log(`${hero} t${tier} ${sc.id.padEnd(10)} win ${c.win}/${c.n} hp ${(100 * c.hp / c.n).toFixed(0)}% margin ${(100 * c.margin / c.n).toFixed(0)} | ${abs}`);
}
if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify(out));
