// The rest of the picked heroes (round 10, lane H): pure data, merged into HEROES by heroes.js. Same shape as there
// (stats, attack, 3 abilities with 3 tiers, 1 trait, unlock = the gold price / 350), plus:
//   fun      the About page's fun line
//   style    pose touches parts.js reads (hand: the arm that strikes, off: 'shield', dual, glow, bow)
//   proj     [kind, colour] of the plain shot for a ranged hero without its own attack
//   form     a second shape (the Werewolf): { id, name, art, stats, anim }
//   summons  defs for what it brings into the fight (the Engineer's turret)
// Each ability also carries tags (d damage, h healing, s statuses: which web nodes its arm gets) and glyph (its HUD
// icon, icons.js). The kits are in kits2.js, the looks in fx2.js, the kits written out in docs/HEROES.md.

import { HEROES3 } from './heroes3.js'; // round 15 (lane N): six more heroes; their ability glyphs join GLYPH2 below
import { HEROES_WATER } from './heroes-water.js'; // round 17 (lane water17): the Water Mage's glyphs too
export const HEROES2 = {
  // ------------------------------------------------------------------ batch 1: the knights and the bear
  oldguard: {
    name: 'Old Guard', art: 'art/heroes/oldguard.svg', role: 'tank', unlock: { gems: 2 },
    blurb: 'A greatsword held in both hands, and forty years of knowing where to put it.',
    fun: 'Has outlived three kings, two dragons and every sergeant who ever shouted at him. Still gets up at dawn.',
    stats: { hp: 165, speed: 50, r: 34, vr: 24, turn: 3, accel: 160, face: 3.2, mass: 2.4, range: 30, atkCd: 1.5, dmg: 15, knock: 190, arc: 2.3 },
    weapon: 'great',
    attack: { name: 'Greatsword', anim: 'swing', desc: 'A slow, wide two-handed cut in front.' },
    abilities: [
      { id: 'greatSweep', name: 'Great Sweep', cd: 8, tags: 'ds', glyph: 'swirl', desc: 'Draws the greatsword back, then sweeps it round in one huge arc in front of him.',
        tiers: ['Hits everything in a wide arc and knocks it back.', 'Staggers what it hits.', 'Sweeps straight back the other way.'] },
      { id: 'rallyCry', name: 'Rally', cd: 15, tags: 'h', glyph: 'up', desc: "An old soldier's shout: allies near him shake off stuns and staggers and stand firm.",
        tiers: ['Clears stuns, roots and stagger; nothing knocks them back for 5s.', 'Haste too: they move and strike 30% faster, and it all lasts 8s.', 'Heals them 8% too.'] },
      // round 13: Parry takes Pommel Strike's place (the designer: "Maybe instead of pommel strike"); the id stays for saves
      { id: 'pommelStrike', name: 'Parry', cd: 9, tags: 'd', glyph: 'shield', desc: "Sets the greatsword across him: the next blow or shot that reaches him within 4s is caught. A shot flies back at whoever loosed it; a blow's force goes back into the one who struck.",
        tiers: ['One parry.', 'Two parries.', 'What he sends back hits 60% harder.'] },
    ],
    trait: { id: 'lastStand', name: 'Last Stand', desc: "Once a room, when he is the last of the party standing: he can't be stopped or knocked about and is hasted for 10s, and all his abilities are ready again at once." },
  },
  dame: {
    name: 'Dame', art: 'art/heroes/dame.svg', role: 'tank', unlock: { gems: 2 },
    blurb: 'Kite shield, leaf sword, perfect manners. Answers every blow.',
    fun: 'Wears the tiara into battle because nobody has yet been brave enough to tell her not to.',
    stats: { hp: 155, speed: 58, r: 33, vr: 23, turn: 3.6, accel: 190, face: 3.8, mass: 2, range: 24, atkCd: 1.0, dmg: 11, knock: 120, arc: 1.6 },
    weapon: 'blade', style: { hand: 'arm-l', off: 'shield', backhand: true }, // round 13: "Should swipe the opposite way"
    attack: { name: 'Leaf sword', anim: 'swing', desc: 'A quick, neat backhand cut.' },
    abilities: [
      { id: 'riposte', name: 'Riposte', cd: 9, tags: 'ds', glyph: 'shield', desc: 'Raises the shield; every blow it stops from the front is answered with a thrust.',
        tiers: ['For 1.6s.', 'The answers stagger.', 'For 2.6s, and she turns to meet blows from any side.'] },
      { id: 'challenge', name: 'Challenge', cd: 14, tags: 'h', glyph: 'dagger', desc: 'Dashes to the friend nearest death, shoves them clear of the fight, patches them up and stands in the way: the nearest enemy has to turn on her.',
        tiers: ['Heals them 10%; the nearest enemy must fight her for 4s.', 'Heals them 20%.', 'Every enemy near must fight her.'] },
      { id: 'disarm', name: 'Disarm', cd: 11, tags: 's', glyph: 'swirl', desc: 'A flick of the blade at an enemy\'s weapon hand: its blows land far softer for a while.',
        tiers: ['Its blows do 50% less for 5s.', 'It attacks slower too.', 'Every enemy in front of her.'] },
    ],
    trait: { id: 'grace', name: 'Grace', desc: 'Every third blow she lands is a critical hit.' },
  },
  griffon: {
    name: 'Griffon', art: 'art/heroes/griffon.svg', role: 'tank', unlock: { gems: 3 },
    blurb: 'Winged helm, warhammer, shield. Drops out of the sky onto whoever is bothering his friends.',
    fun: 'The wings on the helm are not real. Nobody has told the helm.',
    stats: { hp: 175, speed: 58, r: 34, vr: 24, turn: 3.4, accel: 180, face: 3.6, mass: 2.2, range: 24, atkCd: 1.3, dmg: 16, knock: 190, arc: 1.7, aoe: 40 },
    // round 13: "Flip his sprite. Should be an aoe slam on the ground like the berserker" (his own hammer slam, fx2 SLAM2)
    weapon: 'heavy', style: { hand: 'arm-l', off: 'shield', flip: true, slam: 'hammer' },
    attack: { name: 'Warhammer', anim: 'swing', desc: 'A heavy hammer slammed into the floor in front: everything there is hit.' },
    abilities: [
      { id: 'swoop', name: 'Swoop', cd: 11, tags: 'ds', glyph: 'up', desc: 'A gust bursts round him as he beats his wings and flies to the ally in the most trouble; he lands spinning, and a swirl of wind whirls their attackers and throws them back.',
        tiers: ['Flies to a hurt ally; the landing whirls and throws back.', 'The landing staggers.', 'The ally takes 40% less damage for 3s.'] },
      { id: 'hammerThrow', name: 'Stormhammer', cd: 9, tags: 'ds', glyph: 'bolt', desc: 'Hurls the hammer down a line; it spins out and comes back to his hand, whirling everything it hits both ways.',
        tiers: ['Out and back; it whirls what it hits.', 'A small thunderclap bursts round each one it hits.', 'It flies from one enemy to the next, out and back.'] },
      { id: 'wingShield', name: 'Wing Guard', cd: 13, tags: 'd', glyph: 'shield', desc: 'Spreads his wings round him for 4s: he takes 25% less, and whoever strikes him is blasted far back (further if whirled).',
        tiers: ['Strikers are blasted back.', 'Strikers that slam into a wall or a pillar are hurt.', 'They burst when they slam into it, hurting those near.'] },
    ],
    trait: { id: 'skyborn', name: 'Skyborn', desc: 'Can\'t be rooted or entangled.' },
  },
  bulwark: {
    name: 'Bulwark', art: 'art/heroes/r12/bulwark.svg', role: 'tank', unlock: { gems: 2 },
    blurb: 'A winged spear and a big shield. Nothing gets past the end of the spear.',
    fun: 'Has stood in the same doorway for so long that the door now leans on him.',
    stats: { hp: 160, speed: 52, r: 34, vr: 24, turn: 3.1, accel: 160, face: 3.3, mass: 2.4, range: 40, atkCd: 1.2, dmg: 12, knock: 170, arc: 0.9 },
    weapon: 'thrust', style: { off: 'shield', reach0: 1.15 }, // round 13: "Starts too close to them" (the stab starts out at the spear's head)
    attack: { name: 'Winged spear', anim: 'thrust', desc: 'A long thrust that reaches past the front line.' },
    abilities: [
      { id: 'brace', name: 'Brace', cd: 10, tags: 'ds', glyph: 'shield', desc: 'Sets the spear and waits: whatever comes into its reach is struck hard and stopped dead.',
        tiers: ['For 3s, the first enemy to come in.', 'Every enemy that comes in.', 'They are pinned to the spot for 1s.'] },
      { id: 'shieldWall', name: 'Shield Wall', cd: 15, tags: 'd', glyph: 'wall', desc: 'Plants the shield: he can\'t be moved, and allies close to him take less damage.',
        tiers: ['For 5s; allies near take 30% less.', 'For 7s.', 'Enemies that press against the shield are shoved back.'] },
      { id: 'impale', name: 'Impale', cd: 9, tags: 'ds', glyph: 'dagger', desc: 'A heavy thrust that pins one enemy to the spot.',
        tiers: ['Pinned for 1.5s.', 'It takes 25% more while pinned.', 'Pinned for 2.5s and staggered.'] },
    ],
    trait: { id: 'returnThrust', name: 'Return Thrust', desc: 'Every blow he takes winds him up, up to five. His next thrust lets it go: twice the reach, through everything in a line, and 30% harder for each.' },
  },
  bearskin: {
    name: 'Bearskin', art: 'art/heroes/r12/bearskin.svg', role: 'melee', unlock: { gems: 2 },
    blurb: 'A studded club and a bear on his back. Hits like the bear did.',
    fun: 'The bear was not killed. The bear lent him the coat and is waiting outside.',
    stats: { hp: 135, speed: 60, r: 34, vr: 24, turn: 3.4, accel: 190, face: 3.6, mass: 2, range: 26, atkCd: 1.35, dmg: 16, knock: 170, arc: 1.8 },
    weapon: 'heavy',
    attack: { name: 'Studded club', anim: 'swing', desc: 'A heavy club blow.' },
    abilities: [
      { id: 'maul', name: 'Maul', cd: 8, tags: 'ds', glyph: 'fist', desc: 'Raises the club high and brings it straight down on one enemy, cratering the floor.',
        tiers: ['Stuns for 1s.', 'Stuns for 1.6s.', 'The ground cracks: everything round it is staggered.'] },
      { id: 'hibernate', name: 'Hibernate', cd: 18, tags: 'h', glyph: 'sleep', desc: 'Curls up under the pelt and falls asleep. Asleep, however it happens, he heals 7% a second; this sleep holds until the blows he takes outweigh the healing, or he is whole.',
        tiers: ['He sleeps and heals.', 'Nothing can touch him with a status while he sleeps.', 'He wakes with a roar that throws enemies back.'] },
      { id: 'bearRoar', name: 'Bear Claws', cd: 13, tags: 'd', glyph: 'paw', desc: 'Puts the club away, dashes in and rakes an enemy with a flurry of claw swipes.',
        tiers: ['Six swipes.', 'The swipes catch everything in front of him.', 'Six more, and a bite at the end that makes it bleed.'] },
    ],
    trait: { id: 'thickHide', name: 'Thick Hide', desc: 'Statuses build half as fast on him.' },
  },
  // ------------------------------------------------------------------ batch 2: warhelm, the rogues, the diggers
  warhelm: {
    name: 'Warhelm', art: 'art/heroes/r12/warhelm.svg', role: 'melee', unlock: { gems: 2 },
    blurb: 'A beard, a helm, a hammer the size of a sheep. Knocks things a long way.',
    fun: 'Nobody has seen his face. There is a rumour it is also a helm.',
    stats: { hp: 140, speed: 56, r: 34, vr: 24, turn: 3.2, accel: 170, face: 3.4, mass: 2.2, range: 28, atkCd: 1.45, dmg: 17, knock: 230, arc: 1.8, aoe: 46 },
    weapon: 'heavy', style: { hand: 'arm-l', slam: 'hammer' }, // round 13: "Needs to do a slam on the ground"
    attack: { name: 'Warhammer', anim: 'swing', desc: 'A huge hammer slammed into the floor in front, knocking back everything there.' },
    abilities: [
      { id: 'thunderBlow', name: 'Thunder Blow', cd: 9, tags: 'ds', glyph: 'fist', desc: 'Lunges and headbutts the enemy in front: a heavy blow that staggers it and throws it far back.',
        tiers: ['A headbutt that staggers and throws back.', 'It shocks.', 'The one thrown knocks down whatever it hits.'] },
      { id: 'warHorn', name: 'Storm Born', cd: 16, tags: 'ds', glyph: 'bolt', desc: 'Lets go of the hammer: it circles him in the air and darts at an enemy near every second, while he fights with his fists, every punch shocking and knocking back.',
        tiers: ['For 6s.', 'For 9s.', 'Each dart of the hammer bursts in a thunderclap.'] },
      { id: 'skullSplitter', name: 'Skull Splitter', cd: 10, tags: 'ds', glyph: 'fist', desc: 'Hurls the hammer ahead, shocking everything it passes, then leaps after it and slams down where it fell.',
        tiers: ['A throw, a leap and a slam.', 'The slam staggers.', 'A wider slam that stuns.'] },
    ],
    trait: { id: 'ironWill', name: 'Iron Will', desc: 'Below 30% health he can\'t be stunned or staggered and hits 25% harder.' },
  },
  rogueBandit: { // (not 'bandit': that id is the Wildwood's enemy, and the two overwrote each other)
    // round 13: "REDO... Don't like trait. Overall don't like hero": a new kit (the ids stay for saves)
    name: 'Bandit', art: 'art/heroes/bandit.svg', role: 'skirmish', unlock: { gems: 1 },
    blurb: 'A cutlass, a red bandanna and very quick hands. Takes your weapon, your footing and your nerve, in that order.',
    fun: 'Has never stolen from a friend. Has made a great many friends very briefly.',
    stats: { hp: 105, speed: 92, r: 29, vr: 20, turn: 6.5, accel: 400, face: 6.5, mass: 0.9, range: 22, atkCd: 0.7, dmg: 10, arc: 1.8, dodge: 0.15 },
    weapon: 'blade',
    attack: { name: 'Cutlass', anim: 'swing', desc: 'Quick, wide cutlass slashes.' },
    abilities: [
      { id: 'smokeBomb', name: 'Bolas', cd: 11, tags: 's', glyph: 'hook', desc: 'Whirls a bolas and lets it fly at the enemy furthest off (a shooter first): it wraps its legs and down it goes.',
        tiers: ['Tripped for 1.3s, then slowed.', 'Two bolas.', 'Down for 2s, and it drops its weapon.'] },
      { id: 'pickpocket', name: 'Dirty Trick', cd: 9, tags: 'ds', glyph: 'fist', desc: 'Three quick cuts and a kick that sends the enemy flying into its friends.',
        tiers: ['Three cuts and the kick.', 'The cuts make it bleed.', 'The kicked one, and whatever it hits, are staggered.'] },
      { id: 'lowBlow', name: "Stick 'Em Up", cd: 12, tags: 's', glyph: 'dagger', desc: 'Levels the cutlass at an enemy: hands up. It can\'t attack or use an ability while they\'re up, and everyone hits it 25% harder.',
        tiers: ['Hands up for 2.5s.', 'Two more near it put theirs up too.', 'For 3.5s.'] },
    ],
    trait: { id: 'snatch', name: 'Snatch', desc: 'Every fourth blow tears the enemy\'s weapon out of its hand and flings it away: it can\'t attack until it walks over and picks it up.' },
  },
  shade: {
    name: 'Shade', art: 'art/heroes/shade.svg', role: 'skirmish', unlock: { gems: 3 },
    blurb: 'Two mirrored daggers and a cape the colour of a shadow. Hard to find, harder to hit.',
    fun: 'Arrives before the door opens and leaves after it closes. Nobody has seen the in between.',
    stats: { hp: 100, speed: 98, r: 29, vr: 20, turn: 7, accel: 430, face: 7, mass: 0.85, range: 16, atkCd: 0.8, dmg: 8, arc: 1.4, dodge: 0.2 },
    weapon: 'twin', style: { dual: true, straight: true }, // round 13: "Should not cross blades. Attacks in 2 stabs at a time"
    attack: { name: 'Twin daggers', anim: 'thrust', desc: 'Two quick stabs, one from each hand, one right after the other.' },
    summons: { // Death Mark's shadow clones (round 13): her own figure, dark; they pass through everything (kits2.js shadowCloneBrain)
      shadowClone: { name: 'Shadow', art: 'art/heroes/shade.svg', wash: ['#140E1E', 0.78], pass: true, r: 26, vr: 20, turn: 9, accel: 600, face: 9, mass: 0.6,
        hp: 12, speed: 120, role: 'skirmish', range: 16, atkCd: 0.42, dmg: 7, arc: 1.4, attackAnim: 'thrust', style: { dual: true, straight: true }, weapon: 'twin' },
    },
    abilities: [
      { id: 'shadowWalk', name: 'Shadow Walk', cd: 11, tags: 'ds', glyph: 'dagger', desc: 'Becomes a shadow and runs straight through the enemies, cutting each one she passes. Nothing can touch her meanwhile.',
        tiers: ['One run through them.', 'The cuts curse.', 'Three runs in a row, each at another enemy.'] },
      { id: 'blackout', name: 'Blackout', cd: 15, tags: 's', glyph: 'cloud', desc: 'Snuffs out the light round her: enemies in the dark are Weakened (they deal 30% less) and she hits them 30% harder.',
        tiers: ['For 4s.', 'Bigger.', 'For 6s, and she is a shadow while it lasts.'] },
      { id: 'deathMark', name: 'Shadow Clones', cd: 14, tags: 'd', glyph: 'skull', desc: 'Her shadow splits off into copies of her that fight beside her: very fast, running straight through bodies and walls, circling their foe and stabbing, but easily broken.',
        tiers: ['Two clones for 6s.', 'Three clones.', 'They last 10s.'] },
    ],
    trait: { id: 'fade', name: 'Fade', desc: 'After 3s without attacking or being hurt she becomes a shadow: no enemy can pick her out until she strikes or uses an ability.' },
  },
  haymaker: {
    name: 'Haymaker', art: 'art/heroes/haymaker.svg', role: 'melee', unlock: { gems: 1 },
    blurb: 'A pitchfork, a straw hat, and the shoulders of a man who throws hay all day.',
    fun: 'Treats goblins the way he treats hay: in forkfuls, over the shoulder, without looking.',
    stats: { hp: 145, speed: 60, r: 32, vr: 22, turn: 3.8, accel: 200, face: 4, mass: 1.6, range: 34, atkCd: 1.1, dmg: 13, knock: 150, arc: 1 },
    weapon: 'fork', // round 13: "Should show 3 stab slashes. Should dash forwards slightly too" (fxkit: three tines; kits2: a lunge)
    attack: { name: 'Pitchfork', anim: 'thrust', desc: 'A lunging jab with the fork: three tines.' },
    summons: { // Fork Charge's slot: the hay bale he rides (kits2.js BRAINS.haybale; drawn in fx2.js)
      haybale: { name: 'Hay bale', art: 'art/summons/haybale.svg', headR: 76, ownLook: true, pass: true, r: 34, vr: 30, turn: 2, accel: 200, face: 2, mass: 6, hp: 45, speed: 60, role: 'melee', range: 0, atkCd: 999, dmg: 0, res: { burn: 3 } },
    },
    abilities: [
      { id: 'toss', name: 'Toss', cd: 9, tags: 'ds', glyph: 'up', desc: 'Forks the nearest enemy and throws it high over his shoulder: it turns head over heels and lands hard behind him.',
        tiers: ['Throws it behind him.', 'It lands harder: hurt and staggered.', 'Throws two.'] },
      { id: 'pitchHay', name: 'Pitch Hay', cd: 11, tags: 's', glyph: 'leaf', desc: 'Flings a forkful of hay over the enemies in front: they are slowed, and the dry hay catches fire easily.',
        tiers: ['Slows those in a cone for 4s.', 'Fire burns them twice as fast for 6s.', 'A wider cone, and it staggers.'] },
      { id: 'forkCharge', name: 'Hay Bale', cd: 13, tags: 'ds', glyph: 'dash', desc: 'Rolls out a big hay bale and rides it: it rolls at the enemies, turning slowly, and straight round when it hits a wall; whoever it rolls over is hit hard and thrown aside. It wears out, burns easily, and bursts into hay when it goes.',
        tiers: ['A bale for 5s.', 'For 7s.', 'It staggers what it rolls over.'] },
    ],
    trait: { id: 'hardWork', name: 'Hard Work', desc: 'Each enemy he finishes heals him 8%.' },
  },
  digger: {
    name: 'Digger', art: 'art/heroes/digger.svg', role: 'melee', unlock: { gems: 1 },
    blurb: 'A long-handled spade. Digs, flings, bats, and finds coins in the floor.',
    fun: 'Came down here looking for turnips. Found a dungeon. Kept digging.',
    stats: { hp: 115, speed: 58, r: 32, vr: 22, turn: 3.8, accel: 200, face: 4, mass: 1.6, range: 28, atkCd: 1.2, dmg: 13, knock: 160, arc: 1.7 },
    weapon: 'heavy',
    attack: { name: 'Spade', anim: 'swing', desc: 'A swing with the flat of the spade.' },
    abilities: [
      { id: 'dirtFling', name: 'Dirt Fling', cd: 9, tags: 's', glyph: 'wave', desc: "Flings clods of earth in a fan: enemies are blinded (most of their blows miss for 2.5s); friends in it are cleaned of fire and poison and get a coat of dirt.",
        tiers: ['One fling.', 'It staggers enemies.', 'Three flings in a row.'] },
      { id: 'burrow', name: 'Burrow', cd: 13, tags: 'ds', glyph: 'up', desc: 'Dives into the ground and tunnels to a far enemy, churning a trail of earth behind him, and bursts up out of the floor beside it.',
        tiers: ['He bursts up and throws enemies back.', 'The burst staggers.', 'Tunnels on to a second enemy.'] },
      { id: 'spadeBat', name: 'Bury', cd: 10, tags: 'ds', glyph: 'fist', desc: 'Slams the spade down in front of him: whatever it hits is driven into the ground, where it can neither move nor be hit until it digs itself out.',
        tiers: ['Buried for 1.5s.', 'Buried for 2.2s.', 'They come out staggered.'] },
    ],
    trait: { id: 'dirtIn', name: 'Rub Some Dirt In It', desc: 'Every ability he uses rubs dirt into him (Dirty): it soaks up the next blow, and until then fire and poison can\'t take on him, but he swings slower.' },
  },
};

