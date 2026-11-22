# Round 13: every ability of the first 15 heroes (lane H1, branch kits3)

The designer, on the 0.12.0 balance report: "Go through and make sure every ability at lvl 1 and lvl 3 are balanced.
Everything should be useful. Somethings can't be tested with base stats like evasion stuff. But I could maybe test
based off turning a skill on and off to see its impact? Damage Abilities should do similar damage as the main weapon
or better on average. Ofc abilities have more utility so balance it around that." And in the message of 2026-11-22:
"Many heroes still seem weak compared to others like the tower vs paladin" and "Make the archers abilities stronger/
have more of the damage percentage."

## How it was measured
- `bash tools/balance-all.sh <dir> 2 3`: every hero leads a party of three with two random others, every dungeon, all
  three abilities at the tier and nothing else; tier I at the Wildwood's strength, tier III at the Warren's. 954 runs
  a tier. Tables kept: `r13-before-tier1.txt`, `r13-before-tier3.txt`, `r13-after-tier1.txt`, `r13-after-tier3.txt`.
- `node tools/ability-worth.mjs` (new): the designer's own idea. For each hero the same parties from the same seeds are
  played with all three abilities, and with each one in turn switched off. "Rooms" below is how many more rooms the
  party clears with the ability than without it; "% of damage" is the ability's share of the hero's own damage;
  "healing/s" is what the party gains in healing with it.
- Duels and party duels in battle mode for the Tower and the Paladin (tiers 0 to 3 as the battle page builds them).

**Read the numbers with their noise.** The same parties are replayed, but one changed blow early in a run changes
everything after it, so a hero's "vs average" moves by about half a room between two batches with identical numbers
(the Paladin, untouched, read +1.17, +1.18, +0.55, +0.24 and +0.90 at tier I across the five batches of this round; the Plague Doctor, untouched, +1.04, +0.77, +0.60, +0.54 and +1.63). The on/off
"rooms" come from 36 parties a hero before and 24 after and move by about a room: an ability is called weak below only
where it reads at or under zero in several columns at once, and its damage and healing columns agree.

## The table
"Before" is 0.16.1 as the designer has it; "after" is this branch. Where "what changed" says "after this table", the
last small step was made after the on/off runs.

