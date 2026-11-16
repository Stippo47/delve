# Archer sprite — variant brief

Base sprite: /home/claude/archer/archer.svg  (sheet: /home/claude/archer/archer-sheet.png)
The user said this base is "better… close, but not quite there". Your job: make 3 variants of it,
each a slightly different take on the art style. YOU decide what changes — be thoughtful, make each
of your 3 variants different from each other, and make each a genuine design decision.

Vibe reference from the user (look at it, do NOT copy it — the result must be an original design):
/mnt/user-data/uploads/b88fa83e-image.jpg  (a mobile-game hooded hero icon: top-down, hood point at the
back, face peeking under the brim, hands/scarf at the front, weapon tip poking out the front)

## Hard rules
- ONE single sprite. No separately moving parts. In the game the whole sprite is rotated to aim.
  Front = DOWN (+y) in the file; rotation centre (100,100); keep the art within viewBox "-10 -10 220 220".
- It's only the archer: a head (hood) and, at most, hands on a bow (arrow pointing forward). No body/legs.
- Top-down view, clean flat VECTOR art. Stay CLOSE to the base. Moderate changes only.
- NOT allowed (too extreme): 2.5D / 3D / isometric / perspective, neon or glow, pixel art, painterly or
  textured looks, sketchy/hand-drawn wobble, photoreal, radically different character concept.
- NOT enough on its own: a palette swap, or only changing the eye shape. A variant must change the
  style in a noticeable but moderate way.
- Must stay readable and appealing at in-game size (~40px across) at all 8 rotations.

## Examples of the kind of change that's in bounds (examples only — choose your own)
rounding off the hood / making it bubblier · rounded-rectangle hands · removing the eyes · different
shadow treatment · soft gradients instead of hard shading · no sheen/highlights · uniform line thickness
everywhere · extra leaf petals layered over the hood/shoulders · different brim/scarf treatment ·
different bow construction · lineless shapes · thicker outer outline only · etc.

## Deliverables (in your own folder, given in your task)
- variant-1.svg, variant-2.svg, variant-3.svg  (hand-written SVG, self-contained)
- sheet.png: for each variant, one row: the sprite large (~200px), then 8 rotations (~70px), then
  8 rotations at 40px, on background #EDE6D8 with a soft flat ellipse ground shadow under each.
  Render with headless Chrome (/usr/bin/google-chrome --headless=new --no-sandbox --disable-gpu
  --force-device-scale-factor=2 --screenshot=...). Look at your renders with the Read tool and iterate
  until each variant is genuinely good — fix anything clipped, muddy at 40px, or awkward when rotated.
- notes.md: one line per variant naming the style change and why.

Don't modify the base files or other agents' folders.
