# Delve: the new heroes (round 10, lane H)

Every picked hero that was not yet playable, with its kit. Data: `js/heroes2.js`; the kits: `js/kits2.js`; the looks: `js/fx2.js`.
Each has 1 attack, 3 abilities with 3 tiers, and 1 trait that works on its own. Written by `tools/heroes-doc.mjs`.

## Old Guard (`oldguard`, tank, 700 gold)
A greatsword held in both hands, and forty years of knowing where to put it. Art: `art/heroes/oldguard.svg`.

- **Attack: Greatsword.** A slow, wide two-handed cut in front.
- **Great Sweep** (8s). Draws the greatsword back, then sweeps it round in one huge arc in front of him. I: Hits everything in a wide arc and knocks it back. II: Staggers what it hits. III: Sweeps straight back the other way.
- **Rally** (15s). An old soldier's shout: allies near him shake off stuns and staggers and stand firm. I: Clears stuns, roots and stagger; nothing knocks them back for 5s. II: They move 20% faster for 5s. III: Heals them 12% too.
- **Pommel Strike** (9s). A quick blow with the pommel that breaks off whatever an enemy was winding up. I: Stuns for 1s and stops its move. II: Knocks it far back. III: His next blow on it is a critical hit.
- **Trait: Old Soldier.** Allies standing near him take 10% less damage.

## Dame (`dame`, tank, 700 gold)
Kite shield, leaf sword, perfect manners. Answers every blow. Art: `art/heroes/dame.svg`.

- **Attack: Leaf sword.** A quick, neat cut.
- **Riposte** (9s). Raises the shield; every blow it stops from the front is answered with a thrust. I: For 1.6s. II: The answers stagger. III: For 2.6s, and she turns to meet blows from any side.
- **Challenge** (14s). Calls out the strongest enemy near: it has to fight her, and she hits it harder. I: It must fight her for 6s; she hits it 30% harder. II: She takes 30% less from it. III: Beating it heals her 20% and brings the challenge round again.
- **Disarm** (11s). A flick of the blade at an enemy's weapon hand: its blows land far softer for a while. I: Its blows do 50% less for 5s. II: It attacks slower too. III: Every enemy in front of her.
- **Trait: Grace.** Every third blow she lands is a critical hit.

## Griffon (`griffon`, tank, 1050 gold)
Winged helm, warhammer, shield. Drops out of the sky onto whoever is bothering his friends. Art: `art/heroes/griffon.svg`.

- **Attack: Warhammer.** A heavy hammer blow.
- **Swoop** (11s). Spreads his wings and flies to the ally in the most trouble, landing beside them with a slam that throws their attackers off. I: Flies to a hurt ally and slams down. II: The slam staggers. III: The ally takes 40% less damage for 3s.
- **Stormhammer** (9s). Hurls the hammer down a line; it spins out and comes back to his hand, hitting everything both ways. I: Out and back. II: It shocks. III: A bigger hammer that staggers.
- **Wing Guard** (13s). Raises the shield with his wings spread: shots that reach him from the front are caught and thrown back. I: For 3s; blows from the front do half. II: Thrown-back shots hit twice as hard. III: For 5s, from every side.
- **Trait: Skyborn.** Can't be rooted or entangled.

## Bulwark (`bulwark`, tank, 700 gold)
A winged spear and a big shield. Nothing gets past the end of the spear. Art: `art/heroes/bulwark.svg`.

- **Attack: Winged spear.** A long thrust that reaches past the front line.
- **Brace** (10s). Sets the spear and waits: whatever comes into its reach is struck hard and stopped dead. I: For 3s, the first enemy to come in. II: Every enemy that comes in. III: They are pinned to the spot for 1s.
- **Shield Wall** (15s). Plants the shield: he can't be moved, and allies close to him take less damage. I: For 5s; allies near take 30% less. II: For 7s. III: Enemies that press against the shield are shoved back.
- **Impale** (9s). A heavy thrust that pins one enemy to the spot. I: Pinned for 1.5s. II: It takes 25% more while pinned. III: Pinned for 2.5s and staggered.
- **Trait: Phalanx.** Takes 10% less damage for each ally close by, up to 30%.

