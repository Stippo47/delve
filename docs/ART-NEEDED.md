# Art needed (round 10, lane R: the rest of the roster)

**Done in art round 9 (lane A, wave 11):** every kind below has real art now (design/class-round9, its notes.md
says what each one is and what is still weak); the variants stay recolours of their new base. The code-drawn
hazards at the end are unchanged.

Every kind below went in on PLACEHOLDER art: an existing sprite recoloured at load (js/recolor.js `variantUrl`), so no
new files were drawn. The real sprite for each should be in the heroes' top-down bust style, no eyes, one ink outline.
Variants (a recolour of a real base sprite, e.g. the frost wolf) only need art if the designer wants them to differ in
shape; they are marked "variant".

## The Frost Hollow (js/foes10.js)
| kind | placeholder now | the real sprite should be |
|---|---|---|
| frostWolf | wolf, white (variant) | a white, shaggy wolf with frost on its back |
| slimeIce | slime, pale blue (variant) | a pale, glassy slime with ice shards inside |
| spiderFrost | hunter spider, icy (variant) | a pale blue spider with frosted legs |
| yeti | troll, white | a troll-shaped yeti (same body plan as the liked troll), white fur, huge hands |
| frostWraith (Icicle Wraith) | ghost, icy (variant) | a cold ghost with icicles hanging off its shroud |
| spiritFrost | ghost, pale blue | a small floating wisp of snow and frost (spirits: one shared shape, coloured per element) |
| (snowball) | drawn in code (render.js) | fine as is, or a sprite of packed snow |

## The Ember Deep (js/foes10.js)
| kind | placeholder now | the real sprite should be |
|---|---|---|
| spiderFire | hunter spider, red (variant) | a black spider with glowing orange joints |
| hellhound | wolf, dark red (variant) | a lean black hound with a burning mane |
| cinderBat | bat, orange (variant) | a bat of cinders, glowing cracks, trailing embers |
| spiritFire | ghost, orange | a small floating flame spirit |

## The Gilded Spire (js/foes10.js)
| kind | placeholder now | the real sprite should be |
|---|---|---|
| angelFallen | angel, dark (variant) | an angel with dark, ragged wings |
| sunBlade | cherub, gold | a floating golden sword, seen from above, glowing edge (it spins) |
| choirSprite | cherub, pale | a tiny singing cherub-like sprite with an open mouth and a halo of notes |
| golem | ogre (placeholder), grey stone | a blocky stone golem, top-down: broad shoulders, big fists |
| gildedGolem | ogre, gold | the golem in gold plate, a polished front plate (its front reflects shots) |
| spiritHeal (Light Spirit) | ghost, gold | a small sunbeam spirit |
| spiritWard (Ward Spirit) | ghost, violet | a small spirit with a shield-like glow |
| heraldLight | angel, bright | a tall angel herald in white and gold with a trumpet or spear |
| heraldFallen | angel, dark | its fallen twin: the same shape, dark wings, purple |

## The Sunken Dunes (js/dunes.js)
| kind | placeholder now | the real sprite should be |
|---|---|---|
| scarab | hunter spider, green | a beetle, iridescent green shell |
| scarabGold | hunter spider, gold (variant) | the scarab in gold |
| cobra | lizardman, sandy | a cobra with its hood spread, seen from above |
| jackal (Jackal Guard) | bandit, tan | a jackal-headed guard with spear and round shield |
| mummy | rattler (skeleton), bandage cream | a wrapped mummy with trailing bandages |
| sandMage | orc shaman, sandy | a robed desert mage with a staff, sand swirling |
| dustDevil | ghost, sandy | a small whirlwind of sand (seen from above: a spiral) |
| sandSerpent | croc, sandy | a desert snake's head, flat, top-down |
| serpentCoil (its body) | slimelet, sand (procedural) | one round body segment of the snake, scales on top |
| dartTrap | mimic (chest), stone | a stone wall plate with a carved face and dart holes |
| spiritPoison (Venom Spirit) | ghost, green | a small floating wisp of green venom |
| spiritHaste (Wind Spirit) | ghost, pale | a small swirl of wind |

