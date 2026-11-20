// The camp: a top-down campfire with the party around it, the heroes (roster, hero page, skill tree), the shop,
// the dungeon pick and the result screen after a run. Plain DOM, one click handler (data-act on buttons), redrawn
// from the save after every action. Rules and prices live in progress.js.
import { HEROES, HERO_IDS, BRANCHES, FEAT_LEVEL } from './heroes.js';
import * as P from './progress.js';
import { writeSave } from './save.js';
import { icon } from './icons.js';
import { DEFS } from './units.js';
import { BEASTS, beastFun, beastHabit, trinketFun, POTION_FUN } from './bestiary.js';
import { portrait } from './inspect.js';

// ---------------------------------------------------------------- looks (round 6: a style setting)
// The camp and the skill tree each have looks to choose from in the settings; the classic one is the 0.6.0 look.
// css/looks.css does the work, keyed on <html data-look> and <html data-tree>; the tree's ladder look also changes
// its layout (treeView below).
export const LOOKS = [
  { id: 'classic', name: 'Parchment', blurb: 'The 0.6.0 look: warm paper cards, heavy ink.' },
  { id: 'ember', name: 'Night watch', blurb: 'Dark night, the fire the only light.' },
  { id: 'journal', name: 'Field journal', blurb: 'A traveller\'s sketchbook: pencil, paper, tape.' },
  { id: 'arcade', name: 'Arcade', blurb: 'Chunky pixels, loud colours.' },
];
export const TREE_LOOKS = [
  { id: 'classic', name: 'Columns', blurb: 'Three columns of round nodes (0.6.0).' },
  { id: 'stars', name: 'Constellation', blurb: 'Each ability a line of stars in the night sky.' },
  { id: 'ladder', name: 'Ladder', blurb: 'One row per ability: its tiers left to right, easy to read.' },
  { id: 'runes', name: 'Rune stones', blurb: 'Carved stones on a slab; lit when bought.' },
];
export function applyLook(s = save) {
  const html = document.documentElement;
  html.dataset.look = LOOKS.some((l) => l.id === s.look) ? s.look : 'classic';
  html.dataset.tree = TREE_LOOKS.some((l) => l.id === s.treeLook) ? s.treeLook : 'classic';
}

// ---------------------------------------------------------------- dungeons (themes)
// Lane C writes js/themes.js (THEMES[id] = { name, blurb, palette { floor, wall, rock, accent }, ... }).
// Until it lands, these stand in.
const STUB_THEMES = {
  crypt: { name: 'The Bone Crypt', blurb: 'Old tombs. The dead get up again.', palette: { floor: '#6B5E66', wall: '#3A3040', rock: '#2B2230', accent: '#F2DFA0' } },
  drains: { name: 'The Drowned Drains', blurb: 'Rats, slime and deep, cold water.', palette: { floor: '#4F6458', wall: '#2E3B36', rock: '#23302B', accent: '#7FD6F5' } },
  cinder: { name: 'Cinder Halls', blurb: 'Hot stone, and things that like to burn.', palette: { floor: '#7A4E3E', wall: '#4A2C28', rock: '#2E1C1C', accent: '#FF9A4D' } },
};
export let THEMES = STUB_THEMES;
export async function loadThemes() {
  try {
    const m = await import('./themes.js');
    if (m.THEMES && Object.keys(m.THEMES).length) THEMES = m.THEMES;
  } catch (e) { /* not written yet: the stand-ins stay */ }
}

// ---------------------------------------------------------------- little pictures
const I = {
  gem: '<svg class="i-gem" viewBox="0 0 24 24"><path d="M6 3h12l5 6-11 13L1 9z" fill="#2B2230"/><path d="M7.2 5.2h9.6l3.4 4L12 18.6 3.8 9.2z" fill="#5FD0E8"/><path d="M7.2 5.2h9.6L12 9.6z" fill="#B8F0FA"/><path d="M3.8 9.2h16.4L12 18.6z" fill="#2FA6C9"/></svg>',
  flask: '<svg class="i-flask" viewBox="0 0 24 24"><path d="M9 2h6v2h-1v4.2a8 8 0 1 1-4 0V4H9z" fill="#2B2230"/><circle cx="12" cy="15" r="5.6" fill="#E0604B"/><path d="M7 14.4a5.6 5.6 0 0 1 10 0z" fill="#F7B3A3" opacity=".55"/><rect x="11" y="4" width="2" height="5" fill="#EDE6D8"/></svg>',
  lock: '<svg class="i-lock" viewBox="0 0 24 24"><path d="M6 10V8a6 6 0 0 1 12 0v2h1v12H5V10zm3 0h6V8a3 3 0 0 0-6 0z" fill="#2B2230"/><rect x="7.4" y="12" width="9.2" height="8" rx="1.4" fill="#C9B98F"/></svg>',
  star: '<svg class="i-star" viewBox="0 0 24 24"><path d="M12 1l3.4 7 7.6 1-5.6 5.3 1.4 7.7L12 18.3 5.2 22l1.4-7.7L1 9l7.6-1z" fill="#2B2230"/><path d="M12 5l2.3 4.6 5 .7-3.7 3.5.9 5L12 16.4l-4.5 2.4.9-5-3.7-3.5 5-.7z" fill="#FFD45A"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M12 1c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#2B2230"/><path d="M12 5c1 3 4 5 4 8.4a4 4 0 0 1-8 0c0-1.6.8-2.8 1.6-3.6.3 1.5 1.2 2.4 2.2 2.4.4-2.6-.4-4.8.2-7.2z" fill="#FF9A3D"/><path d="M12 12c.8 1 1.8 1.8 1.8 3a1.8 1.8 0 0 1-3.6 0c0-1 .9-2 1.8-3z" fill="#FFE07A"/></svg>',
  helm: '<svg viewBox="0 0 24 24"><path d="M3 15C3 7 7 2 12 2s9 5 9 13v6h-6.5v-5h-5v5H3z" fill="#2B2230"/><path d="M5.4 15.4C5.4 9 8 4.6 12 4.6s6.6 4.4 6.6 10.8v3.2h-2v-5H7.4v5h-2z" fill="#B4BCC8"/><rect x="11" y="3" width="2" height="10" fill="#F2B53A"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M8 6a4 4 0 0 1 8 0h3l2 16H3L5 6z" fill="#2B2230"/><path d="M7 8.4h10l1.6 11.2H5.4z" fill="#C0844A"/><path d="M10 6a2 2 0 0 1 4 0z" fill="#EDE6D8"/><circle cx="12" cy="13" r="2.2" fill="#F2B53A"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 3L5 12l10 9 2.6-2.8L10.6 12l7-6.2z" fill="#2B2230"/></svg>',
  check: '<svg class="i-tick" viewBox="0 0 24 24"><path d="M2 12.5l3.2-3.2L10 14l8.8-8.8L22 8.4 10 20.4z" fill="#3E8A4A"/></svg>',
  cross: '<svg class="i-tick" viewBox="0 0 24 24"><path d="M5 2.4L12 9.4l7-7 2.6 2.6-7 7 7 7L19 21.6l-7-7-7 7L2.4 19l7-7-7-7z" fill="#C8553D"/></svg>',
  zzz: '<span class="zzz"><i>z</i><i>z</i><i>z</i></span>',
};
const coin = '<span class="coin"></span>';
const tIcon = (t) => { const lv = P.trinketLevel(save, t.id); return `<span class="tico lv${lv}">${icon('trinket', t.id, '', t.color)}${lv > 1 ? `<i class="tlv">${roman(lv)}</i>` : ''}</span>`; };
const pIcon = (id) => `<span class="tico">${icon('potion', id)}</span>`;
const cheapEnough = (n, cur = 'gold') => P.afford(save, cur, n);
const gold = (n) => `<span class="cost">${coin}${n}</span>`;
const gems = (n) => `<span class="cost">${I.gem}${n}</span>`;
const ROLE = { tank: 'Tank', melee: 'Fighter', skirmish: 'Skirmisher', ranged: 'Ranged', caster: 'Caster', support: 'Support' };
const ROLE_COL = { tank: '#5B8CDB', melee: '#D0664E', skirmish: '#7DB046', ranged: '#4FA37A', caster: '#9B7BD6', support: '#E6A935' };
const roman = (n) => ['', 'I', 'II', 'III'][n];
const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const ownedHeroes = (save) => HERO_IDS.filter((id) => save.heroes[id].owned);

