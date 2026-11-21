// The battle HUD's hero cards (UI v3, docs/UI-v3.md): one slim row along the bottom. Each card, top to bottom:
// the face with the hero's items beside it as sprites; a slim HP bar (current/max); the level badge on the left of
// the XP bar (XP so far/needed); the three abilities as cooldown dials. Statuses float above the card as shrinking
// rings with their icon. Plain divs with block bars of set heights (iPhone Safari lays out a <button>'s children
// wrongly, which is how the bars once vanished). Tapping a card pauses and inspects that hero.
// unitStatuses(), unitItems() and ringSvg() are shared with inspect.js.
import { HEROES } from './heroes.js';
import { DEFS, xpToNext, levelHp } from './units.js';
import { icon, abilityGlyph, ABILITY_COLOR } from './icons.js';
import { elixirOf, POTIONS } from './potions.js';
import { STATUS, fillOf, RADIANCE, CURSE } from './statuses.js';

// ---------------------------------------------------------------- statuses on a unit
// Every status as { id, kind, icon, frac (1 = full ring, shrinking to 0), color, left (s, when known) }.
// A status that builds up toward its burst (burn, chill...) fills its ring toward the burst value, so it grows as
// hits land instead of jumping full (the old rings measured against the highest value seen, which read as 100%).
// Timed statuses shrink against the highest value seen since they began.
const STATUS_COL = { burn: '#FF7A2F', chill: '#7FD6F5', frozen: '#BFEFFF', poison: '#9BCB3C', wet: '#6FB7E8', shock: '#FFF27A',
  stagger: '#E8E2D0', stun: '#FFE14D', root: '#7FA04A', sleep: '#C9B8FF', ko: '#FFE7A0', guard: '#5B8CDB', invuln: '#FFE07A',
  taunt: '#E0604B', buff: '#7CC06F', debuff: '#C8553D', rage: '#E0604B', radiance: '#FFE48A', curse: '#9A5CC8', entangle: '#7FA04A', tangled: '#7A5A3A' };
