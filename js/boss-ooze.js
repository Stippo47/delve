// The Great Ooze: the Sewers' boss (floor 3). Design and numbers: docs/BOSS-great-ooze.md.
// The designer, round 9: "Design a new boss. Maybe the slime king? The great ooze." Round 12, on what was built:
// "Shadow too big. Overall doesnt look very good. I do not like the tentacles. Yeah too easy. Don't like the ability
// pool quality". Round 13: the tentacles are gone, and so are the moves any big thing could have had (three circles of
// spit, a circle round it). What it does now is what a slime does: it hops, it rolls and bounces off the walls, it
// buds off slimes that crawl home to it, it splits in two and slaps back together, it melts.
// A "body" is the ooze itself or its other half (oozeHalf: a unit whose blows are the ooze's); both run body().
// Art: drawn in code in the picked slime's own look (js/boss-ooze-fx.js).
import { alive, hurt, puff, setAnim, addDanger, addBuff, spawn, heal, fx, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, rand, rrange, chance } from './util.js';
import { hold, beginHold, due, again, crowd, stand, turnTo, later } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, pickTarget, randomHero, lead, part, endParts, PART, place, logOf, notePhase, inside, stage, bfx, TEST_MOVE } from './boss-kit.js';
import { drawOoze, drawCisternFloor, drawCisternAir } from './boss-ooze-fx.js';

export const OZ = {
  hop: { r: 132, tell: 1.15, dmg: 74, knock: 320, puddle: 60, puddleT: 8, cd: [4.2, 5.4], lift: 120 },
  roll: { tell: 0.95, speed: 560, legs: 3, leg: 640, dmg: 58, knock: 340, cd: [8, 10], rest: 0.9 },
  heave: { reach: 56, tell: 0.8, dmg: 40, poison: 30, knock: 280, cd: [3.4, 4.4] },
  brood: { every: 16, n: 2, cap: 3, /* round 14 (lane L): every 12 -> 16, cap 5 -> 3: see BOSS_ADDS in dungeon.js */ absorb: 0.012, home: [8, 11] },
  split: { size: 0.72, dur: 13, again: 9, mergeTell: 1.4, mergeHw: 62, mergeSpeed: 520, splashR: 185, dmg: 84, knock: 420, dazed: 1.3, dazedTaken: 1.35 },
  melt: { gas: 60, gasT: 6, speed: 1.35, k: 0.8, legs: 5 },
};
export const PHASE_AT = [1, 0.7, 0.45, 0.2];
const WAKE = 420, GOO = '#7CC07A';

function brain(w, u, dt) {
  const k = u.oz || (u.oz = { phase: 0, king: u });
  steady(u); logOf(w, u, k); stage(w, 'ooze', drawCisternFloor, drawCisternAir);
  const half = k.half && alive(k.half) ? k.half : (k.half = null);
  // it shrinks as it loses itself; split, each half is smaller still
  sizeOf(u, u, !!half); if (half) sizeOf(half, u, true);
  u.wob = (u.wob || 0) + dt * (k.phase >= 4 ? 7 : 4);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.0, null); bfx(w, { type: 'oozeHeave', u, r: u.r + 60, max: 0.6 }); notePhase(w, k); })) return true;
  if (TEST_MOVE && !k.tested) { k.tested = true;
    if (TEST_MOVE === 'roll') again(u, 'roll', 0.6);
    if (TEST_MOVE === 'split') { k.phase = Math.max(3, k.phase); k.splitT = 0.8; } }
  absorb(w, u, k, dt);
  if (k.phase >= 2) brood(w, u, k, dt);
  if (mergeTick(w, u, k, dt)) return true;
  if (k.phase >= 3 && !k.hop && !k.roll) { // the split: in two for a while, then back together with a slap
    k.splitT = (k.splitT ?? 2) - dt;
    if (!half && k.splitT <= 0) { split(w, u, k); return true; }
    if (half && k.splitT <= 0 && !half.oz.hop && !half.oz.roll) { startMerge(w, u, k, half); return true; }
  }
  // a phase line passed: the turn waits for it to land
  if (!k.hop && !k.roll && k.phase < PHASE_AT.length && u.hp / u.maxHp < PHASE_AT[k.phase] && !(u.el && u.el.holdT > 0)) { k.phase++; enter(w, u, k, k.phase); return true; }
  return body(w, u, u, dt);
}
function halfBrain(w, b, dt) {
  const u = b.core; if (!u || !alive(u) || !u.oz) return true;
  b.wob = (b.wob || 0) + dt * 4.6;
  if (u.oz.merge) return true; // (the king moves both while they merge)
  return body(w, b, u, dt);
}
function sizeOf(b, u, split) { const s = (0.72 + 0.28 * clamp(u.hp / u.maxHp, 0, 1)) * (split ? OZ.split.size : 1); b.r = b.def.r * s; b.vr = b.def.vr * s; b.shadowK = 0.62; }

