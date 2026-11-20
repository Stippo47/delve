# Delve: decisions

The designer's rulings, newest round first. Raw answers are in `docs/riffle-log/`. HANDOFF.md has the
decisions from before Riffle. Where they conflict, this file wins.

---

## Round 2 (Riffle, answered 2026-11-18)

### Stage 1 report: good, with more to do (call it stage 1b)
- **Portrait only** for the UI if supporting both doubles the work. (It does for camp: go portrait.)
- **Room wider**, so it fills the sides of the phone.
- **Animations: more.** Weapon swings, the bow drawing back, arms swinging while walking. **Hands and weapons are
  separate parts, and the outline is added afterwards** over the whole figure (like an outline shader).
  *This overrides HANDOFF's "one sprite rotated whole, no shifting components".* The art round brief now asks for parts.
- **Rat tail**: still one part, but it springs and drags behind.
- **Hit box a bit bigger still**: too much overlap.
- **No health bars in the arena.** Heroes' HP is shown in the UI above everything. Only the boss gets an HP bar, also separate, in the UI.
- Skeletons look **shrunk**.
- **No damage numbers and no ability text. Show, don't tell.**
- **No status meters** under units.
- **Rats get a dash** (in the direction they're moving/facing).
- Impact, outlines, arrows, rats, momentum, fire, brains: good.

### The dungeon map (my Isaac-style map was off)
- **A decision tree, always forward.** You can't go back. Rooms can have several exit doors. About **9 room layers
  to the boss room**, as before. 3 floors per dungeon.
- Rooms can be **several screens big**. The camera follows smoothly, and **the player can drag to override it**.
- Room kinds as proposed (fight, treasure, fountain, decision room, boss, rare duck/mimic).

### Progression loop: approved, with two changes
- Leaving: **you have to finish the room first.**
- **Trinkets found in a dungeon are not kept**; only bought ones are. (Found trinkets are for that run.)
- "Levels live in a run": yes, but it "feels a bit off". Still open; revisit when building stage 3.

### Status rules: approved, with additions
- **Heroes have no elements at level 1.** A hero gets its element when its ability is unlocked.
- Archer frost: a **skill-tree upgrade: a chance to load a frost arrow.**
- Burn spread doesn't feed back: it stops once the receiver has 50% of the source's burn, and a unit with less burn
  can't add to one with more.
- Wet: **soaked units take very high knockback, freeze more easily, and wet removes poison.**

### Order of work: approved
1 feel (+1b), 2 the map, 3 progression and camp, 4 statuses. Art round 2 alongside.

---

## Round 1 (Riffle, answered 2026-11-16/17)

### Game feel (from the "Delve is live" card, played on the phone)
- **Portrait.** Must be playable vertically.
- **Collider bigger** (units overlap visually now: the collider is only the head).
- **Rooms ~25% larger.**
- **Movement:** robotic, no momentum, no flow, too rigid. Units must take time to turn around, not snap.
- **No animations** yet: needs them.
- **Hit impact** is weak.
- **Outlines:** thickness is mixed between things; make it consistent.
- **Arrows** too small. **Rats** a bit too small.
- **Status effect visuals** disliked. **Fire puffs** look bad.
- **Menu/UI:** no life to it, bad. Redo.
- **Rogue dies** because it strafes towards large groups.

### Brains
- Report is right. Pathfinding marked "decent": go with **A\***.
- Targeting: weigh targets that **nobody is already on** higher; weigh targets **surrounded by more of their allies** lower (rogue fix: brain, not HP).
- Teamwork, all three: **knight draws attention** (soft taunt), **finish the kill**, **knight protects** the low hero being attacked.
- Formation only slightly enforced: if the archer is closer to an enemy than the knight, it weighs moving towards the knight more.
- Enemy habits yes, but **simple**: e.g. rats rapidly changing direction while approaching, circling in. Not my examples.
- Brains should know combos a little (Charge towards hazards, Barrage at targets in oil/gas): yes.

### Statuses
- **Statuses mostly come from trinkets or abilities, not base attacks.** (Archer's chill-on-every-arrow and rogue's poison pokes are wrong.)
- Burn: chance to **spread** to nearby units, 20-50% of the current amount.
- Chill: a **constant** slow, no ramp (for now). Each freeze makes the next harder: keep. Shatter is heavy damage, never an instant kill.
- Poison: also slightly slows action speed and movement.
- **Next statuses: Wet, Shock and Stagger.**
  - Wet: special abilities trigger slower. At 100 the unit **slips** (spins for a second) and leaves a puddle.
  - Shock: a stun that **retriggers** every few moments.
  - Stagger: a short continuous stun that **stacks**. At full: **knocked out**, unreactive and vulnerable for a few seconds.
- Also floated: entangle / vines.
- Enemies causing statuses: yes, but **make enemies for the statuses**, don't bolt statuses onto existing enemies.
- Friendly fire at 40%: keep.
- "New heroes' statuses" card sent back (heroes don't bring a status by default; see first rule).

### How a run plays
- Today's layout is **too small and too regular: it should be a journey.** Rooms: problem.
- **Binding of Isaac-like layout**: a map of rooms with doors. Sometimes there are doors to choose between, and **the units choose** (maybe at random). No player door choice.
- Room shapes: yes. More bosses: yes. Sound: yes.
- Healing: fountain yes, plus passive healing, heal abilities, **health potions** a hero carries in, used like an ability (likely when low and safe; slows, takes a second, can be interrupted).
- **Decision rooms:** 3 free things, pick 1.
- Chests give **more than trinkets**: HP potions, XP, coins. Trinkets found in a dungeon can be used during it.
- Easter eggs: **mimic** yes (normal drops + XP, not 2 trinkets), **duck** yes, **"nothing personal"** yes. Cracked wall and sleeping boss: unsure.
- Player input (speed, retreat) is fine.

### Progression (big change: see the design card sent back)
- **Keep all gold**, even on a loss. **Leave any time.**
- Hurt or dead heroes need a **recovery timer**; coins speed it up. Enter with other heroes meanwhile.
- **Mercenary party:** a weak-to-middling starter party you don't keep, which takes ~50% of the gold.
- **Party size starts at 1**; gold or gems buy more slots, cost growing fast. No free XP for heroes left at home.
- **Skill tree per hero**, split 3-4 ways (attack, survival, utility/support, maybe movement). Leaves are ability unlocks or stat buys that can be bought repeatedly (+5 damage, +15% vs undead, +attack speed and knockback below 20 HP...). Branches group sensibly. Tree nodes can open **more trinket slots**.
- **XP and levels only matter inside a run** and reset on leaving. **Gold buys tree nodes** (permanent). Some nodes need a level, or a feat like "reached level 8 in a dungeon".
- Coins also buy base-stat growth per level and trinkets; **gems unlock new heroes**.
- **Don't show a recommended level. Each dungeon is a different theme.** Offer a few dungeons to choose from.

### Art (board)
- Liked overall: archer, base, Paladin, Old Guard, Dame, Twinfang, Bandit, Shade, Granny Reaper, Wildmane, Bearskin.
- Weapons held **below the body, not over the shoulder**, and **bigger**. Hands on shields hidden.
- Per-item notes are in the round-1 log; the art round brief carries them.
- **Skeletons get eye sockets** (overrides "no eyes" for skeletons), no rib cage, no light/dark split down the middle; nose hole the right way up.

## Round 3 (2026-11-18): art round 2 picks and the stage 2 report
Raw answers: `docs/riffle-log/2026-11-18-round3.txt`.

### Art
- Picked (favourites): archer split, Paladin, Old Guard, Dame (tiara), Bastion A/B/C, Rattler + jawless + loose jaw,
  Gaper, Brute, Twinfang, Bandit (mask), Shade (cape), Granny Reaper, Haymaker (fork), Digger, Grandpa Sickle,
  Wildmane, Bearskin (club), Warhelm A and B, Berserker (strap). "Looking really good."
- **Every pick becomes its own unit**, except near-identical pairs (Warhelm A/B are one unit).
- **Weapon rule (most weapons): further forward, drawn *behind* the body/shoulder, not on top.** Shields are the
  exception. Several weapons are still too small.
- **More enemies in the art: the slimes, plus bats, ghosts, lizard men, spiders, snowmen, etc.**
- Per design:
  - Paladin: the rule above. Twinfang: the rule, and the daggers further apart.
  - Bastion A: no eye holes. Bastion B: reads as a paint brush. Bastion C: almost good, helmet boring.
  - Rattler: no rib cage, or pull it back more; good. Jawless: same, give it a bow or spear. Loose jaw: same, a mace.
  - Gaper: two long swords, look a bit angry. Brute: give a shield; can't tell what its weapon is.
  - **Hollow: doesn't work as a skeleton; keep its head for a ghoul/banshee enemy.**
  - Granny Reaper: weapon too small, the handle especially.
  - Haymaker (fork): handle short; hat too detailed, crown not wide enough; fork tines too shiny.
  - Digger: longer handle, below the body.
  - Wildmane: bigger weapon; maybe a scar over the "eye".
  - Warhelm A: is that a beard? It doesn't cover the face. Shoulder pads a bit too detailed. Slightly longer handle.
    Warhelm B: remove the shoulder spikes.
  - Berserker (strap): spikes on the top face of the mace.

### Stage 2 report (map: good overall)
- **No wobble walk** (the slight turning looks weird).
- **The rogue keeps turning around instead of backing up.** Back off facing the enemy.
- **Spikes look bad.** **Doors don't look good yet.**
- Tree: **up to 5 rooms wide** per layer. The HUD map doesn't need to show the spread.
- **Rooms: "that's how big they can get", in both directions, and many shapes: T, L, +, box, square, etc.**
  (Not just long strips.)
- **Coins must be collected** by walking over them; they vanish after a few seconds. (An economy-focused unit comes later.)
- **Potions: a hero *can* start with one**, not always.

## Round 4 (2026-11-19): art round 3 picks, the roster, the stage 2b report
Raw answers: `docs/riffle-log/2026-11-19-round4.txt`.

### Art
- Picked: Paladin, Old Guard, Dame, Tower, Bulwark, Wildmane, Bearskin, Warhelm, Berserker, Twinfang, Bandit,
  Shade (crossed), Granny Reaper, Haymaker, Digger, Grandpa Sickle, Rattler + bow + spear + mace, Gaper, Brute,
  Ghost, Lizardman (spear and blade).
- **"Go crazy": about 40 more heroes**, spread over agents, not overlapping: mages, druid, marksman, plague doctor,
  ninja, templar knight, cultist, vampire, beast tamer, etc.
- **New enemies:** orcs, goblins, trolls, ogre, hobgoblin (all different shades of green); demon, devil, imp, fiend;
  dragonborn (a dragon-flavoured lizardman); angel, cherub.
- **Rule: every hand holding a weapon is turned to match the handle.**
- Fixes per design:
  - Old Guard: a two-handed weapon is held in the middle, in front. Tower: eye slots back; a flanged mace (use the
    others as reference). Bulwark: hold the spear a bit further back. Griffon: helmet weird, opening bigger and a
    different shape (too narrow); hammer small.
  - **Wildmane is a she.** Scar: one solid darker shade, not white. Bearskin: a better club. Warhelm: really good,
    hammer ~15% bigger. Berserker: the spikes are bad, a different style.
  - Twinfang: hooked/curved daggers, curving inwards. Shade: the crossed daggers are better (the spread version could
    have been a dagger and a rapier).
  - Granny: holds further down the shaft. Haymaker: fork head one colour.
  - Rattler: hands rotated to the handle; separate the lower jaw from the skull so it reads as a skeleton.
    Gaper: 30% bigger, no eyebrows, less mad/sharp. Brute: 15% bigger, axe flipped.
  - Banshee: no, losing the style; try again. Slimes (all three) and bat: a totally different style.
    Ghost: better, tail needs work. Lizardman: decent, try variants; the blade is curved the wrong way.
    Spider: 4 variants/styles. Snowman: leaning over, hat too detailed, different style.
    Mimic: close but deviates too much; the tongue isn't attached.

### Roster (one move each: approved, with these changes)
- Digger: flings dirt that blinds, or staggers. Grandpa Sickle: throws bread to hurt allies nearby, healing them.
- Wildmane (she): rage: less damage taken, faster attacks and movement for a short time.
- Berserker: slams the ground, sending a repeating shockwave forwards.
- Gaper: a piercing charge (swords in a V ahead) ending in a rapid spin (swords out to the sides).
- Brute: raises the shield (an action, not passive): turns slowly while raised, blocks only the front 180 degrees.
- Lizardman: tail spin that throws up 3 slow water projectiles.
- Spider: bite poisons, a slowing web on the ground when it dies. **Momma spider:** a short-range web cluster that
  entangles a unit for a second if it hits, or leaves a slowing web on the ground if it misses.

### Stage 2b (good)
- **Revive: an ally is revived in a room by standing over them for a few seconds**, at 10% HP for most; support
  classes revive better.
- **Camera zoomed out more, with zoom in and out.**
- Boulders, traps and the chest need a visual overhaul. **Doors still not good: the opening glows in the colour of
  the room behind it.** (The clip never reached a door; show one.)
- **Coins last far too short.**
- **Rogue gets a dash** (to get out of range, or to engage on top of the backstab) and weighs isolated and far-away
  enemies more.
- Thought: the archer gets stuck a lot, frozen in a wall, and jitters left and right going to some spots (diagonals?).

## Round 5 (2026-11-19): make it a game
- The designer: "The art is good enough. I'll do notes later." Build: camp overhaul, the progression system,
  environments/dungeon types, a boss fight, **15 heroes with 1 attack, 3 abilities (each with tiers) and 1 trait
  (works on its own, e.g. a healer reviving better)**, and a skill tree; **animations so characters use their weapon
  (swing, draw the bow)**; any visual polish.
- **The round-4 enemy redesigns mostly didn't fit the style.** Many heroes were good, with a few visual flaws each.
- **More trinkets with fun, unique effects**, e.g. a one-time self-revive, a fireball shot out every so often that
  explodes, complete poison immunity, auto-teleport out of reach of an attack on a cooldown, on death turn ethereal
  (very weak attacks, can't be hit or targeted, the corpse stays behind).
- Plan and contracts: `docs/BUILD-v1.md`. The 15 and their kits: `js/heroes.js`.
- My calls while building (round 5): every hero's first ability (tier I) is free from the start, so a brand-new party
  of one still has a move; enemy numbers scale with party size (one hero faces ~40% of what three do); a new solo
  hero tends to fall around rooms 5-10 with 100-200 gold to spend on the tree. Fixed a freeze: a unit touching a rock
  chunk read every direction as blocked and stood still (likely the archer "stuck in a wall").

## Round 6 (2026-11-20): 0.6.0 played, art round 4, 28 thoughts
Raw answers: `docs/riffle-log/2026-11-20-round6.txt` (every art note is there word for word). Plan: `docs/BUILD-v2.md`.

### Combat and feel
- **Each room has waves**: when it's cleared, another bunch spawns in. **Longer TTK for everyone.**
- **Party too slow: base move speed ~3-4x**, ability cooldowns about the same. Rooms maybe a bit too big.
- **Longer attack and view range for everyone; slightly bigger colliders.**
- **More knockback and physical reactions ("juice")**, punchier impacts **without** excessive shake/hitstop.
  **Corpses get launched, stay on the ground and fade slowly.** Hit effects land at the unit's surface (and on a
  raised shield, not through it).
- Pathfinding: still rapid spinning back and forth sometimes. Enemies wander into corners and get stuck.
- **The party doesn't search areas with nobody in them.**
- **Chest appears near the party when a room is won; no keys.** It opens **empty, with coins spilling out around
  it.** Dropped coins **scatter wider and home in fast** when a hero comes near.
- **Spikes go down when the room is beaten.** Puddle look disliked. Aura effects round heroes (Paladin's Guard)
  disliked. **A circle shadow under every unit.**
- **Twinfang's Backstab triggers too often: longer cooldown.**
- **Cleric is ranged** (a weak light orb), not front line; **first ability is a heal-over-time ray to an ally, no
  burst heal**; can't heal itself with its base ability.
- **First ability is not free, but cheap.** Party-size scaling: unsure (kept for now).
- **Each dungeon harder than the last, and each level (floor) harder too; more enemy variety and abilities.**
- Camera pans past the room's edges by about a third of its width. A cheat for unlimited currency.

### UI
- **Camp: don't like the look overall. Skill tree: don't like the look.** Better item visuals. Dungeon doors and
  the door/room choosing don't look good.
- **Battle HUD**: better hero cards with current/max HP on the bar, **ability cooldowns**, **status effects as a
  shrinking ring with an icon**, **items as sprites, no text**; swap the heroes with the currencies/Leave button.
- **Pause in a dungeon to inspect** party, statuses, items and their descriptions.
- **Bestiary** with fun descriptions; fun descriptions for items too.
- **Rest 2-3 minutes**, not 10. **More potions** (haste, faster abilities, fire immunity, iron skin...).
  **Trinkets have levels.**

### Environment
- **The whole environment needs a visual overhaul: offer about 4 styles.** Walls textured with faces angled outward
  on all four sides; about 12 floor styles. Ground decor must not stand out (it looks collidable or important).
  Shadows must be top-down (the fountain's isn't). Doors look good on walls.
- Props: crates as single 2x2-cell crates and barrels; rocks in 4 styles; the pillar unclear; pedestal at the wrong
  view angle; oil not good; open chest's top weird; the boss door's doorway good, doors not; the used fountain meh.

### Art
- Fixes and 40 heroes all picked, with notes on most (log). **Weapons and hands are separate from the body, their
  own sprite; the outline goes on after.** Variants asked for: Druid x2, Marksman x4, Beast tamer x4 (each with 2
  beasts), Engineer x4; redo: Executioner, Gladiator, Samurai, Werewolf (+ human form), Cultist, Pyromancer, Storm,
  Necromancer, Cleric, Lantern keeper, Plague doctor, Templar; Ninja without the katana. Witch, Beekeeper,
  Crossbowman hats: use the farmers as base. Gaper: everything 30% bigger except the outline.
- Enemies: most of the round-4 redos/new families disliked ("try again"); lizards and dragonborn without eyes (and a
  version with human-style face shading); dragonborn red; devil, imp, goblin no eyes; the old mimic was better
  and mimics should look like the chest; slimes maybe with the tail things turned 180 degrees and no eyes.
- **Sound effects and ambient music.**

### Kits
- All 15 kits approved ("All sound great").

### An idea (not decided): the wagon
A different genre: escort a slow wagon upward through biomes while enemies come from all sides; the party is ~3x
faster than the wagon; camps between stretches with a hero to hire, a shop, the fire to upgrade; gold dropped by
enemies must be picked up or is left behind; meta progression stays. Pitched back in Riffle, not built.
- Round 6 build calls (lane F): enemy damage x0.75 (fights got much denser); a chest drops by the party after
  treasure and elite rooms always, other fights 30%; "the puddle" read as the heal/holy zone discs (now a faint glow);
  difficulty order Warren < Sewers < Crypt (+0.12 per rank, +0.18 per floor); first ability's tier I costs 20.
  A fresh trio with nothing bought reaches floors 2-3 and doesn't win; with tier I bought, Warren is won most runs.
