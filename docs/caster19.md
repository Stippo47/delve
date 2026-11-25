# Round 19, lane caster19: the Digger, Grandpa Sickle, the Alchemist, the Shaman, the Witch

The designer's notes on 0.19's heroes (docs/riffle-log/2026-11-25-v19-v21-partial.txt), each done as asked. Shared rules
from the same notes (one shadow system, lobs landing on the middle, the air drawn over the floor, pronouns) are lane
sys19's (docs/DECISIONS.md, round 19); this lane merged main after sys19 landed and builds on it.

Code: js/kits2.js (the abilities), js/fx2.js (their looks), js/heroes2.js (words, summons), js/statuses.js (Dirty),
js/tags.js (burrower), js/parts.js (two new parts that hide), js/fxkit.js (the spade's swing, the monster's punch, the
Harvest sweep), js/preview-scenes.js (Book scenes), js/hud.js (Dirty's buff not shown twice). Art: art/summons/totem.svg,
spirit-wolf.svg (new), spirit-eagle.svg, cauldron.svg; art/heroes/witch.svg, alchemist.svg, alchemist-monster.svg (new).
Tools: tools/caster19/ (animals.py and svgkit.py draw the summons and sketches in the art round 12 way; alchemist_art.py;
bookclips.mjs records the Book's previews; probe-dirt.mjs checks the Dirty rules; svgsheet.mjs, frames.sh for looking).

## Dirty: one status for everyone (statuses.js DIRTY, kits2.js dirty)
The designer: Dirt Fling "should make target dirty (clears enemies' effects too). When he hits a dirtied foe he deals
double damage and clears the dirt (with shovel or dirt clumps from shovel)"; Bury: "should be dirty when they get back
up"; the trait: "Don't like the dirtied effect visual".
- On a **friend** (Dirt Fling, his trait), as before: soaks the next blow, fire and poison washed off and kept off, 30%
  slower blows, 10 s.
- On a **foe** (Dirt Fling, Bury): 6 s; the helps it has on are washed off when the dirt goes on (rage, haste, wards,
  shields: any buff that helps it); 30% slower blows; **the Digger's spade (a swing, or the clods it throws) lands
  double on it and knocks the dirt off** (a burst of dust and crumbs, "x2"). No soaked blow and no fire/poison guard on a
  foe. Call: "clears enemies' effects" read as its *helps* (washing a foe's burning or poison off would help it).
- **Look** (one, both sides): no smears on the face. A brown wash over the body (its 'dirty' buff) and a little cloud of
  dust round it, the way it hangs round someone who has been rolling in the dirt: soft puffs swelling and drifting off
  round its feet, more trailing when it moves, a crumb dropping off now and then.

## The Digger
- **Spade** ("Don't like the hit effect. Also, have the projectiles burst out from behind anyone who was hit with the
  shovel. They don't get thrown automatically anymore"): the swing is its own (fxkit 'spade': a shorter sweep in earth
  colours, not the white heavy crescent); a hit lands as a flat thwack of dust and dirt chips, no white star; three clods
  burst out of the far side of each one struck (0.3 x his damage each, short range) at whatever stands behind it. No clods
  on a miss.
- **Burrow** ("Trail better. Maybe not transparent. ... start fading later but much faster ... Bigger churned clumps.
  The dirt mound itself doesn't look good. Should also leave a mound behind when he emerges"): a solid furrow of turned
  earth (one body, one outline), big churned clumps along both sides, the whole trail held while he is under and ~2.5 s
  after, then gone together in a quarter second; a mound of earth with a hole where he goes in and one where he comes up,
  each settling back into the floor after ~3 s (fx2 `mound`, used by Bury too).
- **Dirt Fling**: enemies hit are Dirty (above); its score rises when a foe in front has helps on it.
- **Bury** ("Doesn't look good. Should be dirty when they get back up. Should not be able to move when buried unless they
  are native to the underground like a sand worm"): under the same mound, shut, shaking harder and cracking as it digs
  out; held exactly where it went down; comes up Dirty. Things with brains of their own are buried now too (they were
  only stunned); bosses, things fixed in place and the parts of bigger bodies still only reel. **New tag `burrower`**
  (tags.js: scarabs, the golden scarab, the sand serpent, the drill bot, the Sand Wurm): buried, it digs about under there
  as it likes (its mound goes with it) and isn't stunned.
- **Trait**: the Dirty look above.

## Grandpa Sickle
- **Bread Toss**: no steam. "If he eats 1 too he needs to throw it up and down": his own loaf goes up from his hands
  turning over and drops back into them, and he eats it then (0.6 s). One shadow and landing on the middle: sys19.
- **Harvest** ("Looks like he jumps. Not dash. Should do a circular sweep like the granny reaper. Seems like the landing
  does damage but the sweep [doesn't]. Shows a random star on him as he jumps"): he runs to the friend along the floor
  (dust off his heels, speed lines, no hop), then turns a full circle with the sickle out, drawn with the Granny Reaper's
  own sweep (fxkit's reap crescent riding his blade), and each foe is cut as the blade passes it. No cast flash (the
  star). Reach u.r + 60 (was 72: it is a short sickle). Numbers as they were.
- **Sheaves**, in Old Tales' slot (id kept; "I like the book ... Change ability. He throws out 4 planted hay bunches
  random. Low hp. If an ally breaks it heals them, enemies that break it become hayed (same effect the pitch farmer
  does). When a party member hits someone who is hayed their cooldowns come back faster. Like 15% boost to all non full
  abilities"): four sheaves of wheat, tied at the waist, thrown down at random between him and the fight (kits2 SHEAF:
  8 health each, 14 s). A sheaf is a summon on his side: **the enemy take it for one of the party and strike it**; a blow
  breaks it and the one that broke it is hayed (the Haymaker's Pitch Hay look and slow: x0.6 move) for 4 s (II 6 s); an
  enemy treading on one breaks it too. **A friend breaks one by stepping on it** and is healed 10% (II 15%); hurt friends
  with nobody on them walk over to fetch one (as for the Chef's plates). **While a foe is hayed, every blow the party
  lands on it quickens the striker's abilities**: its cooldowns not yet ready run 15% faster for 3 s (a gold arrow
  whirls over the striker's head when it starts). III: a sheaf bursts as it breaks, sharing it with everyone within 75
  (friends healed half). Calls: "15% boost" read as cooldowns running 15% faster for a moment after each such blow (a
  flat 15% of each cooldown off per hit would be far stronger for quick hitters); not spoken, so no longer a mouth/sound
  ability (Silenced doesn't stop it). The story book's drawing is kept in fx2.js (storyBook, tellClock) for later use.

## The Alchemist (they/them)
- **Unstable flask** ("They aren't holding it"): the round flask in the art's hand is now a skinny tube like the vials on
  their head (its own part, #arm-r-tube); the brew in it is painted in the colour of the next throw, on the arm as posed,
  so it moves with the throw; the thrown tube leaves from where the tube in their fist is, and the fist is empty until
  the next is pulled off the strap (0.45 s). Every thrown potion (attack, Brew Pools, Elixir) is a corked tube now.
- **Brew Pools** ("Don't like ice puddle, lightning, water. Winds could be improved"): each pool is the brew spilled out
  of its tube, a glossy splash in its colour with droplets round it, and what it does rising out of it: cold breathes a
  frosty mist with snowflakes drifting up (no ice); shocking fizzes, its bubbles popping in little crackles (no bolts);
  water ripples where drops fall back into it; whirling is a mint whirlpool, its foam drawn round and in, small gusts
  curling up off it. Acid and fire as they were. Rules unchanged.
- **Monstrosity** ("Should not hold a flask. It will be alternating punch attacks. Not claws. High knock back. They
  should have fast movement speed. Don't like visual. They should get a new altered sprite ... Purple skin. ... Should be
  shown drinking a purple tube flask first"): they stop and drink a purple tube (0.55 s, tipped to the mouth, its level
  going down, bubbles fizzing), then become art/heroes/alchemist-monster.svg (their own picture, purple skin, fists half
  as big again, no tube; a sketch for the art round, made by tools/caster19/alchemist_art.py), punching left and right in
  turn (fxkit 'fist': a purple thump where the knuckles land), knock back 320 (was 160), moving 60% faster (was 25%).
  The rest as it was.
- **Elixir** ("Splash could look better ... Lvl 2 lets them throw 2 different potions each on their own roll for who and
  what kind"): the tube breaks over the friend (glass shards glinting, the brew bursting out in heavy drops that fall back
  onto it, a glow of its colour sinking in, the sign rising). II throws a second tube at once: its friend rolled at random
  (the needier the likelier) and its brew rolled, never the same as the first. III: the strong brews (22% / ward 45 /
  +35%) splashing every friend near. Call: II used to be the strong brews; they moved to III with the splash, so II's
  second tube doesn't stack with them.

## The Shaman
- **Spirit bolt** ("It's not shown in book"): the Book's attack scene has a hurt friend fighting beside the enemy struck,
  so the spirit is seen to leap on to the friend and mend it (preview-scenes ATTACK_SCENE.shaman).
- **Healing Totem** ("the wing and beak on totem don't match the one on their sprite. Should burst where it lands. When
  an entity is hit a light orb should home from hero to totem to be absorbed. Should only have collisions on the base of
  the totem. It's not laying down."): totem.svg's wings are the back totem's own swept, scalloped wing scaled up (its
  cream-tip-to-dark-teal colour), its beak the back totem's small cream triangle under the teal band; the thrown totem has
  the same wings and beak. It lands with a burst (a white-teal flash, dust knocked out, feathers of light flung to the
  edge of its reach). A blow taken off a friend goes as an orb of light that leaves the friend, swings out and curls into
  the totem's carved head, sinking in with a flash. Its body is only its foot now (r 13; the picture stands up the screen
  from it, so the foot is where it touches and casts its shadow). Numbers as they were.
- **Ancestors' Call** ("In game the wolf looks different from the rest. Eagle doesn't look right and isn't always rendered
  above entities on the ground ... do wolf (in the same style), bear ..., and eagle (better shape). Also try a fish/salmon"):
  a spirit wolf drawn like the beaver and the bear (art/summons/spirit-wolf.svg: long body, bushy tail, pricked ears, long
  muzzle, the swirl; no more grey wolf washed blue); a new eagle (spread wings with finger feathers at the tips, the
  leading edge forward and the scalloped trailing edge behind, a fan tail, a white head, a hooked gold beak). Drawn over
  the floor: sys19's air tiers (tag flier). The bear stays as it is until the designer approves a new one.
- **Sketches for approval** (not in the game): design/caster19/bear.svg / bear.png (a large brown bear seen from above,
  the Bearskin's pelt colours: heavy shaggy body, shoulder hump, round head, small ears, tan muzzle, big paws with cream
  claws; the spirit bear is made from it once approved) and design/caster19/salmon.svg (+ salmon-spirit.svg, the same fish
  in the ancestors' blue) / salmon.png. design/caster19/spirits-in-game.png: the four as they are in the game now.
- **What each animal represents** (the ancestors' gifts):
  - Bear: strength and shelter. It fights beside the party and the friends near it take less.
  - Wolf: the hunt and the pack. It runs down the enemy the party is fighting.
  - Eagle: sight from above, and healing. It flies over the friend most hurt and mends it.
  - Beaver: the builder's patience; works that last. It sits by the Shaman and keeps sending out its homing orbs.
  - Salmon (sketch): the way home, and coming back. A gift for a revive or a return (an idea, not built).
- **Spirit Link** ("Not showy enough. Preview doesn't show off potential"): the threads reach out from the Shaman to each
  one as it's cast (a flash where each binds), light runs along them both ways the whole time, a ring of teal motes goes
  round each one's feet, and a shared blow is seen: a bright pulse runs from the one struck along the threads to everyone
  else on the link. Book scene: four friends each being hit (so the sharing shows) and III's five.

## The Witch
- **Hex bolt** ("More like minecraft enchanting table shape"): each hex is a rune of an old angular script of our own
  (straight strokes, hooks and dots; ten of them, nothing copied), pale green, held upright as it flies, with ghosts of
  it trailing behind and small rune scratches peeling off.
- **Broom Ride** ("Don't make her invisible, make sure the broom is under her. Not on the ground. Better broom visual.
  Remove the broom from her hand when flying"): drawn solid; the broom is drawn under her body in her own frame, so it is
  up there with her (a crooked handle out past her front with a knot at the tip, a full bundle of twigs bound with a purple
  band flaring behind, their ends whipping, wind lines streaming off); her broom is its own part in witch.svg
  (#arm-l-broom) and is hidden while she rides. The hex bombs fall from her height. Call: "nothing can pick her out" is
  gone with the invisibility: she is on the flying layer (round 18's ruling, tags.js), so only shots can reach her up
  there, and enemies can aim at her.
- **Cursed Brew** ("More top down cauldron. Opening more circular. Don't like landing effect and the thrown projectile
  doesn't line up"): cauldron.svg is seen from straight above now (a round iron belly, thick rim, a round mouth full of
  green brew, feet and ring handles showing), drawn flat; little flames lick out all round under it. The thrown pot is the
  same pot, as big as it stands, so it lands as itself (and on the middle: sys19). The landing: a dark ring of dust along
  the floor, green brew slopping over the rim in heavy drops that splash where they fall, a puff of purple curse.
- **Hex** ("Better frog visual ... Probably a smaller shadow"): a frog drawn properly from above (pear-shaped body, darker
  blotched back with a pale stripe, domed yellow eyes with slit pupils that blink, a wide mouth, front legs, the long back
  legs folded in a Z with webbed feet, kicking out straight on each hop); its one shadow is frog sized (9 x its size, was
  11; sys19's shadow system).

## Numbers (tools/ability-worth.mjs, 24 parties each, rank 1 at III and rank 0 at I; "rooms" is the whole worth, +-0.5)
See the tables at the end (filled in from tools/caster19/worth-*.txt).
