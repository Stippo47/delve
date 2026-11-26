# Lane corpses19 (round 19b): bodies never pushed, drawn under everything

The designer, round 19, chat, word for word: **"Also corpses should not collide or render ontop of anything"**

Branch `corpses19`. Clips in `docs/clips/corpses19/` (each scene filmed twice, same seed and staging: `-before` is the
game as the branch started, `-after` this branch). Tools in `tools/corpses19/`.

## Every kind of dead body (what I found)

| Body | Where it lives | How it was drawn | Collisions it had |
|---|---|---|---|
| Corpse: anything that dies and isn't a summon or `noCorpse` (each of the Mob's four bodies; bosses without their own death picture: the Bone King, Chieftain, Gilded Seraph, Elder Ent...) | `w.corpses`, sim.js killNow | after pillars, crates, pickups, shadows, side rings: over all of them, under the units | pillars (rocks, barrels, room pillars), **troll boulders and yeti balls** (plowed along), crates and raised walls shoved it out, **even lying still** |
| A hero that bled out in a battle (round 18) | `w.corpses`, sim.js bleedOut | the same | the same |
| Downed hero (dungeon, wagon road, battle) | `w.units`, `u.downed` | first among the units: over pillars, boulders, crates, pickups, shadows; its own round shadow under it; the battle's bleed-out ring and the road's ring drawn **over everything** | a raised wall shoved it out (sim.js wallRect); nothing else (physics, steering, shots, blasts already skipped the downed) |
| Sand Wurm's rings | boss-wurm-fx.js `wurmChunk` | **over the units** the whole 1.5 s while they lay sinking | none (a picture) |
| Great Engine's dome and cog | boss-engine-fx.js `engineWreck` | **over the units** while they lay rolling, 1.6 s | none |
| Cinder Drake's husk | boss-cinder-fx.js `drakeDie` | already on the floor layer, under everything | none |
| Old Longlegs, Canopy Idol | `spDeath`, `idDeath` | over while falling, on the floor once down (already right) | none |
| Gilded Seraph's hoops, Great Ooze's splat | `angelFall`, `oozeSplat` | already on the floor; feathers and gobs fly over | none |
| Bone King's remains | `w.remains`, scenery.js | floor layer (already right) | none |
| Summons, slimes, Foundry machines | no body (a puff, a burst) | | |

## "corpses should not collide"

What I did (all in `js/sim.js`, two small marked edits, nowhere near the troll code):
- **A body lying still is never moved by anything.** Rocks, barrels and crates used to shove a body out of them every
  step, even one lying still; a rolling troll boulder or yeti ball plowed bodies along in front of it.
- **Nothing that moves ever pushes a body**: a troll's boulder and a yeti's ball roll over it (they are skipped
  entirely); a wall raised on a body, or on a downed hero, stands over it (it used to shove both out).
- A body **still flying or sliding** from its killing blow stops against things that stand still (the room's walls,
  rocks, barrels, crates), the way it always did, so it never lands inside a crate or a rock and vanishes under it.
  Once it lies still, nothing moves it again. (My first try let thrown bodies fly through everything: they landed
  inside crates and disappeared under them. That is the open call below.)
- Units never collided with bodies (sim.js physics skips the dead and the downed), steering, A* paths and line of sight
  only see walls and pillars, shots and blasts only hit the living. I measured all of it rather than trusting the code.

The headless count, `node tools/corpses19/check.mjs` (`check-before.txt`, `check-after.txt`): 28 real battle setups x 4
seeds (villagers 12 v 12, goblins v skeletons, the Necromancer, trolls, yetis, bombers, heroes going down, the Mob and
the Telekinetic, 12 mixed hero fights with all 60 heroes) and a dungeon run in each of the 9 lands, 656 bodies and 432
downed heroes, every step compared with how the body's own throw moves it:
- **before: 998 pushes** (troll boulders 471, yeti balls 185, bodies lying still shoved by pillars 174, ...);
  staged: a boulder rolled through 2 bodies and a downed knight moved the bodies 433 units, a wall raised on a body and
  a downed hero moved them 96.
- **after: 0.** Staged: the boulder moves them 0, the wall 0; a villager walking through 3 bodies and a downed hero
  keeps the same line and time as with nothing there (2.6 off its line, 2.50 s, both); 10 of 10 arrows shot across
  bodies reach the target behind; a blast beside them moves them 0 and stores no knock.
- Kept on purpose (counted apart): a thrown body stopped by something standing still (the room's edge 351, rocks and
  barrels 565, crates 6, stone walls 19), and the Poltergeist's throw (4: a trait that throws a fresh body at an enemy,
  the body is the attack).

Downed heroes: my call is **yes, "corpse" covers them**. They were already never pushed or pushing in the sim, except
by a raised wall (fixed). They draw with the bodies, under everything. Revives still work: a reviver can stand right on
them (nothing keeps it off). One exception kept: on the wagon road the wagon still shoulders a downed hero aside as it
rolls over where they fell (convoy.js rigTick), because under the wagon nobody could stand over them to revive them.

## "or render ontop of anything"