## Bearskin (`bearskin`, melee, 700 gold)
A studded club and a bear on his back. Hits like the bear did. Art: `art/heroes/bearskin.svg`.

- **Attack: Studded club.** A heavy club blow.
- **Maul** (8s). Raises the club high and brings it straight down on one enemy. I: Stuns for 1s. II: Stuns for 1.6s. III: The ground cracks: everything round it is staggered.
- **Hibernate** (18s). Curls up under the pelt: takes far less damage and heals while he lies there. I: Heals 25% over 3s, taking 60% less. II: Heals 35%. III: Wakes with a roar that throws enemies back.
- **Bear Roar** (13s). A roar that takes the fight out of the enemies round him. I: They deal 30% less for 5s. II: And they are staggered. III: Wider, and it throws them back.
- **Trait: Thick Hide.** Statuses build half as fast on him.

## Warhelm (`warhelm`, melee, 700 gold)
A beard, a helm, a hammer the size of a sheep. Knocks things a long way. Art: `art/heroes/warhelm.svg`.

- **Attack: Warhammer.** A huge hammer blow that knocks enemies back.
- **Thunder Blow** (9s). Brings the hammer down so hard that everything in front of him is thrown back. I: Throws back everything in a cone in front. II: It shocks them. III: Those it throws are stunned for 1s.
- **War Horn** (16s). Blows the horn: allies near him hit harder for a while. I: +25% damage for 6s. II: +35%, and they take 10% less. III: The blast staggers enemies near him.
- **Skull Splitter** (10s). Two blows: one up under the chin, then one straight down. The second hits double on a staggered foe. I: Two blows. II: The first staggers much harder. III: The second shakes everything round the target too.
- **Trait: Iron Will.** Below 30% health he can't be stunned or staggered and hits 25% harder.

## Bandit (`rogueBandit`, skirmish, 350 gold)
A cutlass, a red bandanna and very quick hands. Fights dirty and comes home richer. Art: `art/heroes/bandit.svg`.

- **Attack: Cutlass.** Quick cutlass slashes.
- **Smoke Bomb** (12s). Throws a smoke bomb into the enemies: inside the cloud they can't see who to hit. I: A cloud for 3s: enemies in it lose their targets and miss. II: They cough: slower attacks. III: A bigger cloud, 5s.
- **Pickpocket** (10s). Darts past an enemy and cuts its purse: coins spill out. I: A few coins from one enemy. II: More coins, and it's slowed. III: Robs everyone along the dash.
- **Low Blow** (9s). A kick where it hurts: the enemy goes down for a moment. I: Down for 1s. II: Down for 1.6s. III: Her blows on it while it's down are critical hits.
- **Trait: Light Fingers.** Enemies she finishes drop half again as much gold.

## Shade (`shade`, skirmish, 1050 gold)
Two mirrored daggers and a cape the colour of a shadow. Hard to find, harder to hit. Art: `art/heroes/shade.svg`.

- **Attack: Twin daggers.** Quick stabs with either hand.
- **Shadow Walk** (11s). Becomes a shadow and runs straight through the enemies, cutting each one she passes. Nothing can touch her meanwhile. I: A short run through them. II: The cuts curse. III: A long run, and she turns back for a second pass.
- **Blackout** (15s). Snuffs out the light round her: enemies in the dark hit softer and she hits them harder. I: For 4s: they deal 30% less, she deals 30% more. II: Bigger. III: For 6s, and they are slowed.
- **Death Mark** (12s). Marks an enemy. After 3s the mark bursts for part of everything it took meanwhile. I: Bursts for half of it. II: For all of it. III: If it dies marked, the mark jumps to the nearest enemy.
- **Trait: Fade.** After 3s without being hit, the next blow meant for her finds only shadow.

## Haymaker (`haymaker`, melee, 350 gold)
A pitchfork, a straw hat, and the shoulders of a man who throws hay all day. Art: `art/heroes/haymaker.svg`.

- **Attack: Pitchfork.** A long jab with the fork.
- **Toss** (9s). Forks the nearest enemy and throws it over his shoulder. I: Throws it behind him. II: It lands hard: hurt and staggered. III: Throws two.
- **Pitch Hay** (11s). Flings a forkful of hay over the enemies in front: they are slowed, and the dry hay catches fire easily. I: Slows those in a cone for 4s. II: Fire burns them twice as fast for 6s. III: A wider cone, and it staggers.
- **Fork Charge** (12s). Runs with the fork lowered, skewering the first enemy and carrying it along. I: Carries the first enemy. II: Slams it down at the end: stunned. III: Carries everything it meets.
- **Trait: Hard Work.** Each enemy he finishes heals him 5%.

