// The Book (round 13, lane K): rebuilt around a live preview. The designer: "On every ability I want the preview clips
// you made in riffle to be shown (can be simulated not recorded) for every unit and ability and tier. Will show in the
// book/ bestiary. You can select the hero and their tier ... Probably overhaul the book ui overall", and "All status
// effects and trinkets should have previews aswell".
// One screen for a phone held in one hand, top to bottom:
//   the bar        back, what you're looking at, how many you've met
//   the stage      the live preview (preview.js), with what's playing and its tier or rank written on it
//   the page       the thing's words and numbers, then its moves as big rows; tapping a row plays it on the stage
//   the dial       tier 0 / I / II / III for a hero, Normal / Elite / Major for a monster (in thumb reach)
//   the shelf      a sideways strip of every hero, monster (by dungeon), status, trinket and potion
//   the tabs       Heroes · Monsters · Statuses · Items
// The camp opens it from the book on the stump (camp.js go('book')); CAMP.setMode('book') still does.
import { HEROES, HERO_IDS, freeNodes, tierBuild, STATS, statsFor } from './heroes.js';
import { DEFS } from './units.js';
import { makeWorld, spawn } from './sim.js';
import { initKit } from './kits.js';
import { numbersOf, quietly } from './numbers.js';
import { battleFoe } from './dungeon.js';
import { ELITE, MAJOR } from './elites.js';
import { STATUS } from './statuses.js';
import { beastFun, beastHabit, trinketFun, POTION_FUN, STATUSES } from './bestiary.js';
import { ELITE_MOVE } from './movetext.js';
import * as P from './progress.js';
import { icon } from './icons.js';
import { portrait } from './inspect.js';
import { I, ROLE, ROLE_COL, roman, face, gold } from './ui-kit.js';
import { foeCount, num } from './stats-ui.js';
import { cue } from './sfx.js';
import { makePlayer } from './preview.js';
import { heroMoves, foeMoves, foeGroups, statusIds, statusHow, canRank, sceneOf, MAJOR_KEY } from './preview-sim.js';

const TABS = [['heroes', 'Heroes'], ['monsters', 'Monsters'], ['statuses', 'Statuses'], ['items', 'Items']];
const RANKS = ['Normal', 'Elite', 'Major'];
// the major's moves in words (elites.js MAJOR_MOVES, the comments there)
const MAJOR_WORDS = { quake: 'A slam that shakes the floor all round it.', volley: 'A ring of shots out all round.',
  charge: 'A long charge with a short tell.', call: 'Calls help from its dungeon\'s own roster.' };
const STATUS_WORDS = { burn: 'fire', chill: 'cold', poison: 'poison', shock: 'lightning', wet: 'water', curse: 'curses', radiance: 'holy light', entangle: 'roots', stagger: 'staggering' };
const FROM_WORDS = { frozen: 'chill', sick: 'poison', radiant: 'radiance', hexed: 'curse', tangled: 'entangle', ko: 'stagger' };
const SCENE_WORDS = { down: 'The wearer takes a blow that would bring them down.', low: 'The wearer is knocked below a third of their health.',
  kill: 'The wearer fells dummies.', friendDown: 'A friend goes down.', crowd: 'Dummies crowd round the wearer.', burnFoe: 'The dummies are burning.',
  fire: 'The wearer stands in flames.', poison: 'The dummies\' blows poison.', ranged: 'An archer shoots down a line of dummies.',
  hook: 'A dummy far off goes after a friend.', walk: 'The wearer walks about.', hurt: 'The wearer is hurt and fighting.', drink: 'The hero is badly hurt with nobody close.',
  fight: 'The wearer trades blows with the dummies.' };

let el = null, save = null, onBack = null, player = null;
const st = { tab: 'heroes', hero: null, tier: 3, hmove: 'attack', foe: null, rank: 0, fmove: null, status: null, item: null };
let shelfKey = '';

