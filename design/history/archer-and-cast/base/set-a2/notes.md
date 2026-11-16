# Base human, set A2: resized to the archer's HEAD (hood + face only)

Each bare head (hair, face and ears) now sits roughly inside the hood footprint (about 118x140, x41..159, y14..155). Hands are archer-size (24x21, rx 8). Crop's fists are slightly heavier at 26x23. The sheet's top row is the hood alone for size comparison, and the second row is the full archer.

1. **Bowl** (base-1.svg): a round skull under a brown bowl cut with three chunky fringe lobes and a round bun at the crown. The face is the lower crescent. Small ears sit under the sideburns, and two fists are raised symmetrically at the front corners. It uses the archer's hard split, with a lighter shade side than set A.
2. **Swept** (base-2.svg): a narrow egg head with an open face. The blonde side-swept fringe lock has pointed tips, and the rest is pulled into a thick tail trailing back-right. Small ears. Both hands are angled together at front-left for a two-handed grip. Soft side shading, with no hard split.
3. **Crop** (base-3.svg): a broad squarish head with a wide jaw. Short tufty copper crop cut high, with big jug ears. Square fists are held wide at the front corners. Hard split. The fringe was lowered from set A so the face plane is less blank.
4. **Mop** (base-4.svg): a small face sunk in a two-layer cloud of dark-brown curls. The curls hide the ears and fall past the cheeks. One hand leads in front of the chin and the other rests out at the right side. Soft side shading. The opening in the hair is rounder than in set A, so the face no longer reads as a beak.

## Still weak
- At this size the faces are small. At 40px each face is a skin patch of a few pixels with no readable mouth. Facing direction comes from the face patch plus the hands, which still works in all 8 rotations.
- Bowl: at 90° and 270° it still reads a little like a chestnut (a dark dome with a pale bite). The bun is barely visible at 40px.
- Swept: the paired angled hands sit on the left jaw and can read as a paw. The tail sticks out past the hood footprint at the back-right, as the archer's quiver does.
- Crop: the fists sit outside the hood width, so the overall sprite is wider than the others. It can look crab-like at 45°.
- Mop: it's the darkest of the four. The side hand rests on the hair and can look like a detached block. Its curls are slightly wider than the hood (about 128 units).
- All four heads are rounder and wider at the top than the pointed leaf hood. They fit the hood's width and height, not its point.

build.py is the generator. It scales the design paths about (100,100), keeps the outline at 12 units, and allows hard, soft or no split per part. render.py renders the sheet.
