# Foes audit

<!-- tables -->

## 1. One against one, inside each dungeon

18500 fights, 10 seeds a pair (half with each kind on each side), at rank 0 (everyone at the Wildwood's strength) and at home strength (as strong as on its own dungeon's first floor). A win is worth 1, a draw 1/2. "Score" is the share of its fights a kind won against every other kind of its dungeon. "Upsets" are pairs where the cheaper kind (by `cost`) won at least 70% against one at least 1.5x its cost.

### The Wildwood

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Poacher (poacher) | 4 | 93% | 92% |
| Ent (ent) | 9 | 91% | 91% |
| Big Slime (slimeBig) | 5 | 89% | 91% |
| Bandit Brute (banditBrute) | 7 | 86% | 87% |
| Poison Slime (slimePoison) | 3 | 76% | 76% |
| Bandit (bandit) | 3 | 59% | 59% |
| Torch Bandit (banditTorch) | 3 | 56% | 56% |
| Dire Wolf (direWolf) | 4 | 55% | 56% |
| Thornback Boar (boar) | 5 | 55% | 58% |
| Greatsword Bandit (banditGreat) | 4 | 54% | 53% |
| Knife Bandit (banditDagger) | 3 | 48% | 50% |
| Orange Goblin (goblinOrange) | 2 | 44% | 41% |
| Spear Bandit (banditSpear) | 3 | 44% | 44% |
| Axe Bandit (banditAxe) | 4 | 31% | 29% |
| Slime (slime) | 2 | 29% | 28% |
| Wolf (wolf) | 2 | 19% | 20% |
| Goblin (goblin) | 2 | 13% | 13% |
| Sproutling (sproutling) | 1.5 | 6% | 6% |
| Wisp (wisp) | 3 | 3% | 4% |

Upsets (rank 0, the 8 widest of 14): Orange Goblin (cost 2) beats Thornback Boar (cost 5) 70%; Poacher (cost 4) beats Ent (cost 9) 70%; Orange Goblin (cost 2) beats Axe Bandit (cost 4) 70%; Sproutling (cost 1.5) beats Wisp (cost 3) 100%; Poacher (cost 4) beats Bandit Brute (cost 7) 80%; Poison Slime (cost 3) beats Thornback Boar (cost 5) 100%; Bandit (cost 3) beats Thornback Boar (cost 5) 100%; Torch Bandit (cost 3) beats Thornback Boar (cost 5) 70%.

Mostly draws (time ran out, 240 s): Slime v Wisp; Poison Slime v Wisp.

### The Warren

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Rock Troll (rockTroll) | 9 | 99% | 98% |
| Frost Shaman (frostShaman) | 5 | 85% | 87% |
| Troll (troll) | 8 | 82% | 85% |
| Wolf Rider (wolfRider) | 5 | 77% | 62% |
| Orc Shaman (orcShaman) | 5 | 70% | 77% |
| Ogre (ogre) | 8 | 62% | 65% |
| Spear Goblin (goblinSpear) | 2 | 60% | 60% |
| Orc (orc) | 5 | 46% | 48% |
| Hobgoblin (hobgoblin) | 3 | 38% | 38% |
| Mouse (mouse) | 0.8 | 31% | 28% |
| Goblin Bomber (goblinBomber) | 2.5 | 23% | 25% |
| Drummer (drummer) | 3 | 17% | 18% |
| Suicide Bomber (goblinSuicide) | 2.5 | 8% | 8% |
| Dynamite Mouse (dynamouse) | 1.5 | 2% | 1% |

Upsets (rank 0, the 8 widest of 10): Mouse (cost 0.8) beats Drummer (cost 3) 100%; Mouse (cost 0.8) beats Goblin Bomber (cost 2.5) 100%; Mouse (cost 0.8) beats Suicide Bomber (cost 2.5) 100%; Spear Goblin (cost 2) beats Orc (cost 5) 90%; Mouse (cost 0.8) beats Dynamite Mouse (cost 1.5) 100%; Orc Shaman (cost 5) beats Ogre (cost 8) 100%; Wolf Rider (cost 5) beats Ogre (cost 8) 70%; Frost Shaman (cost 5) beats Ogre (cost 8) 90%.

### The Sewers

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Rat King (ratKing) | 8 | 100% | 100% |
| Green Crab (crabGreen) | 3.5 | 89% | 89% |
| Blue Crab (crabBlue) | 3 | 79% | 86% |
| Hunter Spider (spiderHunter) | 3 | 76% | 67% |
| Sewer Crab (crab) | 3 | 71% | 71% |
| Croc (croc) | 6 | 71% | 71% |
| Lizardman (lizardman) | 5 | 57% | 62% |
| Sludge Slime (slimeSludge) | 3 | 48% | 39% |
| Lizard Blade (lizardBlade) | 3 | 43% | 49% |
| Fire Slime (fireSlime) | 4 | 33% | 32% |
| Blood Leech (leechBlood) | 2 | 27% | 29% |
| Plague Rat (ratPlague) | 1.3 | 26% | 25% |
| Rat (rat) | 1 | 18% | 18% |
| Slimelet (slimeSmall) | 1 | 11% | 11% |
| Brain Leech (leechBrain) | 3 | 1% | 1% |

Upsets (rank 0, the 8 widest of 10): Rat (cost 1) beats Brain Leech (cost 3) 100%; Slimelet (cost 1) beats Brain Leech (cost 3) 100%; Plague Rat (cost 1.3) beats Brain Leech (cost 3) 100%; Sewer Crab (cost 3) beats Croc (cost 6) 100%; Blue Crab (cost 3) beats Croc (cost 6) 100%; Green Crab (cost 3.5) beats Croc (cost 6) 100%; Sewer Crab (cost 3) beats Lizardman (cost 5) 100%; Blue Crab (cost 3) beats Lizardman (cost 5) 100%.

Mostly draws (time ran out, 240 s): Sewer Crab v Green Crab; Blue Crab v Green Crab.

### The Crypt

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Golden Skeleton (rattlerGold) | 5 | 89% | 89% |
| Brute (brute) | 7 | 87% | 86% |
| Bone Archer (rattlerBow) | 3 | 81% | 79% |
| Banshee (banshee) | 5 | 74% | 76% |
| Gaper (gaper) | 6 | 58% | 59% |
| Harrowing Skeleton (rattlerHarrow) | 4 | 44% | 32% |
| Bone Spear (rattlerSpear) | 3 | 27% | 22% |
| Loose Jaw (rattlerMace) | 4 | 26% | 42% |
| Rattler (rattler) | 3 | 14% | 14% |
| Ghost (ghost) | 3 | 0% | 0% |

Upsets (rank 0): Bone Archer (cost 3) beats Gaper (cost 6) 90%; Bone Archer (cost 3) beats Banshee (cost 5) 100%.

### The Frost Hollow

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Yeti (yeti) | 8 | 96% | 98% |
| Snowman (snowman) | 4 | 71% | 73% |
| Frost Spider (spiderFrost) | 3 | 70% | 70% |
| Ice Slime (slimeIce) | 3 | 51% | 50% |
| Frost Wolf (frostWolf) | 2.5 | 48% | 50% |
| Cave Bat (bat) | 2 | 40% | 38% |
| Momma Spider (spiderMomma) | 6 | 38% | 39% |
| Icicle Wraith (frostWraith) | 4 | 36% | 34% |
| Frost Spirit (spiritFrost) | 2.5 | 0% | 0% |

Upsets (rank 0): Cave Bat (cost 2) beats Momma Spider (cost 6) 100%; Frost Wolf (cost 2.5) beats Momma Spider (cost 6) 100%; Cave Bat (cost 2) beats Icicle Wraith (cost 4) 100%; Frost Spider (cost 3) beats Momma Spider (cost 6) 100%; Frost Wolf (cost 2.5) beats Icicle Wraith (cost 4) 100%; Snowman (cost 4) beats Momma Spider (cost 6) 100%.

### The Ember Deep

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Succubus (succubus) | 5 | 95% | 99% |
| Demon (demon) | 8 | 86% | 88% |
| Dragonborn (dragonborn) | 7 | 71% | 71% |
| Devil (devil) | 5 | 59% | 63% |
| Hellhound (hellhound) | 3 | 50% | 46% |
| Imp (imp) | 2 | 39% | 30% |
| Fire Spider (spiderFire) | 3.5 | 38% | 41% |
| Fire Spirit (spiritFire) | 2.5 | 13% | 13% |
| Cinder Bat (cinderBat) | 2 | 0% | 0% |

Upsets (rank 0): Succubus (cost 5) beats Demon (cost 8) 100%.

### The Gilded Spire

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Gilded Golem (gildedGolem) | 9 | 99% | 99% |
| Golem (golem) | 8 | 84% | 81% |
| Seraph (seraph) | 5 | 82% | 84% |
| Fallen Angel (angelFallen) | 5 | 67% | 67% |
| Angel (angel) | 5 | 56% | 54% |
| Cherub (cherub) | 2 | 42% | 46% |
| Sun Blade (sunBlade) | 4 | 36% | 34% |
| Choir Sprite (choirSprite) | 3.5 | 23% | 23% |
| Light Spirit (spiritHeal) | 2.5 | 6% | 6% |
| Ward Spirit (spiritWard) | 2.5 | 6% | 6% |

Upsets (rank 0): Cherub (cost 2) beats Sun Blade (cost 4) 80%; Cherub (cost 2) beats Choir Sprite (cost 3.5) 100%.

Mostly draws (time ran out, 240 s): Light Spirit v Ward Spirit.

### The Sunken Dunes

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Jackal Guard (jackal) | 5 | 86% | 87% |
| Sand Mage (sandMage) | 5 | 80% | 61% |
| Sand Serpent (sandSerpent) | 7 | 71% | 79% |
| Cobra (cobra) | 3.5 | 69% | 72% |
| Mummy (mummy) | 6 | 66% | 73% |
| Golden Scarab (scarabGold) | 2.5 | 60% | 60% |
| Dart Trap (dartTrap) | 3 | 36% | 30% |
| Scarab (scarab) | 1.5 | 22% | 27% |
| Wind Spirit (spiritHaste) | 2.5 | 6% | 6% |
| Venom Spirit (spiritPoison) | 2.5 | 6% | 6% |

Upsets (rank 0): Cobra (cost 3.5) beats Mummy (cost 6) 90%; Scarab (cost 1.5) beats Wind Spirit (cost 2.5) 100%; Scarab (cost 1.5) beats Venom Spirit (cost 2.5) 100%.

Mostly draws (time ran out, 240 s): Wind Spirit v Venom Spirit.

### The Clockwork Foundry

| kind | cost | score at rank 0 | score at home strength |
|---|---|---|---|
| Steel Hornet (hornetSteel) | 4.9 | 98% | 96% |
| Steel Wasp (waspSteel) | 3 | 93% | 97% |
| Bronze Hornet (hornetBronze) | 3.6 | 88% | 88% |
| Foundry Smith (foundrySmith) | 8 | 83% | 81% |
| Bronze Wasp (waspBronze) | 2.2 | 77% | 78% |
| Fire Mortar (mortarFire) | 4.5 | 71% | 61% |
| Drill Bot (drillBot) | 3.5 | 70% | 73% |
| Chain Crawler (chainCrawler) | 8 | 65% | 72% |
| Copper Wasp (wasp) | 1.6 | 63% | 64% |
| Steel Bee (beeSteel) | 2.3 | 63% | 69% |
| Automaton (automaton) | 6 | 62% | 68% |
| Steam Turret (turretSteam) | 3.5 | 57% | 52% |
| Cog Sprite (cogSprite) | 2.4 | 56% | 58% |
| Gear Sprite (gearSprite) | 2 | 47% | 46% |
| Flame Turret (turretFlame) | 3.5 | 46% | 32% |
| Bronze Bee (beeBronze) | 1.7 | 42% | 49% |
| Laser Turret (turretLaser) | 4 | 41% | 30% |
| Tesla Coil (teslaCoil) | 4.5 | 41% | 42% |
| Mortar (mortar) | 4 | 38% | 41% |
| Gun Turret (turretGun) | 3.5 | 38% | 38% |
| Repair Drone (repairDrone) | 3 | 31% | 34% |
| Gas Mortar (mortarPoison) | 4.5 | 30% | 32% |
| Copper Bee (bee) | 1.2 | 26% | 26% |
| Storm Spirit (spiritShock) | 2.5 | 11% | 11% |
| Auto Bomb Bot (autoBomb) | 3 | 9% | 8% |
| Bomb Bot (bombBot) | 2.5 | 4% | 4% |
| Saw Blade (sawBlade) | 2.5 | 0% | 0% |

Upsets (rank 0, the 8 widest of 66): Copper Wasp (cost 1.6) beats Automaton (cost 6) 90%; Bronze Wasp (cost 2.2) beats Foundry Smith (cost 8) 90%; Bronze Wasp (cost 2.2) beats Chain Crawler (cost 8) 100%; Copper Bee (cost 1.2) beats Laser Turret (cost 4) 70%; Copper Wasp (cost 1.6) beats Gas Mortar (cost 4.5) 100%; Bronze Wasp (cost 2.2) beats Automaton (cost 6) 100%; Steel Wasp (cost 3) beats Foundry Smith (cost 8) 90%; Steel Wasp (cost 3) beats Chain Crawler (cost 8) 100%.

Mostly draws (time ran out, 240 s): Flame Turret v Tesla Coil; Flame Turret v Laser Turret.

## 3. Against a hero

7872 fights, 4 seeds each, rank 0. Each kind alone, and as a pack of about 16 cost points (n = 16 / cost, rounded), against each of paladin, berserker, archer, pyromancer at tier I and tier II. The hero is kept on its feet (topped up every frame), so a fight runs until the hero has killed them all: **toll** is the damage they deal to the hero before they all die. "Hero down" is how often that toll passed the hero's own health (the fight it would have lost) and how fast. "Toughness" is the damage they soaked (health lost plus what armour, shields and dodges kept off). **Threat per cost** is the pack's toll divided by its cost, averaged over the eight heroes and tiers; the last column is that against the dungeon's median (1.0 = the median; under 0.5 or over 2 is flagged).

