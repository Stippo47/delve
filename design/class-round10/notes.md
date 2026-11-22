# Art round 10 (lane A, round 13): the art-round8 and art-round9 notes, the big sun blade, the slime

Every note in `docs/riffle-log/2026-11-22-round12.txt` (decks art-round8, art-round9; the art remarks in v12-bosses),
then the two art lines of the designer's message (`docs/BUILD-v6.md`).

How it was built. The round-8 and round-9 generators were copied into `_src/` (`A2/`, `E3/`, `E1r4/`, `croc8.py`). A fix
to a design the designer saw is one argument or switch of its copied generator (`tail=`, `ORC_R10`, `CROC_R10`,
`troll10(head, arms)`, `wolf(paws=, scar=, mane=, body=)`, `ent(face=)`, `elder_ent(face=)` ...), with the note quoted
beside it; `_src/check10.py` calls every copied generator without them and checks it still gives the file the designer
saw byte for byte, then checks `_src/build10.py` rebuilds this folder byte for byte. Redraws ("bad quality", "Meh",
"REDO") are new code in the heroes' A2 library (`A2/bandits10.py`, `A2/wild10.py`, ...).
Renders (`_src/render10.py`), in `enemies/renders/`:
- a single design: `<name>.png` (big at its size in the game beside the archer, 8 facings, the 8 facings at game size
  beside the archer), `<name>-thumb.png`, and `<name>-before.png`: the exact file the note was on, on the same board;
- a set of variants: one board `<group>.png` (what you saw first, then each variant, labelled, at game scale; a row at
  game size in four facings each), `<group>-thumb.png`, `<group>-before.png`.
`_src/game10.py` copies into `art/` only the single fixes and redraws. **Where the note asked for variants the game
keeps its current art until one is picked.** `_src/look.py` makes scratch sheets in `tools/riffle/out/r10`.

## 1. The art-round8 notes

Variants waiting for a pick (the game is unchanged):
- **Ghost A**, "Tail is still a bit weird. Try 3 types.": `ghost-a-tail-point.svg` (a plain soft point straight back),
  `-stub.svg` (short and round, an egg), `-hem.svg` (a bell ending in three rounded scallops). Only the tail's outline
  points differ from the ghost you saw. Board `ghost-a-tails.png`.
- **Ghost B**, "Same thing": the same three tails on Ghost B (`ghost-b-tail-*.svg`). Board `ghost-b-tails.png`.
- **Troll**, "Try different heads. Make them slightly smaller keep boulder same size.": three heads on the round-8
  troll, nothing else changed: `greenskin-troll-head-a.svg` (a wide jaw with two big tusks at the corners of the mouth,
  long ears swept back, a heavy brow), `-b.svg` (a big potato nose over a small mouth with one snaggle tooth, a mop of
  moss hair), `-c.svg` (a broad flat-topped head, two stubby horns, a row of blunt teeth). Read as: the troll a little
  smaller (10%: r 60 -> 54, vr 44 -> 40), its boulder the size it is now; the board shows them that way with the
  boulder where the game puts it. Board `troll-heads.png`.
- **Troll**, "Make version without arms. Just hands": `greenskin-troll-hands-a/b/c.svg`: the same three heads with the
  two long arms left out, only the fists on the boulder. Board `troll-hands.png`.
- **Wolves**, "Show me wolves without paws": `wild-wolf-nopaws.svg`, `wild-dire-wolf-nopaws.svg` (with its new mane
  and body), `wild-alpha-nopaws.svg`: the same wolves with the two front paws left out. Board `wolves-nopaws.png`.
- **The Alpha**, "Change face scar": `wild-alpha-scar-claws.svg` (three raking claw marks over the left of the skull)
  and `wild-alpha-scar-snout.svg` (one long old scar down the snout with three stitch marks). Board `alpha-scar.png`.
- **Thornback boar**, "I could see it almost working. Don't like it rn yet. Make variants.": drawn again in the wolves'
  build (a capsule body, a ruff, a round skull, a blunt snout with the pink disc, tusks curving up from its sides):
  `wild-boar-ridge.svg` (a crest of dark bristles down the spine with three big thorns in it), `-quills.svg` (a coat
  of quills over the whole back, pale at the tips), `-plates.svg` (three overlapping horn plates, a thorn at each end).
  Board `boar.png`.
