// The unit page (round 14, lane U): one page for a hero or a monster, opened the same way from everywhere (a hero in
// the camp, a hero's or a monster's card in the Book, a row on the battle page). The designer:
//   "these bestiary screens should be the same ones that show when you select a unit. Where you go to change
//    equipment, read descriptions, upgrade etc. ... For hero's has these tabs/pages: main (set equipment and potion),
//    upgrades (web), preview, stats ... Enemies tabs: overview (times killed, found in: , description, etc), preview,
//    stats. There would be a top bar to switch between base, elite, and major ... no bottom bar to navigate between
//    enemies you would press back"
// Its pages sit side by side and are swiped between (pager.js). One thing a page:
//   a hero      Main (who it is, equipment, potions, the trait) · Upgrades (the skill web) · Preview · Stats
//   a monster   Overview (what it is, where, how many beaten, its moves in words) · Preview · Stats, with a
//               Base / Elite / Major switch on top that drives all three
// What a hero's page can do (wear a trinket, hand out potions, learn a node, recruit, sit at the fire, unlearn) is the
// camp's to do: the camp passes those in as `acts`, so the Book and the camp open the very same page.
import { HEROES } from './heroes.js';
import { DEFS } from './units.js';
import * as P from './progress.js';
import * as M from './meta.js';
import { icon, statIcon } from './icons.js';
import { portrait } from './inspect.js';
import { I, ROLE, ROLE_COL, roman, face, gold, mmss } from './ui-kit.js';
import { foeCount, num, breakdown } from './stats-ui.js';
import { cue } from './sfx.js';
import { makePlayer } from './preview.js';
import { heroMoves, foeMoves, canRank, makeStage, specKey, traitNote, foeGroups } from './preview-sim.js';
import { beastFun, beastHabit, STATUSES } from './bestiary.js';
import { ELITE_MOVE } from './movetext.js';
import { MAJOR_MOVES } from './elites.js';
import { mountTree } from './skilltree.js';
import { makePager } from './pager.js';
import { heroSheet, foeSheet, placesOf, PLACES, placeName, floorName } from './unit-stats.js';
import { THEMES } from './themes.js';
import { quietly } from './numbers.js';
import { setSeed } from './util.js';

const HERO_TABS = [{ id: 'main', name: 'Main' }, { id: 'upgrades', name: 'Upgrades' }, { id: 'preview', name: 'Preview' }, { id: 'stats', name: 'Stats' }];
const FOE_TABS = [{ id: 'overview', name: 'Overview' }, { id: 'preview', name: 'Preview' }, { id: 'stats', name: 'Stats' }];
const RANKS = ['Base', 'Elite', 'Major'];
export const MAJOR_WORDS = { quake: 'A slam that shakes the floor all round it.', volley: 'A ring of shots out all round.',
  charge: 'A long charge with a short tell.', call: 'Calls help from its dungeon\'s own roster.' };
export const STATUS_WORDS = { burn: 'fire', chill: 'cold', poison: 'poison', shock: 'lightning', wet: 'water', curse: 'curses', radiance: 'holy light', entangle: 'roots', stagger: 'staggering', charm: 'charm', confuse: 'confusion', sleepy: 'drowsiness', bleed: 'bleeding', fear: 'fear' };

let el = null, save = null, onBack = null, acts = null, pager = null, player = null, tree = null;
const st = { kind: null, id: null, tier: 0, move: 'attack', rank: 0, fmove: null, place: 0 };
const treeSel = {};

