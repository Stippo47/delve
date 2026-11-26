# Round 19, lane toggles19: Outlines and Health bars switches

The designer: "Give me an option to turn off outlines and hp bars completely in settings"

## The switches

Settings, a new group **Outlines and health bars** just above "Enemy health, once hurt" (js/camp.js settingsView),
two `rowbtn` + `switch` rows like the Dev ones. Both are on by default: with both on, the game draws exactly what it
drew before.

| switch | stored | test flag (not saved) | lives in |
|---|---|---|---|
| Outlines | `localStorage['delve.outlines']` `'1'` / `'0'` | `?outlines=0` / `?outlines=1` | `js/util.js`: `OUTLINES` (a live `export let`), `setOutlines(on)` |
| Health bars | `localStorage['delve.hpbars']` `'1'` / `'0'` | `?hpbars=0` / `?hpbars=1` | `js/hpstyle.js`: `HPBARS`, `setHpBars(on)` |

`readFlag(q, key)` (util.js) reads the address first, then the save, else on. A flip takes effect on the next frame
(both are ES live bindings read where they draw); the camp's panel redraws through `render()` as the other settings do.
While Health bars is off, the "Enemy health, once hurt" picker is greyed and its heading says
"off: health bars are off" (`.group.inactive`, css/camp.css); a tap on it does nothing (the deny shake).

### How the outline goes without a per-frame cost

- Every ink pass is skipped (`if (OUTLINES) { ...ink... }`), never drawn at `lineWidth = 0` (canvas ignores 0 and keeps
  the last width). With the switch on, the only added work is that boolean test.
- The SVG figures (parts.js `paintRig`): the rigs keep their ink copies; with outlines off the ink loop is skipped,
  the 'ink' mode (a chain's links inked together) draws nothing, and the 'flash' mode draws the parts' own silhouettes
  in white (`flatFilled`, cached once per part) instead of the grown ones. No rig is rebuilt.
- Cached pictures that bake the outline in carry `OUTLINES` in their key, so they are painted once more when it flips
  and are then cached as before: the room's floor (walls, sewer channels, scenery, the convoy's road and roadside
  rocks: render.js `floor`), the camp's still background (camp-scene.js `background`), the convoy's canopy tiles
  (convoy-art.js `drawCanopy`), props (sprites.js `getProp`: line 0, and a stand-in of another size is only taken if it
  has the same outline or none), the procedural rats and slimes (sprites.js `getSprite`: `lw` -1), a corpse's composed
  look (render.js `bodyLook`).

## Audit: every outline / ink site

`grep -rn "OUTLINE\|INK\|#2B2230" js/` and the ink helpers (`inked`, `inkLine`, `inkDisc`, local `ink()` functions).
"Gated" = skipped while Outlines is off.

### Gated (the outline goes)

