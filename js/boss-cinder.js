// Cinder, the Old Drake: the Ember Deep's boss (floor 3). Design and numbers: docs/BOSS-cinder.md.
// The designer, round 9: "Very large, made of multiple components. No wings. No flying. Fire call that drops fireballs
// from the sky as an ability. Scorch. Shoots a narrow cone of flames forwards head turning slowly. Obstacles block it.
// More abilities." Round 12, on what was built: "Everything is off. The art. The attacks visuals. How it is stuck in 1
// spot. And so on". So, round 13, from scratch: an animal that walks. Round 19 (lane drake19, docs/drake19.md), the
// designer: "Body moves weird, don't like how it attacks. Very slow." So:
//   - its body is a spine, not a train: a chain of joints dragged behind the head (so nothing in it moves faster than
//     the head), each with a limit to how far it bends, stiff through the trunk, kept out of the pillars and inside the
//     room. It cannot kink or knot. The head turns on its neck no further than a neck goes, and can lead the body no
//     further than its chest lets it: the body comes round in a curve. The tail is three springs: it trails, swings
//     out when the hips turn, and whips base first;
//   - it hunts in passes (at its mark, by their side and on, a wheel, again), and every two or three seconds strikes
//     with the part of it that is nearest: the mouth (a bite: it rears back, then the head really darts), a foreleg
//     (the claw: whoever hugs its chest), the tail (whoever is behind it), a gathered rush that skids, the scorch (it
//     breathes in first, and creeps forward after its flame);
//   - its moves tell threat.js when they will land (u.strikes), so a dodge or a guard can be timed against them.
// The head is the boss; the body is hit boxes along its spine (k.parts) and the tail's blade can be broken off.
// Art: drawn in code as one animal (js/boss-cinder-fx.js).
import { alive, hurt, puff, flames, addDanger, addBuff } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { hold, beginHold, due, again, stand, turnTo } from './elites.js';
import { walkTo } from './enemies.js';
import { windMul } from './statuses.js';
import { cue } from './sfx.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, lead, clipLine, part, endParts, PART, place, logOf, notePhase, inside, stage, bfx, liveZone, keepZone, TEST_MOVE } from './boss-kit.js';
import { drawCinder, drawCinderPart, drawPitFloor, drawPitAir, cinderPicture } from './boss-cinder-fx.js';

// the spine: how far behind the head's centre each joint rides, and how thick the body is there
export const SPINE = [[0, 30], [44, 25], [84, 28], [128, 41], [178, 45], [228, 44], [276, 39], [322, 29], [362, 23], [398, 18], [432, 14], [466, 10]];
export const LEN = 466, SHOULDER = 128, HIP = 276;
export const rOf = (off) => { for (let i = 1; i < SPINE.length; i++) if (off <= SPINE[i][0]) { const [o0, r0] = SPINE[i - 1], [o1, r1] = SPINE[i], q = (off - o0) / (o1 - o0); return r0 + (r1 - r0) * q * q * (3 - 2 * q); } return SPINE[SPINE.length - 1][1]; };
// the chain: a joint every SEG along it; how far each may bend from the one before (radians): the neck is supple, the
// trunk between the shoulders and the hips stiff, the tail freer towards its tip
const SEG = 18, NODES = Math.ceil(LEN / SEG) + 1, NECK = 0.55, HEAD_TURN = 1.5, LEAD = 1.1;
const bendOf = (off) => (off <= 110 ? 0.42 : off <= HIP ? 0.24 : 0.3 + 0.08 * (off - HIP) / (LEN - HIP));
const stiffOf = (off) => (off <= 110 ? 1.2 : off <= HIP ? 3.2 : 1.6);   // how fast a bend eases out (a second): the trunk is stiffest
const BOXES = [[92, 27], [128, 40], [178, 44], [228, 43], [276, 38], [322, 28], [380, 21]]; // the hit boxes along it (offset, radius)
export const CD = {
  share: 0.35, tailShare: 0.3, tailHp: 0.08, tailAt: 446, tailR: 22,
  gap: [0.55, 0.95],                                        // between two moves of its head and feet
  prowl: { side: 92, past: 190, run: 320, turn: 1.0, clear: 150, on: 160, self: 125 },
  bite: { reach: 188, arc: 1.0, tell: 0.5, back: 26, lunge: 108, dart: 0.11, dmg: 70, burn: 20, knock: 250, rec: 0.32, cd: [3.0, 4.0] },
  claw: { r: 138, arc: 2.2, tell: 0.42, swipe: 0.14, dmg: 46, knock: 230, rec: 0.25, near: 112, cd: [3.4, 4.4] },
  scorch: { len: 460, arc: 0.44, tell: 0.75, dur: 2.4, turn: 0.6, creep: 0.32, tick: 0.15, dmg: 15, burn: 13, cd: [7.5, 9.5] },
  tail: { r: 215, arc: 2.5, tell: 0.6, whip: 0.13, swing: 1.25, dmg: 70, knock: 380, near: 150, cd: [4, 5.2], reel: 2.0, reelTaken: 1.3 },
  rush: { len: 640, past: 190, min: 260, from: 190, tell: 0.7, back: 30, dmg: 78, knock: 360, speed: 640, skid: 0.36, dazed: 1.7, dazedTaken: 1.35, cd: [6.5, 9] },
  call: { r: 84, tell: 1.4, dmg: 62, burn: 30, fire: 5, extra: 3, roar: 0.75, cd: [10, 12.5] },
  ring: { r: 255, speed: 3.5, turn: 1.7, step: 44, fireR: 36, fireT: 11, cd: [24, 28] },
  roar: { r: 230, tell: 0.9, dmg: 17, knock: 340, burn: 20 },
  molten: { drip: 0.55, fireR: 30, fireT: 4, cap: 14 },
};
export const PHASE_AT = [1, 0.66, 0.34];
const WAKE = 500;

