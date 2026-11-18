# Farmer, round 2

All five SVGs use the parts layout: `#sprite` with the outline filter, then `back` (if any), `body`, `arm-l`,
`arm-r`. No outline strokes in the shapes. Arm pivots: left shoulder (46,108), right shoulder (154,108).
**Two-handed tools** (scythe, pitchfork, rake, spade) sit in `arm-r` with both hands, and `arm-l` is left out.
Grandpa's sickle is one-handed, so he has both arms. Renders are in `renders/`.

## Granny Reaper: `farmer-granny-reaper.svg`
- "Should hold it below body not on top. Looks like it's over the shoulder." The snath no longer runs up past
  the shoulder. It starts just behind her top hand at the front of the right shoulder and runs down and in.
  The blade sweeps left across the front below her chin, like the archer's bow.
- "Bigger." The blade spans about 110 units, about 1.6 times its old length.
- "Better hand positioning." Both fists grip the snath, spaced apart: right fist at the top, left fist halfway
  down, both at the front of the body.
- "Not bad." Kept the red headscarf with its big knot, the white hair tufts and the green shawl.
- Still weak: the blade tip's outline is chunky because the filter squares it off. Her face shows only below
  the scarf, as in round 1.

## Haymaker: `farmer-haymaker-fork.svg` and `farmer-haymaker-rake.svg`
- "Hat is off." The round-1 hat read as a target. It is now a straw sun hat with a softly wavy brim tipped back,
  faint straw fibres radiating out, a dented crown lit from the left, and a red band with a tail. Brown hair
  tufts and ears show under the brim at the sides.
- "Rake too." The note called it a rake, so I made both versions, same character:
  - *fork*: a proper pitchfork, three long curved steel tines on a steel cross-piece, bigger than before.
  - *rake*: a wooden hay rake, a wide cross-bar with six wooden teeth.
- "As well as how it's being held." The two stacked fists under the chin are gone. Now the right fist is back at
  the right shoulder and the left fist further down the shaft. The shaft runs diagonally from the right shoulder
  to the front, and the head sits low in front, pointing forward and in.
- Still weak: the hat still covers most of the denim shoulders (a wide brim will). The tool head sits right of
  centre, not dead ahead. At 40px the rake teeth merge into one comb shape.

## Digger: `farmer-digger.svg` (fresh attempt)
- "Bad overall. You can retry." This is a new character, not a fix. He is a stocky field hand in a burgundy knit
  beanie with a rolled cuff and a cream pompom at the back, dark sideburns, a big brown moustache, and a
  canvas work coat with a fleece collar.
- Tool: a big steel spade, held low with both hands. The D-grip is in the left fist at the left shoulder, the
  right fist is down the shaft, and the blade is out front, pointing forward and slightly to the right. The
  shaft crosses the opposite way to the Haymaker's, so the farmers don't all hold their tools from the same side.
- Still weak: the fleece collar barely shows under the head. The left fist sits at the edge of the cheek. The
  spade's grip is in the left hand, but the part swings from the right-shoulder pivot (as the brief says for
  two-handers).

## Grandpa Sickle: `farmer-grandpa-sickle.svg`
- "Can't tell what's on back." The sheaf is now a long wheat bundle lying across his back behind the head.
  Stalk ends stick out at the left, there's a twine tie in the middle, and five separate wheat ears fan out at
  the right. It sits in `back` with a sway pivot (100,96).
- "Where is the forehead shadow coming from." The bald head no longer uses the face gradient, which is dark at
  the top because it is meant to sit under hair. It has its own dome gradient, lit from the top left with a soft
  highlight, darker only at the right edge.
- "Beard doesn't look good" and "Doesn't mesh well with hair." The side tufts and the beard are now one white
  shape. The hair runs down from the temples into a full rounded beard below the chin.
- "Nose line on beard?" The beard's top edge no longer dips like a nose. A proper two-lobed moustache sits on
  top instead.
- Brief rule (held low, bigger): the sickle is a big crescent held forward in the right fist. It curves in, with
  the tip pointing back. The left fist is free.
- Still weak: the beard is a large plain white area. The face shows only as a bald dome over the moustache. The
  sheaf makes the top of the sprite wide, so it reaches near the top edge.
