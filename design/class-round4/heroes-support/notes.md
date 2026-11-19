# Heroes: holy, support and odd jobs (round 4, section H2)

Ten new heroes. All are new designs at the base size: the base head shape and size, the base shoulder band, and the
round-3 outline filter copied exactly. They use soft gradients lit from the left, a darker right side, contact
shadows, and no inner lines. Faces have no eyes, brows or blush, but keep the round-3 **subtle mouth curve**.

**Mouths (correction after the first pass):** the Cleric, Bard, Monk, Seer and Quartermaster have the round-3 mouth
curve at its usual place. The Chef's sits just under the moustache, above the neckerchief, so it barely shows. The
Lantern keeper's is a little faint, at 70% opacity in the hood's shadow. There is none on the Templar (great helm),
the Plague doctor (beak mask) or the Beekeeper (mesh veil), because no face shows.

Group ids and pivots: left shoulder (46,108), right shoulder (154,108).

- **Hand rule:** every hand that grips a handle is a rounded fist with its long side (the knuckle row) along the handle.
- **Weapon rule:** weapons and tools held in one hand are in an arm group drawn **before** `body`. The handle runs
  under the shoulder, and the fist sits half under the front edge of the body with its top darkened.
- **Two-handed items** are all in `arm-r`, and `arm-l` is left out. These are the Templar's sword, the Bard's lute
  and the Seer's crystal ball.

The SVGs are made by `../_src/H2/gen.py` and `more.py`, using `lib.py` (all paths are relative).
`python render.py` redraws the boards, and `python lineup.py` writes `renders/_lineup.png`. That picture shows all
ten at 70px and 40px beside every round-3 sprite, to check that they all read apart. At game size each one has its
own colour and silhouette, and none looks like a knight or a farmer.

## Cleric: `support-cleric.svg`
- Note: healer. I drew a white hood with a gold rim round the face, a sky-blue mantle, and a big gold sun-halo
  standing up behind the head (`back`). She holds a short sun sceptre in her right hand, drawn behind the body with
  only the fist showing. Her left hand is free.
- Suggested move: **Mend.** She lifts the sceptre and heals the most hurt ally nearby a little, every few seconds.
- Weak: at some angles the spiky halo could read as a lion's mane or a sunflower. The free left fist holds nothing.

## Templar: `support-templar.svg`
- Note: templar knight, must not look like the existing knights. I drew a flat-topped great helm with a gold band
  and a cross-shaped visor slit, a white surcoat with mail at the ends of the shoulders, and a white cape with a big
  red cross pattee. He has no shield (the other knights have one). He swings a gold-hilted greatsword with **both
  fists on the grip, in front**, the blade pointing forward-left across the body.
- Suggested move: **Oath.** He plants the sword, and allies around him take less damage for a few seconds.
- Weak: the box is too short for a straight-forward greatsword, so the blade lies across the front at about 60°. I
  kept the cross off the helm top, because a red cross on a white square read as a first-aid box.

## Bard: `support-bard.svg`
- Note: lute. I drew a big plum beret worn tilted, a long red feather sweeping back past the head, auburn hair and
  a teal doublet with puffed shoulders. The lute is held across the front: the bowl front-left, the neck up to the
  right shoulder. One fist strums on the bowl and the other is on the neck, turned along it.
- The lute is an instrument held across the chest, so it sits **in front** of the body like the archer's bow, not
  behind it. Both hands are on it, so it is all in `arm-r`.
- Suggested move: **Ballad.** He plays, and allies in range attack a little faster while the tune lasts.
- Weak: the feather sticks out far behind at the top-right. It is the strongest read, but it makes the sprite a bit lopsided.

## Plague doctor: `support-plague-doctor.svg`
- Note: beaked mask. I drew a wide flat-brimmed dark hat and a long ivory beak jutting forward from under the brim,
  with a brass strap across it. The mask is leather, so no skin shows. The coat is waxed brown with a short cape. A
  walking cane with a brass tip is drawn behind the body, and the left hand is free.
- Suggested move: **Vapours.** He throws a vial that leaves a green cloud: it heals allies standing in it and
  poisons enemies.
