# Art round 4: the artists' sections

Each artist reads `design/briefs/round4-brief.md` first, then only their own section. The hero list is fixed
across sections so nobody overlaps: draw only your own names.

## F. Fixes to the picks -> design/class-round4/<class>/ (knight, barbarian, rogue, farmer, skeleton)
Start from `design/class-round3/<class>/<file>.svg`. Keep the file names. Apply the new hand rule everywhere.
- **Old Guard**: "If 2 handed, hold in middle in front."
- **Tower**: "Eye slots. Bad mace. Use others as reference. Maybe give them a flanged mace."
- **Bulwark**: "Hold spear a bit further back."
- **Griffon**: "Helmet weird. Hammer small. Make opening bigger and different shape. Too narrow." (the face opening)
- **Wildmane: she's a woman** (the designer: "that's a she"). Keep her look; make her read as a woman without
  facial features (hair, shape, build). Make only the scar version: "Just 1 solid darker shade. Not white."
- **Bearskin**: "Worse club?" -> a better club that reads clearly (or the round-2 war axe if a club can't read).
- **Warhelm**: "Really good. Hammer maybe a bit small. 15% bigger?"
- **Berserker**: "Spike bad. Different style. Try again." -> different spikes on the flail head.
- **Twinfang**: "Give them hooked/curved daggers. Inwards." (blades curving in towards the centre line)
- **Shade**: keep the crossed version ("these daggers look better"); apply the hand rule only.
- **Granny Reaper**: "Hold further down the shaft."
- **Haymaker**: "Make fork head 1 colour."
- **Rattler** (and the bow, spear and mace Rattlers): "All hands holding weapons should be rotated to match their
  handle. Try separating the lower jaw from the skull to read more like a skeleton." -> a visible gap between skull and jaw on all four.
- **Gaper**: "30% bigger. No eyebrows. Too mad/too sharp." **Brute**: "15% bigger. Axe flipped."
- Paladin, Dame, Bandit, Digger, Grandpa Sickle: the hand rule only.

## H1. Casters -> design/class-round4/heroes-casters/
Ten heroes, each a different silhouette and colour: **Pyromancer** (fire mage), **Frost mage**, **Storm mage**,
**Necromancer**, **Druid**, **Shaman** (totems), **Witch**, **Cultist**, **Warlock** (demon pact), **Alchemist**
(throws flasks). Staffs, orbs, books and wands follow the weapon rule. Hats, hoods and hair carry most of the read.

## H2. Holy, support and odd jobs -> design/class-round4/heroes-support/
Ten heroes: **Cleric** (healer), **Templar knight**, **Bard** (lute), **Plague doctor** (beaked mask), **Monk**
(fists, no weapon), **Seer** (blindfold, crystal), **Beekeeper**, **Chef** (pan and ladle), **Quartermaster**
(a merchant with a huge backpack), **Lantern keeper**. Must not look like the existing knights or farmers.

## H3. Ranged and sly -> design/class-round4/heroes-ranged/
Ten heroes: **Marksman** (long musket), **Ninja**, **Crossbowman**, **Trapper** (hunter with traps), **Pirate**
(cutlass and pistol), **Javelin huntress**, **Grenadier** (bombs), **Slinger** (shepherd with a sling),
**Falconer** (bird on the arm), **Harpooner** (harpoon on a rope). Must not look like the archer or the rogues.

## H4. Fighters and oddballs -> design/class-round4/heroes-fighters/
Ten heroes: **Vampire**, **Beast tamer** (whip, with a small beast companion drawn separately as `tamer-beast.svg`),
**Samurai**, **Gladiator** (net and trident), **Valkyrie**, **Executioner**, **Jester**, **Werewolf**,
**Engineer** (wrench; a small turret drawn separately as `engineer-turret.svg`), **Scarecrow**. Must not look like
the knights or barbarians.

## E1. Enemy redos -> design/class-round4/enemies/
Start from `design/class-round3/enemies/` and `.../banshee/`. The designer's words:
- **Slimes** (big, small, fire): "Totally different style. Try again." **Bat**: same. -> make **3 clearly different
  style takes** of the slime (each with its small and fire version) and 3 of the bat, labelled A/B/C.
- **Banshee**: "No. Try again. Losing style." -> one or two new takes, in the house style.
- **Ghost**: "Better. Tail could use work." **Lizardman**: "Decent. Try variants." (3 variants; the blade one was
  "curved the wrong way"). **Spider**: "Try again. 4 variants/styles." Include a **momma spider** (bigger, the web
  shooter). **Snowman**: "Leaning over. Hat too much detail. Different style." **Mimic**: "Close, not quite.
  Deviating too much. Tongue not even attached." -> a chest that still reads as the game's chest, a mouth inside the lid, tongue attached.

## E2. New enemy families -> design/class-round4/monsters/
- **Greenskins, all different shades of green** so they tell apart: **Goblin** (small, ~70%), **Hobgoblin**
  (archer-sized), **Orc** (~115%), **Troll** (~130%, long arms), **Ogre** (~150%, big belly). Two orcs if one
  doesn't cover it (grunt and a shaman, say).
- **Fiends**: **Imp** (small, ~60%, wings), **Demon**, **Devil** (horns, tail, trident), **Fiend** (beastly). Make
  them clearly four different things.
- **Dragonborn**: "dragon-flavoured lizardman": a bigger, horned, scaled warrior with small wings or frills.
- **Angel** and **Cherub** (small, ~60%). As enemies or allies; same style.

## P. Props -> design/class-round4/props/
The designer: "the boulders and traps need overhaul, as well as the chest visual", and "doors still aren't good:
the opening should have a coloured glow representing the room". Top-down, same style and outline, sized in room
units (the archer sprite is about 44 room units across in the game):
- **Boulders/pillars** (round obstacles, radius 22-36): 3 kinds (rock, broken pillar, crate stack?).
- **Spike trap** (radius ~30, round or square), shown up and down; **oil puddle** (radius 34-52).
- **Chest** closed, open, and a locked one (needs a key); about 48 wide.
- **Door** in a wall, about 112 long across the opening and 26 deep: shut (wood), open, and a glow colour sample per
  room kind (fight red, hazard orange, elite purple-red, treasure gold, fountain blue, choice violet, boss dark).
- A **fountain** and a **pedestal** (the choice room's) to match.
Render them with the same script (they'll sit beside the archer for scale).
