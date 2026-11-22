// The wagon's screens (convoy mode; the rules are in convoy.js, docs/CONVOY.md): the "Set out" page, the strip under
// the top bar on the road (the wagon's health, how far up the road, the trip's gold), the roadside camp's shop (round
// 13: it spends only the gold picked up on this trip), and the result card. Its two layers are made here, so index.html only links the css.
// iPhone Safari: tappable things with children are divs with role="button".
import { HEROES } from './heroes.js';
import { portrait } from './inspect.js';
import { I } from './ui-kit.js';
import { cue } from './sfx.js';
import { xpToNext } from './units.js';
import { SHOP, REPAIR, PAY, LOSE_CUT, WIPE_LOSS, STRETCH_LEN, START_X, convoyParty, planTrip, purse, cantBuy, buy } from './convoy.js';
import { trinketInfo } from './progress.js';
import { DEFS } from './units.js';

let api = null, layer = null, bar = null, picked = null;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const face = (k, cls = '') => `<span class="cv-face ${cls}"><img src="${portrait(k)}" alt=""></span>`;
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
// the wagon from above, facing up the page: the ox, the striped cover, wheels and crates (the road's drawing, simplified)
export const WAGON_SVG = `<svg class="cv-wagon" viewBox="0 0 80 150" aria-hidden="true"><g stroke="#2B2230" stroke-width="3.2" stroke-linejoin="round">
  <path d="M33 52 L36 28 M47 52 L44 28" stroke-width="5"/><path d="M33 52 L36 28 M47 52 L44 28" stroke="#8A6A44" stroke-width="2"/>
  <ellipse cx="30" cy="24" rx="9" ry="15" fill="#8E6E4C"/><ellipse cx="50" cy="24" rx="9" ry="15" fill="#8E6E4C"/>
  <ellipse cx="30" cy="9" rx="6" ry="5.5" fill="#7A5A3C"/><ellipse cx="50" cy="9" rx="6" ry="5.5" fill="#7A5A3C"/>
  <path d="M25 7 q-5 -4 -5 -8 M35 7 q4 -4 4 -8 M45 7 q-4 -4 -4 -8 M55 7 q5 -4 5 -8" fill="none" stroke="#E9DCC0" stroke-width="2.4"/>
  <rect x="5" y="62" width="9" height="22" rx="3" fill="#3A2C24"/><rect x="66" y="62" width="9" height="22" rx="3" fill="#3A2C24"/>
  <rect x="5" y="104" width="9" height="22" rx="3" fill="#3A2C24"/><rect x="66" y="104" width="9" height="22" rx="3" fill="#3A2C24"/>
  <rect x="11" y="52" width="58" height="88" rx="6" fill="#7A5232"/><rect x="15" y="64" width="50" height="66" rx="11" fill="#E9DCC0"/>
  <rect x="21" y="132" width="16" height="14" rx="2" fill="#A87C4A"/><rect x="43" y="132" width="16" height="14" rx="2" fill="#946A3E"/></g>
  <rect x="15" y="80" width="50" height="8" fill="#B8423A"/><rect x="15" y="104" width="50" height="8" fill="#B8423A"/>
  <rect x="18" y="66" width="10" height="62" rx="4" fill="rgba(255,255,255,.2)"/></svg>`;

export function initConvoyUI(opts) {
  api = opts; // { save(), run(), onSetOut(), onClose(), onPick() (set off from the roadside) }
  layer = document.createElement('div'); layer.id = 'convoy'; layer.className = 'hidden';
  document.body.appendChild(layer);
  layer.addEventListener('click', onClick);
  document.getElementById('result').addEventListener('click', onResultClick);
}
export const convoyLayer = () => layer;

