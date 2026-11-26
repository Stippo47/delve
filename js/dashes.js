// Round 18 (lane dash18): the dashes. The designer: "I don't like how dash slash abilities work currently in general.
// Everyone from the wolf to hero's abilities. Make a few completely new variations of it."
//
// Six ways to dash, each its own read, shared by heroes and enemies (docs/dash18.md has the survey and who uses which):
//   drawCut     settle, a burst down a line with the blade swept out, stop past them; the cut lands a beat after
//   blinkChain  short blinks zig-zagging from foe to foe, a cut at each crossing
//   hook        a banked run round the target's side, ending behind it with a cut across its back
//   feint       a step one way (a decoy keeps going), the real dash the other
//   dragFling   a shouldered charge that picks the first one up on its front, carries it and flings it at the end
//   pounce      a crouch, a leap that hangs, a landing rake (beasts)
// What they share:
//   - one act on the unit: u.act = { type: 'dash', dv: D }. It is a 'dash' to everything that stops or shortens dashes
//     (Food Fight, Ball and Chain, Targeted, the Water Dome), and sim.js runAction hands it to dashStep here.
//   - a tell first: the body settles (D.body: lean, squash, tilt; render.js unitFrame reads it), and anything that is not
//     a hero shows where it is going on the floor (sim.js danger zones: the heroes step out, and threat.js sees it through
//     dashThreat below, so timed dodges and guards go off).
//   - the weapon is tracked. D.arm poses the weapon arm (parts.js poseFor reads it); the blade is a segment from the
//     body out along that arm. Every step of the way that segment is tested against the foes: a hit is what the blade or
//     the body really passed through, and the slash drawn (fx 'dashRibbon', fx-dash.js) is the path the blade's point
//     really took.
//   - a follow-through: the body holds the end of the stroke, then eases back.
// Numbers a caller gives: dmg (the blow, already multiplied by the unit's own), hit (hurt options: knock, statuses, ab),
// tell, len and the like; nothing here reads a kit, so kits compute their damage when they start it.
import { TAU, clamp, dist, angleTo, angleDiff, wrapAngle, rand, rrange } from './util.js';
import { hurt, alive, opponents, addDanger, inZone, fx, puff, sparks } from './sim.js';
import { circleRect } from './path.js';
import { windMul } from './statuses.js';

const heroic = (w, u) => (w.battle ? u.def.team === 'hero' : u.team === 'hero');
const eOut = (k) => 1 - (1 - k) * (1 - k);
const eOut3 = (k) => 1 - (1 - k) * (1 - k) * (1 - k);
const sm = (k) => k * k * (3 - 2 * k);
const mix = (a, b, k) => a + (b - a) * k;
const mixA = (a, b, k) => a + wrapAngle(b - a) * k;
const k2 = (w, o) => fx(w, { type: 'k2', ...o });
export function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1, k = clamp(((px - x1) * dx + (py - y1) * dy) / L2, 0, 1);
  return Math.hypot(px - (x1 + dx * k), py - (y1 + dy * k));
}
// which way the weapon arm's turn goes on screen: +1 the right arm (arm-r), -1 a left-handed or mirrored figure
const handSign = (u) => { const s = u.def.style || {}; return (s.hand === 'arm-l' ? -1 : 1) * (s.flip ? -1 : 1); };
// how far the weapon's point is from the middle of the body
export const bladeReach = (u, extra = 0) => u.r + clamp(u.def.range || 20, 16, 56) + 10 + extra;
const COL = { hero: ['#DCE3EC', '#FFFFFF'], enemy: ['#FFCDBD', '#FFF6F2'] };
const colOf = (w, u, o) => o.col || (u.team === 'hero' ? COL.hero : COL.enemy);
const solid = (w, x, y, r) => x < r || y < r || x > w.W - r || y > w.H - r || w.walls.some((q) => circleRect(x, y, r, q)) || w.pillars.some((p) => dist(x, y, p.x, p.y) < p.r + r);
// how far along a from (x, y) a body of radius r can go before something hard, up to len
export function clearLen(w, x, y, a, len, r) {
  let L = 0; const c = Math.cos(a), s = Math.sin(a);
  for (let d = 8; d <= len + 0.01; d += 8) { if (solid(w, x + c * d, y + s * d, r)) break; L = d; }
  return Math.min(len, L + (L >= len - 8 ? 8 : 0));
}
const still = (u) => { u.vx = u.vy = u.dvx = u.dvy = 0; };
const dust = (w, x, y, a, n = 5, col = 'rgba(214,204,184,0.75)', spd = 70) => { for (let i = 0; i < n; i++) { const b = a + rrange(-0.7, 0.7), v = spd * rrange(0.4, 1); w.particles.push({ x: x + rrange(-4, 4), y: y + rrange(-4, 4), vx: Math.cos(b) * v, vy: Math.sin(b) * v, life: rrange(0.25, 0.45), max: 0.45, size: rrange(4, 8), color: col, drag: 0.88 }); } };
// a copy of the body left standing where it was (render.js draws u.dvStamps as fading silhouettes; vx, vy: it drifts on)
function stamp(w, u, D, o = {}) { (u.dvStamps || (u.dvStamps = [])).push({ x: u.x, y: u.y, f: u.facing, t0: w.time, life: o.life || 0.3, vx: o.vx || 0, vy: o.vy || 0, col: D.ghost || '#8A94A6', a: o.a || 0.6 }); if (u.dvStamps.length > 10) u.dvStamps.shift(); }

// ---------------------------------------------------------------- the act
// phs: [{ dur, wind?, enter?(), tick?(k, dt), exit?() }]. o.onEnd() when it has run out (not when something stops it).
function begin(w, u, style, o, phs) {
  const D = { style, o, phs, i: 0, pt: 0, hit: new Set(), body: { lean: 0, sx: 1, sy: 1, tilt: 0 }, arm: null, off: null, ghost: null, lines: false,
    rib: null, short: 1, tSeen: 0, col: colOf(w, u, o), sgn: handSign(u), thr: null, zones: [] };
  const total = phs.reduce((s, p) => s + p.dur, 0);
  const A = { type: 'dash', dv: D, t: total, max: total, a: o.a ?? u.facing };
  D.A = A; D.tSeen = total; u.act = A; still(u); u.spd = 0;
  if (phs[0].enter) phs[0].enter(D);
  return A;
}
const left = (D) => { let s = -D.pt; for (let i = D.i; i < D.phs.length; i++) s += D.phs[i].dur; return Math.max(0.001, s); };
function finish(w, u, A) {
  const D = A.dv; ribEnd(w, D);
  if (u.act === A) u.act = null;
  u.hop = 0; u.dvHop = 0; u.spd = 0; still(u);
  u.atkT = Math.max(u.atkT || 0, D.o.rest ?? (heroic(w, u) ? 0.05 : 0.25)); // (a hero is straight back to its blows, as after the old moves; an enemy takes a breath)
  if (D.o.onEnd) D.o.onEnd(D);
}
// One step of a dash (sim.js runAction; elites.js rushTick for the brains that run their own moves).
export function dashStep(w, u, A, dt) {
  const D = A.dv; if (!D) return false;
  // something cut its clock short (Targeted: "its dashes, leaps and charges go 40% as far"): the travel is cut the same
  if (D.tSeen > 0 && A.t < D.tSeen * 0.98) D.short *= clamp(A.t / D.tSeen, 0.2, 1);
  let ph = D.phs[D.i];
  const sdt = ph.wind ? dt / windMul(u) : dt; if (ph.wind) u.winding = true;
  D.pt += sdt; still(u);
  if (ph.tick) ph.tick(clamp(D.pt / ph.dur, 0, 1), sdt, D);
  if (u.act !== A) return true;
  while (D.pt >= ph.dur) {
    D.pt -= ph.dur; if (ph.exit) ph.exit(D); if (u.act !== A) return true;
    if (++D.i >= D.phs.length) { finish(w, u, A); return true; }
    ph = D.phs[D.i]; if (ph.enter) ph.enter(D); if (u.act !== A) return true;
    if (D.jump != null) { D.i = D.jump; D.jump = null; D.pt = 0; ph = D.phs[D.i]; if (ph.enter) ph.enter(D); if (u.act !== A) return true; } // (a phase with nothing to do skips on: the blink chain out of marks)
  }
  if (D.passing) u.passUntil = w.time + 0.05; // through bodies while it travels (sim.js physics)
  A.t = left(D); D.tSeen = A.t;
  return true;
}
// The dash a unit is in, if it is one of these.
export const dashOf = (u) => (u && u.act && u.act.dv) || null;

