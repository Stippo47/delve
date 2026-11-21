// The camp (round 9, docs/BUILD-v5.md lane U): a Nuclear Throne-style camp ground you look at, not a menu.
//   ground    the whole camp (camp-scene.js): the fire in the middle, the party on its seats, everyone else about the
//             clearing; the trader's cart, the book and the settings chest are things you tap
//   fire      zoomed on the fire: a list of everyone you have; pick one, then a seat (it swaps with whoever is there);
//             potions handed out; "Delve" in the flames opens the map
//   map       the trail (camp-map.js): a clearing at the bottom, a path up through each dungeon's biome; tap a floor
//             start you can reach, then Set out
//   focus     a hero (or the trader, the book, the settings) in the top third; their panel in the lower two thirds:
//             Gear / Skills (the web) / About for a hero
// Plain DOM panels over one canvas, redrawn from the save after every action; one click handler reads data-act.
// Rules live in progress.js, read through meta.js; the trader's stock in stock.js.
import { HEROES, HERO_IDS, STATS } from './heroes.js';
import * as P from './progress.js';
import * as M from './meta.js';
import * as STOCK from './stock.js';
import { writeSave } from './save.js';
import { icon } from './icons.js';
import { DEFS } from './units.js';
import { beastFun, beastHabit, trinketFun, POTION_FUN, STATUSES } from './bestiary.js';
import { portrait } from './inspect.js';
import { ENV_STYLES, envId, setEnv } from './env.js';
import { soundSettingsHtml } from './audio.js';
import { cue } from './sfx.js';
import { I, coin, gold, ROLE, ROLE_COL, roman, mmss, face } from './ui-kit.js';
import { mountTree, setShowAll, showAll } from './skilltree.js';
import { makeScene } from './camp-scene.js';
import { makeMap } from './camp-map.js';
import * as LOOKS from './looks.js';
import { resultStats, wireStats, numbersRow, lifetime, foeCount, num } from './stats-ui.js';
import { heroNumbers as probeNumbers } from './numbers.js';

// ---------------------------------------------------------------- dungeons (themes)
export let THEMES = {};
export async function loadThemes() {
  try { const m = await import('./themes.js'); if (m.THEMES) THEMES = m.THEMES; } catch (e) { /* the camp still opens */ }
  await LOOKS.loadLooks();
}

// ---------------------------------------------------------------- state
let onConvoy = null; // lane C (convoy): the wagon at the camp's edge
let save = null, onSetOut = null, onBattle = null, root = null, topEl = null, panelEl = null, sheetEl = null, hintEl = null;
let scene = null, map = null;
let mode = 'ground';        // ground | fire | map | hero | trader | book | settings
let heroId = null, sub = 'skills', heroFrom = 'ground';
let pickHero = null;        // picked in the fire's list, waiting for a seat
let mapPick = null;         // { theme, floor } picked on the trail
let sheet = null;
let potionFor = {};         // { heroId: [potionId...] } handed out for the next run
let bookTab = 'beasts';
let treeSel = {};
let tree = null;
let ticker = 0;

export function initCamp(opts) {
  save = opts.save; onSetOut = opts.onSetOut; onBattle = opts.onBattle || null; onConvoy = opts.onConvoy || null;
  root = document.getElementById('camp');
  topEl = document.getElementById('campTop');
  panelEl = document.getElementById('campPanel');
  hintEl = document.getElementById('campHint');
  sheetEl = document.getElementById('sheet');
  root.addEventListener('click', onClick);
  sheetEl.addEventListener('click', onClick);
  document.getElementById('result').addEventListener('click', onClick);
  map = makeMap({ save: () => save, themes: () => THEMES });
  scene = makeScene(document.getElementById('campCanvas'), { save: () => save, onTap: onScene, map });
  window.CAMP = { scene, map, setMode: (m, o) => go(m, o), get mode() { return mode; } }; // for the test tools
}
export function setSave(s) { save = s; }

export function showCamp() {
  sheet = null; closeSheet();
  if (mode === 'map' || !mode) mode = 'ground';
  scene.start(); scene.sync();
  render();
  clearInterval(ticker); ticker = setInterval(tick, 1000);
}
export function hideCamp() { clearInterval(ticker); closeSheet(); if (scene) scene.stop(); }
function persist() { writeSave(save); }

// ---------------------------------------------------------------- the frame
function go(m, o = {}) {
  mode = m;
  if (m === 'hero') { heroId = o.id; sub = o.sub || (save.heroes[o.id].owned ? 'skills' : 'about'); heroFrom = o.from || 'ground'; }
  if (m === 'map') { mapPick = null; map.setPick(null); }
  if (m !== 'fire') pickHero = null;
  closeSheet();
  render();
  if (m === 'map') { const r = root.getBoundingClientRect(); map.open(r.width, r.height); }
}
function render() {
  root.dataset.mode = mode;
  root.classList.toggle('cheat', !!save.cheat);
  const focus = mode === 'hero' ? { type: 'hero', id: heroId } : ['trader', 'book', 'settings'].includes(mode) ? { type: mode } : null;
  scene.setMode(mode === 'hero' || focus ? 'focus' : mode, { focus, pick: pickHero });
  scene.sync();
  const out = ({ ground: groundView, fire: fireView, map: mapView, hero: heroView, trader: traderView, book: bookView, settings: settingsView }[mode] || groundView)();
  topEl.innerHTML = (mode === 'ground' ? '' : `<button class="top-back" data-act="back" aria-label="back">${I.back}</button>`)
    + `<div class="top-mid">${out.title ? `<h1 class="top-title sm">${out.title}</h1>` : ''}${out.sub || ''}</div>${purse()}`;
  panelEl.className = out.cls || '';
  panelEl.innerHTML = out.html || '';
  panelEl.classList.toggle('hidden', !out.html);
  hintEl.classList.toggle('hidden', mode !== 'ground');
  if (out.after) out.after();
  if (sheet) renderSheet();
}
const purse = () => `<div class="purses"><span class="pill purse">${coin}<b id="cGold">${save.cheat ? '∞' : save.gold}</b></span>${typeof save.gems === 'number' ? `<span class="pill purse gems"><i class="gem"></i><b>${save.gems}</b></span>` : ''}</div>`;

