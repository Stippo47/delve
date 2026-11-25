# Round 18, lane preview18: the Book's ability previews

The designer, on the little looping scene that shows what a hero's ability does at the tier picked: "Many abilities
aren't shown at all, aren't in the right scenario to show themselves off, don't change between tiers when sometimes
they should, the dummies don't attack like how an enemy would, I don't want the heroes to just take invisible damage.
I want to see how each ability works in the best way possible."

## What was wrong (the audit)

Every hero ability (60 heroes x 3 = 180) was played at tiers I, II and III, two loops each, with the same dice for
every tier, by `tools/preview-measure.mjs` (the same ruler for the old stage and the new one; the old numbers come
from running it on `js/preview-sim.js` as it was at `fad5a5c`). The full per-ability table is at the end.

How the old stage worked: the hero was pinned to one spot, three or six straw targets stood in front of it (never
moving, never striking back, topped up when low), and the ability was cast by the stage at 0.45 s whatever was going
on. "When a blow is coming" abilities were shown against a straw target with no weapon that "hit" the hero every
0.45 s without moving (`show.hitme`); "a hurt friend" was a friend set to 35% health with nothing hitting it.

| Problem (abilities, of 180) | Before | After |
|---|---:|---:|
| Not shown at all: a loop where it drew nothing of its own and touched no one | 3 | 0 |
| Drawn but reached no one (nothing it made touched a foe or a friend) | 19 | 3 (Roll, Bush, Turn: what they do is to the hero itself) |
| Wrong scenario: the game's own scorer (its `score` / `reflex`) would not have used it there | 35 | 0 |
| Chosen by the hero's own brain, as in a run (loops) | 0 of 1080 | 1052 of 1080 (the rest: the stage cast it, scorer agreeing) |
| Tiers alike, the old tool's measure (two tiers make the same count of effects, shots, units, zones) | 57 | 18 |
| Tiers alike, the new finer measure (same foes reached, statuses and their amounts, buffs and their terms, heals, summons, sizes, holds) | 29 | 19 |
| Tiers that played the very same loop (nothing on the stage changed with the tier) | 0 | 0 |
| Straw targets standing in for enemies (never moving, never attacking) | 180 | 0 |
| Abilities where the hero or a friend took blows from nothing seen | 12 (656 blows) | 0 |
| Traits: blows from nothing seen | 4 (Raiser, Iron Will, Valhalla, Spare Second) | 0 |
| Trinkets and potions: blows from nothing seen | 33 (every one with a fight: the wearer was hit by a target with no weapon that never moved) | 0 |
| Threw / a loop where the move never fired / not offered in the Book (all previews) | 0 / 0 / 0 | 0 / 0 / 0 |

Blows from nothing, before: Old Bones (health set to 1, then a blow from no one), Parry, Riposte, Wing Guard,
Hibernate, Inner Peace, Substitution, Bush, Befuddle, Focus, Scatter (a straw target with no weapon "striking" the hero
without moving), Rewind (the friend struck by no one), Pile On and Chain Gang (a blow with no source). In the traits,
the friend a reviver lifts fell to no one (Raiser, Chooser of the Slain, Valhalla), Iron Will's hero had his health set
to a quarter, and Spare Second's fatal blow came from a sword target that wasn't swinging. In the trinkets and potions
the wearer was hit every 0.6 s by a plain target that never moved, and the Hourglass's drop and the potion's low health
were set, not struck.

## How the previews work now

`js/preview-scenes.js` is the scene table (data only); `js/preview-sim.js heroStage` plays it.

