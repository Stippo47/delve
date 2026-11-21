// The Great Engine: the Clockwork Foundry's boss (floor 3). Design and numbers: docs/BOSS-great-engine.md. The designer
// (round 9, the Great Engine card): "You know the terraria skeleton boss? Yeah do that here. Separate hands and head.
// Can have different abilities, but the body plan should be that."
// The head is the boss and floats; two hands are units of their own with health of their own, each with its own moves
// (the left a hammer, the right a claw). A broken hand is rebuilt after a while. The head shrugs off blows while both
// hands are up (half damage), takes them in full with one gone, and half again more with both gone.
// The Foundry theme is roster3's: until it names this boss, ?bossroom&boss=greatEngine and lab.html?m=boss&boss=greatEngine.
// Art: PLACEHOLDER, drawn in code (fx-boss.js drawEngineHead / drawEngineHand).
import { alive, hurt, puff, sparks, flames, setAnim, addDanger, addBuff, spawn } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { around, hold, beginHold, due, again, stand, turnTo } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, randomHero, lead, clipLine, thud, part, endParts, PART, place, logOf, notePhase, deathBurst, inside } from './boss-kit.js';
import { drawEngineHead, drawEngineHand, drawFoundry, drawLaser } from './fx-boss.js';

export const GE = {
  hand: { side: 130, back: 30, hpK: 0.14, share: 0.4, rebuild: 12, every: [2, 3] },
  guard: [0.5, 1, 1.5], // what the head takes with 2 / 1 / 0 hands up
  hammer: { r: 96, tell: 1.0, dmg: 105, stagger: 40, knock: 200 },
  claw: { len: 420, hw: 44, tell: 0.85, dmg: 88, knock: 340 },
  vent: { r: 160, tell: 0.85, dmg: 70, burn: 30, knock: 260, cd: [5, 7] },
  fist: { len: 640, hw: 34, tell: 0.9, speed: 1300, dmg: 110, knock: 360 },
  spin: { dur: 3.6, r: 92, step: 0.3, dmg: 52, knock: 260, cd: [11, 13], speed: 1.5 },
  laser: { len: 640, hw: 26, tell: 1.1, sweep: 1.4, dur: 2.4, tick: 0.15, dmg: 24, burn: 10, cd: [9, 11] },
  clap: { tell: 1.0, hw: 50, dmg: 110, cd: [8, 10] },
};
export const PHASE_AT = [1, 0.65, 0.35];
const WAKE = 480;

function brain(w, u, dt) {
  const k = u.ge || (u.ge = { phase: 0, hands: [null, null], rebuild: [0, 0] });
  if (!k.built) { k.built = true; makeHand(w, u, k, 0); makeHand(w, u, k, 1); }
  steady(u); logOf(w, u, k);
  // the head's guard: how many hands are up
  const up = k.hands.filter((h) => h && alive(h)).length;
  addBuff(u, { id: 'engineGuard', dur: 0.2, taken: GE.guard[2 - up] });
  rebuild(w, u, k, dt);
  handsTick(w, u, k, dt);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.0, null); thud(w, u.x, u.y, '#B9B4AE', 18, 6); steam(w, u.x, u.y); notePhase(w, k); })) return true;
  if (spinTick(w, u, k, dt)) return true;
  if (laserTick(w, u, k, dt)) return true;
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const d = dist(u.x, u.y, t.x, t.y), at = angleTo(u.x, u.y, t.x, t.y), K = k.phase >= 3 ? 0.85 : 1;
  // the hands take turns
  if (due(u, 'hand', dt, 1.2)) {
    again(u, 'hand', ...GE.hand.every.map((x) => x * K));
    const free = [0, 1].filter((i) => k.hands[i] && alive(k.hands[i]) && !k.hands[i].job);
    if (free.length) {
      const i = free.includes(k.next ?? 0) ? (k.next ?? 0) : free[0]; k.next = 1 - i;
      const who = k.phase >= 2 && chance(0.4) ? randomHero(w, u, t) || t : t;
      if (k.phase >= 3 && free.length === 2 && chance(0.35)) clap(w, u, k, who);
      else if (k.phase >= 2 && chance(0.4)) rocketFist(w, u, k, i, who);
      else if (i === 0) hammer(w, u, k, who); else claw(w, u, k, who);
    }
  }
  // crowded: steam out of the vents round its head
  if (heroesOf(w, u).some((h) => dist(h.x, h.y, u.x, u.y) < GE.vent.r * 0.8) && due(u, 'vent', dt, 1.5)) {
    again(u, 'vent', ...GE.vent.cd);
    around(w, u, { r: GE.vent.r, tell: GE.vent.tell, kind: 'fire', after: 0.3, hit: { dmg: GE.vent.dmg, burn: GE.vent.burn, knock: GE.vent.knock }, fire: (w2, z) => steam(w2, z.x, z.y) });
    return true;
  }
  if (k.phase >= 2 && due(u, 'spin', dt, 3)) { again(u, 'spin', ...GE.spin.cd); k.spin = { t: GE.spin.dur, tick: 0 }; setAnim(u, 'ability', GE.spin.dur); return true; }
  if (k.phase >= 3 && due(u, 'laser', dt, 2)) { again(u, 'laser', ...GE.laser.cd); startLaser(w, u, k, at); return true; }
  // it floats after its mark, keeping a little off
  if (d > 260) walkTo(w, u, t.x, t.y, 0.9, dt); else if (d < 150) { const a = at + Math.PI, p = inside(w, u.x + Math.cos(a) * 100, u.y + Math.sin(a) * 100, u.r + 20); walkTo(w, u, p.x, p.y, 0.7, dt); } else stand(u, dt);
  turnTo(u, at, 2.5, dt);
  return true;
}

