# Character sprites — design brief

We're building the cast for a mobile top-down auto-battler. The ARCHER is finished and approved:
  /home/claude/archer/final/archer.svg      (look at it; render it big)
  /home/claude/archer/final/archer-final.png
It took many rounds to get right. Your character must sit beside it as the same game's art.

## Two words
- RENDERING = how it's drawn. SHARE THIS with the archer exactly.
- DESIGN = silhouette, headgear, parts, how the weapon is held, accessories. DO NOT copy the archer's design.
  The previous attempt failed because it re-skinned the archer's layout (petals→pauldrons, hood→helmet,
  quiver→shield, arrow→sword). The user hated that. Design the character from the character outward.

## Rendering rules (match the archer)
- One heavy dark outer silhouette outline (#2B2230, ~12 units stroke under the shapes). NO inner lines.
- Parts separated by colour and soft contact shadows only.
- Soft top-to-bottom gradients on every form. No sheen streaks, no glow, no texture.
- Split shading: lit on the LEFT, a darker version on the RIGHT, hard seam (on the head it's down the centre x=100;
  side parts use their own centre or are lit/shaded whole by side like the archer's shoulder petals).
- No small details. Big readable shapes.
- NO EYES, no brows, no blush, no dot nose. The archer's face: a soft warm shadow under the brim fading into skin,
  with a tiny subtle mouth curve. Faces that show must read calm — never a dark band that reads as an open mouth.
- Hands are rounded rectangles in the archer's skin gradient (bony variant for undead).
- Palette family: archer uses greens #5FA35A family, gold #F2B53A, wood #A0683A, skin #F2C7A0, cream feathers.
  Pick a character palette that sits well next to it.

## Technical rules
- ONE single sprite. No separately moving parts. The whole sprite is rotated in-game to aim.
- Top-down view (camera above, like the archer). FRONT = DOWN (+y). Rotation centre (100,100).
  viewBox "-10 -10 220 220". Keep outlines inside it (watch weapon tips at the bottom).
- The head/headgear is the body; at most hands + weapon/tool + one accessory. No legs/torso.
- Body roughly a round token ~120 units across like the archer; overhangs modest.
- Must read clearly at ~40px across, in all 8 rotations.
- Hand-written SVG, self-contained.

## Your job
Make 4 GENUINELY DIFFERENT designs of your character (different silhouettes / headgear / weapon holds /
accessories — not colour swaps). Iterate: render, look at your renders with the Read tool at big size and 40px,
fix what's weak, repeat until each would sit proudly next to the archer. Be your own harshest critic.

## Deliverables in your folder
design-1.svg … design-4.svg
sheet.png — one row per design: the archer once at the start of the sheet for comparison, then each design
  ~200px, 8 rotations at ~70px, 8 rotations at 40px; background #EDE6D8; flat ellipse ground shadow.
  Render with /usr/bin/google-chrome --headless=new --no-sandbox --disable-gpu --force-device-scale-factor=2.
notes.md — one line per design (the idea), plus anything still weak.
Don't touch other folders.
