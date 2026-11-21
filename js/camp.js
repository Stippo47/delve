// The camp (UI v3, docs/UI-v3.md): a fixed frame (top strip, content, thumb row, tab bar) and five tabs:
//   Heroes   the roster -> a hero page (Skills: the web, Gear: trinkets, About: the kit)
//   Trader   equipment (buy, level up) and potions, for gold
//   Camp     home: the party round the fire, the dungeon carousel, the floor to start on, the Delve button
//   Book     the bestiary: monsters, items, statuses
//   Settings sound, dungeon look, puddles, enemy health, the cheat
// Plain DOM redrawn from the save after every action; one click handler reads data-act. Rules live in progress.js,
// read through meta.js.
import { HEROES, HERO_IDS, STATS } from './heroes.js';
import * as P from './progress.js';
import * as M from './meta.js';
import { writeSave } from './save.js';
import { icon } from './icons.js';
import { DEFS } from './units.js';
import { beastFun, beastHabit, trinketFun, POTION_FUN, STATUSES } from './bestiary.js';
import { portrait } from './inspect.js';
import { ENV_STYLES, envId, setEnv } from './env.js';
import { soundSettingsHtml } from './audio.js';
import { cue } from './sfx.js';
import { I, coin, gold, ROLE, ROLE_COL, roman, mmss, face, themeColors } from './ui-kit.js';
import { nightSky, fire, doorway } from './camp-art.js';
import { mountTree } from './skilltree.js';
import * as LOOKS from './looks.js';

// ---------------------------------------------------------------- dungeons (themes)
export let THEMES = {};
export async function loadThemes() {
  try { const m = await import('./themes.js'); if (m.THEMES) THEMES = m.THEMES; } catch (e) { /* the camp still opens */ }
  await LOOKS.loadLooks();
}

// ---------------------------------------------------------------- state
let save = null, onSetOut = null, root = null, mainEl = null, topEl = null, thumbEl = null, sheetEl = null;
let tab = 'camp';
let page = null;            // { type: 'hero', id, sub: 'skills' | 'gear' | 'about' }
let sheet = null;
let pick = { theme: null, floor: 1 };
let potionFor = {};         // { heroId: [potionId...] } handed out for the next run
let bookTab = 'beasts', shopTab = 'gear';
let treeSel = {};           // the node picked on each hero's web
let tree = null;
let ticker = 0;

export function initCamp(opts) {
  save = opts.save; onSetOut = opts.onSetOut;
  root = document.getElementById('camp');
  mainEl = document.getElementById('campMain');
  topEl = document.getElementById('campTop');
  thumbEl = document.getElementById('campThumb');
  sheetEl = document.getElementById('sheet');
  root.addEventListener('click', onClick);
  sheetEl.addEventListener('click', onClick);
  sheetEl.addEventListener('input', onInput);
  document.getElementById('result').addEventListener('click', onClick);
  mainEl.addEventListener('scroll', onCarousel, true);
}
export function setSave(s) { save = s; }

export function showCamp() {
  page = null; sheet = null; closeSheet();
  render();
  clearInterval(ticker); ticker = setInterval(tick, 1000);
}
export function hideCamp() { clearInterval(ticker); closeSheet(); }
function persist() { writeSave(save); }

// ---------------------------------------------------------------- the frame
const TABS = [['camp', 'Camp'], ['heroes', 'Heroes'], ['trader', 'Trader'], ['book', 'Book'], ['settings', 'Settings']];
function render() {
  const keep = mainEl.scrollTop;
  root.dataset.tab = tab; root.dataset.page = page ? page.type + '-' + page.sub : '';
  root.classList.toggle('cheat', !!save.cheat);
  // the tab bar: a dot on Heroes when someone has points to spend
  const spend = HERO_IDS.some((id) => save.heroes[id].owned && M.points(save, id) > 0 && M.points(save, id) !== Infinity);
  document.getElementById('tabbar').innerHTML = TABS.map(([t, name]) =>
    `<button class="tab ${t === tab ? 'on' : ''} t-${t}" data-act="tab:${t}">${I[t]}<span>${name}</span>${t === 'heroes' && spend ? '<i class="dot"></i>' : ''}</button>`).join('');
  let out;
  if (page && page.type === 'hero') out = heroPage(page.id);
  else out = { heroes: heroesTab, trader: traderTab, camp: campTab, book: bookTabView, settings: settingsTab }[tab]();
  topEl.innerHTML = out.top || defaultTop(out.title);
  mainEl.innerHTML = out.html;
  mainEl.className = out.cls || '';
  thumbEl.innerHTML = out.thumb || '';
  thumbEl.classList.toggle('hidden', !out.thumb);
  mainEl.scrollTop = out.keep === false ? 0 : keep;
  if (out.after) out.after();
  if (sheet) renderSheet();
}
const purse = () => `<span class="pill purse">${coin}<b id="cGold">${save.cheat ? '∞' : save.gold}</b></span>${save.gems ? `<span class="pill purse gems"><span class="gem"></span><b>${save.gems}</b></span>` : ''}`; // gems: round 9
const defaultTop = (title) => `<h1 class="top-title">${title}</h1>${purse()}`;
const backTop = (title, sub = '') => `<button class="top-back" data-act="back" aria-label="back">${I.back}</button><div class="top-mid"><h1 class="top-title sm">${title}</h1>${sub}</div>${purse()}`;
function go(t) { tab = t; page = null; closeSheet(); render(); mainEl.scrollTop = 0; }
function openHero(id, sub) { page = { type: 'hero', id, sub: sub || (save.heroes[id].owned ? 'skills' : 'about'), from: tab }; closeSheet(); render(); mainEl.scrollTop = 0; }

