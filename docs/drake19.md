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
19. **One move about every 8 seconds.** A minute of fight has 3.0 scorches, 1.6 rushes, 1.1 tail sweeps, 0.6 bites,
    0.8 rings and the fire calls: 7.9 moves with a tell; between two the median is 7.0 s, a quarter of the gaps are
    over 10 s and a tenth over 14 s. 48% of the fight it walks a circle 250 out from its mark at 71 a second, doing
    nothing else.
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

More, found while fixing:

24. **Its hit boxes were up to 30 off the body that was drawn.** The seven boxes overlap, and each tick the game's
    own bodies-push-apart rule shoved them off each other (some out of the room) after the drake had placed them.
25. **A move's clock ran only while that move could be used** (`due()` was asked only once its conditions held), so a
    bite's 3 s only passed with a hero already at its mouth.
26. **The rush ran the room's length whatever it was aimed at** (640, in a room 1300 by 960): most rushes ended in
    the far wall, dazed. And a rush could be started at a pillar a step away.
27. **No face and no words in the Book**: a blank disc and "How it fights." (the Sand Wurm lane noted it for six bosses).
28. **No sound at the phase turn** (the cue reads `u.k.phase`; only the Bone King keeps its state there).

## What was done (each number above; the clip and the second where it shows)

Clips are in `docs/clips/drake19/` (git-ignored), 30 frames a second, recorded with `tools/drake19/watch.mjs`
(`tools/drake19/clips.sh` makes the whole set) and looked through on contact sheets (`tools/drake19/sheet.sh`).
`before-full-fight.mp4` / `after-full-fight.mp4`: the same party, level, seed and view (the whole room).
`before-phase1-zoomed.mp4` / `after-phase1-zoomed.mp4`: the same fight, close on the drake ("p1" below).
One move each, close, with three heroes (paladin, twinfang, cleric: less of their own effects over it):
`after-bite.mp4`, `after-claw.mp4`, `after-tail.mp4`, `after-scorch.mp4`, `after-rush.mp4`; with the four:
`after-ring-firecall.mp4`, `after-phase-turn.mp4`, `after-phase3-molten.mp4`, `after-death.mp4`.
`book-preview.mp4`, `book-preview-page.png`: the Book.

### Its body
1. **A spine, not a train.** The body is a chain of 27 joints dragged behind the head: each keeps its distance to the
   one before, so nothing in the body moves faster than the head and a turn of the head runs down it as a curve. No
   joint bends past its limit (neck 0.42 rad a joint, trunk 0.24, tail 0.3-0.38), and the spine is stiff (a bend eases
   out, fastest through the trunk), so no corner can stay in it. Bends sharper than 0.6 rad in 26 of spine: 76% of the
   fight -> 8% (what is left is the tail mid-whip and the body lying along a wall). p1 4.0-9.5 s (it uncurls, comes at
   the party, turns: one long curve all the way), 15.7-18.4 s (a wheel); `after-full-fight.mp4` throughout.
2. **It cannot knot.** Three rules: the head turns on its neck no further than 1.5 rad from the way its chest points;
   it can *go* no further than 1.1 rad to either side of its chest, so the body has to come round with it (a turn is
   about 280 across; held up at a wall the head is let further round until it is free); and if its own hindquarters
   are ahead of its nose it goes straight on. Spine lying on itself: 2.5% of the fight -> 0.3%. p1 15.7-18.4 s and
   24-27 s (wheels: a wide U, never a ring); `after-ring-firecall.mp4` 5.1-11.4 s (the whole ring run: one clean arc).
3. **The head is on its neck.** It turns where the neck lets it, eased (the look at its mark is eased too), and the
   neck's first joints bend with it. p1 4.9-5.4 s (it swings round to bite), `after-bite.mp4` 11.8-12.4 s.
4. **It is alive standing.** It breathes (the chest swells and falls); before the scorch the chest swells far out and
   the head draws back; in the scorch it creeps forward after its flame with the tail lashing; the tail sways and its
   feet shift under it. Standing still: 38% of the fight -> 24%, and that is the bite, the claw and the roars, not
   waiting. `after-scorch.mp4` 4.5-8.1 s; p1 9.5-12.7 s.
5. **The tail is a tail.** Three springs down its length, each after the one before: it trails, swings out the other
   way when the hips turn, and in the sweep it whips base first with the blade last, overshoots and settles.
   `after-tail.mp4` 4.5-5.6 s and 10.0-11.0 s (wound to one side, the whip, the follow-through); p1 6.0-7.4 s,
   15.7-18.4 s (it swings out through the wheel).
6. **The legs carry it.** Thicker legs, broader paws, the feet nearer the body; steps get longer and quicker with its
   pace and a foot left behind takes one fast step (it is never put back); gathered for a rush the feet bunch under
   it. `after-rush.mp4` 5.3-6.0 s (the gallop), 6.0-6.4 s (the skid: four feet digging in); p1 4.0-4.9 s (the walk).