// ------------------------------------------------------------------ batch 3: grandpa and the casters
Object.assign(HEROES2, {
  grandpa: {
    name: 'Grandpa Sickle', art: 'art/heroes/grandpa.svg', role: 'support', unlock: { gems: 1 },
    blurb: 'A sickle, a sheaf of wheat and a bag of bread. Feeds the party and trims the enemy.',
    fun: 'Has been telling the same story since before the dungeon was dug. It gets longer every time.',
    stats: { hp: 115, speed: 52, r: 31, vr: 22, turn: 3.8, accel: 190, face: 4, mass: 1.3, range: 22, atkCd: 1.0, dmg: 9, arc: 1.7 },
    weapon: 'scythe',
    attack: { name: 'Sickle', anim: 'swing', desc: 'A short hooked cut.' },
    abilities: [
      { id: 'breadToss', name: 'Bread Toss', cd: 8, tags: 'h', glyph: 'heart', desc: 'Lobs a warm loaf high to a hurt ally; it heals them where it lands.',
        tiers: ['One loaf: heals 20%.', 'A loaf each for two allies.', 'Warm bread: 10% more over 4s.'] },
      { id: 'harvest', name: 'Harvest', cd: 10, tags: 'ds', glyph: 'swirl', desc: 'Hurries to the friend most beset and sweeps the sickle low round his feet there, cutting at the legs of everything close.',
        tiers: ['They are slowed by half for 3s.', 'And staggered.', 'He heals 4% for each one cut.'] },
      { id: 'oldTales', name: 'Old Tales', cd: 18, tags: 'h', glyph: 'note', desc: 'Opens his old story book and tells the party one of his stories: every friend listening has its abilities come round sooner.',
        tiers: ['Each friend near: every ability 4s sooner.', '6s sooner.', 'And they heal 8%.'] },
    ],
    trait: { id: 'seenItAll', name: 'Seen It All', desc: 'Allies near him shake off stagger twice as fast.' },
  },
  alchemist: {
    name: 'Alchemist', art: 'art/heroes/alchemist.svg', role: 'caster', unlock: { gems: 2 },
    blurb: 'Wild white hair, brass goggles, a strap of flasks. Every throw is a different brew.',
    fun: 'Lost her eyebrows in the first week. Lost the lab in the second. Kept the goggles.',
    stats: { hp: 72, speed: 64, r: 30, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1, range: 210, keep: 170, atkCd: 1.3, dmg: 8 },
    style: { glow: '#9BE36B' },
    attack: { name: 'Unstable flask', anim: 'throw', desc: 'A lobbed flask that splashes where it lands; each one is a different brew: fire, frost or acid.' },
    abilities: [
      { id: 'acidFlask', name: 'Brew Pools', cd: 9, tags: 'ds', glyph: 'vial', desc: 'Throws two flasks in a spread; each bursts into a lingering pool of one of six brews: acid (eats at them, they take more), cold (chills), fire (burns), whirling (whirls and spins them), shocking (shocks) or water (soaks).',
        tiers: ['Two pools for 4s.', 'Three flasks.', 'Bigger pools, for 5s.'] },
      { id: 'elixir', name: 'Elixir', cd: 12, tags: 'h', glyph: 'vial', desc: 'Throws a bright potion to the friend who needs it, one of three: cleansed and healed if hurt or afflicted; Warded (a shield soaking up 30) and swift if being hit; hasted and enraged if fighting.',
        tiers: ['One friend: heals 14% / ward 30 / +25% damage.', 'Heals 22% / ward 45 / +35% damage.', 'It splashes every friend near the one it hits.'] },
      { id: 'bangFlask', name: 'Monstrosity', cd: 18, tags: 'ds', glyph: 'burst', desc: 'Drinks an unstable concoction and becomes a monstrosity for 8s: bigger, faster, with rapid clawing blows and a lunge; nothing can hurt her or put a status on her, she is hard to shove, but it burns through a third of her health.',
        tiers: ['8s as a monster.', 'Her blows land 25% harder.', 'Every blow puts a random status on what it hits.'] },
    ],
    trait: { id: 'catalyst', name: 'Catalyst', desc: 'The statuses she causes build 30% faster.' },
  },
  shaman: {
    name: 'Shaman', art: 'art/heroes/shaman.svg', role: 'support', unlock: { gems: 2 },
    blurb: 'A winged totem on his back and a feather spirit-stick. Calls on the ancestors and the rain.',
    fun: 'The ancestors answer every time. They mostly have notes.',
    stats: { hp: 85, speed: 62, r: 31, vr: 22, turn: 4.3, accel: 230, face: 4.4, mass: 1.2, range: 210, keep: 170, atkCd: 1.25, dmg: 7 },
    style: { hand: 'arm-l', glow: '#7FE0D0' },
    attack: { name: 'Spirit bolt', anim: 'cast', desc: 'A teal spirit; when it strikes near a hurt friend it leaps on to that friend and mends it.' },
    summons: { // round 13: the Healing Totem and the Ancestors' Call spirits (light blue; kits2.js BRAINS, fx2.js LOOK2)
      totem: { name: 'Totem', art: 'art/summons/totem.svg', headR: 66, ownLook: true, upright: true, r: 20, vr: 26, turn: 0, accel: 0, face: 0, mass: 60, hp: 50, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 },
      spiritBear: { name: 'Spirit bear', art: 'art/summons/spirit-bear.svg', headR: 66, ownLook: true, r: 30, vr: 26, turn: 4, accel: 260, face: 4, mass: 3, hp: 45, speed: 62, role: 'melee', range: 18, atkCd: 1.1, dmg: 10, knock: 170, arc: 1.7, weapon: 'claw', attackAnim: 'swing' },
      spiritWolf: { name: 'Spirit wolf', art: 'art/summons/wolf.svg', headR: 35, wash: ['#9FE4FF', 0.55], attackAnim: 'thrust', weapon: 'bite', r: 24, vr: 18, turn: 6, accel: 380, face: 6, mass: 1, hp: 25, speed: 92, role: 'skirmish', range: 14, atkCd: 0.8, dmg: 7, arc: 1.4 },
      spiritEagle: { name: 'Spirit eagle', art: 'art/summons/spirit-eagle.svg', headR: 56, ownLook: true, pass: true, r: 16, vr: 22, turn: 6, accel: 400, face: 6, mass: 0.6, hp: 20, speed: 120, role: 'melee', range: 0, atkCd: 999, dmg: 0 },
      spiritBeaver: { name: 'Spirit beaver', art: 'art/summons/spirit-beaver.svg', headR: 51, ownLook: true, r: 20, vr: 20, turn: 5, accel: 300, face: 5, mass: 1, hp: 20, speed: 60, role: 'melee', range: 0, atkCd: 999, dmg: 6 },
    },
    abilities: [
      { id: 'healTotem', name: 'Healing Totem', cd: 14, tags: 'h', glyph: 'leaf', desc: 'Throws a winged totem like the one on his back to the friend in the most trouble. It stands (70 health, blows on it do half): every blow on a friend within its reach lands on the totem instead, and it mends them a little.',
        tiers: ['It stands 6s.', 'It stands 10s.', 'It cleans statuses off friends near it.'] },
      { id: 'spiritLink', name: 'Spirit Link', cd: 16, tags: 'h', glyph: 'heart', desc: 'Binds friends, and his totem, together with spirit threads: a blow on one is shared out among them all.',
        tiers: ['Up to three friends, for 5s.', 'Linked friends take 10% less.', 'Up to five, for 7s.'] },
      { id: 'rainDance', name: "Ancestors' Call", cd: 20, tags: 'ds', glyph: 'paw', desc: 'Calls the ancestors in spirit shape: a bear that fights beside them and shelters friends near it (they take 20% less), a wolf that hunts, an eagle that follows the most hurt friend and mends it, and a beaver that spins and shoots homing spirit orbs.',
        tiers: ['For 6s.', 'For 9s.', 'The spirits are 10% stronger.'] },
    ],
    trait: { id: 'ancestral', name: 'Ancestral Spirits', desc: 'When an ally goes down, the spirits heal everyone else 10%.' },
  },
  witch: {
    name: 'Witch', art: 'art/heroes/witch.svg', role: 'caster', unlock: { gems: 2 },
    blurb: 'A crooked violet hat and a broom. Turns problems into frogs.',
    fun: 'The frogs in the dungeon all used to be something. Do not ask them what.',
    stats: { hp: 68, speed: 64, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 230, keep: 180, atkCd: 1.2, dmg: 10 },
    style: { hand: 'arm-l', glow: '#B07BE0' },
    attack: { name: 'Hex bolt', anim: 'cast', desc: 'Three hexes in quick succession, each a different witch\'s sign, curving after the target.' },
    summons: { cauldron: { name: 'Cauldron', art: 'art/summons/cauldron.svg', headR: 61, ownLook: true, upright: true, r: 22, vr: 24, turn: 0, accel: 0, face: 0, mass: 60, hp: 30, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 } }, // round 13: Cursed Brew's pot
    abilities: [
      { id: 'frogHex', name: 'Hex', cd: 12, tags: 's', glyph: 'skull', desc: "A hex that turns an enemy into a frog: it can't attack, takes 50% more, and hops about wherever it likes.",
        tiers: ['A frog for 2s.', 'For 3s.', 'The hex jumps on to a second enemy.'] },
      { id: 'cursedBrew', name: 'Cursed Brew', cd: 13, tags: 's', glyph: 'vial', desc: 'Drops a heavy bubbling cauldron on the enemies: it lands with a blow that throws them back, then stands (60 health) while its fumes curse whatever breathes them.',
        tiers: ['Cursed fumes for 6s.', 'Wider fumes.', 'Enemies that die in them burst, cursing those near.'] },
      { id: 'broomRide', name: 'Broom Ride', cd: 11, tags: 'ds', glyph: 'dash', desc: 'Hops on the broom and flies high over the fight, circling the enemies and dropping hex bombs on them; nothing can pick her out while she flies.',
        tiers: ['2.5s in the air.', 'More bombs.', '3.5s in the air.'] },
    ],
    trait: { id: 'crone', name: 'Crone', desc: 'Cursed enemies take 40% more from her.' },
  },
  warlock: {
    name: 'Warlock', art: 'art/heroes/warlock.svg', role: 'caster', unlock: { gems: 3 },
    forms: ['art/heroes/r12/warlock-demon.svg'], // round 15 (lane E): Awaken's demon form (kits2.js summonImp), its picture got ready with his (render.js warmArt)
    blurb: 'Horns, a gold sceptre and a demon-eye orb. Pays for power in his own blood.',
    fun: 'Read the contract very carefully. Twice. Signed it anyway.',
    stats: { hp: 75, speed: 62, r: 30, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1, range: 230, keep: 180, atkCd: 1.3, dmg: 9 },
    style: { glow: '#E05AB8' },
    attack: { name: 'Pact bolt', anim: 'cast', desc: 'An eye of magenta fire like the one on his sceptre: it flies out through the enemies and comes back to his hand, hitting on the way back too; a third of what it deals heals him. His imp throws smaller ones.' },
    summons: { // round 13: the imp that is always with him (his trait); the Ember Deep's imp art
      warlockImp: { name: 'Imp', art: 'art/summons/warlock-imp.svg', headR: 44, r: 20, vr: 16, turn: 7, accel: 420, face: 7, mass: 0.6, hp: 25, speed: 80, role: 'ranged', range: 240, keep: 0, atkCd: 1.3, dmg: 4, attackAnim: 'throw', res: { burn: 0 } },
    },
    abilities: [
      { id: 'eldritchBeam', name: 'Eldritch Beam', cd: 10, tags: 'd', glyph: 'drain', desc: 'His imp holds a writhing magenta ray on an enemy (he does, if it is gone): it burns hotter the longer it holds, shoving the enemy back, and bursts at the end.',
        tiers: ['For 2.5s, then it bursts.', 'It grows hotter faster.', 'A bigger burst.'] },
      { id: 'summonImp', name: 'Awaken', cd: 18, tags: 'd', glyph: 'flame', desc: 'The imp climbs into him and he becomes the demon: a big demonic sword whose blows explode on what they hit, a blink to his foe, fireballs spat at those further off; he takes 40% less as the demon. Every kill starts the time again.',
        tiers: ['For 8s.', 'For 11s.', 'Bigger explosions that burn.'] },
      { id: 'darkBargain', name: 'Dark Bargain', cd: 18, tags: 'd', glyph: 'drain', desc: 'Pays a fifth of his health in blood to his imp: both of them strike far faster for a while, and every blow of theirs bursts round what it hits.',
        tiers: ['For 6s.', 'For 8s.', 'The imp grows on the blood: tougher.'] },
    ],
    trait: { id: 'familiar', name: 'Familiar', desc: 'A small imp is always with him, darting at his shoulder and throwing little eye bolts at his foes. If it falls, another climbs out of the floor 8s later.' },
  },
});

