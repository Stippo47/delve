# Cooldowns that run while the effect is still on (balance audit, round 16, lane "cooldowns")

**Measure and diagnose only.** Nothing in the game's rules or numbers was changed. The proposals at the end are
proposals; the numbers under them come from trying each rule in the test runner, not in the game.

The designer: "activated abilities that persist for a while / state changes are constantly active, which points to the
cooldowns growing while in that state, like a farmer's hay bale: as soon as they get off they are ready to cast it
again, or the Thor-like hero. Their cooldowns should only start charging once they have exited that state or have the
ability's average duration taken into account."

## The short of it

- **Confirmed.** An ability's cooldown starts the moment it is cast and runs down the whole time its effect is on
  (js/kits.js `fireAbility` sets it; js/sim.js `step` counts it down every tick, whatever the hero is doing). Most
  lasting abilities refuse to be cast again while their effect is on, so the cooldown just runs out underneath it.
- **The Thor-like hero is the Warhelm (warhelm), Storm Born (warHorn).** At tier II his cooldown is 8.8s and the form
  lasts 9s: the ability is ready 0.2s *before* he leaves the form, every time (100% of exits). At tier III it is ready
  1.2s before. He goes straight back in about a second later. **He is in Storm Born 81% of the fight** at tiers II and III.
- **The hay bale is the Haymaker (haymaker), Hay Bale (forkCharge).** At tier III the cooldown (6.4s) and the ride
  (up to 7s) are nearly the same: half the time it is ready when he drops off, and the median time left is 0.2s.
  **He is on the bale 72% of the fight** at tier III (49% at II, 27% at I).
- **It is a tier II and III problem.** At tier I almost every lasting ability still has 7 to 12s of cooldown left when
  its effect ends. Tiers II and III take 10% off a cooldown per tier, and the skill web's ability haste and cooldown
  nodes take off up to half again, so cooldowns roughly halve (Storm Born: 16s base, 16.4s at I, 8.8s at II, 7.8s at
  III) while many effects get *longer* at II (Storm Born 6s to 9s, Turn 10s to 14s, Focus 5/7/9s).
- **17 abilities that put the hero himself into a state are flagged**, and about 20 more that leave something in the
  world (walls, pools, traps, turrets, summons). The worst of those are near-permanent: Pyromancer's burning patches
  92%, Earth Mage's stone wall 85%, Alchemist's brew pools 85%, Engineer's tinkered machines 88%.
- **Recommended: (a), the cooldown starts when the effect ends** (details and numbers below). It does what the
  designer asked, handles effects that end early fairly, and also stops the zones and walls that are cast again on
  top of the last one. It costs the affected heroes about 5 to 12% of their damage at tiers II/III (up to 20%), which
  may want small cooldown trims afterwards; that is a design call.

## How the rule works today

1. Cast: `k.cd[id] = cooldownOf(u, ab)` (js/kits.js `fireAbility`).
2. Every tick: `u.kit.cd[k] -= dt * ...` (js/sim.js `step`), in every state.
3. `kitThink` won't pick a new ability while `u.act` or `u.forcedGoal` is set (so a ride, a channel or a leap blocks
   other casts), but the cooldown keeps running.
4. Most lasting abilities have their own "not while it is on" check in `score()` (Storm Born `!u.kit.storm`, Hay Bale
   "no bale of mine alive", Turn `!u.kit.wolfUntil`, Focus, Falcon, Awaken...). That is why the cooldown is wasted: it
   can't be used, so it just sits ready.
5. A few don't have that check, and are cast again *on top of* the last one while it is still there (the new one
   refreshes or adds to the old): Pyromancer's Fireball patches (recast while up 87% of the time), Earth Mage's Stone
   Wall at III (71%), Brew Pools at III (57%), Jaw Trap at III (59%), War Song (72%), Raise Dead (50-67%), Rally and
   Rage at III (about a third).

## How it was measured

Battle mode, headless. Every hero (59), tiers I, II and III (heroes.js `tierBuild`: the shells, no trinkets), three
fights each, 6 seeds:

- **duel**: the hero alone against a brute (an elite brute from tier II).
- **group**: alone against three skeletons and a skeleton archer (elite skeletons at III).
- **party**: the hero with a Paladin and a Cleric (a Bulwark and a Druid for those two) against four skeletons, two
  archers and a brute (elites from II/III).

