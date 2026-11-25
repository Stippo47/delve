// The Book's ability previews, round 18 (lane preview18): the scenes. Pure data, no DOM; js/preview-sim.js plays them.
// The designer: "Many abilities aren't shown at all, aren't in the right scenario to show themselves off, don't change
// between tiers when sometimes they should, the dummies don't attack like how an enemy would, I don't want the heroes
// to just take invisible damage. I want to see how each ability works in the best way possible."
//
// So an ability's preview is a small real fight, set up for it:
//   - the enemies are real kinds (KINDS below) running their own brains: they walk up, swing, shoot, wind up and
//     telegraph like anywhere else. They are tougher than usual and hit softer (FOE_HP, FOE_DMG), and they don't fall
//     (a hook keeps them up) unless the scene marks one `mortal`, so a loop lasts and the hero lives through it. Every
//     blow the hero or a friend takes comes from one of them, a shot, a zone or a status: nothing else hurts anyone.
//   - the hero stands its ground until the ability goes, holding its own attack, so the ability is the first thing it
//     does; then it fights on as it would (it moves, attacks).
//   - the ability is made ready a moment in and the hero's own brain picks it when the scene calls for it (its score,
//     or its reflex, the same as in a run). If it hasn't by `forceAt`, the stage casts it (and the check tool counts
//     that as the scene being wrong for it).
//   - every scene is built for what tier III needs (a second hurt friend, a second head, a wall to slam into), so the
//     lower tiers show less on the same stage and the tier's difference is there to see.
//
// SCENES[name]: { hero: [x, y], hp, foes: [...], friends: [...], corpses: [[x, y]...], wall: { x, y, w, h } }
//   foes     [{ k, at, on, hp, mortal, delay, still }]
//              k       a KINDS key ('melee', 'fast', 'heavy', 'undead', 'shooter', 'caster') or a kind's own id
//              at      where it starts; on: 'hero' | 0 | 1 (a friend's index): who it goes for (it is held to them)
//              hp      the share of its health it starts on; mortal: it can fall (a body to raise, a kill to finish)
//              delay   seconds before it joins (walks in from the right edge); still: it holds its spot
//   friends  [{ k, at, hp, st, stun, falls }]  the hero's side: real heroes with their abilities held
//              hp      the share of health it starts on (always with whoever is hitting it in view)
//              st      statuses it starts with (and whoever gave them is there); stun: seconds stunned at the start
//              falls   seconds in: the foe on it lands a felling blow (seen: it winds up and swings)
//   hp       the hero's own share of health at the start (with its attackers there from the first moment)
//   lethal   seconds in: the foe on the hero swings a blow that would bring it down (Old Bones)
// ABILITY_SCENE[abilityId]: { scene, ...the same keys to add to or replace the scene's, readyAt, forceAt, noAttack }
//   foeKind  every foe of the scene is this kind instead (undead for Smite III, say)
//   addFoes / addFriends  more of them on top of the scene's
//   readyAt  when the ability comes ready (0.3 s); forceAt: when the stage casts it if the hero hasn't (2.4 s)
//   secs     how long the loop runs on after it (the longest time its words name, at most 8 s)
//   oil      puddles of oil on the floor [[x, y, r]...]; holdFoes: every foe holds its spot until the ability goes
//            (a foe's own `hold` does the same for it alone: a line to go through stays a line); holdFor: how long
//            after it goes they are let walk (0.4 s; longer for a shot that is aimed first)
//   noAttack the hero keeps holding its attack after the cast too
// An ability not in the table gets a scene from its kits `show` (sceneFor), so a new hero still has a scene.

export const KINDS = { melee: 'hobgoblin', fast: 'goblin', heavy: 'orc', undead: 'rattler', shooter: 'rattlerBow', caster: 'orcShaman', spear: 'banditSpear',
  poisoner: 'spiderHunter', burner: 'hellhound', chiller: 'frostWolf' }; // (the last three: their bites carry poison, fire, frost)
export const FOE_HP = 2.6, FOE_DMG = 0.6; // their health and blows, against a run's
export const HERO_FLOOR = 0.22, FRIEND_FLOOR = 0.14; // the least the hero and a friend are let fall to (no scene is about falling unless it says)

