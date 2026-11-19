# Casters (round 4, H1)

Ten new caster heroes, each its own unit. All are built on the approved base (same head, shoulders, hands, centre
and sprite box), with the round-3 outline filter copied exactly, soft gradients lit from the left, contact shadows,
no inner lines, no eyes or brows, and the small mouth curve where the face shows. Parts: weapon arms come **before**
`#body` (the weapon runs under the body and only the fist shows). An empty off-hand fist sits over the body edge, as
Wildmane's does. Pivots: left shoulder (46,108), right shoulder (154,108).

**Hand rule.** Every fist that holds a handle is a 20 x 25 rounded block whose long side (the row of knuckles) lies
along the handle. The handle shows on both sides of the fist, so the fist wraps it.

Renders: `renders/caster-*.png` (archer, big view, 8 facings, game size). `renders/casters-lineup.png` shows all ten
side by side at 96px and at 40px in 8 facings, with five round-3 heroes under them for comparison.
Generator: `../_src/H1/casters.py` (+ `lib.py`, `render.py`).

Colour and silhouette key, so no two read alike at 40px:

| hero | colour | silhouette read |
|---|---|---|
| Pyromancer | red / orange / yellow | flame hair streaming back, fireball held out front in both hands |
| Frost mage | pale ice blue / white | round hood with a white fur ruff, ice shards out of the shoulders, snowflake staff |
| Storm mage | deep blue / yellow | wizard hat with a lightning-bolt tip, long white beard, a bolt held like a javelin |
| Necromancer | charcoal green-grey / bone / acid green | hood with a long drooping tail, skull staff, green ghost-flame |
| Druid | moss green / brown / pale bone | big branching antlers, leaf circlet, staff with a curled crook |
| Shaman | teal / terracotta | winged totem on the back, braids, feather spirit-stick |
| Witch | violet / lime | huge brimmed hat with a crooked tip, broom bristles first |
| Cultist | blood red / gold | low rounded hood over a smooth gold mask, grimoire and wavy dagger |
| Warlock | violet-black / magenta / ivory | two long horns sweeping back, demon-eye orb sceptre |
| Alchemist | leather brown / brass / rainbow vials | cap with a brass band and loupe, a fan of corked vials, round green flask |

## Pyromancer: `caster-pyromancer.svg`
- Fire mage. The hair is a fire: three tongues stream back off the head, yellow at the hairline and red at the tips.
  Dark red robe with a gold edge. Both fists are out in front, cupping a fireball (two-handed: both fists and the
  fireball are in `arm-r`, and there is no `arm-l`).
- Suggested move: **Fireball**, a slow fireball that bursts on impact and sets the ground burning for a few seconds.
- Weak: the hands hold a ball, not a handle, so the hand rule doesn't really apply. The fists are just turned in
  towards it. The robe shoulders show only as a dark-red rim under the hair.

## Frost mage: `caster-frost.svg`
- A round pale-blue hood with a puffy white fur ruff round the face. Two ice shards grow out of each shoulder. The
  long frosted staff has a big snowflake on the end. It is held in the right fist, behind the body.
- Suggested move: **Frost Nova**, a ring of frost around her that slows every enemy it touches.
- Weak: the smooth hood is close to a helmet shape. I tried a pointed hood, but it looked like the archer's, so I
  went back to round.

## Storm mage: `caster-storm.svg`
- A deep-blue wizard hat whose tip bends back into a yellow lightning bolt. A long white beard sticks out in front.
  He holds a yellow bolt like a javelin in his right fist, behind the body. He is the only caster with a beard.
- Suggested move: **Chain Lightning**, a bolt that jumps from the target to two more enemies nearby.
- Weak: a first try with a spiky crackling orb on a rod read as a mace, so the weapon is now the bolt itself. The
  outline filter stair-steps a little on the bolt's long diagonals (the shared filter does this on thin diagonal
  shapes).

