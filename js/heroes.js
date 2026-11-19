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
    stats: { hp: 180, speed: 48, r: 36, vr: 24, turn: 2.8, accel: 150, face: 3, mass: 2.8, range: 24, atkCd: 1.5, dmg: 12, knock: 180, arc: 1.7 },
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
      { id: 'barrage', name: 'Barrage', cd: 7, desc: 'A fan of arrows.',
        tiers: ['Five arrows.', 'Seven arrows, set alight.', 'The arrows go through.'] },
      { id: 'frostArrow', name: 'Frost Arrow', cd: 8, desc: 'A frost-tipped arrow.',
        tiers: ['Chills hard.', 'Freezes.', 'Bursts, chilling all around.'] },
      { id: 'roll', name: 'Roll', cd: 6, desc: 'Rolls out of reach when something gets close.',
        tiers: ['A quick roll back.', 'The next arrow after a roll hits twice as hard.', 'Leaves caltrops that slow.'] },
    ],
    trait: { id: 'steadyAim', name: 'Steady Aim', desc: 'After standing still for 1.5s, the next arrow is a critical hit.' },
  },
  twinfang: {
    name: 'Twinfang', art: 'art/heroes/twinfang.svg', role: 'skirmish', starter: true,
    blurb: 'Hooked daggers. Picks off the ones on their own.',
    stats: { hp: 80, speed: 96, r: 29, vr: 20, turn: 7, accel: 420, face: 7, mass: 0.9, range: 16, atkCd: 0.55, dmg: 7, arc: 1.4 },
    attack: { name: 'Twin daggers', anim: 'thrust', desc: 'Quick stabs.' },
    abilities: [
      { id: 'backstab', name: 'Backstab', cd: 6, desc: 'Steps into the shadows and appears behind the target.',
        tiers: ['A big hit from behind.', 'Poisons too.', 'A kill resets it.'] },
      { id: 'dash', name: 'Dash', cd: 3.2, desc: 'A burst of speed: in at a lone target, or out of reach.',
        tiers: ['One dash.', 'Leaves smoke: enemies lose sight of her.', 'Two dashes before it recharges.'] },
      { id: 'fanOfKnives', name: 'Fan of Knives', cd: 11, desc: 'Throws knives all around.',
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
      { id: 'cleave', name: 'Cleave', cd: 7, desc: 'A full spin with the sword.',
        tiers: ['Hits everything around.', 'Wider, and knocks back.', 'Spins twice.'] },
    ],
    trait: { id: 'bloodied', name: 'Bloodied', desc: 'Hits harder the more hurt she is: up to +50%.' },
  },
  berserker: {
    name: 'Berserker', art: 'art/heroes/berserker.svg', role: 'melee', unlock: { gems: 2 },
    blurb: 'A flail and no plan. Shockwaves.',
    stats: { hp: 115, speed: 66, r: 32, vr: 22, turn: 4, accel: 230, face: 4.2, mass: 1.6, range: 30, atkCd: 1.1, dmg: 12, knock: 120, arc: 2.4 },
    attack: { name: 'Flail', anim: 'swing', desc: 'A wide flail swing.' },
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
      { id: 'reap', name: 'Reap', cd: 8, desc: 'A full sweep all the way round her.',
        tiers: ['Hits everyone close.', 'Reaches further.', 'Heals her for each enemy hit.'] },
      { id: 'hook', name: 'Hook', cd: 10, desc: 'Hooks a far enemy and drags it to her.',
        tiers: ['One enemy.', 'Staggers it on arrival.', 'Two enemies.'] },
      { id: 'oldBones', name: 'Old Bones', cd: 20, desc: 'When she would go down, she shrugs it off.',
        tiers: ['Stays up at 1 HP once per room.', 'Heals 20% when it saves her.', 'Knocks everything around back too.'] },
    ],
    trait: { id: 'grim', name: 'Grim', desc: 'Finishes off any enemy her hits leave below 12% health.' },
  },
  pyromancer: {
    name: 'Pyromancer', art: 'art/heroes/pyromancer.svg', role: 'caster', unlock: { gems: 2 },
    blurb: 'Fire, mostly.',
    stats: { hp: 65, speed: 66, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 240, keep: 180, atkCd: 1.2, dmg: 9 },
    attack: { name: 'Spark', anim: 'cast', desc: 'A plain magic bolt.' },
    abilities: [
      { id: 'fireball', name: 'Fireball', cd: 7, desc: 'A slow fireball that bursts.',
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
    attack: { name: 'Snow bolt', anim: 'cast', desc: 'A plain magic bolt.' },
    abilities: [
      { id: 'iceShard', name: 'Ice Shard', cd: 6, desc: 'A shard that goes through enemies in a line.',
        tiers: ['Chills.', 'Chills harder.', 'Splits into three.'] },
      { id: 'frostNova', name: 'Frost Nova', cd: 13, desc: 'Freezes everything close to her.',
        tiers: ['Freezes for a moment.', 'Bigger.', 'Frozen enemies take double damage.'] },
      { id: 'iceWall', name: 'Ice Wall', cd: 16, desc: 'Raises a wall of ice that blocks enemies.',
        tiers: ['A short wall for 5s.', 'Longer, 8s.', 'It chills what touches it.'] },
    ],
    trait: { id: 'coldBlood', name: 'Cold Blood', desc: 'Can\'t be chilled or frozen.' },
  },
  storm: {
    name: 'Storm Mage', art: 'art/heroes/storm.svg', role: 'caster', unlock: { gems: 3 },
    blurb: 'Lightning that jumps. Loves wet enemies.',
    stats: { hp: 65, speed: 66, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 240, keep: 180, atkCd: 1.25, dmg: 9 },
    attack: { name: 'Zap', anim: 'cast', desc: 'A plain magic bolt.' },
    abilities: [
      { id: 'chainLightning', name: 'Chain Lightning', cd: 8, desc: 'A bolt that jumps from enemy to enemy, shocking.',
        tiers: ['Jumps 3 times.', 'Jumps 5 times.', 'Jumps back to enemies already hit.'] },
      { id: 'thunderclap', name: 'Thunderclap', cd: 11, desc: 'A crack of thunder around a target.',
        tiers: ['Staggers.', 'Bigger.', 'Shocks too.'] },
      { id: 'stormCloud', name: 'Storm Cloud', cd: 16, desc: 'A cloud over the enemies that rains and strikes.',
        tiers: ['Soaks what\'s under it.', 'Strikes lightning too.', 'Follows the enemies.'] },
    ],
    trait: { id: 'conductor', name: 'Conductor', desc: 'Shock lasts twice as long on wet enemies.' },
  },
  cleric: {
    name: 'Cleric', art: 'art/heroes/cleric.svg', role: 'support', unlock: { gems: 1 },
    blurb: 'Heals, and brings the fallen back fast.',
    stats: { hp: 85, speed: 62, r: 31, vr: 22, turn: 4, accel: 220, face: 4.2, mass: 1.2, range: 20, atkCd: 1.3, dmg: 7, arc: 1.6 },
    attack: { name: 'Sceptre', anim: 'swing', desc: 'A knock with the sceptre.' },
    abilities: [
      { id: 'mend', name: 'Mend', cd: 5, desc: 'Heals the most hurt ally nearby.',
        tiers: ['Heals 20%.', 'Heals 30%.', 'Heals a second ally too.'] },
      { id: 'sanctuary', name: 'Sanctuary', cd: 16, desc: 'A circle of light that heals allies standing in it.',
        tiers: ['For 5s.', 'Bigger, 7s.', 'Enemies can\'t step in.'] },
      { id: 'smite', name: 'Smite', cd: 9, desc: 'A pillar of light on an enemy.',
        tiers: ['Hurts and staggers.', 'Hurts more.', 'Undead take triple.'] },
    ],
    trait: { id: 'raiser', name: 'Raiser', desc: 'Revives the downed three times faster, at 40% health.' },
  },
  bard: {
    name: 'Bard', art: 'art/heroes/bard.svg', role: 'support', unlock: { gems: 2 },
    blurb: 'Songs that make the others better.',
    stats: { hp: 80, speed: 68, r: 31, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1.1, range: 200, keep: 160, atkCd: 1.15, dmg: 6 },
    attack: { name: 'Sour note', anim: 'cast', desc: 'A note that hits.' },
    abilities: [
      { id: 'warSong', name: 'War Song', cd: 14, desc: 'Allies near attack faster for a while.',
        tiers: ['+25% for 6s.', '+40%.', 'They move faster too.'] },
      { id: 'lullaby', name: 'Lullaby', cd: 13, desc: 'Enemies in front grow slow and drowsy.',
        tiers: ['Slows for 4s.', 'Puts the weakest to sleep.', 'Wider.'] },
      { id: 'encore', name: 'Encore', cd: 20, desc: 'An ally\'s ability is ready again.',
        tiers: ['One ally.', 'Heals them 10% too.', 'Two allies.'] },
    ],
    trait: { id: 'rhythm', name: 'Rhythm', desc: 'Allies near the bard move 10% faster.' },
  },
  druid: {
    name: 'Druid', art: 'art/heroes/druid.svg', role: 'support', unlock: { gems: 2 },
    blurb: 'Vines, healing, and a wolf.',
    stats: { hp: 85, speed: 64, r: 31, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1.2, range: 220, keep: 170, atkCd: 1.3, dmg: 7 },
    attack: { name: 'Thorn', anim: 'cast', desc: 'A thrown thorn.' },
    abilities: [
      { id: 'entangle', name: 'Entangle', cd: 10, desc: 'Vines burst up and hold enemies in place.',
        tiers: ['Holds for 1.5s.', 'Bigger patch.', 'The vines poison.'] },
      { id: 'rejuvenate', name: 'Rejuvenate', cd: 8, desc: 'Heals an ally slowly over time.',
        tiers: ['30% over 6s.', '45%.', 'Two allies.'] },
      { id: 'callWolf', name: 'Call Wolf', cd: 22, desc: 'A wolf comes to fight beside the party for a while.',
        tiers: ['For 15s.', 'A bigger wolf.', 'Two wolves.'] },
    ],
    trait: { id: 'barkskin', name: 'Barkskin', desc: 'Takes 30% less damage while standing still.' },
  },
  necromancer: {
    name: 'Necromancer', art: 'art/heroes/necromancer.svg', role: 'caster', unlock: { gems: 3 },
    blurb: 'The dead fight for him.',
    stats: { hp: 70, speed: 62, r: 30, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1, range: 230, keep: 180, atkCd: 1.3, dmg: 8 },
    attack: { name: 'Bone dart', anim: 'cast', desc: 'A plain bolt of bone.' },
    abilities: [
      { id: 'raiseDead', name: 'Raise Dead', cd: 12, desc: 'Raises a fallen enemy to fight for the party for a while.',
        tiers: ['One skeleton, 12s.', 'Two.', 'They explode when they fall.'] },
      { id: 'lifeDrain', name: 'Life Drain', cd: 9, desc: 'Drains an enemy, healing himself.',
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
    attack: { name: 'Vial', anim: 'throw', desc: 'A thrown vial of something nasty (no poison yet).' },
    abilities: [
      { id: 'miasma', name: 'Miasma', cd: 10, desc: 'A flask that bursts into a poison cloud.',
        tiers: ['A cloud for 5s.', 'Bigger.', 'Enemies in it hit softer.'] },
      { id: 'cure', name: 'Cure', cd: 9, desc: 'Clears an ally\'s statuses and heals a little.',
        tiers: ['One ally, 10%.', '20%.', 'Every ally near.'] },
      { id: 'leeches', name: 'Leeches', cd: 14, desc: 'Leeches on an enemy drain it for allies to heal from.',
        tiers: ['For 5s.', 'Spread to one more enemy.', 'Heal twice as much.'] },
    ],
    trait: { id: 'immunity', name: 'Immunity', desc: 'Can\'t be poisoned, and his poison spreads to enemies nearby.' },
  },
};
export const HERO_IDS = Object.keys(HEROES);
export const STARTERS = HERO_IDS.filter((k) => HEROES[k].starter);

// ---------------------------------------------------------------- skill trees
// Every hero's tree has the same shape: three branches, one per ability, each with the ability's three tiers and
// a stat node that can be bought more than once. Tier nodes need the one before and a level reached in the run before
// they switch on; tier III also needs a feat (the hero once reached level 8 in a dungeon). The trinket-slot node needs
// that feat too. Costs are in gold.
export const BRANCHES = [
  { id: 'attack', name: 'Attack', ability: 0, stat: { id: 'might', name: 'Might', desc: '+8% damage', max: 5, cost: [40, 70, 110, 160, 220] } },
  { id: 'survival', name: 'Survival', ability: 1, stat: { id: 'vigor', name: 'Vigor', desc: '+10% health', max: 5, cost: [40, 70, 110, 160, 220] } },
  { id: 'utility', name: 'Utility', ability: 2, stat: { id: 'haste', name: 'Haste', desc: '+6% attack speed, +4% move speed', max: 3, cost: [60, 110, 170] } },
];
const TIER_LEVEL = [2, 5, 8];        // the run level each tier switches on at
const TIER_COST = [60, 160, 320];
export const FEAT_LEVEL = 8;

export function treeFor(id) {
  const h = HEROES[id];
  const nodes = [];
  for (const b of BRANCHES) {
    const ab = h.abilities[b.ability];
    ab.tiers.forEach((t, i) => nodes.push({
      id: `${ab.id}${i + 1}`, branch: b.id, kind: 'tier', ability: ab.id, tier: i + 1,
      name: `${ab.name} ${'I'.repeat(i + 1)}`, desc: i === 0 ? `${ab.desc} ${t}` : t,
      cost: [TIER_COST[i]], max: 1, req: { node: i ? `${ab.id}${i}` : null, level: TIER_LEVEL[i], feat: i === 2 },
    }));
    nodes.push({ id: b.stat.id, branch: b.id, kind: 'stat', name: b.stat.name, desc: b.stat.desc, cost: b.stat.cost, max: b.stat.max, req: {} });
  }
  nodes.push({ id: 'slot2', branch: 'utility', kind: 'slot', name: 'Second trinket', desc: 'Wear a second trinket.', cost: [400], max: 1, req: { feat: true } });
  return nodes;
}
