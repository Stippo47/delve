# Art round 12 (the art lane): six new heroes in three takes each, and the things the game draws in code

Asked for in `docs/riffle-log/2026-11-22-round12.txt` (the kits deck's notes, near line 357): "Make new hero. Mob. Is 4
peasants... Torch, pitchfork, axe, and dagger... All melee. / Clock work hero. Influence time. / Air mage. Whirled effect /
Warden (uses a lot or shackles and restraints. Nullification themed) / Telekinetic. / Earth mage (earth quakes, chains of
spikes from the ground, spawn stone walls.)", and in `docs/ART-NEEDED.md`, "Round 13 (lane H2, the newer heroes): drawn
in code or borrowed".

**Nothing here is wired into the game, and no js changed.** Section A is in `heroes/` only (the game keeps its stand-ins
until a pick). Section C is in `props/` and copied to `art/summons/` and `art/heroes/r12/` as new files no kind points
at; the table at the end says which file replaces which code-drawn thing.

## How it was built
- Round 11's way: generators in `_src/`, a build that regenerates the folder, a check, a renderer. The heroes' A2 library
  (`_src/A2/lib.py`, `common.py`) is round 11's, copied; two additions, both off by default: `group(..., T=)` (a
  transform on a whole part) and `Sprite(..., line=)` (a thinner outline with `data-line`, the gaper's fix of round 11).
- `_src/A2/kit12.py`: pieces shared by everything new. The casters of rounds 4 and 5 were drawn with an older builder;
  the numbers that make a mage one of them (the hood's outline, the staff's line over the right shoulder, the free fist,
  the robe's band of trim) are copied from it.
- `_src/A2/heroes12.py` (five heroes), `mob12.py` (the Mob), `props12.py` (summons and props), `parts12.py` (the heroes'
  new weapon hands, the demon form), `boards12.py` (several sprites in one picture, for the boards only).
- `python _src/build12.py` rebuilds `heroes/`, `props/`, `boards/`. `python _src/check12.py`: the copied round-5 and
  round-6 generators with no round-12 switch still give the approved Valkyrie, Samurai and Trapper byte for byte; the
  three hand-drawn heroes edited as text start from copies of the approved files (`_src/base/`); the build is byte for
  byte what is committed; the copies in `art/` are the built files; no sprite is cut off by its box (`bounds12.py`, which
  draws them with Edge and looks along each box's edge). Last run: 105 files, all as they should be; 54 sprites inside.
- `python _src/render12.py` makes the pictures (Edge, as round 11). `python _src/game12.py` copies section C into `art/`.
- Line weight. A sprite's outline is 6 units of its own 220 box, so anything the game draws smaller than a hero's box
  gets a thinner line on screen. The Mob's peasants and every small prop are therefore drawn small inside the usual box
  (each part carries one scale about the centre; the outline filter stays outside it; pivots are in the box's frame) and
  the game draws the box at the heroes' scale: `headR = vr x 56 / 22`. The one thing bigger than a hero's box, the
  barricade, asks for a thinner line instead (`data-line="4"`, which `js/parts.js` already reads).

## Section A: the six heroes, three takes each (in `heroes/`, nothing in `art/`)
Every take is the approved bust: the head token on the shoulders, fists in the arm parts, no eyes, the small mouth, the
library's three values on every shape (lit top left, darker right side, a contact shadow on what is under it), one ink
outline. Parts as the rig wants them: `#back` (sways), `#body`, `#arm-l`, `#arm-r` with shoulder pivots; a weapon held
under the shoulder is in an arm part drawn before `#body`.

Boards, in `heroes/renders/`: `<hero>.png` (the three takes at game scale beside the archer, and a row at game size in
four facings); `<hero>-<take>.png` (one take: big, 8 facings, 8 facings at game size); `<hero>-lineup.png` (each take
third in a row of six with five approved heroes, big and at game size).

| hero | files | A (my pick) | B | C |
|---|---|---|---|---|
| The Mob | `mob-torch-<set>.svg`, `mob-pitchfork-`, `mob-axe-`, `mob-dagger-`; sets `village`, `kitchen`, `family` | **village**: a red kerchief, a slouched felt hat, a bald woodcutter with a black beard, an ochre pointed hood; four colours | **kitchen**: the same sackcloth, a colander, a bucket, a cooking pot and a funnel for helmets | **family**: grandmother (bun), father (flat cap, moustache), big son (bowl of red hair), child (blond tuft, a kitchen knife), four sizes |
| Clockwork | `clockwork-watch`, `-windup`, `-sands` | **watch**: a chronomancer with a pocket watch for a hat, a pendulum staff, a cog over the free hand | **windup**: a brass wind-up man, a clock face for a face (twenty past eight: a moustache), a key in his back (`#back`), a clock hand for a sword | **sands**: Father Time: hood, white beard, a clock-hand staff, an hourglass hanging from the left fist |
| Air mage | `airMage-swirl`, `-fans`, `-gale` | **swirl**: a white hood drawn up into a curl, a spiral on it, a scarf streaming back (`#back`), a curled staff, a whirlwind over the free hand | **fans**: a wide round hat painted with one spiral, a paper fan in each hand | **gale**: no hat, white hair and scarf blown hard to one side, a pinwheel for a staff |
| Warden | `warden-lock`, `-gaoler`, `-binder` | **lock**: a closed helm made like a padlock, a pale glowing keyhole for a visor, the shackle arching over the back (`#back`), a shackle on a chain in each fist | **gaoler**: a pot helm with a cage of bars over the face, a great key held like a mace, a shackle in the left hand | **binder**: a witch-finder's black hat with a padlock buckle, chains over the shoulders to a padlock under the chin, a man-catcher fork |
| Telekinetic | `telekinetic-blades`, `-orbit`, `-boulder` | **blades**: an indigo hood with an eye gem, fists at the temples (in `#body`), two swords hanging in the air with no hand on them (`#arm-l`, `#arm-r`) | **orbit**: a white turban with a gem, both hands open, three stones hanging behind (`#back`) | **boulder**: an indigo blindfold, a silver braid floating up (`#back`), a boulder hanging before the open right hand |
| Earth mage | `earthMage-fists`, `-spikes`, `-slab` | **fists**: a boulder for a cap (moss, amber crystals), a russet beard in two braids, each fist in a glove of rock | **spikes**: a ring of rock spikes round the back of the shoulders (`#back`), a bun with a stone pin, a carved standing stone for a staff | **slab**: a brown hood with a keystone and amber gem, columns of rock off the shoulders, a boulder staff |

The Mob. One file per peasant; each is the heroes' build at 0.6 of a hero (the family: 0.54, 0.64, 0.72, 0.47) inside the
usual box, with fists, hafts and blades drawn fatter than a hero's so they still read. Draw a peasant with
`headR = 56 x its scale` (34 for 0.6) and `vr = 22 x its scale` (13.2); each file's comment gives its own numbers. Weapon
in `#arm-r` (before `#body`), free fist in `#arm-l`. `boards/mob-<set>.svg` shows a set's four side by side; that file is
for the boards only.

Which I would pick, and why: the **village** Mob (four colours and four head shapes: they stay four people at game
size, where the kitchen set's grey helmets run together); the **watch** (a white dial with two hands is the one clock
sign that survives at 44 pixels); the **swirl** (it sits in the mages' family, and the curl and spiral are the "whirled"
the note asks for); the **lock** (one shape nobody else has, and the keyhole carries the nullifying glow); the
**blades** (the swords with no hands on them say what the hero does, and give the rig two parts to swing); the
**fists** (the strongest outline of the fifteen, and pounding the ground is the earthquake).

Weakest, said plainly:
- `clockwork-sands`: at game size Father Time is an old wizard; the hourglass is too small to carry it.
- `airMage-gale`: the blown hair reads as a head wrap, and the pinwheel is tiny.
- `warden-binder`: the chain links are too fine for game size and the hat sits close to the Witch's.
- `telekinetic-boulder`: the floating braid still has something of a hat's tip about it.
- `earthMage-slab`: the columns on the shoulders are lumps at game size; it is the frost mage's build in brown.
- The Mob's `family`: the child's head is about ten pixels across on a phone.
- `clockwork-windup` and `warden-lock` have no face (like the Tower): a choice, not a slip.

## Section B: the two owed busts
Nothing new. Round 11 drew both, three ways each (`design/class-round11/notes.md`, section 4:
`heroes/enchantress-buns/-veil/-curls.svg`, `enemies/ember-succubus-tail/-whip/-heart.svg`); the game keeps the
recolours until a pick.

## Section C: what the game draws in code (one design each)
Boards in `boards/renders/with-<hero>.png`: the hero as it is in the game, and beside it each new thing at its size in
the game, then the same row at game size. Files in `props/`; the game's copies under `art/` (new, unused).

### Wiring: which file replaces which code-drawn thing
To use one: give the kind `art` and `headR` in `js/heroes2.js` and drop its `LOOK2.<kind>` in `js/fx2.js` (kits2.js hangs
`LOOK2[kind]` on the def only when the def has no draw; render.js draws `def.draw` first, so the entry has to go). What
the code drawing did that a picture does not is listed, so it is not lost by accident.

| kind (hero) | file in `art/` | headR (vr) | parts | replaces | the code also did |
|---|---|---|---|---|---|
| `haybale` (Haymaker) | `summons/haybale.svg` | 76 (30) | body | `LOOK2.haybale` | its straw bands rolled with `u.roll`; flames when burning |
| `totem` (Shaman) | `summons/totem.svg` | 66 (26) | body | `LOOK2.totem` | rose out of the floor on spawn; a crack under half health. Stands: see "standing things" |
| `spiritBear` | `summons/spirit-bear.svg` | 66 (26) | body | `LOOK2.spiritBear` | drawn see-through (`spiritA`), a blue glow, a rocking walk, a paw swing |
| `spiritEagle` | `summons/spirit-eagle.svg` | 56 (22) | body | `LOOK2.spiritEagle` | see-through, lifted by `u.hop` over a shadow, beating wings |
| `spiritBeaver` | `summons/spirit-beaver.svg` | 51 (20) | body | `LOOK2.spiritBeaver` | see-through, a full spin when it shoots |
| `cauldron` (Alchemist) | `summons/cauldron.svg` | 61 (24) | body | `LOOK2.cauldron` | flames under it, bubbles rising. Stands |
| `warlockImp` (Warlock) | `summons/warlock-imp.svg` | 44 (16) | back, body, arm-l, arm-r | `art/enemies/placeholder/imp.svg` on the kind (only the `art` path changes) | nothing: it has art today |
| demon form (Warlock) | `heroes/r12/warlock-demon.svg` | 56 (22) | back, arm-r (sword), body, arm-l | the red wash, horns and sword of `DRAW.demonForm` (fx2.js): draw the Warlock with this art while `u.kit.demon` is set | the red glow and embers can stay |
| `beehive` (Beekeeper) | `summons/beehive.svg` | 56 (22) | body | `LOOK2.beehive` | its three bees circling. Stands |
| `crate` (Quartermaster) | `summons/supply-crate.svg` | 56 (22) | body | `LOOK2.crate` | a slow gold pulse |
| `barricade` | `summons/barricade.svg`, `summons/barricade-spiked.svg` (when `u.spikes`) | 57 (34) | body | `LOOK2.barricade` | a crack under half health. Its outline is `data-line="4"` |
| `pavise` (Crossbowman) | `summons/pavise.svg` | 64 (26) | body | `LOOK2.pavise` | a crack under half health. Stands, its face to +y |
| `bigBomb` (Grenadier) | `summons/big-bomb.svg` | 51 (20) | body | `LOOK2.bigBomb` | swelled faster as the fuse burned; the spark's glow |
| `torcher` (Engineer) | `summons/engineer-torcher.svg` | 66 (26) | back (deck), top (turns) | `LOOK2.torcher` | the jet of flames along `u.facing` while `u.flaming` (keep that code) |
| `tesla` | `summons/engineer-tesla.svg` | 61 (24) | back (deck), body | `LOOK2.tesla` | the glow at the ball when it zaps. Stands |
| `mortar` | `summons/engineer-mortar.svg` | 61 (24) | back (deck), top (turns) | `LOOK2.mortar` | the recoil after a shot |
| `medbay` | `summons/engineer-medbay.svg` | 61 (24) | back (deck), body | `LOOK2.medbay` | a slow green pulse |
| `medDrone` | `summons/engineer-med-drone.svg` | 36 (14) | body | `LOOK2.medDrone` | lifted by `u.hop` over a shadow, a wobble, spinning rotors |
| `windup` | `summons/engineer-windup.svg` | 36 (14) | back (the key), body | `LOOK2.windup` | the key turned, the feet stepped |

- The deck under a tower is `#back`: for the legs to stay put while the top turns, the def needs what the Engineer's own
  turret has (`turret: true`; parts.js turns `#back` against the facing). The torcher and the mortar turn; the tesla and
  the medbay do not.
- Standing things (the totem, the cauldron, the hive, the pavise, the tesla tower) are drawn as the heroes' staffs and
  shields are: foot at the front (+y), top leaning back. The code drew them `upright()`, never turned. A kind with `art`
  is turned to its facing, so either keep their facing down the screen or skip the turn for them.
- `u.flashT` (the white flash on a hit) comes with the rig; the code's own flash colours go with the LOOK2 entries.

### The heroes' own weapon hands (`art/heroes/r12/`, beside the approved files, which are untouched)
Each is the approved hero with only the hand changed. To use one, point the hero's `art` at it (or move it over the old
file).

| hero | file | the note | what changed | js it needs |
|---|---|---|---|---|
| Valkyrie | `r12/valkyrie.svg` | "Hold spear better" | the same spear, held at the shaft across the front, the fist in plain sight (`#arm-r` now after `#body`) | none |
| Samurai | `r12/samurai.svg` | "Should hold with 2 hands in front of him" | the same katana, across the front in both fists (`#arm-r` after `#body`; no `#arm-l`) | none (the Old Guard is built the same) |
| Trapper | `r12/trapper.svg` | "I want them to have a shotgun. Should hold with 2 hands. Trap sits on their back hip. Behind shoulder." | a double-barrelled shotgun in both fists the Marksman's way (`#arm-r` after `#body`), the same jaw trap on the back hip behind the left shoulder (`#back`); no `#arm-l` | none; `#back` could be hidden while the trap is out |
| Bulwark | `r12/bulwark.svg` | "Holding spear too close to tip" | the same spear slid 14 units forward through the fist; the hand sits at the pauldron's outer edge | none |
| Warhelm | `r12/warhelm.svg`, `r12/warhelm-hammer.svg` | the hammer "float around him... While he punches with his fist alternating" | the same shapes, split: `#arm-l-hammer` (the hammer) and `#arm-l` (the fist alone). At rest it is the approved picture. The hammer alone, for when it flies, is its own file (a hero's box: headR 56, vr 22) | parts.js, beside `arm-l-bird`: `pose['arm-l-hammer'] = hammerOut ? { hide: true } : pose['arm-l']`, and a `LIMP` entry |
| Bearskin | `r12/bearskin.svg` | "The bear paws of his outfit should be on his hands. Move with it. I didn't like this club." | the hide's paws and claws leave `#body` for `#arm-l` and `#arm-r`, over the fists; a new club (a gnarled root) in its own part, `#arm-r-club` | parts.js: `pose['arm-r-club'] = clawing ? { hide: true } : pose['arm-r']`, and a `LIMP` entry |

ART-NEEDED words the Bulwark's as a "two-handed grip"; he carries a shield, and the designer's note is about where the
hand is on the shaft, so that is what was drawn.

### Weak, in section C
- The pavise: the prop behind it reads a little like a bottle's neck.
- The medbay's tent reads as a flower until the green cross is seen.
- The demon form is dark against a dark floor; the red face and the sword's core carry it.
- The Bulwark's hand is half behind the pauldron (there is no room below the body to hold the spear lower: the head
  already reaches the box's edge).
- The Valkyrie's spearhead now lies over the end of her right plait.
- The drones are 14 room units across: at that size they are a white dot with a green cross and a brass dot with a key.
- None of this was seen running: the lane was told not to wire it or open the game.
- `sw.js` was regenerated after merging main (`tools/build-sw.py` lists every SVG under `art/`), so it now lists the 27
  new files: about 400 KB that phones cache before any kind uses them. Hold the files back from the list if that matters.

## The deck
`tools/riffle/make_art_round12.py` -> `tools/riffle/decks/art-round12.json` (checked with `riffle check`, not sent): one
board card per hero (its three takes, my pick first, then two tiles that are not choices: all three side by side, and
the row with five approved heroes), a report card for the props with a part per hero, and one for the heroes' weapon
hands.

## Files
- `heroes/`: 27 sprites (12 peasants, 15 takes); `heroes/renders/`: the boards.
- `props/`: 19 summons and props, 8 hero files (`hero-*.svg`, `warhelm-hammer.svg`); `boards/`: the composed pictures and
  `boards/renders/with-<hero>.png`.
- `art/summons/` (19 new) and `art/heroes/r12/` (8 new): section C's copies, each with a comment naming its source.
- `_src/`: `A2/` (lib, common, kit12, heroes12, mob12, props12, parts12, and the copied `fighters5.py`, `ranged6.py`),
  `base/` (the approved files that are edited as text), `props_list.py` (the one list of what goes where),
  `boards12.py`, `render12.py`, `build12.py`, `check12.py`, `bounds12.py`, `game12.py`, `compose.py`.
