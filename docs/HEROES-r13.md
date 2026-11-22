# Round 13, lane H2: the 37 newer heroes against the showcase 3 answers

The designer's words: `docs/riffle-log/2026-11-22-round12.txt`, deck showcase3. One block per hero, in the log's order:
each note quoted, what was built, and the clip (`clips/showcase5/<hero>-<ability>.mp4`). What was ticked with no note is
left exactly as it was. Ability ids stay the same when a slot gets a new ability (saves keep their bought nodes); the
name, words and behaviour change.
Every new trait has its own clip too, `<hero>-trait.mp4` (the lab's trait bench: a dummy strikes and shoots at the
hero, a friend goes down, a dummy falls, the hero is brought low; a trait can change its bench, kits2.js `show`).

Shared pieces (kits2.js "round 13 (lane H2): shared pieces"): `onUnit` hangs a timed hook on any unit (kits.js
hooksOf reads `u.h2`: one marked line), which is how each new effect below is built, behind one function each:
`whirl`, `dirty`, `targeted`, `tracked`, `trapped`, `spin`, `ward`, `haste`, `rage`, `weaken`; `summon` makes a
summon on the maker's side whose blows are a share of the maker's; `flung` watches a body sent flying (slams into a
wall, ploughs into others). Marked hooks outside the lane: render.js (a buff's or a summon's own wash, a buff's
`border` = protection, `style.flip` mirrors a sprite), fxkit.js (`style.backhand` / `flip` swing the arc the other
way, `style.reach0` where a stab starts), parts.js (`style.backhand` arm, `style.straight` stabs), preview-sim.js
(scenes for the new traits), bestiary.js (names of the new buffs).

## New statuses asked for (for the lead / the statuses lane)
Built as each hero's own effect behind one function in kits2.js, so they can be lifted into statuses.js:
- **Whirled** (Griffon: "makes them take extra knock-back from all sources... Burst effect of whirled will have them
  boosted around randomly 3 times in a short duration"): `whirl()`. Build-up 0-100, drains 12/s; shoves taken x(1 +
  fill); burst: stunned 0.95 s and flung at random three times; 3 s immune after. Look: white wind curls round the
  feet (fx2 `whirled`), a whirlwind at the burst (`whirlBurst`).
