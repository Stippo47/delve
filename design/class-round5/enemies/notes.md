# Enemies, round 5 (lane E3)

Built by the scripts in `../_src/E3/` (relative paths only): `greenskins.py`, `lizards.py`, `fiends.py`,
`critters.py`, `angel.py`, on `lib.py` (the round-4 E2 builder plus the heroes' head path, face gradient and side
shade). `sheet.py` and `montage.py` make the side-by-side look-over sheets. Renders: `renders/` (render_board.py:
the archer beside each, 8 facings at 70px and at game size).

## Why the round-3/4 enemies didn't fit (compared with the heroes and the picked skeletons)
- **Point of view.** The heroes are a top-down *bust*: a round head token in the middle, shoulders behind it, two
  fists at the shoulder ends, the weapon coming out forward. Most rejected enemies were drawn from the *front*
  (slimes, bats, ghost, imp, goblin: a face filling the head, eyes in the middle) or as *whole bodies* with legs,
  feet, toes and claws (orc, troll, devil, spiders, lizards). Mixed perspective is what made them look like stickers
  from another game.
- **Head size.** The heroes' head is ~96 units wide and dominates the sprite. The rejected monsters had small heads
  on big bodies (troll, orc, devil), or no head token at all.
- **Faces.** Heroes: no eyes, the face shows only at the front edge under the headgear, with a soft gradient dark
  under the brim and light across the middle, a darker right side, and a tiny mouth curve. Rejected: big dot eyes,
  slit pupils, red glowing eyes, cute faces. The designer removed eyes on everything they kept.
- **Chunkiness.** Heroes: 5-8 big shapes (head, headgear, shoulders, two fists, weapon). Rejected: many small
  parts (8 spindly legs, finger and toe claws, spikes, speckles), which turn to noise at 40px.
- **Shine.** The heroes are soft and matte (lit from the left, right side darker). Several rejects had glossy
  sticker highlights (bubbles slime, cube slime).
- Gradients and the outline filter were the same; the problem was the design, not the rendering.

So every new enemy here is built the heroes' way: head token + something covering the top of the head (scalp with
a brow edge, cap, hood, hair, scale plate, hat) + the face at the front with the heroes' face gradient, shoulders,
fists in arm groups, weapon from under the shoulder. No eyes anywhere. Creatures that have no "bust" (slime,
spider, bat) are drawn from straight above with the same few-big-shapes rule and the same lighting.

## Designs
Greenskins (the Warren), each a different green, no eyes:
- **greenskin-goblin** (yellow-lime): huge ears swept out and back, a long hooked nose over a wide grin, rag tunic, rusty knife. *In the game.*
- **greenskin-hobgoblin** (olive-yellow): dented iron cap, short ears, flat nose, two small fangs, leather shoulders, falchion + round wooden shield. *In the game.*
- **greenskin-orc** (grass green): heavy brow, underbite jaw with two tusks, black topknot with a braid behind (sways), fur mantle, big cleaver. *In the game (also the Warboss).*
- **greenskin-orc-shaman** (grey sage): hide hood with three feathers behind, bone collar, small tusks, skull staff with a green-gold flame, a flame in the free hand. *In the game.*
- **greenskin-troll** (blue-teal): a huge hunched back with a shaggy moss mane, small head pushed forward, long drooping nose, big hands, a knotted log. *In the game.*
- **greenskin-ogre** (drab moss): big round bald head, underbite with two stubby teeth, fat shoulders with a spotted hide, no weapon: two huge fists in iron cuffs (my first try held a two-handed club in front; it covered the face and read as a long nose). Not in the game (no ogre unit yet).