// ---------------------------------------------------------------- what a body does: hop, roll, heave, ooze along
function body(w, b, u, dt) {
  const k = b.oz || (b.oz = { king: u }), K = u.oz, melt = K.phase >= 4, M = melt ? OZ.melt.k : 1;
  if (hopTick(w, b, k, dt)) return true;
  if (rollTick(w, b, u, k, dt)) return true;
  if (hold(b, dt)) return true;
  const t = b === u ? pickTarget(w, b, k, dt) : pickTarget(w, b, k, dt, 1.4, (h) => dist(h.x, h.y, b.x, b.y) + (h === u.target ? 240 : 0)); // the half goes for someone else
  if (!t) { stand(b, dt); return true; }
  const d = dist(b.x, b.y, t.x, t.y), gap = d - b.r - t.r, at = angleTo(b.x, b.y, t.x, t.y);
  // crowded: it heaves, and everything touching it is thrown off
  const close = heroesOf(w, b).filter((h) => dist(h.x, h.y, b.x, b.y) - h.r - b.r < OZ.heave.reach * 0.7).length;
  if (close && due(b, 'heave', dt, 1.5) && (close >= 2 || chance(0.6))) {
    again(b, 'heave', ...OZ.heave.cd);
    const R = b.r + OZ.heave.reach;
    addDanger(w, { shape: 'circle', x: b.x, y: b.y, r: R, t: OZ.heave.tell, team: b.team, src: b, kind: 'poison', quiet: true, hit: H(u, { dmg: OZ.heave.dmg, poison: OZ.heave.poison, knock: OZ.heave.knock }),
      onFire: (w2) => { bfx(w2, { type: 'oozeHeave', u: b, r: R, max: 0.6 }); w2.shake = Math.max(w2.shake, 5); } });
    beginHold(b, OZ.heave.tell + 0.4, null); b.squashT = OZ.heave.tell;
    return true;
  }
  if (due(b, 'roll', dt, 5) && d > 150) { again(b, 'roll', ...OZ.roll.cd.map((x) => x * M)); startRoll(w, b, u, k, t); return true; }
  if (due(b, 'hop', dt, 2.2)) { again(b, 'hop', ...OZ.hop.cd.map((x) => x * M)); startHop(w, b, u, k, t); return true; }
  // otherwise it oozes after its mark in slow surges
  const surge = 0.35 + 0.9 * Math.max(0, Math.sin((b.wob || 0) * 1.3));
  if (gap > 10) walkTo(w, b, t.x, t.y, surge * (melt ? OZ.melt.speed : 1), dt); else stand(b, dt);
  turnTo(b, at, 3, dt);
  return true;
}
// ---- Hop Slam: it crouches, goes up over everyone's heads, and comes down on its mark; it leaves a slick of itself
function startHop(w, b, u, k, t) {
  const K = u.oz, p = lead(t, 0.6), q = inside(w, p.x, p.y, b.r + 10), tell = OZ.hop.tell * (K.phase >= 4 ? 0.85 : 1), R = OZ.hop.r * (b.r / b.def.r) * 1.1;
  k.hop = { sx: b.x, sy: b.y, ex: q.x, ey: q.y, t: 0, dur: tell };
  addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: R, t: tell, team: b.team, src: b, kind: 'poison', quiet: true, hit: H(u, { dmg: OZ.hop.dmg, knock: OZ.hop.knock, heavy: true }),
    onFire: (w2, z) => {
      bfx(w2, { type: 'oozeSplat', x: z.x, y: z.y, r: R, max: 0.7, seed: Math.round(z.x + z.y) }); w2.shake = Math.max(w2.shake, 9);
      w2.hazards.push({ type: 'oil', x: z.x, y: z.y, r: OZ.hop.puddle, t: OZ.hop.puddleT, max: OZ.hop.puddleT, ooze: true });
      if (K.phase >= 4) w2.hazards.push({ type: 'gas', x: z.x, y: z.y, r: OZ.melt.gas, t: OZ.melt.gasT, max: OZ.melt.gasT });
      if (K.phase >= 2 && b === u) shed(w2, u, K, 1, z.x, z.y, 0.15);
    } });
}
function hopTick(w, b, k, dt) {
  const h = k.hop; if (!h) return false;
  h.t += dt;
  const p = clamp(h.t / h.dur, 0, 1), rise = p < 0.25 ? 0 : (p - 0.25) / 0.75, e = rise * rise * (3 - 2 * rise);
  place(b, h.sx + (h.ex - h.sx) * e, h.sy + (h.ey - h.sy) * e);
  b.hop = Math.sin(rise * Math.PI) * OZ.hop.lift; b.squash = p < 0.25 ? p / 0.25 : rise > 0.9 ? (rise - 0.9) * 10 : -Math.sin(rise * Math.PI) * 0.5;
  if (rise > 0.05 && rise < 0.95) b.invulnT = Math.max(b.invulnT, 0.05); // in the air: out of reach
  if (p >= 1) { k.hop = null; b.hop = 0; b.squash = 0; b.landT = 0.3; beginHold(b, 0.6, null); }
  return true;
}
// ---- Roll: it pulls itself into a ball and rolls; it bounces off the walls. The whole path shows first.
function startRoll(w, b, u, k, t) {
  const R = OZ.roll, K = u.oz, n = K.phase >= 4 ? OZ.melt.legs : R.legs, pad = b.r + 6, p = lead(t, 0.4);
  let x = b.x, y = b.y, a = angleTo(b.x, b.y, p.x, p.y), when = R.tell;
  const legs = [];
  for (let i = 0; i < n; i++) {
    // how far until a wall of the room (pillars it rolls round: they only nudge it)
    let d = R.leg, hitX = false, hitY = false;
    const c = Math.cos(a), s = Math.sin(a);
    if (c > 0.001) { const q = (w.W - pad - x) / c; if (q < d) { d = q; hitX = true; hitY = false; } } else if (c < -0.001) { const q = (pad - x) / c; if (q < d) { d = q; hitX = true; hitY = false; } }
    if (s > 0.001) { const q = (w.H - pad - y) / s; if (q < d) { d = q; hitY = true; hitX = false; } } else if (s < -0.001) { const q = (pad - y) / s; if (q < d) { d = q; hitY = true; hitX = false; } }
    d = Math.max(20, d);
    const x2 = x + c * d, y2 = y + s * d;
    legs.push({ x1: x, y1: y, x2, y2, a, d, at: when });
    addDanger(w, { shape: 'line', x1: x, y1: y, x2, y2, hw: b.r * 0.9, t: when + d / R.speed * 0.5, team: b.team, src: b, kind: 'poison', quiet: true });
    when += d / R.speed; x = x2; y = y2;
    if (!hitX && !hitY) break; // it ran out of roll in the open
    a = hitX ? Math.PI - a : -a;
  }
  k.roll = { legs, i: 0, t: 0, d: 0, hit: new Set(), tell: R.tell };
  b.squashT = R.tell;
}
function rollTick(w, b, u, k, dt) {
  const r = k.roll; if (!r) return false;
  const R = OZ.roll; r.t += dt;
  if (r.t < r.tell) { stand(b, dt); b.rolling = r.t / r.tell * 0.5; b.facing = r.legs[0].a; return true; } // gathering itself into a ball
  const L = r.legs[r.i]; r.d += R.speed * dt; b.rolling = 1; b.rollA = (b.rollA || 0) + R.speed * dt / Math.max(20, b.r);
  if (r.d >= L.d) { // the wall: a slap, and off the other way
    bfx(w, { type: 'oozeBounce', x: L.x2, y: L.y2, a: L.a, max: 0.4 }); w.shake = Math.max(w.shake, 5);
    r.i++; r.d = 0; r.hit = new Set();
    if (r.i >= r.legs.length) { k.roll = null; b.rolling = 0; place(b, L.x2, L.y2, L.a); beginHold(b, R.rest, null); b.squashT = 0.3; return true; }
    return true;
  }
  place(b, L.x1 + Math.cos(L.a) * r.d, L.y1 + Math.sin(L.a) * r.d, L.a);
  for (const h of heroesOf(w, b)) { if (r.hit.has(h) || dist(h.x, h.y, b.x, b.y) > b.r + h.r) continue; r.hit.add(h);
    hurt(w, h, R.dmg * u.dmgMul, u, { noDodge: true, knock: R.knock, kAngle: L.a + (Math.sign(Math.sin(angleTo(b.x, b.y, h.x, h.y) - L.a)) || 1) * 1.1, heavy: true }); }
  if (rand() < dt * 10) w.particles.push({ x: b.x - Math.cos(L.a) * b.r, y: b.y - Math.sin(L.a) * b.r, vx: 0, vy: 0, life: 0.5, max: 0.5, size: rrange(6, 10), color: 'rgba(124,192,122,0.7)' });
  return true;
}

