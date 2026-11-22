// The Sand Wurm: the Sunken Dunes' boss (floor 3). Design and numbers: docs/BOSS-sand-wurm.md.
// Round 13, from scratch (the designer on round 12's: "Just no. Bad not even going to comment."). It lives under the
// sand: what the party sees of it is a mound heaving across the room, the ground lifting where it will come up, and
// then the wurm itself, arcing out of one hole and down into another, or reared up out of a hole to strike.
// The head is the boss; eleven segments follow it along a path (k.path: a breach's arc, the reared neck, the coil).
// Only what is out of the sand can be seen or hit. Art: drawn in code (js/boss-wurm-fx.js).
import { alive, puff, spawn, addDanger, addBuff, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange, chance } from './util.js';
import { crowd } from './elites.js';
import { heroesOf, H, steady, pickTarget, randomHero, lead, clipLine, part, endParts, PART, place, logOf, notePhase, inside, stage, bfx, param, TEST_MOVE } from './boss-kit.js';
import { drawWurm, drawWurmPart, drawDunesFloor, drawDunesAir } from './boss-wurm-fx.js';

export const SW = {
  seg: [43, 43, 41, 39, 37, 35, 33, 30, 27, 24, 20], space: 0.66, share: 0.5,
  under: { speed: 420, min: 0.8, max: 2.0 },
  breach: { r: 120, tell: 1.15, dmg: 113, knock: 400, stagger: 30, len: [300, 400], speed: 440, height: 96, landR: 90, landDmg: 68 },
  root: { dur: 8.5, reach: 170, height: 44, turn: 1.5, comp: 0.74 },
  lunge: { len: 380, hw: 46, tell: 0.8, dmg: 97, knock: 320, stuck: 0.7, stuckTaken: 1.45, cd: [2.1, 2.7] },
  inhale: { tell: 0.8, dur: 2.7, pull: 74, range: 640, r: 150, dmg: 135, knock: 420, at: 0.42 },
  pit: { r: 60, t: 10 }, brood: { n: 1, cap: 1, hpMul: 0.3 }, // round 14 (lane L): 2 at a time to 5 at full health -> 1 at a time at 30%: see BOSS_ADDS in dungeon.js
  coil: { r0: 150, r1: 345, mid: 248, tell: 2.1, dmg: 116, knock: 380, arc: 3.9, speed: 720, height: 84 },
  roar: { r: 250, tell: 1.0, dmg: 19, knock: 360, dur: 1.6 },
  chain: [2, 2, 3], // breaches in a row before it rears, by phase
};
export const PHASE_AT = [1, 0.66, 0.34];
const WAKE = 1500, SAND = '#D9C08A';
// how far behind the head each segment rides
const OFF = (() => { const out = []; let o = 0, pr = 48; for (const r of SW.seg) { o += (pr + r) * SW.space; out.push(o); pr = r; } return out; })();
export const BODY_LEN = OFF[OFF.length - 1] + 20;

function brain(w, u, dt) {
  const k = u.sw || (u.sw = make(w, u));
  steady(u); logOf(w, u, k); stage(w, 'wurm', drawDunesFloor, drawDunesAir);
  k.t += dt; if (k.stuckT > 0) k.stuckT -= dt;
  for (const h of k.holes) h.age += dt;
  k.holes = k.holes.filter((h) => h.open || h.age < h.shut + 1.2);
  if (k.st === 'asleep') { // coiled under the sand at the far end: a slow mound; it comes for whoever walks in
    hideHead(u, k); k.mound.heave = 0.4 + 0.2 * Math.sin(k.t * 2);
    if (u.aggro || heroesOf(w, u).some((h) => dist(h.x, h.y, u.x, u.y) < WAKE)) {
      u.aggro = true; k.phase = 1; notePhase(w, k);
      const n = Math.round(+param('bossphase') || 1);
      if (n > 1 && n <= PHASE_AT.length) { u.hp = u.maxHp * (PHASE_AT[n - 1] + 0.005); k.phase = n - 1; }
      k.left = SW.chain[0]; goUnder(w, u, k);
      if (TEST_MOVE === 'root') k.left = 0; if (TEST_MOVE === 'coil') { k.phase = 3; k.coilNext = true; } if (TEST_MOVE === 'inhale') { k.left = 0; k.inhaleFirst = true; k.phase = Math.max(k.phase, 2); }
    }
    layout(w, u, k); return true;
  }
  const f = STATES[k.st]; if (f) f(w, u, k, dt);
  layout(w, u, k);
  return true;
}
function make(w, u) {
  const k = { phase: 0, t: 0, st: 'asleep', left: 2, holes: [], path: null, s: 0, jaw: 0.15, mound: { x: u.x, y: u.y, a: Math.PI, heave: 0.5 }, trail: [], parts: [], aim: Math.PI, stuckT: 0 };
  SW.seg.forEach((r, i) => { const p = part(w, u, 'wurmSegment', u.x, u.y, { share: SW.share }); p.r = r; p.vr = r; p.seg = i; p.last = i === SW.seg.length - 1; k.parts.push(p); });
  u.homeR = u.r;
  return k;
}
function hideHead(u, k) { u.hidden = true; u.shadowK = 0; u.invulnT = Math.max(u.invulnT, 0.12); u.r = 6; place(u, k.mound.x, k.mound.y, k.mound.a); u.hop = 0; }

