# Boss: Old Longlegs, the IK spider (a test boss: in no dungeon yet)

Round 19, lane spider19. The designer: "Make a new boss. Doesn't have to be in a dungeon yet. Mostly to test the
shape. An IK spider. Its head/body is always flying / in the air. It has 6 legs that keep it up and walk on the
ground. Its attacks are stomps and slamming its head into the ground; if it doesn't hit something it is stunned on the
ground for a second. Each leg has its own hp and will break when the foot is destroyed. The leg will still show but
badly damaged and can't attack; each leg damaged makes the time the head spends on the ground longer and how fast it
can move [slower]. Before slamming its head it will have a telegraph circle underneath it as it walks for a bit, then
will pause for a split second and slam. You can add additional abilities."

Code: `js/boss-spider.js` (every number in `SP`, `PHASE_AT`, the legs in `LEGS`), its looks `js/boss-spider-fx.js`,
shared tools `js/boss-kit.js` and `js/boss-draw.js`. Art: drawn in code, as one figure with one outline. The name is a
working name.

Where to fight it: the boss room `?bossroom&boss=ikSpider` (any theme; `&bossmove=walk|stomp|slam|web|brood|legs1..6|legs3m`
opens with that); battle mode, on the tab "No dungeon yet" (always open; it fights at the third dungeon's strength);
the Book, Monsters, "No dungeon yet" (its page is open without meeting it); the bench `lab.html?m=boss&boss=ikSpider`.
It is in no dungeon's roster.

## Who it is
A plum-coloured spider about four heroes long, carried well off the floor on six legs.
- **The body**: a round thorax with a bone face plate, two bone fangs and four ember eyes, and a bigger abdomen behind
  with a pale hourglass on its back. It hangs 44 over the floor: drawn that much up the screen, bigger for being nearer,
  with its one shadow on the floor point under it (the shared shadow layer; two discs, thorax and abdomen, so the
  shadow is as long as it is).
- **The legs**: each is a dark thigh from a hip on the thorax up to a round knee, and a shin down to the floor that ends
  in a **bone greave** tapering to a point. The greave is the foot: the part to hit. It cracks as the foot is hurt (one
  crack under 70% health, two under 35%).
- **A broken leg** is grey: the thigh hangs from the hip to a knee resting on the floor, the shin is snapped (a
  splintered stub, a strand of sinew) and the greave lies out of line, dragged along behind as the body goes.

How the picture is made (so it can be judged, or changed): the fight keeps each foot's place on the floor, each hip's
place on the body and the body's height. The drawing solves each knee from those in three dimensions (`knee3`: two
bones of 66 and 88, bent upwards and a little out to the leg's own side), then puts hip, knee and foot on the screen the
way the game shows all height, as a shift up the screen. Nothing is posed by hand: a leg that reaches further
straightens, a body that drops makes every knee jut. A knee is shown at only 35% of its height over the hip (a call:
at its true height a knee on the near side of the body is drawn over the body and its face). Legs whose hips are on
the far side of the body are drawn under it, the near ones over it.

## The legs: standing, walking, turning
- **Feet stay planted.** A foot's place on the floor only changes while it steps, stomps, or (broken) is dragged.
- **The gait** is two tripods taking turns: front and rear of one side with the middle of the other. Each foot has a
  place it belongs (126 from the body's floor point, at its own angle). When a tripod's feet have fallen 26 behind
  their places, and the other tripod is planted, they lift together (a hair apart) and swing in an arc 16-30 high for
  0.17-0.3 s to a spot ahead of their place, so the body walks over them. How far ahead is set so that the other
  tripod's turn falls half way through this one's stride: an even one-two, not two quick steps and a wait.
- **Turning** moves every foot's place round the body; the feet follow in the same tripods, so turning on the spot is
  the same walk in a circle. It turns at 1.15 rad/s.
- **Stopped**, feet more than 12 from their places step home.
- **The body rides on them**: it dips while a tripod is in the air and leans a third of the way after its feet.
- A foot never lands outside the room or in a pillar. A leg stretched to 93% of its length steps at once.
- **A broken leg** takes no part: its foot is pulled along once it is 108 from its hip, and nudged back to its own side
  if the body walks over it. The other legs go on in their tripods; never more than half of them in the air.

## Layers: what reaches what
- **Aloft** (its body 30 or more over the floor) it is on the **flying** layer (round 18's rule): only shots reach the
  body; blades, slams, zones, pools and bodies on the floor don't. Heroes walk under it. It is drawn over everything on
  the floor. The unit stands where the body is drawn, so shots land on the body you see.
- **Its feet** are on the floor: each a hit box of its own (a circle of 19 at the greave's point), with its own health.
- The party splits itself by that: those who fight hand to hand go for the feet, those who shoot go for the body
  (the fight tells the heroes' targeting so: body out of reach of a blade, feet left to the blades).
- **On the floor** (stunned after a missed slam, or collapsed) the body is on the floor layer: everything reaches it,
  and it is drawn among the floor's units.

## The feet rule
- Each foot has **10% of the body's health**. A blow on a foot also hurts the body, **85%** of it (one blow that
  catches several feet: 85% once and a quarter of that for each more), so the fighters are never wasting their time.
- **A foot destroyed breaks its leg** (bone chips fly; the body lurches and stands still 0.4 s). That leg cannot stomp
  and carries nothing. If it was lifted to stomp, the stomp never lands.
- **Each broken leg**: it walks slower (90%, 78%, 66% of its pace with one, two, three broken) and lies stunned 0.3 s
  longer after a missed slam.
- **It needs three feet on the floor to stand**, so with three legs left it cannot lift one to stomp.
- **Four broken: it collapses** (my call). It crashes down where it is and lies dazed 1.8 s (blows on it +25%). From
  then on it fights from the floor: on the floor layer for good, dragging itself at 42% of its pace right up to its
  mark, stamping with whatever legs it has left, and its slam is a heave up and a drop from its belly, with the same
  rule (a miss with four legs gone is 2.2 s stunned, five 2.5 s, six 2.8 s).

## The moves: what each asks, and what it looks like
| move | when | asks the party to | looks like |
|---|---|---|---|
| **Stomp** | always (while it has a leg to spare) | step out of a small circle; or break the foot before it comes down | a leg near a hero lifts straight up (its greave grows as it rises), is carried over a red circle, hangs, and stabs down: a dent, a ring of dust, the foot stuck in the floor a moment |
| **Head slam** | always | get out from under it, and then **pile onto it** while it lies stunned | its eyes flare, a red circle shows on the floor under it and goes with it as it scuttles after its mark; it stops dead, rears, and drops: dust thrown out all round, the body flat on the floor, legs splayed. If it crushed nobody: stars round its head, eyes dull, until it heaves itself up |
| **Web spit** | always | step out of a pale circle, or be stuck | its fangs open, a white ball swells between them and flies a high arc with a strand behind (its shadow under it); it bursts into strands. Whoever it caught is netted in web for 1.5 s; if nobody, a web is left on the floor |
| **The brood** | always (one; two from phase 2) | kill the adds | a Hunter Spider lets itself down on a thread from under the body to the floor |
| **Hiss** | waking; the phase turn | nothing (the phase turn: it can't be hurt for 1 s) | fangs wide, eyes flared, short white lines flung out ahead |

### Stomp
Every 1.7-2.5 s (18% quicker in phase 2), up to two legs at once (three in phase 2), each at a different hero.
A leg can stomp a hero who is 56 to 128 from its hip, on its own side of the body (within 0.62 rad of the leg's own
direction, so legs never cross each other or the body) and at least 66 from the body's floor point. Never two
neighbours on one side at once. The spider stands still for it.
- Tell 0.66 s (0.59 in phase 2): a circle of 66 where the hero will be in a quarter second.
- Hit: 46, staggered, thrown away from the body. The foot is the stomp's maker: destroy it in the tell and the circle is
  called off.
- After: the foot is stuck in the floor 0.5 s, then steps back to its place.

### Head slam
Every 5.5-7 s (18% quicker in phase 2). It goes for whoever can't get away first (webbed, stunned, frozen, rooted,
within 340), else its mark, or four times in ten someone else within 300.
- Tell 1.76 s: a circle of 96 under it for 1.5 s **as it walks** (at 2.3 times its pace, less for broken legs), then
  **0.26 s stopped** with the circle where it is; in the last tenth of a second the body drops.
- Hit: 105, staggered, thrown clear, on everyone on the floor under the circle (not on anything hovering or flying).
- It hit someone: it lies 0.45 s, then gets up (0.4 s).
- **It hit nobody: stunned on the floor 1.0 s, plus 0.3 s for each broken leg.** Blows on it +25%, and the whole party
  turns on it. Then 0.4 s getting up, and it is out of reach again.

### Web spit
Every 6-8 s (18% quicker in phase 2), at the furthest hero between 150 and 620 off who isn't webbed already.
- Tell 0.85 s: a circle of 62 where the hero will be in half a second. The spider stands for the first half of it.
- Caught: 26, and **webbed 1.5 s** (can't walk; can still fight). Nobody caught: a web on the floor for 6 s (the game's
  web: slows whoever crosses).
- It lands even if the spider falls meanwhile (a thing thrown, like every lob).

### The brood
First after about 7 s, then every 15-18 s. One Hunter Spider (two from phase 2) at 70% size and 45% health, never more
than three of its own alive. It leaves the belly as a unit, hanging in the air on its thread for 0.8 s (drawn lifted
with its own shadow, unable to act), and lands 52-92 from the spider. They die with it.

## Phases
- **Phase 1** (100% to 60%): all of the above.
- **Phase 2** (60% to 0): it rears and hisses (1.1 s, can't be hurt for 1 s), a brood comes at once, and everything
  comes 18% quicker; three legs can stomp at once; the brood is two.
The fight's real turns are the legs, not its health: each one lost slows it and lengthens its stuns, and the fourth
puts it on the floor.

## Death
It comes down where it stood, its legs curl in under it, and it darkens and fades. Its feet go with it; its brood dies.

## Why it might be fun to watch
- Two targets at two heights: blades at its feet under a body they can't touch, arrows over their heads at the body.
- The slam is a bet the spider makes: it comes down among the party, and if they read the circle it is theirs for a
  second or two. The webs are how it stacks the bet.
- Every leg lost is seen and felt: a grey leg dragging, a slower walk, a longer stun, fewer stomps, then the fall.

## Numbers
Health 1400 (x1.4 for every boss, then the dungeon's strength and party size), walk 40 (x1.52: 61 a second), turn
1.15 rad/s, mass 14, phase 2 at 60%. Stagger x0.4. Tagged beast. A foot: 10% of its health.

Balance: see "Where it sits" below.

## Where it sits
Aimed at a party of four at about the third dungeon's boss (the Great Ooze, met at level 25). Measured in the boss
room at the Sewers' strength, `node tools/runs.mjs --boss --theme sewers --bossid ikSpider --level 25 --party <party> --n 40`
(`sh tools/spider19/measure.sh 40 25`; what happens inside the fights: `node tools/spider19/stats.mjs`). On this branch
with main 0.31.1 merged, 2026-11-25:

| party (level 25) | Old Longlegs: won of 40, average fight | the Great Ooze, same party (won of n) |
|---|---|---|
| paladin, archer, cleric, twinfang (the bench party) | **34**, 160 s | 16 of 20, 160 s |
| tower, berserker, wildmane, cleric (all blades) | **34**, 119 s | 6 of 16, 175 s |
| paladin, archer, pyromancer, marksman (three shooters) | **38**, 93 s | 5 of 16, 98 s |
| paladin, frost, storm, cleric (two mages) | **22**, 217 s | 0 of 16, 219 s |

Three levels either side (20 fights each): level 22: 13, 10, 19, 9; level 28: 18, 18, 20, 14.

So: for the bench party it is level with the Great Ooze (85% against 80%, the same length of fight). For the other
three it is a good deal easier than the Ooze, which those parties mostly lose to. It is not at "about even" (7 to 12
of 20): neither is the Ooze on today's main for the bench party. To make it harder, move health first, then the
stomp's and slam's blows.

Inside the fights (40 each):
- bench party: 4.5 legs broken a fight; it collapsed in 33 of 40, about 118 s in; phase 2 about 58 s in; **slams
  landed 80 of 540 (15%)**, stomps 245 of 597 (41%).
- all blades: all six legs broken every fight; collapsed about 41 s in; **slams landed 179 of 408 (44%)**, stomps 375
  of 407 (92%). Fighters at its feet are where the stomps and the slam come down; shooters stand clear of both.
A slam that misses is the rule against a party that can run, which is what makes the fight: about one stun window
every 6 s for the bench party.

Battle mode (`node tools/battles.mjs --a ikSpider --b paladin,tower`): it beats two heroes as a fresh save has them
in under a minute (6 of 6); the bench party of four as a fresh save has them beats it 1 time in 10 (164 s a fight). It
is pitched for a levelled party there, as the other bosses are.

Tried and dropped:
- A blow on a foot passing 40% on to the body: an all-blade party's fight ran twice as long as a shooters'.
- A foot at 7.5% of the body's health: all six legs were gone in 30 s and the fight was over in 80.
- The brood only from phase 2: with nothing else on the floor the bench party won 20 of 20. Two from the start: 6 of 20.
- The slam's chase at 2.8 times its pace: the spider ran clean over its mark and out the other side; 2.3 keeps the
  circle on a walking hero and lets a running one get out.

## My calls (each easy to change)
- **Its name** (Old Longlegs), its colours and its face (four ember eyes on a bone plate; the heroes have no eyes, the
  Engine has a lamp).
- **Six legs as two tripods**; knees up; a knee shown at 35% of its height over the hip.
- **The unit stands where the body is drawn**, not on its floor point, so shots hit the body you see. In battle mode the
  side ring under the body is therefore drawn at the body, not at its shadow.
- **Shooters at the body, blades at the feet**: done by marking the one "out of reach" for the other (the list sim.js
  already keeps for targets a hero can't get at), not by a new rule in the sim.
- **A blow on a foot passes 85% on to the body.** At 40% a party of fighters took twice as long as a party of shooters.
- **Four broken legs: collapse**, and three feet to stand on (so no stomps with three left).
- **The slam's stun grows with broken legs on the floor too** (the designer's rule kept as written: up to 2.8 s).
- **Webbed is its own hold** (a buff that roots, drawn as web over the hero), not the game's Rooted, whose picture is
  green vines.
- **The brood from the start**, one at a time: with none the fight had no losses at all; with two from the start the
  bench party lost seven in ten.
- **Its den** is a bare hall with old webs in the corners: nothing for feet to trip on while the shape is judged.
- Hooks in shared files, each one line and marked: `bosses.js` (`LOOSE_BOSSES`), `battle.js` (the "No dungeon yet"
  tab; `def.home`), `battle-ui.js` (a tab's own note), `book.js` (`def.bookOpen`), `bestiary.js` (its lines).

## Known gaps
- No sounds of its own.
- A slime mid-hop or anything flying is missed by its stomps and slam (the layer rule), which is right, but a party of
  fliers would make every slam a miss.
- Heroes whose plain attack is not a shot (a beam, a zone) can't reach the body aloft and don't know it: they are sent
  to the body like the other shooters.
- Pillars: its feet step round them and its legs are drawn over them; its den has none. Not looked at in a room full
  of obstacles.
