# Art round 5 (lane A1): hero art fixes

Built from the round-4 SVGs by the scripts in `_src/` (relative paths only):
`fixes.py` (patches the picked round-4 fixes), `casters/casters5.py`, `support/support5.py` (new and redone heroes),
plus check tools: `audit.py` (parts per file), `parts.py` (each part alone and posed the way parts.js swings it),
`board.py` / `zoom.py` (quick look boards). Renders for every SVG: `<folder>/renders/` (render_board.py).

## Structure (done first)
Every design is in parts inside `#sprite`: `back` (optional), `arm-l` / `arm-r` with `data-pivot` at the shoulder,
`body`, `front` (optional). **Hands and whatever they hold are always in an arm group, never in `#body`**; weapon arms
come before `#body` in the file (the weapon runs under the shoulder and only the fist shows), free fists, shields and
held lights after it. The outline is the `#outline` filter over the whole `#sprite` (in game, parts.js grows an ink
copy of each part and draws all inks first, so the outline goes on after, over the combined figure). `audit.py`
over every file shows no `gHand` in any `#body`; `parts.py` sheets show each arm lifting off cleanly when rotated
about its pivot (swing wind-up, strike, cast, limp). The game draws them right: checked in the game with
`tools/clip.mjs --port 8834 --q "allnodes=1&party=..."` for all 15 game heroes, no page errors.

## Fixes (the designer's picks)
- **Griffon** "bottom opening connected by a sliver; opening up a bit, cover the mouth, helm just as tall": the face
  opening now sits higher and stops above the mouth; the helm below it is one solid piece to the chin. Same outer helm.
- **Bearskin** "spikes still meh": two labelled versions. **A**: five big fat iron cones, evenly spaced (two each side,
  one out of the end), split light/dark, and an iron band. **B**: no spikes, a studded club (five big domed iron studs
  and a band).
- **Berserker** "top spike still meh": two labelled versions. **A** (in the game): six fat cones round the ball and one
  big four-sided spike in the middle of the top face, seen from straight above. **B**: eight short fat cones and three
  round domed studs on the top face instead of a spike.
- **Wildmane** "shorter locks on the sides": the side locks now end a little below the chin. (Her question: yes, the
  round-3 Wildmane had a forked beard; round 4 replaced it with the locks.)
- **Bandit** "red bandanna": the face bandanna is red. **A**: the head scarf swapped to the old navy so the red reads as
  the bandanna. **B**: both red.
- **Shade** "blades identical, flipped": the right hand is an exact mirror of the left (blade, grip, guard, fist).
- **Twinfang** "same": the right hand is an exact mirror of the left, shading included.
- **Granny Reaper** "hands moved up the shaft; opposite way": both fists slid the other way, toward the top end of the
  snath (44 and 72 along it; round 4 had 80 and 107, round 3 64 and 102).
- **Haymaker** "weird shading on the hat rim": the darker crescent inside the brim is gone; one soft straw gradient.
- **Gaper** "everything 30% bigger except the outline": the swords and bony hands are now 1.3x like the skull and
  bones (they were 1.12x / 1.08x); the outline width is unchanged (it comes from the filter, not the shapes).
- Paladin, Tower, Archer, Bard: unchanged (structure checked), copied so the game set is all here.

## Casters (`heroes-casters/`)
- **Alchemist** "hair and hat don't work together": **A** no hat, a wild white cloud of hair with brass goggles pushed
  up on a strap. **B** one leather cap with a short peak, the goggles round the cap, no hair showing.
- **Cultist** "doesn't read": redone. A tall pointed black-violet hood leaning back, a gold eye-in-a-ring sigil on top,
  red lining at the front edge; curved ritual dagger (right) and a burning black candle (left).
- **Druid** "pretty good, make 2 variants": **A** the round-4 druid kept as is (in the game). **B** elder: woven twig
  crown with leaves and berries, long white hair and mossy beard, a glowing seed in a twig cradle. **C** stag skull:
  a bleached stag skull worn as a helm with swept antlers, black hair, fur-and-moss mantle, thorny vine staff with a bud.
