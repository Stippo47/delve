// Round 16, lane play16: the ways a player might play a fresh save (tools/play16/campaign.mjs runs them).
//   starter: the hero they start with (the three starters are all owned from the first launch; one seat to begin)
//   party:   'solo' (the starter alone, whatever seats open), 'fill' (every open seat filled: the starter, then the
//            others by level, the free starters first), 'bought' (heroes bought with gold go in ahead of the free starters)
//   spend:   'abilities' (abilities, their tiers and the nodes on the way to them first, then the second trinket slot,
//            keystones, stats), 'stats' (the plain stat spokes first, abilities only once those are full), 'auto' (the
//            game's own progress.js autoSpend)
//   gold:    'balanced' (a healing draught each, a cheap trinket each, trinket levels when rich, a hero for an empty seat),
//            'trinkets' (everything on trinkets: the best affordable, better ones as gold allows, then levels),
//            'heroes' (everything saved for new heroes: the Cleric first), 'potions' (two healing draughts a hero every run)
//   depth:   'push' (from the furthest checkpoint, never leave: the run ends at a wipe or the boss; one floor back after
//            three quick wipes, as tools/runs.mjs --campaign does), 'floor' (leave as each floor is finished, between its
//            last room and the next floor: free, and the checkpoint moves on), 'cautious' (push, but leave between rooms
//            when the party is under 30% health with no draughts left: 20% of the run's gold lost)
export const STRATS = {
  'archer-solo':       { starter: 'archer', party: 'solo', spend: 'abilities', gold: 'balanced', depth: 'push', desc: 'Lone Archer, points into abilities first' },
  'archer-solo-stats': { starter: 'archer', party: 'solo', spend: 'stats', gold: 'balanced', depth: 'push', desc: 'Lone Archer, stat nodes first' },
  'archer-fill':       { starter: 'archer', party: 'fill', spend: 'abilities', gold: 'balanced', depth: 'push', desc: 'Archer, every seat filled as it opens (the baseline)' },
  'archer-trinkets':   { starter: 'archer', party: 'fill', spend: 'abilities', gold: 'trinkets', depth: 'push', desc: 'Archer + seats, all gold into trinkets' },
  'archer-heroes':     { starter: 'archer', party: 'bought', spend: 'abilities', gold: 'heroes', depth: 'push', desc: 'Archer + seats, all gold into new heroes (fielded)' },
  'archer-potions':    { starter: 'archer', party: 'fill', spend: 'abilities', gold: 'potions', depth: 'push', desc: 'Archer + seats, gold into healing draughts' },
  'archer-floor':      { starter: 'archer', party: 'fill', spend: 'abilities', gold: 'balanced', depth: 'floor', desc: 'Archer + seats, leave after every floor' },
  'archer-cautious':   { starter: 'archer', party: 'fill', spend: 'abilities', gold: 'balanced', depth: 'cautious', desc: 'Archer + seats, leave when badly hurt' },
  'paladin-fill':      { starter: 'paladin', party: 'fill', spend: 'abilities', gold: 'balanced', depth: 'push', desc: 'Paladin start, every seat filled' },
  'twinfang-fill':     { starter: 'twinfang', party: 'fill', spend: 'abilities', gold: 'balanced', depth: 'push', desc: 'Twinfang start, every seat filled' },
  'paladin-solo':      { starter: 'paladin', party: 'solo', spend: 'abilities', gold: 'balanced', depth: 'push', desc: 'Lone Paladin, abilities first' },
};
// The order free starters and bought heroes join in (the two other starters first: they cost nothing).
export const JOIN = ['paladin', 'archer', 'twinfang', 'cleric', 'pyromancer', 'druid', 'berserker', 'frost', 'bard'];
export const HERO_BUY = ['cleric', 'pyromancer', 'druid', 'berserker', 'frost', 'bard'];
// Trinkets a player would reach for, cheapest first, by what the hero does.
export const TRINKET_PREF = {
  tank: ['ironSkin', 'brambleVest', 'lastBreath', 'blinkStone', 'timeSand'],
  support: ['ironSkin', 'lastBreath', 'blinkStone', 'timeSand'],
  ranged: ['vampTooth', 'lastBreath', 'splitShard', 'thunderRing', 'timeSand'],
  dps: ['vampTooth', 'lastBreath', 'thunderRing', 'blinkStone', 'timeSand'],
};
