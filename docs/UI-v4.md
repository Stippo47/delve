# UI v4: the unit page, and the Book as grids (round 14, lane U)

The designer's words this is built from (the Riffle answers, `docs/riffle-log/2026-11-22-round14.txt`, card "book"):

> Very busy and packed together. Some repetitiveness. You can show multiple pages side by side I can swipe between like
> clash royal.

> I actually think these bestiary screens should be the same ones that show when you select a unit. Where you go to
> change equipment, read descriptions, upgrade etc. [...] For hero's has these tabs/pages: main (set equipment and
> potion), upgrades (web), preview, stats [...] Enemies tabs: overview (times killed, found in: , description, etc),
> preview, stats. There would be a top bar to switch between base, elite, and major. [...] There would be no bottom
> bar to navigate between enemies you would press back and it would open a page listing them all out in a grid. You
> could also see all heroes in 1 page, trinkets in another, status effect in another, dungeon overview in another.
> [...] I want every stat to have a readable icon so u can see sword + a number for damage for example.

Earlier rulings (UI-v3.md: the colours, the type, thumb zones, the iPhone Safari rules) hold. What changed is the
structure.

## One unit page, opened the same way from everywhere

`js/unit.js` `openUnit({ save, kind: 'hero' | 'foe', id, acts, onBack, page, rank })`. It is a full-screen layer
(`#unit`, over the camp and the Book, under the sheets). Who opens it:

| from | what | how |
|---|---|---|
| the camp | a hero | tap the hero on the ground, or a face in the fire's list (`camp.js go('hero')`) |
| the Book | a hero, a monster | tap its card in a grid, or a monster's picture on a dungeon's page |
| the battle page | a hero, a monster | tap the picture on a stack's row |

It is the same page in every case. What a hero's page can *do* (wear a trinket, pack potions, learn a node, sit at the
fire, recruit, unlearn) belongs to the camp, which passes those in as `acts` (`camp.js heroActs`); the Book hands the
same `acts` on, so a hero opened from the Book can be equipped and upgraded there. The battle page opens it without
`acts`: everything shows, nothing can be changed.

### Pages side by side (`js/pager.js`)

A strip of tabs on top that also taps; under it the pages sit in a row. One finger sideways drags the row with the
finger; on release it snaps to the nearest page (past a fifth of the width, or a flick). The gold bar under the tabs
moves with the row. A page still scrolls up and down by itself. The skill web keeps its own one-finger pan
(`data-noswipe`): over it, a drag turns the page only when it starts within 44 px of the left or right side of the
screen (or on the tabs); anywhere else it pans the web.

### A hero: Main · Upgrades · Preview · Stats

- **Main**: the portrait, the XP bar, "Sit at the fire" (or the rest timer); **Equipment** (the trinket slots: a tap
  opens the same sheet as before: wear, swap, level up, take off); **Potions** (the two pockets this hero takes into
  the next delve: a tap opens the fire's packing sheet on this hero; only a seated, rested hero can be packed);
  **Trait** in words; the hero's line. Not recruited: a Recruit button at the bottom.
- **Upgrades**: the skill web, as it was, filling the page; the points, Unlearn all (once something is learned) and
  Centre float over it.
- **Preview**: the live preview across the full width, a caption under it (the move's name, its words, an ability's
  three tier lines with the dial's tier lit and the tiers this hero has learned ringed), the moves as a row of buttons
  and the tier dial (0 / I / II / III: `heroes.js tierBuild`) under the thumb. It opens on the highest tier of any
  ability the hero has learned.
- **Stats**: icon + number, three across: health, armour, speed; the weapon (damage, hits a second, reach); each
  ability on a row (its tier, what the web adds to it, its cooldown as it stands); ability haste, healing and potency
  when the web has added any; the trait's numbers; resistances; then All runs (the lifetime totals and where the damage
  and healing came from). Teal = raised above the bare hero by the web or a trinket.

Where the old hero page's parts went: Gear -> Main; Skills -> Upgrades; About's kit -> Preview's captions, its numbers
and All runs -> Stats, its blurb -> Main. `CAMP.setMode('hero', { id, sub: 'gear' | 'skills' | 'about' })` still works.

### A monster: Overview · Preview · Stats, and Base / Elite / Major on top

The switch drives all three pages (a boss, and a kind that never comes as an elite, has none).

- **Overview**: the picture, its line from the bestiary; defeated, elites and majors (a boss: defeated, as the boss,
  met); **Found in** (each dungeon with its floors); **In a fight**: its attack, how it fights, and at Elite and Major
  the move that rank adds, in words.
- **Preview**: the stage, the move's words, one button a move. Elites and majors carry no trinket on the stage.
- **Stats**: health, armour, speed; damage, hits a second, reach; resistances. They are the numbers the game would
  give it on a chosen dungeon floor: the bar at the bottom steps through every dungeon's floors and opens on the first
  place the kind is met. See "Numbers" below.

## The Book: five grids

`js/book.js`. Heroes · Monsters · Trinkets · Statuses · Dungeons, side by side (the same pager). A grid is cards and
headings, nothing else.

- **Heroes**: with you, then not recruited. A card opens the unit page.
- **Monsters**: by dungeon ("15 of 22"); kinds not met yet stay dark and can't be opened. A card opens the unit page.
- **Trinkets**: every trinket, then the potions. A card opens the thing's page: its live preview, its words, what it
  costs, how many you have, its level, who wears it.
- **Statuses**: what builds up and bursts, what a burst leaves, the other states. A status's page: its preview, a meter
  under the stage (the cause, the bar, what it bursts into), its words, and its numbers (fills at, fades a second,
  left by a burst). Where a burst's outcome depends on what is done to it (Frozen: left alone or shattered; asleep:
  left alone or woken) the stage plays both turn about, and a two-way switch under it holds it to one.
