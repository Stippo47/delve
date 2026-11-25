// Cinder, the Old Drake: the Ember Deep's boss (floor 3). Design and numbers: docs/BOSS-cinder.md.
// The designer, round 9: "Very large, made of multiple components. No wings. No flying. Fire call that drops fireballs
// from the sky as an ability. Scorch. Shoots a narrow cone of flames forwards head turning slowly. Obstacles block it.
// More abilities." Round 12, on what was built: "Everything is off. The art. The attacks visuals. How it is stuck in 1
// spot. And so on". So, round 13, from scratch: an animal that walks. It prowls round the party on four legs that
// step, never still for long; its long body follows its head's path; it rushes, pens the party in a ring of fire,
// whips its tail at whoever is behind it. The head is the boss; the body is hit boxes along its spine (k.parts) and
// the tail's blade can be broken off. Art: drawn in code as one animal (js/boss-cinder-fx.js).
import { alive, hurt, puff, sparks, flames, setAnim, addDanger, addBuff } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { hold, beginHold, due, again, stand, turnTo } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, lead, charge, chargeTick, part, endParts, PART, place, logOf, notePhase, inside, stage, bfx, liveZone, keepZone, TEST_MOVE } from './boss-kit.js';
import { drawCinder, drawCinderPart, drawPitFloor, drawPitAir } from './boss-cinder-fx.js';

// the spine: how far behind the head's centre each joint rides, and how thick the body is there
export const SPINE = [[0, 30], [44, 25], [84, 28], [128, 41], [178, 45], [228, 44], [276, 39], [322, 29], [362, 23], [398, 18], [432, 14], [466, 10]];
export const LEN = 466, SHOULDER = 128, HIP = 276;
const BOXES = [[84, 28], [128, 40], [178, 44], [228, 43], [276, 38], [322, 28], [380, 21]]; // the hit boxes along it (offset, radius)
export const CD = {
  share: 0.35, tailShare: 0.3, tailHp: 0.08, tailAt: 446, tailR: 22,
  prowl: { r: 250, flip: [6, 10] },
  bite: { r: 140, arc: 1.3, tell: 0.55, dmg: 80, burn: 20, knock: 280, rec: 0.45, cd: [2.6, 3.6] },
  scorch: { len: 460, arc: 0.44, tell: 1.0, dur: 3.0, turn: 0.55, tick: 0.15, dmg: 17, burn: 14, cd: [9, 11.5] },
  tail: { r: 215, arc: 2.5, tell: 0.75, dmg: 70, knock: 380, near: 150, cd: [4, 5.5], reel: 2.0, reelTaken: 1.3 },
  rush: { len: 640, tell: 0.95, dmg: 78, knock: 360, speed: 600, dazed: 1.7, dazedTaken: 1.35, cd: [10, 13] },
  call: { r: 84, tell: 1.4, dmg: 68, burn: 30, fire: 5, extra: 3, cd: [10, 12.5] },
  ring: { r: 255, speed: 3.2, step: 44, fireR: 36, fireT: 11, cd: [24, 28] },
  roar: { r: 230, tell: 0.9, dmg: 17, knock: 340, burn: 20 },
  molten: { drip: 0.55, fireR: 30, fireT: 4, cap: 14 },
};
export const PHASE_AT = [1, 0.66, 0.34];
const WAKE = 500;

