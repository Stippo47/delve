# Boss: the Great Ooze (the Sewers, floor 3)

Round 13. The designer, round 9: "Design a new boss. Maybe the slime king? The great ooze." Round 12, on what was
built: "Shadow too big. Overall doesnt look very good. I do not like the tentacles. Yeah too easy. Don't like the
ability pool quality".

What changed:
- **The tentacles are gone**, and the canal arms' whole phase with them.
- **The ability pool**: three globs of spit and a circle round it could have belonged to any big thing. Every move
  now is something only a slime does: it hops, it rolls and bounces off the walls, it buds off slimes that crawl home
  to it, it tears in two and slaps back together, it melts.
- **How it looks**: drawn again in the look of the slime the designer picked in art round 7 (a soft-cornered block of
  jelly, lit corner to corner, a gloss on its shoulder, a darker band along its low edge, things inside it), in sewer
  green, and alive: it wobbles, squashes before a hop, stretches in the air, pulls itself round to roll.
- **The shadow** is 62% of what it was, and shrinks under it as it rises.
- **Harder**: about even now at the level the campaign meets it.

Code: `js/boss-ooze.js` (every number in `OZ`, `PHASE_AT`), its looks `js/boss-ooze-fx.js`, shared tools
`js/boss-kit.js` and `js/boss-draw.js`. Art: drawn in code.

## Who it is
Everything that ever went down the drains, grown into one slime the size of a cart: bones, a skull and a shield turn
slowly inside it. It **shrinks as it's hurt** (to 72% of its size at the end), so you can read how it's doing from
across the room. Poison and water don't touch it; fire does (x1.4), and so does cold.

## The arena: the Cistern
Two chunks by two. **Two canals** run across the room (wading soaks and slows: the Sewers' usual water), four pipe
pillars, grates and moss. It sits in the far pool until a hero comes within 420 or hurts it.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Hop Slam** | 1+ | **get out from under it**; mind the slick it leaves | it squashes down, goes up the screen stretched thin (its shadow small under it), comes down flat: ooze splashes out across the floor, gobs fly |
| **Roll** | 1+ | **read the bounce**: step off a zig-zag path | it pulls itself into a ball; its whole path shows on the floor, wall to wall to wall; it rolls it, slapping off each wall |
| **Heave** | 1+ | get off it | it shudders; a ripple of itself rolls out from under it |
| **the Brood** | 2+ | **kill the slimes before they crawl home** (each one that gets back heals it) | slimes bud off it; after a while each turns round and crawls back, and is drunk in |
| **the Split** | 3+ | **fight two at once**: each half goes for someone else | it tears in two, strings of itself snapping between the halves; two smaller oozes, each hopping and rolling on its own |
| **the Slap** | 3+ | **not stand between the halves** | a broad line shows between them; they fly together down it and meet with a splash that throws everyone near |
| **Meltdown** | 4 | keep fire off its gas (or use it) | it goes pale and yellow and faster; every landing leaves a cloud of sewer gas |

## Phase 1: the Ooze (100% to 70%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| Hop Slam | every 4.2-5.4 s | 1.15 s (the first quarter crouched, then in the air: nothing can hurt it there) | a circle 145 where its mark will be (smaller as it shrinks) | 74, thrown hard; it leaves a **slick** (60 across, 8 s: slows, and burns like oil) |
| Roll | every 8-10 s, its mark 150+ off | 0.95 s | three legs up to 640 long, each as wide as it is, bouncing off the room's walls | 58 to anyone it rolls over (once a leg), thrown aside; then it rests 0.9 s |
| Heave | two heroes touching it (or one, often), every 3.4-4.4 s | 0.8 s | a circle round it, its size + 56 | 40, poison 30, thrown off |

## Phase 2: the Brood (70% to 45%)
**Turn:** a heave that throws everyone far (a circle its size + 110: 10, poison) and three slimes bud off. Then every
12 s two more bud off (slimes and sludge slimes; at most five at once), and each hop sheds one where it lands. After
8-11 s out in the room a slime turns and **crawls home**: one that touches the ooze is drunk in and **heals it 1.2%**.

## Phase 3: the Split (45% to 20%)
**Turn:** a heave; then it **tears in two**. Each half is 72% the size and runs the whole kit on its own, the other
half at whoever the first isn't on. A blow on either is a blow on the ooze (one health bar). After 13 s:
- **the Slap**: 1.4 s tell (a line 124 wide between them), then they fly together at 520 a second: 58 to anyone in
  the way, and where they meet a circle 185: 84, poison, thrown hard. It is whole again, and **dazed 1.3 s, blows
  +35%**. 9 s later it tears again.

## Phase 4: Meltdown (20% to 0)
**Turn:** a heave, two more slimes. It melts: paler and yellower, 35% faster, hops and rolls 20% more often, hops come
down quicker, a roll takes five legs, each landing leaves **sewer gas** (poisons; fire sets it off), the brood buds a
quarter more often and the split lasts a fifth less.

## Death
It bursts: gobs of it fly across the room and a wide slick is left; its slimes and its other half go with it.

## Why it's fun to watch
- It shrinks as it's beaten: the fight's progress is the boss's size.
- The roll is a picture you read before it happens: the whole bounce is on the floor.
- The brood race: break off to kill the slimes crawling home, or watch it drink them back.
- Two bosses for a while, then the moment they slap back together and it stands there dazed.

## Numbers
Health 1010 (x1.4 for every boss, then the dungeon's strength and party size), walk 52 (in surges), mass 7, no
knockback. Phases at 70%, 45%, 20%.

Balance (`node tools/runs.mjs --boss --theme sewers --level 25 --party paladin,archer,cleric,twinfang --n 100`):
100 fights: won 51, wins about 148 s (all fights about 154 s).
It is touchy: a few percent of health either way moved it by ten fights in a hundred. The knobs: `OZ.hop.dmg` and the
other blows, health, `OZ.split` (dur, again), `OZ.brood`.
Before main's hero pass was merged it was even with blows a sixth softer (45 of 60 there after it).

Measured on the branch with main merged in (2026-11-22: round 13's hero ability pass and statuses, round 14's XP
curve). The level is the one the campaign reached this boss at in round 12; the new XP curve will have moved it:
**re-measure once the campaign has been run again**, and move health first.