// ---------------------------------------------------------------- opening and closing
// opts: { save, kind: 'hero' | 'foe', id, onBack(), acts, page, rank }
export function openUnit(opts) {
  save = opts.save; onBack = opts.onBack || null; acts = opts.acts || null;
  el = document.getElementById('unit');
  if (!el) { el = document.createElement('div'); el.id = 'unit'; document.body.appendChild(el); }
  if (!el._wired) { el._wired = true; el.addEventListener('click', onClick); }
  const same = unitOpen() && st.kind === opts.kind && st.id === opts.id;
  el.classList.remove('hidden');
  if (same) { refreshUnit(save); if (opts.page != null) pager.go(pageIndex(opts.page), false); return; }
  st.kind = opts.kind; st.id = opts.id;
  if (st.kind === 'hero') {
    st.move = 'attack';
    st.tier = Math.max(0, ...HEROES[st.id].abilities.map((ab) => P.abilityTiers(save, st.id, ab.id)));
  } else {
    st.rank = canRank(st.id) ? Math.max(0, Math.min(2, opts.rank | 0)) : 0; st.fmove = null;
    const all = PLACES(), first = placesOf(st.id)[0];
    st.place = Math.max(0, first ? all.findIndex((p) => p.theme === first.theme && p.floor === first.floor) : 0);
  }
  build(opts.page);
}
export function closeUnit() {
  if (player) player.stop();
  if (el) el.classList.add('hidden');
}
export const unitOpen = () => !!(el && !el.classList.contains('hidden'));
// the save changed under it (a trinket worn, a node learned, a timer run out): redraw what shows it, keep what's playing
export function refreshUnit(s) {
  if (s) save = s;
  if (!unitOpen()) return;
  bar();
  if (st.kind === 'hero') { heroMain(); heroStats(); if (tree) tree.refresh(save); previewUi(false); respecUi(); }
  else { foeOverview(); foeStats(); }
}
// for the test tools
export const UNIT = { state: st, get player() { return player; }, get pager() { return pager; }, set(o) { Object.assign(st, o); if (st.kind === 'foe') { rankUi(); foeOverview(); foeStats(); } previewUi(true); } };
if (typeof window !== 'undefined') window.UNIT = UNIT;

const tabsOf = () => (st.kind === 'hero' ? HERO_TABS : FOE_TABS);
const pageIndex = (p) => (typeof p === 'number' ? p : Math.max(0, tabsOf().findIndex((t) => t.id === p)));
const owned = (id) => !!(save.heroes[id] && save.heroes[id].owned);

// ---------------------------------------------------------------- the frame
function build(page) {
  if (player) { player.destroy(); player = null; }
  tree = null;
  el.dataset.kind = st.kind;
  el.innerHTML = `<div class="un"><header class="un-bar"></header><div class="un-rank hidden"></div><div class="un-pages"></div></div>`;
  pager = makePager(el.querySelector('.un-pages'), { tabs: tabsOf(), at: pageIndex(page || 0), onChange: (i, id) => { cue('tap'); if (id === 'preview') player.resume(); } });
  const pv = pager.page('preview');
  pv.innerHTML = `<div class="pv"><div class="pv-stage"><canvas class="pv-cv"></canvas><span class="pv-lock hidden">${I.lock}</span><i class="pv-prog"><b></b></i></div>
    <div class="pv-cap"></div><div class="pv-moves"></div><div class="pv-dial"></div></div>`;
  player = makePlayer(pv.querySelector('.pv-cv'), { onFrame: (S) => { const b = pv.querySelector('.pv-prog b'); if (b) b.style.width = Math.min(100, 100 * S.t / S.loop).toFixed(1) + '%'; },
    onError: () => { const c = pv.querySelector('.pv-cap'); if (c) c.innerHTML = '<p class="pv-desc quiet">This preview broke. It has been noted.</p>'; } });
  bar();
  if (st.kind === 'hero') {
    pager.page('main').innerHTML = '<div class="un-scroll hm"></div><div class="un-foot hidden"></div>';
    pager.page('stats').innerHTML = '<div class="un-scroll"></div>';
    pager.page('upgrades').innerHTML = '<div class="treehost" data-noswipe></div><div class="up-respec"></div>';
    heroMain(); heroStats(); mountWeb(); respecUi();
  } else {
    pager.page('overview').innerHTML = '<div class="un-scroll fo"></div>';
    pager.page('stats').innerHTML = '<div class="un-scroll"></div><div class="fs-place"></div>';
    rankUi(); foeOverview(); foeStats();
  }
  previewUi(true);
}
function bar() {
  const b = el.querySelector('.un-bar');
  let pic, name, sub, side = '';
  if (st.kind === 'hero') {
    const h = HEROES[st.id];
    pic = face(st.id, 38); name = h.name; sub = `<span class="cap" style="color:${ROLE_COL[h.role]}">${ROLE[h.role]}</span>`;
    side = owned(st.id) ? `<span class="un-lv"><span class="lvl">${M.level(save, st.id)}</span></span>` : '';
  } else {
    const d = DEFS[st.id], g = groupOf(st.id);
    pic = `<span class="b-pic sm ${d.boss ? 'boss' : ''}"><img src="${portrait(st.id)}" alt=""></span>`; name = d.name;
    sub = `<span class="cap">${d.boss ? 'Boss · ' : ''}${g ? g.name : ''}</span>`;
  }
  b.innerHTML = `<button class="top-back" data-un="back" aria-label="back">${I.back}</button>${pic}<div class="un-ttl"><b>${name}</b>${sub}</div>${side}`;
}
let groups = null;
const groupOf = (k) => (groups || (groups = foeGroups())).find((g) => g.kinds.includes(k));