| hero | ability | tier I before | tier I after | tier III before | tier III after | what changed |
|---|---|---|---|---|---|---|
| **Paladin** | (all on) | 7.8 rooms, attack 64% | 7.7 rooms, attack 65% | 5.8 rooms, attack 55% | 5.0 rooms, attack 55% | unchanged |
| | Shield Bash | +0.6 rooms, 22% of damage | +1.2 rooms, 21% of damage | +0.8 rooms, 23% of damage | -0.2 rooms, 23% of damage | unchanged |
| | Guard | +0.1 rooms | +0.8 rooms | +1.4 rooms | -0.2 rooms | unchanged |
| | Consecrate | +1.5 rooms, 14% of damage, +0.6 healing/s | +1.0 rooms, 13% of damage, +0.3 healing/s | +1.8 rooms, 20% of damage, +0.5 healing/s | +0.2 rooms, 19% of damage | unchanged |
| **Tower** | (all on) | 6.7 rooms, attack 86% | 6.8 rooms, attack 60% | 3.7 rooms, attack 84% | 5.0 rooms, attack 44% | the health tank: health 180 to 310, armour 8 to 5, mace 11 to 12.5 |
| | Hold the Line | +0.1 rooms | -0.8 rooms | -0.6 rooms | +1.3 rooms, 10% of damage, +0.5 healing/s | taunts wider (240 / 320, was 200 / 300); those he holds hit 20% softer while it lasts; his struck-back blows are counted as the ability's |
| | Charge | +0.7 rooms | +0.3 rooms, 23% of damage | -0.2 rooms | -0.5 rooms, 29% of damage | its blow is 2x the mace's and grows with his damage and its own power nodes (was a flat 18 the nodes did nothing for); tier III staggers 45 (was 60) |
| | Ground Pound | +1.1 rooms, 14% of damage | +0.0 rooms, 17% of damage, +0.3 healing/s | +0.8 rooms, 15% of damage | -0.1 rooms, 16% of damage | 1.2x (was 1x); the second ring 0.6x, stagger 20 (was 30) |
| **Archer** | (all on) | 7.9 rooms, attack 75% | 8.6 rooms, attack 68% | 4.4 rooms, attack 60% | 5.2 rooms, attack 48% | bow unchanged; her abilities carry more |
| | Barrage | +1.2 rooms, 14% of damage | +1.2 rooms, 21% of damage | +0.2 rooms, 20% of damage | +0.5 rooms, 23% of damage | loosed at a lone enemy too (it only went at a crowd); cooldown 7 to 7.5; an arrow 0.75x (was 0.8x) |
| | Frost Arrow | +0.9 rooms, 10% of damage | +0.5 rooms, 11% of damage | -1.0 rooms, 9% of damage | +0.2 rooms, 13% of damage | 1.9x (was 1.2x); the tier III burst also hurts (0.7x) all round |
| | Roll | +0.8 rooms | +1.4 rooms | -0.1 rooms | -0.2 rooms, 4% of damage | a roll, not a slide; tier III caltrops slow by 45% and prick (they chilled) |
| **Twinfang** | (all on) | 5.7 rooms, attack 67% | 6.8 rooms, attack 61% | 3.1 rooms, attack 50% | 3.7 rooms, attack 44% | health 100 to 115 |
| | Backstab | +1.0 rooms, 26% of damage | +0.4 rooms, 24% of damage | +0.6 rooms, 35% of damage, +0.4 healing/s | +0.4 rooms, 34% of damage, +0.3 healing/s | 4x (was 3.6x); untouchable for half a second as she steps out |
| | Dash | -0.4 rooms | -0.5 rooms | -0.3 rooms, +0.5 healing/s | -0.4 rooms, +0.3 healing/s | nothing lands on her mid-dash; she only dashes in at an enemy busy with someone else (after this table: switched off it made no difference in all four columns) |
| | Fan of Knives | -0.3 rooms, 8% of damage | +0.2 rooms, 14% of damage | +0.2 rooms, 10% of damage, +0.3 healing/s | +0.6 rooms, 17% of damage, +0.4 healing/s | used on two enemies, not only three; a knife 1.8x (was 1.4x) |
| **Wildmane** | (all on) | 6.5 rooms, attack 66% | 5.7 rooms, attack 62% | 4.1 rooms, attack 59% | 4.7 rooms, attack 55% | health 125 to 145 |
| | Rage | +0.6 rooms | -0.0 rooms | +0.7 rooms, +0.7 healing/s | +1.9 rooms, +0.9 healing/s | takes 38% less (was 30%); cooldown 14 to 12 |
| | Leap | +0.4 rooms, 22% of damage | -0.8 rooms, 27% of damage | +0.4 rooms, 23% of damage | +1.0 rooms, 26% of damage | landing 1.6x (was 1.3x) |
| | Cleave | -0.3 rooms, 12% of damage | -0.3 rooms, 11% of damage | +0.3 rooms, 18% of damage | +0.4 rooms, 19% of damage | reach brought in to the blade (u.r + 38 / 52, was 50 / 70); 2.3x (was 1.3x) |
| **Berserker** | (all on) | 6.8 rooms, attack 63% | 6.4 rooms, attack 57% | 3.9 rooms, attack 52% | 5.2 rooms, attack 46% | health 115 to 128 |
| | Shockwave | +1.6 rooms, 19% of damage | -0.3 rooms, 26% of damage | -0.2 rooms, 21% of damage, +0.3 healing/s | +1.0 rooms, 28% of damage | waves that travel: each hits what it passes once (0.9x) and shoves it on; three waves, five at II |
| | Whirl | +0.8 rooms, 18% of damage | -0.2 rooms, 17% of damage | -0.2 rooms, 27% of damage, +0.8 healing/s | +1.5 rooms, 27% of damage | its blows knock back the way the flail turns (200, was 120); at III it draws in what is just out of reach; he takes 20% less while he spins |
| | Unstoppable | +1.0 rooms | -0.5 rooms | +1.0 rooms, +1.6 healing/s | +2.3 rooms, +0.6 healing/s | unchanged |
| **Granny Reaper** | (all on) | 6.8 rooms, attack 52% | 6.1 rooms, attack 50% | 3.7 rooms, attack 45% | 3.7 rooms, attack 46% | health 110 to 118 |
| | Reap | +1.6 rooms, 32% of damage | +0.6 rooms, 28% of damage | +0.6 rooms, 40% of damage, +0.8 healing/s | +0.2 rooms, 33% of damage, +1.0 healing/s | reach brought in to the scythe (u.r + 46 / 62, was 60 / 85); 2.9x (was 2.6x) |
| | Hook | +1.3 rooms, 16% of damage | -0.0 rooms, 22% of damage | -0.8 rooms, 15% of damage | -0.4 rooms, 21% of damage | 1.9x (was 1.3x) |
| | Old Bones | +0.8 rooms | +0.3 rooms | -0.5 rooms | +0.1 rooms, +0.6 healing/s | unchanged (a protection border shows the second it holds) |
| **Pyromancer** | (all on) | 6.8 rooms, attack 43% | 7.6 rooms, attack 42% | 4.9 rooms, attack 32% | 3.0 rooms, attack 32% |  |
| | Fireball | -0.6 rooms, 21% of damage | -0.1 rooms, 21% of damage | +1.1 rooms, 20% of damage, +0.7 healing/s | -1.3 rooms, 21% of damage, +0.3 healing/s | unchanged |
| | Flame Wall | -0.9 rooms | +0.8 rooms | +1.5 rooms, +0.3 healing/s | -1.5 rooms | unchanged |
| | Inferno | +0.3 rooms, 6% of damage | +0.8 rooms, 8% of damage | +1.3 rooms, 4% of damage, +0.3 healing/s | -0.4 rooms, 7% of damage | 2.6x (was 1.5x); cooldown 18 to 14 |
| **Frost Mage** | (all on) | 5.9 rooms, attack 67% | 6.3 rooms, attack 63% | 4.2 rooms, attack 49% | 3.8 rooms, attack 45% | damage 8 to 8.6 |
| | Ice Shard | +0.4 rooms, 30% of damage | +1.0 rooms, 30% of damage | +1.4 rooms, 46% of damage | +0.3 rooms, 42% of damage | the middle spike 1.8x (was 1.7x) |
| | Frost Nova | -1.7 rooms | +0.6 rooms, 4% of damage | +0.4 rooms | -1.0 rooms, 5% of damage | also hurts what it freezes (1.2x) |
| | Ice Wall | -0.3 rooms | +0.4 rooms | -0.3 rooms | +0.9 rooms | only thrown up against a brawler coming for her, across its way (it was raised whenever two enemies were near, across the party's own line of fire) |
| **Storm Mage** | (all on) | 7.1 rooms, attack 64% | 7.9 rooms, attack 57% | 4.6 rooms, attack 48% | 4.7 rooms, attack 44% |  |
| | Chain Lightning | +0.6 rooms, 19% of damage | +0.8 rooms, 20% of damage | +0.7 rooms, 25% of damage | +0.7 rooms, 26% of damage | 1.35x a strike (was 1.1x); one merged bolt |
| | Thunderclap | +0.4 rooms, 11% of damage | +1.4 rooms, 15% of damage | +0.3 rooms, 9% of damage | +0.0 rooms, 12% of damage | 1.9x (was 1.2x) |
| | Zeus Bolt | +0.5 rooms, 7% of damage | +1.5 rooms, 8% of damage | +0.8 rooms, 18% of damage | -0.1 rooms, 18% of damage | a strike 0.6x (was 0.45x) and a hard shove the way it flies (the designer's note); cooldown 14 to 12 |
| **Cleric** | (all on) | 8.7 rooms, attack 61% | 10.3 rooms, attack 60% | 6.4 rooms, attack 48% | 6.9 rooms, attack 45% | light orbs stop on a friend (the designer's note): the front line eats some of her shots |
| | Mending Ray | +2.2 rooms, 1% of damage, +0.9 healing/s | +1.6 rooms, +0.8 healing/s | +0.4 rooms, 1% of damage, +1.1 healing/s | +0.9 rooms, +0.9 healing/s | 12% / 16% over 4 s (was 14% / 18%): she was 1.5 rooms over the average at tier I |
| | Sanctuary | +1.3 rooms, 4% of damage, +0.6 healing/s | +2.5 rooms, 3% of damage, +0.9 healing/s | +1.6 rooms, 4% of damage, +0.8 healing/s | +2.0 rooms, 3% of damage, +0.7 healing/s | unchanged |
| | Smite | +0.9 rooms, 34% of damage | +1.5 rooms, 37% of damage | +0.0 rooms, 46% of damage | +1.2 rooms, 51% of damage | unchanged |
| **Bard** | (all on) | 5.3 rooms, attack 100% | 6.5 rooms, attack 100% | 4.8 rooms, attack 100% | 5.0 rooms, attack 100% | Rhythm also quickens allies' attacks by 8% |
| | War Song | -1.0 rooms | +0.3 rooms | +0.4 rooms, +0.3 healing/s | -0.0 rooms | +50% / +60% (was +40% / +50%), lasts 8 s (was 6), cooldown 14 to 12 (the last step after this table) |
| | Lullaby | -0.3 rooms | -1.2 rooms | +0.8 rooms, +0.6 healing/s | +0.4 rooms | unchanged |
| | Encore | +0.1 rooms | -0.4 rooms | +0.9 rooms, +1.2 healing/s | +0.3 rooms, +0.7 healing/s | cooldown 20 to 16 (after this table) |
| **Druid** | (all on) | 8.5 rooms, attack 81% | 7.7 rooms, attack 82% | 6.1 rooms, attack 56% | 6.5 rooms, attack 57% |  |
| | Entangle | -0.1 rooms | +0.1 rooms | +1.1 rooms | +2.2 rooms | unchanged |
| | Rejuvenate | +2.7 rooms, +1.4 healing/s | +0.9 rooms, +0.9 healing/s | +3.2 rooms, +1.8 healing/s | +3.8 rooms, +1.5 healing/s | 9% / 15% over 6 s (was 13% / 20%), cooldown 8 to 9: she was 2.1 rooms over the average at tier I |
| | Call Wolf | +0.6 rooms | +0.9 rooms | +2.4 rooms, +0.4 healing/s | +3.1 rooms, +0.7 healing/s | unchanged |
| **Necromancer** | (all on) | 8.9 rooms, attack 33% | 10.1 rooms, attack 33% | 6.1 rooms, attack 39% | 6.0 rooms, attack 40% |  |
| | Raise Dead | +1.5 rooms | +2.3 rooms | +1.7 rooms, +0.3 healing/s | +1.0 rooms | unchanged |
| | Life Drain | +1.1 rooms, 28% of damage, +0.7 healing/s | +1.7 rooms, 27% of damage, +0.5 healing/s | +2.1 rooms, 31% of damage, +1.6 healing/s | +1.8 rooms, 29% of damage, +1.5 healing/s | heals him 50% of what it takes and friends 25% (was 60% / 30%); the thin tendrils start once the ribbon lands (the designer's note) |
| | Bone Spear | +0.9 rooms, 22% of damage | +1.4 rooms, 23% of damage | +1.3 rooms, 17% of damage | -0.3 rooms, 17% of damage | unchanged |
| **Plague Doctor** | (all on) | 6.3 rooms, attack 62% | 8.2 rooms, attack 62% | 5.6 rooms, attack 50% | 5.4 rooms, attack 49% | unchanged |
| | Miasma | -0.2 rooms, 2% of damage | +0.6 rooms, 2% of damage | +0.7 rooms, 1% of damage | +0.0 rooms, 1% of damage | unchanged |
| | Cure | +0.6 rooms, +0.6 healing/s | +1.3 rooms, +0.4 healing/s | +0.9 rooms, +0.8 healing/s | +0.5 rooms, +0.9 healing/s | unchanged |
| | Gas Form | +0.2 rooms | +0.4 rooms | +1.4 rooms | -0.0 rooms | unchanged |

## The heroes, before and after
From the balance batches (`r13-before-*.txt`, `r13-after-*.txt`). "vs average" is rooms cleared against the average of
all 53 heroes; "blocked" is the part of what came at the hero that shields, armour and dodges kept off.

Tier I:

| hero | vs average before | after | share of party damage | taken | blocked | downs a run | damage/s |
|---|---|---|---|---|---|---|---|
| paladin | +1.17 | **+0.90** | 24% to 25% | 44% to 44% | 55% to 54% | 1.98 to 1.62 | 3.2 to 3.3 |
| tower | +0.11 | **+0.73** | 20% to 22% | 45% to 56% | 50% to 43% | 1.98 to 1.72 | 2.5 to 2.8 |
| archer | -0.48 | **-0.43** | 38% to 40% | 22% to 21% | 16% to 16% | 1.41 to 1.50 | 5.5 to 6.0 |
| twinfang | -1.00 | **-0.65** | 36% to 38% | 39% to 40% | 18% to 21% | 3.27 to 2.47 | 5.2 to 6.1 |
| wildmane | -0.88 | **-0.29** | 41% to 44% | 39% to 41% | 12% to 14% | 2.92 to 2.28 | 6.0 to 6.9 |
| berserker | -1.09 | **-1.49** | 35% to 39% | 36% to 38% | 1% to 4% | 3.39 to 2.54 | 4.7 to 5.3 |
| granny | -0.84 | **-0.85** | 40% to 41% | 36% to 38% | 4% to 3% | 2.20 to 2.56 | 5.7 to 5.8 |
| pyromancer | -0.06 | **-0.11** | 46% to 47% | 20% to 20% | 0% to 1% | 1.77 to 1.34 | 7.2 to 7.6 |
| frost | -0.54 | **-0.54** | 30% to 33% | 21% to 21% | 2% to 1% | 1.61 to 1.52 | 3.9 to 4.4 |
| storm | +0.12 | **+0.35** | 40% to 43% | 20% to 20% | 1% to 1% | 1.83 to 1.77 | 5.6 to 6.5 |
| cleric | +1.51 | **+0.73** | 14% to 13% | 22% to 21% | 1% to 1% | 1.95 to 1.57 | 1.6 to 1.5 |
| bard | -0.58 | **+0.23** | 21% to 22% | 23% to 23% | 1% to 1% | 1.82 to 1.56 | 2.7 to 2.9 |
| druid | +2.12 | **+0.34** | 20% to 21% | 24% to 25% | 2% to 1% | 1.29 to 1.37 | 2.5 to 2.6 |
| necromancer | +0.73 | **+0.94** | 40% to 38% | 36% to 34% | 0% to 0% | 1.25 to 1.22 | 5.5 to 5.4 |
| plague | +1.04 | **+1.63** | 32% to 30% | 22% to 22% | 4% to 6% | 1.24 to 1.60 | 4.4 to 4.3 |

Tier III:

| hero | vs average before | after | share of party damage | taken | blocked | downs a run | damage/s |
|---|---|---|---|---|---|---|---|
| paladin | +1.26 | **+1.04** | 23% to 22% | 42% to 41% | 59% to 60% | 2.63 to 2.47 | 5.0 to 4.9 |
| tower | -0.17 | **+0.26** | 24% to 26% | 43% to 51% | 54% to 45% | 2.19 to 1.54 | 4.1 to 4.7 |
| archer | -0.73 | **+0.35** | 40% to 44% | 20% to 19% | 21% to 20% | 1.46 to 1.27 | 8.7 to 11.2 |
| twinfang | -0.80 | **-0.55** | 37% to 43% | 37% to 39% | 22% to 29% | 2.93 to 2.37 | 8.7 to 10.8 |
| wildmane | -0.33 | **+0.44** | 45% to 48% | 45% to 49% | 23% to 28% | 2.16 to 1.89 | 10.8 to 12.1 |
| berserker | -0.96 | **+0.11** | 37% to 42% | 43% to 43% | 3% to 11% | 2.37 to 2.10 | 8.9 to 10.9 |
| granny | -0.23 | **-0.27** | 42% to 43% | 44% to 47% | 5% to 4% | 1.77 to 1.75 | 9.8 to 10.0 |
| pyromancer | -0.98 | **-0.90** | 48% to 47% | 19% to 19% | 2% to 2% | 1.59 to 1.78 | 12.2 to 12.1 |
| frost | +0.17 | **+0.26** | 29% to 31% | 21% to 20% | 2% to 2% | 1.49 to 1.60 | 6.4 to 7.2 |
| storm | -0.38 | **-0.22** | 40% to 42% | 19% to 19% | 4% to 1% | 1.49 to 1.59 | 8.7 to 9.2 |
| cleric | +0.89 | **+0.83** | 15% to 14% | 23% to 23% | 2% to 1% | 1.45 to 1.43 | 2.6 to 2.4 |
| bard | -0.62 | **+0.20** | 16% to 16% | 21% to 20% | 2% to 3% | 2.05 to 2.11 | 3.1 to 3.4 |
| druid | +0.34 | **+0.58** | 25% to 23% | 24% to 23% | 2% to 3% | 1.38 to 1.20 | 4.4 to 4.3 |
| necromancer | +1.20 | **+0.67** | 45% to 43% | 35% to 33% | 2% to 3% | 1.06 to 1.19 | 10.1 to 10.1 |
| plague | +0.05 | **+0.07** | 33% to 31% | 31% to 30% | 6% to 6% | 1.20 to 1.24 | 6.7 to 6.0 |

Role shares after (tier I / tier III): tanks 24% / 23% of their party's damage (before 25% / 23%), shooters 42% / 41%
(42% / 41%), supports 21% / 19% (21% / 20%), melee 38% / 40%, casters 35% / 36%, skirmishers 36% / 37%. Nobody among
the fifteen is more than 1.5 rooms from the average at tier III (the widest are the Paladin at +1.04 and the Pyromancer
at -0.90; before, the Paladin +1.26 and the Necromancer +1.20). At tier I the Plague Doctor reads +1.63 in the last
batch and the Berserker -1.49: the Plague Doctor was not touched and averages +0.9 over the round's five batches; the
Berserker averages -0.8 over the four batches since his changes (before: -1.09).

## The Archer
"Make the archers abilities stronger/ have more of the damage percentage."

| | tier I before | tier I after | tier III before | tier III after |
|---|---|---|---|---|
| bow | 75% | 67% | 60% | 46% |
| Barrage | 14% | 22% | 19% | 23% |
| burning (Barrage II's fire arrows) | - | - | 11% | 14% |
| Frost Arrow | 10% | 11% | 10% | 13% |
| Roll (caltrops) | - | - | - | 4% |
| **abilities in all** | **25%** | **33%** | **40%** | **54%** |
| her damage a second | 5.5 | 6.0 | 8.7 | 11.2 |
| rooms vs the average | -0.48 | -0.43 | -0.73 | +0.35 |

The bow is as it was. Barrage was only loosed at a crowd (its score was under the bar against one enemy): it goes at a
lone enemy too now, a little less often (cooldown 7 to 7.5) and a little softer an arrow (0.75x, was 0.8x). The Frost
Arrow hits 1.9x (was 1.2x) and its tier III burst hurts as well as chills. A first pass (arrows 0.95x, the Frost
Arrow 2.6x, a slower bow) put her abilities at 63% and her damage at 12.9 a second, level with the Marksman, the
hardest-hitting shooter: too much, so it came back to this. Among the ten shooters at tier III she is fourth by rooms
(+0.35; Huntress +1.02, Marksman +0.63, Falconer +0.43) and third by damage (11.2; Marksman 13.6, Huntress 11.7).

## The Tower and the Paladin
"Many heroes still seem weak compared to others like the tower vs paladin." And on tanks: "U can have tank heroes that
are more hp based (tanking hits) or protection/ shield based (negating hits)."

Why the Tower was weak. A blow of 14 (a Warren enemy) on the Paladin: his shield turns 35% from the front, his 6
armour takes most of the rest: 3.6 gets through (26%). On the Tower, 8 armour and no shield: 5.6 gets through (40%).
With 194 health against 162 the Tower's life was worth about three quarters of the Paladin's, and the Paladin also
heals (Consecrate), stuns (Shield Bash II) and takes blows for a friend (Guard). The Tower's Charge was a flat 18 that
neither his damage nor the web's Charge nodes changed, and its blows and Hold the Line's struck-back blows were counted
as the mace's, which is where "attack 85%" came from.

What changed: the Tower is the health tank. Health 310 (was 180), armour 5 (was 8), mace 12.5 (was 11). Charge is 2x
his blow and grows with his nodes; Ground Pound 1.2x (was 1x); Hold the Line taunts wider and those it holds hit 20%
softer; tier III staggers a little less (Charge 45, the second ring 20) because at tier III the Charge and Ground
Pound together knocked an enemy out every time they came round. The Paladin is untouched.

| | before | after |
|---|---|---|
| Tower, rooms vs the average, tier I / tier III | +0.11 / -0.17 | +0.73 / +0.26 (four batches: +0.35 to +1.47 / +0.22 to +1.07) |
| Paladin, rooms vs the average | +1.17 / +1.26 | +0.90 / +1.04 (four batches: +0.24 to +1.18 / +0.69 to +1.04) |
| Tower: share of the party's damage taken | 45% / 43% | 56% / 51% |
| Tower: blocked | 50% / 54% | 43% / 45% |
| Paladin: taken, blocked | 44% / 42%, 55% / 59% | 44% / 41%, 54% / 60% |
| Tower: where his damage comes from, tier III | mace 85%, Ground Pound 14% | mace 42%, Charge 29%, Ground Pound 17%, Hold the Line 10% |
| duel, one against one, health left (Tower minus Paladin), tiers 0 / 1 / 2 / 3 | -0.41 / -0.35 / -0.27 / -0.02 | -0.21 / -0.02 / +0.09 / +0.31 |
| the same duel, wins of 20 (Tower : Paladin) | 0:20 / 0:20 / 0:20 / 7:13 | 0:20 / 2:18 / 20:0 / 20:0 |
| each with an Archer and a Cleric, wins of 20, tier I / tier III | 13:7 / 1:19 | 11:9 / 8:12 |

The duel's win counts swing hard because two tanks fight almost the same fight every time: read the health left. Bare
(tier 0) the Paladin still wins with a fifth of his health left: his shield is a trait and works at once, and the Tower's
trait (Unmovable) does nothing in a duel. Fully built (tier 3) the Tower wins with a third left. In parties they are
level at tier I; at tier III the Paladin is about a third of a room ahead on average.

## What is still weak
- **The Berserker at tier I** (-0.8 on average, -1.49 in the last batch): he goes down 2.5 times a run, the most of the
  fifteen. At tier III he is level (+0.11, was -0.96).
- **Granny Reaper at tier I** (-0.85, was -0.84) and **the Pyromancer at tier III** (-0.90, was -0.98): neither moved.
  Burning is over 40% of the Pyromancer's damage at tier III; I did not find out why she falls behind there.
- **Twinfang** (-0.65 / -0.55; was -1.00 / -0.80): Dash read at or under zero switched off in all four columns; it now
  only goes in at an enemy busy with someone else, which the last batch includes but the on/off table does not.
- **The Bard's three songs** show no worth in rooms in the on/off runs (their effect is spread across her friends and
  under the noise); she herself went from -0.58 / -0.62 to +0.23 / +0.20.
- **Hold the Line, Guard, Old Bones, Gas Form, Miasma**: no measurable worth in rooms either way at this sample.
