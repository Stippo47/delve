# Stagger and Shock against bosses (round 16, the lead)

The designer: "stagger was quite good against bosses... watching Warhelm, maybe a mix of stagger and shock?"
Test: `node tools/audit/boss-stagger.mjs` (battle mode, one hero at tier III and three mates, against all 19 bosses,
10 seeds; the boss made immune to Stagger, to Shock, or to both). Every fight was won, so the measure is how long the
boss lasts.

| party | as it is | no Stagger | no Shock | neither | boss stunned (as is) | KOs a fight | Overloads a fight |
|---|---|---|---|---|---|---|---|
| Warhelm III + Paladin, Archer, Cleric (tier II) | 17.4 s | 19.7 s | 19.0 s | 21.6 s | 6.4 s | 3.2 | 9.6 |
| Warhelm III + the same at tier I | 22.2 s | 25.0 s | 24.8 s | 27.8 s | 7.2 s | 3.0 | 12.3 |
| Berserker III + the same at tier I | 27.7 s | 27.4 s | 27.5 s | 27.4 s | 0.9 s | 0.4 | 0 |
| Paladin III + Archer, Cleric, Pyromancer (tier I) | 42.1 s | 43.6 s | 42.1 s | 44.0 s | 4.0 s | 1.7 | 0 |

- It is both, about equally, and they add up: with Warhelm the boss is stunned about a third of the fight. Take
  either away and the fight runs about 12% longer; take both and 25% longer, which is exactly where a Berserker party is.
  Warhelm's whole edge on bosses is this control.
- Shock: about one Overload every two seconds on a boss (a 0.4 s stun each, plus 0.1 s jolts). Storm Born's fists and
  hammer feed it far faster than it drains.
- Stagger: about three KOs a fight, 1.2 s each, and the boss takes 1.5x damage while down (about 600-700 damage a fight).
- Shock and Stagger have no rest after a burst. The round 13 and 15 statuses (Charm, Confused, Sleepy, Bleeding,
  Fear, Shackled) and Entangle and Radiance all do; that is why only these two can chain on a boss.
- Battle-mode bosses are short fights here (17-44 s); the dungeon's boss rooms are longer, so the share may differ there.

## 1v1: Warhelm alone against each boss (the designer: "What about 1v1 with boss?")
`node tools/audit/boss-stagger.mjs --mates none --htier <t> --seeds 6` (19 bosses x 6 seeds each way).

| Warhelm alone | as it is | no Stagger | no Shock | neither |
|---|---|---|---|---|
| tier II: wins | 74% | 71% | 62% | 54% |
| tier II: his health left | 51% | 48% | 40% | 36% |
| tier III: wins | 100% | 100% | 97% | 92% |
| tier III: his health left | 85% | 80% | 70% | 60% |
| tier I: wins | 27% | 28% | 25% | 27% |

- Alone the two are worth 20 points of win rate at tier II, Shock the larger part (12 of the 20).
- Tier I: no difference; his tier I Storm Born is short and only overloads a boss about 1.7 times a fight.
- A wider finding: at tier III every hero tried wins every 1v1 against every boss in battle mode with 95%+ health left
  (Archer 13 s a fight, Berserker 14 s, Samurai 15 s, Paladin 35 s). Battle mode's tier III is the whole skill web
  out to that ring, stat nodes included, against a boss at its base strength. Boss fights in tournaments would need
  the bosses scaled up, or be read at tier I and II only.
