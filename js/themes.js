// Dungeon types. Each is its own place: how the floor, walls and rock look, the light, what lies about, which
// hazards it has, the mix of rooms, who lives there (weighted by floor) and who waits at the end of each floor.
// The camp offers them; newRun(save, { theme }) builds every room of the run from one.
//
// THEMES[id] = {
//   name, blurb,
//   palette: { floor: [near, far] (gradient), tile: [dark, light] (tile tints), grout, wall: [lit, shade], wallTop,
//              rock: [band, deep], void (what's outside the room), accent (the theme's colour: glows, the camp) },
//   floorStyle, pillar: older fields; since round 6 the floor, walls, rock and obstacles come from the environment
//   style (js/env.js: four looks, each with its own floor per theme) and palette.floor/wall/rock are its fallbacks,
//   mood: { fog (vignette colour), fogK (how far in it reaches 0..1), tint (a wash over everything, or null) },
//   kinds: { fight, hazard, treasure, fountain, decision, elite } (room mix, weights),
//   floors: [{ name, enemies: [[kind, weight], ...], mini (floors 1 and 2: who waits at the end; any kind, made a
//            mini-boss unless it's a boss kind of its own), hazards, mood, props, water?, kinds?, obstacles?, palette? }]
//            (round 8: each floor differs; floorTheme(id, floor) merges one over the dungeon), enemies: the floors'
//            rosters (derived), minis: the floors' minis (derived),
//   elite: kind (the elite room's big one), warden: kind (no longer used: floors end with their mini), boss: kind (floor 3),
//   bossAdds: [kind, ...] (who comes with a floor's last foe),
//   hazards: [[type, weight], ...] ('spikes' | 'oil' | 'mist' | 'gas' | 'snare' | 'fire' (burning ground) | 'web' (slows) |
//            'beam' (a sigil that calls down light now and then); 'water' channels are separate),
//   water: chance a room has a water channel (sewers),
//   props: [[type, per-chunk count], ...] (floor dressing drawn into the floor: bones, candles, slab, web, crack,
//          skulls, grate, moss, puddle, pipe, straw, planks, firepit, rubble, bonepile; drawn in scenery.js),
//   obstacles: [[type, weight], ...] (one grid cell each, js/layout.js: 'crate' | 'barrel' | 'rock' | 'brazier' | 'pipe'),
//   rank: how hard (DUNGEON_RANK in dungeon.js), unlockAfter: the dungeon to clear first (for the camp, if it locks them) }

