# Round 18, lane preview18b: the monster pages and the statuses in the Book

The designer, on the Book's previews: "Many abilities aren't shown at all, aren't in the right scenario to show
themselves off, don't change between tiers when sometimes they should, the dummies don't attack like how an enemy
would, I don't want the heroes to just take invisible damage. I want to see how each ability works in the best way
possible." Lane preview18 rebuilt the heroes' ability previews as small real fights (docs/preview18.md). This lane does
the same for what it left: every enemy kind's moves on its Book page, and the statuses.

## What was wrong (the audit)

Every monster move the Book offers (147 kinds; attack, how it fights, the elite's move and the major's at each rank: 975
previews) and every status (42), two loops each, measured by `tools/preview-measure.mjs measureStage` (the same ruler
before and after; "before" is `js/preview-sim.js` as it was at `2e6480a`). `node tools/preview18b/foe-audit.mjs --v`
lists them; `tools/preview18b/before.txt` and `after.txt` hold both runs.

How the old monster stage worked: the monster stood at the right, four blue straw targets in front of it (never moving,
never striking back of their own), topped up when low. The nearest target "poked" it every 1.1 s for 1 damage without
a weapon. Its health was set to 45% at 2.2 s with no blow (for the moves that wait for it to be hurt); if its move hadn't
come by 2.4 s, a target was moved up to it and held there; its death move was a blow from a straw target. A friend of its
own kind beside it was set back to 45% whenever it healed past 70%. The status stage built a status on a goblin in
pulses from a blue straw target that never moved (or put the state on directly, from no one), and Silenced said "no
preview yet".

| Problem | Monster moves (975), before | after | Statuses (42), before | after |
|---|---:|---:|---:|---:|
| Straw targets on the stage, the move shown against them | 975 | 0 | 41 | 0 |
| Blows or health lost with nothing seen behind them (either side) | 720 previews, 3205 blows | 0 | 0 | 0 |
| The stage helped it: health set lower with no blow, a target moved up to it | 366 | 0 | 0 | 0 |
| Wrong scenario: it went off but nothing it made reached anyone within 3.5 s | 27 | 8 | - | 0 (every one comes to its burst or state) |
| A loop where it didn't go within 2.5 s | 75 | 23 | 26 | 0 |
| A loop where it never went / threw / not offered | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Put on from nothing seen (no fighter in view put it on) | - | - | 41 | 0 |
| No preview at all | 0 | 0 | 1 (Silenced) | 0 |
| A loop that showed only its plain blows (its own move never came) | 33 | 31 | - | - |

First go: monsters 1.05 s on average before, 0.99 s after (2.3 goes a loop both); statuses 0.86 s after (they used to
fire at the burst, about 2.5 s; now when the first dose lands, bursting on the third blow).

## How the monster previews work now

`js/preview-scenes.js` holds the scenes (data), `js/preview-sim.js foeStage` plays them.

- **Real heroes.** The monster faces a small party of real heroes (`FOE_SCENES`), level 9, running their own brains:
  the Paladin walks up and swings, the Archer keeps her distance and shoots, as in a run. Their abilities are held (the
  monster's move is the point), they hit softly (`FOE_HERO_DMG` 0.3) and are kept up (`FOE_HERO_FLOOR` 20%, then they
  mend; a hero brought down gets up at once). The monster, its friend and its pack are kept at a quarter and mend slowly
  when low, never set lower; it falls only when the stage fells it for its death move, and then a hero turns on it and
  strikes (or shoots) it down in view.