const peaks = new WeakMap();
function peaked(u, id, v) {
  let p = peaks.get(u); if (!p) peaks.set(u, (p = {}));
  if (!(v > 0)) { delete p[id]; return 0; }
  if (!p[id] || v > p[id]) p[id] = v;
  return v / p[id];
}
// sim.js bursts every build-up status at 100 (round 7); lane S may give a unit its own.
const burstOf = (u, id) => (u.stMax && u.stMax[id]) || (u.burstAt && u.burstAt[id]) || 100;
// now: the world's time (lane S's build-up rings flash for a moment when they burst).
export function unitStatuses(u, now) {
  const out = [];
  if (!u || u.dead) return out;
  const add = (id, v, extra = {}) => { const f = peaked(u, id, v); if (f > 0) out.push({ id, kind: 'status', icon: id, frac: f, color: STATUS_COL[id], ...extra }); };
  const s = u.st || {};
  const build = (id, show) => { // a build-up: the ring is how close it is to bursting (statuses.js has each threshold)
    const burst = u.bursts && u.bursts[id] != null && now - u.bursts[id] < 0.5;
    if (show || burst) out.push({ id, kind: 'status', icon: id, frac: burst ? 1 : fillOf(u, id), color: STATUS[id].col, amount: s[id], build: true, burst });
  };
  if (u.frozenT > 0) add('frozen', u.frozenT, { left: u.frozenT }); else peaked(u, 'frozen', 0);
  if (u.radiantT > 0) out.push({ id: 'radiant', kind: 'status', icon: 'radiant', frac: u.radiantT / RADIANCE.auraT, color: STATUS.radiance.col, left: u.radiantT });
  if (u.hexed) out.push({ id: 'hexed', kind: 'status', icon: 'hexed', frac: u.hexT / CURSE.armT, color: STATUS.curse.col, left: u.hexT });
  build('burn', s.burn > 2);
  build('chill', s.chill > 2 && !(u.frozenT > 0));
  build('poison', s.poison > 2);
  build('wet', s.wet > 2);
  build('shock', s.shock > 2);
  build('stagger', s.stagger > 3);
  build('radiance', s.radiance > 2);
  build('curse', s.curse > 2);
  build('entangle', s.entangle > 2 && !(u.tangledT > 0)); // round 9
  add('tangled', u.tangledT, { left: u.tangledT });
  add('ko', u.koT, { left: u.koT });
  add('stun', u.stunT > 0.05 && !(u.koT > 0) && !(u.frozenT > 0) ? u.stunT : 0, { left: u.stunT });
  add('root', u.rootT, { left: u.rootT });
  add('sleep', u.sleepT, { left: u.sleepT });
  add('guard', u.guardBy && u.guardT > 0 ? u.guardT : 0, { left: u.guardT });
  add('invuln', u.invulnT > 0.05 ? u.invulnT : 0, { left: u.invulnT });
  if (u.team === 'enemy') add('taunt', u.tauntBy && u.tauntT > 0 ? u.tauntT : 0, { left: u.tauntT });
  for (const b of u.buffs || []) {
    if (!(b.t > 0)) continue;
    const long = b.dur >= 1000; // lasts the room (elixirs)
    const frac = long ? 1 : Math.min(1, b.t / (b.dur || b.t));
    if (b.potion) { out.push({ id: b.id, kind: 'potion', icon: b.potion, frac, color: POTIONS[b.potion].color, potion: b.potion }); continue; }
    if (b.id === 'rhythm') continue; // the bard's always-on hum: too constant to be worth a ring
    const bad = (b.move && b.move < 1) || (b.atkSpeed && b.atkSpeed < 1) || (b.taken && b.taken > 1) || (b.dealt && b.dealt < 1) || b.root;
    const ic = b.root ? 'root' : bad ? 'debuff' : b.id === 'rage' ? 'rage' : (b.taken && b.taken < 1) || b.frontBlock ? 'guard' : 'buff';
    out.push({ id: b.id, kind: 'status', icon: ic, frac, color: STATUS_COL[ic], left: long ? null : b.t, buff: b });
  }
  return out;
}
const RC = 2 * Math.PI * 10.2;
export function ringSvg(st, size = 24) {
  return `<span class="sring" data-sid="${st.id}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 24 24" width="${size}" height="${size}"><circle cx="12" cy="12" r="11.4" class="bg"/><circle cx="12" cy="12" r="10.2" class="trk"/>
    <circle cx="12" cy="12" r="10.2" class="arc" style="stroke:${st.color}" stroke-dasharray="${(st.frac * RC).toFixed(2)} ${RC.toFixed(2)}" transform="rotate(-90 12 12)"/></svg>${icon(st.kind, st.icon)}</span>`;
}
function setRing(el, st) {
  const arc = el && el.querySelector('.arc'); if (arc) arc.setAttribute('stroke-dasharray', `${(st.frac * RC).toFixed(2)} ${RC.toFixed(2)}`);
  if (el) el.classList.toggle('burst', !!st.burst); // a build-up that just burst: the ring flashes full
}

// ---------------------------------------------------------------- items a hero carries
// Trinkets (worn or found) and potions not drunk yet: { kind, id, lv, found }
export function unitItems(run, k, u) {
  const hs = run.heroes[k] || {};
  const list = (u && u.trinkets) || hs.trinkets || [];
  const out = [];
  for (const t of list) {
    const id = t && t.id ? t.id : t, el = elixirOf(id);
    if (el) out.push({ kind: 'potion', id: el });
    else out.push({ kind: 'trinket', id, lv: (t && t.lv) || 1, found: !!(t && t.uid) });
  }
  const heals = u ? u.potions : hs.potions;
  for (let i = 0; i < Math.min(3, heals || 0); i++) out.push({ kind: 'potion', id: 'heal' });
  return out;
}

