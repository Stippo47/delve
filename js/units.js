// Unit definitions. Numbers are tuning knobs; behaviour lives in sim.js.
// Heroes come from heroes.js (one def per hero, built below); extra enemy kinds come from enemies.js.
import { HEROES } from './heroes.js';
import { ENEMIES } from './enemies.js';
// r: collider (covers shoulders), vr: head radius the sprite is sized from.
// turn: how fast the movement heading swings (rad/s), accel: speed gained per second, face: sprite turn rate.
// role: 'melee' stands and fights, 'ranged' keeps distance, 'skirmish' darts in and out.

export const DEFS = {
  archer: {
    team: 'hero', name: 'Archer', r: 31, vr: 22, turn: 5, accel: 260, face: 5, mass: 1, hp: 70, speed: 72, role: 'ranged',
    range: 270, keep: 170, atkCd: 1.05, dmg: 9, chill: 34, dodge: 0.2,
    temp: 0.35, commit: 0.8, ability: 'barrage', abilCd: 7,
  },
  knight: {
    team: 'hero', name: 'Knight', r: 34, vr: 24, turn: 3.2, accel: 170, face: 3.4, mass: 2.2, hp: 140, speed: 56, role: 'melee',
    range: 24, atkCd: 1.3, dmg: 14, knock: 170, arc: 1.9, shield: 0.4,
    temp: 0.18, commit: 1.2, ability: 'charge', abilCd: 8, heavy: true,
  },
  rogue: {
    team: 'hero', name: 'Rogue', r: 29, vr: 20, turn: 7, accel: 420, face: 7, mass: 0.9, hp: 80, speed: 96, role: 'skirmish',
    range: 16, atkCd: 0.55, dmg: 7, poison: 16, arc: 1.4,
    temp: 0.55, commit: 0.5, ability: 'shadowstep', abilCd: 11, dashCd: 3.2,
  },
  rat: {
    team: 'enemy', name: 'Rat', r: 18, vr: 15, turn: 8, accel: 500, face: 8, mass: 0.4, hp: 18, speed: 88, role: 'skirmish',
    range: 11, atkCd: 0.85, dmg: 4, arc: 1.6, temp: 0.7, commit: 0.4, xp: 4, coins: [1, 2],
    ability: 'dash', abilCd: 2.6,
  },
  slime: {
    team: 'enemy', name: 'Slime', r: 25, vr: 22, turn: 3, accel: 140, face: 3.5, mass: 1.6, hp: 46, speed: 40, role: 'melee',
    range: 16, atkCd: 1.4, dmg: 8, knock: 90, arc: 2.2, temp: 0.3, commit: 1, xp: 8, coins: [2, 4], splits: true,
  },
  slimeSmall: {
    team: 'enemy', name: 'Slimelet', r: 16, vr: 14, turn: 5, accel: 260, face: 5, mass: 0.6, hp: 16, speed: 58, role: 'melee',
    range: 12, atkCd: 1.0, dmg: 4, arc: 2.2, temp: 0.4, commit: 0.6, xp: 3, coins: [0, 1],
  },
  skeleton: {
    team: 'enemy', name: 'Skeleton', r: 34, vr: 24, turn: 3.4, accel: 180, face: 3.4, mass: 1.3, hp: 52, speed: 50, role: 'melee',
    range: 20, atkCd: 1.5, windup: 0.45, dmg: 10, knock: 120, arc: 1.7, temp: 0.3, commit: 1, xp: 10, coins: [2, 5],
    res: { poison: 0.35, burn: 0.8, chill: 1.2 },
  },
  boss: {
    team: 'enemy', name: 'Bone King', r: 52, vr: 38, turn: 2.2, accel: 120, face: 2.4, mass: 5, hp: 360, speed: 44, role: 'melee',
    range: 26, atkCd: 1.6, windup: 0.55, dmg: 16, knock: 220, arc: 2, temp: 0.2, commit: 1.4,
    xp: 80, coins: [30, 45], ability: 'slam', abilCd: 6, boss: true,
    res: { poison: 0.3, burn: 0.6, chill: 0.6 },
  },
};

