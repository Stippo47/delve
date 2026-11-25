# Round 19, lane rogue19: the Bandit, the Shade, the Monk, the Cultist

The designer's notes on 0.19's heroes (`docs/riffle-log/2026-11-25-v19-v21-partial.txt`), every note on these four,
and the two shared rules they asked for (Disarmed; incorporeal). Code: `js/kits2.js` (the abilities, traits, attacks),
`js/sim.js` (disarm, incorporeal, Spun's turning), `js/tags.js` (who is armed, what is a weapon ability),
`js/statuses.js` (DISARMED, ANTIHEAL, SPUN), `js/parts.js` (the weapon taken out of the hand), `js/fx-rogue19.js` (the
looks). Clips: `docs/clips/rogue19/` (git-ignored; `node tools/rogue19/clips.mjs` records them again).

## New rules (shared)

### Disarmed (a status, `sim.js disarm`, `statuses.js DISARMED`)
The designer: "Disarm ability: makes it so an entity can't use their weapon (and weapon is hidden) for a bit (as well as
any ability attached to the weapon). Innate attacks built into the body aren't stopped. Can't disarm a slime."
- **Who can be**: what holds a weapon, `tags.js ARMED`: 35 heroes (everyone with a blade, hammer, spear, bow, gun,
  sling, chain...) and the armed enemies (skeletons, goblins, orcs, lizardmen, bandits, the poacher, the jackal, the
  smith, the heralds, the fallen angel, the chieftain...). Not: beasts, slimes, plants, spirits, constructs, the Monk,
  the casters (their spells aren't weapons), and three enemies whose art doesn't read right with the weapon taken out
  (bandit brute, knife bandit, bandit chief) or placeholders drawn whole (devil, ogre, angel...).
- **What stops**: its weapon blows (sim.js holds its attack clock; a caster's spells go on: the Cultist, disarmed, casts
  his bolt even up close), its abilities done with the weapon (`tags.js WEAPON_ABILITIES`, 46 of the heroes' abilities,
  blocked through the same `abilityBlocked` gate Silenced uses), an enemy's weapon moves (`MOVE_TAGS.weapon`: cut, axe,
  javelin, spear, trident, whip, the bowman's volley) and its def.ability when it is a weapon's (a barrage, a backstab, a
  knife dash; not a pounce). Bites, claws, a headbutt, a shield, a kick, a spell go on.
- **Bosses** 40% of the time (as stuns). A cleanse doesn't give a weapon back.
- **What it does meanwhile** (after the clip check: a disarmed orc stood frozen): a fighter with no kit and no brain of
  its own goes after its weapon, where it landed (60-85 from it, clear of its body), and stands over it, fumbling, till
  it has it back; then the weapon on the floor fades and is in its hand again. Heroes (their kits) fight on with what
  isn't the weapon.
- **Look**: the weapon is taken out of the hand (parts.js reads each art's arms: the hand's shapes stay, the rest is the
  weapon; the bare arm is drawn instead) and it spins up out of the hand, lands a little way off and lies there (its own
  picture: the weapon alone, parts.js `drawGear`) till the owner has it back. Checked on every armed art:
  `docs/clips/rogue19/bare-*.png` (left: as drawn, right: disarmed).
- **The Dame's Disarm** is folded in: what it flicks is Disarmed (3 s, II 4 s); a beast with no weapon keeps the old
  effect (its blows 50% softer for 5 s), so the ability still does something against wolves. (melee19 owns the Dame:
  only this ability's two lines and its words were touched.)

### Incorporeal (a state, `sim.js incorporeal`)
The designer on Blackout: "No physical attack can hit her but soul can. In this form she has no collision. Ghost should
also be able to go incorporeal."
- A blow or a shot whose damage type (tags.js `hitType`) is sharp or blunt passes through (a streak goes on out the far
  side, a few wisps; no number). Magic lands (spells, soul fire, holy light), and so does what already ticks on it.
- It walks through bodies and bodies through it (physics `passUntil`).
- Look: a little see-through, smoke curling off it (the Shade's dark, a ghost's pale mist).
- **The Ghost** (enemies.js `incorp`): when a foe is on it in reach of a blow, or it has just been hurt, it goes
  incorporeal for 2.2 s, every 6-8 s. Its touch still works meanwhile (a spirit's touch).

### Anti-heal (a status, `statuses.js ANTIHEAL`)
Curse cuts healing too, but Curse is a build-up that makes blows land harder and bursts into a Hex: not what "anti
heal" asks for. So Anti-heal is its own timer: heals on it do half. Look: dull grey-green healing crosses, cracked
through with violet, sinking off the body (healing's bright crosses rise).

### Spun (changed: the Monk's status)
The designer, in Palm Strike's note: "Burst effect is dazed. Has a hard time controlling turn, overshoots. Like has low
acceleration but high max turn speed. Slippery but for turning."
- **Call (the lane's, kept after the round 19 check; say if wrong)**: this is what Spun should do to whoever has it (the paragraph is about Palm Strike's status:
  its burst, then how the spun one turns), not the Monk's own turning. (The brief read it as the Monk's turning; his own
  turning is the plain hero turn, 5.5 rad/s, and turns crisply: nothing to fix there.) Say if it was meant for him.
- While Spun its turning has momentum (sim.js `updateFacing`, `u.slipF`): a weak push, a high top speed, slow to damp,
  so it swings past where it meant to face and back; more so as it fills.
- Full up it is **Dazed**: stunned 1.3 s (bosses 0.5 s), stars wheeling over its head (it used to march off).

## The Bandit

| note | what changed |
|---|---|
| Stick 'Em Up: "Don't like" | **Hostage** (the lane's rework, id kept): he grabs the nearest enemy that isn't too big and holds it in front of him, the cutlass at its throat; it can't act, and every blow and shot that comes at his front lands on it instead. Both his hands are busy (no cuts while he holds it). II 4.5 s (I 3 s); III when he lets go he shoves it into its friends, disarmed. Why: a dirty move only a thief makes, it saves his skin (he is a skirmisher with 105 health), it is the one that handles shooters (the old one was the third "can't attack" on his kit), and nobody else has it. |
| Dirty Trick: "Disarms?" | Yes: the punch Disarms (2.5 s, II 3 s). |
| "Alternating slash visual" | The three cuts go forehand, backhand, forehand: each crescent sweeps the way the cutlass goes (fxkit swing `dir`), and the arm swings back for the second (parts.js `anim.back`). |
| "that's not a 'kick'. Maybe punch with other hand" | His free hand punches (parts.js `anim.hand`: the left arm jabs), 1.4x (the kick was 1.2x); a flash, shock streaks and stars where it lands, on the body as it flies (no fist drawn floating). |
| "Slightly slower attack speed" | The cuts 0.17 s apart (were 0.11); the punch 0.12 s after. |
| Bolas: "Should not make unique effect. Should trap like a hunters trap. Stops movement and turning." | It puts on **Trapped** (the Trapper's status: can't move, turn or use an ability; strikes straight ahead): 1.6 s, III 2.5 s. The Tripped knock-down and slow are gone. |
| "Effect should look like a ring with 3 triangles pointing inwards spread out" | The cord pulled tight in a ring round its feet, three triangular iron weights on it a third of the way round from each other, points in; it snaps tight as it lands and jerks as the trapped one strains. The bolas in flight is the same three weights on cords. |
| "No disarm" | Gone (III was "drops its weapon"). |
| Trait: "Ability dash through 3 enemies in a chain disarming and dealing damage." | **Light Fingers** (Snatch is kept in the code, unused): every 9 s, with two or more enemies near, he dashes through up to three in a chain (dashes.js draw cuts, one straight after another, each cut landing as the cutlass passes: 1.1x his blow), and each one cut is Disarmed 2.5 s. An armed one first. |

## The Shade

| note | what changed |
|---|---|
| "Might have to lower base hp to balance her." | Measured first: before, she sat in her band (9.79 rooms, skirmishers 9.63); with the new kit she was well above it (12.1 rooms at I), so her health is 86 (was 100) and the new pieces were trimmed (below). |
| Attack: "still holding the blades crossed. Should keep them to the sides." | Both hands turned out (heroes2 `style.sides`, parts.js): the daggers held at her sides pointing ahead, not across her. Her clones the same. |
| Blackout: "It follows them." | The dark is centred on her the whole time it lasts. |
| "No physical attack can hit her but soul can. In this form she has no collision." | While it lasts she is **incorporeal** (above), in her shadow form (a dark wash, smoke off her). III as before: she is also unseen. |
| "Ghost should also be able to go incorporeal." | Above. |
| Shadow Clones: "Don't like. They should move identical to how she would." | They run her brain: the plain fighters' brain, her speed, turning and weight, her paired stab (no more circling at 1.6x through walls). |
| "Also be in the same shadow form as she is in blackout." | Her Blackout form: dark, incorporeal, through bodies. A spell breaks them. Their blows 0.4x hers (0.55 before: blades no longer break them); III lasts 8 s (was 10). |
| Shadow Walk: "...Changing it again. Keep this ability saved though." | The round 18 blink chain is kept as `shadowWalkChain` in kits2.js (on no kit). |
| "For 4 seconds she will disappear completely. Blinking in and out of existence around a random enemy hitting them then vanishing. Upgrades boost duration." | Gone (not drawn, nobody's target, untouchable) for 4 s (II 4.5 s, III 5 s); every 0.6 s she blinks into being beside a random enemy near where she last was (puffs of shadow in and out), in her shadow form for a quarter second (a spell can catch her then, a blade can't), stabs it with both daggers (0.35x her blow each) and is gone again; at the end she stays out beside the last. The old II curse is gone (the tiers are its length now). |

## The Monk

| note | what changed |
|---|---|
| Fists: "Don't like visual." | A fist's pow where it lands: a white flash, a starburst of inked spikes (saffron and white) thrown the way the blow goes. No soft dots. |
| "Has a 3 part combo with the last 1 dealing more damage, knockback and spun." | Every third blow in a run (no more than 1.6 s apart): 1.5x, thrown far back (520), Spun (35); swung bigger, a big pow and a gold spiral. The first two knock it back only a little (50) so the third can land. |
| Flurry: "He doesn't move forward. Don't lock positions." | He takes a step in with every punch, and each punch shoves it a little back: the two travel together; nothing is pinned (it set the facing and pushed both every punch before). |
| "Final hit needs a short delay." | The last is drawn back first and lands 0.24 s after the one before (was 0.075); 0.9x (the others 0.6x). |
| "Upgrades also applied weakness." | II and III: the last punch leaves it Weakened 4 s. |
| "Don't like visual" | The same pows, alternating hands, the last a big one with a dust ring. |
| Inner Peace: "Doesnt look like he's blocking physical or ranged attacks." | Now he does block them: every physical blow or shot that reaches him is stopped (no damage), shown as a curved plate of gold light flaring where it met him, sparks thrown back; the striker is thrown back as before, shots fly back as before. Spells land 30% softer. A gold protection border on him while it lasts. Shorter, since nothing physical gets through: 2 s (II 3 s; were 2.5 / 4). |
| Palm Strike: "Don't like visual. Hand should turn large and flat. And push forward." | His open hand, grown great and flat (fingers together, pointing ahead), slides out in front of him, force streaks behind it. |
| "Smaller range." | A cone in front (was all round him), reach u.r + 62 (III + 80; were 80 / 110). |
| "Burst effect is dazed..." | Spun's burst is Dazed; Spun's turning is slippery (above). |

## The Cultist

| note | what changed |
|---|---|
| Shadow bolt: "Bolt instead applies anti heal." | The bolt leaves **Anti-heal** 3 s (it burst the bleeding before). The lane's call: it also draws a little blood (bleed 12), so Sacrifice has bleeding foes to run to (the dagger only bleeds up close, and he keeps away); measured: without it he lost 1.1 rooms more. The close-up dagger swipe still bleeds. Bursting the bleeding was the engine of his damage, so his own numbers went up to hold his strength: health 88 (78), blow 15 (10), a bolt every 1.1 s (1.25). |
| Blood Pact: "Don't like look of status effect" | Its own state, no longer Rage's red steam: a dark crimson wash and drops of blood rising slowly off the bound, a cut flashing across each as it is bound. |
| "Should also give allies bleed" | Every friend bound bleeds: a token cut, 18 (he 28); 35 / 45 cost the party 1.8 rooms. |
| Ritual Circle: "Puts circle around centred around 1 entity that is at low hp. If they don't escape after x seconds they will be sacrificed, lowering all of his cooldowns, healing himself." | Round the enemy nearest death (under 55%; one held in place first), a skull over it counting down. Still inside after 3 s (III 2.4 s, wider): sacrificed (killed; a boss, major or mini-boss loses a fifth of its health), his cooldowns come 4 s nearer, he heals 15%. |
| "Also slowly applies bleed to all entities within it at higher levels. Doesnt lock anyone in." | II: everything in the circle, either side, bleeds slowly (6 every 0.3 s). Nothing is held in or dragged (the old II drag and III lock are gone). |
| Sacrifice: "Dashes to every enemy who has bleed, bursting them." | He runs round each bleeding enemy in turn (dashes.js hooks, one straight after another, nearest first, up to 6): a cut (0.5x) and its bleeding bursts at once (a Haemorrhage); the blood of each heals him 6% (the old Sacrifice healed him 15%). |
| "Higher levels applies antiheal to everyone hit and gives him more damage buff status effect for each person hit. Temporary." | II: each one cut has Anti-heal 4 s. III: each one cut makes him 10% stronger for 6 s (it adds up, to 60%). |
| Trait Blood Rite: "When ally is about to die (very low hp) he will dash to them killing them instantly but resets all of his cooldowns" | A friend under 10% with something on it (a foe at it or a blow coming: about to die), within 420, and an ability of his more than 3 s from ready: he darts to it and takes the last of its life; every cooldown is ready again. Once every 25 s. (Measured: under 12% with nothing on it, it cost the party about a room.) |

**The call on downed heroes** (round 18 made them): "killing" a hero friend is what reaching 0 does to anyone, so it
goes **down**, as at 0 anywhere. In a dungeon it is downed as if it had fallen (it gets up as the downed do); in a
battle it can only be raised by a reviving ability and bleeds out after 15 s. He never goes for one already down
(nobody finishes the downed), a summon, the wagon, or one of the Mob's bodies.

## Numbers
`tools/ability-worth.mjs` (30 parties a hero, each played with all on and with each ability off; tier I at rank 0, tier
III at rank 1), before (tools/rogue19/before/) and after the last tuning (tools/rogue19/final/ for the Shade and the
Monk, tools/rogue19/final2/ for the Bandit and the Cultist). "Rooms" is what the hero's parties clear with everything
on, the same parties and seeds both times; the noise is about +-0.5.

| hero | tier I rooms, before -> after | tier III rooms, before -> after | what moved it, and what was done |
|---|---|---|---|
| Bandit | 9.97 -> 9.27 | 6.47 -> 5.90 | Snatch (every fourth blow) was worth more than the first Light Fingers: it went to every 9 s and 1.1x, the punch to 1.4x. Still a little under; he was the weakest skirmisher before too (balance.mjs tier I: 8.78 rooms, skirmishers 9.63; after, in a run with him leading: 0.29 under the average, was 1.78). |
| Shade | 10.30 -> 10.67 | 6.57 -> 6.80 | The first pass was 12.13 / 9.93 (Shadow Walk at 0.7x a stab, clones unbreakable by blades): health 100 -> 86 (the designer's note), Shadow Walk 0.35x and 4 / 4.5 / 5 s, clones 0.4x and 8 s at III. balance.mjs still has her above her band (tier I +0.63, tier III +1.82 against that run's average; she goes down half as often): the next trim if the designer agrees is her health again. |
| Monk | 9.10 -> 9.67 | 6.40 -> 6.70 | The first pass was 10.90 / 7.57 (combo 1.8x, Flurry's last 1.2x, Inner Peace blocking everything for 2.5 / 4 s): combo 1.5x, last punch 0.9x, Inner Peace 2 / 3 s. |
| Cultist | 11.63 -> 10.90 | 7.40 -> 7.00 | The first pass was 7.07 / 4.60: the bolt's burst was most of his damage, Blood Pact's 35 bleed on friends cost 1.8 rooms, Blood Rite at 12% cost about one. Now: health 88, blow 15, a bolt every 1.1 s, the bolt bleeds 12, the Pact's cut 18 / 28, Blood Rite only with something on the friend, Sacrifice's blood heals 6% a cut. |

Per ability (worth in rooms, its share of the hero's damage), tier I / tier III, after:
- Bandit: Bolas +0.10 / +0.10 (6%), Dirty Trick -1.37 / +0.13 (23-25%), Hostage -0.87 / +0.57; Light Fingers 24% of his damage (balance.mjs).
- Shade: Shadow Walk +1.47 / +1.20 (20-22%), Blackout +0.50 / +0.80, Shadow Clones +0.77 / +0.83.
- Monk: Flurry +0.60 / +0.03 (25-34%), Palm Strike -0.77 / +0.33 (10%), Inner Peace +0.87 / +2.03.
- Cultist: Blood Pact -1.63 / +0.50, Ritual Circle +1.47 / +0.67, Sacrifice +1.13 / -0.13.
(Single abilities swing +-0.5 to 1 run to run; the hero's total is the steadier number.)

Checks: `node tools/battles.mjs` 528 battles, 0 problems; `node tools/preview-check.mjs` threw 0, never fired 0, not
offered 0 (new: Disarmed and Anti-heal have status previews; Light Fingers and Blood Rite trait previews; the Sacrifice
stage has a Twinfang and a Wildmane whose cuts bleed the foes, `carry` in preview-sim.js; an old unused `lightFingers`
trait stage, left from an earlier Bandit, was taken out: it had the same name and won).

## Tools
- `tools/rogue19/clips.mjs`: the clips. `tools/rogue19/sheet.sh`: a clip's frames as one sheet, for checking by eye.
- `tools/rogue19/bare-board.mjs`: every art with its weapon and disarmed, side by side (`--hand 1`: the weapon hand only).
- `tools/rogue19/worth-patch.mjs`: ability-worth with a trait switched off (how Blood Rite's cost was found).

## Clips (docs/clips/rogue19/, git-ignored)
- `bandit-bolas.mp4`
- `bandit-dirtyTrick.mp4`
- `bandit-hostage.mp4`
- `bandit-lightFingers.mp4`
- `cultist-attack.mp4`
- `cultist-bloodPact.mp4`
- `cultist-bloodRite.mp4`
- `cultist-ritualCircle.mp4`
- `cultist-sacrifice.mp4`
- `dame-disarm.mp4`
- `ghost-incorporeal.mp4`
- `monk-attack.mp4`
- `monk-flurry.mp4`
- `monk-innerPeace.mp4`
- `monk-palmStrike.mp4`
- `shade-attack.mp4`
- `shade-blackout.mp4`
- `shade-clones.mp4`
- `shade-shadowWalk.mp4`
- `bare-*.png`: the weapon-out boards (left as drawn, right disarmed).

## The clip check (round 19, after the first send-back)
An independent frame-by-frame check found notes the clips didn't show. What was changed, and where each note can be
seen now (clip, time; all in docs/clips/rogue19/, checked at 8-30 fps, zoomed; `tools/rogue19/sheet.sh` stamps the time):
- Disarmed foes stood frozen: a fighter with no kit now goes after its weapon, which lands clear, to its side (60-85 off)
  and lies on the floor till it is back (`dame-disarm` 0.77 s the cleaver flies, 0.93-4.6 s on the floor, the orc walks to
  it; 4.77 s back in its hand).
- Bolas ring: thicker cord, bigger weights (`bandit-bolas` 1.05-2.9 s: the ring round the skeleton, three weights in).
- Dirty Trick: the clip is staged on one orc (no crowd, no other swings); cuts forehand 0.60 s, backhand 0.80 s,
  forehand 1.00 s; his free arm drawn back and driven in, whoosh lines from his free side to the impact (1.25-1.30 s);
  the cleaver spins away 1.35 s and lies on the floor 1.5-2.0 s, the orc flung into the goblin.
- Hostage: the cutlass drawn across its throat with guard and grip, his hands busy (no swings while he holds it); an
  arrow lands on the goblin (`bandit-hostage` 1.9-2.5 s).
- Ghost: pass-through streaks bolder and dark; it stays incorporeal 3.2 s in the clip (`ghost-incorporeal` 1.75-1.87 s
  and 3.40-3.53 s: the Paladin's swing goes through, streaks out the far side, no number, no hit star).
- Monk: fixed camera; jabs 0.45 s and 1.08 s, the third at 1.45 s throws the goblin far back, Spun's spiral over its head
  at 1.9 s (`monk-attack`); Flurry walks forward a step a punch 0.60-1.10 s (he moves up the frame against the floor),
  the last punch late and big at 1.13-1.27 s (`monk-flurry`); Inner Peace's gold plates bolder and longer
  (`monk-innerPeace` 0.73, 1.60, 2.60 s); its border lasts its 3 s (II) and goes, as it should.
- Sacrifice: each burst is a ring of thrown blood drops and a flash on the one cut (`cultist-sacrifice`); a burst is a
  Haemorrhage (a third of what it has left), not a kill, so foes still stand at the end (the note says "bursting them").
- Blood Rite: his dart is a crimson smear down the floor (`cultist-bloodRite` 1.0-1.3 s); the camera stays on the downed
  Paladin. The "ring drifting to the orcs" was the camera following the Cultist: the downed hero never moves (checked
  headless: tools/rogue19/rite-dbg.mjs, the Paladin at 637,492 the whole time).
- Anti-heal's crosses darker and duller (`cultist-attack`).
- Not this lane's: the pink crescents near the Shade (2.6 s) and through the Monk (palmStrike) are enemies' swings and
  dashes (enemy arcs are warm-tinted); the white flash and hit star are the game's old hit look.
- Call, kept (the coordinator agreed): the Palm Strike turning note is read as Spun's effect on the victim (above).