// ------------------------------------------------------------------ batch 4: the cultist and the helpers
Object.assign(HEROES2, {
  cultist: {
    name: 'Cultist', art: 'art/heroes/cultist.svg', role: 'caster', unlock: { gems: 2 },
    blurb: 'A tall black hood, a curved dagger and a burning black candle. Pays in blood for the party\'s strength.',
    fun: 'Says the eye on his hood sees everything. It mostly sees the inside of the hood.',
    stats: { hp: 78, speed: 62, r: 30, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1, range: 220, keep: 175, atkCd: 1.25, dmg: 10 },
    proj: ['bolt', '#9A5CC8'], style: { glow: '#9A5CC8' },
    attack: { name: 'Shadow bolt', anim: 'cast', desc: 'Close up, a swipe of the curved dagger that makes it bleed; further off, a bolt of violet shadow from the candle. The bolt bursts the bleeding at once.' },
    abilities: [
      { id: 'bloodPact', name: 'Blood Pact', cd: 15, tags: 'h', glyph: 'drain', desc: 'Cuts himself open (he bleeds): the friends near him are enraged.',
        tiers: ['Rage for 6s: +30% damage, quicker blows.', '+40%.', 'They heal from 15% of what they deal.'] },
      { id: 'ritualCircle', name: 'Ritual Circle', cd: 13, tags: 's', glyph: 'skull', desc: 'Draws a burning circle under the enemies that makes whatever stands in it bleed.',
        tiers: ['A circle for 4s.', 'When it closes it drags everything in it to its middle.', 'Nothing inside can step out of it.'] },
      { id: 'soulCandle', name: 'Sacrifice', cd: 14, tags: 'dh', glyph: 'dagger', desc: 'Bounds at an enemy near death and finishes it with the dagger; its blood heals him 15%. A boss or a major is cut deep instead.',
        tiers: ['Below a quarter of its health.', 'Below a third.', 'He spins as he lands: everything near bleeds.'] },
    ],
    trait: { id: 'bloodRite', name: 'Blood Rite', desc: 'Every bleeding he started that bursts heals him 8%.' },
  },
  monk: {
    name: 'Monk', art: 'art/heroes/monk.svg', role: 'melee', unlock: { gems: 2 },
    blurb: 'Saffron robe, prayer beads, bare fists. Very calm. Very fast.',
    fun: 'Has meditated in the middle of a goblin raid. The goblins left first.',
    stats: { hp: 115, speed: 74, r: 30, vr: 22, turn: 5.5, accel: 320, face: 5.5, mass: 1.2, range: 16, atkCd: 0.5, dmg: 6, arc: 1.4, dodge: 0.12, knock: 240 },
    weapon: 'palm', style: { dual: true }, // round 13: "Different visual. High knockback" (fxkit: a soft burst of force where the fist lands)
    attack: { name: 'Fists', anim: 'punch', desc: 'Quick jabs with either fist, each one a burst of force that knocks back hard.' },
    abilities: [
      { id: 'flurry', name: 'Flurry', cd: 8, tags: 'dh', glyph: 'fist', desc: 'Steps in behind a blur of punches into one enemy; each one heals him a little.',
        tiers: ['Six punches.', 'The last one sends it flying.', 'Nine punches.'] },
      { id: 'palmStrike', name: 'Palm Strike', cd: 9, tags: 'ds', glyph: 'wave', desc: 'An open palm whose force strikes everything in reach: each is thrown back, turned to face away from him and Spun: it turns very slowly, and when that builds up it marches off the way it faces, fast, unable to attack.',
        tiers: ['Everything in reach.', 'It staggers them.', 'Further, and they spin faster.'] },
      { id: 'innerPeace', name: 'Inner Peace', cd: 16, tags: 'h', glyph: 'sun', desc: 'Sits with his palms pressed together: his statuses fall away and he heals 15%; shots that reach him fly back, and whoever strikes him is thrown far back.',
        tiers: ['For 2.5s.', 'For 4s.', 'A glow round him heals friends near and clears their statuses.'] },
    ],
    trait: { id: 'deflect', name: 'Deflect', desc: 'Swats aside 40% of the shots that reach him from the front.' },
  },
  seer: {
    name: 'Seer', art: 'art/heroes/seer.svg', role: 'support', unlock: { gems: 2 },
    blurb: 'Blindfolded, silver-haired, a glowing crystal in her hand. Sees what\'s coming and tells the party.',
    fun: 'Wears the blindfold because the future is very bright and she forgot her hat.',
    stats: { hp: 82, speed: 64, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 230, keep: 180, atkCd: 1.2, dmg: 8 },
    style: { glow: '#C9B8FF' },
    attack: { name: 'Glimmer', anim: 'cast', desc: 'A crystal mote that glances off its target onto a second enemy.' },
    abilities: [
      { id: 'foresight', name: 'Foresight', cd: 12, tags: 'd', glyph: 'sun', desc: 'A great violet eye opens over the strongest enemy in sight, light pinning it: the whole party hits it harder.',
        tiers: ['Marked for 6s: allies hit it 35% harder.', 'Its own blows often miss.', 'Marks the two strongest.'] },
      { id: 'premonition', name: 'Blinding Flash', cd: 11, tags: 's', glyph: 'sun', desc: 'Her crystal flares: everything round her is struck and blinded: most of its blows miss.',
        tiers: ['Blinded for 2.5s.', 'For 3.5s.', 'The light makes them radiant too.'] },
      { id: 'starfall', name: 'Ill Omen', cd: 15, tags: 's', glyph: 'skull', desc: 'A dark star hangs over the enemies for 5s: every blow they land also lands on a friend of theirs near, and they grow confused.',
        tiers: ['For 5s.', 'They grow confused faster.', 'A wider omen.'] },
    ],
    trait: { id: 'thirdEye', name: 'Third Eye', desc: 'Can\'t be blinded, and sees 15% of blows coming in time to step aside.' },
  },
  chef: {
    name: 'Chef', art: 'art/heroes/chef.svg', role: 'support', unlock: { gems: 1 },
    blurb: 'A toque, a moustache, a frying pan and a wooden spoon. Feeds friends and flings pies at everyone else.',
    fun: 'Has never once been asked to cook goblin. Has prepared anyway.',
    stats: { hp: 120, speed: 56, r: 32, vr: 22, turn: 3.8, accel: 200, face: 4, mass: 1.6, range: 200, keep: 150, atkCd: 1.1, dmg: 10 },
    // round 13: "Should be ranged. Throws random foods. All same effect. Hurts enemies, heals allies"
    attack: { name: 'Food toss', anim: 'throw', desc: 'Throws whatever comes to hand: an apple, a drumstick, a pie, cheese, a roll, a fish. It hurts the enemy it hits and mends any friend it passes over.' },
    abilities: [
      { id: 'hotMeal', name: 'Hot Meal', cd: 12, tags: 'h', glyph: 'heart', desc: 'Throws hot plates out round the party; a friend who walks over one eats it and heals 20%; what goes past full health becomes extra health. Hurt friends go and get one.',
        tiers: ['Two plates.', 'Three plates.', 'Whoever eats hits 20% harder for 8s.'] },
      { id: 'greaseFire', name: 'Grease Fire', cd: 13, tags: 's', glyph: 'flame', desc: 'Flips the pan: hot grease splashes over the floor in front, slick and slow.',
        tiers: ['Oil in a cone for 6s.', 'The oil catches: it burns.', 'A wider splash.'] },
      { id: 'foodFight', name: 'Food Fight', cd: 10, tags: 's', glyph: 'burst', desc: 'Flings custard pies at several enemies, the ones dashing or leaping first: a pie stops a dash, a leap or a charge dead, and slows a little.',
        tiers: ['Three pies.', 'Pie in the eyes: they miss.', 'Five pies.'] },
    ],
    trait: { id: 'wellFed', name: 'Well Fed', desc: 'Allies near him heal 0.5% of their health a second.' },
  },
  beekeeper: {
    // round 13: "REDO... Overall don't like. Visuals or abilities or animations": a new kit (the ids stay for saves)
    name: 'Beekeeper', art: 'art/heroes/beekeeper.svg', role: 'support', unlock: { gems: 2 },
    blurb: 'A veiled hat, a copper smoker, and a great many friends who sting. Calms the enemy, sets the hive on them, keeps his friends sweet.',
    fun: 'Knows every one of the bees by name. They know him by smell.',
    stats: { hp: 82, speed: 62, r: 31, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1.1, range: 210, keep: 170, atkCd: 1.0, dmg: 8 },
    style: { glow: '#FFD45A' },
    attack: { name: 'Bee', anim: 'throw', desc: 'Sends a bee at the target: it stings, then stays buzzing round it, stinging now and then.' },
    summons: { beehive: { name: 'Beehive', art: 'art/summons/beehive.svg', headR: 56, ownLook: true, upright: true, r: 20, vr: 22, turn: 0, accel: 0, face: 0, mass: 60, hp: 35, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 } },
    abilities: [
      { id: 'swarm', name: 'Smoker', cd: 11, tags: 's', glyph: 'cloud', desc: 'Pumps the smoker: a cone of thick white smoke rolls over the enemies in front. They grow sleepy and slow, and drop off if it builds.',
        tiers: ['Sleepy and slowed.', 'Sleepier.', 'They swing slower too.'] },
      { id: 'honeyPot', name: 'Beehive', cd: 14, tags: 'ds', glyph: 'burst', desc: 'Throws a hive down among the enemies (its own health): bees stream out at whatever is near, and whoever strikes the hive is mobbed.',
        tiers: ['A hive for 8s.', 'For 12s.', 'Its bees stay on their foes, stinging.'] },
      { id: 'royalJelly', name: 'Honey Glaze', cd: 12, tags: 'h', glyph: 'heart', desc: 'Drizzles honey over the friend under the most attack: it heals over 4s, and whatever strikes it gets stuck in the honey.',
        tiers: ['Heals 11% over 4s.', 'Heals 17%.', 'Two friends.'] },
    ],
    trait: { id: 'pollen', name: 'Pollen', desc: 'Every sixth sting of his bees carries pollen back: the friend most hurt near him heals 4%.' },
  },
});

