// Round 16 (the balance audit): one recorder that watches one unit (the "focus", a hero) through a fight and counts
// everything its kit does, using the measuring hook in js/stats.js (AUDIT.on) and a look at the world after every step.
// Measures only: it changes no game numbers and no rules. The few things it does to the world are invisible to the
// game: it tags objects with _aud fields, and it wraps the focus's own trait and ability hooks, timed hooks and timers in
// pass-through functions that note which part of the kit is running (the same arguments, `this` and return value).
//
// Import it AFTER setting globalThis.location and globalThis.localStorage (the js/ modules read them on load).
//   const rec = new Recorder();
//   rec.attach(world, focusUnit)       at the start, and again whenever the world or the unit changes (a dungeon room)
//   ... step the sim; after each step: rec.step(fighting)   (fighting: count this step's time as fight time)
//   const data = rec.finish()          a plain object (see the README comment at the bottom of this file)
// Other lanes can reuse it as is: nothing in it is about one scenario.
import { AUDIT, CUR, sourceOf, ownerOf } from '../../../js/stats.js';
import { HEROES } from '../../../js/heroes.js';
import { ABILITIES } from '../../../js/kits.js';
import { BUILD_IDS } from '../../../js/statuses.js';
import { angleTo, angleDiff } from '../../../js/util.js';

const alive = (u) => !!u && !u.dead && !u.downed;
const sideOf = (u) => (u ? u.trueTeam || u.team : null);
const leadOf = (u) => (u && u.partOf && u.partOf.bodies ? u.partOf : u);
const add = (m, k, n = 1) => { m[k] = (m[k] || 0) + n; };
const sub = (m, k) => m[k] || (m[k] = {});
const HOOK_EVENTS = ['tick', 'dealt', 'taken', 'hit', 'kill', 'death', 'downed', 'evade', 'struck', 'fallen', 'allyDown', 'shackled'];
// The timed states a unit can be in (sim.js / statuses.js), and the build-up each one comes from when it has one, so the
// time can be traced to whoever put that build-up on (u.stBy, the credit rule stats.js uses).
export const STATES = {
  frozen: { on: (u) => u.frozenT > 0, from: 'chill' },
  stunned: { on: (u) => u.stunT > 0 && !(u.frozenT > 0) && !(u.sleepT > 0) },
  asleep: { on: (u) => u.sleepT > 0, from: 'sleepy' },
  rooted: { on: (u) => u.rootT > 0 || u.tangledT > 0, from: 'entangle' },
  knockedOut: { on: (u) => u.koT > 0, from: 'stagger' },
  sickened: { on: (u) => u.sickT > 0, from: 'poison' },
  terrified: { on: (u) => u.fearT > 0, from: 'fear' },
  radiant: { on: (u) => u.radiantT > 0, from: 'radiance' },
  shackled: { on: (u) => u.shackledT > 0, from: 'shackle' },
  addled: { on: (u) => u.addledT > 0, from: 'confuse' },
  hexed: { on: (u) => !!u.hexed || u.hexUntil > (u._audNow || 0), from: 'curse' },
  enthralled: { on: (u) => u.flipKind === 'charm', from: 'charm' },
  befuddled: { on: (u) => !!u.flipKind && u.flipKind !== 'charm' },
  overloaded: { on: (u) => u.shockT > 0.6, from: 'shock' }, // (shock's own jolt timer: 1.1 s after an overload or a jolt)
  untouchable: { on: (u) => u.invulnT > 0 },
  ethereal: { on: (u) => !!u.ethereal },
  hidden: { on: (u) => !!u.hidden },
};
const STATE_IDS = Object.keys(STATES);
// what a hero's own clock does for one of its abilities (kits2.js kit2Tick), where nothing else names it
const TICK_BUFF = { bearWard: 'rainDance', pavise: 'pavise', hotMeal: 'hotMeal' };
const TICK_AB = { chef: 'ab:hotMeal' };
const HERO_BUILDS = { whirled: (u) => (u.k2s && u.k2s.whirl) || 0, spun: (u) => (u.k2s && u.k2s.spun) || 0 };

