// Round 18, lane res18: the proposed resistance scheme, as data, for the audit's own tools (shares.mjs, bench.mjs).
// NOTHING here is read by the game. It is written to sit on top of the tag lane's registry (tags17, js/tags.js):
// TAG_RES there is "what a tag changes about a status building on a unit; the def's own res wins", so the scheme is
//   1. a kind's own def.res entry (an exception, with its reason below)        -- wins
//   2. OWN: a kind takes none of the element its own body makes                  -- 0
//   3. TAG_RES: of the kind's tags that name the status, the lowest              -- (immune beats resist beats weak)
//   4. otherwise 1
// Two axes (the designer, round 18): EFFECT (this file's TAG_RES: how much of a status / element builds) and TYPE
// (TYPE_RES: how much of a hit's damage lands, by its damage type: sharp, blunt or magic). Today's def.res is the
// effect axis only (sim.js addStatus); there is no type axis yet (armour and "heavy" blows are the nearest thing).

// ---------------------------------------------------------------- tags (the tag lane's lists, plus three of mine)
// From tags17 KIND_TAGS (enemy kinds only) and its DERIVED rules (construct = def.construct || def.turret, stationary =
// def.turret, slime = def.hops/splits, undead = def.undead, boss = def.boss). Mine: bone, stone, reptile. metal is an
// explicit list here (tags17 derives it from res.shock >= 1.4 && res.wet >= 1.3, which stops working once those
// numbers move into TAG_RES).
export const TAGS = {
  construct: ['iceTotem', 'warDrum', 'teslaCoil', 'sunBlade'], // + every def.construct / def.turret (sunBlade: mine, an animated sword)
  stationary: ['iceTotem', 'warDrum', 'teslaCoil', 'seraphHorn', 'engineValve'], // + every def.turret
  fire: ['imp', 'fireSlime', 'hellhound', 'cinderBat', 'spiritFire', 'spiderFire', 'cinder', 'drakeSegment', 'drakeTail'],
  ice: ['snowman', 'frostWolf', 'slimeIce', 'spiderFrost', 'yeti', 'frostWraith', 'spiritFrost', 'iceTotem', 'frostGiant', 'winterQueen', 'queenImage', 'frostShaman'],
  plant: ['sproutling', 'ent', 'elderEnt'],
  undead: ['skeleton', 'boss', 'rattler', 'rattlerBow', 'rattlerSpear', 'rattlerMace', 'rattlerGold', 'rattlerHarrow', 'gaper', 'brute', 'ghost', 'banshee',
    'graveWarden', 'boneKing', 'mummy', 'frostWraith'],
  spirit: ['ghost', 'banshee', 'wisp', 'spiritPoison', 'spiritHaste', 'spiritShock', 'spiritFrost', 'spiritFire', 'spiritHeal', 'spiritWard', 'dustDevil', 'frostWraith'],
  beast: ['rat', 'wolf', 'direWolf', 'frostWolf', 'bat', 'cinderBat', 'boar', 'croc', 'crab', 'crabBlue', 'crabGreen', 'hellhound', 'yeti',
    'spiderHunter', 'spiderMomma', 'spiderFrost', 'spiderFire', 'scarab', 'scarabGold', 'cobra', 'ratPlague', 'ratKing', 'mouse', 'dynamouse',
    'alpha', 'sandSerpent', 'leechBlood', 'leechBrain', 'sandWurm'],
  slime: ['greatOoze', 'oozeHalf'], // + every def.hops / def.splits
  flier: ['bat', 'cinderBat', 'wisp', 'ghost', 'banshee', 'cherub', 'angel', 'seraph', 'angelFallen', 'repairDrone', 'welderDrone',
    'bee', 'wasp', 'hornet', 'beeBronze', 'beeSteel', 'waspBronze', 'waspSteel', 'hornetBronze', 'hornetSteel',
    'spiritPoison', 'spiritHaste', 'spiritShock', 'spiritFrost', 'spiritFire', 'spiritHeal', 'spiritWard', 'gildedSeraph', 'frostWraith', 'sunBlade'],
  metal: ['gearSprite', 'cogSprite', 'bombBot', 'autoBomb', 'automaton', 'turretSteam', 'turretFlame', 'turretGun', 'turretLaser', 'mortar', 'mortarFire', 'mortarPoison',
    'teslaCoil', 'repairDrone', 'welderDrone', 'bee', 'wasp', 'hornet', 'beeBronze', 'beeSteel', 'waspBronze', 'waspSteel', 'hornetBronze', 'hornetSteel',
    'sawBlade', 'chainCrawler', 'crawlerPlate', 'drillBot', 'greatEngine', 'engineHammer', 'engineClaw', 'sunBlade'],
  demon: ['imp', 'devil', 'succubus', 'demon', 'pitLord', 'archfiend', 'hellhound'],
  holy: ['cherub', 'angel', 'seraph', 'sunBlade', 'choirSprite', 'spiritHeal', 'spiritWard', 'heraldLight', 'archon', 'radiant', 'gildedSeraph', 'seraphSinger', 'gildedGolem'],
  boss: [], // every def.boss
  // mine
  bone: ['skeleton', 'boss', 'rattler', 'rattlerBow', 'rattlerSpear', 'rattlerMace', 'rattlerGold', 'rattlerHarrow', 'gaper', 'brute', 'graveWarden', 'boneKing'],
  stone: ['golem', 'gildedGolem', 'dartTrap'],
  reptile: ['lizardman', 'lizardBlade', 'lizardChief', 'croc', 'cobra', 'sandSerpent', 'dragonborn'],
};
export function tagsOfDef(kind, d) {
  const s = new Set();
  if (d.construct || d.turret) s.add('construct');
  if (d.turret) s.add('stationary');
  if (d.hops != null || d.splits) s.add('slime');
  if (d.undead) s.add('undead');
  if (d.boss) s.add('boss');
  for (const [t, list] of Object.entries(TAGS)) for (const k of [kind, d.base]) if (k && list.includes(k)) s.add(t);
  return s;
}