// ================================================================ Camp (home): the party, the dungeon, Delve
function campTab() {
  const order = M.dungeonOrder();
  if (!pick.theme || !THEMES[pick.theme]) pick.theme = (save.theme && THEMES[save.theme] && M.dungeonOpen(save, save.theme)) ? save.theme : order.filter((t) => M.dungeonOpen(save, t)).pop() || order[0];
  pick.floor = Math.min(pick.floor || 1, M.checkpoint(save, pick.theme));
  const n = M.slots(save), seats = [];
  for (let i = 0; i < M.SLOT_MAX; i++) seats.push(seatHtml(i, n));
  const ready = save.party.filter((id) => P.canGo(save, id));
  const html = `
    <section class="fireside">${nightSky()}${fire}<div class="seats">${seats.join('')}</div></section>
    <div class="party-line"><span class="cap">Party ${save.party.length}/${n}</span>
      <button class="mini-toggle ${save.mercs ? 'on' : ''}" data-act="mercs"><span>Sellswords</span><span class="quiet small">take half</span><span class="switch"><i></i></span></button></div>
    <section class="dsec"><div class="sec-h"><span class="cap">Dungeon</span><span class="quiet small">${order.filter((t) => M.dungeonOpen(save, t)).length} of ${order.length} open</span></div>
      <div class="carousel" id="carousel">${order.map((t, i) => dungeonCard(t, i)).join('')}</div>
      <div class="dots">${order.map((t) => `<i class="${t === pick.theme ? 'on' : ''}"></i>`).join('')}</div>
      ${floorPicker()}
    </section>`;
  const open = M.dungeonOpen(save, pick.theme), th = THEMES[pick.theme];
  const can = open && (ready.length || save.mercs);
  const bag = Object.values(potionFor).reduce((a, l) => a + l.length, 0);
  const thumb = `<button class="bagbtn" data-act="pack" aria-label="pack potions">${I.flask}${bag ? `<i class="badge">${bag}</i>` : ''}</button>
    <button class="btn primary delve-go ${can ? '' : 'off'}" data-act="enter"><b>${open ? 'Delve' : 'Locked'}</b><span>${th ? th.name : ''} · floor ${pick.floor}</span></button>`;
  return { title: 'Delve', html, thumb, cls: 'm-camp', after: centerCarousel };
}

function seatHtml(i, n) {
  if (i >= n) {
    const hint = i === n ? M.nextSlotHint(save) : null;
    return `<div class="seat locked s${i} ${hint ? '' : 'later'}" data-act="lockedseat">${'<span class="seat-ring">' + I.lock + '</span>'}${hint ? `<span class="seat-hint">${hint}</span>` : ''}</div>`;
  }
  const id = save.party[i];
  if (!id) return `<div class="seat empty s${i}" data-act="seat:${i}"><span class="seat-ring">${I.plus}</span><span class="seat-name quiet">Empty seat</span></div>`;
  const left = P.recoverLeft(save, id), mine = potionFor[id] || [];
  const pockets = Array.from({ length: P.CARRY_MAX }, (_, k) => `<i class="pocket ${mine[k] ? 'full' : ''}">${mine[k] ? icon('potion', mine[k]) : I.flask}</i>`).join('');
  return `<div class="seat s${i} ${left ? 'resting' : ''}" data-hero="${id}">
    <div class="seat-face" data-act="seat:${i}">${face(id, 64)}<span class="lvl">${M.level(save, id)}</span>${left ? `<span class="seat-timer" data-until="${save.heroes[id].recoverUntil}">${mmss(left)}</span>` : ''}</div>
    <span class="seat-name">${HEROES[id].name}</span>
    <div class="pockets" data-act="pack:${id}">${pockets}</div></div>`;
}

function dungeonCard(t, i) {
  const th = THEMES[t], r = M.dungeonState(save, t), open = r.open, c = themeColors(th);
  const status = !open ? `${I.lock}<span>${M.dungeonLockText(t)}</span>`
    : r.cleared ? `${I.crown}<span>Cleared${r.cleared > 1 ? ' ×' + r.cleared : ''}</span>` : r.best ? `${I.flag}<span>Reached floor ${r.best}</span>` : '<span>New</span>';
  return `<div class="dcard ${open ? '' : 'locked'} ${t === pick.theme ? 'on' : ''}" data-act="theme:${t}" data-theme="${t}" style="--acc:${c.accent};--rock:${c.rock};--wall:${c.wall}">
    <div class="dc-art">${doorway(th, t)}</div>
    <div class="dc-text"><span class="cap">Dungeon ${i + 1}</span><h2>${th.name}</h2><p>${th.blurb}</p><span class="dc-status">${status}</span></div></div>`;
}