7. **The rush takes the body with it**: there is no path to unspool, the chain is dragged straight. `after-rush.mp4`
   5.3-6.0 s.
8. **Inside the room.** It sleeps curled up at the far end (it lay straight out through the wall); the spine's joints
   are kept 18 inside the walls and slide along them. Body boxes out of the room: 4.7 box-seconds a fight -> 0; the
   tail's tip through a wall: 2.7% -> 0. p1 0-2.9 s (asleep, curled), 2.9-4.9 s (it wakes and uncurls).
9. **Pillars push the spine aside** (each joint keeps the pillar's width and a share of its own off it): the body
   bends round a pillar. `after-ring-firecall.mp4` 5.1-11.4 s; `after-phase3-molten.mp4` 10.8-15.9 s.
10. **No bars over its back**: a body box shows no bar (`def.noBar`, the Sand Wurm's rule). The tail's blade keeps
    its bar: it has health of its own. Any clip.
11. **Struck, the whole animal blinks**: the head white for a frame as before, the body with it but faintly (a wash of
    22%: the whole length solid white at every blow was too much). p1 5.6 s, 20-21 s.

### How it attacks
12. **The Bite is its main blow: 1.4 a fight -> 11.** The head swings round on its neck (anyone within 1.3 rad of its
    chest and 170 of its head), rears back with its jaws wide and a glow in the throat (0.5 s), then really darts (108
    in a ninth of a second: the unit moves, the neck and shoulders are dragged after it) and the jaws clap shut on the
    dart's end: a white crack, two arcs closing from the corners of the mouth, a lick of flame. The strip of teeth is
    gone. `after-bite.mp4` 5.2-6.4 s and 11.8-13.1 s; p1 4.9-6.0 s, 22.5-23.4 s; `after-phase-turn.mp4` 6.8-7.7 s.
13. **The Scorch is one move among five.** A tell on the drake itself (it breathes in: chest out, head back, sparks
    pulled into its mouth, 0.75 s), 2.4 s of flame (it was 3), aimed at someone in front of its chest and turning after
    them no further than the neck goes; it creeps forward as it breathes. Its share of the fight 21% -> 11%; party
    health lost in it 4.2 -> 2.6 party-healths a fight (the rest is now the claw 1.4, the bite 1.0, the rush 0.5).
    `after-scorch.mp4` 4.5-5.3 s (the breath in), 5.3-8.1 s; p1 9.5-12.7 s.
14. **The Tail Sweep's arc rides with the hips**: the zone and the slash are placed from the hips every tick, and the
    blade's whip covers the arc shown. `after-tail.mp4` 4.5-5.6 s; p1 6.0-7.4 s (it walks on through its own sweep and
    the arc comes with it).
15. **The Rush is a charge.** It gathers (0.7 s: drawn back, low, feet bunched, dust at its hind feet), gallops at 640
    down a line that ends 190 past its target (the furthest hero in front of it: the back line), and ends in a skid
    (0.36 s, feet digging in, the head coming round on its mark, the hindquarters following). Into rock: the crash and
    the daze, as before. `after-rush.mp4` 4.5-5.3 s, 5.3-6.0 s, 6.0-6.4 s; p1 13.9-15.7 s.
16. **The Ring of Fire is quicker and clean**: about 6 s (it was 7-9.7), one unbroken arc of body round the party.
    Kept as the set piece it is. `after-ring-firecall.mp4` 5.1-11.4 s; `after-phase3-molten.mp4` 10.8-15.9 s.
17. **The Fire Call's roar is 0.75 s** (1.0) and it is hunting again as the fireballs fall.
    `after-ring-firecall.mp4` 13.9-14.6 s (the roar), 14.6-17 s; `after-phase3-molten.mp4` 9.7-10.5 s.
    The phase turn's roar is as it was (a set piece, and it throws the party back): `after-phase-turn.mp4` 5.1-6.3 s.
18. **Its moves tell `threat.js` when they will land.** A boss's own running move can say so (`u.strikes(hero)`: one
    line in `js/threat.js`): the rush on whoever is in its lane (the tell and the run counted), the scorch on whoever
    is in the cone. The bite, the claw, the tail, the roar and the fireballs are zones that carry their blow, which
    it read already.
    **New move, the Claw** (a call, below): whoever stands at its chest is raked off by the foreleg on that side.
    `after-claw.mp4` 5.7-6.5 s; p1 7.4-8.2 s, 34.6-35.4 s.

### Its pace
19. **A move every 3 seconds.** 7.9 -> 16.5 moves with a tell a minute; between two the median is 3.3 s (7.0), a
    quarter of the gaps over 4.7 s (10), a tenth over 6.1 s (14). p1: bite 4.9 s, tail 6.0, claw 7.4, scorch 9.5,
    rush 13.9, tail 18.4, bite 22.5.
