// The Book (round 14, lane U): grids. The designer: "Very busy and packed together. Some repetitiveness. You can show
// multiple pages side by side I can swipe between like clash royal", and "There would be no bottom bar to navigate
// between enemies you would press back and it would open a page listing them all out in a grid. You could also see all
// heroes in 1 page, trinkets in another, status effect in another, dungeon overview in another."
// Five pages side by side (pager.js): Heroes · Monsters · Trinkets · Statuses · Dungeons. Each is a grid of cards and
// nothing else. A card opens the thing's own page over the grid; Back returns to the grid where it was left:
//   a hero, a monster          the unit page (js/unit.js), the same one the camp opens for a hero
//   a trinket, potion, status  one page: its live preview, its words, its numbers
//   a dungeon                  an overview: floors, who lives there, the boss, how far the party has got
// The camp opens it from the book on the stump (camp.js go('book')); CAMP.setMode('book') still does.
import { HEROES, HERO_IDS } from './heroes.js';
import { DEFS } from './units.js';
import { STATUS, HERO_STATUS, buildRow, buildValue } from './statuses.js';
import { trinketFun, POTION_FUN, STATUSES } from './bestiary.js';
import * as P from './progress.js';
import * as M from './meta.js';
import { icon, statIcon } from './icons.js';
import { portrait } from './inspect.js';
import { I, face, gold, themeColors } from './ui-kit.js';
import { foeCount, num } from './stats-ui.js';
import { cue } from './sfx.js';
import { makePlayer } from './preview.js';
import { foeGroups, statusIds, statusHow, statusWays } from './preview-sim.js';
import { THEMES, DUNGEON_ORDER } from './themes.js';
import { makePager } from './pager.js';
import { openUnit, closeUnit, unitOpen, cell, head } from './unit.js';

const TABS = [{ id: 'heroes', name: 'Heroes' }, { id: 'monsters', name: 'Monsters' }, { id: 'trinkets', name: 'Trinkets' }, { id: 'statuses', name: 'Statuses' }, { id: 'dungeons', name: 'Dungeons' }];
const FROM = { frozen: 'chill', sick: 'poison', radiant: 'radiance', hexed: 'curse', ko: 'stagger', charmed: 'charm', addled: 'confuse', terrified: 'fear', shackled: 'shackle' };
const INTO = { chill: 'frozen', poison: 'sick', radiance: 'radiant', curse: 'hexed', stagger: 'ko', charm: 'charmed', confuse: 'addled', fear: 'terrified', entangle: 'root', sleepy: 'sleep', shackle: 'shackled' };

// while the state a burst leaves is still on the fighter, the meter's right-hand picture stays lit
const STATE_ON = { chill: (u) => u.frozenT > 0, poison: (u) => u.sickT > 0, radiance: (u) => u.radiantT > 0, curse: (u) => !!u.hexed, stagger: (u) => u.koT > 0,
  charm: (u) => u.flipKind === 'charm', confuse: (u) => u.addledT > 0, fear: (u) => u.fearT > 0, entangle: (u) => u.rootT > 0, sleepy: (u) => u.sleepT > 0, shackle: (u) => u.shackledT > 0 };

let el = null, save = null, onBack = null, acts = null, pager = null, player = null;
let thing = null; // what's open over the grids: { t: 'trinket' | 'potion' | 'status' | 'dungeon', id, way }

export function openBook(opts) {
  save = opts.save; onBack = opts.onBack; acts = opts.acts || null;
  if (bookOpen()) { fill(); if (thing) thingBody(); return; } // the camp redrew behind it: keep the place and what's playing
  el = document.getElementById('book');
  if (!el) { el = document.createElement('div'); el.id = 'book'; document.body.appendChild(el); }
  if (!el._wired) { el._wired = true; el.addEventListener('click', onClick); }
  el.classList.remove('hidden');
  if (!pager) {
    el.innerHTML = `<div class="un bk"><header class="un-bar"><button class="top-back" data-bk="back" aria-label="back">${I.back}</button><div class="un-ttl"><b>The Book</b></div><span class="bk-count"></span></header><div class="un-pages"></div></div>
      <div class="bk-thing hidden"></div>`;
    pager = makePager(el.querySelector('.un-pages'), { tabs: TABS, at: 0, onChange: () => { cue('tap'); count(); } });
    for (const p of pager.pages) p.innerHTML = '<div class="un-scroll"></div>';
  }
  fill();
}
export function closeBook() {
  closeUnit();
  if (player) player.stop();
  if (el) el.classList.add('hidden');
}
export const bookOpen = () => !!(el && !el.classList.contains('hidden'));
// for the test tools: go to a page, open a card
export const BOOK = {
  tab(id) { pager.go(TABS.findIndex((t) => t.id === id), false); },
  open(t, id, o = {}) { if (t === 'hero' || t === 'foe') openCard(t, id, o); else openThing({ t, id, ...o }); },
  close() { closeUnit(); closeThing(); },
  get player() { return player; }, get thing() { return thing; }, get pager() { return pager; },
};
if (typeof window !== 'undefined') window.BOOK = BOOK;

