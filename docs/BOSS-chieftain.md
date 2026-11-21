# Boss: the Goblin Chieftain (the Warren, floor 3)

The Warren's boss, replacing the plain Orc Warboss. The designer (round 9, the Warboss card): "Chieftain. More
abilities." From the roster they approved: charges, a spinning cleaver, and war drums round the room that call waves
until they're smashed. From the Warren deck note: goblins whose spears "come back immediately", and dynamite mice
("the boss could summon them"). Built like the Bone King (`docs/BOSS-bone-king.md`): every move telegraphed on the
floor, dodgeable by a hero who moves at once, and a fight that changes as it goes.

Code: `js/boss-chieftain.js` (every number in `CH`, `PHASE_AT`), shared boss tools `js/boss-kit.js`, looks
`js/fx-boss.js` (drums, tunnels, the stage, spears). Art: PLACEHOLDER, the orc recoloured warmer and darker
(`art/enemies/orc.svg` through `js/recolor.js`), drums drawn in code. Real art: `docs/ART-NEEDED-bosses.md`.

## Who he is
The biggest goblin in the tunnels, wide as an orc, in war paint, a cleaver in one fist and a bundle of spears on his
back. Loud, fast for his size, and the whole Warren comes when he calls.

## The arena: the War Camp
- Two chunks by two (about 1300 along by 960 across). The party comes in at the near end.
- His **stage** at the far end: a hide-covered mound ringed with bone spikes. He stands on it until a hero comes within
  430 or hurts him, then stamps down off it (dust burst) and comes on.
- **Two bonfire pillars** in the middle. They stop his charge (and he hits them: see below) and his spears.
- **Four war drums** near the corners (two by the stage, two half-way down). Quiet in phase 1 (they're not there to
  hit). From phase 2 they beat.
- **Four tunnel mouths** in the side walls. His goblins and mice come out of them (the mouth glows orange first).

## Rhythm
Tell (a shape fills on the floor) -> hit -> recovery (he stands: the party's window). Between moves he walks at his
mark (the nearest hero, or whoever is taunting him), turning fairly quickly. Every drum still beating takes 6% off his
tells and cooldowns, so smashing the drums slows him down as well as stopping the waves.

## Phase 1: the Chief (100% to 70%)
| move | when | tell | shape | hit | after |
|---|---|---|---|---|---|
| **Chop** | a hero within 110 | 0.85 s, cleaver raised | a cone in front, 175 long, 1.9 rad | 26, thrown back hard | 0.7 s |
| **Charge** | every 6.5-8.5 s, at his mark if it's out of reach, else now and then at the furthest | 0.85 s, head down | a line his width, up to 620, cut short by a pillar or wall | 29, thrown aside | runs into a pillar or wall: **dazed 1.7 s, takes 35% more** |
| **Spear** | every 4.5-6 s, at the furthest hero | 0.75 s | a line 640 long, 52 wide | 21 | the spear **flies straight back** to his hand down the same line 0.5 s later: a second line to dodge |

The counterplay: stand near a bonfire pillar and he charges into it.

## Phase 2: War Drums (70% to 45%)
**Turn:** a roar (a circle 230 across fills 0.9 s: 10, staggers, throws everyone off him). The four drums wake.
- **The drums**: each beats (it swells and glows) and every ~14 s calls two of the Warren out of the nearest tunnel
  (goblins, spear goblins, bombers, hobgoblins; at most 5 at once). A drum has a little health (110 x the room's
  strength^0.5) and stands still: smash it and its waves stop (and he gets slower).
- **Dynamite mice**: every 11-14 s he whistles and three mice with lit dynamite run out of the tunnels at the heroes
  (the Warren's own dynamice: they fizz next to you, then blow).
Chop, charge and spear go on.

## Phase 3: the Whirling Cleaver (45% to 20%)
**Turn:** another roar.
| move | when | tell | what | after |
|---|---|---|---|---|
| **Cleaver Spin** | every 10-12 s | 0.6 s (a circle round him) | he spins and walks at his mark for 2.4 s: a circle 105 across goes down 0.32 s ahead of him the whole way, 13 a hit and thrown | **dizzy 1.5 s, takes 35% more** |
| **Bomb Barrage** | every 9-11 s | 1.0 s, each a little later than the last | 5 bombs lobbed on and round the heroes, circles 72 across | 19 and burn 28 |

## Phase 4: Last Stand (20% to 0)
**Turn:** a roar, and every drum still standing beats at once and calls two more. Then:
- tells and cooldowns x0.8 (on top of the drums);
- **charges come in pairs**: straight after the first, a second at someone else (dazed only if one of them hits a wall);
- the spin comes every 7-9 s and the drums beat faster.

## Death
He topples; the drums burst and the goblins he called go with him. Coins.

## Why it's fun to watch
- The charge is a duel with the pillars: the heroes who stand behind one make him hit it, and the party piles on the
  dazed chief.
- The spear is a two-beat dodge: out of the line, then out of it again as it comes back.
- Phase 2 asks the party to split: some on the drums, some on him, while mice fizz about.
- The spin chases one hero across the room, then he's dizzy and wide open.

## Numbers
Health 1000 (round 12; was 1300) (x1.4 for every boss, then the dungeon's strength and the party size), walk 54, mass 6, no knockback,
stagger half, chill 0.7, poison 0.3 (a rot burst is 15% of its health: the Bone King has 0.3 too). Phases at 70%, 45%, 20%.

Balance (`node tools/runs.mjs --boss --theme warren --level 15 --party paladin,archer,cleric`, a fresh room: the
campaign (`--campaign 110`) first reaches the Warren's boss with three heroes averaging about level 14-15):
| | won | fight length |
|---|---|---|
| 10 fights, level 15 (final numbers) | 7 of 10 | avg 230 s |
| 12 fights, level 16 (before the poison resistance) | 8 of 12 | 192-317 s (avg 235); every fight reaches phase 3, every win phase 4 |
Phase 1 ends about 45 s in, phase 2 runs 60-100 s (the drums), the last two about 40 s each. On a real run the party
comes in hurt from floor 3, which should bring the first-try rate down to about half.
Knobs: `CH.drum` (how often they call, how many at once), damage in `CH`, health in the def, `PHASE_AT`.

## Still to do
Real art (the chief, the drums, the tunnels; see docs/ART-NEEDED-bosses.md); his own swing and roar looks (the
visuals lane: the cone strikes with the bone-spike burst every 'blade' danger uses now).

## After main's round-10 balance pass (armour, cooldowns x1.22, poison's burst, 52 heroes)
Re-measured, not retuned (the lead tunes hero numbers first): level 15, 3 heroes: won 4 of 10, avg 246 s. Same command as above.

Round 12 (lane D): health 1300 to 1000, Chop 30 to 26, Charge 34 to 29, Spear 22 to 21 (the Warren itself went from x1.6 to x2.0). The campaign meets him with three heroes at about level 17: `--level 17 --party paladin,archer,cleric --n 20` won 8 of 20, wins about 218 s.
