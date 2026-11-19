# Build v1: making Delve a game

The designer (2026-11-19): "make this a game: overhaul the main camp, make the progression system, the
environments/dungeon types, design a boss fight, put 15 of the heroes in with abilities and a skill tree. Every hero:
1 attack, 3 abilities (each with tiers) and 1 trait/passive. Animations so characters actually use their weapon,
swing, draw bow. Any visual polish. More trinkets with fun, unique effects." Also: "I liked very little of the enemy
redesigns; they didn't fit the style. Many of the heroes were good, with a few visual flaws."

The rulings in `docs/DECISIONS.md` hold everywhere (portrait only, show-don't-tell: no bars/numbers/ability names in
the arena, gold kept forever, levels live in a run, etc.). Read it.

## Lanes (each in its own git worktree and branch; the lead merges)
| lane | branch | owns (edit freely) | may touch lightly |
|---|---|---|---|
| Lead: kits | main | sim.js, units.js, heroes.js, new abilities.js/traits.js, dungeon.js hero spawning + XP | everything, merges |
| A: animation + polish | `anim` | sprites.js, new parts.js, render.js `drawUnit`/`drawProjectile`/fx drawing, new fx drawing | sim.js only via `setAnim` calls |
| B: camp + progression | `camp` | index.html, main.js (camp/result/menus), save.js, new camp.js + css | dungeon.js `newRun` options + run-end summary |
| C: dungeon types + boss | `dungeons` | new themes.js, new boss.js, enemies.js, dungeon.js room dressing/rosters, render.js `floor()`/`drawWall`/props | units.js enemy defs |

Never reformat or move code you don't own; keep diffs small where you touch someone else's file, so merges are easy.

## Shared contracts

### Heroes (`js/heroes.js`, lead)
`HEROES[id]` = { name, art, role, starter?, unlock: { gems }, blurb, stats, attack { name, anim, desc },
abilities[3] { id, name, cd, desc, tiers[3] }, trait { id, name, desc } }. `treeFor(id)` gives the skill-tree nodes
(branch, kind 'tier'|'stat'|'slot', name, desc, cost[rank], max, req { node, level, feat }). Units.js builds
`DEFS[id]` from it. The 15: paladin, tower, archer, twinfang, wildmane, berserker, granny, pyromancer, frost, storm,
cleric, bard, druid, necromancer, plague. Starters: paladin, archer, twinfang.

### Save (`js/save.js`, lane B)
Version 2 (migrate v1 by starting fresh but keeping coins as gold):
```
{ v: 2, gold, gems, slots (party size, starts 1), potions (bought, to bring in),
  heroes: { [id]: { owned, nodes: { [nodeId]: rank }, feat (reached level 8 once), best (best run level),
                    trinkets: [trinketId, ...] (equipped, bought ones), recoverUntil (ms timestamp) } },
  trinkets: [trinketId, ...] (owned, not equipped), dungeons: { [themeId]: { best, cleared } },
  runs, wins, speed, zoom }
```

### Starting and ending a run (B calls, lead + C implement)
`newRun(save, { theme, party: [heroId...], mercs: false })` returns `run`. `run.party` is the hero list;
`run.heroes[id]` = { level, xp, hp, down, potions, trinkets: [...] } (levels start at 1 every run).
When `run.phase` becomes 'won' | 'lost' | 'retreated', `run.summary` = { gold, gems, kills, floor, rooms,
levels: { [id]: level reached }, downed: [ids], foundTrinkets } and B's result screen applies it to the save:
gold always kept (halved with mercs), feat when a level reached >= 8, recovery timers for the downed.
Leaving: the player can leave at any time but the room is finished first.

### Animation (lane A reads, lead + C write)
`u.anim = { kind, t, dur }` set through `setAnim(u, kind, dur)` from sim.js when an attack or ability starts.
kind: 'swing' (arm-r swings round its pivot: wind back, strike through), 'thrust' (arm-r jabs forward), 'draw'
(arm-r pulls back, releases at the end: bows), 'cast' (both arms lift), 'throw', 'ability' (a bigger generic move).
Walking (u.spd) swings the arms a little. Hit reaction, death etc. stay as they are unless improved.
Sprites: `DEFS[kind].art` is an SVG built in parts (`#back`, `#body`, `#arm-l`/`#arm-r` with `data-pivot`, `#front`),
drawn in file order; the outline goes on after over the whole figure. Kinds without art keep the procedural drawing.

### Effects (`w.fx`, drawn by lane A, pushed by anyone)
Each `{ type, t, max, ... }`, removed when t >= max (the sim advances t):
- `ring` { x, y, r, color }: an expanding ring.  - `zone` { x, y, r, kind }: a lasting ground circle; kind 'holy' |
  'fire' | 'poison' | 'ice' | 'storm' | 'vines' | 'heal' | 'sanctuary'.  - `beam` { x1, y1, x2, y2, kind }:
  'lightning' | 'drain' | 'holy'.  - `wall` { x1, y1, x2, y2, kind }: 'fire' | 'ice'.  - `wave` { x, y, a, r }: a
  shockwave arc moving out.  - `pillar` { x, y, r, kind }: a column of light/lightning from above.
Projectiles have `kind`: 'arrow' | 'fireArrow' | 'bolt' | 'fireball' | 'shard' | 'dagger' | 'vial' | 'thorn' |
'note' | 'bone' | 'water'. New statuses on units: `u.st.wet`, `u.st.shock`, `u.st.stagger`, `u.rootT`
(entangled), `u.sleepT`, `u.ethereal`.

### Brains (`DEFS[kind].brain(w, u, dt)`, C and lead)
Called every tick before the usual brain; return true to skip the usual brain. Use the helpers sim.js exports.

### Themes (`js/themes.js`, lane C)
`THEMES[id]` = { name, blurb, palette (floor, tile, grout, wall, wallTop, rock, void, accent), floorStyle, pillar,
mood, kinds (room mix), enemies (weighted kinds per floor), elite, warden (floors 1-2), boss (floor 3), bossAdds,
hazards, water, props }. `THEME_IDS`: crypt, sewers, warren. `newRun(save, { theme })` builds every room from it
(`run.theme` is the id; `?theme=` in the address for testing). The camp's dungeon cards can use name, blurb and
palette.accent. Drawing: `js/scenery.js` (floor, rock, walls, pillars, dressing, theme hazards, arenas, mood).
Test switches: `?bossroom` (start in floor 3's boss room), `?lvl=N` (heroes start at level N).

### Danger zones (`sim.js` `addDanger`, lane C; drawn by `scenery.js` `drawDanger`)
A telegraphed hit: `{ shape: 'circle'|'ring'|'cone'|'line', ..., t, team, src, kind, hit?, onFire? }`. The sim
counts it down and strikes at 0 (unless `src` fell); units of the other side steer out of it after a short
reaction (a quick scramble). Any brain can use it. Bosses: `js/boss.js` (the Bone King, docs/BOSS-bone-king.md).

## Art the game uses
`art/heroes/<id>.svg` (the 15), `art/enemies/*.svg` (picked skeletons, ghost, lizardmen), `art/props/*.svg`.
The designer disliked the round-4 enemy redesigns: use the round-3/4 picked enemies and the procedural rat and
slime; new enemy kinds may use `design/class-round4/monsters/` art as placeholders only, marked as such.

## Testing
Each lane runs its own static server from its worktree on its own port (`python -m http.server 88xx`) and checks its
work with `node tools/clip.mjs` (pass `--port`) or Edge headless screenshots. Never use the browser pane (it is shared).
Commit on your branch; never push; never touch another worktree.
