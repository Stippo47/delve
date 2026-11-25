# Boss: the Sand Wurm (the Sunken Dunes, floor 3)

**Round 19 (lane wurm19): the same fight, its faults hunted down.** The designer: "It's good but has many misc problems."
What was found and what was done about each: `docs/wurm19.md`. This page is as the fight is now.

Round 13, rebuilt from scratch. The designer on round 12's wurm: "Just no. Bad not even going to comment." From the
roster they approved in round 9: "Burrows, then erupts under a hero: the ground shakes first"; from their deck note:
"Follow the leader segments, each with its own hit box. ... Burrowing enemies (leave being trail of dug up dirt)."

What was wrong before, as this lane reads it: the wurm crawled about on top of the sand like a snake, its burrow was a
blob sliding across the floor, and when it came up it simply appeared. So this one **lives under the sand**, and
everything it does sells that.

Code: `js/boss-wurm.js` (every number in `SW`, `PHASE_AT`), its looks `js/boss-wurm-fx.js`, shared tools
`js/boss-kit.js` and `js/boss-draw.js`. Art: drawn in code, one figure with one outline, in the sand serpent's colours.

## Who it is
A great wurm: a head with two bone mandibles that open on a red maw ringed with teeth, and **eleven plated segments**
that taper to a tail spike, thorned along their sides. The head is the boss; a blow on a segment passes half of itself
on. Only what is out of the sand can be seen or hit: under it, the party still follows the mound and backs off from it,
but holds its blows and its abilities (`u.noStrike`; round 19: they spent a third of the fight striking the sand).

## How the burrow is shown
- **The mound**: under the sand it is a swelling as wide as the wurm that runs across the room, slabs of crust tipping
  off its front, clods jumping, and it leaves a **furrow** behind: a churned track as wide as itself, clumps of every
  size thrown up along both edges, that lies for 4 s and then slumps back in one.
- **The heave**: where it will come up, the ground swells and its crust lifts in slabs, more and higher, for the whole
  tell (the circle on the floor fills as usual).
- **The breach**: the crust is thrown back, rays of sand shoot out along the floor round the hole as round a crater,
  clods are flung wide and dust rolls out; the wurm comes out of the hole and **arcs over** (its body rises up the
  screen and grows as it comes at you, its shadow on the floor under it), then **dives into a second hole**, its
  segments pouring out of the first and into the second along the same path. Each ring comes up out of the hole's dark
  at half size and goes down into it the same way. The holes are dark pits ringed with heaped sand; they close after
  the tail, and nobody can stand in one while it is open. Holes keep clear of the columns and the walls.
