// Round 15 (lane N): the Mob, a hero that is four bodies. The designer: "Make new hero. Mob. Is 4 peasants. Is the
// collective of all 4. Each is like 30% the strength of 1 normal hero. Torch, pitchfork, axe, and dagger. They are
// strongly attracted to each other. All melee. They share 1 health pool."
//
// How it is built. One of the four (the torch-bearer) is the hero's own unit: the one in the party, on the HUD, in the
// save. Its def lists the other three kinds (def.bodies, units.js); sim.js spawn() makes them beside it whenever a Mob
// is spawned, anywhere (a run, a battle, the Book, the lab), and binds them to it:
//   body.partOf = the lead; lead.bodies = [the other three]
//   every POOL field of a body is the lead's own field (an accessor): health, statuses, buffs, the kit, trinkets, the
//   skill web's numbers, being stunned / frozen / rooted / asleep / afraid, being down, being dead, the side it is on.
// So a blow on any body comes off the one pool, a heal or a buff on any body lands on "the hero", and a status holds
// all four. What stays a body's own: where it is, where it faces, its weapon and its own attack clock.
// A body also carries summon = true and summonBy = the lead, so every "is this a party member" test in the game
// (HUD cards, the party list, heal targets, XP, pick-ups, the stats rows) already leaves it out and credits its blows
// to the lead. The places that had to be taught the rest are marked "round 15 (the Mob)" (docs/HEROES-r15.md lists them).
// Pure: no imports (sim.js, kits3.js, render.js and stats.js all read this).
export const MOB = {
  share: 0.3,        // one blow (or one tick of a zone) that catches several bodies: in full on the first, this much on each more
  armour: 0.35,      // an enemy's armour counts this much against one body's blow (four small blows are one hero's: without it armour takes its points off four times)
  slot: 34,          // with nothing to fight, the three keep this far from the lead (behind and beside it)
  leash: 96,         // further than this from the middle of the four, a body is drawn back in
  far: 150,          // and past this it drops everything and runs back, faster than it walks
  rush: 1.35,        // (how much faster)
  near: 150,         // a body with no orders fights what is this close to it
};
// What the bodies share with the lead (everything else is a body's own).
export const POOL_KEYS = [
  'hp', 'maxHp', 'st', 'stBy', 'buffs', 'kit', 'trinkets', 'trinketHooks', 'dmgMul', 'atkMul', 'moveMul', 'armor', 'level', 'potions',
  'team', 'trueTeam', 'flipKind', 'flipBy', 'flipUntil', 'follower', 'befuddled', 'bkey', 'side',
  'downed', 'dead', 'dying', 'gone', 'ethereal', 'exiting', 'invulnT',
  'frozenT', 'frozenBonus', 'freezeImmune', 'stunT', 'rootT', 'sleepT', 'deepT', 'koT', 'sickT', 'addledT', 'fearT', 'fearBy', 'fearFrom', 'fearGen', 'fearGenIn',
  'radiantT', 'radImmuneT', 'hexed', 'hexT', 'hexUntil', 'hexSelf', 'tangledT', 'tangleImmuneT', 'charmImmuneT', 'confuseImmuneT', 'sleepyImmuneT', 'bleedImmuneT', 'fearImmuneT',
  'shackledT', 'shackleImmuneT', 'bleedHoldT', 'dotAcc', 'shockT', 'bursts', 'regenT', 'regenRate', 'regenSrc', 'regenAb', 'leechT', 'leechBy', 'leechMul', 'leechAb',
  'guardBy', 'guardT', 'guardShare', 'mendGlow', 'barAlways',
];
export function bindBody(b, lead) {
  for (const k of POOL_KEYS) Object.defineProperty(b, k, { get: () => lead[k], set: (v) => { lead[k] = v; }, enumerable: true, configurable: true });
}
export const leadOf = (u) => (u && u.partOf) || u;
export const isMob = (u) => !!(u && (u.partOf || u.bodies));
// every body of the hero u belongs to, the lead first
export const bodiesOf = (u) => { const l = leadOf(u); return l && l.bodies ? [l, ...l.bodies] : [l]; };
// the middle of the four
export function mobMid(u) { const B = bodiesOf(u); let x = 0, y = 0; for (const b of B) { x += b.x; y += b.y; } return { x: x / B.length, y: y / B.length }; }
// where the three stand with nothing to fight: behind and beside the lead, turning with the way it goes
const SLOT_A = [2.35, -2.35, Math.PI];
export function mobSlot(body) {
  const l = body.partOf, i = Math.max(0, l.bodies.indexOf(body)), a = (l.mvA || 0) + SLOT_A[i % 3], d = MOB.slot * (i === 2 ? 1.25 : 1);
  return { x: l.x + Math.cos(a) * d, y: l.y + Math.sin(a) * d };
}
