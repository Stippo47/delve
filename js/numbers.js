// A unit's real numbers for the pause panel and the About page (round 9, lane T). sim.js unitNumbers reads the unit
// the way the sim does (its weapon blow with its web, trinkets, buffs and statuses; attacks per second from atkRate;
// speed from speedOf). Heroes with an attack of their own (kits.js ATTACKS: the casters' sparks, orbs, notes...) fire
// more than one plain blow, so their "per hit" is measured: the hero's own attack code is run against a still dummy
// in an empty room for a few seconds and what one attack deals to one target is compared with the plain blow. The
// run's dice and sound queue are put back as they were, so looking never changes a run.
import { makeWorld, spawn, step, unitNumbers } from './sim.js';
import { initKit, hasOwnAttack } from './kits.js';
import { newStats } from './stats.js';
import { DEFS } from './units.js';
import { getSeed, setSeed } from './util.js';
import { listening, listen } from './sfx.js';
import { heroProbe } from './dungeon.js';

const share = {}; // kind -> one attack's damage on one target / the plain blow

// Run fn without touching the run: the dice and the sound queue as they were.
export function quietly(fn) {
  const seed = getSeed(), snd = listening();
  if (snd) listen(false);
  try { return fn(); } finally { setSeed(seed); if (snd) listen(true); }
}

function measure(kind) {
  const w = makeWorld(1200, 600);
  w.stats = newStats([kind]);
  const u = spawn(w, kind, 300, 300, { level: 1 });
  initKit(u, kind, { nodes: {} }, 1); // no abilities bought: only the attack
  const plain = unitNumbers(u).hit; // the plain blow
  const reach = Math.max(30, Math.min(u.def.range || 30, 400) * 0.7);
  const d = spawn(w, 'rat', 300 + u.r + reach, 300, { hp: 1e7, hpMul: 1e6 });
  d.def = { ...d.def, dmg: 0, dodge: 0, res: {}, abilCd: 0 }; d.maxHp = d.hp = 1e7; d.atkT = 1e9; d.abilT = 1e9; d.r = 26; d.mass = 99; // a middling body that doesn't budge
  d.buffs.push({ id: 'probe', t: 1e9, dur: 1e9, root: true });
  u.aggro = true; u.target = d; u.facing = 0;
  let attacks = 0, last = u.lastAttackT;
  for (let i = 0; i < 300; i++) {
    if (i === 200) u.atkT = 1e9; // no new attacks for the last stretch: what's in the air lands
    step(w, 1 / 60);
    if (u.lastAttackT !== last) { last = u.lastAttackT; if (i < 200) attacks++; }
  }
  const dealt = (w.stats.heroes[kind].src.dmg.attack || 0);
  return attacks && plain > 0 && dealt > 0 ? dealt / attacks / plain : 1;
}
export function attackShare(kind) {
  if (!hasOwnAttack(kind) || !DEFS[kind]) return 1;
  if (share[kind] == null) share[kind] = quietly(() => { try { return measure(kind); } catch (e) { return 1; } });
  return share[kind];
}

// The numbers a unit fights with right now (sim.js unitNumbers, a hero's own attack measured).
export function numbersOf(u) {
  if (!u) return null;
  const n = unitNumbers(u);
  if (u.kit && !u.summon) n.hit *= attackShare(u.kind);
  return n;
}
// A hero from the save as it would walk into a room (dungeon.js heroProbe), for the camp's About page.
export function heroNumbers(save, id, trinkets) {
  return quietly(() => numbersOf(heroProbe(save, id, trinkets)));
}
