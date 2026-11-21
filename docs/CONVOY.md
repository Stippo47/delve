# The wagon (convoy mode): a try

The designer (DECISIONS, round 6, "An idea (not decided): the wagon"): "escort a slow wagon upward through biomes while
enemies come from all sides; the party is ~3x faster than the wagon; camps between stretches with a hero to hire, a
shop, the fire to upgrade; gold dropped by enemies must be picked up or is left behind; meta progression stays."
Round 11 asked to try it. This is a playable prototype in one biome, the Wildwood, to feel it and say yes or no.
Files: `js/convoy.js` (rules), `js/convoy-ui.js` + `css/convoy.css` (screens), checks `node tools/convoys.mjs`.

## How it plays
- **Entry.** A wagon parked at the camp's bottom edge (left of the way out). Tapping it opens "The Wagon": the party
  at the fire (resting heroes stay), the road, and the pay. "Set out".
- **The road.** A long, narrow strip of forest road running up the screen; the camera follows the wagon. Three
  stretches, each a world of its own: the Forest Edge, the Old Grove, the Bandit Camp (the Wildwood's three floors'
  enemies and looks). A stretch is about 2,300 px of road; the wagon rolls at 21 px/s (a hero walks ~62), so a
  stretch is two to three minutes.
- **Waves** every 11-15 s, from ahead, the sides (out of the trees), behind, or two sides at once; each a little
  bigger than the last, and each stretch harder (the Wildwood's strength, +30% a stretch like a floor).
- **The party** fights round the wagon on its own: they go for what's in sight, walk ahead of the wagon when nothing
  is, and never stray more than ~380 px from it (further, and they turn back).
- **The wagon** is a unit on the party's side with 900 health: enemies can target it like anyone. Goblins and bandits
  go for the wagon first (they want what's in it); beasts and the rest go for whoever's nearest (a quarter of them
  for the wagon too). It stops while an enemy stands in its way or it's taking heavy blows. Healing mends it at a
  third. Broken wagon = the run is lost; the whole party down = lost.
- **Gold** drops where enemies fall and stays on the road (no fading). Heroes pull in coins near them, and when
  nothing threatens the wagon the nearest free hero runs for loose gold. What falls a screen behind the wagon is
  left behind for good. The HUD counts gold picked up; the result shows it against what was dropped.
- **Downed heroes** are lifted onto the wagon and ride out the stretch; they're back at the next roadside camp with
  30% health.
- **Roadside camp** between stretches: everyone mends 25%, then one choice of three from: repair the wagon (+35%),
  a healing potion each, a trinket (worn for the rest of the trip), a sellsword for the next stretch.
- **The end.** At the top of stretch 3 the road is barricaded: the Bandit Chief and his men hold it. The wagon waits
  at the barricade; once the Chief falls the barricade breaks and the wagon rolls through the gate: delivered.
- **Pay**: the gold picked up, plus the delivery pay: 260 gold x the wagon's health left (at least half pay for a
  wagon in one piece). XP as in a dungeon (each kill, plus a delivery bonus). Downed heroes rest as after a run.
  Lost (wagon broken or party down): the gold picked up less 20%, no pay. Turning back (the flag): the same.
  No checkpoints, no dungeon unlocks, no slots from it; bestiary counts and lifetime stats do count.

## Numbers to tune (js/convoy.js top)
WAGON_SPEED 21, WAGON_HP 900, STRETCH_LEN 2300, LEASH 380, wave gap 11-15 s, wave budget, PAY 260.
`node tools/convoys.mjs --n 20 --level 4` reports how often it's delivered, the wagon's health, gold picked up vs dropped.
