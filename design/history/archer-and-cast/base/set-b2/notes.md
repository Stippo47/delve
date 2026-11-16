# Base human, set B2: resized to the archer's HEAD (hood footprint), hands archer-size

The sheet rows are: archer hood only (size reference), full archer, then base-1 to base-4. All four bare heads fit roughly inside the hood (x 41..159, y 14..160). Hands are 23-24 x 21 with rx 8, like the archer's. Facing is down (+y), and the sprite rotates about (100,100).

1. **Bowl** (hard split): a round head (r 50) under a slate bowl cut with a 3-lobe fringe. Small ears peek out below the rim, and two fists sit at the front corners.
2. **Long** (hard split): a narrow egg-shaped head (80 x 112) with slicked-back blond hair to a soft peak. A ponytail leaves the crown and curls over the right shoulder. Big ears stick out sideways, and open hands are held wide at the flanks.
3. **Cloud** (soft shading, no split): a curly cloud of puffs with a small low face under raised front puffs. No ears. The hands are pressed together under the chin.
4. **Jaw** (soft shading, no split): a wide-jawed head with a square front. Messy ginger crop with rounded back tufts and a fringe falling forward-left. Small ears. Both hands grip off to the front-right, like holding a two-handed weapon.

## Changes from set B
- Shrunk about 30% so the heads fit the hood footprint, and hands are now archer-size.
- Dropped the hard split on Cloud and Jaw. That fixed Jaw's yin-yang/beach-ball read at 40px and gave Cloud more volume.
- Rounded Jaw's spiky anime tufts into messy lumps, softened Long's widow's peak, and raised Cloud's fringe so more face shows.

## Still weak
- Bowl: clean but plain, and the bowl could be read as a cap. Next to the smaller head the hands now look comparatively chunky. That's correct to the archer's hand size, but worth checking.
- Long: noticeably smaller and narrower than the hood (that's the design). At 40px the ponytail curl does a lot of the work. The shadow under the peak still hints at a brow.
- Cloud: pokes ~8 units past the hood on each side. At 40px the face is a small beige notch, so facing relies mostly on the paired hands.
- Jaw: the face is a big blank area. At 40px the orange mass and diagonal fringe read a bit like an acorn. The off-centre grip suits two-handers more than one-handed classes.
- build.py / render.py in this folder regenerate everything (render.py is copied from set-b).