## Digger (`digger`, melee, 350 gold)
A long-handled spade. Digs, flings, bats, and finds coins in the floor. Art: `art/heroes/digger.svg`.

- **Attack: Spade.** A swing with the flat of the spade.
- **Dirt Fling** (9s). Digs up a spadeful of dirt and flings it in the enemies' faces. I: Blinds those in front: most of their blows miss for 2.5s. II: And it staggers them. III: Three flings in a row.
- **Burrow** (13s). Dives into the ground and tunnels to a far enemy, bursting up under it. I: Bursts up and throws enemies back. II: The burst staggers. III: Tunnels on to a second enemy.
- **Spade Bat** (10s). A full swing with the flat of the spade that bats an enemy across the room. I: Bats it far away. II: It flies through others, hitting them too. III: It lands stunned.
- **Trait: Prospector.** Now and then digs a coin out of the floor while he fights.

## Grandpa Sickle (`grandpa`, support, 350 gold)
A sickle, a sheaf of wheat and a bag of bread. Feeds the party and trims the enemy. Art: `art/heroes/grandpa.svg`.

- **Attack: Sickle.** A short hooked cut.
- **Bread Toss** (8s). Lobs a loaf of fresh bread to a hurt ally; it heals them where it lands. I: One loaf: heals 20%. II: A loaf each for two allies. III: Warm bread: 10% more over 4s.
- **Harvest** (10s). A low sweep round his feet that cuts at the legs of everything close. I: They are slowed by half for 3s. II: And staggered. III: He heals 4% for each one cut.
- **Old Tales** (18s). Tells the party one of his stories. Somehow it helps. I: Allies near: every ability comes 2s sooner. II: 3s sooner. III: And they heal 8%.
- **Trait: Seen It All.** Allies near him shake off stagger twice as fast.

## Alchemist (`alchemist`, caster, 700 gold)
Wild white hair, brass goggles, a strap of flasks. Every throw is a different brew. Art: `art/heroes/alchemist.svg`.

- **Attack: Unstable flask.** A lobbed flask that splashes where it lands; each one is a different brew: fire, frost or acid.
- **Acid Flask** (9s). A flask of acid that shatters into a hissing pool. I: A pool for 4s that eats at what stands in it. II: It eats armour: they take 20% more. III: A bigger pool.
- **Elixir** (12s). Throws a bright potion to an ally: it heals and quickens them. I: Heals 15%, 30% faster for 4s. II: Heals 25%. III: Splashes every ally near the one it hits.
- **Bang Flask** (13s). A sputtering flask that rolls to a stop, then blows up with a huge shove. I: A big blast that throws enemies back. II: It staggers. III: It splits into three blasts.
- **Trait: Catalyst.** The statuses she causes build 30% faster.

## Shaman (`shaman`, support, 700 gold)
A winged totem on his back and a feather spirit-stick. Calls on the ancestors and the rain. Art: `art/heroes/shaman.svg`.

- **Attack: Spirit bolt.** A teal spirit; a little of what it deals heals the most hurt ally.
- **Healing Totem** (14s). Plants a carved totem that heals the allies near it. I: 3% a second for 6s. II: For 9s. III: It zaps enemies that come near it.
- **Spirit Link** (16s). Binds allies together with spirit threads: a blow on one is shared out among them all. I: Up to three allies, for 5s. II: Linked allies take 10% less. III: Up to five, for 7s.
- **Rain Dance** (15s). Calls a rain cloud over the enemies: it soaks them and puts fires out. I: Rain for 4s. II: Allies under it heal. III: Bigger, and lightning strikes the soaked.
- **Trait: Ancestral Spirits.** When an ally goes down, the spirits heal everyone else 10%.

## Witch (`witch`, caster, 700 gold)
A crooked violet hat and a broom. Turns problems into frogs. Art: `art/heroes/witch.svg`.

