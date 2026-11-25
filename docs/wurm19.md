# The Sand Wurm, round 19 (lane wurm19): what was off, and what was done

The designer: "Get a Fable agent on redoing the sandworm. It's good but has many misc problems."
No specifics were given, so this lane played it and looked. The concept stays (it lives under the sand: mound and
furrow, heave, breach arcing hole to hole, rear-up with lunge and inhale, brood, coil); everything below is a fault in
how that is shown or how it plays, found before anything was changed.

How it was looked at:
- `tools/wurm19/watch.mjs`: a fight recorded frame by frame (30 a second, the frames kept) with a line of the fight's
  state per frame (`state.json`, `moves.txt`: which move starts at which frame). Frame numbers below are frames of
  `docs/clips/wurm19/before-full-fight.mp4` (paladin, archer, cleric, twinfang at level 51, seed 3; time = frame / 30)
  unless another clip is named. `tools/wurm19/sheet.sh` lays frames out side by side for a close look.
- `tools/wurm19/probe.mjs`: fights in Node, measured (what is out of the sand but not drawn, where holes open, what the
  party aims at, who each move catches). Before: `tools/wurm19/probe-before.txt`, `probe-before-parties.txt`.
- `tools/runs.mjs --boss --bossid sandWurm --theme dunes`: win rates (before: `tools/wurm19/before-L48/51/54.txt`).

## The problems (numbered; where each was seen)

### Things that are plainly broken
1. **The body vanishes the moment the head goes back under.** The arc is 300-400 long and the body 530, so when the
   head dives into the second hole five to seven rings are still out; from that frame none of them is drawn, though
   they are still there to be hit, still cast shadows and still show health bars. f140-174 (first breach: the shadow
   band and bars between the two holes, nothing over them), f1658-1676, the coil f3034-3050. Measured: 19.9 s of a
   158 s fight with rings out and nothing drawn (a fifth of all the time it is out of the sand). Cause: render.js
   skips a hidden unit before it reaches the unit's own drawing, and the whole wurm is drawn from its head.
2. **The roar at each phase turn shows no wurm.** The ground lifts, the breach bursts, the hole opens, and nothing
   comes out of it for 1.6 s; then the hole shuts. f1507-1555 (the turn into phase 2), f2862-2910 (phase 3). Cause:
   the roar's branch returns before the line that moves the body up its path. So neither phase change is ever seen.
3. **Health bars float over single rings of its body**, and over rings that are not drawn: f148-152, f396-412,
   f1096-1144 (one sits on the hole itself), f1664-1670 (a ladder of bars with no body). The boss has its bar at the
   top of the screen; a ring keeps no health of its own.