### The Wildwood

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Poacher (poacher) | 4 | 4 (16) | 10.4 | 3.2 | 16.5 | 13% | 71.7 s | 17.7 s | 4.72 **high** |
| Poison Slime (slimePoison) | 3 | 5 (15) | 7.7 | 3.8 | 46.3 | 13% | 36 s | 14.7 s | 3.47 **high** |
| Knife Bandit (banditDagger) | 3 | 5 (15) | 5.2 | 1.3 | 20 | 0% | - | 7.9 s | 2.38 **high** |
| Big Slime (slimeBig) | 5 | 3 (15) | 4.5 | 4 | 96 | 0% | - | 34.4 s | 2.04 **high** |
| Bandit (bandit) | 3 | 5 (15) | 2.6 | 2 | 47.8 | 0% | - | 13.5 s | 1.2 |
| Axe Bandit (banditAxe) | 4 | 4 (16) | 2.6 | 0.6 | 19.5 | 0% | - | 9.2 s | 1.19 |
| Orange Goblin (goblinOrange) | 2 | 8 (16) | 2.5 | 0.6 | 16.5 | 0% | - | 11 s | 1.13 |
| Torch Bandit (banditTorch) | 3 | 5 (15) | 2.4 | 2.1 | 26 | 0% | - | 10.6 s | 1.07 |
| Ent (ent) | 9 | 2 (18) | 2.2 | 1.6 | 41.9 | 0% | - | 21.8 s | 1 |
| Greatsword Bandit (banditGreat) | 4 | 4 (16) | 2.2 | 1.4 | 26.3 | 0% | - | 12.5 s | 1 |
| Dire Wolf (direWolf) | 4 | 4 (16) | 2.1 | 1.3 | 23.3 | 0% | - | 8.6 s | 0.97 |
| Bandit Brute (banditBrute) | 7 | 2 (14) | 2.1 | 2.5 | 37.6 | 0% | - | 16.5 s | 0.94 |
| Spear Bandit (banditSpear) | 3 | 5 (15) | 2 | 1.3 | 26 | 0% | - | 9.6 s | 0.9 |
| Slime (slime) | 2 | 8 (16) | 1.9 | 1.3 | 66.5 | 0% | - | 24.3 s | 0.85 |
| Goblin (goblin) | 2 | 8 (16) | 1.2 | 0.3 | 16.5 | 0% | - | 5.4 s | 0.56 |
| Wolf (wolf) | 2 | 8 (16) | 1.2 | 0.5 | 19.5 | 0% | - | 8.4 s | 0.55 |
| Thornback Boar (boar) | 5 | 3 (15) | 1.2 | 0.8 | 26.4 | 0% | - | 10.3 s | 0.52 |
| Sproutling (sproutling) | 1.5 | 11 (16.5) | 0.4 | 0.4 | 20.1 | 0% | - | 6.9 s | 0.2 **low** |
| Wisp (wisp) | 3 | 5 (15) | 0 | 0 | 13 | 0% | - | 17.8 s | 0 **low** |

### The Warren

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Frost Shaman (frostShaman) | 5 | 3 (15) | 6.9 | 2.2 | 40.9 | 0% | - | 22.4 s | 3.54 **high** |
| Orc Shaman (orcShaman) | 5 | 3 (15) | 5.4 | 3.7 | 18 | 0% | - | 13.8 s | 2.77 **high** |
| Spear Goblin (goblinSpear) | 2 | 8 (16) | 4.7 | 3.1 | 16.5 | 0% | - | 15.2 s | 2.38 **high** |
| Rock Troll (rockTroll) | 9 | 2 (18) | 4 | 2.7 | 46.6 | 0% | - | 62.9 s | 2.02 **high** |
| Wolf Rider (wolfRider) | 5 | 3 (15) | 3.3 | 2 | 28 | 0% | - | 19.6 s | 1.7 |
| Ogre (ogre) | 8 | 2 (16) | 2 | 1.8 | 30 | 0% | - | 14.2 s | 1.03 |
| Troll (troll) | 8 | 2 (16) | 2 | 1.3 | 39.9 | 0% | - | 38 s | 1.02 |
| Hobgoblin (hobgoblin) | 3 | 5 (15) | 1.9 | 1.2 | 47.1 | 0% | - | 14 s | 0.98 |
| Orc (orc) | 5 | 3 (15) | 1.9 | 1 | 27 | 0% | - | 11 s | 0.97 |
| Mouse (mouse) | 0.8 | 20 (16) | 1.6 | 0.3 | 22.5 | 0% | - | 10.5 s | 0.82 |
| Suicide Bomber (goblinSuicide) | 2.5 | 6 (15) | 0.5 | 0 | 11.8 | 0% | - | 6.9 s | 0.24 **low** |
| Dynamite Mouse (dynamouse) | 1.5 | 11 (16.5) | 0.4 | 0 | 10.3 | 0% | - | 8.4 s | 0.2 **low** |
| Goblin Bomber (goblinBomber) | 2.5 | 6 (15) | 0.4 | 0 | 13.2 | 0% | - | 28 s | 0.18 **low** |
| Drummer (drummer) | 3 | 5 (15) | 0 | 0 | 15 | 0% | - | 30.9 s | 0 **low** |

### The Sewers

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Green Crab (crabGreen) | 3.5 | 5 (17.5) | 19.1 | 8.5 | 47.9 | 31% | 27.9 s | 33.1 s | 8.35 **high** |
| Rat King (ratKing) | 8 | 2 (16) | 10.7 | 9.5 | 70.8 | 25% | 30.9 s | 18.5 s | 4.66 **high** |
| Blue Crab (crabBlue) | 3 | 5 (15) | 7.3 | 2.6 | 52.7 | 9% | 63.4 s | 41 s | 3.17 **high** |
| Hunter Spider (spiderHunter) | 3 | 5 (15) | 5.8 | 1.5 | 20 | 0% | - | 9.1 s | 2.55 **high** |
| Plague Rat (ratPlague) | 1.3 | 12 (15.6) | 5.3 | 0.5 | 20.6 | 0% | - | 7 s | 2.3 **high** |
| Blood Leech (leechBlood) | 2 | 8 (16) | 3.5 | 1.1 | 18.5 | 0% | - | 6.3 s | 1.53 |
| Croc (croc) | 6 | 3 (18) | 2.3 | 1.2 | 27.5 | 0% | - | 15.2 s | 1 |
| Sewer Crab (crab) | 3 | 5 (15) | 2.3 | 2.3 | 63.5 | 0% | - | 28.4 s | 1 |
| Lizard Blade (lizardBlade) | 3 | 5 (15) | 2.3 | 1 | 26 | 0% | - | 11.1 s | 0.99 |
| Rat (rat) | 1 | 16 (16) | 1.6 | 0.6 | 27 | 0% | - | 9.3 s | 0.69 |
| Sludge Slime (slimeSludge) | 3 | 5 (15) | 1.4 | 0.8 | 42.9 | 0% | - | 13.7 s | 0.62 |
| Lizardman (lizardman) | 5 | 3 (15) | 1.2 | 1 | 19.2 | 0% | - | 8.8 s | 0.54 |
| Fire Slime (fireSlime) | 4 | 4 (16) | 0.7 | 0.5 | 18.8 | 0% | - | 11.1 s | 0.3 **low** |
| Slimelet (slimeSmall) | 1 | 16 (16) | 0.5 | 0.1 | 24 | 0% | - | 11.3 s | 0.2 **low** |
| Brain Leech (leechBrain) | 3 | 5 (15) | 0 | 0 | 12 | 0% | - | 4.3 s | 0 **low** |

### The Crypt

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Golden Skeleton (rattlerGold) | 5 | 3 (15) | 9.6 | 5.4 | 34.1 | 19% | 14.2 s | 17.9 s | 5.44 **high** |
| Bone Archer (rattlerBow) | 3 | 5 (15) | 5.2 | 2.2 | 18 | 0% | - | 15.1 s | 2.96 **high** |
| Brute (brute) | 7 | 2 (14) | 3 | 2.2 | 55.2 | 0% | - | 20.3 s | 1.67 |
| Harrowing Skeleton (rattlerHarrow) | 4 | 4 (16) | 2.3 | 1.7 | 33.8 | 0% | - | 16 s | 1.28 |
| Banshee (banshee) | 5 | 3 (15) | 1.9 | 6.7 | 18 | 0% | - | 31.3 s | 1.09 |
| Bone Spear (rattlerSpear) | 3 | 5 (15) | 1.6 | 1.2 | 23 | 0% | - | 9.9 s | 0.91 |
| Gaper (gaper) | 6 | 3 (18) | 1.4 | 0.9 | 22.5 | 0% | - | 12.8 s | 0.8 |
| Loose Jaw (rattlerMace) | 4 | 4 (16) | 1.1 | 0.6 | 22.5 | 0% | - | 9.4 s | 0.61 |
| Rattler (rattler) | 3 | 5 (15) | 1.1 | 0.5 | 25 | 0% | - | 10.3 s | 0.6 |
| Ghost (ghost) | 3 | 5 (15) | 0.6 | 0.4 | 20 | 0% | - | 7.5 s | 0.36 **low** |

### The Frost Hollow

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Yeti (yeti) | 8 | 2 (16) | 4.8 | 5.6 | 33.8 | 0% | - | 26.3 s | 4.22 **high** |
| Snowman (snowman) | 4 | 4 (16) | 3.7 | 0.6 | 21 | 0% | - | 17.3 s | 3.18 **high** |
| Frost Wolf (frostWolf) | 2.5 | 6 (15) | 2 | 0.4 | 18 | 0% | - | 7.1 s | 1.75 |
| Frost Spider (spiderFrost) | 3 | 5 (15) | 1.9 | 0.6 | 20 | 0% | - | 8.1 s | 1.65 |
| Momma Spider (spiderMomma) | 6 | 3 (18) | 1.1 | 0.4 | 22.5 | 0% | - | 21.7 s | 1 |
| Ice Slime (slimeIce) | 3 | 5 (15) | 1.1 | 0.6 | 27 | 0% | - | 12.6 s | 0.93 |
| Cave Bat (bat) | 2 | 8 (16) | 1 | 0.3 | 16.8 | 0% | - | 6 s | 0.9 |
| Icicle Wraith (frostWraith) | 4 | 4 (16) | 0.9 | 0 | 16.5 | 0% | - | 29.4 s | 0.76 |
| Frost Spirit (spiritFrost) | 2.5 | 6 (15) | 0.1 | 0.3 | 18 | 0% | - | 13 s | 0.12 **low** |

### The Ember Deep

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Imp (imp) | 2 | 8 (16) | 9.1 | 4.4 | 19.5 | 6% | 54.5 s | 24.8 s | 5.06 **high** |
| Hellhound (hellhound) | 3 | 5 (15) | 8 | 2.1 | 20 | 6% | 10.8 s | 8.9 s | 4.47 **high** |
| Fire Spider (spiderFire) | 3.5 | 5 (17.5) | 4.7 | 1.9 | 17.1 | 0% | - | 8.8 s | 2.65 **high** |
| Succubus (succubus) | 5 | 3 (15) | 2 | 18.8 | 18 | 0% | - | 13 s | 1.12 |
| Demon (demon) | 8 | 2 (16) | 1.8 | 1.6 | 28.1 | 0% | - | 16.4 s | 1 |
| Dragonborn (dragonborn) | 7 | 2 (14) | 1.8 | 1.4 | 23.6 | 0% | - | 11.6 s | 0.99 |
| Devil (devil) | 5 | 3 (15) | 1.5 | 0.9 | 21 | 0% | - | 10.7 s | 0.84 |
| Cinder Bat (cinderBat) | 2 | 8 (16) | 1.1 | 0.9 | 11.4 | 0% | - | 3.1 s | 0.6 |
| Fire Spirit (spiritFire) | 2.5 | 6 (15) | 0.9 | 0.3 | 18 | 0% | - | 12.4 s | 0.48 **low** |

### The Gilded Spire

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Gilded Golem (gildedGolem) | 9 | 2 (18) | 67.3 | 80.4 | 56.6 | 69% | 56.9 s | 71.1 s | 28.38 **high** |
| Cherub (cherub) | 2 | 8 (16) | 10.1 | 3.2 | 18 | 16% | 29.7 s | 30.5 s | 4.27 **high** |
| Seraph (seraph) | 5 | 3 (15) | 6.6 | 3.2 | 18 | 0% | - | 22.2 s | 2.8 **high** |
| Golem (golem) | 8 | 2 (16) | 6 | 4.7 | 67 | 0% | - | 31.2 s | 2.52 **high** |
| Angel (angel) | 5 | 3 (15) | 2.5 | 1.3 | 24 | 0% | - | 11.6 s | 1.06 |
| Fallen Angel (angelFallen) | 5 | 3 (15) | 2.2 | 1.1 | 24 | 0% | - | 9.3 s | 0.94 |
| Sun Blade (sunBlade) | 4 | 4 (16) | 0.7 | 0.7 | 17.3 | 0% | - | 16.8 s | 0.28 **low** |
| Choir Sprite (choirSprite) | 3.5 | 5 (17.5) | 0 | 0 | 18.4 | 0% | - | 24.4 s | 0 **low** |
| Light Spirit (spiritHeal) | 2.5 | 6 (15) | 0 | 0 | 18 | 0% | - | 12.5 s | 0 **low** |
| Ward Spirit (spiritWard) | 2.5 | 6 (15) | 0 | 0 | 18 | 0% | - | 13.1 s | 0 **low** |

### The Sunken Dunes

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Cobra (cobra) | 3.5 | 5 (17.5) | 28.4 | 12.1 | 17.1 | 44% | 37.6 s | 27.1 s | 12.46 **high** |
| Dart Trap (dartTrap) | 3 | 5 (15) | 12.8 | 5.5 | 30 | 9% | 32.7 s | 20.1 s | 5.62 **high** |
| Sand Mage (sandMage) | 5 | 3 (15) | 7.6 | 2.9 | 70.9 | 9% | 54.9 s | 53.2 s | 3.33 **high** |
| Jackal Guard (jackal) | 5 | 3 (15) | 3.9 | 3.3 | 41.7 | 0% | - | 16.1 s | 1.71 |
| Sand Serpent (sandSerpent) | 7 | 2 (14) | 2.5 | 1.4 | 32.1 | 0% | - | 7.1 s | 1.09 |
| Mummy (mummy) | 6 | 3 (18) | 2.1 | 1 | 27.5 | 0% | - | 12.5 s | 0.91 |
| Golden Scarab (scarabGold) | 2.5 | 6 (15) | 1.6 | 0.7 | 35.5 | 0% | - | 19 s | 0.68 |
| Scarab (scarab) | 1.5 | 11 (16.5) | 0.9 | 0.5 | 22.1 | 0% | - | 12 s | 0.4 **low** |
| Venom Spirit (spiritPoison) | 2.5 | 6 (15) | 0.8 | 0.2 | 18 | 0% | - | 11.8 s | 0.34 **low** |
| Wind Spirit (spiritHaste) | 2.5 | 6 (15) | 0 | 0 | 18 | 0% | - | 11.9 s | 0 **low** |

### The Clockwork Foundry

