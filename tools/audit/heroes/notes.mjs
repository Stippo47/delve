// Round 16 (the balance audit): the hand-written findings that report.mjs puts at the top of docs/audit/heroes.md.
// Every number here was read off the final run (docs/audit/data/heroes, heroes-vanish.json, heroes-fairend/); the
// sections below the findings are generated from the same data.
export const FINDINGS = `
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
2. **Queued blows**: make the kits.js abilities that queue a blow add to the hero's queue (as kits2.js \\'after()\\'
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
`;
