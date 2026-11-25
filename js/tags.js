// Tags (round 17, lane tags17). The designer: "Work on the tag system. For example constructs (stationary, built) can
// be tagged construct, then there could be a separate healing ability that only affects constructs. Think the engineer
// hitting its turrets with their wrenches. Can heal its constructs but not his allies. Or any fire tagged entity taking
// damage when wet or in water. Or the silence stopping mouth abilities. Add the obvious ones."
//
// One registry, three kinds of thing tagged. Every list is data here; the sim asks with the helpers at the bottom and
// keeps no names of its own. The tags in words, who has which, and the rules built on them: docs/tags17.md.
//   unit kinds   tagsOf(u) / hasTag(u, tag): what a unit IS (construct, fire, undead...). A kind's tags come from
//                its def's own fields where those already say it honestly (def.construct, def.turret, def.boss,
//                def.hops...), from the explicit lists in KIND_TAGS, and from def.labels (a def may list its own).
//                A variant (units.js variantOf) has its base kind's tags as well as its own.
//   abilities    abilityHas(id, tag): what a hero's ability USES (mouth, sound, magic). heroes2.js's `tags` string on
//                an ability ('ds': the web's arms) is a different thing and is left alone; these live in ABILITY_TAGS
//                below (or an ability def's own `labels` array).
//   enemy moves  moveHas(u, key, tag): an enemy's timed moves (elites.js due(u, key)) by their clock's key, e.g.
//                'howl', 'breath'; a key can be tagged for one kind only as 'kind:key'.
//   hits         hitKinds(o, src): a blow's damage type (sharp | blunt | magic), the elements it carries and how it
//                came (slam, explosion, gas, zone, shot...); isMagicHit(o, src) for "blocks magic, not physical".
// And the rules built on them: Silenced (mouth moves only), Doused and Kindled fire things, the height layers.
import { CUR } from './stats.js';

// ---------------------------------------------------------------- the tags, in words (the inspect panel, the Book)
export const TAG_INFO = {
  construct: { name: 'Construct', desc: 'Built, not born: machines, towers, traps, golems, barricades. It can be repaired with a wrench; it never bleeds and poison does nothing to it.' },
  stationary: { name: 'Stationary', desc: 'Stands where it was put and never walks.' },
  fire: { name: 'Fire', desc: 'A creature of living flame. Water hurts it: soaked or standing in water, it takes what burning does to others, and hisses.' },
  ice: { name: 'Ice', desc: 'A creature of frost and snow. It freezes slowly and burns easily.' },
  plant: { name: 'Plant', desc: 'Wood, leaf and root. It burns easily.' },
  undead: { name: 'Undead', desc: 'Dead and walking. Holy light hurts it more.' },
  spirit: { name: 'Spirit', desc: 'A spirit, more light or mist than body.' },
  beast: { name: 'Beast', desc: 'An animal.' },
  slime: { name: 'Slime', desc: 'A blob of ooze that moves in hops.' },
  flier: { name: 'Flier', desc: 'Flies.' },
  metal: { name: 'Metal', desc: 'Made of metal: lightning and water get into it.' },
  demon: { name: 'Demon', desc: 'A fiend from the pit.' },
  holy: { name: 'Holy', desc: 'A thing of the light.' },
  caster: { name: 'Caster', desc: 'Its shots are spells (magic, not arrows or stones).' },
  boss: { name: 'Boss', desc: 'A boss.' },
  mute: { name: 'Mute', desc: 'Has no voice: it can never use a move that needs its mouth.' },
  deaf: { name: 'Deaf', desc: 'Hears nothing.' },
};
export const TAG_IDS = Object.keys(TAG_INFO);