// ---------------------------------------------------------------- the blade
// The weapon as a segment in the room: from just inside the body's edge out to its point, along the weapon arm.
function bladeSeg(u, D, x, y, f, ba) {
  const B = D.bl, a = f + D.sgn * ba, c = Math.cos(a), s = Math.sin(a);
  return { ax: x + c * B.r0, ay: y + s * B.r0, bx: x + c * B.r1, by: y + s * B.r1 };
}
function ribStart(w, u, D, o = {}) {
  D.rib = { pts: [], rel: null, hold: !!o.hold };
  D.ribFx = k2(w, { draw: 'dashRibbon', x: u.x, y: u.y, rib: D.rib, col: o.col || D.col, th: o.th || clamp((D.bl.r1 - D.bl.r0) * 0.5, 9, 22), life: o.life || 0.2, max: 6, lance: !!o.lance });
}
function ribEnd(w, D) { if (!D.rib || D.rib.rel != null) return; D.rib.rel = w.time; if (D.ribFx) D.ribFx.max = D.ribFx.t + (D.ribFx.life || 0.2) + 0.12; }
// Travel from k0 to k1 along at(k) -> { x, y, f (facing), ba (the blade's angle off the facing) }, a little at a time:
// each small step the body and the blade are tested against every foe not yet touched (touch(e, how, x, y)), and the
// blade's point is added to the ribbon while it is cutting.
function sweep(w, u, D, k0, k1, at, touch) {
  const p0 = at(k0), p1 = at(k1), n = clamp(Math.ceil((Math.hypot(p1.x - p0.x, p1.y - p0.y) + Math.abs((p1.ba ?? 0) - (p0.ba ?? 0)) * 40) / 8), 1, 14);
  const foes = touch ? (D.o.only ? opponents(w, u).filter((e) => e === D.o.only) : opponents(w, u)) : []; // (o.only: a move that strikes one foe and no other)
  for (let i = 1; i <= n; i++) {
    const p = i === n ? p1 : at(k0 + (k1 - k0) * i / n);
    const B = D.bl && p.ba != null ? bladeSeg(u, D, p.x, p.y, p.f, p.ba) : null;
    if (B && D.rib && D.rib.rel == null) D.rib.pts.push({ x0: B.ax, y0: B.ay, x1: B.bx, y1: B.by, t: w.time });
    for (const e of foes) {
      if (D.hit.has(e) || !alive(e)) continue;
      const body = D.bodyHits !== false && dist(p.x, p.y, e.x, e.y) < (D.bodyR ?? u.r * 0.85) + e.r;
      const cut = B && D.cutting !== false && segDist(e.x, e.y, B.ax, B.ay, B.bx, B.by) < e.r + 3;
      if (body || cut) { D.hit.add(e); touch(e, cut ? 'blade' : 'body', p.x, p.y); if (u.act == null || u.act.dv !== D) return; }
    }
  }
  u.x = p1.x; u.y = p1.y; u.facing = p1.f; u.mvA = p1.f; D.A.a = p1.f; still(u);
}
const blow = (w, u, e, dmg, o, extra) => hurt(w, e, typeof dmg === 'function' ? dmg(e) : dmg, u, { noDodge: true, ...(o.hit || {}), ...extra });
// the floor mark anything that is not a hero shows before it goes
function lane(w, u, D, x1, y1, x2, y2, t, hw) { D.zones.push(addDanger(w, { shape: 'line', x1, y1, x2, y2, hw: hw || u.r + 8, t, team: u.team, src: u, kind: D.o.kind || 'blade', quiet: true })); }
function spot(w, u, D, x, y, r, t) { D.zones.push(addDanger(w, { shape: 'circle', x, y, r, t, team: u.team, src: u, kind: D.o.kind || 'blade', quiet: true })); }

