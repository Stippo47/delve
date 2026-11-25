# Round 18, lane res18: every enemy's resistances and immunities

The designer: "Get an agent on all enemies resistance and immunities and see if they make sense", and then "Make sense /
should any enemy have more resistances." Later notes: hits have **two separate axes**, a damage **type** (exactly one of
sharp, blunt or magic) and **elements/effects** (fire, water, ice, shock, poison...): resisting a type scales only the
hit's damage, resisting an element scales only that effect ("a fireball would be magic + fire effect"). Slimes are to be
judged on their own merits.

This lane **proposes only**: no game code changed. The proposal is written to sit on top of the tag lane's registry
(tags17, js/tags.js: `TAG_RES`, "the def's own res wins").

Tools (all in `tools/audit/res18/`, Node only, measure only):
- `dump.mjs`: every enemy kind (165: 142 that spawn or are summoned, 23 boss parts, segments and the like), what really
  lands of each of the 15 build-up statuses (given once through sim.js `addStatus` after a few frames, so spawn-time buffs
  count), plain / elite / major; its def.res, armour, tags, bestiary lines, where it spawns. `kinds.json`, `kinds.csv`,
  `shares.json` (each floor's spawn budget by kind: weight x cost x pack, as dungeon.js `rollKinds` spends it).
- `census.mjs`: which heroes put which statuses on (`census.json`): picks the status-reliant heroes.
- `proposal.mjs`: the proposed scheme as data (tags, rules per tag, the own-element rule, exceptions with reasons, the call
  packages, the type axis). `diff.mjs`: today against the proposal, per kind (`diff.csv`, `diff.json`) and per dungeon's
  spawn budget (`budget*.json`); `--calls` for each package.
- `bench.mjs`: 16 status heroes (tier III, with a Paladin and a Cleric) against 9 groups per dungeon (3 per floor) of its
  fight roster, unscaled (every monster at the Wildwood's floor-1 strength, so dungeons differ only by who lives there),
  under four conditions: **none** (every def.res emptied: the yardstick), **now**, **base** proposal, **all calls**.
  `summary.mjs` -> `summary.txt`.
- `check.mjs`: the evidence for the plain bugs (`check.log`). `table.mjs`: the full table at the end of this file.

## How it works today
- **The element/effect axis exists, the type axis doesn't.** `def.res[status]` multiplies a status's **build-up** only
  (sim.js addStatus: `amount * res`; 0 = it never builds). A fireball's blow is never touched by fire resistance: a Fire
  Spider takes the whole fireball and none of its Burn. So today's `res` is exactly the designer's "element" axis.
- **Nothing scales damage by type.** The only damage-side defences on enemies are armour (armour.js: crabs, scarabs,
  golems, the Foundry's metal; "heavy" and critical blows get past half), front shields, dodge, and a few moves' own
  hooks (the Automaton opened up x1.6, the stuck Sun Blade, the ward spirit's half). armour.js already says what it
  wants a type axis for: "copper is soft, bronze turns a knife, steel wants a hammer".
- **Code-only immunities** (a player can't see them; the Book's chips read def.res only, unit-stats.js):
  - every boss, warden and floor mini-boss takes no Charm (sim.js `charmProof`; round 14's ruling): 23 boss kinds show no chip, and any kind standing in as a floor's mini-boss is charm-proof in that role;
  - the Golden Skeleton and Golden Scarab put on a "gilded" buff on their first step: no status at all; their data lists
    nine of fifteen;
  - the Elder Ent wipes stun, root, sleep, KO and freeze every frame (elderent.js STEADY); the Sun Blade does the same
    while it sweeps (foes10.js bladeLock, said in its habit line);
  - boss parts take no status (boss-kit.js PART: all fifteen at 0); a chain's segments pass 60% of each status to the head;
  - spirits' rays make their friend immune to the spirit's element; an elite rat is poison-proof while it trails gas;
  - bosses take shorter bursts (stuns, freezes, roots, sleep 40%; poison's drain 40%; Bleeding's burst capped at 6%).
- **The round 13 and 15 six (Charm, Confused, Sleepy, Bleeding, Fear, Shackled) are in no kind's list** except the
  Winter Queen's mirror. Only code (gilded, parts, the saw blade) keeps them off anything.

## What's wrong (counts)
- **7 plain bugs** (below).
- **Like things treated unlike**: fire kinds 7, of which 4 have no cold weakness (Imp, Cinder Bat, Fire Spider, Fire
  Spirit) while 3 do (Fire Slime 1.5, Hellhound 1.4, Cinder 1.3); frost kinds 12, of which 3 have no fire weakness (Frost
  Spider, Frost Spirit, Ice Totem) and 4 take Chill partly (Snowman 0.1, Frost Wolf, Frost Spider, Frost Shaman 0.2) while
  8 take none; poisoners not proof against their own poison: 3 (Hunter Spider, Momma Spider, Green Crab), while every other
  poisoner is; the Chain Crawler bites with lightning and takes Shock x1.4; the Succubus charms and can be charmed;
  devils 0.2 / dragonborn 0.3 / imp 0 Burn with no stated difference; lizards 1.4 Chill, their chief 1.2, cobras and
  serpents (reptiles too) none.
- **Contradictions with the theme**: the Bone King takes Radiance at 50% while the tag lane's undead "Holy light hurts it
  more"; the Gilded Golem copies the stone golem's list (Wet 0.5, Shock 1) while tags17 tags it metal ("lightning and
  water get into it"); the Foundry Smith (a person with a hot hammer) is wholly fireproof while the Torch Bandit and the
  Orc Shaman, who also wield fire, are not.
- **Hidden blanket rule**: six of the designed bosses take Poison at 25-30% (Bone King, Goblin Chieftain, Cinder, Winter
  Queen, Sand Wurm, Gilded Seraph) on top of the shared boss rule that cuts Poison's drain to 40%: about 12% of Poison's
  worth reaches them. The wardens and older bosses have no such cut.
- **A status made useless in a whole dungeon** (the hero's main status landed, % of what lands when nothing resists;
  bench, today): Plague Doctor Foundry 3%, Dunes 32%, Crypt 36%; Twinfang Foundry 1%, Crypt 42%; Witch Foundry 16%,
  Crypt 61%, Spire 64%, Dunes 65%; Pyromancer Ember 12%, Warlock Ember 14%; Frost Mage Frost Hollow 24%, the Archer's
  chill there 35%. The Ember Deep and Frost Hollow ones are the dungeon's theme. **The Foundry is the problem**: 95% of its
  spawn budget is immune to Poison and to Curse today, and the tag lane's construct rule adds Bleeding (Cultist 102% ->
  12%, Werewolf 93% -> 1% there).
- **Missing obvious ones** (asked for: "should any enemy have more resistances"): no undead resists Bleeding or Sleepy;
  no machine resists Charm, Fear or Sleepy; no flier resists Entangle (the hero Griffon is immune to it); no plant resists
  Entangle except the Ent; no demon is weak to holy light; no type resistances at all (bones and hammers, ghosts and
  blades). Each is below, as a rule or a call.
- How much it matters in damage: little, in these fights. A status hero's whole damage moves far less than its status
  (Pyromancer in the Ember Deep 70% of its no-resistance damage, Plague in the Foundry 69%, Druid there 79%; most others
  within 10%). The cost of an immunity is mostly the hero's identity and its burst effects, not its numbers.

## Plain bugs (fix whatever the calls say)
1. **The Orc Warboss counts as undead.** kits.js `isUndead` tests the kind's name (`/skeleton|rattler|gaper|brute|ghost|banshee|boss/`):
   "warboss" contains "boss". The Paladin's Smite III does x3 and Consecrate III x2.5 plus Burn to the Warren's warden.
2. **The Bone King, the Grave Warden, the Mummy and the Icicle Wraith don't count as undead** (same test): Smite III and
   Consecrate III miss the Crypt's own boss and warden. Fix for both: `hasTag(u, 'undead')` (tags17's list has all four).
3. **A chain builds a status once per body from one cloud or one patch of fire.** Each coil passes 60% to the head, with
   no once-per-source rule (the Mob has one, `MOB.share`): a Sand Serpent lying in burning ground builds Burn x4.6, the
   Chain Crawler x5.8 (`check.log`). Fix: the Mob's rule (the head takes a source's status once a step, its full amount).
4. **The Book shows no Charm immunity on the 23 bosses and wardens** that take none (sim.js charmProof). Fix:
   `boss: { charm: 0 }` as a tag rule (below), or the Book asks charmProof.
5. **The Golden Skeleton's and Golden Scarab's lists say nine immunities; the shell gives fifteen.** Fix: their lists say
   all (or the Book reads the gilded buff: "no status at all").
6. **The Dust Devil (a summoned gust) can be charmed, confused, lulled, bled, frightened and shackled**: its list was
   written before those six. Fix: all fifteen at 0.
7. **The Elder Ent's STEADY is invisible**: its Book page lists nine immunities; it also can't be stunned, rooted, frozen,
   knocked out or put to sleep (Sleepy still builds its slow and its longer wind-ups, then the sleep is wiped). Fix: say
   so on its page.

Not bugs, worth knowing: the Mob and boss limits behave as STATUSES.md says; the Sun Blade's lock is in its habit line.

## The proposed scheme
### The rule order (fits tags17's `TAG_RES`)
1. A kind's own `def.res` entry: an **exception**, each with a reason (below). Designed bosses and their parts keep their
   whole lists (a boss's list is part of its fight).
2. **Own element: a kind takes none of the element its own body makes.** Fire things no Burn, frost things no Chill, holy
   things no Radiance, venomous things no Poison, storm things no Shock, the Mummy and the fallen no Curse, the Succubus no
   Charm. Wielders don't count: the Torch Bandit, the Knife Bandit, the Orc Shaman take what anyone takes.
3. **The tag rules**: of a kind's tags that name a status, the lowest number (immune beats resists beats weak).
4. Otherwise 1.

### Effect axis: the rules per tag (x the build-up; 0 = immune)
| tag | rule | today |
|---|---|---|
| fire | Burn 0 (the tag lane: burning enrages instead), Chill x1.5, Wet x1.3 (and the tag lane's Doused harm) | 4 of 9 lack the cold weakness; none has the Wet one |
| ice | Chill 0, Burn x1.4 | Chill 0-0.2, Burn 1-1.6 |
| plant | Burn x1.6, Entangle 0 | Sproutling 1.6, Ent 1.8 and Entangle 0 |
| bone (skeletons) | Poison x0.35, Burn x0.8, Chill x1.2 | as today's skeleton row |
| spirit | Poison 0, Curse 0 | as today |
| construct | Poison 0, Bleeding 0 (tags17), Curse 0, Entangle x0.5 | Bleeding 1 until tags17 lands |
| metal | Shock x1.4, Wet x1.3 | as foundry.js MACHINE |
| stone (golems, the dart trap) | Burn x0.6, Chill x0.6, Wet x0.5 | as today's golem row |
| stationary | Stagger 0 | turrets as today |
| reptile (lizards, croc, cobra, serpent, dragonborn) | Chill x1.3, Burn x0.8 | lizards and croc only |
| demon | Burn x0.25 | 0.2-0.3 |
| holy | Radiance 0 | as today |
| boss | Charm 0 | code only today |
| beast, slime, flier | nothing in the base (calls below) | |

**Exceptions kept, with reasons**: Ghost and Banshee Burn x1.3, Chill x0.2 ("fire does plenty"; the grave's cold); Mummy
Burn x1.8, Poison 0 ("Fire loves it"; embalmed); Troll and Rock Troll Burn x1.4 (fire stops the regrowth); Sludge Slime
Burn x1.4 (oil); Bomb Bots Burn x1.5 ("Fire sets it off"); Dragonborn Burn x0.3 (dragon blood); Pit Lord and Archfiend
Burn 0 (lords of the pit); the fallen angels Radiance 0 (still angels); the Sun Blade Stagger 0 ("nothing stops it");
the Gilded Golem stays stone (gold neither rusts nor sparks: tags17 should drop it from metal); the gilded two, the Dust
Devil and the Saw Blade take nothing; the Elder Ent as built; the Winter Queen's mirror, the Seraph's choir, segments and
the unused old Bone King def keep their lists. **One design change in the exceptions**: the Foundry Smith Burn 0 -> 0.5
(a person at a forge is heat-hardened, not made of fire; Chill x1.3 kept).

### Type axis (damage only; nothing exists yet, nothing measured)
- **bone**: sharp x0.8, blunt x1.25 (a blade slips between ribs; a mace breaks them). Call 8.
- **stone**: sharp x0.7, blunt x1.2. Call 8.
- **plant**: sharp x1.2 (axes fell trees). Small; take it with call 8.
- **spirit** (ghosts, banshees, the wraith, wisps, elemental spirits): sharp and blunt x0.6, magic x1.25. Call 7.
- **metal and shells**: no multiplier: armour already does it. Proposed instead: **blunt (not "heavy") gets past half the
  armour**, which is what armour.js's "steel wants a hammer" means. Call 8.
- **slime**: neutral. Either story works ("a hammer splats jelly", "a blade passes through it"), and slimes are the first
  dungeon's commonest enemy (28% of the Wildwood's first floor's spawn budget, 47% of the Sewers' first), where a type rule would teach a
  new player that their starting hero is wrong. Call 8.
- **magic resisters**: none proposed now. The designer's "monster hunter that resists magic but not its effects" fits a
  future hero or an elite major, not today's roster: no current kind reads as spell-proof.

### The calls as packages (each measured apart; picks in Calls)
- **deadBleed**: undead, spirits, plants, slimes take no Bleeding. **deadSleep**: undead take no Sleepy.
- **mindless**: constructs take no Charm, Fear or Sleepy. **jinx**: constructs DO take Curse (today 0).
- **flier**: fliers take Entangle x0.5, spirits 0. **holy**: undead and demons take Radiance x1.3, holy things Curse x1.3.
- **bossPoison**: the six designed bosses' blanket Poison 0.25-0.3 goes (the 40% drain stays).

## Measured
### Spawn budget immune to each status, today -> base proposal (%, each dungeon's three floors' fight rooms)
```
status   wildwood warren   sewers   crypt    frost    ember    spire    dunes    foundry
burn     0->0     0->0     1->1     5->5     0->0     62->62   0->0     5->5     11->6
chill    0->0     0->2     0->0     5->5     27->67   0->0     0->0     5->5     3->3
poison   4->4     0->0     7->15    21->21   9->23    3->3     23->23   57->57   95->95
curse    1->1     0->0     0->0     21->21   9->9     3->3     32->32   35->35   95->95
entangle 8->14    0->0     0->0     5->5     0->0     0->0     0->0     5->5     3->3
charm    0->0     0->0     0->0     5->5     0->0     0->6     0->0     5->5     3->3
bleed    0->0     0->0     0->0     5->5     0->0     0->0     0->21    5->17    3->94
(wet, shock, stagger, radiance, confuse, sleepy, fear, shackle: unchanged; radiance is 96% in the Spire, as built)
```
Frost Hollow's Chill 27 -> 67 is the frost wolves, frost spiders and the shaman going 0.2 -> 0 (at 0.2 they were all but
immune already: Frost Mage 24% -> 19% landed). Bleeding in the Foundry, Spire and Dunes is tags17's construct rule.
With every call (`budget-deadBleed-deadSleep-mindless-jinx-flier-holy-bossPoison.json`): the Crypt 91% immune to Bleeding
and to Sleepy; the Foundry 94% to Charm, Fear and Sleepy; Curse in the Foundry 95 -> 3, Spire 32 -> 11, Dunes 35 -> 22
(jinx); Entangle Spire 0 -> 2, Crypt 0 -> 21 (ghosts as spirits), Frost 0 -> 9.

### Status heroes: main status landed, % of "nothing resists" (today / base / all calls but jinx)
```
hero (status)         wildwood     warren       sewers       crypt        frost        ember        spire        dunes        foundry
cultist (bleed)       100/100/70   97/97/97     101/101/68   85/85/13     94/94/48     109/112/106  100/72/60    100/78/53    102/12/12
werewolf (bleed)      103/103/71   100/100/100  112/112/72   103/103/11   110/110/74   105/108/98   103/80/76    100/80/42    93/1/0
druid (entangle)      100/86/84    100/100/100  97/97/97     100/100/80   106/111/72   99/101/90    95/82/58     87/82/83     53/53/53
warden (shackle)      102/102/102  101/101/101  101/101/101  100/100/99   103/103/96   85/86/90     92/92/92     100/93/93    102/102/102
enchantress (charm)   102/102/102  100/100/100  91/93/93     112/112/111  99/99/100    115/108/108  95/95/69     103/92/74    99/99/3
slinger (sleepy)      107/107/107  100/100/100  93/93/93     96/96/10     107/107/81   87/87/87     100/100/84   102/100/59   104/104/0
bard (sleepy)         101/101/101  100/100/100  168/168/168  94/94/10     93/93/81     65/81/81     116/116/94   100/94/81    89/89/4
seer (confuse)        98/98/98     100/100/100  112/112/112  103/103/104  98/98/85     120/123/122  109/109/109  100/99/102   111/111/111
plague (poison)       91/91/91     100/100/100  111/107/107  36/36/36     83/77/75     146/151/154  82/82/82     32/32/32     3/3/3
twinfang (poison)     88/88/88     100/100/100  101/96/96    42/42/43     73/62/63     82/82/82     84/84/84     53/53/53     1/1/1
storm (shock)         99/99/99     100/100/100  108/108/108  96/96/96     100/100/100  90/90/90     98/101/101   98/98/99     137/123/123
witch (curse)         101/101/101  100/100/100  95/95/95     61/61/62     74/74/74     93/86/86     64/64/69     65/65/65     16/17/17
pyromancer (burn)     110/109/109  104/105/105  97/97/97     114/114/113  106/113/116  12/11/11     85/85/85     129/129/131  82/86/86
warlock (burn)        108/112/112  108/108/108  87/87/87     128/128/121  139/138/134  14/16/17     96/96/96     98/92/92     73/78/78
frost (chill)         98/98/98     99/99/99     125/122/122  80/80/81     24/19/19     114/141/137  105/105/105  99/113/112   100/102/102
archer (chill)        108/107/107  87/87/87     159/155/155  133/133/132  35/27/27     166/197/198  130/130/130  129/121/121  97/93/93
```
Over 100: the dungeon's weaknesses feed it (fire kinds' cold weakness gives the Frost Mage 141% in the Ember Deep).
Small differences (5-10 points) are the fights' own noise (9 fights a cell). **jinx** measured apart (`bench-jinx.log`):
the Witch's Curse in the Foundry 16% -> 106%, Dunes 65 -> 82, Spire 64 -> 95. Damage a second: `summary.txt` (moves far
less, as said above). Every fight was won (the party is strong at unscaled strength): this measures what lands, not who
wins.

### Per-kind diff
`tools/audit/res18/diff.csv` (base: 60 kinds, 90 numbers) and the `diff-<calls>.csv` files; the full table below has
today, where it comes from, the base change and what the calls add. The base in groups:
- **construct Bleeding 0**: 31 kinds: the machines, golems, the dart trap, the Sun Blade, the ice totem (this is tags17's rule).
- **fire**: Imp, Cinder Bat, Fire Spider, Fire Spirit gain Chill x1.5; every fire kind gains Wet x1.3; Hellhound 1.4 -> 1.5.
- **ice**: Snowman, Frost Wolf, Frost Spider, Frost Shaman Chill -> 0; Frost Spider, Frost Spirit, Ice Totem gain Burn
  x1.4; the rest of the frost kinds' Burn to 1.4 (from 1.3-1.6).
- **own element**: Hunter Spider, Momma Spider, Green Crab Poison 0; Chain Crawler Shock 1.4 -> 0; Succubus Charm 0.
- **reptile**: Cobra, Sand Serpent, Dragonborn gain Chill x1.3 (and the snakes Burn x0.8); lizards 1.4 -> 1.3, their chief 1.2 -> 1.3.
- **plant**: Sproutling Entangle 0; Ent Burn 1.8 -> 1.6.
- **demon** Burn 0.2 -> 0.25; **stone**: the dart trap's row; **stationary**: the ice totem Stagger 0.
- **exceptions**: the Dust Devil's six; the Foundry Smith Burn 0 -> 0.5.

## Calls
Each line: the question, why it matters to the player, my pick.

1. **Should skeletons, ghosts and mummies be immune to Bleeding and to Sleepy?** The dead have no blood and don't sleep.
   But the Crypt is nearly all undead: a Bleeding hero (Cultist, Werewolf, Huntress) or a Sleepy one (Bard, Slinger) would
   land about a tenth of its effect there (measured 10-13%), on top of the Foundry where machines already don't bleed. Their
   damage barely moves (the Cultist's 92% -> 89%); it is their signature effect that goes. **Pick: yes to both**, and make
   the immunity show in the Book so a player picks a different hero for the Crypt on purpose. (Plants and slimes not
   bleeding goes with it: wood and jelly.)
2. **Should machines (turrets, bots, golems, traps) be immune to Charm, Fear and Sleepy?** A turret can't fall in love,
   panic or nod off. But the Foundry is 94% machines: the Enchantress would land 3% of her charm there and the Bard and
   Slinger nothing. **Pick: yes**, together with call 3, so the Foundry shuts out a different set of heroes rather than
   almost all of them.
3. **Should machines take Curse after all (a jinx: a hexed turret's next shot backfires on it)?** Today every machine,
   golem and the dart trap takes none, with no reason given; with Poison and Bleeding also gone the Foundry leaves a
   Witch 16% of her curse and several heroes almost nothing. Measured with this: the Witch's curse in the Foundry 16% ->
   106%. **Pick: yes.** Ghosts and spirits keep Curse 0.
4. **Should flying enemies resist being rooted?** The hero Griffon can't be entangled because it flies; enemy bats,
   angels, bees and spirits can. Halving it for fliers (spirits immune) costs the Druid about a third of its roots in the
   Spire (95% -> 58% with every call). **Pick: yes, at half**, and when the height layers land: airborne immune, hovering
   half, on the floor full.
5. **Should holy light hurt the dead and the demons more, and the dark hurt the holy more?** Undead and demons would build
   Radiance 30% faster (the Paladin, Cleric and Valkyrie), angels Curse 30% faster (the Witch and the Shade in the Spire).
   Today the Bone King even resists Radiance (half). **Pick: yes**, the Bone King's half resistance goes.
6. **Should bosses keep their extra Poison resistance?** Six bosses build Poison at a quarter to a third, and every boss
   already takes Poison's sickness at 40%: together about an eighth of its worth, so a Plague Doctor is nearly blank against
   bosses; the other bosses have no such cut. **Pick: drop the extra resistance** (keep the shared 40%); the Great Ooze and
   the Great Engine stay immune (a poison blob, a machine).
7. **Should ghosts and spirits take less from weapons and more from spells?** Blades and fists at 60%, magic at 125%. A
   classic and easy to read once the hit types exist, and it makes spell-casters the answer to the Crypt's ghosts, Frost
   Hollow's wraiths and the elemental spirits. It costs physical parties there (ghosts and banshees are 5-26% of the Crypt's
   floors). **Pick: yes**, shown on the ghost's Book page.
8. **Should hammers beat bones and stone, and blades lose to them, while slimes stay neutral?** Skeletons blunt x1.25,
   sharp x0.8; golems blunt x1.2, sharp x0.7; trees sharp x1.2; armoured metal and shells: blunt, not "heavy", gets past
   half the armour. Slimes: neither (a hammer splats jelly, a blade passes through it: both stories work, and slimes are the
   first enemy a new player meets). **Pick: yes, slimes neutral.**

## For the tag lane (at merge)
- tags17 derives `metal` from `res.shock >= 1.4 && res.wet >= 1.3`. Once those numbers move into `TAG_RES.metal` (the
  point of a tag rule), the derivation finds nothing: make metal an explicit list (proposal.mjs has one).
- tags17's metal list has the Gilded Golem, whose numbers are the stone golem's (Wet 0.5, Shock 1): pick one.
- tags17's `tagRes` returns the lowest of the tags that name a status, with the def's own winning: the scheme here needs
  only that, plus a way for a call to RAISE a number over a tag's (jinx); proposal.mjs `RAISE` shows one.
- `isUndead` (kits.js) should ask `hasTag(u, 'undead')` (bugs 1 and 2).

## Full table
Today = what lands (measured; "code" = differs from the data, e.g. the bosses' Charm 0). Base = the change the rules make.
Calls = what the call packages would add (deadBleed, deadSleep, mindless, jinx, flier, holy, bossPoison).
<!-- TABLE:start (tools/audit/res18/table.mjs) -->
| kind | what it is | where | today (effect axis: x of the build-up; 0 = immune) | from | proposed change (base) | with the calls |
|---|---|---|---|---|---|---|
| rat | Rat: Small and quick. | sewers crypt | nothing | code: elite: poison-proof while it trails gas | - | - |
| slime | Slime: Hops at you and lands on you: the landing is its blow. | wildwood sewers | nothing | - | - | Bleed 1->0 (deadBleed) |
| slimeSmall | Slimelet: Weak alone, annoying in a crowd. | sewers | nothing | - | - | Bleed 1->0 (deadBleed) |
| skeleton | Skeleton: Winds up a heavy swing. | summon | Burn 0.8, Chill 1.2, Poison 0.35 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| boss | Bone King: Slams the ground. | summon | Burn 0.6, Chill 0.6, Poison 0.3, Charm 0 | data; code: Charm (charmProof) | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| wolf | Wolf: Circles, then lunges. | wildwood | nothing | - | - | - |
| rattler | Rattler: A plain bony fighter. | crypt | Burn 0.8, Chill 1.2, Poison 0.35 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| rattlerBow | Bone Archer: Keeps its distance and shoots. | crypt | Burn 0.8, Chill 1.2, Poison 0.35 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| rattlerSpear | Bone Spear: Pokes from further away than you'd like. | crypt | Burn 0.8, Chill 1.2, Poison 0.35 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| rattlerMace | Loose Jaw: Heavy blows that knock heroes back. | crypt | Burn 0.8, Chill 1.2, Poison 0.35 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| gaper | Gaper: Charges through a line with its swords in a V, then spins. | crypt | Burn 0.8, Chill 1.2, Poison 0.35 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| brute | Brute: Big, slow, hits like a falling door. | crypt | Burn 0.8, Chill 1.2, Poison 0.35 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| ghost | Ghost: Floats up close; its touch makes you drowsy, and enough of it puts you to sleep. | crypt | Burn 1.3, Chill 0.2, Poison 0, Curse 0 | data | - | Radiance 1->1.3 (holy), Entangle 1->0 (flier), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| lizardman | Lizardman: A spear with reach, and a tail it whips round in a spin. | sewers | Burn 0.8, Chill 1.4 | data | Chill 1.4->1.3 | - |
| lizardBlade | Lizard Blade: Darts in with blades, slips back out. | sewers | Burn 0.8, Chill 1.4 | data | Chill 1.4->1.3 | - |
| goblin | Goblin: Fast and flimsy. | wildwood warren | nothing | - | - | - |
| hobgoblin | Hobgoblin: A tougher goblin with a proper weapon. | warren | nothing | - | - | - |
| orc | Orc: Hits hard and takes a beating. | warren | nothing | - | - | - |
| orcShaman | Orc Shaman: Hangs back and lobs fireballs that burst and burn. | warren | nothing | - | - | - |
| troll | Troll: Huge and slow. | warren | Burn 1.4 | data | - | - |
| graveWarden | Grave Warden: Guards the way down. | crypt | Burn 0.8, Chill 1.2, Poison 0.35, Charm 0 | data; code: Charm (charmProof) | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| lizardChief | Lizard Chief: A warden: quick and brutal. | sewers | Burn 0.8, Chill 1.2, Charm 0 | data; code: Charm (charmProof) | Chill 1.2->1.3 | - |
| warboss | Orc Warboss: A warden: shouts, charges, smashes. | warren | Charm 0 | code: Charm (charmProof) | - | - |
| boneKing | The Bone King: The last boss. | crypt | Burn 0.6, Chill 0.5, Poison 0.3, Radiance 0.5, Curse 0, Charm 0 | data; code: Charm (charmProof) | - | Poison 0.3->1 (boss poison), Radiance 0.5->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| bat | Cave Bat | frost | nothing | - | - | Entangle 1->0.5 (flier) |
| snowman | Snowman | frost | Burn 1.6, Chill 0.1 | data | Burn 1.6->1.4, Chill 0.1->0 | - |
| spiderHunter | Hunter Spider | sewers frost | nothing | - | Poison 1->0 | - |
| spiderMomma | Momma Spider | frost | nothing | - | Poison 1->0 | - |
| banshee | Banshee | crypt frost | Burn 1.3, Chill 0.2, Poison 0, Curse 0 | data | - | Radiance 1->1.3 (holy), Entangle 1->0 (flier), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| ogre | Ogre | warren | nothing | - | - | - |
| imp | Imp | ember | Burn 0 | data | Chill 1->1.5, Wet 1->1.3 | Radiance 1->1.3 (holy) |
| fireSlime | Fire Slime | sewers ember | Burn 0, Chill 1.5 | data | Wet 1->1.3 | Bleed 1->0 (deadBleed) |
| devil | Devil | ember | Burn 0.2 | data | Burn 0.2->0.25 | Radiance 1->1.3 (holy) |
| succubus | Succubus: Every few seconds she answers a blow with a kiss that charms whoever struck it. | ember | Burn 0.2 | data | Burn 0.2->0.25, Charm 1->0 | Radiance 1->1.3 (holy) |
| demon | Demon | ember | Burn 0.2 | data | Burn 0.2->0.25 | Radiance 1->1.3 (holy) |
| dragonborn | Dragonborn | ember | Burn 0.3 | data | Chill 1->1.3 | - |
| cherub | Cherub | spire | Radiance 0 | data | - | Curse 1->1.3 (holy), Entangle 1->0.5 (flier) |
| angel | Angel | spire | Radiance 0 | data | - | Curse 1->1.3 (holy), Entangle 1->0.5 (flier) |
| seraph | Seraph | spire | Radiance 0 | data | - | Curse 1->1.3 (holy), Entangle 1->0.5 (flier) |
| broodQueen | Brood Queen | summon | Charm 0 | code: Charm (charmProof) | - | - |
| frostGiant | Old Frost | frost | Burn 1.4, Chill 0, Charm 0 | data; code: Charm (charmProof) | - | - |
| pitLord | Pit Lord: A whip of fire down a line, rifts near the party that spit imps, a ring of fire, and a sla | ember | Burn 0, Charm 0 | data; code: Charm (charmProof) | - | Radiance 1->1.3 (holy) |
| archfiend | The Archfiend | ember | Burn 0, Charm 0 | data; code: Charm (charmProof) | - | Radiance 1->1.3 (holy) |
| archon | Archon | summon | Radiance 0, Charm 0 | data; code: Charm (charmProof) | - | Curse 1->1.3 (holy) |
| radiant | The Radiant | spire | Radiance 0, Charm 0 | data; code: Charm (charmProof) | - | Curse 1->1.3 (holy) |
| direWolf | Dire Wolf: Pounces from far off and pins whoever it lands on. | wildwood | nothing | - | - | - |
| slimeBig | Big Slime: Spits slime balls. | wildwood | nothing | - | - | Bleed 1->0 (deadBleed) |
| slimePoison | Poison Slime: Its touch poisons, and its splitting leaves a cloud of poison behind. | wildwood sewers | Poison 0 | data | - | Bleed 1->0 (deadBleed) |
| slimeletPoison | Poison Slimelet: Its touch poisons. | summon | Poison 0 | data | - | Bleed 1->0 (deadBleed) |
| goblinOrange | Orange Goblin: Half again as fast as a goblin; darts in, strikes, darts out, never still. | wildwood | nothing | - | - | - |
| bandit | Bandit: Sword and shield: blocks from the front and bashes you back. | wildwood | nothing | - | - | - |
| banditTorch | Torch Bandit: Its blows singe, and it sweeps the torch round in a burst of fire. | wildwood | nothing | - | - | - |
| banditGreat | Greatsword Bandit: Slow, wide swings, and a whirling sweep all round. | wildwood | nothing | - | - | - |
| banditAxe | Axe Bandit: Heavy, staggering chops, and it throws the axe at anyone a little way off. | wildwood | nothing | - | - | - |
| banditSpear | Spear Bandit: A reaching thrust and a lunge, spear first. | wildwood | nothing | - | - | - |
| banditDagger | Knife Bandit: Quick and slippery: cuts that poison, then gone. | wildwood | nothing | - | - | - |
| poacher | Poacher: A bow, and a net now and then that holds you fast. | wildwood | nothing | - | - | - |
| banditBrute | Bandit Brute: A slow wind-up slam that sends heroes flying. | wildwood | nothing | - | - | - |
| boar | Thornback Boar: Charges in a straight line. | wildwood | nothing | - | - | - |
| sproutling | Sproutling: Darts in for a short jab. | wildwood | Burn 1.6 | data | Entangle 1->0 | Bleed 1->0 (deadBleed) |
| ent | Ent: Roots burst up in a line that entangles. | wildwood | Burn 1.8, Entangle 0 | data | Burn 1.8->1.6 | Bleed 1->0 (deadBleed) |
| wisp | Wisp: Mends the beasts near it and blinks away from danger. | wildwood | Poison 0, Curse 0 | data | - | Entangle 1->0 (flier), Bleed 1->0 (deadBleed) |
| alpha | The Alpha: A mini-boss. | wildwood | Charm 0 | code: Charm (charmProof) | - | - |
| banditChief | The Bandit Chief: A mini-boss. | wildwood | Charm 0 | code: Charm (charmProof) | - | - |
| elderEnt | The Elder Ent: The Wildwood's boss. | wildwood | Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0 | data; code: Charm (charmProof); code: every frame: stun, root, sleep, KO and freeze wiped (STEADY) | - | Bleed 1->0 (deadBleed) |
| mouse | Mouse: Tiny, quick, nibbles. | warren | nothing | - | - | - |
| dynamouse | Dynamite Mouse: Runs up to you, fizzes, and blows. | warren | nothing | - | - | - |
| goblinSpear | Spear Goblin: Throws a spear that cuts on the way out and on the way back. | warren | nothing | - | - | - |
| goblinBomber | Goblin Bomber: Lobs bombs that sit fizzing a moment before they blow. | warren | nothing | - | - | - |
| goblinSuicide | Suicide Bomber: Runs up, stands next to you a moment, and explodes. | warren | nothing | - | - | - |
| drummer | Drummer: Does no damage; everything near it attacks faster while it plays. | warren | nothing | - | - | - |
| wolfRider | Wolf Rider: Charges through the party, spear first. | warren | nothing | - | - | - |
| frostShaman | Frost Shaman: Frost balls that chill, and ice totems that freeze everyone near them. | warren | Burn 1.3, Chill 0.2 | data | Burn 1.3->1.4, Chill 0.2->0 | - |
| iceTotem | Ice Totem: Chills everyone near it until it breaks or melts. | summon | Chill 0, Poison 0 | data | Burn 1->1.4, Stagger 1->0, Curse 1->0, Entangle 1->0.5, Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| rockTroll | Rock Troll: Pushes a boulder before it. | warren | Burn 1.4 | data | - | - |
| ratPlague | Plague Rat: Its bite poisons; it bursts into a cloud of poison when it dies. | sewers | Poison 0 | data | - | - |
| ratKing | Rat King: Rats break loose from it as it's hurt, and three more when it dies. | sewers | nothing | - | - | - |
| slimeSludge | Sludge Slime: Leaves oil when it dies. | sewers | Burn 1.4 | data | - | Bleed 1->0 (deadBleed) |
| croc | Croc: Chops with two axes; its bite holds a hero and drags them off. | sewers | Burn 0.8, Chill 1.3 | data | - | - |
| crab | Sewer Crab: Comes in on wide circles, always facing you. | sewers | nothing | - | - | - |
| crabBlue | Blue Crab: Circles in, and shoots slow bubbles that soak. | sewers | nothing | - | - | - |
| crabGreen | Green Crab: Circles in, and shoots poison bubbles two at a time. | sewers | nothing | - | Poison 1->0 | - |
| leechBlood | Blood Leech: Latches on and drinks, drops off and spits the blood back as shots. | sewers | nothing | - | - | - |
| leechBrain | Brain Leech: Latches on and turns a hero on its friends. | sewers | nothing | - | - | - |
| rattlerGold | Golden Skeleton: Golden bones home in on heroes and go through them. | crypt | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data; code: Charm Confuse Sleepy Bleed Fear Shackle; code: gilded buff: no status at all | - | - |
| rattlerHarrow | Harrowing Skeleton: Gets up again once, with a burst of curse round it. | crypt | Burn 0.8, Chill 1.2, Poison 0.35 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| scarab | Scarab: Burrows under the sand (a trail of dug-up earth) and comes up beside a hero. | dunes | nothing | - | - | - |
| scarabGold | Golden Scarab: A tougher scarab. | dunes | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data; code: Charm Confuse Sleepy Bleed Fear Shackle; code: gilded buff: no status at all | - | - |
| cobra | Cobra: Spits poison from range, and rears back out of reach when you come close. | dunes | Poison 0 | data | Burn 1->0.8, Chill 1->1.3 | - |
| jackal | Jackal Guard: Spear and shield. | dunes | nothing | - | - | - |
| mummy | Mummy: Slow. | dunes | Burn 1.8, Poison 0, Curse 0 | data | - | Radiance 1->1.3 (holy), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| sandMage | Sand Mage: Calls dust devils that spin off in straight lines, bowling heroes over and stopping shots. | dunes | nothing | - | - | - |
| dustDevil | Dust Devil: Spins in a straight line, bounces off walls, throws whoever it hits. | summon | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0 | data; code: a summon of the Sand Mage | Charm 1->0, Confuse 1->0, Sleepy 1->0, Bleed 1->0, Fear 1->0, Shackle 1->0 | - |
| sandSerpent | Sand Serpent: A head and a long body, one health: hit anywhere. | dunes | Poison 0 | data; code: its 6 coils each pass 60% to the head | Burn 1->0.8, Chill 1->1.3 | - |
| serpentCoil | Serpent Coil: A blow here lands on the head. | summon | nothing | - | - | - |
| dartTrap | Dart Trap: Set in a wall. | dunes | Chill 0.5, Poison 0, Wet 0.5, Stagger 0, Curse 0 | data | Burn 1->0.6, Chill 0.5->0.6, Entangle 1->0.5, Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| spiritPoison | Venom Spirit: Its ray makes a friend's blows poison, and poison can't touch it. | dunes | Poison 0, Curse 0 | data; code: its ray makes the friend poison-proof | - | Entangle 1->0 (flier), Bleed 1->0 (deadBleed) |
| spiritHaste | Wind Spirit: Its ray quickens a friend's feet and blows for as long as it holds. | dunes | Poison 0, Curse 0 | data | - | Entangle 1->0 (flier), Bleed 1->0 (deadBleed) |
| gearSprite | Gear Sprite: Doesn't aim: rolls where it's going, straight through the party, and off the walls at a sl | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| cogSprite | Cog Sprite: Rolls and bounces like a gear sprite, but leans towards whoever is ahead of it. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| bombBot | Bomb Bot: Sees you, lights its fuse and runs straight at you; blows up when it runs out. | foundry | Burn 1.5, Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| autoBomb | Auto Bomb Bot: If it misses, it puts its fuse out, turns slowly round and tries again. | foundry | Burn 1.5, Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| automaton | Automaton: Hits hard; after three blows it overheats and stands open, taking more harm. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| turretSteam | Steam Turret: Can't move, turns slowly, fires scalding steam that soaks. | foundry | Poison 0, Wet 1.3, Shock 1.4, Stagger 0, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| turretFlame | Flame Turret: Can't move. | foundry | Burn 0, Poison 0, Wet 1.3, Shock 1.4, Stagger 0, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| turretGun | Gun Turret: Set in a wall: turns only so far, and fires a burst of rounds. | foundry | Poison 0, Wet 1.3, Shock 1.4, Stagger 0, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| turretLaser | Laser Turret: Set in a wall: a long line shows, then the beam burns down it. | foundry | Poison 0, Wet 1.3, Shock 1.4, Stagger 0, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| mortar | Mortar: Can't move. | foundry | Poison 0, Wet 1.3, Shock 1.4, Stagger 0, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| mortarFire | Fire Mortar: Its shells leave the floor burning. | foundry | Burn 0, Poison 0, Wet 1.3, Shock 1.4, Stagger 0, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| mortarPoison | Gas Mortar: Its shells leave a cloud of gas. | foundry | Poison 0, Wet 1.3, Shock 1.4, Stagger 0, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| teslaCoil | Tesla Coil: Can't move. | foundry | Poison 0, Wet 1.3, Shock 0, Stagger 0, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| repairDrone | Repair Drone: Floats about mending constructs. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| foundrySmith | Foundry Smith: A red-hot hammer: every blow burns, and its slam sets the floor alight. | foundry | Burn 0, Chill 1.3 | data | Burn 0->0.5 | - |
| bee | Copper Bee: Swarms. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| wasp | Copper Wasp: Circles its mark, flicking short stingers. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| hornet | Copper Hornet: Circles, then takes turns: five stingers, then a bee's dash. | summon | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| beeBronze | Bronze Bee: A tougher bee. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| beeSteel | Steel Bee: The toughest bee. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| waspBronze | Bronze Wasp: A tougher wasp. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| waspSteel | Steel Wasp: The toughest wasp. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| hornetBronze | Bronze Hornet: A tougher hornet. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| hornetSteel | Steel Hornet: The toughest hornet. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| sawBlade | Saw Blade: A trap: runs along a wall, half sunk in it, cutting whoever it meets. | foundry | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | code: Burn Chill Poison Wet Shock Stagger Radiance Curse Entangle Charm Confuse Sleepy Bleed Fear Shackle; code: a trap: never takes anything (ethereal) | - | - |
| chainCrawler | Chain Crawler: A head and eight plates, one health: hit anywhere. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data; code: its 8 plates each pass 60% to the head | Shock 1.4->0, Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| crawlerPlate | Crawler Plate: A blow here lands on the head. | summon | nothing | - | - | Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| drillBot | Drill Bot: Drills under the floor and comes up spinning beside a hero. | foundry | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| spiritShock | Storm Spirit: Its ray makes a friend's blows shock, and shock can't touch it. | foundry | Poison 0, Shock 0, Curse 0 | data; code: its ray makes the friend shock-proof | - | Entangle 1->0 (flier), Bleed 1->0 (deadBleed) |
| frostWolf | Frost Wolf: Runs with the pack. | frost | Burn 1.3, Chill 0.2 | data | Burn 1.3->1.4, Chill 0.2->0 | - |
| slimeIce | Ice Slime: Where it lands after each hop the air goes freezing for a moment, and its touch chills. | frost | Burn 1.4, Chill 0 | data | - | Bleed 1->0 (deadBleed) |
| spiderFrost | Frost Spider: Its bite chills, and the web it dies into chills whoever walks through. | frost | Chill 0.2 | data | Burn 1->1.4, Chill 0.2->0 | - |
| yeti | Yeti: Pushes a heavy snowball before it, slow to get going and slow to turn, then runs it at you | frost | Burn 1.3, Chill 0 | data | Burn 1.3->1.4 | - |
| frostWraith | Icicle Wraith: Hangs back and drops icicles from above: a shadow shows where. | frost | Burn 1.5, Chill 0, Poison 0, Curse 0 | data | Burn 1.5->1.4 | Radiance 1->1.3 (holy), Entangle 1->0 (flier), Sleepy 1->0 (deadSleep), Bleed 1->0 (deadBleed) |
| spiritFrost | Frost Spirit: Its ray lends a friend the cold: every blow chills, and cold can't touch it. | frost | Chill 0, Poison 0, Curse 0 | data; code: its ray makes the friend chill-proof | Burn 1->1.4 | Entangle 1->0 (flier), Bleed 1->0 (deadBleed) |
| spiderFire | Fire Spider: Its bite burns, and it spits fireballs from a way off. | ember | Burn 0 | data | Chill 1->1.5, Wet 1->1.3 | - |
| hellhound | Hellhound: Runs with the pack and leaves fire where it runs, and goes for whoever is doing the healin | ember | Burn 0, Chill 1.4 | data | Chill 1.4->1.5, Wet 1->1.3 | Radiance 1->1.3 (holy) |
| cinderBat | Cinder Bat: Dives straight at a hero and bursts into flame. | ember | Burn 0 | data | Chill 1->1.5, Wet 1->1.3 | Entangle 1->0.5 (flier) |
| spiritFire | Fire Spirit: Its ray sets a friend's blows alight, and fire can't touch it. | ember | Burn 0, Poison 0, Curse 0 | data; code: its ray makes the friend fireproof | Chill 1->1.5, Wet 1->1.3 | Entangle 1->0 (flier), Bleed 1->0 (deadBleed) |
| angelFallen | Fallen Angel: An angel's spear, but its blows curse instead of blinding with light. | spire | Radiance 0, Curse 0 | data | - | Entangle 1->0.5 (flier) |
| sunBlade | Sun Blade: A great sword three heroes long. | spire | Poison 0, Stagger 0, Radiance 0, Curse 0 | data; code: stuns, KO, freeze, sleep, roots wiped while it sweeps (bladeLock) | Wet 1->1.3, Shock 1->1.4, Entangle 1->0.5, Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| choirSprite | Choir Sprite: Everything of its side inside its song mends, and everyone of yours inside it grows sleepy | spire | Radiance 0 | data | - | Curse 1->1.3 (holy) |
| golem | Golem: Slow and hard to shift. | spire dunes | Burn 0.6, Chill 0.6, Poison 0, Wet 0.5, Curse 0 | data | Entangle 1->0.5, Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| gildedGolem | Gilded Golem: A golem whose front throws shots straight back at whoever fired them. | spire | Burn 0.6, Chill 0.6, Poison 0, Wet 0.5, Radiance 0, Curse 0 | data | Entangle 1->0.5, Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| spiritHeal | Light Spirit: Its ray mends a friend for as long as it holds. | spire | Poison 0, Radiance 0, Curse 0 | data | - | Entangle 1->0 (flier), Bleed 1->0 (deadBleed) |
| spiritWard | Ward Spirit: Its ray takes half the harm off a friend for as long as it holds. | spire | Poison 0, Radiance 0, Curse 0 | data | - | Entangle 1->0 (flier), Bleed 1->0 (deadBleed) |
| heraldLight | Herald of Light: With its fallen twin: each mends while the other is near, so pull them apart. | spire | Radiance 0, Charm 0 | data; code: Charm (charmProof) | - | Curse 1->1.3 (holy) |
| heraldFallen | Fallen Herald: With its twin of light: each mends while the other is near. | summon | Radiance 0, Curse 0, Charm 0 | data; code: Charm (charmProof) | - | - |
| chieftain | The Goblin Chieftain | warren | Chill 0.7, Poison 0.3, Stagger 0.5, Charm 0 | data; code: Charm (charmProof) | - | Poison 0.3->1 (boss poison) |
| warDrum | War Drum | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| greatOoze | The Great Ooze | sewers | Burn 1.4, Chill 1.2, Poison 0, Wet 0, Stagger 0.4, Charm 0 | data; code: Charm (charmProof) | - | Bleed 1->0 (deadBleed) |
| oozeHalf | The Great Ooze (its other half) | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| winterQueen | The Winter Queen | frost | Burn 1.3, Chill 0, Poison 0.3, Wet 0.5, Stagger 0.6, Charm 0 | data; code: Charm (charmProof) | - | Poison 0.3->1 (boss poison) |
| queenImage | Ice Mirror | summon | Burn 1.3, Chill 0, Charm 0, Confuse 0, Sleepy 0, Fear 0 | data | - | - |
| cinder | Cinder, the Old Drake | ember | Burn 0, Chill 1.3, Poison 0.25, Wet 1.3, Stagger 0.4, Charm 0 | data; code: Charm (charmProof) | - | Poison 0.25->1 (boss poison) |
| drakeSegment | Cinder (body) | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| drakeTail | Cinder (tail) | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| gildedSeraph | The Gilded Seraph | spire | Poison 0.3, Stagger 0.5, Radiance 0, Curse 0.5, Charm 0 | data; code: Charm (charmProof) | - | Poison 0.3->1 (boss poison), Curse 0.5->1.3 (holy), Entangle 1->0.5 (flier) |
| seraphHorn | The Gilded Seraph (a trumpet) | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| seraphSinger | Choir Singer | summon | Radiance 0 | data | - | Curse 1->1.3 (holy) |
| sandWurm | The Sand Wurm | dunes | Burn 0.8, Poison 0.3, Wet 1.4, Stagger 0.4, Charm 0 | data; code: Charm (charmProof) | - | Poison 0.3->1 (boss poison) |
| wurmSegment | The Sand Wurm (body) | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| greatEngine | The Great Engine | foundry | Burn 0.5, Chill 0.8, Poison 0, Wet 1.3, Shock 1.4, Stagger 0.4, Radiance 0.5, Curse 0.5, Charm 0 | data; code: Charm (charmProof) | - | Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
| engineHammer | The Great Engine (hammer) | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 1.4, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| engineClaw | The Great Engine (claw) | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 1.4, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| engineValve | The Great Engine (valve) | part | Burn 0, Chill 0, Poison 0, Wet 0, Shock 0, Stagger 0, Radiance 0, Curse 0, Entangle 0, Charm 0, Confuse 0, Sleepy 0, Bleed 0, Fear 0, Shackle 0 | data | - | - |
| welderDrone | Welder Drone | summon | Poison 0, Wet 1.3, Shock 1.4, Curse 0, Entangle 0.5 | data | Bleed 1->0 | Curse 0->1 (jinx), Charm 1->0 (mindless), Sleepy 1->0 (mindless), Fear 1->0 (mindless) |
<!-- TABLE:end -->