- **Dirty** (Digger: "Acts as a 1 time shield but attack speed is slow until it's cleared... immune to poison and fire
  until removed"): `dirty()`.
- **Targeted** (Marksman: "Shows crosshair on them. Movement abilities are limited and they take additional damage.
  Bullets pierce through targeted entities"; the Pirate's Point Blank too): `targeted()`.
- **Tracked** (Falconer: "stops them from going invisible/un targetable, underground. All attacks do additional fixed
  damage to target"): `tracked()`.
- **Trapped** (Trapper: "Target can't turn or move but can't use abilities and attack(straight)"): `trapped()`.
- **Spun** (Monk, unnamed by the designer: "makes entities turn very slowly. Burst effect: makes them walk in the
  direction they are facing for a bit very quickly. Can't attack"): `spin()`.
- **Warded** (Alchemist: "What's a good name for a protection status effect?"): my answer, Warded: `ward()`, a shield
  of N damage shown as a pale blue border (the border means protection).
- **Weakened** (Shade's Blackout: "aura should apply weakness debuff (which needs visual effects)"): `weaken()`, a buff
  (deals 30% less) with a grey wash and grey chevrons sinking off the body.
- **Shackled** (Old Guard's Pommel Strike note: "target can't do basic attacks, ability cooldowns are set back 50%...
  the shackled ability goes to someone else. Maybe the executioner"): not built; it waits for that hero (also the deck
  note's Warden: "uses a lot of shackles and restraints").
- Bleeding, Sleepy, Confused, Fear: the statuses lane's (merged); used through kits.js addStatus.

## The heroes

### Old Guard
- Trait: "Trait should be last stand. When last one in party gets a long unstoppable and haste buff, all abilities are
  reset." -> **Last Stand** (id lastStand): once a room, when the last of his side falls: Unstoppable (its gold border)
  and haste for 10 s, every cooldown reset, a gold burst. Book scene added.
- "Should have a parry ability. The next attack is blocked and deflected back if it was a projectile, melee just go
  back to target. When leveled up gets 2 charges. Maybe instead of pommel strike" -> **Parry** in Pommel Strike's slot
  (id pommelStrike): 4 s on guard (the greatsword drawn across him, a glint running along it); the next blow is caught
  and its force goes back into the striker, the next shot flies back at its shooter. I one, II two, III twice as hard.
  Clip: oldguard-pommelStrike.
- Pommel Strike's note ("Shackled status effect"): goes with the shackled idea to a later hero (above).
- Rally: "Get a haste boost when leveled up. Effect remains for a little bit." -> II: haste (30% faster moves and
  blows) and the whole rally lasts 8 s (was 5). Clip: oldguard-rallyCry.

### Dame
- Leaf sword: "Should swipe the opposite way." -> `style.backhand`: the arm and the arc both go the other way.
  Clip: dame-attack.
- Challenge: "Maybe it is a dash to nearest ally about to die, pushes them away and heals them slightly, the nearest
  enemy is taunted. No challenge status." -> rebuilt: she bounds to the friend nearest death, shoves them clear (gold
  chevrons the way they go), heals them 10% (II 20%), and the nearest enemy (III: all near) must fight her for 4 s (a
  red "!" pops over it). No duel mark. Clip: dame-challenge (the bench pins the friend in place, so the shove itself
  shows only in a real fight).

### Griffon
- Warhammer: "Flip his sprite. Should be an aoe slam on the ground like the berserker" -> `style.flip` mirrors the sprite
  (render.js) and the swing; the blow is a slam on the floor in front (aoe 40) with its own look (fx2 SLAM2.hammer: a
  hammer head coming down, a dent, dust and stone chips; no flail ball). Clip: griffon-attack.
- Swoop: "Should spin after they land making a wind swirl. Applies a new status whirled ... knocks them back ... Applies
  a small aoe burst around area before the dash. They don't have control of it." -> a gust bursts round him at take-off
  (hurts, shoves, whirls 25); he lands spinning, three arms of wind spiral out under the units, and everything within
  125 is hit, shoved hard and whirled 45. Tiers kept (II staggers, III the ally takes 40% less). Clip: griffon-swoop.
- Stormhammer: "Should apply whirled. And have a small aoe burst on all targets hit (when upgraded). Lvl 3 will have it
  home between targets on the way out and back. I don't like the bones ... white puffy clouds when hit. Hammer also needs
  a yellow line on it. And maybe doesnt show in their hand when thrown." -> I: out and back, whirls 35 a hit; II: a
  small thunderclap (55 across, a little shock) round each one hit; III: it flies on to the nearest enemy it hasn't hit,
  out and back. Its burst is white cloud puffs (fx2 IMPACT2D.hammer), the head has a yellow band, and his hammer arm is
  hidden while it is out (kit2Tick sets `u._force`). Clip: griffon-hammerThrow.
- Wing Guard: "Don't like. Anyone that hits him will take heavy knockback (even more when whirled ofc) when upgraded they
  will take damage if they hit an obstacle. Lvl 3 will have them burst when they hit an obstacle"; showcase 4: "can't
  even see the wings ... too sharp ... similar to the ones on his sprite. But bigger and maybe more segments" -> for 4 s
  he takes 25% less and whoever strikes him is blasted back (knock 620, x(1 + whirl fill)); II: slamming into a wall,
  the edge or a pillar hurts them (1.2x his damage); III: they burst there (a thunderclap hurting their friends near).
  The wings: his helm's cream-and-gold, six rounded lobes a side, spread out and wrapped forward. Clip: griffon-wingShield.

### Bulwark
- "Don't like trait. Should be more of a hybrid dps tank" -> **Return Thrust** (id returnThrust): every blow he takes
  winds him up (up to 5; a glint grows on the spear's head); his next thrust lets it go: twice the reach, through
  everything in a line, 30% harder for each, heavier knockback. He trades blows, then hits back hard. Book scene added.
- Winged spear: "Starts too close to them" -> the stab starts out at the spear's head (`style.reach0`). "Holding spear
  too close to tip" is the art (the grip in the SVG): **for the art lane**.
- Brace, Shield Wall, Impale: not ticked and no note: left as they were (balance only). Ask the designer whether the
  hybrid ask means these should change too.

### Bearskin
- Studded club: "The bear paws of his outfit should be on his hands. Move with it. I didn't like this club." -> **art
  lane** (paws on the hands, a new weapon, and the club as its own part so it can be put away). Not done here.
- Maul: "Uses berserkers effect. Even shows the mace ball in the middle." -> its own slam (fx2 SLAM2.maul): the club
  comes down into a crater with a rim, cracks run out, brown dust and chunks; no flail ball. Clip: bearskin-maul.
- Hibernate: "Should give self sleeping status effect. Will heal when sleeping at any time, also needs to take more
  damage than they are healing to wake up. Leveled up will be immune to status effects" -> he falls asleep (the sim's
  sleep, deep so a blow doesn't break it); asleep however it happens (a lullaby, Sleepy) he heals 7% a second; his own
  sleep holds until what he has taken since outweighs what he healed, or he is whole (8 s at most). II: statuses can't
  touch him while asleep. III (kept): he wakes with a roar that throws them back. Clip: bearskin-hibernate.
- Bear Roar: "I want a rapid claw attack. Dashes forwards Does a burst of like 6 swings (club goes away). At max level
  get 6 more, and does a bite at the end that applies bleed" -> **Bear Claws** in its slot (id bearRoar): a dash in,
  six claw rakes (four-streak rakes, alternating sides); II they catch everything in front; III six more and a bite
  (two rows of fangs) that adds 70 bleeding. The club's arm is hidden meanwhile (the art can't hide just the club).
  Clip: bearskin-bearRoar.

### Warhelm
- Warhammer: "Needs to do a slam on the ground" -> a slam on the floor in front (aoe 46), the hammer look (SLAM2.hammer).
  Clip: warhelm-attack.
- Thunder Blow: "Needs its own slam visual. Don't use Beserkerd for everything... Actually change that, does a headbutt
  forwards dealing heavy knockback and stagger." -> a lunge and a headbutt: 1.7x, knock 560, stagger 60 (a white star
  and sparks off the helm). II shocks; III the one thrown knocks down what it hits. Clip: warhelm-thunderBlow.
- War Horn: "Change. Storm born. Hammer float around him rotating dashing to a target in an interval around him. While he
  punches with his fist alternating applying shock and knockback" -> **Storm Born** in its slot (id warHorn): for 6 s
  (II 9 s) the hammer circles him in the air, crackling, darting at the nearest enemy every 0.9 s (1x, shock 25); he
  fights with his fists meanwhile (quick punches, +15 shock, knock 260). III: each dart bursts in a thunderclap. His
  hammer arm is hidden while the hammer flies; "alternating" fists need the hammer as its own part in the art (**art
  lane**): for now one fist punches. Clip: warhelm-warHorn.
- Skull Splitter: "Should throw hammer forward then leap towards it doing a slam. Hammer shocks anything hit." -> the
  hammer is hurled ahead (shock 30 on all it passes, yellow sparks), lies where it fell, he leaps after it and slams
  there (1.9x). II staggers, III wider and stuns. Clip: warhelm-skullSplitter.

### Bandit (REDO)
- "Don't like trait. Overall don't like hero"; Cutlass: "Animation is weird. Doesnt even hit." -> a new kit, my design
  (ids kept for saves; the art is the same: a thief). The idea: he takes things off enemies.
  - Cutlass: reach 22 (was 18) and a wider arc, so the slash reaches what it's swung at. Clip: rogueBandit-attack.
  - Trait **Snatch** (id snatch): every fourth blow tears the enemy's weapon out of its hand and flings it 110-160 away
    (it spins through the air and lies glinting); the enemy can't attack until it walks over and picks it up (5 s at
    most; not bosses). Book scene added.
  - **Bolas** (smokeBomb's slot): a whirling bolas at the enemy furthest off, a shooter first: tripped 1.3 s (KO), then
    slowed. II two bolas; III down 2 s and it drops its weapon. Clip: rogueBandit-smokeBomb.
  - **Dirty Trick** (pickpocket's slot): three quick cuts and a kick (0.7x three times, then 1.2x, knock 640) that
    sends the enemy into its friends (each one it ploughs into is hit). II the cuts bleed; III staggers. Clip:
    rogueBandit-pickpocket.
  - **Stick 'Em Up** (lowBlow's slot): the cutlass levelled at an enemy: hands up (two little hands shaking over its
    head) for 2.5 s: it can't attack, use an ability or walk, and takes 25% more from everyone. II two more near it;
    III 3.5 s. Clip: rogueBandit-lowBlow.
  Three different jobs: catch a runner or shooter, burst one and bowl its friends, shut one down for the party.

### Shade
- Trait: "After 3 seconds of not attacking or taking damage becomes a shadow." -> Fade reworked: after 3 s without
  striking, casting or being hurt she becomes a shadow (ethereal: no enemy can pick her out; drawn dark) until her
  next blow or ability. Book scene: she waits idle first (preview-sim `quiet`).
- Twin daggers: "Should not cross blades. Attacks in 2 stabs at a time, quickly 1 after the other." -> `style.straight`
  (both stab straight ahead) and every attack is two stabs, one from each hand, 0.1 s apart (attack every 0.8 s, was
  0.5). Clip: shade-attack.
- Shadow Walk: "Shadow should be a union. Not overlapping circles. Should not return. Level 3 should have them do 3
  dashes in a row." -> her path is one merged body of shadow smoke on the floor (puddles.js 'smoke'); no return; III
  three runs in a row, each at another enemy. Clip: shade-shadowWalk.
- Blackout: "She should become a shadow at lvl 3. Also aura should apply weakness debuff (which needs visual effects)"
  -> those in the dark are **Weakened** (deal 30% less; a grey wash and grey chevrons sinking off them); III she is a
  shadow for the 6 s. Clip: shade-blackout.
- Death Mark: "Should create shadow clones that fight for them. Very fast and moves through entities and obstacles.
  Deal decent damage and have pretty low hp. They strafe around quickly" -> **Shadow Clones** in its slot (id
  deathMark): 2 (II 3) copies of her, drawn dark, 24 health, each stab 0.55x hers; they circle their foe fast (their own
  brain, straight through bodies, walls and pillars), switching direction now and then. 6 s (III 10 s). Clip:
  shade-deathMark.

### Haymaker
- Pitchfork: "Should show 3 stab slashes. Should dash forwards slightly too" -> weapon 'fork': three parallel tine
  streaks (fxkit, marked); each jab is a little lunge forward. Clip: haymaker-attack (the bench pins him, so the lunge
  shows in a real fight).
- Toss: "Should toss enemy backwards. Needs better animation" -> forked up and thrown high (95 up, drawn bigger as it
  rises) over his shoulder, turning head over heels, straw puffing off it, landing hard 150 behind him. Clip: haymaker-toss.
- Fork Charge: "Doesnt show it off. Different idea. Summons a large hay bail underneath them, walks on it dealing high
  knockback and damage to those he walks over. Slow turn radius, but flips instantly when he hits a wall. It has its own
  go that decays overtime, burns easily. When it dies it burst into hay" -> **Hay Bale** in its slot (id forkCharge):
  a bale summon (its own health, running down over 5 s, II 7 s; burns three times as easily) that he rides on top of;
  it rolls at the nearest enemy turning slowly (1.3 rad/s), turns straight round off a wall, the edge or a pillar;
  whoever it rolls over takes 1.5x and is thrown aside (knock 520; III staggers). When it goes it bursts into hay that
  slows those round it, and he drops off. Drawn in code (fx2 LOOK2.haybale: a round bale across its way, bands rolling).
  Clip: haymaker-forkCharge.
- Pitch Hay: not ticked, no note: unchanged.

### Digger
- Trait: "Rub some dirt in it. Every ability he uses applies a dirty effect to him.. Acts as a 1 time shield but attack
  speed is slow until it's cleared. Basic attack doesnt apply it. Makes him immune to poison and fire until removed." ->
  **Rub Some Dirt In It** (id dirtIn): each ability he uses puts **Dirty** on him (brown smears, crumbs falling): it
  soaks up the next blow entirely and is gone; until then he swings 30% slower and burn and poison can't take (both are
  washed off). Book scene added.
- Spade: "Slash also creates 3 dirt projectiles with short range." -> every swing throws three clods in a fan (0.25x
  each, short range), bursting in crumbs. Clip: digger-attack.
- Dirt Fling: "Doesnt look great. Does it knock out? Is so knock out doesnt have a visual effect. If done to ally removes
  some effects like burn and poison. Applies dirty to them" -> inked clods arcing out in a fan with dust; friends in the
  fan are cleaned of burn and poison and get Dirty (he aims it at a burning or poisoned friend when one is near). The
  knock-out from stagger (II) now has a look for everyone: stars going round the head while knocked out (fx-status.js,
  marked). Clip: digger-dirtFling.
- Burrow: "Don't like the dirt mound. Trail should also linger. It just vanishes. Overall improve visual. It will be used
  by more than just him. Don't like burst" -> `burrowTo()` (exported, for anyone): no mound; the churned earth behind
  him is one merged earth body that lingers 1.6 s then fades; he goes down and comes up in sprays of clods and dust; the
  ring burst is gone (the blow is still there). Clip: digger-burrow.
- Spade Bat: "Burry. Slams shovel down in an aoe in front of him. Anyone hit will be pushed into the ground for a short
  duration. They can't move or be hit" -> **Bury** in its slot (id spadeBat): the spade slammed flat in front (an earth
  splash, its own look), 1.6x to all within 64 (III 80); each is driven into the ground (hidden, can't move, act or be
  hit) for 1.5 s (II 2.2 s), shown as a twitching mound, and digs out in a spray of earth (III staggered). Bosses are
  only stunned. Clip: digger-spadeBat.

### Grandpa Sickle
- Bread Toss: "Doesnt look the best overall" -> a bigger golden loaf, scored on top, steam curling off it, lobbed high
  on an arc with its shadow below (fx2 `lobUp`, used by every lobbed thing now); where it lands a warm glow, steam
  and crumbs. Clip: grandpa-breadToss.
- Harvest: "Dashes to ally when he does it." -> he hurries (a quick bound) to the friend most beset and sweeps there;
  with nobody in trouble he sweeps where he stands. Clip: grandpa-harvest.
- Old Tales: "What does it do? Doesnt look the best" -> it says it now: an old story book opens over his head with its
  pages turning; over each friend listening a gold clock whose hand spins forward and "-2s" (II "-3s") rising: every
  ability of theirs comes round that much sooner (III heals them 8%). Clip: grandpa-oldTales.

### Alchemist
- Unstable flask: "Bottle in hand should change to what she will throw" -> a flask in the next brew's colour is drawn
  over the one in the art's hand (fire, frost, acid in turn). Clip: alchemist-attack. (A cleaner fix is the art lane
  giving the bottle its own part.)