export function openBook(opts) {
  save = opts.save; onBack = opts.onBack;
  if (bookOpen()) { render(false); return; } // the camp redrew behind it: keep what's playing
  el = document.getElementById('book');
  if (!el) { el = document.createElement('div'); el.id = 'book'; document.body.appendChild(el); }
  if (!el._wired) { el._wired = true; el.addEventListener('click', onClick); }
  el.classList.remove('hidden');
  if (!st.hero) st.hero = HERO_IDS.find((id) => save.heroes[id] && save.heroes[id].owned) || HERO_IDS[0];
  shelfKey = '';
  render(true);
}
export function closeBook() {
  if (player) player.stop();
  if (el) el.classList.add('hidden');
}
export const bookOpen = () => !!(el && !el.classList.contains('hidden'));
// for the test tools: pick things without tapping
export const BOOK = { state: st, set(o) { Object.assign(st, o); shelfKey = ''; render(true); }, get player() { return player; } };
if (typeof window !== 'undefined') window.BOOK = BOOK;

// ---------------------------------------------------------------- who is in the Book
const owned = (id) => !!(save.heroes[id] && save.heroes[id].owned);
const metFoe = (k) => !!save.cheat || !!((save.seen && save.seen[k] && save.seen[k].met) || (foeCount(save, k) || {}).n);
let groups = null;
const foeGroupsCached = () => groups || (groups = foeGroups());
const items = () => [...P.shopTrinkets().map((t) => ({ k: 't', id: t.id })), ...Object.keys(P.POTIONS).map((id) => ({ k: 'p', id }))];
const statusList = () => statusIds().filter((id) => STATUSES[id] || STATUS[id]);