// ---------------------------------------------------------------- who is in the Book
const owned = (id) => !!(save.heroes[id] && save.heroes[id].owned);
const metFoe = (k) => !!save.cheat || !!(DEFS[k] && DEFS[k].bookOpen) || !!((save.seen && save.seen[k] && save.seen[k].met) || (foeCount(save, k) || {}).n); // (round 19, lane spider19: def.bookOpen, a boss in no dungeon yet: its page is open unmet)
let groups = null;
const groupsOf = () => groups || (groups = foeGroups());
const statusList = () => statusIds().filter((id) => STATUSES[id] || STATUS[id]);
const tile = (act, pic, name, cls = '') => `<div ${act ? `role="button" data-bk="${act}"` : ''} class="tile ${cls}">${pic}<span>${name}</span></div>`;
const sec = (t, right = '') => `<div class="un-h"><span class="cap">${t}</span>${right ? `<span class="quiet small">${right}</span>` : ''}</div>`;
const beast = (k, cls = '') => `<span class="b-pic ${DEFS[k].boss ? 'boss' : ''} ${cls}"><img src="${portrait(k)}" alt=""></span>`;
const tico = (inner, rar) => `<span class="t-ico" ${rar ? `style="--rar:${rar}"` : ''}>${inner}</span>`;

// ---------------------------------------------------------------- the five grids
function fill() {
  const set = (id, html) => { const sc = pager.page(id).querySelector('.un-scroll'), top = sc.scrollTop; sc.innerHTML = html; sc.scrollTop = top; };
  // heroes: yours, then the rest
  const mine = HERO_IDS.filter(owned), rest = HERO_IDS.filter((id) => !owned(id));
  const hero = (id) => tile(`hero:${id}`, `<span class="t-face">${face(id, 62)}${owned(id) ? `<span class="lvl">${M.level(save, id)}</span>` : ''}</span>`, HEROES[id].name, owned(id) ? '' : 'notyet');
  set('heroes', `${sec('With you', mine.length)}<div class="tiles">${mine.map(hero).join('')}</div>${rest.length ? `${sec('Not recruited', rest.length)}<div class="tiles">${rest.map(hero).join('')}</div>` : ''}`);
  // monsters: by dungeon; the ones not met yet stay dark
  set('monsters', groupsOf().map((g) => {
    const met = g.kinds.filter(metFoe).length;
    return `${sec(g.name, `${met} of ${g.kinds.length}`)}<div class="tiles">${g.kinds.map((k) => (metFoe(k) ? tile(`foe:${k}`, beast(k), DEFS[k].name) : tile('', beast(k), '???', 'unknown'))).join('')}</div>`;
  }).join(''));
  // trinkets, then potions
  const tr = P.shopTrinkets().map((t) => tile(`trinket:${t.id}`, tico(icon('trinket', t.id, '', t.color), P.RARITY[t.rarity].color), t.name)).join('');
  const po = Object.keys(P.POTIONS).map((id) => tile(`potion:${id}`, tico(icon('potion', id)), P.POTIONS[id].name)).join('');
  set('trinkets', `${sec('Trinkets')}<div class="tiles">${tr}</div>${sec('Potions')}<div class="tiles">${po}</div>`);
  // statuses: what builds up, what a burst leaves, the rest
  const all = statusList(), st = (id) => tile(`status:${id}`, tico(icon('status', id)), (STATUSES[id] || { name: id }).name);
  const build = all.filter((id) => buildRow(id)), burst = all.filter((id) => !buildRow(id) && FROM[id]), other = all.filter((id) => !buildRow(id) && !FROM[id]); // (round 15, lane E: buildRow: Whirled and Spun build up too)
  set('statuses', `${sec('Build up, then burst')}<div class="tiles">${build.map(st).join('')}</div>${sec('What a burst leaves')}<div class="tiles">${burst.map(st).join('')}</div>${sec('Other states')}<div class="tiles">${other.map(st).join('')}</div>`);
  // dungeons: one card each, in the order they open
  set('dungeons', `<div class="dg-list">${DUNGEON_ORDER.filter((t) => THEMES[t]).map((t) => {
    const T = THEMES[t], s = P.dungeonState(save, t), open = s.open || !!save.cheat;
    const line = !open ? `${I.lock}<span>${M.dungeonLockText(t)}</span>` : s.cleared ? `<span>Boss beaten${s.cleared > 1 ? ' ' + s.cleared + ' times' : ''}</span>` : s.best ? `<span>Floor ${Math.min(3, s.best)} reached</span>` : '<span>Not entered yet</span>';
    return `<div role="button" class="dg ${open ? '' : 'shut'}" data-bk="dungeon:${t}">${swatch(T)}<div class="dg-mid"><b>${T.name}</b><span class="quiet small dg-line">${line}</span></div></div>`;
  }).join('')}</div>`);
  count();
}
function swatch(T) { const c = themeColors(T); return `<span class="dg-sw" style="background:${c.wall}"><i style="background:${c.floor}"></i><em style="background:${c.accent}"></em></span>`; }
function count() {
  const c = el.querySelector('.bk-count'); if (!c) return;
  const id = pager.id;
  c.textContent = id === 'heroes' ? `${HERO_IDS.filter(owned).length} of ${HERO_IDS.length}` : id === 'monsters' ? `${groupsOf().reduce((a, g) => a + g.kinds.filter(metFoe).length, 0)} of ${groupsOf().reduce((a, g) => a + g.kinds.length, 0)} met` : '';
}

