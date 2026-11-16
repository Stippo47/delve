# Class sprites on the approved base — brief

## What's approved
- ARCHER (finished): /home/claude/archer/final/archer.svg — render it big and study it.
- BASE BODY (approved by the user after many rounds): /home/claude/archer/base/set-a8/
    base-1s-160.svg (Bowl), base-2s-160.svg (Swept), base-3s-160.svg (Crop)  <- 160-wide shoulders = approved
    sheet: /home/claude/archer/base/set-a8/sheet.png
  Build EVERY class on these proportions: same head size (~92–100 wide, fits the archer's hood footprint),
  same hand size (~24x21), shoulder mass ~160 wide x ~64 deep centred ~8 units in front of head centre.
  The HEAD is the round collision token; shoulders/weapons/capes are detail outside collision.
  You may use any of the three heads (or a bald/skull variant for the skeleton) under the class gear.

## Rendering (match the archer)
- One heavy dark outer silhouette (#2B2230, ~12 stroke under the shapes), NO inner lines.
- Soft top-to-bottom gradients, lit from the left. Hard light/dark centre split is OPTIONAL (only where it helps).
- Faces: NO eyes, no brows, no blush. Soft gradient shadow, tiny calm mouth (match the archer's face).
- No small details; big readable shapes. Contact shadows between overlapping parts.

## Technical
- ONE single sprite, rotated whole in-game. Top-down camera. FRONT = DOWN (+y). Centre (100,100).
  viewBox "-10 -10 220 220", outlines must stay inside it.
- Weapons/tools should point FORWARD (down) like the archer's arrow, so the sprite aims where it faces.
- Must read at ~40px in all 8 rotations.

## Lessons from the last failed round (user's words / reactions)
- "Everything else is buns." Closest liked: rogue designs ("almost got the idea"), some farmer designs,
  barbarian design-1 Wildmane and design-2 Bearskin ("genuinely not bad"). Old sheets: /home/claude/archer/cast/*/sheet.png
- Skeleton round: "didn't even try out different designs for the actual SKELETON, just its decorations."
  -> vary the character itself, not only accessories.
- An earlier attempt failed because it re-skinned the archer's layout. Design from the character outward;
  share the BASE BODY and RENDERING, not the archer's specific parts.
- Heads too big / faces too narrow / kid-like were rejected. Keep the approved base proportions.
- Shoulders: the user wants them visible and centred-ish (approved 160). Class gear goes on/over them
  (pauldrons, fur mantle, cloak, bones, etc.).

## Your job
4 genuinely different designs of your class on the approved base. Render, look hard at big size and 40px, fix,
repeat until each would sit proudly next to the archer.

## Deliverables (your folder)
design-1.svg … design-4.svg
sheet.png — rows: archer, the approved base (base-1s-160), then one row per design: ~200px, 8 rotations ~70px,
  8 rotations at 40px; background #EDE6D8; flat ground-shadow ellipse. Same scale for every row.
  Chrome: /usr/bin/google-chrome --headless=new --no-sandbox --disable-gpu --force-device-scale-factor=2
notes.md — one line per design + what's still weak. Don't touch other folders.
