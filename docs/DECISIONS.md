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

## Round 7 (2026-11-20)
Plan and the designer's words: `docs/BUILD-v3.md`; raw answers: `docs/riffle-log/2026-11-20-round7.txt`.
Highlights: elites for every enemy kind; 3 harder dungeons; stronger upgrades and harder scaling; 2-3 more waves each harder; everyone 20% slower; quick door exit with heroes vanishing into the light; trinket pickup up to slots; grid obstacles one cell each; smaller merged shadows; death bursts; fainter dead; summons purple-outlined; HUD keeps HP/XP numbers; camp and tree need real layout redesigns (Night watch theme); dungeon look default Carved; art: change only what each note asks.
- Round 7 build calls (lane D): elites are hp x2.4, blows x1.8, walk x1.5, attacks x1.2, size 1.05 (the old elites
  were 1.15), gold x0.8 of a plain one, XP x3, a gold rim; any enemy can roll elite (5% on floor 1, rising with floor,
  dungeon and wave, max 30%), the elite room holds one or two. "An additional trinket": a hero picks up found trinkets
  up to its slots plus one (FOUND_EXTRA in dungeon.js; 0 makes it slots only). Waves: 3-4 after the first lot (a 5th
  sometimes deeper down), each ~16% bigger with heavier kinds and more elites. Grid cell 80 units; crates collide as
  squares, barrels and boulders as circles. Dungeon order Warren < Sewers < Crypt < Frost Hollow < Ember Deep < Gilded
  Spire; the deep three ease in over floor 1's first rooms and pay more XP and gold. A fresh trio with tier I bought
  now wins the Warren about 1 in 4 and loses the deep three on floor 1; a fully bought trio wins all six most runs.

## Round 8 (2026-11-21): the overhaul
Plan, contracts and the designer's words: `docs/BUILD-v4.md`; raw answers: `docs/riffle-log/2026-11-21-round8.txt`; roster proposal: `docs/ROSTER.md` (deck roster2, gated).
Key rulings: levels are permanent and give skill points (no levelling reset per run); the tree is a big web with stat nodes; gold buys equipment, heroes, potions; slots come from boss kills; beat a boss to open the next dungeon; 3 floors of 7 rooms, two mini-bosses then the boss, floors differ in kind; checkpoints per floor; leaving mid-floor costs 20%; a mini-boss tier any kind can be; waves never smaller, +50% enemies, much harder scaling; statuses Radiance (angels) and Cursed (ghosts); summons black-outlined with a hue shift; UI again from scratch; 4 puddle styles and 4 enemy-HP styles to pick from; a showcase of every ability.
My calls: gems are dropped (gold only); hero cards were buttons, which iPhone Safari lays out wrongly: now divs (0.8.2).

## Round 9 (2026-11-21)
Rulings and lanes: `docs/BUILD-v5.md`; the designer's words (47 cards: roster, showcase, art, 0.9 report): `docs/riffle-log/2026-11-21-round9.txt`.
- Round 9 build calls (lane E, enemies): majors (the old mini-boss form) are hp x5 (less for big kinds: / (1 + 0.12 x (cost - 2))),
  blows x2.2, size 1.55, two trinkets, no enrage, not bosses; 0.8% of any enemy on floor 1 rising to 6%, and from
  floor 2 the elite room's second big one is a major a third of the time. Elites carry one trinket always (designer:
  "Elites 1"). No gold rim: u.look gives a faint tint and a twinkle. Gems: a floor's last foe drops one, the dungeon's
  boss two, 6% of chests, 15% of majors; kept even when leaving early. The Wildwood is rank 0 (strength x0.75); the
  Warren, second now, went from x1 to x1.6; the others moved up one rank. A save keeps any dungeon it has been into
  open. Slimes are blue, hop, and leave no body. Floors whose last foe is a plain kind (the Warren's hobgoblin and
  orc, the Sewers' slime and lizard blade...) now meet a major of it until they get named mini-bosses. The golden
  skeleton keeps its homing bones on the base kind (the designer "might" move them to the elite). The rat king's
  sprite is a big recoloured rat for now (the designer asked for more than a stacked rat sprite: real art queued).

## Round 10 (2026-11-21): showcase 2 answers
The designer's words: `docs/riffle-log/2026-11-21-round10-showcase2.txt`. Settled: **puddles = Inked** (merging),
**enemy health = the straight bar** on top ("Just the straight bar": no arc, tanky kinds included). 45 of 60 clips
ticked; the notes below are lane V3's list (queued behind the art and hero lanes: weekly usage was at 96%).
- Kit changes asked for: **Zeus Bolt** reworked: a bolt that jumps between enemies N times and shocks at every jump;
  tier I one bolt, tier II 50% more jumps, tier III +2 bolts; no X hit mark on lightning. **Roll** (archer) slides
  into position and shoots caltrops out. **Light orb** (cleric attack) spreads by angle, not position, and orbs that
  pass through allies heal them slightly. **Bone dart** is no longer a bone: it starts bigger and slower. Frost Arrow
  leaves no ice puddle. Plague Doctor's Gas Form: "Great" (the unrequested swap from Leeches stays).
- Visual notes per ability are in the log (hands not head for the storm mage, weapons held out not in on Cleave and
  Reap, smoke that fades and appears at both ends of Backstab, two more Shockwave variants, three wolf-bite variants,
  the previous Entangle cast, Sanctuary as one ring through every point, simpler flail and Bone Spear, grey raised
  dead with even hands, Life Drain that grows out to its targets first).

## Round 10 (2026-11-21): battle mode
The designer: "Add a battle game mode. I can pin any unit against each other and any enemy whose dungeon I have
defeated. So I can make a team of 10 skeletons and necromancer vs a knight and tower." Built as `js/battle.js`
(rules), `js/battle-ui.js` and `css/battle.css` (screens); checks: `node tools/battles.mjs`. Calls made, all easy to change:
- **Where.** A sparring ring in the camp, between the book and the trader's cart. Two sides, Blue (bottom of the
  field) and Red (top); a side holds 20 units at most, 12 of one kind.
- **Who.** Heroes you own, any number of each, on either side, with the skills and trinkets they have at camp (no
  potions). Every enemy kind of a dungeon whose boss you have beaten, its mini-bosses and boss included; a kind is
  listed under the first dungeon it appears in and fights as strong as on that dungeon's first floor. A monster's
  tag cycles plain, elite, major (elites and majors carry their trinkets). The fighting ground is any open dungeon's look.
- **Nothing is earned or lost**: no gold, XP, drops, book counts or resting. In a battle heroes die like anyone.
- **Bosses on one side only** for now: a boss's moves are written against "the heroes", so a battle gives the boss's
  side the sim's enemy team; two bosses facing each other waits for the boss lane's rewrite. A boss with its own
  hall (the Bone King, the Elder Ent) brings it.
- **Sides.** What a unit makes mid-fight (a split slime, called wolves, raised dead, a rat king's rats) joins its
  maker's side (sim.js `w.actor`). Both sides carry a straight health bar and a floor ring in their colour (no body
  outline: that stays reserved for protection).
- **Ending.** A side with nobody standing loses. After 75 seconds everyone presses in (no fleeing, mending or calling);
  at 4 minutes, or when the flag button is tapped, the side with more of its health left takes it.
- **Result.** Per side and per kind: how many are left, damage dealt and taken, kills, healing; Again, Change sides, Camp.

## Round 11 (2026-11-21): the balance pass, armour, poison, the camp's lag
The designer: "The main menu camp is very laggy. I want you to stress test every unit with every ability at lvl 1
then at lvl 3 (only abilities no trinkets or other upgrades) with random party members multiple times in a row in
different dungeons to see if the layout is balanced. Currently it seems like the paladin is very strong. Should be
balanced so he is more of a tank than damage dealer or healer. Those are secondary. Then someone like an archer
should have more damage. Is there an armour stat? If not maybe there should be. And not a simple 20% off all
damage. Increase all ability cooldowns by like 20-25%. Also rework poison. Its burst effect is draining 15% of ur hp
instantly."
- **The camp's lag** (0.11.1): parts.js threw away any fourth size of a sprite the moment it was made and rebuilt it
  every frame (a new set arrived with `used = 0`); zooming to the fire or a hero triggered it. Also: the still ground
  is one cached picture, words and the points mark are cached sprites, nobody off screen is drawn.
  `node tools/camp-perf.mjs --gpu --slow 6` measures it.
- **The batches**: `tools/balance.mjs` / `bash tools/balance-all.sh <dir>`. Every hero leads a party of three with two
  random others; everyone has all three abilities at the tier and nothing else (run option `bare`: no trinkets picked
  up, no potions handed out); every dungeon at one strength (run option `asRank`), tier I at the Wildwood's, tier III
  at the Warren's. It reports rooms cleared against the average and each hero's share of its party's damage, healing
  and damage taken, by hero and by role.
- **Roles** (heroes.js ROLE_TUNE, laid over the stats as written): a hero's dmg stat drives its weapon and all its
  abilities' damage, so a role's damage is one number. Tanks deal much less and have a little more health and armour;
  shooters and casters deal more; melee and skirmishers got damage and health (they went down most); supports deal a
  little less and all their healing is scaled down (healers carried every party they were in).
- **Armour** (js/armour.js): points off every blow, never more than 60% of the blow; heavy and critical blows get past
  half; damage over time ignores it. Tanks 4-8, a few plated fighters 2-3; the web's Toughness nodes became Armour
  (+2 a rank; Juggernaut +3). Enemies: shells, stone and the Foundry's metal (copper none, bronze 2, steel 4), growing
  with the square root of the dungeon's strength.
- **Cooldowns**: every ability's x1.22 (heroes.js CD_MUL, applied once to the numbers as written).
- **Poison**: the burst no longer takes 15% of max health at once. SICKENED for 6 s: loses 10% of max health over that
  time (bosses 4%), deals 30% less, moves and attacks 20% slower; anything that cleans statuses ends it.
- **Crashes found by the batches and fixed**: two exploding minions killing each other without end (kill() runs once
  per unit); two units overloading each other with shock without end; the Jester's Befuddle (a flipped enemy treated
  as a party hero); the hero Bandit's id clashing with the Wildwood's bandit (now `rogueBandit`).
- **The lead's call on a lane's rule**: roster3 added "enemies wither if a room drags on" (60 s without a kill or
  200 s, 4% a second). Softened to 90 s / 240 s / 3%, and flagged to the designer.

