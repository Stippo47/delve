# Round 19, lane boulder19: boulders that roll, and a dirt trail

The designer (round 19, chat), word for word: "visual overhaul of bolders. I want you to try 2 methods, it seems u are
already trying 1 of them with the yeti where you have a circular texture just needs the placeholder removed. Second is
getting a flat repeating texture, put a mask on the boulder to cut out from the texture, as it moves it pans the
texture, and maybe it gets a fish eye like distortion to make it seem round. Should have the same look as the current
boulder. Also give the boulder particle effect. A dirt trail."

Clips and stills: `docs/clips/boulder19/` (seconds below are into each clip). Code: `js/boulder-roll.js` (new file the
game loads: it needs adding to the service worker's list), hooks in `js/render.js` (drawPillar, and two layers in draw),
two Dev rows in `js/camp.js`. Tools: `tools/boulder19/` (stage.mjs films balls on a cleared arena with the camera riding
along; fight.mjs films a real fight with the camera on the ball; probe.mjs finds when balls roll fast in a fight;
tile.mjs dumps the rolled textures; settings-shot.mjs). Nothing in the fights changed: the ball's turn is worked out in
drawing from how far it moved between frames (draw-only fields on the ball, `p._r19`); no dice are used. The same seed's
fight is frame for frame the same with every look (fight-troll-before / -a / -b agree).

## "it seems u are already trying 1 of them with the yeti where you have a circular texture just needs the placeholder removed"

What the placeholder was. The yeti's ball was its picture (art/props/yeti-snowball.svg) standing still, with two thin
blue-grey lines drawn round it (`snowRoll`, js/foe-draw.js): two great circles across the way it rolls, sweeping over
it, standing in for a surface that turns. At rest one of them shows as a straight line across the middle of the ball
(snow-compare-directions.mp4 0-0.6 s, top ball; moving-snow-before.png). A second stand-in shows on film too: while the
ball grows as it rolls, each new size of its picture is made in the background, and meanwhile a smaller size's picture
stands in, blown up, with a fat dark ring round it (fight-yeti-before.mp4 4.0-4.4 s, the heave; snow-grow-chipped.mp4,
top ball, at 0.3 s and 2.0 s). Both are gone in the new looks: the lines are not drawn, the ball's own picture turns, and the new looks
draw their own outline at the one outline width, so no stand-in ring.

**Method A, the turning picture** (`?boulder=a`). The picture turns on the ball the way a ball turns: about the line
across its way, flat on the floor, by distance / radius. A flat spin only reads right for one direction (a wheel seen
from the side); this is a real 3D turn kept as the ball's own orientation, so it is right rolling left, right, up,
down, diagonally and round a turn (round a tight turn the picture twists a little, as a real ball's does). The
picture covers the top half of the ball; the half underneath is a second round picture in the same style (smaller
moss, more chips). Each half is laid out so distance from its middle is distance round the ball, so nothing smears at
the rim.
- troll-compare-directions.mp4, middle ball: right 0.6-1.9 s, left 2.2-3.4, up 3.7-5.0, down 5.3-6.6, up-right
  6.9-8.2, down-left 8.5-9.7, a full circle 10.0-13.6. snow-compare-directions.mp4, the same seconds.
- still-troll-a.png / moving-troll-a.png, still-snow-a.png / moving-snow-a.png (full size, zoomed in).

## "Second is getting a flat repeating texture, put a mask on the boulder to cut out from the texture, as it moves it pans the texture, and maybe it gets a fish eye like distortion to make it seem round."

**Method B, the sliding texture** (`?boulder=b`, the default). A flat repeating stone texture (one tile = one turn of the
ball each way), cut out by the boulder's own outline, slides the way the ball goes by the distance rolled. The fish-eye:
a point at distance d from the ball's middle shows the texture at the distance round a ball (asin d), so the middle
moves fastest and the edges squeeze, and it reads round. The tile has four round patches: the old picture's own face in
the middle (so it stands still exactly as before), and three more with the same chips and moss (or streaks of packed
snow); a snowball's tile also has a chipped version with the old cracks on it (so cracks roll with it).
- troll-compare-directions.mp4 and snow-compare-directions.mp4, bottom ball, the same seconds as A.
- still-troll-b.png / moving-troll-b.png, still-snow-b.png / moving-snow-b.png.

How it is drawn, both ways (iPhone 11): per boulder size, worked out once and kept: for each pixel inside the outline,
the ball's face there, the fish-eye's place on the tile, and the picture's light. Each frame only the boulders that
moved are drawn again: per pixel, one texture read, the light, and (A) one 3x3 turn; into a small canvas the boulder's
size (putImageData), then drawn into the room. The tiles are made once per size class (256/512/1024) and kept.
Measured in headless Edge on the PC (software canvas), three balls rolling (tools/boulder19/stage.mjs --perf): per
boulder per frame, at the normal zoom (0.8, about 8,900 pixels) B 0.06 ms, A 0.08 ms; at the closest zoom (1.5, about
30,000 pixels) B 0.19 ms, A 0.28 ms. The game's whole draw for that scene went from 0.14 to 0.55 (B) / 0.51 (A) ms a
frame at the normal zoom and from 0.23 to 0.86 (B) / 1.00 (A) ms at the closest, dirt trails included. A boulder that
doesn't move costs one drawImage. Not measured on an iPhone; the A13 runs this kind of loop at roughly the PC's
speed, so a few boulders should stay around a millisecond.

## "Should have the same look as the current boulder."

Both are made from the boulder's own picture, not a new texture: the SVG is taken apart into its lit base (the gradient
fill), the light laid over it (the top-left glow, the highlight, the shade to the bottom right: found by drawing them
over black and over white), and the marks on the stone. The stone's own surface = the picture with its light taken out;
that is what turns or slides, and the picture's light goes back on top, fixed to the room's light (it doesn't turn with
the stone). So standing still each new look is the old picture to the pixel, and rolling it has the same colours,
chips, moss, highlight, shade and outline (the outline is drawn from the picture's own outline shape at the game's one
outline width). The parts of the ball the picture never showed (the far side) use the picture's own chips and moss
shapes, smaller and turned.
- still-troll-before.png / still-troll-a.png / still-troll-b.png (side by side in one scene: troll-compare-directions.mp4
  at 0-0.6 s); the same for the snowball.
- fight-troll-before.mp4 vs fight-troll-b.mp4 at 9.3 s: the same moment, the same colours and outline width.

## "Also give the boulder particle effect. A dirt trail."

Behind a rolling boulder: puffs of dust (the game's own pale dust, inked like its other dust; puffs that touch merge into
one outlined cloud), small dark clods flung back and up that land, hop once and fade, and faint scuffs pressed into the
floor (no outline: ground marks never have one). A snowball throws snow spray and white clumps instead (no scuffs: it
already leaves its pressed track). Laid by distance rolled and sized by speed: almost nothing at a troll's walking push,
a thick wake at a throw, nothing standing still. Drawn under the balls (a ball hides what it kicks up at its own edge),
aged by the game's clock (slow motion and pause respected).
- dirt-trail.mp4 (game zoom): a push at walking pace 0.4-2.8 s (barely any), a fast roll left 3.1-4.4, a turn 4.4-7.5
  (the trail curves), up 7.5-9.4, then it settles. snow-trail.mp4 the same for the snowball.
- troll-compare-directions.mp4, every move (the top ball is the game before: no trail).
- fight-troll-b.mp4 8.6-10 s (the throw), fight-yeti-b.mp4 4.0-4.8 s (the heave); the -before films have no trail.
- snow-grow-chipped.mp4: a chipped snowball growing as it rolls (its cracks roll with it in A and B: middle ball 1.5 s,
  bottom ball 2.5 s).

## Switches
- `?boulder=b` (default) / `?boulder=a` / `?boulder=old` (the old picture and its two lines), and Settings > Dev >
  "Rolling boulders" (three tiles, saved as `delve.boulder`). settings-dev.png.
- `?dirt=0|1` and Settings > Dev > "Boulder dirt trail" (on by default, saved as `delve.dirt`).

## Calls I made
- **Default: B.** Rolling in a line A and B look alike on film; B is the designer's fuller idea, a quarter cheaper per
  boulder at the normal zoom (a third at the closest), and its tile has four patches (more variety as it rolls). A is truer in tight turns. A is
  one tap away in Settings for comparing.
- The troll's held boulder rolls whenever it moves, pushed or swung round as the troll turns: it's on the floor.
- The boulder's outline keeps the picture's slightly bumpy shape, fixed, while the stone turns inside it (a perfectly
  round ball would differ from the old one; the bumps are small).
- The moss cap rolls away from the top once it has rolled (it can't stay on top of a rolling ball).
- The troll's boulder gets no white flash when shot (it never had one; `hitT` on it is set by a shot and never runs
  down, sim.js, so a flash would have stuck white). The snowball keeps its flash.
- The dust is one colour on every floor, like the game's other dust.

## Not done / still off
- No coloured outline yet: the outline is INK, as every prop's was on this branch; looks19's `inkFor(fill)` (now on
  main) should colour it at merge (one line, marked in drawRolled).
- The snowball has few marks (round 10: "no lumps"), so its roll shows mainly through its faint streaks passing; at
  the normal zoom it reads more from the snow spray than from the ball itself.
- The texture is read pixel by pixel without smoothing; at the closest zoom the moss's edge is a little hard while it
  rolls (not visible at the normal zoom).
- The old look's fat ring on a growing snowball (the stand-in picture) is left as it was in `?boulder=old`.

## Checks
`node --check` on every js file: clean. `node tools/preview-check.mjs`: 2257 previews, threw 0 / never fired 0 / not
offered 0. `node tools/battles.mjs`: 532 battles, 0 problems, 11 ran out of time.