// ------------------------------------------------------------------ batch 5: the quartermaster and four ranged
Object.assign(HEROES2, {
  quartermaster: {
    // round 13: "REDO... Overall don't like. Visuals or abilities. Giving out hp potions is very strong. Needs to be more
    // unique": a new kit (ids kept for saves); no potions
    name: 'Quartermaster', art: 'art/heroes/quartermaster.svg', role: 'support', unlock: { gems: 1 },
    blurb: 'A pack bigger than he is. Whatever the party needs, it is in there somewhere: kit, a crate, a barricade, a pot.',
    fun: 'Has a receipt for everything in the pack. Including the pack.',
    stats: { hp: 105, speed: 56, r: 32, vr: 22, turn: 4, accel: 210, face: 4.2, mass: 1.6, range: 190, keep: 150, atkCd: 1.3, dmg: 8 },
    attack: { name: 'Pack toss', anim: 'throw', desc: 'Throws whatever is on top of the pack: a pot, a pan, a boot, a tin cup, a ladle.' },
    summons: {
      crate: { name: 'Supply crate', art: 'art/summons/supply-crate.svg', headR: 56, ownLook: true, upright: true, r: 20, vr: 22, turn: 0, accel: 0, face: 0, mass: 60, hp: 20, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 },
      barricade: { name: 'Barricade', art: 'art/summons/barricade.svg', headR: 57, ownLook: true, r: 34, vr: 34, turn: 0, accel: 0, face: 0, mass: 99, hp: 55, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 },
    },
    abilities: [
      { id: 'resupply', name: 'Supply Crate', cd: 16, tags: 'h', glyph: 'vial', desc: "Drops a supply crate by the friend whose abilities are furthest off; each friend's first touch brings its abilities round sooner and patches it up 5%. Friends with abilities waiting walk over to it.",
        tiers: ['One crate: 4s sooner.', '6s sooner.', 'Two crates.'] },
      { id: 'oilBlades', name: 'Barricade', cd: 18, tags: 'd', glyph: 'wall', desc: 'Unfolds a wooden barricade between the party and the enemies: it blocks their way and their shots until it is broken.',
        tiers: ['110 health, 10s.', '160 health, 14s.', 'Spikes: whatever strikes it is hurt.'] },
      { id: 'flare', name: 'Pot Helmet', cd: 12, tags: 's', glyph: 'fist', desc: 'Throws a big cooking pot that lands upside down over an enemy\'s head: it can\'t see (its blows miss) and blunders about confused.',
        tiers: ['Over one head for 3s.', 'The clang staggers.', 'It bounces on to a second head.'] },
    ],
    trait: { id: 'requisition', name: 'Requisition', desc: 'Every 20s he tosses a piece of kit to the friend nearest the fight, for 12s: a whetstone (+20% damage), a buckler (a shield of 25) or boots (+25% speed). A gatherer: on the wagon road he goes for loose gold before a fight, and further for it.' },
    gatherer: true, // lane W (round 13, the designer: "heroes with the gathering trait ... prioritize collecting rather than fighting"; convoy.js)
  },
  crossbowman: {
    name: 'Crossbowman', art: 'art/heroes/crossbowman.svg', role: 'ranged', unlock: { gems: 2 },
    blurb: 'A heavy crossbow, a kettle hat and a tall shield on his back. Slow to load, hard to stop.',
    fun: 'Has counted every turn of the crank since he was nine. He is on four hundred thousand and six.',
    stats: { hp: 85, speed: 60, r: 31, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1.3, range: 280, keep: 180, atkCd: 1.7, dmg: 15 },
    summons: { pavise: { name: 'Pavise', art: 'art/summons/pavise.svg', headR: 64, ownLook: true, r: 20, vr: 26, turn: 0, accel: 0, face: 0, mass: 99, hp: 30, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 } },
    attack: { name: 'Heavy bolt', anim: 'shoot', desc: 'A heavy crossbow bolt that goes through the first enemy it hits.' },
    abilities: [
      { id: 'pavise', name: 'Pavise', cd: 13, tags: 'd', glyph: 'shield', desc: "Plants the tall shield in front of him as a thing of its own (60 health): his side's shots go through it, the enemy's stop on it.",
        tiers: ['One pavise for 7s.', 'For 10s, and he reloads 35% faster behind it.', 'Three, set round him in a slanted row.'] },
      { id: 'pinBolt', name: 'Pinning Bolt', cd: 10, tags: 'ds', glyph: 'arrows', desc: 'A heavy bolt that hits hard and throws the enemy flying backwards; whatever it ploughs into is hurled aside, and when it slams into a wall it is pinned there, stunned.',
        tiers: ['Pinned for 1.8s.', 'The slam staggers.', 'Pinned for 2.5s.'] },
      { id: 'crankUp', name: 'Crank Up', cd: 15, tags: 'd', glyph: 'burst', desc: 'Cranks the crossbow hard and loads charged bolts: each bursts where it stops in grey smoke and iron, staggering.',
        tiers: ['Three charged bolts.', 'Bigger bursts.', 'Five bolts.'] },
    ],
    trait: { id: 'armourPiercing', name: 'Armour Piercing', desc: 'His bolts go straight through armour, and hit elites, majors and bosses 25% harder.' },
  },
  falconer: {
    name: 'Falconer', art: 'art/heroes/falconer.svg', role: 'ranged', unlock: { gems: 2 },
    blurb: 'A rust beret, a leather gauntlet and a slate-grey falcon. The falcon does the hunting.',
    fun: 'Speaks fluent falcon. The falcon pretends not to understand.',
    stats: { hp: 78, speed: 68, r: 31, vr: 22, turn: 4.8, accel: 250, face: 4.8, mass: 1, range: 250, keep: 175, atkCd: 1.0, dmg: 8, dodge: 0.12 },
    style: { hand: 'arm-r' },
    attack: { name: 'Throwing knife', anim: 'throw', desc: 'A broad hunting knife thrown end over end.' },
    abilities: [
      { id: 'looseFalcon', name: 'Loose the Falcon', cd: 10, tags: 'ds', glyph: 'up', desc: 'The falcon leaves his fist for the furthest enemy (an elite first) and rakes it: it is Tracked (a crosshair): it can\'t turn invisible, untouchable or go underground, and every blow on it lands harder.',
        tiers: ['Tracked for 6s.', 'It goes for the eyes: blinded.', 'Then it dives on a second enemy.'] },
      { id: 'keenEye', name: 'Keen Eye', cd: 14, tags: 'd', glyph: 'sun', desc: 'Takes careful aim for a while: his knives glint gold and some land just right.',
        tiers: ['For 6s: 30% of his throws are critical hits.', 'He throws 30% faster.', 'Half of them are critical.'] },
      { id: 'flock', name: 'Call the Flock', cd: 13, tags: 's', glyph: 'wave', desc: 'He scatters into a flock of birds: nothing can touch him while it sweeps through the enemies, pecking and slowing them; then he is himself again.',
        tiers: ['A flock for 2.2s.', 'They peck at eyes: blinded.', 'For 3s.'] },
    ],
    trait: { id: 'huntingPartner', name: 'Hunting Partner', desc: 'Every fourth knife the falcon goes out with it, rakes the foe and marks it Tracked for 2s.' },
  },
  grenadier: {
    name: 'Grenadier', art: 'art/heroes/grenadier.svg', role: 'ranged', unlock: { gems: 2 },
    blurb: 'A tall mitre cap, a handlebar moustache and a lit bomb, always. Solves problems loudly.',
    fun: 'Has been told to put that down. Has never once put that down.',
    stats: { hp: 85, speed: 60, r: 31, vr: 22, turn: 4.3, accel: 230, face: 4.4, mass: 1.3, range: 220, keep: 175, atkCd: 1.7, dmg: 13 },
    attack: { name: 'Bomb', anim: 'throw', desc: 'Lobs a small bomb that bursts where it lands in grey smoke, staggering.' },
    abilities: [
      { id: 'bigBomb', name: 'Big Bomb', cd: 11, tags: 'ds', glyph: 'burst', desc: 'Lobs a huge bomb that lands and sits fizzing (30 health): it goes off 2s after landing, or the moment it is broken.',
        tiers: ['A huge blast.', 'It burns.', 'It scatters four small bombs too.'] },
      { id: 'stickyBomb', name: 'Sticky Bomb', cd: 10, tags: 'd', glyph: 'burst', desc: 'Sticks a bomb to an enemy in a splat of green goo; it goes off 2s later.',
        tiers: ['It blows after 2s.', 'A bigger blast.', 'Two sticky bombs.'] },
      { id: 'blastOff', name: 'Blast Off', cd: 12, tags: 'ds', glyph: 'up', desc: 'Drops a bomb at his own feet and rides the blast out of trouble.',
        tiers: ['Throws him clear and hurts those near.', 'The blast staggers.', 'He lands with a second blast.'] },
    ],
    summons: { bigBomb: { name: 'Big bomb', art: 'art/summons/big-bomb.svg', headR: 51, ownLook: true, upright: true, r: 18, vr: 20, turn: 0, accel: 0, face: 0, mass: 99, hp: 15, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 } },
    trait: { id: 'powderKeg', name: 'Powder Keg', desc: 'Whatever he kills blows up a moment later, hurting and staggering those round it: one blast sets off the next through a pack.' },
  },
  harpooner: {
    name: 'Harpooner', art: 'art/heroes/harpooner.svg', role: 'ranged', unlock: { gems: 2 },
    blurb: 'A yellow sou\'wester, a puffy grey moustache, a barbed harpoon on a rope.',
    fun: 'Came down here after the one that got away. It was a rat. It was a very big rat.',
    stats: { hp: 135, speed: 58, r: 32, vr: 22, turn: 4, accel: 210, face: 4.2, mass: 1.6, range: 190, keep: 140, atkCd: 1.4, dmg: 13 },
    attack: { name: 'Harpoon', anim: 'throw', desc: 'The barbed harpoon thrown on its rope: it tugs the enemy a little way in, and is hauled back.' },
    abilities: [
      { id: 'reelIn', name: 'Reel In', cd: 10, tags: 'ds', glyph: 'hook', desc: 'Harpoons a far enemy, the harpoon stuck in it and the rope across the floor, and hauls: a small one is dragged to him, a big one drags him to it.',
        tiers: ['Drags it in (or him to it).', 'It\'s staggered when it lands.', 'The rope holds it near him for 4s.'] },
      { id: 'rogueWave', name: 'Rogue Wave', cd: 12, tags: 's', glyph: 'wave', desc: 'Calls up a curling wave of sea water that rolls out in front of him; each enemy is struck when the crest reaches it, harder and further the closer it stood, and soaked.',
        tiers: ['Soaks and throws them back.', 'A bigger wave.', 'It leaves water on the floor.'] },
      { id: 'anchorDrop', name: 'Drop Anchor', cd: 14, tags: 'ds', glyph: 'fist', desc: 'Heaves a great iron anchor off his shoulder on its chain: it arcs over and crashes down on the enemies.',
        tiers: ['A heavy crash that stuns those under it.', 'Wider.', 'The chain sweeps round first, knocking back.'] },
    ],
    trait: { id: 'oldSalt', name: 'Old Salt', desc: 'Can\'t be soaked, and hits wet enemies 20% harder.' },
  },
});