const F = (k, at, o = {}) => ({ k, at, ...o });
export const SCENES = {
  // one enemy walks up to the hero
  duel: { foes: [F('melee', [300, 175])] },
  // two close together
  pair: { foes: [F('melee', [290, 140]), F('melee', [305, 215]), F('fast', [400, 175], { delay: 1.2 })] },
  // a group coming at the hero's front (cones, sweeps, lanes)
  front: { foes: [F('melee', [265, 175]), F('fast', [300, 115]), F('fast', [300, 235]), F('melee', [360, 175])] },
  // the hero in the middle, enemies closing from every side (rings round the hero)
  ring: { hero: [235, 175], foes: [F('melee', [345, 175]), F('fast', [120, 175]), F('melee', [235, 72]), F('fast', [235, 282]), F('melee', [345, 85])] },
  // a pack coming from far off (things thrown or cast at a spot)
  pack: { hero: [90, 175], foes: [F('melee', [340, 175]), F('fast', [375, 125]), F('fast', [375, 228]), F('melee', [410, 175]), F('heavy', [430, 95])] },
  // a line of them, one behind the other (things that go through)
  line: { hero: [90, 175], foes: [F('melee', [245, 175]), F('melee', [320, 178], { hold: true }), F('heavy', [400, 172], { hold: true })] },
  // spread over the yard (things that jump from one to the next, or pick one out)
  spread: { hero: [90, 175], foes: [F('melee', [250, 110]), F('fast', [290, 245]), F('melee', [345, 160]), F('shooter', [425, 88]), F('heavy', [415, 262])] },
  // shooters at the back, one fighter coming in (shields, walls, things that stop shots)
  shooters: { hero: [100, 175], foes: [F('shooter', [410, 95]), F('shooter', [420, 255]), F('melee', [330, 175])] },
  // casters at the back throwing spells (magic stoppers)
  casters: { hero: [100, 175], foes: [F('caster', [405, 95]), F('caster', [415, 255]), F('melee', [330, 175])] },
  // a friend low on health with an enemy on it, another enemy coming at the hero
  hurtFriend: { hero: [90, 110], friends: [{ at: [205, 262], hp: 0.38 }], foes: [F('melee', [300, 262], { on: 0 }), F('fast', [330, 100])] },
  // two friends being hit (things that reach a second friend at tier III)
  hurtFriends: { hero: [90, 175], friends: [{ at: [205, 268], hp: 0.38 }, { at: [215, 82], hp: 0.45 }], foes: [F('melee', [300, 268], { on: 0 }), F('fast', [305, 82], { on: 1 }), F('melee', [360, 175])] },
  // the party together, a group coming (songs, shouts, rings for friends)
  party: { hero: [110, 175], friends: [{ at: [175, 92], hp: 0.6 }, { at: [175, 258], hp: 0.55 }], foes: [F('melee', [300, 128]), F('fast', [320, 222]), F('melee', [380, 175])] },
  // the party, its friends already in a fight (what helps friends who are busy fighting)
  partyFight: { hero: [100, 175], friends: [{ at: [185, 92], hp: 0.6 }, { at: [185, 258], hp: 0.55 }], foes: [F('melee', [262, 92], { on: 0 }), F('fast', [262, 258], { on: 1 }), F('melee', [400, 175])] },
  // a friend struck down in front of the hero, the enemies still about
  downedFriend: { hero: [90, 175], friends: [{ at: [245, 250], hp: 0.3, falls: 0.55 }], foes: [F('heavy', [325, 250], { on: 0 }), F('melee', [340, 115])] },
  // a heavy blow coming at the hero (dodges, parries, catches)
  incoming: { hero: [150, 175], foes: [F('heavy', [265, 175], { on: 'hero' }), F('fast', [300, 95], { on: 'hero', delay: 0.6 })] },
  // a blow and shots coming at the hero
  incomingShots: { hero: [150, 175], foes: [F('heavy', [265, 175], { on: 'hero' }), F('shooter', [420, 105], { on: 'hero' }), F('shooter', [425, 250], { on: 'hero' })] },
  // the hero hurt and being hit (heals for oneself, getaways)
  selfHurt: { hero: [130, 175], hp: 0.42, foes: [F('melee', [235, 175], { on: 'hero' }), F('fast', [250, 100], { on: 'hero' }), F('fast', [255, 255], { on: 'hero', delay: 0.4 })] },
  // a friend with statuses on it and its attacker
  statusFriend: { hero: [90, 110], friends: [{ at: [210, 262], hp: 0.5, st: { poison: 75, burn: 55 } }], foes: [F('poisoner', [300, 262], { on: 0 }), F('burner', [250, 320], { on: 0 }), F('fast', [330, 100])] },
  // bodies on the floor and enemies coming
  corpse: { hero: [90, 175], corpses: [[205, 118], [215, 238]], foes: [F('melee', [345, 175]), F('fast', [385, 115]), F('fast', [385, 240]), F('melee', [425, 175])] },
  // one enemy nearly dead among others
  lowFoe: { hero: [100, 175], foes: [F('melee', [270, 175], { hp: 0.18, mortal: true }), F('melee', [330, 110], { hp: 0.22, mortal: true }), F('fast', [340, 245])] },
  // a friend fighting an enemy across the yard (an enemy busy with someone else)
  busyFoe: { hero: [90, 175], friends: [{ at: [305, 250], hp: 0.7 }], foes: [F('melee', [370, 250], { on: 0 }), F('melee', [360, 110], { on: 0 })] },
};

