# Tags (round 17, lane tags17)

The designer: "Work on the tag system. For example constructs (stationary, built) can be tagged construct, then there
could be a separate healing ability that only affects constructs. Think the engineer hitting its turrets with their
wrenches. Can heal its constructs but not his allies. Or any fire tagged entity taking damage when wet or in water. Or
the silence stopping mouth abilities. Add the obvious ones. Then anything else you could imagine being good, you can
suggest." Then, during the lane: fire things set on fire get a rage-like boost instead of damage; sharp vs blunt
damage; magic as its own damage type apart from the elements it carries; and height layers (a hopping slime hovers,
some leaps fly).

Code: `js/tags.js` (every list and number; the sim asks it and keeps no names of its own). Checks:
`node tools/tags17/check.mjs` (56 checks, all pass). The table below: `node tools/tags17/list.mjs`.

## 1. The registry

Three kinds of thing carry tags, each in one place:

- **Unit kinds** (`tagsOf(u)`, `hasTag(u, tag)`). From the def's own fields where they already say it honestly
  (`construct` or `turret` -> construct; `turret` -> stationary; `hops`/`splits` -> slime; `undead`; `boss`; the
  Foundry's machine resistances -> metal), from the explicit lists in `KIND_TAGS`, and from an optional `labels` array
  on a def. A variant has its base kind's tags too.
- **Abilities** (`abilityHas(id, tag)`): `ABILITY_TAGS` by ability id (mouth, sound, magic). The `tags` string the
  heroes' abilities already carry ('ds': the web's arms) is untouched; an ability def may also carry `labels`.
- **Enemy moves** (`moveHas(u, key, tag)`): `MOVE_TAGS` by the move's clock key in elites.js `due(u, key)` ('howl',
  'breath', 'bite'...), or `kind:key` for one kind's own ('cinder:call').
- **Hits** (`hitKinds(o, src)`, `hitType`, `isMagicHit`): section 4.

### Which kinds have which tag

