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
import { STATUS, fillOf, RADIANCE, CURSE, POISON, CHARM, CONFUSE, FEAR, SHACKLE, HERO_STATUS, HERO_STATUS_IDS } from './statuses.js';
import { BUFFS, STATES } from './bestiary.js';

// ---------------------------------------------------------------- statuses on a unit
// Every status as { id, kind, icon, frac (1 = full ring, shrinking to 0), color, left (s, when known) }.
// A status that builds up toward its burst (burn, chill...) fills its ring toward the burst value, so it grows as
// hits land instead of jumping full (the old rings measured against the highest value seen, which read as 100%).
// Timed statuses shrink against the highest value seen since they began.
const STATUS_COL = { burn: '#FF7A2F', chill: '#7FD6F5', frozen: '#BFEFFF', poison: '#9BCB3C', wet: '#6FB7E8', shock: '#FFF27A',
  stagger: '#E8E2D0', stun: '#FFE14D', root: '#7FA04A', sleep: '#C9B8FF', ko: '#FFE7A0', guard: '#5B8CDB', invuln: '#FFE07A',
  taunt: '#E0604B', buff: '#7CC06F', debuff: '#C8553D', rage: '#E0604B', radiance: '#FFE48A', curse: '#9A5CC8', entangle: '#7FA04A' };
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
  if (u.sickT > 0) out.push({ id: 'sick', kind: 'status', icon: 'sick', frac: u.sickT / POISON.sickT, color: STATUS.poison.col, left: u.sickT });
  build('wet', s.wet > 2);
  build('shock', s.shock > 2);
  build('stagger', s.stagger > 3);
  build('radiance', s.radiance > 2);
  build('curse', s.curse > 2);
  build('entangle', s.entangle > 2); // round 9 (round 13: its burst roots: the one Rooted below)
  // round 13 (lane S): the new five; charm, confusion and fear have a burst state that lasts, bleeding's is a moment
  if (u.flipKind === 'charm') out.push({ id: 'charmed', kind: 'status', icon: 'charmed', frac: Math.max(0, (u.flipUntil - (now ?? u.flipUntil)) / CHARM.dur), color: STATUS.charm.col, left: u.flipUntil != null && now != null ? u.flipUntil - now : null });
  else build('charm', s.charm > 2);
  if (u.addledT > 0) out.push({ id: 'addled', kind: 'status', icon: 'addled', frac: u.addledT / CONFUSE.addledT, color: STATUS.confuse.col, left: u.addledT });
  else build('confuse', s.confuse > 2);
  build('sleepy', s.sleepy > 2);
  build('bleed', s.bleed > 2);
  if (u.fearT > 0) out.push({ id: 'terrified', kind: 'status', icon: 'terrified', frac: u.fearT / FEAR.terrT, color: STATUS.fear.col, left: u.fearT });
  else build('fear', s.fear > 2);
  // round 15 (lane N): Shackled
  if (u.shackledT > 0) out.push({ id: 'shackled', kind: 'status', icon: 'shackled', frac: u.shackledT / (u.shackledMax || SHACKLE.dur), color: STATUS.shackle.col, left: u.shackledT });
  else build('shackle', s.shackle > 2);
  if (u.silencedT > 0) out.push({ id: 'silenced', kind: 'status', icon: 'silenced', frac: Math.min(1, u.silencedT / 3), color: '#E5484D', left: u.silencedT }); // round 17 (lane tags17)
  // round 15 (lane E): the newer heroes' eight (statuses.js HERO_STATUS): Whirled and Spun fill toward their burst, as
  // the build-ups above; Dirty, Targeted, Tracked, Trapped, Warded and Weakened run out (Warded and Weakened were shown
  // as plain buffs: they are skipped below)
  for (const id of HERO_STATUS_IDS) {
    const H = HERO_STATUS[id];
    if (H.kind === 'build') { const v = H.value(u), burst = u.bursts && u.bursts[id] != null && now - u.bursts[id] < 0.5; if (v > 2 || burst) out.push({ id, kind: 'status', icon: id, frac: burst ? 1 : Math.min(1, v / H.need), color: H.col, amount: v, build: true, burst }); }
    else { const left = H.left(u, now); if (left > 0) out.push({ id, kind: 'status', icon: id, frac: Math.min(1, left / H.dur(u)), color: H.col, left }); }
  }
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
    if (b.id === 'warded' || b.id === 'weakened') continue; // (round 15, lane E: statuses now, above)
    // round 13 ("Some positive status effects don't show"): every buff by its own name and icon (bestiary.js BUFFS), with
    // what its numbers do; a stance that holds the hero still is a help, not "Rooted"
    const info = BUFFS[b.id], bad = info ? !!info.bad : badBuff(b);
    const ic = (info && info.icon) || (bad ? 'debuff' : autoIcon(b));
    out.push({ id: b.id, kind: 'status', icon: ic, frac, color: STATUS_COL[ic] || (bad ? STATUS_COL.debuff : '#7CC06F'), left: long ? null : b.t, buff: b,
      name: info ? info.name : nameOf(b.id), desc: [info && info.desc, buffLine(b)].filter(Boolean).join(' ') });
  }
  // round 13: helpful states that aren't buffs (an ability or a trait switched on)
  for (const [id, f] of Object.entries(STATE_TESTS)) {
    const v = f(u, now); if (!v) continue;
    const st = STATES[id], c = STATE_COL[st.icon] || '#7CC06F';
    out.push({ id, kind: 'status', icon: st.icon, frac: typeof v === 'object' ? Math.max(0, Math.min(1, v.frac)) : 1, color: c, left: typeof v === 'object' ? v.left : null, name: v.name || st.name, desc: v.desc || st.desc });
  }
  return out;
}
const STATE_COL = { regen: '#7CC06F', guard: '#5B8CDB', immune: '#FFE07A', hidden: '#9C7650', focus: '#FFE7A0', might: '#E8B53A', haste: '#E8D84A', ward: '#5DB7E0', form: '#8A8484', lifesteal: '#C8453D', stance: '#8F97A3' };
Object.assign(STATUS_COL, { charm: STATUS.charm.col, charmed: STATUS.charm.col, confuse: STATUS.confuse.col, addled: STATUS.confuse.col, sleepy: STATUS.sleepy.col, bleed: STATUS.bleed.col, fear: STATUS.fear.col, terrified: STATUS.fear.col, shackle: STATUS.shackle.col, shackled: STATUS.shackle.col }, STATE_COL);
const until = (t, now, dur) => (t > now ? { frac: (t - now) / dur, left: t - now } : null);
// Each returns false, true (full ring) or { frac, left }.
const STATE_TESTS = {
  regen: (u) => u.regenT > 0 && { frac: u.regenT / 6, left: u.regenT },
  guarding: (u) => u.guardOf && u.guardOfT > 0 && { frac: u.guardOfT / 5, left: u.guardOfT },
  gasForm: (u) => u.gasForm && u.gasT > 0 && { frac: Math.min(1, u.gasT / 4), left: u.gasT },
  burrowed: (u) => !!(u.hidden && u.kit),
  steadyAim: (u) => !!u.aimed,
  loaded: (u) => u.nextShotMul > 1,
  momentum: (u) => u.momentum > 0 && { frac: u.momentum / 10, name: `Momentum x${u.momentum}`, desc: `${u.momentum} hits in a row: attacks ${u.momentum * 5}% faster.` },
  barkskin: (u) => !!(u.kit && u.kit.trait && u.kit.trait.taken && u.kit.hero && HEROES[u.kit.hero] && HEROES[u.kit.hero].trait.id === 'barkskin' && u.spd < 8),
  duel: (u, now) => u.kit && u.kit.duel && until(u.kit.duel.until, now, 6),
  candle: (u, now) => u.kit && until(u.kit.candleUntil, now, 6),
  cranked: (u) => u.kit && u.kit.crank > 0 && { frac: u.kit.crank / 5, name: `Cranked Up x${u.kit.crank}` },
  keen: (u, now) => u.kit && !u.buffs.some((b) => b.id === 'keenEye') && until(u.kit.keenUntil, now, 6),
  mocking: (u, now) => u.kit && until(u.kit.mockUntil, now, 3),
  focus: (u) => !!(u.kit && u.kit.focus),
  wolfForm: (u, now) => u.kit && until(u.kit.wolfUntil, now, 14),
  link: (u, now) => u.kit && u.kit.link && until(u.kit.link.until, now, 7),
};
const pc = (x) => Math.round(Math.abs(x) * 100);
const badBuff = (b) => (b.move && b.move < 1) || (b.atkSpeed && b.atkSpeed < 1) || (b.taken && b.taken > 1) || (b.dealt && b.dealt < 1) || b.blind || (b.healTaken && b.healTaken < 1);
const autoIcon = (b) => (b.lifesteal ? 'lifesteal' : b.frontBlock || b.root ? 'stance' : b.taken && b.taken < 1 ? 'ward' : b.statusImmune || b.immune ? 'immune' : b.dealt > 1 ? 'might' : b.atkSpeed > 1 || b.move > 1 ? 'haste' : 'buff');
const nameOf = (id) => id.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
// What a buff's numbers do, in words (so every tier reads right).
export function buffLine(b) {
  const out = [];
  if (b.taken != null && b.taken !== 1) out.push(b.taken < 1 ? `takes ${pc(1 - b.taken)}% less damage` : `takes ${pc(b.taken - 1)}% more damage`);
  if (b.frontBlock) out.push(`blows from the front lose ${pc(b.frontBlock)}%`);
  if (b.reflect) out.push(`and ${pc(b.reflect)}% goes back at the striker`);
  if (b.dealt != null && b.dealt !== 1) out.push(b.dealt > 1 ? `hits ${pc(b.dealt - 1)}% harder` : `hits ${pc(1 - b.dealt)}% weaker`);
  if (b.atkSpeed != null && b.atkSpeed !== 1) out.push(b.atkSpeed > 1 ? `attacks ${pc(b.atkSpeed - 1)}% faster` : `attacks ${pc(1 - b.atkSpeed)}% slower`);
  if (b.move != null && b.move !== 1) out.push(b.move > 1 ? `moves ${pc(b.move - 1)}% faster` : `moves ${pc(1 - b.move)}% slower`);
  if (b.lifesteal) out.push(`heals ${pc(b.lifesteal)}% of what it deals`);
  if (b.healTaken != null && b.healTaken < 1) out.push(`heals do ${pc(1 - b.healTaken)}% less`);
  if (b.statusImmune) out.push('no status can touch it');
  else if (b.immune) out.push(`can't be ${b.immune.map((s) => ({ burn: 'burnt', chill: 'chilled', poison: 'poisoned', wet: 'soaked', shock: 'shocked' }[s] || s)).join(' or ')}`);
  if (b.knockImmune) out.push("can't be knocked back");
  if (b.root) out.push('stands its ground');
  if (b.blind) out.push('misses most of its blows');
  if (!out.length) return '';
  const s = out.join(', '); return s[0].toUpperCase() + s.slice(1) + '.';
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
const heroUnit = (w, k) => w.units.find((x) => x.kind === k && (x.trueTeam || x.team) === 'hero' && !x.summon);
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