// What each ability needs. (The tiers' words in heroes*.js say what tier III adds; the scene has it there.)
const S = (scene, o = {}) => ({ scene, ...o });
const WALL_R = { x: 440, y: 40, w: 22, h: 270 }; // a wall at the yard's far side, to slam into
export const ABILITY_SCENE = {
  // Paladin
  shieldBash: S('front'), guard: S('hurtFriend'), consecrate: S('ring', { foeKind: 'undead', friends: [{ at: [175, 262], hp: 0.45 }] }),
  // Tower
  holdTheLine: S('ring', { addFoes: [F('melee', [440, 60]), F('fast', [60, 300])] }), charge: S('line', { wall: WALL_R }), groundPound: S('ring'),
  // Archer
  barrage: S('pack'), frostArrow: S('pack'), roll: S('incoming'),
  // Twinfang
  backstab: S('busyFoe', { foes: [F('melee', [370, 250], { on: 0, hp: 0.22, mortal: true }), F('melee', [360, 110], { on: 0 })] }), dash: S('busyFoe'), fanOfKnives: S('ring'),
  // Wildmane
  rage: S('selfHurt', { foes: [F('heavy', [235, 175], { on: 'hero' }), F('melee', [250, 100], { on: 'hero' })] }), leap: S('pack', { addFoes: [F('fast', [170, 305])] }), cleave: S('ring'),
  // Berserker
  shockwave: S('line'), whirl: S('ring'), unstoppable: S('selfHurt', { hp: 0.35, heroSt: { poison: 60, chill: 50 }, foes: [F('poisoner', [235, 175], { on: 'hero' }), F('chiller', [250, 100], { on: 'hero' }), F('melee', [255, 255], { on: 'hero' })] }),
  // Granny
  reap: S('ring', { hp: 0.55 }), hook: S('spread'), oldBones: S('ring', { lethal: 0.9, hp: 0.3 }),
  // Pyromancer
  fireball: S('pack'), flameWall: S('pack', { oil: [[330, 175, 50], [420, 250, 44]] }), inferno: S('ring'),
  // Frost
  iceShard: S('line', { addFoes: [F('fast', [300, 110]), F('fast', [300, 240])] }), frostNova: S('ring'), iceWall: S('pack'),
  // Storm
  chainLightning: S('spread', { addFoes: [F('fast', [200, 270])] }), thunderclap: S('pack'), stormCloud: S('spread', { addFoes: [F('fast', [200, 270]), F('melee', [210, 80])] }),
  // Cleric
  mend: S('hurtFriends'), sanctuary: S('party', { friends: [{ at: [165, 105], hp: 0.4 }, { at: [165, 250], hp: 0.45 }] }), smite: S('duel', { foeKind: 'undead' }),
  // Bard
  warSong: S('party'), lullaby: S('front', { foes: [F('melee', [265, 175]), F('fast', [300, 115], { hp: 0.3 }), F('fast', [300, 235]), F('melee', [360, 175])] }), encore: S('partyFight', { forceAt: 3.2 }),
  // Druid
  entangle: S('pack'), rejuvenate: S('hurtFriends'), callWolf: S('pack'),
  // Necromancer
  raiseDead: S('corpse'), lifeDrain: S('pack', { hp: 0.6, friends: [{ at: [150, 260], hp: 0.45 }] }), boneSpear: S('line'),
  // Plague Doctor
  miasma: S('pack'), cure: S('statusFriend'), leeches: S('selfHurt'),
  // Old Guard
  greatSweep: S('front'), rallyCry: S('partyFight', { friends: [{ at: [185, 92], hp: 0.6, stun: 2.5, st: { stagger: 60 } }, { at: [185, 258], hp: 0.55, st: { stagger: 70 } }], foes: [F('heavy', [265, 92], { on: 0 }), F('heavy', [265, 258], { on: 1 }), F('melee', [400, 175])] }), pommelStrike: S('incomingShots'),
  // Dame
  riposte: S('incoming', { foes: [F('heavy', [265, 175], { on: 'hero' }), F('melee', [45, 175], { on: 'hero' })] }), challenge: S('hurtFriend', { addFoes: [F('fast', [330, 300], { on: 0 })] }), disarm: S('front'),
  // Griffon
  swoop: S('hurtFriend', { hero: [80, 90], addFoes: [F('fast', [250, 320], { on: 0 })] }), hammerThrow: S('spread'), wingShield: S('incoming', { wall: { x: 330, y: 60, w: 22, h: 230 }, foes: [F('heavy', [255, 175], { on: 'hero' }), F('melee', [235, 90], { on: 'hero' })] }),
  // Bulwark
  brace: S('pack'), shieldWall: S('party', { foes: [F('melee', [270, 128]), F('fast', [280, 222]), F('melee', [330, 175])] }), impale: S('duel'),
  // Bearskin
  maul: S('pair'), hibernate: S('selfHurt', { hp: 0.44, secs: 8, foes: [F('poisoner', [235, 175], { on: 'hero' }), F('burner', [250, 100], { on: 'hero' }), F('melee', [255, 255], { on: 'hero', delay: 0.4 })] }), bearRoar: S('front'),
  // Warhelm
  thunderBlow: S('line'), warHorn: S('ring'), skullSplitter: S('pack'),
  // Bandit
  smokeBomb: S('shooters'), pickpocket: S('line'), lowBlow: S('front'),
  // Shade
  shadowWalk: S('spread'), blackout: S('ring'), deathMark: S('front'),
  // Haymaker
  toss: S('pair'), pitchHay: S('front'), forkCharge: S('pack', { wall: WALL_R }),
  // Digger
  dirtFling: S('front', { friends: [{ at: [175, 262], hp: 0.6, st: { burn: 60, poison: 40 } }], addFoes: [F('burner', [250, 320], { on: 0 })] }), burrow: S('spread'), spadeBat: S('front'),
  // Grandpa
  breadToss: S('hurtFriends'), harvest: S('hurtFriend', { addFoes: [F('fast', [250, 320], { on: 0 })] }), oldTales: S('partyFight', { forceAt: 3.2 }),
  // Alchemist
  acidFlask: S('pack'), elixir: S('hurtFriend'), bangFlask: S('ring'),
  // Shaman
  healTotem: S('hurtFriend', { friends: [{ at: [205, 262], hp: 0.4, st: { poison: 60 } }], addFoes: [F('poisoner', [250, 320], { on: 0 })] }), spiritLink: S('party', { addFriends: [{ at: [70, 290], hp: 0.6 }] }), rainDance: S('party'),
  // Witch
  frogHex: S('spread'), cursedBrew: S('pack', { foes: [F('melee', [340, 175], { hp: 0.3, mortal: true }), F('fast', [375, 125], { hp: 0.3, mortal: true }), F('fast', [375, 228]), F('melee', [410, 175])] }), broomRide: S('pack'),
  // Warlock
  eldritchBeam: S('pack'), summonImp: S('front'), darkBargain: S('front'),
  // Cultist
  bloodPact: S('party'), ritualCircle: S('pack'), soulCandle: S('lowFoe'),
  // Monk
  flurry: S('duel'), palmStrike: S('front'), innerPeace: S('incomingShots', { hp: 0.4, friends: [{ at: [90, 270], hp: 0.6, st: { poison: 60 } }], addFoes: [F('poisoner', [170, 320], { on: 0 })] }),
  // Seer
  foresight: S('spread', { foes: [F('heavy', [270, 110]), F('fast', [290, 245]), F('melee', [345, 160]), F('heavy', [415, 262]), F('shooter', [425, 88])] }), premonition: S('ring'),
  starfall: S('pack', { friends: [{ at: [240, 175], hp: 0.7 }], foes: [F('melee', [320, 175], { on: 0 }), F('fast', [330, 120], { on: 0 }), F('fast', [330, 230], { on: 0 }), F('melee', [390, 175])] }),
  // Chef
  hotMeal: S('party', { friends: [{ at: [175, 92], hp: 0.4 }, { at: [175, 258], hp: 0.45 }] }), greaseFire: S('front'), foodFight: S('spread'),
  // Beekeeper
  swarm: S('front'), honeyPot: S('pack'), royalJelly: S('hurtFriends'),
  // Quartermaster
  resupply: S('party', { foes: [F('melee', [420, 128], { delay: 1.2 }), F('fast', [430, 222], { delay: 1.4 }), F('melee', [440, 175], { delay: 1.8 })] }), oilBlades: S('shooters', { addFoes: [F('fast', [360, 120]), F('fast', [360, 230])] }), flare: S('spread'),
  // Crossbowman
  pavise: S('shooters'), pinBolt: S('duel', { foes: [F('melee', [330, 175], { hold: true })], wall: { x: 385, y: 70, w: 22, h: 210 } }), crankUp: S('pack'),
  // Falconer
  looseFalcon: S('spread'), keenEye: S('pair'), flock: S('front'),
  // Grenadier
  bigBomb: S('pack'), stickyBomb: S('pack'), blastOff: S('selfHurt', { hp: 0.6 }),
  // Harpooner
  reelIn: S('spread'), rogueWave: S('front'), anchorDrop: S('pack'),
  // Huntress
  runningThrow: S('line'), bound: S('incoming', { foes: [F('heavy', [265, 175], { on: 'hero' }), F('melee', [345, 178], { hold: true }), F('melee', [415, 172], { hold: true })] }), prey: S('pack'),
  // Marksman
  aimedShot: S('line', { holdFoes: true, holdFor: 1.4 }), bayonet: S('incoming'), ricochet: S('spread'),
  // Ninja
  shurikenFan: S('ring'), substitution: S('incoming', { foes: [F('heavy', [235, 175], { on: 'hero' }), F('melee', [235, 95], { on: 'hero' })] }), caltrops: S('ring'),
  // Pirate
  pointBlank: S('pair'), grog: S('selfHurt', { friends: [{ at: [90, 290], hp: 0.4 }], foes: [F('heavy', [235, 175], { on: 'hero' }), F('fast', [250, 100], { on: 'hero' }), F('melee', [190, 300], { on: 0 })] }), broadside: S('pack'),
  // Slinger
  stunStone: S('spread'), ramCharge: S('line'), gravel: S('pack'),
  // Trapper
  jawTrap: S('pack'), snareNet: S('front'), tripwire: S('selfHurt'),
  // Gladiator
  netThrow: S('line'), showboat: S('pair', { hp: 0.55 }), shieldRush: S('line'),
  // Jester
  mock: S('hurtFriend', { addFoes: [F('shooter', [420, 175])] }), befuddle: S('incoming', { foes: [F('melee', [230, 175], { on: 'hero' }), F('fast', [240, 100], { on: 'hero' })] }), juggle: S('spread'),
  // Samurai
  iaido: S('line'), focus: S('incomingShots'), crescentCut: S('lowFoe'),
  // Valkyrie
  valkyrieCall: S('downedFriend'), spearThrow: S('hurtFriend', { hero: [80, 90], friends: [{ at: [330, 270], hp: 0.35 }], foes: [F('melee', [400, 270], { on: 0 }), F('melee', [205, 180]), F('fast', [270, 225])] }),
  skyDive: S('hurtFriend', { hp: 0.6, addFoes: [F('fast', [250, 320], { on: 0 })] }),
  // Engineer
  deployTurret: S('pack'), tinker: S('party', { friends: [{ at: [175, 92], hp: 0.45 }, { at: [175, 258], hp: 0.4 }] }), shockMine: S('front'),
  // Werewolf
  turnWolf: S('front'), frenzy: S('duel', { hp: 0.5 }), pounce: S('pack'),
  // Enchantress
  heartstring: S('pack'), sweetheart: S('hurtFriends'), heartbreak: S('front', { charmed: true, hp: 0.6, friends: [{ at: [175, 262], hp: 0.45 }] }),
  // Mob
  pileOn: S('duel'), surround: S('pack'), scatter: S('selfHurt'),
  // Clockwork
  rewind: S('hurtFriend', { friends: [{ at: [205, 262], hp: 1, struck: 0.5 }] }), timeBubble: S('shooters', { friends: [{ at: [250, 175], hp: 0.7 }], addFoes: [F('fast', [330, 110]), F('fast', [330, 240])] }), stopClock: S('shooters', { addFoes: [F('fast', [330, 110]), F('fast', [330, 240])] }),
  // Air Mage
  gale: S('front', { wall: WALL_R, addFoes: [F('shooter', [400, 70]), F('shooter', [400, 280])] }), updraft: S('pair'), cyclone: S('pack'),
  // Warden
  manacle: S('casters', { addFoes: [F('shooter', [380, 175])] }), nullify: S('casters', { hero: [200, 175], friends: [{ at: [180, 280], hp: 0.6, st: { poison: 60, burn: 40 } }], foes: [F('caster', [330, 95]), F('caster', [340, 255]), F('poisoner', [270, 300], { on: 0 }), F('shooter', [420, 175])] }), chainGang: S('ring'),
  // Telekinetic
  hurl: S('corpse'), levitate: S('spread'), mindShield: S('shooters', { friends: [{ at: [150, 250], hp: 0.35 }], addFoes: [F('melee', [240, 300], { on: 0 })] }),
  // Earth Mage
  earthquake: S('pack'), spikeChain: S('spread'), stoneWall: S('pack', { addFoes: [F('shooter', [430, 175])] }),
  // Water Mage
  bubbleShield: S('casters', { forceAt: 4.5, hero: [80, 175], friends: [{ at: [200, 95], hp: 0.75 }, { at: [205, 255], hp: 0.75 }], foes: [F('caster', [400, 95], { on: 0 }), F('caster', [410, 255], { on: 1 }), F('caster', [430, 175], { on: 0 })] }),
  waterDome: S('party', { addFoes: [F('shooter', [420, 80]), F('shooter', [425, 270])] }), waterCannon: S('line', { friends: [{ at: [180, 175], hp: 0.5 }] }),
};

