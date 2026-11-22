// Round 15 (lane N): the kits of the six heroes in heroes3.js (the Mob, the Clockmaker, the Air Mage, the Warden, the
// Telekinetic, the Earth Mage), in kits2.js's shape and built from its shared pieces (onUnit timed hooks, timers on the
// caster, k2 looks). Merged into ABILITIES / TRAITS / ATTACKS by kits.js; kit3Tick runs from kitTick.
// The looks are in fx3.js ('k2' fx with a `draw` name, shots of new kinds). Every number here is in docs/HEROES-r15.md.
// The designer's standing rules for this file: no three abilities that are all "damage in a shape" (each hero's three
// do three different jobs), nothing that only shows as a word popping up, nothing too weak to be worth its button.
import { TAU, clamp, dist, angleTo, angleDiff, rand, rrange } from './util.js';
import { hurt, alive, opponents, allies, hpRatio, puff, setAnim, blocked, addBuff, fx, cleanse, sparks, wallRect } from './sim.js';
import { lineClear, buildGrid } from './path.js';
import { foesNear, friendsNear, dmgOf, ang, cast, heal, addStatus, shoot, segDist, withAb, rectGap } from './kits.js';
import { k2, after, timer, onUnit, offUnit, isOn, flung, shove, interrupt, foeWinding, whirl, inFront } from './kits2.js';
import { bodiesOf, leadOf, mobMid } from './mob.js';
import { freshStatuses } from './statuses.js';
import { CUR } from './stats.js'; // (which ability is running right now: fxtag.js sets it, also for what an ability left to happen later)

const tierOf = (u, id) => (u.kit && u.kit.tiers[id]) || 0;
const ease = (k) => 1 - (1 - k) * (1 - k);
const lerp = (a, b, k) => a + (b - a) * k;
const inRoom = (w, x, y, pad = 24) => [clamp(x, pad, w.W - pad), clamp(y, pad, w.H - pad)];
const bossy = (e) => !!(e.def.boss || e.def.part || e.fixed);
// what an ability leaves ticking keeps the ability's own web nodes (its damage, its statuses)
const held = (u, f) => withAb(u, u.kit && u.kit.using, f);
// the middle of the enemies near a point (or the point itself)
function knot(w, u, x, y, r) { const L = foesNear(w, u, x, y, r); if (!L.length) return { x, y, n: 0, list: L }; let cx = 0, cy = 0; for (const e of L) { cx += e.x; cy += e.y; } return { x: cx / L.length, y: cy / L.length, n: L.length, list: L }; }
// how much an enemy is worth stopping right now: a shooter, a caster, an elite, one in the middle of something
const menace = (w, e) => (e.def.role === 'ranged' ? 0.25 : 0) + (e.def.ability || e.def.brain || e.eliteFn || e.kit ? 0.2 : 0) + (e.elite ? 0.15 : 0) + (e.major || e.mini ? 0.1 : 0) + (foeWinding(w, e) ? 0.3 : 0)
  + (e.target && e.target.team !== e.team && hpRatio(e.target) < 0.4 ? 0.2 : 0);
const squishy = (a) => { const r = a.def.heroRole; return r === 'ranged' || r === 'caster' || r === 'support'; };

// ---------------------------------------------------------------- the Mob
// Its abilities are the four's together, so their damage is counted against the four's blows together (PACK x the
// torch-bearer's own 4.2 is a plain fighter's 13).
const PACK = 3.1;
const D = (u, k) => dmgOf(leadOf(u), k) * PACK;
const bodyOf = (u, kind) => bodiesOf(u).find((b) => b.kind === kind) || leadOf(u);
// a body under the ability's orders: it stands where it is put (the usual brain waits)
const order = (b, dur, t) => { b.act = { type: 'channel', t: dur, max: dur, acc: 0, every: 99, tick() {}, target: t || null, mob: true }; b.forcedGoal = null; };
const release = (b) => { if (b.act && b.act.mob) b.act = null; };

// ---------------------------------------------------------------- the Clockmaker's memory
// Every quarter of a second he notes where each of the party is and how they are (six seconds are kept). Rewind and
// his trait read it back.
const HIST = 6;
function remember(w, u, dt) {
  const k = u.kit; k.memT = (k.memT || 0) - dt; if (k.memT > 0 && k.memW === w) return; k.memT = 0.25; k.memW = w;
  for (const a of w.units) {
    if (a.team !== u.team || a.summon || a.def.cargo || a.dead) continue;
    const H = a._hist && a._histW === w ? a._hist : (a._histW = w, a._hist = []);
    H.push({ t: w.time, x: a.x, y: a.y, hp: a.downed ? 0 : a.hp, down: !!a.downed, st: { ...a.st }, held: a.stunT > 0.3 || a.frozenT > 0 || a.rootT > 0.3 || a.sleepT > 0 || a.koT > 0 });
    while (H.length && H[0].t < w.time - HIST) H.shift();
  }
}
// how a unit was `back` seconds ago (the oldest note if the notes don't go that far)
function pastOf(w, a, back) { const H = a._histW === w ? a._hist : null; if (!H || !H.length) return null; let p = H[0]; for (const h of H) if (h.t <= w.time - back) p = h; else break; return p; }
function pickRewind(w, u, tier) {
  const back = tier >= 2 ? 5 : 3, cap = tier >= 2 ? 0.5 : 0.35; let best = null, bs = 0;
  for (const a of w.units) {
    if (a.team !== u.team || a.summon || a.def.cargo || a.dead || (a.ethereal && !a.downed) || dist(u.x, u.y, a.x, a.y) > 480) continue;
    const p = pastOf(w, a, back); if (!p) continue;
    let s;
    if (a.downed) { if (tier < 3 || u.kit.rewindW === w || p.down || a === u) continue; s = 2; }
    else {
      const gain = Math.min(Math.max(0, p.hp - a.hp), a.maxHp * cap) / a.maxHp; let stG = 0; for (const k in a.st) stG += Math.max(0, (a.st[k] || 0) - (p.st[k] || 0));
      const stuck = (a.stunT > 0.5 || a.frozenT > 0.5 || a.rootT > 0.8 || a.sleepT > 0.5) && !p.held;
      if (gain < 0.1 && !stuck && stG < 70) continue;
      s = gain + Math.min(0.2, stG / 500) + (stuck ? 0.15 : 0);
    }
    if (s > bs) { bs = s; best = { a, p, back, cap, s }; }
  }
  return best;
}
function rewindLook(w, a, p) {
  const path = (a._hist || []).filter((h) => h.t >= p.t).map((h) => [h.x, h.y]); path.push([a.x, a.y]);
  k2(w, { draw: 'rewind', x: a.x, y: a.y, path, x1: p.x, y1: p.y, r: a.vr, max: 0.95, who: a });
}
function putBack(w, a, p) {
  [a.x, a.y] = inRoom(w, p.x, p.y, a.r); a.vx = a.vy = a.kx = a.ky = 0; a.path = null; a.spd = 0;
  (a.bodies || []).forEach((b, i) => { [b.x, b.y] = inRoom(w, p.x + Math.cos(i * 2.1) * 30, p.y + Math.sin(i * 2.1) * 30, b.r); b.vx = b.vy = b.kx = b.ky = 0; });
  for (const k in a.st) a.st[k] = Math.min(a.st[k] || 0, p.st[k] || 0);
  if (!p.held) { a.stunT = 0; a.rootT = 0; a.frozenT = 0; a.sleepT = 0; a.koT = 0; }
  if (!(p.st.poison > 0)) a.sickT = 0;
  a.addledT = 0; a.fearT = 0;
}

// ---------------------------------------------------------------- the Telekinetic's things to throw
// The nearest loose heavy thing in the room: a plain rock, barrel or post (not a fountain, a tree, a boss room's
// pillar, a troll's boulder, anything with health of its own). null: she tears a slab out of the floor instead.
function looseThing(w, u, reach = 330) {
  if (w.throne || w.arenaDecor || w.arenaAir) return null;
  let best = null, bd = reach;
  for (const p of w.pillars) { if (p.fountain || p.tree || p.ice || p.owner || p.held || p.hp != null || p.painted || p.vx || p.vy || p.taken) continue; const d = dist(u.x, u.y, p.x, p.y) - p.r; if (d < bd) { bd = d; best = p; } }
  return best;
}
// a thing lifted off the floor at (x0, y0), hung a moment, then flung to (x1, y1), where it bursts
function hurlThing(w, u, x0, y0, x1, y1, thing, big, tier) {
  const R = (big ? 70 : 60) + (tier >= 3 ? 26 : 0), LIFT = 0.3, FLY = 0.34;
  k2(w, { draw: 'tkThrow', x: x0, y: y0, x1, y1, r: thing ? thing.r : 22, pillar: thing ? { r: thing.r } : null, lift: LIFT, fly: FLY, max: LIFT + FLY, from: u });
  after(u, LIFT + FLY, held(u, () => {
    k2(w, { draw: 'rockBurst', x: x1, y: y1, r: R, max: 0.6, shards: tier >= 3 });
    w.shake = Math.max(w.shake, big ? 7 : 5);
    for (const e of foesNear(w, u, x1, y1, R)) hurt(w, e, dmgOf(u, big ? 2 : 1.7), u, { knock: 300, kAngle: angleTo(x1, y1, e.x, e.y), heavy: true, noDodge: true, stagger: tier >= 3 ? 55 : 20 });
  }));
}

