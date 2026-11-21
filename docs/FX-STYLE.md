# Delve: the effects style (round 8, lane V)

One look for every attack, ability, enemy move and ground effect, so a phone-sized room reads at a glance.
Code: `js/fx.js` (zones, beams, walls, waves, pillars, projectiles, statuses), `js/fxkit.js` (melee arcs, ability
signatures, body effects, impacts, danger strikes), `js/puddles.js` (ground puddles, 4 styles), `js/hpstyle.js`
(enemy HP, 4 styles). Bench: `lab.html?m=show&hero=<id>&ab=<attack|abilityId>`; clips: `tools/showcase.mjs`.

## The three beats
Every attack and ability has all three, in this order. If one is missing it doesn't read.

| beat | what | time |
|---|---|---|
| **tell** | the caster shows it is coming: arm wound back, light gathering in front of the hands (casters), a red mark over an enemy's head, a danger shape on the floor | 0.1-0.3 s (heroes), the sim's tell (enemies) |
| **carrier** | the thing that travels or sweeps: a weapon arc, a projectile with a trail, a beam, a shockwave | 0.08-0.15 s for a swing, the flight for a shot |
| **impact** | where it lands: a white flash (one frame-ish, 0.06 s), then a burst in the element's colour that fades over 0.25-0.4 s; area moves show their true radius at the peak | 0.3-0.5 s |

Lingering things (burning ground, poison clouds, vines, holy ground) are **ground effects**: drawn under the units,
soft-edged, never a hard ring.

## Sizes (room units; a hero's head is r 22, a hero ~60 across)
- **Basic shots**: body at least 24 long or 12 across, plus a trail at least as long as the body.
- **Ability shots**: body at least 36 long or 18 across, a trail 1.5-2x the body, their own shape (never a recoloured
  basic shot). The Necromancer's Bone Spear is a 56-long bone lance with a purple wake, his basic dart a small bone.
- **Impacts**: basic 24-30 across, ability 50+, area moves their real radius.
- **Melee arcs**: radius = the weapon's reach; 14-22 thick at the peak for blades, 22-28 for heavy weapons.
- Nothing that matters is thinner than 3 units on screen.

