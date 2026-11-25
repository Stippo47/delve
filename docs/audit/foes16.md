# Enemy prices (round 17, lane foes16)

The designer's asks: a wolf loses to a slime (slimes too much health, the wolf maybe too little damage); every enemy's
price scaled to the first floor of the first dungeon, all in the same price range and strength, with the room, floor and
dungeon doing the scaling; the very first room could hold a major, and should elites and majors take from a room's value
pool?

What changed in the game, in short:
- **js/prices.js** (new): every enemy kind's cost, pack, health factor and hit factor, in one list. The defs no longer
  carry `cost` or `pack`; dungeon.js's old fallback table (`OLD_COST`, `OLD_PACK`) is gone.
- **Every kind is worth about the same per cost point at the Wildwood's first floor**: 120 of 123 kinds within 0.80-1.25
  of the Bandit, against 31 of 123 before (the three outside are below; see "What's left").
- **RANK_MULT re-set** so each dungeon is about as hard as it was (the later dungeons' kinds were much stronger per cost,
  and that strength now comes from the multiplier).
- **Elites and majors take from the room's budget** (x3 and x7 of their kind's cost), and a gradual start: no elites
  in the Wildwood's first two rooms, no majors on its first floor.
- The Gilded Golem's mirror sends back half the shot (it sent back all of it: the biggest outlier in the round 16 audit).

## The yardstick

One number for every kind, measured the same way: **its worth per cost point against the Bandit's**, at one strength:
rank 0, the Wildwood's first floor, its first room (mult 0.75, battle mode's "scaled" off). The Bandit (bandit, cost 3)
is the ruler and is never tuned, so 1.00 means "as strong for its price as a Bandit". The band is 0.80-1.25.

Two measures, put together as a geometric mean (tools/audit/foes16/worth.mjs):
- **Against heroes (panel).** A pack of about 12 cost points against one hero at a time (paladin, berserker, archer,
  pyromancer at tier I), the hero kept on its feet until it has killed them all. The toll they take off it (status
  damage too: poison, burn and the rest count) is divided by Cn x (Cn + c), Cn the pack's cost and c one's: a hero
  killing n of them one by one takes about dps x health x n(n+1)/2, so this is the toll's own size per cost point,
  squared (big single things and swarms come out on the same footing). The four heroes' tolls go together as a
  geometric mean, so one matchup a hero can't win (a tier I archer against a Gilded Golem's mirror) doesn't swamp it.
- **Against enemies (duel).** About 12 cost points of the kind against Bandits of the same cost, sides swapped every
  other fight. Lanchester's square law: the winner keeps sqrt(1 - weaker/stronger) of its strength, so the health each
  side has left gives the strength ratio. Capped at 1.6: a shooter that kites Bandits wins untouched however weak it is.
- **Helpers** (the spirits, the Wisp, the Drummer, the Choir Sprite, the Repair Drone, the Brain Leech) do no harm of
  their own, so they are judged in a group of the kind each one helps in its dungeon (the Wisp with wolves, the Repair
  Drone with automatons, the healing and ward spirits with angels...): about 3 points of the helper added to a group of
  about 12 points, against 3 more points of the partner, against the hero panel and in the duel; times the partner's
  own worth. A helper's price moves by its cost (its health and hit hardly matter).

Each kind's numbers are the geometric mean of two to four batches on different dice (6 seeds a hero or a duel each),
so about 12-24 fights a measure; the same kind measured on two sets of dice differs by about 10%, sometimes 20% for the
big single things. A kind is "within the band" on that average.

How a kind is set: its strength per cost point goes, to first order, as its health x its damage (the square law again),
so a kind at worth W got its health and hit each x (1/W)^(1/2) (damped, over six rounds), measured again, and so on.
- **hp** multiplies the def's health; **hit** multiplies everything it does (its blows and its moves' blows, through
  `dmgMul` in sim.js spawn, and the statuses those carry, in sim.js addStatus). Moves and brains are untouched.
- **cost** moved where a kind's role needed it: a big thing that brings more with it costs more (the Big Slime splits
  into two Slimes: 5 -> 7; the Rat King calls rats: 8 -> 11; the Gilded Golem 9 -> 12), the nasty poisoners cost more
  (Cobra 3.5 -> 5, Green Crab 3.5 -> 4.5, Sand Mage 5 -> 6.5), and the bombers, the slimelet and the things that are
  mostly a nuisance are cheaper and come in more numbers (Dynamite Mouse 1.5 -> 1, Suicide Bomber 2.5 -> 1.5, Slimelet
  1 -> 0.6 and now in packs of 2-3, Sproutling 1.5 -> 1, Mortar 4 -> 3, Laser Turret 4 -> 3, Icicle Wraith 4 -> 2...).
  Costs still sit in one range across all dungeons: 0.6 to 12, most 2-8, the same in the Foundry as in the Wildwood.

Every kind now has its own `cost` (and `pack` where it comes in groups) in prices.js; the rat, slime and slimelet,
which had theirs from dungeon.js's fallback table, too. A kind with no price at all (a summon) counts as 3.

### Wolf, slime, rats

