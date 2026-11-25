// The new heroes' kits (round 10, lane H): abilities, traits and attacks for the heroes in heroes2.js, in the same
// shape as kits.js (merged into ABILITIES / TRAITS / ATTACKS there). Extra pieces an ability here can have:
//   hook    a hook object (kits.js hooks) that is on while the ability is bought (its tiers read u.kit.tiers)
//   show    how lab.html's showcase stages it: { far, ally, single, hitme, shootme, mob } (lab.js)
// Lasting things an ability starts run on the unit's own timers (u.k2, ticked from kitTick), not new sim acts.
// The looks are in fx2.js: fx of type 'k2' with a `draw` name, shots of the new kinds, and each ability's 'sig'.
import { TAU, clamp, dist, angleTo, angleDiff, rand, rrange } from './util.js';
import { hurt, spawn, alive, opponents, allies, hpRatio, puff, setAnim, explode, blocked, stun, addBuff, fx, cleanse, textU, sparks, scatterCoins, turnSide, restoreSide, meleeSwing, kill, taunt, disarm, incorporeal } from './sim.js';
import { STATUS, WHIRLED, SPUN, DIRTY, TARGETED, TRACKED, TRAPPED, WARDED, WEAKENED, ANTIHEAL, resTo } from './statuses.js';
import { LOOK2 } from './looks2.js';
import { lineClear, circleRect } from './path.js';
import { foesNear, friendsNear, hurtMost, dmgOf, ang, ring, cast, heal, addStatus, zone, shoot, segDist, hooksOf, wantedWait, beset } from './kits.js';
import { threatened, attackers } from './threat.js'; // round 16 fixes: what is about to land on a unit, who is on it
import { dash } from './dashes.js'; // round 18 (lane dash18): the six dashes
import { AUDIT } from './stats.js'; // (round 16: tools/audit)
import { hasTag, isArmed, hitType } from './tags.js'; // round 17 (lane tags17): the Engineer's wrench mends constructs

// ---------------------------------------------------------------- helpers
const k2 = (w, o) => fx(w, { type: 'k2', ...o });                 // a look of our own (fx2.js DRAW[o.draw])
const tierOf = (u, id) => (u.kit && u.kit.tiers[id]) || 0;
const after = (u, t, f) => { u.later = [...(u.later || []).filter((l) => !l.done), { t, f }]; };
// a timer on the unit: tick(dt) every step while it runs, end() once
const timer = (u, id, t, tick, end) => { const k = u.k2 || (u.k2 = []); const old = k.find((x) => x.id === id); if (old) { old.t = t; old.tick = tick; old.end = end; return old; } const n = { id, t, tick, end }; k.push(n); return n; };
const inReach = (u, t, extra = 0) => t && alive(t) && dist(u.x, u.y, t.x, t.y) - u.r - t.r <= (u.def.range || 20) + extra;
const inFront = (u, e, arc) => angleDiff(ang(u, e), u.facing) < arc / 2;
const BUILDS = ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger', 'radiance', 'curse', 'entangle', 'charm', 'confuse', 'sleepy', 'bleed', 'fear', 'shackle'];
// a melee blow drawn as a weapon arc (fxkit turns the 'swing' telegraph into the weapon's arc; aoe: a slam on the floor)
const swingMark = (w, u, R, arc, aoe, dir) => w.telegraphs.push({ type: 'swing', x: u.x, y: u.y, r: R, a: u.facing, arc, t: 0.16, max: 0.16, color: '#FFFFFF', src: u, aoe, dir }); // (round 19: dir, which way the crescent sweeps: -1 a backhand)
// break off what an enemy is winding up: its act, and any danger zone it has showing
function interrupt(w, e) {
  if (e.def.boss) return;
  if (e.act && e.act.type !== 'slip') e.act = null;
  for (const z of w.danger) if (z.src === e && z.t > 0) { z.cancelled = true; z.done = true; }
}
const foeWinding = (w, e) => !!(e.act && e.act.type !== 'slip') || w.danger.some((z) => z.src === e && z.t > 0);

// ---------------------------------------------------------------- round 13 (lane H2): shared pieces
// A timed hook on any unit, friend or foe (kits.js hooksOf reads u.h2): its own tick ends it when its time is up.
// The new heroes' own effects (Whirled, Dirty, Targeted, Tracked, Trapped, Spun, Warded) are built this way, each
// behind one function. (Round 15, lane E: lifted into statuses.js as statuses, their numbers there, HERO_STATUS; the
// functions below are still how each is put on. A hook keeps its whole time, dur, for the HUD's ring.)
function onUnit(w, e, id, dur, h = {}, end) {
  const L = e.h2 || (e.h2 = []), i = L.findIndex((x) => x.id === id), inner = h.tick;
  const hook = { ...h, id, until: w.time + dur, dur, tick(w2, u2, dt) { if (w2.time >= hook.until) { offUnit(u2, id); if (end) end(u2); return; } if (inner) inner.call(hook, w2, u2, dt); } };
  if (i >= 0) L[i] = hook; else L.push(hook);
  if (AUDIT.on) AUDIT.on('hook', w, e, null, dur, hook); // (round 16: tools/audit: who put it on)
  return hook;
}
function offUnit(e, id) { if (!e.h2) return; e.h2 = e.h2.filter((x) => x.id !== id); if (!e.h2.length) e.h2 = null; }
const hookOf = (e, id) => (e && e.h2 && e.h2.find((x) => x.id === id)) || null;
const isOn = (w, e, id) => { const h = e && e.h2 && e.h2.find((x) => x.id === id); return !!(h && h.until > w.time); };
const MOVES_ACT = new Set(['dash', 'leap', 'charge', 'chargeTell']);
const sideOfU = (o) => o.trueTeam || o.team;
// summons with a brain of their own (filled in further down: a function is hoisted, the table is read at the first summon)
const BRAINS = {};
// a summon of ours: on the maker's side (either side can field anything: battle mode), its blows `hit` x the maker's
function summon(w, u, kind, x, y, o = {}) {
  const s = spawn(w, kind, clamp(x, 30, w.W - 30), clamp(y, 30, w.H - 30), { team: u.team, scale: o.scale });
  if (BRAINS[kind] && !s.def.brain) s.def.brain = BRAINS[kind]; // (a summon that runs its own brain: set on its def the first time)
  if (LOOK2[kind] && !s.def.draw) s.def.draw = LOOK2[kind]; // (and one drawn in code: fx2.js)
  s.summon = true; s.summonBy = u; s.aggro = true; if (o.life) s.lifeT = o.life;
  s.dmgMul = o.hit != null && s.def.dmg ? dmgOf(u, o.hit) / s.def.dmg : u.dmgMul;
  if (o.hp) { s.maxHp = Math.round(o.hp); s.hp = s.maxHp; }
  return s;
}
const mine = (w, u, kind) => w.units.filter((o) => o.summonBy === u && o.kind === kind && alive(o));
// is a unit pressed against a wall, the room's edge or a pillar?
function atObstacle(w, e, pad = 3) {
  if (e.x < e.r + pad || e.y < e.r + pad || e.x > w.W - e.r - pad || e.y > w.H - e.r - pad) return true;
  for (const r of w.walls) if (circleRect(e.x, e.y, e.r + pad, r)) return true;
  for (const p of w.pillars) if (dist(e.x, e.y, p.x, p.y) < p.r + e.r + pad) return true;
  return false;
}
// a body sent flying: for `dur` s, onWall(e) the first time it slams into something hard, onBody(o) for each body it
// ploughs into on the way
function flung(w, by, e, dur, onWall, onBody) {
  const hit = new Set([e]); let last = 0;
  onUnit(w, e, 'flung' + by.id, dur, { tick(w2, u2) {
    const sp = Math.hypot(u2.kx, u2.ky);
    if (onWall && last > 150 && atObstacle(w2, u2, 4)) { offUnit(u2, 'flung' + by.id); onWall(u2); return; }
    if (onBody && sp > 160) for (const o of w2.units) if (!hit.has(o) && alive(o) && !o.ethereal && o.team !== by.team && dist(o.x, o.y, u2.x, u2.y) < o.r + u2.r + 4) { hit.add(o); onBody(o, u2); }
    last = sp;
  } });
}
// knock a unit somewhere: its shove scaled by its mass (a big one moves less)
const shove = (e, a, k) => { if (e.fixed) return; e.kx += Math.cos(a) * k / Math.max(0.6, Math.sqrt(e.mass)); e.ky += Math.sin(a) * k / Math.max(0.6, Math.sqrt(e.mass)); };

// The newer heroes' statuses (round 13, lane H2: each built behind one function; round 15, lane E: lifted into
// statuses.js, HERO_STATUS, with these numbers in its tables and the rules in docs/STATUSES.md). Each function below
// is how a hero puts its status on, as it always was.
// WHIRLED (the Griffon, the Alchemist's whirling pool, the Air Mage): a build-up 0..100 (e.k2s.whirl) that drains 12 a
// second. While it is on, every shove it takes from anyone goes (1 + fill) as far. At 100 it bursts: it is flung about at
// random three times in 0.9 s with no control meanwhile, then can't be whirled for 3 s. (statuses.js WHIRLED)
export function whirl(w, e, amt, src) {
  if (!alive(e) || e.ethereal || e.fixed || (e.whirlImmune || 0) > w.time || amt <= 0) return;
  const W = WHIRLED, r = resTo(e, 'whirled'); if (r <= 0) return; // (def.res.whirled: none has one)
  const s = e.k2s || (e.k2s = {}), was = s.whirl || 0;
  s.whirl = Math.min(W.need, was + amt * r * (e.def.boss ? W.boss : 1));
  if (!was || !isOn(w, e, 'whirled')) {
    onUnit(w, e, 'whirled', 30, {
      taken(w2, u2, s2, a, o) { if (o.knock && !o.whirlDone) { o.whirlDone = true; o.knock *= 1 + k01h((u2.k2s && u2.k2s.whirl || 0) / W.need); } return a; },
      tick(w2, u2, dt) { const q = u2.k2s; q.whirl = Math.max(0, (q.whirl || 0) - W.decay * dt); if (q.whirl <= 0) offUnit(u2, 'whirled'); },
    });
    k2(w, { draw: 'whirled', unit: e, x: e.x, y: e.y, r: e.vr, max: 30 });
  }
  if (s.whirl >= W.need) {
    s.whirl = 0; offUnit(e, 'whirled'); e.whirlImmune = w.time + W.immuneT; (e.bursts || (e.bursts = {})).whirled = w.time; // (the HUD ring flashes, the Book's meter lights)
    stun(w, e, e.def.boss ? W.bossStunT : W.stunT); if (e.act && e.act.type !== 'drink') e.act = null;
    textU(w, e.x, e.y, e.r + 12, 'WHIRLED', W.col, 1.2);
    k2(w, { draw: 'whirlBurst', unit: e, x: e.x, y: e.y, r: e.vr, max: 1.1 });
    for (let i = 0; i < W.flings; i++) after(e, W.first + i * W.every, () => { if (alive(e)) { shove(e, rand() * TAU, e.def.boss ? W.bossFling : W.fling); puff(w, e.x, e.y, '#EEF3F8', 6, 90, 6, 0.4); } });
    if (src && alive(src)) for (const h of hooksOf(src)) if (h.whirlBurst) h.whirlBurst(w, src, e); // round 15 (lane N): whoever whirled it to bursting hears of it (the Air Mage's trait, kits3.js)
  }
}
// round 15 (lane N): the shared pieces, for kits3.js (the six newer heroes are built from the same parts)
export { k2, after, timer, onUnit, offUnit, hookOf, isOn, flung, shove, interrupt, foeWinding, haste, atObstacle, swingMark, inFront, handAt, lob };
// round 15 (lane E): and the statuses' own, for the Book's previews (preview-sim.js)
export { dirty, targeted, tracked, trapped, spin, ward, weaken };
const k01h = (v) => Math.max(0, Math.min(1, v));
// DIRTY (the Digger: "Rub some dirt in it"): a coat of dirt. The next blow that would land is soaked up by it, and that
// is the end of it; until then he attacks 30% slower, and fire and poison can't take on him (both are washed off now).
// (statuses.js DIRTY)
function dirty(w, a, dur = DIRTY.dur) {
  if (!alive(a)) return;
  for (const k of DIRTY.immune) a.st[k] = 0; a.sickT = 0;
  onUnit(w, a, 'dirty', dur, { immune: DIRTY.immune, atkSpeed: () => DIRTY.atkSpeed,
    evade(w2, u2, s2, amt, o) { if (o.dot) return false; offUnit(u2, 'dirty'); puff(w2, u2.x, u2.y, '#9C7650', 12, 110, 6, 0.5); textU(w2, u2.x, u2.y, u2.r + 6, 'dirt', '#C9A47A', 0.9); return true; } });
  k2(w, { draw: 'dirtyOn', unit: a, x: a.x, y: a.y, r: a.vr, max: dur });
}
// TARGETED (the Marksman's Aimed Shot, the Pirate's Point Blank): a crosshair on it. It takes 20% more, its dashes,
// leaps and charges go 40% as far, and the Marksman's bullets go on through it. (statuses.js TARGETED)
function targeted(w, e, dur) {
  if (!alive(e)) return;
  const r = resTo(e, 'targeted'); if (r <= 0) return; dur *= r; // (def.res.targeted: none has one)
  onUnit(w, e, 'targeted', dur, {
    taken(w2, u2, s2, a, o) { return o.dot ? a : a * TARGETED.taken; },
    tick(w2, u2) { const A = u2.act; if (A && A !== this.seen && MOVES_ACT.has(A.type)) { this.seen = A; const m = TARGETED.moves;
      if (A.type === 'leap') { A.x1 = A.x0 + (A.x1 - A.x0) * m; A.y1 = A.y0 + (A.y1 - A.y0) * m; } else A.t *= m; } },
  });
  k2(w, { draw: 'crosshair', unit: e, x: e.x, y: e.y, r: e.vr, max: dur, col: TARGETED.col });
}
// TRACKED (the Falconer's falcon): it can't turn invisible, untouchable or go underground, and every blow from his side
// lands `fixed` harder. (statuses.js TRACKED)
function tracked(w, e, dur, fixed, by) {
  if (!alive(e)) return;
  const r = resTo(e, 'tracked'); if (r <= 0) return; dur *= r; // (def.res.tracked: none has one)
  onUnit(w, e, 'tracked', dur, {
    taken(w2, u2, s2, a, o) { return !o.dot && s2 && sideOfU(s2) === sideOfU(by) ? a + fixed : a; },
    tick(w2, u2) { u2.hidden = false; if (u2.ethereal && !u2.def.ethereal) u2.ethereal = false; u2.invulnT = Math.min(u2.invulnT, 0.05); },
  });
  k2(w, { draw: 'crosshair', unit: e, x: e.x, y: e.y, r: e.vr, max: dur, col: TRACKED.col, tracked: true });
}
// TRAPPED (the Trapper's jaw trap): it can't move or turn and can't use an ability; it can still strike straight ahead.
// (statuses.js TRAPPED)
function trapped(w, e, dur) {
  if (!alive(e)) return;
  const r = resTo(e, 'trapped'); if (r <= 0) return 0; // (def.res.trapped: none has one)
  const d = (e.def.boss ? dur * TRAPPED.boss : dur) * r, H = TRAPPED.hold;
  onUnit(w, e, 'trapped', d, { tick(w2, u2) {
    addBuff(u2, { id: 'held', dur: 0.1, root: true }); u2.faceLockT = 0.06; u2.abilT = Math.max(u2.abilT || 0, H);
    if (u2.kit) for (const k in u2.kit.cd) u2.kit.cd[k] = Math.max(u2.kit.cd[k], H);
    if (u2.act && u2.act.type !== 'windup' && u2.act.type !== 'drink') u2.act = null;
  } });
  return d;
}
// SPUN (the Monk's Palm Strike, his Fists' third blow): a build-up 0..100 (e.k2s.spun, drains 10 a second): its turning
// is slippery (round 19), more so as it builds: slow to start a turn, slow to stop, so it swings past where it meant to
// face. At 100 it bursts: DAZED, stunned with stars round its head (round 19; it used to march off the way it faced).
// (statuses.js SPUN)
function spin(w, e, amt) {
  if (!alive(e) || e.fixed || (e.spunImmune || 0) > w.time) return;
  const P = SPUN, r = resTo(e, 'spun'); if (r <= 0) return; // (def.res.spun: none has one)
  const s = e.k2s || (e.k2s = {}), was = s.spun || 0;
  s.spun = Math.min(P.need, was + amt * r * (e.def.boss ? P.boss : 1));
  if (!was || !isOn(w, e, 'spun')) {
    onUnit(w, e, 'spun', 30, { moveSpeed: () => P.move,
      // (round 19: "Has a hard time controlling turn, overshoots. Like has low acceleration but high max turn speed.
      // Slippery but for turning": u.slipF, read by sim.js updateFacing, in place of round 13's locked turns)
      tick(w2, u2, dt) { const q = u2.k2s; q.spun = Math.max(0, (q.spun || 0) - P.decay * dt); u2.slipF = Math.min(1, P.slip + (1 - P.slip) * q.spun / P.need); if (q.spun <= 0) offUnit(u2, 'spun'); } }, (u2) => { u2.slipF = 0; });
    k2(w, { draw: 'spunOn', unit: e, x: e.x, y: e.y, r: e.vr, max: 30 });
  }
  if (s.spun >= P.need) {
    s.spun = 0; offUnit(e, 'spun'); e.spunImmune = w.time + P.immuneT; (e.bursts || (e.bursts = {})).spun = w.time; // (the HUD ring flashes, the Book's meter lights)
    // (round 19: "Burst effect is dazed": stars round its head, it can't act; it used to march off the way it faced)
    const T = e.def.boss ? P.bossT : P.dazeT; e.slipF = 0; stun(w, e, T); if (e.act && e.act.type !== 'drink') e.act = null;
    textU(w, e.x, e.y, e.r + 12, 'DAZED', P.col, 1.2);
    k2(w, { draw: 'dazed', unit: e, x: e.x, y: e.y, r: e.vr, max: (e.def.boss ? T * 0.4 : T) + 0.15 });
  }
}
// WARDED (the Alchemist's Elixir: the designer asked for a protection status's name): a shield soaking up the next
// `amt` damage, shown as a pale blue border round the body (render.js: a buff's border is protection). (statuses.js
// WARDED; round 15: a strip that takes its border takes the shield too, kits3.js Nullify)
function ward(w, a, amt, dur) {
  if (!alive(a)) return;
  let left = amt;
  addBuff(a, { id: 'warded', dur, border: WARDED.col });
  onUnit(w, a, 'warded', dur, { taken(w2, u2, s2, x, o) { const t = Math.min(left, x); left -= t; if (left <= 0) { offUnit(u2, 'warded'); u2.buffs = u2.buffs.filter((b) => b.id !== 'warded'); sparks(w2, u2.x, u2.y, 0, 6, '#BFEFFF', 1); } return x - t; } },
    (u2) => { u2.buffs = u2.buffs.filter((b) => b.id !== 'warded'); });
}
// HASTE and RAGE: buffs on the body (render.js washes rage; fx2 'haste' lines stream off a hasted one)
function haste(w, a, dur, k = 1.3) { addBuff(a, { id: 'haste', dur, move: k, atkSpeed: k }); k2(w, { draw: 'haste', unit: a, x: a.x, y: a.y, r: a.vr, max: dur }); }
function rage(w, a, dur, k = 1.3) { addBuff(a, { id: 'rage', dur, dealt: k, atkSpeed: 1 + (k - 1) * 0.8 }); }
// WEAKENED (the Shade's Blackout): deals 30% less; a grey wash and grey chevrons sinking off the body
function weaken(w, e, dur) { const r = resTo(e, 'weakened'); if (r <= 0) return; dur *= r; /* (def.res.weakened: none has one) */ const had = e.buffs.some((b) => b.id === 'weakened'); addBuff(e, { id: 'weakened', dur, dealt: WEAKENED.dealt, wash: WEAKENED.wash }); if (!had) k2(w, { draw: 'weakOn', unit: e, x: e.x, y: e.y, r: e.vr, max: dur, buff: 'weakened' }); } // (statuses.js WEAKENED)
// bleeding, sleepy, confused: the statuses lane's (statuses.js); added through kits.js addStatus (its web nodes)
const bleed = (w, e, amt, u) => addStatus(w, e, 'bleed', amt, u);
const sleepy = (w, e, amt, u) => addStatus(w, e, 'sleepy', amt, u);
const confuse = (w, e, amt, u) => addStatus(w, e, 'confuse', amt, u);
// a unit's hand, held out towards an angle (shots start there)
const handAt = (u, a, d = 6) => ({ x: u.x + Math.cos(a) * (u.r + d), y: u.y + Math.sin(a) * (u.r + d) });
// the friend most in trouble (low health, enemies on it), within reach
function inTrouble(w, u, reach, pct = 0.45) {
  const list = allies(w, u).filter((a) => !a.summon && !a.def.cargo && hpRatio(a) < pct && dist(u.x, u.y, a.x, a.y) < reach);
  return list.sort((p, q) => hpRatio(p) - hpRatio(q))[0] || null;
}
// Round 16 fixes (when abilities fire): a friend in trouble that is being hit now (kits.js beset: foes on it, or a blow
// about to land): the most hurt of those within reach, between near and far from u, under `pct` (or under `pct2` with
// two or more on it). The rescues (Challenge, Swoop, Spear of the Sky) go for this one and their use() goes to the same.
function besetFriend(w, u, { near = 0, far = 440, pct = 0.6, pct2 = 0.85 } = {}) {
  const list = allies(w, u).filter((a) => { if (a.summon || a.def.cargo) return false; const d = dist(u.x, u.y, a.x, a.y); if (d < near || d > far) return false;
    const n = beset(w, a), h = hpRatio(a); return n && (h < pct || (n >= 2 && h < pct2)); });
  return list.sort((p, q) => hpRatio(p) - hpRatio(q))[0] || null;
}
// Challenge: the friend nearest death being hit, or (as before) one under 40% with a foe near
const challengeFor = (w, u) => besetFriend(w, u, { far: 420, pct: 0.55, pct2: 0.75 }) || (() => { const a = inTrouble(w, u, 420, 0.4); return a && foesNear(w, u, a.x, a.y, 160).length ? a : null; })();
// Spear of the Sky: a friend in trouble, or one held or loaded with statuses
const spearFor = (w, u) => besetFriend(w, u, { near: 90, far: 420, pct: 0.8, pct2: 0.9 }) || inTrouble(w, u, 420, 0.6)
  || allies(w, u).filter((a) => !a.summon && !a.def.cargo && burdened(a) && dist(u.x, u.y, a.x, a.y) > 90 && dist(u.x, u.y, a.x, a.y) < 420)[0] || null;
// what holds or hurts a friend (the Valkyrie's spear cleanses it)
const burdened = (o) => o.stunT > 0 || o.rootT > 0 || o.frozenT > 0 || o.sleepT > 0 || o.shackledT > 0 || ((o.st.poison || 0) + (o.st.burn || 0) + (o.st.chill || 0) + (o.st.bleed || 0) + (o.st.curse || 0)) > 60;
// a fighter coming at u: moving towards it, within `range` of it, not yet in its reach
const closing = (u, e, range) => { if (e.def.role === 'ranged' || e.target !== u) return false; const d = dist(u.x, u.y, e.x, e.y), gap = d - u.r - e.r;
  if (gap > range || gap < 6) return false; const vx = e.vx || 0, vy = e.vy || 0; return ((u.x - e.x) * vx + (u.y - e.y) * vy) / Math.max(1, d) > 20; };

// ---------------------------------------------------------------- abilities
export const ABILITIES2 = {
  // ----- Old Guard
  greatSweep: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, u.r + u.def.range + 40).filter((e) => inFront(u, e, 3.2)).length; return n >= 2 ? 0.85 : n ? 0.35 : 0; },
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t);
      cast(u, 'ability', 0.8);
      const R = u.r + u.def.range + 46, arc = 3.4;
      const sweep = (back) => {
        swingMark(w, u, R + 10, arc);
        for (const e of foesNear(w, u, u.x, u.y, R)) if (inFront(u, e, arc + 0.3)) hurt(w, e, dmgOf(u, 1.65), u, { knock: 280, kAngle: ang(u, e) + (back ? -0.5 : 0.5), heavy: true, stagger: tier >= 2 ? 45 : 0 });
        w.shake = Math.max(w.shake, 4);
      };
      k2(w, { draw: 'gather', unit: u, x: u.x, y: u.y, r: 30, max: 0.3, col: '#EEF3F8' });
      after(u, 0.3, () => sweep(false));
      if (tier >= 3) after(u, 0.62, () => { setAnim(u, 'ability', 0.5); sweep(true); });
    },
  },
  rallyCry: {
    score(w, u) {
      const pinned = [u, ...allies(w, u)].filter((a) => !a.summon && (a.stunT > 0.2 || a.rootT > 0.2 || a.koT > 0 || (a.st.stagger || 0) > 40 || a.tangledT > 0));
      if (pinned.length) return 0.95;
      return foesNear(w, u, u.x, u.y, 260).length >= 3 && friendsNear(w, u, u.x, u.y, 230).length ? 0.5 : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'ability', 0.5);
      // round 13, the designer: "Get a haste boost when leveled up. Effect remains for a little bit." II: haste, and it
      // all lasts 8 s
      const dur = tier >= 2 ? 8 : 5;
      for (const a of [u, ...friendsNear(w, u, u.x, u.y, 240)]) {
        a.stunT = 0; a.rootT = 0; a.koT = 0; a.tangledT = 0; a.st.stagger = 0;
        addBuff(a, { id: 'rally', dur, knockImmune: true, glow: '#F2C14E' });
        if (tier >= 2) haste(w, a, dur, 1.3);
        if (tier >= 3) heal(w, a, a.maxHp * 0.08, u);
        k2(w, { draw: 'rally', unit: a, x: a.x, y: a.y, r: a.vr, max: 0.9 });
      }
    },
  },
  // Parry (round 13, the designer: "Should have a parry ability. The next attack is blocked and deflected back if it was
  // a projectile, melee just go back to target. When leveled up gets 2 charges. Maybe instead of pommel strike"). It
  // takes Pommel Strike's place (the id stays for saves). He sets the greatsword across him; the next blow or shot that
  // reaches him within 4 s is caught: a shot flies back at whoever loosed it, a blow's damage goes back into the striker.
  pommelStrike: {
    score(w, u) {
      if (u.kit.parry && u.kit.parry.until > w.time) return 0;
      const shots = w.projectiles.some((p) => p.team !== u.team && !p.noHit && p.team !== 'neutral' && dist(p.x, p.y, u.x, u.y) < 260);
      const close = opponents(w, u).filter((e) => e.target === u && dist(u.x, u.y, e.x, e.y) - u.r - e.r < (e.def.range || 20) + 40).length;
      return shots ? 0.8 : close ? 0.45 + 0.15 * close + (opponents(w, u).some((e) => e.target === u && foeWinding(w, e)) ? 0.3 : 0) : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'ability', 0.35);
      u.kit.parry = { until: w.time + 4, n: tier >= 2 ? 2 : 1, k: tier >= 3 ? 1.3 : 1 };
      k2(w, { draw: 'parryGuard', unit: u, x: u.x, y: u.y, r: u.r, max: 4, ab: 'pommelStrike' });
    },
    hook: {
      evade(w, u, src, amt, o) {
        const P = u.kit.parry; if (!P || P.until < w.time || P.n <= 0 || o.dot || o.shot || !src || src === u) return false;
        P.n--; if (P.n <= 0) P.until = w.time + 0.25;
        u.facing = angleTo(u.x, u.y, src.x, src.y); setAnim(u, 'swing', 0.25);
        k2(w, { draw: 'parry', x: u.x + Math.cos(u.facing) * (u.r + 8), y: u.y + Math.sin(u.facing) * (u.r + 8), a: u.facing, max: 0.4, ab: 'pommelStrike' });
        if (alive(src)) hurt(w, src, Math.max(amt, dmgOf(u, 0.8)) * P.k, u, { noDodge: true, knock: 200, kAngle: angleTo(u.x, u.y, src.x, src.y), proc: true, ab: 'pommelStrike' });
        textU(w, u.x, u.y, u.r + 8, 'PARRY', '#EEF3F8', 0.9);
        return true;
      },
    },
    show: { hitme: true, shootme: true },
  },
  // ----- Dame
  riposte: {
    score: (w, u) => (opponents(w, u).some((e) => e.target === u && dist(u.x, u.y, e.x, e.y) < u.r + e.r + 70) ? 0.8 : 0),
    use(w, u, t, tier) {
      const dur = tier >= 3 ? 2.6 : 1.6; u.kit.riposteUntil = w.time + dur;
      addBuff(u, { id: 'riposte', dur, raise: true, move: 0.5 });
      k2(w, { draw: 'shieldUp', unit: u, x: u.x, y: u.y, r: u.r, max: dur });
    },
    hook: {
      taken(w, u, src, amt, o) {
        if (o.dot || !src || !(u.kit.riposteUntil > w.time)) return amt;
        const tier = tierOf(u, 'riposte');
        if (tier < 3 && angleDiff(angleTo(u.x, u.y, src.x, src.y), u.facing) > 1.3) return amt;
        if (tier >= 3) u.facing = angleTo(u.x, u.y, src.x, src.y);
        const near = dist(u.x, u.y, src.x, src.y) - u.r - src.r < (u.def.range || 24) + 40;
        if (near && alive(src) && w.time - (u.kit.ripT || -9) > 0.15) {
          u.kit.ripT = w.time; setAnim(u, 'thrust', 0.22);
          hurt(w, src, dmgOf(u, 1), u, { knock: 160, noDodge: true, stagger: tier >= 2 ? 40 : 0, ab: 'riposte' });
          k2(w, { draw: 'parry', x: u.x + Math.cos(u.facing) * (u.r + 6), y: u.y + Math.sin(u.facing) * (u.r + 6), a: u.facing, max: 0.35, ab: 'riposte' });
        }
        u.blockedAt = w.time;
        return amt * 0.2;
      },
    },
    show: { hitme: true },
  },
  // Challenge (round 13, the designer: "Maybe it is a dash to nearest ally about to die, pushes them away and heals them
  // slightly, the nearest enemy is taunted. No challenge status."): she dashes to the friend nearest death, shoves them
  // clear of the fight, patches them up a little and plants herself in the enemy's way, calling the nearest one onto her
  challenge: {
    // (round 16 fixes: a friend under 55% that is being hit now (or under 75% with two on it), or under 40% with a foe
    // near as before; it waited for under 40%, and its friends seldom got there while it was ready)
    score: (w, u) => (challengeFor(w, u) ? 0.95 : 0),
    use(w, u, t, tier) {
      const a = challengeFor(w, u) || inTrouble(w, u, 440, 0.55) || hurtMost(allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 440)); if (!a) return;
      const f = foesNear(w, u, a.x, a.y, 220).sort((p, q) => dist(a.x, a.y, p.x, p.y) - dist(a.x, a.y, q.x, q.y))[0];
      const fa = f ? angleTo(a.x, a.y, f.x, f.y) : angleTo(a.x, a.y, u.x, u.y);
      const x1 = clamp(a.x + Math.cos(fa) * (a.r + u.r + 2), u.r, w.W - u.r), y1 = clamp(a.y + Math.sin(fa) * (a.r + u.r + 2), u.r, w.H - u.r);
      const T = clamp(dist(u.x, u.y, x1, y1) / 700, 0.12, 0.45);
      u.facing = angleTo(u.x, u.y, x1, y1); setAnim(u, 'ability', T + 0.3); u.invulnT = Math.max(u.invulnT, T + 0.1);
      k2(w, { draw: 'streak', unit: u, x: u.x, y: u.y, a: u.facing, max: T + 0.25, col: '#C8453D' });
      u.act = { type: 'leap', t: T, max: T, x0: u.x, y0: u.y, x1, y1, land: () => {
        if (alive(a)) { shove(a, fa + Math.PI, 520); heal(w, a, a.maxHp * (tier >= 2 ? 0.2 : 0.1), u); k2(w, { draw: 'shoveAway', x: a.x, y: a.y, a: fa + Math.PI, max: 0.5, ab: 'challenge' }); }
        const list = tier >= 3 ? foesNear(w, u, u.x, u.y, 200) : f && alive(f) ? [f] : [];
        for (const e of list) taunt(w, e, u, 4); // (round 19, lane sys19: the agreed red V over the head, sim.js taunt; it was a "!" of its own)
        if (f && alive(f)) u.facing = ang(u, f);
        puff(w, u.x, u.y, '#E9DDC2', 8, 90, 5, 0.4);
      } };
    },
    show: { ally: true, mob: 'ally' },
  },
  disarm: {
    // (round 19, lane rogue19: the designer's Disarm rule is a shared status now, sim.js disarm: what holds a weapon is
    // DISARMED by the flick; what holds none (a wolf, a slime) still has its blows cut, as before: its claws, not a weapon)
    score: (w, u, t) => (inReach(u, t, 40) && !(t.disarmT > 0) && !t.buffs.some((b) => b.id === 'disarmed') ? 0.45 + (t.def.boss || t.elite ? 0.3 : 0) + (isArmed(t) ? 0.1 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'swing', 0.35);
      const list = tier >= 3 ? foesNear(w, u, u.x, u.y, u.r + u.def.range + 60).filter((e) => inFront(u, e, 1.9)) : [t];
      for (const e of list) {
        hurt(w, e, dmgOf(u, 0.5), u, { knock: 60, noDodge: true });
        if (isArmed(e)) disarm(w, e, tier >= 2 ? 4 : 3, u);
        else addBuff(e, { id: 'disarmed', dur: 5, dealt: 0.5, atkSpeed: tier >= 2 ? 0.7 : 1 });
        k2(w, { draw: 'disarm', x: e.x, y: e.y, a: ang(u, e), unit: e, r: e.vr, max: 0.8 });
      }
      swingMark(w, u, u.r + u.def.range + 20, 1.6);
    },
    show: { single: true },
  },
  // ----- Griffon
  // Swoop (round 13, the designer: "Should spin after they land making a wind swirl. Applies a new status whirled ... and
  // knocks them back ... Applies a small aoe burst around area before the dash"): a gust bursts round him as he takes
  // off; he lands by the friend in trouble with a spin that throws a wind swirl out, whirling and shoving them back
  swoop: {
    // (round 16 fixes: a friend 130-480 away being hit now, under 75% (or under 90% with two on it); it was under 60%
    // with a foe merely near, and he flew to the most hurt friend of all, beset or not)
    score: (w, u) => (besetFriend(w, u, { near: 130, far: 480, pct: 0.75, pct2: 0.9 }) ? 0.95 : 0),
    use(w, u, t, tier) {
      const a = besetFriend(w, u, { near: 130, far: 520, pct: 0.75, pct2: 0.9 }) || hurtMost(allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 520)) || t; if (!a) return;
      const f = foesNear(w, u, a.x, a.y, 140).sort((p, q) => dist(a.x, a.y, p.x, p.y) - dist(a.x, a.y, q.x, q.y))[0];
      const ba = f ? angleTo(a.x, a.y, f.x, f.y) : angleTo(a.x, a.y, u.x, u.y), off = a.r + u.r + 4;
      const x1 = clamp(a.x + Math.cos(ba) * off, u.r, w.W - u.r), y1 = clamp(a.y + Math.sin(ba) * off, u.r, w.H - u.r);
      cast(u, 'ability', 0.8); u.facing = angleTo(u.x, u.y, x1, y1);
      // the gust as he beats up off the floor
      for (const e of foesNear(w, u, u.x, u.y, 80)) { hurt(w, e, dmgOf(u, 0.5), u, { knock: 260, kAngle: ang(u, e), noDodge: true }); whirl(w, e, 25, u); }
      k2(w, { draw: 'gust', x: u.x, y: u.y, r: 80, max: 0.5 });
      k2(w, { draw: 'wings', unit: u, x: u.x, y: u.y, r: u.r, max: 0.62, flap: true });
      u.flyT = 0.6; // round 17 (lane tags17): flying while he swoops (tags.js layerOf)
      u.act = { type: 'leap', t: 0.6, max: 0.6, x0: u.x, y0: u.y, x1, y1, land: () => {
        w.shake = Math.max(w.shake, 6);
        setAnim(u, 'spin', 0.45); u.spin = { t0: w.time, dur: 0.45, dir: 1 };
        k2(w, { draw: 'windSwirl', x: u.x, y: u.y, r: 125, max: 0.7, ab: 'swoop' });
        for (const e of foesNear(w, u, u.x, u.y, 125)) { hurt(w, e, dmgOf(u, 1.3), u, { knock: 340, kAngle: ang(u, e), heavy: true, noDodge: true, stagger: tier >= 2 ? 45 : 0 }); whirl(w, e, 45, u); }
        if (tier >= 3 && alive(a) && a !== t) addBuff(a, { id: 'swoopGuard', dur: 3, taken: 0.6, glow: '#FFE7A0' });
        if (f && alive(f)) u.facing = ang(u, f);
      } };
      u.invulnT = Math.max(u.invulnT, 0.5);
    },
    show: { far: true, ally: true, mob: 'ally' },
  },
  // Stormhammer (round 13: "Should apply whirled. And have a small aoe burst on all targets hit (when upgraded). Lvl 3 will
  // have it home between targets on the way out and back. ... white puffy clouds when hit. Hammer also needs a yellow
  // line on it. And maybe doesnt show in their hand when thrown."): the hammer leaves his hand (kit2Tick hides it)
  hammerThrow: {
    score(w, u, t) {
      if (!t || u.kit.hammerOut || dist(u.x, u.y, t.x, t.y) > 330 || blocked(w, u.x, u.y, t.x, t.y)) return 0;
      const a = ang(u, t); return 0.35 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.3 && dist(u.x, u.y, e.x, e.y) < 340).length;
    },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.45);
      const a = t ? ang(u, t) : u.facing, r = 12, hitOut = new Set();
      const onHit = (w2, p, e) => {
        whirl(w2, e, 35, u);
        if (tier >= 2) { k2(w2, { draw: 'clap', x: e.x, y: e.y, r: 55, max: 0.4, ab: 'hammerThrow' }); for (const o of foesNear(w2, u, e.x, e.y, 55)) if (o !== e) hurt(w2, o, dmgOf(u, 0.5), u, { knock: 160, kAngle: angleTo(e.x, e.y, o.x, o.y), noDodge: true, shock: 12, ab: 'hammerThrow' }); }
        // III: on to the nearest one it hasn't struck yet this way
        if (tier >= 3) { const seen = p.back ? p.hitSet : hitOut; seen.add(e); const n = opponents(w2, u).filter((o) => !seen.has(o) && dist(o.x, o.y, e.x, e.y) < 200 && (p.back ? dist(o.x, o.y, u.x, u.y) < dist(e.x, e.y, u.x, u.y) + 40 : true)).sort((p1, q) => dist(e.x, e.y, p1.x, p1.y) - dist(e.x, e.y, q.x, q.y))[0];
          if (n) { p.home = n; p.turn = 12; p.life = Math.max(p.life, 0.4); } else if (p.back) { p.home = u; } }
      };
      after(u, 0.14, () => {
        shoot(w, u, a, { kind: 'hammer', speed: 560, r, life: 0.6, pierce: 9, dmg: dmgOf(u, 1.1), knock: 160, extra: { big: tier >= 3, onHit }, land: (p) => {
          // it comes back to his hand, hitting again on the way
          const b = angleTo(p.x, p.y, u.x, u.y);
          w.projectiles.push({ kind: 'hammer', x: p.x, y: p.y, vx: Math.cos(b) * 600, vy: Math.sin(b) * 600, r, team: u.team, owner: u, dmg: dmgOf(u, 0.9), o: { knock: 130, ab: 'hammerThrow' },
            life: 1.8, a: b, pierce: 9, hitSet: new Set(), home: u, turn: 14, catchBy: u, big: tier >= 3, ab: 'hammerThrow', tier, back: true, onHit });
        } });
      });
    },
    show: { far: true },
  },
  // Wing Guard (round 13, the designer: "Don't like. Anyone that hits him will take heavy knockback (even more when
  // whirled ofc) when upgraded they will take damage if they hit an obstacle. Lvl 3 will have them burst when they hit an
  // obstacle"; showcase 4: the wings "Should look similar to the ones on his sprite. But bigger and maybe more segments")
  wingShield: {
    score(w, u) {
      const melee = opponents(w, u).filter((e) => e.target === u && e.def.role !== 'ranged' && dist(u.x, u.y, e.x, e.y) - u.r - e.r < 70).length;
      return melee >= 2 ? 0.8 : melee ? 0.45 : 0;
    },
    use(w, u, t, tier) {
      u.kit.wingUntil = w.time + 4; setAnim(u, 'ability', 0.4);
      addBuff(u, { id: 'wingShield', dur: 4, taken: 0.75, raise: true });
      k2(w, { draw: 'wings', unit: u, x: u.x, y: u.y, r: u.r, max: 4, big: true });
    },
    hook: {
      struck(w, u, src, amt, o) {
        if (!(u.kit.wingUntil > w.time) || !src || src === u || !alive(src) || o.shot || o.proc || (src.wingHitT || 0) > w.time) return;
        if (dist(u.x, u.y, src.x, src.y) - u.r - src.r > 80) return;
        src.wingHitT = w.time + 0.5; const tier = tierOf(u, 'wingShield'), a = angleTo(u.x, u.y, src.x, src.y);
        hurt(w, src, dmgOf(u, 0.4), u, { knock: 620, kAngle: a, heavy: true, noDodge: true, proc: true, ab: 'wingShield' });
        k2(w, { draw: 'gust', x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, r: 50, a, max: 0.4 });
        if (tier >= 2) flung(w, u, src, 0.9, (e) => {
          hurt(w, e, dmgOf(u, 1.2), u, { noDodge: true, heavy: true, knock: 0, proc: true, ab: 'wingShield' }); w.shake = Math.max(w.shake, 4);
          if (tier >= 3) { k2(w, { draw: 'clap', x: e.x, y: e.y, r: 75, max: 0.45, ab: 'wingShield' }); for (const o of foesNear(w, u, e.x, e.y, 75)) hurt(w, o, dmgOf(u, 0.9), u, { knock: 220, kAngle: angleTo(e.x, e.y, o.x, o.y), noDodge: true, proc: true, ab: 'wingShield' }); }
          else puff(w, e.x, e.y, '#E9DDC2', 8, 90, 5, 0.4);
        });
      },
    },
    show: { hitme: true },
  },
  // ----- Bulwark
  brace: {
    // (round 16 fixes: a set spear is for what comes at him: a charge or a leap at him, or a fighter coming in (moving
    // towards him, not yet in reach), or one in reach in front fighting him; it went for any foe near or looking at
    // him, shooters too, and rooted him for nothing)
    score(w, u) {
      const th = threatened(w, u, 0.8); if (th && th.kind === 'charge') return 0.9;
      const reach = u.def.range + 26, foes = opponents(w, u);
      if (foes.some((e) => closing(u, e, reach + 150))) return 0.75;
      return foes.some((e) => e.target === u && e.def.role !== 'ranged' && dist(u.x, u.y, e.x, e.y) - u.r - e.r < reach && angleDiff(ang(u, e), u.facing) < 0.75) ? 0.6 : 0;
    },
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t);
      addBuff(u, { id: 'brace', dur: 3, root: true, frontBlock: 0.3 });
      const hit = new Set(); setAnim(u, 'thrust', 0.2);
      k2(w, { draw: 'brace', unit: u, x: u.x, y: u.y, r: u.r, max: 3 });
      timer(u, 'brace', 3, () => {
        const reach = u.r + u.def.range + 26;
        for (const e of foesNear(w, u, u.x, u.y, reach)) {
          if (hit.has(e) || !inFront(u, e, 1.5)) continue;
          hit.add(e); setAnim(u, 'thrust', 0.3);
          hurt(w, e, dmgOf(u, 1.9), u, { knock: 340, heavy: true, stagger: 40, noDodge: true, ab: 'brace' });
          e.spd = 0; e.vx = e.vy = 0;
          if (tierOf(u, 'brace') >= 3) e.rootT = Math.max(e.rootT || 0, 1);
          k2(w, { draw: 'bonk', x: e.x, y: e.y, unit: e, r: e.vr, max: 0.4, ab: 'brace' });
          if (tierOf(u, 'brace') < 2) { u.buffs = u.buffs.filter((b) => b.id !== 'brace'); return true; }
        }
      });
    },
  },
  shieldWall: {
    // (round 16 fixes: when the ones it covers (friends within 150, and him) are being hit: two or more foes on friends
    // there, or two on him, or a telegraphed hit or a charge about to land on one of them; it went with three foes
    // anywhere near and a friend near, and rooted him for 5-7 s whether anyone was being hit or not)
    score(w, u) {
      const mates = friendsNear(w, u, u.x, u.y, 150).filter((a) => a !== u && !a.summon);
      const onMates = mates.reduce((n, a) => n + attackers(w, a).filter((e) => e.def.role !== 'ranged').length, 0), onMe = attackers(w, u).length;
      const big = [u, ...mates].some((a) => { const th = threatened(w, a, 0.8); return th && (th.kind === 'zone' || th.kind === 'charge'); });
      return (mates.length && (onMates >= 2 || (onMates >= 1 && onMe >= 1) || big)) || onMe >= 2 ? 0.75 : 0;
    },
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t);
      const dur = tier >= 2 ? 7 : 5;
      addBuff(u, { id: 'shieldWall', dur, root: true, knockImmune: true, frontBlock: 0.4, raise: true });
      puff(w, u.x + Math.cos(u.facing) * u.r, u.y + Math.sin(u.facing) * u.r, '#E9DDC2', 10, 120, 5, 0.45);
      k2(w, { draw: 'shieldWall', unit: u, x: u.x, y: u.y, r: 150, max: dur });
      timer(u, 'shieldWall', dur, () => {
        for (const a of friendsNear(w, u, u.x, u.y, 150)) addBuff(a, { id: 'shieldWallCover', dur: 0.3, taken: 0.7 });
        if (tierOf(u, 'shieldWall') >= 3) for (const e of foesNear(w, u, u.x, u.y, u.r + 26)) if (inFront(u, e, 1.6)) { const a = ang(u, e); e.kx += Math.cos(a) * 40; e.ky += Math.sin(a) * 40; }
      });
    },
  },
  impale: {
    score: (w, u, t) => (inReach(u, t, 40) && !(t.rootT > 0) ? 0.5 + (t.def.boss || t.elite ? 0.25 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'thrust', 0.4);
      const dur = tier >= 3 ? 2.5 : 1.5;
      hurt(w, t, dmgOf(u, 1.6), u, { knock: 30, noDodge: true, stagger: tier >= 3 ? 50 : 0 });
      t.rootT = Math.max(t.rootT || 0, dur); t.vx = t.vy = 0; t.kx = t.ky = 0;
      if (tier >= 2) addBuff(t, { id: 'impaled', dur, taken: 1.25 });
      k2(w, { draw: 'pin', unit: t, x: t.x, y: t.y, r: t.vr, a: u.facing, max: dur });
    },
    show: { single: true },
  },
  // ----- Bearskin
  // Maul (round 13: "Uses berserkers effect. Even shows the mace ball in the middle."): its own look, the club brought
  // straight down into a crater (fx2 SLAM2.maul), never the Berserker's flail
  maul: {
    score: (w, u, t) => (inReach(u, t, 20) ? 0.55 + (foeWinding(w, t) ? 0.3 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'ability', 0.6);
      after(u, 0.22, () => {
        if (!alive(t)) return;
        swingMark(w, u, u.r + u.def.range + 14, 0.8, { x: t.x, y: t.y, r: tier >= 3 ? 90 : 46, look: 'maul' });
        hurt(w, t, dmgOf(u, 2.2), u, { heavy: true, knock: 110, noDodge: true });
        stun(w, t, tier >= 2 ? 1.6 : 1); w.shake = Math.max(w.shake, 6);
        k2(w, { draw: 'bonk', x: t.x, y: t.y, unit: t, r: t.vr, max: tier >= 2 ? 1.6 : 1 });
        if (tier >= 3) for (const e of foesNear(w, u, t.x, t.y, 90)) if (e !== t) hurt(w, e, dmgOf(u, 0.8), u, { stagger: 50, knock: 140, kAngle: angleTo(t.x, t.y, e.x, e.y), noDodge: true, slam: true });
      });
    },
    show: { single: true },
  },
  // Hibernate (round 13: "Should give self sleeping status effect. Will heal when sleeping at any time, also needs to
  // take more damage than they are healing to wake up. Leveled up will be immune to status effects"): he falls asleep.
  // Asleep, from this or anything else (a lullaby, Sleepy), he heals 7% a second; his own sleep holds until the blows
  // he takes outweigh the healing (or he is whole again)
  hibernate: {
    score: (w, u) => (hpRatio(u) < 0.45 && !u.act && !(u.sleepT > 0) ? 0.95 : 0),
    use(w, u, t, tier) {
      u.sleepT = Math.max(u.sleepT, 8); u.deepT = 8; u.act = null;
      u.kit.hib = { took: 0, healed: 0, t0: w.time, until: w.time + 8 };
      setAnim(u, 'ability', 0.4);
      k2(w, { draw: 'hibernate', unit: u, x: u.x, y: u.y, r: u.vr, max: 8 });
    },
    hook: {
      tick(w, u, dt) {
        const H = u.kit.hib, tier = tierOf(u, 'hibernate');
        if (u.sleepT > 0) {
          const got = heal(w, u, u.maxHp * 0.07 * dt, u); if (H) H.healed += got || 0;
          if (tier >= 2) addBuff(u, { id: 'hibernate', dur: 0.2, statusImmune: true });
        }
        if (!H) return;
        const whole = u.hp >= u.maxHp - 0.5 && w.time - H.t0 > 1.5;
        if (H.took > H.healed + 0.5 || whole || w.time > H.until || !(u.sleepT > 0)) {
          u.kit.hib = null; u.sleepT = 0; u.deepT = 0;
          for (const f of w.fx) if (f.draw === 'hibernate' && f.unit === u) f.max = Math.min(f.max, f.t + 0.3);
          if (tier >= 3 && alive(u)) { setAnim(u, 'ability', 0.4); ring(w, u, u.x, u.y, 130, dmgOf(u, 0.8), { knock: 300, heavy: true }, '#A0683A'); w.fx[w.fx.length - 1].ab = 'hibernate'; k2(w, { draw: 'roar', unit: u, x: u.x, y: u.y, r: 130, max: 0.6, ab: 'hibernate' }); }
          return;
        }
        u.sleepT = Math.max(u.sleepT, 0.2); u.deepT = Math.max(u.deepT || 0, 0.2);
      },
      taken(w, u, src, amt, o) { if (u.kit.hib) u.kit.hib.took += amt; return amt; },
    },
    show: { hurt: 0.35, hitme: true },
  },
  // Bear Claws, in Bear Roar's slot (round 13: "I want a rapid claw attack. Dashes forwards Does a burst of like 6 swings
  // (club goes away). At max level get 6 more, and does a bite at the end that applies bleed"); the id stays for saves
  bearRoar: {
    score: (w, u, t) => { if (!t) return 0; const g = dist(u.x, u.y, t.x, t.y) - u.r - t.r; return g < 160 ? 0.6 + (t.elite || t.def.boss ? 0.2 : 0) : 0; },
    use(w, u, t, tier) {
      // round 18 (lane dash18): the pounce (dashes.js): the club put away, a crouch, a leap that hangs, and he lands on it
      // with the first rake of the claws; the rest of the flurry follows as it did (the same swipes, the same blows; III
      // the bite at the end). (It was a straight dash to its front, then the swipes.)
      if (!t) return; const n = tier >= 3 ? 12 : 6, k1 = dmgOf(u, 0.42), k3 = dmgOf(u, 1); u.facing = ang(u, t);
      u.kit.clawsT = w.time + 0.9 + n * 0.085 + (tier >= 3 ? 0.4 : 0.1);
      const swipe = (i) => { if (!alive(t)) return; u.facing = ang(u, t); setAnim(u, 'punch', 0.09);
        const list = tier >= 2 ? foesNear(w, u, u.x, u.y, u.r + u.def.range + 30).filter((e) => inFront(u, e, 1.6)) : inReach(u, t, 30) ? [t] : [];
        for (const e of list) hurt(w, e, k1, u, { knock: 30, noDodge: true, ab: 'bearRoar' });
        if (list.length) k2(w, { draw: 'clawRake', x: t.x, y: t.y, a: u.facing, side: i % 2 ? 1 : -1, max: 0.28, ab: 'bearRoar' }); };
      dash(w, u, 'pounce', { t, only: tier >= 2 ? null : t, tell: 0.14, air: 0.3, h: 20, recover: 0.02, rest: 0, dmg: k1, hit: { knock: 30, ab: 'bearRoar' }, col: ['#FFF8F0', '#FFFFFF'],
        land: () => { u.kit.clawsT = w.time + 0.2 + n * 0.085 + (tier >= 3 ? 0.4 : 0.1);
          for (let i = 1; i < n; i++) after(u, 0.1 + i * 0.085, () => swipe(i));
          if (tier >= 3) after(u, 0.1 + n * 0.085 + 0.1, () => {
            if (!alive(t) || !inReach(u, t, 30)) return; setAnim(u, 'thrust', 0.25);
            hurt(w, t, k3, u, { knock: 160, heavy: true, noDodge: true, ab: 'bearRoar' }); bleed(w, t, 70, u);
            k2(w, { draw: 'bite', x: t.x, y: t.y, a: ang(u, t), r: t.vr, max: 0.45, ab: 'bearRoar' });
          }); } });
    },
    show: { single: true },
  },
  // ----- Warhelm
  // Thunder Blow (round 13, the designer: "Actually change that, does a headbutt forwards dealing heavy knockback and
  // stagger"): a lunge and a helmeted headbutt into the one in front
  thunderBlow: {
    score: (w, u, t) => (inReach(u, t, 34) ? 0.55 + (foeWinding(w, t) ? 0.3 : 0) + (t.elite || t.def.boss ? 0.1 : 0) : 0),
    use(w, u, t, tier) {
      // round 18 (lane dash18): a short drag and fling (dashes.js): he drops his head, drives it into the one in front,
      // carries it a step on the helmet and throws it off: the same heavy blow, far throw and stagger (II shock; III
      // whoever it lands on is hurt and stunned). (He jolted forward and the blow landed a moment later if it was near.)
      if (!t) return; const a = ang(u, t); u.facing = a; setAnim(u, 'ability', 0.4);
      const gap = Math.max(0, dist(u.x, u.y, t.x, t.y) - u.r - t.r);
      dash(w, u, 'dragFling', { a, len: gap + 40, speed: 600, tell: 0.12, dmg: dmgOf(u, 1.7), grabK: 0, fling: dmgOf(u, 1.7), knock: 560, aside: 0, hit: { ab: 'thunderBlow' }, flingHit: { stagger: 60, shock: tier >= 2 ? 35 : 0 }, recover: 0.18,
        flung: (e) => { k2(w, { draw: 'headbutt', x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, a, max: 0.45, ab: 'thunderBlow' }); w.shake = Math.max(w.shake, 7);
          if (tier >= 3 && alive(e)) flung(w, u, e, 0.8, null, (o) => { hurt(w, o, dmgOf(u, 0.8), u, { knock: 300, kAngle: a, noDodge: true, stagger: 40, ab: 'thunderBlow' }); stun(w, o, 0.6); }); } });
    },
    show: { single: true },
  },
  // Storm Born, in War Horn's slot (round 13: "Change. Storm born. Hammer float around him rotating dashing to a target
  // in an interval around him. While he punches with his fist alternating applying shock and knockback"): the hammer
  // leaves his hand and circles him, darting at an enemy near now and then; he fights with his fists meanwhile
  warHorn: {
    score: (w, u) => (!u.kit.storm && foesNear(w, u, u.x, u.y, 200).length >= 2 ? 0.7 : !u.kit.storm && foesNear(w, u, u.x, u.y, 120).length ? 0.4 : 0),
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 9 : 6, human = u.def; cast(u, 'ability', 0.5);
      // (round 15, lane E: style.dual, his two fists take turns, now that art round 12's hammer is its own part and his
      // left fist stays when it goes: "punches with his fist alternating"; the pose only, parts.js)
      u.def = { ...human, attackAnim: 'punch', weapon: 'thrust', aoe: 0, atkCd: 0.55, range: 24, style: { ...(human.style || {}), hand: 'arm-r', slam: null, dual: true } };
      const S = u.kit.storm = { a: 0, dart: null, next: w.time + 0.6, x: u.x, y: u.y, until: w.time + dur, human };
      k2(w, { draw: 'stormHammer', unit: u, x: u.x, y: u.y, max: dur + 0.2, S, ab: 'warHorn' });
      timer(u, 'stormBorn', dur, (dt) => {
        S.a += dt * 4.2;
        const hx = u.x + Math.cos(S.a) * 52, hy = u.y + Math.sin(S.a) * 52;
        if (S.dart) { // out to its target and back
          const D = S.dart; D.t += dt; const q = D.t / 0.42, k = q < 0.5 ? q * 2 : 2 - q * 2, tx = alive(D.e) ? D.e.x : D.x, ty = alive(D.e) ? D.e.y : D.y;
          S.x = hx + (tx - hx) * k; S.y = hy + (ty - hy) * k;
          if (!D.hit && q >= 0.5) { D.hit = true; if (alive(D.e)) { hurt(w, D.e, dmgOf(u, 1), u, { knock: 240, kAngle: angleTo(u.x, u.y, D.e.x, D.e.y), noDodge: true, shock: 25, ab: 'warHorn' });
            if (tierOf(u, 'warHorn') >= 3) { k2(w, { draw: 'clap', x: D.e.x, y: D.e.y, r: 60, max: 0.4, ab: 'warHorn' }); for (const o of foesNear(w, u, D.e.x, D.e.y, 60)) if (o !== D.e) hurt(w, o, dmgOf(u, 0.5), u, { knock: 160, kAngle: angleTo(D.e.x, D.e.y, o.x, o.y), noDodge: true, shock: 15, ab: 'warHorn' }); } } }
          if (q >= 1) S.dart = null;
        } else {
          S.x = hx; S.y = hy;
          if (w.time >= S.next) { const e = foesNear(w, u, u.x, u.y, 220).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0]; S.next = w.time + 0.9; if (e) S.dart = { e, x: e.x, y: e.y, t: 0, hit: false }; }
        }
      }, () => { u.def = S.human; u.kit.storm = null; });
    },
    show: { attacks: true, secs: 4 },
    hook: { dealt(w, u, t, amt, o) { if (u.kit.storm && !o.dot && !o.proc && !o.ab && !o.pab && !u.kit.using) { o.shock = (o.shock || 0) + 15; o.knock = Math.max(o.knock || 0, 260); } return amt; } },
  },
  // Skull Splitter (round 13: "Should throw hammer forward then leap towards it doing a slam. Hammer shocks anything hit.")
  skullSplitter: {
    score: (w, u, t) => { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return d < 300 && !u.kit.storm && !blocked(w, u.x, u.y, t.x, t.y) ? 0.45 + 0.15 * foesNear(w, u, t.x, t.y, 90).length : 0; },
    use(w, u, t, tier) {
      if (!t) return; const a = ang(u, t), L = clamp(dist(u.x, u.y, t.x, t.y) + 30, 120, 300); u.facing = a; cast(u, 'throw', 0.4);
      u.kit.splitT = w.time + 1.4;
      after(u, 0.12, () => shoot(w, u, a, { kind: 'warhammer', speed: 760, r: 14, life: L / 760, pierce: 9, dmg: dmgOf(u, 0.9), knock: 120, st: { shock: 30 }, land: (p) => {
        const x1 = clamp(p.x, u.r, w.W - u.r), y1 = clamp(p.y, u.r, w.H - u.r);
        k2(w, { draw: 'hammerDown', x: x1, y: y1, a, max: 0.55, unit: u }); // (round 19: unit, drawn as the hammer he holds)
        u.act = { type: 'leap', t: 0.45, max: 0.45, x0: u.x, y0: u.y, x1, y1, land: () => {
          const R = tier >= 3 ? 105 : 80; w.shake = Math.max(w.shake, 8); u.kit.splitT = 0;
          swingMark(w, u, u.r + 20, 0.6, { x: u.x, y: u.y, r: R, look: 'hammer' });
          for (const e of foesNear(w, u, u.x, u.y, R)) { hurt(w, e, dmgOf(u, 1.9), u, { knock: 300, kAngle: ang(u, e), heavy: true, noDodge: true, stagger: tier >= 2 ? 55 : 0, shock: 20, slam: true }); if (tier >= 3) stun(w, e, 0.8); }
        } };
        u.invulnT = Math.max(u.invulnT, 0.45);
      } }));
    },
    show: { far: true },
  },
  // ----- Bandit (round 13: "REDO... Don't like trait. Overall don't like hero": a new design, the lane's own; ids kept
  // for saves). Round 19 (lane rogue19, the designer's notes on 0.19): a thief who takes things off enemies: their weapon
  // (Dirty Trick, his trait Light Fingers: Disarmed, the shared status, sim.js disarm), their footing (Bolas: Trapped,
  // the Trapper's status, a hunter's trap), and one of them whole (Hostage, in Stick 'Em Up's slot).
  // Bolas (smokeBomb's slot; round 19: "Should not make unique effect. Should trap like a hunters trap. Stops movement and
  // turning. Effect should look like a ring with 3 triangles pointing inwards spread out. No disarm"): a whirling bolas of
  // three weights at the enemy furthest off (a shooter first); it wraps its legs: TRAPPED (kits2 trapped(): it can't move,
  // turn or use an ability, only strike straight ahead), the cord a ring round its feet with the three weights pointing in.
  smokeBomb: {
    score(w, u) { const e = foesNear(w, u, u.x, u.y, 320).filter((o) => !blocked(w, u.x, u.y, o.x, o.y) && dist(u.x, u.y, o.x, o.y) > 90 && !isOn(w, o, 'trapped')); return e.length ? 0.45 + (e.some((o) => o.def.role === 'ranged') ? 0.25 : 0) : 0; },
    use(w, u, t, tier) {
      const list = foesNear(w, u, u.x, u.y, 330).filter((o) => !blocked(w, u.x, u.y, o.x, o.y) && dist(u.x, u.y, o.x, o.y) > 60 && !isOn(w, o, 'trapped'))
        .sort((p, q) => (q.def.role === 'ranged' ? 1 : 0) - (p.def.role === 'ranged' ? 1 : 0) || dist(u.x, u.y, q.x, q.y) - dist(u.x, u.y, p.x, p.y)).slice(0, tier >= 2 ? 2 : 1);
      if (!list.length && t) list.push(t); cast(u, 'throw', 0.4);
      list.forEach((e, i) => after(u, 0.1 + i * 0.18, () => { if (!alive(e)) return;
        shoot(w, u, ang(u, e), { kind: 'bolas', speed: 560, r: 10, life: 1, dmg: dmgOf(u, 0.6), knock: 0, extra: { home: e, turn: 6, onHit: (w2, p, x) => {
          if (isOn(w2, x, 'trapped')) return; // (a trap never takes what another trap holds, as the Trapper's)
          const d = trapped(w2, x, tier >= 3 ? 2.5 : 1.6); if (!d) return; interrupt(w2, x); x.vx = x.vy = x.kx = x.ky = 0;
          k2(w2, { draw: 'bolasTrap', unit: x, x: x.x, y: x.y, r: x.vr, a: p.a, max: d + 0.2, ab: 'smokeBomb' });
        } } }); }));
    },
    show: { far: true },
  },
  // Dirty Trick (pickpocket's slot; round 19: "Disarms? Alternating slash visual. Btw that's not a 'kick'. Maybe punch with
  // other hand. Slightly slower attack speed."): three cuts, forehand, backhand, forehand, each its own crescent the way the
  // cutlass goes; then his free fist into it: it is flung into its friends and DISARMED (its weapon spins out of its hand)
  pickpocket: {
    score: (w, u, t) => (inReach(u, t, 16) ? 0.5 + 0.15 * foesNear(w, u, t.x, t.y, 120).length + (isArmed(t) && !(t.disarmT > 0) ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; const GAP = 0.17; // (was 0.11: "slightly slower")
      for (let i = 0; i < 3; i++) after(u, i * GAP, () => { if (!alive(t)) return; u.facing = ang(u, t); setAnim(u, 'swing', GAP + 0.02); u.anim.back = i % 2 === 1;
        swingMark(w, u, u.r + u.def.range + 8, 1.5, null, i % 2 ? -1 : 1); hurt(w, t, dmgOf(u, 0.7), u, { knock: 20, noDodge: true, ab: 'pickpocket' }); if (tier >= 2) bleed(w, t, 18, u); });
      after(u, 3 * GAP + 0.12, () => { if (!alive(t)) return; const a = ang(u, t); u.facing = a; setAnim(u, 'punch', 0.28); u.anim.hand = 'arm-l'; u.kx += Math.cos(a) * 80; u.ky += Math.sin(a) * 80;
        hurt(w, t, dmgOf(u, 1.2), u, { knock: 640, kAngle: a, heavy: true, noDodge: true, stagger: tier >= 3 ? 45 : 0, ab: 'pickpocket' });
        disarm(w, t, tier >= 2 ? 3 : 2.5, u);
        k2(w, { draw: 'banditPunch', unit: t, x: t.x - Math.cos(a) * t.r * 0.8, y: t.y - Math.sin(a) * t.r * 0.8, a, r: t.vr, max: 0.3, ab: 'pickpocket' });
        flung(w, u, t, 0.8, null, (o, e) => { hurt(w, o, dmgOf(u, 0.9), u, { knock: 380, kAngle: a, noDodge: true, stagger: tier >= 3 ? 45 : 0, ab: 'pickpocket' }); puff(w, o.x, o.y, '#E9DDC2', 6, 80, 5, 0.35); });
      });
    },
    show: { single: false },
  },
  // Hostage, in Stick 'Em Up's slot (round 19: Stick 'Em Up "Don't like"; the lane's own rework, id kept): he grabs the
  // nearest enemy that isn't too big, spins it round in front of him with the cutlass at its throat and walks it about:
  // it can't act, and every blow and shot that comes at him from in front lands on it instead. He holds it with his free
  // hand and fights on with the cutlass.
  // II: held longer. III: when he lets go he shoves it into its friends, disarmed.
  lowBlow: {
    score(w, u) { const e = hostageFor(w, u); if (!e) return 0; const shots = w.projectiles.filter((p) => p.team !== u.team && !p.noHit && dist(p.x, p.y, u.x, u.y) < 260).length;
      const on = opponents(w, u).filter((o) => o !== e && (o.target === u || o.def.role === 'ranged') && dist(o.x, o.y, u.x, u.y) < 320).length;
      return on >= 1 || shots ? 0.5 + 0.15 * Math.min(3, on + shots) : 0.25; },
    use(w, u, t, tier) {
      const e = hostageFor(w, u); if (!e) return;
      const d = tier >= 2 ? 4.5 : 3; u.facing = ang(u, e); setAnim(u, 'punch', 0.25); u.anim.hand = 'arm-l'; interrupt(w, e);
      const k = u.kit; k.hostage = e;
      textU(w, e.x, e.y, e.r + 10, 'HOSTAGE', '#FFD45A', 0.9);
      k2(w, { draw: 'hostage', unit: e, by: u, x: e.x, y: e.y, r: e.vr, max: d + 0.1, ab: 'lowBlow' });
      onUnit(w, e, 'hostage', d, { tick(w2, e2) {
        if (!alive(u) || u.stunT > 0 || u.frozenT > 0 || u.sleepT > 0 || u.koT > 0) { offUnit(e2, 'hostage'); return; } // (he is stopped: it slips free)
        const a = u.facing, R = u.r + e2.r - 4; e2.x = clamp(u.x + Math.cos(a) * R, e2.r, w2.W - e2.r); e2.y = clamp(u.y + Math.sin(a) * R, e2.r, w2.H - e2.r);
        e2.facing = a; e2.mvA = a; e2.vx = e2.vy = e2.kx = e2.ky = e2.dvx = e2.dvy = 0; e2.spd = 0; e2.passUntil = w2.time + 0.05; u.passUntil = Math.max(u.passUntil || 0, 0);
        e2.atkT = Math.max(e2.atkT, 0.2); e2.abilT = Math.max(e2.abilT || 0, 0.3); if (e2.kit) for (const c in e2.kit.cd) e2.kit.cd[c] = Math.max(e2.kit.cd[c], 0.3);
        if (e2.act && e2.act.type !== 'drink') e2.act = null; addBuff(e2, { id: 'held', dur: 0.1, root: true });
      } }, (e2) => { if (k.hostage === e2) k.hostage = null; letGo(w, u, e2, tierOf(u, 'lowBlow')); });
      onUnit(w, u, 'holding', d, {
        // what comes at his front lands on the one he holds (a shot by its heading, a blow by where its striker stands)
        evade(w2, u2, src, amt, o) {
          const h = k.hostage; if (!h || !alive(h) || o.dot || o.hostaged) return false;
          const from = o.shot && o.kAngle != null ? o.kAngle + Math.PI : src ? angleTo(u2.x, u2.y, src.x, src.y) : null;
          if (from == null || angleDiff(from, u2.facing) > 1.25 || src === h) return false;
          hurt(w2, h, amt, src, { ...o, hostaged: true, noDodge: true }); return true;
        },
        moveSpeed: () => 0.8,
      }, () => { if (k.hostage) offUnit(k.hostage, 'hostage'); });
    },
    show: { single: true, shootme: true },
  },
  // ----- Shade
  // Shadow Walk (round 19, the designer: "The path is not joined... Changing it again. Keep this ability saved though. For
  // 4 seconds she will disappear completely. Blinking in and out of existence around a random enemy hitting them then
  // vanishing. Upgrades boost duration."): she is gone (not drawn, nobody's target, untouchable) for 4s (II 5s, III 6s);
  // every SWALK.every s she blinks into being beside a random enemy near where she last was, stabs it with both daggers
  // and is gone again; at the end she stays out beside the last. The round 18 blink chain is kept below as
  // shadowWalkChain (on no kit).
  shadowWalk: {
    score(w, u, t) { if (!t) return 0; const n = foesNear(w, u, u.x, u.y, 300).length; return n >= 2 ? 0.7 : n ? 0.45 : 0; },
    use(w, u, t, tier) {
      const D = SWALK.dur[Math.min(3, tier) - 1], k = u.kit, S = k.swalk = { until: w.time + D, next: w.time + SWALK.first, last: t && alive(t) ? t : null, out: false, n: 0 };
      cast(u, 'ability', 0.2); vanish(w, u, S);
      timer(u, 'shadowWalk', D + 0.4, () => {
        if (k.swalk !== S) return true;
        if (S.out && w.time >= S.outUntil) { if (w.time >= S.until) return true; vanish(w, u, S); }
        if (!S.out && w.time >= S.next) { if (w.time >= S.until) return true; if (!blinkIn(w, u, S)) S.next = w.time + 0.15; }
        if (!S.out) { u.vx = u.vy = u.kx = u.ky = 0; u.spd = 0; u.atkT = Math.max(u.atkT, 0.1); }
        for (const c in k.cd) if (c !== 'shadowWalk') k.cd[c] = Math.max(k.cd[c], 0.2); // (nothing else of hers while she walks)
        return false;
      }, () => { if (k.swalk !== S) return; k.swalk = null; appear(w, u, S, true); });
    },
    show: { far: true },
  },
  // Blackout (round 13: III she is a shadow while it lasts; round 19: "It follows them. No physical attack can hit her but
  // soul can. In this form she has no collision."): the dark goes with her, centred on her the whole time; while it lasts
  // she is INCORPOREAL (sim.js incorporeal: sharp and blunt blows pass through, magic lands; she walks through bodies);
  // those in the dark are Weakened and she hits them 30% harder, as before. III: 6s, and she is unseen as well.
  blackout: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 130).length >= 2 || (hpRatio(u) < 0.5 && foesNear(w, u, u.x, u.y, 110).length >= 1) ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.4);
      const r = tier >= 2 ? 170 : 130, dur = tier >= 3 ? 6 : 4;
      const f = k2(w, { draw: 'dark', unit: u, x: u.x, y: u.y, r, max: dur, follow: true });
      incorporeal(w, u, dur, 'shadow'); addBuff(u, { id: 'blackoutForm', dur, wash: SHADE_FORM.wash });
      timer(u, 'blackout', dur, () => { f.x = u.x; f.y = u.y; for (const e of foesNear(w, u, u.x, u.y, r)) { weaken(w, e, 0.35); addBuff(e, { id: 'blackout', dur: 0.3 }); } });
      if (tier >= 3) shadowForm(w, u, dur);
    },
    hook: { dealt(w, u, t, amt) { return t.buffs && t.buffs.some((b) => b.id === 'blackout') ? amt * 1.3 : amt; } },
  },
  // Shadow Clones, in Death Mark's slot (round 13; round 19: "Don't like. They should move identical to how she would. Also
  // be in the same shadow form as she is in blackout."): her shadow splits off into copies of her with her own way of
  // moving and fighting (the plain fighters' brain she has, her double stab), in her Blackout form: dark, incorporeal
  // (physical blows pass through them, magic breaks them), through bodies. Weak and short-lived.
  deathMark: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 300).length >= 1 && !mine(w, u, 'shadowClone').length ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.4); const n = tier >= 2 ? 3 : 2, life = tier >= 3 ? 10 : 6;
      for (let i = 0; i < n; i++) { const a = u.facing + Math.PI + (i - (n - 1) / 2) * 1.1, x = u.x + Math.cos(a) * 36, y = u.y + Math.sin(a) * 36;
        k2(w, { draw: 'shadowBlink', x, y, r: 26, max: 0.5 });
        const c = summon(w, u, 'shadowClone', x, y, { life, hit: 0.55 }); c.facing = c.mvA = u.facing; c.target = t; c.aggro = true;
        incorporeal(w, c, life + 1, 'shadow'); }
    },
    show: { far: false },
  },
  // The round 18 Shadow Walk (lane dash18: the blink chain, dashes.js), kept as the designer asked ("Keep this ability saved
  // though"): on no hero's kit. Its notes as they were:
  // Shadow Walk (round 13: "Shadow should be a union. Not overlapping circles. Should not return. Level 3 should have them
  // do 3 dashes in a row."): one run through them as a shadow (her trail one merged body of smoke, fx2); III three runs,
  // each at the next enemy
  shadowWalkChain: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return d < 260 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.7 : foesNear(w, u, u.x, u.y, 70).length >= 2 ? 0.6 : 0; },
    use(w, u, t, tier) {
      // round 18 (lane dash18): the blink chain (dashes.js). She sinks, and is a shadow blinking from foe to foe: each
      // blink crosses its mark at a slant with the daggers out, a copy of her left standing at every stop; three marks a
      // run. The cut (II cursing) lands where the blades cross a body. III: three runs in a row, each from where the
      // last ended. (It was one straight run at one speed, cutting whoever stood within reach of the line.)
      // The cut is CUT x her own blow (it was 1.5x): the old run caught two on a good line and often one, the chain finds
      // its three, so each cut is lighter to keep what Shadow Walk deals where it was (a little less light at III, where
      // the old three runs each started on a fresh line).
      const CUT = tier >= 3 ? 1.0 : 0.9;
      const runs = tier >= 3 ? 3 : 1, dmg = dmgOf(u, CUT), curse = tier >= 2 ? 30 : 0; let chaining = true, idle = 0;
      const marks = (x, y) => opponents(w, u).filter((e) => dist(x, y, e.x, e.y) < 280).sort((p, q) => dist(x, y, p.x, p.y) - dist(x, y, q.x, q.y));
      const back = () => { chaining = false; u.ethereal = !!(u.kit && u.kit.shadow); };
      const go = (i) => {
        const list = i === 0 && t && alive(t) ? [t, ...marks(t.x, t.y).filter((e) => e !== t)] : marks(u.x, u.y);
        if (!list.length) { back(); return; }
        u.ethereal = true; k2(w, { draw: 'shadowTrail', unit: u, x: u.x, y: u.y, max: 1.5, pts: [] });
        dash(w, u, 'blinkChain', { targets: list, n: 3, reach: 280, tell: i ? 0.07 : 0.14, recover: i + 1 < runs ? 0.06 : 0.18, dmg, hit: { knock: 90, curse, ab: 'shadowWalk' }, ghost: '#3E3158', col: ['#9B86C9', '#F4EEFF'], alpha: 1, wash: ['#1E1630', 0.82], // (a shadow: dark, not the pale of a ghost)
          onEnd: () => { if (i + 1 < runs && alive(u)) go(i + 1); else back(); } });
      };
      go(0);
      // (should anything stop her mid-run, she is solid again a moment after)
      timer(u, 'shadowWalk', 6, (dt) => { if (u.act && u.act.dv) { idle = 0; return false; } idle += dt; return !chaining || idle > 0.15; }, back);
    },
    show: { far: true },
  },
  // ----- Haymaker
  // Toss (round 13: "Should toss enemy backwards. Needs better animation"): forked up and thrown high over his shoulder,
  // turning head over heels, landing hard behind him
  toss: {
    score: (w, u, t) => (inReach(u, t, 24) && !t.def.boss ? 0.55 : 0),
    use(w, u, t, tier) {
      const list = foesNear(w, u, u.x, u.y, u.r + u.def.range + 30).filter((e) => !isOn(w, e, 'tossed')).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y)).slice(0, tier >= 3 ? 2 : 1);
      if (!list.length) return; u.facing = ang(u, list[0]); cast(u, 'ability', 0.6);
      list.forEach((e, i) => {
        if (e.def.boss || e.def.brain || e.eliteFn || e.mass > 3.5 || e.fixed) { hurt(w, e, dmgOf(u, 1.8), u, { knock: 200, stagger: 40, noDodge: true }); return; }
        const back = u.facing + Math.PI + (i ? 0.6 : -0.3), x0 = e.x, y0 = e.y, x1 = clamp(u.x + Math.cos(back) * 150, e.r, w.W - e.r), y1 = clamp(u.y + Math.sin(back) * 150, e.r, w.H - e.r), T = 0.7;
        e.stunT = Math.max(e.stunT, T); e.target = null; e.act = null; interrupt(w, e);
        e.spin = { t0: w.time, dur: T, dir: i ? -1 : 1 }; const t0 = w.time;
        k2(w, { draw: 'hayPuff', x: e.x, y: e.y, max: 0.5 });
        onUnit(w, e, 'tossed', T, { tick(w2, u2) { const k = clamp((w2.time - t0) / T, 0, 1); u2.x = x0 + (x1 - x0) * k; u2.y = y0 + (y1 - y0) * k; u2.hop = Math.sin(Math.PI * k) * 95; u2.vx = u2.vy = u2.kx = u2.ky = 0; } }, (u2) => {
          u2.hop = 0; u2.x = x1; u2.y = y1; puff(w, u2.x, u2.y, '#E9DDC2', 12, 120, 6, 0.5); w.shake = Math.max(w.shake, 4);
          k2(w, { draw: 'hayPuff', x: u2.x, y: u2.y, max: 0.6, land: true });
          hurt(w, u2, dmgOf(u, tierOf(u, 'toss') >= 2 ? 2.3 : 1.6), u, { noDodge: true, knock: 60, heavy: true, stagger: tierOf(u, 'toss') >= 2 ? 50 : 0, ab: 'toss' });
        });
      });
    },
    show: { single: true },
  },
  pitchHay: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 160).filter((e) => inFront(u, e, 1.5)).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'throw', 0.4);
      const arc = tier >= 3 ? 2 : 1.4;
      k2(w, { draw: 'spray', x: u.x, y: u.y, a: u.facing, arc, r: 170, max: 0.6, cols: ['#E8C860', '#F2DC8A', '#C9A040'] });
      for (const e of foesNear(w, u, u.x, u.y, 175)) {
        if (!inFront(u, e, arc + 0.2)) continue;
        addBuff(e, { id: 'hay', dur: 4, move: 0.6 });
        if (tier >= 2) { const H = u.kit.hayed || (u.kit.hayed = []); H.push({ e, until: w.time + 6, last: e.st.burn || 0 }); }
        if (tier >= 3) addStatus(w, e, 'stagger', 40, u);
        k2(w, { draw: 'hayOn', unit: e, x: e.x, y: e.y, r: e.vr, max: tier >= 2 ? 6 : 4 });
      }
    },
  },
  // Hay Bale, in Fork Charge's slot (round 13: "Summons a large hay bail underneath them, walks on it dealing high
  // knockback and damage to those he walks over. Slow turn radius, but flips instantly when he hits a wall. It has its
  // own go that decays overtime, burns easily. When it dies it burst into hay"): he rides a rolling bale (its own unit:
  // health that runs down, catches fire easily) that steers slowly at the enemies and turns straight round off walls
  forkCharge: {
    score(w, u, t) { if (!t || mine(w, u, 'haybale').length) return 0; const d = dist(u.x, u.y, t.x, t.y); return d < 340 && foesNear(w, u, u.x, u.y, 360).length >= 2 ? 0.6 : d < 300 ? 0.35 : 0; },
    use(w, u, t, tier) {
      cast(u, 'ability', 0.4); const a = t ? ang(u, t) : u.facing;
      const b = summon(w, u, 'haybale', u.x, u.y, { life: tier >= 2 ? 7 : 5, hit: 0 });
      b.rider = u; b.head = a; b.facing = a; b.hitAt = new Map(); b.tier = tier; b.decay = b.maxHp / (tier >= 2 ? 7 : 5);
      u.kit.bale = b; u.act = { type: 'ride', t: 99, max: 99 }; u.hop = 0;
      puff(w, u.x, u.y, '#E8C860', 14, 120, 6, 0.5);
    },
    show: { far: true, secs: 4 },
  },
  // ----- Digger (round 13, his trait: every ability he uses rubs dirt in: Dirty, TRAITS2.dirtIn)
  // Dirt Fling (round 13: "Doesnt look great... If done to ally removes some effects like burn and poison. Applies dirty
  // to them"): clods of earth flung in a fan; enemies are blinded, friends in it are cleaned of fire and poison and get
  // a coat of dirt (Dirty)
  dirtFling: {
    score(w, u) {
      const f = foesNear(w, u, u.x, u.y, 140).filter((e) => inFront(u, e, 1.5)).length;
      const a = allies(w, u).some((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 150 && ((o.st.burn || 0) > 20 || (o.st.poison || 0) > 20 || o.sickT > 0));
      return a ? 0.85 : f ? 0.6 : 0;
    },
    use(w, u, t, tier) {
      const al = allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 150 && ((o.st.burn || 0) > 20 || (o.st.poison || 0) > 20 || o.sickT > 0))[0];
      if (al && !(t && inReach(u, t, 60))) u.facing = ang(u, al); else if (t) u.facing = ang(u, t);
      const fling = () => {
        cast(u, 'throw', 0.3);
        k2(w, { draw: 'clods', x: u.x, y: u.y, a: u.facing, arc: 1.3, r: 150, max: 0.55, ab: 'dirtFling' });
        for (const e of foesNear(w, u, u.x, u.y, 150)) if (inFront(u, e, 1.5)) {
          addBuff(e, { id: 'dirt', dur: 2.5, blind: true });
          hurt(w, e, dmgOf(u, 0.8), u, { noDodge: true, knock: 60, stagger: tier >= 2 ? 40 : 0, kAngle: ang(u, e) });
        }
        for (const o of allies(w, u)) if (!o.summon && dist(u.x, u.y, o.x, o.y) < 160 && inFront(u, o, 1.6)) dirty(w, o);
      };
      fling();
      if (tier >= 3) { after(u, 0.3, fling); after(u, 0.6, fling); }
    },
    show: { ally: true },
  },
  // Burrow (round 13: "Don't like the dirt mound. Trail should also linger. It just vanishes. Overall improve visual. It
  // will be used by more than just him. Don't like burst"): burrowTo (above), the earth churned up behind him lingering
  burrow: {
    score(w, u) { return opponents(w, u).some((e) => { const d = dist(u.x, u.y, e.x, e.y); return d > 160 && d < 460; }) ? 0.5 : 0; },
    use(w, u, t, tier) {
      const pick = (x, y, not) => opponents(w, u).filter((e) => e !== not && dist(x, y, e.x, e.y) > 120 && dist(x, y, e.x, e.y) < 480).sort((p, q) => (q.def.role === 'ranged' ? 1 : 0) - (p.def.role === 'ranged' ? 1 : 0) || dist(x, y, q.x, q.y) - dist(x, y, p.x, p.y))[0];
      const dive = (e, again) => {
        if (!e) return;
        const a = angleTo(e.x, e.y, u.x, u.y), x1 = clamp(e.x + Math.cos(a) * (e.r + u.r), u.r, w.W - u.r), y1 = clamp(e.y + Math.sin(a) * (e.r + u.r), u.r, w.H - u.r);
        burrowTo(w, u, x1, y1, 0.7, () => {
          u.facing = ang(u, e);
          for (const o of foesNear(w, u, u.x, u.y, 105)) hurt(w, o, dmgOf(u, 2.4), u, { knock: 320, kAngle: ang(u, o), heavy: true, noDodge: true, stagger: tier >= 2 ? 45 : 0, ab: 'burrow' });
          if (again) after(u, 0.3, () => dive(pick(u.x, u.y, e), false));
        });
      };
      dive(t && dist(u.x, u.y, t.x, t.y) > 120 ? t : pick(u.x, u.y), tier >= 3);
      timer(u, 'burrowSafe', 2.6, null, () => { if (!u.act || u.act.type !== 'leap') { u.hidden = false; u.ethereal = false; } });
    },
    show: { far: true },
  },
  // Bury, in Spade Bat's slot (round 13: "Burry. Slams shovel down in an aoe in front of him. Anyone hit will be pushed
  // into the ground for a short duration. They can't move or be hit"); id kept
  spadeBat: {
    score: (w, u, t) => (inReach(u, t, 30) ? 0.45 + 0.15 * foesNear(w, u, u.x + Math.cos(u.facing) * 50, u.y + Math.sin(u.facing) * 50, 70).length : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'ability', 0.5);
      after(u, 0.2, () => {
        const cx = u.x + Math.cos(u.facing) * (u.r + 36), cy = u.y + Math.sin(u.facing) * (u.r + 36), R = tier >= 3 ? 80 : 64;
        swingMark(w, u, u.r + 40, 0.9, { x: cx, y: cy, r: R, look: 'spade' }); w.shake = Math.max(w.shake, 6);
        for (const e of foesNear(w, u, cx, cy, R)) {
          hurt(w, e, dmgOf(u, 1.6), u, { knock: 0, heavy: true, noDodge: true, ab: 'spadeBat' });
          if (!alive(e)) continue;
          if (e.def.boss || e.fixed || e.def.brain) { stun(w, e, 0.8); continue; }
          const d = tier >= 2 ? 2.2 : 1.5; interrupt(w, e);
          e.hidden = true; e.ethereal = true; e.buried = true; stun(w, e, d); e.target = null;
          k2(w, { draw: 'buried', x: e.x, y: e.y, unit: e, r: e.r, max: d + 0.1, ab: 'spadeBat' });
          onUnit(w, e, 'buried', d, { tick(w2, u2) { u2.vx = u2.vy = u2.kx = u2.ky = 0; } }, (u2) => {
            u2.hidden = false; u2.ethereal = false; u2.buried = false; puff(w, u2.x, u2.y, '#9C7650', 10, 100, 6, 0.45);
            k2(w, { draw: 'erupt', x: u2.x, y: u2.y, r: 40, max: 0.5 });
            if (tierOf(u, 'spadeBat') >= 3) addStatus(w, u2, 'stagger', 60, u);
          });
        }
      });
    },
    show: { single: false },
  },
  // ----- Grandpa Sickle
  breadToss: {
    score: (w, u) => { const a = hurtMost([u, ...allies(w, u)].filter((o) => !o.summon)); return a && hpRatio(a) < 0.7 ? 1 - hpRatio(a) : 0; },
    use(w, u, t, tier) {
      const list = [u, ...allies(w, u)].filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 420).sort((p, q) => hpRatio(p) - hpRatio(q)).slice(0, tier >= 2 ? 2 : 1);
      cast(u, 'throw', 0.4);
      list.forEach((a, i) => after(u, 0.12 + i * 0.15, () => {
        if (!alive(a)) return;
        if (a === u) { heal(w, u, u.maxHp * 0.2, u); k2(w, { draw: 'crumbs', x: u.x, y: u.y, unit: u, max: 0.6 }); return; }
        lob(w, u, a.x, a.y, 'bread', null, () => { if (!alive(a)) return; heal(w, a, a.maxHp * 0.2, u); k2(w, { draw: 'crumbs', x: a.x, y: a.y, unit: a, max: 0.6, ab: 'breadToss' });
          if (tierOf(u, 'breadToss') >= 3) { a.regenT = 4; a.regenRate = a.maxHp * 0.1 / 4; a.regenSrc = u; } });
      }));
    },
    show: { ally: true },
  },
  // Harvest (round 13: "Dashes to ally when he does it."): he hurries to the friend most beset and sweeps round his feet there
  harvest: {
    score(w, u) {
      const n = foesNear(w, u, u.x, u.y, u.r + 70).length;
      const a = allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 360 && dist(u.x, u.y, o.x, o.y) > 80 && foesNear(w, u, o.x, o.y, 90).length >= 1);
      return a.length ? 0.75 : n >= 2 ? 0.7 : n ? 0.35 : 0;
    },
    use(w, u, t, tier) {
      const sweep = () => {
        const r = u.r + 72; setAnim(u, 'spin', 0.4); u.spin = { t0: w.time, dur: 0.4, dir: 1 };
        fx(w, { type: 'ring', x: u.x, y: u.y, r, color: '#EDE4CD', max: 0.4, a: u.facing, unit: u });
        let n = 0;
        for (const e of foesNear(w, u, u.x, u.y, r)) { n++; hurt(w, e, dmgOf(u, 1.2), u, { knock: 60, kAngle: ang(u, e), stagger: tier >= 2 ? 40 : 0, ab: 'harvest' }); addBuff(e, { id: 'hamstrung', dur: 3, move: 0.5 }); }
        if (tier >= 3 && n) heal(w, u, u.maxHp * 0.04 * n, u);
      };
      const a = allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 380 && dist(u.x, u.y, o.x, o.y) > 80).sort((p, q) => foesNear(w, u, q.x, q.y, 90).length - foesNear(w, u, p.x, p.y, 90).length || hpRatio(p) - hpRatio(q))[0];
      if (!a || !foesNear(w, u, a.x, a.y, 90).length) { sweep(); return; }
      const f = foesNear(w, u, a.x, a.y, 110)[0], b = f ? angleTo(a.x, a.y, f.x, f.y) : angleTo(a.x, a.y, u.x, u.y);
      const x1 = clamp(a.x + Math.cos(b) * (a.r + u.r * 0.6), u.r, w.W - u.r), y1 = clamp(a.y + Math.sin(b) * (a.r + u.r * 0.6), u.r, w.H - u.r);
      const T = clamp(dist(u.x, u.y, x1, y1) / 650, 0.12, 0.42); u.facing = angleTo(u.x, u.y, x1, y1);
      k2(w, { draw: 'streak', unit: u, x: u.x, y: u.y, a: u.facing, max: T + 0.3, col: '#EDE4CD' });
      u.act = { type: 'leap', t: T, max: T, x0: u.x, y0: u.y, x1, y1, land: sweep }; u.invulnT = Math.max(u.invulnT, T);
    },
    show: { ally: true, mob: 'ally' },
  },
  // Old Tales (round 13: "What does it do? Doesnt look the best"): a story book opens over him; each friend listening
  // has a gold clock over its head whose hand spins forward, and the seconds its abilities gain rise off it
  oldTales: {
    // (round 16 fixes: by the seconds it buys friends listening, counting in full an ability a friend would use now if it
    // were ready (kits.js wantedWait) and the rest at a quarter: worth at least one story's worth; it went when one
    // friend had two abilities over 4 s, wanted or not)
    score(w, u, t, tier) {
      const s2 = tier >= 2 ? 6 : 4, g = allies(w, u).filter((a) => a.kit && !a.summon && dist(u.x, u.y, a.x, a.y) < 220).reduce((n, a) => n + wantedWait(w, a, s2), 0);
      return g >= s2 ? Math.min(0.9, 0.45 + 0.03 * g) : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.9); const s = tier >= 2 ? 6 : 4;
      k2(w, { draw: 'storyBook', unit: u, x: u.x, y: u.y, r: u.vr, max: 1.6 });
      for (const a of friendsNear(w, u, u.x, u.y, 230)) {
        if (a === u) continue;
        if (a.kit) for (const k in a.kit.cd) a.kit.cd[k] = Math.max(0, a.kit.cd[k] - s);
        if (tier >= 3) heal(w, a, a.maxHp * 0.08, u);
        k2(w, { draw: 'tellClock', unit: a, x: a.x, y: a.y, r: a.vr, max: 1.3, secs: s });
      }
    },
    show: { ally: true },
  },
  // ----- Alchemist
  // Brew Pools, in Acid Flask's slot (round 13: "Bad. Is just the plague doctors. Throws 2 lingering pools of liquid in a
  // spread. Has 6 possible ones they can choose. Acid Cold Fire Whirling Shocking Water. Make look better."); id kept
  acidFlask: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 280 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.7 : t && dist(u.x, u.y, t.x, t.y) < 260 ? 0.3 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      const n = tier >= 2 ? 3 : 2, r = tier >= 3 ? 78 : 62, dur = tier >= 3 ? 5 : 4, a0 = ang(u, t), d0 = dist(u.x, u.y, t.x, t.y);
      for (let i = 0; i < n; i++) after(u, i * 0.1, () => {
        const kind = POOLS[Math.floor(rand() * POOLS.length)], a = a0 + (i - (n - 1) / 2) * 0.42, d = Math.max(60, d0 + (i % 2 ? -20 : 20));
        const x = clamp(u.x + Math.cos(a) * d, 20, w.W - 20), y = clamp(u.y + Math.sin(a) * d, 20, w.H - 20);
        lob(w, u, x, y, 'flask', POOL_COL[kind], () => brewPool(w, u, x, y, r, dur, kind));
      });
    },
    show: { far: true },
  },
  // Elixir (round 13: "Gives 1 of 3 buffs. Haste/rage, Cleanse and heal, Or swiftness and temporary shield. (Like 30
  // negate)... Make look better"): they pick the one the friend needs: cleansed and healed when it is hurt or afflicted,
  // Warded and swift when it is being hit, hasted and enraged when it is fighting fine
  elixir: {
    score: (w, u) => { const a = elixirFor(w, u); return a ? 0.75 : 0; },
    use(w, u, t, tier) {
      const a = elixirFor(w, u) || u; cast(u, 'throw', 0.4);
      const kind = elixirKind(w, u, a);
      const dose = (o) => {
        if (kind === 'mend') { cleanse(o); heal(w, o, o.maxHp * (tier >= 2 ? 0.22 : 0.14), u); }
        else if (kind === 'ward') { ward(w, o, tier >= 2 ? 45 : 30, 6); addBuff(o, { id: 'swift', dur: 5, move: 1.35 }); }
        else { haste(w, o, 5, 1.3); rage(w, o, 5, tier >= 2 ? 1.35 : 1.25); }
        k2(w, { draw: 'elixirSplash', x: o.x, y: o.y, unit: o, r: o.vr, kind, max: 0.9, ab: 'elixir' });
      };
      const go = () => { if (!alive(a)) return; dose(a); if (tier >= 3) for (const o of friendsNear(w, u, a.x, a.y, 110)) if (o !== a && !o.summon) dose(o); };
      if (a === u) go(); else lob(w, u, a.x, a.y, 'flask', ELIXIR_COL[kind], go);
    },
    show: { ally: true },
  },
  // Monstrosity, in Bang Flask's slot (round 13: "They drink 4 an unstable concoction becoming a monstrosity. Bigger fast,
  // rapid melee attacks. Drains hp quickly when in form but are immune to damage and status effect, takes less knockback.
  // Will leave form when they lose 33% of their max hp over 8 seconds. Attacks deal ANY status effect each hit at max
  // level. Also gets a dash when in this form."); id kept
  bangFlask: {
    score: (w, u, t) => (!u.kit.monster && hpRatio(u) > 0.5 && t && foesNear(w, u, u.x, u.y, 240).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      const human = u.def; setAnim(u, 'ability', 0.6);
      u.def = { ...human, role: 'melee', range: 26, atkCd: 0.38, dmg: human.dmg * (tier >= 2 ? 1.25 : 1), knock: 160, arc: 1.8, speed: human.speed * 1.25, dashCd: 2.2, attackAnim: 'punch', weapon: 'claw', keep: 0 };
      const M = u.kit.monster = { human, until: w.time + 8, r: u.r, vr: u.vr, mass: u.mass, hp0: u.maxHp };
      u.r *= 1.3; u.vr *= 1.35; u.mass *= 3;
      addBuff(u, { id: 'monster', dur: 8, statusImmune: true, wash: (T) => ['#7FCB3A', 0.28 + 0.08 * Math.sin(T * 9)] });
      cleanse(u); w.shake = Math.max(w.shake, 5); puff(w, u.x, u.y, '#9BE36B', 16, 140, 7, 0.6);
      k2(w, { draw: 'monster', unit: u, x: u.x, y: u.y, r: u.vr, max: 8.2 });
      timer(u, 'monster', 8, (dt) => { u.hp = Math.max(1, u.hp - M.hp0 * 0.33 / 8 * dt); }, () => monsterEnd(w, u));
    },
    hook: {
      evade(w, u, src, amt, o) { if (!u.kit.monster) return false; sparks(w, u.x, u.y, src ? angleTo(u.x, u.y, src.x, src.y) : 0, 3, '#B5DE5E', 0.8); return true; },
      taken(w, u, src, amt, o) { return u.kit.monster ? 0 : amt; },
      hit(w, u, t, amt, o) { if (!u.kit.monster || o.dot || o.proc || tierOf(u, 'bangFlask') < 3 || !alive(t)) return; const st = ANY_STATUS[Math.floor(rand() * ANY_STATUS.length)]; addStatus(w, t, st, 22, u); },
    },
    show: { attacks: true, secs: 4 },
  },
  // ----- Shaman
  // Healing Totem (round 13: "Should throw to ally, In an arc. Has 100 hp. Any ally in its radius that takes damage will go
  // to it instead. At lvl 3 cleanse status effects too. It has its own hit box. Damage directly to it is 50%"; "Doesn't
  // even match the one on his back"): a winged totem like his, thrown on an arc to the friend in trouble; a summon with
  // 100 health; blows on friends within its reach land on it instead; blows on it do half; it mends those near a little
  healTotem: {
    score: (w, u) => (!mine(w, u, 'totem').length && [u, ...allies(w, u)].some((a) => !a.summon && hpRatio(a) < 0.85 && opponents(w, u).some((e) => e.target === a)) ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'throw', 0.5);
      const a = [u, ...allies(w, u)].filter((o) => !o.summon && !o.def.cargo && dist(u.x, u.y, o.x, o.y) < 360).sort((p, q) => opponents(w, u).filter((e) => e.target === q).length - opponents(w, u).filter((e) => e.target === p).length || hpRatio(p) - hpRatio(q))[0] || u;
      const b = angleTo(a.x, a.y, u.x, u.y), x = clamp(a.x + Math.cos(b) * (a.r + 30), 30, w.W - 30), y = clamp(a.y + Math.sin(b) * (a.r + 30), 30, w.H - 30);
      lob(w, u, x, y, 'totemFly', null, () => {
        const s2 = summon(w, u, 'totem', x, y, { life: tier >= 2 ? 10 : 6, hp: 70 }); s2.fixed = true; s2.tier = tier; s2.R = 115;
        onUnit(w, s2, 'totemSkin', 99, { taken: (w2, u2, src, amt, o) => (o.redirected ? amt : amt * 0.5) });
        puff(w, x, y, '#A0705A', 10, 100, 5, 0.45); w.shake = Math.max(w.shake, 3);
        k2(w, { draw: 'totemReach', unit: s2, x, y, r: s2.R, max: tier >= 2 ? 12 : 8 });
      });
    },
    show: { ally: true, mob: 'ally', hitAlly: true },
  },
  // Spirit Link (round 13: "Show underneath. Give outline. Can link to totem"): the threads are drawn under the units,
  // inked; his totem joins the link
  spiritLink: {
    score: (w, u) => (allies(w, u).filter((a) => !a.summon && dist(u.x, u.y, a.x, a.y) < 260).length >= 1 && opponents(w, u).filter((e) => e.target && e.target.team === u.team).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const n = tier >= 3 ? 5 : 3, dur = tier >= 3 ? 7 : 5;
      const group = [u, ...allies(w, u).filter((a) => !a.summon && dist(u.x, u.y, a.x, a.y) < 280).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))].slice(0, n);
      for (const tm of mine(w, u, 'totem')) if (dist(u.x, u.y, tm.x, tm.y) < 320) group.push(tm);
      if (group.length < 2) return;
      u.kit.link = { group, until: w.time + dur, hp: group.map((a) => a.hp) };
      k2(w, { draw: 'links', group, x: u.x, y: u.y, max: dur, ab: 'spiritLink' });
      if (tier >= 2) for (const a of group) addBuff(a, { id: 'spiritLink', dur, taken: 0.9 });
    },
    show: { ally: true, hitAlly: true },
  },
  // Ancestors' Call, in Rain Dance's slot (round 13: "Don't like. Doesnt look good. Make ancestors call. Summons a light
  // blue bear, eagle, wolf, and beaver. Eagle, follows ally healing them. Wolf, works like current wolf. Bear, melee.
  // Negates all damage around him by 20%. Beaver. Spins and shoots out 3 homing orbs."); id kept
  rainDance: {
    score: (w, u) => (!mine(w, u, 'spiritBear').length && foesNear(w, u, u.x, u.y, 360).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.8); const life = tier >= 2 ? 9 : 6, k = tier >= 3 ? 1.1 : 1, a0 = t ? ang(u, t) : u.facing;
      const spots = [-0.9, -0.3, 0.3, 0.9].map((o) => ({ x: u.x + Math.cos(a0 + o) * 60, y: u.y + Math.sin(a0 + o) * 60 }));
      ['spiritBear', 'spiritWolf', 'spiritEagle', 'spiritBeaver'].forEach((kind, i) => {
        k2(w, { draw: 'spiritRise', x: spots[i].x, y: spots[i].y, r: 30, max: 0.9 });
        after(u, 0.25 + i * 0.12, () => {
          const s2 = summon(w, u, kind, spots[i].x, spots[i].y, { life, hit: { spiritBear: 0.9, spiritWolf: 0.7, spiritEagle: 0, spiritBeaver: 0.45 }[kind] * k, hp: { spiritBear: 90, spiritWolf: 50, spiritEagle: 40, spiritBeaver: 40 }[kind] * k });
          s2.spiritK = k; if (kind === 'spiritEagle' || kind === 'spiritBeaver') { s2.fixed = true; }
        });
      });
    },
    show: { far: false, ally: true, secs: 4 },
  },
  // ----- Witch
  // Hex (round 13: "Does not look good at all. Interesting concept. Needs unique visual not the leach. Frogs should hop
  // around randomly."): it turns into a frog (its own body is hidden, a frog drawn in its place) that hops about at random
  frogHex: {
    score: (w, u, t) => (t && !t.frogUntil && dist(u.x, u.y, t.x, t.y) < 280 ? 0.45 + (t.elite ? 0.3 : 0) + (foeWinding(w, t) ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.45);
      const frog = (e) => {
        const dur = tier >= 2 ? 3 : 2;
        shoot(w, u, ang(u, e), { kind: 'hexbolt', speed: 520, r: 8, life: 0.8, dmg: dmgOf(u, 0.4), knock: 0, extra: { home: e, turn: 8, sym: 4, onHit: (w2, p, x) => {
          if (x.def.boss) { addStatus(w2, x, 'curse', 40, u); return; }
          interrupt(w2, x); x.frogUntil = w2.time + dur; x.hidden = true;
          k2(w2, { draw: 'poof', x: x.x, y: x.y, r: x.vr, col: '#9BE36B', max: 0.5 });
          k2(w2, { draw: 'frog', unit: x, x: x.x, y: x.y, r: x.vr, max: dur, ab: 'frogHex' });
          let hopT = 0;
          onUnit(w2, x, 'frog', dur, { taken: (w3, u3, s3, a) => a * 1.5, tick(w3, u3, dt) {
            u3.atkT = Math.max(u3.atkT, 0.2); u3.abilT = Math.max(u3.abilT || 0, 0.2); if (u3.act && u3.act.type !== 'slip') u3.act = null;
            addBuff(u3, { id: 'frog', dur: 0.1, move: 0.01 }); hopT -= dt;
            if (hopT <= 0) { hopT = 0.45 + rand() * 0.35; const b = rand() * TAU; shove(u3, b, 260); u3.facing = b; u3.frogHop = w3.time; }
          } }, (u3) => { u3.frogUntil = 0; u3.hidden = false; puff(w2, u3.x, u3.y, '#9BE36B', 10, 90, 6, 0.45); });
        } } });
      };
      frog(t);
      if (tier >= 3) { const n = opponents(w, u).filter((o) => o !== t && !o.frogUntil && !o.def.boss).sort((p, q) => dist(t.x, t.y, p.x, p.y) - dist(t.x, t.y, q.x, q.y))[0]; if (n) after(u, 0.2, () => alive(n) && frog(n)); }
    },
    show: { far: true },
  },
  // Cursed Brew (round 13: "Doesnt look good. Pot should deal knockback and have a hit box and hp."): the cauldron is a
  // summon (60 health, its own body), landing with a blow that throws them back; its fumes curse whatever breathes them
  cursedBrew: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && foesNear(w, u, t.x, t.y, 100).length >= 2 && !mine(w, u, 'cauldron').length ? 0.65 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      const R = tier >= 2 ? 115 : 85;
      lob(w, u, t.x, t.y, 'cauldron', null, (x, y) => {
        const c = summon(w, u, 'cauldron', x, y, { life: 6, hp: 60 }); c.fixed = true; c.R = R;
        u.kit.brew = { x, y, r: R, until: w.time + 6, c };
        w.shake = Math.max(w.shake, 5); k2(w, { draw: 'gust', x, y, r: 70, max: 0.45 });
        for (const e of foesNear(w, u, x, y, 75)) hurt(w, e, dmgOf(u, 1.2), u, { knock: 380, kAngle: angleTo(x, y, e.x, e.y), heavy: true, noDodge: true, curse: 25, ab: 'cursedBrew' });
        k2(w, { draw: 'fumes', unit: c, x, y, r: R, max: 6.2, ab: 'cursedBrew' });
      });
    },
    hook: {
      death(w, u, v) {
        const b = u.kit.brew; if (!b || b.until < w.time || !alive(b.c) || v.team === u.team || tierOf(u, 'cursedBrew') < 3 || dist(v.x, v.y, b.x, b.y) > b.r) return;
        k2(w, { draw: 'markBurst', x: v.x, y: v.y, r: 20, max: 0.5, ab: 'cursedBrew' });
        for (const e of foesNear(w, u, v.x, v.y, 90)) addStatus(w, e, 'curse', 35, u);
      },
    },
    show: { far: true },
  },
  // Broom Ride (round 13: "Should fly above everything for a bit. Circling around. Dropping hex bombs below it. Doesnt
  // look like they are ridding it. Not targetable when flying"): up on the broom, high over the fight, circling the
  // enemies; nothing can pick her out; hex bombs dropped on them below
  broomRide: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 110).length ? 0.85 : foesNear(w, u, u.x, u.y, 300).length >= 3 ? 0.5 : 0),
    use(w, u, t, tier) {
      const T = tier >= 3 ? 3.5 : 2.5, foes = foesNear(w, u, u.x, u.y, 340);
      let cx = u.x, cy = u.y; if (foes.length) { cx = 0; cy = 0; for (const e of foes) { cx += e.x; cy += e.y; } cx /= foes.length; cy /= foes.length; }
      const R = clamp(dist(u.x, u.y, cx, cy), 90, 150); let th = angleTo(cx, cy, u.x, u.y), bombT = 0.25;
      u.act = { type: 'ride', t: T + 0.2, max: T + 0.2 }; u.ethereal = true; u.kit.broomUntil = w.time + T; u.flyT = T; // (round 17: flying on the broom) setAnim(u, 'ability', 0.4);
      k2(w, { draw: 'broom', unit: u, x: u.x, y: u.y, a: u.facing, max: T + 0.1 });
      timer(u, 'broom', T, (dt) => {
        const k = Math.min(1, (T - (u.kit.broomUntil - w.time)) / 0.3);
        th += dt * 2.4; const gx = clamp(cx + Math.cos(th) * R, u.r, w.W - u.r), gy = clamp(cy + Math.sin(th) * R, u.r, w.H - u.r), a = angleTo(u.x, u.y, gx, gy), d = dist(u.x, u.y, gx, gy);
        u.x += Math.cos(a) * Math.min(d, 420 * dt); u.y += Math.sin(a) * Math.min(d, 420 * dt); u.facing = a; u.vx = u.vy = u.kx = u.ky = 0;
        u.hop = 70 * k; bombT -= dt;
        if (bombT <= 0) { bombT = tierOf(u, 'broomRide') >= 2 ? 0.32 : 0.5;
          const e = opponents(w, u).filter((o) => dist(o.x, o.y, u.x, u.y) < 200).sort(() => rand() - 0.5)[0], bx = e ? e.x + rrange(-14, 14) : u.x, by = e ? e.y + rrange(-14, 14) : u.y;
          const p = lob(w, u, bx, by, 'hexBomb', null, () => { k2(w, { draw: 'hexPop', x: bx, y: by, r: 46, max: 0.45, ab: 'broomRide' }); for (const o of foesNear(w, u, bx, by, 46)) hurt(w, o, dmgOf(u, 0.9), u, { noDodge: true, knock: 120, kAngle: angleTo(bx, by, o.x, o.y), curse: 14, ab: 'broomRide' }); });
          p.x = u.x; p.y = u.y; }
      }, () => { u.ethereal = false; u.hop = 0; if (u.act && u.act.type === 'ride') u.act = null; puff(w, u.x, u.y, '#B07BE0', 8, 80, 5, 0.4); });
    },
    show: { far: false, secs: 4 },
  },
  // ----- Warlock (round 13: his trait gives him an imp that is always with him: TRAITS2.familiar)
  // Eldritch Beam (round 13: "Doesnt look good. Should deal kb. At the end it should burst. No second ray. Ray should come
  // from imp."): a writhing magenta ray from his imp (from him if it is gone), hotter the longer it holds, shoving the
  // target back; at the end it bursts
  eldritchBeam: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && !blocked(w, u.x, u.y, t.x, t.y) ? 0.55 + (t.elite || t.def.boss ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 2.4);
      const imp = mine(w, u, 'warlockImp')[0] || null, from = imp || u;
      const f1 = k2(w, { draw: 'eldritchRay', from, to: t, x: from.x, y: from.y, max: 2.6, heat: 0, ab: 'eldritchBeam' });
      if (imp) imp.beamT = w.time + 2.5;
      let n = 0;
      u.act = { type: 'channel', t: 2.5, max: 2.5, target: t, every: 0.25, acc: 0, tick: () => {
        const src = imp && alive(imp) ? imp : u;
        if (!alive(t) || dist(src.x, src.y, t.x, t.y) > 320) { u.act = null; f1.max = f1.t; return; }
        n++; const m = 1 + n * (tier >= 2 ? 0.3 : 0.18); f1.heat = n;
        hurt(w, t, dmgOf(u, 0.36) * m, u, { dot: true, color: '#E05AB8', ab: 'eldritchBeam' }); shove(t, angleTo(src.x, src.y, t.x, t.y), 70);
        if (n === 10) { f1.max = f1.t + 0.05; const R = tier >= 3 ? 95 : 70; k2(w, { draw: 'eyeBurst', x: t.x, y: t.y, r: R, max: 0.55, ab: 'eldritchBeam' });
          for (const e of foesNear(w, u, t.x, t.y, R)) hurt(w, e, dmgOf(u, 1.6), u, { knock: 360, kAngle: angleTo(t.x, t.y, e.x, e.y), heavy: true, noDodge: true, ab: 'eldritchBeam' }); w.shake = Math.max(w.shake, 6); }
      } };
    },
    show: { far: true },
  },
  // Awaken, in Summon Imp's slot (round 13: "Change to awaken. Imp enters his body turning him into a stronger version of
  // himself. Becomes melee with a large demonic sword, can teleport and does a large melee swing that explodes on hit
  // targets, can spit fireballs. Kills resets duration in form."); id kept
  summonImp: {
    score: (w, u) => (!u.kit.demon && foesNear(w, u, u.x, u.y, 300).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 11 : 8, human = u.def, imp = mine(w, u, 'warlockImp')[0];
      if (imp) { k2(w, { draw: 'impInto', from: imp, to: u, x: imp.x, y: imp.y, max: 0.4 }); imp.hidden = true; imp.ethereal = true; imp.inHim = true; }
      // (round 15, lane E: drawn with art round 12's demon form, art/heroes/r12/warlock-demon.svg, horns, wings and the
      // sword in his right hand; it takes the place of the red wash and the sword drawn in code: fx2.js demonForm keeps
      // the red glow and the embers)
      u.def = { ...human, art: 'art/heroes/r12/warlock-demon.svg', headR: 56, role: 'melee', range: 34, atkCd: 0.85, dmg: human.dmg * 1.7, knock: 260, arc: 2.6, weapon: 'great', attackAnim: 'swing', keep: 0, speed: human.speed * 1.15, style: { ...(human.style || {}), glow: '#FF3A5A' } };
      const D = u.kit.demon = { human, until: w.time + dur, dur, imp, blinkT: 1.2, spitT: 0.8 };
      w.shake = Math.max(w.shake, 6); setAnim(u, 'ability', 0.6);
      addBuff(u, { id: 'demon', dur: 60, knockImmune: true, taken: 0.6 });
      k2(w, { draw: 'demonForm', unit: u, x: u.x, y: u.y, r: u.vr, max: 60, D });
    },
    hook: {
      kill(w, u, v) { const D = u.kit.demon; if (D) { D.until = w.time + D.dur; textU(w, u.x, u.y, u.r + 10, 'AGAIN', '#FF5A7A', 0.9); } },
      hit(w, u, t, amt, o) {
        const D = u.kit.demon; if (!D || o.dot || o.proc || o.shot) return;
        const R = tierOf(u, 'summonImp') >= 3 ? 60 : 44; k2(w, { draw: 'eyeBurst', x: t.x, y: t.y, r: R, max: 0.4, small: true });
        for (const e of foesNear(w, u, t.x, t.y, R)) hurt(w, e, dmgOf(u, 0.5), u, { knock: 160, kAngle: angleTo(t.x, t.y, e.x, e.y), noDodge: true, proc: true, burn: tierOf(u, 'summonImp') >= 3 ? 14 : 0, ab: 'summonImp' });
      },
      tick(w, u, dt) {
        const D = u.kit.demon; if (!D) return;
        if (w.time >= D.until || !alive(u)) { demonEnd(w, u); return; }
        const t = u.target; if (!t || !alive(t)) return;
        D.blinkT -= dt; D.spitT -= dt; const d = dist(u.x, u.y, t.x, t.y);
        if (D.blinkT <= 0 && d > 110 && !u.act) { D.blinkT = 2.6; const b = angleTo(t.x, t.y, u.x, u.y) + rrange(-0.8, 0.8);
          k2(w, { draw: 'demonBlink', x: u.x, y: u.y, max: 0.45 }); u.x = clamp(t.x + Math.cos(b) * (t.r + u.r + 8), u.r, w.W - u.r); u.y = clamp(t.y + Math.sin(b) * (t.r + u.r + 8), u.r, w.H - u.r); u.vx = u.vy = 0; u.facing = ang(u, t); k2(w, { draw: 'demonBlink', x: u.x, y: u.y, max: 0.45 }); }
        else if (D.spitT <= 0 && d > 90 && d < 320 && !blocked(w, u.x, u.y, t.x, t.y)) { D.spitT = 1.5; setAnim(u, 'cast', 0.3);
          shoot(w, u, ang(u, t), { kind: 'fireball', speed: 420, r: 9, life: 1, dmg: dmgOf(u, 0.6), st: { burn: 18 }, knock: 120, land: (p) => { for (const e of foesNear(w, u, p.x, p.y, 40)) hurt(w, e, dmgOf(u, 0.3), u, { noDodge: true, burn: 10, knock: 60, kAngle: angleTo(p.x, p.y, e.x, e.y), ab: 'summonImp' }); } }); }
      },
    },
    show: { attacks: true, secs: 4 },
  },
  // Dark Bargain (round 13: "Gives 20% of his max hp go to his imp. Gets a huge attack speed boost for both of them and
  // attack does aoe."): blood drawn from him into the imp; both strike far faster, and every blow of theirs bursts
  darkBargain: {
    // (round 16 fixes: the blood buys both of them faster blows, so only when both are shooting at his target, there is
    // fight enough left to use it (foes within 300 with half his health or more between them), nothing is on him, and
    // the imp is out (not inside him: Awaken); it went at any two foes near, whether either of them was fighting)
    score(w, u, t) {
      if (hpRatio(u) <= 0.6) return 0; const imp = mine(w, u, 'warlockImp')[0]; if (!imp || imp.inHim) return 0;
      // (both shoot at his target: the imp's bolts reach 280 (BRAINS.warlockImp), his about as far)
      if (!t || !alive(t) || t.ethereal || dist(u.x, u.y, t.x, t.y) > 280 || dist(imp.x, imp.y, t.x, t.y) > 280 || blocked(w, imp.x, imp.y, t.x, t.y)) return 0;
      const left = foesNear(w, u, u.x, u.y, 300).reduce((n, e) => n + e.hp, 0);
      return left >= u.maxHp * 0.5 && attackers(w, u).length === 0 ? 0.7 : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5); const imp = mine(w, u, 'warlockImp')[0]; if (!imp) return;
      const pay = Math.min(u.hp - 1, u.maxHp * 0.2), dur = tier >= 2 ? 8 : 6; u.hp -= pay;
      imp.maxHp += tier >= 3 ? pay * 0.5 : 0; imp.hp = Math.min(imp.maxHp, imp.hp + pay);
      for (const o of [u, imp]) addBuff(o, { id: 'bargain', dur, atkSpeed: 1.8, glow: '#E05AB8' });
      u.kit.bargainUntil = w.time + dur; imp.bargainUntil = w.time + dur;
      k2(w, { draw: 'bloodTo', from: u, to: imp, x: u.x, y: u.y, max: 0.7 });
      k2(w, { draw: 'bargain', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.8 });
    },
    hook: { hit(w, u, t, amt, o) { if (!(u.kit.bargainUntil > w.time) || o.dot || o.proc) return; k2(w, { draw: 'eyeBurst', x: t.x, y: t.y, r: 40, max: 0.35, small: true }); for (const e of foesNear(w, u, t.x, t.y, 40)) if (e !== t) hurt(w, e, amt * 0.6, u, { noDodge: true, knock: 80, kAngle: angleTo(t.x, t.y, e.x, e.y), proc: true, ab: 'darkBargain' }); } },
    show: { attacks: true },
  },
  // ----- Cultist (round 13: bleeding is his: his dagger bleeds. Round 19, the designer's notes on 0.19: his bolt now
  // leaves Anti-heal (statuses.js ANTIHEAL) instead of bursting the bleeding; his abilities feed on bleeding and on the
  // nearly dead, his own side's too)
  // Blood Pact (round 13: "Applies bleed to self to give everyone becomes enraged."; round 19: "Don't like look of status
  // effect. Should also give allies bleed"): he cuts himself and every friend near him open: they all bleed, and all are
  // bound in blood: the Blood Pact (its own state, no longer Rage's red steam): +30% damage and quicker blows (II +40%),
  // III a share of what they deal heals them. Its look: a dark crimson wash and drops of blood rising slowly off the body.
  bloodPact: {
    score: (w, u) => (hpRatio(u) > 0.45 && foesNear(w, u, u.x, u.y, 300).length >= 2 && friendsNear(w, u, u.x, u.y, 230).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.6); const k = tier >= 2 ? 1.4 : 1.3, dur = 6;
      for (const a of [u, ...friendsNear(w, u, u.x, u.y, 230)]) {
        if (a.summon) continue;
        addStatus(w, a, 'bleed', a === u ? 45 : PACT.bleed, u);
        addBuff(a, { id: 'bloodPact', dur, dealt: k, atkSpeed: 1 + (k - 1) * 0.8, wash: PACT.wash, ...(tier >= 3 ? { lifesteal: 0.15 } : {}) });
        k2(w, { draw: 'pactOn', unit: a, x: a.x, y: a.y, r: a.vr, max: dur, cut: true });
        if (a !== u) k2(w, { draw: 'bloodTo', from: u, to: a, x: u.x, y: u.y, max: 0.6 });
      }
    },
    show: { ally: true },
  },
  // Ritual Circle (round 19, the designer: "Puts circle around centred around 1 entity that is at low hp. If they don't
  // escape after x seconds they will be sacrificed, lowering all of his cooldowns, healing himself. Also slowly applies
  // bleed to all entities within it at higher levels. Doesn't lock anyone in."): a circle burned into the floor round the
  // enemy nearest death (one held in place first: it can't walk out); a skull over it counts down; if it is still inside
  // when the count runs out it is sacrificed (killed; a boss, major or mini-boss loses RITE.big of its health instead), all
  // his cooldowns come RITE.cdCut s nearer and he heals RITE.heal. II: everything in the circle (either side) bleeds
  // slowly. III: wider, and the count is shorter. Nothing is held in.
  ritualCircle: {
    score: (w, u) => { const e = ritualTarget(w, u); return e ? 0.55 + (stuckFor(w, e) ? 0.25 : 0) + (hpRatio(e) < 0.3 ? 0.15 : 0) : 0; },
    use(w, u, t, tier) {
      const e = ritualTarget(w, u) || t; if (!e) return; cast(u, 'cast', 0.6);
      const x = e.x, y = e.y, r = tier >= 3 ? RITE.r3 : RITE.r, T = tier >= 3 ? RITE.t3 : RITE.t; let acc = 0;
      k2(w, { draw: 'circle', x, y, r, max: T + 0.4, ab: 'ritualCircle' });
      const mark = k2(w, { draw: 'doomMark', unit: e, x: e.x, y: e.y, r: e.vr, cx: x, cy: y, cr: r, T, max: T + 0.2 });
      timer(u, 'ritualCircle', T, (dt) => {
        if (tier < 2) return; acc += dt; if (acc < 0.3) return; acc -= 0.3;
        for (const o of w.units) if (alive(o) && o !== u && !o.ethereal && dist(o.x, o.y, x, y) < r + o.r * 0.3) addStatus(w, o, 'bleed', RITE.bleed, u);
      }, () => {
        if (!alive(e) || dist(e.x, e.y, x, y) > r) { mark.max = Math.min(mark.max, mark.t + 0.2); return; } // (it got out)
        k2(w, { draw: 'sacrifice', x: e.x, y: e.y, a: angleTo(x, y, e.x, e.y), r: e.vr, max: 0.7, ab: 'ritualCircle' });
        textU(w, e.x, e.y, e.r + 12, 'SACRIFICED', '#FF8A7A', 1);
        if (e.def.boss || e.major || e.mini || e.def.part) hurt(w, e, e.maxHp * RITE.big, u, { noDodge: true, crit: true, ab: 'ritualCircle', magic: true });
        else hurt(w, e, e.hp + 1, u, { noDodge: true, crit: true, ab: 'ritualCircle', magic: true });
        if (alive(u)) { for (const c in u.kit.cd) u.kit.cd[c] = Math.max(0, u.kit.cd[c] - RITE.cdCut); heal(w, u, u.maxHp * RITE.heal, u);
          k2(w, { draw: 'bloodTo', from: e, to: u, x: x, y: y, max: 0.7 }); }
        w.shake = Math.max(w.shake, 5);
      });
    },
    show: { far: true },
  },
  // Sacrifice, in Soul Candle's slot (round 19, the designer: "Dashes to every enemy who has bleed, bursting them. Higher
  // levels applies antiheal to everyone hit and gives him more damage buff status effect for each person hit.
  // Temporary."): he runs round each bleeding enemy in turn (dashes.js hooks, one straight after another, nearest first),
  // the dagger across its back as he comes round: a cut, and its bleeding bursts at once (a Haemorrhage). II: each one cut
  // is Anti-healed. III: each one cut makes him SAC.might stronger for SAC.dur s (it adds up).
  soulCandle: {
    score: (w, u) => { const n = bleedersOf(w, u).length; return n >= 2 ? 0.85 : n && bleedersOf(w, u)[0].st.bleed > 25 ? 0.5 : 0; },
    use(w, u, t, tier) {
      const done = new Set(); let n = 0;
      const next = () => {
        if (!alive(u) || n >= SAC.max) return; const e = bleedersOf(w, u, u).find((o) => !done.has(o)); if (!e) return; done.add(e); n++;
        const A = dash(w, u, 'hook', { t: e, only: e, tell: n === 1 ? 0.12 : 0.04, inv: true, ghost: '#7A2C40', col: ['#C8453D', '#FFE0DA'], recover: 0.06,
          strike: (x) => cutOpen(w, u, x, tier), onEnd: next });
        if (!A) next();
      };
      next();
    },
    show: { far: true },
  },
  // ----- Monk (round 19, the designer's notes on 0.19; his Fists' three-part combo is in TRAITS2.deflect, his blows'
  // looks in fx-rogue19.js: a fist's 'pow' where it lands, saffron and white)
  // Flurry (round 13: "Moves forward while doing it."; round 19: "He doesn't move forward. Don't lock positions. Final hit
  // needs a short delay. Upgrades also applied weakness. Don't like visual"): he walks into it, a step forward with every
  // punch (the punches shove it a little back, so the two travel together, neither pinned); the last punch comes a beat
  // late, drawn back first, and lands hard. II and III: it is Weakened too.
  flurry: {
    score: (w, u, t) => (inReach(u, t, 14) ? 0.6 + (hpRatio(u) < 0.6 ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; const n = tier >= 3 ? 9 : 6, GAP = 0.08, LATE = 0.24;
      const punch = (i) => {
        if (!alive(t)) return; const a = ang(u, t), last = i === n - 1; u.facing = a;
        if (!last) { setAnim(u, 'punch', 0.1); u.anim.hand = i % 2 ? 'arm-l' : 'arm-r'; }
        const gap = dist(u.x, u.y, t.x, t.y) - u.r - t.r, step = clamp(gap - 4, 4, 14); // (a step in: closing what the last shove opened, and a little more)
        u.x += Math.cos(a) * step; u.y += Math.sin(a) * step;
        hurt(w, t, dmgOf(u, last ? 1.2 : 0.6), u, { knock: last ? (tier >= 2 ? 520 : 300) : 70, kAngle: a, heavy: last, noDodge: true, ab: 'flurry' });
        heal(w, u, u.maxHp * 0.012, u);
        if (last && tier >= 2 && alive(t)) weaken(w, t, 4);
        const sd = i % 2 ? 1 : -1, hx = t.x - Math.cos(a) * t.r * 0.7 - Math.sin(a) * sd * 6, hy = t.y - Math.sin(a) * t.r * 0.7 + Math.cos(a) * sd * 6;
        k2(w, { draw: 'monkPow', x: hx, y: hy, a, r: last ? 30 : 15, big: last, max: last ? 0.42 : 0.26, ab: 'flurry' });
        if (last) w.shake = Math.max(w.shake, 4);
      };
      for (let i = 0; i < n - 1; i++) after(u, i * GAP, () => punch(i));
      // the last: drawn back first (an 'ability' blow winds up for a third of its time, parts.js), landing LATE after the one before
      after(u, (n - 2) * GAP + 0.05, () => { if (alive(t)) { setAnim(u, 'ability', (LATE - 0.05) / 0.32); u.anim.hand = (n - 1) % 2 ? 'arm-l' : 'arm-r'; } });
      after(u, (n - 2) * GAP + LATE, () => punch(n - 1));
    },
    show: { single: true },
  },
  // Palm Strike (round 13; round 19: "Don't like visual. Hand should turn large and flat. And push forward. Smaller range.
  // Burst effect is dazed. Has a hard time controlling turn, overshoots. Like has low acceleration but high max turn
  // speed. Slippery but for turning."): his open hand grows into a great flat palm that pushes out in front of him: what
  // it meets (a cone in front, shorter than before) is shoved back, turned to face away from him and Spun. Spun (the
  // shared status, kits2 spin(), statuses.js SPUN) now turns as the designer describes: slippery, slow to start a turn
  // and slow to stop it, so it overshoots; full up it is Dazed (stars, can't act) instead of marching off.
  palmStrike: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, u.r + 70).filter((e) => inFront(u, e, 1.9)).length; return n >= 2 ? 0.75 : n ? 0.4 : 0; },
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); setAnim(u, 'punch', 0.4);
      const R = u.r + (tier >= 3 ? 80 : 62), arc = 1.7;
      k2(w, { draw: 'bigPalm', unit: u, x: u.x, y: u.y, a: u.facing, r: R, max: 0.5, ab: 'palmStrike' });
      for (const e of foesNear(w, u, u.x, u.y, R)) {
        if (!inFront(u, e, arc + 0.3)) continue; const a = ang(u, e);
        hurt(w, e, dmgOf(u, 1.3), u, { knock: 380, kAngle: u.facing * 0.6 + a * 0.4, noDodge: true, stagger: tier >= 2 ? 40 : 0, ab: 'palmStrike' });
        if (!alive(e)) continue; e.facing = a; e.mvA = a; spin(w, e, tier >= 3 ? 60 : 45);
      }
      w.shake = Math.max(w.shake, 4);
    },
    show: { single: false },
  },
  // Inner Peace (round 13: "Put hands together. Heals himself. All projectiles are deflected back. And melee attack will
  // have them launched backwards..."; round 19: "Doesnt look like he's blocking physical or ranged attacks."): he sits with
  // his palms pressed together, a gold border on him (protection); every physical blow or shot is stopped at him (no
  // damage: a gold flash where it met him, the striker thrown back, the shot sent back), spells land 30% softer
  innerPeace: {
    score: (w, u) => { const bad = (o) => (o.st.burn + o.st.poison + o.st.chill + (o.st.curse || 0) + (o.st.stagger || 0) + (o.st.bleed || 0)) > 50; const shots = w.projectiles.filter((p) => p.team !== u.team && !p.noHit && dist(p.x, p.y, u.x, u.y) < 260).length;
      return bad(u) || hpRatio(u) < 0.45 || shots >= 2 || opponents(w, u).filter((e) => e.target === u && dist(e.x, e.y, u.x, u.y) < 90).length >= 3 ? 0.85 : 0; },
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 4 : 2.5;
      cleanse(u); u.kit.peaceUntil = w.time + dur;
      addBuff(u, { id: 'innerPeace', dur, root: true, taken: 0.7, border: '#FFE7A0' });
      u.act = { type: 'channel', t: dur, max: dur, every: 0.25, acc: 0, tick: () => {
        heal(w, u, u.maxHp * 0.15 / (dur * 4), u);
        if (tier >= 3) for (const a of friendsNear(w, u, u.x, u.y, 150)) if (a !== u && !a.summon) { heal(w, a, a.maxHp * 0.02, u); if ((a.st.burn + a.st.poison + a.st.chill + (a.st.curse || 0) + (a.st.bleed || 0)) > 10 || a.sickT > 0) cleanse(a); }
      } };
      setAnim(u, 'ability', 0.5);
      k2(w, { draw: 'peace', unit: u, x: u.x, y: u.y, r: tier >= 3 ? 150 : u.vr * 2, aura: tier >= 3, max: dur });
    },
    hook: {
      evade(w, u, src, amt, o) {
        if (!(u.kit.peaceUntil > w.time) || o.dot || src === u || hitType(o, src) === 'magic') return false;
        const from = o.shot && o.kAngle != null ? o.kAngle + Math.PI : src ? angleTo(u.x, u.y, src.x, src.y) : u.facing;
        k2(w, { draw: 'peaceBlock', unit: u, x: u.x + Math.cos(from) * (u.r + 4), y: u.y + Math.sin(from) * (u.r + 4), a: from, max: 0.4 });
        if (src && alive(src) && !o.shot && !o.proc && !((src.peaceHitT || 0) > w.time) && src.team !== u.team) {
          src.peaceHitT = w.time + 0.4; const a = angleTo(u.x, u.y, src.x, src.y);
          hurt(w, src, dmgOf(u, 0.5), u, { knock: 640, kAngle: a, heavy: true, noDodge: true, proc: true, ab: 'innerPeace' });
        }
        return true;
      },
    },
    show: { hitme: true, shootme: true, hurt: 0.5 },
  },
  // ----- Seer (round 13: "Overall not too exciting/ interesting. Maybe an ability that blinds everyone around her. Or
  // making it so enemies attacks can 'accidentally' hit each other friendly fire on." Both are in: Blinding Flash in
  // Premonition's slot ("Meh"), Ill Omen in Starfall's)
  // Foresight (round 13: "Better visual."): a great violet eye opens over the marked one, rays of light pinning it
  foresight: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 360).some((e) => !e.buffs.some((b) => b.id === 'foresight') && (e.elite || e.def.boss || e.maxHp > 120)) ? 0.75 : foesNear(w, u, u.x, u.y, 300).length >= 3 ? 0.45 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const list = foesNear(w, u, u.x, u.y, 380).sort((p, q) => q.maxHp - p.maxHp).slice(0, tier >= 3 ? 2 : 1);
      for (const e of list) {
        addBuff(e, { id: 'foresight', dur: 6, taken: 1.35, blind: tier >= 2 });
        k2(w, { draw: 'seerEye', unit: e, from: u, x: e.x, y: e.y, r: e.vr, max: 6, ab: 'foresight' });
      }
    },
    show: { single: true },
  },
  // Blinding Flash, in Premonition's slot: the crystal flares: everything round her is blinded (most of its blows miss)
  premonition: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, 150).length; return n >= 2 ? 0.8 : n ? 0.45 : 0; },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4); const R = 160, d = tier >= 2 ? 3.5 : 2.5;
      k2(w, { draw: 'flash', x: u.x, y: u.y, r: R, max: 0.6, ab: 'premonition' });
      for (const e of foesNear(w, u, u.x, u.y, R)) {
        hurt(w, e, dmgOf(u, 0.8), u, { noDodge: true, omni: true, knock: 60, kAngle: ang(u, e), radiance: tier >= 3 ? 30 : 0, ab: 'premonition' });
        addBuff(e, { id: 'blinded', dur: d, blind: true }); interrupt(w, e); if (e.target === u) e.target = null;
        k2(w, { draw: 'blindOn', unit: e, x: e.x, y: e.y, r: e.vr, max: d });
      }
    },
  },
  // Ill Omen, in Starfall's slot: a dark star over the enemies: for 5s their blows go astray: each one they strike with
  // also lands on a friend of theirs near, and they grow confused
  starfall: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 320 && foesNear(w, u, t.x, t.y, 120).length >= 3 ? 0.75 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.7); const x = t.x, y = t.y, R = tier >= 3 ? 150 : 120, dur = 5;
      k2(w, { draw: 'omen', x, y, r: R, max: dur, ab: 'starfall' }); let acc = 0;
      timer(u, 'illOmen', dur, (dt) => {
        acc += dt; const tickNow = acc >= 0.5; if (tickNow) acc -= 0.5;
        for (const e of foesNear(w, u, x, y, R)) {
          if (tickNow) addStatus(w, e, 'confuse', tierOf(u, 'starfall') >= 2 ? 16 : 10, u);
          onUnit(w, e, 'omen', 0.3, { hit(w2, a2, v, amt, o) {
            if (o.dot || o.proc || o.omenHit) return;
            const f = w2.units.find((q) => q !== a2 && q !== v && alive(q) && q.team === a2.team && !q.ethereal && dist(q.x, q.y, a2.x, a2.y) < a2.r + q.r + (a2.def.range || 20) + 30);
            if (f) { hurt(w2, f, amt * 0.8, a2, { noDodge: true, omenHit: true, knock: o.knock || 40 }); k2(w2, { draw: 'oops', unit: f, x: f.x, y: f.y, r: f.vr, max: 0.6 }); }
          } });
        }
      });
    },
    show: { far: true, attacks: false, foesFight: true },
  },
  // ----- Chef
  // Hot Meal (round 13: "Doesnt look good. Should throw food pick ups randomly around dungeon to be picked up. If at full hp
  // will get over health."): plates thrown out round the party; a friend who walks over one eats it: healed, and if
  // already whole the rest is extra health (a shield: Warded). Hurt friends with nothing on them go and get one.
  hotMeal: {
    score: (w, u) => { const a = [u, ...allies(w, u)].filter((o) => !o.summon && hpRatio(o) < 0.7).length; return a && (u.kit.foods || []).length < 3 ? 0.6 + 0.1 * a : 0; },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.5); const n = tier >= 2 ? 3 : 2, F = u.kit.foods || (u.kit.foods = []);
      const al = [u, ...allies(w, u)].filter((o) => !o.summon && !o.def.cargo);
      for (let i = 0; i < n; i++) after(u, i * 0.15, () => {
        const a = al[Math.floor(rand() * al.length)] || u, b = rand() * TAU, d = rrange(50, 140), x = clamp(a.x + Math.cos(b) * d, 30, w.W - 30), y = clamp(a.y + Math.sin(b) * d, 30, w.H - 30);
        lob(w, u, x, y, 'food', null, () => { const f = k2(w, { draw: 'meal', x, y, max: 14, kind: Math.floor(rand() * 6), ab: 'hotMeal' }); F.push({ x, y, f, until: w.time + 14 }); puff(w, x, y, '#FFE7A0', 6, 60, 4, 0.35); }).food = Math.floor(rand() * 6);
      });
    },
    show: { ally: true, secs: 4 },
  },
  greaseFire: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 170).filter((e) => inFront(u, e, 1.4)).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'throw', 0.4);
      const a = u.facing, spots = [[60, 0], [105, -0.2], [105, 0.2], [150, 0]];
      if (tier >= 3) spots.push([120, -0.55], [120, 0.55], [180, -0.3], [180, 0.3]);
      const pts = spots.map(([d, o]) => ({ x: u.x + Math.cos(a + o) * d, y: u.y + Math.sin(a + o) * d }));
      k2(w, { draw: 'spray', x: u.x, y: u.y, a, arc: tier >= 3 ? 1.6 : 1, r: 170, max: 0.5, cols: ['#E0B050', '#C8902A', '#FFE08A'] });
      for (const p of pts) w.hazards.push({ type: 'oil', x: p.x, y: p.y, r: 40, t: 6, max: 6 });
      for (const e of foesNear(w, u, u.x, u.y, 180)) if (inFront(u, e, 1.2)) hurt(w, e, dmgOf(u, 0.6), u, { noDodge: true, knock: 60, burn: tier >= 2 ? 25 : 0 });
      if (tier >= 2) { let acc = 0; k2(w, { draw: 'greaseFlames', pts, max: 6, ab: 'greaseFire' });
        timer(u, 'greaseFire', 6, (dt) => { acc += dt; if (acc < 0.3) return; acc -= 0.3; for (const e of opponents(w, u)) if (pts.some((p) => dist(p.x, p.y, e.x, e.y) < 40 + e.r * 0.5)) addStatus(w, e, 'burn', 11, u); }); }
    },
  },
  // Food Fight (round 13: "Stops any movement abilities from anyone hit and applies a slight slow."): pies that stop a
  // dash, leap or charge dead where it is, and slow a little
  foodFight: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 300).length >= 3 || opponents(w, u).some((e) => e.act && MOVES_ACT.has(e.act.type) && dist(u.x, u.y, e.x, e.y) < 330) ? 0.65 : 0),
    use(w, u, t, tier) {
      cast(u, 'throw', 0.5);
      const list = foesNear(w, u, u.x, u.y, 330).filter((e) => !blocked(w, u.x, u.y, e.x, e.y)).sort((p, q) => (q.act && MOVES_ACT.has(q.act.type) ? 1 : 0) - (p.act && MOVES_ACT.has(p.act.type) ? 1 : 0) || dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y)).slice(0, tier >= 3 ? 5 : 3);
      list.forEach((e, i) => after(u, i * 0.1, () => { if (!alive(e)) return; setAnim(u, 'throw', 0.2);
        shoot(w, u, ang(u, e), { kind: 'pie', speed: 460, r: 9, color: '#FFF4D0', life: 1.2, dmg: dmgOf(u, 0.8), knock: 60, extra: { home: e, turn: 4, onHit: (w2, p, x) => {
          if (x.act && MOVES_ACT.has(x.act.type)) { if (x.act.type === 'leap') { x.hop = 0; } x.act = null; x.vx = x.vy = x.kx = x.ky = 0; x.spd = 0; textU(w2, x.x, x.y, x.r + 8, 'STOPPED', '#FFF4D0', 0.9); }
          addBuff(x, { id: 'pied', dur: 3, move: 0.8, blind: tierOf(u, 'foodFight') >= 2 });
          k2(w2, { draw: 'splash', x: x.x, y: x.y, r: 30, col: '#FFF4D0', max: 0.5, ab: 'foodFight' }); k2(w2, { draw: 'pieFace', unit: x, x: x.x, y: x.y, r: x.vr, max: 3, ab: 'foodFight' });
        } } }); }));
    },
    show: { far: true },
  },
  // ----- Beekeeper (round 13: "REDO... Overall don't like. Visuals or abilities or animations." A new kit, the lane's
  // own, ids kept: the keeper calms enemies with smoke, sets a hive on them and glazes friends in honey; his bees pester)
  // Smoker (swarm's slot): a cone of the smoker's thick white smoke: they grow sleepy and slow
  swarm: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 170).filter((e) => inFront(u, e, 1.5)).length >= 2 ? 0.7 : foesNear(w, u, u.x, u.y, 120).length ? 0.45 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'throw', 0.6); const a = u.facing, R = 175, arc = 1.4;
      k2(w, { draw: 'smoker', x: u.x, y: u.y, a, r: R, arc, max: 2.2, ab: 'swarm' });
      let acc = 0, n = 0;
      timer(u, 'smoker', 2, (dt) => { acc += dt; if (acc < 0.25) return; acc -= 0.25; n++;
        for (const e of foesNear(w, u, u.x, u.y, R)) if (inFront(u, e, arc + 0.2)) { sleepy(w, e, tier >= 2 ? 13 : 9, u); addBuff(e, { id: 'smoked', dur: 0.5, move: 0.7, atkSpeed: tier >= 3 ? 0.75 : 1 }); if (n === 1) hurt(w, e, dmgOf(u, 0.6), u, { noDodge: true, knock: 30, ab: 'swarm' }); } });
    },
  },
  // Beehive (honeyPot's slot): a hive thrown down among the enemies (its own health): bees stream out at whatever is
  // near; whoever strikes the hive is mobbed
  honeyPot: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && foesNear(w, u, t.x, t.y, 160).length >= 2 && !mine(w, u, 'beehive').length ? 0.7 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      const b = ang(u, t), d = Math.max(60, dist(u.x, u.y, t.x, t.y) - 40), x = clamp(u.x + Math.cos(b) * d, 30, w.W - 30), y = clamp(u.y + Math.sin(b) * d, 30, w.H - 30);
      lob(w, u, x, y, 'hiveFly', null, () => { const h = summon(w, u, 'beehive', x, y, { life: tier >= 2 ? 12 : 8, hp: 70 }); h.fixed = true; h.tier = tier; puff(w, x, y, '#F2B42A', 8, 80, 5, 0.4); });
    },
    show: { far: true, secs: 4 },
  },
  // Honey Glaze (royalJelly's slot): honey drizzled over a friend: it heals over 4 s, and whatever strikes it gets stuck
  royalJelly: {
    score: (w, u) => { const a = [u, ...allies(w, u)].filter((o) => !o.summon && hpRatio(o) < 0.75 && opponents(w, u).some((e) => e.target === o)); return a.length ? 0.75 : 0; },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.4);
      const list = [u, ...allies(w, u)].filter((o) => !o.summon && !o.def.cargo && dist(u.x, u.y, o.x, o.y) < 360).sort((p, q) => opponents(w, u).filter((e) => e.target === q).length - opponents(w, u).filter((e) => e.target === p).length || hpRatio(p) - hpRatio(q)).slice(0, tier >= 3 ? 2 : 1);
      for (const a of list) {
        const glaze = () => { if (!alive(a)) return; a.regenT = 4; a.regenRate = a.maxHp * (tier >= 2 ? 0.17 : 0.11) / 4; a.regenSrc = u;
          k2(w, { draw: 'honeyOn', unit: a, x: a.x, y: a.y, r: a.vr, max: 4 });
          onUnit(w, a, 'honey', 4, { struck(w2, u2, src) { if (src && alive(src) && src !== u2 && !src.fixed && dist(src.x, src.y, u2.x, u2.y) < u2.r + src.r + 60) { addStatus(w2, src, 'entangle', 30, u); addBuff(src, { id: 'honeyed', dur: 2, move: 0.5 }); k2(w2, { draw: 'honeyOn', unit: src, x: src.x, y: src.y, r: src.vr, max: 2 }); } } }); };
        if (a === u) glaze(); else lob(w, u, a.x, a.y, 'honeyJar', null, glaze);
      }
    },
    show: { ally: true, hitAlly: true },
  },
  // ----- Quartermaster (round 13: "REDO... Overall don't like. Visuals or abilities. Giving out hp potions is very
  // strong. Needs to be more unique": a new kit, ids kept: the man with the pack: kit for the party, a crate, a barricade,
  // a pot over an enemy's head; still a gatherer on the wagon road)
  // Supply Crate (resupply's slot): a crate dropped by the party: whoever touches it first has its abilities come round
  // sooner and is patched up a little
  resupply: {
    // (round 16 fixes: by the seconds the crate buys whoever touches it, him too (its brain counts him), counting in full
    // an ability they would use now (kits.js wantedWait): at least one cut's worth; it went for a friend with two
    // abilities over 4 s, wanted or not, and never for himself)
    score(w, u, t, tier) {
      if (mine(w, u, 'crate').length || attackers(w, u).length >= 2 || foesNear(w, u, u.x, u.y, 160).length >= 3) return 0; const cut = tier >= 2 ? 6 : 4; // (not with foes pressing round him: it is lobbed, and walked to)
      const g = [u, ...allies(w, u)].filter((a) => a.kit && !a.summon && !a.def.cargo && dist(u.x, u.y, a.x, a.y) < 300).reduce((n, a) => n + wantedWait(w, a, cut), 0);
      return g >= cut ? Math.min(0.85, 0.45 + 0.03 * g) : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.4); const n = tier >= 3 ? 2 : 1;
      const al = allies(w, u).filter((a) => !a.summon && !a.def.cargo && a.kit).sort((p, q) => Object.values(q.kit.cd).reduce((s1, c) => s1 + c, 0) - Object.values(p.kit.cd).reduce((s1, c) => s1 + c, 0));
      for (let i = 0; i < n; i++) { const a = al[i] || u, b = rand() * TAU, x = clamp(a.x + Math.cos(b) * 50, 30, w.W - 30), y = clamp(a.y + Math.sin(b) * 50, 30, w.H - 30);
        lob(w, u, x, y, 'crateFly', null, () => { const c = summon(w, u, 'crate', x, y, { life: 14, hp: 40 }); c.fixed = true; c.cut = tier >= 2 ? 6 : 4; c.used = new Set(); puff(w, x, y, '#C9A070', 8, 80, 5, 0.4); w.shake = Math.max(w.shake, 2); }); }
    },
    show: { ally: true, secs: 4 },
  },
  // Barricade (oilBlades's slot): a wooden barricade unfolded between the party and the enemies: it blocks their way and
  // their shots until it is broken
  oilBlades: {
    // (round 16 fixes: tried "only for what is still coming, none on him yet" and put back: in the swarm the wall
    // thrown down among the rats already on him is what keeps him alive (11 of 12 won with it, 1 of 12 without); its
    // low worth in the audit is the recorder not counting walls)
    score(w, u) { const f = opponents(w, u).filter((e) => dist(u.x, u.y, e.x, e.y) < 300); return f.length >= 2 && !mine(w, u, 'barricade').length && allies(w, u).some((a) => !a.summon && a.def.role === 'ranged') ? 0.65 : f.length >= 3 && !mine(w, u, 'barricade').length ? 0.45 : 0; },
    use(w, u, t, tier) {
      const f = opponents(w, u).filter((e) => dist(u.x, u.y, e.x, e.y) < 400); if (!f.length) return;
      let cx = 0, cy = 0; for (const e of f) { cx += e.x; cy += e.y; } cx /= f.length; cy /= f.length;
      const a = angleTo(u.x, u.y, cx, cy), d = Math.min(110, dist(u.x, u.y, cx, cy) * 0.5), x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d;
      cast(u, 'ability', 0.5); u.facing = a;
      const bar = summon(w, u, 'barricade', x, y, { life: tier >= 2 ? 14 : 10, hp: tier >= 2 ? 160 : 110 }); bar.fixed = true; bar.facing = a; bar.spikes = tier >= 3;
      w.shake = Math.max(w.shake, 3); puff(w, x, y, '#C9A070', 12, 110, 6, 0.5);
    },
    show: { far: true, shootme: true, secs: 4 },
  },
  // Pot Helmet (flare's slot): a big cooking pot thrown so it lands upside down over an enemy's head: it can't see (its
  // blows miss) and blunders about confused
  flare: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && !isOn(w, t, 'potHead') ? 0.5 + (t.elite || t.major ? 0.25 : 0) + (t.def.role === 'ranged' ? 0.15 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      const pot = (e, then) => lob(w, u, e.x, e.y, 'potFly', null, () => { if (!alive(e)) return;
        const d = e.def.boss ? 1.2 : 3; hurt(w, e, dmgOf(u, 1.2), u, { noDodge: true, knock: 40, stagger: tier >= 2 ? 50 : 0, ab: 'flare' });
        addBuff(e, { id: 'potHead', dur: d, blind: true }); confuse(w, e, 45, u); onUnit(w, e, 'potHead', d, {});
        k2(w, { draw: 'potHead', unit: e, x: e.x, y: e.y, r: e.vr, max: d }); textU(w, e.x, e.y, e.r + 10, 'CLONG', '#C9D2DE', 1);
        if (then) then(e); });
      pot(t, tier >= 3 ? (e) => { const n = opponents(w, u).filter((o) => o !== e && !isOn(w, o, 'potHead') && dist(o.x, o.y, e.x, e.y) < 200)[0]; if (n) after(u, 0.1, () => pot(n, null)); } : null);
    },
    show: { far: true },
  },
  // ----- Crossbowman
  // Pavise (round 13: "Better visual. Doesnt look like he's shooting through it. It has its own hp. At lvl 3 he places 3 in
  // a row slight titles to surround him. Allies can attack through it. Enemies can't"): the tall shield planted as its
  // own thing (a summon with health): its side's shots go through it, the other side's stop on it
  pavise: {
    score: (w, u) => (!mine(w, u, 'pavise').length && (opponents(w, u).filter((e) => e.target === u).length >= 1 || w.projectiles.some((p) => p.team !== u.team && dist(p.x, p.y, u.x, u.y) < 300)) ? 0.65 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); setAnim(u, 'ability', 0.4); const dur = tier >= 2 ? 10 : 7, offs = tier >= 3 ? [-0.75, 0, 0.75] : [0];
      for (const o of offs) { const a = u.facing + o, x = u.x + Math.cos(a) * (u.r + 30), y = u.y + Math.sin(a) * (u.r + 30);
        const pv = summon(w, u, 'pavise', x, y, { life: dur, hp: 60 }); pv.fixed = true; pv.facing = a; puff(w, x, y, '#E9DDC2', 8, 90, 5, 0.4); }
      u.kit.paviseT = w.time + dur;
    },
    show: { far: true, shootme: true },
  },
  // Pinning Bolt (round 13: "Heavy bolt, hits an enemy, then makes them fly backwards into a wall stunning them in place
  // for a bit. Does heavy damage. Enemy being flung does heavy kb to anyone it hits as they fly")
  pinBolt: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && !blocked(w, u.x, u.y, t.x, t.y) ? 0.5 + (t.def.role !== 'ranged' && t.target && t.target !== u ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'shoot', 0.4); u.recoilT = 0.25;
      shoot(w, u, ang(u, t), { kind: 'cbolt', speed: 900, r: 9, dmg: dmgOf(u, 2.2), knock: 0, extra: { big: true, onHit: (w2, p, e) => {
        const a = Math.atan2(p.vy, p.vx), d = (tier >= 3 ? 2.5 : 1.8) * (e.def.boss ? 0.4 : 1);
        shove(e, a, e.def.boss ? 300 : 1100); e.act = null; interrupt(w2, e);
        k2(w2, { draw: 'boltIn', unit: e, x: e.x, y: e.y, a, r: e.r, max: 1.2 + d });
        flung(w2, u, e, 1.1, (x) => { stun(w2, x, d); addBuff(x, { id: 'pinned', dur: d, root: true }); hurt(w2, x, dmgOf(u, 0.8), u, { noDodge: true, heavy: true, knock: 0, stagger: tier >= 2 ? 50 : 0, ab: 'pinBolt' }); w2.shake = Math.max(w2.shake, 5);
          k2(w2, { draw: 'pinWall', unit: x, x: x.x, y: x.y, a, r: x.r, max: d, ab: 'pinBolt' }); textU(w2, x.x, x.y, x.r + 10, 'PINNED', '#EEF3F8', 1); },
          (o, x) => { hurt(w2, o, dmgOf(u, 0.9), u, { noDodge: true, knock: 520, kAngle: a, heavy: true, ab: 'pinBolt' }); });
      } } });
    },
    show: { far: true, single: true },
  },
  // Crank Up (round 13: "Bomb at the end. Not fire themed. Staggering. Better visual"): the crank wound hard: his next
  // bolts carry a charge that bursts where they stop: grey smoke and iron, staggering
  crankUp: {
    score: (w, u, t) => (!(u.kit.crank > 0) && t && foesNear(w, u, t.x, t.y, 90).length >= 2 ? 0.6 : t ? 0.3 : 0),
    use(w, u, t, tier) {
      setAnim(u, 'ability', 0.6); u.kit.crank = tier >= 3 ? 5 : 3; u.kit.crankR = tier >= 2 ? 80 : 60;
      k2(w, { draw: 'crank', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.8 });
      u.atkT = Math.min(u.atkT, 0.3);
    },
    show: { far: true, attacks: true },
  },
  // ----- Falconer (round 13: a new trait, Hunting Partner: the falcon goes out with every fourth knife)
  // Loose the Falcon (round 13: "Doesnt look good. Falcon should leave hand. Should show a crosshair on target 'tracked'
  // stops them from going invisible/un targetable, underground. All attacks do additional fixed damage to target";
  // showcase 4: "Make the falcon that flies look like the one he was holding"): it leaves his fist and marks its prey
  looseFalcon: {
    score: (w, u) => (opponents(w, u).some((e) => dist(u.x, u.y, e.x, e.y) < 440) && !u.kit.falconOut ? 0.6 : 0),
    use(w, u, t, tier) {
      const far = (not) => opponents(w, u).filter((e) => e !== not && dist(u.x, u.y, e.x, e.y) < 460).sort((p, q) => (q.elite || q.def.boss ? 1 : 0) - (p.elite || p.def.boss ? 1 : 0) || dist(u.x, u.y, q.x, q.y) - dist(u.x, u.y, p.x, p.y))[0];
      let e = far(null); if (!e) return; cast(u, 'throw', 0.4);
      const hand = handAt(u, u.facing - 0.6, 0);
      const f = k2(w, { draw: 'falcon', x: hand.x, y: hand.y, a: u.facing, max: 9, ab: 'looseFalcon' });
      let phase = 'fly', pt = 0, hits = 0, second = tier >= 3; u.kit.falconOut = true;
      timer(u, 'falcon', 8.5, (dt) => {
        const goal = phase === 'home' ? u : e;
        if (phase !== 'home' && !alive(e)) { const n = second ? far(e) : null; if (n) { e = n; second = false; phase = 'fly'; } else phase = 'home'; return; }
        const a = angleTo(f.x, f.y, goal.x, goal.y), d = dist(f.x, f.y, goal.x, goal.y);
        if (phase === 'peck') { pt += dt; f.x = e.x + Math.cos(pt * 5) * (e.r + 8); f.y = e.y + Math.sin(pt * 5) * (e.r + 8); f.a = pt * 5 + Math.PI / 2;
          if (pt > 0.5 * (hits + 1)) { hits++; hurt(w, e, dmgOf(u, 0.4), u, { noDodge: true, knock: 20, ab: 'looseFalcon' }); }
          if (pt > 2.5) { if (second) { const n = far(e); second = false; if (n) { e = n; phase = 'fly'; pt = 0; hits = 0; return; } } phase = 'home'; }
          return; }
        f.a = a; const sp = 560 * dt; f.x += Math.cos(a) * Math.min(sp, d); f.y += Math.sin(a) * Math.min(sp, d);
        if (d < goal.r + 8) {
          if (phase === 'home') { f.max = f.t; return true; }
          phase = 'peck'; pt = 0; hits = 0;
          tracked(w, e, 6, 2 + dmgOf(u, 0.25), u); if (tierOf(u, 'looseFalcon') >= 2) addBuff(e, { id: 'falconBlind', dur: 3, blind: true });
          hurt(w, e, dmgOf(u, 1), u, { noDodge: true, knock: 60, ab: 'looseFalcon' });
        }
      }, () => { f.max = Math.min(f.max, f.t + 0.05); u.kit.falconOut = false; });
    },
    show: { far: true, secs: 4 },
  },
  // Keen Eye (round 13: "Don't like eye."): no eye: his knives glint gold while it lasts, and gold motes go round his
  // throwing hand
  keenEye: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && foesNear(w, u, u.x, u.y, 300).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4); u.kit.keenUntil = w.time + 6;
      if (tier >= 2) addBuff(u, { id: 'keenEye', dur: 6, atkSpeed: 1.3 });
      k2(w, { draw: 'keenHand', unit: u, x: u.x, y: u.y, r: u.vr, max: 6 });
      u.atkT = Math.min(u.atkT, 0.2);
    },
    show: { far: true, attacks: true },
  },
  // Call the Flock (round 13: "Not good. Should become a flock of birds for a bit. Birds don't look good"): he scatters
  // into a flock of birds (nothing can touch him) that sweeps through the enemies pecking, then he is himself again
  flock: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 110).length ? 0.8 : foesNear(w, u, u.x, u.y, 300).length >= 3 ? 0.5 : 0),
    use(w, u, t, tier) {
      const T = tier >= 3 ? 3 : 2.2; u.act = { type: 'ride', t: T + 0.2, max: T + 0.2 }; u.hidden = true; u.ethereal = true;
      const F = { birds: [], x: u.x, y: u.y }; for (let i = 0; i < 9; i++) F.birds.push({ o: rand() * TAU, r: 10 + rand() * 26, s: 0.8 + rand() * 0.5 });
      k2(w, { draw: 'flockForm', unit: u, x: u.x, y: u.y, max: T + 0.3, F });
      puff(w, u.x, u.y, '#8E98A6', 10, 90, 5, 0.4); const hit = new Map(); let goal = null, gT = 0;
      timer(u, 'flock', T, (dt) => {
        gT -= dt; if (!goal || !alive(goal) || gT <= 0) { const list = opponents(w, u).filter((e) => dist(u.x, u.y, e.x, e.y) < 360); goal = list[Math.floor(rand() * list.length)] || null; gT = 0.7; }
        const gx = goal ? goal.x + Math.cos(w.time * 3) * 40 : u.x, gy = goal ? goal.y + Math.sin(w.time * 3) * 40 : u.y, a = angleTo(u.x, u.y, gx, gy), d = dist(u.x, u.y, gx, gy);
        u.x = clamp(u.x + Math.cos(a) * Math.min(d, 300 * dt), u.r, w.W - u.r); u.y = clamp(u.y + Math.sin(a) * Math.min(d, 300 * dt), u.r, w.H - u.r); u.facing = a; u.vx = u.vy = u.kx = u.ky = 0;
        for (const e of opponents(w, u)) if (dist(e.x, e.y, u.x, u.y) < e.r + 40 && w.time - (hit.get(e) || -9) > 0.5) { hit.set(e, w.time); hurt(w, e, dmgOf(u, 0.6), u, { noDodge: true, knock: 50, kAngle: a, ab: 'flock' }); addBuff(e, { id: 'pecked', dur: 2, move: 0.7, blind: tierOf(u, 'flock') >= 2 }); }
      }, () => { u.hidden = false; u.ethereal = false; if (u.act && u.act.type === 'ride') u.act = null; puff(w, u.x, u.y, '#8E98A6', 12, 100, 5, 0.45); });
    },
    show: { far: false, secs: 4 },
  },
  // ----- Grenadier (round 13: a new trait, Powder Keg: what his blasts kill blows up too)
  // Big Bomb (round 13: "Secondary bombs don't look good. Big bomb should be an entity with a small health pool. Explodes
  // if it is broken or after 2 seconds of landing"): it lands as a thing of its own (30 health), fuse fizzing
  bigBomb: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && foesNear(w, u, t.x, t.y, 120).length >= 3 ? 0.8 : t && dist(u.x, u.y, t.x, t.y) < 300 && foesNear(w, u, t.x, t.y, 120).length >= 2 ? 0.45 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.5);
      lob(w, u, t.x, t.y, 'bomb', 'big', (x, y) => {
        const b = summon(w, u, 'bigBomb', x, y, { life: 2, hp: 30 }); b.fixed = true; b.tier = tier; b.bomber = u;
        w.shake = Math.max(w.shake, 3); puff(w, x, y, '#E9DDC2', 6, 60, 4, 0.35);
      });
    },
    show: { far: true, secs: 4 },
  },
  // Sticky Bomb (round 13: "Doesnt look very sticky"): it hits with a splat of green goo that holds it on, strands
  // dripping off; it goes off 2 s later
  stickyBomb: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && !t.sticky ? 0.5 + (t.elite || t.def.boss ? 0.25 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      const targets = [t]; if (tier >= 3) { const n = opponents(w, u).filter((o) => o !== t && dist(u.x, u.y, o.x, o.y) < u.def.range + 40)[0]; if (n) targets.push(n); }
      targets.forEach((e) => shoot(w, u, ang(u, e), { kind: 'bomb', speed: 520, r: 8, dmg: dmgOf(u, 0.4), knock: 10, extra: { home: e, turn: 5, onHit: (w2, p, x) => {
        x.sticky = true; k2(w2, { draw: 'sticky', unit: x, x: x.x, y: x.y, r: x.vr, max: 2, a: Math.atan2(p.vy, p.vx), ab: 'stickyBomb' });
        addBuff(x, { id: 'gooed', dur: 2, move: 0.75 });
        after(x, 2, () => { x.sticky = false; blast(w2, u, x.x, x.y, tierOf(u, 'stickyBomb') >= 2 ? 100 : 72, 2.1, { stagger: 30 }, 'stickyBomb'); });
      } } }));
    },
    show: { far: true },
  },
  // Blast Off (round 13: "Explosion effect should happen underneath him"): the blast drawn on the floor under him
  blastOff: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 90).length ? 0.85 : 0),
    use(w, u, t, tier) {
      const f = foesNear(w, u, u.x, u.y, 160); let ax = 0, ay = 0; for (const e of f) { ax += u.x - e.x; ay += u.y - e.y; }
      const a = f.length ? Math.atan2(ay, ax) : u.facing + Math.PI;
      blast(w, u, u.x, u.y, 95, 1, { stagger: tier >= 2 ? 45 : 20 }, 'blastOff', true);
      const x1 = clamp(u.x + Math.cos(a) * 190, u.r, w.W - u.r), y1 = clamp(u.y + Math.sin(a) * 190, u.r, w.H - u.r);
      u.invulnT = Math.max(u.invulnT, 0.55);
      u.act = { type: 'leap', t: 0.5, max: 0.5, x0: u.x, y0: u.y, x1, y1, land: () => { if (tierOf(u, 'blastOff') >= 3) blast(w, u, u.x, u.y, 75, 0.8, { stagger: 20 }, 'blastOff', true); puff(w, u.x, u.y, '#E9DDC2', 8, 90, 5, 0.4); } };
    },
  },
  // ----- Harpooner
  // Reel In (round 13: "Make harpoon render stuck in them. Rope underneath"): the harpoon stays in them, the rope on the floor
  reelIn: {
    score(w, u) { return opponents(w, u).some((e) => { const d = dist(u.x, u.y, e.x, e.y); return d > 150 && d < 380 && !blocked(w, u.x, u.y, e.x, e.y); }) ? 0.6 : 0; },
    use(w, u, t, tier) {
      const e = opponents(w, u).filter((o) => { const d = dist(u.x, u.y, o.x, o.y); return d > 120 && d < 400 && !blocked(w, u.x, u.y, o.x, o.y); }).sort((p, q) => (q.def.role === 'ranged' ? 1 : 0) - (p.def.role === 'ranged' ? 1 : 0))[0] || t; if (!e) return;
      cast(u, 'throw', 0.4);
      const p0 = shoot(w, u, ang(u, e), { kind: 'harpoon', speed: 720, r: 9, life: 0.7, dmg: dmgOf(u, 2), knock: 0, extra: { big: true, home: e, turn: 6, onHit: (w2, p, x) => {
        const big = x.def.boss || x.mass > 2.6;
        if (big) { const a = ang(u, x), d = dist(u.x, u.y, x.x, x.y) - u.r - x.r - 6; u.act = { type: 'leap', t: 0.35, max: 0.35, x0: u.x, y0: u.y, x1: u.x + Math.cos(a) * d, y1: u.y + Math.sin(a) * d, land: () => {} }; }
        else { const a = angleTo(x.x, x.y, u.x, u.y), d = dist(u.x, u.y, x.x, x.y) - u.r - x.r - 6; x.kx += Math.cos(a) * d * 5.4 / Math.max(1, Math.sqrt(x.mass)); x.ky += Math.sin(a) * d * 5.4 / Math.max(1, Math.sqrt(x.mass)); }
        if (tier >= 2) addStatus(w2, x, 'stagger', 55, u);
        k2(w2, { draw: 'rope', from: u, to: x, x: u.x, y: u.y, max: tier >= 3 ? 4 : 0.7, stuck: true, a: Math.atan2(p.vy, p.vx), ab: 'reelIn' });
        if (tier >= 3 && !big) timer(u, 'tether', 4, () => { if (!alive(x)) return true; const d = dist(u.x, u.y, x.x, x.y); if (d > 140) { const a = angleTo(x.x, x.y, u.x, u.y); x.x += Math.cos(a) * (d - 140) * 0.3; x.y += Math.sin(a) * (d - 140) * 0.3; } });
      } } });
      k2(w, { draw: 'rope', from: u, shot: p0, x: u.x, y: u.y, max: 0.75 });
    },
    show: { far: true, single: true },
  },
  // Rogue Wave (round 13: "Give better visual. Closer targets are launched further and take more damage. They get hit
  // before the wave even reaches them"): a curling wave rolls out; each is struck when its crest reaches it, harder and
  // further the closer it stood
  rogueWave: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 200).filter((e) => inFront(u, e, 1.4)).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'cast', 0.5);
      const a = u.facing, R = tier >= 2 ? 260 : 200, arc = tier >= 2 ? 1.6 : 1.25, sp = 420, hit = new Set(); let r = 10;
      k2(w, { draw: 'rogueWave', x: u.x, y: u.y, a, r: R, arc, max: R / sp + 0.4, sp, ab: 'rogueWave' });
      const x0 = u.x, y0 = u.y;
      timer(u, 'rogueWave', R / sp + 0.05, (dt) => { r += sp * dt;
        for (const e of foesNear(w, u, x0, y0, r)) if (!hit.has(e) && angleDiff(angleTo(x0, y0, e.x, e.y), a) < arc / 2 + 0.15) {
          hit.add(e); const near = 1 - clamp(dist(x0, y0, e.x, e.y) / R, 0, 1);
          addStatus(w, e, 'wet', 60, u); hurt(w, e, dmgOf(u, 0.9 + 1.1 * near), u, { knock: 220 + 420 * near, kAngle: a, noDodge: true, ab: 'rogueWave' }); } });
      if (tier >= 3) for (const d of [80, 140, 200]) w.hazards.push({ type: 'water', x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d, r: 44, t: 8, max: 8 });
    },
  },
  // Drop Anchor (round 13: "Make anchor look better. Have it jump from him to targets position. Make it look bigger. Improve
  // visuals"): a big iron anchor heaved off him on its chain, arcing over to land on them with a crash
  anchorDrop: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.7 : t && dist(u.x, u.y, t.x, t.y) < 220 ? 0.35 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'ability', 0.7);
      const x = t.x, y = t.y, r = tier >= 2 ? 115 : 85;
      if (tier >= 3) { setAnim(u, 'spin', 0.4); u.spin = { t0: w.time, dur: 0.4, dir: 1 }; for (const e of foesNear(w, u, u.x, u.y, 130)) hurt(w, e, dmgOf(u, 0.6), u, { knock: 240, kAngle: ang(u, e), noDodge: true }); k2(w, { draw: 'chainSweep', unit: u, x: u.x, y: u.y, r: 130, max: 0.45 }); }
      k2(w, { draw: 'anchor', from: u, x, y, x0: u.x, y0: u.y, r, max: 0.65, ab: 'anchorDrop' });
      after(u, 0.55, () => {
        w.shake = Math.max(w.shake, 8);
        k2(w, { draw: 'anchorCrash', x, y, r, max: 0.7 });
        for (const e of foesNear(w, u, x, y, r)) { hurt(w, e, dmgOf(u, 2.8), u, { heavy: true, noDodge: true, knock: 150, kAngle: angleTo(x, y, e.x, e.y) }); stun(w, e, 1.2); }
      });
    },
    show: { far: true },
  },
  // ----- Javelin Huntress
  // Spear Lunge, in Running Throw's slot (round 13: "Description doesn't match what I see. Give a spear lunge attack.
  // Pierce through targets. 2 charges at lvl 3"): she lunges spear-first straight through a line of enemies
  runningThrow: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y), a = ang(u, t); return d < 240 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.4 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.35 && dist(u.x, u.y, e.x, e.y) < 260).length : 0; },
    use(w, u, t, tier) {
      // round 18 (lane dash18): the draw cut with a spear (dashes.js). She draws the spear back, bursts down the line
      // behind its point and stops past them; each one the point went through carries a mark, and the wounds burst open
      // down the line a beat after. The blow (1.6x), the stagger at II and the second lunge at III are as they were.
      // (She ran the line at one speed, each one struck as she passed.)
      if (!t) return; const a = ang(u, t); u.facing = a;
      const L = clamp(dist(u.x, u.y, t.x, t.y) + 50, 110, 290); // (she runs right through her target, however far it stood)
      if (tier >= 3) { const k = u.kit; if (!k.lunge2) { k.lunge2 = true; k.cd.runningThrow = 0.7; } else k.lunge2 = false; } // two charges: the second follows at once
      dash(w, u, 'drawCut', { a, len: L, lance: true, tell: 0.16, hold: 0.14, recover: 0.16, ghost: '#C9A46A', dmg: dmgOf(u, 1.6), hit: { knock: 200, stagger: tier >= 2 ? 40 : 0, ab: 'runningThrow' } });
    },
    show: { far: true },
  },
  // Bound (round 13: "Make javalin bigger and hit harder")
  bound: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 95).length ? 0.85 : 0),
    use(w, u, t, tier) {
      const f = foesNear(w, u, u.x, u.y, 150); let ax = 0, ay = 0; for (const e of f) { ax += u.x - e.x; ay += u.y - e.y; }
      const a = f.length ? Math.atan2(ay, ax) : u.facing + Math.PI, x1 = clamp(u.x + Math.cos(a) * 170, u.r, w.W - u.r), y1 = clamp(u.y + Math.sin(a) * 170, u.r, w.H - u.r);
      u.act = { type: 'leap', t: 0.45, max: 0.45, x0: u.x, y0: u.y, x1, y1, land: () => puff(w, u.x, u.y, '#E9DDC2', 6, 70, 4, 0.35) };
      u.invulnT = Math.max(u.invulnT, 0.3);
      after(u, 0.2, () => { const e = t && alive(t) ? t : foesNear(w, u, u.x, u.y, 300)[0]; if (!e) return; u.facing = ang(u, e);
        shoot(w, u, ang(u, e), { kind: 'javelin', speed: 660, r: 11, dmg: dmgOf(u, 2.1), knock: 200, pierce: tierOf(u, 'bound') >= 2 ? 4 : 0, extra: { big: true } }); });
      if (tier >= 3) u.kit.cd.bound = Math.max(0, (u.kit.cd.bound || 0) - 2);
    },
  },
  // Javelin Rain, in Prey's slot (round 13: "Don't like"; a new ability, the lane's): she hurls javelins high; they
  // come down on the enemies round her target
  prey: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 320 && foesNear(w, u, t.x, t.y, 110).length >= 2 ? 0.7 : t && dist(u.x, u.y, t.x, t.y) < 300 ? 0.3 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.5); const n = tier >= 3 ? 5 : 3, cx = t.x, cy = t.y;
      for (let i = 0; i < n; i++) {
        const near = foesNear(w, u, cx, cy, 120), e = near[i % Math.max(1, near.length)], x = e ? e.x + rrange(-10, 10) : cx + rrange(-70, 70), y = e ? e.y + rrange(-10, 10) : cy + rrange(-70, 70);
        after(u, 0.1 + i * 0.12, () => { k2(w, { draw: 'javFall', x, y, max: 0.6 }); after(u, 0.55, () => {
          for (const o of foesNear(w, u, x, y, 44)) hurt(w, o, dmgOf(u, 1.5), u, { noDodge: true, knock: 120, kAngle: angleTo(x, y, o.x, o.y), stagger: tierOf(u, 'prey') >= 2 ? 30 : 0, ab: 'prey' });
          k2(w, { draw: 'javStuck', x, y, max: 1.2 }); puff(w, x, y, '#E9DDC2', 6, 70, 4, 0.35); }); });
      }
    },
    show: { far: true },
  },
  // ----- Marksman (round 13: his trait is Long Shot: very long range, harder the further off)
  // Aimed Shot (round 13: "Applied target effect. Shows crosshair on them. Movement abilities are limited and they take
  // additional damage. Bullets pierce through targeted entities"): it leaves its target Targeted
  aimedShot: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && !blocked(w, u.x, u.y, t.x, t.y) && !foesNear(w, u, u.x, u.y, 110).length ? 0.6 + (t.elite || t.def.boss ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'shoot', 1.1);
      k2(w, { draw: 'aimLine', from: u, to: t, x: u.x, y: u.y, max: 0.9 });
      u.act = { type: 'channel', t: 0.9, max: 0.9, target: t, every: 0.9, acc: 0, tick: () => {} };
      after(u, 0.9, () => {
        if (!alive(u)) return; const e = t && alive(t) ? t : foesNear(w, u, u.x, u.y, u.def.range)[0]; if (!e) return;
        let first = true; u.recoilT = 0.3; w.shake = Math.max(w.shake, 4);
        k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: ang(u, e), max: 0.5, big: true });
        shoot(w, u, ang(u, e), { kind: 'bullet', speed: 1400, r: 7, life: 0.8, dmg: dmgOf(u, 2.5), crit: true, knock: 260, pierce: tierOf(u, 'aimedShot') >= 2 ? 9 : 1, extra: { big: true, onHit: (w2, p, x) => {
          targeted(w2, x, 6); pierceMarked(w2, p, x);
          if (first && tierOf(u, 'aimedShot') >= 3) { const d = x.def.boss ? 0.6 : 1.5; x.koT = Math.max(x.koT || 0, d); stun(w2, x, d); } first = false; } } });
      });
    },
    show: { far: true, single: true },
  },
  // Bayonet (round 13: "Improve"): a lunge with the bayonet fixed: a long steel thrust, a heavy shove, a jolt of recoil
  bayonet: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, u.r + 55).length ? 0.85 : 0),
    use(w, u, t, tier) {
      // round 18 (lane dash18): a short draw cut with the bayonet (dashes.js, the wound landing as the point goes in):
      // he sets the stock, lunges a short way behind the point, and whatever it runs into is shoved hard. The blow, the
      // shove, the stagger at II and the shot at III are as they were. (He jolted forward and the blow landed on the
      // nearest one a moment later, wherever the point was.)
      const e = foesNear(w, u, u.x, u.y, u.r + 70).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0]; if (!e) return;
      const a = ang(u, e); u.facing = a; const gap = Math.max(0, dist(u.x, u.y, e.x, e.y) - u.r - e.r);
      dash(w, u, 'drawCut', { a, len: gap + 30, lance: true, now: true, tell: 0.1, burst: 0.09, recover: 0.14, inv: false, only: e, dmg: dmgOf(u, 1.2), straight: true, hit: { knock: 520, heavy: true, stagger: tier >= 2 ? 50 : 0, ab: 'bayonet' },
        arrive: () => { k2(w, { draw: 'headbutt', x: u.x + Math.cos(a) * (u.r + 30), y: u.y + Math.sin(a) * (u.r + 30), a, max: 0.35 }); w.shake = Math.max(w.shake, 3); } });
      if (tier >= 3) after(u, 0.5, () => { if (!alive(e)) return; u.facing = ang(u, e); setAnim(u, 'shoot', 0.3); k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: u.facing, max: 0.4, big: true }); shoot(w, u, u.facing, { kind: 'bullet', speed: 1300, r: 6, dmg: dmgOf(u, 1.2), knock: 160 }); });
    },
    show: { single: true },
  },
  // Ricochet (round 13: "Only bounces between targets within already 75 degrees of last target. Can't turn 180 degrees.
  // Lvl 3 makes it so it does more damage to each consecutive target.")
  ricochet: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && foesNear(w, u, t.x, t.y, 220).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'shoot', 0.4); const hit = new Set(); u.recoilT = 0.22;
      k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: ang(u, t), max: 0.4, big: true });
      const fire = (x, y, e, k, left, skip) => {
        const a = angleTo(x, y, e.x, e.y);
        w.projectiles.push({ kind: 'bullet', x, y, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, r: 6, team: u.team, owner: u, skip, dmg: dmgOf(u, k), o: { knock: 110, ab: 'ricochet' }, life: 0.5, a, ab: 'ricochet', tier,
          onHit: (w2, p, hitE) => { hit.add(hitE); pierceMarked(w2, p, hitE); if (left <= 0) return;
            const n = opponents(w2, u).filter((o) => !hit.has(o) && dist(o.x, o.y, hitE.x, hitE.y) < 260 && angleDiff(angleTo(hitE.x, hitE.y, o.x, o.y), a) < 1.31).sort((p1, q) => dist(hitE.x, hitE.y, p1.x, p1.y) - dist(hitE.x, hitE.y, q.x, q.y))[0];
            sparks(w2, hitE.x, hitE.y, a, 4, '#FFF4C8', 1); if (n) fire(hitE.x, hitE.y, n, k * (tierOf(u, 'ricochet') >= 3 ? 1.3 : 0.9), left - 1, hitE); } });
      };
      fire(u.x + Math.cos(ang(u, t)) * u.r, u.y + Math.sin(ang(u, t)) * u.r, t, 1.2, tier >= 2 ? 5 : 3, null);
    },
    show: { far: true },
  },
  // ----- Ninja
  // Kunai Rain, in Shuriken Fan's slot (round 13: "Not good"; a new ability, the lane's): she springs up and flings a
  // ring of kunai down all round her
  shurikenFan: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, 160).length; return n >= 2 ? 0.75 : n ? 0.35 : 0; },
    use(w, u, t, tier) {
      const n = tier >= 2 ? 12 : 8; setAnim(u, 'throw', 0.35); u.act = { type: 'leap', t: 0.35, max: 0.35, x0: u.x, y0: u.y, x1: u.x, y1: u.y, land: () => {} };
      after(u, 0.17, () => { for (let i = 0; i < n; i++) shoot(w, u, i / n * TAU + rrange(-0.08, 0.08), { kind: 'kunai', speed: 520, r: 7, life: 0.45, dmg: dmgOf(u, 1.3), knock: 60, st: tier >= 3 ? { poison: 18 } : {}, extra: { big: true } }); puff(w, u.x, u.y, '#5A5560', 8, 70, 5, 0.35); });
    },
  },
  // Substitution (round 13: "… doesnt show this happening. Good idea though"): shown now: a puff of smoke, a log
  // tumbling where she stood ("POOF"), a streak of smoke to where she comes out
  substitution: {
    passiveTier: true, score: () => 0, use() {},
    hook: {
      taken(w, u, src, amt, o) {
        const k = u.kit; if (o.dot || o.proc || amt < 3 || (k.subReady || 0) > w.time) return amt;
        const tier = tierOf(u, 'substitution'), cd = tier >= 3 ? 7 : 12; k.subReady = w.time + cd; k.cd.substitution = cd;
        const x0 = u.x, y0 = u.y, a = src ? angleTo(src.x, src.y, u.x, u.y) + rrange(-0.7, 0.7) : rand() * TAU;
        k2(w, { draw: 'log', x: x0, y: y0, max: 1.6, big: true, ab: 'substitution' }); k2(w, { draw: 'poof', x: x0, y: y0, r: 22, col: '#8A8590', max: 0.6 });
        textU(w, x0, y0, u.r + 8, 'POOF', '#EEF3F8', 1);
        if (tier >= 2) for (const e of foesNear(w, u, x0, y0, 90)) addBuff(e, { id: 'logSmoke', dur: 2, blind: true });
        u.x = clamp(u.x + Math.cos(a) * 130, u.r, w.W - u.r); u.y = clamp(u.y + Math.sin(a) * 130, u.r, w.H - u.r); u.vx = u.vy = 0; u.invulnT = Math.max(u.invulnT, 0.3);
        k2(w, { draw: 'smokeDash', x: x0, y: y0, x2: u.x, y2: u.y, max: 0.6 }); k2(w, { draw: 'poof', x: u.x, y: u.y, r: 18, col: '#8A8590', max: 0.5 });
        return 0;
      },
    },
    show: { hitme: true },
  },
  // Caltrops (round 13: "Doesnt look good. Should be shown spreading around her. Each one does slight damage and
  // stagger"): a handful flung out round her, each its own little iron star on the floor; each bites once
  caltrops: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 140).length >= 1 ? 0.6 : 0),
    use(w, u, t, tier) {
      setAnim(u, 'throw', 0.3); const n = tier >= 2 ? 14 : 9, C = [];
      for (let i = 0; i < n; i++) { const b = i / n * TAU + rrange(-0.2, 0.2), d = rrange(40, tier >= 2 ? 120 : 95), x = clamp(u.x + Math.cos(b) * d, 10, w.W - 10), y = clamp(u.y + Math.sin(b) * d, 10, w.H - 10);
        C.push({ x, y, x0: u.x, y0: u.y, live: true, rot: rand() * TAU }); }
      k2(w, { draw: 'caltrops', C, x: u.x, y: u.y, max: 7, ab: 'caltrops' });
      timer(u, 'caltrops', 7, () => { for (const c of C) if (c.live) { const e = opponents(w, u).find((o) => !o.hop && dist(o.x, o.y, c.x, c.y) < o.r * 0.7 + 6); if (e) { c.live = false;
        hurt(w, e, dmgOf(u, 0.55), u, { noDodge: true, knock: 0, stagger: 28, poison: tierOf(u, 'caltrops') >= 3 ? 10 : 0, ab: 'caltrops' }); } } });
    },
  },
  // ----- Pirate (round 13: her trait is Plunder: with her in the party, the fallen drop more coins)
  // Point Blank (round 13: "Doesnt look great but yea. Should apply targeted"): a big flash and a cloud of gun smoke; it is
  // left Targeted
  pointBlank: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, u.r + 60).length ? 0.6 : 0),
    use(w, u, t, tier) {
      const list = foesNear(w, u, u.x, u.y, u.r + 70).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y));
      const bang = (e, side) => { if (!e || !alive(e)) return; u.facing = ang(u, e); setAnim(u, 'shoot', 0.3); u.recoilT = 0.2;
        k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: u.facing, max: 0.55, side, big: true });
        hurt(w, e, dmgOf(u, 1.7), u, { knock: 420, heavy: true, noDodge: true, stagger: tierOf(u, 'pointBlank') >= 2 ? 50 : 0 }); targeted(w, e, 5); w.shake = Math.max(w.shake, 4); };
      bang(list[0] || t, 1);
      if (tier >= 3) after(u, 0.25, () => bang(list[1] || list[0], -1));
    },
    show: { single: true },
  },
  // Grog (round 13: "Not good implementation. Lvl 3 throws 1 to ally"): she stops, tips the bottle back (bottle to her
  // mouth), and sways tipsy while it works; III she tosses a bottle to a friend too
  grog: {
    score: (w, u) => (hpRatio(u) < 0.5 && foesNear(w, u, u.x, u.y, 200).length ? 0.8 : 0),
    use(w, u, t, tier) {
      const drink = (a) => { heal(w, a, a.maxHp * 0.25, u); addBuff(a, { id: 'grog', dur: 5, taken: 0.8, knockImmune: tier >= 2 }); k2(w, { draw: 'tipsy', unit: a, x: a.x, y: a.y, r: a.vr, max: 5 }); };
      u.act = { type: 'swig', t: 0.6, max: 0.6 }; u._force = { [u.def.style && u.def.style.hand === 'arm-l' ? 'arm-r' : 'arm-l']: { r: 0.6, dy: -16 } };
      k2(w, { draw: 'bottle', unit: u, x: u.x, y: u.y, max: 0.6 });
      after(u, 0.6, () => { if (u.act && u.act.type === 'swig') u.act = null; u._force = null; if (alive(u)) drink(u); });
      if (tier >= 3) { const a = hurtMost(allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 320)); if (a) after(u, 0.7, () => lob(w, u, a.x, a.y, 'grogFly', null, () => alive(a) && drink(a))); }
    },
    show: { hurt: 0.4, ally: true },
  },
  // Broadside (round 13: "They should come in from an arc off the screen"): the ship's guns, out of sight: each ball
  // comes in high from the edge of the room on a long arc and lands with a blast
  broadside: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 340 && foesNear(w, u, t.x, t.y, 130).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.5);
      const n = tier >= 3 ? 5 : 3, cx = t.x, cy = t.y, r = tier >= 2 ? 75 : 58, side = rand() < 0.5 ? -1 : 1;
      for (let i = 0; i < n; i++) {
        const near = foesNear(w, u, cx, cy, 130), e = near[i % Math.max(1, near.length)];
        const x = e ? e.x + rrange(-15, 15) : cx + rrange(-80, 80), y = e ? e.y + rrange(-15, 15) : cy + rrange(-80, 80);
        const sx = side > 0 ? w.W + 60 : -60, sy = y + rrange(-200, 200);
        after(u, 0.2 + i * 0.22, () => { k2(w, { draw: 'cannon', x, y, sx, sy, r, max: 0.9, ab: 'broadside' }); after(u, 0.9, () => blast(w, u, x, y, r, 1.5, { stagger: 20 }, 'broadside')); });
      }
    },
    show: { far: true, secs: 4 },
  },
  // ----- Slinger
  // Stunning Stone (round 13: "Not good. Don't like how it is done."): the sling whirled hard over his head, then a big
  // stone lobbed high that comes down on the enemy's head: a crack, stars, stunned
  stunStone: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range ? 0.4 + (foeWinding(w, t) ? 0.45 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'spin', 0.45); k2(w, { draw: 'slingWhirl', unit: u, x: u.x, y: u.y, max: 0.45 });
      const hitHead = (e, k2nd) => { if (!alive(e)) return; interrupt(w, e); const d = k2nd ? 0.7 : (tierOf(u, 'stunStone') >= 2 ? 1.3 : 0.9);
        hurt(w, e, dmgOf(u, k2nd ? 1 : 1.8), u, { noDodge: true, omni: true, knock: 40, ab: 'stunStone' }); stun(w, e, d);
        k2(w, { draw: 'bonk', x: e.x, y: e.y, unit: e, r: e.vr, max: Math.max(0.6, d) }); k2(w, { draw: 'stoneCrack', x: e.x, y: e.y, r: e.vr, max: 0.5 }); textU(w, e.x, e.y, e.r + 8, 'BONK', '#E9DDC2', 1); };
      after(u, 0.4, () => { if (!alive(t)) return; setAnim(u, 'throw', 0.25);
        const p0 = lob(w, u, t.x, t.y, 'bigStone', null, () => { hitHead(t, false);
          if (tierOf(u, 'stunStone') >= 3) { const n = opponents(w, u).filter((o) => o !== t && dist(o.x, o.y, t.x, t.y) < 200)[0]; if (n) { const p2 = lob(w, u, n.x, n.y, 'bigStone', null, () => hitHead(n, true)); p2.x = t.x; p2.y = t.y; } } }); p0.home = t; });
    },
    show: { far: true },
  },
  // Ram (round 13: "Concept good. Execution poor"): a big woolly ram (redrawn) comes charging up from behind him with
  // its head down, bounding, and bowls through the line, tossing them aside in tufts of wool
  ramCharge: {
    score(w, u, t) { if (!t) return 0; const a = ang(u, t); return opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.35 && dist(u.x, u.y, e.x, e.y) < 380).length >= 2 ? 0.65 : t && dist(u.x, u.y, t.x, t.y) < 300 ? 0.3 : 0; },
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.4);
      const run = (off) => {
        const a = ang(u, t), nx = -Math.sin(a) * off, ny = Math.cos(a) * off, x0 = u.x - Math.cos(a) * 60 + nx, y0 = u.y - Math.sin(a) * 60 + ny, hit = new Set(); let s2 = 0;
        const f = k2(w, { draw: 'ram', x: x0, y: y0, a, max: 1.05, ab: 'ramCharge' });
        timer(u, 'ram' + off, 1, (dt) => { s2 += 560 * dt; f.x = x0 + Math.cos(a) * s2; f.y = y0 + Math.sin(a) * s2;
          for (const e of foesNear(w, u, f.x, f.y, 36)) if (!hit.has(e)) { hit.add(e); const side = Math.sign(Math.sin(angleTo(f.x, f.y, e.x, e.y) - a)) || 1;
            hurt(w, e, dmgOf(u, 1.5), u, { knock: 460, kAngle: a + side * 0.7, heavy: true, noDodge: true, stagger: tierOf(u, 'ramCharge') >= 2 ? 50 : 0, ab: 'ramCharge' }); k2(w, { draw: 'wool', x: e.x, y: e.y, max: 0.6 }); w.shake = Math.max(w.shake, 3); } });
      };
      run(0); if (tier >= 3) after(u, 0.2, () => run(50));
    },
    show: { far: true },
  },
  // Counting Sheep, in Gravel's slot (round 13: "Not good. Needs ability that applied sleep"): little sheep come
  // bounding over the enemies round a spot, one after another; each one that jumps over them makes them sleepier
  gravel: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 320 && foesNear(w, u, t.x, t.y, 110).length >= 2 ? 0.7 : t && dist(u.x, u.y, t.x, t.y) < 300 ? 0.3 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.5); const cx = t.x, cy = t.y, n = tier >= 2 ? 8 : 5, R = tier >= 3 ? 120 : 95;
      for (let i = 0; i < n; i++) after(u, 0.15 + i * 0.32, () => {
        const near = foesNear(w, u, cx, cy, R), e = near[i % Math.max(1, near.length)]; const x = e ? e.x : cx + rrange(-50, 50), y = e ? e.y : cy + rrange(-50, 50), a = rand() * TAU;
        k2(w, { draw: 'sheepHop', x, y, a, n: i, max: 0.7 });
        after(u, 0.35, () => { for (const o of foesNear(w, u, x, y, 46)) { sleepy(w, o, tierOf(u, 'gravel') >= 3 ? 30 : 24, u); textU(w, o.x, o.y, o.r + 6, String(i + 1), '#F4EEDC', 0.8); } });
      });
    },
    show: { far: true, secs: 4 },
  },
  // ----- Trapper (round 13: his rifle is a shotgun: short reach, a spray of pellets)
  // Jaw Trap (round 13: "That doesnt look like what he is holding. Applies trapped. Target can't turn or move but can't
  // use abilities and attack(straight). A trap shouldn't steal from another trap that is active."): a steel jaw trap like
  // his; what it catches is Trapped (kits2 trapped()); a trap never takes what another trap holds
  jawTrap: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && t.def.role !== 'ranged' && (u.kit.traps || 0) < 3 ? 0.55 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'throw', 0.35);
      const n = tier >= 3 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const k = 0.55 + i * 0.12, off = (i ? 40 : 0), a = ang(u, t) + Math.PI / 2;
        const x = u.x + (t.x - u.x) * k + Math.cos(a) * off, y = u.y + (t.y - u.y) * k + Math.sin(a) * off;
        u.kit.traps = (u.kit.traps || 0) + 1;
        lob(w, u, x, y, 'trapThrown', null, () => {
          const f = k2(w, { draw: 'trap', x, y, max: 14, ab: 'jawTrap' });
          timer(u, 'trap' + Math.round(x * 7 + y), 14, () => {
            const e = foesNear(w, u, x, y, 22).find((o) => !isOn(w, o, 'trapped') && !o.fixed); if (!e) return;
            const T = tierOf(u, 'jawTrap') >= 2 ? 3 : 2; const d = trapped(w, e, T); e.x = x; e.y = y; e.vx = e.vy = 0; e.kx = e.ky = 0;
            hurt(w, e, dmgOf(u, tierOf(u, 'jawTrap') >= 2 ? 1.8 : 1.2), u, { noDodge: true, knock: 0, ab: 'jawTrap' });
            f.snapT = f.t; f.max = f.t + d; f.held = e; textU(w, e.x, e.y, e.r + 8, 'TRAPPED', '#C9D2DE', 1); return true;
          }, () => { u.kit.traps = Math.max(0, (u.kit.traps || 1) - 1); if (!f.snapT) f.max = Math.min(f.max, f.t + 0.3); });
        });
      }
    },
    show: { far: true, mob: 'walk' },
  },
  // Double Barrel, in Weighted Net's slot (round 13: "Don't like at all"; a new ability, the lane's): both barrels at
  // once: a wide cone of heavy pellets that blows them back
  snareNet: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, 170).filter((e) => inFront(u, e, 1.4)).length; return n >= 2 ? 0.75 : n ? 0.45 : 0; },
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); setAnim(u, 'shoot', 0.4); u.recoilT = 0.3; w.shake = Math.max(w.shake, 5); const a0 = u.facing, n = 12;
      k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: a0, max: 0.6, big: true });
      for (let i = 0; i < n; i++) shoot(w, u, a0 + (rand() - 0.5) * 0.9, { kind: 'pellet', speed: rrange(620, 820), r: 5, life: 0.3, dmg: dmgOf(u, 0.32), knock: 120, st: tier >= 2 ? { stagger: 9 } : {} });
      if (tier >= 3) for (const e of foesNear(w, u, u.x, u.y, 110)) if (inFront(u, e, 1.2)) { e.koT = Math.max(e.koT || 0, e.def.boss ? 0.4 : 1.2); stun(w, e, 1.2); }
      u.kx -= Math.cos(a0) * 140; u.ky -= Math.sin(a0) * 140;
    },
  },
  // Bush, in Tripwire's slot (round 13: "Don't like. Need ability that turns them into a bush. Enemies quickly lose aggro
  // on him. Used to get away. Healing slightly (rejuvenation)"): he is a bush (leaves rustling as it creeps off): no enemy
  // can pick him out, and he heals a little
  tripwire: {
    score: (w, u) => (opponents(w, u).filter((e) => e.target === u && dist(e.x, e.y, u.x, u.y) < 200).length >= 1 && hpRatio(u) < 0.7 ? 0.8 : 0),
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 5 : 3.5; u.hidden = true; u.ethereal = true; u.kit.bushUntil = w.time + dur;
      for (const e of opponents(w, u)) if (e.target === u) e.target = null;
      puff(w, u.x, u.y, '#6FA046', 12, 90, 6, 0.45); u.regenT = dur; u.regenRate = u.maxHp * (tier >= 3 ? 0.04 : 0.025); u.regenSrc = u;
      k2(w, { draw: 'bush', unit: u, x: u.x, y: u.y, r: u.vr, max: dur });
      timer(u, 'bush', dur, null, () => { u.hidden = false; u.ethereal = false; puff(w, u.x, u.y, '#6FA046', 10, 90, 6, 0.45); });
    },
    show: { hitme: true, hurt: 0.5 },
  },
  // ----- Gladiator (round 13: his trait is Duelist: stronger one on one)
  // Spear of Ares, in Net Throw's slot (round 13: "Nope. Shoukd throw a large piercing spear. Ares spear"): a great
  // spear hurled through the whole line
  netThrow: {
    score(w, u, t) { if (!t || dist(u.x, u.y, t.x, t.y) > 340 || blocked(w, u.x, u.y, t.x, t.y)) return 0; const a = ang(u, t); return 0.35 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.3 && dist(u.x, u.y, e.x, e.y) < 360).length; },
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.45); const a = ang(u, t); let last = null;
      after(u, 0.14, () => shoot(w, u, a, { kind: 'aresSpear', speed: 760, r: 12, life: 0.6, pierce: 9, dmg: dmgOf(u, 2.1), knock: 220, st: { stagger: tier >= 2 ? 40 : 0 }, extra: { onHit: (w2, p, e) => { last = e; } }, land: () => {
        if (last && alive(last) && tierOf(u, 'netThrow') >= 3) { addBuff(last, { id: 'pinned', dur: 1.5, root: true }); k2(w, { draw: 'pin', unit: last, x: last.x, y: last.y, r: last.vr, a, max: 1.5, ab: 'netThrow' }); } } }));
    },
    show: { far: true },
  },
  // Arena, in Showboat's slot (round 13: "Should make a ring that pushes out allies and any enemy more than 1.
  // Projectiles are blocked. 1 on 1 battle"): a sand ring round him and his foe: everyone else is pushed out and kept
  // out, shots can't cross it
  showboat: {
    score: (w, u, t) => (t && alive(t) && dist(u.x, u.y, t.x, t.y) < 160 && (t.elite || t.def.boss || foesNear(w, u, u.x, u.y, 200).length >= 2) && hpRatio(u) > 0.35 ? 0.7 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'ability', 0.6); const dur = 5, R = 130, cx = (u.x + t.x) / 2, cy = (u.y + t.y) / 2; u.kit.showUntil = w.time + dur; u.kit.arenaFoe = t;
      taunt(w, t, u, dur); u.target = t; // (round 19: sim.js taunt, the red V)
      if (tier >= 2) heal(w, u, u.maxHp * 0.15, u);
      k2(w, { draw: 'arenaRing', x: cx, y: cy, r: R, max: dur, ab: 'showboat' }); k2(w, { draw: 'horn', unit: u, x: u.x, y: u.y, r: 200, max: 0.8 });
      timer(u, 'arena', dur, () => {
        for (const o of w.units) { if (o === u || o === t || !alive(o) || o.fixed) continue; const d = dist(o.x, o.y, cx, cy); if (d < R + o.r) { const a = angleTo(cx, cy, o.x, o.y); o.x = cx + Math.cos(a) * (R + o.r); o.y = cy + Math.sin(a) * (R + o.r); } }
        for (const p of w.projectiles) if (p.life > 0 && !p.noHit && p.owner !== u && p.owner !== t) { const d = dist(p.x, p.y, cx, cy); if (Math.abs(d - R) < 14 + p.r) { p.life = 0; sparks(w, p.x, p.y, angleTo(cx, cy, p.x, p.y), 5, '#F2C14E', 1); } }
        if (!alive(t)) return true;
      });
    },
    hook: {
      struck(w, u, src) {
        if (!(u.kit.showUntil > w.time) || tierOf(u, 'showboat') < 3 || !src || !alive(src) || w.time - (u.kit.showHit || -9) < 0.2) return;
        if (dist(u.x, u.y, src.x, src.y) - u.r - src.r > 60) return;
        u.kit.showHit = w.time; u.facing = angleTo(u.x, u.y, src.x, src.y); setAnim(u, 'thrust', 0.2);
        hurt(w, src, dmgOf(u, 0.9), u, { knock: 120, noDodge: true, proc: true, ab: 'showboat' });
      },
    },
    show: { single: true },
  },
  // Shield Rush (round 13: "Make very long. Grab first target hit and drags them along with him. Slams at end of dash
  // that staggers"): a long rush behind the shield; the first one it meets is carried along on it and slammed down at the end
  shieldRush: {
    score(w, u, t) { if (!t) return 0; const g = dist(u.x, u.y, t.x, t.y) - u.r - t.r; return g > 30 && g < 300 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.6 : 0; },
    use(w, u, t, tier) {
      // round 18 (lane dash18): the drag and fling (dashes.js). He rocks back behind the shield and runs, slow off the mark
      // then flat out; the first one he meets is picked up on the shield (0.8x), carried to the end of the rush and
      // slammed off it (2.15x, it was 2x; staggered; III stunned), into a wall if there is one. II: the rest are knocked aside. The
      // length, the blows and the block are as they were. (He ran at one speed and the slam landed where he stopped.)
      if (!t) return; const a = ang(u, t), sp = u.def.speed * 2.1, T = 0.62, k1 = dmgOf(u, 1); u.facing = a;
      addBuff(u, { id: 'shieldRush', dur: T * 1.2 + 0.6, raise: true, frontBlock: 0.5, knockImmune: true });
      dash(w, u, 'dragFling', { a, len: sp * T, speed: sp, tell: 0.16, dmg: k1, grabK: 0.8, fling: dmgOf(u, 2.15), knock: 260, aside: 0, hit: { ab: 'shieldRush' }, flingHit: { stagger: 60 },
        brushed: (e, sd) => { if (tierOf(u, 'shieldRush') >= 2) { e.kx += Math.cos(a + sd * 1.2) * 260; e.ky += Math.sin(a + sd * 1.2) * 260; } },
        flung: (e) => { setAnim(u, 'ability', 0.3); k2(w, { draw: 'shoveAway', x: e.x, y: e.y, a, max: 0.4 }); if (tierOf(u, 'shieldRush') >= 3) stun(w, e, 1); puff(w, e.x, e.y, '#E9DDC2', 10, 110, 6, 0.45); } });
    },
    show: { far: true, single: true },
  },
  // ----- Jester (round 13: his trait flips round the ones that swing at him)
  // Swap, in Mock's slot (round 13: "Swap places with ally boosting them. Or with enemy confusing them."): a puff of
  // confetti and he trades places: with a friend in trouble (it is hasted and shielded), or else with an enemy (confused)
  mock: {
    score(w, u) { const a = inTrouble(w, u, 380, 0.45); if (a && opponents(w, u).some((e) => e.target === a)) return 0.85; const e = opponents(w, u).filter((o) => dist(u.x, u.y, o.x, o.y) < 320 && dist(u.x, u.y, o.x, o.y) > 100)[0]; return e ? 0.45 : 0; },
    use(w, u, t, tier) {
      const a = inTrouble(w, u, 400, 0.45), e = a ? null : opponents(w, u).filter((o) => dist(u.x, u.y, o.x, o.y) < 340 && dist(u.x, u.y, o.x, o.y) > 80 && !o.fixed && !o.def.boss).sort((p, q) => (q.def.role === 'ranged' ? 1 : 0) - (p.def.role === 'ranged' ? 1 : 0))[0];
      const o = a || e; if (!o) return; const x = u.x, y = u.y;
      k2(w, { draw: 'confetti', x: u.x, y: u.y, max: 0.6 }); k2(w, { draw: 'confetti', x: o.x, y: o.y, max: 0.6 });
      u.x = o.x; u.y = o.y; o.x = x; o.y = y; u.vx = u.vy = o.vx = o.vy = 0; setAnim(u, 'ability', 0.4);
      if (a) { haste(w, a, tier >= 2 ? 5 : 3.5, 1.3); ward(w, a, tier >= 2 ? 35 : 20, 5); }
      else { confuse(w, e, tier >= 2 ? 80 : 55, u); e.target = null; if (tier >= 3) stun(w, e, 1); }
    },
    show: { far: true, ally: true, allyFree: true },
  },
  // Befuddle (round 13: "Instead of taking damage will teleport behind target and kick them forwards confusing them."):
  // now it answers a blow: instead of taking it, he is behind whoever struck, and boots it forward, confused
  befuddle: {
    passiveTier: true, score: () => 0, use() {},
    hook: {
      evade(w, u, src, amt, o) {
        const k = u.kit; if (o.dot || o.shot || o.proc || !src || !alive(src) || src.fixed || (k.befReady || 0) > w.time || dist(u.x, u.y, src.x, src.y) > 160) return false;
        const tier = tierOf(u, 'befuddle'), cd = tier >= 3 ? 6 : tier >= 2 ? 8 : 10; k.befReady = w.time + cd; k.cd.befuddle = cd;
        k2(w, { draw: 'confetti', x: u.x, y: u.y, max: 0.5 });
        const b = src.facing + Math.PI; u.x = clamp(src.x + Math.cos(b) * (src.r + u.r + 4), u.r, w.W - u.r); u.y = clamp(src.y + Math.sin(b) * (src.r + u.r + 4), u.r, w.H - u.r); u.vx = u.vy = 0;
        u.facing = src.facing; setAnim(u, 'thrust', 0.25); k2(w, { draw: 'confetti', x: u.x, y: u.y, max: 0.5 });
        hurt(w, src, dmgOf(u, tier >= 3 ? 1.6 : 1), u, { knock: 480, kAngle: src.facing, noDodge: true, proc: true, ab: 'befuddle' }); confuse(w, src, 60, u);
        textU(w, src.x, src.y, src.r + 8, 'KICK', '#FFD45A', 1); return true;
      },
    },
    show: { hitme: true },
  },
  // Juggling Act (round 13: "Different particles effects. Should pierce and bounce a few times. Not from target to
  // target. Just off walls. Lvl 3 will teleport hit target to next wall the ball hits"): balls thrown straight, through
  // whatever they meet, bouncing off the walls (kit2Tick bounces them)
  juggle: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 260).length >= 2 ? 0.6 : foesNear(w, u, u.x, u.y, 200).length ? 0.35 : 0),
    use(w, u, t, tier) {
      setAnim(u, 'throw', 0.4); const n = tier >= 3 ? 4 : 3, a0 = t ? ang(u, t) : u.facing;
      const cols = ['#C8453D', '#FFD45A', '#5B8CDB', '#7FCB3A', '#E05AB8'];
      for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.35;
        w.projectiles.push({ kind: 'ball', x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * 540, vy: Math.sin(a) * 540, r: 8, team: u.team, owner: u, dmg: dmgOf(u, 1.1), o: { knock: 90, ab: 'juggle' }, life: 2.4, a, ab: 'juggle', tier, color: cols[i], pierce: 99, hitSet: new Set(), juggle: { left: 3, carry: null },
          onHit: (w2, p, h) => { if (tierOf(u, 'juggle') >= 2) addBuff(h, { id: 'dazed', dur: 2, move: 0.6 }); if (tierOf(u, 'juggle') >= 3 && !p.juggle.carry && !h.fixed && !h.def.boss) p.juggle.carry = h; } }); }
    },
    show: { far: true },
  },
  // ----- Samurai (round 13: his trait is Keen Edge: every blow takes a share of the target's health as well)
  // Iaido (round 13: "Done poorly. Instant teleport in a straight line towards enemies. Targets are staggered for a split
  // second then take 10% of their max hp in damage. Lvl 3 has them do it 2 times. Make look good. Charge up before
  // dash/teleport"): he settles, the blade half drawn (light gathering on it); then he is simply on the far side of
  // them, the line of the cut hanging in the air; a beat later every one it passed through takes the cut
  iaido: {
    score(w, u, t) { if (!t) return 0; const a = ang(u, t); return dist(u.x, u.y, t.x, t.y) < 280 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.45 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.35 && dist(u.x, u.y, e.x, e.y) < 300).length : 0; },
    use(w, u, t, tier) {
      // round 18 (lane dash18): the draw cut (dashes.js). He settles with the blade at his hip (the light gathering on it,
      // as before), bursts down the line with the blade swept out, and stops past them; each one the blade crossed is
      // staggered and carries a thin white line, and then the cut lands on each in turn: a tenth of its health and more,
      // as it was. III: he turns and cuts back through. What is cut is what the blade or his body really passed through.
      // (He was simply at the far end, and everything within reach of the line between was cut.)
      if (!t) return; const a0 = ang(u, t), base = dmgOf(u, 1); u.facing = a0;
      k2(w, { draw: 'iaidoCharge', unit: u, x: u.x, y: u.y, a: a0, max: 0.38 });
      const reachOf = (a) => { const far = opponents(w, u).filter((e) => segDist(e.x, e.y, u.x, u.y, u.x + Math.cos(a) * 280, u.y + Math.sin(a) * 280) < e.r + 16); return far.length ? Math.min(280, Math.max(...far.map((e) => dist(u.x, u.y, e.x, e.y))) + 60) : 160; };
      // (the cut back: the blade's sweep catches the ones the first cut threw off the line. The old line did not: measured,
      // the old cut back added nothing at all to what Iaido dealt. It lands at BACK of the first cut's weight, so III is
      // worth about a quarter more than it was and no longer double.)
      const BACK = 0.3, FIRST = 0.78; // (FIRST: the blade's sweep is wider than the old line was, so the cut is a little lighter)
      const cut = (a, tell, again, k = 1) => dash(w, u, 'drawCut', { a, len: reachOf(a), tell, hold: 0.28, recover: 0.14, settle: false, ghost: '#5E6B86',
        dmg: (e) => (e.maxHp * (e.def.boss ? 0.03 : 0.1) + base) * FIRST * k, hit: { crit: true, knock: 120, ab: 'iaido' },
        mark: (e) => { stun(w, e, 0.3); addStatus(w, e, 'stagger', 25, u); }, again });
      cut(a0, 0.36, tier >= 3 ? () => ({ a: u.facing + Math.PI, len: reachOf(u.facing + Math.PI), tell: 0.16, again: null, dmg: (e) => (e.maxHp * (e.def.boss ? 0.03 : 0.1) + base) * FIRST * BACK }) : null);
    },
    show: { far: true },
  },
  // Focus (round 13: "Don't like. When focusing will deflect 1 melee or ranged attack every 1 second. After a successful
  // block next attack will deal 40% more damage."): for a while his blade turns one blow or shot a second; each one
  // turned makes his next cut 40% harder
  focus: {
    score: (w, u) => (!(u.kit.focusUntil > w.time) && (opponents(w, u).filter((e) => e.target === u).length >= 2 || w.projectiles.some((p) => p.team !== u.team && !p.noHit && dist(p.x, p.y, u.x, u.y) < 260)) ? 0.65 : 0),
    use(w, u, t, tier) { cast(u, 'cast', 0.4); const dur = tier >= 3 ? 9 : tier >= 2 ? 7 : 5; u.kit.focusUntil = w.time + dur; u.kit.focusNext = 0; k2(w, { draw: 'focusGuard', unit: u, x: u.x, y: u.y, r: u.r, max: dur }); },
    hook: {
      evade(w, u, src, amt, o) { const k = u.kit; if (!(k.focusUntil > w.time) || (k.focusNext || 0) > w.time || o.dot || o.proc || o.shot) return false;
        k.focusNext = w.time + 1; k.focusBonus = true; u.facing = src ? angleTo(u.x, u.y, src.x, src.y) : u.facing; setAnim(u, 'swing', 0.2);
        k2(w, { draw: 'parry', x: u.x + Math.cos(u.facing) * (u.r + 8), y: u.y + Math.sin(u.facing) * (u.r + 8), a: u.facing, max: 0.35, ab: 'focus' }); return true; },
      dealt(w, u, t, amt, o) { const k = u.kit; if (!k.focusBonus || o.dot || o.proc || o.shot) return amt; k.focusBonus = false; o.crit = true; return amt * 1.4; },
    },
    show: { hitme: true, shootme: true, attacks: true },
  },
  // Crescent Cut (round 13: "Will dash towards target and deal a heavy slash to them 10% of max hp + 20 damage. lvl 3 If it
  // kills it will trigger again.")
  crescentCut: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return d < 300 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.5 + (t.elite || t.def.boss ? 0.2 : 0) : 0; },
    use(w, u, t, tier) {
      // round 18 (lane dash18): the feint (dashes.js). A step to one side with a shadow of him carrying on that way, a
      // planted foot, and the real cut back across the other flank: the same heavy slash (a tenth of its health and
      // more), landing as the blade crosses it. III: a kill and he goes again. (He flew straight at it and the slash
      // landed as he arrived.)
      const base = dmgOf(u, 1.6), stg = tier >= 2 ? 40 : 0; // (1.6x, it was 1.4x: the step and the cut back take a third of a second longer than the old leap did)
      const strike = (e, n) => {
        if (!e || !alive(e) || n > 4) return;
        dash(w, u, 'feint', { t: e, only: e, ghost: '#5E6B86', dmg: (x) => x.maxHp * (x.def.boss ? 0.03 : 0.1) + base, hit: { heavy: true, crit: true, knock: 200, stagger: stg, ab: 'crescentCut' },
          each: (x) => k2(w, { draw: 'crescentSlash', x: x.x, y: x.y, a: ang(u, x), r: x.vr + 18, max: 0.45 }),
          onEnd: () => { if (!alive(e) && tierOf(u, 'crescentCut') >= 3) { const nx = opponents(w, u).filter((o) => dist(o.x, o.y, u.x, u.y) < 260).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0]; if (nx) after(u, 0.1, () => { if (!u.act) strike(nx, n + 1); }); } } });
      };
      strike(t, 0);
    },
    show: { far: true, killDummy: false },
  },
  // ----- Valkyrie (round 13: "Is more of a support": her role; her trait heals her and her friends near)
  // Valkyrie's Call (round 13: "Flies to recently fallen ally, revives them and knocks all targets back and applies
  // radiance. Lvl 3 has her grab ally and flies them both to another safer position.")
  valkyrieCall: {
    score: (w, u) => (u.kit.callW !== w && w.units.some((a) => a.team === u.team && a.downed && !a.dead && !a.summon) ? 1 : 0),
    use(w, u, t, tier) {
      const d = w.units.filter((a) => a.team === u.team && a.downed && !a.dead && !a.summon).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0]; if (!d) return;
      u.kit.callW = w; cast(u, 'ability', 0.7); const a = angleTo(d.x, d.y, u.x, u.y), x1 = clamp(d.x + Math.cos(a) * (d.r + u.r), u.r, w.W - u.r), y1 = clamp(d.y + Math.sin(a) * (d.r + u.r), u.r, w.H - u.r);
      k2(w, { draw: 'wings', unit: u, x: u.x, y: u.y, r: u.r, max: 0.7, flap: true }); u.invulnT = Math.max(u.invulnT, 0.7);
      u.flyT = 0.55; // round 17 (lane tags17): flying on her saving leap
      u.act = { type: 'leap', t: 0.55, max: 0.55, x0: u.x, y0: u.y, x1, y1, land: () => {
        if (!d.downed || d.dead) return; cleanse(d); d.downed = false; d.reviveT = 0; d.hp = d.maxHp * (tier >= 2 ? 0.4 : 0.25); d.invulnT = 1.5; d.revivedByKit = true; d.revivedBy = u; d.revivedAb = 'valkyrieCall';
        fx(w, { type: 'pillar', x: d.x, y: d.y, r: 34, kind: 'holy', max: 0.6 }); w.shake = Math.max(w.shake, 5);
        k2(w, { draw: 'radiantBurst', x: u.x, y: u.y, r: 140, max: 0.6 });
        for (const e of foesNear(w, u, u.x, u.y, 140)) { hurt(w, e, dmgOf(u, 0.8), u, { knock: 380, kAngle: ang(u, e), noDodge: true, radiance: 40, ab: 'valkyrieCall' }); }
        k2(w, { draw: 'rally', unit: d, x: d.x, y: d.y, r: d.vr, max: 1, ab: 'valkyrieCall' });
        if (tier >= 3) after(u, 0.25, () => { if (!alive(u) || !alive(d)) return; const f = opponents(w, u); let ax = 0, ay = 0; for (const e of f) if (dist(e.x, e.y, u.x, u.y) < 320) { ax += u.x - e.x; ay += u.y - e.y; }
          const b = Math.hypot(ax, ay) > 1 ? Math.atan2(ay, ax) : a, sx = clamp(u.x + Math.cos(b) * 190, u.r, w.W - u.r), sy = clamp(u.y + Math.sin(b) * 190, u.r, w.H - u.r);
          k2(w, { draw: 'wings', unit: u, x: u.x, y: u.y, r: u.r, max: 0.6, flap: true }); u.kit.carry = d;
          u.flyT = 0.5; u.act = { type: 'leap', t: 0.5, max: 0.5, x0: u.x, y0: u.y, x1: sx, y1: sy, land: () => { u.kit.carry = null; } }; });
      } };
    },
    show: { ally: true, downed: true, allyFree: true },
  },
  // Spear of the Sky (round 13: "Dash from current position all the way to most hurt allies position hitting anyone in the
  // way. Cleanses ally and buffs them."): she flies spear-first along the line to the friend most hurt, striking every
  // enemy on the way, and cleanses and steels that friend (hasted, Warded)
  spearThrow: {
    // (round 16 fixes: as well as a friend under 60%, one being hit now under 80%, or one held or carrying a load of
    // statuses (the spear cleanses and shields it); she flies to that one)
    score: (w, u) => (spearFor(w, u) ? 0.75 : 0),
    use(w, u, t, tier) {
      const a = spearFor(w, u) || inTrouble(w, u, 440, 0.7) || hurtMost(allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 440)); if (!a) return;
      // round 18 (lane dash18): the draw cut with a spear (dashes.js): she draws the spear back, bursts down the line to
      // her friend behind its point and stops beside them (cleansed and steeled on the spot, as before); each enemy the
      // point went through carries a mark, and the wounds burst open down the line a beat after.
      // (She flew the line as a leap, and everything within reach of it was struck when she landed.)
      const b = ang(u, a), L = Math.max(20, dist(u.x, u.y, a.x, a.y) - a.r - u.r); u.facing = b;
      dash(w, u, 'drawCut', { a: b, len: L, lance: true, tell: 0.14, burst: clamp(L / 2200, 0.1, 0.2), hold: 0.16, recover: 0.16, ghost: '#E8D49A', col: ['#FFE7A0', '#FFFBEA'], dmg: dmgOf(u, 1.0), hit: { knock: 220, shock: tier >= 2 ? 30 : 0, ab: 'spearThrow' }, // (1.0x, it was 1.5x: the spear's point now strikes what it really passes, which is more than the old line caught)
        arrive: () => { if (alive(a)) { cleanse(a); haste(w, a, 4, 1.3); ward(w, a, tier >= 3 ? 45 : 28, 5); k2(w, { draw: 'rally', unit: a, x: a.x, y: a.y, r: a.vr, max: 0.9 }); } } });
      u.invulnT = Math.max(u.invulnT, 0.4);
    },
    show: { ally: true, mob: 'ally' },
  },
  // Sky Dive (round 13: "Flies in air for a moment then lands by ally. Applied radiance."): up on her wings for a moment,
  // then down beside the friend most beset, a burst of light that makes the enemies round radiant
  skyDive: {
    score: (w, u) => { const a = [u, ...allies(w, u)].filter((o) => !o.summon && opponents(w, u).filter((e) => e.target === o && dist(e.x, e.y, o.x, o.y) < 120).length >= 2); return a.length ? 0.7 : 0; },
    use(w, u, t, tier) {
      const a = [u, ...allies(w, u)].filter((o) => !o.summon && !o.def.cargo).sort((p, q) => opponents(w, u).filter((e) => e.target === q).length - opponents(w, u).filter((e) => e.target === p).length)[0] || u;
      const f = foesNear(w, u, a.x, a.y, 140)[0], b = f ? angleTo(a.x, a.y, f.x, f.y) : 0, x1 = clamp(a.x + Math.cos(b) * (a.r + u.r), u.r, w.W - u.r), y1 = clamp(a.y + Math.sin(b) * (a.r + u.r), u.r, w.H - u.r);
      cast(u, 'ability', 0.9); k2(w, { draw: 'wings', unit: u, x: u.x, y: u.y, r: u.r, max: 0.95, flap: true }); u.invulnT = Math.max(u.invulnT, 0.9);
      u.act = { type: 'ride', t: 0.95, max: 0.95 }; u.flyT = 0.85; const x0 = u.x, y0 = u.y, t0 = w.time; // (round 17: flying, up on her wings)
      timer(u, 'skyDive', 0.9, () => { const k = (w.time - t0) / 0.9; u.hop = Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * 80 * (k < 0.75 ? 1 : (1 - k) / 0.25); const q = clamp((k - 0.3) / 0.7, 0, 1); u.x = x0 + (x1 - x0) * q; u.y = y0 + (y1 - y0) * q; u.vx = u.vy = 0; },
        () => { u.hop = 0; if (u.act && u.act.type === 'ride') u.act = null; w.shake = Math.max(w.shake, 7);
          k2(w, { draw: 'radiantBurst', x: u.x, y: u.y, r: 110, max: 0.6 });
          for (const e of foesNear(w, u, u.x, u.y, 110)) hurt(w, e, dmgOf(u, 1.6), u, { knock: 240, kAngle: ang(u, e), noDodge: true, radiance: 35, stagger: tier >= 2 ? 45 : 0, ab: 'skyDive' });
          if (tier >= 3) heal(w, u, u.maxHp * 0.15, u); });
    },
    show: { ally: true, mob: 'ally', secs: 4 },
  },
  // ----- Engineer (round 13: her trait is Overclock: with all her abilities spent, one comes back faster)
  // Deploy Turret (round 13: "Make summoning better. Should throw them into their spot. Turrets should shoot in rapid
  // bursts of 5. Make barrel swap... to look like it's spinning. They should turn slowly. Should summon them in random
  // positions."): each turret thrown on an arc to a spot round her; they turn slowly and fire bursts of five
  deployTurret: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 380).length >= 2 && !mine(w, u, 'turret').length ? 0.75 : 0),
    use(w, u, t, tier) {
      cast(u, 'throw', 0.5); const n = tier >= 3 ? 2 : 1;
      for (let i = 0; i < n; i++) { const a = rand() * TAU, d = rrange(60, 130), x = clamp(u.x + Math.cos(a) * d, 30, w.W - 30), y = clamp(u.y + Math.sin(a) * d, 30, w.H - 30);
        after(u, i * 0.15, () => lob(w, u, x, y, 'turretFly', null, () => {
          const s2 = summon(w, u, 'turret', x, y, { life: tier >= 2 ? 16 : 10, hit: 0.35 }); s2.fixed = true; s2.facing = t ? angleTo(x, y, t.x, t.y) : a; s2.baseA = s2.facing; s2.mvA = s2.facing;
          if (tier >= 2) s2.atkMul = 1.3; puff(w, x, y, '#C9D2DE', 10, 90, 5, 0.4); w.shake = Math.max(w.shake, 2); k2(w, { draw: 'turretTop', unit: s2, x, y, max: 1e9 }); })); }
    },
    show: { secs: 4 },
  },
  // Tinker (round 13: "Nope. Makes 1 of 4 special towers: a torcher (tanky turret with a fire laser on the front, turns very
  // slowly, tanky from the front, very weak from behind), a tesla (zaps with chain lightning), snow ball mortar, or a
  // medbay (spawns healing wobbly drones that home in on allies and heal them)"): she bolts one together on the spot:
  // the medbay if friends are hurt, else one of the other three
  tinker: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 360).length >= 1 && !w.units.some((o) => o.summonBy === u && TOWERS.includes(o.kind) && alive(o)) ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'swing', 0.5); const hurtN = [u, ...allies(w, u)].filter((o) => !o.summon && hpRatio(o) < 0.6).length;
      const kind = hurtN >= 1 && rand() < 0.6 ? 'medbay' : ['torcher', 'tesla', 'snowMortar'][Math.floor(rand() * 3)];
      const a = t ? ang(u, t) : u.facing, x = clamp(u.x + Math.cos(a) * 50, 30, w.W - 30), y = clamp(u.y + Math.sin(a) * 50, 30, w.H - 30);
      const s2 = summon(w, u, kind, x, y, { life: tier >= 2 ? 12 : 9, hp: kind === 'torcher' ? 140 : 70, hit: kind === 'torcher' ? 0.35 : kind === 'tesla' ? 0.7 : kind === 'snowMortar' ? 0.9 : 0 });
      s2.fixed = true; s2.facing = a; s2.tier = tier; k2(w, { draw: 'buildSparks', x, y, max: 0.6 }); puff(w, x, y, '#C9D2DE', 10, 90, 5, 0.4);
      if (kind === 'torcher') onUnit(w, s2, 'armorFront', 99, { taken: (w2, u2, src, amt, o) => (src && angleDiff(angleTo(u2.x, u2.y, src.x, src.y), u2.facing) < 1.2 ? amt * 0.35 : amt * 1.8) });
    },
    show: { secs: 4 },
  },
  // Wind-up Drones, in Shock Mine's slot (round 13: "Spawn 4 small wind up drones that walk towards target and go pop,
  // shocking a bit. He throws them in random directions around himself. Are slow."); id kept
  shockMine: {
    // (round 16 fixes: the drones only waddle, so they are thrown when a fighter is coming at her (they pop in its way)
    // or at foes standing still near her (held, or planted in a fight); it went at any foe within 300, fast or far)
    score(w, u) {
      if (mine(w, u, 'windup').length >= 2) return 0;
      const n = opponents(w, u).filter((e) => closing(u, e, 220) || (dist(u.x, u.y, e.x, e.y) < 200 && (e.rootT > 0 || e.stunT > 0 || e.frozenT > 0 || e.sleepT > 0 || (e.spd || 0) < 12))).length;
      return n ? 0.55 + 0.1 * (n - 1) : 0;
    },
    use(w, u, t, tier) {
      setAnim(u, 'throw', 0.35); const n = tier >= 3 ? 6 : 4;
      for (let i = 0; i < n; i++) { const a = rand() * TAU, d = rrange(40, 90), x = clamp(u.x + Math.cos(a) * d, 20, w.W - 20), y = clamp(u.y + Math.sin(a) * d, 20, w.H - 20);
        after(u, i * 0.06, () => lob(w, u, x, y, 'droneFly', null, () => { const s2 = summon(w, u, 'windup', x, y, { life: 9, hit: 1 }); s2.fixed = true; s2.tier = tier; s2.facing = a; })); }
    },
    show: { far: false, secs: 4 },
  },
  // ----- Werewolf (round 13: his trait brings him back as a man when the wolf falls)
  // Turn (round 13: "Make 15% bigger. Can't heal when in this form.")
  turnWolf: {
    score: (w, u) => (!u.kit.wolfUntil && foesNear(w, u, u.x, u.y, 260).length >= 2 ? 0.8 : 0),
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 14 : 10, human = u.def, beast = WOLF_FORM(u);
      if (!beast) return;
      u.kit.wolfUntil = w.time + dur; u.kit.human = human; u.def = beast; setAnim(u, 'ability', 0.5); w.shake = Math.max(w.shake, 4);
      u.kit.size = { r: u.r, vr: u.vr }; u.r *= 1.15; u.vr *= 1.15; u.kit.wolfHp = u.hp;
      k2(w, { draw: 'roar', unit: u, x: u.x, y: u.y, r: 120, max: 0.6 }); puff(w, u.x, u.y, '#6E6A6A', 16, 130, 7, 0.6);
      timer(u, 'turnWolf', dur, null, () => wolfBack(w, u));
    },
    hook: { hit(w, u, t, amt, o) { if (u.kit.wolfUntil > w.time && tierOf(u, 'turnWolf') >= 3 && !o.dot && !o.proc) bleed(w, t, 14, u); } },
  },
  // Frenzy (round 13: "Each successful hit comes out faster than the last. As ware wolf. As human each hit heals more the
  // lower his hp. Is always active."): always on once bought
  frenzy: {
    passiveTier: true, score: () => 0, use() {},
    hook: {
      hit(w, u, t, amt, o) {
        if (o.dot || o.proc || o.shot) return; const f = u.kit.frenzy || (u.kit.frenzy = { n: 0, last: -9, howled: false });
        if (u.kit.wolfUntil > w.time) {
          if (w.time - f.last > 1.5) { f.n = 0; f.howled = false; } f.last = w.time; f.n = Math.min(6, f.n + 1);
          if (f.n >= 6 && !f.howled && tierOf(u, 'frenzy') >= 3) { f.howled = true; for (const e of foesNear(w, u, u.x, u.y, 160)) addStatus(w, e, 'stagger', 60, u); k2(w, { draw: 'roar', unit: u, x: u.x, y: u.y, r: 160, max: 0.6, ab: 'frenzy' }); }
        } else heal(w, u, u.maxHp * (tierOf(u, 'frenzy') >= 2 ? 0.045 : 0.03) * (1 - hpRatio(u)) * 2, u);
      },
      atkSpeed: (u) => { const f = u.kit && u.kit.frenzy; return f && u.kit.wolfUntil > (u._wt || 0) && (u._wt || 0) - f.last < 1.5 ? 1 + 0.1 * f.n : 1; },
      tick(w, u) { u._wt = w.time; },
    },
    show: { attacks: true, single: true },
  },
  // Pounce (round 13: "As human does a forwards dash with a cleave at the end. As werewolf does a leap and gives self
  // haste.")
  pounce: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return u.kit.wolfUntil > w.time ? (d > 110 && d < 340 && !t.def.boss ? 0.6 : 0) : d < 200 ? 0.55 : 0; },
    use(w, u, t, tier) {
      if (!t) return;
      if (u.kit.wolfUntil > w.time) {
        // round 18 (lane dash18): the pounce (dashes.js): a crouch with a wriggle, a leap that hangs, and he comes down
        // on it claws first: the same blow, pin and haste (III: he bites it while it is down). (It was a plain arc.)
        cast(u, 'ability', 0.3);
        dash(w, u, 'pounce', { t, only: t, close: 0.7, tell: 0.16, inv: true, dmg: dmgOf(u, 1.6), hit: { heavy: true, knock: 0, ab: 'pounce' }, col: ['#DCE3EC', '#FFFFFF'],
          land: (list) => { haste(w, u, 4, 1.35); if (!alive(t) || !list.includes(t)) return; const d = (tier >= 2 ? 1.6 : 1) * (t.def.boss ? 0.4 : 1);
            stun(w, t, d); interrupt(w, t); k2(w, { draw: 'bonk', x: t.x, y: t.y, unit: t, r: t.vr, max: d });
            if (tier >= 3) for (let i = 1; i <= 4; i++) after(u, i * d / 5, () => { if (alive(t)) { setAnim(u, 'swing', 0.15); hurt(w, t, dmgOf(u, 0.5), u, { noDodge: true, knock: 0, ab: 'pounce' }); } }); } });
        u.invulnT = Math.max(u.invulnT, 0.4); return;
      }
      // a man: round 18 (lane dash18): the hook (dashes.js): he runs round its side, banked into the turn, and the wide
      // cleave is swung as he comes round behind it: the same blow on everything the blade sweeps through. (It was a
      // straight dash to its front and a cleave over everything before him.)
      const k1 = dmgOf(u, 1.6), hit = { knock: 260, stagger: tier >= 2 ? 40 : 0, ab: 'pounce' };
      if (dash(w, u, 'hook', { t, tell: 0.12, dmg: k1, hit, recover: 0.2 })) return;
      // (walled in: the cleave where he stands)
      u.facing = ang(u, t); setAnim(u, 'swing', 0.3); swingMark(w, u, u.r + u.def.range + 30, 2.6);
      for (const e of foesNear(w, u, u.x, u.y, u.r + u.def.range + 34)) if (inFront(u, e, 2.7)) hurt(w, e, k1, u, { noDodge: true, ...hit, kAngle: ang(u, e) });
    },
    show: { far: true, single: true },
  },
};
// the Werewolf's other shape (units.js builds it from heroes2.js form and hangs it on the hero's def)
const WOLF_FORM = (u) => u.def.formDef || null;
// a bomb's blast at x, y: radius r, damage k x his own, extra hit options; drawn as the kit's blast
function blast(w, u, x, y, r, k, o, ab, under) {
  // round 13 (the Grenadier: "Not fire themed"): a grey burst of smoke and iron, not a fire blast; under: drawn on the
  // floor beneath (Blast Off: "Explosion effect should happen underneath him")
  if (under) k2(w, { draw: 'groundBlast', x, y, r, max: 0.55 }); else k2(w, { draw: 'smokeBlast', x, y, r, max: 0.6, ab });
  for (const e of foesNear(w, u, x, y, r)) hurt(w, e, dmgOf(u, k), u, { knock: 260, kAngle: angleTo(x, y, e.x, e.y), heavy: true, noDodge: true, blast: true, ...o, ab });
  w.shake = Math.max(w.shake, r > 90 ? 8 : 4);
}
// a lobbed thing (no hit on the way; it lands where it was thrown): kind, colour, land(x, y)
// Round 19 (lane sys19, the designer: "The bread doesn't come or land directly in the center of entities", the Elixir
// "Thrown to bottom left corner. Not center of entity"): it leaves from the thrower's edge and flies only the rest of
// the way (it went the whole distance from the edge, so it came down a body's width past the spot), and a lob thrown at a
// unit (opts.at, or the unit standing exactly on x, y: what every `lob(w, u, a.x, a.y, ...)` means) follows it and lands
// on its middle wherever it has got to (sim.js projectiles, p.lobTo); land then gets where it landed. Its arc and its one
// shadow: height.js projZ, render.js drawShadows.
function lob(w, u, x, y, kind, color, land, opts) {
  const to = (opts && opts.at) || w.units.find((o) => o.x === x && o.y === y && !o.dead) || null;
  const d0 = Math.max(30, dist(u.x, u.y, x, y)), a = angleTo(u.x, u.y, x, y), sp = Math.max(260, d0 * 1.6), s0 = Math.min(u.r, d0 * 0.4), d = d0 - s0;
  const p = { kind, x: u.x + Math.cos(a) * s0, y: u.y + Math.sin(a) * s0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 6, team: u.team, owner: u, dmg: 0, o: {}, life: d / sp, life0: d / sp, a, noHit: true, color,
    lob: {}, lobTo: to, lobV: sp, land: (q) => (to && q ? land(q.x, q.y) : land(x, y)) }; // (life0 and lob: height.js projZ arcs it)
  w.projectiles.push(p);
  return p;
}

// The Shade's shadow: unseen (nobody's target: ethereal) and dark, until she strikes (the Fade trait), or for `dur`
function shadowForm(w, u, dur) {
  if (!alive(u)) return; const k = u.kit; k.shadow = { until: dur ? w.time + dur : 0, anim: u.anim, t0: w.time };
  u.ethereal = true; addBuff(u, { id: 'shadowForm', dur: dur || 60, wash: ['#140E1E', 0.72] }); k2(w, { draw: 'poof', x: u.x, y: u.y, r: 18, col: '#5A4A7A', max: 0.5 });
  puff(w, u.x, u.y, '#2E2440', 12, 80, 7, 0.5);
}
function leaveShadow(w, u) { const k = u.kit; if (!k || !k.shadow) return; k.shadow = null; u.ethereal = false; u.buffs = u.buffs.filter((b) => b.id !== 'shadowForm'); puff(w, u.x, u.y, '#2E2440', 10, 90, 6, 0.45); k.lastHurt = w.time; }
// Round 19 (lane rogue19): her Blackout form, worn by her and her shadow clones: dark (this wash), incorporeal (sim.js),
// smoke curling off it (fx-rogue19.js 'incorpOn', look 'shadow')
const SHADE_FORM = { wash: ['#140E1E', 0.62] };
// Shadow Walk (round 19): gone, then in and out of being beside a random enemy, stabbing, gone again
const SWALK = { dur: [4, 5, 6], first: 0.3, every: 0.55, out: 0.26, reach: 300, stab: 0.7 };
function vanish(w, u, S) {
  S.out = false; S.next = w.time + SWALK.every - SWALK.out; u.hidden = true; u.ethereal = true; u.invulnT = Math.max(u.invulnT, 0.3);
  k2(w, { draw: 'shadowBlink', x: u.x, y: u.y, r: u.vr + 8, max: 0.45, out: true });
}
function blinkIn(w, u, S) {
  const from = S.last && alive(S.last) ? S.last : u;
  const pool = opponents(w, u).filter((e) => dist(from.x, from.y, e.x, e.y) < SWALK.reach && !e.def.part);
  if (!pool.length) return false;
  const e = pool[Math.floor(rand() * pool.length)], side = rand() * TAU;
  let x = e.x + Math.cos(side) * (e.r + u.r + 2), y = e.y + Math.sin(side) * (e.r + u.r + 2);
  x = clamp(x, u.r, w.W - u.r); y = clamp(y, u.r, w.H - u.r); if (w.walls.some((q) => circleRect(x, y, u.r * 0.8, q))) { x = e.x; y = e.y; }
  u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.facing = u.mvA = angleTo(x, y, e.x, e.y); S.last = e; S.n++;
  appear(w, u, S, false);
  const a = u.facing; setAnim(u, 'thrust', 0.12);
  hurt(w, e, dmgOf(u, SWALK.stab), u, { knock: 60, kAngle: a, noDodge: true, ab: 'shadowWalk' });
  after(u, 0.09, () => { if (alive(e) && u.kit.swalk === S) { setAnim(u, 'thrust', 0.12); hurt(w, e, dmgOf(u, SWALK.stab), u, { knock: 60, kAngle: a, noDodge: true, ab: 'shadowWalk' }); k2(w, { draw: 'dashHit', x: e.x, y: e.y, a: a - 0.6, r: e.vr, max: 0.3, col: ['#9B86C9', '#F4EEFF'] }); } });
  k2(w, { draw: 'dashHit', x: e.x, y: e.y, a: a + 0.6, r: e.vr, max: 0.3, col: ['#9B86C9', '#F4EEFF'] });
  return true;
}
function appear(w, u, S, last) {
  // (out between blinks: drawn solid in her shadow form, a dark wash, and incorporeal: a spell can catch her, a blade can't;
  // ethereal would draw her pale and see-through, a ghost's look)
  S.out = true; S.outUntil = w.time + SWALK.out; u.hidden = false; u.ethereal = !!(u.kit && u.kit.shadow);
  if (!last) { incorporeal(w, u, SWALK.out + 0.05, 'shadow'); addBuff(u, { id: 'blackoutForm', dur: SWALK.out + 0.1, wash: SHADE_FORM.wash }); }
  k2(w, { draw: 'shadowBlink', x: u.x, y: u.y, r: u.vr + 8, max: 0.4 });
  if (last && S.last && alive(S.last)) u.facing = angleTo(u.x, u.y, S.last.x, S.last.y);
}
// A shadow clone (Death Mark; round 19: it moves and fights as she does, the plain fighters' brain, and wears her
// Blackout form: incorporeal, dark). Its old brain (round 13: round its foe fast, straight through bodies, walls and
// pillars, stabbing as it passed the front) is kept below, on no kind.
export function shadowCloneBrain(w, u, dt) {
  let t = u.target; if (!t || !alive(t) || t.ethereal) t = u.target = opponents(w, u).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0] || null;
  if (!t) return true;
  u.orbit = (u.orbit || 0) + dt * 3.4 * (u.spinDir || 1); if (rand() < dt * 0.6) u.spinDir = -(u.spinDir || 1);
  const R = t.r + u.r + 10, gx = t.x + Math.cos(u.orbit) * R, gy = t.y + Math.sin(u.orbit) * R, d = dist(u.x, u.y, gx, gy), sp = u.def.speed * 1.6 * dt;
  const a = angleTo(u.x, u.y, gx, gy); u.x += Math.cos(a) * Math.min(d, sp); u.y += Math.sin(a) * Math.min(d, sp);
  u.x = clamp(u.x, u.r, w.W - u.r); u.y = clamp(u.y, u.r, w.H - u.r); u.spd = Math.min(d, sp) / Math.max(dt, 1e-3); u.mvA = a;
  u.facing = angleTo(u.x, u.y, t.x, t.y);
  if (u.atkT <= 0 && dist(u.x, u.y, t.x, t.y) - u.r - t.r < u.def.range + 6) { meleeSwing(w, u, true); setAnim(u, 'thrust', 0.2); u.atkT = u.def.atkCd; }
  if (Math.random() < dt * 8) w.particles.push({ x: u.x - Math.cos(a) * u.r, y: u.y - Math.sin(a) * u.r, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 6, color: 'rgba(46,36,64,0.6)' });
  return true;
}
// The Haymaker's hay bale: rolls on its heading, turning slowly at the nearest enemy, straight round off anything hard;
// it carries him on top; whoever it rolls over is hit hard and thrown aside (each one once every 0.6 s)
BRAINS.haybale = function (w, b, dt) {
  const u = b.rider;
  b.hp -= (b.decay || 10) * dt; if (b.hp <= 0) { kill(w, b, null); return true; }
  if (!u || !alive(u)) { kill(w, b, null); return true; }
  const e = opponents(w, b).sort((p, q) => dist(b.x, b.y, p.x, p.y) - dist(b.x, b.y, q.x, q.y))[0];
  if (e) { const want = angleTo(b.x, b.y, e.x, e.y), d = Math.atan2(Math.sin(want - b.head), Math.cos(want - b.head)); b.head += clamp(d, -1.3 * dt, 1.3 * dt); }
  const sp = b.def.speed, nx = b.x + Math.cos(b.head) * (b.r + 6), ny = b.y + Math.sin(b.head) * (b.r + 6);
  if (nx < 6 || ny < 6 || nx > w.W - 6 || ny > w.H - 6 || w.walls.some((r) => circleRect(nx, ny, 4, r)) || w.pillars.some((p) => dist(nx, ny, p.x, p.y) < p.r + 4)) { b.head += Math.PI; puff(w, nx, ny, '#E8C860', 8, 90, 5, 0.4); b.flipT = w.time; }
  b.dvx = Math.cos(b.head) * sp; b.dvy = Math.sin(b.head) * sp; b.facing = b.head; b.mvA = b.head; b.spd = sp; b.roll = (b.roll || 0) + sp * dt;
  for (const o of opponents(w, b)) if (dist(b.x, b.y, o.x, o.y) < b.r + o.r + 4 && w.time - (b.hitAt.get(o) || -9) > 0.6) {
    b.hitAt.set(o, w.time); const side = Math.sin(angleTo(b.x, b.y, o.x, o.y) - b.head) > 0 ? 1 : -1;
    hurt(w, o, dmgOf(u, 1.5), u, { knock: 520, kAngle: b.head + side * 0.9, heavy: true, noDodge: true, stagger: b.tier >= 3 ? 40 : 0, ab: 'forkCharge' });
    w.shake = Math.max(w.shake, 3);
  }
  u.x = b.x - 0.6; u.y = b.y + 0.6; u.vx = u.vy = u.kx = u.ky = 0; u.facing = b.head; // (a hair nearer the viewer than the bale: drawn on top of it) u.hop = 22 + Math.abs(Math.sin(b.roll * 0.05)) * 4;
  return true;
};
// the bale gone (run down, burnt, broken): it bursts into hay that slows those round it, and he drops to the floor
function baleBurst(w, u, b) {
  u.kit.bale = null; if (u.act && u.act.type === 'ride') u.act = null; u.hop = 0;
  k2(w, { draw: 'spray', x: b.x, y: b.y, a: 0, arc: TAU, r: 120, max: 0.7, cols: ['#E8C860', '#F2DC8A', '#C9A040'] });
  for (const e of opponents(w, u)) if (dist(e.x, e.y, b.x, b.y) < 120) { addBuff(e, { id: 'hay', dur: 3, move: 0.6 }); k2(w, { draw: 'hayOn', unit: e, x: e.x, y: e.y, r: e.vr, max: 3 }); }
  puff(w, b.x, b.y, '#E8C860', 18, 160, 7, 0.6);
}
// Burrow (the Digger, and anyone else who goes underground: round 13 "It will be used by more than just him"): under
// the floor from where u is to (x1, y1) in T s, a lingering trail of churned earth behind (fx2 'burrowTrail', merged
// earth bodies that fade slowly); surface(u) when he comes up, in a spray of earth (no ring)
export function burrowTo(w, u, x1, y1, T, surface) {
  puff(w, u.x, u.y, '#9C7650', 12, 100, 6, 0.5);
  u.hidden = true; u.ethereal = true; u.invulnT = Math.max(u.invulnT, T + 0.1);
  k2(w, { draw: 'burrowTrail', unit: u, x: u.x, y: u.y, max: T + 2.6, pts: [], T });
  k2(w, { draw: 'erupt', x: u.x, y: u.y, r: 40, max: 0.55 });
  u.act = { type: 'leap', t: T, max: T, x0: u.x, y0: u.y, x1, y1, under: true, land: () => {
    u.hidden = false; u.ethereal = false; u.hop = 0;
    k2(w, { draw: 'erupt', x: u.x, y: u.y, r: 70, max: 0.7, big: true }); w.shake = Math.max(w.shake, 6);
    if (surface) surface(u);
  } };
}
// the Alchemist's brews: six pools (Brew Pools), three elixirs, their monstrous form
const POOLS = ['acid', 'cold', 'fire', 'whirl', 'shock', 'water'];
const POOL_COL = { acid: '#C8E63C', cold: '#9FDDF6', fire: '#FF8A3D', whirl: '#EEF3F8', shock: '#FFE66B', water: '#5DB7E0' };
const ELIXIR_COL = { rage: '#FF5A3D', mend: '#9BE07A', ward: '#9FE0FF' };
const ANY_STATUS = ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger', 'curse', 'bleed', 'confuse', 'sleepy', 'fear', 'radiance'];
function brewPool(w, u, x, y, r, dur, kind) {
  k2(w, { draw: 'brewPool', x, y, r, kind, max: dur, ab: 'acidFlask' });
  if (kind === 'fire') w.hazards.push({ type: 'fire', x, y, r: r * 0.85, t: dur, max: dur });
  else if (kind === 'water') w.hazards.push({ type: 'water', x, y, r: r * 0.85, t: dur, max: dur });
  let acc = 0;
  timer(u, 'pool' + Math.round(x * 3 + y * 7), dur, (dt) => { acc += dt; if (acc < 0.3) return; acc -= 0.3;
    for (const e of foesNear(w, u, x, y, r)) {
      if (kind === 'acid') { hurt(w, e, dmgOf(u, 0.32), u, { dot: true, color: '#C8E63C', ab: 'acidFlask' }); addBuff(e, { id: 'acid', dur: 0.4, taken: 1.15 }); }
      else if (kind === 'cold') { addStatus(w, e, 'chill', 13, u); hurt(w, e, dmgOf(u, 0.12), u, { dot: true, color: '#9FDDF6', ab: 'acidFlask' }); }
      else if (kind === 'fire') hurt(w, e, dmgOf(u, 0.15), u, { dot: true, color: '#FF8A3D', ab: 'acidFlask' });
      else if (kind === 'whirl') { whirl(w, e, 14, u); shove(e, angleTo(x, y, e.x, e.y) + 1.4, 90); }
      else if (kind === 'shock') { addStatus(w, e, 'shock', 11, u); hurt(w, e, dmgOf(u, 0.12), u, { dot: true, color: '#FFE66B', ab: 'acidFlask' }); }
      else if (kind === 'water') { addStatus(w, e, 'wet', 10, u); hurt(w, e, dmgOf(u, 0.12), u, { dot: true, color: '#5DB7E0', ab: 'acidFlask' }); }
    } });
}
function elixirFor(w, u) {
  const list = [u, ...allies(w, u)].filter((o) => !o.summon && !o.def.cargo && dist(u.x, u.y, o.x, o.y) < 380 && !o.buffs.some((b) => b.id === 'haste' || b.id === 'warded'));
  const need = (o) => (1 - hpRatio(o)) + (o.target ? 0.3 : 0) + (opponents(w, u).filter((e) => e.target === o).length * 0.15) + ((o.st.burn + o.st.poison + (o.st.bleed || 0) + (o.st.curse || 0)) > 40 ? 0.4 : 0);
  const a = list.sort((p, q) => need(q) - need(p))[0];
  return a && need(a) > 0.45 ? a : null;
}
function elixirKind(w, u, a) {
  const bad = (a.st.burn + a.st.poison + (a.st.bleed || 0) + (a.st.curse || 0) + (a.st.chill || 0)) > 40 || a.sickT > 0;
  if (bad || hpRatio(a) < 0.45) return 'mend';
  if (opponents(w, u).filter((e) => e.target === a && dist(e.x, e.y, a.x, a.y) < 200).length >= 2) return rand() < 0.75 ? 'ward' : 'rage';
  return rand() < 0.75 ? 'rage' : 'ward';
}
function monsterEnd(w, u) {
  const M = u.kit.monster; if (!M) return;
  u.def = M.human; u.r = M.r; u.vr = M.vr; u.mass = M.mass; u.kit.monster = null;
  u.buffs = u.buffs.filter((b) => b.id !== 'monster'); puff(w, u.x, u.y, '#9BE36B', 12, 100, 6, 0.5); setAnim(u, 'ability', 0.4);
}
// The Shaman's totem: blows on friends within its reach go to it instead (a hook it hangs on them while they are in
// reach); it mends them a little; III cleans their statuses off every 1.5 s
BRAINS.totem = function (w, s2, dt) {
  const u = s2.summonBy; s2.vx = s2.vy = s2.kx = s2.ky = 0;
  s2.acc = (s2.acc || 0) + dt; s2.cl = (s2.cl || 0) + dt;
  for (const a of w.units) {
    if (a === s2 || !alive(a) || a.team !== s2.team || a.ethereal || dist(a.x, a.y, s2.x, s2.y) > s2.R + a.r) continue;
    onUnit(w, a, 'totemCover', 0.15, { taken(w2, u2, src, amt, o) { if (!alive(s2) || o.redirected || o.dot) return amt; hurt(w2, s2, amt, src, { noDodge: true, redirected: true, knock: 0 }); k2(w2, { draw: 'totemTake', x: u2.x, y: u2.y, from: s2, max: 0.3 }); return 0; } });
    if (s2.acc >= 0.5 && !a.summon) heal(w, a, a.maxHp * 0.008, u);
    if (s2.tier >= 3 && s2.cl >= 1.5 && !a.summon) { const bad = (a.st.burn + a.st.poison + a.st.chill + (a.st.curse || 0) + (a.st.bleed || 0) + (a.st.stagger || 0)) > 20; if (bad) { cleanse(a); k2(w, { draw: 'splash', x: a.x, y: a.y, r: 26, col: '#7FE0D0', max: 0.5 }); } }
  }
  if (s2.acc >= 0.5) s2.acc = 0; if (s2.cl >= 1.5) s2.cl = 0;
  return true;
};
// the spirit eagle: flies over the friend most hurt (straight over everything) and mends it
BRAINS.spiritEagle = function (w, s2, dt) {
  const al = w.units.filter((a) => alive(a) && a.team === s2.team && !a.summon && !a.ethereal && !a.def.cargo);
  const a = al.sort((p, q) => hpRatio(p) - hpRatio(q))[0]; s2.orbit = (s2.orbit || 0) + dt * 2.5;
  if (a) { const gx = a.x + Math.cos(s2.orbit) * 34, gy = a.y + Math.sin(s2.orbit) * 22, d = dist(s2.x, s2.y, gx, gy), sp = 320 * dt, b = angleTo(s2.x, s2.y, gx, gy);
    s2.x += Math.cos(b) * Math.min(d, sp); s2.y += Math.sin(b) * Math.min(d, sp); s2.facing = b;
    s2.acc = (s2.acc || 0) + dt; if (s2.acc >= 0.6 && dist(s2.x, s2.y, a.x, a.y) < 90) { s2.acc = 0; heal(w, a, a.maxHp * 0.02 * (s2.spiritK || 1), s2.summonBy); a.mendGlow = w.time + 0.3; } }
  s2.hop = 30;
  return true;
};
// the spirit beaver: sits by the Shaman; every 2 s it spins and shoots three homing spirit orbs
BRAINS.spiritBeaver = function (w, s2, dt) {
  const u = s2.summonBy; if (u && alive(u) && dist(s2.x, s2.y, u.x, u.y) > 70) { const b = angleTo(s2.x, s2.y, u.x, u.y); s2.x += Math.cos(b) * 140 * dt; s2.y += Math.sin(b) * 140 * dt; s2.facing = b; }
  s2.acc = (s2.acc || 0) + dt; const foes = opponents(w, s2).filter((e) => dist(s2.x, s2.y, e.x, e.y) < 320);
  if (s2.acc >= 2 && foes.length) { s2.acc = 0; s2.spin = { t0: w.time, dur: 0.45, dir: 1 };
    for (let i = 0; i < 3; i++) { const e = foes[i % foes.length], a0 = i / 3 * TAU; shoot(w, s2, a0, { kind: 'spiritOrb', speed: 300, r: 8, life: 1.6, dmg: dmgOf(s2, 1), knock: 40, extra: { home: e, turn: 5 } }); } }
  return true;
};
// the Witch's cauldron: its fumes curse whatever breathes them
BRAINS.cauldron = function (w, s2, dt) {
  s2.vx = s2.vy = s2.kx = s2.ky = 0; s2.acc = (s2.acc || 0) + dt;
  if (s2.acc >= 0.3) { s2.acc = 0; for (const e of opponents(w, s2)) if (dist(e.x, e.y, s2.x, s2.y) < s2.R + e.r) addStatus(w, e, 'curse', 20, s2.summonBy); }
  return true;
};
// The Warlock's imp (his trait): it keeps close to him, darting about at his shoulder, and shoots small eye bolts at
// what he is fighting; during Awaken it is inside him; during Dark Bargain its bolts burst
BRAINS.warlockImp = function (w, s2, dt) {
  const u = s2.summonBy; if (!u || u.dead) { kill(w, s2, null); return true; }
  if (s2.inHim) { s2.x = u.x; s2.y = u.y; s2.vx = s2.vy = 0; return true; }
  s2.orbit = (s2.orbit || rand() * TAU) + dt * 1.4; const gx = u.x + Math.cos(s2.orbit) * 40, gy = u.y + Math.sin(s2.orbit) * 30, d = dist(s2.x, s2.y, gx, gy), b = angleTo(s2.x, s2.y, gx, gy);
  s2.dvx = Math.cos(b) * Math.min(d * 4, 260); s2.dvy = Math.sin(b) * Math.min(d * 4, 260); s2.spd = Math.hypot(s2.dvx, s2.dvy); s2.mvA = b;
  const t = u.target && alive(u.target) && !u.target.ethereal ? u.target : null;
  if (t) s2.facing = angleTo(s2.x, s2.y, t.x, t.y); else s2.facing = b;
  if (t && !(s2.beamT > w.time) && s2.atkT <= 0 && dist(s2.x, s2.y, t.x, t.y) < 280 && !blocked(w, s2.x, s2.y, t.x, t.y)) {
    s2.atkT = s2.def.atkCd / (s2.buffs.some((x) => x.id === 'bargain') ? 1.8 : 1); setAnim(s2, 'throw', 0.25);
    eyeBolt(w, s2, angleTo(s2.x, s2.y, t.x, t.y), dmgOf(u, 0.35), true, s2.bargainUntil > w.time ? u : null);
  }
  return true;
};
// the pact bolt: an eye like the one on his sceptre; it flies out and comes back to whoever threw it (round 13: "Should
// return back to him"), hitting on the way back too; a third of what his deals heals him
function eyeBolt(w, u, a, dmg, small, burstBy) {
  const owner = u, onHit = (w2, p, e) => { if (!small) heal(w2, owner, p.dmg * 0.33, owner); if (burstBy) { k2(w2, { draw: 'eyeBurst', x: e.x, y: e.y, r: 36, max: 0.35, small: true }); for (const o of foesNear(w2, burstBy, e.x, e.y, 36)) if (o !== e) hurt(w2, o, p.dmg * 0.6, burstBy, { noDodge: true, knock: 60, proc: true }); } };
  shoot(w, u, a, { kind: 'eyeBolt', speed: 470, r: small ? 5 : 8, life: small ? 0.5 : 0.62, pierce: 3, dmg, color: '#E05AB8', knock: 25, extra: { small, onHit }, land: (p) => {
    const b = angleTo(p.x, p.y, owner.x, owner.y);
    w.projectiles.push({ kind: 'eyeBolt', x: p.x, y: p.y, vx: Math.cos(b) * 520, vy: Math.sin(b) * 520, r: p.r, team: owner.team, owner, dmg: dmg * 0.6, o: { knock: 20 }, life: 1.3, a: b, pierce: 3, hitSet: new Set(), home: owner, turn: 12, catchBy: owner, small, back: true, onHit });
  } });
}
function demonEnd(w, u) {
  const D = u.kit.demon; if (!D) return; u.kit.demon = null; u.def = D.human; u.buffs = u.buffs.filter((b) => b.id !== 'demon');
  if (D.imp && !D.imp.dead) { D.imp.hidden = false; D.imp.ethereal = false; D.imp.inHim = false; D.imp.x = u.x + 30; D.imp.y = u.y; k2(w, { draw: 'impInto', from: u, to: D.imp, x: u.x, y: u.y, max: 0.4 }); }
  puff(w, u.x, u.y, '#B0204A', 12, 100, 6, 0.5);
}
// the Cultist's Sacrifice: an enemy near death in reach (below 25%; II 35%): bosses and majors only when they are low
// ---- Round 19 (lane rogue19): the Cultist's pieces
// ANTI-HEAL (statuses.js ANTIHEAL): heals on it do half while it lasts; dull cracked crosses sink off it
export function antiheal(w, e, dur) {
  if (!alive(e)) return; const r = resTo(e, 'antiheal'); if (r <= 0) return; dur *= r;
  const had = e.buffs.some((b) => b.id === 'antiheal' && b.t > 0); addBuff(e, { id: 'antiheal', dur, healTaken: ANTIHEAL.healTaken });
  if (!had) k2(w, { draw: 'antihealOn', unit: e, x: e.x, y: e.y, r: e.vr, max: dur + 60 });
}
const PACT = { bleed: 35, wash: ['#6A0E1E', 0.2] };
const RITE = { r: 72, r3: 92, t: 3, t3: 2.4, bleed: 6, big: 0.2, cdCut: 4, heal: 0.15, below: 0.55, reach: 320 };
const SAC = { max: 6, reach: 380, cut: 0.5, anti: 4, might: 0.1, dur: 6 };
// held where it stands (it can't walk out of a circle)
const stuckFor = (w, e) => e.stunT > 0 || e.rootT > 0 || e.frozenT > 0 || e.sleepT > 0 || e.koT > 0 || isOn(w, e, 'trapped') || isOn(w, e, 'hostage');
// the Ritual Circle's mark: the enemy nearest death within reach (under RITE.below), one held in place before the rest
function ritualTarget(w, u) {
  return opponents(w, u).filter((e) => !e.fixed && !e.linkTo && hpRatio(e) < RITE.below && dist(u.x, u.y, e.x, e.y) < RITE.reach && !blocked(w, u.x, u.y, e.x, e.y))
    .sort((p, q) => (stuckFor(w, q) ? 1 : 0) - (stuckFor(w, p) ? 1 : 0) || hpRatio(p) - hpRatio(q))[0] || null;
}
// the bleeding enemies Sacrifice runs to, nearest (to `from`) first
function bleedersOf(w, u, from = u) {
  return opponents(w, u).filter((e) => (e.st.bleed || 0) >= 8 && !e.fixed && !e.linkTo && dist(u.x, u.y, e.x, e.y) < SAC.reach).sort((p, q) => dist(from.x, from.y, p.x, p.y) - dist(from.x, from.y, q.x, q.y));
}
// Sacrifice's cut: a cut, and its bleeding bursts now (the build-up pushed over its top: a Haemorrhage)
function cutOpen(w, u, e, tier) {
  if (!alive(e)) return; u.facing = ang(u, e);
  hurt(w, e, dmgOf(u, SAC.cut), u, { noDodge: true, knock: 100, kAngle: ang(u, e), ab: 'soulCandle' });
  if (alive(e) && !(e.bleedImmuneT > 0)) addStatus(w, e, 'bleed', 300, u);
  k2(w, { draw: 'sacrifice', x: e.x, y: e.y, a: u.facing, r: e.vr, max: 0.6, ab: 'soulCandle' });
  if (tier >= 2) antiheal(w, e, SAC.anti);
  if (tier >= 3) { const b = u.buffs.find((x) => x.id === 'sacrificeMight' && x.t > 0), n = Math.min(6, ((b && b.stacks) || 0) + 1);
    addBuff(u, { id: 'sacrificeMight', dur: SAC.dur, dealt: 1 + SAC.might * n, stacks: n }); k2(w, { draw: 'pactOn', unit: u, x: u.x, y: u.y, r: u.vr, max: SAC.dur, buff: 'sacrificeMight' }); }
}
// the Beekeeper's hive: bees stream out at what is near; whoever strikes it is mobbed (a hook on it)
BRAINS.beehive = function (w, h, dt) {
  const u = h.summonBy; h.vx = h.vy = h.kx = h.ky = 0; h.acc = (h.acc || 0) + dt;
  if (!h.mob) { h.mob = true; onUnit(w, h, 'hiveMob', 99, { struck(w2, u2, src) { if (src && alive(src) && (u2.mobT || 0) < w2.time) { u2.mobT = w2.time + 0.6; for (let i = 0; i < 3; i++) bee(w2, u || u2, u2, src, 0.4, true); } } }); }
  if (h.acc >= 0.7) { h.acc = 0; const e = opponents(w, h).filter((o) => dist(o.x, o.y, h.x, h.y) < 220).sort(() => rand() - 0.5)[0]; if (e && u) bee(w, u, h, e, 0.45, h.tier >= 3); }
  return true;
};
// the Quartermaster's crate: the first touch of each friend has its abilities come round sooner, and patches it up
BRAINS.crate = function (w, c, dt) {
  c.vx = c.vy = c.kx = c.ky = 0; const u = c.summonBy;
  for (const a of w.units) if (alive(a) && a.team === c.team && !a.summon && a.kit && !c.used.has(a) && dist(a.x, a.y, c.x, c.y) < a.r + c.r + 10) {
    c.used.add(a); for (const k in a.kit.cd) a.kit.cd[k] = Math.max(0, a.kit.cd[k] - c.cut); heal(w, a, a.maxHp * 0.05, u);
    k2(w, { draw: 'tellClock', unit: a, x: a.x, y: a.y, r: a.vr, max: 1.2, secs: c.cut }); puff(w, c.x, c.y, '#C9A070', 6, 60, 4, 0.3);
  }
  // friends with abilities waiting walk over to it
  for (const a of w.units) if (alive(a) && a.team === c.team && !a.summon && a.kit && !c.used.has(a) && dist(a.x, a.y, c.x, c.y) < 260 && Object.values(a.kit.cd).some((x) => x > 3)) a.coinGoal = { x: c.x, y: c.y, d: dist(a.x, a.y, c.x, c.y) };
  return true;
};
// the Quartermaster's barricade: it stands; III its spikes hurt whatever strikes it
BRAINS.barricade = function (w, b, dt) {
  b.vx = b.vy = b.kx = b.ky = 0;
  if (b.spikes && !b.spiked) { b.spiked = true; onUnit(w, b, 'spikes', 99, { struck(w2, u2, src, amt, o) { if (src && alive(src) && !o.shot && dist(src.x, src.y, u2.x, u2.y) < u2.r + src.r + 40) hurt(w2, src, dmgOf(u2.summonBy || u2, 0.6), u2.summonBy, { noDodge: true, knock: 120, kAngle: angleTo(u2.x, u2.y, src.x, src.y), proc: true }); } }); }
  return true;
};
// a bee (the Beekeeper's): it flies to its foe and stings; a pestering bee keeps buzzing round it, stinging now and then
function bee(w, u, from, e, k, pester) {
  const a = angleTo(from.x, from.y, e.x, e.y) + rrange(-0.6, 0.6);
  w.projectiles.push({ kind: 'bee', x: from.x + Math.cos(a) * 14, y: from.y + Math.sin(a) * 14, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 6, team: u.team, owner: u, dmg: dmgOf(u, k), o: { knock: 10, poison: 3 }, life: 1.8, a, home: e, turn: 7,
    onHit: (w2, p, x) => { if (!pester || !alive(x)) return; const hk = hookOf(x, 'pester'); if (hk) { hk.until = w2.time + 3; hk.n = Math.min(2, hk.n + 1); return; }
      let acc = 0; const h = onUnit(w2, x, 'pester', 3, { n: 1, tick(w3, u3, dt) { acc += dt; if (acc < 0.7) return; acc = 0; if (alive(u)) hurt(w3, u3, dmgOf(u, k * 0.25) * this.n, u, { noDodge: true, knock: 0, pester: true, poison: 2 }); } });
      k2(w2, { draw: 'pester', unit: x, x: x.x, y: x.y, r: x.vr, max: 30, hk: h }); } });
}
// Pollen (the Beekeeper's trait): every sixth sting of his bees mends the friend most hurt near him
function pollen(w, u) {
  if (!u.kit) return; const k = u.kit; k.stings = (k.stings || 0) + 1; if (k.stings % 6) return;
  const a = hurtMost([u, ...allies(w, u)].filter((o) => !o.summon && !o.def.cargo && dist(u.x, u.y, o.x, o.y) < 300)); if (!a || hpRatio(a) >= 1) return;
  heal(w, a, a.maxHp * 0.04, u); k2(w, { draw: 'pollen', unit: a, from: u, x: a.x, y: a.y, max: 0.8 });
}
// the Grenadier's big bomb: it sits fizzing; it goes off when it is broken or its 2 s are up (kill: its death)
BRAINS.bigBomb = function (w, b, dt) {
  b.vx = b.vy = b.kx = b.ky = 0;
  if (!b.armed) { b.armed = true;
    onUnit(w, b, 'bomb', 99, { downed(w2, u2) { bigBoom(w2, u2); return false; } }); }
  if (!b.boomed && (b.hp <= 1 || (b.lifeT != null && b.lifeT <= dt * 1.5))) bigBoom(w, b);
  return true;
};
function bigBoom(w, b) {
  if (b.boomed) return; b.boomed = true; const u = b.bomber, tier = b.tier || 1; if (!u) return;
  blast(w, u, b.x, b.y, 120, 2.2, { burn: tier >= 2 ? 30 : 0, stagger: 35 }, 'bigBomb');
  if (tier >= 3) for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4, x2 = clamp(b.x + Math.cos(a) * 110, 20, w.W - 20), y2 = clamp(b.y + Math.sin(a) * 110, 20, w.H - 20);
    const p = lob(w, u, x2, y2, 'bomb', null, () => after(u, 0.2, () => blast(w, u, x2, y2, 55, 0.8, { stagger: 20 }, 'bigBomb'))); p.x = b.x; p.y = b.y; }
  if (alive(b)) kill(w, b, null);
}
// the Falconer's Hunting Partner: the falcon darts out with the knife, rakes the foe (it is Tracked a moment) and is back
function partnerDive(w, u, t) {
  u.kit.falconOut = true; const hand = handAt(u, u.facing - 0.6, 0);
  const f = k2(w, { draw: 'falcon', x: hand.x, y: hand.y, a: u.facing, max: 3 }); let phase = 'out';
  timer(u, 'partner', 2.5, (dt) => {
    const goal = phase === 'out' ? t : u; if (phase === 'out' && !alive(t)) phase = 'home';
    const a = angleTo(f.x, f.y, goal.x, goal.y), d = dist(f.x, f.y, goal.x, goal.y); f.a = a; f.x += Math.cos(a) * Math.min(d, 620 * dt); f.y += Math.sin(a) * Math.min(d, 620 * dt);
    if (d < goal.r + 8) { if (phase === 'home') { f.max = f.t; return true; } phase = 'home'; hurt(w, t, dmgOf(u, 0.7), u, { noDodge: true, knock: 40, proc: true }); tracked(w, t, 2, 2, u); k2(w, { draw: 'clawRake', x: t.x, y: t.y, a, side: 1, max: 0.28 }); }
  }, () => { u.kit.falconOut = false; f.max = Math.min(f.max, f.t + 0.05); });
}
// the Marksman's bullets go on through anything Targeted
function pierceMarked(w, p, e) { if (isOn(w, e, 'targeted')) { p.pierce = (p.pierce || 0) + 1; if (!p.hitSet) p.hitSet = new Set(); } }
// the Jester's juggling balls bounce off the room's edge, walls and pillars (three times), then drop; III the first one a
// ball struck is whisked to where it next bounces
function juggleTick(w, u, dt) {
  for (const p of w.projectiles) { if (p.owner !== u || !p.juggle || p.life <= 0) continue;
    const nx = p.x + p.vx * dt * 1.5, ny = p.y + p.vy * dt * 1.5; let bx = false, by = false;
    if (nx < p.r || nx > w.W - p.r) bx = true; if (ny < p.r || ny > w.H - p.r) by = true;
    for (const r of w.walls) if (nx > r.x - p.r && nx < r.x + r.w + p.r && ny > r.y - p.r && ny < r.y + r.h + p.r) { if (p.x > r.x - p.r && p.x < r.x + r.w + p.r) by = true; else bx = true; }
    for (const pl of w.pillars) if (dist(nx, ny, pl.x, pl.y) < pl.r + p.r) { const a = angleTo(pl.x, pl.y, p.x, p.y), d = p.vx * Math.cos(a) + p.vy * Math.sin(a); p.vx -= 2 * d * Math.cos(a); p.vy -= 2 * d * Math.sin(a); bx = by = false; p.bounced = true; }
    if (bx) p.vx = -p.vx; if (by) p.vy = -p.vy;
    if (bx || by || p.bounced) { p.bounced = false; p.juggle.left--; p.hitSet.clear(); p.a = Math.atan2(p.vy, p.vx); sparks(w, p.x, p.y, p.a, 5, p.color || '#FFD45A', 0.9); k2(w, { draw: 'confetti', x: p.x, y: p.y, max: 0.4, small: true });
      const c = p.juggle.carry; if (c && typeof c === 'object' && alive(c)) { k2(w, { draw: 'confetti', x: c.x, y: c.y, max: 0.5 }); c.x = clamp(p.x, c.r, w.W - c.r); c.y = clamp(p.y, c.r, w.H - c.r); c.vx = c.vy = c.kx = c.ky = 0; stun(w, c, 0.5); p.juggle.carry = 'done'; }
      if (p.juggle.left < 0) p.life = 0; else p.life = Math.max(p.life, 0.6); }
  }
}
// the Werewolf back to a man (the wolf's time up, or his trait bringing him back)
function wolfBack(w, u) { const k = u.kit; if (!k.wolfUntil) return; u.def = k.human || u.def; k.wolfUntil = 0; if (k.size) { u.r = k.size.r; u.vr = k.size.vr; k.size = null; } puff(w, u.x, u.y, '#6E6A6A', 12, 100, 6, 0.5); }
// the Engineer's towers (Tinker) and drones
const TOWERS = ['torcher', 'tesla', 'snowMortar', 'medbay'];
// Round 17 (lane tags17; the designer: "Think the engineer hitting its turrets with their wrenches. Can heal its
// constructs but not his allies"): REPAIR. With nothing for her to hit close by, the Engineer goes to the most
// damaged construct of her side (tags.js: her turrets and towers first, then anyone's barricade, crate or pavise)
// below `below` of its health within `look`, and whacks it with the wrench in place of a blow: each whack mends `heal`
// of its health, on her own attack clock. Her target has to be further than `busy` off for her to stop and mend. The
// wrench never mends anything that isn't a construct.
export const REPAIR = { below: 0.85, heal: 0.12, look: 420, reach: 30, busy: 90 };
function wrenchRepair(w, u, dt) {
  if (w.cleared || u.act || u.forcedGoal || u.shackledT > 0 || u.stunT > 0 || u.frozenT > 0 || u.sleepT > 0 || u.koT > 0 || u.fearT > 0 || u.radiantT > 0 || u.addledT > 0) return;
  const c = w.units.filter((o) => o !== u && alive(o) && !o.ethereal && o.team === u.team && hasTag(o, 'construct') && o.hp < o.maxHp * REPAIR.below && dist(o.x, o.y, u.x, u.y) < REPAIR.look)
    .sort((p, q) => (q.summonBy === u ? 1 : 0) - (p.summonBy === u ? 1 : 0) || hpRatio(p) - hpRatio(q))[0];
  if (!c) return;
  if (opponents(w, u).some((e) => dist(u.x, u.y, e.x, e.y) - u.r - e.r < REPAIR.busy)) return; // something to hit close by: that first
  const gap = dist(u.x, u.y, c.x, c.y) - u.r - c.r;
  u.coinGoal = { x: c.x, y: c.y, d: Math.max(0, gap) + 40, repair: true }; // (sim.js movement: repair, she walks to it whatever she was fighting)
  if (gap > REPAIR.reach || u.atkT > 0) return;
  u.facing = ang(u, c); setAnim(u, 'swing', 0.28); swingMark(w, u, u.r + 34, 1.6);
  const amt = Math.min(c.maxHp - c.hp, c.maxHp * REPAIR.heal); if (amt > 0) heal(w, c, amt, u);
  c.mendGlow = w.time + 0.4; c.flashT = 0.08;
  k2(w, { draw: 'buildSparks', x: c.x, y: c.y, max: 0.5 }); sparks(w, c.x + Math.cos(u.facing + Math.PI) * c.r * 0.6, c.y + Math.sin(u.facing + Math.PI) * c.r * 0.6, u.facing + Math.PI, 6, '#FFE66B', 1.1);
  u.atkT = u.def.atkCd * rrange(0.9, 1.1); u.lastAttackT = w.time; u.repairs = (u.repairs || 0) + 1;
}
const turnTo = (s2, want, rate, dt) => { const d = Math.atan2(Math.sin(want - s2.facing), Math.cos(want - s2.facing)); s2.facing += clamp(d, -rate * dt, rate * dt); return Math.abs(d); };
const nearestFoe = (w, s2, R) => opponents(w, s2).filter((e) => dist(e.x, e.y, s2.x, s2.y) < R && !blocked(w, s2.x, s2.y, e.x, e.y)).sort((p, q) => dist(s2.x, s2.y, p.x, p.y) - dist(s2.x, s2.y, q.x, q.y))[0];
// the turret: turns slowly to the nearest enemy and fires bursts of five
BRAINS.turret = function (w, s2, dt) {
  s2.vx = s2.vy = 0; const e = nearestFoe(w, s2, s2.def.range || 260); s2.burstT = (s2.burstT ?? 0.6) - dt * (s2.atkMul || 1);
  if (!e) return true; const off = turnTo(s2, angleTo(s2.x, s2.y, e.x, e.y), 1.6, dt);
  if (off < 0.18 && s2.burstT <= 0) { s2.burstT = 1.8; for (let i = 0; i < 5; i++) after(s2, i * 0.08, () => { if (!alive(s2)) return; s2.firing = w.time + 0.1; const a = s2.facing + rrange(-0.06, 0.06);
    w.projectiles.push({ kind: 'bullet', x: s2.x + Math.cos(a) * 26, y: s2.y + Math.sin(a) * 26, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, r: 4, team: s2.team, owner: s2, dmg: s2.def.dmg * s2.dmgMul, o: { knock: 30 }, life: 0.5, a }); }); }
  return true;
};
// the torcher: very slow to turn, a jet of fire out of its front along the floor
BRAINS.torcher = function (w, s2, dt) {
  s2.vx = s2.vy = 0; const e = nearestFoe(w, s2, 240); if (e) turnTo(s2, angleTo(s2.x, s2.y, e.x, e.y), 0.7, dt);
  s2.acc = (s2.acc || 0) + dt; s2.flaming = !!e && dist(e.x, e.y, s2.x, s2.y) < 200;
  if (s2.flaming && s2.acc >= 0.25) { s2.acc = 0; const L = 180, x1 = s2.x + Math.cos(s2.facing) * L, y1 = s2.y + Math.sin(s2.facing) * L;
    for (const o of opponents(w, s2)) if (segDist(o.x, o.y, s2.x, s2.y, x1, y1) < o.r + 14) hurt(w, o, s2.def.dmg * s2.dmgMul, s2.summonBy, { dot: true, burn: 14, color: '#FF8A3D' }); }
  return true;
};
// the tesla: every 1.2 s a bolt to the nearest enemy that leaps on to two more, shocking
BRAINS.tesla = function (w, s2, dt) {
  s2.vx = s2.vy = 0; s2.acc = (s2.acc || 0) + dt; if (s2.acc < 1.2) return true; const e = nearestFoe(w, s2, 220); if (!e) return true; s2.acc = 0;
  let from = s2, hit = new Set(); const u = s2.summonBy;
  for (let i = 0, cur = e; i < 3 && cur; i++) { fx(w, { type: 'beam', kind: 'lightning', x1: from.x, y1: from.y - (from === s2 ? 26 : 0), x2: cur.x, y2: cur.y, max: 0.25 }); hurt(w, cur, s2.def.dmg * s2.dmgMul, u, { noDodge: true, shock: 25, knock: 40 }); hit.add(cur); from = cur;
    cur = opponents(w, s2).filter((o) => !hit.has(o) && dist(o.x, o.y, from.x, from.y) < 150).sort((p, q) => dist(from.x, from.y, p.x, p.y) - dist(from.x, from.y, q.x, q.y))[0]; }
  s2.zapT = w.time; return true;
};
// the snowball mortar: every 1.6 s a snowball lobbed high onto an enemy: a chilling burst
BRAINS.snowMortar = function (w, s2, dt) {
  s2.vx = s2.vy = 0; s2.acc = (s2.acc || 0) + dt; const e = opponents(w, s2).filter((o) => dist(o.x, o.y, s2.x, s2.y) < 340).sort(() => rand() - 0.5)[0]; if (e) turnTo(s2, angleTo(s2.x, s2.y, e.x, e.y), 2, dt);
  if (s2.acc < 1.6 || !e) return true; s2.acc = 0; s2.recoil = w.time; const x = e.x, y = e.y, u = s2.summonBy;
  const p = lob(w, s2, x, y, 'snowball', null, () => { k2(w, { draw: 'snowBurst', x, y, r: 55, max: 0.5 }); for (const o of foesNear(w, s2, x, y, 55)) hurt(w, o, s2.def.dmg * s2.dmgMul, u, { noDodge: true, chill: 35, knock: 80, kAngle: angleTo(x, y, o.x, o.y) }); });
  return true;
};
// the medbay: every 2 s a wobbly little healing drone floats out (three at most)
BRAINS.medbay = function (w, s2, dt) {
  s2.vx = s2.vy = 0; s2.acc = (s2.acc || 0) + dt; if (s2.acc < 3) return true; s2.acc = 0;
  const u = s2.summonBy; if (!u || w.units.filter((o) => o.kind === 'medDrone' && o.summonBy === u && alive(o)).length >= 3) return true;
  const d = summon(w, u, 'medDrone', s2.x, s2.y - 20, { life: 10 }); d.fixed = true; d.heal = 0.04 * (s2.tier >= 3 ? 1.5 : 1); return true;
};
BRAINS.medDrone = function (w, d, dt) {
  const a = w.units.filter((o) => alive(o) && o.team === d.team && !o.summon && !o.def.cargo && hpRatio(o) < 1).sort((p, q) => hpRatio(p) - hpRatio(q))[0];
  d.bob = (d.bob || 0) + dt * 9; d.hop = 18 + Math.sin(d.bob) * 5; if (!a) return true;
  const b = angleTo(d.x, d.y, a.x, a.y) + Math.sin(d.bob * 0.7) * 0.6, dd = dist(d.x, d.y, a.x, a.y); d.x += Math.cos(b) * Math.min(dd, 120 * dt); d.y += Math.sin(b) * Math.min(dd, 120 * dt); d.facing = b;
  if (dd < a.r + 10) { heal(w, a, a.maxHp * d.heal, d.summonBy); a.mendGlow = w.time + 0.4; k2(w, { draw: 'splash', x: a.x, y: a.y, r: 24, col: '#9BE07A', max: 0.4 }); kill(w, d, null); }
  return true;
};
// a wind-up drone: it waddles slowly at the nearest enemy and pops, shocking those round it
BRAINS.windup = function (w, d, dt) {
  const e = opponents(w, d).sort((p, q) => dist(d.x, d.y, p.x, p.y) - dist(d.x, d.y, q.x, q.y))[0]; d.key = (d.key || 0) + dt * 14;
  if (!e) return true; const b = angleTo(d.x, d.y, e.x, e.y); d.facing = b; d.x += Math.cos(b) * 55 * dt; d.y += Math.sin(b) * 55 * dt;
  if (dist(d.x, d.y, e.x, e.y) < e.r + d.r + 4) { const u = d.summonBy; k2(w, { draw: 'clap', x: d.x, y: d.y, r: 46, max: 0.4 });
    for (const o of foesNear(w, d, d.x, d.y, 46)) hurt(w, o, d.def.dmg * d.dmgMul, u, { noDodge: true, shock: d.tier >= 2 ? 30 : 20, knock: 140, kAngle: angleTo(d.x, d.y, o.x, o.y) }); kill(w, d, null); }
  return true;
};
const oneOnOne = (w, u, foe) => !opponents(w, u).some((e) => e !== foe && e.target === u && dist(e.x, e.y, u.x, u.y) < 200);
// Round 19 (lane rogue19): the Bandit's Hostage. Who he can grab: the nearest enemy in reach that isn't too big to hold
// (no boss, major or mini-boss, nothing heavy, fixed, chained or many-bodied).
function hostageFor(w, u) {
  return opponents(w, u).filter((e) => !e.def.boss && !e.major && !e.mini && !e.fixed && !e.linkTo && !e.bodies && !e.def.part && (e.mass || 1) <= 1.6 && e.r <= 34 && !isOn(w, e, 'hostage')
    && dist(u.x, u.y, e.x, e.y) - u.r - e.r <= (u.def.range || 20) + 40).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0] || null;
}
// he lets it go: a shove away (III: into its friends, flung, and disarmed)
function letGo(w, u, e, tier) {
  if (!alive(e) || !alive(u)) return; const a = u.facing;
  e.passUntil = 0; shove(e, a, tier >= 3 ? 620 : 300); puff(w, e.x, e.y, '#E9DDC2', 6, 80, 5, 0.35);
  if (tier >= 3) { disarm(w, e, 2.5, u); flung(w, u, e, 0.7, null, (o) => { hurt(w, o, dmgOf(u, 0.8), u, { knock: 320, kAngle: a, noDodge: true, ab: 'lowBlow' }); puff(w, o.x, o.y, '#E9DDC2', 6, 80, 5, 0.35); }); }
}
// the Bandit's Snatch (round 13; round 19: his trait is Light Fingers now, this is kept unused): its weapon flung out of its hand; it must walk over and pick it up before it can attack again
function snatch(w, u, e) {
  if (!alive(e) || e.def.boss || e.fixed || e.def.brain || isOn(w, e, 'snatched')) return;
  const a = angleTo(u.x, u.y, e.x, e.y) + rrange(-0.8, 0.8), d = rrange(110, 160);
  const x = clamp(e.x + Math.cos(a) * d, 30, w.W - 30), y = clamp(e.y + Math.sin(a) * d, 30, w.H - 30);
  const f = k2(w, { draw: 'droppedWeapon', x, y, x0: e.x, y0: e.y, a, max: 5, team: e.team });
  textU(w, e.x, e.y, e.r + 8, 'SNATCHED', '#FFD45A', 0.9);
  onUnit(w, e, 'snatched', 5, { tick(w2, u2) {
    u2.atkT = Math.max(u2.atkT, 0.2); if (f.t < 0.35) return;
    u2.forcedGoal = { x, y };
    if (dist(u2.x, u2.y, x, y) < u2.r + 10) { offUnit(u2, 'snatched'); u2.forcedGoal = null; f.max = f.t; setAnim(u2, 'ability', 0.3); }
  } }, (u2) => { if (u2.forcedGoal && u2.forcedGoal.x === x) u2.forcedGoal = null; f.max = Math.min(f.max, f.t); });
}
// Round 19 (lane rogue19): Light Fingers, the Bandit's trait: a chain of three draw cuts (dashes.js), the next mark the
// nearest one not yet cut (an armed one first: there is a weapon to take), each cut a blow and DISARMED
const LIGHT = { cd: 11, first: 4, reach: 260, n: 3, cut: 0.9, disarm: 2.5 };
function lightChain(w, u, pool) {
  const done = new Set(), pick = () => { const L = opponents(w, u).filter((e) => !done.has(e) && dist(u.x, u.y, e.x, e.y) < LIGHT.reach && !blocked(w, u.x, u.y, e.x, e.y));
    return L.sort((p, q) => (isArmed(q) && !(q.disarmT > 0) ? 1 : 0) - (isArmed(p) && !(p.disarmT > 0) ? 1 : 0) || dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0] || null; };
  const leg = (i) => { const e = pick(); if (!e) return null; done.add(e);
    const a = ang(u, e), len = dist(u.x, u.y, e.x, e.y) + e.r + u.r + 16;
    return { a, len, tell: i ? 0.06 : 0.16, hold: 0.08, recover: i + 1 < LIGHT.n ? 0.02 : 0.2, now: true, dmg: dmgOf(u, LIGHT.cut), hit: { knock: 120, ab: 'lightFingers' },
      mark: null, ghost: '#7A4A30', col: ['#FFE7A0', '#FFFFFF'], inv: true,
      again: i + 1 < LIGHT.n ? () => leg(i + 1) : null }; };
  const first = leg(0); if (!first) return;
  textU(w, u.x, u.y, u.r + 12, 'LIGHT FINGERS', '#FFD45A', 0.8);
  dash(w, u, 'drawCut', first);
}
// Round 19 (lane rogue19): the Monk's Fists, a combo of three
const FISTS = { gap: 1.6, mul: 1.8, knock: 520, jab: 50, spun: 35 };
// Round 19 (lane rogue19): the Cultist's Blood Rite
const RITE2 = { below: 0.12, reach: 420, cd: 25, worth: 3 };
// ---------------------------------------------------------------- traits
export const TRAITS2 = {
  // Last Stand (round 13, the designer: "When last one in party gets a long unstoppable and haste buff, all abilities
  // are reset."): once a room, the moment he is the last of his side standing
  lastStand: {
    allyDown(w, u, v) {
      if (u.kit.lastW === w || v.summon || !alive(u) || !opponents(w, u).length) return;
      if (allies(w, u).some((a) => a !== v && !a.summon && !a.def.cargo)) return; // (v is still standing as the hook runs)
      u.kit.lastW = w;
      addBuff(u, { id: 'unstoppable', dur: 10, statusImmune: true, knockImmune: true, glow: '#FFE7A0' });
      haste(w, u, 10, 1.35);
      for (const k in u.kit.cd) u.kit.cd[k] = 0;
      cleanse(u); setAnim(u, 'ability', 0.6); w.shake = Math.max(w.shake, 6);
      textU(w, u.x, u.y, u.r + 14, 'LAST STAND', '#FFE7A0', 1.3);
      k2(w, { draw: 'rally', unit: u, x: u.x, y: u.y, r: u.vr, max: 1.2 });
      k2(w, { draw: 'lastStand', unit: u, x: u.x, y: u.y, r: u.vr, max: 1.1 });
    },
  },
  grace: {
    dealt(w, u, t, amt, o) {
      if (o.dot) return amt;
      const k = u.kit;
      k.graceN = (k.graceN || 0) + 1; if (k.graceN % 3 === 0) { o.crit = true; return amt * 2; } return amt;
    },
  },
  skyborn: { immune: ['entangle'], tick(w, u) { u.rootT = 0; u.tangledT = 0; } },
  // Return Thrust (round 13, the designer: "Don't like trait. Should be more of a hybrid dps tank"): every blow he takes
  // winds him up (up to 5); his next spear thrust lets it all go: twice the reach, through everything in a line, 30%
  // harder for each
  returnThrust: {
    taken(w, u, src, amt, o) { if (!o.dot && src && src !== u && amt > 0) { const k = u.kit; k.pent = Math.min(5, (k.pent || 0) + 1); if (k.pent === 1) k2(w, { draw: 'spearCharge', unit: u, x: u.x, y: u.y, r: u.r, max: 60 }); } return amt; },
    dealt(w, u, t, amt, o) {
      const k = u.kit, n = k.pent || 0;
      if (!n || o.dot || o.proc || o.shot || o.ab || o.pab || k.using) return amt;
      k.pent = 0; const a = u.facing, L = u.r + (u.def.range || 40) * 2 + 40, ex = u.x + Math.cos(a) * L, ey = u.y + Math.sin(a) * L;
      k2(w, { draw: 'thrustLine', x: u.x, y: u.y, a, r: L, n, max: 0.35 });
      for (const e of opponents(w, u)) if (e !== t && segDist(e.x, e.y, u.x, u.y, ex, ey) < e.r + 14 && inFront(u, e, 1.2))
        hurt(w, e, dmgOf(u, 1) * (1 + 0.3 * n), u, { knock: 220, kAngle: a, noDodge: true, proc: true });
      o.knock = (o.knock || 0) + 60 * n; if (n >= 3) o.heavy = true;
      return amt * (1 + 0.3 * n);
    },
  },
  thickHide: {
    tick(w, u) {
      const p = u.kit.hide || (u.kit.hide = {});
      for (const s of BUILDS) { const v = u.st[s] || 0, was = p[s] ?? v; if (v > was) u.st[s] = was + (v - was) * 0.5; p[s] = u.st[s] || 0; }
    },
  },
  ironWill: {
    tick(w, u) { if (hpRatio(u) < 0.3) { u.stunT = 0; u.koT = 0; u.st.stagger = 0; } },
    dealt(w, u, t, amt) { return hpRatio(u) < 0.3 ? amt * 1.25 : amt; },
  },
  // Snatch (round 13, the Bandit redone: "Don't like trait"): every fourth blow tears the enemy's weapon out of its hand
  // and flings it away; it can't attack until it has walked over and picked it up
  snatch: {
    hit(w, u, t, amt, o) {
      if (o.dot || o.proc || o.shot || !alive(t)) return;
      const k = u.kit; k.snatchN = (k.snatchN || 0) + 1; if (k.snatchN % 4) return;
      snatch(w, u, t);
    },
  },
  // Light Fingers (round 19, the Bandit's trait; the designer: "Ability dash through 3 enemies in a chain disarming and
  // dealing damage."): every LIGHT.cd s, when two or more enemies are near, he dashes through up to three in a chain, one
  // straight after another (dashes.js draw cuts, each cut landing as the cutlass passes), and each one cut is DISARMED.
  // (Snatch, his round 13 trait, is kept above unused.)
  lightFingers: {
    show: { abilities: true },
    hit(w, u, t, amt, o) { if (o.ab === 'lightFingers' && alive(t)) disarm(w, t, LIGHT.disarm, u); },
    tick(w, u, dt) {
      const k = u.kit; if (k.lightW !== w) { k.lightW = w; k.lightT = LIGHT.first; }
      k.lightT -= dt; if (k.lightT > 0 || u.act || k.using || u.stunT > 0 || u.rootT > 0 || u.forcedGoal || isOn(w, u, 'holding')) return;
      const near = opponents(w, u).filter((e) => dist(u.x, u.y, e.x, e.y) < LIGHT.reach && !blocked(w, u.x, u.y, e.x, e.y));
      if (near.length < 2) { k.lightT = 0.3; return; }
      k.lightT = LIGHT.cd; lightChain(w, u, near);
    },
  },
  // (round 13: the Shade's daggers: "Attacks in 2 stabs at a time, quickly 1 after the other"): kits2 SHADE_STAB, below
  // (round 19: the Monk's Fists, "Has a 3 part combo with the last 1 dealing more damage, knockback and spun": every
  // third blow of his fists in a row (no more than FISTS.gap s apart) lands FISTS.mul as hard, throws it far back and
  // Spins it; the hook lives on his trait so it is always his, kitTick swings that blow bigger, fx-rogue19.js draws it)
  // Fade (round 13, the designer: "After 3 seconds of not attacking or taking damage becomes a shadow."): unseen and
  // dark (nobody can pick her out) until her next blow or ability
  fade: {
    show: { hitme: false, shootme: false, quiet: 3.4 }, // (the lab's trait bench)
    tick(w, u) {
      const k = u.kit, S = k.shadow;
      if (S) { // a blow or a cast brings her out (unless Blackout III holds it for a while)
        if (S.until && w.time < S.until) return;
        if ((S.until && w.time >= S.until) || (u.anim && u.anim !== S.anim) || k.using) leaveShadow(w, u);
        return;
      }
      if (k.fadeW !== w) { k.fadeW = w; k.lastCast = w.time; } // (a new room: 3 s from now, not at once)
      const last = Math.max(u.lastAttackT ?? -9, k.lastHurt ?? -9, k.lastCast ?? -9);
      if (u.anim && u.anim !== k.lastAnimSeen) { k.lastAnimSeen = u.anim; k.lastCast = w.time; }
      if (w.time - last > 3 && !u.act && opponents(w, u).length) shadowForm(w, u, 0);
    },
    taken(w, u, src, amt, o) { if (!o.dot) u.kit.lastHurt = w.time; return amt; },
  },
  hardWork: { kill(w, u) { heal(w, u, u.maxHp * 0.08, u); } },
  seenItAll: { tick(w, u, dt) { for (const a of friendsNear(w, u, u.x, u.y, 170)) if (a.st.stagger > 0) a.st.stagger = Math.max(0, a.st.stagger - 12 * dt); } },
  catalyst: {
    hit(w, u, t, amt, o) { if (o.proc) return; for (const s of BUILDS) if (o[s]) addStatus(w, t, s, o[s] * 0.3, u); },
  },
  ancestral: {
    allyDown(w, u, v) { if (v.summon) return; for (const a of [u, ...allies(w, u)]) if (a !== v && !a.summon) { heal(w, a, a.maxHp * 0.1, u); k2(w, { draw: 'rally', unit: a, x: a.x, y: a.y, r: a.vr, max: 0.8 }); } },
  },
  crone: { dealt(w, u, t, amt) { return t.st && t.st.curse > 5 ? amt * 1.4 : amt; } },
  // Familiar (round 13, the designer: "Has a small imp always with him. Follows closely. If it dies it will respawn after a
  // short cooldown."): a summon of his (kits2 BRAINS.warlockImp); 8 s after it falls another climbs out of the floor
  familiar: {
    tick(w, u, dt) {
      const k = u.kit; if (mine(w, u, 'warlockImp').length) { k.impT = 8; return; }
      if (k.impW !== w) { k.impW = w; k.impT = 0; } // (a new room: it is with him at once)
      k.impT = (k.impT ?? 0.5) - dt; if (k.impT > 0) return; k.impT = 8;
      const s2 = summon(w, u, 'warlockImp', u.x + 30, u.y - 20, { hit: 0.35, hp: 50 }); s2.fixed = false;
      k2(w, { draw: 'gate', x: s2.x, y: s2.y, r: 22, max: 0.7 });
    },
  },
  // Blood Rite (round 13, the designer: "Don't like trait. Should heal when they trigger a blood burst"): every bleeding
  // he caused that bursts (a haemorrhage) heals him 8%
  // Blood Rite (round 19, the designer: "When ally is about to die (very low hp) he will dash to them killing them
  // instantly but resets all of his cooldowns"): a friend under RITE2.below of its health, within reach, and he has an
  // ability to get back: he darts to it and takes the last of its life; every cooldown of his is ready again. Once every
  // RITE2.cd s. The lane's call on downed heroes (round 18): "killing" a hero friend is what reaching 0 does to anyone, so
  // it goes DOWN, as at 0 anywhere: in a dungeon it is downed as if it had fallen (it gets up as the downed do), in a
  // battle it can only be brought back by a reviving ability and bleeds out after 15 s. He never goes for one already
  // down (nobody finishes the downed), a summon, the wagon, or one of the Mob's other bodies.
  bloodRite: {
    show: { abilities: true }, // (the lab's trait bench)
    tick(w, u, dt) {
      const k = u.kit; if (k.riteW !== w) { k.riteW = w; k.riteT = 0; }
      k.riteT -= dt; if (k.riteT > 0 || u.act || k.using || u.stunT > 0 || u.forcedGoal) return;
      if (!Object.values(k.cd).some((c) => c > RITE2.worth)) return; // (nothing to get back: no point)
      const v = allies(w, u).filter((a) => !a.summon && !a.def.cargo && !a.partOf && !a.def.rig && hpRatio(a) < RITE2.below && dist(u.x, u.y, a.x, a.y) < RITE2.reach && !blocked(w, u.x, u.y, a.x, a.y))
        .sort((p, q) => hpRatio(p) - hpRatio(q))[0];
      if (!v) return;
      k.riteT = RITE2.cd; const a = ang(u, v), d = dist(u.x, u.y, v.x, v.y), T = clamp(d / 900, 0.12, 0.34);
      const x1 = clamp(v.x - Math.cos(a) * (v.r + u.r), u.r, w.W - u.r), y1 = clamp(v.y - Math.sin(a) * (v.r + u.r), u.r, w.H - u.r);
      u.facing = a; k2(w, { draw: 'streak', unit: u, x: u.x, y: u.y, a, max: T + 0.25, col: '#7A2C40' });
      u.act = { type: 'leap', t: T, max: T, x0: u.x, y0: u.y, x1, y1, land: () => {
        if (!alive(v) || !alive(u)) return; u.facing = ang(u, v); setAnim(u, 'thrust', 0.3);
        k2(w, { draw: 'sacrifice', x: v.x, y: v.y, a: u.facing, r: v.vr, max: 0.7, ab: 'bloodRite' });
        k2(w, { draw: 'bloodTo', from: v, to: u, x: v.x, y: v.y, max: 0.7 });
        textU(w, u.x, u.y, u.r + 14, 'BLOOD RITE', '#FF8A7A', 1);
        kill(w, v, u); for (const c in k.cd) k.cd[c] = 0; w.shake = Math.max(w.shake, 4);
      } };
      u.invulnT = Math.max(u.invulnT, T);
    },
  },
  deflect: {
    dealt(w, u, t, amt, o) {
      if (o.dot || o.proc || o.shot || o.ab || o.pab || u.kit.using || !t || t === u) return amt;
      const k = u.kit; if (w.time - (k.comboAt ?? -9) > FISTS.gap) k.combo = 0; k.comboAt = w.time; k.combo = (k.combo || 0) + 1;
      if (k.combo % 3) { o.knock = FISTS.jab; return amt; } // (the first two hold it close for the third)
      o.knock = FISTS.knock; o.heavy = true; o.fistsThird = true; return amt * FISTS.mul;
    },
    hit(w, u, t, amt, o) { if (o.fistsThird && alive(t)) { spin(w, t, FISTS.spun); w.shake = Math.max(w.shake, 3); } },
    evade(w, u, src, amt, o) {
      if (!o.shot || !src || rand() > 0.4) return false;
      const a = o.kAngle != null ? o.kAngle + Math.PI : angleTo(u.x, u.y, src.x, src.y);
      if (angleDiff(a, u.facing) > 1.2) return false;
      sparks(w, u.x + Math.cos(u.facing) * u.r, u.y + Math.sin(u.facing) * u.r, u.facing, 5, '#FFF4C8', 1); setAnim(u, 'punch', 0.15); return true;
    },
  },
  thirdEye: {
    tick(w, u) { if (u.buffs.some((b) => b.blind)) u.buffs = u.buffs.filter((b) => !b.blind); },
    evade(w, u, src, amt, o) { if (o.dot || rand() > 0.15) return false; puff(w, u.x, u.y, '#C9B8FF', 6, 60, 4, 0.35); return true; },
  },
  // Requisition (round 13, the Quartermaster redone; "Giving out hp potions is very strong"): every 20 s he tosses a
  // piece of kit out of the pack to the friend nearest the fight, for 12 s: a whetstone (+20% damage), a buckler
  // (Warded 25) or boots (+25% speed). On the wagon road he is a gatherer (convoy.js reads gatherer: true)
  requisition: {
    tick(w, u, dt) {
      const k = u.kit; if (k.reqW !== w) { k.reqW = w; k.reqT = 3; }
      if (!opponents(w, u).length) return; k.reqT -= dt; if (k.reqT > 0) return; k.reqT = 20;
      const a = [u, ...allies(w, u)].filter((o) => !o.summon && !o.def.cargo && dist(u.x, u.y, o.x, o.y) < 320).sort((p, q) => (q.target ? 1 : 0) - (p.target ? 1 : 0) || hpRatio(p) - hpRatio(q))[0]; if (!a) return;
      const item = ['whetstone', 'buckler', 'boots'][Math.floor(rand() * 3)];
      const give = () => { if (!alive(a)) return;
        if (item === 'whetstone') addBuff(a, { id: 'whetstone', dur: 12, dealt: 1.2 }); else if (item === 'buckler') ward(w, a, 25, 12); else addBuff(a, { id: 'boots', dur: 12, move: 1.25 });
        k2(w, { draw: 'kitOn', unit: a, x: a.x, y: a.y, r: a.vr, item, max: 1.6 }); };
      setAnim(u, 'throw', 0.3); if (a === u) give(); else { const p = lob(w, u, a.x, a.y, 'kitFly', null, give); p.item = item; }
    },
  },
  // (round 13, the designer: "If enemies have armour as well his attacks ignore them."): what armour would take off is
  // put back on first
  armourPiercing: { dealt(w, u, t, amt, o) { const ar = o.dot ? 0 : (t.armor || 0) * (o.heavy || o.crit ? 0.5 : 1); return (t.elite || t.major || t.def.boss ? amt * 1.25 : amt) + ar; } },
  // Hunting Partner (round 13, the designer: "Different trait."): every fourth knife the falcon goes out with it, rakes
  // the foe and marks it Tracked for 2 s (kits2 partnerDive, from his attack)
  huntingPartner: { hit(w, u, t, amt, o) { if (!o.shot || o.proc) return; const k = u.kit; k.throwN = (k.throwN || 0) + 1; if (k.throwN % 4 === 0 && !k.falconOut && alive(t)) partnerDive(w, u, t); } },
  // Powder Keg (round 13, the designer: "Needs different trait. That's just what his bombs do."): whatever his blasts kill
  // blows up too, hurting those round it (a chain through a pack)
  powderKeg: { kill(w, u, v, o) { if (!v || v.summon || v._kegged) return; v._kegged = true; const x = v.x, y = v.y; k2(w, { draw: 'poof', x, y, r: 14, col: '#FFC85A', max: 0.3 }); after(u, 0.15, () => blast(w, u, x, y, 64, 0.9, { stagger: 20, keg: true }, 'powderKeg')); } },
  oldSalt: { immune: ['wet'], dealt(w, u, t, amt) { return t.st && t.st.wet > 20 ? amt * 1.2 : amt; } },
  // Overclock (round 13, the designer: "Trait doesnt make sense. Overclock. If all abilities are used up 1 random ability
  // will come back faster. Boosted rate"): when none of her abilities is ready, one of them (at random) comes round
  // three times as fast until it is; gears spin over her meanwhile
  overclock: {
    show: { abilities: true }, // (the lab's trait bench)
    tick(w, u, dt) {
      const k = u.kit, ids = Object.keys(k.cd); if (!ids.length) return;
      if (ids.some((id) => k.cd[id] <= 0.3)) { k.oc = null; return; }
      if (!k.oc || !(k.cd[k.oc] > 0.3)) { k.oc = ids[Math.floor(rand() * ids.length)]; k2(w, { draw: 'overclock', unit: u, x: u.x, y: u.y, r: u.vr, max: 1.5 }); }
      k.cd[k.oc] -= dt;
    },
  },
  // Back From the Wild (round 13, the designer: "When they die in werewolf form they come back as a human at 10% hp
  // everytime."): the wolf falls, the man gets up
  fromTheWild: {
    show: { abilities: true, killAt: 3.2 }, // (the lab's trait bench)
    downed(w, u) { if (!(u.kit.wolfUntil > w.time)) return false; wolfBack(w, u); u.hp = Math.max(1, u.maxHp * 0.1); u.invulnT = 1; setAnim(u, 'ability', 0.4);
      textU(w, u.x, u.y, u.r + 10, 'BACK', '#E8E2D0', 1); k2(w, { draw: 'roar', unit: u, x: u.x, y: u.y, r: 90, max: 0.5 }); return true; },
  },
  finisher: { dealt(w, u, t, amt) { return hpRatio(t) < 0.5 ? amt * 1.25 : amt; } },
  // Long Shot (round 13, the designer: "Don't like trait. Gets additional damage when target is near max range. Should
  // have very long range."): his reach is 40% longer, and a shot hits up to 60% harder the nearer the edge of it
  longShot: {
    tick(w, u) { if (u.kit.longDef === u.def) return; u.def = { ...u.def, range: u.def.range * 1.4, keep: (u.def.keep || 200) * 1.2 }; u.kit.longDef = u.def; },
    dealt(w, u, t, amt, o) { if (o.dot || !o.shot) return amt; const k = clamp((dist(u.x, u.y, t.x, t.y) / (u.def.range || 300) - 0.2) / 0.75, 0, 1); return amt * (1 + 0.6 * k); },
  },
  assassin: { dealt(w, u, t, amt, o) { return o.shot && angleDiff(angleTo(t.x, t.y, u.x, u.y), t.facing) > 1.9 ? amt * 1.5 : amt; } },
  // Plunder (round 13, the designer: "Enemies have a chance to drop more coins when he is in the party"): with her in the
  // party, every third enemy that falls anywhere in the room spills extra coins (not in battles)
  plunder: {
    tick(w, u) {
      const k = u.kit, seen = k.plunderSeen || (k.plunderSeen = new Map());
      for (const e of opponents(w, u)) if (!e.summon) seen.set(e, { x: e.x, y: e.y });
      for (const [e, p] of seen) if (e.dead || !w.units.includes(e)) { seen.delete(e); if (e.dead && !w.battle && (k.plN = (k.plN || 0) + 1) % 3 === 1) { const c = e.def.coins || [1, 2]; scatterCoins(w, p.x, p.y, Math.max(1, Math.round((c[0] + c[1]) / 3)), 0.9); k2(w, { draw: 'coinPop', x: p.x, y: p.y, r: 16, max: 0.7 }); } }
    },
  },
  watchful: { tick(w, u, dt) { for (const a of friendsNear(w, u, u.x, u.y, 170)) { if (a.stunT > 0) a.stunT = Math.max(0, a.stunT - 0.4 * dt); if (a.sleepT > 0) a.sleepT = Math.max(0, a.sleepT - 0.4 * dt); } } },
  trappersEye: { dealt(w, u, t, amt) { return t.rootT > 0 || t.tangledT > 0 || t.koT > 0 ? amt * 1.3 : amt; } },
  // Duelist (round 13, the designer: "Trait should make him stronger 1 on 1"): while no enemy but the one he fights is on
  // him (none other within 200 with him as its target), he hits it 35% harder and takes 25% less from it
  duelist: {
    show: { abilities: true }, // (the lab's trait bench)
    dealt(w, u, t, amt, o) { return !o.dot && oneOnOne(w, u, t) ? amt * 1.35 : amt; },
    taken(w, u, src, amt, o) { return !o.dot && src && oneOnOne(w, u, src) ? amt * 0.75 : amt; },
  },
  // Pratfall (round 13, the designer: "25% of simple melee hits that should hit him flips target around instead"): a
  // quarter of the blows swung at him miss, and the one who swung is spun round to face away
  pratfall: {
    evade(w, u, src, amt, o) {
      if (o.dot || o.shot || o.proc || !src || !alive(src) || src.fixed || src.def.role === 'ranged' || rand() > 0.25) return false;
      src.facing += Math.PI; src.mvA = src.facing; src.faceLockT = 0.6; src.atkT = Math.max(src.atkT, 0.4);
      setAnim(u, 'spin', 0.35); u.spin = { t0: w.time, dur: 0.35, dir: 1 }; textU(w, src.x, src.y, src.r + 8, 'FLIP', '#FFD45A', 0.9); k2(w, { draw: 'confetti', x: src.x, y: src.y, max: 0.4, small: true });
      return true;
    },
    // (round 13: the marotte's bonks: "Maybe can apply random status effect?": a little of something each time)
    hit(w, u, t, amt, o) { if (o.dot || o.proc || o.shot || o.ab || o.pab || u.kit.using || !alive(t)) return; addStatus(w, t, ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger', 'confuse', 'sleepy', 'charm'][Math.floor(rand() * 9)], 16, u); },
  },
  // Keen Edge (round 13, the designer: "Does percentage damage + a base."): every blow of his takes 3% of its target's
  // greatest health as well (a boss 1%)
  keenEdge: { dealt(w, u, t, amt, o) { return o.dot || o.proc ? amt : amt + t.maxHp * (t.def.boss ? 0.01 : 0.03); } },
  // Light of Valhalla (round 13, the designer: "Heals themselves and ally passively when near ally. Has a glowing aura.
  // Is more of a support."): while a friend is within 140 of her, she and the friends near heal 1.2% a second; a soft
  // gold glow lies under her (fx2 'valhalla'); she still revives the fallen twice as fast
  valhalla: {
    show: { allyDownAt: 3.2 }, // (the lab's trait bench)
    reviveRate: 2, reviveHp: 0.3,
    tick(w, u, dt) {
      if (u.kit.glowW !== w) { u.kit.glowW = w; k2(w, { draw: 'valhalla', unit: u, x: u.x, y: u.y, r: 140, max: 1e9 }); }
      const near = friendsNear(w, u, u.x, u.y, 140).filter((a) => a !== u && !a.summon); u.kit.glowOn = near.length > 0; if (!near.length) return;
      for (const a of [u, ...near]) heal(w, a, a.maxHp * 0.009 * dt, u);
    },
  },
  wellFed: { tick(w, u, dt) { for (const a of friendsNear(w, u, u.x, u.y, 150)) if (!a.summon) heal(w, a, a.maxHp * 0.005 * dt, u); } },
  // Pollen (round 13, the Beekeeper redone): every sixth sting of his bees mends the friend most hurt near him (kits2
  // pollen(), counted where his bees sting)
  pollen: { hit(w, u, t, amt, o) { if (o.shot) pollen(w, u); } },
  // Rub Some Dirt In It (round 13, the designer: "Every ability he uses applies a dirty effect to him.. Acts as a 1 time
  // shield but attack speed is slow until it's cleared. Basic attack doesnt apply it. Makes him immune to poison and fire
  // until removed."): the Dirty effect is put on by each of his abilities (kits2.js dirty); this hook only reports it
  dirtIn: {
    show: { abilities: true }, // (the lab's trait bench)
    tick(w, u) { const k = u.kit, was = k.cdSeen || {}; let used = false; for (const id in k.cd) { if (k.cd[id] > (was[id] ?? 99) + 0.5) used = true; was[id] = k.cd[id]; } k.cdSeen = was; if (used) dirty(w, u); },
  },
};

// ---------------------------------------------------------------- the heroes' own attacks (ranged heroes)
const A = (u, k) => dmgOf(u, k);
export const ATTACKS2 = {
  // a lobbed flask that splashes; each one a different brew: fire, frost, acid in turn
  alchemist(w, u, t, a) {
    const k = u.kit, b = k.brew3 = ((k.brew3 ?? -1) + 1) % 3, st = [{ burn: 14 }, { chill: 16 }, { poison: 14 }][b], col = ['#FF8A3D', '#9FDDF6', '#C8E63C'][b];
    shoot(w, u, a, { kind: 'flask', speed: 400, r: 7, life: 1, dmg: A(u, 0.85), color: col, knock: 20, land: (p) => {
      for (const e of opponents(w, u)) if (dist(p.x, p.y, e.x, e.y) < 38 + e.r) hurt(w, e, A(u, 0.3), u, { noDodge: true, ...st, kAngle: angleTo(p.x, p.y, e.x, e.y), knock: 30 });
      k2(w, { draw: 'splash', x: p.x, y: p.y, r: 38, col, max: 0.4 });
    } });
  },
  // a teal spirit; a share of what it deals mends the most hurt ally
  // round 13: "Jumps to ally if they are near and heals them. Otherwise no heal": it strikes, then (a friend within 170
  // of what it struck) leaps on to that friend and mends it
  shaman(w, u, t, a) {
    shoot(w, u, a, { kind: 'spirit', speed: 430, r: 7, dmg: A(u, 0.95), color: '#7FE0D0', knock: 25, extra: { onHit: (w2, p, e) => {
      const f = [u, ...allies(w2, u)].filter((o) => !o.summon && !o.def.cargo && hpRatio(o) < 1 && dist(o.x, o.y, e.x, e.y) < 170).sort((p1, q) => hpRatio(p1) - hpRatio(q))[0]; if (!f) return;
      const b = angleTo(e.x, e.y, f.x, f.y), amt = p.dmg * 0.25;
      w2.projectiles.push({ kind: 'spirit', x: e.x, y: e.y, vx: Math.cos(b) * 380, vy: Math.sin(b) * 380, r: 6, team: u.team, owner: u, skip: e, dmg: 0, o: {}, life: dist(e.x, e.y, f.x, f.y) / 380 + 0.04, a: b, home: f, turn: 9, noHit: true, heal: true,
        land: () => { if (alive(f)) { heal(w2, f, amt, u); f.mendGlow = w2.time + 0.3; } } });
    } } });
  },
  // a wobbling green spark that curves after its target
  // round 13: "Shoots 3 hexs in quick succession. Have each one look like 1 of 5 possible symbols."
  witch(w, u, t, a) {
    for (let i = 0; i < 3; i++) after(u, i * 0.1, () => { if (!alive(u)) return; const b = t && alive(t) ? ang(u, t) : a;
      shoot(w, u, b + rrange(-0.3, 0.3), { kind: 'hexbolt', speed: 380, r: 7, life: 1.4, dmg: A(u, 0.4), knock: 15, extra: { home: t, turn: 3.5, sym: Math.floor(rand() * 5) } }); });
  },
  // a crystal mote that glances off onto a second enemy
  seer(w, u, t, a) {
    shoot(w, u, a, { kind: 'glimmer', speed: 480, r: 6, dmg: A(u, 0.9), knock: 20, extra: { onHit: (w2, p, e) => {
      const n = opponents(w2, u).filter((o) => o !== e && dist(o.x, o.y, e.x, e.y) < 200).sort((p1, q) => dist(e.x, e.y, p1.x, p1.y) - dist(e.x, e.y, q.x, q.y))[0]; if (!n) return;
      const b = angleTo(e.x, e.y, n.x, n.y);
      w2.projectiles.push({ kind: 'glimmer', x: e.x, y: e.y, vx: Math.cos(b) * 480, vy: Math.sin(b) * 480, r: 5, team: u.team, owner: u, skip: e, dmg: A(u, 0.55), o: { knock: 15 }, life: 0.5, a: b });
    } } });
  },
  // a bee (round 13: the Beekeeper redone): it stings and then stays buzzing round its foe, stinging now and then
  beekeeper(w, u, t, a) { bee(w, u, u, t, 0.5, true); },
  // something out of the pack (round 13: the Quartermaster redone): a pot, a pan, a boot, a tin cup, a ladle
  quartermaster(w, u, t, a) { shoot(w, u, a, { kind: 'pot', speed: 440, r: 8, dmg: A(u, 1), knock: 90, extra: { item: Math.floor(rand() * 5) } }); },
  // the Chef (round 13: "Should be ranged. Throws random foods. All same effect. Hurts enemies, heals allies"): food of
  // six kinds; it hurts the enemy it hits and mends any friend it passes over on the way
  chef(w, u, t, a) {
    shoot(w, u, a, { kind: 'food', speed: 420, r: 8, life: 1.1, dmg: A(u, 0.85), knock: 40, extra: { food: Math.floor(rand() * 6), allyHit: (w2, p, f) => { heal(w2, f, A(u, 0.45), u); f.mendGlow = w2.time + 0.3; } } });
  },
  // a heavy bolt through the first enemy (round 13: "Needs better animation. Remove tail from arrow": no tail, the string
  // snaps forward and he rocks back); after Crank Up it bursts
  crossbowman(w, u, t, a) {
    const k = u.kit, boom = k.crank > 0; if (boom) k.crank--; u.recoilT = 0.22;
    k2(w, { draw: 'twang', unit: u, x: u.x, y: u.y, a, max: 0.3 });
    shoot(w, u, a, { kind: 'cbolt', speed: 760, r: 7, dmg: A(u, 1), knock: 50, pierce: 1, extra: { boom, onHit: boom ? (w2, p, e) => { if (p.boomed) return; p.boomed = true; blast(w2, u, e.x, e.y, k.crankR || 60, 0.8, { knock: 180, stagger: 35 }, 'crankUp'); } : null } });
  },
  // a thrown hunting knife (round 13: "Better visual": a broad blade turning end over end, a glint, a short trail);
  // under Keen Eye some land just right; every fourth goes out with the falcon (his trait, Hunting Partner)
  falconer(w, u, t, a) {
    const keen = u.kit.keenUntil > w.time && rand() < (tierOf(u, 'keenEye') >= 3 ? 0.5 : 0.3);
    shoot(w, u, a, { kind: 'knife', speed: 580, r: 7, dmg: A(u, 1) * (keen ? 2 : 1), crit: keen, knock: 30, extra: { keen: u.kit.keenUntil > w.time } });
  },
  // a small lobbed bomb that bursts where it lands (round 13: "Not fire themed. Stagger.")
  grenadier(w, u, t, a) {
    const x = t.x + (t.vx || 0) * 0.3, y = t.y + (t.vy || 0) * 0.3;
    lob(w, u, x, y, 'bomb', null, () => blast(w, u, x, y, 52, 1.1, { knock: 150, heavy: false, stagger: 22 }, null));
  },
  // the harpoon on its rope (round 13: "Rope needs an outline. Render underneath him. Target pulled forwards a bit and then
  // it returns. Harpoon should look like the one he is holding"): it strikes, tugs the enemy a little way towards him,
  // and is hauled back to his hand
  harpooner(w, u, t, a) {
    const p0 = shoot(w, u, a, { kind: 'harpoon', speed: 640, r: 7, life: 0.6, dmg: A(u, 1), knock: 0, extra: { onHit: (w2, p, e) => {
      if (!e.fixed && !e.def.boss) shove(e, angleTo(e.x, e.y, u.x, u.y), 230);
      const b = angleTo(p.x, p.y, u.x, u.y);
      const back = { kind: 'harpoon', x: p.x, y: p.y, vx: Math.cos(b) * 560, vy: Math.sin(b) * 560, r: 7, team: u.team, owner: u, dmg: 0, o: {}, life: 1, a: b, home: u, turn: 14, noHit: true, back: true, catchBy: u };
      w2.projectiles.push(back); k2(w2, { draw: 'rope', from: u, shot: back, x: u.x, y: u.y, max: 1 });
    } } });
    k2(w, { draw: 'rope', from: u, shot: p0, x: u.x, y: u.y, max: 0.65 });
  },
  // a hard-thrown javelin (round 13: "Make look better. Throw particles. Every third attack throws a razer javalin
  // applying bleed"): dust off her hand as it goes; every third is a serrated razor javelin that makes it bleed
  huntress(w, u, t, a) {
    const k = u.kit, razor = (k.javN = (k.javN || 0) + 1) % 3 === 0, h = handAt(u, a, 4);
    puff(w, h.x, h.y, '#E9DDC2', 5, 80, 4, 0.3); k2(w, { draw: 'twang', unit: u, x: u.x, y: u.y, a, max: 0.25 });
    shoot(w, u, a, { kind: 'javelin', speed: 620, r: 8, dmg: A(u, razor ? 1.2 : 1), knock: 120, extra: { razor, onHit: razor ? (w2, p, e) => bleed(w2, e, 45, u) : null } });
  },
  // one long, hard musket shot (round 13: "More impact."): a big flash and smoke, a kick back, a heavier hit
  marksman(w, u, t, a) { k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a, max: 0.55, big: true }); u.recoilT = 0.25; w.shake = Math.max(w.shake, 2.5);
    shoot(w, u, a, { kind: 'bullet', speed: 1300, r: 7, life: 0.8, dmg: A(u, 1), knock: 220, extra: { big: true, onHit: (w2, p, e) => pierceMarked(w2, p, e) } }); },
  // shuriken (round 13: "Animations is off. Flickers. Should throw 1 then 2 at a time, then 3 at a time on repeat")
  ninja(w, u, t, a) {
    const k = u.kit, n = ((k.shN = (k.shN || 0) + 1) - 1) % 3 + 1;
    for (let i = 0; i < n; i++) shoot(w, u, a + (i - (n - 1) / 2) * 0.16, { kind: 'shuriken', speed: 560, r: 6, life: 0.7, dmg: A(u, 0.62), knock: 15 });
  },
  // a whirl and a stone (round 13: "Bone particles bad. Has a 25% chance to throw a large stone which staggers. Up close he
  // hits with cane")
  slinger(w, u, t, a) {
    if (dist(u.x, u.y, t.x, t.y) - u.r - t.r < 30) { u.facing = ang(u, t); setAnim(u, 'swing', 0.28); swingMark(w, u, u.r + 34, 1.6); hurt(w, t, A(u, 1.1), u, { knock: 160 }); return; }
    const big = rand() < 0.25; shoot(w, u, a, { kind: 'stone', speed: 580, r: big ? 10 : 6, dmg: A(u, big ? 1.4 : 1), knock: big ? 140 : 50, st: big ? { stagger: 35 } : {}, extra: { big } });
  },
  // the shotgun (round 13: "I want them to have a shotgun... Short range. Many pellets (each one is a projectile)")
  trapper(w, u, t, a) { k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a, max: 0.45, big: true }); u.recoilT = 0.2;
    for (let i = 0; i < 6; i++) shoot(w, u, a + (rand() - 0.5) * 0.5, { kind: 'pellet', speed: rrange(660, 820), r: 4, life: 0.34, dmg: A(u, 0.22), knock: 40 }); },

  // the Cultist (round 13: "Does a dagger swipe when close, and shadow bolt when far. Dagger applies bleed. If the bolt
  // hits a bleeding target they instantly burst."; round 19: "Bolt instead applies anti heal.": the bolt leaves Anti-heal
  // (ANTIHEAL.boltT s); disarmed, he can't swipe the dagger, so it is the bolt up close too)
  cultist(w, u, t, a) {
    if (dist(u.x, u.y, t.x, t.y) - u.r - t.r < 34 && !(u.disarmT > 0)) {
      u.facing = ang(u, t); setAnim(u, 'swing', 0.25); swingMark(w, u, u.r + 34, 1.6);
      hurt(w, t, A(u, 1.1), u, { knock: 80 }); addStatus(w, t, 'bleed', 26, u); u.recoilT = 0; return;
    }
    shoot(w, u, a, { kind: 'shadowBolt', speed: 470, r: 7, dmg: A(u, 1), color: '#9A5CC8', knock: 25, extra: { onHit: (w2, p, e) => { antiheal(w2, e, ANTIHEAL.boltT); } } });
  },
  // the Engineer (round 13: "Hits she. Close. Throw bouncing cogs from afar"): the wrench when close, else a cog thrown
  // that bounces on to the next enemy
  engineer(w, u, t, a) {
    if (dist(u.x, u.y, t.x, t.y) - u.r - t.r < 34) { u.facing = ang(u, t); setAnim(u, 'swing', 0.28); swingMark(w, u, u.r + 34, 1.6); hurt(w, t, A(u, 1.15), u, { knock: 150 }); return; }
    const cog = (x, y, e, left, skip) => { const b = angleTo(x, y, e.x, e.y); w.projectiles.push({ kind: 'cog', x, y, vx: Math.cos(b) * 480, vy: Math.sin(b) * 480, r: 8, team: u.team, owner: u, skip, dmg: A(u, left === 1 ? 0.75 : 0.5), o: { knock: 50 }, life: 0.9, a: b,
      onHit: (w2, p, h) => { if (left <= 0) return; const n = opponents(w2, u).filter((o) => o !== h && dist(o.x, o.y, h.x, h.y) < 160)[0]; if (n) cog(h.x, h.y, n, left - 1, h); } }); };
    cog(u.x + Math.cos(a) * u.r, u.y + Math.sin(a) * u.r, t, 1, null);
  },
  // a magenta pact bolt: a third of what it deals heals him
  warlock(w, u, t, a) { eyeBolt(w, u, a, A(u, 0.8), false, u.kit.bargainUntil > w.time ? u : null); },
};

// ---------------------------------------------------------------- every step (kits.js kitTick)
export function kit2Tick(w, u, dt) {
  if (u.k2) {
    for (const k of u.k2) { k.t -= dt; if (k.t > 0 && k.tick && k.tick(dt) === true) k.t = 0; if (k.t <= 0 && k.end) { const e = k.end; k.end = null; e(); } }
    u.k2 = u.k2.filter((k) => k.t > 0); if (!u.k2.length) u.k2 = null;
  }
  if (!u.kit) return;
  // Bear Claws: the club goes away while he claws (round 13: "(club goes away)"): its arm is hidden (the art has the club
  // in that hand: docs/HEROES-r13.md asks for the club as its own part)
  // (round 15, lane E: art round 12 gave the club its own part, #arm-r-club: parts.js hides that alone while u.kit.clawsT
  // runs, and the paw on his fist claws)
  // Warhelm: his hammer is out of his hand while it circles him (Storm Born) or flies ahead (Skull Splitter). (Round 15,
  // lane E: art round 12 split it from his fist, #arm-l-hammer: parts.js hides the hammer alone, his fist stays and punches.)
  if (u.kind === 'warhelm') u.kit.hammerOut = !!u.kit.storm || u.kit.splitT > w.time;
  if (u.kind === 'engineer') wrenchRepair(w, u, dt); // round 17 (lane tags17): the wrench mends her constructs
  // the Alchemist's hand shows the next flask they'll throw (round 13: "Bottle in hand should change to what she will throw")
  if (u.kind === 'alchemist' && (u.kit.handW !== w || !u.kit.handFx || u.kit.handFx.t >= u.kit.handFx.max)) { u.kit.handW = w; u.kit.handFx = k2(w, { draw: 'handFlask', unit: u, x: u.x, y: u.y, max: 1e9 }); }
  // the Chef's plates: a friend who walks over one eats it (healed; the rest past whole is extra health); hurt friends
  // with no enemy on them go and get one
  if (u.kit.foods && u.kit.foods.length) {
    const F = u.kit.foods, tier = tierOf(u, 'hotMeal');
    for (const fd of F) {
      if (fd.until < w.time) { fd.done = true; continue; }
      const who = w.units.find((o) => alive(o) && o.team === u.team && !o.summon && !o.def.cargo && dist(o.x, o.y, fd.x, fd.y) < o.r + 16);
      if (who) { fd.done = true; fd.f.max = fd.f.t; const amt = who.maxHp * 0.2, room = who.maxHp - who.hp; heal(w, who, amt, u); if (amt > room + 1) ward(w, who, Math.round((amt - room) * 0.8), 10);
        k2(w, { draw: 'crumbs', x: who.x, y: who.y, unit: who, max: 0.6, ab: 'hotMeal' }); if (tier >= 3) addBuff(who, { id: 'hotMeal', dur: 8, dealt: 1.2, glow: '#FFB070' }); continue; }
      for (const o of w.units) if (alive(o) && o.team === u.team && !o.summon && !o.def.cargo && hpRatio(o) < 0.75 && dist(o.x, o.y, fd.x, fd.y) < 260 && !(o.target && dist(o.x, o.y, o.target.x, o.target.y) < 120)) o.coinGoal = { x: fd.x, y: fd.y, d: dist(o.x, o.y, fd.x, fd.y) };
    }
    u.kit.foods = F.filter((fd) => !fd.done);
  }
  // the Crossbowman reloads 35% faster with a pavise of his close (II)
  if (u.kind === 'crossbowman' && tierOf(u, 'pavise') >= 2 && mine(w, u, 'pavise').some((p) => dist(p.x, p.y, u.x, u.y) < 90)) addBuff(u, { id: 'pavise', dur: 0.3, atkSpeed: 1.35 });
  if (u.kind === 'jester') juggleTick(w, u, dt);
  // the Gladiator's blows go slash, stab, slash, stab (round 13): his def swaps between the two after each
  if (u.kind === 'gladiator' && u.anim && u.anim !== u.kit.gAnim && (u.anim.kind === 'thrust' || u.anim.kind === 'swing') && u.anim.dur >= 0.25 && !u.kit.using) {
    u.kit.gAnim = u.anim; const k = u.kit; if (!k.stabDef) { k.stabDef = u.def; k.slashDef = { ...u.def, attackAnim: 'swing', weapon: 'blade', arc: 1.8 }; }
    u.def = u.def === k.slashDef ? k.stabDef : k.slashDef;
  }
  // the Trapper's bush creeps off: away from the enemies near, slowly
  if (u.kit.bushUntil > w.time) { const f = opponents(w, u).filter((e) => dist(e.x, e.y, u.x, u.y) < 260); if (f.length && !u.act) { let ax = 0, ay = 0; for (const e of f) { ax += u.x - e.x; ay += u.y - e.y; } const a = Math.atan2(ay, ax); u.forcedGoal = { x: clamp(u.x + Math.cos(a) * 80, u.r, w.W - u.r), y: clamp(u.y + Math.sin(a) * 80, u.r, w.H - u.r), slow: 0.6 }; } else u.forcedGoal = null; }
  else if (u.kit.bushUntil && u.kit.bushUntil <= w.time && u.forcedGoal) { u.forcedGoal = null; u.kit.bushUntil = 0; }
  // the Werewolf can't heal as a wolf (round 13: "Can't heal when in this form."): his health never rises while he is one
  if (u.kit.wolfUntil > w.time) { if (u.hp > u.kit.wolfHp) u.hp = u.kit.wolfHp; u.kit.wolfHp = u.hp; }
  // Valkyrie's Call III: the friend she carries rides along with her
  if (u.kit.carry) { const c = u.kit.carry; if (alive(c)) { c.x = u.x + Math.cos(u.facing + 1.6) * (u.r + c.r) * 0.6; c.y = u.y + Math.sin(u.facing + 1.6) * (u.r + c.r) * 0.6; c.hop = u.hop; c.vx = c.vy = c.kx = c.ky = 0; } }
  // the Samurai steps in with every cut (round 13: "Should dash forwards")
  if (u.def.style && u.def.style.lunge && u.anim && u.anim !== u.kit.cutAnim && u.anim.kind === 'swing' && u.anim.dur >= 0.25 && !u.act && !u.kit.using) { u.kit.cutAnim = u.anim; u.kx += Math.cos(u.facing) * 150; u.ky += Math.sin(u.facing) * 150; }
  // the Shaman's spirit bear: friends near it take 20% less (round 13: "Negates all damage around him by 20%")
  if (u.kind === 'shaman') for (const b of w.units) if (b.kind === 'spiritBear' && b.summonBy === u && alive(b)) for (const a of friendsNear(w, b, b.x, b.y, 120)) addBuff(a, { id: 'bearWard', dur: 0.3, taken: 0.8 });
  // the Haymaker's bale: when it is gone he drops off it; under him meanwhile the leap's hop is kept off (the bale's brain sets it)
  if (u.kit.bale && !alive(u.kit.bale)) baleBurst(w, u, u.kit.bale);
  // the Haymaker's pitchfork (round 13: "Should show 3 stab slashes. Should dash forwards slightly too"): every jab is a
  // little lunge (the three tines' streaks are the 'fork' weapon in fxkit)
  if (u.kind === 'haymaker' && u.anim && u.anim !== u.kit.jabAnim && u.anim.kind === 'thrust' && u.anim.dur >= 0.25 && !u.act) { u.kit.jabAnim = u.anim; u.kx += Math.cos(u.facing) * 110; u.ky += Math.sin(u.facing) * 110; }
  // the Digger's spade (round 13: "Slash also creates 3 dirt projectiles with short range")
  if (u.kind === 'digger' && u.anim && u.anim !== u.kit.slashAnim && u.anim.kind === 'swing' && u.anim.dur >= 0.25 && !u.act && !u.kit.using) {
    u.kit.slashAnim = u.anim; const a = u.facing;
    for (let i = -1; i <= 1; i++) shoot(w, u, a + i * 0.28, { kind: 'clod', speed: 420, r: 6, life: 0.32, dmg: dmgOf(u, 0.25), knock: 40 });
  }
  // the Shade's daggers (round 13: "Attacks in 2 stabs at a time, quickly 1 after the other"): each stab is followed at
  // once by one from the other hand
  // the Monk's Fists (round 19): the third blow of a run is swung bigger (parts.js anim.big)
  if (u.kind === 'monk' && u.anim && u.anim !== u.kit.fistAnim && u.anim.kind === 'punch') { u.kit.fistAnim = u.anim; if (!u.kit.using && u.kit.combo && u.kit.combo % 3 === 0 && w.time - (u.kit.comboAt ?? -9) < 0.05) { u.anim.big = true; u.anim.dur = Math.max(u.anim.dur, 0.36); } }
  if (u.kind === 'shade' && u.anim && u.anim !== u.kit.stabAnim && u.anim.kind === 'thrust' && u.anim.dur >= 0.25 && !u.act && !u.kit.using) {
    u.kit.stabAnim = u.anim;
    after(u, 0.1, () => { if (!alive(u) || u.act || !u.target) return; setAnim(u, 'thrust', 0.18); u.kit.stabAnim = u.anim; meleeSwing(w, u, true); });
  }
  // Stormhammer: while the hammer is out of his hand it isn't drawn in it (round 13: "doesnt show in their hand when thrown")
  if (u.kind === 'griffon') {
    const out = w.projectiles.some((p) => p.owner === u && p.kind === 'hammer' && p.life > 0);
    u.kit.hammerOut = out;
    // (round 19, lane sys19: his hammer is its own part now, arm-l-hammer, hidden by parts.js while it's out; his fist stays)
  }
  // Inner Peace (Monk): shots that reach him fly back at whoever loosed them; his palms are pressed together meanwhile
  if (u.kit.peaceUntil > w.time) {
    for (const p of w.projectiles) {
      if (p.team === u.team || p.noHit || p.life <= 0 || p.team === 'neutral' || dist(p.x, p.y, u.x, u.y) > u.r + p.r + 16) continue;
      const o = p.owner, sp = Math.hypot(p.vx, p.vy) * 1.1, a = o && alive(o) ? angleTo(p.x, p.y, o.x, o.y) : Math.atan2(-p.vy, -p.vx);
      p.team = u.team; p.owner = u; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.a = a; p.life = Math.max(p.life, 1); p.home = o && alive(o) ? o : null; p.turn = p.turn || 6; if (p.hitSet) p.hitSet = new Set();
      sparks(w, p.x, p.y, a, 6, '#FFE7A0', 1);
    }
    u._force = { 'arm-r': { r: 0.95, dy: 10, dx: 2 }, 'arm-l': { r: -0.95, dy: 10, dx: -2 } }; u.kit.palms = true;
  } else if (u.kit.palms) { u.kit.palms = false; u._force = null; }
  // Parry (Old Guard): a shot reaching him while he parries flies back at whoever loosed it
  const PR = u.kit.parry;
  if (PR && PR.until > w.time && PR.n > 0) for (const p of w.projectiles) {
    if (p.team === u.team || p.noHit || p.life <= 0 || p.team === 'neutral' || dist(p.x, p.y, u.x, u.y) > u.r + p.r + 16) continue;
    const o = p.owner, sp = Math.hypot(p.vx, p.vy) * 1.15, a = o && alive(o) ? angleTo(p.x, p.y, o.x, o.y) : Math.atan2(-p.vy, -p.vx);
    p.team = u.team; p.owner = u; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.a = a; p.life = Math.max(p.life, 1); p.home = o && alive(o) ? o : null; p.turn = p.turn || 6;
    p.dmg = Math.max(p.dmg || 6, dmgOf(u, 0.8)) * PR.k; if (p.hitSet) p.hitSet = new Set();
    PR.n--; if (PR.n <= 0) PR.until = w.time + 0.25;
    u.facing = a; setAnim(u, 'swing', 0.25); sparks(w, p.x, p.y, a, 7, '#FFF4C8', 1.1);
    k2(w, { draw: 'parry', x: u.x + Math.cos(a) * (u.r + 8), y: u.y + Math.sin(a) * (u.r + 8), a, max: 0.4, ab: 'pommelStrike' });
    textU(w, u.x, u.y, u.r + 8, 'PARRY', '#EEF3F8', 0.9);
    if (PR.n <= 0) break;
  }
  // Spirit Link: what each linked one lost since the last step is shared out evenly among them
  const L = u.kit.link;
  if (L) {
    if (L.until < w.time) u.kit.link = null;
    else {
      const live = L.group.map((a, i) => ({ a, i })).filter(({ a }) => alive(a));
      let lost = 0; for (const { a, i } of live) lost += Math.max(0, L.hp[i] - a.hp);
      if (lost > 0 && live.length > 1) { const share = lost / live.length; for (const { a, i } of live) a.hp = Math.min(a.maxHp, Math.max(1, a.hp + Math.max(0, L.hp[i] - a.hp) - share)); }
      L.hp = L.group.map((a) => a.hp);
    }
  }
  // Pitch Hay II: dry hay burns: burn builds twice as fast on those it covers
  if (u.kit.hayed) {
    for (const h of u.kit.hayed) { const b = h.e.st.burn || 0; if (b > h.last && alive(h.e)) h.e.st.burn = b + (b - h.last); h.last = h.e.st.burn || 0; }
    u.kit.hayed = u.kit.hayed.filter((h) => h.until > w.time && alive(h.e));
  }
  // the Warlock's eye bolts and the Harpooner's harpoon come back to whoever threw them
  for (const p of w.projectiles) if (p.catchBy && (p.kind === 'eyeBolt' || p.kind === 'harpoon') && p.back && alive(p.catchBy) && dist(p.x, p.y, p.catchBy.x, p.catchBy.y) < p.catchBy.r + 6) p.life = 0;
  // the Stormhammer comes back to his hand
  for (const p of w.projectiles) if (p.catchBy === u && dist(p.x, p.y, u.x, u.y) < u.r + 8) p.life = 0;
}
