# Boss: the Winter Queen (the Frost Hollow, floor 3)

Round 13. The designer, round 12: "Don't like all of the abilities. All seem very similar. U can keep her just improve
quality worthy of a boss. Clones shoukd also look different".

She is kept: an ice mage who stands off and blinks away, walls that split the party, mirror images, a blizzard. What
was wrong, as this lane reads it: five of her six moves were a pale blue line or a pale blue circle that ended in the
same small spikes. So every move is rebuilt until no two ask the same thing or look alike, and her images are no
longer copies of her.

Code: `js/boss-queen.js` (every number in `WQ`, `PHASE_AT`), her hall and moves `js/boss-queen-fx.js`, shared tools
`js/boss-kit.js` and `js/boss-draw.js`. Art: art round 9's Winter Queen (`art/bosses/winter-queen.svg`); her mirrors
are that art turned to frosted ice (`recolor.js`: colour drained to pale blue-white).

## Who she is
A tall ice mage in a court of frozen pillars. She doesn't come to you: she keeps 300-420 from her mark, casts, and
blinks away in a swirl of snow when you reach her. Cold can't touch her; fire can (x1.3).

## The arena: the Glacier Hall
Two chunks by two, four ice pillars (they stop her crystals), her dais of blue ice at the far end. She waits on it
until a hero comes within 460 or hurts her.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Icicle Fan** | 1+ | **stand behind a pillar or spread out** (real shots: no shape on the floor) | five crystals form in a fan over her shoulders and grow, then fly: the Frost Mage's own big crystals, five at once |
| **Frost Nova, and away** | 1+ | **get off her** | ice bursts out of the floor all round her: two rings of tall crystals, snow thrown up, snow left lying; she is gone in a swirl of snowflakes and comes out of another across the room |
| **Ice Wall and the Mist** | 2-3 | **walk round the wall**: the party is cut in two and the side cut off from her fills with freezing mist | a wall of ice blocks rises across the room through the middle of the party; mist rolls in behind it |
| **the Mirrors' Lattice** | 3+ | **keep off the lines; break a mirror to break its lines** | two ice mirrors of her stand in the room (white, frosted, still). Thin dashed lines run from her to one, to the other, and back; then they light: three beams of cold in a triangle across the room, crystals growing along them |
| **the Blizzard: the Eye** | 4 | **close in on her** (and step back out when she novas) | the hall goes white, snow driving across it; only a circle round her is still and clear, snow turning round its edge |

## Phase 1: the Court of Ice (100% to 70%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| Icicle Fan | every 3.2-4.2 s | 0.5 s of gathering | five shots fanned 0.2 rad apart, 520 a second, 780 far; pillars and walls stop them | 19 and chill 14 each |
| Frost Nova | a hero within ~150, every 5-6.5 s | 0.85 s | a circle 180 round her | 36, chill 44, thrown back; then she blinks 380-560 away, as far from the party as she can |

## Phase 2: Walls of Ice (70% to 45%)
**Turn:** a nova and a blink (she can't be hurt while it fills). Then every 12-14 s:
- **Ice Wall**: a line 760 long through the middle of the party, at right angles to her, 1.1 s: 16 and chill 30 to
  anyone still on it; then ice blocks stand along it for 8 s (they stop walking and shots; anyone on the line is shoved
  to their side).
- **the Mist**: at once, seven patches of freezing mist (92 across, 7 s; the game's own mist: chill 15 a second) lie
  along the wall's far side from her. Whoever was cut off has to come round.

## Phase 3: the Mirrors (45% to 20%)
**Turn:** a nova and a blink. **Two ice mirrors** form, as far from her and from each other as the room lets them
(each 10% of her health; they do nothing by themselves and never move). Broken, a mirror **shatters**: a circle 110,
0.5 s: 26 and chill. When none stand, two more form 15 s after the last pair.
- **the Lattice**, every 8.5-10.5 s while a mirror stands: 1.2 s of thin lines, then 3.6 s of beams between her and
  her mirrors (44 wide): 9 and chill 16 every 0.25 s on a line. One mirror left: one beam.

## Phase 4: the Blizzard (20% to 0)
**Turn:** a nova; she blinks to the middle of the hall and stays there. The storm comes down: **outside a circle 215
round her, 4 and chill 6.5 every half second**, all the time. She no longer blinks away after a nova (every 5.5-7 s):
the party is thrown out into the storm and comes back in. Fans and the lattice go on, 15% quicker; no more walls.

## Death
She shatters: crystals burst up where she stood and shards fly; her mirrors go with her, her walls and mist melt.

## Why it's fun to watch
- Five moves, five pictures: crystals in the air, a burst of ice, a wall with mist behind it, a triangle of beams, a
  white room with a hole in it.
- The mirrors are things to break with a reason to break them, and they look like what they are.
- The last phase turns the fight inside out: she stops running and the party has to stay on her.

## Numbers
Health 760 (x1.4 for every boss, then the dungeon's strength and party size), walk 50, mass 5. Phases at 70%, 45%, 20%.

Balance (`node tools/runs.mjs --boss --theme frost --level 38 --party paladin,archer,cleric,twinfang`; the campaign
meets her with the starter four at about level 38): 60 fights: won 27 (45%), wins about 151 s (all fights about 149 s).
The Icicle Fan decides it (five shots that can all land on one hero): at 26 a shot the party won 2 of 30, at 15 a shot
34 of 40. The knobs: `WQ.fan.dmg`, health, `WQ.storm`.
