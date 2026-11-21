# Boss: the Great Ooze (the Sewers, floor 3)

The Sewers' boss, replacing the Lizard Chief at the end of floor 3 (he stays a mini-boss). The designer (round 9, the
Rat King card): "Oh I accidentally made this idea. Design a new boss. Maybe the slime king? The great ooze." They also
liked the Thing in the Cistern ("Good except the water level rises idea"): it is folded in as the third phase, arms
rising out of the canals, and the water never rises. Built like the Bone King (`docs/BOSS-bone-king.md`).

Code: `js/boss-ooze.js` (every number in `OZ`, `PHASE_AT`), shared tools `js/boss-kit.js`, looks `js/fx-boss.js`
(`drawOoze`, `drawCistern`, `drawTentacles`). Art: PLACEHOLDER, drawn in code. Real art: `docs/ART-NEEDED-bosses.md`.

## Who it is
Everything that ever went down the drains, grown into one slime the size of a cart: sludge green, darker at the rim,
bones and rubbish turning slowly inside it, no face. It moves in slow surges like the small slimes, and it **shrinks as
it's hurt** (to 72% of its size at the end), so you can read how it's doing from across the room. Poison and water
don't touch it; fire does (x1.4), and so does cold.

## The arena: the Cistern
- Two chunks by two (about 1300 by 960). The party comes in at the near end.
- **Two canals** run across the room (96 wide). Wading soaks and slows (the Sewers' usual water), so the party has to
  cross one to reach it and fight with water at their backs.
- Four pipe pillars, grates and moss. The ooze sits in the far pool until a hero comes within 420 or hurts it.

## Rhythm
Tell -> hit -> recovery, as every boss. It goes for the nearest hero (or a taunter), rethought every 1.1 s.

## Phase 1: the Ooze (100% to 70%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| **Hop Slam** | every 4-5 s | 1.2 s: it crouches, then it's in the air (over everyone's heads: nothing can hurt it in the air) | a circle 130 across on its mark's path | 60, thrown hard; it leaves a **slick** of itself (62 across, 8 s: slows, and burns like oil) |
| **Spit** | every 5.5-7 s, its mark 160+ off | 1.0 s, a little later each | 3 globs lobbed on and round the heroes, circles 58 | 28 and poison 30; a small slick each |
| **Smother** | two heroes touching it (or one, often) | 0.8 s | a ring round it, its size + 54 | 42, poison 36, thrown off |

## Phase 2: the Brood (70% to 45%)
**Turn:** it heaves (a circle round it: 10, poison, thrown far) and **splits**: three slimes bud off. Then:
- every 12 s two more slimes bud off (blue slimes and sludge slimes; at most five of its own at once), and every hop
  sheds two where it lands;
- **they come home**: after 8-11 s out in the room each slime turns and crawls back to it, and one that touches it
  is drunk back in and **heals it 1%**. Kill the slimes before they get home.

## Phase 3: the Cistern Stirs (45% to 20%)
**Turn:** another heave. Something else lives in the canals (dark rings on the water). As well as everything above:
| move | when | tell | shape | hit |
|---|---|---|---|---|
| **Tentacle** | every 5-6.5 s, at up to two heroes | 1.1 s: a curl breaks the water at the canal's edge | a line from the canal's edge 380 out at the hero, 68 wide | 46, soaked 50, thrown aside |
| **Grab** | every 7-9 s, at a hero within 260 of a canal | 1.0 s | a circle 70 on them | 20, soaked 60, and **dragged into the canal** |
The Thing is never seen whole and can't be hurt: it's the room fighting back.

## Phase 4: Meltdown (20% to 0)
**Turn:** a heave, two more slimes. It melts: paler and yellower, faster (x1.35), hops every 3.2-4.2 s, its hops come
down quicker (tell x0.85) and each landing leaves a **cloud of sewer gas** (poisons; fire sets it off) as well as a
slick; it buds off slimes a third more often.

## Death
It bursts into a wide slick of ooze; its slimes go with it.

## Why it's fun to watch
- It shrinks as it's beaten: the fight's progress is the boss's size.
- The brood race: the party has to break off to kill the slimes crawling home, or watch it drink them back.
- The canals: the party fights with water at its back, and from phase 3 the water itself reaches out.
- Fire plays: its slicks are oil, its last-phase gas explodes.

## Numbers
Health 1150 (round 12; was 1350) (x1.4 for every boss, then the dungeon's strength and party size), walk 52 (in surges), mass 7, no
knockback. Phases at 70%, 45%, 20%.

Balance (`node tools/runs.mjs --boss --theme sewers --bossid greatOoze --level 17 --party paladin,archer,cleric,twinfang`;
the campaign meets the Sewers' boss with four heroes averaging about level 17):
| | won | fight length |
|---|---|---|
| 10 fights, level 17 (final: the hop makes it untouchable rather than ethereal) | 8 of 10 | avg 189 s |
| 12 fights, level 17 | 10 of 12 | 152-250 s (avg 195); both losses in phase 4, the ooze at 3% and 9% |
| 12 fights, level 20 (earlier, weaker numbers) | 12 of 12 | 142-265 s |
Very sensitive to level (points in the web): at 17 it's a real fight, at 20 it's won. Knobs: damage in `OZ`, the
brood (`OZ.brood`), health.

## A later variant: the Thing in the Cistern
If the Sewers ever get a second boss (or a harder mode), the Thing can stand alone: the canals with no ooze, a dozen arms
that slam, grab and sweep, and a mouth that surfaces in a canal now and then as the only place it can be hurt.

## After main's round-10 balance pass (armour, cooldowns x1.22, poison's burst, 52 heroes)
Re-measured, not retuned (the lead tunes hero numbers first): level 17, 4 heroes: won 10 of 10, avg 188 s. Same command as above.