// ---------------------------------------------------------------- the frame
function render(replay) {
  if (!el) return;
  const tab = st.tab;
  if (tab === 'monsters' && (!st.foe || !metFoe(st.foe))) st.foe = foeGroupsCached().flatMap((g) => g.kinds).find(metFoe) || null;
  if (tab === 'statuses' && !st.status) st.status = statusList()[0];
  if (tab === 'items' && !st.item) st.item = items()[0];
  const page = ({ heroes: heroPage, monsters: foePage, statuses: statusPage, items: itemPage }[tab])();
  const metN = foeGroupsCached().reduce((a, g) => a + g.kinds.filter(metFoe).length, 0), allN = foeGroupsCached().reduce((a, g) => a + g.kinds.length, 0);
  const sk = tab + ':' + (tab === 'heroes' ? st.hero : tab === 'monsters' ? st.foe : tab === 'statuses' ? st.status : st.item && st.item.id);
  const shelfHtml = shelf();
  if (!el.firstChild || el.dataset.built !== '1') {
    el.innerHTML = `<div class="bk">
      <div class="bk-bar"><button class="top-back" data-bk="back" aria-label="back">${I.back}</button><div class="bk-title"></div><span class="bk-count"></span></div>
      <div class="bk-stage"><canvas class="bk-cv"></canvas><div class="bk-tag"></div><div class="bk-lock hidden"></div><i class="bk-prog"><b></b></i><div class="bk-meter hidden"></div></div>
      <div class="bk-page"></div>
      <div class="bk-dial"></div>
      <div class="bk-shelf"></div>
      <div class="bk-tabs"></div></div>`;
    el.dataset.built = '1';
    if (player) player.destroy();
    player = makePlayer(el.querySelector('.bk-cv'), { onFrame: frameUi, onError: () => { const l = el.querySelector('.bk-lock'); l.textContent = 'This preview broke. It has been noted.'; l.classList.remove('hidden'); } });
  }
  el.dataset.tab = tab;
  el.querySelector('.bk-title').innerHTML = page.title;
  el.querySelector('.bk-count').innerHTML = tab === 'monsters' ? `${metN}/${allN} met` : tab === 'heroes' ? `${HERO_IDS.filter(owned).length}/${HERO_IDS.length} yours` : '';
  const pg = el.querySelector('.bk-page'), keepScroll = pg.dataset.key === sk ? pg.scrollTop : 0;
  pg.innerHTML = page.html; pg.dataset.key = sk; pg.scrollTop = keepScroll;
  el.querySelector('.bk-dial').innerHTML = page.dial || '';
  el.querySelector('.bk-dial').classList.toggle('hidden', !page.dial);
  el.querySelector('.bk-tabs').innerHTML = TABS.map(([k, n]) => `<div role="button" class="bk-tab ${tab === k ? 'on' : ''}" data-bk="tab:${k}">${n}</div>`).join('');
  const sh = el.querySelector('.bk-shelf');
  if (shelfKey !== tab + '|' + shelfHtml.length + '|' + sk) {
    const left = sh.scrollLeft; sh.innerHTML = shelfHtml; shelfKey = tab + '|' + shelfHtml.length + '|' + sk; sh.scrollLeft = left;
    const on = sh.querySelector('.on'); if (on && replay) { const r = on.getBoundingClientRect(), R = sh.getBoundingClientRect(); if (r.left < R.left + 8 || r.right > R.right - 8) sh.scrollLeft += r.left - R.left - R.width / 2 + r.width / 2; }
  }
  if (replay) play(page.spec, page.tag);
  else setTag(page.tag);
}
function setTag(tag) { const t = el.querySelector('.bk-tag'); if (t) t.innerHTML = tag || ''; }
function play(spec, tag) {
  setTag(tag);
  const lock = el.querySelector('.bk-lock'), meter = el.querySelector('.bk-meter');
  meter.classList.add('hidden'); meter.innerHTML = '';
  if (!spec) { player.stop(); lock.textContent = 'Nothing here yet.'; lock.classList.remove('hidden'); return; }
  const S = player.play(spec);
  if (S && S.locked) { lock.innerHTML = `${I.lock}<span>${S.why}</span>`; lock.classList.remove('hidden'); } else lock.classList.add('hidden');
  if (spec.t === 'status') meter.classList.remove('hidden');
}
// what changes as it plays: the loop's progress, a status's fill
function frameUi(S) {
  const b = el.querySelector('.bk-prog b'); if (b) b.style.width = Math.min(100, 100 * S.t / S.loop).toFixed(1) + '%';
  if (S.spec.t === 'status' && S.hero) {
    const m = el.querySelector('.bk-meter'), id = S.spec.id, src = FROM_WORDS[id] || id, u = S.hero;
    if (STATUS[src]) {
      const need = typeof STATUS[src].need === 'function' ? STATUS[src].need(u) : STATUS[src].need, v = (u.st && u.st[src]) || 0;
      const burst = u.bursts && u.bursts[src] != null && S.w.time - u.bursts[src] < 0.6;
      const html = `<span class="cap">${STATUSES[src] ? STATUSES[src].name : src}</span><i class="bk-fill ${burst ? 'burst' : ''}" style="--c:${STATUS[src].col}"><b style="width:${Math.min(100, 100 * v / need).toFixed(0)}%"></b></i><span class="bk-mv">${burst ? 'Burst!' : Math.round(v) + ' / ' + need}</span>`;
      if (m._h !== html) { m.innerHTML = html; m._h = html; }
    }
  }
}

