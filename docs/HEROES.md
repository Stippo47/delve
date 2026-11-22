# Delve: the new heroes (round 10, lane H)

Every picked hero that was not yet playable, with its kit. Data: `js/heroes2.js`; the kits: `js/kits2.js`; the looks: `js/fx2.js`.
Each has 1 attack, 3 abilities with 3 tiers, and 1 trait that works on its own. Written by `tools/heroes-doc.mjs`.

## Old Guard (`oldguard`, tank, 700 gold)
A greatsword held in both hands, and forty years of knowing where to put it. Art: `art/heroes/oldguard.svg`.

- **Attack: Greatsword.** A slow, wide two-handed cut in front.
- **Great Sweep** (8s). Draws the greatsword back, then sweeps it round in one huge arc in front of him. I: Hits everything in a wide arc and knocks it back. II: Staggers what it hits. III: Sweeps straight back the other way.
- **Rally** (15s). An old soldier's shout: allies near him shake off stuns and staggers and stand firm. I: Clears stuns, roots and stagger; nothing knocks them back for 5s. II: Haste too: they move and strike 30% faster, and it all lasts 8s. III: Heals them 8% too.
- **Parry** (9s). Sets the greatsword across him: the next blow or shot that reaches him within 4s is caught. A shot flies back at whoever loosed it; a blow's force goes back into the one who struck. I: One parry. II: Two parries. III: What he sends back hits 60% harder.
- **Trait: Last Stand.** Once a room, when he is the last of the party standing: he can't be stopped or knocked about and is hasted for 10s, and all his abilities are ready again at once.

## Dame (`dame`, tank, 700 gold)
Kite shield, leaf sword, perfect manners. Answers every blow. Art: `art/heroes/dame.svg`.

- **Attack: Leaf sword.** A quick, neat backhand cut.
- **Riposte** (9s). Raises the shield; every blow it stops from the front is answered with a thrust. I: For 1.6s. II: The answers stagger. III: For 2.6s, and she turns to meet blows from any side.
- **Challenge** (14s). Dashes to the friend nearest death, shoves them clear of the fight, patches them up and stands in the way: the nearest enemy has to turn on her. I: Heals them 10%; the nearest enemy must fight her for 4s. II: Heals them 20%. III: Every enemy near must fight her.
- **Disarm** (11s). A flick of the blade at an enemy's weapon hand: its blows land far softer for a while. I: Its blows do 50% less for 5s. II: It attacks slower too. III: Every enemy in front of her.
- **Trait: Grace.** Every third blow she lands is a critical hit.

## Griffon (`griffon`, tank, 1050 gold)
Winged helm, warhammer, shield. Drops out of the sky onto whoever is bothering his friends. Art: `art/heroes/griffon.svg`.

- **Attack: Warhammer.** A heavy hammer slammed into the floor in front: everything there is hit.
- **Swoop** (11s). A gust bursts round him as he beats his wings and flies to the ally in the most trouble; he lands spinning, and a swirl of wind whirls their attackers and throws them back. I: Flies to a hurt ally; the landing whirls and throws back. II: The landing staggers. III: The ally takes 40% less damage for 3s.
- **Stormhammer** (9s). Hurls the hammer down a line; it spins out and comes back to his hand, whirling everything it hits both ways. I: Out and back; it whirls what it hits. II: A small thunderclap bursts round each one it hits. III: It flies from one enemy to the next, out and back.
- **Wing Guard** (13s). Spreads his wings round him for 4s: he takes 25% less, and whoever strikes him is blasted far back (further if whirled). I: Strikers are blasted back. II: Strikers that slam into a wall or a pillar are hurt. III: They burst when they slam into it, hurting those near.
- **Trait: Skyborn.** Can't be rooted or entangled.

## Bulwark (`bulwark`, tank, 700 gold)
A winged spear and a big shield. Nothing gets past the end of the spear. Art: `art/heroes/bulwark.svg`.

- **Attack: Winged spear.** A long thrust that reaches past the front line.
- **Brace** (10s). Sets the spear and waits: whatever comes into its reach is struck hard and stopped dead. I: For 3s, the first enemy to come in. II: Every enemy that comes in. III: They are pinned to the spot for 1s.
- **Shield Wall** (15s). Plants the shield: he can't be moved, and allies close to him take less damage. I: For 5s; allies near take 30% less. II: For 7s. III: Enemies that press against the shield are shoved back.
- **Impale** (9s). A heavy thrust that pins one enemy to the spot. I: Pinned for 1.5s. II: It takes 25% more while pinned. III: Pinned for 2.5s and staggered.
- **Trait: Return Thrust.** Every blow he takes winds him up, up to five. His next thrust lets it go: twice the reach, through everything in a line, and 30% harder for each.

## Bearskin (`bearskin`, melee, 700 gold)
A studded club and a bear on his back. Hits like the bear did. Art: `art/heroes/bearskin.svg`.

- **Attack: Studded club.** A heavy club blow.
- **Maul** (8s). Raises the club high and brings it straight down on one enemy, cratering the floor. I: Stuns for 1s. II: Stuns for 1.6s. III: The ground cracks: everything round it is staggered.
- **Hibernate** (18s). Curls up under the pelt and falls asleep. Asleep, however it happens, he heals 7% a second; this sleep holds until the blows he takes outweigh the healing, or he is whole. I: He sleeps and heals. II: Nothing can touch him with a status while he sleeps. III: He wakes with a roar that throws enemies back.
- **Bear Claws** (13s). Puts the club away, dashes in and rakes an enemy with a flurry of claw swipes. I: Six swipes. II: The swipes catch everything in front of him. III: Six more, and a bite at the end that makes it bleed.
- **Trait: Thick Hide.** Statuses build half as fast on him.

## Warhelm (`warhelm`, melee, 700 gold)
A beard, a helm, a hammer the size of a sheep. Knocks things a long way. Art: `art/heroes/warhelm.svg`.

- **Attack: Warhammer.** A huge hammer slammed into the floor in front, knocking back everything there.
- **Thunder Blow** (9s). Lunges and headbutts the enemy in front: a heavy blow that staggers it and throws it far back. I: A headbutt that staggers and throws back. II: It shocks. III: The one thrown knocks down whatever it hits.
- **Storm Born** (16s). Lets go of the hammer: it circles him in the air and darts at an enemy near every second, while he fights with his fists, every punch shocking and knocking back. I: For 6s. II: For 9s. III: Each dart of the hammer bursts in a thunderclap.
- **Skull Splitter** (10s). Hurls the hammer ahead, shocking everything it passes, then leaps after it and slams down where it fell. I: A throw, a leap and a slam. II: The slam staggers. III: A wider slam that stuns.
- **Trait: Iron Will.** Below 30% health he can't be stunned or staggered and hits 25% harder.

