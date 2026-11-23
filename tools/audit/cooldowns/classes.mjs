// Which lasting things are which (shared by lib.mjs and analyze.mjs).
// Lasting things that run on the hero's own timers (u.k2) or kit but are out in the world, not on him: a patch of
// caltrops, a time bubble, a ritual circle, a falcon, a string tied to an enemy... (read in each ability's code).
export const WORLD = { caltrops: { 'timer:caltrops': 'zone' }, timeBubble: { 'timer:bubble': 'zone' }, swarm: { 'timer:smoker': 'zone' }, starfall: { 'timer:illOmen': 'zone' },
  ritualCircle: { 'timer:ritualCircle': 'zone' }, ramCharge: { 'timer:ram': 'zone' }, looseFalcon: { 'timer:falcon': 'summon', 'kit.falconOut': 'summon' }, stopClock: { 'timer:stopClock': 'zone' },
  acidFlask: { 'timer:pool': 'zone' }, greaseFire: { 'timer:greaseFire': 'zone' }, heartstring: { 'kit.string': 'zone' }, cursedBrew: { 'kit.brew': 'summon' }, jawTrap: { 'timer:trap': 'zone' } };
// Leftovers that look like a lasting effect but aren't one (checked by hand in the code): u.spin is the spin pose's
// record, never cleared; the guard's, regrowth's and arena's own references; the Werewolf's stored human body; the
// Shade's stab pose; the Wildmane's second-leap flag; 'rift' is a skeleton pulling itself back together (the enemy's, when the cast kills one).
export const JUNK = new Set(['u.spin', 'u.guardOf', 'u.regenSrc', 'kit.human', 'kit.arenaFoe', 'zone:rift', 'kit.stabAnim', 'u.leapAgain']);
