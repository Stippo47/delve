// Unit definitions. Numbers are tuning knobs; behaviour lives in sim.js.
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
    temp: 0.55, commit: 0.5, ability: 'shadowstep', abilCd: 6,
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

export const HERO_ORDER = ['knight', 'archer', 'rogue'];

// Level scaling for heroes (permanent levels).
export const levelHp = (base, lvl) => Math.round(base * (1 + 0.12 * (lvl - 1)));
export const levelDmg = (base, lvl) => base * (1 + 0.09 * (lvl - 1));
export const xpToNext = (lvl) => Math.round(40 * Math.pow(lvl, 1.45));

export const TRINKETS = {
  lastBreath: { name: 'Last Breath', desc: 'Once per floor: survive a killing blow at 1 HP, invulnerable for 2s.' },
  volatile: { name: 'Volatile Charm', desc: '15% chance when hit to explode, burning everything nearby.' },
  frostRing: { name: 'Frost Ring', desc: 'Attacks add chill.' },
  emberRing: { name: 'Ember Ring', desc: 'Attacks add burn.' },
  venomFang: { name: 'Venom Fang', desc: 'Attacks add poison.' },
  vampTooth: { name: 'Vampire Tooth', desc: 'Heal 8% of damage dealt.' },
  ironSkin: { name: 'Iron Skin', desc: 'Take 15% less damage.' },
  swiftBoots: { name: 'Swift Boots', desc: '15% faster.' },
};
export const TRINKET_IDS = Object.keys(TRINKETS);