// what the canvas says was tapped
function onScene(h) {
  switch (h.type) {
    case 'fire': cue('tap'); go('fire'); break;
    case 'hero': cue('tap'); go('hero', { id: h.id }); break;
    case 'trader': case 'book': case 'settings': cue('tap'); go(h.type); break;
    case 'delve': cue('tap'); go('map'); break;
    case 'battle': cue('tap'); if (onBattle) onBattle(); break; // the sparring ring: battle mode (battle-ui.js)
    case 'wagon': cue('tap'); if (onConvoy) onConvoy(); break; // lane C: the wagon (convoy-ui.js)
    case 'seat': seatTap(h.i, h.open); break;
    case 'back': back(); break;
    case 'mapfloor': mapPick = { theme: h.theme, floor: h.floor }; map.setPick({ t: h.theme, f: h.floor }); cue('tap'); render(); break;
    case 'maplocked': cue('deny'); toast(M.dungeonOpen(save, h.theme) ? `Reach floor ${h.floor} once to start there.` : M.dungeonLockText(h.theme) + ' to open it.'); break;
    case 'mapnone': if (mapPick) { mapPick = null; map.setPick(null); render(); } break;
  }
}
function back() {
  cue('tap');
  if (mode === 'map') return go('fire');
  if (mode === 'hero' && heroFrom === 'fire') return go('fire');
  go('ground');
}

// ================================================================ ground: only a hint, the scene is the screen
function groundView() { return { html: '' }; }

// ================================================================ fire: the party pick
function fireView() {
  const n = M.slots(save), now = Date.now();
  const owned = HERO_IDS.filter((id) => save.heroes[id].owned);
  const others = HERO_IDS.filter((id) => !save.heroes[id].owned).sort((a, b) => M.heroPrice(a) - M.heroPrice(b));
  const tiles = owned.map((id) => {
    const h = HEROES[id], seat = save.party.indexOf(id), left = P.recoverLeft(save, id, now), p = M.points(save, id);
    return `<div role="button" class="rtile ${id === pickHero ? 'on' : ''} ${seat >= 0 ? 'seated' : ''} ${left ? 'resting' : ''}" data-act="pickh:${id}">
      <span class="rt-face">${face(id, 54)}<span class="lvl">${M.level(save, id)}</span>${seat >= 0 ? `<span class="rt-seat">${I.fire}</span>` : ''}${p > 0 && p !== Infinity ? '<span class="rt-pts"></span>' : ''}
        ${left ? `<span class="rt-timer" data-until="${save.heroes[id].recoverUntil}">${mmss(left)}</span>` : ''}</span>
      <b>${h.name}</b></div>`;
  }).join('');
  const recruits = others.map((id) => `<div role="button" class="rtile locked" data-act="recruitpage:${id}"><span class="rt-face">${face(id, 54)}</span><b>${HEROES[id].name}</b><span class="rt-price">${gold(M.heroPrice(id))}</span></div>`).join('');
  const bag = Object.values(potionFor).reduce((a, l) => a + l.length, 0);
  const say = pickHero ? `Now tap a seat for <b>${HEROES[pickHero].name}</b>${save.party.includes(pickHero) ? ', or its own seat to stand up' : ''}.` : 'Pick a hero, then a seat. Tap the flames to set out.';
  const html = `<div class="pp-head"><div class="pp-title"><h2>The party <span class="quiet">${save.party.length}/${n}</span></h2><p class="quiet small">${say}</p></div>
      <button class="potbtn" data-act="pack" aria-label="potions">${I.flask}<span>Potions</span>${bag ? `<i class="badge">${bag}</i>` : ''}</button></div>
    <div class="pp-body">
      <div class="roster">${tiles}</div>
      <div class="rowbtn mercs ${save.mercs ? 'on' : ''}" role="button" data-act="mercs"><div><b>Sellswords</b><span class="quiet small">Two hired hands come along and take half the gold.</span></div><span class="switch"><i></i></span></div>
      ${recruits ? `<div class="sec-h"><span class="cap">Not with you yet</span><span class="quiet small">recruit for gold</span></div><div class="roster">${recruits}</div>` : ''}
    </div>`;
  return { title: 'The fire', html, cls: 'p-fire' };
}
function seatTap(i, open) {
  if (!open) { cue('deny'); toast((M.nextSlotHint(save) || 'All seats are open') + ' to open another seat.'); return; }
  const cur = save.party[i];
  if (!pickHero) {
    if (cur) { pickHero = cur; cue('tap'); render(); toast(`Tap another seat to move ${HEROES[cur].name}.`); }
    else { cue('deny'); toast('Pick a hero from the list first.'); }
    return;
  }
  const id = pickHero;
  if (P.recoverLeft(save, id)) { cue('deny'); toast(`${HEROES[id].name} is resting.`); return; }
  const party = save.party.slice(), j = party.indexOf(id);
  if (j === i) { party.splice(i, 1); delete potionFor[id]; }          // its own seat: stand up
  else if (j >= 0) { party[j] = party[i]; party[i] = id; }             // swap seats
  else { if (party[i]) delete potionFor[party[i]]; party[i] = id; }    // sit; whoever was there stands up
  save.party = party.filter(Boolean).slice(0, M.slots(save));
  pickHero = null; cue('tap'); persist(); render();
}

