# Status audit: how much each status changes a fight

Round 16, lane audit-statuses. **Measured only.** No rule or number in the game changed. The proposals at the end
are proposals, for the designer to rule on.

The designer: "test how much status effects influence outcomes. Nothing. Gradual stack of burn against an identical
opponent (fixed increase rate, so they will burst periodically), then with cold, then with bleed and so on. Run this
multiple times with different units at different tiers to get a good picture."

## How it was run
- **Mirror fights** in battle mode: the same units on both sides. One side (the **fed side**) has a status poured
  in at a fixed rate, one pulse a second, from the nearest unit on the other side (so credit, the charmer and the
  frightener are real units). The other side gets nothing.
- **Control**: the same fights, same seeds, nothing added. Every number below is a change against the control.
- **26 matchups**: 8 heroes (Paladin, Tower, Archer, Berserker, Twinfang, Pyromancer, Cleric, Bard) at tier I and
  tier III; 6 enemies (rattler: small melee, bone; bandit: medium; orc and troll: big; poacher: ranged; golem:
  armoured and big); 4 groups of three (Paladin + Archer + Cleric at tier I, Berserker + Pyromancer + Bard at tier III,
  three rattlers, three wolves).
- **48 seeds** per condition; the fed side is Red on half and Blue on half (the two sides start in different spots).
- **Rates.** For each status, rates picked so it bursts about every 12 s (**low**), 6 s (**medium**) and 3 s
  (**high**), measured on a Paladin mirror where nobody could die (`rates.json`). Six statuses can't burst every 6 s
  because the burst state and the immunity after it hold them off (Radiance 7 s, Entangle 6, Charm 6, Confused 8,
  Sleepy 9, Fear 8, Shackles 10): for those, medium is "as often as it can" and there is no high. Two more lines:
  **kept at 85** (topped up to 85 every second, never let burst: the build-up's effect alone) and **flat 25** (every
  status at the same 25 points a second, to compare point for point).
- **Worth.** The same fights again with the other side given a plain damage bonus on every blow (+10% to +200%), and
  with the fed side given +15% and +30%. A status's worth is the bonus that moves the fight's health margin by the same
  amount. "Burn at medium is worth +70%" means: being fed Burn at that rate hurts you as much as your opponent hitting
  70% harder. Worth is the median over the 26 matchups. Above +200% is off the scale (shown as ≥+200%). A negative
  worth ("helps") means the fed side came out *better* than the control: -14% is as good as its own blows landing
  14% harder; below -30% is off the bottom of the scale.
- **107,328 fights** in all (82 CPU-minutes; about 35 minutes on three processes).

**Why the margin, not the win rate.** A mirror is a coin toss, and *anything* tips it: even +10% damage takes the fed
side's wins from about 50% to near 0 in most matchups. So the win-rate shift is about -45% for nearly every status
at every rate and tells them apart badly. The health margin at the end (fed side's health left minus the other
side's, as shares of their full health) keeps moving, so worth is built on it. The win shift is still in the data.

**Noise.** The margin shift of one status at one rate, over 26 matchups x 48 seeds, is good to about ±5 points
(two standard errors); in worth that is about ±7 points. Treat differences under about 15 points of worth as a tie.

## The headline: what each status does at its medium rate
Per fed unit, per fight, averaged over all 26 matchups. "Couldn't strike": stunned, frozen, asleep, knocked out,
Radiant, Terrified, Shackled, or fighting for the other side; the control's own share (its opponent's stuns and
the like) is 9%. "Own damage": damage the status itself did (Burn ticks and Scorch, Poison ticks and Sickened,
Bleeding and Haemorrhage, Shatter, Rooted's squeeze and Entangle's walking/attacking cuts, a Hex turned on itself),
and its share of all the damage the fed side took. Changes in damage, blows and abilities are per second and the
median of the matchups. Heal lost: heals cut on the way in, in the matchups with a healer (Cleric).

