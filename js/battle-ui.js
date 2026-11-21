// Battle mode's screens (round 10; the rules are in battle.js): the setup page (two sides, a picker of everything you
// can field), the strip along the bottom of a battle, and the result card.
// The field runs up the screen with Blue at the bottom and Red at the top, so every screen stacks them that way.
import { DEFS } from './units.js';
import { HEROES } from './heroes.js';
import { THEMES, DUNGEON_ORDER } from './themes.js';
import { portrait } from './inspect.js';
import { I } from './ui-kit.js';
import { cue } from './sfx.js';
import { dungeonOpen } from './progress.js';
import { battleRoster, cleanSetup, setupProblem, countOf, isHero, isBoss, canRank, sideOf, standing, SIDES, SIDE_MAX, STACK_MAX, RANKS } from './battle.js';

let api = null, el = null, setup = null, adding = null, tab = 'heroes', note = '';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nameOf = (k) => (DEFS[k] ? DEFS[k].name : k);
const pic = (k, cls = '') => `<span class="b-pic ${cls} ${isHero(k) ? 'hero' : ''}"><img src="${portrait(k)}" alt=""></span>`;
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function initBattleUI(opts) {
  api = opts; // { save(), persist(), onFight(setup), onClose() }
  el = document.getElementById('battle');
  el.addEventListener('click', onClick);
  document.getElementById('result').addEventListener('click', onResultClick);
}

// ================================================================ setup
export function openSetup() {
  const save = api.save();
  setup = cleanSetup(save, save.battle || { arena: null, a: [], b: [] });
  adding = null; note = '';
  render();
}
function keep() { const save = api.save(); save.battle = JSON.parse(JSON.stringify(setup)); api.persist(); }

function sideHtml(side) {
  const list = setup[side], n = countOf(list);
  const tiles = list.map((s, i) => `<div class="bs-stack ${s.rank ? 'r' + s.rank : ''}">
      <div class="bs-top">${pic(s.k)}<b class="bs-n">×${s.n}</b></div>
      <span class="bs-name">${esc(nameOf(s.k))}</span>
      <div class="bs-step"><button data-b="dec:${side}:${i}" aria-label="one fewer">−</button><button data-b="inc:${side}:${i}" aria-label="one more">+</button></div>
      ${canRank(s.k) ? `<button class="bs-rank" data-b="rank:${side}:${i}">${RANKS[s.rank] || 'Plain'}</button>` : `<span class="bs-rank none">${isBoss(s.k) ? 'Boss' : 'Hero'}</span>`}
    </div>`).join('');
  return `<section class="bs-side ${side}">
    <div class="bs-h"><i class="bs-dot"></i><b>${SIDES[side].name}</b><span class="quiet small">${n} of ${SIDE_MAX}</span>
      ${n ? `<button class="bs-clear" data-b="clear:${side}">Clear</button>` : ''}</div>
    <div class="bs-grid">${tiles}<button class="bs-add" data-b="add:${side}">${I.plus}<span>Add</span></button></div>
  </section>`;
}

function pickerHtml() {
  const save = api.save(), R = battleRoster(save), list = setup[adding];
  const tabs = [`<button class="${tab === 'heroes' ? 'on' : ''}" data-b="tab:heroes">Heroes</button>`,
    ...R.dungeons.map((d) => `<button class="${tab === d.id ? 'on' : ''} ${d.open ? '' : 'locked'}" data-b="tab:${d.id}">${d.open ? '' : I.lock}${esc(d.name.replace(/^The /, ''))}</button>`)].join('');
  const have = (k) => list.filter((s) => s.k === k).reduce((a, s) => a + s.n, 0);
  const tile = (k) => `<button class="bp-tile ${isBoss(k) ? 'boss' : ''}" data-b="pick:${k}">${pic(k)}${have(k) ? `<i class="bp-n">${have(k)}</i>` : ''}<span class="bp-name">${esc(nameOf(k))}</span>${isBoss(k) ? "<em>Boss</em>" : ""}</button>`;
  let body;
  if (tab === 'heroes') {
    body = R.heroes.length ? `<div class="bp-grid">${R.heroes.map(tile).join('')}</div><p class="quiet small bp-foot">Your heroes fight with the skills and trinkets they have at camp.</p>` : '<p class="quiet">No heroes yet.</p>';
  } else {
    const d = R.dungeons.find((x) => x.id === tab);
    body = !d ? '' : d.open ? `<div class="bp-grid">${[...d.kinds, ...d.bosses].map(tile).join('')}</div><p class="quiet small bp-foot">As strong as on the first floor of ${esc(d.name)}. Tap a monster's tag on its side to make it an elite or a major.</p>`
      : `<div class="bp-locked">${I.lock}<p>Beat the boss of ${esc(d.name)} to pin its monsters here.</p></div>`;
  }
  return `<div class="bp"><div class="bp-back" data-b="done"></div><div class="bp-panel ${adding}">
    <div class="bp-h"><i class="bs-dot"></i><b>Add to ${SIDES[adding].name}</b><span class="quiet small">${countOf(list)} of ${SIDE_MAX}</span><button class="btn bp-done" data-b="done">Done</button></div>
    <div class="bp-tabs">${tabs}</div><div class="bp-body">${body}</div></div></div>`;
}