- Acid Flask: "Bad. Is just the plague doctors. Throws 2 lingering pools of liquid in a spread. Has 6 possible ones they
  can choose. Acid Cold Fire Whirling Shocking Water. Make look better." -> **Brew Pools** (id acidFlask): two flasks
  (II three) arc out in a spread; each bursts into a pool of a random one of six: acid (eats at them, +15% taken),
  cold (chill), fire (a real fire patch: burns), whirling (whirls them and spins them round its middle), shocking
  (shock, sparks crackling), water (a real water patch: soaks). Pools are merged ground bodies with what stands in them
  (bubbles, ice shards, wind spirals, sparks, ripples). III bigger, 5 s. Clip: alchemist-acidFlask.
- Elixir: "Gives 1 of 3 buffs. Haste/rage, Cleanse and heal, Or swiftness and temporary shield. (Like 30 negate). What's
  a good name for a protection status effect? Make look better" -> she lobs it to the friend who needs it most and picks
  the brew: cleansed and healed 14% (II 22%) if hurt or afflicted; **Warded** (a shield soaking 30, II 45: the pale blue
  border) and swift if being hit; hasted and enraged (+25%, II +35% damage) if fighting fine. The splash bursts in its
  colour and its sign rises (a cross, a shield, a bolt). III splashes friends near. Clip: alchemist-elixir.