## The Clockwork Foundry (js/foundry.js)
| kind | placeholder now | the real sprite should be |
|---|---|---|
| gearSprite | slimelet, steel (procedural) | a round cog seen from above (the designer: "top down so u see it as a circle") |
| cogSprite | slimelet, brass (procedural) | a brass cog, a different tooth count |
| bombBot | fire slime, iron | a round iron bomb on little legs, a fuse on top |
| autoBomb | fire slime, blue iron | the bomb bot with a small motor and a switch |
| automaton | rattler (skeleton), brass | a brass sword construct with a vented back |
| turretSteam | mimic (chest), iron | a round iron turret with a stubby steam barrel |
| turretFlame | mimic, red iron | a squat turret with a flamethrower nozzle |
| turretGun | mimic, dark iron | a wall-mounted gun turret: a half-dome on a wall plate, twin barrels |
| turretLaser | mimic, red | a wall-mounted turret with a lens |
| mortar, mortarFire, mortarPoison | mimic, iron / red / green | a short fat mortar tube on a base (fire and gas versions coloured) |
| teslaCoil | snowman, dark iron | a coil on a base with a copper ball on top |
| repairDrone | bat, grey | a small hovering drone with a wrench arm |
| foundrySmith | bandit brute, sooty | a big smith in a leather apron with a glowing hammer |
| bee / beeBronze / beeSteel | bat, copper / bronze / steel | a small mechanical bee, wings of thin plate |
| wasp / waspBronze / waspSteel | bat, copper / bronze / steel | a thinner mechanical wasp with a long stinger |
| hornet / hornetBronze / hornetSteel | bat, copper / bronze / steel | a bigger mechanical hornet |
| sawBlade | slimelet, steel (procedural) | a circular saw blade, toothed, seen from above (half sunk in the wall) |
| chainCrawler | hunter spider, steel | a mechanical centipede's head with mandibles |
| crawlerPlate (its body) | slimelet, steel (procedural) | one plated segment with two little legs each side |
| drillBot | fire slime, steel | a squat bot with a drill nose |
| spiritShock (Storm Spirit) | ghost, yellow | a small crackling spark spirit |

## Hazards drawn in code (js/scenery.js), fine for now
quicksand (the Dunes), steam vents and conveyor plates (the Foundry).

