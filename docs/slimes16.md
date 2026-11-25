# Slimes hop (round 17, lane slimes16)

The designer: "Slimes should also hop, getting vertical offset, and aren't affected by floor things while hopping.
Should jump further and faster. The contact of the slime does the damage."

## What changed

Before: a slime (`def.hops`) walked in pulses: a burst of speed along the floor, then a slow crawl, with no height,
and hit with an ordinary melee swing (plus a small lunge shove).

Now every slime moves only in hops and hurts only by landing on you. Kinds that hop: Slime, Slimelet, Big Slime,
Poison Slime, Poison Slimelet, Sludge Slime, Ice Slime, and the Fire Slime (it had no hops before: it walked and
dripped fire; it now hops, drips where it lands, and its touch burns). Leeches, gear sprites and the other things
built on the slimelet with `hops: null` are untouched. The elite slime and slimelet keep their own moves (the elite
slimelet's pounce is a leap, which takes over the body while it runs).

The Great Ooze (boss) is left alone: it has its own brain and its own Hop Slam. The slimes it buds off are plain
slimes and sludge slimes, so they hop now (they still crawl home to it the same way, only in hops).

## How a hop works (js/sim.js, "slime hops")

Each hop has four parts, timed from the kind's `def.hops` beat (0.8 s slimelet, 1.1 s slime, 1.5 s big slime), so
bigger slimes hop heavier and slower:

| part   | share of the beat | what you see |
|--------|------|------|
| crouch | 15%  | squashes flat and wide on the spot (`u.squish`) |
| air    | 40% (less for a short hop) | leaps along an arc: `u.hop` lifts the body up the screen (up to 10 + 1.6 x its radius: about 50 for a slime, 36 a slimelet, 74 a big one); the shadow stays on the floor and shrinks by up to half; stretched tall at take-off and touch-down, round at the top |
| land   | 10%  | squashes on landing and springs back; a puff of its goo; a big one shakes the screen a little |
| rest   | 35%  | a beat on the ground (longer when it is slowed) |

Distance: a hop is sized from how fast `movement()` wants it to go that beat, times `HOP.pace` (1.6) over the beat.
A plain slime's full hop covers about 70 units in about 0.4 s (around 170 a second in the air); over a whole beat it
moves about twice as fast as the old pulses did. Wandering slimes take small hops; chilled, poisoned or oiled ones
take shorter hops with a longer beat; a rooted one sits.

The hop is a straight line chosen at take-off (no steering in the air). Walls, rocks and bodies still stop it.
Knockback still moves it. Stunned, frozen or asleep in the air: it falls straight down. Anything that takes the
body over (a slip, a throw, a leap) ends the hop.

## Airborne

While `u.hop` is above a quarter of the hop's peak the slime is `u.airborne`, and `offFloor(u)` (exported from
sim.js) is true. Floor things skip it then:

- `hazards()` in sim.js: fire, gas, water, oil, web, spikes (no burn, poison, wet or slow builds up while it is up)
- `themeTick()` in dungeon.js: mist, cold webs, quicksand, conveyors, roots, bramble, snares, wading water
- danger zones (`dangerTick`): every telegraphed hit on the ground, lobs included
- the Berserker's Shockwave (kits.js) and the Earth Mage's Earthquake and its heave (kits3.js)
- caltrops already skipped anything with `u.hop` (kits2.js), so they need no change

Blows, shots, explosions and auras still hit it.

There was no "flying" rule in the game to reuse (no flyer flag exists), so this is one small new rule: `offFloor` is
only true for a slime mid-hop. A knight's leap or a thrown body is not counted as off the floor; extending it to them
is one line in `offFloor` if wanted.

Steering: a slime no longer walks round pools (it would never get to jump them). Instead, when a hop would land in a
pool or a telegraphed hit, it hops further to clear it if it can (up to 1.5 x a full hop), else stops short of it.

## Contact damage

The slime's blow is its landing. With its attack ready (`u.atkT`) and its target within one hop, it hops at the
target (leading it a little) and goes well up, coming down on it. From 30% into the arc, any foe its body touches
(radius + radius + 4) is hit once that hop with the slime's own blow (`blowOf`, shared with melee swings: damage,
knock, poison, burn, chill...). Several foes under one landing are each hit once. Then:

- the attack clock restarts exactly as a swing's would (`def.atkCd`), so its damage per second stays `dmg / atkCd`
  and attack-speed statuses still slow it
- it stops dead on the target and bounces back off it a little (`HOP.rebound`), so the next blow is a real hop in
- a hop with the attack not ready only bumps

No separate swing any more: `tryAttack` and the confused flail skip slimes.

On-hit statuses: the Poison Slime and slimelet poison (as before). Added: the Fire Slime's touch burns (`burn: 18`,
the designer named it) and the Ice Slime's chills (`chill: 16`, my call, by the same logic). hp and costs untouched.

