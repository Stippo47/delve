# UI v3: the camp, the tree and the battle HUD, from scratch (round 8, lane U)

The designer has turned down three looks: a stack of cards (round 5), the same screens re-themed (round 6: "you just
changed the theme. It was fundamentally bad layout/design"), and a camp you walk around in (round 7: "decent"). What
they did like: the Night watch colours, and the star wheel skill tree as "more along the lines of what I want".

## What good mobile roguelites do, and what we take
- **Archero, Survivor.io, Legend of Slime, Soul Knight**: one hub screen with a big Play button just above a fixed
  bottom tab bar; the stage card above it swipes sideways, locked stages greyed with one line saying how to open them;
  currencies in a thin top strip. Everything else is one tap away in a tab, never more than two levels deep.
- **Hades (the Mirror), Grim Dawn (constellations), Path of Exile (the passive web)**: upgrades as a picture you
  explore, with the path you took lit up, and one detail panel for the thing you touched. No lists repeating the
  picture.
- **AFK Arena, Idle Heroes, Legends of Idleon** battle HUDs: a strip of small hero portraits along the bottom, a level
  badge, thin HP and energy bars, the ultimate's ready-state on the portrait. The fight gets most of the screen.
- **Darkest Dungeon's hamlet**: atmosphere lives in a picture at the top of the hub, but buildings are buttons, not a
  map you walk.

## Information architecture
A fixed **tab bar** at the bottom (in thumb reach), five tabs, the middle one raised:

| Tab | What it is for | What is on it |
|---|---|---|
| Heroes | who you have, and making them stronger | the roster (level, unspent skill points, resting timers, gold price for ones you don't have) -> a **hero page**: Skills (the web), Gear (trinket slots, what they do), About (attack, abilities, trait) |
| Trader | spending gold | equipment (trinkets: buy, level up), potions; prices always on the tile |
| **Delve** (home) | going down | the fire with the party's seats (locked seats say which boss opens them), the dungeon carousel (locked ones say which boss opens them), the floor picker (checkpoints), packing potions, the Delve button |
| Book | the bestiary | monsters met (unknowns are silhouettes), items, statuses |
| Settings | how it looks and sounds | sound, dungeon look, puddle style, enemy HP style, the unlimited-gold cheat |

Two depths at most: tab -> page (hero) -> bottom sheet (a node, a trinket, a ware). Back is always top-left on a page;
sheets close by tapping outside or dragging down. The battle is its own full screen.

## Thumb zones (portrait, one hand)
- **Easy (bottom third)**: the tab bar, the Delve button, a selected tree node's Learn button, sheet buttons, the battle
  hero cards. Every primary action lives here.
- **Stretch (middle)**: the dungeon carousel (a sideways swipe), party seats, the tree canvas (drag and pinch anywhere).
- **Hard (top)**: read-only things: gold, the floor track in battle, page titles. Back and pause sit top-left as in iOS,
  where people expect them, and are never the only way out (the tab bar and a swipe work too).

## Visual language
- **Colour**: Night watch, made into a system. Ink `#0E1120` page, `#171B2E` surfaces, `#22284A` raised, hairlines
  `#2E3560`. Text parchment `#F2E8D2`, quiet `#9BA2C0`. One accent, **ember gold `#F5B841`**, means "act / gold": the
  Delve button, prices, the level badge, owned tree paths. **Skill points are teal `#4FD8C8`** (the only other accent).
  HP green `#5CC45A`, XP violet `#8C7CFF`, danger `#E8604C`. Role colours only as thin rings on portraits.
- **Type**: the system rounded face (`ui-rounded`, SF Pro Rounded on iPhone). Scale 11 / 13 / 15 / 18 / 24 / 32;
  captions in small caps with letter-spacing; numbers tabular. Two weights: 650 and 850.
- **Shape**: everything sits on one 4px grid. Panels 16px radius, tiles 14px, chips and buttons fully round. Portraits
  are rounded squares with a role ring; tree nodes: stat = small circle, ability = rounded square, keystone = diamond,
  slot = hexagon. One shadow (a soft drop) and one top highlight; no bevels, no wood, no paper textures.
- **Motion**: taps press to 96% in 90ms; pages slide 220ms; sheets rise 240ms; the tree eases to a picked node; a
  bought node pulses once. Nothing loops except the fire and a ready ability's glint. `prefers-reduced-motion` turns it
  all to fades.

## Why this is different from the last three
1. **Layout first, theme second.** Round 6 swapped skins on the same stack; round 7 hid actions inside a scene. Here
   every screen has one job and a fixed frame (top strip, content, thumb row, tab bar) that never moves.
2. **No walking.** The clearing made you travel to the tent or the cart. Tabs make every place one tap away, and the
   fire stays as the home screen's picture, not its menu.
3. **The tree is the screen.** The wheel was boxed into a card, with branch tabs and a list repeating it underneath. Now
   the web fills the page, pans and pinches, has room for 100+ nodes, and has exactly one extra element: the panel of
   the node you touched.
4. **The HUD gives the fight its screen back.** Cards were two rows of tall tiles; now one slim row: face, slim HP bar
   with numbers, the level badge on the left of the XP bar, three cooldown dials, status rings and item sprites.
   Built from plain divs with block bars and fixed heights, so iPhone Safari draws them.
