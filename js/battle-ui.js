// Battle mode's screens (round 10; redone in round 13 from the designer's answers; the rules are in battle.js): the
// setup page (two sides, a picker of everything you can field), the strip along the bottom of a battle, and the result.
// The field runs up the screen with Blue at the bottom and Red at the top, so every screen stacks them that way.
// Round 13: a hero stack has a tier (Yours, or 0-3: heroes.js tierBuild), the picker adds "as" a tier or a rank so one
// kind can be fielded at several ("2 major slimes and 1 normal slime and 3 elites"), a ground size, a strength switch
// (dungeon strength or even), a stack per row, and a result built on bars. Round 14: the dev switch that fields
// everything (save.battleDev) lives with the other dev controls now, in the camp's Settings ("Put all dev controls in 1
// place"); tapping a row's picture opens that unit's page (js/unit.js).
import { DEFS } from './units.js';
import { THEMES, DUNGEON_ORDER } from './themes.js';
import { portrait } from './inspect.js';
import { I } from './ui-kit.js';
import { cue } from './sfx.js';
import { dungeonOpen } from './progress.js';
import { openUnit } from './unit.js';
import { battleRoster, cleanSetup, setupProblem, countOf, isHero, isBoss, canRank, sideOf, standing, keyOf, tierName, SIDES, SIDE_MAX, STACK_MAX, RANKS, TIERS, SIZES } from './battle.js';

let api = null, el = null, setup = null, adding = null, tab = 'heroes', note = '';
let asTier = null, asRank = 0; // what the picker adds as: a hero's tier (null = Yours), a monster's rank
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nameOf = (k) => (DEFS[k] ? DEFS[k].name : k);
const pic = (k, cls = '') => `<span class="b-pic ${cls} ${isHero(k) ? 'hero' : ''}"><img src="${portrait(k)}" alt=""></span>`;
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const rankName = (r) => RANKS[r] || 'Plain';
// A stack's tag: a hero's tier, a monster's rank, or what it is when it has neither.
const tagOf = (s) => (isHero(s.k) ? tierName(s.tier) : isBoss(s.k) ? 'Boss' : canRank(s.k) ? rankName(s.rank) : 'Plain');
const tagCls = (s) => (isHero(s.k) ? (s.tier == null ? '' : 't' + s.tier) : s.rank ? 'r' + s.rank : '');
const same = (x, s) => x.k === s.k && (x.rank || 0) === (s.rank || 0) && (x.tier ?? null) === (s.tier ?? null);

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
  const rows = list.map((s, i) => `<div class="bs-row ${tagCls(s)}">
      <div role="button" class="bs-info" data-b="info:${side}:${i}">${pic(s.k, 'md')}</div>
      <div class="bs-mid"><b class="bs-name">${esc(nameOf(s.k))}</b>
        ${isHero(s.k) || canRank(s.k) ? `<button class="bs-tag" data-b="tag:${side}:${i}">${esc(tagOf(s))}</button>` : `<span class="bs-tag none">${esc(tagOf(s))}</span>`}</div>
      <div class="bs-step"><button data-b="dec:${side}:${i}" aria-label="one fewer">−</button><b>${s.n}</b><button data-b="inc:${side}:${i}" aria-label="one more">+</button></div>
    </div>`).join('');
  return `<section class="bs-side ${side}">
    <div class="bs-h"><i class="bs-dot"></i><b>${SIDES[side].name}</b><span class="quiet small">${n} of ${SIDE_MAX}</span>
      ${n ? `<button class="bs-clear" data-b="clear:${side}">Clear</button>` : ''}</div>
    ${rows || `<p class="bs-empty">Nobody yet.</p>`}
    <button class="bs-add" data-b="add:${side}">${I.plus}<span>Add to ${SIDES[side].name}</span></button>
  </section>`;
}