function blankAb(id, tier, passive) {
  return { tier, passive: !!passive, casts: 0, addledCasts: 0, first: null, ready: 0, readies: 0, midEffect: 0, midWhat: {},
    busy: { free: 0, act: 0, cc: 0, forced: 0, noAbil: 0, addled: 0, down: 0 }, actTypes: {},
    thinks: 0, hi: 0, max: 0, sumRaw: 0, fired: 0, lost: 0, rolled: 0, low: 0, triggers: 0, productive: 0 };
}
const blankSrc = () => ({ dmg: 0, dmgPet: 0, heal: 0, healSelf: 0, block: 0, blockSelf: 0, kills: 0, amp: 0, bonus: 0, prevented: 0, guard: 0, selfHurt: 0 });

export class Recorder {
  constructor() {
    this.w = null; this.f = null; this.ctx = [];
    this.d = { t: 0, simT: 0, ab: {}, src: {}, st: { applied: {}, bursts: {}, dmg: {}, trace: {} },
      foeT: { unitSec: 0, st: {}, stMine: {}, state: {}, stateMine: {}, hook: {}, hookMine: {}, buff: {}, buffMine: {} },
      selfT: { buff: {}, buffMine: {}, hook: {}, st: {}, state: {} },
      taken: 0, takenBy: {}, byOthers: { heal: {}, block: {}, guard: {} }, downs: 0, saves: {}, attribution: { unknownBuffs: 0 } };
    this.seen = new WeakSet(); this.pend = new Map(); this.lastBlow = null; this.lastStatus = null;
    this.stepCasts = []; this.lastCast = new Map(); this.kindMap = {}; this.think = null; this.fighting = true;
    this.prevCd = {}; this.mix = new WeakMap(); this.castOpen = {}; this.prevBones = false; this.lastT = null;
  }
  // ------------------------------------------------------------------ set-up
  attach(w, f) {
    this.w = w; this.f = f; this.lastT = w.time;
    const k = f.kit, H = HEROES[k.hero];
    this.hero = k.hero; this.abIds = H.abilities.map((a) => a.id);
    for (const a of H.abilities) {
      const tier = k.tiers[a.id] || 0, A = ABILITIES[a.id];
      if (!this.d.ab[a.id]) this.d.ab[a.id] = blankAb(a.id, tier, A && A.passiveTier);
      this.prevCd[a.id] = k.cd[a.id];
    }
    this.prevBones = !!k.oldBonesUsed;
    // the focus's own trait and ability hooks: pass-through copies that say which part is running
    if (k.trait && !k.trait._audWrapped) k.trait = this.wrapHook({ ...k.trait }, f, 'trait:' + H.trait.id, true);
    if (k.extra) k.extra = k.extra.map((h, i) => { const ab = H.abilities.filter((a) => k.tiers[a.id] && ABILITIES[a.id] && ABILITIES[a.id].hook)[i]; return h._audWrapped ? h : this.wrapHook({ ...h }, f, 'ab:' + (ab ? ab.id : '?'), true); });
    for (const u of w.units) this.seen.add(u);
    AUDIT.on = (ev, w2, u, src, amt, o) => this.on(ev, w2 || this.w, u, src, amt, o || {});
  }
  finish() { AUDIT.on = null; this.flushThink(); return this.d; }