## Necromancer: `caster-necromancer.svg`
- A deep charcoal-green hood with a long tail drooping back and a torn hem on the shoulders. The bone staff has a
  skull on the end with green glow in its sockets (right fist, behind the body). A green ghost-flame burns over the
  empty left fist.
- Suggested move: **Raise Dead**: a fallen enemy rises as a weak skeleton that fights for him for a few seconds.
- Weak: earlier tries (a ragged cape, a torn fringe over the forehead) read as spiky hair or bangs, so the hood rim
  is smooth now. The hood is dark, so most of the read comes from the bone skull and the green flame.

## Druid: `caster-druid.svg`
- Long chestnut hair falling down the sides, a circlet of leaves on the hairline, and a big pair of branching
  antlers. Moss-green mantle with a brown edge. The gnarled staff ends in a curled crook with two leaves (right
  fist, behind the body).
- Suggested move: **Entangle**: roots burst up under an enemy and root it in place for a moment.
- Weak: the antlers stick out a long way at the back. They are the read, but they make the sprite wider than most.
  The crook curl is a stroke, not a filled shape. It renders the same, but say if the game needs fills only.

## Shaman: `caster-shaman.svg`
- A carved totem with spread teal-and-white wings is strapped to the back and rises behind the head. Dark hair with
  a terracotta headband, a feather at the side, and two plaited braids. Teal robe with a terracotta edge. A
  feathered spirit-stick is in the **left** fist (behind the body); the right fist is empty.
- Suggested move: **Totem**: plants a small totem that heals allies near it for a few seconds (or zaps enemies in
  range, as a second kind).
- Weak: the hair and headband read a bit like a cap. At 40px the braids read only as dark bumps beside the face.
  The feather bunch on the stick could pass for a torch.

## Witch: `caster-witch.svg`
- A huge violet witch hat with a wide brim and a crooked tip, plus a lime band and a gold buckle. Dark-green hair
  falls at the sides of the face. She holds a broom in her **left** fist, bristles first, behind the body.
  It's one-handed, so the two-handed rule doesn't apply. The right fist is empty.
- Suggested move: **Hex**: turns the target into a frog for two seconds (it can't attack).
- Weak: the brim covers almost all of the shoulders, so her body barely shows. That is intended, because the hat
  is the read.

## Cultist: `caster-cultist.svg`
- A heavy blood-red hooded mantle sits low over a smooth gold mask that has no features at all. A dark grimoire with
  gold corners is in the left fist, and a wavy ritual dagger is in the right (both behind the body).
- Suggested move: **Blood Pact**: gives up some of his own health to make nearby allies hit harder for a few seconds.
- Weak: with a plain hood the red dome read as a helmet, and a gold sigil on top read as a little face, so the
  mask carries the read. The mask is a gold face shape. Check that it doesn't read as a gold-skinned person. A plain
  ivory mask is the other option.

## Warlock: `caster-warlock.svg`
- Two long ivory horns sweep back from the brow. Slicked violet-black hair with a widow's peak, and a dark coat
  with a magenta edge. A short gold sceptre topped with a magenta orb with a slit pupil (a demon's eye) is in his
  right fist, behind the body.
- Suggested move: **Pact Bolt**: fires a magenta bolt that drains health from the target and heals him.
- Weak: horns will also be on the round-4 Devil and Demon (another artist's section). Next to those, his human face,
  hair and sceptre should keep him apart, but compare them side by side.

## Alchemist: `caster-alchemist.svg`
- A brown leather cap with a brass band, a brass loupe flipped up on the right, and white hair puffing out at the
  sides. A strap of six corked vials in different colours fans over the shoulders. He holds a round flask of green
  brew by the neck in his right fist, behind the body, ready to throw.
- Suggested move: **Flask Toss**: lobs the flask and it shatters into a pool of acid that hurts enemies standing in it.
- Weak: I tried goggles pushed up on the cap, but two round lenses on the head read as a pair of eyes, so I cut
  them. The loupe and the vials carry the "gadgets and potions" read instead. At 40px the vials read as a colourful
  fringe, which is distinct but could pass for feathers.
