// The progression rules: prices, recovery, the skill web's buying rules, levels and XP, party slots, dungeon order and
// checkpoints, and turning a finished run into what the save keeps. Pure data and functions (no DOM), so the camp
// shows them and tools can test them.
//
// Round 8 (docs/BUILD-v4.md, "Shared contract (progression)"):
// - Levels are permanent. A hero goes in at its level, keeps the XP it earns, and every level gained gives a skill
//   point. Skill points buy nodes in the web (heroes.js treeFor); gold doesn't.
// - Gold buys and upgrades equipment (trinkets), new heroes and potions. Gems are back (round 9: "Gems stay. Maybe to
//   unlock special skill tree abilities"): counted and kept (save.gems), nothing spends them yet.
// - Party slots are earned, not bought: the first dungeon's first mini-boss, the first dungeon's boss, the second
//   dungeon's boss (save.unlocks).
// - Dungeons open in order (themes.js DUNGEON_ORDER): beat one's boss to open the next.
// - Checkpoints: reaching floor N of a dungeon lets later runs start at floor N.
// - Leaving before the floor is finished (or falling) loses LEAVE_LOSS of the run's gold.
import { HEROES, treeFor, freeNodes, statsFor, tierOf } from './heroes.js';
import { TRINKETS, xpToNext } from './units.js';
import { TRINKET_LEVEL_MAX, trinketHooks } from './trinkets.js';
import { POTIONS, POTION_MAX as BAG_MAX, CARRY_MAX, elixirKey } from './potions.js';
import { DUNGEON_ORDER, THEMES } from './themes.js';
import { slotsOf, START_POINTS } from './save.js';
import { bankTally } from './stats.js';
export { xpToNext, DUNGEON_ORDER, START_POINTS };

// ---------------------------------------------------------------- paying
// Gold only: afford(save, n) / pay(save, n); the old (save, 'gold', n) form still works.
// The unlimited-currency cheat (a settings toggle, save.cheat): everything is affordable and nothing is taken.
const amount = (a, b) => (typeof a === 'number' ? a : b);
export const afford = (save, a, b) => !!save.cheat || save.gold >= amount(a, b);
export function pay(save, a, b) {
  const n = amount(a, b);
  if (!afford(save, n)) return false;
  if (!save.cheat) save.gold -= n;
  return true;
}

// ---------------------------------------------------------------- party slots
// Start with 1; each of these adds one (flags in save.unlocks, set by applySummary).
export const SLOT_MAX = 4;
export const SLOT_UNLOCKS = [
  { key: 'slotMini1', dungeon: 0, what: 'mini', floor: 1 },   // the first dungeon's first mini-boss
  { key: 'slotBoss1', dungeon: 0, what: 'boss' },             // the first dungeon's boss
  { key: 'slotBoss2', dungeon: 1, what: 'boss' },             // the second dungeon's boss
];
export const slotCount = (save) => slotsOf(save);
// For the camp's messaging: each slot, whether it's earned, and what earns it.
export const slotUnlocks = (save) => SLOT_UNLOCKS.map((u) => {
  const id = DUNGEON_ORDER[u.dungeon], t = THEMES[id];
  return { ...u, theme: id, have: !!(save.unlocks && save.unlocks[u.key]),
    text: u.what === 'mini' ? `Beat the first mini-boss of ${t ? t.name : id}` : `Beat the boss of ${t ? t.name : id}` };
});
// Slots are not for sale any more (kept so older views still run).
export const slotPrice = () => null;
export const buySlot = () => false;

// ---------------------------------------------------------------- potions to bring in
// Healing draughts are save.potions (as before); the other kinds are save.elixirs[id]. See potions.js.
export const POTION_PRICE = POTIONS.heal.price;
export const POTION_MAX = BAG_MAX;
export { POTIONS, CARRY_MAX };
export const potionCount = (save, id) => (id === 'heal' ? save.potions : (save.elixirs && save.elixirs[id]) || 0);
export function buyPotion(save, id = 'heal') {
  const p = POTIONS[id]; if (!p || potionCount(save, id) >= POTION_MAX) return false;
  if (!pay(save, 'gold', p.price)) return false;
  if (id === 'heal') save.potions++; else save.elixirs[id] = (save.elixirs[id] || 0) + 1;
  return true;
}

