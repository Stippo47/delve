<!-- short -->
_(to write)_
<!-- /short -->

<!-- proposals -->
_(to write)_
<!-- /proposals -->

<!-- limits -->
- **Dungeon rooms are too noisy to rank one ability.** Switching any one ability off changes the whole run from the first
  room (who is where, who gets hit), so the same seed does not give a matched pair: the two runs are about as different
  as two random runs, and rooms cleared spread widely (a wipe ends a run early). At these sample sizes a single ability's
  rooms worth has an error of roughly a room. To get it to a fifth of a room would take about 25 times the runs (some
  150 proc-hours). The dungeon's per-second numbers (the hero's damage, damage the party is spared, healing) are steadier,
  and the battle numbers steadier still; the combined score leans on whichever is surer.
- **The battle panel is one choice of foe.** An ability that shines against swarms, bosses, flyers, burrowers or undead
  (Consecrate's undead burn) is only measured against what the panel and the crypt group hold. The dungeon runs cover the
  rest, but noisily.
- **Battle mode is the whole tier III web** (stat nodes too), the dungeon is the abilities alone at hero level 1, as
  tools/ability-worth.mjs does. Neither has trinkets or potions. Real players' builds sit somewhere between.
- **Abilities that only work with a friend of a certain kind** (one that heals a hurt friend, revives a downed one, buffs a
  shooter) have one friend (a Tower) in the group fight and two random heroes in the dungeon. They are under-measured in the
  duels by design: the duels say what the hero can do alone.
- **Tier II** was measured on its own only for the five abilities flagged earlier. For the rest, "I to III" says whether
  the whole upgrade path matters, not which step does.
- **Cooldowns run during lasting effects** (docs/audit/cooldowns.md). All numbers here are with today's rule; an ability
  whose cooldown would get longer under a new rule would be worth less than shown.
- **Ally abilities that act on the friend's numbers** show up in the outcome (health, win, rooms) but not in the hero's own
  damage share; the "Dmg share" column only counts damage the hero's own ability did.
<!-- /limits -->
