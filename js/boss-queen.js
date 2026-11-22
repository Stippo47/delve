// The Winter Queen: the Frost Hollow's boss (floor 3). Design and numbers: docs/BOSS-winter-queen.md.
// The designer, round 12: "Don't like all of the abilities. All seem very similar. U can keep her just improve quality
// worthy of a boss. Clones shoukd also look different". Round 13: she is kept (an ice mage who stands off, walls that
// split the party, mirror images, a blizzard), and every move is rebuilt so no two ask the same thing or look alike:
// crystals that fly, a burst of ice round her, a wall and the mist behind it, beams of cold between her and her
// mirrors, a storm with a calm eye. Her images are ice mirrors now: frosted copies that cast nothing of their own.
// Art: art round 9's Winter Queen (art/bosses/winter-queen.svg); the images are that art turned to frosted ice.
import { alive, hurt, puff, sparks, setAnim, addDanger, spawn, kill, fx, addStatus } from './sim.js';
import { TAU, clamp, dist, angleTo, rand, rrange, chance } from './util.js';
import { buildGrid, circleRect } from './path.js';
import { hold, beginHold, due, again, stand, turnTo, openSpot, blink } from './elites.js';
import { walkTo, courtFalls } from './enemies.js';
import { variantUrl } from './recolor.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, lead, logOf, notePhase, inside, stage, bfx, liveZone, keepZone, TEST_MOVE } from './boss-kit.js';
import { drawGlacierFloor, drawGlacierAir } from './boss-queen-fx.js';

export const WQ = {
  fan: { n: 5, spread: 0.2, speed: 520, dmg: 23, chill: 14, r: 11, life: 1.5, wind: 0.5, cd: [3.2, 4.2] },
  nova: { r: 180, tell: 0.85, dmg: 44, chill: 44, knock: 300, cd: [5, 6.5] },
  blink: { d: [380, 560] },
  wall: { len: 760, size: 40, dur: 8, tell: 1.1, dmg: 20, chill: 30, cd: [12, 14] },
  mist: { n: 7, r: 92, t: 7, reach: 300 },
  image: { n: 2, hpK: 0.1, every: 15, shatter: 110, shDmg: 32 },
  lattice: { tell: 1.2, dur: 3.6, hw: 22, tick: 0.25, dmg: 11, chill: 16, cd: [8.5, 10.5] },
  storm: { eye: 215, chill: 13, dmg: 4.9, tick: 0.5, k: 0.85, nova: [5.5, 7] },
};
export const PHASE_AT = [1, 0.7, 0.45, 0.2];
const WAKE = 460, ICE = '#DDF6FF';

function brain(w, u, dt) {
  const k = u.wq || (u.wq = { phase: 0, t: 0 });
  steady(u); logOf(w, u, k); stage(w, 'queen', drawGlacierFloor, drawGlacierAir);
  k.t += dt;
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 0.9, null); setAnim(u, 'cast', 0.9); puff(w, u.x, u.y, ICE, 22, 160, 7, 0.7); notePhase(w, k); })) return true;
  if (TEST_MOVE && !k.tested) { k.tested = true;
    if (TEST_MOVE === 'wall') { k.phase = Math.max(2, k.phase); again(u, 'wall', 0.8); }
    if (TEST_MOVE === 'lattice') { k.phase = Math.max(3, k.phase); again(u, 'images', 0.3); again(u, 'lattice', 2); again(u, 'wall', 30); }
    if (TEST_MOVE === 'storm') { k.phase = 4; startStorm(w, u, k); again(u, 'wall', 30); again(u, 'lattice', 30); } }
  if (k.phase >= 4) storm(w, u, k, dt);
  if (k.phase >= 3) images(w, u, k, dt);
  if (latticeTick(w, u, k, dt)) return true;
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const K = k.phase >= 4 ? WQ.storm.k : 1;
  const d = dist(u.x, u.y, t.x, t.y), at = angleTo(u.x, u.y, t.x, t.y);
  const near = heroesOf(w, u).filter((h) => dist(h.x, h.y, u.x, u.y) < WQ.nova.r * 0.85);
  // crowded: a frost nova, then she blinks away (in the storm she stands her ground: the eye is hers)
  if (near.length && due(u, 'nova', dt, 1.5)) {
    again(u, 'nova', ...(k.phase >= 4 ? WQ.storm.nova : WQ.nova.cd));
    nova(w, u, () => { if (k.phase < 4) away(w, u); });
    return true;
  }
  if (k.phase >= 3 && due(u, 'lattice', dt, 3) && mirrors(w, u).length) { again(u, 'lattice', ...WQ.lattice.cd.map((x) => x * K)); startLattice(w, u, k); return true; }
  if (k.phase >= 2 && k.phase < 4 && due(u, 'wall', dt, 2)) { again(u, 'wall', ...WQ.wall.cd); iceWall(w, u, k); return true; }
  if (due(u, 'fan', dt, 1.2) && d < 760) { again(u, 'fan', ...WQ.fan.cd.map((x) => x * K)); fan(w, u, t); return true; }
  if (k.phase >= 4) { // the storm: she holds the middle of the hall
    const cx = w.W / 2, cy = w.H / 2; if (dist(u.x, u.y, cx, cy) > 40) walkTo(w, u, cx, cy, 0.9, dt); else stand(u, dt);
  } else if (d < 280) { const a = at + Math.PI, p = inside(w, u.x + Math.cos(a) * 120, u.y + Math.sin(a) * 120, u.r + 20); walkTo(w, u, p.x, p.y, 0.9, dt); }
  else if (d > 440) walkTo(w, u, t.x, t.y, 0.8, dt);
  else stand(u, dt);
  turnTo(u, at, 4, dt);
  return true;
}