// Every hero in heroes.js becomes a def; the old trio's fields (abilities the sim already runs) are kept for now.
// role (how it moves: melee / ranged / skirmish) comes from the hero's role; heroRole keeps the hero's own.
const MOVE_ROLE = { tank: 'melee', melee: 'melee', skirmish: 'skirmish', ranged: 'ranged', caster: 'ranged' };
for (const [id, h] of Object.entries(HEROES)) {
  const role = MOVE_ROLE[h.role] || (h.stats.range > 60 ? 'ranged' : 'melee');
  DEFS[id] = { team: 'hero', name: h.name, temp: 0.35, commit: 0.8, keep: 150, ...h.stats, role, heroRole: h.role, attackAnim: h.attack.anim, art: h.art, hero: id };
  if (h.role === 'skirmish') Object.assign(DEFS[id], { temp: 0.55, commit: 0.5 });
  if (h.role === 'tank' || h.role === 'melee') Object.assign(DEFS[id], { temp: 0.18, commit: 1.2 });
  if (h.role === 'tank') DEFS[id].heavy = true;
  // what the plain ranged attack throws, and its colour
  const PROJ = { pyromancer: ['bolt', '#FF8A3D'], frost: ['bolt', '#8FD3FF'], storm: ['bolt', '#FFF27A'], necromancer: ['bone'],
    bard: ['note', '#FFD27A'], druid: ['thorn'], plague: ['vial', '#9BCB3C'], cleric: ['bolt', '#FFF1B0'] };
  if (PROJ[id]) { DEFS[id].proj = PROJ[id][0]; DEFS[id].projColor = PROJ[id][1]; }
}
// Summons. Every summon is drawn from parts with a purple outline (render.js SUMMON_INK, round 7), so it reads as
// ours. The wolf's art is the round-5 beast tamer's wolf (design/class-round5/fighters), a stand-in until the
// beasts are picked: before it the wolf had no art at all and drew nothing.
DEFS.wolf = { team: 'hero', name: 'Wolf', art: 'art/summons/wolf.svg', headR: 40, attackAnim: 'thrust', r: 24, vr: 18, turn: 6, accel: 380, face: 6, mass: 1, hp: 60, speed: 92, role: 'skirmish',
  range: 14, atkCd: 0.8, dmg: 7, arc: 1.4, temp: 0.5, commit: 0.5 };
Object.assign(DEFS, ENEMIES);
// The raised skeleton (Raise Dead, the Bone Charm) wears the current skeleton art, the Rattler's; the old
// art/skeleton.svg is gone (designer, round 7: "something is summoning the old skeleton visuals").
Object.assign(DEFS.skeleton, { art: ENEMIES.rattler.art, headR: ENEMIES.rattler.headR, attackAnim: 'swing' });

// Round 6 feel (designer, 2026-11-20): a much faster party (~3x; enemies faster too so fights still meet, ability
// cooldowns unchanged), longer time-to-kill (more HP for everyone), longer attack and view range, slightly bigger
// colliders. Applied once here over every def so heroes.js / enemies.js keep their readable base numbers.
// Things that move at a multiple of def.speed (dashes, charges) are tuned against the scaled speed in sim.js.
export const FEEL = {
  heroSpeed: 2.4, enemySpeed: 2, bossSpeed: 1.52, // walking speed (round 7: everyone 20% slower than round 6's 3 / 2.5 / 1.9)
  turn: 1.8, face: 1.5,                           // turning keeps up with the speed (else they swing in wide arcs)
  heroHp: 2, enemyHp: 2, bossHp: 1.4,             // time to kill
  enemyDmg: 0.75,                                 // enemy blows (fights are denser now: faster, more of them at once)
  collider: 1.1,                                  // r (vr, the sprite size, stays)
  rangedRange: 1.3, keep: 1.25, meleeReach: 8,    // ranged range x, kiting distance x, melee reach + (room units)
};
for (const d of Object.values(DEFS)) {
  if (d.scaled) continue;
  d.scaled = true;
  const hero = d.team === 'hero', boss = !!d.boss;
  const sp = hero ? FEEL.heroSpeed : boss ? FEEL.bossSpeed : FEEL.enemySpeed;
  d.speed *= sp; d.accel = (d.accel || 250) * sp;
  d.turn = (d.turn || 5) * FEEL.turn; d.face = (d.face || 5) * FEEL.face;
  d.hp = Math.round(d.hp * (hero ? FEEL.heroHp : boss ? FEEL.bossHp : FEEL.enemyHp));
  d.r *= FEEL.collider;
  if (d.role === 'ranged') { d.range *= FEEL.rangedRange; if (d.keep) d.keep *= FEEL.keep; }
  else if (d.range != null) d.range += FEEL.meleeReach;
}

export const HERO_ORDER = ['knight', 'archer', 'rogue'];

// Level scaling for heroes (levels inside a run; round 7: steeper, with the dungeons scaling harder to match).
export const levelHp = (base, lvl) => Math.round(base * (1 + 0.14 * (lvl - 1)));
export const levelDmg = (base, lvl) => base * (1 + 0.11 * (lvl - 1));
export const xpToNext = (lvl) => Math.round(40 * Math.pow(lvl, 1.45));

// Trinkets live in trinkets.js (each is a set of hooks); re-exported here so older imports keep working.
export { TRINKETS, TRINKET_IDS } from './trinkets.js';
