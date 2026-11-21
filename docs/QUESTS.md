# Quests: a design (round 9, not built)

The designer: "there should be quests. Like deliver x peasant from x to x without them dying, or kill 25 slimes, or
collect x." This is how they would fit the camp ground and the runs we have. Nothing here is built yet.

## What a quest is
One short goal with one reward, carried into runs until it's done or dropped:

| kind | goal | how it's counted |
|---|---|---|
| **Hunt** | kill N of a kind ("25 slimes", "8 elites in the Sewers", "a major") | kills of that kind in any run, or in the named dungeon |
| **Gather** | bring back N of a thing ("6 glowcaps", "3 bone charms") | quest items that drop only while the quest is held; banked when the run ends, lost with the leaving cut like gold if the party falls |
| **Escort** | take someone from a to b alive ("the peasant from the Warren's floor 1 to its floor 2 checkpoint") | an extra friendly unit in the party for that run: weak, follows the party, can't be revived; reach the end room of the floor with them standing |
| **Reach** | get somewhere new ("reach the Crypt's floor 3", "beat a floor without a potion") | read from the run summary |

Escort is the new mechanic: the escorted unit uses the summon code (team hero, own AI: keep near the party, flee
enemies, never attack), so the room fights stay the same and only the party's priorities change (protect it). It counts
against nobody's seat.

## How they're offered in the camp
- **A notice board** stands in the camp ground beside the trader's cart: a thing you tap, like the book and the
  settings chest. It zooms in like the others (the board in the top third, the quests below).
- **Three offers at a time**, drawn like the trader's stock and **refreshed after every mission** (the same
  `save.runs` key as the stock, so both turn over together). Offers come from the dungeons that are open, weighted
  towards the frontier, so a quest is always somewhere the player can go.
- **Up to two held at once.** Taking one is a tap; dropping one is a tap and costs nothing (no punishment for trying).
- Escort quests are **posted by a visitor**: the escorted person stands at the camp's edge (where unrecruited heroes
  stand) while the offer is up, so the camp shows who's asking.

## How they're tracked
- `save.quests = { offers: [quest...], held: [quest...], runs }`, each quest `{ id, kind, target, n, have, dungeon?,
  floor?, reward }`. Hunts and gathers count up from the run summary (`summarize` already lists kills per kind once
  the bestiary counts are read; gathers add a `questItems` count).
- **In a run**, a held quest shows as one slim line under the floor track in the HUD ("Slimes 14/25"), only while it
  applies to the room you're in, so the HUD the designer marked good doesn't grow. An escort shows the escorted
  unit's face in the hero card row, with its HP bar, no abilities.
- **In the camp**, the notice board shows held quests with their bars; a quest that's ready glows on the board, and the
  board itself gets the same teal dot the heroes get for unspent points.

## How they're rewarded
- Turned in at the board with a tap (a small moment: the paper is torn off, the reward pops into the purse).
- **Gold** for most, sized at about one floor's worth of the dungeon it points to, so a quest is worth doing on its
  own but never beats playing.
- **Gems** for the harder ones (escorts, elite and major hunts): gems are kept "maybe to unlock special skill-tree
  abilities", so quests become the main way to earn them, and the web's gem nodes become a quest reward in effect.
- **Sometimes a trinket** (a rare one not in today's stock), or **a hero's recruiting price halved**: the visitor
  you escorted may join for less.
- No XP: levels come from fighting, and quests shouldn't push a hero past what the web expects.

## Open questions for the designer
1. Escort: should the escorted unit be **fragile and fleeing** (easier to judge, a chase) or **slow and sturdy** (the
   wagon idea in miniature: hold the line round it)? The wagon pitch suggests the second; it's also a cheap test of
   that mode.
2. Should a held quest change what spawns (more slimes while you hunt slimes), or only count what's already there?
   Changing spawns makes quests faster but bends the floors' rosters.
3. Two held at once, or one?
