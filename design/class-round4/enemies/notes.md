# Enemy redos, round 4 (section E1)

All SVGs follow the shared rules: viewBox "-10 -10 220 220", front = down (+y), centre (100,100), the round-3 outline
filter exactly, no outline strokes in the shapes, gradients lit from the left, contact shadows on the parts underneath.
Monsters have simple eyes. File order is draw order; a weapon arm comes before `body` (it passes under the shoulder and
only the fist shows). Every weapon fist is a rounded block turned to its handle with the knuckle bumps along it.
Generators: `../_src/E1/` (`slimes.py`, `bats.py`, `ghost.py`, `lizards.py`, `spiders.py`, `snowman.py`, `mimic.py`,
`banshee.py`, all on `lib.py`, a copy of E2's builder). `python slimes.py a` writes and renders take A, and so on.
Renders: `renders/<name>.png` (archer beside it, 8 facings, game size) and `renders/<name>-thumb.png`.

## Slimes: "Totally different style. Try again." -> three takes, each big / small / fire
The round-3 slime was a gumdrop blob with a cute face. Each take below is a different *thing*, not a re-colour.
- **A cube** (`slime-a-cube-big/small/fire.svg`): a gelatinous cube. A soft-cornered block of clear teal jelly with a
  bevelled inner face, a glassy rim light on the top and left edges, a skull, bubbles and a coin stuck inside, two eyes at
  the front edge, three goo drips hanging over the front lip. Small: 62%, paler, just bubbles inside, bigger eyes.
  Fire: orange-hot jelly with a yellow core, embers, three soft flames rising off the back (`back` group, can flicker).
  Parts: `body` (and `back` for the fire one). Still weak: in the diagonal facings it reads as a rotated box (any square
  does); the drips are small at 40px.
- **B ooze** (`slime-b-ooze-big/small/fire.svg`): a flat, lumpy puddle of matte lime goo with a raised core and one big
  cyclops eye, two pseudopods reaching forward, a couple of shed droplets beside it. Parts: `arm-l`/`arm-r` = the
  pseudopods (pivot at their roots, before `body`; they can lash), `body`. Still weak: the edge lumps make a busy
  outline at 40px; the fire one is the same shape in orange.
- **C bubbles** (`slime-c-bubbles-big/small/fire.svg`): a cluster of glossy pink jelly bubbles stuck together like
  frogspawn: a big front bubble with the face, smaller ones bunched behind with a dark seed in each (the ones that pop
  off as slimelets when it splits). Small: two bubbles. Fire: glowing magma bubbles. Parts: `body`. Still weak: the
  diagonal facings read a little like a paw print.
- **Suggested move** (all three): *Split*: when killed the big one bursts into two small ones (as now); the fire one
  leaves a short burning puddle where it dies.

## Bat: "Totally different style. Try again." -> three takes
- **A fuzzball** (`bat-a-fuzzball.svg`): a round ball of lilac fluff with huge pink-lined ears, small leathery wings
  held out to the sides, big glossy eyes, a pink nose, two fangs. Cute.
- **B cloak** (`bat-b-cloak.svg`): a sleek dark vampire bat with its long wings swept forward round its head like a
  cloak, plum wing webbing, red glowing eyes, fangs. Menacing; reads like Dracula's bat.
- **C fox bat** (`bat-c-foxbat.svg`): a brown fruit bat seen as an arrowhead: wings swept back in a V with scalloped
  trailing edges, an orange fur ruff, a fox-like head with a pointed snout leading.
- Parts (all three): `arm-l`/`arm-r` = the wings (pivot at the shoulders, before `body`; flap by swinging or squashing in
  x), `body`. All about 65-70% of the archer.
- **Suggested move**: *Swoop*: flies over obstacles straight at the back line, bites, and flutters away.
- Still weak: B's wing tips show small steps in the outline at big size (the filter does that on sharp points); C's
  wings make the facing read from the snout only.

## Banshee: "No. Try again. Losing style." -> two takes on the base body
The round-3 one was a skull on a ghost sheet with five wisps, ragged sleeves and thin claw fingers: too fiddly and
off-model. Both new takes sit on the base body (round head token, 160-wide shoulders, chunky rounded hands).
- **A wailer** (`banshee-a-wailer.svg`): a drowned-looking spirit woman: cold blue-white face, long lilac-silver hair
  that frames the face and streams behind into one long tail of hair (no legs), two hollow eyes with teal pinpoints and a
  wide-open wailing mouth, a dark-teal ragged shawl over the shoulders, pale hands reaching forward. Parts: `back` = the
  hair tail (sways), `body`, `arm-l`/`arm-r` = hands.
- **B veiled** (`banshee-b-veiled.svg`): keeps the Hollow's tall skull (the round-3 note), under a long black mourning
  veil that covers the dome and falls behind into a train, a pale ghost glow at the shoulders, glowing teal pinpoints in
  the deep sockets, bony hands with three finger bones. Parts: `back` = the veil train, `body`, `arm-l`/`arm-r`.
- **Suggested move**: *Wail*: a scream in a cone ahead that makes heroes flee for a moment (fear).
- Still weak: B may read as a reaper rather than a banshee; A's hair is close in value to the face.

## Ghost: "Better. Tail could use work." -> two tails on the round-3 ghost
The head, face and arm nubs are the round-3 ghost unchanged; only the tail is new. The old tail flicked off to one side
from a narrow neck, so it looked bent.
- **A swish** (`ghost-a-swish.svg`): the sheet flows straight back from the head into one long S-curve that ends in a
  small curl: wide at the head, tapering smoothly.
- **B trail** (`ghost-b-trail.svg`): the sheet tapers behind into a short stub and breaks up into three shrinking
  puffs, like smoke left behind as it drifts.
- Parts: `arm-l`/`arm-r` = the nubs, `body` = head and tail (sway the tail by skewing `body`).
- **Suggested move**: *Phase*: drifts through walls and can't be hit for a moment after it attacks.

## Lizardman: "Decent. Try variants." (blade: "curved the wrong way") -> three variants
Kept clearly apart from E2's dragonborn (sapphire-blue, horns, frills, wings, bronze pauldrons): none of these has
horns, wings or frills.
- **A spear** (`lizardman-a-spear.svg`): the picked round-3 olive lizardman, redone to the hand rule: the fist is turned
  to the shaft (knuckles along it), shaft behind the shoulder, leaf spearhead forward. Orange spine crest, curled tail.
- **B desert blade** (`lizardman-b-desert-blade.svg`): a sand lizard: tan scales with brown blotches, a shorter
  rounder snout, big amber eyes on bumps, a red sash over the left shoulder, a thin banded tail. The scimitar now curves
  **in**, toward the centre line, with a gold guard.
- **C croc** (`lizardman-c-croc.svg`): a heavier swamp croc-man: dark moss hide, a broad flat snout with teeth poking
  out along both jaws, eyes on raised bumps, armour ridges down the back of the head, a thick spiked tail, a bone club
  behind the right shoulder and a turtle-shell shield in front (hand hidden).
- Parts: `back` = tail (pivot at its root), `arm-r` = weapon + fist (before `body`), `body`, `arm-l` = empty claw (or the
  shield for C).
- **Suggested move**: the designer's: *Tail spin* that throws up 3 slow water projectiles (C could block with the
  shell instead).
