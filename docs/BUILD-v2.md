# Build v2: round 6 (2026-11-20)

The designer played 0.6.0 and answered everything; the rulings are in `docs/DECISIONS.md` "Round 6" and the raw
notes word for word in `docs/riffle-log/2026-11-20-round6.txt`. Read both. Contracts from `docs/BUILD-v1.md` still
hold (heroes.js, save v2, newRun/summary, u.anim, w.fx, brains, themes). Lanes work in their own worktree and branch,
commit there, never push; the lead merges. Keep diffs small in files you don't own.

| lane | branch | owns |
|---|---|---|
| F: feel and combat | `feel` | sim.js, kits.js, heroes.js (stats/kits), dungeon.js flow, path.js, enemies.js tuning, fx.js/render.js for corpses, impacts, shadows |
| U: UI | `ui` | index.html, main.js HUD/menus, camp.js, progress.js, save.js, css/, new hud.js / inspect.js / bestiary.js |
| E: environment | `env` | scenery.js, themes.js looks, render.js floor()/walls/props drawing, sprites.js props, art/props/ |
| A1: hero art fixes | `art1` | design/class-round5/ and art/heroes/ (replacing files the game uses only when done and checked) |

## F: feel and combat
Waves per room (after a room is cleared, 1-2 more waves spawn in before the doors open, announced by sound/visual,
not text); longer TTK for everyone (more HP across the board); hero move speed ~3x (enemies faster too, so fights
still meet; ability cooldowns stay); rooms a bit smaller; longer attack and view range; slightly bigger colliders.
Juice: more knockback and physical reactions; impacts punchy without heavy shake/hitstop (cut both down); hit
effects at the target's surface (and at a raised shield); corpses launched by the killing blow, left lying, fading
slowly. Pathfinding: kill the back-and-forth spinning; enemies must not wander into corners and stick. The party
skips areas with nobody in them. Chest: appears near the party when a room is won (no keys); opens empty and coins
spill out around it; dropped coins scatter wider and home in fast when a hero comes close. Spikes go down when the
room is beaten. Remove aura rings round heroes (Guard etc.) and redo the puddle look; a circle shadow under every
unit. Twinfang's Backstab: longer cooldown. Cleric: ranged (weak light orb), first ability = a heal-over-time ray to
an ally (no burst), can't heal itself with its attack; update heroes.js text to match. First ability: not free,
cheap (heroes.js treeFor: tier I of ability 0 costs ~20). Difficulty: each dungeon harder than the last (order
Warren < Sewers < Crypt, or as balance shows), each floor harder; more enemy variety and abilities (use the enemy
kinds that exist; new art comes later). Camera pans past the room edge by up to a third of the room's size. Test with
tools/runs.mjs batches: nothing stuck, sensible win rates.

## U: UI
Battle HUD: hero cards with current/max HP on the bar, each ability's cooldown, statuses as a shrinking ring with an
icon in the middle, items (trinkets, potion) as small sprites, no text; heroes and the currencies/Leave button swap
places. Pause in a dungeon to inspect party, units, statuses, items and their descriptions (tap a unit). A bestiary
(enemies met, fun descriptions) and fun item descriptions. Rest 2-3 minutes (not 10). More potion types to buy
(haste, faster abilities, fire immunity, iron skin...). Trinket levels (buy upgrades). A cheat for unlimited
currency (a settings toggle). Item visuals better (trinket icons drawn as proper little sprites).
The designer doesn't like the camp's or the skill tree's look: make **3-4 clearly different style directions** for
the camp screen and the skill tree as switchable looks in the game (a style setting), screenshot each, and leave
the current one as one option. Don't drop functionality.

## E: environment
"The entire environment needs a visual overhaul. Offer like 4 styles." Make 4 clearly different environment looks,
switchable (a setting or `?env=1..4`), each covering floors, walls, rock and doors. Walls with faces angled outward
from all four sides (bevelled, like a wall seen from above with slanted sides). About 12 floor styles across the
themes. Ground decor toned down so it doesn't look collidable or important. Shadows truly top-down (no side-cast
shadow under the fountain). Doors in walls look good; the door/room choosing look needs work. Props notes: crates as
single crates the size of 2x2 path cells, and barrels; rocks in 4 styles; replace the unclear pillar; pedestal seen
from straight above; a better oil; open chest's lid; the boss door's doors; the used fountain; the mimic goes back to
the round-3 version and must look like the chest. Screenshot every style in each theme at phone size.

## A1: hero art fixes (design/class-round5/)
Structure first: **weapons and hands are their own parts, separate from the body** (e.g. `#hand-r` holding the
weapon, inside `#arm-r`, never painted into `#body`); the outline goes on after, over everything (parts.js already
does this). Then the notes on the picked fixes and on the casters and support heroes (the log, items under "fixes"
and the caster-/support- items under "heroes"): Griffon helm opening, Bearskin and Berserker spikes, Wildmane shorter
locks, Bandit red bandanna, Shade blades identical and mirrored, Twinfang the same, Granny hands further down the
shaft, Haymaker hat rim shading, Gaper all 30% bigger except the outline; Alchemist hair+hat, Cultist redo, Druid x2
variants, Frost blue gem on hood, Necromancer and Pyromancer and Storm redo, Shaman braids, Witch and Beekeeper hats
from the farmers' hats, Chef, Cleric redo (ranged now: an orb), Lantern keeper redo, Monk necklace, Plague doctor redo,
Seer hair, Templar redo. Same style and brief rules as round 4 (`design/briefs/round4-brief.md`).
