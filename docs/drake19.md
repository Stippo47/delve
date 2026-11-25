# Cinder, the Old Drake, round 19 (lane drake19): what was off, and what was done

The designer: "fixing the drake. Body moves weird, don't like how it attacks. Very slow, etc."
The drake stays what it is (the Ember Deep's boss: a long wingless fire drake that walks, three phases, its fire the
game's fire; round 9's "No wings. No flying." stands). Everything below is a fault in how it moves, strikes and keeps
time, found by playing and filming it before anything was changed.

How it was looked at:
- `tools/drake19/watch.mjs`: a fight recorded frame by frame (30 a second, the frames kept) with a line of the fight's
  state per frame (`state.json`, `moves.txt`: which move starts at which frame). `tools/drake19/sheet.sh` lays frames
  out side by side. Frame numbers below are frames of `docs/clips/drake19/before-full-fight.mp4` (paladin, archer,
  cleric, twinfang at level 44, seed 3; the whole room) and of `before-phase1-zoomed.mp4` (the same fight, the same
  frames, close on the drake); `p2` is `before-phase2-zoomed.mp4`, `p3` is `before-phase3-close.mp4`. Second = frame / 30.
- `tools/drake19/probe.mjs`: fights in Node, measured (its pace, what each move catches, the shape its body is in).
  Before: `tools/drake19/probe-before.txt` (20 fights).
- `tools/runs.mjs --boss --bossid cinder --theme ember`: win rates (before: `tools/drake19/before-*.txt`).

## The problems (numbered; where each was seen)

### Its body
1. **The body is a train on rails.** Every joint replays the exact path the head walked, corners and all, so each
   shove or quick turn of the head stays in the body as a hard dog-leg that then travels down it: a Z of straight
   pieces, not a spine. f194-232 (6.5-7.7 s: neck one way, chest another, at right angles), f396-423 (13.2-14.1 s).
   Measured: a bend sharper than 0.6 rad within 26 of spine 76% of the fight.
2. **It ties itself in knots.** Circling a hero who stands at its neck, the body winds into a pretzel: head inside its
   own coil, tail lying over its neck, legs sticking out all round. f560-604 (18.7-20.1 s), f1040-1097 (34.7-36.6 s: a
   closed ring, the head biting from inside it); in the ring run the body crosses itself in an A: p2 f292-328
   (9.7-10.9 s). Measured: two places of its spine 130 apart lying on each other 2.5% of the fight.
3. **The head turns on a pin.** It swings up to 0.65 rad to "look" at its mark, at once, about its own middle; the
   neck behind it does not move. f186-232.
4. **Standing, it is a still picture.** No breath, no shift of weight; the tail's idle sway is one stiff rod turning
   0.16 rad. It stands still (under 12 a second) 38% of the fight: the scorch (1 s tell + 3 s + 0.7 s after), the
   roars, the holds after every move. f242-354 (8.1-11.8 s: 3.7 s without one part moving but the head).
5. **The tail is a rod.** It does not trail or swing out when the body turns, and in the Tail Sweep it jumps from one
   side to the other in 0.16 s (five frames, f379-384) with no whip in it.
6. **The legs do not carry it.** Thin stalks planted far out from the body; when it runs (the rush at 600 a second,
   the ring) the feet are left behind and put back "at once"; coiled, they point every way. f608-652 (20.3-21.7 s),
   p2 f244-376.
7. **The rush pulls the body out of its knot like a rope through a ring**: the head leaves, the rest unspools after
   it along the old path. f608-652.
8. **It starts the fight with its hips and tail through the far wall**, and its tail's tip goes through walls in the
   fight too. f96-186 (3.2-6.2 s). Measured: body boxes out of the room 4.7 box-seconds a fight, the tip 2.7% of the fight.
9. **Its body lies over the pillars** when it runs the ring (the head steers round them, the flanks do not).
   p2 f256-328 (8.5-10.9 s).
10. **Seven health bars hang over its back**, one on every hit box of the body, whenever it has been struck: all fight
    long. f354-423 and every other close frame. (The boss has its bar at the top; a body box keeps no health.)
11. **Struck anywhere, only the head flashes**: a white head on a red body. f372, p2 f136.

### How it attacks
12. **The bite is almost never seen: 1.4 a fight.** It needs a hero in front of a head that walks sideways round the
    party. When it does come the head moves 20 for a sixth of a second and the "bite" is a strip of teeth that appears
    in front of the snout, not its jaws. f1055-1085 (35.1-36.2 s; the strip at f1073-1079).
13. **The Scorch is the whole fight.** 21% of the time it is planted breathing (4.7 s each, the body frozen: 4), and
    that is where the party's health goes: 4.2 party-healths a fight are lost while it scorches, against 3.2 in
    everything else together. A hero at its neck stands in the root of the cone untouched by nothing but the fire's
    width; the tell is a flat cone on the floor, the drake itself does nothing to say "breath". f212-354 (7.1-11.8 s).
14. **The Tail Sweep's arc is left behind.** The brain goes on walking through the sweep's 0.75 s tell, so the cone
    shown on the floor stays where the hips were, and the slash is drawn there too, while the tail whips somewhere
    else. f357-387 (11.9-12.9 s: the red sector up and right of the hips; the tail ends pointing right). It catches
    nobody 55% of the time.
15. **The Rush is a slide.** For 0.95 s the head turns on the spot (its only sign is dust behind it), then the head
    is moved down the line at 600 a second: no gathering before, no gallop during, no weight at the end. f566-653.
16. **The Ring of Fire is 7-9.7 s of running in which it threatens nobody** (12% of the fight; 0.18 party-healths lost
    in it), body crossing itself (2) and the pillars (9). p2 f160-428 (5.4-14.3 s).
17. **Fire Call and the phase roars stop it dead** for 1.0-1.4 s each (5% of the fight roaring), head still.
18. **The heroes' timed abilities cannot see half its moves.** `threat.js` reads zones that carry a blow: the rush's
    line and the scorch's cone carry none (the rush hits by touch, the scorch by tick), so a dodge or a guard is
    never timed against them.

### Its pace
19. **One attack about every 8 seconds.** A minute of fight has 3.0 scorches, 1.6 rushes, 1.1 tail sweeps, 0.6 bites,
    0.8 rings and the fire calls; between two blows with a tell on the floor the median is 11 s and a quarter of the
    gaps are over 26 s. 48% of the fight it walks a circle 250 out from its mark at 71 a second, doing nothing else.
20. **It circles instead of hunting.** It never closes on anyone: the party comes to it, stands at its neck, and it
    winds round them (2). Its mark is at its mouth and it walks on by.
21. **Everything waits.** First scorch after 3.5 s, first rush after 5; scorch every 9-11.5 s, rush every 10-13; a
    hold of 0.45-0.7 s after every move; tells of 0.75-1.0 s.

### Its death
22. **It vanishes in one frame** into a row of white puffs and small brown ovals. p3 f1268-1271 (42.3 s).

### Numbers
23. At level 44 (where the campaign meets it, docs/balance/r15-bosses.txt; the band is 40-60% there) the party wins
    40 of 100 and 46 on other seeds (37 at level 41, 67 at 47); a melee four 23 of 40, four shooters 0 of 40. In the
    band: to be kept there.
