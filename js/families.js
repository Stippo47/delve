// Round 10, lane R: the enemy families from the designer's deck notes (docs/riffle-log/2026-11-21-round9.txt, roster2):
//   "Snake enemies/ chains. Follow the leader segments, each with its own hit box."           -> chainHead / segBrain
//   "Wall mounted enemies. Stationary enemies/ turrets."                                        -> turretBrain (T.wall)
//   "Burrowing enemies (leave being trail of dug up dirt)"                                      -> burrowTick
//   "Spirits. Elemental. Support. shoot a ray to closest target granting their attacks with their element, on death
//    burst with their elemental effect. Also makes them immune from that element, Can even have healing and haste
//    spirits, and immunity spirits (reduces damage by a lot until killed)"                      -> spiritBrain
//   "Normal golem."                                                                              -> golemBrain
// plus the small habits several dungeons share (a status on every blow, wall bounces, a fuse). The kinds that use them
// live in js/foes10.js (Frost Hollow, Ember Deep, Gilded Spire), js/dunes.js and js/foundry.js.
import { alive, opponents, allies, hurt, puff, sparks, flames, addStatus, setAnim, fx, addBuff, explode, spawn, heal, kill, addDanger } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { ELITES, lob, line, around, hold, beginHold, due, again, targetOf, gapTo, stand, turnTo, later, openSpot } from './elites.js';

export const sees = (w, u, t, max) => t && dist(u.x, u.y, t.x, t.y) < max && lineClear(w, u.x, u.y, t.x, t.y, 4);
export const lead = (t, k) => ({ x: t.x + (t.vx || 0) * k, y: t.y + (t.vy || 0) * k });
export function every(w, u, dt, key, a, b, range, fn) {
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, key, dt, a)) return;
  if (!sees(w, u, t, range)) return;
  again(u, key, a, b); fn(t);
}
// A hook (the trinket kind: sim.js runs u.trinketHooks) added once.
export function ensureHook(u, h) { if (!u.trinketHooks) u.trinketHooks = []; if (!u.trinketHooks.includes(h)) u.trinketHooks.push(h); }
// def.hitSt = { chill: 20 }: every blow it lands carries that build-up (the sim's melee blow carries most statuses
// from the def, but not chill; this covers any).
export const HIT_ST = { hit(w, src, t, amt, o) { const s = src.def.hitSt; if (!s || o.dot || o.hexTurned) return; for (const k in s) addStatus(w, t, k, s[k], src); } };
// Is there floor at (x, y) for a body of radius r (inside the room, clear of walls and pillars)?
export function solidAt(w, x, y, r) {
  if (x < r || y < r || x > w.W - r || y > w.H - r) return true;
  if (w.walls.some((q) => x > q.x - r && x < q.x + q.w + r && y > q.y - r && y < q.y + q.h + r)) return true;
  return w.pillars.some((p) => dist(x, y, p.x, p.y) < p.r + r);
}
// Keeps moving at its own heading; bounces off walls (each axis on its own, so it goes off at a diagonal).
export function bounceMove(w, u, sp, dt) {
  let vx = Math.cos(u.mvA) * sp, vy = Math.sin(u.mvA) * sp;
  const look = Math.max(6, sp * dt * 2);
  if (solidAt(w, u.x + Math.sign(vx) * look, u.y, u.r * 0.9)) { vx = -vx; puff(w, u.x + Math.sign(-vx) * u.r, u.y, '#CFC6B8', 4, 60, 4, 0.3); }
  if (solidAt(w, u.x, u.y + Math.sign(vy) * look, u.r * 0.9)) { vy = -vy; puff(w, u.x, u.y + Math.sign(-vy) * u.r, '#CFC6B8', 4, 60, 4, 0.3); }
  u.mvA = Math.atan2(vy, vx); u.spd = sp; u.dvx = vx; u.dvy = vy; u.vx = vx; u.vy = vy;
}
// Touch damage to whatever it runs into, each one at most every `cd` seconds.
export function touch(w, u, dmg, o = {}, cd = 0.7) {
  const T = u.touched || (u.touched = new Map());
  for (const h of opponents(w, u)) {
    if (dist(u.x, u.y, h.x, h.y) > u.r + h.r + 2) continue;
    if ((T.get(h) || -9) > w.time - cd) continue;
    T.set(h, w.time);
    hurt(w, h, dmg * u.dmgMul, u, { knock: 160, ...o });
  }
}