| kind | cost | pack (cost) | threat per cost (pack) | threat per cost (alone) | toughness per cost | hero down | time to down (median) | time to clear (median) | vs dungeon median |
|---|---|---|---|---|---|---|---|---|---|
| Steam Turret (turretSteam) | 3.5 | 5 (17.5) | 22.2 | 3.4 | 37.6 | 47% | 39.9 s | 41.6 s | 10.17 **high** |
| Steel Wasp (waspSteel) | 3 | 5 (15) | 7.1 | 17.3 | 31 | 9% | 71.7 s | 32.6 s | 3.26 **high** |
| Steel Hornet (hornetSteel) | 4.9 | 3 (14.7) | 7.1 | 10.8 | 27.3 | 13% | 59.4 s | 22.1 s | 3.24 **high** |
| Bronze Wasp (waspBronze) | 2.2 | 7 (15.4) | 6.3 | 13.8 | 24.1 | 9% | 63.6 s | 23.9 s | 2.87 **high** |
| Gas Mortar (mortarPoison) | 4.5 | 4 (18) | 6 | 0.4 | 31.1 | 0% | - | 16.1 s | 2.74 **high** |
| Foundry Smith (foundrySmith) | 8 | 2 (16) | 5.8 | 6 | 40 | 0% | - | 25.5 s | 2.66 **high** |
| Bronze Hornet (hornetBronze) | 3.6 | 4 (14.4) | 4.9 | 7.1 | 21.1 | 3% | 98.7 s | 18.4 s | 2.26 **high** |
| Fire Mortar (mortarFire) | 4.5 | 4 (18) | 4.8 | 1.2 | 32.3 | 6% | 26.2 s | 21.8 s | 2.21 **high** |
| Flame Turret (turretFlame) | 3.5 | 5 (17.5) | 4.3 | 2.9 | 40.3 | 0% | - | 27.4 s | 1.98 |
| Copper Wasp (wasp) | 1.6 | 10 (16) | 4 | 12.3 | 16.9 | 0% | - | 18.9 s | 1.85 |
| Gun Turret (turretGun) | 3.5 | 5 (17.5) | 2.9 | 1.6 | 33.3 | 0% | - | 19 s | 1.34 |
| Steel Bee (beeSteel) | 2.3 | 7 (16.1) | 2.8 | 1.8 | 32.1 | 0% | - | 11.8 s | 1.28 |
| Tesla Coil (teslaCoil) | 4.5 | 4 (18) | 2.7 | 1.3 | 26.7 | 0% | - | 16.3 s | 1.23 |
| Cog Sprite (cogSprite) | 2.4 | 7 (16.8) | 2.2 | 1 | 29.6 | 0% | - | 22.3 s | 1 |
| Drill Bot (drillBot) | 3.5 | 5 (17.5) | 1.9 | 1.2 | 26.7 | 0% | - | 14.9 s | 0.86 |
| Bronze Bee (beeBronze) | 1.7 | 9 (15.3) | 1.7 | 1 | 23.5 | 0% | - | 9.1 s | 0.77 |
| Automaton (automaton) | 6 | 3 (18) | 1.4 | 0.8 | 33.3 | 0% | - | 14.3 s | 0.63 |
| Copper Bee (bee) | 1.2 | 13 (15.6) | 1.1 | 0.4 | 17.5 | 0% | - | 7.7 s | 0.52 |
| Chain Crawler (chainCrawler) | 8 | 2 (16) | 1.1 | 0.8 | 48.6 | 0% | - | 6.5 s | 0.5 |
| Gear Sprite (gearSprite) | 2 | 8 (16) | 0.7 | 0.3 | 29.9 | 0% | - | 40 s | 0.33 **low** |
| Auto Bomb Bot (autoBomb) | 3 | 5 (15) | 0.6 | 0.5 | 14.2 | 0% | - | 5.3 s | 0.28 **low** |
| Bomb Bot (bombBot) | 2.5 | 6 (15) | 0.6 | 0.3 | 14.2 | 0% | - | 2.6 s | 0.25 **low** |
| Mortar (mortar) | 4 | 4 (16) | 0.3 | 0.1 | 34.8 | 0% | - | 17.3 s | 0.13 **low** |
| Storm Spirit (spiritShock) | 2.5 | 6 (15) | 0.2 | 0.3 | 18 | 0% | - | 13.3 s | 0.07 **low** |
| Laser Turret (turretLaser) | 4 | 4 (16) | 0.1 | 0 | 30.8 | 0% | - | 15.4 s | 0.07 **low** |
| Saw Blade (sawBlade) | 2.5 | 6 (15) | 0 | 0 | 0 | 0% | - | 0 s | 0 **low** |
| Repair Drone (repairDrone) | 3 | 5 (15) | 0 | 0 | 19.8 | 0% | - | 20.9 s | 0 **low** |

## 3b. In a mixed group

3384 fights, 12 seeds, rank 0. A plain group of the dungeon's partner kind (about 12 cost points) against the paladin and the archer at tier I (kept on their feet), with and without about 4 points of the kind added. **Added threat per cost** = the extra toll it brings, per cost point. The yardstick is what 4 more points of the partner kind itself add. This is where the helpers (spirits, drummers, healers) show: alone against a hero they do almost nothing.

### The Wildwood (partner: Bandit (bandit) x4; yardstick 5.4 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Poison Slime (slimePoison) | 3 | 1 (3) | 41.3 | -1.4 | 20 | 3.7 |
| Poacher (poacher) | 4 | 1 (4) | 11.8 | 16.3 | 14.1 | 2.61 |
| Knife Bandit (banditDagger) | 3 | 1 (3) | 28.5 | -1.2 | 13.7 | 2.54 |
| Torch Bandit (banditTorch) | 3 | 1 (3) | 17.9 | 5.1 | 11.5 | 2.13 |
| Axe Bandit (banditAxe) | 4 | 1 (4) | 11.4 | 6.9 | 9.2 | 1.7 |
| Bandit Brute (banditBrute) | 7 | 1 (7) | 7.1 | 5.2 | 6.2 | 1.15 |
| Big Slime (slimeBig) | 5 | 1 (5) | 11.9 | 0.2 | 6.1 | 1.13 |
| Orange Goblin (goblinOrange) | 2 | 2 (4) | 5.6 | 5.2 | 5.4 | 1 |
| Bandit (bandit) | 3 | 1 (3) | 8.6 | 2.2 | 5.4 | 1 |
| Slime (slime) | 2 | 2 (4) | 9.4 | 0.5 | 5 | 0.93 |
| Dire Wolf (direWolf) | 4 | 1 (4) | 5.7 | 3.7 | 4.7 | 0.87 |
| Goblin (goblin) | 2 | 2 (4) | 4.8 | 2.3 | 3.6 | 0.67 |
| Ent (ent) | 9 | 1 (9) | 6.4 | 0.1 | 3.3 | 0.61 |
| Sproutling (sproutling) | 1.5 | 3 (4.5) | -1.5 | 7.4 | 3 | 0.56 |
| Greatsword Bandit (banditGreat) | 4 | 1 (4) | 8.3 | -2.5 | 2.9 | 0.54 |
| Thornback Boar (boar) | 5 | 1 (5) | 4.1 | 1.5 | 2.8 | 0.52 |
| Spear Bandit (banditSpear) | 3 | 1 (3) | 8.4 | -3.9 | 2.3 | 0.43 |
| Wolf (wolf) | 2 | 2 (4) | 2.4 | 0.3 | 1.3 | 0.24 |
| Wisp (wisp) | 3 | 1 (3) | 0.1 | -4.4 | -2.2 | -0.41 |

### The Warren (partner: Hobgoblin (hobgoblin) x4; yardstick 4.2 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Orc Shaman (orcShaman) | 5 | 1 (5) | 29.9 | 2.9 | 16.4 | 3.9 |
| Spear Goblin (goblinSpear) | 2 | 2 (4) | 17.7 | 8.6 | 13.2 | 3.14 |
| Frost Shaman (frostShaman) | 5 | 1 (5) | 15.8 | 4.9 | 10.4 | 2.48 |
| Wolf Rider (wolfRider) | 5 | 1 (5) | 8.1 | 2.7 | 5.4 | 1.29 |
| Orc (orc) | 5 | 1 (5) | 9.2 | 0.2 | 4.7 | 1.12 |
| Ogre (ogre) | 8 | 1 (8) | 8.2 | 0.6 | 4.4 | 1.05 |
| Rock Troll (rockTroll) | 9 | 1 (9) | 3.7 | 4.5 | 4.1 | 0.98 |
| Goblin Bomber (goblinBomber) | 2.5 | 2 (5) | -0.1 | 6.8 | 3.4 | 0.81 |
| Hobgoblin (hobgoblin) | 3 | 1 (3) | 6.4 | -0.2 | 3.1 | 0.74 |
| Dynamite Mouse (dynamouse) | 1.5 | 3 (4.5) | 1.9 | 2.2 | 2.1 | 0.5 |
| Troll (troll) | 8 | 1 (8) | 1.6 | 2.2 | 1.9 | 0.45 |
| Drummer (drummer) | 3 | 1 (3) | 2.6 | 1 | 1.8 | 0.43 |
| Mouse (mouse) | 0.8 | 5 (4) | 0.1 | 3.2 | 1.7 | 0.4 |
| Suicide Bomber (goblinSuicide) | 2.5 | 2 (5) | 1 | -0.1 | 0.5 | 0.12 |

### The Sewers (partner: Lizard Blade (lizardBlade) x4; yardstick 4.3 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Green Crab (crabGreen) | 3.5 | 1 (3.5) | 60.3 | 5.5 | 32.9 | 7.65 |
| Rat King (ratKing) | 8 | 1 (8) | 39.1 | 8.6 | 23.9 | 5.56 |
| Plague Rat (ratPlague) | 1.3 | 3 (3.9) | 38.3 | 7.6 | 23 | 5.35 |
| Hunter Spider (spiderHunter) | 3 | 1 (3) | 35.3 | 7.3 | 21.3 | 4.95 |
| Blood Leech (leechBlood) | 2 | 2 (4) | 9.8 | 7 | 8.4 | 1.95 |
| Blue Crab (crabBlue) | 3 | 1 (3) | 11.3 | 4 | 7.7 | 1.79 |
| Sewer Crab (crab) | 3 | 1 (3) | 6.4 | 5.9 | 6.2 | 1.44 |
| Croc (croc) | 6 | 1 (6) | 7 | 2.5 | 4.8 | 1.12 |
| Lizard Blade (lizardBlade) | 3 | 1 (3) | 6.4 | 2.4 | 4.4 | 1.02 |
| Lizardman (lizardman) | 5 | 1 (5) | 5.4 | 2.1 | 3.8 | 0.88 |
| Rat (rat) | 1 | 4 (4) | 1.4 | 5.9 | 3.7 | 0.86 |
| Sludge Slime (slimeSludge) | 3 | 1 (3) | 5.3 | 0.5 | 2.9 | 0.67 |
| Fire Slime (fireSlime) | 4 | 1 (4) | 0.9 | 0.5 | 0.7 | 0.16 |
| Slimelet (slimeSmall) | 1 | 4 (4) | 1.1 | -0.2 | 0.5 | 0.12 |
| Brain Leech (leechBrain) | 3 | 1 (3) | -1.4 | 1.3 | 0 | 0 |

### The Crypt (partner: Rattler (rattler) x4; yardstick 3.3 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Golden Skeleton (rattlerGold) | 5 | 1 (5) | 12.1 | 17.2 | 14.7 | 4.45 |
| Bone Archer (rattlerBow) | 3 | 1 (3) | 6.6 | 6.9 | 6.8 | 2.06 |
| Bone Spear (rattlerSpear) | 3 | 1 (3) | 5.9 | 3.4 | 4.7 | 1.42 |
| Brute (brute) | 7 | 1 (7) | 8.9 | 0.3 | 4.6 | 1.39 |
| Harrowing Skeleton (rattlerHarrow) | 4 | 1 (4) | 7.2 | 1.4 | 4.3 | 1.3 |
| Rattler (rattler) | 3 | 1 (3) | 6.4 | 0.9 | 3.7 | 1.12 |
| Gaper (gaper) | 6 | 1 (6) | 6.3 | 0.9 | 3.6 | 1.09 |
| Ghost (ghost) | 3 | 1 (3) | 6.3 | 0.5 | 3.4 | 1.03 |
| Loose Jaw (rattlerMace) | 4 | 1 (4) | 5.6 | 0.8 | 3.2 | 0.97 |
| Banshee (banshee) | 5 | 1 (5) | 5.6 | 0.7 | 3.2 | 0.97 |

### The Frost Hollow (partner: Frost Spider (spiderFrost) x4; yardstick 7.1 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Yeti (yeti) | 8 | 1 (8) | 20.3 | 5.4 | 12.9 | 1.82 |
| Frost Wolf (frostWolf) | 2.5 | 2 (5) | 10.4 | 11.7 | 11.1 | 1.56 |
| Icicle Wraith (frostWraith) | 4 | 1 (4) | 9.8 | 9.6 | 9.7 | 1.37 |
| Cave Bat (bat) | 2 | 2 (4) | 5.9 | 12.9 | 9.4 | 1.32 |
| Snowman (snowman) | 4 | 1 (4) | 8 | 5.4 | 6.7 | 0.94 |
| Frost Spider (spiderFrost) | 3 | 1 (3) | 8.3 | 5 | 6.7 | 0.94 |
| Ice Slime (slimeIce) | 3 | 1 (3) | 11.6 | -1.3 | 5.1 | 0.72 |
| Momma Spider (spiderMomma) | 6 | 1 (6) | 4.7 | 3.3 | 4 | 0.56 |
| Frost Spirit (spiritFrost) | 2.5 | 2 (5) | 4.1 | -0.4 | 1.9 | 0.27 |

### The Ember Deep (partner: Hellhound (hellhound) x4; yardstick 32.9 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Hellhound (hellhound) | 3 | 1 (3) | 42.6 | 8.8 | 25.7 | 0.78 |
| Imp (imp) | 2 | 2 (4) | 39.3 | -0.2 | 19.5 | 0.59 |
| Succubus (succubus) | 5 | 1 (5) | 31.6 | 3 | 17.3 | 0.53 |
| Fire Spider (spiderFire) | 3.5 | 1 (3.5) | 24 | 8.7 | 16.4 | 0.5 |
| Devil (devil) | 5 | 1 (5) | 25 | 3.8 | 14.4 | 0.44 |
| Dragonborn (dragonborn) | 7 | 1 (7) | 25 | 1.3 | 13.2 | 0.4 |
| Demon (demon) | 8 | 1 (8) | 25.1 | -0.2 | 12.5 | 0.38 |
| Fire Spirit (spiritFire) | 2.5 | 2 (5) | 6.6 | 1.4 | 4 | 0.12 |
| Cinder Bat (cinderBat) | 2 | 2 (4) | -17.8 | -1.9 | -9.8 | -0.3 |