// ---- Icicle Fan: five crystals conjured over her shoulders, then thrown: real shots, stopped by pillars
function fan(w, u, t) {
  const F = WQ.fan, p = lead(t, 0.3), a0 = angleTo(u.x, u.y, p.x, p.y);
  bfx(w, { type: 'fanGather', u, a: a0, n: F.n, max: F.wind });
  setAnim(u, 'cast', F.wind + 0.25);
  beginHold(u, F.wind + 0.25, a0, () => {
    for (let i = 0; i < F.n; i++) { const a = a0 + (i - (F.n - 1) / 2) * F.spread;
      w.projectiles.push({ kind: 'icicle', ab: 'iceShard', x: u.x + Math.cos(a) * (u.r + 10), y: u.y + Math.sin(a) * (u.r + 10), vx: Math.cos(a) * F.speed, vy: Math.sin(a) * F.speed, r: F.r, team: u.team, owner: u,
        dmg: F.dmg * u.dmgMul, o: { chill: F.chill, knock: 90 }, life: F.life, a }); }
  });
}
// ---- Frost Nova: ice bursts out of the floor all round her
function nova(w, u, after) {
  const N = WQ.nova;
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: N.r, t: N.tell, team: u.team, src: u, kind: 'ice', quiet: true, hit: H(u, { dmg: N.dmg, chill: N.chill, knock: N.knock }),
    onFire: (w2, z) => { bfx(w2, { type: 'frostBurst', x: z.x, y: z.y, r: N.r, max: 0.9, seed: Math.round(z.x + z.y) }); fx(w2, { type: 'zone', kind: 'snow', x: z.x, y: z.y, r: N.r * 0.85, max: 2.2 }); w2.shake = Math.max(w2.shake, 6); } });
  beginHold(u, N.tell + 0.2, null, after); setAnim(u, 'cast', N.tell + 0.2);
}
function away(w, u) {
  const hs = heroesOf(w, u); if (!hs.length) return;
  let best = null, bd = -1;
  for (let i = 0; i < 8; i++) { const p = openSpot(w, u.x, u.y, ...WQ.blink.d, u.r + 10); if (!p) continue; const m = Math.min(...hs.map((h) => dist(h.x, h.y, p.x, p.y))); if (m > bd) { bd = m; best = p; } }
  if (best) { bfx(w, { type: 'snowBlink', x: u.x, y: u.y, max: 0.5 }); blink(w, u, best.x, best.y, 'rgba(221,246,255,0.9)'); bfx(w, { type: 'snowBlink', x: u.x, y: u.y, max: 0.5 }); }
}
// ---- Ice Wall: a wall of ice blocks across the room through the middle of the party, at right angles to her; heroes
// on it are shoved off to their side. Then the side cut off from her fills with freezing mist: walk round the wall.
function iceWall(w, u, k) {
  const hs = heroesOf(w, u); if (!hs.length) return;
  const cx = hs.reduce((s, h) => s + h.x, 0) / hs.length, cy = hs.reduce((s, h) => s + h.y, 0) / hs.length;
  const a = angleTo(u.x, u.y, cx, cy) + Math.PI / 2, W2 = WQ.wall;
  const x1 = cx - Math.cos(a) * W2.len / 2, y1 = cy - Math.sin(a) * W2.len / 2, x2 = cx + Math.cos(a) * W2.len / 2, y2 = cy + Math.sin(a) * W2.len / 2;
  addDanger(w, { shape: 'line', x1, y1, x2, y2, hw: W2.size * 0.7, t: W2.tell, team: u.team, src: u, kind: 'ice', quiet: true, hit: H(u, { dmg: W2.dmg, chill: W2.chill }),
    onFire: (w2) => {
      const made = [];
      for (let d = 0; d <= W2.len; d += W2.size) {
        const x = x1 + Math.cos(a) * d, y = y1 + Math.sin(a) * d;
        if (x < 30 || y < 30 || x > w2.W - 30 || y > w2.H - 30) continue;
        if (w2.pillars.some((p) => dist(x, y, p.x, p.y) < p.r + W2.size * 0.6) || dist(x, y, u.x, u.y) < u.r + W2.size) continue;
        const r = { x: x - W2.size / 2, y: y - W2.size / 2, w: W2.size, h: W2.size, temp: W2.dur + (made.length % 3) * 0.15, kind: 'ice' }; r.max = r.temp;
        w2.walls.push(r); made.push(r);
      }
      if (!made.length) return;
      buildGrid(w2);
      for (const o of w2.units) { if (!alive(o) || o === u) continue;
        for (const r of made) { const c = circleRect(o.x, o.y, o.r, r); if (!c) continue; const side = Math.sign(Math.sin(angleTo(x1, y1, o.x, o.y) - a)) || 1, na = a + side * Math.PI / 2; o.x += Math.cos(na) * (c.over + 2); o.y += Math.sin(na) * (c.over + 2); } }
      puff(w2, cx, cy, ICE, 20, 200, 8, 0.6); w2.shake = Math.max(w2.shake, 6);
      // the far side from her: mist rolls in along the wall's back
      const back = angleTo(u.x, u.y, cx, cy), M = WQ.mist;
      for (let i = 0; i < M.n; i++) { const q = (i + 0.5) / M.n - 0.5, d = M.r * (0.9 + (i % 2) * 1.1), p = inside(w2, cx + Math.cos(a) * W2.len * 0.8 * q + Math.cos(back) * d, cy + Math.sin(a) * W2.len * 0.8 * q + Math.sin(back) * d, 40);
        w2.hazards.push({ type: 'mist', x: p.x, y: p.y, r: M.r, t: M.t + i * 0.1, max: M.t + i * 0.1, queens: true }); }
    } });
  beginHold(u, W2.tell + 0.3, angleTo(u.x, u.y, cx, cy)); setAnim(u, 'cast', W2.tell + 0.2);
}
// ---- Mirror Images (phase 3 on): two ice mirrors of her stand in the room (frosted, still; each 5% of her health).
// The Lattice: she throws a beam of cold to one mirror, it throws it to the next, and that one back to her: a triangle
// of cold across the room. Keep off the lines; a broken mirror breaks its two lines. A mirror shatters when broken.
const mirrors = (w, u) => w.units.filter((o) => o.imageOf === u && alive(o));
function images(w, u, k, dt) {
  if (mirrors(w, u).length || k.lat || !due(u, 'images', dt, 0.5)) return;
  again(u, 'images', WQ.image.every);
  for (let i = 0; i < WQ.image.n; i++) {
    let best = null, bd = -1; // spread out: as far from her and from each other as the room lets them stand
    for (let j = 0; j < 10; j++) { const p = openSpot(w, w.W / 2, w.H / 2, 120, Math.min(w.W, w.H) * 0.46, u.r + 20); if (!p) continue; const m = Math.min(dist(p.x, p.y, u.x, u.y), ...mirrors(w, u).map((o) => dist(p.x, p.y, o.x, o.y))); if (m > bd) { bd = m; best = p; } }
    if (!best) continue;
    const m = spawn(w, 'queenImage', best.x, best.y, { mult: w.mult || 1, team: u.team }); m.imageOf = u; m.court = true; m.aggro = true; m.minion = true; m.calledBy = u;
    m.maxHp = m.hp = Math.round(u.maxHp * WQ.image.hpK); m.facing = angleTo(m.x, m.y, u.x, u.y);
    bfx(w, { type: 'snowBlink', x: m.x, y: m.y, max: 0.5 }); puff(w, m.x, m.y, ICE, 14, 120, 7, 0.5);
  }
}
function imageBrain(w, m, dt) {
  const q = m.imageOf; if (!q || !alive(q)) { kill(w, m, null); return true; }
  stand(m, dt); turnTo(m, angleTo(m.x, m.y, q.x, q.y), 3, dt);
  return true;
}
function shatterImage(w, m) {
  const q = m.imageOf; if (!q || !alive(q)) return; // (images going down with her don't burst)
  addDanger(w, { shape: 'circle', x: m.x, y: m.y, r: WQ.image.shatter, t: 0.5, team: m.team, src: null, kind: 'ice', quiet: true, hit: { dmg: WQ.image.shDmg * q.dmgMul, chill: 30, knock: 160 },
    onFire: (w2, z) => bfx(w2, { type: 'frostBurst', x: z.x, y: z.y, r: z.r, max: 0.7, seed: m.id }) });
  bfx(w, { type: 'mirrorBreak', x: m.x, y: m.y, max: 0.6, seed: m.id });
}
const edges = (w, u) => { const ms = mirrors(w, u), pts = [u, ...ms]; return pts.length < 2 ? [] : pts.length === 2 ? [[u, ms[0]]] : pts.map((p, i) => [p, pts[(i + 1) % pts.length]]); };
function startLattice(w, u, k) {
  const L = WQ.lattice; k.lat = { t: 0, tick: 0, z: new Map() };
  for (const [a, b] of edges(w, u)) addDanger(w, { shape: 'line', x1: a.x, y1: a.y, x2: b.x, y2: b.y, hw: L.hw, t: L.tell, team: u.team, src: u, kind: 'ice', quiet: true });
  setAnim(u, 'cast', L.tell + L.dur);
}
function latticeTick(w, u, k, dt) {
  const s = k.lat; if (!s) return false;
  const L = WQ.lattice; s.t += dt; stand(u, dt);
  const E = edges(w, u);
  if (s.t < L.tell) { w.queenLattice = { edges: E.map(([a, b]) => [a.x, a.y, b.x, b.y]), k: s.t / L.tell, on: false }; return true; }
  if (s.t >= L.tell + L.dur || !E.length) { k.lat = null; w.queenLattice = null; beginHold(u, 0.6, null); return true; }
  w.queenLattice = { edges: E.map(([a, b]) => [a.x, a.y, b.x, b.y]), k: 1, on: true, t: s.t - L.tell };
  E.forEach(([a, b], i) => { let z = s.z.get(i); if (!z || !w.danger.includes(z)) { z = liveZone(w, u, { shape: 'line', x1: a.x, y1: a.y, x2: b.x, y2: b.y, hw: L.hw + 8, kind: 'ice' }); s.z.set(i, z); } keepZone(z, { x1: a.x, y1: a.y, x2: b.x, y2: b.y }); });
  if ((s.tick -= dt) <= 0) { s.tick = L.tick;
    for (const h of heroesOf(w, u)) for (const [a, b] of E) { const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1, q = clamp(((h.x - a.x) * dx + (h.y - a.y) * dy) / L2, 0, 1);
      if (dist(h.x, h.y, a.x + dx * q, a.y + dy * q) < L.hw + h.r * 0.5) { hurt(w, h, L.dmg * u.dmgMul, u, { noDodge: true, chill: L.chill, dot: true }); break; } } }
  return true;
}
// ---- the Blizzard (phase 4): the room goes white; only round her is it still: the eye of the storm. Outside the eye
// the cold bites all the time. So the party closes in on her, and her nova throws them back out into it.
function startStorm(w, u, k) { w.blizzard = 0.01; w.stormEye = { u, r: WQ.storm.eye }; k.stormTick = 0; }
function storm(w, u, k, dt) {
  const S = WQ.storm;
  if (!w.stormEye) startStorm(w, u, k);
  k.eyeZ = k.eyeZ && w.danger.includes(k.eyeZ) ? k.eyeZ : liveZone(w, u, { shape: 'ring', x: u.x, y: u.y, r0: S.eye, r1: 3000, kind: 'ice' });
  keepZone(k.eyeZ, { x: u.x, y: u.y }); k.eyeZ.unseen = true;
  if ((k.stormTick -= dt) > 0) return; k.stormTick = S.tick;
  for (const h of heroesOf(w, u)) if (dist(h.x, h.y, u.x, u.y) > S.eye + h.r * 0.5) { hurt(w, h, S.dmg * u.dmgMul, u, { noDodge: true, dot: true, color: '#DDF6FF' }); addStatus(w, h, 'chill', S.chill * S.tick, u); }
}