// The scene for an ability that has no entry: from its kits `show`, the way the Riffle showcase staged it.
export function sceneFor(id, A) {
  if (ABILITY_SCENE[id]) return ABILITY_SCENE[id];
  const sh = (A && A.show) || {};
  if (sh.downed) return S('downedFriend');
  if (sh.strikeAlly) return S('hurtFriend', { friends: [{ at: [205, 262], hp: 1, struck: 0.5 }] });
  if (sh.shootme === 'spell') return S('casters', { friends: [{ at: [200, 120], hp: 0.75 }], foes: [F('caster', [400, 120], { on: 0 }), F('melee', [330, 230])] });
  if (sh.hitAlly || sh.mob === 'ally' || sh.downed) return S('hurtFriend');
  if (sh.shootme) return S('incomingShots');
  if (sh.hitme) return S('incoming');
  if (sh.hurt) return S('selfHurt');
  if (sh.ally) return S('party');
  if (sh.single) return S('duel');
  if (sh.far) return S('pack');
  return S('front');
}

// What an ability's scene comes to: the scene with the ability's own keys laid over it.
export function sceneOf(id, A) {
  const o = sceneFor(id, A), base = SCENES[o.scene] || SCENES.front;
  const out = { ...base, ...o, name: o.scene };
  out.foes = [...(o.foes || base.foes || []), ...(o.addFoes || [])];
  out.friends = [...(o.friends || base.friends || []), ...(o.addFriends || [])];
  return out;
}