// ---------------------------------------------------------------- the body on its path
// A path: { len, pt(s) -> [x, y], h(s) -> height off the floor, dive: it goes back under at len }. The head is at
// k.s along it, each segment OFF[i] * comp behind. What is between 0 and len is out of the sand.
function layout(w, u, k) {
  const P = k.path, comp = (P && P.comp) || 1;
  const put = (o, s, r0) => {
    if (!P || s <= 2 || s >= P.len - (P.dive ? 2 : -1e9)) { if (o !== u) { o.hidden = true; o.ethereal = true; o.shadowK = 0; o.vis = 0; } return false; }
    const [x, y] = P.pt(s), [x2, y2] = P.pt(s + 6), edge = Math.min(1, s / 46, P.dive ? (P.len - s) / 46 : 1);
    place(o, x, y, Math.atan2(y2 - y, x2 - x));
    o.hidden = false; o.ethereal = false; o.hop = P.h(s) * edge; o.vis = edge; o.shadowK = 0.55 + 0.25 * edge; o.r = r0 * (0.5 + 0.5 * edge);
    return true;
  };
  if (!(P && put(u, k.s, u.homeR))) hideHead(u, k);
  if (!u.hidden) u.invulnT = Math.min(u.invulnT, k.safe ? 9 : 0.05);
  k.parts.forEach((p, i) => { if (alive(p)) put(p, k.s - OFF[i] * comp, SW.seg[i]); });
  u.jaw = k.jaw; u.wurmOut = !u.hidden;
}
const out = (k) => k.path && k.s > 2;
function hole(k, x, y, r = 54) { const h = { x, y, r, age: 0, open: true, shut: 0 }; k.holes.push(h); return h; }
function shut(w, u, k, h, pit) {
  if (!h || !h.open) return; h.open = false; h.shut = h.age;
  if (pit && k.phase >= 2 && w.hazards.filter((z) => z.wurmPit).length < 6) w.hazards.push({ type: 'quicksand', x: h.x, y: h.y, r: SW.pit.r, t: SW.pit.t, max: SW.pit.t, wurmPit: true });
}
function sandBurst(w, x, y, n = 18, sp = 300) { for (let i = 0; i < n; i++) { const a = rand() * TAU, v = rrange(80, sp); w.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7, max: 0.7, size: rrange(4, 9), color: i % 3 ? 'rgba(217,192,138,0.9)' : 'rgba(181,139,90,0.9)', drag: 0.9 }); } }

