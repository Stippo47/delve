// Pause and inspect (round 6; UI v3 look): while the dungeon is paused, a panel over the bottom of the screen shows one unit in
// full: health, level, statuses (what each does and how long it has left), abilities with their cooldowns, the trait,
// trinkets and potions with their descriptions and fun lines; enemies get their bestiary page. Tap a face along the
// top of the panel, a hero card, or any unit in the arena to look at it. The arena keeps no words: the chosen unit
// just gets a ring (drawn by main.js through drawSelection).
import { HEROES } from './heroes.js';
import { DEFS, xpToNext } from './units.js';
import { TRINKETS } from './trinkets.js';
import { icon, abilityGlyph, ABILITY_COLOR } from './icons.js';
import { unitStatuses, unitItems, ringSvg } from './hud.js';
import { STATUSES, beastFun, beastHabit, trinketFun, POTION_FUN } from './bestiary.js';
import { POTIONS } from './potions.js';
import { getSprite } from './sprites.js';
import { view } from './render.js';
import { I } from './ui-kit.js';
import { numbersOf } from './numbers.js';
import { numbersRow, runLine } from './stats-ui.js';

const ROLE = { tank: 'Tank', melee: 'Fighter', skirmish: 'Skirmisher', ranged: 'Ranged', caster: 'Caster', support: 'Support' };
const roman = (n) => ['', 'I', 'II', 'III'][n] || '';
const secs = (t) => (t >= 10 ? Math.round(t) : t.toFixed(1)) + 's';

let el = null, run = null, sel = null, onResume = null;
export function initInspect(resume) {
  el = document.getElementById('inspect'); onResume = resume;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ip]'); if (!b) return;
    const [a, arg] = b.dataset.ip.split(':');
    if (a === 'resume') onResume();
    else if (a === 'unit') { const u = run.world.units.find((x) => x.id === +arg); if (u) select(u); }
  });
}
export const inspecting = () => !!(el && !el.classList.contains('hidden'));
export const selected = () => sel;
export function openInspect(r, unit) {
  run = r; el.classList.remove('hidden');
  select(unit || partyUnits(r)[0] || null);
}
export function closeInspect() { if (el) el.classList.add('hidden'); sel = null; }
export function panelHeight() { return inspecting() ? el.getBoundingClientRect().height : 0; }

const partyUnits = (r) => r.world.units.filter((u) => u.team === 'hero' && !u.summon && !u.dead && !u.ethereal);
export function select(u) {
  sel = u;
  render();
  // bring the unit into the part of the room above the panel
  if (u) { view.manual = u.x; view.manualY = u.y; view.manualT = 1e9; }
}

// The unit under a tap (screen CSS pixels), or null.
export function unitAt(w, sx, sy) {
  const m = view.m, det = m[0] * m[3] - m[1] * m[2]; if (!det) return null;
  const x = (m[3] * (sx - m[4]) - m[2] * (sy - m[5])) / det, y = (-m[1] * (sx - m[4]) + m[0] * (sy - m[5])) / det;
  let best = null, bd = Infinity;
  for (const u of w.units) {
    if (u.dead || u.ethereal || u.team === 'neutral') continue;
    const d = Math.hypot(u.x - x, u.y - y) - u.r;
    if (d < 22 && d < bd) { bd = d; best = u; }
  }
  return best;
}