function brain(w, u, dt) {
  const k = u.cd || (u.cd = make(w, u));
  steady(u); logOf(w, u, k); stage(w, 'cinder', drawPitFloor, drawPitAir);
  k.t += dt;
  follow(w, u, k, dt); legsTick(u, k, dt); tailTick(k, dt);
  u.jaw = (u.jaw || 0) + ((k.jawWant || 0.08) - (u.jaw || 0)) * Math.min(1, dt * 12); k.jawWant = 0.08;
  if (k.jawHold > 0) { k.jawHold -= dt; k.jawWant = 1; }
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.0, null); roar(w, u, k, 1.0); notePhase(w, k); })) return true;
  if (TEST_MOVE && !k.tested) { k.tested = true;
    if (TEST_MOVE === 'ring') { k.phase = Math.max(2, k.phase); again(u, 'ring', 1); again(u, 'call', 30); again(u, 'scorch', 30); again(u, 'rush', 30); }
    if (TEST_MOVE === 'call') { k.phase = Math.max(2, k.phase); again(u, 'call', 1); again(u, 'ring', 40); again(u, 'scorch', 30); }
    if (TEST_MOVE === 'rush') { again(u, 'rush', 1); again(u, 'scorch', 30); }
    if (TEST_MOVE === 'scorch') again(u, 'scorch', 1); }
  if (k.phase >= 3) drip(w, u, k, dt);
  if (k.roarT > 0) { k.roarT -= dt; k.jawWant = 1; }
  if (breathTick(w, u, k, dt)) return true;
  if (ringTick(w, u, k, dt)) return true;
  if (chargeTick(w, u, k, dt)) { k.jawWant = 0.5; return true; }
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt, 1.4);
  if (!t) { stand(u, dt); return true; }
  const d = dist(u.x, u.y, t.x, t.y), at = angleTo(u.x, u.y, t.x, t.y), K = k.phase >= 3 ? 0.85 : 1, hs = heroesOf(w, u);
  k.look = at;
  // whoever is behind it: the tail
  const tail = k.tail && alive(k.tail) ? k.tail : null;
  if (tail && !k.swing && due(u, 'lash', dt, 1.2)) {
    const hip = at_(k, u, HIP), tip = at_(k, u, LEN), back = angleTo(hip.x, hip.y, tip.x, tip.y);
    if (hs.some((h) => dist(h.x, h.y, tip.x, tip.y) < CD.tail.near || dist(h.x, h.y, (hip.x + tip.x) / 2, (hip.y + tip.y) / 2) < CD.tail.near)) { again(u, 'lash', ...CD.tail.cd.map((x) => x * K)); tailSweep(w, u, k, hip, back); }
    else again(u, 'lash', 0.4);
  }
  // at its mouth: a snap
  if (d - t.r < 150 && angleDiff(u.facing, at) < 0.8 && due(u, 'bite', dt, 0.7)) { again(u, 'bite', ...CD.bite.cd.map((x) => x * K)); bite(w, u, k, at, K); return true; }
  if (k.phase >= 2 && due(u, 'ring', dt, 6)) { again(u, 'ring', ...CD.ring.cd); if (startRing(w, u, k, hs)) return true; }
  if (k.phase >= 2 && due(u, 'call', dt, 2.5)) { again(u, 'call', ...CD.call.cd.map((x) => x * (k.phase >= 3 ? 0.75 : 1))); fireCall(w, u, k, hs); return true; }
  if (due(u, 'scorch', dt, 3.5) && d < CD.scorch.len + 40 && d > 130) { again(u, 'scorch', ...CD.scorch.cd.map((x) => x * K)); startBreath(w, u, k, at); return true; }
  if (due(u, 'rush', dt, 5) && d > 230) {
    again(u, 'rush', ...CD.rush.cd.map((x) => x * K));
    const p = lead(t, 0.3), R = CD.rush; k.jawWant = 0.6;
    bfx(w, { type: 'drakeCrouch', u, max: R.tell });
    charge(w, u, k, angleTo(u.x, u.y, p.x, p.y), R.len, { tell: R.tell, dmg: R.dmg, knock: R.knock, speed: R.speed, kind: 'fire', trail: 'rgba(120,90,80,0.6)', status: { burn: 20 },
      onEnd: () => beginHold(u, 0.5, null), onWall: () => { bfx(w, { type: 'drakeCrash', x: u.x + Math.cos(u.facing) * u.r, y: u.y + Math.sin(u.facing) * u.r, max: 0.6 }); w.shake = Math.max(w.shake, 10); k.dazed = R.dazed; beginHold(u, R.dazed, null); bfx(w, { type: 'drakeDazed', u, max: R.dazed }); } });
    return true;
  }
  prowl(w, u, k, t, d, at, dt);
  return true;
}
function make(w, u) {
  const k = { phase: 0, t: 0, trail: [], parts: [], legs: [], orbit: chance(0.5) ? 1 : -1, flipT: rrange(...CD.prowl.flip), look: u.facing, swingA: 0, dazed: 0 };
  const back = u.facing + Math.PI;
  for (let d = 0; d < LEN + 80; d += 6) k.trail.push({ x: u.x + Math.cos(back) * d, y: u.y + Math.sin(back) * d });
  for (const [off, r] of BOXES) { const p = part(w, u, 'drakeSegment', u.x + Math.cos(back) * off, u.y + Math.sin(back) * off, { share: CD.share }); p.r = r; p.vr = r; p.off = off; k.parts.push(p); }
  const tl = part(w, u, 'drakeTail', u.x + Math.cos(back) * CD.tailAt, u.y + Math.sin(back) * CD.tailAt, { share: CD.tailShare, pool: true, hp: u.maxHp * CD.tailHp });
  tl.r = CD.tailR; tl.vr = CD.tailR; tl.off = CD.tailAt; tl.isTail = true; k.tail = tl; k.parts.push(tl);
  // four legs: front pair at the shoulders, hind pair at the hips; each foot stays where it is planted until it must step
  for (const [off, s, pair] of [[SHOULDER, -1, 0], [SHOULDER, 1, 1], [HIP, -1, 1], [HIP, 1, 0]]) { const r = restFoot(k, u, off, s); k.legs.push({ off, s, pair, x: r.x, y: r.y, fx: r.x, fy: r.y, tx: r.x, ty: r.y, st: 0 }); }
  return k;
}
// ---------------------------------------------------------------- the body: the spine follows the head's path
// where the spine is at `off` behind the head: { x, y, a } (a: the way it points there). The tail past the hips swings.
export function at_(k, u, off) {
  const T = k.trail; let acc = T.length ? dist(u.x, u.y, T[0].x, T[0].y) : 0, px = u.x, py = u.y, out = null;
  if (off <= acc || !T.length) out = { x: u.x - Math.cos(u.facing) * off, y: u.y - Math.sin(u.facing) * off, a: u.facing };
  else for (let i = 0; i < T.length; i++) {
    const b = T[i], L = i ? dist(px, py, b.x, b.y) : 0;
    if (i && acc + L >= off) { const q = (off - acc) / (L || 1); out = { x: px + (b.x - px) * q, y: py + (b.y - py) * q, a: Math.atan2(py - b.y, px - b.x) }; break; }
    if (i) acc += L; px = b.x; py = b.y;
  }
  if (!out) { const e = T[T.length - 1], p = T[T.length - 2] || { x: u.x, y: u.y }; const a = Math.atan2(p.y - e.y, p.x - e.x); out = { x: e.x - Math.cos(a) * (off - acc), y: e.y - Math.sin(a) * (off - acc), a }; }
  if (off > HIP && k.swingA) { // the tail whips about the hips, more towards its tip
    const h = at_(k, u, HIP), q = Math.pow((off - HIP) / (LEN - HIP), 0.8), an = k.swingA * q, dx = out.x - h.x, dy = out.y - h.y, c = Math.cos(an), s = Math.sin(an);
    out = { x: h.x + dx * c - dy * s, y: h.y + dx * s + dy * c, a: out.a + an };
  }
  return out;
}
function follow(w, u, k) {
  const first = k.trail[0];
  if (!first || dist(first.x, first.y, u.x, u.y) > 4) { k.trail.unshift({ x: u.x, y: u.y }); if (k.trail.length > 220) k.trail.length = 220; }
  for (const p of k.parts) if (alive(p)) { const q = at_(k, u, p.off); place(p, q.x, q.y, q.a); p.shadowK = 0.7; }
  u.shadowK = 0.75;
}
function restFoot(k, u, off, s) { const p = at_(k, u, off), r = off === SHOULDER ? 41 : 39; return { x: p.x + Math.cos(p.a + s * Math.PI / 2) * (r + 44) + Math.cos(p.a) * 12, y: p.y + Math.sin(p.a + s * Math.PI / 2) * (r + 44) + Math.sin(p.a) * 12, a: p.a }; }
// Feet: a foot stays planted; when its rest spot has moved a stride away it steps there (ahead, the way the body is
// going), one diagonal pair at a time.
function legsTick(u, k, dt) {
  const sp = Math.hypot(u.vx || 0, u.vy || 0), stride = clamp(34 + sp * 0.16, 34, 78), T = clamp(0.2 - sp * 0.00022, 0.09, 0.2);
  const stepping = [0, 1].map((p) => k.legs.some((l) => l.pair === p && l.st > 0));
  for (const l of k.legs) {
    const r = restFoot(k, u, l.off, l.s);
    if (l.st > 0) { l.st -= dt / T; const q = clamp(1 - l.st, 0, 1), e = q * q * (3 - 2 * q); l.x = l.fx + (l.tx - l.fx) * e; l.y = l.fy + (l.ty - l.fy) * e; l.lift = Math.sin(q * Math.PI) * 13; if (l.st <= 0) { l.st = 0; l.lift = 0; l.x = l.tx; l.y = l.ty; } continue; }
    const far = dist(l.x, l.y, r.x, r.y);
    if (far > stride * 2.4) { l.x = r.x; l.y = r.y; continue; } // left behind (a charge's end): it catches up at once
    if (far > stride && !stepping[1 - l.pair]) { const lead2 = Math.min(stride * 0.75, sp * T * 1.6 + 10), mv = sp > 8 ? Math.atan2(u.vy, u.vx) : r.a; l.fx = l.x; l.fy = l.y; l.tx = r.x + Math.cos(mv) * lead2; l.ty = r.y + Math.sin(mv) * lead2; l.st = 1; stepping[l.pair] = true; }
  }
}
function tailTick(k, dt) {
  const s = k.swing;
  if (!s) { k.swingA += (Math.sin(k.t * 1.6) * 0.16 - k.swingA) * Math.min(1, dt * 4); return; } // idle: a slow sway
  s.t += dt;
  const A = 1.25 * s.dir, tell = s.tell;
  if (s.t < tell) k.swingA += (-A * (0.55 + 0.45 * s.t / tell) - k.swingA) * Math.min(1, dt * 7);          // wound to one side
  else if (s.t < tell + 0.16) k.swingA = -A + 2 * A * ((s.t - tell) / 0.16);                                   // the whip
  else if (s.t < tell + 0.7) k.swingA += (A * 0.3 - k.swingA) * Math.min(1, dt * 5);
  else k.swing = null;
}

