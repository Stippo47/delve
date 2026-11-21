# Build v4: round 8 (2026-11-21), the overhaul

Sources, to read in full: the designer's chat message below (word for word) and
`docs/riffle-log/2026-11-21-round8.txt` (answers on art-round6 and v08-report, the deck notes, a new thought).
Earlier contracts (BUILD-v1..v3) hold unless this changes them. Lanes work in their own worktree and branch,
commit there, never push; the lead merges.

## The designer's message, word for word
> I'm setting you to fable to just go around and overhaul and fix anything. You can set an opus agent to fix the art.
> I want you to do everything from getting all of the heroes into the game, add additional enemies and abilities, make
> sure all abilities look good in a unified style, make an actual game loop, try the convoy delivery game mode, improve
> the ui and ux (layout and theme) because i still do not like it, start from scratch honestly. Improve the
> slash/melee effects. Balance the progression system so it actually is a challenge.
> As for the progression. I don't think they should level up in the dungeon. They go in and stay at the same strength
> they left (ignoring any items they find), xp is just what limits what upgrades can be unlocked. If a hero is lvl 5,
> they will enter a dungeon at lvl 5, and if they get up to level 7 in the dungeon they will stay level 7 and will get
> 2 skill points to use in their skill tree.
> The simple ones like better damage or hp, should be nodes in the large tree, add more base stat increases, like
> attack speed, weapon attack speed, specific ability damage, heal percentage, attack range, specific ability cooldown
> buff, applied status effect increase, etc.
> Coins will be used to buy and upgrade equipment, new heroes, potions, etc. More hero slots will be unlocked upon
> defeating the first dungeon first mini boss, first dungeons boss, and 2nd dungeons boss.
> Make more bosses (1 for each dungeon) and make the skeleton boss stronger and better.
> You need to defeat the first dungeons boss to get to the next dungeon.
> Make it so there are 7 rooms per dungeon floor. With 2 different mini bosses at the end of the first 2 floors and
> the main boss at the end of the last floor. Each subsequent floor should not just be harder but also be slightly
> different in what is there, not just more elites or something, different types enemies, hazards, overall vibes.
> Add checkpoints in between each floor in a dungeon. If you make it to floor 2 room 3 you can re enter floor 2 from
> the very start (different rooms), when selecting the run. Also make it so you lose 20% of your earnings if you leave
> before you finish the floor.
> Before you put the new enemies in the game I want you to describe each one to me. I want a huge roster. (Which will
> eventually need art) you can also design 1-3 more dungeons including a forest themed one which will become the
> first dungeon (wolves, goblins, ents, bandits, slimes, etc)
> Add variants of the same enemies. Colour variations/ maybe slightly different accents, that have different abilities
> and kits) example is an orangey goblin that is 1.5x as fast, and weaves in and out of a fight. Or a golden skeleton
> that drops double the gold but summons homing golden bones all around it that also pierce and does 1.5x damage, or a
> spider that burns instead of poisons and can spit fireballs. Also elites may spawn with trinkets on them that they
> will use. Even lower chance to spawn with 2x the trinkets.

## Gate
New enemies, new dungeons and their bosses go in **only after** the designer has answered deck `roster2`
(`docs/ROSTER.md`). This round uses the kinds already in the game.

## Shared contract (progression)
- **Levels are permanent.** `save.heroes[id] = { owned, level, xp, points, nodes: { nodeId: rank }, trinkets, recoverUntil }`.
  A hero enters at its level; XP earned in a dungeon is kept; each level gained gives 1 skill point. No run-level gating.
- **Skill tree = a web**, `treeFor(id)` -> nodes `{ id, x, y, kind: 'root'|'ability'|'tier'|'stat'|'keystone'|'slot',
  name, desc, max, cost (points per rank, usually 1), links: [ids], level? }`; a node can be bought when one linked
  node is owned. x/y are layout coordinates on a pannable canvas (the designer wants ~100 nodes per hero in time;
  start with ~40-50). Stat nodes: damage, health, attack speed, a named ability's damage / cooldown / heal amount,
  attack range, status applied, move speed, etc. The three abilities and their tiers are nodes in the web.
- **Gold** buys and upgrades equipment (trinkets), new heroes, potions. Gems go away (convert to gold on load).
- **Party slots**: start 1; +1 for the first dungeon's first mini-boss, +1 for the first dungeon's boss, +1 for the
  second dungeon's boss (flags in the save, not bought).
