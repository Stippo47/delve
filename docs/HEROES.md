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
