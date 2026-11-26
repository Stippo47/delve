// The troll's boulder and the yeti's snowball as solid bodies (round 19, lane troll19).
// The designer: "Many times the boulder just pushes entities through walls and stuff as it supposedly doesnt get pushed
// back when being held."
//
// Before this, a boulder was a round obstacle like a rock (w.pillars), and the sim threw every body that overlapped an
// obstacle straight out of it, whatever stood behind that body (sim.js physics). A rock never moves, so that is right
// for a rock. A boulder in a troll's fists was set in front of the troll every step with nothing asked: it went into
// walls and rocks, and whoever it reached was thrown out of it on the far side, into the wall, through a thin one, or
// out of the room. Nothing ever pushed back on the boulder or the troll.
//
// Now a boulder or snowball (isBall) is left out of that rule and handled here, once a step, after the bodies have
// moved (sim.js physics calls ballPass):
//  1. in its owner's hands it is on a rod: b.grip is how far its middle is kept from its owner's (the troll's fists,
//     the yeti's hands). The owner walking into it pushes it along the line from the owner's middle through its own;
//     with b.pull the owner walking away drags it after (a troll's two fists hold it; a yeti's hands only push). It
//     never moves sideways by itself: to turn it the owner has to walk round it (foes9.js carry, foes10.js yetiBrain);
//  2. it is pushed out of the room's edges, walls and other round things (ballStatics), and it is moved in steps no
//     longer than a part of its radius (ballSweep), so it can't be carried through a wall or a wall's corner;
//  3. a body it overlaps is moved out of it by its share of their masses (a troll and its boulder against a paladin:
//     the paladin gives most; against a boss, the boulder), then that body is pushed out of the walls, the room's edge
//     and the rocks, and whatever is then still inside the ball, the BALL gives back: a body with its back to a wall
//     stops the ball (or slides out along the wall, if it stood off the ball's line). A ball lying loose and still is
//     as immovable as a rock, but a body is still never left in a wall for it;
//  4. a rolling ball stopped that way bounces off as off a wall;
//  5. the owner is kept at the rod's length from it (never inside its own boulder): a stopped boulder stops the troll.
import { circleRect } from './path.js';

export const isBall = (p) => !!(p.boulder || p.snowball);
// what is solid to a ball: every other round thing (a snowball keeps its old rule for the wagon road's painted rocks: foes10.js)
const solidTo = (b, p) => p !== b && !(b.snowball && p.painted);
// how heavy: a troll's boulder about a troll (6), a packed snowball about a yeti (3), more as they are bigger
export const ballMass = (b) => (b.snowball ? 2.6 * (b.r / 26) ** 2 : 5 * (b.r / 41) ** 2);