// ---------------------------------------------------------------- mercenaries
// Hired hands: two of the old starter kinds, middling, not kept. They take half the gold the run brings out.
export const MERCS = [
  { kind: 'knight', name: 'Sellsword', art: 'art/knight.svg' },
  { kind: 'rogue', name: 'Cutthroat', art: 'art/rogue.svg' },
];
export const MERC_CUT = 0.5;

// ---------------------------------------------------------------- trinkets in the shop
// Data-driven: every trinket in units.js TRINKETS shows up. A trinket may carry its own `rarity` and `price`;
// otherwise SHOP below gives them, and anything unknown is 'rare' at the rare price.
export const RARITY = {
  common: { name: 'Common', price: 90, color: '#8F97A3' },
  rare: { name: 'Rare', price: 180, color: '#3E8FC7' },
  epic: { name: 'Epic', price: 320, color: '#9B5BC9' },
  legendary: { name: 'Legendary', price: 520, color: '#D9822B' },
};
const SHOP = {
  ironSkin: { rarity: 'common' }, swiftBoots: { rarity: 'common' },
  frostRing: { rarity: 'rare' }, emberRing: { rarity: 'rare' }, venomFang: { rarity: 'rare' }, vampTooth: { rarity: 'rare' },
  volatile: { rarity: 'epic' }, lastBreath: { rarity: 'legendary' },
};
const GEM_COL = { lastBreath: '#FFE7A0', volatile: '#FF7A2F', frostRing: '#7FD6F5', emberRing: '#E8582A', venomFang: '#9BCB3C',
  vampTooth: '#C8553D', ironSkin: '#8F97A3', swiftBoots: '#A0683A' };
export function trinketInfo(id) {
  const t = TRINKETS[id] || { name: id, desc: '' };
  const rarity = t.rarity || (SHOP[id] && SHOP[id].rarity) || 'rare';
  const price = t.price || (SHOP[id] && SHOP[id].price) || RARITY[rarity].price;
  let color = t.color || GEM_COL[id];
  if (!color) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360; color = `hsl(${h} 62% 58%)`; }
  return { id, name: t.name, desc: t.desc, rarity, price, color };
}
export const shopTrinkets = () => Object.keys(TRINKETS).filter((id) => !TRINKETS[id].potion).map(trinketInfo)
  .sort((a, b) => Object.keys(RARITY).indexOf(a.rarity) - Object.keys(RARITY).indexOf(b.rarity) || a.price - b.price);
export function buyTrinket(save, id) {
  const t = trinketInfo(id);
  if (!pay(save, 'gold', t.price)) return false;
  save.trinkets.push(id);
  return true;
}
// Trinket levels: bought per kind of trinket (every copy you own goes up), once you own one. See trinkets.js.
export const TLV_MAX = TRINKET_LEVEL_MAX;
export const trinketLevel = (save, id) => Math.max(1, (save.tlv && save.tlv[id]) || 1);
export const ownsTrinket = (save, id) => save.trinkets.includes(id) || Object.values(save.heroes).some((h) => h.trinkets.includes(id));
export function upgradePrice(save, id) {
  const lv = trinketLevel(save, id); if (lv >= TLV_MAX) return null;
  return Math.round(trinketInfo(id).price * (lv === 1 ? 0.9 : 1.6) / 5) * 5;
}
export function upgradeTrinket(save, id) {
  const c = upgradePrice(save, id); if (c == null || !ownsTrinket(save, id)) return false;
  if (!pay(save, 'gold', c)) return false;
  save.tlv[id] = trinketLevel(save, id) + 1;
  return true;
}
export const trinketSlots = (save, id) => 1 + (save.heroes[id].nodes.slot2 ? 1 : 0);
export function equip(save, heroId, trinketId, slot) {
  const h = save.heroes[heroId], i = save.trinkets.indexOf(trinketId);
  if (i < 0 || slot >= trinketSlots(save, heroId)) return false;
  save.trinkets.splice(i, 1);
  if (h.trinkets[slot]) save.trinkets.push(h.trinkets[slot]);
  h.trinkets[slot] = trinketId;
  h.trinkets = h.trinkets.filter(Boolean);
  return true;
}
export function unequip(save, heroId, slot) {
  const h = save.heroes[heroId], t = h.trinkets[slot];
  if (!t) return false;
  h.trinkets.splice(slot, 1); save.trinkets.push(t);
  return true;
}