// ================================================================ map: set out
function mapView() {
  if (!mapPick) return { title: 'The trail', sub: '<span class="quiet small top-sub">Tap a floor you\'ve reached to start there</span>', html: '' };
  const th = THEMES[mapPick.theme], f = mapPick.floor, ready = save.party.filter((id) => P.canGo(save, id));
  const can = ready.length || save.mercs;
  const what = f < M.FLOORS ? `${M.ROOMS} rooms, then a mini-boss` : `${M.ROOMS} rooms, then the boss`;
  const faces = ready.map((id) => face(id, 34)).join('') + (save.mercs ? `<span class="merc-chip">+2</span>` : '');
  const html = `<div class="go-row"><div class="go-text"><span class="cap">${th ? th.name : ''}</span><b>Floor ${f}</b><span class="quiet small">${what}</span></div>
      <div class="go-faces">${faces || '<span class="quiet small">Nobody seated</span>'}</div></div>
    <button class="btn primary wide setout ${can ? '' : 'off'}" data-act="enter">${can ? 'Set out' : 'Seat a hero at the fire first'}</button>`;
  return { title: 'The trail', html, cls: 'p-go' };
}

// ================================================================ a hero, zoomed
function heroView() {
  const id = heroId, h = HEROES[id], sv = save.heroes[id], lv = M.level(save, id), need = M.xpNeed(lv), x = M.xp(save, id);
  const inParty = save.party.includes(id), left = sv.owned && P.recoverLeft(save, id);
  const partyBtn = !sv.owned ? '' : inParty ? `<span class="chip on">${I.fire}<span>At the fire</span></span>`
    : left ? `<span class="chip rest">${I.moon}<span data-until="${sv.recoverUntil}">${mmss(left)}</span></span>`
    : `<button class="chip" data-act="sit:${id}">${I.plus}<span>Sit at the fire</span></button>`;
  const head = `<div class="hhead" style="--rc:${ROLE_COL[h.role]}">
      <div class="hh-mid"><span class="cap" style="color:${ROLE_COL[h.role]}">${ROLE[h.role]}</span>
        <div class="xpline"><span class="lvl">${lv}</span><div class="bar xp"><i style="width:${sv.owned ? Math.min(100, 100 * x / need) : 0}%"></i><em>${sv.owned ? `${Math.floor(x)}/${need}` : 'not recruited'}</em></div></div></div>
      ${partyBtn}</div>
    <div class="seg hseg">${[['gear', 'Gear'], ['skills', 'Skills'], ['about', 'About']].map(([k, n]) => `<button class="${sub === k ? 'on' : ''}" data-act="sub:${k}">${n}</button>`).join('')}</div>`;
  let body = '', after = null;
  if (sub === 'skills') {
    body = `<div class="treehost" id="treehost"></div>`;
    after = () => {
      tree = mountTree(document.getElementById('treehost'), {
        save, id, sel: treeSel[id],
        onSelect: (n) => { treeSel[id] = n; },
        onLearn: (n) => { if (M.learn(save, id, n)) { cue('buy'); persist(); tree.refresh(save, n); } else cue('deny'); },
        onDeny: () => cue('deny'),
      });
    };
  } else body = `<div class="pp-body">${sub === 'gear' ? gearView(id) : aboutView(id)}</div>`;
  const recruit = sv.owned ? '' : `<div class="pp-foot"><button class="btn primary wide recruit ${M.afford(save, M.heroPrice(id)) ? '' : 'off'}" data-act="recruit:${id}">Recruit ${h.name} · ${gold(M.heroPrice(id))}</button></div>`;
  return { title: h.name, html: head + body + recruit, cls: 'p-focus p-hero sub-' + sub, after };
}

function gearView(id) {
  const sv = save.heroes[id], n = P.trinketSlots(save, id);
  const slots = Array.from({ length: Math.max(2, n) }, (_, k) => {
    if (k >= n) return `<div class="gslot locked"><span class="gs-ico">${I.lock}</span><div><b>Second slot</b><span class="quiet small">Learn it in the skill web.</span></div></div>`;
    const tid = sv.trinkets[k], t = tid && P.trinketInfo(tid);
    if (!t) return `<div role="button" class="gslot empty" data-act="tslot:${k}"><span class="gs-ico">${I.plus}</span><div><b>Empty</b><span class="quiet small">Tap to wear a trinket.</span></div></div>`;
    const lv = P.trinketLevel(save, tid);
    return `<div role="button" class="gslot" data-act="tslot:${k}" style="--rar:${P.RARITY[t.rarity].color}"><span class="gs-ico t">${icon('trinket', tid, '', t.color)}</span>
      <div><b>${t.name} <span class="tlv">${roman(lv)}</span></b><span class="quiet small">${t.desc}</span></div></div>`;
  }).join('');
  const spare = [...new Set(save.trinkets)];
  return `<div class="sec-h first"><span class="cap">Worn</span><span class="quiet small">${n} ${n === 1 ? 'slot' : 'slots'}</span></div>${slots}
    <div class="sec-h"><span class="cap">In the chest</span><span class="quiet small">${save.trinkets.length}</span></div>
    ${spare.length ? `<div class="chest">${spare.map((t) => `<span class="chest-it" style="--rar:${P.RARITY[P.trinketInfo(t).rarity].color}">${icon('trinket', t, '', P.trinketInfo(t).color)}${save.trinkets.filter((x) => x === t).length > 1 ? `<i>${save.trinkets.filter((x) => x === t).length}</i>` : ''}</span>`).join('')}</div>`
      : `<p class="quiet small empty-note">Nothing spare. The trader sells trinkets.</p>`}`;
}