4. **The party fights the sand.** While it is under, the heroes aim at its hidden head (34% of all their time, 36-44%
   with other parties): they run after the mound and swing, shoot and cast at it, and nothing lands. f192 (a sword
   swing at the mound), f212-216 (Smite's pillar on the lifting ground), f650-659 (a cross slash on the closed hole),
   f1682-1730 (Twinfang riding on top of the running mound, stabbing it).

### Drawn in the wrong order, or not matching the body
5. **The whole wurm is drawn at its head's place in the drawing order.** Rings high in the arc are drawn under a hero
   who stands lower on the screen than the head once the head is near the floor: f1646 (the Paladin and a slash drawn
   over rings that are 60-90 up in the air). Round 19's rule: what is in the air is drawn over what is on the floor.
6. **The sand spouts of a breach are drawn over the wurm**, for half a second, as a bundle of tall pale stakes that
   hides the neck coming out: f96-104 (close: `z100.jpg`), the rear-up f340-348, the dive's splash over the diving
   body, the coil's ring of them f3002-3010.
7. **Chilled, frozen, poisoned, wet or burning, every ring shows through the ones in front of it**: the status wash
   is laid on each shape in turn, so where rings overlap it is laid twice and the wurm reads as a row of glass rings
   with their hidden edges and thorns showing. f108-134 (frozen; close: `z128.jpg`).
8. **The bite at the end of the inhale is not its jaws**: two great straight tusk bars with teeth close from the
   sides over the head, nothing like the two curved mandibles the head has. f562, f1132-1144.
9. **Its sand looks like bubbles.** The clods and dust puffs of the breach, the dive, the inhale and the ring burst
   are discs in the floor's own colour with a dark outline: on sand they read as hollow rings. f92-104, f462-552
   (the grit "spiralling into the maw" is a scatter of small circles), f2994 (clusters of them round the ring).
10. **The furrow is a thin braid** (about 30 wide, see-through, crumbs in a line) behind a wurm 90 across, and the
    mound is narrower than the head that comes out of it. f9-51, f192-220. The designer's note on the Digger's burrow
    in the round 19 deck says the same of that one: "Trail better. Maybe not transparent. And have it start fading
    later but much faster so you see less crumbs of dirt in a line. Bigger churned clumps in trail."
11. **The mound pops up on top of the hole it has just gone down**, while the hole is still a dark pit: f641-647.
12. **The head "stuck in the sand" after a lunge just lies there shut**: no sand over it, nothing holds it.
    f399-419.
13. **The inhale barely shows**: the streaks of sand running to the maw are faint scratches. f462-552.

### Where it comes up, and what stands where
14. **Holes open against the broken columns** (3-5% of holes within a hole's width of one; an arc ends in one now and
    then): the neck and the lunging body lie across the column. f324-412 (the rear-up's hole touching the column),
    f1380-1410 (the lifting ground's circle laid over a column).
15. **An arc can bow out through the wall** when it runs along one (9 of 572 arcs; rings out of the room 15 s in 30
    fights).
16. **Heroes stand in the open hole**: f140-152 (the Paladin stands in the middle of the pit while the body is still
    pouring out of it).
17. **A ring just out of the hole is hit at half its size while it is drawn as a speck** (its hit circle starts at
    50%, its drawing at 0%).
18. **A lunge aimed at a column next to the hole** is a stab 40 long into the column (the line is clipped, the move
    still plays).

### Smaller
19. **It hangs in the air when frozen mid-arc**: f106-134 (1.4 s a fight on average with a frost hero).
20. **The roar can't be hurt** (by design, 1.6 s), but it is aimed at and struck all the same: blows with no effect.
    (It was never seen, because of 2.)
21. **No sound at the phase turn**: the phase cue reads `u.k.phase`, and only the Bone King keeps its state there
    (this is so for every designed boss; fixed here for the wurm only).
22. **The Book's preview of it** is flagged by `tools/preview-check.mjs` ("went off, but nothing it made reached
    anyone in 3.5 s") and its 10 s loop shows two breaches and never the rear-up.
23. **Numbers**: at level 51 (where the campaign meets it, docs/balance/r15-bosses.txt) the party wins 67 of 100
    (52 at 48, 87 at 54). The band is 40-60% at the level met; the heroes have grown since round 15's 20 of 40.

More, found while fixing:

24. **Its death was a burst of brown ovals, cut off by the summary screen**: each ring went through the sim's `kill` as
    a unit of its own (a death puff where each lay, also the ones under the sand, wherever they had last been, and
    eleven "something died near you" for every hero's hooks); the furrow and the holes vanished in the frame it died;
    and the floor ended 0.6 s after the boss fell, a third of the way into its death. Clip `w-m-death` (first
    recording of it), f1398-1416.
25. **A short arc bunched the body between its two holes**: the arc took the first of eight ways with 250 clear, so
    near a wall it was 190 long for a body of 530. First recording after the draw fix (`a1.jpg`, f114-124).
26. **The arc stretched the body going up the screen and bunched it going down**, and at its top the body was drawn
    86 from where it could be hit (height 96, drawn 0.9 of it up the screen, a third bigger).
27. **Reared up near a wall its head hung out of the room** (reach 170, holes 90 from a wall), and the bite's circle
    could be centred outside it. Measured: head or rings out of the room 7.7 s in 12 fights.
28. **Heroes fighting at the reared neck were drawn under it**: every ring 10 or more up counted as in the air, so the
    whole neck was drawn over whoever stood at it. `c2.jpg` of the first recording, f226-250 (the Paladin under it).
29. **The Book's page of it**: a blank disc for its face, a flagstone floor under a wurm that lives in sand, the words
    "How it fights." and nothing else, and its health bar hanging over the mound while it was under.
    `book-preview-before-page.png`, `book-preview-before.mp4`.
30. **The mound flashed on top of the hole for a frame or two** each time the last ring went under (and again as the
    reared wurm sank): found in this lane's own after-clips, frame by frame (first recording of `after-burrow-breach`,
    f146-147).
31. **The neck twitched round every lunge and breath**: its sway was switched off and on in one frame (up to 34 at the
    head). First recording of `after-rear-lunge`, f294-297.

## What was done (each number above; the clip and the second where it shows)

Clips are in `docs/clips/wurm19/` (git-ignored), 30 frames a second, recorded with `tools/wurm19/watch.mjs` and every
one looked through frame by frame on contact sheets (`tools/wurm19/sheet.sh`).
`before-full-fight.mp4` / `after-full-fight.mp4`: the same party, level and seed.
`after-burrow-breach.mp4`, `after-rear-lunge.mp4`, `after-inhale-bite.mp4`, `after-roar-phase2.mp4`, `after-coil.mp4`,
`after-death.mp4`: one move each, close. `after-melee.mp4`, `after-ranged.mp4`, `after-lone.mp4` (and `before-` of
each): other parties. `book-preview.mp4`, `book-preview-page.png`: the Book.

1. **Body vanishing: fixed.** The head and every ring are units; each now draws the lot of the body it belongs to
   (what is on the floor at a hole's mouth, what is up in the air), once a frame, so the body is drawn whether or not
   the head is out. `after-burrow-breach.mp4` 3.7-4.9 s (the head is under from 3.7 s; seven rings go on pouring into
   the second hole) and again 7.5-8.8 s; `after-coil.mp4` 8.0-8.8 s.
2. **The roar: fixed** (one line: the roar's branch never moved the body up its path). It comes up in the middle,
   jaws wide, sound lines bursting from the maw in waves. `after-roar-phase2.mp4` 6.2-8.1 s.
3. **Bars over rings: gone.** A ring's kind shows no bar (`def.noBar`, `js/hpstyle.js`; it keeps no health of its
   own), and a hidden unit shows none either. Any of the clips: no bar on a ring.
4. **The party fighting the sand: nearly gone.** Under the sand the head is still the party's target, so they follow
   the mound and back off from it as before, but it can't be struck: no basic attacks at it, no ability aimed at it
   (`u.noStrike`; one line in `sim.js tryAttack`, three in `kits.js kitThink / kitReflex`). Blows landing on the buried
   head: 112.5 a fight -> 10.8; abilities thrown at it (Smite, Frost Arrow, Barrage, Backstab, Shield Bash): 33.6 a
   fight -> 0. Twinfang still dashes after the mound and Fan of Knives still goes off beside it (their own rules, 10
   and 4 times a fight). `after-burrow-breach.mp4` 0-2.9 s and 4.9-6.7 s (the party keeps its eyes on the mound and
   holds), `after-roar-phase2.mp4` 8.6-10.5 s.
   Tried first and thrown out: making the buried head no target at all. Nobody minded the mound any more; the Cleric's
   healing fell by a third (her orbs heal on their way to a foe), and a party of four shooters, who used to back away
   from the mound as from any foe, stood still on it and lost 40 fights of 40.
5. **Drawing order: fixed.** Two lots, each one figure with one outline through `boss-draw.js figure`; the lot in the
   air is drawn in the game's own "in the air" pass, over everyone on the floor; the lot on the floor is drawn by
   depth like any floor body. `after-burrow-breach.mp4` 3.2-4.4 s (the body arcs over Twinfang).
6. **Sand spouts over the wurm: replaced.** The breach throws rays of pale sand out along the floor round the hole,
   as round a crater (flat, no outline, under everything), with clods and dust in the air. No stakes.
   `after-burrow-breach.mp4` 2.9-3.4 s; the rear-up `after-rear-lunge.mp4` 6.7-7.2 s; the ring `after-coil.mp4` 6.7-7.2 s.
7. **Glass rings under a status: fixed.** The status wash is laid once over the whole lot (its shapes filled flat
   into a small layer of their own, tinted, laid over), not shape by shape. `after-inhale-bite.mp4` 9.7-10.4 s
   (burning: one even wash over head and neck, no ring showing through another).
8. **The bite: its own jaws.** The straight tusk bars are gone. In the last 0.3 s of the breath the head draws back,
   then darts out and its mandibles clap shut; a white snap at the maw, the sand jumping out to the bite's reach.
   `after-inhale-bite.mp4` 9.6-10.3 s; `after-rear-lunge.mp4` 13.8-14.5 s.
9. **Bubbles: gone.** Dust is clouds (three puffs under one outline, pale, shrinking away instead of fading); a clod
   is a small angular lump of darker damp sand with a lit top. `after-burrow-breach.mp4` 2.9-3.6 s;
   `after-inhale-bite.mp4` 6.6-9.8 s (clods spiralling into the maw).
10. **Furrow and mound: redrawn.** The furrow is a churned track as wide as the wurm: a dark trough, clumps of every
    size thrown up along both edges and now and then down the middle; it lies solid for 4.2 s and slumps back in 0.9
    (the designer's note on the Digger's burrow). The mound is as wide as the wurm. `after-burrow-breach.mp4` 0-1.7 s;
    `after-coil.mp4` 4.6-6.6 s (the ring it digs).
11. **Mound on the open hole: fixed** (with 30). The mound shows only while it runs under the sand, a beat after the
    last ring has gone down, fading in. `after-roar-phase2.mp4` 8.1-8.9 s; `after-burrow-breach.mp4` 4.7-5.4 s.
12. **Stuck head: sand heaped over its jaws** (one pile with one outline, thrown up as it lands, crumbling as it pulls
    free). `after-rear-lunge.mp4` 8.6-9.5 s; `after-inhale-bite.mp4` 12.3-13.0 s.
13. **Inhale: stronger.** The streaks to the maw are brighter with a shadow beside each; clods spiral in.
    `after-inhale-bite.mp4` 6.6-9.8 s.
14. **Holes against columns: fixed.** A breach's hole keeps a hole's width clear of a column, the rear-up's hole 210
    from a column and 150 from a wall; the coil's ring is moved the least it takes for no column to stand on it; the
    reared neck reaches less far where a wall or a column is in the way. Holes beside a column: 43 of 1397 -> 1 of 1413;
    rings lying in a column: 31.7 ring-seconds in 30 fights -> 1.0.
15. **Arcs through the wall: fixed** (bows the other way, or not at all): 9 of 572 -> 0; rings out of the room 15.3
    ring-seconds in 30 fights -> 0.0.
16. **Standing in a hole: fixed.** An open hole edges whoever stands in it out to its rim (not what is in the air
    over it). Time in an open hole: 0.3% -> 0.1%. `after-burrow-breach.mp4` 3.5-4.5 s (the Paladin at the rim).
17. **Hit size of a ring at the hole: follows the drawing.** It comes up at half size out of the hole's dark (the dark
    lies over it, deepest in the middle) and is hit at 30% growing to full. `after-burrow-breach.mp4` 3.4-4.6 s.
18. **Lunge into a column: it picks someone else, or waits** (a line under 170 long is not thrown).
19. **Frozen in mid-air: left.** It still hangs there for the freeze (about 1.3 s a fight with a frost hero). The game
    does not run a frozen thing's own moves, a boss's included; letting an arc carry on through a freeze, or making it
    unfreezable in the air, is a rule for the lead, not a fix. A call below.
20. **The roar can be hit** (a call below).
21. **Phase sound: plays at the roar** (for the wurm; the other designed bosses still have none: below).
22. **The Book: fixed.** Its face is painted by its own drawing (`def.picture`, one line in `js/inspect.js`); the
    preview's floor is the Dunes' sand; the page has words (`js/bestiary.js`); in the Book's 10 s loop it breaches
    once and then rears up and lunges, so the loop shows burrow, breach, rear-up, lunge and the stuck head.
    `tools/preview-check.mjs`: it is no longer in the "wrong scenario" list. `book-preview.mp4`, `book-preview-page.png`.
23. **Numbers: in the band** (table below).
24. **Death: redone.** Each ring that is out drops where it is, as itself (the same ring, the same head), tips, and
    sinks into the sand, which heaps over it. Its rings are no longer deaths of their own. The furrow and the holes
    belong to the room and stay after it. And the room is held 1.3 s before the floor ends (`BOSS_END_T`,
    `js/dungeon.js`: every boss; a call below). `after-death.mp4` 2.1-3.4 s (it falls at 2.1 s; the rings drop and sink; the room is still there after).
25. **Short arcs: it takes the first way with its whole length clear, else the longest of eight.**
26. **Arc height 96 -> 72** (the coil's 84 -> 66): less stretch and bunching, and the body is drawn nearer where it
    is hit.
27. **Fixed with 14**: the reach that minds walls; the bite's circle is kept inside the room.
28. **The neck and the heroes at it: fixed.** How high a ring is drawn and whether it has left the floor are now two
    things: a ring is "in the air" for the game (drawn over the floor, not solid) only from 30 up. The low rings of a
    reared neck are floor bodies, drawn by depth and solid; the head is over all. `after-rear-lunge.mp4` 7.7-8.5 s
    (the Paladin and Twinfang beside the neck, in plain sight).
29. **The Book**: with 22.
30. **Mound flash: fixed** (the mound is drawn only in the states where it runs under the sand).
    `after-burrow-breach.mp4` 4.7-5.4 s, frame by frame: hole, then the mound fading in beside it.
31. **Neck twitch: fixed** (the sway eases out and in). `after-rear-lunge.mp4` 9.7-10.0 s.

## Calls (small design changes; each easy to turn back)
- **Under the sand it can't be struck, but it is still followed** (`u.noStrike`): 4 above. Touches `sim.js` and
  `kits.js` (four lines). Dash and Fan of Knives still go off at the mound now and then (their own rules).
- **Its blows are 40% harder and it stays reared 8.5 s** (round 13's number; round 14 had made it 9.5): the party now
  has its blows and abilities ready when the wurm comes up, and won 97 of 100 at round 15's numbers. Breach 80 -> 112,
  landing 54 -> 76, lunge 97 -> 136, the bite 135 -> 189, the coil 116 -> 162. Health is as it was (more health made
  the fight long before it made it hard: 60% at 250 s).
- **The roar can be hit** like anything out of the sand (it was untouchable for its 1.6 s, and aimed at all the same).
- **The room is held 1.3 s after a boss falls** (`BOSS_END_T`): every boss, every floor's last room. The floor ended
  0.6 s after the boss fell; no boss's death could be watched.
- **An open hole can't be stood in**; a ring counts as in the air from 30 up, not 10.
- **The Book's words for it** (`js/bestiary.js`): a line of fun ("You never see all of it at once. That is the kindest
  thing about it.") and how it fights. The designer's to rewrite.
- **Left as it is: a frozen wurm hangs in the air** (19).
- **Left: in the Book's small stage the reared head can still touch a column** (the stage is 900 by 620 with the two
  columns in it; there is no spot 210 from both). `book-preview.mp4` 6.1-6.6 s. In the real room it keeps clear.

## Found, outside this lane
- **No designed boss has a face or words in the Book but the Bone King and the Elder Ent**: the Chieftain, the Ooze,
  the Queen, Cinder, the Seraph and the Engine show "How it fights." and those drawn in code a blank disc.
  `def.picture` (added here) and a `bestiary.js` entry would give each its own.
- **No designed boss plays the phase sound**: `sfx.js` reads `u.k.phase`, and only the Bone King keeps its state in
  `u.k`. A `cue('bossPhase')` in `boss-kit.js notePhase` would do it for all of them.
- **A hero left with nothing to aim at does not heal**: the Cleric's orbs and Sanctuary want a foe. It decided 4.
- This lane's port: 8936 was held by another lane's server (its "before" copy), so 8946 was used.

## Numbers
`node tools/runs.mjs --boss --bossid sandWurm --theme dunes --level L --party paladin,archer,cleric,twinfang --n 100`
(level 51 is where the campaign meets it; the band is 40-60% there). Before: `tools/wurm19/before-L*.txt`, the same on
today's main (0.31.1). After: `tools/wurm19/after-L*.txt`.

| | level 48 | level 51 | level 51, other seeds | level 54 | a fight at 51 |
|---|---|---|---|---|---|
| before | 52 | 67 | - | 87 | 153 s |
| after | 49 | 58 | 53 | 73 | 154 s |

Other parties at level 51 (`tools/wurm19/sweep.mjs --n 40`; before: 12 fights each, `probe-before-parties.txt`):
| | paladin, berserker, twinfang, tower | archer, pyromancer, frost, storm | paladin alone |
|---|---|---|---|
| before | 5 of 12 | 6 of 12 | 0 of 12 |
| after | 15 of 40 | 16 of 40 | 0 of 20 |

What the fight does, measured (`tools/wurm19/probe.mjs --n 30`, `probe-before.txt` / `probe-after.txt`):
| | before | after |
|---|---|---|
| rings out of the sand and not drawn | 19.9 s a fight | 0 (every ring that is out is drawn) |
| blows landing on the buried head (nothing happens) | 112.5 a fight | 10.8 |
| abilities thrown at the mound (Smite, Frost Arrow, Barrage, Backstab, Shield Bash) | 33.6 a fight | 0 |
| holes opened against a column | 43 of 1397 | 1 of 1413 |
| arcs that left the room | 9 of 572 | 0 of 577 |
| rings lying in a column | 31.7 ring-seconds in 30 fights | 1.0 |
| rings out of the room | 15.3 ring-seconds in 30 fights | 0.0 |
| heroes standing in an open hole | 0.3% of their time | 0.1% |
| a breach that catches nobody | 54% | 73% (the party is watching the mound, not striking it) |
| a lunge that catches nobody | 31% | 41% |
| frozen in mid-air | 1.4 s a fight | 1.9 s (left: see 19) |

## Checks
- `node --check` on every `js/*.js`; `sim.js` and `render.js` import in Node.
- `node tools/battles.mjs`: 528 battles, 0 problems, 11 ran out of time (the same eleven as on main).
- `node tools/preview-check.mjs`: threw 0, never fired 0, not offered 0; the wurm's preview is no longer in the
  monster previews' "wrong scenario" list (7 listed, none of them the wurm).
- No page errors in any of the after recordings.
- `main` (0.31.1) merged in before the last checks and clips.