// ---------------------------------------------------------------- 1. the draw cut
// Settles with the blade back at the hip, then is simply at the far end of the line with the blade swept out behind;
// every foe the blade crossed carries a thin white line for a beat, and then the cut lands on each in turn.
// o: { a, len, tell, hold, dmg, hit, mark(e), lance (a spear: thrust straight, the wounds burst down the line), ghost,
//      now (no beat: the cut lands as the blade passes), again(D) -> options for a second cut straight after, or null }
export function drawCut(w, u, o) {
  const a = o.a, tell = o.tell ?? (heroic(w, u) ? 0.3 : 0.5), T = o.burst ?? 0.11, hold = o.now ? 0.08 : o.hold ?? 0.26, x0 = u.x, y0 = u.y;
  let L = clearLen(w, x0, y0, a, o.len, u.r * 0.9), marked = [];
  const R = bladeReach(u, o.lance ? 14 : 0), sheath = o.lance ? 0 : 1.05, out = o.lance ? 0 : -1.35;
  // (the blade comes round with the ground covered, not with the clock: its point draws one clean curve from hip to full reach)
  const at = (k) => { const e = eOut(k), d = L * e; return { x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d, f: a, ba: mix(sheath, out, e) }; };
  let kPrev = 0;
  const A = begin(w, u, 'drawCut', o, [
    { dur: tell, wind: true,
      enter(D) { u.facing = a; D.bl = { r0: u.r * 0.6, r1: R }; D.ghost = o.ghost || (u.team === 'hero' ? '#5E6B86' : '#9A5548');
        if (!heroic(w, u)) lane(w, u, D, x0, y0, x0 + Math.cos(a) * (L + R * 0.5), y0 + Math.sin(a) * (L + R * 0.5), tell, o.lance ? u.r + 6 : R * 0.8);
        D.thr = { shape: 'line', x1: x0, y1: y0, x2: x0 + Math.cos(a) * (L + R * 0.5), y2: y0 + Math.sin(a) * (L + R * 0.5), hw: R * 0.8, sp: L / T };
        k2(w, { draw: 'dashSettle', unit: u, x: u.x, y: u.y, a, max: tell, col: D.col, lance: !!o.lance, bare: o.settle === false }); }, // (o.settle false: the caller shows its own light on the blade: Iaido)
      tick(k, dt, D) { const e = eOut3(k); u.facing = mixA(u.facing, a, Math.min(1, dt * 14)); D.body = { lean: -0.4 * e, sx: 1 + 0.1 * e, sy: 1 - 0.2 * e, tilt: Math.sin(w.time * 46) * 0.02 * k };
        D.arm = o.lance ? { r: 0, dy: -16 * e } : { r: sheath * e, dy: -4 * e }; D.off = o.lance ? null : { r: 0.5 * e, dy: 6 * e }; } },
    { dur: T,
      enter(D) { L *= D.short; D.passing = true; D.lines = true; if (o.inv == null) o.inv = heroic(w, u); // (nothing lands on a hero mid-burst, as with the old moves; an enemy can be struck)
        if (o.lance) D.bodyR = o.width ?? (heroic(w, u) ? u.r + 14 : u.r * 0.85); // (a hero's spear is as wide as the old lunge's reach; an enemy's no wider than the lane it showed)
        if (o.inv) u.invulnT = Math.max(u.invulnT || 0, T + 0.05);
        ribStart(w, u, D, { hold: !o.now, life: 0.24, lance: !!o.lance, th: o.lance ? 14 : 0 }); dust(w, x0, y0, a + Math.PI, 7); kPrev = 0;
        k2(w, { draw: 'dashKick', x: x0, y: y0, a, max: 0.35 }); },
      tick(k, dt, D) { D.body = { lean: 0.3, sx: 0.84, sy: 1.34, tilt: 0 }; D.arm = o.lance ? { r: 0, dy: 26 } : { r: mix(sheath, out, eOut(k)), dy: 8 };
        sweep(w, u, D, kPrev, k, at, (e, how) => { marked.push(e);
          if (o.now) { blow(w, u, e, o.dmg, o, { kAngle: o.straight ? a : a + (Math.sin(angleTo(u.x, u.y, e.x, e.y) - a) > 0 ? 0.9 : -0.9) }); k2(w, { draw: 'dashHit', x: e.x, y: e.y, a, r: e.vr, max: 0.3, col: D.col }); }
          else { if (o.mark) o.mark(e); k2(w, { draw: 'dashMark', unit: e, x: e.x, y: e.y, a: a + (o.lance ? 0 : 0.5 * D.sgn), r: e.vr, at: hold + (T - D.pt) + 0.05 * marked.length, max: hold + 0.6 + 0.05 * marked.length, col: D.col, lance: !!o.lance }); } });
        kPrev = k; },
      exit(D) { D.passing = false; D.lines = false; D.thr = null; dust(w, u.x, u.y, a, 6, undefined, 110); if (o.arrive) o.arrive(D); } },
    { dur: hold,
      tick(k, dt, D) { const e = eOut(k); D.body = { lean: mix(0.3, 0.16, e), sx: mix(0.84, 1.04, e), sy: mix(1.34, 0.95, e), tilt: 0 }; D.arm = o.lance ? { r: 0, dy: mix(26, 20, e) } : { r: out, dy: 8 };
        if (k < 0.5) { u.x += Math.cos(a) * 60 * (1 - k * 2) * dt; u.y += Math.sin(a) * 60 * (1 - k * 2) * dt; } },
      exit(D) { ribEnd(w, D); if (o.now) return;
        marked = marked.filter((e) => alive(e)); marked.forEach((e, i) => later(w, u, 0.05 * i, () => { if (!alive(e)) return;
          blow(w, u, e, o.dmg, o, { kAngle: a + Math.PI / 2 * (Math.sin(angleTo(x0, y0, e.x, e.y) - a) > 0 ? 1 : -1) }); }));
        if (marked.length) w.shake = Math.max(w.shake, 3); } },
    { dur: o.recover ?? 0.24,
      tick(k, dt, D) { const e = sm(k); D.body = { lean: mix(0.16, 0, e), sx: 1, sy: mix(0.95, 1, e), tilt: 0 }; D.arm = o.lance ? { r: 0, dy: mix(20, 0, e) } : { r: mix(out, 0.5, eOut(Math.min(1, k * 2.2))) * (1 - sm(clamp((k - 0.6) / 0.4, 0, 1))), dy: mix(8, 0, e) }; },
      exit(D) { const nx = o.again && o.again(D); if (nx) { u.act = null; drawCut(w, u, { ...o, ...nx, again: nx.again || null }); } } },
  ]);
  return A;
}
// a thing that happens a moment later, whatever the unit is doing then (kits' u.later is ticked for kit heroes only)
function later(w, u, t, f) { if (t <= 0) { f(); return; } fx(w, { type: 'k2', draw: 'none', x: u.x, y: u.y, max: t + 0.05, every: t, src: u, tick: (e) => { if (!e.done) { e.done = true; f(); } } }); }

// ---------------------------------------------------------------- 2. the blink chain
// From foe to foe in short blinks, each one crossing its mark at a slant with a cut, a copy of the body left at every
// stop; it ends behind the last. o: { targets: [e...], n, reach (how far the next may be), tell, dmg, hit, ghost, inv }
export function blinkChain(w, u, o) {
  const tell = o.tell ?? (heroic(w, u) ? 0.16 : 0.5), HOP = o.hop ?? 0.08, BEAT = o.beat ?? 0.13, n = o.n || 3, reach = o.reach || 260;
  const list = (o.targets || []).filter((e) => alive(e)).slice(0, n); const seen = new Set();
  const next = () => { let e = list.shift(); while (e && (!alive(e) || seen.has(e))) e = list.shift();
    if (!e) e = opponents(w, u).filter((x) => !seen.has(x) && dist(u.x, u.y, x.x, x.y) < reach).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0];
    return e || null; };
  const R = bladeReach(u, -4); let sd = rand() < 0.5 ? 1 : -1, P = null, kPrev = 0, last = null;
  const plan = (D) => { // the next crossing: from where it stands, through the mark's flank, out the far side
    const e = next(); if (!e) return false; seen.add(e); sd = -sd;
    const a0 = angleTo(u.x, u.y, e.x, e.y), a1 = a0 + sd * 0.42, d = dist(u.x, u.y, e.x, e.y);
    let L = d + (e.r + u.r) * 0.72; L = clearLen(w, u.x, u.y, a1, L, u.r * 0.8); if (L < d * 0.6) return plan(D); // (it comes out just clear of the mark's far side)
    P = { e, x0: u.x, y0: u.y, a: a1, L, b0: -sd * 0.35 * D.sgn, b1: -sd * 2.05 * D.sgn }; last = e; return true; }; // (the mark passes down the body's side: the blade is held out on that side and swept front to back)
  const phs = [{ dur: tell, wind: true,
    enter(D) { D.bl = { r0: u.r * 0.5, r1: R }; D.ghost = o.ghost || (u.team === 'hero' ? '#6E5E8E' : '#8E5E6E'); D.bodyHits = false;
      const first = list[0] || opponents(w, u).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0];
      if (first) { u.facing = angleTo(u.x, u.y, first.x, first.y);
        if (!heroic(w, u)) { let px = u.x, py = u.y; for (const e of [first, ...list.slice(1)].slice(0, n)) { lane(w, u, D, px, py, e.x, e.y, tell + 0.1, u.r); px = e.x; py = e.y; } }
        D.thr = { shape: 'circle', x: first.x, y: first.y, r: first.r + R, sp: 2000 }; }
      k2(w, { draw: 'dashSettle', unit: u, x: u.x, y: u.y, a: u.facing, max: tell, col: [D.ghost, '#FFFFFF'], dark: true }); },
    tick(k, dt, D) { const e = eOut3(k); D.body = { lean: -0.2 * e, sx: 1 + 0.1 * e, sy: 1 - 0.16 * e, tilt: 0, wash: o.wash && [o.wash[0], o.wash[1] * e] }; D.arm = { r: -0.5 * e, dy: -8 * e }; D.off = { r: -0.5 * e, dy: -8 * e }; } }];
  for (let i = 0; i < n; i++) {
    phs.push({ dur: HOP,
      enter(D) { if (!plan(D)) { D.jump = phs.length - 2; return; } D.passing = true; D.lines = true; kPrev = 0; u.facing = P.a;
        if (o.inv ?? heroic(w, u)) u.invulnT = Math.max(u.invulnT || 0, HOP + BEAT + 0.05);
        stamp(w, u, D, { life: 0.4, a: 0.8 }); D.cutting = false; ribEnd(w, D); },
      tick(k, dt, D) { D.body = { lean: 0.25, sx: 0.8, sy: 1.4, tilt: 0, alpha: o.alpha ?? 0.7, wash: o.wash };
        // the blades come out as she reaches the mark: the slash is drawn across it, not along the whole blink
        if (!D.cutting && dist(u.x, u.y, P.e.x, P.e.y) < P.e.r + R + 26) { D.cutting = true; ribStart(w, u, D, { life: 0.24, col: o.col || D.col, th: 18 }); } D.arm = { r: mix(P.b0, P.b1, sm(k)), dy: 10 }; D.off = { r: -mix(P.b0, P.b1, sm(k)) * 0.4, dy: 10 };
        sweep(w, u, D, kPrev, k, (q) => ({ x: P.x0 + Math.cos(P.a) * P.L * q, y: P.y0 + Math.sin(P.a) * P.L * q, f: P.a, ba: mix(P.b0, P.b1, sm(q)) }), (e) => {
          blow(w, u, e, o.dmg, o, { knock: (o.hit && o.hit.knock) ?? 90, kAngle: P.a + sd * Math.PI / 2 }); if (o.each) o.each(e);
          k2(w, { draw: 'dashHit', x: e.x, y: e.y, a: P.a + sd * 0.9, r: e.vr, max: 0.32, col: D.col }); });
        kPrev = k; },
      exit(D) { D.passing = false; D.lines = false; D.hit.clear(); } });
    phs.push({ dur: BEAT,
      tick(k, dt, D) { const e = eOut(k); D.body = { lean: mix(0.25, 0, e), sx: mix(0.8, 1.08, e), sy: mix(1.4, 0.9, e), tilt: 0, wash: o.wash };
        const nx = list.find((x) => alive(x) && !seen.has(x)) || P.e; if (nx && alive(nx)) u.facing = mixA(u.facing, angleTo(u.x, u.y, nx.x, nx.y), Math.min(1, dt * 26));
        D.arm = { r: mix(D.arm ? D.arm.r : 0, -0.5, e), dy: mix(10, -4, e) }; },
      exit(D) { ribEnd(w, D); D.thr = null; } });
  }
  phs.push({ dur: o.recover ?? 0.18,
    enter(D) { D.passing = false; D.lines = false; ribEnd(w, D); if (last && alive(last)) u.facing = angleTo(u.x, u.y, last.x, last.y); },
    tick(k, dt, D) { const e = sm(k); D.body = { lean: 0, sx: mix(1.08, 1, e), sy: mix(0.9, 1, e), tilt: 0 }; D.arm = { r: -0.5 * (1 - e), dy: -4 * (1 - e) }; D.off = null; } });
  phs.push({ dur: 0.01 });
  return begin(w, u, 'blinkChain', o, phs);
}