function brain(w, u, dt) {
  const k = u.cd || (u.cd = make(w, u));
  steady(u); logOf(w, u, k); stage(w, 'cinder', drawPitFloor, drawPitAir);
  k.t += dt; k.mv = null; u.strikes = null; if (k.dazed > 0) k.dazed -= dt;
  body(w, u, k, dt);
  u.jaw = (u.jaw || 0) + ((k.jawWant || 0.08) - (u.jaw || 0)) * Math.min(1, dt * (k.jawRate || 12)); k.jawWant = 0.08; k.jawRate = 12;
  if (k.jawHold > 0) { k.jawHold -= dt; k.jawWant = 1; }
  k.inhale += ((k.br && k.br.t > 0 ? 1 : 0) - k.inhale) * Math.min(1, dt * 5);
  k.crouch += ((k.rush && k.rush.st === 'tell' ? 1 : 0) - k.crouch) * Math.min(1, dt * (k.rush ? 6 : 14));
  k.rear += ((k.rearWant || 0) - k.rear) * Math.min(1, dt * (k.rearWant ? 9 : 30)); k.rearWant = 0; // (drawn back in a wind-up; let go at once)
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.0, null); roar(w, u, k, 1.0); notePhase(w, k); })) { k.mv = 'asleep'; return true; }
  if (TEST_MOVE && !k.tested) { k.tested = true; const only = (...keep) => { for (const m of ['bite', 'claw', 'lash', 'scorch', 'rush', 'call', 'ring']) again(u, m, keep.includes(m) ? 1 : 40); };
    if (TEST_MOVE === 'ring') { k.phase = Math.max(2, k.phase); only('ring'); again(u, 'scorch', 30); }
    if (TEST_MOVE === 'call') { k.phase = Math.max(2, k.phase); only('call'); }
    if (TEST_MOVE === 'rush') only('rush');
    if (TEST_MOVE === 'scorch') only('scorch');
    if (TEST_MOVE === 'bite') only('bite');
    if (TEST_MOVE === 'claw') only('claw');
    if (TEST_MOVE === 'tail') only('lash');
    if (TEST_MOVE === 'death') { k.phase = 3; u.molten = true; w.molten = true; u.hp = u.maxHp * 0.03; } }
  if (k.phase >= 3) drip(w, u, k, dt);
  if (k.roarT > 0) { k.roarT -= dt; k.jawWant = 1; }
  tailRun(w, u, k, dt);
  if (biteTick(w, u, k, dt)) return true;
  if (clawTick(w, u, k, dt)) return true;
  if (breathTick(w, u, k, dt)) return true;
  if (ringTick(w, u, k, dt)) return true;
  if (rushTick(w, u, k, dt)) return true;
  if (hold(u, dt)) { k.pace = 0; k.mv = k.dazed > 0 ? 'dazed' : k.roarT > 0 ? 'roar' : 'hold'; lookAt(k, u, null, dt); return true; }
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt, 1.4);
  if (!t) { stand(u, dt); k.mv = 'hold'; return true; }
  const d = dist(u.x, u.y, t.x, t.y), at = angleTo(u.x, u.y, t.x, t.y), K = k.phase >= 3 ? 0.85 : 1, hs = heroesOf(w, u);
  k.mv = 'prowl'; lookAt(k, u, at, dt);
  // whoever is behind it: the tail (it goes on walking: the tail is its own)
  const tail = k.tail && alive(k.tail) ? k.tail : null;
  if (tail && !k.swing && due(u, 'lash', dt, 1.2)) {
    const hip = at_(k, u, HIP), tip = at_(k, u, LEN);
    if (hs.some((h) => dist(h.x, h.y, tip.x, tip.y) < CD.tail.near || dist(h.x, h.y, (hip.x + tip.x) / 2, (hip.y + tip.y) / 2) < CD.tail.near)) { again(u, 'lash', ...CD.tail.cd.map((x) => x * K)); tailSweep(w, u, k); }
    else again(u, 'lash', 0.35);
  }
  // every move's clock runs while it is free to move (it ran only while that move could be used)
  const ready = { claw: due(u, 'claw', dt, 1.6), bite: due(u, 'bite', dt, 0.9), ring: k.phase >= 2 && due(u, 'ring', dt, 6), call: k.phase >= 2 && due(u, 'call', dt, 2.5), scorch: due(u, 'scorch', dt, 3), rush: due(u, 'rush', dt, 4.5) };
  if ((k.gap -= dt) <= 0) {
    // at its chest: a foreleg rakes them off
    const sh = at_(k, u, SHOULDER), cha = chestA(k); let side = 0;
    if (ready.claw) for (const h of hs) { const rel = wrapAngle(angleTo(sh.x, sh.y, h.x, h.y) - sh.a); if (dist(sh.x, sh.y, h.x, h.y) < CD.claw.near + h.r && Math.abs(rel) > 0.45 && Math.abs(rel) < 2.4) { side = Math.sign(rel); if (h === t) break; } }
    if (side) { again(u, 'claw', ...CD.claw.cd.map((x) => x * K)); claw(w, u, k, side, K); return true; }
    // in reach of its neck: the head darts at them (its mark first, else whoever is nearest its mouth)
    const B = CD.bite, canBite = (h) => dist(u.x, u.y, h.x, h.y) - h.r < B.reach - 20 && angleDiff(cha, angleTo(u.x, u.y, h.x, h.y)) < 1.3;
    const prey = !ready.bite ? null : canBite(t) ? t : hs.filter(canBite).sort((a, b) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, b.x, b.y))[0];
    if (prey) { again(u, 'bite', ...B.cd.map((x) => x * K)); bite(w, u, k, prey, K); return true; }
    if (ready.ring) { again(u, 'ring', ...CD.ring.cd); if (startRing(w, u, k, hs)) return true; }
    if (ready.call) { again(u, 'call', ...CD.call.cd.map((x) => x * (k.phase >= 3 ? 0.75 : 1))); fireCall(w, u, k, hs); return true; }
    // someone in front of its chest, not under its chin: the scorch (its mark if it can, else whoever is nearest ahead)
    if (ready.scorch) { const ok = (h) => { const dd = dist(u.x, u.y, h.x, h.y); return dd > 140 && dd < CD.scorch.len + 40 && angleDiff(cha, angleTo(u.x, u.y, h.x, h.y)) < 1.25; };
      const v = ok(t) ? t : hs.filter(ok).sort((a, b) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, b.x, b.y))[0];
      if (v) { again(u, 'scorch', ...CD.scorch.cd.map((x) => x * K)); startBreath(w, u, k, v); return true; } }
    // someone well off in front of it (the furthest: the back line): the rush
    if (ready.rush) { const far = hs.filter((h) => dist(u.x, u.y, h.x, h.y) > CD.rush.from && angleDiff(cha, angleTo(u.x, u.y, h.x, h.y)) < 1.2).sort((a, b) => dist(u.x, u.y, b.x, b.y) - dist(u.x, u.y, a.x, a.y))
        .find((h) => clipLine(w, u.x, u.y, angleTo(u.x, u.y, h.x, h.y), CD.rush.min, u.r * 0.8, u.r).d >= CD.rush.min - 12); // (with room to run: a rush of a step into the pillar beside it was no rush)
      if (far) { again(u, 'rush', ...CD.rush.cd.map((x) => x * K)); rush(w, u, k, far, K); return true; } }
  }
  prowl(w, u, k, t, d, at, dt);
  return true;
}
function make(w, u) {
  const k = { phase: 0, t: 0, sp: [], vis: [], parts: [], legs: [], orbit: chance(0.5) ? 1 : -1, look: 0, dazed: 0, gap: 0.6, gait: 0, inhale: 0, crouch: 0, rear: 0,
    curl: chance(0.5) ? 1 : -1, tl: [{ a: 0, v: 0 }, { a: 0, v: 0 }, { a: 0, v: 0 }], hipOm: 0 };
  layOut(k, u, 0.098 * k.curl); pose(u, k, 0, w.W, w.H);
  for (const [off, r] of BOXES) { const q = at_(k, u, off), p = part(w, u, 'drakeSegment', q.x, q.y, { share: CD.share }); p.r = r; p.vr = r; p.off = off; p.fixed = true; k.parts.push(p); } // (fixed: put where the spine is each tick; the boxes overlap and shoved each other apart, up to 30 off the drawn body)
  const q = at_(k, u, CD.tailAt), tl = part(w, u, 'drakeTail', q.x, q.y, { share: CD.tailShare, pool: true, hp: u.maxHp * CD.tailHp });
  tl.r = CD.tailR; tl.vr = CD.tailR; tl.off = CD.tailAt; tl.isTail = true; tl.fixed = true; k.tail = tl; k.parts.push(tl);
  // four legs: front pair at the shoulders, hind pair at the hips; each foot stays where it is planted until it must step
  for (const [off, s, pair] of [[SHOULDER, -1, 0], [SHOULDER, 1, 1], [HIP, -1, 1], [HIP, 1, 0]]) { const r = restFoot(k, u, off, s); k.legs.push({ off, s, pair, x: r.x, y: r.y, fx: r.x, fy: r.y, tx: r.x, ty: r.y, st: 0, T: 0.2 }); }
  return k;
}
// ---------------------------------------------------------------- the body: a chain dragged behind the head
// laid out behind the head, curling by `curl` a joint (asleep it lies curled round, inside the room)
function layOut(k, u, curl) {
  let a = u.facing + Math.PI, x = u.x, y = u.y; k.sp = [{ x, y }];
  for (let i = 1; i < NODES; i++) { if (i > 2) a += curl * (i * SEG > HIP ? 2 : 1); x += Math.cos(a) * SEG; y += Math.sin(a) * SEG; k.sp.push({ x, y }); }
}
// Each joint is dragged after the one before it and keeps its distance, so no part of it moves faster than its head
// does and a turn of the head runs down the body as a curve; no joint bends further than its limit (a hairpin can't
// form); the spine is stiff, most of all through the trunk, so a bend spreads out and eases away instead of staying
// as a corner; pillars push it aside and the walls keep it in.
function spine(w, u, k, dt) {
  const S = k.sp, M = 18, n = S.length;
  if (dist(S[0].x, S[0].y, u.x, u.y) > 170) layOut(k, u, 0.098 * k.curl); // put somewhere else at once (the Book's stage): laid out behind it again
  // the head turns on its neck only as far as a neck bends: no further than HEAD_TURN from the way its chest points
  const sha = chestA(k), back = wrapAngle(sha + clamp(wrapAngle(u.facing - sha), -HEAD_TURN, HEAD_TURN)) - u.facing; u.facing = wrapAngle(u.facing + clamp(wrapAngle(back), -14 * (dt || 1), 14 * (dt || 1))); // (brought back quickly, not in one frame)
  S[0].x = u.x; S[0].y = u.y;
  const fit = (c, off) => { // inside the room, out of the pillars
    c.x = clamp(c.x, M, w.W - M); c.y = clamp(c.y, M, w.H - M);
    for (const q of w.pillars) { const dd = dist(c.x, c.y, q.x, q.y), need = q.r + 6 + rOf(off) * 0.4; if (dd < need && dd > 0.01) { c.x = q.x + (c.x - q.x) / dd * need; c.y = q.y + (c.y - q.y) / dd * need; } }
  };
  let pa = u.facing + Math.PI;
  for (let i = 1; i < n; i++) {
    const p = S[i - 1], c = S[i], off = i * SEG, lim = i === 1 ? NECK : bendOf(off);
    const a = pa + clamp(wrapAngle(Math.atan2(c.y - p.y, c.x - p.x) - pa), -lim, lim);
    c.x = p.x + Math.cos(a) * SEG; c.y = p.y + Math.sin(a) * SEG; fit(c, off);
    pa = Math.atan2(c.y - p.y, c.x - p.x);
  }
  // stiffness: each joint eases towards the line between its neighbours, then the distances are put right from the head down
  if (dt > 0) {
    for (let i = 1; i < n - 1; i++) { const c = S[i], q = 1 - Math.exp(-dt * stiffOf(i * SEG)); c.x += ((S[i - 1].x + S[i + 1].x) / 2 - c.x) * q; c.y += ((S[i - 1].y + S[i + 1].y) / 2 - c.y) * q; }
    for (let i = 1; i < n; i++) { const p = S[i - 1], c = S[i], dx = c.x - p.x, dy = c.y - p.y, dl = Math.hypot(dx, dy) || 1; c.x = p.x + dx / dl * SEG; c.y = p.y + dy / dl * SEG; fit(c, i * SEG); }
  }
}
// the way its chest points (the spine at the shoulders); and an aim kept within what its neck reaches from there
const reachA = (k, a, lim = HEAD_TURN - 0.06) => { const c = chestA(k); return wrapAngle(c + clamp(wrapAngle(a - c), -lim, lim)); };
const chestA = (k) => { const S = k.sp, i = Math.round(SHOULDER / SEG); return Math.atan2(S[i - 1].y - S[i + 1].y, S[i - 1].x - S[i + 1].x); };
const spring = (s, to, om, z, dt) => { const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n; for (let i = 0; i < n; i++) { s.v += (om * om * (to - s.a) - 2 * z * om * s.v) * h; s.a += s.v * h; } };
// The tail: three springs down its length, each after the one before, so a swing starts at the hips and runs to the
// tip, which lags and overshoots. Idle it sways; when the hips turn it swings out the other way; k.tailWant (the
// sweep, the scorch, the rush) drives it.
function tailTick(u, k, dt) {
  const S = k.sp, hi = Math.floor(HIP / SEG), hipA = Math.atan2(S[hi - 1].y - S[hi + 1].y, S[hi - 1].x - S[hi + 1].x);
  if (dt > 0) { const om = wrapAngle(hipA - (k.hipA ?? hipA)) / dt; k.hipOm += (om - k.hipOm) * Math.min(1, dt * 8); } k.hipA = hipA;
  const sp = Math.hypot(u.vx || 0, u.vy || 0);
  let want = k.tailWant;
  if (want == null) want = 0.17 * Math.sin(k.t * 1.5) + 0.08 * Math.sin(k.t * 4.1 + 1) * clamp(sp / 60, 0, 1) - clamp(k.hipOm * 0.24, -0.55, 0.55);
  k.tailWant = null;
  spring(k.tl[0], want, 17, 0.8, dt); spring(k.tl[1], k.tl[0].a, 13, 0.62, dt); spring(k.tl[2], k.tl[1].a, 11, 0.56, dt);
}
const tailBend = (k, q) => { const [a, b, c] = k.tl; return q < 0.45 ? a.a * q / 0.45 : q < 0.75 ? a.a + (b.a - a.a) * (q - 0.45) / 0.3 : b.a + (c.a - b.a) * (q - 0.75) / 0.25; };
// What is drawn and hit (k.vis): the chain, with the walk's sway through the trunk and the tail's swing laid over it.
function pose(u, k, dt, W = 1e9, Hh = 1e9) {
  const S = k.sp, V = k.vis, n = S.length, sp = Math.hypot(u.vx || 0, u.vy || 0);
  k.gait += dt * (2.4 + sp * 0.05);
  const amp = clamp(sp / 80, 0, 1) * 4.2 * (1 - k.crouch);
  for (let i = 0; i < n; i++) {
    const off = i * SEG, v = V[i] || (V[i] = { x: 0, y: 0, a: 0 });
    if (off > HIP + 2 && i > 0) { const p = S[i - 1], c = S[i], a = Math.atan2(c.y - p.y, c.x - p.x) + tailBend(k, clamp((off - HIP) / (LEN - HIP), 0, 1)); v.x = clamp(V[i - 1].x + Math.cos(a) * SEG, 12, W - 12); v.y = clamp(V[i - 1].y + Math.sin(a) * SEG, 12, Hh - 12); continue; }
    const a = i === 0 ? u.facing + Math.PI : Math.atan2(S[i].y - S[i - 1].y, S[i].x - S[i - 1].x), sway = amp * clamp(off / SHOULDER, 0, 1) * Math.sin(k.gait - off * 0.024);
    const back = k.rear * Math.max(0, 1 - off / SHOULDER); // reared back: the head drawn back along its neck, the neck gathered behind it
    v.x = S[i].x - Math.sin(a) * sway - Math.cos(u.facing) * back; v.y = S[i].y + Math.cos(a) * sway - Math.sin(u.facing) * back;
  }
  for (let i = 0; i < n; i++) { const a = V[Math.max(0, i - 1)], b = V[Math.min(n - 1, i + 1)]; V[i].a = i === 0 ? u.facing : Math.atan2(a.y - b.y, a.x - b.x); }
}
// where the spine is at `off` behind the head: { x, y, a } (a: the way it points there). k: anything with a vis (the
// fight's state, or a pose kept of it: its death).
export function at_(k, u, off) {
  const V = k.vis;
  if (!V || V.length < 2) return { x: u.x - Math.cos(u.facing) * off, y: u.y - Math.sin(u.facing) * off, a: u.facing };
  const f = clamp(off / SEG, 0, V.length - 1), i = Math.min(V.length - 2, Math.floor(f)), q = f - i;
  const p0 = V[Math.max(0, i - 1)], p1 = V[i], p2 = V[i + 1], p3 = V[Math.min(V.length - 1, i + 2)], q2 = q * q, q3 = q2 * q;
  const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * q + (2 * a - 5 * b + 4 * c - d) * q2 + (3 * b - a - 3 * c + d) * q3);
  return { x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y), a: p1.a + wrapAngle(p2.a - p1.a) * q };
}
function body(w, u, k, dt) {
  if (dt > 0) { k.moved = (k.moved || 0) + (dist(u.x, u.y, k.px ?? u.x, k.py ?? u.y) / dt - (k.moved || 0)) * Math.min(1, dt * 10); } k.px = u.x; k.py = u.y; // how fast its head really went (not how fast it tried to)
  spine(w, u, k, dt); tailTick(u, k, dt); pose(u, k, dt, w.W, w.H);
  for (const p of k.parts) if (alive(p)) { const q = at_(k, u, p.off); place(p, q.x, q.y, q.a); p.shadowK = 0.7; }
  u.shadowK = 0.75;
  legsTick(u, k, dt);
}
// the head looks at its mark a little as it walks (eased: it snapped round before), and straight ahead in a move
function lookAt(k, u, at, dt) { const to = at == null ? 0 : clamp(wrapAngle(at - u.facing), -0.5, 0.5); k.look += (to - k.look) * Math.min(1, dt * 5); }
function restFoot(k, u, off, s) {
  const p = at_(k, u, off), out = rOf(off) * 0.62 + 44 - 16 * k.crouch, fwd = 12 - 14 * k.crouch * (off === SHOULDER ? 1 : -1);
  return { x: p.x + Math.cos(p.a + s * Math.PI / 2) * out + Math.cos(p.a) * fwd, y: p.y + Math.sin(p.a + s * Math.PI / 2) * out + Math.sin(p.a) * fwd, a: p.a };
}
// Feet: a foot stays planted; when its rest spot has moved a stride away it steps there (ahead, the way the body is
// going), one diagonal pair at a time; the faster it goes the longer and quicker the steps (a gallop keeps up: a foot
// left far behind takes one fast step, it is not put back). The clawing foreleg is the claw's (k.claw).
function legsTick(u, k, dt) {
  const sp = Math.hypot(u.vx || 0, u.vy || 0), stride = clamp(30 + sp * 0.17, 30, 120), T = clamp(0.21 - sp * 0.0003, 0.065, 0.21);
  const stepping = [0, 1].map((p) => k.legs.some((l) => l.pair === p && l.st > 0));
  for (const l of k.legs) {
    const r = restFoot(k, u, l.off, l.s), c = k.claw;
    if (c && l.off === SHOULDER && l.s === c.s) { clawFoot(k, u, l, c, r); continue; }
    if (l.st > 0) { l.st -= dt / l.T; const q = clamp(1 - l.st, 0, 1), e = q * q * (3 - 2 * q); l.x = l.fx + (l.tx - l.fx) * e; l.y = l.fy + (l.ty - l.fy) * e; l.lift = Math.sin(q * Math.PI) * (11 + Math.min(9, sp * 0.02)); if (l.st <= 0) { l.st = 0; l.lift = 0; l.x = l.tx; l.y = l.ty; } continue; }
    const far = dist(l.x, l.y, r.x, r.y), late = far > stride * 1.9;
    if (far > stride * (sp > 8 ? 1 : 0.5) && (late || !stepping[1 - l.pair])) {
      l.T = late ? Math.min(T, 0.075) : T;
      const lead2 = Math.min(stride * 0.8, sp * l.T * 1.7 + (sp > 8 ? 10 : 0)), mv = sp > 8 ? Math.atan2(u.vy, u.vx) : r.a;
      l.fx = l.x; l.fy = l.y; l.tx = r.x + Math.cos(mv) * lead2; l.ty = r.y + Math.sin(mv) * lead2; l.st = 1; stepping[l.pair] = true; }
  }
}
// the claw's foreleg: lifted and drawn forward through the tell, raked out and back in an arc, then set down
function clawFoot(k, u, l, c, rest) {
  const C = CD.claw, sh = at_(k, u, SHOULDER), R = 108, ang = (q) => sh.a + c.s * (0.3 + 2.0 * q), at = (a, rr) => [sh.x + Math.cos(a) * rr, sh.y + Math.sin(a) * rr];
  let x, y, lift;
  if (c.t < c.tell) { const q = clamp(c.t / (c.tell * 0.7), 0, 1), e = q * q * (3 - 2 * q), [tx, ty] = at(ang(0), R); x = c.fx + (tx - c.fx) * e; y = c.fy + (ty - c.fy) * e; lift = 26 * e; }
  else if (c.t < c.tell + C.swipe) { const q = (c.t - c.tell) / C.swipe; [x, y] = at(ang(q * q * (3 - 2 * q)), R + 14 * Math.sin(q * Math.PI)); lift = 12; }
  else { const q = clamp((c.t - c.tell - C.swipe) / C.rec, 0, 1), [tx, ty] = at(ang(1), R); x = tx + (rest.x - tx) * q; y = ty + (rest.y - ty) * q; lift = 12 * (1 - q); }
  l.x = x; l.y = y; l.lift = lift; l.st = 0;
}