- **Ent**, "Face variants": `wild-ent-face-brow.svg` (two leaves for eyebrows, a wide mouth turned down),
  `-nose.svg` (a fat snag of a nose with a leaf growing on it), `-hollows.svg` (two knot-hole eyes and a jagged carved
  mouth: the one with eyes). Only the front of the head differs. Board `ent-faces.png`.
- **The Elder Ent**, "Change face. 3 versions. They should also be very big": `wild-elder-ent-face-brows.svg` (heavy
  moss eyebrows in a scowl, a wide mouth with peg teeth), `-nose.svg` (a great snag of a nose, a moss moustache
  drooping into the beard), `-glow.svg` (hollow knot-hole eyes and mouth lit from inside like a lantern). Board
  `elder-ent-faces.png`. **Very big, in the game now**: js/elderent.js r 64 -> 80, vr 48 -> 60 (about three heroes
  across; it was two and a half).
- **Sproutling**, "Don't like.": three new takes, all small with no face: `wild-sproutling-bulb.svg` (a walking
  turnip, its leaves lying back), `-acorn.svg` (an acorn under its cap, one leaf on the stalk), `-bud.svg` (a closed
  pink bud in three sepals on a rosette of leaves). Board `sproutling.png`.

In the game (`_src/game10.py`):
- **Orc** (`greenskin-orc.svg` -> art/enemies/orc.svg), "Move tusks to the side... While at it fixe hair": the two tusks
  stand at the corners of the mouth (they stood in the middle of it); the topknot is tied with a bone ring and a thick
  tail of hair falls back from it to a tuft (it was a ball with a thin stick behind it). Nothing else.
- **Croc** (`sewer-croc.svg` -> art/enemies/croc.svg), "Fix axe": the two grey slabs half under the snout (cut off by the
  box) are real axes clear of the head: a shorter haft, one bearded steel blade turned out with a bright edge, a dark
  iron eye and a small poll. Same fists and places.
- **The bandits**, "Overall the bandits were all bad quality", and the Chief, "Meh. Could be done better": all nine
  drawn again (`A2/bandits10.py`). The gang's red bandanna and rag-edged leather are kept; each now has headgear with
  real shapes in it, its own colour, a bigger weapon drawn like the heroes' (blades split light and dark), and
  something on the shoulders:
  - `bandit-sword.svg` (art/enemies/bandit.svg): a dented iron pot helm with a riveted rim and a ridge, a mail collar; a
    broad sword; a round shield with an iron rim and boss and a band of the gang's red.
  - `bandit-torch.svg`: a battered slouch hat on the farmers' hat (stitched brim, a nick, a red band), a green neck
    cloth; the torch held out in front of the left fist, the sword on the right.
  - `bandit-greatsword.svg`: a shock of black hair in back-swept spikes, a mustard headband knotted at the side; a
    great sword in both fists across the front.
  - `bandit-axe.svg`: a fur hat with a thick pale band and a striped tail hanging back (it sways), a wool collar; a big
    bearded axe, the blade turned out.
  - `bandit-spear.svg`: a moss-green hood with a long tail and a scalloped mantle; a long spear with a rag of red tied
    under its head.
  - `bandit-daggers.svg`: the cutpurse, bare-headed: dark auburn hair swept back in a wave and tied in a long tail (it
    sways), a gold ring in one ear, a slate scarf collar; a long curved knife in each hand.
  - `bandit-poacher.svg`: an olive hunter's cap with a pointed turned-up brim and a long pheasant feather, a scruffy
    beard (no mask: not one of the gang), a wolf-fur mantle, the bow in front, the net on the back.
  - `bandit-brute.svg`: bald and scarred, a spiked iron pauldron strapped on the right shoulder, a fur collar; a great
    club bound with spiked iron bands, a wrapped left fist.
  - `bandit-chief.svg`: a wide black cavalier hat, one side pinned up, a gold band and a great red plume sweeping back
    over it; long black hair; a black coat with red facings, gold buttons and gold-fringed epaulettes, a short red cape
    behind (it sways); a big gold-hilted cutlass and a smoke bomb with a lit fuse.
- **Dire wolf** (`wild-dire-wolf.svg` -> art/enemies/dire-wolf.svg), "Mane not big enough. Body also 10% bigger": the
  tufted mane's radius is 25% bigger with longer tufts and a second darker layer inside it; the body capsule is 10%
  wider and longer (it grows back and out; the head, tail and paws are where they were).