- **Attack: Hex bolt.** A wobbling green spark that curves after its target.
- **Hex** (12s). Turns an enemy into a frog: it can't attack, hops slowly and takes more damage. I: A frog for 2s. II: For 3s. III: The hex jumps on to a second enemy.
- **Cursed Brew** (13s). Sets down a bubbling cauldron whose fumes curse whatever breathes them. I: Cursed fumes for 5s. II: Bigger. III: Enemies that die in it burst, cursing those near.
- **Broom Ride** (10s). Hops on the broom and flies out of trouble. I: Flies clear of the enemies near her. II: Drops three hex bolts on the way. III: Further, and nothing can touch her meanwhile.
- **Trait: Crone.** Cursed enemies take 25% more from her.

## Warlock (`warlock`, caster, 1050 gold)
Horns, a gold sceptre and a demon-eye orb. Pays for power in his own blood. Art: `art/heroes/warlock.svg`.

- **Attack: Pact bolt.** A magenta bolt; a third of what it deals heals him.
- **Eldritch Beam** (10s). Holds a beam on an enemy that grows hotter the longer it holds. I: For 2.5s. II: It grows faster. III: It splits to a second enemy.
- **Summon Imp** (18s). Tears open the floor and an imp climbs out to throw fire for him. I: One imp for 15s. II: A tougher imp. III: Two imps.
- **Dark Bargain** (22s). Pays in his own blood: his other abilities are ready again at once. I: Pays 15% of his health. II: Pays 10%. III: What he pays heals the allies near him.
- **Trait: Infernal.** Can't be set on fire.

## Cultist (`cultist`, caster, 700 gold)
A tall black hood, a curved dagger and a burning black candle. Pays in blood for the party's strength. Art: `art/heroes/cultist.svg`.

- **Attack: Shadow bolt.** A bolt of violet shadow from the candle.
- **Blood Pact** (15s). Cuts his palm: gives up some of his health so the allies near him hit harder. I: Pays 10%: allies near +30% damage for 6s. II: +40%. III: They heal from 15% of what they deal.
- **Ritual Circle** (13s). Draws a burning circle under the enemies that curses whatever stands in it. I: A circle for 4s. II: When it closes it drags everything in it to its middle. III: Bigger.
- **Soul Candle** (16s). The black candle flares: every enemy that dies near him for a while bursts into soul fire. I: For 6s. II: Bigger bursts. III: Each burst heals him.
- **Trait: Black Candle.** Enemies close to him are slowly cursed.

## Monk (`monk`, melee, 700 gold)
Saffron robe, prayer beads, bare fists. Very calm. Very fast. Art: `art/heroes/monk.svg`.

- **Attack: Fists.** Quick jabs with either fist.
- **Flurry** (8s). A blur of punches into one enemy; each one heals him a little. I: Six punches. II: The last one sends it flying. III: Nine punches.
- **Palm Strike** (9s). An open palm that drives the force right through: the enemy and everything behind it in a line are thrown back. I: Throws back a line. II: Staggers them. III: A longer line, and it stuns the first.
- **Inner Peace** (16s). Sits and breathes: his statuses fall away and he heals. I: Clears his statuses and heals 15%. II: Allies near him too. III: Nothing can touch him while he sits.
- **Trait: Deflect.** Swats aside 40% of the shots that reach him from the front.

## Seer (`seer`, support, 700 gold)
Blindfolded, silver-haired, a glowing crystal in her hand. Sees what's coming and tells the party. Art: `art/heroes/seer.svg`.

- **Attack: Glimmer.** A crystal mote that glances off its target onto a second enemy.
- **Foresight** (12s). Marks the strongest enemy in sight: the whole party hits it harder. I: Marked for 6s: allies hit it 25% harder. II: Its own blows often miss. III: Marks the two strongest.
- **Premonition** (11s). Sees a blow coming: the ally in the most danger slips out of its way. I: The ally most beset is untouchable for 1.2s. II: Two allies. III: For 2s, and it heals them 10%.
- **Starfall** (15s). Calls stars down out of nowhere onto the enemies round a spot. I: Six stars over 2s. II: They make enemies radiant. III: Ten stars.
- **Trait: Third Eye.** Can't be blinded, and sees 15% of blows coming in time to step aside.