Lizardmen and dragonborn (the Sewers), no eyes, each in two versions:
- **a** = plain: one scaly head lit from the left, a snout and nostrils, nothing else on the face.
- **b** = "shading like the humans": a darker scale plate over the top of the head (where a hero's headgear is) and
  the snout under it with the heroes' face gradient (dark under the plate, light toward the front, darker right side).
- **lizardman-spear-a / -b**: green, orange crest, tail behind (sways, in `#back`), spear held low.
- **lizardman-blade-a / -b**: sea-green, gold crest, red sash, tail, scimitar curved the other way from round 4: the
  edge bows in toward the body (the side it swings with) and the tip flicks out.
- **dragonborn-a / -b**: **red**, two big bone horns swept back, cheek spikes, dark iron shoulder plates with gold
  rims, a greatsword held low, no tail (so it isn't just a red lizardman).
- Not put in the game: the designer asked to see both shadings, so the current game lizards stay until one is picked.

Fiends, no eyes, tails straight back:
- **fiend-imp**: small, orange-red, little dark horns, pointed ears, a sly wide grin, small bat wings, thin tail with a spade tip, a ball of fire in one hand.
- **fiend-devil**: crimson, big black horns curving out and up, a pointed black goatee at the front, dark red wings, tail straight back with a black spade, a gold trident held low.
- **fiend-demon**: big, dark plum skin with glowing orange cracks on the shoulders and brow, ram horns curling round the sides, a glowing mouth, two huge clawed fists, short heavy tail. It reads as a horned brute; the cracks are what make it a demon. I did **not** make a "fiend": it didn't read as different from the demon and devil.

Slimes (fresh try, from the cube slime as suggested):
- **slime-big / slime-small / slime-fire**: a soft rounded cube of jelly from above, the drips turned 180 degrees so they
  trail behind (it reads as moving forward), no eyes, one soft shine (much softer than round 4). Big: a swallowed bone
  inside; fire: orange with embers. Only `#body` (the game squashes it whole).

Critters (fresh tries):
- **bat**: from above in flight, round furry head with big ears swept back, a small snout with two white fangs, the wings are `#arm-l` / `#arm-r` (pivots at the shoulders, so the game's arm swing flaps them).
- **ghost**: a pale sheet head from above with a hollow dark mouth, two wispy arms reaching forward, a long wispy tail with a curl behind (sways).
- **spider-hunter**: sandy-brown, chunky two-segment legs with dark tips, a dark chevron on the abdomen, two fangs at the front. The front legs are the arm groups (they lift to bite).
- **spider-momma**: bigger, purple-grey, a huge abdomen with pale egg bumps, thicker legs.
- **snowman**: from straight above, upright: a big snowball body, a smaller head, a plain blue beanie with a pompom (two shapes; my first try was a black top hat, which from above looked like an eyeball), red scarf with one end trailing, carrot nose poking forward, coal smile, stick arms with twig hands.

Angel:
- **celestial-angel-a**: the round-4 angel with the gold ring over the hair removed (that was the "crown").
- **celestial-angel-b**: the same with a thin pale halo standing up behind the head instead, so only its top arc shows past the hair (in its own `#halo` group, which doesn't move).

## In the game
- `art/enemies/goblin.svg`, `hobgoblin.svg`, `orc.svg`, `orc-shaman.svg`, `troll.svg` replaced with the round-5 greenskins.
- `js/enemies.js`: `headR` set so the body fills the hit circle (body half-width x vr / r): goblin 42, hobgoblin 54,
  orc 62, orc shaman 56, troll 66, warboss 62.
- `js/main.js`: a run started without options (the clip tool, `?auto`) now honours `?theme=` (it always used the saved
  theme, so `--q "theme=warren"` showed the crypt).
- Checked with `tools/clip.mjs --port 8835 --q "theme=warren&allnodes=1"` (+ `&bossroom` for the Warboss and orcs),
  `theme=sewers`, and a `labshot.mjs` sheet of all six greenskin kinds in every pose: no page errors.
  (The yellow dot on some goblins in clips is the game's key-carrier marker, not the art.)

## Still weak
- Greenskin faces are low contrast (green face under a green scalp); the brow edge reads more as a crease than an overhang at big size.
- The ogre is a drab single-colour lump; the hide over its shoulder hardly shows.
- The troll's hump at game size is mostly a teal disc; the mane and nose carry it.
- The shaman's staff skull is small and reads as a pale blob.
- Lizard version a: head and shoulders run together (same green); b has more structure.
- The demon reads more "horned brute" than demon.
- The ghost's tail curl makes it look a little like a seal from some angles.
- The bat is small and thin at game size (not in the game yet; would need a headR around 30 if it goes in).
- The snowman's head and body blend at the edges (no line between them by design); the scarf ring separates them.