// ---- phase turns: a nova, a blink; then the phase's own thing
function enter(w, u, k, p) {
  notePhase(w, k); k.lat = null; w.queenLattice = null;
  u.invulnT = WQ.nova.tell + 0.6;
  nova(w, u, () => { if (p < 4) away(w, u); else { const c = inside(w, w.W / 2, w.H / 2, 60); bfx(w, { type: 'snowBlink', x: u.x, y: u.y, max: 0.5 }); blink(w, u, c.x, c.y, 'rgba(221,246,255,0.9)'); startStorm(w, u, k); } });
  if (p === 2) again(u, 'wall', 0.6);
  if (p === 3) { again(u, 'images', 0.2); again(u, 'lattice', 3); }
  if (p === 4) again(u, 'lattice', 5);
}
function death(w, u) {
  courtFalls(w); w.blizzard = 0; w.stormEye = null; w.queenLattice = null;
  for (const o of w.units) if (o.imageOf === u && alive(o)) kill(w, o, null);
  w.hazards = w.hazards.filter((h) => !h.queens);
  for (const r of w.walls) if (r.kind === 'ice' && r.temp != null) r.temp = Math.min(r.temp, 0.1 + rand() * 0.4); // her walls melt with her
  bfx(w, { type: 'frostBurst', x: u.x, y: u.y, r: 170, max: 1.0, seed: 9 }); bfx(w, { type: 'mirrorBreak', x: u.x, y: u.y, max: 0.9, seed: 5 }); w.shake = Math.max(w.shake, 12);
}