// ---------------------------------------------------------------- unit kinds
// From the def's own fields (only where the field says the same thing; nothing guessed from names)
const DERIVED = {
  construct: (d) => !!(d.construct || d.turret),            // the Foundry's machines and the golems already said construct; every turret is built
  stationary: (d) => !!d.turret,                           // a turret of either side stands where it was put
  slime: (d) => d.hops != null || !!d.splits,              // round 16's hoppers and the splitters
  undead: (d) => !!d.undead,
  boss: (d) => !!d.boss,
  metal: (d) => !!(d.res && d.res.shock >= 1.4 && d.res.wet >= 1.3), // foundry.js MACHINE: weak to lightning and water
};
// Explicit lists: the kinds whose defs don't say it themselves. Stationary here is "never walks" (speed 0 and nothing
// moving it about). Hero-side summons are named by their summon kind.
export const KIND_TAGS = {
  construct: ['turret', 'torcher', 'tesla', 'snowMortar', 'medbay', 'medDrone', 'windup', // the Engineer's
    'barricade', 'crate', 'pavise', 'beehive', 'bigBomb', 'totem', 'cauldron',            // the Quartermaster's, the Crossbowman's, the Beekeeper's, the Grenadier's, the Shaman's, the Witch's
    'iceTotem', 'warDrum', 'teslaCoil'],                                                  // enemy totems and drums
  stationary: ['torcher', 'tesla', 'snowMortar', 'medbay', 'barricade', 'crate', 'pavise', 'beehive', 'bigBomb', 'totem', 'cauldron',
    'iceTotem', 'warDrum', 'teslaCoil', 'seraphHorn', 'engineValve'],
  fire: ['imp', 'warlockImp', 'fireSlime', 'hellhound', 'cinderBat', 'spiritFire', 'spiderFire', 'cinder', 'drakeSegment', 'drakeTail'],
  ice: ['snowman', 'frostWolf', 'slimeIce', 'spiderFrost', 'yeti', 'frostWraith', 'spiritFrost', 'iceTotem', 'frostGiant', 'winterQueen', 'queenImage', 'frostShaman'],
  plant: ['sproutling', 'ent', 'elderEnt', 'haybale'],
  undead: ['skeleton', 'boss', 'rattler', 'rattlerBow', 'rattlerSpear', 'rattlerMace', 'rattlerGold', 'rattlerHarrow', 'gaper', 'brute', 'ghost', 'banshee',
    'graveWarden', 'boneKing', 'mummy', 'frostWraith', 'minion'],
  spirit: ['ghost', 'banshee', 'wisp', 'spiritPoison', 'spiritHaste', 'spiritShock', 'spiritFrost', 'spiritFire', 'spiritHeal', 'spiritWard',
    'spiritBear', 'spiritWolf', 'spiritEagle', 'spiritBeaver', 'dustDevil'],
  beast: ['rat', 'wolf', 'direWolf', 'frostWolf', 'bat', 'cinderBat', 'boar', 'croc', 'crab', 'crabBlue', 'crabGreen', 'hellhound', 'yeti',
    'spiderHunter', 'spiderMomma', 'spiderFrost', 'spiderFire', 'scarab', 'scarabGold', 'cobra', 'ratPlague', 'ratKing', 'mouse', 'dynamouse',
    'alpha', 'sandSerpent', 'leechBlood', 'leechBrain', 'werewolfBeast', 'spiritBear', 'spiritWolf', 'spiritEagle', 'spiritBeaver', 'sandWurm'],
  slime: ['greatOoze', 'oozeHalf'],
  flier: ['bat', 'cinderBat', 'wisp', 'ghost', 'banshee', 'cherub', 'angel', 'seraph', 'angelFallen', 'spiritEagle', 'medDrone', 'repairDrone', 'welderDrone',
    'bee', 'wasp', 'hornet', 'beeBronze', 'beeSteel', 'waspBronze', 'waspSteel', 'hornetBronze', 'hornetSteel',
    'spiritPoison', 'spiritHaste', 'spiritShock', 'spiritFrost', 'spiritFire', 'spiritHeal', 'spiritWard', 'griffon', 'valkyrie', 'gildedSeraph'],
  metal: ['turret', 'torcher', 'tesla', 'snowMortar', 'medbay', 'medDrone', 'windup', 'cauldron', 'bigBomb', 'gildedGolem', 'greatEngine', 'engineHammer', 'engineClaw', 'engineValve', 'sawBlade'],
  demon: ['imp', 'warlockImp', 'devil', 'succubus', 'demon', 'pitLord', 'archfiend', 'hellhound'],
  holy: ['cherub', 'angel', 'seraph', 'sunBlade', 'choirSprite', 'spiritHeal', 'spiritWard', 'heraldLight', 'archon', 'radiant', 'gildedSeraph', 'seraphSinger', 'gildedGolem'],
  // casters: their plain shots are spells (isMagicHit below). Heroes: the spell-casters (the Alchemist's and the Plague
  // Doctor's flasks are chemistry, not spells).
  caster: ['pyromancer', 'frost', 'storm', 'necromancer', 'witch', 'warlock', 'cultist', 'airMage', 'telekinetic', 'earthMage',
    'cleric', 'bard', 'druid', 'seer', 'enchantress', 'clockwork', 'shaman',
    'orcShaman', 'frostShaman', 'sandMage', 'wisp', 'imp', 'warlockImp', 'cherub', 'seraph', 'choirSprite', 'heraldLight', 'heraldFallen',
    'spiritPoison', 'spiritHaste', 'spiritShock', 'spiritFrost', 'spiritFire', 'spiritHeal', 'spiritWard',
    'archon', 'radiant', 'winterQueen', 'queenImage', 'gildedSeraph', 'seraphSinger', 'graveWarden', 'boneKing', 'banshee', 'ghost'],
  mute: [],  // (the designer: Mute is a trait, always on; no kind has it yet)
  deaf: [],  // (Deaf: no kind has it yet; docs/tags17.md, suggestions)
};
const BY_KIND = {};
for (const [tag, list] of Object.entries(KIND_TAGS)) for (const k of list) (BY_KIND[k] || (BY_KIND[k] = [])).push(tag);