## Bandit (`rogueBandit`, skirmish, 350 gold)
A cutlass, a red bandanna and very quick hands. Takes your weapon, your footing and your nerve, in that order. Art: `art/heroes/bandit.svg`.

- **Attack: Cutlass.** Quick, wide cutlass slashes.
- **Bolas** (11s). Whirls a bolas and lets it fly at the enemy furthest off (a shooter first): it wraps its legs and down it goes. I: Tripped for 1.3s, then slowed. II: Two bolas. III: Down for 2s, and it drops its weapon.
- **Dirty Trick** (9s). Three quick cuts and a kick that sends the enemy flying into its friends. I: Three cuts and the kick. II: The cuts make it bleed. III: The kicked one, and whatever it hits, are staggered.
- **Stick 'Em Up** (12s). Levels the cutlass at an enemy: hands up. It can't attack or use an ability while they're up, and everyone hits it 25% harder. I: Hands up for 2.5s. II: Two more near it put theirs up too. III: For 3.5s.
- **Trait: Snatch.** Every fourth blow tears the enemy's weapon out of its hand and flings it away: it can't attack until it walks over and picks it up.

## Shade (`shade`, skirmish, 1050 gold)
Two mirrored daggers and a cape the colour of a shadow. Hard to find, harder to hit. Art: `art/heroes/shade.svg`.

- **Attack: Twin daggers.** Two quick stabs, one from each hand, one right after the other.
- **Shadow Walk** (11s). Becomes a shadow and runs straight through the enemies, cutting each one she passes. Nothing can touch her meanwhile. I: One run through them. II: The cuts curse. III: Three runs in a row, each at another enemy.
- **Blackout** (15s). Snuffs out the light round her: enemies in the dark are Weakened (they deal 30% less) and she hits them 30% harder. I: For 4s. II: Bigger. III: For 6s, and she is a shadow while it lasts.
- **Shadow Clones** (14s). Her shadow splits off into copies of her that fight beside her: very fast, running straight through bodies and walls, circling their foe and stabbing, but easily broken. I: Two clones for 6s. II: Three clones. III: They last 10s.
- **Trait: Fade.** After 3s without attacking or being hurt she becomes a shadow: no enemy can pick her out until she strikes or uses an ability.

## Haymaker (`haymaker`, melee, 350 gold)
A pitchfork, a straw hat, and the shoulders of a man who throws hay all day. Art: `art/heroes/haymaker.svg`.

- **Attack: Pitchfork.** A lunging jab with the fork: three tines.
- **Toss** (9s). Forks the nearest enemy and throws it high over his shoulder: it turns head over heels and lands hard behind him. I: Throws it behind him. II: It lands harder: hurt and staggered. III: Throws two.
- **Pitch Hay** (11s). Flings a forkful of hay over the enemies in front: they are slowed, and the dry hay catches fire easily. I: Slows those in a cone for 4s. II: Fire burns them twice as fast for 6s. III: A wider cone, and it staggers.
- **Hay Bale** (13s). Rolls out a big hay bale and rides it: it rolls at the enemies, turning slowly, and straight round when it hits a wall; whoever it rolls over is hit hard and thrown aside. It wears out, burns easily, and bursts into hay when it goes. I: A bale for 5s. II: For 7s. III: It staggers what it rolls over.
- **Trait: Hard Work.** Each enemy he finishes heals him 8%.

## Digger (`digger`, melee, 350 gold)
A long-handled spade. Digs, flings, bats, and finds coins in the floor. Art: `art/heroes/digger.svg`.

- **Attack: Spade.** A swing with the flat of the spade.
- **Dirt Fling** (9s). Flings clods of earth in a fan: enemies are blinded (most of their blows miss for 2.5s); friends in it are cleaned of fire and poison and get a coat of dirt. I: One fling. II: It staggers enemies. III: Three flings in a row.
- **Burrow** (13s). Dives into the ground and tunnels to a far enemy, churning a trail of earth behind him, and bursts up out of the floor beside it. I: He bursts up and throws enemies back. II: The burst staggers. III: Tunnels on to a second enemy.
- **Bury** (10s). Slams the spade down in front of him: whatever it hits is driven into the ground, where it can neither move nor be hit until it digs itself out. I: Buried for 1.5s. II: Buried for 2.2s. III: They come out staggered.
- **Trait: Rub Some Dirt In It.** Every ability he uses rubs dirt into him (Dirty): it soaks up the next blow, and until then fire and poison can't take on him, but he swings slower.

## Grandpa Sickle (`grandpa`, support, 350 gold)
A sickle, a sheaf of wheat and a bag of bread. Feeds the party and trims the enemy. Art: `art/heroes/grandpa.svg`.

- **Attack: Sickle.** A short hooked cut.
- **Bread Toss** (8s). Lobs a warm loaf high to a hurt ally; it heals them where it lands. I: One loaf: heals 20%. II: A loaf each for two allies. III: Warm bread: 10% more over 4s.
- **Harvest** (10s). Hurries to the friend most beset and sweeps the sickle low round his feet there, cutting at the legs of everything close. I: They are slowed by half for 3s. II: And staggered. III: He heals 4% for each one cut.
- **Old Tales** (18s). Opens his old story book and tells the party one of his stories: every friend listening has its abilities come round sooner. I: Each friend near: every ability 4s sooner. II: 6s sooner. III: And they heal 8%.
- **Trait: Seen It All.** Allies near him shake off stagger twice as fast.

## Alchemist (`alchemist`, caster, 700 gold)
Wild white hair, brass goggles, a strap of flasks. Every throw is a different brew. Art: `art/heroes/alchemist.svg`.

