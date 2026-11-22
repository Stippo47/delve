# Boss: Cinder, the Old Drake (the Ember Deep, floor 3)

Round 13, rebuilt from scratch. The designer, round 9: "Very large, made of multiple components. No wings. No flying.
Fire call that drops fireballs from the sky as an ability. Scorch. Shoots a narrow cone of flames forwards head turning
slowly. Obstacles block it. More abilities." Round 12, on what was built: "Everything is off. The art. The attacks
visuals. How it is stuck in 1 spot. And so on".

So: **an animal that walks**. It is never still for long; its fire is the game's own fire; it is drawn as one creature.

Code: `js/boss-cinder.js` (every number in `CD`, `PHASE_AT`; the spine in `SPINE`), its looks `js/boss-cinder-fx.js`,
shared tools `js/boss-kit.js` and `js/boss-draw.js`. Art: drawn in code, one figure with one outline.

## Who it is
A long wingless drake, about 470 from snout to tail: a horned head on a neck, a deep chest, **four legs that step**
(each foot stays planted until its body has moved a stride on, then steps, one diagonal pair at a time), a tail that
tapers to a **bone blade**, dark scutes down its back, a slit of fire for each eye. Its body follows the path its head
walked, so it bends round pillars and round the party. The head turns towards its mark as it walks.

The head is the boss. Seven hit boxes ride along its spine (a blow on the body passes 35% on); the **tail blade** has
health of its own (8% of the drake's; 30% passes on): break it off and the drake reels (2 s, blows +30%) and the Tail
Sweep is gone for good. Fire can't hurt it; cold and wet bite (x1.3).

## The arena: the Pit
Two chunks by two, four basalt pillars (they stop the scorch and the rush), pools of fire at its edges (the game's fire
puddles, dressing). It waits at the far end until a hero comes within 500, then roars.

## How it moves
**The prowl**: it walks a circle about 250 out round its mark, head turned in, and turns about every 6-10 s or when a
wall or pillar shuts the way. Every move starts from the prowl and ends back in it.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Bite** | 1+ | not stand at its mouth | the jaw drops, the head darts; two rows of fangs snap shut, a lick of flame |
| **Scorch** | 1+ | **get behind a pillar**, or walk ahead of a slow sweep | it plants its feet; a narrow cone of the game's fire down the floor, tongues of flame streaming along it, the head turning slowly after its mark; the fire stops at rock |
| **Tail Sweep** | 1+ | **not stand behind it** (or break the blade off) | the tail winds to one side, then whips across everything behind the hips: a crescent |
| **Rush** | 1+ | **get out of its lane**; a pillar in the lane stops it | head down, the whole body thundering down a line 640 long; into rock: a crash, stars round its head |
| **Fire Call** | 2+ | **split up**: a fireball comes for each of you | it roars at the roof; a shadow gathers under each hero, then the Pyromancer's fireball comes down on it and bursts; the floor burns |
| **Ring of Fire** | 2+ | **fight penned in**: stay off the flames | it breaks into a run and goes the whole way round the party, fire falling from its jaws: a ring of flame 255 across that burns 11 s; then it scorches into the ring |
| **Molten** | 3 | watch the floor it has walked | cracks of fire across its flanks, ember rims on its scutes; fire drips where it walks |

## Phase 1: the Old Drake (100% to 66%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| Bite | a hero within 150 of its head, in front | 0.55 s | a cone 140 long, 1.3 rad | 67, burn 20, thrown |
| Scorch | every 9-11.5 s, its mark 130-500 off | 1.0 s | a cone 460 long, 0.44 rad, for 3 s, turning 0.55 rad/s | 14 every 0.15 s and burn 14 while in it |
| Tail Sweep | a hero within 150 of its tail, every 4-5.5 s | 0.75 s | a cone 215 long, 2.5 rad, from its hips backwards | 58, thrown hard |
| Rush | every 10-13 s, its mark 230+ off | 0.95 s | a line 640 (stopped by rock) | 65, burn, thrown aside. Into a pillar or wall: **dazed 1.7 s**, blows +35% |

## Phase 2: Fire Call (66% to 34%)
**Turn:** a roar (a circle 230: 14, burn, thrown back; untouchable for 1.3 s). Then also:
- **Fire Call**, every 10-12.5 s: one fireball on each hero (aimed where they will be) and three more beside them, each
  a circle 84, 1.4 s and a little later than the last: 57, burn 30; each leaves burning ground for 5 s.
- **Ring of Fire**, every 24-28 s: it runs the ring at 3.2x its pace (about 6 s); straight after, a Scorch.

## Phase 3: Molten (34% to 0)
**Turn:** the roar. It runs molten: fire drips from its body as it walks (a patch every 0.55 s, at most 14, 4 s each),
so its own prowl cuts the room up. The scorch turns 45% faster and lasts 20% longer, the fire call brings six extra
fireballs and comes 25% sooner, it prowls 15% faster and everything else is 15% quicker. A Ring of Fire opens the phase.

## Death
It falls where it walks: its body breaks up along its length in flame and dust.

## Why it's fun to watch
- It is alive: the feet step, the body bends through the room, the head watches whoever it is hunting.
- The room fills with drake, and the party has to fight round it: its mouth, its flanks and its tail are three places.
- The ring is a set piece: you see it run the whole circle, and then everyone is inside it.
- By the end the floor is its trail.

## Numbers
Health 880 (x1.4 for every boss, then the dungeon's strength and the party size), walk 56, mass 12. Phases at 66%
and 34%.

Balance (`node tools/runs.mjs --boss --theme ember --level 43 --party paladin,archer,cleric,twinfang`; the campaign
meets it with the starter four at about level 43): 60 fights: won 32 (53%), wins about 164 s (all fights about 167 s).
Health 840 gives 36 of 60 in 161 s. The knobs: health, the damage numbers above (they went up by half from round 12's,
because a drake that walks is hit by more of the party more of the time), `CD.ring.cd`.