- **Real enemies.** Every enemy in an ability or attack preview is a real kind (`KINDS`: hobgoblin, goblin, orc,
  skeleton, skeleton archer, orc shaman, and a spider, a hellhound and a frost wolf whose bites carry poison, fire and
  frost) running its own brain: it walks up, swings, shoots, winds up and telegraphs (the orc's charge), and throws
  spells (the shaman's fireballs). They have 2.6 times their health and hit at 0.6 times, and a hook keeps them up at a
  quarter (and they mend slowly when low) unless the scene marks one `mortal` (a kill to finish, a body to raise). An
  enemy a scene sets `on` someone (the hero, or a friend) is held to it.
- **No damage from nothing.** Whatever hurts the hero or a friend is an enemy's blow or shot, a zone, a status, or a
  body knocked into it. A scene that needs the hero hurt starts it hurt with its attackers already on it; a friend in
  trouble starts low with an enemy on it; a friend who falls (Valkyrie's Call) or is struck (Rewind) is struck by an
  enemy that turns, winds up and swings; Old Bones's fatal blow is the same. The hero is never let fall (a hook leaves it
  on a scrap of health, after its own ways of not falling have had their say), friends are held above 14%.
- **The ability goes off in the situation it is made for.** The scene is set, the ability comes ready at 0.3 s, and
  the hero's own brain (sim.js `kitThink` / `kitReflex`) uses it when its score says so, as in a run. Until then the
  hero holds its ground and its attack, so the ability is the first thing it does; after, it moves and fights as it
  would. If the brain hasn't used it by `forceAt` (2.4 s) the stage casts it at the target the ability scores highest.
  Its cooldown then runs as in a run, so a tier that goes again at once (a second lunge, a second leap, a kill that
  resets Backstab) does. Abilities that only work through a hook (Substitution, Befuddle, Frenzy, Old Bones) are left to
  the fight: they show when the hook acts.
- **A scene per ability.** `SCENES` holds the recipes: `duel`, `pair`, `front` (a group coming at the hero's front),
  `ring` (enemies closing from every side), `pack` (a group coming from far off), `line` (one behind the other, held in
  line until it goes), `spread` (spread over the yard: jumps and picks), `shooters`, `casters` (spells), `hurtFriend`,
  `hurtFriends`, `party`, `partyFight` (friends already fighting), `downedFriend`, `incoming` (a heavy blow coming),
  `incomingShots`, `selfHurt`, `statusFriend`, `corpse` (bodies on the floor), `lowFoe` (one nearly dead), `busyFoe`
  (an enemy fighting someone else). `ABILITY_SCENE` picks one per ability with overrides (`foeKind: 'undead'` for
  Smite, `wall` to slam into, `oil` puddles for Flame Wall III, `addFoes`, `hp`, `secs`, `holdFoes`, `forceAt`...). A new
  ability with no entry gets a scene from its kits `show` (`sceneFor`). Friends are real heroes with their abilities
  held at tier I (so Encore, Old Tales and the Supply Crate see abilities a friend would use).
- **Tiers.** Each scene is built for what tier III needs (a second hurt friend for Mending Ray, two friends under fire
  for Bubble Shields, a wall for Pinning Bolt, oil for Flame Wall, a kill for Backstab), so tiers I and II show less on
  the same stage. The loop runs as long as the longest time the ability's words name at that tier, plus a beat.
- **Traits and trinkets** keep their round 14 scenes (the designer then: give the targets weapons and let them use
  them), but every blow now comes from a target that swings or shoots: the felling blow in Raiser, Chooser and Valhalla
  comes from a sword target beside the friend, Iron Will and Bushido are struck low by the hammer or sword in front of
  them, Spare Second and From the Wild are struck down by a visible swing, the trinket wearer's targets hold swords and
  swing before each blow lands, the potion drinker is shot low by two bows across the yard, and a felled target can now
  fall again (it kept sim.js's `dying` flag, so Bone Charm's kills stopped after the first).

## The check

`node tools/preview-check.mjs` keeps its three failing counts (threw, a loop where it never fired, not offered) and
now reports, for every ability at tiers I-III: when it first went off (0.7 s on average) and how often a loop, a loop
where it didn't go within 2.5 s, not shown / reached no one, wrong scenario, cast by the stage, tiers identical, tiers
that differ only in where things went (both with each tier's words), and blows on the hero side with nothing seen
behind them across every hero-side stage (abilities, attacks, traits, trinkets, potions). `--table` prints one line
per ability with each tier's first go, times, and whether the brain or the stage cast it. Current:

- 2253 previews: threw 0, never fired 0, not offered 0 (one status, Silenced, still shows "no preview yet": not this lane's)
- abilities: first go 0.65 s on average, 1.0 goes a loop, the brain chose it in 1052 of 1080 loops (the stage cast
  the rest: Leap III's second leap, Hook, Pot Helmet, the scorer agreeing each time); a loop where it didn't go within
  2.5 s: 1 (Bubble Shields waits for an orc shaman's first fireball, 4.4 s in one loop), not shown 0, reached no one 3,
  wrong scenario 0, tiers identical 0, tiers differing only in where things went 19, blows from nothing 0
  (`tools/preview18/check.txt`, after `git merge main`)
- `node tools/battles.mjs`: 528 battles, 0 problems (8 ran out of time)

## Still weak in preview, and why

- **Tier changes that are a number, a time or a cooldown.** "Ready again much sooner" (Substitution III, Befuddle,
  Bound III), "once a room", a threshold ("Below a third", Sacrifice II), a shield's size (Spear of the Sky 28 / 45),
  a heal's size (Frenzy, Grog), or a time longer than a loop (Turn 10 / 14 s, Beehive 8 / 12 s, Tinker 9 / 12 s): the
  stage shows them only as a bar moving more, a ring lasting longer, or not at all. The caption under the stage says it.
- **Tiers that differ only in where things went** (the check lists them with their words): Shield Wall III's shove,
  Cyclone's stronger pull and Rogue Wave's bigger wave are positions by nature; Chain Lightning I~II, Ice Shard I~II,
  Ricochet I~II, Iaido I~II, Aimed Shot I~II, Bound II~III, Smoker, Beehive, Pavise I~II, Blast Off I~II, Ill Omen I~II,
  Dirt Fling I~II and Heartstring II~III reach the same foes with the same statuses in the loop measured; what the tier
  adds (more jumps, harder chill, a pierce, faster reload, the thread jumping on) is there but small, or depends on how
  the fight falls that loop.
- **A real fight is not the same twice.** Enemies path round each other, so a line or a group isn't always where the
  ability wants it; scenes hold a line until the ability goes, but a later tier's extra (Dash III's second dash, Leap
  III's second leap) only comes when the fight gives it a reason. Leap III's second leap and Hook III's are cast by the
  stage at the best target when the brain wouldn't (`followAt`), which the check counts as "cast by the stage".
- **Roll, Bush, Turn** reach no one: what they do is to the hero (out of reach, hidden, a wolf). That is shown.
- **The enemies' own previews** (the Book's monster pages) still play against blue straw targets; this lane changed the
  heroes' side only.

## Clips

`docs/clips/preview18/` (git-ignored), recorded off the hero page's own preview player by
`tools/preview18/clips.mjs` (headless Edge in this lane's own temp folder), each watched frame by frame:

- `heal-cleric-mend-III.mp4`: two friends being hit by hobgoblins; two mending rays (tier III's split).
- `guard-paladin-guard-III.mp4`: a friend under a hobgoblin's blows; the guard chain, then he goes to it and fights.
- `group-wildmane-cleave-I.mp4`: closing in from every side; the spin catches the ring.
- `parry-oldguard-pommelStrike-II.mp4`: the orc winds up and swings, skeleton archers shoot; the guard catches both.
- `dodge-ninja-substitution-II.mp4`: the orc's blow lands on a log; the smoke blinds the ones beside it.
- `summon-engineer-deployTurret-I.mp4` and `-III.mp4`: one turret, then two, as the pack comes in.
- `shooters-crossbowman-pavise-III.mp4`: three pavises against two skeleton archers' arrows.
- `aura-bard-warSong-III.mp4`: the party fighting an incoming group; the song on all three.
- `bubble-waterMage-bubbleShield-II.mp4`: orc shamans throw fireballs at two friends; two bubbles stop them.
- `revive-valkyrie-valkyrieCall-I.mp4`: the friend is struck down by the orc in view; she flies to it and lifts it.
- `lethal-granny-oldBones-III.mp4`: the fatal blow lands, she shrugs it off and the quake throws them back.
- `trait-warhelm-ironWill.mp4`: the hammer strikes him low; below 30% the staggers stop taking.

## Files

- `js/preview-scenes.js` (new): the scene recipes and each ability's scene.
- `js/preview-sim.js`: `heroStage` rewritten (real enemies, friends, scripted blows that are seen, brain-cast with a
  forced fallback and follow-ups); trait and trinket stages: no blow from nothing; `tendDummy` clears `dying`.
- `tools/preview-measure.mjs` (new): the ruler. `tools/preview-check.mjs`: the report above.
- `tools/preview18/`: the before / after measurements (`before.txt`, `after.txt`, `*.json`), the clip recorder, the
  audit table builder and the one-off probes used along the way.

## Every ability, before and after

Before: what it was staged on, then the problems the ruler found. After: its scene, when it first went off at tiers
I, II and III ("stage": cast by the stage; "hook": shown by its hook acting), then the problems left. "Tiers differ only
in positions" means the tier changed the loop but not what the ruler counts (see above).

| Hero | Ability | Before: staged on | Before | After: scene | After: first go (I, II, III) | After |
|---|---|---|---|---|---|---|
| Paladin | Shield Bash | near 3 targets | ok | front | I 1.8s, II 1.0s, III 1.8s | ok |
| Paladin | Guard | near 3 targets; a friend at 35%, hit by no one | reached no one; tiers differ only in positions I~II | hurtFriend | I 1.0s, II 1.0s, III 1.0s | ok |
| Paladin | Consecrate | near 6 targets; a friend at 35%, hit by no one | ok | ring (undead) | I 0.3s, II 0.3s, III 0.3s | ok |
| Tower | Hold the Line | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Tower | Charge | far 6 targets | ok | line + wall | I 0.3s, II 0.3s, III 0.3s | ok |
| Tower | Ground Pound | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Archer | Barrage | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Archer | Frost Arrow | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Archer | Roll | near 6 targets | reached no one; WRONG SCENE (score 0); tiers differ only in positions I~II | incoming | I 1.1s, II 1.1s, III 1.1s | reached no one |
| Twinfang | Backstab | far 3 targets | WRONG SCENE (score 0) | busyFoe | I 0.3s, II 0.3s, III 0.3s | ok |
| Twinfang | Dash | far 6 targets | reached no one; WRONG SCENE (score 0); tiers differ only in positions II~III | busyFoe | I 0.3s, II 0.3s, III 0.3s | ok |
| Twinfang | Fan of Knives | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Wildmane | Rage | near 6 targets | ok | selfHurt | I 0.3s, II 0.3s, III 0.3s | ok |
| Wildmane | Leap | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Wildmane | Cleave | near 6 targets | WRONG SCENE (score 0) | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Berserker | Shockwave | near 6 targets | ok | line | I 0.3s, II 0.3s, III 0.3s | ok |
| Berserker | Whirl | near 6 targets | ok | ring | I 0.3s, II 0.3s, III 0.3s | ok |
| Berserker | Unstoppable | near 6 targets | WRONG SCENE (score 0); tiers differ only in positions II~III | selfHurt | I 0.3s, II 0.3s, III 0.3s | ok |
| Granny Reaper | Reap | near 6 targets | ok | ring | I 0.3s, II 0.3s, III 0.3s | ok |
| Granny Reaper | Hook | far 3 targets | ok | spread | I 2.4s (stage), II 1.0s, III 1.0s | ok |
| Granny Reaper | Old Bones | near 6 targets; health set to 1, then a blow from nowhere | reached no one; WRONG SCENE (score -); 12 BLOWS FROM NOTHING | ring | I 1.2s (hook), II 1.2s (hook), III 1.2s (hook) | ok |
| Pyromancer | Fireball | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Pyromancer | Flame Wall | far 6 targets | ok | pack + oil | I 0.7s, II 0.7s, III 0.7s | ok |
| Pyromancer | Inferno | near 6 targets | ok | ring | I 0.3s, II 0.3s, III 0.3s | ok |
| Frost Mage | Ice Shard | far 6 targets | ok | line | I 0.7s, II 0.7s, III 0.7s | tiers differ only in positions I~II |
| Frost Mage | Frost Nova | near 6 targets | ok | ring | I 0.3s, II 0.3s, III 0.3s | ok |
| Frost Mage | Ice Wall | far 6 targets | reached no one; WRONG SCENE (score 0) | pack | I 1.0s, II 1.0s, III 1.0s | ok |
| Storm Mage | Chain Lightning | far 6 targets | ok | spread | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II |
| Storm Mage | Thunderclap | far 6 targets | ok | pack | I 0.7s, II 0.7s, III 0.7s | ok |
| Storm Mage | Zeus Bolt | far 6 targets | ok | spread | I 0.3s, II 0.3s, III 0.3s | ok |
| Cleric | Mending Ray | far 3 targets; a friend at 35%, hit by no one | reached no one | hurtFriends | I 0.3s, II 0.3s, III 0.3s | ok |
| Cleric | Sanctuary | near 6 targets; a friend at 35%, hit by no one | tiers differ only in positions II~III | party | I 0.3s, II 0.3s, III 0.3s | ok |
| Cleric | Smite | far 3 targets | ok | duel (undead) | I 0.3s, II 0.3s, III 0.3s | ok |
| Bard | War Song | near 6 targets; a friend at 35%, hit by no one | ok | party | I 0.3s, II 0.3s, III 0.3s | ok |
| Bard | Lullaby | near 6 targets | ok | front | I 1.0s, II 1.0s, III 1.0s | ok |
| Bard | Encore | far 3 targets; a friend at 35%, hit by no one | reached no one; WRONG SCENE (score 0); tiers differ only in positions II~III | partyFight | I 0.3s, II 0.3s, III 0.3s | ok |
| Druid | Entangle | far 6 targets | WRONG SCENE (score 0) | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Druid | Rejuvenate | far 3 targets; a friend at 35%, hit by no one | reached no one | hurtFriends | I 0.3s, II 0.3s, III 0.3s | ok |
| Druid | Call Wolf | near 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Necromancer | Raise Dead | far 6 targets | ok | corpse | I 0.3s, II 0.3s, III 0.3s | ok |
| Necromancer | Life Drain | far 6 targets | WRONG SCENE (score 0); tiers differ only in positions I~II | pack | I 0.7s, II 1.0s, III 0.7s | ok |
| Necromancer | Bone Spear | far 6 targets | ok | line | I 0.3s, II 0.3s, III 0.3s | ok |
| Plague Doctor | Miasma | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Plague Doctor | Cure | far 3 targets; a friend at 35%, hit by no one | ok | statusFriend | I 0.3s, II 0.3s, III 0.3s | ok |
| Plague Doctor | Gas Form | near 6 targets | reached no one; tiers differ only in positions II~III | selfHurt | I 0.3s, II 0.3s, III 0.3s | ok |
| Old Guard | Great Sweep | near 6 targets | ok | front | I 1.0s, II 0.7s, III 1.0s | ok |
| Old Guard | Rally | near 6 targets | tiers differ only in positions II~III | partyFight | I 0.3s, II 0.3s, III 0.3s | ok |
| Old Guard | Parry | near 6 targets; blows from a target with no weapon; arrows from a target | WRONG SCENE (score 0); 72 BLOWS FROM NOTHING | incomingShots | I 0.3s, II 0.3s, III 0.3s | ok |
| Dame | Riposte | near 6 targets; blows from a target with no weapon | WRONG SCENE (score 0); 46 BLOWS FROM NOTHING | incoming | I 0.3s, II 0.3s, III 0.3s | ok |
| Dame | Challenge | near 6 targets; a friend at 35%, hit by no one | ok | hurtFriend | I 0.3s, II 0.3s, III 0.3s | ok |
| Dame | Disarm | near 3 targets | ok | front | I 1.4s, II 1.0s, III 1.0s | ok |
| Griffon | Swoop | far 6 targets; a friend at 35%, hit by no one | ok | hurtFriend | I 0.3s, II 0.3s, III 0.3s | ok |
| Griffon | Stormhammer | far 6 targets | ok | spread | I 0.7s, II 0.7s, III 0.7s | ok |
| Griffon | Wing Guard | near 6 targets; blows from a target with no weapon | WRONG SCENE (score 0); 72 BLOWS FROM NOTHING | incoming + wall | I 0.3s, II 0.3s, III 0.3s | ok |
| Bulwark | Brace | near 6 targets | WRONG SCENE (score 0) | pack | I 0.7s, II 0.7s, III 0.7s | ok |
| Bulwark | Shield Wall | near 6 targets | WRONG SCENE (score 0); tiers differ only in positions II~III | party | I 0.7s, II 0.7s, III 0.7s | tiers differ only in positions II~III |
| Bulwark | Impale | near 3 targets | ok | duel | I 1.0s, II 1.0s, III 1.0s | ok |
| Bearskin | Maul | near 3 targets | ok | pair | I 1.4s, II 1.8s, III 1.8s | ok |
| Bearskin | Hibernate | near 6 targets; blows from a target with no weapon | WRONG SCENE (score 0); tiers differ only in positions I~II; 42 BLOWS FROM NOTHING | selfHurt | I 0.7s, II 0.7s, III 0.7s | ok |
| Bearskin | Bear Claws | near 3 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | ok |
| Warhelm | Thunder Blow | near 3 targets | ok | line | I 1.4s, II 1.4s, III 1.4s | ok |
| Warhelm | Storm Born | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Warhelm | Skull Splitter | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Bandit | Bolas | far 6 targets | ok | shooters | I 0.3s, II 0.3s, III 0.3s | ok |
| Bandit | Dirty Trick | near 6 targets | ok | line | I 1.0s, II 1.0s, III 1.0s | ok |
| Bandit | Stick 'Em Up | near 3 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | ok |
| Shade | Shadow Walk | far 6 targets | reached no one; tiers differ only in positions I~II | spread | I 1.4s, II 1.4s, III 1.4s | ok |
| Shade | Blackout | near 6 targets | reached no one | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Shade | Shadow Clones | near 6 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | ok |
| Haymaker | Toss | near 3 targets | ok | pair | I 1.8s, II 1.8s, III 1.8s | ok |
| Haymaker | Pitch Hay | near 6 targets | ok | front | I 1.0s, II 1.0s, III 1.0s | ok |
| Haymaker | Hay Bale | far 6 targets | ok | pack + wall | I 0.7s, II 0.7s, III 0.7s | ok |
| Digger | Dirt Fling | near 6 targets; a friend at 35%, hit by no one | ok | front | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II |
| Digger | Burrow | far 6 targets | ok | spread | I 1.4s, II 1.4s, III 1.4s | ok |
| Digger | Bury | near 6 targets | ok | front | I 1.4s, II 1.4s, III 1.4s | ok |
| Grandpa Sickle | Bread Toss | near 6 targets; a friend at 35%, hit by no one | ok | hurtFriends | I 0.3s, II 0.3s, III 0.3s | ok |
| Grandpa Sickle | Harvest | near 6 targets; a friend at 35%, hit by no one | ok | hurtFriend | I 0.7s, II 0.7s, III 0.7s | ok |
| Grandpa Sickle | Old Tales | near 6 targets; a friend at 35%, hit by no one | reached no one; WRONG SCENE (score 0); tiers differ only in positions I~II | partyFight | I 0.3s, II 0.3s, III 0.3s | ok |
| Alchemist | Brew Pools | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Alchemist | Elixir | near 6 targets; a friend at 35%, hit by no one | ok | hurtFriend | I 1.0s, II 1.0s, III 1.0s | ok |
| Alchemist | Monstrosity | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Shaman | Healing Totem | near 6 targets; a friend at 35%, hit by no one | ok | hurtFriend | I 0.3s, II 0.3s, III 0.3s | ok |
| Shaman | Spirit Link | near 6 targets; a friend at 35%, hit by no one | reached no one | party | I 1.4s, II 1.0s, III 1.4s | ok |
| Shaman | Ancestors' Call | near 6 targets; a friend at 35%, hit by no one | ok | party | I 0.3s, II 0.3s, III 0.3s | ok |
| Witch | Hex | far 6 targets | ok | spread | I 1.4s, II 1.4s, III 1.4s | ok |
| Witch | Cursed Brew | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Witch | Broom Ride | near 6 targets | ok | pack | I 0.7s, II 0.7s, III 0.7s | ok |
| Warlock | Eldritch Beam | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Warlock | Awaken | near 6 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | ok |
| Warlock | Dark Bargain | near 6 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | ok |
| Cultist | Blood Pact | near 6 targets; a friend at 35%, hit by no one | ok | party | I 0.3s, II 0.3s, III 0.3s | ok |
| Cultist | Ritual Circle | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Cultist | Sacrifice | far 3 targets | WRONG SCENE (score 0); tiers differ only in positions I~II | lowFoe | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II |
| Monk | Flurry | near 3 targets | ok | duel | I 1.8s, II 1.8s, III 1.8s | ok |
| Monk | Palm Strike | near 6 targets | ok | front | I 1.0s, II 1.0s, III 1.0s | ok |
| Monk | Inner Peace | near 6 targets; blows from a target with no weapon; arrows from a target | WRONG SCENE (score 0); 64 BLOWS FROM NOTHING | incomingShots | I 0.3s, II 0.3s, III 0.3s | ok |
| Seer | Foresight | near 3 targets | ok | spread | I 0.7s, II 0.7s, III 0.7s | ok |
| Seer | Blinding Flash | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Seer | Ill Omen | far 6 targets | tiers differ only in positions I~II | pack | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II |
| Chef | Hot Meal | near 6 targets; a friend at 35%, hit by no one | reached no one; tiers differ only in positions II~III | party | I 0.3s, II 0.3s, III 0.3s | ok |
| Chef | Grease Fire | near 6 targets | ok | front | I 1.0s, II 1.0s, III 1.0s | ok |
| Chef | Food Fight | far 6 targets | ok | spread | I 1.0s, II 1.0s, III 1.0s | ok |
| Beekeeper | Smoker | near 6 targets | ok | front | I 1.0s, II 1.0s, III 1.0s | tiers differ only in positions I~II II~III |
| Beekeeper | Beehive | far 6 targets | tiers differ only in positions I~II | pack | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II II~III |
| Beekeeper | Honey Glaze | near 6 targets; a friend at 35%, hit by no one | ok | hurtFriends | I 0.3s, II 0.3s, III 0.3s | ok |
| Quartermaster | Supply Crate | near 6 targets; a friend at 35%, hit by no one | WRONG SCENE (score 0) | party | I 0.3s, II 0.3s, III 0.3s | ok |
| Quartermaster | Barricade | far 6 targets; arrows from a target | ok | shooters | I 0.3s, II 0.3s, III 0.3s | ok |
| Quartermaster | Pot Helmet | far 6 targets | ok | spread | I 1.0s, II 1.0s, III 1.0s | ok |
| Crossbowman | Pavise | far 6 targets; arrows from a target | WRONG SCENE (score 0) | shooters | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II |
| Crossbowman | Pinning Bolt | far 3 targets | ok | duel + wall | I 0.3s, II 0.3s, III 0.3s | ok |
| Crossbowman | Crank Up | far 6 targets | ok | pack | I 0.7s, II 0.7s, III 0.7s | ok |
| Falconer | Loose the Falcon | far 6 targets | ok | spread | I 1.0s, II 1.0s, III 1.4s | ok |
| Falconer | Keen Eye | far 6 targets | ok | pair | I 0.3s, II 0.3s, III 0.3s | ok |
| Falconer | Call the Flock | near 6 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | ok |
| Grenadier | Big Bomb | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Grenadier | Sticky Bomb | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Grenadier | Blast Off | near 6 targets | ok | selfHurt | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II |
| Harpooner | Reel In | far 3 targets | ok | spread | I 1.0s, II 1.0s, III 1.0s | ok |
| Harpooner | Rogue Wave | near 6 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions II~III |
| Harpooner | Drop Anchor | far 6 targets | ok | pack | I 0.7s, II 0.7s, III 0.7s | ok |
| Javelin Huntress | Spear Lunge | far 6 targets | ok | line | I 0.3s, II 0.3s, III 0.3s | ok |
| Javelin Huntress | Bound | near 6 targets | ok | incoming | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions II~III |
| Javelin Huntress | Javelin Rain | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Marksman | Aimed Shot | far 3 targets | ok | line | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II |
| Marksman | Bayonet | near 3 targets | ok | incoming | I 0.3s, II 0.3s, III 0.3s | ok |
| Marksman | Ricochet | far 6 targets | tiers differ only in positions I~II | spread | I 1.0s, II 1.4s, III 1.0s | tiers differ only in positions I~II |
| Ninja | Kunai Rain | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Ninja | Substitution | near 6 targets; blows from a target with no weapon | WRONG SCENE (score 0); tiers differ only in positions II~III; 42 BLOWS FROM NOTHING | incoming | I 1.1s (hook), II 1.1s (hook), III 1.1s (hook) | tiers differ only in positions I~II II~III |
| Ninja | Caltrops | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Pirate | Point Blank | near 3 targets | ok | pair | I 1.4s, II 1.4s, III 1.4s | ok |
| Pirate | Grog | near 6 targets; a friend at 35%, hit by no one | WRONG SCENE (score 0) | selfHurt | I 0.3s, II 0.3s, III 0.3s | ok |
| Pirate | Broadside | far 6 targets | ok | pack | I 0.7s, II 0.7s, III 0.7s | ok |
| Slinger | Stunning Stone | far 6 targets | ok | spread | I 1.4s, II 1.4s, III 1.4s | ok |
| Slinger | Ram | far 6 targets | ok | line | I 0.3s, II 0.3s, III 0.3s | ok |
| Slinger | Counting Sheep | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Trapper | Jaw Trap | far 6 targets | ok | pack | I 0.7s, II 0.7s, III 0.7s | ok |
| Trapper | Double Barrel | near 6 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | ok |
| Trapper | Bush | near 6 targets; blows from a target with no weapon | reached no one; WRONG SCENE (score 0); tiers differ only in positions II~III; 14 BLOWS FROM NOTHING | selfHurt | I 0.3s, II 0.3s, III 0.3s | reached no one |
| Gladiator | Spear of Ares | far 6 targets | ok | line | I 0.3s, II 0.3s, III 0.3s | ok |
| Gladiator | Arena | near 3 targets | reached no one; tiers differ only in positions I~II II~III | pair | I 1.4s, II 1.4s, III 1.4s | ok |
| Gladiator | Shield Rush | far 3 targets | ok | line | I 0.3s, II 0.3s, III 0.3s | ok |
| Jester | Swap | far 6 targets; a friend at 35%, hit by no one | tiers differ only in positions II~III | hurtFriend | I 0.3s, II 0.3s, III 0.3s | ok |
| Jester | Befuddle | near 6 targets; blows from a target with no weapon | WRONG SCENE (score 0); 126 BLOWS FROM NOTHING | incoming | I 0.6s (hook), II 0.6s (hook), III 0.6s (hook) | ok |
| Jester | Juggling Act | far 6 targets | ok | spread | I 1.0s, II 1.0s, III 1.0s | ok |
| Samurai | Iaido | far 6 targets | tiers differ only in positions I~II | line | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions I~II |
| Samurai | Focus | near 6 targets; blows from a target with no weapon; arrows from a target | WRONG SCENE (score 0); 106 BLOWS FROM NOTHING | incomingShots | I 0.3s, II 0.3s, III 0.3s | ok |
| Samurai | Crescent Cut | far 6 targets | ok | lowFoe | I 1.0s, II 1.0s, III 1.0s | ok |
| Valkyrie | Valkyrie's Call | near 6 targets; a downed friend | ok | downedFriend | I 1.4s, II 1.4s, III 1.4s | ok |
| Valkyrie | Spear of the Sky | near 6 targets; a friend at 35%, hit by no one | ok | hurtFriend | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions II~III |
| Valkyrie | Sky Dive | near 6 targets; a friend at 35%, hit by no one | ok | hurtFriend | I 1.4s, II 1.4s, III 1.4s | ok |
| Engineer | Deploy Turret | near 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Engineer | Tinker | near 6 targets | ok | party | I 0.7s, II 0.7s, III 0.7s | ok |
| Engineer | Wind-up Drones | near 6 targets | ok | front | I 0.3s, II 0.3s, III 0.3s | ok |
| Werewolf | Turn | near 6 targets | reached no one; tiers differ only in positions I~II II~III | front | I 0.3s, II 0.3s, III 0.3s | reached no one |
| Werewolf | Frenzy | near 3 targets | NOT SHOWN | duel | I 1.5s (hook), II 1.5s (hook), III 1.6s (hook) | tiers differ only in positions II~III |
| Werewolf | Pounce | far 3 targets | WRONG SCENE (score 0) | pack | I 1.0s, II 1.0s, III 1.0s | tiers differ only in positions II~III |
| Enchantress | Heartstring | near 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | tiers differ only in positions II~III |
| Enchantress | Sweetheart | near 6 targets | NOT SHOWN; WRONG SCENE (score 0); tiers differ only in positions I~II II~III | hurtFriends | I 0.3s, II 0.3s, III 0.3s | ok |
| Enchantress | Heartbreak | near 6 targets | NOT SHOWN; WRONG SCENE (score 0); tiers differ only in positions I~II II~III | front | I 0.3s, II 0.3s, III 0.3s | ok |
| The Mob | Pile On | near 3 targets | ok | duel | I 0.3s, II 0.3s, III 0.3s | ok |
| The Mob | Surround | near 6 targets | ok | pack | I 0.7s, II 0.7s, III 0.7s | ok |
| The Mob | Scatter | near 6 targets; blows from a target with no weapon | WRONG SCENE (score 0); 54 BLOWS FROM NOTHING | selfHurt | I 0.7s, II 0.7s, III 0.7s | ok |
| Clockmaker | Rewind | near 6 targets; a friend struck by no one | 6 BLOWS FROM NOTHING | hurtFriend | I 1.0s, II 1.0s, III 1.0s | ok |
| Clockmaker | Slow Time | far 6 targets; arrows from a target | reached no one | shooters | I 0.3s, II 0.3s, III 0.3s | ok |
| Clockmaker | Stop the Clock | far 6 targets; arrows from a target | tiers differ only in positions II~III | shooters | I 0.7s, II 0.7s, III 0.7s | ok |
| Air Mage | Gale | near 6 targets | tiers differ only in positions I~II | front + wall | I 0.3s, II 0.3s, III 0.3s | ok |
| Air Mage | Updraft | far 6 targets | ok | pair | I 0.3s, II 0.3s, III 0.3s | ok |
| Air Mage | Cyclone | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Warden | Manacles | far 6 targets | WRONG SCENE (score 0) | casters | I 0.3s, II 0.3s, III 0.3s | ok |
| Warden | Nullify | near 6 targets; arrows from a target | WRONG SCENE (score 0); tiers differ only in positions I~II | casters | I 0.3s, II 0.3s, III 0.3s | ok |
| Warden | Chain Gang | near 6 targets | ok | ring | I 0.7s, II 0.7s, III 0.7s | ok |
| Telekinetic | Hurl | far 6 targets | ok | corpse | I 0.3s, II 0.3s, III 0.3s | ok |
| Telekinetic | Levitate | far 6 targets | ok | spread | I 1.4s, II 1.4s, III 1.4s | ok |
| Telekinetic | Mind Shield | near 6 targets; a friend at 35%, hit by no one; arrows from a target | ok | shooters | I 1.4s, II 1.4s, III 1.4s | ok |
| Earth Mage | Earthquake | far 6 targets | ok | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Earth Mage | Spike Chain | far 6 targets | ok | spread | I 0.3s, II 0.3s, III 0.3s | ok |
| Earth Mage | Stone Wall | far 6 targets | reached no one; WRONG SCENE (score 0) | pack | I 0.3s, II 0.3s, III 0.3s | ok |
| Water Mage | Bubble Shields | near 6 targets; a friend at 35%, hit by no one; fire bolts from a target | WRONG SCENE (score 0) | casters | I 2.1s, II 2.1s, III 2.1s | ok |
| Water Mage | Dome | far 6 targets; a friend at 35%, hit by no one; arrows from a target | WRONG SCENE (score 0.25) | party | I 0.3s, II 0.3s, III 0.3s | ok |
| Water Mage | Water Cannon | far 6 targets | ok | line | I 0.3s, II 0.3s, III 0.3s | ok |