- **Attack: Unstable flask.** A lobbed flask that splashes where it lands; each one is a different brew: fire, frost or acid.
- **Brew Pools** (9s). Throws two flasks in a spread; each bursts into a lingering pool of one of six brews: acid (eats at them, they take more), cold (chills), fire (burns), whirling (whirls and spins them), shocking (shocks) or water (soaks). I: Two pools for 4s. II: Three flasks. III: Bigger pools, for 5s.
- **Elixir** (12s). Throws a bright potion to the friend who needs it, one of three: cleansed and healed if hurt or afflicted; Warded (a shield soaking up 30) and swift if being hit; hasted and enraged if fighting. I: One friend: heals 14% / ward 30 / +25% damage. II: Heals 22% / ward 45 / +35% damage. III: It splashes every friend near the one it hits.
- **Monstrosity** (18s). Drinks an unstable concoction and becomes a monstrosity for 8s: bigger, faster, with rapid clawing blows and a lunge; nothing can hurt her or put a status on her, she is hard to shove, but it burns through a third of her health. I: 8s as a monster. II: Her blows land 25% harder. III: Every blow puts a random status on what it hits.
- **Trait: Catalyst.** The statuses she causes build 30% faster.

## Shaman (`shaman`, support, 700 gold)
A winged totem on his back and a feather spirit-stick. Calls on the ancestors and the rain. Art: `art/heroes/shaman.svg`.

- **Attack: Spirit bolt.** A teal spirit; when it strikes near a hurt friend it leaps on to that friend and mends it.
- **Healing Totem** (14s). Throws a winged totem like the one on his back to the friend in the most trouble. It stands (70 health, blows on it do half): every blow on a friend within its reach lands on the totem instead, and it mends them a little. I: It stands 6s. II: It stands 10s. III: It cleans statuses off friends near it.
- **Spirit Link** (16s). Binds friends, and his totem, together with spirit threads: a blow on one is shared out among them all. I: Up to three friends, for 5s. II: Linked friends take 10% less. III: Up to five, for 7s.
- **Ancestors' Call** (20s). Calls the ancestors in spirit shape: a bear that fights beside them and shelters friends near it (they take 20% less), a wolf that hunts, an eagle that follows the most hurt friend and mends it, and a beaver that spins and shoots homing spirit orbs. I: For 6s. II: For 9s. III: The spirits are 10% stronger.
- **Trait: Ancestral Spirits.** When an ally goes down, the spirits heal everyone else 10%.

## Witch (`witch`, caster, 700 gold)
A crooked violet hat and a broom. Turns problems into frogs. Art: `art/heroes/witch.svg`.

- **Attack: Hex bolt.** Three hexes in quick succession, each a different witch's sign, curving after the target.
- **Hex** (12s). A hex that turns an enemy into a frog: it can't attack, takes 50% more, and hops about wherever it likes. I: A frog for 2s. II: For 3s. III: The hex jumps on to a second enemy.
- **Cursed Brew** (13s). Drops a heavy bubbling cauldron on the enemies: it lands with a blow that throws them back, then stands (60 health) while its fumes curse whatever breathes them. I: Cursed fumes for 6s. II: Wider fumes. III: Enemies that die in them burst, cursing those near.
- **Broom Ride** (11s). Hops on the broom and flies high over the fight, circling the enemies and dropping hex bombs on them; nothing can pick her out while she flies. I: 2.5s in the air. II: More bombs. III: 3.5s in the air.
- **Trait: Crone.** Cursed enemies take 40% more from her.

## Warlock (`warlock`, caster, 1050 gold)
Horns, a gold sceptre and a demon-eye orb. Pays for power in his own blood. Art: `art/heroes/warlock.svg`.

- **Attack: Pact bolt.** An eye of magenta fire like the one on his sceptre: it flies out through the enemies and comes back to his hand, hitting on the way back too; a third of what it deals heals him. His imp throws smaller ones.
- **Eldritch Beam** (10s). His imp holds a writhing magenta ray on an enemy (he does, if it is gone): it burns hotter the longer it holds, shoving the enemy back, and bursts at the end. I: For 2.5s, then it bursts. II: It grows hotter faster. III: A bigger burst.
- **Awaken** (18s). The imp climbs into him and he becomes the demon: a big demonic sword whose blows explode on what they hit, a blink to his foe, fireballs spat at those further off; he takes 40% less as the demon. Every kill starts the time again. I: For 8s. II: For 11s. III: Bigger explosions that burn.
- **Dark Bargain** (18s). Pays a fifth of his health in blood to his imp: both of them strike far faster for a while, and every blow of theirs bursts round what it hits. I: For 6s. II: For 8s. III: The imp grows on the blood: tougher.
- **Trait: Familiar.** A small imp is always with him, darting at his shoulder and throwing little eye bolts at his foes. If it falls, another climbs out of the floor 8s later.

## Cultist (`cultist`, caster, 700 gold)
A tall black hood, a curved dagger and a burning black candle. Pays in blood for the party's strength. Art: `art/heroes/cultist.svg`.

- **Attack: Shadow bolt.** Close up, a swipe of the curved dagger that makes it bleed; further off, a bolt of violet shadow from the candle. The bolt bursts the bleeding at once.
- **Blood Pact** (15s). Cuts himself open (he bleeds): the friends near him are enraged. I: Rage for 6s: +30% damage, quicker blows. II: +40%. III: They heal from 15% of what they deal.
- **Ritual Circle** (13s). Draws a burning circle under the enemies that makes whatever stands in it bleed. I: A circle for 4s. II: When it closes it drags everything in it to its middle. III: Nothing inside can step out of it.
- **Sacrifice** (14s). Bounds at an enemy near death and finishes it with the dagger; its blood heals him 15%. A boss or a major is cut deep instead. I: Below a quarter of its health. II: Below a third. III: He spins as he lands: everything near bleeds.
- **Trait: Blood Rite.** Every bleeding he started that bursts heals him 8%.

## Monk (`monk`, melee, 700 gold)
Saffron robe, prayer beads, bare fists. Very calm. Very fast. Art: `art/heroes/monk.svg`.

- **Attack: Fists.** Quick jabs with either fist, each one a burst of force that knocks back hard.
- **Flurry** (8s). Steps in behind a blur of punches into one enemy; each one heals him a little. I: Six punches. II: The last one sends it flying. III: Nine punches.
- **Palm Strike** (9s). An open palm whose force strikes everything in reach: each is thrown back, turned to face away from him and Spun: it turns very slowly, and when that builds up it marches off the way it faces, fast, unable to attack. I: Everything in reach. II: It staggers them. III: Further, and they spin faster.
- **Inner Peace** (16s). Sits with his palms pressed together: his statuses fall away and he heals 15%; shots that reach him fly back, and whoever strikes him is thrown far back. I: For 2.5s. II: For 4s. III: A glow round him heals friends near and clears their statuses.
- **Trait: Deflect.** Swats aside 40% of the shots that reach him from the front.