// A circle pushed out of the room's edges, the walls and the round things `skip` doesn't name. True if it was moved.
function outOfSolids(w, c, skip, iters = 3) {
  let any = false;
  for (let k = 0; k < iters; k++) {
    let hit = false;
    const R = c.r;
    if (c.x < R) { c.x = R; hit = true; } else if (c.x > w.W - R) { c.x = w.W - R; hit = true; }
    if (c.y < R) { c.y = R; hit = true; } else if (c.y > w.H - R) { c.y = w.H - R; hit = true; }
    for (const r of w.walls) {
      if (c.x < r.x - R || c.x > r.x + r.w + R || c.y < r.y - R || c.y > r.y + r.h + R) continue;
      const q = circleRect(c.x, c.y, R, r); if (!q) continue;
      c.x += q.nx * q.over; c.y += q.ny * q.over; hit = true;
    }
    for (const p of w.pillars) {
      if (skip(p)) continue;
      const dx = c.x - p.x, dy = c.y - p.y, m = R + p.r, d2 = dx * dx + dy * dy;
      if (d2 >= m * m) continue;
      const d = Math.sqrt(d2);
      if (d > 1e-4) { c.x = p.x + dx / d * m; c.y = p.y + dy / d * m; } else c.x = p.x + m;
      hit = true;
    }
    if (!hit) return any;
    any = true;
  }
  // still against something after every round (squeezed between a wall and a rock): the walls and the room's edge have
  // the last word, so it is left in a rock rather than in a wall
  const R = c.r;
  for (const r of w.walls) {
    if (c.x < r.x - R || c.x > r.x + r.w + R || c.y < r.y - R || c.y > r.y + r.h + R) continue;
    const q = circleRect(c.x, c.y, R, r); if (q) { c.x += q.nx * q.over; c.y += q.ny * q.over; }
  }
  if (c.x < R) c.x = R; else if (c.x > w.W - R) c.x = w.W - R;
  if (c.y < R) c.y = R; else if (c.y > w.H - R) c.y = w.H - R;
  return any;
}
// Is a circle (x, y, r) clear of the room's edges, the walls and the round things (other than `b`)?
export function ballFits(w, b, x, y, r = b.r) {
  if (x < r || y < r || x > w.W - r || y > w.H - r) return false;
  for (const q of w.walls) if (circleRect(x, y, r, q)) return false;
  for (const p of w.pillars) if (solidTo(b, p) && (x - p.x) ** 2 + (y - p.y) ** 2 < (r + p.r) ** 2) return false;
  return true;
}
export function ballStatics(w, b) { return outOfSolids(w, b, (p) => !solidTo(b, p)); }
// Is a circle in a wall or past the room's edge by more than a hair? (a slot too narrow for it: nothing can push it out)
function inWalls(w, c, slack = 0.75) {
  const R = c.r - slack;
  if (c.x < R || c.y < R || c.x > w.W - R || c.y > w.H - R) return true;
  for (const r of w.walls) if (c.x > r.x - R && c.x < r.x + r.w + R && c.y > r.y - R && c.y < r.y + r.h + R && circleRect(c.x, c.y, R, r)) return true;
  return false;
}
// A ball moved towards (tx, ty), sliding along whatever is solid, in steps short enough that nothing is jumped; at
// most `max` far. Returns how far it still is from there.
export function ballSweep(w, b, tx, ty, max = Infinity) {
  let left = Math.min(max, Math.hypot(tx - b.x, ty - b.y));
  const stepMax = Math.max(4, b.r * 0.35);
  for (let i = 0; i < 40 && left > 0.01; i++) {
    const d = Math.hypot(tx - b.x, ty - b.y); if (d < 0.01) break;
    const s = Math.min(stepMax, left, d);
    b.x += (tx - b.x) / d * s; b.y += (ty - b.y) / d * s; left -= s;
    if (ballStatics(w, b) && Math.hypot(tx - b.x, ty - b.y) > d - s * 0.15) break; // (against something, and no nearer for it: it stays here)
  }
  return Math.hypot(tx - b.x, ty - b.y);
}
// Is this ball its owner's to walk through (in its hands, or still rolling off out of them)? As sim.js ownBoulder.
const own = (u, b) => b.owner === u && (b.held || b.vx * b.vx + b.vy * b.vy > 10000);

