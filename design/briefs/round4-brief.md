# Art round 4: brief (shared by every artist)

Round 3 landed well: the designer picked most designs and now wants **many more units**. This round has fixes to
the picks, about 40 new heroes, enemy redos and new enemy families, and new props. Every design becomes its own
unit in the game, so it must read as a different character at 40px from everything else in the game.

## Read first
- `design/briefs/round2-brief.md` and `design/briefs/round3-brief.md`: the style, sprite box, parts layout, outline
  filter and weapon rule all still hold, except what this brief changes.
- `docs/DECISIONS.md`, the "Round 3" and "Round 4" sections.
- Look at the finished round-3 SVGs (`design/class-round3/*/`) and their renders to match the house style:
  big round head (the base's head size), shoulders, soft gradients lit from the left, contact shadows, one heavy
  outline from the filter, no inner lines, chunky readable shapes. **People have no eyes, brows or mouths**
  (monsters may have simple eyes). The designer said one redo was "losing the style": stay in this style.

## Rules (new this round, from the designer)
- **Every hand that holds a weapon or tool is turned to match the handle**: the fist wraps the handle, its
  knuckles along the handle's direction, never a round blob stuck on at an odd angle.
- **Two-handed weapons are held in the middle, in front** (both fists on the handle in front of the body).
- Weapons still sit behind the body and shoulder and come out forward, only the fist showing (round 3 rule);
  shields in front with the hand hidden.
- **Sizes: Gaper +30%, Brute +15% (skeletons)**; heroes keep the base size; enemy sizes are given per section.
- Each design gets a line in notes.md: **a suggested move** for it (one simple ability, a sentence). The designer
  decides; this is only a proposal for the roster card.

## Rendering, deliverables, limits
- `python tools/riffle/render_board.py --out <folder>/renders <svg>=Label ...` for every SVG; open the PNGs with the
  Read tool big and at game size after every change.
- Write only in your own folder(s) under `design/class-round4/`. One SVG per design, named `<group>-<name>.svg`.
  A `notes.md` per folder: per design, the note(s) you were given and what you did, the suggested move, what's weak.
- Generator scripts, if you write any, go in `design/class-round4/_src/<your section>/` with **paths relative to the
  script file** (never an absolute path: they contain a private user name).
- Don't commit, don't touch other folders, don't spawn helper agents. Don't use the browser pane: render with the script.