function aboutView(id) {
  const h = HEROES[id];
  const row = (ico, cap, name, desc, extra = '') => `<div class="krow">${ico}<div><span class="cap">${cap}</span><b>${name}</b><p>${desc}</p>${extra}</div></div>`;
  const sum = webSummary(id);
  return `<p class="blurb">${h.blurb}</p>${h.fun ? `<p class="quiet small fun">${h.fun}</p>` : ''}
    <div class="sec-h"><span class="cap">In a fight</span><span class="quiet small">with its web and trinkets</span></div>${numbersRow(heroNumbers(id))}
    ${sum ? `<div class="sec-h"><span class="cap">From the skill web</span>${P.respecPrice ? `<button class="linkbtn" data-act="respec:${id}">Unlearn all · ${gold(P.respecPrice(save, id))}</button>` : ''}</div>
      <div class="sumchips">${sum}</div><div class="sec-h"><span class="cap">Kit</span></div>` : ''}
    ${row(`<span class="k-ico">${I.sword}</span>`, 'Attack', h.attack.name, h.attack.desc)}
    ${h.abilities.map((ab, i) => row(`<span class="k-ico ab">${icon('ability', ab.id)}</span>`, `Ability ${i + 1} · ${ab.cd}s`, ab.name, ab.desc,
      `<ol class="tiers">${ab.tiers.map((t, k) => `<li class="${M.rank(save, id, `${ab.id}${k + 1}`) ? 'got' : ''}"><i>${roman(k + 1)}</i>${t}</li>`).join('')}</ol>`)).join('')}
    ${row(`<span class="k-ico">${I.crown}</span>`, 'Trait', h.trait.name, h.trait.desc)}
    <div class="sec-h"><span class="cap">All runs</span></div>${lifetime(save, id)}`;
}
// The hero's real numbers: the hero as it would walk into a room, read the way the sim reads them (numbers.js).
function heroNumbers(id) {
  try {
    const list = (save.heroes[id].trinkets || []).map((t) => { const lv = P.trinketLevel(save, t); return lv > 1 ? { id: t, lv } : t; });
    return probeNumbers(save, id, list);
  } catch (e) { return null; }
}

// What the hero's learned nodes add up to, as chips ("+16% damage").
function webSummary(id) {
  if (!P.heroStats || !STATS) return '';
  const s = P.heroStats(save, id), pct = (f) => Math.round(f * 100), chips = [];
  for (const [k, v] of Object.entries(s)) if (k !== 'ab' && v > 0 && STATS[k]) chips.push(STATS[k].line(pct(v)));
  for (const [ab, o] of Object.entries(s.ab || {})) {
    const name = (HEROES[id].abilities.find((a) => a.id === ab) || {}).name || ab;
    for (const [k, v] of Object.entries(o)) if (v > 0 && STATS[k]) chips.push(STATS[k].line(pct(v), name));
  }
  return chips.map((c) => `<span>${c}</span>`).join('');
}

// ================================================================ the trader: a few things, new after every mission
function traderView() {
  const s = STOCK.stock(save); persist();
  const have = (tid) => save.trinkets.filter((x) => x === tid).length + HERO_IDS.filter((h) => save.heroes[h].trinkets.includes(tid)).length;
  const wares = s.items.map((it, i) => {
    const sold = it.left <= 0;
    if (it.k === 't') {
      const t = P.trinketInfo(it.id), n = have(it.id);
      return `<div role="button" class="ware ${sold ? 'sold' : ''}" data-act="ware:t:${it.id}" style="--rar:${P.RARITY[t.rarity].color};--d:${i * 0.03}s">
        <span class="w-ico">${icon('trinket', it.id, '', t.color)}${n ? `<i class="w-n">${n}</i>` : ''}</span>
        <b>${t.name}</b><span class="rar small" style="color:${P.RARITY[t.rarity].color}">${P.RARITY[t.rarity].name}</span>
        <span class="w-price ${sold || !P.afford(save, 'gold', t.price) ? 'poor' : ''}">${sold ? '<span class="quiet">Sold</span>' : gold(t.price)}</span></div>`;
    }
    const p = P.POTIONS[it.id], n = P.potionCount(save, it.id), full = n >= P.POTION_MAX;
    return `<div role="button" class="ware pot ${sold ? 'sold' : ''}" data-act="ware:p:${it.id}" style="--rar:${p.color};--d:${i * 0.03}s"><span class="w-ico">${icon('potion', it.id)}${n ? `<i class="w-n">${n}</i>` : ''}</span>
      <b>${p.name}</b><span class="quiet small">${sold ? 'none left' : it.left + ' for sale'}</span>
      <span class="w-price ${sold || full || !P.afford(save, 'gold', p.price) ? 'poor' : ''}">${sold ? '<span class="quiet">Sold</span>' : full ? '<span class="quiet">Bag full</span>' : gold(p.price)}</span></div>`;
  }).join('');
  const html = `<div class="pp-head"><div class="pp-title"><h2>Today's stock</h2><p class="quiet small">New wares after every mission.</p></div></div>
    <div class="pp-body"><div class="wgrid">${wares}</div>
    <p class="quiet small foot-note">Level up a trinket you own from the hero who wears it (Gear). Potions are handed out at the fire.</p></div>`;
  return { title: 'Trader', html, cls: 'p-focus p-list' };
}