// ---------------------------------------------------------------- small pieces
const f1 = (v) => (v >= 10 ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1));
// a stat: its icon, its number, a quiet word under it
export const cell = (ic, val, label, cls = '') => `<div class="st ${cls}"><span class="st-i">${statIcon(ic)}</span><b>${val}</b><span class="st-l">${label}</span></div>`;
const head = (t, right = '') => `<div class="un-h"><span class="cap">${t}</span>${right}</div>`;
function bodyCells(n, base) {
  const up = (k) => (base && n[k] > base[k] + 1e-6 ? 'up' : '');
  return `<div class="st-grid">${cell('hp', num(n.hp), 'Health', up('hp'))}${cell('armor', f1(n.armor || 0).replace(/\.0$/, ''), 'Armour', up('armor'))}${cell('speed', Math.round(n.speed), 'Speed', up('speed'))}</div>`;
}
function weaponCells(n, base) {
  const up = (k) => (base && n[k] > base[k] + 1e-6 ? 'up' : '');
  if (!(n.hit > 0)) return '<p class="un-note">No plain attack: everything it does is in how it fights.</p>';
  return `<div class="st-grid">${cell('dmg', f1(n.hit), 'Damage', up('hit'))}${cell('aps', n.aps >= 0.005 ? n.aps.toFixed(2) : '–', 'Hits / s', up('aps'))}${cell('range', Math.round(n.range), 'Reach', up('range'))}</div>`;
}
const resChip = (id, word) => `<span class="res-chip">${icon('status', id)}<b>${(STATUSES[id] || { name: id }).name}</b><i>${word}</i></span>`;