// ---------------------------------------------------------------- 3. the hook
// A banked run round the target's side that ends behind it, the cut swung across its back as the body comes round.
// o: { t, side (+1 / -1; otherwise the shorter way round), tell, run, dmg, hit, graze (the share of the blow for anyone
//      else the blade catches on the way round; 0 = none), each(e, fromBehind), strike(e) (the caller's own blow in place
//      of dmg), only (the cut lands on this one alone), arrive(), alpha (how solid the body is on the run), ghost }
// Returns null if there is no way to it (walled in): the caller does something else.
export function hook(w, u, o) {
  const t = o.t, tell = o.tell ?? (heroic(w, u) ? 0.14 : 0.45), RUN = o.run ?? clamp(0.2 + dist(u.x, u.y, t.x, t.y) / 1400, 0.24, 0.42), CUT = 0.13;
  let cx = t.x, cy = t.y; // (a hero's run follows its mark if it steps; an enemy's keeps to the path it showed on the floor)
  const follow = heroic(w, u) && o.follow !== false, sx0 = u.x, sy0 = u.y, th0 = angleTo(cx, cy, u.x, u.y), d0 = dist(cx, cy, u.x, u.y), d1 = t.r + u.r + 8, R = bladeReach(u);
  // the far side of it from where it looks (its back), or straight across if it faces away already
  let back = t.facing + Math.PI; if (angleDiff(back, th0) < 0.7) back = th0 + Math.PI;
  const path = (sd) => { let sw = wrapAngle(back - th0); if (sd > 0 && sw < 0) sw += TAU; if (sd < 0 && sw > 0) sw -= TAU; if (Math.abs(sw) > 4.6) sw = sd * 4.6;
    const bulge = clamp(d0 * 0.16, 14, 40);
    return (k) => { const th = th0 + sw * eOut(k), r = mix(d0, d1, eOut(k)) + bulge * Math.sin(Math.PI * k) * (1 - k * 0.5); return { x: cx + Math.cos(th) * r, y: cy + Math.sin(th) * r }; }; };
  const clear = (p) => { for (let i = 1; i <= 10; i++) { const q = p(i / 10); if (solid(w, q.x, q.y, u.r * 0.7)) return false; } return true; };
  const want = o.side || (Math.sin(back - th0) >= 0 ? 1 : -1);
  let sd = want, p = path(want); if (!clear(p)) { sd = -want; p = path(sd); if (!clear(p)) { sd = want; const e0 = { x: cx + Math.cos(th0) * d1, y: cy + Math.sin(th0) * d1 }; p = (k) => ({ x: mix(sx0, e0.x, eOut(k)), y: mix(sy0, e0.y, eOut(k)) }); if (!clear(p)) return null; } } // (no way round, then straight at it; no way at all: null, and the caller does something else)
  const at = (k) => { const q = p(k), q2 = p(Math.min(1, k + 0.04)), f = k > 0.96 ? angleTo(q.x, q.y, cx, cy) : Math.atan2(q2.y - q.y, q2.x - q.x); return { x: q.x, y: q.y, f, ba: -1.15 }; };
  let kPrev = 0, fEnd = 0;
  const cutHit = (e) => { const fromBehind = angleDiff(angleTo(e.x, e.y, u.x, u.y), e.facing) > 1.9, D = u.act.dv;
    if (o.strike) o.strike(e, fromBehind); else blow(w, u, e, o.dmg, o, { kAngle: angleTo(u.x, u.y, e.x, e.y), crit: fromBehind || (o.hit && o.hit.crit) }); // (o.strike: the caller lands its own blow)
    if (o.each) o.each(e, fromBehind);
    k2(w, { draw: 'dashHit', x: e.x, y: e.y, a: fEnd + D.sgn * 1.2, r: e.vr * 1.15, max: 0.34, col: D.col, big: true }); };
  return begin(w, u, 'hook', o, [
    { dur: tell, wind: true,
      enter(D) { D.bl = { r0: u.r * 0.6, r1: R }; D.ghost = o.ghost || (u.team === 'hero' ? '#5E6B86' : '#9A5548'); D.cutting = false; D.bodyHits = false;
        u.facing = angleTo(u.x, u.y, cx, cy);
        if (!heroic(w, u)) { let a = p(0); for (let i = 1; i <= 4; i++) { const b = p(i / 4); lane(w, u, D, a.x, a.y, b.x, b.y, tell + RUN * 0.5, u.r + 4); a = b; } spot(w, u, D, cx, cy, t.r + 10, tell + RUN); }
        D.thr = { shape: 'circle', x: cx, y: cy, r: t.r + R * 0.7, sp: 900, lead: RUN };
        k2(w, { draw: 'dashSettle', unit: u, x: u.x, y: u.y, a: u.facing + sd * 0.9, max: tell, col: D.col, side: sd }); },
      tick(k, dt, D) { const e = eOut3(k); D.body = { lean: -0.22 * e, sx: 1 + 0.06 * e, sy: 1 - 0.12 * e, tilt: -sd * 0.22 * e }; D.arm = { r: -0.8 * e, dy: -6 * e }; } },
    { dur: RUN,
      enter(D) { D.passing = true; D.lines = true; kPrev = 0; if (o.inv) u.invulnT = Math.max(u.invulnT || 0, RUN + 0.05); dust(w, u.x, u.y, u.facing + Math.PI, 6);
        if (o.graze) { D.cutting = true; ribStart(w, u, D, { life: 0.16 }); }
        k2(w, { draw: 'dashArc', unit: u, x: u.x, y: u.y, pts: [], max: RUN + 0.5, col: D.col }); },
      tick(k, dt, D) { const b = Math.sin(Math.PI * Math.min(1, k * 1.15)); D.body = { lean: 0.22, sx: mix(1, 0.88, b), sy: mix(1, 1.24, b), tilt: sd * 0.34 * b, alpha: o.alpha }; D.arm = { r: -1.15, dy: 2 };
        if (follow && alive(t)) { cx = t.x; cy = t.y; }
        sweep(w, u, D, kPrev, k, at, o.graze ? (e) => { if (e === t) { D.hit.delete(e); return; } blow(w, u, e, (typeof o.dmg === 'function' ? o.dmg(e) : o.dmg) * o.graze, o, { knock: 60 }); k2(w, { draw: 'dashHit', x: e.x, y: e.y, a: u.facing, r: e.vr * 0.8, max: 0.25, col: D.col }); } : null);
        kPrev = k; },
      exit(D) { D.passing = false; D.lines = false; ribEnd(w, D); D.hit.clear(); fEnd = alive(t) ? angleTo(u.x, u.y, t.x, t.y) : u.facing; dust(w, u.x, u.y, u.facing, 5, undefined, 100); if (o.arrive) o.arrive(D); } },
    { dur: CUT,
      enter(D) { D.cutting = true; D.bodyHits = false; kPrev = 0; D.bl.r1 = R + 6; ribStart(w, u, D, { life: 0.26, th: 20 });
        if (o.only && !alive(o.only)) D.o = { ...o, only: null }; }, // (the one it came for fell on the way: the cut is for whoever is there)
      tick(k, dt, D) { const x = u.x, y = u.y; D.body = { lean: 0.3 * Math.sin(Math.PI * k), sx: 1.04, sy: 1, tilt: sd * 0.34 * (1 - k) };
        const f0 = u.facing; D.arm = { r: mix(-1.15, 0.85, sm(k)), dy: 10 };
        sweep(w, u, D, kPrev, k, (q) => ({ x, y, f: mixA(f0, fEnd, Math.min(1, dt * 30)), ba: mix(-1.15, 0.85, sm(q)) }), cutHit);
        kPrev = k; },
      exit(D) { if (alive(t) && !D.hit.has(t) && !t.ethereal && dist(u.x, u.y, t.x, t.y) < R + t.r + 26) { D.hit.add(t); cutHit(t); } // (the one it came round for, a step out of the sweep)
        ribEnd(w, D); D.thr = null; } },
    { dur: o.recover ?? 0.16, tick(k, dt, D) { const e = sm(k); D.body = { lean: 0, sx: 1, sy: 1, tilt: 0 }; D.arm = { r: 0.85 * (1 - e), dy: 10 * (1 - e) }; } },
  ]);
}

