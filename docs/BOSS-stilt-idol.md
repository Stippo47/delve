# Boss: the Canopy Idol, the jungle stilt-walker (a test boss: in no dungeon yet)

Round 19, lane stilts19. The designer, on Old Longlegs (docs/BOSS-ik-spider.md): "This spider is good. Cool. Buuut, I
was picturing something more on stilts, the head very high up like near where the witch would fly, much larger. Try
again make this one jungle themed, spider shaped in how it has legs but not a spider."

Old Longlegs stays as it is. This is a second boss beside it, with the same rules the designer set for the spider
(stomps; a head slam with a circle that follows it, a split-second pause, and a stun on the floor if it hits nobody;
legs with health of their own that break, slow it and lengthen the stun) and two moves of its own.

Code: `js/boss-stilt.js` (every number in `ID`, `PHASE_AT`, the stilts in `LEGS`), its looks `js/boss-stilt-fx.js`,
shared tools `js/boss-kit.js` and `js/boss-draw.js` (and Old Longlegs' knee solver, `knee3`). Art: drawn in code, as
one figure with one outline. The name is a working name.

Where to fight it: the boss room `?bossroom&boss=stiltIdol` (any theme;
`&bossmove=walk|stomp|slam|vine|pods|legs1..6|legs3m` opens with that); battle mode, on the tab "No dungeon yet" (always
open; it fights at the third dungeon's strength); the Book, Monsters, "No dungeon yet" (its page is open without
meeting it); the bench `lab.html?m=boss&boss=stiltIdol`. It is in no dungeon's roster.

## Who it is
Somebody carved a god, and the jungle grew over it and taught it to walk.
- **The head**: a great idol head of dark hardwood, seen from above: a domed back, a long jaw block, a heavy brow
  across it with two glowing eyes under it, a carved nose ridge and a curl on each cheek, a lower jaw with five bone
  teeth and a tusk at each corner, a jade ear spool each side. Its back is grown over with moss, with three red blooms
  in the moss and a crown of seven broad leaves fanned out behind; three seed pods hang behind the crown.
- **How high**: the head is carried **132 over the floor** (the Witch on her broom flies at 70, Old Longlegs' body
  rides at 44). It is drawn that much up the screen (119 at the game's 0.9), and bigger for being nearer (1.4 times,
  on a head already cut big), with its one shadow on the floor point far below it (the shared shadow layer).
- **How big**: its hooves stand in a ring 360 across (Old Longlegs: 252); the head is about 150 long and 105 wide on
  the screen (Old Longlegs' whole body: about 145 by 75); from its lowest hoof to the tip of its crown it is about 420
  up the screen, most of a phone's width across. Health bar, name and layers as any boss.
- **The stilts**: six, of bamboo, ringed with nodes. Under the head is a yoke of three poles; a stilt is lashed to each
  end. Each is a **short thigh** (80) up and out to a knot of lashing at the knee, and a **long shin** (165) slanting
  down to the floor, shod with a **carved stone hoof**, heavier at the floor, with a band cut round it and a little
  moss. The hoof is the foot: the part to hit. It cracks as it is hurt (one crack under 70% health, two under 35%).
- **A broken stilt** is dry and grey and in two pieces: the thigh still sticks out of the yoke, sagging, with a short
  splintered stump of shin hanging from the knee and swinging as the head moves; the rest of the shin lies askew on the
  floor with the cracked hoof on its end, tied to the stump by a strand of lashing and dragged along behind.

How the picture is made (so it can be judged, or changed): the fight keeps each hoof's place on the floor, each hip's
place on the yoke and the head's height. The drawing solves each knee from those in three dimensions (two bones, bent
upwards and a little out to the stilt's own side), then puts hip, knee and hoof on the screen the way the game shows
all height, as a shift up the screen. Nothing is posed by hand: with the head up, the near stilts are long lines down
the screen from the head to hooves far below it, and the far ones go up behind it and come back down beside it; when
the head drops the hooves stay where they are and every knee is left standing over it. Every stilt is drawn under the
head: whatever of a stilt lies behind the head's picture is lower and further off than the head.

## The stilts: standing, walking, turning
Old Longlegs' gait, with a longer and slower stride.
- **Hooves stay planted.** A hoof's place on the floor only changes while it steps, stomps, or (broken) is dragged.
- **The gait** is two tripods taking turns: front and rear of one side with the middle of the other. Each hoof has a
  place it belongs (180 from the floor point under the head, at its own angle). When a tripod's hooves have fallen 38
  behind their places, and the other tripod is planted, they lift together (a hair apart) and swing in an arc 34-54
  high for 0.2-0.36 s to a spot ahead of their place, so the head walks over them. How far ahead is set so that the
  other tripod's turn falls half way through this one's stride: an even one-two.
- **Turning** moves every hoof's place round the floor point; the hooves follow in the same tripods. It turns at 0.85
  rad/s (Old Longlegs: 1.15; its hooves have further to go).
- **Stopped**, hooves more than 18 from their places step home.
- **The head rides on them**: it dips while a tripod is in the air and leans a third of the way after its hooves, on a
  soft spring (it is a long way up).
- A hoof never lands outside the room or in a pillar. A stilt stretched to 95% of its length steps as soon as it may
  (half its stilts stay on the floor, however it is stretched).
- Checked: `node tools/stilts19/planted.mjs` steps its Book fight for a minute and looks at every hoof every tick:
  of 15,452 hoof-ticks planted, none moved; 270 steps of 0.31 s; never more than three hooves in the air. A stilt was
  stretched past its own length on 7 hoof-ticks of 21,600 (by up to 11%, turning to let the liana down): the drawing
  lengthens the canes that much rather than lift the hoof.
- **A broken stilt** takes no part: its hoof is pulled along once it is 150 from its hip. The other stilts go on in
  their tripods; never more than half of them in the air.
- **The head stays in the room**: the floor point is held where the head's picture is 96 inside every wall.

## Layers: what reaches what
As Old Longlegs.
- **Aloft** (its head 34 or more over the floor) it is on the **flying** layer: only shots reach the head; blades,
  slams, zones, pools and bodies on the floor don't. Heroes walk under it. It is drawn over everything on the floor.
  The unit stands where the head is drawn, so shots land on the head you see.
- **Its hooves** are on the floor: each a hit box of its own (a circle of 22 at the hoof), with its own health.
- Those who fight hand to hand go for the hooves, those who shoot go for the head.
- **On the floor** (stunned after a missed slam, or collapsed) the head is on the floor layer: everything reaches it.
- **Behind the head's picture**: someone standing on the floor about as far up the screen from its floor point as it is
  tall is covered by the head. A pale dashed ring is drawn over the head where each of them stands.

## The hoof rule
The designer's rule for the spider's legs, with the spider's numbers.
- Each hoof has **10% of the head's health**. A blow on a hoof also hurts the head, **85%** of it (one blow that
  catches several hooves: 85% once and a quarter of that for each more).
- **A hoof destroyed breaks its stilt** (stone chips and splinters of cane fly; the head lurches and stands still 0.4
  s). That stilt cannot stomp and carries nothing. If it was lifted to stomp, the stomp never lands.
- **Each broken stilt**: it walks slower (90%, 78%, 66% of its pace with one, two, three broken) and lies stunned 0.3
  s longer after a missed slam.
- **It needs three hooves on the floor to stand**, so with three stilts left it cannot lift one to stomp.
- **Four broken: it collapses.** It crashes down where it is (the whole height) and lies dazed 1.8 s (blows on it
  +25%). From then on it fights from the floor: on the floor layer for good, dragging itself at 42% of its pace right
  up to its mark, stamping with whatever stilts it has left, and its slam is a heave up and a drop from its belly,
  with the same rule (a miss with four gone is 2.2 s stunned, five 2.5 s, six 2.8 s).

## The moves: what each asks, and what it looks like
| move | when | asks the party to | looks like |
|---|---|---|---|
| **Stomp** | always (while it has a stilt to spare) | step out of a small circle; or break the hoof before it comes down | a stilt near a hero lifts up and out nearly straight, past a red circle (its hoof grows as it rises, a small shadow under it), hangs, and stabs down into the circle: a dent, a ring of dust, the hoof stuck in the floor a moment |
| **Head slam** | always | get out from under it, and then **pile onto it** while it lies stunned | its eyes flare orange and its jaw opens; a red circle shows on the floor under it, on its shadow, and goes with it as it strides after its mark; it stops dead, rears, and the head drops the whole height between its stilts: white streaks down the screen, leaves left hanging in the air where its crown was, its shadow swelling under it, then dust and leaves thrown out all round and the head flat on the floor, knees left standing over it. If it crushed nobody: stars round its head, eyes dull, until it heaves itself up |
| **Liana** (its own) | always | step out of a red circle far from it, or be hauled in | a liana uncoils from under the edge of the head and comes down on someone far off, its tip on the floor as the circle goes off. Whoever it caught is dragged across the floor to just under the head and left tangled in coils for 0.8 s; if nobody, it slaps the floor in a puff of dust and leaves |
| **Seed pods** (its own) | always (three; four from phase 2) | step out of the circles; kill the sproutling | it shakes its crown (leaves fly), and the pods behind it let go one after another and fall the whole height, each to a red circle with its shadow growing under it; each splits where it lands in a puff of yellow dust. The first of each shower (the first two from phase 2) leaves a Sproutling standing there |
| **Roar** | waking; the phase turn | nothing (the phase turn: it can't be hurt for 1 s) | jaw wide, eyes flared, short white lines flung out ahead, its crown shaking |

### Stomp
Every 1.7-2.5 s (18% quicker in phase 2), up to two stilts at once (three in phase 2), each at a different hero.
A stilt can stomp a hero who is 70 to 184 from its hip, on its own side (within 0.62 rad of the stilt's own direction,
so stilts never cross each other) and at least 84 from the floor point. Never two neighbours on one side at once. The
idol stands still for it.
- Tell 0.74 s (10% shorter in phase 2): a circle of 70 where the hero will be in a quarter second. The hoof lifts
  104.
- Hit: 46, staggered, thrown away from the floor point. The hoof is the stomp's maker: destroy it in the tell and
  the circle is called off.
- After: the hoof is stuck in the floor 0.5 s, then steps back to its place.

### Head slam
Every 5.5-7 s (18% quicker in phase 2). It goes for whoever can't get away first (tangled, stunned, frozen, rooted,
within 360), else its mark, or four times in ten someone else within 320.
- Tell 1.8 s: a circle of 110 under it for 1.5 s **as it walks** (at 2.3 times its pace, less for broken stilts), then
  **0.3 s stopped** with the circle where it is, rearing 18 higher (the hooves it left behind step up under it); in
  the last 0.16 s the head falls the whole 150.
- Hit: 105, staggered, thrown clear, on everyone on the floor under the circle (not on anything hovering or
  flying).
- It hit someone: it lies 0.45 s, then gets up (0.7 s: it has a long way to climb).
- **It hit nobody: stunned on the floor 1.0 s, plus 0.3 s for each broken stilt.** Blows on it +25%, and the whole
  party turns on it. Then 0.7 s getting up; it is out of a blade's reach again a fifth of the way up.

### Liana
Every 9-12 s (18% quicker in phase 2), at the furthest hero between 190 and 660 off who isn't tangled already.
- Tell 0.9 s: a circle of 56 where the hero will be in 0.45 s. The idol stands for the first six tenths of it.
- Caught: 22, **hauled in** over 0.5 s to a spot 64 short of the floor point under it (on the side they came from),
  and **tangled 0.8 s** there (can't walk; can still fight). Someone who can't be dragged (dug in, unstoppable) is
  tangled where they stand. The slam looks for whoever is tangled.
- Nobody caught: nothing is left on the floor.

### Seed pods
First after about 6 s, then every 13-16 s (18% quicker in phase 2). Three pods (four from phase 2), one at each of up
to that many heroes (where they will be in half a second), the rest 70-150 from the idol.
- Tell 1.2 s for the first, 0.14 s more for each after: a circle of 52. A pod hangs on in the crown, then falls for
  the last 0.45 s.
- Hit: 30, a small stagger and shove.
- The first pod of a shower (the first two from phase 2) leaves a **Sproutling** (the Wildwood's: 90% size, 45%
  health); never more than three of its own alive. They die with it.
- A pod lands even if the idol falls meanwhile (a thing let go, like every lob).

## Phases
- **Phase 1** (100% to 60%): all of the above.
- **Phase 2** (60% to 0): it rears and roars (1.1 s, can't be hurt for 1 s), pods come at once, and everything comes
  18% quicker; three stilts can stomp at once; four pods, two sproutlings.
The fight's real turns are the stilts, as with the spider: each one lost slows it and lengthens its stuns, and the
fourth puts it on the floor.

## Death
A burst at the head; it drops the whole height where it stood (leaves left in the air behind it), its stilts fall
outward and lie flat round it like dropped canes, and it darkens and fades. Its hooves go with it; its sproutlings die.

## Why it might be fun to watch
- It towers: the fight goes on round six planted stilts under a head most of the way up the screen, with its shadow
  in the middle of the party.
- Two targets at two heights, as with the spider: blades at its hooves, arrows over their heads at the head.
- The slam is a long drop, and a bet: the circle is on its shadow, where the party is fighting. If they read it the
  head is theirs for a second or two, and it has a long climb back.
- The liana is how it gets at those who stand back and shoot: it drags one in among the stilts, under the circle.
- Every stilt lost is seen and felt: a grey stump swinging, a hoof dragged on a string, a slower walk, a longer stun,
  fewer stomps, then the fall from the full height.

## Numbers
Health 1550 (x1.4 for every boss, then the dungeon's strength and party size; Old Longlegs: 1400), walk 40 (x1.52:
61 a second), turn 0.85 rad/s, mass 18, phase 2 at 60%. Stagger x0.4. Tagged plant. A hoof: 10% of its health. Carried
132 high; hooves rest 180 out; thigh 80, shin 165.

## Where it sits
Aimed where Old Longlegs sits: a party of four at about the third dungeon's boss (level 25). Measured in the boss
room at the Sewers' strength, `sh tools/stilts19/measure.sh 40 25` (`node tools/runs.mjs --boss --theme sewers --bossid
stiltIdol --level 25 --party <party> --n 40`; what happens inside the fights: `node tools/stilts19/stats.mjs`). On this
branch with main merged, 2026-11-25:

| party (level 25) | the Canopy Idol: won of 40, average fight | Old Longlegs, same party, same branch |
|---|---|---|
| paladin, archer, cleric, twinfang (the bench party) | **39**, 162 s | 34, 162 s |
| tower, berserker, wildmane, cleric (all blades) | **29**, 163 s | 34, 120 s |
| paladin, archer, pyromancer, marksman (three shooters) | **32**, 112 s | 38, 94 s |
| paladin, frost, storm, cleric (two mages) | **18**, 251 s | 22, 217 s |

Three levels either side (20 fights each): level 22: 17, 18, 16, 3; level 28: 20, 18, 15, 10.

So: 118 fights won of 160 against Old Longlegs' 128; a little easier for the bench party, a little harder for the other
three, and its fights run longer for every party but the bench one (it has more health, and its hooves are further
apart). How far to trust it: forty fights move by five or so from one batch to the next. The same numbers measured on
two earlier builds of this lane gave the bench party 36 and 36, the blades 34 and 38, the shooters 34 and 33, the
mages 13 and 51 of 120. To make it harder or easier, move health first.

Inside the fights (40 each):
- bench party: 4.1 stilts broken a fight; it collapsed in 35 of 40, about 128 s in; phase 2 about 61 s in; **slams
  landed 119 of 544 (22%)**, stomps 288 of 696 (41%), lianas 48 of 327 (15%), pods 34 of 916 (4%).
- all blades: 5.6 stilts broken; collapsed in 38, about 59 s in; **slams landed 307 of 592 (52%)**, stomps 463 of 494
  (94%), lianas 92 of 322, pods 195 of 1002 (19%).
- three shooters: 3 stilts broken; collapsed in 12; slams 79 of 385 (21%), stomps 218 of 243 (90%: all on the one
  fighter at its hooves), lianas 52 of 229 (23%), pods 26 of 690.
- two mages: 3.8 stilts broken; collapsed in 21; slams 144 of 859 (17%), stomps 409 of 440, lianas 125 of 510 (25%).
A slam that misses is the rule against a party that can run: about one stun window every 15 s for the bench party.
The pods are mostly stepped out of (they are there to move people, and for the sproutling).

Battle mode (`node tools/battles.mjs --a stiltIdol --b paladin,tower`): it beats two heroes as a fresh save has them in
under a minute (6 of 6); the bench party of four as a fresh save has them beats it 1 time in 10 (156 s a fight), as
with Old Longlegs. Set against Old Longlegs itself it wins 6 of 6 (235 s).

Tried and dropped:
- Health 1400, as the spider: the bench party won 40 of 40, the blades 38.
- Harder stomps and slams (50-58 and 112-125) to bring those two down: the two mages, who have one fighter to take
  every stomp, fell to 11-13 of 40.
- The liana every 7-9 s with a 1.2 s tangle: three shooters won 5 of 20.
- Sproutlings at 90% health: the same (with none at all those shooters won 17 of 20).
- Green and yellow circles for the liana and the pods: lost on a green floor.
- One fight of some 400 on an earlier build ran the full ten minutes without ending (two mages); not seen again in 120
  more fights of that party, nor in any batch above. Its cause was not found.

## My calls (each easy to change)
- **What it is**: a carved idol head on bamboo stilts, grown over; its name (the Canopy Idol), colours and face.
- **Health 1550**, a tenth more than the spider's, and the liana only every 9-12 s: see "Tried and dropped".
- **132 high**, nearly twice the Witch's broom (70) and three times the spider (44). Higher still and the head leaves
  a phone's screen when the fight is at the far wall.
- **Six stilts as two tripods**, a short thigh and a long shin, knees up. **Every stilt drawn under the head** (the
  spider draws its near legs over its body): seen from above, a stilt behind the head's picture is below the head.
- **The head down on the floor keeps its knees up** (hooves planted, so the knees have nowhere else to go); they are
  still drawn under the head so its face shows.
- **A stomping stilt swings out nearly straight** before it comes down. Lifted close in, its knee stood far over the
  head.
- **The unit stands where the head is drawn**, as the spider's does. In battle mode the side ring is therefore at the
  head, not at its shadow.
- **A pale ring over the head** where someone on the floor is hidden behind it. The other way would be to fade the
  head; that needs the figure drawn to a layer of its own.
- **The hoof rule, the collapse at four, the growing stun**: the spider's, unchanged.
- **The liana hauls in** rather than holding at a distance (the spider's web), and tangles only 0.8 s (the web: 1.5 s).
  Hauled under the head and held 1.2 s, three shooters lost three fights in four.
- **Tangled is its own hold** (a buff that roots, drawn as coils of liana), not the game's Rooted.
- **Sproutlings from the pods** at 45% health, one a shower. At 90% health a party of shooters won 5 fights in 20; the
  spider's brood is at 45% too.
- **Every tell is the game's red circle** (stomp, slam, liana, pods). Green and yellow circles were tried for the
  liana and the pods and were lost on a green floor.
- **Its glade** is a bare hall with ferns out of the corners and fallen leaves: nothing for hooves to trip on.
- Hooks in shared files, each one line and marked: `bosses.js` (the file, `LOOSE_BOSSES`), `bestiary.js` (its lines),
  `preview-scenes.js` (where it stands on the Book's stage: its head is drawn a long way up from its floor point).
  `sw.js`'s file list is not touched (tools/build-sw.py makes it).

## Known gaps
- No sounds of its own.
- Its hooves and shins are drawn with the head, over everything on the floor: a hero standing just down the screen of a
  hoof is drawn under it.
- With the head down, its near knees are drawn under the head though they stand over it.
- A slime mid-hop or anything flying is missed by its stomps, slam, liana and pods (the layer rule).
- Heroes whose plain attack is not a shot (a beam, a zone) can't reach the head aloft and don't know it (the spider's
  gap too).
- Pillars: its hooves step round them and its stilts are drawn over them; its glade has none.
- The Book's stage is small for it: it fits, with its hooves near the edges.