// The tags of a unit (or of a kind and its def). Cached on the def, per kind.
export function tagsOf(u, def) {
  const kind = typeof u === 'string' ? u : u && u.kind, d = def || (u && u.def) || {};
  const c = d._tags || (Object.defineProperty(d, '_tags', { value: {}, enumerable: false }), d._tags);
  if (c[kind]) return c[kind];
  const s = new Set();
  for (const [tag, f] of Object.entries(DERIVED)) if (f(d)) s.add(tag);
  for (const k of [kind, d.base, d.variantOf]) if (k && BY_KIND[k]) for (const t of BY_KIND[k]) s.add(t);
  for (const t of d.labels || []) s.add(t);
  return (c[kind] = s);
}
export const hasTag = (u, tag) => !!u && tagsOf(u).has(tag);

// What a tag changes about a status building on a unit: x the amount (0: none takes). The def's own res wins.
export const TAG_RES = {
  construct: { bleed: 0, poison: 0 }, // a turret doesn't bleed, and gas does nothing to iron and stone
};
export function tagRes(u, type) {
  let m = null;
  for (const t of tagsOf(u)) { const r = TAG_RES[t]; if (r && r[type] != null) m = m == null ? r[type] : Math.min(m, r[type]); }
  return m;
}

// ---------------------------------------------------------------- abilities (the heroes')
// mouth: done with the mouth (spoken, sung, shouted, whistled, a kiss, a breath, a bite): Silenced stops it.
// sound: it works by being heard (for Deaf, not built yet). magic / physical: what its hits are (isMagicHit).
export const ABILITY_TAGS = {
  mouth: ['holdTheLine', 'warSong', 'lullaby', 'rallyCry', 'oldTales', 'broadside', 'ramCharge', 'sweetheart'],
  sound: ['holdTheLine', 'warSong', 'lullaby', 'encore', 'rallyCry', 'oldTales', 'broadside', 'ramCharge', 'thunderclap'],
  magic: ['consecrate', 'mend', 'sanctuary', 'smite', 'fireball', 'flameWall', 'inferno', 'iceShard', 'frostNova', 'iceWall',
    'chainLightning', 'thunderclap', 'stormCloud', 'warSong', 'lullaby', 'encore', 'entangle', 'rejuvenate', 'callWolf',
    'raiseDead', 'lifeDrain', 'boneSpear', 'healTotem', 'spiritLink', 'rainDance', 'frogHex', 'cursedBrew', 'broomRide',
    'eldritchBeam', 'summonImp', 'darkBargain', 'bloodPact', 'ritualCircle', 'foresight', 'premonition', 'starfall',
    'heartstring', 'sweetheart', 'heartbreak', 'rewind', 'timeBubble', 'stopClock', 'gale', 'updraft', 'cyclone',
    'hurl', 'levitate', 'mindShield', 'earthquake', 'spikeChain', 'stoneWall', 'valkyrieCall', 'skyDive', 'nullify'],
};
const AB = {};
for (const [tag, list] of Object.entries(ABILITY_TAGS)) for (const id of list) (AB[id] || (AB[id] = new Set())).add(tag);
export const abilityHas = (id, tag, ab) => !!((AB[id] && AB[id].has(tag)) || (ab && ab.labels && ab.labels.includes(tag)));

