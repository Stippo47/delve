// The Winter Queen: the Frost Hollow's boss (floor 3). Design and numbers: docs/BOSS-winter-queen.md. The designer
// answered the card "IDK" (round 9), so she's built as proposed in ROSTER.md and shown to them: "An ice mage. Walls of
// ice split the party, a blizzard hides the room, and she must be reached while her mirror images shatter."
// Art: PLACEHOLDER, the Frost Mage hero's art turned pale and bigger (art/heroes/frost.svg via recolor.js).
import { alive, hurt, puff, sparks, setAnim, addDanger, spawn, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, rand, rrange, chance } from './util.js';
import { buildGrid, circleRect } from './path.js';
import { lob, around, hold, beginHold, due, again, stand, turnTo, openSpot, blink } from './elites.js';
import { walkTo, courtFalls } from './enemies.js';
import { variantUrl } from './recolor.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, farthest, randomHero, lead, clipLine, thud, logOf, notePhase, deathBurst, inside } from './boss-kit.js';
import { drawGlacier, drawBlizzard } from './fx-boss.js';

export const WQ = {
  lance: { n: 3, fan: 0.28, len: 580, hw: 24, tell: 0.9, dmg: 41, chill: 30, cd: [3.2, 4.4] },
  nova: { r: 175, tell: 0.85, dmg: 43, chill: 55, knock: 260, cd: [5, 6.5] },
  blink: { after: 0.4, d: [380, 560] },
  wall: { len: 760, size: 40, dur: 7, tell: 1.1, dmg: 16, chill: 30, cd: [9, 11] },
  spike: { r: 64, tell: 1.0, dmg: 45, chill: 40 },
  image: { n: 2, hpK: 0.04, every: 16, shatter: 115, shDmg: 28 },
  hail: { r: 56, tell: 1.0, dmg: 28, chill: 22, every: 0.65 },
  storm: { k: 0.8 },
};
export const PHASE_AT = [1, 0.7, 0.45, 0.2];
const WAKE = 460;

function brain(w, u, dt) {
  const k = u.wq || (u.wq = { phase: 0 });
  steady(u); logOf(w, u, k);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 0.9, null); setAnim(u, 'cast', 0.9); puff(w, u.x, u.y, '#DDF6FF', 22, 160, 7, 0.7); notePhase(w, k); })) return true;
  if (k.phase >= 4) hail(w, u, k, dt);
  if (k.phase >= 3) images(w, u, k, dt);
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const K = k.phase >= 4 ? WQ.storm.k : 1;
  const d = dist(u.x, u.y, t.x, t.y), at = angleTo(u.x, u.y, t.x, t.y);
  const near = heroesOf(w).filter((h) => dist(h.x, h.y, u.x, u.y) < WQ.nova.r * 0.85);
  // crowded: a frost nova, then she blinks away
  if (near.length && due(u, 'nova', dt, 1.5)) {
    again(u, 'nova', ...WQ.nova.cd.map((x) => x * K));
    nova(w, u, u.x, u.y, () => { if (k.phase >= 1) away(w, u); });
    return true;
  }
  // phase 2 on: a wall of ice through the party, then a spike on whoever's cut off
  if (k.phase >= 2 && due(u, 'wall', dt, 2)) { again(u, 'wall', ...WQ.wall.cd.map((x) => x * K)); iceWall(w, u, k); return true; }
  // ice lances: a fan of three at her mark (two fans in the blizzard)
  if (due(u, 'lance', dt, 1.2) && d < 720) {
    again(u, 'lance', ...WQ.lance.cd.map((x) => x * K));
    lances(w, u, t, 1);
    return true;
  }
  // she keeps her distance: walks to stay 300-420 from her mark
  if (d < 280) { const a = at + Math.PI, p = inside(w, u.x + Math.cos(a) * 120, u.y + Math.sin(a) * 120, u.r + 20); walkTo(w, u, p.x, p.y, 0.9, dt); }
  else if (d > 440) walkTo(w, u, t.x, t.y, 0.8, dt);
  else stand(u, dt);
  turnTo(u, at, 4, dt);
  return true;
}