// An attack's scene: the weapon on a couple of enemies walking up (a friend nearby for the attacks that also mend).
export const ATTACK_SCENE = {
  cleric: S('hurtFriend', { hero: [100, 175], friends: [{ at: [230, 120], hp: 0.5 }], foes: [F('melee', [320, 120], { on: 0 }), F('melee', [320, 235])] }),
  waterMage: S('hurtFriend', { hero: [100, 175], friends: [{ at: [230, 120], hp: 0.7 }], foes: [F('melee', [320, 120], { on: 0 }), F('melee', [320, 235])] }),
};
export function attackSceneOf(id) {
  const o = ATTACK_SCENE[id] || S('pair', { foes: [F('melee', [300, 150]), F('fast', [330, 215])] }), base = SCENES[o.scene];
  return { ...base, ...o, name: o.scene, foes: [...(o.foes || base.foes || [])], friends: [...(o.friends || base.friends || [])] };
}

// ---------------------------------------------------------------- the monsters' pages (round 18b, lane preview18b)
// The designer, on the Book's previews: "the dummies don't attack like how an enemy would, I don't want the heroes to
// just take invisible damage. I want to see how each ability works in the best way possible." Round 13 to 18 showed an
// enemy's moves on blue straw targets that never moved and poked it now and then from nowhere; its health was set lower
// with no blow so the moves that wait for it to be hurt came, and a target was moved up to it when its move hadn't come.
// Now a monster's move is shown against a small party of real heroes running their own brains (they walk up, swing,
// shoot, kite, as in a run), set out the way the move wants them:
//   FOE_SCENES[name]: { heroes: [{ k, at, hp, hold, on }], friend, pack, hp, foeHold }
//     heroes   who it faces: k a hero kind; at: [dx, dy] from the monster (scaled up on a big stage); hp: the share of
//              health it starts on (always with the monster there to have done it); hold: seconds it holds its spot
//              before it moves of its own (a lane to charge down stays a lane); on: 'friend', it goes for the monster's
//              friend rather than the monster (a mender has someone to mend)
//     friend   a fighter of the monster's own side beside it, hurt, with a hero on it (menders, guards, war cries,
//              raising the fallen; friendFor picks one from its own dungeon); pack: two more of its own kind (howls)
//     hp       the monster's own share of health at the start (moves that wait for it to be hurt), the heroes there
// The heroes hit softly (FOE_HERO_DMG) and are kept up (FOE_HERO_FLOOR, then they mend), the monster and its side are
// kept up too: so the loop lasts and its move comes round again.
// FOE_SCENE['kind'] or FOE_SCENE['kind:move'] picks a scene and lays keys over it; with no entry the scene comes from
// how the kind fights (foeSceneFor).
export const FOE_HERO_DMG = 0.3, FOE_HERO_FLOOR = 0.2;
const H = (k, at, o = {}) => ({ k, at, ...o });
export const FOE_SCENES = {
  // a fighter coming at it, a shooter behind: what most moves meet in a run
  party: { heroes: [H('paladin', [-150, 20]), H('archer', [-320, -70])] },
  // up close all round it (slams, quakes, spins, things that answer a blow)
  close: { heroes: [H('paladin', [-80, 0]), H('dame', [-55, -85]), H('archer', [-300, 60])] },
  // round it on every side (rings, novas, volleys)
  ring: { heroes: [H('paladin', [-110, 0]), H('tower', [10, -120]), H('dame', [10, 120]), H('archer', [-300, -40])] },
  // off at a distance, held a moment (charges, leaps, pounces, throws, lines, lobs)
  far: { heroes: [H('paladin', [-290, 0], { hold: 1.6 }), H('archer', [-330, -110]), H('tower', [-300, 110], { hold: 1.6 })] },
  // two close together off at a distance (spreads, barrages, splashes)
  pair: { heroes: [H('paladin', [-250, -25], { hold: 1.4 }), H('tower', [-255, 45], { hold: 1.4 }), H('archer', [-360, -120])] },
  // shooters (moves that answer shots: reflections, dodges, shields, going for the back row)
  shooters: { heroes: [H('archer', [-300, -90]), H('crossbowman', [-320, 90]), H('paladin', [-160, 0])] },
  // spell throwers (moves that answer magic)
  casters: { heroes: [H('pyromancer', [-300, -90]), H('frost', [-320, 90]), H('paladin', [-160, 0])] },
  // a hurt hero among them (moves that go for the weak)
  weak: { heroes: [H('paladin', [-150, -40]), H('archer', [-230, 90], { hp: 0.3 }), H('cleric', [-340, -90])] },
  // its own side hurt, a hero on it (menders, guards, war cries, the raising of the fallen)
  friend: { friend: true, heroes: [H('paladin', [-150, 110], { on: 'friend' }), H('archer', [-320, -60])] },
  // its pack beside it (howls)
  pack: { pack: true, heroes: [H('paladin', [-170, 0]), H('archer', [-330, -80]), H('tower', [-300, 90])] },
  // a boss's hall: four of them, spread
  boss: { heroes: [H('paladin', [-200, -40]), H('tower', [-210, 80]), H('archer', [-420, -150]), H('cleric', [-440, 150])] },
};
// what to lay over the scene, by kind or kind:move ('kind:elite', 'kind:major', 'kind:kit', 'kind:attack')
const FS = (scene, o = {}) => ({ scene, ...o });
export const FOE_SCENE = {
};
const HURT_MOVE = /below half|half its health|when hurt|hurt,|once hurt|low on health|wounded/i;
// the scene for a kind's move when it has no entry: from how it fights (its ability, its role) and its move's words
export function foeSceneFor(k, move, d, words = '', major = '') {
  const o = FOE_SCENE[k + ':' + move] || FOE_SCENE[k];
  if (o) return o;
  if (d.boss) return FS('boss');
  if (move === 'attack') return FS('party');
  if (move === 'major') return FS({ quake: 'close', charge: 'far', volley: 'ring', call: 'party' }[major] || 'party', HURT_MOVE.test(words) ? { hp: 0.45 } : {});
  if ((d.pack || d.wolf) && move !== 'elite') return FS('pack');
  if (d.mends || !(d.dmg > 0)) return FS('friend');
  if (move === 'elite') {
    const hp = HURT_MOVE.test(words) ? { hp: 0.45 } : {};
    if (/mend|heal|rais|rall|war cry|quicken|shield[s ]+(its|the) |call/i.test(words)) return FS('friend', hp);
    if (/charge|rush|leap|pounce|lunge|thr[oe]w|lob|spear|dash|dive|swoop|hook|pull/i.test(words)) return FS('far', hp);
    if (/slam|quake|nova|spin|round it|all round|ring|stomp|sweep/i.test(words)) return FS('close', hp);
    if (/arrow|shot|reflect|shooter/i.test(words)) return FS('shooters', hp);
    return FS('party', hp);
  }
  if (d.ability === 'charge' || d.ability === 'shadowstep' || d.ability === 'dash' || d.dashCd) return FS('far');
  if (d.ability === 'slam') return FS('close');
  if (d.ability === 'barrage') return FS('pair');
  return FS('party');
}
export function foeSceneOf(k, move, d, words, major) {
  const o = foeSceneFor(k, move, d, words, major), base = FOE_SCENES[o.scene] || FOE_SCENES.party;
  const out = { ...base, ...o, name: o.scene };
  out.heroes = [...(o.heroes || base.heroes || []), ...(o.addHeroes || [])];
  return out;
}