### The Gilded Spire (partner: Angel (angel) x2; yardstick 5.5 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Gilded Golem (gildedGolem) | 9 | 1 (9) | 31.4 | 242 | 136.7 | 24.85 |
| Cherub (cherub) | 2 | 2 (4) | 12.7 | 13.2 | 13 | 2.36 |
| Seraph (seraph) | 5 | 1 (5) | 10.6 | 7.8 | 9.2 | 1.67 |
| Fallen Angel (angelFallen) | 5 | 1 (5) | 17 | 0.9 | 9 | 1.64 |
| Golem (golem) | 8 | 1 (8) | 16.3 | 0.9 | 8.6 | 1.56 |
| Angel (angel) | 5 | 1 (5) | 8.3 | 1 | 4.7 | 0.85 |
| Light Spirit (spiritHeal) | 2.5 | 2 (5) | 8 | 1.3 | 4.7 | 0.85 |
| Ward Spirit (spiritWard) | 2.5 | 2 (5) | 8.2 | 0.6 | 4.4 | 0.8 |
| Choir Sprite (choirSprite) | 3.5 | 1 (3.5) | 7.2 | 1.2 | 4.2 | 0.76 |
| Sun Blade (sunBlade) | 4 | 1 (4) | 2.4 | 3.3 | 2.8 | 0.51 |

### The Sunken Dunes (partner: Jackal Guard (jackal) x2; yardstick 7.1 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Cobra (cobra) | 3.5 | 1 (3.5) | 115.5 | 4.3 | 59.9 | 8.44 |
| Dart Trap (dartTrap) | 3 | 1 (3) | 71.8 | 5.2 | 38.5 | 5.42 |
| Venom Spirit (spiritPoison) | 2.5 | 2 (5) | 51.7 | -0.1 | 25.8 | 3.63 |
| Sand Serpent (sandSerpent) | 7 | 1 (7) | 31 | 4.4 | 17.7 | 2.49 |
| Sand Mage (sandMage) | 5 | 1 (5) | 6.8 | 11.9 | 9.4 | 1.32 |
| Jackal Guard (jackal) | 5 | 1 (5) | 12 | 4.7 | 8.4 | 1.18 |
| Mummy (mummy) | 6 | 1 (6) | 10 | 1 | 5.5 | 0.77 |
| Golden Scarab (scarabGold) | 2.5 | 2 (5) | 3.8 | 2.6 | 3.2 | 0.45 |
| Wind Spirit (spiritHaste) | 2.5 | 2 (5) | 2 | 2.3 | 2.2 | 0.31 |
| Scarab (scarab) | 1.5 | 3 (4.5) | 3 | 1 | 2 | 0.28 |

### The Clockwork Foundry (partner: Automaton (automaton) x2; yardstick 2.4 a point)

| kind | cost | added (cost) | added per cost v paladin | v archer | added per cost | vs yardstick |
|---|---|---|---|---|---|---|
| Flame Turret (turretFlame) | 3.5 | 1 (3.5) | 32.9 | 0.2 | 16.6 | 6.92 |
| Steam Turret (turretSteam) | 3.5 | 1 (3.5) | 25.6 | 4.1 | 14.9 | 6.21 |
| Gas Mortar (mortarPoison) | 4.5 | 1 (4.5) | 22.6 | 3.9 | 13.3 | 5.54 |
| Foundry Smith (foundrySmith) | 8 | 1 (8) | 22.6 | 1.8 | 12.2 | 5.08 |
| Steel Hornet (hornetSteel) | 4.9 | 1 (4.9) | 17.6 | 3 | 10.3 | 4.29 |
| Bronze Wasp (waspBronze) | 2.2 | 2 (4.4) | 13.5 | 3.8 | 8.7 | 3.63 |
| Steel Wasp (waspSteel) | 3 | 1 (3) | 13.5 | 3.1 | 8.3 | 3.46 |
| Bronze Hornet (hornetBronze) | 3.6 | 1 (3.6) | 14.2 | 1.4 | 7.8 | 3.25 |
| Gun Turret (turretGun) | 3.5 | 1 (3.5) | 9.7 | 2.6 | 6.1 | 2.54 |
| Copper Wasp (wasp) | 1.6 | 3 (4.8) | 10.1 | 1 | 5.6 | 2.33 |
| Tesla Coil (teslaCoil) | 4.5 | 1 (4.5) | 4.2 | 4.9 | 4.6 | 1.92 |
| Steel Bee (beeSteel) | 2.3 | 2 (4.6) | 5.4 | 3.3 | 4.4 | 1.83 |
| Drill Bot (drillBot) | 3.5 | 1 (3.5) | 6.1 | 2.4 | 4.3 | 1.79 |
| Cog Sprite (cogSprite) | 2.4 | 2 (4.8) | 5.9 | 2.5 | 4.2 | 1.75 |
| Fire Mortar (mortarFire) | 4.5 | 1 (4.5) | 7.4 | 0.4 | 3.9 | 1.63 |
| Chain Crawler (chainCrawler) | 8 | 1 (8) | 4.6 | 2.7 | 3.7 | 1.54 |
| Repair Drone (repairDrone) | 3 | 1 (3) | 4.8 | 1.2 | 3 | 1.25 |
| Automaton (automaton) | 6 | 1 (6) | 4.6 | 0.6 | 2.6 | 1.08 |
| Bronze Bee (beeBronze) | 1.7 | 2 (3.4) | 2.2 | 2.7 | 2.5 | 1.04 |
| Gear Sprite (gearSprite) | 2 | 2 (4) | 2.2 | 1.9 | 2.1 | 0.88 |
| Bomb Bot (bombBot) | 2.5 | 2 (5) | 3.6 | 0.2 | 1.9 | 0.79 |
| Auto Bomb Bot (autoBomb) | 3 | 1 (3) | 0.6 | 2.5 | 1.6 | 0.67 |
| Laser Turret (turretLaser) | 4 | 1 (4) | 2.1 | 0.9 | 1.5 | 0.63 |
| Copper Bee (bee) | 1.2 | 3 (3.6) | 0.5 | 0.8 | 0.7 | 0.29 |
| Saw Blade (sawBlade) | 2.5 | 2 (5) | 0.3 | 0.5 | 0.4 | 0.17 |
| Storm Spirit (spiritShock) | 2.5 | 2 (5) | 0.6 | 0.1 | 0.4 | 0.17 |
| Mortar (mortar) | 4 | 1 (4) | -0.6 | 0.2 | -0.2 | -0.08 |

## 4. Each enemy's own moves

A move "fires" when its clock is reset inside the brain (every due() move by its own name; a home-made clock by the field it keeps, named below where it is clear). Fires are per minute of that kind being alive. "Damage" is the share of everything the kind did (its own blows, its moves, what it made, the statuses it put on). Scenarios: 1v1 in its dungeon; cost-matched groups; in a mixed group v a hero; alone v 8 goblins; v the archer; v paladin, berserker, pyromancer. "Never fired" lists moves its code has (due() timers, from the source) or that it armed in a fight but that went off in none of them.

### The Wildwood

**Wolf (wolf)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 27.4 |  | 25.2 | 24.5 | 6.8 | 15.6 | 76% |
| lunge | 9.8 |  | 10.4 | 8.2 | 11.5 | 12.3 | 21% |
| its own strike (the brain sets the attack clock) (atkT) | 9.3 |  | 8.6 | 8.2 | 10.2 | 9.3 | 2% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| howl | 0 |  | 0 | 0 | 5.4 | 6.2 | 0% |
| focusT | 0 |  | 0 | 0 | 3.2 | 3.8 | 0% |

**Slime (slime)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 14 |  | 6.2 | 25.6 | 0 | 8.1 | 64% |
| made: slimeSmall |  |  |  |  |  |  | 35% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Goblin (goblin)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 35.4 |  | 37.2 | 42.6 | 10.9 | 21.5 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| dash (sim ability) | 11.7 |  | 9.4 | 3.9 | 14.3 | 12.9 | 0% |

**Orange Goblin (goblinOrange)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 39.1 |  | 27.7 | 40.2 | 17.7 | 25.1 | 100% |
| dash (sim ability) | 11.3 |  | 12.4 | 10.7 | 13.8 | 13.3 | 0% |

**Big Slime (slimeBig)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 20.8 |  | 10 | 29.9 | 0.1 | 18 | 61% |
| made: slime |  |  |  |  |  |  | 18% |
| spit | 13.3 |  | 10.3 | 14.2 | 12.5 | 12.7 | 12% |
| made: slimeSmall |  |  |  |  |  |  | 8% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Poison Slime (slimePoison)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 60% |
| basic attack | 14.4 |  | 7 | 21.5 | 0 | 12 | 33% |
| made: slimeletPoison |  |  |  |  |  |  | 7% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Bandit (bandit)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 26.6 |  | 15.7 | 30.7 | 1.1 | 22 | 77% |
| bash | 6.8 |  | 4.7 | 8.8 | 1.1 | 6.5 | 16% |
| knocked into a wall |  |  |  |  |  |  | 6% |

**Knife Bandit (banditDagger)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 53.7 |  | 45.3 | 59.9 | 7.8 | 39.2 | 54% |
| status: poison |  |  |  |  |  |  | 45% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| dash (sim ability) | 9.8 |  | 10 | 0 | 14.5 | 10.5 | 0% |

**Spear Bandit (banditSpear)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 28.2 |  | 19.9 | 32.9 | 1.7 | 22.4 | 78% |
| lunge | 8.6 |  | 7.9 | 10.1 | 7.9 | 10.4 | 20% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| its own strike (the brain sets the attack clock) (atkT) | 7.6 |  | 7 | 7.6 | 6.8 | 8 | 1% |

**Torch Bandit (banditTorch)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: burn |  |  |  |  |  |  | 46% |
| basic attack | 22 |  | 13.8 | 30.2 | 0.8 | 16.5 | 45% |
| torch | 7.6 |  | 6.2 | 11 | 3.1 | 6.8 | 8% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Axe Bandit (banditAxe)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 29.2 |  | 21.1 | 35 | 3.5 | 24.5 | 86% |
| axe | 29.7 |  | 29.5 | 8.7 | 10.1 | 23.7 | 14% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Greatsword Bandit (banditGreat)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 17.9 |  | 9.7 | 24.2 | 0.9 | 16.1 | 77% |
| sweep | 6.7 |  | 5 | 7.6 | 2.7 | 6.6 | 21% |
| knocked into a wall |  |  |  |  |  |  | 3% |

**Poacher (poacher)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 36.6 |  | 34.1 | 37.5 | 31.7 | 35.5 | 89% |
| net | 11 |  | 10.2 | 8.3 | 10.3 | 10.6 | 11% |

**Bandit Brute (banditBrute)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 16.5 |  | 9.9 | 25.1 | 0.4 | 19 | 69% |
| slam | 6.1 |  | 4.8 | 6.7 | 1.3 | 5.7 | 27% |
| knocked into a wall |  |  |  |  |  |  | 3% |

**Ent (ent)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 16.3 |  | 10.8 | 24.3 | 0.1 | 20.9 | 85% |
| roots | 8.5 |  | 8.5 | 8.8 | 8.8 | 8.9 | 11% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| status: entangle |  |  |  |  |  |  | 1% |
| sproutCd | 0 |  | 1.7 | 0.7 | 5.2 | 3.8 | 0% |
| sp | 0 |  | 0 | 0 | 0 | 0 | 0% |
| dash | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Sproutling (sproutling)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| dash | 15.9 |  | 12.3 | 20.7 | 7.6 | 17.8 | 78% |
| sp.shotT | 7 |  | 3.3 | 0 | 7.4 | 1.1 | 19% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 1% |
| sp.rootCd | 0.2 |  | 0 | 0 | 0.2 | 0 | 0% |
| sp | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Wisp (wisp)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| mend | 99 |  | 97.1 | 93.3 | 86.5 | 94.4 | - |
| blink | 75.6 |  | 115.6 | 21.7 | 116.1 | 82.1 | - |

**Dire Wolf (direWolf)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 31.4 |  | 26.4 | 33 | 7.9 | 23.7 | 72% |
| lunge | 9.3 |  | 9.5 | 7.1 | 11.9 | 11 | 19% |
| pin | 5.1 |  | 6.9 | 7.1 | 11.5 | 7.1 | 8% |
| its own strike (the brain sets the attack clock) (atkT) | 8.8 |  | 9.1 | 7.1 | 10.1 | 9.1 | 1% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| howl | 0 |  | 0 | 0 | 4.3 | 4.5 | 0% |
| focusT | 0 |  | 0 | 0 | 3 | 3.5 | 0% |

**Thornback Boar (boar)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 26.5 |  | 20.6 | 28.8 | 0 | 24.1 | 86% |
| charge | 3.7 |  | 4.4 | 4.8 | 9.8 | 3.3 | 12% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| its own strike (the brain sets the attack clock) (atkT) | 2.9 |  | 2.8 | 4.8 | 7.6 | 2.1 | 0% |

### The Warren

**Mouse (mouse)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 15 |  | 17.2 | 35.2 | 7.9 | 14.5 | 96% |
| knocked into a wall |  |  |  |  |  |  | 4% |
| dash (sim ability) | 14.5 |  | 13.5 | 0 | 13.2 | 13.2 | 0% |

**Spear Goblin (goblinSpear)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| spear | 20.8 |  | 20.4 | 18.1 | 17.6 | 19.5 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 0% |
| dash (sim ability) | 1.1 |  | 1.8 | 0 | 2.9 | 1.8 | 0% |

**Goblin Bomber (goblinBomber)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| bomb | 16.3 |  | 15.9 | 11.6 | 13.4 | 15.7 | 98% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 1% |
| dash (sim ability) | 0.7 |  | 0.2 | 0 | 0 | 0.2 | 0% |

**Dynamite Mouse (dynamouse)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| on death | 0 |  | 0 | 0 | 0 | 0 | 65% |
| status: burn |  |  |  |  |  |  | 29% |
| knocked into a wall |  |  |  |  |  |  | 6% |
| dash (sim ability) | 5 |  | 7.9 | 0 | 7.1 | 8.5 | 0% |

**Hobgoblin (hobgoblin)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 9.4 |  | 17.3 | 31.7 | 1.1 | 23.5 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Orc (orc)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 8 |  | 12.7 | 28.6 | 1.5 | 19.2 | 78% |
| charge (sim ability) | 5.5 |  | 6.2 | 5.4 | 6 | 5.2 | 18% |
| knocked into a wall |  |  |  |  |  |  | 4% |

**Orc Shaman (orcShaman)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: burn |  |  |  |  |  |  | 69% |
| fireball (sT) | 15.8 |  | 17.6 | 19 | 16.7 | 18.6 | 30% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Wolf Rider (wolfRider)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 16.5 |  | 35.5 | 37.2 | 3.4 | 29.2 | 41% |
| charge | 5.5 |  | 4.9 | 8.3 | 10.3 | 7 | 16% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| made: goblinSpear |  |  |  |  |  |  | 0% |
| its own strike (the brain sets the attack clock) (atkT) | 5.3 |  | 4.6 | 8.3 | 7.4 | 4.8 | 0% |
| spear | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Drummer (drummer)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 100% |
| beat | 115.3 |  | 114.9 | 112.7 | 112.5 | 114.6 | 0% |

**Suicide Bomber (goblinSuicide)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| on death | 0 |  | 0 | 0 | 0 | 0 | 87% |
| status: burn |  |  |  |  |  |  | 13% |