// ---------------------------------------------------------------- heroes
const numbersCache = new Map();
function heroNumbersAt(id, tier) {
  const key = id + ':' + tier;
  if (!numbersCache.has(key)) {
    let n = null;
    try { n = quietly(() => { const w = makeWorld(400, 400), u = spawn(w, id, 200, 200, { level: 1 }); initKit(u, id, { nodes: { ...freeNodes(id), ...tierBuild(id, tier) } }, 1); return numbersOf(u); }); } catch (e) { n = null; }
    numbersCache.set(key, n);
  }
  return numbersCache.get(key);
}
const f1 = (v) => (v >= 10 ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1));
function statLine(n, base) {
  if (!n) return '';
  const cells = [['Hit', Number.isFinite(n.hit) && n.hit > 0 ? f1(n.hit) : '–', base && base.hit], ['Hits/s', n.aps > 0 ? n.aps.toFixed(2) : '–', base && base.aps], ['Reach', Math.round(n.range), base && base.range],
    ['Health', num(n.hp), base && base.hp], ['Armour', Math.round((n.armor || 0) * 10) / 10, base && base.armor], ['Speed', Math.round(n.speed), base && base.speed]];
  const raw = [n.hit, n.aps, n.range, n.hp, n.armor || 0, n.speed];
  return `<div class="bk-stats">${cells.map(([k, v, b], i) => `<div class="${b != null && raw[i] > b + 1e-6 ? 'up' : ''}"><b>${v}</b><span>${k}</span></div>`).join('')}</div>`;
}
// what the web adds at this tier, as short chips ("+16% damage")
function webChips(id, tier) {
  if (!tier || !STATS) return '';
  const nodes = tierBuild(id, tier), chips = [];
  try {
    const s = statsFor(id, nodes), pct = (f) => Math.round(f * 100);
    for (const [k, v] of Object.entries(s)) if (k !== 'ab' && v > 0 && STATS[k]) chips.push(STATS[k].line(pct(v)));
  } catch (e) { return ''; }
  return chips.length ? `<div class="bk-chips">${chips.map((c) => `<span>${c}</span>`).join('')}</div>` : '';
}
function heroPage() {
  const id = st.hero, h = HEROES[id], tier = st.tier, mine = owned(id);
  const moves = heroMoves(id);
  if (!moves.find((m) => m.move === st.hmove)) st.hmove = 'attack';
  const cur = moves.find((m) => m.move === st.hmove);
  const n = heroNumbersAt(id, tier), base = tier ? heroNumbersAt(id, 0) : null;
  const capOf = (m) => (m.kind === 'attack' ? 'Attack' : m.kind === 'trait' ? 'Trait' : `Ability ${m.i + 1} · ${m.ab.cd}s`);
  const icoOf = (m) => (m.kind === 'attack' ? I.sword : m.kind === 'trait' ? I.crown : icon('ability', m.move));
  // what's playing, first: its words, and for an ability every tier's line with this tier's lit (what it adds)
  const desc = cur.kind === 'attack' ? h.attack.desc : cur.kind === 'trait' ? h.trait.desc : cur.ab.desc;
  let ladder = '';
  if (cur.kind === 'ability') ladder = `<ol class="mv-tiers">${cur.ab.tiers.map((t, k) => `<li class="${k + 1 <= tier ? 'got' : ''} ${k + 1 === tier ? 'now' : ''}"><i>${roman(k + 1)}</i><span>${t}</span></li>`).join('')}</ol>`
    + (tier < 1 ? `<p class="mv-note">${I.lock} Tier 0 has no abilities yet. Pick tier I, II or III below to see it.</p>` : '');
  if (cur.kind === 'trait') ladder = `<p class="mv-note">Shown in a short spar: the dummies hit back${/down|fall|reviv|friend|ally/i.test(desc) ? ', and someone goes down' : ''}.</p>`;
  const now = `<div class="bk-now"><span class="mv-ico ${cur.kind === 'ability' ? 'ab' : ''}">${icoOf(cur)}</span><div class="mv-mid"><span class="cap">${capOf(cur)}</span><b>${cur.name}</b></div>
      <span class="bk-who">${face(id, 34)}</span></div><p class="mv-desc">${desc}</p>${ladder}`;
  const rows = moves.map((m) => {
    const on = m.move === st.hmove, locked = m.kind === 'ability' && tier < 1;
    const pips = m.kind === 'ability' ? `<span class="mv-pips">${[1, 2, 3].map((k) => `<i class="${k <= tier ? 'lit' : ''}">${roman(k)}</i>`).join('')}</span>` : '';
    return `<div role="button" class="mv ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-bk="hmove:${m.move}"><span class="mv-ico ${m.kind === 'ability' ? 'ab' : ''}">${icoOf(m)}</span><div class="mv-mid"><span class="cap">${capOf(m)}</span><b>${m.name}</b></div>${locked ? `<span class="mv-lock">${I.lock}</span>` : pips}${on ? '<span class="mv-play">▶</span>' : ''}</div>`;
  }).join('');
  const html = `<div class="bk-card">${now}</div>
    <div class="bk-moves">${rows}</div>
    <div class="bk-head" style="--rc:${ROLE_COL[h.role]}">${face(id, 40)}<div class="bk-hm"><b class="bk-name">${h.name}</b><span class="cap" style="color:${ROLE_COL[h.role]}">${ROLE[h.role]}${mine ? '' : ' · not recruited'}</span></div>
      <span class="bk-tierbig">${tier ? 'Tier ' + roman(tier) : 'Tier 0'}</span></div>
    ${statLine(n, base)}<p class="bk-small quiet">${tier ? `Tier ${roman(tier)}: every node of the skill web out to shell ${tier === 3 ? '3 (the whole web)' : tier}, at level 1. Teal numbers are up on tier 0.` : 'Tier 0: nothing bought, level 1.'}</p>${webChips(id, tier)}
    <p class="bk-blurb">${h.blurb || ''}</p>`;
  const dial = `<span class="cap dial-cap">Tier</span><div class="bk-seg">${[0, 1, 2, 3].map((t) => `<div role="button" class="${t === tier ? 'on' : ''}" data-bk="tier:${t}">${t ? roman(t) : '0'}</div>`).join('')}</div>`;
  const tag = `<b>${cur.name}</b><span>${cur.kind === 'attack' ? 'attack' : cur.kind === 'trait' ? 'trait' : (tier ? 'tier ' + roman(tier) : 'locked')}</span>`;
  return { title: h.name, html, dial, spec: { t: 'hero', id, move: st.hmove, tier }, tag };
}

