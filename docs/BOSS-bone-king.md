# Boss: the Bone King (the Crypt, floor 3)

The first real boss. One fight, built to be watched: you don't play it, you see your heroes read it. So every
attack has to be readable from across the room, every attack has to be dodgeable by a hero who moves at once,
and the fight has to change as it goes so a two-minute fight has a beginning, a middle, a climax and an end.
Round 8 (the designer: "make the skeleton boss stronger and better"): a fourth phase, the Last Court, from ROSTER.md
("raises his whole court at once, and his lance leaves a wall of bone behind it"), and harder numbers.

Code: `js/boss.js` (`BOSSES.boneKing`, its `brain`), art: `art/bosses/bone-king.svg`, arena: `bossArena()` in
`js/dungeon.js`, telegraphs: the danger-zone hook in `js/sim.js` (`addDanger`), drawn by `drawDanger` in `js/render.js`.

## Who he is
A skeleton king in a crypt that's been his for a long time. Big (about 1.6x a hero across), a heavy skull under a
tall tarnished-gold crown with three soul-blue gems, a ragged purple royal cape behind him, dark iron pauldrons, a
long greatsword in his right claw running forward past his body, and a soul lantern hanging from his left. In
phase 3 the crown burns with cold blue soul-fire that lights the floor round him. He reads at a glance from any
angle: crown + cape + sword + lantern.

## The arena: the Throne Crypt
- A wide hall, two chunks by two (about 1300 along by 960 across). The party comes in at the near end.
- His **throne** on a dais at the far end, centred. He sits on it, still, until a hero comes within reach of the
  dais, then stands (the fight starts with him rising, not running at you).
- **Two rows of pillars** down the sides make an aisle (4 pillars). They block his Grave Lance: a lance
  telegraph stops at the first pillar, so a hero behind one is safe, and you can see it on the ground.
- **Four open graves** near the corners of the hall floor. In phase 2 his court climbs out of them.
- Floor: the crypt's flagstones, darker and colder than other rooms, candles round the dais.

## Rhythm
Every attack is: **tell** (his body moves: sword pulled back, crown lifts; and a shape on the ground fills up
from nothing to full) -> **hit** (the shape flashes, shake, sparks, heroes thrown) -> **recovery** (he stands still
a moment: the party's window to hit back). He never starts a new tell during a recovery. Between attacks he walks
at the hero he wants, turning slowly, so you can see the next attack coming from where he faces.

The heroes see every ground shape after their reaction time (0.12-0.32 s, a little different per hero) and run
for the nearest safe ground, which is why the shapes must be fair: a hero who reacts at once can always get out
of the big ones. The cleave is the exception: if you stand in his face you get hit (that's the knight's job).

## Phase 1: the Duel (100% to 66%)
He fights alone with the sword.
| attack | tell | shape | hit | recovery |
|---|---|---|---|---|
| **Cleave** | 1.0 s, sword drawn back to one side | a cone in front, 175 long, 120 degrees | heavy, knocks back hard | 0.9 s |
| **Grave Lance** | 1.3 s, sword levelled, he crouches | a straight line 70 wide from him to 460 away (stops at a pillar or wall) | he lunges down the line, hitting everyone on it, throwing them aside | 1.5 s: **the sword sticks in the floor** and he has to pull it out. Hits on him do 35% more. |
Choice: Cleave when a hero is close in front of him; Grave Lance when the hero he wants is far (an archer at the
back) or after two cleaves. About one attack every 3 s.

## Phase 2: the Court (66% to 40%)
**Turn (at 66%):** he stops, slams the sword down and leaps back to the throne (a landing circle on the dais fills
1.1 s: get off the dais). He can't be hurt for the 2.5 s it takes. The four graves crack (a circle fills on each,
0.9 s) and one of his court climbs out of each grave: bone swordsmen, archers and spearmen.
New attack:
| **Bone Rows** | 1.0 s, he stabs the sword into the floor | three rows of bone spikes fan out from him at the heroes: each row is a string of circles that fill one after another, so you see the wave run outward | each spike that erupts on you hits and staggers | 0.9 s |
He still Cleaves and Lances. Whenever fewer than two of his court are standing, a grave cracks again (every ~14 s,
two at a time), so the knight is pulled between the king and the court.

## Phase 3: Unbound (40% to 16%)
**Turn (at 40%):** he throws his head back and the crown bursts into cold blue fire (a ring around him fills
0.9 s, then knocks everyone near away). The room goes dark and cold: only the light around the party and his blue
crown. Steel attacks are faster (tells 80%, recoveries 70%); the soul attacks keep their full tell.
New attacks, which he alternates:
| **Soul Nova** | 2.0 s, both arms raised | a circle round him, 160 | cold soul-fire: heavy damage and chill | 0.8 s |
| **Soul Ring** | 1.7 s | the opposite: a ring from 170 out to 380: safe **close to him** (or far off) | the same | 0.8 s |
| **Twin Cleave** | two cleaves back to back, left side then right side, 0.55 s apart | | | 0.7 s |
Nova and Ring look alike (both blue), so the fun is watching the heroes read which one it is: run out, or run in.
A ghost slides out of a grave every ~10 s.