  // ------------------------------------------------------------------ who is doing it
  me(u) { return u === this.f; }
  foe(u) { const a = sideOf(u), b = sideOf(this.f); return !!a && a !== b && a !== 'neutral'; }
  // the part of a unit's kit at work right now: a wrapped hook or timer, an ability being used, a landing of one
  who() {
    const c = this.ctx[this.ctx.length - 1]; if (c) return c;
    const w = this.w;
    if (w) for (const u of w.units) if (u.kit && u.kit.using) return { u, s: 'ab:' + u.kit.using };
    if (CUR.ab && CUR.abU) return { u: ownerOf(CUR.abU), s: 'ab:' + CUR.ab };
    if (CUR.tk && CUR.tkU) return { u: ownerOf(CUR.tkU), s: 'tk:' + CUR.tk };
    if (w && w.actor) return { u: ownerOf(w.actor), s: 'other' };
    return null;
  }
  // stats.js sourceOf, made sharper where it can't see: a wrapped trait/hook/timer running, a summon made by an ability
  srcOf(src, root, o = {}) {
    this.viaPet = false;
    // a shot turned back by the hero (Inner Peace, a Parry, Mind Shield, Gale II): not its own weapon or ability
    // (sim.js projectiles hands hurt a copy of the shot's options, with kAngle its heading: that finds the shot)
    if (o && o.shot && src && this.w) { const p = this.w.projectiles.find((q) => q.owner === src && Math.atan2(q.vy, q.vx) === o.kAngle);
      if (p && p._audOwner0 && p.owner !== p._audOwner0 && ownerOf(p.owner) === root) return this.reflectSrc(p.owner, p); }
    let s = sourceOf(src, root, o);
    if (s === 'pet') {
      for (let p = src, i = 0; p && p !== root && i < 6; p = p.summonBy || p.ghostOf, i++) if (p._audAb) { this.viaPet = true; return p._audAb; }
      return s;
    }
    if (!(o.ab || o.pab || o.stk || o.tk)) { const c = this.ctx[this.ctx.length - 1]; if (c && c.u === root && (src === root || leadOf(src) === root)) s = c.s; }
    return s;
  }
  reflectSrc(u, p) {
    const k = u.kit, now = this.w.time;
    if (p.ab === 'mindShield') return 'ab:mindShield';
    if (k && k.peaceUntil > now) return 'ab:innerPeace';
    if (k && k.parry) return 'ab:pommelStrike';
    if (u.kind === 'airMage') return 'ab:gale';
    return 'reflected';
  }
  credit(owner, s, field, amt, victim) {
    if (!(amt > 0) || !owner) return;
    if (owner === this.f) {
      const r = this.d.src[s] || (this.d.src[s] = blankSrc()); r[field] += amt;
      if (victim === this.f && (field === 'heal' || field === 'block')) r[field + 'Self'] += amt;
      if (field === 'dmg' && this.viaPet) r.dmgPet += amt;
      this.productive(s);
    } else if (victim === this.f && this.d.byOthers[field]) add(this.d.byOthers[field], owner.kind + ' ' + s, amt);
  }
  productive(s) { if (s && s.startsWith('ab:')) { const id = s.slice(3); if (this.castOpen[id]) { this.castOpen[id] = false; const A = this.d.ab[id]; if (A) A.productive++; } } }
  // a part of a blow kept off `u` (shield, buff, ward...); summed and checked when the sim counts the block
  part(u, amt, tag, label) {
    if (!(amt > 0)) return;
    const key = leadOf(u), w = this.w; let e = this.pend.get(key);
    if (!e || e.t !== w.time) { e = { t: w.time, parts: [] }; this.pend.set(key, e); }
    e.parts.push({ amt, owner: tag ? tag.u : null, s: tag ? tag.s : label || 'other' });
  }

  // ------------------------------------------------------------------ wrappers
  wrapFn(g, k, owner, s) {
    const R = this;
    const f = function (...a) {
      R.ctx.push({ u: owner, s });
      try {
        const r = g.apply(this, a);
        if (k === 'taken') { const [, victim, , amt, o] = a; if (typeof r === 'number' && typeof amt === 'number') { if (r < amt && !(o && o.dot)) R.part(victim, amt - r, { u: owner, s }); else if (r > amt && R.foe(victim) && owner === R.f) R.credit(owner, s, 'amp', r - amt, victim); } }
        else if (k === 'dealt') { const [, attacker, victim, amt] = a; if (typeof r === 'number' && typeof amt === 'number') { if (r > amt && !R.foe(attacker)) R.credit(owner, s, 'bonus', r - amt, victim); else if (r < amt && R.foe(attacker)) R.credit(owner, s, 'prevented', amt - r, victim); } }
        else if (k === 'evade' && r === true) { const [, victim, , amt, o] = a; if (!(o && o.dot)) R.part(victim, amt, { u: owner, s }); }
        else if (k === 'downed' && r === true && owner === R.f) add(R.d.saves, s);
        return r;
      } finally { R.ctx.pop(); }
    };
    f._audWrapped = true; return f;
  }
  wrapHook(h, owner, s, copy) {
    for (const k of HOOK_EVENTS) if (typeof h[k] === 'function' && !h[k]._audWrapped) h[k] = this.wrapFn(h[k], k, owner, s);
    if (copy) h._audWrapped = true;
    h._aud = { u: owner, s };
    return h;
  }

