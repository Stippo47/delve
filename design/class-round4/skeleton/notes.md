# Skeletons, round 4 (fixes to the picks)

Built from `design/class-round3/skeleton/` by `_src/F/skel.py`. It reads each round-3 SVG back into shapes, changes
them and writes the same structure (shapes in `<defs>`, contact shadows, the `#shX` side shade). Renders in `renders/`.

**Hand rule, all six:** each weapon claw is now a bony fist wrapped round the handle: a long palm along the handle
and four knuckle bones down its outer side, turned to the handle. Round 3's claws sat square to the sprite with the
fingers pointing down, whatever the handle did.

**Jaw, all four Rattlers:** the lower jaw is its own bone below the skull, with a dark gap between (the outline fills
it), so the head reads as a skull plus a jaw, not one shape.

## Rattler: `skeleton-rattler.svg`
- The closed grin painted on the skull is gone. Now: the cranium with its upper teeth hanging free, a gap, then a
  separate lower jaw with its own teeth. The sword claw is turned to the grip.
- Suggested move: **Rattle** - when it dies it falls into a heap and gets back up once, a few seconds later, at half health.

## Rattler, bow: `skeleton-rattler-jawless-bow.svg`
- Has a lower jaw again (separate, below a gap). The bow claw is turned across, along the bow's grip. The drawing claw
  holds the arrow's end at the chin, turned along the arrow; that arm (`#arm-r`) now draws after `#body`, so the claw
  sits over the jaw like the archer's hand.
- Suggested move: **Volley** - looses three arrows in a fan.
- Weak: the arrow is shorter, because the drawing hand moved down onto the jaw.

## Rattler, spear: `skeleton-rattler-jawless-spear.svg`
- Has a lower jaw again, below a gap. The spear claw is turned to the shaft.
- Suggested move: **Lunge** - a long-reach thrust that pierces through the first enemy into the one behind.

## Rattler, mace: `skeleton-rattler-loosejaw.svg`
- The crooked loose jaw hangs 3 units lower, so the gap under the skull shows at game size. The mace claw is turned
  to the handle.
- Suggested move: **Skull crack** - a mace blow that dazes the target, slowing its attacks.

## Gaper: `skeleton-gaper.svg`
- "30% bigger": the skull, jaw, shoulder knobs and vertebrae are scaled 1.3x about the centre; the trailing vertebrae
  are tucked in 14 units so they stay in the box. The swords are 12% longer and re-placed under the wider shoulders,
  pointing forward and out. Pivots moved out with the shoulders (22 100 and 178 100).
- "No eyebrows, too mad, too sharp": the brow ridges are gone, and the slanted angry sockets are now big, round, calm
  ones. The open hanging jaw (now a separate bone) and the long skull keep it apart from the Rattlers.
- Move (the designer's, from the roster): **Charge and spin** - a piercing charge with the swords in a V ahead, ending
  in a rapid spin with the swords out to the sides.
- Weak: big and round, it now looks more goofy than menacing; it may have gone too far the other way.

## Brute: `skeleton-brute.svg`
- "15% bigger": the body, skull, jaw, tusks and shield are scaled 1.15x about the centre. The right pivot moved out to 170 104.
- "Axe flipped": the axe is mirrored, so the blade now faces in toward the body and the back spike points out. It is
  also 10% bigger and held a little higher. The claw is turned to the haft.
- Move (the designer's, from the roster): **Raise shield** - an action: while raised it turns slowly and blocks only
  damage from the front 180 degrees.
- Weak: I read "axe flipped" as the blade facing the other way (inward). If it meant upside down (head up by the
  shoulder), that is a different change.