## Chef (`chef`, support, 350 gold)
A toque, a moustache, a frying pan and a wooden spoon. Feeds friends and flings pies at everyone else. Art: `art/heroes/chef.svg`.

- **Attack: Frying pan.** A clanging whack with the pan.
- **Hot Meal** (12s). Sets a hot plate down by a hurt ally; whoever eats it is healed. I: One meal: heals 30%. II: Two meals. III: Whoever eats hits 20% harder for 8s.
- **Grease Fire** (13s). Flips the pan: hot grease splashes over the floor in front, slick and slow. I: Oil in a cone for 6s. II: The oil catches: it burns. III: A wider splash.
- **Food Fight** (10s). Flings custard pies at several enemies. They splat. I: Three pies: slowed for 3s. II: Pie in the eyes: they miss. III: Five pies.
- **Trait: Well Fed.** Allies near him heal 0.5% of their health a second.

## Beekeeper (`beekeeper`, support, 700 gold)
A veiled hat, a copper smoker, and a great many friends who sting. Art: `art/heroes/beekeeper.svg`.

- **Attack: Bee.** Sends a bee buzzing after the target.
- **Swarm** (11s). Opens the hive: bees pour out and chase the nearest enemies, stinging and slowing. I: Six bees. II: Their stings poison. III: Ten bees.
- **Honey Pot** (13s). Throws a pot of honey: enemies get stuck in it, friends get a sweet treat. I: A pool for 5s that entangles enemies. II: Allies standing in it heal. III: Bigger.
- **Royal Jelly** (14s). Feeds an ally royal jelly: it attacks much faster for a while. I: +40% attack speed for 6s. II: And +20% damage. III: Two allies.
- **Trait: Bee Friends.** A few bees always buzz round him and sting enemies that come close.

## Quartermaster (`quartermaster`, support, 350 gold)
A pack bigger than he is. Keeps the party fed, armed and stocked, and throws the pots. Art: `art/heroes/quartermaster.svg`.

- **Attack: Pot toss.** Throws a pot or a pan out of the pack.
- **Resupply** (12s). Tosses a supply bundle to the ally who needs it most. I: Heals 15%, and a health potion if they have none. II: Heals 25%. III: A bundle each for two allies.
- **Oil the Blades** (16s). Hands round lamp oil for the weapons: the allies near him set things alight with every blow. I: Their blows burn a little for 8s. II: They burn more. III: And their blows heal them a little.
- **Flare** (13s). Fires a red flare onto the enemies: whatever stands in its light is easy to hit. I: For 6s they take 20% more. II: They are dazzled and slowed too. III: A bigger patch of light.
- **Trait: Well Stocked.** Once a minute, a friend near him who has no health potion gets one.

## Crossbowman (`crossbowman`, ranged, 700 gold)
A heavy crossbow, a kettle hat and a tall shield on his back. Slow to load, hard to stop. Art: `art/heroes/crossbowman.svg`.

- **Attack: Heavy bolt.** A heavy crossbow bolt that goes through the first enemy it hits.
- **Pavise** (13s). Plants the tall shield in front of him and shoots from behind it. I: For 6s: 60% less damage from the front. II: He reloads 35% faster behind it. III: For 9s.
- **Pinning Bolt** (10s). A barbed bolt that nails an enemy to the floor. I: Pinned for 1.5s. II: Staggered too. III: Pinned for 2.5s.
- **Crank Up** (15s). Cranks the crossbow hard and loads blasting bolts. I: His next three bolts burst where they hit. II: Bigger bursts. III: Five bolts.
- **Trait: Armour Piercing.** His bolts hit elites, majors and bosses 25% harder.

## Falconer (`falconer`, ranged, 700 gold)
A rust beret, a leather gauntlet and a slate-grey falcon. The falcon does the hunting. Art: `art/heroes/falconer.svg`.

- **Attack: Throwing knife.** A thrown hunting knife.
- **Loose the Falcon** (10s). Sends the falcon at the furthest enemy: it marks it and pecks at it. I: Marked for 5s: everyone hits it 20% harder. II: It goes for the eyes: blinded. III: Then it dives on a second enemy.
- **Keen Eye** (14s). Takes careful aim for a while: every throw goes further and some land just right. I: For 6s: 30% of his throws are critical hits. II: He throws 30% faster. III: Half of them are critical.
- **Call the Flock** (13s). Whistles up a flock of small birds that sweeps through a line of enemies, pecking. I: One flock: slows those it passes. II: They peck at eyes: blinded. III: Two flocks.
- **Trait: Bird's Eye.** Sees and throws 25% further than anyone else.

