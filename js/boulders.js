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
//     And nobody rides on its front: the designer, later in round 19, "Things that are touching the boulder almost get
//     glued to it, in front. Like if he rolls the bolder into someone it kind of holds the target in front." A push
//     straight out of a round thing leaves whoever is square in its way square in its way, step after step, so it
//     carried them along (before this lane too). A body in the way of a moving ball now slips off round its face to
//     the side it is already on (SHED), about a second for a pushed boulder, a blink for a rolling one; against a wall
//     it slips along the wall; only in a corner, with no side to go to, is it held until the ball stops or is let go;
//  4. a rolling ball stopped that way bounces off as off a wall;
//  5. the owner is kept at the rod's length from it (never inside its own boulder): a stopped boulder stops the troll.
import { circleRect } from './path.js';
import { BUILD_IDS } from './statuses.js'; // (round 19, lane troll19b: the ball's health)

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

// Shedding (see 3 above): a body square in a moving ball's way slips round its face at `k` of the ball's speed, never
// slower than `min` nor faster than `max` (room units a second); `from`..`full`: how squarely in the way it has to be
// (the cosine of its angle off the ball's line) for none of that and for all of it; a side once taken holds `hold` s.
const SHED = { k: 1.2, min: 110, max: 340, from: 0.15, full: 0.4, hold: 0.7 };
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
    // how it has moved since the last pass (its roll, its owner's push): which way is "in front" of it
    const mvx = b.x - (b.px ?? b.x), mvy = b.y - (b.py ?? b.y), mv = Math.hypot(mvx, mvy), vsp = mv / dt;
    for (let pass = 0; pass < 3; pass++) {
      ballStatics(w, b);
      let again = false;
      for (const o of w.units) {
        if (o.dead || o.downed || o.ballOf || (b.owner === o && own(o, b))) continue; // (round 19, lane troll19b: o.ballOf, a ball's health is nobody's body)
        let dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
        const m = o.r + b.r;
        if (d2 >= (m + 1) * (m + 1)) continue;
        // in the way of a moving ball: round its face and off to the side
        if (pass === 0 && vsp > 12 && !o.fixed && d2 > 1e-6) {
          const d0 = Math.sqrt(d2), nx0 = dx / d0, ny0 = dy / d0, along = (mvx * nx0 + mvy * ny0) / mv;
          if (along > SHED.from) {
            const cr = (mvx * ny0 - mvy * nx0) / mv; // which side of the ball's line it is on
            const S = o.shed && o.shed.b === b && o.shed.until > w.time ? o.shed : (o.shed = { b, side: Math.abs(cr) > 0.05 ? Math.sign(cr) : (o.id | 0) % 2 ? 1 : -1, until: 0 });
            S.until = w.time + SHED.hold;
            const heavy = M / (M + (o.mass || 1)), slip = Math.min(SHED.max, Math.max(SHED.min, vsp * SHED.k)) * Math.min(1, (along - SHED.from) / (SHED.full - SHED.from)) * heavy * dt;
            const sx = o.x, sy = o.y;
            o.x += -ny0 * S.side * slip; o.y += nx0 * S.side * slip;
            // (a wall or a rock on that side: back, and the other way round next)
            if (outOfSolids(w, o, (p) => p === b || (p.owner === o && isBall(p) && own(o, p))) && Math.hypot(o.x - sx, o.y - sy) < slip * 0.5) { if (inWalls(w, o)) { o.x = sx; o.y = sy; } S.side = -S.side; }
            dx = o.x - b.x; dy = o.y - b.y; d2 = dx * dx + dy * dy;
          }
        }
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
      // (b.onBlocked: it strikes whoever stopped it first, as it would have a step later had it rolled on: a boulder
      // let go point blank at a hero with his back to a wall)
      if (back > step * 0.6 && back > 0.5) { if (b.onBlocked) b.onBlocked(w, b, sp); b.vx *= -0.25; b.vy *= -0.25; if (b.hits && b.hits.clear) b.hits.clear(); b.stopped = w.time; }
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
    b.px = b.x; b.py = b.y;
    b.mvx = b.x - x0; b.mvy = b.y - y0; // how it moved this step (the rod, the room and the bodies; not its own roll)
    bodySync(w, b, dt); // (round 19, lane troll19b: its health, below)
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

// ---------------------------------------------------------------- a ball's health (round 19, lane troll19b)
// The designer: "Boulder should have hp and can be destroyed and targeted."
// A ball with health has a body: a unit of its owner's side (b.body; its kind is foes9.js boulderBody or foes10.js
// snowBody) that sits on the ball, is the ball's size, and carries the ball's health. Being a unit, everything that
// can hurt a unit hurts the ball: a swing, a shot (the ball stops the shot and passes it on: b.onShot), a blast, an
// ability, and it shows a health bar like any other foe once it is hurt (hpstyle.js, so the Health bars switch and
// the picked style hold for it). It is nobody's body otherwise: it pushes nobody and nobody pushes it (def.pass; the
// ball itself is the solid thing, above), it draws nothing (def.draw), takes no status and no shove, can't be
// charmed, dragged or swallowed (def.part), leaves nothing when it goes, and is gone with the ball or its owner.
// Who goes for it: sim.js chooseTarget leaves a ball out of the usual pick and asks ballTarget below.
const BODY_HOOK = {
  knockImmune: true, immune: [...BUILD_IDS],
  // out of health: no death of a unit (no body, no loot, no kill counted): the ball breaks (b.onBreak, next ballPass)
  downed(w, me) { me.dead = true; me.hp = 0; if (me.ballOf && me.ballOf.broken == null) me.ballOf.broken = w.time; return true; },
};
export function giveBody(w, b, spawn, kind, hp) {
  const u = b.owner, s = spawn(w, kind, b.x, b.y, { team: u.team });
  s.maxHp = s.hp = Math.max(1, Math.round(hp)); s.r = s.vr = b.r; s.ballOf = b; s.summon = true; s.minion = true; s.aggro = true; s.adopt = false; s.hexSeen = true;
  s.shadowK = 0; s.bkey = u.bkey; s.trinketHooks = [BODY_HOOK]; s.armor = 0; s.facing = 0;
  b.body = s; b.hp = s.hp; b.maxHp = s.maxHp; b.broken = null;
  return s;
}
export function retireBody(b) { if (b.body) { b.body.dead = true; b.body.ballOf = null; b.body = null; } }
function bodySync(w, b, dt) {
  if (b.hitT > 0) b.hitT = Math.max(0, b.hitT - dt);
  const s = b.body;
  if (s) {
    const u = b.owner;
    if (!u || u.dead || s.dead) { if (!s.dead) retireBody(b); else b.body = null; } // (nobody's ball is nobody's target: a dead yeti's ball rolls on and melts)
    else {
      s.x = b.x; s.y = b.y; s.r = s.vr = b.r; s.vx = s.vy = s.kx = s.ky = s.dvx = s.dvy = 0; s.spd = 0; s.team = u.team;
      if (s.hitT > 0.1 && !(b.hitT > 0.06)) b.hitT = 0.12; // (struck: the ball flashes, boulder-roll.js)
      b.hp = s.hp; b.maxHp = s.maxHp; // (for the drawing: its cracks)
    }
  }
  if (b.broken != null && b.onBreak) { const f = b.onBreak; b.onBreak = null; f(w, b); }
}
// Who goes for a ball (sim.js chooseTarget, once it has picked the foe `t` a unit would go for): the ball that stands
// between the two, if it is near enough to be worth breaking through: a fighter when the ball is within a few steps
// and his foe is out of his reach behind it; a shooter when the ball is in its owner's hands on his line of fire, in
// range. Anything else in the fight comes first, and a ball lying loose off to one side is left alone. (Swings, blasts
// and shots that catch it on their way hurt it whoever they were meant for.)
export function ballTarget(w, u, t) {
  if (!t || t.ballOf) return null;
  const ranged = u.def.role === 'ranged', dx = t.x - u.x, dy = t.y - u.y, L2 = dx * dx + dy * dy;
  if (L2 < 1) return null;
  const reach = u.def.range || 20;
  if (!ranged && Math.sqrt(L2) - u.r - t.r <= reach + 6) return null; // (his foe is in reach: the foe)
  let best = null, bd = Infinity;
  for (const p of w.pillars) {
    const s = p.body; if (!s || s.dead || s.team === u.team || p.packing) continue;
    if (ranged && !p.held) continue;
    const k = ((p.x - u.x) * dx + (p.y - u.y) * dy) / L2; if (k <= 0 || k >= 1) continue;
    const off = Math.hypot(u.x + dx * k - p.x, u.y + dy * k - p.y);
    if (off > p.r + (ranged ? 2 : u.r * 0.7)) continue;
    const gap = Math.hypot(p.x - u.x, p.y - u.y) - p.r - u.r;
    if (gap > (ranged ? reach - p.r : reach + 70)) continue;
    if (gap < bd) { bd = gap; best = s; }
  }
  return best;
}
