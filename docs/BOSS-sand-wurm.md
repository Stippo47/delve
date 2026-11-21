# Boss: the Sand Wurm (the Sunken Dunes, floor 3)

The Sunken Dunes' boss. The designer (round 9, the Sand wurm card): "Should probably be a boss." From the roster:
"Burrows, then erupts under a hero: the ground shakes first." From the deck note: "Snake enemies/ chains. Follow the
leader segments, each with its own hit box. ... Burrowing enemies (leave being trail of dug up dirt)." Built like the
Bone King (`docs/BOSS-bone-king.md`).

**Not wired yet:** the Dunes theme is lane R's (`roster3`). Until it names `sandWurm` as its boss, the wurm runs through
`?bossroom&boss=sandWurm` (any theme) and `lab.html?m=boss&boss=sandWurm`. Battle mode only lists it once a theme does.

Code: `js/boss-wurm.js` (numbers in `SW`, `PHASE_AT`), shared tools `js/boss-kit.js`, looks `js/fx-boss.js`
(`drawWurmHead`, `drawWurmSegment`, `drawDunes`). Art: PLACEHOLDER, drawn in code.

## Who it is
A great sand wurm: a round toothed maw (no eyes) and **eight ringed segments** that follow the head's path, each its
own hit box (a third of every blow on a segment gets through to it; the head takes it all). On the surface it hunts its
mark; then it dives, and while it's under the sand it can't be hurt and its body is gone, only a **mound of churned
sand** running across the room towards someone, leaving a trail of dug-up sand behind it.

## The arena: the Sunken Court
Open sand rippled with dunes, two broken sandstone columns. It lies coiled at the far end until a hero comes within 520.

## The cycle
**On the surface** for 4.5-6 s: it chases its mark (walk 60), bites, spits. Then **down**: a circle round it (110,
0.6 s: 36, thrown) as it dives into its own hole; the mound runs at its mark for 1.3 s; then it **erupts**:
| | tell | shape | hit |
|---|---|---|---|
| **Erupt** | 1.25 s: the ground shakes (a circle fills under its mark, where it's going) | a circle 125 | 110, thrown high, staggered |
| **the rear** | with it | a line 420 from the hole along the way it comes out, 80 wide | 80, thrown aside |
It bursts out of the hole and rears along the line, its body pouring out of the hole behind it.
On the surface: **Bite** (a hero close in front: a cone 165, 0.7 s, 100, thrown) and **Sand Spit** (every 3-4.5 s at
the heroes 180+ off: three balls of packed sand, circles 66, 65 and a stagger).

## Phase 2: the Quake (65% to 35%)
**Turn:** it rears and the sand shakes (a circle 240: 14, staggered, thrown). Now:
- **two eruptions in a row**: after the first it goes straight back under for a second, at someone else;
- every eruption sends out a **tremor**: a ring from 135 to 270 round the hole (safe at the hole itself, or far off),
  0.9 s after it comes up: 55, thrown.

## Phase 3: the Sinkhole (35% to 0)
**Turn:** the same shake. Its next dive, and a third of its dives after that, is the **sinkhole**: it goes down and the
middle of the room sinks into a swirling pit; for 5 s every hero is dragged towards the middle (95 a second) while a
circle 170 fills there; then it erupts out of the middle (120, thrown very hard) and rears.

## Death
It collapses on the sand; the segments go with it.

## Why it's fun to watch
- The mound: you see it coming across the room at someone, and the ground shaking where it will come up.
- The body pouring out of the hole after the head.
- The sinkhole: the whole party sliding into the middle, running against the drag.

## Numbers
Health 760 (round 12; was 900) (x1.4 for every boss, then the dungeon's strength and party size), walk 60, mass 12. Phases at 65% and 35%.

Balance (`node tools/runs.mjs --boss --theme spire --bossid sandWurm --level 62 --party paladin,archer,cleric,twinfang`:
the Spire's strength stands in for the Dunes', which roster3 is adding; level 62 is a guess a little past the Spire):
| | won | fight length |
|---|---|---|
| 10 fights, level 62 | 5 of 10 | avg 227 s |
Re-run against the Dunes' own strength once roster3 merges (knobs: health, the eruption's damage, `SW.surface`).

## Known placeholder gaps
While under the sand its head is hidden but its round floor shadow still shows; the real art pass should hide it.

## After main's round-10 balance pass (armour, cooldowns x1.22, poison's burst, 52 heroes)
Re-measured, not retuned (the lead tunes hero numbers first): the Dunes' own strength (`--theme dunes`), level 62: won 1 of 10, avg 214 s. Same command as above.