// ---------------------------------------------------------------- the cards
const members = (r) => [...r.party, ...(r.hired || [])];
const heroUnit = (w, k) => w.units.find((x) => x.kind === k && x.team === 'hero' && !x.summon);
let built = '', onTap = null;
export function buildCards(run, artOf, tap) {
  onTap = tap;
  const c = document.getElementById('cards'); if (!c) return;
  const list = members(run);
  c.className = 'n' + Math.min(4, list.length) + (list.length > 4 ? ' two' : '');
  c.innerHTML = list.map((k) => {
    const merc = run.heroes[k].merc, H = HEROES[k];
    const abil = H ? H.abilities.map((ab) => `<span class="ab" data-ab="${ab.id}" style="--ac:${ABILITY_COLOR[abilityGlyph(ab.id)]}">${icon('ability', ab.id)}</span>`).join('') : '';
    return `<div role="button" tabindex="0" class="hcard${merc ? ' merc' : ''}" id="hc-${k}" data-k="${k}">
      <div class="hc-st"></div>
      <div class="hc-top"><div class="hc-face"><img src="${artOf(k)}" alt=""></div><div class="hc-items"></div></div>
      <div class="bar hp hc-hp"><i></i><em></em></div>
      <div class="hc-xprow"><span class="lvl hc-lv"></span><div class="bar xp hc-xp"><i></i><em></em></div></div>
      ${abil ? `<div class="hc-abil">${abil}</div>` : ''}
    </div>`;
  }).join('');
  for (const el of c.querySelectorAll('.hcard')) el.onclick = () => onTap && onTap(el.dataset.k);
  built = list.join(',');
}

export function updateCards(run) {
  const w = run.world;
  if (members(run).join(',') !== built) return false; // the caller rebuilds (a hire joined)
  for (const k of members(run)) {
    const el = document.getElementById('hc-' + k); if (!el) continue;
    const u = heroUnit(w, k), hs = run.heroes[k];
    const down = !!(hs.down || (u && u.downed));
    const maxHp = u ? u.maxHp : hs.maxHp || levelHp(DEFS[k].hp, hs.level); // hs.maxHp: kept as a hero steps through a door
    const hp = down ? 0 : u ? Math.max(0, u.hp) : hs.hp != null ? hs.hp : maxHp;
    el.classList.toggle('down', down);
    el.classList.toggle('low', !down && hp / maxHp < 0.35);
    el.querySelector('.hc-hp > i').style.width = (100 * hp / maxHp).toFixed(1) + '%';
    el.querySelector('.hc-hp > em').textContent = `${Math.ceil(hp)}/${Math.round(maxHp)}`;
    const need = xpToNext(hs.level);
    el.querySelector('.hc-xp > i').style.width = Math.min(100, 100 * hs.xp / need).toFixed(1) + '%';
    el.querySelector('.hc-xp > em').textContent = `${Math.floor(hs.xp)}/${need}`;
    const lv = el.querySelector('.hc-lv');
    if (lv.textContent !== String(hs.level)) { if (lv.textContent) { lv.classList.remove('up'); void lv.offsetWidth; lv.classList.add('up'); } lv.textContent = hs.level; }
    // abilities: a dark wedge sweeps away as the cooldown runs out; dim when not learned
    const H = HEROES[k];
    if (H) for (const ab of H.abilities) {
      const a = el.querySelector(`[data-ab="${ab.id}"]`); if (!a) continue;
      const tier = u && u.kit ? u.kit.tiers[ab.id] || 0 : 0;
      const cd = u && u.kit ? Math.max(0, u.kit.cd[ab.id] || 0) : 0;
      a.classList.toggle('off', !tier);
      a.classList.toggle('ready', !!tier && cd <= 0 && !down);
      a.style.setProperty('--p', tier ? Math.min(1, cd / ab.cd).toFixed(3) : 0);
    }
    // items: rebuilt only when the list changes
    const items = down ? [] : unitItems(run, k, u);
    const ikey = items.map((i) => i.kind + i.id + (i.lv || '')).join('|');
    const ib = el.querySelector('.hc-items');
    if (ib.dataset.key !== ikey) {
      ib.dataset.key = ikey;
      ib.innerHTML = items.slice(0, 6).map((i) => `<span class="it${i.lv > 1 ? ' lv' : ''}">${icon(i.kind, i.id)}</span>`).join('');
    }
    // statuses: rings rebuilt when the set changes, arcs updated in place otherwise
    const sts = down || !u ? [] : unitStatuses(u, w.time).slice(0, 4);
    const skey = sts.map((s) => s.id).join('|');
    const sb = el.querySelector('.hc-st');
    if (sb.dataset.key !== skey) { sb.dataset.key = skey; sb.innerHTML = sts.map((s) => ringSvg(s, 24)).join(''); }
    else sts.forEach((s, i) => setRing(sb.children[i], s));
  }
  return true;
}
