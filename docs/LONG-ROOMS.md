# Long rooms (round 14, lane L)

The designer, on the two earlier answers (enemies withering when a room ran long; enemies hunting the party after
90 s): **"I said no. I said to fix the source not the symptom."** So nothing here reads how long a room has lasted.
This file is what was measured, what was found, what was changed and what is left for a decision.

## Method

`tools/runs.mjs --rooms <file>` logs every room with enemies: its **fight time** (walking in to the last enemy down,
or the wipe), the times its own enemies fell and its waves arrived, and for rooms past 100 s a snapshot every 5 s of
everyone standing (place, mode, target, health, what each side has taken and been healed, each hero's damage and
healing) plus the room's walls and rocks. `tools/room-log.mjs` does the logging; it reads the world and changes nothing.
`tools/long-rooms.mjs` plays the spread and reports:

- `--sweep`: the nine dungeons x eight parties x two levels, 4 runs each (576 runs, every run starting on floor 1):
  the starter four with the Cleric (`four`), no healer (Paladin, Archer, Twinfang, Pyromancer), two healers (Paladin,
  Cleric, Druid, Archer), all ranged (Archer, Pyromancer, Frost Mage, Marksman), all melee (Paladin, Wildmane,
  Berserker, Twinfang), and one hero left: a tank, a shooter or a healer alone (`soloTank`, `soloShot`, `soloHeal`).
  Levels: on-level (the middle of the level the round 12 campaign has in that dungeon) and under-levelled (70% of the
  level it arrives with).
- `--campaigns 1,2,3,4`: four 150-run campaigns from a fresh save (`runs.mjs --campaign 150`), the way the stuck
  examples in the brief were found. This is the closest thing to how the game is played.
