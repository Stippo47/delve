// The trader's stock (round 9): a few things for sale, reshuffled after every mission. Kept in the save as
//   save.trader = { runs, items: [{ k: 't' | 'p', id, left }] }
// runs: the save.runs count the stock was drawn for (a run starting bumps save.runs, so the next visit after any
// mission finds new stock). left: how many are still for sale (a trinket 1, a potion 2). Pure functions, no DOM.
import * as P from './progress.js';

export const STOCK_TRINKETS = 3, STOCK_POTIONS = 2, POTION_LOT = 2;

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pickSome(list, n, r, weight = () => 1) {
  const pool = list.slice(), out = [];
  while (out.length < n && pool.length) {
    const tot = pool.reduce((a, x) => a + weight(x), 0);
    let q = r() * tot, i = 0;
    for (; i < pool.length - 1; i++) { q -= weight(pool[i]); if (q <= 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

// Rarer things turn up less often; ones you don't own yet a little more.
const RAR_W = { common: 3, rare: 2, epic: 1, legendary: 0.6 };
export function rollStock(save) {
  const r = rng(((save.runs || 0) + 1) * 7919 + 101);
  const ts = pickSome(P.shopTrinkets(), STOCK_TRINKETS, r, (t) => (RAR_W[t.rarity] || 1) * (P.ownsTrinket(save, t.id) ? 0.6 : 1));
  const ps = pickSome(Object.keys(P.POTIONS), STOCK_POTIONS, r, (id) => (id === 'heal' ? 2 : 1));
  return { runs: save.runs || 0, items: [...ts.map((t) => ({ k: 't', id: t.id, left: 1 })), ...ps.map((id) => ({ k: 'p', id, left: POTION_LOT }))] };
}

// The stock for now: the saved one if it's for this mission count and still makes sense, else a new roll.
export function stock(save) {
  const s = save.trader, sold = new Set(P.shopTrinkets().map((t) => t.id));
  const ok = s && s.runs === (save.runs || 0) && Array.isArray(s.items) &&
    s.items.every((x) => x && (x.k === 't' ? sold.has(x.id) : x.k === 'p' ? !!P.POTIONS[x.id] : false));
  if (!ok) save.trader = rollStock(save);
  return save.trader;
}
export const fresh = (save) => !save.trader || save.trader.runs !== (save.runs || 0);
export const itemOf = (save, k, id) => stock(save).items.find((x) => x.k === k && x.id === id) || null;

// Buy one of a stocked thing. Returns false if it's sold out, not stocked, or can't be paid for.
export function buy(save, k, id) {
  const it = itemOf(save, k, id); if (!it || it.left <= 0) return false;
  const ok = k === 't' ? P.buyTrinket(save, id) : P.buyPotion(save, id);
  if (ok) it.left--;
  return ok;
}