// ---------------------------------------------------------------- the brood (phase 2 on)
// Slimes bud off it. After a while each turns and crawls home: one that reaches it is drunk back in and heals it.
function shed(w, u, k, n, x = u.x, y = u.y, delay = 0.5) {
  for (let i = 0; i < n; i++) {
    if (w.units.filter((o) => o.broodOf === u && alive(o)).length >= OZ.brood.cap || crowd(w, u.team) > 18) return;
    const a = rand() * TAU, d = u.r + 30, px = clamp(x + Math.cos(a) * d, 40, w.W - 40), py = clamp(y + Math.sin(a) * d, 40, w.H - 40);
    later(w, px, py, delay + i * 0.2, () => { const s = spawn(w, chance(0.3) ? 'slimeSludge' : 'slime', px, py, { mult: (w.mult || 1) * 0.8, team: u.team }); s.aggro = true; s.court = true; s.minion = true; s.calledBy = u; s.broodOf = u; s.gen = 1; s.kx = Math.cos(a) * 160; s.ky = Math.sin(a) * 160; puff(w, px, py, GOO, 8, 90, 6, 0.4); });
  }
}
function brood(w, u, k, dt) { if (due(u, 'brood', dt, 3) && !w.stale) { again(u, 'brood', OZ.brood.every * (k.phase >= 4 ? 0.75 : 1)); shed(w, u, k, OZ.brood.n); u.squashT = 0.4; } }
function absorb(w, u, k, dt) {
  for (const s of w.units) {
    if (s.broodOf !== u || !alive(s) || k.hop || k.roll) continue;
    if (s.homeAt == null) s.homeAt = w.time + rrange(...OZ.brood.home);
    if (w.time > s.homeAt) s.forcedGoal = { x: u.x, y: u.y, slow: 0.9 };
    if (dist(s.x, s.y, u.x, u.y) > u.r + s.r + 4) continue;
    s.broodOf = null; kill(w, s, null); // drunk back in
    heal(w, u, u.maxHp * OZ.brood.absorb, null);
    bfx(w, { type: 'oozeDrink', u, x: s.x, y: s.y, max: 0.4 });
  }
}

