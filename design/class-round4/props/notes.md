# Props, round 4 (section P)

The designer's notes: "the boulders and traps need overhaul, as well as the chest visual", and "doors still aren't
good: the opening should have a coloured glow representing the room".

**Scale.** Every prop is drawn at the hero sprites' scale: the archer's head (radius 22 room units) is 56 SVG units,
so **1 room unit = 2.545 SVG units**. That is why the same outline filter (radius 6) gives the same outline as the
heroes (the game's `OUTLINE` 2.4 room units). A 220 box (`-10 -10 220 220`) is **86.4 room units** across; draw it
at that size, centred on the prop. The doors use a 360 box (`-80 -80 360 360`), **141.4 room units**. Each file's
comment says where its centre sits.
Same rendering as the sprites: the round-3 outline filter exactly, light from the top left, soft gradients, tone
instead of inner lines. The obstacles leave out the ground shadow, because the game draws its own.

**Upright.** The chests, pedestal and spike trap are drawn a little from the front (spike tips point up the
screen), so draw them upright on screen the way the game already draws chests and pedestals. The 8 facings rows in
the renders don't apply to props. The rock and pillar look best upright too: the light stays top left.

Renders are in `renders/`, one per SVG (the archer is beside each one; the door boards are shown at 0.6x because of
their bigger box). Two true-scale context boards:
- `renders/scene.png`: a wall with four doors, every prop on the floor, the archer for scale.
- `renders/door-glows.png`: the door shut and open, then all seven room glows side by side.

Sources: `../_src/P/make_props.py` writes every SVG; `../_src/P/scene.py` makes the two boards.

| file | what | size in room units |
|---|---|---|
| `obstacle-rock.svg` | low-poly boulder, lit top facet, dark underside, two pebbles | drawn at r 30; scale by r/30 (range 22-36) |
| `obstacle-pillar.svg` | fluted column on a square plinth, top snapped off, a fallen drum, rubble | drawn at r 30 (corners/drum reach ~36); scale by r/30 |
| `obstacle-crates.svg` | big crate, small crate stacked on it, barrel beside | drawn at r 30; scale by r/30 |
| `trap-spikes-down.svg` | square iron plate, 3x3 holes with the tips just showing | plate 49 square, for r 30; scale by r/30 (range 24-34) |
| `trap-spikes-up.svg` | the same plate, nine steel spikes up | as above |
| `hazard-oil.svg` | flat lobed oil splat, lighter shallow rim, rainbow sheen, wet highlights, drips | drawn at r 38 across, 28 front to back; scale by r/38 (range 34-52) |
| `chest-closed.svg` | free chest: domed planked lid, gold bands, gold hasp, lid lip over the front | 49 wide x 46 deep |
| `chest-locked.svg` | keyed chest: darker wood, studded iron bands, big brass padlock (key colour) | 49 wide x 46 deep |
| `chest-open.svg` | lid up behind, box of gold coins and a ruby; `#glow` (warm light, 3 sparkles) has no outline | 49 wide x 57 deep (the raised lid adds 11 at the back) |
| `door-shut.svg` | stone arch with a keystone, doorstep, planked double door, iron straps, ring handles | 112 across, the wall band 26, the arch rises ~20 past it |
| `door-open.svg` | the way in: leaves swung back, dark passage, no glow | as above |
| `door-open-<kind>.svg` | the passage lit in the room's colour; `#spill` (no outline) throws light ~70 room units onto the floor | as above; spill reaches ~70 into the room |
| `fountain.svg` | lobed stone basin, blue water and ripples, a splashing spout | r 38 (the game's collider) |
| `fountain-used.svg` | the same with the water low and grey, the spout dry | r 38 |
| `pedestal.svg` | short round plinth, a violet cushion with gold trim; the reward floats over the cushion centre (SVG 100,77) | 40 wide |

## Boulders and pillars
- "Boulders need overhaul": the old one was a flat grey disc. There are three kinds now, each a different
  silhouette: an angular rock, a square plinth with a broken column, and a stack of crates.
- The rock went through two tries. A smooth blob read as a potato, so it is now chunky low-poly facets.
- The pillar was a plain circle at first and didn't read. A fallen drum lying across the plinth corner is what
  makes it say "column".
- Weak: the pillar's broken top is busy at 40px. The crates are plain. With the barrel, the crate stack is not
  quite round, but it fits r 30.

## Spike trap
- "Spikes look bad": the old ones were grey dots on a disc. Now it is a square dark-iron plate with nine holes.
  Down, only the tips glint. Up, nine bright steel spikes stand out against the dark plate, easy to tell apart at
  game size.
- I chose square over round. The collider stays round, and the plate's corners reach about r 35 at r 30.
- Unsure: there is no "about to rise" state. The game could flash the holes, or show the down sprite with the tips
  tinted.

## Oil
- The old oil looked like a black boulder (see the s2c clip). The first redo looked like a beetle: an oval with four
  drops as legs. It is now a flat lobed splat with a lighter shallow rim and a darker deep middle, a rainbow sheen,
  wet highlights along the lit edge, and drips on different sides.
- Weak: the heavy outline still makes any puddle feel a bit solid. A thinner outline only for liquids would help,
  but it would break the one-outline rule, so I left it.

## Chest
- "The chest visual needs overhaul": closed, open and locked are each their own SVG.
- The closed chest is the **mimic's chest on purpose** (same wood, gold bands, size), so a mimic is a surprise.
  The domed lid and the lid lip overhanging the front keep it from reading as a crate.
- Locked = needs a key. It is told apart by iron bands instead of gold and a big brass padlock in the key pickup's
  yellow, so "key opens this" reads at a glance.
- Open: the lid stands up behind, and the box is full of coins with a glow. The game can fade `#glow` after the
  loot is taken.

## Door
- "The opening should glow in the colour of the room": the passage is filled with the room's colour, brightest in
  the middle. The doorstep is tinted, and `#spill` throws soft light rays onto the floor (the game can pulse it).
  Colours are the game's `DOOR_COL`: fight #C8553D, hazard #E0884B, elite #8E3B5B, treasure #F2B53A,
  fountain #5DB7E0, choice #9B7BD6. **Boss** is a near-black passage with a crimson core, red embers and a dark,
  smoky spill instead of light.
- The door is a stone arch with a keystone, drawn face-on into the wall (like Isaac's doors), not a coloured slot.
  Shut is a planked double door. Open (the way in) has the leaves swung back and a dark passage.
- Orientation: the room is +y. Box centre (100,100) = the middle of the doorway on the room's edge (the wall's inner
  face). Rotate so +y points into the room: the right-wall exits turn -90°, which is "up" on the phone.
- **Unsure:** the arch stands about 20 room units past the wall's outer edge, so it needs that much drawn space
  outside the room. If the camera crops there, the arch can be squashed or the keystone dropped.
- Weak: fight red and hazard orange are close at a glance. Elite purple-red is dark on the dark wall. The spill is
  faint on the cream floor in a still frame, but pulsing should help.

## Fountain and pedestal
- Fountain: a round basin to match the fountain door's blue. The used version is grey and still, so a spent
  fountain reads as spent.
- Pedestal: a stone plinth with a violet (choice colour) cushion. It is drawn a little from the front, like the
  chest.
- Weak: the pedestal looks a bit like a spool, and the fountain's centre a bit like a badge from far away.