- Weak: the hat is a big dark disc and covers most of the body. It reads well at 40px (hat plus beak), but the coat
  hardly shows. I took out a brass ring round the crown, because it made the hat look like an eye.

## Monk: `support-monk.svg`
- Note: fists, no weapon. I drew a shaved head with a small dark topknot, a saffron robe with a maroon sash over one
  shoulder, and a string of big wooden prayer beads hanging in front with a red bead in the middle. Two big fists
  with white wraps are held up, one forward as if punching. They are in `arm-l` and `arm-r`, after `body`, because
  there is nothing to hide.
- Suggested move: **Flurry.** A burst of quick punches; each hit heals him a little.
- Weak: from above he is mostly a big bald head. The topknot, the orange robe and the bead string carry the read.
  Grandpa Sickle is the other bald head, but he has white hair, a beard and green.

## Seer: `support-seer.svg`
- Note: blindfold, crystal. I drew long silver-lilac hair down the back and two locks framing the face, a violet
  blindfold across the eyes with its knot and tails trailing behind, and a midnight-blue shawl. She holds a glowing
  teal crystal ball out in front in both cupped hands. The hands sit under the ball, so only their sides show.
- The ball is in front, like the archer's bow, because it is held out in two hands, not swung. It is all in `arm-r`.
- Suggested move: **Foresight.** She marks the strongest enemy in the room; allies deal more damage to it and it
  can't dodge.
- Weak: the back hair is a big rounded shape and can read a little like a hood. She is the purple hero of this set,
  so check her beside the casters (H1) for colour clashes.

## Beekeeper: `support-beekeeper.svg`
- Note: beekeeper. I drew a wide canvas hat with a dark band and a dark mesh veil where the face would be, and a
  white suit. A copper smoker puffing two smoke balls is in the right hand, drawn behind the body. Three bees buzz
  round in `front`.
- Suggested move: **Swarm.** He releases bees that chase the nearest enemy, stinging and slowing it.
- Weak: from above the smoker is small and reads only as "a copper thing". The hat is a round brim like the
  Haymaker's, but it is a different colour, has a dark veil instead of a face, and has the bees. An all-white hat
  looked like a fried egg, so I dropped it.

## Chef: `support-chef.svg`
- Note: pan and ladle. I drew a tall puffy white toque, seen from above as a scalloped cloud, a big dark handlebar
  moustache, a white jacket and a red neckerchief. A black iron frying pan is in the right hand and a steel ladle
  in the left. Both arms are drawn before `body`, so the handles run under the shoulders and only the fists show.
- Suggested move: **Hot meal.** He cooks a snack and drops it; the first ally to walk over it is healed. (Or a pan
  bonk that stuns.)
- Weak: the ladle is thin and mostly hidden. At 40px the chef reads as a white puff, a black pan and the red
  neckerchief.

## Quartermaster: `support-quartermaster.svg`
- Note: a merchant with a huge backpack. I drew a pack wider than the shoulders (in `back`), with a red bedroll
  strapped on top, a copper pot on one side and a rope coil on the other. He wears a mustard knit cap with a bobble
  and a teal tunic with brown pack straps. He has no weapon: both fists grip the straps at the front of the
  shoulders (`arm-l`, `arm-r`, after `body`), turned along the straps.
- Suggested move: **Resupply.** He tosses a potion or a supply bundle to the ally who needs it most (healing or a
  short buff).
- Weak: he has no attack pose. If he needs one for normal attacks, he could swing a small cudgel, or throw from the pack.

## Lantern keeper: `support-lantern-keeper.svg`
- Note: lantern keeper. I drew a deep navy hooded cloak with a drooping hood tail, the face in the hood's shadow,
  and an amber scarf. He holds a pole out front-right, drawn behind the body with only the fist showing. A brass
  lantern hangs from its end. From above you see its six-sided cap and the glowing glass round it.
- Suggested move: **Beacon.** He raises the lantern: enemies in its light are revealed and take more damage, and
  hidden traps nearby show up.
- Weak: the pole is short, because a longer one pushed the lantern out of the sprite box. The glow is drawn inside
  the lantern only: a soft halo round it would get outlined by the filter.
