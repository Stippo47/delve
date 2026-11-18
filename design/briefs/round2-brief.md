# Art round 2: brief (shared by every artist)

The designer looked at every round-1 candidate on their phone and left notes on each. Your job: apply
those notes to your designs **exactly**, render, look hard, fix, repeat. They give direct, specific feedback
and expect it applied as written. Where a note is unclear, make 2-3 labelled versions rather than guessing one.

## Read first
- `HANDOFF.md` section 3 (art direction). Every hard rule there still holds, except where this brief overrides it.
- `docs/DECISIONS.md` (Art section).
- Your class's round-1 files: `design/class-candidates/<class>/design-N.svg` and `notes.md`. Start from those
  SVGs; don't start over unless the note says redo.
- The locked archer: `design/archer-final/archer.svg`. The approved base: `design/base-approved/base-*s-160.svg`.

## Rules for this round (from the designer's notes)
- **Weapons are held below the body, not over the shoulder, and they're bigger.** Long weapons run down and
  forward past the body, pointing where the sprite faces (down, +y), like the archer's arrow.
- **A hand holding a shield is hidden** behind the shield.
- **Capes are straight on and centred** (symmetric about the vertical centre line), and wider where noted.
- Keep the base's head size and shoulder width. Same rendering: one heavy #2B2230 outline (~12) under the shapes,
  no inner lines, soft gradients lit from the left, contact shadows. No eyes/brows/blush on people.
- Sprite: one SVG, front = down (+y), centre (100,100), viewBox "-10 -10 220 220", everything inside it.
  Must read at 40px in all 8 facings.

## Seeing your work
`python tools/riffle/render_board.py --out <your folder>/renders <your folder>/design-1.svg=Label ...`
writes `<name>.png` (archer beside it at the same scale, 8 facings at 70px, the same at game size 40px) and
`<name>-thumb.png`. Open the PNGs with the Read tool and look at them big and small. Do this after every change.
Edge writes the file a moment after it returns; the script waits for it.

## Deliverables (only in your own folder, `design/class-round2/<class>/`)
- One SVG per design, named `<class>-<name>.svg` (e.g. `knight-paladin.svg`; versions `knight-bastion-a.svg`).
- `renders/` from the script above, for every SVG.
- `notes.md`: for each design, each of the designer's notes and what you did about it, one line each, then
  what is still weak. Plain words.
- Don't touch any other folder, don't commit, don't spawn helpers.