- Checked on `python -m http.server 8897`: `tools/labshot.mjs` sheets of the nine bandit kinds, the orc, croc, wolves
  and Elder Ent in every pose, and a `tools/clip.mjs` run in the Wildwood: no page errors.

## 2. The art-round9 notes

### The Frost Hollow
- **Icicle wraith** (`frost-icicle-wraith.svg` -> art/enemies/icicle-wraith.svg, headR 37 as before), "Different look.
  Maybe more banshee looking": drawn again as a banshee of the ice in the ghosts' build and Ghost B's pale blue: a round
  head, two tall dark eyes drawn down in grief, a long open wailing mouth, a crown of icicles standing up from the back
  of its head, long hair or veil streaming back in ragged tatters (#back, sways), two long sleeves reaching forward
  with icicles at their ends. In the game.
- **Frost spirit**, "That tail should be like that rat tail where it's wiggly/ follows behind": the art is ready and the
  drawing is code, so it **waits on one function in js/render.js** (the lead's). The spirits' cores without the drawn
  tail are in `enemies/spirit-core-<element>.svg` (all seven: the same round-9 core, `beasts9.spirit9(tail=False)`), and
  copied to `art/enemies/spirit-core-*.svg`, unused. Board `frost-spirit.png`: before, a mock-up of the code tail
  (`boards/frost-spirit-code-tail.svg`), and the core alone. The game still shows the round-9 spirits. What the code
  needs (the spirit's art scale is vr / headR = 15 / 30, so the numbers below are in units of `u.vr`):
  - each spirit def: `art: 'art/enemies/spirit-core-<el>.svg'` (headR 30 as now) and `tail: [light, dark]`: frost
    `['#E6F8FF', '#7EC2E6']`, fire `['#FFC650', '#E0482A']`, heal `['#FFF2B0', '#E8B640']`, ward `['#E2D4FF', '#8E6AD6']`,
    poison `['#D6F28A', '#5E9E2A']`, haste `['#F2F6FF', '#9CB2D4']`, shock `['#FFF29A', '#E0A82A']`;
  - in the loop that draws the rat's tail (render.js, the line with `drawTail`), before `drawUnit`:
    `if (u.def.tail && !u.downed) drawSpiritTail(ctx, u, dt);`
  - `drawSpiritTail` is `drawTail` with a ribbon instead of a line: the same chain on springs (`u.tail`), `n = 5` points,
    `seg = u.vr * 0.65`, the anchor `u.vr * 0.13` AHEAD of the unit's centre (the core's centre is 0.53 vr ahead of the
    unit's and its radius is 1.2 vr, so the root is hidden under the core); for more wiggle than the rat's, a softer
    spring (`40`, damping `6`) and each rest point pushed sideways by `Math.sin(w.time * 7 - i * 1.1) * seg * 0.16`;
    the ribbon's half-width at point i (0 = the anchor) is `u.vr * 0.83 * (1 - i / n) ** 0.8`; build the outline from the
    left offsets down the chain and the right offsets back, close it, stroke it in INK at `OUTLINE * 2` (round joins),
    then fill it with a linear gradient from `tail[0]` at the anchor to `tail[1]` at the tip.
- **Yeti** (`frost-yeti.svg` -> art/enemies/yeti.svg) and its **snowball** (`props/yeti-snowball.svg` ->
  art/props/yeti-snowball.svg), "Meh. Not great. Don't like little balls on snow ball for 1. Face is a. Little weird.
  That nose looks like an eye. Weird fangs/mouth" (`YETI_R10`, the rest is the round-9 yeti): the snowball's two
  stuck-on lumps and four clumps are gone (one smooth ball, three faint streaks); the dark nose blob is a small pale
  nose; the mouth is one wide line turned down with two short lower fangs standing up at its corners (they hung down
  in the middle); the hands sit 8 units further back so they are whole inside the box. In the game.

### The Gilded Spire
- **Choir sprite** (`spire-choir-sprite.svg` -> art/enemies/choir-sprite.svg), "Weird hair": the lumpy cap with spiral
  squiggles is the picked cherub's hair (round 4's): a cap of soft curls, each bump one arc, a parted fringe. Nothing
  else. In the game.
- **Fallen angel** (`spire-fallen-angel.svg` -> art/enemies/fallen-angel.svg), "Meh. I think u could do better": drawn
  again on the picked angel's build: its two-layer wings gone dark violet and torn, the left one half gone; ashen skin,
  long black hair with a pale streak, a broken halo of tarnished gold askew over its head, a robe with a ragged cowl, a
  black glaive with a pale violet blade. In the game.
- **Golem**, "Oh nvm. Yeah not quite. Like I said do variants", and **Gilded golem**, "Looks good. I think you could do
  better. First get down basic golems body. Make 3 variants. Then make gilded. Note I love the eye.": three bodies,
  each with the eye (the diamond rune, drawn as round 9 drew it) on its head: `spire-golem-boulders.svg` (three big
  round stones and two fist stones), `-blocks.svg` (cut temple stone: a squared chest block, a cube head, squared
  fists), `-hunch.svg` (one great boulder of a back with a band of runes, a small head sunk in its front, long arms).
  Then each one gilded (`spire-gilded-golem-*.svg`: gold plates on the shoulders and knuckles, a gold brow plate round
  a white eye). Boards `golem-bodies.png`, `gilded-golems.png`. Waiting for a pick: the game is unchanged.
- **The Twin Heralds** (`spire-herald-light.svg`, `spire-herald-fallen.svg` -> art/enemies/herald-light.svg,
  herald-fallen.svg), "Meh", "Meh. Could do better. More interesting design (and better quality)": drawn again as
  heralds: a helm with a tall fan crest from brow to nape, two layered pauldrons a side with a pale edge, a gorget, a
  gauntlet; the picked angel's two-layer wings; a standard: a long spear with a swallow-tailed pennant under the blade
  (a gold sun on white; a violet diamond on black). The Fallen Herald is the same shape in black and violet with torn
  wings. In the game.

### The Sunken Dunes
- **Cobra** (`dunes-cobra.svg` -> art/enemies/cobra.svg, headR 48 -> 54 for the wider art), "Meh": drawn again: one neat
  coil of two turns behind (banded, the thin tail lying out to one side: #back), the hood spread in front of it with a
  dark chevron and a pale rim, a wedge of a head with two brow ridges and a forked tongue. In the game.
- **Jackal guard** (`dunes-jackal.svg` -> art/enemies/jackal.svg), "Good overall shape and colours, bad quality": the
  same shape and colours drawn again: a head the size of the heroes' (it was a small ball), a broad snout with the gold
  stripe, tall ears broad at the root with gold inside, the collar as four clean bands (gold, turquoise, lapis, gold)
  over white linen, a bigger gold-bladed spear, a bronze shield with a rim, spokes and a gold boss. In the game.
- **Mummy** (`dunes-mummy.svg` -> art/enemies/mummy.svg), "No": drawn again in the heroes' bust build: a head wound in
  broad crossing bands with one dark slit across it (nothing in it), a loose end by its cheek, a turquoise scarab on a
  gold collar, both arms held straight out in front with big wrapped fists, a long strip flying back from one shoulder
  and a short one from the other. In the game.
- **Sand serpent**, "Wth is that snake enemy" (v12-bosses deck): a proper snake. The head (`dunes-serpent-head.svg` ->
  art/enemies/serpent-head.svg): a broad arrow of a head, widest at the jaws, a blunt snout, two brow ridges, nostril
  pits, a pale lip, a forked tongue, and the neck with the body's pattern. A body segment (`dunes-serpent-coil.svg` ->
  art/enemies/serpent-coil.svg): a rounded link a little longer than the step between segments, with a dark diamond
  edged pale in the middle and half of one at each end, so segments overlap and their diamonds meet into one patterned
  body. `boards/dunes-sand-serpent.svg` shows the head and six segments laid as the game lays the chain. In the game
  (how it moves is the foes lane's).

### The Clockwork Foundry (REDO; ticked: the storm spirit, the gun turret)
- **Bee, wasp, hornet** (`foundry-bee.svg`, `-wasp.svg`, `-hornet.svg` -> art/enemies/bee.svg, wasp.svg, hornet.svg;
  headR 48 / 50 / 52 -> 56 / 58 / 62 so they stay the size they were), "U are losing the style. Too many segments. 1
  maybe 2 body segments. Not 3.": drawn again: the bee is one plump striped body (its front end a little darker, two
  feelers, a stinger); the wasp is a small head and one long abdomen tapering to a long stinger; the hornet a broad
  head with mandibles and one fat abdomen. One plate wing a side (a single shape with one rib; they flap). In the game.
- **Gear sprite, cog sprite** (`foundry-gear-sprite.svg`, `foundry-cog-sprite.svg` -> art/enemies/gear-sprite.svg,
  cog-sprite.svg), "Cogs weren't horrible but also weren't very interesting/ could be done better": still circles from
  above; the gear: bevelled steel teeth, one capped in brass (its spin shows), five curved spokes with dark windows round
  a glowing amber heart in a brass collar; the cog: a broad brass crown wheel with four crescent windows round a cross
  of spokes, rim rivets, a small steel pinion riding on its middle with a red jewel. In the game.
- **Gun turret** (`foundry-turret-gun.svg` -> art/enemies/turret-gun.svg), "Almost good. Turret part shoukd be in the
  wall more. Circle half way in. Could add more detail/ parts." (`turret_gun(r10=True)`: the dome and barrels are
  exactly round 9's): the game mounts a wall turret with its centre a collider's radius out from the wall, and the dome
  must stay on that centre to swivel, so the wall comes out to it: the thin plate is a riveted iron bulkhead built out
  from the wall as far as the dome's middle (#back, it stays put), with a round socket in its front edge and a hazard
  stripe along its lip: the dome sits half in the socket, half out. More parts: a drum magazine on the dome's side, a
  top hatch with a hinge, a brass sight, cooling collars on the barrels, a feed pipe along the wall. In the game.
- **Steam turret** (`foundry-turret-steam.svg` -> art/enemies/turret-steam.svg), "Meh. Not horrible": drawn again as a
  boiler: the same base plate; a round copper boiler bound with two riveted brass straps, a flared brass nozzle like a
  horn's bell, one pressure gauge on top, a red valve wheel on a pipe at its side, a relief valve at the back with a
  puff of steam. In the game.
- The rest of the Foundry (automaton, bomb bot, flame and laser turrets, mortar, tesla coil, repair drone, smith, saw
  blade, chain crawler, drill bot) had no note of its own and is as it was: see "Still weak".

### The bosses
- **Choir singer** (`boss-choir-singer.svg` -> art/bosses/choir-singer.svg), "Flip book. Hair weird": the book is turned
  the other way up (its pages fall open towards the singer, who reads it) and the hair is the picked cherub's, as the
  choir sprite's. In the game.
- **The Gilded Seraph, fallen**, "??? Wrong sprite?": the tile showed the right file (her fallen look, dark wings, black
  and violet, which the game does not use), but the deck gave it the gold seraph's label and text ("The Gilded Seraph
  ... six golden wings ... white robe with gold trim", tools/riffle/decks/art-round9.json, item
  boss-gilded-seraph-fallen), so a dark figure sat under a description of a golden one. Nothing was drawn wrong; the
  card was mislabelled. Her fallen look is left as it was (unused).
- **The Gilded Seraph** (`boss-gilded-seraph.svg` -> art/bosses/gilded-seraph.svg), "Looks decent as a base. Could be
  improved upon. Up the quality. Make more interesting": the same figure drawn again: her six wings are the picked
  angel's two-layer wings (they were eighteen separate feathers), set as a seraph's: a pair raised behind her head, a
  pair spread wide, a pair swept down; a sunburst of rays behind her head; a gold diadem with a sun jewel and a short
  veil of gold links over the top of her face; gold shoulder plates with a pale edge. In the game, until the boss lane
  replaces her.
- **A biblically accurate angel** (`boss-biblical-angel.svg`; v12-bosses deck: "I want one of those biblically accurate
  angels"), for the boss lane to build on: no body: one great open eye in a gold socket looking forward, two golden
  wheels crossing round it, each set with six small open eyes (the wheels are #arm-l and #arm-r, so they can turn
  against each other), and six wings (the picked angel's, a pair raised, a pair spread, a pair swept down: #back). Board
  `boss-biblical-angel.png`, beside the redrawn seraph. Not in the game.
- **The Goblin Chieftain** (`boss-goblin-chieftain.svg` -> art/bosses/goblin-chieftain.svg), "Are those feathers in
  hair? Fix teeth. Better weapons and dual wielding. More and better war paint. 1 clipped ear" (`chieftain9(r10=True)`,
  each change marked CHANGE10): the three small white tabs behind the crest are two big eagle feathers (a quill, a
  notched vane, a dark tip) tied on with a bone bead; the two slivers at the ends of the grin are two proper lower
  fangs at the corners of the mouth; a jagged war chopper in each fist (the cleaver and the free fist are gone; the
  spears stay on its back); war paint: a real handprint on the left shoulder, three chevrons on the right, two slashes
  on each cheek, a stripe down the nose, bands on the ears; the left ear's tip is cut off. In the game.
- Checked on `python -m http.server 8897`: lab sheets of every kind above in every pose, `tools/clip.mjs` runs in the
  Frost Hollow, the Gilded Spire, the Sunken Dunes and the Clockwork Foundry with `foes=` the new kinds: no page errors;
  `node tools/battles.mjs`: 517 battles, 0 problems.

## 3. The designer's message of 2026-11-22
- **Sun blade** (`spire-sun-blade.svg` -> art/enemies/sun-blade.svg), "make the sword enemy much bigger. Like 3 units
  across in size": drawn again to be seen at that size: a long broad blade split light and dark down a fuller set with
  small suns, pale edges, a crossguard like a pair of gold wings with a sun disc and twelve rays at its heart, a grip
  bound in white, a sun for a pommel; balanced on the middle of its length (it turns about its own middle; round 9's
  turned about its guard). Its size: js/foes10.js sunBlade r 22 -> 36, vr 17 -> 52 (headR 58): the sword is 179 room
  units long, three heroes.
  **It will not show until one key is renamed**: js/boss-seraph.js also defines `sunBlade` (the Seraph's summoned blade,
  a boss part drawn in code with no brain), and the bosses' defs are added after the enemies', so the Spire's sun blade
  IS that part: this is why "it doesn't do anything currently". Renaming the boss's (the key on boss-seraph.js line
  204 and the `part(w, u, 'sunBlade', ...)` call on line 66, to `seraphBlade` say) gives the Spire its own sword back
  with its brain, this art and this size (checked in the lab with that rename, not committed: a boss file is not this
  lane's).
- **Slime** (`slime.svg`, `slime-small.svg` -> art/enemies/slime.svg, slime-small.svg; js/units.js slime and slimeSmall
  now say `art` and `headR: 64`), "Get new slime spite in": the slime you picked with its tail removed (round 6's
  `slime-big.svg`; `critters.slime("big")` still gives it byte for byte) is the game's slime, in the game's blue ("The
  base slime is blue"); the slimelet is the same slime, paler, without the bone. Every other kind follows from them as
  before, by the game's colour turns: the big slime (1.6x), the poison and sludge slimes, the poison slimelet, and the
  two leeches (still stand-ins: they are slimelets turned red and pink). The ice slime and the fire slime keep their own
  art. Checked: a lab sheet of all of them.

## Not done
- Step 4 of the brief (the Spire's plain angel, cherub and seraph, which still wear round-5 stand-ins; the Pit Lord).
- The rest of the Foundry (see below).

## Still weak
- The Foundry card was REDO and only the four notes on it were redrawn; the automaton, bomb bot, flame and laser
  turrets, mortar, tesla coil, repair drone, smith, saw blade, chain crawler and drill bot are round 9's.
- The gun turret is "in the wall" by building the wall out to it; set truly into the wall it would need the game to
  mount wall turrets with their centre on the wall's face (families.js mountOnWall), and then a different back plate.
- The sand serpent's segments are separate units, each with its own outline, so the body shows a dark line between
  links; one outline round the whole snake would need the game to draw a chain's inks together.
- The fallen angel has one wing half gone: lopsided on purpose, but at game size it can read as a wing hidden rather
  than torn. It and the Fallen Herald are dark on dark.
- The troll's "slightly smaller" is read as the whole troll (10%); if the heads were meant, the three heads are already
  drawn at the old head's size and only the game numbers differ. Picking a troll also needs the boulder's size freed
  from the troll's (js/foes9.js boulderOf: 0.62 of the troll's collider; 0.69 keeps today's boulder beside a troll of
  r 54).
- The knife bandit and the hero Twinfang both wear swept-back hair and a tail; hers is navy with a red cape.
- The mummy's wrappings are bands of shade, not separate strips; up close they are flat.
- The Elder Ent at r 80 is big for the paths of its clearing: untested in a full boss fight beyond `tools/battles.mjs`.
- The orc's cleaver still runs out of the bottom of its box on the boards (it did in round 8; not in the note).
