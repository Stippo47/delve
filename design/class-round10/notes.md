# Art round 10 (lane A, round 13): the art-round8 and art-round9 notes, the big sun blade, the slime

Every note in `docs/riffle-log/2026-11-22-round12.txt` (decks art-round8, art-round9; the art remarks in v12-bosses),
then the two art lines of the designer's message (`docs/BUILD-v6.md`).

How it was built. The round-8 and round-9 generators were copied into `_src/` (`A2/`, `E3/`, `E1r4/`, `croc8.py`). A fix
to a design the designer saw is one argument or switch of its copied generator (`tail=`, `ORC_R10`, `CROC_R10`,
`troll10(head, arms)`, `wolf(paws=, scar=, mane=, body=)`, `ent(face=)`, `elder_ent(face=)` ...), with the note quoted
beside it; `_src/check10.py` calls every copied generator without them and checks it still gives the file the designer
saw byte for byte, then checks `_src/build10.py` rebuilds this folder byte for byte. Redraws ("bad quality", "Meh",
"REDO") are new code in the heroes' A2 library (`A2/bandits10.py`, `A2/wild10.py`, ...).
Renders (`_src/render10.py`), in `enemies/renders/`:
- a single design: `<name>.png` (big at its size in the game beside the archer, 8 facings, the 8 facings at game size
  beside the archer), `<name>-thumb.png`, and `<name>-before.png`: the exact file the note was on, on the same board;
- a set of variants: one board `<group>.png` (what you saw first, then each variant, labelled, at game scale; a row at
  game size in four facings each), `<group>-thumb.png`, `<group>-before.png`.
`_src/game10.py` copies into `art/` only the single fixes and redraws. **Where the note asked for variants the game
keeps its current art until one is picked.** `_src/look.py` makes scratch sheets in `tools/riffle/out/r10`.

## 1. The art-round8 notes

Variants waiting for a pick (the game is unchanged):
- **Ghost A**, "Tail is still a bit weird. Try 3 types.": `ghost-a-tail-point.svg` (a plain soft point straight back),
  `-stub.svg` (short and round, an egg), `-hem.svg` (a bell ending in three rounded scallops). Only the tail's outline
  points differ from the ghost you saw. Board `ghost-a-tails.png`.
- **Ghost B**, "Same thing": the same three tails on Ghost B (`ghost-b-tail-*.svg`). Board `ghost-b-tails.png`.
- **Troll**, "Try different heads. Make them slightly smaller keep boulder same size.": three heads on the round-8
  troll, nothing else changed: `greenskin-troll-head-a.svg` (a wide jaw with two big tusks at the corners of the mouth,
  long ears swept back, a heavy brow), `-b.svg` (a big potato nose over a small mouth with one snaggle tooth, a mop of
  moss hair), `-c.svg` (a broad flat-topped head, two stubby horns, a row of blunt teeth). Read as: the troll a little
  smaller (10%: r 60 -> 54, vr 44 -> 40), its boulder the size it is now; the board shows them that way with the
  boulder where the game puts it. Board `troll-heads.png`.
- **Troll**, "Make version without arms. Just hands": `greenskin-troll-hands-a/b/c.svg`: the same three heads with the
  two long arms left out, only the fists on the boulder. Board `troll-hands.png`.
- **Wolves**, "Show me wolves without paws": `wild-wolf-nopaws.svg`, `wild-dire-wolf-nopaws.svg` (with its new mane
  and body), `wild-alpha-nopaws.svg`: the same wolves with the two front paws left out. Board `wolves-nopaws.png`.
- **The Alpha**, "Change face scar": `wild-alpha-scar-claws.svg` (three raking claw marks over the left of the skull)
  and `wild-alpha-scar-snout.svg` (one long old scar down the snout with three stitch marks). Board `alpha-scar.png`.
- **Thornback boar**, "I could see it almost working. Don't like it rn yet. Make variants.": drawn again in the wolves'
  build (a capsule body, a ruff, a round skull, a blunt snout with the pink disc, tusks curving up from its sides):
  `wild-boar-ridge.svg` (a crest of dark bristles down the spine with three big thorns in it), `-quills.svg` (a coat
  of quills over the whole back, pale at the tips), `-plates.svg` (three overlapping horn plates, a thorn at each end).
  Board `boar.png`.