## Outline rule
- **Solid things** (projectiles, weapon arcs, debris, ice, flames, bones, rocks, notes, leaves) carry the one ink
  outline (`OUTLINE` 2.4 room units, `INK` #2B2230), same as the units.
- **Light** (glows, flashes, halos, the soft part of beams) is additive and **never outlined**.
- A beam is an inked core line plus an additive halo.
- Ground effects have no outline round their edge (they would read as walls or holes); things standing in them
  (flames, crystals, bubbles) are inked.

## Palette per element (dark / main / light / core)
| element | dark | main | light | core | used by |
|---|---|---|---|---|---|
| steel (physical) | #8A94A6 | #C9D2DE | #EEF3F8 | #FFFFFF | swords, daggers, arrows, axes |
| earth | #7A6A58 | #A99C8B | #E9DDC2 | #FFF8E6 | slams, shockwaves, charges, dust |
| fire | #C8401F | #FF8A3D | #FFC85A | #FFF0B0 | Pyromancer, fire arrows, fire foes |
| frost | #4A9CC8 | #9FDDF6 | #DDF6FF | #FFFFFF | Frost Mage, Frost Arrow, ice foes |
| storm | #5B6C9A | #FFE66B | #FFF7C2 | #FFFFFF | Storm Mage, shock |
| holy | #C9A44A | #F2C14E | #FFE7A0 | #FFFBEA | Paladin, Cleric, angels |
| nature | #3F7A2E | #6FA046 | #A9D47A | #E4F5C8 | Druid |
| poison | #4F7A22 | #7DB83A | #B5DE5E | #E6F7B0 | Plague Doctor, gas |
| shadow | #2E2440 | #5A4A7A | #9B86C9 | #E2D8FF | Twinfang |
| necrotic | #4E3A78 | #9B7BD6 | #D9C8FF | #F4EEFF | Necromancer (bone: #EDE4CD / #A99C8B) |
| blood | #7A2C40 | #C8453D | #FF8A7A | #FFE0DA | drains, leeches, rage |
| water | #2F7FB8 | #5DB7E0 | #BFE9F8 | #F2FBFF | lizardmen, slimes' spit, wet |
| song | #C88A20 | #FFD45A | #FFF0B0 | #FFFFFF | Bard |

Allies' summons are not an element: they keep their own colours, hue-shifted towards blue-grey, with the normal
black outline.

## Melee: arcs shaped to the weapon
A swing draws a crescent that **sweeps** across the weapon's arc in the direction the arm moves (0.1 s), holds a
moment, then thins and fades from its tail (0.15 s). Thick at the leading edge, tapering to a point behind.
| weapon | shape |
|---|---|
| blade (sword, greatsword) | a steel-white crescent, light core line |
| heavy (mace, hammer, club, flail) | a shorter, fatter crescent, plus a dust puff and cracks where it ends |
| scythe | a long, thin, wide crescent in bone white |
| thrust (dagger, spear) | a straight pointed streak along the line of the stab, two for twin daggers |
| bite / claw (rats, wolves, slimes) | three short claw rakes, or a chomp of two curved marks |

Enemy arcs are tinted warm (#FFD2C2 edge), the party's are steel white. **No rings or auras round heroes.** Buffs
show on the sprite (a colour wash) and as short-lived particles coming off the body (Rage: red steam; Unstoppable:
gold sparks; Rejuvenate: leaves).

## Ability signatures (what each one shows)
Each hero's ability has a shape no other move uses. The full list with tiers is in the showcase; in short:
Shield Bash (a gold shield-shaped shove), Guard (a gold tether and a shield glint on the ally), Consecrate (gold
cracks of light in the floor), Hold the Line (a planted shield crack + taunt streaks), Charge (dust wake and speed
lines), Ground Pound (a quake: cracks and a dust wave), Barrage (a bow flash + the fan), Frost Arrow (a frost arrow
with a snow trail, a frost burst), Roll (a dust swoosh), Backstab (smoke blink + a cross slash), Dash (speed lines),
Fan of Knives (a blade-glint burst + big knives), Rage (a red roar + steam), Leap (lift-off dust, a crater landing),
Cleave (a full blade circle), Shockwave (earth erupting in a line), Whirl (spinning flail arcs), Unstoppable (gold
shards breaking off), Reap (a full scythe circle), Hook (a chain and hook), Old Bones (a bone-white flash), Fireball
(a big fireball, a fiery blast), Flame Wall (tall flames), Inferno (a fire nova of flame tongues), Ice Shard (a big
crystal), Frost Nova (ice spikes bursting outward), Ice Wall (crystal blocks), Chain Lightning (thick forked bolts
and flashes), Thunderclap (a bolt from the sky and a shock wave), Storm Cloud (a dark cloud raining over its patch),
Mending Ray (a warm ray), Sanctuary (a fence of light posts), Smite (a pillar of light), War Song (notes flying to
allies), Lullaby (a cone of drifting notes), Encore (a star streak), Entangle (vines bursting up), Rejuvenate
(leaves), Call Wolf (a leaf swirl), Raise Dead (a necrotic eruption), Life Drain (a blood ribbon), Bone Spear (a bone
lance), Miasma (a gas cloud), Cure (clean bubbles), Leeches (leeches flung and clinging).

## Impacts
- Shots burst where they stop, in their element: an arrow kicks splinters, a bolt pops a star of its colour, a
  fireball blasts, ice shatters into shards, a vial splashes, a note pops.
- Danger zones (enemy moves): the dashed shape fills as it comes; when it strikes, a white flash and a burst shaped
  to its kind (bone spikes up out of the floor, a soul wave, a water splash, flames, ice).

## Timing and cost
- Ease out on everything that grows (fast then slow), ease in on fades.
- Screen shake stays small; hit-stop only on crits.
- iPhone 11: no per-frame canvas filters, no shadowBlur, gradients only on things that are few at once; hashed
  noise instead of random() so nothing needs state; effects that can be many (impacts, arcs) are plain fills.

## Round 9 (lane V)
- **Ground bodies merge** (`js/puddles.js`): `drawPuddle` only queues a body; `flushPuddles` (render.js, after the ground
  fx) paints every body of one kind into one offscreen layer a pass at a time (outline, dark, light, gloss), so
  overlapping bodies become one body with one outline. Seven styles (Inked, Soft, Bands, Splat, Rimmed, Pixel,
  Silhouette). Kinds: oil, fire, gas (and poison zones), water, mist, web, smoke (Twinfang), frost (lingering cold),
  earth (Entangle's churned patch). Anything that stands up out of a body is drawn after it (fx.js `zoneAir`).
- **Under the units**: Guard's chain, the Mending Ray, Hook's chain, Ground Pound / Leap / Old Bones III quakes (no
  cracks anywhere now), Flame Wall (flames sorted back to front), Rage's roar lines, War Song's ring.
- **Borders mean protection**: Guard (gold) and Unstoppable (white-gold) draw a border round the ink outline
  (parts.js `border`). Elites and majors have none: drawn 8% / 16% bigger, a faint warm tint and a twinkle.
- **Enemy HP** over the head: Bar, or Arc for tanky ones (style 5, the default).
- **Statuses**: burn licks are born, climb, sway and die; radiance is glints on the body and light rising off it (no
  halo); the radiant aura has no hard ring, its reach is a ring of twinkling stars.
- **Bone King**: his cleave is one huge bone crescent, the lance a thrust with bone spikes bursting up along it, rows
  and graves knots of bone spikes, the soul attacks a wave of blue soul fire with souls rising.
- Bench: `lab.html?m=puddles&puddle=1..7`, `m=ehp&ehp=1..5`, `m=looks`, `m=king&phase=1..4`.

## Round 10 (lane V3): showcase 2 notes
The designer's words: `docs/riffle-log/2026-11-21-round10-showcase2.txt`. Each note changed only what it asked.
- **No X star where lightning hits**, anywhere: a lightning beam ends in a flash and a few sparks; a blow that carries
  shock leaves no impact star (sim.js `u.hitZap`). Lightning beams stay at full strength until their last 0.1 s.
- **Zeus Bolt** (id `stormCloud`): a bolt that flies to an enemy and leaps on to the nearest one it hasn't struck,
  shocking each (kits.js `zeusBolt`); I one bolt, 4 leaps; II 6 leaps; III three bolts. The marks and the Zap's bounce
  are gone. The Zap and Chain Lightning start at her hands (kits.js `handPt`); the Zap is thin, a stronger yellow.
- **Roll** is a slide (`act.slide`: fast, then slowing; dust off her feet, under her); at III the caltrops are flung out
  of her as she slides and land where she was. **Frost Arrow** leaves no rime. The bow is held further forward.
- **Healing** shows as inked green crosses rising off the edge of the body (render.js particle `shape: 'plus'`), for
  every heal. The Mending Ray is an inked gold band. Sanctuary: one ring of light through every post.
- **Light orb**: fanned wide (±0.5 rad) and curving in; a friend an orb passes through is healed a little (sim.js
  `p.allyHit`, a shot that does something to friends it passes).
- **Smoke** (Backstab, Dash) fades out (puddles.js: smoke bodies are their own layer, faded by their alpha); Backstab
  puffs smoke where she comes back in too. `drawPuddle(..., fade)` does the same for any one body (the cluster's poof).
- **Spins hold the weapon out** (parts.js: a single weapon straight out to the side). Reap's orbs drip on the way and
  burst when they reach her. **Old Bones**: her soul (a pale wisp) slips up out of her and is yanked back in.
- **Berserker**: the flail blow is the head, a dent and dust; Whirl's heads are drawn like the one he holds
  (fxkit `flailHead`), no chains. **Ice Shard**: frost streaks behind each spike; anything cold sheds slow snowflakes.
- **Lullaby**'s notes each end in their own place, drifting up and fading; the sour note sways slower.
- **Entangle**: the round 8 patch and coiling vines are back (the entangled look on units stays).
- **Necromancer**: the attack is a ball of soul fire (no bone), big and slow, shrinking and speeding up; the raised
  dead are cold grey with two matching fists (art/summons/minion.svg, no hue shift); Life Drain's ribbon reaches out
  first; Bone Spear is one plain bone spike in a violet wake.
- **Enemy blade strikes**: a circle of blade is a spin (two warm crescents sweep round it), a cone a chop crescent; bone
  spikes only for bone.
- **Heroes lane**: the Falconer's bird is its own part (`arm-l-bird`, hidden while `u.kit.falconOut`); War Horn, Mock and
  Showboat burst short sound lines out to the front and sides (no rings); Wing Guard's wings are longer and gold.
- **Variants** (js/fxvar.js, `?v_<key>=N`, the showcase records them with `--q v_shockwave=2`): Shockwave 1 Ridge (as
  it was), 2 Slabs, 3 Rolling; the wolf's bite 1 Jaws (as it was), 2 Chomp, 3 Rake, 4 Snap. Once one is picked, make
  it the default in fxvar.js.
