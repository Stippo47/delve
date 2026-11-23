<!-- short -->
Every ability was switched off, played alone, and dropped to tier I, in 15,696 dungeon runs and 98,100 battle fights.
The main number is **"minus one"**: what the hero loses when this ability is off and the other two stay at III.

- **Most abilities pull their weight.** 152 of the 177 make a clear difference to their kit somewhere. Across all
  heroes, the full kit clears 6.5 rooms against 4.3 bare, wins 82% of duels against 32%, and wins 83% of group fights
  against 13%.
- **The top ten:** Bread Toss (Grandpa Sickle), Hook (Granny Reaper), Frenzy (Werewolf, passive), Reap (Granny Reaper),
  Elixir (Alchemist), Unstoppable (Berserker), Juggling Act (Jester), Consecrate (Paladin), Sanctuary (Cleric), Dirty
  Trick (Bandit). Bread Toss is in a class of its own. Without it Grandpa Sickle wins 1% of duels, not 93%, and clears
  3.9 rooms, not 7.2.
- **The bottom:** Dark Bargain (Warlock) and Shield Wall (Bulwark) come out slightly *negative*: the hero does a little
  better without them. After them come Surround (The Mob), Smoker (Beekeeper), Blast Off (Grenadier), Jaw Trap (Trapper),
  Bound (Javelin Huntress), Valkyrie's Call (Valkyrie), Old Bones (Granny Reaper), Frost Nova and Ice Wall (Frost Mage),
  Roll (Archer) and Pavise (Crossbowman): all close to zero.
- **Worth nothing at all** (nothing clear when switched off *or* when played alone): Valkyrie's Call, Roll, Supply Crate
  (Quartermaster), Old Tales (Grandpa Sickle), Entangle (Druid). Only **Valkyrie's Call** is explained by not firing:
  it brings back a downed friend, so in battle it never fired (0 casts) and in the dungeon it fires about once a run. The
  other four do fire (Supply Crate 20 times a dungeon run, Entangle 17); what they do just doesn't change the outcome.
  Another 17 are worth something alone but nothing beside the other two (the kit already covers them).
- **Heroes carried by one ability** (switching it off takes away 60% or more of the whole kit's worth, in two of the
  three measures): Grandpa Sickle (Bread Toss), Werewolf (Frenzy), Alchemist (Elixir), Jester (Juggling Act), Frost Mage
  (Ice Shard), Quartermaster (Pot Helmet), Dame (Riposte), Shaman (Ancestors' Call), Tower (Charge), Twinfang (Fan of
  Knives), Griffon (Stormhammer).
- **Upgrades:** for 50 abilities, tiers II and III add nothing clear over tier I. For 33 of those the ability itself
  matters, so their upgrades are the ones that do nothing: Harvest, Hot Meal, Chain Lightning, Hibernate, Spear of the
  Sky, Deploy Turret, Spike Chain, Iaido and Bone Spear lead that list. Nine upgrades come out clearly *worse* in
  one measure. Six of those are single dungeon-room numbers that may be luck. Three are battle results. The big one is
  **Cure (Plague Doctor)**: with Cure at tier I the group fight is won 100% of the time, at tier III 67% (health margin
  86 points lower). Brace III does worse in duels than Brace I (16 points), and Shield Wall III does worse in the group
  fight (12 points).
- **The five flagged steps:** Stop the Clock and Gale change nothing at either step. Slow Time I to II nothing (II to III
  a sliver). Rewind I to II helps a little in the group fight, II to III nothing. **Nullify is not flat**: I to II and
  II to III both help clearly in duels, and II to III adds 13 points of duel wins.
- **Combos** (worth more together than apart): Rejuvenate + Call Wolf (Druid; perhaps the heal keeps the wolf up),
  Reap + Hook (Granny Reaper), Bread Toss + Harvest (Grandpa Sickle), Pounce with Frenzy and with Turn (Werewolf),
  Riposte + Challenge (Dame; likely: she taunts, then counters), Eldritch Beam + Awaken (Warlock), Raise Dead + Life Drain
  (Necromancer), Nullify + Chain Gang (Warden).
- **Real overlaps** (worse together than either alone, or close to it): Awaken + Dark Bargain (Warlock) is the clear one:
  in the group fight each alone lifts the Warlock 30 to 35 points of health, but both together only 12: less than
  either alone. Chain Lightning + Zeus Bolt (Storm Mage) and Earthquake + Spike Chain (Earth Mage) overlap partly. Most other
  "worth less together" pairs are a ceiling, not an overlap: one ability alone already wins the duel.
- **Some abilities cost the hero its duels but win the group fight:** Heartstring (Enchantress, 23 points of duel health
  lost, 28 gained in the group), Eldritch Beam (Warlock), Awaken (Warlock), Monstrosity (Alchemist), Turn (Werewolf).
  They are built for a party; alone they get in the way.