// ================================================================ the book
function bookView() {
  const kinds = Object.keys(DEFS).filter((k) => DEFS[k].team === 'enemy' && k !== 'boss' && k !== 'skeleton');
  const seen = save.seen || {};
  const metN = kinds.filter((k) => (seen[k] && seen[k].met) || (foeCount(save, k) || {}).n).length; // defeated counts as met (stats.js tally)
  const segs = `<div class="seg"><button class="${bookTab === 'beasts' ? 'on' : ''}" data-act="booktab:beasts">Monsters ${metN}/${kinds.length}</button><button class="${bookTab === 'items' ? 'on' : ''}" data-act="booktab:items">Items</button><button class="${bookTab === 'status' ? 'on' : ''}" data-act="booktab:status">Statuses</button></div>`;
  let body = '';
  if (bookTab === 'beasts') {
    body = `<div class="bgrid">${kinds.map((k) => {
      const s = seen[k], d = DEFS[k], fc = foeCount(save, k), met = (s && s.met) || (fc && fc.n);
      return `<div role="button" class="beast ${met ? '' : 'unknown'} ${d.boss ? 'boss' : ''}" ${met ? `data-act="beast:${k}"` : ''}><span class="b-pic"><img src="${portrait(k)}" alt=""></span>${met && fc && fc.n ? `<i class="b-n">${num(fc.n)}</i>` : ''}<b>${met ? d.name : '???'}</b></div>`;
    }).join('')}</div>`;
  } else if (bookTab === 'items') {
    body = `<div class="entries">${P.shopTrinkets().map((t) => `<div class="entry" style="--rar:${P.RARITY[t.rarity].color}"><span class="e-ico">${icon('trinket', t.id, '', t.color)}</span><div><b>${t.name}</b><p>${t.desc}</p><em>${trinketFun(t.id)}</em></div></div>`).join('')
      + Object.keys(P.POTIONS).map((id) => { const p = P.POTIONS[id]; return `<div class="entry" style="--rar:${p.color}"><span class="e-ico">${icon('potion', id)}</span><div><b>${p.name}</b><p>${p.desc}</p><em>${POTION_FUN[id] || ''}</em></div></div>`; }).join('')}</div>`;
  } else {
    body = `<div class="entries">${Object.entries(STATUSES).map(([k, s]) => `<div class="entry"><span class="e-ico">${icon('status', k)}</span><div><b>${s.name}</b><p>${s.desc}</p></div></div>`).join('')}</div>`;
  }
  return { title: 'Book', html: `<div class="pp-head">${segs}</div><div class="pp-body">${body}</div>`, cls: 'p-focus p-list' };
}

// ================================================================ settings
function settingsView() {
  const looks = (list, cur, act, swatch) => `<div class="looks">${list.map((l) => `<button class="look ${String(cur) === String(l.id) ? 'on' : ''}" data-act="${act}:${l.id}">
    <span class="lk-sw">${swatch(l)}</span><b>${l.name}</b><span class="quiet small">${l.blurb || ''}</span></button>`).join('')}</div>`;
  const envSw = (l) => `<i style="background:${['#B9B5B2', '#C7C1B4', '#6A6070', '#B8A890'][l.id - 1]}"></i><i style="background:${['#8E8D96', '#9C9488', '#2E2836', '#8E7860'][l.id - 1]}"></i>`;
  const html = `<div class="pp-body settings">
    <section class="group">${soundSettingsHtml()}</section>
    <section class="group"><h3 class="cap">Dungeon look</h3>${looks(ENV_STYLES, envId(), 'env', envSw)}</section>
    <section class="group"><h3 class="cap">Puddles and spills</h3>${looks(LOOKS.puddleStyles(), LOOKS.puddleStyle(), 'puddle', LOOKS.puddleSwatch)}</section>
    <section class="group"><h3 class="cap">Enemy health, once hurt</h3>${looks(LOOKS.hpStyles(), LOOKS.hpStyle(), 'hpstyle', LOOKS.hpSwatch)}</section>
    <section class="group"><h3 class="cap">Cheats</h3>
      <div role="button" class="rowbtn ${save.cheat ? 'on' : ''}" data-act="cheat"><div><b>Unlimited gold and points</b><span class="quiet small">Everything is free while it's on. Your real purse is kept for when you switch it off.</span></div><span class="switch"><i></i></span></div>
      <div role="button" class="rowbtn ${showAll() ? 'on' : ''}" data-act="webAll"><div><b>Show the whole skill web</b><span class="quiet small">Dev: every node, even ones far from what a hero knows.</span></div><span class="switch"><i></i></span></div></section>
    <p class="faint small version">Delve · camp ground (round 9)</p></div>`;
  return { title: 'Settings', html, cls: 'p-focus p-list' };
}

// ================================================================ sheets
function openSheet(s) { sheet = s; renderSheet(); }
function closeSheet() { sheet = null; if (sheetEl) { sheetEl.classList.add('hidden'); sheetEl.innerHTML = ''; } }
function renderSheet() {
  const body = { pack: packSheet, trinket: trinketSheet, ware: wareSheet, beast: beastSheet, respec: respecSheet }[sheet.type]();
  const was = !sheetEl.classList.contains('hidden');
  sheetEl.innerHTML = `<div class="backdrop" data-act="closesheet"></div><div class="panel ${was ? '' : 'rise'}"><span class="grip"></span>${body}</div>`;
  sheetEl.classList.remove('hidden');
}

