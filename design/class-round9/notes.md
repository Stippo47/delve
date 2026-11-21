# Art round 9 (lane A, wave 11): real art for the kinds that wore stand-ins

The kinds in docs/ART-NEEDED.md and the recoloured bosses in docs/ART-NEEDED-bosses.md, dungeon by dungeon, in the
heroes' top-down bust style (a head token, shoulders, fists in arm parts, weapons under the shoulder, matte, no eyes on
people) and round 8's creature style (a few simple capsule shapes, readable at game size).

How it was built, round 8's way: the round-8 libraries were copied into `_src/` (`A2/lib.py`, `common.py`, `wild8.py`;
`E3/lib.py`, `critters.py`, `greenskins.py`) and `_src/check9.py` checks they still give the files the designer saw byte
for byte (the round-8 wolves, Ghost B, the troll, the chieftain, the round-7 bat), so a design built on a picked one
starts from exactly it; then that `_src/build9.py` rebuilds this folder byte for byte. Generators: `_src/A2/beasts9.py`
(the builders the creatures share: the wolf, the spider, the spirits' one shape), `A2/frost9.py`, `E3/frost9e.py` (the
yeti, its snowball, the icicle wraith). Renders: `enemies/renders/<name>.png`, a board at the game's scale (the design
k times the archer's box, k = (vr / headR) / (22 / 56), so a yeti stands bigger than the archer and a spirit smaller;
its 8 facings; the 8 facings at game size beside the archer), `<name>-before.png` beside it: the stand-in the game
showed, in its variant's colours, on the same board (`_src/befores9.py`). `_src/render9.py` draws them; `_src/game9.py`
copies the designs into `art/`; `_src/look.py` makes scratch look-over sheets in `tools/riffle/out/r9`.