- `--report --why`: the distribution of fight times per dungeon and party (median, 90th, 99th percentile, share over
  120 s and 240 s, rooms that reached the batch's 420 s "stuck" cut), the longest stretch without a kill, and each long
  room's cause. `--snap name` plays from a copy of the code taken at the start, so a batch never mixes two versions.

Words used below. A **stand-off** is a stretch of more than 45 s in which none of the room's own enemies fell and no
wave came in (called help, chain links and traps don't count). A **grind** is a long room whose kills kept coming: no
stand-off, or stand-offs short next to its length. The **long-room time** of a room is its fight time past 120 s; a
cause's share is its part of the total. Each long room was put to a cause by `long-rooms.mjs` (tests on its snapshots:
who was standing, who could hit whom, who was healing whom, who was trying to move and wasn't) and the biggest causes
were then watched unit by unit with `runs.mjs --watch run:room:every` before anything was changed.

## Before (0.18.0)

Plain rooms (not the floor's last room), fight time:

| | rooms | median | 90th | 99th | over 120 s | over 240 s | at the 420 s cut |
|---|---|---|---|---|---|---|---|
| sweep, all | 2474 | 69 s | 161 s | 304 s | 20.1% | 2.7% | 4 |
| campaigns, all | 2349 | 134 s | 255 s | 386 s | 55.4% | 13.0% | 14 |

Per dungeon (sweep / campaigns): median, 90th, share over 120 s, over 240 s.

| dungeon | sweep | campaigns |
|---|---|---|
| Wildwood | 45 s, 85 s, 2.7%, 0% | 64 s, 113 s, 8.2%, 0% |
| Warren | 57 s, 106 s, 7.2%, 0.6% | 86 s, 179 s, 24.4%, 3.7% |
| Sewers | 83 s, 171 s, 27.3%, 1.8% | 98 s, 161 s, 28.2%, 0.4% |
| Crypt | 67 s, 123 s, 10.5%, 0.4% | 93 s, 165 s, 29.6%, 3.9% |
| Frost Hollow | 69 s, 138 s, 16.8%, 0.3% | 105 s, 176 s, 41.3%, 2.5% |
| Ember Deep | 86 s, 155 s, 25.4%, 0.9% | 105 s, 170 s, 40.5%, 2.0% |
| Gilded Spire | 90 s, 170 s, 27.5%, 3.6% | 118 s, 220 s, 49.5%, 4.6% |
| Sunken Dunes | 104 s, 200 s, 38.0%, 5.4% | 174 s, 329 s, 76.6%, 23.8% |
| Foundry | 121 s, 271 s, 50.5%, 14.0% | 191 s, 284 s, 80.9%, 23.6% |

Bosses (the floor's last room): sweep median 47 s, 90th 103 s; campaigns median 92 s, 90th 136 s.

By party (sweep, on-level / under-levelled, share over 120 s): no healer 4.8% / 6.0%, all ranged 3.5% / 4.2%, all
melee 7.1% / 4.0%, the starter four with the Cleric 22.0% / 16.7%, two healers 39.1% / 43.1%, one hero alone 17-47%.

### What the long-room time was

| | long rooms | long-room time | in stand-offs | grind |
|---|---|---|---|---|
| sweep | 498 | 29,726 s | 17.7% | 82.3% |
| campaigns | 1301 | 108,685 s | 7.9% | 92.1% |

So most of it was not a stand-off. Rooms deep in the late dungeons **ground on**, kills coming every 10-20 s for three to
seven minutes, with a party that a healer kept out of danger. The campaign's Foundry rooms took a median 191 s (932 of its
2349 rooms: the campaign spends 50 runs there). What ate the clock there, by enemy-seconds from first hurt to death in
the long rooms: steel bees 22% (a normal one 22 s each, an elite 40 s), steel wasps and hornets 11%, foundry smiths and
automatons 12%; in the Dunes, golden scarabs 31% (43 s each: 478 health, no status sticks, a third of the time under
the sand). Seconds per kill on floor 1 of the same dungeon: no healer 3.2-3.6 s, one healer 5.0 s, two healers 6.7 s. A
healer keeps the party up and adds little damage: the Cleric dealt 4 a second next to the Archer's 20.

## The room clock that was still there

`dungeon.js`, after the wither rule went (round 13): with no kill for 25 s every enemy woke; with no kill for 45 s, or
150 s in a room that wasn't a boss's, `w.stale` was set, and every enemy ran 30% faster and stopped backing off, nothing
regrew or mended, nobody called help, dug in or slipped away, trolls dropped their boulders and turrets burnt themselves
out (4% of their health a second: a wither by another name). In boss rooms the 45 s part applied too, so the bosses'
own summons, hosts and welder drones stopped for the rest of most boss fights.

It is gone. What it had been covering for shows when it is taken out. With only the clock gone (the four and two-healer
parties on-level, the sweep's seeds): stand-off time 1,542 s -> 1,906 s, rooms at the 420 s cut 1 -> 3, Warren rooms over
240 s 1 -> 5. With the clock gone and the behaviour fixes below in, but not yet the numbers change (four campaigns): runs
at the cut 16 -> 47, Dunes rooms a median 174 s -> 227 s, its boss beaten 13-41 runs later, boss rooms a median 92 s ->
103 s. Most of what it hid was the grind: it sped the enemies of any room past 150 s, which no one room's numbers showed.

## Causes and fixes

Shares are of the long-room time before (campaigns / sweep). "Hidden" causes were covered by the clock and only
showed once it was out; their numbers are from those runs.

| cause | share before | evidence | fix (file) | what else it changes |
|---|---|---|---|---|
| **The grind deep down**: enemy health grows faster than the party's damage, and a healer keeps the party out of danger, so a late room can only end one way, slowly | 97% / 83% (grinds, plus the stand-offs that were one tough enemy being worn down) | Foundry rooms a median 191 s in the campaigns; steel bees 22 s each, golden scarabs 43 s, elite golems 145 s; s/kill doubles with two healers; the clock had been speeding up every room past 150 s | `dungeon.js` `HP_POW` 0.85 -> 0.75, `HIT_STEP` 0.05 -> 0.09: one more step of round 8's "late fights are dangerous, not long". The floors' last foes keep 0.85 / 0.05: with the step, the Winter Queen's bench fell from 9 wins in 20 to 5 and Cinder's from 10 to 5 | Every enemy from the Warren on but the floors' mini-bosses and bosses, and the wagon's foes too: health 7% lower at strength 2, 13% at 4, 19% at 7.8 (the Foundry's floor 3); blows 4%, 10%, 20% harder. A fight costs a party about the same (health x damage within 4%), in less time. Battle mode's foes (`battleFoe`) the same |
| **A helper held on its way to a revive** | 0.6% / 1% (and hidden: the worst single stand-offs) | campaign s1 run 120 (346 s: the Cleric held on her way to a downed friend for most of it, not fighting, a smith and a major steel wasp coming for her); the sweep's Foundry room where an Archer stood 90 s between a downed friend and a gear, because a saw blade on its rail flipped the "threat" test every tick | `dungeon.js` `revive`: traps don't count as threats; a shooter (not a boss) that has the helper in its sights and in reach does; once kept away a helper stays away 2 s; no closer for 4 s gives that friend up for 8 s; a helper doesn't swap between two downed friends | Fewer revives while a shooter has the helper in reach (a wasp circling it); the downed lie a little longer in busy rooms |
| **A unit that can't get at its target keeps trying** | hidden | campaign s3 run 34 (243 s): a major rock troll too big for the gap between a crate and a wall, its boulder held in front plugging that gap, the Paladin and Twinfang pushing into each other behind it, the Archer standing with no line of sight | `sim.js` `reachCheck`: no nearer and unable to hit it for 6 s, the target counts as out of reach for 8 s and another is picked (with only one left it keeps at it) | Any unit, either side; a knight stops running after a bee it can't catch while another enemy stands |
| **A shooter with no line of sight stands still** | hidden | the same room: a ranged hero in "approach" stops once within 60% of its range, line or no line | `sim.js` approach: close in with a rock, a boulder or a corner in the way, it steps round to find a line | Shooters drift sideways round obstacles instead of waiting |
| **The troll never let its boulder go** | hidden | the troll's "let it go" waits for a tell that nothing ran (`beginHold` with no `hold`), so the boulder stayed in front of it for good; a hero pressed on it could never get at the troll; only the clock (dropping the boulder) ended those fights | `foes9.js` `boulderBrain` runs its hold; a troll that gets nowhere for 3 s (wedged, or walking after a boulder it can't reach) lets it be and fights bare-handed 6 s | Trolls now roll their boulders at the party as designed (heavy knockback and stagger): Warren fights hit harder |
| **Gears chased by fighters who never catch them** | 0% / 4.7% (one hero left) | a lone Paladin after cog sprites at 276 speed for minutes; a gear rattling between a rock and a wall | `sim.js` approach: a fighter heads for the point on a gear's way nearest to it and waits there (if the gear will really get there), or stands while it rolls off into open floor | Fighters stand in a gear's path; only gears (`def.pass`) |
| **An enemy healer out-heals the damage** | 0.1% / 0.5% (hidden: 396 s) | a lone Archer against an elite choir sprite healing itself 4% a second | `sim.js`: heroes go for whoever mends the others first (`def.mends`: the choir sprite, the light spirit, the repair drone; an elite orc shaman); `foes10.js`: the choir's song mends the others, not itself | Healers die first more often; the choir sprite can be worn down alone |
| **Shooting into the gilded golem's mirror** | 0.1% / 0.1% (hidden: 346 s) | a two-healer party round an elite gilded golem for six minutes, every shot from its front coming back | `sim.js`: a shooter in its front arc while it faces someone else goes round to its side and holds its shots into its face | Only for `def.mirror` enemies; a lone shooter it faces still fires (and its shots still come back) |
| **The bosses' adds were switched off by the clock** (a consequence of taking it out, not a cause of long rooms) | | the clock reached every boss fight 45 s in (no room enemy falls in a boss's own hall) and stopped its adds: the Ooze's Brood, the angel's Host, the Wurm's Brood, the Engine's welders, the Chieftain's calls. Benched without it (the starter four at the level the campaign meets each, 20 fights): the Ooze 7 -> 3 wins, the angel 12 -> 7, the Wurm 9 -> 0 | `boss-angel.js` Host every 45 s (30); `boss-ooze.js` Brood every 16 s, three at most (12 s, five); `boss-wurm.js` Brood one scarab at a time at 30% health (two a hole, five at full) | The angel's fight as lane B measured it (12 wins in 20), the Ooze's a little easier (12 against 7), the Wurm still much harder (3 against 9: see "Not fixed") |
| **Kiting a chaser** | 0.8% / 1.7% | a Cleric backing off a smith while the others fall | not changed: it resolves (the chaser is slower, the kiter shoots), and the grind fix shortens it | |
| **One hero left who can neither win nor lose** | 1.1% / 9% (all from the lone-hero parties) | a lone Cleric against gears or bees she can't hit and that can't out-hurt her healing | not fixed: a decision (below) | |


## After (the fixes, merged with 0.19.0; the same seeds and parties)

(0.19.0's hero changes don't touch the starter four: main's own seed-2 campaign is the same run for run as 0.18.0's.)

| | rooms | median | 90th | 99th | over 120 s | over 240 s | at the 420 s cut |
|---|---|---|---|---|---|---|---|
| sweep, all | 2453 (2474) | 62 s (69) | 142 s (161) | 306 s (304) | 15.0% (20.1%) | 1.9% (2.7%) | 6 (4) |
| campaigns, all | 2147 (2349) | 110 s (134) | 225 s (255) | 348 s (386) | 45.2% (55.4%) | 8.2% (13.0%) | 6 (14) |

Per dungeon (sweep / campaigns): median, 90th, share over 120 s, over 240 s (before in the table above).

| dungeon | sweep | campaigns |
|---|---|---|
| Wildwood | 43 s, 81 s, 2.8%, 0.2% | 69 s, 107 s, 6.0%, 0% |
| Warren | 57 s, 115 s, 8.4%, 0.8% | 99 s, 161 s, 30.9%, 2.2% |
| Sewers | 71 s, 147 s, 18.2%, 0.7% | 91 s, 157 s, 25.2%, 1.6% |
| Crypt | 60 s, 103 s, 4.2%, 0% | 79 s, 146 s, 18.3%, 0.6% |
| Frost Hollow | 59 s, 116 s, 9.4%, 0.7% | 84 s, 164 s, 22.7%, 2.5% |
| Ember Deep | 73 s, 143 s, 17.2%, 1.5% | 90 s, 155 s, 21.0%, 1.0% |
| Gilded Spire | 72 s, 151 s, 18.6%, 1.1% | 97 s, 206 s, 33.7%, 6.8% |
| Sunken Dunes | 88 s, 186 s, 33.1%, 5.0% | 165 s, 304 s, 69.4%, 21.7% |
| Foundry | 106 s, 238 s, 42.9%, 9.8% | 173 s, 261 s, 79.8%, 16.0% |

- **Long-room time**: sweep 29,726 s -> 21,440 s (-28%), campaigns 108,685 s -> 68,701 s (-37%); long rooms 498 -> 368
  and 1301 -> 970. Runs that hit the 420 s cut in the four campaigns 16 -> 8.
- **By party** (sweep, over 120 s, on-level / under): the four 22.0% / 16.7% -> 18.3% / 9.9%; two healers 39.1% / 43.1%
  -> 29.3% / 28.9%; no healer, all ranged, all melee 1.5-5% as before.
- **The stand-offs that are gone from the long rooms**: helpers held on a revive, wedged trolls and the boulder that
  never left, shooters standing with no line, the self-healing choir. Still there: one hero alone (four of the sweep's
  six rooms at the cut are a Cleric alone; the other two a deep Dunes golem and a Foundry steel-bee room with two heroes
  left), and the gilded golem (both of seed 2's stuck runs: a golem at 10% in a corner with the Paladin made radiant and
  the Cleric kiting, and a Cleric alone against one; the mirror fix only helps shooters while it faces someone else).
- **Bosses**: sweep median 47 s -> 44 s; campaigns median 92 s -> 88 s, 90th 136 s -> 154 s (their adds run the whole
  fight now). Benches, 20 fights each at the level the campaign meets the boss, 0.19.0 / now: Wildwood 20 / 20, Warren
  19 / 18, Sewers 7 / 12, Crypt 18 / 17, Frost 9 / 13, Ember 10 / 9, Spire 12 / 12, Dunes 9 / 3, Foundry 8 / 8.
- **The campaigns' pace**: the last boss (the Foundry's) fell at runs 89, 114, 98, 95 (before 95, 86, 104, 85); runs
  spent in the Dunes 6, 9, 18, 7 (before 21, 5, 19, 12). Seed 2 is slower in the middle (the Spire took 28 runs, before
  10), seeds 1 and 3 faster.