## Seer (`seer`, support, 700 gold)
Blindfolded, silver-haired, a glowing crystal in her hand. Sees what's coming and tells the party. Art: `art/heroes/seer.svg`.

- **Attack: Glimmer.** A crystal mote that glances off its target onto a second enemy.
- **Foresight** (12s). A great violet eye opens over the strongest enemy in sight, light pinning it: the whole party hits it harder. I: Marked for 6s: allies hit it 35% harder. II: Its own blows often miss. III: Marks the two strongest.
- **Blinding Flash** (11s). Her crystal flares: everything round her is struck and blinded: most of its blows miss. I: Blinded for 2.5s. II: For 3.5s. III: The light makes them radiant too.
- **Ill Omen** (15s). A dark star hangs over the enemies for 5s: every blow they land also lands on a friend of theirs near, and they grow confused. I: For 5s. II: They grow confused faster. III: A wider omen.
- **Trait: Third Eye.** Can't be blinded, and sees 15% of blows coming in time to step aside.

## Chef (`chef`, support, 350 gold)
A toque, a moustache, a frying pan and a wooden spoon. Feeds friends and flings pies at everyone else. Art: `art/heroes/chef.svg`.

- **Attack: Food toss.** Throws whatever comes to hand: an apple, a drumstick, a pie, cheese, a roll, a fish. It hurts the enemy it hits and mends any friend it passes over.
- **Hot Meal** (12s). Throws hot plates out round the party; a friend who walks over one eats it and heals 20%; what goes past full health becomes extra health. Hurt friends go and get one. I: Two plates. II: Three plates. III: Whoever eats hits 20% harder for 8s.
- **Grease Fire** (13s). Flips the pan: hot grease splashes over the floor in front, slick and slow. I: Oil in a cone for 6s. II: The oil catches: it burns. III: A wider splash.
- **Food Fight** (10s). Flings custard pies at several enemies, the ones dashing or leaping first: a pie stops a dash, a leap or a charge dead, and slows a little. I: Three pies. II: Pie in the eyes: they miss. III: Five pies.
- **Trait: Well Fed.** Allies near him heal 0.5% of their health a second.

## Beekeeper (`beekeeper`, support, 700 gold)
A veiled hat, a copper smoker, and a great many friends who sting. Calms the enemy, sets the hive on them, keeps his friends sweet. Art: `art/heroes/beekeeper.svg`.

- **Attack: Bee.** Sends a bee at the target: it stings, then stays buzzing round it, stinging now and then.
- **Smoker** (11s). Pumps the smoker: a cone of thick white smoke rolls over the enemies in front. They grow sleepy and slow, and drop off if it builds. I: Sleepy and slowed. II: Sleepier. III: They swing slower too.
- **Beehive** (14s). Throws a hive down among the enemies (its own health): bees stream out at whatever is near, and whoever strikes the hive is mobbed. I: A hive for 8s. II: For 12s. III: Its bees stay on their foes, stinging.
- **Honey Glaze** (12s). Drizzles honey over the friend under the most attack: it heals over 4s, and whatever strikes it gets stuck in the honey. I: Heals 11% over 4s. II: Heals 17%. III: Two friends.
- **Trait: Pollen.** Every sixth sting of his bees carries pollen back: the friend most hurt near him heals 4%.

## Quartermaster (`quartermaster`, support, 350 gold)
A pack bigger than he is. Whatever the party needs, it is in there somewhere: kit, a crate, a barricade, a pot. Art: `art/heroes/quartermaster.svg`.

- **Attack: Pack toss.** Throws whatever is on top of the pack: a pot, a pan, a boot, a tin cup, a ladle.
- **Supply Crate** (16s). Drops a supply crate by the friend whose abilities are furthest off; each friend's first touch brings its abilities round sooner and patches it up 5%. Friends with abilities waiting walk over to it. I: One crate: 4s sooner. II: 6s sooner. III: Two crates.
- **Barricade** (18s). Unfolds a wooden barricade between the party and the enemies: it blocks their way and their shots until it is broken. I: 110 health, 10s. II: 160 health, 14s. III: Spikes: whatever strikes it is hurt.
- **Pot Helmet** (12s). Throws a big cooking pot that lands upside down over an enemy's head: it can't see (its blows miss) and blunders about confused. I: Over one head for 3s. II: The clang staggers. III: It bounces on to a second head.
- **Trait: Requisition.** Every 20s he tosses a piece of kit to the friend nearest the fight, for 12s: a whetstone (+20% damage), a buckler (a shield of 25) or boots (+25% speed). A gatherer: on the wagon road he goes for loose gold before a fight, and further for it.

## Crossbowman (`crossbowman`, ranged, 700 gold)
A heavy crossbow, a kettle hat and a tall shield on his back. Slow to load, hard to stop. Art: `art/heroes/crossbowman.svg`.

- **Attack: Heavy bolt.** A heavy crossbow bolt that goes through the first enemy it hits.
- **Pavise** (13s). Plants the tall shield in front of him as a thing of its own (60 health): his side's shots go through it, the enemy's stop on it. I: One pavise for 7s. II: For 10s, and he reloads 35% faster behind it. III: Three, set round him in a slanted row.
- **Pinning Bolt** (10s). A heavy bolt that hits hard and throws the enemy flying backwards; whatever it ploughs into is hurled aside, and when it slams into a wall it is pinned there, stunned. I: Pinned for 1.8s. II: The slam staggers. III: Pinned for 2.5s.
- **Crank Up** (15s). Cranks the crossbow hard and loads charged bolts: each bursts where it stops in grey smoke and iron, staggering. I: Three charged bolts. II: Bigger bursts. III: Five bolts.
- **Trait: Armour Piercing.** His bolts go straight through armour, and hit elites, majors and bosses 25% harder.

## Falconer (`falconer`, ranged, 700 gold)
A rust beret, a leather gauntlet and a slate-grey falcon. The falcon does the hunting. Art: `art/heroes/falconer.svg`.

