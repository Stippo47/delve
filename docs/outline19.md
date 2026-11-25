# Round 19, lane outline19: one outline, drawn by the renderer

The designer: "Also check that outline thickness is consistent everywhere. Outlines shouldn't if possible be built into
the sprites." Standing rulings: the outline goes on after, over the whole figure (round 2, art round); the gaper,
"everything 30% bigger except the outline".

## Audit (before, a6ec722)

Thickness is given in device pixels on an iPhone 11 at the default zoom (414 x 896 portrait, dpr 2, zoom 0.8: 1.34
px per room unit), measured by `tools/outline19/measure.mjs` (renders every kind at its in-game size and measures the
band of ink between the paint's edge and the outline's, ring by ring; it reads a little high on thin parts such as
legs, bows and bones, where every ring is mostly ink).

| what | how its outline was made | thickness |
|---|---|---|
| units, summons, bosses from SVG parts (246 kinds, `js/parts.js`) | **renderer**: each part's silhouette grown in ink, all inks under all parts, so one line round the whole figure. But grown by 6 **SVG units**, so it scaled with the sprite (gaper, barricades: a hand-set `data-line`) | 1.24 to 6.0 room units (median 2.44): bees and wasps 1.2-1.3, slimelets 1.3, heroes 2.2-2.7, trolls 3.6, the Bone King 4.6, the Elder Ent 5.5, the Gilded Seraph 6.0. Measured 1.9 px (bee) to 8.5 px (seraph) |
| the same art in pages (portraits, faces, the tree) | **baked**: each file's own `#outline` SVG filter on `#sprite` | 6 units of the 220 box |
| props (`art/props`, 30 files) | **baked**: the same `#outline` filter, rasterised with the prop | 6 units of the box, so it scaled with the prop: 1.4 px (small rock) to 4.1 px (big rock) |
| rats, mice (procedural, `sprites.js`) | baked into the drawing: a stroke 16 units of the 220 box | 2.4 room units for a rat, 1.9 for a mouse |
| code-drawn bosses (`boss-draw.js` figure) | renderer (each shape grown in ink, then painted) | **3.6** room units (OL), half again everyone else's |
| projectiles, arcs, debris, code-drawn summons and fx (`fx*.js`, `fxkit.js`) | renderer: `inked` / `inkLine`, `OUTLINE * 2` stroked | 2.4 room units (one constant already) |
| a few hand-set ink widths (the angel's hoops 3.5, shackle 2.75, chain 2.2; the nocked arrow 6 SVG units) | renderer | 2.2 to 3.5 |
| the camp (`camp-scene.js` `ink()`) | renderer, a width per call | 1.2 to 2.4 camp units; heroes ~1.0 |

No part SVG carries a baked outer outline (no file has an ink stroke or a dark under-copy round its outside: the
ink-coloured fills in them are cast shadows at 0.15-0.3 opacity, clipped to the part below). 252 files carried the
unused or prop-only `#outline` filter; 3 carried `data-line`.

Spread, renderer outline, device px (min / 10% / median / 90% / max):

| group | before | after |
|---|---|---|
| heroes (55) | 3.28 / 3.56 / 3.77 / 4.14 / 4.58 | 3.45 / 3.48 / 3.72 / 4.07 / 4.52 |
| summons (21) | 3.10 / 3.37 / 3.45 / 4.09 / 4.22 | 3.27 / 3.44 / 3.58 / 3.93 / 4.19 |
| enemies (135) | 1.91 / 2.45 / 3.69 / 5.01 / 7.69 | 3.32 / 3.41 / 3.60 / 4.40 / 7.23 (the dust devil's thin swirl) |
| bosses/majors (18) | 4.79 / 4.95 / 5.52 / 8.34 / 8.53 | 3.42 / 3.45 / 3.60 / 3.89 / 4.01 |
| props (17) | 1.39 / 1.95 / 2.55 / 2.83 / 4.06 | 2.55 / 2.63 / 2.83 / 3.00 / 3.27 |

(The units' numbers include the anti-aliased edge pixel; the props' are the whole dark band. The nominal width is
2.4 room units = 3.2 px.)

Pictures: `docs/clips/outline19/sheet-before.png` and `sheet-after.png` (every kind at game size, its band in px top
right; `-x3` copies keep the pixels), `ui-before/`, `ui-after/` (the Book: portraits unchanged).

## The chosen thickness

**OUTLINE = 2.4 room units** (`js/util.js`, re-exported by render.js): the median of the old spread (2.44), what every
code-drawn thing already used, and the heroes' within a tenth. Constant on screen at a given zoom whatever the size
of the thing (the gaper ruling, for everything).

## How it works now

- **Figures** (`parts.js`): `getRig(url, px, sizeU)`; the caller says how big the figure is drawn (room units per 220
  box, times an elite's bigness), and the part inks are grown by `lineFor(sizeU) = OUTLINE * 220 / sizeU` SVG units,
  so they come out 2.4 room units after scaling. Sets are cached per art, pixel size and line (4 kept per art). The
  union of grown parts is still one outline over body + separate hands + weapon. Borders (Guard), the bow string, the
  nocked arrow and thrown weapons (`drawHeldWeapon`) use the set's line. `data-line` is gone.
- **Props** (`sprites.js getProp(name, px, linePx)`): the loader takes any outline filter off; the renderer grows the
  silhouette of `#sprite` by the outline in pixels (`OUTLINE * scale * dpr`), on a canvas padded for it. What lies
  outside `#sprite` (the brazier's `#light`) and ground things (`hazard-oil`) are never outlined; see-through shading
  under half alpha doesn't count towards the silhouette (no halos). rock-3's stones are marked `data-ink="own"` and are
  outlined one at a time, so each keeps its line over the one behind.
- **Pictures in pages** (`sprites.js uiArt`): the files have no outline now, so portraits get the old filter put back
  round `#sprite` in a blob URL made at load (`prepareUiArt` for every kind); `inspect.js portrait`, `main.js artOf`,
  `ui-kit.js face`, `stats-ui.js`, `skilltree.js` go through it. They look as before.
- **Procedural rats and mice**: their stroke is `2 * OUTLINE * 220 / sizeU`.
- **Code-drawn**: boss-draw `OL = OUTLINE` (was 3.6); the angel's hoops, shackle and chain `width + OUTLINE * 2`.
- **Camp**: `CAMP_LINE = OUTLINE * HS` for the heroes and every `ink()` thing, so a hero's line is the same share of
  him as in a fight (the camp's things got a little thinner: 1.2-2.4 -> 1.1).

Cost: drawing is unchanged (one ink image and one paint image per part, as before); the inks are built once per set.
`tools/outline19/perf.mjs` (a fight at iPhone 11 size, headless Edge without GPU), frames a second, two runs each:
before 35.2 / 37.8, after 37.6 / 38.0 (the same, within noise). One-off: an elite now builds its own set (its outline thinner than its
bigness would make it).

## The strip

`node tools/outline19/strip-outlines.mjs` (re-runnable, idempotent; `--dry` to see): takes `filter="url(#outline)"`
off `#sprite`, turns it into `data-ink="own"` elsewhere, removes the `<filter id="outline">` definition and
`data-line`. 252 of 262 files changed. It leaves interior lines (seams, folds, eyes, door planks) and reports files
with ink-coloured strokes: the doors and fountains (soft 0.2-opacity shadows) and the legacy whole sprites
`art/archer.svg`, `knight.svg`, `rogue.svg`, `boss.svg` (round 1, no live kind uses them). **After merging the hero
lanes (melee19, rogue19, caster19), run it again**: their new or edited files will carry the filter back.

## Clips

`docs/clips/outline19/<name>-before.mp4` / `-after.mp4` (`tools/outline19/clips.mjs`, zoomed in): `sizes` (troll,
orc, goblins, bees, slimelets against four heroes), `seraph` (an SVG boss), `engine` (a code-drawn boss), `room` (a
dungeon room with props).

## Left / worse

- Big bosses read lighter with the line at a hero's weight (the seraph, the Elder Ent, the Great Engine): that is the
  rule, but it is the most visible change; their silhouettes still read on the floor. A call for the designer.
- Small marks keep their own lighter ink on purpose (snowflakes and stars `1.4 + OUTLINE * 1.2`): too small for the
  full line.
- The convoy's road scene uses its own widths in its own units (trees and rocks 2.4-2.5, much the same).
- The measuring reads high on dark-painted art and thin parts; the sheets are the check.
