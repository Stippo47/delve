// Camp progress lives in localStorage. Home Screen web apps keep it; wrapped in try/catch because
// storage can throw (private mode, quota).
//
// Version 2 (docs/BUILD-v1.md):
// { v: 2, gold, gems, slots, potions,
//   heroes: { [id]: { owned, nodes: { [nodeId]: rank }, feat, best, trinkets: [id...], recoverUntil } },
//   trinkets: [id...] (owned, not equipped), dungeons: { [themeId]: { best, cleared } },
//   runs, wins, speed, zoom,
//   party: [heroId...] (last picked, camp only), mercs (last choice), theme (last picked),
//   round 6: elixirs: { [potionId]: n } (potions other than healing), tlv: { [trinketId]: level },
//   seen: { [enemyKind]: { met, beaten } } (the bestiary), look / treeLook (camp and skill-tree styles), cheat }
// A v1 save (levels were permanent then) starts fresh but keeps its coins as gold.
import { HEROES } from './heroes.js';

const KEY = 'delve-save-v2';
const OLD_KEY = 'dungeon-save-v1';

export function freshHero(id) {
  return { owned: !!HEROES[id].starter, nodes: {}, feat: false, best: 0, trinkets: [], recoverUntil: 0 };
}

export function freshSave() {
  const heroes = {};
  for (const id of Object.keys(HEROES)) heroes[id] = freshHero(id);
  return { v: 2, gold: 0, gems: 0, slots: 1, potions: 0, heroes, trinkets: [], dungeons: {}, runs: 0, wins: 0,
    speed: 1, zoom: null, party: [Object.keys(HEROES).find((k) => HEROES[k].starter)], mercs: false, theme: null,
    elixirs: {}, tlv: {}, seen: {}, look: 'classic', treeLook: 'classic', cheat: false };
}

// Fill anything a save is missing (new heroes added since, new fields) without touching what it has.
function normalise(s) {
  const f = freshSave();
  const out = { ...f, ...s, v: 2 };
  out.heroes = {};
  for (const id of Object.keys(HEROES)) {
    const h = (s.heroes && s.heroes[id]) || {};
    out.heroes[id] = { ...freshHero(id), ...h, nodes: { ...(h.nodes || {}) }, trinkets: Array.isArray(h.trinkets) ? h.trinkets.slice() : [] };
    if (HEROES[id].starter) out.heroes[id].owned = true;
  }
  out.trinkets = Array.isArray(s.trinkets) ? s.trinkets.filter((t) => typeof t === 'string') : [];
  out.dungeons = { ...(s.dungeons || {}) };
  const counts = (o) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}).map(([k, v]) => [k, Math.max(0, Math.floor(+v || 0))]));
  out.elixirs = counts(s.elixirs); out.tlv = counts(s.tlv);
  out.seen = {};
  for (const [k, v] of Object.entries(s.seen && typeof s.seen === 'object' ? s.seen : {})) out.seen[k] = { met: +(v && v.met) || 0, beaten: +(v && v.beaten) || 0 };
  out.cheat = !!s.cheat;
  // rest was 10 minutes before round 6: nobody waits longer than the new longest rest
  const cap = Date.now() + 3 * 60e3;
  for (const h of Object.values(out.heroes)) if (h.recoverUntil > cap) h.recoverUntil = cap;
  out.party = (Array.isArray(s.party) ? s.party : f.party).filter((id) => out.heroes[id] && out.heroes[id].owned).slice(0, out.slots);
  for (const k of ['gold', 'gems', 'potions', 'runs', 'wins']) out[k] = Math.max(0, Math.floor(+out[k] || 0));
  out.slots = Math.max(1, Math.floor(+out.slots || 1));
  return out;
}

export function migrate(old) {
  const s = freshSave();
  s.gold = Math.max(0, Math.floor(+old.coins || 0));
  if (old.speed) s.speed = old.speed;
  return s;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalise(JSON.parse(raw));
    const old = localStorage.getItem(OLD_KEY);
    if (old) { const s = migrate(JSON.parse(old)); writeSave(s); return s; }
    return freshSave();
  } catch (e) { return freshSave(); }
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable: keep playing in memory */ }
}

export function resetSave() { try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch (e) {} return freshSave(); }
