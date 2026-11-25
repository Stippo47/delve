# Dashes (round 18, lane dash18)

The designer: "I don't like how dash slash abilities work currently in general. Everyone from the wolf to hero's
abilities. Make a few completely new variations of it."

This file is the survey of every dash, lunge, charge and pounce as it was, the six new variations
(`js/dashes.js`, looks in `js/fx-dash.js`), which move is now which, and the numbers before and after.
Clips: `docs/clips/dash18/` (not in git; `node tools/dash18/clips.mjs` records them again).

## 1. What there was

Past rulings found in `docs/DECISIONS.md` (searched: dash, lunge, charge, pounce, iaido, shadow walk, swoop, leap,
blink, dive, rush): rats get a dash "in the direction they're moving/facing" (line 22); brains know combos (Charge
towards hazards) (69); the Gaper's piercing charge ends in a spin (178); the Rogue gets a dash "to get out of range,
or to engage on top of the backstab" (191); the hunter spider's pounce bleeds (455); Sleepy slows wind-ups and
anything charged (486, 612); Charge is 2x the Tower's own blow (522); Twinfang is untouchable mid-dash (528); Roll
and Dash are checked every step while ready through `js/threat.js` (1013); heroes' leaps are airborne, not hovering
(1037, 1047). `docs/HEROES-r13.md` holds the designer's notes each newer hero's move was built from ("Should not
return. Level 3 should have them do 3 dashes in a row", "Will dash towards target and deal a heavy slash", "Dashes
forwards Does a burst of like 6 swings", and so on). None of those is changed here: every move keeps its role,
cooldown, tiers and blow; what changed is how the body gets there and how the hit is decided and shown.

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

## 3. Who uses which

| variation | heroes | enemies |
|---|---|---|
| draw cut | Samurai's Iaido; with a spear: Huntress's Spear Lunge, Valkyrie's Spear of the Sky, Marksman's Bayonet (short, the wound landing at once) | lizard blade (elite: through the party); with a spear: bone spear, devil, angel, spear bandit, wolf rider |
| blink chain | Shade's Shadow Walk (III: three chains) | none yet |
| hook | Twinfang's Backstab, Werewolf's Pounce as a man, Cultist's Sacrifice | cave bat, succubus, bee and wasp |
| feint | Twinfang's Dash (out: no cut; in: one stab), Samurai's Crescent Cut | goblin, lizard blade, knife bandit, crab |
| drag and fling | Tower's Charge, Gladiator's Shield Rush, Warhelm's Thunder Blow (a step and a throw), Paladin's Shield Bash (a step and a throw) | orc, dragonborn, brute (elite bash), every major's Charge, the dark Herald, the Archon |
| pounce | Werewolf's Pounce as a wolf, Bearskin's Bear Claws (the first rake is the landing) | wolf, dire wolf and the Alpha (pinning), rat, hunter spider, the elite spiders and slimelet, jackal, sproutling |

Left on the old straight run on purpose: the crawler's and the sand serpent's heads (`style: 'plain'`: their bodies
follow the head's path, and another lane is working on segmented bodies), the boar (its own code: dazed by walls),
the Gaper (its own code: the charge ends in its spin), the orange goblin's dart out after each blow, and the bosses'
charges (each has its own tell, crash and daze written into its boss file and doc).

What changed for the small enemies' `ability: 'dash'`: it was a burst of speed with no hit. It is now one of the six
with a short tell (def.dash names which). The cut at the end is half the unit's own blow (def.dashMul; a pounce: the
whole blow, and quick), and its next swing then waits 0.7 of its attack time (0.3 after a pounce).

Who the hit finds:
- An enemy's line, hook or feint keeps to the path it showed on the floor. An enemy's pounce keeps its eyes on its
  mark while it crouches (the circle follows), picks its spot as it leaves the floor, and from then the circle stays:
  the time in the air is the time to step out.
- A hero's hook and pounce follow their mark if it steps (the old ones landed whatever it did); a hero's feint aims
  its real dash from the planted foot. If Backstab's mark falls on the way, the cut is for whoever is there.
- Nothing lands on a hero mid-burst where the old move was untouchable (Iaido, Spear Lunge, Backstab, Dash, Shadow
  Walk, the wolf's Pounce, Spear of the Sky). Enemies can be struck throughout.

Numbers moved to hold each move's weight (section 4):
- Shadow Walk's cut is 1.0x her blow (1.15x at III; it was 1.5x): the old run caught one or two on its line, the chain finds three.
- Iaido's cut is 0.85 of what it was (the blade's sweep is wider than the old line). Iaido III's cut back lands at 0.3
  of that: the sweep catches the ones the first cut threw off the line. Measured, the old cut back added nothing (the
  line missed them all), so III is now worth about a quarter more than I and II, where it was worth the same.
- Backstab is 4.3x (it was 4x): the run round takes a third of a second, in which the mark can fall to someone else.
- Charge: of his blow, the one picked up takes 0.45 as it is hit and 0.5 as it is thrown; the rest take it all.
- Spear of the Sky is 1.0x (it was 1.5x): the point now strikes what it passes, which the old line seldom did.
- Twinfang's Dash in nicks for half a stab (it dealt nothing; the other dashes that cut all did).
