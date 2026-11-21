// The Sand Wurm: the Sunken Dunes' boss (floor 3). Design and numbers: docs/BOSS-sand-wurm.md. The designer (round 9,
// the Sand wurm card): "Should probably be a boss"; from the roster: "Burrows, then erupts under a hero: the ground
// shakes first"; from the deck note: "Snake enemies/ chains. Follow the leader segments, each with its own hit box.
// Burrowing enemies (leave being trail of dug up dirt)."
// The head is the boss; eight segments follow its path (each its own hit box: a third of every blow gets through).
// Underground it can't be hurt and its body is gone; a mound of churned sand runs to where it will come up.
// The Dunes theme is roster3's: until it names this boss, ?bossroom&boss=sandWurm and lab.html?m=boss&boss=sandWurm.
// Art: PLACEHOLDER, drawn in code (fx-boss.js drawWurmHead / drawWurmSegment).
import { alive, hurt, puff, sparks, setAnim, addDanger } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lob, cone, around, hold, beginHold, due, again, stand, turnTo } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, randomHero, lead, thud, part, endParts, PART, place, logOf, notePhase, deathBurst, inside } from './boss-kit.js';
import { drawWurmHead, drawWurmSegment, drawDunes } from './fx-boss.js';

export const SW = {
  body: [40, 39, 38, 36, 34, 32, 29, 26], gap: 4, share: 0.33,
  surface: [4.5, 6], bite: { r: 165, arc: 1.3, tell: 0.7, dmg: 100, knock: 280, rec: 0.5 },
  spit: { n: 3, r: 66, tell: 1.0, dmg: 65, cd: [3, 4.5] },
  dive: { tell: 0.6, r: 110, dmg: 36 },
  travel: 1.3, erupt: { r: 125, tell: 1.25, dmg: 110, knock: 380, line: 420, hw: 40, lineDmg: 80 },
  tremor: { r0: 135, r1: 270, tell: 0.9, dmg: 55, knock: 220 },
  pit: { r: 170, pull: 95, dur: 5, dmg: 120, knock: 420 },
};
export const PHASE_AT = [1, 0.65, 0.35];
const WAKE = 520;

function brain(w, u, dt) {
  const k = u.sw || (u.sw = { phase: 0, st: 'surface', t: SW.surface[1] });
  if (!k.parts) build(w, u, k);
  steady(u); logOf(w, u, k);
  follow(w, u, k);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 0.8, null); thud(w, u.x, u.y, '#D9C08A', 22, 7); notePhase(w, k); k.t = 1.5; })) return true;
  if (k.st === 'under') return underTick(w, u, k, dt);
  if (k.st === 'rise') return riseTick(w, u, k, dt);
  if (k.st === 'pit') return pitTick(w, u, k, dt);
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  // up on the sand for a while, then down again
  if ((k.t -= dt) <= 0) { dive(w, u, k); return true; }
  const d = dist(u.x, u.y, t.x, t.y), gap = d - u.r - t.r, at = angleTo(u.x, u.y, t.x, t.y);
  if (gap < 110 && angleDiff(u.facing, at) < 0.8 && due(u, 'bite', dt, 0.6)) {
    again(u, 'bite', 2, 3);
    cone(w, u, u.facing, { r: SW.bite.r, arc: SW.bite.arc, tell: SW.bite.tell, kind: 'blade', anim: 'swing', after: SW.bite.rec, hit: { dmg: SW.bite.dmg, knock: SW.bite.knock, heavy: true } });
    return true;
  }
  if (due(u, 'spit', dt, 2) && d > 180) {
    again(u, 'spit', ...SW.spit.cd);
    const hs = heroesOf(w, u);
    for (let i = 0; i < SW.spit.n && hs.length; i++) { const h = hs[i % hs.length], p = lead(h, 0.5), a = rand() * TAU, off = i < hs.length ? 0 : rrange(60, 120);
      lob(w, u, p.x + Math.cos(a) * off, p.y + Math.sin(a) * off, { r: SW.spit.r, tell: SW.spit.tell + i * 0.15, kind: 'bone', proj: 'cluster', color: '#D9C08A', dust: '#D9C08A', hit: { dmg: SW.spit.dmg, knock: 120, stagger: 20 } }); }
    beginHold(u, 0.6, at); setAnim(u, 'throw', 0.5);
    return true;
  }
  if (gap > 40) walkTo(w, u, t.x, t.y, 1, dt); else stand(u, dt);
  turnTo(u, at, 2.2, dt);
  return true;
}

