# Boss: the Great Engine (the Clockwork Foundry, floor 3)

The Clockwork Foundry's boss. The designer (round 9, the Great Engine card, RETHINK): "You know the terraria skeleton
boss? Yeah do that here. Separate hands and head. Can have different abilities, but the body plan should be that."
So: Skeletron's body plan, a floating head and two hands that attack on their own, with the Foundry's own moves.
Built like the Bone King (`docs/BOSS-bone-king.md`).

**Not wired yet:** the Foundry theme is lane R's (`roster3`). Until it names `greatEngine` as its boss, it runs through
`?bossroom&boss=greatEngine` (any theme) and `lab.html?m=boss&boss=greatEngine`. Battle mode lists it once a theme does.

Code: `js/boss-engine.js` (numbers in `GE`, `PHASE_AT`), shared tools `js/boss-kit.js`, looks `js/fx-boss.js`
(`drawEngineHead`, `drawEngineHand`, `drawFoundry`, `drawLaser`). Art: PLACEHOLDER, drawn in code.

## Who it is
A floating iron head (a riveted dome ringed with gear teeth, a furnace grille for a mouth, no eyes) and **two iron
hands** that hang at its sides: the left ends in a **hammer**, the right in **three claws**. Each hand is a unit of its
own with its own health (14% of the head's): it can be broken, and **comes back rebuilt 12 s later** (8.4 s in the last
phase). The head **guards itself with its hands**: while both are up it takes half of every blow; with one gone, all of
it; with both gone, half again more. So the fight is: break the hands, then pile onto the head before they're back.
A blow on a hand also passes 40% of itself on to the head.

## The arena: the Engine Room
Iron floor, four boiler pillars, a conveyor band across the middle. It hangs at the far end until a hero comes within 480.

## Phase 1: Assembly (100% to 65%)
The hands take turns, one every 2-3 s:
| hand | move | tell | shape | hit |
|---|---|---|---|---|
| left | **Hammer** | 1.0 s: the hand rises over a hero | a circle 96 where it comes down | 105, staggered |
| right | **Claw** | 0.85 s: it draws back | a rake along a line 420 through the hero, 88 wide | 88, thrown hard |
Kill the hand while it's winding up and the blow never lands.
The head: **Steam Vent** when a hero comes close: a circle 160 round it (0.85 s): 70, burn 30, thrown. It floats after
its mark, keeping 150-260 off.

## Phase 2: Overdrive (65% to 35%)
**Turn:** a blast of steam round the head (a circle 220) and **both hands rebuilt at once**. Then:
- **Rocket Fist**: a hand aims (0.9 s, a line 640 shows) and fires down it at a hero, then flies back: 110, thrown.
  Hands now sometimes go for someone other than the head's mark.
- **Spin**: every 11-13 s the head whirls after its mark for 3.6 s, a circle 92 going down just ahead of it the whole
  way (52 a hit, thrown); then it stops, venting steam: 1.2 s open.

## Phase 3: Meltdown (35% to 0)
**Turn:** steam, both hands rebuilt; the furnace glows. Then:
- **The Eye**: every 9-11 s a beam from the head (1.1 s tell) sweeps 1.4 rad across the room over 2.4 s, stopped by
  pillars: 24 every 0.15 s and burn while you're in it.
- **Clap**: both hands come together on a hero from either side (a line 480 through them, 1.0 s): 110, staggered.
- Hands are rebuilt faster, and everything is 15% quicker.

## Death
It drops, venting steam; its hands fall with it.

## Why it's fun to watch
- Three bodies, one boss: the party splitting between the hands and the head, and the moment both hands are down and
  everyone piles onto the head.
- A hand killed mid-swing: the blow never lands.
- The spin chasing one hero, then the Eye sweeping the room.

## Numbers
Health 900 (round 12; was 1000) (x1.4 for every boss, then the dungeon's strength and party size), float 46, mass 14. Phases at 65% and 35%.

Balance (`node tools/runs.mjs --boss --theme spire --bossid greatEngine --level 66 --party paladin,archer,cleric,twinfang`:
the Spire's strength stands in for the Foundry's; level 66 is a guess past the Dunes):
| | won | fight length |
|---|---|---|
| 10 fights, level 66 | 7 of 10 | avg 189 s |
(+20% damage and hands every 1.6-2.4 s took it to 1 of 10.) Re-run against the Foundry's own strength once roster3
merges (knobs: `GE.hand.every`, the hands' damage, `GE.guard`).

## After main's round-10 balance pass (armour, cooldowns x1.22, poison's burst, 52 heroes)
Re-measured, not retuned (the lead tunes hero numbers first): the Foundry' own strength (`--theme foundry`), level 66: won 0 of 10, avg 86 s. Same command as above.
