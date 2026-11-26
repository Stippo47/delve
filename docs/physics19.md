# Physics: jumps, collision layers and the draw order (round 19, lane physics19)

The designer, round 19, chat, word for word:

> "Work on the physics overall. I see a lot of jarring jumping of units or segments of entities like the spider and
> drake. If a spider puts its foot down on an entity either the spider jumps in a spit second or the entity does and
> it's jarring. Many times when things are on layers where they shouldn't collide they do.
> Work on collision layers and render order (spikes shouldn't ever render onto of an entity)"

Branch `physics19` (main at 0.42.0 merged in, corpses19 with it). Clips in `docs/clips/physics19/`: every scene filmed
twice with the same seed and staging, `before-*` on a copy of main as it was, `after-*` on this branch. Tools in
`tools/physics19/`. One new file the game loads: **`js/layers.js`** (sw.js needs tools/build-sw.py; not run, as told).

## What was asked, and where to see it

- **"jarring jumping of units"**: two bodies found inside each other were put exactly apart in that one step, however
  deep. They ease apart now. Counted over the same 188 fights before and after: a body thrown 6 or more in one step
  **8,536 times before, 152 after**. `before-spider-feet.mp4` 0:05.6 (the berserker goes 35 in one frame as a foot
  comes down) against `after-spider-feet.mp4` (he stands where he was, the feet come down round him);
  `before-crowd.mp4` / `after-crowd.mp4`, `before-structures.mp4` / `after-structures.mp4` (the whole fights: no one
  second to point at, the count is their proof).
- **"or segments of entities like the spider and drake"**: the spider's and the idol's own head no longer jumps (its own
  lifted feet shoved it: the idol 24.8 in a step in the staged walk, 0 now); the drake's body no longer goes round
  behind its head as a stiff rod or flips (its rear went 160 to 190 in one step); a stunned drake's body no longer
  catches its head up in one step. `before-idol-hooves.mp4` 0:07.9 and 0:08.4 against `after-idol-hooves.mp4` (small
  in the film); `before-drake-body.mp4` / `after-drake-body.mp4` 0:04, `before-drake-fight.mp4` /
  `after-drake-fight.mp4`. The drake's flip did not happen in the 18 s filmed: it is in the count (seed 100 at 14.6 s
  of `detect.mjs --boss cinder`), not on film.
- **"If a spider puts its foot down on an entity either the spider jumps in a spit second or the entity does"**: a foot
  comes down beside whoever stands on its spot, and whoever it still lands on is eased out from under it; the foot
  itself never moves for anybody. A standing hero's worst single step: spider 50.5 before, 3.7 after; idol 16.0 and
  2.2. `before-spider-feet.mp4` / `after-spider-feet.mp4` 0:05 to 0:09, `before-idol-hooves.mp4` /
  `after-idol-hooves.mp4`, and the real fights `*-spider-fight.mp4`, `*-idol-fight.mp4`.
- **"Many times when things are on layers where they shouldn't collide they do."** One table of what touches what, in
  `js/layers.js`. Pushes between two bodies on different heights: **25,664 before, 0 after** (3 counted are bodies
  killed in that same step); a body pushed by its own boss or its boss's other parts: **26,869 before, 0 after**.
  `before-fliers-cross.mp4` 0:03 to 0:06 (the bats shove the line of heroes down the room) against
  `after-fliers-cross.mp4` (they fly over it; only the skeletons behind them shove); `*-fliers.mp4`.