function floorPicker() {
  const cp = M.checkpoint(save, pick.theme), open = M.dungeonOpen(save, pick.theme);
  const btns = [1, 2, 3].map((f) => {
    const ok = open && f <= cp;
    return `<button class="${f === pick.floor ? 'on' : ''} ${ok ? '' : 'lockedf'}" data-act="floor:${f}">${ok ? (f > 1 ? I.flag : '') : I.lock}<span>Floor ${f}</span></button>`;
  }).join('');
  const what = pick.floor < M.FLOORS ? `${M.ROOMS} rooms, then a mini-boss` : `${M.ROOMS} rooms, then the boss`;
  return `<div class="floors"><div class="sec-h"><span class="cap">Start at</span><span class="quiet small">${what}</span></div><div class="seg fseg">${btns}</div>
    <p class="quiet small fnote">${cp > 1 ? 'Reach a floor once and you can start there again, in new rooms.' : 'Reach floor 2 to start there next time.'}</p></div>`;
}

// keep the chosen dungeon in the middle of the carousel, and pick whatever the player swipes to
function centerCarousel() {
  const c = document.getElementById('carousel'); if (!c) return;
  const card = c.querySelector(`[data-theme="${pick.theme}"]`);
  if (card) c.scrollLeft = card.offsetLeft - (c.clientWidth - card.clientWidth) / 2;
}
let carT = 0;
function onCarousel(e) {
  if (!e.target || e.target.id !== 'carousel') return;
  clearTimeout(carT);
  carT = setTimeout(() => {
    const c = e.target, mid = c.scrollLeft + c.clientWidth / 2;
    let best = null, bd = Infinity;
    for (const el of c.querySelectorAll('.dcard')) { const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid); if (d < bd) { bd = d; best = el; } }
    if (best && best.dataset.theme !== pick.theme) { pick.theme = best.dataset.theme; pick.floor = 1; cue('tap'); render(); }
  }, 140);
}

// ================================================================ Heroes
function heroesTab() {
  const now = Date.now();
  const ids = HERO_IDS.slice().sort((a, b) => (save.heroes[b].owned - save.heroes[a].owned) || (save.heroes[a].owned ? M.level(save, b) - M.level(save, a) : M.heroPrice(a) - M.heroPrice(b)));
  const owned = ids.filter((id) => save.heroes[id].owned).length;
  const tiles = ids.map((id, i) => {
    const h = HEROES[id], sv = save.heroes[id], left = sv.owned && P.recoverLeft(save, id, now), p = sv.owned ? M.points(save, id) : 0;
    const inParty = save.party.includes(id);
    return `<div role="button" class="htile ${sv.owned ? '' : 'locked'} ${left ? 'resting' : ''} ${inParty ? 'inparty' : ''}" data-act="hero:${id}" style="--d:${i * 0.02}s">
      <div class="ht-face">${face(id, 76)}${sv.owned ? `<span class="lvl">${M.level(save, id)}</span>` : ''}${inParty ? `<span class="ht-fire">${I.fire}</span>` : ''}${p > 0 && p !== Infinity ? `<span class="ht-pts">${p}</span>` : ''}
        ${left ? `<span class="ht-timer" data-until="${sv.recoverUntil}">${mmss(left)}</span>` : ''}</div>
      <b>${h.name}</b><span class="ht-sub">${sv.owned ? ROLE[h.role] : gold(M.heroPrice(id))}</span></div>`;
  }).join('');
  return { title: 'Heroes', html: `<div class="tab-h"><span class="quiet">${owned} of ${HERO_IDS.length} recruited</span></div><div class="hgrid">${tiles}</div>`, cls: 'm-list' };
}