| status (its burst) | feed /s | bursts a fight | a burst every | s in the burst state | share of fight it couldn't strike | own damage (share of all taken) | damage it dealt /s | blows landed /s | abilities used /s | heal lost | fight length (control 70 s) | worth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Poison (Sickened) | 24 | 4.4 | 6.2 s | 16 | 9% | 244 (47%) | -36% | -19% | 0% | - | 28 s | **+190%** |
| Bleeding (Haemorrhage) | 38 | 4.0 | 5.8 s | (instant) | 6% | 334 (58%) | -6% | -4% | -3% | 4% | 23 s | **+122%** |
| Burn (Scorch) | 23 | 5.6 | 6.3 s | (instant) | 9% | 230 (48%) | -2% | -4% | 0% | - | 36 s | **+70%** |
| Chill (Freeze) | 57 | 9.0 | 6.2 s | 15 | 35% | 129 (27%, Shatter) | -27% | -26% | -4% | - | 56 s | **+66%** |
| Cursed (Hexed) | 22 | 7.2 | 7.0 s | 15 | 7% | 47 (12%, Hex on itself) | -21% | -20% | 0% | 30% | 51 s | **+62%** |
| Shackles (Shackled) | 76 | 6.5 | 10.6 s | 25 | 44% | 0 | -36% | -37% | -37% | - | 68 s | **+57%** |
| Stagger (Knocked out) | 24 | 9.4 | 6.5 s | 23 | 47% | 0 | -25% | -28% | -7% | - | 61 s | **+51%** |
| Sleepy (Asleep) | 113 | 8.0 | 8.7 s | 22 | 38% | 0 | -24% | -26% | -16% | - | 69 s | **+38%** |
| Entangle (Rooted) | 113 | 9.1 | 6.5 s | 26 | 9% | 109 (24%) | -3% | -8% | +2% | - | 59 s | **+28%** |
| Fear (Terrified) | 113 | 9.2 | 8.6 s | 27 | 40% | 0 | -39% | -38% | -42% | - | 78 s | **+28%** |
| Shock (Overload) | 29 | 11.1 | 6.3 s | 9 | 43% | 0 | -17% | -17% | -6% | - | 70 s | **+22%** |
| Charm (Smitten / Enthralled) | 113 | 10.3 | 6.8 s | 1.3 | 30% | 0 | -15% | -18% | -5% | - | 70 s | **+20%** |
| Wet (Slip) | 10 | 11.3 | 6.1 s | 12 | 23% | 0 | -10% | -10% | -23% | - | 69 s | **+12%** |
| Radiance (Radiant) | 113 | 10.7 | 7.9 s | 32 | 41% | 0 | -34% | -34% | -18% | - | 84 s | **+10%** |
| Confused (Addled) | 113 | 7.0 | 8.4 s | 27 | 9% | 0 | +6% | +1% | **+79%** | - | 59 s | **-14% (helps)** |

Per-effect counts, per fight, at medium:
- **Cursed**: 10.6 of the fed side's blows turned by a Hex (123 damage that never landed), and 56 damage the Hexes
  turned back on the fed unit. Heals into a cursed unit: 30% lost (157 a fight in the Cleric matchups). Kept at 85
  (never Hexed): every heal is lost (Cleric tier III: 441 of 441).
