// The camp: where the party gathers between runs. Round 7 redesign (docs/BUILD-v3.md, lane C): the Night watch look
// only, and the camp is a place you move around in rather than a stack of cards. Two layouts, picked in the settings:
//   'clearing' (default): a top-down clearing. The fire and its seats in the middle; the tent (heroes), the trader's
//                cart, the book and the sellswords round the edge; the road out at the bottom. Tap a place to walk to it.
//   'fireside': a side-on view of the fire under the night sky, the dungeons glowing on the mountains behind, the party
//                on the logs and every hero on a bench below: tap a hero on the bench to sit them at the fire.
// Two skill trees too (skilltree.js): 'grove' (a tree growing up out of the hero) and 'wheel' (a star wheel round
// the hero that turns to the branch you pick). The scenes are in camp-scenes.js. Plain DOM, one click handler
// (data-act on buttons), redrawn from the save after every action. Rules and prices live in progress.js.
import { HEROES, HERO_IDS, BRANCHES, FEAT_LEVEL } from './heroes.js';
import * as P from './progress.js';
import { writeSave } from './save.js';
import { icon } from './icons.js';
import { DEFS } from './units.js';
import { beastFun, beastHabit, trinketFun, POTION_FUN } from './bestiary.js';
import { portrait } from './inspect.js';
import { ENV_STYLES, envId, setEnv } from './env.js';
import { soundSettingsHtml } from './audio.js';
import { cue } from './sfx.js';
import { I, coin, gold, gems, ROLE, ROLE_COL, roman, mmss, ownedHeroes, tIcon, pIcon, bagCount } from './camp-kit.js';
import * as S from './camp-scenes.js';
import { treeHtml } from './skilltree.js';

// ---------------------------------------------------------------- layouts (settings)
export const LAYOUTS = [
  { id: 'clearing', name: 'The clearing', blurb: 'Top-down: walk to the tent, the trader or the book; the road out is at the bottom.' },
  { id: 'fireside', name: 'Fireside', blurb: 'Side-on: the party on the logs, every hero on the bench below, the dungeons on the mountains.' },
];
export const TREES = [
  { id: 'grove', name: 'Grove', blurb: 'A tree grows up out of the hero: climb each bough to its next tier; training in the roots.' },
  { id: 'wheel', name: 'Star wheel', blurb: 'The hero at the hub, a ring for each level; turn the wheel to a branch and buy below.' },
];
const layoutId = () => (save && save.campLayout === 'fireside' ? 'fireside' : 'clearing');
const treeId = () => (save && save.treeLayout === 'wheel' ? 'wheel' : 'grove');
// main.js calls this after a cheat or a new save: the layout names go on <html> for the CSS.
export function applyLook(s = save) {
  const html = document.documentElement;
  html.dataset.camp = s && s.campLayout === 'fireside' ? 'fireside' : 'clearing';
  html.dataset.tree = s && s.treeLayout === 'wheel' ? 'wheel' : 'grove';
}

// ---------------------------------------------------------------- dungeons (themes)
const STUB_THEMES = {
  crypt: { name: 'The Bone Crypt', blurb: 'Old tombs. The dead get up again.', palette: { floor: '#6B5E66', wall: '#3A3040', rock: '#2B2230', accent: '#F2DFA0' } },
};
export let THEMES = STUB_THEMES;
export async function loadThemes() {
  try {
    const m = await import('./themes.js');
    if (m.THEMES && Object.keys(m.THEMES).length) THEMES = m.THEMES;
  } catch (e) { /* not written yet: the stand-in stays */ }
}

// ---------------------------------------------------------------- state
let save = null, onSetOut = null, root = null, mainEl = null, footEl = null, sheetEl = null;
let view = { at: 'home' };   // home | heroes | shop | book | go | hero (+ id)
let trail = [];              // where the back button goes
let focus = null;            // fireside: the seated hero whose actions are open
let bookTab = 'beasts';
let sheet = null;            // the bottom sheet, see renderSheet
let potionFor = {};          // { heroId: [potionId...] }: what each hero is handed to bring in
const wheelPick = {};        // star wheel: the branch facing up, per hero
const wheelShown = {};       // ... and the angle it was last drawn at (so a turn animates from there)
let wheelSel = null;         // ... and the node picked on it
let lastView = '';
let ticker = 0;

