# Art round 3: brief (shared by every artist)

The designer picked their favourites from round 2 ("they are looking really good") and left notes. **Every pick
becomes its own unit in the game**, so each design must read as a different character at 40px. Apply the notes
**exactly**; where one is unclear, make 2 labelled versions rather than guessing.

## Read first
- `design/briefs/round2-brief.md`: every rule there still holds (style, sprite box, parts, the outline filter),
  except what this brief changes.
- `docs/DECISIONS.md`, the "Round 3" section.
- Your round-2 files in `design/class-round2/<class>/` (SVG + notes.md). Start from those SVGs.

## The outline filter (changed after round 2)
Use this rounder filter, exactly (the one in round2-brief squared off points):
`<filter id="outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/><feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge><feFlood flood-color="#2B2230"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
The round-2 SVGs already carry it; keep it.

## New rule for weapons (the designer: "this rule is going to go for many weapons")
- **Weapons sit further forward and are drawn *behind* the body and shoulder, not on top of it.** The weapon passes
  under the shoulder and pokes out forward (down, +y) past the front of the body. Only the fist that grips it shows
  where it comes out, at the front edge of the body.
- To do this, put that arm's group **before `body`** in the file: draw order is file order, and the game will draw
  the groups in the order they appear. Keep the group ids and `data-pivot` the same.
- **Shields are the exception**: a shield stays in front, with the hand hidden behind it.
- **Weapons bigger**: several are still too small, handles especially. Long tools (scythe, fork, spade, hammer)
  need long handles.
- Two weapons in two hands (daggers, two swords): both arms behind the body, weapons spread a little apart.

## Deliverables (only in your own folders under `design/class-round3/`)
- One SVG per design, `<class>-<name>.svg`.
- `renders/` with `python tools/riffle/render_board.py --out <folder>/renders <svg>=Label ...` for every SVG.
  Open the PNGs with the Read tool, big and at game size, after every change. The script deletes the old PNG
  first, so what you see is fresh.
- `notes.md`: per design, each of the designer's notes and what you did, one line each; then what's still weak.
- Don't touch other folders, don't commit, don't spawn helpers.