// ---------------------------------------------------------------- state
let save = null, onSetOut = null, root = null, mainEl = null, sheetEl = null;
let tab = 'camp';          // camp | heroes | shop
let sub = null;            // null | { view: 'hero', id } | { view: 'dungeons' }
let bookTab = 'beasts';    // the bestiary's page: beasts | items
let sheet = null;          // null | { type: 'party', slot } | { type: 'node', hero, node } | { type: 'trinket', hero, slot }
let potionFor = {};        // { heroId: [potionId...] }: what each hero is handed to bring in
let lastView = '';
let ticker = 0;

export function initCamp(opts) {
  save = opts.save; onSetOut = opts.onSetOut;
  root = document.getElementById('camp');
  mainEl = document.getElementById('campMain');
  sheetEl = document.getElementById('sheet');
  applyLook();
  root.addEventListener('click', onClick);
  sheetEl.addEventListener('click', onClick);
  document.getElementById('result').addEventListener('click', onClick);
}
export function setSave(s) { save = s; applyLook(); }

export function showCamp() {
  sub = null; sheet = null;
  render();
  clearInterval(ticker); ticker = setInterval(tick, 1000);
}
export function hideCamp() { clearInterval(ticker); closeSheet(); }

function persist() { writeSave(save); }

// ---------------------------------------------------------------- drawing
function render() {
  const view = sub ? sub.view + (sub.id || '') : tab;
  const fresh = view !== lastView; lastView = view;
  const keep = fresh ? 0 : mainEl.scrollTop;
  document.getElementById('cGold').textContent = save.cheat ? '\u221e' : save.gold;
  document.getElementById('cGems').textContent = save.cheat ? '\u221e' : save.gems;
  root.classList.toggle('cheat', !!save.cheat);
  for (const b of root.querySelectorAll('.tabs button')) b.classList.toggle('on', !sub && b.dataset.act === 'tab:' + tab || (sub && sub.view === 'hero' && b.dataset.act === 'tab:heroes') || (sub && sub.view === 'dungeons' && b.dataset.act === 'tab:camp'));
  let html = '';
  if (sub && sub.view === 'hero') html = heroPage(sub.id);
  else if (sub && sub.view === 'dungeons') html = dungeonPick();
  else if (tab === 'camp') html = campView();
  else if (tab === 'heroes') html = rosterView();
  else if (tab === 'book') html = bookView();
  else html = shopView();
  mainEl.innerHTML = `<div class="view${fresh ? ' enter' : ''}">${html}</div>`;
  mainEl.scrollTop = keep;
  if (sheet) renderSheet();
}

// ---- the camp: the fire, the party, mercs, set out
function campView() {
  const now = Date.now();
  const seats = [];
  for (let i = 0; i < save.slots; i++) seats.push(save.party[i] || null);
  const resting = ownedHeroes(save).filter((id) => P.recoverLeft(save, id, now) && !save.party.includes(id)).slice(0, 3);
  const bag = P.POTIONS ? Object.keys(P.POTIONS).reduce((a, id) => a + P.potionCount(save, id), 0) : save.potions;
  const handed = Object.values(potionFor).reduce((a, l) => a + l.length, 0);
  const canPay = bag > 0;
  const nextSeat = P.slotPrice(save);
  return `
  ${scene(seats, resting)}
  <section class="card party">
    <div class="row-h"><h2>Your party</h2><span class="muted">${save.party.length} of ${save.slots} ${save.slots === 1 ? 'seat' : 'seats'}</span></div>
    <div class="seats">
      ${seats.map((id, i) => seatTile(id, i, now)).join('')}
      ${nextSeat ? `<button class="seat locked" data-act="tab:shop">${I.lock}<b>Another seat</b><span class="muted">in the shop</span></button>` : ''}
    </div>
    <div class="potions-line">${I.flask}<span>${canPay ? `<b>${bag - handed}</b> ${bag - handed === 1 ? 'potion' : 'potions'} in the bag: tap the flask on a hero to hand some out.` : 'No potions to bring in. The shop sells them.'}</span></div>
  </section>
  <section class="card mercs ${save.mercs ? 'on' : ''}">
    <button class="merc-toggle" data-act="mercs">
      <span class="merc-art">${P.MERCS.map((m) => `<img src="${m.art}" alt="">`).join('')}</span>
      <span class="merc-text"><b>Hire sellswords</b><span class="muted">Two hired hands go in with you. They aren't yours to keep, and they take half the gold.</span></span>
      <span class="switch"><i></i></span>
    </button>
  </section>
  <button class="btn big setout" data-act="setout">${I.fire}<span>Set out</span></button>
  <div class="note">${save.runs ? `${save.runs} ${save.runs === 1 ? 'run' : 'runs'}, ${save.wins} cleared` : 'Gold you bring out is yours to keep, win or lose.'}</div>`;
}