- Bang Flask: "They drink 4 an unstable concoction becoming a monstrosity. Bigger fast, rapid melee attacks. Drains hp
  quickly when in form but are immune to damage and status effect, takes less knockback. Will leave form when they lose
  33% of their max hp over 8 seconds. Attacks deal ANY status effect each hit at max level. Also gets a dash when in this
  form." -> **Monstrosity** (id bangFlask): 8 s as a monster: 1.35x her size, 25% faster, a melee clawer (a blow every
  0.38 s) with a lunge (the sim's dash), nothing hurts her or puts a status on her, three times as heavy to shove, while
  a third of her health drains away; green wash and boiling bubbles. II her blows +25%; III every blow puts a random
  status on what it hits. Clip: alchemist-bangFlask.

### Shaman
- Spirit bolt: "Jumps to ally if they are near and heals them. Otherwise no heal" -> it strikes; if a hurt friend is
  within 170 of what it struck, a spirit leaps on from there to that friend and mends it (0.6x of the bolt); else no
  heal. Clip: shaman-attack (no friend on the bench: the leap shows in a real fight and in the Book).
- Healing Totem: "Not good overall. Doesn't even match the one on his back… Should throw to ally, In an arc. Has 100 hp.
  Any ally in its radius that takes damage will go to it instead. At lvl 3 cleanse status effects too. It has its own hit
  box. Damage directly to it is 50%" -> a winged totem drawn like his (carved pole, stacked faces, teal wings, his
  orange bands), thrown on an arc to the friend under the most attack; a summon with 100 health and its own body; every
  blow on a friend within 115 lands on the totem instead (a teal streak from the friend to it); blows on it do half;
  it still mends those near a little. 8 s (II 12 s); III it cleans statuses off them every 1.5 s. Clip: shaman-healTotem.
- Spirit Link: "Show underneath. Give outline. Can link to totem" -> inked teal threads on the floor under the units,
  beads running along them; his totem joins the link. Clip: shaman-spiritLink.
- Rain Dance: "Don't like. Doesnt look good. Make ancestors call. Summons a light blue bear, eagle, wolf, and beaver.
  Eagle, follows ally healing them. Wolf, works like current wolf. Bear, melee. Negates all damage around him by 20%.
  Beaver. Spins and shoots out 3 homing orbs." -> **Ancestors' Call** (id rainDance): four light-blue spirits rise out
  of the floor: a bear (melee; friends within 120 of it take 20% less), a wolf (the Druid's wolf, washed light blue),
  an eagle (flies over the most hurt friend, mending it), a beaver (sits by him; every 2 s it spins and shoots three
  homing spirit orbs). 8 s (II 12 s); III half as strong again. The bear, eagle and beaver are drawn in code (fx2 LOOK2):
  **art lane** may want to draw them properly. Clip: shaman-rainDance.

### Witch
- Hex bolt: "Shoots 3 hexs in quick succession. Have each one look like 1 of 5 possible symbols." -> three hexes 0.1 s
  apart (0.4x each), each a sign at random: a moon, a star, an eye, a spiral or a skull. Clip: witch-attack.
- Hex: "Does not look good at all... Needs unique visual not the leach. Frogs should hop around randomly." -> a hex
  shot; where it lands a puff of green smoke, the enemy's body is hidden and a frog is drawn in its place (squat green
  body, big eyes, back legs kicking on each hop); it hops about at random, can't attack, takes 50% more. Clip: witch-frogHex.
- Cursed Brew: "Doesnt look good. Pot should deal knockback and have a hit box and hp." -> the cauldron (black iron,
  green brew bubbling, a fire under it) is a summon with 60 health and its own body; it lands with a blow (1.2x, knock
  380, a little curse) and stands 6 s while purple fumes curse whatever breathes them. Clip: witch-cursedBrew.
- Broom Ride: "Should fly above everything for a bit. Circling around. Dropping hex bombs below it. Doesnt look like
  they are ridding it. Not targetable when flying" -> she rises high on the broom (drawn under her body, the handle out
  in front, the bristles behind, wind lines), circles the enemies for 2.5 s (III 3.5 s) dropping hex bombs (0.9x, a
  little curse; II more often); nothing can pick her out while she flies. Clip: witch-broomRide.

