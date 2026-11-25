# Round 16 fixes: the five bugs, and abilities that fire at the wrong time

Lane fixes16 (round 17 in DECISIONS: "fixes16 (five bugs + when abilities fire; no number or cooldown changes)").
No damage, healing, cooldown or tier number was changed. Only bugs, and *when* (and at whom) abilities go off.

Tools (all in `tools/audit/fixes16/`):

- `bugs.mjs`: one line per bug check (3, 4, 5).
- `measure.mjs`: a few heroes through the audit-heroes scenarios; casts per ability, wins, health margin.
- `compare.mjs`: before/after tables from two measure runs.
- `cure-tiers.mjs`: Cure I against Cure III in the worth audit's group fight.

Bugs 1 and 2 use the audit's own checks: `tools/audit/heroes/vanish-check.mjs` and `queue-check.mjs`.
Raw numbers: `docs/audit/data/fixes16/before/` and `after/`. In `after/`, the `0-` files are the final runs for the
Quartermaster and the Bulwark. `quartermaster.json` there is the earlier try for the Quartermaster (with Grandpa's
final run); compare.mjs reads the `0-` files first.

## Part 1: the five bugs

### 1. A lone hero that goes out of sight lost the battle at once
- **Cause.** battle.js `fighting()` left out every ethereal unit. Burrow, Broom Ride, Call the Flock, Bush, Shadow
  Walk, Blackout and Fade make the hero ethereal for a moment. If that hero was the last one on its side, the side
  counted as beaten. The Digger's Bury did the same to a lone foe, and that counted as a win.
- **Fix.** A unit that is out of sight for a moment still counts. That means anything with a kit (every hero), a foe
  the Digger buried, and a sand burrower under the sand (as before). Traps never count, whether ethereal or not.
- **A fight can still end.** A side left with only traps (Saw Blades) counts as beaten. Anything that stays hidden
  for good is caught by the time limit, which is unchanged.
- **Proof.** vanish-check, the five heroes, 4 seeds, every battle scenario at tiers I-III: **315 of 600** battles ended
  with the losing side's hero still alive but out of sight. After the fix: **0 of 600**. bugs.mjs: a Shade alone
  against two Golems lost at 1.9 s before; now the fight runs 25 s.

### 2. Barrage threw Frost Arrow's shot away
- **Cause.** Abilities that queue a blow for a moment later (`u.later`) *replaced* the queue. Barrage cast during
  Frost Arrow's draw deleted the frost arrow.
- **Fix.** All of them add to the queue now (kits.js `pending()`, the same as kits2.js `after()` already did).
  Eleven places in kits.js:
  - Ground Pound III's second ring
  - Barrage
  - Frost Arrow
  - Fan of Knives
  - Cleave III's second spin
  - Shockwave
  - the Hook
  - Fireball
  - Frost Nova
  - Chain Lightning
  - Call Wolf

  The Cleric's own three-orb attack did the same, and is fixed too.
- **Proof.** queue-check, Archer tier II against Wildmane, 20 seeds. Frost Arrow went off **144** times and only
  **65** frost arrows were loosed. Now **131** go off and **125** are loosed. The 6 missing are fights that ended
  mid-draw.
- **The ability's name stays right.** The game tags each queued blow with the ability that made it. That now applies
  only to what the cast itself added (fireAbility), so a blow that was already waiting keeps its own ability.

### 3. Lobbed attacks counted for nobody
- **Cause.** elites.js `lob()` makes its zone with `src: null`, so the lob still lands if the thrower dies. sim.js
  `dangerTick` then hurt with that null source.
