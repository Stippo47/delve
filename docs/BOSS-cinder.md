# Boss: Cinder, the Old Drake (the Ember Deep, floor 3)

The Ember Deep's boss, replacing the Archfiend at the end of floor 3. The designer (round 9): "Very large, made of
multiple components. No wings. No flying. Fire call that drops fireballs from the sky as an ability. Scorch. Shoots a
narrow cone of flames forwards head turning slowly. Obstacles block it. More abilities." Built like the Bone King
(`docs/BOSS-bone-king.md`), in parts.

Code: `js/boss-cinder.js` (numbers in `CD`, `PHASE_AT`), shared tools `js/boss-kit.js` (parts), looks `js/fx-boss.js`
(`drawDrakeHead`, `drawDrakeSegment`, `drawPit`, `drawBreath`). Art: PLACEHOLDER, every part drawn in code.

## Who it is
An old wingless drake, long and low, crawling: a horned head (no eyes), five armoured body segments and a bladed tail.
Each is a separate thing on the floor that the heroes can stand next to, aim at and hit:
| part | size | what a blow does |
|---|---|---|
| **head** (the boss, the boss bar) | r 46 | full damage |
| **body segments** x5 | r 42 to 32, following the head's path | a fifth of the blow gets through the armour plates |
| **tail** | r 26, a health pool of its own (10% of the drake's) | 30% gets through; **break it** and the drake reels (stunned, takes 30% more for 2 s) and the tail lash is gone for good |
Fire can't hurt it; cold and wet bite (x1.3). Parts take no statuses (one segment's burn burst would set off the next).

## The arena: the Pit
Two chunks by two (about 1300 by 960). Four basalt pillars (the scorch stops at them: the shadow behind one is safe),
lava pools at the edges (dressing), the drake coiled at the far end until a hero comes within 470.

## Phase 1: the Old Drake (100% to 65%)
| move | when | tell | shape | hit |
|---|---|---|---|---|
| **Bite** | a hero close in front | 0.75 s | a cone 160 long, 1.4 rad | 46, burn 20, thrown |
| **Scorch** | every 7.5-9.5 s, its mark within ~500 | 1.0 s (the cone shows) | a narrow cone 440 long, 0.42 rad; then flame pours down it for 3 s while the head **turns slowly after its mark** (0.55 rad/s); pillars and walls stop it | 9 every 0.15 s and burn 14 while you stand in it |
| **Tail Lash** | a hero within 170 of the tail (while it's whole) | 0.8 s | a circle 140 round the tail | 38, thrown hard |
It crawls after its mark, turning slowly (1.6 rad/s): the body coils behind it, so the room fills with drake.

## Phase 2: Fire Call (65% to 35%)
**Turn:** a roar (a circle 230: 14, burn, thrown back). Then, as well as everything above:
| move | when | tell | what |
|---|---|---|---|
| **Fire Call** | every 9-11 s | 1.3 s, each a little later | it roars at the roof and **8 fireballs** come down: on and round each hero, the rest scattered; circles 76; 36 and burn 30; each leaves burning ground for 5 s. You see each ball drop out of the dark over its circle. |
| **Coil Rush** | every 8-10 s, its mark 120+ off | 1.0 s | head down along a line 560 (stopped by walls and pillars), the whole body after it: 42, burn, thrown aside. Into a pillar: dazed 1.4 s. |

## Phase 3: Molten (35% to 0)
**Turn:** a roar. Its body runs molten (orange cracks): every segment drips burning ground as it crawls (one patch
each every ~1.3 s, at most 16), so its own trail cuts the room up. The scorch turns 45% faster and lasts 20% longer, the
fire call comes every ~7 s with 12 fireballs, and every other move is 15% quicker.

## Death
It sags; the body plates crack apart. Coins.

## Why it's fun to watch
- It's big: the body coils across the room and the party fights round it.
- The scorch is a slow sweep the heroes dodge round the pillars; the archer behind a pillar is the picture.
- The tail is a choice: break it (and the drake reels) or stay off it.
- The fire call fills the floor with circles and then with flames; by the end its own trail has carved the pit up.

## Numbers
Health 1150 (round 12; was 1200) (x1.4 for every boss, then the dungeon's strength and the party size), crawl 42, mass 12. Phases at 65%
and 35%.

Balance (`node tools/runs.mjs --boss --theme ember --bossid cinder --level 50 --party paladin,archer,cleric,twinfang`;
the campaign reaches the Ember Deep's boss with four heroes at about level 50):
| | won | fight length |
|---|---|---|
| 10 fights, level 50 (health 1200) | 4 of 10 | avg 177 s |
| (health 1400, before parts ignored statuses) | 6 of 10 | avg 209 s |
Swingy from 4 to 6 of 10 on small changes; the knobs are health, the scorch's tick damage and the fire call's count.

## After main's round-10 balance pass (armour, cooldowns x1.22, poison's burst, 52 heroes)
Re-measured, not retuned (the lead tunes hero numbers first): level 50: won 5 of 10, avg 182 s. Same command as above.

Round 12 (lane D): health 1200 to 1150 (the Ember Deep went from x5.4 to x4.0). The campaign meets it with the starter four (paladin, archer, cleric, twinfang) at about level 43: `--level 43 --n 20` won 8 of 20, wins about 170 s.
