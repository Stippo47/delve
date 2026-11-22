// Camp progress lives in localStorage. Home Screen web apps keep it; wrapped in try/catch because
// storage can throw (private mode, quota).
//
// Version 3 (round 8, docs/BUILD-v4.md "Shared contract (progression)"):
// { v: 3, gold, potions,
//   heroes: { [id]: { owned, level, xp, points, nodes: { [nodeId]: rank }, trinkets: [id...], recoverUntil, best } },
//     level: permanent (a hero goes into a dungeon at its level and keeps what it earns there); xp: towards the next
//     level; points: skill points not yet spent (one per level gained, plus one to start); best: highest level reached
//   unlocks: { slotMini1, slotBoss1, slotBoss2 } (party slots earned: the first dungeon's first mini-boss, the first
//     dungeon's boss, the second dungeon's boss; slots = 1 + those, never bought),
//   slots (kept in step with unlocks, for older readers),
//   dungeons: { [themeId]: { best (deepest floor reached), cleared (boss kills), checkpoint (highest floor a run can
//     start at, 1-3), minis: [floor 1's mini-boss beaten, floor 2's] } },
//   trinkets: [id...] (owned, not equipped), tlv: { [trinketId]: level }, elixirs: { [potionId]: n },
//   runs, wins, speed, zoom, party: [heroId...], mercs, theme, seen: { [enemyKind]: { met, beaten } }, campLayout,
//   treeLayout, cheat, tally: { foes, heroes } (lifetime run stats, js/stats.js) }
// Gems (round 9: back): save.gems, kept through every migration (a v2 save keeps its gems as gems). A v2 save's levels lived inside runs, so its heroes
// start at a level from their best run, with the points for it, and the gold spent on the old tree comes back.
// A v1 save starts fresh but keeps its coins as gold.
import { HEROES } from './heroes.js';
import { xpToNext, xpToNextR12 } from './units.js';
import { cleanTally } from './stats.js';

const KEY = 'delve-save-v3';
const V2_KEY = 'delve-save-v2';
const OLD_KEY = 'dungeon-save-v1';
export const GEM_GOLD = 150;
export const START_POINTS = 1; // a new hero can buy its first ability straight away

export function freshHero(id) {
  return { owned: !!HEROES[id].starter, level: 1, xp: 0, points: START_POINTS, nodes: {}, trinkets: [], recoverUntil: 0, best: 1 };
}

export function freshSave() {
  const heroes = {};
  for (const id of Object.keys(HEROES)) heroes[id] = freshHero(id);
  return { v: 3, gold: 0, gems: 0, slots: 1, unlocks: { slotMini1: false, slotBoss1: false, slotBoss2: false }, potions: 0, heroes,
    trinkets: [], dungeons: {}, runs: 0, wins: 0, speed: 1, zoom: null, party: [Object.keys(HEROES).find((k) => HEROES[k].starter)],
    mercs: false, theme: null, elixirs: {}, tlv: {}, seen: {}, campLayout: 'clearing', treeLayout: 'grove', cheat: false };
}

export const slotsOf = (s) => 1 + ['slotMini1', 'slotBoss1', 'slotBoss2'].filter((k) => s.unlocks && s.unlocks[k]).length;
const int = (v, min = 0) => Math.max(min, Math.floor(+v || 0));