// Packing: the party along the top, each with two pockets; the bag below. Tap a potion to hand it over.
function packSheet() {
  const party = save.party.filter((id) => P.canGo(save, id));
  if (!party.length) return `<div class="sheet-h"><h2>Hand out potions</h2></div><p class="sheet-p quiet">Nobody at the fire is ready to go.</p>`;
  if (!party.includes(sheet.hero)) sheet.hero = party[0];
  const who = sheet.hero, mine = potionFor[who] || [];
  const heroes = party.map((id) => {
    const l = potionFor[id] || [];
    return `<div role="button" class="packhero ${id === who ? 'on' : ''}" data-act="packhero:${id}">${face(id, 48)}<span class="pk">${Array.from({ length: P.CARRY_MAX }, (_, k) => `<i class="pocket ${l[k] ? 'full' : ''}">${l[k] ? icon('potion', l[k]) : ''}</i>`).join('')}</span></div>`;
  }).join('');
  const handed = (p) => Object.values(potionFor).reduce((a, l) => a + l.filter((x) => x === p).length, 0);
  const bag = Object.keys(P.POTIONS).filter((p) => P.potionCount(save, p) > 0).map((p) => {
    const left = P.potionCount(save, p) - handed(p), has = mine.includes(p);
    const can = has || (left > 0 && mine.length < P.CARRY_MAX);
    return `<div role="button" class="bagpot ${has ? 'has' : ''} ${can ? '' : 'dim'}" data-act="${has ? 'takep' : 'givep'}:${p}">${icon('potion', p)}<b>${P.POTIONS[p].name}</b><span class="quiet small">${has ? 'packed' : left + ' left'}</span></div>`;
  }).join('');
  return `<div class="sheet-h"><h2>Hand out potions</h2></div><div class="packheroes">${heroes}</div>
    <p class="cap pk-for">For ${HEROES[who].name}: two at most, one of each</p>
    ${bag ? `<div class="bag">${bag}</div>` : '<p class="sheet-p quiet">The bag is empty. The trader sells potions.</p>'}
    <div class="sheet-actions"><button class="btn primary" data-act="closesheet">Done</button></div>`;
}

function trinketSheet() {
  const sv = save.heroes[sheet.hero], cur = sv.trinkets[sheet.slot];
  const rows = [...new Set(save.trinkets)].map((tid) => {
    const t = P.trinketInfo(tid), n = save.trinkets.filter((x) => x === tid).length;
    return `<div role="button" class="prow" data-act="equip:${tid}"><span class="e-ico" style="--rar:${P.RARITY[t.rarity].color}">${icon('trinket', tid, '', t.color)}</span><div><b>${t.name}${n > 1 ? ` ×${n}` : ''} <span class="tlv">${roman(P.trinketLevel(save, tid))}</span></b><span class="quiet small">${t.desc}</span></div></div>`;
  }).join('');
  const up = cur ? P.upgradePrice(save, cur) : null;
  return `<div class="sheet-h"><h2>${cur ? P.trinketInfo(cur).name + ' <span class="tlv">' + roman(P.trinketLevel(save, cur)) + '</span>' : 'Wear a trinket'}</h2></div>
    ${cur ? `<p class="sheet-p">${P.trinketInfo(cur).desc}</p>` : ''}
    ${cur && up != null ? `<button class="btn primary wide ${P.afford(save, 'gold', up) ? '' : 'off'}" data-act="upt:${cur}">Level ${roman(P.trinketLevel(save, cur) + 1)} · ${gold(up)}</button>` : ''}
    ${rows ? `${cur ? '<div class="sec-h"><span class="cap">Swap for</span></div>' : ''}<div class="plist">${rows}</div>` : cur ? '' : '<p class="sheet-p quiet">The chest is empty. The trader sells trinkets.</p>'}
    <div class="sheet-actions">${cur ? '<button class="btn ghost" data-act="unequip">Take it off</button>' : ''}</div>`;
}

function wareSheet() {
  const { kind, id } = sheet, it = STOCK.itemOf(save, kind, id), sold = !it || it.left <= 0;
  if (kind === 'p') {
    const p = P.POTIONS[id], n = P.potionCount(save, id), full = n >= P.POTION_MAX;
    return `<div class="sheet-h"><span class="big-ico">${icon('potion', id)}</span><div><h2>${p.name}</h2><span class="quiet small">${n} of ${P.POTION_MAX} in the bag · ${sold ? 'none' : it.left} for sale</span></div></div>
      <p class="sheet-p">${p.desc}</p><p class="sheet-fun">${POTION_FUN[id] || ''}</p>
      <button class="btn primary wide ${!sold && P.afford(save, 'gold', p.price) && !full ? '' : 'off'}" data-act="buyp:${id}">${sold ? 'Sold out until the next mission' : full ? 'The bag is full' : `Buy · ${gold(p.price)}`}</button>`;
  }
  const t = P.trinketInfo(id), r = P.RARITY[t.rarity];
  const n = save.trinkets.filter((x) => x === id).length, worn = HERO_IDS.filter((h) => save.heroes[h].trinkets.includes(id)).map((h) => HEROES[h].name);
  return `<div class="sheet-h"><span class="big-ico" style="--rar:${r.color}">${icon('trinket', id, '', t.color)}</span><div><h2>${t.name}</h2><span class="rar" style="color:${r.color}">${r.name}</span></div></div>
    <p class="sheet-p">${t.desc}</p><p class="sheet-fun">${trinketFun(id)}</p>
    ${n + worn.length ? `<p class="quiet small">You have ${n ? `${n} in the chest` : ''}${n && worn.length ? ' · ' : ''}${worn.length ? 'worn by ' + worn.join(', ') : ''}</p>` : ''}
    <div class="sheet-actions"><button class="btn primary ${!sold && P.afford(save, 'gold', t.price) ? '' : 'off'}" data-act="buyt:${id}">${sold ? 'Sold' : `Buy${n + worn.length ? ' another' : ''} · ${gold(t.price)}`}</button></div>`;
}