export const THEMES = {
  // ---- round 9: the Wildwood, the new first dungeon (its kinds: js/wildwood.js; the boss: js/elderent.js; PLACEHOLDER art)
  wildwood: {
    name: 'The Wildwood', blurb: 'An old forest. Wolves run in it, bandits camp in it, and the trees themselves are awake.', rank: 0,
    palette: {
      floor: ['#A9B37C', '#919D66'], tile: ['rgba(60,80,30,0.14)', 'rgba(255,255,220,0.09)'], grout: 'rgba(50,60,30,0.22)',
      wall: ['#6E7F4A', '#536238'], wallTop: 'rgba(230,255,190,0.14)', rock: ['#4A5634', '#1C2414'], void: '#1C2414', accent: '#9BCB3C',
    },
    floorStyle: 'dirt', pillar: 'stone',
    mood: { fog: 'rgba(24,40,18,', fogK: 0.45, tint: 'rgba(150,200,90,0.05)' },
    kinds: { fight: 50, hazard: 14, treasure: 14, fountain: 9, decision: 10, elite: 5 },
    floors: [
      // the forest edge: wolves, slimes, goblins; brambles. Light and green.
      { name: 'The Forest Edge', enemies: [['wolf', 3], ['slime', 3.5], ['goblin', 3], ['goblinOrange', 0.8], ['slimeBig', 0.6], ['slimePoison', 0.7]], mini: 'alpha',
        bossAdds: ['wolf', 'wolf'], elite: 'slimeBig',
        hazards: [['bramble', 3], ['snare', 0.6]], mood: { fog: 'rgba(24,40,18,', fogK: 0.38, tint: 'rgba(170,220,110,0.05)' },
        props: [['moss', 2], ['straw', 0.6], ['rubble', 0.6], ['crack', 0.4]], obstacles: [['rock', 3], ['crate', 0.4]] },
      // the bandit camp: six kinds of bandit, poachers and their snares, the brute; campfires. Warm, smoky.
      { name: 'The Bandit Camp', enemies: [['bandit', 2], ['banditDagger', 2], ['banditSpear', 1.5], ['banditTorch', 1.4], ['banditAxe', 1.2], ['banditGreat', 1],
        ['poacher', 2], ['banditBrute', 0.9], ['wolf', 0.8]], mini: 'banditChief', bossAdds: ['bandit', 'banditDagger', 'poacher'], elite: 'banditBrute',
        hazards: [['snare', 3], ['fire', 1.2], ['oil', 0.6]], mood: { fog: 'rgba(48,30,14,', fogK: 0.48, tint: 'rgba(255,170,80,0.08)' },
        props: [['firepit', 1], ['planks', 1.2], ['straw', 1.2], ['moss', 0.6]], obstacles: [['crate', 2.5], ['barrel', 2], ['rock', 1]] },
      // the old grove: ents, sproutlings, wisps, dire wolves, boars; grasping roots. Dim and deep green.
      { name: 'The Old Grove', enemies: [['ent', 1.6], ['sproutling', 3], ['wisp', 1.5], ['direWolf', 2], ['boar', 2], ['wolf', 1.4], ['slimePoison', 0.8]],
        bossAdds: ['sproutling', 'sproutling', 'wisp'], elite: 'ent',
        hazards: [['roots', 3], ['bramble', 1.5]], mood: { fog: 'rgba(8,24,10,', fogK: 0.62, tint: 'rgba(60,140,60,0.14)' },
        props: [['moss', 2.6], ['rubble', 0.6], ['crack', 0.6]], obstacles: [['rock', 3]] },
    ],
    elite: 'banditBrute', warden: 'alpha', boss: 'elderEnt', bossAdds: ['wolf', 'sproutling'],
    hazards: [['bramble', 3], ['snare', 1], ['roots', 1]],
    props: [['moss', 2], ['straw', 0.6], ['rubble', 0.6]],
    obstacles: [['rock', 3], ['crate', 1], ['barrel', 0.5]],
  },
  crypt: {
    name: 'The Crypt', blurb: 'Old graves under the hill. The dead here don\'t stay down.',
    palette: {
      floor: ['#B9B5B2', '#A29E9D'], tile: ['rgba(70,72,96,0.14)', 'rgba(255,255,255,0.08)'], grout: 'rgba(40,38,56,0.28)',
      wall: ['#8E8D96', '#66646F'], wallTop: 'rgba(255,255,255,0.14)', rock: ['#5E5C68', '#25222C'], void: '#25222C', accent: '#7FD6F5',
    },
    floorStyle: 'flag', pillar: 'stone',
    mood: { fog: 'rgba(24,28,52,', fogK: 0.62, tint: 'rgba(70,90,140,0.06)' },
    kinds: { fight: 46, hazard: 13, treasure: 13, fountain: 10, decision: 13, elite: 5 },
    // round 8: each floor its own place (designer: "different types enemies, hazards, overall vibes")
    floors: [
      // round 9: harrowing skeletons (get up once, cursing), golden skeletons deeper
      { name: 'The Vaults', enemies: [['rat', 3], ['rattler', 4], ['rattlerBow', 2.5], ['rattlerHarrow', 1], ['ghost', 0.6]], mini: 'rattlerMace',
        hazards: [['mist', 3], ['spikes', 1]], mood: { fog: 'rgba(24,28,52,', fogK: 0.55, tint: 'rgba(70,90,140,0.05)' },
        props: [['bones', 1.5], ['candles', 1.4], ['slab', 0.8], ['crack', 1.2]] },
      { name: 'The Ossuary', enemies: [['rattlerSpear', 3], ['rattlerMace', 2.5], ['rattlerBow', 2], ['rattlerHarrow', 1.2], ['rattlerGold', 0.5], ['gaper', 1.6], ['ghost', 1.5], ['banshee', 0.8]], mini: 'graveWarden',
        hazards: [['spikes', 3], ['oil', 1.5], ['mist', 0.6]], mood: { fog: 'rgba(30,22,40,', fogK: 0.62, tint: 'rgba(120,90,150,0.105)' },
        props: [['bonepile', 1.4], ['skulls', 1.2], ['bones', 2], ['crack', 1]] },
      { name: 'The Royal Tombs', enemies: [['brute', 2], ['gaper', 2.2], ['ghost', 2.5], ['banshee', 1.8], ['rattlerMace', 1.5], ['rattlerSpear', 1.5], ['rattlerGold', 1.2], ['rattlerHarrow', 1]],
        hazards: [['mist', 2], ['spikes', 2], ['oil', 1]], mood: { fog: 'rgba(12,16,40,', fogK: 0.72, tint: 'rgba(60,110,170,0.162)' },
        props: [['slab', 1.6], ['candles', 1.2], ['skulls', 0.8], ['web', 1]] },
    ],
    elite: 'brute', warden: 'graveWarden', boss: 'boneKing', bossAdds: ['rattler', 'rattlerBow', 'rattlerSpear'],
    hazards: [['spikes', 3], ['mist', 2], ['oil', 1]],
    props: [['bones', 2], ['candles', 1], ['slab', 0.7], ['web', 0.6], ['crack', 1.5], ['skulls', 0.6]],
    obstacles: [['rock', 3], ['brazier', 1.5], ['crate', 1]],
  },
  sewers: {
    name: 'The Sewers', blurb: 'Under the city. Wet, green and full of teeth.', rank: 2,
    palette: {
      floor: ['#B5B796', '#9C9F7E'], tile: ['rgba(60,80,50,0.14)', 'rgba(255,255,230,0.09)'], grout: 'rgba(48,62,44,0.22)',
      wall: ['#7C8468', '#5A604B'], wallTop: 'rgba(230,255,200,0.12)', rock: ['#4F5644', '#1E2620'], void: '#1E2620', accent: '#8FD16A',
    },
    floorStyle: 'brick', pillar: 'pipe',
    mood: { fog: 'rgba(22,40,30,', fogK: 0.55, tint: 'rgba(90,140,60,0.07)' },
    kinds: { fight: 48, hazard: 16, treasure: 12, fountain: 9, decision: 12, elite: 4 },
    floors: [
      // round 9: plague rats; slimes in their colours (blue, sludge, toxic); blood leeches
      { name: 'The Drains', enemies: [['rat', 4], ['ratPlague', 1.5], ['slime', 2.5], ['slimeSludge', 1.2], ['slimePoison', 1], ['slimeSmall', 1], ['leechBlood', 0.8]], mini: 'slime',
        hazards: [['gas', 3], ['oil', 0.6]], water: 0.6, mood: { fog: 'rgba(22,40,30,', fogK: 0.5, tint: 'rgba(90,140,60,0.06)' },
        props: [['grate', 1], ['moss', 2], ['puddle', 1.5], ['pipe', 0.8]] },
      { name: 'The Cistern', enemies: [['lizardBlade', 3], ['lizardman', 2.2], ['rat', 1.5], ['crab', 1.6], ['crabBlue', 1.2], ['croc', 1], ['leechBrain', 0.6], ['slime', 1]], mini: 'lizardBlade',
        hazards: [['oil', 2], ['spikes', 1]], water: 1, mood: { fog: 'rgba(14,34,44,', fogK: 0.58, tint: 'rgba(60,130,150,0.12)' },
        props: [['puddle', 2], ['moss', 2], ['crack', 0.8], ['pipe', 0.5]] },
      { name: 'The Nest', enemies: [['lizardman', 3], ['lizardBlade', 2.5], ['croc', 1.8], ['crabGreen', 1.4], ['ratKing', 0.8], ['ratPlague', 1.4], ['spiderHunter', 1], ['fireSlime', 0.6],
        ['slimeSludge', 1], ['leechBlood', 0.6]],
        hazards: [['gas', 2.5], ['spikes', 1.5], ['web', 1]], water: 0.5, mood: { fog: 'rgba(30,38,14,', fogK: 0.66, tint: 'rgba(150,150,40,0.144)' },
        props: [['bones', 1.4], ['moss', 2.5], ['bonepile', 0.8], ['web', 0.6]] },
    ],
    elite: 'lizardman', warden: 'lizardChief', boss: 'lizardChief', bossAdds: ['lizardBlade', 'rat', 'ratPlague', 'slime', 'crab'],
    hazards: [['gas', 2], ['oil', 1], ['spikes', 0.5]],
    water: 0.75,
    props: [['grate', 0.8], ['moss', 2.5], ['puddle', 1.2], ['pipe', 0.6], ['crack', 0.8], ['bones', 0.4]],
    obstacles: [['barrel', 2], ['crate', 2], ['pipe', 1], ['rock', 1]],
  },
  warren: {
    name: 'The Warren', blurb: 'Goblin tunnels. Loud, crowded and mean, and the floor is full of traps.', rank: 1,
    palette: {
      floor: ['#CDB089', '#B4946C'], tile: ['rgba(110,74,40,0.14)', 'rgba(255,240,200,0.10)'], grout: 'rgba(90,60,30,0.15)',
      wall: ['#9A7650', '#73543A'], wallTop: 'rgba(255,230,180,0.14)', rock: ['#6E5038', '#2C2019'], void: '#2C2019', accent: '#F2A23A',
    },
    floorStyle: 'dirt', pillar: 'barrel',
    mood: { fog: 'rgba(50,26,12,', fogK: 0.45, tint: 'rgba(255,150,60,0.05)' },
    kinds: { fight: 50, hazard: 15, treasure: 14, fountain: 8, decision: 10, elite: 5 },
    floors: [
      // round 9: mice (the goblins' pets) instead of rats; spear-throwers, bombers and dynamite mice
      { name: 'The Burrows', enemies: [['goblin', 4.5], ['mouse', 2], ['goblinSpear', 1.6], ['goblinBomber', 1], ['dynamouse', 0.7], ['hobgoblin', 1.2]], mini: 'hobgoblin',
        hazards: [['snare', 3], ['spikes', 1]], mood: { fog: 'rgba(50,26,12,', fogK: 0.4, tint: 'rgba(255,150,60,0.04)' },
        props: [['straw', 2.5], ['planks', 0.8], ['rubble', 1], ['crack', 0.6]] },
      { name: 'The War Camp', enemies: [['goblin', 2.5], ['hobgoblin', 3], ['orc', 2.2], ['orcShaman', 1.2], ['wolfRider', 1.5], ['drummer', 0.8], ['goblinSuicide', 1.1],
        ['goblinBomber', 0.8], ['goblinSpear', 0.8]], mini: 'orc',
        hazards: [['oil', 2], ['fire', 1.5], ['snare', 1.5]], mood: { fog: 'rgba(56,18,8,', fogK: 0.5, tint: 'rgba(255,90,40,0.105)' },
        props: [['firepit', 1], ['planks', 1.2], ['straw', 1.2], ['bonepile', 0.5]] },
      { name: 'The Pit', enemies: [['orc', 3], ['orcShaman', 1.4], ['frostShaman', 1], ['troll', 1.3], ['rockTroll', 1], ['hobgoblin', 1.5], ['goblin', 1.5], ['drummer', 0.8],
        ['goblinSuicide', 0.8], ['ogre', 0.6]],
        hazards: [['spikes', 3], ['fire', 1.2], ['snare', 1]], mood: { fog: 'rgba(30,14,8,', fogK: 0.62, tint: 'rgba(160,60,30,0.144)' },
        props: [['bonepile', 1.4], ['rubble', 1.6], ['crack', 1], ['firepit', 0.4]] },
    ],
    elite: 'troll', warden: 'warboss', boss: 'warboss', bossAdds: ['goblin', 'goblin', 'hobgoblin', 'orc'],
    hazards: [['snare', 3], ['spikes', 2], ['oil', 1.5]],
    props: [['straw', 2], ['planks', 0.7], ['firepit', 0.4], ['rubble', 1.2], ['bonepile', 0.6], ['crack', 0.6]],
    obstacles: [['crate', 3], ['barrel', 2], ['rock', 1]],
  },
  // ---- round 7: three harder dungeons after the Crypt (their enemies and bosses: js/foes.js; PLACEHOLDER art)
  frost: {
    name: 'The Frost Hollow', blurb: 'Caves of old ice. Things hang from the roof, and the cold gets into everything.', rank: 4, unlockAfter: 'crypt',
    palette: {
      floor: ['#CFDDE6', '#B6C8D4'], tile: ['rgba(60,90,120,0.12)', 'rgba(255,255,255,0.10)'], grout: 'rgba(60,80,110,0.22)',
      wall: ['#8EA7BC', '#6A8296'], wallTop: 'rgba(255,255,255,0.18)', rock: ['#4C6074', '#1A2430'], void: '#1A2430', accent: '#9FE3FF',
    },
    floorStyle: 'flag', pillar: 'stone',
    mood: { fog: 'rgba(20,36,60,', fogK: 0.6, tint: 'rgba(140,190,255,0.07)' },
    kinds: { fight: 48, hazard: 14, treasure: 12, fountain: 9, decision: 12, elite: 6 },
    floors: [
      // round 10 (lane R): the snowfield: frost wolves, snowmen, bats, ice slimes
      { name: 'The Snowfield', enemies: [['frostWolf', 3.5], ['bat', 2.5], ['snowman', 2.5], ['slimeIce', 2], ['spiritFrost', 0.5]], mini: 'snowman',
        hazards: [['mist', 3], ['spikes', 0.8]], mood: { fog: 'rgba(20,36,60,', fogK: 0.5, tint: 'rgba(140,190,255,0.06)' },
        props: [['crack', 1.8], ['rubble', 1], ['puddle', 0.8]] },
      // the web caves: spiders (the frost spider's webs chill), ice slimes, icicle wraiths. (The Brood Queen was a
      // RETHINK: the floor ends on a major Momma Spider for now.)
      { name: 'The Web Caves', enemies: [['spiderHunter', 2.4], ['spiderFrost', 2.2], ['spiderMomma', 1.6], ['slimeIce', 1.5], ['bat', 1.2], ['frostWraith', 1.2]], mini: 'spiderMomma',
        hazards: [['web', 3], ['spikes', 1.5]], mood: { fog: 'rgba(26,24,44,', fogK: 0.62, tint: 'rgba(150,130,200,0.105)' },
        props: [['web', 2], ['bones', 1], ['crack', 1]] },
      // the glacier heart: yetis, icicle wraiths, frost wolves, frost spirits ("Ogre no")
      { name: 'The Glacier Heart', enemies: [['yeti', 2.4], ['frostWraith', 2], ['frostWolf', 2], ['snowman', 1.6], ['spiritFrost', 1.1], ['spiderFrost', 1], ['banshee', 0.8]],
        hazards: [['mist', 2.5], ['spikes', 2]], mood: { fog: 'rgba(10,26,50,', fogK: 0.7, tint: 'rgba(120,200,255,0.18)' },
        props: [['rubble', 1.6], ['crack', 1.4], ['bonepile', 0.6]] },
    ],
    elite: 'yeti', warden: 'spiderMomma', boss: 'frostGiant', bossAdds: ['frostWolf', 'spiderFrost', 'snowman'],
    bossKind: null, // lane B: the designed boss (js/boss-frost.js) goes here; until then floor 3 ends with T.boss
    hazards: [['mist', 3], ['spikes', 2], ['web', 1.5]],
    props: [['crack', 1.6], ['rubble', 1], ['web', 0.8], ['bones', 0.6], ['puddle', 0.6]],
    obstacles: [['rock', 4], ['crate', 1], ['barrel', 0.6]],
  },
  ember: {
    name: 'The Ember Deep', blurb: 'Down where the rock glows. Imps, demons, and fire that never goes out.', rank: 5, unlockAfter: 'frost',
    palette: {
      floor: ['#8E6A5C', '#76554A'], tile: ['rgba(60,20,10,0.16)', 'rgba(255,200,150,0.08)'], grout: 'rgba(40,16,10,0.3)',
      wall: ['#6E4A40', '#4E322A'], wallTop: 'rgba(255,170,120,0.14)', rock: ['#4A2A22', '#1C0F0D'], void: '#1C0F0D', accent: '#FF7A2F',
    },
    floorStyle: 'dirt', pillar: 'stone',
    mood: { fog: 'rgba(48,12,6,', fogK: 0.58, tint: 'rgba(255,90,30,0.07)' },
    kinds: { fight: 48, hazard: 16, treasure: 11, fountain: 8, decision: 11, elite: 6 },
    floors: [
      // round 10 (lane R): the ash wastes: imps, cinder bats, hellhounds, fire slimes, burning ground
      { name: 'The Ash Wastes', enemies: [['imp', 3.5], ['cinderBat', 2.4], ['fireSlime', 2.4], ['hellhound', 1.8], ['spiritFire', 0.5]], mini: 'fireSlime',
        hazards: [['fire', 3], ['oil', 0.8]], mood: { fog: 'rgba(48,12,6,', fogK: 0.5, tint: 'rgba(255,90,30,0.06)' },
        props: [['crack', 2], ['rubble', 1]] },
      // the forges: devils, dragonborn, fire spiders, hellhounds; the Pit Lord (tuned up: a fire whip, rifts that spit imps)
      { name: 'The Forges', enemies: [['devil', 2.6], ['imp', 2], ['dragonborn', 1.8], ['spiderFire', 2], ['hellhound', 1.4], ['fireSlime', 0.8], ['spiritFire', 0.7]], mini: 'pitLord',
        hazards: [['oil', 2], ['fire', 2], ['spikes', 1]], mood: { fog: 'rgba(60,24,4,', fogK: 0.58, tint: 'rgba(255,150,40,0.12)' },
        props: [['firepit', 1], ['crack', 1.5], ['rubble', 1.2]] },
      { name: 'The Ash Throne', enemies: [['demon', 2.5], ['dragonborn', 2.4], ['devil', 1.8], ['hellhound', 1.6], ['spiderFire', 1.2], ['spiritFire', 1.1], ['cinderBat', 1.2], ['imp', 1]],
        hazards: [['fire', 2.5], ['spikes', 2]], mood: { fog: 'rgba(30,4,4,', fogK: 0.7, tint: 'rgba(200,30,20,0.18)' },
        props: [['bonepile', 1], ['skulls', 0.8], ['crack', 2]] },
    ],
    elite: 'demon', warden: 'pitLord', boss: 'archfiend', bossAdds: ['imp', 'hellhound', 'devil'],
    bossKind: null, // lane B: Cinder, the Old Drake (js/boss-ember.js) goes here; until then floor 3 ends with T.boss
    hazards: [['fire', 3], ['oil', 1], ['spikes', 1.2]],
    props: [['crack', 2], ['rubble', 1.2], ['bonepile', 0.6], ['firepit', 0.5], ['skulls', 0.4]],
    obstacles: [['rock', 3], ['brazier', 2], ['barrel', 0.5]],
  },
  spire: {
    name: 'The Gilded Spire', blurb: 'A tower of gold and white stone. Its host does not want you here.', rank: 6, unlockAfter: 'ember',
    palette: {
      floor: ['#E6DCC4', '#D4C7AA'], tile: ['rgba(120,100,60,0.12)', 'rgba(255,255,255,0.12)'], grout: 'rgba(120,100,60,0.2)',
      wall: ['#C9B98F', '#A8976C'], wallTop: 'rgba(255,255,230,0.2)', rock: ['#5A5070', '#2E2840'], void: '#2E2840', accent: '#F2C84A',
    },
    floorStyle: 'brick', pillar: 'stone',
    mood: { fog: 'rgba(40,32,70,', fogK: 0.45, tint: 'rgba(255,230,160,0.06)' },
    kinds: { fight: 48, hazard: 14, treasure: 12, fountain: 8, decision: 12, elite: 6 },
    floors: [
      // round 10 (lane R): the steps: cherubs, angels, sun blades, choir sprites, sigils
      { name: 'The Steps', enemies: [['cherub', 3], ['angel', 2.4], ['sunBlade', 1.8], ['choirSprite', 1.2]], mini: 'angel',
        hazards: [['beam', 3], ['spikes', 1]], mood: { fog: 'rgba(40,32,70,', fogK: 0.38, tint: 'rgba(255,230,160,0.05)' },
        props: [['slab', 1.2], ['candles', 1.2]] },
      // the choir halls: seraphs, choir sprites, fallen angels, light spirits; the Twin Heralds (the Archon was an IDK)
      { name: 'The Choir Halls', enemies: [['seraph', 2.6], ['cherub', 2.4], ['angel', 1.8], ['choirSprite', 1.8], ['angelFallen', 1.4], ['spiritHeal', 0.8], ['sunBlade', 0.8]], mini: 'heraldLight',
        hazards: [['beam', 3.5], ['spikes', 1.5]], mood: { fog: 'rgba(50,40,90,', fogK: 0.48, tint: 'rgba(230,200,255,0.105)' },
        props: [['candles', 2], ['slab', 0.8]] },
      // the sanctum: seraphs, golems and gilded golems, the fallen, ward spirits
      { name: 'The Sanctum', enemies: [['seraph', 2.2], ['angel', 2], ['angelFallen', 1.8], ['gildedGolem', 1.4], ['golem', 0.9], ['sunBlade', 1.4], ['spiritWard', 0.9], ['cherub', 1.2]],
        hazards: [['beam', 3], ['spikes', 2], ['fire', 0.6]], mood: { fog: 'rgba(60,50,30,', fogK: 0.42, tint: 'rgba(255,240,180,0.162)' },
        props: [['slab', 1.4], ['crack', 1], ['candles', 0.6]] },
    ],
    elite: 'gildedGolem', warden: 'heraldLight', boss: 'radiant', bossAdds: ['cherub', 'cherub', 'angel', 'angelFallen'],
    bossKind: null, // lane B: the Spire's designed boss (js/boss-spire.js) goes here; until then floor 3 ends with T.boss
    hazards: [['beam', 3], ['spikes', 2]],
    props: [['slab', 1.2], ['candles', 1], ['crack', 0.8]],
    obstacles: [['rock', 1], ['brazier', 2], ['crate', 1]],
  },
};
for (const [id, t] of Object.entries(THEMES)) {
  t.id = id;
  t.enemies = t.floors.map((f) => f.enemies); // the old per-floor rosters, for older readers
  t.minis = t.floors.slice(0, 2).map((f) => f.mini);
}
// The order the dungeons open in (beat one's boss to open the next; progress.js). Round 9: the Wildwood is the first.
export const DUNGEON_ORDER = ['wildwood', 'warren', 'sewers', 'crypt', 'frost', 'ember', 'spire'];
// One floor of a dungeon as its own theme: the dungeon's look with the floor's enemies, hazards, mood, dressing and
// room mix laid over it. dungeon.js hands this to the room (w.theme), so the renderer draws the floor's mood.
const floorCache = {};
export function floorTheme(id, floor = 1) {
  const T = themeOf(id), f = Math.max(1, Math.min(T.floors.length, floor)), key = T.id + f;
  if (floorCache[key]) return floorCache[key];
  const F = T.floors[f - 1];
  return (floorCache[key] = { ...T, ...F, id: T.id, floor: f, floorName: F.name, name: T.name,
    palette: { ...T.palette, ...(F.palette || {}) }, mood: { ...T.mood, ...(F.mood || {}) },
    kinds: { ...T.kinds, ...(F.kinds || {}) }, props: F.props || T.props, hazards: F.hazards || T.hazards,
    obstacles: F.obstacles || T.obstacles, water: F.water ?? T.water ?? 0 });
}
export const THEME_IDS = Object.keys(THEMES);
export const DEFAULT_THEME = 'crypt';
export const themeOf = (id) => THEMES[id] || THEMES[DEFAULT_THEME];

// A weighted pick from [[x, weight], ...] with the given rand().
export function weighted(list, rand) {
  let tot = 0; for (const [, wt] of list) tot += wt;
  let r = rand() * tot;
  for (const [x, wt] of list) { r -= wt; if (r <= 0) return x; }
  return list[list.length - 1][0];
}
