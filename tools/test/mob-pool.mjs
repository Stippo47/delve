// Round 15 (lane N): the Mob's one health pool, checked (js/mob.js; the hooks in js/sim.js).
//   node tools/test/mob-pool.mjs
// Four bodies, one hero: a blow on any body comes off the one pool; one blow that catches several lands in full on the
// first and MOB.share on each more; a heal that reaches several counts once; a status, a buff and a stun on one body are
// on the hero; felled through any body the four go down together, and lifted they are all up; in a battle one fighter.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { makeWorld, spawn, step, hurt, heal, explode, addStatus, addBuff, stun, turnSide, restoreSide, unitNumbers } = await import('../../js/sim.js');
const { initKit } = await import('../../js/kits.js');
const { buildGrid } = await import('../../js/path.js');
const { MOB } = await import('../../js/mob.js');
const { newBattle, standing } = await import('../../js/battle.js');
const { freshSave } = await import('../../js/save.js');
let bad = 0;
const ok = (name, cond, got) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${got != null ? ' (' + got + ')' : ''}`); if (!cond) bad++; };
const near = (a, b) => Math.abs(a - b) < 0.01;
// (trait: false leaves Strength in Numbers off, so the pool's own arithmetic shows: together, the trait takes 7% off a blow for each neighbour)
const mk = (trait = false) => { const w = makeWorld(900, 500); buildGrid(w); const u = spawn(w, 'mob', 300, 250, { level: 1 }); initKit(u, 'mob', { nodes: {} }, 1); if (!trait) u.kit.trait = {}; const e = spawn(w, 'rattler', 700, 250, { mult: 1 }); return { w, u, e, all: [u, ...u.bodies] }; };
{ const { w, u } = mk(); ok('a Mob is four units, one of them the hero', w.units.filter((x) => x.team === 'hero').length === 4 && u.bodies.length === 3 && u.bodies.every((b) => b.partOf === u && b.summon)); }
{ const { w, u, e } = mk(); const h0 = u.hp; hurt(w, u.bodies[0], 40, e, { noDodge: true }); ok('a blow on one body comes off the pool in full', near(h0 - u.hp, 40) && u.bodies.every((b) => b.hp === u.hp), (h0 - u.hp).toFixed(1)); }
{ const { w, u, e, all } = mk(); const h0 = u.hp; for (const b of all) hurt(w, b, 40, e, { noDodge: true }); ok('one blow that catches all four: 1 + 3 x share', near(h0 - u.hp, 40 * (1 + 3 * MOB.share)), (h0 - u.hp).toFixed(1)); }
{ const { w, u, e } = mk(); const h0 = u.hp; explode(w, u.x - 20, u.y, 120, 40, {}, e, '#fff'); ok('a blast over all four: the same', near(h0 - u.hp, 40 * (1 + 3 * MOB.share)), (h0 - u.hp).toFixed(1)); }
{ const { w, u, e, all } = mk(); const h0 = u.hp; for (const b of all) hurt(w, b, 40, e, { noDodge: true }); step(w, 1 / 60); hurt(w, u.bodies[1], 40, e, { noDodge: true }); ok('the next blow, a moment later, is a new blow: in full', near(h0 - u.hp, 40 * (2 + 3 * MOB.share) ) || h0 - u.hp > 40 * (1.99 + 3 * MOB.share), (h0 - u.hp).toFixed(1)); }
{ const { w, u, e } = mk(true); const h0 = u.hp; hurt(w, u.bodies[0], 40, e, { noDodge: true }); ok('with its trait, all four together: a blow is 21% softer', near(h0 - u.hp, 40 * (1 - 0.21)), (h0 - u.hp).toFixed(1)); }
{ const { w, u, e, all } = mk(); for (const b of all) addStatus(w, b, 'burn', 20, e); ok('a cloud over all four builds 1 + 3 x share, on the hero', near(u.st.burn, 20 * (1 + 3 * MOB.share)) && u.bodies.every((b) => b.st === u.st), u.st.burn.toFixed(1)); }
{ const { w, u, e, all } = mk(); u.hp = 100; for (const b of all) heal(w, b, 30, e); ok('a heal that reaches all four counts once', near(u.hp, 130), (u.hp - 100).toFixed(1)); }
{ const { w, u, all } = mk(); addBuff(u.bodies[2], { id: 'x', dur: 3, dealt: 2 }); stun(w, u.bodies[1], 1.5); ok('a buff or a stun on one body is on the hero', all.every((b) => b.buffs.length === 1 && b.stunT === 1.5)); }
{ const { w, u, e, all } = mk(); hurt(w, u.bodies[1], 99999, e, { noDodge: true }); ok('felled through one body, all four are down', all.every((b) => b.downed)); u.downed = false; u.hp = 50; ok('lifted, all four are up', all.every((b) => !b.downed && b.hp === 50)); }
{ const { w, u, e, all } = mk(); turnSide(w, u.bodies[0], 'enemy', 'charm', e, 3); ok('charmed through one body, the four change sides', all.every((b) => b.team === 'enemy')); restoreSide(w, u); ok('and come back together', all.every((b) => b.team === 'hero')); }
{ const { u } = mk(); const n = unitNumbers(u); ok('its numbers are the four together', n.aps > 3.5 && n.hit * n.aps > 14, `${n.hit.toFixed(1)} a blow, ${n.aps.toFixed(2)} blows a second`); }
{ const { w, u, e, all } = mk(); e.aggro = true; for (let i = 0; i < 60 * 8; i++) step(w, 1 / 60); const far = Math.max(...all.map((b) => Math.hypot(b.x - u.x, b.y - u.y))); ok('eight seconds into a fight the four are still together', far < MOB.far, far.toFixed(0) + ' apart at most');
  u.bodies[0].x += 300; u.bodies[0].kx = 0; for (let i = 0; i < 60 * 3; i++) step(w, 1 / 60); const d = Math.hypot(u.bodies[0].x - u.x, u.bodies[0].y - u.y); ok('one put 300 away is back with the rest in three seconds', d < MOB.far, d.toFixed(0)); }
{ const s = freshSave(); s.cheat = true; const run = newBattle(s, { arena: 'wildwood', a: [{ k: 'mob', n: 1, tier: 1 }], b: [{ k: 'rattler', n: 2 }] }); ok('in a battle it is one fighter', standing(run, 'a').length === 1 && run.start.a === 1, standing(run, 'a').length); }
console.log(bad ? `${bad} failed` : 'all passed');
process.exit(bad ? 1 : 0);
