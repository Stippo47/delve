# Base human head — brief

We're building the cast for a mobile top-down auto-battler. The ARCHER is finished and approved:
  /home/claude/archer/final/archer.svg  (render it big and look at it)
Before any more classes, the user wants ONE BASE HUMAN to build every class on: a bare head with
FACE, HAIR and HANDS. No hat, no hood, no armour, no weapon, no class props. Classes come later, after the
user approves the base.

## Feedback from the last round (study these before starting)
Look at the sheets in /home/claude/archer/cast/*/sheet.png.
- User: "The rogue agent almost got the idea. Farmer got pretty close too with some of its designs.
  Berserker [barbarian] 1 and 2 are genuinely not bad. Everything else is buns."
  -> barbarian design-1 (Wildmane) and design-2 (Bearskin), rogue designs, farmer designs = closest.
- "The skeleton one didn't even try out different designs for the actual SKELETON, just its decorations."
  -> Lesson: when asked for different designs, vary the THING ITSELF (head shape, proportions, how the face
  sits, hair shape and mass, ears, hand shape and placement) — not accessories.

## Rendering (match the archer exactly)
- One heavy dark outer silhouette (#2B2230, ~12 unit stroke under the shapes). NO inner lines.
- Parts separated by colour and soft contact shadows only. Soft top-to-bottom gradients.
- Shading: lit from the LEFT. The hard centre split (light left / dark right) is OPTIONAL — the user says not
  everything needs it. Use it only where it helps; a simple shadow side or gradient is fine.
- No small details; big readable shapes. No sheen streaks, no glow.
- NO EYES, no brows, no blush, no dot nose. Face reads through shape, shadow, and at most a tiny mouth curve
  (like the archer). It must read calm, never like an open mouth.
- Skin like the archer (#F2C7A0 family, the archer's hand gradient). Hands = rounded rectangles like the archer's.

## Technical
- ONE single sprite, rotated whole in-game. Top-down camera like the archer. FRONT = DOWN (+y).
  Rotation centre (100,100). viewBox "-10 -10 220 220".
- SIZE (the last round got this WRONG — heads were far too big): match the archer's HEAD, not its whole sprite.
  The archer's head is only the hood + face opening: /home/claude/archer/final/archer-hood-only.svg
  (hood ~118 wide x ~140 tall, face opening ~76 wide). The archer only looks big because of its shoulder
  petals and bow. Your bare head (hair + face + ears) must fit roughly inside that hood footprint, and hands
  must be the archer's size (~24x21). Comparison of the last round's mistake: /home/claude/archer/final/size-compare.png
- Hands placed so a weapon could later be added; but no weapon now. The hands should still make the
  facing direction readable.
- Must read at ~40px in all 8 rotations.

## Your job
Make 4 genuinely different base humans (different head shapes / proportions / face placement / hair masses /
ears / hand treatments). Iterate: render, look at big size and 40px, fix, repeat. Be your own harshest critic.

## Deliverables in your folder
base-1.svg … base-4.svg
sheet.png: archer row first for reference, then one row per base: ~200px, 8 rotations ~70px, 8 at 40px,
  background #EDE6D8, flat ellipse ground shadow. Chrome: /usr/bin/google-chrome --headless=new --no-sandbox
  --disable-gpu --force-device-scale-factor=2
notes.md: one line per base + what's still weak. Don't touch other folders.

## ROUND 4 NOTE — make them read as ADULTS
User: "all of these base humans look like children/kids to me. Don't read as adults."
Kid cues to remove: big perfectly round head with a small round face, chubby round cheeks, tiny mouth low in a
round face, huge fringe over a small face, mitten hands that are big relative to the head, perfect symmetry.
Adult cues to add (still chibi, still top-down, still no eyes): longer/taller face with a defined jaw and chin
(more length below the hairline), flatter/angled cheek planes instead of a ball, a higher or more natural hairline
(less forehead coverage), slight asymmetry in hair, a hint of neck/shoulders or collar mass under the head so the
head isn't the whole body, hands a touch smaller/flatter. Optional facial hair / stubble shadow as a variation.
Archer face now uses a SOFT GRADIENT on the shadow side (no hard split) — match that.