export function initCamp(opts) {
  save = opts.save; onSetOut = opts.onSetOut;
  root = document.getElementById('camp');
  mainEl = document.getElementById('campMain');
  footEl = document.getElementById('campFoot');
  sheetEl = document.getElementById('sheet');
  applyLook();
  root.addEventListener('click', onClick);
  sheetEl.addEventListener('click', onClick);
  document.getElementById('result').addEventListener('click', onClick);
}
export function setSave(s) { save = s; applyLook(); }

export function showCamp() {
  view = { at: 'home' }; trail = []; sheet = null; focus = null;
  applyLook();
  render();
  clearInterval(ticker); ticker = setInterval(tick, 1000);
}
export function hideCamp() { clearInterval(ticker); closeSheet(); }

function persist() { writeSave(save); }
function goTo(v) { trail.push(view); view = v; focus = null; wheelSel = null; closeSheet(); render(); if (!(v.at === 'go' && layoutId() === 'fireside')) mainEl.scrollTop = 0; }
function goBack() { view = trail.pop() || { at: 'home' }; focus = null; closeSheet(); render(); }
function goHome() { view = { at: 'home' }; trail = []; focus = null; closeSheet(); render(); mainEl.scrollTop = 0; }

// What the scene modules get to draw from.
const ctx = () => ({ save, potionFor, focus, themes: THEMES, width: mainEl.clientWidth || 390, height: mainEl.clientHeight || 760 });

// ---------------------------------------------------------------- drawing
function render() {
  const key = view.at + (view.id || '') + layoutId() + treeId();
  const fresh = key !== lastView; lastView = key;
  const keep = fresh ? 0 : mainEl.scrollTop;
  document.getElementById('cGold').textContent = save.cheat ? '∞' : save.gold;
  document.getElementById('cGems').textContent = save.cheat ? '∞' : save.gems;
  root.classList.toggle('cheat', !!save.cheat);
  root.dataset.view = view.at;
  const fire = layoutId() === 'fireside';
  let out;
  switch (view.at) {
    case 'home': out = fire ? S.firesideHome(ctx()) : S.clearingHome(ctx()); break;
    case 'go': out = fire ? S.firesideRoad(ctx()) : S.clearingRoad(ctx()); break;
    case 'heroes': out = { html: rosterView(), foot: backBar() }; break;
    case 'shop': out = { html: shopView(), foot: backBar() }; break;
    case 'book': out = { html: bookView(), foot: backBar() }; break;
    case 'hero': out = { html: heroPage(view.id), foot: heroFoot(view.id) }; break;
    default: out = { html: '', foot: '' };
  }
  mainEl.innerHTML = `<div class="view v-${view.at}${fresh ? ' enter' : ''}">${out.html}</div>`;
  footEl.innerHTML = out.foot || '';
  footEl.classList.toggle('hidden', !out.foot);
  mainEl.scrollTop = out.scrollToEnd && fresh ? mainEl.scrollHeight : keep;
  if (sheet) renderSheet();
  // the star wheel turns from where it was last drawn to where it should face now
  for (const el of mainEl.querySelectorAll('[data-turn-to]')) {
    const to = +el.dataset.turnTo;
    requestAnimationFrame(() => requestAnimationFrame(() => el.style.setProperty('--turn', to + 'deg')));
  }
  if (view.at === 'home' && fire) S.firesideAfter(mainEl);
}

const backWords = () => (trail.length && trail[trail.length - 1].at !== 'home' ? 'Back' : layoutId() === 'fireside' ? 'Back to the fire' : 'Back to the fire');
function backBar(extra = '') {
  return `<div class="footbar"><button class="btn back-btn" data-act="back">${I.back}<span>${backWords()}</span></button>${extra}</div>`;
}
function heroFoot(id) {
  const sv = save.heroes[id];
  if (!sv.owned) return backBar(`<button class="btn big grow" data-act="unlock:${id}">Unlock ${gems(P.heroPrice(id))}</button>`);
  const inParty = save.party.includes(id), left = P.recoverLeft(save, id);
  const btn = inParty ? `<button class="btn grow" data-act="stand:${id}">${I.stand}<span>Stand up</span></button>`
    : left ? `<button class="btn grow" data-act="speed:${id}">Rest less ${gold(P.speedUpCost(left))}</button>`
    : `<button class="btn big grow" data-act="sit:${id}">${I.fire}<span>Sit at the fire</span></button>`;
  return backBar(btn);
}