// ---------------------------------------------------------------- heroes
// Heroes are bought with gold (the old gem prices x HERO_GOLD).
export const HERO_GOLD = 350;
export const heroPrice = (id) => ((HEROES[id].unlock && HEROES[id].unlock.gems) || 0) * HERO_GOLD;
export const ownedCount = (save) => Object.values(save.heroes).filter((h) => h.owned).length;
export function unlockHero(save, id) {
  const h = save.heroes[id], p = heroPrice(id);
  if (h.owned || !pay(save, p)) return false;
  h.owned = true;
  return true;
}

// ---------------------------------------------------------------- levels and XP
// A hero's level is permanent. addXp works on anything with { level, xp } (a save hero or a run's hero state) and
// returns how many levels it gained; the caller gives the points (the run counts them, applySummary banks them).
export function addXp(h, xp) {
  let gained = 0;
  h.xp = (h.xp || 0) + Math.max(0, xp);
  while (h.xp >= xpToNext(h.level)) { h.xp -= xpToNext(h.level); h.level++; gained++; }
  return gained;
}
export const xpProgress = (h) => (h.xp || 0) / xpToNext(h.level || 1);

// Recovery: a hero downed in a run rests a while; one that came out badly hurt rests a little. Gold speeds it up.
// Round 6: 2-3 minutes, not 10.
export const RECOVER_DOWN = 3 * 60e3;
export const RECOVER_HURT = 90e3;
export const HURT_BELOW = 0.35;
export const recoverLeft = (save, id, now = Date.now()) => Math.max(0, (save.heroes[id].recoverUntil || 0) - now);
export const speedUpCost = (ms) => Math.max(5, Math.ceil(ms / 7500)); // 8 gold a minute
export function speedUp(save, id, now = Date.now()) {
  const left = recoverLeft(save, id, now); if (!left) return false;
  if (!pay(save, 'gold', speedUpCost(left))) return false;
  save.heroes[id].recoverUntil = 0;
  return true;
}
export const canGo = (save, id, now) => save.heroes[id].owned && !recoverLeft(save, id, now);

