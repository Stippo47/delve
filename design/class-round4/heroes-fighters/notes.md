# H4: fighters and oddballs (art round 4)

Ten new heroes plus two companion sprites. Brief: "Vampire, Beast tamer (whip, with a small beast companion drawn
separately), Samurai, Gladiator (net and trident), Valkyrie, Executioner, Jester, Werewolf, Engineer (wrench; a small
turret drawn separately), Scarecrow. Must not look like the knights or barbarians."

Applies to every design: the base head, shoulders and pivots (46 108 / 154 108), the round-3 outline filter, soft
gradients lit from the left, contact shadows, no inner outlines, no eyes/brows/blush on people, with the small mouth
curve. One-handed weapons are drawn **before #body**, so they pass under the shoulder and only the fist shows at the
front edge. **Every fist is turned to its handle** (knuckle row along the handle). The two two-handed weapons (katana,
axe) are held in the middle, in front: both fists on the handle, all in arm-r, drawn after #body, arm-l left out.

Generator: `../_src/H4/heroes.py` (writes every SVG), `render.py` (the board renders), `lineup.py`
(`renders/_lineup.png`: all of these at 70px and 40px next to the knights, barbarians, rogues and farmers).

## Vampire — `fighter-vampire.svg`
- Did: pale grey-lilac skin and hands, black hair slicked back to a widow's peak, a tall stand-up collar in four
  bat-wing points (black outside, crimson inside) in #back, wine-coloured shoulders. Rapier with a gold cup hilt in
  the right hand, left hand free.
- Move: **Life drain**: each hit heals the vampire for a share of the damage; below half HP, a lunge that drains more.
- Weak: very dark overall; the read is the bat collar and the pale face. The rapier is thin (true to a rapier) and
  may get lost when it swings.

## Beast tamer — `fighter-beast-tamer.svg` + `tamer-beast.svg`
- Did: a ringmaster: tall black top hat with a red band, emerald tailcoat with gold frogging, a bullwhip whose lash
  curls out in front. (A first, wilder take with a leopard pelt and a ponytail read as an acorn; dropped.)
- Beast: a tiger cub about 60% of a hero: orange with stripes, round ears, pale muzzle, simple eyes (beasts may have
  eyes), striped tail in #back (pivot to sway), front paws as arm-l/arm-r so it can walk.
- Move: **Crack the whip**: the cub gets a burst of speed and damage and pounces on the tamer's target.
- Weak: the hat is tall (it reaches the top of the sprite box); it is the whole read, but say if it should be
  shorter. A ringmaster may be more circus than dungeon; a wild-hunter tamer is possible if this is not wanted.

## Samurai — `fighter-samurai.svg`
- Did: black kabuto with a wide black neck guard laced in red, a big gold crescent (maedate) on a red brow plate,
  red lacquered shoulder plates with gold bands, black lacquered gloves. A katana held two-handed in front, diagonal
  so the mouth stays clear.