// ---------------------------------------------------------------- 4. the feint
// A step one way with a copy of the body carrying on that way, a planted foot, and the real dash back across the
// target's other flank with the weapon out. o: { t, a (no target: the real dash goes this way and cuts nothing: an
//   escape), tell, dmg, hit, len (past the target), ghost, side }
export function feint(w, u, o) {
  const t = o.t || null, tell = o.tell ?? (heroic(w, u) ? 0 : 0.26), STEP = 0.14, PLANT = 0.07, GO = o.go ?? (t ? clamp(dist(u.x, u.y, t.x, t.y) / 1500, 0.13, 0.22) : 0.13);
  const a0 = t ? angleTo(u.x, u.y, t.x, t.y) : o.a, sd = o.side || (rand() < 0.5 ? 1 : -1), x0 = u.x, y0 = u.y;
  const stepA = t ? a0 + sd * 0.95 : a0 + sd * 1.2, stepL = clearLen(w, x0, y0, stepA, o.step ?? (t ? 44 : 34), u.r * 0.8);
  const fx0 = x0 + Math.cos(stepA) * stepL, fy0 = y0 + Math.sin(stepA) * stepL, R = bladeReach(u, -2), thrust = (u.def.attackAnim || '') === 'thrust' || u.def.role === 'skirmish';
  // the real line: from the planted foot past the target's other flank and on a body's length (or straight out, an escape)
  let ga, gL;
  if (t) { const gx = t.x + Math.cos(a0 - sd * Math.PI / 2) * t.r * 0.35, gy = t.y + Math.sin(a0 - sd * Math.PI / 2) * t.r * 0.35; ga = angleTo(fx0, fy0, gx, gy); gL = dist(fx0, fy0, gx, gy) + (o.len ?? t.r + u.r + 18); }
  else { ga = o.a; gL = o.len ?? 150; }
  gL = clearLen(w, fx0, fy0, ga, gL, u.r * 0.9);
  let kPrev = 0;
  const phs = [];
  if (tell > 0) phs.push({ dur: tell, wind: true,
    enter(D) { if (t) u.facing = a0; if (!heroic(w, u)) lane(w, u, D, fx0, fy0, fx0 + Math.cos(ga) * gL, fy0 + Math.sin(ga) * gL, tell + STEP + PLANT, u.r + 6);
      k2(w, { draw: 'dashSettle', unit: u, x: u.x, y: u.y, a: stepA, max: tell, col: D.col, side: sd }); },
    tick(k, dt, D) { const e = eOut3(k); D.body = { lean: -0.2 * e, sx: 1 + 0.08 * e, sy: 1 - 0.14 * e, tilt: -sd * 0.12 * e }; D.arm = { r: -0.3 * e, dy: -8 * e }; } });
  phs.push({ dur: STEP,
    enter(D) { D.bl = { r0: u.r * 0.5, r1: R }; D.ghost = o.ghost || (u.team === 'hero' ? '#5E6B86' : '#9A5548'); D.cutting = false; D.bodyHits = false; D.passing = true; kPrev = 0;
      if (o.inv) u.invulnT = Math.max(u.invulnT || 0, STEP + PLANT + GO + 0.05); dust(w, x0, y0, stepA + Math.PI, 4); },
    tick(k, dt, D) { const e = eOut(k), h = Math.sin(Math.PI * k); D.body = { lean: 0.12, sx: 1, sy: 1 + 0.1 * h, tilt: sd * 0.3 * h, hop: 7 * h }; D.arm = { r: -0.3, dy: -8 };
      const f = t ? mixA(a0, stepA, 0.55) : stepA; u.x = mix(x0, fx0, e); u.y = mix(y0, fy0, e); u.facing = f; u.mvA = stepA; },
    exit(D) { // the copy carries on the way the step was going
      const v = 230; stamp(w, u, D, { life: 0.45, vx: Math.cos(stepA) * v, vy: Math.sin(stepA) * v, a: 0.85 }); } });
  phs.push({ dur: PLANT,
    enter(D) { dust(w, fx0 + Math.cos(stepA) * u.r * 0.7, fy0 + Math.sin(stepA) * u.r * 0.7, stepA, 6, undefined, 120); k2(w, { draw: 'dashKick', x: fx0, y: fy0, a: ga, max: 0.3 }); },
    tick(k, dt, D) { const e = eOut(k); D.body = { lean: -0.1, sx: 1 + 0.16 * e, sy: 1 - 0.22 * e, tilt: -sd * 0.36 * e }; u.facing = mixA(u.facing, ga, Math.min(1, dt * 30)); D.arm = thrust ? { r: 0, dy: -14 * e } : { r: -1.0 * e, dy: -4 }; } });
  phs.push({ dur: GO,
    enter(D) { // (the real line is aimed again from the planted foot at where the target is now: it may have stepped)
      if (t && alive(t)) { const b0 = angleTo(fx0, fy0, t.x, t.y), gx = t.x + Math.cos(b0 - sd * Math.PI / 2) * t.r * 0.35, gy = t.y + Math.sin(b0 - sd * Math.PI / 2) * t.r * 0.35, na = angleTo(fx0, fy0, gx, gy);
        if (angleDiff(na, ga) < 0.7) { ga = na; gL = clearLen(w, fx0, fy0, ga, dist(fx0, fy0, gx, gy) + (o.len ?? t.r + u.r + 18), u.r * 0.9); } }
      gL *= D.short; D.lines = true; D.cutting = !!t; kPrev = 0; u.facing = ga; if (t) ribStart(w, u, D, { life: 0.2, th: thrust ? 12 : 16, lance: thrust }); },
    tick(k, dt, D) { D.body = { lean: 0.3, sx: 0.84, sy: 1.32, tilt: -sd * 0.12 * (1 - k) }; D.arm = thrust ? { r: 0, dy: 26 } : { r: mix(-1.0, 0.7, sm(k)), dy: 8 };
      sweep(w, u, D, kPrev, k, (q) => { const d = gL * eOut(q); return { x: fx0 + Math.cos(ga) * d, y: fy0 + Math.sin(ga) * d, f: ga, ba: thrust ? 0 : mix(-1.0, 0.7, sm(q)) }; }, t ? (e) => {
        blow(w, u, e, o.dmg, o, { kAngle: ga + sd * 0.8 }); if (o.each) o.each(e);
        k2(w, { draw: 'dashHit', x: e.x, y: e.y, a: ga, r: e.vr, max: 0.3, col: D.col }); } : null);
      kPrev = k; },
    exit(D) { // (the one it was for, a step out of the blade: still caught, as the hook's is)
      if (t && alive(t) && !t.ethereal && !D.hit.has(t) && segDist(t.x, t.y, fx0, fy0, u.x, u.y) < R + t.r + 14) { D.hit.add(t); blow(w, u, t, o.dmg, o, { kAngle: ga + sd * 0.8 }); if (o.each) o.each(t); k2(w, { draw: 'dashHit', x: t.x, y: t.y, a: ga, r: t.vr, max: 0.3, col: D.col }); }
      D.passing = false; D.lines = false; D.thr = null; ribEnd(w, D); dust(w, u.x, u.y, ga, 5, undefined, 110); } });
  phs.push({ dur: o.recover ?? 0.15,
    tick(k, dt, D) { const e = sm(k); D.body = { lean: mix(0.3, 0, e), sx: mix(0.9, 1, e), sy: mix(1.2, 1, e), tilt: 0 }; D.arm = thrust ? { r: 0, dy: 26 * (1 - e) } : { r: 0.7 * (1 - e), dy: 8 * (1 - e) };
      if (t && alive(t)) u.facing = mixA(u.facing, angleTo(u.x, u.y, t.x, t.y), Math.min(1, dt * 16)); u.x += Math.cos(ga) * 50 * (1 - k) * dt; u.y += Math.sin(ga) * 50 * (1 - k) * dt; } });
  const A = begin(w, u, 'feint', { ...o, a: ga }, phs);
  if (t) A.dv.thr = { shape: 'line', x1: fx0, y1: fy0, x2: fx0 + Math.cos(ga) * gL, y2: fy0 + Math.sin(ga) * gL, hw: u.r + 10, sp: gL / GO, go: phs.length - 2 };
  return A;
}