- **Attack: Throwing knife.** A broad hunting knife thrown end over end.
- **Loose the Falcon** (10s). The falcon leaves his fist for the furthest enemy (an elite first) and rakes it: it is Tracked (a crosshair): it can't turn invisible, untouchable or go underground, and every blow on it lands harder. I: Tracked for 6s. II: It goes for the eyes: blinded. III: Then it dives on a second enemy.
- **Keen Eye** (14s). Takes careful aim for a while: his knives glint gold and some land just right. I: For 6s: 30% of his throws are critical hits. II: He throws 30% faster. III: Half of them are critical.
- **Call the Flock** (13s). He scatters into a flock of birds: nothing can touch him while it sweeps through the enemies, pecking and slowing them; then he is himself again. I: A flock for 2.2s. II: They peck at eyes: blinded. III: For 3s.
- **Trait: Hunting Partner.** Every fourth knife the falcon goes out with it, rakes the foe and marks it Tracked for 2s.

## Grenadier (`grenadier`, ranged, 700 gold)
A tall mitre cap, a handlebar moustache and a lit bomb, always. Solves problems loudly. Art: `art/heroes/grenadier.svg`.

- **Attack: Bomb.** Lobs a small bomb that bursts where it lands in grey smoke, staggering.
- **Big Bomb** (11s). Lobs a huge bomb that lands and sits fizzing (30 health): it goes off 2s after landing, or the moment it is broken. I: A huge blast. II: It burns. III: It scatters four small bombs too.
- **Sticky Bomb** (10s). Sticks a bomb to an enemy in a splat of green goo; it goes off 2s later. I: It blows after 2s. II: A bigger blast. III: Two sticky bombs.
- **Blast Off** (12s). Drops a bomb at his own feet and rides the blast out of trouble. I: Throws him clear and hurts those near. II: The blast staggers. III: He lands with a second blast.
- **Trait: Powder Keg.** Whatever he kills blows up a moment later, hurting and staggering those round it: one blast sets off the next through a pack.

## Harpooner (`harpooner`, ranged, 700 gold)
A yellow sou'wester, a puffy grey moustache, a barbed harpoon on a rope. Art: `art/heroes/harpooner.svg`.

- **Attack: Harpoon.** The barbed harpoon thrown on its rope: it tugs the enemy a little way in, and is hauled back.
- **Reel In** (10s). Harpoons a far enemy, the harpoon stuck in it and the rope across the floor, and hauls: a small one is dragged to him, a big one drags him to it. I: Drags it in (or him to it). II: It's staggered when it lands. III: The rope holds it near him for 4s.
- **Rogue Wave** (12s). Calls up a curling wave of sea water that rolls out in front of him; each enemy is struck when the crest reaches it, harder and further the closer it stood, and soaked. I: Soaks and throws them back. II: A bigger wave. III: It leaves water on the floor.
- **Drop Anchor** (14s). Heaves a great iron anchor off his shoulder on its chain: it arcs over and crashes down on the enemies. I: A heavy crash that stuns those under it. II: Wider. III: The chain sweeps round first, knocking back.
- **Trait: Old Salt.** Can't be soaked, and hits wet enemies 20% harder.

## Javelin Huntress (`huntress`, ranged, 700 gold)
A coral headband, a ponytail, a bundle of javelins. Runs prey down. Art: `art/heroes/huntress.svg`.

- **Attack: Javelin.** A hard-thrown javelin that knocks its target back; every third is a serrated razor javelin that makes it bleed.
- **Spear Lunge** (9s). Lunges spear-first straight through a line of enemies, striking every one she passes. I: One lunge. II: It staggers. III: Two charges: the second lunge comes straight after.
- **Bound** (8s). Leaps back out of reach and hurls a big javelin at the top of the leap. I: A leap back and a heavy javelin. II: The javelin pierces. III: She lands lightly: 2s faster.
- **Javelin Rain** (13s). Hurls javelins high into the air: they come down on the enemies round her target. I: Three javelins. II: They stagger. III: Five javelins.
- **Trait: Finisher.** Hits enemies below half health 25% harder.

## Marksman (`marksman`, ranged, 1050 gold)
A cavalier hat with a cream plume, a grey moustache, a very long musket. One shot, well placed. Art: `art/heroes/marksman.svg`.

- **Attack: Musket.** One long, hard shot.
- **Aimed Shot** (10s). Stands stock still, aims, and fires a shot that goes clean through and leaves its target Targeted (a crosshair): it takes 20% more, its dashes and leaps fall short, and his bullets go on through it. I: Two and a half times the damage through the first enemy. II: Through everything in the line. III: Knocks out the first one hit.
- **Bayonet** (8s). Lunges with the bayonet fixed into whatever got too close: a long thrust and a heavy shove. I: A thrust and a big shove. II: It staggers. III: Then a shot at it point blank.
- **Ricochet** (12s). A shot that glances off one enemy onto the next, only ever on ahead (never turning back more than a little). I: Bounces three times. II: Five times. III: Each bounce hits harder than the last.
- **Trait: Long Shot.** He reaches 40% further than anyone, and his shots hit up to 60% harder the nearer the edge of his reach.

## Ninja (`ninja`, ranged, 1050 gold)
Charcoal hood, crimson scarf, a shuriken in each hand. Hard to pin down. Art: `art/heroes/ninja.svg`.

- **Attack: Shuriken.** Shuriken thrown one, then two at a time, then three, over and over.
- **Kunai Rain** (9s). Springs up and flings a ring of kunai down all round her. I: Eight kunai. II: Twelve. III: They poison.
- **Substitution** (12s). When a blow lands, it was a log all along: a puff of smoke, the log tumbling where she stood, and she is somewhere else. I: Escapes one blow. II: The smoke blinds those near. III: Ready again much sooner.
- **Caltrops** (12s). Flings a handful of iron caltrops out all round her; each one bites the first foot that steps on it: a little damage and a stagger. I: Nine caltrops. II: Fourteen, further out. III: They poison.
- **Trait: Assassin.** Her shuriken hit 50% harder from behind.

## Pirate (`pirate`, skirmish, 700 gold)
Tricorn, cutlass, flintlock. Fights dirty, drinks worse, calls in the ship's guns. Art: `art/heroes/pirate.svg`.