function seatTile(id, i, now) {
  if (!id) return `<button class="seat empty" data-act="slot:${i}"><span class="plus">+</span><b>Choose</b></button>`;
  const h = HEROES[id], left = P.recoverLeft(save, id, now);
  const mine = potionFor[id] || [];
  const flask = mine.length || Object.keys(P.POTIONS).some((p) => P.potionCount(save, p) > 0);
  return `<div class="seat ${left ? 'resting' : ''}">
    <button class="seat-pick" data-act="slot:${i}"><img class="art" src="${h.art}" alt=""><b>${h.name}</b></button>
    ${left ? `<span class="timer" data-until="${save.heroes[id].recoverUntil}">${mmss(left)}</span>
      <button class="btn tiny" data-act="speed:${id}">Rest less ${gold(P.speedUpCost(left))}</button>`
    : flask ? `<button class="flask-btn ${mine.length ? 'on' : ''} n${mine.length}" data-act="potion:${id}" aria-label="potions">${mine.length ? mine.map((p) => icon('potion', p)).join('') : I.flask}</button>` : ''}
  </div>`;
}

// Top-down camp: a fire in the middle, the party sitting round it facing in, hired hands at the edge,
// anyone resting on a bedroll by the tent.
function scene(seats, resting) {
  const n = seats.length, R = 98, out = [];
  const spots = seats.map((id, i) => ({ id, a: -Math.PI / 2 + (i - (n - 1) / 2) * (n > 2 ? 1.05 : 1.25) + Math.PI }));
  // with one seat the hero sits below the fire (closest to the player), more spread round the bottom
  for (const [i, s] of spots.entries()) {
    const x = Math.cos(s.a) * R, y = Math.sin(s.a) * R, rot = (s.a + Math.PI / 2) * 180 / Math.PI;
    if (s.id) {
      const left = P.recoverLeft(save, s.id);
      out.push(`<button class="sitter ${left ? 'resting' : ''}" data-act="slot:${i}" style="--x:${x}px;--y:${y}px;--r:${rot}deg;--d:${(i * 0.7) % 2}s">
        <img src="${HEROES[s.id].art}" alt="${HEROES[s.id].name}">${left ? I.zzz : ''}</button>`);
    } else {
      out.push(`<button class="sitter empty" data-act="slot:${i}" style="--x:${x}px;--y:${y}px;--r:0deg"><span>+</span></button>`);
    }
  }
  if (save.mercs) P.MERCS.forEach((m, j) => {
    const a = -Math.PI / 2 + (j ? 0.55 : -0.55), x = Math.cos(a) * (R + 10), y = Math.sin(a) * (R + 10), rot = (a + Math.PI / 2) * 180 / Math.PI;
    out.push(`<div class="sitter merc" style="--x:${x}px;--y:${y}px;--r:${rot}deg;--d:${0.4 + j * 0.9}s"><img src="${m.art}" alt=""></div>`);
  });
  const beds = resting.map((id, j) => `<button class="bedroll" data-act="hero:${id}" style="--bx:${-150 + j * 8}px;--by:${-70 + j * 62}px">
    <img src="${HEROES[id].art}" alt="">${I.zzz}</button>`).join('');
  const sparks = Array.from({ length: 9 }, (_, i) => `<i style="--sx:${(i * 37) % 30 - 15}px;--sd:${(i * 0.43) % 2.6}s;--sr:${0.9 + (i % 3) * 0.35}"></i>`).join('');
  const stones = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<b style="--x:${Math.cos(a) * 40}px;--y:${Math.sin(a) * 40}px"></b>`; }).join('');
  return `<div class="scene">
    <div class="grass"></div><div class="dirt"></div><div class="glow"></div>
    <svg class="tent" viewBox="0 0 120 110"><path d="M60 6L114 98H6z" fill="#2B2230"/><path d="M60 16l44 76H16z" fill="#C79A5A"/><path d="M60 16l44 76H60z" fill="#A87A3F"/><path d="M60 54l14 38H46z" fill="#3B2C25"/></svg>
    <svg class="crate" viewBox="0 0 60 60"><rect x="3" y="3" width="54" height="54" rx="6" fill="#2B2230"/><rect x="9" y="9" width="42" height="42" rx="3" fill="#B07A45"/><path d="M12 12l36 36M48 12L12 48" stroke="#8A5A30" stroke-width="5"/></svg>
    <svg class="logseat" viewBox="0 0 120 40"><rect x="4" y="4" width="112" height="32" rx="16" fill="#2B2230"/><rect x="10" y="9" width="100" height="22" rx="11" fill="#8C5E3A"/><ellipse cx="104" cy="20" rx="6" ry="9" fill="#D7B184"/></svg>
    ${beds}
    <div class="fire"><div class="stones">${stones}</div>
      <svg class="logs" viewBox="0 0 100 100"><g stroke="#2B2230" stroke-width="16" stroke-linecap="round"><path d="M18 30L82 70M18 70L82 30"/></g><g stroke="#7A4A2A" stroke-width="9" stroke-linecap="round"><path d="M18 30L82 70M18 70L82 30"/></g></svg>
      <svg class="flame" viewBox="0 0 100 100"><path class="f1" d="M50 6C62 26 84 34 84 58a34 34 0 0 1-68 0C16 40 30 30 34 18c4 12 10 16 14 16C50 24 46 14 50 6z" fill="#2B2230"/><path class="f2" d="M50 16c8 16 26 24 26 42a26 26 0 0 1-52 0c0-12 8-20 13-26 2 9 7 13 11 13 2-10-2-20 2-29z" fill="#FF8A3D"/><path class="f3" d="M50 40c5 8 13 12 13 21a13 13 0 0 1-26 0c0-7 6-12 13-21z" fill="#FFE07A"/></svg>
      <div class="sparks">${sparks}</div>
    </div>
    <div class="ring">${out.join('')}</div>
  </div>`;
}

// ---- the dungeon pick
function dungeonPick() {
  const opts = P.runOptions(save, null, potionFor);
  const who = [...opts.party.map((id) => HEROES[id].art), ...(save.mercs ? P.MERCS.map((m) => m.art) : [])];
  const cards = Object.entries(THEMES).map(([id, t], i) => {
    const p0 = t.palette || {}, rec = save.dungeons[id];
    const c = (v, i = 0) => (Array.isArray(v) ? v[i] : v); // theme palettes give [light, dark] pairs
    const p = { floor: c(p0.floor), wall: c(p0.wall), rock: c(p0.rock, 1) || p0.void, accent: p0.accent };
    const line = !rec ? 'Not entered yet.' : rec.cleared ? `Cleared ${rec.cleared === 1 ? 'once' : rec.cleared + ' times'}` : `Got as far as floor ${rec.best}`;
    return `<button class="theme" data-act="enter:${id}" style="--floor:${p.floor || '#6B5E66'};--wall:${p.wall || '#3A3040'};--rock:${p.rock || '#2B2230'};--accent:${p.accent || '#F2DFA0'};--d:${i * 0.08}s">
      <div class="theme-art"><svg viewBox="0 0 200 90" preserveAspectRatio="xMidYMax slice">
        <rect width="200" height="90" fill="var(--rock)"/>
        <path d="M0 90V40h40V20h120v20h40v50z" fill="var(--wall)"/>
        <path d="M70 90V48a30 30 0 0 1 60 0v42z" fill="#2B2230"/>
        <path class="door-glow" d="M78 90V50a22 22 0 0 1 44 0v40z" fill="var(--accent)"/>
        <path d="M0 90h200v-8H0z" fill="var(--floor)"/>
      </svg></div>
      <div class="theme-text"><b>${t.name}</b><span>${t.blurb || ''}</span><span class="muted">${rec && rec.cleared ? I.star : ''}${line}</span></div>
    </button>`;
  }).join('');
  return `<div class="subhead"><button class="iconbtn" data-act="back">${I.back}</button><h1>Where to?</h1></div>
    <div class="goers">${who.length ? who.map((a) => `<img src="${a}" alt="">`).join('') : '<span class="muted">Nobody is ready to go. Pick a hero or hire sellswords.</span>'}</div>
    <div class="themes">${cards}</div>`;
}

// ---- the roster
function rosterView() {
  const now = Date.now();
  const owned = ownedHeroes(save).length;
  const tiles = HERO_IDS.map((id, i) => {
    const h = HEROES[id], sv = save.heroes[id], left = sv.owned && P.recoverLeft(save, id, now);
    return `<button class="htile ${sv.owned ? '' : 'locked'} ${left ? 'resting' : ''}" data-act="hero:${id}" style="--rc:${ROLE_COL[h.role]};--d:${(i % 9) * 0.03}s">
      <span class="rug"></span><img src="${h.art}" alt="">
      <b>${h.name}</b><span class="role">${ROLE[h.role]}</span>
      ${!sv.owned ? `<span class="badge price">${gems(P.heroPrice(id))}</span>` : left ? `<span class="badge timer" data-until="${sv.recoverUntil}">${mmss(left)}</span>` : sv.feat ? `<span class="badge feat">${I.star}</span>` : ''}
      ${save.party.includes(id) ? '<span class="flag">In party</span>' : ''}
    </button>`;
  }).join('');
  return `<div class="row-h title"><h1>Heroes</h1><span class="muted">${owned} of ${HERO_IDS.length}</span></div>
    <div class="htiles">${tiles}</div>
    <div class="note">Gems unlock heroes. Bosses drop them.</div>`;
}

// ---- a hero's page: who they are, their kit, trinkets and the skill tree
function heroPage(id) {
  const h = HEROES[id], sv = save.heroes[id], left = sv.owned && P.recoverLeft(save, id);
  const status = !sv.owned
    ? `<button class="btn big unlock" data-act="unlock:${id}">Unlock ${gems(P.heroPrice(id))}</button>`
    : left ? `<div class="restline">${I.zzz}<span>Resting <b class="timer" data-until="${sv.recoverUntil}">${mmss(left)}</b></span><button class="btn small" data-act="speed:${id}">Rest less ${gold(P.speedUpCost(left))}</button></div>`
    : '';
  const facts = [sv.feat ? `<span class="fact feat">${I.star} Reached level ${FEAT_LEVEL}</span>` : '', sv.best ? `<span class="fact">Best run: level ${sv.best}</span>` : ''].join('');
  const abilities = h.abilities.map((ab) => {
    const have = P.abilityTiers(save, id, ab.id);
    return `<div class="ability">
      <div class="row-h"><b>${ab.name}</b><span class="pips">${[1, 2, 3].map((t) => `<i class="${t <= have ? 'on' : ''}">${roman(t)}</i>`).join('')}</span></div>
      <p>${ab.desc}</p>
      <ol class="tiers">${ab.tiers.map((t, k) => `<li class="${k < have ? 'on' : ''}"><span>${roman(k + 1)}</span>${t}</li>`).join('')}</ol>
    </div>`;
  }).join('');
  const nSlots = P.trinketSlots(save, id);
  const tslots = Array.from({ length: 2 }, (_, k) => {
    if (k >= nSlots) return `<div class="tslot locked">${I.lock}<span class="muted">Second slot: in the tree</span></div>`;
    const t = sv.trinkets[k] && P.trinketInfo(sv.trinkets[k]);
    return `<button class="tslot ${t ? 'full' : ''}" data-act="tslot:${k}" ${sv.owned ? '' : 'disabled'}>${t ? `${tIcon(t)}<span><b>${t.name}</b><span class="muted">${t.desc}</span></span>` : '<span class="plus">+</span><span class="muted">Empty: tap to wear a trinket</span>'}</button>`;
  }).join('');
  return `<div class="subhead"><button class="iconbtn" data-act="back">${I.back}</button></div>
  <section class="hero-banner ${sv.owned ? '' : 'locked'}" style="--rc:${ROLE_COL[h.role]}">
    <div class="big-art"><span class="rug"></span><img src="${h.art}" alt=""></div>
    <h1>${h.name}</h1><span class="role">${ROLE[h.role]}</span>
    <p class="blurb">${h.blurb}</p>
    <div class="facts">${facts}</div>
    ${status}
  </section>
  <section class="card kit">
    <h2>Attack</h2><div class="attack"><b>${h.attack.name}</b><span>${h.attack.desc}</span></div>
    <h2>Abilities</h2>${abilities}
    <h2>Trait</h2><div class="trait"><b>${h.trait.name}</b><span>${h.trait.desc}</span></div>
  </section>
  <section class="card"><h2>Trinkets</h2><div class="tslots">${tslots}</div></section>
  <section class="card tree-card"><div class="row-h"><h2>Skill tree</h2><span>${gold(save.gold)}</span></div>
    <p class="muted">Bought with gold, kept for good. An ability tier wakes up when the hero reaches its level in a run.</p>
    ${treeView(id)}
  </section>`;
}
const gemIcon = (color) => `<span class="gem" style="--g:${color}"></span>`;

function treeView(id) {
  if (save.treeLook === 'ladder') return ladderView(id);
  const nodes = P.tree(id), h = HEROES[id];
  const cols = BRANCHES.map((b) => {
    const mine = nodes.filter((n) => n.branch === b.id);
    const tiers = mine.filter((n) => n.kind === 'tier'), extra = mine.filter((n) => n.kind !== 'tier');
    const parts = [];
    tiers.forEach((n, k) => {
      if (k) parts.push(`<i class="link ${P.rank(save, id, n.id) ? 'on' : ''}"></i>`);
      parts.push(nodeBtn(id, n));
    });
    parts.push('<i class="gap"></i>');
    for (const n of extra) parts.push(nodeBtn(id, n));
    const ab = h.abilities[b.ability];
    return `<div class="branch"><div class="bhead">${icon('ability', ab.id, 'bico')}<b>${b.name}</b><span>${ab.name}</span></div>${parts.join('')}</div>`;
  }).join('');
  return `<div class="tree">${cols}</div>`;
}
function nodeBtn(id, n) {
  const st = P.nodeState(save, id, n);
  const cls = st.maxed ? 'owned' : st.rank ? 'part' : !st.met ? 'locked' : st.canBuy ? 'ready' : 'poor';
  const face = n.kind === 'tier' ? `<span class="rn">${roman(n.tier)}</span>${icon('ability', n.ability, 'nico')}` : n.kind === 'slot' ? '<span class="gem" style="--g:#C9A7FF"></span>' : '<b>+</b>';
  const pips = n.max > 1 ? `<span class="rank">${Array.from({ length: n.max }, (_, k) => `<i class="${k < st.rank ? 'on' : ''}"></i>`).join('')}</span>` : '';
  const under = st.maxed ? `<span class="nlabel">${n.free ? 'Free' : n.max > 1 ? 'All bought' : 'Owned'}</span>` : `<span class="nlabel">${gold(st.cost)}</span>`;
  return `<button class="node ${n.kind} ${cls}" data-act="node:${n.id}" data-node="${n.id}">
    <span class="nface">${face}</span>${!st.met && !st.rank ? `<span class="nlock">${n.req.feat && !save.heroes[id].feat ? I.star : I.lock}</span>` : ''}
    ${n.kind === 'tier' ? `<span class="lvl">Lv${n.req.level}</span>` : ''}
    ${n.kind !== 'tier' ? `<span class="nname">${n.name}</span>` : ''}${pips}${under}
  </button>`;
}

// The ladder look: one row per ability, its three tiers left to right; the stat nodes and the slot underneath.
function ladderView(id) {
  const nodes = P.tree(id), h = HEROES[id];
  const rows = BRANCHES.map((b) => {
    const ab = h.abilities[b.ability], mine = nodes.filter((n) => n.branch === b.id);
    const tiers = mine.filter((n) => n.kind === 'tier');
    const have = P.abilityTiers(save, id, ab.id);
    return `<div class="lrow"><div class="lhead">${icon('ability', ab.id, 'bico')}<span><b>${ab.name}</b><span class="muted">${b.name} · ${have} of 3</span></span></div>
      <div class="lsteps">${tiers.map((n, k) => (k ? `<i class="link ${P.rank(save, id, n.id) ? 'on' : ''}"></i>` : '') + nodeBtn(id, n)).join('')}</div></div>`;
  }).join('');
  const extra = nodes.filter((n) => n.kind !== 'tier');
  return `<div class="tree ladder">${rows}<div class="lrow lextra"><div class="lhead"><span><b>Training</b><span class="muted">Bought again and again</span></span></div>
    <div class="lsteps">${extra.map((n) => nodeBtn(id, n)).join('')}</div></div></div>`;
}

// ---- the bestiary (the Book tab): every enemy met, and every item
function bookView() {
  const kinds = Object.keys(DEFS).filter((k) => DEFS[k].team === 'enemy' && k !== 'boss' && k !== 'skeleton');
  const seen = save.seen || {};
  const metN = kinds.filter((k) => seen[k] && seen[k].met).length;
  const tabs = `<div class="segs"><button class="${bookTab === 'beasts' ? 'on' : ''}" data-act="book:beasts">Monsters</button><button class="${bookTab === 'items' ? 'on' : ''}" data-act="book:items">Items</button></div>`;
  let body = '';
  if (bookTab === 'beasts') {
    body = `<div class="beasts">${kinds.map((k, i) => {
      const s = seen[k], d = DEFS[k];
      if (!s || !s.met) return `<div class="beast unknown" style="--d:${(i % 12) * 0.03}s"><span class="bpic"><img src="${portrait(k)}" alt=""></span><b>???</b></div>`;
      return `<button class="beast ${d.boss ? 'boss' : ''}" data-act="beast:${k}" style="--d:${(i % 12) * 0.03}s"><span class="bpic"><img src="${portrait(k)}" alt=""></span><b>${d.name}</b><span class="muted">${s.beaten} beaten</span></button>`;
    }).join('')}</div>`;
  } else {
    const pots = Object.keys(P.POTIONS).map((id) => { const p = P.POTIONS[id];
      return `<div class="entry">${pIcon(id)}<span><b>${p.name}</b><em>${POTION_FUN[id] || ''}</em><span class="muted">${p.desc}</span></span></div>`; }).join('');
    const tr = P.shopTrinkets().map((t) => `<div class="entry ${P.ownsTrinket(save, t.id) ? 'owned' : ''}" style="--rar:${P.RARITY[t.rarity].color}">${tIcon(t)}<span><b>${t.name}</b><em>${trinketFun(t.id)}</em><span class="muted">${t.desc}</span></span></div>`).join('');
    body = `<h2 class="sh">Potions</h2><section class="card entries">${pots}</section><h2 class="sh">Trinkets</h2><section class="card entries">${tr}</section>`;
  }
  return `<div class="row-h title"><h1>Bestiary</h1><span class="muted">${bookTab === 'beasts' ? `${metN} of ${kinds.length} met` : ''}</span></div>${tabs}${body}`;
}

// ---- the shop
function shopView() {
  const seat = P.slotPrice(save);
  const owned = {}; for (const t of save.trinkets) owned[t] = (owned[t] || 0) + 1;
  const worn = {}; for (const id of HERO_IDS) for (const t of save.heroes[id].trinkets) (worn[t] = worn[t] || []).push(HEROES[id].name);
  const items = P.shopTrinkets().map((t, i) => {
    const r = P.RARITY[t.rarity], lv = P.trinketLevel(save, t.id), up = P.upgradePrice(save, t.id), have = owned[t.id] || worn[t.id];
    const lvl = have ? `<div class="lvrow"><span class="lvpips">${Array.from({ length: P.TLV_MAX }, (_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}</span>
      ${up != null ? `<button class="btn small up ${cheapEnough(up) ? '' : 'poor'}" data-act="upt:${t.id}">Level ${roman(lv + 1)} ${gold(up)}</button>` : '<span class="muted">Top level</span>'}</div>` : '';
    return `<div class="ware" style="--rar:${r.color};--d:${Math.min(i, 12) * 0.04}s">
      ${tIcon(t)}
      <div class="ware-text"><b>${t.name}</b><span class="rar">${r.name}</span><span class="desc">${t.desc}</span><em class="fun">${trinketFun(t.id)}</em>
        ${have ? `<span class="muted">${owned[t.id] ? `${owned[t.id]} in the chest` : ''}${owned[t.id] && worn[t.id] ? ' · ' : ''}${worn[t.id] ? 'worn by ' + worn[t.id].join(', ') : ''}</span>` : ''}${lvl}</div>
      <button class="btn buy ${cheapEnough(t.price) ? '' : 'poor'}" data-act="buyt:${t.id}">${gold(t.price)}</button>
    </div>`;
  }).join('');
  const pots = Object.keys(P.POTIONS).map((id) => {
    const p = P.POTIONS[id], n = P.potionCount(save, id);
    return `<div class="ware potion">${pIcon(id)}<div class="ware-text"><b>${p.name}</b><span class="desc">${p.desc}</span><em class="fun">${POTION_FUN[id] || ''}</em>
      <span class="muted">${n} of ${P.POTION_MAX} in the bag</span></div>
      <button class="btn buy ${cheapEnough(p.price) && n < P.POTION_MAX ? '' : 'poor'}" data-act="buyp:${id}">${gold(p.price)}</button></div>`;
  }).join('');
  return `<div class="row-h title"><h1>Shop</h1></div>
  <section class="card supplies">
    <div class="ware seatware"><span class="seat-ic">${save.slots + (seat ? 1 : 0)}</span><div class="ware-text"><b>${seat ? 'Another seat by the fire' : 'Every seat is taken'}</b>
      <span class="desc">${seat ? `Party size ${save.slots} → ${save.slots + 1}.` : `Your party is ${save.slots} strong.`}</span></div>
      ${seat ? `<div class="paywith"><button class="btn buy ${cheapEnough(seat.gold) ? '' : 'poor'}" data-act="buys:gold">${gold(seat.gold)}</button>
        <button class="btn buy ${cheapEnough(seat.gems, 'gems') ? '' : 'poor'}" data-act="buys:gems">${gems(seat.gems)}</button></div>` : ''}</div>
  </section>
  <h2 class="sh">Potions</h2>
  <p class="muted sh">Hand them out at the fire before you set out: two each at most, one of a kind. Elixirs are drunk when the first real fight starts and last that room.</p>
  <section class="card supplies potions">${pots}</section>
  <h2 class="sh">Trinkets</h2>
  <p class="muted sh">Bought trinkets are yours for good; put them on a hero from the hero's page. Ones found in a dungeon only last that run. Once you own one, level it up: every copy gets stronger.</p>
  <section class="wares">${items}</section>`;
}

// ---------------------------------------------------------------- the bottom sheet
function openSheet(s) { sheet = s; renderSheet(); }
function closeSheet() { sheet = null; if (sheetEl) { sheetEl.classList.add('hidden'); sheetEl.innerHTML = ''; } }
function renderSheet() {
  let body = '';
  if (sheet.type === 'party') body = partySheet(sheet.slot);
  else if (sheet.type === 'node') body = nodeSheet(sheet.hero, sheet.node);
  else if (sheet.type === 'trinket') body = trinketSheet(sheet.hero, sheet.slot);
  else if (sheet.type === 'potions') body = potionSheet(sheet.hero);
  else if (sheet.type === 'settings') body = settingsSheet();
  else if (sheet.type === 'beast') body = beastSheet(sheet.kind);
  const was = !sheetEl.classList.contains('hidden');
  sheetEl.innerHTML = `<div class="backdrop" data-act="closesheet"></div><div class="panel ${was ? '' : 'rise'}"><span class="grip"></span>${body}</div>`;
  sheetEl.classList.remove('hidden');
}

function partySheet(slot) {
  const now = Date.now(), cur = save.party[slot];
  const list = ownedHeroes(save).sort((a, b) => !!P.recoverLeft(save, a, now) - !!P.recoverLeft(save, b, now));
  const rows = list.map((id) => {
    const h = HEROES[id], left = P.recoverLeft(save, id, now), inParty = save.party.includes(id);
    return `<div class="prow ${left ? 'resting' : ''} ${id === cur ? 'cur' : ''}">
      <button class="prow-pick" data-act="pick:${id}"><img src="${h.art}" alt=""><span><b>${h.name}</b><span class="muted">${ROLE[h.role]}${inParty && id !== cur ? ' · in another seat' : ''}${id === cur ? ' · in this seat' : ''}</span></span></button>
      ${left ? `<span class="timer" data-until="${save.heroes[id].recoverUntil}">${mmss(left)}</span><button class="btn tiny" data-act="speed:${id}">${gold(P.speedUpCost(left))}</button>` : ''}
    </div>`;
  }).join('');
  return `<h2>Who sits here?</h2><div class="plist">${rows}</div>
    <div class="sheet-foot">${cur ? '<button class="btn" data-act="pick:">Leave the seat empty</button>' : ''}<button class="btn" data-act="tab:heroes">More heroes</button></div>`;
}

function nodeSheet(heroId, nodeId) {
  const n = P.tree(heroId).find((x) => x.id === nodeId), st = P.nodeState(save, heroId, n);
  const kind = n.kind === 'tier' ? `${HEROES[heroId].abilities[BRANCHES.find((b) => b.id === n.branch).ability].name}, tier ${roman(n.tier)}` : n.kind === 'stat' ? 'Can be bought more than once' : 'Trinket slot';
  const needs = st.needs.filter((x) => x.what !== 'owned' || !x.ok).map((x) => `<li class="${x.ok ? 'ok' : ''}">${x.ok ? I.check : I.cross}${x.text}</li>`).join('');
  const lvl = n.kind === 'tier' ? `<li class="info">${I.star}Wakes up at level ${n.req.level} in a run</li>` : '';
  const pips = n.max > 1 ? `<div class="rank big">${Array.from({ length: n.max }, (_, k) => `<i class="${k < st.rank ? 'on' : ''}"></i>`).join('')}<span class="muted">${st.rank} of ${n.max}</span></div>` : '';
  const btn = st.maxed ? `<button class="btn big" disabled>${n.free ? 'Every hero starts with this' : n.max > 1 ? 'All bought' : 'Owned'}</button>`
    : `<button class="btn big ${st.canBuy ? '' : 'poor'}" data-act="buynode:${n.id}">Buy ${gold(st.cost)}</button>`;
  return `<div class="nsheet"><span class="node ${n.kind} ${st.maxed ? 'owned' : st.met ? 'ready' : 'locked'} solo"><span class="nface">${n.kind === 'tier' ? roman(n.tier) : n.kind === 'slot' ? '<span class="gem" style="--g:#C9A7FF"></span>' : '<b>+</b>'}</span></span>
    <div><h2>${n.name}</h2><span class="muted">${kind}</span></div></div>
    <p class="ndesc">${n.desc}</p>${pips}
    <ul class="needs">${lvl}${needs}</ul>
    ${!st.met ? '' : ''}${btn}`;
}

function trinketSheet(heroId, slot) {
  const sv = save.heroes[heroId], cur = sv.trinkets[slot];
  const seen = new Set();
  const rows = save.trinkets.filter((t) => !seen.has(t) && seen.add(t)).map((tid) => {
    const t = P.trinketInfo(tid), n = save.trinkets.filter((x) => x === tid).length;
    return `<button class="trow" data-act="equip:${tid}">${tIcon(t)}<span><b>${t.name}${n > 1 ? ` ×${n}` : ''}</b><span class="muted">${t.desc}</span></span></button>`;
  }).join('');
  return `<h2>${cur ? 'Swap trinket' : 'Wear a trinket'}</h2>
    ${rows ? `<div class="plist">${rows}</div>` : '<p class="muted">The chest is empty. Trinkets are in the shop.</p>'}
    <div class="sheet-foot">${cur ? '<button class="btn" data-act="unequip">Take it off</button>' : ''}<button class="btn" data-act="tab:shop">Shop</button></div>`;
}

// Potions for one hero: toggle each kind in or out (two at most, one of a kind).
function potionSheet(heroId) {
  const mine = potionFor[heroId] || [];
  const taken = (p) => Object.entries(potionFor).reduce((a, [h, l]) => a + (h !== heroId && l.includes(p) ? 1 : 0), 0);
  const rows = Object.keys(P.POTIONS).map((p) => {
    const left = P.potionCount(save, p) - taken(p), on = mine.includes(p);
    if (left <= 0 && !on) return '';
    const P0 = P.POTIONS[p];
    return `<button class="trow pick ${on ? 'on' : ''}" data-act="givep:${p}">${pIcon(p)}<span><b>${P0.name}</b><span class="muted">${P0.desc}</span><span class="muted">${left - (on ? 1 : 0)} more in the bag</span></span><span class="tick">${on ? I.check : ''}</span></button>`;
  }).join('');
  return `<h2>Potions for ${HEROES[heroId].name}</h2><p class="muted">Two at most, one of each kind.</p>
    ${rows ? `<div class="plist">${rows}</div>` : '<p class="muted">The bag is empty. The shop sells potions.</p>'}
    <div class="sheet-foot"><button class="btn" data-act="closesheet">Done</button></div>`;
}

function settingsSheet() {
  const pick = (list, cur, act) => `<div class="looks">${list.map((l) => `<button class="lookbtn ${cur === l.id ? 'on' : ''}" data-act="${act}:${l.id}">
    <span class="swatch sw-${act}-${l.id}"><i></i><i></i><i></i></span><b>${l.name}</b><span class="muted">${l.blurb}</span></button>`).join('')}</div>`;
  return `<h2>Settings</h2>
    <h3 class="set-h">Camp look</h3>${pick(LOOKS, save.look || 'classic', 'look')}
    <h3 class="set-h">Skill tree look</h3>${pick(TREE_LOOKS, save.treeLook || 'classic', 'treelook')}
    <h3 class="set-h">Cheats</h3>
    <button class="merc-toggle cheat-toggle ${save.cheat ? 'on' : ''}" data-act="cheat"><span class="merc-text"><b>Unlimited gold and gems</b><span class="muted">Everything in the camp is free while it's on. Your real purse is kept for when you switch it off.</span></span><span class="switch"><i></i></span></button>
    <div class="sheet-foot"><button class="btn" data-act="closesheet">Done</button></div>`;
}

function beastSheet(kind) {
  const d = DEFS[kind], s = (save.seen || {})[kind] || { met: 0, beaten: 0 };
  const res = Object.entries(d.res || {}).filter(([, v]) => v !== 1);
  const word = { burn: 'fire', chill: 'cold', poison: 'poison', shock: 'lightning', wet: 'water' };
  return `<div class="bsheet"><span class="bpic big"><img src="${portrait(kind)}" alt=""></span><div><h2>${d.name}</h2><span class="muted">${d.boss ? 'Boss · ' : ''}${s.met} met · ${s.beaten} beaten</span></div></div>
    <p class="ndesc"><em>${beastFun(kind)}</em></p><p class="ndesc small">${beastHabit(kind)}</p>
    ${res.length ? `<div class="ip-chips">${res.map(([k, v]) => `<span class="${v < 1 ? 'res' : 'weak'}">${icon('status', k)}${v === 0 ? 'Immune to' : v < 1 ? 'Shrugs off' : 'Weak to'} ${word[k] || k}</span>`).join('')}</div>` : ''}
    <div class="sheet-foot"><button class="btn" data-act="closesheet">Close</button></div>`;
}

// ---------------------------------------------------------------- what taps do
function onClick(e) {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const [act, arg] = el.dataset.act.split(':');
  const ok = () => { persist(); render(); };
  const no = () => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  switch (act) {
    case 'tab': closeSheet(); tab = arg; sub = null; render(); mainEl.scrollTop = 0; break;
    case 'back': sub = null; render(); break;
    case 'slot': openSheet({ type: 'party', slot: +arg }); break;
    case 'pick': {
      const slot = sheet.slot, id = arg || null;
      if (id && P.recoverLeft(save, id)) { no(); return; }
      const party = save.party.slice();
      if (id) { const j = party.indexOf(id); if (j >= 0) party[j] = party[slot] || null; }
      party[slot] = id;
      save.party = party.filter(Boolean).slice(0, save.slots);
      closeSheet(); ok(); pop('.sitter:not(.empty), .seat-pick'); break;
    }
    case 'potion': openSheet({ type: 'potions', hero: arg }); break;
    case 'givep': {
      const h = sheet.hero, mine = potionFor[h] || (potionFor[h] = []), i = mine.indexOf(arg);
      const taken = Object.values(potionFor).reduce((a, l) => a + l.filter((p) => p === arg).length, 0);
      if (i >= 0) mine.splice(i, 1);
      else if (mine.length < P.CARRY_MAX && taken < P.potionCount(save, arg)) mine.push(arg);
      else { no(); return; }
      if (!mine.length) delete potionFor[h];
      render(); break;
    }
    case 'settings': openSheet({ type: 'settings' }); break;
    case 'look': save.look = arg; applyLook(); persist(); render(); break;
    case 'treelook': save.treeLook = arg; applyLook(); persist(); render(); break;
    case 'cheat': save.cheat = !save.cheat; persist(); render(); break;
    case 'book': bookTab = arg; render(); break;
    case 'beast': openSheet({ type: 'beast', kind: arg }); break;
    case 'upt': if (P.upgradeTrinket(save, arg)) { ok(); popGold(); } else no(); break;
    case 'mercs': save.mercs = !save.mercs; ok(); break;
    case 'setout': sub = { view: 'dungeons' }; render(); break;
    case 'enter': {
      const opts = P.runOptions(save, arg, potionFor);
      if (!opts.party.length && !opts.mercs) { no(); return; }
      P.payForRun(save, opts); save.theme = arg; potionFor = {};
      persist(); hideCamp();
      onSetOut(opts);
      break;
    }
    case 'hero': closeSheet(); sub = { view: 'hero', id: arg }; render(); break;
    case 'unlock': if (P.unlockHero(save, arg)) { ok(); pop('.big-art'); } else no(); break;
    case 'speed': if (P.speedUp(save, arg)) ok(); else no(); break;
    case 'node': openSheet({ type: 'node', hero: sub.id, node: arg }); break;
    case 'buynode': if (P.buyNode(save, sheet.hero, arg)) { ok(); pop(`[data-node="${arg}"]`); popGold(); } else no(); break;
    case 'tslot': openSheet({ type: 'trinket', hero: sub.id, slot: +arg }); break;
    case 'equip': if (P.equip(save, sheet.hero, arg, sheet.slot)) { closeSheet(); ok(); } else no(); break;
    case 'unequip': if (P.unequip(save, sheet.hero, sheet.slot)) { closeSheet(); ok(); } else no(); break;
    case 'buyt': if (P.buyTrinket(save, arg)) { ok(); popGold(); } else no(); break;
    case 'buyp': if (P.buyPotion(save, arg || 'heal')) { ok(); popGold(); } else no(); break;
    case 'buys': if (P.buySlot(save, arg)) { ok(); popGold(); } else no(); break;
    case 'closesheet': closeSheet(); break;
    case 'home': closeResult(); break;
  }
}
function pop(sel) { for (const el of mainEl.querySelectorAll(sel)) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } }
function popGold() { for (const el of root.querySelectorAll('.purse')) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } }

// Timers tick down in place; when one runs out, redraw so the hero is ready again.
function tick() {
  const now = Date.now(); let done = false;
  for (const el of document.querySelectorAll('#camp [data-until], #sheet [data-until]')) {
    const left = +el.dataset.until - now;
    if (left <= 0) done = true; else el.textContent = mmss(left);
  }
  if (done) render();
}

// ---------------------------------------------------------------- after a run
let resultDone = null;
const TITLES = { won: 'Dungeon cleared!', lost: 'The party fell', retreated: 'Back out safely' };
export function showResult(rep, done) {
  resultDone = done;
  const el = document.getElementById('result');
  const theme = THEMES[rep.theme];
  const heroes = rep.heroes.map((h, i) => {
    const H = HEROES[h.id];
    return `<div class="rhero" style="--d:${0.5 + i * 0.15}s"><img src="${H.art}" class="${h.downed ? 'down' : ''}" alt="">
      <span><b>${H.name}</b><span class="muted">Reached level ${h.level}${h.record ? ' · best yet' : ''}</span>
      ${h.feat ? `<span class="featline">${I.star} Feat: level ${FEAT_LEVEL}! Tier III and the second trinket slot can be bought.</span>` : ''}
      ${h.downed ? `<span class="restnote">Downed: resting ${restWords(P.RECOVER_DOWN)}</span>` : h.hurt ? `<span class="restnote">Badly hurt: resting ${restWords(P.RECOVER_HURT)}</span>` : ''}</span></div>`;
  }).join('');
  const found = rep.found.length ? `<div class="found">Found and used down there: ${rep.found.map((t) => P.trinketInfo(t).name).join(', ')}. Found trinkets stay in the dungeon.</div>` : '';
  el.innerHTML = `<div class="rcard ${rep.result}">
    <div class="rtitle"><h1>${TITLES[rep.result] || 'Run over'}</h1><span class="muted">${theme ? theme.name + ' · ' : ''}floor ${rep.floor}, ${rep.rooms} rooms, ${rep.kills} kills</span></div>
    <div class="loot">
      <div class="lootline big">${coin}<b class="count" data-to="${rep.gold}">0</b><span>gold kept</span></div>
      ${rep.mercCut ? `<div class="muted">The sellswords took ${rep.mercCut} of ${rep.raw}.</div>` : ''}
      ${rep.gems ? `<div class="lootline">${I.gem}<b>+${rep.gems}</b><span>${rep.gems === 1 ? 'gem' : 'gems'}${rep.firstClearGems ? ` (${rep.firstClearGems} for the first clear)` : ''}</span></div>` : ''}
    </div>
    ${heroes ? `<div class="rheroes">${heroes}</div>` : ''}
    ${found}
    <p class="muted">Levels stay in the dungeon; the gold and what it buys are yours.</p>
    <button class="btn big" data-act="home">Back to camp</button>
  </div>`;
  // the gold counts up
  const c = el.querySelector('.count'), to = rep.gold, t0 = performance.now();
  const step = (now) => { const k = Math.min(1, (now - t0 - 350) / 900); c.textContent = Math.round(to * Math.max(0, 1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const restWords = (ms) => { const m = ms / 60e3; return m === Math.floor(m) ? `${m} ${m === 1 ? 'minute' : 'minutes'}` : `${Math.floor(m)} and a half minutes`; };
function closeResult() { const d = resultDone; resultDone = null; if (d) d(); }