// ---- the hands: each rests at the head's side; a job moves it out to strike and back
function restOf(u, i) { const s = i ? 1 : -1, a = u.facing + s * Math.PI / 2; return { x: u.x + Math.cos(a) * GE.hand.side - Math.cos(u.facing) * GE.hand.back, y: u.y + Math.sin(a) * GE.hand.side - Math.sin(u.facing) * GE.hand.back }; }
function makeHand(w, u, k, i) {
  const r = restOf(u, i), h = part(w, u, i ? 'engineClaw' : 'engineHammer', r.x, r.y, { share: GE.hand.share, pool: true, hp: u.maxHp * GE.hand.hpK });
  h.handI = i; h.claw = !!i; k.hands[i] = h; h.job = null;
  puff(w, r.x, r.y, '#B9B4AE', 14, 140, 7, 0.5); for (let j = 0; j < 6; j++) sparks(w, r.x, r.y, rand() * TAU, 1, '#FFE7A0');
}
function rebuild(w, u, k, dt) {
  for (const i of [0, 1]) {
    const h = k.hands[i];
    if (h && alive(h)) continue;
    if (h && !k.rebuild[i]) { k.rebuild[i] = GE.hand.rebuild * (k.phase >= 3 ? 0.7 : 1); k.hands[i] = null; thud(w, h.x, h.y, '#8A94A6', 20, 7); }
    if (!k.rebuild[i]) continue;
    if ((k.rebuild[i] -= dt) <= 0) { k.rebuild[i] = 0; if (alive(u)) makeHand(w, u, k, i); }
  }
}
function handsTick(w, u, k, dt) {
  for (const i of [0, 1]) {
    const h = k.hands[i]; if (!h || !alive(h)) continue;
    const rest = restOf(u, i), j = h.job;
    if (!j) { const q = Math.min(1, dt * 8); place(h, h.x + (rest.x - h.x) * q, h.y + (rest.y - h.y) * q, u.facing); continue; }
    if (j.wait > 0) { j.wait -= dt; place(h, j.sx, j.sy, j.a); continue; } // a rocket fist aims before it flies
    j.t += dt;
    if (j.t < j.out) { const q = j.t / j.out, e = q * q * (3 - 2 * q); place(h, j.sx + (j.x1 - j.sx) * e, j.sy + (j.y1 - j.sy) * e, j.a); }
    else if (j.t < j.out + j.hold) { if (j.x2 != null) { const q = (j.t - j.out) / j.hold; place(h, j.x1 + (j.x2 - j.x1) * q, j.y1 + (j.y2 - j.y1) * q, j.a); } else place(h, j.x1, j.y1, j.a); }
    else { h.job = null; }
    h.lift = j && j.t < j.out ? Math.sin(clamp(j.t / j.out, 0, 1) * Math.PI) * (j.lift || 0) : 0;
  }
}
// The hammer: it rises over a hero and comes down (a circle fills under it).
function hammer(w, u, k, t) {
  const h = k.hands[0], p = lead(t, 0.6), q = inside(w, p.x, p.y, 40), A = GE.hammer;
  h.job = { t: 0, out: A.tell, hold: 0.5, sx: h.x, sy: h.y, x1: q.x, y1: q.y, a: angleTo(h.x, h.y, q.x, q.y), lift: 90 };
  addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: A.r, t: A.tell, team: u.team, src: h, kind: 'bone', hit: H(u, { dmg: A.dmg, stagger: A.stagger, knock: A.knock, heavy: true }),
    onFire: (w2, z) => thud(w2, z.x, z.y, '#B9B4AE', 18, 8) });
}
// The claw: it draws back, then rakes across a line through the hero.
function claw(w, u, k, t) {
  const h = k.hands[1], C = GE.claw, a = angleTo(h.x, h.y, t.x, t.y), e = clipLine(w, h.x, h.y, a, C.len, 16, 0);
  h.job = { t: 0, out: C.tell, hold: 0.25, sx: h.x, sy: h.y, x1: h.x - Math.cos(a) * 30, y1: h.y - Math.sin(a) * 30, x2: e.x, y2: e.y, a };
  addDanger(w, { shape: 'line', x1: h.x, y1: h.y, x2: e.x, y2: e.y, hw: C.hw, t: C.tell, team: u.team, src: h, kind: 'blade', hit: H(u, { dmg: C.dmg, knock: C.knock, kAngle: a, heavy: true }) });
}
// Rocket fist (phase 2 on): a hand fires down a line at a hero and flies back.
function rocketFist(w, u, k, i, t) {
  const h = k.hands[i], F = GE.fist, p = lead(t, 0.3), a = angleTo(h.x, h.y, p.x, p.y), e = clipLine(w, h.x, h.y, a, F.len, 16, 0);
  h.job = { t: 0, wait: F.tell - e.d / F.speed, out: e.d / F.speed, hold: 0.4, sx: h.x, sy: h.y, x1: e.x, y1: e.y, a };
  addDanger(w, { shape: 'line', x1: h.x, y1: h.y, x2: e.x, y2: e.y, hw: F.hw, t: F.tell, team: u.team, src: h, kind: 'blade', hit: H(u, { dmg: F.dmg, knock: F.knock, kAngle: a, heavy: true }),
    onFire: (w2, z) => { for (let q = 0; q < 1; q += 0.2) puff(w2, z.x1 + (z.x2 - z.x1) * q, z.y1 + (z.y2 - z.y1) * q, '#B9B4AE', 2, 60, 5, 0.3); } });
}
// The clap (phase 3): both hands come together on a hero from either side.
function clap(w, u, k, t) {
  const C = GE.clap, p = lead(t, 0.4), a = angleTo(u.x, u.y, p.x, p.y) + Math.PI / 2, L = 240;
  const x1 = p.x + Math.cos(a) * L, y1 = p.y + Math.sin(a) * L, x2 = p.x - Math.cos(a) * L, y2 = p.y - Math.sin(a) * L;
  addDanger(w, { shape: 'line', x1, y1, x2, y2, hw: C.hw, t: C.tell, team: u.team, src: u, kind: 'bone', hit: H(u, { dmg: C.dmg, stagger: 40, knock: 100 }),
    onFire: (w2, z) => thud(w2, p.x, p.y, '#B9B4AE', 24, 9) });
  for (const [i, sx, sy] of [[0, x1, y1], [1, x2, y2]]) { const h = k.hands[i]; h.job = { t: 0, out: C.tell * 0.5, hold: C.tell * 0.5 + 0.3, sx: h.x, sy: h.y, x1: sx, y1: sy, x2: p.x + (sx - p.x) * 0.15, y2: p.y + (sy - p.y) * 0.15, a: angleTo(sx, sy, p.x, p.y) }; }
}
// The spin (phase 2 on): the head whirls after its mark, a circle going down just ahead of it; the hands tuck in.
function spinTick(w, u, k, dt) {
  const s = k.spin; if (!s) return false;
  s.t -= dt; s.tick -= dt; u.facing += 14 * dt;
  const t = pickTarget(w, u, k, dt);
  if (t) walkTo(w, u, t.x, t.y, GE.spin.speed, dt); else stand(u, dt);
  if (s.tick <= 0) { s.tick = GE.spin.step;
    addDanger(w, { shape: 'circle', x: u.x + (u.vx || 0) * GE.spin.step, y: u.y + (u.vy || 0) * GE.spin.step, r: GE.spin.r, t: GE.spin.step, team: u.team, src: u, kind: 'blade', hit: H(u, { dmg: GE.spin.dmg, knock: GE.spin.knock }) }); }
  if (s.t <= 0) { k.spin = null; beginHold(u, 1.2, null); steam(w, u.x, u.y); } // it stops, venting: a window
  return true;
}
// The eye (phase 3): a beam from the head that sweeps across the room.
function startLaser(w, u, k, at) {
  const L = GE.laser, dir = chance(0.5) ? 1 : -1, a0 = at - dir * L.sweep / 2;
  k.laser = { t: L.tell, run: L.dur, a: a0, dir, tick: 0 };
  const e = clipLine(w, u.x, u.y, a0, L.len, 10, u.r);
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: e.x, y2: e.y, hw: L.hw, t: L.tell, team: u.team, src: u, kind: 'fire' });
  setAnim(u, 'cast', L.tell + L.dur);
}
function laserTick(w, u, k, dt) {
  const l = k.laser; if (!l) return false;
  stand(u, dt); u.facing = l.a;
  if (l.t > 0) { l.t -= dt; return true; }
  const L = GE.laser; l.a += l.dir * L.sweep / L.dur * dt;
  const e = clipLine(w, u.x, u.y, l.a, L.len, 10, u.r);
  w.laser = { x1: u.x, y1: u.y, x2: e.x, y2: e.y };
  if ((l.tick -= dt) <= 0) { l.tick = L.tick;
    addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: e.x, y2: e.y, hw: L.hw + 8, t: 0.25, team: u.team, src: u, kind: 'fire' });
    for (const h of heroesOf(w, u)) { const dd = dist(u.x, u.y, h.x, h.y); if (dd > e.d + h.r) continue; if (Math.abs(Math.sin(angleTo(u.x, u.y, h.x, h.y) - l.a)) * dd < L.hw + h.r * 0.5 && angleDiff(angleTo(u.x, u.y, h.x, h.y), l.a) < Math.PI / 2) hurt(w, h, L.dmg * u.dmgMul, u, { noDodge: true, burn: L.burn, knock: 50 }); } }
  if ((l.run -= dt) <= 0) { k.laser = null; w.laser = null; beginHold(u, 0.8, null); }
  return true;
}
function steam(w, x, y) { for (let i = 0; i < 14; i++) { const a = rand() * TAU, v = rrange(60, 200); w.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rise: 30, life: 0.8, max: 0.8, size: rrange(6, 11), color: 'rgba(235,235,240,0.75)' }); } }

