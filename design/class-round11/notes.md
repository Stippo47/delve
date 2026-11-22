# Art round 11 (lane A, round 14): the art-round10 and art-round10b answers, the gaper's line, the Enchantress and the Succubus

Every line of `docs/riffle-log/2026-11-22-round14.txt`, decks art-round10 and art-round10b, and the art line in
v141-battle. The standing rule (docs/BUILD-v7.md): start from the exact version seen, change only what the note asks.

How it was built. Round 10's generators were copied whole into `_src/` (`A2/`, `E3/`, `E1r4/`, `croc8.py`). A fix is one
switch or argument of the copied generator, named beside the note it answers (`ORC_R11`, `CROC_R11`, `troll10(r11=)`,
`wolf(head=, short=, paws=, spiky=)`, `NO_FOLD`, `AXE_FLIP`, `KNOT_OVER`, `RIDGE_LINES`, `ENT_R11`, `boar(no=)`,
`COBRA_R11`, `COIL_R11`, `mummy1(button=, arms=)`, `WRAITH_R11`, `YETI_R11`, `ice_slime(spikes=)`, `herald(r11=)`,
`SERAPH_R11`, `chieftain9(r11=)`, `BOMB_R11`, `FLAME_R11`, `LASER_R11`, `SMITH_R11`, `SAW_R11`). `_src/check11.py` runs
the copied generators with none of them and checks they still give the round-8, round-9 and round-10 files byte for
byte (and the first round-10 mummy, kept in `_src/base/`), then checks `_src/build11.py` rebuilds this folder byte for
byte: 285 files, all identical. Variants of a design the designer liked are that design's generator with one hook filled
(its visor, key, eye, face: `A2/new11.py`); redraws are new code in the heroes' A2 library (`A2/new11b.py`,
`A2/people11.py`).
Renders (`_src/render11.py`, round 10's boards): a single fix `<name>.png`, `-thumb.png` and `-before.png` (the file the
note was on, on the same board); a set `<group>.png` (what was seen first, then each option at game scale beside the
archer, and a row at game size in four facings). `_src/game11.py` copies into `art/` only the picks and the fixes.
**Where a note was open the game keeps its current art until a pick.** A clip of the three things that move:
`clips/cobra-spirits-gaper.mp4`. The deck: `tools/riffle/make_art_round11.py` -> `tools/riffle/decks/art-round11.json`
(checked, not sent).

## 1. Picks, in the game as picked
- **Ghost A** "Do 1", **Ghost B** "1": tail 1 is the point (round 10's board: 1 point, 2 stub, 3 hem).
  `class-round10/enemies/ghost-a-tail-point.svg` -> art/enemies/ghost.svg; `ghost-b-tail-point.svg` -> ghost-b.svg (no
  kind uses ghost-b yet).
- **The Elder Ent** "B": `class-round10/enemies/wild-elder-ent-face-nose.svg` -> art/enemies/elder-ent.svg.
- **The Alpha** "Claw marks": on the Alpha below.
- **Frost spirit's tail** (ticked): the game draws it now. js/render.js `drawSpiritTail` (the rat's chain on softer
  springs, each point swayed, a tapering ribbon with smooth edges, inked, a gradient from root to tip); all seven
  spirits' defs point at `art/enemies/spirit-core-<el>.svg` with `tail: [root, tip]` (js/foes10.js, dunes.js,
  foundry.js). The round-9 spirit files with the drawn tail stay in art/ unused.
- **The boar** "Ridge.": `class-round10/enemies/wild-boar-ridge.svg` -> art/enemies/boar.svg. "Show me without the
  mane": board `boar.png`: A as picked, B without the dark crest of bristles (the thorns stay), C without the ruff round
  the neck (both readings of "mane").

## 2. Picks with a change, in the game
- **Troll** "B. Sharper jaw. Slightly longer head. No mouth. Long nose." and "Yeah they need arms": `greenskin-troll.svg`
  -> art/enemies/troll.svg. Head B with four changes and nothing else: the head's outline has straight cheeks to a
  narrower squarer chin and is 11 units longer; the mouth line and its tooth are gone; the nose is drawn out to the chin.
  Arms kept. The size the round-10 note asked for goes in with it: js/enemies.js troll r 60 -> 54, vr 44 -> 40,
  `boulder: 0.69` (js/foes9.js boulderOf reads it, so the boulder stays r 41). Board `boards/renders/greenskin-troll.png`.
