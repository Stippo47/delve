# Build v3: round 7 (2026-11-20)

Sources: the designer's chat message of 2026-11-20 (quoted below) and `docs/riffle-log/2026-11-20-round7.txt`
(looks-r6, art-round5, v07-report answers, word for word). Contracts from BUILD-v1/v2 still hold. Each lane works in
its own worktree and branch, commits there, never pushes; the lead merges. Keep diffs small in files you don't own.

The designer's chat message, word for word:
> Takes too long to go to next dungeon. From the door. They get stuck at it for a bit. Once within range party member
> should disappear (in a pleasing manor). Something is summoning the old skeleton visuals. Summoned skeletons should
> get like a purple outline or something to distinguish themselves from enemy skeletons. Dead things should be more
> faint. The unit cards should keep their Jo [HP] and xp lines with the numbers. In a dungeon a unit can grab an
> additional trinket. Once full they won't grab it leaving it for allies to grab. Have the upgrades have stronger
> scaling but also the dungeons and levels scaling harder as well. Add 3 more harder dungeons. You can use the enemy
> sprites i said aren't good for now. Make it so every enemy can be "elite" gaining an additional special ability
> ontop of their base kit that they can use to fight. Have elites show up more often be about 2-3x stronger than base
> and be about 1.5x faster. For example an elite slime will lob smaller slimes at your location on an interval and
> also split into 4 normal slimes (which also split themselves). Make them slightly less big and drop slightly less gold.

## D: dungeons and combat (branch `dun`)
- **Elites**: any enemy kind can be elite: its base kit plus one extra special ability of its own (design one per
  kind, readable, in the spirit of the elite slime example), ~2-3x stronger, ~1.5x faster, slightly smaller, slightly
  less gold, showing up more often. A clear visual mark for elites (not text).
- **3 more, harder dungeons** after the Crypt, with their own looks, rosters, hazards, a warden and a boss (a powered
  warden is fine as a stand-in). Use the enemy art the designer marked not good (design/class-round4/enemies,
  design/class-round4/monsters, design/class-round5/enemies) as placeholders; mark them PLACEHOLDER.
- **Scaling**: skill-tree upgrades scale stronger; dungeons and floors scale harder to match.
- **Waves**: 2-3 more per room, each a bit harder than the last. **Everyone 20% slower** than now.
- **Door exit**: the party must not dawdle at the door; once a hero is within range of the chosen door it vanishes in a
  pleasing way (a step into the light: shrink, glow, a few motes), and the room ends as soon as all are through.
- **Trinkets found in a dungeon**: a hero can pick up an additional trinket (up to its slots); a full hero leaves it
  lying for an ally to grab.
- **Obstacles on the grid** (looks-r6 note): barrels, crates and stones/boulders aligned to the grid, one cell each,
  a cell about the size of a unit's largest sprite area; rooms generate with walls and various obstacles in the way;
  spikes sized to a cell too.

## P: polish and HUD (branch `pol`)
- Shadows smaller, and they don't stack: overlapping shadows merge into one union (draw them into one layer).
- A death explosion effect (a burst when something dies). Dead things fainter.
- Summoned skeletons (and every summon) must not use the old skeleton look: use the current skeleton art with a purple
  outline (or a purple tint to the outline) so they read as ours. Find what still draws the old art/skeleton.svg.
- The HUD's unit cards keep HP and XP bars with their numbers (the v07 HUD part was marked PROBLEM; this is the fix).
- Dungeon looks picked: Carved for all three themes is the default; Torchlit for the Crypt and Mosaic for the Warren
  were also ticked: keep all four styles selectable, default Carved.
- Sound marked "decent": leave it, unless a quick win shows.

## C: camp and skill tree redesign (branch `camp2`)
The designer: "You just changed the theme. It was fundamentally bad layout/design. But for the theme I guess I like
nights watch the most." and on the tree: "Once again mostly just theme change. No actual difference in how it's
shown/layout. No web, or tree. Something more creative and interesting." So: keep the Night watch theme; redesign the
camp's layout and flow from scratch (what's on screen, how you pick heroes, shop, set out), and make the skill tree an
actual tree or web (nodes branching from the hero, paths you grow along) that's interesting to look at and tap. Make 2
layout concepts for each, both working, switchable, screenshot them. Remove the old look options that were only
re-themes.

## A: art fixes (branch `art3`) — run at the highest effort
The designer suspected a weaker model because the last round changed more than was asked. **Change only what each
note asks, starting from the exact version the designer saw (design/class-round5/...), never a fresh redesign unless
the note says to try again.** Notes are in round7.txt under art-round5: heroes not picked "need fixing" (each item's
note says what), enemies not picked "need to be tried again for 1 reason or another" (fix what the note says; for
enemies with no note, fix them toward the heroes' style without changing what they are). Specific: Harpooner's beard
back; Marksman A longer gun and a skinny grey moustache; Ninja mask softer; Pirate wider hat; Slinger hat; Trapper hat
on the right; Gladiator spartan helmet; Werewolf human: facial hair layered in front of the head, no sheen or lines in
the hair, axe flipped; Werewolf: fangs, shadowing, the head segment and ears; Witch no shine and a less weird hat tip;
Chef hat; Seer: the eyeband right, hair showing above it; Bat shading and maybe a nose; Angel B halo layered properly;
Lizard spear A: only what was asked (no eyes, shading version); Slime big: remove the tail only; Snowman: head stacked
over the body in the middle, not leaning; Spider hunter fangs and shading. **Facial hair is often layered wrong (behind
the head): check every bearded design.**