// ---------------------------------------------------------------- how it moves: the prowl
// It hunts in passes: it comes at its mark, goes by close on one side and on past, wheels round in a curve and comes
// again. So its mark is in front of it as it comes (the bite, the scorch, the rush), beside it as it passes (the
// claw) and behind it as it goes (the tail). It turns like a long animal: in curves (it can't spin on the spot, so
// it never winds round itself), its head and neck quick on top of that. It runs when its mark is far.
// Every move starts from the prowl and ends back in it.
function walk(w, u, k, x, y, mult, dt, turn, slowTurn) {
  const d = u.def, was = d.turn, got = k.moved || 0, stuck = (k.pace || 0) > 24 && got < (k.pace || 0) * 0.4 && (u.x < 90 || u.y < 90 || u.x > w.W - 90 || u.y > w.H - 90 || w.pillars.some((q) => dist(u.x, u.y, q.x, q.y) < q.r + u.r + 30)); // (against a wall or a pillar it comes round quicker; not against a hero in its way: it would wind round them)
  d.turn = slowTurn ? turn * 0.5 : stuck ? Math.max(turn, 1.7) : turn; walkTo(w, u, x, y, mult, dt); d.turn = was;
  // it can only go where its chest lets it: no more than LEAD to either side of the way its chest points (the head led
  // off sideways and back into its own flank; now the body has to come round with it, in a curve)
  // (held up, by a wall or anything else, the head is let further round, so it works itself free)
  k.jam = (k.pace || 0) > 24 && got < (k.pace || 0) * 0.4 ? (k.jam || 0) + dt : 0;
  { const cha = chestA(k), lead = LEAD + Math.min(0.9, (k.jam || 0) * 1.8); u.mvA = wrapAngle(cha + clamp(wrapAngle(u.mvA - cha), -lead, lead)); }
  // the game's steering slows a walker right down in a turn (it would pivot on the spot and wind up); this one keeps most of its pace and goes round
  const wish = Math.atan2(u.sdy, u.sdx), want = (u.wantSpd || 0) * Math.max(0.8, Math.cos(Math.min(Math.PI / 2, Math.abs(wrapAngle(wish - u.mvA))))), acc = d.accel * dt;
  k.pace = (k.pace || 0) + clamp(want - (k.pace || 0), -acc * 1.6, acc); u.spd = k.pace; u.dvx = Math.cos(u.mvA) * u.spd; u.dvy = Math.sin(u.mvA) * u.spd;
  turnTo(u, u.spd > 6 ? u.mvA : u.facing, 3.4, dt);
}
function prowl(w, u, k, t, d, at, dt) {
  const P = CD.prowl, pace = k.phase >= 3 ? 1.15 : 1, cha = chestA(k), off = angleDiff(cha, at);
  if (off < 1.2) { if (k.behind) k.orbit = -k.orbit; k.behind = false; } else if (off > 1.5) k.behind = true;
  let gx = t.x, gy = t.y;
  if (!k.behind) { const side = at + k.orbit * Math.PI / 2; gx += Math.cos(at) * P.past + Math.cos(side) * P.side; gy += Math.sin(at) * P.past + Math.sin(side) * P.side; } // its mark ahead: by their side and on past them
  else if (d < P.clear) { // its mark close beside or behind it: it goes on a way (its tail towards them), it does not wind round on the spot...
    const ax = u.x + Math.cos(cha) * P.on, ay = u.y + Math.sin(cha) * P.on, q = inside(w, ax, ay, u.r + 60);
    if (dist(q.x, q.y, ax, ay) < 60) { gx = q.x; gy = q.y; } }
  // ...then wheels round on them (the goal is its mark; it comes round in a curve)
  // its own hindquarters and tail ahead of its nose (a wheel closing into a ring): straight on instead
  const curled = k.sp.some((q, i) => i * SEG > HIP - 20 && dist(u.x, u.y, q.x, q.y) < P.self);
  if (curled) { gx = u.x + Math.cos(cha) * P.on; gy = u.y + Math.sin(cha) * P.on; }
  const g = inside(w, gx, gy, u.r + 50);
  walk(w, u, k, g.x, g.y, (d > P.run || (k.behind && d > P.clear) ? 1.5 : 1) * pace, dt, P.turn, curled);
}
// its head moved by hand this tick (a dart, a rearing back): at speed v the way a
const shove = (u, a, v) => { u.dvx = Math.cos(a) * v; u.dvy = Math.sin(a) * v; u.vx = u.dvx; u.vy = u.dvy; u.mvA = a; u.spd = v; };
const still = (u) => { u.spd = 0; u.vx = u.vy = u.dvx = u.dvy = 0; u.mvA = u.facing; if (u.cd) u.cd.pace = 0; };
const rest = (k, K) => { k.gap = rrange(...CD.gap) * K; };