// ---------------------------------------------------------------- chains (snakes, centipedes)
// The head is an ordinary unit with its own brain; on its first tick it lays out def.chain.n segments behind it
// (def.chain.seg, each a unit with its own hit circle). A blow on a segment lands on the head (sim.js hurt, u.linkTo;
// x segTaken), so the chain has one health bar; the body follows the head's path exactly; touching it hurts. When the
// head dies the body goes with it. An elite or major head brings a body its own size.
// Round 13 (lane E; the designer on the sand serpent: "Wth is that snake enemy"): each link lies along the path where
// it is (its facing is the chord across its own length, so the body bends smoothly, not link by link), and the path
// remembers where its head went under the sand: a link that reaches that stretch goes under too (hidden, untouchable)
// and comes up again where the head came up. foe-draw.js draws the chain as one body.
export function chainHead(w, u, dt) {
  if (!u.segs) layChain(w, u);
  return false;
}
function layChain(w, u) {
  const c = u.def.chain, k = u.r / u.def.r, gap = c.gap * k, a = u.facing + Math.PI;
  u.segs = []; u.trail = [{ x: u.x, y: u.y }];
  for (let d = 4; d <= (c.n + 2) * gap; d += 4) u.trail.push({ x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d });
  for (let i = 0; i < c.n; i++) {
    const s = spawn(w, c.seg, u.x + Math.cos(a) * gap * (i + 1), u.y + Math.sin(a) * gap * (i + 1), { team: u.team, mult: w.mult, scale: k * (1 - 0.35 * (i / Math.max(1, c.n - 1)) * (c.taper || 0)) });
    s.linkTo = u; s.idx = i; s.fixed = true; s.aggro = true; s.minion = true; s.facing = u.facing; s.dmgMul = u.dmgMul; s.look = u.look; s.gap = gap;
    u.segs.push(s);
  }
}
function trailPoint(tr, d) { // the point d along the head's trail (and whether that stretch is under the sand)
  for (let i = 1; i < tr.length; i++) {
    const a = tr[i - 1], b = tr[i], L = dist(a.x, a.y, b.x, b.y);
    if (d <= L) { const k = L > 0 ? d / L : 0; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, a: angleTo(b.x, b.y, a.x, a.y), under: !!(a.under && b.under) }; }
    d -= L;
  }
  const z = tr[tr.length - 1], y = tr[tr.length - 2] || z; return { x: z.x, y: z.y, a: angleTo(z.x, z.y, y.x, y.y), under: !!z.under };
}
export function segBrain(w, s, dt) {
  const h = s.linkTo;
  if (!h || !alive(h)) { kill(w, s, null); return true; }
  if (s.idx === 0) { // the first segment keeps the head's trail (it runs even while the head stands through a move)
    const tr = h.trail, f = tr[0];
    if (dist(f.x, f.y, h.x, h.y) > 3) { tr.unshift({ x: h.x, y: h.y, under: !!h.hidden }); let L = 0; for (let i = 1; i < tr.length; i++) { L += dist(tr[i - 1].x, tr[i - 1].y, tr[i].x, tr[i].y); if (L > (h.segs.length + 3) * s.gap) { tr.length = i + 1; break; } } }
    else tr[0].under = !!h.hidden;
  }
  const d = (s.idx + 1) * s.gap, p = trailPoint(h.trail, d), p0 = trailPoint(h.trail, Math.max(0, d - s.gap * 0.6)), p1 = trailPoint(h.trail, d + s.gap * 0.6);
  const a = dist(p0.x, p0.y, p1.x, p1.y) > 2 ? angleTo(p1.x, p1.y, p0.x, p0.y) : p.a; // (the chord across its length: a smooth bend)
  s.x = p.x; s.y = p.y; s.facing = a; s.mvA = a; s.dvx = s.dvy = 0; s.spd = dist(0, 0, h.vx, h.vy);
  if (p.under !== !!s.hidden) { s.hidden = p.under; s.ethereal = p.under; if (h.def.chain.dirt) puff(w, s.x, s.y, h.def.chain.dirt, 5, 70, 5, 0.4); } // going under, coming up
  if (!s.hidden) touch(w, s, s.def.touchDmg || 4, { knock: 140 });
  return true;
}
export const killChain = (w, u) => { for (const s of u.segs || []) if (alive(s)) kill(w, s, null); };