// ---------------------------------------------------------------- how it moves: the prowl
// It walks a circle round its mark, head turned in towards them, and turns about now and then or when the way is shut.
function prowl(w, u, k, t, d, at, dt) {
  const P = CD.prowl;
  if ((k.flipT -= dt) <= 0) { k.flipT = rrange(...P.flip); k.orbit = -k.orbit; }
  const here = angleTo(t.x, t.y, u.x, u.y), R = P.r + 40 * Math.sin(k.t * 0.5);
  let goal = null;
  for (const dir of [k.orbit, -k.orbit]) {
    const a = here + dir * (0.5 + 60 / Math.max(120, d)), g = inside(w, t.x + Math.cos(a) * R, t.y + Math.sin(a) * R, u.r + 30);
    if (dist(g.x, g.y, u.x, u.y) > 50 && lineClear(w, u.x, u.y, g.x, g.y, u.r * 0.6)) { goal = g; if (dir !== k.orbit) { k.orbit = dir; k.flipT = rrange(...P.flip); } break; }
  }
  if (!goal) goal = { x: t.x, y: t.y };
  walkTo(w, u, goal.x, goal.y, d > R + 120 ? 1.35 : k.phase >= 3 ? 1.15 : 1, dt);
  const mv = (u.spd || 0) > 6 ? u.mvA : at;
  turnTo(u, mv, 2.6, dt);
}