// ---------------------------------------------------------------- a hero or a monster: the unit page
function openCard(t, id, o = {}) {
  openUnit({ save, kind: t, id, acts: t === 'hero' ? acts : null, onBack: () => { if (bookOpen()) fill(); }, ...o });
}

// ---------------------------------------------------------------- a trinket, a potion, a status, a dungeon
function openThing(th) {
  thing = th;
  const host = el.querySelector('.bk-thing');
  host.classList.remove('hidden');
  if (player) { player.destroy(); player = null; }
  const staged = th.t !== 'dungeon';
  host.innerHTML = `<div class="un"><header class="un-bar"></header>
    ${staged ? `<div class="pv-stage th-stage"><canvas class="pv-cv"></canvas><i class="pv-prog"><b></b></i></div><div class="th-meter hidden"></div><div class="th-ways hidden"></div>` : ''}
    <div class="un-scroll th-body"></div></div>`;
  if (staged) {
    player = makePlayer(host.querySelector('.pv-cv'), { onFrame: frameUi, onError: () => { host.querySelector('.th-body').innerHTML = '<p class="un-note">This preview broke. It has been noted.</p>'; } });
    play();
  }
  thingBody();
}
function closeThing() {
  if (player) player.stop();
  thing = null;
  const host = el && el.querySelector('.bk-thing'); if (host) { host.classList.add('hidden'); host.innerHTML = ''; }
}
function play() {
  const th = thing, host = el.querySelector('.bk-thing');
  const spec = th.t === 'status' ? { t: 'status', id: th.id, way: th.way } : { t: th.t, id: th.id };
  player.play(spec);
  // a status that builds up: its meter, under the stage (the cause on the left, what it bursts into on the right)
  const meter = host.querySelector('.th-meter'), ways = host.querySelector('.th-ways');
  if (th.t === 'status') {
    const src = FROM[th.id] || th.id, B = buildRow(src);
    meter.classList.toggle('hidden', !B);
    if (B) meter.innerHTML = `<span class="tm-i">${icon('status', src)}</span><i class="tm-bar" style="--c:${B.col}"><b></b></i><span class="tm-i tm-out">${icon('status', INTO[src] || src)}</span>`;
    const W = statusWays(th.id);
    ways.classList.toggle('hidden', !W);
    if (W) ways.innerHTML = `<div class="un-seg">${W.map((w) => `<div role="button" data-bk="way:${w.id}" data-way="${w.id}">${w.name}</div>`).join('')}</div>`;
  } else { meter.classList.add('hidden'); ways.classList.add('hidden'); }
}
// what changes as it plays: the loop's progress, a status's meter, which way this loop goes
function frameUi(S) {
  const host = el.querySelector('.bk-thing'); if (!host || !thing) return;
  const b = host.querySelector('.pv-prog b'); if (b) b.style.width = Math.min(100, 100 * S.t / S.loop).toFixed(1) + '%';
  if (S.spec.t !== 'status' || !S.hero) return;
  const src = FROM[S.spec.id] || S.spec.id, B = buildRow(src), u = S.hero;
  if (B) {
    // The meter fills, holds full for the burst's moment (lit), then falls to what the burst leaves. Round 13's showed
    // the value alone, which is emptied in the very step it fills: it jumped from nine tenths to nearly nothing with
    // "Burst!" swapped in beside it and the bar's length changing with the words ("freaks out when full").
    const need = typeof B.need === 'function' ? B.need(u) : B.need, v = buildValue(u, src);
    const since = u.bursts && u.bursts[src] != null ? S.w.time - u.bursts[src] : 99, held = since < 0.9, lit = held || (STATE_ON[src] ? STATE_ON[src](u) : false);
    const fillEl = host.querySelector('.tm-bar b'), meter = host.querySelector('.th-meter');
    if (fillEl) { const f = held ? 1 : Math.max(0, Math.min(1, v / need)); if (fillEl._f !== f) { fillEl._f = f; fillEl.style.width = (f * 100).toFixed(1) + '%'; } }
    if (meter && meter._lit !== lit) { meter._lit = lit; meter.classList.toggle('burst', lit); }
  }
  if (S.way) for (const w of host.querySelectorAll('[data-way]')) { const on = w.dataset.way === S.way; if (w.classList.contains('on') !== on) w.classList.toggle('on', on); }
}