// ---- moves
function lances(w, u, t, mul = 1, src = u) {
  const p = lead(t, 0.25), a0 = angleTo(src.x, src.y, p.x, p.y), L = WQ.lance;
  for (let i = 0; i < L.n; i++) {
    const a = a0 + (i - (L.n - 1) / 2) * L.fan, e = clipLine(w, src.x, src.y, a, L.len, 12, src.r);
    addDanger(w, { shape: 'line', x1: src.x, y1: src.y, x2: e.x, y2: e.y, hw: L.hw, t: L.tell, team: src.team, src, kind: 'ice', hit: H(u, { dmg: L.dmg * mul, chill: L.chill * mul, knock: 120 }),
      onFire: (w2, z) => { w2.projectiles.push({ kind: 'icicle', ab: 'iceShard', x: z.x1, y: z.y1, vx: Math.cos(a) * 1400, vy: Math.sin(a) * 1400, r: 8, team: src.team, owner: src, dmg: 0, o: {}, life: Math.hypot(z.x2 - z.x1, z.y2 - z.y1) / 1400, a, noHit: true }); } });
  }
  beginHold(src, L.tell + 0.25, a0); setAnim(src, 'cast', L.tell + 0.2);
}
function nova(w, u, x, y, after) {
  const N = WQ.nova;
  addDanger(w, { shape: 'circle', x, y, r: N.r, t: N.tell, team: u.team, src: u, kind: 'ice', hit: H(u, { dmg: N.dmg, chill: N.chill, knock: N.knock }),
    onFire: (w2, z) => { puff(w2, z.x, z.y, '#DDF6FF', 24, 260, 8, 0.6); w2.shake = Math.max(w2.shake, 5); for (let i = 0; i < 10; i++) sparks(w2, z.x + Math.cos(i / 10 * TAU) * z.r * 0.7, z.y + Math.sin(i / 10 * TAU) * z.r * 0.7, i / 10 * TAU, 1, '#FFFFFF'); } });
  beginHold(u, N.tell + 0.2, null, after); setAnim(u, 'cast', N.tell + 0.2);
}
function away(w, u) {
  const hs = heroesOf(w); if (!hs.length) return;
  let best = null, bd = -1;
  for (let i = 0; i < 8; i++) { const p = openSpot(w, u.x, u.y, ...WQ.blink.d, u.r + 10); if (!p) continue; const m = Math.min(...hs.map((h) => dist(h.x, h.y, p.x, p.y))); if (m > bd) { bd = m; best = p; } }
  if (best) blink(w, u, best.x, best.y, 'rgba(221,246,255,0.9)');
}
// A wall of ice blocks across the room, through the middle of the party, at right angles to her; heroes on it are
// shoved off to their side. It melts after 7 s. Then a spike falls on whoever's on the far side from her.
function iceWall(w, u, k) {
  const hs = heroesOf(w); if (!hs.length) return;
  const cx = hs.reduce((s, h) => s + h.x, 0) / hs.length, cy = hs.reduce((s, h) => s + h.y, 0) / hs.length;
  const a = angleTo(u.x, u.y, cx, cy) + Math.PI / 2, W2 = WQ.wall;
  const x1 = cx - Math.cos(a) * W2.len / 2, y1 = cy - Math.sin(a) * W2.len / 2, x2 = cx + Math.cos(a) * W2.len / 2, y2 = cy + Math.sin(a) * W2.len / 2;
  addDanger(w, { shape: 'line', x1, y1, x2, y2, hw: W2.size * 0.7, t: W2.tell, team: u.team, src: u, kind: 'ice', hit: H(u, { dmg: W2.dmg, chill: W2.chill }),
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
      puff(w2, cx, cy, '#DDF6FF', 20, 200, 8, 0.6); w2.shake = Math.max(w2.shake, 6);
      // the one cut off from the rest (the far side from her): an ice spike falls on them
      const far = farthest(w2, u); if (far) lob(w2, u, far.x + (far.vx || 0) * 0.4, far.y + (far.vy || 0) * 0.4, { r: WQ.spike.r, tell: WQ.spike.tell, kind: 'ice', proj: 'icicle', dust: '#DDF6FF', hit: { dmg: WQ.spike.dmg, chill: WQ.spike.chill, knock: 120 } });
    } });
  beginHold(u, W2.tell + 0.3, angleTo(u.x, u.y, cx, cy)); setAnim(u, 'cast', W2.tell + 0.2);
}
// Mirror images (phase 3 on): two of her, the same to look at, that cast her lances (half as hard) and shatter into a
// ring of ice when broken. While none are up, two more form every 16 s, and she slips among them.
function images(w, u, k, dt) {
  const mine = w.units.filter((o) => o.imageOf === u && alive(o));
  if (mine.length || !due(u, 'images', dt, 0.5)) return;
  again(u, 'images', WQ.image.every);
  const spots = [];
  for (let i = 0; i < WQ.image.n; i++) { const p = openSpot(w, u.x, u.y, 260, 420, u.r + 10); if (p) spots.push(p); }
  spots.push({ x: u.x, y: u.y });
  // she ends up at one of the three spots, the images at the others
  const mineAt = spots.splice(Math.floor(rand() * spots.length), 1)[0];
  puff(w, u.x, u.y, '#DDF6FF', 16, 120, 7, 0.5);
  blink(w, u, mineAt.x, mineAt.y, 'rgba(221,246,255,0.9)');
  for (const p of spots) {
    const m = spawn(w, 'queenImage', p.x, p.y, { mult: w.mult }); m.imageOf = u; m.court = true; m.aggro = true; m.dmgMul = u.dmgMul * 0.5;
    m.maxHp = m.hp = Math.round(u.maxHp * WQ.image.hpK); m.facing = u.facing;
    puff(w, p.x, p.y, '#DDF6FF', 16, 120, 7, 0.5);
  }
}
function imageBrain(w, m, dt) {
  const q = m.imageOf; if (!q || !alive(q)) { kill(w, m, null); return true; }
  if (hold(m, dt)) return true;
  const t = pickTarget(w, m, m.iq || (m.iq = {}), dt);
  if (!t) { stand(m, dt); return true; }
  if (due(m, 'lance', dt, 1.5)) { again(m, 'lance', 4, 5.5); lances(w, q, t, 0.5, m); return true; }
  const d = dist(m.x, m.y, t.x, t.y);
  if (d < 260) { const a = angleTo(t.x, t.y, m.x, m.y), p = inside(w, m.x + Math.cos(a) * 120, m.y + Math.sin(a) * 120, m.r + 20); walkTo(w, m, p.x, p.y, 0.8, dt); } else stand(m, dt);
  turnTo(m, angleTo(m.x, m.y, t.x, t.y), 4, dt);
  return true;
}
function shatterImage(w, m) {
  const q = m.imageOf; if (!q || !alive(q)) return; // (images going down with her don't burst)
  puff(w, m.x, m.y, '#DDF6FF', 20, 200, 7, 0.6);
  addDanger(w, { shape: 'circle', x: m.x, y: m.y, r: WQ.image.shatter, t: 0.5, team: 'enemy', src: null, kind: 'ice', hit: { dmg: WQ.image.shDmg * q.dmgMul, chill: 30, knock: 160 },
    onFire: (w2, z) => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; w2.projectiles.push({ kind: 'icicle', x: z.x, y: z.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, r: 5, team: 'enemy', owner: q, dmg: 6 * q.dmgMul, o: { chill: 20, noDodge: true }, life: 0.6 }); } } });
}
// The blizzard (phase 4): hail falls round the heroes all the time, and the room goes white.
function hail(w, u, k, dt) {
  k.hailT = (k.hailT ?? 1) - dt;
  if (k.hailT > 0) return;
  k.hailT = WQ.hail.every * rrange(0.8, 1.2);
  const h = randomHero(w); if (!h) return;
  const a = rand() * TAU, off = rrange(0, 130), p = inside(w, h.x + (h.vx || 0) * 0.6 + Math.cos(a) * off, h.y + (h.vy || 0) * 0.6 + Math.sin(a) * off);
  addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: WQ.hail.r, t: WQ.hail.tell, team: u.team, src: null, kind: 'ice', hit: H(u, { dmg: WQ.hail.dmg, chill: WQ.hail.chill, knock: 80 }),
    onFire: (w2, z) => { puff(w2, z.x, z.y, '#EAF8FF', 8, 110, 6, 0.4); sparks(w2, z.x, z.y, rand() * TAU, 3, '#FFFFFF'); } });
}