// ---------------------------------------------------------------- the skill web
// A node can be bought with skill points when: one linked node is owned (the root always is), its needs are owned (a
// tier needs the tier before), the hero's level is at least node.level, it isn't maxed, and the hero has node.cost
// points. Ranks: save.heroes[id].nodes[nodeId].
const treeCache = {};
export const tree = (id) => treeCache[id] || (treeCache[id] = treeFor(id));
export const nodeOf = (id, nodeId) => tree(id).find((n) => n.id === nodeId);
const freeCache = {};
const freeOf = (id) => freeCache[id] || (freeCache[id] = freeNodes(id));
export const rank = (save, heroId, nodeId) => save.heroes[heroId].nodes[nodeId] || freeOf(heroId)[nodeId] || 0;
export const points = (save, heroId) => save.heroes[heroId].points || 0;
export function nodeState(save, heroId, node) {
  const r = rank(save, heroId, node.id), h = save.heroes[heroId];
  const needs = [];
  const linked = node.kind === 'root' || node.links.some((l) => rank(save, heroId, l) > 0);
  needs.push({ what: 'link', ok: linked, text: 'Buy a node next to it first' });
  for (const n of node.needs) needs.push({ what: 'node', id: n, ok: rank(save, heroId, n) > 0, text: `Needs ${nodeOf(heroId, n).name}` });
  if (node.level) needs.push({ what: 'level', ok: h.level >= node.level, text: `Needs level ${node.level}` });
  if (!h.owned) needs.push({ what: 'owned', ok: false, text: 'Unlock the hero first' });
  const maxed = r >= node.max, cost = maxed ? 0 : node.cost;
  const met = needs.every((n) => n.ok);
  return { rank: r, maxed, cost, needs, met, reachable: linked, canBuy: met && !maxed && (h.points || 0) >= cost };
}
export function buyNode(save, heroId, nodeId) {
  const node = nodeOf(heroId, nodeId); if (!node) return false;
  const st = nodeState(save, heroId, node); if (!st.canBuy) return false;
  const h = save.heroes[heroId];
  h.points -= st.cost; h.nodes[nodeId] = st.rank + 1;
  return true;
}
// Points spent so far.
export const spentPoints = (save, heroId) => tree(heroId).reduce((a, n) => a + (save.heroes[heroId].nodes[n.id] || 0) * n.cost, 0);
// Take every node back for gold (RESPEC_GOLD a point): all the points come back.
export const RESPEC_GOLD = 15;
export const respecPrice = (save, heroId) => spentPoints(save, heroId) * RESPEC_GOLD;
export function respec(save, heroId) {
  const n = spentPoints(save, heroId); if (!n || !pay(save, n * RESPEC_GOLD)) return false;
  const h = save.heroes[heroId]; h.points += n; h.nodes = {};
  return true;
}
// What the hero's bought nodes add up to (heroes.js statsFor), for the camp to show.
export const heroStats = (save, heroId) => statsFor(heroId, save.heroes[heroId].nodes);
// How many tiers of each ability the hero owns (0-3), for the hero page's pips.
export const abilityTiers = (save, heroId, abilityId) => tierOf(save.heroes[heroId].nodes, abilityId);
// Spend a hero's points by itself: abilities first, then their tiers, the second trinket slot, keystones, then the
// nearest stat node (prefer(node) -> a number breaks ties). Tools use it for test saves; the camp may offer it.
const AUTO_ORDER = (n) => (n.kind === 'ability' ? 0 : n.kind === 'tier' ? 1 : n.kind === 'slot' ? 2 : n.kind === 'keystone' ? 3 : 4);
export function autoSpend(save, heroId, prefer = null) {
  let bought = 0;
  for (let guard = 0; guard < 400; guard++) {
    const can = tree(heroId).filter((n) => nodeState(save, heroId, n).canBuy);
    if (!can.length) break;
    can.sort((a, b) => AUTO_ORDER(a) - AUTO_ORDER(b) || (prefer ? (prefer(b) || 0) - (prefer(a) || 0) : 0) || Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
    buyNode(save, heroId, can[0].id); bought++;
  }
  return bought;
}

// ---------------------------------------------------------------- dungeons, checkpoints
// The first dungeon is always open; each next one opens when the one before it has had its boss beaten.
const dg = (save, id) => (save.dungeons && save.dungeons[id]) || { best: 0, cleared: 0, checkpoint: 1, minis: [false, false] };
// Round 9: the Wildwood came in front of the Warren. A dungeon a save has already been into stays open (so a save from
// before the Wildwood keeps every dungeon it had), and beating a dungeon's boss opens the next as before.
export function dungeonOpen(save, id) {
  const i = DUNGEON_ORDER.indexOf(id);
  if (i <= 0) return i === 0;
  const own = dg(save, id);
  return dg(save, DUNGEON_ORDER[i - 1]).cleared > 0 || own.best > 0 || own.cleared > 0;
}
// { open, lockedBy (the dungeon to beat first), cleared, best, checkpoint, floors: [1..checkpoint], minis }
export function dungeonState(save, id) {
  const d = dg(save, id), i = DUNGEON_ORDER.indexOf(id), open = dungeonOpen(save, id);
  const checkpoint = Math.max(1, Math.min(3, d.checkpoint || 1));
  return { open, lockedBy: open ? null : DUNGEON_ORDER[i - 1] || null, cleared: d.cleared || 0, best: d.best || 0, checkpoint,
    floors: Array.from({ length: checkpoint }, (_, k) => k + 1), minis: (d.minis || [false, false]).slice() };
}
export const openDungeons = (save) => DUNGEON_ORDER.filter((id) => dungeonOpen(save, id));

// ---------------------------------------------------------------- leaving
// Leaving before the floor is finished loses LEAVE_LOSS of the run's gold (falling too: a wipe is leaving early).
// run.floorDone is true once the floor's last room is won (dungeon.js); then leaving is free.
export const LEAVE_LOSS = 0.2;
export function leaveCost(run) {
  const done = !!(run.floorDone || (run.summary && run.summary.floorDone) || run.phase === 'won');
  const gold = Math.max(0, Math.floor(run.coins || 0));
  return { lose: done ? 0 : LEAVE_LOSS, gold: done ? 0 : Math.ceil(gold * LEAVE_LOSS) };
}

// ---------------------------------------------------------------- starting a run
// What newRun gets: the party (heroes who can go, up to the slots), the theme, the floor to start at (a checkpoint),
// mercs, and the potions handed out.
// potionFor: { [heroId]: [potionId, ...] } from the camp (an old `true` means one healing draught).
// opts.potions: { [heroId]: healing draughts } (newRun's contract); opts.elixirs: { [heroId]: [elixirId, ...] } and
// opts.tlv: { [trinketId]: level } go onto run.heroes[id].trinkets through applyLoadout (main.js calls it).
export function runOptions(save, theme, potionFor = {}, floor = 1) {
  const now = Date.now();
  const party = save.party.filter((id) => canGo(save, id, now)).slice(0, slotCount(save));
  const potions = {}, elixirs = {};
  const left = { heal: save.potions, ...save.elixirs };
  for (const id of party) {
    const want = potionFor[id] === true ? ['heal'] : (potionFor[id] || []);
    for (const p of want.slice(0, CARRY_MAX)) {
      if (!(left[p] > 0)) continue; left[p]--;
      if (p === 'heal') potions[id] = (potions[id] || 0) + 1; else (elixirs[id] || (elixirs[id] = [])).push(p);
    }
  }
  // floor: where to start (a checkpoint reached before; never past it)
  const fl = Math.max(1, Math.min(dungeonState(save, theme).checkpoint, Math.floor(+floor || 1)));
  return { theme, floor: fl, party, mercs: !!save.mercs, potions, elixirs, tlv: { ...save.tlv } };
}
// The potions handed out are used up going in (drunk or not, they're the run's now).
export function payForRun(save, opts) {
  save.potions -= Object.values(opts.potions).reduce((a, b) => a + b, 0);
  for (const list of Object.values(opts.elixirs || {})) for (const p of list) save.elixirs[p] = Math.max(0, (save.elixirs[p] || 0) - 1);
  save.runs++;
}
// After newRun: put each hero's elixirs and trinket levels on their run trinket list (what dungeon.js spawns with).
export function applyLoadout(run, opts) {
  for (const id of run.party || []) {
    const hs = run.heroes[id]; if (!hs) continue;
    const list = hs.trinkets || (hs.trinkets = []); // changed in place: spawned units share this array
    list.forEach((t, i) => {
      const tid = t && t.id ? t.id : t, lv = (opts.tlv || {})[tid] || 1;
      if (lv > 1) list[i] = { ...(t && t.id ? t : { id: tid }), lv };
    });
    for (const p of (opts.elixirs || {})[id] || []) list.push(elixirKey(p));
    // newRun already spawned the first room: give those heroes their new hooks
    for (const u of (run.world && run.world.units) || []) if (u.kind === id && u.team === 'hero' && !u.summon) { u.trinkets = list; u.trinketHooks = trinketHooks(list); }
  }
}

// ---------------------------------------------------------------- ending a run
// run.summary (dungeon.js summarize) = { gold, kills, floor, rooms, floorDone, minis: [bool, bool], bossKilled,
//   heroes: { [id]: { level, xp, gained } }, levels: { [id]: level }, downed: [ids], foundTrinkets, hp: { [id]: ratio }, result }
// Banks it into the save: gold (less the leaving loss and the mercs' cut), levels, XP and points, the dungeon's best
// floor, checkpoint, mini-bosses and boss, slot unlocks, the next dungeon opening, recovery timers.
// Returns what happened, for the result screen: { result, raw, lost (the leaving loss), gold (banked), mercCut, kills,
//   floor, rooms, heroes: [{ id, from, level, gained, points, record, downed, hurt }], found, theme, floorDone,
//   checkpoint (a new one, or null), minis, bossKilled, slots: { before, after, unlocked: [keys] }, opened: [dungeon ids] }
export function applySummary(save, run, result, now = Date.now()) {
  const s = run.summary || {};
  const mercs = !!(run.hired ? run.hired.length : Array.isArray(run.mercs) ? run.mercs.length : run.mercs);
  const raw = Math.max(0, Math.floor(s.gold || 0));
  const early = result !== 'won' && !s.floorDone;
  const lost = early ? Math.ceil(raw * LEAVE_LOSS) : 0;
  const kept = raw - lost;
  const gold = mercs ? Math.floor(kept * (1 - MERC_CUT)) : kept;
  const theme = run.theme || 'unknown';
  const wasOpen = DUNGEON_ORDER.map((id) => dungeonOpen(save, id));
  const d = save.dungeons[theme] || (save.dungeons[theme] = { best: 0, cleared: 0, checkpoint: 1, minis: [false, false] });
  d.minis = d.minis || [false, false];
  const won = result === 'won' || !!s.bossKilled;
  const firstClear = won && !d.cleared;
  save.gold += gold;
  const gems = Math.max(0, Math.floor(s.gems || 0)); // gems aren't lost by leaving early: they're few and hard won
  save.gems = (save.gems || 0) + gems;
  if (result === 'won') save.wins++;
  if (won) d.cleared++;
  d.best = Math.max(d.best || 0, s.floor || 0);
  const oldCp = d.checkpoint || 1;
  d.checkpoint = Math.max(oldCp, Math.min(3, s.floor || 1));
  (s.minis || []).forEach((m, i) => { if (m && i < 2) d.minis[i] = true; });
  // slots
  const slotsBefore = slotsOf(save), newSlots = [];
  save.unlocks = save.unlocks || {};
  for (const u of SLOT_UNLOCKS) {
    if (save.unlocks[u.key] || DUNGEON_ORDER[u.dungeon] !== theme) continue;
    if (u.what === 'mini' ? d.minis[u.floor - 1] : d.cleared > 0) { save.unlocks[u.key] = true; newSlots.push(u.key); }
  }
  save.slots = slotsOf(save);
  const opened = DUNGEON_ORDER.filter((id, i) => !wasOpen[i] && dungeonOpen(save, id));
  // heroes: levels, XP, points; recovery
  const heroes = [];
  for (const id of run.party || []) {
    const h = save.heroes[id]; if (!h) continue;
    const rh = (s.heroes && s.heroes[id]) || null;
    const from = h.level;
    if (rh && rh.level >= from) { h.level = rh.level; h.xp = rh.xp; }
    const gained = h.level - from;
    h.points = (h.points || 0) + gained;
    const record = h.level > (h.best || 1); h.best = Math.max(h.best || 1, h.level);
    const downed = (s.downed || []).includes(id);
    const hurt = !downed && s.hp && s.hp[id] != null && s.hp[id] < HURT_BELOW;
    if (downed || hurt) h.recoverUntil = Math.max(h.recoverUntil || 0, now + (downed ? RECOVER_DOWN : RECOVER_HURT));
    heroes.push({ id, from, level: h.level, gained, points: h.points, record, downed, hurt });
  }
  bankTally(save, s.stats); // lifetime: enemies defeated, each hero's damage, healing, kills (stats.js)
  return { result, raw, lost, gold, mercCut: kept - gold, gems, firstClear, firstClearGems: 0, stats: s.stats || null,
    kills: s.kills || 0, floor: s.floor || 0, rooms: s.rooms || 0, heroes, found: (s.foundTrinkets || []).map((t) => (t && t.id) || t), theme,
    floorDone: !!s.floorDone, checkpoint: d.checkpoint > oldCp ? d.checkpoint : null, minis: (s.minis || []).slice(), bossKilled: !!s.bossKilled,
    slots: { before: slotsBefore, after: save.slots, unlocked: newSlots }, opened };
}
// No first-clear gem bonus (the floor's last foe drops them instead: dungeon.js onKill).
export const FIRST_CLEAR_GEMS = 0;