## Round 11b (2026-11-21): the wagon (convoy mode), a try
Built by lane C as a prototype (js/convoy.js; docs/CONVOY.md has the design; `node tools/convoys.mjs` checks it):
three two-minute stretches up a Wildwood road, the wagon a unit with its own health, waves from every side, gold
left behind when it scrolls off, a Guard / Gather switch (the lane's addition), roadside camps with a pick of one
from three, the Bandit Chief's barricade at the end, real gold and XP worth about a floor. Live as 0.13.0. Open with
the designer (deck v13-convoy): the switch, one road or many, the roadside camp as a shop, downed heroes riding.

## Round 12 (2026-11-21): the campaign curve, the bosses, hero outliers (lane D)
Everything changed and why: `docs/balance/r12-notes.md`; tables: `docs/balance/r12-tier1.txt`, `r12-tier3.txt`.
- **All nine dungeons can be beaten** by `runs.mjs --campaign 150` on four seeds (before, nobody passed the Spire).
  RANK_MULT is now `[0.75, 2, 2.75, 3.2, 3.75, 4, 3.95, 4.6, 4.2]`: the numbers fold in how hard each dungeon's own
  enemies are, so they no longer rise in order. A few late enemies hit softer. The Warren is harder (x1.6 to x2).
- **Bosses**: each about even (7 to 12 hero wins in 20) at the level the campaign reaches it, 2 to 4 minutes.
- **Heroes**: the weak ones' abilities were doing nothing measurable and now do their share; the healers' numbers
  were roughly halved (ROLE_TUNE support heal 0.62) and they still lead by about 2 rooms. Asked the designer how to
  handle that (deck v14-balance): my pick is enemies that punish healing, not more cuts.
- runs.mjs calls a room stuck at 420 s now, not 300 s.

## Round 13 (2026-11-22): the designer's list and the round 12 answers
Plan, the message in full and the lanes: `docs/BUILD-v6.md`. The answers: `docs/riffle-log/2026-11-22-round12.txt`.
Done by the lead, live as 0.14.1:
- **A wipe** loses 75% of the run's gold (progress.js WIPE_LOSS) and nobody rests after it. Leaving early is as it was
  (20%, the hurt rest): asked whether resting should go altogether. The campaign curve was measured at 20%: re-measure.
- **Battle page**: a hero stack's tier (Yours, or 0-3 through heroes.js `tierBuild`: every node out to the Nth shell),
  the picker adds "at" a tier or "as" a rank so one kind can be fielded at several, ground sizes (Small / Large /
  Huge), a strength switch (by dungeon, or evened out), a dev switch that fields everything (save.battleDev), a stack
  a row on the setup page, the result as bars to one scale.
- **The trail map's harsh cuts**: the locked-dungeon veil fades in over its edge, and neighbouring biomes cross-fade.
- **Fear** was never built (only proposed in round 9): it goes in with Charm, Confused, Sleepy and Bleeding (lane S).

## Round 13, lane W (2026-11-22): the wagon from the designer's answers; no huddling
docs/CONVOY.md has the mode as built. The calls the lane made (the designer's words are in BUILD-v6 and the v13-convoy log):
- **Width and zoom** (after the lead's review): the open ground between the tree lines is 2100 (~4x the try's), the
  ground 2800 with a wood 350 deep each side. The camera shows 1500 units across a portrait phone at the default zoom
  (hero ~19 px, the wagon and ox team ~87 px long on a 390-wide screen) and leans towards the fighting, so a tree line
  comes into view when the fight is there; a wave coming from off screen shows as a red arrow at the screen's edge. The
  ox team has a body (a box from the yoke to the noses).
- **Foes from the trees**: every wave foe starts under the canopy, hidden and untouchable (ethereal) until it steps out
  past the tree line; nobody goes back under the trees after. Nothing walks in from off the top of the screen.
- **Gold**: no switch. Near gold as they fight (as in a dungeon); further gold (1000 from the wagon) when nothing threatens
  the wagon or the hero; gatherers (`gatherer: true` on a hero's data: the Quartermaster and the Pirate) first, further
  (1200), and even mid-fight unless a foe is on them. Gatherers are a wagon-road thing only for now (dungeon gold fades
  fast and is pulled in anyway); their trait text says so.
- **The shop's prices** (the trip's gold only): mend 30 (+25%), draught 12, trinket 55, sellsword 40. The try's free
  pick of one is gone: the shop replaces it.
- **Losing**: the whole party fell: 75% of the trip's gold left is lost and nobody rests (the round 13 wipe ruling);
  the wagon broken or turning back: 20% (as before).
- **The trip's legs**: the Wildwood's three floors while it's the only country open (unchanged for a new player); each
  dungeon whose boss is beaten opens its country; then two legs drawn from what's open, easiest first, the newest last,
  each at its dungeon's strength. The end block is a stockade across the open ground held by the last country's floor-2
  mini-boss and his men.
- **No huddling (sim.js, both modes)**: with nothing to fight, heroes walk to their own spots round the waypoint (a loose
  line across the way, 125 apart, every other one a step back, swaying) and keep ~90 from each other; after a room is
  won they meander apart but come back once 230 from the rest (never off alone into an unseen room). Dungeon batches
  before/after: no change in outcome beyond noise; runs ~5% longer (lane W report).

## Round 13, released as 0.15.0 (2026-11-22)
- **The Book** (lane K): rebuilt round a live preview (js/preview-sim.js, js/preview.js, js/book.js): every hero's
  attack, abilities and trait at tier 0-3, every monster at normal / elite / major, every status, trinket and potion.
  `node tools/preview-check.mjs` fails if any preview throws or its move, trait or item never fires. Where a tier only
  changes a number the stage shows the tier's words (56 abilities): the picture is the same.
- **The wagon** (lane W): see the lane's own entry and docs/CONVOY.md. Open ground 2100 across (4x the try), the same
  zoom, the camera leaning to the fight, arrows for waves from off screen, a drawn forest edge, no Guard / Gather
  switch (gatherer heroes: the Quartermaster and the Pirate), the downed revivable until they scroll off, a roadside
  shop that spends the trip's gold, a country a stretch as dungeons are beaten. Heroes no longer huddle with nothing
  to fight, in dungeons too (runs take about 8% longer; outcomes within noise).
- **Art round 10** (lane A, on the stronger model): the round 8 and 9 notes; variants wait on boards (deck
  art-round10) and the game keeps its art until picked. The sun blade "did nothing" because the Seraph's boss part
  had the same id and overwrote it: the part is `seraphBlade` now, and the blade is drawn three heroes across.
- The lead reviewed each lane before it shipped and sent the Book and the wagon back once each (previews that never
  fired; the width, the forest, the oxen).

## Round 13 (2026-11-22): lane S, the statuses
Rules and numbers: `docs/STATUSES.md` (the "Round 13" sections list every call to put to the designer).
- **Rulings**: Tangled merged into Rooted (Entangle's burst roots, 3 s, and squeezes for 12); the radiant glow drawn
  under the units; poison to 0 when the sickness ends; armour = one point and 2% off a blow per point (cap 60%, heavy
  and critical blows past half); the wither rule off.
- **New statuses**: Charm (burst: Enthralled, fights for the charmer 5 s), Confused (burst: Addled, hits friends and
  fires every ready ability), Sleepy (burst: asleep), Bleeding (burst: Haemorrhage, a third of what's left), Fear
  (burst: Terrified, runs and wastes its abilities). One side-change path (sim.js turnSide / restoreSide) for charm,
  Befuddle and the brain leech's host.
- **Who uses them**: the Enchantress (new support hero, charm), elite Cupids' love arrows, the Succubus (the Ember
  Deep's Forges and Ash Throne), the banshee's wail (fear), the bat's screech (confusion), the Lullaby and the choir
  sprite's song (sleepy), the hellhound's bite and the hunter spider's pounce (bleeding; both hunt the party's healer).
- **Helpful states shown**: every buff by name, icon and numbers; sixteen non-buff states (Regrowing, Gas Form...).
- **Damage blocked** counted apart from damage taken (stats, battle result, balance `blk`).

## Round 13, lane S, released as 0.16.0 (2026-11-22)
Rules and numbers: docs/STATUSES.md. Charm, Confused, Sleepy, Bleeding and Fear as build-ups with bursts; one path for
side changes (sim.js turnSide / restoreSide, `u.trueTeam`); the Enchantress (js/kits-charm.js); the Succubus (Ember
Deep) and the Cupid (the cherub's elite); hellhounds and hunter spiders hunt healers; every buff and helpful state
shows by name; damage blocked counted apart; Tangled merged into Rooted, the radiant glow under units, poison to 0
after the sickness, armour a point and 2% a point capped at 60%, the wither rule removed. The lane's own calls (charm
blocks from a third full; bosses and a side's last unit are stunned, not turned; Sleepy's and Confused's bursts) are
put to the designer in deck v16-statuses.

## Round 14 (2026-11-22): the Riffle answers to 0.14.1-0.16.1
The designer's words: `docs/riffle-log/2026-11-22-round14.txt`. The plan and the lanes: `docs/BUILD-v7.md`.
- **XP and catching up** (the designer picked "low heroes earn XP much faster", and described it: higher dungeons drop
  more XP, everyone in the party gets the same for a kill, three level 40s carry a level 1 who levels as they go, and
  in the first dungeon high heroes barely gain while a level 1 goes at a normal pace). Built so it falls out of the
  curve, with no rule about who is behind: each level asks 10% more than the last (`units.js xpToNext`, 100 x 1.1^L),
  and a kill's XP is scaled to the place's level (`dungeon.js FOE_LEVEL`, `xpScale`: the level a party has in each
  dungeon, from the round 12 campaign), so a party at the level a dungeon expects levels at the pace measured before.
  The downed get the XP too: a level 1 hero falls in a late dungeon's first room, and would learn nothing while carried.
  **Not taken: more XP for the killing blow.** It would put damage dealers levels ahead of the tank and the healer in
  the same party, which is the falling-behind this was meant to fix.
  Old saves: XP held towards the next level keeps its share of the way (`save.js`, `xpv`).
  Check: `node tools/carry.mjs` (three level 33s carrying a level 1 Archer in the Crypt: 8, 15, 18, 24, 27, 29, 30, 31
  after runs 1-8, while the carriers went 33 to 39).
- **Wither**: "I said no. I said to fix the source not the symptom." No rule ends a long room. Lane L finds the causes.
- **Charm**: bosses immune; a floor's last enemy fully charmed counts as beaten and follows the party on.
- **Confused**: turns at random; while burst, abilities trigger at random instead of all at once; swirls on the body
  while building, question marks when burst.
- **Sleepy**: wind-ups and anything charged take about 40% longer too. **Fear**: must visibly back away; the burst
  turns and runs, and spreads fear to those near. **Bleeding**: the look is rejected, a set to pick from.
- The ghost gives sleepiness instead of a curse. A bite's chomp starts open and is turned 90 degrees. The Succubus's
  charm-on-hit is on a cooldown. Healer hunters lean to the healer, they don't lock on. Poison drops to 20%.
- **The Book and the hero page are one unit page** (tabs: main, upgrades, preview, stats for heroes; overview, preview,
  stats for monsters with base / elite / major on top; grids to pick from, no strip of faces); every stat with an icon;
  previews show the effect, not words; locked abilities still preview; dev controls in one place.
- **Icons**: a handful in more than one style first.
- **The wagon**: 15% less wide, everyone about 50% slower, enemies trickling in from all sides with bursts, each hero
  guarding a side of the wagon, the wagon solid, a new forest edge (larger, simpler trees on a faster parallax), no
  dark tufts or puddles.
- **Art**: the picks and notes of art round 10 and its second pass (lane A).
- The Enchantress is kept as built ("YES").

## Round 13, lane H1 (2026-11-22): the first 15 heroes: the showcase 4 answers, every ability worth having
The designer's words: `docs/riffle-log/2026-11-22-round12.txt` (decks showcase4 and v12-report) and the message in
`docs/BUILD-v6.md`. The looks: `docs/FX-STYLE.md`, "Round 13". The numbers: `docs/balance/r13-abilities.md`.
- **Showcase 4.** Each note changed only what it asked. Where a card came back "none of them" the direction changed:
  Shockwave is waves that travel (their own first words: "a repeating shockwave forwards"), with no earth out of the
  floor; the wolf's bite is drawn on the one bitten, as big as it is; Old Bones puts nothing over her head and shows a
  protection border; Bone Spear has three shapes. Variants wait on picks: `?v_shockwave`, `?v_wolfBite`, `?v_boneSpear`,
  `?v_oldBones` (js/fxvar.js); the first of each is the default.
- **Whirl's "changed more than what I asked"** was a drawing fault, not a choice: the flail head's path took in the
  crescent drawn before it and inked it over. Fixed; the balls are the round 9 size again.
- **Kit changes the notes asked for**: Whirl knocks back; Zeus Bolt shoves hard the way it flies and hits a little
  harder; the Cleric's orbs leave one point 45 degrees apart and stop on a friend (the front line now eats some of her
  shots: her damage share fell from 14-15% to 13-14%); Roll is a roll and its caltrops skid out.
- **Reach follows the look** (my call): Cleave's and Reap's crescents were drawn far out past the blade ("Slash is too far
  ahead from sword"). Drawn at the blade's tip they showed less reach than the blow had, so the blows' reach came in to
  what the blade sweeps (Cleave u.r + 38 / 52, Reap u.r + 46 / 62) and their damage went up to pay for it.
- **Measuring an ability** (the designer: "turning a skill on and off to see its impact"): `tools/ability-worth.mjs`
  plays the same parties from the same seeds with all of a hero's abilities and with each one switched off in turn.
  sim.js got two hooks so Charge and Hold the Line's struck-back blows are counted as theirs (they were the mace's).
- **The Tower is the health tank, the Paladin the shield tank** (the designer: "more hp based (tanking hits) or protection/
  shield based (negating hits)"). The Tower took 40-57% of a blow against the Paladin's 26-37% on barely more health, so
  the Paladin was the better wall as well as the healer. Now: health 310 (was 180), armour 5 (was 8), mace 12.5 (was
  11); Charge is 2x his blow and grows with his nodes (it was a flat 18 that the web's Charge nodes did nothing for);
  those Hold the Line taunts hit 20% softer; its taunt is wider. Duels at tiers 0-3 and party batches in the balance doc.
- **The Archer**: bow unchanged; Barrage is loosed at a lone enemy too, the Frost Arrow hits 1.9x (was 1.2x) and its
  burst hurts. Her abilities deal about a third of her damage at tier I and about half at tier III (were a quarter and
  two fifths); she clears as many rooms as the average shooter.
- **Other calls**: Ice Wall goes up only against a brawler coming for her (raised across the party's own line of fire
  it was worth less than nothing); the Bard's Rhythm quickens attacks by 8% as well; Twinfang is untouchable mid-dash
  and as she steps out of a Backstab; the Druid's and Cleric's mending and the Necromancer's drain trimmed (all three
  sat 1.5 to 2 rooms over the average at tier I).

## Round 13, lane H2 (2026-11-22): the 37 newer heroes against the showcase 3 answers
The designer's words: `docs/riffle-log/2026-11-22-round12.txt` (deck showcase3). Hero by hero, each note quoted with
what was built and its clip: `docs/HEROES-r13.md`. The looks: `docs/FX-STYLE.md`, "Round 13 (lane H2)". The clips:
`clips/showcase5/` (one per changed attack and ability, one per new trait).
- **The three REDOs** (Bandit, Beekeeper, Quartermaster) are new kits on the same ids, slots and art: the Bandit takes
  things off enemies (Snatch flings their weapon away, Bolas trips a runner, Dirty Trick bowls one into its friends,
  Stick 'Em Up shuts one down); the Beekeeper calms with smoke, sets a hive on them, glazes friends in honey, and his
  bees stay pestering; the Quartermaster is the man with the pack (no potions): kit handed out, a supply crate, a
  barricade, a pot over an enemy's head.
- **Statuses the notes asked for** are each hero's own effect behind one function in kits2.js (whirl, dirty, targeted,
  tracked, trapped, spin, ward, weaken), ready to lift into statuses.js; the list is in HEROES-r13.md. Warded is my
  name for the protection status (a pale blue border: the border means protection). Shackled waits for its hero.
- **Ids kept** when a slot got a new ability or trait (saves keep their nodes); names, words and behaviour changed. The
  trait ids did change (seventeen new traits): old ids no longer resolve, which only matters to a save that stored one.
- **Role calls**: the Valkyrie is a support now (the note: "Is more of a support"); the Engineer moves as a shooter
  (her wrench is for what reaches her, cogs from afar: as a melee mover her 190 reach drew the wrench's swing across the
  room); the Chef, Trapper and Engineer shoot from shorter range (200, 180, 190).
- **Balance** (tools/balance.mjs, the 37 as leads, tier I at rank 0 and tier III at rank 1; before and after in
  `docs/balance/r13-h2-*.txt`, the after run 4 reps on the merged code). Five passes. Healers and pet makers came down
  (Beekeeper, Shaman, Chef, the Engineer's cogs, turrets, towers and medbay, the Valkyrie's glow); the Cultist's bolt
  bursts only built-up bleeding (it burst every bolt: a third of a boss's health); Point Blank, the falcon, Juggling
  Act III and Parry III trimmed; the low ones went up a step of health or damage (Gladiator, Slinger, Jester, Griffon,
  Haymaker, Harpooner, Dame, Grandpa, Werewolf, Shade, Seer, Grenadier); the Warlock takes 40% less as the demon (he
  went down three times a run, in melee on a caster's health); Old Tales 4 s (II 6 s): at 2 s it measured worth less
  than nothing (tools/ability-worth.mjs). Before: Engineer +4.8, Beekeeper +4.3, Shaman +3.9 rooms over the average at
  tier I, Griffon -2.4 at tier III. After: role shares tanks 23-24%, shooters 41-42%, supports 18-20% of the party's
  damage; everyone within 1.5 rooms of the average but Chef +2.1, Beekeeper +1.9, Valkyrie +1.8, Shaman +1.8 and
  Crossbowman +1.6 at tier I and Pirate +2.0, Beekeeper +1.9 at tier III (the batches move a hero about a room run to
  run; healers sit over the average in every lane: the Druid +1.6 at tier I in the same run).

## Round 13, lane B (2026-11-22): the seven designed bosses again (bosses3)
The designer's verdicts are the v12-bosses answers in `docs/riffle-log/2026-11-22-round12.txt`; each boss's doc
(`docs/BOSS-*.md`) opens with its words and what was done. The calls the lane made:
- **How a code-drawn boss is drawn** (`js/boss-draw.js`): as a figure, every shape laid down twice (grown by the outline
  in ink, then in paint), so a jointed body has one outline like the SVG art; soft gradients, a gloss, a thin seam where
  parts overlap. A struck boss gets a white wash for a frame, not solid white. Each boss's drawing sits beside its fight
  (`js/boss-<id>-fx.js`); `js/fx-boss.js` is only a pointer now.
- **"Samey"**: each boss's doc has a table of its moves with two columns: what the move asks the party to do, and what
  it looks like. No two rows of a boss match. Generic strikes (the bone spikes every zone ended in) are replaced by each
  move's own picture (`z.quiet` on the zone, an effect from `boss-kit.js bfx`).
- **The Great Engine**: one machine with jointed arms (shoulder hub, upper arm, elbow gear, forearm, wrist) that
  telescope on piston rods; a hammer and a claw; broken hands are forged back by welder drones, not a timer.
- **The Sand Wurm**: it lives under the sand. It is hittable only out of it: arcing from hole to hole, or reared up.
  It wakes as the party walks in.
- **Cinder**: an animal that walks: four stepping legs, a prowl round its mark, a body that follows its head's path;
  its fire is the game's fire (fire puddles, inked flames, the Pyromancer's fireball).
- **The Spire's boss is a biblically accurate angel** (the art lane's sprite; the designer marked it GOOD in round 14).
  The kind's id and name are still `gildedSeraph` / "The Gilded Seraph": **open: rename it?** "Horns" was read as
  **trumpets**: four of them stand round it and sound; **open: did they mean horns on its head?** The four chains are as
  described: one from each corner, each at a hero; what a chain hits is dragged to its corner and shackled 0.9 s.
- **The Winter Queen** is kept; her images are **ice mirrors** (slabs of clear ice drawn in code, her shape caught in
  each; still, casting nothing: her own art drained to white read as a second queen) and the Lattice (beams between
  her and her mirrors) is what they are for.
- **The Goblin Chieftain**: about two minutes (wins 116 s, was 218 s): blows a fifth to a quarter harder, health 440 from
  1000. The spear and the bomb barrage are gone; a thrown axe flies a ring.
- **The Great Ooze**: no tentacles. It rolls and bounces, splits in two and slaps back together; drawn in the picked
  slime's look; its shadow is 62% of what it was.
- **Boss parts take no status at all** (`boss-kit.js PART`: every id in `statuses.js`), so a hand or a drum can't be
  charmed over or frightened off.
- **Hooks left in shared files**, each one line and marked: `render.js` `u.shadowK`; `fxkit.js` `z.quiet`;
  `scenery.js` `z.col`, `z.soft`, `z.unseen`; `parts.js` `def.pose`; `render.js` `def.flashAt` (the three sprite
  bosses of this lane show white for a frame when struck; with four heroes on them they were white a third of the time).
- **Testing**: `?bossmove=<name>` makes a boss open with one move (each boss's brain lists its names);
  `lab.html?m=boss&boss=<id>&bossphase=N&bossmove=<name>`.

## Round 14, lane S (2026-11-22): the statuses' second pass
The designer's words: `docs/riffle-log/2026-11-22-round14.txt` (deck v16-statuses). Rules and every number:
`docs/STATUSES.md`, "Round 14". Clips: `clips/r14/statuses/` (git-ignored). Only what each note asked was changed; the
Enchantress's kit is as built except where the charm rules force it.
- **Charm**: bosses, mini-bosses and boss parts take no charm. An enemy charmed over to the party no longer holds its
  room open; when the room is won, every enemy still charmed there is a **follower** for the rest of the floor (it
  walks through the door with the party and fights for them until it dies or the floor ends). My calls: the floor as
  the limit (the lead's default: a floor is the run's own stretch, and with no end the Enchantress would build a
  retinue across a dungeon); a mini-boss counts as a boss; a wave still to come keeps the room open (the charmed one
  fights it for the time it has); what a charmed unit calls up or splits into is charmed the same way; a chain's body
  turns with its head; a turret bolted to its room stays behind; cleanses and Heartbreak leave a follower alone; the
  party's last hero standing, and a side's last unit in a battle, are still only Smitten (turned, nobody would be left
  fighting for that side).
- **Confused**: the random turn is a turn you can see and a few steps the wrong way; Addled lets off one ready ability at
  random now and then instead of all at once; swirls pop up on the body while it builds, question marks when addled.
- **Sleepy**: every wind-up and charge-up up to 40% longer (x fill), one multiplier (statuses.js `windMul`) read by the
  sim's wind-ups, the shared tells in elites.js and boss-kit.js, the danger zones and a hero's queued shots. Not
  stretched: the designed bosses' own move timers that don't go through those.
- **Bleeding**: the round 13 look (wash, cuts, drops) is gone. Three looks to pick from, `?v_bleed=1..3`: Spurts (the
  default), Trail, Drop. The game shows Spurts until the pick.
- **Fear**: backs away from the first point (and keeps off further the more afraid), terrified turns its back and runs,
  and the panic spreads to its own side within 120, halved at every hand so it dies out after two.
- **Who uses them**: the ghost's touch builds Sleepy (30) instead of Cursed. The enemies' bite chomp (rats, bats,
  hunter spiders) opens first and is turned 90 degrees; the Druid's wolf bite variants are untouched.
- **The Succubus** answers a blow with a charming kiss on a 4 s cooldown (24), not 8 on every blow; the fights measure
  about the same as before. **Healer hunters** hunt the healer only while in the mood (even odds every 3-5 s).
  **Poison** drops to 20 when the sickness ends.
- Checks: `tools/test/charm-rooms.mjs`, `tools/test/fear-spread.mjs`, `tools/test/hunters.mjs`,
  `tools/test/sleepy-confused.mjs` (the last three also run on the round 13 code for the before numbers);
  `tools/status-clip.mjs` records a dungeon run now (`--run`, `--setup`), takes `--q`, `--zoom` and `--speed`.

## Round 14, lane W (2026-11-22): the wagon's third round
The designer's notes on 0.15.0's wagon (deck v15-book-wagon, card wagon2: parts size, edge, downed), each done as
written; the rules are in docs/CONVOY.md. Calls made on the way:
- **"15% less wide"** is the open ground between the tree lines: 2100 -> 1785 (the world 2800 -> 2385). The camera
  still shows 1500 across (it was marked good).
- **"Everyone 50% slower"** is movement, on the road only: every unit's speed is halved (walking, and the lunges and
  charges worked out from it), the wagon's too; attack rates, shots and the dungeons are as they were. At half speed
  the old road made a trip of about 11 minutes, so **a stretch is 1,500 of road, not 2,300**: a trip is about 8 min
  10 s in the batch (6 min 10 s before). Speeding anything back up was not an option.
- **A trickle and bursts, from all sides**: points come in all the time; half go on single foes from a random side,
  half are saved for a crowd every 38-50 s, sometimes from two sides at once. "All sides" is left, right, ahead and
  behind; all four still walk out from under the trees (the ones for ahead and behind come out up or down the road
  and then walk on to it), so nothing pops into view.
- **Guarding sides** is the designer's scheme as written: four half-ground regions cut along the wagon's four edges
  (front: above its tail; back: below the oxen's noses; left and right: this side of its far flank). "The cart" is
  taken to be the whole of it, oxen included. Inside its region a hero is also held near the wagon (430 from its
  outline to pick a fight, 640 at most), looks no further than 620, prefers foes on its own side and avoids those the
  others are already on. Fewer than four: three = front and two flank guards who share the rear; two = left and right.
  The sturdiest takes the front; a healer takes a flank and stands in close, in reach of every post.
  **This replaces "they walk ahead of the oxen in a loose line" with "each stands at its post"** when nothing is
  about (still no huddle). Non-gatherers now leave their side for gold only when it is close by (340); gatherers as
  before. Reviving is as before.
- **The wagon solid all round**: a row of body circles (and one at each corner of the bed) as units set in place; a
  blow on any lands on the wagon. Two things followed. Three times as many foes can reach it at once, and a split
  slime's brood broke it in the first stretch (the wagon broke in half the level 3 trips), so **a blow on a body circle
  counts 0.6** of one on its middle. And everyone needed a way round it: a unit whose straight line runs through the
  wagon walks to the nearest corner first (sim.js asks convoy.js). The wagon also became immune to charm, confusion,
  sleepiness, fear and bleeding (it could be charmed before: nothing in the Wildwood does it, so it had not shown).
- **Difficulty kept** (tools/convoys.mjs, 60 trips a level, the Wildwood, on main's 0.19.0 heroes, before -> after):
  delivered 82% -> 80% at level 3, 90% -> 85% at level 4, 87% -> 93% at level 5 (60 trips is good to about 5 points
  either way); foes out of the trees a trip 47 -> 34, 46 -> 33, 46 -> 34, and the ones made mid-fight (a slime's
  brood, summons) 23 -> 31 at every level: about 69 bodies a trip before and 65 after (a foe on its own is rolled
  without a cap on its cost, so the trickle brings more of the big ones); gold picked up 90/92/88% -> 85/88/89%. 0
  stuck, 0 errors, nothing popping into view. FLOW: 0.27 points a second growing 0.003 a second, half kept for the
  bursts (tuned twice: 0.31 matched the heroes this lane started from, 53/58/68% -> 52/67/70%, and came out about
  5 points hard on 0.19.0's).
- **Two things the batch found**, both fixed at the source: a melee hero could be given a foe pressed to the wagon's far
  flank, just past its edge, with nowhere on its own side to strike it from (it stood at the corner for ever: such a
  foe is no longer its to fight, and a hero past its edge is eased back square to the edge, not through the wagon);
  and the Bandit Chief, hiding at the trees past his stockade, was out of every guard's reach (he is everyone's now,
  wherever he stands). A stand-off's stragglers at a gate also wore down to nothing without ever falling (round 13's
  rule took their health but never finished them): they fall now.
- **The tree line** (sent back twice): three takes to pick from, `?edge=crowns | firs | bank`; **crowns is the
  default** (my pick: the biggest, simplest shapes, closest to how the heroes are drawn; firs is the busiest of the
  three, the bank reads least like trees). All three are two flat-shaded inked rows on layers that slide faster than
  the ground (1.5x and 2x), cached as tiles and only translated. The new line is in every country (hills, dunes and
  crags in the same big flat shapes): the other countries were marked good, but leaving round 13's small trees in
  some of them would have kept the look that was sent back. Round 13's bushes and fallen trunks at the trees' foot
  went with it.
- **The ground**: the tufts and the puddles are gone, everywhere (the Sewers' outfall lost its extra puddles too).
  The patches, the flowers and the road are as they were.
- **Tools**: `tools/edge-shots.mjs` (stills of the tree line), `tools/clip.mjs` takes `--lean`, `--calm`, `--send`,
  `--eval`. The recording tools left a headless Edge running after every run, not just failed ones (Edge starts
  itself again under another process id, which `taskkill /T` on the first doesn't reach): clip.mjs, convoy-shots.mjs
  and edge-shots.mjs now stop whatever still runs on their own profile folder, clip.mjs also when a run fails or
  hangs (`--max` seconds). The other tools that start Edge the same way still leave one behind each run. The three
  tools also wait on a timer (a headless page's frames stalled on a busy machine) and try a page load again when it
  comes up incomplete (`python -m http.server` refuses some of a page's hundred requests when they come in a burst,
  and one module missing leaves the game never starting: that was a three-minute wait and a failed run about one
  time in three). `?sides` draws each hero's region for checking.

## Round 14, lane U (2026-11-22): the unit page; the Book as grids
From the Riffle answers (`docs/riffle-log/2026-11-22-round14.txt`, card "book", and v141-battle part "dev"). The
structure is in `docs/UI-v4.md`; what was decided, and what was read into the designer's words:

- **One unit page** (`js/unit.js`) for a hero or a monster, opened the same way from the camp (a tap on a hero), the
  Book (a card) and the battle page (a row's picture). The camp's old hero panel (Gear / Skills / About) is gone: its
  parts are the page's Main / Upgrades / Stats, and what it could do is passed to the page as `acts`, so the Book's
  copy of a hero's page equips and upgrades too.
- **Pages side by side, swiped** (`js/pager.js`): a hero has Main, Upgrades, Preview, Stats; a monster Overview,
  Preview, Stats under a Base / Elite / Major switch that drives all three. The tabs are on top (the designer: "a top
  bar"); the controls of a page (moves, the tier dial, the floor stepper) are at the bottom.
- **The Book is five grids** (Heroes, Monsters, Trinkets, Statuses, Dungeons), swiped the same way. No strip of faces
  under a unit: Back returns to the grid where it was left. **Potions sit under the trinkets** on the Trinkets grid
  (the designer named four pages; a sixth tab for nine potions wasn't worth the width). **Open: their own page?**
- **Dungeon overview**: floors, who lives on each, mini-bosses and the boss, deepest floor, boss kills. The save has no
  runs, deaths or fastest clear by dungeon; the page says so rather than guess. **Open: record them?**
- **Monster stats "as they are in game"**: for a chosen dungeon floor (a stepper; it opens on the first place the kind
  is met), from `dungeon.js enemyMult` and `battleFoe`. An ordinary kind is taken at the middle room of the floor (the
  floor's average, the designer's "or would just show average"); a boss or mini-boss in the floor's last room, for the
  party's present size. Trinkets left off.
- **Stat icons** all come from `icons.js statIcon(id)`; the set there is a stand-in until the style is picked
  (`design/icons-r14`).
- **Previews, no words** (`preview-sim.js STAGE_TEXT = false`): the round 13 marks are gone and so are the game's own
  floating words and hit numbers on a stage (read as "No text pop up", all of it; one constant brings the game's
  numbers back if that was too much). Units that matter carry a health bar there (`u.barAlways`). What a tier adds is in
  the caption under the stage.
- **A locked ability plays** as it is at tier I, marked locked.
- **Trait scenes** (`TRAIT_SCENE`): one small yard each with only what the trait needs; attackers are targets holding a
  sword, bow, spear or hammer (`art/lab/dummy-<weapon>.svg`), in front of the hero, facing it; a number-only trait is
  shown as two things side by side that differ in the one way it cares about; a gold ring pulses once round whoever the
  trait just acted for. With abilities on, the stage casts them itself in turn (the hero's own choosing wouldn't spend
  one on a single target).
- **No trinkets on elites and majors** on a stage (taken off after the dice hand them out, so the kind's own dice are
  as before).
- **The status meter** "freaked out when full" because it showed the raw value, which is emptied in the step it
  fills, with "Burst!" swapped in and the bar's length changing with the words. Now: fixed size, fills, holds full for
  the burst, the picture of the burst's state lit while it lasts, then falls to what is left.
- **A burst that needs a trigger is shown both ways**, turn about (Frozen: left alone, shattered by a hammer; asleep:
  left alone, woken by a blow), with a switch to hold one.
- **Dev controls in one place**: Settings -> Dev (unlimited gold and points, the whole skill web, battle: field
  everything). The battle picker's switch is gone.
- **A stage fix that came with it**: the target that steps up to an elite or major whose move hasn't come is now held
  there (a turret's shots kept knocking it out of reach), so those moves show in every loop again.
- **Not done**: opening a unit from the battle *picker's* tiles (a tap there adds the unit; the stack's row opens the
  page instead). Over the skill web one finger pans the web, so there a swipe turns the page only from the screen's left or right
  edge (44 px), or on the tabs. **Open: two fingers for the web and one for the pages instead?**

## Round 14, lane L (2026-11-22): rooms that dragged on
The designer on the wither card: "I said no. I said to fix the source not the symptom." Everything measured, each cause
and its evidence: `docs/LONG-ROOMS.md`; the tools: `tools/long-rooms.mjs` and `runs.mjs --rooms` / `--watch`.
- **No clock on a room.** The stand-off clock left after the wither rule is gone (every enemy waking after 25 s without a
  kill; after 45 s of that or 150 s in a room, `w.stale`: enemies 30% faster, no backing off, regrowing, mending, calling
  help, digging in or slipping away, trolls dropping their boulders, turrets burning out, and in boss rooms the bosses'
  own summons and drones stopping). Nothing in a dungeon reads how long a room has lasted.
- **What was found**: most of the long-room time was a grind, not a stand-off (92% of it in four 150-run campaigns,
  82% in a sweep of 576 runs): deep rooms of the Foundry and the Dunes ground on for three to seven minutes, kills coming
  steadily, with a healer keeping the party out of danger. The clock had been hiding it by speeding up every room past
  150 s.
- **Fixed at the source**: enemy health and blows (`dungeon.js` HP_POW 0.85 -> 0.75, HIT_STEP 0.05 -> 0.09: round 8's
  "dangerous, not long", one more step; at the Foundry's floor 3 health 19% lower, blows 20% harder); revives (a helper
  no longer stands for minutes on its way to a friend it can't reach); a unit that can't get at its target picks another
  (`sim.js reachCheck`); shooters step round what blocks their line; fighters meet gears instead of chasing them; the
  troll's boulder throw, which never fired (its tell was never run), and a wedged troll lets its boulder be; heroes go for
  enemy healers first and the choir sprite no longer heals itself; shooters go round the gilded golem's mirror. The
  floors' last foes keep round 8's numbers (benched, the new step made the Queen and Cinder twice as hard).
- **The bosses' adds**: the clock had switched every boss's adds off 45 s into its fight, so three were measured without
  them; lighter now (the angel's Host every 45 s: back at its 12 wins in 20; the Ooze's Brood every 16 s and three at
  most: 12 against 7, a little easier; the Wurm's Brood one scarab at a time at 30%: still 3 against 9, left for lane B).
- **Measured** (`docs/LONG-ROOMS.md`): long-room time -37% in the campaigns, -28% in the sweep; runs at the 420 s cut
  16 -> 8; rooms over 240 s 13.0% -> 8.2% (campaigns). Win rates within noise of main 0.20.0 but the Sewers at level 30
  (1 of 12 against 4); on 0.20.0 the seed-2 campaign reached each boss 6-30 runs later than main (one seed: to measure).
- **Open, for the designer**: a hero left alone who can neither win nor lose (a Cleric against gears she can't hit);
  enemy armour growing to the 60% cap deep down (capping its growth measured -17% long-room time, but makes the late
  dungeons easier); battle mode's own 75 s press-in and 240 s judge, and the wagon's gate clock (foes withering after
  70 s: lane W's mode, reported, not changed).
- **Tools**: `tools/edge.mjs`, one headless Edge for every recording tool, closed over CDP and then by its own profile
  folder (the launcher pid taskkill used to target had already exited, so every run left an Edge behind).

## Round 14, the lead after lane L (2026-11-22): 0.20.1
- **The wagon's gate drain is gone** (foes losing 3% health a second after 70 s stopped at a stretch's gate): it was the
  wither rule in another mode, and the designer's ruling is "fix the source not the symptom". The source was a foe out
  past where a guard goes (the round 14 sides and leash). Now, 6 s stopped at a gate with foes still near, the guards
  leave their sides and hunt (`HUNT_AFTER`, js/convoy.js pickFor and guardTick); after 40 s the foes press in as before.
  Measured without the drain: delivered 24 of 30 at level 4, 17 of 20 at levels 3 and 5, 0 stuck.
- **The Sand Wurm**, 5 wins in 30 once its Brood ran the whole fight (lane L: the old clock had switched the Brood off).
  Cause found: the Brood's scarabs took the room foes' harder blows (HIT_STEP 0.09, the boss keeps 0.05) and come up
  beside the back line. The Brood's scarabs hit at 40% (`SW.brood.dmgMul`), the rooted window is 9.5 s (8.5), and heroes
  would rather hit a boss while its window is open than its adds (`WINDOW_PULL`, js/sim.js; by itself worth 2 wins in 30).
  Now 15 wins in 40 at level 54; the level itself is round 12's and is re-measured with the campaigns.
- **Kept from lane L as built**: no clock on a room; room foes' health 7-19% lower and blows 4-20% harder by depth
  (HP_POW 0.75, HIT_STEP 0.09), bosses and mini-bosses on round 8's numbers. Battle mode keeps its 75 s press-in and
  240 s judge (a sandbox's rule for setups that can't end, not a room's).
- **Asked in Riffle (deck v201-rooms)**: a lone hero who can neither win nor lose; my pick is to leave it to the player.
- Campaigns on 0.20.0 before lane L (four seeds, 150 runs, wipes at 75%): the Foundry's boss first falls at runs 101, 80,
  91, 62; runs at the 420 s cut 2, 6, 8, 2.
- **0.20.2, the hit step eased (the lead).** Four-seed campaigns after lane L: the Foundry's boss first fell at runs 100,
  121, 112, 141 (0.20.0: 101, 80, 91, 62). The slowdown sat in the last three dungeons, where room foes' blows were up to
  20% harder. HIT_STEP 0.09 -> 0.07 (about 15% harder at the Foundry's floor 3; health as lane L left it): the boss falls
  at 97, 96, 120, 73; runs at the 420 s cut 7 (13 at 0.09, 18 on 0.20.0). Rooms over the same four campaigns: median
  121 s, 90th 234 s, 9.1% over 240 s (before lane L 134 s, 255 s, 13.0%; at 0.09 110 s, 225 s, 8.2%; the 0.07 campaigns
  spend more of their runs in the Foundry, whose rooms are the longest, so the mix is a little against it).
- **Art round 12** merged (design/class-round12; props in art/summons and art/heroes/r12, not wired; the wiring table is
  in its notes.md). Deck art-round12 sent. The game keeps stand-ins for the six new heroes until the picks.

## Round 15, lane N (2026-11-22): six new heroes (the Mob, the Clockmaker, the Air Mage, the Warden, the Telekinetic, the Earth Mage) and Shackled
The designer's words: the showcase 3 deck notes (`docs/riffle-log/2026-11-22-round12.txt`). What was built, hero by
hero, with every clip: `docs/HEROES-r15.md`. The numbers: `docs/balance/r15-newheroes.txt`. The calls made here:
- **The Mob is four units that are one hero** (`js/mob.js`): the torch-bearer is the hero's own unit, the other three
  are bound to it (their health, statuses, buffs, kit and side are its fields). Not one unit drawn as four: they are
  really apart, really knocked about one by one, and really run back together.
- **One blow that catches several of its bodies** lands in full on the first and 30% on each more (a slam on all four:
  190%). The designer said one health pool and nothing about area attacks; without a rule every area attack in the game
  hits this hero four times. **Open: is 190% the right price, or should a blow only ever land once?**
- **"Each is like 30%"** was read as what each is worth in a fight. Health: 388 against a plain fighter's 314 (31%
  each). Blows: at 30% each on paper the Mob measured as the weakest hero in the game (four small bodies spend part of
  every fight finding a place to stand, and are in reach of more enemies), so they were raised three times: 18.1 a
  second on paper against the Haymaker's 13.0 (35% each). Strength in Numbers also takes 7% off a blow for each
  neighbour, and Scatter heals from tier I, for the same reason. It is now inside the fighters' spread and still on
  the weak side of it (below).
- **Where they ended** (`docs/balance/r15-newheroes.txt`, section 7): all six inside their role's existing spread at
  tier I and tier III but one. **Strong:** the Telekinetic at tier III (+1.19 rooms against the batch, over the old
  caster top of +1.01; Hurl III), flagged and not eased; the Earth Mage at tier I (+1.11, inside). **Weak:** the Mob
  (-0.64 and -0.85, it takes 56-57% of its party's damage); the Warden's damage at tier I (19%, a point under the
  tanks); and two of the Warden's abilities by rooms cleared, Nullify (+0.00 at tier I, though it spares the party the
  most damage of any of the eighteen) and Chain Gang (inside the noise at both tiers). **Open: ease Hurl III, lift the Mob again?**
- **Armour against the Mob's blows** counts 35% (`mob.js MOB.armour`): armour takes its points off every blow, which
  is four times for the Mob and once for a fighter. **Open: or should small blows just bounce off armour, as a swarm's do?**
- **A heal that reaches several bodies counts once**; a status lands on the hero whichever body it caught; charmed,
  down, lifted and through a door they go as one.
- **Names**: the "Clock work hero" is the **Clockmaker** (id `clockwork`). **Open: the name.**
- **Each kit's three jobs** (the "samey" note): the Mob holds one / herds many / gets out; the Clockmaker turns a
  friend back / slows a patch / stops the room; the Air Mage pushes / lifts / pulls; the Warden shuts one down /
  undoes what is in the air / holds a crowd on himself; the Telekinetic throws a thing / throws an enemy / shelters
  friends; the Earth Mage shakes / spikes / walls.
- **Shackled** (`docs/STATUSES.md`, "Round 15"): the designer's rule is the burst. My additions: it is a build-up like
  every other status; while it builds, cooldowns run up to 50% slower; 4 s; the setback is once, when the irons lock,
  and never past one full cooldown; bosses 40% of the time, a quarter of a cooldown, 12 s before the next. An enemy's
  "cooldowns" are the moves its brain times with `elites.js due()`: that helper keeps each timer's length now so the
  burst can set each back by its own share. **Open: should it do nothing at all while it builds?**
- **No words pop up** for anything new: Shackled has no "SHACKLED" text, the Mob's and the mages' effects are drawn.
- **Hurl really takes the rock** out of the room (the way through opens, the path grid is rebuilt). Not fountains,
  trees, a boss room's pillars, a troll's boulder or anything with health of its own.
- **Stone Wall is a real wall** (`sim.js wallRect`, the Ice Wall's kind): nothing walks through it and the enemy
  can't see or shoot through it. As a plain wall it measured as a loss (it stood in the party's own line of fire), so
  it is raised low on her side: the party sees and shoots over it (`wall.over`, read by `path.js lineClear` and the
  shot loop in sim.js). She still only raises it across the way of a brawler coming for a soft friend.
- **Mind Shield holds her still** while it is up: the dome is round her, and a hero who kites would walk it off the
  friends it shelters.
- **Rewind's revive** (tier III) is once a room and only for a friend who fell within the last 5 s; his own trait is
  the same trick on himself, once a room.
- **Looks in takes** (`js/fxvar.js`): `?v_shackle=1..3` (Irons, Wound, Staked) and `?v_timeBubble=1..2` (Dial,
  Glass); take 1 is in the game.
- **Art**: stand-ins by recolour in `art/heroes/standin/` (`tools/standins.mjs`); the list and the one line to change
  when the real files land: `docs/ART-NEEDED.md`.
- **Sounds**: nothing new. Every ability gets the game's ability cue from `kits.js`; shots, walls, blasts and statuses
  are heard by `sfx.js`'s watcher as they are for every hero. Shackled has no sound of its own yet.
- **Tools**: `tools/hero-clips.mjs` (the clips, through `tools/clip.mjs`), `tools/test/hero-vs.mjs` (one hero against
  others of its role, same parties and seeds), `tools/standins.mjs`. `tools/heroes-doc.mjs` writes the six into
  `docs/HEROES.md` too.

## Round 15, lane E (2026-11-22): art round 12 wired in, the eight lifted statuses, clips that spend points, bosses at their levels
### 1. Art round 12's summons, props and weapon hands (design/class-round12/notes.md, section C)
- **How**: each code-drawn kind has its `art` and `headR` (js/heroes2.js); its `LOOK2` drawing is gone (fx2.js) and
  what it also did is kept in a new table, `ART2.<kind>` (looks2.js says how, fx2.js fills it, render.js
  `drawPartsUnit` runs it): under it, in the body's frame, its parts' pose, how solid, over it in its SVG units, after.
  The demon form is art on the def Awaken swaps in (kits2.js `summonImp`; its picture is got ready with the Warlock's,
  heroes2.js `forms`); the imp only changed its art path.
- **Kept from the code drawings** (the notes' table, every row): the bale's straw rolling with `u.roll` (straw lines in
  its own two colours run over its body between the twine bands) and its flames when burning; the totem's rise out of
  the floor and its crack; the spirits see-through (`spiritA`) with their light-blue glow, the bear's rocking walk,
  the eagle lifted by `u.hop` with its wings beating (drawn narrower and wider across), the beaver's turn when it
  shoots (`u.spin`); the cauldron's fire and bubbles; the hive's three bees; the crate's gold pulse; the barricade's
  crack and its spiked file when `u.spikes`; the pavise's crack; the bomb swelling faster and its spark's glow creeping
  down the fuse; the torcher's jet; the tesla's glow at the ball; the mortar's kick back (its `#top` slides back);
  the medbay's green pulse; the med drone's wobble and spinning rotors (two blades over its rotor discs); the wind-up's
  key turning (its `#back` squeezed across: parts.js `place` takes `sx`) and a waddle as it steps; the demon's glow
  and embers. The party's summons' pictures are asked for when a room starts (render.js `warmArt`), so a totem's
  rise isn't spent while its picture renders.
- **Lost, said plainly**: the spirit bear's paw swing (the picture has no paw of its own: the rig's lunge on each blow
  stands in); the bomb's fuse getting shorter (the picture's fuse is fixed: only its glow creeps down); the wind-up's
  stepping feet (the waddle stands in). Gained from the rig, as every unit with art has: the white flash and the
  squash when hit.
- **Facing**: the standing things (totem, cauldron, hive, tesla) and the ones the code never turned (crate, medbay,
  med drone, the bomb) are drawn as their file is, foot down the screen (`def.upright`, also with the view turned).
  The pavise and the barricade turn to their facing, as the code's did (the notes list the pavise as standing, but
  the code turned it to face the enemy, and a pavise only works facing them). The torcher and the mortar turn their
  top over a deck that stays where it was set down (`turret: true`; render sets `u.baseA` on first sight).
- **Colours**: the props keep their own colours (`def.ownLook`): the code drawings were never turned our summons'
  blue-grey. The imp keeps the blue-grey, as the placeholder had ("only the art path changes"); one word
  (`ownLook: true` on `warlockImp`) gives it its own purple and pink.
- **Warhelm**: `#arm-l-hammer` rides his left fist and hides while the hammer circles or flies (`u.kit.hammerOut`);
  his fist stays. Storm Born's fists now take turns (`style.dual`): the split was made "so the fists can alternate",
  the designer's own words for Storm Born ("punches with his fist alternating"); a pose change only, no sim change.
- **Bearskin**: `#arm-r-club` hides while he claws (`u.kit.clawsT`); the paw on his fist claws.
- **Trapper**: the jaw trap stays on his hip while traps are out (the notes said it "could be hidden": not asked).
- **The Engineer's mortar is the kind `snowMortar`**: `mortar` was also the Foundry's enemy, and units.js
  `Object.assign(DEFS, ENEMIES)` put the enemy in its place, so Tinker's "snowball mortar" has been a Foundry mortar
  firing shells, and the first time an Engineer built one the code drawing was hung on the Foundry's shared def (every
  Foundry mortar drawn as the Engineer's tower after that). Plainly a bug, and the art couldn't be wired without it:
  renamed (heroes2.js, kits2.js, fx2.js). The Engineer's mortar now lobs the snowballs its words promise.
- **Weak, said plainly** (as they read in the game, `clips/r15/wire/`): the med drone is a pale dot with a green speck
  (its rotor blades barely show at game size); the medbay is a pale flower on the deck with a small green cross (the
  code's big green cross read more plainly); the pavise reads as a painted shield on a prop; the demon form is dark,
  but its wings, red face and sword read on the floors seen. None reads worse than its code drawing in a way that
  loses what it is, so all are wired.
- **Evidence**: `tools/wire-shots.mjs` (the renderer bench's showcase through `tools/labshot.mjs`, which got `--eval`,
  `--probe` and a second wait so a picture first asked for mid-step is drawn): `clips/r15/wire/<name>-before.png` and
  `-after.png` at the game's default zoom, cropped round the hero and the thing; `full/` has the whole frames.
- `sw.js` unchanged (its list already held every file: `build-sw.py 0.21.0` gives the same file).

### 2. The newer heroes' eight effects lifted into the statuses
- Whirled, Spun, Dirty, Targeted, Tracked, Trapped, Warded, Weakened: statuses.js rows (`WHIRLED` ... `WEAKENED`,
  `HERO_STATUS`), icons, Book cards with previews, HUD rings, rules in docs/STATUSES.md ("Round 15 (lane E)").
- **Whirled's and Spun's values stay in `u.k2s`**, not `u.st`: everything that resets `u.st` (cleanses, going down,
  revives) and Nullify II's "anything building on a friend" check would otherwise have reached them.
- **Shared rules kept apart (today's behaviour)**: cleanses don't take them off; the designed bosses' default "nothing
  builds on us" (boss-kit.js) is not extended to them; boss limits stay as they were (only `def.boss`); a Mob's or a
  chain's body takes them itself; stats don't count them. **Resistances**: `def.res.<id>` is read now (`resTo`); no
  kind has one. **Fixed, plainly a bug**: Nullify II stripped Warded's border but left its shield on (kits3.js).
- **The Book's generic "Weakened"** (a red down arrow, any harmful buff) **is "Hindered" now**: two tiles had one name.
- **Proof of unchanged behaviour**, same seeds before (main 0.21.0) and after, `--v`: `runs.mjs --n 3 --theme all`;
  `--level 30` and `--max` with `griffon,digger,marksman,falconer` and `airMage,pirate,griffon,monk`: identical line
  for line. With the Shade in the party (`trapper,monk,alchemist,shade` at 30 and max, `shade,alchemist,warden,trapper`
  at 30) two runs of the very same code differ: the Shade's shadow clone uses `Math.random()` (kits2.js
  `shadowCloneBrain`, since round 13). Those were compared with `Math.random` seeded the same way in both (a wrapper,
  not in the repo): identical line for line. Not fixed (outside the lane): it makes any batch with the Shade
  unrepeatable.

### 3. tools/clip.mjs spends skill points
- By default every hero's points for its level (START_POINTS + level - 1, less what it has spent) are spent with
  progress.js `autoSpend`, as runs.mjs does: a run's or a convoy's party at `--level`, and in a battle every hero not
  named in `--nodes` (at its save's level). A hero named in `--nodes` keeps exactly those. `--nospend` is the old way.
- `tools/hero-clips.mjs` passes `--nospend`: its battles name the hero's tiers in `--nodes` and its runs force the
  tier at the use, so its clips stay as made. `tools/status-clip.mjs` doesn't use clip.mjs (its battles set each
  hero's nodes with `tierBuild`); unchanged.

### 4. The bosses at the levels the campaign meets them (docs/balance/r15-bosses.txt; nothing retuned)
- **A round 15 bug decides five of the nine**: the Mob's `partOf` (a body's death, blow share and statuses go to its
  lead) also catches the designed bosses' parts (boss-kit.js `part()` sets `partOf`), so breaking a part kills the
  boss: the Great Engine dies at 92% health when a hand breaks (40 of 40 at 55, fights of about 22 s), Cinder 38 of 40
  in about 40 s. Fix proposed (measured on a copy, not made): send to the lead only when it is a Mob's
  (`u.partOf.bodies`), in sim.js kill, hurt's pool, addStatus and step. With it, at the level met: the Engine 7 of 40,
  Cinder 19, the Sand Wurm 6, the Great Ooze 11, the Seraph 30.
- runs.mjs `--campaign` prints the levels each run went in at, and with each boss kill the party's levels then.

### Found and not fixed (outside the lane)
- The boss-part bug above; the Shade's `Math.random()` above.
- `tools/test/progress-check.mjs`: "falling mid-floor loses 20% of the gold" fails, the same on untouched 0.21.0.
- `tools/test/t1.mjs`-`t5.mjs` can't run: they import `playwright` (not installed: tools has `playwright-core`), use
  port 8811, and drive camp buttons the game no longer has (`#enterBtn`, `#toCamp`, `GAME.save.depth`). Run through a
  stand-in on port 8975 they stop at those buttons, as they would on any recent build.
- Batches with `trapper,monk,alchemist,shade` and `shade,alchemist,warden,trapper` get stuck now and then (a room that
  never ends), the same before and after this lane.

## Round 15, the lead after lane E (2026-11-22): 0.21.1
- **Bug fixed, live since 0.21.0: breaking a boss part killed the boss.** The Mob's code read `u.partOf` as "a body of
  the Mob", but boss parts (boss-kit.js part()) carry `partOf = core` too: a broken hand ended the Great Engine at 92%,
  and parts' blows, statuses and clocks went to the core. Every Mob read now asks `mobLead(u)` (js/mob.js: the lead only
  when it has `bodies`); battle.js, inspect.js and render.js ask the same. Found by lane E's boss benches.
- **Two bosses eased to about even** at the level the fixed campaign meets them (docs/balance/r15-bosses.txt): the Great
  Engine's health 680 -> 580 (lane E's proposal; 20 of 40 at level 58, was 7-10); the Sand Wurm's breach 113 -> 80 and
  its landing 68 -> 54 (lane E proposed -20%, which gave 10 of 40 at 51; one step more gives 20 of 40).
- **Not taken yet, proposals in r15-bosses.txt**: the Elder Ent's health +20% and the Bone King's 1000 -> 1200 (both win
  too often), the Great Ooze's health -6% (13 of 40). Left for a pass with the designer's boss answers in.
- Lane E's own calls are in its entry above (the Engineer's mortar renamed `snowMortar`: a Foundry enemy of the same
  name had been overwriting it; the Book's generic "Weakened" is now "Hindered").

## The designer's tag-system notes (2026-11-22, chat; not built, the rest is coming in Riffle)
- Mute and Deaf are traits, always on. Silenced and Deafened are statuses that wear off.
- Deaf is deaf to everything: a Deaf hero gets nothing from its own side's sound effects either (the Bard's songs,
  rallying shouts), as well as being immune to the enemy's.
- No console port for now. An engine port was discussed (Godot the better fit); not decided.

## Round 16: the balance audit (2026-11-23)
The designer: pin every open idea and move on to balance. Go through every hero, enemy and status for how strong they
are against each other; before any tournament, test every hero in different scenarios (1v1, a foe with charged
attacks, a swarm, a melee + ranged duo, a normal dungeon level, with an ally) for how often each ability fires, with a
full breakdown per ability against the weapon (damage, blocked, healing, kills, statuses applied, status damage, time
under statuses and buffs); the same audit for enemies ("2 rats taking out a wolf"); how much each status changes
outcomes in mirror fights with a status fed in at a fixed rate; and the lasting-state cooldown problem (the farmer's
hay bale, the Thor-like hero: a cooldown runs while its state lasts, so it's ready the moment the state ends; it
should start charging at exit, or count the ability's average length). "I want to see the results of your findings
before you run a tournament or change stats/fix cooldowns."

The lead: measurement only this round. A null-guarded hook (js/stats.js AUDIT.on: hurt, block, heal, down, status,
burst, cast) added on main; four Opus lanes in delve-wt: audit-heroes, audit-foes, audit-statuses, audit-cooldowns,
each writing tools/audit/<lane>/ and docs/audit/<lane>.md. Tournaments (1v1 brackets at several tiers, and 2v2 with a
Paladin on each side so healers and supports count) wait until the designer has read the findings.
Pinned in Riffle Misc ("Pinned: more ideas"): tags on everything, red when evil, unit maker, unlocks and quests,
battle videos, scripted lines in videos, lore, who can find Delve.

Later in round 16 the designer asked for measured values, not only a worth number (statuses lane leads with them), and
a with-or-without test per ability (a fifth lane, audit-worth: docs/audit/worth.md), and asked whether Stagger or
Shock carries Warhelm against bosses (docs/audit/boss-stagger.md: both, Shock a bit more; tier II alone wins 74% of
boss fights, 54% with neither).

Findings, all six areas in docs/audit/, reported in Riffle (topic balance, "Round 16: the balance audit"), with the
calls in "Round 16: calls from the audit". Nothing changed in the game; the lead's picks, all waiting on the designer:
- Fix five bugs first: battle mode ends a fight when a side's last fighter is ethereal (battle.js `fighting()`);
  Barrage replaces Frost Arrow's queued shot (`u.later`); `lob()` zones credit nobody; a Saw-Blade-only side loses at
  once; unit ids never reset, so a seed doesn't replay a fight.
- Cooldown rule (a): the cooldown starts when the state or world effect ends (Storm Born 81% -> 50-57%).
- Poison: Sickened 30% -> 15% (Poison is worth ~3x Burn); Confused: Addled abilities aim at random.
- Enemies: Wolf cost 1.5, Rat 1.3, Gilded Golem's mirror sends back half; the status foes after the Poison call.
- Do-nothing abilities and flat upgrades (Valkyrie's Call, Roll, Supply Crate, Old Tales, Entangle, Cure III worse
  than Cure I) drafted in a deck after the tournament.
- Tournament after the fixes and the cooldown rule: 1v1 at I-III, 2v2 with a Paladin each side, a three-foe group
  bracket (44 abilities need 2+ foes), bosses scaled; health margin breaks ties.

## Round 17: fixes, slimes, enemy prices, playtests (2026-11-24)
The designer (chat): handle the five bugs from the audit. Slimes have too much health and the wolf maybe too little
damage. Slimes hop with a real vertical offset, aren't touched by floor things while in the air, jump further and
faster, and their contact does the damage. Weak abilities can be balanced by when they fire (a dodge roll only when a
blow is about to land). Every enemy priced against the Wildwood's first floor, all in one price range and strength;
dungeons, floors and rooms then scale their stats. The first room could hold a major: not a gradual introduction.
"Might" remove trinkets from elites and majors later (not now). Play the game from zero with different strategies and
report the progression (levels, gear, seats, how hard each room and boss is).
The lead: four Opus lanes in delve-wt: fixes16 (five bugs + when abilities fire; no number or cooldown changes),
slimes16 (hops, airborne, contact damage), foes16 (one worth-per-cost yardstick at Wildwood floor 1, every kind its
own cost, RANK_MULT re-set to keep each dungeon's overall difficulty, elites x3 and majors x7 of a kind's cost taken
from the room budget, no majors on the Wildwood's first floor), play16 (fresh-save campaigns with several strategies,
measurement only, on the game as it is now). Cooldown rule, Poison, Confused and the tournament still wait on the
round 16 calls deck.
Round 17 landed (0.21.3 to 0.22.0, 2026-11-24): the five bugs fixed (docs/audit/fixes16.md), abilities fire in their
situation through js/threat.js (no number changes; Roll and Dash are checked every step while ready), Cure III bug
fixed; slimes hop with height, skip floor effects while up, hit by landing (docs/slimes16.md; lead's calls: lobs and
passing gas miss them mid-hop, heroes' leaps aren't airborne, Ice Slime chills on touch); every enemy priced on one
yardstick at Wildwood floor 1 (js/prices.js, docs/audit/foes16.md), RANK_MULT re-set to [0.75, 2.15, 3.82, 3.96, 4.03,
5.22, 5.6, 6.5, 7] keeping each dungeon's difficulty, R12_MULT keeps the old numbers for bosses, hazards and XP;
elites cost x3 and majors x7 from the room budget, none on the Wildwood's first rooms, no majors on its first floor;
Gilded Golem's mirror sends back half; the endless Scorch loop fixed. Playtests (docs/audit/play16.md, on 0.21.2): a
lone hero reaches all tier IIIs in the Wildwood, the Alpha is won 98% at first try, the Ent is a wall, foes climb
45-56% within a run. Open in Riffle (topic balance): tier III gates, Wildwood bosses, gentler first run, solo
viability, floor step, enemy statuses growing with depth, Valkyrie's Call, three slime calls; plus the round 16 calls.

## Round 17, lane foes17 (2026-11-24): trolls get their boulders; chains follow the leader
The designer: "look into the troll shaped enemies not being able to get their boulders"; the yeti's snowball "is its own
entity. Should not move like it's nothing"; chains: "Follow the leader segments, each with its own hit box"; the sand
serpent: "each segment the same size. Add a tail segment that has it taper off. Show with and without each segment
having its own outline. ... chained back to front. Not stacked near the head. Is always laying down. Moving like the
centipedes from florr.io ... in bursts and in a slither motion". Everything measured: docs/foes17.md.
- **Trolls** (troll, rock troll; foes9.js boulderBrain): its own boulder was in the way of every path it asked for
  (path.js pathClear now takes a skip; sim.js goalVec skips a troll's own boulder), it steered off its own loose
  boulder, the round-14 jam rule stood it bare-handed 6 s beside its boulder every time a hero leaned on the boulder,
  a boulder out of its reach was tried again for good, and the elite's recall rolled it through the troll. Now: reach
  26 past touching; a recalled boulder is caught; a jam with a hero at the boulder or a line to its mark is just its
  throw (no rest; 4 s rest only with no line); **a boulder it can't get to (no nearer by 20 in 3 s): it tears a new
  one out of the floor (1.1 s) and the old one crumbles** (lead's call: the yeti's own rule for a ball it can't use).
  Dungeon runs, back in its hands within 6 s of letting go: Warren 82% -> 94%, Crypt 69% -> 97%, Foundry 79% -> 96%.
- **The yeti** (foes10.js): it pushes the ball the nearest way it can (its body fits behind, room ahead), so a ball on
  a wall goes along or off it; with no way (a corner, a pocket) it hauls the ball out backwards, hands on its front;
  it walks round its ball, not into it; a ball it gets nowhere with for 9 s it leaves to melt and packs another.
  Staged wall / corner (the ball pushed 50 off where it lay within 15 s): 0/20 -> 20/20 (8 s, 11.5 s); in real
  rooms about even (80% back within 6 s before and after: the haul is slow on purpose).
- **Chains** (families.js; the sand serpent and the chain crawler; the Sand Wurm keeps its own body): a trail laid by
  distance, each link a fixed distance along it (gap = a link's length: serpent 26 -> 52, crawler 28 -> 38; bodies
  longer: 156 -> 357, 224 -> 337); equal links and a tapering tail link (smaller hit circle); a knock back into its body
  or a too-sharp corner lays the body as a chain (each link its own gap); turns no tighter than 0.8 gap; bursts (a surge
  to 2.2x its pace, a glide at 0.7x; serpent 1.1 s beat, crawler 0.9 s) and a slither (serpent +-0.5 rad, crawler
  +-0.22) tied to the ground; no lunge back through its own body; flat (def.flat: no step bounce or breathing; the
  serpent's strike no longer lifts its head). Spacing kept at 0.87-1.08 of a link in every test (before: down to 0.10
  on a knock, links piled 1-2 s a run).
- **Open, for the designer**: one body or each link outlined (`?chainlines=own`, clips both ways); the longer bodies;
  the troll tearing up a new boulder; the head's two diamond shapes are in its SVG (not touched).

## Round 18 (2026-11-24): tags, boulders, snakes, the Water Mage

The designer, in chat (while still reading round 17's report):
- "Work on the tag system. For example constructs (stationary, built) can be tagged construct, then there could be a separate healing ability that only affects constructs. Think the engineer hitting its turrets with their wrenches. Can heal its constructs but not his allies. Or any fire tagged entity taking damage when wet or in water. Or the silence stopping mouth abilities. Add the obvious ones. Then anything else you could imagine being good, you can suggest. Also add to riffle."
- "Also look into the troll shaped enemies not being able to get their boulders."
- "And segmented snake enemy movement being right." (Riffle, earlier: follow-the-leader segments each with its own hit box; equal segments, a tapering tail, chained back to front not stacked near the head, always lying down, moving in bursts with a slither like florr.io's centipedes.)
- New hero, the Water Mage: Bubble Shields (block magic, not physical; popped, they wet the one inside and knock those near back); Dome (large, wets every enemy in it, nothing enters or leaves, deflects projectiles, slowly heals allies); main attack a beam to the nearest target or a hurt ally, 2 s on, 1.5 s recharge, wets slowly, on allies heals and washes off what Wet would without wetting; Water Cannon (a large water laser healing allies, hurting and wetting enemies). Trait: hurt while on water, splashes 3 projectiles back at the attacker (as the lizards do).
- Credits: the weekly limit resets tonight; no swarm of top-effort agents.

Lanes (Opus, worktrees in delve-wt): tags17 (tag registry, construct repair by the Engineer's wrench, fire hurt by water, Silenced stops mouth abilities, the obvious tags, a suggestions list for Riffle), foes17 (troll boulder fetching, chain movement), water17 (the Water Mage; its bubble's magic check is wired to the tag lane's isMagicHit at merge).

Round 18, more rulings (chat):
- Valkyrie's Call: "Battle mode can have downed allies that can only be revived with abilities. (Corpses can be used for necromancy)". So battle mode gets a downed state; only reviving abilities bring them back; corpses feed necromancy. Queued for the next free lane (after tags17/foes17 merge: it touches battle.js and death).
- Slime calls: "Gas can hit slimes ... aoe slams shouldn't hit them (like from hammer weapons). Explosions can hit them." Leaps: "The winged tank or Valkyries saving jumps make them airborne not hovering. Slime just goes to the hovering layer for a bit. A witch on her broom also goes to the flying layer." So height layers: floor, hovering, airborne/flying, with hit kinds deciding reach. Given to tags17.
- "Fire tagged enemies that get set on fire don't take damage, instead getting a rage like boost." Given to tags17.
- "Also think about the physical damage types, sharp vs blunt damage." Given to tags17 (hit kinds; obvious interactions built, the rest suggested).
- "Get an agent on all enemies resistance and immunities and see if they make sense." Lane res18: an audit that proposes (no game code), on top of the tag system; its calls go to Riffle.
- res18 landed (docs/audit/res18.md, 165 kinds): 7 plain bugs (the undead name test catches the Orc Warboss and misses the Bone King, Grave Warden, Mummy, Icicle Wraith; chains build statuses once per segment; four Book gaps) to be fixed after tags17 merges; rules by tag proposed; 8 calls sent to Riffle (deck r18-resistances).

## Round 18, lane tags17 (2026-11-24): the tag system
The designer: construct-only healing (the Engineer's wrench on her turrets, not her allies), fire things hurt when wet
or in water, silence stopping mouth abilities, "add the obvious ones", suggest the rest. During the lane: fire things
set on fire get a rage-like boost instead of damage; sharp vs blunt; magic its own damage type, apart from the
elements it carries; height layers (a hopping slime hovers; the Griffon's and Valkyrie's leaps and the Witch's broom
fly). Everything in docs/tags17.md; code js/tags.js; checks tools/tags17/check.mjs.
- One registry, js/tags.js: unit kinds (from honest def fields plus explicit lists), abilities (mouth, sound, magic;
  the heroes' existing `tags` string left alone), enemy moves by their due() key, hits (hitKinds: type sharp | blunt |
  magic, elements, delivery). Shown in the pause panel.
- Built: the Engineer's wrench repair (12% of a construct's health a whack, with no foe within 90); constructs take no
  bleed or poison; Doused fire things ((1.5 + 0.06 x wet)/s, in water at least 60 wet, bosses half); water puts out
  half the burning; Kindled fire things (up to +30% dealt and attack speed, +15% move, Flare at full; bosses half;
  only the other side's fire); Silenced = mouth only (rule change); the Warden's Nullify keeps its full lock as
  Nullified (a mouth-only silence would stop 5% of what it stops); the undead tag for the Cleric's holy bonus (now
  reaches the Bone King, Grave Warden, mummies, Icicle Wraith); layers floor / hovering / flying (slams miss hovering,
  gas and explosions reach it; only shots reach flying); type resistances as a mechanism, none set.
- Merged tags17 and water17 (0.23.0). At merge: the Water Mage's bubble asks tags.js isMagicHit, so magic is its own hit type and a fire-carrying blade (sharp + fire) passes the bubble (its check updated to match). Fixed a crash on main found by water17: Encore / Old Tales / Supply Crate asked each other's scores for ever in a party with two of the Bard, Grandpa Sickle, the Quartermaster (wantedNow now looks one level deep).

Round 18, free rein (chat, 2026-11-24 ~20:00 the designer's time; the PC's clock is an hour behind theirs):
- "If I don't get back to you by like 12 my time I just want you to work. Find something to do. Free to use fable how u see fit." Ideas they listed: cleanup / unify systems; audit for repetitiveness; more, better art with Fable; more effects and interactions; synergy ("I do like the idea of synergy so see where you can make that the case"); smarter brains; weapon slash looks that match the attack animation ("spears slash is centered when the spear is usually off to 1 side"); more interesting enemy shapes (Binding of Isaac variety: flies flying in formations); a clockwork boss built into the level ("they are the room").
- Now: "I don't like how dash slash abilities work currently in general. Everyone from the wolf to hero's abilities. Make a few completely new variations of it." Lane dash18 (Fable, high: the current dashes were turned down).
- Now: the Book's previews: "Many abilities aren't shown at all, aren't in the right scenario to show themselves off, don't change between tiers when sometimes they should, the dummies don't attack like how an enemy would, I don't want the hero's to just take invisible damage." Lane preview18 (Opus).
- Merged foes17 (0.23.1): trolls fetch their boulders (path checks skip their own boulder, a lean-on jam counts as a throw, an unreachable boulder crumbles and a new one is torn from the floor: a call), the yeti hauls its snowball off walls and out of corners, the sand serpent and chain crawler follow the leader with equal links, a tapering tail, bursts and a slither (docs/foes17.md; `?chainlines=own` draws each link outlined). Audit fixes: the undead tag (tags17) already fixed the name test; a chain now takes a status once a frame per source, not once per segment (x4.6-5.8 -> x1.6, the head plus one link's share).

## Round 18, lane downed18 (2026-11-24): downed heroes in battle mode
The designer, on Valkyrie's Call never firing in battle mode: "Battle mode can have downed allies that can only be
revived with abilities. (Corpses can be used for necromancy)". The lead's calls, all easy to change (js/battle.js top):
- **Who goes down.** In a battle a picked hero (anything with a kit), on either side, goes down at 0 as in a dungeon
  (sim.js killNow: the same state, grey and limp, out of the fight, not a target, no statuses). Monsters, elites,
  majors, bosses, summons, constructs and the Mob's other bodies just die and leave bodies, as before.
- **Only abilities bring them back**: Valkyrie's Call (any tier; once a fight, as it is once a room) and the
  Clockmaker's Rewind III (a friend who fell in the last few seconds; once a fight). No standing over them (the Raiser
  and Light of Valhalla revive speeds don't apply in a battle), no getting up when it ends. The cheat-death hooks
  (Phoenix Feather, Old Bones, Spare Second, Back From the Wild) still keep a hero from going down, as before.
- **Bleeding out**: nobody can finish a downed hero, but after 15 s (BLEED_T) unrevived it dies where it lies and leaves
  its body. A ring in its side's colour runs down round it, pulsing over the last 4 s.
- **Losing**: a side with nobody up (everyone downed or dead) has lost at once; the downed count for nothing in the
  health-left tie-break.
- **Bodies**: whatever dies leaves a body as before (that already held in battle mode). A downed hero is not a body: no
  Necromancer can raise it while it might still be revived; once it bleeds out, the Necromancer's Raise Dead (either
  side) can. The Seraph's and the Radiant's raise stays as it was: only their own host's kinds, so never a hero.
- **Wraith Veil** in a battle: the ghost rises and fights on while its hero lies downed (it used to vanish at once, the
  hero being dead), on either side.
- **Result card**: a row says how many lie downed at the end ("1/2 left · 1 down"), "downed once, back up once",
  "1 revive" for the one who revived; under each side, who brought whom back and when. The strip under the fight
  shows a downed stack's chip faint brown-grey rather than gone.
- **Fixed on the way** (sim.js hurt): a blow whose own burn scorched its target to 0 brought it down twice (two
  'heroDown's, two Wraith Veil ghosts, a kill counted twice); now once.
Measured (tools/downed18/measure.mjs, tier III heroes, 8 seeds a setup): Valkyrie's Call casts in hero-vs-hero fights
0 -> 1.38 a fight (22 of 22 casts brought someone back; 24% of all downs revived, 40% bled out); with a party against
majors 0 -> 0.03 (heroes rarely go down there, and mostly it's the Valkyrie herself); Rewind III brought 6 back in 24
fights; every fight ended, 0 problems; the hero Necromancer raises 1.7 bodies a fight, the Seraph 1.1.
tools/battles.mjs: 528 battles, 0 problems, 9 -> 10 out of time (lone kiters, new dice), blue 249 -> 246, red 274 ->
277, draws 5 (after merging main: 8 out of time, blue 248, red 276, draws 4). tools/preview-check.mjs: threw 0, never
fired 0, not offered 0. Clips: docs/clips/downed18/.