// ---- phase turns: a blast of steam round the head; both hands rebuilt at once
function enter(w, u, k, p) {
  notePhase(w, k); k.spin = null; k.laser = null; w.laser = null; u.invulnT = 1.3;
  around(w, u, { r: 220, tell: 0.9, kind: 'fire', after: 0.4, hit: { dmg: 16, burn: 20, knock: 320 }, fire: (w2, z) => steam(w2, z.x, z.y) });
  for (const i of [0, 1]) if (!k.hands[i] || !alive(k.hands[i])) { k.rebuild[i] = 0; makeHand(w, u, k, i); }
  if (p === 2) again(u, 'spin', 2);
  if (p === 3) { w.overheat = true; again(u, 'laser', 1.5); }
}
function death(w, u) { w.laser = null; w.overheat = false; endParts(w, u); steam(w, u.x, u.y); deathBurst(w, u, ['#B9B4AE', '#8A94A6', '#FFB347', '#E9DDC2']); }

// ---- the engine room: iron floor, four boiler pillars, conveyor bands drawn across
function foundry(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 260, y: Hh / 2 };
  for (const [fx, fy] of [[0.36, 0.22], [0.36, 0.78], [0.62, 0.22], [0.62, 0.78]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 36 });
  w.belts = [Hh * 0.5];
  w.arenaDecor = [[0.15, 0.25, 'pipe'], [0.15, 0.75, 'pipe'], [0.85, 0.2, 'rubble'], [0.85, 0.8, 'crack']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.2, v: 0 }));
  w.arenaDraw = (ctx, w2) => drawFoundry(ctx, w2);
  w.arenaAir = (ctx, w2) => drawLaser(ctx, w2);
}

const HAND = (name, o) => PART(name, { r: 40, vr: 40, mass: 30, hp: 100, draw: drawEngineHand, ...o });
export const ENGINE = {
  defs: {
    greatEngine: { team: 'enemy', name: 'The Great Engine', r: 52, vr: 52, turn: 2.5, accel: 140, face: 2.5, mass: 14, hp: 950, speed: 46, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 240, coins: [100, 120], boss: true, arena: 'foundry', noCorpse: true,
      res: { poison: 0, burn: 0.5, chill: 0.8, shock: 1.4, wet: 1.3, stagger: 0.4, radiance: 0.5, curse: 0.5 }, draw: drawEngineHead, brain, onDeath: death },
    engineHammer: HAND('The Great Engine (left hand)', { res: { shock: 1.4 } }),
    engineClaw: HAND('The Great Engine (right hand)', { res: { shock: 1.4 } }),
  },
  arenas: { foundry },
};