- **Fix.** The zone now carries `by: <thrower>`. dangerTick passes it as `by`, the way the game already credits a
  sourceless blow (explode's `by`). The status a lob puts on counts for the thrower too: addStatus has a new
  `credit` argument, used only when there is no source. The source itself stays null on purpose, so nothing about
  how the blow works changes (no shield-facing, blinded misses or knockback direction from the thrower).
- **The same fix for the other source-less zones.** The Seraph's notes, Cinder's rain, the Frost Queen's shattering
  images, the Elder Ent's branches, the lobbed ice in families.js, and the Goblin Bomber's fuse bombs.
- **Proof.** bugs.mjs: three Frost Shamans (they only lob) against a Paladin, 6 fights. Before, the Shamans' row
  dealt **603** while the Paladin's row took **939**. Now it is **927** dealt and **927** taken.

### 4. A side of only Saw Blades lost at once
- **Chosen fix (the simplest sound one).** The battle page won't start a side made only of traps. setupProblem says
  "A trap can't hold a side alone: add a fighter." It works like the existing "Each side needs someone" check, and
  the page shows it the same way.
- **Saw Blades can still be picked.** They can join a side that has other kinds, where they work as before. They
  never count as standing (they can't be hit), so they can't keep a beaten side alive.
- **Proof.** bugs.mjs: Saw Blades alone are refused; Saw Blades with rats are allowed.

### 5. One seed did not replay one fight
- **Cause.** Unit ids came from one counter that never reset (sim.js `NEXT_ID`), and ids feed some movement.
- **Fix.** `resetIds()` runs when a battle room is built (dungeon.js `battleRoom`, so every newBattle) and when each
  dungeon room is built. A charmed follower carried into a new room takes a fresh id there (`nextId()`), so ids
  never clash.
- **The test hook.** `AUDIT.idFrom` still works the same way: it sets the counter at the next spawn.
- **Also fixed: the Shade's shadow clone.** It picked its spin with `Math.random()` (round 15 found this, outside
  that lane). It now uses the seeded `rand()`, so batches with the Shade replay too.
- **Proof.** bugs.mjs plays a setup, then a different fight, then the same setup and seed again, with a checksum of
  every unit every frame:
  - Archer + Paladin against rats and wolves: different before, **identical** now.
  - Shade against Golems, with 17 s of shadow clones: different before, **identical** now.
  - A dungeon floor (audit-heroes `dungeon()`, the same seed twice in one process): 189.9 s and 171.1 s before,
    **184.75 s both times** now.

## Part 2: abilities that fire at the wrong time

### How it works now
- **New file: js/threat.js.** It answers two questions and changes nothing in the fight.
  - `threatened(w, u, horizon)` gives the soonest thing that will hit u within `horizon` seconds:
    - a foe in reach winding up a blow at u (the game's 'windup' move);
    - a foe in reach whose next swing is due, facing u;
    - a charge or leap whose line runs through u;
    - a shot on course to pass through u;
    - a telegraphed danger zone that u stands in.

    Like the steering out of danger zones, a wind-up or a zone is only seen once it has shown for the unit's
    reaction time (`u.react`). Anything that would land while u can't be hurt is ignored.
  - `attackers(w, a)` gives the foes on `a` right now: fighters in reach that are after it, and shooters in range
    that are after it.
- **Helpers in kits.js.**
  - `beset(w, a)`: how many foes are on a friend, plus one if a blow is about to land on it.
  - `wantedNow` / `wantedWait`: a friend's ability that is waiting on its cooldown counts as "wanted" if the friend
    would use it right now were it ready (its own score clears the bar). Old Tales, Supply Crate and Encore measure
    their worth with this. Before, they counted any cooldown over 4 s, wanted or not.
- **Dodges are checked every step.** An ability can now have a `reflex` score (only Roll and Twinfang's Dash out
  do). While it is ready it is checked every step, not only on the 0.35 s think (kits.js `kitReflex`, sim.js).
  - Why: a wind-up is often 0.25-0.4 s, so the 0.35 s think would often miss the blow.
  - It has no dice roll of its own. It still waits for the reaction time, and sleepiness still blocks it.
  - This is the only change to how often abilities are *looked at*. It may count as a new rule; see "for the
    designer" below.

### How it was measured
- **Heroes and fights.** The 15 heroes these abilities belong to, at tiers II and III. Seven of the audit-heroes
  scenarios: 1v1 against Wildmane, two Boars (telegraphed charges), the rat swarm, the melee + ranged duo, with a
  Paladin friend, with a Cleric friend, and a dungeon floor.
- **Seeds.** 12 for each battle and 4 for the dungeon: 76 fights per hero and tier. The same seeds before and after.
- **"Before"** is the game with Part 1 fixed, so the bugs don't muddy the comparison.
- **Margin** is our side's share of health left minus theirs (-100 to 100), averaged over the seven scenarios. For
  the dungeon it is the hero's health left.
- **Noise.** With 12 seeds one scenario's margin moves 10-30 points from nothing (the fights split apart after the
  first different cast). A hero's seven-scenario average moves about 5 points. Read single cells with care.

### The table
"Casts" = casts per fight, averaged over the 76 fights. "Wins" = of 76. "Margin" = mean over the seven scenarios.

| Ability (hero) | What it is for | Old trigger | New trigger | Tier | Casts | Wins | Margin |
|---|---|---|---|---|---|---|---|
| Roll (Archer) | getting out of reach of a blow about to land | a foe within 70, hitting or not | a blow, shot, charge or telegraphed hit landing within 0.3 s, checked every step; she rolls away from it (across a shot's line) | II | 1.5 -> 4.1 | 71 -> 73 | 65 -> 69 |
| | | | | III | 0.8 -> 3.0 | 70 -> 72 | 66 -> 72 |
| Dash (Twinfang) | in at a busy enemy, or out of reach | out: falling back with a foe near | out: a blow about to land as she falls back, when under 60%, or a charge or telegraphed hit coming; checked every step; away from it. "In" unchanged | II | 6.3 -> 10.2 | 63 -> 63 | 52 -> 53 |
| | | | | III | 4.5 -> 6.4 | 63 -> 64 | 59 -> 61 |
| Supply Crate (Quartermaster) | bringing round abilities the party is waiting on | a friend with two cooldowns over 4 s; never for himself | the seconds it buys, him included (the crate's own rule already counts him), with wanted abilities in full: at least one cut's worth; not with foes pressing round him | II | 0.1 -> 6.0 | 38 -> 42 | 16 -> 42 |
| | | | | III | 0.1 -> 2.1 | 53 -> 51 | 34 -> 40 |
| Barricade (Quartermaster) | blocking foes' way and shots | 2+ foes within 300 and a ranged friend, or 3+ | **put back as it was** (see below) | II | 2.8 -> 3.4 | (same hero as above) | |
| Old Tales (Grandpa) | bringing round friends' abilities | one friend in reach with two cooldowns over 4 s | the seconds it buys friends listening, wanted abilities in full: at least one story's worth | II | 0.1 -> 1.1 | 46 -> 45 | 38 -> 35 |
| | | | | III | 0.1 -> 1.0 | 55 -> 56 | 65 -> 68 |
| Entangle (Druid) | holding enemies in place | 2+ foes together near her target (mostly already in melee, still hitting) | foes on their way in (moving, not yet in reach of their target), one or more; more if they're after her | II | 7.8 -> 11.8 | 31 -> 35 | 32 -> 35 |
| | | | | III | 4.7 -> 7.6 | 49 -> 54 | 47 -> 54 |
| Encore (Bard) | an ally's ability ready again | any friend with a cooldown over 4 s (its longest reset) | a friend with an ability over 4 s that it would use now; that one is reset | II | 2.9 -> 2.4 | 60 -> 56 | 55 -> 49 |
| | | | | III | 2.1 -> 1.8 | 57 -> 56 | 50 -> 51 |
| Wind-up Drones (Engineer) | slow drones that pop on a foe | any foe within 300 | a fighter coming at her within 220, or foes standing still near her (held, or planted in a fight) | II | 6.4 -> 3.9 | 65 -> 63 | 60 -> 61 |
| | | | | III | 5.1 -> 3.2 | 61 -> 61 | 54 -> 57 |
| Spear of the Sky (Valkyrie) | flying to a hurt friend, cleansing and shielding it | a friend under 60% | as before, or a friend being hit under 80%, or one held or carrying a load of statuses; she flies to that one | II | 0.5 -> 1.2 | 39 -> 40 | 6 -> 9 |
| | | | | III | 0.7 -> 1.7 | 32 -> 34 | 13 -> 17 |
| Valkyrie's Call (Valkyrie) | bringing a fallen friend back | a downed friend | **unchanged** (see below) | II-III | 0 -> 0 | | |
| Guard (Paladin) | taking part of the blows meant for a friend | the most hurt friend under 65% with a foe looking at it; guarded the most hurt of all, summons too | a friend being hit under 80% (or with two on it under 95%); he guards that one | II | 1.1 -> 2.4 | 67 -> 65 | 63 -> 64 |
| | | | | III | 0.2 -> 0.9 | 54 -> 56 | 53 -> 56 |
| Mending Ray (Cleric) | healing a hurt friend over 4 s | a friend under 80% | as before, or a friend under 90% being hit | II | 1.5 -> 2.0 | 26 -> 27 | 13 -> 17 |
| | | | | III | 1.1 -> 0.9 | 40 -> 40 | 47 -> 47 |
| Swoop (Griffon) | flying to the friend in most trouble | a friend 130-480 away under 60% with a foe near; flew to the most hurt friend of all | a friend 130-480 away being hit under 75% (or with two on it under 90%); he flies to that one | II | 0.7 -> 1.5 | 52 -> 56 | 35 -> 43 |
| | | | | III | 0.4 -> 0.8 | 41 -> 42 | 24 -> 28 |
| Challenge (Dame) | saving the friend nearest death | a friend under 40% with a foe near | as before, or a friend being hit under 55% (or with two on it under 75%) | II | 0.2 -> 0.7 | 68 -> 71 | 50 -> 58 |
| | | | | III | 0.2 -> 0.6 | 69 -> 70 | 63 -> 68 |
| Brace (Bulwark) | striking what comes into the spear's reach | any foe within 240 after him or within 160, shooters too | a charge or leap at him, a fighter coming in (moving towards him, not yet in reach), or one in reach in front fighting him | II | 11.5 -> 8.6 | 53 -> 53 | 43 -> 45 |
| | | | | III | 11.5 -> 9.6 | 63 -> 60 | 49 -> 50 |
| Shield Wall (Bulwark) | covering friends near him; can't be moved | 3+ foes within 260 and a friend within 170 | the ones it covers being hit: 2+ fighters on friends within 150, one on a friend and one on him, 2+ on him, or a telegraphed hit or a charge about to land on any of them | II | 2.7 -> 4.3 | (same hero as above) | |
| | | | | III | 2.9 -> 4.0 | | |
| Dark Bargain (Warlock) | both him and the imp striking far faster | over 45% health, imp out, 2+ foes within 300 | over 60% health, he and the imp both shooting at his target, fight enough left (foes near with half his health or more), nothing on him, the imp not inside him (Awaken) | II | 1.5 -> 0.4 | 63 -> 64 | 56 -> 63 |
| | | | | III | 1.5 -> 0.5 | 61 -> 61 | 47 -> 54 |
| Cure (Plague Doctor) | drawing statuses out of a friend | poison + burn + chill + wet over 50, or stunned or rooted | the statuses that hurt or hold (adds bleed, curse, frozen, asleep, terrified, shackled, charmed; Wet alone no longer counts); **and the tier III bug fixed** | II | 3.3 -> 3.6 | 69 -> 69 | 67 -> 79 |
| | | | | III | 3.0 -> 2.8 | 75 -> 75 | 81 -> 91 |

### What the numbers say
- **Clearly better.**
  - Cure: +12 at II, +10 at III; the fights with a friend went from about 45 to 95.
  - Supply Crate: +26 at II, +6 at III.
  - Swoop: +8 at II.
  - Challenge: +8 and +5.
  - Dark Bargain: +7 and +7, now going off a third as often.
  - Entangle: +3 and +7, and 5 more wins at III.
  - Roll: +4 and +6, with the friend fights up most (Cleric friend at III: 55 to 75).
  - Spear of the Sky: +3 and +4.
  - Guard, Wind-up Drones, Mending Ray II, Twinfang: hold or a little better. The Drones now go off 40% less with
    results holding or a little better, which is the "fires less, at the right time" case.
- **Fire more, rightly.** The rescues (Guard, Swoop, Challenge, Spear) were waiting on health lines their friends
  rarely reached while the ability was ready. Roll goes about three times as often, because something really is
  about to hit her that often. The game's 6-7 s cooldown is now the limit, not a foe merely standing close.
- **Hold within the noise.**
  - Old Tales: -3 at II, +3 at III. It fires now (about once a fight; 0.1 before) and its result is unchanged. Its
    small worth is its numbers (4-6 s off friends' cooldowns), not its timing.
  - Mending Ray III: 0. It fires a little less; the second ray at III goes to the next most hurt friend, unchanged.
  - Brace / Shield Wall: +2 and +1. Brace now goes off a quarter less, at things actually coming at him.
- **Worse, and not explained.** Encore at II is -6. Nearly all of it is one cell, the fight with a Cleric friend
  (53 to 8, 8 wins to 4), while every other cell is within a few points; at III it is +1. It fires a little less
  (2.9 to 2.4). It may be noise, or the Cleric's "wanted" ability (Smite, the attack) being a worse pick than her
  longest cooldown (Sanctuary). The old pick isn't clearly better: at III the same fight went 27 to 45. Left as is;
  worth a look in the 2v2s.
- **Barricade: tried and put back.** The first try only threw the wall at foes still coming, never with foes already
  on him. In the rat swarm the Quartermaster then won 1 of 12 instead of 11 of 12. The wall thrown down among the
  rats already on him is what keeps him alive there. Its low worth in the audit is the recorder not counting walls.
  The old trigger stays.

### Left for the designer
- **Valkyrie's Call.** Battle mode has no downed state: heroes die outright, so there is never a fallen friend. A
  "friend about to die" trigger would need the use to do something new: heal or hold a living friend instead of
  standing up a downed one. That is a new rule, so it was left. The choices:
  - (a) a battle-mode-only version (flies to a friend under 15% and makes it untouchable for a moment, plus the same
    burst);
  - (b) a downed state in battle mode for everyone (a bigger rule; Rewind III and the Phoenix Feather would also
    start to work there);
  - (c) call the Valkyrie a party-and-dungeon hero.

  In the dungeon it works as written (a downed friend, once a room).
- **Mending Ray can't heal the Cleric.** Its text says "never herself", so that was kept. Alone she has nothing to
  mend. If she should, it's a text and rule change.
- **The reflex check is new.** Roll and Twinfang's Dash are now looked at every step while ready (with the
  reaction time), not every 0.35 s. That is the only way to dodge 0.25-0.4 s wind-ups reliably. If it counts as a
  rule, it is a one-line switch (the `reflex` entries in kits.js).
- **Worth nothing because of numbers, not timing:**
  - Old Tales' and Supply Crate's few seconds off cooldowns. They fire at the right time now, and Old Tales'
    results still don't move.
  - Twinfang loses every 1v1 against Wildmane, Dash or no Dash.
- **Encore's pick** (above) is the one result I can't account for.
- **Noise.** 12 seeds per cell gives about ±5 on a hero's average. The tournament should use more seeds, and the 2v2
  plan with a Paladin each side will show the support abilities better than these duels.

### Smaller things found
- **`node --check` misses errors here.** It passed a file with an unclosed string (`'A trap can't ...'`). Importing
  the module caught it. Checking with an import (`node -e "import('./js/battle.js')"`) is the surer test.
- **Two cases of a score and a use picking different units.** Guard went to the most hurt friend, summons included,
  not the one it scored for. Swoop flew to the most hurt friend in reach, not the beset one. Both now go to the
  friend their score picked.

## Files touched
js/:
- battle.js: fighting(), traps; setupProblem; `isTrap`
- sim.js: resetIds/nextId; dangerTick `by`; addStatus `credit`; the reflex check in step
- dungeon.js: resetIds in battleRoom and the room build; a follower's fresh id
- elites.js, families.js, foes9.js, boss-angel.js, boss-cinder.js, boss-queen.js, elderent.js: `by:` on source-less
  zones
- kits.js: `pending()`; fireAbility's tagging; the threat helpers; kitReflex; Roll, Dash, Guard, Mending Ray,
  Encore, Entangle, Cure
- kits2.js: Challenge, Swoop, Brace, Shield Wall, Old Tales, Dark Bargain, Supply Crate, Spear of the Sky, Wind-up
  Drones; the shadow clone's rand()
- threat.js: new

Also: sw.js (threat.js added to the file list by tools/build-sw.py) and tools/audit/fixes16/.

Checks after the merge with main: `node --check` on every js file clean; `tools/battles.mjs` 527 battles, 0 problems
(6 ran out of time, the same as before); `tools/preview-check.mjs` threw 0, never fired 0, not offered 0.