// ---------------------------------------------------------------- enemy moves (elites.js due(u, key))
// The moves an enemy's brain times by key. Only the mouth ones are listed: a key here is a move made with the mouth
// whichever kind has it; 'kind:key' is that kind's alone (the same key means something else elsewhere).
export const MOVE_TAGS = {
  mouth: ['breath', 'howl', 'bite', 'wail', 'screech', 'song', 'whistle', 'kiss', 'note',
    'hobgoblin:rally', 'cinder:call', 'cinder:scorch'],
  sound: ['howl', 'wail', 'screech', 'song', 'whistle', 'note', 'hobgoblin:rally', 'cinder:call'],
};
const MV = {};
for (const [tag, list] of Object.entries(MOVE_TAGS)) for (const k of list) (MV[k] || (MV[k] = new Set())).add(tag);
export function moveHas(u, key, tag) {
  const own = u && MV[u.kind + ':' + key]; if (own) return own.has(tag);
  const base = u && u.def && u.def.base && MV[u.def.base + ':' + key]; if (base) return base.has(tag);
  return !!(MV[key] && MV[key].has(tag));
}

// ---------------------------------------------------------------- Silenced (the designer: "the silence stopping mouth abilities")
// SILENCED (u.silencedT, a timer: sim.js silence()): it can't use an ability or move tagged mouth; everything else it
// does as ever. A Mute kind is silenced for good. (The Warden's Nullify, "nothing works", is NULLIFIED instead: every
// ability locked, kits3.js; it silences as well.)
export const isSilenced = (u) => !!u && (u.silencedT > 0 || hasTag(u, 'mute'));
export const abilityBlocked = (u, id, ab) => isSilenced(u) && abilityHas(id, 'mouth', ab);
export const moveBlocked = (u, key) => isSilenced(u) && moveHas(u, key, 'mouth');

// ---------------------------------------------------------------- fire and water
// DOUSED: a fire-tagged unit that is Wet, or stands in water, takes what Burn would do to anything else at that much
// build-up: (base + perWet x wet) a second from `from` wet up (sim.js statusTick); standing in water counts as at least
// `water` wet (a flier over it doesn't count). Bosses take `boss` of it, their parts none (the core takes the blows).
// It hisses: steam off the body all the while, the word once every `hissEvery` s.
export const DOUSE = { base: 1.5, perWet: 0.06, from: 8, water: 60, boss: 0.5, hissEvery: 2.5 };
export function douseRate(u) {
  if (!hasTag(u, 'fire') || u.def.part || u.def.segment || u.linkTo) return 0;
  let wet = (u.st && u.st.wet) || 0;
  if (u.soakedT > 0 && !hasTag(u, 'flier')) wet = Math.max(wet, DOUSE.water);
  if (wet < DOUSE.from) return 0;
  return (DOUSE.base + DOUSE.perWet * wet) * (u.def.boss ? DOUSE.boss : 1);
}