  // ------------------------------------------------------------------ events from the sim (js/stats.js AUDIT.on)
  on(ev, w, u, src, amt, o) {
    const f = this.f;
    switch (ev) {
      case 'hurt': {
        this.pend.delete(leadOf(u));
        const root = ownerOf(src); if (!root) { if (this.me(u)) { this.d.taken += amt; add(this.d.takenBy, 'other', amt); } return; }
        const s = this.srcOf(src, root, o);
        if (this.me(u)) { this.d.taken += amt; add(this.d.takenBy, root === f ? 'self ' + s : root.kind, amt); }
        if (root !== f) return;
        if (this.foe(u)) {
          this.credit(f, s, 'dmg', amt, u);
          if (o.stk) { add(this.d.st.dmg, o.stk, amt); const m = this.mix.get(u), mt = m && m[o.stk]; if (mt) { let tot = 0; for (const v of Object.values(mt)) tot += v; if (tot > 0) for (const [k2, v] of Object.entries(mt)) add(sub(this.d.st.trace, k2), o.stk, amt * v / tot); } }
        } else { const r = this.d.src[s] || (this.d.src[s] = blankSrc()); r.selfHurt += amt; }
        return;
      }
      case 'heal': {
        const root = ownerOf(src); if (!root) return;
        let s = this.srcOf(src, root, o);
        if (s === 'attack' && src === u && !(o.pab || o.ab)) { // lifesteal: a buff's, right after a blow
          const lb = this.lastBlow, ls = src.buffs && src.buffs.find((b) => b.lifesteal);
          if (ls && lb && lb.t === w.time && lb.src === src) { if (ls._aud) { this.credit(ls._aud.u, ls._aud.s, 'heal', amt, leadOf(u)); return; } s = 'buff:' + ls.id; }
        }
        // a heal made on the hero's own clock (kits2.js kit2Tick: the Chef's plates...), not by its weapon's shots
        if (s === 'attack' && !this.ctx.length && w.actor === root && !(o.pab || o.ab)) s = TICK_AB[root.kind] || 'other';
        this.credit(root, s, 'heal', amt, leadOf(u));
        return;
      }
      case 'down': {
        if (this.me(leadOf(u))) { this.d.downs++; return; }
        const root = ownerOf(src); if (root !== f || !this.foe(u)) return;
        this.credit(f, this.srcOf(src, root, o), 'kills', 1, u);
        return;
      }
      case 'dealt': {
        this.lastBlow = { t: w.time, u, src, o };
        if (!src.buffs || !src.buffs.length) return;
        let m = 1; for (const b of src.buffs) if (b.dealt != null) m *= b.dealt;
        if (m === 1 || !(m > 0)) return;
        let a = amt / m;
        for (const b of src.buffs) if (b.dealt != null) { const d = a * (b.dealt - 1); a *= b.dealt; const g = b._aud; if (!g) { this.d.attribution.unknownBuffs++; continue; }
          if (d > 0 && !this.foe(src)) this.credit(g.u, g.s, 'bonus', d, u); else if (d < 0 && this.foe(src) && g.u === f) this.credit(g.u, g.s, 'prevented', -d, u); }
        return;
      }
      case 'takenBuffs': {
        if (!u.buffs || !u.buffs.length) return;
        let a = amt;
        for (const b of u.buffs) if (b.taken != null) { const d = a * (1 - b.taken); a *= b.taken; const g = b._aud;
          if (d > 0 && !o.dot) this.part(u, d, g, 'buff:' + b.id); else if (d < 0 && g && g.u === f && this.foe(u)) this.credit(f, g.s, 'amp', -d, u); }
        return;
      }
      case 'front': {
        let a = amt;
        for (const b of u.buffs) if (b.frontBlock && angleDiff(angleTo(u.x, u.y, src.x, src.y), u.facing) < 1.3) { const d = a * b.frontBlock; a -= d; this.part(u, d, b._aud, 'buff:' + b.id); }
        return;
      }
      case 'keep': { // untouchable: the whole blow
        if (o.dot) return;
        const g = u._audInv && u._audInv.at >= w.time - 3 ? u._audInv : this.invulnGuess(u);
        this.part(u, amt, g, 'untouchable');
        return;
      }
      case 'block': {
        const key = leadOf(u), e = this.pend.get(key); this.pend.delete(key);
        const parts = e && e.t === w.time ? e.parts : [];
        const lb = this.lastBlow, past = lb && lb.t === w.time && leadOf(lb.u) === key && lb.src === src; // the blow got past the misses
        if (!parts.length && past) { this.credit(key, key.armor > 0 ? 'stat:armour' : 'other', 'block', amt, key); return; }
        if (!parts.length) { // nothing named it and it never landed: a dodge, a blind miss or an evade nobody wrapped
          const bl = src && src.buffs && src.buffs.find((b) => b.blind);
          if (bl && bl._aud) this.credit(bl._aud.u, bl._aud.s, 'block', amt, key);
          else this.credit(key, key.def && key.def.dodge ? 'stat:dodge' : 'other', 'block', amt, key);
          return;
        }
        let sum = 0; for (const p of parts) sum += p.amt;
        const k = sum > amt ? amt / sum : 1;
        for (const p of parts) this.credit(p.owner || key, p.owner ? p.s : 'other', 'block', p.amt * k, key);
        if (amt > sum + 0.01) this.credit(key, key.armor > 0 ? 'stat:armour' : 'other', 'block', amt - sum, key);
        return;
      }
      case 'guard': {
        const g = o.by; if (!g) return;
        this.credit(ownerOf(g), g.kit && g.kit.hero === 'paladin' ? 'ab:guard' : 'other', 'guard', amt, u);
        return;
      }
      case 'status': {
        const root = ownerOf(src);
        let s = null;
        if (root) { const lb = this.lastBlow; s = this.srcOf(src, root, lb && lb.t === w.time && lb.u === u && lb.src === src ? lb.o : {}); }
        this.lastStatus = { u, type: o.type, root, s };
        if (root === f && this.foe(u)) {
          add(sub(this.d.st.applied, o.type), s, amt); this.productive(s);
          let m = this.mix.get(u); if (!m) { m = {}; this.mix.set(u, m); } add(sub(m, o.type), s, amt);
        }
        return;
      }
      case 'burst': {
        const ls = this.lastStatus;
        if (ls && ls.u === u && ls.type === o.type && ls.root === f && this.foe(u)) add(sub(this.d.st.bursts, o.type), ls.s);
        return;
      }
      case 'buff': { // b is the buff being put on (or refreshed); its tag is copied onto the one the unit wears
        const c = this.who(); o._aud = c ? { u: ownerOf(c.u) || c.u, s: c.s } : null;
        if (o._aud && o._aud.s === 'other' && o._aud.u && o._aud.u.kit) { const k = o._aud.u.kit; if (k.tiers[o.id]) o._aud.s = 'ab:' + o.id; else if (TICK_BUFF[o.id] && k.tiers[TICK_BUFF[o.id]]) o._aud.s = 'ab:' + TICK_BUFF[o.id]; }
        if (c && c.u === f) this.productive(c.s);
        return;
      }
      case 'hook': { // a timed hook (kits2.js onUnit) on any unit: tag it, and wrap it so its work counts for whoever put it on
        const c = this.who(); const g = c ? { u: ownerOf(c.u) || c.u, s: c.s } : { u: null, s: 'other' };
        this.wrapHook(o, g.u, g.s, false);
        if (g.u === f) this.productive(g.s);
        return;
      }
      case 'cast': {
        if (!this.me(u)) { this.stepCasts.push({ u, ab: o.ab }); this.lastCast.set(u, { ab: o.ab, t: w.time }); return; }
        const A = this.d.ab[o.ab]; if (!A) return;
        A.casts++; if (u.addledT > 0) A.addledCasts++;
        if (A.first == null) A.first = this.d.t;
        this.castOpen[o.ab] = true;
        this.stepCasts.push({ u, ab: o.ab }); this.lastCast.set(u, { ab: o.ab, t: w.time });
        if (this.think && this.think.t === w.time) this.think.fired = o.ab;
        return;
      }
      case 'score': {
        if (!this.me(u)) return;
        if (this.think && this.think.t !== w.time) this.flushThink();
        if (!this.think) this.think = { t: w.time, rows: [], fired: null, fighting: this.fighting, ctx: this.fighting ? this.scene(w, u) : null };
        this.think.rows.push({ ab: o.ab, raw: amt, s: o.s });
        return;
      }
    }
  }
  invulnGuess(u) {
    const c = this.stepCasts.find((x) => x.u === u);
    if (c) return { u, s: 'ab:' + c.ab, at: this.w.time };
    const lc = this.lastCast.get(u);
    if (lc && this.w.time - lc.t < 2) return { u, s: 'ab:' + lc.ab, at: this.w.time };
    return { u, s: 'untouchable', at: this.w.time };
  }
  // what the hero was looking at when it thought (to see what a score that stays low is waiting for)
  scene(w, u) {
    const t = u.target && alive(u.target) ? u.target : null;
    let foes = 0, near = 0, allyLow = 1, allies = 0;
    for (const o of w.units) {
      if (!alive(o) || o === u || o.partOf) continue;
      if (this.foe(o)) { if (o.ethereal) continue; foes++; if (Math.hypot(o.x - u.x, o.y - u.y) - o.r - u.r < 150) near++; }
      else if (sideOf(o) === sideOf(u) && !o.summon) { allies++; allyLow = Math.min(allyLow, o.hp / o.maxHp); }
    }
    return { tgt: t ? 1 : 0, gap: t ? Math.max(0, Math.hypot(t.x - u.x, t.y - u.y) - t.r - u.r) : 0, foes, near, allies, allyLow: allies ? allyLow : 1, hp: u.hp / u.maxHp, tHp: t ? t.hp / t.maxHp : 0 };
  }
  flushThink() {
    const T = this.think; this.think = null; if (!T || !T.fighting) return;
    let best = null, bs = 0; for (const r of T.rows) if (r.s > bs) { bs = r.s; best = r; }
    for (const r of T.rows) {
      const A = this.d.ab[r.ab]; if (!A) continue;
      A.thinks++; A.sumRaw += r.raw; if (r.raw > A.max) A.max = r.raw; if (r.raw >= 0.3) A.hi++;
      if (r.raw < 0.3 && T.ctx) { const L = A.lowCtx || (A.lowCtx = { n: 0, tgt: 0, gap: 0, foes: 0, near: 0, allies: 0, allyLow: 0, allyHurt: 0, hp: 0, tHp: 0 }); L.n++;
        for (const k of ['tgt', 'gap', 'foes', 'near', 'allies', 'allyLow', 'hp', 'tHp']) L[k] += T.ctx[k]; if (T.ctx.allyLow < 0.65) L.allyHurt++; }
      if (!best || bs < 0.3) { A.low++; continue; }
      if (r === best) { if (T.fired === r.ab) A.fired++; else A.rolled++; }
      else if (r.s >= 0.3) A.lost++; else A.low++;
    }
  }