// ---------------------------------------------------------------- the effect axis: per tag (x the build-up; 0 none)
export const TAG_RES = {
  fire: { burn: 0, chill: 1.5, wet: 1.3 },          // + the tag lane: a burning fire thing is enraged, not hurt; Doused hurts it
  ice: { chill: 0, burn: 1.4 },                     // frozen things don't freeze; they melt
  plant: { burn: 1.6, entangle: 0 },                // wood burns; roots don't bind roots
  bone: { poison: 0.35, burn: 0.8, chill: 1.2 },    // today's skeleton row, made the rule for every skeleton
  spirit: { poison: 0, curse: 0 },                  // today's ghost and spirit row: no body to sicken, already of the curse
  construct: { poison: 0, bleed: 0, curse: 0, entangle: 0.5 }, // tags17's poison and bleed, today's machine curse and entangle
  metal: { shock: 1.4, wet: 1.3 },                  // today's foundry.js MACHINE row
  stone: { burn: 0.6, chill: 0.6, wet: 0.5 },       // today's golem row
  stationary: { stagger: 0 },                       // nothing to knock over (turrets have stagger 0 today)
  reptile: { chill: 1.3, burn: 0.8 },               // cold-blooded: today's lizard and croc row
  demon: { burn: 0.25 },                            // today's devils (0.2) and dragonborn (0.3), one number
  holy: { radiance: 0 },                            // as today
  boss: { charm: 0 },                               // round 14's ruling, today code-only (sim.js charmProof): made data, so the Book shows it
};
// The calls (each a package the designer can take or leave; bench.mjs and diff.mjs --calls measure each):
export const CALLS = {
  deadBleed: { undead: { bleed: 0 }, spirit: { bleed: 0 }, plant: { bleed: 0 }, slime: { bleed: 0 } }, // no blood: skeletons, ghosts, wood, jelly
  deadSleep: { undead: { sleepy: 0 } },                                     // the dead don't sleep
  mindless: { construct: { charm: 0, fear: 0, sleepy: 0 } },                // machines can't be charmed, frightened or lulled
  flier: { flier: { entangle: 0.5 }, spirit: { entangle: 0 } },             // vines catch a wing but can't hold it; mist can't be held at all
  holy: { undead: { radiance: 1.3 }, demon: { radiance: 1.3 }, holy: { curse: 1.3 } }, // light burns the dead and the damned; the dark stains the holy
};
// Calls that RAISE a tag's number (set outright, over the base rules; a kind's own exception still wins):
export const RAISE = {
  jinx: { construct: { curse: 1 } },  // machines can be jinxed: a hexed turret's next shot backfires, a hexed golem hits itself
};
// OWN: the element a kind's body makes, it takes none of (the wielders of fire, a torch, a hot hammer, a coated knife,
// are not on this list: Torch Bandit, Knife Bandit, the Foundry Smith take what anyone takes)
export const OWN = {
  burn: ['turretFlame', 'mortarFire'], // + every fire tag
  chill: [],                           // (every ice tag already takes none)
  poison: ['ratPlague', 'slimePoison', 'slimeletPoison', 'cobra', 'sandSerpent', 'spiderHunter', 'spiderMomma', 'crabGreen', 'spiritPoison', 'mortarPoison'],
  shock: ['spiritShock', 'teslaCoil', 'chainCrawler', 'crawlerPlate'],
  radiance: [],                        // (every holy tag already takes none)
  curse: ['mummy', 'angelFallen', 'heraldFallen'],
  charm: ['succubus'],
};
// Exceptions: a kind's own def.res kept (or set) on top of the rules, each with its reason. Anything not listed loses
// its def.res and takes the rules. Designed bosses (js/boss-*.js) and their parts keep their own lists whole (a boss's
// list is part of its fight), apart from the boss-poison call below.
export const EXCEPT = {
  ghost: { res: { burn: 1.3, chill: 0.2 }, why: 'its habit line: "Poison does nothing to it, fire does plenty"; the grave\'s cold' },
  banshee: { res: { burn: 1.3, chill: 0.2 }, why: 'a ghost: the same as the ghost' },
  mummy: { res: { burn: 1.8, poison: 0 }, why: '"Fire loves it": dry wrappings; embalmed, poison has nothing to work on' },
  troll: { res: { burn: 1.4 }, why: 'fire is what stops its regrowth (its habit line)' },
  rockTroll: { res: { burn: 1.4 }, why: 'a troll: the same' },
  slimeSludge: { res: { burn: 1.4 }, why: 'half oil: burning, it runs twice as fast' },
  bombBot: { res: { burn: 1.5 }, why: '"Fire sets it off"' },
  autoBomb: { res: { burn: 1.5 }, why: 'a bomb bot' },
  dragonborn: { res: { burn: 0.3 }, why: 'dragon blood: near-fireproof without being made of fire' },
  pitLord: { res: { burn: 0 }, why: 'a lord of the pit: as fireproof as its imps' },
  archfiend: { res: { burn: 0 }, why: 'the same' },
  foundrySmith: { res: { burn: 0.5, chill: 1.3 }, why: 'DESIGN: today burn 0; a person at a forge, hardened to heat, not made of fire (chill 1.3 kept: red-hot)' },
  angelFallen: { res: { radiance: 0 }, why: 'still an angel: the light is its own (curse 0 by OWN)' },
  heraldFallen: { res: { radiance: 0 }, why: 'the same' },
  sunBlade: { res: { stagger: 0 }, why: '"Nothing stops or shoves it on the way" (it also locks out stuns in code, foes10.js bladeLock)' },
  gildedGolem: { res: { wet: 0.5, shock: 1 }, why: 'gold: no rust and no spark; stone rules, not metal (tags17 lists it metal: its description says lightning and water get in)' },
  rattlerGold: { res: { all: 0 }, why: 'the gilded shell (a buff in code, foes9.js goldenBrain): no status at all; the data said so for nine of fifteen' },
  scarabGold: { res: { all: 0 }, why: 'the same (dunes.js scarabBrain)' },
  dustDevil: { res: { all: 0 }, why: 'a gust of weather the Sand Mage calls up; its list missed the round 13 and 15 six' },
  sawBlade: { res: { all: 0 }, why: 'a trap, as today' },
  queenImage: { keep: true, why: 'the Winter Queen mirror image: part of her fight, its list kept' },
  seraphSinger: { keep: true, why: 'the Gilded Seraph choir: part of its fight' },
  serpentCoil: { keep: true, why: 'a segment: whatever lands on it goes to the head' },
  crawlerPlate: { keep: true, why: 'a segment: whatever lands on it goes to the head' },
  boss: { keep: true, why: 'the old Bone King def: no dungeon uses it' },
  elderEnt: { keep: true, why: 'the Wildwood boss: burning is its rampage (burn 1 on purpose), and nothing else holds it' },
};
// Designed bosses and parts keep their lists. CALL (boss poison): their blanket poison 0.25-0.3 dropped to 1 (the
// boss poison drain is already cut to 40%, sim.js statusTick), except where the theme says none (Ooze, Engine).
// The dungeon bosses whose fights are built round their lists (js/boss-*.js, the Bone King, the Elder Ent).
export const DESIGNED = ['chieftain', 'greatOoze', 'winterQueen', 'cinder', 'gildedSeraph', 'sandWurm', 'greatEngine', 'boneKing', 'elderEnt'];
export const BOSS_POISON_CALL = { boneKing: 1, chieftain: 1, cinder: 1, winterQueen: 1, sandWurm: 1, gildedSeraph: 1 };