// ================================================================ a hero
function heroMain() {
  const id = st.id, h = HEROES[id], sv = save.heroes[id], lv = M.level(save, id), need = M.xpNeed(lv), x = M.xp(save, id), mine = sv.owned;
  const pg = pager.page('main'), sc = pg.querySelector('.un-scroll'), top = sc.scrollTop;
  const inParty = save.party.includes(id), left = mine && P.recoverLeft(save, id);
  const seat = !mine ? '' : inParty ? `<span class="chip on">${I.fire}<span>At the fire</span></span>`
    : left ? `<span class="chip rest">${I.moon}<span data-until="${sv.recoverUntil}">${mmss(left)}</span></span>`
    : acts ? `<div role="button" class="chip" data-un="sit">${I.plus}<span>Sit at the fire</span></div>` : '';
  const n = P.trinketSlots(save, id);
  const slots = Array.from({ length: Math.max(2, n) }, (_, k) => {
    if (k >= n) return `<div class="gslot locked"><span class="gs-ico">${I.lock}</span><div><b>Second slot</b><span class="quiet small">Learn it in the skill web.</span></div></div>`;
    const tid = sv.trinkets[k], t = tid && P.trinketInfo(tid);
    if (!t) return `<div role="button" class="gslot empty" data-un="tslot:${k}"><span class="gs-ico">${I.plus}</span><div><b>Empty</b><span class="quiet small">${mine ? 'Tap to wear a trinket.' : 'Recruit to wear trinkets.'}</span></div></div>`;
    return `<div role="button" class="gslot" data-un="tslot:${k}" style="--rar:${P.RARITY[t.rarity].color}"><span class="gs-ico t">${icon('trinket', tid, '', t.color)}</span>
      <div><b>${t.name} <span class="tlv">${roman(P.trinketLevel(save, tid))}</span></b><span class="quiet small">${t.desc}</span></div></div>`;
  }).join('');
  // potions: the two pockets this hero takes into the next delve (handed out from the bag, as at the fire)
  const pot = acts && acts.potions ? acts.potions(id) : { list: [], can: false, why: '' };
  const pockets = Array.from({ length: P.CARRY_MAX }, (_, k) => `<i class="pocket ${pot.list[k] ? 'full' : ''}">${pot.list[k] ? icon('potion', pot.list[k]) : ''}</i>`).join('');
  const potWords = pot.list.length ? pot.list.map((p) => P.POTIONS[p].name).join(', ') : pot.can ? 'Tap to pack potions for the next delve.' : pot.why || 'Only heroes seated at the fire carry potions.';
  sc.innerHTML = `<div class="hm-top" style="--rc:${ROLE_COL[h.role]}">${face(id, 104)}
      <div class="xpline"><div class="bar xp"><i style="width:${mine ? Math.min(100, 100 * x / need) : 0}%"></i><em>${mine ? `${Math.floor(x)}/${need}` : 'not recruited'}</em></div></div>
      ${seat}</div>
    ${head('Equipment')}${slots}
    ${head('Potions')}<div role="button" class="hm-pots ${pot.can ? '' : 'off'}" data-un="pack"><span class="pk">${pockets}</span><span class="quiet small">${potWords}</span></div>
    ${head('Trait')}<div class="hm-trait"><span class="k-ico">${I.crown}</span><div><b>${h.trait.name}</b><span class="quiet small">${h.trait.desc}</span></div></div>
    <p class="hm-blurb">${h.blurb || ''}${h.fun ? ' ' + h.fun : ''}</p>`;
  sc.scrollTop = top;
  const foot = pg.querySelector('.un-foot');
  foot.classList.toggle('hidden', mine || !acts);
  if (!mine && acts) foot.innerHTML = `<div role="button" class="btn primary wide recruit ${M.afford(save, M.heroPrice(id)) ? '' : 'off'}" data-un="recruit">Recruit ${h.name} · ${gold(M.heroPrice(id))}</div>`;
}

function mountWeb() {
  const id = st.id, host = pager.page('upgrades').querySelector('.treehost');
  tree = mountTree(host, {
    save, id, sel: treeSel[id],
    onSelect: (n) => { treeSel[id] = n; },
    onLearn: (n) => { if (acts && acts.learn && acts.learn(id, n)) { cue('buy'); tree.refresh(save, n); bar(); heroStats(); previewUi(false); respecUi(); } else cue('deny'); },
    onDeny: () => cue('deny'),
  });
}
function respecUi() {
  const r = pager.page('upgrades').querySelector('.up-respec'); if (!r) return;
  const spent = owned(st.id) && acts && acts.respec ? P.spentPoints(save, st.id) : 0;
  r.innerHTML = spent ? `<div role="button" class="pill up-un" data-un="respec">Unlearn all · ${gold(P.respecPrice(save, st.id))}</div>` : '';
}

