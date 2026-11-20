// Little shared pieces for the camp's screens (camp.js, camp-scenes.js, skilltree.js): pictures, prices, words.
// No state of its own: anything that needs the save takes it as an argument.
import { HEROES, HERO_IDS } from './heroes.js';
import * as P from './progress.js';
import { icon } from './icons.js';

export const I = {
  gem: '<svg class="i-gem" viewBox="0 0 24 24"><path d="M6 3h12l5 6-11 13L1 9z" fill="#2B2230"/><path d="M7.2 5.2h9.6l3.4 4L12 18.6 3.8 9.2z" fill="#5FD0E8"/><path d="M7.2 5.2h9.6L12 9.6z" fill="#B8F0FA"/><path d="M3.8 9.2h16.4L12 18.6z" fill="#2FA6C9"/></svg>',
  flask: '<svg class="i-flask" viewBox="0 0 24 24"><path d="M9 2h6v2h-1v4.2a8 8 0 1 1-4 0V4H9z" fill="#2B2230"/><circle cx="12" cy="15" r="5.6" fill="#E0604B"/><path d="M7 14.4a5.6 5.6 0 0 1 10 0z" fill="#F7B3A3" opacity=".55"/><rect x="11" y="4" width="2" height="5" fill="#EDE6D8"/></svg>',
  lock: '<svg class="i-lock" viewBox="0 0 24 24"><path d="M6 10V8a6 6 0 0 1 12 0v2h1v12H5V10zm3 0h6V8a3 3 0 0 0-6 0z" fill="#2B2230"/><rect x="7.4" y="12" width="9.2" height="8" rx="1.4" fill="#C9B98F"/></svg>',
  star: '<svg class="i-star" viewBox="0 0 24 24"><path d="M12 1l3.4 7 7.6 1-5.6 5.3 1.4 7.7L12 18.3 5.2 22l1.4-7.7L1 9l7.6-1z" fill="#2B2230"/><path d="M12 5l2.3 4.6 5 .7-3.7 3.5.9 5L12 16.4l-4.5 2.4.9-5-3.7-3.5 5-.7z" fill="#FFD45A"/></svg>',
  fire: '<svg class="i-fire" viewBox="0 0 24 24"><path d="M12 1c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#2B2230"/><path d="M12 5c1 3 4 5 4 8.4a4 4 0 0 1-8 0c0-1.6.8-2.8 1.6-3.6.3 1.5 1.2 2.4 2.2 2.4.4-2.6-.4-4.8.2-7.2z" fill="#FF9A3D"/><path d="M12 12c.8 1 1.8 1.8 1.8 3a1.8 1.8 0 0 1-3.6 0c0-1 .9-2 1.8-3z" fill="#FFE07A"/></svg>',
  back: '<svg class="i-back" viewBox="0 0 24 24"><path d="M15 3L5 12l10 9 2.6-2.8L10.6 12l7-6.2z" fill="currentColor"/></svg>',
  check: '<svg class="i-tick" viewBox="0 0 24 24"><path d="M2 12.5l3.2-3.2L10 14l8.8-8.8L22 8.4 10 20.4z" fill="#5FB55A"/></svg>',
  cross: '<svg class="i-tick" viewBox="0 0 24 24"><path d="M5 2.4L12 9.4l7-7 2.6 2.6-7 7 7 7L19 21.6l-7-7-7 7L2.4 19l7-7-7-7z" fill="#E0604B"/></svg>',
  book: '<svg class="i-book" viewBox="0 0 24 24"><path d="M3 4c3-1.4 6-1.4 9 .6 3-2 6-2 9-.6v16c-3-1.4-6-1.4-9 .6-3-2-6-2-9-.6z" fill="#2B2230"/><path d="M5 5.6c2.2-.8 4.4-.6 6 .6v12.4c-1.8-1-3.8-1.2-6-.6zM13 6.2c1.6-1.2 3.8-1.4 6-.6v12.4c-2.2-.6-4.2-.4-6 .6z" fill="#EDE6D8"/><path d="M15 9.4c1-.5 2.2-.6 3-.4M15 12c1-.5 2.2-.6 3-.4" stroke="#C8553D" stroke-width="1.4"/><circle cx="8" cy="10.6" r="1.8" fill="#C8553D"/></svg>',
  bag: '<svg class="i-bag" viewBox="0 0 24 24"><path d="M8 6a4 4 0 0 1 8 0h3l2 16H3L5 6z" fill="#2B2230"/><path d="M7 8.4h10l1.6 11.2H5.4z" fill="#C0844A"/><path d="M10 6a2 2 0 0 1 4 0z" fill="#EDE6D8"/><circle cx="12" cy="13" r="2.2" fill="#F2B53A"/></svg>',
  tree: '<svg class="i-tree" viewBox="0 0 24 24"><path d="M12 23v-7M12 16l-6-6M12 16l6-6M12 12V5M6 10l-2-4M18 10l2-4" stroke="#2B2230" stroke-width="4.4" stroke-linecap="round" fill="none"/><path d="M12 23v-7M12 16l-6-6M12 16l6-6M12 12V5M6 10l-2-4M18 10l2-4" stroke="#FFB347" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="12" cy="4" r="2.6" fill="#FFE7A0" stroke="#2B2230" stroke-width="1.4"/><circle cx="4" cy="6" r="2.2" fill="#FFE7A0" stroke="#2B2230" stroke-width="1.4"/><circle cx="20" cy="6" r="2.2" fill="#FFE7A0" stroke="#2B2230" stroke-width="1.4"/></svg>',
  stand: '<svg viewBox="0 0 24 24"><path d="M12 2l7 7h-4.5v7h-5V9H5z" fill="currentColor"/><rect x="5" y="18.5" width="14" height="3" rx="1.5" fill="currentColor"/></svg>',
  sit: '<svg viewBox="0 0 24 24"><path d="M12 22l7-7h-4.5V8h-5v7H5z" fill="currentColor"/><rect x="5" y="2.5" width="14" height="3" rx="1.5" fill="currentColor"/></svg>',
  zzz: '<span class="zzz"><i>z</i><i>z</i><i>z</i></span>',
};
export const coin = '<span class="coin"></span>';
export const gold = (n) => `<span class="cost">${coin}${n}</span>`;
export const gems = (n) => `<span class="cost">${I.gem}${n}</span>`;
export const ROLE = { tank: 'Tank', melee: 'Fighter', skirmish: 'Skirmisher', ranged: 'Ranged', caster: 'Caster', support: 'Support' };
export const ROLE_COL = { tank: '#5B8CDB', melee: '#D0664E', skirmish: '#7DB046', ranged: '#4FA37A', caster: '#9B7BD6', support: '#E6A935' };
export const roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V'][n] || String(n);
export const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const ownedHeroes = (save) => HERO_IDS.filter((id) => save.heroes[id].owned);
export const tIcon = (save, t) => { const lv = P.trinketLevel(save, t.id); return `<span class="tico lv${lv}">${icon('trinket', t.id, '', t.color)}${lv > 1 ? `<i class="tlv">${roman(lv)}</i>` : ''}</span>`; };
export const pIcon = (id) => `<span class="tico">${icon('potion', id)}</span>`;
export const bagCount = (save) => Object.keys(P.POTIONS).reduce((a, id) => a + P.potionCount(save, id), 0);
export const heroArt = (id) => HEROES[id].art;

// A dungeon theme's colours for its little pictures (theme palettes give [light, dark] pairs).
export function themeColors(t) {
  const p0 = (t && t.palette) || {}, c = (v, i = 0) => (Array.isArray(v) ? v[i] : v);
  return { floor: c(p0.floor) || '#6B5E66', wall: c(p0.wall) || '#3A3040', rock: c(p0.rock, 1) || p0.void || '#2B2230', accent: p0.accent || '#F2DFA0' };
}
export const themeLine = (rec) => (!rec ? 'Not entered yet' : rec.cleared ? `Cleared ${rec.cleared === 1 ? 'once' : rec.cleared + ' times'}` : `Got to floor ${rec.best}`);