| file | what |
|---|---|
| js/parts.js `paintRig` | every SVG-parts figure: heroes, monsters, summons, the Book's previews, the camp's heroes; the bow string's ink |
| js/render.js `inked` | doors' fallbacks, the room icons, hazards (oil, fire, spikes), pickups (coins, keys, trinket fallback, pedestal rewards, chest fallback), the procedural unit fallback disc, the windup mark, the key carried |
| js/render.js | spike-trap tips' ink; `drawHeldWeapon` (a thrown hero weapon's ink copy); the nocked arrow; the rat's tail; the ice block round a frozen unit; particles: heal cross, heart, blood drip, spark; `bodyLook` cache key; floor cache key |
| js/sprites.js | procedural rat / slime ink (`drawRat`, `drawSlime`), prop outlines (`getProp` line 0) |
| js/fx.js | `inked`, `inkLine` (every effect, projectile, thrown thing and code-drawn summon that uses them: fx2, fx3, fxkit, fx-status, fx-water, fx-dash, fx-melee, fx-rogue19, fx-hit-r19, kits, heroes, the boss fx files); the lightning bolt and chain lightning ink; the smoke-lump and poison-cluster ink rims |
| js/boss-draw.js `figure` | every code-drawn boss body (pass 0, the ink); and the seams (their outer half would ring the figure where the ink covered it); `inkDisc`, `slashBand`, `streak`, `spike` go through fx.js `inked` |
| js/boss-angel-fx.js | the hoops, chains and shackle; the horn blast's sound bars |
| js/boss-chieftain-fx.js | the roar's sound bars |
| js/boss-engine-fx.js | the engine's beam ink |
| js/boss-ooze-fx.js | the ooze's tearing strings |
| js/foe-draw.js | a chain's ink pass (serpents, centipedes: links and the tail taper); the frost spirit's tail |
| js/fx2.js | the net's ink lines; the burrow trail's soil rim |
| js/fx-dash.js | the dash line's ink |
| js/fx-melee.js | the Griffon's helm wings |
| js/fx-rogue19.js | the timer ring's ink round its red arc |
| js/fxkit.js | the snowflake ink (`snowflakeK`) |
| js/puddles.js | Inked / Rimmed / Silhouette puddle styles' ink pass; the web's ink; `snowflake` |
| js/hpstyle.js | the bars' own ink rims (bar, arc, pips) when bars are on and outlines off |
| js/scenery.js `inked` | floor dressing (bones, crates, rocks...), themed walls and pillars, bone blocks, sewer pipes, grates, hazards (bramble, roots, vents...); the sewer channel's ink banks |
| js/env.js | the room's wall line, the free-standing blocks' ink, the torch sconces' ink ring |
| js/floors19.js | the sewer channel's ink banks (round 19 floors) |
| js/convoy-art.js | the roadside rocks, crowns, firs and canopy bank ink; the wagon and the ox team (`paintWagon`, also parked at camp); `inked` |
| js/convoy.js | the road's gate, banner, camp fire and tent ink; the gatherer's coin's ink disc |
| js/camp-scene.js | `ink()` (stones, logs, tent, trader's cart, book, battle ring, settings chest, bedrolls, trees, pebbles), the cart awning's ink frame; background cache key |
| js/camp-map.js | the trail map's tree rims |

### Kept on purpose

| file | what | why |
|---|---|---|
| render.js `drawText`, fxkit.js 895, fx2.js 1064 / 1570 / 1864 | text outlines (damage numbers, labels, "!?") | readability |
| render.js `arch` | the doorway's dark opening (`fillRect INK`) | it is the opening, not an outline |
| render.js gas hazard | the darker green rim (`+ OUTLINE`, '#5E8A2A', see-through) | a colour, not ink |
| render.js battle side rings, battle.js / convoy.js downed rings, convoy.js off-screen arrows, inspect.js selection ring | coloured rings and their ink backing | HUD marks (side, bleed-out timer, wave arrows, selection), like the telegraph circles |
| parts.js `bordered` | Guard's gold, Unstoppable's white-gold, buff borders | protection effects, not the ink. With outlines off they sit straight against the body (their width is ink + border) |
| render.js `drawRing` | telegraph circles | telegraphs |
| boss-spider-fx.js 142, boss-stilt-fx.js 207 | the ink round the eyes in the head plate | an eye socket, drawing inside the figure |
| fx-hit-r19.js 110 / 116 / 620, fx3.js 68 / 73 / 395, fx2.js 16 / 593 / 1371-1448 / 1582-1599 / 1764 / 1831, boss-chieftain-fx.js 25, boss-engine-fx.js 34 / 122, fx-rogue19.js 278, convoy-art.js 318 / 339, convoy.js 800, camp-scene.js 428 | ink-coloured eyes, pupils, mouths, cracks, keyholes, stripes, a tent ridge, a tail, a needle | drawing inside a figure, not its silhouette |
| fx2.js 611 / 1678 / 1726 / 1904, fx-hit-r19.js 508 / 513 / 630, fx3.js 445-522, boss-*-fx `rgba(43,34,48,…)` | ground marks, holes, cracks, shadows, joint lines | ground marks and details |
| camp-map.js nodes and skull | the trail map's floor markers | map markers (UI) |
| sprites.js `uiArt`, icons*.js, the boss pictures (`cinderPicture`, `wurmPicture`, ...) | portraits, faces, icons | UI pictures |
| the SVG_KINDS sprites (archer, knight, rogue, boss .svg) | | carry no outline already |

### Health bars

| site | off |
|---|---|
| hpstyle.js `drawEnemyHp` (styles 1 Bar, 2 Arc, 3 Pips, 5 Bar + Arc; battle mode's bars on both sides; `barAlways` previews; the bars on boss parts, which are units drawn through it) | nothing drawn |
| hpstyle.js `hpWash` (style 4's red wash) | no wash |
| main.js `#bossBar` (the boss's bar and name at the top of the arena; the convoy chief's) | hidden |
| render.js `SHOW_BARS` bars | already off since round 2 |
| kept: the hero cards' bars in the bottom HUD, battle mode's side totals in its bottom strip | the party panel, not over the fight |