// ================================================================ set out
export function openSetOut() {
  const save = api.save(), party = convoyParty(save), legs = planTrip(save);
  const heroes = party.map((k) => `<div class="cv-hero">${face(k)}<b>${esc(HEROES[k].name)}</b><span class="quiet small">Level ${save.heroes[k].level || 1}</span></div>`).join('');
  const road = legs.map((s, i) => `<div class="cv-leg"><i>${i + 1}</i><span><b>${esc(s.name)}</b><em>${esc(s.land)} · ${s.end ? `${esc(foeName(s.end))} holds the road` : 'a roadside camp at the end'}</em></span></div>`).reverse().join('');
  layer.innerHTML = `<div class="cv-page">
    <header class="cv-bar"><div role="button" class="top-back" data-cv="close" aria-label="back">${I.back}</div><h1 class="top-title sm">The Wagon</h1></header>
    <div class="cv-body">
      <div class="cv-hero-art">${WAGON_SVG}<div class="cv-pitch"><span class="cap">${esc(legs[legs.length - 1].land)}</span>
        <p>Take the trader's wagon up the road to the town. Enemies come out of the trees on every side; your party fights round it.
        Gold falls where they fall: what you don't pick up is left behind, and so are the fallen nobody gets up in time.</p></div></div>
      <div class="cv-road">${road}</div>
      <div class="cv-pay"><div><span class="cap">Delivered</span><b><span class="coin"></span>${PAY}</b><span class="quiet small">× the wagon's health left, plus the gold you pick up</span></div>
        <div><span class="cap">Lost</span><b class="lose">−${Math.round(LOSE_CUT * 100)}%</b><span class="quiet small">of the trip's gold; −${Math.round(WIPE_LOSS * 100)}% if the whole party falls</span></div></div>
      <div class="cv-party"><span class="cap">The party at the fire</span>${heroes || '<p class="quiet">Nobody is ready. Seat a hero at the fire.</p>'}</div>
    </div>
    <footer class="cv-foot"><p class="quiet small">The gold and XP are kept. No checkpoints; it opens no dungeons. Beat a dungeon to open its country to the road.</p>
      <div role="button" class="btn primary wide ${party.length ? '' : 'off'}" data-cv="go">Set out</div></footer></div>`;
}

// ================================================================ the roadside camp: a shop
// It takes only the gold picked up on this trip (the designer: "Only from gold earned in the trip. Not from main
// bank"); what isn't spent is what the party takes home. Tap a line to buy it (some more than once); "Set off" goes on.
export function openRoadside(run) {
  picked = null;
  const S = run.legs[run.stretch], next = run.legs[run.stretch + 1];
  const hp = run.wagonHp / run.wagonMax, gold = purse(run);
  const heroes = run.party.map((k) => { const hs = run.heroes[k], max = hs.maxHp || 1, f = Math.max(0, Math.min(1, (hs.hp || 0) / max));
    return `<div class="cv-rh">${face(k, 'sm')}<div class="cv-rhm"><div class="bar hp"><i style="width:${(100 * f).toFixed(0)}%"></i></div><span class="cv-pots">${'<i></i>'.repeat(hs.potions || 0)}</span></div></div>`; }).join('');
  const lines = Object.keys(SHOP).map((c) => {
    const no = cantBuy(run, c), n = run.shop.bought.filter((b) => b === c).length, short = no === 'not enough gold from this trip';
    return `<div role="button" class="cv-choice${no ? ' off' : ''}" data-cv="buy:${c}"><span class="cv-ci ${c}">${choiceIcon(c)}</span>
    <span class="cv-ct"><b>${esc(SHOP[c].name)}${n ? ` <em class="cv-n">×${n}</em>` : ''}</b><span class="quiet small">${esc(no && !short ? cap1(no) + '.' : choiceLine(run, c))}</span></span>
    <span class="cv-price${short ? ' short' : ''}"><span class="coin"></span>${SHOP[c].price}</span></div>`;
  }).join('');
  const back = (run.waiting || []).length ? `<p class="small cv-back">${run.waiting.map((k) => esc(HEROES[k] ? HEROES[k].name : k)).join(' and ')} ${run.waiting.length > 1 ? 'were' : 'was'} left behind on the road, and walked in to the fire.</p>` : '';
  layer.innerHTML = `<div class="cv-stop"><div class="cv-panel">
    <span class="cap">${esc(S.name)} · done</span><h2>A roadside camp</h2>
    <p class="quiet small">Everyone rests by the fire: a quarter of their health back, and the downed are up again.</p>${back}
    <div class="cv-wagonrow">${WAGON_SVG}<div><span class="cap">The wagon</span><div class="bar cv-whp"><i style="width:${(100 * hp).toFixed(0)}%"></i><em>${Math.round(run.wagonHp)}/${run.wagonMax}</em></div></div></div>
    <div class="cv-rheroes">${heroes}</div>
    <div class="cv-purse"><div><span class="cap">The trip's purse</span><span class="quiet small">Only gold picked up on this road. Your gold at the camp isn't touched.</span></div>
      <b><span class="coin"></span>${gold}</b></div>
    <div class="cv-choices">${lines}</div>
    <div role="button" class="btn primary wide cv-go" data-cv="go-on">Set off · keep ${gold}</div>
    <p class="quiet small cv-next">Next: ${esc(next ? next.name : '')}${next ? ` (${esc(next.land)})` : ''}${next && next.end ? `, and ${esc(foeName(next.end))} at the end of it` : ''}</p></div></div>`;
}
const cap1 = (t) => t[0].toUpperCase() + t.slice(1);
const foeName = (k) => (DEFS[k] ? `the ${DEFS[k].name.replace(/^the /i, '')}` : 'a warden');
function choiceLine(run, c) {
  if (c === 'repair') return `+${Math.round(run.wagonMax * REPAIR)} health for the wagon.`;
  if (c === 'potion') { const k = run.party.filter((h) => run.heroes[h].potions < 2).sort((a, b) => run.heroes[a].potions - run.heroes[b].potions)[0]; return k ? `For ${HEROES[k].name}, who has ${run.heroes[k].potions || 'none'}.` : SHOP.potion.desc; }
  if (c === 'trinket' && run.shop.trinket) { const t = trinketInfo(run.shop.trinket.id); return `${t.name}: worn for the rest of the trip.`; }
  if (c === 'sellsword') return 'A hired blade at your side for the next stretch.';
  return SHOP[c].desc;
}
function choiceIcon(c) {
  if (c === 'repair') return `<svg viewBox="0 0 24 24"><path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z" fill="currentColor"/></svg>`;
  if (c === 'potion') return I.flask;
  if (c === 'sellsword') return I.sword;
  return `<svg viewBox="0 0 24 24"><path d="M12 3l3 5.5L21 9l-4.5 4 1 6L12 16l-5.5 3 1-6L3 9l6-.5z" fill="currentColor"/></svg>`;
}

