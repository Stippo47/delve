# The tumble troll: a troll that rides its boulder (round 19c, lane rider19)

The designer, word for word: "It would be fun if you made a troll variant that can walk on the boulders like the farmer
on hay."

Clips are in docs/clips/rider19/ (not in git). Scenes: tools/rider19/stage.js, filmed with tools/rider19/clip.sh (port
8978). Seconds are clip time. Numbers: tools/rider19/winrate.mjs (a copy of troll19's) and tools/rider19/probe.mjs.

## What was asked, and where to see it

**"a troll variant that can walk on the boulders like the farmer on hay"**: the **Tumble Troll** (kind `tumbleTroll`).
It stands up on a troll's boulder and walks it along under its feet, like a log-roller; the boulder rolls (the
boulder19 rolling texture and dirt trail), the troll stays on top, a little lifted (like the Haymaker on his bale).

- `cross.mp4` (camera follows it): 0:00-0:02 it rides across the room, the ball rolling under it, its feet stepping on
  the top, arms out wide; 0:02.5 it runs the paladin down and throws him; it rolls on through, swings round in an arc
  and comes back; 0:05 a second pass.
- `line.mp4`: four heroes in a row down its way. 0:01 it hits the first, 0:02 the next ones; then it rolls out of the
  pile for a run-up and comes back. Honest note: the paladin and the tower are heavy and shielded, so they only go about
  half a body width; a packed line slows the ball down a lot. Light heroes (archer, cleric) fly.
- `wall.mp4`: 0:02 it runs the paladin down near the left wall, rolls on, 0:03 hits the wall: dust, a crack, a bounce;
  0:03-0:04.5 it teeters on top with its arms windmilling (the ball dead still under it), 0:05.5 it rolls off again.
- `break.mp4`: its ball starts nearly broken (40 health) against three heroes who hurt. 0:02.5 the ball bursts under it
  (the troll boulder's burst); it is thrown off forwards and drops to the floor, stunned a moment; 0:03 on it fights on
  foot with its long arms.
- `fight.mp4`: one whole fight, nothing staged (Warren arena, paladin + archer + cleric), camera following it: passes
  through the party 0:00-0:20, its ball breaks at about 0:23, then it brawls on foot by the top wall (the clip ends at
  0:32 before the fight does).
- `art.png`: the picture, full size.

## The design (all my calls)

- **Name**: Tumble Troll. Book: "Learned to ride the boulder the day it got tired of pushing it. Has not walked
  anywhere since." / "Stands up on its boulder and walks it along under its feet, rolling through you and coming round
  for another pass; it throws whoever it hits. A wall stops it dead and it teeters. Break the boulder and it falls off
  and fights on foot." Elite move: "Rolls faster and turns sharper."
- **Look** (art/enemies/tumble-troll.svg, new, in the troll's style: same gradients, shading and drop shadows; not a
  recolour): a lean, gangly troll where the troll is a hunched heap. Long arms thrown out wide to the sides for balance
  with big open three-fingered hands and rope wraps at the wrists; a narrow back with the troll family's moss tufts down
  the spine and a rope slung across it; a small head with long pointed ears swept back and the long drooping troll nose;
  a braided topknot down its back; big splayed flat feet as their own parts. Olive-moss skin.
- **On the ball, animated** (js/tumble.js `ART2.tumbleTroll`): the feet walk the top, one forward as the other pushes
  back, one step every 44 units the ball rolls (faster as it goes; they shuffle when it stands); arms rock for balance
  and swing out against a turn; it leans into turns; the braid swings; after a wall crash the arms windmill and the body
  wobbles. Thrown off, it drops from the ball's height to the floor with its arms flung up.
- **Steering**: it rolls at its mark (aiming a little ahead of where they are walking), up to 205 a second (a troll walks
  46, a bowled boulder leaves at 400). It turns 1.55 rad/s at full pace, up to 4.2 at a stand, and brakes (leans back)
  when its mark is well off its line, so it makes wide quick arcs. Round walls it takes the boulder's path finder.
- **Into heroes**: the ball strikes them with the trolls' own boulder blow (foes9.js boulderHits: thrown by weight, off
  their feet a moment, dust, sparks, shake, boom), 9 damage, thrown well out to the side (out of its lane, so it rolls on
  through). The rider stays up: nobody shoves it up there. Each body takes some of the ball's speed. After it has run
  somebody down it rolls straight on for 0.7 s before it turns (a joust, not a pivot on top of them); bogged down slow
  among them, it rolls out for a run-up and comes round. The same body is struck again only after 0.9 s.
