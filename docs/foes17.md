# Trolls' boulders and chain movement (round 17, lane foes17)

## Job 1: "the troll shaped enemies not being able to get their boulders"

Kinds: the troll and rock troll (`boulderBrain`, js/foes9.js; the elite rock troll calls its boulder back), and the
yeti with its snowball (js/foes10.js, its own ball code). No other kind uses `boulderBrain`.

### Causes found (tools/foes17/boulders.mjs, jams.mjs, watch-troll.mjs)

1. **Its own boulder was in the way of every path.** `goalVec` (sim.js) checks a straight line with `pathClear`
   (path.js), which counts every round obstacle, the boulder in the troll's own fists included. So a troll holding
   its boulder never had a clear line anywhere and crept from grid cell to grid cell on the A* route; and a line to a
   loose boulder always ended inside it.
2. **It steered off its own loose boulder** (sim.js `steer` avoids every pillar but a held one), so the last stretch
   to it was slow and sideways.
3. **The round-14 jam rule made it stand by its boulder.** Wedged with the boulder (in dungeons almost always a hero
   pressed against the boulder, or a hero in a gap), it let the boulder go and fought bare-handed for 6 s whatever
   happened, even with the boulder lying against it; then took it up, wedged again 3 s later, and so on. In 10 Crypt
   runs this was 131 jams, most of them a hero right at the boulder.
4. **A boulder it can't reach** (in a gap or pocket too narrow for it, behind its friends) was given up for 6 s and
   tried again, for good. Its "getting nowhere" test was its own movement, so a troll sliding to and fro along rocks
   in front of the boulder never even counted as stuck.
5. **The elite rock troll's recall** rolled the boulder through the troll (a fast own boulder passes through it) and
   out the far side; the pick-up wanted it slow, so it went back and forth.
6. **The yeti's snowball against a wall or in a corner:** the yeti only ever goes to the spot behind the ball on the
   line to its target. When that spot is inside the wall, it stood at the wall for good (0 of 20 in every staged
   wall, corner and pocket). The path finder also routed it straight through its own ball (the ball isn't in the
   grid) while the steering pushed it off: it dithered beside the ball.

### Fixes

- path.js `pathClear` / `findPath` take a `skip` test; sim.js `goalVec` skips a troll's own boulder (held, or the
  one it is walking to). `steer` doesn't avoid a troll's own loose boulder.
- foes9.js: reach 16 -> 26 past touching; a recalled boulder is caught as it comes. Wedged while holding: with a hero
  at the boulder, or a clear line to its mark, the release is just its throw (no rest: it goes for the boulder at
  once); only with no line, the bare-handed rest, now 4 s. A boulder it can't get to (no nearer by 20 in 3 s, not
  counting while the boulder rolls or the troll is knocked about): **it tears a new boulder out of the floor** (a
  1.1 s stoop, the floor cracking in front of it; the old one crumbles). My call: the yeti already leaves an
  unreachable ball to melt and packs another, and the troll's elite move is ripping up the floor, so this is the same
  rule, not a new one. The round 14 fixes hold: no hold without its tell running, and a boulder is never held in a
  gap for more than the 3 s jam.
- foes10.js (yeti): `pushWay` picks the push direction nearest the one it wants that works (its body fits behind the
  ball, the ball has room ahead), so a ball on a wall is pushed along it or off it; when none works (a corner, a
  pocket) it **hauls the ball out backwards**, hands on the front of it (`haulTick`; `snowTick` drags the ball after
  its hands); it walks round its ball on a circle just clear of it; a ball it gets nowhere with for 9 s, or hauls
  twice with no way to push it, it leaves to melt and packs another.

### Numbers

Staged (tools/foes17/boulders.mjs, 20 seeds, the boulder left loose and still, the hero rooted far off; "back" = in
its hands within 6 s; staged-before.txt / staged-after.txt):

| | before | after |
|---|---|---|
| troll / rock troll: open, wall, corner, pillar, pocket, friends, knocked | 20/20 each | 20/20 each |
| troll / rock troll: in a ring of rocks it can't enter | 0/20 (never) | a new boulder in hand in 6.0 s median, 20/20 |
| elite rock troll (recall), median | 5.1-5.4 s (19/20 in three spots) | 1.3-1.6 s, 20/20 everywhere (ring too) |
| yeti: against a wall | 0/20 | 20/20 (4.5 s) |
| yeti: in a corner | 0/20 | 20/20 (5.2 s, hauled out) |
| yeti: in a pocket of rocks | 0/20 | 20/20 (4.6 s) |
| yeti: in a ring it can't enter | 0/20 | a new ball in 1.9 s, 20/20 |

Dungeon runs (`--dungeon`, only these kinds in the rooms, the starting party at level 6, 10 runs a dungeon; every
time it lets go, how long until it has a boulder in its hands again; before-/after-dungeon-*.json):

