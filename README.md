# Delve — dungeon autobattler (v0.1)

Offline web app: open once with signal, Add to Home Screen, then it works in airplane mode.
No build step. Static files only (GitHub Pages: deploy from `main`, root).

## Layout
- `index.html` — HUD, camp, result screens (HTML) over the game canvas.
- `js/sim.js` — AI (weighted move modes + hysteresis + context steering), physics, combat, statuses, hazards.
- `js/units.js` — every unit's numbers and the trinket list. Tuning lives here.
- `js/dungeon.js` — run flow: 3 floors x 3 rooms, boss at the end, satchel/keys/chests, downed-until-floor-cleared.
- `js/render.js` — canvas drawing. `js/sprites.js` — SVG art rasterised once per size, rats/slimes drawn in code.
- `js/save.js` — localStorage save. `sw.js` — offline cache (bump VERSION on release).

## Debug
- `?seed=N` fixed random seed. `?auto=D` jumps straight into depth D at 4x.
- `GAME.fastForward(seconds)` in the console simulates instantly.