// ---- the body
function build(w, u, k) {
  k.parts = []; k.trail = [];
  const back = u.facing + Math.PI;
  for (let d = 0; d < 800; d += 6) k.trail.push({ x: u.x + Math.cos(back) * d, y: u.y + Math.sin(back) * d });
  let off = 0, prevR = u.r;
  SW.body.forEach((r, i) => {
    off += prevR + r + SW.gap; prevR = r;
    const p = part(w, u, 'wurmSegment', u.x + Math.cos(back) * off, u.y + Math.sin(back) * off, { share: SW.share });
    p.r = r; p.vr = r; p.off = off; p.seg = i; p.last = i === SW.body.length - 1; k.parts.push(p);
  });
}
function follow(w, u, k) {
  const first = k.trail[0];
  if (!first || dist(first.x, first.y, u.x, u.y) > 3) { k.trail.unshift({ x: u.x, y: u.y }); if (k.trail.length > 500) k.trail.length = 500; }
  let acc = dist(u.x, u.y, k.trail[0].x, k.trail[0].y), i = 0;
  const at = (want) => {
    while (i < k.trail.length - 1) { const a = k.trail[i], b = k.trail[i + 1], L = dist(a.x, a.y, b.x, b.y);
      if (acc + L >= want) { const q = (want - acc) / (L || 1); return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, a: angleTo(b.x, b.y, a.x, a.y) }; } acc += L; i++; }
    const e = k.trail[k.trail.length - 1]; return { x: e.x, y: e.y, a: u.facing };
  };
  const under = k.st === 'under';
  for (const p of k.parts) {
    if (!alive(p)) continue;
    const q = at(p.off); place(p, q.x, q.y, q.a);
    // still in the hole (or the whole wurm is under): not there to see or hit
    const inHole = k.hole && dist(q.x, q.y, k.hole.x, k.hole.y) < 14;
    p.hidden = under || inHole; p.ethereal = p.hidden; // (parts only: the head is never ethereal, battle mode would count it gone)
  }
}

