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
| **Poison** | spider bites, gas | 100 | 4 | 0.07 x value damage a second; over 20: moves and attacks 10% slower | **Rot**: 15% of its max health at once; drops to 30 |
| **Wet** | water shots, puddles (to 90 only) | 100 | 6 | abilities come back slower (up to half speed); over 30 freezes 1.5x easier; over 60 flies 1.7x further when hit; each soaking washes off half the poison | **Slip**: spins helplessly for 1 s and leaves a puddle; drops to 60 |
| **Shock** | Chain Lightning, Storm abilities | 100 | 14 | from 20: a 0.3 s jolt (stun) every 1.1 s (bosses 0.1 s) | **Overload**: a 1 s stun, and arcs 30 shock to up to two of its side within 140; drops to 0 |
| **Stagger** | heavy blows, bone spikes, the banshee's wail, bat screech | 100 | 12 | every hit that adds stagger stops it for 0.15 s (bosses 0.05) | **Knocked out**: 2.5 s (bosses 1.2) helpless and taking 1.5x damage; drops to 0 |
| **Radiance** (new) | angels (blows 22, smite 30), cherubs (arrows 12, arrow rain 18), seraphs (bolts 20), the Archon and the Radiant (blows 25, the Radiant's ring 40) | 100 | 6 | attacks come up to 35% slower and hit up to 60% weaker (both scale with value / threshold) | **Radiant**: for 3 s it glows (an aura 120 across), **can't attack or use an ability**, and everyone else inside the aura gains 24 radiance a second (not itself); drops to 0, and it can't gain radiance again until 4 s after the glow ends |
| **Cursed** (new) | ghosts' touch (30; ghosts no longer chill), the banshee's wail (32) and pull (22), the Bone King's last phase (his Soul Nova / Ring 40 and the Bone Wall 20) | 100 | 5 | heals do (1 - 1.6 x fill) of what they should: nothing from about 63; blows land up to 40% harder | **Hexed**: drops to 0; its next attack, heal or summon (within 8 s) **turns on it**: its damage hurts itself instead (80% of it, at most 30% of its max health per hex), a heal hurts the friend it was meant for, a summon joins the other side (with a 12 s life). Everything that one action does in the next 0.6 s turns too (all seven arrows of a Barrage) |

Angels, cherubs, seraphs and the angel bosses can't be made radiant; ghosts and banshees can't be cursed.

## Timers (not build-ups)
Frozen, stunned, knocked out, rooted, asleep, guarded, untouchable, taunted, radiant (the glow) and hexed (the armed
hex) are timers: their HUD ring shrinks from full as they run out.

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