// ---- phase turns
function enter(w, u, k, p) {
  notePhase(w, k);
  u.invulnT = WQ.nova.tell + 0.6;
  nova(w, u, u.x, u.y, () => away(w, u));
  if (p === 2) again(u, 'wall', 0.4);
  if (p === 3) again(u, 'images', 0.2);
  if (p === 4) { w.blizzard = 0.01; again(u, 'wall', 2); }
}
function death(w, u) {
  courtFalls(w); w.blizzard = 0;
  for (const r of w.walls) if (r.kind === 'ice' && r.temp != null) r.temp = Math.min(r.temp, 0.1 + rand() * 0.4); // her walls melt with her
  deathBurst(w, u, ['#DDF6FF', '#9FDDF6', '#FFFFFF']);
}

// ---- the glacier hall: a wide frozen hall, four ice pillars, her dais of ice at the far end
function glacier(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 210, y: Hh / 2 };
  for (const [fx, fy] of [[0.38, 0.24], [0.38, 0.76], [0.66, 0.2], [0.66, 0.8]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 36, ice: true });
  w.arenaDecor = [[0.2, 0.3, 'crack'], [0.2, 0.7, 'crack'], [0.5, 0.5, 'crack'], [0.8, 0.35, 'rubble'], [0.8, 0.65, 'rubble']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.3, v: 0 }));
  w.dais = { x: W - 210, y: Hh / 2 };
  w.arenaDraw = (ctx, w2) => drawGlacier(ctx, w2);
  w.arenaAir = (ctx, w2) => { if (w2.blizzard) { w2.blizzard = Math.min(1, w2.blizzard + (w2._dt || 0.016) * 0.5); drawBlizzard(ctx, w2); } };
}