// ---------------------------------------------------------------- turrets (stationary and wall-mounted)
// def.turret = { turn: rad/s, cd, aim (how close to on target it must be to fire), range, wall (mounted on the nearest
// wall, its back against it, turning only within arc of straight out), arc, fire(w, u, t) }. It never moves; it finds its
// own target (the nearest it can see); it is slow to turn, so getting behind it (or beside a wall one) is safe.
export function turretBrain(w, u, dt) {
  const T = u.def.turret;
  if (!u.placed) { u.placed = true; u.fixed = true; if (T.wall) mountOnWall(w, u); u.baseA = u.facing; }
  u.dvx = u.dvy = 0; u.spd = 0;
  overheat(w, u, dt);
  if (hold(u, dt)) return true;
  // its own eyes: the nearest it can see (it can't walk to anything else)
  if (due(u, 'look', dt, 0.3)) {
    again(u, 'look', 0.35);
    let best = null, bd = Infinity;
    for (const h of opponents(w, u)) { const d = dist(u.x, u.y, h.x, h.y); if (d < bd && d < (T.range || 520) && lineClear(w, eyeX(u), eyeY(u), h.x, h.y, 4) && (!T.wall || angleDiff(angleTo(u.x, u.y, h.x, h.y), u.baseA) < (T.arc || 1.3) + 0.2)) { bd = d; best = h; } }
    u.target = best; if (best) u.aggro = true;
  }
  const t = targetOf(w, u);
  if (!t) return true;
  let want = angleTo(u.x, u.y, t.x, t.y);
  if (T.wall) want = u.baseA + clamp(wrapAngle(want - u.baseA), -(T.arc || 1.3), T.arc || 1.3);
  turnTo(u, want, (T.turn || 1) * (u.elite ? 1.3 : 1), dt);
  const off = angleDiff(u.facing, angleTo(u.x, u.y, t.x, t.y));
  if (off < (T.aim || 0.2) && due(u, 'fire', dt, T.cd * 0.5) && lineClear(w, eyeX(u), eyeY(u), t.x, t.y, 4)) { again(u, 'fire', T.cd * 0.85, T.cd * 1.15); T.fire(w, u, t); }
  return true;
}
// where a turret looks from: a wall one, a little out from the wall it's set in
const eyeX = (u) => u.x + (u.mounted ? Math.cos(u.baseA) * 8 : 0), eyeY = (u) => u.y + (u.mounted ? Math.sin(u.baseA) * 8 : 0);
// A stand-off that has gone on too long (w.stale): whatever can't walk in to end it burns itself out instead.
export function overheat(w, u, dt) {
  if (!w.stale || !u.aggro) return;
  hurt(w, u, u.maxHp * 0.04 * dt, null, { dot: true, color: '#FFB347' });
  if (rand() < dt * 6) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.5, y: u.y + rrange(-u.r, u.r) * 0.5, vx: 0, vy: 0, rise: 40, up: 0, life: 0.7, max: 0.7, size: 7, color: 'rgba(200,200,205,0.6)' });
}
// The nearest wall face (the room's edges, the walls inside it), within reach of where it was put, facing out into
// the room. Round 13 (lane E; the designer on the gun turret: "Turret part should be in the wall more. Circle half way
// in"): set into the wall: its middle just off the wall's face (MOUNT_OUT: far enough that sight lines from it and to
// it still clear the wall), and the part inside the wall isn't drawn (u.inWall, foe-draw.js), so the socket is in the
// wall and the barrel pokes out.
const MOUNT_OUT = 6;
function mountOnWall(w, u) {
  const cand = [], BIG = 4000;
  const face = (x, y, nx, ny, rect) => { const px = x + nx * MOUNT_OUT, py = y + ny * MOUNT_OUT; if (!solidAt(w, px + nx * (u.r + 6), py + ny * (u.r + 6), u.r * 0.5) && (!w.cells || w.cells.some((c) => px > c.x && px < c.x + c.w && py > c.y && py < c.y + c.h))) cand.push({ x: px, y: py, a: Math.atan2(ny, nx), d: dist(u.x, u.y, px, py), rect }); };
  face(0, u.y, 1, 0, { x: -BIG, y: -BIG, w: BIG, h: w.H + BIG * 2 }); face(w.W, u.y, -1, 0, { x: w.W, y: -BIG, w: BIG, h: w.H + BIG * 2 });
  face(u.x, 0, 0, 1, { x: -BIG, y: -BIG, w: w.W + BIG * 2, h: BIG }); face(u.x, w.H, 0, -1, { x: -BIG, y: w.H, w: w.W + BIG * 2, h: BIG });
  for (const r of w.walls) {
    const cx = clamp(u.x, r.x + 30, r.x + r.w - 30), cy = clamp(u.y, r.y + 30, r.y + r.h - 30);
    face(r.x, cy, -1, 0, r); face(r.x + r.w, cy, 1, 0, r); face(cx, r.y, 0, -1, r); face(cx, r.y + r.h, 0, 1, r);
  }
  const ok = cand.filter((c) => c.d < 420 && c.x > 200).sort((a, b) => a.d - b.d)[0]; // (not right by the way in)
  if (!ok) return;
  u.x = ok.x; u.y = ok.y; u.facing = ok.a; u.mounted = true; u.inWall = ok.rect;
}

