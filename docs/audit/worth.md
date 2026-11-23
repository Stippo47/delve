# What each ability is worth (balance audit, round 16, lane "worth")

**Measure only.** No rule or number in the game was changed. Everything under "Proposals" is a proposal for the designer.

The designer: "Test how much having or not having a specific ability affects outcomes: 2 abilities at lvl 3 and 1 at 1, or 1 at 3
and none of the others. Whatever combo would show the best results for how each ability changes outcomes overall, not just
measure its fixed influence."

## The short of it

Every ability was switched off, played alone, and dropped to tier I, in 15,696 dungeon runs and 98,100 battle fights.
The main number is **"minus one"**: what the hero loses when this ability is off and the other two stay at III.

- **Most abilities pull their weight.** 152 of the 177 make a clear difference to their kit somewhere. Across all
  heroes, the full kit clears 6.5 rooms against 4.3 bare, wins 82% of duels against 32%, and wins 83% of group fights
  against 13%.
- **The top ten:** Bread Toss (Grandpa Sickle), Hook (Granny Reaper), Frenzy (Werewolf, passive), Reap (Granny Reaper),
  Elixir (Alchemist), Unstoppable (Berserker), Juggling Act (Jester), Consecrate (Paladin), Sanctuary (Cleric), Dirty
  Trick (Bandit). Bread Toss is in a class of its own. Without it Grandpa Sickle wins 1% of duels, not 93%, and clears
  3.9 rooms, not 7.2.
- **The bottom:** Dark Bargain (Warlock) and Shield Wall (Bulwark) come out slightly *negative*: the hero does a little
  better without them. After them come Surround (The Mob), Smoker (Beekeeper), Blast Off (Grenadier), Jaw Trap (Trapper),
  Bound (Javelin Huntress), Valkyrie's Call (Valkyrie), Old Bones (Granny Reaper), Frost Nova and Ice Wall (Frost Mage),
  Roll (Archer) and Pavise (Crossbowman): all close to zero.
- **Worth nothing at all** (nothing clear when switched off *or* when played alone): Valkyrie's Call, Roll, Supply Crate
  (Quartermaster), Old Tales (Grandpa Sickle), Entangle (Druid). Only **Valkyrie's Call** is explained by not firing:
  it brings back a downed friend, so in battle it never fired (0 casts) and in the dungeon it fires about once a run. The
  other four do fire (Supply Crate 20 times a dungeon run, Entangle 17); what they do just doesn't change the outcome.
  Another 17 are worth something alone but nothing beside the other two (the kit already covers them).
- **Heroes carried by one ability** (switching it off takes away 60% or more of the whole kit's worth, in two of the
  three measures): Grandpa Sickle (Bread Toss), Werewolf (Frenzy), Alchemist (Elixir), Jester (Juggling Act), Frost Mage
  (Ice Shard), Quartermaster (Pot Helmet), Dame (Riposte), Shaman (Ancestors' Call), Tower (Charge), Twinfang (Fan of
  Knives), Griffon (Stormhammer).
- **Upgrades:** for 50 abilities, tiers II and III add nothing clear over tier I. For 33 of those the ability itself
  matters, so their upgrades are the ones that do nothing: Harvest, Hot Meal, Chain Lightning, Hibernate, Spear of the
  Sky, Deploy Turret, Spike Chain, Iaido and Bone Spear lead that list. Nine upgrades come out clearly *worse* in
  one measure. Six of those are single dungeon-room numbers that may be luck. Three are battle results. The big one is
  **Cure (Plague Doctor)**: with Cure at tier I the group fight is won 100% of the time, at tier III 67% (health margin
  86 points lower). Brace III does worse in duels than Brace I (16 points), and Shield Wall III does worse in the group
  fight (12 points).
- **The five flagged steps:** Stop the Clock and Gale change nothing at either step. Slow Time I to II nothing (II to III
  a sliver). Rewind I to II helps a little in the group fight, II to III nothing. **Nullify is not flat**: I to II and
  II to III both help clearly in duels, and II to III adds 13 points of duel wins.
- **Combos** (worth more together than apart): Rejuvenate + Call Wolf (Druid; perhaps the heal keeps the wolf up),
  Reap + Hook (Granny Reaper), Bread Toss + Harvest (Grandpa Sickle), Pounce with Frenzy and with Turn (Werewolf),
  Riposte + Challenge (Dame; likely: she taunts, then counters), Eldritch Beam + Awaken (Warlock), Raise Dead + Life Drain
  (Necromancer), Nullify + Chain Gang (Warden).
- **Real overlaps** (worse together than either alone, or close to it): Awaken + Dark Bargain (Warlock) is the clear one:
  in the group fight each alone lifts the Warlock 30 to 35 points of health, but both together only 12: less than
  either alone. Chain Lightning + Zeus Bolt (Storm Mage) and Earthquake + Spike Chain (Earth Mage) overlap partly. Most other
  "worth less together" pairs are a ceiling, not an overlap: one ability alone already wins the duel.
- **Some abilities cost the hero its duels but win the group fight:** Heartstring (Enchantress, 23 points of duel health
  lost, 28 gained in the group), Eldritch Beam (Warlock), Awaken (Warlock), Monstrosity (Alchemist), Turn (Werewolf).
  They are built for a party; alone they get in the way.
