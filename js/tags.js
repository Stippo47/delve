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
//   hits         isMagicHit(o, src): is this blow magic or physical (hurt()'s options object and its source).
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

// ---------------------------------------------------------------- magic or physical
// isMagicHit(o, src): o is hurt()'s options object, src its source (or null). In order, the first that answers:
//   1. o.magic: true, o.physical: false (a caller can always say)
//   2. a status ticking (o.dot with o.stk: burning, poison, bleeding, roots): false (not a hit at all)
//   3. the ability it came from (o.ab or o.pab, else the one running right now when src is the one casting it):
//      tagged magic in ABILITY_TAGS: true
//   4. a shot (o.proj, the projectile's kind; sim.js projectiles passes it): MAGIC_SHOTS: true
//   5. a telegraphed zone (o.zone, the danger zone's kind; sim.js dangerTick passes it): MAGIC_ZONES: true
//   6. a shot or a zone whose source is tagged caster: true
//   7. otherwise: false (blades, claws, arrows, bullets, stones, bombs, bites, fists)
export const MAGIC_SHOTS = new Set(['bolt', 'fireball', 'frostbolt', 'holy', 'soul', 'lightning', 'ray', 'drain', 'spirit', 'spiritOrb', 'orb', 'note',
  'kiss', 'kissTo', 'kissBack', 'hexbolt', 'glimmer', 'eyeBolt', 'cbolt', 'zeus', 'uncharm', 'spark', 'sleepy', 'shadowBolt', 'radiance',
  'heartstring', 'heartbreak', 'heartbreakCast', 'fear', 'confuse', 'charm', 'clockHand', 'loveArrow']);
export const MAGIC_ZONES = new Set(['holy', 'soul', 'lightning', 'radiance', 'spirit', 'curse', 'hex']);
export function isMagicHit(o = {}, src = null) {
  if (o.magic) return true;
  if (o.physical) return false;
  if (o.dot && o.stk) return false;
  const ab = o.ab || o.pab || (src && src.kit && src.kit.using) || (src && CUR.abU === src ? CUR.ab : null);
  if (ab && abilityHas(ab, 'magic')) return true;
  if (o.proj && MAGIC_SHOTS.has(o.proj)) return true;
  if (o.zone && MAGIC_ZONES.has(o.zone)) return true;
  if ((o.proj || o.zone || o.shot) && src && hasTag(src, 'caster')) return true;
  return false;
}