// ---------------------------------------------------------------- burrowers
// Under the sand it can't be seen or hit (ethereal, hidden), moves fast and throws up a trail of dug-up earth; the
// ground shakes where it will come up (a circle fills), then it bursts out there, hitting what's close. It stays up a
// while to fight, then digs in again. A stand-off that has gone on too long (w.stale) keeps it up.
// o = { up: [min, max] seconds above, under: [min, max], near: how far from the target it comes up, hit: { dmg... },
//       r: the burst's size, dirt: colour, speed: x walk under, then(w, u) after coming up, kind: the danger zone's kind ('bone') }
export function burrowTick(w, u, dt, o) {
  const b = u.bur || (u.bur = { state: 'up', t: rrange(0.5, 1.5) });
  b.dirt = o.dirt || '#B59A6A'; // (round 13, lane E: the mound it raises is drawn in it: foe-draw.js)
  if (b.state === 'under') {
    const t = targetOf(w, u) || opponents(w, u).sort((a, c) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, c.x, c.y))[0];
    if (t && !b.at) { // pick where to come up: near the target (round 9 scarab: "Near hero"), on open floor
      const a = rand() * TAU, d = o.near ?? 70;
      const x = clamp(t.x + Math.cos(a) * (t.r + u.r + d), 40, w.W - 40), y = clamp(t.y + Math.sin(a) * (t.r + u.r + d), 40, w.H - 40);
      b.at = solidAt(w, x, y, u.r) ? (openSpot(w, t.x, t.y, t.r + u.r + 20, t.r + u.r + d + 60, u.r) || { x: t.x, y: t.y }) : { x, y };
    }
    if (!b.at && b.t < -4) b.at = { x: u.x, y: u.y }; // nobody to come up by: come up where it is
    if (b.at) {
      const d = dist(u.x, u.y, b.at.x, b.at.y), sp = u.def.speed * (o.speed || 2.2) * (u.moveMul || 1);
      if (d > 6) { const a = angleTo(u.x, u.y, b.at.x, b.at.y), st = Math.min(d, sp * dt); u.x += Math.cos(a) * st; u.y += Math.sin(a) * st; u.facing = a; }
      u.dvx = u.dvy = 0; u.vx = u.vy = 0; u.spd = 0;
      if ((b.dirtT = (b.dirtT || 0) - dt) <= 0) { b.dirtT = 0.07; w.particles.push({ x: u.x + rrange(-6, 6), y: u.y + rrange(-6, 6), vx: rrange(-10, 10), vy: rrange(-10, 10), life: rrange(1.8, 2.6), max: 2.6, size: rrange(5, 8), color: o.dirt || '#B59A6A', drag: 0.8 }); }
      if ((d <= 14 || b.t < -4) && !b.tell) { // under the spot (or it can't get there: a wall in the way): the ground shakes, then it comes up
        b.tell = true; const tl = o.tell || 0.55;
        addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: o.r || 58, t: tl, team: u.team, src: u, kind: o.kind || 'bone', spawns: true, hit: o.hit ? { ...o.hit, dmg: (o.hit.dmg || 6) * u.dmgMul } : undefined,
          onFire: () => { surface(w, u, o); } });
      }
    }
    b.t -= dt;
    return true;
  }
  // up: fighting as usual; when the time runs out (and nothing holds it), it digs back in
  if ((b.t -= dt) <= 0 && !u.act && !w.stale && u.aggro && !(u.el && u.el.holdT > 0)) {
    b.state = 'under'; b.t = rrange(...(o.under || [1.2, 2])); b.at = null; b.tell = false;
    u.ethereal = true; u.hidden = true; u.target = null;
    puff(w, u.x, u.y, o.dirt || '#B59A6A', 14, 110, 6, 0.5);
    return true;
  }
  return false;
}
function surface(w, u, o) {
  const b = u.bur; if (!alive(u)) return;
  b.state = 'up'; b.t = rrange(...(o.up || [3, 5])); b.tell = false; b.at = null;
  u.ethereal = false; u.hidden = false; u.flinchT = 0.2;
  puff(w, u.x, u.y, o.dirt || '#B59A6A', 18, 160, 7, 0.55); w.shake = Math.max(w.shake, 2);
  const t = opponents(w, u).sort((a, c) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, c.x, c.y))[0];
  if (t) { u.target = t; u.facing = angleTo(u.x, u.y, t.x, t.y); }
  if (o.then) o.then(w, u);
}