- Still weak: the fists have no claws now (claws on a gripping fist looked like a comb); the empty left claw keeps
  them. A and C are both green; C is darker and browner but they're closest of the set.

## Spider: "Try again. 4 variants/styles." -> three base spiders and the momma
- **A hunter** (`spider-a-hunter.svg`): a chunky grey-brown wolf spider, oval abdomen with a dark leaf mark and pale
  spots, two big eyes and four small, stubby fangs, eight thick bent legs. ~85%.
- **B widow** (`spider-b-widow.svg`): a glossy black widow: big shiny round abdomen with a red hourglass, small head with
  red eyes, long arched legs. ~85% (long legs).
- **C jumper** (`spider-c-jumper.svg`): a fuzzy jumping spider: big square head with two huge glossy eyes, shiny teal
  fangs, black abdomen with white spots and an orange band, short thick legs. ~75%. The cutest of the three.
- **D momma** (`spider-d-momma.svg`): the big web-shooter, ~125%: a dusky plum spider with a huge abdomen carrying five
  spiderlings on her back, a white silk egg-sac at the back, two big red eyes and four small, long heavy legs with pale
  bands at the knees.
- Parts (all): `arm-l`/`arm-r` = the four legs on each side (pivot where they join; rock them in turn to walk; before
  `body`), `body`.
- **Moves**: the designer's: base spider *bites with poison* and leaves a slowing web when it dies; momma *shoots a web
  cluster* (short range): entangles a unit for a second on a hit, a slowing web on the ground on a miss.
- Still weak: at 40px the legs make every spider busy (partly the point). B is close to the outline colour, so it reads
  mostly by its red hourglass.

## Snowman: "Leaning over. Hat too much detail. Different style." -> two takes
The round-3 one put the head ball well in front of the body ball (it looked like it was leaning forward) and wore a
detailed tin bucket. Now the head sits nearly on top of the body (8-10 forward, like the heroes' heads over their
shoulders), so it stands upright.
- **A top hat** (`snowman-a-tophat.svg`): a plain black top hat (brim and crown, no band), coal eyes, carrot nose, a red
  scarf showing round the neck with one end blowing back, stick arms with twig fingers, lumpy packed-snow edges.
- **B beanie** (`snowman-b-beanie.svg`): the same snowman in a blue knitted beanie with a white pompom.
- Parts: `arm-l`/`arm-r` = the stick arms (pivot where they go into the body, before `body`), `body`.
- **Suggested move**: *Snowball*: lobs a snowball that slows the hero it hits; melts (takes extra damage) from fire.
- Still weak: straight from above a snowman is circles inside circles; the scarf ring and carrot carry the read.

## Mimic: "Close, not quite. Deviating too much. Tongue not even attached."
- `mimic.svg`: now built from the game's own chest (rounded brown box, a gold band across the middle, a gold lock) so it
  looks like the real chest. The gold band is where it opens: the lid and box part along it into a wide mouth with gold
  lips, teeth on both lips and two yellow eyes glowing in the dark corners. The lock sits on the lid lip above the
  mouth. The tongue grows out of the back of the mouth (its root is inside the dark, drawn over it) and lolls forward
  over the front of the box.
- Parts: `body` = chest, mouth, teeth, eyes, lock; `arm-r` = the tongue (pivot at its root in the mouth; drawn after
  `body` so the root shows attached).
- **Suggested move**: *Ambush*: sits as a chest until a hero comes close, then lunges and grabs them with the tongue,
  pulling them in.
- Still weak: like any chest it reads as a rotated box in the diagonal facings. If the props artist changes the chest,
  the mimic should follow it.