// ---------------------------------------------------------------- the split (phase 3 on)
// It tears in two: the ooze and its other half, each smaller, each hopping and rolling at someone else. A blow on
// either is a blow on the ooze. Then they come back together down a line, with a slap that throws everyone near.
function split(w, u, k) {
  const S = OZ.split, a = u.facing + Math.PI / 2, d = u.r * 0.9;
  const h = part(w, u, 'oozeHalf', u.x + Math.cos(a) * d, u.y + Math.sin(a) * d, { share: 1 });
  h.oz = { king: u }; h.el = {}; h.kx = Math.cos(a) * 260; h.ky = Math.sin(a) * 260; u.kx = -Math.cos(a) * 0; h.wob = 1.7;
  place(u, u.x - Math.cos(a) * d, u.y - Math.sin(a) * d);
  k.half = h; k.splitT = S.dur * (k.phase >= 4 ? 0.8 : 1);
  bfx(w, { type: 'oozeTear', x: (u.x + h.x) / 2, y: (u.y + h.y) / 2, a, max: 0.5 }); w.shake = Math.max(w.shake, 7);
  beginHold(u, 0.7, null); beginHold(h, 0.9, null);
}
function startMerge(w, u, k, h) {
  const S = OZ.split;
  k.merge = { t: 0, sx: u.x, sy: u.y, hx: h.x, hy: h.y };
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: h.x, y2: h.y, hw: S.mergeHw, t: S.mergeTell, team: u.team, src: u, kind: 'poison', quiet: true });
  u.squashT = S.mergeTell; h.squashT = S.mergeTell;
}
function mergeTick(w, u, k, dt) {
  const m = k.merge; if (!m) return false;
  const S = OZ.split, h = k.half; m.t += dt; stand(u, dt);
  if (!h || !alive(h)) { k.merge = null; return false; }
  if (m.t < S.mergeTell) { u.facing = angleTo(u.x, u.y, h.x, h.y); h.facing = u.facing + Math.PI; return true; }
  // they fly together
  const mx = (m.sx + m.hx) / 2, my = (m.sy + m.hy) / 2, D = dist(m.sx, m.sy, mx, my), q = clamp((m.t - S.mergeTell) * S.mergeSpeed / Math.max(40, D), 0, 1), e = q * q;
  place(u, m.sx + (mx - m.sx) * e, m.sy + (my - m.sy) * e); place(h, m.hx + (mx - m.hx) * e, m.hy + (my - m.hy) * e); u.rolling = h.rolling = 0.6;
  for (const b of [u, h]) for (const o of heroesOf(w, u)) if (!(m.hit || (m.hit = new Set())).has(o) && dist(o.x, o.y, b.x, b.y) < b.r + o.r) { m.hit.add(o); hurt(w, o, OZ.roll.dmg * u.dmgMul, u, { noDodge: true, knock: 300, kAngle: angleTo(mx, my, o.x, o.y), heavy: true }); }
  if (q < 1) return true;
  // the slap
  h.partOf = null; kill(w, h, null); k.half = null; k.merge = null; u.rolling = 0; k.splitT = S.again;
  for (const o of heroesOf(w, u)) { const dd = dist(o.x, o.y, mx, my); if (dd < S.splashR + o.r * 0.5) hurt(w, o, S.dmg * u.dmgMul, u, { noDodge: true, knock: S.knock, kAngle: angleTo(mx, my, o.x, o.y), poison: 20, heavy: true }); }
  bfx(w, { type: 'oozeSplat', x: mx, y: my, r: S.splashR, max: 0.8, seed: 7 }); w.shake = Math.max(w.shake, 11);
  w.hazards.push({ type: 'oil', x: mx, y: my, r: 80, t: 8, max: 8, ooze: true });
  beginHold(u, S.dazed, null); addBuff(u, { id: 'dazed', dur: S.dazed, taken: S.dazedTaken }); u.squashT = 0.5; u.landT = 0.4;
  return true;
}

