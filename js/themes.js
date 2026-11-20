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
//   enemies: [floor1, floor2, floor3] each [[kind, weight], ...] (kinds from enemies.js / units.js; each def has a
//            cost, packs of small things come in groups),
//   elite: kind (the elite room's big one), warden: kind (floors 1 and 2 end with it), boss: kind (floor 3),
//   bossAdds: [kind, ...] (who comes with the warden),
//   hazards: [[type, weight], ...] ('spikes' | 'oil' | 'mist' | 'gas' | 'snare'; 'water' channels are separate),
//   water: chance a room has a water channel (sewers),
//   props: [[type, per-chunk count], ...] (floor dressing drawn into the floor: bones, candles, slab, web, crack,
//          skulls, grate, moss, puddle, pipe, straw, planks, firepit, rubble, bonepile; drawn in scenery.js) }

export const THEMES = {
  crypt: {
    name: 'The Crypt', blurb: 'Old graves under the hill. The dead here don\'t stay down.',
    palette: {
      floor: ['#B9B5B2', '#A29E9D'], tile: ['rgba(70,72,96,0.14)', 'rgba(255,255,255,0.08)'], grout: 'rgba(40,38,56,0.28)',
      wall: ['#8E8D96', '#66646F'], wallTop: 'rgba(255,255,255,0.14)', rock: ['#5E5C68', '#25222C'], void: '#25222C', accent: '#7FD6F5',
    },
    floorStyle: 'flag', pillar: 'stone',
    mood: { fog: 'rgba(24,28,52,', fogK: 0.62, tint: 'rgba(70,90,140,0.06)' },
    kinds: { fight: 46, hazard: 13, treasure: 13, fountain: 10, decision: 13, elite: 5 },
    enemies: [
      [['rat', 3], ['rattler', 4], ['rattlerBow', 2]],
      [['rat', 2], ['rattler', 3], ['rattlerBow', 2], ['rattlerSpear', 2], ['rattlerMace', 2], ['ghost', 2], ['gaper', 1]],
      [['rattler', 2], ['rattlerBow', 2], ['rattlerSpear', 2], ['rattlerMace', 2], ['ghost', 2], ['gaper', 2], ['brute', 1.2]],
    ],
    elite: 'brute', warden: 'graveWarden', boss: 'boneKing', bossAdds: ['rattler', 'rattlerBow', 'rattlerSpear'],
    hazards: [['spikes', 3], ['mist', 2], ['oil', 1]],
    props: [['bones', 2], ['candles', 1], ['slab', 0.7], ['web', 0.6], ['crack', 1.5], ['skulls', 0.6]],
  },
  sewers: {
    name: 'The Sewers', blurb: 'Under the city. Wet, green and full of teeth.',
    palette: {
      floor: ['#B5B796', '#9C9F7E'], tile: ['rgba(60,80,50,0.14)', 'rgba(255,255,230,0.09)'], grout: 'rgba(48,62,44,0.22)',
      wall: ['#7C8468', '#5A604B'], wallTop: 'rgba(230,255,200,0.12)', rock: ['#4F5644', '#1E2620'], void: '#1E2620', accent: '#8FD16A',
    },
    floorStyle: 'brick', pillar: 'pipe',
    mood: { fog: 'rgba(22,40,30,', fogK: 0.55, tint: 'rgba(90,140,60,0.07)' },
    kinds: { fight: 48, hazard: 16, treasure: 12, fountain: 9, decision: 12, elite: 4 },
    enemies: [
      [['rat', 5], ['slime', 3], ['lizardBlade', 1]],
      [['rat', 4], ['slime', 3], ['lizardman', 2.5], ['lizardBlade', 2]],
      [['rat', 3], ['slime', 2], ['lizardman', 3], ['lizardBlade', 3]],
    ],
    elite: 'lizardman', warden: 'lizardChief', boss: 'lizardChief', bossAdds: ['lizardBlade', 'rat', 'rat', 'slime'],
    hazards: [['gas', 2], ['oil', 1], ['spikes', 0.5]],
    water: 0.75,
    props: [['grate', 0.8], ['moss', 2.5], ['puddle', 1.2], ['pipe', 0.6], ['crack', 0.8], ['bones', 0.4]],
  },
  warren: {
    name: 'The Warren', blurb: 'Goblin tunnels. Loud, crowded and mean, and the floor is full of traps.',
    palette: {
      floor: ['#CDB089', '#B4946C'], tile: ['rgba(110,74,40,0.14)', 'rgba(255,240,200,0.10)'], grout: 'rgba(90,60,30,0.15)',
      wall: ['#9A7650', '#73543A'], wallTop: 'rgba(255,230,180,0.14)', rock: ['#6E5038', '#2C2019'], void: '#2C2019', accent: '#F2A23A',
    },
    floorStyle: 'dirt', pillar: 'barrel',
    mood: { fog: 'rgba(50,26,12,', fogK: 0.45, tint: 'rgba(255,150,60,0.05)' },
    kinds: { fight: 50, hazard: 15, treasure: 14, fountain: 8, decision: 10, elite: 5 },
    enemies: [
      [['goblin', 5], ['hobgoblin', 2], ['rat', 1]],
      [['goblin', 4], ['hobgoblin', 3], ['orc', 2], ['orcShaman', 1.2]],
      [['goblin', 3.5], ['hobgoblin', 2.5], ['orc', 3], ['orcShaman', 1.8], ['troll', 1.1]],
    ],
    elite: 'troll', warden: 'warboss', boss: 'warboss', bossAdds: ['goblin', 'goblin', 'hobgoblin', 'orc'],
    hazards: [['snare', 3], ['spikes', 2], ['oil', 1.5]],
    props: [['straw', 2], ['planks', 0.7], ['firepit', 0.4], ['rubble', 1.2], ['bonepile', 0.6], ['crack', 0.6]],
  },
};
for (const [id, t] of Object.entries(THEMES)) t.id = id;
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
