# Art round 6 (lane A, round 7 notes): only what each note asks

Every design starts from the exact file the designer saw (`design/class-round5/<folder>/<name>.svg`). The round-5
generators were copied into `_src/` and checked to rebuild every round-5 file byte for byte before anything changed;
each change sits behind a switch in the script with a comment quoting the note, so the old version can still be
built. Where round 5 had redrawn a design instead of applying the round-6 note (the lizards, dragonborn, goblin,
imp, devil), the design goes back to its round-4 file (round-4 generators copied into `_src/E1r4`, `_src/E2r4`,
also checked byte for byte) and gets only the round-6 note.

Renders: `<folder>/renders/<name>.png` (render_board.py), with `<name>-before.png` beside it (the round-5 render the
designer saw) and, for designs rebuilt from round 4, `<name>-r4.png`. Only changed designs are in this folder
(`_src/prune.py` drops any rebuilt file that came out identical to round 5). Scripts: `_src/render6.py` (all renders
and befores), `_src/pairs.py` / `_src/look.py` (look-over sheets, scratch), `_src/lizards6.py`, `_src/fiends6.py`,
`_src/game6.py` (the game copies).

## Heroes with a note
- **Witch** (`caster-witch.svg`), picked. "Remove shine. Make tip of hat a slightly less weird shape": the pale shine on the crown is gone; the tip is one smooth bent cone tapering evenly to a rounded point (it ended in a thin hooked flick). Nothing else changed.
- **Chef** (`support-chef.svg`). "Hat bad": a new hat only. A toque seen from above: a broad band wrapping the top of the head down to the brow, and a big puffed top as wide as the head (round 5: a narrow band and a small puff on the back of the head, bare scalp between). Face, moustache, jacket, pan and spoon as they were.
- **Seer** (`support-seer.svg`), picked. "Eyeband doesn't look right. Should be u see hair and flipped": the blindfold now bows down round the front of the face (it arched upward, so it read upside down) and sits under the hair: the fringe comes down onto its top edge and the two front locks lie over its ends, so hair shows above and beside it. Same band colour and width, same hair.
- **Harpooner** (`ranged-harpooner.svg`), picked. "Where beard go?": the round-4 grey beard is back (same scalloped shape, size, place and colour), drawn over the face, without the mouth line on it that read as a nose; the round-5 moustache sits on it. Its two top lobes are left off so no grey pokes up between the moustache and the hat.
- **Marksman A** (`ranged-marksman-a.svg`), picked. "Gun too short. Give facial hair. Maybe skinny grey moustache": the same musket, about a fifth longer (the stock reaches further back along the shoulder, the barrel further forward, the wooden fore-stock ends at the front hand so more steel barrel shows; the hands stay put); a thin grey moustache with flicked-up ends, on the face over the mouth.
- **Ninja** (`ranged-ninja.svg`), picked. "Make mask softer/ less sharp turn": the mask still rises over the nose, in one soft round curve instead of a point; its fold line follows it.
- **Pirate** (`ranged-pirate.svg`), picked. "Wider bowl of hat. Wider hat overall": the tricorn 18% wider (same height, same gold edge); its crown (the bowl) from a 48-wide circle to a 68 x 52 oval.
- **Slinger** (`ranged-slinger.svg`), picked. "Needs fixing of hat but looks interesting": the same ram-fleece hood and horns, cleaned up: the darker crescent across the brow (it read as a frowning visor) is gone, so the hood ends in its own woolly edge; no shine or spots on the wool; the horns go under the hood so their roots tuck into the wool; no scratch lines on the horns.
- **Trapper** (`ranged-trapper.svg`, and `ranged-trapper-right.svg`), picked. "Why hat not on right?": the cap sat turned 9 degrees on the head and looked knocked askew; it now sits straight and centred. In case the note meant the tilt should go the other way, `-right` has the same slight tilt mirrored (crown leaning right). Same cap otherwise.
- **Gladiator** (`fighter-gladiator.svg`), picked. "Give a spartan styled helmet": a Corinthian helm: one bronze shell over the head with cheek guards down to the jaw, the face showing through a T (an eye band split by a nose guard, a slot to the chin where the mouth shows); the round-5 red crest front to back, now ending at the brow. Body, gladius and shield as they were.
- **Werewolf human** (`fighter-werewolf-human.svg`), picked. "Facial hair layered wrong... Remove sheen from hair and the lines. Flip axe": the stubble was a see-through crescent hanging below the chin, so it read as a shadow behind the head; it is now a short scruffy beard in the hair's colour, drawn on the face from the sideburns round the jaw, the mouth above it. The hair has no sheen patch and no lines. The hatchet head is mirrored across the haft (the blade faces in, toward the body).
- **Werewolf** (`fighter-werewolf.svg`), picked. "Weird fangs. Weird shadowing in some places, like that top head segment and ears": no light sheen patches (skull, ruff, paws) and no dark stripes on the skull; the skull's shadow on the ruff is short and soft (it ringed the top of the head like a separate dome); the inner ears follow the ear's shape in a muted pink (they were round pink spots); two curved fangs hang from the upper jaw beside the nose (they were flat triangles on the snout's sides).

## Facial hair check (every bearded or moustached design)
- **Executioner** (`fighter-executioner.svg`), no note: the same fault as the werewolf's human form (a flat stubble crescent hanging past the chin, read as a shadow behind the head). Now a short dark beard on the jaw, drawn over the face. Nothing else changed.
- Checked and already drawn over the face: Pirate, Grenadier, Chef, Lantern keeper, Druid B, Engineer B and C, Tamer A and C, Berserker A and B, and the Devil's goatee (round-4 design).

## Enemies with a note
- **Bat** (`bat.svg`), picked. "Decent. Fix shading. Maybe add nose": the face used the heroes' face gradient (dark at the top, as under a hat brim the bat doesn't have), which put a dark band across the head; it is lit like the rest of the bat now, light top left to darker bottom right. A small dark nose on the snout.
- **Angel B** (`celestial-angel-b.svg`). "Halo is behind, not layered properly": the same thin pale halo is drawn over the head now, floating: its near arc crosses the top of the hair, its far arc is beyond the head, with a faint shadow on the hair under it.
- **Lizardman spear A** (`lizardman-spear-a.svg`, `-b`). "Looks like it reverted a lot more than what I had asked": back on the round-4 lizardman A spear (the one the round-6 note was on), with only that note: **a** no eyes; **b** no eyes and the heroes' face shading over the head (a soft dark band across the brow where a hero's face is darkest and where the eyes were, light down the snout, a touch darker at the tip, no shine).
- **Slime big** (`slime-big.svg`), picked. "Not what I asked. Remove tail": the three drips trailing behind are gone; nothing else. Small and Fire (picked) keep theirs.
- **Snowman** (`snowman.svg`). "Stack the head over the body in the middle": the head is centred exactly on the body (both balls on the sprite's centre), so it stands straight under the camera; the scarf ring, beanie, coal smile and carrot moved up with the head. Same shapes and colours.
- **Spider hunter** (`spider-hunter.svg`), picked. "Fix fangs and shading": the head is lit like the rest of the spider (it had the heroes' face gradient, a dark band across it); the fangs are two stubby jaws in the body's colour, each with a short ivory fang curving in (they were near-black blades that read as a hole in the outline).

## Enemies with no note this round ("tried again for one reason or another")
- **Lizardman blade a/b, croc a/b, dragonborn a/b** (`lizardman-blade-*.svg`, `lizardman-croc-*.svg`, `dragonborn-*.svg`): the round-6 note covered them too ("do this with other lizards and dragon born"; dragonborn "should be red"), and round 5 had redrawn them as well, so they get the spear's treatment from their round-4 designs. The dragonborn is the round-4 dragonborn in red (scales red, wings dark red, cheek frills gold-orange; horns, pauldrons, claws and falchion as they were). The croc is back (round 5 had dropped it); its "before" is its round-4 render.
- **Goblin, Imp, Devil** (`greenskin-goblin.svg`, `fiend-imp.svg`, `fiend-devil.svg`): round 6 asked "no eyes" (devil: "no eyes, tail back"); round 5 redrew them instead. Back on their round-4 designs with only that: eyes out, and the devil's tail runs straight back.
- **Hobgoblin, Orc shaman** (`greenskin-hobgoblin.svg`, `greenskin-orc-shaman.svg`): the heroes' plain fists (the knuckle bumps are gone). Nothing else.
- **Orc, Troll, Ogre, Demon** (`greenskin-orc.svg`, `greenskin-troll.svg`, `greenskin-ogre.svg`, `fiend-demon.svg`): plain fists, and the bald head drawn like the Monk's (the bald hero): one smooth head lit from the top left, without the crease line across the brow that read like a seam or a cap's edge.
- **Ghost** (`ghost.svg`): the hollow mouth is a small dark "o", the size of the picked round-3 ghost's (it was twice that). Nothing else.

## In the game
- `art/enemies/` goblin, hobgoblin, orc (also the Warboss), orc-shaman, troll: the round-6 versions. The goblin's game copy is drawn at 0.875 inside the box (the design file is round 4's 0.72), so its shoulders are as wide as the round-5 goblin's and it fills the same hit circle without touching `js/enemies.js`.
- No game hero changed (none of the noted heroes is in the game). The game's lizards stay the round-3 ones until an a or b is picked.
- Checked with `tools/clip.mjs --port 8844 --q "theme=warren&allnodes=1"` (and `&bossroom&lvl=6`) and `tools/labshot.mjs` (all six greenskin kinds in every pose): no page errors.

## Not changed (not picked, no note)
Bearskin A and B, Necromancer, Pyromancer, Storm, Beekeeper, Lantern keeper, Plague doctor, Templar, Scarecrow,
Vampire, the four tamers and their beasts; and the variants not chosen (Bandit mask A, Alchemist B, Druid B and C,
Marksman B-D, Engineer B and D). "The rest need fixing", but no note says what, so they are as they were.

## Still weak
- Marksman A: the gun is as long as it can be on the shoulder; longer would put the butt over the hat or the muzzle outside the box.
- Chef: the toque is the biggest hat in the set; at game size it is a white puff over the head (it reads as a toque, but heavy).
- Seer: the blindfold's downward bow is subtle at game size.
- Gladiator: at game size the helm is a bronze dome with a dark T; the cheek guards merge with the face shading.
- Lizards b and dragonborn b: the face shading is a soft brow band, subtle at game size. Dragonborn: "overall not great" (round 6) is still open; only red and no eyes were asked.
- Goblin and imp are back to their round-4 sizes (72% and 62% of the archer) on the boards.
- Orc, troll, ogre, demon: with the crease gone the brow doesn't overhang, so the jaw, tusks, nose and horns carry the face.
- Snowman: centred balls from straight above are circles in circles; the scarf ring and carrot carry the read.
