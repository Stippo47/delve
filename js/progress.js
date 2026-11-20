// The progression rules: prices, recovery, the skill tree's buying rules, and turning a finished run into what
// the save keeps. Pure data and functions (no DOM), so camp.js shows them and tools can test them.
//
// Gold is kept forever, even on a loss. XP and levels only live inside a run; what lasts is gold spent on the tree,
// gems spent on heroes, bought trinkets and potions, party seats, feats (a hero reached level 8 once) and records.
import { HEROES, treeFor, freeNodes, FEAT_LEVEL } from './heroes.js';
import { TRINKETS } from './units.js';
import { TRINKET_LEVEL_MAX, trinketHooks } from './trinkets.js';
import { POTIONS, POTION_MAX as BAG_MAX, CARRY_MAX, elixirKey } from './potions.js';

// ---------------------------------------------------------------- paying
// The unlimited-currency cheat (a settings toggle, save.cheat): everything is affordable and nothing is taken.
// The real gold and gems stay as they were, so switching it off puts you back where you were.
export const afford = (save, currency, n) => !!save.cheat || save[currency] >= n;
export function pay(save, currency, n) {
  if (!afford(save, currency, n)) return false;
  if (!save.cheat) save[currency] -= n;
  return true;
}

// ---------------------------------------------------------------- party seats
// Party size starts at 1; each seat after costs a lot more. Either gold or gems buys it.
export const SLOT_MAX = 4;
const SLOT_GOLD = [250, 900, 3000]; // buying seat 2, 3, 4
const SLOT_GEMS = [2, 5, 12];
export function slotPrice(save) {
  const i = save.slots - 1;
  return i < SLOT_GOLD.length ? { gold: SLOT_GOLD[i], gems: SLOT_GEMS[i] } : null;
}
export function buySlot(save, currency) {
  const p = slotPrice(save); if (!p) return false;
  if (!pay(save, currency, p[currency])) return false;
  save.slots++;
  return true;
}

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
export const heroPrice = (id) => (HEROES[id].unlock && HEROES[id].unlock.gems) || 0;
export function unlockHero(save, id) {
  const h = save.heroes[id], p = heroPrice(id);
  if (h.owned || !pay(save, 'gems', p)) return false;
  h.owned = true;
  return true;
}

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

// ---------------------------------------------------------------- the skill tree
// Tier nodes need the tier before; tier III and the second trinket slot need the feat. A tier's level is when it
// switches on inside a run, not a lock on buying it. Stat nodes can be bought up to their max, each rank dearer.
const treeCache = {};
export const tree = (id) => treeCache[id] || (treeCache[id] = treeFor(id));
// Free nodes (every hero's first ability, tier I) are owned from the start and never charged for.
const freeCache = {};
const freeOf = (id) => freeCache[id] || (freeCache[id] = freeNodes(id));
export const rank = (save, heroId, nodeId) => save.heroes[heroId].nodes[nodeId] || freeOf(heroId)[nodeId] || 0;
export function nodeState(save, heroId, node) {
  const r = rank(save, heroId, node.id), h = save.heroes[heroId];
  const needs = [];
  if (node.req.node) needs.push({ what: 'node', id: node.req.node, ok: rank(save, heroId, node.req.node) > 0,
    text: `Needs ${tree(heroId).find((n) => n.id === node.req.node).name}` });
  if (node.req.feat) needs.push({ what: 'feat', ok: h.feat, text: `Needs the feat: reach level ${FEAT_LEVEL} in a dungeon` });
  if (!h.owned) needs.push({ what: 'owned', ok: false, text: 'Unlock the hero first' });
  const maxed = r >= node.max, cost = maxed ? 0 : node.cost[Math.min(r, node.cost.length - 1)];
  const met = needs.every((n) => n.ok);
  return { rank: r, maxed, cost, needs, met, canBuy: met && !maxed && afford(save, 'gold', cost) };
}
export function buyNode(save, heroId, nodeId) {
  const node = tree(heroId).find((n) => n.id === nodeId); if (!node) return false;
  const st = nodeState(save, heroId, node); if (!st.canBuy) return false;
  pay(save, 'gold', st.cost); save.heroes[heroId].nodes[nodeId] = st.rank + 1;
  return true;
}
// How many tiers of each ability the hero owns (0-3), for the hero page's pips.
export const abilityTiers = (save, heroId, abilityId) => [1, 2, 3].filter((t) => rank(save, heroId, `${abilityId}${t}`) > 0).length;