// ---- Bite: the head rears back on its neck, jaws wide, then darts at whoever is in reach and claps shut
function bite(w, u, k, h, K) {
  const B = CD.bite, p = lead(h, 0.2), a = reachA(k, angleTo(u.x, u.y, p.x, p.y), 1.38), tell = B.tell * K;
  k.bite = { a, t: 0, tell, K };
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a, arc: B.arc, r: B.reach, t: tell + B.dart * 0.8, team: u.team, src: u, kind: 'fire', quiet: true, label: 'bite', hit: H(u, { dmg: B.dmg, burn: B.burn, knock: B.knock, heavy: true }),
    onFire: (w2) => { bfx(w2, { type: 'drakeSnap', u, max: 0.32 }); w2.shake = Math.max(w2.shake, 4); } });
}
function biteTick(w, u, k, dt) {
  const b = k.bite; if (!b) return false;
  const B = CD.bite; k.mv = 'bite'; lookAt(k, u, null, dt); b.a = reachA(k, b.a);
  if (b.t < b.tell) { u.winding = true; b.t += dt / windMul(u); k.jawWant = 1; turnTo(u, b.a, 9, dt); stand(u, dt); k.rearWant = B.back; }
  else if (b.t < b.tell + B.dart) { b.t += dt; turnTo(u, b.a, 14, dt); k.jawWant = b.t > b.tell + B.dart * 0.6 ? 0 : 1; k.jawRate = 60; shove(u, b.a, B.lunge / B.dart); }
  else if (b.t < b.tell + B.dart + B.rec) { b.t += dt; k.jawWant = 0; k.jawRate = 60; still(u); }
  else { k.bite = null; still(u); rest(k, b.K); }
  return true;
}
// ---- Claw: whoever stands at its chest is raked off by the foreleg on that side
function claw(w, u, k, s, K) {
  const C = CD.claw, sh = at_(k, u, SHOULDER), a = sh.a + s * 1.3, tell = C.tell * K, l = k.legs.find((g) => g.off === SHOULDER && g.s === s);
  k.claw = { s, t: 0, tell, K, fx: l.x, fy: l.y, face: u.facing + s * 0.45 };
  addDanger(w, { shape: 'cone', x: sh.x, y: sh.y, a, arc: C.arc, r: C.r, t: tell + C.swipe * 0.5, team: u.team, src: u, kind: 'blade', quiet: true, label: 'claw', hit: H(u, { dmg: C.dmg, knock: C.knock, kAngle: a, heavy: true }),
    onFire: (w2) => { bfx(w2, { type: 'drakeClaw', x: sh.x, y: sh.y, a0: sh.a + s * 0.3, a1: sh.a + s * 2.3, r: C.r, max: 0.3 }); w2.shake = Math.max(w2.shake, 3); } });
}
function clawTick(w, u, k, dt) {
  const c = k.claw; if (!c) return false;
  const C = CD.claw; k.mv = 'claw'; stand(u, dt); lookAt(k, u, null, dt); k.jawWant = 0.45;
  if (c.t < c.tell) { u.winding = true; c.t += dt / windMul(u); turnTo(u, reachA(k, c.face), 2.2, dt); } else c.t += dt;
  if (c.t >= c.tell + C.swipe + C.rec) { k.claw = null; still(u); rest(k, c.K); }
  return true;
}
// ---- Tail Sweep: wound to one side, then whipped across everything behind the hips. The drake goes on with what it
// is doing; the arc on the floor rides with its hips.
function tailSweep(w, u, k) {
  const S = CD.tail, dir = chance(0.5) ? 1 : -1, tell = S.tell * (k.phase >= 3 ? 0.85 : 1), hip = at_(k, u, HIP);
  const z = addDanger(w, { shape: 'cone', x: hip.x, y: hip.y, a: hip.a + Math.PI, arc: S.arc, r: S.r, t: tell + S.whip, team: u.team, src: k.tail, kind: 'blade', quiet: true, label: 'tail', hit: H(u, { dmg: S.dmg, knock: S.knock, heavy: true }),
    onFire: (w2) => { bfx(w2, { type: 'drakeLash', u, dir, r: S.r, arc: S.arc, max: 0.34 }); w2.shake = Math.max(w2.shake, 5); } });
  k.swing = { t: 0, dir, tell, z };
}
function tailRun(w, u, k, dt) {
  const s = k.swing; if (!s) return;
  if (!k.tail || !alive(k.tail)) { k.swing = null; return; }
  s.t += dt;
  const A = CD.tail.swing * s.dir, hip = at_(k, u, HIP);
  if (!s.z.done) { s.z.x = hip.x; s.z.y = hip.y; s.z.a = hip.a + Math.PI; }
  if (s.t < s.tell) k.tailWant = -A * Math.min(1, s.t / (s.tell * 0.55));          // wound to one side
  else if (s.t < s.tell + 0.45) k.tailWant = A * (s.t < s.tell + 0.25 ? 1 : 0.5);  // the whip, and its follow-through
  else k.swing = null;
}
function onTailBreak(w, t) {
  const u = t.core; if (!u || !alive(u) || !u.cd) return;
  bfx(w, { type: 'drakeTailOff', x: t.x, y: t.y, a: t.facing, max: 1.0, seed: 3 }); puff(w, t.x, t.y, '#B5754A', 14, 200, 7, 0.5);
  for (let i = 0; i < 8; i++) flames(w, t.x + rrange(-24, 24), t.y + rrange(-24, 24), 1, 12, 90);
  const k = u.cd; k.swing = null; k.tailOff = true; k.bite = null; k.claw = null; k.rush = null; k.br = null; w.drakeBreath = null; w.shake = Math.max(w.shake, 9);
  beginHold(u, CD.tail.reel, null); k.roarT = 0.8; addBuff(u, { id: 'tailless', dur: CD.tail.reel, taken: CD.tail.reelTaken }); bfx(w, { type: 'drakeDazed', u, max: CD.tail.reel });
}