The designer's cases, set by their own fights after the yardstick (the table at the end): a lone Wolf now beats a lone
Slime of the same cost (23 of 30; it lost 30 of 30), and two Rats against a cost-equal Wolf are about even (11-19; they
won 30 of 30). The Wolf got its damage up (hit x1.5, health x1.45: the designer's "too little damage"), the Slime its
health down (x0.38, so 34 at mult 1 where it had 92; hit x0.68: since the slime lane's hops its landing does the
damage, and it measured much stronger after them). Wolves win in groups too now (3 against 3: 18-12; it was 0-30).
Small cost-matched fights swing hard on matchups, though: 3 Wolves now beat 2 Bandits (cost 6 each) 28 of 30 (they lost
30 of 30), while the yardstick has the Wolf at 1.10 and the Bandit at 1.00; with 12 points a side it is about even.
Packs of fast biters do better against a few slow fighters than their worth says, and the other way round.

## Elites and majors take from the room's budget

An elite costs its kind's cost x3 from the room's budget and a major x7, the same multipliers as the XP they give. A
group of enemies (each pack of the room's first lot, each wave, a boss's adds) is rolled as plain kinds first; then each
may turn elite or major with the usual chances, and what that costs on top is paid with the group's other plain ones,
the last rolled first, so a room with an elite has fewer others. What a group can't pay, the room owes, and its next
wave comes that much smaller. The last wave, a treasure room and a boss's adds can't owe: there a major that doesn't
fit comes as an elite, and an elite that doesn't fit comes plain. The elite room's own elites, the mini-bosses and
?elites / ?majors (testing) cost nothing, as before. The "no wave smaller than the last" rule counts the plain roll,
before the elites take their share.

A gradual start: on the Wildwood's first floor there are no elites in its first two rooms, a quarter of the usual chance
in the third, rising to the full chance by the sixth, and no majors at all; majors come from the Wildwood's second floor,
and from the first floor of every later dungeon. (dungeon.js eliteP, majorP, takeRanks.)

The convoy mode keeps its own elite odds (convoy.js); not touched.

## RANK_MULT

Before, RANK_MULT folded in how strong each dungeon's own kinds were: the Spire's and the Foundry's kinds were strong for
their cost, so their numbers sat lower than their place in the list. Now every kind is at the yardstick, so all of a
dungeon's strength is the multiplier, and it is re-set to keep each dungeon about as hard as it was:

| dungeon | before | after |
|---|---|---|
| The Wildwood | 0.75 | 0.75 (the yardstick) |
| The Warren | 2 | 2.15 |
| The Sewers | 2.75 | 3.82 |
| The Crypt | 3.2 | 3.96 |
| The Frost Hollow | 3.75 | 4.03 |
| The Ember Deep | 4 | 5.22 |
| The Gilded Spire | 3.95 | 5.6 |
| The Sunken Dunes | 4.6 | 6.5 |
| The Clockwork Foundry | 4.2 | 7 |

They now run in order, easiest first, as the dungeons open. FLOOR_STEP (0.3), ROOM_STEP (0.035) and the depth step are
unchanged. **R12_MULT** keeps the old numbers for what isn't priced: a designed boss and everything it makes (its parts,
its drums and images) fight at the old strength, as the boss lanes tuned them (a priced kind a boss calls up, and a
boss room's adds, come at the new one: sim.js spawn, `w.priceMult`); the rooms' own hazards (the splash and holy
zones) and the XP a kill gives use it too, so the levelling pace doesn't move. Battle mode builds a boss at R12_MULT
when "scaled" is on; the convoy's end boss too, and the convoy's XP.

How it was matched (tools/audit/foes16/dungeons.mjs): a fixed party (paladin, archer, cleric, twinfang) at the level
the round 12 campaign goes into each floor with, points spent by autoSpend, no trinkets or potions, starting at each
floor in turn; "rooms" is the rooms it wins on that floor (7 = the floor and its mini-boss or boss), 40 runs a floor.
Each dungeon was measured before (main at 0.21.3, with the slime hops and the bug fixes, old prices) and with the new
prices at RANK_MULT x1, x1.25 and x1.5, and the multiplier read off where its average rooms a floor matched the
before. Then checked: the batch below at a step before the final numbers, and a second batch of 60 runs a floor on
other dice, before and after side by side, for the three that moved after it:

| dungeon (60 runs a floor, other dice) | before | after |
|---|---|---|
| The Warren (2.15) | 5.35 (6.97 / 5.28 / 3.80) | 5.41 (6.98 / 5.38 / 3.87) |
| The Clockwork Foundry (7) | 4.83 (6.88 / 5.40 / 2.22) | 4.83 (6.63 / 4.55 / 3.30) |
| The Gilded Spire | 4.31 (6.82 / 3.52 / 2.60) | 5.19 at 5.15, 4.85 at 5.4 (6.13 / 5.03 / 3.40) |

The Spire is set at 5.6, read off between its measured points (5.29, 5.15 and 5.4 on two sets of dice: it is the
noisiest; 5.4 came out about 0.4 rooms a floor easier than before); not measured at 5.6 itself.

The Wildwood is too easy for that party (it wins most floors), so it was matched with the three starters at level 1
instead, 60 runs a floor: before 5.32 / 3.88 / 2.60 rooms, after 6.30 / 4.13 / 2.23 at 0.75. Its first floor is easier
on purpose (no elites in its first rooms, no majors); floors 2 and 3 together are where they were (3.24 before, 3.18
after), so its multiplier stays 0.75 and the yardstick with it.

What one multiplier per dungeon can't do: keep each floor's shape. A floor's roster used kinds of different worth, so
inside a dungeon some floors moved against the others: the Foundry's and the Spire's third floors are easier than
they were and their first and second floors harder (their floor 3 kinds were the over-strong ones), the Warren's,
Crypt's and Spire's first floors a bit harder. FLOOR_STEP is one number for every dungeon, so this is left for the
designer's playtest.

## Battle mode

battleFoe builds each kind at its home dungeon's first-floor strength (RANK_MULT of its dungeon) when "scaled" is on,
and at RANK_MULT[0] (0.75, the yardstick) when it is off. Since every kind now has the same worth per cost at the
yardstick, two kinds from different dungeons differ, scaled, only by their dungeons' strength: a Sewers Rat scaled is
at RANK_MULT[2] against a Wildwood Wolf at 0.75, so one Rat (cost 1) still beats one Wolf (cost 2) scaled, as a Sewers
enemy should; with "scaled" off the two are priced fairly against each other (the cases at the end).

## What's left, and what's unsure

- **Statuses don't scale with the dungeon.** An enemy's blows grow with its dungeon's strength, its poison and burn
  don't (sim.js addStatus has no dungeon factor; heroes' health doesn't grow with the dungeon either). So a kind whose
  harm is mostly status (the Cobra, the Green Crab, the gas and fire mortars, the Hellhound) is worth its price at the
  yardstick but relatively less in its own, deeper dungeon. Worth a call: let enemy statuses grow with blows.
- **Three kinds outside the band**, all below: the Frost Spirit (0.61), the Storm Spirit (0.53) and the Saw Blade
  (0.10). The two spirits are at the lowest helper price (cost 1) and add almost nothing measurable even to the kind
  they help; what's left is for their moves. The Saw Blade is a trap: battle mode can't measure it (it never counts as
  standing), so it keeps its cost 2.5 and its numbers.
- **Helpers are the noisiest measure** (a helper's worth moved by half between batches on different dice).
- **Floors inside a dungeon**: one RANK_MULT per dungeon matches each dungeon's average, not each floor's shape. Floor
  rosters used kinds of different worth, so some floors moved against the others (the table of floors below).
- **The slime numbers** were re-measured after the slime lane (hops, landing damage) merged.
- The Gilded Golem: even with half its mirror a tier I archer can't kill it alone (its front sends the arrows back);
  its price (cost 12, health and hit x0.51) is set on the geometric mean of the four heroes, so it is weak against melee (0.6 in the duel) and still strong against a lone shooter.
- The battle-mode trinkets on elites and majors are untouched.

## Files

- js/prices.js (new): the price list. js/units.js applies it over the defs (before the round 6 feel numbers).
- js/dungeon.js: costOf / packOf from the defs (no fallback table); takeRanks (elites and majors from the budget);
  eliteP / majorP with the gradual start; RANK_MULT and R12_MULT (`w.worldMult`, `w.priceMult`) for bosses, hazards, XP.
- js/sim.js: `hitMul` in spawn (dmgMul) and addStatus; the mirror's `mirrorDmg`; `w.priceMult` in spawn (a boss room).
- js/foes10.js: the Gilded Golem's `mirrorDmg: 0.5`.
- js/battle.js, js/convoy.js: a boss (and the convoy's end boss) at R12_MULT; the convoy's XP at the old strength.
- js/wildwood.js, js/foes.js, js/foes9.js, js/foes10.js, js/dunes.js, js/foundry.js, js/enemies.js: `cost` and `pack`
  taken out of the defs (they live in prices.js).
- tools/audit/foes16/: worth.mjs (the yardstick), dungeons.mjs (a fixed party floor by floor), checks.mjs (the
  designer's cases), price.mjs (moves prices.js towards 1.00), par.mjs (runs a tool once per dungeon side by side),
  combine.mjs (puts batches on different dice together), show.mjs, recap.mjs, setp.py, report.mjs (the tables below).
- docs/audit/data/foes16/: worth-before.json and worth-final.json (the yardstick, before and after), dungeons-*.json,
  wild-probe-*.json, checks-*.json, old-prices.json; the batches in between.

<!-- tables -->

## The table: every kind

Health and damage are the def's, after the round 6 feel numbers (health x2), before any dungeon strength: what a kind has at mult 1. "dmg" is its plain blow (its moves' blows and statuses move by the same "hit" factor). At the yardstick (mult 0.75) a blow lands at 0.68x that and health is 0.75x. Worth is per cost point against the Bandit (1.00); the band is 0.80-1.25. H: a helper, measured in a group of the kind it helps.

### The Wildwood

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Wolf (wolf) | 2 | 2-3 | 52 | 5 | 0.67 | -> | 2 | 2-3 | 76 | 7.5 | 1.50 | 1.10 |
| Slime (slime) | 2 | - | 92 | 8 | 1.34 | -> | 2 | - | 34 | 5.4 | 0.68 | 1.13 |
| Goblin (goblin) | 2 | 2-3 | 44 | 5 | 0.56 | -> | 2 | 2-3 | 60 | 6.9 | 1.38 | 0.93 |
| Orange Goblin (goblinOrange) | 2 | 2-3 | 44 | 5 | 1.15 | -> | 2 | 2-3 | 36 | 4.1 | 0.83 | 0.90 |
| Big Slime (slimeBig) | 5 | - | 224 | 11 | 1.91 | -> | 7 | - | 142 | 7.4 | 0.67 | 0.93 |
| Poison Slime (slimePoison) | 3 | - | 100 | 8 | 1.51 | -> | 3 | - | 74 | 4.7 | 0.59 | 1.24 |
| Bandit (bandit) | 3 | - | 104 | 9 | 0.91 | -> | 3 | - | 104 | 9 | 1.00 | 0.91 |
| Knife Bandit (banditDagger) | 3 | - | 80 | 5 | 1.03 | -> | 3 | - | 70 | 4.4 | 0.88 | 0.85 |
| Spear Bandit (banditSpear) | 3 | - | 104 | 10 | 0.79 | -> | 3 | - | 114 | 10.9 | 1.09 | 0.86 |
| Torch Bandit (banditTorch) | 3 | - | 104 | 9 | 0.78 | -> | 3 | - | 114 | 9.9 | 1.10 | 0.89 |
| Axe Bandit (banditAxe) | 4 | - | 104 | 12 | 0.49 | -> | 4 | - | 144 | 16.6 | 1.38 | 0.97 |
| Greatsword Bandit (banditGreat) | 4 | - | 140 | 16 | 0.66 | -> | 4 | - | 184 | 21.1 | 1.32 | 0.87 |
| Poacher (poacher) | 4 | - | 88 | 7 | 1.92 | -> | 4 | - | 56 | 4.4 | 0.63 | 0.95 |
| Bandit Brute (banditBrute) | 7 | - | 300 | 15 | 0.71 | -> | 7 | - | 370 | 18.5 | 1.23 | 0.91 |
| Ent (ent) | 9 | - | 440 | 15 | 0.73 | -> | 9 | - | 542 | 18.5 | 1.23 | 0.89 |
| Sproutling (sproutling) | 1.5 | 3-4 | 40 | 5 | 0.38 | -> | 1 | 3-4 | 68 | 8.4 | 1.68 | 0.92 |
| Wisp (wisp) H | 3 | - | 52 | 0 | 0.15 | -> | 1 | - | 74 | 0 | 1.44 | 0.80 |
| Dire Wolf (direWolf) | 4 | 1-2 | 124 | 9 | 0.85 | -> | 4 | 1-2 | 128 | 9.3 | 1.03 | 0.88 |
| Thornback Boar (boar) | 5 | - | 176 | 10 | 0.49 | -> | 5 | - | 272 | 15.4 | 1.54 | 0.88 |

### The Warren

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Mouse (mouse) | 0.8 | 2-4 | 24 | 3 | 0.71 | -> | 0.8 | 2-4 | 30 | 3.8 | 1.26 | 0.93 |
| Spear Goblin (goblinSpear) | 2 | 2-3 | 44 | 5 | 1.71 | -> | 2 | 2-3 | 30 | 3.5 | 0.69 | 0.99 |
| Goblin Bomber (goblinBomber) | 2.5 | 2-3 | 44 | 5 | 0.40 | -> | 2 | 2-3 | 88 | 10 | 2.01 | 0.87 |
| Dynamite Mouse (dynamouse) | 1.5 | 1-2 | 24 | 0 | 0.26 | -> | 1 | 1-2 | 52 | 0 | 2.17 | 0.87 |
| Hobgoblin (hobgoblin) | 3 | - | 120 | 8 | 0.76 | -> | 3 | - | 130 | 8.6 | 1.08 | 0.89 |
| Orc (orc) | 5 | - | 180 | 14 | 0.53 | -> | 5 | - | 274 | 21.3 | 1.52 | 0.91 |
| Orc Shaman (orcShaman) | 5 | - | 120 | 5 | 1.50 | -> | 5 | - | 82 | 3.5 | 0.69 | 0.92 |
| Wolf Rider (wolfRider) | 5 | - | 128 | 9 | 0.93 | -> | 5 | - | 144 | 10.2 | 1.13 | 0.91 |
| Drummer (drummer) H | 3 | 2-3 | 60 | 5 | 0.31 | -> | 2.3 | 2-3 | 82 | 6.8 | 1.36 | 0.99 |
| Suicide Bomber (goblinSuicide) | 2.5 | 2-3 | 52 | 5 | 0.25 | -> | 1.5 | 2-3 | 96 | 9.2 | 1.83 | 0.94 |
| Frost Shaman (frostShaman) | 5 | - | 120 | 5 | 1.30 | -> | 5 | - | 82 | 3.4 | 0.68 | 0.88 |
| Troll (troll) | 8 | - | 340 | 16 | 0.53 | -> | 8 | - | 470 | 22.1 | 1.38 | 0.85 |
| Rock Troll (rockTroll) | 9 | - | 380 | 16 | 1.03 | -> | 9 | - | 358 | 15 | 0.94 | 0.97 |
| Ogre (ogre) | 8 | - | 320 | 18 | 0.52 | -> | 8 | - | 512 | 28.8 | 1.60 | 0.90 |

### The Sewers

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Rat (rat) | 1 | 2-4 | 36 | 4 | 0.99 | -> | 1 | 2-4 | 42 | 4.5 | 1.12 | 1.18 |
| Plague Rat (ratPlague) | 1.3 | - | 36 | 4 | 1.66 | -> | 1.3 | - | 22 | 2.5 | 0.63 | 1.09 |
| Sludge Slime (slimeSludge) | 3 | - | 116 | 8 | 0.91 | -> | 3 | - | 122 | 11.4 | 1.42 | 1.15 |
| Slimelet (slimeSmall) | 1 | - | 32 | 4 | 0.65 | -> | 0.6 | 2-3 | 30 | 5.8 | 1.45 | 1.14 |
| Blood Leech (leechBlood) | 2 | - | 44 | 3 | 0.62 | -> | 2 | - | 64 | 4.3 | 1.44 | 1.06 |
| Lizard Blade (lizardBlade) | 3 | - | 104 | 8 | 0.88 | -> | 3 | - | 114 | 8.7 | 1.09 | 0.99 |
| Lizardman (lizardman) | 5 | - | 128 | 10 | 0.47 | -> | 5 | - | 232 | 18.1 | 1.81 | 0.94 |
| Sewer Crab (crab) | 3 | 1-3 | 76 | 7 | 0.87 | -> | 3 | 1-3 | 80 | 7.4 | 1.06 | 0.97 |
| Blue Crab (crabBlue) | 3 | 1-3 | 76 | 7 | 1.58 | -> | 3 | 1-3 | 58 | 5.3 | 0.75 | 1.03 |
| Croc (croc) | 6 | - | 220 | 9 | 0.58 | -> | 6 | - | 316 | 13 | 1.44 | 0.90 |
| Brain Leech (leechBrain) H | 3 | - | 48 | 0 | 0.35 | -> | 1 | - | 70 | 0 | 1.44 | 0.91 |
| Green Crab (crabGreen) | 3.5 | 1-3 | 76 | 7 | 2.97 | -> | 4.5 | 1-3 | 42 | 3.9 | 0.55 | 0.99 |
| Rat King (ratKing) | 8 | - | 200 | 9 | 2.05 | -> | 11 | - | 72 | 3.2 | 0.36 | 1.12 |
| Hunter Spider (spiderHunter) | 3 | - | 80 | 6 | 1.11 | -> | 3 | - | 70 | 5.3 | 0.88 | 0.96 |
| Fire Slime (fireSlime) | 4 | - | 100 | 8 | 0.61 | -> | 3 | - | 108 | 12.9 | 1.61 | 1.13 |

### The Crypt

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Rattler (rattler) | 3 | - | 100 | 10 | 0.47 | -> | 3 | - | 146 | 14.6 | 1.46 | 0.86 |
| Bone Archer (rattlerBow) | 3 | - | 72 | 7 | 1.74 | -> | 3 | - | 48 | 4.6 | 0.66 | 0.99 |
| Harrowing Skeleton (rattlerHarrow) | 4 | - | 100 | 10 | 0.75 | -> | 4 | - | 114 | 11.4 | 1.14 | 0.86 |
| Ghost (ghost) | 3 | - | 80 | 6 | 0.39 | -> | 3 | - | 140 | 10.6 | 1.76 | 0.90 |
| Bone Spear (rattlerSpear) | 3 | - | 92 | 11 | 0.62 | -> | 3 | - | 116 | 14 | 1.27 | 0.92 |
| Loose Jaw (rattlerMace) | 4 | - | 120 | 14 | 0.43 | -> | 4 | - | 210 | 24.5 | 1.75 | 0.94 |
| Golden Skeleton (rattlerGold) | 5 | - | 170 | 10 | 2.47 | -> | 5 | - | 94 | 5.5 | 0.55 | 0.99 |
| Gaper (gaper) | 6 | - | 180 | 11 | 0.54 | -> | 6 | - | 274 | 16.7 | 1.52 | 0.85 |
| Banshee (banshee) | 5 | - | 120 | 7 | 0.73 | -> | 5 | - | 140 | 8.1 | 1.16 | 0.89 |
| Brute (brute) | 7 | - | 280 | 17 | 0.81 | -> | 7 | - | 292 | 17.7 | 1.04 | 0.89 |

### The Frost Hollow

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Frost Wolf (frostWolf) | 2.5 | 2-3 | 60 | 5 | 0.72 | -> | 2.5 | 2-3 | 74 | 6.1 | 1.22 | 0.97 |
| Cave Bat (bat) | 2 | 2-4 | 44 | 4 | 0.53 | -> | 2 | 2-4 | 68 | 6.2 | 1.56 | 0.96 |
| Snowman (snowman) | 4 | - | 112 | 6 | 0.84 | -> | 4 | - | 128 | 6.9 | 1.15 | 0.94 |
| Ice Slime (slimeIce) | 3 | - | 108 | 8 | 0.61 | -> | 3 | - | 126 | 14.3 | 1.79 | 0.99 |
| Frost Spirit (spiritFrost) H | 2.5 | - | 60 | 0 | 0.31 | -> | 1 | - | 80 | 0 | 1.32 | **0.61** |
| Frost Spider (spiderFrost) | 3 | - | 80 | 6 | 0.65 | -> | 3 | - | 96 | 7.2 | 1.20 | 0.91 |
| Momma Spider (spiderMomma) | 6 | - | 180 | 6 | 0.45 | -> | 5 | - | 274 | 9.1 | 1.52 | 1.00 |
| Icicle Wraith (frostWraith) | 4 | - | 88 | 6 | 0.24 | -> | 2 | - | 168 | 11.4 | 1.90 | 1.04 |
| Yeti (yeti) | 8 | - | 360 | 15 | 0.80 | -> | 8 | - | 446 | 18.6 | 1.24 | 1.08 |

### The Ember Deep

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Imp (imp) | 2 | 2-3 | 52 | 4 | 2.28 | -> | 2 | 2-3 | 32 | 2.4 | 0.60 | 1.09 |
| Cinder Bat (cinderBat) | 2 | 2-3 | 40 | 4 | 0.63 | -> | 2 | 2-3 | 76 | 7.6 | 1.90 | 0.99 |
| Hellhound (hellhound) | 3 | 2-3 | 80 | 7 | 1.58 | -> | 3 | 2-3 | 60 | 5.3 | 0.75 | 1.08 |
| Fire Spirit (spiritFire) H | 2.5 | - | 60 | 0 | 0.82 | -> | 2.7 | - | 48 | 0 | 0.80 | 0.94 |
| Devil (devil) | 5 | - | 140 | 11 | 0.61 | -> | 5 | - | 198 | 15.6 | 1.42 | 0.97 |
| Dragonborn (dragonborn) | 7 | - | 220 | 15 | 0.69 | -> | 7 | - | 278 | 18.9 | 1.26 | 0.93 |
| Fire Spider (spiderFire) | 3.5 | - | 80 | 6 | 1.44 | -> | 3.5 | - | 62 | 4.7 | 0.78 | 1.03 |
| Succubus (succubus) | 5 | - | 120 | 9 | 1.13 | -> | 5 | - | 112 | 8.5 | 0.94 | 1.18 |
| Demon (demon) | 8 | - | 300 | 17 | 0.59 | -> | 8 | - | 472 | 26.7 | 1.57 | 1.00 |

### The Gilded Spire

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cherub (cherub) | 2 | 2-3 | 48 | 4 | 2.18 | -> | 2 | 2-3 | 26 | 2.2 | 0.56 | 0.93 |
| Angel (angel) | 5 | - | 160 | 10 | 0.64 | -> | 5 | - | 220 | 13.7 | 1.37 | 0.92 |
| Sun Blade (sunBlade) | 4 | - | 92 | 9 | 0.40 | -> | 3 | - | 152 | 14.9 | 1.65 | 0.99 |
| Choir Sprite (choirSprite) H | 3.5 | - | 68 | 0 | 0.45 | -> | 2.3 | - | 74 | 0 | 1.10 | 1.24 |
| Seraph (seraph) | 5 | - | 120 | 7 | 1.84 | -> | 5 | - | 80 | 4.6 | 0.66 | 0.94 |
| Fallen Angel (angelFallen) | 5 | - | 160 | 10 | 0.64 | -> | 5 | - | 210 | 13.1 | 1.31 | 0.94 |
| Light Spirit (spiritHeal) H | 2.5 | - | 60 | 0 | 0.83 | -> | 1.8 | - | 72 | 0 | 1.20 | 1.10 |
| Gilded Golem (gildedGolem) | 9 | - | 360 | 17 | 4.74 | -> | 12 | - | 184 | 8.7 | 0.51 | 1.05 |
| Golem (golem) | 8 | - | 420 | 17 | 1.00 | -> | 8 | - | 412 | 16.7 | 0.98 | 0.96 |
| Ward Spirit (spiritWard) H | 2.5 | - | 60 | 0 | 0.93 | -> | 2.7 | - | 66 | 0 | 1.10 | 1.02 |

### The Sunken Dunes

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Scarab (scarab) | 1.5 | 3-5 | 36 | 3 | 0.72 | -> | 1.5 | 3-5 | 46 | 3.9 | 1.30 | 1.00 |
| Cobra (cobra) | 3.5 | - | 80 | 5 | 2.74 | -> | 5 | - | 50 | 3.1 | 0.62 | 1.15 |
| Golden Scarab (scarabGold) | 2.5 | 1-2 | 80 | 3 | 0.90 | -> | 2.5 | 1-2 | 84 | 3.2 | 1.05 | 0.95 |
| Sand Serpent (sandSerpent) | 7 | - | 300 | 10 | 0.60 | -> | 7 | - | 382 | 12.7 | 1.27 | 0.90 |
| Wind Spirit (spiritHaste) H | 2.5 | - | 60 | 0 | 0.65 | -> | 1 | - | 70 | 0 | 1.18 | 0.80 |
| Jackal Guard (jackal) | 5 | - | 144 | 11 | 0.98 | -> | 5 | - | 144 | 11 | 1.00 | 0.98 |
| Mummy (mummy) | 6 | - | 220 | 11 | 0.51 | -> | 6 | - | 332 | 16.6 | 1.51 | 0.99 |
| Dart Trap (dartTrap) | 3 | - | 120 | 5 | 1.70 | -> | 3 | - | 82 | 3.4 | 0.68 | 1.05 |
| Venom Spirit (spiritPoison) H | 2.5 | - | 60 | 0 | 1.26 | -> | 3 | - | 50 | 0 | 0.84 | 1.17 |
| Sand Mage (sandMage) | 5 | - | 128 | 5 | 1.83 | -> | 6.5 | - | 66 | 2.6 | 0.51 | 1.15 |

### The Clockwork Foundry

| kind | cost | pack | hp | dmg | worth |  | cost | pack | hp | dmg | hit x | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Gear Sprite (gearSprite) | 2 | 1-2 | 60 | 6 | 0.70 | -> | 2 | 1-2 | 78 | 7.7 | 1.29 | 0.93 |
| Cog Sprite (cogSprite) | 2.4 | 1-2 | 72 | 6 | 1.24 | -> | 2.4 | 1-2 | 66 | 5.5 | 0.92 | 1.13 |
| Bomb Bot (bombBot) | 2.5 | 1-2 | 52 | 0 | 0.48 | -> | 2 | 1-2 | 92 | 0 | 1.75 | 0.92 |
| Copper Bee (bee) | 1.2 | 3-5 | 28 | 5 | 0.73 | -> | 1.2 | 3-5 | 34 | 6 | 1.20 | 0.90 |
| Copper Wasp (wasp) | 1.6 | 2-3 | 36 | 5 | 1.19 | -> | 1.6 | 2-3 | 32 | 4.4 | 0.87 | 1.08 |
| Drill Bot (drillBot) | 3.5 | - | 96 | 7 | 1.07 | -> | 3.5 | - | 88 | 6.4 | 0.91 | 0.92 |
| Saw Blade (sawBlade) | 2.5 | - | 1998 | 8 | 0.10 | -> | 2.5 | - | 1998 | 8 | 1.00 | **0.10** |
| Automaton (automaton) | 6 | - | 192 | 11 | 0.58 | -> | 6 | - | 294 | 16.8 | 1.53 | 0.97 |
| Steam Turret (turretSteam) | 3.5 | - | 140 | 6 | 2.13 | -> | 3.5 | - | 98 | 4.2 | 0.70 | 0.94 |
| Flame Turret (turretFlame) | 3.5 | - | 140 | 6 | 1.05 | -> | 3.5 | - | 124 | 5.3 | 0.88 | 0.94 |
| Gun Turret (turretGun) | 3.5 | - | 120 | 6 | 0.91 | -> | 3.5 | - | 120 | 6 | 1.00 | 0.91 |
| Mortar (mortar) | 4 | - | 144 | 6 | 0.32 | -> | 3 | - | 250 | 10.4 | 1.73 | 0.85 |
| Auto Bomb Bot (autoBomb) | 3 | 1-2 | 68 | 0 | 0.45 | -> | 2.5 | 1-2 | 150 | 0 | 2.20 | 0.90 |
| Repair Drone (repairDrone) H | 3 | - | 60 | 0 | 0.86 | -> | 6.5 | - | 82 | 0 | 1.38 | 1.00 |
| Bronze Bee (beeBronze) | 1.7 | 3-5 | 44 | 6.5 | 0.92 | -> | 1.7 | 3-5 | 48 | 7.1 | 1.09 | 0.99 |
| Bronze Wasp (waspBronze) | 2.2 | 2-3 | 58 | 6.5 | 1.62 | -> | 2.2 | 2-3 | 38 | 4.2 | 0.65 | 1.05 |
| Bronze Hornet (hornetBronze) | 3.6 | 1-2 | 84 | 7.8 | 1.40 | -> | 3.6 | 1-2 | 64 | 5.9 | 0.76 | 0.96 |
| Tesla Coil (teslaCoil) | 4.5 | - | 160 | 6 | 0.82 | -> | 4.5 | - | 182 | 6.8 | 1.14 | 0.99 |
| Foundry Smith (foundrySmith) | 8 | - | 320 | 13 | 1.03 | -> | 8 | - | 262 | 10.7 | 0.82 | 0.94 |
| Laser Turret (turretLaser) | 4 | - | 128 | 6 | 0.21 | -> | 3 | - | 290 | 13.6 | 2.27 | 0.89 |
| Fire Mortar (mortarFire) | 4.5 | - | 144 | 6 | 1.26 | -> | 4.5 | - | 92 | 3.8 | 0.64 | 0.95 |
| Gas Mortar (mortarPoison) | 4.5 | - | 144 | 6 | 1.03 | -> | 4.5 | - | 126 | 5.3 | 0.88 | 0.88 |
| Chain Crawler (chainCrawler) | 8 | - | 380 | 11 | 0.45 | -> | 7 | - | 620 | 17.9 | 1.63 | 1.07 |
| Steel Bee (beeSteel) | 2.3 | 3-5 | 68 | 8.5 | 1.45 | -> | 2.3 | 3-5 | 56 | 7 | 0.82 | 1.09 |
| Steel Wasp (waspSteel) | 3 | 2-3 | 86 | 8.5 | 1.80 | -> | 3 | 2-3 | 54 | 5.3 | 0.62 | 1.02 |
| Steel Hornet (hornetSteel) | 4.9 | 1-2 | 124 | 10.2 | 1.81 | -> | 4.9 | 1-2 | 84 | 6.9 | 0.68 | 1.05 |
| Storm Spirit (spiritShock) H | 2.5 | - | 60 | 0 | 0.24 | -> | 1 | - | 74 | 0 | 1.22 | **0.53** |

Within 0.80-1.25: 31 of 123 kinds before, 120 of 123 after.

### Per dungeon, the median kind

| dungeon | kinds | median worth before | after | lowest after | highest after |
|---|---|---|---|---|---|
| The Wildwood | 18 | 0.79 | 0.91 | 0.85 | 1.24 |
| The Warren | 13 | 0.71 | 0.91 | 0.85 | 0.99 |
| The Sewers | 14 | 0.91 | 1.06 | 0.90 | 1.18 |
| The Crypt | 10 | 0.73 | 0.90 | 0.85 | 0.99 |
| The Frost Hollow | 8 | 0.65 | 0.99 | 0.91 | 1.08 |
| The Ember Deep | 8 | 1.13 | 1.03 | 0.93 | 1.18 |
| The Gilded Spire | 7 | 1.00 | 0.94 | 0.92 | 1.05 |
| The Sunken Dunes | 8 | 0.98 | 1.00 | 0.90 | 1.15 |
| The Clockwork Foundry | 24 | 1.03 | 0.95 | 0.85 | 1.13 |

## Each dungeon, floor by floor

A fixed party (paladin, archer, cleric, twinfang) at the level the campaign goes into each floor with, points spent, no trinkets or potions, 40 runs a floor (this batch ran Warren, Spire and Foundry at RANK_MULT 2.27, 5.29 and 7.35, a step before the final numbers: see the second batch above); "rooms" is rooms won on that floor (7 = the floor and its mini-boss or boss).

| dungeon | floor | level | rooms before | after | floor won before | after |
|---|---|---|---|---|---|---|
| The Wildwood | 1 | 1 | 6.40 | 6.98 | 78% | 98% |
| The Wildwood | 2 | 4 | 6.53 | 6.95 | 68% | 95% |
| The Wildwood | 3 | 8 | 6.93 | 6.65 | 98% | 93% |
| The Warren | 1 | 11 | 6.75 | 6.83 | 88% | 83% |
| The Warren | 2 | 13 | 5.15 | 4.70 | 33% | 8% |
| The Warren | 3 | 15 | 3.85 | 3.38 | 35% | 8% |
| The Sewers | 1 | 17 | 4.65 | 5.30 | 23% | 30% |
| The Sewers | 2 | 19 | 3.65 | 3.68 | 10% | 0% |
| The Sewers | 3 | 22 | 1.60 | 1.48 | 3% | 0% |
| The Crypt | 1 | 24 | 6.33 | 6.15 | 85% | 65% |
| The Crypt | 2 | 27 | 3.68 | 4.15 | 20% | 33% |
| The Crypt | 3 | 30 | 2.17 | 1.65 | 10% | 3% |
| The Frost Hollow | 1 | 33 | 6.43 | 6.48 | 83% | 83% |
| The Frost Hollow | 2 | 35 | 4.45 | 4.70 | 3% | 10% |
| The Frost Hollow | 3 | 36 | 4.22 | 4.58 | 25% | 35% |
| The Ember Deep | 1 | 38 | 6.48 | 6.55 | 78% | 63% |
| The Ember Deep | 2 | 40 | 4.78 | 4.68 | 18% | 25% |
| The Ember Deep | 3 | 41 | 3.10 | 3.00 | 3% | 13% |
| The Gilded Spire | 1 | 43 | 6.83 | 6.43 | 85% | 53% |
| The Gilded Spire | 2 | 45 | 4.83 | 4.78 | 23% | 18% |
| The Gilded Spire | 3 | 47 | 2.73 | 2.45 | 15% | 10% |
| The Sunken Dunes | 1 | 49 | 6.68 | 6.75 | 90% | 93% |
| The Sunken Dunes | 2 | 50 | 4.88 | 3.88 | 35% | 23% |
| The Sunken Dunes | 3 | 52 | 3.20 | 3.93 | 23% | 25% |
| The Clockwork Foundry | 1 | 53 | 7.00 | 6.58 | 100% | 68% |
| The Clockwork Foundry | 2 | 55 | 4.95 | 3.75 | 63% | 18% |
| The Clockwork Foundry | 3 | 56 | 1.78 | 2.03 | 8% | 8% |

| dungeon | rooms a floor before | after | RANK_MULT before | after |
|---|---|---|---|---|
| The Wildwood | 6.62 | 6.86 | 0.75 | 0.75 |
| The Warren | 5.25 | 4.97 | 2 | 2.15 |
| The Sewers | 3.30 | 3.49 | 2.75 | 3.82 |
| The Crypt | 4.06 | 3.98 | 3.2 | 3.96 |
| The Frost Hollow | 5.03 | 5.25 | 3.75 | 4.03 |
| The Ember Deep | 4.79 | 4.74 | 4 | 5.22 |
| The Gilded Spire | 4.80 | 4.55 | 3.95 | 5.6 |
| The Sunken Dunes | 4.92 | 4.85 | 4.6 | 6.5 |
| The Clockwork Foundry | 4.58 | 4.12 | 4.2 | 7 |

## The designer's cases

30 fights each, sides swapped every other fight, in the Wildwood. Rank 0 (the yardstick) unless "scaled" (battle mode's default: each at its own dungeon's first floor).

| fight | cost | before (A wins - B wins) | after |
|---|---|---|---|
| 1 Wolf v 1 Slime | 2 v 2 -> 2 v 2 | 0-30 | 23-7 |
| 2 Wolf v 2 Slime | 4 v 4 -> 4 v 4 | 0-30 | 24-6 |
| 3 Wolf v 3 Slime | 6 v 6 -> 6 v 6 | 0-30 | 18-12 |
| 2 Rat v 1 Wolf | 2 v 2 -> 2 v 2 | 30-0 | 11-19 |
| 4 Rat v 2 Wolf | 4 v 4 -> 4 v 4 | 30-0 | 13-17 |
| 6 Rat v 3 Wolf | 6 v 6 -> 6 v 6 | 28-2 | 12-18 |
| 1 Rat v 1 Wolf | 1 v 2 -> 1 v 2 | 0-30 | 0-30 |
| 2 Plague Rat v 1 Wolf | 2.6 v 2 -> 2.6 v 2 | 30-0 | 13-17 |
| 1 Rat v 1 Wolf (scaled) | 1 v 2 -> 1 v 2 | 30-0 | 30-0 |
| 2 Rat v 1 Wolf (scaled) | 2 v 2 -> 2 v 2 | 30-0 | 30-0 |
| 4 Rat v 2 Wolf (scaled) | 4 v 4 -> 4 v 4 | 30-0 | 30-0 |
| 1 Bandit v 1 Wolf | 3 v 2 -> 3 v 2 | 30-0 | 30-0 |
| 2 Bandit v 3 Wolf | 6 v 6 -> 6 v 6 | 30-0 | 2-28 |
| 3 Slime v 2 Bandit | 6 v 6 -> 6 v 6 | 29-1 | 16-14 |