// ---- phase turns: a heave that throws everyone off it, then the phase's own thing
function enter(w, u, k, p) {
  notePhase(w, k); u.invulnT = 1.2; const R = u.r + 110;
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: R, t: 0.9, team: u.team, src: u, kind: 'poison', quiet: true, hit: H(u, { dmg: 10, knock: 340, poison: 15 }),
    onFire: (w2) => { bfx(w2, { type: 'oozeHeave', u, r: R, max: 0.7 }); w2.shake = Math.max(w2.shake, 8); } });
  beginHold(u, 1.3, null); u.squashT = 0.9;
  if (p === 2) shed(w, u, k, 3, u.x, u.y, 1.0); // it shudders and buds
  if (p === 3) k.splitT = 1.6;                  // it tears in two
  if (p === 4) { shed(w, u, k, 2, u.x, u.y, 1.0); w.melting = true; u.melting = true; } // it melts: faster, and its landings leave gas
}
function death(w, u) {
  w.melting = false;
  for (const o of w.units) if (alive(o) && o.broodOf === u) kill(w, o, null);
  endParts(w, u);
  w.hazards.push({ type: 'oil', x: u.x, y: u.y, r: 110, t: 12, max: 12, ooze: true });
  bfx(w, { type: 'oozeSplat', x: u.x, y: u.y, r: 200, max: 1.0, seed: 3 }); bfx(w, { type: 'oozeBurst', x: u.x, y: u.y, max: 1.1, seed: 5 }); w.shake = Math.max(w.shake, 12);
}