// ---------------------------------------------------------------- the type axis: per tag (x a hit's damage). Not built
// anywhere yet; the tag lane is adding the hit kinds (sharp / blunt / magic). Proposed, not measured in fights.
export const TYPE_RES = {
  bone: { sharp: 0.8, blunt: 1.25 },               // a blade slips between ribs; a mace breaks them
  stone: { sharp: 0.7, blunt: 1.2 },               // the golems and the dart trap
  spirit: { sharp: 0.6, blunt: 0.6, magic: 1.25 }, // CALL: ghosts and spirits half-there for weapons
  plant: { sharp: 1.2 },                           // axes fell trees
  // metal and shells: no multiplier: armour already does it (armour.js); CALL: blunt, not "heavy", gets past half of it
  // slime: none (CALL: either story works)
};

const STATUSES = ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger', 'radiance', 'curse', 'entangle', 'charm', 'confuse', 'sleepy', 'bleed', 'fear', 'shackle'];
// The proposed res map of one kind (all fifteen), and where each number comes from.
// opts.calls: which calls to take ('bossPoison', 'holy'); the base proposal takes neither.
export function proposedRes(kind, d, opts = {}) {
  const tags = tagsOfDef(kind, d), res = {}, from = {};
  const ex = EXCEPT[kind];
  const designed = DESIGNED.includes(kind) || !!d.part; // (the dungeon bosses with a fight of their own, and every part)
  if ((ex && ex.keep) || designed) {
    for (const s of STATUSES) { res[s] = d.res && d.res[s] != null ? d.res[s] : 1; from[s] = 'own list'; }
    if (tags.has('boss')) { res.charm = 0; from.charm = 'boss'; }
    if (opts.calls && opts.calls.includes('bossPoison') && BOSS_POISON_CALL[kind] != null) { res.poison = BOSS_POISON_CALL[kind]; from.poison = 'call: boss poison'; }
    // (a call that reaches a designed boss: its tag rule overrides its list, e.g. the Bone King's Radiance 0.5)
    if (!d.part) for (const c of (opts.calls || [])) if (CALLS[c]) for (const t of tags) for (const [st, v] of Object.entries(CALLS[c][t] || {})) { res[st] = v; from[st] = 'call: ' + c; }
    return { res, from, tags: [...tags] };
  }
  for (const s of STATUSES) {
    if (ex && ex.res && (ex.res[s] != null || ex.res.all != null)) { res[s] = ex.res[s] ?? ex.res.all; from[s] = 'exception'; continue; }
    const own = (s === 'burn' && tags.has('fire')) || (s === 'chill' && tags.has('ice')) || (s === 'radiance' && tags.has('holy')) || (OWN[s] && OWN[s].includes(kind));
    if (own) { res[s] = 0; from[s] = 'own element'; continue; }
    let m = null, by = null;
    const rules = [[TAG_RES, '']]; for (const c of (opts.calls || [])) if (CALLS[c]) rules.push([CALLS[c], 'call: ' + c + ': ']);
    for (const [R, pre] of rules) for (const t of tags) { const r = R[t]; if (r && r[s] != null && (m == null || r[s] < m)) { m = r[s]; by = pre + t; } }
    res[s] = m ?? 1; from[s] = by || '';
    for (const c of (opts.calls || [])) if (RAISE[c]) for (const t of tags) { const v = RAISE[c][t] && RAISE[c][t][s]; if (v != null) { res[s] = v; from[s] = 'call: ' + c + ': ' + t; } }
  }
  return { res, from, tags: [...tags] };
}
export { STATUSES };
