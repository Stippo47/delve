# Round 12 balance (lane D, branch balance2)

Three jobs, in order: the campaign curve, the bosses, the hero outliers. Numbers only: no kit, rule or design changed.
Tables: `r12-tier1.txt`, `r12-tier3.txt` (made by `bash tools/balance-all.sh <dir> 3 3`: 1,404 runs a tier).

**Read the tier III table with this in mind:** it plays every dungeon at the Warren's strength, and the Warren went from
x1.6 to x2.0 (below), so its rooms are lower across the board (4.6 a run against r11's 6.25). Compare heroes by "vs avg"
and shares, not by raw rooms. Tier I (the Wildwood's x0.75) is unchanged and comparable.

**Noise.** With three random partners and nine dungeons, a hero's "vs avg" moves by up to a room between two batches of
~50 runs (r11's tables, reps 2). The r12 tables use reps 3 (75-95 runs a hero) and still move by about half a room. A
boss's 10-fight win count moves by 2-3; every boss number below is from 20 fights.

## 1. The campaign curve

`node tools/runs.mjs --campaign 150 --seed N --v`, four seeds. Runs to beat each dungeon, counted from the run that
opened it (the party's average level when it fell in brackets):

Before (r11 / 0.12.0, seeds 1-3; "-" = never beaten in 150 runs):

| seed | Wildwood | Warren | Sewers | Crypt | Frost | Ember | Spire | Dunes | Foundry |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 12 | 2 | 4 | 52 | 9 | 11 | - (60 tries) | - | - |
| 2 | 9 | 2 | 6 | 22 | 11 | 14 | - (86 tries) | - | - |
| 3 | 14 (L14) | 4 (L17) | 8 (L22) | 29 (L34) | 10 (L41) | 41 (L54) | - (44 tries, to L62) | - | - |

After (r12 final numbers, seeds 1-4):

| seed | Wildwood | Warren | Sewers | Crypt | Frost | Ember | Spire | Dunes | Foundry |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 17 (L11) | 4 (L14) | 18 (L24) | 31 (L34) | 4 (L37) | 13 (L43) | 20 (L49) | 3 (L51) | 7 (L53), run 117 |
| 2 | 8 (L10) | 10 (L18) | 24 (L29) | 12 (L34) | 6 (L38) | 10 (L43) | 7 (L46) | 39 (L59) | 5 (L61), run 129 |
| 3 | 10 (L10) | 14 (L19) | 5 (L22) | 34 (L33) | 13 (L41) | 4 (L43) | 22 (L49) | 4 (L51) | 27 (L58), run 133 |
| 4 | 14 (L14) | 5 (L17) | 13 (L24) | 21 (L33) | 12 (L38) | 9 (L44) | 35 (L50) | 15 (L56) | 4 (L58), run 126 |
| median | 12 | 7.5 | 15.5 | 26 | 9 | 9.5 | 21 | 9.5 | 6 |

Every seed now beats all nine dungeons, the Foundry by run 117-133 at level 53-61 (the web is full at about 106
points a hero). Nothing falls on its first visit (3 runs at least). An earlier pass of these numbers (before the last
healer changes) had the Sewers at 11-15 runs, the Crypt 7-18, the Spire 7-32 and the Foundry 9-23: the Cleric's cuts in
job 3 made the Sewers and the Crypt longer, and I took both down a little afterwards (2.9 to 2.75, 3.3 to 3.2) without a
further four-seed check.

What changed (js/dungeon.js `RANK_MULT`, one number per dungeon):

| | Wildwood | Warren | Sewers | Crypt | Frost | Ember | Spire | Dunes | Foundry |
|---|---|---|---|---|---|---|---|---|---|
| r11 | 0.75 | 1.6 | 2.35 | 3.8 | 4.6 | 5.4 | 5.9 | 7.4 | 8.4 |
| r12 | 0.75 | 2.0 | 2.9 | 3.3 | 3.75 | 4.0 | 3.95 | 4.6 | 4.2 |

Why: the party's strength grows with its level and the web, roughly in step with the runs, so a steady curve needs each
dungeon about one step past the last. r11's steps were uneven: the Warren (x1.6) fell in 2-4 runs to a party grown on
the Wildwood, the Crypt's jump (x2.35 to x3.8) was a 22-52 run wall, and from the Spire on (x5.9-8.4) nothing fell: a
fully built trio (`--max`) won 0 there, and a fully built four won 1-3 of 4. The numbers also fold in how hard each
dungeon's own kinds are (the batches play every dungeon at one strength and the Spire, the Dunes and the Ember Deep
come out 2-4 rooms shorter than the rest): that is why the Spire sits a hair under the Ember Deep and the Foundry under
the Dunes. The Foundry falls at about level 55-60, well before the web is full (about 106 points a hero).

Kinds that hit too hard for their place (found with the new `S.byFoe` tally: who hurts the party, `js/stats.js`):
- Imp (Ember Deep): fireballs every 2.9-3.9 s (was 2.2-3.2). Imps did half of all the damage the party took there.
- Cherub (Spire): arrow 4 (was 5), holy rain 6 (was 9). Angel: blow 10 (was 12), smite every 4.5-6 s (was 3.5-5).
- Scarab (Dunes): 3 (was 4). Cobra: spray every 6-7.5 s (was 4.5-6).
- Automaton (Foundry): 11 (was 13). Foundry Smith: 16 to 13. The Foundry's floor 3 first rooms were where runs ended.

Still off: the spread is wide. Frost and the Ember Deep are short (3-16 runs) because the party arrives over-levelled
from the Crypt; the Spire and the Foundry are the longest (the Spire 4-32 runs, depending on the seed). A smoother curve
would need per-floor numbers, not per-dungeon ones. Nothing was beaten on its first visit in the final runs (3 at least).

Tool change: `tools/runs.mjs` called a room stuck after 300 s, but a weak party's room can run past 300 s legitimately
(enemies only wither from 240 s), and the campaign counted those as losses (9 in 150 runs on one seed). Now 420 s. The
`--v` line also shows a boss room's phase and how far down the boss got.

## 2. The bosses

`node tools/runs.mjs --boss --theme <t> [--bossid <id>] --level <L> --party <party> --n 20`, at the level and party the
final campaign meets each boss with (the Wildwood with two heroes, the Warren with three, the rest with the starter
four: paladin, archer, cleric, twinfang).

| boss | party, level | r11 (0.12.0) | r12 | fight (wins) |
|---|---|---|---|---|
| Elder Ent (Wildwood) | 2 heroes, L11 | 9/10 at L10, 82 s (not re-measured in r11) | **10/20** | 110 s |
| Goblin Chieftain (Warren) | 3, L17 | 4/10 at L15, 246 s | **8/20** | 218 s |
| Great Ooze (Sewers) | 4, L25 | 10/10 at L17, 188 s | **10/20** | 163 s |
| Bone King (Crypt) | 4, L33 | 0/10 at L33, 240 s (not in r11's list) | **11/20** | 179 s |
| Winter Queen (Frost) | 4, L38 | 2/10 at L41, 207 s | **9/20** | 162 s |
| Cinder (Ember Deep) | 4, L43 | 5/10 at L50, 182 s | **8/20** | 170 s |
| Gilded Seraph (Spire) | 4, L49 | 2/10 at L58, 272 s | **7/20** | 206 s (all 248 s) |
| Sand Wurm (Dunes) | 4, L54 | 1/10 at L62, 214 s | **12/20** | 248 s |
| Great Engine (Foundry) | 4, L58 | 0/10 at L66, 86 s | **8/20** | 213 s |

The levels are where the new campaign meets each boss (r11's were guesses past the Spire). Most of the change at the
late bosses is the dungeon numbers (a boss's health and blows scale with them); on top of that:
Elder Ent health 1350 to 1850, Sweep 28 to 25, Roots 18 to 17 (it was a 50-80 s fight); Chieftain health 1300 to 1000,
Chop 30 to 26, Charge 34 to 29, Spear 22 to 21; Ooze 1350 to 1050; Bone King 1100 to 1000; Winter Queen 1000 to 680;
Cinder 1200 to 1150; Seraph 950 to 1000; Sand Wurm 900 to 760 and every hit about a fifth softer (phase 2 ended every r11
fight); Great Engine 1000 to 880, Hammer 115 to 105, Claw 95 to 88, Fist and Clap 120 to 110. The Elder Ent is still
short (110 s); the Seraph a little hard (7/20), the Wurm a little easy (12/20). Each count is noisy by 2-3 wins in 20.

Each boss's numbers are in its file's table and its `docs/BOSS-<id>.md` (Health lines and the changed hits updated).

Poison on bosses (res 0.3, Cinder 0.25), checked with a poison party (plague doctor, twinfang, cleric,
paladin): the boss is sickened 5-13% of the fight and poison is 12-14% of the party's damage. That is a real but not a
leading share (the old 15% burst did most of the work against the Winter Queen), so 0.3 stays.

## 3. The heroes

Healers down (they carried every party):
- **Cleric**: Mend 25%/40% to 14%/18% over 4 s; Sanctuary 2.5% to 2% a half-second; Smite x2.4/x3.4 to x2.0/x2.8;
  Raiser (trait) three times faster at 40% to twice as fast at 20%; the new Light orb heals an ally it passes through
  for a quarter of its damage (vis3 had half).
- **Druid**: Rejuvenate 25%/38% to 13%/20%; the wolf x1/x1.3 damage to x0.8/x1.0, health x1.5 to x1.25 at II, 15 s to
  12 s; Barkskin 30% to 20%.
- **Quartermaster**: Resupply heals 15%/25% to 6%/12% and its cooldown 12 to 28 (as written, before CD_MUL); Well
  Stocked once a minute to every two; Flare +20% to +15%; Oil Blades III lifesteal 6% to 4%.
- **Shaman**: Healing Totem 3% to 2.2% a second. **Alchemist**: Elixir 15%/25% to 12%/20%.
- ROLE_TUNE support `heal` 0.75 to 0.62.

Weak ones up (their abilities did next to nothing):
- **Jester**: Juggling Act x0.8 to x1.6 a ball; Mock's dodge 35% to 60%; Befuddle 2.5/4 s to 3.5/5 s.
- **Gladiator**: Shield Rush's stab x1.6 to x2.2; Net x0.3 to x0.6, its bonus 30% to 40%.
- **Digger**: Dirt Fling x0.3 to x0.6; Burrow's burst x1.3 to x2.4; Spade Bat x1.3 to x2.2.
- **Haymaker**: Toss x0.6/x1.3 to x1.4/x2.2 (a big one x1 to x1.8); Fork Charge x0.8, x1/x1.4 to x1.4, x1.8/x2.4;
  Hard Work 5% to 8%.
- **Harpooner**: Reel In x1 to x2; Rogue Wave x0.6 to x1.1; Anchor Drop x1.8 to x2.8.
- **Rogue Bandit**: Pickpocket x0.8 to x1.5; Low Blow x0.7 to x1.3.
- **Witch**: Frog Hex +25% to +50% taken; Cursed Brew 9 to 20 curse a tick; Broom Ride's bolts x0.8 to x1.6; Crone
  25% to 40%.
- **Cultist**: Ritual Circle 10 to 28 curse a tick; Soul Candle's bursts x1.2 to x2.6; Black Candle 3 to 5.
- **Granny**: Reap x1.4 to x2.6; Hook x0.5 to x1.3; Grim 12% to 15%.
- **Twinfang**: Backstab x3.2 to x3.6; Fan of Knives x1.2 to x1.4. **Berserker**: Shockwave x0.8 to x1.0.
- **Bard**: War Song +25%/+40% to +40%/+50%. **Seer**: Foresight +25% to +35%.

Strong ones down: **Marksman** Aimed Shot x3 to x2.5 (text: "two and a half times"), Ricochet's first shot x1.3 to
x1.1; **Bearskin** Maul x2 to x1.7.

The Storm Mage after vis3's Zeus Bolt rework: -0.5 (tier I) / -0.1 (tier III): left as it is.

Final tables, heroes more than 1.2 rooms from the average:
- tier I: Bearskin +2.3, Quartermaster +2.2, Cleric +2.1, Marksman +2.0, Necromancer +1.3; Bard -1.7, Granny -1.7.
- tier III: Cleric +1.9, Quartermaster +1.3, Plague Doctor +1.2; Jester -1.3.
Before (r11): tier I had nine heroes past 1.5 (Druid +3.0, Cleric +2.7, Quartermaster +2.4, Shaman +2.3, ... Jester
-1.8); tier III eight (Druid +2.9, Cleric +2.6, ... Harpooner -1.7). The weak list is fixed; the healers are not.

Role shares after (tier I / tier III): tanks deal 24% / 23% of their party's damage and take 44% / 42%; shooters deal
43% / 41% (r11: 24% / 25%, 44% / 41%). Supports still do 52% / 58% of the party's healing. ROLE_TUNE: support `heal` 0.75 to 0.62 (the
healers carried every party; the non-healing supports aren't touched by it). Armour's rule, its numbers and CD_MUL are
unchanged.

## Still off
- **The healers' lead.** The Cleric and the Quartermaster (and the Druid at tier III) stay +1.2 to +2.2 after their
  healing was roughly halved: the rooms they add barely moved with each cut, so the heal amounts aren't what carries.
  Likely: the Quartermaster's free potion (Resupply and Well Stocked hand one out, and the batches give nobody any other,
  so in a real save it matters less: partly a batch artefact), the Cleric's revive (cut already) and the Druid's roots.
  A design call (say, no potion from Resupply to someone already given one that room) would do more than numbers.
- **Bearskin and Marksman at tier I** (+2.3, +2.0) and **Granny, Bard** (-1.7) moved little; two batches of the same
  code differ by about half a room a hero, so they need one more look at reps 4 or more.
- **The campaign's spread** (above): per-dungeon numbers can't make every seed even; the Crypt (12-34 runs) and the
  Spire (7-35) are the walls.
- **The batch dungeons**: at one strength the Dunes (4.0 / 2.8 rooms), the Spire and the Ember Deep stay the hardest;
  RANK_MULT folds that in for the campaign. The Dunes' jackals, mummies and serpent coils and the Spire's golems were
  not touched.
- **Changed after the final tables**: the Ooze, Winter Queen, Cinder, Seraph and Engine health (their boss rooms only).
