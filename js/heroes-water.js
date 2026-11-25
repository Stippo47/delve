// Round 17 (lane water17): the Water Mage, the designer's design. Pure data, in heroes2.js's shape, merged into HEROES
// by heroes.js (the kit is kits-water.js, the looks fx-water.js, every call and number in docs/HEROES-water17.md).
// The designer's words: a beam to the nearest target or to a hurt ally, 2 s on and 1.5 s off, Wet slowly on enemies,
// healing and washing allies (not making them Wet); Bubble Shields that block magic and not physical attacks, Wet and
// a knock-back when one pops; a Dome that soaks the enemies in it, lets nothing in or out, deflects shots and slowly
// heals allies inside; a Water Cannon, a big laser of water that heals allies and hurts enemies it passes through;
// trait: hurt while standing on water, she splashes three balls of water back at whoever did it (as the lizards throw).
// Art: art/heroes/waterMage.svg is a placeholder sketch for the designer's art round (docs/ART-NEEDED.md).
export const HEROES_WATER = {
  waterMage: {
    name: 'Water Mage', art: 'art/heroes/waterMage.svg', role: 'support', unlock: { gems: 2 },
    blurb: 'Sea-green robes and a staff with a ball of water at its head. Heals with the tide; drowns with it too.',
    fun: 'Has never once been thirsty. Has been asked, more than once, to stop bringing the sea indoors.',
    // atkCd: one whole beat of the beam (2 s on, 1.5 s off); kits-water.js holds the exact beat. wet: what each pulse
    // of the beam puts on an enemy (the Book's "whose blows carry it" reads it).
    stats: { hp: 80, speed: 62, r: 31, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1.15, range: 215, keep: 170, atkCd: 3.5, dmg: 9, wet: 7 },
    style: { glow: '#9FE0FF' },
    attack: { name: 'Tide beam', anim: 'cast', desc: 'A beam of water from her staff held on the nearest enemy for 2s, then 1.5s to draw breath: it hurts, and slowly soaks. A friend in trouble gets it instead: it heals them and puts out burning and washes off half their poison, without soaking them.' },
    abilities: [
      { id: 'bubbleShield', name: 'Bubble Shields', cd: 11, tags: 's', glyph: 'bubble', desc: 'Blows a bubble of water round a friend about to be hit by magic. Spells, fire, frost and curses can\'t get through it; swords, arrows and teeth go straight through and leave it whole. When it pops, the one inside is soaked and everything near is knocked back.',
        tiers: ['One bubble, for 6s; it holds a third of their health in magic.', 'Two bubbles, for 8s, holding more.', 'Three bubbles, and a popped one throws the magic it caught back at whoever cast it.'] },
      { id: 'waterDome', name: 'Dome', cd: 16, tags: 'sh', glyph: 'dome', desc: 'A great dome of water over the party. Enemies outside can\'t get in and enemies inside can\'t get out; enemy shots glance off it. Enemies inside are soaked, and friends inside slowly heal. The party walks in and out as it likes.',
        tiers: ['For 4s.', 'Bigger, for 6s.', 'When it comes down the water stays: the floor is flooded where it stood.'] },
      { id: 'waterCannon', name: 'Water Cannon', cd: 10, tags: 'dhs', glyph: 'jet', desc: 'A great jet of water straight through a line of enemies: it hurts them, shoves them back down the line and soaks them; friends it passes through are healed and washed. She stands still to aim it.',
        tiers: ['For 1.2s.', 'Wider, for 1.6s.', 'It follows the enemy it was aimed at, sweeping across whatever stands between.'] },
    ],
    trait: { id: 'splashback', name: 'Splashback', desc: 'Hit while she stands in water, she splashes three balls of it back at whoever hit her, like the ones a lizardman throws: each hurts and soaks.' },
  },
};