// ------------------------------------------------------------------ batch 6: more ranged
Object.assign(HEROES2, {
  huntress: {
    name: 'Javelin Huntress', art: 'art/heroes/huntress.svg', role: 'ranged', unlock: { gems: 2 },
    blurb: 'A coral headband, a ponytail, a bundle of javelins. Runs prey down.',
    fun: 'Throws a javelin through a ring at fifty paces. Mostly to annoy the ring.',
    stats: { hp: 85, speed: 74, r: 31, vr: 22, turn: 5, accel: 270, face: 5, mass: 1.1, range: 240, keep: 165, atkCd: 1.3, dmg: 12, dodge: 0.12 },
    attack: { name: 'Javelin', anim: 'throw', desc: 'A hard-thrown javelin that knocks its target back; every third is a serrated razor javelin that makes it bleed.' },
    abilities: [
      { id: 'runningThrow', name: 'Spear Lunge', cd: 9, tags: 'ds', glyph: 'dash', desc: 'Lunges spear-first straight through a line of enemies, striking every one she passes.',
        tiers: ['One lunge.', 'It staggers.', 'Two charges: the second lunge comes straight after.'] },
      { id: 'bound', name: 'Bound', cd: 8, tags: 'd', glyph: 'up', desc: 'Leaps back out of reach and hurls a big javelin at the top of the leap.',
        tiers: ['A leap back and a heavy javelin.', 'The javelin pierces.', 'She lands lightly: 2s faster.'] },
      { id: 'prey', name: 'Javelin Rain', cd: 13, tags: 'ds', glyph: 'arrows', desc: 'Hurls javelins high into the air: they come down on the enemies round her target.',
        tiers: ['Three javelins.', 'They stagger.', 'Five javelins.'] },
    ],
    trait: { id: 'finisher', name: 'Finisher', desc: 'Hits enemies below half health 25% harder.' },
  },
  marksman: {
    name: 'Marksman', art: 'art/heroes/marksman.svg', role: 'ranged', unlock: { gems: 3 },
    blurb: 'A cavalier hat with a cream plume, a grey moustache, a very long musket. One shot, well placed.',
    fun: 'Has never missed. Has occasionally hit something he did not mean to, which he does not count.',
    stats: { hp: 72, speed: 60, r: 31, vr: 22, turn: 4.2, accel: 220, face: 4.2, mass: 1, range: 330, keep: 220, atkCd: 2.2, dmg: 19 }, // (round 11: dmg 22 -> 19; he dealt well over half his party's damage)
    attack: { name: 'Musket', anim: 'shoot', desc: 'One long, hard shot.' },
    abilities: [
      { id: 'aimedShot', name: 'Aimed Shot', cd: 10, tags: 'ds', glyph: 'arrows', desc: 'Stands stock still, aims, and fires a shot that goes clean through and leaves its target Targeted (a crosshair): it takes 20% more, its dashes and leaps fall short, and his bullets go on through it.',
        tiers: ['Two and a half times the damage through the first enemy.', 'Through everything in the line.', 'Knocks out the first one hit.'] },
      { id: 'bayonet', name: 'Bayonet', cd: 8, tags: 'ds', glyph: 'dagger', desc: 'Lunges with the bayonet fixed into whatever got too close: a long thrust and a heavy shove.',
        tiers: ['A thrust and a big shove.', 'It staggers.', 'Then a shot at it point blank.'] },
      { id: 'ricochet', name: 'Ricochet', cd: 12, tags: 'd', glyph: 'bolt', desc: 'A shot that glances off one enemy onto the next, only ever on ahead (never turning back more than a little).',
        tiers: ['Bounces three times.', 'Five times.', 'Each bounce hits harder than the last.'] },
    ],
    trait: { id: 'longShot', name: 'Long Shot', desc: 'He reaches 40% further than anyone, and his shots hit up to 60% harder the nearer the edge of his reach.' },
  },
  ninja: {
    name: 'Ninja', art: 'art/heroes/ninja.svg', role: 'ranged', unlock: { gems: 3 },
    blurb: 'Charcoal hood, crimson scarf, a shuriken in each hand. Hard to pin down.',
    fun: 'You have met her three times already. You just don\'t remember.',
    stats: { hp: 82, speed: 90, r: 29, vr: 20, turn: 6.5, accel: 400, face: 6.5, mass: 0.9, range: 200, keep: 130, atkCd: 0.6, dmg: 5, dodge: 0.22 },
    style: { dual: true },
    attack: { name: 'Shuriken', anim: 'throw', desc: 'Shuriken thrown one, then two at a time, then three, over and over.' },
    abilities: [
      { id: 'shurikenFan', name: 'Kunai Rain', cd: 9, tags: 'ds', glyph: 'dagger', desc: 'Springs up and flings a ring of kunai down all round her.',
        tiers: ['Eight kunai.', 'Twelve.', 'They poison.'] },
      { id: 'substitution', name: 'Substitution', cd: 12, tags: 's', glyph: 'cloud', desc: 'When a blow lands, it was a log all along: a puff of smoke, the log tumbling where she stood, and she is somewhere else.',
        tiers: ['Escapes one blow.', 'The smoke blinds those near.', 'Ready again much sooner.'] },
      { id: 'caltrops', name: 'Caltrops', cd: 12, tags: 'ds', glyph: 'burst', desc: 'Flings a handful of iron caltrops out all round her; each one bites the first foot that steps on it: a little damage and a stagger.',
        tiers: ['Nine caltrops.', 'Fourteen, further out.', 'They poison.'] },
    ],
    trait: { id: 'assassin', name: 'Assassin', desc: 'Her shuriken hit 50% harder from behind.' },
  },
  pirate: {
    name: 'Pirate', art: 'art/heroes/pirate.svg', role: 'skirmish', unlock: { gems: 2 },
    blurb: 'Tricorn, cutlass, flintlock. Fights dirty, drinks worse, calls in the ship\'s guns.',
    fun: 'Lost the ship in a card game. Kept the guns. Nobody knows how.',
    stats: { hp: 115, speed: 80, r: 31, vr: 22, turn: 5.5, accel: 330, face: 5.5, mass: 1.2, range: 20, atkCd: 0.8, dmg: 10, arc: 1.5, dodge: 0.1 },
    weapon: 'blade', style: { hand: 'arm-l', backhand: true }, // round 13: "Swing other way"
    attack: { name: 'Cutlass', anim: 'swing', desc: 'Fast backhand cutlass slashes.' },
    abilities: [
      { id: 'pointBlank', name: 'Point Blank', cd: 7, tags: 'ds', glyph: 'burst', desc: 'Jams the flintlock against an enemy and fires in a cloud of smoke: a big hit and a shove, and it is left Targeted (a crosshair).',
        tiers: ['A big hit and a shove.', 'It staggers.', 'The second pistol at another enemy.'] },
      { id: 'grog', name: 'Grog', cd: 16, tags: 'h', glyph: 'vial', desc: 'Stops for a long swig from the bottle: heals 25%, and things hurt less while she sways about tipsy.',
        tiers: ['Takes 20% less for 5s.', 'Nothing knocks her about meanwhile.', 'She tosses a bottle to a hurt friend too.'] },
      { id: 'broadside', name: 'Broadside', cd: 15, tags: 'd', glyph: 'burst', desc: 'Whistles to the ship out of sight: cannonballs come in high from the edge of the room and land round a spot.',
        tiers: ['Three cannonballs.', 'Bigger blasts.', 'Five.'] },
    ],
    trait: { id: 'plunder', name: 'Plunder', desc: 'With her in the party, one enemy in three that falls spills extra coins. A gatherer: on the wagon road she goes for loose gold before a fight, and further for it.' },
    gatherer: true, // lane W (round 13): see the Quartermaster
  },
  slinger: {
    name: 'Slinger', art: 'art/heroes/slinger.svg', role: 'ranged', unlock: { gems: 1 },
    blurb: 'A shepherd in a ram\'s fleece with a sling and a crook. Stones, and the flock behind him.',
    fun: 'Has counted sheep every night since he was four. Can no longer sleep without them.',
    stats: { hp: 82, speed: 64, r: 31, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1.1, range: 240, keep: 170, atkCd: 1.15, dmg: 10 },
    attack: { name: 'Sling', anim: 'throw', desc: 'A whirl and a stone; one in four a big stone that staggers. Close up, a crack with the crook.' },
    abilities: [
      { id: 'stunStone', name: 'Stunning Stone', cd: 8, tags: 's', glyph: 'fist', desc: 'Whirls the sling hard over his head and lobs a big stone high: it comes down on the enemy\'s head. BONK.',
        tiers: ['Stunned for 0.9s.', 'Stunned for 1.3s.', 'It bounces on to a second head.'] },
      { id: 'ramCharge', name: 'Ram', cd: 13, tags: 'ds', glyph: 'dash', desc: 'Whistles, and a big woolly ram comes charging up from behind him, head down, bowling through the line and tossing them aside.',
        tiers: ['One ram.', 'It staggers.', 'Two rams.'] },
      { id: 'gravel', name: 'Counting Sheep', cd: 12, tags: 's', glyph: 'sleep', desc: 'Little sheep come bounding over the enemies round a spot, one after another: each one that jumps over them makes them sleepier, until they drop off.',
        tiers: ['Five sheep.', 'Eight sheep.', 'Each one counts for more.'] },
    ],
    trait: { id: 'watchful', name: 'Watchful', desc: 'Allies near him shake off stuns and sleep 40% faster.' },
  },
});
// ------------------------------------------------------------------ batch 7: the trapper and the fighters
Object.assign(HEROES2, {
  trapper: {
    name: 'Trapper', art: 'art/heroes/r12/trapper.svg', role: 'ranged', unlock: { gems: 2 },
    blurb: 'A fur cap with the flaps down, a short rifle and a jaw trap. Catches things.',
    fun: 'Knows where every trap he ever set is. Mostly. Walks carefully.',
    stats: { hp: 88, speed: 62, r: 31, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1.2, range: 180, keep: 120, atkCd: 1.4, dmg: 12 },
    // round 13: "I want them to have a shotgun... Short range. Many pellets" (the shotgun held in two hands and the trap on his hip are the art lane's)
    attack: { name: 'Shotgun', anim: 'shoot', desc: 'A short-range blast of six pellets.' },
    abilities: [
      { id: 'jawTrap', name: 'Jaw Trap', cd: 9, tags: 'ds', glyph: 'hook', desc: 'Sets a steel jaw trap where the enemies are coming; the first to step in is Trapped: it can\'t move, turn or use an ability, only strike straight ahead. A trap never takes what another trap holds.',
        tiers: ['Holds it for 2s.', 'Holds 3s and bites harder.', 'Two traps.'] },
      { id: 'snareNet', name: 'Double Barrel', cd: 11, tags: 'ds', glyph: 'burst', desc: 'Both barrels at once: a wide cone of heavy pellets that blows the enemies back and him a step back too.',
        tiers: ['Twelve pellets.', 'They stagger.', 'Those close are knocked down.'] },
      { id: 'tripwire', name: 'Bush', cd: 14, tags: 'h', glyph: 'leaf', desc: 'Turns into a bush: no enemy can pick him out while he creeps away from them, healing a little.',
        tiers: ['A bush for 3.5s.', 'For 5s.', 'He heals faster.'] },
    ],
    trait: { id: 'trappersEye', name: 'Trapper\'s Eye', desc: 'Enemies that are held or rooted take 30% more from him.' },
  },
  gladiator: {
    name: 'Gladiator', art: 'art/heroes/gladiator.svg', role: 'melee', unlock: { gems: 2 },
    blurb: 'A crested bronze helm, a gladius and a little round shield. Plays to the crowd.',
    fun: 'Hears cheering in every fight. There is never anyone there.',
    stats: { hp: 142, speed: 64, r: 33, vr: 23, turn: 4, accel: 230, face: 4.2, mass: 1.8, range: 22, atkCd: 0.9, dmg: 13, knock: 120, arc: 1.6 },
    weapon: 'blade', style: { off: 'shield' },
    attack: { name: 'Gladius', anim: 'thrust', desc: 'A slash, then a stab, over and over.' },
    abilities: [
      { id: 'netThrow', name: 'Spear of Ares', cd: 10, tags: 'ds', glyph: 'arrows', desc: 'Hurls a great spear that goes through the whole line.',
        tiers: ['Through everything in the line.', 'It staggers.', 'It nails the last one hit to the spot.'] },
      { id: 'showboat', name: 'Arena', cd: 14, tags: 'h', glyph: 'up', desc: 'Draws a ring in the sand round him and his foe: for 5s everyone else is pushed out and kept out, and no shot can cross it. One on one.',
        tiers: ['A ring for 5s.', 'He heals 15%.', 'Each blow he takes meanwhile is answered.'] },
      { id: 'shieldRush', name: 'Shield Rush', cd: 9, tags: 'ds', glyph: 'shield', desc: 'A long rush behind the round shield: the first one it meets is carried along on it and slammed down at the end, staggered.',
        tiers: ['A long rush and a slam.', 'The rush knocks aside what else it meets.', 'Stuns the one slammed.'] },
    ],
    trait: { id: 'duelist', name: 'Duelist', desc: 'One on one, with no other enemy on him, he hits his foe 35% harder and takes 25% less from it.' },
  },
  jester: {
    name: 'Jester', art: 'art/heroes/jester.svg', role: 'skirmish', unlock: { gems: 3 },
    blurb: 'A three-pointed cap with bells and a marotte on a stick. Makes enemies look foolish, then fight each other.',
    fun: 'The marotte has its own little jester on top. That one has a marotte too. It goes on.',
    stats: { hp: 100, speed: 84, r: 30, vr: 21, turn: 6, accel: 360, face: 6, mass: 1, range: 18, atkCd: 0.75, dmg: 11, arc: 1.6, dodge: 0.2 },
    weapon: 'heavy',
    attack: { name: 'Marotte', anim: 'swing', desc: 'A bonk with the jester\'s stick; each one leaves a little of something odd on it (a random status).' },
    abilities: [
      { id: 'mock', name: 'Swap', cd: 11, tags: 's', glyph: 'swirl', desc: 'A puff of confetti and he trades places: with a friend in trouble (it is hasted and shielded) or, if none, with an enemy (a shooter first), which is left confused.',
        tiers: ['Haste 3.5s, a shield of 20 / confused.', 'Haste 5s, a shield of 35 / more confused.', 'The enemy is stunned too.'] },
      { id: 'befuddle', name: 'Befuddle', cd: 10, tags: 's', glyph: 'swirl', desc: 'When a blow is about to land on him, he is behind whoever swung it instead, and boots it forward, confused.',
        tiers: ['Ready every 10s.', 'Every 8s.', 'Every 6s, and the kick hurts more.'] },
      { id: 'juggle', name: 'Juggling Act', cd: 10, tags: 'd', glyph: 'burst', desc: 'Throws his juggling balls straight out: they go through whatever they meet and bounce off the walls three times.',
        tiers: ['Three balls.', 'They daze: slowed.', 'Four balls, and the first one each ball hits is whisked to where it next bounces.'] },
    ],
    trait: { id: 'pratfall', name: 'Pratfall', desc: 'A quarter of the blows swung at him miss, and whoever swung is spun round to face away.' },
  },
  samurai: {
    name: 'Samurai', art: 'art/heroes/r12/samurai.svg', role: 'melee', unlock: { gems: 3 },
    blurb: 'An indigo kabuto with gold horns and a long katana. Waits, then cuts.',
    fun: 'Has polished the katana every night for twenty years. It has never been dirty. He polishes anyway.',
    stats: { hp: 120, speed: 66, r: 32, vr: 22, turn: 4.4, accel: 250, face: 4.6, mass: 1.5, range: 28, atkCd: 1.1, dmg: 14, knock: 100, arc: 2 },
    weapon: 'great', style: { lunge: true }, // round 13: "Should dash forwards" (kits2: each cut a step in)
    attack: { name: 'Katana', anim: 'swing', desc: 'A clean, wide cut, stepping in with it.' },
    abilities: [
      { id: 'iaido', name: 'Iaido', cd: 10, tags: 'd', glyph: 'dash', desc: 'Settles, the blade half drawn, light gathering on it; then he is simply on the far side of the enemies in his line. Each one he passed through is staggered a moment, then takes the cut: a tenth of its health and more.',
        tiers: ['One cut through.', 'Staggers them harder.', 'He cuts back through again.'] },
      { id: 'focus', name: 'Focus', cd: 12, tags: 'd', glyph: 'sun', desc: 'Settles into his guard: once a second his blade turns a blow aside, and each one turned makes his next cut 40% harder.',
        tiers: ['For 5s.', 'For 7s.', 'For 9s.'] },
      { id: 'crescentCut', name: 'Crescent Cut', cd: 11, tags: 'ds', glyph: 'swirl', desc: 'Darts to an enemy and cuts it down with one heavy stroke: a tenth of its health and more.',
        tiers: ['One heavy cut.', 'It staggers.', 'If it kills, he darts on to the next.'] },
    ],
    trait: { id: 'keenEdge', name: 'Keen Edge', desc: 'Every blow also takes 3% of its target\'s greatest health (a boss 1%).' },
  },
  valkyrie: {
    name: 'Valkyrie', art: 'art/heroes/r12/valkyrie.svg', role: 'support', unlock: { gems: 3 }, // round 13: "Is more of a support."
    blurb: 'A winged helm, long plaits and a big spear. Carries the fallen back into the fight.',
    fun: 'Has been to Valhalla twice. Says the food is good but the seating is a nightmare.',
    stats: { hp: 125, speed: 66, r: 32, vr: 22, turn: 4.2, accel: 240, face: 4.4, mass: 1.6, range: 34, atkCd: 1.15, dmg: 12, knock: 130, arc: 1 },
    weapon: 'thrust',
    attack: { name: 'Spear', anim: 'thrust', desc: 'A long spear thrust.' },
    abilities: [
      { id: 'valkyrieCall', name: "Valkyrie's Call", cd: 30, tags: 'h', glyph: 'heart', desc: 'Flies to a fallen friend and brings it back to its feet in a burst of light that throws the enemies round back and makes them radiant.',
        tiers: ['Back up at 25% health, once a room.', 'At 40%.', 'She takes it up and flies the two of them clear of the fight.'] },
      { id: 'spearThrow', name: 'Spear of the Sky', cd: 9, tags: 'ds', glyph: 'arrows', desc: 'Flies spear-first along the line to the friend most hurt, striking every enemy in the way, and cleanses and steels that friend (hasted, a shield).',
        tiers: ['A shield of 28.', 'The strikes shock.', 'A shield of 45.'] },
      { id: 'skyDive', name: 'Sky Dive', cd: 12, tags: 'ds', glyph: 'up', desc: 'Up on her wings for a moment, then down beside the friend most beset in a burst of light: the enemies round are struck and made radiant.',
        tiers: ['A dive and a burst.', 'It staggers those round.', 'She heals 15% on landing.'] },
    ],
    trait: { id: 'valhalla', name: 'Light of Valhalla', desc: 'While a friend is near her, she and the friends near heal 0.9% a second, a soft glow under her. She revives the fallen twice as fast, at 30% health.' },
  },
});

