// The rest of the picked heroes (round 10, lane H): pure data, merged into HEROES by heroes.js. Same shape as there
// (stats, attack, 3 abilities with 3 tiers, 1 trait, unlock = the gold price / 350), plus:
//   fun      the About page's fun line
//   style    pose touches parts.js reads (hand: the arm that strikes, off: 'shield', dual, glow, bow)
//   proj     [kind, colour] of the plain shot for a ranged hero without its own attack
//   form     a second shape (the Werewolf): { id, name, art, stats, anim }
//   summons  defs for what it brings into the fight (the Engineer's turret)
// Each ability also carries tags (d damage, h healing, s statuses: which web nodes its arm gets) and glyph (its HUD
// icon, icons.js). The kits are in kits2.js, the looks in fx2.js, the kits written out in docs/HEROES.md.

export const HEROES2 = {
  // ------------------------------------------------------------------ batch 1: the knights and the bear
  oldguard: {
    name: 'Old Guard', art: 'art/heroes/oldguard.svg', role: 'tank', unlock: { gems: 2 },
    blurb: 'A greatsword held in both hands, and forty years of knowing where to put it.',
    fun: 'Has outlived three kings, two dragons and every sergeant who ever shouted at him. Still gets up at dawn.',
    stats: { hp: 165, speed: 50, r: 34, vr: 24, turn: 3, accel: 160, face: 3.2, mass: 2.4, range: 30, atkCd: 1.5, dmg: 15, knock: 190, arc: 2.3 },
    weapon: 'great',
    attack: { name: 'Greatsword', anim: 'swing', desc: 'A slow, wide two-handed cut in front.' },
    abilities: [
      { id: 'greatSweep', name: 'Great Sweep', cd: 8, tags: 'ds', glyph: 'swirl', desc: 'Draws the greatsword back, then sweeps it round in one huge arc in front of him.',
        tiers: ['Hits everything in a wide arc and knocks it back.', 'Staggers what it hits.', 'Sweeps straight back the other way.'] },
      { id: 'rallyCry', name: 'Rally', cd: 15, tags: 'h', glyph: 'up', desc: 'An old soldier\'s shout: allies near him shake off stuns and staggers and stand firm.',
        tiers: ['Clears stuns, roots and stagger; nothing knocks them back for 5s.', 'They move 20% faster for 5s.', 'Heals them 12% too.'] },
      { id: 'pommelStrike', name: 'Pommel Strike', cd: 9, tags: 'ds', glyph: 'fist', desc: 'A quick blow with the pommel that breaks off whatever an enemy was winding up.',
        tiers: ['Stuns for 1s and stops its move.', 'Knocks it far back.', 'His next blow on it is a critical hit.'] },
    ],
    trait: { id: 'oldSoldier', name: 'Old Soldier', desc: 'Allies standing near him take 10% less damage.' },
  },
  dame: {
    name: 'Dame', art: 'art/heroes/dame.svg', role: 'tank', unlock: { gems: 2 },
    blurb: 'Kite shield, leaf sword, perfect manners. Answers every blow.',
    fun: 'Wears the tiara into battle because nobody has yet been brave enough to tell her not to.',
    stats: { hp: 140, speed: 58, r: 33, vr: 23, turn: 3.6, accel: 190, face: 3.8, mass: 2, range: 24, atkCd: 1.0, dmg: 11, knock: 120, arc: 1.6 },
    weapon: 'blade', style: { hand: 'arm-l', off: 'shield' },
    attack: { name: 'Leaf sword', anim: 'swing', desc: 'A quick, neat cut.' },
    abilities: [
      { id: 'riposte', name: 'Riposte', cd: 9, tags: 'ds', glyph: 'shield', desc: 'Raises the shield; every blow it stops from the front is answered with a thrust.',
        tiers: ['For 1.6s.', 'The answers stagger.', 'For 2.6s, and she turns to meet blows from any side.'] },
      { id: 'challenge', name: 'Challenge', cd: 14, tags: 'd', glyph: 'dagger', desc: 'Calls out the strongest enemy near: it has to fight her, and she hits it harder.',
        tiers: ['It must fight her for 6s; she hits it 30% harder.', 'She takes 30% less from it.', 'Beating it heals her 20% and brings the challenge round again.'] },
      { id: 'disarm', name: 'Disarm', cd: 11, tags: 's', glyph: 'swirl', desc: 'A flick of the blade at an enemy\'s weapon hand: its blows land far softer for a while.',
        tiers: ['Its blows do 50% less for 5s.', 'It attacks slower too.', 'Every enemy in front of her.'] },
    ],
    trait: { id: 'grace', name: 'Grace', desc: 'Every third blow she lands is a critical hit.' },
  },
  griffon: {
    name: 'Griffon', art: 'art/heroes/griffon.svg', role: 'tank', unlock: { gems: 3 },
    blurb: 'Winged helm, warhammer, shield. Drops out of the sky onto whoever is bothering his friends.',
    fun: 'The wings on the helm are not real. Nobody has told the helm.',
    stats: { hp: 150, speed: 58, r: 34, vr: 24, turn: 3.4, accel: 180, face: 3.6, mass: 2.2, range: 24, atkCd: 1.3, dmg: 14, knock: 190, arc: 1.7 },
    weapon: 'heavy', style: { hand: 'arm-l', off: 'shield' },
    attack: { name: 'Warhammer', anim: 'swing', desc: 'A heavy hammer blow.' },
    abilities: [
      { id: 'swoop', name: 'Swoop', cd: 11, tags: 'ds', glyph: 'up', desc: 'Spreads his wings and flies to the ally in the most trouble, landing beside them with a slam that throws their attackers off.',
        tiers: ['Flies to a hurt ally and slams down.', 'The slam staggers.', 'The ally takes 40% less damage for 3s.'] },
      { id: 'hammerThrow', name: 'Stormhammer', cd: 9, tags: 'ds', glyph: 'bolt', desc: 'Hurls the hammer down a line; it spins out and comes back to his hand, hitting everything both ways.',
        tiers: ['Out and back.', 'It shocks.', 'A bigger hammer that staggers.'] },
      { id: 'wingShield', name: 'Wing Guard', cd: 13, tags: 'd', glyph: 'shield', desc: 'Raises the shield with his wings spread: shots that reach him from the front are caught and thrown back.',
        tiers: ['For 3s; blows from the front do half.', 'Thrown-back shots hit twice as hard.', 'For 5s, from every side.'] },
    ],
    trait: { id: 'skyborn', name: 'Skyborn', desc: 'Can\'t be rooted or entangled.' },
  },
  bulwark: {
    name: 'Bulwark', art: 'art/heroes/bulwark.svg', role: 'tank', unlock: { gems: 2 },
    blurb: 'A winged spear and a big shield. Nothing gets past the end of the spear.',
    fun: 'Has stood in the same doorway for so long that the door now leans on him.',
    stats: { hp: 160, speed: 52, r: 34, vr: 24, turn: 3.1, accel: 160, face: 3.3, mass: 2.4, range: 40, atkCd: 1.2, dmg: 12, knock: 170, arc: 0.9 },
    weapon: 'thrust', style: { off: 'shield' },
    attack: { name: 'Winged spear', anim: 'thrust', desc: 'A long thrust that reaches past the front line.' },
    abilities: [
      { id: 'brace', name: 'Brace', cd: 10, tags: 'ds', glyph: 'shield', desc: 'Sets the spear and waits: whatever comes into its reach is struck hard and stopped dead.',
        tiers: ['For 3s, the first enemy to come in.', 'Every enemy that comes in.', 'They are pinned to the spot for 1s.'] },
      { id: 'shieldWall', name: 'Shield Wall', cd: 15, tags: 'd', glyph: 'wall', desc: 'Plants the shield: he can\'t be moved, and allies close to him take less damage.',
        tiers: ['For 5s; allies near take 30% less.', 'For 7s.', 'Enemies that press against the shield are shoved back.'] },
      { id: 'impale', name: 'Impale', cd: 9, tags: 'ds', glyph: 'dagger', desc: 'A heavy thrust that pins one enemy to the spot.',
        tiers: ['Pinned for 1.5s.', 'It takes 25% more while pinned.', 'Pinned for 2.5s and staggered.'] },
    ],
    trait: { id: 'phalanx', name: 'Phalanx', desc: 'Takes 10% less damage for each ally close by, up to 30%.' },
  },
  bearskin: {
    name: 'Bearskin', art: 'art/heroes/bearskin.svg', role: 'melee', unlock: { gems: 2 },
    blurb: 'A studded club and a bear on his back. Hits like the bear did.',
    fun: 'The bear was not killed. The bear lent him the coat and is waiting outside.',
    stats: { hp: 135, speed: 60, r: 34, vr: 24, turn: 3.4, accel: 190, face: 3.6, mass: 2, range: 26, atkCd: 1.35, dmg: 16, knock: 170, arc: 1.8 },
    weapon: 'heavy',
    attack: { name: 'Studded club', anim: 'swing', desc: 'A heavy club blow.' },
    abilities: [
      { id: 'maul', name: 'Maul', cd: 8, tags: 'ds', glyph: 'fist', desc: 'Raises the club high and brings it straight down on one enemy.',
        tiers: ['Stuns for 1s.', 'Stuns for 1.6s.', 'The ground cracks: everything round it is staggered.'] },
      { id: 'hibernate', name: 'Hibernate', cd: 18, tags: 'h', glyph: 'sleep', desc: 'Curls up under the pelt: takes far less damage and heals while he lies there.',
        tiers: ['Heals 25% over 3s, taking 60% less.', 'Heals 35%.', 'Wakes with a roar that throws enemies back.'] },
      { id: 'bearRoar', name: 'Bear Roar', cd: 13, tags: 's', glyph: 'wave', desc: 'A roar that takes the fight out of the enemies round him.',
        tiers: ['They deal 30% less for 5s.', 'And they are staggered.', 'Wider, and it throws them back.'] },
    ],
    trait: { id: 'thickHide', name: 'Thick Hide', desc: 'Statuses build half as fast on him.' },
  },
};

// The HUD glyph of each new ability (icons.js)
export const GLYPH2 = {};
for (const h of Object.values(HEROES2)) for (const ab of h.abilities) if (ab.glyph) GLYPH2[ab.id] = ab.glyph;