- **How it is drawn**: what is on the floor at a hole's mouth and what is up in the air are two lots, each one figure
  with one outline (`boss-draw.js figure`); the lot in the air is drawn over everyone on the floor (round 19's rule),
  and the body is drawn whether or not the head is out. A status washes the whole body evenly.

## The arena: the Sunken Court
Open rippled sand, two broken sandstone columns (they stop its lunge). It lies under the sand at the far end (a slow
mound) and comes for the party as soon as it walks in.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Breach** | 1+ | **get off the lifting ground**; then **hit the body as it pours past** | the heave, the fountain, the wurm arcing from one hole into another |
| **Lunge** (reared up) | 1+ | **sidestep a line**; then **hit the head while it is stuck** in the sand | the reared neck draws back, jaws opening, and strikes out; the head drives into the sand, which heaps over its jaws, and shakes |
| **Inhale** (reared up) | 1+ | **run from the maw against the pull** | the mandibles gape, streaks of sand and clods run to the maw from all round the room and the heroes slide with them; then the head draws back, darts out and its jaws clap shut, the sand jumping out to the bite's reach |
| **Sinking sand** | 2+ | **mind where you stand**: its holes stay as quicksand | the Dunes' own quicksand where each hole was, for 10 s |
| **the Brood** | 2+ | **kill the adds** | scarabs crawl out of each hole it leaves |
| **the Coil** | 3 | **stand in the middle of the ring** (or far outside) | the mound races twice round the party, the ring of ground between lifts in slabs, then the whole ring bursts and the wurm arcs out along it |

## The cycle
Under the sand it runs (420 a second) to where it wants to come up; then:
- **Breach**, two in a row (three in phase 3): a circle 120 under a hero, 1.15 s: 112, staggered, thrown high. It arcs
  300-400 over towards someone else (the first of eight ways with that much room, else the longest) at 440 a second,
  72 high at the top (about 2 s with its whole body out); a circle 90 where the head goes back in: 76.
- then it **rears up** out of a hole (the same circle and blow as a breach; at least 150 from a wall, 210 from a column) and stays 8.5 s,
  swaying after its mark (1.5 rad/s), about 170 of neck out (less where a wall or a column is in the way):
  | move | tell | shape | hit |
  |---|---|---|---|
  | Lunge, every 2.1-2.7 s | 0.8 s | a line 380 long, 92 wide from its hole (stopped by columns; with less than 170 clear it picks someone else, or waits) | 136, thrown. The head is **stuck 0.7 s**: blows on it do 45% more |
  | Inhale, once, 42% through | 0.8 s, then 2.7 s of pull | everyone within 640 is dragged towards the maw at 41-74 a second (bosses are not); a circle 150 at the maw fills the whole time | 189, thrown hard |
  then it sinks back down its hole.

## Phase 2: the Brood (66% to 34%)
**Turn:** it comes up in the middle of the room and roars for 1.6 s, jaws wide, sound lines bursting from the maw (a
circle 250, 1.0 s: 19, staggered, thrown back; the phase sound plays). It can be hit like anything out of the sand
(round 19; it could not be, and until round 19 a slip in the code kept it under the sand through the whole roar, so
neither turn was ever seen). Then every hole it leaves becomes **quicksand** for 10 s (at most six at once), and
**two scarabs** crawl out of each (at most five at a time).

## Phase 3: the Coil (34% to 0)
**Turn:** the roar. Each cycle now opens with **the Coil**: a ring from 150 to 345 round the middle of the party,
2.1 s: 162, staggered, thrown. The ring is laid so that no column stands on it. Then three breaches in a row and a shorter rear (6.8 s); tells are 12% shorter, lunges
come 20% quicker, the arc is 12% faster.

## Death
Each ring of it that is out of the sand drops where it is, tips, and sinks into the sand, which heaps over it; the
scarabs die with it. The furrow and the holes stay and close in their own time, and the room is held 1.3 s before the
floor ends (`BOSS_END_T`, js/dungeon.js: for every boss; it ended 0.6 s after the boss fell).

## Why it's fun to watch
- You watch the floor, not the boss: the mound coming, the ground lifting under someone.
- The breach is a set piece every few seconds, and the body pouring past is the party's window.
- Reared up it is a different fight: a fixed thing with a reach, a line to sidestep and a pull to run from.
- By phase 2 the floor is pocked with sinking sand and scarabs; in phase 3 the ring asks the party to bunch up, the one
  thing every other move punishes.

## Numbers
Health 660 (x1.4 for every boss, then the dungeon's strength and party size), mass 12. Phases at 66% and
34%. Wet x1.4.

Balance, round 19 (`node tools/runs.mjs --boss --bossid sandWurm --theme dunes --level 51 --party paladin,archer,cleric,twinfang --n 100`;
level 51 is where the campaign meets it, docs/balance/r15-bosses.txt; the band is 40-60%): see `docs/wurm19.md` for
the table before and after. Its blows are 40% harder than round 15 left them (breach 80 -> 112, landing 54 -> 76, lunge
97 -> 136, the bite 135 -> 189, the coil 116 -> 162): the party no longer burns its blows and abilities on the mound, so
it has them ready when the wurm comes up, and won 97 of 100 at the old numbers.
The knobs: `SW.breach.dmg` and the other blows, health, `SW.chain` (breaches before it rears), `SW.root.dur` (how
long the party gets at it). More health alone makes the fight long before it makes it hard (60% at 250 s).

It wakes as the party walks in (within 1500): a mound that has to be walked up to was 25 s of nothing.

Measured on the branch with main merged in (2026-11-22: round 13's hero ability pass and statuses, round 14's XP
curve). The level is the one the campaign reached this boss at in round 12; the new XP curve will have moved it:
**re-measure once the campaign has been run again**, and move health first.
