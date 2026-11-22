# Round 15, lane N: six new heroes and the Shackled status

The designer's words (deck notes of showcase 3, `docs/riffle-log/2026-11-22-round12.txt`):

> "Make new hero. Mob. Is 4 peasants. Is the collective of all 4. Each is like 30% the strength of 1 normal hero.
> Torch, pitchfork, axe, and dagger. They are strongly attracted to each other. All melee. They share 1 health pool.
> Clock work hero. Influence time.
> Air mage. Whirled effect
> Warden (uses a lot or shackles and restraints. Nullification themed)
> Telekinetic.
> Earth mage (earth quakes, chains of spikes from the ground, spawn stone walls.)"

and, of the Old Guard's Pommel Strike: "Shackled status effect, target can't do basic attacks, ability cooldowns are set
back 50%" ... "the shackled ability goes to someone else."

One block per hero below: the words, what was built, the numbers, and the clip of each move
(`clips/r15/heroes/<name>.mp4`; recorded with `tools/clip.mjs` through `tools/hero-clips.mjs`, which stages one real
battle or run per clip: enemies' health raised and their blows softened so the hero lives to show the move, the move
used at a set moment at the tier named). Tiers in the clips: each ability at tier III unless said.

Where things are: data `js/heroes3.js`, kits `js/kits3.js`, looks `js/fx3.js`, the Mob's plumbing `js/mob.js` and
marked hooks in `js/sim.js`, Shackled in `js/statuses.js` + `js/sim.js` (rules in `docs/STATUSES.md`), stand-in
sprites `art/heroes/standin/` (what the real art needs: `docs/ART-NEEDED.md`), numbers `docs/balance/r15-newheroes.txt`.
Each hero has an attack, three abilities with tiers I-III, a trait, the skill web every hero has (it is built from the
abilities: `heroes.js treeFor`), Book words, a Book preview of every move at every tier and a trait scene of its own.
Ability ids are new, so no save is touched.

**The rule each kit was held to** (your past notes on hero work): three abilities that do three different jobs, never
three "damage in a shape"; every effect drawn, none shown as a word; every ability worth its button, measured by
switching it off (`tools/ability-worth.mjs`, the tables at the end).

## The heroes

### The Mob (`mob`, a fighter)
- "Is 4 peasants. Is the collective of all 4." -> four bodies in the room that are one hero: one slot in the party, one
  card on the HUD, one health bar, one set of abilities, one entry in the save. The torch-bearer is the hero's own
  unit; the pitchfork, the axe and the dagger are its other three bodies (`mobPitchfork`, `mobAxe`, `mobDagger`).
- "Each is like 30% the strength of 1 normal hero." -> on paper the four together strike for 16.6 a second against a
  plain fighter's 13.0 (the Haymaker): 32% each. The pool is 388 health against a fighter's 314: 31% each. Each body is
  64% of a hero's size.
- "Torch, pitchfork, axe, and dagger." -> each strikes with its own: the **torch** burns (6 burn a blow), the
  **pitchfork** jabs from further off (reach 34 against 24) and shoves, the **axe** is slow and heavy (a heavy blow:
  it gets past half of armour, and staggers a little), the **dagger** is quick (a blow every 0.6 s) and makes them
  bleed. Clip: mob-attack.
- "They are strongly attracted to each other." -> a leash: a body more than 96 from the middle of the other three leans
  back towards them, and past 150 it drops what it was doing and runs back faster than it walks (x1.35). Knock one
  away and it comes sprinting back. With nothing to fight the three keep station just behind and beside the
  torch-bearer. They fight what the torch-bearer fights; a body that can't reach it fights whatever is at arm's length.
- "All melee." -> all four.
- "They share 1 health pool." -> one pool. A blow on any body comes off it. **My call, please check:** one blow (or one
  tick of a burning floor) that catches several bodies lands in full on the first and 30% on each more, so a slam that
  catches all four does 190%, not 400%. Without a rule every area attack in the game would hit this hero four times.
  Measured in runs, this adds about a tenth to what the Mob takes. Clip: mob-area (a blast over all four, then one blow
  on one body, the same damage each: the bar drops 1.9 times as far for the blast).