function pickerHtml() {
  const save = api.save(), R = battleRoster(save), list = setup[adding];
  const tabs = [`<button class="${tab === 'heroes' ? 'on' : ''}" data-b="tab:heroes">Heroes</button>`,
    ...R.dungeons.map((d) => `<button class="${tab === d.id ? 'on' : ''} ${d.open ? '' : 'locked'}" data-b="tab:${d.id}">${d.open ? '' : I.lock}${esc(d.name.replace(/^The /, ''))}</button>`)].join('');
  const heroTab = tab === 'heroes';
  const have = (k) => list.filter((s) => s.k === k).reduce((a, s) => a + s.n, 0);
  const tile = (k) => `<button class="bp-tile ${isBoss(k) ? 'boss' : ''}" data-b="pick:${k}">${pic(k)}${have(k) ? `<i class="bp-n">${have(k)}</i>` : ''}<span class="bp-name">${esc(nameOf(k))}</span>${isBoss(k) ? '<em>Boss</em>' : ''}</button>`;
  // "Add as": the tier or rank the next taps add at, so one kind can go in at several
  const as = heroTab
    ? `<div class="bp-as"><span class="cap">Add at</span><div class="seg">${TIERS.map((t) => `<button class="${asTier === t ? 'on' : ''}" data-b="astier:${t == null ? 'y' : t}">${t == null ? 'Yours' : t}</button>`).join('')}</div></div>`
    : `<div class="bp-as"><span class="cap">Add as</span><div class="seg">${[0, 1, 2].map((r) => `<button class="${asRank === r ? 'on' : ''}" data-b="asrank:${r}">${rankName(r)}</button>`).join('')}</div></div>`;
  let body;
  if (heroTab) {
    const hint = asTier == null ? 'Yours: the skills and trinkets the hero has at camp.' : ['Tier 0: nothing bought.', 'Tier 1: the first shell of the web, every ability at I.', 'Tier 2: the second shell, every ability at II.', 'Tier 3: the whole web, every ability at III.'][asTier] + ' No trinkets.';
    body = R.heroes.length ? `${as}<div class="bp-grid">${R.heroes.map(tile).join('')}</div><p class="quiet small bp-foot">${hint}</p>` : '<p class="quiet">No heroes yet.</p>';
  } else {
    const d = R.dungeons.find((x) => x.id === tab);
    body = !d ? '' : d.open ? `${as}<div class="bp-grid">${[...d.kinds, ...d.bosses].map(tile).join('')}</div><p class="quiet small bp-foot">${setup.scaled ? `As strong as on the first floor of ${esc(d.name)}.` : 'Strength is evened out: every monster as at the first dungeon.'} Bosses have no ranks.</p>`
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
  const body = el.querySelector('.bs-body'), bt = body ? body.scrollTop : 0;
  const opt = (act, cap, val) => `<div role="button" class="bs-opt" data-b="${act}"><span class="cap">${cap}</span><b>${esc(val)}</b></div>`;
  el.innerHTML = `<div class="bs">
    <header class="bs-bar"><button class="top-back" data-b="close" aria-label="back">${I.back}</button><h1 class="top-title sm">Battle</h1></header>
    <div class="bs-opts">${opt('arena', 'Ground', T ? T.name.replace(/^The /, '') : '')}${opt('size', 'Size', SIZES[setup.size].name)}${opt('scaled', 'Strength', setup.scaled ? 'By dungeon' : 'Evened out')}</div>
    <div class="bs-body">${sideHtml('b')}
      <div class="bs-vs"><i></i><button class="bs-swap" data-b="swap">Swap sides</button><i></i></div>
      ${sideHtml('a')}</div>
    <footer class="bs-foot"><p class="bs-note ${note ? 'warn' : ''}">${esc(note || problem || 'Nothing is won or lost here: no gold, no XP.')}</p>
      <button class="btn primary wide" data-b="fight" ${problem ? 'disabled' : ''}>Fight</button></footer>
    ${adding ? pickerHtml() : ''}</div>`;
  const nb = el.querySelector('.bp-body'); if (nb) nb.scrollTop = st;
  const nt = el.querySelector('.bp-tabs'); if (nt) nt.scrollLeft = sl;
  const b2 = el.querySelector('.bs-body'); if (b2) b2.scrollTop = bt;
}

function say(text) { note = text; cue('deny'); }
function addOne(side, k) {
  const list = setup[side], other = setup[side === 'a' ? 'b' : 'a'];
  if (countOf(list) >= SIDE_MAX) return say(`A side holds ${SIDE_MAX} at most.`);
  if (isBoss(k) && other.some((s) => isBoss(s.k))) return say('Bosses can only be on one side.');
  const want = { k, n: 1, rank: canRank(k) ? asRank : 0, tier: isHero(k) ? asTier : null };
  const s = list.find((x) => same(x, want));
  if (s) { if (s.n >= STACK_MAX) return say(`${STACK_MAX} of one kind at most.`); s.n++; }
  else list.push(want);
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
    case 'astier': asTier = p === 'y' ? null : +p; cue('tap'); break;
    case 'asrank': asRank = +p; cue('tap'); break;
    case 'pick': addOne(adding, p); break;
    case 'info': { // a row's picture: that unit's own page (round 14, js/unit.js), back returns here
      const s = setup[p][+q]; if (!s) break;
      cue('tap'); openUnit({ save: api.save(), kind: isHero(s.k) ? 'hero' : 'foe', id: s.k, rank: s.rank || 0, page: isHero(s.k) ? 'preview' : 'overview', onBack: () => {} });
      return;
    }
    case 'inc': { // one more of that very stack (its tag too)
      const s = setup[p][+q]; if (!s) break;
      if (countOf(setup[p]) >= SIDE_MAX) say(`A side holds ${SIDE_MAX} at most.`); else if (s.n >= STACK_MAX) say(`${STACK_MAX} of one kind at most.`); else { s.n++; cue('tap'); }
      break;
    }
    case 'dec': { const s = setup[p][+q]; if (s && --s.n <= 0) setup[p].splice(+q, 1); cue('tap'); break; }
    case 'tag': { // the whole stack to the next tier or rank; it joins a stack that's already there
      const list = setup[p], s = list[+q]; if (!s) break;
      const next = { ...s };
      if (isHero(s.k)) next.tier = TIERS[(TIERS.indexOf(s.tier ?? null) + 1) % TIERS.length];
      else next.rank = ((s.rank || 0) + 1) % 3;
      const there = list.find((x) => x !== s && same(x, next));
      if (there) { there.n = Math.min(STACK_MAX, there.n + s.n); list.splice(+q, 1); } else { s.tier = next.tier; s.rank = next.rank; }
      cue('tap'); break;
    }
    case 'clear': setup[p] = []; cue('tap'); break;
    case 'swap': { const t = setup.a; setup.a = setup.b; setup.b = t; cue('tap'); break; }
    case 'arena': {
      const save = api.save(), open = DUNGEON_ORDER.filter((id) => THEMES[id] && (save.cheat || save.battleDev || dungeonOpen(save, id)));
      setup.arena = open[(open.indexOf(setup.arena) + 1) % open.length] || setup.arena; cue('tap'); break;
    }
    case 'size': { const ids = Object.keys(SIZES); setup.size = ids[(ids.indexOf(setup.size) + 1) % ids.length]; cue('tap'); break; }
    case 'scaled': setup.scaled = !setup.scaled; cue('tap'); break;
    case 'fight': {
      const problem = setupProblem(setup); if (problem) { say(problem); break; }
      keep(); adding = null; api.onFight(JSON.parse(JSON.stringify(setup))); return;
    }
  }
  render();
}