// ---------------------------------------------------------------- abilities
export const ABILITIES3 = {
  // ================================================================ the Mob
  // Pile On: a lockdown. All four jump on one enemy and hold it; the party hits it harder; only the dagger works.
  pileOn: {
    score(w, u, t) {
      if (!t || !alive(t) || t.ethereal || u.kit.pile || dist(u.x, u.y, t.x, t.y) - t.r > 230 || blocked(w, u.x, u.y, t.x, t.y)) return 0;
      return 0.45 + menace(w, t) * 0.8 + (hpRatio(t) > 0.5 ? 0.1 : 0) - (t.def.boss ? 0.1 : 0);
    },
    use(w, u, t, tier) {
      const B = bodiesOf(u), hold = (tier >= 2 ? 3 : 2.2) * (t.def.boss ? 0.4 : 1), a0 = angleTo(t.x, t.y, u.x, u.y), T0 = 0.26, dagger = bodyOf(u, 'mobDagger');
      const spot = (b, i) => { const a = a0 + i * TAU / 4, R = t.r + b.r * 0.8; return [t.x + Math.cos(a) * R, t.y + Math.sin(a) * R, a]; };
      u.kit.pile = t;
      B.forEach((b, i) => { const [x1, y1] = spot(b, i); b.forcedGoal = null; b.target = t;
        b.act = { type: 'leap', t: T0, max: T0, x0: b.x, y0: b.y, x1, y1, mob: true, land: () => order(b, hold + 0.1, t) }; });
      after(u, T0, () => {
        if (!alive(t)) return;
        onUnit(w, t, 'piled', hold, { taken: (w2, u2, s2, amt, o) => (o.dot ? amt : amt * 1.25), tick(w2, u2) { u2.stunT = Math.max(u2.stunT, 0.12); u2.kx = u2.ky = 0; if (u2.act && u2.act.type !== 'slip') u2.act = null; } });
        interrupt(w, t);
        k2(w, { draw: 'scuffle', unit: t, x: t.x, y: t.y, r: t.vr + 14, max: hold });
        w.shake = Math.max(w.shake, 3);
      });
      let el = 0, stabT = 0.15;
      timer(u, 'pile', T0 + hold, (dt) => {
        el += dt; if (!alive(t)) return true; if (el < T0) return false;
        B.forEach((b, i) => { if (!b.act || !b.act.mob) return; const [x, y, a] = spot(b, i); b.x = x; b.y = y; b.vx = b.vy = b.kx = b.ky = 0; b.facing = a + Math.PI; });
        stabT -= dt; if (stabT <= 0) { stabT = 0.42; setAnim(dagger, 'thrust', 0.2); hurt(w, t, D(u, 0.3), dagger, { knock: 0, noDodge: true, bleed: 10 }); }
        return false;
      }, () => {
        u.kit.pile = null; for (const b of B) release(b); offUnit(t, 'piled');
        if (tier >= 3 && alive(t) && !bossy(t)) { // the heave: thrown clear, knocked out where it lands
          const m = mobMid(u), a = angleTo(m.x, m.y, t.x, t.y) + rrange(-0.3, 0.3);
          for (const b of B) setAnim(b, 'swing', 0.3);
          k2(w, { draw: 'heave', x: t.x, y: t.y, a, max: 0.4 });
          hurt(w, t, D(u, 0.9), u, { knock: 0, noDodge: true, heavy: true }); shove(t, a, 700);
          flung(w, u, t, 1, (e) => { hurt(w, e, D(u, 0.8), u, { noDodge: true, heavy: true, knock: 0 }); addStatus(w, e, 'stagger', 100, u); });
          after(u, 0.5, () => { if (alive(t) && !(t.koT > 0)) addStatus(w, t, 'stagger', 100, u); });
        }
      });
    },
    show: { single: true },
  },
  // Surround: a herding. The four run out round the enemies and close in, shoving them into one knot.
  surround: {
    score(w, u, t) { if (!t || u.kit.pile) return 0; const K = knot(w, u, t.x, t.y, 170), n = K.list.filter((e) => !bossy(e)).length; return dist(u.x, u.y, K.x, K.y) > 300 ? 0 : n >= 3 ? 0.85 : n === 2 ? 0.5 : 0; },
    use(w, u, t, tier) {
      const B = bodiesOf(u), K = knot(w, u, t.x, t.y, 170), cx = K.x, cy = K.y, T1 = 0.36, T2 = 0.36;
      const R = clamp(Math.max(60, ...K.list.map((e) => dist(e.x, e.y, cx, cy) + e.r)) + 24, 76, 180), a0 = angleTo(cx, cy, u.x, u.y), hit = new Set();
      const S = B.map((b, i) => { const a = a0 + i * TAU / 4, [x1, y1] = inRoom(w, cx + Math.cos(a) * R, cy + Math.sin(a) * R, b.r); order(b, T1 + T2 + 0.05, t); return { b, a, x0: b.x, y0: b.y, x1, y1 }; });
      k2(w, { draw: 'herd', x: cx, y: cy, r: R, a: a0, t1: T1, max: T1 + T2 + 0.3 });
      let el = 0;
      timer(u, 'surround', T1 + T2, (dt) => {
        el += dt;
        if (el < T1) { const k = ease(el / T1); for (const s of S) { s.b.x = lerp(s.x0, s.x1, k); s.b.y = lerp(s.y0, s.y1, k); s.b.vx = s.b.vy = 0; s.b.facing = angleTo(s.x0, s.y0, s.x1, s.y1); s.b.spd = 200; if (rand() < dt * 30) puff(w, s.b.x, s.b.y, '#D9CDB0', 1, 30, 5, 0.3); } return false; }
        const k = clamp((el - T1) / T2, 0, 1), r = lerp(R, 36, ease(k));
        for (const s of S) { const ex = cx + Math.cos(s.a) * r, ey = cy + Math.sin(s.a) * r; s.b.x = lerp(s.x1, ex, ease(k)); s.b.y = lerp(s.y1, ey, ease(k)); s.b.vx = s.b.vy = 0; s.b.facing = s.a + Math.PI; s.b.spd = 200; }
        for (const e of opponents(w, u)) {
          if (hit.has(e)) continue; const d = dist(e.x, e.y, cx, cy); if (d > R + 20 || d + e.r * 0.4 < r - 6) continue;
          hit.add(e); const by = S.reduce((p, s) => (dist(s.b.x, s.b.y, e.x, e.y) < dist(p.b.x, p.b.y, e.x, e.y) ? s : p)).b, a = angleTo(e.x, e.y, cx, cy);
          setAnim(by, by.def.attackAnim || 'swing', 0.25);
          hurt(w, e, D(u, 0.65), by, { knock: 0, noDodge: true, stagger: 14 });
          if (!bossy(e)) { const pull = 5 * Math.max(0, d - 24) * (e.mass >= 3 ? 0.5 : 1); e.kx += Math.cos(a) * pull; e.ky += Math.sin(a) * pull; }
        }
        return false;
      }, held(u, () => {
        for (const s of S) release(s.b);
        if (tier >= 2) { // the torch lights the ground where they met
          setAnim(u, 'swing', 0.3);
          k2(w, { draw: 'torchFire', x: cx, y: cy, r: 62, max: 4, every: 0.4, src: u, tick: held(u, () => { for (const e of foesNear(w, u, cx, cy, 62)) { addStatus(w, e, 'burn', 15, u); hurt(w, e, D(u, 0.12), u, { dot: true, color: '#FF9A55' }); } }) });
        }
        if (tier >= 3) for (const e of hit) if (alive(e)) { e.stunT = Math.max(e.stunT, e.def.boss ? 0.45 : 1.2); if (e.act && e.act.type !== 'slip') e.act = null; k2(w, { draw: 'tumble', unit: e, x: e.x, y: e.y, r: e.vr, max: e.def.boss ? 0.45 : 1.2 }); }
        w.shake = Math.max(w.shake, 4);
      }));
    },
  },
  // Scatter: the way out. The leash is let go: four ways at once, half the damage, whoever chased them loses them.
  scatter: {
    score(w, u) {
      if (u.kit.pile || u.mobLoose > w.time) return 0;
      const B = bodiesOf(u), on = opponents(w, u).filter((e) => e.target && (e.target === u || e.target.partOf === u) && dist(e.x, e.y, e.target.x, e.target.y) < 170).length;
      const zone = w.danger.filter((z) => z.team !== u.team && z.t > 0 && z.t < 0.7).some((z) => B.filter((b) => dist(b.x, b.y, z.x ?? z.x1, z.y ?? z.y1) < (z.r || z.r1 || 80) + 20).length >= 2);
      return zone ? 0.85 : on >= 2 && hpRatio(u) < 0.6 ? 0.55 + 0.1 * Math.min(3, on) : on >= 4 && hpRatio(u) < 0.85 ? 0.5 : 0;
    },
    use(w, u, t, tier) {
      const B = bodiesOf(u), dur = 3, m = mobMid(u);
      u.mobLoose = w.time + dur;
      addBuff(u, { id: 'scatter', dur, taken: 0.5, move: 1.2, ...(tier >= 3 ? { atkSpeed: 2 } : {}) });
      k2(w, { draw: 'scatterBurst', x: m.x, y: m.y, max: 0.45 });
      // away from the nearest enemy, fanned out four ways
      const f = opponents(w, u).sort((p, q) => dist(m.x, m.y, p.x, p.y) - dist(m.x, m.y, q.x, q.y))[0], base = f ? angleTo(f.x, f.y, m.x, m.y) : u.facing + Math.PI;
      B.forEach((b, i) => { const a = base + (i - 1.5) * 1.15; release(b); b.target = null; b.act = { type: 'dash', t: 0.3, max: 0.3, a };
        const [gx, gy] = inRoom(w, b.x + Math.cos(a) * 190, b.y + Math.sin(a) * 190, 40); b.runTo = { x: gx, y: gy, until: w.time + 0.9 };
        k2(w, { draw: 'haste', unit: b, x: b.x, y: b.y, r: b.vr, max: dur }); });
      for (const e of opponents(w, u)) if (e.target && (e.target === u || e.target.partOf === u)) { e.target = null; e.tauntBy = null; e.tauntT = 0; e.thinkT = rrange(0.35, 0.8); e.act = e.act && (e.act.type === 'windup' || e.act.type === 'chargeTell') ? null : e.act; }
      timer(u, 'scatter', dur, () => { for (const b of B) { if (b.runTo && b.runTo.until > w.time && !b.act) b.forcedGoal = b.runTo; else if (b.forcedGoal && b.forcedGoal === b.runTo) { b.forcedGoal = null; b.runTo = null; } } return false; },
        () => { for (const b of B) { if (b.forcedGoal === b.runTo) b.forcedGoal = null; b.runTo = null; }
          if (tier >= 2 && alive(u)) { heal(w, u, u.maxHp * 0.14, u); for (const b of B) k2(w, { draw: 'rally', unit: b, x: b.x, y: b.y, r: b.vr, max: 0.8, cols: ['#9BE07A', '#D6F5BE'] }); } });
    },
    show: { hitme: true },
  },

  // ================================================================ the Clockmaker
  // Rewind: one friend put back where and how they were a few seconds ago.
  rewind: {
    score(w, u, t, tier) { const P = pickRewind(w, u, tier); return !P ? 0 : P.a.downed ? 1 : clamp(0.15 + P.s * 2.2, 0, 0.95); },
    use(w, u, t, tier) {
      const P = pickRewind(w, u, tier); if (!P) return;
      const { a, p, cap } = P; cast(u, 'cast', 0.5);
      rewindLook(w, a, p);
      after(u, 0.34, held(u, () => {
        if (a.dead) return;
        if (a.downed) { a.downed = false; a.reviveT = 0; a.hp = 1; a.invulnT = 1.2; a.revivedByKit = true; a.st = freshStatuses(); u.kit.rewindW = w; }
        const lost = Math.max(0, p.hp - a.hp);
        putBack(w, a, p);
        heal(w, a, Math.min(lost, a.maxHp * cap), u); a.mendGlow = w.time + 0.4;
        k2(w, { draw: 'clockFlash', x: a.x, y: a.y, r: a.vr + 12, max: 0.5 });
      }));
    },
    show: { ally: true, strikeAlly: 0.55 },
  },
  // Slow Time: a bubble where the enemies' clocks run at 45%: walking, striking, winding up, recharging, their shots.
  timeBubble: {
    score(w, u, t) { if (!t) return 0; const K = knot(w, u, t.x, t.y, 120); return K.n >= 3 ? 0.9 : K.n === 2 ? 0.7 : menace(w, t) > 0.4 ? 0.45 : 0; },
    use(w, u, t, tier) {
      const K = knot(w, u, t.x, t.y, 120), r = tier >= 3 ? 150 : 115, dur = tier >= 3 ? 7 : 5, k = 0.45, x = K.x, y = K.y;
      cast(u, 'cast', 0.5);
      k2(w, { draw: 'timeBubble', x, y, r, max: dur });
      timer(u, 'bubble' + Math.round(w.time * 10), dur, (dt) => {
        const lag = dt * (1 - k);
        for (const e of foesNear(w, u, x, y, r)) {
          addBuff(e, { id: 'slowTime', dur: 0.25, move: k, atkSpeed: k, wash: ['#8FB8E0', 0.2] });
          e.abilT += lag; if (e.kit) for (const c in e.kit.cd) e.kit.cd[c] += lag;
          const E = e.el; if (E) { if (E.dueLen) for (const c in E.dueLen) if (typeof E[c] === 'number') E[c] += lag; if (E.holdT > 0) E.holdT += lag; }
          if (e.act && e.act.t != null && (e.act.type === 'windup' || e.act.type === 'chargeTell' || e.act.type === 'slam' || e.act.type === 'channel')) e.act.t += lag;
          if (e.dashT != null) e.dashT += lag;
        }
        for (const z of w.danger) if (z.team !== u.team && z.t > 0 && z.src && alive(z.src) && dist(z.src.x, z.src.y, x, y) < r + z.src.r) z.t += lag;
        for (const p of w.projectiles) if (p.team !== u.team && p.team !== 'neutral' && p.life > 0 && dist(p.x, p.y, x, y) < r) { p.x -= p.vx * lag; p.y -= p.vy * lag; p.life += lag; }
        if (tier >= 2) for (const a of friendsNear(w, u, x, y, r)) { addBuff(a, { id: 'fastTime', dur: 0.25, move: 1.3, atkSpeed: 1.3 }); if (a.kit && !a.partOf) for (const c in a.kit.cd) a.kit.cd[c] -= dt * 0.3; }
        return false;
      });
    },
    show: { far: true, shootme: true },
  },
  // Stop the Clock: every enemy and every enemy shot in the room hangs where it is.
  stopClock: {
    score(w, u) {
      const F = opponents(w, u).filter((e) => e.aggro && dist(e.x, e.y, u.x, u.y) < 460); if (!F.length) return 0;
      const shots = w.projectiles.filter((p) => p.team !== u.team && p.team !== 'neutral' && !p.noHit).length, wind = F.filter((e) => foeWinding(w, e)).length;
      const low = [u, ...allies(w, u)].some((a) => !a.summon && hpRatio(a) < 0.35 && F.some((e) => e.target === a));
      return clamp((F.length >= 3 ? 0.35 : 0.1) + Math.min(0.3, shots * 0.08) + Math.min(0.4, wind * 0.2) + (low ? 0.4 : 0), 0, 0.95);
    },
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 2 : 1.4; cast(u, 'ability', 0.6);
      k2(w, { draw: 'clockStop', x: u.x, y: u.y, r: Math.hypot(w.W, w.H) * 0.6, max: dur + 0.35, dur });
      for (const e of opponents(w, u)) {
        const T = e.def.boss || e.def.part ? dur * 0.43 : dur;
        e.stunT = Math.max(e.stunT, T); addBuff(e, { id: 'stopped', dur: T, wash: ['#DCE6F2', 0.5] });
        k2(w, { draw: 'stoppedDial', unit: e, x: e.x, y: e.y, r: e.vr, max: T + 0.25, dur: T });
        const h = onUnit(w, e, 'stopped', T, { taken(w2, u2, s2, amt, o) { if (!o.catchUp) this.got = (this.got || 0) + amt; return amt; } },
          tier >= 3 ? held(u, (u2) => { const got = h.got || 0; if (got > 1 && alive(u2)) { k2(w, { draw: 'clockFlash', x: u2.x, y: u2.y, r: u2.vr + 12, max: 0.45 }); hurt(w, u2, got / 3, u, { noDodge: true, proc: true, catchUp: true, knock: 60 }); } }) : null);
      }
      const hung = new Set();
      timer(u, 'stopClock', dur, (dt) => {
        for (const p of w.projectiles) if (p.team !== u.team && p.team !== 'neutral' && p.life > 0) { if (!hung.has(p)) { hung.add(p); p.hungV = [p.vx, p.vy]; p.vx = p.vy = 0; } p.life += dt; }
        for (const z of w.danger) if (z.team !== u.team && z.t > 0) z.t += dt;
        return false;
      }, () => { for (const p of hung) if (p.hungV) { [p.vx, p.vy] = p.hungV; p.hungV = null; } });
    },
    show: { far: true, shootme: true },
  },

  // ================================================================ the Air Mage
  // Gale: a push. Everything in a wide lane is blown far back and whirled; what hits a wall is hurt by it.
  gale: {
    score(w, u, t, tier) {
      if (!t) return 0; const a = ang(u, t), hw = tier >= 3 ? 85 : 58, L = 320, ex = u.x + Math.cos(a) * L, ey = u.y + Math.sin(a) * L;
      const F = opponents(w, u).filter((e) => segDist(e.x, e.y, u.x, u.y, ex, ey) < hw + e.r * 0.5 && inFront(u, e, 2.6) && !bossy(e));
      const close = F.filter((e) => dist(e.x, e.y, u.x, u.y) < 130 && e.target && e.target.team === u.team).length;
      return F.length >= 3 ? 0.9 : F.length === 2 ? 0.7 : close ? 0.7 : F.length ? 0.3 : 0;
    },
    use(w, u, t, tier) {
      const a = ang(u, t), hw = tier >= 3 ? 85 : 58, L = 320, ex = u.x + Math.cos(a) * L, ey = u.y + Math.sin(a) * L, amt = tier >= 3 ? 60 : 40;
      u.facing = a; cast(u, 'cast', 0.5); u.recoilT = 0.2;
      k2(w, { draw: 'gale', x: u.x, y: u.y, a, r: L, hw, max: 0.7 });
      after(u, 0.1, held(u, () => {
        for (const e of opponents(w, u)) {
          if (segDist(e.x, e.y, u.x, u.y, ex, ey) > hw + e.r * 0.5 || angleDiff(angleTo(u.x, u.y, e.x, e.y), a) > 1.4) continue;
          const d = dist(u.x, u.y, e.x, e.y);
          hurt(w, e, dmgOf(u, 0.9), u, { knock: 0, noDodge: true }); whirl(w, e, amt, u);
          if (bossy(e)) continue;
          shove(e, a, 640 * (1 - 0.35 * clamp(d / L, 0, 1)));
          flung(w, u, e, 1.1, (f) => { k2(w, { draw: 'slamPuff', x: f.x, y: f.y, r: f.vr + 10, max: 0.4 }); hurt(w, f, dmgOf(u, 0.9), u, { noDodge: true, heavy: true, knock: 0, stagger: 30, ab: 'gale' }); },
            (o) => hurt(w, o, dmgOf(u, 0.35), u, { noDodge: true, knock: 120, kAngle: a, ab: 'gale' }));
        }
        if (tier >= 2) for (const p of w.projectiles) {
          if (p.team === u.team || p.team === 'neutral' || p.noHit || p.life <= 0 || segDist(p.x, p.y, u.x, u.y, ex, ey) > hw) continue;
          const o = p.owner, sp = Math.max(300, Math.hypot(p.vx, p.vy)), b = o && alive(o) ? angleTo(p.x, p.y, o.x, o.y) : a;
          p.team = u.team; p.owner = u; p.vx = Math.cos(b) * sp; p.vy = Math.sin(b) * sp; p.a = b; p.life = Math.max(p.life, 1); p.home = null; if (p.hitSet) p.hitSet = new Set();
        }
      }));
    },
  },
  // Updraft: a lift. One enemy (II: and those beside it) hangs helpless in the air, then is dropped.
  updraft: {
    score(w, u, t, tier) { if (!t || bossy(t) || isOn(w, t, 'lifted')) return 0; const n = tier >= 2 ? foesNear(w, u, t.x, t.y, 75).length - 1 : 0; return clamp(0.35 + menace(w, t) + 0.12 * n, 0, 0.92); },
    use(w, u, t, tier) {
      const dur = 1.8, L = (tier >= 2 ? foesNear(w, u, t.x, t.y, 75) : [t]).slice(0, 5);
      cast(u, 'cast', 0.5);
      k2(w, { draw: 'updraft', x: t.x, y: t.y, r: tier >= 2 ? 80 : 44, max: dur + 0.2, dur });
      for (const e of L) {
        if (bossy(e)) { addStatus(w, e, 'stagger', 40, u); whirl(w, e, 30, u); continue; }
        interrupt(w, e); let el = 0;
        onUnit(w, e, 'lifted', dur, { tick(w2, u2, dt) { el += dt; u2.stunT = Math.max(u2.stunT, 0.12); u2.kx *= 0.8; u2.ky *= 0.8;
          u2.hop = el < 0.3 ? 52 * ease(el / 0.3) : el > dur - 0.16 ? 52 * Math.max(0, (dur - el) / 0.16) : 52 + Math.sin((el - 0.3) * 6) * 5; } },
        held(u, (u2) => {
          u2.hop = 0; if (!alive(u2)) return;
          k2(w, { draw: 'slamPuff', x: u2.x, y: u2.y, r: u2.vr + 12, max: 0.45 }); w.shake = Math.max(w.shake, 3);
          hurt(w, u2, dmgOf(u, 1.3), u, { noDodge: true, heavy: true, knock: 0, stagger: tier >= 3 ? 100 : 45 });
          if (tier >= 3 && u2.k2s && u2.k2s.whirl > 0) whirl(w, u2, 100, u);
        }));
        whirl(w, e, 20, u);
      }
    },
    show: { far: true },
  },
  // Cyclone: a pull. A whirlwind that wanders after the enemies, drags them in, batters and whirls them.
  cyclone: {
    score(w, u, t) { if (!t) return 0; const K = knot(w, u, t.x, t.y, 150); return K.n >= 3 ? 0.85 : K.n === 2 ? 0.65 : 0; },
    use(w, u, t, tier) {
      const K = knot(w, u, t.x, t.y, 150), dur = tier >= 2 ? 7 : 5, r = 78, pull = tier >= 2 ? 150 : 100;
      cast(u, 'cast', 0.5);
      let n = 0;
      const f = k2(w, { draw: 'cyclone', x: K.x, y: K.y, r, max: dur, follow: true, src: u, every: 0.25, tick: held(u, (z) => {
        n++;
        for (const e of foesNear(w, u, z.x, z.y, r + 40)) {
          const d = dist(e.x, e.y, z.x, z.y), a = angleTo(e.x, e.y, z.x, z.y);
          if (!bossy(e) && d > 14) { const k = pull * 0.9 * (e.mass >= 3 ? 0.5 : 1); e.kx += Math.cos(a + 0.5) * k; e.ky += Math.sin(a + 0.5) * k; }
          if (d < r + e.r * 0.5) { whirl(w, e, 9, u); if (n % 2 === 0) hurt(w, e, dmgOf(u, 0.32), u, { knock: 0, noDodge: true }); }
        }
      }) });
      if (tier >= 3) after(u, dur - 0.05, held(u, () => {
        k2(w, { draw: 'windClap', x: f.x, y: f.y, r: r + 50, max: 0.5 });
        for (const e of foesNear(w, u, f.x, f.y, r + 40)) { hurt(w, e, dmgOf(u, 1), u, { knock: 0, noDodge: true }); if (!bossy(e)) shove(e, angleTo(f.x, f.y, e.x, e.y), 480); whirl(w, e, 40, u); }
      }));
    },
    show: { far: true },
  },

  // ================================================================ the Warden
  // Manacles: a shutdown. The enemy with the most to lose is Shackled at once.
  manacle: {
    score(w, u) { const e = manacleTarget(w, u); return e ? clamp(0.45 + menace(w, e), 0, 0.92) : 0; },
    use(w, u, t, tier) {
      const e0 = manacleTarget(w, u) || t; if (!e0) return;
      cast(u, 'throw', 0.4); u.facing = ang(u, e0);
      const fling = (from, e, left) => {
        const a = angleTo(from.x, from.y, e.x, e.y);
        const p = shoot(w, u, a, { kind: 'manacles', speed: 560, r: 8, life: 1.3, dmg: dmgOf(u, 0.5), knock: 20, extra: { home: e, turn: 7, onHit: held(u, (w2, p2, hit) => {
          addStatus(w2, hit, 'shackle', 110, u);
          if (tier >= 2 && hit.shackledT > 0 && !bossy(hit)) { hit.rootT = Math.max(hit.rootT || 0, hit.shackledT); k2(w2, { draw: 'stake', unit: hit, x: hit.x, y: hit.y, r: hit.vr, max: hit.shackledT }); }
          if (left > 0) { const n = opponents(w2, u).filter((o) => o !== hit && !(o.shackledT > 0) && !(o.shackleImmuneT > 0) && dist(o.x, o.y, hit.x, hit.y) < 230).sort((q, r) => menace(w2, r) - menace(w2, q) || dist(hit.x, hit.y, q.x, q.y) - dist(hit.x, hit.y, r.x, r.y))[0]; if (n) fling(hit, n, left - 1); }
        }) } });
        if (from !== u) { p.x = from.x + Math.cos(a) * from.r; p.y = from.y + Math.sin(a) * from.r; p.skip = from; }
      };
      fling(u, e0, tier >= 3 ? 1 : 0);
    },
    show: { far: true },
  },
  // Nullify: an undoing. In a ring round him shots drop, moves are broken off, abilities are locked.
  nullify: {
    score(w, u, t, tier) {
      const R = 170, F = foesNear(w, u, u.x, u.y, R); if (!F.length && tier < 2) return 0;
      const shots = w.projectiles.filter((p) => p.team !== u.team && p.team !== 'neutral' && !p.noHit && dist(p.x, p.y, u.x, u.y) < R).length, wind = F.filter((e) => foeWinding(w, e)).length;
      const kit = F.filter((e) => !isOn(w, e, 'silenced') && (e.def.ability || e.def.brain || e.eliteFn || e.kit)).length;
      const dirty = tier >= 2 ? friendsNear(w, u, u.x, u.y, R).filter((a) => !a.partOf && (a.stunT > 0.4 || a.frozenT > 0.4 || a.rootT > 0.6 || Object.values(a.st).some((v) => v > 55))).length : 0;
      return clamp(Math.min(0.5, shots * 0.17) + Math.min(0.6, wind * 0.4) + Math.min(0.45, kit * 0.15) + dirty * 0.3, 0, 0.95);
    },
    use(w, u, t, tier) {
      const R = 170, dur = tier >= 3 ? 5 : 3; cast(u, 'ability', 0.6);
      k2(w, { draw: 'nullWave', x: u.x, y: u.y, r: R, max: 0.7 });
      for (const p of w.projectiles) if (p.team !== u.team && p.team !== 'neutral' && !p.noHit && p.life > 0 && dist(p.x, p.y, u.x, u.y) < R) { p.life = 0; p.landed = true; k2(w, { draw: 'fizzle', x: p.x, y: p.y, max: 0.35 }); }
      for (const z of w.danger) if (z.team !== u.team && z.t > 0 && z.src && !z.src.def.boss && dist(z.src.x, z.src.y, u.x, u.y) < R + z.src.r) { z.cancelled = true; z.done = true; }
      for (const e of foesNear(w, u, u.x, u.y, R)) {
        interrupt(w, e);
        const T = e.def.boss || e.def.part ? dur * 0.4 : dur;
        onUnit(w, e, 'silenced', T, { taken: (w2, u2, s2, amt, o) => (tier >= 3 && !o.dot ? amt * 1.2 : amt),
          tick(w2, u2) { u2.abilT = Math.max(u2.abilT || 0, 0.3); if (u2.kit) for (const c in u2.kit.cd) u2.kit.cd[c] = Math.max(u2.kit.cd[c], 0.3); const E = u2.el; if (E && E.dueLen) for (const c in E.dueLen) if (typeof E[c] === 'number') E[c] = Math.max(E[c], 0.3); } });
        k2(w, { draw: 'silenced', unit: e, x: e.x, y: e.y, r: e.vr, max: T });
        if (tier >= 2) { const had = e.buffs.length; e.buffs = e.buffs.filter((b) => b.dur >= 1000 || !(b.dealt > 1 || b.atkSpeed > 1 || b.move > 1 || b.taken < 1 || b.border || b.lifesteal || b.statusImmune || b.knockImmune || b.frontBlock)); if (e.buffs.length < had) sparks(w, e.x, e.y, 0, 6, '#C9D2DE', 1); }
      }
      if (tier >= 2) for (const a of [u, ...friendsNear(w, u, u.x, u.y, R)]) { if (a.partOf) continue; const bad = a.stunT > 0 || a.frozenT > 0 || a.rootT > 0 || Object.values(a.st).some((v) => v > 4); if (bad) { cleanse(a); k2(w, { draw: 'rally', unit: a, x: a.x, y: a.y, r: a.vr, max: 0.7, cols: ['#C9D2DE', '#EEF3F8'] }); } }
    },
    show: { shootme: true },
  },
  // Chain Gang: a hold. The enemies round him are leashed to him and have to fight him.
  chainGang: {
    score(w, u) {
      if (u.kit.gang && u.kit.gang > w.time) return 0;
      const F = foesNear(w, u, u.x, u.y, 190).filter((e) => !e.fixed && !isOn(w, e, 'chained')), onFriend = F.filter((e) => e.target && e.target !== u && e.target.team === u.team && squishy(e.target)).length;
      return F.length >= 3 ? 0.8 : F.length === 2 ? 0.55 + 0.15 * Math.min(2, onFriend) : onFriend ? 0.5 : 0;
    },
    use(w, u, t, tier) {
      const dur = 5, n = tier >= 2 ? 5 : 3, L = 120;
      const F = foesNear(w, u, u.x, u.y, 190).filter((e) => !e.fixed).sort((p, q) => (q.target && q.target !== u ? 1 : 0) - (p.target && p.target !== u ? 1 : 0) || dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y)).slice(0, n);
      if (!F.length) return;
      cast(u, 'ability', 0.5); u.kit.gang = w.time + dur;
      addBuff(u, { id: 'chainGang', dur, taken: 0.8 });
      for (const e of F) {
        onUnit(w, e, 'chained', dur, { tick(w2, u2, dt) {
          if (!alive(u)) { offUnit(u2, 'chained'); return; }
          u2.tauntBy = u; u2.tauntT = 0.6; if (!(u2.fearT > 0) && u2.team !== u.team) u2.target = u;
          const d = dist(u2.x, u2.y, u.x, u.y); if (d > L && !u2.def.boss) { const a = angleTo(u2.x, u2.y, u.x, u.y), k = Math.min(d - L, 420 * dt); u2.x += Math.cos(a) * k; u2.y += Math.sin(a) * k; if (u2.kx * Math.cos(a) + u2.ky * Math.sin(a) < 0) { u2.kx *= 0.6; u2.ky *= 0.6; } }
        } });
        k2(w, { draw: 'chainTo', from: u, unit: e, x: e.x, y: e.y, max: dur, len: L });
      }
      if (tier >= 3) after(u, dur - 0.1, held(u, () => { if (!alive(u)) return; setAnim(u, 'ability', 0.4); w.shake = Math.max(w.shake, 5);
        for (const e of F) if (alive(e)) { hurt(w, e, dmgOf(u, 0.9), u, { knock: 0, noDodge: true, stagger: 60 }); if (!e.def.boss) shove(e, angleTo(e.x, e.y, u.x, u.y), 420); } }));
    },
  },

  // ================================================================ the Telekinetic
  // Hurl: a blast. The nearest heavy thing in the room (else a slab of the floor) thrown into the enemies.
  hurl: {
    score(w, u, t) { if (!t) return 0; const K = knot(w, u, t.x, t.y, 70); return clamp(0.4 + 0.17 * K.n, 0, 0.92); },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.7);
      const once = (i) => {
        const tt = t && alive(t) ? t : opponents(w, u).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0]; if (!tt) return;
        const K = knot(w, u, tt.x, tt.y, 70), thing = looseThing(w, u);
        if (thing) { thing.taken = true; w.pillars = w.pillars.filter((p) => p !== thing); buildGrid(w); hurlThing(w, u, thing.x, thing.y, K.x, K.y, thing, true, tier); }
        else { const a = u.facing + (i ? -1.9 : 1.9), [sx, sy] = inRoom(w, u.x + Math.cos(a) * 46, u.y + Math.sin(a) * 46); k2(w, { draw: 'floorHole', x: sx, y: sy, r: 20, max: 5 }); hurlThing(w, u, sx, sy, K.x, K.y, null, false, tier); }
      };
      once(0); if (tier >= 2) after(u, 0.42, held(u, () => { if (alive(u)) { setAnim(u, 'cast', 0.5); once(1); } }));
    },
    show: { far: true },
  },
  // Levitate: a hold and a throw. An enemy hung helpless in the air, then flung at its friends.
  levitate: {
    score(w, u, t) { if (!t || t.fixed || isOn(w, t, 'levitated') || isOn(w, t, 'lifted')) return 0; return clamp(0.4 + menace(w, t) - (t.def.boss ? 0.15 : 0), 0, 0.92); },
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 3 : 2;
      const L = [t]; if (tier >= 3) { const n = opponents(w, u).filter((e) => e !== t && !e.fixed && dist(e.x, e.y, t.x, t.y) < 240).sort((p, q) => menace(w, q) - menace(w, p))[0]; if (n) L.push(n); }
      cast(u, 'cast', 0.6);
      for (const e of L) {
        if (bossy(e)) { addBuff(e, { id: 'pressed', dur: dur * 0.6, move: 0.5, atkSpeed: 0.7 }); k2(w, { draw: 'pressed', unit: e, x: e.x, y: e.y, r: e.vr, max: dur * 0.6, from: u }); continue; }
        interrupt(w, e); let el = 0;
        k2(w, { draw: 'tkHold', unit: e, x: e.x, y: e.y, r: e.vr, max: dur + 0.5, from: u });
        onUnit(w, e, 'levitated', dur, { taken: (w2, u2, s2, amt, o) => (tier >= 2 && !o.dot ? amt * 1.2 : amt),
          tick(w2, u2, dt) { el += dt; u2.stunT = Math.max(u2.stunT, 0.12); u2.kx *= 0.7; u2.ky *= 0.7; u2.hop = el < 0.35 ? 54 * ease(el / 0.35) : 54 + Math.sin(el * 5) * 4; u2.facing += dt * 1.6; } },
        held(u, (u2) => {
          if (!alive(u2)) { u2.hop = 0; return; }
          // thrown at the thickest of its friends (else straight down)
          const F = opponents(w, u).filter((o) => o !== u2 && !isOn(w, o, 'levitated') && dist(o.x, o.y, u2.x, u2.y) < 280);
          const tg = F.sort((p, q) => foesNear(w, u, q.x, q.y, 70).length - foesNear(w, u, p.x, p.y, 70).length || dist(u2.x, u2.y, p.x, p.y) - dist(u2.x, u2.y, q.x, q.y))[0];
          const x0 = u2.x, y0 = u2.y, [x1, y1] = tg ? inRoom(w, tg.x, tg.y, u2.r) : [u2.x, u2.y], T = tg ? 0.3 : 0.14; let ft = 0;
          if (alive(u)) setAnim(u, 'cast', 0.35);
          onUnit(w, u2, 'thrown', T, { tick(w3, u3, dt) { ft += dt; const k = clamp(ft / T, 0, 1); u3.x = lerp(x0, x1, k); u3.y = lerp(y0, y1, k); u3.vx = u3.vy = u3.kx = u3.ky = 0; u3.stunT = Math.max(u3.stunT, 0.1); u3.hop = 54 * (1 - k * k); } },
            held(u, (u3) => {
              u3.hop = 0; if (!alive(u3)) return;
              k2(w, { draw: 'slamPuff', x: u3.x, y: u3.y, r: u3.vr + 16, max: 0.45 }); w.shake = Math.max(w.shake, 5);
              hurt(w, u3, dmgOf(u, 1.4), u, { noDodge: true, heavy: true, knock: 0, stagger: 40 });
              for (const o of foesNear(w, u, u3.x, u3.y, 62)) if (o !== u3) hurt(w, o, dmgOf(u, 1.4), u, { noDodge: true, heavy: true, knock: 260, kAngle: angleTo(u3.x, u3.y, o.x, o.y), stagger: 30 });
            }));
        }));
      }
    },
    show: { far: true },
  },
  // Mind Shield: a shelter. Shots stop dead at the dome and hang there; enemies are pushed out; it all flies back.
  mindShield: {
    score(w, u) {
      if (u.kit.dome && u.kit.dome > w.time) return 0;
      const R = 100, shots = w.projectiles.filter((p) => p.team !== u.team && p.team !== 'neutral' && !p.noHit && dist(p.x, p.y, u.x, u.y) < 300 && (p.vx * (u.x - p.x) + p.vy * (u.y - p.y)) > 0).length;
      const melee = foesNear(w, u, u.x, u.y, 120).filter((e) => (e.def.range || 0) < 80 && e.target && e.target.team === u.team).length;
      const low = [u, ...friendsNear(w, u, u.x, u.y, R)].some((a) => !a.summon && hpRatio(a) < 0.4);
      return clamp(Math.min(0.6, shots * 0.22) + Math.min(0.6, melee * 0.3) + (low && (shots || melee) ? 0.25 : 0), 0, 0.95);
    },
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 5 : 3.5, R = 100, caught = [];
      cast(u, 'ability', 0.5); u.kit.dome = w.time + dur;
      const f = k2(w, { draw: 'mindDome', unit: u, x: u.x, y: u.y, r: R, max: dur, ward: true, src: u, caught });
      timer(u, 'dome', dur, () => {
        for (const p of w.projectiles) {
          if (p.team === u.team || p.team === 'neutral' || p.noHit || p.life <= 0 || p.domed || dist(p.x, p.y, u.x, u.y) > R + p.r) continue;
          p.domed = true; caught.push({ p, sp: Math.max(280, Math.hypot(p.vx, p.vy)), by: p.owner }); p.vx = p.vy = 0; p.noHit = true; p.home = null; p.life = dur + 2; p.accel = 0; p.drag = 0;
          sparks(w, p.x, p.y, 0, 4, '#D9B8FF', 0.8);
        }
        return !alive(u);
      }, held(u, () => {
        f.max = Math.min(f.max, f.t + 0.2);
        for (const c of caught) { const p = c.p; if (!w.projectiles.includes(p)) continue; const o = c.by && alive(c.by) ? c.by : opponents(w, u).sort((q, r) => dist(p.x, p.y, q.x, q.y) - dist(p.x, p.y, r.x, r.y))[0];
          if (!o || !alive(u)) { p.life = 0; continue; }
          const a = angleTo(p.x, p.y, o.x, o.y); p.team = u.team; p.owner = u; p.noHit = false; p.vx = Math.cos(a) * c.sp * 1.15; p.vy = Math.sin(a) * c.sp * 1.15; p.a = a; p.life = 1.3; p.home = o; p.turn = 5; p.skip = null;
          p.dmg = Math.max(p.dmg || 0, dmgOf(u, 0.6)) * (tier >= 2 ? 1.5 : 1); p.ab = 'mindShield'; if (p.hitSet) p.hitSet = new Set(); }
        if (tier >= 3 && alive(u)) { k2(w, { draw: 'forceBurst', x: u.x, y: u.y, r: R + 55, max: 0.5 }); w.shake = Math.max(w.shake, 4);
          for (const e of foesNear(w, u, u.x, u.y, R + 50)) { hurt(w, e, dmgOf(u, 0.8), u, { knock: 0, noDodge: true, stagger: 45 }); if (!bossy(e)) shove(e, angleTo(u.x, u.y, e.x, e.y), 520); } }
      }));
    },
    show: { shootme: true, ally: true },
  },

  // ================================================================ the Earth Mage
  // Earthquake: a stumble. The floor under them shakes: slowed, staggered again and again, hurt.
  earthquake: {
    score(w, u, t, tier) { if (!t) return 0; const K = knot(w, u, t.x, t.y, tier >= 2 ? 150 : 115); return K.n >= 3 ? 0.9 : K.n === 2 ? 0.65 : 0; },
    use(w, u, t, tier) {
      const r = tier >= 2 ? 150 : 115, dur = tier >= 2 ? 4.5 : 3, K = knot(w, u, t.x, t.y, r), x = K.x, y = K.y;
      cast(u, 'ability', 0.7);
      k2(w, { draw: 'quake', x, y, r, max: dur, every: 0.5, src: u, tick: held(u, () => {
        w.shake = Math.max(w.shake, 3.5);
        for (const e of foesNear(w, u, x, y, r)) { hurt(w, e, dmgOf(u, 0.4), u, { knock: 0, noDodge: true, stagger: 17 }); addBuff(e, { id: 'quake', dur: 0.7, move: 0.5 }); if (!bossy(e)) shove(e, rand() * TAU, 110); }
      }) });
      if (tier >= 3) after(u, dur, held(u, () => {
        k2(w, { draw: 'heaveUp', x, y, r, max: 0.6 }); w.shake = Math.max(w.shake, 8);
        for (const e of foesNear(w, u, x, y, r)) { hurt(w, e, dmgOf(u, 1.3), u, { knock: 0, noDodge: true, heavy: true }); if (!bossy(e)) shove(e, angleTo(x, y, e.x, e.y), 300); e.stunT = Math.max(e.stunT, e.def.boss ? 0.4 : 1); k2(w, { draw: 'tumble', unit: e, x: e.x, y: e.y, r: e.vr, max: e.def.boss ? 0.4 : 1 }); }
      }));
    },
    show: { far: true },
  },
  // Spike Chain: the damage. A line of stone spikes runs from her to an enemy, and on to the next, and the next.
  spikeChain: {
    score(w, u, t) { if (!t || !lineClear(w, u.x, u.y, t.x, t.y, 2)) return 0; const n = opponents(w, u).filter((e) => e !== t && dist(e.x, e.y, t.x, t.y) < 190).length; return clamp(0.5 + 0.12 * Math.min(3, n), 0, 0.9); },
    use(w, u, t, tier) {
      const N = tier >= 2 ? 5 : 3, SP = 640, seen = new Set();
      cast(u, 'cast', 0.5);
      const run = (x0, y0, e, i) => {
        if (!e || !alive(e)) return; seen.add(e);
        const T = Math.max(0.12, dist(x0, y0, e.x, e.y) / SP), ex = e.x, ey = e.y;
        k2(w, { draw: 'spikeRun', x: x0, y: y0, x1: ex, y1: ey, max: T + 0.7, run: T });
        after(u, T, held(u, () => {
          const hx = alive(e) ? e.x : ex, hy = alive(e) ? e.y : ey;
          // what stands on the line is caught by it too, softer
          for (const o of opponents(w, u)) if (o !== e && !seen.has(o) && segDist(o.x, o.y, x0, y0, ex, ey) < o.r + 10) hurt(w, o, dmgOf(u, 0.6), u, { knock: 50, noDodge: true, stagger: 10 });
          if (alive(e)) {
            k2(w, { draw: 'bigSpike', x: e.x, y: e.y, r: e.vr, max: tier >= 3 ? 1.5 : 0.7, unit: tier >= 3 ? e : null });
            hurt(w, e, dmgOf(u, 1.35) * Math.pow(0.92, i), u, { knock: 70, kAngle: angleTo(x0, y0, e.x, e.y), noDodge: true, stagger: 24 });
            if (tier >= 3 && alive(e)) e.rootT = Math.max(e.rootT || 0, e.def.boss ? 0.56 : 1.4);
          }
          if (i + 1 < N) { const n = opponents(w, u).filter((o) => !seen.has(o) && dist(o.x, o.y, hx, hy) < 200 && lineClear(w, hx, hy, o.x, o.y, 2)).sort((p, q) => dist(hx, hy, p.x, p.y) - dist(hx, hy, q.x, q.y))[0]; if (n) run(hx, hy, n, i + 1); }
        }));
      };
      run(u.x + Math.cos(u.facing) * u.r, u.y + Math.sin(u.facing) * u.r, t, 0);
    },
    show: { far: true },
  },
  // Stone Wall: a real wall, across the way of whoever is coming for the party's soft ones.
  stoneWall: {
    score(w, u) { const P = wallPlan(w, u); return P ? 0.72 : 0; },
    use(w, u, t, tier) {
      const P = wallPlan(w, u) || (t ? { foe: t, friend: u } : null); if (!P) return;
      const { foe, friend } = P, a = angleTo(friend.x, friend.y, foe.x, foe.y), dd = dist(friend.x, friend.y, foe.x, foe.y), d = clamp(dd * 0.55, 54, 130), cx = friend.x + Math.cos(a) * d, cy = friend.y + Math.sin(a) * d;
      const L = tier >= 2 ? 210 : 140, dur = tier >= 2 ? 8 : 6, horiz = Math.abs(Math.cos(a)) < Math.abs(Math.sin(a));
      cast(u, 'ability', 0.6);
      const rect = horiz ? { x: clamp(cx - L / 2, 4, w.W - L - 4), y: cy - 15, w: L, h: 30 } : { x: cx - 15, y: clamp(cy - L / 2, 4, w.H - L - 4), w: 30, h: L };
      const wl = wallRect(w, rect, dur, 'stone'); wl.max = dur; wl.side = horiz ? Math.sign(foe.y - cy) || 1 : Math.sign(foe.x - cx) || 1; wl.horiz = horiz;
      w.shake = Math.max(w.shake, 4);
      // whoever it came up under is lifted out of the way with a knock
      for (const e of opponents(w, u)) if (rectGap(e, rect) < e.r + 4) hurt(w, e, dmgOf(u, 0.5), u, { knock: 160, kAngle: horiz ? (e.y > cy ? 1 : -1) * Math.PI / 2 : e.x > cx ? 0 : Math.PI, noDodge: true, stagger: 20 });
      if (tier >= 3) after(u, dur - 0.08, held(u, () => {
        k2(w, { draw: 'rubble', x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, w: rect.w, h: rect.h, side: wl.side, horiz, max: 0.7 }); w.shake = Math.max(w.shake, 6);
        for (const e of opponents(w, u)) { if (rectGap(e, rect) > 62) continue; const far = horiz ? (e.y - cy) * wl.side : (e.x - cx) * wl.side; if (far < -8) continue;
          hurt(w, e, dmgOf(u, 1.4), u, { knock: 220, kAngle: horiz ? wl.side * Math.PI / 2 : wl.side > 0 ? 0 : Math.PI, noDodge: true, heavy: true, stagger: 50 }); }
      }));
    },
    show: { far: true },
  },
};
// the enemy Manacles is for: the one with the most to lose, in sight, not shackled already
function manacleTarget(w, u) {
  let best = null, bs = 0.15;
  for (const e of opponents(w, u)) { if (!e.aggro || e.shackledT > 0 || e.shackleImmuneT > 0 || dist(u.x, u.y, e.x, e.y) > 340 || blocked(w, u.x, u.y, e.x, e.y)) continue; const s = menace(w, e) + (e.def.dmg || 0) * 0.008; if (s > bs) { bs = s; best = e; } }
  return best;
}
// Stone Wall's plan: a brawler coming for one of the party's soft ones (or for her), near enough to matter, not yet on them
function wallPlan(w, u) {
  let best = null, bd = 230;
  for (const e of opponents(w, u)) {
    const v = e.target; if (!v || v.team !== u.team || v.summon || (e.def.range || 0) > 80 || bossy(e) || !(v === u || squishy(v))) continue;
    const d = dist(e.x, e.y, v.x, v.y) - e.r - v.r; if (d < 60 || d > bd || dist(u.x, u.y, v.x, v.y) > 330) continue;
    bd = d; best = { foe: e, friend: v };
  }
  return best;
}

