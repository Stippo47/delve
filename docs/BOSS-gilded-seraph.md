# Boss: the Gilded Seraph, a biblically accurate angel (the Gilded Spire, floor 3)

Round 13, replaced. The designer, round 12, on the gold winged woman built before: "I want one of those biblically
accurate angels. 1 of it's abilities shoukd have horns. 4 chains from the corner of arena shoot out and if they hit
something they drag them towards that corner. The quality of this boss that was made was poor".

Code: `js/boss-angel.js` (every number in `AN`, `PHASE_AT`), its hall and moves `js/boss-angel-fx.js`, shared tools
`js/boss-kit.js` and `js/boss-draw.js`. Art: the art lane's round 10 sprite, `art/bosses/biblical-angel.svg` (drawn for
this lane: "a biblically accurate angel"); its two wheels are the sprite's two arm parts, turned by the fight
(`parts.js` reads `def.pose`). The kind's id is still `gildedSeraph` and its name still "The Gilded Seraph": the Spire's
theme, the Book and saves name it. **A call for the lead / the designer: keep the name, or rename it** (the Ophan, the
Watcher, the Throne).

**"Horns"**: this lane read it as **trumpets**, an angel's horns: four gold trumpets stand round it and sound. If the
designer meant horns on its head, the move is the place to put them.

## Who it is
No body at all: one great open eye in a gold socket, two golden wheels set with eyes that turn against each other
round it, and six wings. It hangs between the middle of the hall and whoever it wants, drifting, its eye on them. Its
light makes heroes radiant (slower, weaker; at full, a glow that can't attack). Radiance can't touch it.

## The arena: the Sanctum
Two chunks by two, white and gold, a great wheel inlaid in the floor, two pillars (they stop chains), and **a gold
ring bolted to the floor in each corner**: where the chains live. It waits at the far end until a hero comes within 480.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Smite** | 1+ | step out of one small circle | a circle on the floor, then the game's pillar of light |
| **the Chains** | 1+ | **sidestep a chain's line**; whoever is caught is dragged off to a corner: the party is pulled apart and has to come back together | each corner's ring glows and its chain rattles; a thin line shows from each corner to a hero; four gold chains shoot out along the floor, an open cuff at the end of each; a cuff that meets someone snaps shut and the chain hauls them back to its corner, where they are shackled a moment |
| **Wheel Within a Wheel** | 1+ | **step in, then out** (or stay close): two rings come down one after the other | its two wheels leave it (the sprite keeps only the eye and wings) and spread across the floor as great turning hoops set with eyes; the nearer drops, then the further |
| **the Trumpets** | 2+ | **break the horn that points at you** before its note ends (or get out of its cone) | four gold trumpets stand round it in a cross, bells out; their note climbs for 5 s (the bells swell and brighten, arcs of sound come quicker); each horn left whole sounds: bars of sound burst down its cone |
| **the Host** | 2+ | **kill the singers** | two choir singers rise at the hall's sides; a ribbon of song runs along the floor from each to the angel and a ring of it turns round the angel; they lob notes of light |
| **the Gaze** | 3 | **get out of its sight** (it turns slowly: get behind it) | its sight laid on the floor: a broad cone of gold light with rays in it, turning after its mark |

## Phase 1: the Watcher (100% to 60%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| Smite | every 2.8-3.6 s | 0.95 s | a circle 78 on a hero (where they will be) | 30, radiance 18 |
| the Chains | every 13-15.5 s | 1.15 s | four lines 44 wide, one from each corner at the hero nearest it (no hero gets two while there are others); up to 980 long; pillars stop them | 22 and radiance 14 on whatever a chain meets first. A hero is **dragged to that corner** at 540 a second and **shackled there 0.9 s** (rooted). Bosses and anything dug in (Unstoppable) are hit but not dragged |
| Wheel Within a Wheel | every 10.5-12.5 s | 1.35 s, then 2.15 s | a ring from 150 to 290 round it, then a ring from 290 to 430 | 44, radiance 28, thrown |

## Phase 2: the Host (60% to 30%)
**Turn:** a burst of light round it (a circle 220: 12, radiance, thrown; untouchable 1.3 s). Then also:
- **the Host**: two singers (4.5% of its health each) rise 300-520 from it. **While either sings, half of every blow on
  the angel is turned aside.** Each lobs a note of light every 3-4 s (a circle 60: 12, radiance 16). When both are dead
  the next pair comes 30 s after the last pair came.
- **the Trumpets**, every 21-25 s: four horns (3.2% of its health each) 104 out from it, one aimed at its mark. Each
  horn's cone: 470 long, 1.0 rad, 5.2 s: 56, radiance 40, thrown hard. A broken horn's cone is gone. **All four broken
  before they sound: it reels for 1.6 s, blows +30%.**

## Phase 3: the Open Eye (30% to 0)
**Turn:** the burst. Then also:
- **the Gaze**, every 15-18 s: 1.2 s tell, then for 5 s a cone 540 long, 1.5 rad, turning 0.5 rad/s after its mark:
  6 and radiance 13 every 0.25 s in it.
- the Chains are cast twice, 1.3 s apart; Smite falls on two heroes; the wheels come down a third time, on the middle
  (a circle 150 round it, 2.9 s: there is nowhere to stand but out past 430, or you move twice); cooldowns 15% shorter.

## Death
Its light goes out in a flash; the two wheels roll away across the floor and fall flat; feathers.

## Why it's fun to watch
- The chains are the designer's own picture: four at once from the corners, heroes yanked off across the hall.
- The wheels leave the body: the sprite is suddenly an eye with wings and its wheels are all over the floor.
- The trumpets are a clock everyone can see, and four things to break.
- Three different shapes of gold light: rings, cones, a sweeping sight.

## Numbers
Health 880 (x1.4 for every boss, then the dungeon's strength and the party size), drift 40, mass 8. Phases at 60%
and 30%.

Balance (`node tools/runs.mjs --boss --theme spire --level 49 --party paladin,archer,cleric,twinfang`; the campaign
meets it with the starter four at about level 49): 60 fights: won 27 (45%), wins about 152 s (all fights about
159 s). Health 850 gives 34 of 60 in 142 s.
The chains decide it: with their blow and shackle taken out the party won 24 of 30; at blow 30 and shackle 1.3 s, 1 of 10.
The knobs: health, `AN.chains` (dmg, shackle, cd), `AN.smite`.