- **Pile On** (`pileOn`): all four jump on one enemy, hold it down by the arms and legs and lay into it in turn, each
  with what it carries. It can't move, turn, strike or use anything, and everyone hits it 25% harder meanwhile. I: held
  2.2 s (a boss 40% of that); II: 3 s; III: when they let go they throw it, and it is knocked out where it lands.
  The job: one dangerous enemy taken out of the fight. Clip: mob-pileOn.
- **Surround** (`surround`): the four run out to four sides of the enemies and close in at once, shoving everything
  they meet into one knot in the middle (each one shoved is hit). II: the torch sets the floor alight where they meet,
  4 s; III: those herded are knocked off their feet for 1.2 s. The job: bunching enemies up for everyone's area
  attacks. Their pull to each other is the move. Clip: mob-surround.
- **Scatter** (`scatter`): they bolt four ways. Whoever was after them loses them, the leash is let go for 3 s, each
  fights on its own and they take half damage. II: healed 14% as they regroup; III: apart, each strikes twice as fast.
  The job: getting out from under a pile or a slam about to land. Clip: mob-scatter.
- Trait **Strength in Numbers** (`strengthInNumbers`): each hits 9% harder for every other one within arm's reach: 27%
  with all four together, nothing scattered (red steam comes off them when all four are shoulder to shoulder). Clip:
  mob-trait (three are knocked away mid-fight: the steam stops, they sprint back, it starts again).
- Being downed and lifted: mob-revive. Walking with a party: mob-walk.

**Every place that had to be taught about a hero with four bodies** (each is marked "round 15 (the Mob)" in the code):
1. `js/mob.js` (new): the rules' numbers, and `bindBody`: the other three bodies' health, statuses, buffs, kit,
   trinkets, web numbers, side, and every "held" state (stunned, frozen, rooted, asleep, afraid, shackled, down, dead,
   through the door) are the torch-bearer's own fields. That one binding is what makes heals, buffs, cleanses,
   statuses, charm, being downed, being lifted and leaving the room work on "the hero" with no code of their own.
2. `sim.js spawn`: a kind with `def.bodies` gets its other bodies made beside it, wherever it is spawned (a run, a
   battle, the wagon road, the Book's stages, the lab, the unit page's probe).
3. `sim.js hurt`: the several-bodies rule; and the fall, the cheat-death hooks and the stats are the hero's whichever
   body took the blow.
4. `sim.js addStatus`: a status lands on the hero whichever body it caught; the same several-bodies rule for clouds and
   burning floors.
5. `sim.js heal`: a heal on any body is the hero's, and one heal that reaches several bodies counts once.
6. `sim.js kill` / `killNow`: the four go down as one, each lies where it fell; in a battle each leaves its own body.
7. `sim.js turnSide` / `restoreSide`: charmed, the four change sides as one.
8. `sim.js allies`: the other bodies are not more friends (a "most hurt friend" is the hero, once).
9. `sim.js chooseTarget` (`bodyTarget`): what a body fights. `sim.js movement`: keeping station, the leash, the run back.
10. `sim.js step` (`bodyTick`): the pool's clocks, statuses, kit, trait and trinkets tick once, with the torch-bearer;
    a body doesn't drink potions or pick abilities.
11. `sim.js unitNumbers`: attacks a second is the four's together and damage a hit their average blow (the unit page,
    the pause panel).
12. `stats.js sourceOf`: a body's blows are the hero's weapon, not a pet's (every other stat already follows
    `summonBy`). Each body carries `summon` and `summonBy`, which is why the HUD cards, the party list, XP, pick-ups,
    the wagon's guard sides and posts, the run's result and about sixty "pick a friend" lines in the kits already
    leave them out; `render.js` is told not to tint them blue like a summon.
13. `render.js drawOverlay`: one health bar, on the torch-bearer. `inspect.js select`: a tap on any body opens the hero.
14. `battle.js fighting`: one fighter in the count. `units.js`: `bodies` and `portrait` carried to the def.
15. `kits.js initKit`: a Reach node lengthens all four's reach.
16. `camp-scene.js`: the four sit, walk and rest at camp together. `ui-kit.js`, `skilltree.js`, `main.js`: faces show
    the four (`portrait`), not the torch-bearer alone.
17. `preview-sim.js`: a stage's "what it called up falls at the end" leaves the bodies alone.
18. The Clockmaker's Rewind puts all four back; enemies' area moves, shots, grabs and taunts needed nothing.