// ================================================================ the strip under a battle
let dockTap = null, dockRun = null;
export function buildBattleDock(run, onTap) {
  dockTap = onTap; dockRun = run;
  const c = document.getElementById('cards'); if (!c) return;
  c.className = 'bd';
  const row = (side) => `<div class="bd-row ${side}"><div class="bd-team"><b>${SIDES[side].name}</b><span class="bd-count" data-bd="count:${side}"></span><div class="bar bd-hp"><i data-bd="hp:${side}"></i></div></div>
    <div class="bd-chips">${run.setup[side].map((s) => `<div role="button" class="bd-chip ${tagCls(s)}" data-bd="chip:${keyOf(side, s)}">${pic(s.k, 'sm')}<b></b>${isHero(s.k) && s.tier != null ? `<em>${s.tier}</em>` : ''}</div>`).join('')}</div></div>`;
  c.innerHTML = row('b') + row('a');
  c.onclick = (e) => {
    const chip = e.target.closest('.bd-chip'); if (!chip || !dockTap) return;
    const key = chip.dataset.bd.slice(5), u = dockRun.sides[key[0]].find((x) => x.bkey === key && !x.dead); if (u) dockTap(u);
  };
  updateBattleDock(run);
}
// Returns false when the strip isn't this battle's (main.js rebuilds it).
export function updateBattleDock(run) {
  const c = document.getElementById('cards'); if (!c || dockRun !== run || !c.classList.contains('bd')) return false;
  for (const side of ['a', 'b']) {
    let hp = 0, max = 0; const left = {};
    for (const u of run.sides[side]) { max += u.maxHp; const on = !u.dead && !u.downed; if (on) { hp += Math.max(0, u.hp); left[u.bkey] = (left[u.bkey] || 0) + 1; } }
    const bar = c.querySelector(`[data-bd="hp:${side}"]`); if (bar) bar.style.width = (max ? 100 * hp / max : 0) + '%';
    const cnt = c.querySelector(`[data-bd="count:${side}"]`); if (cnt) cnt.textContent = String(standing(run, side).length);
    for (const s of run.setup[side]) {
      const chip = c.querySelector(`[data-bd="chip:${keyOf(side, s)}"]`); if (!chip) continue;
      const n = left[keyOf(side, s)] || 0;
      chip.querySelector('b').textContent = s.n > 1 ? `${n}/${s.n}` : '';
      chip.classList.toggle('out', !n);
    }
  }
  return true;
}
export const battleTitle = (run) => `Battle · ${mmss(run.t)}`;
export { sideOf };

