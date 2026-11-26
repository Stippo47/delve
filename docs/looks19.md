# Round 19b, lane looks19: outline colour and the pixel look

The designer (round 19, chat), exactly:
- "This might be easier said than done. But tried coloured outlines depending on the colour of the entity. I'm exploring looks."
- "I want to see what they look like pixelated"

Both are built as switchable looks in Settings, off by default (the game looks as it did until they are switched on),
with clips and stills of the same fights under each. Clips: `docs/clips/looks19/<fight>-<n>-<look>.mp4`
(spider = battle mode, the IK spider with slimes, goblins, a rattler and a brute against four heroes; drake = the Ember
Deep's boss room; idol = the Canopy Idol in battle mode). Second 3 of every clip is the moment the stills show (to a frame):
`docs/clips/looks19/stills/spider-t5-*.png` (= spider clips at 3 s), `drake-t6-*.png` (= drake clips at 3 s),
`idol-close-t5-*.png` (the idol clips' moment at 3 s, closer in). Numbers in the names: 1 ink, 2 own colour deep,
3 own colour, 4 own colour bright, 5 one colour each, 6 pixel 2, 7 pixel 3, 8 pixel 4, 9 pixel 2 + own colour.

## "tried coloured outlines depending on the colour of the entity"

**Done.** Settings, new group **Outline colour** under "Outlines and health bars": *Ink* (as before), *Own colour*,
*Own colour, bright*, *One colour each*. Every outline in a fight and at camp becomes a dark shade of the colour of
the thing it rings.

- **How the colour is found.** One shared helper, `inkFor(fill)` in js/util.js: give it what a thing is painted with
  (a colour, or a gradient: gradients now remember their colour stops, so a gradient's colour is the mean of its stops)
  and it gives the outline colour (INK while the setting is Ink). Anything drawn in code uses it: code-drawn bosses
  (every shape of a boss figure is inked in its own fill's shade, and the seams between shapes too), effects,
  projectiles, thrown weapons, particles, puddles, walls, pillars, floor dressing, sewer banks, the convoy's road and
  wagon, the camp's things. **Other lanes (boulder19) can call `inkFor(fill)` where they use INK.**
- **The SVG figures** (heroes, monsters, summons, props): I tried three ways and kept all three to compare:
  - *each pixel* (the default, "Own colour"): the part's own picture is grown outward and darkened, so every stretch of
    edge takes the shade of the colour it edges: a red cloak gets a dark red edge, a steel blade dark steel, a gold rim
    dark gold, the goblin's ears dark green. A figure still reads as one piece.
  - *each part*: each limb in one shade, its commonest colour. Looked worse: a shield arm came out all gold-brown
    round the hand too. Kept only as a test flag (`?olhow=part`).
  - *the whole figure* ("One colour each"): the figure's commonest colour; for a code-drawn boss, the shade most of its
    shapes have. A red slime all dark red; the paladin all dark blue (his cape), shield rim included.
  All are made once per picture size, when the picture is made (no per-frame cost).
- **The shade**: the colour mixed toward the ink colour (a cool dark purple, so shadows lean cool as pixel-art shading
  does), at least 58% of the way for Own colour, 45% for bright (74% "deep" is in the clips only: it was close to ink).
  A pale colour is taken further, so its edge is never lighter than a set darkness: bone, snow, white robes still get
  an edge on a pale floor.
- Clips: `spider-1-ink.mp4` vs `spider-3-own.mp4` at 3 s (the spider's legs ringed deep purple, the slimes dark blue,
  goblins dark green, the paladin's cape dark blue; its bone-white claws stay near ink, as pale things do); `spider-4-own-bright.mp4`,
  `spider-5-one-colour.mp4`, `spider-2-own-deep.mp4`; `drake-1-ink.mp4` vs `drake-3-own.mp4` at 3 s (the drake dark red,
  the boulders dark grey-brown); `idol-1-ink.mp4` vs `idol-3-own.mp4` and the close stills `idol-close-t5-1-ink.png` /
  `-3-own.png` (leaves dark green, bamboo dark khaki, hooves grey-green, the cleric's robe grey). Camp:
  `stills/camp-1-ink.png`, `-3-own.png`, `-4-own-bright.png`, `-5-one-colour.png` (camp clock runs live, so the heroes
  have moved between them).
- **Kept ink** (listed so nothing is a surprise): the health bars' rims (they are HUD), text outlines, the doorway's dark
  opening, eyes, mouths and cracks drawn inside a figure (drawing, not outline), the HUD's rings and marks, the Book's
  boss pictures and UI icons. Protective borders (Guard's gold) keep their colours.

## "I want to see what they look like pixelated"

**Done.** Settings, new group **Pixel look**: *Off*, *Small pixels* (2 points a pixel), *Medium* (3), *Big* (4).

- The room is drawn into a small canvas and blown up without smoothing (js/render.js `drawPixel`). The size is a whole
  number of the screen's own pixels (on the iPhone 11, 2 points = 4 screen pixels), so every pixel is the same size.
- What keeps it from looking merely blurry-blocky: the camera and every unit's middle sit on whole pixels (no shimmer
  as they move; checked: between frames the room moves by whole pixels only, `tools/looks19/shimmer.mjs`); every outline
  is exactly one pixel (it would be under a pixel and smear away at 3 and 4); the floor is painted at the exact pixel
  scale and laid down pixel for pixel (its dressing too); the bars over heads, the boss's bar, the selection ring, menus
  and the party's cards stay sharp. Damage numbers are off in this game; the few words in the fight ("!?", "z") are
  pixelated with the room and still read at 2.
- Cost: cheaper. Draw time per frame in headless Edge (no GPU, same fight, usual zoom): sharp 11 ms, pixel 2 2.5 ms,
  pixel 3 2.0, pixel 4 1.9, pixel 2 + own colour 2.6. Own colour costs the same as ink (11 ms). `tools/looks19/perf.mjs`.
- Clips: `spider-6-pixel2.mp4`, `-7-pixel3.mp4`, `-8-pixel4.mp4` (all at 3 s against `spider-1-ink.mp4`), the same for
  the drake, `idol-6-pixel2.mp4`, and at the game's usual zoom `spider-zoom08-6-pixel2.mp4`. Stills at full resolution:
  `stills/spider-t5-6-pixel2.png` ... `-8-pixel4.png`, `stills/drake-t6-6..8`, `stills/idol-close-t5-6-pixel2.png`.
  The mp4s are compressed, which softens pixel edges a little; the stills are exact.
- Combined with own colour: `spider-9-pixel2-own.mp4`, `drake-9-pixel2-own.mp4`, `idol-9-pixel2-own.mp4`, stills `-9-`.

## Switches and flags

| Setting | Saved as | Test flag (not saved) |
|---|---|---|
| Outline colour: Ink / Own colour / Own colour, bright / One colour each | `delve.olcolor` = ink, mid, light, figure | `?olcolor=ink\|dark\|mid\|light\|figure`, `?olk=0.6` (a shade of your own), `?olhow=pixel\|part\|figure` |
| Pixel look: Off / 2 / 3 / 4 | `delve.pixel` = 0, 2, 3, 4 | `?pixel=2` (any size 0-8, e.g. 1.5), `?pxsmooth=0` (figures sampled without smoothing: harder edges, loses thin details) |

Both apply at once, no reload. Outlines off still wins (no outline of any colour); while Outlines is off the Outline
colour group is greyed like the health-bar styles are. The two combine. Settings still:
`stills/settings-outline-colour-and-pixel-look.png`.

## Calls I made (say if any is wrong)

- **Recommended defaults**: both stay **off** by default (they are exploring); if they keep own colour, my pick is
  **Own colour** (each pixel's own shade, 58% toward ink); for pixels, **2 points** on the iPhone 11 (a hero is about
  18 pixels across at the usual zoom; at 4, about 9).
- The pixel look is for the fight's canvas only: the Book's and battle setup's previews stay sharp, and **the camp stays
  sharp** (its names and labels are painted into its picture and would blur at 2 points a pixel).
- Bars over heads stay sharp in the pixel look (they're HUD); they could be pixelated too if wanted.
- Our summons' outlines take the shade of their blue-grey colours, not their own art's.

## Honest notes

- A thing the colour of its floor loses edge with own colour: a grey skeleton on the crypt's grey flags, the red drake
  on the Ember Deep's red floor. Ink separates them more.
- "Own colour, deep" looked too close to ink to be its own choice (clips only).
- "One colour each" picks the commonest colour, which is not always the one you'd name: the Canopy Idol's comes out
  bamboo khaki (its many stilt pieces), so its leaves get a khaki edge.
- The pixel look is the game drawn small, not hand-made pixel art: figures still turn to any angle, so a turning
  figure's pixels change shape as it turns.
- In the idol clips at exactly 3.0 s the idol flashes pale for a frame as it is struck (the game's hit flash, the same in
  every look); the stills are one frame earlier, without it.

## Code

Shared: js/util.js (`inkFor`, `inkRGB`, `OLCOL`, `OLKEY`, `setOlColor`, `PIXEL`, `setPixel`, `OUTLINE` now a live
binding with `setOutlineWidth`), js/parts.js (own-colour inks of the parts, `inkOf`, `growOwn`, `domOf`),
js/render.js (`drawPixel`, `drawScene`, floor cache), js/sprites.js (props, rats, slimes), js/boss-draw.js (figures),
js/fx.js, js/scenery.js, js/env.js, js/puddles.js, js/foe-draw.js, the fx and boss-fx files, camp-scene, camp-map,
convoy, convoy-art, floors19; Settings in js/camp.js and js/looks.js. No new file the game loads. Every changed line is
marked `(round 19, lane looks19: ...)`. Tools: tools/looks19/ (stills, clips.sh, perf, shimmer, settings-shot).

Checks: every js file `node --check` clean; `node tools/preview-check.mjs` threw / never fired / not offered 0 / 0 / 0;
`node tools/battles.mjs` 532 battles, 0 problems, 11 ran out of time.
