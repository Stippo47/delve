# Build v5: round 9 (2026-11-21)

The designer answered everything (47 cards). **The spec is their words in `docs/riffle-log/2026-11-21-round9.txt`**:
read your lane's parts of it in full; this file only sorts it into lanes and records rulings. Earlier contracts
(BUILD-v1..v4) hold unless changed here. Lanes work in their own worktree and branch, commit, never push.

## Rulings this round
- **Names.** What 0.9.0 called a "mini-boss form" is now a **major**: a stronger, better elite, carries 2 trinkets
  (elites 1), **no rage/enrage**, can appear on any floor, has **one more move than an elite**. **Mini-bosses** are
  only the custom, named ones at the ends of floors 1 and 2.
- **Elites and majors have no gold outline**: just bigger versions of themselves, maybe a tint or a twinkle. **A
  coloured border round a unit's outline is reserved for protection / invulnerability** (Guard gives a golden one).
- **Gems stay** (maybe to unlock special skill-tree abilities). Undo "gems are gone": keep the count, drops and the
  HUD/camp pill; nothing spends them yet.
- **Skill web**: hide nodes that aren't adjacent to a known node; a dev cheat shows all. The "Learn" button: "Learn - 1 point".
- **Roster** (deck roster2): approved with changes, enemy by enemy, in the log. Everything marked RETHINK or IDK with
  no replacement stays out for now. New statuses asked for: **Entangle** (ents: very slow, attacks and movement cause
  slight damage; burst = rooted, attack slowly, damage over time and more when attacking) and maybe **Fear**
  (banshee: run away; burst = terror, an ability wasted/misfired).
- **Camp**: a Nuclear Throne-style camp ground: heroes stand or wander about the camp; book, trader, settings are
  things in the camp; the fire is centred; the party sits close round it; tap the fire to pick the party (zoom in, a
  list of heroes, pick one then a seat); "Delve" shows in the flames; tapping it opens a bottom-up scrolling **map**:
  a clearing with the fire at the bottom and a trail winding up through each biome; rooms are small dots, floor ends
  large dots, bosses a skull; beaten = white, highest checkpoint = yellow, not yet = grey. Tap a hero in the camp:
  zoom on them (top third), gear/skills/about below (two thirds). The trader shows a small stock that reshuffles
  after every mission. **Quests** (escort x from a to b, kill 25 slimes, collect x): wanted, design first.
- **Puddles**: not happy with the 4 styles; more variants, and overlapping bodies of the same thing must **merge into
  one body** (dark with dark, light with light, then one outline round all): no fixed sprites.
- **Enemy HP**: Bar, shown **above** the enemy; Arc for tankier enemies, also on top and a bit further off.
- Radiance: no halo, a different look. Burn: the static flames look worse; animate them. The Bone King's abilities
  need a visual overhaul. The knight's shadow is missing.

## Lanes
| lane | branch | does |
|---|---|---|
| E: enemies | `foes2` | majors/elites rename and rules; the **Wildwood** as the new first dungeon (all approved kinds, the designer's changes, its two mini-bosses and the Elder Ent boss, Entangle); approved variants and new kinds for the Warren, Sewers and Crypt; variant recolouring (hue shift at load, no new art needed); gems back |
| V: visuals | `vis2` | every showcase note (per hero and ability, in the log); puddles as merging bodies with more styles; enemy HP placement; elite/major look and the protection border; radiance, burn, Bone King visuals; the missing shadow; re-record the showcase |
| U: camp | `camp3` | the camp ground, party pick at the fire, the delve map, hero zoom page, trader stock, the web's hidden nodes and dev cheat, the Learn button; a short written quest design (docs/QUESTS.md), not built |

Placeholder art is fine for new kinds this round: reuse the nearest existing art (the tamer's wolf, boar and other
beasts in design/class-round5/fighters, the Bandit hero art for bandits, a recoloured troll for the ent) and mark it
PLACEHOLDER; variants are recolours.

## Queued
Art (the round-7 notes: orc's wider mouth, ghosts without the back sliver, the liked troll shape twice as big with a
boulder, the mohawk one kept as something else; real art for the new kinds), the rest of the roster (Frost, Ember,
Spire, Dunes, Foundry changes), the remaining heroes with kits, a designed boss per dungeon, the convoy mode.