// ---- Bite: the head darts at whoever is at its mouth
function bite(w, u, k, at, K) {
  const B = CD.bite; k.jawWant = 1;
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a: at, arc: B.arc, r: B.r, t: B.tell * K, team: u.team, src: u, kind: 'fire', quiet: true, hit: H(u, { dmg: B.dmg, burn: B.burn, knock: B.knock, heavy: true }),
    onFire: (w2) => { bfx(w2, { type: 'drakeBite', x: u.x, y: u.y, a: at, r: B.r, max: 0.35 }); u.lungeT = 0.18; } });
  beginHold(u, B.tell * K + B.rec, at); k.jawHold = B.tell * K;
}
// ---- Tail Sweep: wound to one side, then whipped across everything behind it
function tailSweep(w, u, k, hip, back) {
  const S = CD.tail, dir = chance(0.5) ? 1 : -1, tell = S.tell * (k.phase >= 3 ? 0.85 : 1);
  k.swing = { t: 0, dir, tell };
  addDanger(w, { shape: 'cone', x: hip.x, y: hip.y, a: back, arc: S.arc, r: S.r, t: tell, team: u.team, src: k.tail, kind: 'blade', quiet: true, hit: H(u, { dmg: S.dmg, knock: S.knock, heavy: true }),
    onFire: (w2) => { bfx(w2, { type: 'drakeLash', x: hip.x, y: hip.y, a0: back - dir * S.arc / 2, a1: back + dir * S.arc / 2, r: S.r, max: 0.32 }); w2.shake = Math.max(w2.shake, 5); } });
}
function onTailBreak(w, t) {
  const u = t.core; if (!u || !alive(u) || !u.cd) return;
  bfx(w, { type: 'drakeTailOff', x: t.x, y: t.y, a: t.facing, max: 1.0, seed: 3 }); puff(w, t.x, t.y, '#B5754A', 14, 200, 7, 0.5);
  for (let i = 0; i < 8; i++) flames(w, t.x + rrange(-24, 24), t.y + rrange(-24, 24), 1, 12, 90);
  u.cd.swing = null; u.cd.tailOff = true; w.shake = Math.max(w.shake, 9);
  beginHold(u, CD.tail.reel, null); u.cd.roarT = 0.8; addBuff(u, { id: 'tailless', dur: CD.tail.reel, taken: CD.tail.reelTaken }); bfx(w, { type: 'drakeDazed', u, max: CD.tail.reel });
}

