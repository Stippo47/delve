# Art round 7 (lane A, round 8 notes): only what each note asks

Every design starts from the exact file the designer saw: the round-6 file (`design/class-round6/<folder>/<name>.svg`),
or the round-5 file where the note was left on a "(before)" tile (Ogre, Orc, Lizard blade B, Lizard spear B, Ghost):
those notes say the designer prefers that older version with the fix. The round-6 generators were copied into
`_src/` and checked to rebuild every round-6 file byte for byte before anything changed. Each change sits behind a
switch in the generator it touches (`*_R7`, `TEETH_IN`, `BLADE_R7`, `CREST_R7`, `HORNS_R7`, `BEARD`), with a comment
quoting the note; `_src/check7.py` turns them all off and checks the generators still give every round-6 file (and
the round-5 enemies) byte for byte, then checks `_src/build7.py` rebuilds this folder (129 files, all identical).

Renders: `<folder>/renders/<name>.png` (render_board.py: big beside the archer, 8 facings, game size), with
`<name>-before.png` beside it: the tile the note was on (the round-6 render, or the round-5 render the "(before)"
tile showed). Only changed designs are in this folder (`_src/prune7.py`). Scripts: `_src/build7.py`,
`_src/render7.py`, `_src/check7.py`, `_src/lizards7.py`, `_src/game7.py` (the game copies), `_src/look.py` and
`_src/pairs.py` (look-over sheets into `tools/riffle/out/r7`, scratch).