function heroStats() {
  const id = st.id, h = HEROES[id], sc = pager.page('stats').querySelector('.un-scroll'), top = sc.scrollTop;
  let S = null; try { S = heroSheet(save, id); } catch (e) { console.error('stats', id, e); }
  if (!S) { sc.innerHTML = '<p class="un-note">No numbers for this one.</p>'; return; }
  const pct = (f) => Math.round(f * 100);
  const abRows = S.abilities.map((a) => {
    const m = a.mods, extra = [m.abDmg ? ['dmg', `+${pct(m.abDmg)}%`] : null, m.abHeal ? ['heal', `+${pct(m.abHeal)}%`] : null, m.abStatus ? ['potency', `+${pct(m.abStatus)}%`] : null].filter(Boolean);
    return `<div class="st-row ${a.tier ? '' : 'dim'}"><span class="st-ab">${icon('ability', a.id)}</span><b>${a.name}</b><span class="st-tier">${a.tier ? roman(a.tier) : I.lock}</span>
      <span class="st-nums">${extra.map(([ic, v]) => `<span>${statIcon(ic)}${v}</span>`).join('')}<span class="${a.cd < a.baseCd - 0.01 ? 'up' : ''}">${statIcon('cd')}${f1(a.cd)}s</span></span></div>`;
  }).join('');
  const craft = [S.mods.haste ? cell('haste', `+${pct(S.mods.haste)}%`, 'Ability haste', 'up') : '', S.mods.heal ? cell('heal', `+${pct(S.mods.heal)}%`, 'Healing', 'up') : '', S.mods.status ? cell('potency', `+${pct(S.mods.status)}%`, 'Potency', 'up') : ''].filter(Boolean).join('');
  const res = [...S.immune.map((k) => resChip(k, 'immune')), S.knockImmune ? `<span class="res-chip">${icon('status', 'stance')}<b>Knockback</b><i>immune</i></span>` : ''].filter(Boolean).join('');
  const t = save.tally && save.tally.heroes && save.tally.heroes[id];
  const runs = !t || !t.runs ? '<p class="un-note">No runs yet.</p>'
    : `<div class="st-grid">${cell('runs', t.runs, 'Runs')}${cell('kills', num(t.kills), 'Kills')}${cell('best', num(t.best), 'Best hit')}${cell('dmg', num(t.dmg), 'Damage')}${cell('heal', num(t.heal), 'Healing')}${cell('taken', num(t.taken), 'Taken')}${cell('blocked', num(t.blocked || 0), 'Blocked')}${cell('downs', t.downs, 'Downs')}${cell('revives', t.revives, 'Revives')}</div>
      <div class="bd-box">${breakdown(id, t.src.dmg, 'Damage by source', t.dmg)}${breakdown(id, t.src.heal, 'Healing by source', t.heal)}</div>`;
  sc.innerHTML = `${bodyCells(S.n, S.base)}
    ${head(h.attack.name)}${weaponCells(S.n, S.base)}
    ${head('Abilities')}<div class="st-rows">${abRows}</div>${craft ? `<div class="st-grid gap">${craft}</div>` : ''}
    ${head('Trait')}<div class="st-rows"><div class="st-row"><span class="st-ab crown">${I.crown}</span><b>${h.trait.name}</b><span class="st-nums">${traitNumbers(h.trait.desc).map((v) => `<span>${v}</span>`).join('')}</span></div></div>
    ${head('Resistances')}${res ? `<div class="res-chips">${res}</div>` : '<p class="un-note">None.</p>'}
    ${head('All runs')}${runs}`;
  sc.scrollTop = top;
}

// the numbers a trait's words name ("Blocks 35% of damage" -> 35%), three at most
const traitNumbers = (desc) => (String(desc).match(/[+-]?\d+(?:\.\d+)?(?:%|s\b)?/g) || []).filter((v) => /\d/.test(v)).slice(0, 3);