- **Charm**: in 1v1 the burst is always **Smitten** (a side's last unit), so "medium" is a 1.5 s stun every 6.8 s.
  In the groups the charmed unit is **Enthralled**: 5 to 10 s a fight each, fighting for the other side. Charm's
  guard (from 35 up its blows on the charmer do nothing) is the real weapon: at low rate 25 blows a fight do nothing
  (279 damage), kept at 85 it is 85 blows (950 damage), every blow it had.
- **Radiance**: at medium the fed unit's 4.6 blows a fight are nulled while Radiant, but its glow makes its opponent
  Radiant too (2.7 opponent bursts a fight): the aura feeds everyone near it, foes included.
- **Bleeding**: Haemorrhage takes a third of what's left, so it does most at the start; at medium the build-up holds
  still under every blow, and the fed unit's own bleeding is 58% of all the damage it takes.

## Ranking by worth (every rate)
Median over the 26 matchups; the class columns are medians of their own matchups.

| status | low (12 s) | medium (6 s) | high (3 s) | kept at 85 (no burst) | flat 25 /s | heroes I | heroes III | enemies | groups (medium) |
|---|---|---|---|---|---|---|---|---|---|
| Poison | +107% | **+190%** | +197% | +79% | +189% | +172% | +154% | +198% | +119% |
| Bleeding | +88% | **+122%** | +167% | +45% | +107% | +126% | +158% | +149% | +100% |
| Burn | +56% | **+70%** | +105% | +73% | +74% | +78% | +40% | +140% | +105% |
| Chill | +21% | **+66%** | +124% | **+0%** | +41% | +66% | +37% | +153% | ≥+200% |
| Cursed | +37% | **+62%** | +142% | +33% | +76% | +58% | +49% | +86% | +70% |
| Shackles | +46% | **+57%** | (as medium) | +8% | +37% | +69% | +46% | +59% | +72% |
| Stagger | +17% | **+51%** | ≥+200% | +8% | +62% | +47% | +42% | +79% | +56% |
| Sleepy | +33% | **+38%** | (as medium) | +38% | +30% | +30% | +25% | +53% | +41% |
| Entangle | +31% | **+28%** | (as medium) | +37% | +27% | +26% | +16% | +63% | +40% |
| Fear | +13% | **+28%** | (as medium) | -3% (helps) | +13% | +11% | +32% | +23% | +28% |
| Shock | +18% | **+22%** | +38% | +10% | +16% | +13% | +14% | +43% | +34% |
| Charm | +66% | **+20%** | (as medium) | ≥+200% | +76% | +17% | +19% | +22% | +100% |
| Wet | +4% | **+12%** | +31% | +12% | +57% | +12% | +17% | +14% | +5% |
| Radiance | +33% | **+10%** | (as medium) | +133% | +33% | +15% | +6% | +12% | +10% |
| Confused | -5% (helps) | **-14% (helps)** | (as medium) | +54% | +5% | ≤-30% | ≤-30% | 0% | -6% |

Off the scale (≥+200%) at medium: Poison in 11 of 26 matchups, Bleeding 5, Chill 5, Burn 3. Burn, Poison, Chill and
Shock are each worth much more against enemies than against heroes (heroes have cleanses, and enemies' plain
fights are shorter to the end); Bleeding is about even.

## What stands out

**1. Poison is the strongest status, by far, at any rate.** Point for point (flat 25/s) it is worth +189%, the next
(Bleeding) +107%. Three things stack: it drains slowest (4 a second, so the build-up sits high and ticks for longer),
its burst (Sickened, 6 s) takes 10% of max health *and* 30% off everything the unit deals *and* slows it, and the
build-up comes back to 20 afterwards. The fed side dealt 36% less damage per second at medium. Kept at 85 and never
bursting, its ticks alone are still worth +79%.

**2. Damage-over-time is half of all the damage the fed side takes.** At medium, Burn's own damage is 48% of what the
fed side took, Poison's 47%, Bleeding's 58%. At these rates (22-38 points a second: about standing in a fire patch,
34 a second) the damage statuses out-damage the opponent's weapon.

**3. Radiance and Charm are stronger the less they burst.** Their bursts *free* the victim.
- Radiance kept at 85 (attacks 35% slower and up to 60% weaker, never bursting): **+133%**. Bursting every 8 s:
  **+10%**. The burst resets it to 0 and makes it immune for 7 s, and the Radiant glow then feeds the *opponent*
  radiance (it touches everyone close, foes too).
- Charm kept at 85: in 1v1 the unit **can't hurt its only foe at all** (every blow a heart): ≥+200%, it loses every
  fight. Bursting as often as it can (and Smitten each time): +20%. The burst resets it to 0 and 6 s of immunity, and
  in that time the guard is off.

**4. Confused helps the unit it is on.** At low and medium the fed side does so much *better* than the control that
10-12 of the 26 matchups are off the bottom of the scale (better than +30% damage of its own), almost all of them
heroes (the tier III median is off the bottom too). While Addled, a ready
ability goes off at random about once a second; heroes used **+79% more abilities per second** and dealt 6% more.
The hero brain leaves ready abilities unused a lot, and Addled fires them. With nobody beside it to hit (1v1), its
weapon hitting friends costs nothing. Against enemies (one ability, or none) it is about 0. Kept at 85 with no
burst (bad aim, lurching off, flailing at air) it costs a real +54%, so the build-up works and the burst undoes it.

**5. Chill's slow does nothing measurable.** Kept at 85 (up to 53% slower) and never freezing: **+0%**. All of
Chill's worth is the Freeze (3 s, can't act) and Shatter (26 a time). Freeze also gets harder each time (+45 to the
threshold, draining 4 a second), so above about one freeze every 11 s it can't keep up: at 145 points a second it
still froze only every 4 s.

**6. The building-up half of most statuses is small.** Kept at 85, never bursting: Shackles +8%, Stagger +8%,
Shock +10%, Wet +12%, Chill 0%, Fear -3% (helps). The ones whose build-up does carry them: Sleepy (+38%, the same
as bursting), Entangle (+37%, more than bursting), Cursed (+33%), Confused (+54%), Radiance and Charm (above), and the
three damage statuses.

