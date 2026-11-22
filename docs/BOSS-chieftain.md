# Boss: the Goblin Chieftain (the Warren, floor 3)

Round 13. The designer, round 12: "Nothing read horribly but the art/ visuals arent good. All of the abilities seem
kinda samey. As for the time. Make it last like 2 minutes. Increase his damage but lose hp. Similar ttk". And of his
spin (showcase 4): "The radiant glow is over his sprite."

What changed:
- **Art**: the art lane's round 10 chief (two axes, feathers, war paint, a clipped ear:
  `art/bosses/goblin-chieftain.svg`), and his camp redrawn in code to sit beside him (`js/boss-chieftain-fx.js`): a
  great hide stage pegged down with tusks, war drums that are drums (staves, a laced skin, a painted hand, two sticks
  that come down on the beat), timber-framed tunnel mouths.
- **Moves**: the spear (a line, then the line again) and the bomb barrage (five circles) are gone. What is left asks
  six different things (the table below). His blows have their own looks, none of them bone spikes.
- **Length**: about two minutes. His blows are a fifth to a quarter harder, his health is less than half.
- The radiant glow over his sprite is the statuses lane's (`status2`: "the radiance glow under units"); nothing his
  own is drawn over him now but his axes' crescents.

Code: `js/boss-chieftain.js` (every number in `CH`, `PHASE_AT`), shared tools `js/boss-kit.js` and `js/boss-draw.js`.

## Who he is
The biggest goblin in the tunnels, wide as an orc, an axe in each fist. Loud, fast for his size, and the whole Warren
comes when he calls.

## The arena: the War Camp
Two chunks by two. His **stage** at the far end (he stands on it until a hero comes within 430 or hurts him). **Two
bonfire pillars** in the middle (they stop his charge, and he hits them). **Four war drums** near the corners, quiet
until phase 2. **Four tunnel mouths** in the side walls (a mouth glows before something comes out of it). In a room
that isn't his camp the drums stand in a square round him and what they call comes up beside them.

## The moves: what each asks, and what it looks like
| move | phase | asks the party to | looks like |
|---|---|---|---|
| **Twin Chop** | 1+ | not stand in his face | both axes come across: two crescents sweep in from either side and cross |
| **Charge** | 1+ | **get out of the lane; stand by a bonfire and he hits it** | head down, a line his own width; into a pillar or wall: a crash, stars round his head |
| **Thrown Axe** | 1+ | **step off the ring** (in or out) | a thin ring on the floor that runs through him and through one of the party; the axe flies the whole ring end over end, a crescent behind it, and comes back to his hand |
| **War Drums** | 2+ | **break the drums**, or drown in goblins (each drum also hurries him) | the drums wake and beat (they swell and glow, the sticks come down); a tunnel mouth glows and goblins come out |
| **Dynamite mice** | 2+ | **get away from the lit mice** | he whistles; mice with fizzing dynamite run out of the tunnels |
| **Whirlwind** | 3+ | **run from him**; then pile on while he is dizzy | axes straight out, he turns like a top and walks at his mark, a crescent dragged behind each axe, the circle of his reach moving with him; then he sways, stars round his head |

## Phase 1: the Chief (100% to 70%)
| move | when | tell | shape | hit | after |
|---|---|---|---|---|---|
| Twin Chop | a hero within 110 | 0.8 s | a cone in front, 180 long, 1.9 rad | 31, thrown back hard | 0.6 s |
| Charge | every 6.5-8.5 s, at his mark if it's out of reach, else now and then at the furthest | 0.85 s | a line his width, up to 640, cut short by a pillar or wall | 37, thrown aside | into a pillar or wall: **dazed 1.8 s, takes 40% more** |
| Thrown Axe | every 5-6.5 s, at the furthest hero | 1.0 s | a ring 64 wide, 120-250 in radius, through him and where the hero will be | 30, thrown | |

## Phase 2: War Drums (70% to 45%)
**Turn:** a roar (a circle 230, 0.9 s: 12, staggers, throws everyone off him; dust rolls out and bars of sound burst
round him). The four drums wake.
- **The drums**: each beats and every ~14 s calls two of the Warren out of the nearest tunnel (goblins, spear goblins,
  bombers, hobgoblins; at most 4 at once). A drum has a little health (90 x the room's strength^0.5): smash it and its
  waves stop. Every drum still beating takes 6% off his tells and cooldowns.
- **Dynamite mice**: every 11-14 s he whistles and two mice run out of the tunnels at the heroes.

## Phase 3: the Whirlwind (45% to 20%)
**Turn:** another roar. Then:
- **Whirlwind**, every 9-11 s: 0.7 s winding up (a circle 118 round him), then 2.8 s turning and walking at his mark
  at 0.85 of his pace: 18 and thrown to anyone in reach (each hero at most once every 0.4 s). Then **dizzy 1.6 s, takes
  40% more**.
- **two axes**: a second ring, 0.35 s behind the first, through someone else, turning the other way.

## Phase 4: Last Stand (20% to 0)
**Turn:** a roar, and every drum still standing beats at once and calls two more. Then tells and cooldowns x0.8 (on
top of the drums), **charges come in pairs** (straight after the first, a second at someone else), the whirlwind comes
a quarter sooner and the drums beat faster.

## Death
He goes down in a cloud of dust; his drums burst and the goblins he called go with him.

## Why it's fun to watch
- The charge is a duel with the bonfires, and the party piles on the dazed chief.
- The ring is a shape nothing else in his fight has: the party steps in or out of it, not aside.
- Phase 2 asks the party to split: some on the drums, some on him, while mice fizz about.
- The whirlwind chases one hero across the camp, then he's wide open.

## Numbers
Health 440 (round 12 had 1000) (x1.4 for every boss, then the dungeon's strength and the party size), walk 54, mass 6,
no knockback, stagger half, chill 0.7, poison 0.3. Phases at 70%, 45%, 20%.
Round 12's blows: Chop 26, Charge 29. Round 13: Chop 31, Charge 37.

Balance (`node tools/runs.mjs --boss --theme warren --level 17 --party paladin,archer,cleric`; the campaign meets him
with three heroes at about level 17): 100 fights: won 44, **wins about 116 s** (all fights about 112 s). Phase 1 ends
about 26 s in. Round 12's fight: 8 of 20, wins about 218 s.
Knobs: health, `CH.drum` (how often they call, how many at once), `CH.mice.n`, the damage numbers.