At every cast the runner looks at the world just before and just after the ability runs, and again around every later
piece of it (a thrown flask landing, a zone's tick, a delayed spawn: js/fxtag.js already runs each piece tagged with
its ability; one audit hook there reports them). Whatever is new and lasting is followed until it ends: a buff, an act
(ride, channel), a changed body (form), the hero's own timers and flags, a summon, a zone, a wall, a trap, a buff or
heal-over-time on a friend, a debuff on an enemy. When it ends, the cooldown left is noted. Leftover references that
never clear (the spin pose, the guard's link...) were checked in the code and ignored (tools/audit/cooldowns/classes.mjs).

Numbers in the tables: **cooldown at cast / median effect length / median cooldown left when it ends / share of ends
where it is already ready / uptime** (the share of the time the hero is standing that the effect is on; overlapping
casts count once). "Cast again while it was still up" counts as ready at that moment.

## The flagged abilities, at a glance

Tier II and III, from 12-seed runs (3,564 fights for the 33 heroes with flagged abilities). "Ready at end" is the share
of effects that end with the ability already off cooldown (0s left).

| Hero | Ability | What lasts | Tier | Cooldown | Effect | Left at end | Ready at end | Uptime | Can he attack / cast during it? |
|---|---|---|---|---|---|---|---|---|---|
| Warhelm (warhelm) | Storm Born (warHorn) | form: hammer circles, he punches | II / III | 8.8 / 7.8 | 9.0 / 9.0 | 0 / 0 | 100% / 100% | **81% / 81%** | yes: ~9 punches and 1.5 other casts per form |
| Haymaker (haymaker) | Hay Bale (forkCharge) | rides the bale | II / III | 7.2 / 6.4 | 3.4 / 6.2 | 3.8 / 0.2 | 0% / 50% | **49% / 72%** | no (on the bale: no attacks, no casts) |
| Berserker (berserker) | Whirl (whirl) | spinning buff | II / III | 6.6 / 5.8 | 5.0 / 5.0 | 1.6 / 0.8 | 0% / 0% | **70% / 76%** | yes (the whirl is his attack) |
| Gladiator (gladiator) | Arena (showboat) | ring, one on one | II / III | 7.7 / 6.8 | 5.0 / 5.0 | 2.7 / 1.8 | 0% / 0% | **54% / 64%** | yes |
| Alchemist (alchemist) | Elixir (elixir) | haste/rage/ward on whoever it hits | II | 6.6 | 5.0 | 1.6 | 0% | **67%** (self) | yes |
| Griffon (griffon) | Wing Guard (wingShield) | 25% less, strikers blasted | II / III | 7.2 / 6.4 | 4.0 / 4.0 | 3.1 / 2.3 | 0% / 0% | 49% / 56% | yes |
| Bulwark (bulwark) | Brace (brace) | spear set | II / III | 5.5 / 4.9 | 3.0 / 3.0 | 2.5 / 1.9 | 0% / 0% | 51% / 54% | barely (1-2 attacks) |
| Samurai (samurai) | Focus (focus) | parrying guard | II / III | 6.6 / 5.8 | 7.0 / 9.0 | 0 / 0 | 100% / 100% | 49% / 54% | yes |
| Old Guard (oldguard) | Parry (pommelStrike) | next blow caught | III | 4.4 | 3.5 | 1.0 | 0% | 49% | yes |
| The Mob (mob) | Pile On (pileOn) | all four hold one down | III | 4.9 | 3.3 | 1.6 | 0% | 48% | no (holding it) |
| Wildmane (wildmane) | Rage (rage) | faster, tougher | III | 5.8 | 7.1 | 0 | 100% | 48% | yes |
| Old Guard (oldguard) | Rally (rallyCry) | haste, stand firm | III | 7.3 | 8.0 | 0 | 92% | 43% | yes |
| Werewolf (werewolf) | Turn (turnWolf) | wolf form | II / III | 12.1 / 10.7 | 14.0 / 14.0 | 0 / 0 | 100% / 96% | 33% / 39% | yes (as the wolf) |
| Tower (tower) | Hold the Line (holdTheLine) | planted shield | III | 5.8 | 6.0 | 0 | 91% | 36% | yes |
| Enchantress (enchantress) | Sweetheart (sweetheart) | the beloved | II / III | 7.7 / 6.8 | 8.0 / 8.0 | 0 / 0 | 100% / 100% | 12% / 20% | yes |
| Bard (bard) | War Song (warSong) | attack speed | II / III | 6.6 / 5.8 | 6.6 / 6.2 | 0 / 0 | 100% / 100% | 20% / 18% | yes |
| Druid (druid) | Rejuvenate (rejuvenate) | heal over time | II / III | 5.0 / 4.4 | 6.0 / 6.0 | 0 / 0 | 100% / 100% | 13% / 17% | yes |

Things left in the world (the effect is out there, the hero is free):

| Hero | Ability | What lasts | Tier | Cooldown | Effect | Ready at end | Uptime |
|---|---|---|---|---|---|---|---|
| Pyromancer (pyromancer) | Fireball (fireball) | burning patch | II / III | 3.8 / 3.4 | 4.0 / 3.7 (cut by the next cast) | 100% / 100% | **93% / 91%** |
| Earth Mage (earthMage) | Stone Wall (stoneWall) | wall | II / III | 8.2 / 7.3 | 8.0 / 7.3 | 0% / 100% | **84% / 85%** |
| Alchemist (alchemist) | Brew Pools (acidFlask) | pools | II / III | 5.0 / 4.4 | 4.8 / 5.3 | 0% / 100% | **77% / 85%** |
| Engineer (engineer) | Tinker (tinker) | torcher / tesla / snow mortar | II / III | 8.8 / 7.8 | 11.6 / 12.0 | 61% / 75% | **83% / 88%** |
| Trapper (trapper) | Jaw Trap (jawTrap) | traps on the floor (up to 3) | III | 4.4 | 4.8 | 64% | **80%** |
| Engineer (engineer) | Wind-up Drones (shockMine) | drones | II / III | 6.6 / 5.8 | 4.2 / 4.5 | 21% / 28% | 66% / 74% |
| Ninja (ninja) | Caltrops (caltrops) | caltrops patch | II / III | 6.6 / 5.8 | 7.0 / 7.0 | 100% / 100% | 71% / 66% |
| Crossbowman (crossbowman) | Pavise (pavise) | standing shield | II / III | 7.2 / 6.4 | 9.4 / 10.0 | 71% / 93% | 70% / 71% |
| Shade (shade) | Shadow Clones (deathMark) | clones | III | 6.8 | 4.5 | 25% | 61% |
| Enchantress (enchantress) | Heartstring (heartstring) | string tied to an enemy | III | 6.4 | 6.0 | 0% | 58% |
| Clockmaker (clockwork) | Slow Time (timeBubble) | bubble | III | 7.3 | 7.0 | 27% | 56% |
| Falconer (falconer) | Loose the Falcon (looseFalcon) | falcon out | III | 4.9 | 3.3 | 13% | 56% |
| Frost Mage (frost) | Ice Wall (iceWall) | wall | II / III | 8.8 / 7.8 | 8.0 / 8.0 | 0% / 100% | 53% / 44% |
| Engineer (engineer) | Deploy Turret (deployTurret) | turret | II / III | 11.0 / 9.8 | 16.4 / 16.4 | 91% / 96% | 39% / 45% |
| Necromancer (necromancer) | Raise Dead (raiseDead) | skeletons | II / III | 6.6 / 5.8 | 6.1 / 4.9 | 92% / 79% | 28% / 32% |

One more kind, not a cooldown problem but the same complaint: **Warlock (warlock), Awaken (summonImp)** "starts the
time again" on every kill. In these fights, once he turns into the demon he stays the demon to the end of the fight in
nearly every fight (12 of 12 casts at tiers II and III never ended). No cooldown rule changes that; only the
"every kill starts it again" line does.

## Effects that end early

This matters for choosing between the proposals, and it turned out to be rare. Ends by a stun, freeze or sleep, or the
hero going down, are under 5% for almost everything. The exceptions: the Hay Bale at tier II (10% stunned off, 3% downed,
and the bale itself often breaks early: median ride 3.4s of 7s, 1.5s at the low end, because the elite brute in the duel
smashes it), the Shaman's Healing Totem (6-10%), Tower's Hold the Line at II (7%), the Enchantress's Sweetheart at I
(14% with her down). Full list in the appendix. Effects whose target dies are common (30-50%) but most of these effects
carry on anyway (a form, a buff, a wall), so that is not an early end.

Enemies, a brief look: boss moves run on `due()` timers in elites.js that only count down when the brain reaches them,
and every boss brain returns early while a move is running (`spinTick`, `chargeTick`, `pressTick`... come first), so
**boss cooldowns already pause during their moves**, which is proposal (a). Elite extra moves count down whenever there
is a target, even mid-move, but none of their moves lasts more than about 1-2s, so it doesn't show. Plain enemies'
`abilCd` runs always but their abilities are dashes and shots. Nothing found on the enemy side like the Storm Born case.

## Proposals (not built)

All three were tried in the test runner on the 40 picked abilities (tools/audit/cooldowns/rules.mjs: a lasting effect
of 2s or more that, at some tier, is ready again at its end at least half the time or is up at least half the fight),
writing the kit's cooldown from the runner. 12 seeds, the same 3 scenarios, 3,564 fights per rule. Nothing in js/ was
changed for this and nothing of it is in the game.

**(a) The cooldown starts when the effect ends.** Held full while the effect is on (from the moment it appears: at the
cast, or when a thrown flask or trap lands), then the full cooldown from the end.
- Cycle = effect + cooldown + the hero's usual wait. Uptime = effect / that.
- Storm Born 81% → **50% (II), 57% (III)**; 40% → 31% at I. Hay Bale 72% → **46% (III)**, 49% → 34% (II).
  Whirl 70/76% → 43/45%. Fireball patches 93% → 53%. Stone Wall 85% → 51%. Tinker 88% → 55%.
- An effect cut short gives the cooldown back sooner (fair to a bale that breaks in 1.5s).
- It also stops the recast-on-top cases (patches, walls, pools, traps): the cooldown can't run while the last one is up.
- It needs each lasting ability to say when its effect is over. Most already have that test in their `score()`
  (`u.kit.storm`, a live bale, `wolfUntil`, `focusUntil`, `falconOut`, a live cauldron...). The cooldown ring would want
  to show "on" while it is held.

**(b) The cooldown includes the effect's average length.** At the cast, cooldown = full + the measured average effect
length for that tier (the numbers are in docs/audit/data/cooldowns/rules.json `add`).
- Measured uptimes come out almost the same as (a) (Storm Born 50/57%, Hay Bale 47%, Whirl 43/45%), because effects
  rarely end early.
- It is simpler to show (a bigger number) and needs no "is it over?" test.
- But it charges the full average even when the effect is cut short (a bale broken in 1.5s still costs 3.4s more at
  tier II), the averages must be kept in step with every change to an effect's length or a tier, and something whose
  length varies a lot (summons that get killed, a bale that breaks, Awaken) gets a number that is wrong most of the time.

**(c) A variant: at least half the cooldown is left when the effect ends** (the cooldown runs from the cast as today;
when the effect ends it is topped up to half the full cooldown if less is left).
- Leaves tier I exactly as it is (plenty is left there already) and cuts less at II/III: Storm Born 81% → 63/67%,
  Whirl 70/76% → 57/59%, Hay Bale 72% → 59%.
- But it does nothing for the recast-on-top cases (Fireball patches stay at 92%, Stone Wall III at 84%): the next cast
  comes before the last one ends.

**What it does to the heroes.** The fights here are mostly won at tiers II/III whatever the rule (win rates 100%), so
the clearest measure is the hero's damage per second standing. Changes are for the whole hero (where a hero had two or
three abilities changed, they are changed together):

| Hero | Tier | Damage a second: (a) / (b) / (c) | Wins today / (a) / (b) / (c) |
|---|---|---|---|
| Warhelm (Storm Born) | II / III | -7% / -7% / -2%; -12% / -12% / -13% | 100% all |
| Haymaker (Hay Bale) | I / II / III | -3/-6/0%; -5/-8/-2%; -8/-3/-6% | I: 61% / 47% / 47% / 61% |
| Berserker (Whirl) | II / III | -8/-5/-3%; -20/-22/-12% | II: 97% / 69% / 69% / 75% |
| Alchemist (Elixir + Brew Pools) | II / III | -28/-27/-20%; -25/-28/-7% | II: 100 / 97 / 97 / 100% |
| Engineer (Tinker + Drones + Turret) | II / III | -16/-12/-2%; -19/-17/-7% | 100% all |
| Pyromancer (Fireball + Flame Wall) | II / III | -22/-22/-3%; -19/-19/+1% | 100% all |
| Werewolf (Turn) | II / III | -5/-6/-5%; -6/-6/-4% | 100% all |
| Gladiator, Griffon, Bulwark, Samurai, Mob, Tower, Ninja | II / III | within about -10% to +4% | mostly unchanged |

(Per ability and tier, with the uptimes measured under each rule: appendix, "The proposals, measured".)

**Recommendation: (a).** It is the rule the designer described, it is the only one of the three that also fixes the
patches, walls, pools and traps cast on top of each other, and it treats an effect that ends early fairly. (b) gives
the same uptimes on average but is wrong in exactly the cases where an effect is cut short, and needs its numbers kept
in step by hand. (c) is gentler but leaves the stacking world effects as they are. Expect the heroes whose kit leans on
one long state (Alchemist, Engineer, Pyromancer, Berserker at III, Warhelm at III) to lose 10-25% of their damage; if
that is too much, the fix would be trimming those cooldowns a little after (a) is in, which is a design call (and best
judged with the tournament after this audit). Tier I barely moves under (a) except that a long form like Turn or Storm
Born comes round a little later (Storm Born I: 40% → 31% uptime).

