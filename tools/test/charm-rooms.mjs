// Round 14 (lane S): the charm rules in a run, headless. The designer: "Bosses immune to charm. The last unit on a
// floor charmed will count as beating the level. They will follow u into the next room fully charmed."
//   node tools/test/charm-rooms.mjs [--v]
// Each case builds a real run (dungeon.js), sets the room up, charms who the case says, plays it on and checks.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const D = await import('../../js/dungeon.js');
const S = await import('../../js/sim.js');
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { DEFS } = await import('../../js/units.js');
const verbose = process.argv.includes('--v');
const DT = 1 / 60;
let fails = 0;
const ok = (c, msg) => { console.log((c ? '  ok   ' : '  FAIL ') + msg); if (!c) fails++; };
const save = () => { const s = freshSave(); s.cheat = true; for (const k of ['enchantress', 'paladin', 'archer']) s.heroes[k] = { ...(s.heroes[k] || {}), level: 30 }; return s; };
const enemiesOf = (w) => w.units.filter((u) => (u.trueTeam || u.team) === 'enemy' && S.alive(u) && !u.def.trap);
const heroOf = (w) => w.units.find((u) => u.team === 'hero' && !u.summon && S.alive(u) && u.def.team === 'hero');
// A fight room with only the given enemies in it (the rest removed) and no waves to come.
function freshRoom(seed, kinds) {
  setSeed(seed);
  const run = D.newRun(save(), { theme: 'crypt', party: ['enchantress', 'paladin', 'archer'], floor: 1 });
  for (let i = 0; i < 40 && run.node.kind !== 'fight'; i++) { run.phase = 'transition'; run.fadeOut = 1; D.update(run, DT); } // (the first fight room)
  const w = run.world;
  for (const u of enemiesOf(w)) u.dead = true;
  w.units = w.units.filter((u) => !u.dead); w.waves = null; w.chest = false;
  const h = heroOf(w);
  const made = kinds.map((k, i) => { const u = S.spawn(w, k, h.x + 160 + 40 * i, h.y + (i % 2 ? 50 : -50), { mult: 1 }); u.aggro = true; return u; });
  return { run, w, made, h };
}
const play = (run, secs, until) => { for (let t = 0; t < secs; t += DT) { D.update(run, DT); if (until && until()) return t; } return secs; };
const charmFull = (w, u, by) => S.addStatus(w, u, 'charm', 999, by);

