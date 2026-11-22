# The wagon (convoy mode)

The designer (DECISIONS, round 6, "An idea (not decided): the wagon"): "escort a slow wagon upward through biomes while
enemies come from all sides; the party is ~3x faster than the wagon; camps between stretches with a hero to hire, a
shop, the fire to upgrade; gold dropped by enemies must be picked up or is left behind; meta progression stays."
Round 11 built a try in the Wildwood; round 13 (lane W) rebuilt it from the designer's answers (deck v13-convoy and the
round 13 message); round 14 (lane W) did the designer's notes on that (deck v15-book-wagon, card wagon2: slower, a
trickle from all sides, heroes guarding sides, the wagon solid, a new tree line and a quiet ground). Files: `js/convoy.js` (rules), `js/convoy-art.js` (the ground, the canopy, the wagon), `js/convoy-ui.js`
+ `css/convoy.css` (screens); checks `node tools/convoys.mjs`, stills `tools/convoy-shots.mjs` and `tools/edge-shots.mjs` (the tree line), clips `tools/clip.mjs --convoy`.

## How it plays
- **Entry.** A wagon parked at the camp's bottom edge. Tapping it opens "The Wagon": the trip's three legs, the party
  at the fire (resting heroes stay), the pay. "Set out".
- **The road.** A wide strip of open ground with the road worn up its middle and a wood on both sides; the camera
  rides ahead of the wagon. The world is 2385 across and the open ground between the tree lines 1785 (round 14: "15% less
  wide"; round 13's was 2100); the camera shows 1500 across on a portrait phone at the default zoom, and leans
  across towards wherever the fighting is, so a tree line comes into view when the fight is there. A foe coming from
  off screen shows as a red arrow at the screen's edge. Pinching out shows more.
- **The pace** (round 14: "I want everyone to be like 50% slower"): on the road everyone moves at half their dungeon
  speed (convoy.js `PACE`; heroes, foes, summons: each unit gets its kind's def with the speed halved, so walking and
  every lunge or charge worked out from it are slower; attack rates and shots are not), and the wagon rolls at 10.5 px/s
  (was 21). A stretch is 1,500 of road (was 2,300: at half speed the old road made an 11-minute trip, so the road is
  shorter instead); a whole trip comes to about 8 min 10 s in the batch (6 min 10 s before). Dungeons are untouched.
- **The ground** is quiet (round 14): soft lighter and darker patches, a few drifts of flowers, the worn road. No grass
  tufts, no puddles, no bushes or fallen trunks at the trees' foot. Rocks on the open ground are faceted and painted
  into the ground.
- **The tree line** is the mode's look (round 14, after two send-backs: "broccoli", then "Don't like look... larger less
  complex trees. Where you can't see the ground beneath them. Have them on a parallax where they move faster"): big,
  simple shapes in three flat values with the game's ink line, two rows a side that overlap so only the dark of the
  wood shows between them. Each row is a layer nearer the camera than the ground: it slides past faster than the
  ground as the wagon rolls (`PARALLAX`: the back row 1.5 times the ground's speed, the front row twice). It is drawn
  OVER the units, so whatever is under the trees is hidden. Three takes, by the address: `?edge=crowns` (the default:
  big round crowns with one lit mass each; in hill and dune country the same shape is a hill, in crag country a
  faceted rock), `?edge=firs` (dark firs from above, two tiers each, a jagged wall), `?edge=bank` (no single trees:
  four scalloped ribbons of canopy stepping up and back from the road). Each row is one tile 2,400 long a side, painted
  once into its own canvas and repeated; a frame only copies tiles, shifted. `tools/edge-shots.mjs` takes the stills.
- **Foes come all the time** (round 14: "Enemies to spawn continually instead of set waves... Trickle in + bursts
  sometimes. Have them spawn from all sides"). Points come in at a rate that grows through the stretch and with each
  leg (`FLOW`). Half is spent as it comes: one foe at a time, from a side picked at random (never the same side twice
  running), as soon as the purse covers it. Half is saved for a burst every 38-50 s (the first after 22-28 s): a crowd
  at once, from one side or (two times in five, if it's four or more) from two at once. The sides are left, right
  (out of the wood beside the wagon), ahead (out of the wood up the road, then on to the road ahead of the oxen and down
  it) and behind (out of the wood behind, then up the road after the tail). Everything still walks out from under the
  trees: a new foe is hidden (nobody can target or hit it) until it steps out past the tree line; after that nobody goes
  back in under the trees. `convoys.mjs` checks that no foe is first seen on open ground on screen. Foes stop coming
  350 short of the gate.
- **The party guards the wagon's sides** (round 14: "Have heavy pull towards cart... Each hero should try to guard 1
  side... split the area around the cart into large overlapping quadrants and hero's will try very hard not to leave
  their quadrants. 1 hero can only be on positions higher than the bottom of cart. Then another only lower than the
  center of the top of the cart. The 2 more for left and right"). Each standing hero has a side (convoy.js `SIDES`):
  - four standing: **front** (anywhere above the wagon's tail), **back** (anywhere below the oxen's noses), **left**
    (anywhere left of the wagon's right side), **right** (anywhere right of its left side). Each region is half the
    ground, so they overlap a lot (the ground beside the wagon belongs to three of them), and each hero has half the
    ground it won't go on.
  - three standing: front, and the two flank guards stand further back and share the rear. Two: left and right. One:
    everything. A fifth (a sellsword with four) doubles the front.
  - who gets which: the sturdiest takes the front (the wagon stops when a foe stands in front of the oxen), then the
    flanks, the back, and a healer a flank, where it stands in close by the wagon, in reach of every post. Worked out
    again whenever someone goes down or gets up.
  - a hero only goes for a foe that is inside its side (give or take its reach), within 430 of the wagon's outline
    (`GUARD`; a shooter further by 0.7 of its range), and within 620 of itself (`VIEW`: the "lower view distance"); one
    that is attacking the hero itself may be followed out to the leash (640). Of those it prefers the ones on its own
    side of the wagon, and avoids the ones other heroes are already on: attacked from two sides at once, the party
    splits. Past the edge of its side or the leash a hero is eased back, and well past it walks home. A foe just past
    a melee hero's edge that is pressed to the wagon's far flank isn't its to fight (the edge there runs along the
    wagon itself: there is nowhere on its side to strike from). The one exception to all of it is the road's holder
    at the end (the Bandit Chief): he is everyone's, wherever he stands, so the party can take the fight to him.
  - with nothing to fight each stands at its post (ahead of the oxen, behind the tail, out from a flank), which is
    round 13's "no huddling" on the road. Getting a friend up, and going for gold, are errands a hero may leave its
    side for; it comes home after. Summons and foes that changed sides aren't bound.
  - `?sides` in the address draws each hero's edge, post, the guard distance and the leash (for checking).
- **Gold** (no switch): heroes pull in gold near them as they fight (as in a dungeon); when no foe is near the wagon or
  them, the nearest free hero goes for loose gold, the gold about to be left behind first: anywhere on its own side as
  far as the leash, off its side only for gold close by (340 from itself; round 14). **Gatherers** (a hero's data:
  `gatherer: true`; the Quartermaster and the Pirate) put gold first: they're sent first, go anywhere within 1200 of the
  wagon, and go even mid-fight unless a foe is on them; a coin bobs over their head on the way; they come home to their
  side after. Gold stays where it fell; past the bottom of the screen (640 behind the wagon) it's left behind.
- **The wagon** is a unit on the party's side with 900 health, and it is solid from its tail to the oxen's noses (round
  14: "Give the cart a hit box around all of it. The players are walking through it"): its own circle covers the
  middle of the bed, and a row of circles along it plus one at each corner of the bed (`RIG_PARTS`) are units set in
  place that nobody walks through, heroes or foes. A blow or a status on any of them lands on the wagon (sim.js
  `linkTo`, as a chain's segments; one blow that catches several counts once), at 0.6 of a blow on its middle
  (`RIG_TAKEN`: three times as many foes can reach it at once now). To get to something on its far side a unit walks
  round by the nearest corner (convoy.js `roundRig`, asked by sim.js `goalVec`). The downed are shouldered aside as it
  rolls over where they fell. It can't be charmed, confused, put to sleep, frightened or made to bleed.
  Enemies can target it like anyone. Half the goblins and bandits go for it first (whichever part is nearest); the
  rest 15%. It stops while an enemy stands in front of the oxen or it's taking heavy blows. Healing mends it at a
  third. Broken wagon = the trip is lost; the whole party down = lost. (A stand-off at a stretch's gate: after 6 s
  stopped there with foes still near, the guards leave their sides and hunt, no edge and no leash; after 40 s the foes
  press in. Nothing wears down: the 3% a second drain that was here went with the wither rule, "fix the source not the
  symptom".)
- **Downed heroes** lie where they fell and can be revived as in a dungeon (an ally standing over them, or a revive
  ability) until the road carries them off the bottom of the screen; a ring round them runs down (red and pulsing near
  the end) and the strip's face for them turns red. Past the bottom they're "left behind" (a banner says so) and wait at
  the next roadside camp with 30% health.
- **Roadside camp** between legs: everyone mends 25%, the downed and the left behind are back at 30%. Then a shop that
  spends **only the gold picked up on this trip** (never the bank): mend the wagon (+25%, 30 gold, more than once), a
  healing draught (12, for whoever has fewest), a trinket (55, one, named), a sellsword for the next leg (40). What
  isn't spent is what the party takes home.
- **The trip**: three legs. With only the Wildwood beaten (or not), the Wildwood's three floors as before (the Forest
  Edge, the Old Grove, the Bandit Camp). Each dungeon whose boss has been beaten opens its country to the road (the
  underground ones become the land over them: the Warren's hills, the Sewers' outfall, the graveyard over the Crypt...):
  then two legs are drawn from what's open, easiest first, and the last leg is the newest country. Each leg has its
  dungeon's enemies, strength (RANK_MULT) and look (convoy-art.js LOOKS).
- **The end.** The last leg ends at a stockade across the whole open ground with a gap on the road, held by that
  floor's mini-boss and his men (the Wildwood: the Bandit Chief). The wagon waits short of it; once the holder falls the
  gap breaks open and the wagon rolls through the gate: delivered.
- **Pay**: the trip's gold left after the shop, plus the delivery pay: 200 gold x the wagon's health left. XP as in a
  dungeon. Lost because the wagon broke, or turned back: 20% of the gold left is lost. Lost because the whole party fell:
  75% lost (as a dungeon wipe, round 13 ruling) and nobody rests. No checkpoints, no dungeon unlocks, no slots from it;
  bestiary counts and lifetime stats do count.

## Numbers to tune (js/convoy.js top)
PACE 0.5, WAGON_SPEED 10.5, WAGON_HP 900, STRETCH_LEN 1500, ROAD_W 2385, EDGE 300, ACROSS 1500, BEHIND 640, GUARD 430,
VIEW 620, LEASH 640, SAFE 700, REACH 340, GATHER_REACH 1200, FLOW (rate 0.27 a second growing 0.003 a second, half
kept for bursts every 38-50 s), RIG_TAKEN 0.6, GOLD_MUL 1.1, FLING 2, PAY 200, SHOP prices, LEG (each leg's strength and
budget); js/convoy-art.js: PARALLAX [0.5, 1], EDGE_DEFAULT 'crowns'.
`node tools/convoys.mjs --n 20 --level 4 [--spend none] [--lands wildwood,warren]` reports how often it's delivered,
the wagon's health, gold picked up vs dropped, what was bought and kept, heroes left behind, and the pop-in check.
Round 14's batch (60 trips a level, the Wildwood, on 0.19.0's heroes, before -> after): delivered 82% -> 80% at level
3, 90% -> 85% at level 4, 87% -> 93% at level 5; 0 stuck, nothing popping into view; a trip 6 min 10 s -> 8 min 10 s.
Tools for clips: `tools/clip.mjs --convoy` takes `--lean X` (hold the camera across), `--calm S` (no foes for S
seconds), `--send left:5,right:5` (a crowd from each side named), `--eval "js"` (stage anything; `GAME.run.send(dir, n)`).
