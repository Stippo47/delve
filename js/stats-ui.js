// The run stats on screen (round 9, lane T): the result card's "who did what" (leaders, the party with where each
// hero's damage, healing and kills came from, the enemies defeated), a unit's real numbers (the pause panel and the
// About page) and the lifetime totals (About, the book). Plain HTML strings in the UI v3 look; data from stats.js.
import { HEROES } from './heroes.js';
import { DEFS } from './units.js';
import { TRINKETS } from './trinkets.js';
import { POTIONS } from './potions.js';
import { STATUS } from './statuses.js';
import { icon, abilityGlyph, ABILITY_COLOR } from './icons.js';
import { portrait } from './inspect.js';
import { I, face } from './ui-kit.js';
import { MERCS } from './progress.js';

export const num = (n) => Math.round(n || 0).toLocaleString('en-US');
const pct = (a, b) => { const p = b > 0 ? 100 * a / b : 0; return p > 0 && p < 1 ? '<1' : Math.round(p); };
const ST_NAME = { burn: 'Burning', poison: 'Poison', chill: 'Shatter', shock: 'Shock', wet: 'Soaked', stagger: 'Stagger', radiance: 'Radiance', curse: 'Curse' };
const PET_ABS = ['callWolf', 'raiseDead'];

// A hero's face (sellswords have no portrait card: their sprite).
export function heroFace(id, size) {
  if (HEROES[id]) return face(id, size);
  const m = MERCS.find((x) => x.kind === id);
  return `<span class="face" style="width:${size}px;height:${size}px;--rc:#8F97A3"><img src="${m ? m.art : portrait(id)}" alt=""></span>`;
}
const heroName = (id) => (HEROES[id] ? HEROES[id].name : (MERCS.find((x) => x.kind === id) || DEFS[id] || { name: id }).name);

// What a source key (stats.js) is: its name, its little picture, its colour.
export function srcInfo(hero, key) {
  const H = HEROES[hero];
  if (key === 'attack') return { name: H ? H.attack.name : 'Weapon', ico: I.sword, col: '#D8DEE8', kind: 'Weapon' };
  if (key === 'pet') { const ab = H && H.abilities.find((a) => PET_ABS.includes(a.id)); return { name: 'Minions', ico: icon('ability', ab ? ab.id : 'raiseDead'), col: '#B39DFF', kind: 'Summons' }; }
  const i = key.indexOf(':'), kind = key.slice(0, i), id = key.slice(i + 1);
  if (kind === 'ab') {
    const n = H ? H.abilities.findIndex((a) => a.id === id) : -1;
    return { name: n >= 0 ? H.abilities[n].name : id, ico: icon('ability', id), col: ABILITY_COLOR[abilityGlyph(id)] || '#E0B070', kind: n >= 0 ? `Ability ${n + 1}` : 'Ability' };
  }
  if (kind === 'tk') {
    if (id.startsWith('pot:')) { const p = POTIONS[id.slice(4)] || { name: id.slice(4), color: '#9B7BD6' }; return { name: p.name, ico: icon('potion', id.slice(4)), col: p.color, kind: 'Elixir' }; }
    const t = TRINKETS[id] || { name: id, color: '#9B7BD6' };
    return { name: t.name, ico: icon('trinket', id, '', t.color), col: t.color || '#9B7BD6', kind: 'Trinket' };
  }
  if (kind === 'st') return { name: ST_NAME[id] || id, ico: icon('status', id), col: (STATUS[id] && STATUS[id].col) || '#FF9A55', kind: 'Status' };
  return { name: 'Other', ico: '<i class="si-dot"></i>', col: '#646B8C', kind: '' };
}