- **Scenes by move.** `party` (a fighter coming, a shooter behind: what most moves meet), `close` (up against it: slams,
  quakes, spins), `ring` (round it: volleys, novas), `far` (off at a distance, held a moment: charges, leaps, throws,
  lines), `reach` (held a short way off: a snap, a short lunge), `pair` (two together: barrages), `shooters`,
  `casters`, `weak` (a hurt hero: no monster goes for the weak by its own rule yet, so only a backstab kind would get it), `friend` (its own side hurt, a hero on it: menders, guards, war cries), `pack` (its
  pack beside it: howls), `standing` (heroes standing their ground: shells, bombs, fuses, things a hero would step out
  of, shown landing), `edge` (backed against the yard's edge: a charge that crashes into a wall), `boss` (four of them in
  the boss's hall). With no entry a move's scene comes from how the kind fights (`foeSceneFor`: a dash or a charge,
  a slam, a turret, a mender, a pack) and from its elite move's words (throws, lobs, quakes, "when hurt badly": it
  starts hurt with the heroes on it). `FOE_SCENE` overrides by kind or `kind:move` (27 of them: the boar's crash, the
  bandits' shield walk, the crabs' snap, the gaper's charge-spin...), with `prep` to bring a move forward that keeps its
  own clock (not `elites.js due`), and `free` for an elite whose move comes out of its brain's own (not held for it).
- A shooter monster starts further in, with room behind it to keep its distance; a boss no longer gets "its pack" as two
  more of itself (the Alpha's pack is the wolves it calls).

## How the status previews work now

`STATUS_SCENE` (js/preview-scenes.js) names who puts each on; `statusStage` plays it.

- **A build-up rides on a real hero's own blows or shots**: burn on the Pyromancer's, chill on the Frost Mage's,
  poison the Plague Doctor's, wet the Water Mage's, shock the Storm Mage's, stagger the Warhelm's, radiance the
  Cleric's, curse the Witch's, entangle the Druid's, charm the Enchantress's, confuse the Jester's, sleepy the Bard's,
  bleed the Twinfang's, fear the Shade's, shackle the Warden's, whirled the Air Mage's, spun the Monk's. Each blow that
  lands on the orc carries a share of what bursts it (a third; the Warhelm's stagger two thirds, an orc steadies
  quickly), so the bar jumps as each lands and it bursts on the third. The burst states (frozen, sick, ko, radiant,
  hexed, charmed, addled, terrified, shackled) are their cause's scene. Once it is on, the hero who put it on stops, so
  what follows is the status's own.
- **A timed state comes from the ability that puts it on in a run**, cast by the stage when it is time: stunned by the
  Paladin's Shield Bash II, rooted by the Druid's Entangle, asleep by the Bard's Lullaby II, taunted by the Dame's
  Challenge (the orc was going for the Archer), hindered by her Disarm, targeted by the Marksman's Aimed Shot, tracked by
  the Falconer's falcon, trapped in the Trapper's jaw trap, weakened by the Shade's Blackout.
- **On a hero**: guarded (the Paladin's Guard on the Archer an orc is hitting), untouchable (the Plague Doctor's Gas
  Form when the orc is on her), strengthened (the Bard's War Song on the Paladin), enraged (the Wildmane's Rage), dirty
  (the Digger's Dirt Fling over the Paladin in front of him), warded (the Jester's Mock: he swaps places with the
  Paladin in trouble and wards him).
- The two ways (round 14) stay: left alone, or the trigger (the Warhelm's hammer shatters the frozen orc, the Paladin's
  sword wakes the sleeper); the trigger is a real hero beside it now, holding its blow until the state is on.
- **Silenced** (new): a choir sprite, a major, sings (gold rings; the hobgoblin the Paladin is fighting mends, the
  heroes grow sleepy). The Cleric's Smite comes down on it; the blow staggers it and the sprite falls silent by its own
  rule (foes10.js choirBrain: a stagger silences it), the crossed-out speech bubble over its head. Its song stops while
  the ring of shots a major throws out (no mouth in that) still goes; when the stagger and the silence wear off it sings
  again (about 6 s later), all in one 9 s loop.

## The check

`node tools/preview-check.mjs` keeps its three failing counts (threw, a loop where it never fired, not offered: all 0,
2253 previews) and the heroes' report, and now reports the same for the monster moves and the statuses: first go and
goes a loop, a loop where it didn't go within 2.5 s, straw targets, wrong scenario, the stage helping, blows or health
lost with nothing seen behind them (either side), a status put on from nothing seen, a monster's loop that showed only
its plain blows; `--table` gives one line a move. The monster and status stages, and the main stepping, now number each
loop's units from the same id (`steadyStage`), so a result no longer hangs on what was checked before it (sim.js reads
unit ids: a wanderer's heading is `Math.sin(u.id)`).

- 2253 previews: threw 0, never fired 0, not offered 0, locked 0 (`tools/preview18b/check.txt`)
- monster moves: first go 0.99 s, 2.39 goes a loop; late 23, straw 0, wrong scenario 8, helped 0, blows from nothing 0,
  plain blows only 31
- statuses: first go 0.86 s, late 0, straw 0, wrong scenario 0, helped 0, blows from nothing 0, from nothing seen 0
- abilities: as lane preview18 left them, except "tiers that differ only in where things went" reads 22, not 19 (see
  below)
- `node tools/battles.mjs`: 528 battles, 0 problems (8 ran out of time)

## Still weak, and why

- **Wrong scenario, 8**: the Ent at rank 1, the Rock Troll major, the Plague Rat and the Bone King at rank 0, the Yeti at
  rank 1, the suicide goblin at ranks 0 and 1, the saw blade. In a loop of each, what the move made (a ring, a cloud,
  a lane) caught nobody: the heroes, moving as in a run, were out of it by then. The suicide goblin is the worst: the
  heroes' own blows knock it away from them mid-fuse, so it blows up alone (a party standing its ground let it circle
  round them instead); the saw blade runs its own track and the heroes aren't on it. Each shows its tell and its
  landing.
- **Late, 23**: moves on their own clocks or that need a run-up the scene can't hurry: the leech's latch (3 s on a host
  before it spits), the sun blade's major leg, the cobra's spray, the chain creatures' coils (their segments are laid
  out first), the cinder's opening, the imp's blink (only once someone is close), a few rank-2 kits.