// ---- the tent: every hero (the clearing's roster)
function rosterView() {
  const now = Date.now();
  const owned = ownedHeroes(save).length;
  const tiles = HERO_IDS.map((id, i) => {
    const h = HEROES[id], sv = save.heroes[id], left = sv.owned && P.recoverLeft(save, id, now);
    const seat = save.party.includes(id);
    return `<button class="cot ${sv.owned ? '' : 'locked'} ${left ? 'resting' : ''} ${seat ? 'seated' : ''}" data-act="hero:${id}" style="--rc:${ROLE_COL[h.role]};--d:${(i % 9) * 0.03}s">
      <span class="cot-rug"></span><img src="${h.art}" alt="">${left ? I.zzz : ''}
      <b>${h.name}</b><span class="role">${ROLE[h.role]}</span>
      ${!sv.owned ? `<span class="badge price">${gems(P.heroPrice(id))}</span>` : left ? `<span class="badge timer" data-until="${sv.recoverUntil}">${mmss(left)}</span>` : sv.feat ? `<span class="badge feat">${I.star}</span>` : ''}
      ${seat ? `<span class="flag">${I.fire}By the fire</span>` : ''}
    </button>`;
  }).join('');
  return `${S.placeHead('tent', 'The tent', `${owned} of ${HERO_IDS.length} heroes. Gems unlock the rest; bosses drop them.`)}
    <div class="cots">${tiles}</div>`;
}

// ---- a hero's page: who they are, their trinkets, and the skill tree
function heroPage(id) {
  const h = HEROES[id], sv = save.heroes[id], left = sv.owned && P.recoverLeft(save, id);
  const facts = [sv.feat ? `<span class="fact feat">${I.star} Reached level ${FEAT_LEVEL}</span>` : `<span class="fact dim">${I.star} Feat: reach level ${FEAT_LEVEL} in a run</span>`,
    sv.best ? `<span class="fact">Best run: level ${sv.best}</span>` : '',
    save.party.includes(id) ? `<span class="fact atfire">${I.fire} By the fire</span>` : ''].join('');
  const restLine = left ? `<div class="restline">${I.zzz}<span>Resting <b class="timer" data-until="${sv.recoverUntil}">${mmss(left)}</b></span></div>` : '';
  const nSlots = P.trinketSlots(save, id);
  const tslots = Array.from({ length: 2 }, (_, k) => {
    if (k >= nSlots) return `<div class="tslot locked">${I.lock}<span>Second slot<br><span class="muted">grows in the tree</span></span></div>`;
    const t = sv.trinkets[k] && P.trinketInfo(sv.trinkets[k]);
    return `<button class="tslot ${t ? 'full' : ''}" data-act="tslot:${k}" ${sv.owned ? '' : 'disabled'}>${t ? `${tIcon(save, t)}<span><b>${t.name}</b><span class="muted">${t.desc}</span></span>` : `<span class="plus">+</span><span class="muted">Wear a trinket</span>`}</button>`;
  }).join('');
  return `<section class="hero-head ${sv.owned ? '' : 'locked'}" style="--rc:${ROLE_COL[h.role]}">
      <div class="hh-art"><span class="halo"></span><img src="${h.art}" alt="">${left ? I.zzz : ''}</div>
      <div class="hh-text"><span class="role">${ROLE[h.role]}</span><h1>${h.name}</h1><p class="blurb">${h.blurb}</p></div>
    </section>
    <div class="facts">${facts}</div>${restLine}
    <div class="kitrow">
      <div class="kchip"><span class="klabel">Attack</span><b>${h.attack.name}</b><span>${h.attack.desc}</span></div>
      <div class="kchip"><span class="klabel">Trait</span><b>${h.trait.name}</b><span>${h.trait.desc}</span></div>
    </div>
    <div class="tslots">${tslots}</div>
    <section class="tree-sec">
      <div class="tree-title"><h2>Skill tree</h2><span class="muted">Gold buys it for good. A tier wakes up when the hero reaches its level in a run.</span></div>
      ${treeHtml(treeId(), { save, id, pick: wheelPick[id] || 0, shown: wheelShown, sel: treeId() === 'wheel' ? wheelSel : sheet && sheet.type === 'node' ? sheet.node : null })}
    </section>`;
}

