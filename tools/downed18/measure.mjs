// Lane downed18: headless measurements of battle mode's downed state, revives and necromancy.
//   node tools/downed18/measure.mjs [--n 12]
// Per group of setups: fights, Valkyrie's Call casts a fight, heroes going down, revives (and by what), bleed-outs,
// fights that ended with the losing side all downed (no one dead on it standing), bodies raised (hero Necromancer's
// Raise Dead and the Seraph's raise), fights that ran out of time.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const DT = 1 / 60, N = +opt('n', 12);
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { AUDIT } = await import('../../js/stats.js');
const save = freshSave(); save.cheat = true;
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0, tier: 3 }; });

let casts = {};
AUDIT.on = (ev, w, u, t, amt, o) => { if (ev === 'cast' && o && o.ab) casts[o.ab] = (casts[o.ab] || 0) + 1; };

function fight(setup, seed) {
  setSeed(seed); casts = {};
  const run = B.newBattle(save, setup), w = run.world;
  const m = { downs: 0, revives: 0, by: {}, bleed: 0, raised: 0, raisedHero: 0, allDown: false, timeUp: false, t: 0, err: null };
  const wasDown = new Set();
  try {
    let t = 0;
    while (!run.summary && t < 400) {
      const before = new Set(w.corpses);
      B.updateBattle(run, DT); t += DT;
      for (const u of w.units) { if (u.downed && !u.dead && !wasDown.has(u)) { wasDown.add(u); m.downs++; } if (!u.downed && wasDown.has(u)) wasDown.delete(u); }
      // a body that left the floor with time still on it was raised (a fling keeps it in the list)
      for (const c of before) if (!w.corpses.includes(c) && c.t > 0.2 && w.corpses.length < 40) { m.raised++; if (B.isHero(c.kind)) m.raisedHero++; }
    }
    m.t = t;
  } catch (e) { m.err = e; }
  const S = run.summary;
  if (S) {
    m.timeUp = S.timeUp; m.winner = S.winner;
    const lose = S.winner === 'a' ? 'b' : S.winner === 'b' ? 'a' : null;
    if (lose && !S.timeUp) m.allDown = run.sides[lose].some((u) => u.downed && !u.dead);
    for (const r of (S.revives || [])) { m.revives++; m.by[r.ab || r.by] = (m.by[r.ab || r.by] || 0) + 1; }
    m.bleed = (S.bleeds || 0);
  } else if (!m.err) m.err = new Error('never ended');
  m.valk = casts.valkyrieCall || 0; m.rewind = casts.rewind || 0; m.raiseDead = casts.raiseDead || 0;
  return m;
}

const GROUPS = {
  'valkyrie + party vs foes': ['valkyrie,paladin,archer,cleric|goblin*5@2,orc*3@2', 'valkyrie,berserker,pyromancer|rattler*8@1,rattlerBow*4@2', 'valkyrie*2,twinfang,frost|wolf*8@2', 'valkyrie,paladin,storm|hellhound*4@2,imp*4@1', 'valkyrie,archer,druid|lizardBlade*5@2,rat*6@1'],
  'heroes vs heroes (valkyrie each side)': ['valkyrie,paladin,archer|valkyrie,berserker,pyromancer', 'valkyrie,paladin,frost|valkyrie,samurai,ninja'],
  'clockmaker (rewind III) + party': ['clockwork,paladin,archer|goblin*5@2,orc*3@2', 'clockwork,valkyrie,berserker|rattler*8@1,rattlerMace*3@2', 'clockwork,archer,pyromancer|clockwork,samurai,ninja'],
  'hero necromancer': ['necromancer,paladin,archer|rattler*8,goblin*4', 'necromancer,berserker|paladin,archer,cleric', 'rattler*10,necromancer|paladin,tower', 'necromancer,paladin*2|archer*3,pyromancer*2'],
  'seraph (raises foes)': ['seraph*2@1,angel*3,cherub*2|paladin,archer,cleric,pyromancer', 'seraph@1,sunBlade*3|angel*4,cherub*3', 'seraph*2@1,sunBlade*3@2|valkyrie,paladin,archer'],
};
console.log(`downed18 measure: ${N} seeds a setup`);
for (const [name, list] of Object.entries(GROUPS)) {
  const tot = { n: 0, err: 0, valk: 0, rewind: 0, raiseDead: 0, downs: 0, revives: 0, bleed: 0, raised: 0, raisedHero: 0, allDown: 0, timeUp: 0, time: 0, by: {} };
  for (const pair of list) {
    const [a, b] = pair.split('|');
    for (let i = 0; i < N; i++) {
      const m = fight({ arena: 'crypt', size: 'l', a: parse(a), b: parse(b) }, 500 + i);
      tot.n++; if (m.err) { tot.err++; console.log('  problem', pair, m.err.stack ? m.err.stack.split('\n').slice(0, 3).join(' | ') : m.err); continue; }
      for (const k of ['valk', 'rewind', 'raiseDead', 'downs', 'revives', 'bleed', 'raised', 'raisedHero']) tot[k] += m[k];
      tot.allDown += m.allDown ? 1 : 0; tot.timeUp += m.timeUp ? 1 : 0; tot.time += m.t;
      for (const [k, v] of Object.entries(m.by)) tot.by[k] = (tot.by[k] || 0) + v;
    }
  }
  const f = (x) => (x / Math.max(1, tot.n - tot.err)).toFixed(2);
  console.log(`\n${name}: ${tot.n} fights, ${tot.err} problems, ${tot.timeUp} out of time, ${f(tot.time)}s a fight`);
  console.log(`  Valkyrie's Call casts a fight ${f(tot.valk)}, Rewind casts ${f(tot.rewind)}, Raise Dead casts ${f(tot.raiseDead)}`);
  console.log(`  heroes downed a fight ${f(tot.downs)}, revived ${f(tot.revives)} (${Object.entries(tot.by).map(([k, v]) => k + ' ' + v).join(', ') || 'none'}), bled out ${f(tot.bleed)}`);
  console.log(`  share of downs revived ${tot.downs ? (100 * tot.revives / tot.downs).toFixed(0) : '-'}%, fights ended with the loser's last ones downed: ${tot.allDown}`);
  console.log(`  bodies raised a fight ${f(tot.raised)} (hero bodies ${f(tot.raisedHero)})`);
}
