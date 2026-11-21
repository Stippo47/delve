import { HEROES2 } from './heroes2.js';
// The hero roster: who each hero is, what they do, and their skill tree. Pure data; sim.js runs the kits
// (attack, abilities, trait), camp.js shows them and sells the tree nodes.
//
// Every hero has: 1 attack (plain, no element), 3 abilities with 3 tiers each, and 1 trait that works on its own.
// Abilities are unlocked and raised through the skill tree, bought with gold (kept forever). A bought ability node
// only switches on in a run once the hero reaches its level there (XP and levels live inside a run).
//
// stats: hp, speed (units/s), r (collider), vr (head radius the sprite is sized from), turn/accel/face (momentum),
// mass, role ('tank' | 'melee' | 'skirmish' | 'ranged' | 'caster' | 'support'), range, keep (ranged: how far it keeps),
// atkCd (s), dmg, plus optional dodge, arc (melee swing width, rad), knock.
// attack.anim: how the sprite moves when it attacks: 'swing' (arm-r swings round its pivot), 'thrust' (arm-r jabs
// forward), 'draw' (arm-r pulls back, then releases: bows), 'cast' (both arms lift), 'throw'.

export const HEROES = {
  paladin: {
    name: 'Paladin', art: 'art/heroes/paladin.svg', role: 'tank', starter: true,
    blurb: 'Sword and shield. Stands in front and keeps the others alive.',
    stats: { hp: 150, speed: 56, r: 34, vr: 24, turn: 3.2, accel: 170, face: 3.4, mass: 2.2, range: 24, atkCd: 1.3, dmg: 13, knock: 160, arc: 1.9 },
    attack: { name: 'Sword', anim: 'swing', desc: 'A sword swing in front.' },
    abilities: [
      { id: 'shieldBash', name: 'Shield Bash', cd: 7, desc: 'Lunges into an enemy with the shield, knocking it back.',
        tiers: ['Knocks back and staggers.', 'Stuns for a moment as well.', 'Hits everything in front, not just one.'] },
      { id: 'guard', name: 'Guard', cd: 12, desc: 'Stands beside a hurt ally and takes part of the damage meant for them.',
        tiers: ['Takes 40% of their damage for 5s.', 'Takes 60%.', 'Also heals them 15% when it starts.'] },
      { id: 'consecrate', name: 'Consecrate', cd: 14, desc: 'Holy ground around him: hurts enemies, mends allies.',
        tiers: ['A ring of light for 4s.', 'Bigger and lasts 6s.', 'Undead in it burn.'] },
    ],
    trait: { id: 'bulwark', name: 'Bulwark', desc: 'Blocks 35% of damage that comes from the front.' },
  },
  tower: {
    name: 'Tower', art: 'art/heroes/tower.svg', role: 'tank', unlock: { gems: 2 },
    blurb: 'A wall with a mace. Pulls every enemy onto himself.',
    stats: { hp: 180, speed: 48, r: 36, vr: 24, turn: 2.8, accel: 150, face: 3, mass: 2.8, range: 24, atkCd: 1.3, dmg: 11, knock: 180, arc: 1.7 },
    attack: { name: 'Flanged mace', anim: 'swing', desc: 'A heavy mace blow.' },
    abilities: [
      { id: 'holdTheLine', name: 'Hold the Line', cd: 12, desc: 'Plants the tower shield and calls enemies to him.',
        tiers: ['Takes 60% less damage from the front and taunts those near for 4s.', 'Taunts further, for 6s.', 'Hits taken while planted are struck back.'] },
      { id: 'charge', name: 'Charge', cd: 8, desc: 'Charges in a line, bowling enemies aside.',
        tiers: ['A short charge.', 'Longer, and slams enemies into walls harder.', 'Staggers everything it hits.'] },
      { id: 'groundPound', name: 'Ground Pound', cd: 10, desc: 'Slams the shield down: a ring that shoves enemies away.',
        tiers: ['Knocks back.', 'Staggers as well.', 'A second ring follows.'] },
    ],
    trait: { id: 'unmovable', name: 'Unmovable', desc: 'Can\'t be knocked back.' },
  },
  archer: {
    name: 'Archer', art: 'art/heroes/archer.svg', role: 'ranged', starter: true,
    blurb: 'Shoots from behind the front line.',
    stats: { hp: 70, speed: 72, r: 31, vr: 22, turn: 5, accel: 260, face: 5, mass: 1, range: 270, keep: 170, atkCd: 1.05, dmg: 9, dodge: 0.2 },
    attack: { name: 'Bow', anim: 'draw', desc: 'An arrow.' },
    abilities: [
      { id: 'barrage', name: 'Barrage', cd: 7, desc: 'Draws, then looses a fan of arrows, each at its own speed.',
        tiers: ['Five arrows.', 'Seven arrows, set alight.', 'The arrows go through.'] },
      { id: 'frostArrow', name: 'Frost Arrow', cd: 8, desc: 'A frost-tipped arrow.',
        tiers: ['Chills hard.', 'Freezes.', 'Bursts, chilling all around.'] },
      { id: 'roll', name: 'Roll', cd: 6, desc: 'Rolls head over heels out of reach when something gets close.',
        tiers: ['A quick roll back.', 'The next arrow after a roll hits twice as hard.', 'Leaves caltrops that slow.'] },
    ],
    trait: { id: 'steadyAim', name: 'Steady Aim', desc: 'After standing still for 1.5s, the next arrow is a critical hit.' },
  },
  twinfang: {
    name: 'Twinfang', art: 'art/heroes/twinfang.svg', role: 'skirmish', starter: true,
    blurb: 'Hooked daggers. Picks off the ones on their own.',
    stats: { hp: 100, speed: 96, r: 29, vr: 20, turn: 7, accel: 420, face: 7, mass: 0.9, range: 16, atkCd: 0.55, dmg: 8, arc: 1.4, dodge: 0.18 },
    attack: { name: 'Twin daggers', anim: 'thrust', desc: 'Quick stabs.' },
    abilities: [
      { id: 'backstab', name: 'Backstab', cd: 11, desc: 'Steps into the shadows and appears behind the target.',
        tiers: ['A big hit from behind.', 'Poisons too.', 'A kill resets it.'] },
      { id: 'dash', name: 'Dash', cd: 3.2, desc: 'A burst of speed: in at a lone target, or out of reach.',
        tiers: ['One dash.', 'Leaves smoke: enemies lose sight of her.', 'Two dashes before it recharges.'] },
      { id: 'fanOfKnives', name: 'Fan of Knives', cd: 11, desc: 'Spins once, throwing knives one after another all the way round.',
        tiers: ['Eight knives.', 'They poison.', 'Twelve knives, and they go through.'] },
    ],
    trait: { id: 'opportunist', name: 'Opportunist', desc: '+50% damage to enemies fighting someone else.' },
  },
  wildmane: {
    name: 'Wildmane', art: 'art/heroes/wildmane.svg', role: 'melee', unlock: { gems: 2 },
    blurb: 'Big sword, bigger temper.',
    stats: { hp: 125, speed: 62, r: 33, vr: 23, turn: 3.6, accel: 200, face: 3.8, mass: 1.8, range: 26, atkCd: 1.25, dmg: 15, knock: 140, arc: 2.1 },
    attack: { name: 'Greatsword', anim: 'swing', desc: 'A wide sword swing.' },
    abilities: [
      { id: 'rage', name: 'Rage', cd: 14, desc: 'Takes less damage and attacks and moves faster for a while.',
        tiers: ['For 5s.', 'Her hits also heal her.', 'For 8s, and nothing knocks her back.'] },
      { id: 'leap', name: 'Leap', cd: 9, desc: 'Leaps onto a far enemy; the landing shoves those around.',
        tiers: ['A leap.', 'Lands harder, staggering.', 'Leaps again straight after.'] },
      { id: 'cleave', name: 'Cleave', cd: 7, desc: 'She spins round once with the sword out.',
        tiers: ['Hits everything around.', 'Wider, and knocks back.', 'Spins twice.'] },
    ],
    trait: { id: 'bloodied', name: 'Bloodied', desc: 'Hits harder the more hurt she is: up to +50%.' },
  },
  berserker: {
    name: 'Berserker', art: 'art/heroes/berserker.svg', role: 'melee', unlock: { gems: 2 },
    blurb: 'A flail and no plan. Shockwaves.',
    stats: { hp: 115, speed: 66, r: 32, vr: 22, turn: 4, accel: 230, face: 4.2, mass: 1.6, range: 30, atkCd: 1.1, dmg: 12, knock: 120, arc: 2.4, aoe: 44 },
    attack: { name: 'Flail', anim: 'swing', desc: 'The flail slams the ground in front of him, hitting everything in a small circle there.' },
    abilities: [
      { id: 'shockwave', name: 'Shockwave', cd: 9, desc: 'Slams the ground, sending a shockwave forward that repeats.',
        tiers: ['Three waves.', 'Five waves.', 'The waves stagger.'] },
      { id: 'whirl', name: 'Whirl', cd: 12, desc: 'Spins the flail while moving, hitting everything around.',
        tiers: ['For 3s.', 'For 5s.', 'Pulls enemies in.'] },
      { id: 'unstoppable', name: 'Unstoppable', cd: 16, desc: 'Shakes off every status and can\'t be stopped for a moment.',
        tiers: ['Clears statuses, 2s of immunity.', '4s.', 'Heals 20% too.'] },
    ],
    trait: { id: 'momentum', name: 'Momentum', desc: 'Each hit in a row makes the next a little faster, up to +50%.' },
  },
  granny: {
    name: 'Granny Reaper', art: 'art/heroes/granny.svg', role: 'melee', unlock: { gems: 3 },
    blurb: 'Scythe. Sweeps all the way round.',
    stats: { hp: 95, speed: 54, r: 31, vr: 22, turn: 3.6, accel: 180, face: 3.6, mass: 1.2, range: 34, atkCd: 1.5, dmg: 12, arc: 2.8 },
    attack: { name: 'Scythe', anim: 'swing', desc: 'A long sweep in front.' },
    abilities: [
      { id: 'reap', name: 'Reap', cd: 8, desc: 'She spins, sweeping all the way round her; a red orb flies home from each one hit.',
        tiers: ['Hits everyone close.', 'Reaches further.', 'Heals her for each enemy hit.'] },
      { id: 'hook', name: 'Hook', cd: 10, desc: 'Throws a scythe-bladed hook at a far enemy, drags it hard to her and staggers it.',
        tiers: ['One enemy.', 'Staggers it harder.', 'Two enemies.'] },
      { id: 'oldBones', name: 'Old Bones', cd: 20, desc: 'When she would go down, she shrugs it off.',
        tiers: ['Stays up at 1 HP once per room.', 'Heals 20% when it saves her.', 'Knocks everything around back too.'] },
    ],
    trait: { id: 'grim', name: 'Grim', desc: 'Finishes off any enemy her hits leave below 12% health.' },
  },
  pyromancer: {
    name: 'Pyromancer', art: 'art/heroes/pyromancer.svg', role: 'caster', unlock: { gems: 2 },
    blurb: 'Fire, mostly.',
    stats: { hp: 65, speed: 66, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 240, keep: 180, atkCd: 1.2, dmg: 9 },
    attack: { name: 'Spark', anim: 'cast', desc: 'A spark of fire: a little burn, and a small burst where it lands.' },
    abilities: [
      { id: 'fireball', name: 'Fireball', cd: 7, desc: 'Gathers a fireball in her hands, then throws it: it bursts.',
        tiers: ['Bursts and burns.', 'Leaves burning ground.', 'Bigger burst.'] },
      { id: 'flameWall', name: 'Flame Wall', cd: 12, desc: 'A line of fire across the enemies\' way.',
        tiers: ['Burns what walks through.', 'Longer and lasts longer.', 'Sets oil off from further away.'] },
      { id: 'inferno', name: 'Inferno', cd: 18, desc: 'A ring of fire bursts out of her.',
        tiers: ['Burns all near.', 'Knocks them back.', 'Leaves her immune to burning for 6s.'] },
    ],
    trait: { id: 'kindling', name: 'Kindling', desc: 'Burning enemies take 20% more from her.' },
  },
  frost: {
    name: 'Frost Mage', art: 'art/heroes/frost.svg', role: 'caster', unlock: { gems: 2 },
    blurb: 'Slows everything down, then shatters it.',
    stats: { hp: 70, speed: 64, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 240, keep: 180, atkCd: 1.2, dmg: 8 },
    attack: { name: 'Snow bolt', anim: 'cast', desc: 'A bolt of snow: a little chill, and a few shards burst out behind what it hits.' },
    abilities: [
      { id: 'iceShard', name: 'Ice Shard', cd: 6, desc: 'A shard that goes through enemies in a line.',
        tiers: ['Chills.', 'Chills harder.', 'Splits into three; the middle one is bigger and hits harder.'] },
      { id: 'frostNova', name: 'Frost Nova', cd: 13, desc: 'Draws the cold in, then freezes everything close to her.',
        tiers: ['Freezes for a moment.', 'Bigger.', 'Frozen enemies take double damage.'] },
      { id: 'iceWall', name: 'Ice Wall', cd: 16, desc: 'Throws out a wall of ice boulders that blocks enemies.',
        tiers: ['A short wall for 5s.', 'Longer, 8s.', 'It chills what touches it.'] },
    ],
    trait: { id: 'coldBlood', name: 'Cold Blood', desc: 'Can\'t be chilled or frozen.' },
  },
  storm: {
    name: 'Storm Mage', art: 'art/heroes/storm.svg', role: 'caster', unlock: { gems: 3 },
    blurb: 'Lightning that jumps. Loves wet enemies.',
    stats: { hp: 65, speed: 66, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 240, keep: 180, atkCd: 1.25, dmg: 9 },
    attack: { name: 'Zap', anim: 'cast', desc: 'A chain of lightning to the target, a little shock; it jumps on to every marked enemy, shocking them hard.' },
    abilities: [
      { id: 'chainLightning', name: 'Chain Lightning', cd: 8, desc: 'A bolt that jumps from enemy to enemy, shocking.',
        tiers: ['Jumps 3 times.', 'Jumps 5 times.', 'Jumps back to enemies already hit.'] },
      { id: 'thunderclap', name: 'Thunderclap', cd: 11, desc: 'A crack of thunder around a target.',
        tiers: ['Staggers.', 'Bigger.', 'Shocks too.'] },
      // round 9: Storm Cloud reworked into Zeus Bolt (the id stays for saves)
      { id: 'stormCloud', name: 'Zeus Bolt', cd: 14, desc: 'Throws three bolts that mark the enemies they hit. Her Zap jumps between everyone marked, shocking hard, and uses the mark up.',
        tiers: ['Three marking bolts.', 'The bolts hit harder.', 'Marks last longer and shock harder.'] },
    ],
    trait: { id: 'conductor', name: 'Conductor', desc: 'Shock lasts twice as long on wet enemies.' },
  },
  cleric: {
    name: 'Cleric', art: 'art/heroes/cleric.svg', role: 'support', unlock: { gems: 1 },
    blurb: 'Stays at the back, mends with a ray of light, and brings the fallen back fast.',
    stats: { hp: 80, speed: 62, r: 31, vr: 22, turn: 4.2, accel: 230, face: 4.4, mass: 1.1, range: 210, keep: 170, atkCd: 1.3, dmg: 5 },
    attack: { name: 'Light orb', anim: 'cast', desc: 'Three small, slow orbs of light, one after another, each homing a little; all three on one enemy make it slightly radiant.' },
    abilities: [
      // the id stays 'mend' so bought nodes in saves keep working
      { id: 'mend', name: 'Mending Ray', cd: 7, desc: 'A ray of light to the most hurt ally that heals them slowly while it holds (never herself).',
        tiers: ['Heals 25% over 4s.', 'Heals 40% over 4s.', 'Splits to a second ally.'] },
      { id: 'sanctuary', name: 'Sanctuary', cd: 16, desc: 'A circle of light that heals allies standing in it.',
        tiers: ['For 5s.', 'Bigger, 7s.', 'Enemies can\'t step in.'] },
      { id: 'smite', name: 'Smite', cd: 9, desc: 'A pillar of light on an enemy: hurts, staggers and makes it radiant.',
        tiers: ['Hurts and staggers.', 'Hurts more.', 'Undead take triple.'] },
    ],
    trait: { id: 'raiser', name: 'Raiser', desc: 'Revives the downed three times faster, at 40% health.' },
  },
  bard: {
    name: 'Bard', art: 'art/heroes/bard.svg', role: 'support', unlock: { gems: 2 },
    blurb: 'Songs that make the others better.',
    stats: { hp: 80, speed: 68, r: 31, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1.1, range: 200, keep: 160, atkCd: 1.15, dmg: 6 },
    attack: { name: 'Sour note', anim: 'cast', desc: 'Strums four slow notes in a spread; every one goes through.' },
    abilities: [
      { id: 'warSong', name: 'War Song', cd: 14, desc: 'Allies near attack faster for a while.',
        tiers: ['+25% for 6s.', '+40%.', 'They move faster too.'] },
      { id: 'lullaby', name: 'Lullaby', cd: 13, desc: 'Enemies in front grow slow and drowsy.',
        tiers: ['Slows for 4s.', 'Puts the weakest to sleep.', 'Wider, and puts everyone it reaches to sleep.'] },
      { id: 'encore', name: 'Encore', cd: 20, desc: 'An ally\'s ability is ready again.',
        tiers: ['One ally.', 'Heals them 10% too.', 'Two allies.'] },
    ],
    trait: { id: 'rhythm', name: 'Rhythm', desc: 'Allies near the bard move 10% faster.' },
  },
  druid: {
    name: 'Druid', art: 'art/heroes/druid.svg', role: 'support', unlock: { gems: 2 },
    blurb: 'Vines, healing, and a wolf.',
    stats: { hp: 85, speed: 64, r: 31, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1.2, range: 220, keep: 170, atkCd: 1.3, dmg: 7 },
    attack: { name: 'Thorn', anim: 'cast', desc: 'A thrown thorn that entangles a little.' },
    abilities: [
      { id: 'entangle', name: 'Entangle', cd: 10, desc: 'Vines burst up and hold enemies in place.',
        tiers: ['Holds for 1.5s.', 'Bigger patch.', 'The vines poison.'] },
      { id: 'rejuvenate', name: 'Rejuvenate', cd: 8, desc: 'Heals an ally slowly over time.',
        tiers: ['30% over 6s.', '45%.', 'Two allies.'] },
      { id: 'callWolf', name: 'Call Wolf', cd: 22, desc: 'A summoning ring opens and a wolf steps out to fight beside the party for a while.',
        tiers: ['For 15s.', 'A bigger wolf.', 'Two wolves.'] },
    ],
    trait: { id: 'barkskin', name: 'Barkskin', desc: 'Takes 30% less damage while standing still.' },
  },
  necromancer: {
    name: 'Necromancer', art: 'art/heroes/necromancer.svg', role: 'caster', unlock: { gems: 3 },
    blurb: 'The dead fight for him.',
    stats: { hp: 70, speed: 62, r: 30, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1, range: 230, keep: 180, atkCd: 1.3, dmg: 8 },
    attack: { name: 'Bone dart', anim: 'cast', desc: 'The green flame from his hand round a bone: a little curse. It shrinks and speeds up as it flies, and hits harder the closer it lands.' },
    abilities: [
      { id: 'raiseDead', name: 'Raise Dead', cd: 12, desc: 'Each fallen body gets up as three small, weak skeletons that punch, for a while.',
        tiers: ['One body, 12s.', 'Two bodies.', 'They explode when they fall.'] },
      { id: 'lifeDrain', name: 'Life Drain', cd: 9, desc: 'Drains an enemy, healing himself; three thin tendrils reach on to those round it, a quarter as strong.',
        tiers: ['For 3s.', 'Heals allies near him too.', 'Stronger.'] },
      { id: 'boneSpear', name: 'Bone Spear', cd: 8, desc: 'A spear of bone through a line of enemies.',
        tiers: ['Goes through.', 'Knocks back.', 'Wider and longer.'] },
    ],
    trait: { id: 'soulHarvest', name: 'Soul Harvest', desc: 'Every enemy that dies near him shortens his cooldowns.' },
  },
  plague: {
    name: 'Plague Doctor', art: 'art/heroes/plague.svg', role: 'caster', unlock: { gems: 2 },
    blurb: 'Poison clouds, and cures for friends.',
    stats: { hp: 80, speed: 62, r: 31, vr: 22, turn: 4.2, accel: 220, face: 4.2, mass: 1.2, range: 210, keep: 170, atkCd: 1.25, dmg: 7 },
    attack: { name: 'Poison cluster', anim: 'throw', desc: 'A bubbling cluster of poison: fast and small, then bigger and slower; a little poison, and it pops in a small cloud where it ends.' },
    abilities: [
      { id: 'miasma', name: 'Miasma', cd: 10, desc: 'A flask that bursts into a poison cloud.',
        tiers: ['A cloud for 5s.', 'Bigger.', 'Enemies in it hit softer.'] },
      { id: 'cure', name: 'Cure', cd: 9, desc: 'Draws an ally\'s statuses out into his flask and heals a little; his next attack throws them all at the enemy, as strong.',
        tiers: ['One ally, 10%.', '20%.', 'Every ally near.'] },
      // round 9: Leeches reworked into Gas Form (the id stays for saves)
      { id: 'leeches', name: 'Gas Form', cd: 12, desc: 'Turns into a cloud of poison gas, drifts off out of reach and becomes the doctor again. Nothing can hurt him while he is gas.',
        tiers: ['The gas he leaves behind poisons.', 'Thicker, longer-lasting gas.', 'Heals 15% as he reforms.'] },
    ],
    trait: { id: 'immunity', name: 'Immunity', desc: 'Can\'t be poisoned, and his poison spreads to enemies nearby.' },
  },
};
Object.assign(HEROES, HEROES2); // round 10 (lane H): the rest of the picked heroes, heroes2.js
export const HERO_IDS = Object.keys(HEROES);
export const STARTERS = HERO_IDS.filter((k) => HEROES[k].starter);