## Heroes with a note
- **Marksman A** (`ranged-marksman-a.svg`), picked. "The Moustache above nose. Beard may be below head. In game the gun needs to be held in front of them": your word for the small curve on these faces is "nose" (Harpooner: "remove nose"; Pirate: "nose makes it look like they are smiling"), and the moustache sat above it; the same skinny grey moustache now sits under it, its flicked-up ends either side of the curve. The same musket is held in front of the face, pointing straight ahead from the right cheek (it lay along the right shoulder at the body's edge); its stock tucks under the hat brim: the gun part (#arm-r, both fists) is drawn over the face and the hat and plume are now a #front part drawn over the stock, so in the game the gun sits in front and a draw-back slides it in under the brim. No beard here (see the next line).
- **Marksman A, beard** (`ranged-marksman-a-beard.svg`). The same, and "beard may be below head": a small pointed grey beard, the moustache's grey, hanging from the chin past the edge of the head.
- **Gladiator** (`fighter-gladiator.svg`), picked. "Add some shine maybe": a soft pale-gold shine on the helmet's dome where the light comes from (upper left), with a brighter glint inside it, the same colours as the shield's shine. Nothing else.
- **Werewolf human** (`fighter-werewolf-human.svg`), picked. "Beard and side burns don't mesh together. They should": the sideburns and the beard are one shape, a horseshoe of hair from under the hair at the temples down both sides of the face and round the jaw; its inner edge runs down the cheeks straight into the beard under the mouth (they were three shapes, and the beard's top corners stuck out over the sideburns). Same colour, same ragged lower edge.
- **Werewolf** (`fighter-werewolf.svg`). "Make the same colour as the werewolf man. Remove the fangs": the fur is the man's dark grey hair colour (it was blue-grey); the lighter snout, its stripe and the pale muzzle are the same greys in that colour, each as much lighter than the fur as before; the two fangs are gone. The inner ears keep their dusky pink.

## Enemies with a note
- **Bat** (`bat.svg`), picked. "Remove body. Make head bigger. Maybe make ears different aswell/bigger": no body behind the head; the head (with its snout, nose and fangs) 1.28x as big, where head and body were; the long ears swept straight back are now big broad pointed ears standing up and out from the top of the head. The wings as they were.
- **Dragonborn A** (`dragonborn-a.svg`), picked. "Horns look like they are floating": they lay on top of the head on thin roots, a drop shadow under them; now they grow out of the skull: drawn under the head with their roots hidden, coming out of the head's edge at the temples and sweeping back, a little longer so as much horn shows. Nothing else.
- **Ghost A, sheet** (`ghost-a.svg`). On the "(before)" tile: "Overall doesnt look good. Ghosts can also have eyes. Before or after": a new ghost, with eyes. A teardrop seen from above: the round head and the sheet trailing behind it are one shape (no seam), the sheet narrowing into a plump tail whose tip flicks to the side; two big dark round eye holes and a small "o" mouth; stubby arms out at the sides. White with cool lilac shading. The shape of the round-3 ghost you picked ("tail could use work"), with the tail redone.
- **Ghost B, wisp** (`ghost-b.svg`). Same note: the same teardrop in pale blue, two tall dark eyes and no mouth, the tail ending in a small round curl, rounded sleeves of arms reaching forward and out.
- **Ogre** (`greenskin-ogre.svg`), picked (before). On the "(before)" tile: "Make hands simple then this could potentially work": back to the round-5 ogre (its brow line is back), with the heroes' plain fists (no knuckle bumps) in the same iron cuffs.
- **Orc** (`greenskin-orc.svg`), picked (before). On the "(before)" tile: "Tusks? Not in mouth": back to the round-5 orc; the two tusks now come out of the mouth: their roots sit on the mouth line, inside its ends, hidden under it (they stood on the chin below the mouth), pointing up past the upper lip. Same tusks. Its knuckled fists stay (only the tusks were noted).
- **Troll A, mohawk** (`greenskin-troll-a.svg`). "Looks weird": reworked. Round 6's long drooping nose read as a trunk, the dark patch above it as a hole, and the small head sat on a huge mound under a wig-like patch of hair. This one keeps the family build (a head on big shoulders, plain fists, the knotted log club behind the body): bald, a ragged rust-red crest from the brow down the back, long ears swept back and out, a broad round nose, a heavy underbite with two big tusks curving up out of the mouth.
- **Troll B, shaggy** (`greenskin-troll-b.svg`). Same note: round 6's hunched troll with those parts fixed: the head bigger (0.92, it was 0.8), a big round nose, no dark patch, two tusks out of the mouth, and the moss-dark hair covering the whole hunched back as a shaggy coat and growing on over the head to a ragged fringe over the brow (it was a patch on the hump).
- **Lizard blade A** (`lizardman-blade-a.svg`). "Remove eyes. Shoulder doesn't look right nor do hands": the two round eye mounds are gone (round 6 had only taken the eyes off them); the shoulders are built like spear A's: an upper arm rounding out from under each side of the head, spots where the long dark bars were; the red sash is a cloth band lying over the left shoulder (it was a fat blob over the shoulder's outside); the sword hand is a plain fist. Head, tail, colours, scimitar and the claw hand as they were.
- **Lizard blade B** (`lizardman-blade-b.svg`), picked (before). On the "(before)" tile: "This one could look good if use the selected base lizard to fix up the spines on back and stuff. I like the hood looking bit": the round-5 blade B, hood plate kept, with the picked spear A's crest: one jagged three-tier crest down the back of the head instead of three separate cones, and its dashed line running on down the tail. Same gold.
- **Lizard spear B** (`lizardman-spear-b.svg`), picked (before). On the "(before)" tile: "Fix back spines and could look good": the round-5 spear B with the same fix: spear A's jagged crest and the dashed line down the tail, in its orange.
- **Croc A** (`lizardman-croc-a.svg`), picked. "Bring teeth in, underneath head": the side teeth were drawn over everything and stuck out past the jaw onto the outline; the same three teeth a side are now under the head, their roots hidden, only the points showing along the jaw's edge.
- **Snowman** (`snowman.svg`), picked. "Weird red thing at back of snowman": the scarf's end trailing behind (#back) is gone; the scarf ring round the neck stays. Nothing else.

## In the game (`_src/game7.py`)
- `art/enemies/orc.svg` (the Orc and the Warboss): the round-7 orc.
- `art/enemies/lizardman-blade.svg` (Lizard Blade, Lizard Chief): Lizard blade B, round 7.
- `art/enemies/lizardman.svg` (the spear lizard): spear A, round 6 unchanged, the "selected base lizard" (round 6 kept the round-3 lizards until a version was picked).
- `art/enemies/placeholder/bat.svg`, `snowman.svg`, `ogre.svg`, `dragonborn.svg`: the round-7 versions replace the round-5 stand-ins; js/foes.js still loads them from placeholder/, and a comment in each says where it comes from.
- The ghost and the troll come in two versions and stay as they were in the game until one is picked. None of the noted heroes is in the game yet.
- Checked on the dev server (`python -m http.server 8855`): `tools/labshot.mjs --q "m=sheet&kinds=orc,warboss,lizardman,lizardBlade,lizardChief,bat,snowman,ogre,dragonborn"` (every pose: rest, walk, ready, strike, ability, downed), `tools/clip.mjs` runs in the Frost Hollow and the Sewers, and the boss rooms of the Sewers (Lizard Chief), the Warren (Orc Warboss) and the Frost Hollow (Old Frost, the snowman art): no page errors, every changed kind drawn with its parts and outline.

## Not changed
Every other round-6 design had no note this round and is as it was, picked or not (Witch, Chef, Seer, Harpooner, Ninja, Pirate, Slinger, Trapper and Trapper right, Executioner, Angel B, Goblin, Imp, Devil, Demon, Hobgoblin, Orc shaman, Lizardman spear A, Croc B, Dragonborn B, Slime big, Spider hunter). The round-6 Blade B and Spear B are replaced by the round-5 ones the notes chose. The deck's labels for the greenskins were shared (one notes line named four files), so which of Ogre / Orc / Troll / Hobgoblin / Orc shaman were picked is read from the "(before)" marks and the notes.

## Still weak
- Marksman A: "Moustache above nose" is read as a fault (the moustache was above the curve you call the nose); if it meant something else, the round-6 placement is the before tile. The gun crosses the right cheek, and less wood shows now that the stock tucks under the brim. In the game the ranged "draw" pose pulls the arm back 26 units; a short recoil would suit a gun better (parts.js, lane V, when the marksman goes in).
- Gladiator: the shine is small at game size.
- Werewolf: grey on grey; the snout stands out less from the fur than it did in blue.
- Dragonborn A: "overall not great" (round 6) is still open; only the horns were asked.
- Ghost A is close to the round-3 ghost already in the game (that one was your pick); B is the newer look.
- Troll A's ears make it the widest greenskin. Troll B's shaggy coat could read as a bush or a frill at game size.
- Lizard blade A: the sash is a thin band; the upper arms are spear A's plain ovals; the left claw hand is unchanged (it is the same claw as on spear A, the picked lizard), so if "hands" meant that one too, it still needs a note.
- Orc: keeps its knuckled fists (round 5), unlike the hobgoblin and shaman (plain since round 6).
- Croc A: the tucked teeth are small at game size.