### Clockmaker (`clockwork`, a helper)
- "Clock work hero. Influence time." -> every move is a real change to time, not a slow with a new name.
- Attack **Clock hand**: a thrown brass hand; whatever it hits loses a moment (its next blow comes 0.33 s later; a
  boss 0.12 s). Clip: clockwork-attack.
- **Rewind** (`rewind`): one friend is put back where they stood a few seconds ago with the health they had then; what
  statuses they picked up since are gone. He keeps a note of where and how everyone was, four times a second, six
  seconds back. I: 3 s back, at most 35% of their health; II: 5 s, at most 50%; III: once a room, a friend who has just
  fallen is turned back to before the blow. Afterimages run back along the way they came; a dial under them turns
  backwards. Clips: clockwork-rewind (tier II), clockwork-rewind3 (tier III, in a run: the fallen friend).
- **Slow Time** (`timeBubble`): a bubble over the enemies where their clocks run at 45%: walking, striking, winding
  up, recharging, and their shots crawl through it. I: 5 s; II: time runs 30% fast for friends inside; III: wider, 7 s.
  Clip: clockwork-timeBubble (tier II). The bubble's look comes in two takes (`?v_timeBubble=N`): 1 Dial (the game's),
  2 Glass. Clip of take 2: timeBubble-2-glass.
- **Stop the Clock** (`stopClock`): every enemy and every enemy shot in the room hangs where it is while the party
  carries on. I: 1.4 s (a boss 0.6 s); II: 2 s; III: when time starts again each takes at once a third of what it was
  dealt while it stood still. Clip: clockwork-stopClock.
- Trait **Spare Second** (`spareSecond`): once a room, the blow that would bring him down never happened: he is back
  where he stood three seconds ago with the health he had then (never less than 30%). Clip: clockwork-trait.

### Air Mage (`airMage`, a caster)
- "Air mage. Whirled effect" -> Whirled is the Griffon's (`whirl()` in kits2.js: shoves go further as it builds; at
  100 it is flung about three times); she is the hero built on it. Everything she does adds to it.
- Attack **Gust**: a crescent of wind through the first enemy to the one behind: a small shove, 12 Whirled each. Clip:
  airMage-attack.
- **Gale** (`gale`): a push. A wall of wind down a wide lane: everything in it is blown far back and whirled 40, and
  what is blown into a wall or a rock is hurt by it. II: enemy shots in the lane are blown back at whoever loosed them;
  III: a wider lane, whirled 60. Clip: airMage-gale.
- **Updraft** (`updraft`): a lift. An enemy hangs helpless in the air for 1.8 s, then is dropped (hurt, staggered). II:
  everything close to it too; III: slammed down: knocked out, and a whirled one bursts. Clip: airMage-updraft.
- **Cyclone** (`cyclone`): a pull. A whirlwind wanders after the enemies, drags them into itself, batters and whirls
  them until they are flung out. I: 5 s; II: stronger pull, 7 s; III: it bursts as it dies. Clip: airMage-cyclone.
- Trait **Eye of the Storm** (`stormsEye`): when an enemy she whirled is flung about, a clap of wind goes off round it:
  its neighbours are hit and whirled 30. Clip: airMage-trait.

### Warden (`warden`, a tank)
- "uses a lot or shackles and restraints. Nullification themed" -> chains on everything he does, and a move that
  undoes what the enemy is doing.