// ---- the cistern: two canals across the room (wading soaks and slows), pipe pillars, grates; it sits in the far pool
function cisternRoom(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 220, y: Hh / 2 };
  w.water = [{ x: W * 0.28, y: 0, w: 96, h: Hh }, { x: W * 0.58, y: 0, w: 96, h: Hh }];
  for (const [fx2, fy] of [[0.45, 0.22], [0.45, 0.78], [0.78, 0.15], [0.78, 0.85]]) w.pillars.push({ x: W * fx2, y: Hh * fy, r: 32 });
  w.arenaDecor = [[0.12, 0.3, 'grate'], [0.12, 0.7, 'grate'], [0.86, 0.5, 'grate'], [0.4, 0.5, 'puddle'], [0.7, 0.4, 'moss'], [0.7, 0.62, 'moss'], [0.2, 0.5, 'pipe']].map(([fx2, fy, type]) => ({ type, x: W * fx2, y: Hh * fy, a: rand() * TAU, s: 1.2, v: 0 }));
  stage(w, 'ooze', drawCisternFloor, drawCisternAir);
}

export const OOZE = {
  defs: {
    greatOoze: { team: 'enemy', name: 'The Great Ooze', r: 66, vr: 70, turn: 2, accel: 120, face: 2, mass: 7, hp: 1010, speed: 52, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 160, coins: [60, 80], boss: true, arena: 'cistern', noCorpse: true, goo: GOO,
      res: { poison: 0, wet: 0, stagger: 0.4, burn: 1.4, chill: 1.2 }, draw: drawOoze, brain, onDeath: death },
    // its other half while it is split: it fights for itself, and its blows are the ooze's
    // (units.js scales a plain enemy's speed and turn more than a boss's: these numbers come out as the ooze's own)
    oozeHalf: { ...PART('The Great Ooze (its other half)', { r: 66, vr: 70, mass: 7, hp: 100, speed: 40, turn: 1.1, accel: 90, face: 1.3, goo: GOO, draw: drawOoze, res: { poison: 0, wet: 0, burn: 0, chill: 0 } }), brain: halfBrain },
  },
  arenas: { cistern: cisternRoom },
};
