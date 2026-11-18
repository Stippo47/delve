# Skeletons, round 3

Five picks, six files (the jawless one has two labelled versions). Every file uses the round-3 outline filter exactly,
the parts layout from round 2, and the new weapon rule: **the weapon arm's group comes before `#body` in the file**, so
the handle runs under the shoulder ball and skull and only the claw gripping it shows, below the shoulder. Shields stay
in front (the Brute's). An empty claw stays in front, as before.

Draw order per file:
- Rattler, loose jaw, jawless spear: `#arm-r` (weapon), `#body`, `#arm-l` (empty claw).
- Jawless bow: `#arm-l` (bow, string, bow claw), `#arm-r` (arrow, drawing claw), `#body`.
- Gaper: `#back` (vertebrae), `#arm-l` (sword), `#arm-r` (sword), `#body`.
- Brute: `#arm-r` (axe), `#body`, `#arm-l` (shield, claw hidden behind it).

## Rattler (`skeleton-rattler.svg`)
- "No rib cage, or pull it back more": the collarbone arc under the chin (the part that read as ribs) is gone. Nothing is left in front of the skull; the shoulder balls sit against its sides.
- "Overall good": skull, grin and rusty notched sword are unchanged in look.
- Weapon rule: the sword is behind the shoulder and skull and comes out forward; the blade is a little wider (25).
- Still weak: with no collarbones, the empty left claw floats free under the left ball (the base's hands float the same way).

## Rattler, no jaw: two versions
- "Same": no rib cage, as above.
- "Give a bow or spear": both made.
  - `skeleton-rattler-jawless-bow.svg`: a round recurve bow held out in front, limbs running back under the shoulder balls, an arrow nocked and a claw drawing the string just under the hanging teeth. Set up like the archer: the game pulls `#arm-r` back and should move the string's middle point (100,153) with it.
  - `skeleton-rattler-jawless-spear.svg`: a long one-handed spear; the shaft runs under the right shoulder, the butt shows behind it, and a clear leaf head (sharp tip, darker right half for a midrib) points forward on a thin shaft.
- Still weak: at 40px the bow version is a skull inside a ring, close to the archer's layout. The drawing claw is small and sits against the teeth.

## Rattler, loose jaw (`skeleton-rattler-loosejaw.svg`)
- "Same": no rib cage.
- "Give him a mace": a spiked mace (round iron head, 7 spikes, iron collar, rust) on a handle that runs under the right shoulder.
- Still weak: the spike tips pick up square outline corners from the filter.

## Gaper (`skeleton-gaper.svg`)
- "Give 2 long swords": one long, narrow sword in each claw (blade about 66 long, 12 wide, wide crossguard). Both arms are before the body, so the swords run under the knobbed collarbones. They are spread outward 14 degrees each.
- "Make look a bit angry": the sockets now have flat tops slanting down toward the nose, with a faint brow ridge above each. This is the clearest change at 40px.
- Kept: the long skull, hanging jaw, coat-hanger collarbones and trailing vertebrae.
- Still weak: to make the swords long inside the sprite box, the claws sit beside the cheeks (y about 123), a bit further back than the rule's "front edge of the body".

## Brute (`skeleton-brute.svg`)
- "Give shield": a round wooden shield (three plank tones, iron rim, iron boss, rust) in the left claw, drawn in front; the claw is behind it and hidden.
- "Can't tell what weapon is": the cleaver is now a big bearded axe: a crescent head with a bright edge, a back spike and an iron collar, on a long haft running under the right shoulder.
- Kept: the heavy skull, tusks, underbite and big shoulder balls. The collarbones stay; the "rib cage" note was for the Rattlers only.
- Still weak: the axe head sits low and to the right, so the figure leans right at some facings.

## Shared weak points
- Bone on the beige board is low contrast; the outline does the work.
- Sharp tips (spikes, sword points, the chipped dome) get square outline corners from the filter.