- **"render order (spikes shouldn't ever render onto of an entity)"**: one order, written down in `js/layers.js`; eight
  kinds of spike that were drawn over bodies are under them now. `before-spikes-under.mp4` /
  `after-spikes-under.mp4` (each kind brought up under a standing hero in turn: 0:01 the Bone King's, 0:03 bone and
  ice strikes and a grave lance, 0:05 the Earth Mage's three, 0:07 the frost nova, and round again);
  `*-spikes-heroes.mp4`, `*-spikes-queen.mp4` (real fights, 0:06.3 in the queen's). (I filmed the Bone King's own fight
  too; he did not use his spike rows in it, so it is not in the folder. His spikes are the first thing in
  `spikes-under`.)

## The audit: what I found (before anything was changed)

Found with a headless detector, `tools/physics19/detect.mjs`: 188 fights (every boss, sand serpents and chain
crawlers, eight crowds, eight mixes of fliers, three parties that put things down, the big bodies, a dungeon run in each
of the nine lands), 9,951 seconds, 4.9 million unit-steps. Every step, each body's move is set against what its own
pace and knockback explain; 6 or more left over in one step (360 a second; a hero walks 60 to 110) is a jump. The
physics itself says what it pushed and out of what (a debug hook, `w.physLog`; the same five logging lines were put
into the copy of main, nothing else). Bodies in the air, knocked hard, out of sight, or only held back (stopped by what
they walked into) are not counted. "Before" is main at 0.42.0 (`tools/physics19/before.txt`).

1. **Two bodies inside each other were put exactly apart in the one step** (sim.js physics), by their masses: thrown
   out of a body of its own weight 2,380 times (13.5 on average, 51 at worst), out of a lighter one 1,378, a heavier
   one 783 (70 at worst), a boss's body 951 (21 on average, 90 at worst). Bodies get into each other by a dash ending,
   a leap landing, coming out of the sand or smoke, being made on top of somebody, a foot or a hive set down on them.
2. **A boss's parts pushed their own boss and each other**: 1,875 jumps, 26,869 pushes. The Canopy Idol's head was
   shoved by its own hooves whenever one lifted (404 jumps: the whole idol went with it); the Sand Wurm's rings shoved
   each other apart every step and were put back by its brain the step after (941); the Great Engine by its own hands
   (99); the spider's feet by each other.
3. **A body's height for touching was not its height for drawing** (height.js): everything off the floor was one
   height, so a boss's flying head collided with its own lifted feet and with spiderlings on their threads; and the
   kinds that always fly were on the floor. 25,664 pushes between bodies drawn on different heights: ghosts and
   skeletons 2,800, the Gilded Seraph and the party 4,400, angels and golems 1,900, bats and wolves 1,000, wasps and
   automatons, drones and the Engine.
4. **A foot set down on somebody threw them** out of it in that step: 284 jumps, 21 on average, 55 at worst (a foot
   weighs 30, a hero 2 to 3). Staged (the spider walking through three standing heroes, 6 runs): 50 jumps, the worst
   50.5 in one step.
5. **A boss's body or hit boxes did the same**: out of a boss part 417 (the drake's and the wurm's body, the engine's
   hands: 22 on average, 177 at worst), out of a chain's link 57 (46 on average, 187 at worst), out of a thing stood
   on the floor (a hive, a big bomb, a turret, the spirit eagle) 100 (25 on average).
6. **Parts were walked through the walls-and-rocks rule too**, then put back by their brain: pushed in from the
   room's edge 170 (the idol's hooves 110, the engine's hands 56), out of rocks 77 of the 134.
7. **A body in a rock was thrown out whole** (134, 120 at worst).
8. **A stunned boss came apart**: its brain does not run, so its parts stay where they are, but the party could still
   shove its head; when it woke its body caught up in one step (the drake's whole body 12 in a step; the spider on the
   floor the same).
9. **A stomp begun before a stun**: the leg hung in the air while its circle ran out and struck; when the spider or the
   idol woke, the foot was on its mark in one step (19 to 30).
10. **The spider and the idol came round at 7 rad/s to spit or cast** (they turn at 1.15 and 1.4 walking): their feet,
    126 and 180 out, had 880 to 1,260 a second to cover and whipped across the floor 18 to 29 a step.
11. **The drake's body went round behind its head as a stiff rod**: its head comes round at 8 to 12 rad/s for a tell,
    and each joint of the spine was put on its bend limit at once: hips turning at 16 rad/s, and a joint bent past a
    half turn flipped to the other side: the rear of the body 160 to 190 away in one step (seed 100, 14.6 s).
12. **A dash that picks somebody up** (the shouldered charge) put them on the carrier's front in the step they were
    met, up to 60 or 70 from where they stood; a chain crawler's head went 54 and its whole body with it.
13. **Showboat's ring** put everyone standing in it on its rim in one step (up to 130).
14. **Spikes drawn over bodies** (the draw order): the Bone King's spike bursts were the last thing drawn in the room,
    over everything; a danger circle's strike drawn as bone or ice spikes; the Earth Mage's Spike Chain, the spike
    under one enemy and Earthquake's heaved slabs; the Frost Mage's nova and frost arrow; the Trapper's caltrops once
    they lie; plain vine patches; the Winter Queen's crystals. Already right: the room's spike plates and every floor
    hazard, the wurm's, drake's and idol's ground effects (wurm19, corpses19).