**Frost Shaman (frostShaman)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| ball | 19.3 |  | 18.7 | 17.5 | 16.3 | 19 | 99% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| totem | 4.1 |  | 4.1 | 7 | 5.9 | 3.9 | 0% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Troll (troll)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| boulder | 5.9 |  | 5.5 | 7.6 | 5.1 | 6.2 | 85% |
| knocked into a wall |  |  |  |  |  |  | 9% |
| basic attack | 2.6 |  | 2.9 | 4.2 | 0.6 | 2.3 | 7% |
| recall | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Rock Troll (rockTroll)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| boulder | 6.3 |  | 7 | 7.2 | 7.2 | 6.7 | 86% |
| knocked into a wall |  |  |  |  |  |  | 8% |
| basic attack | 2.2 |  | 2.8 | 6 | 0.9 | 3.8 | 6% |
| chg | 2.5 |  | 3.1 | 2.2 | 3.1 | 2.9 | 0% |
| recall | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Ogre (ogre)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 6.7 |  | 12 | 26.5 | 0.2 | 19.6 | 83% |
| slam (slT) | 4.4 |  | 4.3 | 7.5 | 1.8 | 4.8 | 12% |
| knocked into a wall |  |  |  |  |  |  | 5% |

### The Sewers

**Rat (rat)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 36.1 |  | 18 | 26.7 | 7.2 | 14.7 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| dash (sim ability) | 8.5 |  | 13 | 7.6 | 13.1 | 14.2 | 0% |

**Plague Rat (ratPlague)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 65% |
| basic attack | 35.7 |  | 23.8 | 27.2 | 9.5 | 19.6 | 34% |
| status: burn |  |  |  |  |  |  | 1% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| dash (sim ability) | 9.4 |  | 12.8 | 4.5 | 12.8 | 13.2 | 0% |

**Sludge Slime (slimeSludge)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 29.5 |  | 11.2 | 32.3 | 0 | 12.1 | 73% |
| made: slimeSmall |  |  |  |  |  |  | 25% |
| status: poison |  |  |  |  |  |  | 1% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| status: burn |  |  |  |  |  |  | 0% |

**Slimelet (slimeSmall)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 30.2 |  | 5.3 | 18.5 | 0 | 5.7 | 99% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Blood Leech (leechBlood)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 71% |
| offT | 3.3 |  | 6 | 0 | 3.4 | 5.9 | 27% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| sipT | 1.4 |  | 3.5 | 8.6 | 4.1 | 6.3 | 0% |
| latchT | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Lizard Blade (lizardBlade)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 43.2 |  | 25.7 | 38.6 | 5.8 | 27.2 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| dash (sim ability) | 6.7 |  | 9.9 | 2.6 | 12.4 | 10.1 | 0% |

**Lizardman (lizardman)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 33 |  | 16 | 34.8 | 0 | 23.6 | 83% |
| tail spin (ts.cd) | 7.6 |  | 5 | 8.7 | 1.4 | 5.7 | 12% |
| ts.t | 3.4 |  | 2.5 | 8.7 | 1.4 | 4.9 | 3% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| ts | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Sewer Crab (crab)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 24.2 |  | 15.6 | 35.4 | 1 | 13.7 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| bub | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Blue Crab (crabBlue)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 20.3 |  | 14.6 | 34.6 | 0.8 | 11 | 69% |
| bub | 18.5 |  | 16.5 | 18.8 | 13.7 | 17.9 | 31% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Croc (croc)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 37.1 |  | 18.1 | 33.6 | 1 | 25.8 | 64% |
| drag | 6.9 |  | 3.2 | 6.1 | 0 | 4.2 | 34% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| bite | 7.2 |  | 3.4 | 6.1 | 0.3 | 4.7 | 0% |
| its own strike (the brain sets the attack clock) (atkT) | 5.6 |  | 3 | 6.1 | 0 | 3.7 | 0% |

**Brain Leech (leechBrain)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| offT | 0 |  | 0 | 3.5 | 0 | 0 | - |
| latchT | 0 |  | 0 | 0 | 0 | 0 | - |

**Green Crab (crabGreen)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 59% |
| basic attack | 11.3 |  | 18.4 | 26.3 | 0.9 | 13 | 22% |
| bub | 19.2 |  | 15.9 | 18.2 | 13.7 | 17.6 | 19% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Rat King (ratKing)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 33% |
| basic attack | 47.5 |  | 14.3 | 47.2 | 1.4 | 19.7 | 29% |
| made: rat |  |  |  |  |  |  | 23% |
| made: ratPlague |  |  |  |  |  |  | 12% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| status: burn |  |  |  |  |  |  | 0% |

**Hunter Spider (spiderHunter)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 64% |
| basic attack | 40.3 |  | 23.2 | 36.9 | 7.4 | 25.4 | 36% |
| dash (sim ability) | 7 |  | 10.3 | 6.2 | 12.1 | 10 | 0% |

**Fire Slime (fireSlime)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 32.2 |  | 9.5 | 30.3 | 0 | 14.1 | 98% |
| status: burn |  |  |  |  |  |  | 2% |
| drip | 25.6 |  | 39.7 | 24.8 | 42.1 | 36.7 | 0% |

### The Crypt

**Rattler (rattler)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 18.1 |  | 17.4 | 34.1 | 0.3 | 18.7 | 100% |

**Bone Archer (rattlerBow)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 35.1 |  | 32 | 33 | 28 | 33 | 100% |

**Harrowing Skeleton (rattlerHarrow)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 18.5 |  | 15.2 | 32.9 | 1.5 | 20.2 | 63% |
| made: rattlerHarrow |  |  |  |  |  |  | 31% |
| on death | 0 |  | 0 | 0 | 0 | 0 | 6% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Ghost (ghost)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| touch (gT) | 19.7 |  | 18.1 | 23.1 | 1.2 | 15.1 | 99% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 1% |

**Bone Spear (rattlerSpear)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 21.5 |  | 16.4 | 33.7 | 3.8 | 20.6 | 99% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| dash (sim ability) | 8.7 |  | 7.7 | 2.8 | 8.3 | 8.4 | 0% |

**Loose Jaw (rattlerMace)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 15.1 |  | 10.5 | 31.9 | 0.7 | 17.2 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Golden Skeleton (rattlerGold)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| bones | 8.1 |  | 7.4 | 10.1 | 8.3 | 7.5 | 76% |
| basic attack | 28.3 |  | 16.8 | 32.9 | 0.9 | 18.4 | 24% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Gaper (gaper)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 13.8 |  | 15.3 | 29.6 | 0.2 | 20 | 67% |
| charge + spin (g.cd) | 6 |  | 5.9 | 5.9 | 5.5 | 5 | 32% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Banshee (banshee)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| wail | 11 |  | 10.7 | 11.9 | 8.4 | 10.6 | 99% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 1% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Brute (brute)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 8.4 |  | 12.3 | 26.1 | 0.1 | 18.8 | 99% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| shield up (b.cd) | 6.8 |  | 6.6 | 5.6 | 7 | 7 | 0% |
| b | 0 |  | 0 | 0 | 0 | 0 | 0% |

### The Frost Hollow

**Frost Wolf (frostWolf)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 24.9 |  | 24.9 | 26.9 | 13.7 | 17.9 | 67% |
| status: chill |  |  |  |  |  |  | 15% |
| lunge | 10 |  | 9.9 | 11.5 | 11.5 | 12.3 | 13% |
| its own strike (the brain sets the attack clock) (atkT) | 9.5 |  | 9.3 | 11.5 | 10.5 | 9.1 | 4% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| howl | 0 |  | 0 | 0 | 4.6 | 5.1 | 0% |
| focusT | 0 |  | 0 | 0 | 3.4 | 3.6 | 0% |

**Cave Bat (bat)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 30.6 |  | 31.6 | 33.8 | 10.5 | 21 | 99% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| dash (sim ability) | 13.9 |  | 11.4 | 4.2 | 14.6 | 14 | 0% |

**Snowman (snowman)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| snow | 21 |  | 18.2 | 19.8 | 14.9 | 18.6 | 99% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 1% |

**Ice Slime (slimeIce)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 7.3 |  | 13.2 | 31.4 | 0 | 12.1 | 95% |
| on death | 0 |  | 0 | 0 | 0 | 0 | 5% |

**Frost Spirit (spiritFrost)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| on death | 0 |  | 0 | 0 | 0 | 0 | 85% |
| knocked into a wall |  |  |  |  |  |  | 15% |

**Frost Spider (spiderFrost)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 29.4 |  | 30.1 | 26.5 | 10.9 | 27.7 | 100% |
| dash (sim ability) | 11.7 |  | 9.5 | 3.3 | 11.2 | 10.3 | 0% |

**Momma Spider (spiderMomma)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| web | 13.3 |  | 12.8 | 13.7 | 10.6 | 12.7 | 99% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 1% |

**Icicle Wraith (frostWraith)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| ice | 20.9 |  | 20.6 | 20.3 | 18.9 | 20.5 | 99% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 1% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Yeti (yeti)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| pack | 3.4 |  | 2.6 | 15.5 | 6 | 7.8 | 60% |
| basic attack | 4.2 |  | 3.9 | 22.4 | 0.3 | 7.1 | 22% |
| status: chill |  |  |  |  |  |  | 14% |
| knocked into a wall |  |  |  |  |  |  | 4% |
| heave | 4.1 |  | 4.3 | 0.9 | 5.1 | 3.3 | 0% |
| shove | 0.8 |  | 1.2 | 2.6 | 0.3 | 2.3 | 0% |
| yt | 0 |  | 0 | 0 | 0 | 0 | 0% |

### The Ember Deep

**Imp (imp)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| fire | 17 |  | 13.1 | 15.3 | 11.4 | 12.7 | 56% |
| status: burn |  |  |  |  |  |  | 44% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 0% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Cinder Bat (cinderBat)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| dive | 25.2 |  | 24.1 | 26.5 | 22.5 | 24 | 78% |
| status: burn |  |  |  |  |  |  | 17% |
| bleedHoldT | 2.2 |  | 0 | 0 | 0 | 0 | 4% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Hellhound (hellhound)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: bleed |  |  |  |  |  |  | 57% |
| status: burn |  |  |  |  |  |  | 27% |
| basic attack | 22.4 |  | 15.6 | 24.3 | 5.2 | 13.4 | 11% |
| breath | 9.1 |  | 8.7 | 12.1 | 8.4 | 9.5 | 3% |
| trail | 83.8 |  | 87.5 | 78.9 | 92.1 | 84.6 | 1% |
| lunge | 9.4 |  | 9.8 | 12.1 | 11.2 | 10.7 | 1% |
| its own strike (the brain sets the attack clock) (atkT) | 8.8 |  | 8.8 | 12.1 | 9.2 | 8.8 | 0% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| howl | 0 |  | 5.2 | 0 | 4.2 | 5.1 | 0% |
| focusT | 0 |  | 4.1 | 0 | 3.3 | 3.8 | 0% |

**Fire Spirit (spiritFire)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: burn |  |  |  |  |  |  | 59% |
| on death | 0 |  | 0 | 0 | 0 | 0 | 40% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Devil (devil)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 30.3 |  | 21.3 | 42.1 | 2.4 | 27.5 | 98% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| dash (sim ability) | 10.8 |  | 8.7 | 0 | 11 | 9.8 | 0% |

**Dragonborn (dragonborn)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 18.2 |  | 15.4 | 30.1 | 1.7 | 22.1 | 80% |
| charge (sim ability) | 5.8 |  | 6 | 5.5 | 5.8 | 5.6 | 17% |
| knocked into a wall |  |  |  |  |  |  | 3% |

**Fire Spider (spiderFire)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 29.1 |  | 16.5 | 36.5 | 5.2 | 17.4 | 36% |
| status: burn |  |  |  |  |  |  | 35% |
| spit | 15.2 |  | 15.7 | 12.2 | 13.9 | 13.7 | 29% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| dash (sim ability) | 10.9 |  | 12.3 | 3 | 11.4 | 13.2 | 0% |

**Succubus (succubus)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 34.3 |  | 36.4 | 41.4 | 5.3 | 39.3 | 95% |
| kiss | 7 |  | 6.8 | 8.7 | 7.6 | 6.3 | 4% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| dash (sim ability) | 7.2 |  | 3.6 | 8.7 | 9 | 3.4 | 0% |

**Demon (demon)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 16.7 |  | 14 | 26.2 | 0.2 | 18.3 | 87% |
| slam (slT) | 5.1 |  | 4.4 | 7.5 | 0.6 | 4.4 | 10% |
| knocked into a wall |  |  |  |  |  |  | 3% |

### The Gilded Spire

**Cherub (cherub)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 40.9 |  | 39.9 | 40.9 | 35.2 | 39 | 100% |

**Angel (angel)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 23 |  | 29.3 | 36.9 | 3.3 | 33.3 | 99% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| dash (sim ability) | 10.3 |  | 8 | 3.7 | 8.7 | 8.7 | 0% |

**Sun Blade (sunBlade)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| pass | 24.6 |  | 25.2 | 15.8 | 17.4 | 19.1 | 89% |
| knocked into a wall |  |  |  |  |  |  | 11% |
| bl.tellT | 1.5 |  | 2 | 7 | 6.9 | 3.9 | 0% |
| bl.stuckT | 1.5 |  | 2 | 7 | 5.3 | 3.2 | 0% |
| bl | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Choir Sprite (choirSprite)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| song | 58.3 |  | 45 | 58.7 | 57.5 | 54.4 | - |
| silT | 0.3 |  | 2.4 | 0 | 0 | 0.9 | - |

**Seraph (seraph)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 38.2 |  | 37.2 | 40.7 | 35.7 | 38 | 100% |

