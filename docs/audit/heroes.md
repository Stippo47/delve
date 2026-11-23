# Hero ability audit

Round 16, lane audit-heroes. Every hero, every ability, at tiers I, II and III, put through the same eleven fights, with a recorder counting what each part of the kit did. **Measured only: no numbers, rules or cooldowns were changed.** No tournament has been run yet.

59 heroes, 22,656 fights, 292 hours of fighting in the sim. Raw numbers: `docs/audit/data/heroes/<hero>.json`. Tools: `tools/audit/heroes/` (README at the top of each file).

## Findings (read this first)

### 1. Two real bugs found while measuring

**a. Battle mode ends a fight when the last fighter on a side ducks out of sight.** battle.js counts a side as beaten
when nobody on it is "fighting", and it leaves out anyone ethereal. Five heroes go ethereal as part of an ability:
the Digger (Burrow), the Falconer (Call the Flock), the Trapper (Bush), the Witch (Broom Ride) and the Shade (Shadow
Walk, and its shadow form). When that hero is alone, its own ability ends the battle as a **loss** on the spot. The
Digger's Bury does the same to a lone foe and the battle counts as a **win**. Out of 10,620 battles checked, 481 ended
this way, all of them these five heroes: the Digger in 74% of its battles, the Falconer 57%, the Trapper 56%, the
Witch 54%, the Shade 27%. Nearly every 1v1 against Wildmane and the Paladin ends this way for the Digger, the Trapper, the
Witch and the Falconer (the Digger's against shooters too). The dungeon is not affected. **Their battle numbers below
are as the game played them, so they are wrong for these five.** Re-measured with the fight allowed to go on (a
what-if in the test runner, not a game change; section 4), at tier II: the Digger wins 100% of its 1v1s instead of
54%, the Falconer 98% instead of 50%, the Witch 50% instead of 0%, the Trapper 44% instead of 0%; in the other
battles the Digger, Falconer, Witch and Shade go from 33-58% to 92-99%. This will also skew any tournament.

**b. The Archer's Frost Arrow is thrown away 29% of the time.** Frost Arrow draws for 0.45 s before it looses; Barrage
draws for 0.4 s. Both (and several other kits.js abilities) *replace* the hero's queue of things about to happen
instead of adding to it, so a Barrage cast inside Frost Arrow's draw deletes the frost arrow: cooldown spent, no
arrow. 723 of 2,502 Frost Arrows were lost that way, and 218 of 2,494 Barrages the other way round. No other hero
loses more than 1% (the others have only one ability that queues like this). tools/audit/heroes/queue-check.mjs shows
it plainly: 72 Frost Arrow casts, 35 arrows loosed.

### 2. Abilities that never fire, and why

- **Never, anywhere: Valkyrie's Call** (Valkyrie). It only goes when a friend is *down*. In battle mode nobody goes
  down (heroes die outright), so it can never fire there; on the dungeon floor no friend fell near her. 0 casts in
  384 fights.
- **Rare even with friends** (they wait for a friend in real trouble, and friends seldom get there while the ability
  is ready). Share of the ally fights (with a Paladin, with a Cleric) and dungeon floors it went off in, tiers I / II /
  III:

  | Ability (hero): what it waits for | With a Paladin | With a Cleric | Dungeon floor |
  | --- | --- | --- | --- |
  | Challenge (Dame): a friend under 40% | 8 / 83 / 67% | 50 / 8 / 17% | 13 / 0 / 0% |
  | Spear of the Sky (Valkyrie): a friend under 60% | 67 / 58 / 83% | 17 / 8 / 0% | 0 / 0 / 0% |
  | Guard (Paladin): a friend under 65% that a foe is hitting | 75 / 58 / 67% | 67 / 75 / 50% | 13 / 0 / 0% |
  | Swoop (Griffon): a friend under 60%, 130-480 away | 33 / 100 / 100% | 75 / 33 / 8% | 0 / 0 / 13% |
  | Old Tales (Grandpa): a friend with two abilities waiting | 100 / 50 / 33% | 33 / 33 / 8% | 100 / 25 / 0% |
  | Supply Crate (Quartermaster): the same | 100 / 25 / 0% | 75 / 50 / 50% | 100 / 50 / 63% |
  | Mending Ray (Cleric): a friend (not herself) under 80% | 92 / 92 / 75% | 92 / 100 / 83% | 63 / 0 / 0% |

  Mending Ray can't mend the Cleric herself, so alone it never fires; on the dungeon floor at tiers II and III her
  friends never dropped under 80%. Encore (Bard), Spirit Link (Shaman) and Blood Pact (Cultist, which needs *two*
  friends) are quiet alone but fire in nearly every fight with friends.
- **Whole kits that do nothing in a 1v1** (tier II, none of the three abilities in at least half the 1v1 fights):
  the **Valkyrie, the Bard and the Cultist**. Only one of three for the Paladin, Tower, Twinfang, Druid, Shade, Digger,
  Shaman, Warlock, Chef, Quartermaster, Werewolf and the Mob.
- **44 abilities wait for two or more foes close together** (Consecrate, Cleave, Shockwave, Flame Wall, Thunderclap,
  Lullaby, Entangle, Miasma, Ground Pound, Hold the Line, Fan of Knives, War Song, Call Wolf...; section 2 has them
  all). They are silent in every 1v1 and against the lone Ogre, by their score's design. Not a bug, but a 1v1
  tournament will undersell every hero who leans on one.
- The rest are quiet only where you would expect (a roll or a nova that waits for a foe in reach, a heal that waits for
  someone hurt, a pull that waits for a foe far enough away). Section 2 gives every quiet ability, where, how long it
  sat ready, and the condition in its score code.
- **Being busy is almost never the reason.** Across the quiet cells the hero was free for most of the time the
  ability sat ready; its score was simply under the bar. The exceptions: the Mob's Scatter and the Necromancer's Raise
  Dead, whose heroes were mid-move or stunned for about half of it.

### 3. Weakest and strongest kits

- **Fire least** (the average share of fights each of its abilities went off in, all tiers): Valkyrie 18%, Bard 44%,
  Cultist 49%, Quartermaster 51%, Paladin 53%, Chef 53%, Shaman 54%. **Fire most**: Bandit and Crossbowman 100%,
  Warhelm and Slinger 99%, Jester 97%, Monk 95%.
- **Whose worth is in their abilities** (tier II, the abilities' share of the value a minute of weapon + abilities +
  trait): Necromancer 79%, Bandit and the Mob 69%, Tower and Monk 66%, Warlock 65%. **Least**: Bard 3%, Beekeeper 5%,
  Warden 20%, Clockmaker 22%, Engineer 23%. Those lean on things the value can't count (the Bard's songs are speed,
  the Clockmaker's and the Warden's work is control) or are mis-credited (the Beekeeper's hive bees count as its
  weapon, point 4).
- **Abilities worth more than the weapon**: Haymaker's Hay Bale (3.7x the weapon at tier III), Necromancer's Life
  Drain (1.5-2.8x), Bandit's Dirty Trick (1.9x), Jester's Juggling Act (2x at III), Granny's Reap (2x at III), the
  Mob's Pile On (1.6-1.9x), Monk's Flurry (its heals, 1.2-1.6x), Marksman's Aimed Shot, Pirate's Point Blank, Frost
  Mage's Ice Shard (section 3 has all 21).
- **Abilities that fire but are worth next to nothing measured**: Twinfang's Dash (2-3% of her weapon; 89% of its
  casts leave nothing the recorder can see), Archer's Roll, Bard's Encore, Grandpa's Old Tales, Quartermaster's Supply
  Crate and Barricade, Beekeeper's Beehive (its bees count as the weapon), Engineer's Wind-up Drones (0-2%), Werewolf's
  Turn, Valkyrie's Spear of the Sky. Some work in ways that can't be counted (getting out of reach, cutting cooldowns,
  walls, speed); section 3 splits them from the control abilities (Lullaby, Entangle, Counting Sheep, Swap,
  Heartstring...) whose worth is in the seconds they hold foes.
- **Win rates** (tier II, the ten battle scenarios): Warhelm, Crossbowman, Javelin Huntress and Pirate won every
  battle; Bandit and Marksman 99%. The Cleric won 18%, the Witch and the Druid 23%, the Valkyrie 30% (supports are
  built for parties; the Witch's number is bug 1a). Tanks and supports lose most 1v1s at every tier (tanks 23-35%,
  supports 15-21%).

### 4. Smaller things worth knowing

- **The dungeon floor is too easy to tell heroes apart**: every hero cleared its first floor at every tier (the
  Wildwood's strength at I-II, the Warren's at III, as hero-vs.mjs uses). Heals and saves barely register there.
- **The game's own result card misnames some work** (stats.js sourceOf; the recorder traced these itself): the Chef's
  Hot Meal plates' healing, Wildmane's Rage lifesteal and the Beehive's bees are counted as the hero's weapon; shots a
  Monk (Inner Peace) or an Old Guard (Parry) send back are counted under the foe's ability's name or the weapon. Work
  that does no damage or healing (roots, charm, songs, cooldown cuts) doesn't show on it at all.
- **Still going when it comes off cooldown** (a flag for the cooldowns lane): Fireball's burning patches (63% of the
  times it came ready), War Song (54%), Caltrops, Sweetheart, Raise Dead's minions (52%), Point Blank's mark, Jaw Trap,
  Stormhammer's Whirled, Storm Born (40%).

### 5. Proposals (for the designer to rule on; nothing here was changed)

1. **Battle mode**: count a living unit that is only out of sight (ethereal or hidden) as still in the fight, so a
   fight ends only when a side has nobody alive. Do this before any tournament.
2. **Queued blows**: make the kits.js abilities that queue a blow add to the hero's queue (as kits2.js \'after()\'
   already does) instead of replacing it. Frost Arrow gets its arrows back.
3. **Valkyrie**: give Valkyrie's Call something to do in battle mode (a fallen friend there is dead), or make the
   Valkyrie a party-only hero on purpose. Spear of the Sky and Sky Dive could count the Valkyrie herself, as Sky Dive
   already does, so she isn't silent alone.
4. **Friend-in-trouble abilities** (Guard 65%, Challenge 40%, Swoop 60%, Spear of the Sky 60%): loosen the health
   line, or judge them in the planned 2v2s before changing anything. Mending Ray could be allowed on the Cleric.
5. **Group-only abilities**: decide whether 1v1 matters. If it does, give them a one-target version or a lower bar
   against a lone foe; if not, weight the tournaments towards groups and parties.
6. **Tournaments**: include the 2v2s with a Paladin each side (already planned) and a harder dungeon floor, so healers
   and supports show up; and fix bug 1a first or the five heroes above will be judged on fights they ended themselves.
7. **stats.js** (the result card only, no game change): name the work in point 4 after the ability that did it.

## How it was measured

- **Tiers** are the battle page's tiers (the same as the Book): tier I is the first shell of the skill web, every ability at tier I and the stat nodes beside them; tier II the second shell; tier III the whole web. No trinkets, no potions. The same build in the dungeon.
- **Fights**: 12 seeds per battle cell, 8 per dungeon cell (the dungeon rotates the Wildwood, the Warren, the Crypt and the Sewers). Battles stop at 120 s (counted as a timeout), the dungeon at 600 s or when the first floor is cleared.
- **Enemy strength**: battle mode with "scaled" off, then every monster made again as a stronger place makes them (the dungeon's own rule: health grows a little slower than the multiplier, blows a little faster). Multiplier 1.5 at tier I, 3 at tier II, 5 at tier III, times the scenario's own factor below. The reference heroes in the 1v1s are at the same tier as the hero. The dungeon uses its own strength (the Wildwood's at tiers I-II, the Warren's at tier III, as tools/test/hero-vs.mjs does).
- **When an ability can fire**: every 0.35 s a hero that is free (not stunned, frozen or asleep, not in the middle of a move, not forced to walk somewhere, not terrified or radiant) scores each ready ability. The best one goes if it scores at least 0.3 after a ±15% dice roll, and then only on a second roll (25% + 60% of the score; always when it faces its last foe). The recorder logs every score, so it can say whether an ability that never fired was busy, below the bar, or beaten by another.

| Scenario | What | Strength factor |
| --- | --- | --- |
| 1v1 melee | 1v1 vs Wildmane (melee) | x1 |
| 1v1 ranged | 1v1 vs Archer (ranged) | x1 |
| 1v1 caster | 1v1 vs Pyromancer (caster) | x1 |
| 1v1 tank | 1v1 vs Paladin (tank) | x1 |
| Ogre | vs an elite Ogre (slam ring, then a split line down the floor) | x1 |
| Boars | vs two elite Thornback Boars (telegraphed charges) | x1 |
| Swarm | vs a swarm of 10 sewer rats | x2 |
| Duo | vs a Bandit (melee, shield) and a Poacher (ranged, snares) | x1.6 |
| +tank ally | with a Paladin (Tower if the hero is the Paladin) vs a mixed group | I x2.4, II x3.4, III x3.4 |
| +healer ally | with a Cleric (Druid if the hero is the Cleric) vs a mixed group | I x2.4, II x3.4, III x3.4 |
| Dungeon | a dungeon floor with three mates (Paladin, Archer, Cleric) | dungeon |

Words used below:

- **fires** / **fired in**: the share of fights in which the ability went off at least once. "Quiet" means it went off in 10% of the fights or fewer.
- **casts/min**: casts per minute of fighting. **ready**: seconds a fight it sat off cooldown. **scored ≥ bar**: the share of the times the hero thought about it (while ready and free) that it scored 0.3 or more. **busy**: the share of its ready time the hero was stunned, mid-move, forced to walk, terrified or radiant.
- **value** per minute = damage + healing + damage blocked (kept off the hero or a friend by a shield, ward, buff, block, armour or untouchability) + damage taken over for a friend (Guard) + extra damage foes took from its debuffs + extra damage its buffs added + damage foes did not deal because of its debuffs. The last three are measured before the target's armour, so they are a little high. **weapon** is the hero's plain attack.
- Status damage is credited to whoever put the status on last (the game's own rule), and shared back to the abilities that built it up, in proportion to what each applied.

## 1. How much of each kit fires

The average, over its three abilities and the eleven scenarios, of the share of fights each ability went off in. 100% would be every ability in every fight. Sorted by the average of the three tiers. **Abilities that work in a 1v1**: how many of its three went off in at least half of the fights across the four 1v1s, at tier II.

| # | Hero | Role | Tier I | Tier II | Tier III | Average | Abilities that work in a 1v1 (II) | Quiet in 5+ of the 11 scenarios at tier II (how many) |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 | Bandit (rogueBandit) | skirmish | 100% | 100% | 100% | **100%** | 3 of 3 | - |
| 2 | Crossbowman (crossbowman) | ranged | 100% | 100% | 100% | **100%** | 3 of 3 | - |
| 3 | Warhelm (warhelm) | melee | 98% | 99% | 99% | **99%** | 3 of 3 | - |
| 4 | Slinger (slinger) | ranged | 100% | 99% | 98% | **99%** | 3 of 3 | - |
| 5 | Jester (jester) | skirmish | 97% | 97% | 98% | **97%** | 3 of 3 | - |
| 6 | Monk (monk) | melee | 98% | 96% | 91% | **95%** | 3 of 3 | - |
| 7 | Samurai (samurai) | melee | 90% | 90% | 91% | **90%** | 2 of 3 | - |
| 8 | Telekinetic (telekinetic) | caster | 99% | 93% | 79% | **90%** | 3 of 3 | - |
| 9 | Clockmaker (clockwork) | support | 96% | 89% | 84% | **90%** | 3 of 3 | - |
| 10 | Ninja (ninja) | ranged | 93% | 86% | 85% | **88%** | 3 of 3 | - |
| 11 | Javelin Huntress (huntress) | ranged | 93% | 87% | 82% | **87%** | 3 of 3 | - |
| 12 | Gladiator (gladiator) | melee | 88% | 87% | 87% | **87%** | 2 of 3 | - |
| 13 | Old Guard (oldguard) | tank | 86% | 89% | 85% | **87%** | 2 of 3 | - |
| 14 | Archer (archer) | ranged | 88% | 85% | 81% | **85%** | 2 of 3 | - |
| 15 | Engineer (engineer) | ranged | 85% | 85% | 85% | **85%** | 2 of 3 | Deploy Turret (5) |
| 16 | Werewolf (werewolf) | melee | 85% | 85% | 85% | **85%** | 2 of 3 | Turn (5) |
| 17 | Enchantress (enchantress) | support | 85% | 85% | 85% | **85%** | 2 of 3 | Sweetheart (5) |
| 18 | Air Mage (airMage) | caster | 85% | 85% | 85% | **85%** | 2 of 3 | Cyclone (5) |
| 19 | Frost Mage (frost) | caster | 86% | 87% | 80% | **84%** | 3 of 3 | - |
| 20 | Bearskin (bearskin) | melee | 91% | 84% | 78% | **84%** | 3 of 3 | - |
| 21 | Storm Mage (storm) | caster | 84% | 84% | 83% | **84%** | 2 of 3 | Thunderclap (5) |
| 22 | Harpooner (harpooner) | ranged | 83% | 84% | 84% | **84%** | 2 of 3 | Rogue Wave (5) |
| 23 | Alchemist (alchemist) | caster | 85% | 85% | 81% | **83%** | 2 of 3 | Monstrosity (5) |
| 24 | Warden (warden) | tank | 78% | 84% | 84% | **82%** | 2 of 3 | Chain Gang (5) |
| 25 | Haymaker (haymaker) | melee | 82% | 82% | 77% | **80%** | 2 of 3 | Pitch Hay (5) |
| 26 | Necromancer (necromancer) | caster | 82% | 79% | 78% | **80%** | 2 of 3 | Raise Dead (5) |
| 27 | Earth Mage (earthMage) | caster | 79% | 79% | 78% | **78%** | 2 of 3 | Earthquake (5) |
| 28 | Bulwark (bulwark) | tank | 79% | 77% | 75% | **77%** | 2 of 3 | Shield Wall (7) |
| 29 | Pyromancer (pyromancer) | caster | 77% | 77% | 75% | **76%** | 2 of 3 | Flame Wall (5) |
| 30 | Wildmane (wildmane) | melee | 74% | 77% | 73% | **75%** | 2 of 3 | Cleave (6) |
| 31 | Berserker (berserker) | melee | 74% | 77% | 73% | **74%** | 2 of 3 | Shockwave (5) |
| 32 | Grenadier (grenadier) | ranged | 78% | 75% | 70% | **74%** | 2 of 3 | Big Bomb (5) |
| 33 | Trapper (trapper) | ranged | 82% | 71% | 68% | **74%** | 3 of 3 | - |
| 34 | Twinfang (twinfang) | skirmish | 77% | 72% | 69% | **73%** | 1 of 3 | Fan of Knives (5) |
| 35 | Seer (seer) | support | 73% | 72% | 73% | **73%** | 2 of 3 | Ill Omen (7) |
| 36 | Granny Reaper (granny) | melee | 80% | 72% | 65% | **72%** | 3 of 3 | Old Bones (7) |
| 37 | Digger (digger) | melee | 71% | 72% | 72% | **72%** | 1 of 3 | - |
| 38 | Pirate (pirate) | skirmish | 81% | 72% | 62% | **72%** | 2 of 3 | Broadside (5) |
| 39 | Marksman (marksman) | ranged | 73% | 73% | 66% | **71%** | 2 of 3 | Ricochet (5) |
| 40 | Cleric (cleric) | support | 73% | 69% | 70% | **71%** | 2 of 3 | Mending Ray (9) |
| 41 | Warlock (warlock) | caster | 69% | 69% | 68% | **69%** | 1 of 3 | Awaken (5), Dark Bargain (5) |
| 42 | Dame (dame) | tank | 69% | 69% | 68% | **69%** | 2 of 3 | Challenge (10) |
| 43 | Druid (druid) | support | 68% | 67% | 67% | **68%** | 1 of 3 | Entangle (5), Call Wolf (5) |
| 44 | Falconer (falconer) | ranged | 66% | 68% | 68% | **67%** | 2 of 3 | Keen Eye (5) |
| 45 | Grandpa Sickle (grandpa) | support | 70% | 67% | 64% | **67%** | 2 of 3 | Old Tales (8) |
| 46 | Tower (tower) | tank | 66% | 67% | 67% | **67%** | 1 of 3 | Hold the Line (5), Ground Pound (5) |
| 47 | Witch (witch) | caster | 68% | 68% | 64% | **67%** | 2 of 3 | Cursed Brew (5) |
| 48 | The Mob (mob) | melee | 70% | 65% | 63% | **66%** | 1 of 3 | Surround (5) |
| 49 | Beekeeper (beekeeper) | support | 73% | 62% | 63% | **66%** | 2 of 3 | Beehive (5), Honey Glaze (5) |
| 50 | Griffon (griffon) | tank | 64% | 65% | 64% | **64%** | 2 of 3 | Swoop (9) |
| 51 | Plague Doctor (plague) | caster | 60% | 62% | 61% | **61%** | 2 of 3 | Miasma (5), Cure (5) |
| 52 | Shade (shade) | skirmish | 62% | 59% | 55% | **59%** | 1 of 3 | Shadow Walk (5), Blackout (5) |
| 53 | Shaman (shaman) | support | 59% | 52% | 51% | **54%** | 1 of 3 | Spirit Link (8), Ancestors' Call (5) |
| 54 | Chef (chef) | support | 57% | 51% | 52% | **53%** | 1 of 3 | Grease Fire (6), Food Fight (6) |
| 55 | Paladin (paladin) | tank | 53% | 53% | 53% | **53%** | 1 of 3 | Guard (9), Consecrate (5) |
| 56 | Quartermaster (quartermaster) | support | 54% | 49% | 49% | **51%** | 1 of 3 | Supply Crate (8), Barricade (7) |
| 57 | Cultist (cultist) | caster | 50% | 48% | 50% | **49%** | 0 of 3 | Blood Pact (8), Ritual Circle (5) |
| 58 | Bard (bard) | support | 44% | 43% | 43% | **44%** | 0 of 3 | War Song (5), Lullaby (5), Encore (8) |
| 59 | Valkyrie (valkyrie) | support | 18% | 17% | 18% | **18%** | 0 of 3 | Valkyrie's Call (11), Spear of the Sky (10), Sky Dive (6) |

## 2. Abilities that fire 0 or nearly 0 times

Every ability that went off in 10% of the fights or fewer in at least one scenario at some tier. "Where" lists those scenarios by tier. The numbers are over those quiet cells only: seconds a fight it sat ready, how much of that the hero was busy, the share of its thinks that reached the bar, and its best score. **Why** names what its score waits for (read from its score code, kits.js / kits2.js / kits3.js) and what the fights showed.

What keeps them quiet, in kinds (what the score of each waits for):

| Kind | Abilities | Which |
| --- | ---: | --- |
| Never or almost never fires, even where it should | 1 | Valkyrie's Call |
| Two or more foes close together (quiet in the 1v1s and against the one Ogre, by its design) | 44 | Shield Wall, Ill Omen, Barricade, Cleave, Grease Fire, Food Fight, Consecrate, Ground Pound, Hold the Line, Fan of Knives, Shockwave, Flame Wall, Thunderclap, War Song, Lullaby, Entangle, Call Wolf, Miasma, Shadow Walk, Blackout, Pitch Hay, Monstrosity, Ancestors' Call, Cursed Brew, Awaken, Ritual Circle, Beehive, Keen Eye, Big Bomb, Rogue Wave, Ricochet, Broadside, Deploy Turret, Turn, Surround, Cyclone, Chain Gang, Earthquake, Arena, Smoker, Blinding Flash, Slow Time, Kunai Rain, Double Barrel |
| A friend who needs it (quiet without a friend, or while friends are fine) | 18 | Spear of the Sky, Challenge, Swoop, Guard, Mending Ray, Old Tales, Supply Crate, Encore, Spirit Link, Blood Pact, Sky Dive, Cure, Rally, Honey Glaze, Hot Meal, Healing Totem, Bread Toss, Elixir |
| The hero itself hurt, or under a status | 5 | Old Bones, Hibernate, Grog, Bush, Unstoppable |
| Foes on top of the hero, attacking it, or shots in the air | 21 | Sweetheart, Scatter, Bayonet, Focus, Roll, Blast Off, Inferno, Frost Nova, Ice Wall, Gas Form, Wing Guard, Broom Ride, Call the Flock, Bound, Stone Wall, Mind Shield, Dirt Fling, Caltrops, Befuddle, Nullify, Stop the Clock |
| A target at the right distance or in a line | 10 | Sacrifice, Burrow, Jaw Trap, Backstab, Bury, Hook, Spear Lunge, Leap, Life Drain, Hex |
| Something the hero has to set up first (a corpse, its summon gone, its last buff over) | 3 | Raise Dead, Dark Bargain, Loose the Falcon |

### Never or almost never fires, even where it should

| Hero | Ability | Quiet cells | Where (tier: scenarios) | Ready s/fight | Busy | Scored ≥ bar | Best score | Why |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Valkyrie | **Valkyrie's Call** (valkyrieCall) | 33/33 | I: all; II: all; III: all | 41 | 12% | 0% | 0 | Needs a friend who is DOWN (not dead) and is once a room. In battle mode heroes die instead of going down, so it can never fire there; in the dungeon it waits for a friend to fall. |

### Two or more foes close together (quiet in the 1v1s and against the one Ogre, by its design)

| Hero | Ability | Quiet cells | Where (tier: scenarios) | Ready s/fight | Busy | Scored ≥ bar | Best score | Why |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Bulwark | **Shield Wall** (shieldWall) | 21/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo | 53 | 5% | 0% | 0 | Needs three or more foes within 260 and a friend within 170: only with friends and a crowd. |
| Seer | **Ill Omen** (starfall) | 21/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo | 63 | 3% | 0% | 0 | Needs 3 or more foes within 120 of her target. |
| Quartermaster | **Barricade** (oilBlades) | 21/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo | 66 | 3% | 0% | 0 | Needs two foes within 300 and a ranged friend, or three foes within 300. |
| Wildmane | **Cleave** (cleave) | 18/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo | 33 | 14% | 0% | 0 | Needs two or more foes within 40 of her body. |
| Chef | **Grease Fire** (greaseFire) | 18/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo | 67 | 5% | 0% | 0.7 | Needs two or more foes within 170 in front of him. |
| Chef | **Food Fight** (foodFight) | 18/33 | I: 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo; II: 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo; III: 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Duo | 70 | 5% | 0% | 0 | Needs three or more foes within 300, or a foe dashing, leaping or charging within 330. |
| Paladin | **Consecrate** (consecrate) | 16/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 67 | 8% | 0% | 0 | Needs 2 or more foes within 110 of the hero. |
| Tower | **Ground Pound** (groundPound) | 16/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 69 | 19% | 0% | 0.7 | Needs 2 or more foes within 120 of the hero. |
| Tower | **Hold the Line** (holdTheLine) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 68 | 20% | 0% | 0 | Needs 2 or more foes within 160 of the hero. |
| Twinfang | **Fan of Knives** (fanOfKnives) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 35 | 11% | 0% | 0 | Needs 2 or more foes within 150 of the hero. |
| Berserker | **Shockwave** (shockwave) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 29 | 6% | 0% | 0 | Needs 2 or more foes within 100 of his target. |
| Pyromancer | **Flame Wall** (flameWall) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 22 | 3% | 0% | 0 | Needs 2 or more foes within 120 of her target. |
| Storm Mage | **Thunderclap** (thunderclap) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 45 | 2% | 0% | 0 | Needs 2 or more foes within 90 of her target. |
| Bard | **War Song** (warSong) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 50 | 3% | 0% | 0 | Needs two or more foes within 320 and a friend within 220: quiet alone. |
| Bard | **Lullaby** (lullaby) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 50 | 3% | 0% | 0 | Needs 2 or more foes within 170 of the hero. |
| Druid | **Entangle** (entangle) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 62 | 3% | 0% | 0 | Needs 2 or more foes within 80 of her target. |
| Druid | **Call Wolf** (callWolf) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 62 | 3% | 0% | 0 | Needs two or more foes within 350, and no wolf already out. |
| Plague Doctor | **Miasma** (miasma) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 38 | 6% | 0% | 0 | Needs 2 or more foes within 90 of his target. |
| Shade | **Shadow Walk** (shadowWalk) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 25 | 9% | 0% | 0 | Needs two foes near the target (within 260 of her), or two foes within 70 of her. |
| Shade | **Blackout** (blackout) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 25 | 9% | 0% | 0 | Needs 2 or more foes within 130 of the hero. |
| Haymaker | **Pitch Hay** (pitchHay) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 25 | 39% | 0% | 0 | Needs two or more foes within 160 in front of him. |
| Alchemist | **Monstrosity** (bangFlask) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 36 | 1% | 0% | 0 | Needs her over half health and two or more foes within 240. |
| Shaman | **Ancestors' Call** (rainDance) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 59 | 6% | 0% | 0 | Ancestors' Call: needs two or more foes within 360 and no spirit bear out. |
| Witch | **Cursed Brew** (cursedBrew) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 13 | 1% | 0% | 0 | Needs 2 or more foes within 100 of her target. |
| Warlock | **Awaken** (summonImp) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 23 | 34% | 0% | 0 | Needs two or more foes within 300 (and not in demon form). |
| Cultist | **Ritual Circle** (ritualCircle) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 34 | 6% | 0% | 0 | Needs 2 or more foes within 100 of her target. |
| Beekeeper | **Beehive** (honeyPot) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 58 | 3% | 0% | 0 | Needs two or more foes within 160 of the target and no hive out. |
| Falconer | **Keen Eye** (keenEye) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 10 | 1% | 0% | 0 | Needs 2 or more foes within 300 of the hero. |
| Grenadier | **Big Bomb** (bigBomb) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 31 | 3% | 0% | 0 | Needs two or more foes within 120 of her target (three for the full score). |
| Harpooner | **Rogue Wave** (rogueWave) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 25 | 10% | 0% | 0 | Needs two or more foes within 200 in front of him. |
| Marksman | **Ricochet** (ricochet) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 19 | 17% | 0% | 0 | Needs 2 or more foes within 220 of his target. |
| Pirate | **Broadside** (broadside) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 33 | 9% | 0% | 0 | Needs 2 or more foes within 130 of his target. |
| Engineer | **Deploy Turret** (deployTurret) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 39 | 6% | 0% | 0 | Needs two or more foes within 380 and no turret out. |
| Werewolf | **Turn** (turnWolf) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 54 | 11% | 0% | 0 | Needs two or more foes within 260 (and not already a wolf). |
| The Mob | **Surround** (surround) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 20 | 55% | 0% | 0 | Needs 2 or more foes within 170 of the target. |
| Air Mage | **Cyclone** (cyclone) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 50 | 2% | 0% | 0 | Needs 2 or more foes within 150 of the target. |
| Warden | **Chain Gang** (chainGang) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 66 | 4% | 0% | 0 | Three foes within 190 score 0.8, two 0.55, one on a soft friend 0.5. |
| Earth Mage | **Earthquake** (earthquake) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 42 | 1% | 0% | 0 | Needs 2 or more foes within 115 of the target. |
| Gladiator | **Arena** (showboat) | 12/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank | 19 | 19% | 0% | 0 | Needs a target within 160 that is elite or a boss, or two foes within 200, and him over 35% health. |
| Beekeeper | **Smoker** (swarm) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 27 | 1% | 0% | 0 | Two foes in front within 170 score 0.7; one within 120 scores 0.45. |
| Seer | **Blinding Flash** (premonition) | 5/33 | I: 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 33 | 1% | 0% | 0 | Two foes within 150 score 0.8, one 0.45. |
| Clockmaker | **Slow Time** (timeBubble) | 3/33 | I: 1v1 tank; II: 1v1 tank; III: 1v1 tank | 116 | 15% | 0% | 0 | Three foes in a knot score 0.9, two 0.7, one dangerous foe 0.45. |
| Ninja | **Kunai Rain** (shurikenFan) | 2/33 | II: 1v1 caster; III: 1v1 caster | 22 | 0% | 0% | 0.4 | Two foes within 160 score 0.75, one 0.35. |
| Trapper | **Double Barrel** (snareNet) | 2/33 | II: 1v1 caster; III: 1v1 caster | 16 | 0% | 1% | 0.5 | Two foes in front within 170 score 0.75, one 0.45. |

### A friend who needs it (quiet without a friend, or while friends are fine)

| Hero | Ability | Quiet cells | Where (tier: scenarios) | Ready s/fight | Busy | Scored ≥ bar | Best score | Why |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Valkyrie | **Spear of the Sky** (spearThrow) | 29/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, Dungeon; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, +healer ally, Dungeon; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, +healer ally, Dungeon | 38 | 11% | 0% | 0.8 | Needs a friend under 60% health 90-420 away. Alone it never goes; even with a friend it rarely lines up. |
| Dame | **Challenge** (challenge) | 28/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, +tank ally; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, +healer ally, Dungeon; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, Dungeon | 56 | 7% | 0% | 1 | Needs a friend under 40% health within 420 with a foe near it. Friends were rarely that low. |
| Griffon | **Swoop** (swoop) | 27/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, Dungeon; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, Dungeon; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, +healer ally | 47 | 9% | 0% | 1 | Needs a friend under 60% health, 130-480 away, with a foe near it. |
| Paladin | **Guard** (guard) | 26/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, Dungeon; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, Dungeon | 62 | 6% | 0% | 0 | Needs a friend under 65% health with a foe hitting it. No friend in the 1v1s and solo fights; in the dungeon and with an ally, friends were rarely that low while a foe was on them. |
| Cleric | **Mending Ray** (mend) | 26/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, Dungeon; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, Dungeon | 77 | 2% | 0% | 0 | Needs a friend (not herself) under 80% health in reach of her ray. Alone she has no one to mend; in the easy dungeon floor friends stayed above 80%. |
| Grandpa Sickle | **Old Tales** (oldTales) | 26/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, +healer ally, Dungeon | 59 | 7% | 0% | 0.6 | Needs a friend within 220 with two abilities on cooldown for more than 4 s. Quiet alone; with friends it still rarely lines up. |
| Quartermaster | **Supply Crate** (resupply) | 25/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, +tank ally | 63 | 3% | 0% | 0 | Needs a friend within 300 with two abilities on cooldown for more than 4 s, and no crate out. Quiet alone, rare in a party. |
| Bard | **Encore** (encore) | 24/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo | 47 | 2% | 0% | 0 | Needs a friend with an ability on cooldown for more than 4 s. Quiet alone. |
| Shaman | **Spirit Link** (spiritLink) | 24/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo | 64 | 4% | 0% | 0 | Needs a friend within 260 and two or more foes targeting her side. Quiet alone. |
| Cultist | **Blood Pact** (bloodPact) | 24/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo | 33 | 4% | 0% | 0 | Needs two or more foes within 300 AND two or more friends within 230: only in a party. |
| Valkyrie | **Sky Dive** (skyDive) | 18/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Duo | 31 | 7% | 0% | 0 | Needs someone (she counts) with two foes on them within 120. |
| Plague Doctor | **Cure** (cure) | 15/33 | I: 1v1 melee, 1v1 tank, Ogre, Boars, Swarm; II: 1v1 melee, 1v1 tank, Ogre, Boars, Swarm; III: 1v1 melee, 1v1 tank, Ogre, Boars, Swarm | 37 | 8% | 0% | 0 | Needs a friend (or himself) with 50+ of poison, burn, chill and wet, or stunned or rooted. |
| Old Guard | **Rally** (rallyCry) | 11/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, Boars; II: 1v1 ranged, 1v1 caster, Boars; III: 1v1 ranged, 1v1 caster, Ogre, Boars | 34 | 2% | 0% | 1 | Needs a friend (or himself) stunned, rooted, knocked out or staggered, or three foes within 260 with a friend near. |
| Beekeeper | **Honey Glaze** (royalJelly) | 9/33 | II: Ogre, Boars, Swarm, Duo, Dungeon; III: Ogre, Swarm, Duo, Dungeon | 68 | 0% | 0% | 0.8 | Needs someone under 75% health with a foe on them. |
| Chef | **Hot Meal** (hotMeal) | 4/33 | II: Duo, Dungeon; III: Swarm, Dungeon | 68 | 0% | 0% | 0 | Needs someone under 70% health (he counts) and fewer than three plates out. |
| Shaman | **Healing Totem** (healTotem) | 3/33 | II: Dungeon; III: Swarm, Dungeon | 93 | 0% | 0% | 0 | Needs no totem out and someone under 85% health being hit. |
| Grandpa Sickle | **Bread Toss** (breadToss) | 1/33 | III: Dungeon | 133 | 4% | 0% | 0 | Needs him or a friend under 70% health. |
| Alchemist | **Elixir** (elixir) | 1/33 | III: Ogre | 52 | 0% | 0% | 0.8 | Needs someone near (her too) who needs it enough: hurt, targeted or under statuses, and not already hasted or warded. |

### The hero itself hurt, or under a status

| Hero | Ability | Quiet cells | Where (tier: scenarios) | Ready s/fight | Busy | Scored ≥ bar | Best score | Why |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Granny Reaper | **Old Bones** (oldBones) | 20/33 | I: Swarm, Duo, +tank ally, Dungeon; II: 1v1 ranged, 1v1 caster, Ogre, Swarm, Duo, +tank ally, Dungeon; III: 1v1 ranged, 1v1 caster, 1v1 tank, Ogre, Boars, Swarm, Duo, +tank ally, Dungeon | 27 | 4% | 0% | 0 | A passive: it only goes off when she would go down, once a room (once a fight in battles). |
| Bearskin | **Hibernate** (hibernate) | 11/33 | I: Duo, +tank ally, Dungeon; II: 1v1 tank, Swarm, Duo, Dungeon; III: 1v1 tank, Duo, +tank ally, Dungeon | 46 | 5% | 0% | 1 | Needs him under 45% health. |
| Pirate | **Grog** (grog) | 6/33 | II: Duo, Dungeon; III: Ogre, Duo, +tank ally, Dungeon | 44 | 0% | 0% | 0.8 | Needs him under half health with a foe within 200. |
| Trapper | **Bush** (tripwire) | 6/33 | I: Dungeon; II: Ogre, Duo, Dungeon; III: Ogre, Dungeon | 64 | 0% | 0% | 0 | Needs her under 70% health with a foe within 200 targeting her. |
| Berserker | **Unstoppable** (unstoppable) | 5/33 | I: 1v1 melee, Swarm; II: Swarm; III: Boars, Swarm | 10 | 0% | 0% | 1 | Needs 40+ of chill, poison, burn and stagger on him, or him rooted, or under 40% health with two foes near. |

### Foes on top of the hero, attacking it, or shots in the air

| Hero | Ability | Quiet cells | Where (tier: scenarios) | Ready s/fight | Busy | Scored ≥ bar | Best score | Why |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Enchantress | **Sweetheart** (sweetheart) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 65 | 3% | 0% | 0 | Needs a beloved: her or a friend within 340 that foes are hitting more than once. |
| The Mob | **Scatter** (scatter) | 12/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank | 18 | 56% | 0% | 0 | Needs a danger zone about to land on two of its bodies, or two foes on it below 60% health, or four on it below 85%. |
| Marksman | **Bayonet** (bayonet) | 9/33 | I: 1v1 ranged, 1v1 caster, +tank ally; II: 1v1 ranged, 1v1 caster, +tank ally; III: 1v1 ranged, 1v1 caster, Duo | 13 | 16% | 0% | 0.9 | Needs a foe within reach of his bayonet (55 past his body). |
| Samurai | **Focus** (focus) | 9/33 | I: 1v1 melee, 1v1 tank, Ogre; II: 1v1 melee, 1v1 tank, Ogre; III: 1v1 melee, 1v1 tank, Ogre | 10 | 14% | 0% | 0.7 | Needs two foes targeting him or a shot in the air, and Focus not already on. |
| Archer | **Roll** (roll) | 8/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster, Ogre; III: 1v1 ranged, 1v1 caster, Duo | 17 | 0% | 0% | 0.9 | Needs a foe within 70 of her. Shooters and casters keep their distance, so it waits. |
| Grenadier | **Blast Off** (blastOff) | 7/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster, Ogre | 17 | 1% | 0% | 0.9 | Needs a foe within 90 of her. |
| Pyromancer | **Inferno** (inferno) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 13 | 1% | 0% | 0 | Two foes within 120 score 0.9, one 0.55; shooters and casters stay out of that reach. |
| Frost Mage | **Frost Nova** (frostNova) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 15 | 0% | 0% | 0 | Two foes within 110 score 0.9, one 0.6; shooters and casters stay out of that reach. |
| Frost Mage | **Ice Wall** (iceWall) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 15 | 0% | 0% | 0 | Needs a melee foe within 170 coming at him (its reach under 80), the target more than 80 away. |
| Plague Doctor | **Gas Form** (leeches) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 31 | 1% | 0% | 0 | Gas Form: needs a foe within 90 of him. |
| Griffon | **Wing Guard** (wingShield) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 29 | 1% | 0% | 0 | Needs a melee foe within 70 that is targeting him (one scores 0.45, two 0.8). Ranged and caster foes keep away. |
| Witch | **Broom Ride** (broomRide) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 14 | 1% | 0% | 0 | A foe within 110, or three foes within 300. |
| Falconer | **Call the Flock** (flock) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 13 | 0% | 0% | 0 | A foe within 110, or three within 300. |
| Javelin Huntress | **Bound** (bound) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 10 | 1% | 0% | 0.9 | Needs a foe within 95 of her. |
| Earth Mage | **Stone Wall** (stoneWall) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 15 | 1% | 0% | 0 | Needs a melee foe 60-230 from her, or from a soft friend it is after, within 330 of her. |
| Telekinetic | **Mind Shield** (mindShield) | 5/33 | II: Ogre; III: 1v1 caster, 1v1 tank, Ogre, Duo | 22 | 0% | 0% | 0.4 | Builds up from shots coming at her, melee foes on her side within 120, and a friend under 40%. |
| Digger | **Dirt Fling** (dirtFling) | 3/33 | I: 1v1 ranged; II: 1v1 caster; III: 1v1 caster | 0 | 2% | 0% | 0 | Needs a foe in front within 140, or a burning or poisoned friend near. |
| Ninja | **Caltrops** (caltrops) | 3/33 | II: 1v1 ranged, 1v1 caster; III: 1v1 caster | 23 | 2% | 0% | 0 | Needs a foe within 140 of her. |
| Jester | **Befuddle** (befuddle) *passive* | 2/33 | I: 1v1 ranged; II: 1v1 ranged | 0 | - | - | 0 | A passive: it answers a melee blow from within 160, once every 10 s (8 s at II, 6 s at III). |
| Warden | **Nullify** (nullify) | 2/33 | I: 1v1 melee, 1v1 tank | 73 | 1% | 0% | 0.6 | Needs foes within 170 with something to silence, shots or wind-ups near, or (II) a friend stuck under a status. |
| Clockmaker | **Stop the Clock** (stopClock) | 1/33 | III: 1v1 tank | 118 | 20% | 0% | 0.1 | Builds up from three foes near, shots in the air, foes winding up and a friend under 35%: one plain foe scores 0.1. |

### A target at the right distance or in a line

| Hero | Ability | Quiet cells | Where (tier: scenarios) | Ready s/fight | Busy | Scored ≥ bar | Best score | Why |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Cultist | **Sacrifice** (soulCandle) | 7/33 | I: 1v1 ranged, 1v1 tank; II: 1v1 melee, 1v1 ranged, 1v1 caster; III: 1v1 melee, 1v1 ranged | 31 | 2% | 0% | 0.9 | Needs a foe under 25% health (35% at II) within 300 with a clear line, to sacrifice. |
| Digger | **Burrow** (burrow) | 6/33 | I: 1v1 melee, 1v1 tank; II: 1v1 melee, 1v1 tank; III: 1v1 melee, 1v1 tank | 1 | 13% | 1% | 0.5 | Needs a foe 160-460 away. In a melee fight the foe is close. |
| Trapper | **Jaw Trap** (jawTrap) | 6/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 12 | 2% | 0% | 0 | Needs a target within 300 that is not ranged, and fewer than three traps down. |
| Twinfang | **Backstab** (backstab) | 4/33 | II: 1v1 ranged, 1v1 caster; III: 1v1 ranged, 1v1 caster | 21 | 8% | 0% | 0.3 | Scores (1 - the target's health) x 0.6, +0.4 if the target is busy with someone else, and only when the target is more than 90 away. A full-health foe fighting her scores 0: it only goes once the foe is hurt or busy. |
| Digger | **Bury** (spadeBat) | 4/33 | I: 1v1 ranged, 1v1 caster; II: 1v1 caster; III: 1v1 caster | 1 | 2% | 1% | 0.6 | Needs the target in reach. |
| Granny Reaper | **Hook** (hook) | 2/33 | I: 1v1 melee; II: 1v1 melee | 24 | 0% | 0% | 0 | Needs a foe 150-330 away with a clear line. In a melee duel the foe is always close. |
| Javelin Huntress | **Spear Lunge** (runningThrow) | 2/33 | III: 1v1 ranged, 1v1 caster | 10 | 0% | 0% | 0 | Needs the target within 240 with a clear line. |
| Wildmane | **Leap** (leap) | 1/33 | I: 1v1 melee | 19 | 0% | 0% | 0.8 | Needs the target 140-380 away. Up close it waits. |
| Necromancer | **Life Drain** (lifeDrain) | 1/33 | III: 1v1 ranged | 13 | 1% | 0% | 0 | Needs the target within 230 with a clear line. |
| Witch | **Hex** (frogHex) | 1/33 | III: Swarm | 1 | 55% | 100% | 0.7 | Needs a target within 280 that is not a frog already. |

### Something the hero has to set up first (a corpse, its summon gone, its last buff over)

| Hero | Ability | Quiet cells | Where (tier: scenarios) | Ready s/fight | Busy | Scored ≥ bar | Best score | Why |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Necromancer | **Raise Dead** (raiseDead) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 32 | 46% | 0% | 0 | Needs a corpse on the floor (and a foe within 380). Early in a fight there are none. |
| Warlock | **Dark Bargain** (darkBargain) | 15/33 | I: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; II: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre; III: 1v1 melee, 1v1 ranged, 1v1 caster, 1v1 tank, Ogre | 23 | 34% | 0% | 0 | Needs his imp out (Summon Imp first), him over 45% health and two foes within 300. |
| Falconer | **Loose the Falcon** (looseFalcon) | 2/33 | I: Swarm; III: Swarm | 0 | 3% | 90% | 0.6 | Needs the falcon home (not out) and a foe within 440. |

## 3. What each ability is worth next to the weapon

Value per minute of fighting (see "value" above), each scenario counted the same, at each tier. The percentage is the ability's value over the weapon's damage. **tiny**: under 5% of the weapon while it does fire. **big**: more than the weapon. Status damage is shown on its own and also shared into the abilities and the weapon that built it (the "+st" part).

### Abilities worth very little next to the weapon (while they do fire)

Split in two: those where the recorder sees next to nothing at all, and those that at least put statuses on foes or keep a buff or state going (their worth is control or support the value can't count: section 7). Columns per tier, I / II / III. **Build-up/min**: status build-up it put on foes a minute. **Control s/min**: seconds a minute it added to the stun, root, sleep, freeze, knock-out, fear, shackle, addled, sickness or radiant timers of foes (foe-seconds: two foes held for a second count two). **Kept/min**: unit-seconds a minute of the buffs and timed states it kept on foes, friends or the hero.

**Next to nothing measured:**

| Hero | Ability | Tiers | Casts/min | Value/min | % of weapon | Build-up/min | Control s/min | Kept/min | Note |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Paladin | Guard (guard) | I, II | 0.3 / 0.4 | 3 / 23 | 1% / 5% | 0 / 0 | 0 / 0 | 0 / 0 | Takes 40-60% of a friend's blows: counted under "guard". |
| Archer | Roll (roll) | I, II | 2.2 / 2.4 | 3.2 / 11.8 | 1% / 2% | 0 / 0 | 0 / 0 | 0 / 0 | A roll out of reach (caltrops at III count as damage). Distance kept is not counted. |
| Twinfang | Dash (dash) | I, II, III | 6.6 / 6.5 / 7.1 | 9.8 / 19.6 / 23 | 2% / 3% / 2% | 0 / 0 / 0 | 0 / 0 / 0.1 | 0 / 0 / 0 | A move in or out of reach. Only blows that land in its 0.3 s of untouchability count. |
| Bard | Encore (encore) | I, II, III | 1 / 1.5 / 1.4 | 0 / 32.1 / 67.5 | 0% / 3% / 5% | 0 / 0 / 0 | 0 / 0 / 0.1 | 0 / 0 / 0 | Resets a friend's longest cooldown (and heals 10% at II): the reset is not counted. |
| Dame | Challenge (challenge) | I, II, III | 0.1 / 0.1 / 0.1 | 1.9 / 21 / 26.2 | 0% / 3% / 2% | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | Leaps to a hurt friend, shoves it clear, heals it and taunts a foe: only the heal counts. |
| Grandpa Sickle | Old Tales (oldTales) | I, II | 0.6 / 0.1 | 0 / 0 | 0% / 0% | 0 / 0 | 0 / 0 | 0 / 0 | Takes 4-6 s off friends' cooldowns: not counted. |
| Shaman | Spirit Link (spiritLink) | I | 0.7 | 5.2 | 2% | 0 | 0 | 0 |  |
| Beekeeper | Beehive (honeyPot) | I, II, III | 1.9 / 2.7 / 3.2 | 0 / 0 / 0 | 0% / 0% / 0% | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |  |
| Quartermaster | Supply Crate (resupply) | I, II, III | 0.7 / 0.2 / 0.1 | 0 / 0 / 0 | 0% / 0% / 0% | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |  |
| Quartermaster | Barricade (oilBlades) | I, II, III | 1.1 / 1.6 / 1.8 | 0 / 0 / 0 | 0% / 0% / 0% | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |  |
| Trapper | Bush (tripwire) | I, II, III | 3.4 / 1 / 1.1 | 0 / 0 / 0 | 0% / 0% / 0% | 0 / 0 / 0 | 0 / 0.1 / 0 | 0 / 0 / 0 |  |
| Gladiator | Arena (showboat) | I | 2 | 0 | 0% | 0 | 0 | 0 | A taunt and a heal on hits: the taunt is not counted. |
| Valkyrie | Spear of the Sky (spearThrow) | I, II, III | 0.2 / 0.1 / 0.3 | 4 / 3.8 / 13.5 | 1% / 1% / 1% | 0 / 0 / 0 | 0 / 0 / 0 | 2 / 1 / 2 |  |
| Engineer | Wind-up Drones (shockMine) | I, II, III | 6.1 / 8.6 / 9.3 | 14.1 / 19.4 / 8 | 1% / 2% / 0% | 0 / 0 / 0 | 0 / 0.1 / 0 | 0 / 0 / 0 |  |
| Werewolf | Turn (turnWolf) | I, II | 1.4 / 2.1 | 0 / 3.2 | 0% / 0% | 0 / 0 | 0 / 0 | 0 / 0 |  |

**Control or support instead (value low, but it does something):**

| Hero | Ability | Tiers | Casts/min | Value/min | % of weapon | Build-up/min | Control s/min | Kept/min | Note |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Berserker | Unstoppable (unstoppable) | I, II | 2 / 3.5 | 0 / 0 | 0% / 0% | 0 / 0 | 0 / 0 | 4 / 14 | Takes his statuses off and makes him immune for 2-4 s: neither is counted. |
| Granny Reaper | Old Bones (oldBones) | I, II, III | 1.8 / 0.5 / 0.3 | 0 / 0 / 0 | 0% / 0% / 0% | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | Stays up at 1 health once: counted as a save, not value. |
| Frost Mage | Ice Wall (iceWall) | I, II, III | 2.6 / 3.6 / 3.4 | 0 / 0 / 42.8 | 0% / 0% / 4% | 0 / 0 / 917 | 0.1 / 0 / 7.9 | 0 / 0 / 0 | A wall: the steps and shots it stops are not counted. |
| Bard | War Song (warSong) | I, II, III | 2.3 / 3.8 / 4.3 | 0 / 0 / 0 | 0% / 0% / 0% | 0 / 0 / 0 | 0 / 0 / 0 | 26 / 39 / 39 | An attack-speed song (+50-60%): it shows only as more weapon hits, credited to the weapon. |
| Bard | Lullaby (lullaby) | I, II, III | 1.4 / 1.7 / 1.7 | 0 / 0 / 0 | 0% / 0% / 0% | 191 / 215 / 372 | 0 / 4.7 / 13.8 | 15 / 17 / 17 |  |
| Druid | Entangle (entangle) | I, II | 2.1 / 3 | 8.1 / 7.1 | 3% / 2% | 0 / 0 | 9.7 / 16.8 | 0 / 0 | Roots foes standing in the vines: counted as control seconds, not value. |
| Old Guard | Rally (rallyCry) | I, II | 1.9 / 2.7 | 0 / 0 | 0% / 0% | 0 / 0 | 0 / 0 | 13 / 55 | Takes stuns, roots and stagger off him and friends, knockback immunity, a haste at II: none counted. |
| Griffon | Swoop (swoop) | I, II, III | 0.1 / 0.3 / 0.3 | 3.2 / 9 / 22.6 | 1% / 2% / 3% | 0 / 23 / 27 | 0 / 0.8 / 0.6 | 0 / 1 / 2 |  |
| Haymaker | Pitch Hay (pitchHay) | I, II, III | 1.2 / 1.3 / 1 | 0 / 0 / 0 | 0% / 0% / 0% | 0 / 0 / 292 | 0 / 0 / 12.6 | 10 / 10 / 9 |  |
| Seer | Ill Omen (starfall) | I, II, III | 0.9 / 1.2 / 1.3 | 0 / 0 / 0 | 0% / 0% / 0% | 180 / 400 / 569 | 0 / 8.1 / 14.2 | 12 / 15 / 20 |  |
| Beekeeper | Smoker (swarm) | I, III | 3.6 / 5 | 29.4 / 58.4 | 5% / 5% | 323 / 494 | 0 / 7.7 | 11 / 14 |  |
| Beekeeper | Honey Glaze (royalJelly) | I, II, III | 2.8 / 3 / 3.7 | 1 / 1.1 / 0.7 | 0% / 0% / 0% | 97 / 53 / 42 | 0.3 / 0.3 / 0.2 | 16 / 15 / 18 |  |
| Crossbowman | Pavise (pavise) | I, II, III | 5.2 / 7.1 / 7.2 | 0 / 0 / 0 | 0% / 0% / 0% | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 8 / 13 | A shield set on the floor (a summon): the blows it soaks are not counted as blocked. |
| Falconer | Keen Eye (keenEye) | I, II, III | 3.2 / 4 / 4.5 | 2 / 9.1 / 22.5 | 0% / 1% / 1% | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 13 / 16 | Marks for the falcon and (II) attack speed: speed shows as weapon hits. |
| Slinger | Counting Sheep (gravel) | I, II, III | 5.1 / 7.4 / 7.6 | 0 / 0 / 0 | 0% / 0% / 0% | 524 / 726 / 779 | 7 / 19.8 / 25 | 0 / 0 / 0 |  |
| Jester | Swap (mock) | I, II, III | 5.7 / 9.4 / 10.4 | 1.1 / 0.5 / 2.8 | 0% / 0% / 0% | 302 / 671 / 1,151 | 6.4 / 23 / 28 | 1 / 1 / 1 | Swaps places with a foe (or with a friend in trouble, warding and hasting it): only the ward counts. |
| Enchantress | Heartstring (heartstring) | I, II, III | 4.8 / 7.1 / 7.1 | 0 / 0 / 0 | 0% / 0% / 0% | 397 / 634 / 693 | 1.7 / 3.9 / 4.7 | 0 / 0 / 0 |  |
| Enchantress | Sweetheart (sweetheart) | I | 2.1 | 0 | 0% | 0 | 0 | 12 |  |
| Clockmaker | Slow Time (timeBubble) | I, II, III | 3.4 / 5.8 / 6.6 | 0.3 / 0.1 / 0 | 0% / 0% / 0% | 0 / 0 / 0 | 0.1 / 1.1 / 2.5 | 28 / 48 / 76 |  |
| Clockmaker | Stop the Clock (stopClock) | I, II | 2.5 / 3.2 | 0.7 / 0 | 0% / 0% | 0 / 0 | 11.3 / 20.7 | 22 / 40 |  |
| Warden | Nullify (nullify) | I, II | 2.5 / 5.2 | 0 / 0 | 0% / 0% | 0 / 0 | 0 / 0 | 17 / 30 |  |

### How much of each hero's measured worth is its abilities (tier II)

Value a minute at tier II (each scenario counted the same): the weapon (with the status damage it built), the three abilities together (with theirs), and the trait (its own blows, blocks and heals). **Abilities' share** is the abilities over all three. Low means the hero is mostly its weapon; high means its abilities carry it. Control, cooldown cuts, walls and speed are not in it (see section 7).

| Hero | Role | Weapon/min | Abilities/min | Trait/min | Abilities' share | Its biggest ability |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Necromancer | caster | 284 | 1,093 | 0 | 79% | Life Drain (786) |
| Bandit | skirmish | 922 | 2,101 | 0 | 69% | Dirty Trick (1,713) |
| The Mob | melee | 696 | 1,938 | 165 | 69% | Pile On (1,290) |
| Tower | tank | 333 | 643 | 0 | 66% | Charge (287) |
| Monk | melee | 437 | 1,074 | 128 | 66% | Flurry (518) |
| Warlock | caster | 1,210 | 2,221 | 0 | 65% | Eldritch Beam (1,186) |
| Telekinetic | caster | 645 | 1,079 | 0 | 63% | Hurl (602) |
| Cleric | support | 210 | 344 | 0 | 62% | Sanctuary (153) |
| Grandpa Sickle | support | 582 | 920 | 0 | 61% | Bread Toss (712) |
| Old Guard | tank | 598 | 918 | 0 | 61% | Parry (628) |
| Pirate | skirmish | 823 | 1,249 | 0 | 60% | Point Blank (558) |
| Earth Mage | caster | 668 | 995 | 0 | 60% | Earthquake (621) |
| Haymaker | melee | 470 | 857 | 115 | 59% | Hay Bale (635) |
| Archer | ranged | 757 | 1,086 | 15 | 58% | Barrage (801) |
| Warhelm | melee | 1,006 | 1,404 | 5 | 58% | Storm Born (797) |
| Griffon | tank | 424 | 558 | 0 | 57% | Wing Guard (324) |
| Berserker | melee | 927 | 1,208 | 0 | 57% | Whirl (777) |
| Marksman | ranged | 907 | 1,558 | 334 | 56% | Aimed Shot (1,144) |
| Air Mage | caster | 486 | 610 | 0 | 56% | Cyclone (210) |
| Harpooner | ranged | 843 | 1,223 | 156 | 55% | Drop Anchor (624) |
| Falconer | ranged | 945 | 1,136 | 0 | 55% | Loose the Falcon (1,032) |
| Bulwark | tank | 424 | 742 | 203 | 54% | Brace (417) |
| Bearskin | melee | 874 | 1,022 | 0 | 54% | Maul (404) |
| Shade | skirmish | 944 | 1,091 | 0 | 54% | Shadow Clones (796) |
| Storm Mage | caster | 543 | 604 | 0 | 53% | Chain Lightning (272) |
| Granny Reaper | melee | 958 | 1,269 | 197 | 52% | Reap (997) |
| Pyromancer | caster | 945 | 1,486 | 538 | 50% | Fireball (872) |
| Frost Mage | caster | 585 | 580 | 0 | 50% | Ice Shard (445) |
| Alchemist | caster | 1,169 | 1,131 | 0 | 49% | Elixir (456) |
| Shaman | support | 365 | 349 | 0 | 49% | Ancestors' Call (261) |
| Grenadier | ranged | 1,002 | 914 | 0 | 48% | Sticky Bomb (445) |
| Wildmane | melee | 1,263 | 1,325 | 245 | 47% | Leap (470) |
| Werewolf | melee | 1,138 | 994 | 0 | 47% | Frenzy (739) |
| Twinfang | skirmish | 709 | 655 | 103 | 45% | Fan of Knives (336) |
| Jester | skirmish | 826 | 796 | 169 | 44% | Juggling Act (585) |
| Dame | tank | 692 | 742 | 274 | 43% | Disarm (389) |
| Seer | support | 685 | 580 | 111 | 42% | Foresight (448) |
| Crossbowman | ranged | 1,204 | 1,108 | 336 | 42% | Pinning Bolt (619) |
| Chef | support | 577 | 500 | 124 | 42% | Hot Meal (205) |
| Cultist | caster | 886 | 662 | 58 | 41% | Sacrifice (433) |
| Witch | caster | 914 | 696 | 134 | 40% | Broom Ride (330) |
| Valkyrie | support | 523 | 358 | 32 | 39% | Sky Dive (354) |
| Digger | melee | 951 | 782 | 269 | 39% | Bury (418) |
| Paladin | tank | 473 | 609 | 494 | 39% | Consecrate (434) |
| Samurai | melee | 2,325 | 2,319 | 1,424 | 38% | Iaido (1,026) |
| Gladiator | melee | 1,254 | 1,215 | 832 | 37% | Shield Rush (580) |
| Slinger | ranged | 991 | 570 | 0 | 37% | Stunning Stone (317) |
| Trapper | ranged | 772 | 432 | 35 | 35% | Double Barrel (254) |
| Javelin Huntress | ranged | 1,743 | 1,058 | 278 | 34% | Javelin Rain (443) |
| Druid | support | 399 | 193 | 23 | 31% | Rejuvenate (140) |
| Enchantress | support | 396 | 180 | 0 | 31% | Heartbreak (103) |
| Plague Doctor | caster | 1,025 | 413 | 0 | 29% | Cure (178) |
| Quartermaster | support | 488 | 215 | 46 | 29% | Pot Helmet (215) |
| Ninja | ranged | 852 | 306 | 18 | 26% | Kunai Rain (125) |
| Engineer | ranged | 1,293 | 378 | 0 | 23% | Deploy Turret (182) |
| Clockmaker | support | 531 | 151 | 0 | 22% | Rewind (151) |
| Warden | tank | 738 | 182 | 0 | 20% | Chain Gang (133) |
| Beekeeper | support | 822 | 45 | 131 | 5% | Smoker (44) |
| Bard | support | 934 | 32 | 0 | 3% | Encore (32) |

### Abilities worth more than the weapon

| Hero | Ability | Tiers | Casts/min | Value/min | Mostly | Weapon dmg/min | x weapon |
| --- | --- | --- | ---: | ---: | --- | ---: | ---: |
| Haymaker | Hay Bale (forkCharge) | II, III | 8.1 / 8.7 | 635 / 1,981 | dmg | 470 / 533 | 1.3x / 3.7x |
| Necromancer | Life Drain (lifeDrain) | I, II, III | 6.2 / 7.3 / 7.6 | 423 / 786 / 1,439 | dmg | 289 / 284 / 608 | 1.5x / 2.8x / 2.4x |
| Jester | Juggling Act (juggle) | III | 11.8 | 2,136 | dmg | 1,044 | 2x |
| Granny Reaper | Reap (reap) | II, III | 10.8 / 12.4 | 997 / 3,336 | dmg | 958 / 1,700 | 1x / 2x |
| Bandit | Dirty Trick (pickpocket) | II, III | 10.6 / 12 | 1,713 / 3,260 | dmg | 922 / 1,750 | 1.9x / 1.9x |
| The Mob | Pile On (pileOn) | I, II, III | 6.8 / 10.2 / 11.4 | 624 / 1,290 / 2,146 | dmg | 614 / 696 / 1,334 | 1x / 1.9x / 1.6x |
| Monk | Flurry (flurry) | II, III | 8 / 8.7 | 518 / 1,187 | heal | 437 / 735 | 1.2x / 1.6x |
| Frost Mage | Ice Shard (iceShard) | III | 17.1 | 1,495 | dmg | 1,016 | 1.5x |
| Pirate | Point Blank (pointBlank) | III | 13.2 | 2,000 | dmg | 1,385 | 1.4x |
| Marksman | Aimed Shot (aimedShot) | II, III | 10.3 / 12.1 | 1,144 / 2,433 | dmg | 907 / 1,838 | 1.3x / 1.3x |
| Telekinetic | Hurl (hurl) | III | 13.5 | 1,795 | dmg | 1,437 | 1.2x |
| Grandpa Sickle | Bread Toss (breadToss) | II, III | 7.4 / 6.7 | 712 / 1,188 | heal | 582 / 982 | 1.2x / 1.2x |
| Berserker | Whirl (whirl) | III | 9.8 | 2,379 | dmg | 2,050 | 1.2x |
| Falconer | Loose the Falcon (looseFalcon) | II, III | 10 / 9.6 | 1,032 / 1,802 | amp | 945 / 1,728 | 1.1x / 1x |
| Harpooner | Drop Anchor (anchorDrop) | III | 9.5 | 1,846 | dmg | 1,702 | 1.1x |
| Archer | Barrage (barrage) | II, III | 12.5 / 13.9 | 801 / 1,375 | dmg | 757 / 1,303 | 1.1x / 1.1x |
| Old Guard | Parry (pommelStrike) | II, III | 10.8 / 11.9 | 628 / 1,046 | dmg | 598 / 1,001 | 1x / 1x |
| Tower | Charge (charge) | III | 13.3 | 550 | dmg | 539 | 1x |
| Old Guard | Great Sweep (greatSweep) | III | 11.5 | 1,018 | dmg | 1,001 | 1x |
| Monk | Inner Peace (innerPeace) | II | 3.5 | 442 | heal | 437 | 1x |
| Bearskin | Bear Claws (bearRoar) | III | 8.7 | 1,380 | dmg | 1,373 | 1x |

## 4. Things that look broken or odd

### Battles that end while a fighter is only out of sight

Battle mode (battle.js) calls a side beaten when nobody on it is "fighting", and it does not count a unit that is ethereal (bar a sand burrower under the sand). Several heroes go ethereal for a moment as part of an ability (underground, a flock of birds, a broom, a shadow dash, a bush), and the Digger's Bury makes a foe ethereal. When that unit is the last one standing on its side, the battle ends on the spot: a hero alone that ducks out loses, and a lone foe that gets buried counts as beaten. The dungeon is not affected (its room check counts every living enemy). Checked with tools/audit/heroes/vanish-check.mjs: the same battles as the audit, 6 seeds each, 10,620 battles, 481 of them ended this way. **These fights are in the numbers above as they happened**, so these heroes' 1v1 results (and some others) are not real wins or losses; read their win rates and cast counts with that in mind.

| Hero | Battles ended so | Where (tier, scenario, how many of the seeds) | Who was out of it (how, and the last ability they had used) |
| --- | ---: | --- | --- |
| Digger | 133 | I 1v1 melee 6/6; I 1v1 ranged 6/6; I 1v1 caster 6/6; I 1v1 tank 6/6; I Ogre 6/6; I Swarm 6/6; I Duo 6/6; II 1v1 melee 6/6; II 1v1 ranged 6/6; II 1v1 caster 6/6; II 1v1 tank 6/6; II Ogre 6/6; II Swarm 6/6; II Duo 6/6; III 1v1 melee 6/6; III 1v1 ranged 6/6; III 1v1 caster 6/6; III 1v1 tank 6/6; III Swarm 6/6; III Duo 6/6; III Ogre 4/6; I +healer ally 3/6; III Boars 3/6; II Boars 2/6; I Boars 1/6 | digger ethereal+hidden, last cast burrow (98), wildmane buried+ethereal+hidden (13), paladin buried+ethereal+hidden (9), paladin buried+ethereal+hidden, last cast shieldBash (7) |
| Falconer | 102 | I 1v1 melee 6/6; I 1v1 tank 6/6; I Ogre 6/6; I Boars 6/6; I Swarm 6/6; I Duo 6/6; II 1v1 melee 6/6; II 1v1 tank 6/6; II Boars 6/6; II Swarm 6/6; II Duo 6/6; III 1v1 melee 6/6; III 1v1 tank 6/6; III Boars 6/6; III Swarm 6/6; II Ogre 3/6; III Ogre 3/6; III Duo 2/6; III +tank ally 2/6; I +healer ally 1/6; II +healer ally 1/6 | falconer ethereal+hidden, last cast flock (102) |
| Trapper | 101 | I 1v1 melee 6/6; I 1v1 caster 6/6; I 1v1 tank 6/6; I Boars 6/6; I Swarm 6/6; I Duo 6/6; II 1v1 melee 6/6; II 1v1 tank 6/6; III 1v1 melee 6/6; II +healer ally 5/6; III +tank ally 5/6; I +healer ally 4/6; II Boars 4/6; III Boars 4/6; I 1v1 ranged 3/6; II 1v1 ranged 3/6; II 1v1 caster 3/6; II +tank ally 3/6; III Duo 3/6; III +healer ally 3/6; III 1v1 tank 2/6; I Ogre 1/6; I +tank ally 1/6; II Swarm 1/6; III 1v1 ranged 1/6; III 1v1 caster 1/6 | trapper ethereal+hidden, last cast tripwire (101) |
| Witch | 97 | I 1v1 melee 6/6; I 1v1 tank 6/6; I Ogre 6/6; I Boars 6/6; I Swarm 6/6; II 1v1 melee 6/6; II 1v1 tank 6/6; II Ogre 6/6; II Boars 6/6; II Swarm 6/6; III 1v1 melee 6/6; III 1v1 tank 6/6; III Boars 6/6; III Swarm 6/6; I Duo 3/6; II Duo 3/6; II +healer ally 2/6; III Ogre 2/6; I +healer ally 1/6; III Duo 1/6; III +healer ally 1/6 | witch ethereal, last cast broomRide (97) |
| Shade | 48 | I Boars 6/6; I Swarm 6/6; II Boars 6/6; II Swarm 6/6; III Boars 6/6; III Swarm 6/6; III Duo 5/6; II Duo 3/6; I Duo 2/6; II 1v1 ranged 2/6 | shade ethereal, last cast shadowWalk (34), shade ethereal, last cast blackout (10), shade ethereal, last cast deathMark (4) |

**What these heroes look like when the fight is allowed to go on** (a what-if in the test runner only, fights.mjs 'fairEnd': the battle does not end while a side's last fighter is only out of sight; the game is unchanged). Tier II, the ten battle scenarios, 12 seeds each, the same fights as above. Each cell: as measured above → with the fight allowed to go on.

| Hero | 1v1 win rate | 1v1 fight length | Other battles win rate | Other battles length | Casts a minute, all ten battles |
| --- | --- | --- | --- | --- | --- |
| Digger | 54% → 100% | 3s → 43s | 33% → 92% | 22s → 34s | Dirt Fling 9.7 → 9.9; Burrow 6.6 → 5.1; Bury 9.3 → 9.6 |
| Falconer | 50% → 98% | 13s → 39s | 40% → 97% | 22s → 39s | Loose the Falcon 10.1 → 9.5; Keen Eye 3.2 → 2.8; Call the Flock 4 → 5.1 |
| Shade | 13% → 17% | 34s → 35s | 58% → 94% | 24s → 33s | Shadow Walk 2.2 → 2.4; Blackout 1.7 → 2.1; Shadow Clones 7.8 → 7.9 |
| Trapper | 0% → 44% | 30s → 58s | 69% → 88% | 39s → 57s | Jaw Trap 8.3 → 8.2; Double Barrel 6.5 → 6; Bush 1 → 2.4 |
| Witch | 0% → 50% | 15s → 37s | 39% → 99% | 24s → 36s | Hex 7.2 → 7.4; Cursed Brew 1.7 → 1.6; Broom Ride 3.7 → 4.3 |

### Casts that leave nothing measurable

Casts after which nothing the recorder can see was credited to the ability before its next cast (no damage, heal, block, status, buff, timed state on anyone, or summon). Some of these do things it cannot count (moving the hero, pulling a foe, taunting, walls that stop shots): see the notes.

| Hero | Ability | Casts (all fights) | Casts with nothing measured | Note |
| --- | --- | ---: | ---: | --- |
| Archer | Frost Arrow (frostArrow) | 2502 | 45% | Many casts lose their arrow: Barrage, cast inside the draw, throws it away (section 4, queued blows). |
| Archer | Roll (roll) | 501 | 67% | A roll out of reach (caltrops at III count as damage). Distance kept is not counted. |
| Twinfang | Dash (dash) | 1928 | 89% | A move in or out of reach. Only blows that land in its 0.3 s of untouchability count. |
| Frost Mage | Ice Wall (iceWall) | 1055 | 85% | A wall: the steps and shots it stops are not counted. |
| Bard | Encore (encore) | 623 | 45% | Resets a friend's longest cooldown (and heals 10% at II): the reset is not counted. |
| Druid | Entangle (entangle) | 1367 | 59% | Roots foes standing in the vines: counted as control seconds, not value. |
| Grandpa Sickle | Old Tales (oldTales) | 148 | 97% | Takes 4-6 s off friends' cooldowns: not counted. |
| Chef | Hot Meal (hotMeal) | 1501 | 50% |  |
| Trapper | Bush (tripwire) | 255 | 99% |  |
| Werewolf | Turn (turnWolf) | 575 | 67% |  |
| Earth Mage | Stone Wall (stoneWall) | 1431 | 52% | A wall: the steps and shots it stops are not counted. |

### Queued blows thrown away

Some abilities queue their blow to land a moment after the cast (an arrow loosed after the draw, a fireball after the gather). In kits.js several of them replace the hero's whole queue (u.later = [...]) instead of adding to it, so a second ability cast inside that moment throws the first one's blow away: the cooldown is spent and nothing happens. Counted over every fight:

| Hero | Ability | Casts | Blows thrown away | Share of casts | Thrown away by |
| --- | --- | ---: | ---: | ---: | --- |
| Archer | Frost Arrow (frostArrow) | 2502 | 723 | 29% | Barrage (723) |
| Archer | Barrage (barrage) | 2494 | 218 | 9% | Frost Arrow (218) |
| Air Mage | Cyclone (cyclone) | 793 | 11 | 1% | weapon or other (11) |
| Earth Mage | Stone Wall (stoneWall) | 1431 | 8 | 1% | weapon or other (8) |

### Still going when it comes off cooldown

How often the ability came off cooldown while something it started last time was still running (its buff, a timed state, a summon, a zone, a timer). The cooldowns lane covers this in depth; this is a flag only.

| Hero | Ability | Times off cooldown | Still going | What was still going |
| --- | --- | ---: | ---: | --- |
| Pyromancer | Fireball (fireball) | 2584 | 63% | zone fire (1620) |
| Bard | War Song (warSong) | 1684 | 54% | buff warSong (915) |
| Ninja | Caltrops (caltrops) | 1970 | 53% | timer caltrops (1051) |
| Enchantress | Sweetheart (sweetheart) | 1680 | 53% | buff beloved (884) |
| Necromancer | Raise Dead (raiseDead) | 1410 | 52% | summon minion (734) |
| Pirate | Point Blank (pointBlank) | 3075 | 45% | state targeted (1375) |
| Trapper | Jaw Trap (jawTrap) | 2040 | 43% | state trapped (74), timer trap5196 (5), timer trap7048 (3) |
| Griffon | Stormhammer (hammerThrow) | 3482 | 42% | state whirled (1450) |
| Warhelm | Storm Born (warHorn) | 1107 | 40% | timer stormBorn (443) |
| Engineer | Tinker (tinker) | 1802 | 39% | state armorFront (289), summon tesla (152), summon snowMortar (152) |
| Marksman | Aimed Shot (aimedShot) | 1818 | 32% | state targeted (587) |
| Seer | Foresight (foresight) | 3460 | 30% | buff foresight (1044) |
| Alchemist | Brew Pools (acidFlask) | 2575 | 29% | state whirled (82), timer pool3891 (3), timer pool7440 (2) |
| Plague Doctor | Miasma (miasma) | 1371 | 28% | zone poison (385) |
| Engineer | Deploy Turret (deployTurret) | 1033 | 26% | summon turret (262), summon windup (1), summon medDrone (1) |
| Warlock | Awaken (summonImp) | 709 | 25% | buff demon (176) |
| Crossbowman | Pavise (pavise) | 1282 | 24% | summon pavise (302) |
| Engineer | Wind-up Drones (shockMine) | 2316 | 24% | summon windup (493), summon turret (56), summon medDrone (12) |
| Wildmane | Rage (rage) | 1329 | 23% | buff rage (304) |
| Monk | Palm Strike (palmStrike) | 3041 | 21% | state spun (645) |
| Falconer | Loose the Falcon (looseFalcon) | 1318 | 21% | state tracked (176), timer falcon (96) |
| Shaman | Healing Totem (healTotem) | 1538 | 20% | state totemSkin (298), summon spiritEagle (9), summon spiritBeaver (3) |

## 5. Fight results

Win rate and average fight length (s) per scenario. A timeout counts as not a win. In the dungeon a win is clearing the first floor.

### Tier I

| Hero | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | ---: | ---: | ---: | --- | --- | --- | ---: | ---: | --- | --- | ---: |
| Paladin | 100% 45s | 8% 69s | 0% 36s | 67% 117s (1 t/o) | 0% 55s | 50% 61s | 100% 30s | 100% 92s | 100% 88s | 58% 83s | 100% 175s |
| Tower | 100% 45s | 0% 75s | 0% 47s | 17% 116s | 0% 57s | 0% 68s | 100% 24s | 100% 98s | 100% 88s | 67% 98s (1 t/o) | 100% 180s |
| Archer | 92% 23s | 33% 14s | 83% 11s | 92% 70s | 100% 48s | 83% 52s | 67% 35s | 100% 26s | 100% 41s | 67% 54s | 100% 122s |
| Twinfang | 8% 22s | 8% 23s | 17% 15s | 0% 55s | 0% 42s | 0% 26s | 0% 28s | 100% 36s | 100% 38s | 58% 66s | 100% 134s |
| Wildmane | 33% 22s | 0% 23s | 0% 17s | 0% 45s | 0% 30s | 25% 17s | 100% 12s | 100% 32s | 100% 55s | 83% 53s | 100% 132s |
| Berserker | 92% 17s | 0% 19s | 0% 15s | 0% 39s | 0% 27s | 0% 16s | 100% 12s | 100% 36s | 100% 58s | 8% 41s | 100% 159s |
| Granny Reaper | 0% 17s | 58% 16s | 17% 12s | 0% 34s | 0% 26s | 0% 15s | 100% 14s | 100% 23s | 100% 43s | 8% 50s | 100% 129s |
| Pyromancer | 100% 17s | 17% 12s | 58% 9s | 100% 35s | 100% 33s | 83% 27s | 100% 15s | 100% 19s | 100% 31s | 75% 38s | 100% 135s |
| Frost Mage | 58% 34s | 8% 14s | 17% 12s | 75% 102s (1 t/o) | 100% 82s | 50% 65s | 58% 30s | 92% 38s | 92% 52s | 0% 55s (1 t/o) | 100% 154s |
| Storm Mage | 33% 31s | 0% 11s | 17% 11s | 0% 76s | 100% 79s | 50% 48s | 58% 19s | 67% 34s | 92% 41s | 17% 45s | 100% 147s |
| Cleric | 0% 77s | 0% 19s | 0% 16s | 0% 107s (5 t/o) | 0% 116s (9 t/o) | 0% 76s (2 t/o) | 0% 18s | 0% 47s | 75% 91s (1 t/o) | 8% 66s | 100% 168s |
| Bard | 100% 46s | 0% 12s | 0% 11s | 0% 80s | 92% 94s | 83% 62s | 100% 25s | 33% 45s | 83% 84s (1 t/o) | 0% 47s | 100% 149s |
| Druid | 0% 51s | 0% 16s | 0% 13s | 0% 107s (6 t/o) | 0% 120s (12 t/o) | 0% 89s (1 t/o) | 0% 29s | 42% 61s | 92% 76s | 0% 58s | 100% 164s |
| Necromancer | 0% 19s | 0% 13s | 17% 11s | 92% 50s | 58% 61s | 0% 29s | 58% 27s | 100% 33s | 100% 58s | 67% 60s | 100% 155s |
| Plague Doctor | 100% 29s | 0% 15s | 17% 14s | 100% 46s | 100% 49s | 100% 41s | 100% 17s | 100% 35s | 100% 60s | 75% 65s | 100% 157s |
| Old Guard | 33% 35s | 8% 51s | 0% 30s | 0% 77s | 0% 54s | 0% 36s | 100% 30s | 100% 73s | 100% 82s | 58% 73s | 100% 149s |
| Dame | 100% 34s | 0% 42s | 0% 28s | 100% 84s | 0% 50s | 0% 33s | 100% 38s | 100% 102s | 92% 90s (1 t/o) | 42% 78s (1 t/o) | 100% 164s |
| Griffon | 17% 32s | 0% 43s | 0% 25s | 0% 75s | 0% 43s | 0% 32s | 100% 23s | 100% 58s | 75% 91s (3 t/o) | 50% 73s (1 t/o) | 100% 152s |
| Bulwark | 0% 30s | 58% 41s | 25% 27s | 0% 69s | 0% 43s | 0% 36s | 100% 24s | 100% 51s | 92% 82s (1 t/o) | 42% 59s | 100% 185s |
| Bearskin | 100% 22s | 50% 33s | 75% 22s | 100% 56s | 92% 46s | 17% 25s | 92% 29s | 100% 30s | 100% 48s | 0% 37s | 100% 166s |
| Warhelm | 100% 12s | 83% 13s | 100% 8s | 100% 28s | 92% 25s | 67% 23s | 100% 13s | 100% 21s | 100% 34s | 92% 44s | 100% 134s |
| Bandit | 92% 21s | 100% 13s | 100% 7s | 100% 53s | 75% 41s | 0% 23s | 0% 24s | 100% 28s | 100% 42s | 50% 78s (3 t/o) | 100% 152s |
| Shade | 0% 17s | 92% 14s | 50% 11s | 0% 43s | 17% 35s | 0% 9s | 0% 11s | 67% 14s | 100% 33s | 92% 47s | 100% 118s |
| Haymaker | 0% 16s | 0% 24s | 0% 14s | 0% 38s | 0% 24s | 0% 16s | 100% 19s | 100% 31s | 100% 48s | 0% 41s | 100% 156s |
| Digger | 100% 2s | 0% 2s | 8% 3s | 100% 3s | 0% 10s | 0% 12s | 0% 3s | 0% 4s | 100% 42s | 50% 46s | 100% 133s |
| Grandpa Sickle | 0% 21s | 0% 19s | 0% 11s | 0% 48s | 0% 27s | 0% 14s | 0% 13s | 0% 34s | 92% 88s | 0% 36s | 100% 173s |
| Alchemist | 100% 33s | 0% 12s | 8% 11s | 100% 66s | 100% 57s | 75% 56s | 100% 26s | 100% 30s | 92% 49s | 8% 48s | 100% 132s |
| Shaman | 50% 76s | 0% 17s | 0% 13s | 0% 116s (8 t/o) | 0% 120s (12 t/o) | 8% 106s (3 t/o) | 8% 49s | 100% 63s | 100% 74s | 50% 96s | 100% 194s |
| Witch | 0% 5s | 0% 12s | 17% 10s | 0% 5s | 0% 8s | 0% 7s | 0% 5s | 25% 11s | 100% 37s | 58% 43s | 100% 143s |
| Warlock | 42% 21s | 67% 15s | 83% 11s | 100% 35s | 100% 42s | 67% 15s | 100% 8s | 100% 11s | 100% 22s | 100% 24s | 100% 97s |
| Cultist | 83% 30s | 8% 13s | 25% 12s | 0% 80s | 92% 63s | 75% 50s | 0% 21s | 92% 37s | 100% 40s | 33% 49s | 100% 146s |
| Monk | 0% 23s | 92% 33s | 50% 21s | 17% 87s | 0% 41s | 0% 21s | 100% 23s | 100% 51s | 92% 65s | 17% 45s | 100% 169s |
| Seer | 75% 53s | 0% 15s | 0% 13s | 0% 92s | 42% 111s (3 t/o) | 42% 72s | 0% 30s | 50% 50s | 92% 69s | 0% 52s | 100% 158s |
| Chef | 100% 54s | 0% 22s | 8% 17s | 0% 115s (9 t/o) | 75% 112s | 0% 87s (2 t/o) | 0% 28s | 92% 68s | 100% 68s | 8% 65s | 100% 159s |
| Beekeeper | 100% 45s | 0% 14s | 0% 12s | 100% 76s | 100% 82s | 100% 68s | 92% 42s | 100% 30s | 100% 57s | 58% 69s | 100% 166s |
| Quartermaster | 83% 58s | 0% 18s | 8% 17s | 0% 110s (5 t/o) | 17% 118s (9 t/o) | 0% 72s | 0% 27s | 8% 55s | 100% 72s | 8% 71s | 100% 178s |
| Crossbowman | 100% 22s | 100% 11s | 100% 7s | 100% 37s | 100% 34s | 92% 33s | 92% 24s | 100% 22s | 100% 34s | 92% 44s | 100% 132s |
| Falconer | 0% 4s | 92% 10s | 100% 9s | 0% 4s | 8% 13s | 0% 2s | 0% 2s | 8% 8s | 100% 36s | 58% 46s | 100% 153s |
| Grenadier | 92% 24s | 25% 12s | 58% 11s | 100% 58s | 100% 50s | 75% 36s | 100% 12s | 100% 28s | 100% 41s | 75% 50s | 100% 138s |
| Harpooner | 92% 20s | 100% 10s | 100% 6s | 100% 55s | 100% 45s | 75% 35s | 100% 16s | 100% 21s | 100% 33s | 92% 41s | 100% 131s |
| Javelin Huntress | 100% 16s | 83% 13s | 100% 8s | 100% 29s | 100% 23s | 100% 34s | 100% 17s | 100% 18s | 100% 34s | 100% 38s | 100% 124s |
| Marksman | 92% 17s | 25% 11s | 92% 7s | 100% 45s | 100% 36s | 33% 33s | 67% 20s | 100% 17s | 100% 31s | 92% 39s | 100% 124s |
| Ninja | 100% 28s | 33% 18s | 58% 14s | 100% 95s | 100% 57s | 92% 56s | 92% 42s | 100% 35s | 100% 47s | 50% 64s | 100% 155s |
| Pirate | 58% 24s | 17% 25s | 8% 17s | 100% 73s | 33% 50s | 0% 33s | 67% 26s | 100% 39s | 100% 49s | 67% 68s (1 t/o) | 100% 163s |
| Slinger | 100% 25s | 83% 12s | 100% 10s | 100% 69s | 100% 50s | 92% 52s | 100% 22s | 100% 27s | 100% 40s | 58% 52s | 100% 152s |
| Trapper | 0% 11s | 0% 9s | 0% 7s | 0% 28s | 83% 37s | 0% 19s | 0% 9s | 0% 13s | 100% 53s | 0% 35s | 100% 147s |
| Gladiator | 100% 13s | 92% 20s | 100% 12s | 100% 32s | 83% 30s | 0% 21s | 100% 25s | 100% 24s | 100% 40s | 17% 40s | 100% 139s |
| Jester | 67% 21s | 25% 20s | 58% 13s | 92% 59s | 75% 41s | 33% 34s | 50% 30s | 100% 29s | 100% 50s | 83% 66s | 100% 155s |
| Samurai | 100% 12s | 100% 13s | 100% 12s | 100% 15s | 92% 13s | 58% 16s | 100% 18s | 100% 18s | 100% 35s | 67% 39s | 100% 129s |
| Valkyrie | 0% 20s | 0% 19s | 0% 14s | 0% 37s | 0% 26s | 0% 19s | 100% 24s | 0% 39s | 92% 73s | 0% 39s | 100% 153s |
| Engineer | 33% 30s | 8% 23s | 0% 14s | 92% 50s | 100% 44s | 92% 32s | 100% 19s | 100% 23s | 100% 37s | 100% 43s | 100% 135s |
| Werewolf | 100% 27s | 0% 22s | 0% 17s | 100% 93s | 92% 62s | 33% 33s | 100% 25s | 100% 45s | 100% 62s | 58% 55s | 100% 139s |
| Enchantress | 33% 49s | 0% 23s | 17% 17s | 0% 101s (3 t/o) | 8% 116s (9 t/o) | 42% 86s | 0% 24s | 58% 57s | 100% 69s | 0% 53s | 100% 189s |
| The Mob | 67% 16s | 100% 15s | 92% 11s | 100% 25s | 83% 35s | 8% 27s | 100% 16s | 100% 18s | 100% 38s | 75% 50s | 100% 163s |
| Clockmaker | 92% 61s | 42% 32s | 92% 25s | 0% 114s (6 t/o) | 0% 120s (12 t/o) | 0% 108s (6 t/o) | 0% 48s | 83% 72s | 100% 69s | 0% 73s | 100% 191s |
| Air Mage | 58% 38s | 0% 13s | 8% 13s | 0% 90s | 92% 87s | 67% 60s | 100% 17s | 92% 33s | 100% 42s | 50% 45s | 100% 154s |
| Warden | 92% 50s | 0% 73s | 8% 41s | 0% 103s | 0% 60s | 8% 49s | 100% 45s | 100% 84s | 100% 82s | 67% 90s (1 t/o) | 100% 178s |
| Telekinetic | 83% 33s | 42% 14s | 100% 14s | 92% 80s | 100% 68s | 75% 57s | 100% 17s | 100% 29s | 100% 46s | 42% 53s | 100% 138s |
| Earth Mage | 75% 32s | 0% 12s | 17% 10s | 33% 95s | 100% 66s | 92% 47s | 100% 17s | 100% 26s | 100% 38s | 75% 47s | 100% 135s |

### Tier II

| Hero | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | ---: | ---: | --- | --- | --- | --- | ---: | --- | --- | ---: |
| Paladin | 33% 89s | 0% 42s | 0% 44s | 0% 120s (12 t/o) | 75% 95s | 100% 75s | 100% 25s | 100% 71s | 92% 89s (1 t/o) | 83% 87s | 100% 104s |
| Tower | 0% 97s | 0% 61s | 0% 62s | 0% 120s (12 t/o) | 0% 75s | 92% 87s | 100% 24s | 100% 81s | 92% 91s (1 t/o) | 83% 102s (1 t/o) | 100% 113s |
| Archer | 58% 32s | 42% 25s | 100% 21s | 100% 42s | 100% 32s | 100% 31s | 100% 24s | 100% 19s | 100% 44s | 75% 49s | 100% 98s |
| Twinfang | 0% 39s | 0% 30s | 0% 25s | 17% 86s | 92% 59s | 100% 45s | 100% 30s | 100% 37s | 100% 44s | 92% 69s (1 t/o) | 100% 91s |
| Wildmane | 58% 44s | 58% 31s | 100% 27s | 75% 90s | 100% 42s | 100% 25s | 100% 11s | 100% 34s | 100% 57s | 100% 55s | 100% 101s |
| Berserker | 0% 33s | 0% 30s | 0% 38s | 100% 62s | 100% 38s | 100% 22s | 100% 10s | 100% 26s | 100% 61s | 42% 55s | 100% 104s |
| Granny Reaper | 0% 34s | 100% 13s | 100% 9s | 0% 63s | 100% 34s | 75% 30s | 100% 11s | 100% 20s | 100% 36s | 42% 47s | 100% 87s |
| Pyromancer | 0% 28s | 33% 18s | 42% 20s | 92% 44s | 100% 31s | 100% 21s | 100% 9s | 100% 18s | 100% 35s | 92% 34s | 100% 89s |
| Frost Mage | 0% 35s | 0% 23s | 0% 23s | 92% 94s | 100% 80s | 100% 73s | 100% 31s | 100% 32s | 83% 56s | 50% 71s | 100% 119s |
| Storm Mage | 0% 40s | 0% 20s | 0% 20s | 0% 118s (10 t/o) | 100% 97s | 100% 60s | 100% 20s | 100% 43s | 100% 58s | 42% 59s | 100% 97s |
| Cleric | 0% 93s | 0% 43s | 0% 46s | 0% 120s (12 t/o) | 0% 120s (12 t/o) | 0% 117s (9 t/o) | 0% 45s | 100% 93s | 75% 81s | 0% 84s (1 t/o) | 100% 117s |
| Bard | 0% 61s | 0% 21s | 0% 26s | 0% 97s | 92% 102s (1 t/o) | 100% 57s | 100% 24s | 100% 51s | 100% 77s | 33% 68s | 100% 105s |
| Druid | 0% 55s | 0% 28s | 0% 24s | 0% 119s (10 t/o) | 0% 120s (11 t/o) | 0% 120s (11 t/o) | 50% 117s (6 t/o) | 100% 66s | 83% 82s | 0% 79s (4 t/o) | 100% 126s |
| Necromancer | 0% 32s | 0% 21s | 0% 20s | 100% 61s | 100% 73s | 75% 64s | 100% 30s | 100% 37s | 83% 67s | 0% 43s | 100% 115s |
| Plague Doctor | 50% 51s | 0% 44s | 100% 43s | 100% 49s | 100% 52s | 100% 40s | 100% 22s | 100% 37s | 100% 78s | 92% 79s | 100% 119s |
| Old Guard | 100% 51s | 0% 40s | 67% 40s | 100% 108s | 100% 57s | 83% 47s | 100% 22s | 100% 41s | 100% 66s | 58% 68s | 100% 106s |
| Dame | 100% 57s | 0% 42s | 17% 43s | 83% 113s (2 t/o) | 92% 81s | 92% 58s | 100% 36s | 100% 73s | 100% 92s | 17% 55s | 100% 111s |
| Griffon | 75% 48s | 0% 36s | 0% 35s | 0% 120s (12 t/o) | 17% 71s | 17% 55s | 100% 24s | 100% 47s | 75% 81s | 33% 67s | 100% 110s |
| Bulwark | 0% 59s | 0% 47s | 0% 38s | 0% 120s (12 t/o) | 83% 89s | 42% 66s | 100% 21s | 100% 66s | 100% 88s | 50% 89s (1 t/o) | 100% 117s |
| Bearskin | 100% 39s | 83% 42s | 100% 35s | 100% 50s | 100% 40s | 100% 39s | 100% 22s | 100% 26s | 92% 49s | 0% 33s | 100% 101s |
| Warhelm | 100% 18s | 100% 19s | 100% 13s | 100% 34s | 100% 21s | 100% 26s | 100% 16s | 100% 21s | 100% 42s | 100% 48s | 100% 92s |
| Bandit | 100% 20s | 100% 11s | 100% 9s | 100% 20s | 100% 15s | 100% 25s | 100% 37s | 100% 17s | 100% 39s | 92% 47s | 100% 119s |
| Shade | 0% 28s | 33% 25s | 17% 22s | 0% 59s | 92% 36s | 0% 5s | 0% 8s | 58% 10s | 100% 36s | 100% 50s | 100% 88s |
| Haymaker | 83% 41s | 67% 31s | 42% 23s | 83% 61s | 25% 36s | 8% 35s | 100% 23s | 100% 36s | 83% 62s | 17% 40s | 100% 122s |
| Digger | 100% 3s | 17% 3s | 0% 2s | 100% 3s | 0% 9s | 58% 27s | 0% 3s | 0% 4s | 100% 42s | 42% 45s | 100% 104s |
| Grandpa Sickle | 0% 95s | 0% 72s | 0% 41s | 0% 120s (12 t/o) | 67% 92s | 33% 52s | 100% 31s | 100% 80s | 100% 85s | 8% 57s | 100% 112s |
| Alchemist | 100% 60s | 92% 32s | 92% 25s | 100% 60s | 100% 48s | 100% 43s | 100% 20s | 100% 23s | 100% 61s | 92% 70s | 100% 98s |
| Shaman | 0% 62s | 0% 28s | 0% 28s | 0% 95s (2 t/o) | 0% 118s (11 t/o) | 50% 116s (6 t/o) | 100% 64s | 100% 53s | 100% 76s | 33% 107s (5 t/o) | 100% 117s |
| Witch | 0% 7s | 0% 20s | 0% 22s | 0% 10s | 17% 30s | 0% 12s | 0% 3s | 67% 18s | 100% 41s | 50% 40s | 100% 89s |
| Warlock | 0% 20s | 17% 31s | 58% 21s | 92% 32s | 100% 36s | 100% 15s | 100% 10s | 100% 11s | 100% 25s | 100% 28s | 100% 84s |
| Cultist | 0% 46s | 0% 22s | 0% 23s | 58% 54s | 100% 56s | 100% 41s | 100% 47s | 100% 36s | 92% 43s | 92% 57s | 100% 80s |
| Monk | 75% 109s (3 t/o) | 100% 42s | 100% 44s | 0% 120s (12 t/o) | 100% 71s | 100% 73s | 100% 25s | 100% 40s | 100% 59s | 83% 77s | 100% 100s |
| Seer | 0% 89s | 0% 47s | 33% 46s | 0% 120s (11 t/o) | 92% 102s (1 t/o) | 100% 81s | 100% 51s | 100% 47s | 92% 69s | 8% 61s | 100% 94s |
| Chef | 0% 100s (2 t/o) | 83% 79s | 83% 52s | 0% 112s (8 t/o) | 100% 112s | 100% 105s | 100% 31s | 100% 61s | 92% 71s | 83% 82s | 100% 105s |
| Beekeeper | 83% 106s | 58% 51s | 83% 41s | 100% 94s | 100% 91s | 100% 75s | 100% 49s | 100% 40s | 100% 69s | 58% 88s | 100% 125s |
| Quartermaster | 0% 68s | 0% 36s | 0% 37s | 0% 119s (10 t/o) | 83% 116s (2 t/o) | 0% 111s (8 t/o) | 92% 80s | 100% 60s | 83% 76s | 17% 80s (1 t/o) | 100% 112s |
| Crossbowman | 100% 26s | 100% 14s | 100% 11s | 100% 37s | 100% 30s | 100% 30s | 100% 22s | 100% 21s | 100% 35s | 100% 46s | 100% 78s |
| Falconer | 0% 4s | 100% 23s | 100% 19s | 0% 7s | 33% 26s | 0% 3s | 0% 2s | 25% 12s | 100% 40s | 83% 51s | 100% 100s |
| Grenadier | 50% 42s | 33% 22s | 67% 21s | 100% 77s | 100% 52s | 100% 35s | 100% 13s | 100% 19s | 100% 42s | 92% 49s | 100% 91s |
| Harpooner | 0% 35s | 100% 18s | 100% 14s | 0% 70s | 100% 44s | 100% 35s | 100% 12s | 100% 21s | 100% 41s | 92% 46s | 100% 81s |
| Javelin Huntress | 100% 23s | 100% 16s | 100% 15s | 100% 25s | 100% 17s | 100% 28s | 100% 15s | 100% 18s | 100% 37s | 100% 43s | 100% 89s |
| Marksman | 100% 25s | 100% 16s | 100% 13s | 100% 41s | 100% 37s | 100% 32s | 100% 20s | 100% 17s | 100% 36s | 92% 45s | 100% 80s |
| Ninja | 33% 76s | 0% 28s | 0% 27s | 100% 102s | 100% 61s | 100% 56s | 100% 39s | 100% 40s | 83% 63s | 50% 77s | 100% 108s |
| Pirate | 100% 43s | 100% 36s | 100% 28s | 100% 76s | 100% 45s | 100% 41s | 100% 25s | 100% 33s | 100% 53s | 100% 69s | 100% 101s |
| Slinger | 83% 43s | 100% 20s | 100% 16s | 100% 69s | 100% 43s | 100% 49s | 100% 24s | 100% 25s | 100% 48s | 75% 58s | 100% 99s |
| Trapper | 0% 21s | 0% 17s | 0% 20s | 0% 61s | 100% 39s | 42% 36s | 67% 21s | 100% 39s | 92% 63s | 17% 39s | 100% 94s |
| Gladiator | 100% 22s | 42% 32s | 100% 10s | 100% 42s | 100% 26s | 100% 34s | 100% 24s | 100% 18s | 100% 44s | 100% 54s | 100% 97s |
| Jester | 8% 40s | 0% 26s | 33% 23s | 0% 91s | 100% 37s | 100% 38s | 100% 32s | 100% 25s | 100% 53s | 75% 67s | 100% 93s |
| Samurai | 100% 12s | 100% 11s | 100% 7s | 100% 16s | 100% 9s | 100% 14s | 100% 18s | 100% 13s | 100% 30s | 75% 33s | 100% 84s |
| Valkyrie | 0% 41s | 0% 23s | 0% 23s | 0% 61s | 0% 37s | 0% 44s | 100% 26s | 100% 76s | 100% 83s | 0% 34s | 100% 109s |
| Engineer | 0% 44s | 0% 30s | 8% 22s | 8% 117s (10 t/o) | 100% 44s | 100% 34s | 100% 20s | 100% 30s | 100% 55s | 100% 63s | 100% 108s |
| Werewolf | 100% 91s | 42% 47s | 100% 43s | 0% 120s (12 t/o) | 100% 63s | 100% 38s | 100% 24s | 100% 30s | 100% 53s | 100% 77s | 100% 99s |
| Enchantress | 0% 79s | 0% 32s | 0% 35s | 0% 115s (8 t/o) | 0% 120s (12 t/o) | 100% 87s | 100% 58s | 100% 60s | 100% 74s | 42% 104s (3 t/o) | 100% 143s |
| The Mob | 8% 29s | 92% 22s | 100% 12s | 100% 51s | 100% 34s | 100% 36s | 100% 14s | 100% 19s | 100% 41s | 100% 49s | 100% 85s |
| Clockmaker | 0% 115s (4 t/o) | 100% 84s | 100% 62s | 0% 120s (12 t/o) | 0% 120s (12 t/o) | 0% 120s (12 t/o) | 100% 103s | 100% 70s | 100% 79s | 0% 113s (7 t/o) | 100% 120s |
| Air Mage | 0% 40s | 0% 26s | 25% 29s | 0% 117s (10 t/o) | 100% 99s | 100% 63s | 100% 18s | 100% 33s | 100% 48s | 67% 64s (1 t/o) | 100% 93s |
| Warden | 42% 90s | 0% 45s | 17% 51s | 0% 120s (12 t/o) | 67% 104s | 100% 71s | 100% 40s | 100% 61s | 100% 73s | 75% 101s (1 t/o) | 100% 103s |
| Telekinetic | 33% 46s | 100% 16s | 100% 17s | 100% 56s | 100% 49s | 100% 48s | 100% 19s | 100% 21s | 100% 47s | 100% 56s | 100% 89s |
| Earth Mage | 0% 42s | 0% 22s | 33% 27s | 75% 115s (3 t/o) | 100% 68s | 100% 39s | 100% 13s | 100% 20s | 100% 39s | 100% 41s | 100% 95s |

### Tier III

| Hero | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- | --- | ---: |
| Paladin | 0% 58s | 0% 27s | 8% 30s | 58% 109s | 58% 73s | 100% 47s | 100% 22s | 100% 51s | 92% 69s | 33% 59s | 100% 122s |
| Tower | 0% 59s | 0% 38s | 0% 40s | 100% 86s | 75% 68s | 100% 57s | 100% 24s | 100% 48s | 100% 66s | 100% 68s | 100% 125s |
| Archer | 33% 25s | 50% 17s | 83% 16s | 100% 28s | 100% 28s | 100% 25s | 100% 18s | 100% 16s | 100% 33s | 100% 35s | 100% 96s |
| Twinfang | 0% 27s | 0% 20s | 8% 18s | 0% 50s | 83% 44s | 100% 28s | 100% 17s | 100% 24s | 100% 28s | 92% 49s (1 t/o) | 100% 84s |
| Wildmane | 58% 35s | 25% 25s | 100% 20s | 100% 58s | 100% 33s | 100% 19s | 100% 10s | 100% 27s | 100% 43s | 100% 39s | 100% 106s |
| Berserker | 0% 25s | 100% 35s | 100% 22s | 100% 33s | 100% 27s | 100% 15s | 100% 7s | 100% 12s | 100% 30s | 100% 30s | 100% 105s |
| Granny Reaper | 17% 31s | 100% 8s | 100% 6s | 100% 44s | 100% 24s | 100% 21s | 100% 8s | 100% 13s | 100% 23s | 92% 28s | 100% 103s |
| Pyromancer | 0% 22s | 17% 15s | 42% 15s | 100% 30s | 100% 28s | 100% 21s | 100% 8s | 100% 15s | 75% 28s | 100% 37s | 100% 110s |
| Frost Mage | 25% 22s | 8% 16s | 58% 15s | 100% 37s | 100% 39s | 100% 39s | 100% 23s | 100% 25s | 75% 37s | 75% 54s | 100% 113s |
| Storm Mage | 0% 28s | 0% 16s | 50% 21s | 100% 80s | 100% 62s | 100% 34s | 100% 16s | 100% 24s | 83% 36s | 83% 49s | 100% 90s |
| Cleric | 0% 75s | 0% 33s | 25% 37s | 0% 120s (12 t/o) | 83% 115s (2 t/o) | 0% 120s (12 t/o) | 100% 109s | 100% 71s | 58% 62s | 67% 77s | 100% 128s |
| Bard | 0% 49s | 0% 16s | 0% 18s | 0% 62s | 100% 91s | 100% 56s | 100% 22s | 100% 44s | 92% 56s | 67% 75s | 100% 119s |
| Druid | 0% 42s | 0% 18s | 0% 20s | 0% 105s (4 t/o) | 0% 119s (11 t/o) | 100% 80s | 100% 39s | 100% 49s | 42% 54s | 58% 85s (1 t/o) | 100% 132s |
| Necromancer | 0% 24s | 0% 15s | 0% 16s | 100% 38s | 100% 57s | 100% 56s | 100% 22s | 100% 28s | 50% 50s | 17% 39s | 100% 123s |
| Plague Doctor | 100% 52s | 83% 47s | 100% 38s | 100% 37s | 100% 39s | 100% 38s | 100% 25s | 100% 30s | 92% 67s | 92% 67s | 100% 138s |
| Old Guard | 100% 24s | 25% 25s | 75% 22s | 100% 42s | 100% 41s | 100% 35s | 100% 19s | 100% 24s | 100% 47s | 100% 50s | 100% 112s |
| Dame | 100% 37s | 8% 26s | 25% 27s | 100% 74s | 100% 69s | 100% 53s | 100% 24s | 100% 59s | 83% 71s | 83% 80s | 100% 126s |
| Griffon | 0% 38s | 0% 23s | 0% 23s | 0% 75s | 8% 52s | 0% 41s | 100% 20s | 100% 34s | 83% 53s | 17% 56s | 100% 118s |
| Bulwark | 100% 46s | 0% 30s | 17% 27s | 100% 98s | 100% 71s | 92% 63s | 100% 26s | 100% 47s | 75% 76s | 92% 92s | 100% 129s |
| Bearskin | 100% 16s | 67% 25s | 83% 21s | 100% 17s | 100% 20s | 100% 22s | 100% 18s | 100% 15s | 92% 35s | 0% 33s | 100% 105s |
| Warhelm | 100% 12s | 92% 12s | 100% 9s | 100% 17s | 100% 17s | 100% 23s | 100% 15s | 100% 17s | 100% 31s | 83% 41s | 100% 98s |
| Bandit | 100% 11s | 100% 5s | 100% 4s | 100% 12s | 100% 12s | 100% 19s | 100% 32s | 100% 12s | 100% 32s | 67% 46s (1 t/o) | 100% 116s |
| Shade | 0% 18s | 0% 17s | 25% 16s | 0% 35s | 67% 26s | 0% 2s | 0% 2s | 42% 9s | 83% 23s | 100% 33s | 100% 85s |
| Haymaker | 100% 18s | 42% 19s | 58% 16s | 100% 24s | 100% 24s | 100% 29s | 100% 28s | 100% 16s | 100% 44s | 83% 51s | 100% 115s |
| Digger | 92% 3s | 25% 2s | 0% 2s | 100% 3s | 17% 13s | 58% 18s | 0% 3s | 17% 5s | 83% 26s | 100% 31s | 100% 100s |
| Grandpa Sickle | 0% 120s (12 t/o) | 17% 110s (6 t/o) | 67% 103s (4 t/o) | 100% 106s | 100% 86s | 100% 55s | 100% 25s | 100% 58s | 83% 63s | 8% 48s (1 t/o) | 100% 137s |
| Alchemist | 100% 46s | 92% 23s | 100% 18s | 100% 34s | 100% 55s | 100% 34s | 100% 19s | 100% 21s | 100% 48s | 83% 51s | 100% 111s |
| Shaman | 0% 37s | 0% 17s | 0% 22s | 0% 54s | 0% 118s (11 t/o) | 100% 103s | 100% 63s | 100% 44s | 83% 60s | 92% 99s (1 t/o) | 100% 128s |
| Witch | 0% 7s | 0% 16s | 17% 17s | 0% 11s | 50% 40s | 8% 9s | 0% 3s | 67% 17s | 75% 32s | 92% 35s | 100% 127s |
| Warlock | 0% 15s | 17% 19s | 67% 18s | 33% 22s | 100% 39s | 100% 14s | 100% 10s | 100% 11s | 100% 22s | 58% 31s | 100% 103s |
| Cultist | 0% 31s | 0% 16s | 17% 19s | 50% 35s | 100% 48s | 100% 19s | 100% 25s | 100% 23s | 100% 32s | 100% 39s | 100% 107s |
| Monk | 100% 59s | 100% 26s | 100% 34s | 100% 87s | 100% 44s | 100% 48s | 100% 25s | 100% 27s | 100% 51s | 58% 51s | 100% 128s |
| Seer | 8% 77s | 0% 35s | 50% 33s | 83% 109s | 100% 86s | 100% 62s | 100% 46s | 100% 36s | 75% 48s | 50% 72s | 100% 117s |
| Chef | 0% 66s | 50% 40s | 92% 34s | 0% 63s | 100% 95s | 100% 71s | 100% 14s | 100% 51s | 42% 48s | 83% 66s | 100% 138s |
| Beekeeper | 33% 73s | 0% 26s | 75% 31s | 100% 78s | 100% 82s | 100% 78s | 100% 54s | 100% 43s | 58% 66s | 42% 74s | 100% 111s |
| Quartermaster | 0% 36s | 0% 24s | 25% 29s | 67% 100s | 100% 93s | 100% 96s | 100% 45s | 100% 46s | 42% 51s | 33% 65s | 100% 137s |
| Crossbowman | 100% 14s | 100% 9s | 100% 7s | 100% 21s | 100% 20s | 100% 20s | 100% 17s | 100% 14s | 100% 27s | 100% 36s | 100% 95s |
| Falconer | 0% 4s | 92% 18s | 100% 15s | 0% 5s | 33% 27s | 0% 4s | 0% 2s | 50% 11s | 75% 29s | 100% 42s | 100% 91s |
| Grenadier | 92% 24s | 75% 15s | 100% 12s | 100% 36s | 100% 38s | 100% 27s | 100% 13s | 100% 15s | 100% 33s | 100% 35s | 100% 112s |
| Harpooner | 100% 23s | 100% 6s | 100% 4s | 100% 31s | 100% 27s | 100% 22s | 100% 13s | 100% 13s | 100% 29s | 100% 33s | 100% 99s |
| Javelin Huntress | 100% 10s | 92% 13s | 100% 11s | 100% 14s | 100% 13s | 100% 17s | 100% 13s | 100% 12s | 100% 27s | 100% 32s | 100% 109s |
| Marksman | 100% 12s | 92% 9s | 100% 6s | 100% 21s | 100% 23s | 100% 19s | 100% 16s | 100% 13s | 100% 28s | 92% 31s | 100% 99s |
| Ninja | 100% 34s | 0% 21s | 0% 22s | 100% 31s | 100% 42s | 100% 30s | 100% 26s | 100% 30s | 83% 55s (1 t/o) | 83% 58s | 100% 124s |
| Pirate | 100% 19s | 92% 16s | 100% 11s | 100% 30s | 100% 26s | 100% 24s | 100% 18s | 100% 20s | 100% 34s | 100% 45s | 100% 108s |
| Slinger | 100% 28s | 92% 14s | 100% 12s | 100% 36s | 100% 32s | 100% 35s | 100% 23s | 100% 20s | 100% 35s | 92% 46s | 100% 120s |
| Trapper | 0% 18s | 0% 12s | 0% 16s | 83% 46s | 100% 30s | 75% 29s | 67% 18s | 50% 28s | 25% 34s | 58% 58s | 100% 107s |
| Gladiator | 100% 15s | 50% 19s | 100% 8s | 100% 28s | 100% 20s | 100% 24s | 100% 18s | 100% 15s | 100% 33s | 58% 46s | 100% 104s |
| Jester | 92% 27s | 83% 17s | 100% 10s | 100% 37s | 100% 26s | 100% 29s | 100% 23s | 100% 15s | 100% 34s | 83% 45s | 100% 100s |
| Samurai | 100% 13s | 75% 12s | 100% 8s | 100% 14s | 92% 9s | 100% 13s | 100% 16s | 100% 12s | 100% 25s | 67% 35s | 100% 90s |
| Valkyrie | 0% 28s | 0% 15s | 0% 15s | 0% 34s | 0% 28s | 25% 69s | 100% 25s | 67% 60s | 58% 63s | 0% 35s | 100% 135s |
| Engineer | 0% 25s | 0% 21s | 0% 17s | 8% 85s (2 t/o) | 100% 37s | 100% 26s | 100% 18s | 100% 20s | 100% 43s | 100% 47s | 100% 111s |
| Werewolf | 100% 73s | 17% 26s | 92% 26s | 100% 75s | 100% 50s | 100% 22s | 100% 23s | 100% 16s | 100% 34s | 92% 47s | 100% 104s |
| Enchantress | 0% 52s | 0% 27s | 0% 28s | 0% 100s | 100% 110s | 100% 71s | 100% 39s | 100% 49s | 100% 65s | 92% 100s (1 t/o) | 100% 161s |
| The Mob | 100% 18s | 100% 11s | 100% 8s | 100% 22s | 100% 26s | 100% 32s | 100% 14s | 100% 17s | 100% 37s | 100% 42s | 100% 102s |
| Clockmaker | 0% 120s (12 t/o) | 100% 49s | 100% 36s | 0% 120s (12 t/o) | 100% 100s | 92% 113s (1 t/o) | 100% 85s | 100% 58s | 100% 62s | 83% 97s (2 t/o) | 100% 122s |
| Air Mage | 0% 39s | 42% 21s | 100% 20s | 100% 79s | 100% 69s | 100% 40s | 100% 15s | 100% 18s | 100% 35s | 100% 40s | 100% 122s |
| Warden | 0% 56s | 0% 28s | 50% 35s | 0% 100s | 25% 75s | 100% 43s | 100% 25s | 100% 34s | 100% 49s | 100% 70s | 100% 122s |
| Telekinetic | 100% 18s | 100% 8s | 100% 8s | 100% 23s | 100% 32s | 100% 31s | 100% 17s | 100% 13s | 100% 30s | 100% 38s | 100% 100s |
| Earth Mage | 8% 30s | 0% 16s | 100% 18s | 100% 57s | 100% 51s | 100% 31s | 100% 13s | 100% 14s | 100% 30s | 100% 28s | 100% 97s |

## 6. Each hero

For each hero: how often each ability fires (the share of fights it went off in · casts per minute of fighting · the median second of its first cast), and what each part of the kit is worth per minute, at each tier (each scenario counted the same). Then statuses and states, summed over the battle scenarios (not the dungeon) and given per minute of fighting: the build-up applied, bursts, the damage the statuses did, the foe-seconds foes spent built up or in a state (several foes at once count several times), and the seconds the hero spent in its own buffs and in foes' statuses.

### Paladin (paladin): tank

Trait: Bulwark: Blocks 35% of damage that comes from the front.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Shield Bash** (shieldBash, cd 8.5s) | I | 100% · 8.4/m · 2s | 100% · 3.8/m · 8s | 100% · 7.2/m · 6s | 100% · 8.2/m · 2s | 100% · 8.1/m · 2s | 100% · 7.5/m · 3s | 100% · 8.3/m · 3s | 100% · 7.7/m · 3s | 100% · 7.4/m · 3s | 100% · 6.9/m · 3s | 100% · 8.2/m · 4s |
|  | II | 100% · 14.8/m · 2s | 100% · 5.8/m · 6s | 100% · 6.7/m · 7s | 100% · 13.4/m · 2s | 100% · 14.4/m · 2s | 100% · 13.5/m · 3s | 100% · 12.8/m · 3s | 100% · 12.7/m · 4s | 100% · 11.5/m · 3s | 100% · 11.9/m · 3s | 100% · 11.6/m · 3s |
|  | III | 100% · 16.2/m · 2s | 100% · 4.2/m · 7s | 100% · 7/m · 6s | 100% · 14.2/m · 2s | 100% · 15.9/m · 2s | 100% · 14.7/m · 3s | 100% · 13/m · 3s | 100% · 14.1/m · 3s | 100% · 11.6/m · 3s | 100% · 9.1/m · 3s | 100% · 12.6/m · 3s |
| **Guard** (guard, cd 14.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 75% · 1.8/m · 41s | 67% · 1.4/m · 29s | 13% · <0.1/m · 262s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 58% · 2.6/m · 36s | 75% · 1.6/m · 16s | **0%** |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 67% · 0.8/m · 39s | 50% · 0.8/m · 14s | **0%** |
| **Consecrate** (consecrate, cd 17.1s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.3/m · 3s | 100% · 4.4/m · 3s | **0%** | 100% · 1.4/m · 2s | 100% · 2.4/m · 2s | 100% · 3.2/m · 8s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.5/m · 2s | 100% · 7.7/m · 2s | 17% · 0.1/m · 40s | 100% · 2.5/m · 3s | 100% · 3.8/m · 3s | 100% · 4.3/m · 12s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.2/m · 2s | 100% · 8.2/m · 2s | 25% · 0.3/m · 3s | 100% · 2.5/m · 3s | 100% · 3.8/m · 3s | 100% · 4.4/m · 13s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 313 dmg, 1.9 kills | 473 dmg, 0.1 s control, 2.3 kills | 800 dmg, 2.4 kills |
| Shield Bash | 96 dmg, 0.9 s control, 0.6 kills | 153 dmg, 18.6 s control, 0.6 kills | 386 dmg, 21.9 s control, 1.1 kills |
| Guard | 3 guard | 23 guard | 37 heal, 13 guard |
| Consecrate | 82 dmg, 45 heal, 0.5 kills | 215 dmg, 218 heal, 0.6 s control, 0.7 kills | 432 dmg, 252 heal, 1.4 s control, 0.8 kills |
| Bulwark (trait) | 306 block | 494 block | 790 block |
| other | 1 block | 3 block | 2 block |
| burn (status) | - | - | 1 dmg, 0.1 s control |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | 373 block | 736 block | 1,173 block |

- Tier I: applied stagger 326; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 25; all foe states (any cause): stunned 1, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 13, chill 5, rooted 4, burn 4, stunned 2, wet 1, poison 1, radiance 1.
- Tier II: applied stagger 886; bursts stagger 3.2; status damage -. Foe-seconds a minute traced to it: stagger 38, knockedOut 8; all foe states (any cause): stunned 16, knockedOut 9, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 14, burn 7, stunned 4, rooted 3, knockedOut 2, wet 2, poison 1, chill 1.
- Tier III: applied stagger 1,023, radiance 1; bursts stagger 3.7; status damage -. Foe-seconds a minute traced to it: stagger 43, knockedOut 9; all foe states (any cause): stunned 20, knockedOut 12, radiant 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 14, burn 6, stunned 5, rooted 3, knockedOut 2, wet 2, poison 1, chill 1.

### Tower (tower): tank

Trait: Unmovable: Can't be knocked back.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hold the Line** (holdTheLine, cd 14.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.4/m · 3s | 100% · 5.1/m · 3s | 83% · 0.7/m · 4s | 100% · 2.7/m · 3s | 100% · 2.6/m · 3s | 100% · 3.8/m · 10s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.6/m · 3s | 100% · 7.1/m · 3s | 92% · 1.2/m · 3s | 100% · 4.6/m · 3s | 100% · 5.4/m · 4s | 100% · 3.6/m · 11s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.8/m · 3s | 100% · 7.3/m · 3s | 92% · 1.5/m · 4s | 100% · 4.4/m · 3s | 100% · 4.7/m · 4s | 100% · 4.4/m · 19s |
| **Charge** (charge, cd 9.8s) | I | 100% · 7.6/m · 2s | 100% · 7.4/m · 2s | 100% · 7.7/m · 3s | 100% · 7.1/m · 3s | 100% · 7.2/m · 3s | 100% · 6.7/m · 2s | 100% · 7.8/m · 2s | 100% · 7.3/m · 2s | 100% · 7.1/m · 2s | 100% · 6.7/m · 3s | 100% · 8/m · 2s |
|  | II | 100% · 7.8/m · 2s | 100% · 12.8/m · 2s | 100% · 12.5/m · 3s | 100% · 12.3/m · 3s | 100% · 12.5/m · 3s | 100% · 11.8/m · 2s | 100% · 11.7/m · 2s | 100% · 12.8/m · 2s | 100% · 11.6/m · 2s | 100% · 11.8/m · 3s | 100% · 12.5/m · 3s |
|  | III | 100% · 4.6/m · 2s | 100% · 14.7/m · 3s | 100% · 14.9/m · 3s | 100% · 13/m · 3s | 100% · 14.5/m · 3s | 100% · 14/m · 2s | 100% · 14/m · 2s | 100% · 14.8/m · 2s | 100% · 13.6/m · 2s | 100% · 14/m · 3s | 100% · 14/m · 3s |
| **Ground Pound** (groundPound, cd 12.2s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.1/m · 3s | 100% · 6/m · 3s | **8%** | 100% · 2.5/m · 3s | 100% · 2.7/m · 3s | 100% · 3.5/m · 14s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.2/m · 3s | 100% · 8.6/m · 3s | 33% · 0.2/m · 28s | 100% · 4.5/m · 3s | 100% · 5.2/m · 4s | 100% · 1.9/m · 35s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.5/m · 4s | 100% · 9.2/m · 3s | 25% · 0.3/m · 3s | 100% · 4.5/m · 3s | 100% · 4.7/m · 3s | 100% · 3.3/m · 36s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 261 dmg, 1.5 kills | 333 dmg, 1.4 kills | 539 dmg, 1.3 kills |
| Hold the Line | 33 block, 27 via others | 137 block, 117 via others | 141 dmg, 136 block, 121 via others, 0.3 kills |
| Charge | 125 dmg, 0.9 kills | 287 dmg, 1.3 kills | 550 dmg, 16.4 s control, 1.6 kills |
| Ground Pound | 68 dmg, 0.4 kills | 103 dmg, 5.3 s control, 0.4 kills | 300 dmg, 39.9 s control, 0.7 kills |
| other | 5 block | 13 block | 9 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | 389 block | 947 block | 1,427 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: cowed 16; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): holdTheLine 5. Under foes' statuses and states: stagger 16, burn 5, rooted 5, chill 5, stunned 2, wet 1, radiance 1, poison 1.
- Tier II: applied stagger 471; bursts stagger 0.9; status damage -. Foe-seconds a minute traced to it: cowed 42, stagger 27, knockedOut 2; all foe states (any cause): stunned 5, knockedOut 3, radiant 1. Its own buffs and states (s a minute): holdTheLine 12. Under foes' statuses and states: stagger 18, burn 10, stunned 4, rooted 4, knockedOut 2, radiance 2, wet 1, poison 1.
- Tier III: applied stagger 1,750; bursts stagger 11.6; status damage -. Foe-seconds a minute traced to it: cowed 43, stagger 32, knockedOut 24; all foe states (any cause): stunned 27, knockedOut 25, radiant 2. Its own buffs and states (s a minute): holdTheLine 12. Under foes' statuses and states: stagger 12, burn 8, stunned 4, rooted 4, knockedOut 2, chill 2, poison 1, wet 1.

### Archer (archer): ranged

Trait: Steady Aim: After standing still for 1.5s, the next arrow is a critical hit.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Barrage** (barrage, cd 9.2s) | I | 100% · 7.8/m · 3s | 100% · 8.3/m · 2s | 100% · 8.4/m · 3s | 100% · 7.5/m · 2s | 100% · 7.7/m · 2s | 100% · 7.5/m · 3s | 100% · 7.8/m · 2s | 100% · 7.5/m · 3s | 100% · 7.2/m · 3s | 100% · 6.5/m · 4s | 100% · 8.1/m · 2s |
|  | II | 100% · 13.5/m · 3s | 100% · 11.7/m · 3s | 100% · 12.5/m · 3s | 100% · 12.8/m · 2s | 100% · 13/m · 2s | 100% · 12.9/m · 3s | 100% · 12.8/m · 2s | 100% · 12.3/m · 3s | 100% · 12.1/m · 3s | 100% · 11.2/m · 3s | 100% · 12.9/m · 2s |
|  | III | 100% · 14.1/m · 3s | 100% · 14.1/m · 2s | 100% · 13.6/m · 3s | 100% · 14.1/m · 2s | 100% · 14.6/m · 2s | 100% · 14.5/m · 2s | 100% · 14.3/m · 3s | 100% · 14.3/m · 3s | 100% · 12.9/m · 3s | 100% · 13.1/m · 3s | 100% · 13.7/m · 2s |
| **Frost Arrow** (frostArrow, cd 9.8s) | I | 100% · 7.8/m · 2s | 100% · 8.7/m · 2s | 100% · 8.4/m · 3s | 100% · 7.2/m · 2s | 100% · 7.4/m · 3s | 100% · 7.2/m · 2s | 100% · 7.5/m · 2s | 100% · 7.3/m · 3s | 100% · 7/m · 3s | 100% · 6.6/m · 3s | 100% · 8.4/m · 2s |
|  | II | 100% · 13.2/m · 2s | 100% · 12.1/m · 2s | 100% · 12.2/m · 3s | 100% · 12.6/m · 2s | 100% · 12.6/m · 3s | 100% · 12.4/m · 2s | 100% · 12.6/m · 2s | 100% · 12.1/m · 3s | 100% · 11.6/m · 2s | 100% · 11.7/m · 3s | 100% · 12.5/m · 2s |
|  | III | 100% · 14.3/m · 2s | 100% · 14.6/m · 2s | 100% · 15.2/m · 3s | 100% · 13.9/m · 3s | 100% · 14.4/m · 3s | 100% · 14.3/m · 2s | 100% · 13.7/m · 2s | 100% · 14.3/m · 2s | 100% · 13.9/m · 2s | 100% · 13.4/m · 3s | 100% · 15.1/m · 2s |
| **Roll** (roll, cd 7.3s) | I | 58% · 1.5/m · 15s | **0%** | **0%** | 100% · 3.2/m · 11s | 83% · 1.4/m · 26s | 100% · 4.3/m · 7s | 100% · 8.1/m · 4s | 33% · 0.8/m · 10s | 50% · 1/m · 5s | 100% · 2.8/m · 3s | 88% · 1.7/m · 12s |
|  | II | 67% · 1.6/m · 7s | **0%** | **0%** | 92% · 3.8/m · 8s | **0%** | 83% · 3.9/m · 6s | 100% · 11/m · 5s | 42% · 1.3/m · 13s | 33% · 0.7/m · 3s | 100% · 3.3/m · 11s | 88% · 0.8/m · 45s |
|  | III | 75% · 3.2/m · 15s | **0%** | **0%** | 58% · 2.1/m · 13s | 17% · 0.4/m · 15s | 67% · 2.6/m · 12s | 83% · 6/m · 7s | **8%** | 25% · 0.5/m · 18s | 75% · 1.6/m · 14s | 75% · 1.3/m · 39s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 629 dmg, 3.2 kills | 742 dmg, 0.3 s control, 3 kills | 1,282 dmg, 2 s control, 3.1 kills |
| Barrage | 238 dmg, 1.1 kills | 436 dmg, 2 kills | 926 dmg, 2.4 kills |
| Frost Arrow | 96 dmg, 0.2 s control, 0.5 kills | 158 dmg, 16.8 s control, 0.6 kills | 516 dmg, 7.3 s control, 1.5 kills |
| Roll | 3 block | 12 block | 74 dmg, 12 block, 3.9 s control, 0.2 kills |
| Steady Aim (trait) | 11 via others | 15 via others | 11 via others |
| burn (status) | - | 522 dmg, 1.3 s control, 2.3 kills | 674 dmg, 2.2 s control, 4.2 kills |
| chill (status) | 1 dmg | 120 dmg | 204 dmg |
| armour | - | 216 block | 340 block |
| dodge | 45 block | 83 block | 108 block |

- Tier I: applied chill 295; bursts -; status damage chill 3. Foe-seconds a minute traced to it: chill 32; all foe states (any cause): radiant 1, stunned 1. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: stagger 3, rooted 2, burn 2, poison 1.
- Tier II: applied burn 2,492, chill 1,650; bursts burn 21.4, chill 6.6; status damage burn 567, chill 136. Foe-seconds a minute traced to it: burn 53, chill 18, frozen 5; all foe states (any cause): frozen 5, stunned 2, radiant 1, knockedOut 1. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: burn 9, stagger 8, rooted 1, stunned 1, radiance 1.
- Tier III: applied chill 3,574, burn 3,427, stagger 119; bursts burn 26.8, chill 11; status damage burn 758, chill 225. Foe-seconds a minute traced to it: burn 49, chill 38, stagger 9, caltrops 7, frozen 6; all foe states (any cause): stunned 7, frozen 6, radiant 2, knockedOut 2, untouchable 1. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: burn 7, stagger 6, rooted 1, radiance 1, stunned 1.

### Twinfang (twinfang): skirmish

Trait: Opportunist: +50% damage to enemies fighting someone else.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Backstab** (backstab, cd 13.4s) | I | 100% · 2.9/m · 16s | 33% · 0.9/m · 20s | 92% · 3.6/m · 11s | 50% · 0.5/m · 56s | 83% · 1.7/m · 38s | 92% · 2.3/m · 17s | 100% · 3.8/m · 9s | 100% · 3.4/m · 14s | 100% · 5.3/m · 4s | 100% · 3.6/m · 7s | 100% · 6.9/m · 3s |
|  | II | 25% · 0.4/m · 39s | **0%** | **0%** | 83% · 1.3/m · 78s | 100% · 4/m · 38s | 100% · 5.4/m · 15s | 100% · 7.2/m · 7s | 100% · 4.5/m · 15s | 100% · 8/m · 4s | 100% · 5.9/m · 4s | 100% · 11.6/m · 2s |
|  | III | 33% · 0.7/m · 27s | **0%** | **8%** | 33% · 0.8/m · 52s | 83% · 3.4/m · 35s | 100% · 7.7/m · 10s | 100% · 18.6/m · 4s | 100% · 5.1/m · 11s | 100% · 12.2/m · 4s | 100% · 6.3/m · 8s | 100% · 26.5/m · 2s |
| **Dash** (dash, cd 3.9s) | I | 100% · 7.1/m · 7s | 50% · 1.7/m · 16s | 67% · 4.6/m · 7s | 100% · 8.5/m · 6s | 100% · 7.1/m · 9s | 100% · 5/m · 8s | 100% · 8.7/m · 4s | 100% · 5.2/m · 9s | 100% · 7.9/m · 6s | 100% · 6.2/m · 5s | 100% · 10.2/m · 2s |
|  | II | 100% · 6.5/m · 6s | 67% · 1.8/m · 15s | 33% · 1.2/m · 8s | 100% · 6.4/m · 10s | 100% · 8.2/m · 7s | 100% · 7/m · 5s | 100% · 9.2/m · 4s | 100% · 5.2/m · 15s | 100% · 8.3/m · 5s | 100% · 5.8/m · 6s | 100% · 11.6/m · 6s |
|  | III | 92% · 7.9/m · 6s | 33% · 1.3/m · 10s | 33% · 1.1/m · 8s | 100% · 7.4/m · 5s | 100% · 8.4/m · 7s | 100% · 7.2/m · 10s | 92% · 8.6/m · 6s | 92% · 6.7/m · 8s | 100% · 11.2/m · 4s | 100% · 6.5/m · 7s | 100% · 11.9/m · 9s |
| **Fan of Knives** (fanOfKnives, cd 13.4s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.8/m · 3s | 100% · 6/m · 2s | 83% · 1.8/m · 7s | 100% · 2.8/m · 2s | 100% · 3.3/m · 3s | 100% · 4.5/m · 7s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.8/m · 3s | 100% · 8.8/m · 2s | 58% · 1.5/m · 5s | 100% · 4.1/m · 2s | 100% · 5.3/m · 3s | 100% · 5.4/m · 9s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.1/m · 2s | 100% · 9.4/m · 2s | 83% · 2.1/m · 7s | 100% · 5/m · 2s | 100% · 4.8/m · 3s | 100% · 6.9/m · 8s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 547 dmg, 2.7 kills | 709 dmg, 2.6 kills | 1,177 dmg, 2.9 kills |
| Backstab | 137 dmg, 9 block, 1.3 kills | 216 dmg, 20 block, 4.7 s control, 2 kills | 678 dmg, 50 block, 12.9 s control, 4.5 kills |
| Dash | 10 block | 20 block | 23 block |
| Fan of Knives | 129 dmg, 0.6 kills | 177 dmg, 5.8 s control, 0.5 kills | 760 dmg, 22 s control, 1.3 kills |
| Opportunist (trait) | 72 via others | 103 via others | 313 via others |
| other | 4 block | - | - |
| chill (status) | - | 1 dmg | 1 dmg |
| poison (status) | - | 222 dmg, 2.4 s control, 0.7 kills | 477 dmg, 4.9 s control, 0.8 kills |
| armour | - | 532 block | 901 block |
| dodge | 169 block | 282 block | 481 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): radiant 2. Its own buffs and states (s a minute): untouchable 3. Under foes' statuses and states: stagger 9, rooted 3, burn 3, chill 2, wet 1, radiance 1, poison 1, stunned 1.
- Tier II: applied poison 572; bursts poison 2.7; status damage poison 245. Foe-seconds a minute traced to it: poison 46, sickened 9; all foe states (any cause): sickened 9, stunned 2, radiant 1, knockedOut 1, untouchable 1. Its own buffs and states (s a minute): untouchable 4. Under foes' statuses and states: stagger 14, burn 7, poison 3, stunned 3, rooted 2, wet 1, knockedOut 1, radiance 1.
- Tier III: applied poison 1,148; bursts poison 8.4; status damage poison 529. Foe-seconds a minute traced to it: poison 51, sickened 23; all foe states (any cause): sickened 23, radiant 2, stunned 2, knockedOut 1, untouchable 1. Its own buffs and states (s a minute): untouchable 5. Under foes' statuses and states: stagger 16, burn 7, stunned 4, poison 3, radiance 2, rooted 2, wet 1, knockedOut 1.

### Wildmane (wildmane): melee

Trait: Bloodied: Hits harder the more hurt she is: up to +50%.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Rage** (rage, cd 14.6s) | I | 100% · 2.8/m · 12s | 100% · 3.5/m · 12s | 100% · 3.6/m · 8s | 100% · 2.7/m · 21s | 100% · 3.2/m · 16s | 100% · 5.5/m · 3s | 100% · 4.9/m · 2s | 100% · 3.6/m · 18s | 100% · 3/m · 3s | 100% · 3.7/m · 3s | 100% · 4.1/m · 12s |
|  | II | 100% · 5.1/m · 22s | 100% · 5.1/m · 16s | 100% · 5.1/m · 15s | 100% · 5.3/m · 37s | 100% · 4.9/m · 20s | 100% · 7.7/m · 3s | 100% · 8.8/m · 3s | 42% · 0.7/m · 2s | 100% · 2.7/m · 3s | 100% · 5.2/m · 3s | 100% · 4.1/m · 8s |
|  | III | 100% · 6.9/m · 16s | 100% · 6.2/m · 12s | 100% · 5.6/m · 11s | 100% · 6.3/m · 22s | 100% · 5.3/m · 16s | 100% · 6.4/m · 2s | 100% · 8.8/m · 3s | 33% · 1.1/m · 2s | 100% · 3/m · 3s | 100% · 6/m · 3s | 100% · 4.9/m · 11s |
| **Leap** (leap, cd 11s) | I | **8%** | 100% · 6.8/m · 2s | 100% · 5/m · 3s | 25% · 0.3/m · 1s | 100% · 5.9/m · 5s | 58% · 2/m · 10s | 83% · 4/m · 4s | 100% · 4.8/m · 4s | 100% · 5.4/m · 3s | 100% · 3.4/m · 19s | 100% · 7.4/m · 1s |
|  | II | 67% · 1.7/m · 24s | 100% · 10.4/m · 3s | 100% · 11/m · 3s | 58% · 0.4/m · 10s | 100% · 9.5/m · 3s | 100% · 3.3/m · 11s | 100% · 7.9/m · 3s | 100% · 6.6/m · 4s | 100% · 8.9/m · 3s | 100% · 7.4/m · 5s | 100% · 12.2/m · 1s |
|  | III | 25% · 0.4/m · 13s | 100% · 18.1/m · 2s | 100% · 17/m · 3s | 67% · 0.9/m · 9s | 100% · 13.1/m · 3s | 33% · 1.1/m · 19s | 100% · 14/m · 3s | 100% · 9.1/m · 4s | 100% · 12.9/m · 4s | 100% · 9.5/m · 6s | 100% · 17.4/m · 2s |
| **Cleave** (cleave, cd 8.5s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 7.8/m · 3s | 100% · 7.7/m · 2s | **0%** | 75% · 0.9/m · 5s | 100% · 2.1/m · 4s | 100% · 2.7/m · 18s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 10.2/m · 3s | 100% · 12/m · 3s | **0%** | 67% · 1.1/m · 12s | 100% · 4.1/m · 3s | 100% · 1.7/m · 39s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 9.9/m · 3s | 100% · 10.9/m · 2s | **0%** | 58% · 0.8/m · 14s | 100% · 4.9/m · 3s | 88% · 1.8/m · 33s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 828 dmg, 5 kills | 1,263 dmg, 5.8 kills | 2,023 dmg, 5.2 kills |
| Rage | 113 block | 99 heal, 294 block | 168 heal, 624 block |
| Leap | 205 dmg, 28 block, 1.3 kills | 381 dmg, 18 heal, 71 block, 1.7 s control, 2 kills | 631 dmg, 32 heal, 232 block, 3.1 s control, 2.6 kills |
| Cleave | 246 dmg, 1.2 kills | 436 dmg, 27 heal, 1.7 kills | 1,120 dmg, 71 heal, 2.7 kills |
| Bloodied (trait) | 226 via others | 245 via others | 427 via others |
| other | - | 1 block | - |
| chill (status) | - | 2 dmg | 1 dmg |
| armour | - | 692 block | 1,106 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): rage 16, untouchable 2. Under foes' statuses and states: stagger 10, rooted 5, burn 4, chill 2, wet 1, poison 1, stunned 1.
- Tier II: applied stagger 337; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 22; all foe states (any cause): stunned 3, knockedOut 2, radiant 1. Its own buffs and states (s a minute): rage 22, untouchable 2. Under foes' statuses and states: stagger 14, burn 8, stunned 5, rooted 4, knockedOut 3, wet 1, poison 1, chill 1.
- Tier III: applied stagger 424; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 23, knockedOut 1; all foe states (any cause): stunned 5, knockedOut 2, radiant 2. Its own buffs and states (s a minute): rage 31, untouchable 4. Under foes' statuses and states: stagger 16, burn 7, stunned 5, rooted 3, knockedOut 2, chill 2, poison 1, wet 1.

### Berserker (berserker): melee

Trait: Momentum: Each hit in a row makes the next a little faster, up to +50%.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Shockwave** (shockwave, cd 11s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.2/m · 3s | 100% · 6.3/m · 3s | 42% · 0.7/m · 2s | 100% · 2/m · 3s | 100% · 2.7/m · 3s | 100% · 4.9/m · 7s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 7.9/m · 2s | 100% · 10.8/m · 3s | 58% · 1.5/m · 2s | 100% · 2.7/m · 3s | 100% · 3.2/m · 3s | 100% · 6.1/m · 7s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 7.8/m · 3s | 100% · 9.4/m · 3s | 67% · 3.7/m · 3s | 100% · 4.7/m · 3s | 100% · 4.6/m · 3s | 100% · 8/m · 6s |
| **Whirl** (whirl, cd 14.6s) | I | 100% · 7.1/m · 2s | 100% · 5/m · 6s | 100% · 5.5/m · 4s | 100% · 4.9/m · 3s | 100% · 5.2/m · 3s | 100% · 5.5/m · 2s | 100% · 5.5/m · 2s | 100% · 4.7/m · 3s | 100% · 4.5/m · 3s | 100% · 2.8/m · 3s | 100% · 5.4/m · 5s |
|  | II | 100% · 9.1/m · 2s | 100% · 7.5/m · 4s | 100% · 7.7/m · 5s | 100% · 8.9/m · 3s | 100% · 9.1/m · 3s | 100% · 9.3/m · 2s | 100% · 10.3/m · 2s | 100% · 9.2/m · 2s | 100% · 7.8/m · 2s | 100% · 6/m · 3s | 100% · 7.4/m · 6s |
|  | III | 100% · 10.1/m · 2s | 100% · 8.2/m · 4s | 100% · 8.8/m · 4s | 100% · 10.5/m · 3s | 100% · 10.6/m · 3s | 100% · 10.5/m · 2s | 100% · 10.7/m · 2s | 100% · 10.8/m · 2s | 100% · 9.1/m · 3s | 100% · 9.4/m · 3s | 100% · 8.8/m · 7s |
| **Unstoppable** (unstoppable, cd 19.5s) | I | **0%** | 58% · 1.8/m · 3s | 100% · 3.9/m · 3s | 100% · 2.6/m · 10s | 42% · 1.1/m · 4s | 100% · 3.7/m · 9s | **0%** | 100% · 3.6/m · 4s | 100% · 2.4/m · 4s | 100% · 1.8/m · 4s | 88% · 0.8/m · 52s |
|  | II | 100% · 4.1/m · 7s | 100% · 4.8/m · 7s | 100% · 6.9/m · 3s | 100% · 6.6/m · 3s | 75% · 2.5/m · 5s | 17% · 0.7/m · 9s | **0%** | 100% · 5.6/m · 4s | 100% · 3.5/m · 3s | 100% · 3.5/m · 4s | 75% · 0.8/m · 75s |
|  | III | 25% · 0.6/m · 8s | 100% · 7.6/m · 3s | 100% · 8.3/m · 3s | 100% · 7.2/m · 3s | 25% · 0.6/m · 17s | **8%** | **0%** | 83% · 4.1/m · 4s | 100% · 2.7/m · 4s | 100% · 4.3/m · 5s | 88% · 0.9/m · 40s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 670 dmg, 4.3 kills | 927 dmg, 3.8 kills | 2,050 dmg, 5.5 kills |
| Shockwave | 159 dmg, 1.4 kills | 431 dmg, 0.3 s control, 2.6 kills | 926 dmg, 33.8 s control, 2.8 kills |
| Whirl | 295 dmg, 41 block, 1 kills | 598 dmg, 179 block, 1.7 kills | 1,986 dmg, 393 block, 4.9 kills |
| Unstoppable | - | - | 598 heal |
| other | - | 4 block | 7 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 600 block | 1,161 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): whirl 14, unstoppable 4. Under foes' statuses and states: stagger 7, rooted 3, burn 3, chill 1, wet 1, poison 1, stunned 1.
- Tier II: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): stunned 2, radiant 2, knockedOut 1. Its own buffs and states (s a minute): whirl 38, unstoppable 16. Under foes' statuses and states: stagger 6, burn 6, stunned 2, rooted 2, wet 1.
- Tier III: applied stagger 795; bursts stagger 4.4; status damage -. Foe-seconds a minute traced to it: stagger 15, knockedOut 9; all foe states (any cause): stunned 13, knockedOut 10, radiant 2. Its own buffs and states (s a minute): whirl 43, unstoppable 16. Under foes' statuses and states: stagger 5, burn 5, stunned 3, chill 1, rooted 1, wet 1, poison 1.

### Granny Reaper (granny): melee

Trait: Grim: Finishes off any enemy her hits leave below 15% health.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Reap** (reap, cd 9.8s) | I | 100% · 6.9/m · 2s | 92% · 4.5/m · 3s | 75% · 4.3/m · 3s | 100% · 7/m · 2s | 100% · 7.4/m · 3s | 100% · 7.8/m · 2s | 100% · 8.6/m · 3s | 100% · 6.9/m · 3s | 100% · 5.1/m · 3s | 100% · 3/m · 3s | 100% · 6.1/m · 7s |
|  | II | 100% · 12.2/m · 2s | 100% · 10.2/m · 3s | 100% · 12.6/m · 3s | 100% · 12.2/m · 2s | 100% · 12.5/m · 3s | 100% · 11.5/m · 3s | 100% · 13/m · 2s | 100% · 11.6/m · 3s | 100% · 9.1/m · 2s | 100% · 6.6/m · 3s | 100% · 7.2/m · 9s |
|  | III | 100% · 13.9/m · 3s | 100% · 8.3/m · 3s | 100% · 10.2/m · 3s | 100% · 13.5/m · 2s | 100% · 14.7/m · 3s | 100% · 13.9/m · 2s | 100% · 15.7/m · 2s | 100% · 14/m · 4s | 100% · 12/m · 3s | 100% · 11.9/m · 3s | 100% · 8.8/m · 8s |
| **Hook** (hook, cd 12.2s) | I | **0%** | 100% · 7.7/m · 3s | 100% · 6/m · 3s | 33% · 0.6/m · 3s | 100% · 5.6/m · 4s | 75% · 3.4/m · 3s | 100% · 5/m · 3s | 100% · 6.3/m · 3s | 100% · 5.9/m · 2s | 100% · 2.4/m · 3s | 100% · 7/m · 2s |
|  | II | **0%** | 100% · 12.5/m · 2s | 100% · 13.7/m · 3s | 25% · 0.2/m · 1s | 100% · 9/m · 3s | 92% · 3.6/m · 7s | 100% · 8.8/m · 2s | 100% · 10.1/m · 2s | 100% · 9.9/m · 2s | 100% · 5.7/m · 3s | 100% · 11.5/m · 3s |
|  | III | 17% · 0.3/m · 12s | 100% · 14.9/m · 2s | 100% · 13.5/m · 3s | 17% · 0.2/m · 16s | 100% · 10.1/m · 3s | 83% · 5/m · 7s | 92% · 7.2/m · 2s | 100% · 9.5/m · 3s | 100% · 9.8/m · 3s | 100% · 8.5/m · 3s | 100% · 11.8/m · 3s |
| **Old Bones** (oldBones, cd 24.4s) | I | 100% · 3.5/m · 16s | 58% · 2.2/m · 17s | 92% · 4.7/m · 11s | 100% · 1.8/m · 33s | 100% · 2.3/m · 26s | 100% · 4.1/m · 14s | **0%** | **0%** | **0%** | 100% · 1.2/m · 17s | **0%** |
|  | II | 100% · 1.7/m · 29s | **0%** | **0%** | 100% · 1/m · 53s | **8%** | 67% · 1.3/m · 25s | **0%** | **0%** | **0%** | 92% · 1.2/m · 16s | **0%** |
|  | III | 100% · 1.9/m · 26s | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 42% · 0.9/m · 13s | **0%** |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 528 dmg, 3.9 kills | 958 dmg, 4.7 kills | 1,700 dmg, 6.5 kills |
| Reap | 471 dmg, 7 block, 2.6 kills | 994 dmg, 3 block, 4.5 kills | 2,482 dmg, 853 heal, 0.2 s control, 6 kills |
| Hook | 160 dmg, 1 block, 0.5 s control, 0.6 kills | 271 dmg, 1 block, 30.8 s control, 1.3 kills | 740 dmg, 2 block, 36.6 s control, 2.7 kills |
| Grim (trait) | 33 dmg, 4 kills | 197 dmg, 6.5 kills | 436 dmg, 9.3 kills |
| other | - | 7 block | 8 block |
| chill (status) | - | 2 dmg | 1 dmg |
| armour | - | 705 block | 1,272 block |
| untouchable | 9 block | 6 block | 9 block |

- Tier I: applied stagger 158; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 11; all foe states (any cause): radiant 2, stunned 1. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 10, rooted 4, burn 3, chill 2, wet 1, poison 1, stunned 1.
- Tier II: applied stagger 600; bursts stagger 5.1; status damage -. Foe-seconds a minute traced to it: knockedOut 11; all foe states (any cause): stunned 13, knockedOut 12, radiant 2. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: stagger 15, stunned 5, burn 4, knockedOut 3, rooted 2, wet 2, poison 2, chill 1.
- Tier III: applied stagger 823; bursts stagger 6.9; status damage -. Foe-seconds a minute traced to it: knockedOut 14, stagger 1; all foe states (any cause): stunned 17, knockedOut 15, radiant 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 20, stunned 5, burn 3, knockedOut 3, rooted 2, poison 1, wet 1, chill 1.

### Pyromancer (pyromancer): caster

Trait: Kindling: Burning enemies take 20% more from her.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Fireball** (fireball, cd 8.5s) | I | 100% · 9.7/m · 2s | 100% · 9.6/m · 2s | 100% · 10.3/m · 3s | 100% · 8.5/m · 2s | 100% · 9.1/m · 2s | 100% · 8.4/m · 3s | 100% · 8.2/m · 2s | 100% · 9.5/m · 3s | 100% · 8.3/m · 3s | 100% · 8.3/m · 3s | 100% · 9.5/m · 2s |
|  | II | 100% · 14.6/m · 2s | 100% · 14.7/m · 2s | 100% · 14/m · 3s | 100% · 14.6/m · 2s | 100% · 14.8/m · 2s | 100% · 14.6/m · 2s | 100% · 15.4/m · 2s | 100% · 14.7/m · 2s | 100% · 13.8/m · 2s | 100% · 14.2/m · 3s | 100% · 16.1/m · 2s |
|  | III | 100% · 16.3/m · 2s | 100% · 15.4/m · 2s | 100% · 14.6/m · 3s | 100% · 16/m · 2s | 100% · 16.1/m · 2s | 100% · 15.8/m · 2s | 100% · 15.5/m · 2s | 100% · 15.7/m · 2s | 100% · 15.5/m · 2s | 100% · 12.7/m · 3s | 100% · 18/m · 2s |
| **Flame Wall** (flameWall, cd 14.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.4/m · 2s | 100% · 5.1/m · 2s | 92% · 3.1/m · 3s | 100% · 4/m · 3s | 100% · 3.3/m · 3s | 100% · 4/m · 9s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 7.8/m · 2s | 100% · 7.4/m · 3s | 83% · 4.5/m · 3s | 100% · 3.7/m · 3s | 100% · 5.6/m · 3s | 100% · 5.8/m · 8s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.5/m · 2s | 92% · 7.2/m · 3s | 100% · 5/m · 3s | 100% · 4.9/m · 3s | 100% · 4.3/m · 3s | 100% · 6.5/m · 8s |
| **Inferno** (inferno, cd 17.1s) | I | 100% · 5.2/m · 3s | **0%** | **0%** | 100% · 4.5/m · 4s | 100% · 4.3/m · 5s | 100% · 4.6/m · 3s | 100% · 5.1/m · 2s | 83% · 2.6/m · 7s | 67% · 1.4/m · 3s | 100% · 2.4/m · 7s | 100% · 1.9/m · 18s |
|  | II | 100% · 6.6/m · 5s | **0%** | **0%** | 100% · 5.9/m · 6s | 100% · 3.6/m · 9s | 100% · 8/m · 3s | 100% · 6.8/m · 2s | 75% · 2.5/m · 10s | 92% · 2.1/m · 3s | 100% · 2.3/m · 7s | 88% · 2/m · 25s |
|  | III | 100% · 8/m · 4s | **0%** | **0%** | 100% · 6.6/m · 5s | 75% · 1.6/m · 13s | 100% · 6.5/m · 4s | 83% · 6/m · 3s | 50% · 2/m · 10s | 100% · 2.7/m · 9s | 83% · 1.8/m · 10s | 100% · 1.8/m · 34s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 601 dmg, 3.6 kills | 608 dmg, 2.8 kills | 1,084 dmg, 0.2 s control, 2.8 kills |
| Fireball | 293 dmg, 2.3 kills | 382 dmg, 2.3 kills | 661 dmg, 2.7 kills |
| Inferno | 152 dmg, 0.5 kills | 166 dmg, 0.7 kills | 249 dmg, 0.6 kills |
| Kindling (trait) | 210 via others | 538 via others | 892 via others |
| other | - | 6 block | 6 block |
| burn (status) | 454 dmg, 0.6 s control, 3.9 kills | 1,773 dmg, 2.7 s control, 12.6 kills | 2,542 dmg, 3.7 s control, 19.5 kills |
| chill (status) | - | - | 1 dmg |
| armour | - | 302 block | 477 block |

- Tier I: applied burn 1,766; bursts burn 9.6; status damage burn 508. Foe-seconds a minute traced to it: burn 80; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 9, stagger 6, rooted 2.
- Tier II: applied burn 5,433; bursts burn 50.3; status damage burn 1,542. Foe-seconds a minute traced to it: burn 83; all foe states (any cause): stunned 2, knockedOut 1, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 21, stagger 11, stunned 1, rooted 1.
- Tier III: applied burn 8,122; bursts burn 78.6; status damage burn 2,271. Foe-seconds a minute traced to it: burn 84; all foe states (any cause): stunned 4, radiant 3, knockedOut 2, untouchable 1. Its own buffs and states (s a minute): fireproof 18. Under foes' statuses and states: burn 13, stagger 8, stunned 1, rooted 1.

### Frost Mage (frost): caster

Trait: Cold Blood: Can't be chilled or frozen.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Ice Shard** (iceShard, cd 7.3s) | I | 100% · 9.7/m · 3s | 100% · 10.1/m · 2s | 100% · 10.1/m · 3s | 100% · 9.5/m · 3s | 100% · 9.7/m · 3s | 100% · 8.9/m · 4s | 100% · 9.4/m · 4s | 100% · 9.2/m · 3s | 100% · 9.1/m · 3s | 100% · 6.6/m · 4s | 100% · 10.2/m · 2s |
|  | II | 100% · 16.1/m · 3s | 100% · 16.7/m · 2s | 100% · 16.6/m · 3s | 100% · 15.7/m · 2s | 100% · 16.3/m · 3s | 100% · 15/m · 4s | 100% · 15.3/m · 4s | 100% · 16.1/m · 3s | 100% · 15.2/m · 4s | 100% · 14.1/m · 4s | 100% · 17.3/m · 2s |
|  | III | 100% · 16.1/m · 3s | 100% · 18.7/m · 2s | 100% · 18.7/m · 3s | 100% · 18.7/m · 2s | 100% · 18.7/m · 2s | 100% · 16.3/m · 5s | 100% · 16.3/m · 4s | 100% · 17.1/m · 3s | 100% · 15.9/m · 3s | 100% · 13.3/m · 3s | 100% · 18/m · 1s |
| **Frost Nova** (frostNova, cd 15.9s) | I | 100% · 3.6/m · 3s | **0%** | **0%** | 100% · 2.6/m · 10s | 100% · 2.5/m · 14s | 100% · 4.4/m · 4s | 100% · 5.1/m · 2s | 92% · 2.4/m · 9s | 75% · 1.3/m · 7s | 100% · 2.6/m · 3s | 100% · 2.1/m · 17s |
|  | II | 100% · 4.5/m · 7s | **0%** | **0%** | 100% · 1.9/m · 29s | 100% · 1.2/m · 35s | 100% · 4.8/m · 6s | 100% · 7.2/m · 2s | 75% · 1.7/m · 11s | 92% · 1.4/m · 9s | 100% · 2.7/m · 9s | 100% · 2.4/m · 39s |
|  | III | 100% · 6/m · 6s | **0%** | **0%** | 92% · 2.5/m · 9s | 25% · 0.5/m · 24s | 100% · 4/m · 9s | 92% · 6.2/m · 2s | 33% · 0.8/m · 14s | 75% · 1.6/m · 16s | 83% · 1.2/m · 11s | 100% · 1.6/m · 34s |
| **Ice Wall** (iceWall, cd 19.5s) | I | 100% · 3.6/m · 2s | **0%** | **0%** | 100% · 3.6/m · 2s | 100% · 3.7/m · 3s | 100% · 3.9/m · 2s | 100% · 4.3/m · 3s | 100% · 3.3/m · 3s | 75% · 1.3/m · 2s | 100% · 2.6/m · 3s | 100% · 2/m · 11s |
|  | II | 100% · 6.5/m · 2s | **0%** | **0%** | 100% · 4.2/m · 5s | 100% · 4.2/m · 7s | 100% · 6.1/m · 2s | 100% · 6.4/m · 3s | 100% · 3.1/m · 8s | 100% · 2.3/m · 2s | 100% · 4.1/m · 3s | 100% · 2.3/m · 50s |
|  | III | 100% · 7.8/m · 2s | **0%** | **0%** | 100% · 4.6/m · 6s | 75% · 2.2/m · 13s | 100% · 5.6/m · 3s | 100% · 6.6/m · 3s | 92% · 2.8/m · 6s | 92% · 2.8/m · 2s | 92% · 2.4/m · 3s | 100% · 1.9/m · 30s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 433 dmg, 3.2 s control, 2.4 kills | 509 dmg, 9.6 s control, 2.7 kills | 881 dmg, 20 s control, 2.8 kills |
| Ice Shard | 204 dmg, 2.8 s control, 1.2 kills | 309 dmg, 25.2 s control, 1.4 kills | 1,201 dmg, 41.1 s control, 2.9 kills |
| Frost Nova | 40 dmg, 8.5 s control, 0.1 kills | 86 dmg, 10.8 s control, 0.3 kills | 73 dmg, 7.2 s control, 0.2 kills |
| other | - | 3 block | 3 block |
| chill (status) | 30 dmg | 261 dmg | 522 dmg |
| armour | - | 251 block | 407 block |

- Tier I: applied chill 1,351; bursts chill 5.3; status damage chill 39. Foe-seconds a minute traced to it: chill 78, frozen 12; all foe states (any cause): frozen 12, stunned 1, radiant 1, knockedOut 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 4, rooted 2, burn 1, poison 1.
- Tier II: applied chill 3,773; bursts chill 14.8; status damage chill 269. Foe-seconds a minute traced to it: chill 85, frozen 18; all foe states (any cause): frozen 19, stunned 3, knockedOut 2, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 7, burn 4, rooted 1, stunned 1.
- Tier III: applied chill 9,404; bursts chill 29.5; status damage chill 543. Foe-seconds a minute traced to it: chill 94, frozen 30; all foe states (any cause): frozen 30, stunned 3, radiant 3, knockedOut 3, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, burn 5, rooted 1, stunned 1.

### Storm Mage (storm): caster

Trait: Conductor: Shock lasts twice as long on wet enemies.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Chain Lightning** (chainLightning, cd 9.8s) | I | 100% · 7.7/m · 2s | 100% · 8.1/m · 2s | 100% · 8/m · 3s | 100% · 7.2/m · 2s | 100% · 7.4/m · 2s | 100% · 7.4/m · 3s | 100% · 8.3/m · 2s | 100% · 7.4/m · 3s | 100% · 7.4/m · 3s | 100% · 6.7/m · 2s | 100% · 8.2/m · 2s |
|  | II | 100% · 13/m · 2s | 100% · 12.6/m · 2s | 100% · 12.2/m · 3s | 100% · 12.5/m · 2s | 100% · 12.6/m · 2s | 100% · 12/m · 2s | 100% · 12.6/m · 2s | 100% · 12.1/m · 3s | 100% · 11.6/m · 2s | 100% · 11.1/m · 2s | 100% · 13.8/m · 2s |
|  | III | 100% · 14.1/m · 2s | 100% · 13.8/m · 2s | 100% · 13.2/m · 3s | 100% · 14.4/m · 2s | 100% · 14.7/m · 2s | 100% · 13.9/m · 3s | 100% · 13.7/m · 2s | 100% · 14.1/m · 3s | 100% · 13.9/m · 2s | 100% · 12.5/m · 3s | 100% · 14.8/m · 3s |
| **Thunderclap** (thunderclap, cd 13.4s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.4/m · 2s | 100% · 5.9/m · 3s | 83% · 1.7/m · 6s | 100% · 2.4/m · 4s | 100% · 3.6/m · 3s | 100% · 3.8/m · 10s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.3/m · 2s | 100% · 8.1/m · 3s | 83% · 1.9/m · 3s | 83% · 1.7/m · 4s | 100% · 3.7/m · 4s | 100% · 4/m · 16s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.8/m · 2s | 100% · 7.3/m · 3s | 67% · 1.6/m · 2s | 83% · 1.8/m · 3s | 100% · 2.3/m · 10s | 100% · 4.1/m · 9s |
| **Zeus Bolt** (stormCloud, cd 14.6s) | I | 100% · 5.3/m · 3s | 100% · 5.8/m · 3s | 100% · 6.2/m · 3s | 100% · 4.9/m · 3s | 100% · 5.1/m · 3s | 100% · 5.2/m · 2s | 100% · 5.9/m · 2s | 100% · 5.2/m · 3s | 100% · 5.1/m · 2s | 100% · 4.8/m · 3s | 100% · 5.7/m · 3s |
|  | II | 100% · 8.9/m · 3s | 100% · 9.1/m · 3s | 100% · 9.7/m · 3s | 100% · 8.9/m · 3s | 100% · 8.9/m · 3s | 100% · 8.9/m · 3s | 100% · 9.4/m · 3s | 100% · 8.8/m · 3s | 100% · 8.8/m · 2s | 100% · 8/m · 3s | 100% · 10.6/m · 3s |
|  | III | 100% · 9.5/m · 3s | 100% · 10.7/m · 3s | 100% · 10.1/m · 3s | 100% · 9.8/m · 3s | 100% · 9.7/m · 3s | 100% · 10.1/m · 3s | 100% · 11/m · 3s | 100% · 10.4/m · 3s | 100% · 9.8/m · 3s | 100% · 9/m · 3s | 100% · 10.8/m · 4s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 497 dmg, 0.4 s control, 2.8 kills | 543 dmg, 1.1 s control, 2.7 kills | 975 dmg, 4 s control, 2.9 kills |
| Chain Lightning | 181 dmg, 2.2 s control, 1 kills | 272 dmg, 7.2 s control, 1 kills | 804 dmg, 12.8 s control, 2.3 kills |
| Thunderclap | 120 dmg, 0.7 s control, 0.8 kills | 170 dmg, 32.3 s control, 0.6 kills | 266 dmg, 23.3 s control, 0.5 kills |
| Zeus Bolt | 87 dmg, 0.1 s control, 0.4 kills | 162 dmg, 4.4 s control, 0.7 kills | 608 dmg, 7.7 s control, 1.3 kills |
| other | - | 6 block | 4 block |
| chill (status) | - | 3 dmg | - |
| armour | - | 255 block | 332 block |

- Tier I: applied shock 952, stagger 217; bursts -; status damage -. Foe-seconds a minute traced to it: shock 61, overloaded 17, stagger 15; all foe states (any cause): overloaded 17, stunned 11, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 7, burn 2, rooted 1, chill 1.
- Tier II: applied shock 2,611, stagger 523; bursts shock 13, stagger 4.6; status damage -. Foe-seconds a minute traced to it: shock 73, overloaded 27, knockedOut 11; all foe states (any cause): stunned 35, overloaded 27, knockedOut 12, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 8, burn 4, rooted 1, stunned 1.
- Tier III: applied shock 5,910, stagger 475; bursts shock 38.8, stagger 3.5; status damage -. Foe-seconds a minute traced to it: shock 78, overloaded 33, knockedOut 7; all foe states (any cause): stunned 44, overloaded 33, knockedOut 9, radiant 2, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 5, stagger 5, rooted 1.

### Cleric (cleric): support

Trait: Raiser: Revives the downed twice as fast, at 20% health.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Mending Ray** (mend, cd 8.5s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 92% · 4.5/m · 14s | 92% · 3.9/m · 12s | 63% · 0.6/m · 48s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 92% · 4.6/m · 13s | 100% · 3/m · 16s | **0%** |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 75% · 4/m · 9s | 83% · 2.4/m · 22s | **0%** |
| **Sanctuary** (sanctuary, cd 19.5s) | I | 100% · 3.1/m · 13s | 100% · 3.9/m · 4s | 100% · 3.9/m · 3s | 100% · 2.9/m · 34s | 75% · 1/m · 81s | 100% · 2.9/m · 22s | 100% · 3.3/m · 7s | 100% · 3.1/m · 13s | 100% · 2.6/m · 18s | 100% · 2.8/m · 12s | 88% · 1.1/m · 37s |
|  | II | 100% · 5.5/m · 21s | 100% · 5.5/m · 10s | 100% · 5.6/m · 12s | 100% · 4.5/m · 43s | 33% · 0.2/m · 103s | 92% · 2.4/m · 64s | 100% · 5.6/m · 12s | 100% · 4.2/m · 28s | 100% · 2.7/m · 35s | 100% · 4.5/m · 14s | 75% · 0.8/m · 75s |
|  | III | 100% · 6/m · 16s | 100% · 6.6/m · 7s | 100% · 6.2/m · 9s | 100% · 3.7/m · 21s | 42% · 0.3/m · 87s | 100% · 1.6/m · 78s | 100% · 4.6/m · 11s | 100% · 2.6/m · 23s | 100% · 3.8/m · 15s | 100% · 5/m · 13s | 100% · 1.9/m · 44s |
| **Smite** (smite, cd 11s) | I | 100% · 6.6/m · 2s | 100% · 6.2/m · 3s | 100% · 6.7/m · 3s | 100% · 6.5/m · 3s | 100% · 6.5/m · 2s | 100% · 6.3/m · 2s | 100% · 6.9/m · 3s | 100% · 6.2/m · 3s | 100% · 5.5/m · 3s | 100% · 5.2/m · 3s | 100% · 6.8/m · 3s |
|  | II | 100% · 11.5/m · 2s | 100% · 5.8/m · 11s | 100% · 5.1/m · 6s | 100% · 11.3/m · 3s | 100% · 11.5/m · 3s | 100% · 10.7/m · 3s | 100% · 10.6/m · 2s | 100% · 10/m · 3s | 100% · 9/m · 3s | 100% · 9/m · 3s | 100% · 10.1/m · 7s |
|  | III | 100% · 12.4/m · 2s | 100% · 6.6/m · 9s | 100% · 7.6/m · 5s | 100% · 12.1/m · 3s | 100% · 12.3/m · 3s | 100% · 11.2/m · 3s | 100% · 11.6/m · 2s | 100% · 10.4/m · 4s | 100% · 9.9/m · 2s | 100% · 9.8/m · 3s | 100% · 9.2/m · 4s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 162 dmg, 2 heal, 7.2 s control, 0.3 kills | 210 dmg, 3 heal, 7.1 s control, 0.4 kills | 380 dmg, 6 heal, 7.5 s control, 0.5 kills |
| Mending Ray | 18 heal | 48 heal | 73 heal |
| Sanctuary | 11 dmg, 27 heal, 1.4 s control | 26 dmg, 127 heal, 2.6 s control | 54 dmg, 302 heal, 4 s control, 0.1 kills |
| Smite | 64 dmg, 1.7 s control, 0.2 kills | 143 dmg, 13.7 s control, 0.4 kills | 314 dmg, 18.3 s control, 0.8 kills |
| other | - | 3 block | 3 block |
| chill (status) | - | - | - |
| armour | - | 318 block | 467 block |

- Tier I: applied radiance 646, stagger 310; bursts radiance 3.7; status damage -. Foe-seconds a minute traced to it: radiance 34, stagger 24, radiant 11; all foe states (any cause): radiant 11, rooted 1, stunned 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: radiance 24, stagger 7, burn 1, rooted 1, chill 1, wet 1.
- Tier II: applied stagger 799, radiance 736; bursts radiance 4.7, stagger 2.4; status damage -. Foe-seconds a minute traced to it: stagger 40, radiance 32, radiant 14, knockedOut 6; all foe states (any cause): radiant 14, stunned 8, knockedOut 7, rooted 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: radiance 21, stagger 11, burn 6, rooted 2, stunned 2, poison 1.
- Tier III: applied stagger 869, radiance 836; bursts radiance 5.6, stagger 3.4; status damage -. Foe-seconds a minute traced to it: stagger 36, radiance 31, radiant 16, knockedOut 8; all foe states (any cause): radiant 16, stunned 11, knockedOut 9, rooted 2, sickened 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: radiance 16, stagger 10, burn 4, rooted 2, stunned 1.

### Bard (bard): support

Trait: Rhythm: Allies near the bard move 10% faster and attack 8% faster.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| **War Song** (warSong, cd 14.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.9/m · 3s | 100% · 5.2/m · 2s | 100% · 4.4/m · 2s | 100% · 2.9/m · 2s | 100% · 4.4/m · 3s | 100% · 4.8/m · 6s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.9/m · 3s | 100% · 8.6/m · 2s | 100% · 6/m · 2s | 100% · 5.7/m · 2s | 100% · 6.4/m · 3s | 100% · 8.3/m · 6s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 7.9/m · 3s | 100% · 9.6/m · 3s | 100% · 7.2/m · 3s | 100% · 7.5/m · 2s | 100% · 6.1/m · 3s | 100% · 8.5/m · 4s |
| **Lullaby** (lullaby, cd 15.9s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.5/m · 2s | 100% · 4.8/m · 3s | 83% · 1.5/m · 19s | 75% · 0.7/m · 8s | 100% · 3.1/m · 3s | 100% · 2.1/m · 9s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.6/m · 3s | 100% · 7.5/m · 2s | 50% · 0.7/m · 22s | 75% · 0.8/m · 10s | 100% · 2.9/m · 6s | 100% · 2/m · 39s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.8/m · 5s | 100% · 7.3/m · 3s | 33% · 0.6/m · 24s | 92% · 1.8/m · 11s | 100% · 2.1/m · 6s | 100% · 2.7/m · 17s |
| **Encore** (encore, cd 19.5s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.1/m · 3s | 100% · 2.6/m · 3s | 100% · 5/m · 3s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.9/m · 3s | 100% · 4.5/m · 3s | 100% · 7.7/m · 2s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.6/m · 3s | 100% · 4.8/m · 7s | 100% · 5.9/m · 6s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 586 dmg, 3.4 kills | 934 dmg, 0.2 s control, 3.5 kills | 1,489 dmg, 0.2 s control, 3.7 kills |
| Encore | - | 32 heal | 68 heal, 0.1 s control |
| other | - | 2 block | 3 block |
| armour | - | 280 block | 473 block |

- Tier I: applied sleepy 138; bursts -; status damage -. Foe-seconds a minute traced to it: sleepy 24, lullaby 12; all foe states (any cause): radiant 1, stunned 1. Its own buffs and states (s a minute): rhythm 58, warSong 16. Under foes' statuses and states: stagger 6, rooted 1, burn 1.
- Tier II: applied sleepy 137; bursts -; status damage -. Foe-seconds a minute traced to it: sleepy 23, lullaby 11, asleep 1; all foe states (any cause): stunned 3, radiant 2, knockedOut 2, asleep 1. Its own buffs and states (s a minute): rhythm 59, warSong 21. Under foes' statuses and states: stagger 10, burn 4, rooted 2, stunned 2.
- Tier III: applied sleepy 261; bursts sleepy 0.7; status damage -. Foe-seconds a minute traced to it: sleepy 26, lullaby 12, asleep 3; all foe states (any cause): stunned 3, radiant 3, asleep 3, knockedOut 2, untouchable 1. Its own buffs and states (s a minute): rhythm 59, warSong 24. Under foes' statuses and states: stagger 8, burn 3, rooted 1, stunned 1, radiance 1.

### Druid (druid): support

Trait: Barkskin: Takes 20% less damage while standing still.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Entangle** (entangle, cd 12.2s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.5/m · 3s | 100% · 5.7/m · 3s | 100% · 1.5/m · 15s | 100% · 2/m · 4s | 100% · 4.2/m · 4s | 100% · 3.9/m · 7s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 7.8/m · 3s | 100% · 10/m · 3s | 83% · 2.1/m · 12s | 100% · 2.5/m · 11s | 100% · 6.2/m · 3s | 100% · 4.9/m · 13s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.7/m · 3s | 100% · 10.1/m · 3s | 67% · 1.6/m · 11s | 100% · 4.3/m · 9s | 100% · 4.3/m · 4s | 100% · 4.4/m · 7s |
| **Rejuvenate** (rejuvenate, cd 11s) | I | 100% · 1.2/m · 12s | 100% · 3.7/m · 4s | 100% · 4.6/m · 3s | 100% · 0.6/m · 42s | 42% · 0.2/m · 54s | 100% · 2.7/m · 4s | 100% · 2.9/m · 4s | 100% · 2.1/m · 6s | 100% · 2.2/m · 6s | 100% · 4.4/m · 5s | 100% · 2/m · 27s |
|  | II | 100% · 1.1/m · 13s | 100% · 2.2/m · 8s | 100% · 2.5/m · 8s | 100% · 0.5/m · 57s | 33% · 0.2/m · 86s | 100% · 4.9/m · 4s | 100% · 4.7/m · 4s | 100% · 3.8/m · 7s | 100% · 4/m · 7s | 100% · 4.5/m · 9s | 100% · 2.6/m · 19s |
|  | III | 100% · 1.4/m · 10s | 100% · 3.3/m · 7s | 100% · 3/m · 6s | 100% · 0.6/m · 26s | 58% · 0.3/m · 89s | 100% · 5.4/m · 4s | 100% · 5.3/m · 4s | 100% · 5.3/m · 5s | 100% · 2.5/m · 5s | 100% · 2.3/m · 5s | 100% · 4.4/m · 15s |
| **Call Wolf** (callWolf, cd 26.8s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.8/m · 2s | 100% · 3.1/m · 2s | 100% · 2.1/m · 3s | 100% · 2.2/m · 2s | 100% · 2.9/m · 3s | 100% · 3.2/m · 6s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.9/m · 2s | 100% · 5/m · 2s | 100% · 3.7/m · 3s | 100% · 3.5/m · 2s | 100% · 4.5/m · 3s | 100% · 5.4/m · 5s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.5/m · 2s | 100% · 5.5/m · 3s | 100% · 4.4/m · 3s | 100% · 5/m · 2s | 100% · 4.1/m · 3s | 100% · 5.4/m · 6s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 292 dmg, 1.4 s control, 0.8 kills | 383 dmg, 4.1 s control, 1.1 kills | 662 dmg, 7.2 s control, 1.5 kills |
| Entangle | 8 dmg, 9.7 s control, 0.1 kills | 7 dmg, 16.8 s control | 9 dmg, 34.6 s control |
| Rejuvenate | 53 heal | 140 heal | 1 dmg, 154 heal |
| Call Wolf | 19 dmg, 0.1 kills | 46 dmg, 0.3 kills | 103 dmg, 0.4 kills |
| Barkskin (trait) | 6 block | 23 block | 25 block |
| other | - | 1 block | 1 block |
| chill (status) | - | - | 1 dmg |
| entangle (status) | 5 dmg | 16 dmg | 27 dmg |
| poison (status) | - | - | 334 dmg, 4.5 s control, 0.8 kills |
| armour | - | 343 block | 512 block |

- Tier I: applied entangle 484; bursts entangle 0.7; status damage entangle 9. Foe-seconds a minute traced to it: entangle 60, rooted 7; all foe states (any cause): rooted 9, stunned 1, radiant 1, knockedOut 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 5, rooted 2, burn 1, chill 1, poison 1.
- Tier II: applied entangle 581; bursts entangle 1.4; status damage entangle 16. Foe-seconds a minute traced to it: entangle 67, rooted 23; all foe states (any cause): rooted 27, stunned 2, knockedOut 2, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 10, burn 4, rooted 2, stunned 1.
- Tier III: applied entangle 686, poison 579; bursts entangle 2.8, poison 2.7; status damage poison 327, entangle 32. Foe-seconds a minute traced to it: poison 62, entangle 57, rooted 18, sickened 15; all foe states (any cause): rooted 21, sickened 15, stunned 3, radiant 2, knockedOut 2, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 10, burn 3, rooted 1, stunned 1, poison 1.

### Necromancer (necromancer): caster

Trait: Soul Harvest: Every enemy that dies near him shortens his cooldowns.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Raise Dead** (raiseDead, cd 14.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 25% · 0.5/m · 36s | 100% · 4.9/m · 9s | 100% · 2.4/m · 19s | 100% · 4/m · 8s | 100% · 3.8/m · 10s | 100% · 7.2/m · 4s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 83% · 0.9/m · 42s | 100% · 8.6/m · 9s | 100% · 2/m · 21s | 100% · 5.7/m · 13s | 92% · 2.8/m · 14s | 100% · 11.1/m · 4s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 1.4/m · 34s | 100% · 10.3/m · 7s | 100% · 2.7/m · 17s | 100% · 6.6/m · 12s | 67% · 3.1/m · 12s | 100% · 11.6/m · 5s |
| **Life Drain** (lifeDrain, cd 11s) | I | 100% · 7.2/m · 2s | 75% · 3.5/m · 8s | 92% · 4.9/m · 5s | 100% · 7/m · 3s | 100% · 6.7/m · 3s | 100% · 7/m · 2s | 100% · 7.6/m · 3s | 100% · 5.8/m · 3s | 100% · 5.5/m · 3s | 100% · 6.1/m · 3s | 100% · 6.7/m · 6s |
|  | II | 100% · 12/m · 2s | 17% · 0.5/m · 18s | 17% · 0.5/m · 23s | 100% · 10.6/m · 3s | 100% · 10.3/m · 3s | 100% · 11.3/m · 2s | 100% · 11.4/m · 3s | 100% · 6.6/m · 4s | 100% · 4.7/m · 3s | 100% · 7.9/m · 3s | 100% · 4.3/m · 15s |
|  | III | 100% · 13.1/m · 2s | **0%** | 17% · 0.6/m · 10s | 100% · 11.7/m · 3s | 100% · 8.8/m · 5s | 100% · 12.2/m · 2s | 100% · 12.9/m · 3s | 100% · 7.3/m · 4s | 100% · 7.1/m · 3s | 100% · 6.4/m · 3s | 100% · 3.9/m · 13s |
| **Bone Spear** (boneSpear, cd 9.8s) | I | 100% · 7/m · 5s | 100% · 7.8/m · 3s | 100% · 8.4/m · 3s | 100% · 6.6/m · 3s | 100% · 6.8/m · 3s | 100% · 6.5/m · 5s | 100% · 8.2/m · 3s | 100% · 7.9/m · 3s | 100% · 7.6/m · 2s | 100% · 7.2/m · 3s | 100% · 10.2/m · 2s |
|  | II | 100% · 11.6/m · 5s | 100% · 12.6/m · 3s | 100% · 12.1/m · 3s | 100% · 8.8/m · 3s | 100% · 11.2/m · 3s | 100% · 10.7/m · 5s | 100% · 13.7/m · 2s | 100% · 12.9/m · 3s | 100% · 12.3/m · 3s | 100% · 6.5/m · 3s | 100% · 14.8/m · 2s |
|  | III | 100% · 12.1/m · 5s | 100% · 13.2/m · 3s | 100% · 13.4/m · 3s | 100% · 7/m · 3s | 100% · 11.9/m · 3s | 100% · 11.8/m · 5s | 100% · 14.5/m · 3s | 100% · 12.9/m · 3s | 100% · 12.9/m · 2s | 100% · 8.4/m · 3s | 100% · 15.9/m · 1s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 289 dmg, 1.3 kills | 284 dmg, 0.9 kills | 608 dmg, 1.4 kills |
| Raise Dead | 47 dmg, 0.6 kills | 76 dmg, 0.6 kills | 79 dmg, 0.3 kills |
| Life Drain | 281 dmg, 143 heal, 1.1 kills | 416 dmg, 369 heal, 1.2 kills | 768 dmg, 671 heal, 1.7 kills |
| Bone Spear | 157 dmg, 0.9 kills | 232 dmg, 1 kills | 544 dmg, 1.5 kills |
| other | - | 14 block | 19 block |
| chill (status) | - | - | 1 dmg |
| armour | - | 505 block | 924 block |

- Tier I: applied curse 234; bursts -; status damage -. Foe-seconds a minute traced to it: curse 43; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 11, burn 2, rooted 1, wet 1, chill 1, poison 1, stunned 1, radiance 1.
- Tier II: applied curse 247; bursts -; status damage -. Foe-seconds a minute traced to it: curse 44; all foe states (any cause): stunned 2, radiant 1, knockedOut 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 16, burn 6, stunned 3, poison 2, wet 2, rooted 1, knockedOut 1, chill 1.
- Tier III: applied curse 293; bursts -; status damage -. Foe-seconds a minute traced to it: curse 47; all foe states (any cause): stunned 2, radiant 2, knockedOut 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 15, burn 5, stunned 3, poison 2, wet 2, rooted 2, knockedOut 1, chill 1.

### Plague Doctor (plague): caster

Trait: Immunity: Can't be poisoned, and his poison spreads to enemies nearby.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Miasma** (miasma, cd 12.2s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.5/m · 3s | 100% · 6.9/m · 3s | 50% · 1/m · 3s | 92% · 2.1/m · 4s | 100% · 3/m · 4s | 100% · 4.1/m · 11s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 7.6/m · 3s | 100% · 9.5/m · 3s | 83% · 2.7/m · 10s | 100% · 2.5/m · 14s | 100% · 5/m · 3s | 100% · 5.7/m · 10s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 8.5/m · 3s | 100% · 10.2/m · 3s | 100% · 4.3/m · 5s | 92% · 4/m · 6s | 100% · 4.9/m · 3s | 100% · 6/m · 8s |
| **Cure** (cure, cd 11s) | I | **0%** | 67% · 3.7/m · 4s | 92% · 4.8/m · 4s | **0%** | **0%** | **0%** | **0%** | 100% · 5.1/m · 5s | 100% · 4.6/m · 3s | 100% · 3.6/m · 8s | 100% · 2/m · 9s |
|  | II | **0%** | 100% · 4.9/m · 8s | 100% · 10.8/m · 3s | **0%** | **0%** | **0%** | **0%** | 100% · 6/m · 12s | 100% · 7.1/m · 4s | 100% · 5.3/m · 9s | 75% · 1.9/m · 24s |
|  | III | **0%** | 100% · 9/m · 4s | 100% · 11.8/m · 3s | **0%** | **0%** | **0%** | **0%** | 100% · 6.1/m · 10s | 100% · 5.5/m · 4s | 100% · 6.6/m · 8s | 100% · 2.3/m · 32s |
| **Gas Form** (leeches, cd 14.6s) | I | 100% · 4.5/m · 6s | **0%** | **0%** | 100% · 3.8/m · 6s | 100% · 3.2/m · 8s | 100% · 5.1/m · 2s | 100% · 6.9/m · 2s | 83% · 1.9/m · 7s | 100% · 1.4/m · 3s | 100% · 1.9/m · 3s | 100% · 2.1/m · 26s |
|  | II | 100% · 6.1/m · 6s | **0%** | **0%** | 100% · 4.5/m · 8s | 100% · 2.3/m · 22s | 100% · 7.8/m · 3s | 100% · 8.4/m · 2s | 83% · 1.6/m · 16s | 92% · 1.5/m · 4s | 100% · 2.4/m · 5s | 100% · 1.8/m · 19s |
|  | III | 100% · 7.5/m · 6s | **0%** | **0%** | 100% · 4.4/m · 6s | 83% · 2.4/m · 15s | 100% · 6.3/m · 3s | 100% · 8.5/m · 2s | 67% · 1.5/m · 17s | 83% · 1.7/m · 8s | 100% · 2.2/m · 9s | 100% · 2.2/m · 31s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 423 dmg, 32.8 s control, 2.3 kills | 539 dmg, 39.3 s control, 2.4 kills | 944 dmg, 41.6 s control, 2.7 kills |
| Miasma | 9 dmg, 7.1 s control, 0.1 kills | 15 dmg, 12.9 s control, 0.1 kills | 36 dmg, 26 via others, 16.6 s control, 0.1 kills |
| Cure | 44 heal | 178 heal | 350 heal |
| Gas Form | 4 block, 4.1 s control | 12 block, 9.9 s control | 26 block, 15.2 s control |
| other | - | 1 block | 110 heal, 2 block |
| burn (status) | 10 dmg | 7 dmg | 7 dmg |
| chill (status) | - | - | 1 dmg |
| poison (status) | 534 dmg, 3.3 s control, 3.2 kills | 821 dmg, 4.4 s control, 2.1 kills | 1,141 dmg, 5.2 s control, 1.8 kills |
| armour | - | 290 block | 520 block |

- Tier I: applied poison 1,863, burn 11, stagger 3, chill 3, radiance 1; bursts poison 15.4; status damage poison 528, burn 4. Foe-seconds a minute traced to it: poison 83, sickened 41, burn 1; all foe states (any cause): sickened 41, radiant 1, stunned 1. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 6, rooted 2, burn 2.
- Tier II: applied poison 2,674, burn 17, stagger 4; bursts poison 26.6; status damage poison 772, burn 7. Foe-seconds a minute traced to it: poison 86, sickened 50, burn 2; all foe states (any cause): sickened 50, stunned 2, knockedOut 1, radiant 1. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 9, burn 8, rooted 1, stunned 1.
- Tier III: applied poison 3,272, burn 24, chill 8, stagger 3, radiance 1; bursts poison 34.1; status damage poison 1,114, burn 8, chill 1. Foe-seconds a minute traced to it: poison 93, sickened 62, weakened 20, burn 2; all foe states (any cause): sickened 62, stunned 3, radiant 2, knockedOut 2, untouchable 1. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 8, burn 8, stunned 1, chill 1, rooted 1, knockedOut 1.

### Old Guard (oldguard): tank

Trait: Last Stand: Once a room, when he is the last of the party standing: he can't be stopped or knocked about and is hasted for 10s, and all his abilities are ready again at once.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Great Sweep** (greatSweep, cd 9.8s) | I | 100% · 7.5/m · 3s | 100% · 3.5/m · 8s | 100% · 4.4/m · 8s | 100% · 7.1/m · 2s | 100% · 7.2/m · 3s | 100% · 6.6/m · 3s | 100% · 7.3/m · 3s | 100% · 6.6/m · 4s | 100% · 6.7/m · 3s | 100% · 6.4/m · 3s | 100% · 6.9/m · 5s |
|  | II | 100% · 12.5/m · 3s | 100% · 5/m · 6s | 100% · 5.5/m · 8s | 100% · 13.4/m · 2s | 100% · 12.2/m · 3s | 100% · 11.7/m · 2s | 100% · 11.1/m · 3s | 100% · 11.4/m · 3s | 100% · 9.7/m · 2s | 100% · 9.4/m · 3s | 100% · 9/m · 5s |
|  | III | 100% · 15.1/m · 3s | 92% · 5.4/m · 5s | 100% · 4.9/m · 8s | 100% · 13.2/m · 3s | 100% · 14.7/m · 3s | 100% · 13.7/m · 2s | 100% · 12.8/m · 3s | 100% · 13.3/m · 3s | 100% · 10.7/m · 2s | 100% · 11.9/m · 3s | 100% · 10.9/m · 8s |
| **Rally** (rallyCry, cd 18.3s) | I | **0%** | **0%** | **0%** | 100% · 2.5/m · 10s | 42% · 0.9/m · 20s | **8%** | 100% · 4.2/m · 2s | 100% · 3.6/m · 4s | 100% · 3.6/m · 3s | 100% · 3.8/m · 3s | 100% · 2.4/m · 17s |
|  | II | 83% · 1.6/m · 18s | **0%** | **0%** | 100% · 4.5/m · 3s | 33% · 0.4/m · 44s | **8%** | 100% · 6.2/m · 3s | 100% · 4/m · 8s | 100% · 4.7/m · 3s | 100% · 4.8/m · 3s | 100% · 3.5/m · 21s |
|  | III | 42% · 1/m · 6s | **0%** | **0%** | 75% · 3.4/m · 3s | **0%** | **8%** | 100% · 7.2/m · 3s | 92% · 3.4/m · 9s | 100% · 5.3/m · 3s | 100% · 5.7/m · 3s | 100% · 3.7/m · 17s |
| **Parry** (pommelStrike, cd 11s) | I | 100% · 6.8/m · 2s | 100% · 6.6/m · 3s | 100% · 6.7/m · 3s | 100% · 6.4/m · 3s | 100% · 6.4/m · 2s | 100% · 6.4/m · 2s | 100% · 6.7/m · 2s | 100% · 6.5/m · 3s | 100% · 6.1/m · 3s | 100% · 6.3/m · 3s | 100% · 5.6/m · 8s |
|  | II | 100% · 11.8/m · 2s | 100% · 11.7/m · 3s | 100% · 11.8/m · 3s | 100% · 11.2/m · 3s | 100% · 11.7/m · 2s | 100% · 10.8/m · 2s | 100% · 11.8/m · 2s | 100% · 11.4/m · 3s | 100% · 10.5/m · 3s | 100% · 9.5/m · 3s | 100% · 6.9/m · 8s |
|  | III | 100% · 12.8/m · 3s | 100% · 12.7/m · 3s | 100% · 13.2/m · 3s | 100% · 12.8/m · 3s | 100% · 12.4/m · 2s | 100% · 12.3/m · 2s | 100% · 12.8/m · 2s | 100% · 12/m · 3s | 100% · 10.5/m · 3s | 100% · 12.5/m · 3s | 100% · 7.3/m · 11s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 345 dmg, 1.8 kills | 598 dmg, 2.7 kills | 1,001 dmg, 2.7 kills |
| Great Sweep | 160 dmg, 0.8 kills | 290 dmg, 10.5 s control, 1.2 kills | 1,018 dmg, 43.4 s control, 2.4 kills |
| Rally | - | - | 263 heal |
| Parry | 79 dmg, 63 block, 0.2 s control, 0.2 kills | 310 dmg, 308 block, 1.1 s control, 0.5 kills | 588 dmg, 450 block, 1.1 s control, 1 kills |
| other | 1 block | 1 block | 2 block |
| burn (status) | - | 8 dmg | 6 dmg |
| chill (status) | - | 2 dmg | 3 dmg |
| armour | 420 block | 746 block | 973 block |
| tk:brambleVest | - | - | - |

- Tier I: applied burn 4, chill 1; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): rally 11. Under foes' statuses and states: stagger 11, burn 4, rooted 3, chill 3, stunned 1, wet 1, radiance 1, poison 1.
- Tier II: applied stagger 961, burn 25, chill 6; bursts stagger 2.4; status damage burn 6, chill 1. Foe-seconds a minute traced to it: stagger 50, knockedOut 6, burn 3; all foe states (any cause): stunned 9, knockedOut 7, radiant 1, rooted 1. Its own buffs and states (s a minute): rally 22, haste 22. Under foes' statuses and states: stagger 9, burn 8, stunned 3, rooted 1, wet 1, poison 1, radiance 1.
- Tier III: applied stagger 1,839, burn 20, chill 8; bursts stagger 10.2; status damage burn 5, chill 2. Foe-seconds a minute traced to it: stagger 44, knockedOut 23, burn 2; all foe states (any cause): stunned 28, knockedOut 24, radiant 2, rooted 1. Its own buffs and states (s a minute): haste 21, rally 21. Under foes' statuses and states: burn 8, stagger 6, radiance 2, stunned 2, chill 1, rooted 1, poison 1, wet 1.

### Dame (dame): tank

Trait: Grace: Every third blow she lands is a critical hit.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Riposte** (riposte, cd 11s) | I | 100% · 7/m · 2s | 100% · 3.5/m · 8s | 100% · 5.4/m · 6s | 100% · 6.6/m · 2s | 100% · 6.5/m · 2s | 100% · 6.1/m · 3s | 100% · 6.5/m · 2s | 100% · 6.1/m · 2s | 100% · 5.7/m · 2s | 100% · 5.5/m · 3s | 100% · 6.3/m · 7s |
|  | II | 100% · 11.7/m · 2s | 100% · 5.7/m · 7s | 100% · 5.6/m · 8s | 100% · 10.6/m · 2s | 100% · 11.2/m · 2s | 100% · 10.8/m · 2s | 100% · 11.6/m · 3s | 100% · 10.3/m · 2s | 100% · 10.1/m · 3s | 100% · 7.6/m · 3s | 100% · 9/m · 5s |
|  | III | 100% · 12.8/m · 2s | 83% · 4.2/m · 6s | 100% · 5.9/m · 7s | 100% · 11.1/m · 2s | 100% · 12.4/m · 2s | 100% · 11.9/m · 2s | 100% · 12.1/m · 2s | 100% · 11.4/m · 2s | 100% · 11.3/m · 2s | 100% · 11.4/m · 3s | 100% · 10.2/m · 5s |
| **Challenge** (challenge, cd 17.1s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **8%** | 50% · 0.8/m · 38s | 13% · <0.1/m · 19s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 83% · 0.9/m · 53s | **8%** | **0%** |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 67% · 0.9/m · 44s | 17% · 0.1/m · 60s | **0%** |
| **Disarm** (disarm, cd 13.4s) | I | 100% · 5.4/m · 3s | 92% · 2.7/m · 7s | 100% · 3.8/m · 8s | 100% · 5.6/m · 3s | 100% · 5.3/m · 3s | 100% · 5.3/m · 2s | 100% · 5.6/m · 3s | 100% · 5.1/m · 3s | 100% · 4.8/m · 3s | 100% · 4.6/m · 3s | 100% · 5.7/m · 5s |
|  | II | 100% · 9.6/m · 3s | 100% · 5.2/m · 6s | 100% · 5.9/m · 6s | 100% · 9.3/m · 3s | 100% · 9.3/m · 3s | 100% · 9.1/m · 3s | 100% · 9.3/m · 3s | 100% · 8.7/m · 3s | 100% · 8.1/m · 3s | 100% · 6.1/m · 3s | 100% · 8.8/m · 6s |
|  | III | 100% · 11/m · 3s | 75% · 4.2/m · 5s | 100% · 5.4/m · 7s | 100% · 10.1/m · 3s | 100% · 10.6/m · 3s | 100% · 10.2/m · 3s | 100% · 10.4/m · 3s | 100% · 9.2/m · 3s | 100% · 9.1/m · 3s | 100% · 9.5/m · 3s | 100% · 9.9/m · 4s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 418 dmg, 2.3 kills | 692 dmg, 2.7 kills | 1,141 dmg, 2.9 kills |
| Riposte | 79 dmg, 107 block, 0.2 kills | 127 dmg, 205 block, 12.9 s control, 0.4 kills | 340 dmg, 686 block, 34.3 s control, 0.7 kills |
| Challenge | 2 heal | 20 heal, 1 block | 24 heal, 2 block |
| Disarm | 25 dmg, 146 via others, 0.2 kills | 47 dmg, 342 via others, 0.2 kills | 87 dmg, 590 via others, 0.3 kills |
| Grace (trait) | 158 via others | 274 via others | 482 via others |
| other | 1 block | 2 block | 2 block |
| chill (status) | - | - | - |
| armour | 304 block | 644 block | 817 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: disarmed 22; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): riposte 10. Under foes' statuses and states: stagger 13, rooted 5, burn 3, chill 3, stunned 1, wet 1, radiance 1, poison 1.
- Tier II: applied stagger 793; bursts stagger 3; status damage -. Foe-seconds a minute traced to it: disarmed 38, stagger 35, knockedOut 7; all foe states (any cause): stunned 11, knockedOut 8, radiant 1. Its own buffs and states (s a minute): riposte 16. Under foes' statuses and states: stagger 17, burn 8, stunned 4, rooted 3, knockedOut 2, wet 2, poison 1, chill 1.
- Tier III: applied stagger 1,339; bursts stagger 7.1; status damage -. Foe-seconds a minute traced to it: disarmed 48, stagger 38, knockedOut 17; all foe states (any cause): stunned 22, knockedOut 18, radiant 2. Its own buffs and states (s a minute): riposte 28. Under foes' statuses and states: stagger 17, burn 6, rooted 4, stunned 4, radiance 3, poison 2, wet 2, knockedOut 2.

### Griffon (griffon): tank

Trait: Skyborn: Can't be rooted or entangled.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Swoop** (swoop, cd 13.4s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 33% · 0.4/m · 44s | 75% · 1.1/m · 22s | **0%** |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.3/m · 39s | 33% · 1/m · 26s | **0%** |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.5/m · 16s | **8%** | 13% · <0.1/m · 102s |
| **Stormhammer** (hammerThrow, cd 11s) | I | 100% · 7.4/m · 2s | 100% · 6.8/m · 2s | 100% · 7.2/m · 3s | 100% · 6.4/m · 3s | 100% · 6.6/m · 3s | 100% · 6.1/m · 2s | 100% · 7/m · 2s | 100% · 6.8/m · 2s | 100% · 4.7/m · 2s | 100% · 5.8/m · 3s | 100% · 7.8/m · 2s |
|  | II | 100% · 11.6/m · 2s | 100% · 11.4/m · 3s | 100% · 11.9/m · 3s | 100% · 10.3/m · 3s | 100% · 11.2/m · 3s | 100% · 10.2/m · 2s | 100% · 11.7/m · 2s | 100% · 11.4/m · 2s | 100% · 10.4/m · 2s | 100% · 8.8/m · 3s | 100% · 12.6/m · 3s |
|  | III | 100% · 12.5/m · 2s | 100% · 12.3/m · 2s | 100% · 12.8/m · 3s | 100% · 11.9/m · 3s | 100% · 12.4/m · 3s | 100% · 11/m · 2s | 100% · 12.4/m · 2s | 100% · 13.1/m · 2s | 100% · 12.4/m · 2s | 100% · 6.8/m · 3s | 100% · 13.4/m · 2s |
| **Wing Guard** (wingShield, cd 15.9s) | I | 100% · 5.5/m · 3s | **0%** | **0%** | 100% · 4.8/m · 3s | 100% · 4.7/m · 2s | 100% · 4.8/m · 2s | 100% · 5.1/m · 2s | 100% · 2.9/m · 3s | 100% · 2.3/m · 3s | 100% · 3.1/m · 3s | 100% · 4.3/m · 7s |
|  | II | 100% · 8.3/m · 3s | **0%** | **0%** | 100% · 7.5/m · 3s | 100% · 8/m · 2s | 100% · 7.8/m · 2s | 100% · 8.8/m · 3s | 100% · 5.9/m · 3s | 100% · 5/m · 3s | 100% · 5.5/m · 3s | 100% · 6.3/m · 18s |
|  | III | 100% · 9.2/m · 3s | **0%** | **0%** | 100% · 8.3/m · 3s | 100% · 9/m · 3s | 100% · 8.8/m · 2s | 100% · 9.2/m · 2s | 100% · 6.4/m · 3s | 100% · 6.5/m · 2s | 100% · 4.4/m · 3s | 100% · 6.6/m · 8s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 341 dmg, 1.7 kills | 424 dmg, 1.4 kills | 727 dmg, 0.2 s control, 1.4 kills |
| Swoop | 3 dmg | 7 dmg, 2 block, 0.8 s control | 9 dmg, 13 block, 0.6 s control |
| Stormhammer | 136 dmg, 0.5 kills | 225 dmg, 0.4 s control, 1 kills | 579 dmg, 0.6 s control, 1.2 kills |
| Wing Guard | 62 dmg, 58 block, 0.2 kills | 164 dmg, 160 block, 0.7 kills | 285 dmg, 297 block, 0.9 kills |
| other | 2 block | 12 block | 14 block |
| chill (status) | - | 2 dmg | 1 dmg |
| armour | 384 block | 927 block | 1,525 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: whirled 31; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): wingShield 13. Under foes' statuses and states: stagger 15, chill 4, burn 4, stunned 2, wet 1, radiance 1, poison 1, knockedOut 1.
- Tier II: applied shock 37, stagger 32; bursts -; status damage -. Foe-seconds a minute traced to it: whirled 50, shock 3, stagger 1, knockedOut 1; all foe states (any cause): stunned 3, knockedOut 1, radiant 1. Its own buffs and states (s a minute): wingShield 24. Under foes' statuses and states: stagger 22, burn 7, stunned 6, knockedOut 3, wet 2, poison 1, radiance 1, chill 1.
- Tier III: applied shock 93, stagger 38; bursts -; status damage -. Foe-seconds a minute traced to it: whirled 58, shock 6, overloaded 2, stagger 1, flung3723 1, flung3721 1, flung3717 1, flung3709 1; all foe states (any cause): stunned 5, radiant 2, overloaded 2, knockedOut 2, untouchable 1. Its own buffs and states (s a minute): wingShield 26. Under foes' statuses and states: stagger 20, burn 7, stunned 6, knockedOut 3, wet 1, chill 1, poison 1.

### Bulwark (bulwark): tank

Trait: Return Thrust: Every blow he takes winds him up, up to five. His next thrust lets it go: twice the reach, through everything in a line, and 30% harder for each.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Brace** (brace, cd 12.2s) | I | 100% · 6.2/m · 2s | 100% · 6.3/m · 2s | 100% · 6.2/m · 3s | 100% · 6.1/m · 2s | 100% · 5.9/m · 3s | 100% · 5.7/m · 3s | 100% · 6.6/m · 3s | 100% · 6/m · 3s | 100% · 5/m · 3s | 100% · 5.4/m · 3s | 100% · 6.4/m · 6s |
|  | II | 100% · 10.5/m · 2s | 100% · 10.8/m · 2s | 100% · 11/m · 3s | 100% · 10.4/m · 2s | 100% · 10.6/m · 3s | 100% · 10/m · 3s | 100% · 10.6/m · 3s | 100% · 10.6/m · 2s | 100% · 9.8/m · 3s | 100% · 9.7/m · 3s | 100% · 8.7/m · 6s |
|  | III | 100% · 12.1/m · 2s | 100% · 10.7/m · 2s | 100% · 11.5/m · 3s | 100% · 11.2/m · 2s | 100% · 11.8/m · 3s | 100% · 11.1/m · 3s | 100% · 11.1/m · 3s | 100% · 11.2/m · 2s | 100% · 10.8/m · 3s | 100% · 10.9/m · 3s | 100% · 9.9/m · 5s |
| **Shield Wall** (shieldWall, cd 18.3s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.3/m · 2s | **0%** | 100% · 1.6/m · 2s | 100% · 2.6/m · 3s | 100% · 2.4/m · 29s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.3/m · 2s | **0%** | 100% · 3.1/m · 2s | 100% · 4.7/m · 2s | 100% · 3.2/m · 14s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.6/m · 2s | **0%** | 100% · 4.7/m · 2s | 100% · 5.1/m · 2s | 100% · 2.9/m · 16s |
| **Impale** (impale, cd 11s) | I | 100% · 6.5/m · 3s | 100% · 3.5/m · 12s | 100% · 4.1/m · 9s | 100% · 6.9/m · 3s | 100% · 6.3/m · 2s | 100% · 6.3/m · 2s | 100% · 6.1/m · 3s | 100% · 6.2/m · 3s | 100% · 5.1/m · 3s | 100% · 5.1/m · 3s | 100% · 5.5/m · 7s |
|  | II | 100% · 10.9/m · 3s | 75% · 2/m · 26s | 67% · 1.6/m · 29s | 100% · 10.6/m · 3s | 100% · 11.3/m · 2s | 100% · 11/m · 2s | 100% · 10.1/m · 4s | 100% · 8.4/m · 3s | 100% · 7.3/m · 3s | 100% · 7.7/m · 4s | 100% · 5/m · 10s |
|  | III | 100% · 11.7/m · 5s | 33% · 0.8/m · 19s | 50% · 1.5/m · 16s | 100% · 11/m · 3s | 100% · 12.1/m · 3s | 100% · 11.7/m · 2s | 100% · 8.6/m · 4s | 100% · 9.9/m · 5s | 100% · 6.7/m · 5s | 100% · 8/m · 5s | 100% · 5.3/m · 13s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 421 dmg, 2.1 kills | 424 dmg, 1.3 kills | 605 dmg, 0.5 s control, 1.2 kills |
| Brace | 73 dmg, 20 block, 0.6 s control, 0.4 kills | 266 dmg, 151 block, 14.3 s control, 1.4 kills | 446 dmg, 147 block, 75.1 s control, 1.4 kills |
| Shield Wall | 44 block | 179 block | 217 block |
| Impale | 74 dmg, 7.9 s control, 0.3 kills | 101 dmg, 45 via others, 11 s control, 0.4 kills | 229 dmg, 98 via others, 50.2 s control, 0.4 kills |
| Return Thrust (trait) | 44 dmg, 178 via others, 0.4 kills | 45 dmg, 158 via others, 0.1 kills | 35 dmg, 125 via others |
| other | 1 block | 1 block | 1 block |
| chill (status) | - | - | - |
| armour | 408 block | 690 block | 874 block |

- Tier I: applied stagger 183; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 14; all foe states (any cause): rooted 8, radiant 1, stunned 1. Its own buffs and states (s a minute): shieldWallCover 4, shieldWall 4, brace 4. Under foes' statuses and states: stagger 15, chill 4, burn 4, rooted 4, stunned 2, wet 1, poison 1, knockedOut 1.
- Tier II: applied stagger 953; bursts stagger 2.9; status damage -. Foe-seconds a minute traced to it: stagger 46, impaled 12, knockedOut 7; all foe states (any cause): rooted 12, stunned 10, knockedOut 8, radiant 1. Its own buffs and states (s a minute): brace 30, shieldWallCover 9, shieldWall 8. Under foes' statuses and states: stagger 23, burn 7, stunned 4, rooted 4, knockedOut 2, wet 1, poison 1, radiance 1.
- Tier III: applied stagger 2,543; bursts stagger 23.2; status damage -. Foe-seconds a minute traced to it: knockedOut 45, impaled 21, stagger 1; all foe states (any cause): stunned 48, knockedOut 47, rooted 31, radiant 2. Its own buffs and states (s a minute): brace 33, shieldWallCover 13, shieldWall 12. Under foes' statuses and states: stagger 14, burn 5, rooted 3, stunned 2, radiance 1, chill 1, wet 1, poison 1.

### Bearskin (bearskin): melee

Trait: Thick Hide: Statuses build half as fast on him.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Maul** (maul, cd 9.8s) | I | 100% · 7/m · 2s | 100% · 3.3/m · 7s | 100% · 4.3/m · 7s | 100% · 6.5/m · 2s | 100% · 6.6/m · 3s | 100% · 6.5/m · 3s | 100% · 6.8/m · 4s | 100% · 6.9/m · 4s | 100% · 6.4/m · 4s | 100% · 4/m · 4s | 100% · 5.9/m · 8s |
|  | II | 100% · 11.8/m · 3s | 100% · 5/m · 6s | 100% · 4.4/m · 7s | 100% · 13.1/m · 2s | 100% · 11.5/m · 3s | 100% · 11.3/m · 3s | 100% · 10.9/m · 3s | 100% · 11.1/m · 4s | 100% · 9.3/m · 4s | 100% · 6.2/m · 3s | 100% · 7.5/m · 11s |
|  | III | 100% · 15.3/m · 2s | 100% · 3.6/m · 6s | 100% · 4.9/m · 6s | 100% · 14.4/m · 2s | 100% · 13.4/m · 3s | 100% · 13.6/m · 3s | 100% · 11.4/m · 3s | 100% · 12.9/m · 3s | 100% · 10.1/m · 3s | 100% · 3.4/m · 5s | 100% · 9.3/m · 6s |
| **Hibernate** (hibernate, cd 22s) | I | 100% · 2.7/m · 12s | 100% · 3/m · 12s | 100% · 2.9/m · 10s | 100% · 2/m · 25s | 100% · 2.5/m · 18s | 100% · 3.2/m · 11s | 100% · 2.1/m · 16s | **8%** | **8%** | 100% · 1.6/m · 11s | **0%** |
|  | II | 100% · 1.9/m · 25s | 100% · 2.4/m · 17s | 92% · 2.1/m · 17s | **0%** | 75% · 1.2/m · 31s | 83% · 1.4/m · 25s | **8%** | **0%** | 17% · 0.2/m · 34s | 100% · 2.1/m · 10s | **0%** |
|  | III | 25% · 1/m · 15s | 92% · 3.6/m · 10s | 67% · 2.9/m · 12s | **0%** | 17% · 0.5/m · 18s | 33% · 0.9/m · 18s | 25% · 0.8/m · 17s | **0%** | **8%** | 100% · 1.8/m · 6s | **0%** |
| **Bear Claws** (bearRoar, cd 15.9s) | I | 100% · 5.4/m · 2s | 100% · 4.5/m · 3s | 100% · 5.4/m · 3s | 100% · 4.3/m · 2s | 100% · 4.7/m · 2s | 100% · 4.7/m · 2s | 100% · 4.7/m · 3s | 100% · 4.9/m · 3s | 100% · 4.9/m · 3s | 100% · 3.3/m · 3s | 100% · 5.7/m · 4s |
|  | II | 100% · 8.4/m · 2s | 100% · 6.8/m · 3s | 100% · 6.9/m · 3s | 100% · 8.3/m · 3s | 100% · 8/m · 2s | 100% · 8.2/m · 2s | 100% · 8.3/m · 2s | 100% · 8/m · 3s | 100% · 8/m · 2s | 100% · 4.2/m · 3s | 100% · 8.9/m · 4s |
|  | III | 100% · 9.6/m · 2s | 100% · 7.4/m · 3s | 100% · 8.3/m · 3s | 100% · 10.4/m · 3s | 100% · 10.1/m · 2s | 100% · 9.1/m · 2s | 100% · 9.1/m · 2s | 100% · 9.6/m · 3s | 100% · 9.3/m · 2s | 100% · 3.1/m · 3s | 100% · 10.2/m · 3s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 541 dmg, 3 kills | 874 dmg, 0.2 s control, 3.7 kills | 1,373 dmg, 3.1 kills |
| Maul | 216 dmg, 4.4 s control, 1.2 kills | 404 dmg, 11.4 s control, 1.5 kills | 988 dmg, 11.3 s control, 2.3 kills |
| Hibernate | 237 heal | 305 heal | 23 dmg, 302 heal, 0.1 kills |
| Bear Claws | 161 dmg, 0.7 kills | 313 dmg, 0.9 kills | 1,232 dmg, 2.7 kills |
| other | - | 3 block | 4 block |
| bleed (status) | - | - | 148 dmg, 3.7 s control |
| chill (status) | - | 1 dmg | 2 dmg |
| armour | 179 block | 798 block | 1,274 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): stunned 5, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: asleep 9, stagger 6, burn 4, rooted 3, chill 2, wet 1, poison 1, stunned 1.
- Tier II: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): stunned 15, radiant 1, knockedOut 1. Its own buffs and states (s a minute): hibernate 5. Under foes' statuses and states: burn 10, stagger 8, asleep 5, rooted 2, stunned 2, poison 1, wet 1.
- Tier III: applied bleed 228, stagger 198; bursts bleed 0.8, stagger 0.5; status damage bleed 142. Foe-seconds a minute traced to it: bleed 14, stagger 9, knockedOut 1; all foe states (any cause): stunned 16, knockedOut 3, radiant 3. Its own buffs and states (s a minute): hibernate 4. Under foes' statuses and states: burn 9, stagger 6, asleep 4, rooted 3, chill 2, stunned 2, poison 1, wet 1.

### Warhelm (warhelm): melee

Trait: Iron Will: Below 30% health he can't be stunned or staggered and hits 25% harder.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Thunder Blow** (thunderBlow, cd 11s) | I | 100% · 9.4/m · 3s | 75% · 3.4/m · 5s | 83% · 6.2/m · 6s | 100% · 6.5/m · 2s | 100% · 7.1/m · 2s | 100% · 6.9/m · 3s | 100% · 6.4/m · 4s | 100% · 5.8/m · 4s | 100% · 5/m · 5s | 100% · 5.1/m · 4s | 100% · 5.4/m · 11s |
|  | II | 100% · 12.2/m · 3s | 100% · 7.3/m · 6s | 100% · 8.7/m · 5s | 100% · 11/m · 2s | 100% · 11.8/m · 2s | 100% · 11.5/m · 2s | 100% · 9.5/m · 4s | 100% · 9.4/m · 3s | 100% · 8.3/m · 4s | 100% · 8.4/m · 4s | 100% · 6.7/m · 8s |
|  | III | 100% · 13.8/m · 3s | 100% · 7.5/m · 5s | 100% · 10.4/m · 4s | 100% · 14/m · 2s | 100% · 13.3/m · 2s | 100% · 12.6/m · 3s | 100% · 9.4/m · 5s | 100% · 11.2/m · 4s | 100% · 9.3/m · 4s | 100% · 9.3/m · 4s | 100% · 8.5/m · 8s |
| **Storm Born** (warHorn, cd 19.5s) | I | 100% · 4.9/m · 3s | 83% · 3.8/m · 5s | 100% · 7.4/m · 6s | 100% · 4.3/m · 3s | 100% · 4.7/m · 3s | 100% · 4.8/m · 2s | 100% · 4.5/m · 2s | 100% · 4.9/m · 2s | 100% · 3.9/m · 2s | 100% · 3.4/m · 3s | 100% · 4.1/m · 6s |
|  | II | 100% · 6.5/m · 3s | 100% · 4.7/m · 7s | 100% · 4.5/m · 6s | 100% · 5.5/m · 3s | 100% · 6/m · 3s | 100% · 6.9/m · 2s | 100% · 7.4/m · 2s | 100% · 5.9/m · 2s | 100% · 5.1/m · 3s | 100% · 5.6/m · 3s | 100% · 5/m · 10s |
|  | III | 100% · 5.9/m · 3s | 92% · 4.6/m · 5s | 100% · 7/m · 5s | 100% · 7.2/m · 3s | 100% · 7.1/m · 3s | 100% · 7.1/m · 2s | 100% · 7.2/m · 3s | 100% · 6.3/m · 3s | 100% · 5.4/m · 3s | 100% · 5.2/m · 3s | 100% · 6.3/m · 5s |
| **Skull Splitter** (skullSplitter, cd 12.2s) | I | 100% · 5.3/m · 3s | 100% · 6.8/m · 3s | 100% · 7.4/m · 3s | 100% · 6.1/m · 3s | 100% · 4.9/m · 3s | 100% · 4.8/m · 8s | 100% · 5.2/m · 3s | 100% · 5.6/m · 8s | 100% · 4.8/m · 3s | 100% · 4.9/m · 3s | 100% · 6.6/m · 3s |
|  | II | 100% · 5.2/m · 3s | 100% · 6.8/m · 3s | 100% · 5.3/m · 3s | 100% · 5.8/m · 3s | 100% · 5/m · 3s | 100% · 3.3/m · 20s | 83% · 3.4/m · 2s | 100% · 4.7/m · 11s | 100% · 5.1/m · 2s | 100% · 4.1/m · 3s | 100% · 7.8/m · 3s |
|  | III | 100% · 5/m · 3s | 100% · 8.3/m · 3s | 100% · 7/m · 3s | 100% · 6/m · 3s | 100% · 5.6/m · 3s | 100% · 4/m · 20s | 100% · 5.5/m · 3s | 92% · 4.9/m · 11s | 100% · 5.8/m · 2s | 100% · 4.6/m · 3s | 100% · 7.2/m · 4s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 658 dmg, 0.9 s control, 3.9 kills | 1,006 dmg, 3.7 s control, 3.6 kills | 1,828 dmg, 5.7 s control, 3.9 kills |
| Thunder Blow | 192 dmg, 0.6 s control, 1.1 kills | 270 dmg, 35.5 s control, 0.8 kills | 744 dmg, 1 block, 31.5 s control, 1.8 kills |
| Storm Born | 414 dmg, 3 block, 2.6 s control, 2.3 kills | 796 dmg, 2 block, 9.4 s control, 2.5 kills | 1,164 dmg, 2 block, 10.4 s control, 2.4 kills |
| Skull Splitter | 327 dmg, 50 block, 0.2 s control, 1.8 kills | 285 dmg, 51 block, 2.1 s control, 1.1 kills | 571 dmg, 130 block, 25.8 s control, 1.1 kills |
| Iron Will (trait) | 20 via others | 5 via others | 16 via others |
| other | 1 block | 2 block | 7 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | 218 block | 554 block | 710 block |

- Tier I: applied shock 1,093, stagger 337; bursts shock 3; status damage -. Foe-seconds a minute traced to it: shock 39, stagger 18, overloaded 14; all foe states (any cause): overloaded 14, stunned 12, radiant 1. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 10, rooted 4, burn 4, chill 3, wet 2, poison 1, stunned 1.
- Tier II: applied shock 4,249, stagger 1,457; bursts shock 27.1, stagger 9; status damage -. Foe-seconds a minute traced to it: shock 68, overloaded 32, stagger 21, knockedOut 18; all foe states (any cause): stunned 44, overloaded 32, knockedOut 19, radiant 2. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 11, burn 6, rooted 3, stunned 1, poison 1.
- Tier III: applied shock 5,928, stagger 2,172; bursts shock 40.8, stagger 16; status damage -. Foe-seconds a minute traced to it: shock 67, overloaded 38, knockedOut 26, stagger 4; all foe states (any cause): stunned 54, overloaded 38, knockedOut 29, radiant 3. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 5, burn 4, rooted 3, chill 1, radiance 1, poison 1, stunned 1.

### Bandit (rogueBandit): skirmish

Trait: Snatch: Every fourth blow tears the enemy's weapon out of its hand and flings it away: it can't attack until it walks over and picks it up.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Bolas** (smokeBomb, cd 13.4s) | I | 100% · 5.7/m · 3s | 100% · 7.5/m · 2s | 100% · 9/m · 3s | 100% · 5.5/m · 2s | 100% · 5.5/m · 3s | 100% · 5.3/m · 3s | 100% · 5.3/m · 3s | 100% · 6.4/m · 3s | 100% · 5.5/m · 3s | 100% · 3.1/m · 2s | 100% · 6.9/m · 1s |
|  | II | 100% · 9.7/m · 3s | 100% · 10.2/m · 2s | 100% · 11.8/m · 3s | 100% · 9.7/m · 2s | 100% · 9.8/m · 2s | 100% · 9.7/m · 3s | 100% · 9.3/m · 3s | 100% · 10.3/m · 3s | 100% · 9.2/m · 3s | 100% · 8.8/m · 3s | 100% · 11.5/m · 2s |
|  | III | 100% · 10.1/m · 3s | 100% · 13.1/m · 2s | 100% · 13.6/m · 3s | 100% · 11.3/m · 3s | 100% · 10.8/m · 3s | 100% · 10/m · 4s | 100% · 10.3/m · 3s | 100% · 10.8/m · 3s | 100% · 10.3/m · 2s | 100% · 6.2/m · 3s | 100% · 12.1/m · 2s |
| **Dirty Trick** (pickpocket, cd 11s) | I | 100% · 7.3/m · 2s | 100% · 6.8/m · 3s | 100% · 9/m · 3s | 100% · 6.6/m · 3s | 100% · 6.7/m · 3s | 100% · 6.8/m · 2s | 100% · 6.7/m · 2s | 100% · 6.9/m · 3s | 100% · 6.2/m · 2s | 100% · 3.2/m · 3s | 100% · 6.5/m · 4s |
|  | II | 100% · 12/m · 2s | 100% · 11.6/m · 3s | 100% · 10.1/m · 4s | 100% · 10.7/m · 3s | 100% · 11.8/m · 3s | 100% · 11.5/m · 2s | 100% · 11/m · 2s | 100% · 10.6/m · 3s | 100% · 9.9/m · 2s | 100% · 9.2/m · 4s | 100% · 8.6/m · 4s |
|  | III | 100% · 13.1/m · 2s | 100% · 13.1/m · 3s | 100% · 14.8/m · 3s | 100% · 12.5/m · 3s | 100% · 12.9/m · 3s | 100% · 12.4/m · 2s | 100% · 11.5/m · 2s | 100% · 13.2/m · 3s | 100% · 11.4/m · 2s | 100% · 6.8/m · 3s | 100% · 9.8/m · 3s |
| **Stick 'Em Up** (lowBlow, cd 14.6s) | I | 100% · 5.7/m · 2s | 100% · 4.9/m · 3s | 100% · 9/m · 3s | 100% · 5/m · 3s | 100% · 5.5/m · 2s | 100% · 5.3/m · 2s | 100% · 5.1/m · 3s | 100% · 4.9/m · 3s | 100% · 5.1/m · 3s | 100% · 2.8/m · 4s | 100% · 6.1/m · 3s |
|  | II | 100% · 8.9/m · 3s | 100% · 9.3/m · 3s | 100% · 9.5/m · 3s | 100% · 9.5/m · 3s | 100% · 9.5/m · 3s | 100% · 9.5/m · 2s | 100% · 8.4/m · 4s | 100% · 8.2/m · 3s | 100% · 8.2/m · 4s | 100% · 7.6/m · 4s | 100% · 9/m · 2s |
|  | III | 100% · 10.9/m · 3s | 100% · 12/m · 3s | 100% · 13.6/m · 3s | 100% · 10.9/m · 3s | 100% · 11.2/m · 3s | 100% · 10.5/m · 2s | 100% · 9.9/m · 3s | 100% · 10/m · 4s | 100% · 9.1/m · 3s | 100% · 5.3/m · 3s | 100% · 10.4/m · 3s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 605 dmg, 3.4 kills | 922 dmg, 4.3 kills | 1,750 dmg, 5.4 kills |
| Bolas | 53 dmg, 14.9 s control, 0.2 kills | 131 dmg, 31.2 s control, 0.4 kills | 198 dmg, 41.4 s control, 0.3 kills |
| Dirty Trick | 343 dmg, 1.4 kills | 552 dmg, 2.4 kills | 1,336 dmg, 32.7 s control, 4.2 kills |
| Stick 'Em Up | 70 via others | 257 via others, 0.7 s control | 619 via others, 0.6 s control |
| other | 1 block | - | - |
| bleed (status) | - | 1,161 dmg | 1,924 dmg |
| chill (status) | - | 1 dmg | - |
| armour | - | 361 block | 460 block |
| dodge | 75 block | 100 block | 163 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: bolas 15, held 11, handsUp 11, snatched 10; all foe states (any cause): stunned 7, knockedOut 6, radiant 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 8, rooted 2, burn 2, wet 1, chill 1, radiance 1, poison 1, stunned 1.
- Tier II: applied bleed 1,062; bursts bleed 9; status damage bleed 1,075. Foe-seconds a minute traced to it: bolas 37, held 26, handsUp 25, snatched 13, bleed 2; all foe states (any cause): stunned 18, knockedOut 17, radiant 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 11, burn 4, rooted 2, radiance 1, stunned 1, poison 1, wet 1.
- Tier III: applied bleed 1,305, stagger 1,034; bursts stagger 9.2, bleed 9; status damage bleed 1,607. Foe-seconds a minute traced to it: bolas 42, held 35, handsUp 34, snatched 25, knockedOut 17, bleed 2, stagger 1; all foe states (any cause): stunned 36, knockedOut 34, radiant 3. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, burn 2, rooted 1, radiance 1, stunned 1.

### Shade (shade): skirmish

Trait: Fade: After 3s without attacking or being hurt she becomes a shadow: no enemy can pick her out until she strikes or uses an ability.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Shadow Walk** (shadowWalk, cd 13.4s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 10.3/m · 3s | 100% · 9.4/m · 3s | 42% · 1.8/m · 3s | 100% · 3.9/m · 3s | 100% · 3.1/m · 5s | 100% · 3.7/m · 8s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 16.3/m · 3s | 100% · 13.1/m · 3s | 42% · 2.5/m · 2s | 100% · 4.5/m · 3s | 100% · 4.8/m · 5s | 100% · 4.7/m · 12s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 67% · 17.6/m · 2s | 25% · 6.2/m · 3s | 25% · 1.6/m · 2s | 100% · 6.1/m · 3s | 100% · 5.8/m · 3s | 100% · 6.2/m · 16s |
| **Blackout** (blackout, cd 18.3s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 67% · 4.6/m · 3s | 83% · 4.7/m · 2s | 58% · 2.5/m · 4s | 100% · 3.3/m · 3s | 100% · 2.6/m · 3s | 100% · 3.2/m · 13s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 50% · 7.1/m · 2s | 83% · 7.5/m · 2s | 17% · 1/m · 6s | 100% · 4/m · 2s | 100% · 4.5/m · 3s | 100% · 3.4/m · 19s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 50% · 13.2/m · 2s | 92% · 22.8/m · 2s | 42% · 2.7/m · 3s | 100% · 5.4/m · 2s | 100% · 4.9/m · 4s | 100% · 3.8/m · 10s |
| **Shadow Clones** (deathMark, cd 17.1s) | I | 100% · 5.7/m · 2s | 100% · 6.2/m · 3s | 100% · 5.4/m · 3s | 100% · 4.6/m · 3s | 100% · 4.6/m · 2s | 50% · 3.4/m · 3s | 67% · 3.8/m · 2s | 67% · 5.8/m · 3s | 100% · 5.1/m · 2s | 100% · 3.8/m · 3s | 100% · 6.4/m · 1s |
|  | II | 100% · 8.1/m · 2s | 100% · 8/m · 3s | 100% · 8.4/m · 3s | 100% · 7.5/m · 3s | 100% · 8.4/m · 2s | 42% · 6.1/m · 2s | 58% · 5.6/m · 2s | 58% · 7.4/m · 3s | 100% · 7.8/m · 2s | 100% · 7.8/m · 3s | 100% · 10.7/m · 2s |
|  | III | 100% · 9.2/m · 2s | 100% · 8.6/m · 3s | 100% · 9.3/m · 3s | 100% · 8.3/m · 2s | 100% · 9.2/m · 2s | 17% · 4.4/m · 2s | 17% · 4.1/m · 2s | 75% · 8.1/m · 2s | 100% · 7.8/m · 3s | 100% · 8.8/m · 3s | 100% · 9.9/m · 1s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 682 dmg, 3.1 kills | 944 dmg, 2.7 kills | 1,440 dmg, 0.2 s control, 1.9 kills |
| Shadow Walk | 64 dmg, 1 block, 0.3 kills | 115 dmg, 8 block, 0.4 kills | 393 dmg, 5 block, 0.6 kills |
| Blackout | 4 dmg, 59 via others, 0.3 s control | 4 dmg, 168 via others, 0.7 s control | 5 dmg, 244 via others, 1.6 s control |
| Shadow Clones | 391 dmg, 2.6 kills | 796 dmg, 3.9 kills | 1,402 dmg, 0.2 s control, 4.7 kills |
| other | 4 block | - | - |
| pet | - | - | 1 dmg |
| chill (status) | - | 2 dmg | 3 dmg |
| armour | - | 495 block | 877 block |
| dodge | 112 block | 197 block | 287 block |

- Tier I: applied radiance 1; bursts -; status damage -. Foe-seconds a minute traced to it: weakened 16, blackout 16; all foe states (any cause): radiant 2. Its own buffs and states (s a minute): ethereal 1, untouchable 1. Under foes' statuses and states: stagger 10, burn 3, rooted 2, chill 2, radiance 1, poison 1, stunned 1, wet 1.
- Tier II: applied curse 90; bursts -; status damage -. Foe-seconds a minute traced to it: weakened 21, blackout 21, curse 14; all foe states (any cause): stunned 2, radiant 2, untouchable 1, knockedOut 1. Its own buffs and states (s a minute): ethereal 1, untouchable 1. Under foes' statuses and states: stagger 15, burn 8, stunned 4, radiance 2, knockedOut 1, rooted 1, chill 1, poison 1.
- Tier III: applied curse 269; bursts -; status damage -. Foe-seconds a minute traced to it: curse 24, weakened 21, blackout 21, hexed 1; all foe states (any cause): stunned 3, radiant 3, knockedOut 1, hexed 1, untouchable 1. Its own buffs and states (s a minute): ethereal 11, shadowForm 10, untouchable 2. Under foes' statuses and states: stagger 15, burn 8, stunned 4, chill 2, radiance 1, knockedOut 1, rooted 1, wet 1.

### Haymaker (haymaker): melee

Trait: Hard Work: Each enemy he finishes heals him 8%.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Toss** (toss, cd 11s) | I | 100% · 7.3/m · 3s | 92% · 3.3/m · 7s | 100% · 5.5/m · 7s | 100% · 6.6/m · 2s | 100% · 6.7/m · 2s | 100% · 6.1/m · 4s | 100% · 4.8/m · 8s | 100% · 5.7/m · 6s | 100% · 4.5/m · 8s | 100% · 3.1/m · 6s | 100% · 4.4/m · 9s |
|  | II | 100% · 11.6/m · 3s | 100% · 5.1/m · 6s | 92% · 4.8/m · 8s | 100% · 8.7/m · 2s | 100% · 10/m · 2s | 100% · 9.2/m · 4s | 100% · 4.9/m · 15s | 100% · 6.8/m · 6s | 100% · 5.3/m · 7s | 100% · 6.2/m · 5s | 100% · 2.7/m · 14s |
|  | III | 100% · 9.2/m · 3s | 100% · 3.9/m · 6s | 58% · 3.5/m · 6s | 100% · 8.8/m · 2s | 100% · 7.5/m · 2s | 100% · 7.1/m · 5s | 100% · 4/m · 15s | 92% · 5.1/m · 3s | 100% · 3.5/m · 12s | 100% · 3.9/m · 11s | 100% · 1.9/m · 17s |
| **Pitch Hay** (pitchHay, cd 13.4s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 75% · 2.7/m · 2s | 100% · 4.5/m · 2s | 50% · 1/m · 2s | 92% · 1.5/m · 8s | 100% · 1.7/m · 5s | 88% · 2.3/m · 13s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 75% · 2/m · 2s | 92% · 4.7/m · 2s | 50% · 1/m · 2s | 100% · 1.9/m · 3s | 100% · 2.5/m · 3s | 100% · 1.7/m · 33s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 33% · 0.9/m · 7s | 83% · 4.1/m · 3s | 50% · 2.2/m · 2s | 75% · 1.5/m · 3s | 75% · 1.4/m · 9s | 75% · 1/m · 46s |
| **Hay Bale** (forkCharge, cd 15.9s) | I | 100% · 7.3/m · 3s | 100% · 5/m · 3s | 100% · 4.5/m · 3s | 100% · 4.7/m · 3s | 100% · 5.2/m · 3s | 100% · 5.2/m · 3s | 100% · 5.6/m · 2s | 100% · 5.1/m · 3s | 100% · 4.8/m · 3s | 100% · 2.8/m · 3s | 100% · 5.7/m · 2s |
|  | II | 100% · 8.5/m · 3s | 100% · 8.6/m · 3s | 100% · 8.7/m · 3s | 100% · 8.1/m · 3s | 100% · 8.4/m · 3s | 100% · 7.5/m · 2s | 100% · 8.5/m · 3s | 100% · 8.2/m · 3s | 100% · 7.8/m · 3s | 100% · 6.2/m · 3s | 100% · 8.7/m · 3s |
|  | III | 100% · 8.9/m · 3s | 100% · 8.8/m · 3s | 100% · 9.9/m · 3s | 100% · 9.2/m · 3s | 100% · 7.8/m · 3s | 100% · 8.5/m · 2s | 100% · 8.8/m · 2s | 100% · 8.2/m · 3s | 100% · 8/m · 2s | 100% · 7.5/m · 3s | 100% · 9.5/m · 2s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 410 dmg, 2.1 kills | 470 dmg, 1.1 kills | 533 dmg, 1.1 kills |
| Toss | 142 dmg, 2.3 s control, 0.4 kills | 223 dmg, 20.5 s control, 0.5 kills | 416 dmg, 19.6 s control, 0.6 kills |
| Hay Bale | 365 dmg, 1.7 kills | 635 dmg, 2.8 kills | 1,981 dmg, 77.1 s control, 3.6 kills |
| Hard Work (trait) | 106 heal | 115 heal | 193 heal |
| other | - | 4 block | 7 block |
| chill (status) | - | - | - |
| armour | - | 659 block | 728 block |

- Tier I: applied stagger 101; bursts -; status damage -. Foe-seconds a minute traced to it: hay 18, stagger 7, tossed 2; all foe states (any cause): stunned 2, radiant 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 11, burn 4, rooted 3, chill 3, wet 1, stunned 1, poison 1.
- Tier II: applied stagger 675; bursts stagger 4.4; status damage -. Foe-seconds a minute traced to it: hay 26, stagger 16, knockedOut 10, tossed 3; all foe states (any cause): stunned 15, knockedOut 11, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 14, burn 7, stunned 2, rooted 2, wet 1, poison 1, chill 1, knockedOut 1.
- Tier III: applied stagger 5,234; bursts stagger 51.4; status damage -. Foe-seconds a minute traced to it: knockedOut 51, hay 23, tossed 2, stagger 1; all foe states (any cause): stunned 55, knockedOut 53, radiant 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 6, stagger 6, chill 1, rooted 1, stunned 1, radiance 1.

### Digger (digger): melee

Trait: Rub Some Dirt In It: Every ability he uses rubs dirt into him (Dirty): it soaks up the next blow, and until then fire and poison can't take on him, but he swings slower.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Dirt Fling** (dirtFling, cd 11s) | I | 42% · 10/m · 2s | **0%** | 33% · 7.4/m · 2s | 50% · 11.8/m · 1s | 100% · 8.2/m · 2s | 92% · 7.3/m · 3s | 42% · 8.7/m · 2s | 83% · 13.5/m · 2s | 100% · 6.2/m · 3s | 100% · 4.4/m · 3s | 100% · 7.6/m · 3s |
|  | II | 42% · 10/m · 2s | 17% · 3.7/m · 3s | **0%** | 50% · 10.9/m · 1s | 100% · 11.6/m · 2s | 92% · 11/m · 2s | 50% · 10.1/m · 3s | 75% · 11.6/m · 2s | 100% · 10/m · 4s | 100% · 8.7/m · 3s | 100% · 9.2/m · 3s |
|  | III | 58% · 13.6/m · 2s | 25% · 6.3/m · 2s | **0%** | 67% · 14.8/m · 1s | 92% · 13.1/m · 2s | 100% · 12.7/m · 2s | 42% · 9.5/m · 3s | 75% · 12.9/m · 2s | 100% · 10.3/m · 3s | 100% · 10.7/m · 3s | 100% · 10/m · 4s |
| **Burrow** (burrow, cd 15.9s) | I | **0%** | 100% · 25.4/m · 2s | 92% · 20.3/m · 3s | **0%** | 100% · 6.1/m · 7s | 25% · 1.2/m · 2s | 100% · 20.9/m · 2s | 100% · 16.2/m · 4s | 100% · 4.4/m · 3s | 100% · 3.3/m · 3s | 100% · 6.2/m · 1s |
|  | II | **0%** | 83% · 18.3/m · 3s | 100% · 25.4/m · 3s | **0%** | 100% · 6.6/m · 7s | 42% · 0.9/m · 13s | 100% · 20.3/m · 3s | 100% · 15.4/m · 4s | 100% · 7.5/m · 3s | 100% · 6.3/m · 3s | 100% · 10.1/m · 1s |
|  | III | **8%** | 75% · 18.9/m · 2s | 100% · 25.1/m · 3s | **0%** | 83% · 3.7/m · 12s | 42% · 1.4/m · 3s | 100% · 22.9/m · 3s | 83% · 9.9/m · 4s | 100% · 8.4/m · 3s | 100% · 7.9/m · 3s | 100% · 10.2/m · 1s |
| **Bury** (spadeBat, cd 12.2s) | I | 100% · 24.1/m · 3s | **0%** | **8%** | 100% · 23.5/m · 2s | 100% · 7.6/m · 3s | 83% · 6.9/m · 2s | 50% · 10.5/m · 2s | 58% · 9.4/m · 3s | 100% · 5.7/m · 3s | 100% · 4.3/m · 3s | 100% · 5.9/m · 4s |
|  | II | 100% · 23.9/m · 2s | 17% · 3.7/m · 3s | **0%** | 100% · 21.9/m · 3s | 100% · 10/m · 3s | 92% · 10.3/m · 2s | 75% · 15.2/m · 2s | 58% · 9/m · 3s | 100% · 8.7/m · 3s | 100% · 8/m · 3s | 100% · 8.5/m · 6s |
|  | III | 92% · 21.3/m · 3s | 25% · 6.3/m · 3s | **0%** | 100% · 22.2/m · 3s | 92% · 11.6/m · 3s | 83% · 11/m · 2s | 67% · 15.2/m · 2s | 67% · 11.9/m · 3s | 100% · 9.2/m · 4s | 100% · 10.2/m · 3s | 100% · 8/m · 6s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 690 dmg, 0.1 s control, 1.5 kills | 951 dmg, 0.2 s control, 1.5 kills | 1,867 dmg, 0.1 s control, 2.2 kills |
| Dirt Fling | 124 dmg, 65 block, 0.3 kills | 165 dmg, 75 block, 3.8 s control, 0.3 kills | 648 dmg, 25 block, 69.6 s control, 0.8 kills |
| Burrow | 67 dmg, 1 block, 0.6 kills | 122 dmg, 2 block, 3.2 s control, 0.9 kills | 388 dmg, 2 block, 20.9 s control, 1.2 kills |
| Bury | 351 dmg, 16.6 s control, 0.5 kills | 418 dmg, 24.6 s control, 0.6 kills | 1,117 dmg, 20.9 s control, 0.8 kills |
| Rub Some Dirt In It (trait) | 133 block | 269 block | 257 block |
| other | - | 1 block | - |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 422 block | 649 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: dirt 15, buried 2; all foe states (any cause): stunned 7, radiant 3, ethereal 2, hidden 2. Its own buffs and states (s a minute): untouchable 2, ethereal 2, hidden 2. Under foes' statuses and states: stagger 7, rooted 6, burn 1, poison 1, wet 1, stunned 1.
- Tier II: applied stagger 1,271; bursts stagger 3.6; status damage -. Foe-seconds a minute traced to it: stagger 54, dirt 24, knockedOut 8, buried 4; all foe states (any cause): stunned 25, knockedOut 12, radiant 4, ethereal 4, hidden 4. Its own buffs and states (s a minute): untouchable 3, ethereal 3, hidden 3. Under foes' statuses and states: stagger 5, rooted 4, wet 1, burn 1, poison 1, stunned 1, radiance 1.
- Tier III: applied stagger 5,208; bursts stagger 47.6; status damage -. Foe-seconds a minute traced to it: knockedOut 50, dirt 30, buried 3, stagger 3; all foe states (any cause): stunned 62, knockedOut 54, radiant 4, ethereal 3, hidden 3. Its own buffs and states (s a minute): untouchable 6, ethereal 5, hidden 5. Under foes' statuses and states: stagger 2, rooted 2, burn 1, wet 1, radiance 1.

### Grandpa Sickle (grandpa): support

Trait: Seen It All: Allies near him shake off stagger twice as fast.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Bread Toss** (breadToss, cd 9.8s) | I | 100% · 5.7/m · 7s | 100% · 6.5/m · 4s | 100% · 5.7/m · 4s | 100% · 6.2/m · 10s | 100% · 5.8/m · 9s | 100% · 5.2/m · 6s | 100% · 5.5/m · 5s | 100% · 5.4/m · 10s | 100% · 5.6/m · 9s | 100% · 2.7/m · 6s | 100% · 1.3/m · 79s |
|  | II | 100% · 10.8/m · 11s | 100% · 11.5/m · 8s | 100% · 10.8/m · 7s | 100% · 6/m · 18s | 100% · 11.2/m · 10s | 100% · 9.3/m · 10s | 100% · 7.8/m · 10s | 100% · 3.5/m · 20s | 100% · 5.1/m · 14s | 100% · 5.3/m · 7s | 13% · 0.1/m · 66s |
|  | III | 100% · 12.2/m · 10s | 100% · 13.5/m · 7s | 100% · 14.1/m · 6s | 100% · 5/m · 14s | 100% · 8.2/m · 8s | 100% · 7.3/m · 10s | 83% · 2.4/m · 7s | 100% · 2.3/m · 17s | 100% · 4.2/m · 12s | 100% · 4.4/m · 5s | **0%** |
| **Harvest** (harvest, cd 12.2s) | I | 100% · 5.7/m · 2s | 17% · 0.5/m · 19s | 58% · 3.3/m · 8s | 100% · 6.2/m · 3s | 100% · 6.2/m · 3s | 100% · 6.3/m · 2s | 100% · 5.9/m · 2s | 100% · 5.4/m · 3s | 100% · 5/m · 2s | 100% · 3.1/m · 3s | 100% · 6.5/m · 2s |
|  | II | 100% · 10.9/m · 2s | 100% · 3.5/m · 7s | 83% · 1.8/m · 20s | 100% · 10.6/m · 3s | 100% · 10.6/m · 3s | 100% · 10.1/m · 2s | 100% · 11.2/m · 2s | 100% · 9.6/m · 3s | 100% · 9.5/m · 2s | 100% · 5.9/m · 3s | 100% · 10.1/m · 3s |
|  | III | 100% · 11.7/m · 2s | 100% · 3.2/m · 13s | 100% · 3/m · 16s | 100% · 11.4/m · 3s | 100% · 11.3/m · 3s | 100% · 11/m · 2s | 100% · 12.2/m · 2s | 100% · 10.5/m · 3s | 100% · 10.4/m · 2s | 100% · 4.6/m · 3s | 100% · 11.4/m · 3s |
| **Old Tales** (oldTales, cd 22s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 1.8/m · 4s | 33% · 0.6/m · 6s | 100% · 3.9/m · 4s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 50% · 0.4/m · 21s | 33% · 0.5/m · 14s | 25% · 0.2/m · 76s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 33% · 0.4/m · 12s | **8%** | **0%** |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 347 dmg, 0.1 s control, 1 kills | 581 dmg, 2.4 kills | 982 dmg, 16 heal, 2.8 kills |
| Bread Toss | 201 heal | 712 heal | 1,188 heal |
| Harvest | 102 dmg, 2 block, 0.2 kills | 204 dmg, 5 block, 4.7 s control, 0.7 kills | 418 dmg, 307 heal, 9 block, 5.2 s control, 1.2 kills |
| Old Tales | - | - | 2 heal |
| other | - | 4 block | 4 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 853 block | 1,520 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: hamstrung 21; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 7, rooted 4, chill 3, burn 2, stunned 1, wet 1, poison 1.
- Tier II: applied stagger 819; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 59, hamstrung 36, knockedOut 1; all foe states (any cause): stunned 5, knockedOut 2, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 11, burn 10, rooted 3, stunned 3, wet 1, poison 1, chill 1.
- Tier III: applied stagger 748; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 53, hamstrung 33, knockedOut 1; all foe states (any cause): stunned 4, knockedOut 2, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 15, stagger 9, chill 3, stunned 3, rooted 2, wet 1, poison 1.

### Alchemist (alchemist): caster

Trait: Catalyst: The statuses she causes build 30% faster.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Brew Pools** (acidFlask, cd 11s) | I | 100% · 6.1/m · 3s | 100% · 6.4/m · 3s | 100% · 6.5/m · 3s | 100% · 6.5/m · 2s | 100% · 6.2/m · 3s | 100% · 6.4/m · 3s | 100% · 6.5/m · 3s | 100% · 6.3/m · 3s | 100% · 6/m · 3s | 100% · 4.9/m · 3s | 100% · 7.1/m · 5s |
|  | II | 100% · 10.7/m · 3s | 100% · 4.9/m · 6s | 100% · 5.2/m · 7s | 100% · 10.8/m · 2s | 100% · 10.3/m · 3s | 100% · 10.3/m · 3s | 100% · 10.8/m · 3s | 100% · 9/m · 3s | 100% · 8.6/m · 3s | 100% · 8.9/m · 3s | 100% · 9.8/m · 10s |
|  | III | 100% · 11.8/m · 3s | 92% · 4.6/m · 4s | 67% · 5.1/m · 5s | 100% · 11.2/m · 3s | 100% · 10.4/m · 3s | 100% · 10.9/m · 2s | 100% · 11/m · 3s | 100% · 9.4/m · 4s | 100% · 9.6/m · 3s | 100% · 9.6/m · 3s | 100% · 10.7/m · 4s |
| **Elixir** (elixir, cd 14.6s) | I | 100% · 5.5/m · 2s | 100% · 5.1/m · 2s | 100% · 6/m · 3s | 100% · 5.1/m · 3s | 100% · 5.1/m · 3s | 100% · 5.1/m · 2s | 100% · 5.4/m · 2s | 100% · 5.4/m · 2s | 100% · 5.2/m · 2s | 100% · 3.9/m · 3s | 100% · 6.8/m · 2s |
|  | II | 100% · 9.1/m · 2s | 100% · 9.1/m · 2s | 100% · 9.1/m · 3s | 100% · 9.2/m · 3s | 100% · 9.3/m · 3s | 100% · 9.4/m · 2s | 100% · 9.3/m · 2s | 100% · 9.4/m · 3s | 100% · 9/m · 2s | 100% · 8.8/m · 3s | 100% · 12/m · 1s |
|  | III | 100% · 9.6/m · 5s | 100% · 10.4/m · 2s | 100% · 10.1/m · 3s | 100% · 9.1/m · 7s | **8%** | 100% · 10.2/m · 2s | 100% · 10.2/m · 2s | 100% · 10.1/m · 2s | 100% · 10.1/m · 2s | 100% · 9.4/m · 3s | 100% · 12.3/m · 2s |
| **Monstrosity** (bangFlask, cd 22s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 1.6/m · 3s | 100% · 2.5/m · 3s | 92% · 1.9/m · 5s | 100% · 1.9/m · 2s | 100% · 1.6/m · 3s | 100% · 3.3/m · 11s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.7/m · 3s | 100% · 6.4/m · 3s | 100% · 2.8/m · 6s | 100% · 3.1/m · 2s | 100% · 3.4/m · 3s | 100% · 4.3/m · 10s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.5/m · 3s | 100% · 6.4/m · 3s | 92% · 3.4/m · 5s | 100% · 3.9/m · 2s | 100% · 3.8/m · 3s | 100% · 5.1/m · 5s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 639 dmg, 0.2 s control, 3.7 kills | 1,019 dmg, 1.3 s control, 4.8 kills | 1,665 dmg, 3.4 s control, 5.1 kills |
| Brew Pools | 93 dmg, 7 via others, 1.3 s control, 0.4 kills | 277 dmg, 24 via others, 3.6 s control, 0.9 kills | 561 dmg, 50 via others, 5.8 s control, 1.1 kills |
| Elixir | 38 heal, 16 block, 54 via others, 0.1 s control | 202 heal, 39 block, 214 via others, 0.4 s control | 316 heal, 46 block, 404 via others, 1 s control |
| Monstrosity | 113 block, 2 via others, 0.1 s control | 365 block, 1 via others, 0.9 s control | 616 block, 8 via others, 1.5 s control |
| other | - | 1 block | 3 block |
| bleed (status) | - | - | 16 dmg, 0.5 s control, 0.1 kills |
| burn (status) | 55 dmg, 0.1 s control, 0.2 kills | 96 dmg, 0.8 s control, 0.2 kills | 145 dmg, 2.4 s control, 0.3 kills |
| chill (status) | 3 dmg | 10 dmg | 31 dmg |
| poison (status) | 51 dmg, 0.5 s control, 0.2 kills | 98 dmg, 1.6 s control, 0.2 kills | 119 dmg, 2.7 s control, 0.3 kills |
| armour | - | 217 block | 373 block |

- Tier I: applied chill 460, burn 270, poison 235, shock 89, wet 74; bursts chill 0.6; status damage poison 66, burn 60, chill 4. Foe-seconds a minute traced to it: poison 42, chill 41, burn 39, wet 11, whirled 6, shock 5, acid 3, overloaded 2; all foe states (any cause): stunned 2, overloaded 2, frozen 1, radiant 1. Its own buffs and states (s a minute): haste 11, rage 11, monster 8, warded 6, swift 6. Under foes' statuses and states: stagger 5, rooted 2, burn 2.
- Tier II: applied chill 716, burn 327, poison 297, shock 217, wet 153; bursts chill 1.3, wet 1.2; status damage poison 115, burn 110, chill 8. Foe-seconds a minute traced to it: chill 45, burn 45, poison 40, wet 18, shock 11, whirled 11, acid 5, overloaded 3; all foe states (any cause): stunned 5, overloaded 3, frozen 2, sickened 2, radiant 1, knockedOut 1, untouchable 1. Its own buffs and states (s a minute): haste 20, rage 20, warded 13, monster 13, swift 12. Under foes' statuses and states: burn 7, stagger 6, rooted 2, wet 1, stunned 1.
- Tier III: applied chill 1,049, burn 480, poison 427, shock 399, wet 391, stagger 74, confuse 69, curse 64; bursts wet 4.5, chill 2.2, shock 0.9, poison 0.7; status damage burn 160, poison 136, chill 36, bleed 17. Foe-seconds a minute traced to it: burn 50, chill 48, poison 40, wet 35, shock 18, whirled 16, bleed 9, sleepy 8; all foe states (any cause): stunned 11, overloaded 6, sickened 3, frozen 3, radiant 2, knockedOut 2, untouchable 1. Its own buffs and states (s a minute): haste 20, rage 20, monster 15, swift 10, warded 10. Under foes' statuses and states: burn 6, stagger 5, rooted 2, wet 1.

### Shaman (shaman): support

Trait: Ancestral Spirits: When an ally goes down, the spirits heal everyone else 10%.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Healing Totem** (healTotem, cd 17.1s) | I | 100% · 2.5/m · 39s | 100% · 4.3/m · 3s | 100% · 4.5/m · 4s | 100% · 3.6/m · 19s | 67% · 1.6/m · 42s | 100% · 2.6/m · 21s | 100% · 3.4/m · 12s | 100% · 2.9/m · 18s | 100% · 3.8/m · 13s | 100% · 3.9/m · 10s | 88% · 1/m · 100s |
|  | II | 100% · 5.8/m · 9s | 100% · 6.5/m · 4s | 100% · 6.7/m · 6s | 100% · 5.1/m · 14s | 58% · 1.3/m · 81s | 75% · 1/m · 88s | 17% · 0.2/m · 25s | 58% · 0.8/m · 50s | 100% · 4.8/m · 13s | 100% · 4/m · 14s | **0%** |
|  | III | 100% · 5.9/m · 8s | 100% · 7.4/m · 4s | 100% · 8/m · 4s | 100% · 5.8/m · 8s | 58% · 1.9/m · 80s | 75% · 1.4/m · 76s | **0%** | 75% · 1.5/m · 37s | 100% · 5.2/m · 10s | 100% · 4.6/m · 5s | **0%** |
| **Spirit Link** (spiritLink, cd 19.5s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.2/m · 3s | 100% · 1.6/m · 6s | 100% · 4.2/m · 5s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 92% · 2.6/m · 3s | 100% · 2/m · 7s | 100% · 7.4/m · 4s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 75% · 2.2/m · 3s | 100% · 2.6/m · 5s | 100% · 7.8/m · 2s |
| **Ancestors' Call** (rainDance, cd 24.4s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.7/m · 2s | 100% · 3.1/m · 2s | 100% · 1.9/m · 3s | 100% · 2.4/m · 2s | 100% · 2.9/m · 3s | 100% · 3.5/m · 6s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.7/m · 2s | 100% · 5.4/m · 2s | 100% · 3.5/m · 3s | 100% · 3.9/m · 2s | 100% · 4.5/m · 3s | 100% · 6.1/m · 6s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.5/m · 2s | 100% · 5.9/m · 2s | 100% · 3.4/m · 3s | 100% · 4.5/m · 2s | 100% · 4.5/m · 3s | 100% · 6.5/m · 5s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 282 dmg, 53 heal, 1.1 kills | 365 dmg, 111 heal, 1.3 kills | 639 dmg, 140 heal, 1.2 kills |
| Healing Totem | 57 block | 65 block | 8 dmg, 88 block |
| Spirit Link | 5 dmg | 15 dmg, 8 block, 0.1 kills | 18 dmg, 16 block, 0.1 kills |
| Ancestors' Call | 80 dmg, 24 block, 0.4 kills | 180 dmg, 80 block, 0.8 kills | 330 dmg, 116 block, 1 kills |
| Ancestral Spirits (trait) | - | - | 1 heal |
| other | 25 heal, 78 block | 35 heal, 123 block | 63 heal, 165 block |
| chill (status) | - | - | 1 dmg |
| armour | - | 276 block | 518 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): bearWard 3. Under foes' statuses and states: stagger 6, rooted 2, burn 1, poison 1, chill 1.
- Tier II: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): stunned 2, radiant 1, knockedOut 1. Its own buffs and states (s a minute): bearWard 5, spiritLink 3. Under foes' statuses and states: stagger 8, burn 4, stunned 2, rooted 1, knockedOut 1, poison 1.
- Tier III: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): stunned 3, radiant 3, knockedOut 2. Its own buffs and states (s a minute): spiritLink 4, bearWard 4. Under foes' statuses and states: stagger 7, burn 3, stunned 1, rooted 1, poison 1, knockedOut 1.

### Witch (witch): caster

Trait: Crone: Cursed enemies take 40% more from her.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hex** (frogHex, cd 14.6s) | I | 58% · 7.3/m · 2s | 100% · 5.7/m · 2s | 100% · 6.3/m · 3s | 92% · 10.2/m · 2s | 83% · 6.9/m · 2s | 58% · 5.8/m · 2s | 25% · 3/m · 7s | 100% · 6.9/m · 3s | 100% · 5/m · 5s | 100% · 4.3/m · 6s | 100% · 6/m · 2s |
|  | II | 75% · 9.1/m · 2s | 100% · 6.3/m · 8s | 83% · 5.8/m · 5s | 100% · 8.7/m · 2s | 100% · 9/m · 2s | 75% · 7.6/m · 2s | 17% · 3.2/m · 3s | 83% · 8.1/m · 3s | 100% · 6.4/m · 5s | 100% · 7.1/m · 5s | 100% · 8.1/m · 3s |
|  | III | 67% · 8.8/m · 2s | 92% · 6.3/m · 5s | 75% · 5.6/m · 4s | 75% · 9.4/m · 1s | 92% · 10.1/m · 2s | 58% · 8.4/m · 3s | **8%** | 92% · 8.7/m · 3s | 92% · 6.8/m · 6s | 100% · 5.8/m · 13s | 100% · 7.8/m · 6s |
| **Cursed Brew** (cursedBrew, cd 15.9s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 67% · 5.8/m · 2s | 25% · 3/m · 1s | 67% · 3.7/m · 3s | 100% · 2.5/m · 6s | 92% · 2.5/m · 4s | 100% · 3.6/m · 7s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 67% · 6/m · 2s | 50% · 9.6/m · 2s | 67% · 2.5/m · 4s | 83% · 1.9/m · 5s | 100% · 3.1/m · 4s | 100% · 3.5/m · 9s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 83% · 6.7/m · 2s | 50% · 10.9/m · 2s | 58% · 2.6/m · 3s | 92% · 2.4/m · 7s | 100% · 3.2/m · 10s | 100% · 3.7/m · 11s |
| **Broom Ride** (broomRide, cd 13.4s) | I | 100% · 12.5/m · 6s | **0%** | **0%** | 100% · 11.2/m · 6s | 100% · 7.5/m · 7s | 100% · 11.6/m · 3s | 100% · 14.8/m · 2s | 92% · 5.1/m · 6s | 100% · 3.5/m · 2s | 100% · 3.9/m · 3s | 100% · 3.5/m · 11s |
|  | II | 100% · 9.1/m · 7s | **0%** | **0%** | 100% · 5.8/m · 9s | 83% · 1.7/m · 21s | 100% · 8.8/m · 3s | 100% · 19.2/m · 2s | 50% · 1.7/m · 7s | 100% · 4.1/m · 2s | 100% · 5.1/m · 3s | 100% · 4.3/m · 12s |
|  | III | 100% · 8.1/m · 7s | **0%** | **0%** | 100% · 5.7/m · 10s | 50% · 0.7/m · 24s | 100% · 9/m · 3s | 100% · 21.9/m · 2s | 42% · 1.5/m · 10s | 92% · 4.7/m · 2s | 100% · 6.2/m · 3s | 100% · 4.8/m · 16s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 681 dmg, 2.8 kills | 914 dmg, 2 kills | 1,491 dmg, 1.9 kills |
| Hex | 39 dmg, 62 via others, 0.3 s control, 0.1 kills | 69 dmg, 178 via others, 0.4 s control, 0.2 kills | 158 dmg, 363 via others, 0.6 s control, 0.3 kills |
| Cursed Brew | 65 dmg, 0.3 kills | 119 dmg, 0.3 kills | 152 dmg, 0.1 kills |
| Broom Ride | 146 dmg, 0.7 kills | 330 dmg, 0.5 kills | 504 dmg, 0.7 kills |
| Crone (trait) | 81 via others | 134 via others | 185 via others |
| other | - | 5 block | 3 block |
| chill (status) | - | - | 1 dmg |
| armour | - | 214 block | 328 block |

- Tier I: applied curse 834; bursts curse 4.3; status damage -. Foe-seconds a minute traced to it: curse 45, frog 17, hexed 7; all foe states (any cause): hidden 8, hexed 7, radiant 2, stunned 1. Its own buffs and states (s a minute): ethereal 6. Under foes' statuses and states: burn 4, rooted 2, stagger 2, chill 1.
- Tier II: applied curse 1,156; bursts curse 7.4; status damage -. Foe-seconds a minute traced to it: curse 39, frog 35, hexed 11; all foe states (any cause): hidden 18, hexed 11, stunned 3, radiant 2, knockedOut 1. Its own buffs and states (s a minute): ethereal 5. Under foes' statuses and states: burn 10, rooted 2, stagger 1.
- Tier III: applied curse 1,097; bursts curse 6.7; status damage -. Foe-seconds a minute traced to it: frog 46, curse 36, hexed 11; all foe states (any cause): hidden 23, hexed 11, stunned 4, radiant 3, knockedOut 2. Its own buffs and states (s a minute): ethereal 7. Under foes' statuses and states: burn 8, stagger 2, rooted 1, chill 1.

### Warlock (warlock): caster

Trait: Familiar: A small imp is always with him, darting at his shoulder and throwing little eye bolts at his foes. If it falls, another climbs out of the floor 8s later.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Eldritch Beam** (eldritchBeam, cd 12.2s) | I | 100% · 7.2/m · 2s | 100% · 6.9/m · 3s | 100% · 6.9/m · 3s | 100% · 6.9/m · 2s | 100% · 6.1/m · 2s | 100% · 6.9/m · 3s | 100% · 7.3/m · 3s | 100% · 6.6/m · 3s | 100% · 6.3/m · 3s | 100% · 6/m · 4s | 100% · 7.2/m · 3s |
|  | II | 100% · 11/m · 2s | 100% · 3.7/m · 15s | 100% · 4.3/m · 4s | 100% · 10.5/m · 2s | 100% · 9.9/m · 3s | 100% · 11/m · 3s | 100% · 9.8/m · 3s | 100% · 10.7/m · 4s | 100% · 9.3/m · 3s | 100% · 9.7/m · 3s | 100% · 9.5/m · 6s |
|  | III | 100% · 11.3/m · 2s | 92% · 3.8/m · 10s | 83% · 4.1/m · 4s | 100% · 10.7/m · 2s | 100% · 10.5/m · 5s | 100% · 11.5/m · 3s | 100% · 10.2/m · 4s | 100% · 11.7/m · 4s | 100% · 10.7/m · 3s | 100% · 7.3/m · 4s | 100% · 10.6/m · 7s |
| **Awaken** (summonImp, cd 22s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.1/m · 2s | 100% · 7.3/m · 2s | 92% · 4.9/m · 3s | 100% · 3/m · 3s | 100% · 2.9/m · 3s | 100% · 3.2/m · 8s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.9/m · 2s | 100% · 6.2/m · 2s | 100% · 5.6/m · 3s | 100% · 2.6/m · 3s | 100% · 2.2/m · 3s | 100% · 3.8/m · 9s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.2/m · 2s | 100% · 6.1/m · 2s | 100% · 5.4/m · 3s | 100% · 2.9/m · 3s | 100% · 2/m · 3s | 100% · 3.3/m · 9s |
| **Dark Bargain** (darkBargain, cd 22s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.1/m · 2s | 100% · 7.3/m · 2s | 92% · 4.9/m · 3s | 100% · 3.3/m · 2s | 100% · 2.9/m · 3s | 100% · 3.6/m · 10s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 92% · 3.6/m · 5s | 100% · 6.2/m · 2s | 100% · 5.6/m · 3s | 100% · 4.5/m · 2s | 92% · 3.6/m · 2s | 100% · 5.7/m · 9s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 92% · 4.2/m · 5s | 100% · 7.1/m · 2s | 75% · 4/m · 3s | 100% · 4.7/m · 3s | 100% · 3.1/m · 3s | 100% · 5.9/m · 9s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 888 dmg, 84 heal, 8.5 kills | 1,155 dmg, 133 heal, 6.5 kills | 1,601 dmg, 196 heal, 5.6 kills |
| Eldritch Beam | 497 dmg, 2.1 kills | 1,186 dmg, 3 kills | 1,581 dmg, 3 kills |
| Awaken | 509 dmg, 82 block, 9.7 kills | 715 dmg, 161 block, 8.8 kills | 1,141 dmg, 251 block, 8.5 kills |
| Dark Bargain | 89 dmg, 1 kills | 124 dmg, 0.5 kills | 139 dmg, 0.3 kills |
| other | 5 dmg | 12 dmg, 5 block | 13 dmg, 7 block |
| pet | 76 dmg, 0.2 kills | 66 dmg | 71 dmg |
| burn (status) | 44 dmg, 0.3 kills | 90 dmg, 0.3 s control, 0.4 kills | 327 dmg, 1.2 s control, 2.4 kills |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 408 block | 732 block |

- Tier I: applied burn 266; bursts -; status damage burn 39. Foe-seconds a minute traced to it: burn 12; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): demon 18, bargain 9. Under foes' statuses and states: stagger 9, burn 3, rooted 2, chill 2, poison 1, stunned 1.
- Tier II: applied burn 422; bursts burn 1.4; status damage burn 82. Foe-seconds a minute traced to it: burn 15; all foe states (any cause): stunned 2, radiant 1, knockedOut 1. Its own buffs and states (s a minute): demon 19, bargain 13. Under foes' statuses and states: stagger 14, burn 11, stunned 2, rooted 2, knockedOut 1, poison 1, chill 1.
- Tier III: applied burn 1,314; bursts burn 8.8; status damage burn 287. Foe-seconds a minute traced to it: burn 29; all foe states (any cause): stunned 3, radiant 2, knockedOut 1. Its own buffs and states (s a minute): demon 19, bargain 14. Under foes' statuses and states: burn 13, stagger 12, stunned 2, chill 2, rooted 2, knockedOut 1, radiance 1, poison 1.

### Cultist (cultist): caster

Trait: Blood Rite: Every bleeding he started that bursts heals him 8%.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Blood Pact** (bloodPact, cd 18.3s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.6/m · 3s | 100% · 1.6/m · 8s | 100% · 4.3/m · 8s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 92% · 2.6/m · 3s | 83% · 1.4/m · 3s | 100% · 7/m · 8s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 92% · 3.4/m · 2s | 100% · 3.2/m · 8s | 100% · 7.1/m · 6s |
| **Ritual Circle** (ritualCircle, cd 15.9s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.4/m · 2s | 100% · 5.5/m · 2s | 50% · 0.8/m · 4s | 100% · 2.5/m · 3s | 100% · 3.6/m · 3s | 100% · 4.4/m · 8s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.2/m · 2s | 100% · 7.3/m · 2s | 58% · 1.1/m · 2s | 100% · 3.1/m · 3s | 100% · 4.4/m · 3s | 100% · 5.3/m · 10s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.4/m · 2s | 100% · 8.1/m · 2s | 83% · 3.5/m · 3s | 100% · 3.6/m · 6s | 100% · 4.4/m · 3s | 100% · 5/m · 9s |
| **Sacrifice** (soulCandle, cd 17.1s) | I | 83% · 1.7/m · 30s | **8%** | 25% · 1.2/m · 13s | **8%** | 92% · 0.9/m · 66s | 92% · 2/m · 26s | 100% · 3.3/m · 12s | 100% · 2.9/m · 23s | 100% · 3.7/m · 7s | 100% · 3.3/m · 11s | 100% · 5/m · 3s |
|  | II | **0%** | **0%** | **0%** | 58% · 1.7/m · 40s | 100% · 1.1/m · 61s | 100% · 3/m · 19s | 100% · 6.3/m · 12s | 100% · 3.3/m · 23s | 100% · 5.2/m · 7s | 100% · 5.6/m · 7s | 100% · 7.8/m · 7s |
|  | III | **0%** | **0%** | 17% · 0.5/m · 19s | 50% · 1.7/m · 26s | 100% · 1.2/m · 50s | 100% · 6.4/m · 11s | 100% · 7.1/m · 9s | 100% · 5.3/m · 13s | 100% · 7.2/m · 7s | 100% · 6.1/m · 6s | 100% · 8/m · 7s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 558 dmg, 1.6 kills | 727 dmg, 2.2 kills | 1,240 dmg, 3 kills |
| Blood Pact | 40 via others | 98 via others | 32 heal, 257 via others |
| Sacrifice | 99 dmg, 54 heal, 16 block, 1.8 kills | 287 dmg, 106 heal, 40 block, 2.2 kills | 632 dmg, 84 heal, 94 block, 3 kills |
| Blood Rite (trait) | 17 heal | 58 heal | 86 heal |
| other | - | 2 block | 2 block |
| bleed (status) | 121 dmg, 0.2 s control, 0.1 kills | 290 dmg, 0.9 s control, 0.2 kills | 1,029 dmg, 1 s control, 0.1 kills |
| chill (status) | - | 2 dmg | 1 dmg |
| armour | - | 378 block | 553 block |

- Tier I: applied bleed 485; bursts bleed 1.3; status damage bleed 128. Foe-seconds a minute traced to it: bleed 45; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): rage 3. Under foes' statuses and states: stagger 9, bleed 6, rooted 2, burn 2, chill 1.
- Tier II: applied bleed 866, stagger 22; bursts bleed 2.7; status damage bleed 348. Foe-seconds a minute traced to it: bleed 58, stagger 2; all foe states (any cause): stunned 2, radiant 1, knockedOut 1. Its own buffs and states (s a minute): rage 3, untouchable 1. Under foes' statuses and states: stagger 9, burn 6, bleed 5, stunned 2, rooted 2, knockedOut 1.
- Tier III: applied bleed 1,468, stagger 192; bursts bleed 8; status damage bleed 1,015. Foe-seconds a minute traced to it: bleed 35, stagger 15; all foe states (any cause): stunned 4, radiant 3, knockedOut 1. Its own buffs and states (s a minute): rage 5, bloodPact 5, untouchable 1. Under foes' statuses and states: stagger 10, bleed 8, burn 6, stunned 2, rooted 1, knockedOut 1.

### Monk (monk): melee

Trait: Deflect: Swats aside 40% of the shots that reach him from the front.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Flurry** (flurry, cd 9.8s) | I | 100% · 7.7/m · 3s | 92% · 3.2/m · 10s | 83% · 3.2/m · 10s | 100% · 7/m · 2s | 100% · 7/m · 3s | 100% · 6.7/m · 3s | 100% · 4.9/m · 9s | 100% · 6.5/m · 3s | 100% · 5.6/m · 5s | 100% · 4.6/m · 5s | 100% · 5.9/m · 5s |
|  | II | 100% · 10.1/m · 3s | 100% · 4.5/m · 10s | 92% · 1.6/m · 27s | 100% · 7.8/m · 2s | 100% · 11.4/m · 3s | 100% · 9.8/m · 3s | 100% · 6.4/m · 8s | 100% · 10.8/m · 3s | 100% · 8.6/m · 5s | 100% · 8.1/m · 5s | 100% · 8.6/m · 6s |
|  | III | 100% · 13.5/m · 3s | 75% · 2.9/m · 10s | 67% · 1.3/m · 28s | 100% · 10/m · 2s | 100% · 13.4/m · 3s | 100% · 11.4/m · 3s | 100% · 6.6/m · 8s | 100% · 11.4/m · 3s | 100% · 9/m · 5s | 100% · 8.5/m · 4s | 100% · 8.1/m · 8s |
| **Palm Strike** (palmStrike, cd 11s) | I | 100% · 7.3/m · 2s | 100% · 6.2/m · 3s | 100% · 6.3/m · 5s | 100% · 6.5/m · 3s | 100% · 6.5/m · 3s | 100% · 6.2/m · 2s | 100% · 6.4/m · 5s | 100% · 6.4/m · 3s | 100% · 5.9/m · 2s | 100% · 4.4/m · 3s | 100% · 6.6/m · 3s |
|  | II | 100% · 9.6/m · 2s | 100% · 6.1/m · 3s | 100% · 3.9/m · 10s | 100% · 7/m · 8s | 100% · 10.7/m · 3s | 100% · 9.5/m · 2s | 100% · 9/m · 6s | 100% · 9.7/m · 3s | 100% · 9.2/m · 2s | 100% · 8.5/m · 3s | 100% · 9.4/m · 5s |
|  | III | 100% · 12/m · 2s | 92% · 5.9/m · 3s | 100% · 4/m · 12s | 100% · 7.6/m · 8s | 100% · 11.2/m · 3s | 100% · 10.9/m · 2s | 100% · 9/m · 2s | 100% · 9.9/m · 2s | 100% · 9.8/m · 2s | 100% · 8.3/m · 3s | 100% · 8.9/m · 6s |
| **Inner Peace** (innerPeace, cd 19.5s) | I | 100% · 2.6/m · 14s | 100% · 3.8/m · 3s | 100% · 4.1/m · 3s | 100% · 2.6/m · 31s | 100% · 2.6/m · 19s | 100% · 3.1/m · 10s | 100% · 2.9/m · 2s | 100% · 1.8/m · 17s | 75% · 1.2/m · 28s | 100% · 2.2/m · 9s | 88% · 1.2/m · 18s |
|  | II | 100% · 3/m · 62s | 100% · 6.4/m · 4s | 100% · 6.7/m · 3s | 100% · 6.1/m · 3s | 42% · 1.6/m · 14s | 92% · 2.6/m · 15s | 100% · 3.6/m · 3s | 75% · 1.6/m · 13s | 75% · 1.1/m · 15s | 100% · 3.4/m · 8s | 100% · 1.9/m · 31s |
|  | III | 58% · 1.3/m · 7s | 100% · 8/m · 3s | 100% · 7.3/m · 3s | 100% · 5.4/m · 3s | 25% · 1.8/m · 6s | 83% · 2.5/m · 9s | 100% · 3.8/m · 6s | 67% · 2.2/m · 9s | 50% · 1.5/m · 26s | 92% · 3.3/m · 13s | 100% · 2.7/m · 32s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 341 dmg, 1.8 kills | 437 dmg, 1.9 kills | 735 dmg, 1.6 kills |
| Flurry | 133 dmg, 121 heal, 0.5 kills | 188 dmg, 329 heal, 0.7 kills | 592 dmg, 596 heal, 1.5 kills |
| Palm Strike | 87 dmg, 0.3 kills | 114 dmg, 3.2 s control, 0.5 kills | 274 dmg, 3.6 s control, 0.6 kills |
| Inner Peace | 46 dmg, 121 heal, 20 block, 0.4 s control, 0.1 kills | 104 dmg, 250 heal, 69 block, 1 s control, 0.2 kills | 185 dmg, 333 heal, 105 block, 0.8 s control, 0.3 kills |
| Deflect (trait) | 92 block | 128 block | 223 block |
| other | 1 block | - | - |
| reflected | 3 dmg | 4 dmg, 0.1 s control | 9 dmg |
| burn (status) | 2 dmg | 18 dmg, 0.1 kills | 17 dmg |
| chill (status) | - | 3 dmg | 2 dmg |
| armour | - | 459 block | 801 block |
| dodge | 75 block | 130 block | 196 block |

- Tier I: applied burn 5, chill 4, stagger 3; bursts -; status damage burn 1. Foe-seconds a minute traced to it: spun 33, burn 1; all foe states (any cause): radiant 1, rooted 1. Its own buffs and states (s a minute): innerPeace 6. Under foes' statuses and states: stagger 12, rooted 4, burn 3, poison 1, chill 1, wet 1, stunned 1.
- Tier II: applied stagger 686, burn 42, chill 10, radiance 1; bursts -; status damage burn 13, chill 2. Foe-seconds a minute traced to it: stagger 51, spun 45, burn 4, knockedOut 1; all foe states (any cause): stunned 4, knockedOut 1, radiant 1, rooted 1. Its own buffs and states (s a minute): innerPeace 14. Under foes' statuses and states: stagger 15, burn 6, stunned 3, rooted 2, poison 2, wet 1.
- Tier III: applied stagger 806, burn 38, chill 4; bursts -; status damage burn 12, chill 1. Foe-seconds a minute traced to it: spun 58, stagger 55, burn 3, knockedOut 1; all foe states (any cause): stunned 5, knockedOut 2, radiant 2, rooted 1. Its own buffs and states (s a minute): innerPeace 14. Under foes' statuses and states: stagger 13, burn 6, stunned 4, rooted 2, knockedOut 2, poison 1, wet 1, chill 1.

### Seer (seer): support

Trait: Third Eye: Can't be blinded, and sees 15% of blows coming in time to step aside.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Foresight** (foresight, cd 14.6s) | I | 100% · 5.3/m · 2s | 100% · 6.4/m · 2s | 100% · 5.2/m · 3s | 100% · 5/m · 2s | 100% · 5/m · 2s | 100% · 5.1/m · 3s | 100% · 5.3/m · 3s | 100% · 5.1/m · 2s | 100% · 5.1/m · 2s | 100% · 5.1/m · 3s | 100% · 4.5/m · 10s |
|  | II | 100% · 9.1/m · 2s | 100% · 9.3/m · 2s | 100% · 9.1/m · 3s | 100% · 9/m · 2s | 100% · 9.2/m · 2s | 100% · 9.1/m · 2s | 100% · 9.1/m · 3s | 100% · 9.1/m · 2s | 100% · 9/m · 3s | 100% · 7.9/m · 3s | 100% · 5.2/m · 6s |
|  | III | 100% · 9.8/m · 2s | 100% · 9.8/m · 2s | 100% · 10/m · 3s | 100% · 9.5/m · 2s | 100% · 9.8/m · 2s | 100% · 9.7/m · 2s | 100% · 10/m · 3s | 100% · 9.7/m · 2s | 100% · 9.6/m · 2s | 100% · 9.4/m · 3s | 100% · 10/m · 2s |
| **Blinding Flash** (premonition, cd 13.4s) | I | 100% · 5.4/m · 2s | 17% · 0.7/m · 15s | **0%** | 100% · 5.4/m · 3s | 100% · 5.3/m · 3s | 100% · 5.4/m · 2s | 100% · 5.7/m · 2s | 100% · 4.6/m · 3s | 100% · 2.6/m · 3s | 100% · 4.9/m · 3s | 100% · 3.7/m · 10s |
|  | II | 100% · 9.5/m · 2s | **0%** | **0%** | 100% · 9/m · 3s | 100% · 7/m · 3s | 100% · 9.6/m · 2s | 100% · 9.4/m · 2s | 100% · 5.7/m · 4s | 100% · 3.7/m · 3s | 100% · 6.7/m · 4s | 100% · 2.9/m · 16s |
|  | III | 100% · 10.8/m · 2s | **0%** | **0%** | 100% · 10.4/m · 3s | 100% · 5.8/m · 7s | 100% · 10.3/m · 2s | 100% · 10.5/m · 2s | 100% · 5.3/m · 7s | 100% · 4.1/m · 3s | 100% · 5.2/m · 4s | 100% · 4/m · 17s |
| **Ill Omen** (starfall, cd 18.3s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.3/m · 3s | **0%** | 100% · 1.1/m · 5s | 100% · 3.1/m · 3s | 100% · 1.6/m · 38s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.1/m · 2s | **0%** | 83% · 1.3/m · 11s | 100% · 3.8/m · 3s | 100% · 1.5/m · 41s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.8/m · 3s | **0%** | 100% · 2.3/m · 3s | 100% · 3.3/m · 3s | 100% · 2/m · 37s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 441 dmg, 1.6 kills | 685 dmg, 2.3 kills | 1,257 dmg, 2.8 kills |
| Foresight | 66 via others | 258 block, 190 via others | 524 block, 474 via others |
| Blinding Flash | 53 dmg, 18 block, 0.1 kills | 93 dmg, 40 block, 0.2 kills | 115 dmg, 50 block, 0.3 kills |
| Third Eye (trait) | 56 block | 111 block | 152 block |
| other | - | 1 block | 1 block |
| chill (status) | - | - | 1 dmg |
| armour | - | 180 block | 255 block |

- Tier I: applied confuse 125; bursts -; status damage -. Foe-seconds a minute traced to it: foresight 29, blinded 18, confuse 17, omen 8; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, burn 1, rooted 1, poison 1, chill 1.
- Tier II: applied confuse 304; bursts confuse 1.5; status damage -. Foe-seconds a minute traced to it: foresight 50, blinded 34, confuse 20, omen 11, addled 6; all foe states (any cause): addled 6, stunned 1, radiant 1, knockedOut 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 7, stagger 6, stunned 2, rooted 1.
- Tier III: applied confuse 471, radiance 298; bursts confuse 2.9; status damage -. Foe-seconds a minute traced to it: foresight 71, radiance 45, blinded 33, confuse 18, omen 17, addled 11; all foe states (any cause): addled 11, stunned 2, radiant 2, knockedOut 1, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 6, stagger 6, stunned 2, rooted 1.

### Chef (chef): support

Trait: Well Fed: Allies near him heal 0.5% of their health a second.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hot Meal** (hotMeal, cd 14.6s) | I | 83% · 1.8/m · 37s | 100% · 4.9/m · 6s | 100% · 4.4/m · 5s | 100% · 3.2/m · 44s | 58% · 0.7/m · 84s | 100% · 3.2/m · 33s | 100% · 4/m · 10s | 100% · 3.6/m · 21s | 100% · 4.1/m · 15s | 100% · 3.9/m · 10s | 50% · 0.3/m · 98s |
|  | II | 100% · 4.3/m · 53s | 100% · 7.9/m · 11s | 100% · 7.1/m · 13s | 100% · 5.9/m · 29s | 25% · 0.5/m · 91s | 67% · 1.7/m · 80s | 58% · 1.6/m · 26s | **0%** | 100% · 5.7/m · 15s | 100% · 6.2/m · 12s | **0%** |
|  | III | 100% · 5.2/m · 35s | 100% · 9.2/m · 7s | 100% · 7.5/m · 11s | 100% · 6.9/m · 15s | 17% · 0.2/m · 87s | 25% · 1/m · 36s | **0%** | 83% · 1/m · 42s | 100% · 7.4/m · 12s | 100% · 6.3/m · 10s | **0%** |
| **Grease Fire** (greaseFire, cd 15.9s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.7/m · 2s | 100% · 4.7/m · 2s | **0%** | 58% · 0.6/m · 3s | 100% · 3/m · 2s | 100% · 2.1/m · 22s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.9/m · 3s | 100% · 7.5/m · 2s | **8%** | 50% · 0.6/m · 4s | 100% · 2.7/m · 3s | 88% · 1.2/m · 40s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.7/m · 3s | 100% · 8.2/m · 2s | **8%** | 83% · 1.9/m · 28s | 100% · 2.5/m · 5s | 88% · 1.4/m · 35s |
| **Food Fight** (foodFight, cd 12.2s) | I | 42% · 0.5/m · 27s | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.2/m · 2s | **0%** | 100% · 2.5/m · 2s | 100% · 4.6/m · 3s | 100% · 3.9/m · 15s |
|  | II | 100% · 5.3/m · 10s | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 10.2/m · 2s | **0%** | 100% · 4.5/m · 2s | 100% · 5/m · 3s | 100% · 4.9/m · 10s |
|  | III | 100% · 6.4/m · 8s | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 11/m · 2s | **0%** | 100% · 5.6/m · 2s | 100% · 6.3/m · 3s | 100% · 5.6/m · 12s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 406 dmg, 5 heal, 1.5 kills | 577 dmg, 5 heal, 2.6 kills | 1,007 dmg, 7 heal, 2.4 kills |
| Hot Meal | 73 heal | 205 heal | 259 heal, 56 via others |
| Grease Fire | 24 dmg, 0.1 kills | 34 dmg, 0.2 kills | 62 dmg, 0.2 kills |
| Food Fight | 39 dmg, 0.2 kills | 76 dmg, 64 block, 0.4 kills | 144 dmg, 119 block, 0.4 kills |
| Well Fed (trait) | 61 heal | 124 heal | 156 heal |
| other | - | 6 block | 7 block |
| burn (status) | - | 128 dmg, 0.3 s control, 0.7 kills | 545 dmg, 0.6 s control, 4.1 kills |
| chill (status) | - | 1 dmg | - |
| armour | - | 447 block | 745 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: pied 7; all foe states (any cause): -. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 9, rooted 2, burn 2, chill 1, poison 1, wet 1, stunned 1.
- Tier II: applied burn 218; bursts -; status damage burn 88. Foe-seconds a minute traced to it: burn 21, pied 11; all foe states (any cause): stunned 1, radiant 1, knockedOut 1. Its own buffs and states (s a minute): warded 1. Under foes' statuses and states: burn 9, stagger 8, stunned 3, rooted 2, knockedOut 2, poison 1, wet 1.
- Tier III: applied burn 576; bursts burn 4; status damage burn 265. Foe-seconds a minute traced to it: burn 26, pied 14; all foe states (any cause): stunned 2, radiant 2, knockedOut 1. Its own buffs and states (s a minute): hotMeal 10, warded 1. Under foes' statuses and states: stagger 9, burn 7, stunned 3, rooted 2, knockedOut 1, chill 1.

### Beekeeper (beekeeper): support

Trait: Pollen: Every sixth sting of his bees carries pollen back: the friend most hurt near him heals 4%.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Smoker** (swarm, cd 13.4s) | I | 100% · 5.3/m · 2s | **0%** | **0%** | 100% · 5.5/m · 2s | 100% · 5/m · 2s | 100% · 5.4/m · 3s | 100% · 5.6/m · 2s | 100% · 3.8/m · 4s | 100% · 2.4/m · 3s | 100% · 3.4/m · 3s | 100% · 3.6/m · 9s |
|  | II | 100% · 8.9/m · 3s | **0%** | **0%** | 100% · 8.4/m · 3s | 100% · 4.4/m · 9s | 100% · 8.7/m · 3s | 100% · 9/m · 3s | 100% · 4/m · 5s | 100% · 2.4/m · 16s | 100% · 5.3/m · 3s | 100% · 3.4/m · 15s |
|  | III | 100% · 8.9/m · 3s | **0%** | **0%** | 100% · 8.8/m · 2s | 100% · 3.7/m · 7s | 100% · 7.9/m · 3s | 100% · 9.8/m · 3s | 100% · 3/m · 13s | 100% · 3.7/m · 5s | 100% · 5/m · 3s | 100% · 3.6/m · 10s |
| **Beehive** (honeyPot, cd 17.1s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.4/m · 2s | 100% · 4.1/m · 2s | 100% · 3.4/m · 3s | 100% · 2.7/m · 3s | 100% · 3.5/m · 3s | 100% · 4.1/m · 6s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.1/m · 3s | 100% · 7.2/m · 2s | 100% · 3.6/m · 3s | 100% · 3.6/m · 2s | 100% · 5.6/m · 2s | 100% · 5/m · 7s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.2/m · 2s | 100% · 8/m · 2s | 100% · 4.2/m · 3s | 100% · 5.3/m · 2s | 100% · 6.3/m · 2s | 100% · 5.1/m · 7s |
| **Honey Glaze** (royalJelly, cd 14.6s) | I | 100% · 3.8/m · 15s | 100% · 4.9/m · 4s | 100% · 4.9/m · 5s | 100% · 2/m · 33s | 25% · 0.2/m · 77s | 83% · 1.8/m · 13s | 100% · 4.2/m · 11s | 33% · 1.1/m · 23s | 100% · 3.3/m · 15s | 100% · 4.1/m · 11s | 63% · 0.3/m · 99s |
|  | II | 100% · 5.9/m · 19s | 100% · 7.8/m · 8s | 100% · 7.9/m · 9s | 33% · 0.2/m · 90s | **0%** | **0%** | **8%** | **0%** | 100% · 4.7/m · 14s | 100% · 6.2/m · 9s | **0%** |
|  | III | 100% · 7.8/m · 12s | 100% · 8.8/m · 6s | 100% · 8.8/m · 7s | 33% · 0.3/m · 74s | **0%** | 25% · 0.2/m · 16s | **8%** | **0%** | 100% · 7.8/m · 8s | 100% · 7.2/m · 7s | **0%** |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 489 dmg, 11 heal, 1.3 s control, 2.7 kills | 612 dmg, 27 heal, 4.1 s control, 2.6 kills | 898 dmg, 27 heal, 6.1 s control, 2.3 kills |
| Smoker | 29 dmg, 0.1 kills | 44 dmg, 7.9 s control, 0.1 kills | 58 dmg, 7.7 s control, 0.1 kills |
| Pollen (trait) | 67 heal | 131 heal | 198 heal |
| other | 61 heal | 160 heal, 3 block | 226 heal, 3 block |
| entangle (status) | 1 dmg | 1 dmg | 1 dmg |
| poison (status) | 122 dmg, 0.8 s control, 0.5 kills | 211 dmg, 2.6 s control, 0.5 kills | 274 dmg, 2.9 s control, 0.5 kills |
| armour | - | 311 block | 575 block |
| tk:cinderBoots | - | - | - |
| tk:thunderRing | - | - | - |
| tk:volatile | - | - | - |
| tk:whirlingKnives | 1 dmg | 1 dmg | 2 dmg |

- Tier I: applied poison 434, sleepy 369, entangle 102; bursts -; status damage poison 164, entangle 1. Foe-seconds a minute traced to it: poison 79, sleepy 63, entangle 13, smoked 12, honeyed 6, sickened 2; all foe states (any cause): sickened 2, radiant 1, stunned 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 7, rooted 2, burn 1, chill 1, poison 1, radiance 1.
- Tier II: applied sleepy 496, poison 466, entangle 66; bursts sleepy 2.2, poison 0.8; status damage poison 248, entangle 1. Foe-seconds a minute traced to it: poison 79, sleepy 44, smoked 14, entangle 7, asleep 5, sickened 4, honeyed 4; all foe states (any cause): asleep 5, sickened 4, stunned 2, knockedOut 1, radiant 1, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 12, burn 7, rooted 1, stunned 1.
- Tier III: applied poison 550, sleepy 550, entangle 54; bursts sleepy 2.3, poison 1.2; status damage poison 338, entangle 1. Foe-seconds a minute traced to it: poison 86, sleepy 49, smoked 15, sickened 7, entangle 6, asleep 6, honeyed 3; all foe states (any cause): sickened 7, asleep 6, stunned 2, knockedOut 2, radiant 2, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 12, burn 5, rooted 2, stunned 2, poison 1, chill 1, knockedOut 1.

### Quartermaster (quartermaster): support

Trait: Requisition: Every 20s he tosses a piece of kit to the friend nearest the fight, for 12s: a whetstone (+20% damage), a buckler (a shield of 25) or boots (+25% speed). A gatherer: on the wagon road he goes for loose gold before a fight, and further for it.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Supply Crate** (resupply, cd 19.5s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 1.7/m · 5s | 75% · 1.2/m · 16s | 100% · 4.6/m · 3s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 25% · 0.2/m · 28s | 50% · 1.1/m · 24s | 50% · 0.4/m · 42s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 50% · 0.5/m · 24s | 63% · 0.3/m · 62s |
| **Barricade** (oilBlades, cd 22s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.9/m · 3s | **0%** | 100% · 1.7/m · 3s | 100% · 2.9/m · 3s | 100% · 3.6/m · 6s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.2/m · 3s | **0%** | 100% · 2.2/m · 3s | 100% · 5.1/m · 2s | 100% · 4.6/m · 7s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.6/m · 2s | **0%** | 92% · 3.5/m · 3s | 100% · 5/m · 3s | 100% · 4.7/m · 8s |
| **Pot Helmet** (flare, cd 14.6s) | I | 100% · 5.1/m · 2s | 100% · 6.1/m · 3s | 100% · 5.9/m · 3s | 100% · 4.9/m · 3s | 100% · 5/m · 2s | 100% · 5/m · 2s | 100% · 5.3/m · 2s | 100% · 5/m · 3s | 100% · 5.1/m · 2s | 100% · 4.6/m · 3s | 100% · 6.3/m · 3s |
|  | II | 100% · 9.1/m · 2s | 100% · 8.8/m · 3s | 100% · 9.1/m · 3s | 100% · 8.9/m · 2s | 100% · 9.2/m · 2s | 100% · 8.9/m · 2s | 100% · 8.7/m · 3s | 100% · 8.9/m · 3s | 100% · 8.7/m · 2s | 100% · 8.4/m · 3s | 100% · 9.7/m · 3s |
|  | III | 100% · 9.5/m · 2s | 100% · 9.9/m · 3s | 100% · 10.4/m · 3s | 100% · 10.1/m · 3s | 100% · 10.3/m · 2s | 100% · 10/m · 2s | 100% · 9.5/m · 3s | 100% · 10/m · 3s | 100% · 9.8/m · 2s | 100% · 8.6/m · 3s | 100% · 11/m · 3s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 336 dmg, 5 heal, 1.1 kills | 488 dmg, 2 heal, 1.6 kills | 883 dmg, 2 heal, 1.8 kills |
| Pot Helmet | 50 dmg, 50 block, 0.2 kills | 94 dmg, 121 block, 2.1 s control, 0.5 kills | 189 dmg, 188 block, 22.2 s control, 0.6 kills |
| Requisition (trait) | 19 block, 17 via others | 15 block, 30 via others | 19 block, 61 via others |
| other | 4 block, 2 via others | 2 block, 3 via others | 61 dmg, 2 block, 8 via others, 0.2 kills |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 311 block | 472 block |

- Tier I: applied confuse 217; bursts -; status damage -. Foe-seconds a minute traced to it: confuse 29, potHead 28; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): whetstone 12, boots 11, warded 6. Under foes' statuses and states: stagger 7, rooted 2, burn 2, chill 1, poison 1.
- Tier II: applied stagger 437, confuse 383; bursts -; status damage -. Foe-seconds a minute traced to it: confuse 51, potHead 50, stagger 33, knockedOut 1; all foe states (any cause): stunned 4, knockedOut 2, radiant 1. Its own buffs and states (s a minute): boots 13, whetstone 11, warded 5. Under foes' statuses and states: stagger 11, burn 5, rooted 2, stunned 2, poison 1.
- Tier III: applied stagger 1,144, confuse 551; bursts stagger 4.8; status damage -. Foe-seconds a minute traced to it: potHead 72, confuse 70, stagger 45, knockedOut 12; all foe states (any cause): stunned 15, knockedOut 13, radiant 2. Its own buffs and states (s a minute): whetstone 13, boots 10, warded 5. Under foes' statuses and states: stagger 10, burn 5, stunned 2, rooted 2, chill 1.

### Crossbowman (crossbowman): ranged

Trait: Armour Piercing: His bolts go straight through armour, and hit elites, majors and bosses 25% harder.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Pavise** (pavise, cd 15.9s) | I | 100% · 5.5/m · 2s | 100% · 6.1/m · 2s | 100% · 8.8/m · 3s | 100% · 4.9/m · 2s | 100% · 5.3/m · 2s | 100% · 5.3/m · 3s | 100% · 5.3/m · 2s | 100% · 5.5/m · 3s | 100% · 3.6/m · 3s | 100% · 4.1/m · 3s | 100% · 3.1/m · 8s |
|  | II | 100% · 8.1/m · 2s | 100% · 8.4/m · 2s | 100% · 8.3/m · 3s | 100% · 7.6/m · 2s | 100% · 7/m · 2s | 100% · 8.3/m · 3s | 100% · 7.8/m · 3s | 100% · 7.3/m · 2s | 100% · 4/m · 2s | 100% · 6.9/m · 3s | 100% · 4.2/m · 6s |
|  | III | 100% · 9.4/m · 2s | 100% · 9/m · 2s | 100% · 9.4/m · 3s | 100% · 6.8/m · 2s | 100% · 6.1/m · 2s | 100% · 7.9/m · 3s | 100% · 8.8/m · 3s | 100% · 6.9/m · 2s | 92% · 4/m · 3s | 100% · 6.4/m · 3s | 100% · 5/m · 4s |
| **Pinning Bolt** (pinBolt, cd 12.2s) | I | 100% · 6.4/m · 2s | 100% · 7.1/m · 3s | 100% · 8.8/m · 3s | 100% · 6.6/m · 2s | 100% · 7.1/m · 3s | 100% · 6.1/m · 3s | 100% · 6.6/m · 3s | 100% · 6/m · 3s | 100% · 6.5/m · 3s | 100% · 5.7/m · 3s | 100% · 7.3/m · 2s |
|  | II | 100% · 11.4/m · 2s | 100% · 11.3/m · 3s | 100% · 11.9/m · 3s | 100% · 10.8/m · 3s | 100% · 10.4/m · 3s | 100% · 10.7/m · 3s | 100% · 10.8/m · 2s | 100% · 10.2/m · 3s | 100% · 10.3/m · 3s | 100% · 10.5/m · 3s | 100% · 12.5/m · 2s |
|  | III | 100% · 11.8/m · 2s | 100% · 11.1/m · 3s | 100% · 11.6/m · 3s | 100% · 11.6/m · 3s | 100% · 12.1/m · 3s | 100% · 11.4/m · 2s | 100% · 11.1/m · 3s | 100% · 11.7/m · 4s | 100% · 11.3/m · 3s | 100% · 10.3/m · 3s | 100% · 12.4/m · 2s |
| **Crank Up** (crankUp, cd 18.3s) | I | 100% · 5.5/m · 3s | 100% · 6.1/m · 3s | 100% · 8.8/m · 3s | 100% · 4.5/m · 3s | 100% · 3.8/m · 3s | 100% · 4.4/m · 3s | 100% · 5.1/m · 3s | 100% · 5.1/m · 4s | 100% · 4.3/m · 3s | 100% · 4.1/m · 3s | 100% · 5.5/m · 2s |
|  | II | 100% · 7.4/m · 3s | 100% · 8/m · 3s | 100% · 7.3/m · 3s | 100% · 6.9/m · 3s | 100% · 7/m · 4s | 100% · 6.9/m · 3s | 100% · 7.4/m · 3s | 100% · 7.1/m · 3s | 100% · 6.8/m · 3s | 100% · 6.8/m · 3s | 100% · 10.1/m · 1s |
|  | III | 100% · 8.7/m · 3s | 100% · 8.4/m · 3s | 100% · 9.4/m · 3s | 100% · 8.2/m · 3s | 100% · 8.6/m · 3s | 100% · 8.2/m · 3s | 100% · 8.5/m · 3s | 100% · 7.6/m · 3s | 100% · 7.7/m · 3s | 100% · 7.1/m · 3s | 100% · 9.5/m · 2s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 789 dmg, 4.8 kills | 1,204 dmg, 4.5 kills | 2,243 dmg, 4.6 kills |
| Pinning Bolt | 308 dmg, 0.7 s control, 1.7 kills | 619 dmg, 4.4 s control, 2.5 kills | 1,254 dmg, 4.3 s control, 3 kills |
| Crank Up | 250 dmg, 2.1 s control, 1.4 kills | 489 dmg, 19.1 s control, 1.6 kills | 1,211 dmg, 59.9 s control, 2.9 kills |
| Armour Piercing (trait) | 107 via others | 336 via others | 599 via others |
| other | - | 3 block | 2 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 179 block | 230 block |

- Tier I: applied stagger 475; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 31, pinned 1; all foe states (any cause): stunned 3, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 3, burn 1, rooted 1.
- Tier II: applied stagger 1,282; bursts stagger 5.4; status damage -. Foe-seconds a minute traced to it: stagger 46, knockedOut 12, pinned 2; all foe states (any cause): stunned 17, knockedOut 13, radiant 2. Its own buffs and states (s a minute): pavise 8. Under foes' statuses and states: stagger 4, burn 4, rooted 1, radiance 1.
- Tier III: applied stagger 2,793; bursts stagger 16.6; status damage -. Foe-seconds a minute traced to it: stagger 48, knockedOut 30, pinned 3; all foe states (any cause): stunned 35, knockedOut 32, radiant 3. Its own buffs and states (s a minute): pavise 12. Under foes' statuses and states: burn 3, stagger 2, chill 1, poison 1.

### Falconer (falconer): ranged

Trait: Hunting Partner: Every fourth knife the falcon goes out with it, rakes the foe and marks it Tracked for 2s.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Loose the Falcon** (looseFalcon, cd 12.2s) | I | 75% · 10.6/m · 2s | 100% · 7.1/m · 2s | 100% · 8.1/m · 3s | 75% · 10.2/m · 1s | 83% · 6.4/m · 2s | 25% · 6.5/m · 2s | **8%** | 92% · 9.2/m · 2s | 100% · 5.7/m · 5s | 100% · 4.7/m · 5s | 100% · 7.4/m · 1s |
|  | II | 83% · 12/m · 2s | 100% · 11.4/m · 2s | 100% · 10.9/m · 3s | 100% · 11.2/m · 2s | 100% · 10.7/m · 2s | 25% · 5.8/m · 2s | 17% · 4.3/m · 2s | 100% · 10.6/m · 2s | 100% · 9.5/m · 4s | 100% · 9.4/m · 5s | 100% · 13.7/m · 1s |
|  | III | 75% · 11.3/m · 2s | 100% · 11.4/m · 2s | 100% · 11.6/m · 3s | 83% · 10.2/m · 2s | 100% · 11.3/m · 3s | 50% · 8/m · 3s | **0%** | 100% · 11.4/m · 3s | 100% · 8.6/m · 5s | 100% · 8.7/m · 4s | 100% · 13.1/m · 1s |
| **Keen Eye** (keenEye, cd 17.1s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 42% · 10.8/m · 2s | 33% · 8.4/m · 2s | 50% · 4.6/m · 2s | 100% · 3.5/m · 4s | 100% · 3.4/m · 5s | 100% · 4.1/m · 5s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 42% · 9.7/m · 1s | 50% · 12.8/m · 2s | 75% · 5.5/m · 3s | 100% · 5.6/m · 4s | 100% · 5/m · 4s | 100% · 5.5/m · 8s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 92% · 13.7/m · 2s | 50% · 12.4/m · 2s | 92% · 6.1/m · 4s | 100% · 5.4/m · 3s | 100% · 6.4/m · 3s | 100% · 5.8/m · 7s |
| **Call the Flock** (flock, cd 15.9s) | I | 100% · 14.2/m · 3s | **0%** | **0%** | 100% · 13.5/m · 5s | 92% · 4.4/m · 8s | 100% · 26/m · 2s | 100% · 25.2/m · 2s | 92% · 7.3/m · 5s | 100% · 3.2/m · 2s | 100% · 3/m · 3s | 100% · 3.6/m · 14s |
|  | II | 100% · 14.4/m · 5s | **0%** | **0%** | 100% · 8.9/m · 7s | 67% · 1.5/m · 19s | 100% · 23.4/m · 3s | 100% · 25.5/m · 2s | 75% · 3.8/m · 7s | 100% · 4.2/m · 3s | 100% · 4.9/m · 3s | 100% · 3.3/m · 14s |
|  | III | 100% · 15.1/m · 5s | **0%** | **0%** | 100% · 12.3/m · 5s | 67% · 1.5/m · 17s | 100% · 13.7/m · 3s | 100% · 24.9/m · 2s | 50% · 2.6/m · 7s | 100% · 3.8/m · 4s | 100% · 5.8/m · 3s | 100% · 3.9/m · 12s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 652 dmg, 2.6 kills | 945 dmg, 2.3 kills | 1,726 dmg, 0.2 s control, 2.4 kills |
| Loose the Falcon | 330 dmg, 257 via others, 0.7 kills | 445 dmg, 117 block, 471 via others, 0.9 kills | 742 dmg, 266 block, 794 via others, 1.2 kills |
| Keen Eye | 1 dmg, 1 via others | 7 dmg, 2 via others | 19 dmg, 3 via others |
| Call the Flock | 35 dmg, 0.2 kills | 55 dmg, 39 block, 0.2 kills | 102 dmg, 83 block, 0.2 kills |
| other | 27 dmg, 10 via others, 0.1 kills | 37 dmg, 12 via others, 0.1 kills | 55 dmg, 17 via others, 0.1 kills |
| chill (status) | - | 1 dmg | 3 dmg |
| armour | - | 150 block | 268 block |
| dodge | 22 block | 27 block | 46 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: tracked 33, pecked 13; all foe states (any cause): radiant 3, stunned 1. Its own buffs and states (s a minute): ethereal 4, hidden 4. Under foes' statuses and states: stagger 3, burn 3, rooted 2.
- Tier II: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: tracked 50, falconBlind 26, pecked 16; all foe states (any cause): stunned 3, radiant 3, knockedOut 2. Its own buffs and states (s a minute): keenEye 17, ethereal 5, hidden 5. Under foes' statuses and states: burn 10, stagger 3, rooted 2.
- Tier III: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: tracked 58, falconBlind 33, pecked 19; all foe states (any cause): stunned 5, radiant 4, knockedOut 2. Its own buffs and states (s a minute): keenEye 19, ethereal 7, hidden 7. Under foes' statuses and states: burn 9, stagger 2, rooted 1, chill 1.

### Grenadier (grenadier): ranged

Trait: Powder Keg: Whatever he kills blows up a moment later, hurting and staggering those round it: one blast sets off the next through a pack.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Big Bomb** (bigBomb, cd 13.4s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.6/m · 4s | 100% · 4.8/m · 3s | 92% · 2.5/m · 5s | 100% · 3.4/m · 3s | 100% · 3.2/m · 4s | 100% · 4.3/m · 11s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.8/m · 3s | 100% · 8.6/m · 3s | 100% · 4.4/m · 4s | 100% · 3.3/m · 4s | 100% · 5/m · 3s | 100% · 6/m · 7s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.1/m · 3s | 100% · 9/m · 3s | 92% · 4.1/m · 3s | 92% · 3.6/m · 4s | 100% · 5.2/m · 4s | 100% · 5.6/m · 8s |
| **Sticky Bomb** (stickyBomb, cd 12.2s) | I | 100% · 7.4/m · 2s | 100% · 5.2/m · 2s | 100% · 5.8/m · 3s | 100% · 6.3/m · 3s | 100% · 6/m · 3s | 100% · 6.3/m · 2s | 100% · 6.4/m · 3s | 100% · 6.5/m · 3s | 100% · 6.1/m · 3s | 100% · 5.4/m · 3s | 100% · 7.1/m · 2s |
|  | II | 100% · 10.9/m · 2s | 100% · 4.7/m · 2s | 100% · 6.4/m · 3s | 100% · 11/m · 2s | 100% · 11/m · 3s | 100% · 10.6/m · 2s | 100% · 10.9/m · 4s | 100% · 11.1/m · 3s | 100% · 10.1/m · 3s | 100% · 9.9/m · 3s | 100% · 11.9/m · 3s |
|  | III | 100% · 12.1/m · 2s | 100% · 6.7/m · 2s | 100% · 10.4/m · 3s | 100% · 11.9/m · 2s | 100% · 11.7/m · 3s | 100% · 12/m · 2s | 100% · 10.1/m · 3s | 100% · 11.7/m · 2s | 100% · 10.8/m · 3s | 100% · 10.9/m · 3s | 100% · 12.7/m · 3s |
| **Blast Off** (blastOff, cd 14.6s) | I | 100% · 4.9/m · 7s | **0%** | **0%** | 100% · 3.6/m · 7s | 100% · 3.7/m · 7s | 100% · 5.1/m · 3s | 100% · 5.2/m · 2s | 100% · 2.5/m · 10s | 75% · 1.4/m · 3s | 100% · 2.6/m · 3s | 100% · 2.3/m · 16s |
|  | II | 100% · 3.9/m · 8s | **0%** | **0%** | 100% · 1.9/m · 28s | 58% · 0.8/m · 31s | 100% · 6.3/m · 3s | 100% · 9/m · 2s | 25% · 0.8/m · 7s | 92% · 2.4/m · 3s | 100% · 3/m · 7s | 100% · 2.1/m · 18s |
|  | III | 83% · 2.7/m · 10s | **0%** | **0%** | 17% · 0.3/m · 34s | **8%** | 100% · 3.4/m · 9s | 100% · 9/m · 3s | 17% · 1/m · 4s | 100% · 2.7/m · 3s | 100% · 2.5/m · 4s | 100% · 1.9/m · 24s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 731 dmg, 7.5 s control, 4.4 kills | 1,002 dmg, 26.3 s control, 3.5 kills | 1,867 dmg, 64.1 s control, 4.6 kills |
| Big Bomb | 174 dmg, 0.6 s control, 1.2 kills | 274 dmg, 7.8 s control, 1 kills | 461 dmg, 14.5 s control, 1.1 kills |
| Sticky Bomb | 228 dmg, 3.3 s control, 1.4 kills | 445 dmg, 12.2 s control, 1.6 kills | 1,070 dmg, 16.9 s control, 2.8 kills |
| Blast Off | 63 dmg, 3 block, 0.9 s control, 0.1 kills | 81 dmg, 6 block, 10.7 s control, 0.4 kills | 125 dmg, 5 block, 10.9 s control, 0.4 kills |
| powderKeg (a foe's, sent back) | 39 dmg, 0.2 s control, 0.8 kills | 45 dmg, 0.4 s control, 0.6 kills | 45 dmg, 0.5 s control, 0.2 kills |
| other | - | 9 block | 5 block, 0.1 s control |
| burn (status) | - | 108 dmg, 1 s control, 0.7 kills | 151 dmg, 0.9 s control, 0.7 kills |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 245 block | 259 block |

- Tier I: applied stagger 1,175; bursts stagger 1.9; status damage -. Foe-seconds a minute traced to it: stagger 64, gooed 11, knockedOut 4; all foe states (any cause): stunned 11, knockedOut 5, radiant 1. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 6, burn 2, rooted 2, chill 1, poison 1, radiance 1.
- Tier II: applied stagger 2,410, burn 233; bursts stagger 12.5; status damage burn 88. Foe-seconds a minute traced to it: stagger 68, knockedOut 27, burn 20, gooed 18; all foe states (any cause): stunned 34, knockedOut 28, radiant 1. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: stagger 6, burn 6, rooted 1.
- Tier III: applied stagger 4,127, burn 349; bursts stagger 26.7; status damage burn 140. Foe-seconds a minute traced to it: stagger 68, knockedOut 50, gooed 24, burn 24; all foe states (any cause): stunned 56, knockedOut 52, radiant 2. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: burn 4, stagger 3, chill 1, rooted 1.

### Harpooner (harpooner): ranged

Trait: Old Salt: Can't be soaked, and hits wet enemies 20% harder.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Reel In** (reelIn, cd 12.2s) | I | 100% · 5.3/m · 4s | 100% · 8.8/m · 2s | 100% · 9.6/m · 3s | 100% · 4.2/m · 4s | 100% · 6.3/m · 3s | 100% · 4.6/m · 3s | 100% · 6.8/m · 3s | 100% · 6.4/m · 3s | 100% · 6.3/m · 3s | 100% · 5.9/m · 3s | 100% · 7.6/m · 2s |
|  | II | 100% · 7.8/m · 3s | 100% · 11.4/m · 2s | 100% · 11.6/m · 3s | 100% · 7.4/m · 4s | 100% · 10.6/m · 3s | 100% · 8/m · 3s | 100% · 9.6/m · 3s | 100% · 10.3/m · 3s | 100% · 10.4/m · 2s | 100% · 9.6/m · 4s | 100% · 12.8/m · 2s |
|  | III | 100% · 10.3/m · 3s | 100% · 12.5/m · 3s | 100% · 14.9/m · 3s | 100% · 8.4/m · 3s | 100% · 11.4/m · 2s | 100% · 9.3/m · 3s | 100% · 11/m · 3s | 100% · 9.7/m · 3s | 100% · 10.2/m · 3s | 100% · 10/m · 3s | 100% · 13.6/m · 2s |
| **Rogue Wave** (rogueWave, cd 14.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.2/m · 3s | 100% · 5.8/m · 2s | 67% · 1.9/m · 4s | 83% · 1.8/m · 6s | 100% · 3/m · 3s | 100% · 3.4/m · 10s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.8/m · 2s | 100% · 9.2/m · 2s | 83% · 2.6/m · 10s | 83% · 1.6/m · 3s | 100% · 4/m · 3s | 100% · 2.7/m · 26s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.1/m · 2s | 100% · 6.7/m · 3s | 83% · 3.9/m · 9s | 83% · 2.4/m · 5s | 100% · 4.8/m · 3s | 100% · 3.2/m · 12s |
| **Drop Anchor** (anchorDrop, cd 17.1s) | I | 100% · 6/m · 2s | 100% · 5.9/m · 3s | 100% · 9.6/m · 3s | 100% · 4.3/m · 3s | 100% · 4.2/m · 3s | 100% · 4.8/m · 2s | 100% · 5.2/m · 2s | 100% · 5.7/m · 3s | 100% · 4.9/m · 2s | 100% · 4.4/m · 3s | 100% · 5.1/m · 6s |
|  | II | 100% · 7.9/m · 3s | 100% · 6.9/m · 3s | 100% · 6.7/m · 3s | 100% · 7/m · 3s | 100% · 8.1/m · 2s | 100% · 8/m · 3s | 100% · 8/m · 2s | 100% · 7.9/m · 3s | 100% · 6.9/m · 2s | 100% · 7.4/m · 3s | 100% · 8.6/m · 4s |
|  | III | 100% · 9.4/m · 3s | 100% · 10.7/m · 3s | 100% · 13.7/m · 3s | 100% · 8.8/m · 3s | 100% · 8.8/m · 3s | 100% · 8.9/m · 2s | 100% · 9.8/m · 2s | 100% · 9.3/m · 3s | 100% · 8.1/m · 3s | 100% · 8.4/m · 3s | 100% · 8/m · 8s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 672 dmg, 4.7 kills | 843 dmg, 0.1 s control, 4 kills | 1,702 dmg, 0.1 s control, 5.6 kills |
| Reel In | 217 dmg, 1.4 kills | 347 dmg, 6 s control, 1.5 kills | 774 dmg, 43.8 s control, 1.7 kills |
| Rogue Wave | 114 dmg, 1.1 kills | 251 dmg, 1.2 s control, 1.6 kills | 345 dmg, 5 s control, 0.9 kills |
| Drop Anchor | 371 dmg, 6.7 s control, 1.6 kills | 624 dmg, 10.1 s control, 2 kills | 1,846 dmg, 6.4 s control, 3.7 kills |
| Old Salt (trait) | 58 via others | 156 via others | 289 via others |
| other | - | 15 block | 30 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 419 block | 518 block |

- Tier I: applied wet 222; bursts -; status damage -. Foe-seconds a minute traced to it: wet 21; all foe states (any cause): stunned 7, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 10, rooted 2, burn 1, chill 1, radiance 1, poison 1, stunned 1.
- Tier II: applied stagger 678, wet 431; bursts wet 1.5, stagger 0.9; status damage -. Foe-seconds a minute traced to it: stagger 42, wet 32, knockedOut 2; all foe states (any cause): stunned 16, knockedOut 3, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 14, burn 5, stunned 4, knockedOut 2, rooted 2, poison 1.
- Tier III: applied stagger 951, wet 794; bursts stagger 9.1, wet 7; status damage -. Foe-seconds a minute traced to it: wet 38, knockedOut 19; all foe states (any cause): stunned 34, knockedOut 22, radiant 3. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 12, stunned 2, burn 2, radiance 1, rooted 1, knockedOut 1.

### Javelin Huntress (huntress): ranged

Trait: Finisher: Hits enemies below half health 25% harder.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Spear Lunge** (runningThrow, cd 11s) | I | 100% · 7.4/m · 3s | 92% · 5.1/m · 5s | 83% · 7.2/m · 3s | 100% · 7/m · 2s | 100% · 7.5/m · 2s | 100% · 6.7/m · 4s | 100% · 7.2/m · 2s | 100% · 6.4/m · 3s | 100% · 6/m · 3s | 100% · 5.4/m · 3s | 100% · 6.6/m · 5s |
|  | II | 100% · 11.5/m · 3s | 17% · 0.6/m · 15s | 17% · 0.6/m · 16s | 100% · 11/m · 2s | 100% · 7.4/m · 2s | 100% · 10.2/m · 3s | 100% · 11.3/m · 3s | 100% · 6.5/m · 4s | 100% · 5.5/m · 3s | 100% · 7/m · 3s | 100% · 6.4/m · 8s |
|  | III | 100% · 17.7/m · 3s | **0%** | **0%** | 100% · 15.4/m · 2s | 75% · 4.9/m · 8s | 100% · 13.8/m · 3s | 100% · 16.5/m · 2s | 83% · 6.9/m · 5s | 92% · 6.4/m · 6s | 100% · 9.2/m · 5s | 100% · 8.7/m · 10s |
| **Bound** (bound, cd 9.8s) | I | 100% · 6.2/m · 4s | **8%** | **0%** | 100% · 5.1/m · 7s | 100% · 6/m · 4s | 100% · 7.3/m · 2s | 100% · 7.2/m · 3s | 100% · 4.8/m · 4s | 83% · 2.8/m · 3s | 100% · 3.6/m · 3s | 100% · 3.8/m · 9s |
|  | II | 100% · 8.5/m · 7s | **0%** | **0%** | 100% · 6.7/m · 7s | 100% · 6.3/m · 9s | 100% · 8.5/m · 3s | 100% · 11.6/m · 3s | 75% · 2.8/m · 9s | 92% · 3.3/m · 4s | 100% · 5.2/m · 3s | 100% · 3.1/m · 16s |
|  | III | 92% · 9.6/m · 5s | **0%** | **0%** | 100% · 11.5/m · 3s | 58% · 3.4/m · 8s | 100% · 11.4/m · 3s | 100% · 13.9/m · 3s | 25% · 1.2/m · 9s | 100% · 4.4/m · 6s | 100% · 6/m · 5s | 100% · 4.1/m · 16s |
| **Javelin Rain** (prey, cd 15.9s) | I | 100% · 4.7/m · 4s | 100% · 5.5/m · 3s | 100% · 8.5/m · 3s | 100% · 4.4/m · 3s | 100% · 5.3/m · 4s | 100% · 4.9/m · 3s | 100% · 5.4/m · 4s | 100% · 5.3/m · 4s | 100% · 4.8/m · 3s | 100% · 4.6/m · 3s | 100% · 5.7/m · 3s |
|  | II | 100% · 8/m · 3s | 92% · 4.8/m · 7s | 83% · 6.1/m · 4s | 100% · 7.5/m · 4s | 100% · 7.4/m · 4s | 100% · 7.8/m · 3s | 100% · 8/m · 4s | 100% · 8.2/m · 4s | 100% · 7/m · 2s | 100% · 7.3/m · 4s | 100% · 8.6/m · 5s |
|  | III | 100% · 9.1/m · 3s | 100% · 6.8/m · 6s | 92% · 7/m · 3s | 100% · 7.3/m · 5s | 100% · 9.1/m · 3s | 100% · 8.2/m · 3s | 100% · 8.3/m · 4s | 100% · 8.1/m · 3s | 100% · 7.6/m · 3s | 100% · 7.3/m · 3s | 100% · 8.6/m · 6s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 757 dmg, 4.5 kills | 1,003 dmg, 3.6 kills | 1,882 dmg, 0.1 s control, 5.4 kills |
| Spear Lunge | 236 dmg, 77 block, 1.5 kills | 294 dmg, 62 block, 7.8 s control, 1.3 kills | 475 dmg, 87 block, 46.6 s control, 1.5 kills |
| Bound | 137 dmg, 6 block, 1.1 kills | 250 dmg, 9 block, 1.7 kills | 643 dmg, 21 block, 2.1 kills |
| Javelin Rain | 236 dmg, 1.5 kills | 443 dmg, 21.9 s control, 2.4 kills | 1,049 dmg, 24.6 s control, 2.4 kills |
| Finisher (trait) | 172 via others | 278 via others | 522 via others |
| bleed (status) | 190 dmg, 0.4 s control, 0.6 kills | 740 dmg, 1.4 s control, 0.4 kills | 1,389 dmg, 1.5 s control, 0.3 kills |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 257 block | 368 block |
| dodge | 27 block | 49 block | 60 block |

- Tier I: applied bleed 527; bursts bleed 2; status damage bleed 224. Foe-seconds a minute traced to it: bleed 38; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): untouchable 3. Under foes' statuses and states: stagger 5, rooted 2, burn 2, wet 1.
- Tier II: applied stagger 1,640, bleed 973; bursts stagger 8.1, bleed 5.7; status damage bleed 792. Foe-seconds a minute traced to it: stagger 39, bleed 35, knockedOut 13; all foe states (any cause): stunned 18, knockedOut 15, radiant 2. Its own buffs and states (s a minute): untouchable 4. Under foes' statuses and states: stagger 9, burn 6, rooted 1, stunned 1.
- Tier III: applied stagger 2,874, bleed 1,500; bursts stagger 22.8, bleed 6.7; status damage bleed 1,456. Foe-seconds a minute traced to it: bleed 36, knockedOut 30, stagger 22; all foe states (any cause): stunned 35, knockedOut 32, radiant 3. Its own buffs and states (s a minute): untouchable 4. Under foes' statuses and states: burn 6, stagger 2, rooted 1, radiance 1.

### Marksman (marksman): ranged

Trait: Long Shot: He reaches 40% further than anyone, and his shots hit up to 60% harder the nearer the edge of his reach.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Aimed Shot** (aimedShot, cd 12.2s) | I | 100% · 7.2/m · 3s | 100% · 6.8/m · 2s | 100% · 9.8/m · 3s | 100% · 2.9/m · 2s | 100% · 6.5/m · 2s | 100% · 3.1/m · 3s | 92% · 5.2/m · 3s | 100% · 6.7/m · 3s | 100% · 6.1/m · 3s | 100% · 5.8/m · 3s | 100% · 7.8/m · 1s |
|  | II | 100% · 10.6/m · 2s | 100% · 11.8/m · 2s | 100% · 11.6/m · 3s | 100% · 10.2/m · 2s | 100% · 10.9/m · 2s | 100% · 8.6/m · 3s | 100% · 7.3/m · 3s | 100% · 11/m · 3s | 100% · 10.1/m · 3s | 100% · 8.8/m · 3s | 100% · 12.8/m · 1s |
|  | III | 100% · 13.3/m · 2s | 100% · 13.5/m · 2s | 100% · 12.2/m · 3s | 100% · 12/m · 2s | 100% · 12.9/m · 2s | 100% · 11.5/m · 3s | 100% · 8.9/m · 3s | 100% · 12.6/m · 3s | 100% · 11.5/m · 2s | 100% · 11.5/m · 3s | 100% · 13.5/m · 1s |
| **Bayonet** (bayonet, cd 9.8s) | I | 100% · 4.8/m · 6s | **0%** | **0%** | 100% · 5.3/m · 7s | 92% · 2.4/m · 9s | 100% · 6.7/m · 5s | 100% · 6.7/m · 4s | 67% · 2.3/m · 10s | **0%** | 58% · 1.7/m · 10s | 100% · 1.3/m · 41s |
|  | II | 100% · 5.8/m · 7s | **0%** | **0%** | 100% · 5.8/m · 7s | 100% · 2.5/m · 10s | 100% · 9.7/m · 6s | 100% · 9.8/m · 4s | 67% · 2.7/m · 11s | **8%** | 75% · 2.3/m · 10s | 75% · 1.5/m · 40s |
|  | III | 42% · 2/m · 8s | **0%** | **0%** | 75% · 2.3/m · 9s | 17% · 0.4/m · 18s | 92% · 6/m · 4s | 100% · 9.2/m · 5s | **8%** | 17% · 0.4/m · 25s | 42% · 1/m · 12s | 88% · 2/m · 12s |
| **Ricochet** (ricochet, cd 14.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.9/m · 4s | 100% · 6/m · 4s | 100% · 3.5/m · 3s | 100% · 3.7/m · 3s | 100% · 3.7/m · 3s | 100% · 4.9/m · 5s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.2/m · 4s | 100% · 7.3/m · 3s | 100% · 5.3/m · 3s | 100% · 6.4/m · 2s | 100% · 6.4/m · 4s | 100% · 7.2/m · 7s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.8/m · 4s | 100% · 8.3/m · 3s | 92% · 5.5/m · 3s | 100% · 7/m · 2s | 100% · 7.2/m · 3s | 100% · 7.6/m · 4s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 675 dmg, 4.1 kills | 907 dmg, 3.3 kills | 1,838 dmg, 3.9 kills |
| Aimed Shot | 445 dmg, 70 via others, 2 kills | 901 dmg, 243 via others, 3.1 kills | 2,004 dmg, 429 via others, 23.1 s control, 4.4 kills |
| Bayonet | 92 dmg, 0.3 kills | 128 dmg, 15.8 s control, 0.4 kills | 341 dmg, 8.8 s control, 0.8 kills |
| Ricochet | 151 dmg, 1.2 kills | 286 dmg, 1.3 kills | 655 dmg, 2.1 kills |
| Long Shot (trait) | 233 via others | 334 via others | 839 via others |
| other | - | 3 block | 2 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 258 block | 334 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: targeted 19; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 7, burn 1, rooted 1, chill 1, poison 1, wet 1.
- Tier II: applied stagger 411; bursts stagger 4; status damage -. Foe-seconds a minute traced to it: targeted 45, knockedOut 8; all foe states (any cause): stunned 10, knockedOut 9, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 10, burn 5, stunned 1, rooted 1.
- Tier III: applied stagger 273; bursts stagger 2.2; status damage -. Foe-seconds a minute traced to it: targeted 36, knockedOut 4; all foe states (any cause): stunned 17, knockedOut 15, radiant 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, burn 2, stunned 1, rooted 1, wet 1.

### Ninja (ninja): ranged

Trait: Assassin: Her shuriken hit 50% harder from behind.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Kunai Rain** (shurikenFan, cd 11s) | I | 100% · 6.5/m · 3s | 83% · 3/m · 11s | 75% · 3.9/m · 8s | 100% · 6.4/m · 2s | 100% · 6.5/m · 2s | 100% · 6.5/m · 3s | 100% · 6.7/m · 3s | 100% · 5.2/m · 4s | 100% · 4.9/m · 3s | 100% · 5.4/m · 3s | 100% · 6.1/m · 4s |
|  | II | 100% · 9.5/m · 3s | 17% · 0.4/m · 12s | **8%** | 100% · 9.2/m · 3s | 100% · 10.3/m · 2s | 100% · 8.6/m · 3s | 100% · 11/m · 2s | 100% · 5/m · 7s | 100% · 5.2/m · 5s | 100% · 6.9/m · 4s | 100% · 6.8/m · 10s |
|  | III | 100% · 10.6/m · 3s | 17% · 0.5/m · 12s | **8%** | 100% · 9.3/m · 2s | 100% · 6.9/m · 4s | 100% · 8.5/m · 3s | 100% · 10.5/m · 2s | 92% · 4.9/m · 4s | 100% · 4.8/m · 7s | 100% · 6/m · 3s | 100% · 6.3/m · 8s |
| **Substitution** (substitution, cd 14.6s) | I | 100% · 3.2/m · 4s | 100% · 6.2/m · 1s | 100% · 6.8/m · 1s | 100% · 3.4/m · 3s | 83% · 1.1/m · 31s | 92% · 2.5/m · 7s | 100% · 4.8/m · 2s | 100% · 4.9/m · 1s | 100% · 2.9/m · 1s | 100% · 3.8/m · 4s | 100% · 1.4/m · 43s |
|  | II | 100% · 4/m · 3s | 100% · 5.4/m · 1s | 100% · 5.9/m · 1s | 100% · 3.9/m · 2s | 33% · 0.7/m · 37s | 92% · 1.9/m · 11s | 100% · 3.8/m · 3s | 100% · 4.7/m · 1s | 100% · 3.1/m · 2s | 100% · 3.8/m · 6s | 88% · 1.5/m · 57s |
|  | III | 100% · 6.1/m · 3s | 100% · 9.4/m · 1s | 100% · 8.9/m · 1s | 100% · 5.4/m · 3s | 17% · 0.2/m · 35s | 50% · 1/m · 24s | 92% · 4.8/m · 3s | 100% · 7.4/m · 1s | 100% · 3.9/m · 5s | 100% · 4.2/m · 5s | 100% · 1.8/m · 14s |
| **Caltrops** (caltrops, cd 14.6s) | I | 100% · 5.8/m · 2s | 33% · 1.1/m · 12s | 17% · 0.7/m · 14s | 100% · 5/m · 3s | 100% · 5.1/m · 3s | 100% · 5.1/m · 2s | 100% · 5.1/m · 3s | 100% · 4/m · 3s | 100% · 3.4/m · 3s | 100% · 3.9/m · 3s | 100% · 4.6/m · 6s |
|  | II | 100% · 8.3/m · 3s | **0%** | **0%** | 100% · 7.3/m · 3s | 100% · 6.9/m · 4s | 100% · 7.8/m · 3s | 100% · 8.4/m · 3s | 100% · 4.2/m · 6s | 100% · 3.9/m · 5s | 100% · 5/m · 3s | 100% · 5/m · 9s |
|  | III | 100% · 9.3/m · 3s | 17% · 0.5/m · 13s | **0%** | 100% · 7.5/m · 4s | 100% · 4.1/m · 11s | 100% · 7.9/m · 3s | 100% · 9.2/m · 3s | 100% · 3.7/m · 10s | 100% · 4.3/m · 4s | 100% · 4.5/m · 5s | 100% · 4.5/m · 12s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 694 dmg, 3.8 kills | 852 dmg, 3.1 kills | 1,479 dmg, 0.2 s control, 3.4 kills |
| Kunai Rain | 57 dmg, 2 block, 0.2 kills | 116 dmg, 9 block, 0.3 kills | 212 dmg, 7 block, 11.1 s control, 0.4 kills |
| Substitution | 49 block | 86 block | 173 block |
| Caltrops | 50 dmg, 1 block, 2.9 s control, 0.2 kills | 93 dmg, 2 block, 39.6 s control, 0.3 kills | 106 dmg, 1 block, 48.7 s control, 0.2 kills |
| Assassin (trait) | 13 via others | 18 via others | 35 via others |
| other | 1 block | - | - |
| chill (status) | - | - | - |
| poison (status) | - | - | 596 dmg, 4.7 s control, 1 kills |
| armour | - | 218 block | 322 block |
| dodge | 68 block | 107 block | 176 block |
| untouchable | 3 block | 3 block | 7 block |

- Tier I: applied stagger 439; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 30, knockedOut 1; all foe states (any cause): stunned 4, knockedOut 1, radiant 1. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: stagger 7, rooted 2, burn 2, poison 1.
- Tier II: applied stagger 1,338; bursts stagger 9; status damage -. Foe-seconds a minute traced to it: stagger 27, knockedOut 21, logSmoke 4; all foe states (any cause): stunned 25, knockedOut 22, radiant 1, untouchable 1. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: stagger 11, burn 5, rooted 2, stunned 1.
- Tier III: applied stagger 1,314, poison 912; bursts stagger 7.7, poison 4.9; status damage poison 652. Foe-seconds a minute traced to it: poison 77, stagger 22, sickened 20, knockedOut 17, logSmoke 4; all foe states (any cause): stunned 22, sickened 20, knockedOut 19, radiant 3, untouchable 1. Its own buffs and states (s a minute): untouchable 1. Under foes' statuses and states: burn 6, stagger 6, rooted 2, stunned 1, poison 1, chill 1.

### Pirate (pirate): skirmish

Trait: Plunder: With her in the party, one enemy in three that falls spills extra coins. A gatherer: on the wagon road she goes for loose gold before a fight, and further for it.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Point Blank** (pointBlank, cd 8.5s) | I | 100% · 8.5/m · 2s | 100% · 6.6/m · 5s | 100% · 7/m · 4s | 100% · 8.3/m · 2s | 100% · 8.2/m · 3s | 100% · 8/m · 3s | 100% · 8/m · 3s | 100% · 7.7/m · 3s | 100% · 7.9/m · 2s | 100% · 6.7/m · 3s | 100% · 7.8/m · 3s |
|  | II | 100% · 14.3/m · 3s | 100% · 10.4/m · 5s | 100% · 9.6/m · 6s | 100% · 13.3/m · 2s | 100% · 14.2/m · 3s | 100% · 13.9/m · 3s | 100% · 13.7/m · 3s | 100% · 12/m · 3s | 100% · 12/m · 3s | 100% · 12.7/m · 3s | 100% · 11/m · 5s |
|  | III | 100% · 15.3/m · 3s | 100% · 7.8/m · 4s | 100% · 10.2/m · 5s | 100% · 13.9/m · 2s | 100% · 15.6/m · 3s | 100% · 15.4/m · 3s | 100% · 14.5/m · 3s | 100% · 13.3/m · 4s | 100% · 13.4/m · 3s | 100% · 13.7/m · 3s | 100% · 12.3/m · 3s |
| **Grog** (grog, cd 19.5s) | I | 100% · 2.5/m · 13s | 100% · 2.4/m · 11s | 100% · 3.5/m · 6s | 100% · 2.9/m · 25s | 100% · 2.5/m · 19s | 100% · 3/m · 13s | 100% · 3/m · 10s | 100% · 2.3/m · 24s | 50% · 0.6/m · 38s | 100% · 1.8/m · 21s | 25% · <0.1/m · 120s |
|  | II | 100% · 3.4/m · 22s | 100% · 4.5/m · 14s | 100% · 4.8/m · 13s | 100% · 1.5/m · 43s | 67% · 1.1/m · 38s | 92% · 1.6/m · 29s | 50% · 1.2/m · 20s | **0%** | 17% · 0.2/m · 47s | 75% · 1.5/m · 17s | **0%** |
|  | III | 50% · 1.6/m · 18s | 75% · 3.4/m · 10s | 50% · 2.7/m · 10s | 33% · 0.7/m · 30s | **8%** | 42% · 1/m · 19s | 50% · 1.6/m · 17s | **0%** | **0%** | 67% · 1.8/m · 9s | **0%** |
| **Broadside** (broadside, cd 18.3s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.6/m · 2s | 100% · 4.5/m · 2s | 92% · 1.4/m · 3s | 100% · 2.6/m · 2s | 100% · 2.1/m · 3s | 100% · 3.8/m · 14s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.2/m · 2s | 100% · 6.9/m · 2s | 75% · 1.8/m · 3s | 100% · 3.8/m · 2s | 100% · 4/m · 7s | 100% · 5.6/m · 5s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5/m · 2s | 100% · 7.1/m · 3s | 75% · 2.3/m · 4s | 100% · 4.7/m · 2s | 100% · 4.6/m · 3s | 100% · 5.3/m · 10s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 499 dmg, 3 kills | 823 dmg, 3.6 kills | 1,385 dmg, 3.8 kills |
| Point Blank | 183 dmg, 62 via others, 0.7 kills | 369 dmg, 189 via others, 19.2 s control, 1.3 kills | 1,535 dmg, 465 via others, 45.2 s control, 3.2 kills |
| Grog | 213 heal, 35 block | 404 heal, 53 block | 458 heal, 41 block |
| Broadside | 100 dmg, 0.5 s control, 0.5 kills | 234 dmg, 2.8 s control, 1.1 kills | 549 dmg, 4 s control, 1 kills |
| other | 2 block | - | - |
| chill (status) | - | 2 dmg | - |
| armour | - | 615 block | 929 block |
| dodge | 69 block | 118 block | 180 block |

- Tier I: applied stagger 77; bursts -; status damage -. Foe-seconds a minute traced to it: targeted 32, stagger 6; all foe states (any cause): radiant 1, stunned 1. Its own buffs and states (s a minute): grog 11. Under foes' statuses and states: stagger 10, burn 3, rooted 3, chill 2, wet 1, poison 1, radiance 1, stunned 1.
- Tier II: applied stagger 1,157; bursts stagger 5.1; status damage -. Foe-seconds a minute traced to it: targeted 49, stagger 41, knockedOut 11; all foe states (any cause): stunned 15, knockedOut 12, radiant 1. Its own buffs and states (s a minute): grog 8. Under foes' statuses and states: stagger 14, burn 8, stunned 3, rooted 3, radiance 2, poison 1, knockedOut 1, wet 1.
- Tier III: applied stagger 2,308; bursts stagger 12.4; status damage -. Foe-seconds a minute traced to it: targeted 53, stagger 50, knockedOut 24; all foe states (any cause): stunned 30, knockedOut 25, radiant 2. Its own buffs and states (s a minute): grog 4. Under foes' statuses and states: stagger 12, burn 5, rooted 3, stunned 3, radiance 2, chill 1, knockedOut 1, poison 1.

### Slinger (slinger): ranged

Trait: Watchful: Allies near him shake off stuns and sleep 40% faster.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Stunning Stone** (stunStone, cd 9.8s) | I | 100% · 7.8/m · 2s | 100% · 9.3/m · 2s | 100% · 8.1/m · 3s | 100% · 7.5/m · 2s | 100% · 7.3/m · 2s | 100% · 7.2/m · 3s | 100% · 8.1/m · 3s | 100% · 6.9/m · 4s | 100% · 7/m · 3s | 100% · 6.1/m · 3s | 100% · 8.1/m · 2s |
|  | II | 100% · 12.9/m · 2s | 100% · 12.5/m · 2s | 100% · 12.8/m · 3s | 100% · 12.7/m · 2s | 100% · 12.7/m · 2s | 100% · 11.8/m · 3s | 100% · 11/m · 3s | 100% · 11.9/m · 3s | 100% · 11.7/m · 3s | 100% · 11.2/m · 4s | 100% · 14.2/m · 1s |
|  | III | 100% · 15/m · 2s | 100% · 15.2/m · 2s | 100% · 14.3/m · 3s | 100% · 14.9/m · 2s | 100% · 14.8/m · 2s | 100% · 13.5/m · 3s | 100% · 13.2/m · 3s | 100% · 13.6/m · 3s | 100% · 13.1/m · 3s | 100% · 12.9/m · 4s | 100% · 15/m · 1s |
| **Ram** (ramCharge, cd 15.9s) | I | 100% · 4.8/m · 3s | 100% · 5.3/m · 3s | 100% · 6/m · 3s | 100% · 4.4/m · 3s | 100% · 4.8/m · 3s | 100% · 4.6/m · 3s | 100% · 5.6/m · 2s | 100% · 4.4/m · 3s | 100% · 4.5/m · 3s | 100% · 4.2/m · 3s | 100% · 5.6/m · 3s |
|  | II | 100% · 7.6/m · 3s | 100% · 5.4/m · 7s | 92% · 5.5/m · 5s | 100% · 8/m · 3s | 100% · 7.6/m · 3s | 100% · 7.6/m · 2s | 100% · 8.1/m · 2s | 100% · 7.4/m · 3s | 100% · 6.3/m · 3s | 100% · 6.9/m · 3s | 100% · 7.7/m · 6s |
|  | III | 100% · 8.3/m · 3s | 75% · 3.9/m · 7s | 92% · 6.8/m · 5s | 100% · 8/m · 3s | 100% · 7.5/m · 3s | 100% · 7.8/m · 2s | 100% · 8.6/m · 2s | 100% · 7.2/m · 3s | 100% · 7.1/m · 2s | 100% · 7.3/m · 3s | 100% · 8.2/m · 4s |
| **Counting Sheep** (gravel, cd 14.6s) | I | 100% · 4.8/m · 3s | 100% · 5.3/m · 3s | 100% · 6/m · 3s | 100% · 5/m · 3s | 100% · 4.8/m · 3s | 100% · 5/m · 2s | 100% · 5.6/m · 3s | 100% · 4.9/m · 4s | 100% · 4.7/m · 2s | 100% · 4.3/m · 3s | 100% · 5.7/m · 6s |
|  | II | 100% · 8/m · 3s | 92% · 5.4/m · 6s | 83% · 5.2/m · 4s | 100% · 8.2/m · 3s | 100% · 8.2/m · 3s | 100% · 7.8/m · 3s | 100% · 8.5/m · 3s | 100% · 7.9/m · 5s | 100% · 6.8/m · 3s | 100% · 7.5/m · 3s | 100% · 7.9/m · 6s |
|  | III | 100% · 8.7/m · 3s | 75% · 3.9/m · 5s | 83% · 5.9/m · 5s | 100% · 8/m · 4s | 100% · 7.5/m · 3s | 100% · 8.8/m · 2s | 100% · 8.8/m · 2s | 100% · 7.4/m · 4s | 100% · 7.7/m · 2s | 100% · 7.8/m · 3s | 100% · 8.7/m · 5s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 665 dmg, 1.8 s control, 4.2 kills | 991 dmg, 6.7 s control, 3.8 kills | 1,781 dmg, 24.5 s control, 4.3 kills |
| Stunning Stone | 156 dmg, 5.3 s control, 1.2 kills | 317 dmg, 11.9 s control, 1 kills | 576 dmg, 13.8 s control, 1.4 kills |
| Ram | 162 dmg, 0.9 kills | 253 dmg, 40.4 s control, 1.2 kills | 581 dmg, 50.5 s control, 1.2 kills |
| other | - | 1 block | 1 block |
| chill (status) | - | 3 dmg | 1 dmg |
| armour | - | 191 block | 277 block |

- Tier I: applied sleepy 547, stagger 407; bursts sleepy 2.2; status damage -. Foe-seconds a minute traced to it: sleepy 41, stagger 28, asleep 6, knockedOut 1; all foe states (any cause): stunned 7, asleep 6, radiant 1, knockedOut 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, rooted 2, burn 2, chill 1.
- Tier II: applied stagger 1,718, sleepy 753; bursts stagger 11, sleepy 5.5; status damage -. Foe-seconds a minute traced to it: stagger 33, knockedOut 24, sleepy 22, asleep 15; all foe states (any cause): stunned 31, knockedOut 25, asleep 15, radiant 2. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, burn 4, rooted 1.
- Tier III: applied stagger 3,323, sleepy 1,056; bursts stagger 22.6, sleepy 7.8; status damage -. Foe-seconds a minute traced to it: knockedOut 37, stagger 33, asleep 21, sleepy 15; all foe states (any cause): stunned 41, knockedOut 38, asleep 21, radiant 3. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 4, stagger 4, rooted 1.

### Trapper (trapper): ranged

Trait: Trapper's Eye: Enemies that are held or rooted take 30% more from him.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Jaw Trap** (jawTrap, cd 11s) | I | 100% · 9.1/m · 2s | **0%** | **0%** | 100% · 7.3/m · 2s | 100% · 6.9/m · 2s | 100% · 7.1/m · 3s | 100% · 6.4/m · 3s | 100% · 6.7/m · 3s | 100% · 3.2/m · 3s | 100% · 5.5/m · 3s | 100% · 7/m · 2s |
|  | II | 100% · 11.1/m · 3s | **0%** | **0%** | 100% · 11.4/m · 2s | 100% · 11.6/m · 2s | 100% · 11.1/m · 3s | 100% · 11.1/m · 3s | 100% · 6.7/m · 3s | 100% · 6.1/m · 3s | 100% · 7.8/m · 3s | 100% · 12/m · 2s |
|  | III | 100% · 10.7/m · 3s | **0%** | **0%** | 100% · 11/m · 2s | 100% · 10.9/m · 2s | 100% · 11.5/m · 3s | 100% · 11.9/m · 3s | 100% · 7.8/m · 3s | 100% · 5.5/m · 3s | 100% · 7/m · 3s | 100% · 10.6/m · 3s |
| **Double Barrel** (snareNet, cd 13.4s) | I | 100% · 6.3/m · 2s | 17% · 1.2/m · 6s | 50% · 4.1/m · 5s | 100% · 5.6/m · 2s | 100% · 5.8/m · 3s | 100% · 5.8/m · 2s | 100% · 6.4/m · 2s | 100% · 5.6/m · 3s | 100% · 4.3/m · 2s | 100% · 4.6/m · 3s | 100% · 5.9/m · 6s |
|  | II | 100% · 8.4/m · 2s | 33% · 1.2/m · 11s | **8%** | 100% · 8.1/m · 3s | 100% · 9.3/m · 3s | 100% · 9.3/m · 2s | 100% · 9.6/m · 2s | 100% · 5.3/m · 4s | 100% · 4/m · 6s | 100% · 6.6/m · 3s | 100% · 5.5/m · 12s |
|  | III | 100% · 9.3/m · 2s | 17% · 0.8/m · 15s | **0%** | 100% · 8.7/m · 2s | 100% · 9.7/m · 3s | 100% · 10/m · 2s | 100% · 10.7/m · 2s | 100% · 5.5/m · 4s | 92% · 4.6/m · 3s | 100% · 5.5/m · 3s | 100% · 6.7/m · 7s |
| **Bush** (tripwire, cd 17.1s) | I | 100% · 5.4/m · 12s | 58% · 4.1/m · 6s | 83% · 6.8/m · 8s | 100% · 2.1/m · 30s | 17% · 0.3/m · 25s | 100% · 3.1/m · 20s | 100% · 6.4/m · 10s | 100% · 4.5/m · 13s | 92% · 1.7/m · 28s | 100% · 3.4/m · 15s | **0%** |
|  | II | 100% · 2.9/m · 18s | 50% · 1.8/m · 14s | 17% · 0.5/m · 17s | 100% · 1/m · 60s | **0%** | 58% · 1/m · 28s | 33% · 1/m · 18s | **0%** | 50% · 0.6/m · 18s | 100% · 2.4/m · 28s | **0%** |
|  | III | 100% · 3.4/m · 17s | 25% · 1.2/m · 10s | 25% · 0.9/m · 10s | 17% · 0.2/m · 46s | **0%** | 25% · 0.5/m · 24s | 33% · 1.1/m · 14s | 50% · 1.1/m · 25s | 75% · 1.6/m · 19s | 83% · 1.8/m · 18s | **0%** |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 659 dmg, 1.8 kills | 772 dmg, 2.2 kills | 1,372 dmg, 0.6 s control, 2.7 kills |
| Jaw Trap | 86 dmg, 0.2 kills | 178 dmg, 0.3 s control, 0.6 kills | 363 dmg, 1.5 s control, 0.6 kills |
| Double Barrel | 194 dmg, 0.4 kills | 254 dmg, 11.7 s control, 0.7 kills | 596 dmg, 13.4 s control, 1.2 kills |
| Trapper's Eye (trait) | - | 35 via others | 113 via others |
| other | 7 heal | 9 heal, 1 block | 17 heal, 1 block |
| chill (status) | - | - | - |
| armour | - | 357 block | 584 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: held 9, trapped 9; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): ethereal 3, hidden 3. Under foes' statuses and states: stagger 6, rooted 3, burn 2, chill 1, poison 1.
- Tier II: applied stagger 643; bursts stagger 2.7; status damage -. Foe-seconds a minute traced to it: stagger 27, held 19, trapped 18, knockedOut 7; all foe states (any cause): stunned 10, knockedOut 8, radiant 1. Its own buffs and states (s a minute): ethereal 1, hidden 1. Under foes' statuses and states: stagger 8, burn 5, rooted 2, stunned 1.
- Tier III: applied stagger 642; bursts stagger 2.6; status damage -. Foe-seconds a minute traced to it: held 28, trapped 27, stagger 27, knockedOut 8; all foe states (any cause): stunned 12, knockedOut 10, radiant 3. Its own buffs and states (s a minute): ethereal 2, hidden 2. Under foes' statuses and states: stagger 6, burn 5, rooted 3, stunned 1, chill 1.

### Gladiator (gladiator): melee

Trait: Duelist: One on one, with no other enemy on him, he hits his foe 35% harder and takes 25% less from it.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Spear of Ares** (netThrow, cd 12.2s) | I | 100% · 6.9/m · 3s | 100% · 7.2/m · 2s | 100% · 5.5/m · 3s | 100% · 5.7/m · 2s | 100% · 5.9/m · 3s | 100% · 6/m · 3s | 100% · 6.1/m · 3s | 100% · 6.4/m · 3s | 100% · 5.9/m · 3s | 100% · 3.8/m · 3s | 100% · 7.3/m · 2s |
|  | II | 100% · 10.9/m · 2s | 100% · 10.6/m · 2s | 100% · 11.5/m · 3s | 100% · 9.9/m · 3s | 100% · 10.3/m · 3s | 100% · 9.4/m · 4s | 100% · 9.8/m · 3s | 100% · 10.3/m · 4s | 100% · 9.5/m · 3s | 100% · 9.4/m · 3s | 100% · 11.4/m · 2s |
|  | III | 100% · 11.4/m · 3s | 100% · 12/m · 2s | 100% · 12.1/m · 3s | 100% · 11/m · 2s | 100% · 11.9/m · 3s | 100% · 10.8/m · 3s | 100% · 11.4/m · 2s | 100% · 11.6/m · 3s | 100% · 10.8/m · 3s | 100% · 7.7/m · 4s | 100% · 12.6/m · 2s |
| **Arena** (showboat, cd 17.1s) | I | **0%** | **0%** | **0%** | **0%** | 100% · 3.9/m · 3s | 100% · 3.1/m · 2s | 100% · 4.7/m · 2s | 92% · 2.3/m · 2s | 100% · 2.5/m · 3s | 100% · 1.7/m · 3s | 100% · 4.1/m · 12s |
|  | II | **0%** | **0%** | **0%** | **0%** | 100% · 7.5/m · 3s | 100% · 7.5/m · 2s | 100% · 7/m · 2s | 75% · 2.7/m · 3s | 100% · 4.6/m · 2s | 100% · 4.7/m · 3s | 100% · 5/m · 16s |
|  | III | **0%** | **0%** | **0%** | **0%** | 100% · 8.9/m · 3s | 100% · 8.7/m · 2s | 100% · 8/m · 2s | 83% · 3.6/m · 2s | 100% · 4.5/m · 3s | 100% · 4/m · 3s | 100% · 5.7/m · 12s |
| **Shield Rush** (shieldRush, cd 11s) | I | 100% · 6.9/m · 3s | 100% · 7.7/m · 3s | 100% · 9.3/m · 3s | 100% · 6.1/m · 3s | 100% · 5.9/m · 3s | 100% · 6/m · 4s | 100% · 6.3/m · 3s | 100% · 7/m · 3s | 100% · 6.5/m · 3s | 100% · 3.8/m · 3s | 100% · 7.3/m · 3s |
|  | II | 100% · 11.1/m · 3s | 100% · 11.7/m · 3s | 100% · 12.6/m · 3s | 100% · 11.3/m · 3s | 100% · 11.5/m · 3s | 100% · 9.8/m · 3s | 100% · 10.6/m · 3s | 100% · 10.5/m · 3s | 100% · 10.6/m · 3s | 100% · 10.2/m · 3s | 100% · 12/m · 3s |
|  | III | 100% · 12.1/m · 2s | 100% · 12.8/m · 3s | 100% · 13.4/m · 3s | 100% · 10.8/m · 3s | 100% · 11.9/m · 3s | 100% · 11.2/m · 3s | 100% · 11.6/m · 3s | 100% · 11.6/m · 3s | 100% · 11.7/m · 3s | 100% · 8.5/m · 3s | 100% · 12.3/m · 5s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 716 dmg, 3.8 kills | 1,254 dmg, 4.3 kills | 2,022 dmg, 4.9 kills |
| Spear of Ares | 256 dmg, 1.3 kills | 429 dmg, 17.9 s control, 1.9 kills | 903 dmg, 14 s control, 2 kills |
| Arena | - | 207 heal | 305 dmg, 289 heal, 0.7 kills |
| Shield Rush | 272 dmg, 32 block, 0.6 s control, 1.6 kills | 487 dmg, 93 block, 14.4 s control, 1.5 kills | 638 dmg, 175 block, 22.5 s control, 1.5 kills |
| Duelist (trait) | 164 block, 296 via others | 262 block, 570 via others | 396 block, 984 via others |
| other | 1 block | 2 block | 2 block |
| chill (status) | - | 2 dmg | 1 dmg |
| armour | 168 block | 594 block | 889 block |

- Tier I: applied stagger 292; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 16; all foe states (any cause): radiant 1, stunned 1. Its own buffs and states (s a minute): shieldRush 4. Under foes' statuses and states: stagger 11, chill 4, burn 4, rooted 3, wet 1, stunned 1, poison 1.
- Tier II: applied stagger 1,482; bursts stagger 7.2; status damage -. Foe-seconds a minute traced to it: stagger 35, knockedOut 15; all foe states (any cause): stunned 19, knockedOut 17, radiant 2. Its own buffs and states (s a minute): shieldRush 7. Under foes' statuses and states: stagger 13, burn 7, rooted 2, stunned 2, poison 2, wet 2, radiance 1.
- Tier III: applied stagger 1,508; bursts stagger 7.5; status damage -. Foe-seconds a minute traced to it: stagger 33, knockedOut 15, pinned 12; all foe states (any cause): stunned 23, knockedOut 17, radiant 3. Its own buffs and states (s a minute): shieldRush 7. Under foes' statuses and states: stagger 13, burn 6, stunned 3, chill 2, rooted 2, wet 1, poison 1, knockedOut 1.

### Jester (jester): skirmish

Trait: Pratfall: A quarter of the blows swung at him miss, and whoever swung is spun round to face away.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Swap** (mock, cd 13.4s) | I | 100% · 5.8/m · 3s | 100% · 5.9/m · 2s | 100% · 6.1/m · 3s | 100% · 5.5/m · 2s | 100% · 5.5/m · 2s | 100% · 5.7/m · 3s | 100% · 5.5/m · 3s | 100% · 5.7/m · 3s | 100% · 5.4/m · 3s | 100% · 4.9/m · 3s | 100% · 6.6/m · 2s |
|  | II | 100% · 9.4/m · 3s | 100% · 9.6/m · 2s | 100% · 9.5/m · 3s | 100% · 9/m · 2s | 100% · 9.7/m · 2s | 100% · 9.1/m · 3s | 100% · 9/m · 3s | 100% · 9.3/m · 3s | 100% · 9/m · 3s | 100% · 8.5/m · 3s | 100% · 11.3/m · 2s |
|  | III | 100% · 9.3/m · 3s | 100% · 10.9/m · 2s | 100% · 12.3/m · 3s | 100% · 10.1/m · 2s | 100% · 10.9/m · 2s | 100% · 9.9/m · 3s | 100% · 10.2/m · 3s | 100% · 9.1/m · 3s | 100% · 10.4/m · 3s | 100% · 9.2/m · 3s | 100% · 12.2/m · 2s |
| **Befuddle** (befuddle, cd 12.2s) | I | 100% · 6.1/m · 1s | **0%** | 100% · 7.2/m · 2s | 100% · 5.8/m · 1s | 100% · 4.8/m · 5s | 100% · 5.8/m · 2s | 100% · 6.4/m · 2s | 100% · 4.5/m · 2s | 92% · 1.7/m · 2s | 100% · 3.4/m · 2s | 100% · 4.2/m · 7s |
|  | II | 100% · 7.3/m · 1s | **0%** | 100% · 7.3/m · 2s | 100% · 6.9/m · 2s | 100% · 5.2/m · 4s | 100% · 6.6/m · 2s | 100% · 7.6/m · 2s | 100% · 5/m · 2s | 100% · 1.7/m · 1s | 100% · 4.6/m · 1s | 100% · 4.4/m · 11s |
|  | III | 100% · 8.1/m · 1s | 58% · 2.1/m · 7s | 100% · 8.4/m · 2s | 100% · 7.6/m · 1s | 83% · 2.9/m · 12s | 100% · 6.6/m · 2s | 100% · 8.9/m · 1s | 100% · 6.5/m · 2s | 92% · 3.2/m · 2s | 100% · 4.5/m · 1s | 100% · 4.9/m · 11s |
| **Juggling Act** (juggle, cd 12.2s) | I | 100% · 6.5/m · 3s | 100% · 6.2/m · 3s | 100% · 7.2/m · 3s | 100% · 6/m · 3s | 100% · 6.3/m · 3s | 100% · 6.1/m · 2s | 100% · 6.5/m · 2s | 100% · 6.5/m · 3s | 100% · 5.9/m · 2s | 100% · 5.5/m · 3s | 100% · 6.9/m · 3s |
|  | II | 100% · 11/m · 3s | 100% · 10.4/m · 3s | 100% · 11.3/m · 3s | 100% · 10.5/m · 3s | 100% · 11.2/m · 3s | 100% · 10.7/m · 2s | 100% · 10.9/m · 2s | 100% · 10.9/m · 3s | 100% · 10.5/m · 2s | 100% · 9.9/m · 3s | 100% · 11.8/m · 2s |
|  | III | 100% · 12.5/m · 2s | 100% · 10.6/m · 3s | 100% · 13.8/m · 3s | 100% · 11.4/m · 3s | 100% · 11.8/m · 3s | 100% · 12/m · 2s | 100% · 11.3/m · 3s | 100% · 12.3/m · 3s | 100% · 11.3/m · 2s | 100% · 10.1/m · 3s | 100% · 12.9/m · 2s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 536 dmg, 3.3 kills | 826 dmg, 3.3 kills | 1,044 dmg, 3.1 kills |
| Swap | 1 block, 6.4 s control | 1 block, 23 s control | 3 block, 28 s control |
| Befuddle | 75 dmg, 67 block, 2.1 s control, 0.3 kills | 97 dmg, 113 block, 1.6 s control, 0.2 kills | 215 dmg, 201 block, 14.7 s control, 0.4 kills |
| Juggling Act | 301 dmg, 1.2 kills | 585 dmg, 2.1 kills | 2,136 dmg, 5.4 s control, 4.9 kills |
| Pratfall (trait) | 97 block, 0.5 s control | 169 block, 1.7 s control | 206 block, 1.4 s control |
| other | 3 block | - | - |
| burn (status) | 11 dmg, 0.1 s control, 0.1 kills | 26 dmg, 0.4 s control | 34 dmg, 1.6 s control, 0.1 kills |
| chill (status) | - | 1 dmg | - |
| poison (status) | 6 dmg, 0.1 s control | 21 dmg, 0.9 s control | 28 dmg, 2.8 s control |
| armour | - | 452 block | 513 block |
| dodge | 107 block | 162 block | 208 block |

- Tier I: applied confuse 580, sleepy 82, burn 75, charm 74, stagger 72, shock 68, chill 65, wet 60; bursts confuse 2; status damage burn 13, poison 7. Foe-seconds a minute traced to it: confuse 42, sleepy 14, poison 10, burn 9, chill 8, wet 8, charm 8, addled 7; all foe states (any cause): addled 7, radiant 2, stunned 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, burn 3, rooted 3, chill 2, radiance 1, wet 1, poison 1.
- Tier II: applied confuse 941, charm 137, shock 136, chill 131, stagger 130, burn 129, poison 128, wet 123; bursts confuse 5.8; status damage burn 31, poison 26. Foe-seconds a minute traced to it: addled 22, poison 20, sleepy 20, confuse 18, wet 17, burn 15, charm 15, chill 14; all foe states (any cause): addled 22, stunned 4, overloaded 2, radiant 2, knockedOut 1, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 10, burn 6, stunned 3, rooted 2, radiance 1, poison 1, wet 1.
- Tier III: applied confuse 1,530, sleepy 179, burn 171, stagger 168, shock 164, chill 163, wet 161, poison 159; bursts confuse 8.5; status damage burn 41, poison 32. Foe-seconds a minute traced to it: addled 30, sleepy 21, poison 19, wet 17, burn 17, chill 14, charm 13, stagger 11; all foe states (any cause): addled 30, stunned 20, overloaded 3, radiant 2, knockedOut 1, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 9, burn 5, stunned 2, rooted 1, radiance 1, chill 1, poison 1.

### Samurai (samurai): melee

Trait: Keen Edge: Every blow also takes 3% of its target's greatest health (a boss 1%).

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Iaido** (iaido, cd 12.2s) | I | 100% · 6.3/m · 2s | 100% · 9.1/m · 2s | 100% · 8.2/m · 3s | 100% · 7.8/m · 2s | 100% · 8.2/m · 2s | 100% · 6.6/m · 3s | 100% · 6.6/m · 2s | 100% · 7.6/m · 3s | 100% · 6.3/m · 2s | 100% · 5.1/m · 3s | 100% · 7.1/m · 3s |
|  | II | 100% · 10.8/m · 2s | 100% · 12.1/m · 2s | 100% · 12.4/m · 3s | 100% · 11.8/m · 2s | 100% · 12.9/m · 3s | 100% · 10.8/m · 3s | 100% · 10.3/m · 3s | 100% · 11.5/m · 2s | 100% · 10.5/m · 2s | 100% · 8.7/m · 3s | 100% · 12/m · 2s |
|  | III | 100% · 12.5/m · 2s | 100% · 11.4/m · 2s | 100% · 12.7/m · 3s | 100% · 13/m · 2s | 100% · 12.3/m · 3s | 100% · 10.8/m · 3s | 100% · 12/m · 2s | 100% · 12/m · 3s | 100% · 11.5/m · 3s | 100% · 7.1/m · 3s | 100% · 12.2/m · 3s |
| **Focus** (focus, cd 14.6s) | I | **0%** | 83% · 3.8/m · 4s | 75% · 3.9/m · 6s | **0%** | **0%** | 100% · 3.8/m · 2s | 100% · 5.7/m · 2s | 100% · 4.2/m · 3s | 100% · 3.6/m · 2s | 100% · 3.7/m · 3s | 100% · 3.3/m · 6s |
|  | II | **0%** | 92% · 6.5/m · 4s | 67% · 5.5/m · 3s | **0%** | **8%** | 100% · 4.9/m · 3s | 100% · 8/m · 2s | 100% · 6.8/m · 3s | 100% · 3.6/m · 2s | 100% · 5.9/m · 3s | 100% · 5.2/m · 7s |
|  | III | **0%** | 100% · 7.3/m · 3s | 100% · 7.6/m · 6s | **0%** | **8%** | 100% · 4.8/m · 2s | 100% · 7.3/m · 2s | 100% · 5.1/m · 3s | 100% · 4/m · 2s | 100% · 3.5/m · 3s | 100% · 4.7/m · 7s |
| **Crescent Cut** (crescentCut, cd 13.4s) | I | 100% · 5/m · 3s | 100% · 5.3/m · 3s | 100% · 5.6/m · 3s | 100% · 7.8/m · 3s | 100% · 6/m · 3s | 100% · 6.6/m · 2s | 100% · 6.6/m · 4s | 100% · 6.5/m · 4s | 100% · 5.7/m · 3s | 100% · 4.5/m · 4s | 100% · 6.4/m · 4s |
|  | II | 100% · 10.4/m · 3s | 100% · 10.2/m · 3s | 100% · 9.6/m · 3s | 100% · 9/m · 3s | 100% · 12.9/m · 3s | 100% · 10.1/m · 2s | 100% · 9.4/m · 4s | 100% · 9.9/m · 4s | 100% · 9.2/m · 3s | 100% · 7.4/m · 4s | 100% · 9.4/m · 3s |
|  | III | 100% · 12.1/m · 3s | 100% · 9/m · 3s | 100% · 10.2/m · 3s | 100% · 10.1/m · 3s | 100% · 13.5/m · 3s | 100% · 10/m · 3s | 100% · 10.4/m · 3s | 100% · 10.3/m · 4s | 100% · 10.4/m · 3s | 100% · 5.8/m · 4s | 100% · 10.3/m · 5s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 1,138 dmg, 6.3 kills | 2,325 dmg, 7 kills | 3,436 dmg, 0.2 s control, 7.4 kills |
| Iaido | 399 dmg, 23 block, 2.1 s control, 1.1 kills | 978 dmg, 48 block, 11 s control, 1.8 kills | 1,381 dmg, 90 block, 3.9 s control, 1.6 kills |
| Focus | 72 block, 80 via others | 223 block, 190 via others | 331 block, 223 via others |
| Crescent Cut | 377 dmg, 1.4 kills | 879 dmg, 17.8 s control, 2.4 kills | 1,349 dmg, 4 block, 40.6 s control, 2.4 kills |
| Keen Edge (trait) | 598 via others | 1,424 via others | 2,113 via others |
| other | 1 block | 7 block | 13 block |
| chill (status) | - | 1 dmg | 2 dmg |
| armour | 161 block | 634 block | 1,009 block |

- Tier I: applied stagger 180; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 10; all foe states (any cause): stunned 2, radiant 2. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 8, burn 5, rooted 4, chill 2, wet 1, poison 1, stunned 1, radiance 1.
- Tier II: applied stagger 1,169; bursts stagger 5.7; status damage -. Foe-seconds a minute traced to it: stagger 22, knockedOut 9; all foe states (any cause): stunned 16, knockedOut 11, radiant 2. Its own buffs and states (s a minute): untouchable 3. Under foes' statuses and states: stagger 9, burn 5, rooted 3, stunned 2, wet 1, poison 1.
- Tier III: applied stagger 1,523; bursts stagger 10.1; status damage -. Foe-seconds a minute traced to it: stagger 19, knockedOut 15; all foe states (any cause): stunned 22, knockedOut 18, radiant 4. Its own buffs and states (s a minute): untouchable 6. Under foes' statuses and states: stagger 11, burn 6, stunned 2, rooted 2, poison 1, chill 1.

### Valkyrie (valkyrie): support

Trait: Light of Valhalla: While a friend is near her, she and the friends near heal 0.9% a second, a soft glow under her. She revives the fallen twice as fast, at 30% health.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | --- | --- | --- |
| **Valkyrie's Call** (valkyrieCall, cd 36.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** |
| **Spear of the Sky** (spearThrow, cd 11s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 67% · 2.1/m · 31s | 17% · 0.3/m · 16s | **0%** |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 58% · 1.1/m · 47s | **8%** | **0%** |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** | 83% · 2.9/m · 17s | **0%** | **0%** |
| **Sky Dive** (skyDive, cd 14.6s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.3/m · 2s | 100% · 5/m · 2s | **0%** | 100% · 2.1/m · 2s | 100% · 2.8/m · 3s | 100% · 3.2/m · 11s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 7.6/m · 3s | 100% · 8.9/m · 2s | **0%** | 100% · 3.3/m · 2s | 100% · 5/m · 3s | 100% · 4.1/m · 17s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.6/m · 3s | 100% · 9.2/m · 2s | **0%** | 100% · 3.3/m · 3s | 100% · 3.8/m · 3s | 100% · 4.5/m · 9s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 407 dmg, 2.6 kills | 523 dmg, 0.3 s control, 2.5 kills | 914 dmg, 0.3 s control, 2.4 kills |
| Spear of the Sky | 4 block | 4 block | 13 block |
| Sky Dive | 124 dmg, 40 block, 0.6 kills | 221 dmg, 133 block, 2.1 s control, 0.8 kills | 295 dmg, 168 heal, 233 block, 2 s control, 0.6 kills |
| Light of Valhalla (trait) | 28 heal | 32 heal | 39 heal |
| other | 1 block | 1 block | 2 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | 176 block | 861 block | 1,449 block |

- Tier I: applied radiance 190; bursts -; status damage -. Foe-seconds a minute traced to it: radiance 25; all foe states (any cause): radiant 1. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 10, rooted 4, burn 3, chill 3, wet 1, stunned 1, poison 1.
- Tier II: applied stagger 528, radiance 255, shock 1; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 36, radiance 35; all foe states (any cause): stunned 4, knockedOut 2, radiant 1. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 11, burn 6, rooted 5, stunned 3, knockedOut 2, wet 1, poison 1.
- Tier III: applied stagger 635, radiance 308, shock 1; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 44, radiance 44, knockedOut 1; all foe states (any cause): stunned 5, knockedOut 2, radiant 2. Its own buffs and states (s a minute): untouchable 2. Under foes' statuses and states: stagger 11, burn 5, rooted 5, stunned 3, wet 2, poison 1, knockedOut 1, chill 1.

### Engineer (engineer): ranged

Trait: Overclock: When none of her abilities is ready, one of them at random comes round twice as fast.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Deploy Turret** (deployTurret, cd 24.4s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.8/m · 2s | 100% · 4.2/m · 2s | 100% · 2.7/m · 2s | 100% · 3.6/m · 2s | 100% · 3.1/m · 2s | 100% · 4.2/m · 8s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 4.7/m · 2s | 100% · 6.9/m · 2s | 100% · 2.1/m · 2s | 100% · 3.1/m · 2s | 100% · 4/m · 3s | 100% · 5.1/m · 4s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5/m · 2s | 100% · 7.1/m · 2s | 100% · 3/m · 2s | 100% · 3.4/m · 2s | 100% · 4/m · 3s | 100% · 5.1/m · 5s |
| **Tinker** (tinker, cd 19.5s) | I | 100% · 4.5/m · 2s | 100% · 3.9/m · 2s | 100% · 4.2/m · 3s | 100% · 4/m · 2s | 100% · 4.3/m · 2s | 100% · 5.3/m · 2s | 100% · 4.8/m · 3s | 100% · 5.5/m · 2s | 100% · 4.8/m · 2s | 100% · 5.1/m · 2s | 100% · 6/m · 2s |
|  | II | 100% · 6.4/m · 2s | 100% · 5.5/m · 2s | 100% · 6.7/m · 3s | 100% · 5.6/m · 2s | 100% · 6.5/m · 2s | 100% · 6.6/m · 2s | 100% · 8.6/m · 2s | 100% · 5.9/m · 2s | 100% · 5.5/m · 2s | 100% · 6.3/m · 3s | 100% · 7.1/m · 2s |
|  | III | 100% · 7.4/m · 2s | 100% · 6.6/m · 2s | 100% · 7.4/m · 3s | 100% · 6.5/m · 2s | 100% · 6.8/m · 2s | 100% · 8.1/m · 1s | 100% · 8.5/m · 2s | 100% · 6.2/m · 2s | 100% · 5.7/m · 2s | 100% · 6.7/m · 3s | 100% · 7.1/m · 3s |
| **Wind-up Drones** (shockMine, cd 14.6s) | I | 100% · 5.5/m · 2s | 100% · 5.2/m · 2s | 100% · 5.9/m · 2s | 100% · 5.4/m · 2s | 100% · 5.5/m · 2s | 100% · 6.9/m · 2s | 100% · 7.4/m · 2s | 100% · 6.2/m · 3s | 100% · 6/m · 2s | 100% · 6/m · 3s | 100% · 6.6/m · 3s |
|  | II | 100% · 8.8/m · 2s | 100% · 6.9/m · 3s | 100% · 8.9/m · 2s | 100% · 8.9/m · 2s | 100% · 9.6/m · 2s | 100% · 9.7/m · 3s | 100% · 10.1/m · 2s | 100% · 7.4/m · 3s | 100% · 7.1/m · 3s | 100% · 8.6/m · 2s | 100% · 8.6/m · 4s |
|  | III | 100% · 10/m · 2s | 100% · 8.3/m · 2s | 100% · 10.7/m · 2s | 100% · 9.8/m · 2s | 100% · 10.4/m · 2s | 100% · 10.7/m · 2s | 100% · 11/m · 2s | 100% · 7.5/m · 3s | 100% · 7/m · 3s | 100% · 8.2/m · 3s | 100% · 8.5/m · 4s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 887 dmg, 3 heal, 0.9 s control, 5.2 kills | 1,173 dmg, 14 heal, 1.9 s control, 4.5 kills | 2,057 dmg, 22 heal, 2.4 s control, 4.5 kills |
| Deploy Turret | 103 dmg, 0.5 kills | 182 dmg, 0.9 kills | 550 dmg, 0.1 s control, 1.6 kills |
| Tinker | 30 dmg, 39 block, 0.2 kills | 36 dmg, 141 block, 0.1 kills | 59 dmg, 164 block, 0.2 kills |
| Wind-up Drones | 14 dmg, 0.1 kills | 19 dmg, 0.1 kills | 8 dmg |
| other | - | 4 block | 3 block |
| burn (status) | 68 dmg, 0.5 s control, 0.4 kills | 120 dmg, 1.2 s control, 0.3 kills | 100 dmg, 1.3 s control, 0.2 kills |
| chill (status) | 4 dmg | 6 dmg | 6 dmg |
| armour | - | 290 block | 552 block |

- Tier I: applied shock 410, burn 327, chill 153; bursts burn 2.2; status damage burn 86, chill 5. Foe-seconds a minute traced to it: shock 23, chill 15, burn 12, overloaded 7; all foe states (any cause): overloaded 7, stunned 5, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 4, burn 3, chill 2, rooted 1.
- Tier II: applied shock 683, burn 519, chill 159; bursts burn 4, shock 1.7; status damage burn 136, chill 10. Foe-seconds a minute traced to it: shock 31, burn 19, chill 14, overloaded 13; all foe states (any cause): overloaded 13, stunned 10, radiant 1, knockedOut 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 9, burn 5, stunned 1, rooted 1.
- Tier III: applied shock 793, burn 418, chill 147; bursts burn 2.8, shock 2.1; status damage burn 116, chill 7. Foe-seconds a minute traced to it: shock 34, burn 18, chill 14, overloaded 13; all foe states (any cause): overloaded 13, stunned 12, radiant 2, knockedOut 1, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 9, burn 4, stunned 2, chill 1, rooted 1.

### Werewolf (werewolf): melee

Trait: Back From the Wild: When the wolf falls, he gets up again as a man at 10% health, every time.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Turn** (turnWolf, cd 26.8s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.2/m · 2s | 100% · 3.2/m · 3s | 100% · 1.4/m · 2s | 100% · 2.2/m · 2s | 100% · 2.1/m · 3s | 100% · 3.8/m · 7s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.1/m · 3s | 100% · 5/m · 3s | 100% · 2.3/m · 2s | 100% · 3.4/m · 2s | 100% · 3.7/m · 3s | 100% · 5.2/m · 6s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 2.8/m · 3s | 100% · 5.2/m · 2s | 100% · 3.8/m · 2s | 100% · 4/m · 3s | 100% · 4.1/m · 3s | 100% · 5.3/m · 5s |
| **Frenzy** (frenzy, cd 17.1s) | I | always on | always on | always on | always on | always on | always on | always on | always on | always on | always on | always on |
|  | II | always on | always on | always on | always on | always on | always on | always on | always on | always on | always on | always on |
|  | III | always on | always on | always on | always on | always on | always on | always on | always on | always on | always on | always on |
| **Pounce** (pounce, cd 12.2s) | I | 100% · 6.8/m · 2s | 100% · 5.8/m · 3s | 100% · 7.2/m · 3s | 100% · 5.8/m · 3s | 100% · 5.8/m · 2s | 100% · 5.7/m · 3s | 100% · 5.8/m · 4s | 100% · 6.2/m · 4s | 100% · 5.9/m · 2s | 100% · 5/m · 3s | 100% · 6.8/m · 4s |
|  | II | 100% · 10.9/m · 2s | 100% · 9.3/m · 3s | 100% · 10.8/m · 3s | 100% · 10/m · 3s | 100% · 10.4/m · 2s | 100% · 9.8/m · 3s | 100% · 7/m · 3s | 100% · 9.7/m · 3s | 100% · 8.8/m · 3s | 100% · 8.8/m · 3s | 100% · 9.8/m · 6s |
|  | III | 100% · 11.9/m · 2s | 100% · 8.8/m · 3s | 100% · 12.1/m · 3s | 100% · 11.4/m · 3s | 100% · 11.5/m · 2s | 100% · 11.1/m · 3s | 100% · 7.8/m · 3s | 100% · 9.1/m · 4s | 100% · 9.4/m · 3s | 100% · 9.4/m · 3s | 100% · 10.3/m · 4s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 637 dmg, 4 kills | 1,138 dmg, 5.2 kills | 1,893 dmg, 5.6 kills |
| Turn | - | 3 block | 3 block |
| Frenzy | 409 heal | 739 heal | 1,162 heal, 2.3 s control |
| Pounce | 150 dmg, 6 block, 0.8 s control, 0.7 kills | 217 dmg, 35 block, 5.4 s control, 0.8 kills | 493 dmg, 71 block, 2.3 s control, 1.3 kills |
| other | - | 2 block | 2 block |
| bleed (status) | - | - | 528 dmg, 5.8 s control, 0.1 kills |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 815 block | 1,477 block |
| untouchable | 2 block | 6 block | 23 block |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: -; all foe states (any cause): stunned 1, radiant 1. Its own buffs and states (s a minute): haste 3. Under foes' statuses and states: stagger 12, rooted 4, burn 3, chill 2, wet 2, poison 1, stunned 1.
- Tier II: applied stagger 498; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 38; all foe states (any cause): stunned 6, radiant 1, knockedOut 1. Its own buffs and states (s a minute): haste 8, untouchable 1. Under foes' statuses and states: stagger 15, burn 9, stunned 5, rooted 3, knockedOut 2, poison 1, wet 1, chill 1.
- Tier III: applied stagger 784, bleed 478; bursts bleed 3; status damage bleed 375. Foe-seconds a minute traced to it: stagger 54, bleed 19, knockedOut 1; all foe states (any cause): stunned 7, knockedOut 2, radiant 2. Its own buffs and states (s a minute): haste 9, untouchable 1. Under foes' statuses and states: stagger 16, burn 8, stunned 5, knockedOut 3, rooted 2, chill 1, wet 1, poison 1.

### Enchantress (enchantress): support

Trait: First Impression: The first blow any enemy lands on her charms it a lot: it soon can't bring itself to hit her again.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Heartstring** (heartstring, cd 15.9s) | I | 100% · 4.8/m · 3s | 100% · 5.4/m · 2s | 100% · 5/m · 3s | 100% · 4.5/m · 2s | 100% · 4.5/m · 2s | 100% · 4.6/m · 3s | 100% · 4.7/m · 4s | 100% · 4.5/m · 3s | 100% · 4.6/m · 3s | 100% · 4.6/m · 3s | 100% · 5.3/m · 2s |
|  | II | 100% · 6.3/m · 2s | 100% · 6.8/m · 2s | 100% · 6.5/m · 3s | 100% · 6.5/m · 2s | 100% · 6.5/m · 2s | 100% · 7.5/m · 3s | 100% · 7.6/m · 3s | 100% · 7.3/m · 3s | 100% · 7.3/m · 3s | 100% · 7.4/m · 3s | 100% · 8/m · 2s |
|  | III | 100% · 6.5/m · 3s | 100% · 6.5/m · 2s | 100% · 6.9/m · 3s | 100% · 6.6/m · 2s | 100% · 6.7/m · 2s | 100% · 7.1/m · 3s | 100% · 8/m · 3s | 100% · 6.6/m · 3s | 100% · 7.3/m · 3s | 100% · 7.7/m · 3s | 100% · 8/m · 4s |
| **Sweetheart** (sweetheart, cd 17.1s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.2/m · 2s | 100% · 4.9/m · 2s | 100% · 3.8/m · 3s | 100% · 3.5/m · 2s | 100% · 3.9/m · 3s | 100% · 4.1/m · 5s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.2/m · 2s | 100% · 7.1/m · 2s | 100% · 5.4/m · 2s | 100% · 4.9/m · 2s | 100% · 5.3/m · 3s | 100% · 6.5/m · 4s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.3/m · 2s | 100% · 7.1/m · 2s | 100% · 5/m · 2s | 100% · 5.2/m · 2s | 100% · 4.2/m · 3s | 100% · 6.1/m · 5s |
| **Heartbreak** (heartbreak, cd 18.3s) | I | 100% · 3.9/m · 3s | 100% · 4.5/m · 3s | 100% · 4.4/m · 3s | 100% · 3.7/m · 3s | 100% · 3.7/m · 3s | 100% · 4/m · 3s | 100% · 4.7/m · 3s | 100% · 4.2/m · 4s | 100% · 3.8/m · 3s | 100% · 3.4/m · 5s | 100% · 3.4/m · 8s |
|  | II | 100% · 6.2/m · 2s | 100% · 4.9/m · 5s | 100% · 6.4/m · 3s | 100% · 6.4/m · 3s | 100% · 6.5/m · 3s | 100% · 6.6/m · 3s | 100% · 6.6/m · 3s | 100% · 6.4/m · 3s | 100% · 5.5/m · 4s | 100% · 5.5/m · 4s | 100% · 4.4/m · 11s |
|  | III | 100% · 6.4/m · 2s | 100% · 5/m · 3s | 100% · 6.7/m · 3s | 100% · 6.5/m · 3s | 100% · 6.7/m · 3s | 100% · 6.9/m · 3s | 100% · 7.9/m · 3s | 100% · 6.9/m · 3s | 100% · 6.3/m · 4s | 100% · 6.6/m · 4s | 100% · 5.1/m · 7s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 343 dmg, 1.3 s control, 1 kills | 396 dmg, 1.9 s control, 1.3 kills | 702 dmg, 2.5 s control, 1.4 kills |
| Sweetheart | - | 77 heal | 104 heal |
| Heartbreak | 78 dmg, 5.4 s control, 0.2 kills | 103 dmg, 11.5 s control, 0.4 kills | 257 dmg, 126 heal, 12.2 s control, 0.6 kills |
| other | - | 3 block | 3 block |
| chill (status) | - | - | 1 dmg |
| armour | - | 204 block | 329 block |

- Tier I: applied charm 1,007; bursts charm 3.5; status damage -. Foe-seconds a minute traced to it: charm 54, enthralled 4; all foe states (any cause): stunned 9, enthralled 4, rooted 1. Its own buffs and states (s a minute): beloved 7. Under foes' statuses and states: stagger 5, burn 2, rooted 1, chill 1.
- Tier II: applied charm 1,235; bursts charm 6; status damage -. Foe-seconds a minute traced to it: charm 46, enthralled 7, beloved 2; all foe states (any cause): stunned 19, enthralled 8, radiant 1, knockedOut 1, rooted 1. Its own buffs and states (s a minute): beloved 15. Under foes' statuses and states: stagger 8, burn 4, rooted 1, stunned 1, charm 1.
- Tier III: applied charm 1,347; bursts charm 7; status damage -. Foe-seconds a minute traced to it: charm 41, enthralled 9, beloved 3; all foe states (any cause): stunned 21, enthralled 9, radiant 2, knockedOut 2, rooted 1. Its own buffs and states (s a minute): beloved 20. Under foes' statuses and states: stagger 9, burn 4, charm 1, stunned 1, rooted 1.

### The Mob (mob): melee

Trait: Strength in Numbers: Each of the four hits 9% harder, and is hurt 7% less, for every other one of them shoulder to shoulder with it: 27% and 21% when all four stand together, nothing when they are scattered.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Pile On** (pileOn, cd 12.2s) | I | 100% · 7.6/m · 2s | 100% · 7.8/m · 3s | 100% · 7.9/m · 2s | 100% · 7.1/m · 2s | 100% · 6.5/m · 2s | 100% · 5.9/m · 2s | 100% · 7.1/m · 3s | 100% · 7.2/m · 3s | 100% · 6.3/m · 3s | 100% · 4.9/m · 3s | 100% · 6.6/m · 4s |
|  | II | 100% · 10.4/m · 2s | 100% · 8/m · 3s | 100% · 10.2/m · 2s | 100% · 10.7/m · 2s | 100% · 10.8/m · 2s | 100% · 9.5/m · 2s | 100% · 10.3/m · 3s | 100% · 10.7/m · 3s | 100% · 9.9/m · 3s | 100% · 10/m · 4s | 100% · 11.1/m · 3s |
|  | III | 100% · 12.6/m · 2s | 100% · 10.8/m · 3s | 100% · 14.1/m · 2s | 100% · 12.1/m · 2s | 100% · 11.4/m · 2s | 100% · 10.5/m · 2s | 100% · 10.7/m · 3s | 100% · 10.7/m · 3s | 100% · 10.9/m · 3s | 100% · 10.8/m · 3s | 100% · 11.4/m · 3s |
| **Surround** (surround, cd 15.9s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.7/m · 5s | 100% · 4.3/m · 3s | 75% · 2.5/m · 5s | 100% · 3/m · 4s | 100% · 2.4/m · 3s | 100% · 3.9/m · 8s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.4/m · 6s | 100% · 7.7/m · 4s | 67% · 2.4/m · 2s | 100% · 3.3/m · 3s | 100% · 3.7/m · 3s | 100% · 4.6/m · 15s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.1/m · 7s | 100% · 7/m · 3s | 67% · 2.4/m · 2s | 100% · 3.3/m · 5s | 100% · 4.2/m · 3s | 100% · 5.3/m · 9s |
| **Scatter** (scatter, cd 19.5s) | I | **0%** | **0%** | **0%** | **0%** | 100% · 3/m · 6s | 100% · 2.2/m · 9s | 100% · 3.7/m · 5s | 75% · 2.5/m · 10s | 75% · 1.2/m · 13s | 100% · 1.6/m · 9s | 100% · 1.2/m · 77s |
|  | II | **0%** | **0%** | **0%** | **0%** | 100% · 3.1/m · 7s | 67% · 1.3/m · 18s | 67% · 2.9/m · 9s | 33% · 1.1/m · 12s | 25% · 0.5/m · 17s | 100% · 1.7/m · 12s | 75% · 0.6/m · 58s |
|  | III | **0%** | **0%** | **0%** | **0%** | 67% · 1.5/m · 15s | 75% · 1.6/m · 7s | 67% · 2.9/m · 8s | 17% · 0.6/m · 10s | 17% · 0.4/m · 37s | 92% · 2.5/m · 7s | 63% · 0.4/m · 43s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 544 dmg, 0.5 s control, 4.2 kills | 580 dmg, 0.4 s control, 2.5 kills | 1,140 dmg, 28.3 s control, 3.2 kills |
| Pile On | 489 dmg, 111 via others, 0.6 s control, 2.3 kills | 914 dmg, 240 via others, 0.6 s control, 3 kills | 1,601 dmg, 365 via others, 1.4 s control, 3.8 kills |
| Surround | 183 dmg, 0.6 s control, 0.6 kills | 297 dmg, 0.7 s control, 1.3 kills | 473 dmg, 1.8 s control, 0.9 kills |
| Scatter | 71 heal, 32 block | 158 heal, 34 block | 194 heal, 52 block, 1.3 s control |
| Strength in Numbers (trait) | 81 block, 61 via others | 85 block, 80 via others | 144 block, 143 via others |
| other | - | 23 block | 76 block |
| bleed (status) | 86 dmg, 1.9 s control, 0.3 kills | 188 dmg, 1.9 s control, 0.2 kills | 280 dmg, 2.9 s control, 0.3 kills |
| burn (status) | 8 dmg, 0.1 s control, 0.1 kills | 263 dmg, 2.6 s control, 2.4 kills | 345 dmg, 2.9 s control, 2.3 kills |
| chill (status) | - | 1 dmg | - |
| armour | - | 672 block | 859 block |

- Tier I: applied stagger 319, burn 255, bleed 223; bursts bleed 0.5; status damage bleed 105, burn 8. Foe-seconds a minute traced to it: bleed 42, burn 32, stagger 24, piled 12; all foe states (any cause): stunned 15, radiant 2. Its own buffs and states (s a minute): scatter 5. Under foes' statuses and states: stagger 12, burn 4, rooted 4, chill 3, stunned 2, wet 2, radiance 1, shock 1.
- Tier II: applied burn 902, stagger 390, bleed 322, radiance 1; bursts burn 3.4, bleed 1.3; status damage burn 252, bleed 243. Foe-seconds a minute traced to it: burn 64, bleed 48, stagger 31, piled 25, knockedOut 1; all foe states (any cause): stunned 31, knockedOut 2, radiant 1. Its own buffs and states (s a minute): scatter 3. Under foes' statuses and states: stagger 17, burn 11, chill 3, rooted 3, stunned 3, wet 2, poison 1, frozen 1.
- Tier III: applied burn 1,189, stagger 1,164, bleed 379, radiance 2; bursts stagger 6.9, burn 5.2, bleed 1.1; status damage burn 384, bleed 334. Foe-seconds a minute traced to it: burn 70, bleed 51, stagger 37, piled 27, knockedOut 15; all foe states (any cause): stunned 51, knockedOut 17, radiant 2. Its own buffs and states (s a minute): scatter 3. Under foes' statuses and states: burn 13, stagger 8, rooted 3, wet 2, chill 1, stunned 1, radiance 1, poison 1.

### Clockmaker (clockwork): support

Trait: Spare Second: Once a room, the blow that would bring him down never happens: he is back where he stood three seconds ago, with the health he had then.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Rewind** (rewind, cd 17.1s) | I | 100% · 2.5/m · 10s | 100% · 3.9/m · 3s | 100% · 4.5/m · 4s | 100% · 1.4/m · 28s | 100% · 0.8/m · 77s | 100% · 2.2/m · 17s | 100% · 3.5/m · 9s | 100% · 3.1/m · 12s | 100% · 3.3/m · 8s | 100% · 2.8/m · 10s | 100% · 1/m · 72s |
|  | II | 100% · 5.3/m · 8s | 100% · 6.2/m · 10s | 100% · 5.2/m · 11s | 100% · 5.3/m · 9s | 33% · 0.2/m · 81s | 67% · 0.7/m · 45s | 100% · 1.9/m · 11s | 100% · 2.4/m · 13s | 100% · 4/m · 9s | 100% · 4.8/m · 10s | 63% · 0.6/m · 26s |
|  | III | 100% · 7.2/m · 8s | 100% · 7.5/m · 7s | 92% · 5.6/m · 3s | 100% · 7.7/m · 7s | 58% · 0.5/m · 59s | 83% · 0.9/m · 42s | 75% · 0.7/m · 41s | 75% · 1.4/m · 15s | 100% · 5.3/m · 3s | 100% · 5/m · 4s | 63% · 0.6/m · 22s |
| **Slow Time** (timeBubble, cd 18.3s) | I | 100% · 2.1/m · 23s | 100% · 4.1/m · 3s | 100% · 4.7/m · 3s | **0%** | 100% · 3.5/m · 3s | 100% · 4/m · 2s | 100% · 4.2/m · 2s | 100% · 3/m · 5s | 100% · 4/m · 2s | 100% · 3.6/m · 3s | 100% · 4.5/m · 7s |
|  | II | 100% · 4.7/m · 7s | 100% · 7.4/m · 2s | 100% · 7.4/m · 3s | **0%** | 100% · 5.6/m · 3s | 100% · 5.9/m · 2s | 100% · 7/m · 2s | 100% · 5/m · 4s | 100% · 6.6/m · 2s | 100% · 6.3/m · 3s | 100% · 7.4/m · 3s |
|  | III | 100% · 6.9/m · 8s | 100% · 8.5/m · 2s | 100% · 8.7/m · 3s | **0%** | 100% · 5.5/m · 3s | 100% · 6.6/m · 2s | 100% · 8/m · 2s | 100% · 5.9/m · 3s | 100% · 7.6/m · 2s | 100% · 6.7/m · 3s | 100% · 8.3/m · 5s |
| **Stop the Clock** (stopClock, cd 24.4s) | I | 75% · 1/m · 46s | 100% · 3.8/m · 4s | 92% · 2.2/m · 16s | 100% · 1.5/m · 64s | 100% · 2.6/m · 4s | 100% · 2.4/m · 8s | 100% · 3.4/m · 3s | 100% · 1.7/m · 42s | 100% · 2.5/m · 3s | 100% · 2.9/m · 3s | 100% · 3.1/m · 6s |
|  | II | 100% · 2.5/m · 54s | 100% · 4.9/m · 3s | 92% · 1.9/m · 40s | 67% · 0.7/m · 98s | 100% · 3.9/m · 4s | 100% · 3.3/m · 4s | 100% · 5/m · 3s | 25% · 0.3/m · 18s | 100% · 3.8/m · 2s | 100% · 4.7/m · 3s | 100% · 4.7/m · 7s |
|  | III | 100% · 3.2/m · 18s | 100% · 5/m · 4s | 17% · 0.4/m · 14s | **0%** | 100% · 4.1/m · 4s | 100% · 3.4/m · 3s | 100% · 5.6/m · 3s | 25% · 0.3/m · 32s | 100% · 4.3/m · 3s | 100% · 3.8/m · 3s | 100% · 5.4/m · 6s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 373 dmg, 1.5 kills | 531 dmg, 1.9 kills | 933 dmg, 0.3 s control, 2.2 kills |
| Rewind | 52 heal, 1 block | 151 heal | 326 heal |
| Slow Time | 0.1 s control | 1.1 s control | 2.5 s control |
| Stop the Clock | 1 block, 11.3 s control | 20.7 s control | 61 dmg, 21.9 s control, 0.3 kills |
| other | - | 2 block | 1 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | - | 208 block | 243 block |
| untouchable | 4 block | 1 block | - |

- Tier I: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: slowTime 24, stopped 18; all foe states (any cause): stunned 9, radiant 1. Its own buffs and states (s a minute): spareSecond 1, untouchable 1. Under foes' statuses and states: stagger 6, burn 2, rooted 1.
- Tier II: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: slowTime 42, stopped 39; all foe states (any cause): stunned 21, knockedOut 1, radiant 1. Its own buffs and states (s a minute): fastTime 3. Under foes' statuses and states: stagger 7, burn 5, stunned 2, rooted 1.
- Tier III: applied -; bursts -; status damage -. Foe-seconds a minute traced to it: slowTime 62, stopped 39; all foe states (any cause): stunned 21, radiant 2, knockedOut 1, untouchable 1. Its own buffs and states (s a minute): fastTime 6. Under foes' statuses and states: stagger 9, burn 3, stunned 2.

### Air Mage (airMage): caster

Trait: Eye of the Storm: When an enemy she has whirled is flung about, a clap of wind goes off round it: its neighbours are hit and whirled too.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Gale** (gale, cd 11s) | I | 100% · 6.6/m · 3s | 100% · 7.1/m · 2s | 100% · 7.6/m · 3s | 100% · 6.4/m · 2s | 100% · 6.2/m · 2s | 100% · 6.4/m · 2s | 100% · 6.9/m · 2s | 100% · 6.6/m · 3s | 100% · 5.9/m · 2s | 100% · 5.9/m · 3s | 100% · 7.6/m · 3s |
|  | II | 100% · 10.7/m · 3s | 100% · 10.6/m · 3s | 100% · 10.7/m · 3s | 100% · 10.9/m · 3s | 100% · 10.9/m · 2s | 100% · 10.3/m · 3s | 100% · 11.2/m · 3s | 100% · 10.5/m · 3s | 100% · 10.2/m · 3s | 100% · 8.3/m · 3s | 100% · 11.9/m · 3s |
|  | III | 100% · 11.6/m · 3s | 100% · 12.2/m · 2s | 100% · 11.2/m · 3s | 100% · 11.6/m · 2s | 100% · 11.7/m · 2s | 100% · 11.3/m · 3s | 100% · 11.6/m · 3s | 100% · 11.3/m · 3s | 100% · 10.7/m · 2s | 100% · 10.6/m · 3s | 100% · 12.2/m · 2s |
| **Updraft** (updraft, cd 14.6s) | I | 100% · 5.7/m · 2s | 100% · 5.3/m · 2s | 100% · 5.6/m · 3s | 100% · 5/m · 2s | 100% · 4.9/m · 3s | 100% · 5/m · 2s | 100% · 5.7/m · 3s | 100% · 5.4/m · 3s | 100% · 5.7/m · 3s | 100% · 4.8/m · 3s | 100% · 6.7/m · 1s |
|  | II | 100% · 9.3/m · 2s | 100% · 9/m · 2s | 100% · 9.3/m · 3s | 100% · 9/m · 2s | 100% · 9.2/m · 3s | 100% · 9.2/m · 2s | 100% · 9.6/m · 2s | 100% · 9.3/m · 2s | 100% · 9/m · 3s | 100% · 7.5/m · 3s | 100% · 12.3/m · 1s |
|  | III | 100% · 9.7/m · 2s | 100% · 10.3/m · 2s | 100% · 10.9/m · 3s | 100% · 10.3/m · 2s | 100% · 10.3/m · 3s | 100% · 10.3/m · 2s | 100% · 10.6/m · 2s | 100% · 10.2/m · 2s | 100% · 9.7/m · 3s | 100% · 9.9/m · 3s | 100% · 12.4/m · 2s |
| **Cyclone** (cyclone, cd 18.3s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.8/m · 3s | 100% · 4.6/m · 3s | 100% · 3.6/m · 3s | 100% · 3/m · 2s | 100% · 3.9/m · 3s | 100% · 4.4/m · 6s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.5/m · 2s | 100% · 6.8/m · 2s | 100% · 3.4/m · 3s | 100% · 4.8/m · 2s | 100% · 3.8/m · 3s | 100% · 6.1/m · 5s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.4/m · 3s | 100% · 7.3/m · 2s | 100% · 4.7/m · 3s | 100% · 5.1/m · 2s | 100% · 5.1/m · 3s | 100% · 6.7/m · 8s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 471 dmg, 0.3 s control, 2.8 kills | 486 dmg, 0.7 s control, 2.1 kills | 1,007 dmg, 1.3 s control, 2.6 kills |
| Gale | 155 dmg, 0.5 s control, 0.9 kills | 204 dmg, 5.8 s control, 1.1 kills | 498 dmg, 3.1 s control, 1.2 kills |
| Updraft | 71 dmg, 1.2 s control, 0.3 kills | 194 dmg, 6.6 s control, 0.5 kills | 288 dmg, 53.6 s control, 0.5 kills |
| Cyclone | 102 dmg, 1.3 s control, 0.7 kills | 210 dmg, 3.5 s control, 1 kills | 603 dmg, 3.6 s control, 2 kills |
| stormsEye (a foe's, sent back) | 30 dmg, 0.8 s control, 0.1 kills | 105 dmg, 2.5 s control, 0.3 kills | 284 dmg, 2.1 s control, 0.7 kills |
| other | - | 6 block | 3 block |
| burn (status) | - | 2 dmg | 8 dmg |
| chill (status) | - | - | 3 dmg |
| armour | - | 181 block | 200 block |
| tk:brambleVest | - | - | - |

- Tier I: applied stagger 244; bursts -; status damage -. Foe-seconds a minute traced to it: whirled 21, stagger 18, lifted 9; all foe states (any cause): stunned 13, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, burn 2, rooted 1.
- Tier II: applied stagger 785, burn 6, chill 1; bursts stagger 1.4; status damage burn 1. Foe-seconds a minute traced to it: stagger 47, whirled 21, lifted 19, knockedOut 4; all foe states (any cause): stunned 31, knockedOut 4, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 9, burn 5, stunned 1, rooted 1.
- Tier III: applied stagger 3,187, burn 16, chill 3; bursts stagger 22.6; status damage burn 5. Foe-seconds a minute traced to it: knockedOut 26, whirled 21, lifted 21, stagger 6, burn 1; all foe states (any cause): stunned 52, knockedOut 27, radiant 2, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: burn 5, stagger 4.

### Warden (warden): tank

Trait: Ball and Chain: Whatever he shackles drags an iron ball as well: it moves 40% slower and can't dash, leap or charge until the irons come off.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Manacles** (manacle, cd 12.2s) | I | 100% · 6.1/m · 2s | 100% · 5.8/m · 2s | 100% · 6.1/m · 3s | 100% · 5.8/m · 2s | 100% · 5.8/m · 2s | 100% · 5.6/m · 2s | 100% · 6.3/m · 3s | 100% · 6/m · 2s | 100% · 6/m · 2s | 100% · 5.8/m · 3s | 100% · 6.2/m · 2s |
|  | II | 100% · 6/m · 2s | 100% · 5.9/m · 2s | 100% · 5.9/m · 3s | 100% · 6/m · 2s | 100% · 6.4/m · 2s | 100% · 9.4/m · 2s | 100% · 10.5/m · 3s | 100% · 8.8/m · 2s | 100% · 8.9/m · 2s | 100% · 9/m · 3s | 100% · 10.8/m · 2s |
|  | III | 100% · 6/m · 2s | 100% · 6.3/m · 2s | 100% · 6.5/m · 3s | 100% · 5.8/m · 2s | 100% · 6.3/m · 2s | 100% · 6.7/m · 3s | 100% · 10.6/m · 3s | 100% · 6.7/m · 2s | 100% · 9.4/m · 2s | 100% · 10.4/m · 3s | 100% · 9.8/m · 2s |
| **Nullify** (nullify, cd 19.5s) | I | **8%** | 100% · 2.5/m · 7s | 100% · 2.1/m · 20s | **0%** | 100% · 3.7/m · 4s | 100% · 3.8/m · 3s | 100% · 3.6/m · 2s | 100% · 3/m · 3s | 100% · 2.8/m · 3s | 100% · 3.1/m · 3s | 100% · 2.8/m · 12s |
|  | II | 92% · 2.1/m · 27s | 100% · 4.8/m · 8s | 100% · 6.3/m · 3s | 100% · 5.9/m · 6s | 100% · 6.4/m · 4s | 100% · 6.1/m · 3s | 100% · 6.6/m · 2s | 100% · 5.6/m · 4s | 100% · 5/m · 2s | 100% · 5.3/m · 3s | 100% · 3.2/m · 20s |
|  | III | 67% · 1.2/m · 17s | 100% · 7/m · 4s | 100% · 6.9/m · 3s | 100% · 5.4/m · 6s | 100% · 6.7/m · 3s | 100% · 6.5/m · 3s | 100% · 7.4/m · 2s | 100% · 6.1/m · 4s | 100% · 5.7/m · 3s | 100% · 5.9/m · 3s | 100% · 4/m · 17s |
| **Chain Gang** (chainGang, cd 17.1s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.9/m · 3s | 100% · 4.2/m · 3s | 58% · 1.1/m · 3s | 100% · 2.5/m · 3s | 100% · 3.1/m · 3s | 100% · 4.3/m · 6s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.4/m · 3s | 100% · 7.1/m · 2s | 67% · 1.9/m · 3s | 100% · 4.3/m · 3s | 100% · 5/m · 3s | 100% · 5.8/m · 10s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 6.9/m · 3s | 100% · 8.4/m · 2s | 92% · 3.5/m · 5s | 100% · 4.6/m · 3s | 100% · 5.6/m · 3s | 100% · 6.8/m · 6s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 418 dmg, 4.3 s control, 2.2 kills | 738 dmg, 4.4 s control, 2.7 kills | 1,472 dmg, 4.2 s control, 3.5 kills |
| Manacles | 31 dmg, 21.9 s control, 0.1 kills | 49 dmg, 28.9 s control, 0.2 kills | 95 dmg, 39.2 s control, 0.1 kills |
| Nullify | - | - | 209 via others |
| Chain Gang | 44 block, 0.1 s control | 133 block, 1 s control | 120 dmg, 231 block, 31.4 s control, 0.4 kills |
| other | - | 1 block | 3 block |
| chill (status) | - | 1 dmg | 1 dmg |
| armour | 292 block | 673 block | 996 block |

- Tier I: applied shackle 997; bursts shackle 7.1; status damage -. Foe-seconds a minute traced to it: chained 33, shackled 26, ironBall 26, shackle 21, silenced 15; all foe states (any cause): shackled 26, radiant 1. Its own buffs and states (s a minute): chainGang 7. Under foes' statuses and states: stagger 10, chill 4, burn 4, rooted 4, wet 1, radiance 1, stunned 1, poison 1.
- Tier II: applied shackle 1,526, radiance 1; bursts shackle 8.4; status damage -. Foe-seconds a minute traced to it: chained 64, shackled 30, ironBall 30, silenced 28, shackle 17; all foe states (any cause): shackled 30, rooted 27, radiant 2, stunned 2, knockedOut 1. Its own buffs and states (s a minute): chainGang 11. Under foes' statuses and states: stagger 11, burn 6, rooted 2, stunned 2, radiance 1, poison 1, wet 1, chill 1.
- Tier III: applied shackle 3,044, stagger 923, radiance 4; bursts shackle 10.1, stagger 6.1; status damage -. Foe-seconds a minute traced to it: chained 65, silenced 47, shackled 36, ironBall 36, knockedOut 12, shackle 11; all foe states (any cause): shackled 36, rooted 33, stunned 14, knockedOut 13, radiant 2. Its own buffs and states (s a minute): chainGang 12. Under foes' statuses and states: stagger 8, burn 5, stunned 2, radiance 2, rooted 1, wet 1, chill 1, poison 1.

### Telekinetic (telekinetic): caster

Trait: Poltergeist: When an enemy dies near her, its body is flung at the nearest of its friends.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hurl** (hurl, cd 11s) | I | 100% · 7/m · 2s | 100% · 8.5/m · 2s | 100% · 7.6/m · 3s | 100% · 6.7/m · 2s | 100% · 6.8/m · 2s | 100% · 6.5/m · 3s | 100% · 7.2/m · 2s | 100% · 6.5/m · 3s | 100% · 6.4/m · 3s | 100% · 6.1/m · 3s | 100% · 8.2/m · 1s |
|  | II | 100% · 11.7/m · 2s | 100% · 12.8/m · 2s | 100% · 12.4/m · 3s | 100% · 11.7/m · 2s | 100% · 12.1/m · 2s | 100% · 11.2/m · 3s | 100% · 11.3/m · 2s | 100% · 11.5/m · 3s | 100% · 11.5/m · 2s | 100% · 11.4/m · 3s | 100% · 16/m · 1s |
|  | III | 100% · 13.6/m · 3s | 100% · 14.8/m · 2s | 100% · 15.1/m · 3s | 100% · 13.4/m · 2s | 100% · 13.1/m · 2s | 100% · 12.3/m · 3s | 100% · 12.4/m · 2s | 100% · 13.1/m · 3s | 100% · 12.1/m · 3s | 100% · 12.3/m · 3s | 100% · 16/m · 1s |
| **Levitate** (levitate, cd 15.9s) | I | 100% · 5.3/m · 2s | 100% · 4.6/m · 2s | 100% · 5.4/m · 3s | 100% · 4.7/m · 3s | 100% · 4.4/m · 3s | 100% · 4.8/m · 2s | 100% · 5.5/m · 3s | 100% · 5.3/m · 3s | 100% · 5.1/m · 3s | 100% · 4.7/m · 3s | 100% · 6.3/m · 1s |
|  | II | 100% · 8.1/m · 2s | 100% · 9.1/m · 2s | 100% · 8.8/m · 3s | 100% · 8.3/m · 2s | 100% · 8.5/m · 3s | 100% · 8.4/m · 2s | 100% · 8.4/m · 3s | 100% · 8.4/m · 3s | 100% · 8.3/m · 2s | 100% · 8.1/m · 3s | 100% · 11.5/m · 1s |
|  | III | 100% · 10/m · 2s | 100% · 8.3/m · 2s | 100% · 8.2/m · 3s | 100% · 9.9/m · 3s | 100% · 9.5/m · 3s | 100% · 9.2/m · 2s | 100% · 9.1/m · 2s | 100% · 9.5/m · 2s | 100% · 9.4/m · 3s | 100% · 9.3/m · 3s | 100% · 12.1/m · 1s |
| **Mind Shield** (mindShield, cd 19.5s) | I | 100% · 3.7/m · 7s | 100% · 4.2/m · 6s | 100% · 4.3/m · 10s | 100% · 3.5/m · 8s | 100% · 3.2/m · 8s | 100% · 3.8/m · 5s | 100% · 4.3/m · 2s | 100% · 2.8/m · 7s | 75% · 1.4/m · 20s | 100% · 3/m · 5s | 88% · 1.5/m · 29s |
|  | II | 100% · 2.8/m · 16s | 100% · 4.6/m · 7s | 83% · 3/m · 10s | 25% · 0.3/m · 43s | **8%** | 100% · 4.7/m · 5s | 100% · 6.8/m · 3s | 75% · 2.6/m · 4s | 83% · 1.6/m · 29s | 100% · 3.9/m · 6s | 88% · 1.9/m · 15s |
|  | III | 17% · 0.5/m · 15s | 25% · 1.8/m · 3s | **8%** | **8%** | **0%** | 17% · 0.3/m · 20s | 100% · 5.9/m · 3s | **8%** | 42% · 0.8/m · 13s | 83% · 1.9/m · 11s | 88% · 1.7/m · 22s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 443 dmg, 2.8 kills | 645 dmg, 2.5 kills | 1,437 dmg, 0.1 s control, 3.5 kills |
| Hurl | 212 dmg, 1 s control, 1 kills | 602 dmg, 12.2 s control, 2.2 kills | 1,795 dmg, 74.7 s control, 4.6 kills |
| Levitate | 121 dmg, 1.2 s control, 0.5 kills | 244 dmg, 110 via others, 16.9 s control, 0.6 kills | 500 dmg, 282 via others, 35.9 s control, 0.9 kills |
| Mind Shield | 57 dmg, 4 block, 0.6 s control, 0.2 kills | 104 dmg, 12 block, 0.9 s control, 0.3 kills | 91 dmg, 4 block, 8.5 s control, 0.2 kills |
| poltergeist (a foe's, sent back) | 44 dmg, 0.4 s control, 0.7 kills | 45 dmg, 0.7 s control, 0.7 kills | 58 dmg, 0.2 s control, 0.4 kills |
| other | 6 dmg, 0.1 kills | 2 dmg, 4 block | 6 dmg, 1 block, 0.1 kills |
| burn (status) | 1 dmg | 7 dmg | 1 dmg, 0.1 kills |
| chill (status) | - | 3 dmg | 2 dmg |
| armour | - | 129 block | 102 block |

- Tier I: applied stagger 458, burn 5, chill 1; bursts -; status damage -. Foe-seconds a minute traced to it: stagger 33, levitated 9, thrown 1; all foe states (any cause): stunned 13, radiant 1, rooted 1. Its own buffs and states (s a minute): domed 12, mindShield 11. Under foes' statuses and states: stagger 7, burn 2, rooted 1.
- Tier II: applied stagger 1,551, burn 23, chill 8; bursts stagger 6.6; status damage burn 3, chill 1. Foe-seconds a minute traced to it: stagger 57, levitated 23, knockedOut 15, thrown 1, burn 1; all foe states (any cause): stunned 44, knockedOut 16, radiant 2, rooted 1. Its own buffs and states (s a minute): domed 13, mindShield 13. Under foes' statuses and states: stagger 5, burn 3, rooted 1, radiance 1.
- Tier III: applied stagger 5,540, burn 6; bursts stagger 40.6; status damage -. Foe-seconds a minute traced to it: knockedOut 54, levitated 34, stagger 19, thrown 2; all foe states (any cause): stunned 78, knockedOut 56, radiant 3. Its own buffs and states (s a minute): domed 5, mindShield 5. Under foes' statuses and states: burn 2, stagger 1, radiance 1.

### Earth Mage (earthMage): caster

Trait: Aftershock: The ground remembers. A moment after one of her abilities hurts an enemy, a stone spike comes up under it.

| Ability | Tier | 1v1 melee | 1v1 ranged | 1v1 caster | 1v1 tank | Ogre | Boars | Swarm | Duo | +tank ally | +healer ally | Dungeon |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Earthquake** (earthquake, cd 17.1s) | I | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 3.7/m · 3s | 100% · 4.7/m · 3s | 100% · 3.7/m · 3s | 100% · 2.9/m · 2s | 100% · 3/m · 3s | 100% · 4.4/m · 12s |
|  | II | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.3/m · 3s | 100% · 8.9/m · 3s | 100% · 4.2/m · 3s | 100% · 4.3/m · 2s | 100% · 5.3/m · 3s | 100% · 7.2/m · 5s |
|  | III | **0%** | **0%** | **0%** | **0%** | **0%** | 100% · 5.4/m · 3s | 100% · 7.9/m · 2s | 92% · 3.9/m · 3s | 100% · 5/m · 2s | 100% · 6.1/m · 3s | 100% · 8/m · 3s |
| **Spike Chain** (spikeChain, cd 11s) | I | 100% · 6.8/m · 3s | 100% · 7.8/m · 3s | 100% · 7.2/m · 3s | 100% · 6.5/m · 3s | 100% · 6.4/m · 4s | 100% · 6.5/m · 3s | 100% · 7.6/m · 2s | 100% · 6.8/m · 3s | 100% · 6.6/m · 3s | 100% · 6.3/m · 3s | 100% · 8.1/m · 1s |
|  | II | 100% · 10.1/m · 3s | 100% · 11.7/m · 2s | 100% · 11.7/m · 3s | 100% · 10.2/m · 4s | 100% · 10.2/m · 3s | 100% · 9.2/m · 2s | 100% · 12/m · 2s | 100% · 9.8/m · 3s | 100% · 10.4/m · 3s | 100% · 10.9/m · 3s | 100% · 13.2/m · 3s |
|  | III | 100% · 11.8/m · 3s | 100% · 12.7/m · 3s | 100% · 12.5/m · 3s | 100% · 11.6/m · 3s | 100% · 11.4/m · 3s | 100% · 10.5/m · 4s | 100% · 12.4/m · 2s | 100% · 10.6/m · 4s | 100% · 11.1/m · 2s | 100% · 11.5/m · 3s | 100% · 13.6/m · 3s |
| **Stone Wall** (stoneWall, cd 18.3s) | I | 100% · 4.7/m · 2s | **0%** | **0%** | 100% · 3.9/m · 3s | 100% · 4.5/m · 2s | 100% · 4.3/m · 2s | 100% · 5/m · 3s | 100% · 4.4/m · 3s | 92% · 1.7/m · 3s | 100% · 3.4/m · 3s | 100% · 4.5/m · 5s |
|  | II | 100% · 7.4/m · 2s | **0%** | **0%** | 100% · 7.1/m · 2s | 100% · 7.3/m · 2s | 100% · 7.2/m · 2s | 100% · 8.9/m · 2s | 100% · 7.1/m · 3s | 92% · 3.5/m · 3s | 100% · 5.8/m · 3s | 100% · 6.6/m · 7s |
|  | III | 100% · 8.5/m · 2s | **0%** | **0%** | 100% · 8.4/m · 2s | 100% · 8.4/m · 2s | 100% · 8.2/m · 2s | 100% · 8.6/m · 3s | 100% · 8.2/m · 3s | 83% · 3/m · 3s | 100% · 5.7/m · 3s | 100% · 7.1/m · 6s |

| Source (per minute) | Tier I | Tier II | Tier III |
| --- | --- | --- | --- |
| weapon | 504 dmg, 6.3 s control, 3 kills | 668 dmg, 15 s control, 2.4 kills | 1,299 dmg, 26.5 s control, 3.3 kills |
| Earthquake | 160 dmg, 12 s control, 1.3 kills | 621 dmg, 39.4 s control, 3.6 kills | 1,159 dmg, 67.1 s control, 3.5 kills |
| Spike Chain | 172 dmg, 2.3 s control, 1 kills | 302 dmg, 20.3 s control, 1.1 kills | 719 dmg, 52.6 s control, 1.6 kills |
| Stone Wall | 51 dmg, 2.6 s control, 0.1 kills | 72 dmg, 7.9 s control, 0.2 kills | 74 dmg, 11.9 s control, 0.1 kills |
| aftershock (a foe's, sent back) | 120 dmg, 4.8 s control, 1 kills | 238 dmg, 13.7 s control, 1.2 kills | 383 dmg, 8.6 s control, 1.1 kills |
| other | - | 1 block | 2 block |
| chill (status) | - | 1 dmg | 4 dmg |
| armour | - | 218 block | 297 block |

- Tier I: applied stagger 1,404; bursts stagger 3.6; status damage -. Foe-seconds a minute traced to it: stagger 72, quake 11, knockedOut 8; all foe states (any cause): stunned 20, knockedOut 8, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 7, rooted 2, burn 1, chill 1.
- Tier II: applied stagger 2,894; bursts stagger 16.6; status damage -. Foe-seconds a minute traced to it: stagger 77, knockedOut 35, quake 19; all foe states (any cause): stunned 45, knockedOut 36, radiant 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 7, burn 6, stunned 1, rooted 1.
- Tier III: applied stagger 5,129; bursts stagger 35.2; status damage -. Foe-seconds a minute traced to it: stagger 75, knockedOut 54, quake 24; all foe states (any cause): stunned 62, knockedOut 55, rooted 20, radiant 2, untouchable 1. Its own buffs and states (s a minute): -. Under foes' statuses and states: stagger 6, burn 5.

## 7. What this does not measure

- **Control is counted as time, not as damage saved.** Stuns, roots, sleeps, knockbacks, pulls, slows and fear show up as foe-seconds in a state (section 6), not as damage the hero did not take. "Stunned" includes stagger's short flinches and shock's jolts.
- **Taunts** (Hold the Line, Challenge, Mock and the like): who the foes swing at is not counted. A taunt's worth shows only through the damage its user then blocks or takes.
- **Walls and cover** (Ice Wall, Stone Wall, Pavise, Shield Wall's cover zone apart from its buff): shots that a wall stops never reach anyone, so they are not counted as blocked.
- **Getting out of the way** (Roll, Dash, Leap, Bound, Burrow, Shadow Walk...): a blow that never comes is not counted. Only blows that land while the hero is untouchable count, as blocked, for the ability that made it untouchable. Ethereal and hidden time is listed under the hero's own states.
- **Speed buffs** (attack speed, move speed: Rage, War Song, Rhythm and others) are not credited to the buff: they show up as more weapon damage. Damage buffs are credited ("via others").
- **Cleanses and revives**: statuses taken off (Unstoppable, Cure's draw, Nullify) and health set back by a revive (Valkyrie's Call, Rewind) do not go through the heal, so they are not counted. Spirit Link's sharing of health moves health directly and is not counted either.
- **Damage over time that a buff softens** is not counted as blocked (the game's own block count only counts blows).
- **Extra damage from a status's weak spot** (Cursed's harder blows, a knocked-out foe taking +50%, Frost Nova III on the frozen) is not credited to the status.
- **Attribution is the game's own** (stats.js sourceOf) with these additions: the hero's trait and its passive ability hooks are traced while they run; timed hooks (kits2.js onUnit) and buffs carry who put them on; summons carry the ability that made them (the cast in the same step, or the last one within 3 s); timers started by a cast carry it; lifesteal is credited to the buff that gives it; a shot the hero turned back is credited to the ability that turned it. Block that no shield, ward, buff or hook explains is put down to armour (or "other" when the hero has none).
- **Battle mode has no "downed"**: a hero who falls in a battle is dead. Anything that needs a downed friend (Valkyrie's Call) can only fire in the dungeon.
- **One floor of a dungeon** with fixed mates, not whole runs; no trinkets and no potions anywhere.
- **The 1v1 reference heroes** fight on the other side of the sim (its "enemy" team). Battle mode treats the two sides alike for heroes (heroic() reads the hero's own kind), so this should not matter, but it was not checked separately.
- **Fight order matters a little**: the sim numbers its units from one counter for the life of the process, and a few things read it. Each hero ran in its own process, so its numbers repeat exactly; a hero run in a process with others would get slightly different fights.