15. **Not faults, but they read as jumps in the count** (listed so nobody hunts them again): a beat of stillness on a
    big hit (`w.hitstop`: nothing steps for one or two frames); and moves that are fast on purpose: every dash
    (24,800), the drake's bite (its head darts 16 a step and the body goes with it), its tail's whip, the wurm's lunge
    (42), the Bone King's lunge (55 to 74), the engine's punches (57), the ooze's bounce, the Sun Blade's spin, the
    Winter Queen's and the wisps' blinks, the Mob closing up.

## What was done

**`js/layers.js` (new): the layers, the rule for coming apart and the draw order in one place.**

- **What a body is** (`bodyKind`): corpse (dead or downed), ghost (ethereal, going through bodies, a kind that rolls
  through), part (a piece its boss places: feet, hooves, the drake's and wurm's body, the engine's hands), link (a
  chain's), structure (stood where it was put), body (everyone else). Parts, links and structures are anchors: no push
  moves them, and two anchors never push each other.
- **How high it is** (`heightOf`): floor, hovering, flying: the same answer the renderer draws by. The kinds that
  always fly are flying for touching too now.
- **What touches what** (`bodiesCollide`), the table below.
- **How bodies come apart** (`softPush`): what two bodies walked (or were carried) into each other this step is taken
  out at once, up to 270 a second, so nobody walks through anybody and a body still pushes another along; the rest
  (they were already inside each other) eases out at 90 a second plus 6 times what is left, never more than 330; all
  the pushes on one body in a step come to no more than 330 a second (5.5 a step). A 40-deep overlap is gone in about
  a fifth of a second instead of one frame. A body between two anchors, whose pushes cancel, slips out sideways.
  Rocks the same way (`softRock`). Walls and the room's edge are as they were, at once (troll19's rule: nobody is ever
  left in a wall).
- `js/sim.js` physics uses them. Parts are no longer run through the walls-and-rocks rule or shoved (they are where
  their brain put them). A boss with placed parts is an anchor while it is stunned, frozen or asleep.

**The spider and the idol** (`js/boss-spider.js`, `js/boss-stilt.js`, `js/boss-kit.js footClear`): a foot's landing
spot is moved clear of every body on the floor that is not its own (eased, so a body walking under the spot moves it
rather than snapping it); a stomp is the one thing that comes down on somebody on purpose. A stomp is called off if the
animal is stunned in the middle of it (the leg steps back when it wakes). They come round to spit or cast at 3 and 2.2
rad/s. A long step takes longer (no foot faster than 660 a second at the middle of its swing).

**The drake** (`js/boss-cinder.js`): a joint bent past its limit comes back to it at 2.6 rad/s, not in one step: the
body follows the head round in a curve, and cannot flip.

**Carried and rung out**: a body picked up by a dash is drawn onto the carrier's front over a few steps
(`js/dashes.js`); Showboat's ring eases them out 7 a step (`js/kits2.js`).

**The draw order** (`js/render.js` drawScene, the list in `js/layers.js` ORDER): everything that comes up out of the
floor is a ground effect, under every body. Moved under: the Bone King's spikes (`render.js`), spike strikes and the
frost nova (`js/fxkit.js`), the Earth Mage's three (`js/fx3.js`), lying caltrops (`js/fx2.js`), vine patches
(`js/fx.js`), the Winter Queen's crystals (`js/boss-queen-fx.js`; a third place for a boss's effects, `BFX[type].low`,
over the floor's own effects and under the bodies).

## The collision layers

|                | floor body | hovering | flying | part | link | structure | ghost | corpse | rock, crate | boulder | wall, edge |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **floor body**    | push | no | no | same height | same height | same height | no | no | stopped | by mass | stopped |
| **hovering body** | no | push | no | same height | same height | same height | no | no | stopped | by mass | stopped |
| **flying body**   | no | no | push | same height | same height | same height | no | no | stopped | by mass | stopped |
| **part**          | same height | same height | same height | no | no | no | no | no | no | by mass | no |
| **link**          | same height | same height | same height | no | no | no | no | no | no | by mass | no |
| **structure**     | same height | same height | same height | no | no | no | no | no | no | stops it | no |
| **ghost**         | no | no | no | no | no | no | no | no | stopped | by mass | stopped |
| **corpse**        | no | no | no | no | no | no | no | no | only while thrown | no | only while thrown |