## Phase 4: the Last Court (16% to 0)
**Turn (at 16%):** he drives the sword into the floor and calls his whole court at once. A wide circle of soul fire
round him fills for 1.4 s (230 across: get out, or be thrown and **cursed**); then **every grave** bursts at the same
moment and one of his court climbs out of each, some of them ghosts (who curse). He can't be hurt for the 2.4 s.
The hall is suddenly full: this is the climax.
Everything is faster (tells 75%, recoveries 62%) and:
| change | what you see |
|---|---|
| **Bone Wall** | each Grave Lance leaves a wall of bone along its line for 6 s: bone heaps bursting out of the floor where the line was. It blocks walking and shots, so the hall is carved into lanes; anyone standing on the line when it rises is shoved off to the side they were on, cursed a little. It crumbles back into dust after 6 s (and at once when he dies). |
| **Twin Lances** | a lance is followed straight away by a second one at someone else (no stuck sword between them; the sword sticks after the second). Two walls, two lanes. |
| **Cursed fire** | Soul Nova and Soul Ring now **curse** instead of chilling: heals stop taking, blows land harder, and at full the hero is hexed (its next attack hurts itself). See docs/STATUSES.md. |
The court keeps coming as in phase 3 (ghosts every ~10 s, graves when fewer than two stand).
Why: phase 3 asked the heroes to read two blue shapes; phase 4 takes away the room to run in (walls) and the healer's
answer (curse), while the hall fills. It's short (16% of his health) so it ends before it drags.

## Death
He freezes, the crown's fire goes out, and he falls apart into a heap of bones with the crown rolling free. Any
of his court still standing crumble with him, and so do his bone walls. A shower of coins.

## Why it's fun to watch
- Shapes on the ground are the language: red = steel (cleave, lance, bone rows), blue = soul (phase 3). The
  heroes scattering out of them, and the rogue diving in during a stuck-sword window, is the show.
- Each phase changes the room: the duel, then the hall filling with skeletons, then the dark and the blue fire.
- The phase turns are moments: he leaps to his throne, the graves crack, the crown ignites.
- Nova vs Ring makes the heroes go in opposite directions on two attacks that look almost the same.
- The pillars matter: a lance stops at one and you see the safe shadow behind it.
- The last phase changes the hall itself: the walls of bone he leaves carve it into lanes, and the heroes have to path
  round them while the whole court is out and the soul fire curses.

## Numbers (tuned in tests)
HP 1000 (round 12; round 8 had 1100, before that 950) x the room's multiplier (floor 3 of depth 1 is about x1.47) x party size (0.4 + 0.2 per
hero: 1.0 for three). Cleave 20, Lance 27 (480 long), Bone spike 13 + stagger, Soul Nova/Ring 25 + chill 45 (phase 4:
curse 40 instead), the Last Court's call 14 + curse 30, a bone wall block shoving you 6 + curse 20 (each x his damage
multiplier, about 1.16). Speed 48, turns slowly (2 rad/s). Phases at 66%, 40% and 16%. Adds use the room's
multiplier. Timings above are phase 1's. Curse 0 and radiance 0.5 on him.

Tests (`tools/runs.mjs --boss --theme crypt --first`: the starter trio paladin + archer + twinfang with tier I of their
first ability, straight into his room at full health, 12 fights each):
| | level 6 | level 8 |
|---|---|---|
| before round 8 (3 phases, HP 950) | won 12 of 12, fights 80-109 s | |
| round 8 (4 phases, HP 1100) | won 6 of 12, fights 96-291 s; every loss in phase 4, with him at 0-11% | won 12 of 12, fights 76-113 s |
Every fight reaches phase 4 (at 60-115 s). The loop lane's new levels and scaling move these; the knobs are HP,
`PHASE_AT` and the `KING` table in boss.js.

## What the heroes need (the hook)
`addDanger(w, zone)` in `sim.js`: a zone is a circle, ring, cone or line with a timer, the team that made it, and
what it does when it fires. The sim counts it down, strikes at 0 (unless whoever made it is dead), and every
unit of the other side steers out of it once it has been showing for that unit's reaction time
(`dangerEscape`, used by `movement()`; `steer()` also won't walk into one). Escaping is a scramble: twice the turn
rate and acceleration and 10% more speed while running out, so a tank facing him can still turn and go. Any enemy can use it (the Gaper's
charge line uses it too).

Round 12 (lane D): HP 1100 to 1000 (the Crypt went from x3.8 to x3.2). The campaign meets him with the starter four (paladin, archer, cleric, twinfang) at about level 33: `node tools/runs.mjs --boss --theme crypt --level 33 --party paladin,archer,cleric,twinfang --n 20` won 11 of 20, wins about 179 s.