// ---- the bestiary: every enemy met, and every item
function bookView() {
  const kinds = Object.keys(DEFS).filter((k) => DEFS[k].team === 'enemy' && k !== 'boss' && k !== 'skeleton');
  const seen = save.seen || {};
  const metN = kinds.filter((k) => seen[k] && seen[k].met).length;
  const tabs = `<div class="segs"><button class="${bookTab === 'beasts' ? 'on' : ''}" data-act="book:beasts">Monsters · ${metN}/${kinds.length}</button><button class="${bookTab === 'items' ? 'on' : ''}" data-act="book:items">Items</button></div>`;
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
    const tr = P.shopTrinkets().map((t) => `<div class="entry ${P.ownsTrinket(save, t.id) ? 'owned' : ''}" style="--rar:${P.RARITY[t.rarity].color}">${tIcon(save, t)}<span><b>${t.name}</b><em>${trinketFun(t.id)}</em><span class="muted">${t.desc}</span></span></div>`).join('');
    body = `<h3 class="shelf-h">Potions</h3><section class="pagebox entries">${pots}</section><h3 class="shelf-h">Trinkets</h3><section class="pagebox entries">${tr}</section>`;
  }
  return `${S.placeHead('book', 'The book', 'Everything met down there, written up by the fire.')}${tabs}${body}`;
}

// ---- the trader: wares on the cart's shelves; tap one to look closer
function shopView() {
  const seat = P.slotPrice(save);
  const owned = {}; for (const t of save.trinkets) owned[t] = (owned[t] || 0) + 1;
  const worn = {}; for (const id of HERO_IDS) for (const t of save.heroes[id].trinkets) (worn[t] = worn[t] || 0) + 1;
  const seatTile = `<button class="ware-tile seatware ${seat ? '' : 'sold'}" data-act="ware:seat">
      <span class="wpic"><svg viewBox="0 0 60 40"><rect x="3" y="6" width="54" height="28" rx="14" fill="#2B2230"/><rect x="8" y="11" width="44" height="18" rx="9" fill="#8C5E3A"/><ellipse cx="50" cy="20" rx="5" ry="8" fill="#D7B184"/></svg><i class="wcount">${save.slots}</i></span>
      <b>${seat ? 'Another seat' : 'All seats'}</b>${seat ? `<span class="tag">${gold(seat.gold)}</span>` : '<span class="tag dim">Full</span>'}</button>`;
  const pots = Object.keys(P.POTIONS).map((id) => {
    const p = P.POTIONS[id], n = P.potionCount(save, id), full = n >= P.POTION_MAX;
    return `<button class="ware-tile ${P.afford(save, 'gold', p.price) && !full ? '' : 'poor'}" data-act="ware:p:${id}">
      <span class="wpic">${icon('potion', id)}${n ? `<i class="wcount">${n}</i>` : ''}</span><b>${p.name}</b><span class="tag">${full ? 'Full' : gold(p.price)}</span></button>`;
  }).join('');
  const items = P.shopTrinkets().map((t) => {
    const r = P.RARITY[t.rarity], lv = P.trinketLevel(save, t.id), have = (owned[t.id] || 0) + (worn[t.id] || 0);
    return `<button class="ware-tile ${have ? 'have' : ''} ${P.afford(save, 'gold', t.price) ? '' : 'poor'}" data-act="ware:t:${t.id}" style="--rar:${r.color}">
      <span class="wpic cloth">${icon('trinket', t.id, '', t.color)}${have ? `<i class="wcount">${have}</i>` : ''}${lv > 1 ? `<i class="tlv">${roman(lv)}</i>` : ''}</span>
      <b>${t.name}</b><span class="tag">${gold(t.price)}</span></button>`;
  }).join('');
  return `${S.placeHead('cart', 'The trader', 'Bought things are yours for good. Tap anything on the cart to look closer.')}
    <h3 class="shelf-h">For the camp</h3><div class="shelf">${seatTile}</div>
    <h3 class="shelf-h">Potions <span class="muted">hand them out at the fire</span></h3><div class="shelf">${pots}</div>
    <h3 class="shelf-h">Trinkets <span class="muted">level one up and every copy gets stronger</span></h3><div class="shelf">${items}</div>`;
}