- **push**: the two ease apart, each by its share of their masses. **same height**: only when the two are at the same
  height, and then the body gives way, never the anchor (a lifted foot is off the floor: it touches no one until it
  is down). **stopped**: kept out (rocks, pillars, crates, walls and the room's edge stop every height: a room's walls
  go to the roof, and nothing in this game goes over a rock). **by mass**: `js/boulders.js` (troll19).
- **Always**: a body never touches its own animal: a boss and its parts, a part and its boss's other parts, a chain's
  head and its links, a link and the chain's other links. (The Mob's four bodies are four people: they may jostle.)
- **Corpses** are corpses19's: nothing moves one lying still; one still flying from its killing blow stops at things
  that stand still.
- **Shots, zones, pools, spike plates and traps are not bodies**: what they reach is `js/tags.js` layerOf / reaches,
  unchanged (a blade still reaches a bat; a slam still misses a hopping slime; only shots reach the Witch on her
  broom).
- Heights (round 18 and sys19, unchanged): floor; hovering (a slime mid-hop, a leap or a toss 10 or more up, the
  imps); flying (34 or more up, a swoop, the broom, a boss's raised head, and the kinds that always fly: bats, ghosts,
  banshees, wisps, cherubs, angels, seraphs, the spirits, bees, wasps, hornets, the drones, the spirit eagle, the
  Gilded Seraph).

## The draw order

One list (`js/layers.js` ORDER; `js/render.js` drawScene follows it). Nothing earlier in it is ever drawn over
something later:

floor > bodies lying (corpses, the downed, their rings) > doors > raised walls > floor hazards (spike plates, pools,
snares, webs, fire) > a boss arena's floor > danger zones > ground effects (zones, cracks, and **every spike, thorn,
vine and crystal that stands out of the floor**) > a boss's things that stand out of the floor > tracks, mounds, scuffs
> puddles > shadows > pickups > dust > rocks, crates > side rings > floor bodies, by depth > hovering bodies > flying
bodies > a body still flying from its killing blow > the wagon road's canopy > shots > sparks and dust > a boss
arena's air > air effects > swings and bursts > the room's light.

Checked and left: bodies of one height are sorted by depth on the screen; a boss's raised head and its legs are one
figure on the flying height (over everyone on the floor, as designed); a body is drawn over the pillar it stands
behind (top-down: the game has always done so).

## Numbers

Same 188 fights and seeds on both trees (`tools/physics19/before.txt`, `after.txt`).

| in one step, 6 or more | before | after |
|---|---|---|
| thrown out of a body of its own weight | 2,380 (worst 51) | 8 (worst 9) |
| out of a lighter body | 1,378 | 1 |
| out of a heavier body | 783 (worst 70) | 24 (worst 10) |
| out of a boss's body | 951 (worst 90) | 26 (worst 8) |
| out of a boss's part | 417 (worst 177) | 24 (worst 11) |
| out of a boss's foot | 284 (worst 55) | 3 (worst 7) |
| out of its own boss or its boss's parts | 1,875 (worst 164) | 4 (the Mob's own bodies) |
| out of a chain's link | 57 (worst 187) | 8 (worst 9) |
| out of a thing stood on the floor | 100 (worst 65) | 3 (worst 9) |
| out of a rock | 134 (worst 120) | 25 (worst 39: a lunge or a bounce ending in one) |
| in from the room's edge, out of a wall | 171 | 16 |
| out of a boulder (boulders.js, not touched) | 6 | 10 |
| **all pushes** | **8,536** | **152** |
| a placed part snapping (its step changed by 6 or more) | 2,413 | 1,713 |
| pushes between bodies on different heights | 25,664 | 0 (3: killed that step) |
| a body pushed by its own boss or its parts | 26,869 | 0 |

Staged, the films' scenes without the film (`tools/physics19/staged.mjs`, `staged.txt`; 6 runs of 12 s, three heroes
who only stand there):

| | a standing hero's worst single step | steps of 6 or more | the boss's own worst unexplained step |
|---|---|---|---|
| Old Longlegs, before / after | 50.5 / 3.7 | 50 / 0 | 0 / 0 |
| The Canopy Idol | 16.0 / 2.2 | 8 / 0 | 24.8 / 0 |
| Cinder | 15.9 / 5.5 | 44 / 0 | 10.4 / 10.5 (its bite) |
| a sand serpent | 31.7 / 5.5 | 5 / 0 | 28.6 / 5.2 |