// ---- Scorch: it breathes in (chest swelling, head drawn back), then a narrow cone of flame, the head turning slowly
// after its mark as it creeps forward; pillars and walls stop it
function startBreath(w, u, k, v) {
  const S = CD.scorch, ph = k.phase >= 3, at = angleTo(u.x, u.y, v.x, v.y);
  k.br = { t: S.tell, run: S.dur * (ph ? 1.2 : 1), turn: S.turn * (ph ? 1.45 : 1), tick: 0, a: reachA(k, at, 1.3), z: null, v };
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a: k.br.a, arc: S.arc, r: S.len, t: S.tell, team: u.team, src: u, kind: 'fire', quiet: true });
  bfx(w, { type: 'drakeInhale', u, max: S.tell });
}
const inBreath = (w, u, h, a, S) => { const dd = dist(u.x, u.y, h.x, h.y); return dd <= S.len + h.r && angleDiff(angleTo(u.x, u.y, h.x, h.y), a) <= S.arc / 2 + Math.atan2(h.r * 0.6, dd) && lineClear(w, u.x, u.y, h.x, h.y, 2) && !w.pillars.some((p) => segNear(u.x, u.y, h.x, h.y, p.x, p.y, p.r)); };
function breathTick(w, u, k, dt) {
  const b = k.br; if (!b) return false;
  const S = CD.scorch; k.jawWant = 1; lookAt(k, u, null, dt);
  if (b.t > 0) { k.mv = 'scorch-tell'; u.winding = true; b.t -= dt / windMul(u); turnTo(u, b.a, 5, dt); stand(u, dt); k.rearWant = 20; k.tailWant = 0;
    u.strikes = (h) => (inBreath(w, u, h, b.a, S) ? Math.max(0, b.t) : null); return true; }
  k.mv = 'scorch';
  const t = alive(b.v) && !b.v.ethereal ? b.v : pickTarget(w, u, k, dt);
  if (t) b.a = wrapAngle(b.a + clamp(wrapAngle(angleTo(u.x, u.y, t.x, t.y) - b.a), -b.turn * dt, b.turn * dt));
  { const cha = chestA(k); b.a = wrapAngle(cha + clamp(wrapAngle(b.a - cha), -1.4, 1.4)); } // (no further round than its neck goes)
  turnTo(u, b.a, 8, dt); const fa = u.facing; // (the flame goes where the head points: it comes round to its aim, it is not set there)
  shove(u, fa, u.def.speed * S.creep); k.tailWant = 0.5 * Math.sin(k.t * 5.5); // it creeps after its flame, tail lashing
  const mx = u.x + Math.cos(fa) * u.r * 1.3, my = u.y + Math.sin(fa) * u.r * 1.3;
  w.drakeBreath = { x: mx, y: my, a: fa, arc: S.arc, len: S.len - u.r, t: (w.drakeBreath && w.drakeBreath.t || 0) + dt };
  b.z = b.z && w.danger.includes(b.z) ? b.z : liveZone(w, u, { shape: 'cone', x: u.x, y: u.y, a: fa, arc: S.arc + 0.12, r: S.len, kind: 'fire' });
  keepZone(b.z, { x: u.x, y: u.y, a: fa });
  u.strikes = (h) => (inBreath(w, u, h, fa, S) ? Math.max(0, b.tick) : null);
  if ((b.tick -= dt) <= 0) {
    b.tick = S.tick;
    for (const h of heroesOf(w, u)) if (inBreath(w, u, h, fa, S)) hurt(w, h, S.dmg * u.dmgMul, u, { noDodge: true, burn: S.burn, knock: 40, kAngle: fa });
  }
  if ((b.run -= dt) <= 0) { k.br = null; w.drakeBreath = null; still(u); beginHold(u, 0.35, null); rest(k, 0.6); }
  return true;
}
const segNear = (ax, ay, bx, by, px, py, r) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, q = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1); return dist(ax + dx * q, ay + dy * q, px, py) < r; };