// ---------------------------------------------------------------- skill trees (round 8: a web)
// Designer, round 8: "The simple ones like better damage or hp, should be nodes in the large tree, add more base stat
// increases, like attack speed, weapon attack speed, specific ability damage, heal percentage, attack range, specific
// ability cooldown buff, applied status effect increase, etc." and the tree is a web ("~100 nodes per hero in time").
// Nodes are bought with skill points (one per level gained, levels are permanent); gold no longer buys nodes.
//
// treeFor(id) -> [{ id, x, y, kind: 'root'|'ability'|'tier'|'stat'|'keystone'|'slot', name, desc, max, cost (points per
//   rank), links: [ids] (both ways), needs: [ids] (must all be owned too: a tier needs the tier before), level (the hero
//   level it can be bought from, 0 = any), stats: [{ k, ab?, per }] (what one rank adds, see STATS), ability?, tier?,
//   plus old fields kept so older views still read it: branch, req: { node, level, feat } }]
// A node can be bought when one linked node is owned (the root always is), its needs are owned, the hero's level is
// high enough, it isn't maxed and the hero has the points. x/y: layout units on a pannable board, root at 0,0, the
// three ability arms pointing up, lower right and lower left; about 650 units out to the tips and keystones.
//
// The shape, the same for every hero: from the root, three arms (one per ability: tier I, cooldown, tier II, the
// ability's power, tier III, a mastery tip, side nodes), and between each pair of arms a spoke of plain stats running
// out to a keystone (one of the three keystones is the second trinket slot). Side nodes join each arm to the spokes
// beside it, which makes the web.