// ---- Scorch: a narrow cone of flame, the head turning slowly after its mark; pillars and walls stop it
function startBreath(w, u, k, at) {
  const S = CD.scorch, ph = k.phase >= 3;
  k.br = { t: S.tell, run: S.dur * (ph ? 1.2 : 1), turn: S.turn * (ph ? 1.45 : 1), tick: 0, a: u.facing + clamp(wrapAngle(at - u.facing), -0.5, 0.5), z: null };
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a: k.br.a, arc: S.arc, r: S.len, t: S.tell, team: u.team, src: u, kind: 'fire', quiet: true });
  k.jawHold = S.tell;
}
function breathTick(w, u, k, dt) {
  const b = k.br; if (!b) return false;
  stand(u, dt); k.jawWant = 1;
  if (b.t > 0) { b.t -= dt; turnTo(u, b.a, 3, dt); return true; }
  const S = CD.scorch, t = pickTarget(w, u, k, dt);
  if (t) b.a = wrapAngle(b.a + clamp(wrapAngle(angleTo(u.x, u.y, t.x, t.y) - b.a), -b.turn * dt, b.turn * dt));
  u.facing = b.a; k.look = b.a;
  const mx = u.x + Math.cos(b.a) * u.r * 1.3, my = u.y + Math.sin(b.a) * u.r * 1.3;
  w.drakeBreath = { x: mx, y: my, a: b.a, arc: S.arc, len: S.len - u.r, t: (w.drakeBreath && w.drakeBreath.t || 0) + dt };
  b.z = b.z && w.danger.includes(b.z) ? b.z : liveZone(w, u, { shape: 'cone', x: u.x, y: u.y, a: b.a, arc: S.arc + 0.12, r: S.len, kind: 'fire' });
  keepZone(b.z, { x: u.x, y: u.y, a: b.a });
  if ((b.tick -= dt) <= 0) {
    b.tick = S.tick;
    for (const h of heroesOf(w, u)) {
      const dd = dist(u.x, u.y, h.x, h.y);
      if (dd > S.len + h.r || angleDiff(angleTo(u.x, u.y, h.x, h.y), b.a) > S.arc / 2 + Math.atan2(h.r * 0.6, dd)) continue;
      if (!lineClear(w, u.x, u.y, h.x, h.y, 2) || w.pillars.some((p) => segNear(u.x, u.y, h.x, h.y, p.x, p.y, p.r))) continue; // behind a pillar: safe
      hurt(w, h, S.dmg * u.dmgMul, u, { noDodge: true, burn: S.burn, knock: 40, kAngle: b.a });
    }
  }
  if ((b.run -= dt) <= 0) { k.br = null; w.drakeBreath = null; beginHold(u, 0.7, null); }
  return true;
}
const segNear = (ax, ay, bx, by, px, py, r) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, q = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1); return dist(ax + dx * q, ay + dy * q, px, py) < r; };