function render() {
  if (!el || !setup) return;
  const T = THEMES[setup.arena], problem = setupProblem(setup);
  const keepScroll = el.querySelector('.bp-body'), st = keepScroll ? keepScroll.scrollTop : 0, tabsEl = el.querySelector('.bp-tabs'), sl = tabsEl ? tabsEl.scrollLeft : 0;
  el.innerHTML = `<div class="bs">
    <header class="bs-bar"><button class="top-back" data-b="close" aria-label="back">${I.back}</button><h1 class="top-title sm">Battle</h1>
      <div role="button" class="pill bs-arena" data-b="arena"><span class="quiet">Ground</span><b>${esc(T ? T.name.replace(/^The /, '') : '')}</b></div></header>
    <div class="bs-body">${sideHtml('b')}
      <div class="bs-vs"><i></i><button class="bs-swap" data-b="swap">Swap sides</button><i></i></div>
      ${sideHtml('a')}</div>
    <footer class="bs-foot"><p class="bs-note ${note ? 'warn' : ''}">${esc(note || problem || 'Nothing is won or lost here: no gold, no XP.')}</p>
      <button class="btn primary wide" data-b="fight" ${problem ? 'disabled' : ''}>Fight</button></footer>
    ${adding ? pickerHtml() : ''}</div>`;
  const nb = el.querySelector('.bp-body'); if (nb) nb.scrollTop = st;
  const nt = el.querySelector('.bp-tabs'); if (nt) nt.scrollLeft = sl;
}

function say(text) { note = text; cue('deny'); }
function addOne(side, k) {
  const list = setup[side], other = setup[side === 'a' ? 'b' : 'a'];
  if (countOf(list) >= SIDE_MAX) return say(`A side holds ${SIDE_MAX} at most.`);
  if (isBoss(k) && other.some((s) => isBoss(s.k))) return say('Bosses can only be on one side.');
  const s = list.find((x) => x.k === k && !x.rank) || list.find((x) => x.k === k);
  if (s) { if (s.n >= STACK_MAX) return say(`${STACK_MAX} of one kind at most.`); s.n++; }
  else list.push({ k, n: 1, rank: 0 });
  cue('tap');
}

function onClick(e) {
  const b = e.target.closest('[data-b]'); if (!b || b.disabled) return;
  const [act, p, q] = b.dataset.b.split(':');
  note = '';
  switch (act) {
    case 'close': keep(); cue('tap'); api.onClose(); return;
    case 'add': adding = p; cue('tap'); break;
    case 'done': adding = null; cue('tap'); break;
    case 'tab': tab = p; cue('tap'); break;
    case 'pick': addOne(adding, p); break;
    case 'inc': { // one more of that very stack (its rank too)
      const s = setup[p][+q]; if (!s) break;
      if (countOf(setup[p]) >= SIDE_MAX) say(`A side holds ${SIDE_MAX} at most.`); else if (s.n >= STACK_MAX) say(`${STACK_MAX} of one kind at most.`); else { s.n++; cue('tap'); }
      break;
    }
    case 'dec': { const s = setup[p][+q]; if (s && --s.n <= 0) setup[p].splice(+q, 1); cue('tap'); break; }
    case 'rank': {
      const list = setup[p], s = list[+q]; if (!s) break;
      const next = ((s.rank || 0) + 1) % 3, same = list.find((x) => x !== s && x.k === s.k && (x.rank || 0) === next);
      if (same) { same.n = Math.min(STACK_MAX, same.n + s.n); list.splice(+q, 1); } else s.rank = next;
      cue('tap'); break;
    }
    case 'clear': setup[p] = []; cue('tap'); break;
    case 'swap': { const t = setup.a; setup.a = setup.b; setup.b = t; cue('tap'); break; }
    case 'arena': {
      const save = api.save(), open = DUNGEON_ORDER.filter((id) => THEMES[id] && (save.cheat || dungeonOpen(save, id)));
      setup.arena = open[(open.indexOf(setup.arena) + 1) % open.length] || setup.arena; cue('tap'); break;
    }
    case 'fight': {
      const problem = setupProblem(setup); if (problem) { say(problem); break; }
      keep(); adding = null; api.onFight(JSON.parse(JSON.stringify(setup))); return;
    }
  }
  render();
}