// ---------------------------------------------------------------- traits
export const TRAITS3 = {
  // Strength in Numbers: each of the four hits 9% harder for every other one within arm's reach of it.
  strengthInNumbers: {
    dealt(w, u, t, amt, o) { if (o.dot) return amt; let n = 0; for (const b of bodiesOf(u)) if (b !== u && dist(b.x, b.y, u.x, u.y) < 70) n++; return amt * (1 + 0.09 * n); },
    // all four shoulder to shoulder: angry steam off them (the look of it; the numbers are above)
    tick(w, u, dt) { const B = bodiesOf(u), m = mobMid(u); if (B.length < 4 || !u.target || B.some((b) => dist(b.x, b.y, m.x, m.y) > 62)) return;
      if (rand() < dt * 5) { const b = B[Math.floor(rand() * B.length)]; w.particles.push({ x: b.x + rrange(-6, 6), y: b.y - b.vr * 0.4, vx: rrange(-10, 10), vy: 0, rise: 46, up: 0, life: 0.5, max: 0.5, size: 4.5, color: 'rgba(255,120,90,0.8)' }); } },
  },
  // Spare Second: once a room, the blow that would bring him down never happened: back three seconds.
  spareSecond: {
    downed(w, u) {
      if (u.kit.spareW === w) return false; u.kit.spareW = w;
      const p = pastOf(w, u, 3) || { x: u.x, y: u.y, hp: u.maxHp * 0.3, st: {}, held: false };
      rewindLook(w, u, p); cleanse(u);
      u.hp = clamp(p.hp, u.maxHp * 0.3, u.maxHp); putBack(w, u, p); u.invulnT = 1; u.act = null;
      addBuff(u, { id: 'spareSecond', dur: 1, border: '#F2D98A' });
      k2(w, { draw: 'clockFlash', x: u.x, y: u.y, r: u.vr + 14, max: 0.55 });
      return true;
    },
  },
  // Eye of the Storm: when one she whirled is flung about, a clap of wind goes off round it.
  stormsEye: {
    whirlBurst(w, u, e) {
      k2(w, { draw: 'windClap', x: e.x, y: e.y, r: 88, max: 0.5 });
      for (const f of foesNear(w, u, e.x, e.y, 88)) if (f !== e) { hurt(w, f, dmgOf(u, 0.6), u, { knock: 0, noDodge: true, proc: true, pab: 'stormsEye' }); if (!bossy(f)) shove(f, angleTo(e.x, e.y, f.x, f.y), 260); whirl(w, f, 30, u); }
    },
  },
  // Ball and Chain: what he shackles drags an iron ball: 40% slower, no dashes, leaps or charges.
  ballAndChain: {
    shackled(w, u, e, T) {
      onUnit(w, e, 'ironBall', T, { moveSpeed: () => 0.6, tick(w2, u2) { const A = u2.act; if (A && (A.type === 'dash' || A.type === 'leap' || A.type === 'charge' || A.type === 'chargeTell')) { u2.act = null; u2.hop = 0; } if (!(u2.shackledT > 0)) offUnit(u2, 'ironBall'); } });
      k2(w, { draw: 'ironBall', unit: e, x: e.x, y: e.y, r: e.vr, max: T });
    },
  },
  // Poltergeist: when an enemy dies near her, its body is flung at the nearest of its friends.
  poltergeist: {
    death(w, u, v) {
      if (v.team === u.team || v.summon || !alive(u)) return;
      const vx = v.x, vy = v.y, kind = v.kind;
      after(u, 0.06, () => {
        const tg = opponents(w, u).filter((e) => dist(e.x, e.y, vx, vy) < 330).sort((p, q) => dist(vx, vy, p.x, p.y) - dist(vx, vy, q.x, q.y))[0]; if (!tg) return;
        const c = [...w.corpses].reverse().find((o) => o.kind === kind && o.age < 0.3 && !o.flungBy), a = angleTo(vx, vy, tg.x, tg.y), SP = 640;
        const land = () => { if (!alive(tg)) return; k2(w, { draw: 'slamPuff', x: tg.x, y: tg.y, r: tg.vr + 8, max: 0.4 }); hurt(w, tg, dmgOf(u, 0.9), u, { knock: 170, kAngle: a, noDodge: true, stagger: 22, proc: true, pab: 'poltergeist' }); };
        if (c) { // the body itself flies (sim.js corpses() carries it): we only aim it and watch for where it lands
          c.flungBy = u; c.x = vx; c.y = vy; c.kx = Math.cos(a) * SP; c.ky = Math.sin(a) * SP; c.z = 8; c.vz = 190; c.spin = 9;
          k2(w, { draw: 'tkGlow', corpse: c, x: c.x, y: c.y, r: c.vr || 20, max: 0.9 });
          let el = 0; timer(u, 'polt' + Math.round(w.time * 100) + (c.x | 0), 0.9, (dt) => { el += dt; if (!alive(tg)) return true; if (dist(c.x, c.y, tg.x, tg.y) < tg.r + c.r * 0.7) { c.kx *= 0.15; c.ky *= 0.15; land(); return true; } return false; });
        } else { // no body left (a slime, a summon's puff): a stone off the floor where it fell instead
          const p = shoot(w, u, a, { kind: 'tkStone', speed: SP, r: 8, life: 0.8, dmg: dmgOf(u, 0.9), knock: 170, st: { stagger: 22 } }); p.x = vx; p.y = vy; p.o.proc = true; p.ab = null; p.o.pab = 'poltergeist';
        }
      });
    },
  },
  // Aftershock: a moment after one of her abilities hurts an enemy, a stone spike comes up under it.
  aftershock: {
    hit(w, u, t, amt, o) {
      if (o.dot || o.proc || o.aft || !alive(t) || !(o.ab || o.pab || (u.kit && u.kit.using) || (CUR.abU === u && CUR.ab))) return;
      if ((t._aftT || 0) > w.time) return; t._aftT = w.time + 2.2;
      k2(w, { draw: 'aftCrack', unit: t, x: t.x, y: t.y, r: t.vr, max: 0.95 }); // the tell: the floor cracks under it, then the spike
      after(u, 0.9, () => { if (!alive(t)) return; k2(w, { draw: 'bigSpike', x: t.x, y: t.y, r: t.vr, max: 0.6 }); hurt(w, t, dmgOf(u, 0.55), u, { knock: 40, noDodge: true, stagger: 15, proc: true, aft: true, pab: 'aftershock' }); });
    },
  },
};