What is left in the long-room time is still the grind: 94% of it in the campaigns (85% steady, 9% one tough enemy worn
down). Room by room, the long rooms left are deep Foundry and Dunes rooms with a healer in the party (steel bees still
28% of the clock there: 19 s each, an elite 34 s), and a hero alone who can neither win nor lose.

## Regression checks

Main moved twice while this ran, so the checks were run on both merges: main 0.19.0 against the branch merged with it,
and again main 0.20.0 (lanes S, W and U) against the final merge. 12 runs a dungeon: noise is about 2 in 12.

| check | main 0.19.0 / branch | main 0.20.0 / final |
|---|---|---|
| the four at level 30, wins in 12 | Wildwood 12 / 12, Crypt 0 / 1, Sewers 1 / 2, Warren 11 / 9, the rest 0 / 0 | Wildwood 12 / 12, Crypt 1 / 0, **Sewers 4 / 1**, Warren 11 / 12, the rest 0 / 0 |
| the four at level 50 | Crypt 3 / 5, Sewers 12 / 12, Warren 12 / 12, Frost 9 / 7, **Ember 6 / 2**, Spire 1 / 1, Dunes 0 / 0, Foundry 2 / 0 | Crypt 4 / 3, Sewers 11 / 11, Warren 12 / 12, Frost 10 / 8, Ember 3 / 4, Spire 1 / 0, Dunes 1 / 0, Foundry 0 / 0 |
| `battles.mjs` (521) | 0 problems; 7 / 6 ran out of time | 0 problems; 6 / 9 ran out of time |
| `convoys.mjs --n 6 --level 4` | 6 delivered / 6, 0 errors, 0 stuck | 3 delivered, 2 parties fell / 5 delivered, none fell; 0 errors, 0 stuck |
| `preview-check.mjs` | 2102 previews, 0 never fired, 0 left out | the same |
| `runs.mjs --campaign 150 --seed 2 --v` | 4 / 2 stuck runs | 6 / 5 stuck runs |

