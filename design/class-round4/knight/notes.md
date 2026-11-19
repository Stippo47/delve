# Knights, round 4 (fixes to the picks)

Built from `design/class-round3/knight/` by `_src/F/knights.py` (paths are relative to the script).
Parts, group ids and pivots are unchanged unless said. Renders in `renders/`.

**Hand rule, everywhere:** every weapon fist is now a fist wrapped round the handle: longer along the handle than
across it, a row of knuckle bumps down the outer side, turned to the handle's angle (it was a round blob square to
the sprite). Shield hands stay hidden.

## Paladin: `knight-paladin.svg`
- Hand rule only. The sword moved 3 units out so the turned fist still shows past the pauldron.
- Suggested move: **Shield bash** - a short dash into the nearest enemy that knocks it back and stuns it for a moment.
- Weak: unchanged from round 3 (the blade can't get longer inside the box).

## Old Guard: `knight-old-guard.svg`
- "If two-handed, hold in the middle, in front": both fists are now on the grip at the centre of the body, in front
  of the beard, with bare grip showing between them; the blade comes forward past the beard. Because it is held in
  front, `#arm-r` is now drawn **after** `#body` (it was before). Still two-handed: `#arm-r` only, no `#arm-l`.
- The blade is shorter (66 to the tip, was 95): held in the middle it can't run as far forward inside the box.
  The sword casts a soft shadow on the beard below it.
- Suggested move: **Great sweep** - a wide, slow arc in front that hits every enemy in it.
- Weak: the blade crosses the beard on a diagonal (forward and to his right). Pointing straight down it would hide
  the beard and need to be shorter still.

## Dame: `knight-dame.svg`
- Hand rule only (the sword moved 3 units out so the turned fist shows).
- Suggested move: **Riposte** - after blocking a hit with her shield, her next swing comes fast and hits harder.

## Tower: `knight-tower.svg`
- "Eye slots": two dark horizontal slots either side of the centre, under the white crest.
- "Bad mace, use others as reference, maybe a flanged mace": a new flanged mace. A steel head with flanges (two seen
  edge-on at the sides, a raised centre flange, dark grooves between), a gold collar, a small end knob, on a longer
  wooden haft. The head is about 1.4x the old one. The fist wraps the haft.
- Suggested move: **Hold the line** - plants the tower shield: much less damage from the front, and taunts nearby
  enemies for a few seconds.
- Weak: the mace head is steel-grey beside a steel-grey helm; at 40px it reads by its shape more than its colour.

## Bulwark: `knight-bulwark.svg`
- "Hold the spear a bit further back": the fist grips about 10 units further back on the shaft (bare shaft shows
  between the fist and the head), and the spear sits a little further out so the fist still shows at the pauldron.
- Suggested move: **Brace** - sets the spear: the first enemy to come in range is hit hard and stopped.

## Griffon: `knight-griffon.svg`
- "Helmet weird. Opening bigger and different shape, too narrow": the face opening is now a wide open face with
  cheek guards, open right down past the chin (round 3's was a small oval). The long gold beak that covered the middle
  of the face is cut down to a short gold brow peak.
- "Hammer small": the hammer head is about 1.3x bigger (50 x 28, was 40 x 22) on a longer, thicker haft.
- Suggested move: **Leap strike** - jumps onto a far enemy and slams the hammer down, hurting everything round the landing.
- Weak: still the busiest knight (wings, crest, peak). If the small peak still reads as "weird", it can go.

## For whoever animates these
- Old Guard: `#arm-r` now draws after `#body` (in front). It still swings round 150 108.
- The body's shadow on each weapon is clipped to the weapon at rest (as in round 3).
