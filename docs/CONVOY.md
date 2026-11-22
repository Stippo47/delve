# The wagon (convoy mode)

The designer (DECISIONS, round 6, "An idea (not decided): the wagon"): "escort a slow wagon upward through biomes while
enemies come from all sides; the party is ~3x faster than the wagon; camps between stretches with a hero to hire, a
shop, the fire to upgrade; gold dropped by enemies must be picked up or is left behind; meta progression stays."
Round 11 built a try in the Wildwood; round 13 (lane W) rebuilt it from the designer's answers (deck v13-convoy and the
round 13 message). Files: `js/convoy.js` (rules), `js/convoy-art.js` (the ground, the canopy, the wagon), `js/convoy-ui.js`
+ `css/convoy.css` (screens); checks `node tools/convoys.mjs`, stills `tools/convoy-shots.mjs`, clips `tools/clip.mjs --convoy`.

## How it plays
- **Entry.** A wagon parked at the camp's bottom edge. Tapping it opens "The Wagon": the trip's three legs, the party
  at the fire (resting heroes stay), the pay. "Set out".
- **The road.** A wide strip of open ground with the road worn up its middle and a forest on both sides; the camera
  rides ahead of the wagon. The ground is 2800 across (the try's was 600), the open ground between the tree lines 2100
  (about four times the try's ~530); the camera shows 1500 across on a portrait phone at the default zoom, and leans
  across towards wherever the fighting is, so a tree line comes into view when the fight is there. A wave coming from
  off screen shows as a red arrow at the screen's edge. Pinching out shows more. A stretch is 2,300 of road; the wagon rolls at 21 px/s (a hero walks ~62).
- **The forest edge** is the mode's look: a wood 350 deep, three rows a side, the front row ragged (gaps, old trees
  leaning out, young ones set back), each country's mix of kinds (the Wildwood: broad trees, smaller paler ones, a few
  pines and dead ones; fallen trunks reaching onto the verge), all drawn like the heroes (thick ink outline, a gradient
  to the light, big soft lit masses), the deeper rows the same drawing in darker values; the canopy's shade on the
  verge, bushes along it. Rocks on the open ground are faceted and painted into the ground. The canopy is drawn OVER the units, so whatever
  is under the trees is hidden.
- **Waves** every 11-15 s, all walking in from under the trees: ahead (both sides), one side, behind, or two at once;
  each a little bigger than the last, and each leg harder. A new foe is hidden (nobody can target or hit it) until it
  steps out past the tree line; after that nobody goes back in under the trees. `convoys.mjs` checks that no wave foe is
  first seen on open ground on screen.
- **The party** fights round the wagon on its own; with nothing to fight they walk ahead of the oxen spread in a loose
  line (sim.js `looseSpot`, the same as in dungeons), and drift off for loose gold. A hero further than 640 from the
  wagon walks back (unless what it fights is near the wagon), at 820 now the ground is wider.
- **Gold** (no switch): heroes pull in gold near them as they fight (as in a dungeon); when no foe is near the wagon or
  them, the nearest free hero goes further for loose gold (up to 1000 from the wagon), the gold about to be left behind
  first. **Gatherers** (a hero's data: `gatherer: true`; the Quartermaster and the Pirate) put gold first: they're sent
  first, go further (1200), and go even mid-fight unless a foe is on them; a coin bobs over their head on the way.
  Gold stays where it fell; past the bottom of the screen (640 behind the wagon) it's left behind.
- **The wagon** is a unit on the party's side with 900 health (its body covers the bed; the ox team ahead of it has a
  body too: nobody stands on the oxen):
  enemies can target it like anyone. Half the goblins and bandits go for it first; the rest 15%. It stops while an enemy
  stands in front of it or it's taking heavy blows. Healing mends it at a third. Broken wagon = the trip is lost; the
  whole party down = lost.
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
WAGON_SPEED 21, WAGON_HP 900, STRETCH_LEN 2300, ROAD_W 2800, EDGE 350, ACROSS 1500, BEHIND 640, LEASH 820, SAFE 700,
REACH 1000, GATHER_REACH 1200, wave gap 11-15 s, wave budget, GOLD_MUL 1.1, FLING 2, PAY 200, SHOP prices, LEG (each
leg's strength and budget).
`node tools/convoys.mjs --n 20 --level 4 [--spend none] [--lands wildwood,warren]` reports how often it's delivered,
the wagon's health, gold picked up vs dropped, what was bought and kept, heroes left behind, and the pop-in check.