- **Frost mage** "maybe a blue gem on the hood": a faceted blue gem in a pale setting on the front of the hood.
- **Necromancer** "not good, staff meh": redone. New staff: a spine of stacked vertebrae topped with a horned skull,
  green fire in its sockets. Black-violet hood edged in bone-white with a ragged front and a drooping point; green
  ghost flame over the left hand.
- **Pyromancer** "not good": redone. Crimson hood with a gold edge, its back drawn into flame points; a flame-cut collar
  behind the head; an iron staff with a burning fire bowl; a flame over the left hand.
- **Shaman** "braids connecting to the head; too long": the braids are drawn under the hair so they come out from
  beneath it cleanly, and are three plaits long instead of five.
- **Storm mage** "not good": redone. Indigo hood with a yellow bolt down its top, a grey storm-cloud mantle on the
  shoulders, a steel lightning rod with a two-pronged fork holding a spark ball; a spark over the left hand.
- **Witch** "bad hat, use farmers as base": the hat is the Haymaker's straw hat (same brim, crown base and band) in
  violet, the crown drawn up into a bent point leaning back, a green band with a buckle.

## Support (`heroes-support/`)
- **Beekeeper** "bowl of the hat; farmers as base": the hat is the Haymaker's brim, crown and band in pale canvas with a
  dark band; the mesh veil hangs from the brim. Smoker and bees kept.
- **Chef** "weird": redone. The face shows now: the puffy toque sits on top of the head with its band round the brow,
  handlebar moustache, double-breasted whites, red neckerchief; frying pan (right) and wooden spoon (left).
- **Cleric** "not good" (now ranged, a light orb): redone. White hood with a gold rim and a gold sun on top; a slim
  white-and-gold staff holding a glowing light orb in a gold cradle; a soft light over the open left hand (the ray).
- **Lantern keeper** "not good": redone. An old lamplighter with a long white beard, moss-green cape and deep hood; a
  crook pole with a big brass lantern hanging from the hook, four glowing panes; a ring of keys in the left fist.
- **Monk** "necklace doesn't attach well": the bead loop is drawn before the head, so it comes out from under the chin
  and hangs in front with the big red bead at the bottom; nothing else changed.
- **Plague doctor** "bad": redone. Black hat built on the farmers' hat (brim, crown, band) with a red band and gold
  buckle; a long curved tan leather beak strapped on, jutting far forward; a tall black collar; cane (right) and a brass
  censer smoking green (left).
- **Seer** "hair isn't done the best": long smooth hair parted in the middle, one mass down the back and two tapered
  locks framing the face; blindfold kept, its tails over the hair.
- **Templar** "bad": redone. A flat-topped great helm seen from above with a red cross on its top and a gold strip down
  the front; white surcoat and cape with a red cross; longsword (right) and a white kite shield with a red cross (left).

## In the game (`art/heroes/`, same file names)
paladin, tower, archer, bard: unchanged. twinfang, wildmane, granny, frost, druid (A, unchanged design): fixes above.
berserker = Berserker A. pyromancer, storm, cleric, necromancer, plague = the redone designs above.

## Still weak
- Griffon still carries its hammer in the LEFT hand (arm-l) and the shield in arm-r; the game swings arm-r, so if
  Griffon joins the game the parts should be swapped (or mirrored).
- Witch and Shaman hold their weapon in the left hand too (same note).
- Spikes are a taste call: if A and B both still miss, a reference picture of the spike style wanted would help.
- Seer's hair top still reads a little like a smooth cap; Lantern keeper and Druid B are a bit "gnome".
- Necromancer is still mostly a dark hood at 40px; its new staff carries the read.
- Pyromancer's hood points can read as fire hair at game size (intended as a flame-cut hood).
- Gaper's blade tips come close to the bottom of the 220 box (the game's raster box has room).
