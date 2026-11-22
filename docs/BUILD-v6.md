# Build v6: round 13 (2026-11-22)

Two sources, both the designer's own words. **Read your lane's parts of both in full**; this file only sorts them.
1. The chat message below.
2. The Riffle answers of the same day: `docs/riffle-log/2026-11-22-round12.txt` (art rounds 8 and 9, showcase 3 and 4,
   battle mode, the bosses, the balance report, the wagon, the campaign curve).
Earlier contracts (BUILD-v1..v5, DECISIONS) hold unless changed here. Lanes work in their own worktree and branch
under ~/Dev/delve-wt/, commit, never push.

## The designer's message
> Remove the cooldown when your party dies. Have them lose 75% of gold earned.
>
> In the battle page make it so I can set the tier of the unit. Hero's 0,1,2, and 3. 0 is no upgrades. 1 is all in
> first shell/ all abilities, 2 are all upgrades on the 2nd abilities shell and so on. I want to see units are against
> themselves at different tiers.
>
> On every ability I want the preview clips you made in riffle to be shown (can be simulated not recorded) for every
> unit and ability and tier. Will show in the book/ bestiary. You can select the hero and their tier. For the enemies
> the same preview will show up for them with their abilities against dummies at normal, elite, and major tier.
> Probably overhaul the book ui overall.
>
> For the convoy do these changes. Cart is bigger, camera more zoomed out so everything is smaller. Forest edge is
> further is the side and looks better. Bigger area to fight. Enemies spawn from the forest edge and walk inwards.
>
> Fix the delve ui. Has a harsh cut.
>
> Make it so the radiance glow appears below. All status effects and trinkets should have previews aswell.
>
> Tangled and rooted are the same thing.
>
> Add a charming hero. New charm status, can't hurt who is charming them, burst effect makes them fight for you for a
> bit. Elite Cupid enemies will shoot love arrows that charm. Succubus enemies will also charm who just them and deal
> extra damage to charmed foes.
>
> Confused status effect bad aim, turns randomly, attacks when no target is in range. Burst effect. Attacks can hurt
> allies for a bit, uses all abilities available abilities at once. Is fear a status effect yet?
>
> Sleepy status effect. Lower chance to use abilities, slow attack speed.
>
> Some positive status effects don't show.
>
> Bleeding status effect. Drains hp, taking damage increases duration. Burst effect removes 33% of remaining hp. Make
> healing weaker.
>
> Many heroes still seem weak compared to others like the tower vs paladin
>
> Get an agent on the new enemies sprites. Including make the sword enemy much bigger. Like 3 units across in size.
> Also it doesn't do anything currently.
>
> Get new slime spite in.
>
> Make the archers abilities stronger/ have more of the damage percentage.

## Rulings and readings (the lead)
- **A wipe**: no resting afterwards, and 75% of the run's gold is lost (it was 20%, with resting). Leaving early is
  unchanged (20%, and the hurt still rest) until the designer says otherwise.
- **Tiers** (battle page, book): tier 0 = nothing bought; tier N = every node of the skill web out to the Nth shell
  (shell 1 holds the three abilities at tier I, shell 2 their tier II, shell 3 everything). `heroes.js tierBuild(id, n)`
  is the one definition; the battle page and the book both use it.
- **Fear** is not a status yet (it was only proposed in round 9). It goes in with the other new ones.
- **Tangled = rooted**: one state, called Rooted, one icon, one look; Entangle's burst roots.
- **Poison**: "should drop lower after its burst is over": to 30 at the burst as now, to 0 when the sickness ends.
- **Armour**: "A combination of the 2. % and fixed?": each point takes one point off a blow and also 2% off it;
  the whole cut still never passes 60%. Heavy and critical blows get past half of both.
- **Rooms that drag on**: the designer sent the wither rule back (WORKSHOP). It is off until redesigned.
- **Healers**: "a good sign that some sort of healer is required"; still add heal negation and enemies that target
  healers (lane S).
- **Stats**: damage taken and damage blocked (shields, deflections, armour: what didn't get through) are counted apart.
- **Battle mode**: answers in the log (dev unlock, mixed ranks of one kind, a stats-scaling toggle, bigger arenas,
  better setup and result layouts). The lead does these with the tiers.
- **New heroes that fall behind** in later dungeons: "open for suggestions": the lead answers in Riffle.

## Lanes
At most four agents at once; the rest queue in this order.
| lane | branch | does |
|---|---|---|
| K: the book | `book` | the Book rebuilt: a live preview (simulated, not recorded) of every hero's attack, abilities and trait at tier 0-3, every enemy's moves at normal / elite / major against dummies, every status and every trinket; pick the hero and the tier; the Book's whole UI overhauled |
| S: statuses | `status2` | Charm, Confused, Sleepy, Bleeding, Fear; Tangled merged into Rooted; the radiance glow under units; positive statuses that don't show; poison and armour as ruled; damage blocked counted apart; a charming hero; the elite Cupid's love arrows; the Succubus; heal negation and enemies that hunt healers |
| W: the wagon | `convoy2` | the message's convoy changes and the v13-convoy answers (4x wider ground, bigger wagon, zoomed out, a better forest edge further out with enemies walking in from under the trees, no Guard / Gather switch: heroes smart about gold, gatherer heroes, the downed revivable until they scroll off, the roadside shop spending the trip's gold, one trip through several biomes); and heroes not huddling when no enemy is on screen, in dungeons too |
| A: art | `art7` | "Get an agent on the new enemies sprites": every note in the art-round8 and art-round9 answers; the sun blade drawn to be 3 units across; the round-7 slime (tail removed) into the game |
| queued: H1 | `kits3` | the first 15 heroes: the showcase 4 answers, then every ability useful at tier I and III (damage abilities at least the weapon's damage on average), the Archer's abilities a bigger share of her damage, the Tower against the Paladin |
| queued: H2 | `heroes3` | the 37 newer heroes: every showcase 3 answer (new traits and abilities in the designer's words), then the same ability check |
| queued: B | `bosses3` | the v12-bosses answers: the Great Engine from scratch (arm segments between head and hands), the Sand Wurm and Cinder redone, a biblically accurate angel for the Spire (a horn ability; four chains from the arena's corners that drag what they hit), the Winter Queen and the Chieftain improved (a 2-minute fight: more damage, less health), the Ooze without tentacles |
| queued: E | `foes3` | enemy behaviour from the answers: the sun blade actually fighting, the yeti's snowball as its own heavy thing, the sand serpent redone |
Rules for all: either kind of unit can be on either side (never `team === 'hero'` for targets; summons take
`team: u.team`); `node tools/battles.mjs`, `node tools/runs.mjs --n 6 --theme all` and `node tools/convoys.mjs --n 6`
must end clean. Art fix rounds start from the exact version the designer saw and change only what the note asks.

## Who does what, and the gate (2026-11-22)
The designer, after the launch: "Make sure the agents are capable so I don't have to send them back."
- Lanes whose kind of work has come back before go to the strongest model at high effort: **art** (`art7`, restarted),
  and when they start, **bosses** (`bosses3`) and **the first heroes' kits and visuals** (`kits3`). The engineering
  lanes (the Book, statuses, the wagon, and later `heroes3`, `foes3`) stay on Opus, at xhigh for new launches.
- Every brief carries what the designer has rejected and why, and asks for a line-by-line checklist of their words
  with evidence and a "would they send this back?" pass before reporting.
- The lead reviews each lane's output against the approved references before anything goes to Riffle, and sends weak
  work back to the lane instead of on to the designer.
