# Boss: Cinder, the Old Drake (the Ember Deep, floor 3)

Round 13, rebuilt from scratch; round 19 (lane drake19), its body, its attacks and its pace redone. The designer,
round 9: "Very large, made of multiple components. No wings. No flying. Fire call that drops fireballs from the sky as
an ability. Scorch. Shoots a narrow cone of flames forwards head turning slowly. Obstacles block it. More abilities."
Round 12, on what was built: "Everything is off. The art. The attacks visuals. How it is stuck in 1 spot. And so on".
Round 19: "Body moves weird, don't like how it attacks. Very slow, etc." (what was found and done: `docs/drake19.md`).

So: **an animal that hunts**. It is never still for long; it strikes every two or three seconds with whatever part of
it is nearest; its fire is the game's own fire; it is drawn as one creature.

Code: `js/boss-cinder.js` (every number in `CD`, `PHASE_AT`; the spine in `SPINE`, `bendOf`, `stiffOf`), its looks
`js/boss-cinder-fx.js`, shared tools `js/boss-kit.js` and `js/boss-draw.js`. Art: drawn in code, one figure with one outline.

## Who it is
A long wingless drake, about 470 from snout to tail: a horned head on a neck, a deep chest, **four legs that step**
(each foot stays planted until its body has moved a stride on, then steps, one diagonal pair at a time; faster and
longer steps the faster it goes), a tail that tapers to a **bone blade**, dark scutes down its back, a slit of fire
for each eye.

**Its body is a spine** (round 19): a chain of joints dragged behind the head, so a turn of the head runs down the
neck and through the body as a curve and no part of it moves faster than the head does. No joint bends past its limit
(a supple neck, a stiff trunk, a freer tail), the trunk eases bends out, pillars push the body aside and the walls
keep it in. It cannot kink or knot. The head turns on its neck up to 1.5 rad from where its chest points, quickly;
the body comes round by walking, in curves. The **tail** is three springs: it trails, swings out when the hips turn
and whips base first. It breathes; its chest swells before the scorch; it gathers itself before the rush.