**7. Fear's backing away helps the frightened.** Kept at 85 (backing off, facing the frightener) the fed side did
better, by more than the noise, in 9 of 26 matchups (Cleric and Bard at both tiers, Tower at both tiers, Twinfang
III, the golem, the orc) and is -3% overall. Terrified (can't attack, abilities
wasted) costs +28% at medium. Fear made fights longest (78 s at medium, 98 s kept at 85).

**8. Wet is cheap alone and feeds itself.** Its build-up only drops to 60 at a Slip, and the Slip leaves a puddle
that adds more: at 25 a second it Slips every 2.3 s (a 1 s stun each time), worth +57%. At 8-10 a second (just
over its 6 drain) it takes 23-47 s to Slip the first time. Kept at 85, abilities came back 39% slower, worth +12%.

**9. Shock and Stagger are cheap until fast.** Shock at medium (an Overload every 6 s, jolts in between) is worth
+22%, though the unit can't strike 43% of the fight: most of that time is short jolts that cost little. Stagger is
+51% at medium and off the scale at high: Knocked out takes 1.5x damage, and at 3 s a burst it is out 41 s a fight.

**10. A status can trigger a heal.** The Berserker at tier III was *helped* by Burn, Chill, Poison, Stagger and
Entangle at every rate (his margin +58% to +90% over the control). His Unstoppable fires whenever his chill + poison
+ burn + stagger passes 40 (or he's rooted), cleans it all off and, at tier III, heals 20%. Fed a status, he uses it
every 16 s; his mirror only uses it below 40% health. The Cleric (Cure) shows a smaller form of this with Chill.

**11. Groups.** Statuses that spread did not stand out in the groups at medium: Shock (arcs) +34% in groups vs +22%
overall, Fear (panic) +28% vs +28%, Burn (Scorch's blast) +105% vs +70%. Charm is the group status: Enthralled, a
charmed unit fights for the other side 5-10 s a fight (Paladin + Archer + Cleric at tier I: off the scale; three
wolves +123%), against +20% in 1v1 where it can only Smite.

## Pairs
Both at their medium rate, all 26 matchups.

| pair | together | first alone | second alone | note |
|---|---|---|---|---|
| Wet + Chill | +105% | +12% | +66% | **more than the two added**: Wet over 30 makes chill build 1.5x |
| Wet + Shock | +34% | +12% | +22% | about the sum (Wet's shock bonus needs a hero hook that adds it; a plain feed has none) |
| Burn + Chill | +101% | +70% | +66% | less than the sum: Burn melts chill and thaws a Freeze |
| Wet + Poison | +49% | +12% | **+190%** | **far less than Poison alone**: every soaking washes off half the poison |
| Cursed + Bleeding | ≥+200% (17 of 26 off the top) | +62% | +122% | both cut heals; together heals do nearly nothing |
| Shock + Stagger | +88% | +22% | +51% | more than the sum: jolts and knock-outs chain |

## Where a status simply doesn't take
All 201 kinds in battle mode (heroes, enemies, bosses) given 60 of each status once (`immunity.json`).
- **Takes none**: Burn 14 kinds (fire kinds: imps, hellhounds, fire spirits and spiders, Cinder, the Pit Lord, the
  Archfiend, flame turrets...), Chill 10 (Frost Mage, frost kinds, Winter Queen, Elder Ent), Poison **50** (the
  Foundry's machines, spirits, ghosts, golems, mummies, slimes of poison), Wet 5, Shock 5, Stagger 13 (turrets,
  traps), Radiance 15 (every angel kind, as designed), Cursed **45** (ghosts and banshees as designed, plus spirits,
  golems, mummies and every Foundry machine), Entangle 5 (the Griffon, ents, the Elder Ent), Charm 19 (every boss and
  mini-boss, as designed).
- **The golden rattler and the golden scarab take none of the first nine** (Burn to Entangle); they still take
  Charm and the round 13/15 five.
- **Nothing resists the round 13 and 15 five**: Confused, Sleepy, Bleeding, Fear and Shackles take in full on all
  201 kinds, bosses included (bosses only get shorter bursts). No kind has a resistance to any of them.
- **Takes more**: Burn on frost and wood kinds (to 160%), Chill on lizards, crocs, skeletons and fire kinds (to
  150%), Wet and Shock on every Foundry machine (130-140%).
- In these fights: rattlers (bone) take 80% Burn, 120% Chill and 35% Poison; the golem takes 60% Burn and Chill,
  no Poison and no Curse, 50% Wet. So golem rows for Poison and Curse are "does nothing", by design.
- Smitten instead of Enthralled: every 1v1 here (a side's last unit).

## What I couldn't measure
- **The real sources.** Statuses were poured in at set rates; how hard each enemy or hero actually applies them
  (an archer's frost arrow is 34, a fire patch 34 a second) was not tested. The worth here is per rate, not per
  enemy.
- **Spread separately**: Shock's arcs, Fear's panic and Scorch's blast land on the fed side, which is being fed
  anyway; their extra share in the groups isn't split out.
- **Addled hitting friends**: no hook marks a friendly blow from an Addled unit; it shows only in the group margins.
- **Bosses, elites and majors** were only in the "does it take" sweep, not in fights. Their shortened bursts
  (bosses 40%) are untested here.
- **The newer heroes' eight** (Whirled, Spun, Dirty, Targeted, Tracked, Trapped, Warded, Weakened) are outside this
  lane.
- Entangle's walking and attacking cuts carry no status tag; they were picked out by their colour.

## Proposals (for the designer; nothing here is built)
1. **Poison**: bring it into line with Burn and Bleeding. Options: drain 4 -> 6 a second, or Sickened's 30% weaker
   -> 15%, or drop the "comes back to 20". Any one should halve it; re-measure before choosing.
2. **Radiance and Charm**: decide whether the threat is the build-up or the burst. Today bursting frees the victim.
   Either let the burst keep some of the value (drop to 50, not 0), or shorten the immunity after it (Radiance 4 s,
   Charm 6 s), or soften the build-up (Radiance's 60% weaker -> 40%). For Charm the guard from 35 makes a lone unit
   helpless against its charmer; perhaps the guard should start nearer the burst (60) or only halve the blow.
3. **Confused**: Addled shouldn't make a hero better. Options: an Addled ability aims at a random spot (or at a
   friend) rather than at what it faces; or Addled fires nothing for heroes, only takes control of the weapon; or
   the random fire puts the ability on a longer cooldown.
4. **Chill**: its slow does nothing measurable. Either accept that (Freeze is the point) or make the slow matter
   (attacks slower too, as Radiance and Sleepy do).
5. **Berserker III's Unstoppable**: tie its status trigger to how bad the status is (a burst coming, or Sickened /
   Frozen), or give the 20% heal only when it fires below 40% health; as it is, enemies that apply any status give him
   a 20% heal every 16 s.
6. **Wet + Poison**: Wet washing off poison makes the two a bad pair for whoever applies both; fine if intended
   (water as a cure), worth knowing for enemy design.
7. **Resistances to the round 13/15 five**: consider giving the kinds that resist everything else (Foundry
   machines, spirits, golems, the golden rattler and scarab) resistances to Sleepy, Bleeding and Fear (a machine
   bleeding, a ghost terrified).
8. **For the tournament and later audits**: judge mirror fights on the health margin, not the win rate; a mirror
   flips on anything.

## Files
- `tools/audit/statuses/lib.mjs`: one fight with a status fed in; what it measures (the AUDIT hook).
- `tools/audit/statuses/calibrate.mjs`: picks the low/medium/high rates. `docs/audit/data/statuses/rates.json`.
- `tools/audit/statuses/plan.mjs`: the matchups and conditions. `run.mjs`: the fights (`--only`, `--seeds`,
  `--cond`, `--tag`). `analyze.mjs`: every table here (`node tools/audit/statuses/analyze.mjs [rank|measured|special|pairs|matchups|grid <status>]`).
- `tools/audit/statuses/immunity.mjs`: the "does it take" sweep. `docs/audit/data/statuses/immunity.json`.
- `docs/audit/data/statuses/fights-<matchup>.json` and `fights-<matchup>-flat.json`: every condition, every seed's
  win and margin, and the means. `summary.json`: every number above.
- Hook lines added to `js/sim.js` (null in the game, they only call the audit when it is listening): a blow nulled by
  a Radiant striker, by Charm's guard and by a Hex (`'nullified'`); a heal before and after Cursed and Bleeding cut
  it (`'healAsk'`, `'healCut'`).