function thingBody() {
  const th = thing, host = el.querySelector('.bk-thing'), barEl = host.querySelector('.un-bar'), body = host.querySelector('.th-body'), top = body.scrollTop;
  const bar = (pic, name, cap, capCol) => { barEl.innerHTML = `<button class="top-back" data-bk="thingback" aria-label="back">${I.back}</button>${pic}<div class="un-ttl"><b>${name}</b><span class="cap" ${capCol ? `style="color:${capCol}"` : ''}>${cap}</span></div>`; };
  if (th.t === 'trinket') {
    const t = P.trinketInfo(th.id), r = P.RARITY[t.rarity];
    const have = save.trinkets.filter((x) => x === th.id).length, worn = HERO_IDS.filter((h) => save.heroes[h].trinkets.includes(th.id));
    bar(tico(icon('trinket', th.id, '', t.color), r.color), t.name, `${r.name} trinket`, r.color);
    body.innerHTML = `<p class="th-desc">${t.desc}</p><p class="th-fun">${trinketFun(th.id)}</p>
      <div class="st-grid th-facts">${cell('gold', t.price, 'At the trader')}${cell('bag', have, 'In the chest')}${cell('tier', worn.length ? P.trinketLevel(save, th.id) : have ? P.trinketLevel(save, th.id) : '–', 'Level')}</div>
      ${worn.length ? `${sec('Worn by')}<div class="th-who">${worn.map((h) => face(h, 44)).join('')}</div>` : ''}`;
  } else if (th.t === 'potion') {
    const p = P.POTIONS[th.id];
    bar(tico(icon('potion', th.id)), p.name, 'Potion');
    body.innerHTML = `<p class="th-desc">${p.desc}</p><p class="th-fun">${POTION_FUN[th.id] || ''}</p>
      <div class="st-grid th-facts">${cell('gold', p.price, 'At the trader')}${cell('bag', P.potionCount(save, th.id), 'In the bag')}</div>`;
  } else if (th.t === 'status') {
    const id = th.id, s = STATUSES[id] || { name: id, desc: '' }, src = FROM[id], B = buildRow(id), how = statusHow(id);
    bar(tico(icon('status', id)), s.name, B ? 'Builds up, then bursts' : src ? `What ${(STATUSES[src] || { name: src }).name.toLowerCase()} bursts into` : how === 'put' ? 'Lasts a few seconds' : 'A state');
    const facts = B ? `<div class="st-grid th-facts">${cell('fill', typeof B.need === 'function' ? 100 : B.need, 'Fills at')}${cell('decay', B.decay, 'Fades / s')}${cell('fill', B.after || 0, 'After a burst')}</div>` : '';
    const who = whoBrings(src || id);
    body.innerHTML = `<p class="th-desc">${s.desc}</p>${facts}${who ? `${sec(HERO_STATUS[src || id] ? 'Who puts it on' : 'Whose blows carry it')}<p class="un-note">${who}</p>` : ''}`;
  } else dungeonBody(th.id, bar, body);
  body.scrollTop = top;
}
// Who puts a build-up status on: heroes and met monsters whose own blows carry it (their def says so).
function whoBrings(k) {
  if (HERO_STATUS[k]) return HERO_STATUS[k].by.filter((h) => HEROES[h]).map((h) => HEROES[h].name).join(' · '); // (round 15, lane E: the newer heroes' eight)
  if (!STATUS[k]) return '';
  const heroes = HERO_IDS.filter((h) => DEFS[h] && DEFS[h][k] > 0).map((h) => HEROES[h].name);
  const foes = groupsOf().flatMap((g) => g.kinds).filter((f) => metFoe(f) && DEFS[f] && (DEFS[f][k] > 0 || (DEFS[f].hitSt && DEFS[f].hitSt[k] > 0))).map((f) => DEFS[f].name);
  return [...heroes, ...foes].join(' · ');
}

