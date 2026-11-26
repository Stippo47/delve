# Round 19, lane bases19: normal people built from layers

The designer (round 19, chat): "I want you to make some "normal" looking bases. No armour or equipment, maybe just a
basic sack tunic, then a bunch of hair styles and skin colours, facial hair, jewelry. U can also play around with
different body types like fat, brutish, skinny, feminine if u can, etc."

Branch `bases19`. Nothing existing was redrawn: no hero or enemy art changed. Draft deck (checked with `riffle check`
and `riffle fit`, not sent): `tools/riffle/decks/r19-bases19.json`, the base card first.

## What was asked, what was done, where to see it

| Their words | What I did | Where it shows |
|---|---|---|
| "some "normal" looking bases. No armour or equipment" | One plain person first, then everything else on top of it. It is the approved base human (design/base-approved/base-1s-160.svg: the same head path, ears, 148-wide shoulder band, 24x21 fists and bowl cut) with no gear at all, split into the heroes' parts (body, arm-l, arm-r, and a back part when the hair has a tail), same pivots, no outline in the file. | `docs/clips/bases19/boards/base.png` (large, then game size in four facings); `base.mp4`: eight of that one person, walking 0-3 s, punching from 3 s |
| "maybe just a basic sack tunic" | The shoulders are undyed sackcloth with a rough weave (short ticks, a hem at each sleeve end). Five more tunics: patched, a rope over one shoulder, sleeveless, torn sleeves, a collar in a second colour. Nine dull cloth colours. | boards `tunic-*.png`, `cloth-*.png` |
| "a bunch of hair styles" | Twenty: bald, shaved, short crop, bowl, side-swept, combed back, shaggy, curly, afro, bun, topknot, ponytail, long loose, bob, two braids, long braid, bunches, locs, mohawk, balding. Three are the approved bases' own hair. Nine hair colours. | boards `hair-*.png`, `haircol-*.png` |
| "and skin colours" | Seven from pale to deep, plus four fantasy ones (moss, slate, ash, ember) that are never rolled unless asked for. One colour each: the face, ear, fist and bald-head shading is worked out from it the way the heroes' two skins are shaded. | boards `skin-*.png` |
| "facial hair" | Ten and clean: stubble, moustache, moustache and goatee, goatee, mutton chops, short beard, full beard, long beard, braided beard, forked beard. | boards `beard-*.png` |
| "jewelry" | Eleven, any together: hoops, studs, nose ring, pendant, bead string, torc, armbands, bangles, rings, cloth headband, circlet. Gold, silver or copper per person. | boards `jewel-*.png` |
| "different body types like fat, brutish, skinny, feminine if u can, etc." | Seven outlines: average, skinny, fat, brutish, feminine, old, young. Each has its own shoulder shape, fist size and place, jaw (the three approved head shapes plus a full-cheeked one) and posture; not the base scaled (only young and old are also drawn a little smaller). | boards `body-*.png`; in motion in `crowd.mp4` and `close.mp4` |

In the game: a test unit, **Villager** (battle mode, the "No dungeon yet" tab). Every villager is a different
person, rolled from the layers the first time it is drawn; it walks, breathes and throws its fists in turn with the
game's own outline round it.
- `docs/clips/bases19/crowd.mp4` (12 s): twelve against twelve at about game size. Walking in 0-2.5 s, the brawl after.
- `docs/clips/bases19/close.mp4` (9 s): seven against seven, close. Walking 0-3 s, punching after.
- `docs/clips/bases19/base.mp4` (8 s): the base alone, eight copies.
- Boards: `docs/clips/bases19/boards/` (105 pictures, one figure each, 1440 px wide: the figure large, then at game
  size in four facings on a floor green and on a dark tone) and `boards/thumbs/` (a square of the large figure).
  Twenty random full mixes: `mixes-01.png` to `mixes-20.png`, straight from the roll, none hand-picked.

I watched all three clips (frames pulled with ffmpeg) and a fourth test of ponytails only: the parts split, the
outline hugs the whole figure, fists alternate, the tail is its own part behind the head.

## How it is built
- `js/folk.js` (new, no DOM): the layers and `folkSvg(spec)`, which writes a figure's SVG in the heroes' layout. The
  rendering is the heroes' own (tools/art-heroart/A2/lib.py ported): each shape a soft top-left-lit fill, a darker
  right side, a contact shadow on what is under it. `randomFolk(dice)` rolls one; `folkKey` / `parseFolkKey` turn a
  look into a short string and back (`average.fair.bowl.brown.none.sack.oat.gold.`).
- `js/folk-kind.js` (new): the Villager's numbers and its look per unit. The roll uses the unit's id, never the game's
  dice, so fights play the same with or without them.
- `js/parts.js`: `loadArt` takes a `folk:<key>` url and builds its SVG in code instead of fetching a file (two lines,
  marked). `js/units.js`: the kind added (two lines). `js/battle.js`: kinds flagged `folk` go on the "No dungeon yet"
  tab (one line).
- `art/folk/villager.svg`: the base, written by the tool; it is the Villager's picture in pages.
- `tools/bases19/`: `build.mjs` (writes art/folk and design/bases19: 105 SVGs), `boards.mjs` (the pictures),
  `deck.mjs` (the draft deck), `sets.mjs` (what the boards show), `sheet.mjs` / `look.mjs` / `compare.mjs` (my own
  checking sheets), `shot.mjs`, `lib.mjs`.

