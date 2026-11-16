# Base human: set C2 (resized redo of set C)

**Size.** The heads are drawn in a roomy design space and then scaled down 0.70–0.72, so each bare head (hair, face and ears) sits inside the archer's hood footprint. Each head is about 118–125 wide and 130–150 tall, ending around y 155–165. Hands are drawn unscaled at the archer's size, 24x21 with rx 8 (base 3's are 21x25), in the archer's hand gradient.
**Rendering.** One #2B2230 outline, no inner lines, lit from the left, no eyes, and a tiny calm mouth. The faces now use a SOFT shadow that builds toward the right instead of the hard split. The hair split is used only where it helps: Mop and Curtains keep the hard archer split, while Egg + Bun and Cloud use the soft gradient.
**Sheet.** The rows are hood only (for size), the archer, then base-1 to base-4. Source: build.py. The sheet comes from render.py, and cmp.py overlays the hood on each base.

1. **Mop**: a round head under a heavy ginger-chestnut bowl mop with three fat fringe lobes. The ears show at the lower sides, and the fists are up just in front of the chin corners like a boxer's guard. Hard hair split.
2. **Curtains**: a wide head with centre-parted slate-violet hair falling in two curtains to the front corners, framing a narrow face window. No ears. Two hands are stacked in a front grip right of centre. Hard split on the part.
3. **Egg + Bun**: a long egg head with a narrow chin forward and wheat hair pulled back. One big side-swept fringe covers the brow, a round bun sits back-left, and the ears are round. Upright mitten hands hang at the flanks, angled forward. Soft shading.
4. **Cloud**: a big scalloped cloud of warm-brown curls, with a small round face pushed out the front like a moon. The lead fist is forward-left and the rear fist is cocked by the right cheek. Soft shading.

## Still weak
- **Egg + Bun:** the bun, both ears and both hands at the flanks make five similar bumps. At 40px it can read as a bear or mouse head with paws, and its facing is the weakest of the four.
- **Cloud:** the soft-shaded cloud is mostly one brown ball at 40px. The face is a small crescent, and the hands carry the facing.
- **Mop:** at 40px it is a brown ball plus four bumps (two ears, two fists). It reads, but it's plain.
- **Curtains:** this has the strongest facing read (a C-shape opening forward). The hand stack is slightly off-centre and overlaps the right curtain tip.
- **Space:** the heads now leave a lot of empty space at the front and sides of the sprite. That's intended, since class gear such as the archer's petals and bow will fill it, but on its own each base looks small next to the full archer.
- **Mouth:** it is drawn at 3.3 units in head space, so it survives the 0.7 scale. It is still nearly invisible at 40px, the same as the archer's.