  // ------------------------------------------------------------------ after every step
  step(fighting = true) {
    const w = this.w, f = this.f; if (!w || !f) return;
    const dt = w.time - this.lastT; this.lastT = w.time;
    this.flushThink();
    this.fighting = fighting;
    if (dt <= 0) { this.stepCasts.length = 0; return; }
    this.d.simT += dt;
    const k = f.kit;
    for (const p of w.projectiles) if (p._audOwner0 === undefined) p._audOwner0 = p.owner || null;
    // new units this step: summons get the ability that made them
    for (const u of w.units) {
      if (!this.seen.has(u)) { this.seen.add(u); if (u.summonBy && !u.partOf) this.tagSummon(u); }
      if (u.k2) for (const t of u.k2) this.tagTimer(u, t);
      u._audNow = w.time;
      // something made it untouchable this step: remember what (the cast it was in, most likely)
      const inv = u.invulnT || 0;
      if (inv > (u._audInvPrev || 0) - dt + 1e-6 && inv > 0) u._audInv = this.invulnGuess(u);
      u._audInvPrev = inv;
    }
    // passive tiers that trigger through their hooks: their cooldown jumps up without a cast
    for (const id of this.abIds) {
      const A = this.d.ab[id], cd = k.cd[id], prev = this.prevCd[id];
      if (A.passive && cd > (prev ?? 0) + 0.5 && cd > dt) { A.triggers++; if (A.first == null) A.first = this.d.t; }
      if (!A.passive && A.tier && prev > 0 && cd <= 0) { A.readies++; const what = this.stillOn(id); if (what) { A.midEffect++; add(A.midWhat, what); } }
      this.prevCd[id] = cd;
    }
    if (k.oldBonesUsed && !this.prevBones && this.d.ab.oldBones) { this.d.ab.oldBones.triggers++; if (this.d.ab.oldBones.first == null) this.d.ab.oldBones.first = this.d.t; add(this.d.saves, 'ab:oldBones'); }
    this.prevBones = !!k.oldBonesUsed;
    this.stepCasts.length = 0;
    if (!fighting) return;
    this.d.t += dt;
    // ready time and what kept the hero from acting on it
    const cat = !alive(f) ? 'down' : f.frozenT > 0 || f.stunT > 0 || f.sleepT > 0 ? 'cc' : f.act ? 'act' : f.radiantT > 0 || f.fearT > 0 ? 'noAbil' : f.addledT > 0 ? 'addled' : f.forcedGoal ? 'forced' : 'free';
    for (const id of this.abIds) {
      const A = this.d.ab[id]; if (!A.tier || A.passive || k.cd[id] > 0) continue;
      A.ready += dt; A.busy[cat] += dt; if (cat === 'act') add(A.actTypes, f.act.type || '?', dt);
    }
    // the focus's own time: buffs, timed hooks, statuses and states on it
    if (alive(f)) {
      for (const b of f.buffs) { add(this.d.selfT.buff, b.id, dt); if (b._aud && b._aud.u === f) add(this.d.selfT.buffMine, b.id, dt); }
      if (f.h2) for (const h of f.h2) add(this.d.selfT.hook, h.id, dt);
      for (const s of BUILD_IDS) if (f.st[s] > 0) add(this.d.selfT.st, s, dt);
      for (const [s, v] of Object.entries(HERO_BUILDS)) if (v(f) > 0) add(this.d.selfT.st, s, dt);
      for (const s of STATE_IDS) if (STATES[s].on(f)) add(this.d.selfT.state, s, dt);
      if (f.act && f.act.type) add(this.d.selfT.state, 'busy:' + f.act.type, dt);
    }
    // the other side's time
    const FT = this.d.foeT;
    for (const e of w.units) {
      if (!alive(e) || !this.foe(e) || e.partOf || (e.def && e.def.trap)) continue;
      FT.unitSec += dt;
      for (const s of BUILD_IDS) if (e.st[s] > 0) { add(FT.st, s, dt); if (e.stBy && ownerOf(e.stBy[s]) === f) add(FT.stMine, s, dt); }
      for (const [s, v] of Object.entries(HERO_BUILDS)) if (v(e) > 0) add(FT.st, s, dt);
      for (const s of STATE_IDS) if (STATES[s].on(e)) { add(FT.state, s, dt); const fr = STATES[s].from; if (fr && e.stBy && ownerOf(e.stBy[fr]) === f) add(FT.stateMine, s, dt); }
      if (e.h2) for (const h of e.h2) { add(FT.hook, h.id, dt); if (h._aud && h._aud.u === f) add(FT.hookMine, h.id, dt); }
      for (const b of e.buffs) { add(FT.buff, b.id, dt); if (b._aud && b._aud.u === f) add(FT.buffMine, b.id, dt); }
    }
  }
  // a summon: the ability its maker used this step, else the one that made this kind before, else its maker's last cast
  tagSummon(u) {
    const root = ownerOf(u); if (!root || !root.kit) return;
    const c = this.stepCasts.find((x) => x.u === root), key = root.kind + ':' + u.kind;
    let ab = c ? c.ab : this.kindMap[key];
    if (!ab) { const lc = this.lastCast.get(root); if (lc && this.w.time - lc.t < 3) ab = lc.ab; }
    if (!ab) return;
    this.kindMap[key] = ab; u._audAb = 'ab:' + ab;
    if (root === this.f) this.productive(u._audAb);
  }
  // a timer on a unit (kits2.js timer): its ticks and its end run with the ability that started it
  tagTimer(u, t) {
    if (t.tick && t.tick._audWrapped && (!t.end || t.end._audWrapped)) return;
    let g = t._aud;
    if (!g || !(t.tick && t.tick._audWrapped)) {
      const c = this.stepCasts.find((x) => x.u === u) || (this.stepCasts.length === 1 ? this.stepCasts[0] : null);
      if (c) g = { u: ownerOf(c.u) || c.u, s: 'ab:' + c.ab };
      else if (!g) { const lc = this.lastCast.get(u); g = lc && this.w.time - lc.t < 1 ? { u, s: 'ab:' + lc.ab } : null; }
    }
    if (!g) { t._aud = { u: null, s: 'other' }; if (t.tick && !t.tick._audWrapped) t.tick._audWrapped = true; if (t.end && !t.end._audWrapped) t.end._audWrapped = true; return; }
    t._aud = g;
    if (t.tick && !t.tick._audWrapped) t.tick = this.wrapFn(t.tick, 'timer', g.u, g.s);
    if (t.end && !t.end._audWrapped) t.end = this.wrapFn(t.end, 'timer', g.u, g.s);
  }
  // is anything this ability started still going? (a buff, a timed hook, a summon, a zone, a timer, a queued blow, a ray)
  stillOn(id) {
    const w = this.w, f = this.f, s = 'ab:' + id;
    for (const u of w.units) {
      if (!alive(u)) continue;
      for (const b of u.buffs) if (b._aud && b._aud.u === f && b._aud.s === s && b.t > 0.05 && (b.dur || 0) > 0.6) return 'buff ' + b.id;
      if (u.h2) for (const h of u.h2) if (h._aud && h._aud.u === f && h._aud.s === s && h.until > w.time) return 'state ' + h.id;
      if (u._audAb === s && ownerOf(u) === f) return 'summon ' + u.kind;
      if (u.k2) for (const t of u.k2) if (t._aud && t._aud.u === f && t._aud.s === s && t.t > 0.05) return 'timer ' + t.id;
    }
    for (const z of w.fx) if (z.ab === id && z.tick && (z.src === f || z.by === f) && z.t < z.max - 0.05) return 'zone ' + (z.kind || z.type || '');
    if (f.later) for (const l of f.later) if (l.ab === id && !l.done) return 'queued';
    if (f.rays) for (const r of f.rays) if (r.ab === id && r.t > 0) return 'ray';
    return null;
  }
}
// What finish() returns (one fight):
//   t: seconds of fighting counted; simT: all sim seconds; downs: times the focus went down; taken; takenBy {who: amt}
//   ab[id]: tier, passive, casts, addledCasts (fired by Addled, at random), first (s into the fight), ready (s off
//     cooldown while fighting), busy {free, act, cc, forced, noAbil, addled, down} (how that ready time was spent),
//     actTypes {act: s}, thinks (times kitThink scored it while ready), hi (of those, scored >= 0.3), max, sumRaw,
//     fired / rolled (top pick: fired, or the dice said no) / lost (>= 0.3 but another was picked) / low (below the bar),
//     triggers (passive tiers: times it went off through its hook), readies, midEffect (came off cooldown while what it
//     started was still going; midWhat says what), productive (casts followed by something measurable before the next)
//   src[source]: dmg, dmgPet (of it, by summons), heal, healSelf, block (kept off anyone on its side), blockSelf,
//     kills, amp (extra damage foes took from its debuffs, already inside others' damage), bonus (extra damage its buffs
//     added to blows, before the target's defences), prevented (damage foes didn't deal because of its debuffs),
//     guard (damage it took over from an ally), selfHurt. Sources: attack, ab:<id>, st:<type>, trait:<id>, pet, other,
//     stat:armour, stat:dodge, untouchable.
//   st: applied {type: {source: amt}}, bursts {type: {source: n}}, dmg {type: amt}, trace {source: {type: amt}} (its
//     status damage shared back to what put the status on, by build-up applied)
//   foeT: unitSec (foe-seconds alive), st/stMine {type: foe-seconds built up}, state/stateMine {state: foe-seconds},
//     hook/hookMine {id: foe-seconds}, buff/buffMine {id: foe-seconds}   (Mine: traced to the focus)
//   selfT: buff/buffMine {id: s}, hook {id: s}, st {type: s}, state {state: s}
//   byOthers: heal/block/guard {who: amt} done for the focus by others; saves {source: n} (kept from going down)