// ---------------------------------------------------------------- the bottom sheet
function openSheet(s) { sheet = s; renderSheet(); }
function closeSheet() { sheet = null; if (sheetEl) { sheetEl.classList.add('hidden'); sheetEl.innerHTML = ''; } }
function renderSheet() {
  let body = '';
  switch (sheet.type) {
    case 'party': body = partySheet(sheet.slot); break;
    case 'node': body = nodeSheet(sheet.hero, sheet.node); break;
    case 'trinket': body = trinketSheet(sheet.hero, sheet.slot); break;
    case 'pack': body = packSheet(); break;
    case 'settings': body = settingsSheet(); break;
    case 'beast': body = beastSheet(sheet.kind); break;
    case 'seat': body = seatSheet(); break;
    case 'ware': body = wareSheet(sheet.kind, sheet.id); break;
  }
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
    <div class="sheet-foot">${cur ? '<button class="btn" data-act="pick:">Leave the seat empty</button>' : ''}<button class="btn" data-act="place:heroes">The tent</button></div>`;
}

function nodeSheet(heroId, nodeId) {
  const n = P.tree(heroId).find((x) => x.id === nodeId), st = P.nodeState(save, heroId, n), h = HEROES[heroId];
  const b = BRANCHES.find((x) => x.id === n.branch), ab = h.abilities[b.ability];
  const kind = n.kind === 'tier' ? `${ab.name} · tier ${roman(n.tier)}` : n.kind === 'stat' ? `${b.name} training · bought again and again` : 'A second trinket slot';
  const needs = st.needs.filter((x) => x.what !== 'owned' || !x.ok).map((x) => `<li class="${x.ok ? 'ok' : ''}">${x.ok ? I.check : I.cross}${x.text}</li>`).join('');
  const lvl = n.kind === 'tier' ? `<li class="info">${I.fire}Wakes up at level ${n.req.level} in a run</li>` : '';
  const pips = n.max > 1 ? `<div class="rank big">${Array.from({ length: n.max }, (_, k) => `<i class="${k < st.rank ? 'on' : ''}"></i>`).join('')}<span class="muted">${st.rank} of ${n.max} bought</span></div>` : '';
  const face = n.kind === 'tier' ? icon('ability', n.ability, 'nico') : n.kind === 'slot' ? '<span class="gem" style="--g:#C9A7FF"></span>' : '<b>+</b>';
  const btn = st.maxed ? `<button class="btn big" disabled>${n.free ? 'Every hero starts with this' : n.max > 1 ? 'All bought' : 'Owned'}</button>`
    : `<button class="btn big ${st.canBuy ? '' : 'poor'}" data-act="buynode:${n.id}">${st.rank ? 'Buy again' : 'Buy'} ${gold(st.cost)}</button>`;
  return `<div class="nsheet"><span class="sface ${n.kind} ${st.maxed ? 'owned' : st.met ? 'ready' : 'locked'}">${face}${n.kind === 'tier' ? `<i class="rn">${roman(n.tier)}</i>` : ''}</span>
      <div><h2>${n.name}</h2><span class="muted">${kind}</span></div></div>
    <p class="ndesc">${n.desc}</p>${pips}
    <ul class="needs">${lvl}${needs}</ul>${btn}`;
}

function trinketSheet(heroId, slot) {
  const sv = save.heroes[heroId], cur = sv.trinkets[slot];
  const seen = new Set();
  const rows = save.trinkets.filter((t) => !seen.has(t) && seen.add(t)).map((tid) => {
    const t = P.trinketInfo(tid), n = save.trinkets.filter((x) => x === tid).length;
    return `<button class="trow" data-act="equip:${tid}">${tIcon(save, t)}<span><b>${t.name}${n > 1 ? ` ×${n}` : ''}</b><span class="muted">${t.desc}</span></span></button>`;
  }).join('');
  return `<h2>${cur ? 'Swap trinket' : 'Wear a trinket'}</h2>
    ${rows ? `<div class="plist">${rows}</div>` : '<p class="muted">The chest is empty. The trader sells trinkets.</p>'}
    <div class="sheet-foot">${cur ? '<button class="btn" data-act="unequip">Take it off</button>' : ''}<button class="btn" data-act="place:shop">The trader</button></div>`;
}

// Packing: the party along the top (each with two pockets), the bag below. Tap a potion to hand it to the chosen
// hero; tap one in a pocket to put it back. Two each at most, one of each kind.
function packSheet() {
  const party = save.party.filter((id) => !P.recoverLeft(save, id));
  if (!party.length) return `<h2>Pack the bags</h2><p class="muted">Nobody at the fire is ready to go. Sit a hero down first.</p><div class="sheet-foot"><button class="btn" data-act="closesheet">Done</button></div>`;
  if (!party.includes(sheet.hero)) sheet.hero = party[0];
  const who = sheet.hero;
  const heroes = party.map((id) => {
    const mine = potionFor[id] || [];
    return `<button class="packhero ${id === who ? 'on' : ''}" data-act="packhero:${id}"><img src="${HEROES[id].art}" alt=""><b>${HEROES[id].name}</b>
      <span class="pockets">${Array.from({ length: P.CARRY_MAX }, (_, k) => mine[k] ? `<i class="pocket full">${icon('potion', mine[k])}</i>` : '<i class="pocket"></i>').join('')}</span></button>`;
  }).join('');
  const mine = potionFor[who] || [];
  const pockets = Array.from({ length: P.CARRY_MAX }, (_, k) => mine[k]
    ? `<button class="bigpocket full" data-act="takep:${mine[k]}">${icon('potion', mine[k])}<span>${P.POTIONS[mine[k]].name}</span><i>Put back</i></button>`
    : '<div class="bigpocket"><span class="muted">Empty pocket</span></div>').join('');
  const handed = (p) => Object.values(potionFor).reduce((a, l) => a + l.filter((x) => x === p).length, 0);
  const bag = Object.keys(P.POTIONS).map((p) => {
    const left = P.potionCount(save, p) - handed(p), has = mine.includes(p);
    if (P.potionCount(save, p) <= 0) return '';
    const can = left > 0 && !has && mine.length < P.CARRY_MAX;
    return `<button class="bagpot ${can ? '' : 'dim'} ${has ? 'has' : ''}" data-act="givep:${p}">${icon('potion', p)}<b>${P.POTIONS[p].name}</b><span class="muted">${left} left</span></button>`;
  }).join('');
  return `<h2>Pack the bags</h2>
    <div class="packheroes">${heroes}</div>
    <div class="bigpockets">${pockets}</div>
    <h3 class="set-h">The bag: tap to hand one to ${HEROES[who].name}</h3>
    ${bag ? `<div class="packbag">${bag}</div>` : '<p class="muted">The bag is empty. The trader sells potions.</p>'}
    <p class="muted">Two each at most, one of each kind. Elixirs are drunk when the first real fight starts and last that room.</p>
    <div class="sheet-foot">${bag ? '' : '<button class="btn" data-act="place:shop">The trader</button>'}<button class="btn big" data-act="closesheet">Done</button></div>`;
}

function seatSheet() {
  const seat = P.slotPrice(save);
  if (!seat) return `<h2>Every seat is taken</h2><p class="ndesc">Your party is ${save.slots} strong: that's as many as the fire holds.</p><div class="sheet-foot"><button class="btn" data-act="closesheet">Close</button></div>`;
  return `<div class="nsheet"><span class="sface seatface"><svg viewBox="0 0 60 40"><rect x="3" y="6" width="54" height="28" rx="14" fill="#2B2230"/><rect x="8" y="11" width="44" height="18" rx="9" fill="#8C5E3A"/><ellipse cx="50" cy="20" rx="5" ry="8" fill="#D7B184"/></svg></span>
      <div><h2>Another seat by the fire</h2><span class="muted">Party size ${save.slots} → ${save.slots + 1}</span></div></div>
    <p class="ndesc">One more hero goes down with you. Each seat after this one costs a good deal more.</p>
    <div class="paytwo"><button class="btn big ${P.afford(save, 'gold', seat.gold) ? '' : 'poor'}" data-act="buys:gold">${gold(seat.gold)}</button>
      <button class="btn big ${P.afford(save, 'gems', seat.gems) ? '' : 'poor'}" data-act="buys:gems">${gems(seat.gems)}</button></div>`;
}