// Fill anything a save is missing (new heroes added since, new fields) without touching what it has.
export function normalise(s) {
  const f = freshSave();
  const out = { ...f, ...s, v: 3, xpv: 2 };
  out.heroes = {};
  for (const id of Object.keys(HEROES)) {
    const h = (s.heroes && s.heroes[id]) || {};
    const nodes = {};
    for (const [k, v] of Object.entries(h.nodes || {})) if (int(v) > 0) nodes[k] = int(v);
    out.heroes[id] = { ...freshHero(id), ...h, nodes, trinkets: Array.isArray(h.trinkets) ? h.trinkets.slice() : [],
      level: int(h.level ?? 1, 1), xp: int(h.xp), points: int(h.points ?? START_POINTS) };
    // round 14's level curve: XP held towards the next level keeps its share of the way there
    if (!(s.xpv >= 2)) { const o = out.heroes[id]; o.xp = Math.floor(Math.min(0.99, o.xp / xpToNextR12(o.level)) * xpToNext(o.level)); }
    out.heroes[id].best = Math.max(out.heroes[id].level, int(h.best, 1));
    delete out.heroes[id].feat;
    if (HEROES[id].starter) out.heroes[id].owned = true;
  }
  out.trinkets = Array.isArray(s.trinkets) ? s.trinkets.filter((t) => typeof t === 'string') : [];
  out.dungeons = {};
  for (const [k, d] of Object.entries(s.dungeons && typeof s.dungeons === 'object' ? s.dungeons : {})) {
    const minis = Array.isArray(d && d.minis) ? d.minis.slice(0, 2).map(Boolean) : [];
    while (minis.length < 2) minis.push(false);
    out.dungeons[k] = { best: int(d && d.best), cleared: int(d && d.cleared), checkpoint: Math.min(3, int(d && d.checkpoint, 1)), minis };
  }
  const counts = (o) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}).map(([k, v]) => [k, int(v)]));
  out.elixirs = counts(s.elixirs); out.tlv = counts(s.tlv);
  out.seen = {};
  for (const [k, v] of Object.entries(s.seen && typeof s.seen === 'object' ? s.seen : {})) out.seen[k] = { met: +(v && v.met) || 0, beaten: +(v && v.beaten) || 0 };
  out.tally = cleanTally(s.tally); // lifetime run stats (stats.js bankTally)
  out.cheat = !!s.cheat;
  out.unlocks = { ...f.unlocks, ...(s.unlocks || {}) };
  for (const k of Object.keys(out.unlocks)) out.unlocks[k] = !!out.unlocks[k];
  out.slots = slotsOf(out);
  out.gems = int(s.gems); delete out.look; delete out.treeLook;
  if (out.campLayout !== 'fireside') out.campLayout = 'clearing';
  if (out.treeLayout !== 'wheel') out.treeLayout = 'grove';
  const cap = Date.now() + 3 * 60e3;
  for (const h of Object.values(out.heroes)) if (h.recoverUntil > cap) h.recoverUntil = cap;
  out.party = (Array.isArray(s.party) ? s.party : f.party).filter((id) => out.heroes[id] && out.heroes[id].owned).slice(0, out.slots);
  for (const k of ['gold', 'gems', 'potions', 'runs', 'wins']) out[k] = int(out[k]);

  return out;
}

// v2 -> v3. Old tree nodes were bought with gold: the gold comes back (V2_NODE_GOLD, roughly what they cost) and the
// nodes are cleared, since the web's nodes are new. Levels: half the best level a hero reached in a run (at least 1),
// with the points that level brings. Seats bought with gold or gems stay as unlocks (so nobody loses party members).
const V2_TIER_GOLD = [60, 160, 320], V2_STAT_GOLD = 120;
export function fromV2(old) {
  const s = normalise({});
  s.gold = int(old.gold); s.gems = int(old.gems);
  for (const id of Object.keys(HEROES)) {
    const o = old.heroes && old.heroes[id]; if (!o) continue;
    const h = s.heroes[id];
    h.owned = h.owned || !!o.owned;
    h.trinkets = Array.isArray(o.trinkets) ? o.trinkets.slice() : [];
    for (const [k, r] of Object.entries(o.nodes || {})) {
      const m = /([1-3])$/.exec(k);
      s.gold += m ? V2_TIER_GOLD[+m[1] - 1] * int(r) : k === 'slot2' ? 400 : V2_STAT_GOLD * int(r);
    }
    h.level = Math.max(1, Math.floor(int(o.best, 1) / 2)); h.best = h.level; h.points = START_POINTS + h.level - 1;
  }
  const seats = int(old.slots, 1);
  if (seats >= 2) s.unlocks.slotMini1 = true;
  if (seats >= 3) s.unlocks.slotBoss1 = true;
  if (seats >= 4) s.unlocks.slotBoss2 = true;
  for (const k of ['potions', 'runs', 'wins', 'speed', 'zoom', 'mercs', 'theme', 'elixirs', 'tlv', 'seen', 'campLayout', 'treeLayout', 'cheat', 'party']) if (old[k] != null) s[k] = old[k];
  s.trinkets = Array.isArray(old.trinkets) ? old.trinkets.slice() : [];
  for (const [k, d] of Object.entries(old.dungeons || {})) s.dungeons[k] = { best: int(d.best), cleared: int(d.cleared), checkpoint: Math.min(3, Math.max(1, int(d.best, 1))), minis: [int(d.best) >= 2, int(d.best) >= 3] };
  return normalise(s);
}

export function migrate(old) {
  const s = freshSave();
  s.gold = int(old.coins);
  if (old.speed) s.speed = old.speed;
  return s;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalise(JSON.parse(raw));
    const v2 = localStorage.getItem(V2_KEY);
    if (v2) { const s = fromV2(JSON.parse(v2)); writeSave(s); return s; }
    const old = localStorage.getItem(OLD_KEY);
    if (old) { const s = migrate(JSON.parse(old)); writeSave(s); return s; }
    return freshSave();
  } catch (e) { return freshSave(); }
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable: keep playing in memory */ }
}

export function resetSave() { try { for (const k of [KEY, V2_KEY, OLD_KEY]) localStorage.removeItem(k); } catch (e) {} return freshSave(); }
