# Statuses

Round 8, the designer: "They are a value from 0 to x, when the value reaches x a burst effect is applied and the
status effect is removed or lowered." Every build-up status below works that way: hits add to a value, the value
drains a little every second, it does something while it's there, and when it reaches its threshold it **bursts**
and drops back.

Code: the table in `js/statuses.js` (thresholds, what's left after a burst, drain, colour, and the Radiance and Cursed
numbers), the rules in `js/sim.js` (`addStatus` for the bursts, `statusTick` for drain and the effects over time,
`hurt`/`heal` for the damage and healing changes). The HUD ring (`hud.js unitStatuses`) is the value over the
threshold: it fills as the status builds and is full at the burst, then flashes for half a second.

## Why the HUD showed every status at 100%
The rings were drawn against "the highest value seen since the status began", which is right for a timer that only
counts down (a stun, a freeze) but wrong for a value that builds: while a status is building, its current value *is*
the highest seen, so every build-up showed a full ring and the burst seemed to come from nowhere. The amounts were not
the problem (an archer's frost arrow is 34 chill: about three to freeze). Now each build-up's ring is
`value / threshold`; timers keep the old way.

## The build-ups
| status | from | threshold | drains /s | while it builds | burst (and what's left) |
|---|---|---|---|---|---|
| **Burn** | fire arrows, fireballs, fire patches (34/s), breath | 100 | 7 | from 8: (1.5 + 0.06 x value) damage a second; flames on the body, more as it builds; thaws a freeze and melts chill | **Scorch**: 22 damage and a fire blast round it (60 across, 10 damage, burn 24 on whoever's near); drops to 20 |
| **Chill** | frost arrows, snowballs, blizzards, the Bone King's soul fire | 100, +45 after each freeze (that extra drains 4/s) | 6 | slower, up to 60% (value / 160) | **Freeze**: frozen 3 s (bosses 1.6), can't act; a hard hit while frozen **shatters** (26 damage, icicles); drops to 0, burn too |
| **Poison** | spider bites, gas | 100 | 4 | 0.07 x value damage a second; over 20: moves and attacks 10% slower | **Sickened** (round 11; it used to take 15% of max health at once): for 6 s it loses 10% of its max health in all (bosses 4%), deals 30% less damage and moves and attacks 20% slower; drops to 30, and to 20 when the sickness ends (round 14; round 13 had 0). Anything that cleans statuses ends it |
| **Wet** | water shots, puddles (to 90 only) | 100 | 6 | abilities come back slower (up to half speed); over 30 freezes 1.5x easier; over 60 flies 1.7x further when hit; each soaking washes off half the poison and (round 17) half the burning; a fire-tagged unit is Doused (docs/tags17.md) | **Slip**: spins helplessly for 1 s and leaves a puddle; drops to 60 |
| **Shock** | Chain Lightning, Storm abilities | 100 | 14 | from 20: a 0.3 s jolt (stun) every 1.1 s (bosses 0.1 s) | **Overload**: a 1 s stun, and arcs 30 shock to up to two of its side within 140; drops to 0 |
| **Stagger** | heavy blows, bone spikes, the banshee's wail, bat screech | 100 | 12 | every hit that adds stagger stops it for 0.15 s (bosses 0.05) | **Knocked out**: 2.5 s (bosses 1.2) helpless and taking 1.5x damage; drops to 0 |
| **Radiance** (new) | angels (blows 22, smite 30), cherubs (arrows 12, arrow rain 18), seraphs (bolts 20), the Archon and the Radiant (blows 25, the Radiant's ring 40) | 100 | 6 | attacks come up to 35% slower and hit up to 60% weaker (both scale with value / threshold) | **Radiant**: for 3 s it glows (an aura 120 across), **can't attack or use an ability**, and everyone else inside the aura gains 24 radiance a second (not itself); drops to 0, and it can't gain radiance again until 4 s after the glow ends |
| **Cursed** (new) | the banshee's wail (32) and pull (22) (round 14: ghosts' touch is Sleepy now), the Bone King's last phase (his Soul Nova / Ring 40 and the Bone Wall 20) | 100 | 5 | heals do (1 - 1.6 x fill) of what they should: nothing from about 63; blows land up to 40% harder | **Hexed**: drops to 0; its next attack, heal or summon (within 8 s) **turns on it**: its damage hurts itself instead (80% of it, at most 30% of its max health per hex), a heal hurts the friend it was meant for, a summon joins the other side (with a 12 s life). Everything that one action does in the next 0.6 s turns too (all seven arrows of a Barrage) |
| **Entangle** (round 9) | ents' root lines (55), an elite ent's root ring (70), the Elder Ent's roots (65) and root cage (110), grasping roots on the floor (22/s), rooted sproutlings' seeds (6, an elite's 14) | 100 | 6 | up to 70% slower (x fill); walking hurts (2.2 x fill per 100 walked) and so does every attack or ability (2.5 x fill) | **Rooted** (round 13: "Tangled and rooted are the same thing": one state, one name, one icon, one look): rooted for 3 s (bosses 1.2) and the vines squeeze once for 12 damage; drops to 0, then 3 s more before it can be entangled again |
| **Charm** (round 13) | the Enchantress (her kiss 14, Heartstring 30/s, Sweetheart 16 a blow, First Impression 45), elite Cupids' love arrows (18), the Succubus (her blow 8; 8 on whoever hits her, once a second each; her kiss 22, every 8-10 s) | 100 | 8 | from 35 (the first blows still land) it **can't hurt whoever is charming it** (u.stBy.charm): the blow does nothing and a heart pops; it looks for someone else to fight | **Enthralled**: fights for the charmer's side for 5 s (elites 4, majors 3), then comes back; drops to 0 and can't be charmed again for 6 s after. Round 14: bosses, mini-bosses and boss parts take no charm at all; an enemy still enthralled when its room is won **follows** the party for the rest of the floor (below). Only the party's last hero standing, and in a battle a side's last unit, is **Smitten** instead: stunned 1.5 s |
| **Confused** (round 13) | the bat's screech (40) | 100 | 7 | every shot goes up to 0.7 rad wide (x fill); now and then (round 14: 1.2 a second x fill) it turns to a random heading and walks off that way for 0.6-1.1 s at 70% speed; with an attack ready and nothing in reach it swings or shoots at the air (1.2 a second x fill) | **Addled** for 4 s (bosses 1.6): its weapon hits friends as well as foes, and (round 14) now and then one ready ability, picked at random, goes off by itself (0.8 a second, 1.6 with two or more ready); it uses none by choice; drops to 0, then 4 s immune |
| **Sleepy** (round 13) | the Bard's Lullaby (45), the choir sprite's song (8 a beat on everyone of the other side inside it), ghosts' touch (30, round 14) | 100 | 5 | attacks up to 40% slower and up to 60% of its chances to use an ability lost (x fill); every wind-up up to 40% longer (x fill, round 14); its head nods | **Asleep** for 4 s (bosses 1.6): the Lullaby's sleep, but nothing wakes it for the first 2 s (bosses 0.6), then a blow does; drops to 0, then 5 s immune |
| **Bleeding** (round 13) | the hellhound's bite (16), the hunter spider's pounce (40) | 100 | 6, **held** for 1.5 s after every blow it takes | 0.05 x value damage a second (armour doesn't help); heals do up to 50% less (x fill); round 14: three looks to pick from | **Haemorrhage**: loses 33% of the health it has left at once (a boss at most 6% of its max); drops to 0, then 3 s immune |
| **Fear** (round 13) | the banshee's wail (45), a terrified friend nearby (round 14) | 100 | 8 | round 14: backs away from whoever frightened it, facing it, to 40% of 320 at the first point and all of it when full; it trembles | **Terrified** for 3 s: turns its back and runs from the frightener (or from where the fright came from), can't attack or use an ability, and every ability it had ready is wasted (its cooldown starts again, at least 5 s); round 14: its panic spreads to its own side within 120 (34 a second, halved for every hand it has passed through). A boss only **cowers** (stunned 0.6 s) |
| **Shackled** (round 15) | the Warden's chain (28 a blow: about five blows on one enemy), his Manacles (110: at once) | 100 | 6 | every ability cooldown it has runs up to 50% slower (x fill): a hero's abilities, a plain enemy's one ability, its dash, every move its brain times with `due()` | **Shackled**: for 4 s (elites 3.2, majors and mini-bosses 2.4, bosses 1.6) it can't make a basic attack, and at the moment the irons lock every ability cooldown it has is set back by half of that ability's full length (bosses a quarter), never past one full cooldown; a blow it was winding up is stopped. Drops to 0; can't be shackled again for 6 s after it ends (bosses 12 s) |

Angels, cherubs, seraphs and the angel bosses can't be made radiant; ghosts and banshees can't be cursed.

## Changing sides (round 13)
Charm's burst, the Jester's Befuddle and a brain leech's host all go through one path, sim.js `turnSide(w, u, team,
kind, by, dur)` / `restoreSide(w, u)`: `u.trueTeam` keeps the side the unit really belongs to (`sideOf(u)`),
`u.flipKind` says why (`charm` | `befuddle` | `leech`), `u.flipUntil` when it comes back on its own. A flipped unit
dies, drops and counts as what it really is (killNow restores it first; stats.js, dungeon.js, battle.js `sideOf`,
the HUD's hero cards all read the true side); a won room puts everyone back. In battle mode the floor ring shows
the side it is fighting for right now.

## Healers' counters (round 13; the designer: "Heal negation, enemies that target healers")
- **Healer hunters** (`def.hunter`: a bonus when it picks a target that is a support hero): the hunter spider (the
  Sewers) and the hellhound (the Ember Deep), +1.4. Round 14 ("Have a higher chance to go for healer. Not hard
  targeting."): only while it is in the mood, rolled every 3-5 s at even odds (sim.js `HUNT`).
- **Heal negation**: Bleeding cuts heals by up to half and is on the hellhound's bite and the hunter spider's pounce;
  Cursed still cuts them to nothing. Buffs can carry `healTaken` (heals x that) for later use.

## Damage blocked (round 13)
sim.js `hurt` counts what a dodge, a blind miss, Blink Stone, being untouchable, a `taken` hook or buff, a raised shield,
a front block and armour kept off each blow (not damage over time) as **blocked** (stats.js `tallyBlock`), apart from
what got through (taken). It shows in the run's result (a bar and a lead), the pause panel, the About page, the battle
result (a column) and tools/balance.mjs (`blk`: blocked / (blocked + taken)).

## Helpful states shown (round 13: "Some positive status effects don't show")
Every buff now shows on the hero card and in the pause panel under its own name and icon with what its numbers do
(bestiary.js `BUFFS`, hud.js `buffLine`), and so do helpful states that aren't buffs (bestiary.js `STATES`, hud.js
`STATE_TESTS`): Regrowing, Guarding, Gas Form, Underground, Steady Aim, Loaded Shot, Momentum, Barkskin, Duel, Soul
Candle, Cranked Up, Keen Eye, Mocking, Focused, Wolf Form, Spirit Link. Stances that hold a hero still (Hold the Line,
Brace, Pavise, Shield Wall...) read as stances, not as Rooted.

## Lane S calls (round 13), to put to the designer
- Charm's "can't hurt the charmer" starts at 35, not at 1, so the first blows on a charmer still land (with the Succubus
  charming whoever hits her, a rule from 1 made her almost unkillable: two Succubi beat a hero trio 10 times in 10,
  where two Devils win 1 in 10; with these numbers they win 2 in 10).
- A boss, or the last one standing on its side, is only Smitten (a stun) by charm's burst; bosses only cower when
  terrified; Haemorrhage takes at most 6% of a boss's max health.
- Sleepy's burst is the Lullaby's sleep (4 s), unbreakable for its first 2 s (a plain sleep was woken by the next blow and couldn't be seen).
- Confused's burst fires every ready ability at whatever it was looking at; an enemy without a hero kit uses its one
  move if it has one.
- Where the new statuses are used (above, the "from" column), the healer hunters, and that the Cupid is the cherub's
  elite (its arrow rain stays).

## Timers (not build-ups)
Frozen, stunned, knocked out, rooted, asleep, guarded, untouchable, taunted, radiant (the glow) and hexed (the armed
hex) are timers: their HUD ring shrinks from full as they run out.

## Round 13 rulings (lane S)
- **Tangled = Rooted.** The Entangle burst roots (`u.rootT`), the same state every root uses (the Druid's Entangle, nets,
  jaw traps, grasping roots); `u.tangledT` is gone. One name (Rooted), one icon (`root`), one look (vines round the feet).
- **The radiant glow is drawn under the units** (fx.js `drawGroundFx`; it used to cover a boss's sprite).
- **Poison** drops to 30 at its burst, and to 0 when the sickness ends.
- **Armour** (js/armour.js `armourCut`): each point takes one point off a blow and 2% off it; the whole cut never passes 60%
  of the blow. Heavy and critical blows get past half of both. Damage over time ignores it.
- **The wither rule is off** (dungeon.js): enemies no longer wear down in a room that drags on. `w.stale` (enemies press
  in harder after 45 s without a kill or 150 s in the room) is what is left.

## Round 14 (lane S, second pass): the designer's notes on 0.16.0
The designer's words: `docs/riffle-log/2026-11-22-round14.txt`, deck v16-statuses. Numbers in `js/statuses.js`.
- **Charm** ("Bosses immune to charm. The last unit on a floor charmed will count as beating the level. They will follow
  u into the next room fully charmed."):
  - Bosses, a floor's mini-boss (`u.mini`, `u.floorFoe`) and boss parts (`def.part`) take no charm at all (sim.js
    `charmProof`); the Enchantress's Heartstring no longer picks them.
  - An enemy is enthralled even when it is the last of its side (round 13 stunned it). An enemy charmed over to the
    party no longer holds its room open (dungeon.js `thrall`). When nothing in a room is left fighting the party and no
    wave is to come, the room is won, and every enemy still enthralled there becomes a **follower** (`u.follower`): its
    charm has no end (`flipUntil` null), it walks through the door with the party (dungeon.js `follow`, `enterRoom`)
    and fights for them in the rooms after, **until it dies or the floor ends** (endFloor drops `run.followers`).
    Why the floor: a floor is the run's own stretch (checkpoints, the downed come back at its end); without an end the
    Enchantress would gather a retinue across a whole dungeon. A follower keeps its health, rank and kind; statuses,
    targets, what it was casting and what was cast on it are left behind. A thing bolted to its room (a wall turret)
    counts as beaten but stays.
  - A wave still to come: the room is not won; the wave comes up while the charmed one fights for the party (for the
    5 s it has).
  - What a charmed or befuddled unit calls up or splits into is charmed the same way: the same side, the same end, a
    follower's a follower (sim.js `spawn`; `killNow` keeps the dying one's charm in `u._flipWas`). A chain's body goes
    over with its head (turnSide / restoreSide).
  - A friend's cleanse does not break a follower's charm, and Heartbreak leaves followers alone (won for good).
  - The party's last hero standing, charmed full (a Succubus), is still **Smitten** (stunned 1.5 s): turned, nobody
    would be left fighting for the party. In a **battle** a side's last unit is still Smitten (kept from round 13):
    turned, it would have no one to fight and the battle would sit until it came back.
  - Tests: `node tools/test/charm-rooms.mjs` (16 checks: the last enemy follows and fights in the next room, several
    charmed at once, a charmed summoner, a charmed splitter, a wave to come, bosses, the last hero, battle mode).
- **Confused** ("turn randomly", "a chance to trigger randomly while bursted", "spiral swirls ... appearing on body
  randomly. Question marks when bursted"): the lurch is a turn you can see and a walk the wrong way: 1.2 a second x fill
  it swings round (1.5-3.1 rad off) at 1.6x its turning speed and walks that way for 0.6-1.1 s at 70% (`u.lurchA`,
  `u.lurchT`). Addled fires nothing at the burst; while it lasts, each second there is a 0.8 chance (1.6 with two or more
  ready) that one ready ability, picked at random, goes off by itself (sim.js `addledTick`, kits.js `kitFireRandom`); an
  addled unit uses none by choice. Looks: swirls pop up on the body here and there (1 to 3, more as it builds); addled:
  three question marks popping round its head; the burst throws five question marks out.
  Measured (`tools/test/sleepy-confused.mjs`, an Archer at tier III addled with every ability ready): round 13 fired all
  three at 0.0 s; now e.g. Roll 0.1, Frost Arrow 0.8, Barrage 2.6, Roll 3.9.
- **Sleepy** ("all wind ups like 40% longer too. Anything charged up"): `windMul` = 1 + 0.4 x fill slows every wind-up:
  an enemy's melee wind-up, a charge's tell, a slam, a stand through a tell (elites.js `hold`, `rushTick`, boss-kit
  `chargeTick`), the danger zone it shows meanwhile, a lob's flight, a hero's charged shot and anything else it has
  queued (`u.later`, `u.aimT`), and the pose plays out to match. Measured at 99 (just short of the burst): a rattler's
  swing 0.42 -> 0.57 s, the banshee's wail 0.58 -> 0.82 s, an orc's charge tell 0.47 -> 0.63 s, the Archer's Barrage
  0.42 -> 0.57 s (+36-41%); at 50 about +17%. The designed bosses' own move timers outside those tools are not stretched.
- **Bleeding** ("Don't like visual at all"): round 13's dark red wash, red cuts and falling drops are gone; three looks
  to pick from, `?v_bleed=1..3` (fxvar.js), 1 the default: **1 Spurts** (a heartbeat, 1.05 s a beat quickening to 0.55
  s, squirts a jet of 3-5 drops from a wound in its side; they splash on the floor and fade over 2.6 s; the body flushes
  red for a blink on each beat; Haemorrhage: six jets at once all round, a pool under it), **2 Trail** (nothing on the
  body: a pool under its feet growing with the build-up, and a mark left every 14-20 it walks; Haemorrhage: the pool
  floods out and a crown of blood splashes up round it), **3 Drop** (a blood drop beside its health bar fills like a
  gauge and throbs on each beat; Haemorrhage: it swells and bursts, its blood thrown out). Blood on the floor is a ground
  effect (no outline); drops in the air are inked. Clips `clips/r14/statuses/bleed-1..3.mp4`.
- **Fear** ("Doesn't seem to back away. Burst will make them turn away and run. Will have a radius of fear around them
  giving other entities fear."): from the first point it backs away facing the frightener (its walk turned away by at
  least 0.6, all the way when it was coming straight on, at 74-90% speed) until it is 40% of 320 off (all 320 when
  full). Measured (`tools/test/fear-spread.mjs`, a rattler closing on a paladin given 45, one wail): distance every 0.5 s
  round 13 126 152 196 170 122 103 101 139 124; now 126 153 204 201 177 187 162 172 145 (it keeps off till the fear
  drains). Terrified: it turns its back (faces the way it runs: 19% of its run in round 13, 100% now after a 0.4 s
  turn), runs from the frightener or, if that one is gone, from where the fright came from; an elite's move or a tell
  it was in is dropped. Spread: everyone of its own side within 120 gains 34 fear a second from it, halved for every hand
  the panic has passed through (`u.fearGen`; the third hand's 8.5 a second no longer beats the 8 a second fear drains),
  and the usual 8 s before a unit can be terrified again. Six rattlers in a knot, five given 45 and one terrified: 3-4
  of the six burst, the panic goes two hands deep and everyone is calm again after 6-7 s (round 13: only the first one).
- **Who uses them**: the ghost's touch builds Sleepy (30 a touch, every 1.3 s) instead of Cursed. The bite's chomp
  (fxkit.js, used by rats, bats and hunter spiders: the Druid's wolf has its own bite, and hellhounds, dire and frost
  wolves and the Alpha draw a thrust) shows the jaws wide open first (they open a touch wider over 0.09 s), snaps at
  0.15-0.21 s and holds; it is turned 90 degrees, so the jaws close along the line of the bite; 0.42 s in all (was 0.28).
- **The Succubus** ("The when hit charm attacker should be on a cooldown, not every hit."): when a blow lands on her and
  her answer is ready she blows the striker a kiss (charm 24, a heart flies to it), then not again for 4 s whoever hits
  her (`SUCCUBUS` in foes.js; round 13: 8 on every blow, once a second for each striker). Battles of 20: two Succubi vs
  paladin, archer, cleric won 1 (round 13) and 0 (now); two Devils 0; three Succubi vs paladin, archer, bard 15 and 16.
- **Healer hunters**: on the healer, share of the hunters' time in 12 battles of four against a trio (1 in 3 by chance;
  `tools/test/hunters.mjs`): hunter spiders vs tower, pyromancer, bard 85% (round 13) -> 60%; vs paladin, archer, cleric
  45% -> 44%; hellhounds 35% -> 34% (their pack brain picks for them most of the time, round 13 too); plain wolves 21%.
- **Poison** ("Poison drops to 20%"): when the sickness ends the build-up drops to 20 (it never rises to it: a build-up
  already under 20 stays).

## How they look (the hooks the visuals read)
- `u.st.<status>` is the value; `statuses.js fillOf(u, id)` is 0..1 to the burst; `u.bursts[id]` is the time it last burst.
- Burn: flames drawn on the body (`fx.js drawStatusFx`, 2-5 licks, taller as it builds) plus flame particles rising
  off it (`sim.js statusTick`), and an orange wash.
- Radiance (round 9): golden glints twinkling on the body and thin beams of light rising off it, more as it builds (no halo), and a pale gold wash. `u.radiantT` > 0 while the glow is on;
  the glow itself is a world fx `{ type: 'aura', kind: 'radiance', unit, r, max }` (drawn by `fx.js aura`, riding on the unit).
- Cursed: dark purple wisps curling up off the body, more as it builds, and a purple wash. `u.hexed` while the hex
  waits (an open purple eye over the head); fx `{ type: 'hex', kind: 'arm' | 'fire' | 'turn', unit }` when it arms,
  when it turns an action, and on a summon that changed sides (`u.turned`, `u.turnedFrom`).
- HUD icons: `radiance`, `radiant`, `curse`, `hexed` in `icons.js`; names and descriptions in `bestiary.js STATUSES`.
- Round 13 (js/fx-status.js, render.js `washesOf` and `unitFrame`). No rings round the body: a wash, body motion and marks.
  - Charm: a pink wash; pink hearts rising off it, more as it builds. Enthralled: a stronger pulsing pink wash and a
    beating heart over its head; a burst of hearts when it turns, the heart cracking in two when it comes back.
  - Confused: a lilac wash; it sways off balance; round 14: swirls popping up on its body here and there, more as it
    builds. Addled: a flickering wash and question marks popping round its head; question marks thrown out at the burst.
  - Sleepy: a dusky violet wash; its head nods (a slow droop, a jerk back up); small slow z's. Asleep: a poof and a big Z.
  - Bleeding (round 14): three looks to pick from, `?v_bleed=N` (Spurts, Trail, Drop; above). Round 13's wash, cuts and
    drops are gone.
  - Fear: a pale wash; it trembles, harder as it builds; sweat flicking off its head. Terrified: shaking, fright lines
    round its head, and it runs.
  - HUD icons `charm`, `charmed`, `confuse`, `addled`, `sleepy`, `bleed`, `fear`, `terrified`; buff and state icons
    `haste`, `might`, `ward`, `stance`, `regen`, `lifesteal`, `focus`, `immune`, `hidden`, `form`.

## Round 15 (lane N): Shackled
The designer (the Old Guard's Pommel Strike note, showcase 3): "Shackled status effect, target can't do basic attacks,
ability cooldowns are set back 50%", and "the shackled ability goes to someone else"; the deck notes then asked for a
"Warden (uses a lot or shackles and restraints. Nullification themed)". It is the Warden's.
- **The rule** (statuses.js `SHACKLE`, sim.js `shackleBurst`): a build-up like the rest. Full, the irons lock for 4 s:
  no basic attack (sim.js holds its attack clock: `tryAttack`, a confused flail, and every brain that strikes off
  `u.atkT`), and every ability cooldown is set back once, at that moment, by 50% of its own full length: a ready
  ability has half its cooldown to wait, one that had 80% left has a whole one. It is never pushed past one full
  cooldown, so shackling the same enemy again can't hold an ability off for ever.
- **While it builds** the designer's words say nothing, and every other build-up does something on the way: cooldowns
  run slower, up to half speed when it is nearly full (statuses.js `cdRate`). My call; say if it should do nothing.
- **What counts as a cooldown**: a hero's three abilities (kits.js `kitSetBack`), a plain enemy's one ability
  (`def.abilCd`), its dash (`def.dashCd`), and every move an enemy's own brain times with elites.js `due()` /
  `again()` (elites' and majors' moves, the families, the bosses' timed moves): `due` keeps each timer's full length
  now (`u.el.dueLen`) so the burst can set each back by its own share (statuses.js `setBackDue`).
- **What it can't reach**: an enemy whose brain keeps a private clock and never looks at `u.atkT` or `due()` (the Bone
  King's phases, a few turret-like kinds) loses neither its blows nor its moves to it. On those it is weaker than its
  words. Listed here rather than patched kind by kind.
- **The limit on bosses** (and their parts): 40% of the time (1.6 s), a quarter of a cooldown instead of half, 12 s
  before it can build again, and the Warden's Manacles II stake doesn't root them.
- **How it looks** (fx3.js `drawMarks3`, three takes, `?v_shackle=N`): 1 Irons (the game's): an iron cuff at each
  wrist, open while it builds and closing as it fills, a chain across its front; shut with a lock at the burst, the
  irons snapping together with sparks (`shackleSnap`). 2 Wound: a chain wound round the body link by link. 3 Staked:
  the cuffs and a chain down to a ring in the floor behind it. No word pops up.
- **The Book**: Shackles (the build-up) and Shackled (its burst) under Statuses, each with a preview (preview-sim.js
  builds it on a fighter like the others); icons in icons.js; the HUD ring fills as it builds and counts the 4 s down.
- **Cleaning it off**: Cure, Nullify's wash, a cleanse and going down all take the irons off (`shackledT = 0`).

## Round 15 (lane E): the newer heroes' eight, lifted into the statuses
Round 13 (lane H2) built eight effects as each hero's own, one function each in `js/kits2.js` "so they can be lifted
into statuses.js" (docs/HEROES-r13.md, "New statuses asked for"). They are statuses now, with **behaviour unchanged**:
the numbers, durations, looks and who puts them on are what they were. What the lift gave each: a row in `js/statuses.js`
(its numbers in `WHIRLED`, `SPUN`, `DIRTY`, `TARGETED`, `TRACKED`, `TRAPPED`, `WARDED`, `WEAKENED`, and `HERO_STATUS`:
kind, ring colour, who puts it on, how to read it off a unit), its own icon (`js/icons.js`, plain stand-ins in the
status icons' look), a name and words (`js/bestiary.js STATUSES`), a ring on the hero cards and in the pause panel
(`js/hud.js unitStatuses`: the two build-ups fill toward their burst and flash at it, the six timers run down), and a
card in the Book's Statuses grid with a live preview (`js/preview-sim.js`: the build-ups built in pulses to their burst
by the very function a hero uses, the timers put on at their tier I numbers). kits2.js keeps the functions (they are
how a hero puts each on) and reads every number from statuses.js.

| status | who | rule (numbers in statuses.js) | look (fx2.js, as before) |
|---|---|---|---|
| **Whirled** (builds) | the Griffon (Swoop, Stormhammer), the Alchemist (the whirling pool), the Air Mage | 0-100 in `u.k2s.whirl`, drains 12/s; while on, every shove it takes goes (1 + fill) as far. Full: stunned 0.95 s and flung about at random three times 0.3 s apart (520 hard), then 3.9 s from the burst before it can build again. Bosses: build at 45%, stunned 0.4 s, flung 180 | white wind curls round the feet; a whirlwind at the burst |
| **Spun** (builds) | the Monk (Palm Strike) | 0-100 in `u.k2s.spun`, drains 10/s; while on it moves at 80% and each step has a 0.9 x fill chance it can't turn. Full: it marches off the way it faces for 1.2 s, fast, and can't attack (a unit with a brain of its own is stunned 0.5 s instead); 4 s before it builds again. Bosses: build at 45%, march 0.5 s | gold chevrons wobbling round its head; dust kicked up as it marches |
| **Dirty** | the Digger (Dirt Fling, his trait) | 10 s (or the giver's): the next blow (not damage over time) is soaked up and that ends it; attacks 30% slower meanwhile; burn and poison washed off when it goes on and can't take on it while it lasts | brown smears, crumbs dropping |
| **Targeted** | the Marksman (Aimed Shot), the Pirate (Point Blank) | blows (not damage over time) land 1.2x; its dashes, leaps and charges go 40% as far; the Marksman's bullets go on through it | a red crosshair |
| **Tracked** | the Falconer (his falcon) | can't turn invisible, untouchable or go underground; every blow from the tracker's side lands the falcon's set amount harder | an amber crosshair |
| **Trapped** | the Trapper (Jaw Trap) | can't move or turn, can't use an ability (its clocks held at 0.3 s), what it was doing is broken off (not a wind-up); it can still strike straight ahead. Bosses: 40% of the time | the jaw trap shut on it |
| **Warded** | the Alchemist (Elixir), the Jester (Swap), the Valkyrie (Valkyrie's Call), the Quartermaster (the buckler), the Chef (a meal past whole) | a shield soaking up the next N damage (the giver's N) for its time, or till used up | a pale blue border (protection) |
| **Weakened** | the Shade (Blackout) | deals 70% | a grey wash, grey chevrons sinking off the body |

**Where the shared rules would have changed them, and what was chosen.** The rule: keep today's behaviour unless it is
plainly a bug.
- **Cleanses and going down** (sim.js `cleanse`: the Cleric's Cure, the Monk's Inner Peace, the Warden's Nullify II, the
  Valkyrie's Call and others; a hero going down or getting up): they reset `u.st` and the control timers. The eight never lived there (Whirled and Spun keep
  their value in `u.k2s`, the timers are hooks or buffs), so no cleanse ever took them off, and none does now (their values
  stay out of `u.st` for that reason: Nullify's "anything building on a friend?" check reads it too). Not plainly a bug:
  a cleanse here washes off what builds up and the stuns, never a buff (Weakened is one), and a jaw trap or a crosshair is
  not something a heal washes off. In a run it never comes up (the six harmful ones go on enemies, which nothing cleanses;
  Dirty and Warded are helps). **Kept.** Say if a cleanse should free a trapped or whirled friend (battle mode).
- **Resistances**: `def.res.<id>` is read now (statuses.js `resTo`: a build-up's amount, a timer's time; 0 = none takes)
  by all but the two helps (Dirty, Warded). No kind has one, so nothing changes. The designed bosses' default of 0 for
  every build-up (boss-kit.js) is **not** extended to Whirled and Spun: they take them at 45% today. **Kept.**
- **Boss limits**: as they were (above). Only `def.boss` counts, not a boss's parts, mini-bosses, majors or elites, where
  Shackled shortens for all of those. **Kept.**
- **Strips**: Nullify II (the Warden) strips an enemy's protecting buffs, anything with a border: Warded's border went but
  its shield stayed on, unseen and still soaking. **Plainly a bug: fixed** (kits3.js: the shield goes with its border).
  Only a battle can show it (an enemy hero warded). The Enchantress has no strip (Heartbreak breaks charm only).
- **The Mob and chains**: a status put on with `addStatus` lands on the Mob's lead or a chain's head; the eight land on
  the body they hit, as before. **Kept.**
- **Stats**: `addStatus` counts a status's ticks and bursts for whoever put it on (stats.js); the eight never were. **Kept.**
- **The HUD**: Warded and Weakened were shown as plain buffs (bestiary.js BUFFS); they are statuses with their own icons
  now, and skipped as buffs so each shows once.

Proof (same seeds before and after, `--v`): `node tools/runs.mjs --n 3 --theme all`, and with these heroes in the party
at level 30 and with every node (`--party griffon,digger,marksman,falconer`, `trapper,monk,alchemist,shade`,
`airMage,pirate,griffon,monk`): the same output line for line (docs/DECISIONS.md, round 15 lane E).

## Round 17 (lane tags17): Silenced, Nullified, Doused, Kindled
The rules and numbers are in docs/tags17.md and js/tags.js.
- **Silenced** (`u.silencedT`, sim.js `silence`): no ability or move tagged mouth (shouts, songs, howls, breath,
  bites, kisses, whistles); everything else as ever. Bosses 40% of the time. A crossed-out speech bubble over it. A
  cleanse ends it.
- **Nullified** (the Warden's Nullify: what it called "silenced" before): every ability and timed move locked, the
  padlock; unchanged. It silences as well.
- **Doused**: a fire-tagged unit Wet or in water takes (1.5 + 0.06 x wet) a second (at least 60 wet in water), bosses
  half; it steams and hisses.
- **Kindled / Flare**: a fire-tagged unit set burning by the other side takes no burn damage: up to +30% dealt and
  attack speed, +15% move (x fill); its Scorch is a Flare instead (the whole boost for 4 s); bosses half the extra.
- Constructs take no Bleeding and no Poison.

## Round 19 (lane rogue19): Disarmed, Anti-heal, incorporeal; Spun changed
The rules, the calls and the clips: docs/rogue19.md.
- **Disarmed** (`u.disarmT`, sim.js `disarm`; `statuses.js DISARMED`): its weapon is knocked out of its hand and hidden
  (parts.js takes the weapon out of the arm's art; it spins away and lies on the floor till it is back); no weapon blow,
  no ability or move done with the weapon (tags.js `WEAPON_ABILITIES`, `MOVE_TAGS.weapon`, through `abilityBlocked` /
  `moveBlocked`, as Silenced); bites, claws, shields, kicks and spells go on. Only what holds a weapon (tags.js `ARMED`).
  Bosses 40%. A cleanse doesn't bring the weapon back. From the Bandit's Dirty Trick, Hostage III and Light Fingers, and
  the Dame's Disarm.
- **Anti-heal** (buff `antiheal`, `statuses.js ANTIHEAL`): heals on it do half. Dull cracked crosses sink off the body.
  From the Cultist's shadow bolt (3 s) and Sacrifice II (4 s).
- **Incorporeal** (`u.incorpT`, sim.js `incorporeal`; a state, not in the HUD): sharp and blunt hits pass through, magic
  lands; no collision. The Shade in Blackout and her shadow clones; the Ghost when pressed.
- **Spun** (changed): its turning is slippery (momentum: slow to start, slow to stop, overshooting; sim.js
  `updateFacing` reads `u.slipF`) instead of locked; full up it is **Dazed** (stunned 1.3 s, bosses 0.5 s, stars round
  the head) instead of marching off.