- Beyond noise: Ember at level 50 on 0.19.0 (6 -> 2) is gone on 0.20.0 (3 -> 4); the Sewers at level 30 on 0.20.0
  (4 -> 1) was 1 -> 2 on 0.19.0. Both sit on the edge of what 12 runs can tell apart; neither repeats.
- Battles: gone, the yeti elites against a major and Wildmane and a Cleric against three gears; new, three rock trolls
  against a Paladin and an Archer (trolls roll their boulders now) and, on 0.20.0, three yetis or three smiths against a
  hero pair: close fights that run long on main too (three yetis against the Paladin and the Archer: 155 s a fight on
  main, 208 s here, one of six reaching the limit on each). The crab, leech and choir mirror fights can't end by
  themselves on either.
- The seed-2 campaign, bosses at runs (Wildwood, Warren, Sewers, Crypt, Frost, Ember, Spire, Dunes, Foundry):
  - 0.18.0 / 0.19.0 main (the same run): 4, 9, 30, 57, 59, 67, 77, 82, 86; 4 stuck runs; 1516 sim minutes.
  - branch on 0.19.0: 5, 15, 37, 62, 65, 70, 98, 107, 114; 2 stuck runs (both the gilded golem); 1202 sim minutes.
  - 0.20.0 main: 4, 15, 20, 23, 37, 49, 54, 56, 80; 6 stuck runs (all Foundry floor 3, steel bees, wasps and hornets);
    1776 sim minutes.
  - final: 5, 13, 22, 42, 45, 56, 67, 86, 90; 5 stuck runs (an elite troll in the Warren, a ward spirit in the Spire,
    golden scarabs in the Dunes twice, hornets in the Foundry); 1482 sim minutes (-17%).
  0.20.0 made main's campaign much faster in the middle (the Crypt's boss at run 23, not 57); on that base this branch
  reaches each boss later, by 6 to 30 runs, while on 0.19.0 four seeds came out as fast as before on average. One seed
  can't settle it: a four-seed campaign on 0.20.0 is the next measurement to make.