## Grenadier (`grenadier`, ranged, 700 gold)
A tall mitre cap, a handlebar moustache and a lit bomb, always. Solves problems loudly. Art: `art/heroes/grenadier.svg`.

- **Attack: Bomb.** Lobs a small bomb that bursts where it lands.
- **Big Bomb** (11s). Lobs a huge bomb with a long fuse. Everyone sees it coming. It doesn't help. I: A huge blast. II: It burns. III: It scatters four small bombs too.
- **Sticky Bomb** (10s). Sticks a bomb to an enemy; it goes off a moment later. I: It blows after 2s. II: A bigger blast. III: Two sticky bombs.
- **Blast Off** (12s). Drops a bomb at his own feet and rides the blast out of trouble. I: Throws him clear and hurts those near. II: The blast staggers. III: He lands with a second blast.
- **Trait: Demolition.** His blasts throw enemies twice as far.

## Harpooner (`harpooner`, ranged, 700 gold)
A yellow sou'wester, a puffy grey moustache, a barbed harpoon on a rope. Art: `art/heroes/harpooner.svg`.

- **Attack: Harpoon.** A thrown barbed harpoon, pulled back on its rope.
- **Reel In** (10s). Harpoons a far enemy and hauls on the rope: a small one is dragged to him, a big one drags him to it. I: Drags it in (or him to it). II: It's staggered when it lands. III: The rope holds it near him for 4s.
- **Rogue Wave** (12s). Calls up a wave of sea water that crashes over the enemies in front. I: Soaks and shoves them back. II: A bigger wave. III: It leaves water on the floor.
- **Drop Anchor** (14s). Swings a ship's anchor round on its chain and drops it on the enemies. I: A heavy slam that stuns those under it. II: Wider. III: The chain sweeps round first, knocking back.
- **Trait: Old Salt.** Can't be soaked, and hits wet enemies 20% harder.

## Javelin Huntress (`huntress`, ranged, 700 gold)
A coral headband, a ponytail, a bundle of javelins. Runs prey down. Art: `art/heroes/huntress.svg`.

- **Attack: Javelin.** A hard-thrown javelin that knocks its target back.
- **Running Throw** (9s). Sprints round her target and puts a javelin in its back. I: One throw from behind, a critical hit. II: It staggers. III: Two throws on the run.
- **Bound** (8s). Leaps back out of reach and throws a javelin at the top of the leap. I: A leap back and a throw. II: The javelin pierces. III: She lands lightly: 2s faster.
- **Prey** (14s). Picks out the weakest enemy and hunts it down. I: For 8s she runs 40% faster and hits it 50% harder. II: She ignores everything else. III: When it falls she heals 15%.
- **Trait: Finisher.** Hits enemies below half health 25% harder.

## Marksman (`marksman`, ranged, 1050 gold)
A cavalier hat with a cream plume, a grey moustache, a very long musket. One shot, well placed. Art: `art/heroes/marksman.svg`.

- **Attack: Musket.** One long, hard shot.
- **Aimed Shot** (10s). Stands stock still, aims, and fires a shot that goes clean through. I: Triple damage through the first enemy. II: Through everything in the line. III: Knocks out the first one hit.
- **Bayonet** (8s). Fixes the bayonet and stabs whatever got too close, shoving it away. I: A stab and a big shove. II: It staggers. III: Then a shot at it point blank.
- **Ricochet** (12s). A shot aimed to glance off one enemy onto the next. I: Bounces three times. II: Five times. III: Each bounce hits harder.
- **Trait: Deadeye.** His first hit on an enemy that hasn't been hurt yet is a critical hit.

## Ninja (`ninja`, ranged, 1050 gold)
Charcoal hood, crimson scarf, a shuriken in each hand. Hard to pin down. Art: `art/heroes/ninja.svg`.