// ---------------------------------------------------------------- 5. the drag and fling
// A shouldered charge: it rocks back, runs (slow off the mark, then fast), and the first one it meets is picked up on its
// front and carried; the rest are shouldered aside. At the end of the line it plants its feet and the one it carried is
// flung on down the line (into a wall, if there is one: a slam). o: { a, len, tell, speed, dmg (each one it meets),
//   fling (the blow as it lets go), knock, hit, carry (false: it bowls everyone aside, picks nobody up), slam(e) (it
//   was driven into a wall), flung(e), wall() (it ran into a wall itself) }. Of the blow dmg: the one picked up takes
//   grabK (0.5) of it as it is hit and fling (0.6 x dmg unless given) as it is let go; the ones shouldered aside take
//   aside (1) of it.
export function dragFling(w, u, o) {
  const a = o.a, tell = o.tell ?? (heroic(w, u) ? 0.2 : 0.45), x0 = u.x, y0 = u.y, sp = o.speed || u.def.speed * 2.6;
  let L = clearLen(w, x0, y0, a, o.len, u.r * 0.9), wall = L < o.len - 10, held = null, heldDmg = 0, kPrev = 0, hx = 0, hy = 0;
  const T = Math.max(0.16, L / sp * 1.2);
  const canCarry = (e) => o.carry !== false && !e.fixed && !e.def.boss && !e.def.part && e.mass <= (o.maxMass ?? Math.max(3, u.mass * 1.6)) && !(e.buffs || []).some((b) => b.knockImmune) && !(e.trinketHooks || []).some((h) => h.knockImmune);
  const carry = (w2) => { if (!held) return; if (!alive(held)) { held = null; return; }
    // (round 19, lane physics19: picked up, it is drawn onto the carrier's front over a few steps: 35% of the way a
    // step and never less than 9. It was put there in the one step it was met, up to 60 or 70 from where it stood: a
    // crawler's head went 54 in a step and its whole body with it)
    { const tx = u.x + Math.cos(a) * (u.r + held.r + 1), ty = u.y + Math.sin(a) * (u.r + held.r + 1), ex = tx - held.x, ey = ty - held.y, ed = Math.hypot(ex, ey), go = ed <= 9 ? 1 : Math.max(0.35, 9 / ed);
      held.x += ex * go; held.y += ey * go; } held.vx = held.vy = held.kx = held.ky = held.dvx = held.dvy = 0; held.spd = 0;
    held.stunT = Math.max(held.stunT || 0, 0.12); held.passUntil = w2.time + 0.05; };
  const letGo = (D, slam) => { const e = held; held = null; if (!e || !alive(e)) return;
    const kn = (o.knock ?? 300) * (slam ? 0.5 : 1);
    blow(w, u, e, o.fling ?? heldDmg * 0.6, o, { knock: kn, kAngle: a, heavy: true, ...(o.flingHit || {}), ...(slam ? { stagger: ((o.hit && o.hit.stagger) || 0) + 30 } : {}) });
    k2(w, { draw: 'dashFling', x: u.x + Math.cos(a) * (u.r + 4), y: u.y + Math.sin(a) * (u.r + 4), a, r: u.r + 18, max: 0.4, col: D.col, slam: !!slam });
    w.shake = Math.max(w.shake, slam ? 7 : 5); if (slam) { puff(w, e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, '#E9DDC2', 12, 150, 6, 0.5); sparks(w, e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, a + Math.PI, 6, '#FFF4C8', 1.1); if (o.slam) o.slam(e); }
    if (o.flung) o.flung(e, slam); };
  return begin(w, u, 'dragFling', o, [
    { dur: tell, wind: true,
      enter(D) { u.facing = a; D.bl = null; D.ghost = null;
        if (!heroic(w, u)) lane(w, u, D, x0, y0, x0 + Math.cos(a) * (L + u.r), y0 + Math.sin(a) * (L + u.r), tell, u.r + 8);
        D.thr = { shape: 'line', x1: x0, y1: y0, x2: x0 + Math.cos(a) * (L + u.r), y2: y0 + Math.sin(a) * (L + u.r), hw: u.r + 10, sp };
        k2(w, { draw: 'dashSettle', unit: u, x: u.x, y: u.y, a, max: tell, col: D.col, heavy: true }); },
      tick(k, dt, D) { const e = eOut3(k); u.facing = mixA(u.facing, a, Math.min(1, dt * 12)); D.body = { lean: -0.36 * e, sx: 1 + 0.08 * e, sy: 1 - 0.1 * e, tilt: Math.sin(w.time * 38) * 0.035 * k };
        D.arm = { r: -0.4 * e, dy: -8 * e }; D.off = { r: 0.6 * e, dy: 12 * e };
        if (rand() < dt * 16) dust(w, u.x - Math.cos(a) * u.r, u.y - Math.sin(a) * u.r, a + Math.PI, 1, undefined, 110); } },
    { dur: T,
      enter(D) { L *= D.short; D.lines = true; kPrev = 0; D.passing = true; D.bodyHits = true; D.bodyR = u.r + 6; dust(w, x0, y0, a + Math.PI, 8, undefined, 130); // (bodyR: a shoulder's width, as the old charge reached) k2(w, { draw: 'dashKick', x: x0, y: y0, a, max: 0.4, big: true });
        k2(w, { draw: 'dashFurrow', unit: u, x: x0, y: y0, a, x0, y0, max: T + 0.7, col: D.col }); },
      tick(k, dt, D) { const b = Math.sin(Math.PI * Math.min(1, k * 1.4)); D.body = { lean: 0.26, sx: 1.06, sy: mix(1, 1.1, b), tilt: Math.sin(w.time * 30) * 0.02 }; D.arm = { r: -0.2, dy: -6 }; D.off = { r: 0.85, dy: 20, dx: 6 };
        const ease = (q) => q * q * (2.2 - 1.2 * q); // slow off the mark, then flat out
        sweep(w, u, D, kPrev, k, (q) => { const d = L * ease(q); return { x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d, f: a }; }, (e, how, px, py) => {
          const sdE = Math.sign(Math.sin(angleTo(px, py, e.x, e.y) - a)) || 1, ahead = angleDiff(angleTo(px, py, e.x, e.y), a) < 1.0;
          const full = typeof o.dmg === 'function' ? o.dmg(e) : o.dmg;
          if (!D.first && ahead) { // the first one met: picked up if it can be, or rammed with the whole blow if it is too big to carry
            D.first = e; k2(w, { draw: 'dashHit', x: e.x, y: e.y, a, r: e.vr, max: 0.3, col: D.col, thud: true }); w.shake = Math.max(w.shake, 4);
            if (canCarry(e)) { held = e; heldDmg = full; if (full * (o.grabK ?? 0.5) > 0) blow(w, u, e, full * (o.grabK ?? 0.5), o, { knock: 0 }); if (o.grab) o.grab(e); }
            else { blow(w, u, e, full * (o.grabK ?? 0.5) + (o.fling ?? full * 0.6), o, { knock: o.knock ?? 300, kAngle: a, heavy: true, ...(o.flingHit || {}) }); if (o.flung) o.flung(e, false); }
          } else { if (full * (o.aside ?? 1) > 0) { blow(w, u, e, full * (o.aside ?? 1), o, { knock: o.sideKnock ?? (o.knock ?? 300) * 0.8, kAngle: a + sdE * 1.05, heavy: true }); w.shake = Math.max(w.shake, 4); } if (o.brushed) o.brushed(e, sdE); } });
        kPrev = k; carry(w);
        if (rand() < dt * 30) dust(w, u.x - Math.cos(a) * u.r, u.y - Math.sin(a) * u.r, a + Math.PI, 1, undefined, 60); },
      exit(D) { D.lines = false; D.passing = false; D.thr = null; hx = u.x; hy = u.y; } },
    { dur: 0.12, // the feet planted: a skid, the one carried still on the front
      tick(k, dt, D) { const e = eOut(k); D.body = { lean: mix(0.26, -0.18, e), sx: 1 + 0.1 * e, sy: 1 - 0.12 * e, tilt: 0 }; D.off = { r: 0.85, dy: mix(20, 4, e), dx: 6 };
        if (!wall) { u.x = hx + Math.cos(a) * 14 * e; u.y = hy + Math.sin(a) * 14 * e; } carry(w); if (k < 0.6 && rand() < dt * 60) dust(w, u.x + Math.cos(a) * u.r, u.y + Math.sin(a) * u.r, a, 1, undefined, 140); },
      exit(D) { if (wall && !held && o.wall) o.wall(); letGo(D, wall && !!held); } },
    { dur: o.recover ?? (heroic(w, u) ? 0.22 : 0.4), // the heave: arms thrown out after it, then back
      tick(k, dt, D) { const p = Math.sin(Math.PI * Math.min(1, k * 2)); D.body = { lean: mix(-0.18, 0, sm(k)) + 0.3 * p * (1 - k), sx: 1, sy: 1, tilt: 0 }; D.off = { r: 0.85 * (1 - sm(k)), dy: mix(4, 30, p) * (1 - sm(k)), dx: 6 * (1 - k) }; D.arm = { r: -0.2 * (1 - k), dy: 14 * p }; } },
  ]);
}