// ---- a hero's page
function heroPage(id) {
  const h = HEROES[id], sv = save.heroes[id], lv = M.level(save, id), need = M.xpNeed(lv), x = M.xp(save, id);
  const inParty = save.party.includes(id), left = sv.owned && P.recoverLeft(save, id);
  const partyBtn = !sv.owned ? '' : inParty ? `<button class="chip on" data-act="stand:${id}">${I.fire}<span>In party</span></button>`
    : left ? `<span class="chip rest">${I.moon}<span data-until="${sv.recoverUntil}">${mmss(left)}</span></span>`
    : `<button class="chip" data-act="sit:${id}">${I.plus}<span>Add to party</span></button>`;
  const head = `<section class="hhead" style="--rc:${ROLE_COL[h.role]}">${face(id, 60)}
      <div class="hh-mid"><span class="cap" style="color:${ROLE_COL[h.role]}">${ROLE[h.role]}</span>
        <div class="xpline"><span class="lvl">${lv}</span><div class="bar xp"><i style="width:${sv.owned ? Math.min(100, 100 * x / need) : 0}%"></i><em>${sv.owned ? `${Math.floor(x)}/${need}` : 'not recruited'}</em></div></div></div>
      ${partyBtn}</section>
    <div class="seg hseg">${[['skills', 'Skills'], ['gear', 'Gear'], ['about', 'About']].map(([k, n]) => `<button class="${page.sub === k ? 'on' : ''}" data-act="sub:${k}">${n}</button>`).join('')}</div>`;
  let body = '', after = null, thumb = '';
  if (page.sub === 'skills') {
    body = `<div class="treehost" id="treehost"></div>`;
    after = () => {
      tree = mountTree(document.getElementById('treehost'), {
        save, id, sel: treeSel[id],
        onSelect: (n) => { treeSel[id] = n; },
        onLearn: (n) => { if (M.learn(save, id, n)) { cue('buy'); persist(); tree.refresh(save, n); renderTabDot(); } else cue('deny'); },
        onDeny: () => cue('deny'),
      });
    };
  } else if (page.sub === 'gear') body = gearView(id);
  else body = aboutView(id);
  if (!sv.owned) thumb = `<button class="btn primary wide recruit ${M.afford(save, M.heroPrice(id)) ? '' : 'off'}" data-act="recruit:${id}">Recruit ${h.name} · ${gold(M.heroPrice(id))}</button>`;
  return { top: backTop(h.name), html: head + body, thumb, cls: 'm-hero sub-' + page.sub, after };
}
function renderTabDot() {
  const spend = HERO_IDS.some((id) => save.heroes[id].owned && M.points(save, id) > 0 && M.points(save, id) !== Infinity);
  const t = document.querySelector('#tabbar .t-heroes'); if (!t) return;
  const d = t.querySelector('.dot'); if (spend && !d) t.insertAdjacentHTML('beforeend', '<i class="dot"></i>'); if (!spend && d) d.remove();
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
  return `<div class="pad"><div class="sec-h"><span class="cap">Worn</span><span class="quiet small">${n} ${n === 1 ? 'slot' : 'slots'}</span></div>${slots}
    <div class="sec-h"><span class="cap">In the chest</span><span class="quiet small">${save.trinkets.length}</span></div>
    ${spare.length ? `<div class="chest">${spare.map((t) => `<span class="chest-it" style="--rar:${P.RARITY[P.trinketInfo(t).rarity].color}">${icon('trinket', t, '', P.trinketInfo(t).color)}${save.trinkets.filter((x) => x === t).length > 1 ? `<i>${save.trinkets.filter((x) => x === t).length}</i>` : ''}</span>`).join('')}</div>`
      : `<p class="quiet small empty-note">Nothing spare. The trader sells trinkets.</p>`}</div>`;
}

