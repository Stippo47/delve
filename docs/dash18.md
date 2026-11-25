# Dashes (round 18, lane dash18)

The designer: "I don't like how dash slash abilities work currently in general. Everyone from the wolf to hero's
abilities. Make a few completely new variations of it."

This file is the survey of every dash, lunge, charge and pounce as it was, the six new variations
(`js/dashes.js`, looks in `js/fx-dash.js`), which move is now which, and the numbers before and after.
Clips: `docs/clips/dash18/` (not in git; `node tools/dash18/clips.mjs` records them again).

## 1. What there was

Past rulings found in `docs/DECISIONS.md` (searched: dash, lunge, charge, pounce, iaido, shadow walk, swoop, leap,
blink, dive, rush): rats get a dash "in the direction they're moving/facing"; brains know combos (Charge
towards hazards); the Gaper's piercing charge ends in a spin; the Rogue gets a dash "to get out of range,
or to engage on top of the backstab"; the hunter spider's pounce bleeds; Sleepy slows wind-ups and
anything charged; Charge is 2x the Tower's own blow; Twinfang is untouchable mid-dash; Roll
and Dash are checked every step while ready through `js/threat.js`; heroes' leaps are airborne, not hovering.
`docs/HEROES-r13.md` holds the designer's notes each newer hero's move was built from ("Should not
return. Level 3 should have them do 3 dashes in a row", "Will dash towards target and deal a heavy slash", "Dashes
forwards Does a burst of like 6 swings", and so on). Every move keeps its role, cooldown and
tiers; what changed is how the body gets there and how the hit is decided and shown, and where a blow's weight was
moved to hold what the move deals it is listed in section 3. One ruling is bent: the rat's dash is now a little pounce
at its target, not a burst the way it was already running (say if the rats should have the plain burst back).

Everything was built from five pieces. What was weak about each:

| piece | how it worked | what was weak |
|---|---|---|
| `dash` act (sim.js) | the body moves at 2.1x its walk along one angle for 0.2-0.6 s; grey dust dots behind; no hit of its own | a straight line at one speed; no wind-up, no stop; the hit (if any) was a separate timer that landed whether or not anything was touched |
| `charge` / `chargeTell` act (sim.js) | (enemies: 0.45 s stood still with a lane on the floor) then 1.9x walk along one angle for 0.55 s; whoever comes within a hand of the body is hurt once and thrown aside | one speed; everyone met gets the same sideways bump; the body only leans 15% |
| `rush()` (elites.js) | the same again for enemies with brains: a lane on the floor, then a straight run at 2.6x walk; everyone met hurt once and thrown aside | fourteen different enemies, one move: the wolf, the crab, the bee, the lizard and the brute all did exactly this |
| `leap` act (sim.js) | the body slides from A to B in a set time on a sine arc; `land()` does the rest | linear travel, no crouch, no hang, no landing; used for "dashes" too (Crescent Cut, Challenge, Sacrifice), where it read as a hop |
| `pounce()` (elites.js) | a `leap` with a danger circle at the landing that strikes when its time is up | the hit is the circle's, not the body's: it lands on whoever is in the circle whether the beast got there or not |
| teleports (Backstab, Iaido, `blink()`) | the body is at B the same instant; a puff at each end; the hit is applied at once or after a set delay | nothing travels, so nothing can be read, dodged or guarded against; the hit has no contact at all |

### Heroes

| move | how it worked | weak |
|---|---|---|
| Paladin, Shield Bash | his body is shoved 260 forward and the blow (1.4x, shove 280, stagger; II stun; III everything in front) lands the same instant on the target, wherever he is | no contact: the blow lands before the shield arrives |
| Tower, Charge | the `charge` act, 0.55 s (0.7 at II); 2x his blow to everyone met, thrown aside at 0.6 rad; III staggers | one speed, no wind-up; II's "slams enemies into walls harder" was only a harder shove |
| Twinfang, Backstab | a smoke cloud, she is behind the target, 4x crit (II poison), untouchable 0.5 s | a teleport: nothing travels, the blow has no contact |
| Twinfang, Dash | the `dash` act 0.2 s: out when a blow is coming (threat.js), or in at a busy enemy; untouchable; II smoke; III two | a straight burst; her shadow copies (render.js) were its only read; no cut |
| Shade, Shadow Walk | the `dash` act 0.32 s as a shadow; whoever comes within 12 of her body is cut 1.5x (II curse); III three runs | a straight line again; the cut is a small spark on the foe, nothing shows the daggers |
| Samurai, Iaido | 0.35 s channel with a glint, then he is at the far end of the line; everything within 16 of the line is staggered, and 0.3 s later takes a tenth of its health; III back again | the best read of the lot (the delay), but a teleport: the line is drawn after the fact and the body never moves |
| Samurai, Crescent Cut | a `leap` straight at the target (0.06-0.3 s), a wide slash on landing: a tenth of its health and more; III again on a kill | a hop in a straight line with a streak behind it |
| Huntress, Spear Lunge | she runs the line at one speed for 0.28 s; whoever comes within 26 is struck 1.6x; III twice | no wind-up, no stop; the hits pop as she passes with nothing to tie them to the spear |
| Marksman, Bayonet | a 160 shove of his own body, and 0.08 s later the nearest one takes 1.2x and a 520 shove | no contact; the thrust line is drawn from wherever he is |
| Gladiator, Shield Rush | the `dash` act 0.62 s behind the shield; the first one in front is carried and slammed at the end 2x | the right idea (it carries), at one speed with no wind-up and no throw: the slam lands in place |
| Warhelm, Thunder Blow | a 0.12 s `dash`, and 0.13 s later the target takes 1.7x and a 560 shove if within 40 | no contact; the headbutt mark is drawn at his own front |
| Bearskin, Bear Claws | a `dash` to the target's front, then six (III twelve) swipes | the dash is a straight slide |
| Werewolf, Pounce | wolf: a `leap` onto it, 1.6x and a pin; man: a straight slide and a wide cleave at the end | plain arc; straight slide |
| Valkyrie, Spear of the Sky | a `leap` to a friend; everything within 22 of the line takes 1.5x when she lands | the hits land all at once at the end, wherever the spear was |
| Cultist, Sacrifice | a `leap` straight at one near death; the dagger finishes it as he lands | a hop in a straight line |

Left as they were (flights, rescues and slams, not dash cuts): Wildmane's Leap, Warhelm's Skull Splitter, the Griffon's
Swoop, the Valkyrie's Sky Dive and Call, the Dame's Challenge, Grandpa's Harvest, the Digger's Burrow, the Archer's
Roll, the Ninja's Substitution (a blink away when struck: no cut), the Monk's Flurry (he stands and punches), the
Alchemist's Monstrosity lunge (`dashCd`), the Warlock's demon blink, the Plague Doctor's Gas Form. The Pirate has no
dash (Point Blank is a shot).

### Enemies

| move | who | how it worked |
|---|---|---|
| `ability: 'dash'` | rat, goblin, lizard blade, bone spear, cave bat, hunter spider, devil, succubus, angel, knife bandit | a 0.22 s burst of speed the way it was already walking, when 35-170 from its target; no hit, no tell |
| `ability: 'charge'` | orc, dragonborn (and the old knight) | the `charge` act after a 0.45 s lane |
| `rush()` | wolf (lunge), sproutling, spear bandit, wolf rider, crab, bee and wasp, jackal, lizard blade (elite), brute (elite bash), every major's Charge, the dark Herald, the Archon; crawler and sand serpent heads | a lane, then the straight run |
| `pounce()` / `pinPounce()` | hunter, frost and fire spiders (elite), slimelet (elite), dire wolf, the Alpha | the arc and the circle |
| own code | Gaper (charge, then a spin), boar (charge, dazed by walls), orange goblin (darts out after each blow) | straight runs with their own endings |
| bosses | Chieftain and Cinder Drake (`boss-kit.js charge`), Sand Wurm, Winter Queen's blink | each with its own tell, crash and daze |

What was weak across all of it: every one is the same straight line at one speed; most have no wind-up (heroes) or
only a stood-still one (enemies); none has a follow-through; the body does nothing but slide; and in most the hit is
decided by a timer or a distance from a line, not by anything touching anything.

## 2. The six variations

One module, `js/dashes.js`. Any unit starts one with `dash(w, u, style, options)` (or `drawCut(w, u, o)` and so on);
it becomes the unit's act (`u.act = { type: 'dash', dv }`), so everything that stops or shortens a dash still does
(Food Fight, Ball and Chain, Targeted, the Water Dome). All six share:

- **a tell**: the body settles (lean, squash, a tremble), dust is drawn in at its feet, light gathers on the weapon;
  anything that is not a hero also shows where it is going on the floor (the sim's danger zones: the party steps out),
  and `js/threat.js` sees it coming (`dashThreat`), so Roll, Dash, Brace, Guard and the rescues go off in time.
  Sleepy slows the tell like every wind-up.
- **a posed body**: lean, squash and stretch along its facing, a bank into a turn, a hop (`render.js unitFrame` reads
  `D.body`), and the weapon arm posed by the dash itself (`parts.js poseFor` reads `D.arm`).
- **a tracked blade**: the weapon is a segment from the body out along that arm. Every 8 units of travel the body and
  the blade are tested against every foe: a hit is what really got touched. The slash drawn (`dashRibbon`) is the band
  the blade's point really swept.
- **a follow-through**: the end of the stroke held, then eased back; trails of fading copies of the body behind it.

| | what it looks like | numbers |
|---|---|---|
| **draw cut** | settles with the blade at the hip (a spear: drawn back), bursts down the line with the blade swept out in one long band, stops past them. Each one crossed carries a thin white line; a beat later the cut opens on each in turn. With a spear the wounds burst down the line. | tell 0.3 (hero) / 0.5, burst 0.11, hold 0.26, recover 0.24 |
| **blink chain** | sinks, then blinks from foe to foe, each blink crossing its mark at a slant with the blade swept down that side; a copy of the body is left standing at every stop; ends facing the last one. | tell 0.16 / 0.5, each blink 0.075 + a 0.1 beat, three marks |
| **hook** | leans, runs round the target's side on a curve, banked into the turn, a line of dust on the floor behind; arrives behind it and the cut is swung across its back as the body comes round. A blow from behind is a crit. | tell 0.14 / 0.45, run 0.24-0.42 by distance, cut 0.13 |
| **feint** | a hop to one side; a copy of the body carries on that way and fades; a planted foot (squash, dust), and the real dash back across the target's other flank with the weapon out. | (tell 0.26 for enemies) step 0.14, plant 0.07, dash 0.13-0.22 |
| **drag and fling** | rocks back and scrapes; runs, slow off the mark then flat out, two scuffed lines behind; the first one met is picked up on its front and carried, the rest shouldered aside; at the end it plants its feet and the one carried is flung on down the line (into a wall: a slam, staggered). Too big to carry: rammed for the whole blow. | tell 0.2 / 0.45; of the blow: 0.5 on pick-up, 0.6 on the throw, 1 to those knocked aside |
| **pounce** | crouches flat with a wriggle; a leap that is quick off the floor, slow at the top, quick down; lands flat with three claw lines raked back through whatever is under it, a ring of dust; slides on a little. | tell 0.18 / 0.42, air 0.34-0.52, landing 0.16 |

The times above are the module's own; each caller sets what suits it (a wolf crouches 0.28 s and is 0.32 s in the air;
Backstab's run is 0.2-0.32 s).

## 3. Who uses which

| variation | heroes | enemies |
|---|---|---|
| draw cut | Samurai's Iaido; with a spear: Huntress's Spear Lunge, Valkyrie's Spear of the Sky, Marksman's Bayonet (short, the wound landing at once) | lizard blade (elite: through the party); with a spear: bone spear, devil, angel, spear bandit, wolf rider |
| blink chain | Shade's Shadow Walk (III: three chains) | none yet |
| hook | Twinfang's Backstab, Werewolf's Pounce as a man, Cultist's Sacrifice | cave bat, succubus, bee and wasp |
| feint | Twinfang's Dash (out: no cut; in: a nick, half a stab), Samurai's Crescent Cut | goblin, lizard blade, knife bandit, crab |
| drag and fling | Tower's Charge, Gladiator's Shield Rush, Warhelm's Thunder Blow (a step and a throw), Paladin's Shield Bash (a step and a throw) | orc, dragonborn, brute (elite bash), every major's Charge, the dark Herald, the Archon |
| pounce | Werewolf's Pounce as a wolf, Bearskin's Bear Claws (the first rake is the landing) | wolf, frost wolf, hellhound, dire wolf and the Alpha (pinning), rat, hunter spider, the elite spiders and slimelet, jackal, sproutling |

Left on the old straight run on purpose: the crawler's and the sand serpent's heads (`style: 'plain'`: their bodies
follow the head's path, and another lane is working on segmented bodies), the boar (its own code: dazed by walls),
the Gaper (its own code: the charge ends in its spin), the orange goblin's dart out after each blow, and the bosses'
charges (each has its own tell, crash and daze written into its boss file and doc).

What changed for the small enemies' `ability: 'dash'`: it was a burst of speed with no hit. It is now one of the six
with a short tell (def.dash names which). The cut at the end is a third of the unit's own blow and carries its shove
and nothing else (def.dashMul; a pounce is a bite: quick, twice its blow, with whatever its bite carries), and its next
swing then waits 0.7 of its attack time (0.1 after a pounce). A kind can set its own tell, rest and weight
(def.dashTell, dashRest, dashMul: the orange goblin's and the bat's are quick).

Who the hit finds:
- An enemy's line, hook or feint keeps to the path it showed on the floor. An enemy's pounce keeps its eyes on its
  mark while it crouches (the circle follows), picks its spot as it leaves the floor, and from then the circle stays:
  the time in the air is the time to step out.
- A hero's hook and pounce follow their mark if it steps (the old ones landed whatever it did); a hero's feint aims
  its real dash from the planted foot. If Backstab's mark falls on the way, the cut is for whoever is there.
- Nothing lands on a hero mid-burst where the old move was untouchable (Iaido, Spear Lunge, Backstab, Dash, Shadow
  Walk, the wolf's Pounce, Spear of the Sky). Enemies can be struck throughout.

Numbers moved to hold each move's weight (section 4):
- Shadow Walk's cut is 0.9x her blow (1.0x at III; it was 1.5x): the old run caught one or two on its line, the chain finds three.
- Iaido's cut is 0.78 of what it was (the blade's sweep is wider than the old line). Iaido III's cut back lands at 0.3
  of that: the sweep catches the ones the first cut threw off the line. Measured, the old cut back added nothing (the
  line missed them all), so III is now worth about a quarter more than I and II, where it was worth the same.
- Backstab is 4.3x (it was 4x): the run round takes a third of a second, in which the mark can fall to someone else.
- Charge: of his blow, the one picked up takes 0.45 as it is hit and 0.5 as it is thrown; the rest take it all.
- Spear of the Sky is 1.0x (it was 1.5x): the point now strikes what it passes, which the old line seldom did.
- Twinfang's Dash in nicks for half a stab (it dealt nothing; the other dashes that cut all did).

## 4. Before and after

Checks on the merged tree: `node --check` on every js file; `node tools/battles.mjs`: 528 battles, 0 problems;
`node tools/preview-check.mjs`: threw 0, never fired 0, not offered 0 (tools/dash18/preview.log);
`node tools/dash18/smoke.mjs` (each of the six run to its end by a hero and by an enemy);
`node tools/dash18/threat-check.mjs` (threat.js sees each of the six before it lands).

### Heroes (tools/ability-worth.mjs, 12 parties a hero, tiers I and III, the same parties and seeds before and after)

Both sides measured on this lane's tree before the merge with main, so nothing else differs. "ability dmg/s" is what
the move itself dealt per second of the run; "share of dmg" its part of everything the hero
dealt. One run of a party differs from the next for good once anything changes, so a single row is good to about
plus or minus 10% (three measures of Iaido I on nearly the same code came out +3%, +11% and +19%). Read the share
column first.

```
hero       ability        tier  ability dmg/s      share of dmg    hero dmg/s          rooms         party taken/s
tower      charge         I      0.69 ->  0.67   -3%    22% ->  25%     3.09 ->   2.72  -12%   12.42 -> 12.50   3.73 -> 3.26
tower      charge         III    1.41 ->  1.27   -9%    31% ->  30%     4.57 ->   4.23   -8%    6.92 ->  6.50   4.31 -> 4.23
paladin    shieldBash     I      0.74 ->  0.71   -4%    23% ->  22%     3.26 ->   3.24   -1%    9.00 ->  9.58   2.66 -> 2.68
paladin    shieldBash     III    1.07 ->  1.00   -6%    25% ->  25%     4.20 ->   3.94   -6%    7.42 ->  7.58   5.19 -> 5.04
twinfang   backstab       I      1.48 ->  1.44   -3%    28% ->  25%     5.33 ->   5.75   +8%    9.83 -> 10.25   2.83 -> 3.16
twinfang   dash           I      0.00 ->  0.24   n/a     0% ->   4%     5.33 ->   5.75   +8%    9.83 -> 10.25   2.83 -> 3.16
twinfang   backstab       III    3.57 ->  3.26   -9%    34% ->  34%    10.55 ->   9.51  -10%    5.42 ->  6.08   4.41 -> 4.15
twinfang   dash           III    0.00 ->  0.27   n/a     0% ->   3%    10.55 ->   9.51  -10%    5.42 ->  6.08   4.41 -> 4.15
shade      shadowWalk     I      0.47 ->  0.54  +17%     6% ->   7%     7.38 ->   7.48   +1%   12.17 -> 11.50   2.67 -> 2.69
shade      shadowWalk     III    1.56 ->  1.88  +21%    13% ->  14%    11.73 ->  13.03  +11%    7.00 ->  7.00   3.38 -> 3.39
samurai    iaido          I      1.26 ->  1.49  +19%    16% ->  21%     7.68 ->   7.21   -6%    9.17 -> 10.08   2.89 -> 3.21
samurai    crescentCut    I      1.54 ->  1.50   -2%    20% ->  21%     7.68 ->   7.21   -6%    9.17 -> 10.08   2.89 -> 3.21
samurai    iaido          III    3.24 ->  4.40  +36%    22% ->  32%    14.95 ->  13.88   -7%    8.08 ->  7.75   4.92 -> 4.41
samurai    crescentCut    III    3.59 ->  3.62   +1%    24% ->  26%    14.95 ->  13.88   -7%    8.08 ->  7.75   4.92 -> 4.41
huntress   runningThrow   I      1.48 ->  1.45   -2%    14% ->  14%    10.77 ->  10.12   -6%   12.00 -> 11.67   2.51 -> 2.61
huntress   runningThrow   III    2.61 ->  2.53   -3%    18% ->  19%    14.24 ->  13.00   -9%    8.08 ->  7.25   4.31 -> 3.82
marksman   bayonet        I      0.32 ->  0.36  +14%     4% ->   4%     7.88 ->   8.56   +9%   11.00 -> 12.08   1.63 -> 1.83
marksman   bayonet        III    0.80 ->  0.61  -24%     6% ->   5%    13.15 ->  11.66  -11%    6.50 ->  8.42   3.37 -> 2.88
gladiator  shieldRush     I      1.36 ->  1.31   -3%    21% ->  20%     6.52 ->   6.70   +3%    8.83 ->  8.33   2.78 -> 2.90
gladiator  shieldRush     III    1.78 ->  1.72   -3%    19% ->  19%     9.55 ->   8.93   -7%    7.33 ->  6.67   3.65 -> 3.92
warhelm    thunderBlow    I      1.09 ->  1.06   -3%    13% ->  14%     8.28 ->   7.71   -7%   10.00 -> 10.08   2.74 -> 2.80
warhelm    thunderBlow    III    1.60 ->  1.41  -12%    12% ->  12%    13.13 ->  12.14   -8%    7.25 ->  7.00   3.66 -> 4.02
bearskin   bearRoar       I      1.12 ->  1.09   -3%    17% ->  17%     6.57 ->   6.43   -2%    9.83 -> 12.17   3.82 -> 4.05
bearskin   bearRoar       III    3.02 ->  2.57  -15%    28% ->  27%    10.82 ->   9.56  -12%    7.50 ->  8.92   6.07 -> 5.51
werewolf   pounce         I      0.98 ->  0.98   -0%    16% ->  17%     6.00 ->   5.73   -5%   10.67 -> 10.75   4.62 -> 5.07
werewolf   pounce         III    1.50 ->  1.63   +9%    15% ->  16%     9.79 ->  10.32   +5%    7.75 ->  7.58   7.51 -> 7.74
valkyrie   spearThrow     I      0.02 ->  0.08 +451%     0% ->   2%     3.53 ->   3.41   -3%   10.75 -> 12.58   3.61 -> 3.24
valkyrie   spearThrow     III    0.02 ->  0.10 +359%     1% ->   2%     4.07 ->   4.03   -1%    7.17 ->  8.17   4.02 -> 3.85
cultist    soulCandle     I      0.80 ->  0.73   -9%    14% ->  13%     5.90 ->   5.52   -7%   12.00 -> 11.50   2.93 -> 2.65
cultist    soulCandle     III    2.92 ->  2.77   -5%    26% ->  27%    11.25 ->  10.29   -9%    8.75 ->  7.33   4.71 -> 4.93
```

Changed after this table was measured, each a small step towards the old number: Shadow Walk's cut 1.0x to 0.9x (III
1.15x to 1.0x); Iaido's cut 0.85 to 0.78 of the old.

Outside a tenth on purpose, or not settled:
- **Iaido III** is worth about a quarter more than it was. The old cut back hit nothing (the first cut had thrown them
  off its line), so the old III dealt what II dealt; the new cut back lands, at 0.3 of the first cut's weight.
- **Spear of the Sky** deals four times what it did, which is still 2% of what the Valkyrie deals: the old line seldom
  struck anything, the spear's point now strikes what it passes (at 1.0x, down from 1.5x).
- **Twinfang's Dash** deals a little where it dealt nothing (4% of her damage): a nick as she passes.
- **Bayonet** (4-6% of the Marksman's damage) and the tier III rows of Bear Claws, Thunder Blow and Sacrifice moved more
  than a tenth in this table with their shares unchanged: the runs differ, the moves are the same weight.

### Enemies (tools/audit/foes16/worth.mjs, worth per cost point against the Bandit, 24 seeds a kind)

Before is the tree this lane started from. After is each kind's last measure: the wolves, the jackal, the bats, the
devil, the angel, the plague rat and the sproutling on the tree merged with main, the rest just before that merge.

```
wolf          1.14 -> 1.21    +6%   (panel 1.27 -> 1.46, duel 1.02 -> 1)
direWolf      0.93 -> 0.99    +6%   (panel 0.95 -> 1.06, duel 0.92 -> 0.93)
frostWolf     1.07 -> 1.10    +3%   (panel 1.25 -> 1.37, duel 0.91 -> 0.89)
hellhound     0.99 -> 0.99    +0%   (panel 1 -> 1.03, duel 0.98 -> 0.95)
jackal        1.06 -> 1.16    +9%   (panel 1.2 -> 1.52, duel 0.94 -> 0.89)
rat           1.24 -> 1.20    -3%   (panel 1.56 -> 1.4, duel 0.98 -> 1.03)
ratPlague     1.17 -> 1.05   -10%   (panel 1.48 -> 1.18, duel 0.92 -> 0.94)
spiderHunter  0.98 -> 1.01    +3%   (panel 0.96 -> 1.02, duel 1 -> 1.01)
sproutling    0.96 -> 1.04    +8%   (panel 0.95 -> 1.11, duel 0.97 -> 0.98)
goblin        0.97 -> 1.01    +4%   (panel 1.07 -> 1.18, duel 0.88 -> 0.87)
goblinOrange  0.95 -> 0.94    -1%   (panel 0.86 -> 0.9, duel 1.05 -> 0.98)
banditDagger  0.88 -> 0.88    +0%   (panel 0.94 -> 0.91, duel 0.82 -> 0.86)
lizardBlade   1.08 -> 1.13    +5%   (panel 1.29 -> 1.38, duel 0.9 -> 0.93)
crab          0.99 -> 0.99    +0%   (panel 0.9 -> 0.9, duel 1.1 -> 1.1)
banditSpear   0.88 -> 0.95    +8%   (panel 0.79 -> 0.94, duel 0.97 -> 0.97)
rattlerSpear  0.87 -> 0.96   +10%   (panel 0.8 -> 0.94, duel 0.95 -> 0.99)
wolfRider     0.92 -> 1.00    +9%   (panel 1.01 -> 1.21, duel 0.83 -> 0.83)
devil         0.87 -> 0.92    +6%   (panel 0.93 -> 1, duel 0.81 -> 0.85)
angel         1.02 -> 1.08    +6%   (panel 1.07 -> 1.13, duel 0.97 -> 1.03)
bat           1.11 -> 1.14    +3%   (panel 1.2 -> 1.22, duel 1.03 -> 1.06)
cinderBat     0.96 -> 0.95    -1%   (panel 1.21 -> 1.18, duel 0.76 -> 0.76)
succubus      1.10 -> 1.17    +6%   (panel 1.6 -> 1.85, duel 0.76 -> 0.74)
bee           0.93 -> 0.98    +5%   (panel 0.88 -> 1.07, duel 0.98 -> 0.9)
wasp          1.06 -> 1.04    -2%   (panel 1.08 -> 1.04, duel 1.04 -> 1.04)
orc           0.92 -> 0.92    +0%   (panel 0.91 -> 0.91, duel 0.93 -> 0.93)
dragonborn    0.81 -> 0.77    -5%   (panel 0.57 -> 0.53, duel 1.15 -> 1.11)
```

Not measured (the tool fields kinds at rank 0, without their elite or major moves): the elite lizard blade's cut
through the party, the elite brute's bash, the elite spiders' and slimelet's pounces, the crab's snap, every major's
Charge, the dark Herald's and the Archon's charges. They carry the numbers they had; the majors', the Herald's and the
Archon's charges now pick up the first hero they meet (if it is light enough) and throw it, which is harder on that
one hero than the old bump. The Chieftain's and the Cinder Drake's charges are untouched.