- **Attack: Shuriken.** Quick shuriken from either hand.
- **Shuriken Fan** (9s). Throws a fan of shuriken, then vanishes in smoke and appears a little way off. I: Three shuriken and a smoke blink. II: Five shuriken. III: They poison.
- **Substitution** (12s). When a big blow lands, it was a log all along: she is somewhere else. I: Escapes one big blow. II: The log bursts into smoke that blinds. III: Ready again much sooner.
- **Caltrops** (12s). Scatters iron caltrops round her feet. I: A patch for 5s that hurts and slows. II: Bigger. III: They poison.
- **Trait: Assassin.** Her shuriken hit 50% harder from behind.

## Pirate (`pirate`, skirmish, 700 gold)
Tricorn, cutlass, flintlock. Fights dirty, drinks worse, calls in the ship's guns. Art: `art/heroes/pirate.svg`.

- **Attack: Cutlass.** Fast cutlass slashes.
- **Point Blank** (7s). Jams the flintlock against an enemy and fires. I: A big hit and a shove. II: It staggers. III: The second pistol at another enemy.
- **Grog** (16s). A long swig of grog. Things hurt less for a while. I: Heals 20%; takes 20% less for 5s. II: Nothing knocks her about meanwhile. III: Heals 30%.
- **Broadside** (15s). Whistles to the ship: cannonballs come down round a spot. I: Three cannonballs. II: Bigger blasts. III: Five.
- **Trait: Dirty Fighting.** Hits staggered, stunned, slowed or rooted enemies 30% harder.

## Slinger (`slinger`, ranged, 350 gold)
A shepherd in a ram's fleece with a sling and a crook. Stones, and the flock behind him. Art: `art/heroes/slinger.svg`.

- **Attack: Sling.** A whirl and a stone.
- **Stunning Stone** (8s). Whirls the sling hard and lets fly a stone at the head. I: Stuns for 0.6s. II: Stuns for 1s. III: It glances on to a second enemy.
- **Ram** (13s). Whistles, and a big ram charges through a line of enemies. I: One ram, knocking them aside. II: It staggers. III: Two rams.
- **Gravel** (10s). Slings a handful of gravel in a wide spray. I: Many small stones in a cone. II: They knock back. III: Wider, more stones.
- **Trait: Watchful.** Allies near him shake off stuns and sleep 40% faster.

## Trapper (`trapper`, ranged, 700 gold)
A fur cap with the flaps down, a short rifle and a jaw trap. Catches things. Art: `art/heroes/trapper.svg`.

- **Attack: Short rifle.** A rifle shot.
- **Jaw Trap** (9s). Sets a jaw trap where the enemies are coming; the first to step in is caught. I: Holds it for 2s. II: Holds 3s and bites harder. III: Two traps.
- **Weighted Net** (12s). Throws a weighted net over a group of enemies. I: It entangles those under it. II: A bigger net. III: They are tangled at once.
- **Tripwire** (13s). Strings a wire across the enemies' way: whatever runs into it goes down. I: Knocks them down for 1s. II: A longer wire. III: Down for 1.6s.
- **Trait: Trapper's Eye.** Enemies that are held, rooted or tangled take 30% more from him.

## Gladiator (`gladiator`, melee, 700 gold)
A crested bronze helm, a gladius and a little round shield. Plays to the crowd. Art: `art/heroes/gladiator.svg`.

- **Attack: Gladius.** A short, quick stab.
- **Net Throw** (10s). Casts a net over one enemy: it is held and he stabs it harder. I: Held for 2s; he hits it 30% harder. II: Held 3s. III: Two nets.
- **Showboat** (14s). Raises the gladius to the crowd: enemies near turn on him and he braces. I: Taunts those near for 3s; takes 30% less. II: Heals 15%. III: Each blow he takes meanwhile is answered.
- **Shield Rush** (9s). Rushes in behind the round shield and stabs. I: A short rush and a stab. II: The rush knocks aside what it meets. III: Stuns the one stabbed.
- **Trait: Arena.** Hits 5% harder for each enemy near him, up to 25%.

## Jester (`jester`, skirmish, 1050 gold)
A three-pointed cap with bells and a marotte on a stick. Makes enemies look foolish, then fight each other. Art: `art/heroes/jester.svg`.

