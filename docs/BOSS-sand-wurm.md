# Boss: the Sand Wurm (the Sunken Dunes, floor 3)

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
on. Only what is out of the sand can be seen or hit.

## How the burrow is shown
- **The mound**: under the sand it is a swelling that runs across the room, slabs of crust tipping off its front, grit
  jumping, and it leaves a **furrow** of heaped sand behind that slumps back over about 6 s.
- **The heave**: where it will come up, the ground swells and its crust lifts in slabs, more and higher, for the whole
  tell (the circle on the floor fills as usual).
- **The breach**: the crust is thrown back, spouts of sand stand up out of the hole, clods are flung wide; the wurm
  comes out of the hole and **arcs over** (its body rises up the screen and grows as it comes at you, its shadow on the
  floor under it), then **dives into a second hole**, its segments pouring out of the first and into the second along
  the same path. The holes are dark pits ringed with heaped sand; they close after the tail.

## The arena: the Sunken Court
Open rippled sand, two broken sandstone columns (they stop its lunge). It lies under the sand at the far end (a slow
mound) and comes for the party as soon as it walks in.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Breach** | 1+ | **get off the lifting ground**; then **hit the body as it pours past** | the heave, the fountain, the wurm arcing from one hole into another |
| **Lunge** (reared up) | 1+ | **sidestep a line**; then **hit the head while it is stuck** in the sand | the reared neck draws back, jaws opening, and strikes out; the head buries itself and shakes |
| **Inhale** (reared up) | 1+ | **run from the maw against the pull** | the mandibles gape, streaks of sand run to the maw from all round the room and the heroes slide with them; then the jaws snap shut |
| **Sinking sand** | 2+ | **mind where you stand**: its holes stay as quicksand | the Dunes' own quicksand where each hole was, for 10 s |
| **the Brood** | 2+ | **kill the adds** | scarabs crawl out of each hole it leaves |
| **the Coil** | 3 | **stand in the middle of the ring** (or far outside) | the mound races twice round the party, the ring of ground between lifts in slabs, then the whole ring bursts and the wurm arcs out along it |

## The cycle
Under the sand it runs (420 a second) to where it wants to come up; then:
- **Breach**, two in a row (three in phase 3): a circle 120 under a hero, 1.15 s: 113, staggered, thrown high. It arcs
  300-400 over towards someone else at 440 a second (about 2 s with its whole body out); a circle 90 where the head
  goes back in: 68.
- then it **rears up** out of a hole (the same circle and blow as a breach) and stays 8.5 s, swaying after its mark
  (1.5 rad/s), about 170 of neck out:
  | move | tell | shape | hit |
  |---|---|---|---|
  | Lunge, every 2.1-2.7 s | 0.8 s | a line 380 long, 92 wide from its hole (stopped by columns) | 97, thrown. The head is **stuck 0.7 s**: blows on it do 45% more |
  | Inhale, once, 42% through | 0.8 s, then 2.7 s of pull | everyone within 640 is dragged towards the maw at 41-74 a second (bosses are not); a circle 150 at the maw fills the whole time | 135, thrown hard |
  then it sinks back down its hole.

## Phase 2: the Brood (66% to 34%)
**Turn:** it comes up in the middle of the room and roars (a circle 250, 1.0 s: 19, staggered, thrown back; it can't
be hurt for the 1.6 s it is up). Then every hole it leaves becomes **quicksand** for 10 s (at most six at once), and
**two scarabs** crawl out of each (at most five at a time).

## Phase 3: the Coil (34% to 0)
**Turn:** the roar. Each cycle now opens with **the Coil**: a ring from 150 to 345 round the middle of the party,
2.1 s: 116, staggered, thrown. Then three breaches in a row and a shorter rear (6.8 s); tells are 12% shorter, lunges
come 20% quicker, the arc is 12% faster.

## Death
Each ring of it that is out of the sand slumps and scatters; the scarabs die with it.

## Why it's fun to watch
- You watch the floor, not the boss: the mound coming, the ground lifting under someone.
- The breach is a set piece every few seconds, and the body pouring past is the party's window.
- Reared up it is a different fight: a fixed thing with a reach, a line to sidestep and a pull to run from.
- By phase 2 the floor is pocked with sinking sand and scarabs; in phase 3 the ring asks the party to bunch up, the one
  thing every other move punishes.

## Numbers
Health 660 (x1.4 for every boss, then the dungeon's strength and party size), mass 12. Phases at 66% and
34%. Wet x1.4.

Balance (`node tools/runs.mjs --boss --theme dunes --level 54 --party paladin,archer,cleric,twinfang --n 100`):
100 fights: won 50, wins about 160 s (all fights about 147 s).
The knobs: `SW.breach.dmg` and the other blows, health, `SW.chain` (breaches before it rears), `SW.root.dur` (how
long the party gets at it).
Before main's hero pass was merged it was even at health 620 and blows a quarter softer; after it the party won 55
of 60 there, and more health did not make it harder (49 of 60 at 860, in 194 s): its blows went up by 35%.

It wakes as the party walks in (within 1500): a mound that has to be walked up to was 25 s of nothing.

Measured on the branch with main merged in (2026-11-22: round 13's hero ability pass and statuses, round 14's XP
curve). The level is the one the campaign reached this boss at in round 12; the new XP curve will have moved it:
**re-measure once the campaign has been run again**, and move health first.