// ---- Fire Call (phase 2 on): it roars at the roof and a fireball comes down on every hero (split up), a few more beside
function fireCall(w, u, k, hs) {
  const C = CD.call, n = hs.length + (k.phase >= 3 ? C.extra + 3 : C.extra);
  roar(w, u, k, 0.9); beginHold(u, 1.0, null);
  for (let i = 0; i < n; i++) {
    const h = hs[i % Math.max(1, hs.length)]; if (!h) break;
    const p = lead(h, 0.7), a = rand() * TAU, off = i < hs.length ? 0 : rrange(110, 190), q = inside(w, p.x + Math.cos(a) * off, p.y + Math.sin(a) * off, 50), tell = C.tell + i * 0.13;
    bfx(w, { type: 'fireFall', x: q.x, y: q.y, max: tell, r: C.r });
    addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: C.r, t: tell, team: u.team, src: null, by: u, kind: 'fire', quiet: true, hit: H(u, { dmg: C.dmg, burn: C.burn, knock: 170 }),
      onFire: (w2, z) => { w2.telegraphs.push({ type: 'blast', x: z.x, y: z.y, r: z.r, color: '#FFB347', t: 0.05, max: 0.05, ab: 'fireball' }); flames(w2, z.x, z.y, 8, z.r * 0.5, 100); w2.shake = Math.max(w2.shake, 4);
        if (w2.hazards.filter((x2) => x2.type === 'fire').length < 40) w2.hazards.push({ type: 'fire', x: z.x, y: z.y, r: 46, t: C.fire, max: C.fire }); } });
  }
}
// ---- Ring of Fire (phase 2 on): it runs a full circle round the party, fire falling from its jaws: a pen of flame
function startRing(w, u, k, hs) {
  if (!hs.length) return false;
  const R0 = CD.ring.r, cx = hs.reduce((a, h) => a + h.x, 0) / hs.length, cy = hs.reduce((a, h) => a + h.y, 0) / hs.length;
  const R = Math.min(R0, w.W / 2 - 70, w.H / 2 - 70); if (R < 150) return false;
  const c = { x: clamp(cx, R + 60, w.W - R - 60), y: clamp(cy, R + 60, w.H - R - 60) };
  k.ring = { c, R, a0: angleTo(c.x, c.y, u.x, u.y), dir: k.orbit, went: 0, last: null, on: false, t: 0 };
  roar(w, u, k, 0.5); bfx(w, { type: 'ringMark', x: c.x, y: c.y, r: R, max: 1.6 });
  return true;
}
function ringTick(w, u, k, dt) {
  const g = k.ring; if (!g) return false;
  const G = CD.ring, here = angleTo(g.c.x, g.c.y, u.x, u.y), dr = dist(u.x, u.y, g.c.x, g.c.y);
  g.t += dt; k.jawWant = 0.7;
  if (!g.on && Math.abs(dr - g.R) < 46) { g.on = true; g.a0 = here; g.prev = here; }
  const ahead = here + g.dir * (g.on ? 0.42 : 0.2), goal = { x: g.c.x + Math.cos(ahead) * g.R, y: g.c.y + Math.sin(ahead) * g.R };
  walkTo(w, u, goal.x, goal.y, G.speed, dt); turnTo(u, (u.spd || 0) > 6 ? u.mvA : here + g.dir * Math.PI / 2, 5, dt);
  if (g.on) {
    g.went += Math.abs(wrapAngle(here - g.prev)); g.prev = here;
    if (!g.last || dist(g.last.x, g.last.y, u.x, u.y) > G.step) { g.last = { x: u.x, y: u.y };
      const fx2 = g.c.x + Math.cos(here) * g.R, fy = g.c.y + Math.sin(here) * g.R;
      w.hazards.push({ type: 'fire', x: fx2, y: fy, r: G.fireR, t: G.fireT, max: G.fireT, ring: true }); flames(w, fx2, fy, 3, 16, 90); }
  }
  if (g.went >= TAU + 0.15 || g.t > 9) { k.ring = null; again(u, 'scorch', 0.3); again(u, 'call', 2.5); beginHold(u, 0.4, null); }
  return true;
}
// phase 3: it runs molten, and fire drips from it where it walks
function drip(w, u, k, dt) {
  if ((k.dripT = (k.dripT ?? 0.3) - dt) > 0 || (u.spd || 0) < 10) return;
  k.dripT = CD.molten.drip;
  if (w.hazards.filter((h) => h.drip).length >= CD.molten.cap) return;
  const p = at_(k, u, rrange(SHOULDER, HIP + 40));
  w.hazards.push({ type: 'fire', x: p.x + rrange(-14, 14), y: p.y + rrange(-14, 14), r: CD.molten.fireR, t: CD.molten.fireT, max: CD.molten.fireT, drip: true });
}
function roar(w, u, k, t) { k.roarT = t; bfx(w, { type: 'drakeRoar', u, max: t }); w.shake = Math.max(w.shake, 6); for (let i = 0; i < 4; i++) flames(w, u.x + Math.cos(u.facing) * u.r + rrange(-20, 20), u.y + Math.sin(u.facing) * u.r + rrange(-20, 20), 1, 14, 80); }