**The price of easing: bodies are inside each other for longer.** Two bodies more than 16 deep in each other: 1,815
pair-steps before, 17,965 after (of 4.9 million unit-steps: with 13 in a crowd, a pair is that deep 4% of the time,
it was under 1%); spells of half a second or more, 4 before and 45 after (the longest 3.3 s). Most are a hero held in
the engine's claw, the Mob's bodies closing up, and heroes and foes in the same press. Slight overlaps (under 4) are
as common as before (0.56 pairs a step before, 0.52 after, in the crowd fights).

**Strength** (`bosses-before.txt` / `bosses-after.txt`: 60 fights each in the boss's own room, the party paladin,
archer, cleric, twinfang, as DECISIONS measures them; `bosses-more-*.txt`: 200 more on other seeds for the ones that
moved most). The party's wins:

| boss | level | before | after |
|---|---|---|---|
| Old Longlegs | 25 | 55 of 60, 166 of 200 | 47 of 60, 161 of 200 |
| The Canopy Idol | 25 | 55 of 60 | 56 of 60 |
| The Great Ooze | 25 | 44 | 46 |
| Cinder | 44 | 38 of 60, 103 of 200 | 32 of 60, 111 of 200 |
| The Sand Wurm | 51 | 34 of 60, 116 of 200 | 31 of 60, 110 of 200 |
| The Great Engine | 56 | 34 | 32 |
| The Bone King | 33 | 5 | 8 |
| The Winter Queen | 36 | 40 of 60, 148 of 200 | 51 of 60, 133 of 200 |
| The Gilded Seraph | 48 | 54 | 54 |
| The Goblin Chieftain | 13 | 42 of 60, 134 of 200 | 37 of 60, 133 of 200 |
| The Elder Ent | 6 | 59 | 60 |

