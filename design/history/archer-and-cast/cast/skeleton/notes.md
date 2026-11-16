# Skeleton (enemy) — 4 designs

Rendering matches the archer: one heavy #2B2230 outline, no inner lines, soft gradients, lit left and shaded right with a hard seam at x=100, and contact shadows. There are no eyes. **None of the four designs has eye sockets.**
The skull reads as a skull from its light-bulb silhouette, a big closed row of light teeth, and a narrow jaw. The sockets are treated as hidden under the brow ridge, which only shows the archer's warm under-brim shadow fading into bone. The tooth gaps are a mid bone tone, never dark, so it reads as a closed calm grin and not an open mouth.

- **design-1: Pincushion grunt.** Bare cracked skull with one of the archer's arrows (cream fletching) stuck in the back-left of its head, and a notched rusty shortsword held low in the right hand.
- **design-2: Pot-helm spearman.** A dented, rust-blotched iron cooking pot worn as a helmet (handle sticking out back-left, a dent knocked out of the rim). Only the grin shows underneath. Holds a rusty leaf spear upright with both hands on the right.
- **design-3: Skeleton king.** A crooked tarnished gold crown (verdigris on one point), a stiff purple vampire collar flaring behind the skull, and a rusty spiked mace in the left hand.
- **design-4: Gravekeeper brute.** Wider skull with a six-tooth grin and a melted candle stuck on the back-right of its head (wax drips, flat flame, no glow). Holds a rusty scythe two-handed on the left, with the blade sweeping across the front.

Source: build.py (generates the SVGs) and render.py (makes the sheet: `BIG=200 python3 render.py sheet.png archer=... design-1=...`).

## Still weak
- Bone is close to the #EDE6D8 sheet background, so the lit half relies on the outline. This is fine on a darker or greener game ground, but it's weaker than the archer on cream.
- At 40px the skull is mostly carried by the tooth stripes and the split. Designs 1 and 4 can look like a pale egg in some rotations. Their accessories (arrow, candle, scythe) do most of the identification.
- All four share the same skull construction, varied only in proportions (width, tooth count). The silhouettes differ, the faces don't much.
- The free bony hands (design-1 left, design-3 right) float a bit. Being bone on bone, they separate from the skull less clearly than the archer's skin hands do on green.
- The design-3 crown is drawn front-on rather than truly top-down, the same cheat as the archer's brim. It reads fine but is the least "top-down" element.
- design-2's pot shading is meant to read as convex. At some rotations it can still look like you're looking into a pan.
