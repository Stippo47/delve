# Boss: the Great Engine (the Clockwork Foundry, floor 3)

Round 13, rebuilt from scratch. The designer, round 9: "You know the terraria skeleton boss? Yeah do that here.
Separate hands and head. Can have different abilities, but the body plan should be that." Round 12, on what was built:
"Redo from scratch. Also the should have arm segment between head and hands. Look at photos if you have to", and of its
spin: "Does not look good at all."

Code: `js/boss-engine.js` (every number in `GE`, `PHASE_AT`), its looks `js/boss-engine-fx.js`, shared tools
`js/boss-kit.js` and `js/boss-draw.js`. Art: drawn in code, as one figure with one outline.

## Who it is
One machine, Skeletron's body plan in iron and brass:
- a **furnace head**: a riveted iron dome riding on a turning cog, a brass furnace mouth with bars over the fire, a
  lamp for an eye that looks at whoever it wants, a pressure gauge, two smokestacks at its back;
- **two jointed arms**: a brass shoulder hub on each side of the head, an upper arm, an elbow gear, a forearm, a wrist.
  They bend at the elbow as the hands move and **telescope on bright piston rods** when they reach;
- the left arm ends in a **hammer**, the right in a **three-fingered claw**.

The head is the boss. Each hand is a unit of its own with its own health (11% of the head's): hit it enough and it
**breaks off** (the arm hangs back, wires sparking). The head **guards itself with its hands**: both up, it takes 75%
of every blow; one gone, all of it; both gone, 120%. A blow on a hand passes 30% of itself on to the head.
A broken hand is not rebuilt by a timer: 3.5 s later **two welder drones** fly in from the room's edge and weld at the
stump (9 drone-seconds to forge the hand back). Shoot them down and the hand stays off until the next pair (9 s).

## The arena: the Engine Room
Two chunks by two. An iron turntable set in the floor with a hazard ring, four boilers (pillars: they stop the claw's
line and the furnace beam). It hangs at the far end until a hero comes within 480.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Hammer Fall** | 1+ | scatter out of one circle; then **pile onto the hammer** while it is stuck in the floor | the arm reaches out and the hammer climbs up the screen over a red circle, hangs, drops: a dust wave; then the arm heaves at the stuck hammer |
| **Claw Grab** | 1+ | **free your friend**: hit the claw until its grip breaks | the claw draws back, fingers wide, a thin line shows; it shoots out on its pistons, snatches the first one it meets and hauls them to the furnace mouth |
| **Swat** | 1+ | not stand in the head's face | a quick backhand: a hand sweeps a steel crescent across the front |
| **Steam Vent** | 1+ (no hand free) | step back from the head | a white circle, then a ring of steam |
| **the Whirl** | 2+ | **run from it**: it drives at its mark | both arms lock straight out and the whole machine spins like a rotor, a crescent of blurred steel behind each hand, the circle of its reach moving with it |
| **Furnace Beam** | 3 | **get behind a boiler** (or out of the sweep) | the bars part, a white-hot beam sweeps 1.5 rad across the room, stopped by boilers; the floor glows where it passed |
| **the Pressure** | 3 | **break the valve before the gauge hits red** | it clamps its hands on its lid and shakes, a red valve wheel stands out of its back, heat creeps out across the floor; valve broken: it vents and hangs open; too late: the boiler blows |
| (always) **welder drones** | after a hand breaks | **kill the adds** to keep the hand off | two small drones welding at the stump, white arcs |

## Phase 1: Assembly (100% to 66%)
The hands take turns, one move every 2.6-3.6 s; the head drifts after its mark, keeping 170-290 off, turning slowly.
| move | tell | shape | hit |
|---|---|---|---|
| Hammer Fall | 1.05 s | a circle 100 where it comes down (within 470 of its shoulder) | 62, staggered, thrown. Then the hammer is **stuck for 1.7 s**: blows on it do 60% more |
| Claw Grab | 0.9 s | a line 560 long, 60 wide, from its shoulder (stopped by boilers), at the farthest hero as often as its mark | 25 on the catch; the caught hero is held at the furnace mouth: 7 and burn every 0.3 s for up to 3.2 s, then thrown (35). **Blows on the claw worth 3% of the Engine's health break the grip**: the hero drops free and the claw hangs open 1.4 s (blows on it +40%). The whole party is turned onto the claw while it holds someone. Bosses and anything dug in (Unstoppable) can't be carried: they are just hit |
| Swat | 0.6 s | a cone 200 long, 2.0 rad, from the head (a hero within 150) | 22, thrown hard |
| Steam Vent | 0.85 s | a circle 175 round the head, only when no hand is free to swat | 40, burn, thrown |

## Phase 2: Overdrive (66% to 34%)
**Turn:** a blast of steam round the head (a circle 230: 16, burn, thrown back), untouchable for 1.5 s, and **both
hands forged anew** at once. Hand moves come 10% quicker. New:
- **the Whirl**, every 15-18 s: 1.1 s winding up (a circle 306 shows), then 4.2 s spinning at up to 5.4 rad/s while it
  drives at its mark at 0.9x its pace (a hero who runs gets away). An arm passing over a hero: 26 and thrown (each hero at
  most once every 0.8 s). Its reach is 286: the arms lock straight.
  Then it hangs **dizzy for 1.7 s** (stars round its head, arms slack): blows on it do 35% more.

## Phase 3: Meltdown (34% to 0)
**Turn:** the same blast; the fire shows through its bars, the stacks glow, the floor under it is lit. Hand moves come
20% quicker, tells 15% shorter. New:
- **Furnace Beam**, every 12-14 s: 1.2 s tell (a line shows, the bars slide apart), then the beam sweeps 1.5 rad over
  2.7 s towards the side with more heroes: 12 and burn every 0.15 s in it. Boilers stop it.
- **the Pressure**, every 24-28 s: for 5.5 s it holds its lid down; a **valve** (7.5% of its health) stands out of its
  back and the party is turned onto it. Valve broken: the Engine vents for 3.2 s (blows +50%). Not broken: everyone
  within 520 takes up to 95 (less with distance), burn, thrown.

## Death
The hands fly apart, the dome drops, the cog rolls away across the floor in a cloud of steam; the welders fall with it.

## Why it's fun to watch
- It is one body: the arms reach, bend and stretch, and you can read which hand is about to do what.
- Three sub-targets with three different clocks: a hammer stuck for 1.7 s, a claw holding your healer, a valve against
  a gauge.
- Breaking a hand changes the fight (the head opens up, drones come) and the phase turn takes it back.

## Numbers
Health 640 (x1.4 for every boss, then the dungeon's strength and party size), drift 44, mass 14, phases at
66% and 34%. Shock x1.4, wet x1.3, poison 0.

Balance (`node tools/runs.mjs --boss --theme foundry --level 58 --party paladin,archer,cleric,twinfang`; the campaign
meets it with the starter four at about level 58): 60 fights: won 29 (48%), wins about 157 s (all fights about 145 s).
Health 600 gives 36 of 60 in 137 s, 680 gives 17 of 60 in 167 s. The knobs: health, `GE.guard`, the Whirl's pace
(`GE.whirl.speed`: at 1.7 it outran the heroes and won every fight), `GE.every`.

Tried and dropped: a guard of 60% / 100% / 135% (the fight turned on whether the first hand broke in its first stuck
window: phase 1 took 40 s or 90 s).