| tag | kinds | who |
|---|---|---|
| Construct | 49 | Totem, Cauldron, Beehive, Supply crate, Barricade, Pavise, Big bomb, Turret, Torcher, Tesla tower, Snowball mortar, Medbay, Med drone, Wind-up drone (heroes' summons); Ice Totem, Dart Trap, every Foundry machine (gear and cog sprites, bomb bots, automaton, the six turrets and mortars, tesla coil, repair and welder drones, the nine copper/bronze/steel bees, wasps and hornets, chain crawler and its plates, drill bot), Golem, Gilded Golem, War Drum, the Great Engine and its hammer and claw |
| Stationary | 25 | the heroes' turrets, towers, totem, cauldron, hive, crate, barricade, pavise, big bomb; Ice Totem, Dart Trap, the Foundry's turrets and mortars, Tesla Coil, War Drum, the Seraph's trumpets, the Engine's valve |
| Fire | 10 | Imp (enemy and the Warlock's), Fire Slime, Fire Spider, Hellhound, Cinder Bat, Fire Spirit, Cinder (and its body and tail) |
| Ice | 12 | Snowman, Old Frost, Frost Shaman, Ice Totem, Frost Wolf, Ice Slime, Frost Spider, Yeti, Icicle Wraith, Frost Spirit, the Winter Queen, Ice Mirror |
| Plant | 4 | Hay bale, Sproutling, Ent, the Elder Ent |
| Undead | 17 | Skeleton, both Bone Kings, the four Rattlers, Golden and Harrowing Skeletons, Gaper, Brute, Ghost, Banshee, Grave Warden, Mummy, Icicle Wraith, Raise Dead's minions |
| Spirit | 16 | the Shaman's four spirit animals, Ghost, Banshee, Wisp, Dust Devil, the eight elemental spirits, Icicle Wraith |
| Beast | 34 | rats, mice, wolves (and the Alpha, Dire and Frost Wolf, the werewolf's beast form, the spirit animals), bats, spiders, boar, croc, crabs, leeches, scarabs, cobra, sand serpent, yeti, hellhound, the Sand Wurm |
| Slime | 10 | every slime and slimelet, the Great Ooze and its other half |
| Flier | 33 | Griffon, Valkyrie, spirit eagle, med drone; bats, ghosts, banshee, wisps, spirits, cherub, angels, seraphs, the Foundry's drones and bees, the Gilded Seraph |
| Metal | 40 | the Engineer's machines, the Witch's cauldron, the big bomb, every Foundry machine, Saw Blade, Gilded Golem, the Great Engine and its parts |
| Demon | 8 | Imps, Devil, Succubus, Demon, Pit Lord, the Archfiend, Hellhound |
| Holy | 14 | Cherub, Angel, Seraph, Archon, the Radiant, Fallen Angel, Sun Blade, Choir Sprite, Gilded Golem, Light and Ward Spirits, Herald of Light, the Gilded Seraph, Choir Singer |
| Caster | 46 | the spell-casting heroes (not the Alchemist or the Plague Doctor: their flasks are chemistry) and the enemies whose shots are spells |
| Boss | 23 | every boss |
| Mute, Deaf | 0 | the designer's traits (always on); the rule for Mute is built (a Mute kind is Silenced for good), no kind has either yet |

The inspect panel (tap a unit while paused) shows a unit's tags under its numbers.

## 2. The three named interactions

### Construct: the Engineer's wrench repairs constructs
With nothing for her to hit close by (no enemy within 90 of her), the Engineer walks to the most damaged construct of
her side within 420 (her own turrets and towers first, then a friend's barricade, crate or pavise) once it is under
85% of its health, and whacks it with the wrench in place of a blow: **each whack mends 12% of the construct's health**,
on her own attack clock (about one a 1.1 s, so about 11% a second). The wrench never mends anything that isn't a
construct; her ally beside the turret gets nothing. Her attack's words in the Book say so. (`kits2.js REPAIR`.)
For comparison, the Foundry's Repair Drone mends 12% every 2.4-3 s; it now asks the same construct tag.
- Measured (check.mjs): a turret at 56/140 with a Paladin at 40% beside it: 4 whacks in 6 s, the turret to 123/140,
  the Paladin untouched. With a foe on her she fights and doesn't mend.
- Also built (obvious, cheap): **constructs take no bleed and no poison** (tags.js `TAG_RES`). The Foundry's machines
  were poison-proof already; this adds the heroes' turrets and towers, the golems' bleeding, and every construct's bleed.

### Fire and water
- **Doused**: a fire-tagged unit that is Wet, or stands in water, takes what Burn would do to anything else at that
  much build-up: **(1.5 + 0.06 x wet) a second, from 8 wet up; standing in water counts as at least 60 wet** (6.6/s;
  a puddle soaks to about 84-90, so about 6.8/s). It steams all the while and says "hiss" every 2.5 s (the steam sound).
  A flier over water isn't doused by the water under it, only by what wets it. Bosses take half; a boss's parts none.
- Measured: an imp (32 health) left in a puddle is out in 6.0 s; a Fire Slime loses 6.9/s; Cinder in water 3.45/s (it
  has 1260: a quarter of a percent a second, and it was already weak to water, res wet 1.3); an imp soaked to 80 once
  loses 50 health as it dries over 12 s; a rat in the same water loses nothing.
- Fire bosses: I tagged only Cinder (a fire drake). The Pit Lord and the Archfiend are demons, not creatures of flame
  (left untagged, a call for the designer). At half rate Cinder isn't trivialised: a party would need to keep it
  soaked through for minutes.
- Also built (obvious): **water puts out burning**: each soaking halves the burn on anything (what's left under 8 goes
  out), as it already washed off half the poison.
- **Kindled** (the designer's ruling during the lane): a fire thing set on fire by the other side takes no damage
  from it: it builds Burn as anything does (its own burn-proofing set aside) and **deals, attacks up to 30% more and
  moves up to 15% faster, x how full the burn is**; at full it **FLARES** (no Scorch damage to it or round it): the
  whole boost for 4 s. Bosses get half the extra (x1.15). Fire with nobody behind it (a pool, its own trail, its own
  side's flames) still does nothing to it, so hellhounds and Cinder aren't kindled by their own fire. Water still
  hurts it and puts half the burning out.

### Silenced stops mouth abilities (a rule change)
- **The rule**: SILENCED (`u.silencedT`, `sim.js silence()`) shuts its mouth: no ability or move tagged mouth;
  **everything else it does as ever**. Bosses 40% of the time. A crossed-out speech bubble floats over its head (fx3
  'hushed'), and it shows in the HUD and the pause panel as Silenced. A cleanse ends it.
- **Mouth abilities (heroes)**: Hold the Line (calls enemies to him), War Song, Lullaby, Rally (a shout), Old Tales,
  Broadside (whistles to the ship), Ram (whistles), Sweetheart (blows a kiss).
- **Mouth moves (enemies)**: every breath (Dragonborn, Hellhound, the Archfiend, Cinder's Scorch), every howl (wolves,
  the Alpha), bites (the Croc's drag, Cinder's bite), the Banshee's wail, the bat's screech, the Choir Sprite's song,
  the Seraph's singers' notes, the Bandit Chief's whistle, the Succubus's kiss, the Hobgoblin's war cry, Cinder's
  roar at the roof (Fire Call). A mouth move's clock waits while silenced and goes 0.3 s after.
- Not stopped: plain attacks (a wolf's bite as its basic blow is a blow), and bosses' phase-turn roars (scripted
  phase changes, not moves). Drinks (Grog, potions) are not counted as mouth (a call: a gag would stop a drink too).
- **The existing silencers**:
  - The Warden's **Nullify** said "silences them", but its effect was "nothing works". Had it become a mouth-only
    silence it would stop **5% of what it stops now** (`tools/tags17/mouth-share.mjs`: of 1275 enemy timed moves over
    every dungeon's kinds and bosses, 64 were mouth moves; 0% in the Warren, the Dunes and the Foundry, 44% in the
    Crypt (banshees), 18% in the Spire (the choir)). So it keeps its lock under its own name: **NULLIFIED** (every
    ability locked, the padlock on its chest, as before, same numbers) and it silences as well. Its tier words now say
    "nullifies" / "Nullified". No change in strength.
  - The **Choir Sprite**'s "a stagger silences it" now uses the one Silenced (its song is a mouth move; same 4 s, same
    effect: measured, it mends 80 in 3 s, then nothing for the 3.5 s after a stagger).
  - The **Gilded Seraph**'s "silenced" when every trumpet is broken is its reel (a hold and +30% taken), unchanged.
  - So today Silenced (mouth only) is put on by Nullify, by a stagger on the Choir Sprite, and by nothing else: the
    suggestions below have a couple of ways in for the heroes.
- Measured: three wolves howl 28 times in 4 x 30 s, silenced 0, and lunge as ever (54 / 58); the Old Guard's Rally 10
  times as ever, 0 silenced, his Great Sweep 16 either way.

## 3. Height layers
- **Floor**: everyone, most of the time.
- **Hovering** (a slime mid-hop, `u.airborne`): over pools, puddles, trails, spikes and every telegraphed floor zone,
  and **missed by slams**; **gas and explosions still reach it**, and so do blows and shots. (Round 16 had gas miss it
  too; the designer: "Gas can hit slimes".)
- **Flying** (`u.flyT`: the Griffon's Swoop and the Valkyrie's leaps while in the air, Sky Dive, the Witch on her
  broom): over everything on the floor; **only shots reach it** (and what was already on it: burning, poison). Most of
  these were untouchable already, so it mostly matters for floor things.
- Kinds that always fly (bats, spirits, angels) are left on the floor layer: up there for good, every zone and slam
  would miss them (a suggestion below).
- Slams: Ground Pound, Shockwave, Earthquake, Skull Splitter's landing, Maul III's crater splash, the enemies' Slam;
  every telegraphed floor zone already missed a hopping slime.
- Measured (`tools/slime-fights.mjs`, 20 seeds): unchanged against main on every row (none of those fights has gas or
  slams), except paladin + archer vs big + 2 poison slimes 33.9 -> 33.4 s. `tools/tags17/slime-slam.mjs` (16 seeds,
  heroes at tier III): Tower vs 3 big slimes 12.4 -> 13.4 s (its slams miss mid-hop), Plague Doctor vs 3 slimes 10.2 ->
  10.0 s (his gas reaches them), the rest the same.

## 4. Hit kinds: a damage type and its elements, apart
The designer: "magic shouldn't fall under blunt or sharp... a fireball would be magic + fire effect. You could have a
monster hunter that resists magic but not its effects."

`hitKinds(o, src)` (o: hurt()'s options, src its source) returns
`{ type, elements, slam, explosion, gas, zone, beam, shot, dot }`:
- **type**: exactly one of **sharp** (blades, points, arrows, bullets, bites, claws, thorns), **blunt** (hammers,
  clubs, fists, stones, shields, bodies, blasts) or **magic**; null for a status ticking (burning, poison and bleeding
  aren't hits). A resistance to a type scales **the hit's damage only** (`def.hitRes = { magic: 0.5 }`, or a tag's in
  `TAG_HIT_RES`). The mechanism is built and checked (a magic-proof foe takes half a fireball's hit and burns in full);
  **no kind has one yet**: the resistances are the audit lane's pass.
- **elements**: what it carries (fire, water, frost, shock, poison, holy, curse, nature), from the statuses on the
  blow. A resistance to an element is the def's existing `res` (burn 0.5 = half the burn): it scales **that element's
  build-up only**, never the hit.
- How the type is decided, in order: the caller says (`o.magic`, `o.sharp`, `o.blunt`; `o.physical` = not magic);
  a status ticking: null; **magic** when the ability it came from is tagged magic (the ability being cast right now
  counts), a shot of a magic kind (bolts, fireballs, orbs, notes, holy light, shadow bolts, kisses...), a zone of a
  magic kind (holy, soul, lightning, radiance), or any shot or zone from a caster-tagged unit; else the **edge**: the
  ability's (`EDGE_ABILITIES`), the shot's kind (`EDGE_SHOTS`, else blunt), a zone ('blade' sharp, else blunt), an
  explosion (blunt), the striker's weapon, kind or tags (a beast's bite and claws sharp; a slime, plant or construct
  blunt), else sharp (most foes carry a blade).
- **isMagicHit(o, src)** (for the Water Mage's Bubble Shield, "blocks magic, not physical attacks") is simply
  `hitType(o, src) === 'magic'`. sim.js now passes `o.proj` (the projectile's kind) on every shot's hit, `o.zone` (the
  zone's kind) on every danger zone's, and `o.explosion` on every `explode()`. To wire the shield: in its `taken` hook
  (or a hurt() check), `if (isMagicHit(o, src)) return 0` (it then blocks a fireball's hit; the burn it carries comes
  through `o.burn` as ever, unless the shield also wants to stop elements).

## 5. Also built, obvious and cheap
- The Cleric's holy bonus on undead (Consecrate III, Smite III) asks the undead tag. It was a list of names in kits.js
  that missed the Bone King, the Grave Warden, mummies and the Icicle Wraith: they now take it (a buff for the Cleric
  against those; a call for the designer).
- The Foundry's Repair Drone mends what the construct tag says (the same kinds as before).

## Not sure about (calls the designer might want)
- Construct = built (the Foundry's walking machines count, as they already did for the Repair Drone), not only
  stationary; stationary is its own tag.
- The wrench mends any construct of her side, not only hers (a Quartermaster's barricade too).
- Bites count as mouth (they are in the brief's list), so a silenced croc can't drag; drinks don't count.
- Fire tagged: elemental fire creatures only (not demons, not machines that use fire like the Flame Turret).
- Kindled only by the other side's fire.
- Always-flying kinds stay on the floor layer.

## Suggestions

Each stands alone; my pick at the end of each.

1. **Holy light burns the dead.** Every holy hit (a Cleric's light, a Valkyrie's burst, a Paladin's consecrated
   ground) does half again as much to skeletons, ghosts and mummies, and they glow when struck. Undead floors become
   the place to bring a healer who fights. *Pick: yes, it generalises what the Cleric's third tiers already do.*
2. **Lightning leaps through metal.** A shock that lands on a machine, a turret or a golem jumps on to the nearest
   other metal thing. The Foundry rewards lightning heroes, and your own turrets get caught in their chains. *Pick:
   yes, Foundry only matters most; friendly turrets spared.*
3. **Blunt breaks bones, blades cut flesh.** Skeletons and golems take more from hammers and clubs and less from
   blades and arrows; slimes the other way round (a sword splits them, a club sinks in). Picking a party for a dungeon
   starts to matter. *Pick: yes, small numbers (20%), after the resistance audit.*
4. **Sharp hits make things bleed, blunt ones daze.** Every sharp blow builds a little bleeding, every blunt one a
   little stagger, so weapons feel different even with the same damage. *Pick: maybe; a lot of small numbers to tune.*
5. **Machines can't be healed, only repaired.** Healing spells, potions and songs do nothing to turrets, totems and
   golems; only the Engineer's wrench and repair drones fix them. Builders become the only way to keep a construct up.
   *Pick: yes, it makes the wrench matter.*
6. **Minds of iron.** Constructs can't be charmed, frightened, sent to sleep or confused. A tower doesn't panic.
   *Pick: yes for heroes' constructs; the Foundry gets a little harder.*
7. **A beast-tamer's calm.** A new hero (or a Druid tier) who can soothe an animal: wolves, boars and bats stop
   fighting for a while, or for good if they're weak. *Pick: yes, as a Druid tier or a new hero.*
8. **Spirits pass through walls.** Ghosts and spirits drift straight through walls and pillars to reach the party,
   but can't stand in holy ground. *Pick: maybe; it changes how rooms play a lot.*
9. **Fliers fly.** Bats, spirits and angels really are in the air: puddles, fire and ground slams never touch them,
   but arrows and spells do, and nets bring them down. Ranged heroes gain a job. *Pick: yes, with a few heroes'
   abilities able to ground them.*
10. **A muzzle for the loud ones.** A hero who gags or hushes one enemy at a time (a thrown gag, a finger to the lips,
    the Monk's vow of silence on a foe): it can't howl, sing, breathe fire or bite for a few seconds. Gives the new
    Silenced a way in. *Pick: yes, the Monk.*
11. **Deaf to it.** Deaf kinds (machines, golems, slimes) ignore every song, shout and howl, theirs and yours: no
    sleepy lullaby on a turret, no war cry speeding up a golem. *Pick: yes, it's the designer's Deaf rule waiting for
    kinds.*
12. **Ice and fire cancel out.** A frost creature hit by fire takes extra and steams; a fire creature hit by frost is
    dimmed (weaker for a while) instead of frozen. *Pick: maybe; ice things already burn easily.*
13. **Plants catch fire.** Ents, sproutlings and the hay bale don't just burn faster: once burning they set fire to
    the ground they walk on. *Pick: maybe, the Wildwood would get much harder.*
14. **Magic hunters.** A new enemy (or hero) who shrugs off half of every spell's hit but still burns, freezes and
    gets soaked as ever. Mages have to rely on their elements. *Pick: yes, the designer's own example.*
15. **Wet machines short out.** A soaked machine hit by lightning stops for a moment (sparks, a stall). Water heroes
    and storm heroes work together. *Pick: yes, cheap; it already takes more shock when wet.*
