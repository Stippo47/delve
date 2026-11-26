# The trolls' bowl: more often, further, a wind-up, a heavy blow, boulders with health (round 19, lane troll19b)

The designer, round 19, chat, after seeing 0.41.0 (lane troll19's solid boulders):

"Also the troll should fight back while going to boulder. And yes they should bowl more often.
Boulder should go further and start a bit faster. Should show a charge up animation.
Boulder should have hp and can be destroyed and targeted.idk why spikes come out when the boulder is bowled. They should
back away from enemies to a min distance before the bowl otherwise they will charge forwards still holding the boulder.
Boulder should do heavy knockback. Currently it just barely knocks things to the side. There no strong impact. Rock
troll should have a huge boulder and the boulder comes back to them."

Clips are in docs/clips/troll19b/ (not in git). Every pair is the same battle, seed, staging and camera, filmed on the
tree as it was at 0.41.0 (`before-`) and on this branch (`after-`): tools/troll19b/film-all.sh; the scenes are
tools/troll19b/stage.js. The staged hero is a paladin, harmless and very tough unless the scene says otherwise. Seconds
are clip time. The numbers are tools/troll19b/bowls.mjs over the same scenes (12 seeds of 30 s; bowls-before.txt /
bowls-after.txt), the same file run on both trees.

The branch has main merged in as far as 0.43.0 (lane physics19's eased separation), as the lead asked: the "after"
clips and numbers are with it; "before" is 0.41.0.

## What was asked, and where to see it

1. **"Also the troll should fight back while going to boulder."** On its way to its boulder it stops for anyone in
   reach of its fists: one blow (the troll's ordinary blow, its wind-up and all), then on. It never spends more than
   0.9 s over one blow, and walks at least 1.2 s before the next. `after-fetch-troll.mp4` 0:01 and 0:03 (two blows on
   the paladin beside its way, then it has its boulder at 0:04) against `before-fetch-troll.mp4` 0:00-0:03 (it walks
   past him). Blows struck with no boulder in its fists, staged: 0 a minute before, 9 to 23 after. The rock troll does
   the same while its boulder is out. The yeti too, on its way to its ball.
2. **"And yes they should bowl more often."** The wait is 1.4 to 2 s from the moment it has the boulder in its fists
   again (it was 5 to 7 s from the last bowl, and troll19's 3 s standing with the boulder against its mark is gone: it
   never stands there now). And it gets its boulder back sooner: it hurries after it (twice its walking pace). Bowls a
   minute, staged: troll 7.3 to 8.3 before, 9.2 to 13.0 after; rock troll 5.5 to 7.0 before, 8.2 to 10.5 after.
   `after-bowl-troll.mp4` (three bowls: 0:01, 0:07, 0:13) against `before-bowl-troll.mp4` (two: 0:01, 0:12).
3. **"Boulder should go further and start a bit faster."** It leaves at 400 (was 320; the rock troll's 420, was 360) and
   slows more slowly: with nobody in its way it rolls about 650 before it lies still (was 350), and it still hurts for
   the first 480 of that (was 230). Through a hero it goes on about 320 to 390 (was 330, with far less of a blow).
   `after-stand-troll.mp4` 0:01-0:03 against `before-stand-troll.mp4`; a miss rolling right across the room:
   `after-live-troll.mp4`.
4. **"Should show a charge up animation."** 0.7 s before every bowl (it was a 0.45 s shuffle): the line shows on the
   floor, the troll steps back and rears, its fists drawn in, the boulder hauled against its chest, shaking, swelling a
   tenth and paling, grit flying up from under it; then it lunges after the boulder and the floor behind goes up in
   dust. `after-stand-troll.mp4` 0:00-0:01 (and every bowl in every after clip).
5. **"Boulder should have hp and can be destroyed and targeted."** Every boulder has health now, and so has the yeti's
   ball. Anything that hurts a unit hurts it: swings, shots, blasts, abilities. It shows the same health bar as any
   foe once it is hurt (the picked style; nothing with Health bars off), flashes when struck, cracks at two thirds and
   one third, and bursts into rock and dust when it breaks. Who goes for it: a fighter whose enemy is behind it, when
   the boulder is within a few steps and the enemy is out of his reach; a shooter when the troll is holding it up on
   his line of fire, in range. Nobody goes out of his way for a boulder lying to one side, and anything else in the
   fight comes first. (A swing or a blast meant for somebody else still hurts it if it is in the way.) Health: a
   troll's boulder a quarter of the troll's own (so it grows with the troll); the rock troll's seven tenths of the rock
   troll's. Broken: the troll fights bare-handed for the rest of the fight, as before; the rock troll, bare-handed for
   7 s, then tears a new one out of the floor (the stoop it already had). `after-break-troll.mp4` (three heroes that do
   hurt: the paladin and the berserker go at the boulder between them and the troll, it cracks, breaks at about 0:1x,
   and the troll goes on with its fists) against `before-break-troll.mp4` (only the archer's arrows chip it).
   `after-break-rocktroll.mp4`: the rock troll's (it starts the clip at half health so the whole thing fits): it
   breaks, the rock troll fights bare-handed, stoops and comes up with a new one.
6. **"idk why spikes come out when the boulder is bowled."** Found by filming a bowl and going through it frame by
   frame: `before-near-troll.mp4` 0:01 (and `before-bowl-troll.mp4` 0:01 and 0:12). The red line on the floor before a
   bowl was a danger zone of the game's "bone" kind with no blow of its own, and every danger zone "strikes" when its
   time runs out: for the bone kind the strike is drawn as a row of white bone spikes along the whole zone. So the
   moment the boulder left, spikes shot up along the line it was about to roll down. They did no harm; they were
   never meant to be there. The line only warns now (as the yeti's always did): no strike, no spikes, no strike
   sound. The rock troll's charge line did the same and is fixed the same way. `after-near-troll.mp4` 0:01.
7. **"They should back away from enemies to a min distance before the bowl otherwise they will charge forwards still
   holding the boulder."** With an enemy in bowling range it no longer walks the boulder on into them. It stands off,
   turning the boulder at them; if they are nearer than 120 (boulder to body) it backs away first, dragging the
   boulder, at one and a half times its walk, for at most 1.3 s (or until something at its back stops it), and then
   bowls. Room at the moment it lets go, staged: 0 before in every scene; after, 158 against a hero who stays put, 71
   against one who keeps coming at it (he walks faster than it backs). Seconds a minute spent holding the boulder
   against the hero: 14 to 18 before, 0.3 to 6 after. `after-near-troll.mp4` 0:00-0:01 against `before-near-troll.mp4`
   (0:06 to the end: it stands with the boulder pressed to him).
8. **"Boulder should do heavy knockback. Currently it just barely knocks things to the side. There no strong impact."**
   It knocked everybody 420, half of it sideways: a paladin went about 50. Now it throws them on down its way (a
   little to the side they were on, so they land clear of it), by their weight: an archer about 210 (was 130), a paladin
   about 140 (was 70; a raised shield takes a fifth of it, not two fifths). A hero who cannot be shoved at that moment
   (the Berserker in his rage) still isn't. They are off their feet for a fifth
   of a second. The impact: a burst of dust and grit where it struck, sparks, the room shakes, a hair of hit-stop, and
   the game's boom. Walls stop a thrown body like any knocked body (and hurt it, as they always have). `after-stand-archer.mp4` (an archer, rooted, 0:0x) against
   `before-stand-archer.mp4`; `after-stand-troll.mp4` 0:02.
9. **"Rock troll should have a huge boulder and the boulder comes back to them."** Its boulder is 54 across the half
   (the troll's is 41): a third wider, three quarters more of it, about as wide as the rock troll itself. After every
   bowl it rolls back to the rock troll by itself, wherever the troll has got to (once it has slowed, 1.3 s after it
   struck somebody, or 2.4 s out); the rock troll does not walk after it, it fights with its fists until the boulder
   is back in them. Back in its fists 2.0 to 2.3 s after it let go (4.1 to 4.6 s before, on foot). If something keeps
   it from coming back for 5 s (a wall between them) the troll fetches it on foot as a troll does. On its way home it
   only shoulders people aside; the elite's hurts them again (less). `after-stand-rocktroll.mp4`,
   `after-bowl-rocktroll.mp4` against the `before-` pair.

## The yeti (it shares the shape: what fits, and what was left)

- **Applied**: its ball has health and a body like the boulders (swings and abilities hurt it now, not only shots and
  blasts; 70 where it had 50; the same rule for who goes for it; it already cracked and burst). The ball's blow throws
  people the same way (a paladin 58 to 67 before, 95 to 100 after), with a burst of snow and a shake. It hits back on
  its way to its ball. `after-bowl-yeti.mp4` against `before-bowl-yeti.mp4`; `after-live-yeti.mp4`.
- **Left as it was**: how often it heaves, how fast and how far (it already runs up behind the ball before it lets go,
  which is its wind-up; its ball bursts on walls, so "further" is the wrong way for it); it packs a new ball itself,
  so nothing comes back to it; it already left its ball to fight whoever is at its side.
- It heaves a little less often than it did when a hero stands right by it (4.7 to 5.7 a minute, was 5.2 to 8.7),
  because it now stops to hit him.

## What else was done

- **A boulder's health is a unit that sits on it** (js/boulders.js `giveBody`; kinds `boulderBody`, `snowBody`). That
  is why everything in the game that can hurt a unit hurts a boulder with no list of exceptions to keep. It draws
  nothing, pushes nobody, takes no status and no shove, can't be charmed or dragged, never counts as a foe left
  standing, a kill, a friend to heal, or a body in the Book; it is gone with the boulder or its owner.
- **A boulder that hits somebody loses a tenth to three tenths of its speed** (more off a heavy body) and rolls on.
- **The rock troll's run behind its boulder** is rarer (15% of its bowls, was 40%), only from further off, and at the
  end of the run it lets the boulder go on ahead instead of stopping with it in its fists.
- **Elite and major rock trolls' boulders** are 66 and 80 (they were 64 and 79): they grow a little less than the
  troll does, because a major's boulder grown in step with it (92) fitted few gaps.
- **Two faults found by the tests and fixed**: a troll could snatch at a boulder from further off than it can hold it
  (taken up and lost again every few steps, for a minute: now it has to be near enough to hold); a big boulder dragged
  on into a slot too narrow for it lay in the wall (wedged for more than half a second it now crumbles and the troll
  tears up a new one, round 17's rule).
- **A body found deep inside a boulder eases out of it** over a few steps instead of being thrown a boulder's width in
  one (the lead's note after lane physics19: the same rule that lane gave rocks, js/layers.js `softRock`). What is new
  of an overlap each step is still put right at once, so nothing gets through a boulder. It matters where a boulder
  arrives on top of somebody: a new one torn up under a hero, one caught back into its troll's fists.
- **Fair fights**: see Strength below. The troll has 155 health (was 170) and its fists do 13 (were 16); the rock
  troll 172 (was 190) and the same fists; the bowl itself does 6 and 7 (was 14 and 18) and staggers less.

## Numbers

**The bowl (tools/troll19b/bowls.mjs).** Ranges are over the staged scenes (a hero walking at it, standing 460 off,
standing right in front of it, standing by its way to its boulder).

| | troll, before | troll, after | rock troll, before | rock troll, after |
|---|---|---|---|---|
| bowls a minute | 7.3 to 8.3 | 9.2 to 13.0 | 5.5 to 7.0 | 8.2 to 10.5 |
| speed as it leaves | 315 | 396 | 355 | 414 to 424 |
| rolls, nobody in its way | about 350 | about 650 | about 390 | about 500, then home |
| rolls, through the hero | 330 to 336 | 322 to 393 | 379 to 383 | 261 to 334, then home |
| room when it lets go (hero staying put) | 0 | 158 | 0 | 199 to 233 |
| room when it lets go (hero coming at it) | 0 | 71 | 0 | 47 |
| seconds a minute holding the boulder against him | 14.0 to 17.7 | 0.3 to 5.8 | 13.5 to 21.3 | 0.8 to 6.5 |
| a paladin struck is thrown (the first blow of a run) | 68 | 138 | 75 | 143 |
| an archer struck is thrown (the same) | 127 | 210 | 133 | 217 |
| back in its fists after | 3.4 to 4.0 s | 2.2 to 4.4 s | 4.1 to 4.6 s | 2.0 to 2.3 s |
| fist blows a minute while it has no boulder | 0 (6 with heroes hitting it) | 9 to 23 | 0 | 1.5 to 12 |

**Strength (tools/troll19/winrate.mjs; tools/troll19b/winrate-after.txt against tools/troll19/winrate-after.txt, which
is 0.41.0).** Plain battle rooms, no staging: each kind, one, two and three of it, against three hero parties
(levels 5 / 9 / 14 for plain / elite / major), 180 fights a kind.

| the trolls' side won | 0.41.0 | this branch | a fight lasted, 0.41.0 | this branch |
|---|---|---|---|---|
| troll | 14 (8%) | 22 (12%) | 70 s | 61 s |
| rock troll | 12 (7%) | 21 (12%) | 93 s | 108 s |
| yeti | 79 (44%) | 87 (48%) | 61 s | 63 s |
| elite troll | 112 (62%) | 123 (68%) | 72 s | 71 s |
| elite rock troll | 103 (57%) | 106 (59%) | 133 s | 146 s |
| elite yeti | 164 (91%) | 164 (91%) | 50 s | 48 s |
| major troll | 133 (74%) | 127 (71%) | 71 s | 90 s |
| major rock troll | 117 (65%) | 119 (66%) | 122 s | 142 s |
| major yeti | 173 (96%) | 166 (92%) | 44 s | 50 s |
| all | 907 of 1,620 (56.0%) | 935 (57.7%) | | |

How it got there. With the bowl changes alone (and the old health, fists and 14 / 18 bowl damage) the trolls' side won
far more: troll 24%, elite troll 82%, elite rock troll 69%, major rock troll 80%. Turning single things off showed no
one cause: heavier knock about 3 to 6 points, bowling more often up to 12 for the rock troll, hitting back on the way
about 3, heroes spending blows on the boulder a few; even with the bowl doing no damage at all the elite troll won
76%. So the trim is spread: the bowl's own damage down (it is a shove now, and walls do the rest), its stagger down
(50 to 30: three bowls in a row no longer stun for seconds), the boulder's health kept modest, and the two trolls a
little down in health and fists. The plain troll and rock troll still win a little more often than they did
(12%, were 8% and 7%): left there, they were the weakest of the nine.

**Walls, the room's edge (tools/troll19/walls.mjs; tools/troll19b/walls-after.txt).** The same 504 staged runs, 648
fights in walled rooms, 36 dungeon runs and the wagon mode as lane troll19.

| | staged | walled fights | dungeon runs | wagon |
|---|---|---|---|---|
| a body's middle inside a wall, or outside the room (by a boulder or not) | 0 | 0 | 0 | 0 |
| a body more than a third inside a wall (by a boulder or not) | 0 | 0 | 0 | 0 |
| a boulder's middle in a wall or outside the room | 0 | 0 | 0 | 0 |
| a boulder more than 8 into a wall | 0 | 4 times, a step each (1 at 0.41.0) | 0 | 0 |
| a body more than 14 inside a boulder not its own | 4 times (0) | 690 times, 0.3 s each (134) | 17 (2) | 56 (2, in 8 trips; 12 now) |
| a troll more than 14 inside its own boulder | 0 | 439 times, 0.18 s each (247) | 4 (3) | 4 |
| stuck 15 s | 0 | 8: yetis 5, elite troll 1, major troll 2 (18) | 1, a yeti (1) | 2 (0) |

The fourth and fifth rows are the cost of two things, both deliberate. Bigger and busier boulders: twice the bowls,
the rock troll's a third wider, a new one torn up after each break. And the easing: the same walled fights with this
lane's easing switched off give a body inside a boulder 0 times for the troll (16 with it), 7 for the rock troll (42),
109 for its major (219): what the easing adds is the half second a hero now takes to slide out from under a boulder
torn up where he stands, where he used to be thrown clear in one step.

**Carried on the boulder's front (tools/troll19/glue.mjs; glue-after.txt).** A hero standing still in its way, 10 s:
carried 0.4 s and 43 far at 0.41.0 (troll), 0.1 s and 9 now; rock troll 0.5 s and 59, now 0.0 s and 3; elite rock
troll 0.7 s and 88, now 0.1 s and 11; yeti 0.4 s and 52, now 0.4 s and 67. In fights, seconds carried a minute: troll
2.4 then, 0.6 now; rock troll 2.8, 0.6; elite rock troll 5.9, 1.1; yeti 1.0, 0.7. Longest stretch anywhere 2.0 s
then, 0.8 s now.

**Getting its boulder back (round 17's test, tools/foes17/boulders.mjs; fetch-after.txt).** Staged: every spot back
within 6 s for the trolls, as before (the ring of rocks: a new boulder, as before). In fights: troll, taken up again
within 6 s 179 of 180 (134 of 134 at 0.41.0; it rolls further now), mean 3.8 s; rock troll 193 of 193, mean 2.2 s
(was 4.1 s); elite rock troll 204 of 205, mean 1.9 s; yeti 119 of 141 (was 155 of 196).

**Checks.** `node --check` on every js file: clean (it does not see a name declared twice in a module; the tools,
which load the modules, do). `node tools/preview-check.mjs`: threw 0 / never fired 0 / not offered 0.
`node tools/battles.mjs`: 535 battles, 0 problems, 8 ran out of time (535 is what 0.41.0 and main give too; COMMON's
532 is older).

## Clips (docs/clips/troll19b/)

| what | before | after |
|---|---|---|
| **A hero walking at it**, 16 s | `before-bowl-troll.mp4`: two bowls (0:01, 0:12, spikes both times); 0:05-0:11 it holds the boulder against him | `after-bowl-troll.mp4`: three bowls (0:01, 0:07, 0:13), each with its wind-up and a thrown paladin; fists at 0:03 and 0:09 on its way to the boulder |
| **A hero right in front of it** | `before-near-troll.mp4`: 0:01 the bowl and the spikes; 0:06 on, pressed against him | `after-near-troll.mp4`: 0:00-0:01 it backs off, 0:01 winds up, 0:02 the blow; again at 0:06 |
| **A hero standing 460 off** | `before-stand-troll.mp4` | `after-stand-troll.mp4`: STAND_NOTE |
| **An archer struck** (light, no shield) | `before-stand-archer.mp4` | `after-stand-archer.mp4`: ARCHER_NOTE |
| **Fists on the way to its boulder** | `before-fetch-troll.mp4`: walks past the paladin | `after-fetch-troll.mp4`: 0:01 and 0:03, then the boulder at 0:04 |
| **The boulder's health** (three heroes that hurt) | `before-break-troll.mp4` | `after-break-troll.mp4`: BREAK_NOTE |
| **Rock troll**, a hero walking at it | `before-bowl-rocktroll.mp4` | `after-bowl-rocktroll.mp4`: ROCKBOWL_NOTE |
| **Rock troll**, a hero standing off | `before-stand-rocktroll.mp4` | `after-stand-rocktroll.mp4`: ROCKSTAND_NOTE |
| **Rock troll's boulder broken, and the new one** | `before-break-rocktroll.mp4` (it can't be hurt) | `after-break-rocktroll.mp4`: ROCKBREAK_NOTE |
| **Yeti** | `before-bowl-yeti.mp4` | `after-bowl-yeti.mp4`: YETI_NOTE |
| **Whole fights** against a paladin and an archer, 20 s | `before-live-troll.mp4`, `before-live-rocktroll.mp4`, `before-live-yeti.mp4` | `after-live-troll.mp4`, `after-live-rocktroll.mp4`, `after-live-yeti.mp4` |

## Calls made (say if any is wrong)

1. **The troll's broken boulder stays broken** (it fights bare-handed for the rest of the fight, round 9's rule); the
   rock troll tears up a new one after 7 s, because the boulder is all it has. The other way for the troll: a new one
   after a while too. My pick: as it is; breaking the troll's boulder should be worth doing.
2. **Who goes for a boulder**: only whoever it stands in the way of (above). The other ways: everybody treats it as
   one more enemy (heroes waste a lot on it: with unbreakable boulders in the way the plain troll won 29%), or nobody
   aims at it and only stray blows hurt it. My pick: as it is.
3. **How far a struck body flies**: an archer about 210 (was 130), a paladin about 140 (was 70), measured on the
   first blow of each staged run. One number (`BOWL.knock`). I stopped there because of the walls: Walls hurt a
   body thrown into them, as they always have, more the harder it is thrown (that is most of a bowl's damage now), and
   an archer bowled point blank against a wall already takes about 60 from it. Say if it should be more all the same.
4. **The rock troll's run behind its boulder is kept, rare** (15%), and it lets the boulder go at the end. Your "they
   will charge forwards still holding the boulder" may have meant this move as much as the walking-in; if so it is one
   number to take out (`BOWL.charge` 0).
5. **The troll hurries after its boulder** (twice its walk). Without it, a boulder that goes further means a troll
   that bowls less often.
6. **Health and fists a little down** for the troll and rock troll, the bowl's own damage well down (Strength).
7. **A boulder that strikes somebody rolls on**, a little slower. I had it stop dead on whoever it hit (all its speed
   into the blow); it then went less far than before whenever it hit, which is the opposite of what you asked.
8. **In battle mode a boulder carries a health bar from the start and a ring in its side's colour**, like every unit
   there. In dungeon rooms the bar shows only once it is hurt, like any foe's.
9. **Bodies ease out of a boulder that lands on them** (above), rather than jump.

## Not done, and what still looks off

- **Against a hero who keeps walking at it the troll never gets its full room**: it backs at 69 a second and a paladin
  walks at 48 into it, so it gains little in 1.3 s and bowls from about 70. The blow then makes the room.
- **A paladin behind his shield** is thrown the least of anyone (about 140); most of the staged clips use him.
  `after-stand-archer.mp4` shows a light body.
- **The wind-up is carried by the boulder** (it pales, swells, shakes) and the troll's step back; the troll's own lean
  is small at game size. No mark over its head.
- **No new sounds**: the impact and the break use the game's own boom (a blast), a struck boulder the bone knock, a
  struck snowball the slime thump. A proper stone thud would be better.
- **A troll or a hero can overlap a boulder for a moment**, five times as often as at 0.41.0 in the cramped test rooms
  (690 times in 648 fights, a third of a second each; the majors' boulders are half of it), 17 times in 36 dungeon
  runs (was 2). Never a wall. See the table above for where it comes from.
- **One run of the walled test rooms**, with numbers since changed, had an elite troll's own body a third into a wall
  for a long stretch (12,258 steps, no boulder near). I could not make it happen again in three more runs of the same
  rooms (0, 6 and 0 steps); 0.41.0 had 110 such steps, and the tree before lane troll19 21,449. Not explained.
- **The staged doorway** for the elite yeti: once in 12 runs its ball (grown as it rolls) was in the doorway's mouth,
  no deeper in a wall than the test allows. Not looked into.
- **Heroes do not yet dodge better for the longer warning** than any danger line makes them; a rooted or stunned hero
  takes it full.
- **The Book's pages** for the troll, rock troll and yeti: checked only by the preview test (they run), not rewritten;
  their words may want a line about the boulder's health.
- **js/boulders.js** was already loaded; no new file the game loads. sw.js not rebuilt, the version not bumped.

## Try it

- `bash tools/troll19b/serve.sh` (port 8976), then `bash tools/troll19b/clip.sh after-x troll bowl` (scene: bowl,
  near, stand, fetch, break, live; kind: troll, rockTroll, yeti, with @1 elite or @2 major; then seconds, zoom,
  camera, the heroes).
- Battle mode: Troll, Rock Troll or Yeti against anyone. Health bars: Settings, Health bars (?hpbars=0).
- The feel is the numbers in js/foes9.js `BOWL` (each one explained above it): `cd` / `cdRock` how soon it bowls again,
  `speed`, `fric` how far, `wind` the wind-up, `min` / `back` the backing off, `knock` how far people fly, `hp` /
  `hpRock` the boulder's health, `rockR` the rock troll's boulder, `ret` its way home, `charge` the rock troll's run,
  `fetch` the troll's hurry. A test can set them: `globalThis.BOWL19 = { knock: 600 }` before the game loads.
- Tests: `node tools/troll19b/bowls.mjs` (the table above); lane troll19's `walls.mjs`, `glue.mjs`, `winrate.mjs`;
  round 17's `node tools/foes17/boulders.mjs`.