// ---------------------------------------------------------------- the heroes' own attacks (the four that shoot)
const A = (u, k) => dmgOf(u, k);
export const ATTACKS3 = {
  // a brass clock hand: whatever it hits loses a moment (its next blow comes a third of a second later)
  clockwork(w, u, t, a) {
    shoot(w, u, a, { kind: 'clockHand', speed: 540, r: 6, dmg: A(u, 1), knock: 25, extra: { onHit: (w2, p, e) => { e.atkT = Math.max(0, e.atkT) + (e.def.boss ? 0.12 : 0.33); k2(w2, { draw: 'tick', unit: e, x: e.x, y: e.y, r: e.vr, max: 0.4 }); } } });
  },
  // a crescent of wind through the first enemy to the one behind: a small shove and a little Whirled on each
  airMage(w, u, t, a) {
    shoot(w, u, a, { kind: 'gust', speed: 520, r: 9, life: 0.75, dmg: A(u, 0.82), knock: 70, pierce: 1, extra: { onHit: (w2, p, e) => whirl(w2, e, 12, u) } });
  },
  // a loose stone lifts off the floor beside her and is flung
  telekinetic(w, u, t, a) {
    const k = u.kit, sd = (k.tkSide = -(k.tkSide || 1)), sx = u.x + Math.cos(a + sd * 1.5) * (u.r + 10), sy = u.y + Math.sin(a + sd * 1.5) * (u.r + 10), b = angleTo(sx, sy, t.x, t.y);
    const p = shoot(w, u, b, { kind: 'tkStone', speed: 600, r: 7, dmg: A(u, 1), knock: 70 }); p.x = sx; p.y = sy;
  },
  // a lump of rock punched out of the floor and thrown
  earthMage(w, u, t, a) { shoot(w, u, a, { kind: 'stone', speed: 540, r: 8, dmg: A(u, 1), knock: 90, st: { stagger: 10 }, extra: { big: true } }); },
};

// ---------------------------------------------------------------- every step (kits.js kitTick)
export function kit3Tick(w, u, dt) {
  const k = u.kit; if (!k) return;
  if (u.kind === 'clockwork') remember(w, u, dt);
  // the Mob's torch burns (a flame on the torch-bearer's hand: fx3.js)
  if (u.kind === 'mob' && (k.torchW !== w || !k.torchFx || k.torchFx.t >= k.torchFx.max)) { k.torchW = w; k.torchFx = k2(w, { draw: 'torchFlame', unit: u, x: u.x, y: u.y, max: 1e9 }); }
  // the Warden's chain: every swing throws the chain out along its arc
  if (u.kind === 'warden' && u.anim && u.anim !== k.chAnim && u.anim.kind === 'swing' && u.anim.dur >= 0.25 && !k.using) { k.chAnim = u.anim; k2(w, { draw: 'chainSwing', unit: u, x: u.x, y: u.y, a: u.facing, r: u.r + u.def.range + 6, max: 0.34 }); }
}