// ---------------------------------------------------------------- monsters
function foeNumbersAt(k, rank) {
  const key = 'f:' + k + ':' + rank;
  if (!numbersCache.has(key)) {
    let n = null;
    try { n = quietly(() => { const w = makeWorld(400, 400); return numbersOf(battleFoe(w, k, 200, 200, 1, rank)); }); } catch (e) { n = null; }
    numbersCache.set(key, n);
  }
  return numbersCache.get(key);
}
function attackWords(d) {
  const carries = Object.keys(STATUS_WORDS).filter((s) => d[s] > 0).map((s) => STATUS_WORDS[s]);
  const what = (d.atkCd || 0) >= 99 ? 'It has no plain attack; everything it does is in how it fights.' : d.role === 'ranged' ? 'Its plain shots.' : 'Its plain blows.';
  return what + (carries.length ? ` They carry ${carries.join(' and ')}.` : '');
}
function foePage() {
  const k = st.foe;
  if (!k) return { title: 'Monsters', html: '<p class="bk-empty">Nobody met yet. The monsters you meet in the dungeons are written in here.</p>', spec: null, tag: '' };
  const d = DEFS[k], rk = canRank(k) ? st.rank : 0, moves = foeMoves(k, rk), fc = foeCount(save, k), s = (save.seen || {})[k] || { met: 0, beaten: 0 };
  if (!moves.find((m) => m.move === st.fmove)) st.fmove = moves.find((m) => m.move === 'kit') ? 'kit' : moves[0].move;
  const cur = moves.find((m) => m.move === st.fmove);
  const g = foeGroupsCached().find((x) => x.kinds.includes(k));
  const words = (m) => m.move === 'attack' ? attackWords(d) : m.move === 'kit' ? (beastHabit(k) || 'How it fights.')
    : m.move === 'elite' ? (ELITE_MOVE[k] || ELITE_MOVE[d.eliteAs] || 'Something extra on top of its kit.')
    : MAJOR_WORDS[m.key] + (m.call ? ' ' + MAJOR_WORDS.call : '');
  const title = { attack: 'Attack', kit: 'How it fights', elite: 'Elite move', major: 'Major move' };
  const ico = { attack: I.sword, kit: I.skull, elite: '<span class="star">★</span>', major: I.crown };
  const now = `<div class="bk-now"><span class="mv-ico">${ico[cur.move]}</span><div class="mv-mid"><span class="cap">${d.name} · ${RANKS[rk].toLowerCase()}</span><b>${title[cur.move]}</b></div>
      <span class="bk-who"><span class="b-pic sm"><img src="${portrait(k)}" alt=""></span></span></div><p class="mv-desc">${words(cur)}</p>`;
  const rows = moves.map((m) => `<div role="button" class="mv ${m.move === st.fmove ? 'on' : ''} mv-${m.move}" data-bk="fmove:${m.move}"><span class="mv-ico">${ico[m.move]}</span>
      <div class="mv-mid"><span class="cap">${title[m.move]}</span><b class="mv-short">${words(m).split(/[.;]/)[0]}</b></div>${m.move === st.fmove ? '<span class="mv-play">▶</span>' : ''}</div>`).join('');
  const n = foeNumbersAt(k, rk), base = rk ? foeNumbersAt(k, 0) : null;
  const res = Object.entries(d.res || {}).filter(([, v]) => v !== 1);
  const rankNote = rk === 1 ? `An elite: ${ELITE.hp}x health, ${ELITE.dmg}x damage, ${ELITE.speed}x as quick, one trinket.` : rk === 2 ? `A major: ${MAJOR.hp}x health (less for big kinds), ${MAJOR.dmg}x damage, two trinkets.` : '';
  const html = `<div class="bk-card">${now}</div><div class="bk-moves">${rows}</div>
    <div class="bk-head"><span class="b-pic"><img src="${portrait(k)}" alt=""></span><div class="bk-hm"><b class="bk-name">${d.name}</b><span class="cap">${g ? g.name : ''}${d.boss ? ' · boss' : ''}</span></div>
      <span class="bk-tierbig">${fc && fc.n ? num(fc.n) + ' <small>defeated</small>' : s.met + ' <small>met</small>'}</span></div>
    ${statLine(n, base)}${rankNote ? `<p class="bk-small quiet">${rankNote}</p>` : ''}
    ${res.length ? `<div class="bk-res">${res.map(([key, v]) => `<span class="${v < 1 ? 'res' : 'weak'}">${icon('status', key)}${v === 0 ? 'Immune to' : v < 1 ? 'Shrugs off' : 'Weak to'} ${STATUS_WORDS[key] || key}</span>`).join('')}</div>` : ''}
    <p class="bk-fun">${beastFun(k)}</p>
    ${fc && fc.n ? `<p class="bk-small quiet">${[fc.elite ? `${num(fc.elite)} elite` : '', fc.mini ? `${num(fc.mini)} as a mini-boss` : '', fc.boss ? `${num(fc.boss)} as the boss` : ''].filter(Boolean).join(' · ')}</p>` : ''}`;
  const dial = canRank(k) ? `<div class="bk-seg three">${RANKS.map((r, i) => `<div role="button" class="${i === rk ? 'on' : ''} r${i}" data-bk="rank:${i}">${r}</div>`).join('')}</div>`
    : `<p class="bk-small quiet dial-note">${d.boss ? 'A boss comes as it is: no elite or major.' : 'Comes only as it is.'}</p>`;
  const tag = `<b>${d.name}</b><span>${cur.move === 'elite' || cur.move === 'major' ? title[cur.move] : RANKS[rk]}</span>`;
  return { title: d.name, html, dial, spec: { t: 'foe', id: k, move: st.fmove, rank: rk }, tag };
}

