# Boss: the Elder Ent (the Wildwood, floor 3)

The Wildwood's boss, and the first boss a new player meets. A designed fight like the Bone King's
(`docs/BOSS-bone-king.md`): every attack readable from across the room and dodgeable by a hero who moves at once,
and a fight that changes as it goes. The designer (round 9, deck roster2): "When burning takes double damage, all of
its attacks do burn, and attacks faster. Immune to all other effects." From the roster they approved: root cages that
pin, falling branches you see coming, a grove of sproutlings that feed it; set it alight and it rampages.

Code: `js/elderent.js` (`ELDER.elderEnt`, its `brain`; every number in `EE`, `PHASE_AT`, `BURN`), the arena in
`js/dungeon.js` (`buildArena`, `'grove'`), Entangle in `js/statuses.js` (`ENTANGLE`) and `js/sim.js`. Art: PLACEHOLDER,
the troll recoloured to dark bark (`art/enemies/troll.svg` through `js/recolor.js`); the real art is queued.

## Who it is
The oldest tree in the wood, woken up. Huge (about twice a hero across), slow, heavy (it can't be knocked back), bark
dark and mossy. It doesn't chase: it walks at whoever it wants, turning slowly like a tree, and reaches for them with
roots. It is immune to every status but fire: chill, poison, wet, shock, stagger, radiance, curse and entangle don't
take, and it can't be stunned, rooted, put to sleep, frozen or knocked out.

## The arena: the Grove
- A clearing two chunks by two (about 1300 along by 960 across). The party comes in at the near end.
- Five old trees stand in it (pillars): two pairs down the sides and one in the middle. They block its root lines and
  shots, and a hero can put one between itself and a root line.
- Four **seed beds** (patches of grasping roots: anyone standing in them is entangled) where its grove grows.
- The Elder Ent stands asleep at the far end until a hero comes within 420 or hurts it; then it wakes with a shudder
  (roots burst up all round it) before it moves.

## Rhythm
Every attack is a tell (a shape fills on the ground), the hit, and a short recovery where it stands still (the party's
window). Between attacks it walks at its mark. It picks the nearest hero, or whoever is taunting it, rethought every
1.2 seconds.

## Phase 1: the Old Wood (100% to 65%)
| attack | when | tell | shape | hit |
|---|---|---|---|---|
| Sweep | a hero within 120 | 0.8 s | a cone in front, 230 long, 2.4 rad wide | 25, thrown back hard |
| Roots | its mark within 640, every 4.5-6 s | 0.9 s | a line 560 long, 80 wide | 17 and 65 entangle; the roots stay up 5 s as grasping ground (each patch entangles who stands in it) |
| Falling branches | every 7.5-9.5 s | 1.05 s (each a little later than the last) | 4 circles (70 across) on the heroes and round them | 24 and 45 stagger |

## Phase 2: the Grove Wakes (65% to 35%)
The turn: a stamp that throws everyone back (a ring 240 across, 16, big knockback). Then, as well as phase 1:
- **The grove**: every 13 s, two sproutlings grow out of the seed beds already rooted (weak turrets). Each rooted
  sproutling within 320 of it feeds it (1.2% of its health a second, a thin green beam): kill them and the healing
  stops. At most six at once. They fall with it.
- **Root cage**: every 7-9 s a circle (84 across) closes on its mark's feet: 14, and 110 entangle, so a hero caught in
  it is tangled at once (rooted for 3 s, hurting, attacking slowly and hurting more for every attack).
- Branches: 6 at a time.

## Phase 3: Heartwood (35% to 0)
The turn: another stamp. Everything comes 15% quicker; roots come three at a time in a fan; the cage closes on two
heroes (its mark and the furthest); branches 8 at a time; the grove grows three at a time.

## Burning: the rampage
Whenever it is burning (burn above 8), whatever the phase:
- it takes **double damage**,
- **every blow burns** (22 burn on each hit, the branches and roots too),
- it is **faster at everything**: tells and cooldowns x0.7, walking x1.35, swings x1.4,
- and a burning tree drinks nothing: the grove can't feed it.
Flames lick up off its bark the whole time. So fire is the party's best weapon and its worst risk: set it alight and
the fight goes quick, but every hit it lands sets you alight too.

## Numbers
Health 1850 (round 12; was 1350) (x1.4 for every boss, then the dungeon's strength and the party size), walk 38, mass 9 (no knockback),
range 34. Balance (tools/runs.mjs `--theme wildwood --boss`, a fresh room, the starting trio with their points spent):
level 5 wins 7 of 8 (about 74 s), level 8 and up wins every time (about 55 s); on a real run the party arrives hurt
from floor 3.

## Still to do
Real art (a giant tree, not a recoloured troll); its own look for the roots and the branch fall (the visuals lane);
maybe a fourth phase or more abilities, as the designer asked for the other bosses.