// ---------------------------------------------------------------- 6. the pounce
// A crouch with a wriggle, a leap that hangs at the top, and a landing with the claws raked down through whatever is
// under them. o: { x, y (where it comes down) | t (onto this one), tell, air, r (the rake's reach round the landing),
//   dmg, hit, land(list, D) (after the rake: pins and the like), kind, dustCol }
export function pounce(w, u, o) {
  const tell = o.tell ?? (heroic(w, u) ? 0.18 : 0.42), x0 = u.x, y0 = u.y;
  let x1 = o.x, y1 = o.y; if (o.t) { const a0 = angleTo(x0, y0, o.t.x, o.t.y), d = Math.max(0, dist(x0, y0, o.t.x, o.t.y) - (u.r + o.t.r) * (o.close ?? 0.72)); x1 = x0 + Math.cos(a0) * d; y1 = y0 + Math.sin(a0) * d; }
  let a = angleTo(x0, y0, x1, y1), L = clearLen(w, x0, y0, a, dist(x0, y0, x1, y1), u.r * 0.8);
  const AIR = o.air ?? clamp(0.3 + L / 900, 0.34, 0.52), H = o.h ?? clamp(26 + L * 0.08, 26, 50), rr = o.r ?? u.r + 30;
  // quick off the floor, slow at the top, quick down. A hero's leap onto a foe comes down where that foe is by then (it
  // may have stepped); an enemy's comes down where the floor showed.
  const track = heroic(w, u) && o.t && o.track !== false, eye = !heroic(w, u) && !!o.t && o.eye !== false, L0 = L; let tx = x0 + Math.cos(a) * L, ty = y0 + Math.sin(a) * L, cut = false; // (cut: Targeted, it falls short)
  const pos = (k) => { const s = clamp(k + 0.11 * Math.sin(TAU * k), 0, 1);
    if (track && !cut && alive(o.t) && k < 0.9) { const b = angleTo(x0, y0, o.t.x, o.t.y), d = Math.min(L + 90, Math.max(0, dist(x0, y0, o.t.x, o.t.y) - (u.r + o.t.r) * (o.close ?? 0.72))); tx = x0 + Math.cos(b) * d; ty = y0 + Math.sin(b) * d; }
    return { x: x0 + (tx - x0) * s, y: y0 + (ty - y0) * s }; };
  return begin(w, u, 'pounce', { ...o, a }, [
    { dur: tell, wind: true,
      enter(D) { u.facing = a; D.bl = null; if (!heroic(w, u)) spot(w, u, D, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L, rr, tell + AIR);
        D.thr = { shape: 'circle', x: x0 + Math.cos(a) * L, y: y0 + Math.sin(a) * L, r: rr, sp: 0, lead: AIR };
        k2(w, { draw: 'dashSettle', unit: u, x: u.x, y: u.y, a, max: tell, col: D.col, beast: true }); },
      tick(k, dt, D) { const e = eOut3(k);
        // an enemy keeps its eyes on its mark while it crouches (the circle on the floor follows), and picks its spot as it
        // leaves the floor: from then the circle stays put, and the time in the air is the time to step out of it
        if (eye && alive(o.t)) { const b = angleTo(x0, y0, o.t.x, o.t.y), d = Math.min(L0 + 90, Math.max(0, dist(x0, y0, o.t.x, o.t.y) - (u.r + o.t.r) * (o.close ?? 0.72)));
          a = b; L = clearLen(w, x0, y0, a, d, u.r * 0.8); tx = x0 + Math.cos(a) * L; ty = y0 + Math.sin(a) * L; if (D.zones[0]) { D.zones[0].x = tx; D.zones[0].y = ty; } if (D.thr) { D.thr.x = tx; D.thr.y = ty; } }
        u.facing = mixA(u.facing, a, Math.min(1, dt * 12)); D.body = { lean: -0.3 * e, sx: 1 + 0.16 * e, sy: 1 - 0.24 * e, tilt: Math.sin(w.time * 34) * 0.07 * k }; D.arm = { r: -0.2 * e, dy: -10 * e }; D.off = { r: -0.2 * e, dy: -10 * e }; } },
    { dur: AIR,
      enter(D) { L *= D.short; if (D.short < 1) { cut = true; tx = x0 + Math.cos(a) * L; ty = y0 + Math.sin(a) * L; } D.passing = true; if (o.inv) u.invulnT = Math.max(u.invulnT || 0, AIR); dust(w, x0, y0, a + Math.PI, 7, o.dustCol, 120); k2(w, { draw: 'dashKick', x: x0, y: y0, a, max: 0.35 }); },
      tick(k, dt, D) { const q = pos(k), up = Math.sin(Math.PI * k); u.x = q.x; u.y = q.y; if (track) a = angleTo(x0, y0, tx, ty); u.facing = a; u.mvA = a; u.hop = u.dvHop = H * Math.pow(up, 0.8);
        const rise = clamp(1 - k / 0.35, 0, 1), fall = clamp((k - 0.6) / 0.4, 0, 1);
        D.body = { lean: 0.1 + 0.3 * fall - 0.1 * rise, sx: 1 - 0.1 * rise - 0.08 * fall, sy: 1 + 0.26 * rise + 0.2 * fall, tilt: 0 };
        const paws = sm(clamp((k - 0.2) / 0.3, 0, 1)) * (1 - fall); D.arm = { r: -0.55 * paws + 0.5 * fall, dy: mix(-10, 18, paws) + 14 * fall }; D.off = { r: -0.55 * paws + 0.5 * fall, dy: mix(-10, 18, paws) + 14 * fall }; },
      exit(D) { u.hop = u.dvHop = 0; D.passing = false; D.thr = null;
        const list = opponents(w, u).filter((e) => (!o.only || e === o.only) && dist(u.x, u.y, e.x, e.y) < rr + e.r * 0.5 && (heroic(w, u) ? angleDiff(angleTo(u.x, u.y, e.x, e.y), a) < 1.5 || dist(u.x, u.y, e.x, e.y) < u.r + e.r : true));
        for (const e of list) { blow(w, u, e, o.dmg, o, { kAngle: a }); k2(w, { draw: 'dashClaws', x: e.x, y: e.y, a, r: e.vr, max: 0.42, col: D.col }); }
        k2(w, { draw: 'dashLand', x: u.x, y: u.y, a, r: u.r + 16, max: 0.45, col: o.dustCol }); w.shake = Math.max(w.shake, list.length ? 4 : 2); puff(w, u.x, u.y, o.dustCol || '#CDBFA6', 8, 100, 5, 0.4);
        if (o.land) o.land(list, D); } },
    { dur: 0.16, // the landing: flat, the claws dragged back through
      tick(k, dt, D) { const e = eOut(k); D.body = { lean: mix(0.36, 0.05, e), sx: mix(1.18, 1, e), sy: mix(0.72, 1, e), tilt: 0 }; D.arm = { r: mix(0.6, 0, e), dy: mix(30, -6, e) }; D.off = { r: mix(0.6, 0, e), dy: mix(30, -6, e) };
        u.x += Math.cos(a) * 46 * (1 - k) * dt; u.y += Math.sin(a) * 46 * (1 - k) * dt; } },
    { dur: o.recover ?? (heroic(w, u) ? 0.1 : 0.2), tick(k, dt, D) { D.body = { lean: 0, sx: 1, sy: 1, tilt: 0 }; D.arm = { r: 0, dy: -6 * (1 - k) }; D.off = { r: 0, dy: -6 * (1 - k) }; } },
  ]);
}