## Round 13 (lane S): placeholders
| what | placeholder now | the real sprite should be |
|---|---|---|
| hero `enchantress` (Enchantress) | `art/heroes/enchantress.svg`: the Witch recoloured rose (made with js/recolor.js; same hat and broom) | her own bust: rose silk, a heart-shaped locket, no hat; a hand held up to blow kisses |
| `succubus` (Succubus, the Ember Deep) | the Devil recoloured rose at load (variant) | her own sprite: bat wings, a whip or a long tail, a heart on the tip of the tail |
| the Cupid (the cherub's elite) | the cherub, with love arrows drawn in code (fx-status.js `loveArrow`) | fine as is; a pink bow if the designer wants the elite to read at a glance |

## Round 13 (lane H2, the newer heroes): drawn in code or borrowed
Summons and props the round 13 abilities brought in. Each is drawn in code (js/fx2.js `LOOK2.<kind>`, one ink outline,
the heroes' palette) or borrows a sprite; a real sprite in the bust style can replace any of them without touching the
abilities (give the kind an `art` in js/heroes2.js and drop its LOOK2 entry).
**Round 15 (lane E): art round 12's files are wired in** (struck through below; `design/class-round12/notes.md` section C
has the files): each kind has its `art` and `headR` in js/heroes2.js, its LOOK2 entry is gone, and what the code drawing
also did (a glow, flames, the bale's rolling straw, the totem's rise, see-through spirits, a recoil, a turning key) is
kept in js/fx2.js `ART2.<kind>` (js/looks2.js says how). Stills before and after: `clips/r15/wire/`. The Engineer's
mortar is the kind `snowMortar` now (`mortar` was the Foundry's enemy of that name, which took its place in DEFS).
Only the Bandit's shadow clone is still borrowed.
| kind (hero) | now | the real sprite should be |
|---|---|---|
| ~~haybale (Haymaker)~~ | art/summons/haybale.svg (round 15); was drawn in code: a round bale with straw ends | fine as is; a rolled bale with twine bands |
| ~~totem (Shaman)~~ | art/summons/totem.svg (round 15); was drawn in code: a carved post with a bird head | a carved, painted spirit pole |
| ~~spiritBear, spiritEagle, spiritBeaver (Shaman)~~ | art/summons/spirit-bear, -eagle, -beaver.svg (round 15); was drawn in code: pale blue ghostly animals | three translucent spirit animals in one shared style |
| ~~cauldron (the Witch's, Cursed Brew)~~ | art/summons/cauldron.svg (round 15); was drawn in code: a black pot with bubbling brew | fine as is |
| ~~warlockImp (Warlock)~~ | art/summons/warlock-imp.svg (round 15; still turned blue-grey, as every summon of ours); was art/enemies/placeholder/imp.svg | the Warlock's own small horned familiar |
| ~~beehive (Beekeeper)~~ | art/summons/beehive.svg (round 15); was drawn in code: a straw skep | fine as is |
| ~~crate, barricade (Quartermaster)~~ | art/summons/supply-crate.svg, barricade.svg, barricade-spiked.svg (round 15); was drawn in code: a slatted crate, a plank barricade | wooden supply crate; spiked plank barricade |
| ~~pavise (Crossbowman)~~ | art/summons/pavise.svg (round 15); was drawn in code: a tall painted shield on a prop | fine as is |
| ~~bigBomb (Grenadier)~~ | art/summons/big-bomb.svg (round 15); was drawn in code: a large black bomb with a fuse | fine as is |
| ~~torcher, tesla, mortar, windup, medbay, medDrone (Engineer)~~ | art/summons/engineer-*.svg (round 15; the mortar's kind is snowMortar); was drawn in code: brass turrets and a little drone | brass-and-wood machines in the Foundry style |
| shadowClone (Bandit) | the Shade's sprite washed near-black | fine as is |
| ~~(parts) Bearskin~~ | art/heroes/r12/bearskin.svg (round 15); was the club is part of the body sprite | paws and the club as their own parts, so the paws can swipe |
| ~~(parts) Warhelm~~ | art/heroes/r12/warhelm.svg (round 15); was the hammer is part of the body sprite | the hammer as its own part, so the fists can alternate |
| ~~(parts) Bulwark, Valkyrie, Samurai, Trapper~~ | art/heroes/r12/bulwark, valkyrie, samurai, trapper.svg (round 15); was weapon grips drawn for one hand | Bulwark's two-handed grip, Valkyrie's spear held at the shaft, the Samurai's two-handed katana, the Trapper's shotgun and a trap at the hip |
| ~~demon form (Warlock)~~ | art/heroes/r12/warlock-demon.svg (round 15); was the Warlock's sprite washed red, horns and a big sword drawn in code (fx2.js demonForm) | its own horned demon bust holding the sword |

## Round 15 (lane N): the six new heroes are on stand-ins
Each wears an existing hero's sprite recoloured (`tools/standins.mjs` writes `art/heroes/standin/<file>.svg` with
js/recolor.js, as the Enchantress was made from the Witch); props that the borrowed sprite lacks are drawn in code
(js/fx3.js). The final files go at `art/heroes/<id>.svg` (the Mob's bodies `art/heroes/mob-torch.svg`, `-pitchfork`,
`-axe`, `-dagger`). **To switch over**: in js/heroes3.js change `const ART = 'art/heroes/standin/'` to `'art/heroes/'`,
then delete `art/heroes/standin/` and run `python tools/build-sw.py <version>`. Nothing else reads the stand-ins.
All in the heroes' top-down bust style (220 x 220 view box, front = down, one ink outline, no eyes), with the same
part ids the others use (`sprite`, `body`, `arm-r` with `data-pivot="154 108"`, `arm-l` with `data-pivot="46 108"`),
because the game swings those arms.

| hero (kind id) | stand-in now | what the real art needs |
|---|---|---|
| The Mob: torch-bearer (`mob`, file `mob-torch.svg`) | the Digger in browns; a flame drawn in code at the end of his spade (fx3.js `torchFlame`) | a peasant holding a **torch** in `arm-r` (the game swings it); no flame in the art (the game draws a live one at the torch's head: say where the head is, or keep it at the Digger's spade tip, about 1.9 head-radii out, a little left of straight ahead) |
| The Mob: pitchfork (`mobPitchfork`, `mob-pitchfork.svg`) | the Haymaker with a green hat | a second peasant, plainly a different person from the Haymaker hero, pitchfork in `arm-r` held to thrust |
| The Mob: axe (`mobAxe`, `mob-axe.svg`) | the Werewolf's woodsman in a green shirt | a peasant with a wood axe in `arm-r` held to swing |
| The Mob: dagger (`mobDagger`, `mob-dagger.svg`) | the Bandit in a blue scarf (his cutlass) | a peasant with a short dagger in `arm-r` held to stab |
| The Mob together (`mob.svg`, a still for faces: the camp, the Book, the HUD card) | the four stand-ins set in a diamond | one picture of the four shoulder to shoulder; it is only ever shown as a small round face, so heads and tools, not bodies. **The four bodies must be four separate files** (each is its own unit, about 64% of a hero's size on screen: the game scales them, draw them at full size) |
| Clockmaker (`clockwork`) | the Engineer with a blue coat | a clockmaker: a brass winding key on his back, a pocket watch or a clock hand in `arm-r` (he throws clock hands: anim `throw`) |
| Air Mage (`airMage`) | the Storm Mage in pale sky blue (her bolt badge still shows) | robes that look blown about, no lightning badge; both arms as parts (anim `cast` lifts both) |
| Warden (`warden`) | the Tower in dark iron | a jailer in iron plate with a ring of keys; **the chain as its own part in `arm-r`** (a weighted chain: the game swings the arm and draws the links flying out along the arc, fx3.js `chainSwing`; with the chain in the art it could draw less); shield arm `arm-l` as now, or a lantern |
| Telekinetic (`telekinetic`) | the Seer in magenta (her crystal ball, her blindfold) | no blindfold, no ball: hands held out, empty; both arms as parts (anim `cast`) |
| Earth Mage (`earthMage`) | the Druid in browns (his antlers) | no antlers: bare feet and clay to the elbows don't show from above, so a clay-stained apron or stone bangles; both arms as parts (anim `cast`) |

### Round 17 (lane water17): the Water Mage
`art/heroes/waterMage.svg` is a **placeholder sketch**, not a stand-in recolour: built by hand on the Frost Mage's file
(same base body, same parts and pivots), so it can be replaced by the real file at the same path with nothing else to
change. What it has now: a deep-teal hood, a sea-foam ruff, a water-drop gem at the front, curling wave crests on the
shoulders, a driftwood staff in `arm-r` with a ball of water at its head (the beam and the cannon come from that side of
her, fx-water.js `handOf`); empty left fist. For the art round: anything in sea blues and teals; keep the staff (or an
orb) in `arm-r`; anim `cast`. Her effects (the beam, bubbles, the dome, the jet) are drawn in code (js/fx-water.js).