## What couldn't be measured

- Effects not made inside the ability's own code or its tagged later pieces (a status's burst, a trait reacting to the
  ability) are not tied to the ability.
- Passive or reactive abilities never cast in these fights: Granny's Old Bones, the Ninja's Substitution, the Jester's
  Befuddle, the Valkyrie's Call, the Werewolf's Frenzy. A few were cast rarely here (Griffon Swoop 14 casts, Mob Scatter
  14, Trapper Bush 17, Dame Challenge 13, Bearskin Hibernate 38), so their numbers are thin.
- Battle mode only: no dungeon runs, no trinkets, the tier shells rather than players' own builds.
- Most fights at II/III are won whatever the rule, so strength is read from damage a second and a few win rates;
  damage taken a second was too noisy to use (the hero is barely hit in many of these fights).
- For summons and zones, "ended by a stun" means the hero was stunned at that moment, not why the summon died.
- The predicted uptimes under each rule worked out from today's casts (in the JSON as `upA`, `upB`, `upC`) came out a
  little lower than the measured ones; the tables use the measured ones.

## Files

- tools/audit/cooldowns/lib.mjs: the watcher and the three trial rules; run.mjs: the batch; analyze.mjs: per-ability
  numbers; rules.mjs: picks the abilities to try the proposals on; compare.mjs: today against the proposals;
  report.mjs: the tables below; try.mjs: one fight printed cast by cast; survey.mjs: what each ability leaves behind;
  classes.mjs: which lasting things are out in the world, and leftovers that aren't effects.
