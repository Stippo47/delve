# Farmer, round 3

All files start from the round-2 SVGs. They use the brief's new rounder outline filter, copied exactly. Group ids
and pivots are unchanged: left shoulder (46,108), right shoulder (154,108). **Weapon arms now come before `body`**,
so the tools draw behind the shoulders. The fist that grips the tool sits half under the front edge of the body, with
its top darkened slightly. **Two-handed tools** (scythe, pitchfork, spade) are in `arm-r` and `arm-l` is left out,
as before. Renders are in `renders/`.

**How the long handles work.** The body covers most of the space between the shoulders and the bottom of the
sprite box, so a handle that starts under the body can't show much length in front. So each long handle **passes
under the shoulder and pokes out at the side of the shoulder** (back end) as well as out the front. The whole length
then reads at 40px. I kept the back ends at shoulder height, low and to the side, never up past the head. That way
they don't read as "held over the shoulder", which the designer turned down for Granny in round 2. An earlier try
with the back end up behind the head looked exactly like a spade over the shoulder, so I dropped it.

## Granny Reaper: `farmer-granny-reaper.svg`
- "Weapon too small. Specifically handle": the snath is about 125 long, up from about 82. Its back end pokes out at
  the right side of the shoulder, it runs under the right shoulder, and it comes out at the front in her right fist.
  Her left fist grips it further down, and it runs on to the heel at the bottom right.
- "Blade bigger too" (brief): the blade now sweeps about 142 across the front, up from about 110, and is a little
  thicker so it holds up at 40px.
- Weapon rule: the scythe is drawn behind the body (arm-r before body).
- Still weak: the blade's heel ends in a flat cut that the filter outlines as a hard corner. The top of the snath
  sits close to where a "pole on the shoulder" would be. It's drawn under the shoulder, but check it on the phone.

## Haymaker (fork): `farmer-haymaker-fork.svg`
- "Handle short": the shaft is about 1.6 times longer. It pokes out at the right side of the shoulder, runs under the
  shoulder, and comes out at the front edge in his right fist. The fork head sits low in front, angled in.
- "Hat is a bit too detailed": the straw fibres, wavy edge and band tail are gone. Now it's a smooth oval brim, a
  plain crown with one soft highlight, and a plain red band.
- "Bowl isn't wide enough": the crown is 88 wide, up from 68, and the brim is the same size.
- "Pitchfork fingers too shiny": the tines are a flat matte iron grey with no white highlight band.
- Weapon rule: the fork is behind the body. Only one fist shows; the other hand is hidden under the body.
- Still weak: the fork points about 38° off straight ahead, because a long shaft from the side has to come in at an
  angle. The fork head still sits right of centre.

## Digger: `farmer-digger.svg`
- "Longer handle, below body": the handle is about 2 times as long as round 2's. It's drawn under the body: the
  D-grip pokes out at the left side of the shoulder, the shaft runs under the left shoulder, and it comes out at
  the front-left in his left fist. The spade sits forward and to the right. The blade is a touch shorter (42, was 48)
  so the long handle and the blade both fit in the box.
- Weapon rule: arm-r is before body.
- Still weak: the spade points about 54° off ahead (more sideways than round 2's 38°). That angle is what lets a long
  stretch of handle show in front of the body. The tool is on the left but swings from the right-shoulder pivot,
  as the brief says for two-handers.

## Grandpa Sickle: `farmer-grandpa-sickle.svg`
- Weapon rule: arm-r (fist + sickle) is before body. The handle is under the right shoulder, and only the fist shows
  at the front-right edge. The crescent comes out forward and is about 10% bigger. I moved it right and down so the
  beard doesn't hide it.
- His left fist holds nothing, so it stays in front (after body), as in round 2.
- Still weak: the inner tip of the crescent still tucks under the beard. At 40px the sickle reads as a hook beside
  the beard, not as a full crescent.

## Dropped, as asked
The Haymaker rake isn't carried over.