// Once a step, after the bodies have moved. slam(w, u, speed): a body knocked hard into it (sim.js wallHit).
export function ballPass(w, dt, slam) {
  let balls = null;
  for (const p of w.pillars) if (isBall(p)) (balls || (balls = [])).push(p);
  if (!balls) return;
  for (const b of balls) {
    let u = b.owner && !b.owner.dead && !b.owner.downed && b.held ? b.owner : null;
    // terrified, or thrown up in the air: it has let go
    if (u && b.pull && (u.fearT > 0 || (u.hop || 0) > 10 || u.flyT > 0)) { b.held = false; u = null; }
    const x0 = b.x, y0 = b.y;
    // rolling loose while its owner's brain is not running (stunned, frozen, asleep): it rolls on
    if (!u && b.rollTick && b.rolledAt !== w.time && b.owner && !b.owner.dead && (b.vx || b.vy)) b.rollTick(w, dt);
    // 1. the rod
    if (u && b.grip > 0) {
      const dx = b.x - u.x, dy = b.y - u.y, d = Math.hypot(dx, dy);
      const nx = d > 1e-3 ? dx / d : Math.cos(u.facing), ny = d > 1e-3 ? dy / d : Math.sin(u.facing);
      if (d < b.grip - 0.01 || (b.pull && d > b.grip + 0.01)) {
        const before = d;
        ballSweep(w, b, u.x + nx * b.grip, u.y + ny * b.grip, Math.max(8, 1100 * dt));
        if (before < b.grip && b.onPush) b.onPush(w, b, nx, ny, u);
      }
    }
    // 2 and 3. the room, and the bodies in it (a few rounds: a body it shares a push with can leave it in a wall again)
    const sp2 = b.vx * b.vx + b.vy * b.vy;
    const still = !u && sp2 < 1 && !b.packing; // lying loose and still: a rock to everybody but its owner, who can shoulder it along
    // (in its owner's hands the two push as one; rolling, it has its speed behind it)
    const M = u ? ballMass(b) + (u.mass || 1) : ballMass(b) * (1 + Math.sqrt(sp2) / 120);
    let bx = 0, by = 0;
    for (let pass = 0; pass < 3; pass++) {
      ballStatics(w, b);
      let again = false;
      for (const o of w.units) {
        if (o.dead || o.downed || (b.owner === o && own(o, b))) continue;
        const dx = o.x - b.x, dy = o.y - b.y, m = o.r + b.r, d2 = dx * dx + dy * dy;
        if (d2 >= m * m) continue;
        const d = Math.sqrt(d2), nx = d > 1e-4 ? dx / d : 1, ny = d > 1e-4 ? dy / d : 0, over = m - d;
        const fixedBall = still && b.owner !== o;
        if (o.fixed) { if (!fixedBall) { b.x -= nx * over; b.y -= ny * over; bx -= nx * over; by -= ny * over; again = true; } continue; }
        const share = fixedBall ? 1 : M / (M + (o.mass || 1)), ox = o.x, oy = o.y;
        o.x += nx * over * share; o.y += ny * over * share;
        if (share < 1) { b.x -= nx * over * (1 - share); b.y -= ny * over * (1 - share); bx -= nx * over * (1 - share); by -= ny * over * (1 - share); again = true; }
        // the body against the room: what it can't give, the ball gives back
        if (outOfSolids(w, o, (p) => p === b || (p.owner === o && isBall(p) && own(o, p)))) {
          if (inWalls(w, o)) { o.x = ox; o.y = oy; } // (pushed into a slot too narrow for it: it stays where it was, and the ball gives all of it)
          const ex = o.x - b.x, ey = o.y - b.y, e = Math.hypot(ex, ey), rem = m - e;
          // (a ball lying still gives too, for this: it is a rock to walk into, not one to be crushed against a wall by)
          if (rem > 0.01) { const qx = e > 1e-4 ? ex / e : nx, qy = e > 1e-4 ? ey / e : ny; b.x -= qx * rem; b.y -= qy * rem; bx -= qx * rem; by -= qy * rem; again = true; }
        }
        // knocked into it: as into a rock
        const into = -(o.kx * nx + o.ky * ny);
        if (into > 0 && pass === 0) { if (slam) slam(w, o, into); o.kx += nx * into * 1.25; o.ky += ny * into * 1.25; }
      }
      if (!again) break;
    }
    ballStatics(w, b);
    // 4. rolling, and stopped by somebody who couldn't get out of its way: it bounces off as off a wall
    if (!u && sp2 > 400) {
      const sp = Math.sqrt(sp2), step = sp * dt, back = -(bx * b.vx + by * b.vy) / sp;
      if (back > step * 0.6 && back > 0.5) { b.vx *= -0.25; b.vy *= -0.25; if (b.hits && b.hits.clear) b.hits.clear(); b.stopped = w.time; }
    }
    // 5. its owner: never nearer than the rod's length. With its back to a wall it can't give way: then the ball gives
    // (out of it again), and where neither can, b.squeeze says by how much the rod is too long for the room there is
    b.squeeze = 0;
    if (u && b.grip > 0) {
      const dx = u.x - b.x, dy = u.y - b.y, d = Math.hypot(dx, dy);
      if (d < b.grip - 0.01) {
        const nx = d > 1e-3 ? dx / d : -Math.cos(u.facing), ny = d > 1e-3 ? dy / d : -Math.sin(u.facing);
        u.x = b.x + nx * b.grip; u.y = b.y + ny * b.grip;
        if (outOfSolids(w, u, (p) => isBall(p) && p.owner === u)) {
          const ex = b.x - u.x, ey = b.y - u.y, e = Math.hypot(ex, ey), rem = b.grip - e;
          if (rem > 0.01) { const qx = e > 1e-3 ? ex / e : -nx, qy = e > 1e-3 ? ey / e : -ny; b.x += qx * rem; b.y += qy * rem; ballStatics(w, b); b.squeeze = Math.max(0, b.grip - Math.hypot(b.x - u.x, b.y - u.y)); }
        }
      }
    }
    // pushed into a slot too narrow for it (between a wall's end and the room's edge, between two crates): nothing can
    // push it out of both sides, and each step's shove took it further in: back to where it last fitted
    if (inWalls(w, b)) { if (b.okx != null && Math.hypot(b.okx - b.x, b.oky - b.y) < 80 && !inWalls(w, { x: b.okx, y: b.oky, r: b.r })) { b.x = b.okx; b.y = b.oky; } }
    else { b.okx = b.x; b.oky = b.y; }
    b.mvx = b.x - x0; b.mvy = b.y - y0; // how it moved this step (the rod, the room and the bodies; not its own roll)
  }
}
// A body pushed out of the walls and the room's edge once more (sim.js physics: after a rock has thrown it out of
// itself, so it is never left in a wall for a rock's sake either).
export function bodyOutOfWalls(w, u) {
  const R = u.r;
  if (u.x < R) u.x = R; else if (u.x > w.W - R) u.x = w.W - R;
  if (u.y < R) u.y = R; else if (u.y > w.H - R) u.y = w.H - R;
  for (const r of w.walls) {
    if (u.x < r.x - R || u.x > r.x + r.w + R || u.y < r.y - R || u.y > r.y + r.h + R) continue;
    const q = circleRect(u.x, u.y, R, r); if (q) { u.x += q.nx * q.over; u.y += q.ny * q.over; }
  }
}