- docs/audit/data/cooldowns/summary-today.json: every hero, every lasting effect, every tier (3,186 fights; includes
  each effect's length and the cooldown left at its end, cast by cast). proto-today/a/b/c.json: the 33 flagged heroes
  under each rule (3,564 fights each). compare.json: side by side. rules.json: the picked abilities and (b)'s lengths.
  The raw fight files (about 50MB) are not kept; `node tools/audit/cooldowns/run.mjs` writes them again.
- One audit line in js/fxtag.js (null in the game): `AUDIT.on('abRun', ...)` before and after each tagged piece of an
  ability, and `AUDIT` added to its import from stats.js.

To redo it: `node tools/audit/cooldowns/run.mjs --shard 0/3 --out t0.json` (and 1/3, 2/3), then
`node tools/audit/cooldowns/analyze.mjs t0.json t1.json t2.json --out summary.json`, `rules.mjs summary.json rules.json`,
`run.mjs --rule a --rules rules.json --heroes <rules.json heroes> --seeds 12 ...`, `compare.mjs ...`, `report.mjs ...`.

## Appendix: every lasting effect

Cells: cooldown at cast / median effect length / median cooldown left at its end / ready at its end / **uptime**, all
from the 6-seed run of every hero (3,186 fights). **!** marks a lasting effect of 2s or more that at tier II or III is
ready at its end at least half the time or is up at least 60% of the fight. Debuffs on enemies are left out here (they
are in summary-today.json).
<!-- generated by tools/audit/cooldowns/report.mjs from 3186 fights -->

#### On the hero himself: a form, a stance, a mount, a channel, a buff

| | Hero | Ability | What lasts (as the code calls it) | Tier I | Tier II | Tier III |
|---|---|---|---|---|---|---|
| **!** | Warhelm (warhelm) | Storm Born (warHorn) | form, timer:stormBorn, kit.storm | 16.4 / 6.0 / 10.4 / 0% / **40%** | 8.8 / 9.0 / 0.0 / 100% / **81%** | 7.8 / 9.0 / 0.0 / 100% / **80%** |
| **!** | Berserker (berserker) | Whirl (whirl) | buff:whirl, kit.whirl | 12.3 / 3.0 / 9.3 / 0% / **25%** | 6.6 / 5.0 / 1.6 / 0% / **70%** | 5.8 / 5.0 / 0.8 / 0% / **75%** |
| **!** | Haymaker (haymaker) | Hay Bale (forkCharge) | act:ride, kit.bale | 13.4 / 3.6 / 9.7 / 0% / **28%** | 7.2 / 3.3 / 3.9 / 0% / **49%** | 6.4 / 6.1 / 0.2 / 46% / **71%** |
| **!** | Alchemist (alchemist) | Elixir (elixir) | buff:haste, buff:rage, buff:warded | 12.3 / 5.0 / 7.3 / 0% / **27%** | 6.6 / 5.0 / 1.6 / 0% / **64%** | 5.8 / 5.3 / 0.5 / 49% / **38%** |
| **!** | Gladiator (gladiator) | Arena (showboat) | timer:arena, kit.showUntil | 14.4 / 5.0 / 9.3 / 0% / **16%** | 7.7 / 5.0 / 2.7 / 0% / **52%** | 6.8 / 5.0 / 1.8 / 0% / **63%** |
|  | Griffon (griffon) | Wing Guard (wingShield) | buff:wingShield, kit.wingUntil | 13.4 / 4.0 / 9.3 / 0% / **28%** | 7.2 / 4.0 / 3.1 / 0% / **48%** | 6.4 / 4.0 / 2.3 / 0% / **55%** |
|  | Bulwark (bulwark) | Brace (brace) | buff:brace, timer:brace | 10.3 / 0.0 / 10.2 / 0% / **1%** | 5.5 / 3.0 / 2.5 / 0% / **50%** | 4.9 / 3.0 / 1.9 / 0% / **54%** |
|  | Old Guard (oldguard) | Parry (pommelStrike) | kit.parry | 9.2 / 0.6 / 8.6 / 0% / **10%** | 5.0 / 2.1 / 2.9 / 0% / **41%** | 4.4 / 4.0 / 0.5 / 0% / **54%** |
| **!** | Samurai (samurai) | Focus (focus) | kit.focusUntil | 12.3 / 5.0 / 7.3 / 0% / **27%** | 6.6 / 7.0 / 0.0 / 100% / **50%** | 5.8 / 9.0 / 0.0 / 100% / **53%** |
|  | The Mob (mob) | Pile On (pileOn) | act:leap, timer:pile, kit.pile | 10.3 / 2.5 / 7.8 / 0% / **23%** | 5.5 / 3.3 / 2.2 / 0% / **42%** | 4.9 / 3.3 / 1.6 / 0% / **50%** |
|  | Dame (dame) | Riposte (riposte) | buff:riposte, kit.riposteUntil | 9.2 / 1.6 / 7.6 / 0% / **17%** | 5.0 / 1.6 / 3.3 / 0% / **30%** | 4.4 / 2.6 / 1.8 / 0% / **49%** |
| **!** | Old Guard (oldguard) | Rally (rallyCry) | buff:rally | 15.4 / 5.0 / 10.4 / 0% / **12%** | 8.2 / 8.0 / 0.2 / 0% / **44%** | 7.3 / 8.0 / 0.0 / 89% / **46%** |
| **!** | Wildmane (wildmane) | Rage (rage) | buff:rage | 12.3 / 5.0 / 7.3 / 0% / **33%** | 6.6 / 5.0 / 1.6 / 0% / **43%** | 5.8 / 8.0 / 0.0 / 100% / **43%** |
|  | Javelin Huntress (huntress) | Spear Lunge (runningThrow) | act:ride, timer:lunge | 9.2 / 0.3 / 9.0 / 0% / **3%** | 5.0 / 0.3 / 4.7 / 0% / **3%** | 0.7 / 1.0 / 4.4 / 0% / **43%** |
|  | Necromancer (necromancer) | Life Drain (lifeDrain) | act:channel | 9.2 / 3.0 / 6.2 / 0% / **27%** | 5.0 / 3.0 / 1.9 / 1% / **38%** | 4.4 / 3.0 / 1.4 / 2% / **42%** |
|  | Falconer (falconer) | Keen Eye (keenEye) | kit.keenUntil | 14.4 / 6.0 / 8.3 / 0% / **17%** | 7.7 / 6.0 / 1.7 / 0% / **40%** | 6.8 / 6.0 / 0.8 / 0% / **22%** |
| **!** | Werewolf (werewolf) | Turn (turnWolf) | form, timer:turnWolf, kit.wolfUntil | 22.5 / 10.0 / 12.5 / 0% / **24%** | 12.1 / 14.0 / 0.0 / 100% / **35%** | 10.7 / 14.0 / 0.0 / 92% / **40%** |
|  | Warlock (warlock) | Awaken (summonImp) | form, buff:demon, kit.demon | 18.5 / 11.5 / 7.0 / 20% / **39%** | 9.9 / - / - / - / **39%** | 8.8 / - / - / - / **38%** |
| **!** | Tower (tower) | Hold the Line (holdTheLine) | buff:holdTheLine | 12.3 / 4.0 / 8.3 / 0% / **12%** | 6.6 / 6.0 / 0.6 / 0% / **33%** | 5.8 / 6.0 / 0.0 / 78% / **39%** |
|  | Warlock (warlock) | Eldritch Beam (eldritchBeam) | act:channel | 10.3 / 2.5 / 7.7 / 0% / **23%** | 5.5 / 2.5 / 3.0 / 0% / **35%** | 4.9 / 2.5 / 2.4 / 0% / **36%** |
|  | Bulwark (bulwark) | Shield Wall (shieldWall) | buff:shieldWall, timer:shieldWall | 15.4 / 5.0 / 10.4 / 0% / **13%** | 8.2 / 7.0 / 1.2 / 0% / **28%** | 7.3 / 7.0 / 0.3 / 0% / **35%** |
|  | Warlock (warlock) | Dark Bargain (darkBargain) | buff:bargain, kit.bargainUntil | 18.5 / 6.0 / 12.5 / 0% / **17%** | 9.9 / 8.0 / 1.9 / 0% / **29%** | 8.8 / 8.0 / 0.8 / 0% / **29%** |
|  | Alchemist (alchemist) | Monstrosity (bangFlask) | form, buff:monster, timer:monster | 18.5 / 8.0 / 10.5 / 0% / **12%** | 9.9 / 8.0 / 1.9 / 0% / **22%** | 8.8 / 8.0 / 0.8 / 0% / **27%** |
|  | Warden (warden) | Chain Gang (chainGang) | buff:chainGang | 14.4 / 5.0 / 9.3 / 0% / **14%** | 7.7 / 5.0 / 2.7 / 0% / **22%** | 6.8 / 5.0 / 1.8 / 0% / **27%** |
|  | Pyromancer (pyromancer) | Inferno (inferno) | buff:fireproof | - | - | 6.8 / 6.0 / 0.8 / 0% / **25%** |
| **!** | Enchantress (enchantress) | Sweetheart (sweetheart) | buff:beloved | 14.4 / 6.0 / 8.3 / 0% / **5%** | 7.7 / 8.0 / 0.0 / 100% / **12%** | 6.8 / 8.0 / 0.0 / 100% / **21%** |
|  | Shade (shade) | Blackout (blackout) | timer:blackout | 15.4 / 4.0 / 11.4 / 0% / **8%** | 8.2 / 4.0 / 4.2 / 0% / **21%** | 7.3 / 6.0 / 1.3 / 0% / **19%** |
| **!** | Bard (bard) | War Song (warSong) | buff:warSong | 12.3 / 8.0 / 4.3 / 0% / **15%** | 6.6 / 7.0 / 0.0 / 100% / **20%** | 5.8 / 6.2 / 0.0 / 100% / **18%** |
|  | Bearskin (bearskin) | Hibernate (hibernate) | u.sleepT, u.deepT, kit.hib | 18.5 / 8.0 / 10.5 / 0% / **19%** | 9.9 / 8.0 / 1.9 / 0% / **9%** | - |
|  | Witch (witch) | Broom Ride (broomRide) | act:ride, timer:broom, u.ethereal | 11.3 / 2.5 / 8.7 / 0% / **7%** | 6.0 / 2.5 / 3.5 / 0% / **13%** | 5.4 / 3.5 / 1.8 / 0% / **16%** |
| **!** | Druid (druid) | Rejuvenate (rejuvenate) | u.regenT | 9.2 / 6.0 / 3.2 / 0% / **6%** | 5.0 / 6.0 / 0.0 / 100% / **12%** | 4.4 / 6.0 / 0.0 / 100% / **16%** |
|  | Digger (digger) | Burrow (burrow) | act:leap, timer:burrowSafe, u.invulnT | 13.4 / 2.6 / 10.7 / 0% / **10%** | 7.2 / 2.6 / 4.5 / 0% / **16%** | 6.4 / 2.6 / 3.7 / 0% / **14%** |
|  | Pirate (pirate) | Grog (grog) | act:swig, buff:grog | 16.4 / 5.6 / 10.8 / 0% / **15%** | 8.8 / 5.6 / 3.2 / 0% / **6%** | - |
|  | Slinger (slinger) | Counting Sheep (gravel) | timer:ram | - | - | 5.8 / 1.9 / 3.9 / 0% / **13%** |
|  | Berserker (berserker) | Unstoppable (unstoppable) | buff:unstoppable | 16.4 / 2.0 / 14.4 / 0% / **2%** | 8.8 / 4.0 / 4.8 / 0% / **9%** | 7.8 / 4.0 / 3.8 / 0% / **12%** |
|  | Cultist (cultist) | Blood Pact (bloodPact) | buff:rage | 15.4 / 6.0 / 9.4 / 0% / **8%** | 8.2 / 6.0 / 2.2 / 0% / **12%** | 7.3 / 6.0 / 1.3 / 0% / **9%** |
|  | Falconer (falconer) | Call the Flock (flock) | act:ride, timer:flock, u.hidden | 13.4 / 2.2 / 11.1 / 0% / **5%** | 7.2 / 2.2 / 4.9 / 0% / **11%** | 6.4 / 3.0 / 3.3 / 0% / **10%** |
|  | Telekinetic (telekinetic) | Mind Shield (mindShield) | buff:mindShield, timer:dome | 16.4 / 3.5 / 12.9 / 0% / **11%** | 8.8 / 5.0 / 3.8 / 0% / **11%** | 7.8 / 5.0 / 2.8 / 0% / **11%** |
|  | Paladin (paladin) | Guard (guard) | u.guardOfT | 12.3 / 5.0 / 7.3 / 0% / **8%** | - | - |
|  | Monk (monk) | Inner Peace (innerPeace) | act:channel, buff:innerPeace, kit.peaceUntil | 16.4 / 2.5 / 13.9 / 0% / **7%** | 8.8 / 4.0 / 4.8 / 0% / **6%** | 7.8 / 4.0 / 3.8 / 0% / **8%** |
|  | Beekeeper (beekeeper) | Honey Glaze (royalJelly) | hook:honey, u.regenT | 12.3 / 4.0 / 8.3 / 0% / **6%** | 6.6 / 4.0 / 2.5 / 0% / **2%** | 5.8 / 4.0 / 1.8 / 0% / **2%** |
|  | Shaman (shaman) | Spirit Link (spiritLink) | kit.link | 16.4 / 5.0 / 11.4 / 0% / **4%** | 8.8 / 5.0 / 3.8 / 0% / **6%** | 7.8 / 7.0 / 0.8 / 0% / **5%** |
|  | The Mob (mob) | Scatter (scatter) | act:dash, buff:scatter, timer:scatter | 16.4 / 3.0 / 13.4 / 0% / **4%** | - | - |
|  | Trapper (trapper) | Bush (tripwire) | timer:bush, u.hidden, u.ethereal | 14.4 / 3.5 / 10.8 / 0% / **2%** | - | - |
|  | Slinger (slinger) | Stunning Stone (stunStone) | timer:ram | - | - | 3.9 / 1.6 / 2.4 / 0% / **2%** |

#### On friends: buffs, heals over time, rays

| | Hero | Ability | What lasts (as the code calls it) | Tier I | Tier II | Tier III |
|---|---|---|---|---|---|---|
| **!** | Engineer (engineer) | Tinker (tinker) | allyHook:armorFront | 16.4 / 9.0 / 7.4 / 13% / **17%** | 8.8 / 12.0 / 0.0 / 100% / **34%** | 7.8 / 12.0 / 0.0 / 88% / **37%** |
|  | Warlock (warlock) | Dark Bargain (darkBargain) | allyBuff:bargain | 18.5 / 6.0 / 12.5 / 0% / **17%** | 9.9 / 8.0 / 1.9 / 0% / **29%** | 8.8 / 8.0 / 0.8 / 0% / **29%** |
|  | Shaman (shaman) | Healing Totem (healTotem) | allyHook:totemSkin | 14.4 / 6.3 / 8.1 / 0% / **17%** | 7.7 / 6.6 / 1.1 / 41% / **21%** | 6.8 / 5.9 / 1.0 / 44% / **5%** |
|  | Valkyrie (valkyrie) | Spear of the Sky (spearThrow) | allyBuff:haste, allyBuff:warded, allyHook:warded | 9.2 / 5.2 / 4.0 / 0% / **18%** | - | - |
| **!** | Old Guard (oldguard) | Rally (rallyCry) | allyBuff:rally | 15.4 / 5.0 / 10.4 / 0% / **5%** | 8.2 / 8.0 / 0.2 / 0% / **15%** | 7.3 / 8.0 / 0.0 / 100% / **15%** |
|  | Alchemist (alchemist) | Elixir (elixir) | allyBuff:haste, allyBuff:rage, allyBuff:warded | 12.3 / 5.6 / 6.6 / 0% / **7%** | 6.6 / 5.6 / 0.9 / 0% / **12%** | 5.8 / 5.5 / 0.4 / 8% / **10%** |
|  | Cultist (cultist) | Blood Pact (bloodPact) | allyBuff:rage | 15.4 / 6.0 / 9.4 / 0% / **8%** | 8.2 / 6.0 / 2.2 / 0% / **12%** | 7.3 / 6.0 / 1.3 / 0% / **9%** |
| **!** | Enchantress (enchantress) | Sweetheart (sweetheart) | allyBuff:beloved | 14.4 / 6.0 / 8.3 / 0% / **5%** | 7.7 / 8.0 / 0.0 / 100% / **11%** | 6.8 / 8.0 / 0.0 / 100% / **6%** |
| **!** | Cleric (cleric) | Mending Ray (mend) | rays | 7.1 / 4.0 / 3.1 / 0% / **9%** | 3.8 / 4.0 / 0.0 / 53% / **4%** | - |
|  | Paladin (paladin) | Guard (guard) | ally.guardT | 12.3 / 5.0 / 7.3 / 0% / **8%** | - | - |
| **!** | Bard (bard) | War Song (warSong) | allyBuff:warSong | 12.3 / 8.0 / 4.3 / 0% / **4%** | 6.6 / 7.0 / 0.0 / 100% / **8%** | 5.8 / 6.2 / 0.0 / 100% / **4%** |
| **!** | Druid (druid) | Rejuvenate (rejuvenate) | ally.regenT | 9.2 / 6.0 / 3.2 / 0% / **6%** | 5.0 / 6.0 / 0.0 / 100% / **7%** | 4.4 / 6.0 / 0.0 / 100% / **4%** |
|  | Jester (jester) | Swap (mock) | allyBuff:haste, allyBuff:warded, allyHook:warded | 11.3 / 3.5 / 7.7 / 0% / **6%** | - | - |
|  | Shaman (shaman) | Spirit Link (spiritLink) | allyBuff:spiritLink | - | 8.8 / 5.0 / 3.8 / 0% / **6%** | 7.8 / 7.0 / 0.8 / 0% / **5%** |
|  | The Mob (mob) | Scatter (scatter) | allyBuff:scatter | 16.4 / 3.0 / 13.4 / 0% / **4%** | - | - |
|  | Beekeeper (beekeeper) | Honey Glaze (royalJelly) | allyHook:honey, ally.regenT | 12.3 / 4.6 / 7.6 / 0% / **3%** | - | - |
|  | Digger (digger) | Dirt Fling (dirtFling) | allyHook:dirty | - | 5.0 / 1.9 / 3.0 / 20% / **3%** | - |

#### Summons and pets

| | Hero | Ability | What lasts (as the code calls it) | Tier I | Tier II | Tier III |
|---|---|---|---|---|---|---|
| **!** | Engineer (engineer) | Tinker (tinker) | summon:torcher, summon:tesla, summon:snowMortar | 16.4 / 9.0 / 7.4 / 15% / **60%** | 8.8 / 11.6 / 0.0 / 61% / **84%** | 7.8 / 12.0 / 0.0 / 62% / **81%** |
| **!** | Engineer (engineer) | Wind-up Drones (shockMine) | summon:windup | 12.3 / 4.0 / 7.6 / 10% / **44%** | 6.6 / 4.4 / 2.1 / 21% / **67%** | 5.8 / 4.6 / 1.1 / 35% / **72%** |
| **!** | Haymaker (haymaker) | Hay Bale (forkCharge) | summon:haybale | 13.4 / 3.6 / 9.8 / 0% / **28%** | 7.2 / 3.3 / 3.9 / 0% / **48%** | 6.4 / 6.1 / 0.2 / 46% / **71%** |
| **!** | Crossbowman (crossbowman) | Pavise (pavise) | summon:pavise | 13.4 / 7.0 / 6.4 / 0% / **40%** | 7.2 / 9.0 / 0.0 / 67% / **62%** | 6.4 / 10.0 / 0.0 / 81% / **69%** |
|  | Falconer (falconer) | Loose the Falcon (looseFalcon) | timer:falcon, kit.falconOut | 10.3 / 3.3 / 7.0 / 0% / **32%** | 5.5 / 3.3 / 2.2 / 0% / **48%** | 4.9 / 3.4 / 1.5 / 15% / **58%** |
|  | Shade (shade) | Shadow Clones (deathMark) | summon:shadowClone | 14.4 / 6.0 / 8.4 / 0% / **36%** | 7.7 / 4.7 / 3.0 / 0% / **50%** | 6.8 / 4.8 / 2.0 / 31% / **58%** |
| **!** | Engineer (engineer) | Deploy Turret (deployTurret) | summon:turret | 20.5 / 10.4 / 8.2 / 0% / **27%** | 11.0 / 16.4 / 0.0 / 82% / **40%** | 9.8 / 16.4 / 0.0 / 83% / **40%** |
| **!** | Necromancer (necromancer) | Raise Dead (raiseDead) | summon:minion | 12.3 / 9.9 / 0.3 / 45% / **32%** | 6.6 / 6.1 / 0.0 / 94% / **31%** | 5.8 / 4.9 / 0.0 / 83% / **33%** |
|  | Shaman (shaman) | Ancestors' Call (rainDance) | summon:spiritBear, summon:spiritWolf, summon:spiritEagle | 20.5 / 6.6 / 13.9 / 0% / **11%** | 11.0 / 9.6 / 1.4 / 0% / **23%** | 9.8 / 9.6 / 0.2 / 0% / **22%** |
| **!** | Witch (witch) | Cursed Brew (cursedBrew) | summon:cauldron, kit.brew | 13.4 / 6.6 / 6.7 / 0% / **20%** | 7.2 / 6.6 / 0.5 / 0% / **22%** | 6.4 / 6.6 / 0.0 / 88% / **19%** |
|  | Druid (druid) | Call Wolf (callWolf) | summon:wolf | 22.5 / 5.6 / 16.9 / 0% / **12%** | 12.1 / 7.2 / 4.9 / 26% / **21%** | 10.7 / 5.2 / 5.5 / 13% / **17%** |
|  | Shaman (shaman) | Healing Totem (healTotem) | summon:totem | 14.4 / 6.3 / 8.1 / 0% / **17%** | 7.7 / 6.6 / 1.1 / 41% / **21%** | 6.8 / 5.9 / 1.0 / 44% / **5%** |
|  | Quartermaster (quartermaster) | Barricade (oilBlades) | summon:barricade | 18.5 / 5.5 / 13.0 / 0% / **12%** | 9.9 / 9.6 / 0.3 / 49% / **21%** | 8.8 / 5.3 / 3.5 / 29% / **18%** |
|  | Beekeeper (beekeeper) | Beehive (honeyPot) | summon:beehive | 14.4 / 4.6 / 9.8 / 0% / **10%** | 7.7 / 5.2 / 2.5 / 40% / **20%** | 6.8 / 3.1 / 3.8 / 16% / **12%** |
|  | Quartermaster (quartermaster) | Supply Crate (resupply) | summon:crate | 16.4 / 14.2 / 1.8 / 30% / **14%** | - | - |
|  | Grenadier (grenadier) | Big Bomb (bigBomb) | summon:bigBomb | 11.3 / 2.6 / 8.7 / 0% / **7%** | 6.0 / 2.6 / 3.4 / 0% / **9%** | 5.4 / 2.6 / 2.8 / 0% / **11%** |

#### In the world: zones, walls, traps, thrown things that stay

| | Hero | Ability | What lasts (as the code calls it) | Tier I | Tier II | Tier III |
|---|---|---|---|---|---|---|
| **!** | Pyromancer (pyromancer) | Fireball (fireball) | zone:fire | - | 3.8 / 4.0 / 0.0 / 100% / **92%** | 3.4 / 3.7 / 0.0 / 100% / **91%** |
| **!** | Earth Mage (earthMage) | Stone Wall (stoneWall) | wall:stone | 15.4 / 6.0 / 9.4 / 0% / **34%** | 8.2 / 8.0 / 0.2 / 0% / **88%** | 7.3 / 7.3 / 0.0 / 100% / **82%** |
| **!** | Alchemist (alchemist) | Brew Pools (acidFlask) | timer:pool, hazard:water, hazard:fire | 9.2 / 4.8 / 4.5 / 0% / **46%** | 5.0 / 4.8 / 0.1 / 0% / **78%** | 4.4 / 5.3 / 0.0 / 100% / **85%** |
| **!** | Trapper (trapper) | Jaw Trap (jawTrap) | timer:trap | 9.2 / 0.4 / 8.8 / 17% / **27%** | 5.0 / 0.5 / 4.4 / 22% / **47%** | 4.4 / 4.8 / 0.0 / 70% / **79%** |
| **!** | Ninja (ninja) | Caltrops (caltrops) | timer:caltrops | 12.3 / 7.0 / 5.3 / 0% / **49%** | 6.6 / 7.0 / 0.0 / 100% / **70%** | 5.8 / 7.0 / 0.0 / 100% / **62%** |
|  | Clockmaker (clockwork) | Slow Time (timeBubble) | timer:bubble | 15.4 / 5.0 / 10.4 / 0% / **20%** | 8.2 / 5.0 / 3.2 / 0% / **38%** | 7.3 / 7.0 / 0.3 / 27% / **59%** |
|  | Enchantress (enchantress) | Heartstring (heartstring) | kit.string | 13.4 / 4.0 / 9.3 / 0% / **27%** | 7.2 / 6.0 / 1.2 / 0% / **54%** | 6.4 / 6.0 / 0.4 / 0% / **57%** |
| **!** | Frost Mage (frost) | Ice Wall (iceWall) | wall:ice | 16.4 / 5.0 / 11.4 / 0% / **23%** | 8.8 / 8.0 / 0.8 / 0% / **48%** | 7.8 / 8.0 / 0.0 / 100% / **44%** |
|  | Jester (jester) | Juggling Act (juggle) | proj:ball | 10.3 / 2.7 / 7.6 / 0% / **26%** | 5.5 / 2.7 / 2.8 / 0% / **45%** | 4.9 / 2.8 / 2.1 / 0% / **46%** |
| **!** | Twinfang (twinfang) | Dash (dash) | zone:smoke | - | 1.8 / 2.5 / 0.0 / 99% / **37%** | 0.6 / 2.5 / 0.0 / 100% / **33%** |
| **!** | Harpooner (harpooner) | Rogue Wave (rogueWave) | hazard:water | - | - | 5.8 / 8.0 / 0.0 / 100% / **34%** |
|  | Paladin (paladin) | Consecrate (consecrate) | zone:holy | 14.4 / 4.0 / 10.4 / 0% / **11%** | 7.7 / 6.0 / 1.7 / 0% / **26%** | 6.8 / 6.0 / 0.8 / 0% / **26%** |
| **!** | Plague Doctor (plague) | Miasma (miasma) | zone:poison | 10.3 / 5.2 / 5.0 / 0% / **16%** | 5.5 / 5.3 / 0.2 / 0% / **24%** | 4.9 / 5.1 / 0.0 / 98% / **26%** |
|  | Plague Doctor (plague) | Gas Form (leeches) | zone:poison | 12.3 / 3.0 / 9.3 / 0% / **11%** | 6.6 / 4.0 / 2.6 / 0% / **22%** | 5.8 / 4.0 / 1.8 / 0% / **23%** |
|  | Air Mage (airMage) | Cyclone (cyclone) | zone:cyclone | 15.4 / 5.0 / 10.4 / 0% / **7%** | 8.2 / 7.0 / 1.2 / 0% / **13%** | 7.3 / 7.0 / 0.3 / 0% / **23%** |
| **!** | Pyromancer (pyromancer) | Flame Wall (flameWall) | zone:zone | 12.3 / 4.0 / 8.3 / 0% / **13%** | 6.6 / 6.0 / 0.6 / 0% / **22%** | 5.8 / 6.0 / 0.0 / 100% / **21%** |
|  | Twinfang (twinfang) | Backstab (backstab) | zone:smoke | 11.3 / 1.6 / 9.7 / 0% / **8%** | 6.0 / 1.6 / 4.4 / 0% / **12%** | 5.4 / 1.6 / 3.8 / 45% / **20%** |
|  | Beekeeper (beekeeper) | Smoker (swarm) | timer:smoker | 11.3 / 2.0 / 9.2 / 0% / **12%** | 6.0 / 2.0 / 4.0 / 0% / **19%** | 5.4 / 2.0 / 3.3 / 0% / **18%** |
|  | Cultist (cultist) | Ritual Circle (ritualCircle) | timer:ritualCircle | 13.4 / 4.0 / 9.3 / 0% / **11%** | 7.2 / 4.0 / 3.1 / 0% / **15%** | 6.4 / 4.0 / 2.3 / 0% / **17%** |
|  | Earth Mage (earthMage) | Earthquake (earthquake) | zone:quake | 14.4 / 3.0 / 11.4 / 0% / **6%** | 7.7 / 4.5 / 3.2 / 0% / **10%** | 6.8 / 4.5 / 2.3 / 0% / **17%** |
| **!** | Cleric (cleric) | Sanctuary (sanctuary) | zone:sanctuary, proj:orb | 16.4 / 5.0 / 11.4 / 0% / **16%** | 8.8 / 7.0 / 1.8 / 0% / **12%** | 7.8 / 8.3 / 0.0 / 69% / **9%** |
|  | Seer (seer) | Ill Omen (starfall) | timer:illOmen | 15.4 / 5.0 / 10.4 / 0% / **6%** | 8.2 / 5.0 / 3.2 / 0% / **9%** | 7.3 / 5.0 / 2.3 / 0% / **15%** |
|  | Chef (chef) | Grease Fire (greaseFire) | hazard:oil | 13.4 / 6.0 / 7.4 / 0% / **8%** | 7.2 / 6.0 / 1.1 / 25% / **6%** | 6.4 / 6.0 / 0.3 / 42% / **15%** |
|  | Telekinetic (telekinetic) | Mind Shield (mindShield) | zone:mindDome | 16.4 / 3.5 / 12.9 / 0% / **11%** | 8.8 / 5.0 / 3.8 / 0% / **11%** | 7.8 / 5.0 / 2.8 / 0% / **11%** |
|  | Frost Mage (frost) | Frost Nova (frostNova) | zone:snow | 13.4 / 3.0 / 10.4 / 0% / **8%** | 7.2 / 3.0 / 4.2 / 0% / **8%** | 6.4 / 3.0 / 3.4 / 0% / **10%** |
|  | Clockmaker (clockwork) | Stop the Clock (stopClock) | timer:stopClock | 20.5 / 1.4 / 19.1 / 0% / **4%** | 11.0 / 2.0 / 9.0 / 0% / **9%** | 9.8 / 2.0 / 7.7 / 0% / **10%** |
| **!** | Archer (archer) | Roll (roll) | zone:vines | - | - | 2.9 / 5.0 / 0.0 / 100% / **7%** |
|  | Druid (druid) | Entangle (entangle) | zone:vines | 10.3 / 1.6 / 8.7 / 0% / **4%** | 5.5 / 1.6 / 3.9 / 0% / **5%** | 4.9 / 1.6 / 3.3 / 0% / **6%** |

#### The proposals, measured

| Hero | Ability | Tier | Uptime today | a) starts at the end | b) + average length | c) half left at the end | Damage a second, a / b / c | Wins today / a / b / c |
|---|---|---|---|---|---|---|---|---|
| Pyromancer (pyromancer) | Fireball (fireball) | II | 93% | 53% | 53% | 92% | -22% / -22% / -3% | 100% / 100% / 100% / 100% |
| Pyromancer (pyromancer) | Fireball (fireball) | III | 91% | 55% | 56% | 90% | -19% / -19% / +1% | 100% / 100% / 100% / 100% |
| Earth Mage (earthMage) | Stone Wall (stoneWall) | I | 33% | 25% | 25% | 33% | -2% / -2% / +0% | 100% / 100% / 100% / 100% |
| Earth Mage (earthMage) | Stone Wall (stoneWall) | II | 84% | 47% | 47% | 60% | -4% / -4% / -3% | 100% / 100% / 100% / 100% |
| Earth Mage (earthMage) | Stone Wall (stoneWall) | III | 85% | 51% | 51% | 84% | +5% / +5% / +3% | 100% / 100% / 100% / 100% |
| Alchemist (alchemist) | Brew Pools (acidFlask) | I | 46% | 33% | 33% | 46% | -15% / -16% / +0% | 94% / 83% / 81% / 94% |
| Alchemist (alchemist) | Brew Pools (acidFlask) | II | 77% | 46% | 45% | 59% | -28% / -27% / -20% | 100% / 97% / 97% / 100% |
| Alchemist (alchemist) | Brew Pools (acidFlask) | III | 85% | 53% | 52% | 79% | -25% / -28% / -7% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Tinker (tinker) | I | 60% | 41% | 42% | 52% | -15% / -15% / -10% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Tinker (tinker) | II | 83% | 53% | 59% | 68% | -16% / -12% / -2% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Tinker (tinker) | III | 88% | 55% | 59% | 69% | -19% / -17% / -7% | 100% / 100% / 100% / 100% |
| Warhelm (warhelm) | Storm Born (warHorn) | I | 40% | 31% | 31% | 40% | -5% / -5% / +0% | 100% / 100% / 100% / 100% |
| Warhelm (warhelm) | Storm Born (warHorn) | II | 81% | 50% | 50% | 63% | -7% / -7% / -2% | 100% / 100% / 100% / 100% |
| Warhelm (warhelm) | Storm Born (warHorn) | III | 81% | 57% | 57% | 67% | -12% / -12% / -13% | 100% / 100% / 100% / 100% |
| Trapper (trapper) | Jaw Trap (jawTrap) | I | 31% | 25% | 28% | 32% | -5% / -5% / +1% | 50% / 58% / 61% / 50% |
| Trapper (trapper) | Jaw Trap (jawTrap) | II | 47% | 42% | 37% | 45% | -7% / -10% / -2% | 94% / 94% / 89% / 100% |
| Trapper (trapper) | Jaw Trap (jawTrap) | III | 80% | 64% | 52% | 79% | -6% / -5% / 0% | 97% / 94% / 97% / 97% |
| Berserker (berserker) | Whirl (whirl) | I | 25% | 22% | 22% | 25% | +0% / -2% / +1% | 64% / 53% / 58% / 61% |
| Berserker (berserker) | Whirl (whirl) | II | 70% | 43% | 43% | 57% | -8% / -5% / -3% | 97% / 69% / 69% / 75% |
| Berserker (berserker) | Whirl (whirl) | III | 76% | 45% | 45% | 59% | -20% / -22% / -12% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Wind-up Drones (shockMine) | I | 41% | 30% | 30% | 37% | -15% / -15% / -10% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Wind-up Drones (shockMine) | II | 66% | 39% | 41% | 56% | -16% / -12% / -2% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Wind-up Drones (shockMine) | III | 74% | 45% | 46% | 63% | -19% / -17% / -7% | 100% / 100% / 100% / 100% |
| Haymaker (haymaker) | Hay Bale (forkCharge) | I | 27% | 22% | 21% | 27% | -3% / -6% / +0% | 61% / 47% / 47% / 61% |
| Haymaker (haymaker) | Hay Bale (forkCharge) | II | 49% | 34% | 32% | 43% | -5% / -8% / -2% | 67% / 67% / 67% / 67% |
| Haymaker (haymaker) | Hay Bale (forkCharge) | III | 72% | 46% | 47% | 59% | -8% / -3% / -6% | 100% / 100% / 100% / 100% |
| Ninja (ninja) | Caltrops (caltrops) | I | 49% | 34% | 34% | 48% | +2% / -1% / +1% | 100% / 100% / 100% / 100% |
| Ninja (ninja) | Caltrops (caltrops) | II | 71% | 42% | 38% | 58% | -6% / -10% / -3% | 100% / 100% / 100% / 100% |
| Ninja (ninja) | Caltrops (caltrops) | III | 66% | 40% | 35% | 54% | -10% / -10% / -4% | 100% / 100% / 100% / 100% |
| Crossbowman (crossbowman) | Pavise (pavise) | I | 40% | 30% | 31% | 42% | -1% / +0% / +1% | 100% / 100% / 100% / 97% |
| Crossbowman (crossbowman) | Pavise (pavise) | II | 70% | 45% | 46% | 57% | -8% / -8% / -5% | 100% / 100% / 100% / 100% |
| Crossbowman (crossbowman) | Pavise (pavise) | III | 71% | 53% | 53% | 61% | +1% / -7% / -5% | 100% / 100% / 100% / 100% |
| Alchemist (alchemist) | Elixir (elixir) | I | 28% | 20% | 20% | 28% | -15% / -16% / +0% | 94% / 83% / 81% / 94% |
| Alchemist (alchemist) | Elixir (elixir) | II | 67% | 38% | 36% | 51% | -28% / -27% / -20% | 100% / 97% / 97% / 100% |
| Alchemist (alchemist) | Elixir (elixir) | III | 38% | 23% | 21% | 30% | -25% / -28% / -7% | 100% / 100% / 100% / 100% |
| Gladiator (gladiator) | Arena (showboat) | I | 18% | 14% | 14% | 20% | +0% / +1% / +1% | 97% / 94% / 97% / 97% |
| Gladiator (gladiator) | Arena (showboat) | II | 54% | 37% | 37% | 50% | -2% / -1% / +0% | 100% / 100% / 100% / 100% |
| Gladiator (gladiator) | Arena (showboat) | III | 64% | 41% | 42% | 55% | -4% / -4% / -1% | 100% / 100% / 100% / 100% |
| Clockmaker (clockwork) | Slow Time (timeBubble) | I | 19% | 15% | 15% | 19% | -3% / -3% / +0% | 67% / 72% / 67% / 67% |
| Clockmaker (clockwork) | Slow Time (timeBubble) | II | 38% | 29% | 29% | 35% | +2% / -1% / +2% | 100% / 97% / 100% / 100% |
| Clockmaker (clockwork) | Slow Time (timeBubble) | III | 56% | 39% | 37% | 46% | +1% / -1% / +1% | 100% / 100% / 100% / 100% |
| Falconer (falconer) | Loose the Falcon (looseFalcon) | I | 31% | 24% | 25% | 32% | -7% / -7% / -1% | 36% / 33% / 33% / 33% |
| Falconer (falconer) | Loose the Falcon (looseFalcon) | II | 47% | 31% | 32% | 41% | -13% / -5% / -6% | 33% / 33% / 33% / 33% |
| Falconer (falconer) | Loose the Falcon (looseFalcon) | III | 56% | 40% | 40% | 50% | -5% / -13% / -6% | 39% / 33% / 33% / 33% |
| Shade (shade) | Shadow Clones (deathMark) | I | 34% | 28% | 26% | 37% | -9% / -9% / -2% | 53% / 42% / 42% / 44% |
| Shade (shade) | Shadow Clones (deathMark) | II | 56% | 36% | 37% | 47% | -11% / -12% / -4% | 50% / 39% / 42% / 44% |
| Shade (shade) | Shadow Clones (deathMark) | III | 61% | 44% | 39% | 49% | -11% / -18% / -7% | 64% / 64% / 61% / 64% |
| Enchantress (enchantress) | Heartstring (heartstring) | I | 28% | 22% | 22% | 28% | +0% / -1% / +0% | 64% / 53% / 61% / 64% |
| Enchantress (enchantress) | Heartstring (heartstring) | II | 54% | 40% | 42% | 52% | -3% / -4% / -2% | 78% / 83% / 92% / 81% |
| Enchantress (enchantress) | Heartstring (heartstring) | III | 58% | 44% | 45% | 56% | -2% / -1% / -1% | 97% / 97% / 97% / 100% |
| Griffon (griffon) | Wing Guard (wingShield) | I | 28% | 23% | 23% | 27% | +1% / -1% / -3% | 42% / 42% / 36% / 50% |
| Griffon (griffon) | Wing Guard (wingShield) | II | 49% | 33% | 33% | 47% | +1% / -2% / +2% | 67% / 67% / 67% / 67% |
| Griffon (griffon) | Wing Guard (wingShield) | III | 56% | 37% | 36% | 50% | -1% / +1% / +3% | 100% / 97% / 97% / 100% |
| Bulwark (bulwark) | Brace (brace) | I | 1% | 1% | 1% | 2% | +0% / +1% / 0% | 67% / 67% / 67% / 67% |
| Bulwark (bulwark) | Brace (brace) | II | 51% | 34% | 33% | 48% | +1% / +2% / 0% | 69% / 69% / 67% / 72% |
| Bulwark (bulwark) | Brace (brace) | III | 54% | 35% | 35% | 51% | +1% / 0% / -1% | 100% / 100% / 100% / 100% |
| Old Guard (oldguard) | Parry (pommelStrike) | I | 11% | 9% | 10% | 11% | +1% / +1% / +0% | 50% / 47% / 47% / 50% |
| Old Guard (oldguard) | Parry (pommelStrike) | II | 43% | 30% | 31% | 39% | -8% / -7% / 0% | 97% / 97% / 97% / 97% |
| Old Guard (oldguard) | Parry (pommelStrike) | III | 49% | 33% | 34% | 43% | +3% / +2% / +1% | 100% / 100% / 100% / 100% |
| Samurai (samurai) | Focus (focus) | I | 26% | 20% | 19% | 25% | +1% / -1% / +1% | 100% / 100% / 100% / 100% |
| Samurai (samurai) | Focus (focus) | II | 49% | 28% | 33% | 34% | -1% / -5% / 0% | 100% / 100% / 100% / 100% |
| Samurai (samurai) | Focus (focus) | III | 54% | 36% | 36% | 40% | +0% / +1% / +0% | 100% / 100% / 100% / 100% |
| The Mob (mob) | Pile On (pileOn) | I | 23% | 20% | 20% | 23% | -5% / -4% / -1% | 100% / 100% / 100% / 100% |
| The Mob (mob) | Pile On (pileOn) | II | 45% | 31% | 33% | 41% | -5% / -5% / -3% | 86% / 86% / 92% / 86% |
| The Mob (mob) | Pile On (pileOn) | III | 48% | 33% | 34% | 46% | +1% / +1% / +2% | 100% / 100% / 100% / 100% |
| Old Guard (oldguard) | Rally (rallyCry) | I | 14% | 11% | 11% | 14% | +1% / +1% / +0% | 50% / 47% / 47% / 50% |
| Old Guard (oldguard) | Rally (rallyCry) | II | 34% | 24% | 25% | 31% | -8% / -7% / 0% | 97% / 97% / 97% / 97% |
| Old Guard (oldguard) | Rally (rallyCry) | III | 43% | 29% | 25% | 39% | +3% / +2% / +1% | 100% / 100% / 100% / 100% |
| Frost Mage (frost) | Ice Wall (iceWall) | I | 23% | 18% | 19% | 23% | +2% / +4% / +0% | 78% / 86% / 81% / 78% |
| Frost Mage (frost) | Ice Wall (iceWall) | II | 53% | 34% | 31% | 44% | +4% / +3% / 0% | 100% / 100% / 97% / 100% |
| Frost Mage (frost) | Ice Wall (iceWall) | III | 44% | 29% | 28% | 34% | +2% / -2% / +1% | 100% / 100% / 100% / 100% |
| Wildmane (wildmane) | Rage (rage) | I | 33% | 27% | 26% | 34% | -4% / -2% / 0% | 69% / 67% / 67% / 69% |
| Wildmane (wildmane) | Rage (rage) | II | 45% | 27% | 29% | 39% | 0% / -2% / +2% | 83% / 67% / 67% / 67% |
| Wildmane (wildmane) | Rage (rage) | III | 48% | 33% | 30% | 43% | -1% / -4% / -3% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Deploy Turret (deployTurret) | I | 29% | 18% | 22% | 26% | -15% / -15% / -10% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Deploy Turret (deployTurret) | II | 39% | 24% | 30% | 32% | -16% / -12% / -2% | 100% / 100% / 100% / 100% |
| Engineer (engineer) | Deploy Turret (deployTurret) | III | 45% | 28% | 31% | 34% | -19% / -17% / -7% | 100% / 100% / 100% / 100% |
| Werewolf (werewolf) | Turn (turnWolf) | I | 25% | 15% | 16% | 26% | -8% / -8% / -1% | 100% / 100% / 100% / 100% |
| Werewolf (werewolf) | Turn (turnWolf) | II | 33% | 23% | 24% | 30% | -5% / -6% / -5% | 100% / 100% / 100% / 100% |
| Werewolf (werewolf) | Turn (turnWolf) | III | 39% | 28% | 28% | 30% | -6% / -6% / -4% | 100% / 100% / 100% / 100% |
| Tower (tower) | Hold the Line (holdTheLine) | I | 12% | 9% | 9% | 12% | -1% / +2% / +0% | 72% / 72% / 69% / 72% |
| Tower (tower) | Hold the Line (holdTheLine) | II | 33% | 20% | 19% | 26% | 0% / -1% / -1% | 67% / 67% / 67% / 67% |
| Tower (tower) | Hold the Line (holdTheLine) | III | 36% | 22% | 22% | 28% | +1% / +4% / +1% | 100% / 100% / 100% / 100% |
| Twinfang (twinfang) | Dash (dash) | II | 35% | 26% | 27% | 33% | +1% / +2% / -3% | 67% / 67% / 67% / 67% |
| Twinfang (twinfang) | Dash (dash) | III | 32% | 26% | 26% | 33% | +4% / +1% / -2% | 89% / 94% / 97% / 94% |
| Harpooner (harpooner) | Rogue Wave (rogueWave) | III | 29% | 18% | 19% | 29% | -3% / -1% / +3% | 100% / 100% / 100% / 100% |
| Necromancer (necromancer) | Raise Dead (raiseDead) | I | 33% | 21% | 20% | 27% | -2% / -4% / 0% | 94% / 89% / 86% / 92% |
| Necromancer (necromancer) | Raise Dead (raiseDead) | II | 28% | 20% | 21% | 28% | 0% / +2% / +3% | 100% / 94% / 100% / 100% |
| Necromancer (necromancer) | Raise Dead (raiseDead) | III | 32% | 24% | 26% | 32% | -3% / -3% / -3% | 100% / 100% / 100% / 100% |
| Plague Doctor (plague) | Miasma (miasma) | I | 15% | 13% | 12% | 14% | +5% / +3% / +8% | 61% / 58% / 56% / 61% |
| Plague Doctor (plague) | Miasma (miasma) | II | 22% | 16% | 15% | 18% | 0% / -2% / 0% | 97% / 100% / 100% / 100% |
| Plague Doctor (plague) | Miasma (miasma) | III | 27% | 16% | 17% | 24% | -2% / -2% / +0% | 100% / 100% / 100% / 100% |
| Enchantress (enchantress) | Sweetheart (sweetheart) | I | 6% | 4% | 4% | 6% | +0% / -1% / +0% | 64% / 53% / 61% / 64% |
| Enchantress (enchantress) | Sweetheart (sweetheart) | II | 12% | 9% | 6% | 9% | -3% / -4% / -2% | 78% / 83% / 92% / 81% |
| Enchantress (enchantress) | Sweetheart (sweetheart) | III | 20% | 13% | 11% | 17% | -2% / -1% / -1% | 97% / 97% / 97% / 100% |
| Pyromancer (pyromancer) | Flame Wall (flameWall) | I | 14% | 10% | 10% | 14% | -2% / -2% / +0% | 97% / 97% / 97% / 97% |
| Pyromancer (pyromancer) | Flame Wall (flameWall) | II | 19% | 14% | 14% | 16% | -22% / -22% / -3% | 100% / 100% / 100% / 100% |
| Pyromancer (pyromancer) | Flame Wall (flameWall) | III | 26% | 15% | 16% | 22% | -19% / -19% / +1% | 100% / 100% / 100% / 100% |
| Bard (bard) | War Song (warSong) | I | 16% | 11% | 11% | 15% | -3% / -5% / 0% | 67% / 81% / 72% / 69% |
| Bard (bard) | War Song (warSong) | II | 20% | 12% | 8% | 18% | -5% / -10% / -6% | 92% / 86% / 86% / 86% |
| Bard (bard) | War Song (warSong) | III | 18% | 11% | 8% | 16% | -3% / -3% / -3% | 100% / 97% / 97% / 100% |
| Witch (witch) | Cursed Brew (cursedBrew) | I | 18% | 14% | 14% | 18% | -5% / -4% / -2% | 33% / 33% / 33% / 33% |
| Witch (witch) | Cursed Brew (cursedBrew) | II | 25% | 20% | 19% | 18% | -2% / +8% / +3% | 39% / 39% / 39% / 36% |
| Witch (witch) | Cursed Brew (cursedBrew) | III | 19% | 20% | 18% | 19% | +2% / +3% / +12% | 39% / 33% / 33% / 36% |
| Druid (druid) | Rejuvenate (rejuvenate) | I | 5% | 6% | 5% | 6% | -4% / -2% / -1% | 64% / 64% / 67% / 64% |
| Druid (druid) | Rejuvenate (rejuvenate) | II | 13% | 12% | 11% | 12% | -3% / 0% / -5% | 81% / 86% / 78% / 81% |
| Druid (druid) | Rejuvenate (rejuvenate) | III | 17% | 15% | 15% | 17% | +0% / 0% / +1% | 94% / 94% / 100% / 94% |
| Cleric (cleric) | Sanctuary (sanctuary) | I | 11% | 10% | 11% | 11% | +1% / +1% / -1% | 58% / 58% / 56% / 53% |
| Cleric (cleric) | Sanctuary (sanctuary) | II | 14% | 11% | 11% | 12% | -1% / -1% / -1% | 100% / 94% / 92% / 100% |
| Cleric (cleric) | Sanctuary (sanctuary) | III | 9% | 5% | 9% | 6% | -1% / -3% / +1% | 100% / 100% / 100% / 100% |
| Archer (archer) | Roll (roll) | III | 9% | 9% | 8% | 9% | +1% / -3% / -1% | 100% / 100% / 100% / 100% |
| Cleric (cleric) | Mending Ray (mend) | I | 9% | 6% | 6% | 7% | +1% / +1% / -1% | 58% / 58% / 56% / 53% |
| Cleric (cleric) | Mending Ray (mend) | II | 2% | 3% | 3% | 2% | -1% / -1% / -1% | 100% / 94% / 92% / 100% |
| Cleric (cleric) | Mending Ray (mend) | III | 0% | - | 0% | 0% | -1% / -3% / +1% | 100% / 100% / 100% / 100% |

