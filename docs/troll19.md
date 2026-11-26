# Troll-shaped units: round the boulder, and a solid boulder (round 19, lane troll19)

The designer, round 19, chat: "get a fable agent to fix the troll shaped units. The troll should rotate more around the
boulder when turning. Many times the boulder just pushes entities through walls and stuff as it supposedly doesnt get
pushed back when being held."

And later in the round: "For the troll. Things that are touching the boulder almost get glued to it, in front. Like if
he rolls the bolder into someone it kind of holds the target in front."

## What was asked, and where to see it

- **"The troll should rotate more around the boulder when turning."** It walks round the boulder now; the boulder
  shifts about its own width (it used to swing right round the troll). As quick as before. `after-turn180-troll.mp4`
  0:00-0:01 against `before-turn180-troll.mp4` 0:00-0:01; rock troll `after-turn180-rocktroll.mp4` 0:00-0:01.
- **"Many times the boulder just pushes entities through walls and stuff as it supposedly doesnt get pushed back when
  being held."** The boulder is a solid body: walls, rocks and the room's edge stop it, bodies push back on it by their
  weight, a stopped boulder stops the troll. In every test, nobody ends up in a wall or outside the room any more (5,464
  times before, 0 after). `after-corner-rocktroll.mp4` 0:02 on against `before-corner-rocktroll.mp4` 0:02-0:03;
  `after-door-troll.mp4` against `before-door-troll.mp4` from 0:02.