// ---------------------------------------------------------------- statuses
function statusPage() {
  const id = st.status, s = STATUSES[id] || { name: id, desc: '' }, how = statusHow(id), B = STATUS[id];
  const src = FROM_WORDS[id];
  const rules = [];
  if (B) {
    const need = typeof B.need === 'function' ? 'about 100 (more after each freeze)' : B.need;
    rules.push(`Builds up from hits to ${need}, then bursts.`, `Wears off by ${B.decay} a second when nothing adds to it.`, B.after ? `After a burst it drops to ${B.after}, not to nothing.` : 'A burst empties it.');
  } else if (src && STATUSES[src]) rules.push(`What ${STATUSES[src].name.toLowerCase()} bursts into when it fills.`);
  else if (how === 'put') rules.push('Put on by a move or an item, for a few seconds.');
  const html = `<div class="bk-head"><span class="bk-big-ico">${icon('status', id)}</span><div class="bk-hm"><b class="bk-name">${s.name}</b><span class="cap">${B ? 'Builds up, then bursts' : src ? 'A burst\'s result' : 'Timed'}</span></div></div>
    <p class="bk-desc">${s.desc}</p>
    ${rules.length ? `<ul class="bk-rules">${rules.map((r) => `<li>${r}</li>`).join('')}</ul>` : ''}
    <p class="bk-small quiet">On the stage: a goblin sparring with a dummy${B || src ? `, ${(STATUSES[src || id] || { name: id }).name.toLowerCase()} building on it until it bursts` : ''}; a friend stands by.</p>
    ${whoBrings(src || id)}
    <div class="bk-sec"><span class="cap">Every status</span></div>
    <div class="bk-list">${statusList().map((x) => `<div role="button" class="bk-row ${x === id ? 'on' : ''}" data-bk="status:${x}"><span class="bk-sico">${icon('status', x)}</span><div class="mv-mid"><b>${(STATUSES[x] || { name: x }).name}</b><span class="quiet small">${((STATUSES[x] || {}).desc || '').split('.')[0]}.</span></div></div>`).join('')}</div>`;
  return { title: 'Statuses', html, spec: { t: 'status', id }, tag: `<b>${s.name}</b>` };
}