20. **It hunts.** Passes through the party instead of a circle round it: at its mark, by their side and on, a wheel,
    again. Its mark is in front of it as it comes, beside it as it passes, behind it as it goes: all three weapons
    get used. p1 4.0-9.5 s, 13.9-23 s; `after-full-fight.mp4` throughout (it crosses the room all fight).
21. **Less waiting.** It walks at 84 (56) and runs when it wheels; tells 0.42-0.75 s (0.75-1.0); after a move
    0.55-0.95 s (holds of 0.45-0.7 plus the long clocks); scorch every 7.5-9.5 s (9-11.5), rush every 6.5-9 (10-13);
    and every clock now runs whenever it is free (25).

### Its death
22. **It falls and stays.** The whole animal as it stood: its legs give way and it drops, dust along its length, the
    head rolls aside with the jaw slack, its colour cools to char as small flames lift off it and go out; the husk
    lies in the room. Its hit boxes are no longer deaths of their own. `after-death.mp4` 5.1-5.6 s (it drops),
    5.6-7 s (it cools), to the end (the husk).

### Numbers, and the rest
23. **In the band** (table below).
24. **Hit boxes where the body is**: the boxes are `fixed` (put where the spine is each tick; the game does not push
    two fixed bodies apart).
25. **Every clock runs while it is free to move.**
26. **The rush is aimed**: 190 past its target (260 at least, 640 at most), and only with 260 clear.
27. **The Book**: its face is painted by its own drawing (`def.picture`), and it has words (`js/bestiary.js`: the
    designer's to rewrite). `book-preview-page.png`, `book-preview.mp4`.
28. **The phase sound plays at the turn** (for the drake; `cue('bossPhase')` in `enter`).

## Calls (each easy to turn back)
- **No wings, no flying**: round 9's ruling stands. Its life is in the spine, the neck, the tail and the legs.
- **It hunts in passes** (it prowled a ring round its mark). A pass shows all three of its weapons; a ring kept it
  side-on to everyone and winding.
- **It turns like a long animal**: the head leads at most 1.1 rad off its chest (`LEAD`), so a turn is a curve about
  280 across. That is what makes the body read as one creature; the price is that it cannot snap round on someone
  behind it (the tail and the claws are for them).
- **A new move, the Claw** (phase 1 on): whoever stands within 112 of its shoulders at its side is raked off by that
  foreleg (0.42 s tell: the leg lifts and reaches forward; a cone 138 long, 2.2 rad, 46 and thrown; every 3.4-4.4 s).
  The doc always said "its mouth, its flanks and its tail are three places"; the flanks had nothing.
- **The Bite lunges** (the head really moves 108) and reaches anyone within 1.3 rad of its chest: 70 (80).
- **The Scorch** is 2.4 s (3), tells in 0.75 s (1.0) on the drake's own body, creeps forward, and is aimed at whoever
  is ahead of its chest: 15 a tick (17), burn 13 (14).
- **The Rush** goes 190 past the furthest hero in front of it (it ran 640 at its mark), tells in 0.7 s (0.95), ends
  in a skid, comes every 6.5-9 s (10-13).
- **Health 800** (900). It strikes twice as often and the fights ran long: health down, not the blows (bite 70,
  claw 46, tail 70, rush 78, fireball 62 from 68, scorch 15 a tick from 17).
- **A boss's move can speak to `threat.js`** (`u.strikes`): one line there, for any boss.
- **Left: jammed at a wall with a hero in its bend it can still lie in a tight C for a moment** (`after-bite.mp4`
  11.2-12.4 s, a bite-only test fight): the wall rule lets the head further round to get it free.
- **Left: status flames (burning, Kindled) are drawn on the head only** (the game draws them on the unit).

## Found, outside this lane
- Five designed bosses still have no face or words in the Book (the Chieftain, the Ooze, the Queen, the Seraph, the
  Engine) and no phase sound.
- A party of four shooters cannot win this fight at level 44, before or after (0 of 40 both): the drake closes on the
  back line faster than they can kill it. Not retuned here.

## Numbers
`node tools/runs.mjs --boss --bossid cinder --theme ember --level L --party paladin,archer,cleric,twinfang --n 100`
(level 44 is where the campaign meets it, docs/balance/r15-bosses.txt; the band is 40-60% there).
Before: `tools/drake19/before-*.txt`. After: `tools/drake19/after-*.txt` (`tools/drake19/measure.sh`).

@@TABLE@@

What the fight does, measured (`tools/drake19/probe.mjs --n 20`, `probe-before.txt` / `probe-after.txt`; "before" is
the same probe run on the code as it was):

@@PROBE@@

## Checks
@@CHECKS@@
