# Round 17, lane water17: the Water Mage

The designer's design (the lead's brief): a beam to the nearest target or a hurt ally, 2 s on and 1.5 s off, Wet slowly
on enemies, on allies a heal that removes what Wet would remove without making them Wet; Bubble Shields that block magic
and not physical attacks, Wet on the one inside and a knock-back when popped; a Dome that soaks every enemy in it, stops
things entering or leaving, deflects projectiles and slowly heals allies inside; a Water Cannon, a large laser of water
that heals allies and hurts enemies it passes through, applying Wet; trait: hurt while standing on water, she splashes
3 projectiles back at the attacker, as the lizards do.

Where things are: data `js/heroes-water.js`, kit `js/kits-water.js`, looks `js/fx-water.js`, art
`art/heroes/waterMage.svg` (a placeholder sketch: docs/ART-NEEDED.md), glyphs `bubble`, `dome`, `jet` in `js/icons.js`,
the Book's previews `js/preview-sim.js` (a spell stage for the bubble, a friend beside the beam, a puddle for the trait),
checks `tools/water17/checks.mjs`, clips `docs/clips/water17/`, numbers `docs/balance/water17.txt`.
Registered in heroes.js, heroes2.js (glyphs), kits.js (abilities, traits, attack, tick), fxkit.js (looks), bestiary.js
(the `bubbled` buff's name), tools/heroes-doc.mjs, tools/hero-clips.mjs.

## What she does
Support, 80 health, reach 215, 2 gems (as the Air and Earth Mages). Sounds: the game's own cues (the ability cue; the
water splash, audio.js `land` of a water shot, on each beam, bubble, pop, dome, jet and splash; hits as usual).

