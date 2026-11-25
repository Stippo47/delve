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

What was done about each is below, written after the fixes.