console.log('charm in a run');
{ // 1. the last enemy, charmed full, wins the room and follows the party into the next room, where it fights
  const { run, w, made: [e], h } = freshRoom(1, ['rattler']);
  charmFull(w, e, h);
  ok(e.team === 'hero' && e.flipKind === 'charm', 'the last enemy is enthralled, not smitten (was: stunned 1.5 s)');
  play(run, 0.2);
  ok(w.cleared && e.follower && e.flipUntil == null, 'the room counts as won; it is a follower, charmed with no end');
  const room0 = run.rooms;
  play(run, 120, () => run.rooms > room0 && run.phase === 'fight');
  const w2 = run.world;
  ok(run.rooms === room0 + 1 && w2 !== w, 'the party went on to the next room (' + run.node.kind + ')');
  ok(w2.units.includes(e) && e.team === 'hero' && S.alive(e), 'the follower walked in with them, still charmed (' + e.kind + ' ' + Math.round(e.hp) + '/' + e.maxHp + ')');
  let dealt = 0, blows = 0; e.trinketHooks = [...(e.trinketHooks || []), { hit: (w3, src, o, amt) => { if ((o.trueTeam || o.team) === 'enemy') { dealt += amt; blows++; } } }]; // (count its blows on the room's enemies)
  for (let t = 0; t < 40 && S.alive(e) && enemiesOf(w2).length; t += DT) D.update(run, DT);
  ok(blows > 0, 'in the next room it fights the room enemies for the party: ' + blows + ' blows, ' + Math.round(dealt) + ' damage in 40 s (' + (S.alive(e) ? 'still standing' : 'it fell') + ')');
}
{ // 2. several charmed at once when the last hostile one dies: all of them follow
  const { run, w, made, h } = freshRoom(2, ['rattler', 'rattler', 'goblin']);
  charmFull(w, made[0], h); charmFull(w, made[1], h);
  play(run, 0.3);
  ok(!w.cleared, 'two charmed, one still hostile: the room is not won');
  S.hurt(w, made[2], 9999, h);
  play(run, 0.3);
  ok(w.cleared && made[0].follower && made[1].follower, 'the last hostile one dies: the room is won and both charmed follow');
  const room0 = run.rooms; play(run, 120, () => run.rooms > room0 && run.phase === 'fight');
  ok(run.world.units.filter((u) => u.follower).length === 2, 'both are in the next room');
}
{ // 3. a charmed summoner: what it calls up is charmed too (an elite devil calls imps)
  const { run, w, made: [d], h } = freshRoom(3, ['devil']);
  const { makeElite } = await import('../../js/elites.js'); makeElite(w, d);
  d.el = d.el || {}; d.el.imps = 0; // (due now)
  charmFull(w, d, h);
  play(run, 3);
  const imps = run.world.units.filter((u) => u.kind === 'imp' && S.alive(u));
  ok(imps.length > 0 && imps.every((u) => u.team === 'hero' && u.flipKind === 'charm'), 'a charmed devil calls up imps on the party\'s side, charmed like it (' + imps.length + ')');
  ok(run.world.cleared, 'and they do not hold the room open');
}
{ // 4. a charmed splitter: what it splits into stays charmed (a big slime dies into two)
  const { run, w, made: [sl], h } = freshRoom(4, ['slime']);
  S.spawn(w, 'rattler', sl.x + 300, sl.y, { mult: 1 }).aggro = true; // (one hostile, so the room stays open)
  charmFull(w, sl, h);
  play(run, 0.2);
  S.hurt(w, sl, 9999, null);
  const kids = w.units.filter((u) => u.kind === (DEFS.slime.splitsInto || 'slimeSmall') && S.alive(u));
  ok(kids.length === 2 && kids.every((u) => u.team === 'hero' && u.flipKind === 'charm' && u.flipUntil > w.time), 'a charmed slime that dies splits into two charmed slimelets, for the time it had left (' + kids.map((u) => (u.flipUntil - w.time).toFixed(1) + ' s').join(', ') + ')');
}
{ // 5. waves still to come: the room isn't won; the next wave comes while the charmed one fights for the party
  const { run, w, made: [e], h } = freshRoom(5, ['rattler']);
  w.waves = { left: 1, budget: 4, n: 0, last: 1 };
  charmFull(w, e, h);
  const t = play(run, 6, () => enemiesOf(w).some((o) => o.team === 'enemy'));
  ok(!w.cleared && enemiesOf(w).some((o) => o.team === 'enemy'), 'a wave still to come: the room is not won, the wave comes up (' + t.toFixed(1) + ' s) with the charmed one still on the party\'s side: ' + (e.team === 'hero'));
}
{ // 6. bosses take no charm (a boss, a floor's mini-boss)
  setSeed(6);
  const w = S.makeWorld(800, 480);
  const b = S.spawn(w, 'graveWarden', 400, 240, { mult: 1 }), h = S.spawn(w, 'enchantress', 200, 240, { level: 20 });
  S.addStatus(w, b, 'charm', 999, h);
  const m = S.spawn(w, 'rattler', 500, 240, { mult: 1 }); m.mini = true; S.addStatus(w, m, 'charm', 999, h);
  ok(b.st.charm === 0 && b.team === 'enemy' && m.st.charm === 0 && m.team === 'enemy', 'a boss and a mini-boss take no charm at all');
}
{ // 7. the party's last hero standing, charmed full by a Succubus, only swoons (a run would sit with nobody fighting)
  setSeed(7);
  const w = S.makeWorld(800, 480);
  const h = S.spawn(w, 'paladin', 200, 240, { level: 20 }), s = S.spawn(w, 'succubus', 400, 240, { mult: 1 });
  S.addStatus(w, h, 'charm', 999, s);
  ok(h.team === 'hero' && h.stunT > 0, 'the last hero is smitten (stunned ' + h.stunT.toFixed(1) + ' s), not turned');
}
console.log('charm in a battle');
{ // 8. battle mode keeps the round 13 rule for a side's last unit: smitten, not turned (else the battle has nobody to fight)
  setSeed(8);
  const run = B.newBattle(save(), { arena: 'crypt', a: [{ k: 'rattler', n: 1, rank: 0 }], b: [{ k: 'enchantress', n: 1, rank: 0 }] });
  const w = run.world, e = w.units.find((u) => u.kind === 'rattler'), h = w.units.find((u) => u.kind === 'enchantress');
  S.addStatus(w, e, 'charm', 999, h);
  ok(e.team !== h.team && e.stunT > 0, 'a side\'s last unit is smitten in a battle (stunned ' + e.stunT.toFixed(1) + ' s)');
  const run2 = B.newBattle(save(), { arena: 'crypt', a: [{ k: 'rattler', n: 2, rank: 0 }], b: [{ k: 'enchantress', n: 1, rank: 0 }] });
  const w2 = run2.world, e2 = w2.units.find((u) => u.kind === 'rattler'), h2 = w2.units.find((u) => u.kind === 'enchantress');
  S.addStatus(w2, e2, 'charm', 999, h2);
  ok(e2.team === h2.team && e2.flipKind === 'charm', 'with a friend left it is enthralled as before');
}
console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
