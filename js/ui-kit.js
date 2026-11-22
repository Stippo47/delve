// Small shared pieces for the camp, the tree, the HUD and the result screen (UI v3): line icons, money tags, words.
// No state of its own.
import { HEROES } from './heroes.js';

const svg = (d, extra = '') => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
// One line weight, one corner style: the tab bar and the small controls.
export const I = {
  heroes: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6"/><circle cx="17" cy="9" r="2.6"/><path d="M16.2 13.6c3 .1 4.8 1.9 5.3 4.6"/>'),
  trader: svg('<path d="M4 9h16l-1.3 11H5.3z"/><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2"/><circle cx="12" cy="14.5" r="1.6"/>'),
  camp: svg('<path d="M12 3L2.5 20h19z"/><path d="M12 3v17M9 20l3-6 3 6"/>'),
  book: svg('<path d="M4 5.5C6.5 4.4 9.5 4.4 12 6c2.5-1.6 5.5-1.6 8-.5v13c-2.5-1.1-5.5-1.1-8 .5-2.5-1.6-5.5-1.6-8-.5z"/><path d="M12 6v13"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.9-1.9M17.5 6.5l1.9-1.9"/>'),
  back: svg('<path d="M15 4l-8 8 8 8"/>', 'stroke-width="2.6"'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.6"'),
  check: svg('<path d="M4.5 12.5l4.5 4.5 10-10"/>', 'stroke-width="2.8"'),
  flag: svg('<path d="M6 21V4"/><path d="M6 4.5h11l-2.5 4 2.5 4H6"/>'),
  skull: svg('<path d="M5 11a7 7 0 0 1 14 0v3l-2 1.5V19H7v-3.5L5 14z"/><circle cx="9.3" cy="11.5" r="1.6"/><circle cx="14.7" cy="11.5" r="1.6"/><path d="M10.5 19v-2M13.5 19v-2"/>'),
  crown: svg('<path d="M3.5 8l4 4 4.5-6.5L16.5 12l4-4-1.8 11H5.3z"/>'),
  center: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5"/>'),
  pause: '<svg class="ico" viewBox="0 0 24 24"><rect x="6" y="4.5" width="4.2" height="15" rx="1.4" fill="currentColor"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4" fill="currentColor"/></svg>',
  play: '<svg class="ico" viewBox="0 0 24 24"><path d="M7 4.5l13 7.5-13 7.5z" fill="currentColor"/></svg>',
  door: svg('<path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M3 21h18"/><circle cx="14.5" cy="12.5" r="1" fill="currentColor"/>'),
  flask: svg('<path d="M9.5 3h5M10.5 3v5.2L5.6 17.4A2.4 2.4 0 0 0 7.7 21h8.6a2.4 2.4 0 0 0 2.1-3.6L13.5 8.2V3"/><path d="M7.6 14h8.8"/>'),
  moon: svg('<path d="M19 15.5A8 8 0 0 1 8.5 5a8 8 0 1 0 10.5 10.5z"/>'),
  sword: svg('<path d="M14.5 4H20v5.5L10 19.5 4.5 14z"/><path d="M3 21l3.5-3.5M8 13l3 3"/>'),
  fire: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 2c1 4 6.5 6 6.5 12.2a6.5 6.5 0 0 1-13 0c0-3 2-5.2 3.2-6.4.1 2 1 3.2 2.1 3.2C11 7.8 10 5 12 2z" fill="#FF9A3D"/><path d="M12 11.5c1 1.2 2.4 2.2 2.4 3.9a2.4 2.4 0 0 1-4.8 0c0-1.4 1.1-2.6 2.4-3.9z" fill="#FFE07A"/></svg>',
};
export const coin = '<span class="coin"></span>';
export const gold = (n) => `<span class="cost">${coin}${n}</span>`;
export const pts = (n) => `<span class="pts">${n}</span>`;
export const ROLE = { tank: 'Tank', melee: 'Fighter', skirmish: 'Skirmisher', ranged: 'Ranged', caster: 'Caster', support: 'Support' };
export const ROLE_COL = { tank: '#5B8CDB', melee: '#D0664E', skirmish: '#7DB046', ranged: '#4FA37A', caster: '#9B7BD6', support: '#E6A935' };
export const roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] || String(n);
export const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const face = (id, size, extra = '') => {
  const h = HEROES[id];
  return `<span class="face" style="width:${size}px;height:${size}px;--rc:${ROLE_COL[h.role]}" ${extra}><img src="${h.portrait || h.art}" alt=""></span>`;
};
// A theme's colours for its little pictures (palettes give [light, dark] pairs).
export function themeColors(t) {
  const p = (t && t.palette) || {}, c = (v, i = 0) => (Array.isArray(v) ? v[i] : v);
  return { floor: c(p.floor) || '#6B5E66', wall: c(p.wall) || '#3A3040', wall2: c(p.wall, 1) || '#2B2230', rock: c(p.rock, 1) || p.void || '#2B2230', accent: p.accent || '#F2DFA0' };
}
