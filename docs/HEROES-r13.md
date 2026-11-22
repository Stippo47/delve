# Round 13, lane H2: the 37 newer heroes against the showcase 3 answers

The designer's words: `docs/riffle-log/2026-11-22-round12.txt`, deck showcase3. One block per hero, in the log's order:
each note quoted, what was built, and the clip (`clips/showcase5/<hero>-<ability>.mp4`). What was ticked with no note is
left exactly as it was. Ability ids stay the same when a slot gets a new ability (saves keep their bought nodes); the
name, words and behaviour change.

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