- **Found on the way, two problems outside balance:**
  1. A battle-mode bug: a lone hero that goes ethereal (Burrow, Broom Ride, Call the Flock, Bush, and the
     Shade's shadow: the Shadow Walk dash, Blackout III, her Fade trait) counts as gone, and the battle ends as a loss within seconds. See its own section.
  2. One seed is not one fight: unit ids come from a counter that is never reset, and ids feed movement, so the same
     seed plays differently depending on what ran before. That affects every seeded comparison tool. See "Noise".
- **Noise:** one ability's rooms worth carries an error of about 0.8 rooms (n=24 runs a build). That is too noisy to
  rank single abilities on rooms, so the score leans on the battle: duel health about 2 points, group health about 5
  points (30 seeds). The dungeon's per-second numbers (damage, damage spared, healing) are steadier and are in each
  hero's table.

## How it was measured

Every hero (59), every one of its three abilities (177), these builds, each played on the same seeds so the builds are
compared fight for fight and run for run (tools/audit/worth):

| Build | What is on | Read as |
|---|---|---|
| full | all three abilities at tier III | the baseline |
| minus one | two at III, this one switched off | **its worth to the kit** (full minus this): the main number |
| only one | this one at III, the other two off | its worth on its own (this minus bare) |
| one at I | this one at tier I, the others at III | what its upgrades (I to III) are worth (full minus this) |
| one at II | this one at II, the others at III | only for Rewind, Slow Time, Stop the Clock, Gale and Nullify: each tier step on its own |
| bare | none of the three | the floor |

"Switched off" means no tier node of the ability is owned, so the game sees it at tier 0: it is never picked, a passive
one is not hung on the hero. Checked: in every build where an ability is off it was cast 0 times and did 0 damage and 0
healing (the audit hook's 'cast' event and the 'ab:' sources).

Two settings:

- **Dungeon** (tools/ability-worth.mjs widened to every build): the hero and two random others, every dungeon in turn, bare
  runs (no trinkets, potions or web stats; the hero's three abilities set by the build, the other two heroes all at III),
  enemies at rank 1. 24 parties per hero, each played once per build: **15,696 runs**. Measured: rooms cleared
  (a lost run's last room doesn't count), plus the hero's damage, the party's damage taken, healing and downs.
- **Battle** (battle mode, the crypt arena, foes at their own dungeon's strength): the hero with its whole tier III skill web
  (heroes.js tierBuild 3, the web's stat nodes kept so only the abilities differ), 30 seeds per fight: **98,100 fights**.
  Four duels against a fixed panel, and one group fight:
  - melee: a Jackal Guard (jackal), major: spear and shield, sidesteps and lunges
  - ranged: a Cobra (cobra), major: spits poison from range, backs off
  - caster: two Frost Shamans (frostShaman), major: lobbed blizzards (one alone is too weak to lose to)
  - tank: a Golem (golem), major: 420 base health, throws lumps of itself
  - group: with a Tower friend (a Paladin for the Tower) vs 3 skeletons, a skeleton archer, a banshee and a brute, all major
  The panel was picked (tools/audit/worth/calibrate.mjs) so a full kit wins most duels but not all and a bare one loses most;
  the group is hard on a bare kit (it wins 13% of them, a full kit 83%; duels 32% and 82%) so supports and healers have a fight to swing. Measured: the health margin
  (our side's share of health left minus theirs, -100 to +100) and the win rate. The margin is the main battle number:
  it moves even when the win doesn't.

### Reading the numbers

- **Rooms**: extra rooms cleared in a dungeon run. **Health**: points of health margin in battle (a fight's margin runs
  from -100, lost without a scratch on them, to +100, won without a scratch, so a difference can be up to 200). **Win**:
  points of win rate. Dungeon rates: the hero's damage a second, party damage a second it spares (hurt saved), healing a second.
- **kit** = full minus "minus one". **alone** = "only one" minus bare. **I to III** = full minus "one at I".
- A number in *italics* is inside the noise (under two standard errors from zero). Plain numbers are clear of it.
  With 177 abilities, about one plain number in twenty in a column is still luck (some 9 a column), so a lone plain number
  in one measure, against the other measures, is weak evidence; the same sign in two settings is strong.
- The combined **score** ranks abilities across both settings: the dungeon rooms worth and the battle health worth (duels and
  group averaged, half each), each divided by how widely real worths spread across all 177 abilities in that measure (rooms
  0.65, health 17.2 points; the spread the noise adds taken out), then averaged with each weighted by how sure
  it is (one over its standard error squared). Rooms are far noisier than battle health, so the battle carries most of the score.
  1.0 = one typical spread.
- **Casts** = casts a dungeon run / casts a battle fight, in the full build.

### Noise

Median standard error of one ability's worth (paired builds, same seeds):

| | kit | alone | I to III | one build's own level |
|---|---|---|---|---|
| Dungeon rooms (n=24) | 0.81 | 0.70 | 0.77 | 0.73 |
| Duels, health points (30 seeds x 4) | 2.2 | 3.2 | 1.2 | 2.0 |
| Duels, win points | 2.3 | 3.3 | 0.8 | 1.4 |
| Group, health points (30 seeds) | 5.6 | 5.1 | 4.8 | 4.7 |
| Group, win points | 8.2 | 8.9 | 6.7 | 4.6 |
| Dungeon hero damage a second | 0.42 | 0.29 | 0.41 | 0.51 |
| Dungeon party damage taken a second | 0.37 | 0.41 | 0.35 | 0.40 |

Twice these is the line between a real difference and noise. Playing every build on the same seeds helps less than one
would hope: the builds share a fight only until the first moment they differ (the first cast), then drift apart, so
a worth's error is close to what two unmatched builds would give (compare the last column). Dungeon rooms are the
noisiest by far: a run ends at its first wipe, so rooms cleared swing by several rooms from run to run, and one
ability's rooms worth carries an error of most of a room. The dungeon's per-second rates and the battle numbers are
much steadier.

**Same seed, different fight.** On the way it turned out that one seed did not give one fight: unit ids come from a
counter that is never reset (js/sim.js `NEXT_ID`), and ids feed some movement (the wander and spacing wobble), so a fight
played after other fights in the same process plays out differently. The battle batch was run with the counter set to
the same start for every fight (one audit line, `AUDIT.idFrom`; nothing changes in the game); the dungeon batch was run
before that was found, so its builds are matched by party, dungeon and seed but not fight for fight. Its numbers are
still fair, just as noisy as unmatched runs (a test with the counter reset showed rooms no steadier). The same applies to
tools/ability-worth.mjs and tools/balance.mjs: same seeds there are not the same fights either.

## All 177 abilities by worth to their kit

Sorted by the combined score of "minus one" (what the hero loses when this one is switched off and the other two are kept).

| # | Hero | Ability | Score | Rooms: kit | Duels health: kit | Group health: kit | Duels win | Group win | Score alone | Casts |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Grandpa Sickle (grandpa) | Bread Toss (breadToss) | +6.62 | +3.33 | +150 | +80 | +92% | +60% | +5.69 | 33.2 / 16.0 |
| 2 | Granny Reaper (granny) | Hook (hook) | +4.59 | *+0.29* | +112 | +49 | +68% | +50% | +3.80 | 23.9 / 6.1 |
| 3 | Werewolf (werewolf) | Frenzy (frenzy) (passive) | +4.05 | +2.71 | +107 | +33 | +73% | +23% | +3.63 | 0.0 / 0.0 |
| 4 | Granny Reaper (granny) | Reap (reap) | +3.91 | *+1.38* | +79 | +56 | +48% | +50% | +2.36 | 26.3 / 7.0 |
| 5 | Alchemist (alchemist) | Elixir (elixir) | +3.84 | +4.21 | +46 | +84 | +24% | +60% | +5.13 | 37.2 / 6.5 |
| 6 | Berserker (berserker) | Unstoppable (unstoppable) | +3.68 | *+0.92* | +105 | +24 | +63% | *+10%* | +5.61 | 6.5 / 4.3 |
| 7 | Jester (jester) | Juggling Act (juggle) | +3.33 | +1.29 | +57 | +59 | +28% | +50% | +4.36 | 30.9 / 7.4 |
| 8 | Paladin (paladin) | Consecrate (consecrate) | +3.06 | *+1.25* | +21 | +86 | +17% | +73% | +2.75 | 12.1 / 1.7 |
| 9 | Cleric (cleric) | Sanctuary (sanctuary) | +2.96 | +1.88 | +69 | +33 | +51% | +27% | +2.69 | 23.4 / 4.4 |
| 10 | Bandit (rogueBandit) | Dirty Trick (pickpocket) | +2.95 | *+0.63* | +58 | +46 | +17% | +23% | +5.29 | 24.3 / 4.1 |
| 11 | Frost Mage (frost) | Ice Shard (iceShard) | +2.92 | +3.25 | +45 | +55 | +18% | +50% | +3.91 | 63.0 / 16.7 |
| 12 | Air Mage (airMage) | Updraft (updraft) | +2.90 | *+1.13* | +66 | +35 | +29% | +20% | +4.15 | 32.3 / 13.7 |
| 13 | The Mob (mob) | Pile On (pileOn) | +2.71 | *+0.33* | +84 | *+12* | +49% | *+13%* | +4.84 | 22.8 / 5.3 |
| 14 | Haymaker (haymaker) | Hay Bale (forkCharge) | +2.69 | *+0.83* | +71 | +23 | +48% | +23% | +4.68 | 22.8 / 4.7 |
| 15 | Quartermaster (quartermaster) | Pot Helmet (flare) | +2.46 | *+0.92* | +60 | +26 | +53% | +30% | +2.09 | 38.1 / 18.2 |
| 16 | Dame (dame) | Riposte (riposte) | +2.44 | *+0.83* | +40 | +45 | +29% | +43% | +1.74 | 30.4 / 11.4 |
| 17 | Werewolf (werewolf) | Pounce (pounce) | +2.44 | *+0.42* | +46 | +40 | +26% | +37% | +1.03 | 27.8 / 14.6 |
| 18 | Gladiator (gladiator) | Arena (showboat) | +2.34 | *+1.13* | +38 | +44 | +5% | +43% | +5.29 | 11.0 / 4.4 |
| 19 | Bulwark (bulwark) | Impale (impale) | +2.17 | *-0.13* | +70 | *+7* | +58% | +23% | +2.72 | 25.9 / 13.1 |
| 20 | Seer (seer) | Foresight (foresight) | +2.05 | *+0.54* | +48 | +24 | +42% | +30% | +3.23 | 28.4 / 17.9 |
| 21 | Shaman (shaman) | Ancestors' Call (rainDance) | +2.05 | *+1.75* | +20 | +50 | *+6%* | +43% | +2.29 | 20.5 / 2.7 |
| 22 | Warden (warden) | Nullify (nullify) | +2.05 | *-0.25* | +34 | +37 | +18% | +37% | +1.59 | 13.9 / 7.1 |
| 23 | Old Guard (oldguard) | Great Sweep (greatSweep) | +2.04 | *+1.33* | +35 | +35 | +23% | +27% | +3.72 | 51.5 / 11.2 |
| 24 | Engineer (engineer) | Tinker (tinker) | +2.00 | +2.46 | +45 | +22 | +29% | +23% | +2.27 | 32.2 / 6.5 |
| 25 | Druid (druid) | Rejuvenate (rejuvenate) | +1.99 | +2.04 | +28 | +37 | +22% | +40% | +0.57 | 27.6 / 4.1 |
| 26 | Old Guard (oldguard) | Rally (rallyCry) | +1.94 | +2.54 | +25 | +40 | +6% | +20% | +4.00 | 15.0 / 2.6 |
| 27 | Grandpa Sickle (grandpa) | Harvest (harvest) | +1.93 | *+1.13* | +20 | +47 | *0%* | +33% | +0.89 | 33.4 / 22.5 |
| 28 | Monk (monk) | Flurry (flurry) | +1.88 | +1.58 | +52 | *+11* | +26% | +17% | +5.58 | 37.6 / 14.0 |
| 29 | Wildmane (wildmane) | Leap (leap) | +1.88 | +2.08 | +40 | +24 | +37% | +13% | +2.28 | 44.2 / 10.7 |
| 30 | Warden (warden) | Chain Gang (chainGang) | +1.84 | *+0.21* | +16 | +50 | *+5%* | +43% | +1.61 | 15.4 / 2.2 |
| 31 | Tower (tower) | Ground Pound (groundPound) | +1.82 | *+0.29* | +7 | +60 | +7% | +40% | +1.48 | 15.7 / 2.1 |
| 32 | Druid (druid) | Call Wolf (callWolf) | +1.82 | *-0.79* | +28 | +41 | +22% | +43% | +0.88 | 17.0 / 2.6 |
| 33 | Tower (tower) | Charge (charge) | +1.81 | *+1.00* | +36 | +27 | +20% | +27% | +1.26 | 49.2 / 15.6 |
| 34 | Enchantress (enchantress) | Sweetheart (sweetheart) | +1.79 | *+1.33* | +10 | +51 | *+8%* | +33% | +2.01 | 20.6 / 3.1 |
| 35 | Marksman (marksman) | Aimed Shot (aimedShot) | +1.77 | *+0.79* | +19 | +42 | +3% | +20% | +3.36 | 28.0 / 5.9 |
| 36 | Enchantress (enchantress) | Heartbreak (heartbreak) | +1.75 | *+0.21* | +36 | +27 | +27% | +20% | +2.10 | 26.1 / 13.3 |
| 37 | Twinfang (twinfang) | Fan of Knives (fanOfKnives) | +1.75 | *-0.21* | +23 | +39 | +16% | +37% | +1.86 | 8.4 / 1.6 |
| 38 | Earth Mage (earthMage) | Earthquake (earthquake) | +1.72 | *+1.50* | +8 | +51 | *+1%* | +13% | +3.30 | 15.1 / 1.3 |
| 39 | Harpooner (harpooner) | Reel In (reelIn) | +1.70 | *+0.75* | +36 | +23 | +13% | *+7%* | +2.54 | 27.8 / 7.1 |
| 40 | Wildmane (wildmane) | Rage (rage) | +1.69 | +2.17 | +26 | +29 | +24% | +27% | +2.05 | 23.0 / 3.7 |
| 41 | Digger (digger) | Dirt Fling (dirtFling) | +1.64 | *+1.00* | +36 | +21 | +13% | *+3%* | +5.69 | 31.7 / 6.3 |
| 42 | Cleric (cleric) | Smite (smite) | +1.58 | *+0.88* | +19 | +36 | +15% | +23% | +1.28 | 55.4 / 24.4 |
| 43 | Digger (digger) | Burrow (burrow) | +1.51 | *+0.83* | +14 | +38 | *+3%* | +20% | +5.35 | 24.1 / 3.5 |
| 44 | Cultist (cultist) | Ritual Circle (ritualCircle) | +1.44 | +2.58 | *-3* | +49 | *-2%* | +43% | +2.47 | 14.8 / 1.5 |
| 45 | Cultist (cultist) | Sacrifice (soulCandle) | +1.42 | +2.67 | +36 | +11 | +16% | *+10%* | +1.93 | 23.5 / 3.2 |
| 46 | Monk (monk) | Inner Peace (innerPeace) | +1.41 | +3.17 | +6 | +39 | *+0%* | +23% | +5.29 | 13.1 / 10.4 |
| 47 | Samurai (samurai) | Crescent Cut (crescentCut) | +1.40 | *-0.92* | +35 | +16 | *+2%* | *+7%* | +4.05 | 15.0 / 2.8 |
| 48 | Chef (chef) | Hot Meal (hotMeal) | +1.38 | *+1.13* | +44 | *+4* | +29% | *+7%* | +1.40 | 26.9 / 4.3 |
| 49 | Shade (shade) | Shadow Clones (deathMark) | +1.37 | *-0.21* | +34 | +14 | +26% | *+0%* | +2.28 | 15.7 / 4.8 |
| 50 | Haymaker (haymaker) | Toss (toss) | +1.34 | *+0.54* | +23 | +24 | +12% | *+17%* | +3.22 | 18.1 / 4.1 |
| 51 | Griffon (griffon) | Stormhammer (hammerThrow) | +1.33 | *-0.33* | +26 | +21 | +4% | +27% | +1.14 | 25.0 / 10.2 |
| 52 | Harpooner (harpooner) | Drop Anchor (anchorDrop) | +1.33 | *+1.04* | +15 | +30 | +3% | +27% | +2.24 | 20.1 / 5.0 |
| 53 | Telekinetic (telekinetic) | Levitate (levitate) | +1.27 | +1.83 | +9 | +35 | *+0%* | *+0%* | +5.89 | 25.3 / 5.5 |
| 54 | Clockmaker (clockwork) | Rewind (rewind) | +1.25 | *+1.08* | +9 | +34 | *+0%* | *+3%* | +4.93 | 14.8 / 1.7 |
| 55 | Werewolf (werewolf) | Turn (turnWolf) | +1.25 | *-0.13* | -6 | +51 | *-2%* | +43% | +0.98 | 11.7 / 1.1 |
| 56 | Paladin (paladin) | Shield Bash (shieldBash) | +1.25 | *+0.71* | +30 | *+13* | +8% | *+10%* | +1.28 | 43.6 / 13.2 |
| 57 | Valkyrie (valkyrie) | Sky Dive (skyDive) | +1.24 | *+0.42* | *0* | +43 | *+0%* | +53% | +0.67 | 9.7 / 1.1 |
| 58 | Storm Mage (storm) | Chain Lightning (chainLightning) | +1.17 | *+0.33* | +21 | +21 | *+2%* | *+10%* | +2.68 | 28.9 / 19.7 |
| 59 | Bearskin (bearskin) | Hibernate (hibernate) | +1.16 | *+0.38* | +20 | +20 | *+3%* | +13% | +3.84 | 5.7 / 0.5 |
| 60 | Bearskin (bearskin) | Maul (maul) | +1.16 | *+0.13* | +6 | +34 | *+2%* | +37% | +2.97 | 29.3 / 5.8 |
| 61 | Valkyrie (valkyrie) | Spear of the Sky (spearThrow) | +1.12 | *+0.83* | *+0* | +38 | *+0%* | +43% | +0.55 | 12.3 / 1.2 |
| 62 | Plague Doctor (plague) | Cure (cure) | +1.11 | *+1.42* | +19 | +18 | +14% | +30% | +1.83 | 14.5 / 3.5 |
| 63 | Air Mage (airMage) | Cyclone (cyclone) | +1.10 | *+0.71* | +5 | +33 | *+1%* | +17% | +1.93 | 15.7 / 1.5 |
| 64 | Archer (archer) | Barrage (barrage) | +1.10 | *+0.46* | +8 | +30 | *+2%* | +20% | +3.34 | 41.5 / 9.2 |
| 65 | Old Guard (oldguard) | Parry (pommelStrike) | +1.08 | *+1.46* | +28 | *+8* | +9% | *+3%* | +2.37 | 45.5 / 10.5 |
| 66 | Falconer (falconer) | Loose the Falcon (looseFalcon) | +1.06 | +2.08 | +16 | +19 | *+3%* | *+13%* | +2.10 | 34.2 / 9.8 |
| 67 | Pirate (pirate) | Point Blank (pointBlank) | +1.05 | *+1.38* | *+3* | +33 | *+2%* | +27% | +4.74 | 59.1 / 8.9 |
| 68 | Engineer (engineer) | Deploy Turret (deployTurret) | +1.05 | *+1.88* | +7 | +28 | *+5%* | +30% | +1.25 | 19.3 / 1.2 |
| 69 | Beekeeper (beekeeper) | Honey Glaze (royalJelly) | +1.05 | +3.92 | +30 | *+3* | +22% | *-2%* | +1.79 | 24.5 / 4.2 |
| 70 | Earth Mage (earthMage) | Spike Chain (spikeChain) | +1.02 | *+0.50* | +20 | +15 | +12% | *+0%* | +3.17 | 38.5 / 11.8 |
| 71 | Crossbowman (crossbowman) | Crank Up (crankUp) | +1.00 | *+1.46* | +7 | +28 | *+0%* | *+10%* | +3.21 | 24.3 / 3.1 |
| 72 | Slinger (slinger) | Ram (ramCharge) | +0.99 | *+1.25* | +5 | +29 | *+1%* | +20% | +2.21 | 24.1 / 5.6 |
| 73 | Berserker (berserker) | Whirl (whirl) | +0.97 | *+0.29* | +7 | +26 | *+3%* | *+7%* | +2.35 | 25.1 / 6.9 |
| 74 | Telekinetic (telekinetic) | Hurl (hurl) | +0.94 | *+1.54* | +3 | +29 | *+0%* | *+0%* | +5.47 | 34.3 / 7.4 |
| 75 | Shaman (shaman) | Healing Totem (healTotem) | +0.93 | *+0.54* | +16 | *+16* | +12% | *+7%* | +1.43 | 23.8 / 6.8 |
| 76 | Twinfang (twinfang) | Backstab (backstab) | +0.91 | *-0.25* | +11 | +21 | +8% | *+7%* | +1.03 | 22.7 / 2.7 |
| 77 | Samurai (samurai) | Iaido (iaido) | +0.91 | *-0.38* | +19 | +14 | +5% | +13% | +3.65 | 17.3 / 3.1 |
| 78 | Warhelm (warhelm) | Storm Born (warHorn) | +0.90 | *+0.50* | +18 | +13 | *+2%* | *+7%* | +5.55 | 15.0 / 2.8 |
| 79 | Witch (witch) | Broom Ride (broomRide) | +0.90 | *+0.83* | +14 | +16 | +6% | +27% | +2.05 | 17.0 / 2.5 |
| 80 | Necromancer (necromancer) | Bone Spear (boneSpear) | +0.88 | *+0.25* | +20 | *+11* | +12% | *+10%* | +1.77 | 49.5 / 11.0 |
| 81 | Pirate (pirate) | Grog (grog) | +0.88 | +2.88 | +15 | +14 | +5% | *+7%* | +4.96 | 11.7 / 0.4 |
| 82 | Necromancer (necromancer) | Raise Dead (raiseDead) | +0.87 | +1.83 | *+3* | +26 | *+3%* | +30% | +0.28 | 27.8 / 2.3 |
| 83 | Dame (dame) | Challenge (challenge) | +0.87 | *+1.08* | *+1* | +28 | *-1%* | +30% | +0.19 | 5.0 / 0.5 |
| 84 | Bandit (rogueBandit) | Stick 'Em Up (lowBlow) | +0.86 | *-0.17* | +6 | +25 | *+1%* | +13% | +1.44 | 21.0 / 3.6 |
| 85 | Bard (bard) | War Song (warSong) | +0.86 | *-0.96* | +22 | *+11* | +15% | *+13%* | +0.97 | 19.2 / 3.2 |
| 86 | Chef (chef) | Food Fight (foodFight) | +0.85 | *+0.79* | *-2* | +30 | *-2%* | +40% | +0.96 | 15.3 / 3.2 |
| 87 | Engineer (engineer) | Wind-up Drones (shockMine) | +0.85 | *+0.25* | +12 | +17 | +13% | *+17%* | +0.78 | 39.7 / 9.4 |
| 88 | Pyromancer (pyromancer) | Fireball (fireball) | +0.85 | *-0.08* | +13 | +17 | +10% | *+10%* | +2.09 | 34.9 / 11.0 |
| 89 | Witch (witch) | Cursed Brew (cursedBrew) | +0.84 | +1.38 | *+3* | +25 | *0%* | +20% | +1.23 | 13.0 / 0.9 |
| 90 | Warden (warden) | Manacles (manacle) | +0.84 | *+0.54* | +16 | +13 | +10% | *+7%* | +0.71 | 29.5 / 8.2 |
| 91 | Bulwark (bulwark) | Brace (brace) | +0.83 | *+0.42* | +20 | *+9* | +23% | *+20%* | +0.80 | 31.7 / 15.7 |
| 92 | Storm Mage (storm) | Zeus Bolt (stormCloud) | +0.79 | *-0.17* | +15 | +15 | +5% | *+10%* | +2.99 | 22.2 / 13.5 |
| 93 | Shade (shade) | Blackout (blackout) | +0.79 | *-1.29* | +6 | +23 | *+4%* | +20% | +2.18 | 6.7 / 1.1 |
| 94 | Tower (tower) | Hold the Line (holdTheLine) | +0.75 | *+0.25* | *+2* | +25 | *+5%* | +20% | +0.41 | 18.6 / 2.7 |
| 95 | Dame (dame) | Disarm (disarm) | +0.75 | +2.17 | +14 | *+9* | *+6%* | *+7%* | +0.54 | 26.2 / 10.6 |
| 96 | Gladiator (gladiator) | Shield Rush (shieldRush) | +0.74 | *+0.54* | +8 | +17 | *+2%* | *+17%* | +2.70 | 26.8 / 6.2 |
| 97 | Bearskin (bearskin) | Bear Claws (bearRoar) | +0.73 | *+1.17* | *+4* | +21 | *+2%* | +17% | +3.41 | 24.6 / 4.6 |
| 98 | Plague Doctor (plague) | Gas Form (leeches) | +0.71 | *+1.13* | +12 | *+11* | +7% | +30% | +1.38 | 15.8 / 4.5 |
| 99 | Ninja (ninja) | Caltrops (caltrops) | +0.71 | *-0.63* | *+5* | +21 | *+2%* | +27% | +0.92 | 24.3 / 7.5 |
| 100 | Grenadier (grenadier) | Sticky Bomb (stickyBomb) | +0.69 | *+0.54* | +6 | +17 | *+0%* | *+7%* | +1.60 | 32.6 / 8.3 |
| 101 | Bandit (rogueBandit) | Bolas (smokeBomb) | +0.67 | *+0.63* | +9 | +14 | *+1%* | *+0%* | +2.65 | 23.0 / 3.9 |
| 102 | Trapper (trapper) | Double Barrel (snareNet) | +0.67 | +2.13 | +10 | *+9* | *+3%* | *+10%* | +1.99 | 34.7 / 7.1 |
| 103 | Cleric (cleric) | Mending Ray (mend) | +0.67 | *+1.63* | *-1* | +21 | *+2%* | *-3%* | +0.57 | 35.3 / 0.9 |
| 104 | Wildmane (wildmane) | Cleave (cleave) | +0.64 | *+1.17* | *0* | +21 | *-2%* | +13% | +0.89 | 8.8 / 0.7 |
| 105 | Javelin Huntress (huntress) | Javelin Rain (prey) | +0.60 | *+0.83* | +6 | +15 | *+0%* | *+0%* | +1.39 | 24.2 / 2.9 |
| 106 | Plague Doctor (plague) | Miasma (miasma) | +0.60 | *-1.00* | *+2* | +21 | *+2%* | +27% | +0.65 | 17.9 / 3.0 |
| 107 | Pirate (pirate) | Broadside (broadside) | +0.57 | *+0.38* | *-2* | +22 | *+0%* | +20% | +1.65 | 18.4 / 1.4 |
| 108 | Harpooner (harpooner) | Rogue Wave (rogueWave) | +0.57 | +1.54 | *0* | +18 | *+0%* | +13% | +0.58 | 8.8 / 0.9 |
| 109 | Bard (bard) | Encore (encore) | +0.56 | *+1.08* | *+4* | +14 | *+2%* | *+10%* | +0.36 | 22.2 / 1.0 |
| 110 | Ninja (ninja) | Substitution (substitution) (passive) | +0.55 | *+0.46* | +15 | *+4* | +7% | *+3%* | +0.64 | 0.0 / 0.0 |
| 111 | Archer (archer) | Frost Arrow (frostArrow) | +0.54 | *+1.17* | *+1* | +17 | *+0%* | *+0%* | +2.18 | 42.3 / 9.4 |
| 112 | Pyromancer (pyromancer) | Flame Wall (flameWall) | +0.54 | *+0.75* | *+2* | +16 | *+3%* | *+3%* | +1.62 | 11.5 / 1.1 |
| 113 | Haymaker (haymaker) | Pitch Hay (pitchHay) | +0.53 | *-1.04* | *+1* | +19 | *+1%* | *+15%* | +0.54 | 5.6 / 0.6 |
| 114 | The Mob (mob) | Scatter (scatter) | +0.51 | *+0.67* | +7 | *+10* | *+3%* | *+13%* | +3.10 | 5.7 / 0.7 |
| 115 | Slinger (slinger) | Counting Sheep (gravel) | +0.51 | +1.71 | +2 | +14 | *+0%* | *+7%* | +0.80 | 24.8 / 6.0 |
| 116 | Quartermaster (quartermaster) | Barricade (oilBlades) | +0.50 | *-0.21* | +9 | *+9* | +8% | *+7%* | +0.08 | 14.2 / 1.8 |
| 117 | Shade (shade) | Shadow Walk (shadowWalk) | +0.50 | *-1.04* | +3 | +16 | +5% | *+7%* | +1.11 | 8.2 / 1.5 |
| 118 | Trapper (trapper) | Bush (tripwire) | +0.50 | +2.75 | +7 | *+8* | +7% | +23% | +1.84 | 9.2 / 0.8 |
| 119 | Berserker (berserker) | Shockwave (shockwave) | +0.49 | *+1.00* | *-3* | +19 | *-1%* | *+3%* | +1.95 | 13.8 / 1.3 |
| 120 | Warhelm (warhelm) | Thunder Blow (thunderBlow) | +0.45 | *+0.17* | +5 | +11 | *+0%* | +17% | +2.12 | 20.0 / 5.1 |
| 121 | Air Mage (airMage) | Gale (gale) | +0.44 | *+1.00* | +3 | *+11* | *+0%* | *+3%* | +1.72 | 36.5 / 15.2 |
| 122 | Grenadier (grenadier) | Big Bomb (bigBomb) | +0.44 | *+0.00* | +1 | +14 | *+0%* | *+3%* | +1.39 | 14.1 / 1.2 |
| 123 | Cultist (cultist) | Blood Pact (bloodPact) | +0.42 | +2.00 | *0* | +13 | *-2%* | *+3%* | +0.23 | 17.9 / 0.5 |
| 124 | Digger (digger) | Bury (spadeBat) | +0.41 | *+0.42* | +5 | +9 | *+0%* | *+0%* | +2.20 | 27.5 / 5.9 |
| 125 | Clockmaker (clockwork) | Slow Time (timeBubble) | +0.40 | *+0.38* | +3 | +11 | *+0%* | *+3%* | +3.56 | 27.0 / 15.8 |
| 126 | Druid (druid) | Entangle (entangle) | +0.40 | *+0.25* | *+6* | *+7* | *+6%* | *+7%* | +0.47 | 16.7 / 2.4 |
| 127 | Marksman (marksman) | Ricochet (ricochet) | +0.39 | *+0.17* | *+2* | +11 | *+0%* | *+3%* | +1.66 | 15.7 / 1.2 |
| 128 | Alchemist (alchemist) | Brew Pools (acidFlask) | +0.38 | +1.71 | +12 | *0* | +7% | *+3%* | +2.39 | 39.4 / 8.6 |
| 129 | Witch (witch) | Hex (frogHex) | +0.37 | *+0.88* | +6 | *+6* | *+5%* | *+10%* | +1.28 | 28.6 / 10.1 |
| 130 | Grandpa Sickle (grandpa) | Old Tales (oldTales) | +0.37 | *+1.50* | *-4* | *+12* | *-3%* | *+7%* | +0.05 | 17.5 / 0.4 |
| 131 | Falconer (falconer) | Call the Flock (flock) | +0.36 | *-0.83* | +10 | *+4* | *+3%* | *+10%* | +1.55 | 15.4 / 3.2 |
| 132 | Seer (seer) | Ill Omen (starfall) | +0.33 | *-0.88* | *+2* | *+14* | +5% | *+13%* | +0.82 | 6.3 / 1.5 |
| 133 | Ninja (ninja) | Kunai Rain (shurikenFan) | +0.33 | -1.38 | *+2* | +12 | *+3%* | *+17%* | +0.24 | 33.3 / 10.4 |
| 134 | Jester (jester) | Befuddle (befuddle) (passive) | +0.32 | *+0.79* | +10 | *+1* | *+0%* | *-3%* | +0.94 | 0.0 / 0.0 |
| 135 | Pyromancer (pyromancer) | Inferno (inferno) | +0.32 | *-0.17* | +6 | *+5* | *+3%* | *+7%* | +0.67 | 9.4 / 1.9 |
| 136 | Jester (jester) | Swap (mock) | +0.32 | *+0.33* | +7 | *+4* | *+0%* | *-3%* | +1.25 | 29.0 / 6.7 |
| 137 | Gladiator (gladiator) | Spear of Ares (netThrow) | +0.32 | *+0.46* | +4 | *+7* | *+0%* | *+3%* | +2.38 | 25.9 / 5.9 |
| 138 | Storm Mage (storm) | Thunderclap (thunderclap) | +0.31 | *+0.42* | *+1* | *+9* | *-2%* | +13% | +1.34 | 10.6 / 0.8 |
| 139 | Necromancer (necromancer) | Life Drain (lifeDrain) | +0.31 | +2.42 | *+3* | *+5* | *-2%* | *+3%* | +0.79 | 37.0 / 6.3 |
| 140 | Warlock (warlock) | Eldritch Beam (eldritchBeam) | +0.29 | *+0.50* | -13 | +22 | *-2%* | *+13%* | -0.34 | 18.8 / 5.5 |
| 141 | Shaman (shaman) | Spirit Link (spiritLink) | +0.29 | -2.17 | *0* | *+17* | *-1%* | *+10%* | -0.08 | 23.2 / 0.5 |
| 142 | Beekeeper (beekeeper) | Beehive (honeyPot) | +0.28 | *+1.88* | *-4* | *+10* | -6% | *+0%* | +1.41 | 21.1 / 2.9 |
| 143 | Griffon (griffon) | Wing Guard (wingShield) | +0.26 | *-0.50* | +3 | *+7* | *+0%* | *+17%* | +0.25 | 12.5 / 3.9 |
| 144 | Warhelm (warhelm) | Skull Splitter (skullSplitter) | +0.26 | *+1.58* | +7 | *+2* | *+1%* | *+3%* | +4.06 | 18.7 / 2.3 |
| 145 | Seer (seer) | Blinding Flash (premonition) | +0.26 | *-1.25* | +12 | *-1* | +10% | *+3%* | +1.28 | 21.4 / 12.2 |
| 146 | Slinger (slinger) | Stunning Stone (stunStone) | +0.25 | *+1.21* | +4 | *+4* | *+0%* | *-3%* | +1.59 | 37.5 / 10.4 |
| 147 | Crossbowman (crossbowman) | Pinning Bolt (pinBolt) | +0.25 | *+0.38* | +1 | *+7* | *+0%* | *+3%* | +2.03 | 33.3 / 4.4 |
| 148 | Clockmaker (clockwork) | Stop the Clock (stopClock) | +0.23 | *+0.00* | +4 | *+4* | *+0%* | *+3%* | +1.67 | 19.2 / 6.9 |
| 149 | Monk (monk) | Palm Strike (palmStrike) | +0.23 | *+1.04* | +7 | *-1* | *+1%* | *+7%* | +1.26 | 39.5 / 13.1 |
| 150 | Telekinetic (telekinetic) | Mind Shield (mindShield) | +0.23 | *-0.04* | +0 | +8 | *+0%* | *+0%* | +2.20 | 8.1 / 0.6 |
| 151 | Griffon (griffon) | Swoop (swoop) | +0.20 | *-0.17* | *+0* | +7 | *+0%* | *+13%* | +0.19 | 6.2 / 0.7 |
| 152 | Bard (bard) | Lullaby (lullaby) | +0.20 | *+0.21* | *+7* | *+0* | *+6%* | *+3%* | +0.24 | 9.9 / 1.5 |
| 153 | Twinfang (twinfang) | Dash (dash) | +0.19 | *-0.17* | *+3* | *+4* | *+2%* | *-3%* | +0.01 | 25.5 / 5.2 |
| 154 | Chef (chef) | Grease Fire (greaseFire) | +0.19 | *-0.21* | *-6* | *+14* | -7% | *+20%* | +1.06 | 8.4 / 1.0 |
| 155 | Enchantress (enchantress) | Heartstring (heartstring) | +0.19 | *+1.08* | -23 | +28 | -17% | +23% | +1.01 | 36.2 / 14.6 |
| 156 | Frost Mage (frost) | Ice Wall (iceWall) | +0.18 | *+1.42* | *+3* | *+3* | *+2%* | *+0%* | +0.52 | 12.8 / 3.0 |
| 157 | Alchemist (alchemist) | Monstrosity (bangFlask) | +0.17 | *+0.21* | -9 | *+15* | *+1%* | *+7%* | +0.69 | 11.1 / 1.2 |
| 158 | Paladin (paladin) | Guard (guard) | +0.16 | *+1.21* | *+2* | *+0* | *+3%* | *-7%* | +0.17 | 9.9 / 0.6 |
| 159 | Quartermaster (quartermaster) | Supply Crate (resupply) | +0.15 | *+0.67* | *-5* | *+9* | *-1%* | *+10%* | +0.15 | 20.6 / 0.2 |
| 160 | Samurai (samurai) | Focus (focus) | +0.14 | *-1.08* | +3 | *+3* | *+1%* | *+3%* | +1.17 | 8.2 / 1.1 |
| 161 | Falconer (falconer) | Keen Eye (keenEye) | +0.13 | *-0.54* | *0* | *+5* | *+0%* | *+3%* | +0.65 | 16.2 / 1.7 |
| 162 | Javelin Huntress (huntress) | Spear Lunge (runningThrow) | +0.13 | -1.42 | *+0* | *+5* | *+0%* | *+0%* | +0.79 | 43.1 / 2.1 |
| 163 | Marksman (marksman) | Bayonet (bayonet) | +0.13 | *+0.00* | *+1* | *+3* | *+1%* | *-3%* | +0.93 | 6.9 / 0.4 |
| 164 | Earth Mage (earthMage) | Stone Wall (stoneWall) | +0.10 | *+0.50* | -2 | +5 | *+0%* | *+0%* | +0.66 | 16.8 / 6.5 |
| 165 | Warlock (warlock) | Awaken (summonImp) | +0.07 | *-1.13* | -10 | +14 | *-1%* | *-3%* | +0.81 | 6.4 / 0.4 |
| 166 | Crossbowman (crossbowman) | Pavise (pavise) | +0.06 | *+1.21* | +2 | *+0* | *+0%* | *+0%* | +1.24 | 19.6 / 2.1 |
| 167 | Archer (archer) | Roll (roll) | +0.04 | *+0.50* | *-3* | *+4* | *+1%* | *-3%* | +0.35 | 9.8 / 0.7 |
| 168 | Frost Mage (frost) | Frost Nova (frostNova) | +0.04 | *+1.13* | *0* | *+1* | *+0%* | *+0%* | +0.54 | 11.5 / 1.2 |
| 169 | Granny Reaper (granny) | Old Bones (oldBones) (passive) | +0.03 | *+0.67* | *-2* | *+2* | *+0%* | *+7%* | +0.15 | 0.0 / 0.0 |
| 170 | Valkyrie (valkyrie) | Valkyrie's Call (valkyrieCall) | +0.02 | *+0.83* | *0* | *0* | *+0%* | *-3%* | -0.21 | 1.0 / 0.0 |
| 171 | Javelin Huntress (huntress) | Bound (bound) | +0.00 | *+1.58* | +2 | *-2* | *+0%* | *+0%* | +0.55 | 20.8 / 1.8 |
| 172 | Trapper (trapper) | Jaw Trap (jawTrap) | -0.06 | +1.71 | *+3* | *-6* | *+3%* | *-7%* | +0.75 | 38.8 / 7.0 |
| 173 | Grenadier (grenadier) | Blast Off (blastOff) | -0.12 | *-0.17* | *+0* | *-4* | *+0%* | *+0%* | +0.58 | 12.4 / 0.6 |
| 174 | Beekeeper (beekeeper) | Smoker (swarm) | -0.15 | *-0.29* | *+4* | *-8* | *+2%* | *-7%* | +0.45 | 23.5 / 8.4 |
| 175 | The Mob (mob) | Surround (surround) | -0.24 | *+0.08* | *+1* | *-10* | *+0%* | *-10%* | +0.90 | 9.4 / 0.9 |
| 176 | Bulwark (bulwark) | Shield Wall (shieldWall) | -0.37 | *-0.71* | *-3* | *-9* | *-2%* | *-3%* | +0.03 | 8.0 / 3.0 |
| 177 | Warlock (warlock) | Dark Bargain (darkBargain) | -0.43 | *-0.50* | *-2* | *-12* | *+2%* | *-20%* | +0.91 | 5.5 / 0.6 |

## Abilities worth about nothing

Neither switching it off (kit) nor having it alone (alone) makes a clear difference in any of the three measures (dungeon
rooms, duel health, group health). The "why" column checks whether it fires at all.

| Hero | Ability | Rooms kit / alone | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels kit / alone | Group kit / alone | Casts (full) | Why |
|---|---|---|---|---|---|---|---|
| Valkyrie (valkyrie) | Valkyrie's Call (valkyrieCall) | *+0.83* / *+0.13* | *+0.2* / *-0.3* / *+0.2* | *0* / *+0* | *0* / *-7* | 1.0 / 0.0 | fires rarely (1.0 / 0.0; alone 0.8 / 0.0) |
| Archer (archer) | Roll (roll) | *+0.50* / *+1.04* | +1.3 / *+0.2* / *+0.1* | *-3* / *+9* | *+4* / *+2* | 9.8 / 0.7 | fires (9.8 / 0.7) but changes little |
| Quartermaster (quartermaster) | Supply Crate (resupply) | *+0.67* / *+0.42* | *+0.2* / *+0.1* / *+0.3* | *-5* / *-4* | *+9* / *+9* | 20.6 / 0.2 | fires (20.6 / 0.2) but changes little |
| Grandpa Sickle (grandpa) | Old Tales (oldTales) | *+1.50* / *+0.54* | *+0.1* / *-0.2* / *-0.0* | *-4* / *0* | *+12* / *+2* | 17.5 / 0.4 | fires (17.5 / 0.4) but changes little |
| Druid (druid) | Entangle (entangle) | *+0.25* / *+1.25* | +0.4 / *+0.2* / *+0.2* | *+6* / *+9* | *+7* / *+6* | 16.7 / 2.4 | fires (16.7 / 2.4) but changes little |

Worth nothing **to the kit** but clearly worth something alone (the other two already do its job, so switching it off costs
nothing while they are on):

| Hero | Ability | Rooms kit / alone | Duels kit / alone | Group kit / alone | Casts (full) |
|---|---|---|---|---|---|
| Warlock (warlock) | Dark Bargain (darkBargain) | *-0.50* / *+0.17* | *-2* / *+3* | *-12* / +29 | 5.5 / 0.6 |
| Bulwark (bulwark) | Shield Wall (shieldWall) | *-0.71* / *+0.46* | *-3* / -1 | *-9* / *+2* | 8.0 / 3.0 |
| The Mob (mob) | Surround (surround) | *+0.08* / *+0.21* | *+1* / +24 | *-10* / *+8* | 9.4 / 0.9 |
| Beekeeper (beekeeper) | Smoker (swarm) | *-0.29* / *+0.63* | *+4* / *+6* | *-8* / +9 | 23.5 / 8.4 |
| Grenadier (grenadier) | Blast Off (blastOff) | *-0.17* / *+1.04* | *+0* / +6 | *-4* / +13 | 12.4 / 0.6 |
| Granny Reaper (granny) | Old Bones (oldBones) | *+0.67* / *-0.04* | *-2* / +3 | *+2* / *+2* | 0.0 / 0.0 |
| Frost Mage (frost) | Frost Nova (frostNova) | *+1.13* / *+0.79* | *0* / +14 | *+1* / *+3* | 11.5 / 1.2 |
| Marksman (marksman) | Bayonet (bayonet) | *+0.00* / *+0.29* | *+1* / +32 | *+3* / *+1* | 6.9 / 0.4 |
| Falconer (falconer) | Keen Eye (keenEye) | *-0.54* / *+1.08* | *0* / *-2* | *+5* / +22 | 16.2 / 1.7 |
| Paladin (paladin) | Guard (guard) | *+1.21* / +2.04 | *+2* / *+1* | *+0* / *+4* | 9.9 / 0.6 |
| Frost Mage (frost) | Ice Wall (iceWall) | *+1.42* / +1.38 | *+3* / +11 | *+3* / *+4* | 12.8 / 3.0 |
| Chef (chef) | Grease Fire (greaseFire) | *-0.21* / *-0.88* | *-6* / *+8* | *+14* / +30 | 8.4 / 1.0 |
| Twinfang (twinfang) | Dash (dash) | *-0.17* / +1.58 | *+3* / +2 | *+4* / *-4* | 25.5 / 5.2 |
| Bard (bard) | Lullaby (lullaby) | *+0.21* / *-0.38* | *+7* / *-2* | *+0* / +11 | 9.9 / 1.5 |
| Beekeeper (beekeeper) | Beehive (honeyPot) | *+1.88* / +1.25 | *-4* / +26 | *+10* / +21 | 21.1 / 2.9 |
| Storm Mage (storm) | Thunderclap (thunderclap) | *+0.42* / +1.54 | *+1* / +17 | *+9* / +28 | 10.6 / 0.8 |
| Seer (seer) | Ill Omen (starfall) | *-0.88* / *+0.33* | *+2* / *+4* | *+14* / +24 | 6.3 / 1.5 |

Casts, all 177: 4 passive (Old Bones (oldBones), Substitution (substitution), Befuddle (befuddle), Frenzy (frenzy)); never cast in the full build: none; under one cast a dungeon run and under 0.3 a battle fight: Valkyrie's Call (valkyrieCall) [Valkyrie] 1.0 / 0.0.

## Abilities that carry their hero

Switching this one off takes away most of what the whole kit is worth (the share is "minus one" worth over "full minus bare"; 100% means
the hero without it is as weak as with nothing). Listed when the share is 60% or more in at least two of the three measures.

| Hero | Ability | Share: rooms / duels / group | Rooms full, without it, bare | Duels win full, without it, bare | Group win full, without it, bare |
|---|---|---|---|---|---|
| Grandpa Sickle (grandpa) | Bread Toss (breadToss) | 75% / 95% / 76% | 7.2, 3.9, 2.8 | 93%, 1%, 0% | 77%, 17%, 0% |
| Werewolf (werewolf) | Frenzy (frenzy) | 94% / 70% / 36% | 6.3, 3.6, 3.5 | 96%, 23%, 0% | 100%, 77%, 7% |
| Alchemist (alchemist) | Elixir (elixir) | 107% / 54% / 67% | 8.1, 3.9, 4.2 | 99%, 75%, 43% | 100%, 40%, 3% |
| Jester (jester) | Juggling Act (juggle) | 69% / 50% / 80% | 6.0, 4.8, 4.2 | 100%, 72%, 18% | 97%, 47%, 30% |
| Frost Mage (frost) | Ice Shard (iceShard) | 96% / 70% / 81% | 6.6, 3.3, 3.2 | 100%, 82%, 67% | 100%, 50%, 33% |
| Quartermaster (quartermaster) | Pot Helmet (flare) | 42% / 96% / 73% | 6.1, 5.2, 3.9 | 81%, 28%, 25% | 40%, 10%, 3% |
| Dame (dame) | Riposte (riposte) | - / 72% / 89% | 6.3, 5.4, 5.3 | 29%, 0%, 0% | 50%, 7%, 0% |
| Shaman (shaman) | Ancestors' Call (rainDance) | 117% / 34% / 81% | 6.8, 5.0, 5.3 | 57%, 51%, 23% | 50%, 7%, 0% |
| Tower (tower) | Charge (charge) | 71% / 81% / 32% | 6.3, 5.3, 4.9 | 28%, 8%, 1% | 73%, 47%, 3% |
| Twinfang (twinfang) | Fan of Knives (fanOfKnives) | - / 68% / 62% | 4.5, 4.8, 4.5 | 33%, 17%, 5% | 97%, 60%, 30% |
| Griffon (griffon) | Stormhammer (hammerThrow) | - / 89% / 66% | 4.2, 4.5, 4.3 | 4%, 0%, 0% | 30%, 3%, 0% |

## Tier steps that change nothing

"I to III" is full minus "one at I": the whole upgrade path. Where an ability is worth nothing at all its upgrades are
worth nothing too, so the list that matters is abilities that **are** worth something to the kit but whose tiers II and
III add nothing clear in any measure (33 of 177):

| Hero | Ability | Rooms: kit / I to III | Duels: kit / I to III | Group: kit / I to III | Score: kit / I to III |
|---|---|---|---|---|---|
| Grandpa Sickle (grandpa) | Harvest (harvest) | *+1.13* / *+0.54* | +20 / *+5* | +47 / *+22* | +1.93 / +0.79 |
| Chef (chef) | Hot Meal (hotMeal) | *+1.13* / *-0.21* | +44 / *-2* | *+4* / *+3* | +1.38 / +0.03 |
| Storm Mage (storm) | Chain Lightning (chainLightning) | *+0.33* / *-0.71* | +21 / *0* | +21 / *+10* | +1.17 / +0.24 |
| Bearskin (bearskin) | Hibernate (hibernate) | *+0.38* / *+0.17* | +20 / *-1* | +20 / *+2* | +1.16 / +0.01 |
| Valkyrie (valkyrie) | Spear of the Sky (spearThrow) | *+0.83* / *-0.54* | *+0* / *+0* | +38 / *+1* | +1.12 / +0.03 |
| Engineer (engineer) | Deploy Turret (deployTurret) | *+1.88* / *+0.42* | +7 / *+2* | +28 / *+12* | +1.05 / +0.41 |
| Earth Mage (earthMage) | Spike Chain (spikeChain) | *+0.50* / *+0.21* | +20 / *+1* | +15 / *+2* | +1.02 / +0.10 |
| Samurai (samurai) | Iaido (iaido) | *-0.38* / *-0.46* | +19 / *+1* | +14 / *+0* | +0.91 / +0.03 |
| Necromancer (necromancer) | Bone Spear (boneSpear) | *+0.25* / *+0.21* | +20 / *+4* | *+11* / *+4* | +0.88 / +0.25 |
| Necromancer (necromancer) | Raise Dead (raiseDead) | +1.83 / *+1.00* | *+3* / *0* | +26 / *+3* | +0.87 / +0.11 |
| Dame (dame) | Challenge (challenge) | *+1.08* / *+0.83* | *+1* / *+0* | +28 / *+4* | +0.87 / +0.13 |
| Cleric (cleric) | Mending Ray (mend) | *+1.63* / *+1.00* | *-1* / *+0* | +21 / *+5* | +0.67 / +0.19 |
| Wildmane (wildmane) | Cleave (cleave) | *+1.17* / *+1.29* | *0* / *-1* | +21 / *+6* | +0.64 / +0.18 |
| Plague Doctor (plague) | Miasma (miasma) | *-1.00* / *-0.71* | *+2* / *+0* | +21 / *+0* | +0.60 / -0.03 |
| Harpooner (harpooner) | Rogue Wave (rogueWave) | +1.54 / *+0.04* | *0* / *+0* | +18 / *+5* | +0.57 / +0.14 |
| Haymaker (haymaker) | Pitch Hay (pitchHay) | *-1.04* / *-0.21* | *+1* / *0* | +19 / *+9* | +0.53 / +0.25 |
| Slinger (slinger) | Counting Sheep (gravel) | +1.71 / *+0.50* | +2 / *+1* | +14 / *-1* | +0.51 / +0.01 |
| Warhelm (warhelm) | Thunder Blow (thunderBlow) | *+0.17* / *-0.17* | +5 / *+0* | +11 / *+10* | +0.45 / +0.28 |
| Grenadier (grenadier) | Big Bomb (bigBomb) | *+0.00* / *-0.17* | +1 / *+0* | +14 / *+3* | +0.44 / +0.08 |
| Cultist (cultist) | Blood Pact (bloodPact) | +2.00 / *+1.04* | *0* / *+0* | +13 / *+6* | +0.42 / +0.19 |
| Alchemist (alchemist) | Brew Pools (acidFlask) | +1.71 / *+0.79* | +12 / *+1* | *0* / *-4* | +0.38 / -0.07 |
| Witch (witch) | Hex (frogHex) | *+0.88* / *-0.25* | +6 / *+2* | *+6* / *+8* | +0.37 / +0.28 |
| Pyromancer (pyromancer) | Inferno (inferno) | *-0.17* / *-1.13* | +6 / *+3* | *+5* / *-1* | +0.32 / +0.07 |
| Warlock (warlock) | Eldritch Beam (eldritchBeam) | *+0.50* / *-1.04* | -13 / *-2* | +22 / *+1* | +0.29 / -0.14 |
| Shaman (shaman) | Spirit Link (spiritLink) | -2.17 / *-0.54* | *0* / *+0* | *+17* / *+4* | +0.29 / +0.09 |
| Crossbowman (crossbowman) | Pinning Bolt (pinBolt) | *+0.38* / *+0.83* | +1 / *+0* | *+7* / *+3* | +0.25 / +0.09 |
| Clockmaker (clockwork) | Stop the Clock (stopClock) | *+0.00* / *+0.17* | +4 / *+2* | *+4* / *-1* | +0.23 / +0.01 |
| Monk (monk) | Palm Strike (palmStrike) | *+1.04* / *-0.25* | +7 / *+0* | *-1* / *0* | +0.23 / -0.02 |
| Telekinetic (telekinetic) | Mind Shield (mindShield) | *-0.04* / *+0.63* | +0 / *0* | +8 / *+4* | +0.23 / +0.11 |
| Warlock (warlock) | Awaken (summonImp) | *-1.13* / *+0.17* | -10 / *+1* | +14 / *+8* | +0.07 / +0.25 |
| Crossbowman (crossbowman) | Pavise (pavise) | *+1.21* / *+1.46* | +2 / *0* | *+0* / *0* | +0.06 / +0.01 |
| Javelin Huntress (huntress) | Bound (bound) | *+1.58* / *+0.29* | +2 / *+1* | *-2* / *-1* | +0.00 / -0.00 |
| Trapper (trapper) | Jaw Trap (jawTrap) | +1.71 / *+1.38* | *+3* / *+1* | *-6* / *-5* | -0.06 / -0.08 |

All 50 abilities with no clear I-to-III change, for the record: Dash (dash) [Twinfang], Cleave (cleave) [Wildmane], Old Bones (oldBones) [Granny Reaper], Inferno (inferno) [Pyromancer], Frost Nova (frostNova) [Frost Mage], Ice Wall (iceWall) [Frost Mage], Chain Lightning (chainLightning) [Storm Mage], Thunderclap (thunderclap) [Storm Mage], Mending Ray (mend) [Cleric], Entangle (entangle) [Druid], Raise Dead (raiseDead) [Necromancer], Bone Spear (boneSpear) [Necromancer], Miasma (miasma) [Plague Doctor], Challenge (challenge) [Dame], Hibernate (hibernate) [Bearskin], Thunder Blow (thunderBlow) [Warhelm], Pitch Hay (pitchHay) [Haymaker], Harvest (harvest) [Grandpa Sickle], Old Tales (oldTales) [Grandpa Sickle], Brew Pools (acidFlask) [Alchemist], Spirit Link (spiritLink) [Shaman], Hex (frogHex) [Witch], Eldritch Beam (eldritchBeam) [Warlock], Awaken (summonImp) [Warlock], Dark Bargain (darkBargain) [Warlock], Blood Pact (bloodPact) [Cultist], Palm Strike (palmStrike) [Monk], Ill Omen (starfall) [Seer], Hot Meal (hotMeal) [Chef], Smoker (swarm) [Beekeeper], Beehive (honeyPot) [Beekeeper], Supply Crate (resupply) [Quartermaster], Pavise (pavise) [Crossbowman], Pinning Bolt (pinBolt) [Crossbowman], Keen Eye (keenEye) [Falconer], Big Bomb (bigBomb) [Grenadier], Blast Off (blastOff) [Grenadier], Rogue Wave (rogueWave) [Harpooner], Bound (bound) [Javelin Huntress], Bayonet (bayonet) [Marksman], Counting Sheep (gravel) [Slinger], Jaw Trap (jawTrap) [Trapper], Iaido (iaido) [Samurai], Valkyrie's Call (valkyrieCall) [Valkyrie], Spear of the Sky (spearThrow) [Valkyrie], Deploy Turret (deployTurret) [Engineer], Surround (surround) [The Mob], Stop the Clock (stopClock) [Clockmaker], Mind Shield (mindShield) [Telekinetic], Spike Chain (spikeChain) [Earth Mage].

The upgrades worth the most (I to III, combined score):

| Hero | Ability | Rooms I to III | Duels I to III | Group I to III | Score I to III | Score kit |
|---|---|---|---|---|---|---|
| Granny Reaper (granny) | Hook (hook) | *+0.25* | +72 | +35 | +3.03 | +4.59 |
| Berserker (berserker) | Unstoppable (unstoppable) | *+0.38* | +82 | +16 | +2.83 | +3.68 |
| Haymaker (haymaker) | Hay Bale (forkCharge) | *+0.42* | +65 | +30 | +2.74 | +2.69 |
| Granny Reaper (granny) | Reap (reap) | +1.71 | +50 | +29 | +2.29 | +3.91 |
| Bulwark (bulwark) | Impale (impale) | *+0.13* | +55 | +14 | +1.95 | +2.17 |
| Old Guard (oldguard) | Rally (rallyCry) | +2.71 | +24 | +42 | +1.93 | +1.94 |
| Dame (dame) | Riposte (riposte) | *+1.50* | +34 | +32 | +1.92 | +2.44 |
| Gladiator (gladiator) | Arena (showboat) | *+0.50* | +38 | +25 | +1.80 | +2.34 |
| Seer (seer) | Foresight (foresight) | *+0.50* | +38 | +24 | +1.74 | +2.05 |
| Paladin (paladin) | Consecrate (consecrate) | +2.00 | *+3* | +54 | +1.73 | +3.06 |
| Enchantress (enchantress) | Heartbreak (heartbreak) | *+1.54* | +25 | +31 | +1.64 | +1.75 |
| Bandit (rogueBandit) | Dirty Trick (pickpocket) | *+0.25* | +32 | +22 | +1.55 | +2.95 |
| Harpooner (harpooner) | Reel In (reelIn) | *+1.21* | +38 | +14 | +1.53 | +1.70 |
| Quartermaster (quartermaster) | Pot Helmet (flare) | *+0.88* | +29 | +23 | +1.52 | +2.46 |
| Old Guard (oldguard) | Great Sweep (greatSweep) | *+0.38* | +28 | +24 | +1.46 | +2.04 |

Upgrades that make it **worse** (I to III clearly negative somewhere):

| Hero | Ability | Rooms I to III | Duels I to III | Group I to III |
|---|---|---|---|---|
| Bard (bard) | Lullaby (lullaby) | -1.75 | *+3* | *-4* |
| Plague Doctor (plague) | Cure (cure) | *+0.79* | +3 | -86 |
| Griffon (griffon) | Wing Guard (wingShield) | -1.17 | +1 | *+3* |
| Bulwark (bulwark) | Brace (brace) | *-0.29* | -16 | *+4* |
| Bulwark (bulwark) | Shield Wall (shieldWall) | *+0.08* | *-2* | -12 |
| Shaman (shaman) | Healing Totem (healTotem) | -1.67 | +9 | +17 |
| Monk (monk) | Inner Peace (innerPeace) | +2.42 | -3 | +41 |
| Seer (seer) | Blinding Flash (premonition) | -1.54 | +6 | *-2* |
| Ninja (ninja) | Substitution (substitution) | -1.83 | *+2* | *-2* |

### The five steps flagged earlier

Each step on its own (tier II minus tier I, tier III minus tier II), the other two abilities at III:

| Hero | Ability | Step | Rooms | Duels health | Group health | Duels win | Group win |
|---|---|---|---|---|---|---|---|
| Clockmaker (clockwork) | Rewind (rewind) | I to II | *+0.67* | +1 | +7 | *+0%* | *+0%* |
| Clockmaker (clockwork) | Rewind (rewind) | II to III | *-0.25* | *0* | *+5* | *+0%* | *+0%* |
| Clockmaker (clockwork) | Slow Time (timeBubble) | I to II | *+0.04* | *+2* | *-3* | *+0%* | *+0%* |
| Clockmaker (clockwork) | Slow Time (timeBubble) | II to III | *+1.04* | +5 | *+4* | *+0%* | *+0%* |
| Clockmaker (clockwork) | Stop the Clock (stopClock) | I to II | *-0.08* | *+1* | *-4* | *+0%* | *+0%* |
| Clockmaker (clockwork) | Stop the Clock (stopClock) | II to III | *+0.25* | *+1* | *+3* | *+0%* | *+0%* |
| Air Mage (airMage) | Gale (gale) | I to II | *-0.21* | *+2* | *-5* | *-1%* | *+0%* |
| Air Mage (airMage) | Gale (gale) | II to III | *+0.46* | *+2* | *+4* | *+1%* | *-3%* |
| Warden (warden) | Nullify (nullify) | I to II | *+0.50* | +11 | *+6* | +4% | *+7%* |
| Warden (warden) | Nullify (nullify) | II to III | *-0.17* | +16 | *+13* | +13% | *+10%* |

## Combo pairs

How much more two abilities are worth together than the two of them apart: (both) minus (first alone) minus (second alone)
plus (neither). Measured twice: with the hero's third ability off (AB - A - B + bare) and on (ABC - BC - AC + C). A
positive number is a combo; a negative one means they overlap (each does part of the other's job, or one keeps the other
from being cast: the hero casts one ability at a time and some lock it out while they last). Score as above.

Worth more together (clear somewhere, best first):

| Hero | Pair | Rooms (third off / on) | Duels health | Group health | Score | Duels level: none; each alone; both | Group level: none; each alone; both |
|---|---|---|---|---|---|---|---|
| Druid (druid) | Rejuvenate (rejuvenate) + Call Wolf (callWolf) | *-0.67* / *-1.25* | *+12* / +17 | +24 / +41 | +1.22 | -29; -23, -5; +13 | -54; -46, -49; -17 |
| Granny Reaper (granny) | Reap (reap) + Hook (hook) | *+1.38* / *-1.38* | +40 / +24 | *+3* / +14 | +1.16 | -88; -42, -1; +84 | -42; -4, +7; +49 |
| Grandpa Sickle (grandpa) | Bread Toss (breadToss) + Harvest (harvest) | *-1.42* / *+0.54* | +20 / +11 | *+8* / +24 | +0.80 | -93; +41, -86; +68 | -50; +12, -27; +43 |
| Werewolf (werewolf) | Frenzy (frenzy) + Pounce (pounce) | *+1.21* / *+0.75* | +23 / *+6* | *+14* / *+9* | +0.77 | -82; +31, -60; +76 | -40; -27, -27; 0 |
| Werewolf (werewolf) | Turn (turnWolf) + Pounce (pounce) | *-0.75* / *-1.21* | +17 / *+0* | +17 / *+13* | +0.63 | -82; -76, -60; -37 | -40; -12, -27; +19 |
| Warlock (warlock) | Eldritch Beam (eldritchBeam) + Awaken (summonImp) | *-0.29* / *+0.08* | *+2* / *+4* | *+7* / +31 | +0.60 | +83; +66, +76; +61 | -14; -9, +21; +33 |
| Dame (dame) | Riposte (riposte) + Challenge (challenge) | *-0.88* / *+0.71* | *+2* / *+2* | *+13* / +25 | +0.59 | -85; -46, -84; -43 | -49; -27, -44; -8 |
| Necromancer (necromancer) | Raise Dead (raiseDead) + Life Drain (lifeDrain) | *+1.46* / *+1.21* | *+8* / *0* | +16 / *+8* | +0.50 | -35; -38, -13; -9 | -56; -43, -52; -23 |
| Granny Reaper (granny) | Reap (reap) + Old Bones (oldBones) | +2.13 / *-0.63* | +10 / -6 | *+4* / +15 | +0.40 | -88; -42, -85; -30 | -42; -4, -40; +2 |
| Quartermaster (quartermaster) | Barricade (oilBlades) + Pot Helmet (flare) | *+0.67* / *-1.04* | +12 / *+2* | *+5* / *+8* | +0.39 | -29; -26, +23; +38 | -52; -52, -31; -26 |
| Cultist (cultist) | Blood Pact (bloodPact) + Sacrifice (soulCandle) | *-0.46* / *+1.63* | *+8* / *-4* | +17 / *+4* | +0.35 | +2; +5, +55; +67 | -41; -38, -27; -6 |
| Warden (warden) | Nullify (nullify) + Chain Gang (chainGang) | *-0.29* / *-0.50* | -6 / -11 | +13 / +21 | +0.24 | -79; -43, -51; -20 | -43; -21, -14; +21 |
| Archer (archer) | Frost Arrow (frostArrow) + Roll (roll) | *+1.13* / *-0.58* | *-1* / -7 | *+5* / +13 | +0.17 | +28; +69, +37; +77 | -37; +2, -35; +9 |
| Warden (warden) | Manacles (manacle) + Nullify (nullify) | *+0.21* / *+0.00* | +9 / *+4* | *-5* / *+3* | +0.15 | -79; -65, -43; -20 | -43; -32, -21; -16 |
| Dame (dame) | Riposte (riposte) + Disarm (disarm) | *+0.58* / +2.17 | *-1* / *-1* | *-2* / *+9* | +0.14 | -85; -46, -69; -30 | -49; -27, -46; -27 |
| Bard (bard) | Lullaby (lullaby) + Encore (encore) | +2.29 / *+0.54* | *+3* / *+5* | *+1* / *-4* | +0.13 | -16; -18, -19; -18 | -35; -24, -20; -8 |
| Paladin (paladin) | Guard (guard) + Consecrate (consecrate) | *-1.00* / *-0.13* | *-1* / +5 | *-1* / *+7* | +0.13 | -85; -84, -67; -67 | -51; -47, +26; +28 |
| Harpooner (harpooner) | Reel In (reelIn) + Rogue Wave (rogueWave) | *-0.08* / +2.25 | *+1* / *+1* | *-2* / *-2* | +0.04 | +6; +65, +9; +69 | -30; +1, -13; +16 |

Worth less together (they overlap or get in each other's way):

Read the "level" columns before believing one of these. The health margin stops at +100 (won without a scratch), so when
either ability alone already wins the duel, the pair cannot add much: that shows up here as "worth less together" though
nothing overlaps. That is most of the list below (each alone already near the top). The real overlaps are the rows where
each alone is middling and both together are no better than one.

| Hero | Pair | Rooms (third off / on) | Duels health | Group health | Score | Duels level: none; each alone; both | Group level: none; each alone; both |
|---|---|---|---|---|---|---|---|
| Telekinetic (telekinetic) | Hurl (hurl) + Levitate (levitate) | *+0.17* / *+2.08* | -118 / -71 | -48 / -18 | -3.66 | -30; +91, +97; +99 | -45; +27, +36; +59 |
| Warhelm (warhelm) | Storm Born (warHorn) + Skull Splitter (skullSplitter) | *+1.33* / *+0.29* | -94 / -88 | -22 / -41 | -3.47 | -79; +68, +27; +81 | -43; +11, -6; +26 |
| Pirate (pirate) | Point Blank (pointBlank) + Grog (grog) | +2.83 / *-0.58* | -115 / -115 | *+4* / *-14* | -3.31 | -72; +48, +73; +77 | -48; +1, -19; +34 |
| Monk (monk) | Flurry (flurry) + Inner Peace (innerPeace) | *+0.33* / *+1.29* | -102 / -97 | *-11* / -30 | -3.23 | -79; +76, +35; +88 | -51; -8, +24; +55 |
| Digger (digger) | Dirt Fling (dirtFling) + Burrow (burrow) | *-0.88* / *-0.58* | -88 / -73 | -37 / -15 | -3.04 | -78; +65, +30; +84 | -40; +16, +39; +58 |
| Clockmaker (clockwork) | Rewind (rewind) + Slow Time (timeBubble) | *-0.04* / *-0.50* | -69 / -59 | *-21* / -43 | -2.66 | -14; +77, +60; +81 | -47; +36, +6; +68 |
| Samurai (samurai) | Iaido (iaido) + Crescent Cut (crescentCut) | *+0.29* / *-0.21* | -61 / -58 | -20 / *-14* | -2.17 | -47; +34, +57; +77 | -21; +26, +19; +46 |
| Haymaker (haymaker) | Toss (toss) + Hay Bale (forkCharge) | *+0.92* / *+0.50* | -51 / -51 | *-12* / -24 | -1.90 | -67; +9, +57; +82 | -43; -6, -3; +22 |
| Bandit (rogueBandit) | Bolas (smokeBomb) + Dirty Trick (pickpocket) | *+1.50* / *-0.25* | -40 / -50 | -27 / -21 | -1.88 | -63; -2, +61; +82 | -39; -2, +24; +34 |
| Archer (archer) | Barrage (barrage) + Frost Arrow (frostArrow) | *+1.92* / *+0.21* | -32 / -39 | -34 / -27 | -1.86 | +28; +79, +69; +88 | -37; +30, +2; +34 |
| The Mob (mob) | Pile On (pileOn) + Scatter (scatter) | *+0.88* / *+0.21* | -76 / -51 | *+8* / *-14* | -1.86 | -76; +81, +9; +89 | -31; -10, -6; +23 |
| Bearskin (bearskin) | Hibernate (hibernate) + Bear Claws (bearRoar) | *+1.13* / *-0.17* | -62 / -48 | -14 / *-3* | -1.77 | -68; +44, +18; +68 | -30; -7, +5; +14 |
| Earth Mage (earthMage) | Earthquake (earthquake) + Spike Chain (spikeChain) | *+0.33* / *-0.04* | -21 / -20 | -39 / -35 | -1.63 | +25; +55, +84; +93 | -33; +55, +20; +70 |
| Gladiator (gladiator) | Spear of Ares (netThrow) + Arena (showboat) | *+0.38* / *-0.08* | -40 / -44 | *-13* / *-10* | -1.45 | -63; -12, +77; +88 | -32; +1, +13; +33 |
| Crossbowman (crossbowman) | Pinning Bolt (pinBolt) + Crank Up (crankUp) | *-1.42* / *+0.42* | -39 / -19 | -15 / -25 | -1.42 | +44; +84, +96; +97 | -14; +16, +45; +59 |
| Gladiator (gladiator) | Arena (showboat) + Shield Rush (shieldRush) | *+0.71* / *+0.25* | -59 / -63 | *+8* / *+12* | -1.38 | -63; +77, +11; +92 | -32; +13, -11; +43 |
| Warhelm (warhelm) | Thunder Blow (thunderBlow) + Storm Born (warHorn) | *+0.63* / *-0.42* | -41 / -36 | *+0* / -19 | -1.36 | -79; -27, +68; +79 | -43; -19, +11; +35 |
| Alchemist (alchemist) | Brew Pools (acidFlask) + Elixir (elixir) | *+1.21* / *+1.75* | -35 / -15 | *-25* / -29 | -1.36 | -7; +38, +78; +88 | -47; -7, +47; +63 |
| Warlock (warlock) | Awaken (summonImp) + Dark Bargain (darkBargain) | *-1.58* / *-1.21* | *-7* / *-5* | -52 / -28 | -1.35 | +83; +76, +86; +72 | -14; +21, +16; -2 |
| Storm Mage (storm) | Chain Lightning (chainLightning) + Zeus Bolt (stormCloud) | *-1.63* / *+0.08* | -27 / -17 | -22 / -25 | -1.30 | +10; +59, +58; +79 | -46; -1, +11; +33 |

### Worth with the others vs worth alone

The gap between "minus one" (its worth beside the other two) and "only one" (its worth on its own). Abilities that work
through the others are worth far more in the kit than alone; abilities that are worth more alone are partly covered by the
other two (or crowd them out).

| Hero | Ability | Rooms: kit / alone | Duels: kit / alone | Group: kit / alone | Gap score |
|---|---|---|---|---|---|
| Granny Reaper (granny) | Reap (reap) | *+1.38* / *+0.63* | +79 / +45 | +56 / +38 | +1.49 |
| Werewolf (werewolf) | Pounce (pounce) | *+0.42* / *+0.42* | +46 / +22 | +40 / +14 | +1.40 |
| Druid (druid) | Rejuvenate (rejuvenate) | +2.04 / +2.42 | +28 / *+7* | +37 / *+8* | +1.34 |
| Grandpa Sickle (grandpa) | Harvest (harvest) | *+1.13* / *+0.88* | +20 / +8 | +47 / +23 | +1.02 |
| Druid (druid) | Call Wolf (callWolf) | *-0.79* / +1.75 | +28 / +24 | +41 / *+5* | +1.01 |
| Grandpa Sickle (grandpa) | Bread Toss (breadToss) | +3.33 / +3.50 | +150 / +135 | +80 / +62 | +0.91 |
| Dame (dame) | Riposte (riposte) | *+0.83* / *-0.46* | +40 / +39 | +45 / +22 | +0.70 |
| Granny Reaper (granny) | Hook (hook) | *+0.29* / *+0.33* | +112 / +87 | +49 / +50 | +0.68 |
| Dame (dame) | Challenge (challenge) | *+1.08* / *+0.08* | *+1* / +1 | +28 / *+6* | +0.67 |
| Warlock (warlock) | Eldritch Beam (eldritchBeam) | *+0.50* / *-0.13* | -13 / -17 | +22 / *+5* | +0.62 |
| Necromancer (necromancer) | Raise Dead (raiseDead) | +1.83 / *+0.33* | *+3* / *-4* | +26 / +13 | +0.60 |
| Valkyrie (valkyrie) | Sky Dive (skyDive) | *+0.42* / *+0.54* | *0* / *+0* | +43 / +23 | +0.57 |
| ... | | | | | |
| Clockmaker (clockwork) | Slow Time (timeBubble) | *+0.38* / *+1.17* | +3 / +74 | +11 / +53 | -3.18 |
| Monk (monk) | Flurry (flurry) | +1.58 / *+0.88* | +52 / +154 | *+11* / +43 | -3.63 |
| Pirate (pirate) | Point Blank (pointBlank) | *+1.38* / *+0.46* | *+3* / +120 | +33 / +49 | -3.65 |
| Clockmaker (clockwork) | Rewind (rewind) | *+1.08* / *+1.42* | +9 / +91 | +34 / +83 | -3.69 |
| Warhelm (warhelm) | Skull Splitter (skullSplitter) | *+1.58* / *-0.08* | +7 / +106 | *+2* / +37 | -3.84 |
| Digger (digger) | Burrow (burrow) | *+0.83* / +1.67 | +14 / +108 | +38 / +79 | -3.84 |
| Monk (monk) | Inner Peace (innerPeace) | +3.17 / *+1.17* | +6 / +114 | +39 / +75 | -3.93 |
| Pirate (pirate) | Grog (grog) | +2.88 / *+1.63* | +15 / +145 | +14 / +29 | -4.04 |
| Digger (digger) | Dirt Fling (dirtFling) | *+1.00* / +1.92 | +36 / +142 | +21 / +56 | -4.08 |
| Telekinetic (telekinetic) | Hurl (hurl) | *+1.54* / *+0.67* | +3 / +120 | +29 / +72 | -4.55 |
| Telekinetic (telekinetic) | Levitate (levitate) | +1.83 / *+1.25* | +9 / +127 | +35 / +80 | -4.70 |
| Warhelm (warhelm) | Storm Born (warHorn) | *+0.50* / *-0.42* | +18 / +148 | +13 / +54 | -4.76 |

## A battle-mode bug found on the way

Battle mode drops an ethereal unit from its side's head count (js/battle.js `fighting()`: meant for things like a ghost).
A hero is ethereal while it burrows (Digger, Burrow), rides its broom (Witch, Broom Ride), flies off with the flock
(Falconer, Call the Flock), hides in a bush (Trapper, Bush) or is a shadow (Shade: the Shadow Walk dash, Blackout at III and her
Fade trait). So a hero fighting alone who does any of those **loses on the spot**: the side counts as empty and
the fight ends in 2 to 5 seconds, scored as a wipe. In a first battle batch run with the game's rule this made Burrow, Call the Flock and Broom
Ride look like the three worst abilities in the game (Digger lost 100% of duels with Burrow, 0% without).

This audit's runner counts a hero as still in the fight while it is ethereal (tools/audit/worth/lib.mjs `stepBattle`,
otherwise the game's own step), and the battle batch was run that way. Nothing in js/ was changed. With the corrected count,
the fights where the game's own rule would have ended the battle early (all builds, all fights):

| Hero | Fights | Would have ended early: duels | group | Seconds ethereal a fight |
|---|---|---|---|---|
| Digger (digger) | 1650 | 853 of 1320 | 65 of 330 | 2.6 |
| Trapper (trapper) | 1650 | 349 of 1320 | 153 of 330 | 4.4 |
| Shade (shade) | 1650 | 371 of 1320 | 101 of 330 | 6.1 |
| Witch (witch) | 1650 | 624 of 1320 | 99 of 330 | 7.0 |
| Falconer (falconer) | 1650 | 658 of 1320 | 99 of 330 | 6.6 |

(Heroes that never go ethereal show 2 to 8% on the same count: moments when one side is empty but something of theirs is still on its way in, which the game rightly waits for. Read the five above against that.)

In a game the player sets up a lone Digger, Witch, Falconer, Trapper or Shade and watches it lose in seconds. Proposal
below. (The dungeon is not affected: it counts heroes that are standing, not ethereal ones.)

## Per hero

Each hero: its level with everything (full) and with nothing (bare), then each ability's worth in every build and setting.
Rooms in rooms cleared; health and win in points out of 100. Kit = full minus "minus one"; alone = "only one" minus bare;
I to III = full minus "one at I". Italics = inside the noise.

### Paladin (paladin)

Full: 7.21 rooms, duels won 18% (health -37), group won 77% (health +41). Bare: 3.96 rooms, duels 0% (-85), group 0% (-51).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Shield Bash (shieldBash) | 43.6 / 13.2 | 24% / 22% | *+0.71* / *+0.67* / *-0.25* | +1.1 / *-0.1* / *+0.0* | +30 / +30 / +15 | *+13* / +14 / *+4* | +8% / *+10%* |
| Guard (guard) | 9.9 / 0.6 | 0% / 0%, heals 31% | *+1.21* / +2.04 / *+1.29* | *-0.3* / *+0.2* / +0.7 | *+2* / *+1* / *+0* | *+0* / *+4* / +18 | *+3%* / *-7%* |
| Consecrate (consecrate) | 12.1 / 1.7 | 21% / 33%, heals 68% | *+1.25* / *+1.50* / +2.00 | +1.6 / -0.7 / +1.0 | +21 / +18 / *+3* | +86 / +77 / +54 | +17% / +73% |

### Tower (tower)

Full: 6.33 rooms, duels won 28% (health -34), group won 73% (health +39). Bare: 4.92 rooms, duels 1% (-78), group 3% (-46).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Hold the Line (holdTheLine) | 18.6 / 2.7 | 12% / 11% | *+0.25* / *+0.21* / *+0.42* | +0.9 / *+0.2* / *+0.1* | *+2* / +3 / +3 | +25 / *+11* / +17 | *+5%* / +20% |
| Charge (charge) | 49.2 / 15.6 | 28% / 37% | *+1.00* / *+0.21* / *+0.63* | +1.4 / *+0.5* / *-0.0* | +36 / +39 / +20 | +27 / *+5* / +21 | +20% / +27% |
| Ground Pound (groundPound) | 15.7 / 2.1 | 17% / 16% | *+0.29* / *+0.17* / *+0.58* | *+0.4* / +1.2 / *-0.2* | +7 / +8 / +5 | +60 / +45 / +46 | +7% / +40% |

### Archer (archer)

Full: 6.83 rooms, duels won 100% (health +85), group won 97% (health +39). Bare: 4.38 rooms, duels 69% (+28), group 17% (-37).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Barrage (barrage) | 41.5 / 9.2 | 23% / 32% | *+0.46* / *+0.21* / *+0.17* | +3.3 / *+0.2* / *-0.0* | +8 / +52 / *+2* | +30 / +67 / +23 | *+2%* / +20% |
| Frost Arrow (frostArrow) | 42.3 / 9.4 | 14% / 13% | *+1.17* / *-0.17* / *+0.54* | +1.3 / *+0.4* / *+0.0* | *+1* / +41 / *-1* | +17 / +39 / +9 | *+0%* / *+0%* |
| Roll (roll) | 9.8 / 0.7 | 3% / 1% | *+0.50* / *+1.04* / +1.58 | +1.3 / *+0.2* / *+0.1* | *-3* / *+9* / *+0* | *+4* / *+2* / *+2* | *+1%* / *-3%* |

### Twinfang (twinfang)

Full: 4.54 rooms, duels won 33% (health -27), group won 97% (health +46). Bare: 4.54 rooms, duels 5% (-61), group 30% (-16).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Backstab (backstab) | 22.7 / 2.7 | 35% / 20%, heals 39% | *-0.25* / *+0.50* / *-0.46* | +4.2 / *-0.5* / *-0.2* | +11 / +12 / +2 | +21 / +23 / *+6* | +8% / *+7%* |
| Dash (dash) | 25.5 / 5.2 | 0% / 0% | *-0.17* / +1.58 / *-0.58* | *+0.8* / *-0.1* / *-0.2* | *+3* / +2 / *+1* | *+4* / *-4* / *-2* | *+2%* / *-3%* |
| Fan of Knives (fanOfKnives) | 8.4 / 1.6 | 18% / 28% | *-0.21* / *-0.54* / *-1.46* | +1.8 / *-0.4* / *+0.1* | +23 / +21 / +9 | +39 / +45 / +20 | +16% / +37% |

### Wildmane (wildmane)

Full: 7.29 rooms, duels won 63% (health +11), group won 93% (health +44). Bare: 4.67 rooms, duels 1% (-73), group 17% (-33).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Rage (rage) | 23.0 / 3.7 | 0% / 0% | +2.17 / *-0.13* / +2.42 | +2.5 / *-0.0* / +0.9 | +26 / +46 / +16 | +29 / +28 / +15 | +24% / +27% |
| Leap (leap) | 44.2 / 10.7 | 26% / 28%, heals 18% | +2.08 / *-0.67* / *+1.04* | +2.6 / +0.9 / *-0.1* | +40 / +56 / +18 | +24 / +24 / +12 | +37% / +13% |
| Cleave (cleave) | 8.8 / 0.7 | 17% / 14%, heals 23% | *+1.17* / *-0.54* / *+1.29* | +1.6 / *+0.4* / *+0.1* | *0* / *+2* / *-1* | +21 / +31 / *+6* | *-2%* / +13% |

### Berserker (berserker)

Full: 6.13 rooms, duels won 99% (health +88), group won 100% (health +68). Bare: 3.29 rooms, duels 1% (-77), group 7% (-38).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Shockwave (shockwave) | 13.8 / 1.3 | 26% / 12% | *+1.00* / *+0.96* / *+1.13* | +2.1 / *+0.6* / *-0.0* | *-3* / +21 / *+0* | +19 / +47 / +18 | *-1%* / *+3%* |
| Whirl (whirl) | 25.1 / 6.9 | 28% / 40% | *+0.29* / *+0.83* / +2.21 | +3.3 / *+0.6* / *-0.2* | +7 / +40 / *+1* | +26 / +41 / +12 | *+3%* / *+7%* |
| Unstoppable (unstoppable) | 6.5 / 4.3 | 0% / 0%, heals 97% | *+0.92* / *+0.63* / *+0.38* | *+1.1* / *-0.3* / +0.8 | +105 / +160 / +82 | +24 / +43 / +16 | +63% / *+10%* |

### Granny Reaper (granny)

Full: 6.17 rooms, duels won 99% (health +82), group won 100% (health +51). Bare: 3.17 rooms, duels 0% (-88), group 7% (-42).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Reap (reap) | 26.3 / 7.0 | 35% / 41%, heals 100% | *+1.38* / *+0.63* / +1.71 | +3.6 / *-0.0* / +0.7 | +79 / +45 / +50 | +56 / +38 / +29 | +48% / +50% |
| Hook (hook) | 23.9 / 6.1 | 21% / 23% | *+0.29* / *+0.33* / *+0.25* | +2.1 / *+0.3* / *-0.2* | +112 / +87 / +72 | +49 / +50 / +35 | +68% / +50% |
| Old Bones (oldBones) (passive) | 0.0 / 0.0 | 0% / 0% | *+0.67* / *-0.04* / *+1.54* | *+0.3* / *-0.1* / *+0.0* | *-2* / +3 / *+0* | *+2* / *+2* / *+1* | *+0%* / *+7%* |

### Pyromancer (pyromancer)

Full: 5.50 rooms, duels won 98% (health +69), group won 97% (health +33). Bare: 5.04 rooms, duels 69% (+29), group 20% (-33).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Fireball (fireball) | 34.9 / 11.0 | 19% / 18%, heals 31% | *-0.08* / *+1.50* / *-0.58* | +4.4 / *-0.5* / *+0.2* | +13 / +28 / *+6* | +17 / +44 / +11 | +10% / *+10%* |
| Flame Wall (flameWall) | 11.5 / 1.1 | 0% / 0% | *+0.75* / *+0.38* / *-0.46* | +2.4 / *-0.2* / *-0.0* | *+2* / +15 / +1 | +16 / +41 / *+3* | *+3%* / *+3%* |
| Inferno (inferno) | 9.4 / 1.9 | 7% / 4%, heals 18% | *-0.17* / *+0.50* / *-1.13* | +1.9 / *-0.0* / *-0.1* | +6 / +17 / *+3* | *+5* / *+6* / *-1* | *+3%* / *+7%* |

### Frost Mage (frost)

Full: 6.58 rooms, duels won 100% (health +82), group won 100% (health +44). Bare: 3.21 rooms, duels 67% (+18), group 33% (-24).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Ice Shard (iceShard) | 63.0 / 16.7 | 41% / 52% | +3.25 / *+1.50* / *+1.25* | +4.2 / +1.2 / *+0.0* | +45 / +64 / +13 | +55 / +72 / +32 | +18% / +50% |
| Frost Nova (frostNova) | 11.5 / 1.2 | 4% / 1%, heals 10% | *+1.13* / *+0.79* / *+0.38* | +0.8 / *+0.2* / *+0.1* | *0* / +14 / *+1* | *+1* / *+3* / *+1* | *+0%* / *+0%* |
| Ice Wall (iceWall) | 12.8 / 3.0 | 0% / 0% | *+1.42* / +1.38 / *+0.83* | *+0.2* / *+0.7* / *-0.0* | *+3* / +11 / *-1* | *+3* / *+4* / *-1* | *+2%* / *+0%* |

### Storm Mage (storm)

Full: 4.88 rooms, duels won 98% (health +80), group won 100% (health +43). Bare: 3.25 rooms, duels 60% (+10), group 10% (-46).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Chain Lightning (chainLightning) | 28.9 / 19.7 | 26% / 27%, heals 25% | *+0.33* / +1.58 / *-0.71* | +2.4 / *+0.7* / *+0.0* | +21 / +48 / *0* | +21 / +45 / *+10* | *+2%* / *+10%* |
| Thunderclap (thunderclap) | 10.6 / 0.8 | 13% / 4%, heals 11% | *+0.42* / +1.54 / *+0.42* | +1.3 / *-0.2* / *+0.2* | *+1* / +17 / *0* | *+9* / +28 / *+1* | *-2%* / +13% |
| Zeus Bolt (stormCloud) | 22.2 / 13.5 | 19% / 24% | *-0.17* / *+1.25* / *-0.17* | +1.2 / *+0.6* / *-0.1* | +15 / +48 / +11 | +15 / +56 / +12 | +5% / *+10%* |

### Cleric (cleric)

Full: 8.50 rooms, duels won 94% (health +59), group won 47% (health +8). Bare: 3.75 rooms, duels 19% (-41), group 0% (-53).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Mending Ray (mend) | 35.3 / 0.9 | 1% / 0%, heals 58% | *+1.63* / +2.63 / *+1.00* | -0.3 / *-0.6* / +1.5 | *-1* / *+2* / *+0* | +21 / *+14* / *+5* | *+2%* / *-3%* |
| Sanctuary (sanctuary) | 23.4 / 4.4 | 3% / 5%, heals 38% | +1.88 / +2.17 / +2.46 | +0.5 / *-0.3* / +1.0 | +69 / +83 / +29 | +33 / *+9* / *+14* | +51% / +27% |
| Smite (smite) | 55.4 / 24.4 | 53% / 45% | *+0.88* / *+0.71* / +2.13 | +1.2 / *+0.4* / *+0.2* | +19 / +26 / +7 | +36 / +18 / +35 | +15% / +23% |

### Bard (bard)

Full: 5.38 rooms, duels won 54% (health +4), group won 60% (health +3). Bare: 4.46 rooms, duels 40% (-16), group 7% (-35).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| War Song (warSong) | 19.2 / 3.2 | 0% / 0% | *-0.96* / *+0.17* / *-0.25* | +0.7 / *-0.4* / *-0.1* | +22 / +13 / +8 | *+11* / +21 / *+6* | +15% / *+13%* |
| Lullaby (lullaby) | 9.9 / 1.5 | 0% / 0% | *+0.21* / *-0.38* / -1.75 | *+0.2* / *+0.0* / *-0.1* | *+7* / *-2* / *+3* | *+0* / +11 / *-4* | *+6%* / *+3%* |
| Encore (encore) | 22.2 / 1.0 | 0% / 0%, heals 100% | *+1.08* / *-0.04* / *-0.38* | *+0.0* / *-0.3* / +0.8 | *+4* / *-3* / *+0* | +14 / +15 / +14 | *+2%* / *+10%* |

### Druid (druid)

Full: 6.50 rooms, duels won 63% (health +19), group won 43% (health -10). Bare: 2.75 rooms, duels 25% (-29), group 0% (-54).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Entangle (entangle) | 16.7 / 2.4 | 0% / 0% | *+0.25* / *+1.25* / *-1.46* | +0.4 / *+0.2* / *+0.2* | *+6* / *+9* / *+1* | *+7* / *+6* / *-7* | *+6%* / *+7%* |
| Rejuvenate (rejuvenate) | 27.6 / 4.1 | 0% / 0%, heals 100% | +2.04 / +2.42 / *+0.00* | *+0.2* / -0.9 / +2.0 | +28 / *+7* / +7 | +37 / *+8* / *+12* | +22% / +40% |
| Call Wolf (callWolf) | 17.0 / 2.6 | 0% / 0% | *-0.79* / +1.75 / *-0.75* | +1.5 / -0.5 / +0.6 | +28 / +24 / +12 | +41 / *+5* / *+12* | +22% / +43% |

### Necromancer (necromancer)

Full: 7.29 rooms, duels won 49% (health +11), group won 43% (health -12). Bare: 4.25 rooms, duels 25% (-35), group 0% (-56).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Raise Dead (raiseDead) | 27.8 / 2.3 | 0% / 0% | +1.83 / *+0.33* / *+1.00* | +2.6 / *+0.4* / *+0.1* | *+3* / *-4* / *0* | +26 / +13 / *+3* | *+3%* / +30% |
| Life Drain (lifeDrain) | 37.0 / 6.3 | 30% / 33%, heals 100% | +2.42 / *+1.00* / +1.38 | +2.4 / -0.8 / +1.6 | *+3* / +22 / +28 | *+5* / *+5* / *+4* | *-2%* / *+3%* |
| Bone Spear (boneSpear) | 49.5 / 11.0 | 18% / 32% | *+0.25* / *+0.00* / *+0.21* | +1.0 / *+0.0* / *-0.0* | +20 / +40 / *+4* | *+11* / +22 / *+4* | +12% / *+10%* |

### Plague Doctor (plague)

Full: 6.38 rooms, duels won 78% (health +60), group won 67% (health -2). Bare: 2.92 rooms, duels 49% (+8), group 3% (-48).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Miasma (miasma) | 17.9 / 3.0 | 1% / 2% | *-1.00* / +1.38 / *-0.71* | +1.1 / *-0.4* / *+0.0* | *+2* / *+4* / *+0* | +21 / +15 / *+0* | *+2%* / +27% |
| Cure (cure) | 14.5 / 3.5 | 0% / 0%, heals 75% | *+1.42* / +2.33 / *+0.79* | *+0.4* / *-0.2* / +0.7 | +19 / +39 / +3 | +18 / +19 / -86 | +14% / +30% |
| Gas Form (leeches) | 15.8 / 4.5 | 0% / 0% | *+1.13* / +2.38 / *+0.33* | +1.2 / *+0.2* / *+0.0* | +12 / +33 / +13 | *+11* / +13 / *+6* | +7% / +30% |

### Old Guard (oldguard)

Full: 7.63 rooms, duels won 100% (health +84), group won 93% (health +57). Bare: 4.33 rooms, duels 0% (-87), group 0% (-49).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Great Sweep (greatSweep) | 51.5 / 11.2 | 33% / 40% | *+1.33* / *+1.25* / *+0.38* | +2.1 / *+0.0* / *+0.1* | +35 / +75 / +28 | +35 / +54 / +24 | +23% / +27% |
| Rally (rallyCry) | 15.0 / 2.6 | 0% / 0%, heals 99% | +2.54 / +2.04 / +2.71 | +0.7 / -0.6 / +1.3 | +25 / +94 / +24 | +40 / +44 / +42 | +6% / +20% |
| Parry (pommelStrike) | 45.5 / 10.5 | 16% / 12% | *+1.46* / *-0.04* / +2.13 | +1.3 / +1.0 / *-0.4* | +28 / +69 / +11 | *+8* / +14 / *-5* | +9% / *+3%* |

### Dame (dame)

Full: 6.25 rooms, duels won 29% (health -29), group won 50% (health +1). Bare: 5.33 rooms, duels 0% (-85), group 0% (-49).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Riposte (riposte) | 30.4 / 11.4 | 17% / 21% | *+0.83* / *-0.46* / *+1.50* | +0.6 / *+0.3* / *-0.1* | +40 / +39 / +34 | +45 / +22 / +32 | +29% / +43% |
| Challenge (challenge) | 5.0 / 0.5 | 0% / 0%, heals 100% | *+1.08* / *+0.08* / *+0.83* | *+0.0* / *+0.2* / *+0.4* | *+1* / +1 / *+0* | +28 / *+6* / *+4* | *-1%* / +30% |
| Disarm (disarm) | 26.2 / 10.6 | 7% / 6% | +2.17 / *-0.29* / *-0.13* | *+0.3* / *+0.8* / *-0.1* | +14 / +16 / +4 | *+9* / *+3* / *+2* | *+6%* / *+7%* |

### Griffon (griffon)

Full: 4.21 rooms, duels won 4% (health -55), group won 30% (health -16). Bare: 4.33 rooms, duels 0% (-85), group 0% (-47).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Swoop (swoop) | 6.2 / 0.7 | 7% / 3% | *-0.17* / *+0.46* / *-0.58* | *+0.1* / *+0.4* / *+0.0* | *+0* / *+1* / *+0* | +7 / *+5* / +6 | *+0%* / *+13%* |
| Stormhammer (hammerThrow) | 25.0 / 10.2 | 33% / 52% | *-0.33* / *+0.17* / *-0.88* | +1.2 / *+0.7* / *-0.1* | +26 / +25 / +8 | +21 / +15 / +14 | +4% / +27% |
| Wing Guard (wingShield) | 12.5 / 3.9 | 14% / 6% | *-0.50* / *-0.42* / -1.17 | *+0.3* / *+0.2* / *-0.2* | +3 / +4 / +1 | *+7* / *+5* / *+3* | *+0%* / *+17%* |

### Bulwark (bulwark)

Full: 5.71 rooms, duels won 58% (health +2), group won 37% (health -20). Bare: 5.13 rooms, duels 0% (-80), group 0% (-47).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Brace (brace) | 31.7 / 15.7 | 28% / 24% | *+0.42* / *+0.29* / *-0.29* | *+0.1* / *+0.1* / *+0.2* | +20 / +11 / -16 | *+9* / +17 / *+4* | +23% / *+20%* |
| Shield Wall (shieldWall) | 8.0 / 3.0 | 0% / 0% | *-0.71* / *+0.46* / *+0.08* | -0.7 / *+0.2* / *+0.1* | *-3* / -1 / *-2* | *-9* / *+2* / -12 | *-2%* / *-3%* |
| Impale (impale) | 25.9 / 13.1 | 16% / 20% | *-0.13* / *+0.21* / *+0.13* | +0.5 / *-0.2* / *+0.4* | +70 / +70 / +55 | *+7* / +26 / +14 | +58% / +23% |

### Bearskin (bearskin)

Full: 6.88 rooms, duels won 100% (health +74), group won 97% (health +49). Bare: 5.21 rooms, duels 3% (-68), group 17% (-30).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Maul (maul) | 29.3 / 5.8 | 23% / 24% | *+0.13* / *-0.04* / *-0.88* | +2.4 / +0.7 / *-0.4* | +6 / +70 / *+1* | +34 / +34 / +13 | *+2%* / +37% |
| Hibernate (hibernate) | 5.7 / 0.5 | 0% / 0% | *+0.38* / *+0.67* / *+0.17* | +1.1 / *-0.5* / +0.9 | +20 / +112 / *-1* | +20 / +23 / *+2* | *+3%* / +13% |
| Bear Claws (bearRoar) | 24.6 / 4.6 | 28% / 34% | *+1.17* / *-0.25* / *+0.54* | +2.5 / *+0.2* / *-0.3* | *+4* / +86 / +8 | +21 / +35 / +16 | *+2%* / +17% |

### Warhelm (warhelm)

Full: 6.21 rooms, duels won 100% (health +86), group won 93% (health +37). Bare: 5.21 rooms, duels 0% (-79), group 0% (-43).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Thunder Blow (thunderBlow) | 20.0 / 5.1 | 11% / 15% | *+0.17* / *-0.79* / *-0.17* | *+0.9* / *-0.7* / *-0.0* | +5 / +52 / *+0* | +11 / +24 / *+10* | *+0%* / +17% |
| Storm Born (warHorn) | 15.0 / 2.8 | 34% / 25% | *+0.50* / *-0.42* / *-0.13* | +3.7 / *-0.6* / *-0.1* | +18 / +148 / +3 | +13 / +54 / *+9* | *+2%* / *+7%* |
| Skull Splitter (skullSplitter) | 18.7 / 2.3 | 19% / 10% | *+1.58* / *-0.08* / *+0.17* | +2.8 / *+0.0* / *+0.1* | +7 / +106 / +1 | *+2* / +37 / *+5* | *+1%* / *+3%* |

### Bandit (rogueBandit)

Full: 5.58 rooms, duels won 100% (health +88), group won 100% (health +59). Bare: 4.71 rooms, duels 6% (-63), group 10% (-39).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Bolas (smokeBomb) | 23.0 / 3.9 | 8% / 4% | *+0.63* / *-0.13* / *-0.25* | +1.3 / *+0.6* / *-0.2* | +9 / +61 / +4 | +14 / +37 / +10 | *+1%* / *+0%* |
| Dirty Trick (pickpocket) | 24.3 / 4.1 | 31% / 20%, heals 25% | *+0.63* / *-0.33* / *+0.25* | +2.5 / *-0.1* / *+0.0* | +58 / +124 / +32 | +46 / +63 / +22 | +17% / +23% |
| Stick 'Em Up (lowBlow) | 21.0 / 3.6 | 0% / 0% | *-0.17* / *-0.63* / *-0.88* | +0.8 / *-0.1* / *-0.0* | +6 / +34 / +1 | +25 / +17 / +6 | *+1%* / +13% |

### Shade (shade)

Full: 4.75 rooms, duels won 54% (health +15), group won 100% (health +44). Bare: 4.50 rooms, duels 11% (-48), group 20% (-30).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Shadow Walk (shadowWalk) | 8.2 / 1.5 | 13% / 15% | *-1.04* / *-0.83* / *-0.75* | *+0.6* / *-0.5* / -0.3 | +3 / +14 / *+2* | +16 / +27 / +11 | +5% / *+7%* |
| Blackout (blackout) | 6.7 / 1.1 | 0% / 0% | *-1.29* / *+0.79* / *-0.75* | *+0.3* / *-0.1* / -0.5 | +6 / +27 / +4 | +23 / +49 / +15 | *+4%* / +20% |
| Shadow Clones (deathMark) | 15.7 / 4.8 | 0% / 0% | *-0.21* / *+0.13* / *-0.50* | +7.2 / *+0.0* / -0.7 | +34 / +58 / +13 | +14 / +24 / +14 | +26% / *+0%* |

### Haymaker (haymaker)

Full: 5.71 rooms, duels won 95% (health +83), group won 93% (health +41). Bare: 4.04 rooms, duels 8% (-67), group 3% (-43).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Toss (toss) | 18.1 / 4.1 | 16% / 15%, heals 6% | *+0.54* / *+0.13* / *-0.25* | +1.8 / *+0.6* / *+0.2* | +23 / +76 / +3 | +24 / +37 / +15 | +12% / *+17%* |
| Pitch Hay (pitchHay) | 5.6 / 0.6 | 0% / 0% | *-1.04* / *+0.79* / *-0.21* | *+0.3* / *+0.1* / *+0.0* | *+1* / +4 / *0* | +19 / +14 / *+9* | *+1%* / *+15%* |
| Hay Bale (forkCharge) | 22.8 / 4.7 | 54% / 66% | *+0.83* / *+1.67* / *+0.42* | +1.3 / +1.1 / *-0.3* | +71 / +124 / +65 | +23 / +40 / +30 | +48% / +23% |

### Digger (digger)

Full: 7.08 rooms, duels won 100% (health +89), group won 100% (health +67). Bare: 3.96 rooms, duels 0% (-78), group 3% (-40).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Dirt Fling (dirtFling) | 31.7 / 6.3 | 19% / 14% | *+1.00* / +1.92 / *+0.71* | +3.5 / *+0.2* / *+0.3* | +36 / +142 / +21 | +21 / +56 / +12 | +13% / *+3%* |
| Burrow (burrow) | 24.1 / 3.5 | 27% / 20% | *+0.83* / +1.67 / *+0.42* | +3.2 / *+0.0* / *-0.0* | +14 / +108 / +5 | +38 / +79 / +22 | *+3%* / +20% |
| Bury (spadeBat) | 27.5 / 5.9 | 13% / 18% | *+0.42* / *+0.71* / *+0.79* | *+0.9* / *+0.4* / *+0.2* | +5 / +45 / *+0* | +9 / +33 / +9 | *+0%* / *+0%* |

### Grandpa Sickle (grandpa)

Full: 7.21 rooms, duels won 93% (health +65), group won 77% (health +55). Bare: 2.75 rooms, duels 0% (-93), group 0% (-50).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Bread Toss (breadToss) | 33.2 / 16.0 | 0% / 0%, heals 67% | +3.33 / +3.50 / *+1.13* | +0.7 / -2.1 / +2.9 | +150 / +135 / *+3* | +80 / +62 / +22 | +92% / +60% |
| Harvest (harvest) | 33.4 / 22.5 | 23% / 28%, heals 11% | *+1.13* / *+0.88* / *+0.54* | +1.0 / *-0.2* / *+0.4* | +20 / +8 / *+5* | +47 / +23 / *+22* | *0%* / +33% |
| Old Tales (oldTales) | 17.5 / 0.4 | 0% / 0%, heals 8% | *+1.50* / *+0.54* / *-0.83* | *+0.1* / *-0.2* / *-0.0* | *-4* / *0* / *+0* | *+12* / *+2* / *+6* | *-3%* / *+7%* |

### Alchemist (alchemist)

Full: 8.13 rooms, duels won 99% (health +79), group won 100% (health +78). Bare: 4.21 rooms, duels 43% (-7), group 3% (-47).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Brew Pools (acidFlask) | 39.4 / 8.6 | 26% / 32% | +1.71 / *+0.00* / *+0.79* | +1.7 / *+0.3* / +0.5 | +12 / +44 / *+1* | *0* / +41 / *-4* | +7% / *+3%* |
| Elixir (elixir) | 37.2 / 6.5 | 0% / 0%, heals 100% | +4.21 / +2.50 / +3.33 | +2.1 / *-0.1* / +2.4 | +46 / +85 / *+1* | +84 / +94 / +19 | +24% / +60% |
| Monstrosity (bangFlask) | 11.1 / 1.2 | 0% / 0% | *+0.21* / *-0.25* / +2.29 | +0.8 / +0.6 / +0.5 | -9 / +12 / *0* | *+15* / +12 / *0* | *+1%* / *+7%* |

### Shaman (shaman)

Full: 6.79 rooms, duels won 57% (health +19), group won 50% (health +6). Bare: 5.29 rooms, duels 23% (-38), group 0% (-56).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Healing Totem (healTotem) | 23.8 / 6.8 | 0% / 0% | *+0.54* / *+0.50* / -1.67 | *+0.3* / *+0.1* / *+0.3* | +16 / +47 / +9 | *+16* / *+3* / +17 | +12% / *+7%* |
| Spirit Link (spiritLink) | 23.2 / 0.5 | 0% / 0% | -2.17 / *-0.54* / *-0.54* | *-0.2* / *-0.2* / *+0.1* | *0* / *-1* / *+0* | *+17* / *-1* / *+4* | *-1%* / *+10%* |
| Ancestors' Call (rainDance) | 20.5 / 2.7 | 0% / 0% | *+1.75* / *+1.08* / *-0.71* | +1.8 / *+0.2* / +0.5 | +20 / +42 / +2 | +50 / +37 / +23 | *+6%* / +43% |

### Witch (witch)

Full: 6.88 rooms, duels won 90% (health +73), group won 100% (health +31). Bare: 4.58 rooms, duels 68% (+24), group 13% (-39).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Hex (frogHex) | 28.6 / 10.1 | 7% / 7% | *+0.88* / *+0.17* / *-0.25* | *+0.6* / *+0.5* / *-0.0* | +6 / +28 / *+2* | *+6* / +16 / *+8* | *+5%* / *+10%* |
| Cursed Brew (cursedBrew) | 13.0 / 0.9 | 8% / 3%, heals 24% | +1.38 / *+0.67* / *+0.04* | *+0.7* / *+0.5* / *+0.0* | *+3* / *0* / *+0* | +25 / +43 / +7 | *0%* / +20% |
| Broom Ride (broomRide) | 17.0 / 2.5 | 33% / 23% | *+0.83* / *+0.13* / *+0.58* | +2.7 / *+0.2* / -0.2 | +14 / +42 / +5 | +16 / +31 / +6 | +6% / +27% |

### Warlock (warlock)

Full: 5.75 rooms, duels won 91% (health +59), group won 67% (health +21). Bare: 6.29 rooms, duels 93% (+83), group 47% (-14).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Eldritch Beam (eldritchBeam) | 18.8 / 5.5 | 22% / 49%, heals 8% | *+0.50* / *-0.13* / *-1.04* | *+0.8* / *+0.3* / -0.4 | -13 / -17 / *-2* | +22 / *+5* / *+1* | *-2%* / *+13%* |
| Awaken (summonImp) | 6.4 / 0.4 | 27% / 14% | *-1.13* / *+0.38* / *+0.17* | +4.7 / *-0.5* / -1.0 | -10 / *-7* / *+1* | +14 / +35 / *+8* | *-1%* / *-3%* |
| Dark Bargain (darkBargain) | 5.5 / 0.6 | 2% / 0% | *-0.50* / *+0.17* / *+0.79* | *-0.9* / *+0.3* / *-0.1* | *-2* / *+3* / *-1* | *-12* / +29 / *-2* | *+2%* / *-20%* |

### Cultist (cultist)

Full: 8.46 rooms, duels won 79% (health +64), group won 97% (health +43). Bare: 4.42 rooms, duels 44% (+2), group 10% (-41).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Blood Pact (bloodPact) | 17.9 / 0.5 | 0% / 0% | +2.00 / *+1.29* / *+1.04* | +1.1 / *-0.1* / +0.6 | *0* / *+3* / *+0* | +13 / *+3* / *+6* | *-2%* / *+3%* |
| Ritual Circle (ritualCircle) | 14.8 / 1.5 | 0% / 0% | +2.58 / *+1.00* / +2.25 | +3.1 / *-0.0* / *+0.2* | *-3* / +23 / *0* | +49 / +62 / *+10* | *-2%* / +43% |
| Sacrifice (soulCandle) | 23.5 / 3.2 | 20% / 9%, heals 49% | +2.67 / *+0.63* / +1.88 | +3.3 / *+0.3* / *+0.3* | +36 / +54 / +9 | +11 / +14 / *+6* | +16% / *+10%* |

### Monk (monk)

Full: 7.13 rooms, duels won 98% (health +95), group won 93% (health +54). Bare: 3.71 rooms, duels 2% (-79), group 3% (-51).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Flurry (flurry) | 37.6 / 14.0 | 33% / 36%, heals 44% | +1.58 / *+0.88* / *+0.88* | +2.1 / *+0.2* / +0.7 | +52 / +154 / +9 | *+11* / +43 / *+7* | +26% / +17% |
| Palm Strike (palmStrike) | 39.5 / 13.1 | 13% / 13% | *+1.04* / *-0.04* / *-0.25* | *+0.5* / *+0.2* / *+0.3* | +7 / +19 / *+0* | *-1* / +26 / *0* | *+1%* / *+7%* |
| Inner Peace (innerPeace) | 13.1 / 10.4 | 2% / 2%, heals 56% | +3.17 / *+1.17* / +2.42 | *-0.0* / *+0.0* / +1.6 | +6 / +114 / -3 | +39 / +75 / +41 | *+0%* / +23% |

### Seer (seer)

Full: 5.33 rooms, duels won 98% (health +61), group won 73% (health +13). Bare: 4.25 rooms, duels 33% (-17), group 2% (-49).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Foresight (foresight) | 28.4 / 17.9 | 0% / 0% | *+0.54* / +2.29 / *+0.50* | +0.6 / *+0.4* / *+0.2* | +48 / +69 / +38 | +24 / +42 / +24 | +42% / +30% |
| Blinding Flash (premonition) | 21.4 / 12.2 | 9% / 6%, heals 11% | *-1.25* / *+0.63* / -1.54 | +0.4 / *+0.3* / *-0.1* | +12 / +31 / +6 | *-1* / +13 / *-2* | +10% / *+3%* |
| Ill Omen (starfall) | 6.3 / 1.5 | 0% / 0% | *-0.88* / *+0.33* / *+0.21* | *-0.1* / *+0.1* / *-0.1* | *+2* / *+4* / *+0* | *+14* / +24 / *+6* | +5% / *+13%* |

### Chef (chef)

Full: 6.75 rooms, duels won 89% (health +66), group won 67% (health +9). Bare: 5.67 rooms, duels 62% (+22), group 7% (-47).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Hot Meal (hotMeal) | 26.9 / 4.3 | 0% / 0% | *+1.13* / *+0.29* / *-0.21* | *+0.5* / *+0.0* / +0.5 | +44 / +45 / *-2* | *+4* / *+5* / *+3* | +29% / *+7%* |
| Grease Fire (greaseFire) | 8.4 / 1.0 | 3% / 1% | *-0.21* / *-0.88* / *+0.04* | +1.2 / *+0.6* / *-0.3* | *-6* / *+8* / *+0* | *+14* / +30 / +16 | -7% / *+20%* |
| Food Fight (foodFight) | 15.3 / 3.2 | 11% / 9% | *+0.79* / *-0.58* / *+0.46* | *+0.4* / *+0.5* / *-0.3* | *-2* / *-1* / *+1* | +30 / +36 / +23 | *-2%* / +40% |

### Beekeeper (beekeeper)

Full: 8.58 rooms, duels won 92% (health +70), group won 27% (health -24). Bare: 3.71 rooms, duels 53% (+10), group 0% (-58).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Smoker (swarm) | 23.5 / 8.4 | 3% / 3% | *-0.29* / *+0.63* / *+0.25* | *+0.0* / *-0.0* / *+0.1* | *+4* / *+6* / *-3* | *-8* / +9 / *0* | *+2%* / *-7%* |
| Beehive (honeyPot) | 21.1 / 2.9 | 0% / 0% | *+1.88* / +1.25 / *-0.88* | +1.9 / *-0.1* / +0.5 | *-4* / +26 / *0* | *+10* / +21 / *-6* | -6% / *+0%* |
| Honey Glaze (royalJelly) | 24.5 / 4.2 | 0% / 0% | +3.92 / +3.96 / *+1.58* | *+0.2* / *-0.9* / +1.9 | +30 / +55 / +16 | *+3* / *+4* / *+2* | +22% / *-2%* |

### Quartermaster (quartermaster)

Full: 6.08 rooms, duels won 81% (health +33), group won 40% (health -17). Bare: 3.92 rooms, duels 25% (-29), group 3% (-52).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Supply Crate (resupply) | 20.6 / 0.2 | 0% / 0% | *+0.67* / *+0.42* / *-0.13* | *+0.2* / *+0.1* / *+0.3* | *-5* / *-4* / *+0* | *+9* / *+9* / *+0* | *-1%* / *+10%* |
| Barricade (oilBlades) | 14.2 / 1.8 | 0% / 0% | *-0.21* / *+0.21* / *-1.42* | +0.5 / *+0.6* / *-0.0* | +9 / *+3* / +4 | *+9* / *0* / *+7* | +8% / *+7%* |
| Pot Helmet (flare) | 38.1 / 18.2 | 20% / 15% | *+0.92* / *+0.63* / *+0.88* | +0.7 / *+0.7* / *+0.0* | +60 / +52 / +29 | +26 / +21 / +23 | +53% / +30% |

### Crossbowman (crossbowman)

Full: 7.63 rooms, duels won 100% (health +98), group won 100% (health +60). Bare: 4.25 rooms, duels 86% (+44), group 40% (-14).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Pavise (pavise) | 19.6 / 2.1 | 0% / 0% | *+1.21* / +1.96 / *+1.46* | *+0.3* / *+0.2* / *-0.0* | +2 / +28 / *0* | *+0* / +14 / *0* | *+0%* / *+0%* |
| Pinning Bolt (pinBolt) | 33.3 / 4.4 | 22% / 27% | *+0.38* / +1.67 / *+0.83* | +3.1 / *+0.2* / *-0.2* | +1 / +40 / *+0* | *+7* / +30 / *+3* | *+0%* / *+3%* |
| Crank Up (crankUp) | 24.3 / 3.1 | 28% / 24% | *+1.46* / +1.92 / *+1.04* | +3.7 / *+0.3* / *-0.2* | +7 / +52 / +2 | +28 / +59 / +17 | *+0%* / *+10%* |

### Falconer (falconer)

Full: 6.79 rooms, duels won 100% (health +92), group won 90% (health +24). Bare: 4.58 rooms, duels 87% (+44), group 20% (-30).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Loose the Falcon (looseFalcon) | 34.2 / 9.8 | 37% / 30% | +2.08 / +1.96 / *+0.75* | +4.0 / *+0.5* / *+0.1* | +16 / +37 / +4 | +19 / +35 / +18 | *+3%* / *+13%* |
| Keen Eye (keenEye) | 16.2 / 1.7 | 0% / 0% | *-0.54* / *+1.08* / *-0.58* | *+0.8* / *-0.2* / *-0.1* | *0* / *-2* / *+0* | *+5* / +22 / *+3* | *+0%* / *+3%* |
| Call the Flock (flock) | 15.4 / 3.2 | 12% / 11% | *-0.83* / *+0.00* / *-0.29* | *+0.4* / *+0.1* / *-0.2* | +10 / +30 / +3 | *+4* / +26 / +16 | *+3%* / *+10%* |

### Grenadier (grenadier)

Full: 6.50 rooms, duels won 100% (health +97), group won 100% (health +58). Bare: 4.13 rooms, duels 98% (+82), group 57% (0).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Big Bomb (bigBomb) | 14.1 / 1.2 | 15% / 10% | *+0.00* / *+1.46* / *-0.17* | +1.6 / *+0.1* / *+0.2* | +1 / +8 / *+0* | +14 / +40 / *+3* | *+0%* / *+3%* |
| Sticky Bomb (stickyBomb) | 32.6 / 8.3 | 27% / 34% | *+0.54* / *+1.38* / *+0.42* | +3.1 / *-0.1* / *+0.0* | +6 / +13 / +1 | +17 / +42 / *+6* | *+0%* / *+7%* |
| Blast Off (blastOff) | 12.4 / 0.6 | 5% / 1%, heals 9% | *-0.17* / *+1.04* / *+0.29* | *+1.3* / *-0.1* / *-0.2* | *+0* / +6 / *+0* | *-4* / +13 / *+1* | *+0%* / *+0%* |

### Harpooner (harpooner)

Full: 5.63 rooms, duels won 100% (health +84), group won 97% (health +46). Bare: 4.50 rooms, duels 55% (+6), group 13% (-30).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Reel In (reelIn) | 27.8 / 7.1 | 19% / 19% | *+0.75* / *-0.04* / *+1.21* | +1.3 / *-0.5* / *+0.3* | +36 / +59 / +38 | +23 / +31 / +14 | +13% / *+7%* |
| Rogue Wave (rogueWave) | 8.8 / 0.9 | 11% / 4% | +1.54 / *+0.21* / *+0.04* | +0.9 / *-0.2* / *+0.3* | *0* / *+3* / *+0* | +18 / +17 / *+5* | *+0%* / +13% |
| Drop Anchor (anchorDrop) | 20.1 / 5.0 | 24% / 35% | *+1.04* / *+1.08* / *+0.33* | +2.1 / *+0.5* / *+0.1* | +15 / +44 / *+2* | +30 / +34 / +7 | +3% / +27% |

### Javelin Huntress (huntress)

Full: 6.75 rooms, duels won 100% (health +96), group won 100% (health +50). Bare: 5.25 rooms, duels 100% (+86), group 53% (+0).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Spear Lunge (runningThrow) | 43.1 / 2.1 | 17% / 3% | -1.42 / *-0.08* / *+0.50* | +2.1 / -0.4 / *-0.1* | *+0* / *+2* / +2 | *+5* / +27 / *+2* | *+0%* / *+0%* |
| Bound (bound) | 20.8 / 1.8 | 11% / 8% | *+1.58* / *+0.25* / *+0.29* | +2.9 / *-0.0* / *+0.1* | +2 / *+2* / *+1* | *-2* / +18 / *-1* | *+0%* / *+0%* |
| Javelin Rain (prey) | 24.2 / 2.9 | 22% / 21%, heals 33% | *+0.83* / *-0.13* / *+0.50* | +2.6 / *-0.3* / *+0.3* | +6 / +10 / +3 | +15 / +39 / +16 | *+0%* / *+0%* |

### Marksman (marksman)

Full: 5.71 rooms, duels won 100% (health +80), group won 97% (health +48). Bare: 3.46 rooms, duels 66% (+24), group 23% (-29).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Aimed Shot (aimedShot) | 28.0 / 5.9 | 31% / 44% | *+0.79* / *+0.96* / *+1.00* | +3.7 / *-0.3* / *+0.3* | +19 / +50 / +7 | +42 / +68 / +10 | +3% / +20% |
| Bayonet (bayonet) | 6.9 / 0.4 | 6% / 1% | *+0.00* / *+0.29* / *-0.75* | *+1.2* / *-0.2* / *+0.2* | *+1* / +32 / *+1* | *+3* / *+1* / *+0* | *+1%* / *-3%* |
| Ricochet (ricochet) | 15.7 / 1.2 | 19% / 12% | *+0.17* / +1.58 / *-0.83* | +2.6 / *-0.2* / *-0.0* | *+2* / +12 / *+0* | +11 / +44 / +7 | *+0%* / *+3%* |

### Ninja (ninja)

Full: 5.54 rooms, duels won 96% (health +75), group won 63% (health +1). Bare: 5.00 rooms, duels 85% (+47), group 33% (-22).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Kunai Rain (shurikenFan) | 33.3 / 10.4 | 11% / 13% | -1.38 / *-0.50* / *-1.46* | +1.0 / *-0.6* / *-0.1* | *+2* / +6 / +3 | +12 / *+4* / *-1* | *+3%* / *+17%* |
| Substitution (substitution) (passive) | 0.0 / 0.0 | 0% / 0% | *+0.46* / *+0.71* / -1.83 | *+0.7* / *-0.3* / *-0.1* | +15 / +18 / *+2* | *+4* / *+3* / *-2* | +7% / *+3%* |
| Caltrops (caltrops) | 24.3 / 7.5 | 6% / 3% | *-0.63* / *+0.75* / *+0.25* | +1.1 / *-0.1* / -0.2 | *+5* / +16 / *+3* | +21 / +16 / +11 | *+2%* / +27% |

### Pirate (pirate)

Full: 8.92 rooms, duels won 100% (health +75), group won 100% (health +56). Bare: 3.63 rooms, duels 1% (-72), group 3% (-48).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Point Blank (pointBlank) | 59.1 / 8.9 | 38% / 41% | *+1.38* / *+0.46* / *+1.79* | +3.9 / *+0.3* / *-0.2* | *+3* / +120 / *0* | +33 / +49 / +21 | *+2%* / +27% |
| Grog (grog) | 11.7 / 0.4 | 0% / 0%, heals 100% | +2.88 / *+1.63* / +1.88 | +2.5 / -1.2 / +2.0 | +15 / +145 / *-1* | +14 / +29 / +11 | +5% / *+7%* |
| Broadside (broadside) | 18.4 / 1.4 | 20% / 17% | *+0.38* / *+0.46* / *+1.21* | +2.0 / *+0.4* / *-0.0* | *-2* / +15 / *+1* | +22 / +43 / +18 | *+0%* / +20% |

### Slinger (slinger)

Full: 7.25 rooms, duels won 100% (health +97), group won 97% (health +47). Bare: 4.67 rooms, duels 85% (+57), group 40% (-20).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Stunning Stone (stunStone) | 37.5 / 10.4 | 20% / 19% | *+1.21* / *+0.88* / *+1.25* | *+0.9* / +0.9 / *-0.3* | +4 / +29 / +2 | *+4* / +26 / +9 | *+0%* / *-3%* |
| Ram (ramCharge) | 24.1 / 5.6 | 20% / 21% | *+1.25* / *+0.17* / *+0.46* | +1.5 / *-0.2* / *+0.1* | +5 / +33 / +5 | +29 / +48 / +16 | *+1%* / +20% |
| Counting Sheep (gravel) | 24.8 / 6.0 | 0% / 0% | +1.71 / *-0.71* / *+0.50* | *-0.5* / *+0.2* / *+0.1* | +2 / +14 / *+1* | +14 / +17 / *-1* | *+0%* / *+7%* |

### Trapper (trapper)

Full: 7.63 rooms, duels won 78% (health +53), group won 90% (health +14). Bare: 4.38 rooms, duels 55% (+4), group 23% (-29).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Jaw Trap (jawTrap) | 38.8 / 7.0 | 20% / 15% | +1.71 / +1.96 / *+1.38* | +1.4 / *+0.6* / *+0.1* | *+3* / +20 / *+1* | *-6* / *+4* / *-5* | *+3%* / *-7%* |
| Double Barrel (snareNet) | 34.7 / 7.1 | 20% / 25% | +2.13 / *+0.83* / *+1.08* | +1.6 / *+0.2* / *-0.1* | +10 / +43 / +7 | *+9* / +26 / *-2* | *+3%* / *+10%* |
| Bush (tripwire) | 9.2 / 0.8 | 0% / 0% | +2.75 / *+0.17* / +1.96 | *+0.5* / +0.7 / *+0.3* | +7 / +37 / +2 | *+8* / +27 / +9 | +7% / +23% |

### Gladiator (gladiator)

Full: 5.92 rooms, duels won 100% (health +95), group won 93% (health +50). Bare: 4.29 rooms, duels 3% (-63), group 17% (-32).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Spear of Ares (netThrow) | 25.9 / 5.9 | 22% / 23% | *+0.46* / *+0.21* / *-0.13* | *+1.0* / *+0.5* / *-0.3* | +4 / +50 / +3 | *+7* / +33 / *+7* | *+0%* / *+3%* |
| Arena (showboat) | 11.0 / 4.4 | 9% / 9%, heals 100% | *+1.13* / *+0.50* / *+0.50* | +1.7 / *+0.3* / +0.5 | +38 / +140 / +38 | +44 / +46 / +25 | +5% / +43% |
| Shield Rush (shieldRush) | 26.8 / 6.2 | 19% / 17% | *+0.54* / *-0.04* / *+0.50* | *+1.2* / *+0.3* / *-0.2* | +8 / +73 / +2 | +17 / +22 / *+4* | *+2%* / *+17%* |

### Jester (jester)

Full: 6.04 rooms, duels won 100% (health +81), group won 97% (health +51). Bare: 4.17 rooms, duels 18% (-34), group 30% (-23).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Swap (mock) | 29.0 / 6.7 | 0% / 0% | *+0.33* / *+0.67* / *+0.42* | *+0.5* / *+0.2* / *-0.1* | +7 / +25 / +4 | *+4* / +19 / *0* | *+0%* / *-3%* |
| Befuddle (befuddle) (passive) | 0.0 / 0.0 | 11% / 3% | *+0.79* / *-0.04* / *+1.08* | +2.1 / *+0.3* / *+0.0* | +10 / +34 / +2 | *+1* / *+0* / *+3* | *+0%* / *-3%* |
| Juggling Act (juggle) | 30.9 / 7.4 | 48% / 71% | +1.29 / *+0.88* / *+0.17* | +4.1 / +0.6 / *+0.1* | +57 / +89 / +22 | +59 / +64 / +26 | +28% / +50% |

### Samurai (samurai)

Full: 4.08 rooms, duels won 100% (health +80), group won 97% (health +48). Bare: 4.25 rooms, duels 5% (-47), group 30% (-21).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Iaido (iaido) | 17.3 / 3.1 | 21% / 27% | *-0.38* / *+0.13* / *-0.46* | +1.4 / *-0.8* / *-0.0* | +19 / +81 / *+1* | +14 / +46 / *+0* | +5% / +13% |
| Focus (focus) | 8.2 / 1.1 | 0% / 0% | *-1.08* / *+0.92* / *-0.17* | +1.8 / *-0.9* / *-0.1* | +3 / +15 / +1 | *+3* / +25 / *+1* | *+1%* / *+3%* |
| Crescent Cut (crescentCut) | 15.0 / 2.8 | 23% / 23% | *-0.92* / *+0.50* / *-1.00* | +2.4 / *-0.6* / *-0.2* | +35 / +104 / +18 | +16 / +40 / +11 | *+2%* / *+7%* |

### Valkyrie (valkyrie)

Full: 6.29 rooms, duels won 0% (health -85), group won 67% (health +17). Bare: 4.42 rooms, duels 0% (-85), group 10% (-42).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Valkyrie's Call (valkyrieCall) | 1.0 / 0.0 | 1% / 0% | *+0.83* / *+0.13* / *-0.25* | *+0.2* / *-0.3* / *+0.2* | *0* / *+0* / *+0* | *0* / *-7* / *+0* | *+0%* / *-3%* |
| Spear of the Sky (spearThrow) | 12.3 / 1.2 | 1% / 1% | *+0.83* / *+0.63* / *-0.54* | *+0.1* / *+0.1* / *-0.0* | *+0* / *+0* / *+0* | +38 / +19 / *+1* | *+0%* / +43% |
| Sky Dive (skyDive) | 9.7 / 1.1 | 17% / 16% | *+0.42* / *+0.54* / *+0.67* | +1.0 / *-0.3* / +0.4 | *0* / *+0* / *+0* | +43 / +23 / +39 | *+0%* / +53% |

### Engineer (engineer)

Full: 8.54 rooms, duels won 84% (health +52), group won 83% (health +27). Bare: 3.83 rooms, duels 35% (-18), group 17% (-35).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Deploy Turret (deployTurret) | 19.3 / 1.2 | 0% / 0% | *+1.88* / +2.54 / *+0.42* | +4.3 / *+0.8* / *-0.2* | +7 / +13 / *+2* | +28 / +25 / *+12* | *+5%* / +30% |
| Tinker (tinker) | 32.2 / 6.5 | 0% / 0% | +2.46 / +1.46 / *+1.42* | +2.3 / *+0.3* / *+0.2* | +45 / +50 / +8 | +22 / +29 / *+8* | +29% / +23% |
| Wind-up Drones (shockMine) | 39.7 / 9.4 | 0% / 0% | *+0.25* / *+1.00* / *+0.04* | +1.1 / *+0.1* / *-0.0* | +12 / +15 / +7 | +17 / +10 / *+11* | +13% / *+17%* |

### Werewolf (werewolf)

Full: 6.33 rooms, duels won 96% (health +70), group won 100% (health +51). Bare: 3.46 rooms, duels 0% (-82), group 7% (-40).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Turn (turnWolf) | 11.7 / 1.1 | 0% / 0% | *-0.13* / *+0.50* / *+1.50* | +3.8 / *+1.4* / -1.5 | -6 / +6 / *-1* | +51 / +29 / +20 | *-2%* / +43% |
| Frenzy (frenzy) (passive) | 0.0 / 0.0 | 0% / 0% | +2.71 / *+1.38* / *+1.42* | +3.7 / *-0.8* / +2.3 | +107 / +113 / +17 | +33 / +13 / +9 | +73% / +23% |
| Pounce (pounce) | 27.8 / 14.6 | 15% / 24%, heals 19% | *+0.42* / *+0.42* / *+0.63* | +2.5 / *+0.1* / *-0.3* | +46 / +22 / +6 | +40 / +14 / +12 | +26% / +37% |

### Enchantress (enchantress)

Full: 7.25 rooms, duels won 76% (health +43), group won 93% (health +56). Bare: 4.17 rooms, duels 47% (-6), group 8% (-51).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Heartstring (heartstring) | 36.2 / 14.6 | 0% / 0% | *+1.08* / *+0.75* / *-0.38* | *-0.0* / *-0.2* / *-0.1* | -23 / *+3* / *-4* | +28 / +32 / +21 | -17% / +23% |
| Sweetheart (sweetheart) | 20.6 / 3.1 | 0% / 0%, heals 44% | *+1.33* / *+0.63* / *+1.46* | *+0.1* / *+0.1* / *+0.3* | +10 / +26 / +5 | +51 / +45 / +38 | *+8%* / +33% |
| Heartbreak (heartbreak) | 26.1 / 13.3 | 17% / 20%, heals 56% | *+0.21* / *+1.08* / *+1.54* | +0.8 / *-0.4* / +0.5 | +36 / +62 / +25 | +27 / +11 / +31 | +27% / +20% |

### The Mob (mob)

Full: 5.25 rooms, duels won 99% (health +90), group won 67% (health +13). Bare: 4.25 rooms, duels 0% (-76), group 10% (-31).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Pile On (pileOn) | 22.8 / 5.3 | 39% / 43% | *+0.33* / *+0.04* / *+0.79* | +3.5 / *+0.2* / *+0.0* | +84 / +156 / +24 | *+12* / +21 / *+12* | +49% / *+13%* |
| Surround (surround) | 9.4 / 0.9 | 15% / 8% | *+0.08* / *+0.21* / *+0.08* | +1.6 / *-0.2* / *+0.1* | *+1* / +24 / *+0* | *-10* / *+8* / *+14* | *+0%* / *-10%* |
| Scatter (scatter) | 5.7 / 0.7 | 0% / 0% | *+0.67* / *+0.00* / *-1.13* | *+0.7* / *-0.1* / +0.9 | +7 / +84 / +1 | *+10* / +25 / +5 | *+3%* / *+13%* |

### Clockmaker (clockwork)

Full: 6.17 rooms, duels won 100% (health +85), group won 100% (health +72). Bare: 3.63 rooms, duels 35% (-14), group 7% (-47).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Rewind (rewind) | 14.8 / 1.7 | 0% / 0%, heals 100% | *+1.08* / *+1.42* / *+0.42* | *+0.0* / *+0.7* / +0.5 | +9 / +91 / *+1* | +34 / +83 / +12 | *+0%* / *+3%* |
| Slow Time (timeBubble) | 27.0 / 15.8 | 0% / 0% | *+0.38* / *+1.17* / *+1.08* | +0.2 / *+0.6* / *-0.1* | +3 / +74 / +6 | +11 / +53 / *+1* | *+0%* / *+3%* |
| Stop the Clock (stopClock) | 19.2 / 6.9 | 15% / 8% | *+0.00* / *+0.58* / *+0.17* | +0.8 / +0.9 / -0.3 | +4 / +27 / *+2* | *+4* / +31 / *-1* | *+0%* / *+3%* |

### Air Mage (airMage)

Full: 6.67 rooms, duels won 100% (health +93), group won 97% (health +49). Bare: 4.42 rooms, duels 32% (-21), group 0% (-50).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Gale (gale) | 36.5 / 15.2 | 18% / 15% | *+1.00* / *-0.04* / *+0.25* | +1.1 / *+0.8* / -0.2 | +3 / +36 / +4 | *+11* / +27 / *-1* | *+0%* / *+3%* |
| Updraft (updraft) | 32.3 / 13.7 | 10% / 15% | *+1.13* / *+1.29* / *+0.71* | +1.5 / +0.6 / *-0.1* | +66 / +96 / +16 | +35 / +48 / +15 | +29% / +20% |
| Cyclone (cyclone) | 15.7 / 1.5 | 21% / 14% | *+0.71* / *+0.83* / *+0.83* | +1.8 / +0.6 / *-0.3* | +5 / +16 / *+0* | +33 / +51 / +14 | *+1%* / +17% |

### Warden (warden)

Full: 5.96 rooms, duels won 43% (health -5), group won 80% (health +34). Bare: 5.58 rooms, duels 0% (-79), group 3% (-43).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Manacles (manacle) | 29.5 / 8.2 | 11% / 6% | *+0.54* / *-0.08* / *-0.21* | *+0.5* / *+0.0* / *+0.1* | +16 / +14 / +3 | +13 / +11 / *+12* | +10% / *+7%* |
| Nullify (nullify) | 13.9 / 7.1 | 0% / 0% | *-0.25* / *+0.04* / *+0.33* | *-0.1* / *+0.5* / *-0.3* | +34 / +36 / +26 | +37 / +22 / +18 | +18% / +37% |
| Chain Gang (chainGang) | 15.4 / 2.2 | 7% / 7%, heals 8% | *+0.21* / *+0.08* / *+0.71* | *+0.4* / *+0.1* / *-0.0* | +16 / +28 / +7 | +50 / +29 / +41 | *+5%* / +43% |

### Telekinetic (telekinetic)

Full: 5.83 rooms, duels won 100% (health +100), group won 100% (health +67). Bare: 3.79 rooms, duels 25% (-30), group 13% (-45).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Hurl (hurl) | 34.3 / 7.4 | 36% / 46%, heals 26% | *+1.54* / *+0.67* / *+0.13* | +3.4 / *-0.2* / *+0.1* | +3 / +120 / +1 | +29 / +72 / +17 | *+0%* / *+0%* |
| Levitate (levitate) | 25.3 / 5.5 | 11% / 13%, heals 16% | +1.83 / *+1.25* / *+0.58* | +1.8 / *+0.7* / *-0.1* | +9 / +127 / +2 | +35 / +80 / +17 | *+0%* / *+0%* |
| Mind Shield (mindShield) | 8.1 / 0.6 | 3% / 2% | *-0.04* / *+0.75* / *+0.63* | *+0.5* / *+0.2* / *-0.0* | +0 / +47 / *0* | +8 / +30 / *+4* | *+0%* / *+0%* |

### Earth Mage (earthMage)

Full: 6.54 rooms, duels won 100% (health +90), group won 100% (health +75). Bare: 5.17 rooms, duels 65% (+25), group 20% (-33).

| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |
|---|---|---|---|---|---|---|---|
| Earthquake (earthquake) | 15.1 / 1.3 | 25% / 20% | *+1.50* / *+0.08* / *+0.38* | +2.6 / *+0.1* / *+0.0* | +8 / +30 / +5 | +51 / +88 / +19 | *+1%* / +13% |
| Spike Chain (spikeChain) | 38.5 / 11.8 | 17% / 20% | *+0.50* / *+0.46* / *+0.21* | +1.7 / *+0.2* / *-0.1* | +20 / +58 / *+1* | +15 / +53 / *+2* | +12% / *+0%* |
| Stone Wall (stoneWall) | 16.8 / 6.5 | 3% / 2% | *+0.50* / *-0.67* / *+0.04* | *-0.0* / *-0.1* / *-0.0* | -2 / +18 / *0* | +5 / *+7* / +3 | *+0%* / *+0%* |

## Proposals

All proposals. Nothing here has been tried in the game.

1. **Fix the battle-mode ethereal loss** (a bug, not balance). In js/battle.js `fighting()`, let a unit with a hero kit
   count while it is ethereal, as tools/audit/worth/lib.mjs `fightingFix` does (`|| !!u.kit`). Or narrower: count it
   while one of its own ability states is on (burrowing, riding, hiding, shadow form).
2. **Reset the unit id counter per fight/run** for the test tools: export a `resetIds()` from sim.js, or keep the audit
   line (`AUDIT.idFrom`) and set it in tools/balance.mjs and tools/ability-worth.mjs. In the game it doesn't matter.
3. **Look at Cure III** (Plague Doctor). "Every ally near" makes the group fight clearly worse than Cure I. A guess
   to check: cleansing everyone at once clears friends' good states too, or fills the flask with weak statuses.
4. **Give Valkyrie's Call a use when nobody is down**, or let it fire in battle mode. As it is, a third of the
   Valkyrie's kit does nothing in most fights.
5. **Look at the zero-worth abilities that do fire:** Roll (Archer), Supply Crate (Quartermaster), Old Tales (Grandpa
   Sickle) and Entangle (Druid) fire often and change nothing measurable. Each wants a bigger effect or a new job.
6. **Look at Dark Bargain + Awaken** (Warlock). Together they are worse than either alone in the group fight. Dark
   Bargain costs a fifth of his health and, with the imp out, may trade his life for little. It is the lowest-ranked
   ability.
7. **Shield Wall** (Bulwark) is the second lowest. Planted and unmovable may keep him from reaching what he guards; its
   tier III makes group fights worse.
8. **Spread the weight in carried kits.** Grandpa Sickle without Bread Toss is close to bare, and Werewolf without Frenzy
   and Alchemist without Elixir are not far off. A designer call: either that is the hero's identity, or the other two
   abilities need more.
9. **Upgrades that do nothing:** the 33 listed under "Tier steps that change nothing" (Harvest, Hot Meal, Chain
   Lightning, Hibernate, Spear of the Sky and others) are the ones to give a tier II/III that changes something. Stop the
   Clock and Gale belong on that list for both of their steps.
10. **Before a tournament, rerun this with a party setting** (the hero plus two fixed friends in battle mode, with the id
    reset) if supports' worth matters: the dungeon's party numbers are too noisy to rank one ability.

## What this could not measure

- **Dungeon rooms are too noisy to rank one ability.** A run ends at its first wipe, so rooms cleared swing by several
  rooms between runs, and switching one ability off changes the run from the first cast. One ability's rooms worth has an
  error of about 0.8 rooms at 24 runs a build. Cutting that to a fifth of a room would take about 16 times the runs
  (some 100 proc-hours). The dungeon's per-second numbers are steadier, and the battle numbers steadier still; the
  combined score leans on whichever is surer.
- **The dungeon batch ran before the id counter was found** (see Noise). Its builds share party, dungeon and seed but
  not the exact fight. That makes it noisier, not wrong; a test with the counter reset showed rooms no steadier.
- **The battle panel is one choice of foe.** An ability that shines against swarms, bosses, flyers, burrowers or undead
  (Consecrate's undead burn) is only measured against what the panel and the crypt group hold. The dungeon runs cover the
  rest, but noisily.
- **Battle mode uses the whole tier III web** (stat nodes too). The dungeon uses the abilities alone at hero level 1, as
  tools/ability-worth.mjs does. Neither has trinkets or potions. Real players' builds sit somewhere between.
- **The health margin tops out** at +100 (won without a scratch). For heroes whose one ability already wins the duels,
  the second and third can't show much there. That pulls their "minus one" down and makes pairs look like overlaps.
  The group fight, harder, is less affected.
- **Abilities that need a friend of a certain kind** (one that heals a hurt friend, revives a downed one, buffs a
  shooter) have one friend (a Tower) in the group fight and two random heroes in the dungeon. They are under-measured in
  the duels by design: the duels say what the hero can do alone. Valkyrie's Call can't be measured in battle at all.
- **Tier II on its own** was measured only for the five flagged abilities. For the rest, "I to III" says whether the
  whole upgrade path matters, not which step does.
- **Cooldowns run during lasting effects** (docs/audit/cooldowns.md). All numbers here use today's rule; an ability
  whose cooldown would get longer under a new rule would be worth less than shown.
- **Passive abilities** (Frenzy, Substitution, Befuddle, Old Bones) are never cast, so the cast check can't show whether
  they triggered. Their worth is measured the same way (on or off).
- **The "Dmg share" column** counts only damage the hero's own ability did, so an ability that works through friends
  (a buff, a heal, a taunt) shows 0% there while its outcome numbers show its worth.

## Files

- tools/audit/worth/lib.mjs: the builds, the panel, one battle fight, one dungeon run, the cast and source watcher (AUDIT.on).
- tools/audit/worth/battle.mjs, dungeon.mjs: the batches (--shard i/n to split across processes).
- tools/audit/worth/calibrate.mjs: how the battle panel was picked.
- tools/audit/worth/analyze.mjs, report.mjs, notes.md: this page from the batches.
- docs/audit/data/worth/summary.json: every ability's worth in every build and measure with its standard error, casts,
  damage shares, every pair's interaction, each hero's full and bare levels.
- docs/audit/data/worth/battle-*.json, dungeon-*.json: the raw batches (per seed win and margin, per run rooms).
