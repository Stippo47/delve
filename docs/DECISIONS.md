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