- **Found on the way, two problems outside balance:**
  1. A battle-mode bug: a lone hero that goes ethereal (Burrow, Broom Ride, Call the Flock, Bush, and the
     Shade's shadow: the Shadow Walk dash, Blackout III, her Fade trait) counts as gone, and the battle ends as a loss within seconds. See its own section.
  2. One seed is not one fight: unit ids come from a counter that is never reset, and ids feed movement, so the same
     seed plays differently depending on what ran before. That affects every seeded comparison tool. See "Noise".
- **Noise:** one ability's rooms worth carries an error of about 0.8 rooms (n=24 runs a build). That is too noisy to
  rank single abilities on rooms, so the score leans on the battle: duel health about 2 points, group health about 5
  points (30 seeds). The dungeon's per-second numbers (damage, damage spared, healing) are steadier and are in each
  hero's table.
<!-- /short -->

<!-- proposals -->
All proposals. Nothing here has been tried in the game.

1. **Fix the battle-mode ethereal loss** (a bug, not balance). In js/battle.js `fighting()`, let a unit with a hero kit
   count while it is ethereal, as tools/audit/worth/lib.mjs `fightingFix` does (`|| !!u.kit`). Or narrower: count it
   while one of its own ability states is on (burrowing, riding, hiding, shadow form).
2. **Reset the unit id counter per fight/run** for the test tools: export a `resetIds()` from sim.js, or keep the audit
   line (`AUDIT.idFrom`) and set it in tools/balance.mjs and tools/ability-worth.mjs. In the game it doesn't matter.
3. **Look at Cure III** (Plague Doctor). "Every ally near" makes the group fight clearly worse than Cure I. A guess
   to check: cleansing everyone at once clears friends' good states too, or fills the flask with weak statuses.
4. **Give Valkyrie's Call a use when nobody is down**, or let it fire in battle mode. As it is, a third of the
   Valkyrie's kit does nothing in most fights.
5. **Look at the zero-worth abilities that do fire:** Roll (Archer), Supply Crate (Quartermaster), Old Tales (Grandpa
   Sickle) and Entangle (Druid) fire often and change nothing measurable. Each wants a bigger effect or a new job.
6. **Look at Dark Bargain + Awaken** (Warlock). Together they are worse than either alone in the group fight. Dark
   Bargain costs a fifth of his health and, with the imp out, may trade his life for little. It is the lowest-ranked
   ability.
7. **Shield Wall** (Bulwark) is the second lowest. Planted and unmovable may keep him from reaching what he guards; its
   tier III makes group fights worse.
8. **Spread the weight in carried kits.** Grandpa Sickle without Bread Toss is close to bare, and Werewolf without Frenzy
   and Alchemist without Elixir are not far off. A designer call: either that is the hero's identity, or the other two
   abilities need more.
9. **Upgrades that do nothing:** the 33 listed under "Tier steps that change nothing" (Harvest, Hot Meal, Chain
   Lightning, Hibernate, Spear of the Sky and others) are the ones to give a tier II/III that changes something. Stop the
   Clock and Gale belong on that list for both of their steps.
10. **Before a tournament, rerun this with a party setting** (the hero plus two fixed friends in battle mode, with the id
    reset) if supports' worth matters: the dungeon's party numbers are too noisy to rank one ability.
<!-- /proposals -->

<!-- limits -->
- **Dungeon rooms are too noisy to rank one ability.** A run ends at its first wipe, so rooms cleared swing by several
  rooms between runs, and switching one ability off changes the run from the first cast. One ability's rooms worth has an
  error of about 0.8 rooms at 24 runs a build. Cutting that to a fifth of a room would take about 16 times the runs
  (some 100 proc-hours). The dungeon's per-second numbers are steadier, and the battle numbers steadier still; the
  combined score leans on whichever is surer.
- **The dungeon batch ran before the id counter was found** (see Noise). Its builds share party, dungeon and seed but
  not the exact fight. That makes it noisier, not wrong; a test with the counter reset showed rooms no steadier.
- **The battle panel is one choice of foe.** An ability that shines against swarms, bosses, flyers, burrowers or undead
  (Consecrate's undead burn) is only measured against what the panel and the crypt group hold. The dungeon runs cover the
  rest, but noisily.
- **Battle mode uses the whole tier III web** (stat nodes too). The dungeon uses the abilities alone at hero level 1, as
  tools/ability-worth.mjs does. Neither has trinkets or potions. Real players' builds sit somewhere between.
- **The health margin tops out** at +100 (won without a scratch). For heroes whose one ability already wins the duels,
  the second and third can't show much there. That pulls their "minus one" down and makes pairs look like overlaps.
  The group fight, harder, is less affected.
- **Abilities that need a friend of a certain kind** (one that heals a hurt friend, revives a downed one, buffs a
  shooter) have one friend (a Tower) in the group fight and two random heroes in the dungeon. They are under-measured in
  the duels by design: the duels say what the hero can do alone. Valkyrie's Call can't be measured in battle at all.
- **Tier II on its own** was measured only for the five flagged abilities. For the rest, "I to III" says whether the
  whole upgrade path matters, not which step does.
- **Cooldowns run during lasting effects** (docs/audit/cooldowns.md). All numbers here use today's rule; an ability
  whose cooldown would get longer under a new rule would be worth less than shown.
- **Passive abilities** (Frenzy, Substitution, Befuddle, Old Bones) are never cast, so the cast check can't show whether
  they triggered. Their worth is measured the same way (on or off).
- **The "Dmg share" column** counts only damage the hero's own ability did, so an ability that works through friends
  (a buff, a heal, a taunt) shows 0% there while its outcome numbers show its worth.
<!-- /limits -->