// What one rank of a stat adds. per is a fraction (0.08 = 8%).
export const STATS = {
  dmg: { name: 'Damage', per: 0.08, max: 4, line: (p) => `+${p}% damage` },
  hp: { name: 'Health', per: 0.1, max: 4, line: (p) => `+${p}% health` },
  atkSpeed: { name: 'Attack speed', per: 0.07, max: 4, line: (p) => `Weapon attacks ${p}% faster` },
  moveSpeed: { name: 'Move speed', per: 0.06, max: 3, line: (p) => `Moves ${p}% faster` },
  range: { name: 'Reach', per: 0.08, max: 3, line: (p) => `+${p}% attack range` },
  haste: { name: 'Ability haste', per: 0.04, max: 4, line: (p) => `Every ability comes round ${p}% sooner` },
  heal: { name: 'Healing', per: 0.12, max: 3, line: (p) => `Heals ${p}% more` },
  status: { name: 'Potency', per: 0.15, max: 3, line: (p) => `Statuses you apply build ${p}% faster` },
  armor: { name: 'Toughness', per: 0.05, max: 4, line: (p) => `Takes ${p}% less damage` },
  abDmg: { name: 'power', per: 0.12, max: 3, line: (p, ab) => `${ab}: +${p}% damage` },
  abCd: { name: 'cooldown', per: 0.06, max: 3, line: (p, ab) => `${ab}: comes round ${p}% sooner` },
  abHeal: { name: 'mending', per: 0.15, max: 3, line: (p, ab) => `${ab}: heals ${p}% more` },
  abStatus: { name: 'potency', per: 0.2, max: 3, line: (p, ab) => `${ab}: its statuses build ${p}% faster` },
};
// What each ability does, for its arm's nodes: d (damage), h (healing), s (applies statuses: burn, chill, poison, wet,
// shock, stagger, stun, slow). The first letter is the arm's main power node.
export const ABILITY_TAGS = {
  shieldBash: 'ds', guard: 'h', consecrate: 'dh', holdTheLine: 'd', charge: 'ds', groundPound: 'ds',
  barrage: 'ds', frostArrow: 'ds', roll: 's', backstab: 'ds', dash: 's', fanOfKnives: 'ds',
  rage: 'h', leap: 'ds', cleave: 'd', shockwave: 'ds', whirl: 'd', unstoppable: 'h',
  reap: 'dh', hook: 'ds', oldBones: 'h', fireball: 'ds', flameWall: 'ds', inferno: 'ds',
  iceShard: 'ds', frostNova: 'sd', iceWall: 's', chainLightning: 'ds', thunderclap: 'ds', stormCloud: 'ds',
  mend: 'h', sanctuary: 'h', smite: 'ds', warSong: 's', lullaby: 's', encore: 'h',
  entangle: 'sd', rejuvenate: 'h', callWolf: 'd', raiseDead: 'd', lifeDrain: 'dh', boneSpear: 'ds',
  miasma: 'ds', cure: 'h', leeches: 's',
};
for (const h of Object.values(HEROES2)) for (const ab of h.abilities) if (ab.tags) ABILITY_TAGS[ab.id] = ab.tags;
const POW = { d: 'abDmg', h: 'abHeal', s: 'abStatus' };
export const TIER_LEVEL = [0, 4, 9];   // the hero level each tier can be bought from
const TIER_COST = [1, 1, 2];
export const KEYSTONE_LEVEL = 12, TIP_LEVEL = 15, OUTER_LEVEL = 6;
const ARM_NAMES = ['attack', 'survival', 'utility'];
const KEYSTONES = [
  { id: 'slot2', kind: 'slot', name: 'Second trinket', desc: 'Wear a second trinket.', stats: [] },
  { id: 'juggernaut', kind: 'keystone', name: 'Juggernaut', desc: '+20% health and takes 8% less damage.', stats: [{ k: 'hp', per: 0.2 }, { k: 'armor', per: 0.08 }] },
  { id: 'fury', kind: 'keystone', name: 'Fury', desc: '+15% damage and attacks 10% faster.', stats: [{ k: 'dmg', per: 0.15 }, { k: 'atkSpeed', per: 0.1 }] },
];
const pct = (f) => Math.round(f * 100);