- **Ent** "Remove mouth. B is good Take leaf off nose": `wild-ent.svg` -> art/enemies/ent.svg.
- **Wolves** "Bring their heads forwards a bit. Shorten body a bit. And I think this is good. Also show me with the pawns
  rendering under the body": `wild-wolf.svg`, `wild-dire-wolf.svg`, `wild-alpha.svg` (no paws, the head 7 units forward
  and the ruff 3.5, the body 12 shorter with the tail brought forward; the Alpha with the claw marks) -> art/enemies/
  wolf.svg, dire-wolf.svg, alpha.svg, and art/summons/wolf.svg (the druid's wolf was the same file). `*-paws-under.svg`:
  the same with the paws drawn before the body. Board `wolves.png` (and `wolves-before.png`).
- **Dire wolf** "Less spikey": its mane 12 tufts 0.3 deep -> 9 tufts 0.16 deep, the same size. In the game's dire wolf;
  `wild-dire-wolf-less-spiky.svg` shows only that change on the tile as it was shown (with paws).

## 3. Fixes, in the game
Wildwood and Sewers
- **Bandits** "I think I don't like the line in the bandanas. Remove them for everyone": the fold line is gone from all
  eight masked bandits (also the three waiting for a pick). **Axe** "Flip the axe": the blade is on the other side of the
  haft (it faces in; part of it now lies under the bandanna, nothing was moved). **Knife** "Pigtail not layered
  properly": the kerchief's knot and ends are drawn after the body, so they lie on the kerchief. **Sword** "The strip
  down the middle should be 2 lines dark on 1 side light on the other. Sharp contrast instead of gradient": read as the
  helm's ridge: two flat lines, light and dark, in its place.
- **Orc** "Pony tail layer problem. Try without hair tie": the tail of hair is drawn after the head, under the knot; no
  bone ring. No point moves.
- **Croc** "Aim inwards. Put a chip in them and make them rusted (save this version though) Make sure to use the axe on
  the left side and mirror it to the other side": the left axe is drawn once, aimed in (9 degrees out -> 12 in), and the
  right one is that drawing mirrored about the middle, fist and all; rusted, a chip out of each edge.
  `sewer-croc-steel.svg` is the same in round 10's steel (the saved version, with round 10's own file). "Aim inwards" is
  read as where the axes point, not which way the blades face.
Frost, Spire, Dunes
- **Icicle wraith** "Fix hands then good": each sleeve is drawn back to a wrist with three long icicle fingers over it.
- **Yeti** "Give dark nose again. Have it be taller then it is wide. Also make torso less sharp on the front": round 9's
  dark nose, 14 wide and 21 tall; the coat's front edge is one soft curve with rounded corners.