// KINDLED (the designer: "Fire tagged enemies that get set on fire don't take damage, instead getting a rage like
// boost"): a fire-tagged unit builds Burn as anything else does (its own burn resistance set aside), but burning hurts
// it not at all: it deals up to `dealt`, strikes up to `atkSpeed` and moves up to `move` x fill (the burn's value / 100;
// bosses `boss` of the extra). Its Scorch burst hurts nobody (it is its own fire): it FLARES instead, the full boost
// for `flareT` s. Water still hurts it, and soaking it still puts half the burning out.
export const KINDLED = { dealt: 1.3, atkSpeed: 1.3, move: 1.15, boss: 0.5, flareT: 4, col: '#FF7A2F' };
export function kindledBuff(u, fill, dur = 0.25, id = 'kindled') {
  const k = Math.max(0, Math.min(1, fill)) * (u.def.boss ? KINDLED.boss : 1), m = (x) => 1 + (x - 1) * k;
  return { id, dur, dealt: m(KINDLED.dealt), atkSpeed: m(KINDLED.atkSpeed), move: m(KINDLED.move), glow: KINDLED.col };
}

// ---------------------------------------------------------------- what a hit is
// The designer: "Also think about the physical damage types, sharp vs blunt damage", and then: "magic shouldn't fall
// under blunt or sharp right? Would be a separate 'magic' type. Like a fireball would be magic + fire effect. You
// could have a monster hunter that resists magic but not its effects."
// So every hit has two separate things, and a resistance to one never touches the other:
//   type      exactly one of 'sharp' | 'blunt' | 'magic' (null for a status ticking: burning, poison, bleeding are not
//             hits). A resistance to a type (def.hitRes / TAG_HIT_RES below) scales the hit's DAMAGE only.
//   elements  none or more of fire, water, frost, shock, poison, holy, curse, nature... : what it carries (the
//             statuses on the blow, ELEMENT_OF). A resistance to an element is the def's res (units.js, statuses.js:
//             burn 0.5 = half the burn): it scales that element's BUILD-UP only, never the hit's damage.
//   A fireball is { type: 'magic', elements: ['fire'] }: a magic-proof foe takes little of the blast but burns as ever;
//   a fire-proof one takes the whole blast and doesn't burn.
// hitKinds(o, src) -> { type, elements, slam, explosion, gas, zone, beam, shot, dot }: o is hurt()'s options object,
// src its source (or null). The delivery flags:
//   slam       a blow through the floor (o.slam, or an ability in SLAM_ABILITIES): misses anything off the floor
//   explosion  a blast (sim.js explode passes it): reaches a slime mid-hop
//   gas        a cloud (o.gas): reaches a slime mid-hop
//   zone       a telegraphed danger zone (sim.js dangerTick passes its kind as o.zone)
//   beam       a held ray (o.beam)
//   shot       a projectile (sim.js projectiles passes its kind as o.proj)
//   dot        a status ticking, a pool's sting
// The type, in order, the first that answers:
//   1. o.magic / o.sharp / o.blunt (a caller can always say; o.physical: not magic, the edge as below)
//   2. a status ticking (o.dot with o.stk): null
//   3. magic: the ability it came from is tagged magic (ABILITY_TAGS; o.ab / o.pab, else the one being cast by src
//      right now); a shot of a MAGIC_SHOTS kind; a zone of a MAGIC_ZONES kind; a shot or zone from a caster-tagged src
//   4. the edge: the ability's (EDGE_ABILITIES); the shot's kind (EDGE_SHOTS, else blunt); a zone ('blade' sharp, else
//      blunt); an explosion: blunt; the striker: a hero's weapon (EDGE_WEAPON), its kind (EDGE_KINDS), its tags (a
//      beast bites and claws: sharp; a slime, a plant, a construct: blunt); else sharp (most foes carry a blade)
export const MAGIC_SHOTS = new Set(['bolt', 'fireball', 'frostbolt', 'holy', 'soul', 'lightning', 'ray', 'drain', 'spirit', 'spiritOrb', 'orb', 'note',
  'kiss', 'kissTo', 'kissBack', 'hexbolt', 'glimmer', 'eyeBolt', 'zeus', 'uncharm', 'spark', 'sleepy', 'shadowBolt', 'radiance',
  'heartstring', 'heartbreak', 'heartbreakCast', 'fear', 'confuse', 'charm', 'clockHand', 'loveArrow']);