// Who puts a build-up status on: heroes and met monsters whose own blows carry it (their def says so).
function whoBrings(k) {
  if (!STATUS[k]) return '';
  const heroes = HERO_IDS.filter((h) => DEFS[h] && DEFS[h][k] > 0).map((h) => HEROES[h].name);
  const foes = foeGroupsCached().flatMap((g) => g.kinds).filter((f) => metFoe(f) && DEFS[f] && (DEFS[f][k] > 0 || (DEFS[f].hitSt && DEFS[f].hitSt[k] > 0))).map((f) => DEFS[f].name);
  if (!heroes.length && !foes.length) return '';
  return `<div class="bk-sec"><span class="cap">Whose blows carry it</span></div><p class="bk-small">${[...heroes, ...foes].join(' · ')}</p>`;
}

// ---------------------------------------------------------------- trinkets and potions
function itemPage() {
  const it = st.item;
  if (it.k === 'p') {
    const p = P.POTIONS[it.id], n = P.potionCount(save, it.id);
    const html = `<div class="bk-head"><span class="bk-big-ico">${icon('potion', it.id)}</span><div class="bk-hm"><b class="bk-name">${p.name}</b><span class="cap">Potion · ${gold(p.price)}</span></div><span class="bk-tierbig">${n} <small>in the bag</small></span></div>
      <p class="bk-desc">${p.desc}</p><p class="bk-fun">${POTION_FUN[it.id] || ''}</p>
      <p class="bk-small quiet">On the stage: ${stageWords(it.id)}</p>${itemList()}`;
    return { title: 'Items', html, spec: { t: 'potion', id: it.id }, tag: `<b>${p.name}</b>` };
  }
  const t = P.trinketInfo(it.id), r = P.RARITY[t.rarity];
  const have = save.trinkets.filter((x) => x === it.id).length, worn = HERO_IDS.filter((h) => save.heroes[h].trinkets.includes(it.id)).map((h) => HEROES[h].name);
  const html = `<div class="bk-head"><span class="bk-big-ico" style="--rar:${r.color}">${icon('trinket', it.id, '', t.color)}</span><div class="bk-hm"><b class="bk-name">${t.name}</b><span class="cap" style="color:${r.color}">${r.name} trinket</span></div></div>
    <p class="bk-desc">${t.desc}</p><p class="bk-fun">${trinketFun(it.id)}</p>
    ${have + worn.length ? `<p class="bk-small quiet">You have ${have ? `${have} in the chest` : ''}${have && worn.length ? ' · ' : ''}${worn.length ? 'worn by ' + worn.join(', ') : ''}</p>` : ''}
    <p class="bk-small quiet">On the stage: ${stageWords(it.id)}</p>${itemList()}`;
  return { title: 'Items', html, spec: { t: 'trinket', id: it.id }, tag: `<b>${t.name}</b>` };
}