function respecSheet() {
  const id = sheet.hero, n = P.spentPoints(save, id), price = P.respecPrice(save, id);
  return `<div class="sheet-h"><h2>Unlearn ${HEROES[id].name}'s web?</h2></div>
    <p class="sheet-p">Every node goes, and all ${n} ${n === 1 ? 'point comes' : 'points come'} back to spend again.</p>
    <div class="sheet-actions"><button class="btn ghost" data-act="closesheet">Keep it</button><button class="btn primary ${M.afford(save, price) ? '' : 'off'}" data-act="respec:${id}">Unlearn · ${gold(price)}</button></div>`;
}

function beastSheet() {
  const k = sheet.kind, d = DEFS[k], s = (save.seen || {})[k] || { met: 0, beaten: 0 }, fc = foeCount(save, k);
  const tally = fc && fc.n ? `<p class="sheet-p tallyline">${num(fc.n)} defeated in all${[fc.elite ? `${num(fc.elite)} elite` : '', fc.mini ? `${num(fc.mini)} as a mini-boss` : '', fc.boss ? `${num(fc.boss)} as the boss` : ''].filter(Boolean).map((x) => ' · ' + x).join('')}</p>` : '';
  const res = Object.entries(d.res || {}).filter(([, v]) => v !== 1);
  const word = { burn: 'fire', chill: 'cold', poison: 'poison', shock: 'lightning', wet: 'water' };
  return `<div class="sheet-h"><span class="big-ico b-pic"><img src="${portrait(k)}" alt=""></span><div><h2>${d.name}</h2><span class="quiet small">${d.boss ? 'Boss · ' : ''}${s.met} met · ${s.beaten} beaten</span></div></div>
    ${tally}<p class="sheet-fun">${beastFun(k)}</p><p class="sheet-p">${beastHabit(k)}</p>
    ${res.length ? `<div class="reschips">${res.map(([key, v]) => `<span class="${v < 1 ? 'res' : 'weak'}">${icon('status', key)}${v === 0 ? 'Immune to' : v < 1 ? 'Shrugs off' : 'Weak to'} ${word[key] || key}</span>`).join('')}</div>` : ''}`;
}

function toast(text) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