// ================================================================ a monster
function rankUi() {
  const r = el.querySelector('.un-rank'), can = canRank(st.id);
  r.classList.toggle('hidden', !can);
  r.innerHTML = can ? `<div class="un-seg">${RANKS.map((n, i) => `<div role="button" class="${i === st.rank ? 'on' : ''} r${i}" data-un="rank:${i}">${n}</div>`).join('')}</div>` : '';
}
function attackWords(d) {
  const carries = Object.keys(STATUS_WORDS).filter((s) => d[s] > 0).map((s) => STATUS_WORDS[s]);
  const what = (d.atkCd || 0) >= 99 ? 'It has no plain attack.' : d.role === 'ranged' ? 'Its plain shots.' : 'Its plain blows.';
  return what + (carries.length ? ` They carry ${carries.join(' and ')}.` : '');
}
// A move is offered only if its preview shows it: the stage is run once, quietly, off screen and must fire.
const stageCache = new Map();
function canStage(spec) {
  const key = specKey(spec);
  if (!stageCache.has(key)) {
    let ok = false;
    try { ok = quietly(() => { setSeed(7); const S = makeStage(spec); for (let i = 0, n = Math.ceil(S.loop * 60) + 6; i < n && !S.loopsFired && !(S.fired() && S.loops === 0); i++) S.step(1 / 30); return S.loopsFired > 0 || S.fired(); }); } catch (e) { ok = false; }
    stageCache.set(key, ok);
  }
  return stageCache.get(key);
}
function movesOf(k, rk) {
  const all = foeMoves(k, rk), staged = all.filter((m) => m.move === 'attack' || canStage({ t: 'foe', id: k, move: m.move, rank: rk }));
  return staged.length ? staged : all.slice(0, 1);
}
const MOVE_TITLE = { attack: 'Attack', kit: 'How it fights', elite: 'Elite move', major: 'Major move' };
const moveIcon = (m) => ({ attack: statIcon('dmg'), kit: statIcon('kills'), elite: statIcon('elite'), major: statIcon('major') }[m]);
function moveWords(k, m) {
  const d = DEFS[k];
  return m.move === 'attack' ? attackWords(d) : m.move === 'kit' ? (beastHabit(k) || 'How it fights.')
    : m.move === 'elite' ? (ELITE_MOVE[k] || ELITE_MOVE[d.eliteAs] || 'Something extra on top of how it fights.')
    : (MAJOR_WORDS[m.key] || (MAJOR_MOVES[m.key] && MAJOR_MOVES[m.key].words) || '') + (m.call ? ' ' + MAJOR_WORDS.call : '');
}

function foeOverview() {
  const k = st.id, d = DEFS[k], sc = pager.page('overview').querySelector('.un-scroll'), top = sc.scrollTop;
  const fc = foeCount(save, k) || {}, seen = (save.seen || {})[k] || { met: 0, beaten: 0 };
  // where: its dungeons, each with the floors it turns up on
  const by = {};
  for (const p of placesOf(k)) (by[p.theme] || (by[p.theme] = [])).push(p);
  const where = Object.entries(by).map(([t, ps]) => `<div class="fo-row">${statIcon('found')}<b>${THEMES[t].name}</b><span class="quiet small">${ps.some((p) => p.as === 'boss') ? 'the boss' : (ps.length === 1 ? 'floor ' : 'floors ') + ps.map((p) => p.floor).join(', ') + (ps.every((p) => p.as === 'mini') ? ' · mini-boss' : '')}</span></div>`).join('')
    || `<div class="fo-row">${statIcon('found')}<b>No dungeon of its own</b><span class="quiet small">called in by others</span></div>`;
  const rk = canRank(k) ? st.rank : 0;
  const moves = foeMoves(k, rk).map((m) => `<div class="fo-move"><span class="k-ico">${moveIcon(m.move)}</span><div><b>${MOVE_TITLE[m.move]}</b><span class="quiet small">${moveWords(k, m)}</span></div></div>`).join('');
  sc.innerHTML = `<div class="fo-top"><span class="b-pic fo-pic ${d.boss ? 'boss' : ''} r${rk}"><img src="${portrait(k)}" alt=""></span><p class="fo-fun">${beastFun(k)}</p></div>
    <div class="st-grid">${cell('kills', num(fc.n || 0), 'Defeated')}${d.boss ? cell('major', num(fc.boss || 0), 'As the boss') : cell('elite', num(fc.elite || 0), 'Elites')}${d.boss ? cell('found', num(seen.met || 0), 'Met') : cell('major', num((fc.major || 0) + (fc.mini || 0)), 'Majors')}</div>
    ${head('Found in')}${where}
    ${head('In a fight')}${moves}
    ${canRank(k) ? '' : `<p class="un-note">${d.boss ? 'A boss comes as it is: no elite or major.' : 'Comes only as it is: no elite or major.'}</p>`}`;
  sc.scrollTop = top;
}