// ================================================================ the result
// Round 13 ("Don't like this screen layout"): the verdict, then each side as a short list. A row is one kind: who is
// left, a bar for the damage it dealt (every bar on the card to one scale, so the sides compare at a glance), and one
// quiet line for what it took, its kills and its healing.
let resultActs = null;
export function showBattleResult(sum, acts) {
  resultActs = acts; // { again(), change(), camp() }
  const r = document.getElementById('result'), T = THEMES[sum.arena];
  const head = sum.winner === 'draw' ? 'A draw' : `${SIDES[sum.winner].name} wins`;
  const sub = sum.timeUp ? (sum.winner === 'draw' ? 'Stopped with the sides level.' : `Stopped early: ${SIDES[sum.winner].name} had more of its health left.`) : '';
  const num = (n) => (n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n || 0)));
  const top = Math.max(1, ...['a', 'b'].flatMap((id) => sum.sides[id].rows.map((x) => x.dmg || 0)));
  const side = (id) => {
    const S = sum.sides[id];
    const rows = S.rows.map((x) => {
      const tag = isHero(x.k) ? (x.tier == null ? '' : tierName(x.tier)) : x.rank ? RANKS[x.rank] : '';
      const bits = [`took ${num(x.taken)}`, x.blocked > 0.5 ? `blocked ${num(x.blocked)}` : '', `${x.kills || 0} ${x.kills === 1 ? 'kill' : 'kills'}`, x.heal > 0.5 ? `healed ${num(x.heal)}` : ''].filter(Boolean).join(' · ');
      return `<div class="br-row ${x.left ? '' : 'out'}">${pic(x.k, 'md')}
        <div class="br-mid"><div class="br-top"><b>${esc(nameOf(x.k))}${x.n > 1 ? ` ×${x.n}` : ''}</b>${tag ? `<i class="br-tag">${esc(tag)}</i>` : ''}<span class="br-left">${x.left}/${x.n} left</span></div>
          <div class="br-bar"><i style="width:${Math.max(1.5, 100 * (x.dmg || 0) / top)}%"></i><em>${num(x.dmg)} damage</em></div>
          <span class="br-bits">${bits}</span></div></div>`;
    }).join('');
    return `<div class="br-side ${id} ${sum.winner === id ? 'win' : ''}"><div class="br-h"><i class="bs-dot"></i><b>${SIDES[id].name}</b><span class="quiet small">${S.left} of ${S.start} standing</span>
        <div class="bar br-hp"><i style="width:${Math.round(S.health * 100)}%"></i></div></div>${rows}</div>`;
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