- **Attack, Tide beam.** A rope of water from her staff to the nearest enemy in reach and in sight, held 2 s (a pulse
  every 0.4 s: 0.52 of her damage, a little shove, Wet 7), then 1.5 s off (the off part runs at her attack speed). On a
  friend: each pulse heals 1.6% of their health (x the support role's 0.62), puts out 45 burning and halves their poison;
  no Wet. Clip: `waterMage-beam` (on a skeleton, then swung onto the paladin when he is knocked under 40% and set
  alight: healed, the fire out).
- **Bubble Shields** (13.4 s). A bubble round a friend about to be hit by magic. I: one bubble, 6 s, it holds a third
  of their health in magic damage. II: two bubbles, 8 s, holding 42%. III: three; a popped bubble throws the magic it
  caught back at whoever cast the last of it, as a homing ball of water (60% of what it held, between 0.8 and 3.2 of her
  damage). Pop: Wet 40 on the one inside; every enemy within 95 knocked back (a small hit, Wet 15). Clip:
  `waterMage-bubble` (fire bolts stop on the paladin's bubble, the skeleton's mace goes through it, the third bolt pops
  it, the fourth lands).
- **Dome** (19.5 s). Over her and the friends round her. I: radius 135, 4 s. II: radius 165,
  6 s. III: when it comes down the water stays: a pool (standing water, the game's own kind) of 80% of its radius for
  6 s. Enemies inside: Wet 16 a second. Friends inside: healed 2.5% a second (x 0.62). Clip: `waterMage-dome` (tier II:
  skeletons pressed against its skin, arrows glancing off, one caught inside soaked).
- **Water Cannon** (12.2 s). She stands and holds a jet 380 long (to the first wall or rock), a pulse every 0.15 s:
  enemies in it take 0.36 of her damage, are shoved down the line (85) and soaked (Wet 9); friends in it are healed 1.4%
  (x 0.62) and washed (burning down 22, poison x0.75). I: 1.2 s, 24 half-wide. II: 1.6 s, 32 half-wide. III: it turns
  after the enemy it was aimed at (1.3 radians a second), sweeping across whatever is between. Clip: `waterMage-cannon`
  (tier III, through the burning paladin and down a line of skeletons).
- **Trait, Splashback.** Struck by a blow (not burning or poison) while she stands in water (a puddle, the sewers'
  channels, Dome III's flood), she throws three of the lizardman's balls of water back at whoever struck her: a fan of
  three, homing a little, each 0.45 of her damage and Wet 30. Not again within 0.6 s. Clip: `waterMage-trait`.

When each fires (the scores): the bubble only when magic is about to land on a friend (a magic shot on course within
1 s: 0.9; a magic danger zone under them: 0.8) or magic users are on a friend (0.45 to 0.75); with no magic about it
waits. The dome when three or more enemies are on the party near her (0.45, four: 0.6), shots are flying at the party
or shooters are on it (up to +0.4), a low friend is beset (+0.3). The cannon down the line that hits the most: three
enemies 0.85, two 0.6, one 0.22 (only when it is the last one, or a hurt friend is on the line: +0.2 each); never
through a wall. The beam's pick is the attack's own rule (below).

## The calls (the design left these open; please check)
1. **Who the beam goes to.** The most hurt friend in reach and in sight when one is under 60% health, or burning or
   poisoned (over 30) and under 90%; else the nearest enemy in reach. While it is on an enemy it swings to a friend that
   drops under 40% (checked every 0.5 s). Never herself. Only while there are enemies in the fight (no free top-ups
   between rooms). The beam starts on its own for a friend even with no enemy in reach.
2. **What the beam washes off a friend.** Wet itself only washes off half the poison (STATUSES.md); the designer named
   burning, so the beam also puts out burning (45 a pulse: out in one or two). Nothing else (chill, curses, bleeding) is
   washed. Wet is not changed.
3. **What counts as magic** (until the tag lane's `isMagicHit` is wired in; the one stand-in is `isMagic(o, src)` in
   kits-water.js, marked `// WIRE: tags.js isMagicHit at merge`): a shot is physical when it is a thing thrown or loosed
   (arrows, fire arrows too, bullets, knives, stones, boulders, bones, hammers, vials...), magic when it is a spell's
   shot (bolts, sparks, fireballs, frost bolts, orbs, notes, water, gusts, ice shards, hex bolts...), and otherwise magic
   only if it carries a spell's status. Any other blow (a swing, a slam, a danger zone, an ability's strike) is magic
   when it carries a spell's status (burn, chill, shock, wet, curse, radiance, charm, sleepy, confuse, fear) or is an
   ability of a caster hero (battle mode). Damage over time (burning, poison) is not a blow and the bubble never meets it.
   A source can say so outright with `o.magic` / `o.physical`.
4. **The bubble's strength.** Each magic blow is stopped whole (its statuses too) and its damage comes off the bubble;
   physical blows go through and leave it be. It pops when its strength is spent **or** its time runs out (so the
   knock-back always happens; the one inside is always soaked at the end).
5. **Who the pop knocks back:** enemies near (not friends).
6. **Who gets bubbles:** friends (or herself) with magic about to land, then friends with magic users on them; the rest
   go to whoever is worst off (hurt and being hit), then herself.
7. **"Stops things from entering or leaving."** Enemy bodies: whoever was outside when it rose stays out, whoever was
   inside stays in (pressed against the skin; a dash, leap or charge into it is broken off). Bosses too (they are the
   moves most worth holding off); a fixed thing (a turret, a boss's part) is let be. **The party walks in and out
   freely** (her side's dome; the paladin can still go out to fight). Shots: every enemy shot that meets the skin, from
   outside or from inside, glances off it (it stays the enemy's); a lobbed thing that would come down across it splashes
   on the skin and never lands. **Telegraphed strikes on the floor (danger zones) are not stopped**: they are not
   things crossing it. The party's own shots pass.
8. **The cannon** is a held channel: she stands still to aim it (as Life Drain), and it stops at walls and rocks.
9. **The trait** counts any standing water: the hazard puddles (a slip's puddle, Dome III's flood), and the
   sewers' channels. It answers blows only (not damage over time), and at most every 0.6 s. No lizard in the game has
   an "on hit in water" trait today; "as the lizards do" was read as the Lizardman's three slow balls of water from its
   tail spin (enemies.js `waterShot`): the same shot and look, a little faster (230-270) so they reach.
10. **Each ability's tier III** (the interesting one): bubbles throw caught magic back; the dome floods the floor (which
    also feeds her trait); the cannon follows its target.
11. **Unlock**: 2 gems, as the Air and Earth Mages.

## The numbers
All in `docs/balance/water17.txt` (Node, this branch). In short:
- **Against the other supports** (tools/balance.mjs, every hero leads, 1620 runs a tier): tier I +1.75 rooms against the
  batch (4th of 13 supports; the supports run -1.73 to +3.23), 22% of the party's damage (supports 21%), 71% of its
  healing (52%), 20% of what it takes, 1.64 downs a run. Tier III +0.76 (3rd of 13; -1.22 to +1.20), 22% damage
  (19%), 65% healing (61%). Inside the band, on its strong side; nothing eased.
- **Each ability switched off** (tools/ability-worth.mjs, 40 parties x 4): tier I: Bubble Shields +1.13 rooms, Dome
  +1.88, Water Cannon +2.88 (38% of her damage); tier III: +0.75, +1.57, +1.07. None negative; the cannon at tier I would
  sit about 12th of the round 16 audit's list (docs/audit/worth.md), not at the top. The bubble is worth least where
  little magic comes at the party (it waits for magic: it is its job).
- **Checks** (tools/water17/checks.mjs, 40 checks, all pass): the beam's 2.02 s on / 1.52 s off at one frame's
  resolution; the beam on a friend heals, puts out burning, washes poison, never soaks; the bubble stops a fire-carrying
  blow and a fire bolt whole and lets a plain blow and an arrow through untouched, pops spent (Wet 40, a near enemy
  knocked 62 back); the dome holds an enemy outside (never nearer than 168 to the middle of a 135 dome) and one inside
  (never further than 117), turns 9 of 9 arrows, heals and soaks inside, lets a friend out; the cannon hurts and shoves
  both enemies on its line and heals and washes the friend on it without hurting him; the trait throws three balls
  only in water, not again within 0.6 s.
- tools/battles.mjs: 528 battles, 0 problems (the nine that run out of time are enemy-only or other heroes' fights);
  tools/preview-check.mjs: threw 0, never fired 0, not offered 0.

## Clips (docs/clips/water17/, git-ignored like every clip; recorded with tools/hero-clips.mjs --hero waterMage)
`waterMage-beam`, `waterMage-bubble`, `waterMage-dome`, `waterMage-cannon`, `waterMage-trait`.
