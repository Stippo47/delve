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
| kind (hero) | now | the real sprite should be |
|---|---|---|
| haybale (Haymaker) | drawn in code: a round bale with straw ends | fine as is; a rolled bale with twine bands |
| totem (Shaman) | drawn in code: a carved post with a bird head | a carved, painted spirit pole |
| spiritBear, spiritEagle, spiritBeaver (Shaman) | drawn in code: pale blue ghostly animals | three translucent spirit animals in one shared style |
| cauldron (Alchemist) | drawn in code: a black pot with bubbling brew | fine as is |
| warlockImp (Warlock) | art/enemies/placeholder/imp.svg | the Warlock's own small horned familiar |
| beehive (Beekeeper) | drawn in code: a straw skep | fine as is |
| crate, barricade (Quartermaster) | drawn in code: a slatted crate, a plank barricade | wooden supply crate; spiked plank barricade |
| pavise (Crossbowman) | drawn in code: a tall painted shield on a prop | fine as is |
| bigBomb (Grenadier) | drawn in code: a large black bomb with a fuse | fine as is |
| torcher, tesla, mortar, windup, medbay, medDrone (Engineer) | drawn in code: brass turrets and a little drone | brass-and-wood machines in the Foundry style |
| shadowClone (Bandit) | the Shade's sprite washed near-black | fine as is |
| (parts) Bearskin | the club is part of the body sprite | paws and the club as their own parts, so the paws can swipe |
| (parts) Warhelm | the hammer is part of the body sprite | the hammer as its own part, so the fists can alternate |
| (parts) Bulwark, Valkyrie, Samurai, Trapper | weapon grips drawn for one hand | Bulwark's two-handed grip, Valkyrie's spear held at the shaft, the Samurai's two-handed katana, the Trapper's shotgun and a trap at the hip |
| demon form (Warlock) | the Warlock's sprite washed red, horns and a big sword drawn in code (fx2.js demonForm) | its own horned demon bust holding the sword |
