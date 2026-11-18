# Knights, round 2

All SVGs use the parts layout: `#sprite` (outline filter) holding `#back` (cape, pivot 100 88), `#body`,
`#arm-l` (pivot 50 108) and `#arm-r` (pivot 150 108). There are no outline strokes in the shapes. Contact shadows
are clipped to whatever lies under them, so they never stick out past the figure and thicken the outline.
Renders are in `renders/` (archer beside each one, 8 facings, game size).

## Paladin: `knight-paladin.svg`
- "Hand when holding shield should be hidden." The left hand is gone. The heater shield in `#arm-l` covers where it was.
- "Longer/bigger sword, angled inwards." The blade is about 70% longer and wider (22, was 16), with a sharper point.
  It is angled 34° in, so it runs down past the chin to the front centre, the way the archer's arrow does.
- Rule: the cape was already symmetric about the centre line. I kept it.
- Still weak: the cape's scalloped hem still reads a bit cloud-like, and the helm and pauldrons are close in value.
  The sword can't get much longer: its tip is already at the bottom edge of the frame.

## Old Guard: `knight-old-guard.svg`
- "Sword short." It is now a greatsword: blade 80 long and 26 wide (was about 58 by 18), with a bigger guard and pommel.
- "Holding pose is weird." The hands no longer clutch the grip up at the cheek. Both fists sit on the right
  pauldron and its front edge, and the sword crosses the front of the body diagonally, point forward-left. It is
  two-handed, so it lives in `#arm-r` with both hands and there is no `#arm-l`.
- "Cape wider and straight on." He has a new crimson cape, symmetric and 184 wide (the widest of the knights). The
  red wedge of a shield slung on his back, which read as an ear or horn, is gone.
- "Beard not meshing with balding hairline." The fringe, sideburns and beard are now one white hair piece. The fringe
  runs round the back of the bald crown, comes down the sides past the ears (new skin-coloured ears break it there)
  and flows into a shorter spade beard. The moustache stands in for the mouth.
- Still weak: the diagonal hold is my reading of "weird". If he meant something else, the other option is the
  sword nearer the centre line, which forces it short again because of the frame. The guard passes close to the
  moustache. The fur collar was dropped, because the hair ring covered it and only stray cream bumps showed.

## Dame: `knight-dame.svg` (gold circlet) and `knight-dame-tiara.svg` (gold tiara)
- "Fix cape to be straight." The teal cape is now symmetric and centred, with two soft fold bands. The braid runs
  down its middle.
- "Hand on shield hidden." The right hand is gone. The kite shield in `#arm-r` covers it, and the shield is slightly larger.
- "Golden crown or accent on head." Two labelled versions. Circlet: a gold ring round the head with a teal gem on
  the brow, the stronger read at 40px. Tiara: a gold band along the front hairline peaking at the parting, with a
  gem. It is prettier up close but smaller in the game.
- "Bigger cooler sword." A longer leaf-shaped blade, widest near the tip, with a gold ricasso, swept gold quillons
  curving forward, a ruby pommel and a gem at the guard. It is angled in, like the Paladin's.
- "The hair shadow onto face isn't orange like the hair." The shadow the hair casts on the face is now a warm
  auburn (#B0481F at 60%), not grey. The face gradient itself is unchanged.
- Still weak: the circlet can look a little like a halo from straight on. The swept quillons are the finest detail
  on the sheet and turn into a gold flick at 40px.

## Bastion (redo, 3 versions): `knight-bastion-a.svg`, `-b.svg`, `-c.svg`
Each one is built so that helm, shoulders, shield and weapon each have their own colour and shape:

- **A "Tower"**: a closed steel great helm with a white crest running front to back and a gold nasal bar.
  Three stepped dark-iron lames per shoulder, with a gold rim on the front lame. A tall red tower shield with a gold
  rim and boss on the left (hand hidden). A flanged steel mace in the right hand.
  Still weak: there is no face, so it's the least "person". On the left, the shield hides most of the stepped lames.
- **B "Bulwark"**: a wide steel kettle-hat brim with a domed crown, and the chin and mouth showing under the brim.
  Big round bronze pauldrons. A round green shield with a gold rim and boss on the left (hand hidden). A long spear
  with a broad leaf head in the right hand.
  Still weak: the hat is a large plain grey disc, and it reads more as a foot soldier than a heavy knight.
- **C "Griffon"**: a round steel bascinet with the face showing and two gold wings swept back and out. Huge squared
  purple spaulders with gold front rims. A cream heater shield with a purple chevron and gold rim on the right (hand
  hidden). A warhammer in the left hand.
  Still weak: the two spaulders and the cloth between them merge into one purple slab across the back. The wings
  push the silhouette wider at the top than the others.

## For whoever animates these
- The arm groups' contact shadows are clipped to the body as drawn. When an arm swings, its shadow clip moves
  with it, which is barely visible for small swings.
- Old Guard is two-handed: `#arm-r` only.