export function treeFor(id) {
  const h = HEROES[id];
  const nodes = [], by = {};
  const add = (n) => { const m = { links: [], needs: [], level: 0, cost: 1, max: 1, stats: [], ...n }; nodes.push(m); by[m.id] = m; return m; };
  const link = (a, b) => { by[a].links.push(b); by[b].links.push(a); };
  const P = (r, deg) => ({ x: Math.round(Math.cos(deg * Math.PI / 180) * r), y: Math.round(Math.sin(deg * Math.PI / 180) * r) });
  const statNode = (nid, k, at, extra = {}) => {
    const S = STATS[k];
    return add({ id: nid, kind: 'stat', name: S.name, desc: S.line(pct(S.per)), max: S.max, stats: [{ k, per: S.per }], ...at, ...extra });
  };
  const abNode = (nid, k, ab, at, extra = {}) => {
    const S = STATS[k];
    return add({ id: nid, kind: 'stat', name: `${ab.name} ${S.name}`, desc: S.line(pct(S.per), ab.name), max: S.max, ability: ab.id, stats: [{ k, ab: ab.id, per: S.per }], ...at, ...extra });
  };
  const healer = h.abilities.some((ab) => (ABILITY_TAGS[ab.id] || '').includes('h'));
  add({ id: 'root', kind: 'root', name: h.name, desc: h.blurb, max: 1, cost: 0, x: 0, y: 0, free: true, branch: 'root' });
  const arm = (b) => -90 + b * 120;
  // the three arms
  h.abilities.forEach((ab, b) => {
    const a = arm(b), tags = (ABILITY_TAGS[ab.id] || 'd').split(''), branch = ARM_NAMES[b];
    const pow = tags.map((t) => POW[t]);
    ab.tiers.forEach((t, i) => {
      add({ id: `${ab.id}${i + 1}`, kind: i ? 'tier' : 'ability', ability: ab.id, tier: i + 1, branch,
        name: `${ab.name} ${'I'.repeat(i + 1)}`, desc: i === 0 ? `${ab.desc} ${t}` : t, cost: TIER_COST[i], level: TIER_LEVEL[i],
        needs: i ? [`${ab.id}${i}`] : [], ...P([130, 330, 540][i], a), req: { node: i ? `${ab.id}${i}` : null, level: TIER_LEVEL[i], feat: false } });
    });
    abNode(`${ab.id}Cd`, 'abCd', ab, P(232, a), { branch });
    abNode(`${ab.id}Pow`, pow[0], ab, P(436, a), { branch });
    // the sides: the ability's second power if it has one, else plain damage; health; its third power, else attack speed
    const s1 = pow[1] ? abNode(`${ab.id}Pow2`, pow[1], ab, P(290, a + 16), { branch }) : statNode(`${ab.id}Dmg`, 'dmg', P(290, a + 16), { branch, max: 2 });
    const s2 = statNode(`${ab.id}Hp`, 'hp', P(290, a - 16), { branch, max: 2 });
    const s3 = pow[2] ? abNode(`${ab.id}Pow3`, pow[2], ab, P(480, a + 13), { branch }) : statNode(`${ab.id}Atk`, 'atkSpeed', P(480, a + 13), { branch, max: 2 });
    const tipK = pow[0], S = STATS[tipK];
    add({ id: `${ab.id}Mastery`, kind: 'stat', ability: ab.id, branch, name: `${ab.name} mastery`,
      desc: `${S.line(pct(0.1), ab.name)}, and comes round 5% sooner`, max: 2, level: TIP_LEVEL,
      stats: [{ k: tipK, ab: ab.id, per: 0.1 }, { k: 'abCd', ab: ab.id, per: 0.05 }], ...P(650, a) });
    link('root', `${ab.id}1`); link(`${ab.id}1`, `${ab.id}Cd`); link(`${ab.id}Cd`, `${ab.id}2`);
    link(`${ab.id}Cd`, s1.id); link(`${ab.id}Cd`, s2.id);
    link(`${ab.id}2`, `${ab.id}Pow`); link(`${ab.id}Pow`, `${ab.id}3`); link(`${ab.id}Pow`, s3.id); link(`${ab.id}3`, `${ab.id}Mastery`);
  });
  // the spokes between the arms: offence (arms 1-2), defence (2-3), utility (3-1), each out to a keystone
  const SPOKES = [['dmg', 'atkSpeed', 'range', 'dmg'], ['hp', 'armor', 'hp', 'moveSpeed'], ['haste', healer ? 'heal' : 'status', 'haste', healer ? 'heal' : 'status']];
  const GAP_NAMES = ['offence', 'defence', 'utility'];
  SPOKES.forEach((ks, g) => {
    const a = arm(g) + 60, left = h.abilities[g], right = h.abilities[(g + 1) % 3], branch = GAP_NAMES[g];
    const ids = ks.map((k, j) => statNode(`${branch}${j}`, k, P([125, 260, 390, 510][j], a), { branch, level: j === 3 ? OUTER_LEVEL : 0 }).id);
    const K = KEYSTONES[g];
    add({ id: K.id, kind: K.kind, name: K.name, desc: K.desc, stats: K.stats, cost: 2, level: KEYSTONE_LEVEL, branch, ...P(640, a) });
    link('root', ids[0]); link(ids[0], ids[1]); link(ids[1], ids[2]); link(ids[2], ids[3]); link(ids[3], K.id);
    // the web: the side nodes either side of this spoke join it
    link(ids[1], by[`${left.id}Pow2`] ? `${left.id}Pow2` : `${left.id}Dmg`);
    link(ids[1], `${right.id}Hp`);
    link(ids[3], by[`${left.id}Pow3`] ? `${left.id}Pow3` : `${left.id}Atk`);
  });
  for (const n of nodes) if (!n.req) n.req = { node: null, level: n.level, feat: false };
  return nodes;
}
// Owned from the start: the root.
export const freeNodes = (id) => Object.fromEntries(treeFor(id).filter((n) => n.free).map((n) => [n.id, 1]));

