# New enemies, round 3

The designer: "Get me the slimes in here and any other enemies (bats, ghosts, lizard men, spiders, snowmen, etc)."

All SVGs follow the shared rules: viewBox "-10 -10 220 220", front = down (+y), centre (100,100), the round-3
outline filter exactly as in the brief, no outline strokes in the shapes, gradients lit from the left, contact
shadows only on parts underneath. Every tip stays inside the viewBox with its outline. Monsters get simple eyes
where they help the facing read (slimes, ghost, lizardman, spider, snowman, bat).

Parts: file order is draw order. Where `arm-l`/`arm-r` come before `body`, that is on purpose (wings, legs, the
lizardman's weapon arm and the mimic's tongue sit under the body). Renders: `renders/<name>.png` (with the archer
at the same scale, 8 facings, game size) and `renders/<name>-thumb.png`.

## Slimes
- **`slime-big.svg`**: the big slime. A gumdrop jelly blob a little narrower than the archer (150 wide vs the
  archer's ~184 with petals). Shine top-left, light glowing through the front edge, a bone, a coin and bubbles
  floating inside, two eyes and a small smile at the front so the facing reads. Parts: `body` only. The game can
  squash/stretch the whole sprite to hop.
- **`slime-small.svg`**: what the big one splits into. The same blob at 60%, paler (matches the game's lighter
  small-slime tint), just bubbles inside, eyes a bit bigger so it reads as the young one. Parts: `body` only.
- **`slime-fire.svg`**: the third kind. Molten orange jelly with a yellow-hot core and embers, cross eyes, flames
  licking back off the top. Parts: `back` = the flames (pivot at the back edge, for flicker), `body` = the blob.
- Tried and dropped: goo drips trailing behind (read as cat ears), a goo puddle (read as a cloud), shed droplets
  (read as a caterpillar), dark crust rocks on the fire slime (read as a chocolate-chip cookie).
- Still weak: the big slime is a plain shape; its charm is all in the face. The coin and bone are only flecks at
  40px.

## Bat (`bat.svg`)
- Small: drawn at 80% inside each part, so it is about 60-65% of the archer's footprint; the wings make it wide
  and thin.
- Wings spread to the sides with finger bones and scalloped back edges; head with big ears, yellow eyes and two
  fangs at the front; a little tail flap behind.
- Parts: `arm-l`/`arm-r` = the wings, pivot at each shoulder, so the game can flap them by swinging or squashing
  in x; they come before `body`. `body` = tail flap, body, head.
- Still weak: the pointed wing tips show small steps in the outline at big size (the filter does that on sharp
  points); invisible at game size.

## Ghost (`ghost.svg`)
- A plain sheet ghost, made to look nothing like the banshee (that one is a skull with hair and rags): round
  white head at the front, the sheet narrows behind into one wispy tail that flicks to the side, two little
  sheet-arm nubs reaching forward, two dark eyes and an "oo" mouth. Cool lavender shading.
- Parts: `arm-l`/`arm-r` = the nubs (pivot at the sheet's sides, drawn before `body`), `body` = the sheet. The
  tail can sway by skewing `body`.
- Tried and dropped: a three-point tail (read as a tulip).

## Lizardman: two labelled versions (the brief said spear or curved blade)
- **`lizardman-spear.svg`**: archer-sized. Olive-green scales (more yellow than the archer's leaf green), a long
  snout pointing forward with nostrils, yellow slit eyes on brow bumps, an orange crest of spines down the back of
  the head, a tail curling behind with an orange stripe. Weapon rule: the spear arm comes before `body`. The
  shaft passes under the right shoulder (you see it behind the shoulder), the fist comes out at the front edge of
  the body, and a leaf-shaped iron spearhead points forward. Thin shaft, clear leaf head: no paint-brush look
  (my first try with a cream bone head and a red binding did look like a brush, so I changed it).
- **`lizardman-blade.svg`**: the same lizardman with a long curved scimitar that runs forward from the fist and
  then sweeps outward, with a bronze guard.
- Parts (both): `back` = tail (pivot at its root, can sway), `arm-r` = weapon + right fist (pivot at the right
  shoulder, before `body`), `body` = shoulders and head, `arm-l` = the empty left claw.
- Still weak: the spear only shows a short stretch in front of the fist, because the sprite box ends at the
  spearhead; the scimitar looks a little like a tusk. The head is big (it's the round token, same as the
  heroes), so the shoulders mostly hide under it.

## Spider (`spider.svg`)
- About 80% of the archer (legs span ~156). Round brown abdomen behind with a pale stripe and two rows of spots,
  a smaller front body with six red eyes and two fangs at the front. Eight jointed legs, four a side: the front
  pair reaches forward, the back pair trails back, with pale knee joints.
- Parts: `arm-l` = the 4 left legs, `arm-r` = the 4 right legs (pivot where they join the body; rock them in turn
  to walk), both before `body`. `body` = abdomen, front body, eyes, fangs.
- Still weak: at 40px the legs are busy (it's a spider, so that's partly the point).

## Snowman (`snowman.svg`)
- About 110%. Two snowballs from above: the big body ball behind, the head ball in front with an upside-down tin
  bucket on it (rolled rim, ridged wall, flat bottom, handle lugs at the sides), a red scarf where the balls meet
  with one end blowing back, coal eyes, and a carrot nose pointing forward. Stick arms out to the sides with
  twig fingers.
- Parts: `arm-l`/`arm-r` = the stick arms (pivot where they go into the body ball, drawn before `body`), `body` =
  everything else.
- Tried and dropped: a smooth bucket (read as a helmet), a handle across the bucket (read as a grinning visor).
- Still weak: where the two white balls meet below the scarf there is not much to separate them; the scarf does
  most of that work.

## My own idea: Mimic (`mimic.svg`)
- A treasure chest that bites, for a dungeon game. From above: a planked lid with two gold bands and a gold
  keyhole lip, the front lifted open into a wide dark mouth of teeth, a pink tongue lolling forward.
- Parts: `arm-r` = the tongue (pivot at the mouth, so it can lash; before `body` so the lower jaw covers its
  root), `body` = chest, lid, mouth, teeth.
- Still weak: it's square, so the four diagonal facings look like a rotated box (that's true of any chest).