// ---------------------------------------------------------------- starting a run
// What newRun gets: the party (heroes who can go, up to the seats), the theme, mercs, and the potions handed out.
// potionFor: { [heroId]: [potionId, ...] } from the camp (an old `true` means one healing draught).
// opts.potions: { [heroId]: healing draughts } (newRun's contract); opts.elixirs: { [heroId]: [elixirId, ...] } and
// opts.tlv: { [trinketId]: level } go onto run.heroes[id].trinkets through applyLoadout (main.js calls it).
export function runOptions(save, theme, potionFor = {}) {
  const now = Date.now();
  const party = save.party.filter((id) => canGo(save, id, now)).slice(0, save.slots);
  const potions = {}, elixirs = {};
  const left = { heal: save.potions, ...save.elixirs };
  for (const id of party) {
    const want = potionFor[id] === true ? ['heal'] : (potionFor[id] || []);
    for (const p of want.slice(0, CARRY_MAX)) {
      if (!(left[p] > 0)) continue; left[p]--;
      if (p === 'heal') potions[id] = (potions[id] || 0) + 1; else (elixirs[id] || (elixirs[id] = [])).push(p);
    }
  }
  return { theme, party, mercs: !!save.mercs, potions, elixirs, tlv: { ...save.tlv } };
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
// run.summary = { gold, gems, kills, floor, rooms, levels: { [id]: level }, downed: [ids], foundTrinkets, hp?: { [id]: ratio } }
// Returns what happened, for the result screen.
export function applySummary(save, run, result, now = Date.now()) {
  const s = run.summary || {};
  const mercs = !!(run.hired ? run.hired.length : Array.isArray(run.mercs) ? run.mercs.length : run.mercs);
  const raw = Math.max(0, Math.floor(s.gold || 0));
  const gold = mercs ? Math.floor(raw * (1 - MERC_CUT)) : raw;
  const theme = run.theme || 'unknown';
  const d = save.dungeons[theme] || (save.dungeons[theme] = { best: 0, cleared: 0 });
  const firstClear = result === 'won' && !d.cleared;
  const gems = Math.max(0, Math.floor(s.gems || 0)) + (firstClear ? FIRST_CLEAR_GEMS : 0);
  save.gold += gold; save.gems += gems;
  if (result === 'won') { save.wins++; d.cleared++; }
  d.best = Math.max(d.best, s.floor || 0);
  const heroes = [];
  for (const id of run.party || []) {
    const h = save.heroes[id]; if (!h) continue;
    const level = (s.levels && s.levels[id]) || 1;
    const record = level > h.best; h.best = Math.max(h.best, level);
    const feat = level >= FEAT_LEVEL && !h.feat; if (feat) h.feat = true;
    const downed = (s.downed || []).includes(id);
    const hurt = !downed && s.hp && s.hp[id] != null && s.hp[id] < HURT_BELOW;
    if (downed || hurt) h.recoverUntil = Math.max(h.recoverUntil || 0, now + (downed ? RECOVER_DOWN : RECOVER_HURT));
    heroes.push({ id, level, record, feat, downed, hurt });
  }
  return { result, raw, gold, mercCut: raw - gold, gems, firstClear, firstClearGems: firstClear ? FIRST_CLEAR_GEMS : 0,
    kills: s.kills || 0, floor: s.floor || 0, rooms: s.rooms || 0, heroes, found: (s.foundTrinkets || []).map((t) => (t && t.id) || t), theme };
}
// Gems: bosses drop them in the run (dungeon.js); clearing a dungeon the first time gives these on top.
export const FIRST_CLEAR_GEMS = 2;