- This seed's Warren took 5 runs (0.19.0) or 11 (0.20.0) before, and 10 or 8 now: not the 62 of the brief's earlier
  version of the game.

## Not fixed, and why

- **One hero left who can neither win nor lose: a decision, not a fix.** A Cleric alone against gears she can't hit
  (her orbs are slower than they are) or bees she heals through, a Paladin alone against a wasp that circles out of his
  reach: nothing is broken, the numbers just don't let either side win. In the sweep this is most of what is still stuck
  (4 of the 6 rooms at the cut are a Cleric alone). Ways it could go, none built (each is a new rule): (a) as now: the
  room ends when one side breaks, and the player can tap Leave; (b) a hero left alone that has neither hurt nor been hurt by what is
  left for a while walks out, as if Leave were tapped at the end of the room (20% of the run's gold); (c) a lone healer
  heals herself less. My pick would be (a), with (b) if the designer sees it happen and dislikes it.
- **The grind that is left** is the two-healer party deep down (29% of its rooms over 120 s, from 39-43%) and the
  Foundry (43% over 120 s in the sweep, 9.8% over 240 s; 80% and 16% in the campaigns). Two more levers were
  measured on the four and two-healer parties at their level and not taken, because each moves how hard the late dungeons are, which is the designer's to pick:
  - **Enemy armour stops growing at 1.5x** (`armour.js` grows it with the square root of the dungeon's strength, so deep
    down every hero blow sits at the 60% cap: a steel bee's 4 is 10.7 on the Foundry's floor 3; the stated aim was that
    it "still matters deep down without becoming a wall"). Measured on its own: Foundry rooms over 240 s 19.1% -> 6.7%,
    long-room time -17%, but more of the late dungeons beaten.
  - **A healer's share of the damage.** The Cleric's orbs are three small blows, and small blows are what armour eats.
  The step that was taken (health to damage) measured on the same parties: long-room time -46%, rooms over 240 s 5.6%
  -> 1.8%, rooms reached 773 -> 768 (as hard as before, in less time).
- **The Sand Wurm is harder than lane B measured it.** Its whole phase 2 is the Brood (scarabs out of each hole it
  leaves), and the old clock had switched the Brood off 45 s into every fight, before phase 2 began. With the Brood as
  built the bench wins 0 of 20 (9 under the clock, 8 with no Brood at all); one scarab at a time at 30% health, as now, 3;
  one at 15%, 2. The scarabs' strength is not what makes the difference, so a number here won't settle it; lane B, who
  built the fight, should look at what the Brood does to the party. With the Brood as built the campaigns spent 31-55
  runs in the Dunes (before: 5-21); with it lightened, 6-18.
- **Big units in narrow gaps.** The paths keep 46 from walls, wide enough for any hero; a major troll's body is 92 from
  its middle to its edge. It still tries gaps it can't fit; `reachCheck` and the troll's letting go of its boulder end those now, but a
  path for its own size is the real fix (a second grid). Not done.
- **Battle mode keeps its own clock** (`battle.js`: everyone presses in after 75 s, and at 240 s whoever has more health
  left wins). It is the battle page's rule for setups that can't end (two Clerics against two Clerics), not a room's.
  Measured without the 75 s part: 25 of 521 bench battles reach the 240 s judge instead of 9. Left as it is; the lead's
  call whether the battle page should lose it too.
- **The wagon keeps its own clock** (`convoy.js`: at the end gate the foes press in after 40 s and lose 3% of their
  health a second after 70 s). That is the wither rule in the wagon. Lane W is rebuilding the wagon this round, so it is
  reported here, not changed (changing it in this lane would clash with theirs).


## The headless Edge the recording tools left running

The pid `spawn(msedge)` returns is a launcher that hands over to another process and exits, so `taskkill /PID` on it
found nothing and every recording left a headless Edge behind. `tools/edge.mjs` is one helper for all of them:
`openEdge()` starts Edge on its own `delve-edge-XXXXXX` profile in the temp folder; `close()` sends `Browser.close` over
CDP, then stops only the processes whose command line carries that folder (other tools' and the user's Edge are left
alone), then removes the folder; the same clean-up runs if the tool throws or is stopped. The 17 tools that launched
Edge use it (`shot`, `clip`, `labshot`, `showcase`, `status-clip`, `stats-shots`, `hud-shots`, `env-shots`,
`book-shots`, `camp-shots`, `camp-perf`, `battle-shots`, `convoy-shots`, `prop-board`, `sound-render`, `sound-smoke`,
`test/trinkets`), and since the merges lane I's `design/icons-r14/render.mjs` and lanes W's and U's new `edge-shots` and
`unit-shots` (lane W had added the profile-folder kill to `clip`, `convoy-shots` and `edge-shots` on its own; it now goes
through the helper, as does `clip`'s give-up timer). Checked: one page open, 16 processes on its
profile; after `close()` none, and the folder gone; a tool that threw after opening left none either.