- **Plain blows only, 31**: mostly the dash and lunge kinds (goblins, knife bandits, mice, rats, lizards, devils, angels):
  their dash is a roll of the dice each think while in range, and in some loops the heroes close in first. That is the
  other lane's dash rework; the scenes give them room (`far`). The rest (the axe bandit's throw, the crabs' snap at rank
  0) come round after the loop's fight has closed the gap.
- **The "own move" of an elite whose move lives in its brain** is read off its brain doing anything at all (it was so
  before), so a brain-timed elite move (the boar's thorns, the wolf's quickening howl) is counted as fired when its brain
  acts; the clips are what show the move itself.
- **The heroes' tier report moves with the order things are checked in**: the abilities' measures keep the ids they get
  (as when lane preview18 took its counts), and stepping the new stages first moved "tiers that differ only in where
  things went" from 19 to 22. Measured with steady ids too (`--steady`), 35 abilities play the very same loop at two
  tiers and 15 more differ only in where things went: the differing ids had been making those loops differ. That is the
  hero side's to look at (not changed here).
- **Trinket and potion previews** still use the round 14 straw targets with weapons (they swing before each blow: no
  blow from nothing); not this lane's.

## Clips

`docs/clips/preview18b/` (git-ignored), recorded off the Book's own players by `tools/preview18b/clips.mjs` (headless
Edge in this lane's own temp folder, its own port 8857), each watched frame by frame:

- `foe-wolf-kit-pack.mp4`: the wolf and its pack against a Paladin, an Archer and a Tower: the howl, a lunge, the bites.
- `foe-orcShaman-kit.mp4`: the shaman keeps its distance and sets the Paladin alight while he chases it.
- `foe-boar-elite-crash.mp4`: the lane on the floor, the charge through the Paladin, the crash into the yard's edge and
  the thorns all round.
- `foe-banditBrute-elite-quake.mp4`: the ring, then the ground jumps and throws the three heroes round it.
- `foe-mortar-kit-shells.mp4`: the shell's circle on the Paladin standing his ground, the shell landing on him.
- `foe-choirSprite-kit-song.mp4`: the sprite sings, the angel the Paladin is fighting mends, the heroes grow sleepy.
- `foe-alpha-boss-kit.mp4`: the Alpha alone in its hall calls its wolves, which go for the Cleric and the Archer.
- `status-silenced.mp4`: the song and its mending, the Smite, the hushed bubble, the volley while silent, the song again.
- `status-chill-shattered.mp4`: the Frost Mage's shots chill and freeze the orc; the Warhelm beside it shatters the ice.
- `status-guard.mp4`: the Paladin's guard on the Archer the orc is hitting.

## Files

- `js/preview-scenes.js`: `FOE_SCENES`, `FOE_SCENE`, `foeSceneFor` / `foeSceneOf` (monster scenes); `STATUS_SCENE`,
  `statusSceneOf` (who puts each status on).
- `js/preview-sim.js`: `foeStage` rewritten (real heroes, no straw, no poke, no health set, no step-up, a hero fells it);
  `statusStage` rewritten, `silencedStage` new; `statusHow` covers Silenced.
- `tools/preview-measure.mjs`: `measureStage` (monsters and statuses), `seenAny`, `steadyStage`.
- `tools/preview-check.mjs`: the monster and status report; the main stepping on steady ids.
- `tools/preview18b/`: the audit (`foe-audit.mjs`, `split.mjs`), its before/after runs, the clip recorder, the probes.