// ---- down, along, up
function dive(w, u, k) {
  if (k.phase >= 3 && (k.pitNext || chance(0.35))) { k.pitNext = false; startPit(w, u, k); return; }
  k.st = 'under'; k.t = SW.travel; k.hole = { x: u.x, y: u.y };
  around(w, u, { r: SW.dive.r, tell: SW.dive.tell, kind: 'bone', hit: { dmg: SW.dive.dmg, knock: 200 }, fire: (w2, z) => thud(w2, z.x, z.y, '#D9C08A', 20, 6) });
  k.diving = SW.dive.tell; setAnim(u, 'ability', SW.dive.tell);
}
function underTick(w, u, k, dt) {
  stand(u, dt);
  if (k.diving > 0) { k.diving -= dt; if (k.diving <= 0) { u.hidden = true; k.mound = { x: u.x, y: u.y }; } return true; }
  u.invulnT = Math.max(u.invulnT, 0.1); u.hidden = true;
  // the mound of churned sand runs to the one it wants
  const t = pickTarget(w, u, k, dt) || randomHero(w, u);
  if (t && k.mound) { const a = angleTo(k.mound.x, k.mound.y, t.x, t.y), sp = 360 * dt; k.mound.x += Math.cos(a) * Math.min(sp, dist(k.mound.x, k.mound.y, t.x, t.y)); k.mound.y += Math.sin(a) * Math.min(sp, dist(k.mound.x, k.mound.y, t.x, t.y)); k.mound.a = a;
    if (rand() < dt * 18) w.particles.push({ x: k.mound.x + rrange(-14, 14), y: k.mound.y + rrange(-14, 14), vx: rrange(-40, 40), vy: rrange(-40, 40), life: 0.6, max: 0.6, size: 6, color: '#C9A86A' });
    (w.digs || (w.digs = [])).push({ x: k.mound.x, y: k.mound.y, t: 0, max: 6 }); if (w.digs.length > 160) w.digs.splice(0, w.digs.length - 160); }
  w.mound = k.mound;
  if ((k.t -= dt) <= 0) erupt(w, u, k, t);
  return true;
}
// It comes up under its mark: the ground shakes (a circle fills), then it bursts out and rears along a line.
function erupt(w, u, k, t) {
  const E = SW.erupt, p = t ? lead(t, 0.7) : k.mound, q = inside(w, p.x, p.y, u.r + 20), a = t ? angleTo(q.x, q.y, t.x + (t.vx || 0), t.y + (t.vy || 0)) + rrange(-0.4, 0.4) : rand() * TAU;
  const end = inside(w, q.x + Math.cos(a) * E.line, q.y + Math.sin(a) * E.line, u.r);
  k.st = 'rise'; k.rise = { t: E.tell, x: q.x, y: q.y, a, ex: end.x, ey: end.y, go: 0.45, n: k.double ? 1 : 0 };
  addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: E.r, t: E.tell, team: u.team, src: u, kind: 'bone', hit: H(u, { dmg: E.dmg, knock: E.knock, heavy: true, stagger: 30 }),
    onFire: (w2, z) => { thud(w2, z.x, z.y, '#D9C08A', 30, 10); } });
  addDanger(w, { shape: 'line', x1: q.x, y1: q.y, x2: end.x, y2: end.y, hw: E.hw, t: E.tell + 0.3, team: u.team, src: u, kind: 'bone', hit: H(u, { dmg: E.lineDmg, knock: 260, kAngle: a + Math.PI / 2 }) });
  if (k.phase >= 2) addDanger(w, { shape: 'ring', x: q.x, y: q.y, r0: SW.tremor.r0, r1: SW.tremor.r1, t: E.tell + 0.9, team: u.team, src: u, kind: 'bone', hit: H(u, { dmg: SW.tremor.dmg, knock: SW.tremor.knock }) });
  w.quake = { x: q.x, y: q.y, t: 0, max: E.tell };
}
function riseTick(w, u, k, dt) {
  const r = k.rise; stand(u, dt);
  u.invulnT = Math.max(u.invulnT, 0.05);
  if (r.t > 0) { r.t -= dt; w.shake = Math.max(w.shake, 2); if (r.t <= 0) {
    // up: the head at the hole, the body still under it, then out along the line
    k.hole = { x: r.x, y: r.y }; k.mound = null; w.mound = null; u.hidden = false;
    place(u, r.x, r.y, r.a); k.trail = [{ x: r.x, y: r.y }, { x: r.x - Math.cos(r.a), y: r.y - Math.sin(r.a) }]; for (let i = 0; i < 160; i++) k.trail.push({ x: r.x, y: r.y });
    r.p = 0;
  } return true; }
  r.p = Math.min(1, r.p + dt / r.go);
  place(u, r.x + (r.ex - r.x) * r.p, r.y + (r.ey - r.y) * r.p, r.a);
  if (r.p >= 1) {
    if (k.phase >= 2 && !k.double) { k.double = true; k.st = 'under'; k.t = SW.travel * 0.7; k.hole = { x: u.x, y: u.y }; k.mound = { x: u.x, y: u.y }; u.hidden = true; return true; } // phase 2: straight back down for a second
    k.double = false; k.st = 'surface'; k.t = rrange(...SW.surface); k.hole2T = 2; beginHold(u, 0.9, null); u.invulnT = 0;
  }
  return true;
}
// ---- phase 3: the sinkhole. It goes down in the middle of the room and the sand drains towards it: everyone is pulled
// in for 5 s, then it comes up out of the middle.
function startPit(w, u, k) {
  k.st = 'pit'; k.pitT = SW.pit.dur; u.hidden = true; k.hole = { x: u.x, y: u.y };
  k.pitAt = { x: w.W * 0.5, y: w.H * 0.5 };
  w.sink = { x: k.pitAt.x, y: k.pitAt.y, r: SW.pit.r * 1.8, t: 0 };
  addDanger(w, { shape: 'circle', x: k.pitAt.x, y: k.pitAt.y, r: SW.pit.r, t: SW.pit.dur, team: u.team, src: u, kind: 'bone', hit: H(u, { dmg: SW.pit.dmg, knock: SW.pit.knock, heavy: true }),
    onFire: (w2, z) => thud(w2, z.x, z.y, '#D9C08A', 34, 12) });
}
function pitTick(w, u, k, dt) {
  stand(u, dt); u.invulnT = Math.max(u.invulnT, 0.1); u.hidden = true;
  if (w.sink) w.sink.t += dt;
  for (const h of heroesOf(w, u)) { const a = angleTo(h.x, h.y, k.pitAt.x, k.pitAt.y); h.x += Math.cos(a) * SW.pit.pull * dt; h.y += Math.sin(a) * SW.pit.pull * dt; }
  if ((k.pitT -= dt) <= 0) {
    w.sink = null; k.st = 'rise'; const a = rand() * TAU, end = inside(w, k.pitAt.x + Math.cos(a) * SW.erupt.line, k.pitAt.y + Math.sin(a) * SW.erupt.line, u.r);
    k.rise = { t: 0.01, x: k.pitAt.x, y: k.pitAt.y, a, ex: end.x, ey: end.y, go: 0.5 }; k.double = true;
  }
  return true;
}