// ================================================================ the strip under a battle
let dockTap = null, dockRun = null;
const stackKey = (side, s) => `${side}:${s.k}:${s.rank || 0}`;
export function buildBattleDock(run, onTap) {
  dockTap = onTap; dockRun = run;
  const c = document.getElementById('cards'); if (!c) return;
  c.className = 'bd';
  const row = (side) => `<div class="bd-row ${side}"><div class="bd-team"><b>${SIDES[side].name}</b><span class="bd-count" data-bd="count:${side}"></span><div class="bar bd-hp"><i data-bd="hp:${side}"></i></div></div>
    <div class="bd-chips">${run.setup[side].map((s) => `<div role="button" class="bd-chip ${s.rank ? 'r' + s.rank : ''}" data-bd="chip:${stackKey(side, s)}">${pic(s.k, 'sm')}<b></b></div>`).join('')}</div></div>`;
  c.innerHTML = row('b') + row('a');
  c.onclick = (e) => {
    const chip = e.target.closest('.bd-chip'); if (!chip || !dockTap) return;
    const key = chip.dataset.bd.slice(5), u = dockRun.sides[key[0]].find((x) => x.bkey === key && !x.dead) ; if (u) dockTap(u);
  };
  updateBattleDock(run);
}
// Returns false when the strip isn't this battle's (main.js rebuilds it).
export function updateBattleDock(run) {
  const c = document.getElementById('cards'); if (!c || dockRun !== run || !c.classList.contains('bd')) return false;
  const w = run.world;
  for (const side of ['a', 'b']) {
    let hp = 0, max = 0; const left = {};
    for (const u of run.sides[side]) { max += u.maxHp; const on = !u.dead && !u.downed; if (on) { hp += Math.max(0, u.hp); left[u.bkey] = (left[u.bkey] || 0) + 1; } }
    const bar = c.querySelector(`[data-bd="hp:${side}"]`); if (bar) bar.style.width = (max ? 100 * hp / max : 0) + '%';
    const cnt = c.querySelector(`[data-bd="count:${side}"]`); if (cnt) cnt.textContent = String(standing(run, side).length);
    for (const s of run.setup[side]) {
      const chip = c.querySelector(`[data-bd="chip:${stackKey(side, s)}"]`); if (!chip) continue;
      const n = left[stackKey(side, s)] || 0;
      chip.lastElementChild.textContent = s.n > 1 ? `${n}/${s.n}` : '';
      chip.classList.toggle('out', !n);
    }
  }
  return !!w;
}
export const battleTitle = (run) => `Battle · ${mmss(run.t)}`;
export { sideOf };

// ================================================================ the result
let resultActs = null;
export function showBattleResult(sum, acts) {
  resultActs = acts; // { again(), change(), camp() }
  const r = document.getElementById('result'), T = THEMES[sum.arena];
  const head = sum.winner === 'draw' ? 'A draw' : `${SIDES[sum.winner].name} wins`;
  const sub = sum.timeUp ? (sum.winner === 'draw' ? 'Stopped with the sides level.' : `Stopped early: ${SIDES[sum.winner].name} had more of its health left.`) : '';
  const num = (n) => (n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n || 0)));
  const heals = ['a', 'b'].some((id) => sum.sides[id].rows.some((x) => x.heal > 0.5)); // the Healed column only when someone did
  const side = (id) => {
    const S = sum.sides[id];
    const rows = S.rows.map((x) => `<tr class="${x.left ? '' : 'out'}"><td class="br-who">${pic(x.k, "sm")}<span class="br-nm"><b>${esc(nameOf(x.k))}${x.n > 1 ? ` ×${x.n}` : ''}</b>${x.rank ? `<i>${RANKS[x.rank]}</i>` : ''}</span></td>
      <td>${x.left}/${x.n}</td><td>${num(x.dmg)}</td><td>${num(x.taken)}</td><td>${x.kills || 0}</td>${heals ? `<td>${x.heal > 0.5 ? num(x.heal) : '·'}</td>` : ''}</tr>`).join('');
    return `<div class="br-side ${id} ${sum.winner === id ? 'win' : ''}"><div class="br-h"><i class="bs-dot"></i><b>${SIDES[id].name}</b><span class="quiet small">${S.left} of ${S.start} standing · ${Math.round(S.health * 100)}% health</span></div>
      <table class="br-t"><thead><tr><th></th><th>Left</th><th>Damage</th><th>Taken</th><th>Kills</th>${heals ? '<th>Healed</th>' : ''}</tr></thead><tbody>${rows}</tbody></table></div>`;
  };
  r.innerHTML = `<div class="rcard battle ${sum.winner}"><div class="r-scroll">
    <span class="cap">Battle${T ? ' · ' + esc(T.name) : ''} · ${mmss(sum.time)}</span>
    <h1 class="t32">${head}</h1>${sub ? `<p class="quiet small br-sub">${sub}</p>` : ''}
    ${side('b')}${side('a')}</div>
    <div class="r-foot br-foot"><button class="btn primary" data-br="again">Again</button><button class="btn" data-br="change">Change sides</button><button class="btn ghost" data-br="camp">Camp</button></div></div>`;
}
function onResultClick(e) {
  const b = e.target.closest('[data-br]'); if (!b || !resultActs) return;
  const f = resultActs[b.dataset.br]; cue('tap');
  if (f) { const acts = resultActs; resultActs = null; f.call(acts); }
}