- **Walls**: grazing a wall it slides along it. Into one faster than 80 (its pace square to the wall), the ball stops
  dead with a crack and bounces back a hair, loses up to a tenth of its health, and the troll teeters 0.9 s, can't
  steer, the ball still: the party's moment. A hero with his back to a wall stops it too (shorter teeter, 0.45 s).
- **Broken under it**: thrown off forwards, stunned 0.8 s, then on foot for good (a broken boulder stays broken, as the
  troll's). On foot it is quick and scrappy: speed 64 (troll 46), long-armed swings, 10 damage. I chose "fights on foot"
  over "flees": fleeing drags fights out in an autobattler.
- **Hop off**: never by choice; the ball is the whole of it. Stunned, frozen or asleep it stays up and the ball rolls on
  and slows; terrified, it freezes up there. Wedged in a slot too narrow, the ball gives and it falls off.
- **Health**: the troll 115 (a troll 155), the ball 0.7 of the troll's own (0.95 for an elite or major, which fell
  behind the troll's otherwise). Shots at the rider are let fly and strike the ball first (it stands on it), so archers
  break the ball; a fighter at the ball's side can reach the troll over it, or hits the ball. Prices.js: cost 8 (as the
  troll), hp and hit x1.1.
- **Where**: The Pit (the Warren's third floor) beside the troll and rock troll, weight 0.9 (troll 1.3, rock troll 1).

## Fairness (tools/rider19/winrate.mjs, 360 fights a row, the same parties and levels as troll19/troll19b)

| the trolls' side won | troll | tumble troll |
|---|---|---|
| plain (level 5) | 13% | 19% |
| elite (level 9) | 68% | 57% |
| major (level 14) | 70% | 68% |

(troll19b's band: rock troll 11 / 63 / 64, yeti 48.) Fights with it are shorter: 36 to 49 s, the troll's 62 to 89 s.
Full output: tools/rider19/winrate-after.txt.

## Shared code touched (marked `round 19, lane rider19`)

- js/foes9.js: `boulderOf`, `breakBoulder`, `boulderWay`, `boulderHits` exported; `boulderHits` takes optional numbers
  (o: full, dmg, stagger, min, side). Trolls, rock trolls and yetis call it as before (no o): unchanged.
- js/boulders.js: a ridden ball counts as its rider's own (`b.rider`), and `b.afterPass` puts the rider back on top
  after everything has moved.
- js/sim.js: `ownBoulder` knows `p.rider`; `blocked` lets a shot at a tumble troll fly (it then strikes the ball).
- js/enemies.js, js/prices.js, js/themes.js, js/tags.js (blunt), js/bestiary.js, js/movetext.js: the new kind's entries.
  (tools/move-text.mjs rewrote troll19b's rock troll line; I put the hand-written one back.)

**New files the game loads: js/tumble.js and art/enemies/tumble-troll.svg** (sw.js needs tools/build-sw.py; not run).

## Checks

- node --check on every js file: clean. preview-check: 0 / 0 / 0. battles: **538** (535 + the new kind's 3), 0
  problems, 9 out of time.
- tools/runs.mjs, the Warren's floor 3 with only this kind, level 9 party: 0/3 won, as with only trolls (0/3).

## Still looks off / open

- At the default zoom the rider is small on the phone; the feet show beside the body but the step reads best in the
  close clips (cross, wall). Bigger would cover its ball.
- The ball's bar and the troll's bar stack above it (two red bars). Correct but busy.
- Heavy shielded heroes (paladin, tower) are only knocked about half a body width; the ball's blow is the trolls' own.
- Its wall crash needs room for a run-up: in a cramped fight it mostly grazes walls.