// What a set of bought nodes adds up to: { dmg, hp, atkSpeed, moveSpeed, range, haste, heal, status, armor (fractions),
// ab: { [abilityId]: { abDmg, abCd, abHeal, abStatus } } }. kits.js applies it to the unit; the camp can show it.
const treeCache = {};
export function statsFor(id, nodes = {}) {
  const t = treeCache[id] || (treeCache[id] = treeFor(id));
  const out = { dmg: 0, hp: 0, atkSpeed: 0, moveSpeed: 0, range: 0, haste: 0, heal: 0, status: 0, armor: 0, ab: {} };
  for (const n of t) {
    const r = Math.min(n.max, nodes[n.id] || 0); if (!r) continue;
    for (const s of n.stats) {
      if (s.ab) { const a = out.ab[s.ab] || (out.ab[s.ab] = { abDmg: 0, abCd: 0, abHeal: 0, abStatus: 0 }); a[s.k] += s.per * r; }
      else out[s.k] += s.per * r;
    }
  }
  return out;
}
// The highest tier of an ability owned in a row (I, then II, then III).
export function tierOf(nodes, abilityId) { let t = 0; for (let i = 1; i <= 3; i++) { if (nodes[`${abilityId}${i}`]) t = i; else break; } return t; }

// Kept for older views and tools (the round 7 tree's names); nothing in the game reads them now.
export const BRANCHES = [
  { id: 'attack', name: 'Attack', ability: 0, stat: { id: 'offence0', name: 'Damage' } },
  { id: 'survival', name: 'Survival', ability: 1, stat: { id: 'defence0', name: 'Health' } },
  { id: 'utility', name: 'Utility', ability: 2, stat: { id: 'utility0', name: 'Ability haste' } },
];
export const STAT_STEP = { might: 0.08, vigor: 0.1, hasteAtk: 0.07, hasteMove: 0.06 };
export const TIER_CD = 0.1; // each tier past I takes 10% off its ability's cooldown
export const FEAT_LEVEL = 8; // no longer gates anything (round 8)

