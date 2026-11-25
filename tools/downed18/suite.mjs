// Lane downed18: tools/battles.mjs's suite, also counting who won (a, b, draw) and listing the time-ups.
// Headless battle-mode checks in Node (no browser): js/battle.js.
//   node tools/battles.mjs                      the designer's example, then every kind against a hero pair (both ways
//                                               round), mirror fights and random mixed fights; reports errors, fights
//                                               that never end, and units that turn up on no side
//   node tools/battles.mjs --a rattler*10,necromancer --b paladin,tower [--n 20] [--v]
//                                               one setup n times: who wins how often, and how long it takes
// A stack is kind, kind*count or kind*count@rank (1 elite, 2 major).
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const verbose = args.includes('--v');
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const DT = 1 / 60;
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { DEFS } = await import('../../js/units.js');

const save = freshSave(); save.cheat = true;
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });

function fight(setup, seed) {
  setSeed(seed);
  let run, err = null, t = 0;
  try {
    run = B.newBattle(save, setup);
    while (!run.summary && t < 400) {
      B.updateBattle(run, DT); t += DT;
      for (const u of run.world.units) if (!u.dead && u.team !== 'neutral' && !run.world.battle.side[u.team]) throw new Error(`${u.kind} is on no side (team ${u.team})`);
    }
  } catch (e) { err = e; }
  return { run, err, t, sum: run && run.summary };
}
const show = (list) => list.map((s) => `${s.k}${s.n > 1 ? '*' + s.n : ''}${s.rank ? '@' + s.rank : ''}`).join(',');

if (opt('a') && opt('b')) {
  const setup = { arena: opt('arena', 'crypt'), a: parse(opt('a')), b: parse(opt('b')) }, n = +opt('n', 20);
  const wins = { a: 0, b: 0, draw: 0 }; let time = 0, bad = 0;
  for (let i = 0; i < n; i++) {
    const r = fight(setup, 100 + i);
    if (r.err || !r.sum) { bad++; console.log('  problem:', r.err ? r.err.stack : 'never ended'); continue; }
    wins[r.sum.winner]++; time += r.sum.time;
    if (verbose) console.log(`  ${r.sum.winner} in ${r.sum.time.toFixed(1)}s${r.sum.timeUp ? ' (time)' : ''}  blue ${r.sum.sides.a.left}/${r.sum.sides.a.start}  red ${r.sum.sides.b.left}/${r.sum.sides.b.start}`,
      verbose ? JSON.stringify(r.sum.sides.a.rows.map((x) => [x.k, Math.round(x.dmg), Math.round(x.taken), x.kills])) + ' ' + JSON.stringify(r.sum.sides.b.rows.map((x) => [x.k, Math.round(x.dmg), Math.round(x.taken), x.kills])) : '');
  }
  console.log(`${show(setup.a)}  vs  ${show(setup.b)}: blue ${wins.a}, red ${wins.b}, draws ${wins.draw}, problems ${bad}, ${(time / Math.max(1, n - bad)).toFixed(1)}s a fight`);
} else {
  const R = B.battleRoster(save);
  const kinds = R.dungeons.flatMap((d) => d.kinds), bosses = R.dungeons.flatMap((d) => d.bosses);
  let n = 0, bad = 0, timeUps = 0; const W = { a: 0, b: 0, draw: 0 };
  const run1 = (label, setup, seed) => {
    const r = fight(setup, seed); n++;
    if (r.err || !r.sum) { bad++; console.log(`  PROBLEM ${label}: ${show(setup.a)} vs ${show(setup.b)}:`, r.err ? r.err.stack.split('\n').slice(0, 4).join('\n') : 'never ended'); return null; }
    if (r.sum.timeUp) { timeUps++; if (verbose) console.log(`  time ran out: ${show(setup.a)} vs ${show(setup.b)}`); }
    W[r.sum.winner]++; return r.sum;
  };
  const ex = run1('example', { arena: 'crypt', a: parse('rattler*10,necromancer'), b: parse('paladin,tower') }, 1);
  if (ex) console.log(`example: ${ex.winner} in ${ex.time.toFixed(1)}s`);
  // every enemy kind, three of it, on each side against a hero pair; elites and majors of it too
  for (const k of kinds) {
    run1('kind as blue', { arena: B.homeOf(k), a: [{ k, n: 3, rank: 0 }], b: parse('paladin,archer') }, 7);
    run1('kind as red', { arena: B.homeOf(k), a: parse('wildmane,cleric'), b: [{ k, n: 3, rank: 0 }] }, 8);
    run1('elite vs major', { arena: B.homeOf(k), a: [{ k, n: 2, rank: 1 }], b: [{ k, n: 1, rank: 2 }] }, 9);
  }
  for (const k of bosses) {
    run1('boss as red', { arena: B.homeOf(k), a: parse('paladin,archer,cleric,pyromancer'), b: [{ k, n: 1, rank: 0 }] }, 11);
    run1('boss as blue', { arena: B.homeOf(k), a: [{ k, n: 1, rank: 0 }], b: parse('rattler*6,goblin*6') }, 12);
  }
  for (const h of R.heroes) run1('mirror', { arena: 'warren', a: [{ k: h, n: 2, rank: 0 }], b: [{ k: h, n: 2, rank: 0 }] }, 13);
  // random mixed fights
  const all = [...R.heroes, ...kinds];
  let s = 12345; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const side = () => Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => { const k = all[Math.floor(rnd() * all.length)]; return { k, n: 1 + Math.floor(rnd() * 4), rank: DEFS[k].team === 'hero' ? 0 : Math.floor(rnd() * 3) % 3 }; });
  for (let i = 0; i < +opt('n', 60); i++) run1('mixed', { arena: R.dungeons[i % R.dungeons.length].id, a: side(), b: side() }, 200 + i);
  console.log(`${n} battles, ${bad} problems, ${timeUps} ran out of time; blue ${W.a}, red ${W.b}, draws ${W.draw}`);
}
