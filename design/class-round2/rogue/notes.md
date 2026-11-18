# Rogue, round 2

All five SVGs use the parts layout: `#sprite` with the outline filter, then `back` (if any), `body`, `arm-l`,
`arm-r`. No outline strokes in the shapes. Arm pivots: left shoulder (46,108), right shoulder (154,108).
Each hand group holds its fist and its weapon. Renders are in `renders/` (archer beside each one).

Cowl is dropped, as asked.

## Twinfang: `rogue-twinfang.svg`
- "Good." Kept the face, swept ink hair, ponytail, plum shoulders, crimson scarf ring and the twin daggers.
- "Cape centred and wider." The scarf tail that streamed off to one side is now a crimson cape. It hangs behind
  the shoulders, is symmetric about the centre line, and is wider than the shoulders (x 10 to 190). It has a soft
  tattered hem with rounded points. It sits in `back`, which has a sway pivot at the neck (100,92).
- Brief rule (bigger weapons, held low): the daggers are wider (20) and longer, held at the front corners and
  pointing straight forward. I removed the gold pommel balls, which looked like earrings.
- Still weak: the ponytail is still off-centre on top of a centred cape. The cape is big and could clip in tight
  rooms. The dagger tips lose their points under the outline filter (see the last section).

## Bandit: `rogue-bandit-mask.svg` and `rogue-bandit-nomask.svg`
- "Bandana on forehead letting hair peek through." The bandana is now a band that sits low across the forehead.
  The brown hair crown shows above it, three locks poke up over it, and it ties in a knot at the back right
  with tails.
- "Mask over bottom half of face?" There are two versions. *mask*: a dark slate cloth covers the face from just
  under the band down to a point below the chin, with no mouth showing. *nomask*: the same cloth hangs as a
  mustard neckerchief under the chin, and the mouth shows. The neckerchief is now a different colour from the
  red bandana, which fixes the round-1 weak spot.
- "Bigger sword." The dagger is now a cutlass about 80 long with a brass crossguard, held low in the right fist
  and angled slightly in, pointing forward.
- "Not bad." Kept the brown hair, the scalloped leather mantle and the open left hand.
- Still weak: the silhouette is one-sided (sword on the right only). The three locks over the band read a little
  spiky up close. With the mask on, the strip of face between band and mask is narrow and dark.

## Shade: `rogue-shade-cape.svg` and `rogue-shade-collar.svg`
- "Hard to read depth." Each layer now has its own value. Back layer: darkest. Shoulders: mid and lighter on top.
  Hair: lightest. Each upper layer casts a contact shadow on the one beneath. The second mantle layer from
  round 1 (purple on purple) is gone.
- "Cape or raised collar?" There are two versions.
  - *cape*: one dark violet cloak hangs behind and flares back to a rounded bell hem with a small swallowtail
    notch in the middle, plus soft fold tones. It sits in `back` with a sway pivot (100,90). The lighter shoulders
    sit clearly on top of it.
  - *collar*: no cape. A tight Dracula-style standing collar wraps the back of the head, with points at the
    upper corners: dark violet outside, crimson lining inside. It is part of `body`, because a collar doesn't
    sway.
- "Headband is off." Redone as a real band around the head. It is lowest across the forehead and rises to the
  sides of the skull, where it meets the outline. The silver fringe spills out under it, and two short ribbon
  tails trail behind to the right.
- "Purple hilt swords?" Guards, grips and wraps are purple. The curved daggers are bigger and cross in an X just
  below the chin.
- Still weak: the hands sit on the jaw line. To keep the X inside the frame they can't go lower. The small gap
  between the hands and the crossing fills in dark under the outline. In the cape version the ribbon tails are
  nearly lost against the cape. The collar version's corner points look a bit like ears at 40px.

## Note on the outline filter
`feMorphology dilate` grows the outline with a square, not a circle. So sharp tips (dagger points, ponytail,
cape points) get squared-off outline corners instead of the round joins the archer's stroke has. I kept tips
blunt or rounded where I could. A game-side outline shader with a round kernel would fix it everywhere.