// A dungeon: its floors with who lives on each, the mini-bosses and the boss, and how far the party has got. From what
// the save records (progress.js dungeonState: the deepest floor reached, boss kills, the floor a run can start at, which
// mini-bosses have fallen) and the tally of kinds defeated.
function dungeonBody(id, bar, body) {
  const T = THEMES[id], s = P.dungeonState(save, id), open = s.open || !!save.cheat, n = DUNGEON_ORDER.filter((t) => THEMES[t]).indexOf(id) + 1;
  bar(swatch(T), T.name, `Dungeon ${n}${open ? '' : ' · locked'}`);
  const pic = (k, ring = '') => (metFoe(k) ? `<div role="button" class="dg-foe ${ring}" data-bk="foe:${k}">${beast(k)}</div>` : `<div class="dg-foe unknown ${ring}">${beast(k)}</div>`);
  const floors = (T.floors || []).map((F, i) => {
    const kinds = [...new Set([...(F.enemies || []).map(([k]) => k), F.elite].filter((k) => k && DEFS[k]))];
    const last = i === T.floors.length - 1, end = last ? (T.bossKind && DEFS[T.bossKind] ? T.bossKind : T.boss) : F.mini || T.mini || T.warden;
    const done = last ? s.cleared > 0 : !!s.minis[i];
    return `${sec(`Floor ${i + 1} · ${F.name || ''}`, s.best > i || s.cleared ? (done ? (last ? 'boss beaten' : 'mini-boss beaten') : 'reached') : '')}
      <div class="dg-foes">${kinds.map((k) => pic(k)).join('')}${end && DEFS[end] ? pic(end, 'end') : ''}</div>`;
  }).join('');
  const beaten = groupsOf().filter((g) => g.id === id).flatMap((g) => g.kinds).reduce((a, k) => a + ((foeCount(save, k) || {}).n || 0), 0);
  body.innerHTML = `<p class="th-fun first">${T.blurb || ''}</p>
    <div class="st-grid th-facts">${cell('floor', `${Math.min(3, s.best)} / 3`, 'Deepest floor')}${cell('major', s.cleared, 'Boss beaten')}${cell('kills', num(beaten), 'Beaten here')}</div>
    ${open ? '' : `<p class="un-note dg-lock">${M.dungeonLockText(id)} to open it.</p>`}
    ${floors}
    <p class="un-note dg-note">Runs can start at floor ${s.checkpoint}. The save keeps the deepest floor, boss kills and mini-bosses beaten; it does not yet keep runs, deaths or the fastest clear for each dungeon.</p>`;
}

// ---------------------------------------------------------------- taps
function onClick(e) {
  const t = e.target.closest('[data-bk]'); if (!t) return;
  const [a, b] = t.dataset.bk.split(':');
  switch (a) {
    case 'back': cue('tap'); closeBook(); if (onBack) onBack(); return;
    case 'thingback': cue('tap'); closeThing(); return;
    case 'hero': case 'foe': cue('tap'); openCard(a, b); return;
    case 'trinket': case 'potion': case 'status': case 'dungeon': cue('tap'); openThing({ t: a, id: b }); return;
    case 'way': cue('tap'); thing.way = b; play(); return;
    default: return;
  }
}
export { unitOpen };
