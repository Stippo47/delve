# Round 12 balance (lane D, branch balance2)

Three jobs, in order: the campaign curve, the bosses, the hero outliers. Numbers only: no kit, rule or design changed.
Tables: `r12-tier1.txt`, `r12-tier3.txt` (made by `bash tools/balance-all.sh <dir> 3 3`: 1,404 runs a tier).

**Read the tier III table with this in mind:** it plays every dungeon at the Warren's strength, and the Warren went from
x1.6 to x2.0 (below), so its rooms are lower across the board (4.8 a run against r11's 6.25). Compare heroes by "vs avg"
and shares, not by raw rooms. Tier I (the Wildwood's x0.75) is unchanged and comparable.

**Noise.** With three random partners and nine dungeons, a hero's "vs avg" moves by up to a room between two batches of
~50 runs (r11's tables, reps 2). The r12 tables use reps 3 (75-95 runs a hero) and still move by about half a room. A
boss's 10-fight win count moves by 2-3; every boss number below is from 20 fights.

## 1. The campaign curve

`node tools/runs.mjs --campaign 150 --seed N --v`, four seeds. Runs to beat each dungeon, counted from the run that
opened it (the party's average level when it fell in brackets):

CAMPAIGN_TABLE

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

BOSS_TABLE

Each boss's numbers are in its file's table and its `docs/BOSS-<id>.md` (Health lines and the changed hits updated).

Poison on bosses (res 0.3, Cinder 0.25): `bal`-style check with a poison party (plague doctor, twinfang, cleric,
paladin): the boss is sickened 5-13% of the fight and poison is 12-14% of the party's damage. That is a real but not a
leading share (the old 15% burst did most of the work against the Winter Queen), so 0.3 stays.

## 3. The heroes

HERO_LIST

Role shares after (tier I / tier III): tanks deal 24% / 23% of their party's damage and take 44% / 42%; shooters deal
43% / 41%. Support healing is still 53% / 58% of the party's healing. ROLE_TUNE: support `heal` 0.75 to 0.62 (the
healers carried every party; the non-healing supports aren't touched by it). Armour's rule, its numbers and CD_MUL are
unchanged.

STILL_OFF