| | taken up within 6 s, before | after | mean wait before -> after |
|---|---|---|---|
| trolls, Warren | 465/567 (82%) | 386/411 (94%) | 2.1 -> 1.4 s |
| trolls, Crypt | 423/609 (69%) | 602/623 (97%) | 2.9 -> 1.1 s |
| trolls, Foundry | 234/297 (79%) | 239/249 (96%) | 2.0 -> 1.2 s |
| yetis, Frost Hollow | 329/411 (80%) | 437/546 (80%) | 3.7 -> 3.0 s |
| yetis, Crypt | 407/510 (80%) | 507/597 (85%) | 3.4 -> 2.4 s |

Fewer lets-go for trolls after: fewer jam releases. The yeti's remaining slow ones are mostly by design: it leaves
its ball to brawl with a hero at its side (2.5-4 s), and two or three yetis' balls jostle in one room.

## Job 2: segmented snake movement

Chain kinds: the **sand serpent** (Dunes; head and 6 coils) and the **chain crawler** (Foundry; head and 8 plates).
The **Sand Wurm** (boss) has its own path-riding body (boss-wurm.js, segments on its breach arc); left as it is.

What changed (js/families.js chains; dunes.js, foundry.js defs; foe-draw.js; render.js):

- **Follow the leader**: the head's path is a trail of points laid by distance (one every 3 units it moves); each
  link rides a fixed distance along it, so the body lies along the path and the spacing along it is the same at any
  speed; when the head stops, the body lies still. The gap is now about a link's own length (serpent 26 -> 52, crawler
  28 -> 38: chained back to front, just overlapping, not stacked). Bodies are longer: serpent 156 -> 357 units with the
  tail, crawler 224 -> 337.
- **Same size links, a tapering tail**: no taper down the body any more; one tail link at the end, its art cut to a
  point (foe-draw.js `taperPath`, def.tailShape), its hit circle 0.62 of a link's, 0.86 of a gap behind the last link.
- **Knocks and sharp corners**: a knock back into its own body, or any corner too sharp (a link nearer the one before
  than 0.88 of its gap), and the body is laid as a chain instead: each link its own gap from the one before, along the
  line it lay on, and the trail laid again along it. In its own walk the head turns no tighter than 0.8 of a gap in
  radius, so it can't curl up in a knot; and a strike or lunge that would go back through its own body waits until it
  has turned round. Under the sand none of this applies (it may double back; links go under as they reach the hole).
- **Bursts and slither** (only in its own walk; not in a strike, a lunge, under the sand, stunned, rooted): a beat of
  surge then glide (serpent: 1.1 s beat, up to 2.2x its pace over the first 40%, 0.7x after; crawler: 0.9 s beat,
  2.2x over the first 35%, 0.75x after; about its old pace on average); its heading swings either side as it goes
  (serpent 0.5 rad, a full swing every 3.4 gaps; crawler 0.22 rad every 4 gaps), tied to the distance travelled, so the
  wave lies in the ground and travels down the body as it follows (path swing about +-14 units for the serpent, +-7
  the crawler).
- **Lying flat**: `def.flat` (render.js): no step bounce or breathing; the serpent's strike tell draws its head back
  along the floor instead of lifting it.
- **One body or own outlines**: the default is the one body (round 13). `?chainlines=own` draws each link with its own
  outline, tail first. For the designer to pick.
- Kept: each link's own hit circle; a blow or status on a link goes to the head (x0.6); links don't shove each other
  or the head; side changes (turnSide / restoreSide) take the tail too; the head's death takes the whole chain.

Numbers (tools/foes17/chains.mjs, 8 seeds; chains-before.txt): the distance from each piece to the one in front, as a
share of its link, after every step:

| | straight | sharp turn | stop | knock back | dive |
|---|---|---|---|---|---|
| serpent before | 0.93-1.15 | 0.46-1.60 | 0.93-1.15 | 0.10-1.28, links on top of each other 1.2 s a run | 0.73-1.15 |
| serpent after | 0.99-1.06 | 0.88-1.06 | 0.99-1.06 | 0.87-1.06 | 0.91-1.05 |
| crawler before | 0.92-1.15 | 0.45-1.26 | 0.92-1.15 | 0.10-1.23, 2.0 s a run | |
| crawler after | 0.99-1.08 | 0.94-1.08 | 0.99-1.08 | 0.88-1.08 | |

## Clips (docs/clips/foes17/, not in git)

- `troll-slot-before.mp4` / `-after.mp4`: its boulder in a ring of rocks with a gap too narrow for it. Before: it
  stands at the rocks for good. After: it walks round, the old boulder crumbles and it tears a new one out of the
  floor, then goes for the paladin.
- `yeti-wall-before/after.mp4`, `yeti-corner-before/after.mp4`: its ball against the top wall / in the corner.
- `sandSerpent-after.mp4`, `chainCrawler-after.mp4` (and `-before`): a run, a turn as the hero is moved behind it, a
  stop, a knock back. `sandSerpent-own-outlines.mp4`: the same with `?chainlines=own`.

## Not done

- The Dunes serpent coil's head diamonds ("2 different diamond shapes on the head segment"): they are in the head's
  SVG (art/enemies/serpent-head.svg: two kites with an inner kite, and a smaller one on the crown), not the draw code.
