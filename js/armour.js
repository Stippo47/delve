// Armour (round 11). The designer: "Is there an armour stat? If not maybe there should be. And not a simple 20% off
// all damage." Every blow loses the wearer's armour in points, but never more than ARMOUR_CAP of itself: a swarm's
// nips mostly bounce off, one heavy blow mostly goes through. A blow marked heavy, or a critical one, gets past half of
// it; damage over time (burning, poison, bleeding ground) ignores it. sim.js hurt applies it, spawn reads it.
// Heroes: heroes.js ARMOUR (and the web's Armour nodes). Enemies: a def's own `armor`, or this table; an enemy's armour
// grows with the square root of its dungeon's strength, so it still matters deep down without becoming a wall.
export const ARMOUR_CAP = 0.6;
export const ENEMY_ARMOUR = {
  // shells and bone plate
  crab: 4, crabBlue: 3, crabGreen: 3, scarab: 2, scarabGold: 4, brute: 3, graveWarden: 4, rattlerGold: 3, banditBrute: 2,
  // stone
  rockTroll: 5, golem: 6, gildedGolem: 7,
  // the Foundry's metal: copper is soft, bronze turns a knife, steel wants a hammer
  beeBronze: 2, waspBronze: 2, hornetBronze: 2, beeSteel: 4, waspSteel: 4, hornetSteel: 4,
  automaton: 4, gearSprite: 3, cogSprite: 3, bombBot: 1, drillBot: 3, chainCrawler: 3, crawlerPlate: 4, foundrySmith: 3,
  turretSteam: 3, turretFlame: 3, turretGun: 3, turretLaser: 3, mortar: 3, mortarFire: 3, mortarPoison: 3,
};