// ---------------------------------------------------------------- elemental spirits
// A ray to the closest of its side (not another spirit) that lends it the spirit's element: its blows carry that
// build-up and it can't take that status. Healing, haste and ward spirits mend, quicken, or take most of the harm off
// it (a ward: blows do 35%) for as long as the ray holds. On death it bursts with its element. Elite: two rays.
export const SPIRITS = {
  fire: { st: 'burn', n: 16, col: '#FF8A3D', burst: { burn: 40 } },
  frost: { st: 'chill', n: 14, col: '#BFEFFF', burst: { chill: 45 } },
  poison: { st: 'poison', n: 14, col: '#A6E04A', burst: { poison: 40 } },
  shock: { st: 'shock', n: 16, col: '#FFF27A', burst: { shock: 45 } },
  heal: { col: '#FFF1B0' }, haste: { col: '#DDE8FF' }, ward: { col: '#C9A7FF' },
};
const SPIRIT_HIT = { hit(w, src, t, amt, o) { const s = src.spiritSt; if (!s || s.until < w.time || o.dot || o.hexTurned) return; addStatus(w, t, s.st, s.n, src); } };
export function spiritBrain(w, u, dt) {
  const el = u.def.spirit, S = SPIRITS[el];
  u.rays = u.rays || [];
  if (due(u, 'repick', dt, 0.2)) {
    again(u, 'repick', 0.6);
    const near = allies(w, u).filter((a) => !a.def.spirit && !a.def.segment && !a.def.trap && dist(a.x, a.y, u.x, u.y) < 360 && lineClear(w, u.x, u.y, a.x, a.y, 4))
      .sort((a, b) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, b.x, b.y)).slice(0, u.elite ? 2 : 1);
    for (const r of u.rays) if (!near.includes(r.to) && r.fx) r.fx.max = r.fx.t; // let go of the ones out of reach
    u.rays = near.map((a) => u.rays.find((r) => r.to === a) || { to: a, fx: null });
    for (const r of u.rays) if (!r.fx || r.fx.t >= r.fx.max) r.fx = fx(w, { type: 'beam', kind: 'ray', col: S.col, from: u, to: r.to, x1: u.x, y1: u.y, x2: r.to.x, y2: r.to.y, max: 999 });
  }
  for (const r of u.rays) {
    const a = r.to; if (!alive(a)) continue;
    if (S.st) { addBuff(a, { id: 'spirit-' + el, dur: 0.5, immune: [S.st] }); a.spiritSt = { st: S.st, n: S.n, until: w.time + 0.5 }; ensureHook(a, SPIRIT_HIT); }
    else if (el === 'heal') { if (!w.stale && a.hp < a.maxHp) heal(w, a, a.maxHp * 0.03 * dt, u); }
    else if (el === 'haste') addBuff(a, { id: 'spirit-haste', dur: 0.5, move: 1.35, atkSpeed: 1.35 });
    else if (el === 'ward') addBuff(a, { id: 'spirit-ward', dur: 0.5, taken: 0.5 });
  }
  if (rand() < dt * 6) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.6, y: u.y + rrange(-u.r, u.r) * 0.6, vx: 0, vy: 0, rise: 30, up: 0, life: 0.6, max: 0.6, size: 3, color: S.col });
  // with nobody of its side left to tend, it fades away (a lone spirit kiting the party would hold a room open for ever)
  if (!allies(w, u).some((a) => !a.def.spirit && !a.def.segment && !a.def.trap) && u.aggro) hurt(w, u, u.maxHp * 0.06 * dt, null, { dot: true, color: S.col });
  return false;
}
export function spiritDeath(w, u) {
  const S = SPIRITS[u.def.spirit];
  for (const r of u.rays || []) if (r.fx) r.fx.max = r.fx.t;
  if (S.burst) explode(w, u.x, u.y, 90, 6 * u.dmgMul, S.burst, u, S.col);
  else { puff(w, u.x, u.y, S.col, 18, 140, 6, 0.6); fx(w, { type: 'ring', x: u.x, y: u.y, r: 90, color: S.col, max: 0.45 }); }
}

