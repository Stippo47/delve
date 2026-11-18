# Archer split (round 2)

`archer.svg` is the locked archer (`design/archer-final/archer.svg`) rebuilt into the parts layout. The shapes,
colours and gradients are copied unchanged. Only the layering and the outline method changed.

## Parts
- `back`: the quiver (tube, gold rim, three feathers).
- `body`: petals, hood, brim, face.
- `arm-l` (pivot 52 118): the bowstring (`id="string"`), the flatbow with its dark tips and grip, and the hand holding it.
- `arm-r` (pivot 148 118): the arrow (shaft and `id="arrowhead"`) and the drawing hand. The game pulls this part back.
- The baked #2B2230 under-strokes are gone. The brief's `#outline` filter on `#sprite` draws the outline now.

## Designer's notes, and what I did
- "Don't change how it looks": shapes, colours and gradients are identical. The differences are listed below.
- "Bow and the hand holding it in arm-l": done, with the string.
- "Drawing hand and arrow in arm-r so the game can pull them back": done.
- "Quiver in back": done. Nothing overlapped it, so moving it behind the petals changes nothing.
- "Remove the baked outline strokes, use the outline filter": done. The filter is copied exactly from the brief.
- "Check they match big and at 40px": `renders/archer-compare.png` shows the original, the split, and the split with a rounder filter, big and at 40px. `renders/archer.png` is the standard board.

## How close it is
- At 40px they look the same. Differing pixels are about 11%, which is anti-aliasing noise along the outline.
- At 540px, 4.4% of pixels differ, almost all of it outline. The filter uses a square dilate, so:
  - diagonal edges come out up to about 1.4x thicker;
  - sharp points get flat, squared-off outline ends: the hood tip, the petal tips, the arrowhead tip, the quiver corners.
  - The baked strokes were round, so this cannot be matched while the brief's filter is used exactly.
- With the rounder filter below, the big-size difference drops to 2.0%. I'm suggesting it, not using it.
  It is the same idea built from three dilates, so the outline comes out nearly round:
  `<feMorphology in="SourceAlpha" operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/><feComposite in="a" in2="b" operator="over" result="ab"/><feComposite in="c" in2="ab" operator="over" result="d"/>`, then the same flood / composite / merge.
- Changes I had to make:
  1. **The arrow now draws over the bow hand.** `arm-r` is always drawn above `arm-l`, so the shaft shows as a thin
     line across the bow hand, and the arrowhead covers the hand's bottom 4 units. The other order would hide the
     arrowhead under the bow hand as soon as the arrow is drawn back, so I think this is the right one.
  2. **The string stays with the bow (`arm-l`).** If it moved with `arm-r`, its ends would leave the bow tips. While
     drawing, the game should move the string's middle point (100,156) by the same offset as `arm-r`.
  3. Removed the drawing hand's contact shadow. It was invisible in the locked look, and under the filter it left a
     grey ghost below the hand.
  4. Clipped the brim and feather contact shadows to the shapes underneath them. Semi-transparent shadows that stick
     out past the figure would otherwise pick up a faint grey outline of their own.

## Still weak
- The square-dilate outline at big size: blocky points and thicker diagonals. This is the filter, not the parts.
- The arrow over the bow hand is a small visible change from the locked look (see 1 above).
