// Checks the progression contract (docs/BUILD-v4.md): save v3 + migration, skill points and the web, XP and levels,
// slot unlocks, dungeon gating, checkpoints, the 20% leaving loss. node tools/test/progress-check.mjs
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const S = await import('../../js/save.js');
const P = await import('../../js/progress.js');
let bad = 0;
const ok = (c, msg) => { if (!c) { bad++; console.log('FAIL', msg); } };

// fresh save
const s = S.freshSave();
ok(s.v === 3 && s.slots === 1 && P.slotCount(s) === 1, 'fresh: one slot');
ok(s.heroes.paladin.level === 1 && s.heroes.paladin.points === S.START_POINTS, 'fresh: level 1 with the starting point');
ok(P.dungeonOpen(s, 'warren') && !P.dungeonOpen(s, 'sewers'), 'only the first dungeon is open');
ok(P.dungeonState(s, 'sewers').lockedBy === 'warren', 'sewers locked by the warren');

// the web
const t = P.tree('paladin');
ok(P.nodeState(s, 'paladin', P.nodeOf('paladin', 'shieldBash2')).canBuy === false, 'tier II not buyable first');
ok(P.buyNode(s, 'paladin', 'shieldBash1') && s.heroes.paladin.points === 0, 'buy tier I with the starting point');
ok(!P.buyNode(s, 'paladin', 'shieldBashCd'), 'no points left');
s.heroes.paladin.points = 3;
ok(P.buyNode(s, 'paladin', 'shieldBashCd'), 'linked stat node');
ok(!P.buyNode(s, 'paladin', 'shieldBash2'), 'tier II needs level 4');
s.heroes.paladin.level = 4;
ok(P.buyNode(s, 'paladin', 'shieldBash2'), 'tier II at level 4');
ok(!P.buyNode(s, 'paladin', 'juggernaut'), 'keystone not linked yet');
const st = P.heroStats(s, 'paladin');
ok(st.ab.shieldBash && st.ab.shieldBash.abCd > 0, 'statsFor sums ability nodes');
ok(P.respec(Object.assign(s, { gold: 1000 }), 'paladin') && s.heroes.paladin.points === 4 && !Object.keys(s.heroes.paladin.nodes).length, 'respec gives the points back');

// XP
const h = { level: 1, xp: 0 };
const g = P.addXp(h, P.xpToNext(1) + P.xpToNext(2) + 5);
ok(g === 2 && h.level === 3 && h.xp === 5, 'addXp levels up twice');

// a run's summary: floor 1's mini-boss beaten in the first dungeon, fell on floor 2
const run = { theme: 'warren', party: ['paladin'], hired: [], summary: { gold: 100, floor: 2, rooms: 9, floorDone: false, minis: [true, false], bossKilled: false,
  heroes: { paladin: { level: 6, xp: 10, gained: 2 } }, downed: ['paladin'], hp: { paladin: 0 } } };
s.heroes.paladin.level = 4; s.heroes.paladin.points = 0; s.gold = 0;
const rep = P.applySummary(s, run, 'lost', 0);
ok(rep.lost === 20 && s.gold === 80, 'falling mid-floor loses 20% of the gold');
ok(s.heroes.paladin.level === 6 && s.heroes.paladin.points === 2, 'levels kept, a point each');
ok(s.unlocks.slotMini1 && P.slotCount(s) === 2 && rep.slots.unlocked.includes('slotMini1'), 'first mini-boss of the first dungeon: a slot');
ok(P.dungeonState(s, 'warren').checkpoint === 2, 'checkpoint at floor 2');
ok(P.runOptions(s, 'warren', {}, 3).floor === 2, 'cannot start past the checkpoint');
// leaving after a floor's end is free
const run2 = { theme: 'warren', party: ['paladin'], hired: [], summary: { gold: 50, floor: 3, floorDone: true, minis: [false, true], bossKilled: true, heroes: {} } };
const rep2 = P.applySummary(s, run2, 'won', 0);
ok(rep2.lost === 0 && rep2.opened.includes('sewers') && s.unlocks.slotBoss1, 'boss: no loss, sewers opens, a slot');
ok(P.leaveCost({ coins: 100, floorDone: false }).gold === 20 && P.leaveCost({ coins: 100, floorDone: true }).gold === 0, 'leaveCost');

// v2 -> v3
const v2 = { v: 2, gold: 100, gems: 3, slots: 3, heroes: { paladin: { owned: true, nodes: { shieldBash1: 1, might: 2 }, best: 9, trinkets: ['ironSkin'] }, tower: { owned: true, nodes: {}, best: 1 } },
  trinkets: ['frostRing'], dungeons: { warren: { best: 3, cleared: 1 } }, potions: 2 };
const m = S.fromV2(v2);
ok(m.v === 3 && m.gold === 100 + 3 * S.GEM_GOLD + 60 + 240, 'v2 gold + gems + refunded nodes: ' + m.gold);
ok(m.heroes.paladin.level === 4 && m.heroes.paladin.points === S.START_POINTS + 3 && !Object.keys(m.heroes.paladin.nodes).length, 'v2 hero level from best');
ok(m.heroes.tower.owned && m.slots === 3 && m.unlocks.slotBoss1 && !m.unlocks.slotBoss2, 'v2 seats kept as unlocks');
ok(m.dungeons.warren.checkpoint === 3 && P.dungeonOpen(m, 'sewers'), 'v2 dungeons');
ok(S.normalise(JSON.parse(JSON.stringify(m))).gold === m.gold, 'normalise round trip');

console.log(bad ? `${bad} failed` : 'all good');
process.exit(bad ? 1 : 0);
