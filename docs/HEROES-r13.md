# Round 13, lane H2: the 37 newer heroes against the showcase 3 answers

The designer's words: `docs/riffle-log/2026-11-22-round12.txt`, deck showcase3. One block per hero, in the log's order:
each note quoted, what was built, and the clip (`clips/showcase5/<hero>-<ability>.mp4`). What was ticked with no note is
left exactly as it was. Ability ids stay the same when a slot gets a new ability (saves keep their bought nodes); the
name, words and behaviour change.

Shared pieces (kits2.js "round 13 (lane H2): shared pieces"): `onUnit` hangs a timed hook on any unit (kits.js
hooksOf reads `u.h2`: one marked line), which is how each new effect below is built, behind one function each:
`whirl`, `dirty`, `targeted`, `tracked`, `trapped`, `spin`, `ward`, `haste`, `rage`, `weaken`; `summon` makes a
summon on the maker's side whose blows are a share of the maker's; `flung` watches a body sent flying (slams into a
wall, ploughs into others). Marked hooks outside the lane: render.js (a buff's or a summon's own wash, a buff's
`border` = protection, `style.flip` mirrors a sprite), fxkit.js (`style.backhand` / `flip` swing the arc the other
way, `style.reach0` where a stab starts), parts.js (`style.backhand` arm, `style.straight` stabs), preview-sim.js
(scenes for the new traits), bestiary.js (names of the new buffs).

## New statuses asked for (for the lead / the statuses lane)
Built as each hero's own effect behind one function in kits2.js, so they can be lifted into statuses.js:
- **Whirled** (Griffon: "makes them take extra knock-back from all sources... Burst effect of whirled will have them
  boosted around randomly 3 times in a short duration"): `whirl()`. Build-up 0-100, drains 12/s; shoves taken x(1 +
  fill); burst: stunned 0.95 s and flung at random three times; 3 s immune after. Look: white wind curls round the
  feet (fx2 `whirled`), a whirlwind at the burst (`whirlBurst`).
- **Dirty** (Digger: "Acts as a 1 time shield but attack speed is slow until it's cleared... immune to poison and fire
  until removed"): `dirty()`.
- **Targeted** (Marksman: "Shows crosshair on them. Movement abilities are limited and they take additional damage.
  Bullets pierce through targeted entities"; the Pirate's Point Blank too): `targeted()`.
- **Tracked** (Falconer: "stops them from going invisible/un targetable, underground. All attacks do additional fixed
  damage to target"): `tracked()`.
- **Trapped** (Trapper: "Target can't turn or move but can't use abilities and attack(straight)"): `trapped()`.
- **Spun** (Monk, unnamed by the designer: "makes entities turn very slowly. Burst effect: makes them walk in the
  direction they are facing for a bit very quickly. Can't attack"): `spin()`.
- **Warded** (Alchemist: "What's a good name for a protection status effect?"): my answer, Warded: `ward()`, a shield
  of N damage shown as a pale blue border (the border means protection).
- **Weakened** (Shade's Blackout: "aura should apply weakness debuff (which needs visual effects)"): `weaken()`, a buff
  (deals 30% less) with a grey wash and grey chevrons sinking off the body.
- **Shackled** (Old Guard's Pommel Strike note: "target can't do basic attacks, ability cooldowns are set back 50%...
  the shackled ability goes to someone else. Maybe the executioner"): not built; it waits for that hero (also the deck
  note's Warden: "uses a lot of shackles and restraints").
- Bleeding, Sleepy, Confused, Fear: the statuses lane's (merged); used through kits.js addStatus.

## The heroes

### Old Guard
- Trait: "Trait should be last stand. When last one in party gets a long unstoppable and haste buff, all abilities are
  reset." -> **Last Stand** (id lastStand): once a room, when the last of his side falls: Unstoppable (its gold border)
  and haste for 10 s, every cooldown reset, a gold burst. Book scene added.
- "Should have a parry ability. The next attack is blocked and deflected back if it was a projectile, melee just go
  back to target. When leveled up gets 2 charges. Maybe instead of pommel strike" -> **Parry** in Pommel Strike's slot
  (id pommelStrike): 4 s on guard (the greatsword drawn across him, a glint running along it); the next blow is caught
  and its force goes back into the striker, the next shot flies back at its shooter. I one, II two, III twice as hard.
  Clip: oldguard-pommelStrike.
- Pommel Strike's note ("Shackled status effect"): goes with the shackled idea to a later hero (above).
- Rally: "Get a haste boost when leveled up. Effect remains for a little bit." -> II: haste (30% faster moves and
  blows) and the whole rally lasts 8 s (was 5). Clip: oldguard-rallyCry.

### Dame
- Leaf sword: "Should swipe the opposite way." -> `style.backhand`: the arm and the arc both go the other way.
  Clip: dame-attack.
- Challenge: "Maybe it is a dash to nearest ally about to die, pushes them away and heals them slightly, the nearest
  enemy is taunted. No challenge status." -> rebuilt: she bounds to the friend nearest death, shoves them clear (gold
  chevrons the way they go), heals them 10% (II 20%), and the nearest enemy (III: all near) must fight her for 4 s (a
  red "!" pops over it). No duel mark. Clip: dame-challenge (the bench pins the friend in place, so the shove itself
  shows only in a real fight).