- **Dungeons**: one row each, in the order they open. A dungeon's page: its line, deepest floor / boss beaten / its
  kinds beaten, then each floor with who lives there (a tap opens that monster), the mini-boss or boss ringed in gold.

No strip of faces under a unit: Back returns to the grid, which is still there underneath at the scroll position it
was left at.

**What the save does not record for a dungeon** (so the overview can't show it): runs entered, deaths there, the
fastest clear, kills made there (the page sums the lifetime tally of the kinds that live there instead).

## Calm

The complaint was "very busy and packed together". The rules these screens were built to:

- one main thing a page; the preview has the full width on its page; controls sit at the bottom;
- two text sizes a page (16 and 13.5) and small caps for headings; numbers at 19;
- no boxes round things that aren't buttons; 20 px side gutters, 30 px between sections;
- nothing said twice on a page (the rank is on the switch, not repeated in the caption; the trait's words are on Main
  and under its preview, its numbers on Stats).

## Stat icons

Every stat icon comes from `icons.js statIcon(id)`: hp, armor, speed, dmg, aps, range, cd, heal, potency, haste, kills,
runs, taken, blocked, downs, revives, best, xp, gold, bag, found, elite, major, tier, fill, decay, time, floor. The set
there now is a plain one in the look of the other icons; when the designer picks a style from `design/icons-r14`, its
drawings replace the entries of `STAT` and every screen changes with them.

## Numbers

`js/unit-stats.js`, no hand-copied numbers:

- a hero: `dungeon.js heroProbe` (the hero from the save as it walks into a room: level, web, trinkets and their
  levels), read through `numbers.js numbersOf` (`sim.js unitNumbers`), cooldowns from `kits.js cooldownOf`, the web's
  sums from `heroes.js statsFor`, immunities from the unit's own hooks;
- a monster: `dungeon.js enemyMult` for the dungeon and floor, `dungeon.js battleFoe` for the body at that strength and
  rank (`elites.js makeElite` / `makeMajor`, armour from `armour.js` through `sim.js spawn`). An ordinary kind is taken
  at the middle room of the floor (rooms climb 3.5% each, so that is the floor's average); a boss or a floor's
  mini-boss in the floor's last room, with its health for the party's present size (`dungeon.js BOSS_HP`). Trinkets are
  left off (an elite's are picked by the dice each time).

## Previews (`js/preview-sim.js`, `js/preview.js`)

- **Nothing is written on a stage** (`STAGE_TEXT = false`): the round 13 marks are gone, and so are the game's own
  floating words and hit numbers there. What a tier adds is in the caption. Units on a stage that matter carry a health
  bar (`u.barAlways`: `hpstyle.js`), so a blow, a heal or a block is read off the bars.
- **A locked ability still plays** (`S.asLocked`): as it is at tier I on a hero with nothing else bought; the page
  marks it locked (a lock on the stage's corner, on its button and in the caption).
- **A trait has its own scene** (`TRAIT_SCENE`), in a small yard, with only what it needs. Whoever strikes the hero is
  a target holding a weapon (sword, bow, spear, hammer: `art/lab/dummy-<weapon>.svg`), in front of the hero and facing
  it. Where the trait changes a number, two things stand side by side that differ in the one way it cares about (a
  burning target beside a plain one; a friend beside the hero). Each time the trait acts a gold ring pulses once round
  whoever it acted for.
- **No trinkets on elites and majors** on a stage.
- **A status's meter** fills, holds full for the burst (and the picture of what it bursts into lights while that state
  lasts), then falls to what the burst leaves. Its size never changes. (Round 13's showed the raw value, which is
  emptied in the very step it fills: the bar jumped from nine tenths to nearly nothing, "Burst!" was swapped in beside
  it and the bar's length changed with the words.)

## Dev controls: one place

Settings -> **Dev**: unlimited gold and points (`save.cheat`; also opens every dungeon and shows every monster in the
Book), show the whole skill web (`delve.webAll`, this device only), battle: field everything (`save.battleDev`, moved
here from the battle page's picker). Nothing else on screen is a dev control. Still in the address bar only, for
testing: `?seed`, `?auto`, `?theme`, `?floor`, `?party`, `?lvl`, `?foes`, `?elites`, `?majors`, `?boss`, `?bossroom`,
`?bossmove`, `?trinkets`, `?allnodes`, `?web`, `?ehp`.

## Tools

`node tools/serve.mjs 8961` then `node tools/unit-shots.mjs <outDir> [--clips] [--traits] [--only name]`: stills of
every screen above at 390x844, films of the swipes and of the same page opened from the camp and from the Book, and
(`--traits`) one still of every hero's trait scene. `tools/preview-check.mjs` still steps every preview in Node.