// One measure split by source: a stacked bar and a short list (icon, name, amount, share).
export function breakdown(hero, map, title, whole) {
  const rows = Object.entries(map || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, [, v]) => a + v, 0);
  if (!total) return '';
  const shown = whole || total; // the hero's own total (the parts are rounded one by one)
  const info = rows.map(([k, v]) => ({ ...srcInfo(hero, k), v }));
  return `<div class="bd"><div class="bd-h"><span class="cap">${title}</span><b>${num(shown)}</b></div>
    <div class="bd-bar">${info.map((s) => `<i style="width:${100 * s.v / total}%;background:${s.col}"></i>`).join('')}</div>
    ${info.map((s) => `<div class="bd-row"><span class="si" style="--sc:${s.col}">${s.ico}</span><span class="bd-n"><b>${s.name}</b>${s.kind ? `<span>${s.kind}</span>` : ''}</span><span class="bd-v">${num(s.v)}<i>${pct(s.v, total)}%</i></span></div>`).join('')}</div>`;
}

// ---------------------------------------------------------------- the result card
const LEADS = [
  ['dmg', 'Most damage', '#F5B841'], ['heal', 'Most healing', '#5CC45A'], ['taken', 'Took the most', '#E8604C'],
  ['kills', 'Most kills', '#F2E8D2'], ['downs', 'Most downs', '#9BA2C0'],
];
export function resultStats(S) {
  if (!S || !S.order || !S.order.length) return '';
  const ids = S.order.filter((k) => S.heroes[k]), H = (k) => S.heroes[k];
  const leads = LEADS.map(([m, label, col]) => {
    const best = ids.reduce((b, k) => (H(k)[m] > (b ? H(b)[m] : 0) ? k : b), null);
    if (!best && m === 'downs') return `<div class="rs-lead calm"><span class="rs-ok">${I.check}</span><span class="cap">${label}</span><b>Nobody fell</b></div>`;
    if (!best) return '';
    return `<div class="rs-lead" style="--lc:${col}">${heroFace(best, 44)}<span class="cap">${label}</span><b>${num(H(best)[m])}</b><span class="rs-who">${heroName(best)}</span></div>`;
  }).filter(Boolean);
  const max = (m) => Math.max(1, ...ids.map((k) => H(k)[m]));
  const bar = (k, m, label, cls) => `<div class="rs-bar ${cls}"><span>${label}</span><span class="bar"><i style="width:${100 * H(k)[m] / max(m)}%"></i></span><b>${num(H(k)[m])}</b></div>`;
  const rows = ids.map((k) => {
    const h = H(k), merc = (S.mercs || []).includes(k);
    const facts = [`${h.kills} ${h.kills === 1 ? 'kill' : 'kills'}`, h.downs ? `${h.downs} ${h.downs === 1 ? 'down' : 'downs'}` : '', h.revives ? `${h.revives} ${h.revives === 1 ? 'revive' : 'revives'}` : '',
      h.best ? `best hit ${num(h.best)}` : ''].filter(Boolean);
    const more = breakdown(k, h.src.dmg, 'Damage', h.dmg) + breakdown(k, h.src.heal, 'Healing', h.heal) + breakdown(k, h.src.kills, 'Kills', h.kills);
    return `<div class="rs-row" role="button" data-rs="${k}">
      <div class="rs-top">${heroFace(k, 40)}<div class="rs-mid"><div class="rs-name"><b>${heroName(k)}</b>${merc ? '<span class="cap">sellsword</span>' : ''}<span class="rs-chev"></span></div>
        ${bar(k, 'dmg', 'Damage', 'd')}${bar(k, 'heal', 'Healing', 'h')}${bar(k, 'taken', 'Taken', 't')}
        <div class="rs-facts">${facts.map((f) => `<span>${f}</span>`).join('')}</div></div></div>
      ${more ? `<div class="rs-more">${more}</div>` : ''}</div>`;
  }).join('');
  return `<section class="rstats">
    <div class="rs-h"><span class="cap">Who did what</span></div>
    <div class="rs-leads n${leads.length}">${leads.join('')}</div>
    <div class="rs-h"><span class="cap">The party</span><span class="quiet small">tap a hero for where it came from</span></div>
    ${rows}
    ${foesGrid(S.foes, 'Defeated')}</section>`;
}

