# Round 19 art lane: heroes and bosses

The designer: "Make a bunch of art ... character ... go crazy." This lane's share: the Water Mage's final art, heroes
whose notes asked for a redo that their art never got, and bosses still on borrowed or flagged art. Three takes each,
built to drop in: the same part ids and pivots as the file each replaces. Nothing is wired in; the game is unchanged.
Deck: `tools/riffle/decks/r19-art-heroes.json` (checked, not sent).

## How it was built
- Round 12's A2 library (`lib.py`, `common.py`, `kit12.py`), copied to `tools/art-heroart/A2/`; one module per subject
  (`water19.py`, `qm19.py`, `bee19.py`, `bandit19.py`, `queen19.py`, `chief19.py`, `grave19.py`).
  `python tools/art-heroart/build.py` rebuilds every SVG and picture here.
- **No outline in the files** (round 19, lane outline19: the renderer draws it). The library's filter is stripped as
  each file is written (`r19.py bare`). The pictures put the game's outline back on a copy (2.4 room units for the
  size the figure is drawn at: `tools/art-heroart/render.py`).
- Pictures: `<id>-<take>.png` = the take beside the art in the game now, at 3x, then at game size in four facings
  (on a dark tone and on the cream).
- Hands are named for the Disarmed split (parts.js bareArm reads `hand` in a fill's name): `gHand`, `gHandGlove`,
  `gHandIce`, `gHandGob`, `gHandBone`.
- Checked in the game: the wave Water Mage, the ledger Quartermaster, the skull Chieftain and the mantle Queen were
  copied over the live files for one lab grid (lab.html m=grid) and put back: they load, split into parts, swing and
  take the outline.

## What is here, and how to swap one in
| subject | files | replaces | parts | my pick |
|---|---|---|---|---|
| Water Mage | `heroes/waterMage/waterMage-wave/-orb/-shell.svg` | `art/heroes/waterMage.svg` | arm-r (staff or orb), body, arm-l | wave |
| Quartermaster | `heroes/quartermaster/-pots/-ledger/-sack` | `art/heroes/quartermaster.svg` | back, body, arm-l, arm-r (fists on straps; ledger in arm-l) | ledger |
| Beekeeper | `heroes/beekeeper/-veil/-skep/-beard` | `art/heroes/beekeeper.svg` | arm-r (smoker), body, arm-l, front (bees) | veil |
| Bandit (rogueBandit) | `heroes/rogueBandit/-highwayman/-cutpurse/-rascal` | `art/heroes/bandit.svg` | arm-r (cutlass), body, arm-l | highwayman |
| Winter Queen | `bosses/winterQueen/-spires/-mantle/-glacier` | `art/bosses/winter-queen.svg` | back (100 92), arm-l/arm-r (46/154 110), body | mantle |
| Goblin Chieftain | `bosses/chieftain/-skull/-mohawk/-crown` | `art/bosses/goblin-chieftain.svg` | back (100 100), arm-r (156 114), arm-l (44 114), body | skull |
| Grave Warden | `bosses/graveWarden/-digger/-coffin/-undertaker` | its borrowed `art/enemies/brute.svg` (js/enemies.js graveWarden) | arm-r (158 108), body, arm-l (42 108) | coffin |

Swapping: copy the picked file over the one it replaces (the Grave Warden's: give it a new file, e.g.
`art/bosses/grave-warden.svg`, and point `graveWarden.art` at it), then the version's `build-sw.py`. No headR or vr
changes: each take is drawn in the same box at the same scale as the file it replaces.

## Not done, and why
- The six new heroes (Mob, Clockmaker, Air Mage, Warden, Telekinetic, Earth Mage): art round 12 drew three takes each
  and the deck (`art-round12`) is still unanswered: no new set until a pick.
- The Enchantress, the Pit Lord's face and tail, the Gilded Seraph's helm: art round 11 drew sets, also unanswered.
- The code-drawn bosses (Great Engine, Cinder, Great Ooze): rebuilt in 0.18 as jointed figures; the only note since is
  the Engine's layout (hover, a third arm), which is code. The Sand Wurm and the spider boss are other lanes'.
- The Alchemist, the Witch, the Shaman and summons: lane caster19's.

## Weak, said plainly
- Water Mage `wave`: the crest reads as a hood with a curled tail more than a wave until it is seen big.
- Water Mage `shell`: the conch can read as a tall cone hat at game size.
- Quartermaster `sack`: the things poking out of the sack are small at game size; the sack's mouth reads as a lid.
- Beekeeper `beard`: at game size the beard of bees is a speckled orange mass; the bees only show at 3x.
- Winter Queen `glacier`: her braid shows above the crown like a crest; the ice daggers point down like tusks.
- Chieftain: the fists sit at the shoulders' front edge with a little gap; the skull take's feathers read as dark sticks.
- Grave Warden `undertaker`: the hat is flat black against a dark floor.