// ================================================================ taps
function onClick(e) {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const [act, arg, arg2] = el.dataset.act.split(':');
  const ok = () => { persist(); render(); };
  const no = () => { cue('deny'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  switch (act) {
    case 'back': back(); break;
    case 'sub': sub = arg; cue('tap'); render(); break;
    case 'pickh': {
      if (P.recoverLeft(save, arg)) { no(); toast(`${HEROES[arg].name} is resting.`); return; }
      pickHero = pickHero === arg ? null : arg; cue('tap'); render(); break;
    }
    case 'recruitpage': cue('tap'); go('hero', { id: arg, from: 'fire' }); break;
    case 'sit': {
      if (P.recoverLeft(save, arg)) { no(); toast(`${HEROES[arg].name} is resting.`); return; }
      if (save.party.length >= M.slots(save)) { no(); toast('Every seat is taken. Swap someone at the fire.'); return; }
      save.party = [...save.party, arg]; cue('tap'); ok(); break;
    }
    case 'mercs': save.mercs = !save.mercs; cue('tap'); ok(); break;
    case 'pack': openSheet({ type: 'pack', hero: save.party[0] }); break;
    case 'packhero': sheet.hero = arg; renderSheet(); break;
    case 'givep': {
      const h = sheet.hero, mine = potionFor[h] || (potionFor[h] = []);
      const taken = Object.values(potionFor).reduce((a, l) => a + l.filter((p) => p === arg).length, 0);
      if (!mine.includes(arg) && mine.length < P.CARRY_MAX && taken < P.potionCount(save, arg)) { mine.push(arg); cue('tap'); render(); }
      else { if (!mine.length) delete potionFor[h]; no(); }
      break;
    }
    case 'takep': { const h = sheet.hero, mine = potionFor[h] || [], i = mine.indexOf(arg); if (i >= 0) mine.splice(i, 1); if (!mine.length) delete potionFor[h]; cue('tap'); render(); break; }
    case 'enter': {
      if (!mapPick) return;
      const { theme, floor } = mapPick;
      if (!M.dungeonOpen(save, theme)) { no(); toast(M.dungeonLockText(theme) + ' to open it.'); return; }
      const opts = M.runOptions(save, theme, potionFor, floor);
      if (!opts.party.length && !opts.mercs) { no(); toast('Nobody is ready. Seat a hero at the fire, or hire the sellswords.'); return; }
      P.payForRun(save, opts); save.theme = theme; potionFor = {};
      persist(); mode = 'ground'; hideCamp(); onSetOut(opts); break;
    }
    case 'respec':
      if (sheet && sheet.type === 'respec') { closeSheet(); if (P.respec(save, arg)) { ok(); popGold(); toast('Every point is back. Spend them again in the web.'); } else { no(); toast('Not enough gold.'); } }
      else openSheet({ type: 'respec', hero: arg });
      break;
    case 'recruit': if (M.recruit(save, arg)) { cue('buy'); sub = 'skills'; heroFrom = 'ground'; persist(); scene.sync(); render(); popGold(); } else { no(); toast('Not enough gold.'); } break;
    case 'tslot': openSheet({ type: 'trinket', hero: heroId, slot: +arg }); break;
    case 'equip': if (P.equip(save, sheet.hero, arg, sheet.slot)) { closeSheet(); cue('tap'); ok(); } else no(); break;
    case 'unequip': if (P.unequip(save, sheet.hero, sheet.slot)) { closeSheet(); ok(); } else no(); break;
    case 'ware': openSheet({ type: 'ware', kind: arg, id: arg2 }); break;
    case 'buyt': if (STOCK.buy(save, 't', arg)) { ok(); popGold(); } else no(); break;
    case 'buyp': if (STOCK.buy(save, 'p', arg)) { ok(); popGold(); } else no(); break;
    case 'upt': if (P.upgradeTrinket(save, arg)) { ok(); popGold(); } else no(); break;
    case 'booktab': bookTab = arg; cue('tap'); render(); break;
    case 'beast': openSheet({ type: 'beast', kind: arg }); break;
    case 'env': setEnv(+arg); cue('tap'); render(); break;
    case 'puddle': LOOKS.setPuddleStyle(arg); cue('tap'); render(); break;
    case 'hpstyle': LOOKS.setHpStyle(arg); cue('tap'); render(); break;
    case 'cheat': save.cheat = !save.cheat; ok(); break;
    case 'webAll': setShowAll(!showAll()); cue('tap'); render(); break;
    case 'closesheet': closeSheet(); break;
    case 'home': closeResult(); break;
  }
}
function popGold() { cue('buy'); const el = document.querySelector('#camp .purse'); if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } }

// Timers tick down in place; when one runs out, redraw so the hero is ready again.
function tick() {
  const now = Date.now(); let done = false;
  for (const el of document.querySelectorAll('#camp [data-until], #sheet [data-until]')) {
    const left = +el.dataset.until - now;
    if (left <= 0) done = true; else el.textContent = mmss(left);
  }
  scene.sync();
  if (done && !(mode === 'hero' && sub === 'skills')) render();
}

// ================================================================ after a run
// rep (progress.js applySummary): { result, gold, raw, lost, mercCut, theme, floor, rooms, kills, checkpoint,
//   heroes: [{ id, from, level, gained, points, downed, hurt }], slots: { unlocked: [...] }, opened: [ids] }
let resultDone = null;
const TITLES = { won: 'Dungeon cleared', lost: 'The party fell', retreated: 'Out safely' };
export function showResult(rep, done) {
  resultDone = done;
  const el = document.getElementById('result');
  const theme = THEMES[rep.theme];
  const heroes = (rep.heroes || []).map((h, i) => {
    const H = HEROES[h.id], to = h.level || M.level(save, h.id), from = h.from || to, need = M.xpNeed(to), x = h.xp != null ? h.xp : M.xp(save, h.id);
    const gained = h.gained != null ? h.gained : Math.max(0, to - from);
    return `<div class="rhero" style="--d:${0.35 + i * 0.12}s">${face(h.id, 52)}
      <div class="rh-mid"><b>${H.name}</b>
        <div class="xpline"><span class="lvl">${to}</span><div class="bar xp"><i style="width:${Math.min(100, 100 * x / need)}%"></i><em>${Math.floor(x)}/${need}</em></div></div>
        <span class="quiet small">${to > from ? `Level ${from} → ${to}` : `Level ${to}`}${h.downed ? ' · downed, resting' : h.hurt ? ' · hurt, resting' : ''}</span></div>
      ${gained ? `<span class="rh-pts"><span class="pts">+${gained}</span><span class="cap">${gained === 1 ? 'point' : 'points'}</span></span>` : ''}</div>`;
  }).join('');
  const lost = rep.lost ? `<p class="r-cut">${rep.result === 'lost' ? 'Fell' : 'Left'} before the floor was done: −${rep.lost} (${Math.round(M.LEAVE_CUT * 100)}%)</p>` : '';
  const merc = rep.mercCut ? `<p class="quiet small">The sellswords took ${rep.mercCut}.</p>` : '';
  const opened = Array.isArray(rep.opened) ? rep.opened : rep.opened ? [rep.opened] : [];
  const newSeats = rep.slots && rep.slots.unlocked ? rep.slots.unlocked.length : 0;
  const news = [newSeats ? `${I.plus}<span>${newSeats > 1 ? newSeats + ' new seats' : 'A new seat'} by the fire</span>` : '', ...opened.map((t) => `${I.door}<span>${(THEMES[t] || {}).name || 'A new dungeon'} is open</span>`),
    rep.checkpoint ? `${I.flag}<span>Checkpoint: floor ${rep.checkpoint}</span>` : '', `${I.trader}<span>New wares at the trader</span>`].filter(Boolean).map((s) => `<div class="r-new">${s}</div>`).join('');
  // round 9 lane T: the card scrolls inside itself (the stats under the heroes), Back to camp stays in reach
  el.innerHTML = `<div class="rcard ${rep.result}"><div class="r-scroll">
    <span class="cap">${theme ? theme.name : ''} · floor ${rep.floor} · ${rep.rooms} rooms · ${rep.kills} kills</span>
    <h1 class="t32">${TITLES[rep.result] || 'Run over'}</h1>
    <div class="r-gold">${coin}<b class="count">0</b><span class="quiet">gold</span></div>${lost}${merc}
    ${news}
    ${heroes ? `<div class="rheroes">${heroes}</div>` : ''}
    ${resultStats(rep.stats)}</div>
    <div class="r-foot"><button class="btn primary wide" data-act="home">Back to camp</button></div></div>`;
  wireStats(el);
  const c = el.querySelector('.count'), to = rep.gold, t0 = performance.now();
  const step = (now) => { const k = Math.min(1, (now - t0 - 300) / 900); c.textContent = Math.round(to * Math.max(0, 1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function closeResult() { const d = resultDone; resultDone = null; mode = 'ground'; if (d) d(); }
