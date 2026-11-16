// Camp progress lives in localStorage. Home Screen web apps keep it; wrapped in try/catch because
// storage can throw (private mode, quota).
import { HERO_ORDER } from './units.js';

const KEY = 'dungeon-save-v1';

export function freshSave() {
  const heroes = {};
  for (const k of HERO_ORDER) heroes[k] = { level: 1, xp: 0, trinket: null };
  return { coins: 0, maxDepth: 1, depth: 1, heroes, inventory: [], runs: 0, wins: 0, speed: 1 };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshSave();
    const s = JSON.parse(raw);
    const f = freshSave();
    return { ...f, ...s, heroes: { ...f.heroes, ...(s.heroes || {}) } };
  } catch (e) { return freshSave(); }
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable: keep playing in memory */ }
}

export function resetSave() { try { localStorage.removeItem(KEY); } catch (e) {} return freshSave(); }
