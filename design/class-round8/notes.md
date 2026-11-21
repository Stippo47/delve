# Art round 8 (lane A, after the round-9 answers): the art-round7 notes, then real art for the placeholder kinds

Part 1 starts from the exact file the designer saw: the round-7 generators were copied into `_src/E3/` and checked to
rebuild the round-7 files (and the round-6 troll, `art/enemies/troll.svg`) byte for byte before anything changed; each
change sits behind a switch (`ORC_R8`, `GHOST_R8`, `TROLL_R8`) with the note quoted, and `_src/check8.py` turns them
off and checks the copies still give the files the designer saw. Renders: `<folder>/renders/<name>.png` (the board:
big beside the archer, 8 facings, game size) with `<name>-before.png` beside it: the tile the note was on (part 1), or
the placeholder the game showed (part 2). Scripts: `_src/build8.py`, `_src/render8.py`, `_src/check8.py`,
`_src/game8.py` (the game copies), `_src/look.py` (scratch look-over sheets into `tools/riffle/out/r8`).

## Part 1: the notes
- **Orc** (`enemies/greenskin-orc.svg`), "Wider mouth": the mouth line runs x 74..126 (it ran 84..116), same height, bow and line; the tusks stay where they were, still coming up out of the mouth. Nothing else.
- **Ghost A** and **Ghost B** (`enemies/ghost-a.svg`, `ghost-b.svg`), "Remove the sliver on their back for this and the other ghost I liked": the narrow darker fold that ran from the middle of the head back into the tail is gone on both. Nothing else.
- **Troll** (`enemies/greenskin-troll.svg`, its boulder `props/troll-boulder.svg`; board `boards/greenskin-troll-boulder.svg`), on the round-6 troll ("Liked this ones overall shape more. Fix face and make like 2x bigger overall and will look pretty good. Also needs a boulder"): the round-6 hump, moss patch, small head and ears as they were; the face: the drooping nose (read as a trunk) and the dark patch above it (a hole) are gone, a big round nose and a heavy underbite with two small tusks coming up out of the mouth instead; a boulder: both fists reach forward on long arms and rest on a big round grey boulder in front of it (the game's boulder is its own object, so it is a prop of its own; the log club is gone, the boulder is its weapon); 2x: in the game it is now twice the archer across (js/enemies.js r 42 -> 60, vr 31 -> 44, mass 3 -> 6), and the board shows it at that size.