// ---- Rush: it gathers itself (drawn back, low, feet bunched under it), then gallops down a line; it ends in a skid,
// the hindquarters swinging round, or in rock: a crash, and it is dazed
function rush(w, u, k, t, K) {
  const R = CD.rush, p = lead(t, 0.3), a = angleTo(u.x, u.y, p.x, p.y), len = clamp(dist(u.x, u.y, p.x, p.y) + R.past, R.min, R.len), end = clipLine(w, u.x, u.y, a, len, u.r * 0.8, u.r), tell = R.tell * K;
  k.rush = { a, st: 'tell', t: tell, tell, run: end.d / R.speed, hit: new Set(), wall: end.d < len - 12, K, mark: t };
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: end.x, y2: end.y, hw: u.r + 8, t: tell + end.d / R.speed * 0.5, team: u.team, src: u, kind: 'fire' });
  bfx(w, { type: 'drakeCrouch', u, max: tell });
}
function rushTick(w, u, k, dt) {
  const c = k.rush; if (!c) return false;
  const R = CD.rush; lookAt(k, u, null, dt);
  // when the head will reach a hero standing in its lane (threat.js: a dodge can be timed against it)
  u.strikes = (h) => { if (c.st === 'skid' || c.hit.has(h)) return null; const dx = h.x - u.x, dy = h.y - u.y, al = dx * Math.cos(c.a) + dy * Math.sin(c.a), ac = Math.abs(dy * Math.cos(c.a) - dx * Math.sin(c.a));
    return al > -u.r && al < c.run * R.speed + u.r && ac < u.r + h.r + 8 ? (c.st === 'tell' ? c.t : 0) + Math.max(0, al - u.r - h.r) / R.speed : null; };
  if (c.st === 'tell') { k.mv = 'rush-tell'; u.winding = true; c.t -= dt / windMul(u); k.jawWant = 0.5; k.tailWant = 0; turnTo(u, reachA(k, c.a), 8, dt); stand(u, dt); k.rearWant = R.back; if (c.t <= 0) c.st = 'run'; return true; }
  if (c.st === 'run') {
    k.mv = 'rush'; k.jawWant = 0.6; shove(u, c.a, R.speed); turnTo(u, reachA(k, c.a), 12, dt);
    if (rand() < 0.6) w.particles.push({ x: u.x - Math.cos(c.a) * u.r, y: u.y - Math.sin(c.a) * u.r, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 8, color: 'rgba(120,90,80,0.6)' });
    for (const h of heroesOf(w, u)) {
      if (c.hit.has(h) || dist(u.x, u.y, h.x, h.y) > u.r + h.r + 6) continue;
      c.hit.add(h);
      const side = Math.sign(Math.sin(angleTo(u.x, u.y, h.x, h.y) - c.a)) || 1;
      hurt(w, h, R.dmg * u.dmgMul, u, { noDodge: true, knock: R.knock, kAngle: c.a + side * 1.1, heavy: true, burn: 20 });
    }
    if ((c.run -= dt) > 0) return true;
    if (c.wall) { k.rush = null; still(u); bfx(w, { type: 'drakeCrash', x: u.x + Math.cos(u.facing) * u.r, y: u.y + Math.sin(u.facing) * u.r, max: 0.6 }); w.shake = Math.max(w.shake, 10); k.dazed = R.dazed; beginHold(u, R.dazed, null); bfx(w, { type: 'drakeDazed', u, max: R.dazed }); rest(k, 0.5); return true; }
    c.st = 'skid'; c.t = R.skid; c.turn = alive(c.mark) ? clamp(wrapAngle(angleTo(u.x, u.y, c.mark.x, c.mark.y) - c.a), -1.3, 1.3) : (chance(0.5) ? 1 : -1) * 0.9;
    bfx(w, { type: 'drakeSkid', u, max: R.skid + 0.25 }); w.shake = Math.max(w.shake, 4);
    return true;
  }
  // the skid: its feet dig in, the head comes round towards its mark and the hindquarters swing out behind it
  k.mv = 'rush-skid'; c.t -= dt; const q = clamp(c.t / R.skid, 0, 1);
  shove(u, c.a, R.speed * 0.5 * q * q); turnTo(u, reachA(k, c.a + c.turn), 4.5, dt);
  if (c.t <= 0) { k.rush = null; still(u); rest(k, 0.45 * c.K); }
  return true;
}