// ---------------------------------------------------------------- under the sand
function goUnder(w, u, k) {
  // a phase line passed while it was up: its next rise is the roar
  if (k.phase < PHASE_AT.length && u.hp / u.maxHp < PHASE_AT[k.phase]) { k.phase++; notePhase(w, k); k.roarNext = true; if (k.phase === 3) k.coilNext = true; }
  k.path = null; k.s = 0; k.st = 'under'; k.jaw = 0.15;
  const hs = heroesOf(w, u);
  if (k.roarNext) { k.goal = { x: w.W / 2, y: w.H / 2 }; k.plan = 'roar'; }
  else if (k.coilNext && hs.length) { k.plan = 'coil'; const cx = hs.reduce((a, h) => a + h.x, 0) / hs.length, cy = hs.reduce((a, h) => a + h.y, 0) / hs.length, m = SW.coil.mid + 40;
    k.coilAt = { x: clamp(cx, Math.min(m, w.W / 2), Math.max(w.W - m, w.W / 2)), y: clamp(cy, Math.min(m, w.H / 2), Math.max(w.H - m, w.H / 2)) }; const a = angleTo(k.coilAt.x, k.coilAt.y, k.mound.x, k.mound.y); k.goal = { x: k.coilAt.x + Math.cos(a) * SW.coil.mid, y: k.coilAt.y + Math.sin(a) * SW.coil.mid }; }
  else { k.plan = k.left > 0 ? 'breach' : 'root'; k.mark = (chance(0.55) && pickTarget(w, u, k, 9)) || randomHero(w, u) || null; }
  const g = k.goal || (k.mark ? k.mark : k.mound), d = dist(k.mound.x, k.mound.y, g.x, g.y);
  k.underT = clamp(d / SW.under.speed, SW.under.min, SW.under.max) * (k.phase >= 3 ? 0.8 : 1);
}
function runMound(w, k, x, y, dt, sp) {
  const m = k.mound, d = dist(m.x, m.y, x, y);
  if (d > 2) { const a = angleTo(m.x, m.y, x, y), st = Math.min(d, sp * dt); m.x += Math.cos(a) * st; m.y += Math.sin(a) * st; m.a = a; m.heave = 1;
    const last = k.trail[k.trail.length - 1];
    if (!last || dist(last.x, last.y, m.x, m.y) > 20) { k.trail.push({ x: m.x, y: m.y, a, t0: w.time }); if (k.trail.length > 90) k.trail.shift(); }
    if (rand() < dt * 22) w.particles.push({ x: m.x + rrange(-22, 22), y: m.y + rrange(-22, 22), vx: rrange(-50, 50), vy: rrange(-50, 50), life: 0.5, max: 0.5, size: rrange(3, 6), color: 'rgba(217,192,138,0.85)' });
    w.shake = Math.max(w.shake, 1.2);
  } else m.heave = Math.max(0.5, m.heave - dt);
}
const STATES = {
  under(w, u, k, dt) {
    const g = k.goal || (k.mark && alive(k.mark) ? lead(k.mark, 0.4) : k.mound);
    runMound(w, k, g.x, g.y, dt, SW.under.speed);
    if ((k.underT -= dt) > 0 && dist(k.mound.x, k.mound.y, g.x, g.y) > 12) return;
    k.goal = null;
    if (k.plan === 'coil') return startCoil(w, u, k);
    startTell(w, u, k);
  },
  // the ground lifts where it will come up (a circle fills), then it breaks through
  tell(w, u, k, dt) {
    k.mound.heave = 1 + k.tellK(); w.shake = Math.max(w.shake, 1.5 + 2 * k.tellK());
    if ((k.tellT -= dt) > 0) return;
    const p = k.at; hole(k, p.x, p.y, k.plan === 'breach' ? 54 : 60);
    bfx(w, { type: 'wurmBreach', x: p.x, y: p.y, r: k.plan === 'roar' ? SW.roar.r * 0.7 : SW.breach.r, max: 0.9, seed: Math.round(p.x * 3 + p.y) });
    sandBurst(w, p.x, p.y, 26, 380); w.shake = Math.max(w.shake, 10);
    if (k.plan === 'breach') startArc(w, u, k); else startRoot(w, u, k);
  },
  // out of one hole, over, and down into another: the body pours past (hit it)
  arc(w, u, k, dt) {
    const P = k.path; k.s += P.speed * dt;
    k.jaw = k.s < P.len * 0.75 ? 0.9 : Math.max(0.1, k.jaw - dt * 4);
    if (!P.landed && k.s >= P.len - 4) { P.landed = true; k.holeB = hole(k, ...P.pt(P.len), 50); const [bx, by] = P.pt(P.len); bfx(w, { type: 'wurmDive', x: bx, y: by, max: 0.7, seed: Math.round(bx + by) }); sandBurst(w, bx, by, 14, 260); w.shake = Math.max(w.shake, 6); k.mound.x = bx; k.mound.y = by; }
    if (k.s > BODY_LEN && k.holeA && k.holeA.open) shut(w, u, k, k.holeA, true); // the tail has left the first hole
    if (k.s - BODY_LEN < P.len) return;
    // all of it is under again
    shut(w, u, k, k.holeB, true); brood(w, u, k, k.holeB);
    k.left--; goUnder(w, u, k);
  },
  // reared up out of its hole: it sways after its mark, lunges, and (once) breathes the room in
  root(w, u, k, dt) {
    const R = SW.root, P = k.path; k.rootT += dt;
    const t = pickTarget(w, u, k, dt);
    if (k.act) { if (k.act(dt) === false) k.act = null; }
    else {
      k.reach += (R.reach - k.reach) * Math.min(1, dt * 5); k.lift += (1 - k.lift) * Math.min(1, dt * 5); k.jaw += (0.25 + 0.1 * Math.sin(k.t * 3) - k.jaw) * Math.min(1, dt * 6);
      if (t) k.aim = wrapAngle(k.aim + clamp(wrapAngle(angleTo(P.x, P.y, t.x, t.y) - k.aim), -R.turn * dt, R.turn * dt));
      if (k.plan === 'roar') { if (k.rootT > SW.roar.dur) return sink(w, u, k); k.jaw = 1; return; }
      if (k.rootT > R.dur * (k.phase >= 3 ? 0.8 : 1)) return sink(w, u, k);
      if (!k.inhaled && (k.inhaleFirst || k.rootT > R.dur * SW.inhale.at)) { k.inhaled = true; k.inhaleFirst = false; return inhale(w, u, k); }
      if ((k.lungeT -= dt) <= 0 && t) { k.lungeT = rrange(...SW.lunge.cd) * (k.phase >= 3 ? 0.8 : 1); lunge(w, u, k, t); }
    }
    k.s = k.reach;
  },
  sink(w, u, k, dt) { // back down its own hole
    k.reach -= 520 * dt; k.lift = Math.max(0, k.lift - dt * 3); k.s = k.reach; k.jaw = 0.1;
    if (k.reach > -BODY_LEN * SW.root.comp * 0.25 && k.reach > -60) return;
    shut(w, u, k, k.holeA, true); if (k.plan !== 'roar') brood(w, u, k, k.holeA);
    if (k.phase >= 3 && k.plan !== 'roar') k.coilNext = true; // phase 3: every cycle opens with the coil
    k.safe = false; k.left = SW.chain[k.phase - 1] || 2; k.roarNext = false; goUnder(w, u, k);
  },
  // phase 3: the mound races round the party in a ring; the ring is where it will burst out (stand in the middle)
  coil(w, u, k, dt) {
    const C = SW.coil, c = k.coilAt; k.coilT += dt;
    if (k.coilT < C.tell) {
      k.coilA += k.coilDir * (TAU * 1.25 / C.tell) * dt;
      runMound(w, k, c.x + Math.cos(k.coilA) * C.mid, c.y + Math.sin(k.coilA) * C.mid, dt, 2400);
      return;
    }
    if (!k.path) { // it bursts out all round the ring and arcs along it
      const a0 = k.coilA, dir = k.coilDir, R = C.mid, len = R * C.arc;
      k.path = { len, speed: C.speed, dive: true, x: c.x, y: c.y, pt: (s) => { const a = a0 + dir * s / R; return [c.x + Math.cos(a) * R, c.y + Math.sin(a) * R]; }, h: (s) => Math.sin(clamp(s / len, 0, 1) * Math.PI) * C.height };
      k.s = 0; k.holeA = hole(k, ...k.path.pt(0)); k.holeB = null; k.jaw = 1; k.coilNext = false; k.left = SW.chain[2] + 1; // (the arc's end takes one off)
      bfx(w, { type: 'wurmRing', x: c.x, y: c.y, r: C.mid, max: 1.0, seed: 3 }); w.shake = Math.max(w.shake, 12);
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; sandBurst(w, c.x + Math.cos(a) * R, c.y + Math.sin(a) * R, 5, 300); }
    }
    STATES.arc(w, u, k, dt);
  },
};
function startTell(w, u, k) {
  const B = SW.breach, roar = k.plan === 'roar', t = k.mark && alive(k.mark) ? k.mark : randomHero(w, u);
  const p0 = roar ? { x: w.W / 2, y: w.H / 2 } : t ? lead(t, 0.35) : k.mound, p = inside(w, p0.x, p0.y, 90);
  k.at = p; k.mound.x = p.x; k.mound.y = p.y; k.st = 'tell';
  const tell = (roar ? SW.roar.tell : B.tell) * (k.phase >= 3 ? 0.88 : 1); k.tellT = tell; k.tellK = () => 1 - clamp(k.tellT / tell, 0, 1);
  bfx(w, { type: 'wurmHeave', x: p.x, y: p.y, r: roar ? SW.roar.r : B.r, max: tell, seed: Math.round(p.x + p.y * 7) });
  addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: roar ? SW.roar.r : B.r, t: tell, team: u.team, src: u, kind: 'bone', col: '#D98A4B', quiet: true,
    hit: H(u, roar ? { dmg: SW.roar.dmg, knock: SW.roar.knock, stagger: 30 } : { dmg: B.dmg, knock: B.knock, stagger: B.stagger, heavy: true }) });
}
function startArc(w, u, k) {
  const B = SW.breach, p = k.at, hs = heroesOf(w, u).filter((h) => dist(h.x, h.y, p.x, p.y) > 140);
  // over towards someone else, or across the room's middle
  const to = hs.length ? hs[Math.floor(rand() * hs.length)] : { x: w.W / 2 + rrange(-200, 200), y: w.H / 2 + rrange(-150, 150) };
  let a = angleTo(p.x, p.y, to.x, to.y) + rrange(-0.25, 0.25), L = rrange(...B.len);
  for (let i = 0; i < 8; i++) { const e = clipLine(w, p.x, p.y, a, L + 70, 50, 0); if (e.d >= 250) { L = Math.min(L, e.d - 60); break; } a += 0.8; }
  const bow = rrange(40, 90) * (chance(0.5) ? 1 : -1), ca = Math.cos(a), sa = Math.sin(a);
  k.path = { len: L, speed: B.speed * (k.phase >= 3 ? 1.12 : 1), dive: true, x: p.x, y: p.y,
    pt: (s) => { const q = s / L, b = Math.sin(clamp(q, 0, 1) * Math.PI) * bow; return [p.x + ca * s - sa * b, p.y + sa * s + ca * b]; },
    h: (s) => Math.sin(clamp(s / L, 0, 1) * Math.PI) * B.height };
  k.s = 0; k.st = 'arc'; k.holeA = k.holes[k.holes.length - 1]; k.holeB = null; k.jaw = 1;
  const [bx, by] = k.path.pt(L);
  addDanger(w, { shape: 'circle', x: bx, y: by, r: B.landR, t: L / k.path.speed, team: u.team, src: u, kind: 'bone', col: '#D98A4B', quiet: true, hit: H(u, { dmg: B.landDmg, knock: 300, heavy: true }) });
}
function startRoot(w, u, k) {
  const p = k.at, t = k.mark && alive(k.mark) ? k.mark : randomHero(w, u);
  k.aim = t ? angleTo(p.x, p.y, t.x, t.y) : rand() * TAU;
  k.reach = 0; k.lift = 0; k.rootT = 0; k.lungeT = 1.1; k.inhaled = k.phase < 1; k.act = null; k.st = 'root'; k.holeA = k.holes[k.holes.length - 1];
  k.safe = k.plan === 'roar'; if (k.safe) { u.invulnT = SW.roar.dur + 0.6; bfx(w, { type: 'wurmRoar', u, max: SW.roar.dur }); }
  const R = SW.root;
  k.path = { len: 1e9, comp: R.comp, x: p.x, y: p.y,
    pt: (s) => { const a = k.aim + Math.sin(k.t * 1.7 + s * 0.011) * 0.2 * clamp(s / 200, 0, 1) * (k.rigid ? 0 : 1); return [p.x + Math.cos(a) * s, p.y + Math.sin(a) * s]; },
    h: (s) => clamp(s / Math.max(60, k.reach), 0, 1) * R.height * k.lift };
}
function sink(w, u, k) { k.st = 'sink'; k.act = null; k.rigid = false; }
// ---- Lunge: the neck draws back, then strikes out along a line; its head sticks in the sand a moment (hit it)
function lunge(w, u, k, t) {
  const L = SW.lunge, P = k.path, a = angleTo(P.x, P.y, t.x + (t.vx || 0) * 0.3, t.y + (t.vy || 0) * 0.3), e = clipLine(w, P.x, P.y, a, L.len, 30, 40);
  const tell = L.tell * (k.phase >= 3 ? 0.85 : 1); let tt = 0, struck = false;
  addDanger(w, { shape: 'line', x1: P.x, y1: P.y, x2: e.x, y2: e.y, hw: L.hw, t: tell, team: u.team, src: u, kind: 'blade', col: '#D98A4B', quiet: true, hit: H(u, { dmg: L.dmg, knock: L.knock, kAngle: a, heavy: true }),
    onFire: (w2) => { bfx(w2, { type: 'wurmLunge', x1: P.x, y1: P.y, x2: e.x, y2: e.y, max: 0.45 }); sandBurst(w2, e.x, e.y, 12, 240); w2.shake = Math.max(w2.shake, 7); } });
  k.act = (dt) => {
    tt += dt; k.rigid = true;
    k.aim = wrapAngle(k.aim + clamp(wrapAngle(a - k.aim), -9 * dt, 9 * dt));
    if (tt < tell) { const q = tt / tell; k.reach += (SW.root.reach * (1 - 0.42 * q) - k.reach) * Math.min(1, dt * 10); k.jaw = 0.3 + 0.7 * q; k.lift = 1 + 0.25 * q; return true; }
    if (tt < tell + 0.1) { k.reach = SW.root.reach * 0.58 + (e.d - 26 - SW.root.reach * 0.58) * ((tt - tell) / 0.1); k.jaw = 1 - (tt - tell) / 0.1; k.lift = 1 - 0.9 * (tt - tell) / 0.1; return true; }
    if (tt < tell + 0.1 + L.stuck) { if (!struck) { struck = true; } k.reach = e.d - 26; k.jaw = 0; k.lift = 0.1; addBuff(u, { id: 'stuck', dur: 0.15, taken: L.stuckTaken }); u.stuck = 0.15; return true; }
    if (tt < tell + 0.1 + L.stuck + 0.45) { const q = (tt - tell - 0.1 - L.stuck) / 0.45; k.reach = e.d - 26 + (SW.root.reach - (e.d - 26)) * q * q * (3 - 2 * q); k.lift = 0.1 + 0.9 * q; return true; }
    k.rigid = false; return false;
  };
}
// ---- Inhale: its maw gapes and the room is dragged towards it; at the end it bites down on whatever came too close
function inhale(w, u, k) {
  const I = SW.inhale, P = k.path; let tt = 0;
  const mouth = () => ({ x: P.x + Math.cos(k.aim) * (SW.root.reach + 40), y: P.y + Math.sin(k.aim) * (SW.root.reach + 40) });
  const m0 = mouth(), f = bfx(w, { type: 'wurmInhale', u, max: I.tell + I.dur, range: I.range });
  const z = addDanger(w, { shape: 'circle', x: m0.x, y: m0.y, r: I.r, t: I.tell + I.dur, team: u.team, src: u, kind: 'bone', col: '#D98A4B', quiet: true, hit: H(u, { dmg: I.dmg, knock: I.knock, heavy: true }),
    onFire: (w2, zz) => { bfx(w2, { type: 'wurmChomp', x: zz.x, y: zz.y, r: I.r, a: k.aim, max: 0.5 }); sandBurst(w2, zz.x, zz.y, 16, 300); w2.shake = Math.max(w2.shake, 10); } });
  k.act = (dt) => {
    tt += dt; k.rigid = true; k.reach += (SW.root.reach - k.reach) * Math.min(1, dt * 6); k.lift += (0.7 - k.lift) * Math.min(1, dt * 6);
    if (tt < I.tell + I.dur) {
      k.jaw += (1 - k.jaw) * Math.min(1, dt * 8); const m = mouth(); f.mx = m.x; f.my = m.y; z.x = m.x; z.y = m.y; u.inhaling = 0.2;
      if (tt > I.tell) for (const h of heroesOf(w, u)) { // dragged towards the maw (not what can't be moved)
        const d = dist(h.x, h.y, m.x, m.y); if (d > I.range || d < 14 || h.def.boss || h.def.part) continue;
        const a = angleTo(h.x, h.y, m.x, m.y), v = I.pull * (0.55 + 0.45 * (1 - d / I.range)) * dt, q = inside(w, h.x + Math.cos(a) * v, h.y + Math.sin(a) * v, h.r);
        h.x = q.x; h.y = q.y;
        if (rand() < dt * 5) w.particles.push({ x: h.x, y: h.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, life: 0.35, max: 0.35, size: 4, color: 'rgba(217,192,138,0.8)' });
      }
      return true;
    }
    if (tt < I.tell + I.dur + 0.5) { k.jaw = 0; return true; } // jaws shut: a beat
    k.rigid = false; return false;
  };
}
function startCoil(w, u, k) {
  const C = SW.coil, c = k.coilAt; k.st = 'coil'; k.coilT = 0; k.coilA = angleTo(c.x, c.y, k.mound.x, k.mound.y); k.coilDir = chance(0.5) ? 1 : -1;
  addDanger(w, { shape: 'ring', x: c.x, y: c.y, r0: C.r0, r1: C.r1, t: C.tell, team: u.team, src: u, kind: 'bone', col: '#D98A4B', quiet: true, hit: H(u, { dmg: C.dmg, knock: C.knock, heavy: true, stagger: 30 }) });
  bfx(w, { type: 'wurmRingHeave', x: c.x, y: c.y, r: C.mid, max: C.tell });
}
// phase 2 on: scarabs crawl out of a hole it has left
function brood(w, u, k, h) {
  if (k.phase < 2 || !h || w.stale) return;
  const mine = w.units.filter((o) => o.calledBy === u && o.kind === 'scarab' && alive(o)).length;
  for (let i = 0; i < SW.brood.n && mine + i < SW.brood.cap && crowd(w, u.team) < 24; i++) {
    const a = rand() * TAU, s = spawn(w, 'scarab', h.x + Math.cos(a) * 24, h.y + Math.sin(a) * 24, { mult: w.mult || 1, team: u.team, hpMul: SW.brood.hpMul });
    s.aggro = true; s.minion = true; s.calledBy = u; s.court = true; s.facing = a; puff(w, s.x, s.y, SAND, 6, 80, 5, 0.4);
  }
}
function death(w, u) {
  const k = u.sw;
  if (k) { for (const p of [u, ...k.parts]) if (!p.hidden) { bfx(w, { type: 'wurmChunk', x: p.x, y: p.y, r: p.vr, a: p.facing, max: 1.2, seed: p.id }); sandBurst(w, p.x, p.y, 8, 220); } for (const h of k.holes) h.open = false; }
  for (const o of w.units) if (o.calledBy === u && o.kind === 'scarab' && alive(o)) kill(w, o, null);
  endParts(w, u); w.shake = Math.max(w.shake, 12);
}

// ---------------------------------------------------------------- the sunken court: open sand, two broken columns
function dunes(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 240, y: Hh / 2 };
  for (const [fx, fy] of [[0.38, 0.24], [0.6, 0.78]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 36 });
  w.arenaDecor = [[0.2, 0.3, 'rubble'], [0.75, 0.2, 'bonepile'], [0.3, 0.82, 'bones']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.3, v: 0 }));
  w.dunesRoom = true;
  stage(w, 'wurm', drawDunesFloor, drawDunesAir);
}

export const WURM = {
  defs: {
    sandWurm: { team: 'enemy', name: 'The Sand Wurm', r: 46, vr: 50, turn: 2.2, accel: 140, face: 2.2, mass: 12, hp: 660, speed: 60, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 230, coins: [90, 110], boss: true, arena: 'dunes', noCorpse: true, sandy: true,
      res: { poison: 0.3, stagger: 0.4, wet: 1.4, burn: 0.8 }, draw: drawWurm, brain, onDeath: death },
    wurmSegment: PART('The Sand Wurm (body)', { r: 36, vr: 36, mass: 40, hp: 100, sandy: true, draw: drawWurmPart }),
  },
  arenas: { dunes },
};