- **Ent**, "Face variants": `wild-ent-face-brow.svg` (two leaves for eyebrows, a wide mouth turned down),
  `-nose.svg` (a fat snag of a nose with a leaf growing on it), `-hollows.svg` (two knot-hole eyes and a jagged carved
  mouth: the one with eyes). Only the front of the head differs. Board `ent-faces.png`.
- **The Elder Ent**, "Change face. 3 versions. They should also be very big": `wild-elder-ent-face-brows.svg` (heavy
  moss eyebrows in a scowl, a wide mouth with peg teeth), `-nose.svg` (a great snag of a nose, a moss moustache
  drooping into the beard), `-glow.svg` (hollow knot-hole eyes and mouth lit from inside like a lantern). Board
  `elder-ent-faces.png`. **Very big, in the game now**: js/elderent.js r 64 -> 80, vr 48 -> 60 (about three heroes
  across; it was two and a half).
- **Sproutling**, "Don't like.": three new takes, all small with no face: `wild-sproutling-bulb.svg` (a walking
  turnip, its leaves lying back), `-acorn.svg` (an acorn under its cap, one leaf on the stalk), `-bud.svg` (a closed
  pink bud in three sepals on a rosette of leaves). Board `sproutling.png`.

In the game (`_src/game10.py`):
- **Orc** (`greenskin-orc.svg` -> art/enemies/orc.svg), "Move tusks to the side... While at it fixe hair": the two tusks
  stand at the corners of the mouth (they stood in the middle of it); the topknot is tied with a bone ring and a thick
  tail of hair falls back from it to a tuft (it was a ball with a thin stick behind it). Nothing else.
- **Croc** (`sewer-croc.svg` -> art/enemies/croc.svg), "Fix axe": the two grey slabs half under the snout (cut off by the
  box) are real axes clear of the head: a shorter haft, one bearded steel blade turned out with a bright edge, a dark
  iron eye and a small poll. Same fists and places.
- **The bandits**, "Overall the bandits were all bad quality", and the Chief, "Meh. Could be done better": all nine
  drawn again (`A2/bandits10.py`). The gang's red bandanna and rag-edged leather are kept; each now has headgear with
  real shapes in it, its own colour, a bigger weapon drawn like the heroes' (blades split light and dark), and
  something on the shoulders:
  - `bandit-sword.svg` (art/enemies/bandit.svg): a dented iron pot helm with a riveted rim and a ridge, a mail collar; a
    broad sword; a round shield with an iron rim and boss and a band of the gang's red.
  - `bandit-torch.svg`: a battered slouch hat on the farmers' hat (stitched brim, a nick, a red band), a green neck
    cloth; the torch held out in front of the left fist, the sword on the right.
  - `bandit-greatsword.svg`: a shock of black hair in back-swept spikes, a mustard headband knotted at the side; a
    great sword in both fists across the front.
  - `bandit-axe.svg`: a fur hat with a thick pale band and a striped tail hanging back (it sways), a wool collar; a big
    bearded axe, the blade turned out.
  - `bandit-spear.svg`: a moss-green hood with a long tail and a scalloped mantle; a long spear with a rag of red tied
    under its head.
  - `bandit-daggers.svg`: a slate cowl drawn to a peak over the brow, a paler rim round the face; a long curved knife in
    each hand.
  - `bandit-poacher.svg`: an olive hunter's cap with a pointed turned-up brim and a long pheasant feather, a scruffy
    beard (no mask: not one of the gang), a wolf-fur mantle, the bow in front, the net on the back.
  - `bandit-brute.svg`: bald and scarred, a spiked iron pauldron strapped on the right shoulder, a fur collar; a great
    club bound with spiked iron bands, a wrapped left fist.
  - `bandit-chief.svg`: a wide black cavalier hat, one side pinned up, a gold band and a great red plume sweeping back
    over it; long black hair; a black coat with red facings, gold buttons and gold-fringed epaulettes, a short red cape
    behind (it sways); a big gold-hilted cutlass and a smoke bomb with a lit fuse.
- **Dire wolf** (`wild-dire-wolf.svg` -> art/enemies/dire-wolf.svg), "Mane not big enough. Body also 10% bigger": the
  tufted mane's radius is 25% bigger with longer tufts and a second darker layer inside it; the body capsule is 10%
  wider and longer (it grows back and out; the head, tail and paws are where they were).
- Checked on `python -m http.server 8897`: `tools/labshot.mjs` sheets of the nine bandit kinds, the orc, croc, wolves
  and Elder Ent in every pose, and a `tools/clip.mjs` run in the Wildwood: no page errors.