const stageWords = (id) => { const t = SCENE_WORDS[sceneOf({ id })] || SCENE_WORDS.fight; return t[0].toLowerCase() + t.slice(1); };
function itemList() {
  const row = (it, ico, name, sub) => `<div role="button" class="bk-row ${st.item && st.item.k === it.k && st.item.id === it.id ? 'on' : ''}" data-bk="item:${it.k}:${it.id}">${ico}<div class="mv-mid"><b>${name}</b><span class="quiet small">${sub}</span></div></div>`;
  const all = items();
  const tr = all.filter((it) => it.k === 't').map((it) => { const t = P.trinketInfo(it.id), r = P.RARITY[t.rarity]; return row(it, `<span class="bk-sico" style="--rar:${r.color}">${icon('trinket', it.id, '', t.color)}</span>`, t.name, `<span style="color:${r.color}">${r.name}</span> · ${t.desc}`); }).join('');
  const po = all.filter((it) => it.k === 'p').map((it) => row(it, `<span class="bk-sico">${icon('potion', it.id)}</span>`, P.POTIONS[it.id].name, P.POTIONS[it.id].desc)).join('');
  return `<div class="bk-sec"><span class="cap">Trinkets</span></div><div class="bk-list">${tr}</div><div class="bk-sec"><span class="cap">Potions</span></div><div class="bk-list">${po}</div>`;
}

// ---------------------------------------------------------------- the shelf
function shelf() {
  const tile = (act, on, pic, name, cls = '') => `<div role="button" class="bk-it ${on ? 'on' : ''} ${cls}" ${act ? `data-bk="${act}"` : ''}>${pic}<span>${name}</span></div>`;
  if (st.tab === 'heroes') return HERO_IDS.map((id) => tile(`hero:${id}`, id === st.hero, face(id, 46), HEROES[id].name, owned(id) ? '' : 'notyet')).join('');
  if (st.tab === 'monsters') return foeGroupsCached().map((g) => `<div class="bk-grp"><span>${g.name}</span></div>` + g.kinds.map((k) => metFoe(k)
    ? tile(`foe:${k}`, k === st.foe, `<span class="b-pic"><img src="${portrait(k)}" alt=""></span>`, DEFS[k].name, DEFS[k].boss ? 'boss' : '')
    : tile('', false, `<span class="b-pic unknown"><img src="${portrait(k)}" alt=""></span>`, '???', 'unknown')).join('')).join('');
  if (st.tab === 'statuses') return statusList().map((id) => tile(`status:${id}`, id === st.status, `<span class="bk-sico">${icon('status', id)}</span>`, (STATUSES[id] || { name: id }).name)).join('');
  return items().map((it) => {
    const on = st.item && st.item.k === it.k && st.item.id === it.id;
    if (it.k === 'p') return tile(`item:p:${it.id}`, on, `<span class="bk-sico">${icon('potion', it.id)}</span>`, P.POTIONS[it.id].name);
    const t = P.trinketInfo(it.id);
    return tile(`item:t:${it.id}`, on, `<span class="bk-sico" style="--rar:${P.RARITY[t.rarity].color}">${icon('trinket', it.id, '', t.color)}</span>`, t.name);
  }).join('');
}

// ---------------------------------------------------------------- taps
function onClick(e) {
  const t = e.target.closest('[data-bk]'); if (!t) return;
  const [a, b, c] = t.dataset.bk.split(':');
  switch (a) {
    case 'back': cue('tap'); closeBook(); if (onBack) onBack(); return;
    case 'tab': if (st.tab === b) return; st.tab = b; break;
    case 'hero': if (st.hero === b) return; st.hero = b; break;
    case 'tier': if (st.tier === +b) return; st.tier = +b; break;
    case 'hmove': if (st.hmove === b) { player.restart(); cue('tap'); return; } st.hmove = b; break;
    case 'foe': if (st.foe === b) return; st.foe = b; break;
    case 'rank': if (st.rank === +b) return; st.rank = +b; break;
    case 'fmove': if (st.fmove === b) { player.restart(); cue('tap'); return; } st.fmove = b; break;
    case 'status': st.status = b; break;
    case 'item': st.item = { k: b, id: c }; break;
    default: return;
  }
  cue('tap');
  render(true);
}