**Fallen Angel (angelFallen)** (no brain: the sim's plain fighting)

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 23.2 |  | 32.4 | 38.5 | 2.5 | 33.7 | 97% |
| knocked into a wall |  |  |  |  |  |  | 3% |
| dash (sim ability) | 10.6 |  | 7.5 | 7.7 | 8.9 | 8.5 | 0% |

**Gilded Golem (gildedGolem)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| shot bounced back | 0 |  | 0 | 0 | 0 | 0 | 57% |
| basic attack | 9.7 |  | 11.9 | 25.5 | 7.2 | 14.9 | 25% |
| status: burn |  |  |  |  |  |  | 7% |
| knocked into a wall |  |  |  |  |  |  | 6% |
| stomp | 7.2 |  | 7.5 | 7.4 | 7.5 | 7.5 | 5% |
| status: chill |  |  |  |  |  |  | 1% |

**Golem (golem)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 6 |  | 14 | 25.3 | 0.8 | 18.9 | 77% |
| stomp | 7.2 |  | 7.6 | 8 | 7.2 | 7.5 | 18% |
| knocked into a wall |  |  |  |  |  |  | 4% |

### The Sunken Dunes

**Scarab (scarab)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 26.5 |  | 21.7 | 37.5 | 4.9 | 12.8 | 83% |
| knocked into a wall |  |  |  |  |  |  | 9% |
| bur.t | 14.4 |  | 14.3 | 15.8 | 14.3 | 14.7 | 5% |
| bur.dirtT | 2.6 |  | 5.5 | 7.9 | 5.2 | 10 | 4% |
| bur | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Cobra (cobra)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 73% |
| spit | 23.4 |  | 25.2 | 24 | 23.6 | 25.2 | 27% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 0% |
| knocked into a wall |  |  |  |  |  |  | 0% |
| rear | 6.9 |  | 5.8 | 16.6 | 0 | 4.5 | 0% |

**Golden Scarab (scarabGold)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 26.4 |  | 22.9 | 40.1 | 4 | 16.3 | 83% |
| knocked into a wall |  |  |  |  |  |  | 9% |
| bur.t | 13.4 |  | 14.4 | 14.8 | 13.9 | 14.3 | 6% |
| bur.dirtT | 1.3 |  | 2.6 | 4.2 | 3.8 | 4.8 | 1% |
| bur | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Sand Serpent (sandSerpent)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 33% |
| basic attack | 15.4 |  | 16.5 | 29.1 | 1.9 | 17.5 | 31% |
| strike | 19.4 |  | 29.3 | 25.9 | 17.4 | 27 | 12% |
| its own strike (the brain sets the attack clock) (atkT) | 7.9 |  | 7.9 | 8.6 | 8.6 | 9.5 | 3% |
| bur.t | 6 |  | 6.8 | 6.5 | 5.6 | 4.5 | 3% |
| knocked into a wall |  |  |  |  |  |  | 1% |
| bur.dirtT | 1.8 |  | 1.9 | 4.3 | 3.6 | 3.2 | 1% |
| _lastHit | 0 |  | 0 | 0 | 0 | 0 | 0% |
| bur | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Jackal Guard (jackal)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 25.9 |  | 22.3 | 37.5 | 2.7 | 29.2 | 70% |
| side | 8.4 |  | 8.5 | 12.5 | 10 | 9.5 | 19% |
| status: poison |  |  |  |  |  |  | 9% |
| its own strike (the brain sets the attack clock) (atkT) | 4 |  | 4.2 | 7.5 | 3.6 | 5.2 | 1% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Mummy (mummy)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 16 |  | 13.4 | 29.9 | 0.7 | 24.3 | 91% |
| wrap | 6.3 |  | 6.9 | 7.9 | 9.2 | 6.2 | 8% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Dart Trap (dartTrap)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 62% |
| fire | 8.5 |  | 11.4 | 17.8 | 5.8 | 16.3 | 38% |

**Venom Spirit (spiritPoison)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: poison |  |  |  |  |  |  | 57% |
| on death | 0 |  | 0 | 0 | 0 | 0 | 39% |
| knocked into a wall |  |  |  |  |  |  | 3% |

**Sand Mage (sandMage)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| sand | 21.1 |  | 21 | 20.7 | 19.1 | 21.7 | 34% |
| knocked into a wall |  |  |  |  |  |  | 18% |
| basic attack | 0 |  | 0 | 0 | 0 | 0 | 0% |
| devil | 8.6 |  | 10 | 12.2 | 9.9 | 9.5 | 0% |
| _lastHit | 0 |  | 0 | 0 | 0 | 0 | 0% |

### The Clockwork Foundry

**Gear Sprite (gearSprite)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| its brain's own blows (contact, no clock) (brain) | 0 |  | 0 | 0 | 0 | 0 | 94% |
| knocked into a wall |  |  |  |  |  |  | 6% |

**Cog Sprite (cogSprite)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| its brain's own blows (contact, no clock) (brain) | 0 |  | 0 | 0 | 0 | 0 | 88% |
| knocked into a wall |  |  |  |  |  |  | 12% |
| _lastHit | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Bomb Bot (bombBot)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| fuse | 23.6 |  | 23.4 | 23.3 | 24.9 | 31.4 | 79% |
| status: burn |  |  |  |  |  |  | 21% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Copper Bee (bee)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 21.8 |  | 9.3 | 16 | 0.4 | 7.6 | 72% |
| dash | 5.3 |  | 10.2 | 16 | 12.3 | 11.7 | 22% |
| knocked into a wall |  |  |  |  |  |  | 6% |
| its own strike (the brain sets the attack clock) (atkT) | 5.1 |  | 8.6 | 0 | 10.6 | 7.9 | 0% |

**Copper Wasp (wasp)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| sting | 44.5 |  | 41.6 | 41.5 | 14.7 | 40.4 | 100% |

**Drill Bot (drillBot)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 18.3 |  | 17.1 | 30.8 | 4.5 | 17.1 | 90% |
| bur.t | 9.7 |  | 12.6 | 11.9 | 12 | 12.5 | 6% |
| knocked into a wall |  |  |  |  |  |  | 3% |
| bur.dirtT | 1 |  | 2.9 | 4 | 4.2 | 6.1 | 1% |
| bur | 0 |  | 0 | 0 | 0 | 0 | 0% |

**Saw Blade (sawBlade)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| its brain's own blows (contact, no clock) (brain) | 0 |  | 0 | 0 | 0 | 0 | 100% |

**Automaton (automaton)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 11 |  | 17.7 | 35.3 | 2.1 | 23.9 | 99% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Steam Turret (turretSteam)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: burn |  |  |  |  |  |  | 55% |
| fire | 17.6 |  | 31.2 | 7.7 | 35.1 | 25.2 | 45% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Flame Turret (turretFlame)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: burn |  |  |  |  |  |  | 84% |
| fire | 2.4 |  | 8.8 | 4.2 | 1.1 | 8.7 | 16% |

**Gun Turret (turretGun)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| fire | 9.8 |  | 12.8 | 10.6 | 7.7 | 13.3 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Mortar (mortar)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| fire | 13.3 |  | 15.6 | 9 | 14.6 | 16.4 | 99% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Auto Bomb Bot (autoBomb)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| fuse | 17 |  | 21.5 | 22.7 | 19 | 26.8 | 66% |
| status: burn |  |  |  |  |  |  | 33% |
| knocked into a wall |  |  |  |  |  |  | 1% |

**Repair Drone (repairDrone)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| mend | 98.5 |  | 39.6 | 89.5 | 43.1 | 71 | - |

**Bronze Bee (beeBronze)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 18.7 |  | 14.9 | 28.8 | 1.5 | 10.3 | 73% |
| dash | 6.3 |  | 9.7 | 4.8 | 11.8 | 11.3 | 23% |
| knocked into a wall |  |  |  |  |  |  | 4% |
| its own strike (the brain sets the attack clock) (atkT) | 6.2 |  | 8.5 | 4.8 | 10.6 | 8.1 | 0% |

**Bronze Wasp (waspBronze)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| sting | 44.6 |  | 43.8 | 46.8 | 20.5 | 43.2 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Bronze Hornet (hornetBronze)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| sting | 18 |  | 18.8 | 22.6 | 8.4 | 18.6 | 98% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| _lastHit | 0 |  | 0 | 0 | 0 | 0 | 0% |
| its own strike (the brain sets the attack clock) (atkT) | 0.6 |  | 0 | 0 | 0 | 0.1 | 0% |

**Tesla Coil (teslaCoil)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| zap | 80.6 |  | 59.2 | 22.8 | 54.9 | 27.4 | 100% |

**Foundry Smith (foundrySmith)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: burn |  |  |  |  |  |  | 56% |
| basic attack | 3.6 |  | 13.6 | 26.5 | 0.1 | 14.9 | 27% |
| slam | 6.7 |  | 5.1 | 7.2 | 1.4 | 5.5 | 14% |
| knocked into a wall |  |  |  |  |  |  | 3% |

**Laser Turret (turretLaser)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| fire | 3.8 |  | 7 | 4.3 | 3.6 | 7 | 57% |
| status: burn |  |  |  |  |  |  | 43% |

**Fire Mortar (mortarFire)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| status: burn |  |  |  |  |  |  | 82% |
| fire | 12 |  | 14.1 | 5.5 | 16.2 | 16.1 | 18% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Gas Mortar (mortarPoison)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| fire | 12.8 |  | 14.6 | 7.2 | 16.3 | 15.7 | 58% |
| status: poison |  |  |  |  |  |  | 41% |
| status: burn |  |  |  |  |  |  | 1% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Chain Crawler (chainCrawler)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 8.6 |  | 22.6 | 34.9 | 0.7 | 29.6 | 66% |
| lunge | 3.9 |  | 4.9 | 6.5 | 8.6 | 3.8 | 11% |
| knocked into a wall |  |  |  |  |  |  | 4% |
| its own strike (the brain sets the attack clock) (atkT) | 3.8 |  | 4.7 | 6.5 | 7.7 | 2 | 0% |

**Steel Bee (beeSteel)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| basic attack | 18.7 |  | 15.3 | 38.3 | 1.3 | 13.2 | 71% |
| dash | 6.7 |  | 10 | 5.9 | 11.4 | 10.7 | 26% |
| knocked into a wall |  |  |  |  |  |  | 3% |
| its own strike (the brain sets the attack clock) (atkT) | 6.5 |  | 9.9 | 4.4 | 10.6 | 9.1 | 0% |

**Steel Wasp (waspSteel)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| sting | 44 |  | 42.1 | 48.6 | 20.7 | 43.5 | 100% |
| knocked into a wall |  |  |  |  |  |  | 0% |

**Steel Hornet (hornetSteel)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| sting | 17.8 |  | 18.9 | 22 | 8 | 18.6 | 98% |
| knocked into a wall |  |  |  |  |  |  | 2% |
| _lastHit | 0 |  | 0 | 0 | 0 | 0 | 0% |
| its own strike (the brain sets the attack clock) (atkT) | 0.1 |  | 0 | 0 | 0.1 | 0.3 | 0% |

**Storm Spirit (spiritShock)**

| move | fires/min 1v1 | fires/min group | fires/min mix | fires/min vsSwarm | fires/min vsRanged | fires/min vsHero | share of its damage |
|---|---|---|---|---|---|---|---|
| on death | 0 |  | 0 | 0 | 0 | 0 | 90% |
| knocked into a wall |  |  |  |  |  |  | 10% |

### Moves that never fired

In any fight of any batch (1v1, groups, swarm, the hero panel). "armed" means the brain looked at the move's clock but never let it go off; "in the code" means a due() timer the brain can reach that was never even looked at.

| kind | never fired | armed but held back |
|---|---|---|
| Troll (troll) | recall | - |
| Rock Troll (rockTroll) | recall | - |
| Sewer Crab (crab) | bub | - |

## 5. Statuses the enemies put on

Over every batch: how much build-up a kind adds a minute it is alive (after the target's resistances), how often that tips into a burst, and what share of the kind's damage the status did itself (ticks and bursts; a blow that carries the status counts as the blow).

| kind | dungeon | statuses |
|---|---|---|
| Poison Slime (slimePoison) | The Wildwood | poison 316/min, 1.4 bursts/min, 60% of its damage |
| Bandit (bandit) | The Wildwood | stagger 101/min, 0.1 bursts/min |
| Knife Bandit (banditDagger) | The Wildwood | poison 347/min, 0.7 bursts/min, 45% of its damage |
| Torch Bandit (banditTorch) | The Wildwood | burn 284/min, 0.3 bursts/min, 46% of its damage |
| Axe Bandit (banditAxe) | The Wildwood | stagger 457/min, 0.4 bursts/min |
| Greatsword Bandit (banditGreat) | The Wildwood | stagger 86/min, 0 bursts/min |
| Bandit Brute (banditBrute) | The Wildwood | stagger 131/min, 0 bursts/min |
| Ent (ent) | The Wildwood | entangle 132/min, 0.1 bursts/min, 1% of its damage |
| Sproutling (sproutling) | The Wildwood | entangle 9/min |
| Thornback Boar (boar) | The Wildwood | stagger 59/min |
| Dynamite Mouse (dynamouse) | The Warren | burn 16/min, 29% of its damage |
| Orc Shaman (orcShaman) | The Warren | burn 369/min, 0.4 bursts/min, 69% of its damage |
| Wolf Rider (wolfRider) | The Warren | stagger 74/min |
| Suicide Bomber (goblinSuicide) | The Warren | burn 34/min, 13% of its damage |
| Frost Shaman (frostShaman) | The Warren | chill 1134/min, 4.2 bursts/min |
| Troll (troll) | The Warren | stagger 175/min |
| Rock Troll (rockTroll) | The Warren | stagger 182/min |
| Plague Rat (ratPlague) | The Sewers | poison 362/min, 1.8 bursts/min, 65% of its damage; burn 2/min, 0.1 bursts/min, 1% of its damage |
| Sludge Slime (slimeSludge) | The Sewers | wet 2/min; poison 6/min, 1% of its damage; burn 1/min, 0% of its damage |
| Lizardman (lizardman) | The Sewers | wet 202/min, 0.2 bursts/min |
| Blue Crab (crabBlue) | The Sewers | wet 428/min, 6.8 bursts/min |
| Green Crab (crabGreen) | The Sewers | poison 330/min, 2.2 bursts/min, 59% of its damage |
| Rat King (ratKing) | The Sewers | poison 481/min, 3.2 bursts/min, 33% of its damage; burn 1/min, 0 bursts/min, 0% of its damage |
| Hunter Spider (spiderHunter) | The Sewers | poison 626/min, 3.4 bursts/min, 64% of its damage |
| Fire Slime (fireSlime) | The Sewers | burn 16/min, 2% of its damage; wet 0/min |
| Harrowing Skeleton (rattlerHarrow) | The Crypt | curse 71/min, 0.1 bursts/min |
| Ghost (ghost) | The Crypt | sleepy 246/min, 1.4 bursts/min |
| Banshee (banshee) | The Crypt | stagger 347/min, 0.1 bursts/min; curse 301/min, 0.4 bursts/min; fear 426/min, 0.2 bursts/min |
| Frost Wolf (frostWolf) | The Frost Hollow | chill 273/min, 0.9 bursts/min, 15% of its damage |
| Snowman (snowman) | The Frost Hollow | chill 280/min, 0.9 bursts/min |
| Ice Slime (slimeIce) | The Frost Hollow | chill 19/min, 0 bursts/min |
| Frost Spirit (spiritFrost) | The Frost Hollow | chill 49/min |
| Frost Spider (spiderFrost) | The Frost Hollow | chill 600/min, 2.4 bursts/min |
| Yeti (yeti) | The Frost Hollow | stagger 324/min, 0.5 bursts/min; chill 194/min, 0.7 bursts/min, 14% of its damage |
| Imp (imp) | The Ember Deep | burn 117/min, 0.3 bursts/min, 44% of its damage |
| Cinder Bat (cinderBat) | The Ember Deep | burn 265/min, 0.6 bursts/min, 17% of its damage |
| Hellhound (hellhound) | The Ember Deep | burn 385/min, 2.8 bursts/min, 27% of its damage; bleed 178/min, 1 bursts/min, 57% of its damage |
| Fire Spirit (spiritFire) | The Ember Deep | burn 61/min, 59% of its damage |
| Fire Spider (spiderFire) | The Ember Deep | burn 356/min, 1.9 bursts/min, 35% of its damage |
| Succubus (succubus) | The Ember Deep | charm 484/min, 0.6 bursts/min |
| Cherub (cherub) | The Gilded Spire | radiance 173/min, 0.8 bursts/min |
| Angel (angel) | The Gilded Spire | radiance 233/min, 1.4 bursts/min |
| Sun Blade (sunBlade) | The Gilded Spire | radiance 30/min, 0 bursts/min |
| Choir Sprite (choirSprite) | The Gilded Spire | sleepy 238/min, 0.6 bursts/min |
| Seraph (seraph) | The Gilded Spire | radiance 327/min, 1.7 bursts/min |
| Fallen Angel (angelFallen) | The Gilded Spire | curse 328/min, 1.5 bursts/min |
| Gilded Golem (gildedGolem) | The Gilded Spire | radiance 129/min, 0.3 bursts/min; stagger 426/min, 1.7 bursts/min; burn 60/min, 0.2 bursts/min, 7% of its damage; chill 45/min, 0.1 bursts/min, 1% of its damage |
| Golem (golem) | The Gilded Spire | stagger 371/min, 1.1 bursts/min |
| Cobra (cobra) | The Sunken Dunes | poison 266/min, 1.9 bursts/min, 73% of its damage |
| Sand Serpent (sandSerpent) | The Sunken Dunes | poison 139/min, 0.4 bursts/min, 33% of its damage |
| Jackal Guard (jackal) | The Sunken Dunes | stagger 140/min, 0 bursts/min; poison 14/min, 0.1 bursts/min, 9% of its damage |
| Mummy (mummy) | The Sunken Dunes | curse 261/min, 1.3 bursts/min |
| Dart Trap (dartTrap) | The Sunken Dunes | poison 207/min, 1.5 bursts/min, 62% of its damage |
| Venom Spirit (spiritPoison) | The Sunken Dunes | poison 51/min, 0 bursts/min, 57% of its damage |
| Sand Mage (sandMage) | The Sunken Dunes | stagger 238/min, 0.5 bursts/min |
| Bomb Bot (bombBot) | The Clockwork Foundry | burn 271/min, 0.5 bursts/min, 21% of its damage |
| Drill Bot (drillBot) | The Clockwork Foundry | stagger 30/min, 0.1 bursts/min |
| Automaton (automaton) | The Clockwork Foundry | shock 3/min |
| Steam Turret (turretSteam) | The Clockwork Foundry | burn 169/min, 0.5 bursts/min, 55% of its damage; wet 445/min, 8.6 bursts/min |
| Flame Turret (turretFlame) | The Clockwork Foundry | burn 116/min, 0.6 bursts/min, 84% of its damage |
| Auto Bomb Bot (autoBomb) | The Clockwork Foundry | burn 114/min, 0.5 bursts/min, 33% of its damage |
| Tesla Coil (teslaCoil) | The Clockwork Foundry | shock 557/min, 1 bursts/min |
| Foundry Smith (foundrySmith) | The Clockwork Foundry | burn 183/min, 1 bursts/min, 56% of its damage; stagger 22/min, 0 bursts/min |
| Laser Turret (turretLaser) | The Clockwork Foundry | burn 52/min, 0.2 bursts/min, 43% of its damage |
| Fire Mortar (mortarFire) | The Clockwork Foundry | burn 181/min, 1.4 bursts/min, 82% of its damage |
| Gas Mortar (mortarPoison) | The Clockwork Foundry | poison 42/min, 0.3 bursts/min, 41% of its damage; burn 1/min, 0 bursts/min, 1% of its damage |
| Chain Crawler (chainCrawler) | The Clockwork Foundry | shock 33/min |
| Storm Spirit (spiritShock) | The Clockwork Foundry | shock 75/min |

## 6. Alone against a crowd

492 fights: each kind, one of it, against eight Goblins (rank 0, 4 seeds). Mostly here for the moves table; the kill count says who can handle a crowd.

<details><summary>All kinds</summary>

| kind | dungeon | won | goblins killed (of 8) | fight time |
|---|---|---|---|---|
| Golden Skeleton (rattlerGold) | The Crypt | 100% | 8 | 11.9 s |
| Golem (golem) | The Gilded Spire | 100% | 8 | 37.3 s |
| Brute (brute) | The Crypt | 100% | 7.8 | 32.2 s |
| Bandit Brute (banditBrute) | The Wildwood | 100% | 7.5 | 31.1 s |
| Rat King (ratKing) | The Sewers | 100% | 7.5 | 12.3 s |
| Foundry Smith (foundrySmith) | The Clockwork Foundry | 100% | 7.5 | 24.9 s |
| Gilded Golem (gildedGolem) | The Gilded Spire | 100% | 7.3 | 28.2 s |
| Sand Serpent (sandSerpent) | The Sunken Dunes | 100% | 6.5 | 13.9 s |
| Chain Crawler (chainCrawler) | The Clockwork Foundry | 100% | 6.3 | 13.8 s |
| Big Slime (slimeBig) | The Wildwood | 50% | 6 | 28.4 s |
| Ogre (ogre) | The Warren | 25% | 4.5 | 18.1 s |
| Demon (demon) | The Ember Deep | 25% | 3.5 | 16 s |
| Jackal Guard (jackal) | The Sunken Dunes | 25% | 3.3 | 12 s |
| Rock Troll (rockTroll) | The Warren | 25% | 2.8 | 62.8 s |
| Cog Sprite (cogSprite) | The Clockwork Foundry | 50% | 2.8 | 25.2 s |
| Ent (ent) | The Wildwood | 0% | 2.5 | 21 s |
| Greatsword Bandit (banditGreat) | The Wildwood | 25% | 2.3 | 9.9 s |
| Steel Hornet (hornetSteel) | The Clockwork Foundry | 0% | 2.3 | 30.7 s |
| Gear Sprite (gearSprite) | The Clockwork Foundry | 25% | 2 | 54.2 s |
| Automaton (automaton) | The Clockwork Foundry | 0% | 2 | 18.3 s |
| Orc (orc) | The Warren | 0% | 1.5 | 8.4 s |
| Green Crab (crabGreen) | The Sewers | 0% | 1.5 | 16.5 s |
| Gaper (gaper) | The Crypt | 0% | 1.5 | 10.2 s |
| Yeti (yeti) | The Frost Hollow | 0% | 1.5 | 17.4 s |
| Dragonborn (dragonborn) | The Ember Deep | 0% | 1.5 | 11 s |
| Sand Mage (sandMage) | The Sunken Dunes | 25% | 1.5 | 16.5 s |
| Orc Shaman (orcShaman) | The Warren | 0% | 1.3 | 8.7 s |
| Steel Bee (beeSteel) | The Clockwork Foundry | 0% | 1.3 | 10.2 s |
| Croc (croc) | The Sewers | 0% | 1 | 9.8 s |
| Succubus (succubus) | The Ember Deep | 0% | 1 | 6.9 s |
| Thornback Boar (boar) | The Wildwood | 0% | 0.8 | 9.4 s |
| Sewer Crab (crab) | The Sewers | 0% | 0.8 | 13.6 s |
| Blue Crab (crabBlue) | The Sewers | 0% | 0.8 | 15.2 s |
| Harrowing Skeleton (rattlerHarrow) | The Crypt | 0% | 0.8 | 11.3 s |
| Fallen Angel (angelFallen) | The Gilded Spire | 0% | 0.8 | 7.8 s |
| Poison Slime (slimePoison) | The Wildwood | 0% | 0.5 | 9.4 s |
| Axe Bandit (banditAxe) | The Wildwood | 0% | 0.5 | 5.2 s |
| Wolf Rider (wolfRider) | The Warren | 0% | 0.5 | 12 s |
| Lizardman (lizardman) | The Sewers | 0% | 0.5 | 6.9 s |
| Loose Jaw (rattlerMace) | The Crypt | 0% | 0.5 | 6.1 s |
| Mummy (mummy) | The Sunken Dunes | 0% | 0.5 | 9.5 s |
| Drill Bot (drillBot) | The Clockwork Foundry | 0% | 0.5 | 15.1 s |
| Spear Goblin (goblinSpear) | The Warren | 0% | 0.3 | 6.6 s |
| Angel (angel) | The Gilded Spire | 0% | 0.3 | 8.1 s |
| Bronze Hornet (hornetBronze) | The Clockwork Foundry | 0% | 0.3 | 17.4 s |
| Wolf (wolf) | The Wildwood | 0% | 0 | 3.7 s |
| Slime (slime) | The Wildwood | 0% | 0 | 8.7 s |
| Goblin (goblin) | The Wildwood | 0% | 0 | 3.9 s |
| Orange Goblin (goblinOrange) | The Wildwood | 0% | 0 | 5.6 s |
| Bandit (bandit) | The Wildwood | 0% | 0 | 6.9 s |
| Knife Bandit (banditDagger) | The Wildwood | 0% | 0 | 4.5 s |
| Spear Bandit (banditSpear) | The Wildwood | 0% | 0 | 5.9 s |
| Torch Bandit (banditTorch) | The Wildwood | 0% | 0 | 5.5 s |
| Poacher (poacher) | The Wildwood | 0% | 0 | 7.2 s |
| Sproutling (sproutling) | The Wildwood | 0% | 0 | 2.9 s |
| Wisp (wisp) | The Wildwood | 0% | 0 | 9 s |
| Dire Wolf (direWolf) | The Wildwood | 0% | 0 | 6.4 s |
| Mouse (mouse) | The Warren | 0% | 0 | 3.4 s |
| Goblin Bomber (goblinBomber) | The Warren | 0% | 0 | 7.8 s |
| Dynamite Mouse (dynamouse) | The Warren | 0% | 0 | 2.9 s |
| Hobgoblin (hobgoblin) | The Warren | 0% | 0 | 8.1 s |
| Drummer (drummer) | The Warren | 0% | 0 | 7.5 s |
| Suicide Bomber (goblinSuicide) | The Warren | 0% | 0 | 3.4 s |
| Frost Shaman (frostShaman) | The Warren | 0% | 0 | 12.4 s |
| Troll (troll) | The Warren | 0% | 0 | 17.8 s |
| Rat (rat) | The Sewers | 0% | 0 | 4 s |
| Plague Rat (ratPlague) | The Sewers | 0% | 0 | 3.3 s |
| Sludge Slime (slimeSludge) | The Sewers | 0% | 0 | 9.7 s |
| Slimelet (slimeSmall) | The Sewers | 0% | 0 | 3.3 s |
| Blood Leech (leechBlood) | The Sewers | 0% | 0 | 3.5 s |
| Lizard Blade (lizardBlade) | The Sewers | 0% | 0 | 5.8 s |
| Brain Leech (leechBrain) | The Sewers | 0% | 0 | 4.3 s |
| Hunter Spider (spiderHunter) | The Sewers | 0% | 0 | 4.9 s |
| Fire Slime (fireSlime) | The Sewers | 0% | 0 | 5.5 s |
| Rattler (rattler) | The Crypt | 0% | 0 | 5.3 s |
| Bone Archer (rattlerBow) | The Crypt | 0% | 0 | 6.4 s |
| Ghost (ghost) | The Crypt | 0% | 0 | 4.6 s |
| Bone Spear (rattlerSpear) | The Crypt | 0% | 0 | 5.4 s |
| Banshee (banshee) | The Crypt | 0% | 0 | 10.1 s |
| Frost Wolf (frostWolf) | The Frost Hollow | 0% | 0 | 3.9 s |
| Cave Bat (bat) | The Frost Hollow | 0% | 0 | 3.6 s |
| Snowman (snowman) | The Frost Hollow | 0% | 0 | 6.8 s |
| Ice Slime (slimeIce) | The Frost Hollow | 0% | 0 | 6.2 s |
| Frost Spirit (spiritFrost) | The Frost Hollow | 0% | 0 | 5.9 s |
| Frost Spider (spiderFrost) | The Frost Hollow | 0% | 0 | 4.5 s |
| Momma Spider (spiderMomma) | The Frost Hollow | 0% | 0 | 9.9 s |
| Icicle Wraith (frostWraith) | The Frost Hollow | 0% | 0 | 8.9 s |
| Imp (imp) | The Ember Deep | 0% | 0 | 6.9 s |
| Cinder Bat (cinderBat) | The Ember Deep | 0% | 0 | 2.3 s |
| Hellhound (hellhound) | The Ember Deep | 0% | 0 | 5 s |
| Fire Spirit (spiritFire) | The Ember Deep | 0% | 0 | 5.8 s |
| Devil (devil) | The Ember Deep | 0% | 0 | 7.1 s |
| Fire Spider (spiderFire) | The Ember Deep | 0% | 0 | 4.9 s |
| Cherub (cherub) | The Gilded Spire | 0% | 0 | 6.3 s |
| Sun Blade (sunBlade) | The Gilded Spire | 0% | 0 | 8.6 s |
| Choir Sprite (choirSprite) | The Gilded Spire | 0% | 0 | 7.9 s |
| Seraph (seraph) | The Gilded Spire | 0% | 0 | 8.9 s |
| Light Spirit (spiritHeal) | The Gilded Spire | 0% | 0 | 5.8 s |
| Ward Spirit (spiritWard) | The Gilded Spire | 0% | 0 | 5.9 s |
| Scarab (scarab) | The Sunken Dunes | 0% | 0 | 7.6 s |
| Cobra (cobra) | The Sunken Dunes | 0% | 0 | 8.2 s |
| Golden Scarab (scarabGold) | The Sunken Dunes | 0% | 0 | 14.2 s |
| Wind Spirit (spiritHaste) | The Sunken Dunes | 0% | 0 | 5.8 s |
| Dart Trap (dartTrap) | The Sunken Dunes | 0% | 0 | 6.7 s |
| Venom Spirit (spiritPoison) | The Sunken Dunes | 0% | 0 | 6 s |
| Bomb Bot (bombBot) | The Clockwork Foundry | 0% | 0 | 2.6 s |
| Copper Bee (bee) | The Clockwork Foundry | 0% | 0 | 2.8 s |
| Copper Wasp (wasp) | The Clockwork Foundry | 0% | 0 | 5.1 s |
| Saw Blade (sawBlade) | The Clockwork Foundry | 0% | 0 | 0 s |
| Steam Turret (turretSteam) | The Clockwork Foundry | 0% | 0 | 13.6 s |
| Flame Turret (turretFlame) | The Clockwork Foundry | 0% | 0 | 14.3 s |
| Gun Turret (turretGun) | The Clockwork Foundry | 0% | 0 | 14.2 s |
| Mortar (mortar) | The Clockwork Foundry | 0% | 0 | 15 s |
| Auto Bomb Bot (autoBomb) | The Clockwork Foundry | 0% | 0 | 2.7 s |
| Repair Drone (repairDrone) | The Clockwork Foundry | 0% | 0 | 7.9 s |
| Bronze Bee (beeBronze) | The Clockwork Foundry | 0% | 0 | 6.3 s |
| Bronze Wasp (waspBronze) | The Clockwork Foundry | 0% | 0 | 13.2 s |
| Tesla Coil (teslaCoil) | The Clockwork Foundry | 0% | 0 | 7.9 s |
| Laser Turret (turretLaser) | The Clockwork Foundry | 0% | 0 | 14.1 s |
| Fire Mortar (mortarFire) | The Clockwork Foundry | 0% | 0 | 16.5 s |
| Gas Mortar (mortarPoison) | The Clockwork Foundry | 0% | 0 | 20.9 s |
| Steel Wasp (waspSteel) | The Clockwork Foundry | 0% | 0 | 20.4 s |
| Storm Spirit (spiritShock) | The Clockwork Foundry | 0% | 0 | 5.8 s |

</details>

## 7. Bosses

228 fights in battle mode: each boss at its home strength against paladin, berserker, archer, cleric at tier I and II (6 seeds). The full-run boss bench is tools/runs.mjs --boss (not redone here).

| boss | dungeon | party | boss wins | heroes lost | boss health left | fight time | time ran out |
|---|---|---|---|---|---|---|---|
| The Alpha (alpha) | The Wildwood | tier 1 | 0% | 0 of 4 | 0% | 9.9 s | 0 |
| The Alpha (alpha) | The Wildwood | tier 2 | 0% | 0 of 4 | 0% | 4.8 s | 0 |
| The Bandit Chief (banditChief) | The Wildwood | tier 1 | 0% | 0 of 4 | 0% | 2.5 s | 0 |
| The Bandit Chief (banditChief) | The Wildwood | tier 2 | 0% | 0 of 4 | 0% | 2 s | 0 |
| The Elder Ent (elderEnt) | The Wildwood | tier 1 | 0% | 0 of 4 | 0% | 36 s | 0 |
| The Elder Ent (elderEnt) | The Wildwood | tier 2 | 0% | 0 of 4 | 0% | 13.3 s | 0 |
| Orc Warboss (warboss) | The Warren | tier 1 | 0% | 0 of 4 | 0% | 18.4 s | 0 |
| Orc Warboss (warboss) | The Warren | tier 2 | 0% | 0 of 4 | 0% | 9.1 s | 0 |
| The Goblin Chieftain (chieftain) | The Warren | tier 1 | 0% | 0 of 4 | 0% | 43.6 s | 0 |
| The Goblin Chieftain (chieftain) | The Warren | tier 2 | 0% | 0 of 4 | 0% | 19.9 s | 0 |
| Lizard Chief (lizardChief) | The Sewers | tier 1 | 0% | 0 of 4 | 0% | 22.7 s | 0 |
| Lizard Chief (lizardChief) | The Sewers | tier 2 | 0% | 0 of 4 | 0% | 11.8 s | 0 |
| The Great Ooze (greatOoze) | The Sewers | tier 1 | 0% | 0 of 4 | 0% | 78.2 s | 0 |
| The Great Ooze (greatOoze) | The Sewers | tier 2 | 0% | 0 of 4 | 0% | 35.6 s | 0 |
| Grave Warden (graveWarden) | The Crypt | tier 1 | 0% | 0 of 4 | 0% | 66.8 s | 0 |
| Grave Warden (graveWarden) | The Crypt | tier 2 | 0% | 0 of 4 | 0% | 27.6 s | 0 |
| The Bone King (boneKing) | The Crypt | tier 1 | 0% | 0 of 4 | 0% | 86.7 s | 0 |
| The Bone King (boneKing) | The Crypt | tier 2 | 0% | 0 of 4 | 0% | 43.9 s | 0 |
| Old Frost (frostGiant) | The Frost Hollow | tier 1 | 0% | 0.5 of 4 | 0% | 65.6 s | 0 |
| Old Frost (frostGiant) | The Frost Hollow | tier 2 | 0% | 0 of 4 | 0% | 26.7 s | 0 |
| The Winter Queen (winterQueen) | The Frost Hollow | tier 1 | 100% | 4 of 4 | 30% | 123.2 s | 0 |
| The Winter Queen (winterQueen) | The Frost Hollow | tier 2 | 0% | 0 of 4 | 0% | 56.2 s | 0 |
| Pit Lord (pitLord) | The Ember Deep | tier 1 | 0% | 0.2 of 4 | 0% | 41.6 s | 0 |
| Pit Lord (pitLord) | The Ember Deep | tier 2 | 0% | 0 of 4 | 0% | 21.3 s | 0 |
| The Archfiend (archfiend) | The Ember Deep | tier 1 | 17% | 1.8 of 4 | 0% | 76.6 s | 0 |
| The Archfiend (archfiend) | The Ember Deep | tier 2 | 0% | 0 of 4 | 0% | 31.9 s | 0 |
| Cinder, the Old Drake (cinder) | The Ember Deep | tier 1 | 100% | 4 of 4 | 20% | 82.8 s | 0 |
| Cinder, the Old Drake (cinder) | The Ember Deep | tier 2 | 0% | 0 of 4 | 0% | 31.8 s | 0 |
| Herald of Light (heraldLight) | The Gilded Spire | tier 1 | 0% | 1.2 of 4 | 0% | 79.6 s | 0 |
| Herald of Light (heraldLight) | The Gilded Spire | tier 2 | 0% | 0 of 4 | 0% | 29.2 s | 0 |
| The Radiant (radiant) | The Gilded Spire | tier 1 | 100% | 4 of 4 | 50% | 67.4 s | 0 |
| The Radiant (radiant) | The Gilded Spire | tier 2 | 0% | 0 of 4 | 0% | 42.1 s | 0 |
| The Gilded Seraph (gildedSeraph) | The Gilded Spire | tier 1 | 83% | 3.5 of 4 | 20% | 89.5 s | 0 |
| The Gilded Seraph (gildedSeraph) | The Gilded Spire | tier 2 | 0% | 0.2 of 4 | 0% | 57.2 s | 0 |
| The Sand Wurm (sandWurm) | The Sunken Dunes | tier 1 | 33% | 2.3 of 4 | 0% | 82.3 s | 0 |
| The Sand Wurm (sandWurm) | The Sunken Dunes | tier 2 | 0% | 0 of 4 | 0% | 36.8 s | 0 |
| The Great Engine (greatEngine) | The Clockwork Foundry | tier 1 | 83% | 3.3 of 4 | 30% | 76.3 s | 0 |
| The Great Engine (greatEngine) | The Clockwork Foundry | tier 2 | 0% | 0 of 4 | 0% | 36.4 s | 0 |

Boss moves (fires a minute, share of the boss side's damage; "made:" is what its adds did):

**The Alpha (alpha)**: basic attack 29.9/min 67%, rend 6.1/min 15%, made: wolf  8%, knocked into a wall  4%, howl 8.2/min, focusT 8.2/min, pack 4.8/min, pin 2/min

**The Bandit Chief (banditChief)**: basic attack 22.3/min 100%, smoke 26.8/min, knives 2.2/min, whistle **never**

**The Elder Ent (elderEnt)**: sweep 8.2/min 44%, status: burn  19%, branch 3.4/min 14%, roots 6.3/min 12%, cage 2.5/min 5%, status: entangle  3%, grove 2.5/min 1%, knocked into a wall  0%

**Orc Warboss (warboss)**: basic attack 20.4/min 92%, slam 6.9/min 4%, made: hobgoblin  2%, made: goblin  2%, calls adds 2.2/min

**The Goblin Chieftain (chieftain)**: chop 5.6/min 36%, charge 3/min 18%, made: hobgoblin  9%, made: goblin  9%, axe 3.8/min 7%, spin 2.1/min 7%, knocked into a wall  1%, status: burn  1%, mice 1.9/min 0%, ch 1.9/min

**Lizard Chief (lizardChief)**: basic attack 27.2/min 79%, tail spin 7.2/min 10%, ts.t 7.5/min 7%, made: lizardBlade  3%, made: rat  1%, calls adds 2.6/min

**The Great Ooze (greatOoze)**: hop 5.6/min 51%, oz.splitT 3.1/min 12%, roll 2.4/min 10%, status: poison  4%, heave 5.5/min 3%, status: burn  3%, brood 3.1/min 2%, made: slime  1%, knocked into a wall  0%, made: slimeSludge  0%, oz 1.1/min, landT 1.1/min, squashT 2.3/min

**Grave Warden (graveWarden)**: basic attack 19.8/min 93%, slam 7.5/min 7%, shield up 6.4/min

**The Bone King (boneKing)**: k.t 20.8/min 64%, made: rattler  21%, k.ghostT 2.5/min 7%, k.addT 3.1/min 2%, knocked into a wall  1%, made: ghost  0%, k.actT 0.9/min, k.cd 5.9/min, k.rowsCd 2.5/min, k.soulCd 4.2/min

**Old Frost (frostGiant)**: basic attack 18.7/min 53%, status: chill  19%, volley 5.5/min 10%, slam 6.2/min 8%, storm 9.2/min 8%, made: bat  1%, knocked into a wall  0%, calls adds 2.8/min

**The Winter Queen (winterQueen)**: fan 10/min 71%, nova 2.6/min 14%, basic attack  9%, status: chill  2%, wall 2.2/min 1%, lattice 1.5/min 1%, images 0.8/min 0%, knocked into a wall  0%

**Pit Lord (pitLord)**: basic attack 17.8/min 38%, status: burn  32%, whip 8.9/min 9%, nova 4.8/min 9%, slam 7/min 4%, rifts 3.7/min

**The Archfiend (archfiend)**: basic attack 24.9/min 55%, status: burn  25%, nova 4.2/min 11%, breath 6.3/min 5%, made: devil  3%, trident 1.4/min 0%, knocked into a wall  0%, calls adds 2.7/min

**Cinder, the Old Drake (cinder)**: scorch 2.9/min 42%, status: burn  24%, call 1.8/min 17%, lash 12/min 9%, bite 0.5/min 3%, rush 1.2/min 3%, cd.roarT 2/min 2%, cd.flipT 2.4/min, ring 1.5/min, cd.dripT 1/min

**Herald of Light (heraldLight)**: made: heraldFallen  38%, basic attack 19.1/min 36%, spear 7.9/min 9%, part 5.1/min 3%, gloom **never**

**The Radiant (radiant)**: basic attack 26.5/min 47%, smite 10.1/min 35%, ring 4.8/min 9%, made: cherub  6%, made: angel  3%, knocked into a wall  0%, raise 4.1/min, calls adds 2.8/min

**The Gilded Seraph (gildedSeraph)**: smite 10.6/min 49%, chains 2.7/min 18%, basic attack  15%, wheels 3.2/min 13%, horns 1.1/min 3%, gaze 0.8/min 1%, host 0.8/min 1%, an.hornT 1.1/min

**The Sand Wurm (sandWurm)**: sw.tellT 9.7/min 64%, sw.lungeT 5/min 36%, knocked into a wall  0%, made: scarab  0%, sw.underT 0.3/min

**The Great Engine (greatEngine)**: swat 7.1/min 36%, hand 12.3/min 31%, basic attack  13%, whirl 1.6/min 11%, status: burn  5%, press 0.2/min 3%, beam 0.8/min 1%, knocked into a wall  0%

## 8. Rats against a wolf

600 fights, 30 seeds each, in the Wildwood's arena.

| strength | rats | rats (cost) | wolves (cost) | rats win | wolves win | time | rats left | wolves left |
|---|---|---|---|---|---|---|---|---|
| rank 0 | Rat | 1 (1) | 1 (2) | 0% | 100% | 12.2 s | 0 | 1 |
| rank 0 | Rat | 2 (2) | 1 (2) | 100% | 0% | 12.7 s | 1.6 | 0 |
| rank 0 | Rat | 3 (3) | 1 (2) | 100% | 0% | 8.6 s | 2.9 | 0 |
| rank 0 | Rat | 4 (4) | 2 (4) | 93% | 7% | 12.7 s | 3.2 | 0.1 |
| rank 0 | Rat | 6 (6) | 3 (6) | 90% | 10% | 15 s | 3.6 | 0.2 |
| rank 0 | Plague Rat | 1 (1.3) | 1 (2) | 90% | 10% | 10.2 s | 0.9 | 0.1 |
| rank 0 | Plague Rat | 2 (2.6) | 1 (2) | 100% | 0% | 6.9 s | 2 | 0 |
| rank 0 | Plague Rat | 3 (3.9) | 1 (2) | 100% | 0% | 5.6 s | 2.9 | 0 |
| rank 0 | Plague Rat | 4 (5.2) | 2 (4) | 100% | 0% | 7.3 s | 3.9 | 0 |
| rank 0 | Plague Rat | 6 (7.8) | 3 (6) | 100% | 0% | 7.8 s | 5.4 | 0 |
| home | Rat | 1 (1) | 1 (2) | 100% | 0% | 11 s | 1 | 0 |
| home | Rat | 2 (2) | 1 (2) | 100% | 0% | 6.5 s | 2 | 0 |
| home | Rat | 3 (3) | 1 (2) | 100% | 0% | 4.7 s | 3 | 0 |
| home | Rat | 4 (4) | 2 (4) | 100% | 0% | 6.6 s | 4 | 0 |
| home | Rat | 6 (6) | 3 (6) | 100% | 0% | 7.8 s | 6 | 0 |
| home | Plague Rat | 1 (1.3) | 1 (2) | 100% | 0% | 8.2 s | 1 | 0 |
| home | Plague Rat | 2 (2.6) | 1 (2) | 100% | 0% | 5 s | 2 | 0 |
| home | Plague Rat | 3 (3.9) | 1 (2) | 100% | 0% | 3.9 s | 3 | 0 |
| home | Plague Rat | 4 (5.2) | 2 (4) | 100% | 0% | 5.3 s | 4 | 0 |
| home | Plague Rat | 6 (7.8) | 3 (6) | 100% | 0% | 5.8 s | 6 | 0 |

As battle mode builds them:

| strength | kind | home | cost | pack | health | blow | attack every (s) | damage a second | speed |
|---|---|---|---|---|---|---|---|---|---|
| rank 0 | Rat | sewers | 1 | 2-4 | 27 | 2.7 | 0.85 | 3.2 | 176 |
| rank 0 | Plague Rat | sewers | 1.3 | - | 27 | 2.7 | 0.85 | 3.2 | 176 |
| rank 0 | Wolf | wildwood | 2 | 2-3 | 39 | 3.4 | 1 | 3.4 | 168 |
| home | Rat | sewers | 1 | 2-4 | 77 | 5.4 | 0.85 | 6.4 | 176 |
| home | Plague Rat | sewers | 1.3 | - | 77 | 5.4 | 0.85 | 6.4 | 176 |
| home | Wolf | wildwood | 2 | 2-3 | 39 | 3.4 | 1 | 3.4 | 168 |

