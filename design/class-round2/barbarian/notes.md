# Barbarians, round 2

All files use the parts layout with the brief's outline filter and no baked outline strokes. Head and shoulders are
the approved base (`base-1s-160`). Pivots: `arm-l` at 40 108, `arm-r` at 160 108.

Every weapon is one-handed, so each sprite has two arm parts: one holds the weapon and the other is a free fist, and
both can swing. Wildmane, Bearskin and the Berserker hold their weapon in `arm-r`. Warhelm holds the hammer in `arm-l`.

Contact shadows are clipped to the shapes underneath them, so they never stick out past the figure. Under the outline
filter, anything semi-transparent past the edge picks up its own faint grey outline.

Weapons are held low at a front corner. They run down past the body with the point or head forward (+y), and stay
inside the 220 box with the outline.

Renders are in `renders/`: one board and one thumbnail per SVG.

## Wildmane: `barbarian-wildmane.svg`
- "Sword position. Below body not above.": the sword is in the right hand at the front-right corner. The blade runs down past the body, point forward like the archer's arrow. Only the pommel knob shows above the fist.
- "Bigger sword.": the blade is 42 wide (was 30) and 63 long. The crossguard is 70 wide (was 60). The blade is split light/dark down its centre ridge.
- "Otherwise pretty good.": mane, fringe, forked beard and fur mantle are unchanged. The second hand on the grip is now a free left fist.
- Still weak: the fist with the pommel just above it still reads a little like a thumbs-up. The blade can't get longer without leaving the box. The cream fur goes muddy on the shaded side (unchanged from round 1).

## Bearskin: `barbarian-bearskin-a.svg` (spiked club), `barbarian-bearskin-b.svg` (war axe)
- "Weapon position makes it hard to see": the weapon is out of the face. It sits in the right hand, low and to the side, clear of the snout and fangs, pointing forward.
- "If that's a spiked club it doesn't look right": a is a new club. It is a pale wooden bat shape that thickens toward the end, with four iron spikes out of the sides, one at the tip and two nail heads on top. It is lighter than the fur, so it doesn't sink into the bear.
- "(or try another weapon)": b is a double-bit war axe. It reads the clearest of everything at 40px.
- "What I can see looks good": the bear-head helm, snout, fangs, mantle and paws are unchanged.
- Still weak: the right paw's claws are now mostly under the weapon. In some facings the club's spikes run into the jagged fur edge. The square-dilate outline makes the fur points blocky at big size.

## Warhelm: `barbarian-warhelm-a.svg` (layered pauldrons), `barbarian-warhelm-b.svg` (spiked dome pauldrons)
- "Hammer bad": new warhammer. A flared striking block sits on the outer side and a beak spike on the inner side, on an iron collar with a gold band. The haft now shows between the hand and the head. The old one was a flat slab.
- "Positioning of hammer bad": the hammer is in the left hand at the front-left corner, with the head down past the body, off the face and beard.
- "Helmet midline slightly off": the helm is now split light/dark exactly on the centre line (x=100). The nasal ridge is centred on 100 and split on the same line, so the midline is one clean line.
- "Shoulder pads could maybe be improved": the note was open, so there are two options. a: three overlapping steel lames with a gold edge, no spikes. b: a round dome with a gold rim and one big spike pointing outward. Round 1 had a plate with three small spikes.
- "Can't see beard well now": the hammer and hands are off the beard now. The beard is a warmer, lighter brown so it separates from the face and helm.
- "Otherwise not bad": horns, helm shape and gold brow band are kept.
- Still weak: the face is a thin strip between the brow band and the beard. The hammer head is still smallish at 40px. The right fist sits on the beard's edge.

## Flail Berserker: `barbarian-berserker-a.svg` (leather strap), `barbarian-berserker-b.svg` (wolf pelt)
- "Good.": the face, jaw beard and spiked right pauldron are kept.
- "Same weapon problems.": the flail is in the right hand at the front-right corner. The handle, two chain links and the ball hang down past the body. The ball is bigger: about 29 across the ball and 44 across the spike tips. Round 1 was about 24 and 36.
- "I don't like the striped shoulder design.": the woad stripes are gone. The note doesn't say what should replace them, so there are two options. a: bare shoulder with one leather strap over it. b: a grey wolf pelt on the shoulder.
- "Some of the bangs where the mohawk should be peek out.": the hair's front edge is now one smooth line across the forehead, with no fringe points. The red crest is symmetric, split light/dark down its centre, and its base covers the hair edge, so nothing shows through it. Its shadow falls only on the hair, not the face.
- Still weak: the chain is short, because the hand sits high on the pauldron front to leave room for the ball inside the box. The raised left fist is unchanged. Version b's fur echoes Wildmane's mantle.