const ART = variantUrl('art/heroes/frost.svg', { hue: 12, sat: 0.55, light: 0.16 });
export const QUEEN = {
  defs: {
    winterQueen: { team: 'enemy', name: 'The Winter Queen', art: ART, headR: 54, r: 44, vr: 34, turn: 3.6, accel: 200, face: 3.6, mass: 5, hp: 2600, speed: 50, role: 'ranged', range: 300,
      atkCd: 999, arc: 2, temp: 0.2, commit: 1.2, xp: 180, coins: [70, 90], boss: true, arena: 'glacier', attackAnim: 'cast',
      res: { chill: 0, wet: 0.5, burn: 1.3, stagger: 0.6 }, brain, onDeath: death },
    // her mirror image: the same look, half her lances, shatters when broken
    queenImage: { team: 'enemy', name: 'The Winter Queen', art: ART, headR: 54, r: 44, vr: 34, turn: 3.6, accel: 200, face: 3.6, mass: 3, hp: 60, speed: 50, role: 'ranged', range: 300,
      atkCd: 999, temp: 0.2, commit: 1.2, xp: 0, coins: [0, 0], noElite: true, noCorpse: true, attackAnim: 'cast', res: { chill: 0 }, brain: imageBrain, onDeath: shatterImage },
  },
  arenas: { glacier },
};