// ---------------------------------------------------------------- by name, and what a watcher sees coming
export const DASHES = { drawCut, blinkChain, hook, feint, dragFling, pounce };
export function dash(w, u, style, o) { return DASHES[style](w, u, o); }
// When will e's dash reach u? Seconds from now, or null if it is not coming u's way (threat.js: the timed dodges, the
// guards and the rescues read it; a tell still running counts in full, the travel by its speed).
export function dashThreat(w, e, u) {
  const D = dashOf(e); if (!D || !D.thr) return null; const z = D.thr;
  if (!inZone(z, u.x, u.y, u.r * 0.6)) return null;
  const go = z.go ?? 1; let wait = 0; // (what is left of every phase before the one that travels; z.go: which that is)
  for (let i = D.i; i < go && i < D.phs.length; i++) wait += (i === D.i ? D.phs[i].dur - D.pt : D.phs[i].dur) * (D.phs[i].wind ? windMul(e) : 1);
  if (z.shape === 'circle') return wait + (D.i <= go ? (z.lead || 0) - (D.i === go ? D.pt : 0) : 0);
  const along = Math.max(0, dist(z.x1, z.y1, u.x, u.y) - dist(z.x1, z.y1, e.x, e.y) - u.r - e.r);
  return wait + along / Math.max(60, z.sp || 600);
}
