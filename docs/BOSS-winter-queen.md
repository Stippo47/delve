# Boss: the Winter Queen (the Frost Hollow, floor 3)

The Frost Hollow's boss, replacing Old Frost (the frost giant) at the end of floor 3. The designer answered her card
"IDK" (round 9) and changed nothing, so she is built as the roster proposed it, to be judged in the clips: "An ice
mage. Walls of ice split the party, a blizzard hides the room, and she must be reached while her mirror images
shatter." Built like the Bone King (`docs/BOSS-bone-king.md`). If she's a no, the hall and the moves can go to
another frost boss (Old Frost's rolling snowballs, say) with little change.

Code: `js/boss-queen.js` (every number in `WQ`, `PHASE_AT`), shared tools `js/boss-kit.js`, looks `js/fx-boss.js`
(`drawGlacier`, `drawBlizzard`; her walls use the ice-wall look the Frost Mage's Ice Wall has). Art: PLACEHOLDER, the
Frost Mage hero's art made pale and bigger (`art/heroes/frost.svg` through `js/recolor.js`).

## Who she is
A tall ice mage in a court of frozen pillars. She doesn't come to you: she stands off at 300-420 from her mark, casts,
and blinks away when you reach her. Cold can't touch her; fire can (x1.3).

## The arena: the Glacier Hall
- Two chunks by two (about 1300 by 960). The party comes in at the near end.
- Four ice pillars (they stop her lances: a hero behind one is safe), cracked ice underfoot.
- **Her dais** at the far end, a six-sided slab of blue ice. She waits on it until a hero comes within 460 or hurts her.

## Rhythm
Tell -> hit -> recovery as every boss; she picks the nearest hero (or a taunter) and walks to keep her distance.

## Phase 1: the Court of Ice (100% to 70%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| **Ice Lances** | every 3.2-4.4 s | 0.9 s | a fan of 3 lines, 580 long, 48 wide, 0.28 rad apart (stopped by pillars) | 41, chill 30 |
| **Frost Nova** | a hero within ~150 | 0.85 s | a circle 175 round her | 43, chill 55, thrown back; then she **blinks** to open floor 380-560 away, as far from the party as she can |

## Phase 2: Walls of Ice (70% to 45%)
**Turn:** a nova and a blink. Then, every 9-11 s:
- **Ice Wall**: a line 760 long fills across the room **through the middle of the party**, at right angles to her
  (1.1 s, 16 and chill 30 to anyone still on it). Then a wall of ice blocks rises along it for 7 s (blocks walking and
  shots; the A* grid is rebuilt): anyone on the line is shoved off to their side. The party is split in two.
- **Glacial Spike**: straight after, a spike falls on whoever is furthest from her (the one cut off): a circle 64,
  1.0 s, 45, chill 40.

## Phase 3: Mirror Images (45% to 20%)
**Turn:** a nova and a blink. Then she **splits into three**: two images and herself, at three spots round the room,
looking the same. The images cast her lances at half strength, keep their distance, and each has only 4% of her health:
broken, an image **shatters** (a circle 115 fills 0.5 s: 28 and chill, and icicles fly out). While no image stands,
two more form every 16 s and she slips to a new spot among them. The heroes can't tell which is her: they hit
whichever is nearest, so breaking images is part of the fight (and stepping out of their shatter).

## Phase 4: the Blizzard (20% to 0)
**Turn:** a nova and a blink. The room goes white: snow drives across it and a pale veil lies over everything.
- **Hail** falls round the heroes all the time: a circle 56 every ~0.65 s near a hero (1.0 s, 28, chill 22).
- Her tells and cooldowns x0.8. Walls and images go on.

## Death
She shatters in a burst of ice; her images go with her and her walls melt.

## Why it's fun to watch
- She runs the room: the heroes chase her, she blinks away, and the archer is the one who can keep on her.
- The wall splits the party and the spike hunts whoever's alone on the far side.
- The mirror images: three queens, and the heroes break the wrong ones first.
- The blizzard: the last 20% is a scramble under falling hail.

## Numbers
Health 2600 (x1.4 for every boss, then the dungeon's strength and party size), walk 50, mass 5, no knockback.
Phases at 70%, 45%, 20%.

Balance (`node tools/runs.mjs --boss --theme frost --bossid winterQueen --level 41 --party paladin,archer,cleric,twinfang`;
the campaign meets the Frost Hollow's boss with four heroes at about level 41):
| | won | fight length |
|---|---|---|
| 12 fights, level 41 | 8 of 12 | avg 158 s; losses in phase 4 |
Tuning showed her to be swingy: hail at 0.55 s and +15% damage took her to 2 of 12; the blizzard's hail is the knob
that moves her most (`WQ.hail`), then health.

## Still to do
Real art (her, the images, the dais; docs/ART-NEEDED-bosses.md). The designer's answer on whether she stays.