The head is the boss. Seven hit boxes ride along its spine (a blow on the body passes 35% on); the **tail blade** has
health of its own (8% of the drake's; 30% passes on): break it off and the drake reels (2 s, blows +30%) and the Tail
Sweep is gone for good. Fire can't hurt it; cold and wet bite (x1.3).

## The arena: the Pit
Two chunks by two, four basalt pillars (they stop the scorch and the rush), pools of fire at its edges (the game's fire
puddles, dressing). It sleeps curled up at the far end until a hero comes within 500, then roars.

## How it moves
**It hunts in passes.** It comes at its mark, goes by close on one side and on past; a mark who is then close beside
or behind it is left there for a moment (it goes on 160, its tail towards them: it does not wind round on the spot);
then it wheels round on them at a run and comes again. So its mark is in front of it as it comes (the bite, the scorch,
the rush), beside it as it passes (the claw) and behind it as it goes (the tail).

**It turns like a long animal.** Its head can lead no more than 1.1 rad to either side of the way its chest points, so
its body has to come round with it in a curve (a turn is about 280 across); held up against a wall, a pillar or a
hero, the head is let further round until it is free. Its head and neck are quick on top of that (1.5 rad either
side, for a bite or a look). It walks at 84 (it was 56; 1.5x when its mark is over 320 off or when it wheels, 1.15x
molten). Every move starts from the prowl and ends back in it; between two moves of its head and feet it takes
0.55-0.95 s.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Bite** | 1+ | step out from in front of its mouth | the head swings round on its neck and rears back, jaws wide and a glow in the throat; then it darts a body's length and the jaws clap shut: a white crack, two arcs closing, a lick of flame |
| **Claw** | 1+ | **not hug its chest** | the foreleg on that side lifts and reaches forward, then rakes out and back along its flank: three furrows through the air, whoever was there thrown off |
| **Tail Sweep** | 1+ | **not stand behind it** (or break the blade off) | the tail winds to one side, then whips across everything behind the hips, base first, the blade last: a crescent that rides with the hips as it walks |
| **Scorch** | 1+ | **get behind a pillar**, or walk ahead of a slow sweep | it breathes in (chest swelling, head drawn back, sparks pulled into its mouth); then a narrow cone of the game's fire down the floor, tongues of flame streaming along it, the head turning slowly after its mark as it creeps forward, tail lashing; the fire stops at rock |
| **Rush** | 1+ | **get out of its lane**; a pillar in the lane stops it | it gathers (drawn back, low, feet bunched under it, dust at its hind feet), then gallops down a line past the furthest hero in front of it; it ends in a skid, feet digging in, head coming round; into rock: a crash, stars round its head |
| **Fire Call** | 2+ | **split up**: a fireball comes for each of you | it roars at the roof; a shadow gathers under each hero, then the Pyromancer's fireball comes down on it and bursts; the floor burns. It is already hunting again as they fall |
| **Ring of Fire** | 2+ | **fight penned in**: stay off the flames | it breaks into a run and goes the whole way round the party, fire falling from its jaws: a ring of flame 255 across that burns 11 s; then it scorches into the ring |
| **Molten** | 3 | watch the floor it has walked | cracks of fire across its flanks, ember rims on its scutes; fire drips where it walks |

## Phase 1: the Old Drake (100% to 66%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| Bite | a hero within 170 of its head and within 1.3 rad of where its chest points; every 3-4 s | 0.5 s | a cone 188 long, 1.0 rad, from where the head was; the head darts 108 | 70, burn 20, thrown |
| Claw | a hero within 112 of its shoulders, at its side; every 3.4-4.4 s | 0.42 s | a cone 138 long, 2.2 rad, from the shoulder out to that side | 46, thrown |
| Tail Sweep | a hero within 150 of its tail; every 4-5.2 s (it goes on walking) | 0.73 s | a cone 215 long, 2.5 rad, from its hips backwards | 70, thrown hard |
| Scorch | every 7.5-9.5 s, a hero 140-500 off within 1.25 rad of its chest | 0.75 s | a cone 460 long, 0.44 rad, for 2.4 s, turning 0.6 rad/s after that hero, creeping forward | 15 every 0.15 s and burn 13 while in it |
| Rush | every 6.5-9 s, at the furthest hero 190+ off within 1.2 rad of its chest, with 260 clear | 0.7 s | a line to 190 past them (260-640), stopped by rock | 78, burn, thrown aside. Into a pillar or wall: **dazed 1.7 s**, blows +35% |

Each clock runs whenever it is free to move (round 19: a move's clock ran only while that move could be used).
Its moves tell `js/threat.js` when they will land (`u.strikes`: the rush on whoever is in its lane, the scorch on
whoever is in the cone), so a dodge or a guard can be timed against them; the bite, the claw and the tail are zones
that carry their blow, which it already read.

## Phase 2: Fire Call (66% to 34%)
**Turn:** a roar (a circle 230: 17, burn, thrown back; untouchable for 1.3 s). Then also:
- **Fire Call**, every 10-12.5 s: one fireball on each hero (aimed where they will be) and three more beside them, each
  a circle 84, 1.4 s and a little later than the last: 62, burn 30; each leaves burning ground for 5 s. It stands
  roaring 0.75 s and is on its way again before the first lands.
- **Ring of Fire**, every 24-28 s: it runs the ring at 3.5x its pace (about 6 s); straight after, a Scorch.

## Phase 3: Molten (34% to 0)
**Turn:** the roar. It runs molten: fire drips from its body as it walks (a patch every 0.55 s, at most 14, 4 s each),
so its own prowl cuts the room up. The scorch turns 45% faster and lasts 20% longer, the fire call brings six extra
fireballs and comes 25% sooner, it prowls 15% faster and everything else is 15% quicker. A Ring of Fire opens the phase.

## Death
It falls where it stands, and stays: its legs give way, the head rolls aside with the jaw slack, its colour cools to
char as its fire goes out. The husk lies in the room (which is held 1.3 s before the floor ends, `BOSS_END_T`).

## Why it's fun to watch
- It is alive: the spine bends, the feet step, the tail swings out on a turn, the head snaps round on its neck.
- It comes at you. Its mouth, its flanks and its tail are three places, each with its own blow, and a pass shows all three.
- The ring is a set piece: you see it run the whole circle, and then everyone is inside it.
- By the end the floor is its trail.

## Numbers
Health 800 (x1.4 for every boss, then the dungeon's strength and the party size), walk 84, mass 12. Phases at 66%
and 34%.

Balance (`node tools/runs.mjs --boss --bossid cinder --theme ember --level 44 --party paladin,archer,cleric,twinfang --n 100`;
level 44 is where the campaign meets it, docs/balance/r15-bosses.txt; the band is 40-60% there): see `docs/drake19.md`
for the table (before 40 and 46 of 100; after in the band).
The knobs: the damage numbers above (the scorch's tick first: it is what kills), health, `CD.ring.cd`.
