// Round 16 (the balance audit): the fixed scenarios every hero is put through, at tiers I, II and III. The same
// opponents for every hero; only their strength moves with the tier (FOE_MULT), so a tier III hero still has a fight.
// Battle-mode scenarios use js/battle.js (an open crypt room, Large); the dungeon one uses js/dungeon.js as
// tools/test/hero-vs.mjs does (a bare run: no trinkets found, no potions), stopped when the first floor is cleared.
//
// A hero's tier is heroes.js tierBuild (the battle page's and the Book's meaning: 1 = the first shell of the web with
// every ability at tier I and the stats beside them, 2 = the second shell, 3 = the whole web). The same in the dungeon.
//
// Enemy strength: each monster is made as the dungeon makes a stronger place's monsters (dungeon.js battleFoe with
// mult FOE_MULT[tier] x the scenario's own mul: health and blows up; battle mode's own "scaled off" is x0.75). Set
// with run.mjs --calibrate so a middling hero at each tier has a fight of roughly 20-60 s and the ally fights press
// the ally hard enough to need help.
export const FOE_MULT = { 1: 1.5, 2: 3, 3: 5 };
// the reference heroes for the 1v1s, and the standard mates (with a stand-in when the hero is one of them)
export const REF = { melee: 'wildmane', ranged: 'archer', caster: 'pyromancer', tank: 'paladin' };
const other = (h, a, b) => (h === a ? b : a);
export const MATES = (h) => [other(h, 'paladin', 'tower'), other(h, 'archer', 'huntress'), other(h, 'cleric', 'druid')];
const MIXED = [{ k: 'bandit', n: 1 }, { k: 'banditAxe', n: 1 }, { k: 'poacher', n: 1 }, { k: 'wisp', n: 1 }, { k: 'goblin', n: 2 }];

export const SCENARIOS = [
  { id: 'duelMelee', group: '1v1', name: '1v1 vs Wildmane (melee)', foes: (h, t) => [{ k: REF.melee, n: 1, tier: t }] },
  { id: 'duelRanged', group: '1v1', name: '1v1 vs Archer (ranged)', foes: (h, t) => [{ k: REF.ranged, n: 1, tier: t }] },
  { id: 'duelCaster', group: '1v1', name: '1v1 vs Pyromancer (caster)', foes: (h, t) => [{ k: REF.caster, n: 1, tier: t }] },
  { id: 'duelTank', group: '1v1', name: '1v1 vs Paladin (tank)', foes: (h, t) => [{ k: REF.tank, n: 1, tier: t }] },
  { id: 'ogre', group: 'charged', name: 'vs an elite Ogre (slam ring, then a split line down the floor)', foes: () => [{ k: 'ogre', n: 1, rank: 1 }] },
  { id: 'boar', group: 'charged', name: 'vs two elite Thornback Boars (telegraphed charges)', foes: () => [{ k: 'boar', n: 2, rank: 1 }] },
  { id: 'swarm', group: 'swarm', name: 'vs a swarm of 10 sewer rats', mul: 2, foes: () => [{ k: 'rat', n: 10 }] },
  { id: 'duo', group: 'duo', name: 'vs a Bandit (melee, shield) and a Poacher (ranged, snares)', mul: 1.6, foes: () => [{ k: 'bandit', n: 1 }, { k: 'poacher', n: 1 }] },
  { id: 'allyTank', group: 'ally', name: 'with a Paladin (Tower if the hero is the Paladin) vs a mixed group', ally: (h) => other(h, 'paladin', 'tower'), mul: { 1: 2.4, 2: 3.4, 3: 3.4 }, foes: () => MIXED },
  { id: 'allyHealer', group: 'ally', name: 'with a Cleric (Druid if the hero is the Cleric) vs a mixed group', ally: (h) => other(h, 'cleric', 'druid'), mul: { 1: 2.4, 2: 3.4, 3: 3.4 }, foes: () => MIXED },
  { id: 'dungeon', group: 'dungeon', name: 'a dungeon floor with three mates (Paladin, Archer, Cleric)', dungeon: true },
];
export const MIXED_GROUP = MIXED;
export const DUNGEON_THEMES = ['wildwood', 'warren', 'crypt', 'sewers'];
export const BATTLE_CAP = 120, DUNGEON_CAP = 600;