**New files the game loads** (for the service worker list): `js/folk.js`, `js/folk-kind.js`, `art/folk/villager.svg`.

## Rulings I kept to (from the notes on earlier art)
- No eyes, brows or blush; the one small curve on the face stays. No arms, only fists ("Make version without arms.
  Just hands").
- No shine patches and no lines on hair ("Remove sheen from hair and the lines").
- A beard and its sideburns are one shape, drawn on the face with the curve above it ("Beard and side burns don't
  mesh together. They should"; "Facial hair layered wrong").
- A moustache covers the curve (the Pirate's, the Digger's), never sits above it ("The Moustache above nose").
- Braids and tails come out from under the hair ("braids connecting to the head"; "Pony tail layer problem").
- No hoods, nothing puffy over the head. The first long hair read as a hood (a smooth dome with an opening), so it was
  rebuilt: the crown dips at the parting and the two side locks are their own shapes.

## Switches
- Battle mode, "No dungeon yet" tab: **Villager** (always there, no flag).
- `?folk=<key>`: every villager wears that one look, e.g. `?folk=average.fair.bowl.brown.none.sack.oat.gold.` (the
  base), `?folk=fat.olive.balding.grey.full.roped.brown.gold.beads`. Order: build, skin, hair, hair colour, facial
  hair, tunic, cloth, metal, then jewellery joined with `+`.
- `?folk=fantasy`: the four fantasy skins join the roll.
- Film it: `node tools/clip.mjs out.mp4 --port 8974 --battle "villager*12|villager*12" --arena wildwood --zoom 0.72`.

## Open calls I made, and my pick
- **The base's hair is approved base 1's bowl cut without its bun**, the plainest of the three approved. Pick: keep.
- **The tunic is only the shoulders.** The heroes show no arms and no chest, so a tunic can only change two shoulder
  lumps. I did not add a chest or sleeves to show more cloth: that would be a new body, not the approved one. The rope
  belt the brief suggested shows only on the fat build, where the belly is in view; on the others "belted" became a rope
  over one shoulder.
- **A neckerchief was drawn and dropped**: a coloured point under the chin read as a goatee at game size.
- **A thin moustache was drawn and dropped**: curved up it read as a grin, curved down as a frown. The small moustache
  with a goatee took its place.
- **Fists alternate** (the heroes' `style.dual`, as Storm Born), so both hands stay in front of the shoulders where the
  approved base has them and neither is tucked behind the body.
- **The roll leans**: feminine and young builds get no facial hair, old builds mostly grey or white and balding,
  armbands only on bare arms, darker skins mostly dark hair. Everything else is free.
- **The Villager's numbers** (46 health, 5 a punch, no ability, nothing dropped, as strong as a crypt foe in a scaled
  battle) are placeholders for a test unit.
- **Where these go next** is asked in the deck (my pick: human enemies built on them).

## Not done, and why
- No townsfolk in the camp, no enemies or heroes dressed on the bases: the ask was the bases; the deck asks where next.
- No fist mark of its own: a punch draws the game's white poke mark (the one a jab or dagger gets), which can read as a
  blade. Said on the deck's crowd card.
- The Villager is not in the Book and has no words there.
- DECISIONS.md is untouched (four lanes appending at once would collide); this file is the record to lift from.

## Weak, said plainly
- **Tunics are subtle.** Patched, rope and collar are small marks on two lumps; at game size only the cloth colour and
  bare arms really read. Sleeveless on the average build shows almost no cloth at all (the tunic piece is under the
  head), so it reads as bare shoulders.
- **Feminine and skinny are close at game size.** The feminine build's cues (sloped shoulders, the chest curving
  forward beside the jaw, fists held out, a rosier curve) are quiet; most of the read comes from the hair the roll
  gives it. Skinny is the thinner, flatter band.
- **Locs** read as curls with long side strands more than as locs. **Balding** side tufts can read as ear muffs in
  blonde; fine in grey and white.
- **Ponytail and long braid** stand up behind the head (they hang down the back, seen from above). The Huntress's
  tail does the same; a first pass looked like a flame and was made shorter and fuller.
- **Rings and the nose ring** are a pixel or two at game size. **Earring hoops** show a dark middle (the outline
  fills the hole).
- **Same-coloured hair and beard merge** into one mass on some mixes (sandy swept hair with a full beard), and umber
  hair on the two darkest skins has little contrast at the hairline.
- **The fat build's belt knot** hangs a hair past the belly's edge.
- **Black hair** sits close to the outline colour; it was lightened a little so the inside still shows.
- The board pictures wear a copy of the outline made with an SVG filter; it is a touch heavier than the game's own.
  The clips show the real one.

## Checks
- `for f in js/*.js; do node --check $f || echo BAD $f; done`: nothing bad.
- `node tools/preview-check.mjs`: 0 threw / 0 never fired / 0 not offered.
- `node tools/battles.mjs`: **535 battles**, 0 problems, 11 ran out of time. It is 535, not 532, because the Villager is
  a new kind on the roster and the tool fights every kind three ways.
- `riffle check` and `riffle fit` on the draft deck: 11 cards, fine; all fit (the last shrinks a little on a small
  iPhone).
