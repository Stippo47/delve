# New enemy families, round 4 (section E2)

The brief: greenskins (goblin, hobgoblin, orc, troll, ogre, each a different green), four clearly different fiends
(imp, demon, devil, fiend), a dragonborn, an angel and a cherub.

All SVGs follow the shared rules: viewBox "-10 -10 220 220", front = down (+y), centre (100,100), the round-3 outline
filter exactly, no outline strokes, gradients lit from the left, contact shadows on the parts underneath. Monsters have
simple eyes. The angel and cherub are drawn person-style: no eyes, only the small mouth curve the heroes have.
Weapon arms come **before** `body` (the weapon passes under the shoulder, only the fist shows). Every fist is a rounded
block turned to its handle, with the knuckle bumps on the outer side. Sizes: each part group holds an inner
`scale(k)` about (100,100); pivots are given in sprite space. Generators: `../_src/E2/` (`greenskins.py`, `fiends.py`,
`others.py`, `lib.py`; run e.g. `python greenskins.py orc troll`, which writes the SVG and renders it).

**Size note:** the sprite box holds only about 130% of the archer. The troll (1.28) and the ogre (1.22, but
much wider in the body) fill the box. To reach the ~150% the brief asks for, the game should scale the ogre up a
little (the outline grows with it).

## Greenskins (five shades of green: lime, olive-khaki, grass, moss, sea-green, pale sage)
- **`greenskin-goblin.svg`**, about 70%. Bright lime-yellow skin, huge sideways ears, a long nose, big yellow eyes
  with red pupils, a brown rag tunic, a rusty dagger. Parts: `arm-r` (dagger), `body`, `arm-l` (empty claw).
  Move: *Backstab dash*: darts behind its target and stabs, then scurries off.
- **`greenskin-hobgoblin.svg`**, archer-sized. A soldier: dull olive-khaki skin, an iron cap with a red crest, ears
  swept back, red leather shoulders, a short sword, a red square shield with a gold boss. Parts: `arm-r` (sword),
  `body`, `arm-l` (shield in front, hand hidden).
  Move: *Shield wall*: raises the shield and blocks shots from the front for a few seconds; nearby goblins hide behind it.
- **`greenskin-orc.svg`**, about 115%. Grass-green skin, a wide head with a heavy underbite and two big tusks,
  pointed ears, a black mohawk, a brown leather vest with a strap, one spiked iron pauldron, a jagged chopper.
  Parts: `arm-r` (chopper), `body`, `arm-l` (empty fist).
  Move: *War cry*: roars, and orcs and goblins nearby attack faster for a short time.
- **`greenskin-orc-shaman.svg`**, about 110% (the second orc). Darker moss-green skin, a bleached beast skull worn as a
  helm with two horns, a grey wolf-fur mantle, small tusks, a gnarled staff with a little skull in green fire.
  Parts: `arm-r` (staff), `body`, `arm-l` (empty hand).
  Move: *Green fire hex*: lobs a green fireball that leaves a burning patch, or heals the orcs standing in it.
- **`greenskin-troll.svg`**, about 130%. Sea-green/teal skin, hunched: a small head low and forward with a big round
  nose and little tusks at the jaw corners, a shaggy dark mane over the back, very long arms reaching forward with big
  three-clawed hands. No weapon. Parts: `body`, `arm-l`/`arm-r` = the long arms (pivot at the shoulders, drawn over
  the body).
  Move: *Regrow*: heals over time unless it was burned recently; long-arm swipes hit two targets.
- **`greenskin-ogre.svg`**, the biggest (fills the box). Pale grey-sage skin, a huge round back and a big belly
  bulging in front, a small bald head with a black topknot, two little teeth, a leather strap across the belly, a big
  studded club. Parts: `arm-r` (club), `body`, `arm-l` (empty fist).
  Move: *Belly slam*: drops forward onto the ground, knocking back and stunning everyone in a short cone.