// ------------------------------------------------------------------ batch 8: the engineer and the werewolf
Object.assign(HEROES2, {
  engineer: {
    name: 'Engineer', art: 'art/heroes/engineer.svg', role: 'ranged', unlock: { gems: 3 },
    blurb: 'An orange work suit, a welding mask pushed up and a very big wrench. Builds a turret and keeps it running.',
    fun: 'Can fix anything with a wrench. Has fixed several things that were not broken.',
    stats: { hp: 100, speed: 60, r: 32, vr: 22, turn: 4, accel: 210, face: 4.2, mass: 1.6, range: 190, keep: 120, atkCd: 1.1, dmg: 10, knock: 150, arc: 1.6 },
    weapon: 'heavy', // round 13: "Hits she. Close. Throw bouncing cogs from afar"
    attack: { name: 'Wrench and cogs', anim: 'throw', desc: 'Close up, a clanging swing of the wrench; further off, a cog thrown that bounces on to a second enemy. With nothing to hit close by, she goes to a damaged construct of her side (her turrets and towers first) and whacks it back into shape: 12% of its health a blow. The wrench mends nothing else.' },
    summons: {
      turret: { name: 'Turret', art: 'art/summons/turret.svg', headR: 52, turret: true, attackAnim: 'shoot', proj: 'bullet', r: 24, vr: 20, turn: 1, accel: 0, face: 1, mass: 8,
        hp: 70, speed: 0, role: 'ranged', range: 260, keep: 0, atkCd: 0.6, dmg: 5 },
      // round 13: Tinker's four towers and the wind-up drones (kits2.js BRAINS, fx2.js LOOK2)
      torcher: { name: 'Torcher', art: 'art/summons/engineer-torcher.svg', headR: 66, ownLook: true, turret: true, r: 26, vr: 26, turn: 0, accel: 0, face: 0, mass: 99, hp: 70, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 6 },
      tesla: { name: 'Tesla tower', art: 'art/summons/engineer-tesla.svg', headR: 61, ownLook: true, upright: true, r: 22, vr: 24, turn: 0, accel: 0, face: 0, mass: 99, hp: 35, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 6 },
      snowMortar: { name: 'Snowball mortar', art: 'art/summons/engineer-mortar.svg', headR: 61, ownLook: true, turret: true, r: 24, vr: 24, turn: 0, accel: 0, face: 0, mass: 99, hp: 35, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 6 },
      medbay: { name: 'Medbay', art: 'art/summons/engineer-medbay.svg', headR: 61, ownLook: true, upright: true, r: 24, vr: 24, turn: 0, accel: 0, face: 0, mass: 99, hp: 35, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 },
      medDrone: { name: 'Med drone', art: 'art/summons/engineer-med-drone.svg', headR: 36, ownLook: true, upright: true, pass: true, r: 12, vr: 14, turn: 0, accel: 0, face: 0, mass: 0.4, hp: 6, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0 },
      windup: { name: 'Wind-up drone', art: 'art/summons/engineer-windup.svg', headR: 36, ownLook: true, r: 13, vr: 14, turn: 0, accel: 0, face: 0, mass: 0.5, hp: 8, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 6 },
    },
    abilities: [
      { id: 'deployTurret', name: 'Deploy Turret', cd: 20, tags: 'd', glyph: 'burst', desc: 'Throws a turret into a spot round her: it lands, turns slowly to the nearest enemy and fires in rapid bursts of five, its barrels spinning.',
        tiers: ['One turret for 10s.', 'It fires faster and lasts 16s.', 'Two turrets.'] },
      { id: 'tinker', name: 'Tinker', cd: 16, tags: 'dh', glyph: 'heart', desc: 'Bolts together one of four towers on the spot: a torcher (very tough from the front, weak behind, turning slowly, a jet of fire out of its front), a tesla (chain lightning), a snowball mortar, or a medbay (when friends are hurt) that sends out wobbly little drones that fly to them and heal them.',
        tiers: ['A tower for 9s.', 'For 12s.', 'The medbay\'s drones heal half as much again.'] },
      { id: 'shockMine', name: 'Wind-up Drones', cd: 12, tags: 'ds', glyph: 'bolt', desc: 'Throws little wind-up drones out round her; they waddle slowly at the nearest enemy and pop, shocking.',
        tiers: ['Four drones.', 'They shock harder.', 'Six drones.'] },
    ],
    trait: { id: 'overclock', name: 'Overclock', desc: 'When none of her abilities is ready, one of them at random comes round twice as fast.' },
  },
  werewolf: {
    name: 'Werewolf', art: 'art/heroes/werewolf.svg', role: 'melee', unlock: { gems: 3 },
    blurb: 'A woodsman with a hatchet and a torn red shirt. Then, when it matters, a great grey wolf.',
    fun: 'Buys his shirts in bulk.',
    stats: { hp: 145, speed: 64, r: 33, vr: 23, turn: 4, accel: 230, face: 4.2, mass: 1.8, range: 22, atkCd: 1.1, dmg: 12, knock: 130, arc: 1.6 },
    weapon: 'blade',
    form: { id: 'werewolfBeast', name: 'Werewolf', art: 'art/heroes/werewolf-beast.svg', anim: 'swing',
      stats: { speed: 84, turn: 5.5, accel: 340, face: 5.5, range: 18, atkCd: 0.55, dmg: 10, knock: 90, arc: 2, weapon: 'claw' }, style: { dual: true } },
    attack: { name: 'Hatchet', anim: 'swing', desc: 'A woodsman\'s chop. As a wolf: quick raking claws with either paw.' },
    abilities: [
      { id: 'turnWolf', name: 'Turn', cd: 22, tags: 'd', glyph: 'paw', desc: "Lets the wolf out: bigger, faster, the claws coming twice as fast as the hatchet. A wolf can't be healed.",
        tiers: ['A wolf for 10s.', 'For 14s.', 'The claws make them bleed.'] },
      { id: 'frenzy', name: 'Frenzy', cd: 14, tags: 'h', glyph: 'fist', desc: 'Always on once learned. As a wolf, each blow in a row comes faster than the last; as a man, each blow heals him, more the lower he is.',
        tiers: ['Up to 60% faster / heals up to 6%.', 'Heals up to 9%.', 'At full speed he howls: everything near is staggered.'] },
      { id: 'pounce', name: 'Pounce', cd: 10, tags: 'ds', glyph: 'up', desc: 'As a man, a dash forward and a wide cleave at the end of it. As a wolf, a leap onto an enemy that pins it, and haste.',
        tiers: ['Pins it for 1s.', 'Pins it for 1.6s; the cleave staggers.', 'Mauls it while it\'s pinned.'] },
    ],
    trait: { id: 'fromTheWild', name: 'Back From the Wild', desc: 'When the wolf falls, he gets up again as a man at 10% health, every time.' },
  },
});
// ------------------------------------------------------------------ round 13 (lane S): the charming hero
// The designer: "Add a charming hero. New charm status, can't hurt who is charming them, burst effect makes them fight
// for you for a bit." Kit: js/kits-charm.js; looks: js/fx-status.js. Placeholder art: the Witch recoloured pink
// (docs/ART-NEEDED.md).
Object.assign(HEROES2, {
  enchantress: {
    name: 'Enchantress', art: 'art/heroes/enchantress.svg', role: 'support', unlock: { gems: 3 },
    blurb: 'Rose silk, a heart-shaped locket and a smile. Nobody who meets her wants to hurt her, and before long they fight for her.',
    fun: 'Has never once paid for a drink. Has been proposed to by two trolls, a mimic and, on one confusing night, a door.',
    stats: { hp: 78, speed: 64, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 220, keep: 170, atkCd: 1.2, dmg: 8 },
    style: { hand: 'arm-l', glow: '#FF8AC8' },
    attack: { name: 'Blown kiss', anim: 'cast', desc: 'A slow pink heart that floats to its target: a little damage, and a little charm.' },
    abilities: [
      { id: 'heartstring', name: 'Heartstring', cd: 13, tags: 's', glyph: 'string', desc: 'Ties a pink thread to the most dangerous enemy near her: it is drawn out of its pack towards her while charm pours into it, until it fights for the party.',
        tiers: ['The thread holds 4s.', 'It holds 6s.', 'Once that enemy is won, the thread jumps to the next one.'] },
      { id: 'sweetheart', name: 'Sweetheart', cd: 14, tags: 'sh', glyph: 'kiss', desc: 'Blows a kiss to the friend taking the most blows: whoever keeps hitting that friend falls for them, and can\'t bring itself to hit them any more.',
        tiers: ['For 6s.', 'For 8s, and the kiss heals 10%.', 'Two friends.'] },
      { id: 'heartbreak', name: 'Heartbreak', cd: 15, tags: 'ds', glyph: 'heartbreak', desc: 'Breaks every heart she has won at once. The charmed take damage (more the more they were charmed) and swoon; the enthralled come to their senses in a burst that hurts their own friends.',
        tiers: ['They swoon for 1s.', 'For 1.6s.', 'Every broken heart heals the party a little.'] },
    ],
    trait: { id: 'firstImpression', name: 'First Impression', desc: 'The first blow any enemy lands on her charms it a lot: it soon can\'t bring itself to hit her again.' },
  },
});

// The HUD glyph of each new ability (icons.js)
export const GLYPH2 = {};
for (const h of Object.values(HEROES2)) for (const ab of h.abilities) if (ab.glyph) GLYPH2[ab.id] = ab.glyph;
for (const h of Object.values(HEROES3)) for (const ab of h.abilities) if (ab.glyph) GLYPH2[ab.id] = ab.glyph; // round 15 (lane N)
for (const h of Object.values(HEROES_WATER)) for (const ab of h.abilities) if (ab.glyph) GLYPH2[ab.id] = ab.glyph; // round 17 (lane water17)