- **Attack: Marotte.** A bonk with the jester's stick.
- **Mock** (11s). Pulls a face and blows a raspberry: enemies near can't help chasing him. I: Taunts those near for 3s; he dodges more meanwhile. II: Wider. III: They swing slower in their rage.
- **Befuddle** (14s). Tells an enemy a joke so bad it turns on its own friends for a moment. I: For 2.5s. II: For 4s. III: Two enemies.
- **Juggling Act** (10s). Throws his juggling balls: they bounce from enemy to enemy. I: Three balls, each bouncing twice. II: They daze: slowed. III: Five balls.
- **Trait: Pratfall.** The first time each room a blow would down him, he trips out of its way.

## Samurai (`samurai`, melee, 1050 gold)
An indigo kabuto with gold horns and a long katana. Waits, then cuts. Art: `art/heroes/samurai.svg`.

- **Attack: Katana.** A clean, wide cut.
- **Iaido** (10s). Sheathes the blade, then flashes straight through a line of enemies, cutting every one. I: One dash through. II: Each cut is a critical hit. III: Dashes back through again.
- **Focus** (12s). Breathes in and settles: his next cut lands with everything. I: The next cut does triple. II: And it cuts all round him. III: And it heals him 15%.
- **Crescent Cut** (11s). A cut so fast it flies off the blade as a crescent through the enemies. I: One crescent. II: It staggers. III: Three crescents.
- **Trait: Bushido.** Below 35% health he cuts 40% faster.

## Valkyrie (`valkyrie`, melee, 1050 gold)
A winged helm, long plaits and a big spear. Carries the fallen back into the fight. Art: `art/heroes/valkyrie.svg`.

- **Attack: Spear.** A long spear thrust.
- **Valkyrie's Call** (30s). Calls a fallen ally back to their feet at once. I: Back up at 25% health, once a room. II: At 40%. III: They are untouchable for 2s after.
- **Spear of the Sky** (9s). Hurls the spear down a line; it flies back to her hand. I: Through a line of enemies. II: It shocks. III: It nails the last one hit to the floor.
- **Sky Dive** (12s). Leaps high on her wings and dives spear-first onto an enemy. I: A dive that hits hard where she lands. II: It staggers those round. III: She heals 15% on landing.
- **Trait: Chooser of the Slain.** Revives the fallen twice as fast, at 30% health.

## Engineer (`engineer`, melee, 1050 gold)
An orange work suit, a welding mask pushed up and a very big wrench. Builds a turret and keeps it running. Art: `art/heroes/engineer.svg`.

- **Attack: Wrench.** A clanging swing of the wrench.
- **Deploy Turret** (20s). Sets down a turret that swivels and shoots the nearest enemy. I: One turret for 15s. II: It shoots faster and lasts 25s. III: Two turrets.
- **Tinker** (10s). A few smart knocks with the wrench: his turrets are patched up, and so is a friend. I: Turrets back to full; a friend heals 12%. II: The friend takes 25% less for 5s. III: The turrets' shots burn for 6s.
- **Shock Mine** (12s). Tosses out a mine that goes off with a crackle when an enemy comes near. I: A blast that stuns for 1s. II: It shocks everything round it. III: Two mines.
- **Trait: Handy.** Things he builds or calls take 30% less damage.

## Werewolf (`werewolf`, melee, 1050 gold)
A woodsman with a hatchet and a torn red shirt. Then, when it matters, a great grey wolf. Art: `art/heroes/werewolf.svg`, and `art/heroes/werewolf-beast.svg` (Werewolf).

- **Attack: Hatchet.** A woodsman's chop. As a wolf: quick raking claws with either paw.
- **Turn** (22s). Lets the wolf out: faster, and the claws come twice as fast as the hatchet. I: A wolf for 10s. II: For 14s, and he heals 20% as he turns. III: The claws make them bleed (poison).
- **Frenzy** (14s). Each blow in a row comes faster than the last. I: For 6s, up to 60% faster. II: His blows heal him a little. III: At full speed he howls: everything near is staggered.
- **Pounce** (10s). Leaps onto a far enemy and pins it to the floor. I: Pins it for 1s. II: Pins it for 1.6s. III: Mauls it while it's pinned.
- **Trait: Moonblood.** Heals 1% of his health a second while fighting.