- **Attack: Cutlass.** Fast backhand cutlass slashes.
- **Point Blank** (7s). Jams the flintlock against an enemy and fires in a cloud of smoke: a big hit and a shove, and it is left Targeted (a crosshair). I: A big hit and a shove. II: It staggers. III: The second pistol at another enemy.
- **Grog** (16s). Stops for a long swig from the bottle: heals 25%, and things hurt less while she sways about tipsy. I: Takes 20% less for 5s. II: Nothing knocks her about meanwhile. III: She tosses a bottle to a hurt friend too.
- **Broadside** (15s). Whistles to the ship out of sight: cannonballs come in high from the edge of the room and land round a spot. I: Three cannonballs. II: Bigger blasts. III: Five.
- **Trait: Plunder.** With her in the party, one enemy in three that falls spills extra coins. A gatherer: on the wagon road she goes for loose gold before a fight, and further for it.

## Slinger (`slinger`, ranged, 350 gold)
A shepherd in a ram's fleece with a sling and a crook. Stones, and the flock behind him. Art: `art/heroes/slinger.svg`.

- **Attack: Sling.** A whirl and a stone; one in four a big stone that staggers. Close up, a crack with the crook.
- **Stunning Stone** (8s). Whirls the sling hard over his head and lobs a big stone high: it comes down on the enemy's head. BONK. I: Stunned for 0.9s. II: Stunned for 1.3s. III: It bounces on to a second head.
- **Ram** (13s). Whistles, and a big woolly ram comes charging up from behind him, head down, bowling through the line and tossing them aside. I: One ram. II: It staggers. III: Two rams.
- **Counting Sheep** (12s). Little sheep come bounding over the enemies round a spot, one after another: each one that jumps over them makes them sleepier, until they drop off. I: Five sheep. II: Eight sheep. III: Each one counts for more.
- **Trait: Watchful.** Allies near him shake off stuns and sleep 40% faster.

## Trapper (`trapper`, ranged, 700 gold)
A fur cap with the flaps down, a short rifle and a jaw trap. Catches things. Art: `art/heroes/trapper.svg`.

- **Attack: Shotgun.** A short-range blast of six pellets.
- **Jaw Trap** (9s). Sets a steel jaw trap where the enemies are coming; the first to step in is Trapped: it can't move, turn or use an ability, only strike straight ahead. A trap never takes what another trap holds. I: Holds it for 2s. II: Holds 3s and bites harder. III: Two traps.
- **Double Barrel** (11s). Both barrels at once: a wide cone of heavy pellets that blows the enemies back and him a step back too. I: Twelve pellets. II: They stagger. III: Those close are knocked down.
- **Bush** (14s). Turns into a bush: no enemy can pick him out while he creeps away from them, healing a little. I: A bush for 3.5s. II: For 5s. III: He heals faster.
- **Trait: Trapper's Eye.** Enemies that are held or rooted take 30% more from him.

## Gladiator (`gladiator`, melee, 700 gold)
A crested bronze helm, a gladius and a little round shield. Plays to the crowd. Art: `art/heroes/gladiator.svg`.

- **Attack: Gladius.** A slash, then a stab, over and over.
- **Spear of Ares** (10s). Hurls a great spear that goes through the whole line. I: Through everything in the line. II: It staggers. III: It nails the last one hit to the spot.
- **Arena** (14s). Draws a ring in the sand round him and his foe: for 5s everyone else is pushed out and kept out, and no shot can cross it. One on one. I: A ring for 5s. II: He heals 15%. III: Each blow he takes meanwhile is answered.
- **Shield Rush** (9s). A long rush behind the round shield: the first one it meets is carried along on it and slammed down at the end, staggered. I: A long rush and a slam. II: The rush knocks aside what else it meets. III: Stuns the one slammed.
- **Trait: Duelist.** One on one, with no other enemy on him, he hits his foe 35% harder and takes 25% less from it.

## Jester (`jester`, skirmish, 1050 gold)
A three-pointed cap with bells and a marotte on a stick. Makes enemies look foolish, then fight each other. Art: `art/heroes/jester.svg`.

- **Attack: Marotte.** A bonk with the jester's stick; each one leaves a little of something odd on it (a random status).
- **Swap** (11s). A puff of confetti and he trades places: with a friend in trouble (it is hasted and shielded) or, if none, with an enemy (a shooter first), which is left confused. I: Haste 3.5s, a shield of 20 / confused. II: Haste 5s, a shield of 35 / more confused. III: The enemy is stunned too.
- **Befuddle** (10s). When a blow is about to land on him, he is behind whoever swung it instead, and boots it forward, confused. I: Ready every 10s. II: Every 8s. III: Every 6s, and the kick hurts more.
- **Juggling Act** (10s). Throws his juggling balls straight out: they go through whatever they meet and bounce off the walls three times. I: Three balls. II: They daze: slowed. III: Four balls, and the first one each ball hits is whisked to where it next bounces.
- **Trait: Pratfall.** A quarter of the blows swung at him miss, and whoever swung is spun round to face away.

## Samurai (`samurai`, melee, 1050 gold)
An indigo kabuto with gold horns and a long katana. Waits, then cuts. Art: `art/heroes/samurai.svg`.

- **Attack: Katana.** A clean, wide cut, stepping in with it.
- **Iaido** (10s). Settles, the blade half drawn, light gathering on it; then he is simply on the far side of the enemies in his line. Each one he passed through is staggered a moment, then takes the cut: a tenth of its health and more. I: One cut through. II: Staggers them harder. III: He cuts back through again.
- **Focus** (12s). Settles into his guard: once a second his blade turns a blow aside, and each one turned makes his next cut 40% harder. I: For 5s. II: For 7s. III: For 9s.
- **Crescent Cut** (11s). Darts to an enemy and cuts it down with one heavy stroke: a tenth of its health and more. I: One heavy cut. II: It staggers. III: If it kills, he darts on to the next.
- **Trait: Keen Edge.** Every blow also takes 3% of its target's greatest health (a boss 1%).

## Valkyrie (`valkyrie`, support, 1050 gold)
A winged helm, long plaits and a big spear. Carries the fallen back into the fight. Art: `art/heroes/valkyrie.svg`.