// Enemy kinds with their sprite and how many (elites, mini-bosses and bosses noted). foes: { kind: { n, elite, ... } }
export function foesGrid(foes, title) {
  const list = Object.entries(foes || {}).filter(([k, f]) => f.n > 0 && DEFS[k]);
  if (!list.length) return '';
  const rank = (f) => (f.boss ? 3 : f.mini ? 2 : f.major ? 1.5 : f.elite ? 1 : 0);
  list.sort((a, b) => rank(b[1]) - rank(a[1]) || b[1].n - a[1].n);
  const total = list.reduce((a, [, f]) => a + f.n, 0);
  return `<div class="rs-h"><span class="cap">${title} · ${num(total)}</span></div><div class="foes">${list.map(([k, f]) => {
    const tags = [f.boss ? 'boss' : '', f.mini ? (f.mini > 1 ? `${f.mini} mini-bosses` : 'mini-boss') : '', f.major ? `${f.major} major` : '', f.elite ? `${f.elite} elite` : ''].filter(Boolean);
    return `<div class="foe ${f.boss ? 'boss' : f.mini ? 'mini' : f.elite || f.major ? 'elite' : ''}"><span class="foe-pic"><img src="${portrait(k)}" alt=""><i>×${num(f.n)}</i></span>
      <b>${DEFS[k].name}</b>${tags.length ? `<span class="foe-tag">${tags.join(' · ')}</span>` : ''}</div>`;
  }).join('')}</div>`;
}

// The result card's rows open and close on a tap (one listener for the card's element).
export function wireStats(el) {
  if (!el || el._rsWired) return; el._rsWired = true;
  el.addEventListener('click', (e) => { const r = e.target.closest('[data-rs]'); if (r && r.querySelector('.rs-more')) r.classList.toggle('open'); });
}

// ---------------------------------------------------------------- a unit's numbers (sim.js unitNumbers)
export function numbersRow(n) {
  if (!n) return '';
  const f1 = (v) => (v >= 10 ? Math.round(v) : (Math.round(v * 10) / 10).toFixed(1));
  // (round 11: armour joins them, so two rows of three: what it deals, then what it takes)
  const cells = [['Per hit', f1(n.hit)], ['Hits / s', (Math.round(n.aps * 100) / 100).toFixed(2)], ['Reach', Math.round(n.range)], ['Health', num(n.hp)], ['Armour', Math.round((n.armor || 0) * 10) / 10], ['Speed', Math.round(n.speed)]];
  return `<div class="numrow six">${cells.map(([k, v]) => `<div><span class="cap">${k}</span><b>${v}</b></div>`).join('')}</div>`;
}
// This run so far (the pause panel): a few chips.
export function runLine(h) {
  if (!h) return '';
  const bits = [['Damage', num(h.dmg)], h.heal ? ['Healing', num(h.heal)] : null, ['Taken', num(h.taken)], ['Kills', h.kills]].filter(Boolean);
  return `<div class="numrow run" style="grid-template-columns:repeat(${bits.length},minmax(0,1fr))">${bits.map(([k, v]) => `<div><span class="cap">${k}</span><b>${v}</b></div>`).join('')}</div>`;
}
// The About page's lifetime totals and where they came from.
export function lifetime(save, id) {
  const t = save.tally && save.tally.heroes && save.tally.heroes[id];
  if (!t || !t.runs) return `<p class="quiet small empty-note">No runs yet.</p>`;
  const cells = [['Runs', t.runs], ['Damage', num(t.dmg)], ['Healing', num(t.heal)], ['Kills', num(t.kills)], ['Taken', num(t.taken)], ['Downs', t.downs], ['Revives', t.revives], ['Best hit', num(t.best)]];
  return `<div class="numrow life">${cells.map(([k, v]) => `<div><span class="cap">${k}</span><b>${v}</b></div>`).join('')}</div>
    <div class="bd-box">${breakdown(id, t.src.dmg, 'Damage by source', t.dmg)}${breakdown(id, t.src.heal, 'Healing by source', t.heal)}</div>`;
}
// The book: how many of a kind the party has defeated in all.
export const foeCount = (save, k) => (save.tally && save.tally.foes && save.tally.foes[k]) || null;