`js/render.js` drawScene, a new layer `drawBodies`, right after the floor picture, before anything else:
1. every body that has landed (a body still in the air from its killing blow is drawn **after the units**, over what
   stands on the floor, until it lands: the designer's own round-19 rule for anything in the air, and the lead's "a
   death animation in progress may stay on top until it lands"; before, a flying body slid under the living);
2. the downed, each with its side's thin ring under it in a battle, nearest the top of the screen first;
3. the ring round the downed (the battle's bleed-out ring, battle.js; the wagon road's left-behind ring, convoy.js),
   through a new hook `w.drawBodies`. Both rings used to be drawn over everything.
Everything else is laid over the bodies: doors, raised walls, puddles, blood, danger marks, ability zones, the shadows,
pickups, rocks, boulders, crates, the side rings, the living, every effect. A downed hero no longer casts a round shadow
(a body lying on the floor doesn't; its shadow would now lie over it). The Life Drain beam's "draw the target again
over the beam" skips a downed target.
Boss deaths: the Sand Wurm's rings are drawn over the units only while they drop, and lie on the floor layer once down
(`js/boss-wurm-fx.js`); the Great Engine's dome and cog lie on the floor layer, its plates and bolts still fly over
(`js/boss-engine-fx.js`). The drake's husk, Old Longlegs, the Idol, the Seraph and the Ooze were already right.

Puddles and blood (the lead let me pick): **over the bodies**. The bodies go down first, on the bare floor, so a body
lies in the oil, the fire, the gas, the blood: the fire's standing flames and the gas cloud belong over it, and
danger marks and ability zones stay readable. The cost, plain in `puddles-after.mp4` at 1.5 s on: a body that lands in
the middle of the oil slick is hidden by it while the slick lasts (before, it lay faint on top of the black). Drawing
bodies over oil, water and blood only, and under fire and clouds, is possible but means splitting the puddle layer and
putting bodies over danger marks too; I didn't, and ask instead.

## Clips (docs/clips/corpses19/)

Each scene twice, `-before` and `-after`, the same seed and staging (the fights play out the same; only the bodies differ).

| Clip | What to look at |
|---|---|
| `boulder-*` (6 s) | A rock troll lets its boulder go at 1.2 s through two bodies and a downed knight. **1.6 s**: before, the ball shoves the bodies aside and along; after, it rolls over them. **2.3 s**: before, the knight is drawn over the ball; after, the ball over him. **5.2 s**: the troll walks back over the knight: before, the knight's ring is drawn over the troll; after, under it. At the end the two bodies still lie where they were (after). |
| `necro-*` (10 s) | A knight goes down at 0.4 s between a rock and a crate, skeletons on him. **1.5 s and on**: before, he and his ring lie over the rock and the crate; after, the rock and crate stand over them, and the skeletons over his ring. |
| `raise-*` (6 s) | Four skeletons struck down in front of a knight (0.4-1.3 s), the Necromancer raises minions where two of them lie at **~3 s**: raising from bodies works as before. |
| `wurm-*` (6 s) | The Sand Wurm killed with its rings out at ~2.9 s. **3.4 s**: a knight walking where a ring lies: before, hidden under the ring (only his bar shows); after, on top of it. The rings are over everything only while they drop. |
| `engine-*` (5 s) | The Great Engine falls at 2.0 s among four heroes. **2.3-3.0 s**: before, its dome and cog lie over the heroes; after, under them (plates and bolts still fly over). |
| `drake-*` (9 s) | The Cinder Drake dies at ~1.2 s and cools to a husk; the heroes come and stand on it from ~6 s. Unchanged: it already lay under everything. |
| `crowd-*` (11 s) | A plain villager brawl round two rocks, a barrel and a crate. The change is small here, as bodies were already drawn under the fighters: **2.6 s**, a body still flying from its blow is drawn over the villager beside it (before, under); **6.0 s**, top right, the blue villager standing on a body: before, the body covers his shadow and side ring; after, they're over it. |
| `puddles-*` (6 s) | Villagers struck down into oil (0.6 s), fire (1.1 s), gas (1.6 s), blood (2.1 s). Before, a body lies faint over the black oil and over the fire; after, under them: **from ~1.5 s the body in the oil is hidden** (the open call below). The others bounced out of their puddles. |

## Checks

- `for f in js/*.js; do node --check $f; done`: all pass.
- `node tools/preview-check.mjs`: threw 0, never fired 0, not offered 0.
- `node tools/battles.mjs`: 535 battles, 0 problems, 11 ran out of time (535: the Villager, bases19, is in the list now).
- `node tools/corpses19/check.mjs`: 0 pushes or collisions with a body (998 before).

## Open calls

1. **Thrown bodies stop at rocks and crates** (pick), or fly through them and lie hidden under them. Stopping is the one
   collision left, and only while the body is still flying or sliding; once still, nothing moves it.
2. **Downed heroes count as bodies** (pick): never pushed, drawn under everything with their rings. The wagon still
   shoulders them aside on the road so they can be revived.
3. **Puddles, blood and danger marks over bodies** (pick). An oil or water puddle hides a body while it lasts.

## Not done, noticed

- A dead Villager's body shows the plain base (bald, sack tunic), not its own rolled look: render.js drawCorpse draws
  the kind's picture (`def.art`), and the look is rolled per unit (folk-kind.js). Faint and grey once lying, but the
  first moment of the throw is in full colour. A small fix (the body keeps its unit's look) if wanted; not asked.
- Drawing changes a fight: `js/boss-wurm-fx.js` counts down the wurm's `u.stuck` in its floor drawing, by `w._dt`. My
  first cut set `w._dt` earlier in the frame (the downed are drawn earlier now) and the wurm fight in the films came out
  different. `w._dt` is set where it always was now, and the before/after films play out the same. Worth moving that
  count into the sim some day; not mine to change here.
- No new files the game loads. No version bump.

## Switches

None: this is how bodies work now. To see the old way side by side: `node tools/corpses19/serve-overlay.mjs <port>
<folder with the old js files> .` (how the before films were made).