- **Attack: Spear.** A long spear thrust.
- **Valkyrie's Call** (30s). Flies to a fallen friend and brings it back to its feet in a burst of light that throws the enemies round back and makes them radiant. I: Back up at 25% health, once a room. II: At 40%. III: She takes it up and flies the two of them clear of the fight.
- **Spear of the Sky** (9s). Flies spear-first along the line to the friend most hurt, striking every enemy in the way, and cleanses and steels that friend (hasted, a shield). I: A shield of 28. II: The strikes shock. III: A shield of 45.
- **Sky Dive** (12s). Up on her wings for a moment, then down beside the friend most beset in a burst of light: the enemies round are struck and made radiant. I: A dive and a burst. II: It staggers those round. III: She heals 15% on landing.
- **Trait: Light of Valhalla.** While a friend is near her, she and the friends near heal 0.9% a second, a soft glow under her. She revives the fallen twice as fast, at 30% health.

## Engineer (`engineer`, ranged, 1050 gold)
An orange work suit, a welding mask pushed up and a very big wrench. Builds a turret and keeps it running. Art: `art/heroes/engineer.svg`.

- **Attack: Wrench and cogs.** Close up, a clanging swing of the wrench; further off, a cog thrown that bounces on to a second enemy.
- **Deploy Turret** (20s). Throws a turret into a spot round her: it lands, turns slowly to the nearest enemy and fires in rapid bursts of five, its barrels spinning. I: One turret for 10s. II: It fires faster and lasts 16s. III: Two turrets.
- **Tinker** (16s). Bolts together one of four towers on the spot: a torcher (very tough from the front, weak behind, turning slowly, a jet of fire out of its front), a tesla (chain lightning), a snowball mortar, or a medbay (when friends are hurt) that sends out wobbly little drones that fly to them and heal them. I: A tower for 9s. II: For 12s. III: The medbay's drones heal half as much again.
- **Wind-up Drones** (12s). Throws little wind-up drones out round her; they waddle slowly at the nearest enemy and pop, shocking. I: Four drones. II: They shock harder. III: Six drones.
- **Trait: Overclock.** When none of her abilities is ready, one of them at random comes round twice as fast.

## Werewolf (`werewolf`, melee, 1050 gold)
A woodsman with a hatchet and a torn red shirt. Then, when it matters, a great grey wolf. Art: `art/heroes/werewolf.svg`, and `art/heroes/werewolf-beast.svg` (Werewolf).

- **Attack: Hatchet.** A woodsman's chop. As a wolf: quick raking claws with either paw.
- **Turn** (22s). Lets the wolf out: bigger, faster, the claws coming twice as fast as the hatchet. A wolf can't be healed. I: A wolf for 10s. II: For 14s. III: The claws make them bleed.
- **Frenzy** (14s). Always on once learned. As a wolf, each blow in a row comes faster than the last; as a man, each blow heals him, more the lower he is. I: Up to 60% faster / heals up to 6%. II: Heals up to 9%. III: At full speed he howls: everything near is staggered.
- **Pounce** (10s). As a man, a dash forward and a wide cleave at the end of it. As a wolf, a leap onto an enemy that pins it, and haste. I: Pins it for 1s. II: Pins it for 1.6s; the cleave staggers. III: Mauls it while it's pinned.
- **Trait: Back From the Wild.** When the wolf falls, he gets up again as a man at 10% health, every time.

## Enchantress (`enchantress`, support, 1050 gold)
Rose silk, a heart-shaped locket and a smile. Nobody who meets her wants to hurt her, and before long they fight for her. Art: `art/heroes/enchantress.svg`.

- **Attack: Blown kiss.** A slow pink heart that floats to its target: a little damage, and a little charm.
- **Heartstring** (13s). Ties a pink thread to the most dangerous enemy near her: it is drawn out of its pack towards her while charm pours into it, until it fights for the party. I: The thread holds 4s. II: It holds 6s. III: Once that enemy is won, the thread jumps to the next one.
- **Sweetheart** (14s). Blows a kiss to the friend taking the most blows: whoever keeps hitting that friend falls for them, and can't bring itself to hit them any more. I: For 6s. II: For 8s, and the kiss heals 10%. III: Two friends.
- **Heartbreak** (15s). Breaks every heart she has won at once. The charmed take damage (more the more they were charmed) and swoon; the enthralled come to their senses in a burst that hurts their own friends. I: They swoon for 1s. II: For 1.6s. III: Every broken heart heals the party a little.
- **Trait: First Impression.** The first blow any enemy lands on her charms it a lot: it soon can't bring itself to hit her again.

## The Mob (`mob`, melee, 1050 gold)
Four angry villagers with a torch, a pitchfork, an axe and a dagger. One hero, four pairs of boots. Art: `art/heroes/standin/mob-torch.svg`.

- **Attack: Torch, pitchfork, axe and dagger.** Each of the four strikes with what it carries: the torch burns, the pitchfork jabs from further off and shoves, the axe is slow and heavy, the dagger is quick and makes them bleed. Each is about a third of a fighter.
- **Pile On** (10s). All four jump on one enemy, hold it down by the arms and legs and lay into it, each in turn with what it carries: it can't move, turn, strike or use anything, and everyone hits it 25% harder while they hold it. I: They hold it for 2.2s. II: For 3s. III: When they let go they throw it: it flies, and it is knocked out where it lands.
- **Surround** (13s). The four run out to four sides of the enemies and close in at once, shoving everything they meet into one knot in the middle. I: Herds the enemies together; each one shoved is hit. II: The torch sets the ground alight where they meet, for 4s. III: Those herded together are knocked off their feet for 1.2s.
- **Scatter** (16s). They bolt in four directions. Whoever was after them loses them, and for 3s each runs on its own and takes 50% less; then they find each other again and get their breath back. I: Healed 10% as they regroup. II: Healed 20%. III: Apart, each strikes twice as fast.
- **Trait: Strength in Numbers.** Each of the four hits 9% harder, and is hurt 7% less, for every other one of them shoulder to shoulder with it: 27% and 21% when all four stand together, nothing when they are scattered.

## Clockmaker (`clockwork`, support, 1050 gold)
A brass key on his back and a pocket watch that is never wrong. He turns clocks back, slows them, and stops them. Art: `art/heroes/standin/clockwork.svg`.