- **"Things that are touching the boulder almost get glued to it, in front. Like if he rolls the bolder into someone it
  kind of holds the target in front."** The troll stops pushing when the boulder reaches its target and bowls it into
  them; anyone else in the boulder's way slips off to the side. `after-push-troll.mp4` 0:01-0:05 against
  `before-push-troll.mp4` 0:01-0:05 (walked out of the picture on the boulder's front).
- **"the troll shaped units"**: troll, rock troll and yeti, their elites and majors, wherever they turn up (below).

## Who is troll-shaped

- **Troll** (js/enemies.js; the Warren's third floor, its elite room; its boulder has health and breaks), **Rock Troll**
  (js/foes9.js; the same floor; its boulder can't be hurt, and it charges behind it). Elite troll (also lobs a rock: a
  shot, not this boulder), elite rock troll (calls its boulder back, a boulder 25% bigger), majors of both (bigger
  again, with a quake).
- **Yeti** (js/foes10.js; Frost Hollow's third floor and elite room; a snowball it packs itself), its elite (a bigger
  ball that bursts into ice) and major.
- No other kind pushes a boulder: `boulderBrain` is the two trolls', the snowball code the yeti's.
- They are the same code everywhere they turn up: dungeon rooms, battle mode, the Book's previews (the same sim on a
  small stage) and the wagon mode.

## Problems found (before anything was changed)

Found by staging (tools/troll19/stage.js), filming and counting (tools/troll19/walls.mjs, turns.mjs, glue.mjs). The
"before" numbers and clips are from a copy of the tree as it was (commit ac21d0c).

1. **A boulder threw whoever it reached out of itself, on the far side, whatever stood there.** The sim treats every
   round obstacle as a rock: a body overlapping one is put outside it at once (sim.js physics). Right for a rock, which
   never moves. A boulder in a troll's fists was set in front of the troll every step, so whoever it reached was put
   beyond it: into a wall, past the end of a thin one, out of the room. Staged, a hero with his back to something
   (504 runs): out of the room 274 times, more than a third of his body inside a wall 449
   times. In walled battle rooms (648 fights): a body's middle inside a wall 667 times, outside the
   room 3,985 times. In dungeon rooms (36 runs): 192 and 346.
   `before-corner-rocktroll.mp4` 0:02-0:03 (the paladin is outside the room's corner), `before-wall-troll.mp4`,
   `before-thin-troll.mp4`.
2. **The held boulder itself went into anything.** It was placed 78 in front of the troll's middle with nothing
   asked, 65 past the troll's own body: into walls, rocks, crates, the room's edge, and through a doorway too narrow
   for it. A boulder's middle inside a wall 6,120 times in the battle rooms, outside the room
   1,279 times. `before-door-troll.mp4` from 0:02 (the boulder sits in the wall's ends and reaches the
   hero behind the doorway), `before-pillar-rocktroll-elite.mp4`.
3. **Nothing pushed back.** The boulder was as heavy as the world: a troll walked on at full pace with a hero, three
   heroes or a boss in front of it; a hero walking into it did nothing.
4. **It turned like a car, the boulder swinging round the troll.** The troll stood and the boulder swept round it at
   up to 2.6 rad a second (its far edge at 300 a second), through walls and people. For a half turn the troll's feet
   went 66 and the boulder 310. `before-turn180-troll.mp4` 0:00-0:01,
   `before-turn90-troll.mp4`, `before-turn135-rocktroll.mp4`, `before-turn180-rocktroll.mp4`.
5. **A body square in its way rode on its front** (the designer's second note). A push straight out of a round thing
   leaves whoever is in its way in its way, so a hero was walked across the room on the boulder's front, and the troll
   kept pushing. Staged (a hero standing still in its way, 10 s): carried 4.9 s and 540
   far by a troll, 6.7 s and 1,052 by an elite rock troll. In fights: 26 to
   48 seconds of every minute somebody was being carried. `before-push-troll.mp4`,
   `before-turn180-troll.mp4` 0:02-0:06.
6. **The boulder let go (the roll) had the same faults**: a body between it and a wall was put into the wall; walls
   were tested as square boxes, so it stopped short of corners it should have rolled past.
7. **The rock troll's charge**: the boulder was placed ahead of the running troll each step, tested only by a line 6
   ahead of its edge: through wall corners, rocks and crates.
8. **The elite rock troll's called-back boulder**: the same roll, the same faults.
9. **A new boulder** (the first one, and one torn out of the floor) was made in front of the troll whatever was there.
10. **The yeti's snowball** was set against its hands every step with nothing asked, and threw bodies out of itself the
    same way: a hero in a corner was out of the room in 12 of 12 staged runs; `before-yeti-corner.mp4` from 0:01. A
    ball being packed grew into walls and people. (Its turning was already right: since round 13 the yeti walks round
    its ball; `before-yeti-turn180.mp4`.)
11. **The troll's own friends** were thrown through walls by its boulder like anyone else.
12. **A stunned troll's rolling boulder stopped dead** in mid-roll (it was only rolled from the troll's own brain;
    read in the code, not filmed).
13. **A troll's own bulk did it too**, and so did any big body: a body shoving a lighter one, or a rock throwing a
    body out of itself, could leave it inside a wall (sim-wide). In the battle rooms, with no boulder near, a body was
    more than a third inside a wall on 21,449 steps before (110 after).
14. **The wagon mode crashed with a yeti on the road**: the first time its ball had no straight way the game threw
    "Cannot read properties of undefined (reading 'cargo')" (the way round the wagon asked for a unit's kind, and was
    handed the ball). Found by the wagon test; in main today.

## What was done

- **js/boulders.js (new file, the game loads it)**: a boulder or snowball is no longer a rock to the sim. Once a
  step, after the bodies have moved (`ballPass`):
  - in its owner's hands it is **on a rod**: the owner walking into it pushes it along the line from the owner's
    middle through its own; a troll walking away drags it (two fists); nothing else moves it sideways;
  - it is **solid**: pushed out of the room's edge, walls, crates and rocks, and moved in short steps so it cannot be
    carried through a wall or its corner; one pushed into a slot too narrow for it goes back to where it last fitted;
  - **bodies and the boulder push each other by their masses** (a troll with its boulder is about 11, a paladin 2.8,
    the wagon's parts are fixed): a paladin walking against it slows it by a fifth, a heavy enough body stalls it;
  - **a body with its back to a wall stops the boulder**: after the push the body is put out of the walls again, and
    whatever is then still inside the boulder, the boulder gives back; a stopped boulder stops the troll (it is kept
    at the rod's length from it, never inside it);
  - **nobody rides on its front**: a body square in a moving boulder's way slips off round its face to the side it is
    already on (about a second for a pushed boulder, a blink for a rolling one), along the wall if it is against one;
  - a rolling boulder stopped by somebody who could not get out of its way strikes them and bounces off, as off a wall.
- **js/foes9.js, the troll** (`carry`, `rodWalk`, CARRY): with the boulder in its fists it wants the boulder to go at
  its mark. Near that line it pushes; off it, it **walks round the boulder** to the far side (2.4 times its walking
  pace; the rock troll 1.9), its face to the boulder, and heaves the boulder a little the other way as it goes: the two
  turn about a point three tenths of the way from the boulder's middle to the troll's (it was the troll's own middle).
  Where its body has no room to walk round, it goes the long way; where it has room neither way, it stands and heaves
  the boulder round itself (the old turn, with a solid boulder); with no room for that, it pushes on or drags the
  boulder back out until it can turn.
  - With the boulder up against its mark **it stops pushing** and lets the boulder go into them (the point-blank
    roll), instead of walking them across the room.
  - The tell before a throw or a charge: it steps round behind the boulder onto the line shown on the floor.
  - A new boulder is put down from the troll's own middle outwards, as far as there is room.
  - The roll tests the boulder's true round shape, rolls along a wall it only grazes, and goes on while its troll is
    stunned.
  - Not stuck: out of its fists when it is knocked away from it; squeezed (no room for the two where they are) it lets
    go and steps off; a boulder it can do nothing with for 3 s is set down or thrown (round 14's rule), and wedged
    three times in one spot it crumbles and a new one is torn up (round 17's rule). A mark just past a gap too narrow
    for the boulder no longer counts as "at the boulder".
- **js/foes10.js, the yeti**: its hands push the ball through the same solid pass (it was set against them); the ball
  being packed is put down from its own middle outwards; a ball stopped dead by a pinned hero still strikes him. Its
  walk round the ball, its haul and its heave are as they were.
- **js/sim.js**: boulders and snowballs left out of the rock rule and handed to `ballPass`; a body thrown out of a
  rock, or shoved by another body, is put out of the walls again in the same step; a troll carrying walks and faces by
  `carry` (`u.carryAt`); `speedOf` exported.
- The wagon-mode crash (14) is fixed for the yeti's ball and never arises for the troll's.

## Numbers

Same seeds before and after. "Times" are separate spells of it; a step is a sixtieth of a second.

**Walls (tools/troll19/walls.mjs; before.txt / after.txt).** 504 staged runs (six kinds, seven scenes, 12 seeds: a
rooted hero against the room's edge, in a corner, against a thin wall, a rock, a crate's corner, behind a doorway, and
a friend of the troll's against the edge), 648 battle-mode fights in rooms with four thin walls put in (each kind
plain, elite and major, one and three of it, three parties), 36 dungeon runs with only these kinds in the rooms.

| by a boulder or snowball | staged, before | after | battle rooms, before | after | dungeon rooms, before | after |
|---|---|---|---|---|---|---|
| a body's middle inside a wall | 0 | 0 | 667 times | **0** | 192 | **0** |
| a body's middle outside the room | 274 | **0** | 3,985 | **0** | 346 | **0** |
| a body more than a third inside a wall | 449 | **0** | 10,896 | **0** | 746 | **0** |
| the boulder's middle inside a wall | 57 | **0** | 6,120 | **0** | 277 | **0** |
| the boulder's middle outside the room | 0 | 0 | 1,279 | **0** | 56 | **0** |
| the boulder more than 8 into a wall | 323 | **0** | 16,022 | 1 (one step) | 1,160 | **0** |
| the boulder more than 8 into a rock | 32 | **0** | 2,135 | 7 (8 steps) | 450 | **0** |
| a body more than 14 inside a boulder | 71 | **0** | 2,598 | 134 (13 steps each) | 177 | 2 (a step each) |
| the troll more than 14 inside its own boulder | 1 | **0** | 1,202 | 247 (10 steps each) | 79 | 3 |
| stuck 15 s (not moved 50, hurt, struck, hurt its mark or thrown) | 0 | 0 | 28 (28,020 steps) | 18 (13,835 steps) | 2 | 1 |

- Staged runs with any fault: 368 of 504 before, 0 after. The boulder up in the doorway too narrow for it: 48 of 48
  troll runs before, 0 after.
- Away from any boulder (the sim-wide part, problem 13): a body's middle inside a wall on 802 steps in the battle rooms
  and 3,133 in the dungeon rooms before, 0 and 19 after (the 19: once, a Twinfang mid-thrust at a troll by a wall, the
  nearest boulder 117 away: its own lunge, not looked into); outside the room 7,069 and 5,809 steps before, 0 and 0
  after.
- The wagon mode (8 trips, a troll, a rock troll and a yeti put beside the wagon every 25 s): before, every trip ended
  in the error of problem 14; after, no error and none of the faults above.

**The turn (tools/troll19/turns.mjs).** A hero put off to its side or behind it on open floor; until the boulder is on
the line to him. Feet = how far the troll walked, boulder = how far the boulder went.

| | before: time, feet, boulder | after: time, feet, boulder |
|---|---|---|
| troll, a quarter turn | 0.6 s, 25, 132 | 0.7 s, 84, 45 |
| troll, three eighths | 0.9 s, 57, 268 | 0.9 s, 129, 75 |
| troll, a half turn | 1.1 s, 66, 310 | 1.1 s, 173, 105 |
| rock troll, a quarter | 0.8 s, 45, 146 | 0.7 s, 82, 39 |
| rock troll, three eighths | 1.7 s, 97, 306 | 0.9 s, 122, 58 |
| rock troll, a half | 1.9 s, 113, 357 | 1.2 s, 162, 77 |
| elite rock troll, a half | 1.9 s, 161, 503 | 1.3 s, 234, 142 |
| yeti, a half (it already walked round) | 2.6 s, 226, 0 | 2.6 s, 223, 5 |

The troll turns as fast as it did; the rock troll a little faster than it did (see the calls).

**Carried on the boulder's front (tools/troll19/glue.mjs).**

| | a hero standing still in its way, 10 s: before | after | fights, seconds carried a minute: before | after | longest stretch in a fight (median fight): before | after |
|---|---|---|---|---|---|---|
| troll | 4.9 s, 540 far | 0.4 s, 43 | 26.1 | 2.4 | 1.3 s | 0.4 s |
| rock troll | 5.2 s, 555 | 0.5 s, 59 | 34.4 | 2.8 | 2.7 s | 0.4 s |
| elite rock troll | 6.7 s, 1,052 | 0.7 s, 88 | 48.5 | 5.9 | 4.6 s | 1.0 s |
| yeti | 1.2 s, 175 | 0.4 s, 52 | 1.8 | 1.0 | 0.6 s | 0.3 s |

The worst single stretch anywhere in those fights: 5.8 s before, 2.0 s after.

**Strength (tools/troll19/winrate.mjs).** Plain battle rooms, no staging: each kind, one, two and three of it, against
three hero parties (levels 5 / 9 / 14 for plain / elite / major), 180 fights a kind.

| the trolls' side won | before | after | a fight lasted, before | after |
|---|---|---|---|---|
| troll | 17 (9%) | 14 (8%) | 90 s | 70 s |
| rock troll | 13 (7%) | 12 (7%) | 124 s | 93 s |
| yeti | 88 (49%) | 79 (44%) | 59 s | 61 s |
| elite troll | 115 (64%) | 112 (62%) | 95 s | 72 s |
| elite rock troll | 95 (53%) | 103 (57%) | 169 s | 133 s |
| elite yeti | 163 (91%) | 164 (91%) | 50 s | 50 s |
| major troll | 136 (76%) | 133 (74%) | 83 s | 71 s |
| major rock troll | 120 (67%) | 117 (65%) | 154 s | 122 s |
| major yeti | 172 (96%) | 173 (96%) | 50 s | 44 s |
| all | 919 of 1,620 (56.7%) | 907 (56.0%) | | |

**Who wins did not move** (the biggest shift is the yeti's, 49% to 44%). **Fights against trolls are a fifth to a
quarter shorter**: both sides land more (tools/troll19/dps.mjs, three trolls against a paladin and an archer: the
heroes' damage a second 13.1 to 19.4, the trolls' 2.6 to 4.3; three rock trolls: 5.3 to 9.3 and 2.1 to 3.2). The
boulder no longer walks melee heroes away from the troll, so they hit it more; the troll's fists land more for the same
reason, and it spends more of its time bare-handed (its boulder lying loose 22% of the time, was 10%). It lets the
boulder go at speed less often than it did (5.3 times a minute, was 7.8; rock troll 4.1, was 6.7).

**Getting its boulder back (round 17's test, tools/foes17/boulders.mjs; fetch-before.txt / fetch-after.txt).** Staged:
the same as round 17 in every spot (20 of 20 within 6 s for the trolls, a new boulder from the ring of rocks; the yeti
off a wall in 8.1 s and out of a corner in 11.6 s). In fights: taken up again within 6 s, troll 129 of 129 before and
134 of 134 after; rock troll 79 of 79 and 92 of 93; elite rock troll 103 of 103 and 98 of 98; yeti 149 of 181 and 155
of 196. The mean wait is longer (2.6 s to 3.4 s; rock troll 2.6 to 4.1; elite 1.2 to 2.3): a boulder set down wedged
lies 3 to 4 s by rule, and that happens more now that walls stop it.

**Checks.** `node --check` on every js file: clean. `node tools/preview-check.mjs`: threw 0 / never fired 0 / not
offered 0. `node tools/battles.mjs`: 532 battles, 0 problems, 8 ran out of time (11 at `--steps 240`).

## Clips (docs/clips/troll19/, not in git)

Every pair is the same battle, seed, staging and camera, filmed on the tree before the lane and after
(tools/troll19/film-all.sh; scenes in tools/troll19/stage.js). The staged hero is rooted, harmless and very tough.

Seconds are clip time.

| what | before | after |
|---|---|---|
| **The turn**, a hero behind it (troll) | `before-turn180-troll.mp4` 0:00-0:01: it stands, the boulder swings round it | `after-turn180-troll.mp4` 0:00-0:01: it steps up and round the boulder, the boulder shifts about its own width; 0:02 on, it pushes |
| a hero at its side (troll) | `before-turn90-troll.mp4` 0:00-0:01 | `after-turn90-troll.mp4` 0:00-0:01 |
| rock troll, behind and three eighths round | `before-turn180-rocktroll.mp4`, `before-turn135-rocktroll.mp4` 0:00-0:02 | `after-turn180-rocktroll.mp4`, `after-turn135-rocktroll.mp4` 0:00-0:01 |
| **A hero in the room's corner** (rock troll) | `before-corner-rocktroll.mp4` 0:02-0:03: the paladin is put outside the room, past the corner's walls | `after-corner-rocktroll.mp4` 0:02 to the end: he stays in the corner, the boulder stopped against him; 0:05 the line of the point-blank roll |
| **against the room's edge** (troll) | `before-wall-troll.mp4` 0:02-0:05: half in the wall, ploughed along it | `after-wall-troll.mp4` 0:01: the boulder reaches him and stops; 0:06: bowled into him, he goes along the wall, inside the room |
| **against a thin wall** | `before-thin-troll.mp4` 0:02-0:05: ploughed along the wall and round its end, out of the picture | `after-thin-troll.mp4` 0:02: he slips to the side along the wall; 0:05: the roll |
| **a doorway too narrow for the boulder** | `before-door-troll.mp4` 0:02 to the end: the boulder sits in the wall's ends, up in the doorway, against the hero behind it | `after-door-troll.mp4` 0:02 to the end: the boulder stopped below the doorway |
| **against a rock** (elite rock troll, the bigger boulder) | `before-pillar-rocktroll-elite.mp4` 0:01-0:03: the boulder goes into the rock after him and he is carried off out of the picture | `after-pillar-rocktroll-elite.mp4` 0:01-0:03 held between boulder and rock, 0:04 he slips out to the side, 0:06 the charge |
| **A hero standing in its way** (your second note; troll, rock troll) | `before-push-troll.mp4`, `before-push-rocktroll.mp4` 0:01-0:05: walked across the room on the boulder's front | `after-push-troll.mp4` 0:01: the boulder reaches him and stops; 0:05: bowled into him, it rolls on without him; the same in `after-push-rocktroll.mp4` |
| **Yeti**, a hero in the corner | `before-yeti-corner.mp4` 0:01 to the end: outside the room | `after-yeti-corner.mp4` 0:02-0:05 in the corner, inside the room; 0:06 he slips out along the wall |
| yeti, against the edge | `before-yeti-wall.mp4` | `after-yeti-wall.mp4` 0:02: the ball reaches him, 0:03 he slips along the wall |
| yeti, a hero behind it | `before-yeti-turn180.mp4` | `after-yeti-turn180.mp4`: the same walk round its ball as before (not changed) |
| **Whole fights** against a paladin and an archer, 20 s | `before-live-troll.mp4`, `before-live-rocktroll.mp4`, `before-live-yeti.mp4` | `after-live-troll.mp4`, `after-live-rocktroll.mp4`, `after-live-yeti.mp4` |

Dropped from the film set (still in the staged test): the crate's corner and the friend against the edge (both read
poorly on film), the yeti at the doorway (its ball fits through).

## Calls made (say if any is wrong)

1. **The boulder takes three tenths of the turn** (`CARRY.roll` 0.3). You asked for "more around the boulder", not all
   of it. With the boulder dead still the troll needs 40% longer for the same turn (or has to scuttle); at three tenths
   the troll turns as fast as before and the boulder shifts about a boulder's width in a half turn. My pick: keep 0.3.
   0 is one number away.
2. **It stops pushing at its mark** (your second note). The troll brings the boulder up to its target, holds it there,
   and bowls it into them; it no longer walks them across the room. Between throws it can stand about 3 s with the
   boulder against them (`after-push-troll.mp4`). My pick: keep; a quicker second bash would make it stronger.
3. **A body in the boulder's way slips off to the side** rather than being knocked off: no new damage, no new knock.
   In a corner, with no side to go to, it is held until the boulder is let go (seconds; `after-corner-rocktroll.mp4`).
4. **The rock troll turns quicker than it did** (a half turn 1.2 s, was 1.9 s). At its old pace it lost more than it
   used to once the boulder was solid; at this one its fights come out as before.
5. **No set-it-down-and-brawl rule.** I built one (a foe at its back: it leaves the boulder and uses its fists, the
   yeti's rule) and took it out again: it changed how the troll fights and the numbers did not need it.
6. **The boulder's weight**: a troll's about a troll (5 against the troll's 6), a snowball about a yeti (2.6 against 3),
   more as they grow. A heavier boulder is pushed aside less by heroes leaning on it.
7. **Where it has no room to walk round the boulder it swings the boulder round itself**, as it used to, but solid.
8. **Sim-wide, small**: a body thrown out of a rock or shoved by another body is put out of the walls again in the same
   step (sim.js, two marked lines). Every unit, not only trolls.
9. **Fights are shorter and that is left as it is** (no health or damage changed to stretch them back).

## Not done, and what still looks off

- **A troll or a hero can overlap a boulder for a moment** where there is no room for both: in the battle test rooms
  (three elites or majors in a small room with extra walls) a body was more than 14 inside a boulder 134 times, a
  fifth of a second each. Never a wall.
- **Stuck in the cramped test rooms**: 18 times in 648 fights (28 before) a troll-shaped unit did nothing for 15 s or
  more, the longest 94 s (107 s before). The ones looked at: a major troll in a pocket with its mark just across a
  thin wall, in reach of its fists by the sim's measure (the plain brain stands at the wall; any big melee unit would),
  and a yeti without a ball doing the same. In dungeon rooms: once in 36 runs (twice before).
- **The staged doorway**: with the wall right across the room the troll stands at the doorway for good, bowling the
  boulder at it every 3 s (`after-door-troll.mp4`). In a real room it goes round.
- **The standing pause at its mark** (call 2) can look idle against a hero who does not move.
- **The yeti's push** is unchanged in feel; only what its ball does to walls and bodies changed. Its win rate dipped
  (49% to 44%, one yeti against two heroes 11 of 20 to 3 of 20): its ball no longer walks the pair about.
- **A hero's own lunge can still put him in a wall** for a third of a second (the Twinfang above). Outside the lane.
- **Sounds, art**: none touched. The boulder's look is lane boulder19's; this lane draws nothing.
- **js/boulders.js is a new file the game loads**: sw.js needs tools/build-sw.py (not run, as told).

## Try it

- `node tools/serve.mjs 8972 .` then `bash tools/troll19/clip.sh after-x troll wall` (scene: wall, corner, thin, pillar,
  door, push, turn90, turn135, turn180, live; kind: troll, rockTroll, yeti, with @1 elite or @2 major).
- Battle mode: Troll, Rock Troll or Yeti against anyone. `lab.html?foes=troll,rockTroll`.
- The feel is four numbers in js/foes9.js `CARRY`: `orbit` / `orbitRock` (how fast it steps round), `roll` (the
  boulder's share of the turn: 0 = the boulder stays put, 1 = the old swing round the troll), and js/boulders.js `SHED`
  (how fast a body slips off the boulder's front).
- Tests: `node tools/troll19/walls.mjs` (walls; `--convoy` the wagon mode), `turns.mjs`, `glue.mjs`, `winrate.mjs`,
  `dps.mjs`; the round-17 fetch test `node tools/foes17/boulders.mjs`.