- **Shackled** is his (the status: `docs/STATUSES.md`, "Round 15"). The rule as you gave it: no basic attacks, and
  ability cooldowns set back 50%, once, when the irons lock; 4 s. While it builds, cooldowns run slower (my call).
  Bosses: 40% of the time, a quarter of a cooldown, 12 s before the next. Its look in three takes
  (`?v_shackle=N`): 1 Irons (the game's), 2 Wound, 3 Staked. Clips: shackled-1-irons, shackled-2-wound,
  shackled-3-staked. In the Book: Statuses, "Shackles" and "Shackled", each with a preview.
- Attack **Iron chain**: a weighted chain swung in a wide arc (the links fly out along it); every blow adds 28
  Shackled (about five blows on one enemy lock it). Clip: warden-attack (the irons close blow by blow and lock).
- **Manacles** (`manacle`): a shutdown. A pair of manacles thrown at the enemy with the most to lose (a caster, a
  shooter, one in the middle of something): Shackled at once. II: staked to the floor too (it can't move); III: a second
  pair flies on to the next. Clip: warden-manacle.
- **Nullify** (`nullify`): an undoing. In a wide ring round him enemy shots drop out of the air, what enemies were
  winding up is broken off, and they can use no ability for 3 s (a padlock on each). II: it strips what protects and
  strengthens them and washes the statuses off friends in the ring; III: 5 s, and the silenced take 20% more.
  Clip: warden-nullify (tier II: two raging orcs, a burning poisoned friend, a volley in the air).
- **Chain Gang** (`chainGang`): a hold. Chains fly to the enemies round him: they are leashed to him (120 at most),
  have to fight him, and he takes 20% less while he holds them. I: three for 5 s; II: five; III: at the end he hauls
  them in and they reel. Clip: warden-chainGang.
- Trait **Ball and Chain** (`ballAndChain`): whatever he shackles drags an iron ball: 40% slower, and it can't dash,
  leap or charge. Clip: warden-trait.

### Telekinetic (`telekinetic`, a caster)
- "Telekinetic." -> lifting and throwing things and enemies, holding one in the air, catching shots.
- Attack **Flung stone**: a stone lifts off the floor beside her and is flung. Clip: telekinetic-attack.
- **Hurl** (`hurl`): a blast. She picks up the nearest heavy thing standing in the room (a rock, a barrel, a post: it
  is really taken out of the room and the way through opens) or, with none in reach, tears a slab out of the floor, and
  hurls it into the enemies. I: one; II: a second straight after; III: it bursts into shrapnel: wider, and it staggers.
  Not fountains, trees, a boss room's pillars or a troll's boulder. Clip: telekinetic-hurl.
- **Levitate** (`levitate`): a hold and a throw. An enemy hangs helpless in the air, then is flung at the thickest of
  its friends: it and what it lands on are hurt. I: 2 s; II: 3 s, and it takes 20% more while it hangs; III: two at
  once. A boss is too heavy: pressed down and slowed instead. Clip: telekinetic-levitate.
- **Mind Shield** (`mindShield`): a shelter. A dome round her and the friends beside her: enemy shots that reach it
  stop dead and hang there, enemies that walk in are pushed out, and when it drops everything it caught flies back at
  whoever loosed it. She stands still to hold it. I: 3.5 s; II: 5 s, thrown back 50% harder; III: it ends with a shove.
  Clip: telekinetic-mindShield.
- Trait **Poltergeist** (`poltergeist`): when an enemy dies near her its body is flung at the nearest of its friends
  (the real body: it flies, spins and lands). Clip: telekinetic-trait.

### Earth Mage (`earthMage`, a caster)
- "earth quakes, chains of spikes from the ground, spawn stone walls." -> one ability each, as written.
- Attack **Rock**: a lump of rock, a solid knock, a little stagger. Clip: earthMage-attack.
- **Earthquake** (`earthquake`): a stumble. The floor under the enemies shakes: slowed to half, staggered again and
  again (it knocks them out if they stay), hurt. I: 3 s; II: wider, 4.5 s; III: it ends with the floor heaving up and
  throwing them off their feet. Clip: earthMage-earthquake.
- **Spike Chain** (`spikeChain`): the damage. A line of stone spikes bursts out of the floor running from her to an
  enemy, and from there on to the next, and the next; what stands on the line is caught too. I: three enemies; II:
  five; III: the last spike under each holds it fast (rooted 1.4 s). Clip: earthMage-spikeChain.
- **Stone Wall** (`stoneWall`): a real wall (the room's own kind: nothing walks or shoots through it, and enemies have
  to go round) heaved up across the way of a brawler coming for one of the party's soft ones. I: 6 s; II: longer, 8 s;
  III: it comes down on the enemies' side. She only raises it for that: thrown up at every chance it would stand in
  the party's own line of fire (the Frost Mage's Ice Wall taught that in round 13). Clip: earthMage-stoneWall.
- Trait **Aftershock** (`aftershock`): a moment after one of her abilities hurts an enemy, the floor cracks under it
  and a stone spike comes up. Clip: earthMage-trait.

NUMBERS