// ---- the glacier hall: a wide frozen hall, four ice pillars, her dais of ice at the far end
function glacier(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 210, y: Hh / 2 };
  for (const [fx2, fy] of [[0.38, 0.24], [0.38, 0.76], [0.66, 0.2], [0.66, 0.8]]) w.pillars.push({ x: W * fx2, y: Hh * fy, r: 36, ice: true });
  w.arenaDecor = [[0.2, 0.3, 'crack'], [0.2, 0.7, 'crack'], [0.8, 0.35, 'rubble'], [0.8, 0.65, 'rubble']].map(([fx2, fy, type]) => ({ type, x: W * fx2, y: Hh * fy, a: rand() * TAU, s: 1.3, v: 0 }));
  w.dais = { x: W - 210, y: Hh / 2 };
  stage(w, 'queen', drawGlacierFloor, drawGlacierAir);
}

const ART = 'art/bosses/winter-queen.svg'; // art round 9 (design/class-round9)
export const QUEEN = {
  defs: {
    winterQueen: { team: 'enemy', name: 'The Winter Queen', art: ART, headR: 57, r: 44, vr: 34, turn: 3.6, accel: 200, face: 3.6, mass: 5, hp: 900, speed: 50, role: 'ranged', range: 300,
      atkCd: 999, arc: 2, temp: 0.2, commit: 1.2, xp: 180, coins: [70, 90], boss: true, arena: 'glacier', attackAnim: 'cast',
      res: { chill: 0, wet: 0.5, burn: 1.3, stagger: 0.6, poison: 0.3 }, brain, onDeath: death },
    // an ice mirror of her: her shape in frosted ice (her art with its colour drained to pale blue), still; it shatters
    queenImage: { team: 'enemy', name: 'Ice Mirror', art: variantUrl(ART, { hue: 0, sat: 0.22, light: 0.16, accent: { from: 30, range: 180, hue: 200, sat: 0.5, light: 0.12 } }), headR: 57, r: 40, vr: 31, turn: 3.6, accel: 200, face: 3.6, mass: 30, hp: 60, speed: 0, role: 'ranged', range: 300,
      atkCd: 999, temp: 0.2, commit: 1.2, xp: 0, coins: [0, 0], noElite: true, noCorpse: true, res: { chill: 0, burn: 1.3, charm: 0, fear: 0, confuse: 0, sleepy: 0 }, brain: imageBrain, onDeath: shatterImage },
  },
  arenas: { glacier },
};