function wareSheet(kind, id) {
  if (kind === 'seat') return seatSheet();
  if (kind === 'p') {
    const p = P.POTIONS[id], n = P.potionCount(save, id), full = n >= P.POTION_MAX;
    return `<div class="nsheet"><span class="sface ware">${icon('potion', id)}</span><div><h2>${p.name}</h2><span class="muted">${n} of ${P.POTION_MAX} in the bag</span></div></div>
      <p class="ndesc">${p.desc}</p><p class="ndesc small"><em>${POTION_FUN[id] || ''}</em></p>
      <button class="btn big ${P.afford(save, 'gold', p.price) && !full ? '' : 'poor'}" data-act="buyp:${id}">${full ? 'The bag is full' : `Buy ${gold(p.price)}`}</button>`;
  }
  const t = P.trinketInfo(id), r = P.RARITY[t.rarity], lv = P.trinketLevel(save, id), up = P.upgradePrice(save, id);
  const n = save.trinkets.filter((x) => x === id).length, worn = HERO_IDS.filter((h) => save.heroes[h].trinkets.includes(id)).map((h) => HEROES[h].name);
  const have = n || worn.length;
  const lvl = have ? `<div class="lvrow"><span class="lvpips">${Array.from({ length: P.TLV_MAX }, (_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}</span><span class="muted">Level ${roman(lv)}</span>
      ${up != null ? `<button class="btn ${P.afford(save, 'gold', up) ? '' : 'poor'}" data-act="upt:${id}">Level ${roman(lv + 1)} ${gold(up)}</button>` : '<span class="muted">Top level</span>'}</div>` : '';
  return `<div class="nsheet"><span class="sface ware" style="--rar:${r.color}">${tIcon(save, t)}</span><div><h2>${t.name}</h2><span class="rar" style="--rar:${r.color}">${r.name}</span></div></div>
    <p class="ndesc">${t.desc}</p><p class="ndesc small"><em>${trinketFun(id)}</em></p>
    ${have ? `<p class="muted">${n ? `${n} in the chest` : ''}${n && worn.length ? ' · ' : ''}${worn.length ? 'worn by ' + worn.join(', ') : ''}</p>` : ''}${lvl}
    <button class="btn big ${P.afford(save, 'gold', t.price) ? '' : 'poor'}" data-act="buyt:${id}">Buy ${have ? 'another ' : ''}${gold(t.price)}</button>`;
}