export const MAGIC_ZONES = new Set(['holy', 'soul', 'lightning', 'radiance', 'spirit', 'curse', 'hex']);
export const EDGE_WEAPON = { great: 'sharp', blade: 'sharp', thrust: 'sharp', twin: 'sharp', fork: 'sharp', scythe: 'sharp', claw: 'sharp', bite: 'sharp', heavy: 'blunt', palm: 'blunt' };
export const EDGE_KINDS = {
  sharp: ['knight', 'rogue', 'twinfang', 'wildmane', 'granny', 'cultist', 'huntress', 'ninja', 'marksman', 'pirate', 'wolf', 'mobDagger', 'mobAxe', 'mobPitchfork'],
  blunt: ['paladin', 'tower', 'berserker', 'slinger', 'minion', 'warlockImp', 'golem', 'gildedGolem', 'ogre', 'troll', 'rockTroll', 'brute', 'rattlerMace',
    'yeti', 'snowman', 'drummer', 'banditBrute', 'mummy', 'crab', 'crabBlue', 'crabGreen', 'engineHammer', 'greatEngine', 'chainCrawler', 'warDrum', 'boss', 'boneKing', 'frostGiant', 'hobgoblin'],
};
export const EDGE_ABILITIES = {
  sharp: ['backstab', 'shadowstep', 'fanOfKnives', 'cleave', 'leap', 'reap', 'hook', 'greatSweep', 'riposte', 'impale', 'brace', 'bearRoar', 'pickpocket',
    'shadowWalk', 'deathMark', 'harvest', 'soulCandle', 'crescentCut', 'iaido', 'runningThrow', 'bound', 'prey', 'aimedShot', 'ricochet', 'bayonet',
    'shurikenFan', 'caltrops', 'pointBlank', 'snareNet', 'jawTrap', 'netThrow', 'spearThrow', 'reelIn', 'looseFalcon', 'flock', 'barrage', 'frostArrow',
    'pounce', 'pinBolt', 'crankUp', 'disarm'],
  blunt: ['shieldBash', 'groundPound', 'charge', 'holdTheLine', 'shockwave', 'whirl', 'toss', 'forkCharge', 'spadeBat', 'maul', 'thunderBlow', 'warHorn',
    'skullSplitter', 'hammerThrow', 'swoop', 'wingShield', 'anchorDrop', 'rogueWave', 'stunStone', 'ramCharge', 'palmStrike', 'flurry', 'innerPeace',
    'juggle', 'shieldRush', 'surround', 'chainGang', 'manacle', 'foodFight', 'challenge', 'burrow', 'mock', 'befuddle'],
};
export const EDGE_SHOTS = {
  sharp: ['arrow', 'fireArrow', 'dagger', 'knife', 'knives', 'shuriken', 'kunai', 'javelin', 'harpoon', 'cbolt', 'aresSpear', 'shard', 'icicle', 'pellet',
    'bullet', 'thorn', 'bone', 'bee', 'spear', 'dart', 'darts'],
  blunt: ['stone', 'tkStone', 'ball', 'bomb', 'pot', 'pie', 'food', 'clod', 'snow', 'snowball', 'flask', 'vial', 'hammer', 'warhammer', 'cog', 'manacles', 'bolas', 'boulder', 'rock', 'water', 'sand'],
};
export const SLAM_ABILITIES = ['groundPound', 'shockwave', 'earthquake'];
// the statuses a blow carries, as elements (a blow's stagger, sleepiness and the like are effects, not elements)
export const ELEMENT_OF = { burn: 'fire', wet: 'water', chill: 'frost', shock: 'shock', poison: 'poison', radiance: 'holy', curse: 'curse', entangle: 'nature' };
const EDGE = {};
for (const [e, l] of Object.entries(EDGE_KINDS)) for (const k of l) EDGE['k:' + k] = e;
for (const [e, l] of Object.entries(EDGE_ABILITIES)) for (const k of l) EDGE['a:' + k] = e;
for (const [e, l] of Object.entries(EDGE_SHOTS)) for (const k of l) EDGE['s:' + k] = e;
const SLAM = new Set(SLAM_ABILITIES);
const abOf = (o, src) => o.ab || o.pab || (src && src.kit && src.kit.using) || (src && CUR.abU === src ? CUR.ab : null);
function edgeOf(o, src, ab) {
  if (ab && EDGE['a:' + ab]) return EDGE['a:' + ab];
  if (o.proj) return EDGE['s:' + o.proj] || 'blunt';
  if (o.zone) return o.zone === 'blade' ? 'sharp' : 'blunt';
  if (o.explosion || !src) return 'blunt';
  if (src.def && src.def.weapon && EDGE_WEAPON[src.def.weapon]) return EDGE_WEAPON[src.def.weapon];
  const k = EDGE['k:' + src.kind] || (src.def && src.def.base && EDGE['k:' + src.def.base]);
  if (k) return k;
  if (hasTag(src, 'beast')) return 'sharp';
  if (hasTag(src, 'slime') || hasTag(src, 'plant') || hasTag(src, 'construct')) return 'blunt';
  return 'sharp';
}
// the hit's damage type alone: 'sharp' | 'blunt' | 'magic' | null
export function hitType(o = {}, src = null) {
  if (o.magic) return 'magic';
  if (o.sharp) return 'sharp';
  if (o.blunt) return 'blunt';
  if (o.dot && o.stk) return null;
  const ab = abOf(o, src);
  if (!o.physical) {
    if (ab && abilityHas(ab, 'magic')) return 'magic';
    if (o.proj && MAGIC_SHOTS.has(o.proj)) return 'magic';
    if (o.zone && MAGIC_ZONES.has(o.zone)) return 'magic';
    if ((o.proj || o.zone || o.shot) && src && hasTag(src, 'caster')) return 'magic';
  }
  return edgeOf(o, src, ab);
}
export function hitKinds(o = {}, src = null) {
  const ab = abOf(o, src), elements = [];
  for (const [st, el] of Object.entries(ELEMENT_OF)) if (o[st] > 0) elements.push(el);
  if (o.stk && ELEMENT_OF[o.stk] && !elements.includes(ELEMENT_OF[o.stk])) elements.push(ELEMENT_OF[o.stk]);
  return { type: hitType(o, src), elements, slam: !!(o.slam || (ab && SLAM.has(ab) && !o.shot)), explosion: !!o.explosion, gas: !!o.gas,
    zone: o.zone || null, beam: !!o.beam, shot: !!(o.shot || o.proj), dot: !!o.dot };
}
// The Water Mage's Bubble Shield ("blocks magic, not physical attacks") asks this.
export const isMagicHit = (o = {}, src = null) => hitType(o, src) === 'magic';
// A resistance to a damage type (x the hit's damage, never its elements): def.hitRes = { magic: 0.5 }, or a tag's in
// TAG_HIT_RES. The mechanism only: no kind or tag has one yet (the resistances are another lane's pass; docs/tags17.md
// has the proposals).
export const TAG_HIT_RES = {};
export function hitResOf(u, type) {
  if (!type) return 1;
  const own = u.def && u.def.hitRes; if (own && own[type] != null) return own[type];
  let m = 1; for (const t of tagsOf(u)) { const r = TAG_HIT_RES[t]; if (r && r[type] != null) m *= r[type]; }
  return m;
}
export const anyHitRes = (u) => !!((u.def && u.def.hitRes) || Object.keys(TAG_HIT_RES).some((t) => hasTag(u, t)));

// ---------------------------------------------------------------- height (the designer's answers on slimes and leaps)
// Three layers. FLOOR: everyone, most of the time. HOVERING (u.airborne: a slime mid-hop): over the pools, puddles,
// trails and spikes and every telegraphed floor zone, and missed by slams; gas and explosions still reach it, and so
// do blows and shots. FLYING (u.flyT > 0: the Griffon's Swoop and the Valkyrie's leaps while she is in the air, the
// Witch on her broom): over everything on the floor, and nothing reaches it but shots (and what was already on it:
// burning, poison). Kinds that always fly (bats, spirits, angels) stay on the floor layer: up there for good, every
// floor zone and slam would miss them (docs/tags17.md, suggestions).
export const layerOf = (u) => (!u ? 'floor' : u.flyT > 0 ? 'flying' : u.airborne ? 'hovering' : 'floor');
// does a hit (hitKinds) reach a unit on that layer?
export function reaches(layer, k) {
  if (layer === 'floor') return true;
  if (layer === 'hovering') return !k.slam;
  return k.shot || k.dot;
}
