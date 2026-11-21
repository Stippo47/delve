# Boss: the Gilded Seraph (the Gilded Spire, floor 3)

The Gilded Spire's boss, replacing the Radiant at the end of floor 3. The designer answered the proposed boss, the
Hollow Saint, "RETHINK" and the Archon "IDK", with no replacement, so this is **a new design, to be judged**: the host
of the Spire, built from the parts of the Spire the designer said yes to (sun blades, radiance, choir sprites, the
fallen angel's curse) and the Archon's clock-hand pillars of light. Built like the Bone King (`docs/BOSS-bone-king.md`).

Code: `js/boss-seraph.js` (numbers in `GS`, `PHASE_AT`), shared tools `js/boss-kit.js`, looks `js/fx-boss.js`
(`drawSunBlade`, `drawSanctum`, `drawHands`). Art: PLACEHOLDER, the seraph recoloured gold and bigger
(`art/enemies/placeholder/seraph.svg`); her singers are recoloured cherubs; the blades are drawn in code.

## Who she is
A tall gold angel with six wings who floats at a middle distance (220-400) from her mark. **Three sun blades** circle
her (gold swords, 115 out). Each is a thing of its own the heroes can hit and break (3.5% of her health each); a broken
blade re-forms after 15 s. Her light makes heroes radiant (slower, weaker; at full, a glow that can't attack). Radiance
can't touch her.

## The arena: the Sanctum
Two chunks by two (about 1300 by 960), white and gold, four pillars (they stop blades and her light), a great sun set
in the floor in the middle. She waits at the far end until a hero comes within 460.

## Phase 1: Dawn (100% to 70%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| **Sun Blade** | every 3.2-4.4 s | 0.8 s | one blade leaves the circle and flies down a line 620 at a hero (stopped by pillars), then back | 33, radiance 22 |
| **Smite** | every 4.5-6 s | 1.0 s | a circle 82 on her mark, then a pillar of light | 37, radiance 30 |

## Phase 2: Judgement (70% to 40%)
**Turn:** a burst of light round her (a circle 210: 12, radiance, thrown). Then, as well as the blades and smite:
| move | when | tell | what |
|---|---|---|---|
| **Clock Hands** | every 13-15 s | 1.2 s (two lines show) | two shafts of light 600 long turn slowly round her (0.55 rad/s) for 8 s while she stands at their centre; stopped by pillars; 10 every 0.2 s and radiance while you're in one. The party walks round the clock with them, or hides behind a pillar. |
| **Dive** | every 9-11 s | 1.3 s | she rises out of reach and comes down on a hero: a circle 140; 44, radiance 40, thrown hard |

## Phase 3: the Choir (40% to 15%)
**Turn:** a burst of light. **Two singers** rise at the sides of the room, joined to her by beams: while either sings
(up to 10 s) **she can't be hurt**. They lob notes of light at the heroes (12, radiance). Kill them to open her up. The
choir comes once more 28 s later if the phase lasts. Smite now falls on two heroes at once.

## Phase 4: the Fall (15% to 0)
**Turn:** a burst. Her gold goes dark: the sun in the floor dims, her blades turn black and purple, and her light
**curses instead of making radiant** (heals stop taking, blows land harder, a hexed hero hurts itself). Three clock
hands, turning 30% faster; two blades fly at once; everything 20% quicker.

## Death
She breaks apart in a burst of gold and dark; the blades fall.

## Why it's fun to watch
- The blades: three swords circling her, flying out one at a time, and heroes breaking them.
- The clock: the party walking round the room with the hands of light.
- The choir: the fight stops on her and turns on the singers.
- The fall: the gold room goes dark for the last 15%.

## Numbers
Health 1100 (round 12; was 950) (x1.4 for every boss, then the dungeon's strength and the party size), float 50, mass 6. Phases at 70%,
40%, 15%.

Balance (`node tools/runs.mjs --boss --theme spire --bossid gildedSeraph --level 58 --party paladin,archer,cleric,twinfang`;
the campaign hasn't reached the Spire in 110 runs: about level 58 is the guess from the Ember Deep's 50):
| | won | fight length |
|---|---|---|
| 10 fights, level 58 | 5 of 10 | avg 258 s |
(+10% damage took her to 3 of 10, -10% to 10 of 10.) Long fights: the choir phase is the knob (`GS.choir`).

## After main's round-10 balance pass (armour, cooldowns x1.22, poison's burst, 52 heroes)
Re-measured, not retuned (the lead tunes hero numbers first): level 58: won 2 of 10, avg 272 s. Same command as above.