function settingsSheet() {
  const pick = (list, cur, act) => `<div class="looks">${list.map((l) => `<button class="lookbtn ${cur === l.id ? 'on' : ''}" data-act="${act}:${l.id}">
    <span class="mini mini-${act}-${l.id}">${S.miniPicture(act, l.id)}</span><b>${l.name}</b><span class="muted">${l.blurb}</span></button>`).join('')}</div>`;
  const envs = `<div class="looks env">${ENV_STYLES.map((e) => `<button class="lookbtn ${String(envId()) === String(e.id) ? 'on' : ''}" data-act="env:${e.id}">
    <span class="swatch sw-env-${e.id}"><i></i><i></i><i></i></span><b>${e.name}</b><span class="muted">${e.blurb || ''}</span></button>`).join('')}</div>`;
  return `<h2>Settings</h2>
    <h3 class="set-h">Camp layout</h3>${pick(LAYOUTS, layoutId(), 'layout')}
    <h3 class="set-h">Skill tree</h3>${pick(TREES, treeId(), 'treelayout')}
    <h3 class="set-h">Dungeon look</h3>${envs}
    ${soundSettingsHtml()}
    <h3 class="set-h">Cheats</h3>
    <button class="toggle cheat-toggle ${save.cheat ? 'on' : ''}" data-act="cheat"><span class="ttext"><b>Unlimited gold and gems</b><span class="muted">Everything in the camp is free while it's on. Your real purse is kept for when you switch it off.</span></span><span class="switch"><i></i></span></button>
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

// ---------------------------------------------------------------- the party
// Sit a hero in the first free seat (the fireside's bench, a hero page). A full fire says so.
function sitDown(id) {
  if (!save.heroes[id].owned || P.recoverLeft(save, id)) return false;
  if (save.party.includes(id)) return true;
  if (save.party.length >= save.slots) return false;
  save.party = [...save.party, id];
  return true;
}
function standUp(id) {
  save.party = save.party.filter((x) => x !== id);
  delete potionFor[id];
}
function toast(text) {
  let el = root.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; root.appendChild(el); }
  el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

// ---------------------------------------------------------------- what taps do
function onClick(e) {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const [act, arg, arg2] = el.dataset.act.split(':');
  const ok = () => { persist(); render(); };
  const no = () => { cue('deny'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  switch (act) {
    case 'place': goTo(arg === 'go' ? { at: 'go' } : { at: arg }); break;
    case 'back': goBack(); break;
    case 'tohome': goHome(); break;
    case 'hero': goTo({ at: 'hero', id: arg }); break;
    case 'slot': openSheet({ type: 'party', slot: +arg }); break;
    case 'seat': openSheet({ type: 'seat' }); break;
    case 'pick': {
      const slot = sheet.slot, id = arg || null;
      if (id && P.recoverLeft(save, id)) { no(); return; }
      const party = save.party.slice();
      if (id) { const j = party.indexOf(id); if (j >= 0) party[j] = party[slot] || null; }
      if (party[slot] && party[slot] !== id) delete potionFor[party[slot]];
      party[slot] = id;
      save.party = party.filter(Boolean).slice(0, save.slots);
      closeSheet(); ok(); pop(`[data-hero="${id}"]`); break;
    }
    case 'sit': {
      if (save.party.includes(arg)) { standUp(arg); cue('tap'); ok(); break; }
      if (!save.heroes[arg].owned) { goTo({ at: 'hero', id: arg }); break; }
      if (P.recoverLeft(save, arg)) { no(); toast(`${HEROES[arg].name} is resting.`); return; }
      if (!sitDown(arg)) { no(); toast(save.slots === 1 ? 'One seat by the fire. Stand someone up, or buy another seat from the trader.' : 'Every seat is taken. Stand someone up first.'); return; }
      ok(); pop(`[data-hero="${arg}"]`); break;
    }
    case 'stand': standUp(arg); focus = null; ok(); break;
    case 'focus': focus = focus === arg ? null : arg; render(); break;
    case 'unfocus': if (focus) { focus = null; render(); } break;
    case 'pack': openSheet({ type: 'pack', hero: arg || save.party[0] }); break;
    case 'packhero': sheet.hero = arg; renderSheet(); break;
    case 'givep': {
      const h = sheet.hero, mine = potionFor[h] || (potionFor[h] = []);
      const taken = Object.values(potionFor).reduce((a, l) => a + l.filter((p) => p === arg).length, 0);
      if (!mine.includes(arg) && mine.length < P.CARRY_MAX && taken < P.potionCount(save, arg)) { mine.push(arg); cue('tap'); }
      else { if (!mine.length) delete potionFor[h]; no(); return; }
      render(); break;
    }
    case 'takep': {
      const h = sheet.hero, mine = potionFor[h] || [], i = mine.indexOf(arg);
      if (i >= 0) mine.splice(i, 1);
      if (!mine.length) delete potionFor[h];
      render(); break;
    }
    case 'settings': openSheet({ type: 'settings' }); break;
    case 'layout': save.campLayout = arg; applyLook(); persist(); render(); break;
    case 'treelayout': save.treeLayout = arg; applyLook(); persist(); render(); break;
    case 'cheat': save.cheat = !save.cheat; persist(); render(); break;
    case 'env': setEnv(+arg); render(); break;
    case 'book': bookTab = arg; render(); break;
    case 'beast': openSheet({ type: 'beast', kind: arg }); break;
    case 'ware': openSheet({ type: 'ware', kind: arg, id: arg2 }); break;
    case 'upt': if (P.upgradeTrinket(save, arg)) { ok(); popGold(); } else no(); break;
    case 'mercs': save.mercs = !save.mercs; ok(); pop('.mercs'); break;
    case 'setout': goTo({ at: 'go' }); break;
    case 'enter': {
      const opts = P.runOptions(save, arg, potionFor);
      if (!opts.party.length && !opts.mercs) { no(); toast('Nobody is ready to go. Sit a hero at the fire, or hire the sellswords.'); return; }
      P.payForRun(save, opts); save.theme = arg; potionFor = {};
      persist(); hideCamp();
      onSetOut(opts);
      break;
    }
    case 'unlock': if (P.unlockHero(save, arg)) { ok(); pop('.hh-art'); } else no(); break;
    case 'speed': if (P.speedUp(save, arg)) ok(); else no(); break;
    case 'node': openSheet({ type: 'node', hero: view.id, node: arg }); break;
    case 'spin': wheelPick[view.id] = +arg; wheelSel = arg2 || null; render(); if (arg2) { const r = mainEl.querySelector(`.prow2[data-node="${arg2}"]`); if (r) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } break;
    case 'buynode': {
      const hero = sheet && sheet.type === 'node' ? sheet.hero : view.id;
      if (P.buyNode(save, hero, arg)) { ok(); pop(`[data-node="${arg}"]`); popGold(); } else no();
      break;
    }
    case 'tslot': openSheet({ type: 'trinket', hero: view.id, slot: +arg }); break;
    case 'equip': if (P.equip(save, sheet.hero, arg, sheet.slot)) { closeSheet(); ok(); } else no(); break;
    case 'unequip': if (P.unequip(save, sheet.hero, sheet.slot)) { closeSheet(); ok(); } else no(); break;
    case 'buyt': if (P.buyTrinket(save, arg)) { ok(); popGold(); } else no(); break;
    case 'buyp': if (P.buyPotion(save, arg || 'heal')) { ok(); popGold(); } else no(); break;
    case 'buys': if (P.buySlot(save, arg)) { closeSheet(); ok(); popGold(); } else no(); break;
    case 'closesheet': closeSheet(); if (view.at === 'hero') render(); break;
    case 'home': closeResult(); break;
  }
}
function pop(sel) { for (const el of root.querySelectorAll(sel)) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } }
function popGold() { cue('buy'); for (const el of root.querySelectorAll('.purse')) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } }

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