// ---------------------------------------------------------------- the golem (and the gilded golem, its variant)
// Slow, heavy, hard to shift. Every blow staggers. Now and then it stamps: a crack runs along the floor at its mark.
export function golemBrain(w, u, dt) {
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'stomp', dt, 3)) return false;
  const d = dist(u.x, u.y, t.x, t.y); if (d < 70 || d > 420 || !lineClear(w, u.x, u.y, t.x, t.y, 4)) return false;
  again(u, 'stomp', 6, 8);
  line(w, u, angleTo(u.x, u.y, t.x, t.y), Math.min(420, d + 80), { tell: 0.8, hw: 34, kind: 'bone', anim: 'ability', hit: { dmg: 13, knock: 240, stagger: 55, heavy: true },
    fire: (w2, z) => { w2.shake = Math.max(w2.shake, 5); for (let k = 0.1; k < 1; k += 0.15) puff(w2, z.x1 + (z.x2 - z.x1) * k, z.y1 + (z.y2 - z.y1) * k, u.def.dust || '#B9AE9C', 3, 90, 6, 0.5); } });
  return true;
}
Object.assign(ELITES, {
  // Golem: tears up a lump of itself and throws it.
  golem: { tick(w, u, dt) {
    const t = targetOf(w, u); if (!t || !due(u, 'rock', dt, 3)) return false;
    const d = dist(u.x, u.y, t.x, t.y); if (d < 160 || d > 460 || !lineClear(w, u.x, u.y, t.x, t.y, 4)) return false;
    again(u, 'rock', 6, 8); const p = lead(t, 0.8);
    lob(w, u, p.x, p.y, { r: 66, tell: 1.0, proj: 'bone', color: u.def.dust || '#9A9088', pr: 13, big: true, hit: { dmg: 14, knock: 280, heavy: true, stagger: 55 }, land: (w2) => { w2.shake = Math.max(w2.shake, 5); } });
    return false;
  } },
});

// ---------------------------------------------------------------- shared small habits
// A fuse: lit, it runs; when it's up, it blows (with itself). Burning sets it off at once (round 9 bomb bots: "Both
// explode when burned"). o = { r, dmg, fuse, burn }.
export function blast(w, u, o) {
  if (u.blown) return; u.blown = true;
  explode(w, u.x, u.y, o.r, o.dmg * u.dmgMul, { burn: o.burn || 18 }, null, '#FF8A3D'); // (src null: it hurts its own side too: knock one away in time and it blows up theirs)
  w.shake = Math.max(w.shake, 7);
  kill(w, u, null);
}
// A shot that falls from above where the target stands (a mortar shell, an icicle): a circle shows where it lands.
export function dropOn(w, u, x, y, o = {}) {
  addDanger(w, { shape: 'circle', x: clamp(x, 30, w.W - 30), y: clamp(y, 30, w.H - 30), r: o.r || 50, t: o.tell || 1.0, team: u.team, src: null, kind: o.kind || 'ice',
    hit: { ...(o.hit || {}), dmg: (o.hit && o.hit.dmg || 8) * u.dmgMul }, onFire: (w2, z) => { if (o.land) o.land(w2, z); } });
}
