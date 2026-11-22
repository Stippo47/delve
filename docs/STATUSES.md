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
| **Poison** | spider bites, gas | 100 | 4 | 0.07 x value damage a second; over 20: moves and attacks 10% slower | **Sickened** (round 11; it used to take 15% of max health at once): for 6 s it loses 10% of its max health in all (bosses 4%), deals 30% less damage and moves and attacks 20% slower; drops to 30, and to 0 when the sickness ends (round 13). Anything that cleans statuses ends it |
| **Wet** | water shots, puddles (to 90 only) | 100 | 6 | abilities come back slower (up to half speed); over 30 freezes 1.5x easier; over 60 flies 1.7x further when hit; each soaking washes off half the poison | **Slip**: spins helplessly for 1 s and leaves a puddle; drops to 60 |
| **Shock** | Chain Lightning, Storm abilities | 100 | 14 | from 20: a 0.3 s jolt (stun) every 1.1 s (bosses 0.1 s) | **Overload**: a 1 s stun, and arcs 30 shock to up to two of its side within 140; drops to 0 |
| **Stagger** | heavy blows, bone spikes, the banshee's wail, bat screech | 100 | 12 | every hit that adds stagger stops it for 0.15 s (bosses 0.05) | **Knocked out**: 2.5 s (bosses 1.2) helpless and taking 1.5x damage; drops to 0 |
| **Radiance** (new) | angels (blows 22, smite 30), cherubs (arrows 12, arrow rain 18), seraphs (bolts 20), the Archon and the Radiant (blows 25, the Radiant's ring 40) | 100 | 6 | attacks come up to 35% slower and hit up to 60% weaker (both scale with value / threshold) | **Radiant**: for 3 s it glows (an aura 120 across), **can't attack or use an ability**, and everyone else inside the aura gains 24 radiance a second (not itself); drops to 0, and it can't gain radiance again until 4 s after the glow ends |
| **Cursed** (new) | ghosts' touch (30; ghosts no longer chill), the banshee's wail (32) and pull (22), the Bone King's last phase (his Soul Nova / Ring 40 and the Bone Wall 20) | 100 | 5 | heals do (1 - 1.6 x fill) of what they should: nothing from about 63; blows land up to 40% harder | **Hexed**: drops to 0; its next attack, heal or summon (within 8 s) **turns on it**: its damage hurts itself instead (80% of it, at most 30% of its max health per hex), a heal hurts the friend it was meant for, a summon joins the other side (with a 12 s life). Everything that one action does in the next 0.6 s turns too (all seven arrows of a Barrage) |
| **Entangle** (round 9) | ents' root lines (55), an elite ent's root ring (70), the Elder Ent's roots (65) and root cage (110), grasping roots on the floor (22/s), rooted sproutlings' seeds (6, an elite's 14) | 100 | 6 | up to 70% slower (x fill); walking hurts (2.2 x fill per 100 walked) and so does every attack or ability (2.5 x fill) | **Rooted** (round 13: "Tangled and rooted are the same thing": one state, one name, one icon, one look): rooted for 3 s (bosses 1.2) and the vines squeeze once for 12 damage; drops to 0, then 3 s more before it can be entangled again |
| **Charm** (round 13) | the Enchantress (her kiss 14, Heartstring 30/s, Sweetheart 16 a blow, First Impression 45), elite Cupids' love arrows (18), the Succubus (her blow 12; 16 on whoever hits her, once a second each; her kiss 40) | 100 | 8 | from 20 (the first blow still lands) it **can't hurt whoever is charming it** (u.stBy.charm): the blow does nothing and a heart pops; it looks for someone else to fight | **Enthralled**: fights for the charmer's side for 5 s (elites 4, majors 3), then comes back; drops to 0 and can't be charmed again for 6 s after. A boss, or the last one standing on its side, is **Smitten** instead: stunned 1.5 s (bosses 0.6) |
| **Confused** (round 13) | the bat's screech (40) | 100 | 7 | every shot goes up to 0.7 rad wide (x fill); now and then (1.4 a second x fill) it lurches round to a random heading and stays turned 0.5 s; with an attack ready and nothing in reach it swings or shoots at the air (1.2 a second x fill) | **Addled** for 4 s (bosses 1.6): its weapon hits friends as well as foes, and it uses every ability it has ready at once; drops to 0, then 4 s immune |
| **Sleepy** (round 13) | the Bard's Lullaby (45), the choir sprite's song (8 a beat on everyone of the other side inside it) | 100 | 5 | attacks up to 40% slower and up to 60% of its chances to use an ability lost (x fill); its head nods | **Asleep** for 4 s (bosses 1.6): the Lullaby's sleep, a blow wakes it; drops to 0, then 5 s immune |
| **Bleeding** (round 13) | the hellhound's bite (16), the hunter spider's pounce (40) | 100 | 6, **held** for 1.5 s after every blow it takes | 0.05 x value damage a second (armour doesn't help); heals do up to 50% less (x fill) | **Haemorrhage**: loses 33% of the health it has left at once (a boss at most 6% of its max); drops to 0, then 3 s immune |
| **Fear** (round 13) | the banshee's wail (45) | 100 | 8 | backs away from whoever frightened it while that one is within 320, more as it builds (x fill); it trembles | **Terrified** for 3 s: runs from the frightener, can't attack or use an ability, and every ability it had ready is wasted (its cooldown starts again, at least 5 s). A boss only **cowers** (stunned 0.6 s) |

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
  Sewers) and the hellhound (the Ember Deep), +1.4.
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
- Charm's "can't hurt the charmer" starts at 20, not at 1, so the first blow on a charmer still lands (with the Succubus
  charming whoever hits her, a rule from 1 made her almost unkillable).
- A boss, or the last one standing on its side, is only Smitten (a stun) by charm's burst; bosses only cower when
  terrified; Haemorrhage takes at most 6% of a boss's max health.
- Sleepy's burst is the Lullaby's sleep (4 s, a blow wakes it).
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
  - Confused: a lilac wash; it sways off balance; a wobbling question mark over its head. Addled: a flickering wash and
    two spirals chasing round its head; a lilac swirl with stars at the burst.
  - Sleepy: a dusky violet wash; its head nods (a slow droop, a jerk back up); small slow z's. Asleep: a poof and a big Z.
  - Bleeding: a dark red wash, red cuts on the body (more as it builds), drops of blood falling off it. Haemorrhage: a
    red flash on the body, a spray of red streaks and a pool of blood under it that fades.
  - Fear: a pale wash; it trembles, harder as it builds; sweat flicking off its head. Terrified: shaking, fright lines
    round its head, and it runs.
  - HUD icons `charm`, `charmed`, `confuse`, `addled`, `sleepy`, `bleed`, `fear`, `terrified`; buff and state icons
    `haste`, `might`, `ward`, `stance`, `regen`, `lifesteal`, `focus`, `immune`, `hidden`, `form`.