- **Dungeon order and gating**: Warren, Sewers, Crypt, Frost Hollow, Ember Deep, Gilded Spire until the Wildwood is
  approved and built as the new first. Beat a dungeon's boss to open the next.
- **Floors**: 3 floors of **7 rooms**; floors 1 and 2 end in two different mini-bosses, floor 3 in the boss. Each floor
  has its own enemy set, hazards and mood (themes carry per-floor data).
- **Checkpoints**: reaching floor N of a dungeon lets later runs start at floor N's first room (new rooms).
- **Leaving** before the floor is finished loses 20% of that run's earnings.
- **Mini-boss tier**: any kind can be a mini-boss form: bigger and stronger than an elite, two extra moves. Elites sit
  between normal and mini-boss in size. Elites may carry a trinket they use (it drops), rarely two.
- **Waves**: every wave has at least as many enemies as the one before, spread about, not 3 in one spot.
  Enemy count overall +50%. Dungeons and floors must scale much harder; it has to be a challenge.

## Lanes this round
| lane | branch | owns |
|---|---|---|
| L: loop and progression | `loop` | dungeon.js, map.js, themes.js (per-floor data), elites.js (mini-boss tier, elite trinkets), progress.js, save.js, heroes.js `treeFor` (the web), kits.js stat hooks, tools/runs.mjs, balance |
| S: sim | `sim` | sim.js, path.js, layout.js navigation; statuses (build-up, Radiance, Cursed); boss.js (Bone King stronger) |
| V: visuals | `vis` | fx.js, render.js effects, parts.js; ability visuals in one style, melee slashes, the showcase page; puddles x4 styles; enemy HP x4 styles; summon tint |
| U: UI from scratch | `ui2` | index.html, css/, camp*.js, skilltree.js, hud.js, inspect.js, main.js menus |
| A: art | `art4` | design/class-round7/, art/ |

**L** commits the progression contract first (save v3 + migration, `treeFor` web data, the progress.js API) as a
commit whose message starts `CONTRACT:` so U can `git merge loop` early; then the floor/room structure, mini-bosses,
checkpoints, gating, slot unlocks, the 20% rule, waves/counts/scaling, elite trinkets, balance with batches.

**S**: units get stuck behind rocks and obstacles on the grid: fix navigation properly (test with `--feel`).
Statuses: a value builds 0..x, at x the burst happens and the value drops; the HUD showed statuses jumping straight
to 100%: find out why and make build-up real and visible. New: **Radiance** (from angels: attacks slower and much
weaker; burst = a glowing aura for a short time that makes others radiant, and the unit can't attack during it) and
**Cursed** (from ghosts and some undead: can't be healed, takes more damage; burst = the next attack or ability
turns on its user: damage hurts the user, a heal hurts the ally, a summon joins the other side). Burn's flames are
missing again: restore them. The Bone King stronger and better (a fourth phase is proposed in ROSTER.md).

**V**: every ability must be visible and readable in one unified style (the Necromancer's bone spear is barely
seen: bigger, with an effect). Better melee slash effects. A **showcase**: a page/mode where each hero uses its
attack and each ability on a target dummy, and a tool that records one short clip per ability (the lead builds the
Riffle board from them). **4 styles** to pick from for ground puddles and the like (oil, fire, gas, water, each;
no rainbow on oil), and **4 ways to show an enemy's HP** (only once damaged), all switchable by setting. Found
trinkets on the floor look like their trinket sprite. The door's light: rounded at the bottom. Summons: black
outline again, their colours hue-shifted to mark them ours (an allied skeleton more blue-grey).

**U**: start from scratch on layout and theme; the designer still dislikes it. Camp "decent"; the tree: the Star
wheel "is more along the lines of what I want": a web, a bigger pannable area, room for ~100 nodes per hero, no
redundant elements. HUD: the level badge moves from the face onto the left of the XP bar; the HP bar less tall,
sharing its room with the XP bar; the bars must show on iPhone Safari (cards were `<button>`s there; now divs).
Dungeon select with checkpoints (pick the floor to start from), locked dungeons, slot unlock messaging, equipment
buy/upgrade with gold, heroes bought with gold, skill points.

**A** (Opus, highest effort, change only what each note asks): the art-round6 notes in the round 8 log.

## Queued (next round)
All remaining heroes into the game (kits for ~30 more), the new enemies and dungeons from ROSTER.md once approved,
a designed boss per dungeon, the convoy (wagon escort) mode prototype.