#### Effects that often end early

| Hero | Ability | Kind | Tier | Ends from a stun/freeze/sleep | Ends with the hero down | Its target dead by then | Median length | Cooldown left then |
|---|---|---|---|---|---|---|---|---|
| Haymaker (haymaker) | Hay Bale (forkCharge) | on him | II | 10% | 3% | 27% | 3.3s | 3.9s |
| Haymaker (haymaker) | Hay Bale (forkCharge) | summon/pet | II | 10% | 3% | 26% | 3.3s | 3.9s |
| Shaman (shaman) | Healing Totem (healTotem) | on a friend | II | 10% | 0% | 2% | 6.6s | 1.1s |
| Shaman (shaman) | Healing Totem (healTotem) | summon/pet | II | 10% | 0% | 2% | 6.6s | 1.1s |
| Shade (shade) | Shadow Clones (deathMark) | summon/pet | II | 5% | 3% | 21% | 4.7s | 3.0s |
| Tower (tower) | Hold the Line (holdTheLine) | on him | II | 7% | 0% | 33% | 6.0s | 0.6s |
| Enchantress (enchantress) | Sweetheart (sweetheart) | on him | I | 0% | 14% | 23% | 6.0s | 8.3s |
| Druid (druid) | Call Wolf (callWolf) | summon/pet | I | 0% | 5% | 23% | 5.6s | 16.9s |
| Old Guard (oldguard) | Rally (rallyCry) | on a friend | II | 6% | 0% | 35% | 8.0s | 0.2s |
| Berserker (berserker) | Unstoppable (unstoppable) | on him | II | 0% | 6% | 0% | 4.0s | 4.8s |
| Shaman (shaman) | Healing Totem (healTotem) | on a friend | III | 6% | 0% | 0% | 5.9s | 1.0s |
| Shaman (shaman) | Healing Totem (healTotem) | summon/pet | III | 6% | 0% | 0% | 5.9s | 1.0s |