// ================================================================ the strip on the road
// (main.js calls this every tenth of a second; it makes the strip the first time): the wagon's health, the road so
// far (a dot on three legs), and the downed: a face each, red as they near the bottom of the screen, grey once left.
export function convoyHud(run) {
  const hud = document.getElementById('hud');
  if (!bar || !bar.isConnected) {
    bar = document.createElement('div'); bar.id = 'cvBar';
    bar.innerHTML = `<div class="cvb-w">${WAGON_SVG}</div><div class="cvb-mid"><div class="bar cvb-hp"><i></i><em></em></div><div class="cvb-road"><i class="cvb-dot"></i></div></div><div class="cvb-down"></div>`;
    hud.insertBefore(bar, document.getElementById('bossBar'));
  }
  bar.classList.remove('hidden');
  const wg = run.wagon, hp = wg && !wg.dead ? Math.max(0, wg.hp) : run.wagonHp, max = run.wagonMax;
  bar.querySelector('.cvb-hp > i').style.width = (100 * hp / max).toFixed(1) + '%';
  bar.querySelector('.cvb-hp > em').textContent = `${Math.ceil(hp)}/${max}`;
  bar.classList.toggle('low', hp / max < 0.3);
  bar.classList.toggle('held', !!(wg && wg.blocked));
  const along = (run.stretch + Math.max(0, Math.min(1, ((wg ? wg.x : 0) - START_X) / STRETCH_LEN))) / run.legs.length;
  bar.querySelector('.cvb-dot').style.left = (100 * along).toFixed(1) + '%';
  const w = run.world, down = run.party.filter((k) => run.heroes[k] && (run.heroes[k].down || run.heroes[k].out));
  const html = down.map((k) => { const u = w && w.units.find((x) => x.kind === k && x.downed && !x.dead), near = u && wg ? u.x < wg.x - 380 : false;
    return `<span class="cvb-dn${run.heroes[k].out ? ' gone' : near ? ' near' : ''}">${face(k, 'xs')}</span>`; }).join('');
  const box = bar.querySelector('.cvb-down'); if (box.innerHTML !== html) box.innerHTML = html;
  document.getElementById('where').textContent = `${run.legs[run.stretch].name} · ${run.stretch + 1}/${run.legs.length}`;
  document.getElementById('hCoins').textContent = purse(run);
}
export function hideConvoyHud() { if (bar) bar.classList.add('hidden'); }

