// Round 15 (lane N): every ability of the six new heroes used at tiers I, II and III in a small fight, and the fight
// then run on for 12 s: nothing may throw, and nobody's place, speed or health may stop being a number (one bad
// angle in a knock-back spreads through every collision in the room and the run never ends).
//   node tools/test/newheroes-smoke.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { makeWorld, spawn, step } = await import('../../js/sim.js');
const { initKit, ABILITIES } = await import('../../js/kits.js');
const { tagAbility } = await import('../../js/fxtag.js');
const { HEROES } = await import('../../js/heroes.js');
const { HEROES3 } = await import('../../js/heroes3.js');
const { buildGrid } = await import('../../js/path.js');
const { setSeed } = await import('../../js/util.js');
let bad = 0, n = 0;
const finite = (w) => w.units.find((u) => ![u.x, u.y, u.vx, u.vy, u.kx, u.ky, u.hp, u.facing].every(Number.isFinite));
for (const id of Object.keys(HEROES3)) for (const ab of HEROES[id].abilities) for (const tier of [1, 2, 3]) {
  n++; setSeed(7 + tier);
  const w = makeWorld(900, 560); w.pillars.push({ x: 300, y: 140, r: 30 }); buildGrid(w);
  const u = spawn(w, id, 260, 280, { level: 1 }), nodes = {}; for (const a of HEROES[id].abilities) for (let i = 1; i <= tier; i++) nodes[a.id + i] = 1;
  initKit(u, id, { nodes }, 1); for (const k in u.kit.cd) u.kit.cd[k] = 999;
  const friend = spawn(w, 'archer', 200, 360, { level: 1 }); initKit(friend, 'archer', { nodes: {} }, 1);
  const E = ['brute', 'rattler', 'rattler', 'rattlerBow', 'orcShaman'].map((k, i) => { const e = spawn(w, k, 420 + (i % 2) * 60, 180 + i * 50, { mult: 1 }); e.aggro = true; e.maxHp *= 4; e.hp = e.maxHp; return e; });
  let err = null, t = 0, who = null;
  try {
    while (t < 13 && !who) {
      if (Math.abs(t - 1) < 1 / 120) { friend.hp = friend.maxHp * 0.4; u.target = E[0]; u.kit.using = ab.id; try { tagAbility(w, u, ab.id, tier, () => ABILITIES[ab.id].use(w, u, E[0], tier)); } finally { u.kit.using = null; } }
      if (u.downed) { u.downed = false; u.hp = u.maxHp; } if (friend.downed) { friend.downed = false; friend.hp = friend.maxHp; }
      step(w, 1 / 60); t += 1 / 60; who = finite(w);
    }
  } catch (e) { err = e; }
  if (err || who) { bad++; console.log(`  FAIL ${id} ${ab.id} ${'I'.repeat(tier)}: ${err ? String(err.stack).split('\n').slice(0, 2).join(' | ') : 'not a number on ' + who.kind + ' at ' + t.toFixed(2) + ' s'}`); }
}
console.log(`${n} casts, ${bad} failed`);
process.exit(bad ? 1 : 0);