function foeStats() {
  const k = st.id, d = DEFS[k], pg = pager.page('stats'), sc = pg.querySelector('.un-scroll'), top = sc.scrollTop;
  const all = PLACES(), place = all[st.place] || all[0], rk = canRank(k) ? st.rank : 0;
  const party = Math.max(1, Math.min(4, (save.party || []).length + (save.mercs ? 2 : 0)));
  let S = null; try { S = foeSheet(k, rk, place, party); } catch (e) { console.error('stats', k, e); }
  if (!S) { sc.innerHTML = '<p class="un-note">No numbers for this one.</p>'; return; }
  const resWord = (v) => (v === 0 ? 'immune' : v < 1 ? `takes ${Math.round(v * 100)}%` : `takes ${Math.round(v * 100)}%`);
  const res = S.res.map((r) => `<span class="res-chip ${r.v > 1 ? 'weak' : ''}">${icon('status', r.id)}<b>${(STATUSES[r.id] || { name: r.id }).name}</b><i>${resWord(r.v)}</i></span>`).join('');
  sc.innerHTML = `${bodyCells(S.n)}
    ${head('Attack')}${weaponCells(S.n)}
    ${head('Resistances')}${res ? `<div class="res-chips">${res}</div>` : '<p class="un-note">None.</p>'}
    <p class="un-note fs-note">${rk ? RANKS[rk] + ', as' : 'As'} it stands ${S.last ? 'in the last room of' : 'half way through'} this floor${S.party ? `, for a party of ${S.party}` : ''}.${S.here ? '' : ` ${d.name} isn't met here: these are the numbers it would have.`}</p>`;
  sc.scrollTop = top;
  pg.querySelector('.fs-place').innerHTML = `<div role="button" class="fs-step ${st.place > 0 ? '' : 'off'}" data-un="place:-1" aria-label="earlier">${I.back}</div>
    <div class="fs-where"><b>${THEMES[place.theme].name}</b><span class="quiet small">Floor ${place.floor} · ${floorName(place)}</span></div>
    <div role="button" class="fs-step next ${st.place < all.length - 1 ? '' : 'off'}" data-un="place:1" aria-label="later">${I.back}</div>`;
}