// ---- Fire Call (phase 2 on): it roars at the roof and a fireball comes down on every hero (split up), a few more beside
function fireCall(w, u, k, hs) {
  const C = CD.call, n = hs.length + (k.phase >= 3 ? C.extra + 3 : C.extra);
  roar(w, u, k, C.roar); beginHold(u, C.roar, null); rest(k, 0.5);
  for (let i = 0; i < n; i++) {
    const h = hs[i % Math.max(1, hs.length)]; if (!h) break;
    const p = lead(h, 0.7), a = rand() * TAU, off = i < hs.length ? 0 : rrange(110, 190), q = inside(w, p.x + Math.cos(a) * off, p.y + Math.sin(a) * off, 50), tell = C.tell + i * 0.13;
    bfx(w, { type: 'fireFall', x: q.x, y: q.y, max: tell, r: C.r });
    addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: C.r, t: tell, team: u.team, src: null, by: u, kind: 'fire', quiet: true, label: 'fireball', hit: H(u, { dmg: C.dmg, burn: C.burn, knock: 170 }),
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
  g.t += dt; k.jawWant = 0.7; k.mv = 'ring'; lookAt(k, u, null, dt);
  if (!g.on && Math.abs(dr - g.R) < 46) { g.on = true; g.a0 = here; g.prev = here; }
  const ahead = here + g.dir * (g.on ? 0.42 : 0.2), goal = { x: g.c.x + Math.cos(ahead) * g.R, y: g.c.y + Math.sin(ahead) * g.R };
  walk(w, u, k, goal.x, goal.y, G.speed, dt, G.turn);
  if (g.on) {
    g.went += Math.abs(wrapAngle(here - g.prev)); g.prev = here;
    if (!g.last || dist(g.last.x, g.last.y, u.x, u.y) > G.step) { g.last = { x: u.x, y: u.y };
      const fx2 = g.c.x + Math.cos(here) * g.R, fy = g.c.y + Math.sin(here) * g.R;
      w.hazards.push({ type: 'fire', x: fx2, y: fy, r: G.fireR, t: G.fireT, max: G.fireT, ring: true }); flames(w, fx2, fy, 3, 16, 90); }
  }
  if (g.went >= TAU + 0.15 || g.t > 8) { k.ring = null; again(u, 'scorch', 0.3); again(u, 'call', 2.5); k.gap = 0.3; }
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
  notePhase(w, k); k.br = null; w.drakeBreath = null; k.rush = null; k.ring = null; k.bite = null; k.claw = null; still(u);
  u.invulnT = CD.roar.tell + 0.4; roar(w, u, k, CD.roar.tell + 0.3); cue('bossPhase', u, p);
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: CD.roar.r, t: CD.roar.tell, team: u.team, src: u, kind: 'fire', quiet: true, label: 'roar', hit: H(u, { dmg: CD.roar.dmg, knock: CD.roar.knock, burn: CD.roar.burn }),
    onFire: (w2, z) => { bfx(w2, { type: 'roarBurst', x: z.x, y: z.y, r: z.r, max: 0.6 }); w2.shake = Math.max(w2.shake, 9); } });
  beginHold(u, CD.roar.tell + 0.5, null); k.gap = 0.3;
  if (p === 2) { again(u, 'call', 1.2); again(u, 'ring', 9); }
  if (p === 3) { w.molten = true; u.molten = true; again(u, 'ring', 2.5); }
}
// It falls where it stands: the whole animal stays (a pose of it, kept), legs giving way, its fire going out
function death(w, u) {
  w.drakeBreath = null; w.molten = false;
  const k = u.cd;
  if (k) {
    const tailOn = !!(k.tail && alive(k.tail));
    bfx(w, { type: 'drakeDie', max: 9, seed: u.id || 1, molten: !!u.molten, tailOn, jaw: u.jaw || 0, side: k.curl,
      u: { x: u.x, y: u.y, facing: u.facing + k.look, vr: u.vr }, k: { vis: k.vis.map((v) => ({ ...v })), legs: k.legs.map((l) => ({ off: l.off, s: l.s, x: l.x, y: l.y })) } });
    for (let off = 0; off <= LEN; off += 66) { const p = at_(k, u, off); puff(w, p.x, p.y, '#B5754A', 4, 130, 6, 0.6); if (off % 132 === 0) flames(w, p.x, p.y, 2, 18, 80); }
    for (const p of k.parts) if (alive(p)) { p.partOf = null; p.dead = true; } // (its hit boxes are not deaths of their own)
  }
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
    cinder: { team: 'enemy', name: 'Cinder, the Old Drake', r: 40, vr: 44, turn: 0.56, accel: 260, face: 3.4, mass: 12, hp: 800, speed: 84, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 200, coins: [80, 100], boss: true, arena: 'pit', noCorpse: true,
      res: { burn: 0, chill: 1.3, wet: 1.3, stagger: 0.4, poison: 0.25 }, draw: drawCinder, picture: cinderPicture, brain, onDeath: death },
    drakeSegment: PART('Cinder (body)', { r: 40, vr: 40, mass: 40, hp: 100, noBar: true, res: { burn: 0 }, draw: drawCinderPart }),
    drakeTail: PART('Cinder (tail)', { r: 22, vr: 22, mass: 40, hp: 100, res: { burn: 0 }, draw: drawCinderPart, onDeath: onTailBreak }),
  },
  arenas: { pit },
};