- **Ice slime** "I like the old one more. Maybe without the side spikes the old one could work": round 9's slime without
  its two icicles; js/foes10.js slimeIce headR 64 -> 49 (round 9's).
- **The Twin Heralds** (the Fallen: "Make face more interesting. Make the spear flag smaller, and have them hold the spear
  lower down on the handle and forwards more Hand also looks off"; the Light: "Reduce the shadow of face. Same spear
  flag. Idea is to have them both have bangs but 1 is down 1 way and the other has it the other way. Don't like hands"):
  both: the pennant 0.6x, the spear hand a plain hero's fist 40 units further down the shaft where it shows, the left
  hand a plain fist, bangs under the helm (the Light's to one side, the Fallen's to the other). Light: a lighter brow, a
  fainter shadow under the helm. Fallen: a jagged violet crack down the bare cheek. To give the hand room inside the box
  the blade is 7 units shorter (45; it was 52).
- **Seraph** "Use the old head shape.": the old seraph's head path and cap of hair, point for point, in pale gold.
- **Cobra** "Have that top segment free from the bottom and have it slowly move around the bottom segment in game.": the
  hood's group is `#top-hood` with a pivot (nothing redrawn); js/dunes.js `sway: { r: 9, speed: 0.9 }`; js/parts.js
  moves every part whose id starts with `top`, and `#front`, on a slow circle over the coil.
- **Serpent segment** "Segment diamonds don't look identical to head diamonds. Slight smaller and fainter": the game
  draws a segment 0.69x the head's scale, so each segment now carries the head's own diamond drawn 1.444x: the same size
  on screen, solid, the same colours. Board `boards/renders/dunes-sand-serpent.png`.
- **Mummy** (first deck, on the first take: "Don't like Weird button on face. Remove arms. Otherwise good"; second deck,
  on the second take: "I liked the last one just without the button thing. I want to see without the collar"): "the last
  one" is the first take, the one with the turquoise button (its code is back as `dunes10.mummy1`, checked against the
  file from that commit). Board `mummy.png`: A no button, no arms (in the game); B no button, arms kept; C the second
  take without its collar. The first take's gold collar is hidden under its head, so "without the collar" shows on C.
- **The Goblin Chieftain** "Have them hold hands forwards more. Flip blades direction": fists and choppers 12 units
  forward, each chopper mirrored about its haft.
The Foundry
- **Bomb bot** "Remove yellow caution tape. Fix fuse look. Put those leg things under the body coming out slightly on its
  left and right side": no band; a brass neck with a dark mouth, a twisted cord to an ember; the feet under the body's
  sides, a third of each showing.
- **Flame turret** "The flame looks weird also ontop of the barrel?": a small teardrop with a pale core, drawn before the
  nozzle so it comes out from under its lip.
- **Laser turret** "Have the socket hug it more.": the socket is the housing's capsule, 8 units clear of it.
- **Tesla coil** "slightly cheated up so you can see it better": drawn standing and tipped back: a footing, four
  windings, the ring and spark on top.
- **Foundry smith** "The glowing hammer should have it on the side not top. Don't like the look of the hand.": the hot
  face is the head's inner end; the left hand is a plain fist.
- **Saw blade** "Add the middle detail onto the previous saw blade.": round 9's blade with round 10's red hub and nut.
The gaper (v141-battle: "the gaper in this pic has big outlines"): art/enemies/gaper.svg: its outline filter's radii and
a new `data-line="4.65"` on `#sprite` (24 / 31 of 6: the rattler's size over the gaper's); js/parts.js reads `data-line`
as the outline radius for that art. Nothing else in the file changed.

## 4. Sets to pick from (the game is unchanged)
- **Bandits**: torch ("Meh. Don't like the torch. Pretty cool hat for a bandit more suited for an outlaw"):
  `bandit-torch-hat/-cowl/-soot.svg`, a new torch on all (the hat kept on A); greatsword ("Meh"): `-helm/-hood/-horns`;
  spear ("Try again"): `-kettle/-wrap/-straw`; poacher ("Try again"): `-antlers/-quiver/-game`.
- **Fallen angel** "Try again": `spire-fallen-angel-ashen/-collared/-ember.svg`.
- **Golem** "Try 4 more. Keeps these.": `spire-golem-arch/-cairn/-shards/-wheel.svg`. **Gilded golem** "Don't like the
  gold mask look": `spire-gilded-golem-veins/-bands/-caps.svg` (no plate round the eye; on body A).
- **Sproutling** "try the original design just better. No arms. Less busy leaves.": `wild-sproutling-plain/-ruff/-spread`.
- **Dart trap** "Different eye style. Variants": `dunes-dart-trap-horus/-gem/-scarab.svg`.
- **Automaton** "Good except visor. 3 variants... key... Make 3 for that too": `foundry-automaton-visor-grille/-lens/-vee`,
  `-key-ring/-bar/-clover`. **Chain crawler** "Different visor.": the same three (`foundry-crawler-head-visor-*`).
- **Repair drone** "3 variants for what's on its front... Eye?": `foundry-repair-drone-eye/-claws/-torch.svg`.
- **Steam turret** "Meh Don't like gun barrel": `foundry-turret-steam-pipe/-twin/-kettle.svg`.
- **Mortar** "Nope. Should be a cannon aiming straight up with a circle hole in the top. Slightly offset from the middle":
  `foundry-mortar-ring/-trunnion/-pot.svg`.
- **Bee** (from the wasp: fatter, wings after the body, one red eye, cogs): `foundry-bee-collar/-back/-hubs.svg`.
  **Hive**: `props/foundry-hive-dome/-drum/-comb.svg`.
- **The Gilded Seraph** "I don't love the helmet and face covering": `boss-gilded-seraph-circlet/-halo/-hood.svg`.
- **The Pit Lord** "Face variants. Also tail": `ember-pit-lord-eyes/-skull/-furnace.svg` (each with one of three tails),
  `ember-pit-lord-tail.svg` (its face now, tail 1).
- **The Enchantress**: `heroes/enchantress-buns/-veil/-curls.svg`. **The Succubus**: `ember-succubus-tail/-whip/-heart`.

## What the game still needs (not this lane's)
- A wasp or bee with wings on top: the picked bee's wing groups come after `#body`; nothing to change in code.
- The hive is a prop with no kind yet. The picked visor, key, eye, face and tail are one hook each to turn into the file.
- The frost wolf and the hellhound are the same wolf build and still have paws (ticked art, not on the wolves' card).

## Still weak
- The axe bandit's flipped blade lies half under the bandanna.
- The mummy without arms keeps the loose end by its cheek, which the arm used to hide.
- The flame turret's pilot flame is small (the nozzle already reaches the edge of the box).
- The poacher's brace of birds reads as shapes behind the shoulders more than as birds.
- The collared fallen angel's scythe crosses under its chin.
- The Light Herald's gold bangs sit close in colour to its gold helm.