- **Attack: Clock hand.** Throws a brass clock hand. Whatever it hits loses a moment: its next blow comes a third of a second later.
- **Rewind** (14s). Turns one friend's clock back: they are put where they stood a few seconds ago with the health they had then, and whatever statuses they have picked up since are gone. I: Back 3s (at most 35% of their health comes back). II: Back 5s (at most 50%). III: Once a room, a friend who has just fallen is turned back to before the blow that felled them.
- **Slow Time** (15s). A bubble of slow time over the enemies: inside it they walk, strike, wind up and recharge at 45% speed, and their shots crawl. I: For 5s. II: Time runs fast for friends inside it: they move, strike and recharge 30% faster. III: Wider, and for 7s.
- **Stop the Clock** (20s). Stops the room's clock. Every enemy and every enemy shot hangs where it is, mid-step, mid-swing, mid-air, while the party carries on. I: For 1.4s (bosses 0.6s). II: For 2s. III: When time starts again each of them takes at once a third of what it was dealt while it stood still.
- **Trait: Spare Second.** Once a room, the blow that would bring him down never happens: he is back where he stood three seconds ago, with the health he had then.

## Air Mage (`airMage`, caster, 700 gold)
Sky-blue robes that never hang still. Pushes, lifts and spins the enemy until they don't know which way is up. Art: `art/heroes/standin/airMage.svg`.

- **Attack: Gust.** A crescent of wind that goes through the first enemy to the one behind: a small shove, and a little Whirled on each.
- **Gale** (9s). A wall of wind down a wide lane in front of her: every enemy in it is blown far back and whirled, and whatever is blown into a wall or a rock is hurt by it. I: Blows them back and whirls them. II: Enemy shots in the lane are blown back at whoever loosed them. III: A wider lane, and they are whirled half as much again.
- **Updraft** (12s). A column of rising air under an enemy lifts it off its feet: it hangs there, helpless, then is dropped. I: One enemy, in the air for 1.8s; the fall hurts and staggers. II: Everything close to it is lifted too. III: They are slammed down: knocked out, and a whirled one bursts.
- **Cyclone** (15s). A whirlwind that wanders after the enemies: it drags whatever is near into itself, batters it and whirls it until it is flung out. I: For 5s. II: A stronger pull, and for 7s. III: When it dies down it bursts: everything in it is thrown outwards.
- **Trait: Eye of the Storm.** When an enemy she has whirled is flung about, a clap of wind goes off round it: its neighbours are hit and whirled too.

## Warden (`warden`, tank, 1050 gold)
Iron plate, a ring of keys and a great deal of chain. Nothing he has locked up has ever got out. Art: `art/heroes/standin/warden.svg`.

- **Attack: Iron chain.** A weighted chain swung in a wide arc. Every blow closes the irons a little further: Shackled builds on what it hits.
- **Manacles** (10s). Throws a pair of manacles at the enemy with the most to lose: a caster, a shooter, whatever is about to do something. They snap shut and it is Shackled at once: no basic attacks, and its abilities set back. I: Shackles one enemy. II: The chain is staked to the floor: it can't move either. III: A second pair flies on to the next enemy.
- **Nullify** (16s). Raises the null key. In a wide ring round him nothing works: enemy shots drop out of the air, what enemies were winding up is broken off, and they can use no ability for a while. I: Breaks off their moves and silences them for 3s. II: It strips what protects and strengthens them, and washes the statuses off friends in the ring. III: Silenced for 5s, and the silenced take 20% more.
- **Chain Gang** (14s). Chains fly from his belt to the enemies round him and lock on. They are leashed to him: they can't get further than the chain allows, they have to fight him, they strike 25% slower with the chain dragging at them, and he takes 35% less while he holds them. I: Three enemies, for 5s. II: Five enemies. III: At the end he hauls them all in at once and they are knocked reeling.
- **Trait: Ball and Chain.** Whatever he shackles drags an iron ball as well: it moves 40% slower and can't dash, leap or charge until the irons come off.

## Telekinetic (`telekinetic`, caster, 1050 gold)
Never lifts a finger. Lifts everything else: rocks, crates, enemies, the arrows meant for her friends. Art: `art/heroes/standin/telekinetic.svg`.

- **Attack: Flung stone.** A loose stone lifts off the floor beside her and is flung at the enemy.
- **Hurl** (9s). Picks up the nearest heavy thing, a rock or a crate standing in the room, a body off the floor, or a slab torn out of the floor itself, and hurls it into the enemies. It lands hard on everything there. I: One thing thrown. II: A second straight after it. III: It bursts into shrapnel where it lands: a wider blast that staggers.
- **Levitate** (13s). Lifts an enemy off the floor and holds it helpless in the air, then throws it at its own friends: it and whatever it lands on are hurt. A boss is too heavy to lift: it is pressed down and slowed instead. I: Held for 2s, then thrown. II: Held for 3s, and it takes 20% more while it hangs there. III: Two enemies at once.
- **Mind Shield** (16s). A dome of force round her and the friends beside her. Enemy shots that reach it stop dead and hang in the air, enemies that walk into it are pushed back out, and every blow that does land on someone inside is 30% softer. She stands still to hold it; when it drops, everything it caught flies back at whoever loosed it. I: For 3.5s. II: For 5s, and what it throws back hits 50% harder. III: It ends with a shove: every enemy near is thrown back and staggered.
- **Trait: Poltergeist.** When an enemy dies near her, its body is flung at the nearest of its friends.

## Earth Mage (`earthMage`, caster, 700 gold)
Bare feet, clay to the elbows. The floor does what she tells it: it shakes, it bites, it stands up and gets in the way. Art: `art/heroes/standin/earthMage.svg`.

- **Attack: Rock.** A lump of rock punched out of the floor and thrown: a solid knock, and a little stagger.
- **Earthquake** (14s). The floor under the enemies shakes itself to pieces: everything on it is slowed to a stumble, staggered again and again, and hurt. I: A quake for 3s. II: Wider, and for 4.5s. III: It ends with the floor heaving up: everything on it is thrown off its feet.
- **Spike Chain** (9s). A line of stone spikes bursts out of the floor one after another, running from her to an enemy; from there it runs on to the next enemy, and the next. I: Runs through three enemies. II: Through five. III: The last spike under each holds it fast: rooted for 1.4s.
- **Stone Wall** (15s). A wall of stone slabs heaves up out of the floor across the way of whoever is coming for the party, striking and throwing back whatever stands where it comes up. It is a real wall: nothing walks through it and the enemy can't shoot through it; the party shoots over it. I: Stands for 6s. II: A longer wall, for 8s. III: When it comes down it falls on the enemies' side: those near it are hurt and staggered.
- **Trait: Aftershock.** The ground remembers. A moment after one of her abilities hurts an enemy, a stone spike comes up under it.
