# HANDOFF — Delve (mobile dungeon autobattler)

Read this first if you're a new session picking the project up. It covers what the game is, every decision made
so far (art and gameplay), what's built, what's weak, and what to do next.

---

## 1. What this is

An offline phone game for the owner's own **iPhone 11 (iOS 18.7.7, will not be updated)**. It's a static web app
(PWA): host it once (GitHub Pages), open it in Safari, Add to Home Screen, then it runs fullscreen and offline.
Same setup as the owner's other app, Riffle (`Stippo47/riffle`), which uses a `sw.js` cache with a VERSION bump.

- No build step. Plain HTML/CSS + ES modules + canvas 2D. No libraries.
- iPhone 11 has **no WebGPU**; WebGL2/canvas only. Low Power Mode caps rAF at 30fps.
- Landscape only.

**Deploy:** push this folder to a public GitHub repo → Settings → Pages → deploy from `main` (root).
Bump `VERSION` in `sw.js` on every release or phones keep the old copy.

**Run locally:** `python3 -m http.server 8811` in this folder, open `http://localhost:8811/` (modules need http,
not file://). Debug: `?seed=N` (fixed RNG), `?auto=D` (jump into depth D at 4×), `GAME.fastForward(seconds)` in
the console simulates instantly.

**Tests:** `tools/test/*.mjs` (Playwright; `npm i playwright` then `node tools/test/t5.mjs` with the server running).
- t1: load + enter dungeon + console errors. t2: 6 headless runs with event counts. t3/t4: screenshots at 844x390@2x.
- t5: 30 runs back to back — checks nothing gets stuck. Last result: 30 runs, 6 wins, reached depth 7, no errors.

---

## 2. Game design (decided by the owner)

**Core:** top-down, gridless autobattler dungeon crawler. Party of heroes goes room to room fighting and looting
with little or no player input. On defeat → home camp to level up / change equipment.

**Units:** physical circles (they bump, push, get knocked back). Slow-moving. Each has multiple move modes,
a basic attack, and a unique ability; describable in a few words:
- Archer: ranged arrows, strafe, ability Arrow Barrage, chance to dodge.
- Knight: tough, shield, approach, sword swing, ability Charge.
- Rogue: nimble, in and out, strafe, poke, ability teleport behind / shadow walk.

**AI (owner's specific asks):**
- Move mode re-scored every ~0.4s; pick by **weighted chance favouring the best** (keeps variance), with
  **hysteresis** so they don't flip every tick. → implemented: softmax with per-unit temperature + incumbent bonus
  + minimum commit time.
- **Context steering** (owner dislikes flow fields). → implemented: 16-direction interest/danger maps.
- Abilities auto-trigger at smart moments: periodic checks where better situations give a higher chance
  (AoE on groups, pierce when lined up). AoE *can* fire on a single target, just very unlikely.
  **Scores rise sharply when only one enemy is left.**

**Statuses build up to thresholds that trigger stronger states:**
- Burn → at 100: Scorch (burn drops to 20, big hit + small fire explosion).
- Chill slows → at 100: Freeze (~3s); a hard hit while frozen → Shatter into damaging icicles that spread chill.
- Poison → Rot (chunk of max HP); poisoned enemies leave gas clouds. Fire detonates gas, ignites oil, thaws ice.
- Owner loves synergy between systems and Easter eggs.

**Rooms:** hazards, chests that need keys, enemies. Party members who die stay down until the **floor**
is beaten, then return at 10% HP.

**Progression (decided):**
- Levels are permanent. On wipe: keep levels, keep ~half coins, **lose all equipment found in the dungeon**
  (you must beat the dungeon to take loot out).
- Camp: equip trinkets (e.g. amulet: invincible 2s at 1 HP on a killing blow; charm: chance to explode when hit).

---

## 3. Art direction (long iteration — read before touching any art)

Vocabulary the owner uses: **DESIGN** = shapes/parts/layout. **RENDERING** = outlines/shading/gradients.

**Locked:**
- `design/archer-final/archer.svg` — the FINAL archer. Peaked gold brim (no leaf clasp), leaf hood split light-left /
  dark-right with vein stripes, two-tone leaf petals at the shoulders, chunky flatbow with dark tips and leather grip,
  rounded-rect hands, quiver "1B" (tube with gold rim; two light cream feathers in front, one darker cream behind;
  feather halves line up). Face uses a **soft gradient**, not a hard split.
- `design/base-approved/base-*s-160.svg` — the APPROVED base human body for building every class. Head ~92–100
  units wide (fits inside the archer's hood footprint), hands ~24x21, shoulders 160 wide x ~64 deep, ~8 units in
  front of head centre. The **head is the round collision token**; shoulders/weapons/capes are detail without collision.

**Hard rules:**
- Each unit is **ONE sprite rotated whole** to face its target. No shifting components, no turning heads.
  Front = DOWN (+y) in the file. Centre (100,100). viewBox "-10 -10 220 220".
- Top-down view. Fun clean **vector** art. Refs: "Rush Royale art but just the head", "Smashing Four but simpler".
- One heavy dark outer outline (#2B2230, ~12) under shapes; **no inner lines**; soft gradients lit from the left.
  The hard light/dark centre split is optional, not everywhere.
- **No eyes, no brows, no blush, no dot nose.** Calm shadowed face under headgear; subtle mouth curve.
  A dark band under a brim reads as a screaming mouth — avoid.
- Characters must read as **adults**, not kids, but the base must stay a circle (~1x1) — don't stretch faces long/narrow.
- Weapons point forward like the archer's arrow. Must read at ~40px in all 8 rotations.
- No neon, no sticker, no 2.5D, no pixel art, no painterly.
- More complex shapes than plain ovals/circles for detail, but no small fiddly details.

**Lessons (owner's reactions):**
- Re-skinning the archer's layout for another class (petals→pauldrons, hood→helmet, quiver→shield) was rejected hard.
  Share base body + rendering, design each class from the character outward.
- "Different designs" must vary the thing itself (e.g. the skeleton's skull/jaw/bones), not just accessories.
- Head size drifted too big several times — always compare at the same scale against the archer / hood-only.
- He gives direct, specific feedback and expects it applied exactly; when unsure, show a ladder of options
  (e.g. widths 140/160/180) rather than guessing.

**Not chosen yet:** `design/class-candidates/<class>/sheet.png` — the latest round on the approved base:
- knight (Opus): Paladin, Old Guard, Bastion, Dame — strongest set.
- skeleton (Opus): Rattler, Gaper, Brute, Hollow — skulls too big vs base; shrink before using.
- rogue / farmer / barbarian (Sonnet): rougher. Earlier liked: barbarian Wildmane + Bearskin, rogue round 1,
  some farmers. The owner said "save these for now, work on the gameplay."
- `design/briefs/` has the agent briefs used; `design/history/` has every exploration round.

**Process the owner used:** parallel subagents per class/variant (he picks models: e.g. 2 Sonnet + 2 Opus at
high / extra-high), each producing a sheet (archer for comparison, big view, 8 rotations at ~70px and 40px),
then he picks and steers. Final small edits were faster done directly in the SVGs.

---

## 4. What's built (v0.1)

| File | What |
|---|---|
| `index.html` | HUD, camp, result screens (HTML) over the canvas; landscape; safe areas |
| `js/sim.js` | AI (modes, hysteresis, context steering, targeting), physics (knockback, wall slam, bowling), combat, statuses, hazards, projectiles |
| `js/units.js` | all unit numbers + trinket list (tuning lives here) |
| `js/dungeon.js` | 3 floors x 3 rooms, Bone King boss at the end; room templates; satchel/keys/chests; downed-until-floor; XP/levels |
| `js/render.js` | canvas renderer (floor cache, hazards, pillars, units, status rings, effects, text) |
| `js/sprites.js` | rasterises SVG art once per size; rats/slimes drawn procedurally in the same style |
| `js/save.js` | localStorage save (try/catch) |
| `sw.js`, `manifest.webmanifest`, `icons/` | offline PWA |

**Heroes:** Archer (kite/strafe, chill arrows, 20% dodge, Barrage of fire arrows), Knight (front shield −40%,
arc swing, heavy hits, Charge with knockback), Rogue (poison pokes, in-and-out, Shadow Step backstab).
**Enemies:** Rat packs, Slime (splits), Skeleton (wind-up telegraph), Bone King boss (ground slam).
**Hazards:** spikes, oil (slows, ignites → fire), fire, gas clouds; pillars.
**Trinkets (8):** Last Breath, Volatile Charm, Frost Ring, Ember Ring, Venom Fang, Vampire Tooth, Iron Skin, Swift Boots.
**Camp:** depth select (recommended level shown), hero cards, equip by tap item → tap hero.
**Speed:** 1×/2×/4×. **Retreat:** keep coins, lose satchel.

Placeholder art in `art/`: knight = Bastion, rogue = Shade, skeleton = Rattler, boss = Brute (candidates, not approved).

---

## 5. Known weak spots / next steps

1. **Not yet played on the real phone.** Deploy and check feel, fps, touch, Low Power Mode.
2. Pick final class art; re-export into `art/`. Shrink skeleton skulls to the base head size.
3. Rogue gets downed most and ends up lowest level — tune its retreat/HP or targeting.
4. Camp: talent points per level (planned: auto stats in-dungeon + talent choices at camp), shop, hero unlocks.
5. Planned-but-missing abilities: unlockable specials per hero (AoE on groups, pierce on lined-up enemies).
6. More statuses/interactions discussed: Shock→Overload (chains, doubles on wet), Bleed→Hemorrhage, Stagger→Topple;
   wet halves burn / doubles shock; fire+ice = steam blocking line of sight.
7. Easter eggs discussed: mimic chest, cracked wall opened by explosions, duck that follows if unhurt,
   rare "nothing personal" on rogue teleport crits, boss that stays asleep if the rogue leads.
8. Dungeon choice as the main decision (recommended level, risk vs reward) — reward scaling not tuned yet.
9. No sound yet.

Balance snapshot (headless, no trinkets equipped): depth 1 usually cleared first try; each later depth takes
a few attempts; ~6 wins in 30 runs reaching depth 7.

---

## 6. Getting it into a repo (from your PC)

```
cd delve-repo
git init -b main && git add -A && git commit -m "Delve v0.1"
gh repo create delve --public --source . --push      # or create it on github.com and `git remote add` + push
```
Then Settings → Pages → Deploy from branch → `main` / root. Open the Pages URL on the iPhone once, Add to Home Screen.