Both samples together (260 fights each): Old Longlegs 85% before and 80% after, Cinder 54% and 55%, the Winter Queen
72% and 71%, the Chieftain 68% and 65%, the Sand Wurm 58% and 54%. The two samples of one tree differ from each other
by more than that (the spider 92% and 83% before, the queen 67% and 74%), so I read none of it as a real move, with one
maybe: **the spider is a little harder** (its feet no longer throw the party off them and out of its slam's circle). No
health or damage was changed.

Plain fights (`winrate-before.txt` / `winrate-after.txt`, 15 setups of 30 fights; the foes' wins): 168 of 450 before,
178 after. No setup moved more than 5 of 30 (golems 3 to 8, cherubs and angels 15 to 11, rattlers 20 to 24, bats 8 to
10, ghosts 15 to 14). Wagon mode: 4 trips, no errors, none stuck.

Checks: `node --check` every file; `tools/preview-check.mjs` threw / never fired / not offered 0 / 0 / 0;
`tools/battles.mjs` 535 battles, 0 problems, 8 out of time (main at 0.42.0: 535, 0, 8).

## The clips (docs/clips/physics19, `before-` and `after-` of each)

| clip | what it is | where to look |
|---|---|---|
| `spider-feet` | Old Longlegs walks down its hall through three heroes who only stand there, at 0.7 speed | before 0:05.6: a foot comes down on the berserker and he is 35 away in the next frame (smaller ones at 0:08.8 and 0:09.3); by 0:07 the berserker and the tower have been thrown out past its feet. After: they stand where they were, the feet come down beside them |
| `spider-fight` | its whole fight, the party at its feet | the party round its feet from 0:06 |
| `idol-hooves` | the Canopy Idol, the same walk | before 0:07.9 and 0:08.4: a hero shoved by a hoof and the head hitching as a hoof lifts. Small in the film: the numbers above show it better |
| `idol-fight` | its whole fight | from 0:06 |
| `drake-body` | Cinder prowls round one hero, its body dragged through three who only stand there, at 0.6 speed | the old guard beside its foreleg as its head darts, 0:04: thrown aside in that frame before, giving way over several after. Hard to see at full speed either way: the numbers above are the proof (a standing hero's worst step 15.9 to 5.5) |
| `drake-fight` | its whole fight | the party at its flanks throughout |
| `crowd`, `crowd-big` | 18 skeletons, and goblins with ogres, on six heroes | the press round the tanks from 0:04 |
| `fliers-cross` | eight bats flown across a line of five standing heroes, skeletons behind them | before 0:03 to 0:06: the bats shove the line down the room; after: they fly over it |
| `fliers` | bats and ghosts on a party | from 0:03 |
| `serpent` | two sand serpents in a melee | throughout |
| `structures` | hives, bombs, turrets and barricades put down in a crowd | from 0:04 |
| `spikes-under` | every kind of spike brought up under a standing hero in turn | 0:01, 0:03, 0:05, 0:07, then round again: over the heroes before, under them after |
| `spikes-heroes` | the Earth Mage, Frost Mage and Trapper in a real fight, two spike plates under it | throughout |
| `spikes-queen` | the Winter Queen's crystals | 0:06.3 |

`tools/physics19/film-jumps.py` points at the frame where a hero's red jumps in a staged film; it found the seconds
above for the spider and the idol. It is useless on a real fight (too much else is red), so the fights have no
seconds: the counts are their proof.

## What I didn't do, and what still looks off

- **Fast moves that are a boss's or an ability's own** are as they were (15 above): the drake's bite takes its whole
  body 16 a step for a tenth of a second; the wurm's lunge, the Bone King's lunge, the engine's punches, the ooze's
  bounce. They are the bulk of what is left in "a placed part snapping" (1,713).
- **Abilities that put somebody somewhere at once**: the ogre's grab, the engine's claw, hooks and pulls, the idol's
  liana in its first step, blinks. Only the shouldered charge's pick-up and Showboat's ring were eased.
- **Chains** (sand serpent, chain crawler): the body still snaps 7 to 28 when the head strikes or is knocked (the
  whole body goes with the head by design). 955 of the 1,713.
- **A foot coming down still stops dead** from 6 to 9 a step (a foot planting; it reads as a step, but it is counted).
- **Boulders and snowballs** still put a body out of them in one step (10 in the count, up to 34): `js/boulders.js` is
  troll19b's this round. The same easing would go there.
- **A wall raised on somebody** still puts them out of it at once (walls are absolute).
- **Bodies overlap for longer** (the price, above). In a real press you can see two fighters in each other for a
  moment where one would have been thrown clear.
- **The Earth Mage's spike under one enemy is mostly hidden by that enemy now** (it was drawn over them). Its tips show
  round a small body and not at all round a big one.
- **No smoothing between steps**: the game steps 60 times a second and draws what it has; on a frame that takes two
  steps everything moves double. Not touched.
- The idol film shows little: its faults were smaller than the spider's to begin with.

## Calls I made (say if any is wrong)

1. **The kinds that always fly no longer push, or are pushed by, anyone on the floor** (they push each other; blades
   still reach them). sys19 left this "a call for the designer"; your note on layers decided it. It means a bat can be
   right on top of a hero, drawn over him.
2. **A foot never lands on somebody (it is put beside them), and the foot never moves for anybody**; whoever it still
   comes down on is eased out. A stomp still comes down on its mark.
3. **Walls and rocks stop every height.** A flier does not go over a rock or a crate.
4. **A stunned, frozen or sleeping boss with parts cannot be shoved**, and a stomp it had begun is called off.
5. **The spider turns to spit at 3 rad/s and the idol to cast at 2.2** (7 before): slower to aim, far less scramble.
6. **Spikes are under every body, the big ones too**, even where that hides most of the effect (the Earth Mage's
   spike under an enemy).
7. **The numbers of the easing**: 5.5 a step at most. Stiffer reads more like the old pop; softer lets bodies sit in
   each other longer.

## Switches

- `?push=hard` in the address: bodies are put apart in the one step again, to see the difference (the layers, the
  anchors and the draw order stay as they are now).
- `w.physLog = (unit, dx, dy, other, kind) => ...` on a room: the physics reports every push it makes (the detector's
  hook).
- `node tools/physics19/detect.mjs [--root scratch/before] [--set bosses,segs,crowd,fliers,structs,trolls,dungeons]
  [--boss cinder] [--exs]`, `probe.mjs --boss ikSpider` (every snap of a part with what its boss was doing),
  `staged.mjs`, `winrate.mjs`, `bosses.sh`, `clips.mjs --only spider-feet --which before,after`.