// A ring round the chosen unit, in the arena (no words).
export function drawSelection(ctx, t) {
  if (!sel || sel.dead) return;
  const d = view.dpr, m = view.m;
  ctx.setTransform(d * m[0], d * m[1], d * m[2], d * m[3], d * m[4], d * m[5]);
  const r = sel.r + 10 + Math.sin(t * 5) * 2;
  ctx.lineWidth = 6 / view.scale; ctx.strokeStyle = 'rgba(43,34,48,0.8)';
  ctx.beginPath(); ctx.arc(sel.x, sel.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3 / view.scale; ctx.strokeStyle = sel.team === 'hero' ? '#FFE14D' : '#FF7A5A';
  ctx.setLineDash([10 / view.scale, 6 / view.scale]); ctx.lineDashOffset = -t * 30 / view.scale;
  ctx.beginPath(); ctx.arc(sel.x, sel.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
}

// ---------------------------------------------------------------- the panel
const faceCache = {};
export function portrait(kind) {
  const d = DEFS[kind]; if (!d) return '';
  if (d.portrait || d.art) return d.portrait || d.art; // (round 13, lane E: def.portrait, a still picture when the art alone isn't the whole look: a spirit's tail is drawn by the game)
  if (faceCache[kind]) return faceCache[kind];
  const spr = getSprite(kind === 'slimeSmall' ? 'slimeSmall' : kind, 120);
  return (faceCache[kind] = spr && spr.img && spr.img.toDataURL ? spr.img.toDataURL() : '');
}

function render() {
  if (!el || !run) return;
  const w = run.world;
  // a battle (battle.js): Blue's units, then Red's, whatever they are
  const sd = w.battle ? w.battle.side : null, live = (u) => !u.dead && !u.summon && !u.ethereal;
  const party = sd ? w.units.filter((u) => live(u) && sd[u.team] === 'a').slice(0, 8) : partyUnits(run);
  const foes = sd ? w.units.filter((u) => live(u) && sd[u.team] === 'b') : w.units.filter((u) => u.team === 'enemy' && !u.dead && !u.summon);
  const face = (u) => `<button class="ip-face ${u === sel ? 'on' : ''} ${sd ? (sd[u.team] === 'a' ? 'hero side-a' : 'enemy side-b') : u.team} ${u.downed ? 'down' : ''}" data-ip="unit:${u.id}"><img src="${portrait(u.kind)}" alt=""></button>`;
  const strip = `<div class="ip-strip">${party.map(face).join('')}${foes.length ? '<i class="ip-sep"></i>' : ''}${foes.slice(0, 10).map(face).join('')}</div>`;
  el.innerHTML = `<div class="ip-panel">${strip}<div class="ip-body">${sel ? body(sel) : '<p class="ip-p">Tap someone.</p>'}</div>
    <div class="ip-foot"><button class="btn primary" data-ip="resume">${I.play}Play on</button></div></div>`;
}

function body(u) {
  const d = u.def, hero = HEROES[u.kind], hs = run.heroes[u.kind];
  const hp = Math.max(0, Math.ceil(u.hp)), max = Math.round(u.maxHp);
  const bt = run.world.battle, mine = bt ? d.team === 'hero' : u.team === 'hero';
  const sub = (bt ? (bt.side[u.team] === 'a' ? 'Blue · ' : 'Red · ') : '') + (hero ? ROLE[hero.role] : mine ? (bt ? 'Called help' : `Hired hand · level ${u.level || 1}`) : d.boss ? 'Boss' : u.major ? 'Major' : u.elite ? 'Elite' : bt ? 'Monster' : 'Enemy');
  let html = `<div class="ip-head"><span class="ip-pic"><img src="${portrait(u.kind)}" alt=""></span><div><h2>${d.name}</h2><span class="cap">${sub}${u.downed ? ' · down' : ''}</span>
    <div class="bar hp"><i style="width:${100 * hp / max}%"></i><em>${hp}/${max}</em></div>
    ${hs && !hs.merc ? `<div class="xpline"><span class="lvl">${hs.level}</span><div class="bar xp"><i style="width:${Math.min(100, 100 * hs.xp / xpToNext(hs.level))}%"></i><em>${Math.floor(hs.xp)}/${xpToNext(hs.level)}</em></div></div>` : ''}</div></div>`;
  // its real numbers right now (numbers.js, from sim.js unitNumbers: the web, trinkets, buffs and statuses all in), and this run so far
  html += numbersRow(numbersOf(u));
  const rs = run.stats && u.team === 'hero' && !u.summon && run.stats.heroes[u.kind];
  if (rs) html += `<h3 class="cap">This run</h3>${runLine(rs)}`;
  // statuses
  const sts = unitStatuses(u, run.world.time);
  if (sts.length) html += `<h3 class="cap">Right now</h3><ul class="ip-list">${sts.map((s) => {
    const info = s.potion ? { name: POTIONS[s.potion].name, desc: POTIONS[s.potion].desc } : s.name ? s : STATUSES[s.id] || STATUSES[s.icon] || STATUSES.buff; // (round 13: buffs and states carry their own name)
    const left = s.left != null ? secs(s.left) : s.potion ? 'this room' : '';
    return `<li>${ringSvg(s, 30)}<span><b>${info.name}</b>${left ? `<i class="ip-t">${left}</i>` : ''}<span>${info.desc}</span></span></li>`;
  }).join('')}</ul>`;
  if (hero) {
    html += `<h3 class="cap">Abilities</h3><ul class="ip-list">${hero.abilities.map((ab) => {
      const tier = u.kit ? u.kit.tiers[ab.id] || 0 : 0, cd = u.kit ? Math.max(0, u.kit.cd[ab.id] || 0) : 0;
      const state = tier ? (cd > 0 ? secs(cd) : 'ready') : 'not learned';
      return `<li class="${tier ? '' : 'dim'}"><span class="ab big ${tier && cd <= 0 ? 'ready' : ''}" style="--ac:${ABILITY_COLOR[abilityGlyph(ab.id)]};--p:${tier ? Math.min(1, cd / ab.cd) : 0}">${icon('ability', ab.id)}</span>
        <span><b>${ab.name}</b>${tier ? `<i class="ip-tier">${roman(tier)}</i>` : ''}<i class="ip-t">${state}</i><span>${ab.desc}${tier ? ' ' + ab.tiers[tier - 1] : ''}</span></span></li>`;
    }).join('')}</ul>
    <h3 class="cap">Trait</h3><p class="ip-p"><b>${hero.trait.name}.</b> ${hero.trait.desc}</p>`;
  }
  if (mine) {
    const items = unitItems(run, u.kind, u);
    html += `<h3 class="cap">Carrying</h3>${items.length ? `<ul class="ip-list">${items.map((i) => {
      if (i.kind === 'potion') { const p = POTIONS[i.id]; return `<li><span class="it big">${icon('potion', i.id)}</span><span><b>${p.name}</b><span>${p.desc}</span><em>${POTION_FUN[i.id] || ''}</em></span></li>`; }
      const t = TRINKETS[i.id] || { name: i.id, desc: '' };
      return `<li><span class="it big">${icon('trinket', i.id, '', t.color)}</span><span><b>${t.name}</b>${i.lv > 1 ? `<i class="ip-tier">${roman(i.lv)}</i>` : ''}${i.found ? '<i class="ip-t">found here</i>' : ''}<span>${t.desc}</span><em>${trinketFun(i.id)}</em></span></li>`;
    }).join('')}</ul>` : '<p class="ip-p">Nothing.</p>'}`;
  } else {
    const res = Object.entries(d.res || {}).filter(([, v]) => v !== 1);
    const word = { burn: 'fire', chill: 'cold', poison: 'poison', shock: 'lightning', wet: 'water' };
    html += `<h3 class="cap">From the bestiary</h3><p class="ip-p"><em>${beastFun(u.kind)}</em></p>${beastHabit(u.kind) ? `<p class="ip-p">${beastHabit(u.kind)}</p>` : ''}
      ${res.length ? `<div class="reschips">${res.map(([k, v]) => `<span class="${v < 1 ? 'res' : 'weak'}">${icon('status', k)}${v === 0 ? 'Immune to' : v < 1 ? 'Shrugs off' : 'Weak to'} ${word[k] || k}</span>`).join('')}</div>` : ''}`;
  }
  return html;
}
export function refreshInspect() { if (inspecting()) render(); }