// ---- phase turns: it rears up and the sand shakes (a ring), then down it goes
function enter(w, u, k, p) {
  notePhase(w, k); u.invulnT = 1.2;
  around(w, u, { r: 240, tell: 0.9, kind: 'bone', after: 0.3, hit: { dmg: 14, knock: 320, stagger: 30 }, fire: (w2, z) => thud(w2, z.x, z.y, '#D9C08A', 28, 9) });
  k.t = 1.2; if (p === 3) k.pitNext = true; // its next dive is the sinkhole
}
function death(w, u) { w.mound = null; w.sink = null; endParts(w, u); deathBurst(w, u, ['#D9C08A', '#B58B5A', '#8E6A46']); }

// ---- the sunken court: open sand, two broken sandstone columns, dunes rippling
function dunes(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 260, y: Hh / 2 };
  for (const [fx, fy] of [[0.4, 0.28], [0.62, 0.74]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 36 });
  w.arenaDecor = [[0.2, 0.3, 'rubble'], [0.75, 0.2, 'bonepile'], [0.3, 0.8, 'crack']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.3, v: 0 }));
  w.arenaDraw = (ctx, w2) => drawDunes(ctx, w2);
}

export const WURM = {
  defs: {
    sandWurm: { team: 'enemy', name: 'The Sand Wurm', r: 44, vr: 44, turn: 2.2, accel: 140, face: 2.2, mass: 12, hp: 760, speed: 60, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 230, coins: [90, 110], boss: true, arena: 'dunes', noCorpse: true,
      res: { poison: 0.3, stagger: 0.4, wet: 1.4, burn: 0.8 }, draw: drawWurmHead, brain, onDeath: death },
    wurmSegment: PART('The Sand Wurm (body)', { r: 36, vr: 36, mass: 40, hp: 100, draw: drawWurmSegment }),
  },
  arenas: { dunes },
};
