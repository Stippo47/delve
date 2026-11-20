# Environment, round 6 (lane E)

The designer: "The entire environment needs a visual overhaul. Offer like 4 styles." Plus the props notes.

## The four looks (`js/env.js`)
Switch with `?env=1..4` or `setEnv(n)` (saved as `delve.env` in localStorage); `ENV_STYLES` has names and blurbs for
a settings menu. Each covers floor, walls, rock mass, light and the obstacle rock in all three dungeons.

| style | look | Crypt floor | Sewers floor | Warren floor | rock prop |
|---|---|---|---|---|---|
| 1 Carved | the game's own look taken further: rounded tiles, soft gradients, ink outlines, short walls | flagstones | rounded bricks | packed dirt | rock-1 |
| 2 Flat | flat colour, no gradients or outlines, three-tone bevels, crisp geometry | diamond tiles with inserts | hex tiles | floorboards | rock-2 |
| 3 Torchlit | dark, tall walls, torches on the walls, warm light pools baked on the floor, heavier fog | slate slabs | wet cobbles | crazy paving | rock-3 |
| 4 Mosaic | ornate: a tiled border round every floor edge, walls capped with a coloured trim, cut masonry | marble checker | herringbone brick | terracotta basketweave | rock-4 |

Walls are seen from straight above: the floor sits in a pit whose sides slope up to a flat wall top (faces on the
side towards the floor), and free-standing walls show four faces sloping out from a flat top. Faces are lit from
the screen's top left (portrait turns the room, so the light is worked out on screen). Corners are mitred, convex
and concave (L, T, plus rooms). Shadows are top-down: a soft darkening at the foot of every wall, even all round;
obstacles, chests and pedestals get a round soft shadow straight under them. Floor dressing is painted faint on its
own layer with a light outline, so it no longer looks solid or important. Everything (walls included) is in the
floor cache: one drawImage a frame. Painting the cache takes 20-40 ms on a desktop for a normal room, 50-90 ms for
the biggest (software canvas); expect 2-4x on an iPhone 11, once per room during the fade.

## Doors
Shut while the fight is on; open and lit in the room's colour once it's won; when the party picks a door the others
swing shut again. The room's sign sits in the doorway (on the shut leaves or in the lit passage), not on a floor
plaque. Fight is a sword now (a plain X read as "no way" on a shut door); elite is two crossed swords.
The game's camera stops 26 units past the wall, so only the arch's lower part shows; lane F's camera change (pan a
third past the edge) shows the whole arch. `tools/env-shots.mjs` looks 80 units further for its door stills.

## Props (`make_props.py` writes them; renders in `shots/props-board.jpg`)
- `crate.svg`: one crate, 48 room units square (two path cells), bevelled sides like the walls. Drawn at sc 1.
- `barrel.svg`: from above, lid inside the staves and a hoop, 47 across. Drawn at sc 1.
- `brazier.svg`: replaces the broken pillar: stone plinth, iron fire bowl; `#light` glow under it (no outline).
- `rock-1..4.svg`: rounded boulder, low-poly flat facets, a heap of three stones, layered slab rock. r 30.
- `pedestal.svg`: straight above: octagonal plinth, violet cushion; the reward floats over its centre.
- `hazard-oil.svg`: a glossy spill with no ink outline (a liquid), soft dark edge, faint sheen.
- `chest-open.svg`: empty (lane F spills the coins round it), the lid thrown back showing its inside, hasp on its
  far edge, two hinges.
- `fountain-used.svg`: drained: bare basin, a last puddle, a damp trail, moss and dead leaves.
- `door-open-boss.svg`: the doorway kept, the leaves now dark iron with bone studs, bone spikes and a red seam.
- `art/enemies/mimic.svg`: the round-3 mimic rebuilt from the chest's own lid shape, wood, bands and lock plate.

Which obstacle a pillar shows: `obstacleFor` in env.js: r over 29 is the style's rock; smaller ones are crates and
barrels (Warren), pipes, barrels and crates (Sewers), braziers and rocks (Crypt). Crates are square on a round
collider (corners reach r 34).