### Warlock (IDK)
- Trait: "Has a small imp always with him. Follows closely. If it dies it will respawn after a short cooldown." ->
  **Familiar** (id familiar): an imp summon (the Ember Deep's imp art) darts round his shoulder and throws little eye
  bolts at what he fights; if it falls another climbs out of the floor 8 s later. Book scene added.
- Pact bolt: "Should return back to him. Make look like the eye on his sceptre. Make the imp shoot a smaller version."
  -> a magenta eye with a gold lid and a flame tail; it flies out through up to three enemies and comes back to his
  hand, hitting on the way back (0.8x out, 0.48x back); a third heals him. The imp's are the same, smaller. Clip:
  warlock-attack.
- Eldritch Beam: "Doesnt look good. Should deal kb. At the end it should burst. No second ray. Ray should come from imp."
  -> a writhing ray (inked core, glow, thicker as it heats) from his imp (from him if the imp is gone), shoving the
  target back every tick; after 2.5 s it bursts (1.6x round it). The second ray is gone (III: a bigger burst). Clip:
  warlock-eldritchBeam.
- Summon Imp: "Change to awaken. Imp enters his body turning him into a stronger version of himself. Becomes melee with a
  large demonic sword, can teleport and does a large melee swing that explodes on hit targets, can spit fireballs. Kills
  resets duration in form." -> **Awaken** (id summonImp): the imp streaks into him; for 8 s (II 11 s) he is melee with a
  big black-and-red blade (drawn in his hand, swung with it), 1.7x blows in a wide arc that explode on what they hit,
  a blink to his foe every 2.6 s, fireballs at those further off; every kill starts the time again; a dark red wash and
  embers. III bigger explosions that burn. A real demon sprite would be **art lane**. Clip: warlock-summonImp.
- Dark Bargain: "Gives 20% of his max hp go to his imp. Gets a huge attack speed boost for both of them and attack does
  aoe." -> a fifth of his health flows into the imp (blood drops between them); both strike 1.8x as fast for 6 s (II 8 s)
  and every blow bursts round what it hits. III the imp grows on the blood (more health). Clip: warlock-darkBargain.

### Cultist
- Trait: "Don't like trait. Should heal when they trigger a blood burst" -> **Blood Rite** (id bloodRite): every bleeding
  he started that bursts (the statuses lane's haemorrhage) heals him 8% (blood drops flow back to him).
- Shadow bolt: "Does a dagger swipe when close, and shadow bolt when far. Dagger applies bleed. If the bolt hits a
  bleeding target they instantly burst." -> within 34 a dagger swipe (1.1x, 26 bleeding); further, a violet bolt; a bolt
  on anything bleeding bursts it at once. Clip: cultist-attack.
- Blood Pact: "Meh. Applies bleed to self to give everyone becomes enraged." -> he cuts himself (45 bleeding on him) and
  his friends near are enraged (Rage: +30% damage, II +40%, quicker blows; III lifesteal). Clip: cultist-bloodPact.
- Ritual Circle: "They can't leave circle. At max level. Applied bleed instead." -> it bleeds what stands in it (13 every
  0.3 s) instead of cursing; III nothing caught inside can step out (held at its edge). Clip: cultist-ritualCircle.
- Soul Candle: "Sacrifice. Dashes at enemy on low hp. Instantly kills them and heals. At lvl 3 spins and applies bleed to
  everyone near." -> **Sacrifice** (id soulCandle): a bound at an enemy below 25% (II 35%) and the dagger finishes it
  (a boss, major or mini-boss is cut deep instead: 4x); he heals 15%; III he spins as he lands, blood flung out, 50
  bleeding on everything near. Clip: cultist-soulCandle.

### Monk
- "For traits you should also show them off" -> every new or kept trait gets a clip: `trait` clips (lab.js
  `ab=trait`), Deflect included (see the end of this file).
- Fists: "Different visual. High knockback" -> weapon 'palm': a soft burst of force where the fist lands (fxkit,
  marked), knockback 240 (was 60). Clip: monk-attack.
- Flurry: "Better visual. Looks too sharp. Moves forward while doing it." -> soft round bursts of force (no streaks) and
  he steps in with every punch. Clip: monk-flurry.
- Palm Strike: "Better visual. Should hit everyone in range. Everyone is spun around to face away. Adds New status effect
  that makes entities turn very slowly. Burst effect: makes them walk in the direction they are facing for a bit very
  quickly. Can't attack." -> everything within reach round him (110 at III) is struck (1.3x, knock 380), turned to face
  away from him and **Spun** 45 (III 60): turns very slowly as it builds; at 100 it marches off the way it faces, fast,
  for 1.2 s and can't attack. Looks: a wall of force rolling out, a gold palm print on each one hit, a slow gold spiral
  over a spun head. Clip: monk-palmStrike.
- Inner Peace: "Put hands together. Heals himself. All projectiles are deflected back. And melee attack will have them
  launched backwards. Lvl 3 heals with an aura around him and clears negative effects. Lvl 2 is a longer duration" -> he
  sits with his palms pressed together (both arms forced in, parts pose); cleansed, heals 15% over it; every shot
  reaching him flies back at its shooter; whoever strikes him is thrown far back (knock 640). 2.5 s (was 2), II 4 s; III
  a warm glow round him heals friends within 150 and clears their statuses. Clip: monk-innerPeace.

### Seer (IDK)
- "Overall not too exciting/ interesting. Maybe an ability that blinds everyone around her. Or making it so enemies
  attacks can accidentally hit each other friendly fire on." -> both: **Blinding Flash** in Premonition's slot (its
  note was "Meh"; id premonition): her crystal flares, everything within 160 is struck (0.8x) and blinded 2.5 s (II
  3.5 s; III radiance too), shards of light flung out, a bar of light over their eyes. **Ill Omen** in Starfall's slot
  (not ticked, no note; id starfall): a dark star hangs over the enemies 5 s: every blow one of them lands also lands
  (0.8x) on a friend of theirs near ("!?" pops over it), and they grow Confused (the statuses lane's). Clips:
  seer-premonition, seer-starfall (the bench's dummies don't fight, so the stray blows show in real fights).
- Foresight: "Better visual." -> a great violet eye opens over the marked one, lashes of light round it and three pale
  beams pinning it, a glow under it. Clip: seer-foresight.
- Premonition: "Meh." -> replaced (above).

### Chef
- Frying pan: "Should be ranged. Throws random foods. All same effect. Hurts enemies, heals allies" -> **Food toss**: he is
  ranged now (range 200; a shooter's moves), throwing one of six foods drawn in code (an apple, a drumstick, a pie,
  cheese, a roll, a fish): it hurts the enemy it hits and mends any friend it passes over (0.6x). Clip: chef-attack.
- Hot Meal: "Doesnt look good. Should throw food pick ups randomly around dungeon to be picked up. If at full hp will get
  over health." -> plates thrown on arcs to random spots round the party (two, II three), each a steaming plate of one
  of the six foods; a friend who walks over one eats it: heals 25%, and what goes past full health becomes extra
  health (a Warded shield); hurt friends with no enemy on them walk over to one. III kept (+20% damage 8 s). Clip:
  chef-hotMeal.
- Food Fight: "Stops any movement abilities from anyone hit and applies a slight slow." -> pies go first at whatever is
  dashing, leaping or charging and stop it dead ("STOPPED"), and slow 20% for 3 s. Clip: chef-foodFight.
- Grease Fire: ticked, unchanged.

### Beekeeper (REDO)
- "Overall don't like. Visuals or abilities or animations." -> a new kit (ids kept), my design: the keeper calms the
  enemy with smoke, sets a hive on them and keeps his friends sweet; his bees pester. The bees are redrawn small with
  one striped body and a head (the art round's note: "1 maybe 2 body segments").
  - Bee (attack): a bee stings and then keeps buzzing round its foe, stinging again every 0.7 s for 3 s (more bees
    pile on). Clip: beekeeper-attack.
  - Trait **Pollen** (id pollen): every sixth sting of his bees mends the friend most hurt near him 5%.
  - **Smoker** (swarm's slot): a cone of thick white smoke rolls out for 2 s: those in it grow Sleepy (the statuses
    lane's; they drop off if it builds) and slowed; III they swing slower too. Clip: beekeeper-swarm.
  - **Beehive** (honeyPot's slot): a straw skep thrown among the enemies (70 health) for 8 s (II 12 s): a bee streams out
    at something near every 0.7 s; whoever strikes the hive is mobbed by three; III its bees pester. Clip:
    beekeeper-honeyPot.
  - **Honey Glaze** (royalJelly's slot): honey drizzled over the friend under the most attack: it heals 16% over 4 s (II
    25%) and whatever strikes it gets stuck (entangle, slowed); III two friends. Clip: beekeeper-royalJelly.

### Quartermaster (REDO)
- "Overall don't like. Visuals or abilities. Giving out hp potions is very strong. Needs to be more unique" -> a new kit
  (ids kept), my design: the man with the pack. No potions any more. `gatherer: true` and the wagon sentence are kept.
  - Pack toss (attack): one of five things off the pack (a pot, a pan, a boot, a tin cup, a ladle), knock 90.
  - Trait **Requisition** (id requisition): every 20 s he tosses a piece of kit to the friend nearest the fight, for
    12 s: a whetstone (+20% damage), a buckler (a 25 shield, Warded) or boots (+25% speed), shown over its head.
  - **Supply Crate** (resupply's slot): a crate (red cross on it) dropped by the friend whose abilities are furthest off;
    each friend's first touch brings its abilities 4 s sooner (II 6 s; a gold clock shows it) and patches it 5%;
    friends with abilities waiting walk over to it. III two crates. Clip: quartermaster-resupply.
  - **Barricade** (oilBlades's slot): a wooden barricade unfolded between the party and the enemies: a summon that blocks
    their way and their shots (110 health 10 s; II 160, 14 s; III spikes hurt whatever strikes it). Clip:
    quartermaster-oilBlades.
  - **Pot Helmet** (flare's slot): a big pot lands upside down over an enemy's head ("CLONG"): blinded and Confused 3 s;
    II staggers; III bounces on to a second head. Clip: quartermaster-flare.

### Crossbowman
- "If enemies have armour as well his attacks ignore them." -> Armour Piercing also puts back what armour would take
  off (kept: +25% on elites, majors, bosses).
- Heavy bolt: "Needs better animation. Remove tail from arrow" -> a thick bolt with a steel head and short fletching, no
  trail; the string snaps (white lines off his front) and he rocks back. Clip: crossbowman-attack.
- Pavise: "Better visual. Doesnt look like he's shooting through it. It has its own hp. At lvl 3 he places 3 in a row
  slight titles to surround him. Allies can attack through it. Enemies can't" -> the pavise is its own thing (a summon,
  60 health): a tall painted plank on a prop planted in front; his side's shots pass it, the enemy's stop on it. 7 s
  (II 10 s and he reloads 35% faster near it); III three in a slanted row round him. Clip: crossbowman-pavise.
- Pinning Bolt: "Heavy bolt, hits an enemy, then makes them fly backwards into a wall stunning them in place for a bit.
  Does heavy damage. Enemy being flung does heavy kb to anyone it hits as they fly" -> 2.2x and flung backwards (knock
  1100) with the bolt in it; whatever it ploughs into takes 0.9x and is hurled aside; slamming into a wall it is pinned
  ("PINNED", stunned 1.8 s, III 2.5 s; II the slam staggers). Clip: crossbowman-pinBolt.
- Crank Up: "Bomb at the end. Not fire themed. Staggering. Better visual" -> a gear spins hard at his crossbow, clicks
  flying; his charged bolts burst in grey smoke and iron (not fire), staggering. Clip: crossbowman-crankUp.

### Falconer (IDK)
- "Different trait." -> **Hunting Partner** (id huntingPartner): every fourth knife the falcon goes out with it, rakes the
  foe and marks it Tracked for 2 s.
- Throwing knife: "Better visual" -> a broad blade turning end over end, a glint, a short trail (gold under Keen Eye).
- Loose the Falcon: "Doesnt look good. Falcon should leave hand. Should show a crosshair on target tracked, stops them from
  going invisible/un targetable, underground. All attacks do additional fixed damage to target"; showcase 4: "Make the
  falcon that flies look like the one he was holding" -> the falcon leaves his fist (hidden from his arm while out),
  drawn as his slate-grey falcon with its pale chest; it marks the furthest enemy (an elite first) **Tracked** for 6 s:
  an amber crosshair; it can't go invisible, untouchable or underground; every blow from his side on it lands harder by
  a fixed amount. II blinded; III a second enemy. Clip: falconer-looseFalcon.
- Keen Eye: "Don't like eye." -> no eye: gold motes circle his throwing hand and his knives glint gold. Clip: falconer-keenEye.
- Call the Flock: "Not good. Should become a flock of birds for a bit. Birds don't look good" -> he scatters into a
  flock of nine small grey birds (redrawn: bodies and beating wing strokes) for 2.2 s (III 3 s): nothing can touch him
  while it wheels through the enemies pecking (0.6x each, slowed; II blinded), then he is himself again. Clip: falconer-flock.

### Grenadier
- "Needs different trait. That's just what his bombs do." -> **Powder Keg** (id powderKeg): whatever he kills blows up a
  moment later (0.9x, staggering, 64 across): a blast sets off the next through a pack.
- Bomb: "Not fire themed. Stagger. Looks good. Make sure shadow style matches" -> every blast of his is grey smoke and
  iron bits with a scorch on the floor (no flames), and staggers; the bomb in flight arcs with a soft round shadow under
  it, like the units'. Clip: grenadier-attack.
- Big Bomb: "Secondary bombs don't look good. Big bomb should be an entity with a small health pool. Explodes if it is
  broken or after 2 seconds of landing" -> it lands as a summon (30 health), a great iron ball swelling as its fuse
  burns down; it goes off 2 s after landing or the moment it is broken; III's four small bombs arc out as proper bombs.
  Clip: grenadier-bigBomb.
- Sticky Bomb: "Doesnt look very sticky" -> a splat of green goo holds the bomb on, strands dripping, the bomb jiggling
  faster as it nears; the goo slows it a little. Clip: grenadier-stickyBomb.
- Blast Off: "Explosion effect should happen underneath him" -> the blast is drawn on the floor under him. Clip:
  grenadier-blastOff.

### Harpooner
- Harpoon: "Rope needs an outline. Render underneath him. Target pulled forwards a bit and then it returns. Harpoon should
  look like the one he is holding" -> a wooden-shafted barbed harpoon on an inked rope drawn on the floor under the
  units; it tugs the enemy a little way towards him and is hauled back to his hand. Clip: harpooner-attack.
- Reel In: "Make harpoon render stuck in them. Rope underneath" -> the harpoon stays drawn stuck in them, the rope on the
  floor. Clip: harpooner-reelIn.
- Rogue Wave: "Give better visual. Closer targets are launched further and take more damage. They get hit before the wave
  even reaches them" -> a curling inked wave crest with foam rolls out (420/s); each enemy is struck when the crest
  reaches it, 0.9x-2x and knock 220-640 by how close it stood. Clip: harpooner-rogueWave.
- Drop Anchor: "Make anchor look better. Have it jump from him to targets position. Make it look bigger. Improve visuals"
  -> a big iron anchor heaved off him, arcing high over to the spot on its chain (its shadow racing in), crashing down
  in a crater of dust (2.8x, stunned 1.2 s). Clip: harpooner-anchorDrop.

### Javelin Huntress
- Javelin: "Make look better. Throw particles. Every third attack throws a razer javalin applying bleed" -> a longer
  javelin with a leaf head, dust off her hand as it goes; every third a serrated razor javelin (1.2x, 45 bleeding).
- Running Throw: "Description doesn't match what I see. Give a spear lunge attack. Pierce through targets. 2 charges at
  lvl 3" -> **Spear Lunge** (id runningThrow): she lunges straight through a line of enemies (1.6x each); II staggers; III
  two charges (the second straight after). Clip: huntress-runningThrow.
- Bound: "Make javalin bigger and hit harder" -> a 1.45x-size javelin, 2.1x (was 1.3x). Clip: huntress-bound.
- Prey: "Don't like" -> **Javelin Rain** (id prey; my design): three javelins (III five) hurled high come down on the
  enemies round her target (1.5x each, II staggers) and stand where they landed. Clip: huntress-prey.

### Marksman
- "Don't like trait. Gets additional damage when target is near max range. Should have very long range." -> **Long
  Shot** (id longShot): 40% more reach; shots hit up to 60% harder the nearer the edge of it.
- Musket: "More impact." -> a bigger flash and rolling gun smoke, a kick back, a little screen shake, knock 220.
- Aimed Shot: "Applied target effect. Shows crosshair on them. Movement abilities are limited and they take additional
  damage. Bullets pierce through targeted entities" -> it leaves its target **Targeted** 6 s (a red crosshair): takes
  20% more, its dashes, leaps and charges go 40% as far, and his bullets go on through it.
- Bayonet: "Improve" -> a lunge with a long steel thrust streak, a heavy shove (knock 520), a flash where it lands;
  1.2x (was 0.8x).
- Ricochet: "Only bounces between targets within already 75 degrees of last target. Can't turn 180 degrees. Lvl 3 makes it
  so it does more damage to each consecutive target." -> it only glances on to an enemy within 75 degrees of the way it
  was going; III each bounce x1.3 (else x0.9). Clips: marksman-attack, -aimedShot, -bayonet, -ricochet.

### Ninja
- Shuriken: "Animations is off. Flickers. Should throw 1 then 2 at a time, then 3 at a time on repeat" -> 1, 2, 3, 1,
  2, 3... in a small fan (0.62x each).
- Shuriken Fan: "Not good" -> **Kunai Rain** (id shurikenFan; my design): she springs up and flings a ring of eight kunai
  (II twelve) all round her (1.3x each; III poison).
- Substitution: "doesnt show this happening. Good idea though" -> it shows: "POOF", a puff of smoke, a big log tumbling
  where she stood, a streak of smoke to where she comes out 130 away; it answers any blow (12 s; III 7 s).
- Caltrops: "Doesnt look good. Should be shown spreading around her. Each one does slight damage and stagger" -> nine
  (II fourteen) inked iron caltrops flung out round her on little arcs; each bites the first foot on it once (0.55x,
  stagger 28; III poison). Clips: ninja-attack, -shurikenFan, -substitution, -caltrops.

### Pirate
- "Trait: Enemies have a chance to drop more coins when he is in the party" -> **Plunder** (id plunder): with her in the
  party, one enemy in three that falls anywhere spills extra coins (not in battles). `gatherer: true` and the wagon
  sentence are kept.
- Cutlass: "Swing other way" -> `style.backhand`.
- Point Blank: "Doesnt look great but yea. Should apply targeted" -> a big flash and rolling smoke; it is left Targeted 5 s.
- Grog: "Not good implementation. Lvl 3 throws 1 to ally" -> she stops, tips the bottle to her mouth (the arm forced up,
  the bottle drawn), heals 25% and sways tipsy (bubbles over her) while it works; III she lobs a bottle to a hurt friend.
- Broadside: "They should come in from an arc off the screen" -> each ball comes in high from the edge of the room on a
  long arc, its shadow racing in, a red ring warning where it lands. Clips: pirate-attack, -pointBlank, -grog, -broadside.

### Slinger
- Sling: "Bone particles bad. Has a 25% chance to throw a large stone which staggers. Up close he hits with cane" -> stones
  burst in grit and pebbles; one in four is a big stone (1.4x, stagger 35); within reach he cracks them with the crook.
- Stunning Stone: "Not good. Don't like how it is done." -> the sling whirled over his head, then a big stone lobbed
  high that comes down on the head: BONK, stones scattering, stunned 0.9 s (II 1.3 s; III bounces to a second head).
- Ram: "Concept good. Execution poor" -> the ram redrawn (a woolly body of curls, dark face, curled horns, legs pounding,
  bounding, dust behind); it bowls through the line (1.5x, knock 460, tufts of wool). III two rams.
- Gravel: "Not good. Needs ability that applied sleep" -> **Counting Sheep** (id gravel): little sheep come bounding over
  the enemies round a spot one after another, a number over each; every jump adds Sleepy (the statuses lane's) until
  they drop off. II eight sheep; III each counts for more. Clips: slinger-attack, -stunStone, -ramCharge, -gravel.

### Trapper
- Short rifle: "I want them to have a shotgun. Should hold with 2 hands. Trap sits on their back hip. Behind shoulder.
  Short range. Many pellets (each one is a projectile)" -> **Shotgun**: reach 180 (was 250), six pellet shots in a
  spread. The two-handed hold and the trap on his hip are the **art lane's**.
- Jaw Trap: "That doesnt look like what he is holding. Applies trapped. Target can't turn or move but can't use abilities
  and attack(straight). A trap shouldn't steal from another trap that is active." -> a steel jaw trap (toothed half rings,
  a pan, a chain to a stake) that snaps shut; what it catches is **Trapped**; a trap ignores anything already trapped.
- Weighted Net: "Don't like at all" -> **Double Barrel** (id snareNet; my design): both barrels: twelve heavy pellets in a
  wide cone, he rocks back; II staggers; III those close are knocked down.
- Tripwire: "Don't like. Need ability that turns them into a bush. Enemies quickly lose aggro on him. Used to get away.
  Healing slightly (rejuvenation)" -> **Bush** (id tripwire): a leafy bush that creeps away from the enemies near; no
  enemy can pick him out; heals 2.5% a second (III 4%); 3.5 s (II 5 s). Clips: trapper-attack, -jawTrap, -snareNet, -tripwire.

### Gladiator
- "Trait should make him stronger 1 on 1" -> **Duelist** (id duelist): while no enemy but the one he fights is on him,
  he hits it 35% harder and takes 25% less from it.
- Gladius: "Does a slash, stab on repeat" -> slash, stab, slash, stab (his blow's look and arc swap after each).
- Net Throw: "Nope. Shoukd throw a large piercing spear. Ares spear" -> **Spear of Ares** (id netThrow): a great bronze
  spear trailing red-gold through the whole line (2.1x); II staggers; III nails the last one.
- Showboat: "Should make a ring that pushes out allies and any enemy more than 1. Projectiles are blocked. 1 on 1 battle"
  -> **Arena** (id showboat): a ring drawn in the sand round him and his foe for 5 s: everyone else is pushed out and
  kept out, no shot can cross it, the foe must fight him; II heals 15%; III blows on him answered.
- Shield Rush: "Make very long. Grab first target hit and drags them along with him. Slams at end of dash that staggers"
  -> a 0.62 s rush; the first one it meets is carried on the shield and slammed down at the end (2x, stagger 60; III
  stunned). Clips: gladiator-attack, -netThrow, -showboat, -shieldRush.

### Jester
- "25% of simple melee hits that should hit him flips target around instead" -> Pratfall: a quarter of the blows swung at
  him miss and the swinger is spun to face away ("FLIP").
- Marotte: "Could be more interesting. Maybe can apply random status effect?" -> each bonk leaves 16 of a random status.
- Mock: "Swap places with ally boosting them. Or with enemy confusing them." -> **Swap** (id mock): confetti, and he
  trades places with a friend in trouble (hasted, a shield) or else an enemy (a shooter first; Confused; III stunned).
- Befuddle: "Instead of taking damage will teleport behind target and kick them forwards confusing them." -> it answers a
  blow now: he is behind the swinger and boots it forward ("KICK", Confused); every 10 s (II 8 s, III 6 s).
- Juggling Act: "Different particles effects. Should pierce and bounce a few times. Not from target to target. Just off
  walls. Lvl 3 will teleport hit target to next wall the ball hits" -> balls thrown straight, through whatever they meet,
  bouncing off the room's edge, walls and pillars three times with confetti; III the first one a ball hits is whisked
  to where it next bounces. Clips: jester-attack, -mock, -befuddle, -juggle.

### Samurai
- "Does percentage damage + a base." -> **Keen Edge** (id keenEdge): every blow also takes 3% of its target's greatest
  health (a boss 1%).
- Katana: "Should dash forwards. Should hold with 2 hands in front of him" -> each cut steps in (a lunge). The two-handed
  hold is the **art lane's** (the katana is drawn in one hand).
- Iaido: "Done poorly. Instant teleport in a straight line towards enemies. Targets are staggered for a split second then
  take 10% of their max hp in damage. Lvl 3 has them do it 2 times. Make look good. Charge up before dash/teleport" -> he
  settles 0.35 s (light gathering on the half-drawn blade, a dark line on the floor ahead), then is on the far side of
  the enemies in his line; the cut hangs in the air; each one passed through is stopped and staggered, and 0.3 s later
  takes 10% of its health and 1x more (a boss 3%). III back through again.
- Focus: "Don't like. When focusing will deflect 1 melee or ranged attack every 1 second. After a successful block next
  attack will deal 40% more damage." -> for 5 s (II 7 s, III 9 s) one blow a second is turned aside, and each makes his
  next cut 40% harder.
- Crescent Cut: "Will dash towards target and deal a heavy slash to them 10% of max hp + 20 damage. lvl 3 If it kills it
  will trigger again." -> a dart in and a heavy white crescent: 10% of its health and 1.4x more (about 20 at base); II
  staggers; III a kill sends him on to the next. Clips: samurai-attack, -iaido, -focus, -crescentCut.

### Valkyrie
- "Heals themselves and ally passively when near ally. Has a glowing aura. Is more of a support." -> role **support**;
  **Light of Valhalla** (id valhalla): while a friend is within 140, she and those friends heal 0.9% a second; a soft
  gold glow on the floor under her (no ring); she still revives twice as fast.
- Spear: "Hold spear better" -> **art lane** (the grip in the SVG).
- Valkyrie's Call: "Flies to recently fallen ally, revives them and knocks all targets back and applies radiance. Lvl 3 has
  her grab ally and flies them both to another safer position." -> she flies to the fallen friend, it gets up (25%, II
  40%) in a burst of light: enemies within 140 are thrown back and made radiant (40); III she takes it up and flies the
  two of them 190 away from the enemies.
- Spear of the Sky: "Dash from current position all the way to most hurt allies position hitting anyone in the way.
  Cleanses ally and buffs them." -> she flies spear-first to the friend most hurt, striking every enemy on the way
  (1.5x; II shock), and cleanses and steels it (hasted, a shield of 28; III 45).
- Sky Dive: "Flies in air for a moment then lands by ally. Applied radiance." -> up on her wings 0.9 s, down beside the
  friend most beset: a burst of light, 1.6x and 35 radiance round her; II staggers; III heals 15%.
  Clips: valkyrie-valkyrieCall, -spearThrow, -skyDive.

### Engineer
- "Trait doesnt make sense. Overclock. If all abilities are used up 1 random ability will come back faster. Boosted rate"
  -> **Overclock** (id overclock): when none of her abilities is ready, one at random comes round three times as fast;
  gears spin over her.
- Wrench: "Hits she. Close. Throw bouncing cogs from afar" -> she is a shooter now (role ranged, reach 190: she keeps
  her distance like the Slinger); the wrench when an enemy is on her, else a cog that bounces on to a second enemy.
- Deploy Turret: "Make summoning better. Should throw them into their spot. Turrets should shoot in rapid bursts of 5. Make
  barrel swap between showing 2 and 1 (with 2 dark barrels below) to look like it's spinning. They should turn slowly.
  Should summon them in random positions." -> thrown on arcs to random spots round her; they turn slowly (1.6 rad/s) and
  fire bursts of five; while firing the barrels drawn over the art swap two / one over two dark ones.
- Tinker: "Nope. Makes 1 of 4 special towers" -> one of four, bolted together on the spot: a **torcher** (tough from the
  front x0.35, weak behind x1.8, turning very slowly, a jet of fire out of its front), a **tesla** (a bolt every 1.2 s
  that leaps on to two more, shocking), a **snowball mortar** (a snowball lobbed every 1.6 s: chill), a **medbay** (when
  friends are hurt: a wobbly healing drone every 3 s that flies to the most hurt and heals it 5%). 12 s (II 16 s).
- Shock Mine: "Spawn 4 small wind up drones that walk towards target and go pop, shocking a bit. He throws them in random
  directions around himself. Are slow." -> **Wind-up Drones** (id shockMine): four (III six) thrown round her; they
  waddle slowly at the nearest enemy, a key turning on their backs, and pop (a thunderclap, shock 20; II 30).
  Towers and drones are drawn in code (fx2 LOOK2). Clips: engineer-attack, -deployTurret, -tinker, -shockMine.

### Werewolf
- "When they die in werewolf form they come back as a human at 10% hp everytime." -> **Back From the Wild** (id
  fromTheWild): the wolf falls, the man gets up at 10% ("BACK").
- Turn: "Make 15% bigger. Can't heal when in this form." -> the wolf is 15% bigger, and his health never rises while he is
  one; II is 14 s (its heal on turning is gone: no healing as a wolf); III the claws make them bleed (real Bleeding).
- Frenzy: "Each successful hit comes out faster than the last. As ware wolf. As human each hit heals more the lower his
  hp. Is always active." -> always on once bought: as a wolf each blow in a row up to 60% faster; as a man each blow heals
  3% x (1 - health) x 2 (II 4.5%); III the howl at full speed.
- Pounce: "As human does a forwards dash with a cleave at the end. As werewolf does a leap and gives self haste." -> as a
  man a dash and a wide cleave (1.6x; II staggers); as a wolf the leap that pins, and haste 4 s.
  Clips: werewolf-turnWolf, -frenzy, -pounce.

## The deck's notes: new heroes (not built here; for the lead)
"Make new hero. Mob. Is 4 peasants... Clock work hero. Influence time. Air mage. Whirled effect. Warden (uses a lot or
shackles and restraints. Nullification themed). Telekinetic. Earth mage": six new heroes, a lane of their own. Whirled
(`whirl()`) and the Shackled idea are ready for the Air mage and the Warden.