Splitting, death bursts and on-death pools are unchanged: they hang off death, not movement. The poison slime still
splits into poison slimelets with a cloud; the big slime into two slimes; the sludge leaves oil or fire; the ice slime
shatters. The ice slime's cold patch and the new fire drip come on each landing (`def.onHop`, as before).

## Numbers (tools/slime-fights.mjs, 20 seeds each, the same seeds before and after)

"fight" is how long until one side has won (for the wolf rows: how long the slimes take to kill the wolves). Damage is
the battle summary's, per fight.

| setup | blue wins before / after | fight before / after | first slime down before / after | slimes dealt before / after (a second) |
|---|---|---|---|---|
| wolf vs slime | 0 / 0 of 20 | 13.6 / 17.5 s | never / never | 39 (2.87/s) / 39 (2.23/s) |
| wolf vs poison slime | 0 / 0 | 9.0 / 10.6 s | never / never | 39 (4.34/s) / 39 (3.69/s) |
| 2 wolves vs big slime | 0 / 0 | 17.8 / 18.5 s | never / never | 76 (4.28/s) / 76 (4.11/s) |
| 2 wolves vs 2 fire slimes | 0 / 0 | 7.4 / 7.4 s | never / never | 76 (10.2/s) / 76 (10.2/s) |
| paladin vs 3 slimes | 20 / 20 | 40.6 / 40.0 s | 12.5 / 12.1 s | 92 (2.26/s) / 94 (2.36/s) |
| berserker vs 3 slimes | 20 / 20 | 16.8 / 15.8 s | 6.4 / 6.5 s | 87 (5.21/s) / 103 (6.52/s) |
| archer vs 4 slimelets | 20 / 20 | 31.2 / 29.5 s | 10.6 / 15.2 s | 0 / 48 (1.64/s) |
| paladin + archer vs big + 2 poison | 20 / 20 | 43.7 / 51.2 s | 8.6 / 9.7 s | 244 (5.59/s) / 274 (5.35/s) |

Reading it: against a hero who stands and fights, the slimes' damage a second is the same or a little higher (the
landing always connects; a swing could miss its arc). Against the wolf, which darts in and out, it is about a fifth
lower: the hop at it is aimed where it was going, and it often isn't there, so the wolf lives a few seconds longer
(it still loses every time: slimes have too much health for it, which the enemy-cost lane is retuning). The archer's
slimelets now actually reach the archer (0 damage before, 48 now): the hops cover ground fast enough to catch a
kiter. Slimes are a little harder to kill in some fights (airborne, the paladin's and archer's danger-zone abilities
miss them while they are up, roughly a quarter of the time).

## Checks

- `node --check` on every js file: clean
- `node tools/battles.mjs`: 527 battles, 0 problems, 7 ran out of time (main: 8)
- `node tools/preview-check.mjs`: threw 0, never fired 0, not offered 0

## Clips (docs/clips/slimes16/, 844x390 phone landscape, zoom 1.5, camera on the slime)

- `slime-vs-paladin.mp4` (5 s): hops in, squash, arc, lands on the paladin, bounces back, hops in again
- `big-slime-vs-paladin.mp4` (6 s): heavier, slower, higher hops; its spit still flies
- `poison-slime-vs-paladin.mp4` (5 s): each landing poisons the paladin (the green wash)
- `poison-slime-vs-archer.mp4` (6 s): chases a kiting archer down in long hops, lands on them; dies and splits into
  poison slimelets with its cloud (splitting still works)
- `slime-over-fire.mp4` (5 s): a wall of fire pools between it and the paladin; it hops over and lands clear, never
  tinted by burn (in a headless check, 58 frames over fire while airborne gained 0 burn; frames sat in fire on the
  ground gained it as usual)

## Not sure about

- Danger zones: the designer listed them as floor things, so a slime up in a hop dodges every telegraphed ground hit,
  including lobs that come down from above (they are danger zones too). If some of those should count as from above,
  a zone could carry an `air: true` that skips the check.
- Clouds (gas, mist, smoke) are treated as floor things with the pools. A slime jumping through a gas cloud is not
  poisoned; one sitting in it is.
- Ice Slime touch chill (16) is my addition beside the designer's fire example.
- The airborne rule is only for slimes (see above); leaps and throws could share it.

## Files

js/sim.js (the hop: `HOP`, `offFloor`, `hopTick`, `slimeMove`, `startHop`, `hopContact`, `clearLanding`, `blowOf`;
floor checks in `hazards` and `dangerTick`; swings and flails skip slimes; the old pulse removed), js/render.js
(squash and stretch, the shadow shrinking further, less growth with height for slimes), js/dungeon.js (theme floor
things skip a slime in the air), js/kits.js (Shockwave), js/kits3.js (Earthquake), js/foes.js (Fire Slime hops, burns,
drips on landing), js/foes10.js (Ice Slime touch chills), js/bestiary.js (three habit lines), tools/slime-fights.mjs
(the measuring).
