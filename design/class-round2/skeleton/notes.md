# Skeletons, round 2

All six SVGs use the parts layout from the brief: `<g id="sprite" filter="url(#outline)">`, and inside it
`#back` (Gaper only), `#body`, `#arm-l`, `#arm-r`. There are no baked outline strokes; the filter draws the outline.
Contact shadows only fall on parts that are underneath, so they don't thicken the outline. Each shape is a named
`<path>` in `<defs>` (for example `skull`, `jaw`, `ball-l`, `blade`), so it can be edited by hand.
Weapons point forward (+y) and sit below the body. Every tip stays inside the viewBox, outline included.

Rules applied to all of them:
- **Eye sockets:** two dark sockets above the nose. They are the main read at 40px.
- **No split down the middle:** the skull has one soft gradient, lit from the left, plus a soft highlight on the dome.
- **No rib cage:** removed everywhere (only Hollow had ribs).
- **Nose the right way up:** an upside-down heart, point toward the top of the skull, two lobes toward the teeth.
- **No hood-like shadow:** I removed the brow-shade band. I also moved every bone off the top of the skull. In round 1 the
  collarbones and shoulder ridges curved along the upper sides of the dome, and that curved band looked like a hood
  edge. Now the shoulder bones sit beside or below the skull.
- **Size:** the skulls are at the base head size (checked with the base head outline laid over each one). Round 1's
  were taller.

## Rattler (`skeleton-rattler.svg`)
- Remove rib cage: it had none. I also dropped the shoulder-blade ridges, because they looked like hood edges or horns.
- Eye sockets: added.
- No split: done.
- Nose: turned the right way up.
- The bigger, below-the-body weapon rule: the rusty notched sword is now longer and wider. It is held in the right
  claw, angles slightly inward, and its tip runs past the body.
- Body: shoulder balls, with collarbones that curve under the chin and meet at a small breastbone, like a collar.
  Left claw is empty.
- Still weak: the plainest of the set. At 40px it reads as "skull with a grin and a sword".

## Rattler variants
- `skeleton-rattler-jawless.svg`: **no lower jaw.** The skull stops at the upper jaw, and five long upper teeth hang
  free and make the bottom edge. The collarbones show through under them.
  Still weak: at 40px it looks a lot like the main Rattler. The difference is the missing dark mouth band.
- `skeleton-rattler-loosejaw.svg`: a chip broken out of the dome (top left), one bigger socket, and the lower jaw
  hanging loose and crooked from one hinge, with a tooth missing.
  Still weak: the jagged chip picks up square corners from the outline filter. The lower teeth are small at 40px.

## Gaper (`skeleton-gaper.svg`)
- Hood shadow: gone. That was the collarbones wrapping the top of the skull, plus the brow band. The coat-hanger
  collarbones now run straight out from under the chin to knobbed ends.
- No split: done.
- Eye sockets: added. They droop slightly at the outer corners.
- Nose: yes, it was the wrong way round. Now point-up.
- Kept the long, narrow skull and the jaw hanging open (the ink between the teeth is the open mouth). Three vertebrae
  trail behind the skull in `#back`, which has a pivot so it can sway.
- **The spear is two-handed: both claws and the spear are in `#arm-r`, and there is no `#arm-l`.** The spear is held
  low at the right side, not over the shoulder, with a bigger rusty leaf head.
- Still weak: the hanging jaw puts the head about 15 units past the base head at the front. That is the design. The
  vertebrae pick up square corners from the outline filter. The left side has nothing in hand, so it's a bit lopsided.

## Brute (`skeleton-brute.svg`)
- Remove the arm bones: done. Bony knuckle fists now float in front of big shoulder balls, like the base's hands.
  Short thick collarbones join the balls to the chin, so the balls don't look loose.
- Similar edits (sockets, no split, nose, no hood shadow): done. The sockets are low and flat for a frown.
- Skull scaled down to roughly the base head (a little wider at the cheekbones, since it's the brute).
  The underbite jaw shows its lower teeth over the upper jaw. The tusks are shorter and set outside the sockets.
- Cleaver: bigger, held in the right fist, with the blade running forward. It has a notch, a hole and rust.
- Still weak: it's the widest (about 156 from shoulder ball to shoulder ball, before the outline). The square stance can still read a bit
  boxy. The cleaver is a plain slab at 40px.

## Hollow (`skeleton-hollow.svg`)
- Same edits: ribs removed, sockets added, no split, nose turned, no hood shadow.
- With the ribs gone, the "hollow" is now in the eyes: the biggest, deepest sockets of the set, on the tall, narrow
  skull with the pointed chin.
- Fencer stance kept: the right shoulder is forward and the left is back. The back hand now rests on the hip instead
  of being raised (round 1 said it looked like a wave).
- Rapier: longer and a bit thicker. The cup guard sits in front of the fist and hides most of it, and it points
  straight forward.
- Still weak: the rapier is still the thinnest weapon and reads as a line at 40px. The hip hand is a plain mitten.

## Shared weak points
- Bone against the beige board background is low contrast. The outline does most of the figure/ground work.
- The outline filter's square kernel makes small square corners on sharp tips and gaps (chipped dome, vertebrae,
  hanging teeth). This is the same for every class.