## The Frost Hollow (js/foes10.js)
- **Frost wolf** (`enemies/frost-wolf.svg`, art/enemies/frost-wolf.svg, headR 35 as the wolf): the round-8 wolf as a white wolf of the ice: a pale blue-white coat, a shaggy mane of pointed white tufts, a cluster of ice shards grown along its back, a blue-grey tail tip, ice-blue claws. Was the wolf turned pale.
- **Ice slime** (`enemies/frost-ice-slime.svg`, art/enemies/ice-slime.svg, headR 49): the game's slime shape made of ice: glassy, white at the top left going clear blue at the edge, three shards frozen inside, a bright shine, two icicles where the slimes' point is. Was the slime drawn in code, turned pale.
- **Frost spider** (`enemies/frost-spider.svg`, art/enemies/frost-spider.svg, headR 54): a new spider in round 8's creature build (round abdomen, small head, two fangs, four smooth jointed legs a side; the front pair in the arm parts, so they strike): pale ice-blue, the legs frosted white from the knee down, a white frost-flake on the abdomen. Was the round-5 hunter spider turned blue.
- **Yeti** (`enemies/frost-yeti.svg`, art/enemies/yeti.svg, headR 68), with its **snowball** (`props/yeti-snowball.svg`, art/props/yeti-snowball.svg): the round-8 troll's body plan (the designer: "the same shape and fighting style as trolls") in white fur: a huge hunched back under a tufted white coat, a small blue-grey face under a white fur hood with a scalloped fringe, a broad flat nose and two fangs down from the lip, long furry arms reaching forward, huge blue-grey hands turned in to hold the snowball. The snowball is a prop like the troll's boulder (packed snow, a few clumps), drawn by render.js in place of the code-drawn ball (sprites.js lists it). Its board shows it with the snowball where the game puts it (`boards/frost-yeti-snowball.svg`). Was the troll turned white.
- **Icicle wraith** (`enemies/frost-icicle-wraith.svg`, art/enemies/icicle-wraith.svg, headR 42): Ghost B, the cold ghost the designer picked and round 8 kept for this ("Make this the wraith. Cold ghost that spawns icicles"), exactly as it was, with icicles hanging off its shroud: a fringe of icy points along both sides and two at each sleeve's end, their roots tucked under the cloth. Was Ghost A turned blue.
- **Frost spirit** (`enemies/frost-spirit.svg`, art/enemies/spirit-frost.svg, headR 34): the spirits' one shared shape, a comma: a round glowing core with the element's mark in it and a wisp of a tail sweeping back, tapering and curling to a point (#back, it sways); ice blue with a white six-armed snowflake. Every spirit is this shape in its element's colours with its own mark. Was Ghost A turned blue.
- Checked on `python -m http.server 8883`: `tools/labshot.mjs` sheets of every frost kind in every pose (`m=sheet&kinds=frostWolf,slimeIce,spiderFrost,yeti,frostWraith,spiritFrost`), and `tools/clip.mjs` runs in the Frost Hollow (`theme=frost&allnodes=1&lvl=40`, floor 1 and floor 3 with `foes=` the new kinds): no page errors.

## The Ember Deep (js/foes10.js)
- **Fire spider** (`enemies/ember-fire-spider.svg`, art/enemies/fire-spider.svg, headR 54): the frost spider's build as a spider of the pit: coal black, every knee glowing like a coal, a glowing orange hourglass and cracks on the abdomen, orange-hot fangs. Was the hunter spider turned red.
- **Hellhound** (`enemies/ember-hellhound.svg`, art/enemies/hellhound.svg, headR 35 as the wolf): the round-8 wolf made lean (a narrower capsule) and coal black, a burning mane of flame tongues streaming back round the neck, its tail ending in a flame, an ember stripe down the snout, dark red inner ears, bone claws. Was the wolf turned dark red.
- **Cinder bat** (`enemies/ember-cinder-bat.svg`, art/enemies/cinder-bat.svg, headR 44 as the bat): the round-7 bat the designer picked, its shapes as they were (check9.py: the copied code still gives that bat), charred black: the wing bones glowing orange like embers, a glowing rim on the wings, ears glowing inside, cracks round the back and sides of the head (none on the face: two over the eyes' place read as a squint), an ember trail streaming behind (#back). Was the bat turned orange.
- **Fire spirit** (`enemies/ember-spirit.svg`, art/enemies/spirit-fire.svg, headR 34): the spirits' comma in flame orange with a pale flame in the core. Was Ghost A turned orange.
- **The Pit Lord** (`enemies/ember-pit-lord.svg`, art/enemies/pit-lord.svg, headR 68; the Forges' mini-boss, which wore the round-5 demon): a big demon in the heroes' bust build: dark red skin, no eyes, a dark scalp coming to a point on the brow, two great black ridged horns sweeping out and back, a grim mouth with two fangs, black iron pauldrons with spikes and forge-lit edges, molten cracks on the arms, folded dark red wings behind (#back); a whip of fire in the right hand (the handle in the fist below the shoulder, the burning lash lying forward and curling in across the front, it swings with the arm), a clawed left hand.
- Checked: lab sheets (`kinds=spiderFire,hellhound,cinderBat,spiritFire,pitLord`), clips in the Ember Deep (`theme=ember&allnodes=1&lvl=40`, `foes=` the new kinds) and the Forges' last room (`bossroom&floor=2`, the Pit Lord): no page errors.

## Still weak
- The yeti's snowball sits a little ahead of its hands: the game puts it the yeti's radius + its own + 8 ahead (js/foes10.js packSnow), and the hands reach as far as the box allows; closing the gap means holding it closer, like the troll's boulder (foes9.js HOLD, sim.js), which is a rules change, not art.
- Everything in the Frost Hollow is white or pale blue on a pale blue floor: the frost kinds read by their outline more than their colour.
- The Pit Lord is a big red horned head on spiked shoulders; at game size it is close to the round-5 demon and devil stand-ins that still fight beside it (red, horned), set apart by its size, the wings and the whip. Its wings show only between the horns and the pauldrons.
- The cinder bat's ember trail mostly hides behind its head and reads as a flame on its crown.
