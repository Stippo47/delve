// Round 15 (lane N): Shackled, checked against the designer's rule ("target can't do basic attacks, ability cooldowns
// are set back 50%") and the limits in js/statuses.js SHACKLE.
//   node tools/test/shackle.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { makeWorld, spawn, step, addStatus } = await import('../../js/sim.js');
const { initKit, cooldownOf } = await import('../../js/kits.js');
const { HEROES } = await import('../../js/heroes.js');
const { buildGrid } = await import('../../js/path.js');
const { SHACKLE, STATUS } = await import('../../js/statuses.js');
const { due, again } = await import('../../js/elites.js');
const { DEFS } = await import('../../js/units.js');
let bad = 0;
const ok = (name, cond, got) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${got != null ? ' (' + got + ')' : ''}`); if (!cond) bad++; };
const room = () => { const w = makeWorld(900, 500); buildGrid(w); return w; };
const run = (w, secs) => { for (let i = 0; i < Math.round(secs * 60); i++) step(w, 1 / 60); };

// a plain enemy striking a target: its blows stop for the 4 s, and start again
{ const w = room(), e = spawn(w, 'rattler', 400, 250, { mult: 1 }), d = spawn(w, 'paladin', 440, 250, { level: 1 }); initKit(d, 'paladin', { nodes: {} }, 1); d.maxHp = d.hp = 1e6; e.aggro = true; e.maxHp = e.hp = 1e6;
  run(w, 4); const a0 = e.lastAttackT; ok('before: it strikes', a0 > 0);
  addStatus(w, e, 'shackle', 60, d); ok('60 of 100: building, not locked', e.st.shackle === 60 && !(e.shackledT > 0));
  addStatus(w, e, 'shackle', 60, d); ok('full: SHACKLED for 4 s, the build-up back to 0', e.shackledT === SHACKLE.dur && e.st.shackle === STATUS.shackle.after, e.shackledT);
  const mark = e.lastAttackT; run(w, SHACKLE.dur - 0.1); ok('no basic attack while shackled', e.lastAttackT === mark);
  run(w, 2.5); ok('it strikes again once the irons are off', e.lastAttackT > mark);
  const st0 = e.st.shackle; addStatus(w, e, 'shackle', 100, d); ok('and can\'t be shackled again for 6 s after', !(e.shackledT > 0) && e.st.shackle === st0); }
// a hero's abilities: each set back by half its own full length, never past one full cooldown
{ const w = room(), h = spawn(w, 'paladin', 300, 250, { level: 1 }); initKit(h, 'paladin', { nodes: { shieldBash1: 1, guard1: 1, consecrate1: 1 } }, 1);
  const A = HEROES.paladin.abilities, full = A.map((ab) => cooldownOf(h, ab));
  h.kit.cd[A[0].id] = 0; h.kit.cd[A[1].id] = full[1] * 0.25; h.kit.cd[A[2].id] = full[2] * 0.8;
  addStatus(w, h, 'shackle', 100, null);
  ok('a ready ability has half its cooldown to wait', Math.abs(h.kit.cd[A[0].id] - full[0] * 0.5) < 0.01, h.kit.cd[A[0].id].toFixed(1) + ' of ' + full[0].toFixed(1));
  ok('one a quarter through its wait is at three quarters', Math.abs(h.kit.cd[A[1].id] - full[1] * 0.75) < 0.01);
  ok('one with 80% left goes to a full cooldown, no further', Math.abs(h.kit.cd[A[2].id] - full[2]) < 0.01); }
// while it builds: cooldowns run slower (half speed when nearly full)
{ const w = room(), h = spawn(w, 'paladin', 300, 250, { level: 1 }); initKit(h, 'paladin', { nodes: { shieldBash1: 1 } }, 1); h.kit.cd.shieldBash = 10; h.st.shackle = 90; run(w, 1);
  ok('at 90 of 100 a second takes about half a second off a cooldown', h.kit.cd.shieldBash > 9.4 && h.kit.cd.shieldBash < 9.65, (10 - h.kit.cd.shieldBash).toFixed(2)); }
// a plain enemy's one ability, and a brain's timed moves (elites.js due / again)
{ const w = room(), k = Object.keys(DEFS).find((x) => DEFS[x].team === 'enemy' && DEFS[x].abilCd && !DEFS[x].boss && !DEFS[x].brain), e = spawn(w, k, 400, 250, { mult: 1 }); e.abilT = 0;
  addStatus(w, e, 'shackle', 100, null); ok(`a plain enemy's ability (${k}) is set back half its cooldown`, Math.abs(e.abilT - DEFS[k].abilCd * 0.5) < 0.01, e.abilT.toFixed(1) + ' of ' + DEFS[k].abilCd); }
{ const w = room(), e = spawn(w, 'rattler', 400, 250, { mult: 1 }); again(e, 'slam', 8, 8); due(e, 'slam', 6); again(e, 'spit', 4, 4); due(e, 'spit', 4);
  addStatus(w, e, 'shackle', 100, null); ok('a brain\'s timed moves are each set back half their own length', Math.abs(e.el.slam - 6) < 0.01 && Math.abs(e.el.spit - 2) < 0.01, `slam ${e.el.slam}, spit ${e.el.spit}`); }
// the limit on bosses
{ const w = room(), k = Object.keys(DEFS).find((x) => DEFS[x].boss && DEFS[x].abilCd), b = spawn(w, k, 400, 250, { mult: 1 }); b.abilT = 0;
  addStatus(w, b, 'shackle', 100, null);
  ok(`a boss (${k}): 40% of the time`, Math.abs(b.shackledT - SHACKLE.dur * SHACKLE.boss) < 0.01, b.shackledT.toFixed(1) + ' s');
  ok('a quarter of a cooldown, not half', Math.abs(b.abilT - DEFS[k].abilCd * SHACKLE.bossSetback) < 0.01, b.abilT.toFixed(1) + ' of ' + DEFS[k].abilCd);
  ok('12 s before the next', Math.abs(b.shackleImmuneT - (b.shackledT + SHACKLE.bossImmuneT)) < 0.01); }
console.log(bad ? `${bad} failed` : 'all passed');
process.exit(bad ? 1 : 0);