// ================================================================ the preview page (both kinds)
function previewUi(replay) {
  const pv = pager.page('preview'); if (!pv) return;
  const cap = pv.querySelector('.pv-cap'), movesEl = pv.querySelector('.pv-moves'), dial = pv.querySelector('.pv-dial'), lock = pv.querySelector('.pv-lock');
  let spec, locked = false;
  if (st.kind === 'hero') {
    const id = st.id, h = HEROES[id], tier = st.tier, moves = heroMoves(id);
    if (!moves.find((m) => m.move === st.move)) st.move = 'attack';
    const cur = moves.find((m) => m.move === st.move);
    locked = cur.kind === 'ability' && tier < 1;
    const kind = cur.kind === 'attack' ? 'Attack' : cur.kind === 'trait' ? 'Trait' : `Ability ${cur.i + 1} · ${cur.ab.cd}s`;
    const ico = (m) => (m.kind === 'attack' ? statIcon('dmg') : m.kind === 'trait' ? I.crown : icon('ability', m.move));
    const desc = cur.kind === 'attack' ? h.attack.desc : cur.kind === 'trait' ? h.trait.desc : cur.ab.desc;
    let more = '';
    if (cur.kind === 'ability') {
      const mine = P.abilityTiers(save, id, cur.move);
      more = `<ol class="pv-tiers">${cur.ab.tiers.map((t, k) => `<li class="${k + 1 <= Math.max(1, tier) ? 'got' : ''} ${k + 1 === Math.max(1, tier) ? 'now' : ''}"><i class="${k + 1 <= mine ? 'mine' : ''}">${roman(k + 1)}</i><span>${t}</span></li>`).join('')}</ol>`;
    } else if (cur.kind === 'trait' && traitNote(id)) more = `<p class="pv-note">${traitNote(id)}</p>`;
    cap.innerHTML = `<div class="pv-now"><span class="pv-ico ${cur.kind === 'ability' ? 'ab' : ''}">${ico(cur)}</span><div class="pv-mid"><b>${cur.name}</b><span class="cap">${kind}</span></div>${locked ? `<span class="pv-locked">${I.lock}<span>Locked at tier 0</span></span>` : ''}</div>
      <p class="pv-desc">${desc}</p>${more}`;
    movesEl.innerHTML = moves.map((m) => {
      const lk = m.kind === 'ability' && tier < 1;
      return `<div role="button" class="mb ${m.move === st.move ? 'on' : ''} ${lk ? 'locked' : ''}" data-un="move:${m.move}"><span class="mb-ico">${ico(m)}${lk ? `<i class="mb-lock">${I.lock}</i>` : ''}</span><span class="mb-n">${m.kind === 'attack' ? 'Attack' : m.kind === 'trait' ? 'Trait' : m.name}</span></div>`;
    }).join('');
    dial.classList.remove('hidden');
    dial.innerHTML = `<span class="cap">Tier</span><div class="un-seg">${[0, 1, 2, 3].map((t) => `<div role="button" class="${t === tier ? 'on' : ''}" data-un="tier:${t}">${t ? roman(t) : '0'}</div>`).join('')}</div>`;
    spec = { t: 'hero', id, move: st.move, tier };
  } else {
    const k = st.id, rk = canRank(k) ? st.rank : 0, moves = movesOf(k, rk);
    if (!moves.find((m) => m.move === st.fmove)) st.fmove = (rk === 2 && moves.find((m) => m.move === 'major')) ? 'major' : (rk >= 1 && moves.find((m) => m.move === 'elite')) ? 'elite' : moves.find((m) => m.move === 'kit') ? 'kit' : moves[0].move;
    const cur = moves.find((m) => m.move === st.fmove);
    cap.innerHTML = `<div class="pv-now"><span class="pv-ico">${moveIcon(cur.move)}</span><div class="pv-mid"><b>${MOVE_TITLE[cur.move]}</b></div></div><p class="pv-desc">${moveWords(k, cur)}</p>`;
    movesEl.innerHTML = moves.length > 1 ? moves.map((m) => `<div role="button" class="mb ${m.move === st.fmove ? 'on' : ''}" data-un="fmove:${m.move}"><span class="mb-ico">${moveIcon(m.move)}</span><span class="mb-n">${MOVE_TITLE[m.move]}</span></div>`).join('') : '';
    dial.classList.add('hidden'); dial.innerHTML = '';
    spec = { t: 'foe', id: k, move: st.fmove, rank: rk };
  }
  lock.classList.toggle('hidden', !locked);
  pv.querySelector('.pv').classList.toggle('nodial', st.kind !== 'hero');
  if (replay) { player.play(spec); if (pager.id !== 'preview') player.stop(); }
}

// ================================================================ taps
function onClick(e) {
  const t = e.target.closest('[data-un]'); if (!t) return;
  const [a, b] = t.dataset.un.split(':');
  const deny = () => { cue('deny'); t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); };
  switch (a) {
    case 'back': cue('tap'); closeUnit(); if (onBack) onBack(); return;
    case 'tier': if (st.tier === +b) return; st.tier = +b; cue('tap'); previewUi(true); return;
    case 'move': cue('tap'); if (st.move === b) { player.restart(); return; } st.move = b; previewUi(true); return;
    case 'fmove': cue('tap'); if (st.fmove === b) { player.restart(); return; } st.fmove = b; previewUi(true); return;
    case 'rank': if (st.rank === +b) return; st.rank = +b; st.fmove = null; cue('tap'); rankUi(); foeOverview(); foeStats(); previewUi(true); return;
    case 'place': { const n = PLACES().length, to = Math.max(0, Math.min(n - 1, st.place + +b)); if (to === st.place) return deny(); st.place = to; cue('tap'); foeStats(); return; }
    case 'tslot': if (acts && acts.trinket && owned(st.id)) acts.trinket(st.id, +b); else deny(); return;
    case 'pack': if (!(acts && acts.pack && acts.pack(st.id))) deny(); return;
    case 'sit': if (acts && acts.sit) acts.sit(st.id, t); return;
    case 'recruit': if (acts && acts.recruit) acts.recruit(st.id, t); return;
    case 'respec': if (acts && acts.respec) acts.respec(st.id); return;
    default: return;
  }
}
export { canStage, movesOf, moveWords, moveIcon, MOVE_TITLE, f1, head, resChip, placeName };