// ================================================================ the result
let resultActs = null;
const TITLE = { delivered: 'Delivered', wagon: 'The wagon was lost', party: 'The party fell', turned: 'Turned back' };
export function showConvoyResult(rep, acts) {
  resultActs = acts; // { again(), camp() }
  const r = document.getElementById('result');
  const heroes = rep.heroes.map((h, i) => {
    const need = xpToNext(h.level);
    return `<div class="rhero" style="--d:${0.35 + i * 0.12}s">${face(h.id)}
      <div class="rh-mid"><b>${esc(HEROES[h.id].name)}</b>
        <div class="xpline"><span class="lvl">${h.level}</span><div class="bar xp"><i style="width:${Math.min(100, 100 * (h.xp || 0) / need)}%"></i><em>${Math.floor(h.xp || 0)}/${need}</em></div></div>
        <span class="quiet small">${h.level > h.from ? `Level ${h.from} → ${h.level}` : `Level ${h.level}`}${h.downed ? ' · downed, resting' : h.hurt ? ' · hurt, resting' : ''}</span></div>
      ${h.gained ? `<span class="rh-pts"><span class="pts">+${h.gained}</span><span class="cap">${h.gained === 1 ? 'point' : 'points'}</span></span>` : ''}</div>`;
  }).join('');
  const line = (label, v, cls = '') => `<div class="cv-line ${cls}"><span>${label}</span><b>${v}</b></div>`;
  const lines = [
    line('Gold picked up', `${rep.picked} <span class="quiet">of ${rep.dropped} dropped</span>`),
    rep.behind ? line('Left behind on the road', rep.behind, 'quietv') : '',
    rep.delivered ? line(`Delivery: ${PAY} × ${Math.round(rep.health * 100)}% of the wagon`, '+' + rep.pay, 'good') : '',
    rep.spent ? line('Spent at the roadside', '−' + rep.spent, 'quietv') : '',
    rep.cut ? line(`${rep.result === 'turned' ? 'Turned back' : rep.result === 'party' ? 'The party fell' : 'The wagon was lost'}: ${Math.round(rep.lossPct * 100)}% of the rest`, '−' + rep.cut, 'bad') : '',
    rep.gems ? line('A gem from the Chief', '+' + rep.gems, 'good') : '',
  ].join('');
  const picks = rep.picks.length ? `<p class="quiet small cv-picks">At the roadside: ${rep.picks.map((p) => esc(p.choice === 'trinket' && p.name ? `${p.name} for ${HEROES[p.hero].name}` : SHOP[p.choice].name.toLowerCase())).join(', ')}</p>` : '';
  r.innerHTML = `<div class="rcard convoy ${rep.delivered ? 'won' : 'lost'}"><div class="r-scroll">
    <span class="cap">${esc(rep.land)} · stretch ${rep.stretch} of ${rep.stretches} · ${rep.kills} kills · ${mmss(rep.time)}</span>
    <h1 class="t32">${TITLE[rep.result] || 'Over'}</h1>
    <div class="cv-rwagon">${WAGON_SVG}<div class="bar cv-whp"><i style="width:${(100 * rep.health).toFixed(0)}%"></i><em>${Math.round(rep.health * 100)}%</em></div></div>
    <div class="r-gold"><span class="coin"></span><b class="count">${rep.gold}</b><span class="quiet">gold</span></div>
    <div class="cv-lines">${lines}</div>${picks}
    ${heroes ? `<div class="rheroes">${heroes}</div>` : ''}</div>
    <div class="r-foot br-foot"><div role="button" class="btn primary" data-cr="again">Again</div><div role="button" class="btn ghost" data-cr="camp">Camp</div></div></div>`;
}
function onResultClick(e) {
  const b = e.target.closest('[data-cr]'); if (!b || !resultActs) return;
  const f = resultActs[b.dataset.cr]; cue('tap');
  if (f) { const acts = resultActs; resultActs = null; f.call(acts); }
}

function onClick(e) {
  const b = e.target.closest('[data-cv]'); if (!b) return;
  const [act, arg] = b.dataset.cv.split(':');
  if (act === 'close') { cue('tap'); api.onClose(); }
  else if (act === 'go') { if (b.classList.contains('off')) { cue('deny'); return; } cue('tap'); api.onSetOut(); }
  else if (act === 'buy') { const run = api.run(); if (!run || b.classList.contains('off')) { cue('deny'); return; } if (buy(run, arg)) { cue('buy'); openRoadside(run); } else cue('deny'); }
  else if (act === 'go-on') { if (picked) return; picked = 'go'; b.classList.add('on'); cue('tap'); setTimeout(() => api.onPick(), 200); }
}