- Move: **Iaido dash**: a fast straight dash through enemies, cutting everything on the line.
- Weak: the fists sit on the lower right of the face (as the Old Guard's do); black gloves keep them from merging
  with the skin. The blade is shortish so it stays inside the sprite box.

## Gladiator — `fighter-gladiator.svg`
- Did: retiarius: bare tanned shoulders with a leather strap, a tall bronze shoulder guard (galerus) standing up on
  the left, short black curly hair (no helmet, so it can't read as a knight). Trident in the right hand, weighted net
  in the left; both arms before #body.
- Move: **Net throw**: throws the net to pin one enemy in place for a few seconds; the trident hits pinned enemies harder.
- Weak: the net's mesh is a texture of thin lines (darker beige, not outline-coloured); at 40px it reads as a pale
  bundle with weights. The bronze guard and the skin are close in hue.

## Valkyrie — `fighter-valkyrie.svg`
- Did: round silver helm with a gold brow band and two big white feathered wings sweeping back, long golden braids
  over the shoulders (she reads as a woman by the braids), silver scale on the shoulders. A spear with a winged gold
  crossguard in the right hand, left hand free. No shield, to stay clear of the Bulwark.
- Move: **Valkyrie's call**: revives a fallen ally at once at low HP (once per room), or throws the spear in a line.
- Weak: a winged helm is the Griffon's theme too (gold wings, purple); here they are white, bigger and on the helm
  sides, and the braids and the lack of a shield set her apart, but check them side by side.

## Executioner — `fighter-executioner.svg`
- Did: a dark pointed hood over the whole head with two eye slots (holes in the hood, not eyes), studded leather
  shoulders, a diagonal strap. A big crescent axe held two-handed in front.
- Move: **Execute**: a slow overhead chop that does huge damage to an enemy below a quarter HP.
- Weak: the hood is near the outline colour, so its inside shading is subtle; the read is the dark spade shape plus
  the axe. The axe could be bigger, but bigger leaves the sprite box.

## Jester — `fighter-jester.svg`
- Did: a three-pointed floppy cap split magenta and yellow with gold bells on the tips, a pointed ruff collar in the
  same colours, harlequin diamonds on the shoulders. A marotte (stick with a little jester head) in the right hand.
- Move: **Mock**: taunts enemies nearby so they attack the jester, and confuses one so it hits its own allies briefly.
- Weak: the ruff is busy at full size (fine at 40px). The marotte's little head reads only as a ball at game size.

## Werewolf — `fighter-werewolf.svg`
- Did: a grey-blue wolf head (tall pointed ears, a jagged ruff, a long snout pointing forward with a pale underside
  and a dark nose), a torn red shirt, no weapon: two furry paws with white claws held forward. Kept well apart from
  the Bearskin (brown bear hood over a human face).
- **Eyes: I gave it small yellow eyes.** It is the only hero with eyes; without them it read as a mole or a badger.
  This bends the "people have no eyes" rule (monsters may have them): your call, an eyeless version is one line.
- Move: **Frenzy**: each hit on the same target makes the next one faster; a howl at full stacks.
- Weak: angular fur shapes are a little sharper than the house style.

## Engineer — `fighter-engineer.svg` + `engineer-turret.svg`
- Did: orange work suit with a dark band, a brass gear on the left shoulder, a welding mask flipped up on top of the
  head (steel, dark green window), messy brown hair. A big open-ended wrench in the right hand. (Goggles were avoided
  because the Alchemist already wears them.)
- Turret: about 70% of a hero: a three-legged stand (two legs forward, one back), a round brass housing with a hatch,
  a brass mantlet with an orange stripe and twin steel barrels pointing forward. #back (legs), #body (the rest; the
  game turns the whole sprite to aim).
- Move: **Deploy turret**: sets the turret down; it shoots the nearest enemy until destroyed; the wrench repairs it.
- Weak: the flipped-up mask can read as a helmet visor; the zigzag fringe is the same trick as the Wildmane's.

## Scarecrow — `fighter-scarecrow.svg`
- Did: a burlap sack head (faint weave) tied with a rope, straw poking out of the top, a stitched mouth instead of
  the curve, a spiky straw ruff, a faded patched blue coat, the wooden cross-pole behind the shoulders (#back), a
  crow on the left shoulder (a bird, so it has two small pale eye dots). No weapon: straw tufts for hands.
- Move: **Murder of crows**: the crow and a few more fly out and peck enemies in a cone, slowing them.
- Weak: the cross-pole makes it wider than the other heroes (it is detail, not collision). The straw on top can
  look a bit like a crown at small sizes.

## All ten at game size
Checked in `renders/_lineup.png`: every one reads differently at 40px, facing down and turned, and none shares a
silhouette or main colour with the knights or barbarians. Main colours: vampire black/crimson, tamer black hat/
emerald, samurai black/red/gold crescent, gladiator bronze/skin/black curls, valkyrie white wings/silver/blonde,
executioner dark hood/axe, jester magenta/yellow, werewolf grey-blue/red, engineer orange/steel, scarecrow
burlap/straw/blue.