// ---- phase turns: a roar that throws everyone back
function enter(w, u, k, p) {
  notePhase(w, k); k.br = null; w.drakeBreath = null; k.ch = null; k.ring = null;
  u.invulnT = CD.roar.tell + 0.4; roar(w, u, k, CD.roar.tell + 0.3);
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: CD.roar.r, t: CD.roar.tell, team: u.team, src: u, kind: 'fire', quiet: true, hit: H(u, { dmg: CD.roar.dmg, knock: CD.roar.knock, burn: CD.roar.burn }),
    onFire: (w2, z) => { bfx(w2, { type: 'roarBurst', x: z.x, y: z.y, r: z.r, max: 0.6 }); w2.shake = Math.max(w2.shake, 9); } });
  beginHold(u, CD.roar.tell + 0.5, null);
  if (p === 2) { again(u, 'call', 1.2); again(u, 'ring', 9); }
  if (p === 3) { w.molten = true; u.molten = true; again(u, 'ring', 2.5); }
}
function death(w, u) {
  w.drakeBreath = null; w.molten = false;
  const k = u.cd;
  if (k) for (let off = 0; off <= LEN; off += 58) { const p = at_(k, u, off); bfx(w, { type: 'drakeFall', x: p.x, y: p.y, a: p.a, r: 30 - off * 0.04, max: 1.3, seed: off }); flames(w, p.x, p.y, 3, 20, 90); }
  endParts(w, u); w.shake = Math.max(w.shake, 12);
}

// ---- the pit: a wide cavern, four basalt pillars (they stop the scorch and the rush), lava at its edges
function pit(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 250, y: Hh / 2 };
  for (const [fx, fy] of [[0.33, 0.27], [0.33, 0.73], [0.6, 0.22], [0.6, 0.78]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 40 });
  w.arenaDecor = [[0.8, 0.2, 'bonepile'], [0.8, 0.8, 'skulls'], [0.25, 0.15, 'rubble'], [0.25, 0.85, 'rubble']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.3, v: 0 }));
  w.lava = [[0.06, 0.1, 64], [0.94, 0.5, 74], [0.5, 0.97, 58], [0.5, 0.03, 58], [0.06, 0.9, 50]].map(([fx, fy, r]) => ({ x: W * fx, y: Hh * fy, r }));
  stage(w, 'cinder', drawPitFloor, drawPitAir);
}

export const CINDER = {
  defs: {
    cinder: { team: 'enemy', name: 'Cinder, the Old Drake', r: 40, vr: 44, turn: 2.6, accel: 150, face: 2.6, mass: 12, hp: 900, speed: 56, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 200, coins: [80, 100], boss: true, arena: 'pit', noCorpse: true,
      res: { burn: 0, chill: 1.3, wet: 1.3, stagger: 0.4, poison: 0.25 }, draw: drawCinder, brain, onDeath: death },
    drakeSegment: PART('Cinder (body)', { r: 40, vr: 40, mass: 40, hp: 100, res: { burn: 0 }, draw: drawCinderPart }),
    drakeTail: PART('Cinder (tail)', { r: 22, vr: 22, mass: 40, hp: 100, res: { burn: 0 }, draw: drawCinderPart, onDeath: onTailBreak }),
  },
  arenas: { pit },
};