function aboutView(id) {
  const h = HEROES[id];
  const row = (ico, cap, name, desc, extra = '') => `<div class="krow">${ico}<div><span class="cap">${cap}</span><b>${name}</b><p>${desc}</p>${extra}</div></div>`;
  const sum = webSummary(id);
  return `<div class="pad"><p class="blurb">${h.blurb}</p>
    ${sum ? `<div class="sec-h"><span class="cap">From the skill web</span>${P.respecPrice ? `<button class="linkbtn" data-act="respec:${id}">Unlearn all · ${gold(P.respecPrice(save, id))}</button>` : ''}</div>
      <div class="sumchips">${sum}</div><div class="sec-h"><span class="cap">Kit</span></div>` : ''}
    ${row(`<span class="k-ico">${I.sword}</span>`, 'Attack', h.attack.name, h.attack.desc)}
    ${h.abilities.map((ab, i) => row(`<span class="k-ico ab">${icon('ability', ab.id)}</span>`, `Ability ${i + 1} · ${ab.cd}s`, ab.name, ab.desc,
      `<ol class="tiers">${ab.tiers.map((t, k) => `<li class="${M.rank(save, id, `${ab.id}${k + 1}`) ? 'got' : ''}"><i>${roman(k + 1)}</i>${t}</li>`).join('')}</ol>`)).join('')}
    ${row(`<span class="k-ico">${I.crown}</span>`, 'Trait', h.trait.name, h.trait.desc)}</div>`;
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

// ================================================================ Trader
function traderTab() {
  const segs = `<div class="seg tseg"><button class="${shopTab === 'gear' ? 'on' : ''}" data-act="shop:gear">Equipment</button><button class="${shopTab === 'pots' ? 'on' : ''}" data-act="shop:pots">Potions</button></div>`;
  let body;
  if (shopTab === 'gear') {
    const have = (tid) => save.trinkets.filter((x) => x === tid).length + HERO_IDS.filter((h) => save.heroes[h].trinkets.includes(tid)).length;
    body = `<div class="wgrid">${P.shopTrinkets().map((t, i) => {
      const n = have(t.id), lv = P.trinketLevel(save, t.id), up = n ? P.upgradePrice(save, t.id) : null;
      return `<div role="button" class="ware" data-act="ware:t:${t.id}" style="--rar:${P.RARITY[t.rarity].color};--d:${i * 0.02}s">
        <span class="w-ico">${icon('trinket', t.id, '', t.color)}${n ? `<i class="w-n">${n}</i>` : ''}</span>
        <b>${t.name}</b><span class="w-lv">${Array.from({ length: P.TLV_MAX }, (_, k) => `<i class="${n && k < lv ? 'on' : ''}"></i>`).join('')}</span>
        <span class="w-price ${P.afford(save, 'gold', n ? up || 0 : t.price) ? '' : 'poor'}">${n ? (up != null ? `<span class="quiet">Lv ${roman(lv + 1)}</span> ${gold(up)}` : '<span class="quiet">Top level</span>') : gold(t.price)}</span></div>`;
    }).join('')}</div>`;
  } else {
    body = `<div class="wgrid">${Object.keys(P.POTIONS).map((pid, i) => {
      const p = P.POTIONS[pid], n = P.potionCount(save, pid), full = n >= P.POTION_MAX;
      return `<div role="button" class="ware pot" data-act="ware:p:${pid}" style="--rar:${p.color};--d:${i * 0.02}s"><span class="w-ico">${icon('potion', pid)}${n ? `<i class="w-n">${n}</i>` : ''}</span>
        <b>${p.name}</b><span class="w-price ${P.afford(save, 'gold', p.price) && !full ? '' : 'poor'}">${full ? '<span class="quiet">Bag full</span>' : gold(p.price)}</span></div>`;
    }).join('')}</div><p class="quiet small foot-note">Pack them at the fire before you delve: two per hero, one of each kind.</p>`;
  }
  return { title: 'Trader', html: `<div class="tab-h">${segs}</div>${body}`, cls: 'm-list' };
}

// ================================================================ Book
function bookTabView() {
  const kinds = Object.keys(DEFS).filter((k) => DEFS[k].team === 'enemy' && k !== 'boss' && k !== 'skeleton');
  const seen = save.seen || {};
  const metN = kinds.filter((k) => seen[k] && seen[k].met).length;
  const segs = `<div class="seg"><button class="${bookTab === 'beasts' ? 'on' : ''}" data-act="booktab:beasts">Monsters ${metN}/${kinds.length}</button><button class="${bookTab === 'items' ? 'on' : ''}" data-act="booktab:items">Items</button><button class="${bookTab === 'status' ? 'on' : ''}" data-act="booktab:status">Statuses</button></div>`;
  let body = '';
  if (bookTab === 'beasts') {
    body = `<div class="bgrid">${kinds.map((k) => {
      const s = seen[k], d = DEFS[k], met = s && s.met;
      return `<div role="button" class="beast ${met ? '' : 'unknown'} ${d.boss ? 'boss' : ''}" ${met ? `data-act="beast:${k}"` : ''}><span class="b-pic"><img src="${portrait(k)}" alt=""></span><b>${met ? d.name : '???'}</b></div>`;
    }).join('')}</div>`;
  } else if (bookTab === 'items') {
    const rows = P.shopTrinkets().map((t) => `<div class="entry" style="--rar:${P.RARITY[t.rarity].color}"><span class="e-ico">${icon('trinket', t.id, '', t.color)}</span><div><b>${t.name}</b><p>${t.desc}</p><em>${trinketFun(t.id)}</em></div></div>`).join('')
      + Object.keys(P.POTIONS).map((id) => { const p = P.POTIONS[id]; return `<div class="entry" style="--rar:${p.color}"><span class="e-ico">${icon('potion', id)}</span><div><b>${p.name}</b><p>${p.desc}</p><em>${POTION_FUN[id] || ''}</em></div></div>`; }).join('');
    body = `<div class="pad entries">${rows}</div>`;
  } else {
    body = `<div class="pad entries">${Object.entries(STATUSES).map(([k, s]) => `<div class="entry"><span class="e-ico">${icon('status', k)}</span><div><b>${s.name}</b><p>${s.desc}</p></div></div>`).join('')}</div>`;
  }
  return { title: 'Book', html: `<div class="tab-h">${segs}</div>${body}`, cls: 'm-list' };
}

// ================================================================ Settings
function settingsTab() {
  const looks = (list, cur, act, swatch) => `<div class="looks">${list.map((l) => `<button class="look ${String(cur) === String(l.id) ? 'on' : ''}" data-act="${act}:${l.id}">
    <span class="lk-sw">${swatch(l)}</span><b>${l.name}</b><span class="quiet small">${l.blurb || ''}</span></button>`).join('')}</div>`;
  const envSw = (l) => `<i style="background:${['#B9B5B2', '#C7C1B4', '#6A6070', '#B8A890'][l.id - 1]}"></i><i style="background:${['#8E8D96', '#9C9488', '#2E2836', '#8E7860'][l.id - 1]}"></i>`;
  const html = `<div class="pad settings">
    <section class="group">${soundSettingsHtml()}</section>
    <section class="group"><h3 class="cap">Dungeon look</h3>${looks(ENV_STYLES, envId(), 'env', envSw)}</section>
    <section class="group"><h3 class="cap">Puddles and spills</h3>${looks(LOOKS.puddleStyles(), LOOKS.puddleStyle(), 'puddle', LOOKS.puddleSwatch)}</section>
    <section class="group"><h3 class="cap">Enemy health, once hurt</h3>${looks(LOOKS.hpStyles(), LOOKS.hpStyle(), 'hpstyle', LOOKS.hpSwatch)}</section>
    <section class="group"><h3 class="cap">Cheats</h3>
      <button class="rowbtn ${save.cheat ? 'on' : ''}" data-act="cheat"><div><b>Unlimited gold and points</b><span class="quiet small">Everything is free while it's on. Your real purse is kept for when you switch it off.</span></div><span class="switch"><i></i></span></button></section>
    <p class="faint small version">Delve · UI v3</p></div>`;
  return { title: 'Settings', html, cls: 'm-list' };
}
function onInput() { /* sound sliders handle themselves (audio.js) */ }

// ================================================================ sheets
function openSheet(s) { sheet = s; renderSheet(); }
function closeSheet() { sheet = null; if (sheetEl) { sheetEl.classList.add('hidden'); sheetEl.innerHTML = ''; } }
function renderSheet() {
  const body = { seat: seatSheet, pack: packSheet, trinket: trinketSheet, ware: wareSheet, beast: beastSheet, respec: respecSheet }[sheet.type]();
  const was = !sheetEl.classList.contains('hidden');
  sheetEl.innerHTML = `<div class="backdrop" data-act="closesheet"></div><div class="panel ${was ? '' : 'rise'}"><span class="grip"></span>${body}</div>`;
  sheetEl.classList.remove('hidden');
}

function seatSheet() {
  const slot = sheet.slot, cur = save.party[slot], now = Date.now();
  const list = HERO_IDS.filter((id) => save.heroes[id].owned).sort((a, b) => !!P.recoverLeft(save, a, now) - !!P.recoverLeft(save, b, now) || M.level(save, b) - M.level(save, a));
  const rows = list.map((id) => {
    const h = HEROES[id], left = P.recoverLeft(save, id, now), elsewhere = save.party.includes(id) && id !== cur;
    return `<div role="button" class="prow ${id === cur ? 'cur' : ''} ${left ? 'resting' : ''}" data-act="pick:${id}">${face(id, 46)}
      <div><b>${h.name}</b><span class="quiet small">Level ${M.level(save, id)} · ${ROLE[h.role]}${elsewhere ? ' · in another seat' : ''}</span></div>
      ${left ? `<span class="pr-rest">${I.moon}<span data-until="${save.heroes[id].recoverUntil}">${mmss(left)}</span></span>` : id === cur ? `<span class="pr-cur">${I.check}</span>` : ''}</div>`;
  }).join('');
  return `<div class="sheet-h"><h2>${cur ? 'Swap ' + HEROES[cur].name : 'Who sits here?'}</h2></div><div class="plist">${rows}</div>
    <div class="sheet-actions">${cur ? `<button class="btn ghost" data-act="pick:">Empty the seat</button><button class="btn" data-act="hero:${cur}">${HEROES[cur].name}'s page</button>` : '<button class="btn ghost" data-act="tab:heroes">Recruit more</button>'}</div>`;
}

// Packing: the party along the top, each with two pockets; the bag below. Tap a potion to hand it over.
function packSheet() {
  const party = save.party.filter((id) => P.canGo(save, id));
  if (!party.length) return `<div class="sheet-h"><h2>Pack potions</h2></div><p class="sheet-p quiet">Nobody in the party is ready to go.</p>`;
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
  return `<div class="sheet-h"><h2>Pack potions</h2></div><div class="packheroes">${heroes}</div>
    <p class="cap pk-for">For ${HEROES[who].name}: two at most, one of each</p>
    ${bag ? `<div class="bag">${bag}</div>` : '<p class="sheet-p quiet">The bag is empty. The trader sells potions.</p>'}
    <div class="sheet-actions">${bag ? '' : '<button class="btn ghost" data-act="tab:trader">Go to the trader</button>'}<button class="btn primary" data-act="closesheet">Done</button></div>`;
}

function trinketSheet() {
  const sv = save.heroes[sheet.hero], cur = sv.trinkets[sheet.slot];
  const rows = [...new Set(save.trinkets)].map((tid) => {
    const t = P.trinketInfo(tid), n = save.trinkets.filter((x) => x === tid).length;
    return `<div role="button" class="prow" data-act="equip:${tid}"><span class="e-ico" style="--rar:${P.RARITY[t.rarity].color}">${icon('trinket', tid, '', t.color)}</span><div><b>${t.name}${n > 1 ? ` ×${n}` : ''} <span class="tlv">${roman(P.trinketLevel(save, tid))}</span></b><span class="quiet small">${t.desc}</span></div></div>`;
  }).join('');
  return `<div class="sheet-h"><h2>${cur ? 'Swap ' + P.trinketInfo(cur).name : 'Wear a trinket'}</h2></div>
    ${rows ? `<div class="plist">${rows}</div>` : '<p class="sheet-p quiet">The chest is empty. The trader sells trinkets.</p>'}
    <div class="sheet-actions">${cur ? '<button class="btn ghost" data-act="unequip">Take it off</button>' : ''}${rows ? '' : '<button class="btn" data-act="tab:trader">Go to the trader</button>'}</div>`;
}

function wareSheet() {
  const { kind, id } = sheet;
  if (kind === 'p') {
    const p = P.POTIONS[id], n = P.potionCount(save, id), full = n >= P.POTION_MAX;
    return `<div class="sheet-h"><span class="big-ico">${icon('potion', id)}</span><div><h2>${p.name}</h2><span class="quiet small">${n} of ${P.POTION_MAX} in the bag</span></div></div>
      <p class="sheet-p">${p.desc}</p><p class="sheet-fun">${POTION_FUN[id] || ''}</p>
      <button class="btn primary wide ${P.afford(save, 'gold', p.price) && !full ? '' : 'off'}" data-act="buyp:${id}">${full ? 'The bag is full' : `Buy · ${gold(p.price)}`}</button>`;
  }
  const t = P.trinketInfo(id), r = P.RARITY[t.rarity], lv = P.trinketLevel(save, id), up = P.upgradePrice(save, id);
  const n = save.trinkets.filter((x) => x === id).length, worn = HERO_IDS.filter((h) => save.heroes[h].trinkets.includes(id)).map((h) => HEROES[h].name);
  const have = n + worn.length;
  const lvRow = have ? `<div class="lvrow"><span class="cap">Level</span><span class="w-lv big">${Array.from({ length: P.TLV_MAX }, (_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}</span><span class="quiet small">every copy you own</span></div>` : '';
  return `<div class="sheet-h"><span class="big-ico" style="--rar:${r.color}">${icon('trinket', id, '', t.color)}</span><div><h2>${t.name}</h2><span class="rar" style="color:${r.color}">${r.name}</span></div></div>
    <p class="sheet-p">${t.desc}</p><p class="sheet-fun">${trinketFun(id)}</p>
    ${have ? `<p class="quiet small">${n ? `${n} in the chest` : ''}${n && worn.length ? ' · ' : ''}${worn.length ? 'worn by ' + worn.join(', ') : ''}</p>` : ''}${lvRow}
    <div class="sheet-actions">${have && up != null ? `<button class="btn ${P.afford(save, 'gold', up) ? 'primary' : 'off'}" data-act="upt:${id}">Level ${roman(lv + 1)} · ${gold(up)}</button>` : ''}
      <button class="btn ${have ? '' : 'primary'} ${P.afford(save, 'gold', t.price) ? '' : 'off'}" data-act="buyt:${id}">Buy${have ? ' another' : ''} · ${gold(t.price)}</button></div>`;
}

function respecSheet() {
  const id = sheet.hero, n = P.spentPoints(save, id), price = P.respecPrice(save, id);
  return `<div class="sheet-h"><h2>Unlearn ${HEROES[id].name}'s web?</h2></div>
    <p class="sheet-p">Every node goes, and all ${n} ${n === 1 ? 'point comes' : 'points come'} back to spend again.</p>
    <div class="sheet-actions"><button class="btn ghost" data-act="closesheet">Keep it</button><button class="btn primary ${M.afford(save, price) ? '' : 'off'}" data-act="respec:${id}">Unlearn · ${gold(price)}</button></div>`;
}

function beastSheet() {
  const k = sheet.kind, d = DEFS[k], s = (save.seen || {})[k] || { met: 0, beaten: 0 };
  const res = Object.entries(d.res || {}).filter(([, v]) => v !== 1);
  const word = { burn: 'fire', chill: 'cold', poison: 'poison', shock: 'lightning', wet: 'water' };
  return `<div class="sheet-h"><span class="big-ico b-pic"><img src="${portrait(k)}" alt=""></span><div><h2>${d.name}</h2><span class="quiet small">${d.boss ? 'Boss · ' : ''}${s.met} met · ${s.beaten} beaten</span></div></div>
    <p class="sheet-fun">${beastFun(k)}</p><p class="sheet-p">${beastHabit(k)}</p>
    ${res.length ? `<div class="reschips">${res.map(([key, v]) => `<span class="${v < 1 ? 'res' : 'weak'}">${icon('status', key)}${v === 0 ? 'Immune to' : v < 1 ? 'Shrugs off' : 'Weak to'} ${word[key] || key}</span>`).join('')}</div>` : ''}`;
}

// ================================================================ the party
function sitDown(id) {
  if (!save.heroes[id].owned || P.recoverLeft(save, id)) return false;
  if (save.party.includes(id)) return true;
  if (save.party.length >= M.slots(save)) return false;
  save.party = [...save.party, id]; return true;
}
function standUp(id) { save.party = save.party.filter((x) => x !== id); delete potionFor[id]; }
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
    case 'tab': cue('tap'); go(arg); break;
    case 'back': page = null; closeSheet(); render(); break;
    case 'hero': openHero(arg); break;
    case 'sub': page.sub = arg; cue('tap'); render(); mainEl.scrollTop = 0; break;
    case 'theme': if (arg !== pick.theme) { pick.theme = arg; pick.floor = 1; cue('tap'); render(); } else if (!M.dungeonOpen(save, arg)) { no(); toast(M.dungeonLockText(arg) + ' to open it.'); } break;
    case 'floor': {
      const f = +arg;
      if (!M.dungeonOpen(save, pick.theme) || f > M.checkpoint(save, pick.theme)) { no(); toast(`Reach floor ${f} once to start there.`); return; }
      pick.floor = f; cue('tap'); render(); break;
    }
    case 'seat': openSheet({ type: 'seat', slot: +arg }); break;
    case 'lockedseat': no(); toast((M.nextSlotHint(save) || 'All seats are open') + ' to open another seat.'); break;
    case 'pick': {
      const slot = sheet.slot, id = arg || null;
      if (id && P.recoverLeft(save, id)) { no(); toast(`${HEROES[id].name} is resting.`); return; }
      const party = save.party.slice();
      if (id) { const j = party.indexOf(id); if (j >= 0) party[j] = party[slot] || null; }
      if (party[slot] && party[slot] !== id) delete potionFor[party[slot]];
      party[slot] = id;
      save.party = party.filter(Boolean).slice(0, M.slots(save));
      closeSheet(); ok(); break;
    }
    case 'sit':
      if (P.recoverLeft(save, arg)) { no(); toast(`${HEROES[arg].name} is resting.`); return; }
      if (!sitDown(arg)) { no(); toast('Every seat is taken. ' + (M.nextSlotHint(save) ? M.nextSlotHint(save) + ' for another.' : '')); return; }
      cue('tap'); ok(); break;
    case 'stand': standUp(arg); cue('tap'); ok(); break;
    case 'mercs': save.mercs = !save.mercs; cue('tap'); ok(); break;
    case 'pack': openSheet({ type: 'pack', hero: arg || save.party[0] }); break;
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
      if (!M.dungeonOpen(save, pick.theme)) { no(); toast(M.dungeonLockText(pick.theme) + ' to open it.'); return; }
      const opts = M.runOptions(save, pick.theme, potionFor, pick.floor);
      if (!opts.party.length && !opts.mercs) { no(); toast('Nobody is ready. Seat a hero at the fire, or hire the sellswords.'); return; }
      P.payForRun(save, opts); save.theme = pick.theme; potionFor = {};
      persist(); hideCamp(); onSetOut(opts); break;
    }
    case 'respec':
      if (sheet && sheet.type === 'respec') { closeSheet(); if (P.respec(save, arg)) { ok(); popGold(); toast('Every point is back. Spend them again in the web.'); } else { no(); toast('Not enough gold.'); } }
      else openSheet({ type: 'respec', hero: arg });
      break;
    case 'recruit': if (M.recruit(save, arg)) { cue('buy'); page.sub = 'skills'; ok(); popGold(); } else { no(); toast('Not enough gold.'); } break;
    case 'tslot': openSheet({ type: 'trinket', hero: page.id, slot: +arg }); break;
    case 'equip': if (P.equip(save, sheet.hero, arg, sheet.slot)) { closeSheet(); cue('tap'); ok(); } else no(); break;
    case 'unequip': if (P.unequip(save, sheet.hero, sheet.slot)) { closeSheet(); ok(); } else no(); break;
    case 'shop': shopTab = arg; cue('tap'); render(); break;
    case 'ware': openSheet({ type: 'ware', kind: arg, id: arg2 }); break;
    case 'buyt': if (P.buyTrinket(save, arg)) { ok(); popGold(); } else no(); break;
    case 'upt': if (P.upgradeTrinket(save, arg)) { ok(); popGold(); } else no(); break;
    case 'buyp': if (P.buyPotion(save, arg)) { ok(); popGold(); } else no(); break;
    case 'booktab': bookTab = arg; cue('tap'); render(); break;
    case 'beast': openSheet({ type: 'beast', kind: arg }); break;
    case 'env': setEnv(+arg); cue('tap'); render(); break;
    case 'puddle': LOOKS.setPuddleStyle(arg); cue('tap'); render(); break;
    case 'hpstyle': LOOKS.setHpStyle(arg); cue('tap'); render(); break;
    case 'cheat': save.cheat = !save.cheat; ok(); break;
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
  if (done && !(page && page.sub === 'skills')) render();
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
    rep.checkpoint ? `${I.flag}<span>Checkpoint: floor ${rep.checkpoint}</span>` : ''].filter(Boolean).map((s) => `<div class="r-new">${s}</div>`).join('');
  el.innerHTML = `<div class="rcard ${rep.result}">
    <span class="cap">${theme ? theme.name : ''} · floor ${rep.floor} · ${rep.rooms} rooms · ${rep.kills} kills</span>
    <h1 class="t32">${TITLES[rep.result] || 'Run over'}</h1>
    <div class="r-gold">${coin}<b class="count">0</b><span class="quiet">gold</span></div>${lost}${merc}
    ${news}
    ${heroes ? `<div class="rheroes">${heroes}</div>` : ''}
    <button class="btn primary wide" data-act="home">Back to camp</button></div>`;
  const c = el.querySelector('.count'), to = rep.gold, t0 = performance.now();
  const step = (now) => { const k = Math.min(1, (now - t0 - 300) / 900); c.textContent = Math.round(to * Math.max(0, 1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function closeResult() { const d = resultDone; resultDone = null; tab = 'camp'; if (d) d(); }