## Fiends (four different things)
- **`fiend-imp.svg`**, about 60%. All head: orange-red, two little dark horns swept back, pointed ears, big yellow slit
  eyes, wide bat wings, a thin tail with a dark spade tip, a fireball in its right claw. Parts: `back` (tail + wings;
  flap by squashing in x), `arm-r` (fireball claw), `body`, `arm-l`.
  Move: *Fire spit*: flits about at range throwing small fireballs; blinks away when hit.
- **`fiend-devil.svg`**, archer-sized. The classic devil: scarlet, bald, two short dark horns, pointed ears, a black
  pointed goatee, yellow eyes, darker red shoulders, a long tail with an arrowhead tip, a gold trident. Parts: `back`
  (tail, pivot at its root), `arm-r` (trident), `body`, `arm-l`.
  Move: *Pitchfork toss*: throws the trident in a line, pinning the first hero hit in place for a second.
- **`fiend-demon.svg`**, about 115%. A hulking dark violet brute with two huge horns sweeping back, a crest of fire on
  the head, glowing orange eyes and two huge burning fists (no weapon). Parts: `back` (the head fire, can flicker),
  `body`, `arm-l`/`arm-r` (the burning fists, pivot at the shoulders).
  Move: *Hellfire slam*: both fists into the ground, a ring of fire that burns for a few seconds.
- **`fiend-fiend.svg`**, the beast: a four-legged hellhound shape, dark maroon hide, a row of bone spikes down the
  spine, two bone horns swept back off the brow, glowing green eyes, fangs, a barbed tail. Parts: `back` (tail),
  `body` (hind legs, torso, head), `arm-l`/`arm-r` = the front legs (pivot at the shoulders, for swipes).
  Move: *Pounce*: leaps onto a far hero and pins them, mauling until hit.

## Dragonborn
- **`dragonborn-dragonborn.svg`**, about 115%. A dragon-flavoured lizardman: sapphire-blue scales (not the lizardman's
  olive), a broad snout, two big ivory horns swept back off the brow, teal frill fans on the cheeks, small folded
  wings behind, bronze pauldrons, yellow slit eyes, a falchion. Parts: `back` (wings), `arm-r` (falchion + claw),
  `body`, `arm-l` (empty claw).
  Move: *Breath*: a short cone of fire breath ahead after a wind-up (the frills flare).

## Angel and cherub (enemies or allies)
- **`celestial-angel.svg`**, archer-sized. Big white feathered wings spread out behind, a gold halo ring over brown
  hair (brown so the gold ring stands out), white robe shoulders with a gold collar, a gold spear. Person-style:
  no eyes, the small mouth curve. Parts: `back` (wings), `arm-r` (spear), `body`, `arm-l` (empty hand).
  Move: *Smite*: a beam of light down on one target, or as an ally a burst that heals everyone nearby.
- **`celestial-cherub.svg`**, about 60%. A chubby baby with round blond curls, rosy skin, little round white wings, a
  small gold bow with a heart-tipped arrow held in front. No eyes, the small mouth curve. Parts: `back` (wings),
  `body`, `arm-r` (the drawing hand), `arm-l` (bow + bow hand, in front, like the archer's bow).
  Move: *Love arrow*: a heart arrow that charms a target into fighting for the cherub's side for a few seconds.

## What's still weak
- The ogre and troll can't reach 150%/130% in the 220 box with the outline the same; the ogre needs a little in-game scale.
- The orc's and the shaman's weapon fists sit at the shoulder edge; the shaman's staff shows mostly as its skull-fire head.
- The cherub's bow reads as a gold arc under the head more than a bow at 40px; the heart arrow carries it.
  Its mouth curve is mostly hidden behind the arrow nock.
- The demon has no weapon (burning fists), like the troll (claws); they differ by colour and shape. If the
  designer wants a weapon on the demon, there's no room in the box for a two-handed blade in front.
- The angel's hair is a plain cap; the wings' feather edge is a simple scallop.
- Pointed tips (mantle fur, ear and horn tips) show small steps in the outline at big size, as on the round-3 bat.
  You can't see them at game size.
