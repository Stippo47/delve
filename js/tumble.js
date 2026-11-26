// The tumble troll (round 19, lane rider19). The designer: "It would be fun if you made a troll variant that can walk on
// the boulders like the farmer on hay." (the Haymaker's Hay Bale, kits2.js BRAINS.haybale: he stands on a rolling bale
// that turns slowly at the enemies and runs down whoever it meets).
//
// A lean troll that stands up on its boulder and walks it along, the way a log-roller walks a log: its feet work the top
// of the ball, the ball rolls under it, and it steers by where it puts its weight. The boulder is a troll's boulder in
// every way (foes9.js boulderOf: a solid body, js/boulders.js; health that anything can hurt, a health bar, cracks; the
// rolling texture and dirt trail, boulder-roll.js; the heavy blow, foes9.js boulderHits): nothing of it is copied here.
//
//  Riding     It rolls at its mark the way the bale does, but faster and with more weight behind it: it speeds up on a
//             straight line (RIDE.top) and turns at RIDE.turn a second at full speed, quicker as it slows (the ball has
//             to be talked round: its feet step sideways on the top, and its arms swing out the other way). Off its
//             line by more than RIDE.brakeAt it leans back and brakes, so a hero it has rolled past is come back for in
//             a wide, quick arc: it makes passes through the party, jousting, instead of standing in it.
//  Heroes     Whoever the ball reaches is struck by it as by a bowled boulder (boulderHits: thrown on down its way by
//             their weight, off their feet a moment, the dust and the boom). The rider stays up: it is nobody's to
//             shove while it is on the ball (it stands above the fight: hovering, js/height.js, so bodies never push it;
//             blows still reach it). Each body it strikes takes some of the ball's speed (BOWL.keep); the same body
//             is struck again only after RIDE.again seconds.
//  Walls      Grazing a wall it rolls along it. Head on at speed (RIDE.crash) the ball stops dead with a crack and a
//             bounce, takes a chip out of itself (RIDE.chip of its health), and the troll teeters for RIDE.teeter
//             seconds, arms windmilling: it can't steer and the ball lies still under it, the party's moment. Then it
//             walks the ball off the wall and goes again. A body stopping the ball (a hero with his back to a wall:
//             boulders.js) stops it too, for less.
//  Broken     When the ball's health runs out (or a wall wedges it for good) it bursts under the troll's feet: the
//             troll is thrown off forwards, lands in a heap (stunned RIDE.down s), and fights on foot with its long arms,
//             quick and scrappy (its def: faster than a troll and lighter). It never gets a new ball: as the troll's,
//             a broken boulder stays broken.
//  Hop off    Never by choice: the ball is the whole of it. (Stunned, frozen or asleep, it stands where it is and the ball
//             rolls on under it and slows; terrified, it freezes up there.)
//  Health     The troll itself 115 (a troll 155), the ball 80 (RIDE.ballHp of the troll's: a troll's boulder is a quarter
//             of its own). Shots at the troll strike the ball first (it stands on it), so archers break the ball; a
//             fighter at the ball's side can reach the troll over it. tools/rider19/winrate.mjs keeps it fair.
import { alive, opponents, hurt, puff, setAnim, stun, spawn } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange } from './util.js';
import { lineClear } from './path.js';
import { ballSweep, ballFits } from './boulders.js';
import { boulderOf, breakBoulder, boulderWay, boulderHits, dropBoulder } from './foes9.js';
import { ELITES } from './elites.js';
import { ART2 } from './looks2.js';

// top       full rolling pace (room units a second; a troll walks 46, the Haymaker's bale 60, a bowled boulder leaves at 400)
// acc/brake how quickly it gets up to pace, and slows when it leans back
// turn      how fast it can bring the ball round at full pace (rad/s); turnSlow at a stand
// brakeAt   off its line by this much (rad), it leans back and slows to turn: at brakeAt + brakeSpan it is down to `low`
// hit       the ball's blow: full = the pace its knock is reckoned against (a bowled boulder's is 400), dmg, stagger;
//           min = the least pace that hurts; side = how far off its way they are thrown (rad; a bowled boulder's 0.33,
//           the bale's 0.9): out of its lane, so it rolls on through
// again     seconds before the same body is struck again; through: seconds it rolls straight on after striking somebody;
//           out: bogged down among them, seconds it rolls away for a run-up
// crash     into a wall faster than this (its pace square to the wall): the ball stops dead and it teeters for `teeter` s; chip: of the ball's health
// hop       how high the troll stands (room units; the Haymaker on his bale: 30), bob: up and down with each step
// stride    the ball's roll (room units) for one step of each foot
// ballHp    the ball's health, of the troll's own (ballHpElite: an elite's or a major's: they fell behind the troll's in
//           tools/rider19/winrate.mjs); down: stunned this long after falling off
export const RIDE = { top: 205, acc: 260, brake: 240, turn: 1.55, turnSlow: 4.2, brakeAt: 0.55, brakeSpan: 1.0, low: 0.28,
  hit: { full: 230, dmg: 9, stagger: 30, min: 95, side: 0.95 }, again: 0.9, crash: 80, teeter: 0.9, chip: 0.1, blocked: 0.45,
  hop: 24, bob: 2.5, stride: 44, through: 0.7, out: 0.9, ballHp: 0.7, ballHpElite: 0.95, down: 0.8, lead: 0.35, jam: 2.2 };
if (globalThis.RIDE19) Object.assign(RIDE, globalThis.RIDE19); // (for the tools: a test's own numbers)

// The ball under it, made the first time it thinks: a troll's boulder (foes9.js boulderOf) that is ridden, not held.
function ballOf(w, u) {
  if (u.bould === null) return null;
  const fresh = u.bould === undefined, b = boulderOf(w, u);
  if (fresh && b) {
    b.held = false; b.pull = false; b.grip = 0; b.rider = u; b.vx = b.vy = 0;
    ballSweep(w, b, u.x, u.y); // (boulderOf put it in front of its fists: it goes under the troll's feet)
    if (b.body) { b.body.maxHp = b.body.hp = Math.max(1, Math.round(u.maxHp * (u.elite ? RIDE.ballHpElite : RIDE.ballHp))); b.hp = b.maxHp = b.body.maxHp; }
    b.rollTick = (w2, dt2) => roll(w2, u, b, dt2, false); // (stunned, frozen, asleep: the ball rolls on and slows; boulders.js)
    b.onBlocked = (w2, b2, sp) => { boulderHits(w2, u, b2, sp, Math.atan2(b2.vy, b2.vx), RIDE.hit); const R = rideOf(u); R.sp = 0; R.teeter = Math.max(R.teeter, RIDE.blocked); }; // (a body that couldn't give way: boulders.js)
    b.onBreak = (w2, b2) => { breakBoulder(w2, u, b2); fallOff(w2, u, b2); };
    b.afterPass = (w2, b2) => { if (u.bould === b2 && alive(u)) seat(u, b2); };
    const R = rideOf(u); R.head = u.facing; R.sp = 0;
  }
  return b;
}
const rideOf = (u) => u.ride || (u.ride = { head: u.facing || 0, sp: 0, teeter: 0, dist: 0, hitAt: new Map(), jam: { x: u.x, y: u.y, t: 0 }, spin: 0, lean: 0 });

// The troll stood on top of the ball: a little behind its middle (so the round of the ball shows ahead of its feet), up
// off the floor (render.js lifts it and draws it a little bigger), facing the way it rolls; nothing shoves it up there.
function seat(u, b) {
  const R = rideOf(u), c = Math.cos(R.head), s = Math.sin(R.head);
  u.x = b.x - c * 6; u.y = b.y - s * 6;
  u.vx = u.vy = u.kx = u.ky = u.dvx = u.dvy = 0; u.spd = 0; u.mvA = R.head;
  u.facing = R.head; u.wasX = u.x; u.wasY = u.y;
  u.hop = RIDE.hop + RIDE.bob * Math.abs(Math.sin(R.dist / RIDE.stride * Math.PI)) + (R.teeter > 0 ? 2 * Math.sin(R.teeter * 30) : 0);
}

// One step of the ball's roll along R.head at R.sp: walls slide it, head on it crashes; whoever it reaches is struck.
function roll(w, u, b, dt, steering) {
  const R = rideOf(u);
  if (!steering) R.sp = Math.max(0, R.sp - 160 * dt); // (nobody walking it: it slows)
  b.rolledAt = w.time;
  if (b.stopped != null && b.stopped !== R.seenStop) { R.seenStop = b.stopped; R.sp = 0; } // (stopped by a body: boulders.js)
  const sp = R.sp, c = Math.cos(R.head), s = Math.sin(R.head);
  if (sp < 2) { b.vx = b.vy = 0; return; }
  const nx = b.x + c * sp * dt, ny = b.y + s * sp * dt, step = sp * dt;
  if (!ballFits(w, b, nx, ny)) {
    const x0 = b.x, y0 = b.y;
    ballSweep(w, b, nx, ny);
    const mx = b.x - x0, my = b.y - y0, along = (mx * c + my * s), ml0 = Math.hypot(mx, my);
    // how hard it went into it: its pace across the way it was turned (all of it head on; little of it grazing)
    const into = ml0 > 0.3 ? sp * Math.abs(mx * s - my * c) / ml0 : sp;
    if (along < step * 0.5 || into > RIDE.crash) { // head on, or near enough
      b.x = x0; b.y = y0;
      if (into > RIDE.crash) crash(w, u, b, sp);
      else { R.sp = sp * 0.3; R.head = wrapAngle(R.head + Math.PI * (0.5 + rand() * 0.3) * (rand() < 0.5 ? 1 : -1)); } // (slow: it just turns off it)
      b.vx = b.vy = 0; return;
    }
    const ml = Math.hypot(mx, my) || 1; R.head = Math.atan2(my, mx); R.sp = sp * clamp(along / step, 0.5, 1); // (along the wall, the slower for it)
    R.dist += ml;
  } else { b.x = nx; b.y = ny; R.dist += step; }
  b.vx = Math.cos(R.head) * R.sp; b.vy = Math.sin(R.head) * R.sp;
  boulderHits(w, u, b, R.sp, R.head, RIDE.hit);
  R.sp = Math.min(R.sp, Math.hypot(b.vx, b.vy)); // (each body it struck took some of its speed: BOWL.keep)
  // the same body struck again only after a while
  for (const h of b.hits) if (!R.hitAt.has(h)) { R.hitAt.set(h, w.time); if (steering) R.through = w.time + RIDE.through; } // (it has run somebody down: it rolls on through before it comes round)
  for (const [h, t] of R.hitAt) if (w.time - t > RIDE.again || !b.hits.has(h)) { b.hits.delete(h); R.hitAt.delete(h); }
}

// Head on into a wall at speed: a crack, a bounce, a chip off the ball, and the troll teetering on top.
function crash(w, u, b, sp) {
  const R = rideOf(u), c = Math.cos(R.head), s = Math.sin(R.head);
  R.sp = 0; R.teeter = RIDE.teeter; R.spin = rand() < 0.5 ? 1 : -1;
  ballSweep(w, b, b.x - c * Math.min(14, sp * 0.06), b.y - s * Math.min(14, sp * 0.06)); // (a small bounce back off it)
  const fx0 = b.x + c * b.r, fy0 = b.y + s * b.r;
  puff(w, fx0, fy0, '#CDBFA6', 12, 150, 6, 0.45); w.shake = Math.max(w.shake, 5);
  w.telegraphs.push({ type: 'blast', thud: true, x: fx0, y: fy0, r: 34, t: 0.25, max: 0.25, color: '#D8CCB0' }); // (the boom: audio.js)
  for (let i = 0; i < 6; i++) { const q = R.head + Math.PI + rrange(-1.1, 1.1), v = rrange(120, 260); w.particles.push({ x: fx0, y: fy0, vx: Math.cos(q) * v, vy: Math.sin(q) * v, life: 0.5, max: 0.5, size: rrange(4, 7), color: i % 2 ? '#8C8270' : '#B9AE9C' }); }
  if (b.body && alive(b.body)) hurt(w, b.body, b.body.maxHp * RIDE.chip * clamp(sp / RIDE.top, 0.5, 1.2), null, { knock: 0 });
}

// The ball gone under it: thrown off forwards, down in a heap a moment, then on foot.
function fallOff(w, u, b) {
  const R = rideOf(u);
  u.bould = null; u.ride = null; u.offAt = w.time;
  if (!alive(u)) return;
  u.hop = 0; u.bPose = false; // (breakBoulder's: the troll's wind-up pose; this one has none)
  const a = R.head, v = 120 + R.sp * 0.8; u.kx += Math.cos(a) * v; u.ky += Math.sin(a) * v;
  stun(w, u, RIDE.down); setAnim(u, 'ability', RIDE.down);
  puff(w, u.x, u.y, '#B9AE9C', 10, 120, 6, 0.5);
}

// Who it rolls at: the one it is after, unless another is a good deal nearer.
function pick(w, u) {
  let best = null, bd = Infinity;
  for (const h of opponents(w, u)) { if (h.ballOf) continue; const d = dist(u.x, u.y, h.x, h.y) * (h === u.target ? 0.7 : 1); if (d < bd) { bd = d; best = h; } }
  return (u.target = best);
}

export function tumbleBrain(w, u, dt) {
  const b = ballOf(w, u);
  if (!b) return false; // on foot: the plain brain (its long arms)
  if (b.wedged > 0.5) { b.onBreak = null; breakBoulder(w, u, b); fallOff(w, u, b); return true; } // (wedged in a slot too narrow for it: it gives)
  const R = rideOf(u);
  u.carryAt = w.time; // (sim.js: no walking of its own this tick)
  if (R.teeter > 0) { R.teeter -= dt; R.sp = 0; roll(w, u, b, dt, true); seat(u, b); return true; }
  const t = u.aggro ? pick(w, u) : null;
  const top = RIDE.top * (u.moveMul || 1) * (u.elite ? 1.08 : 1);
  let want = 0;
  // bogged down among them (slow, somebody at the ball): it rolls out for room and a run-up, then comes round again
  if (t && !(R.out > w.time) && !(R.through > w.time) && R.sp < top * 0.45 && w.time - (R.outEnd || -9) > 1.2) {
    let n = 0, cx = 0, cy = 0; for (const h of opponents(w, u)) if (!h.ballOf && dist(h.x, h.y, b.x, b.y) < b.r + h.r + 50) { n++; cx += h.x; cy += h.y; }
    if (n) { R.out = w.time + RIDE.out; R.outEnd = R.out; R.outA = angleTo(cx / n, cy / n, b.x, b.y); }
  }
  if (t && R.through > w.time) { R.turnV = 0; want = top; } // (rolling on through whoever it just struck: no turning yet)
  else if (t) {
    const away = R.out > w.time, lx = away ? b.x + Math.cos(R.outA) * 300 : t.x + (t.vx || 0) * RIDE.lead, ly = away ? b.y + Math.sin(R.outA) * 300 : t.y + (t.vy || 0) * RIDE.lead;
    const A = lineClear(w, b.x, b.y, lx, ly, b.r * 0.8) || away ? angleTo(b.x, b.y, lx, ly) : boulderWay(w, u, b, t.x, t.y);
    const err = wrapAngle(A - R.head), ae = Math.abs(err), k = clamp(R.sp / top, 0, 1);
    const rate = (RIDE.turn + (RIDE.turnSlow - RIDE.turn) * (1 - k)) * (u.elite ? 1.15 : 1);
    const turn = clamp(err, -rate * dt, rate * dt); R.head = wrapAngle(R.head + turn); R.turnV = turn / Math.max(dt, 1e-4);
    want = top * clamp(1 - (ae - RIDE.brakeAt) / RIDE.brakeSpan * (1 - RIDE.low), RIDE.low, 1);
  } else R.turnV = 0;
  R.sp = R.sp < want ? Math.min(want, R.sp + RIDE.acc * dt) : Math.max(want, R.sp - RIDE.brake * dt);
  // getting nowhere (a corner it can't turn out of, friends packed round it): it walks the ball off another way
  const J = R.jam;
  if (dist(b.x, b.y, J.x, J.y) > 50) { J.x = b.x; J.y = b.y; J.t = 0; } else if (t && (J.t += dt) > RIDE.jam) { J.t = 0; R.head = wrapAngle(R.head + Math.PI * rrange(0.6, 1.0) * (rand() < 0.5 ? 1 : -1)); R.sp = top * 0.4; }
  roll(w, u, b, dt, true);
  seat(u, b);
  return true;
}

// ---------------------------------------------------------------- how it moves on top (drawn: render.js drawPartsUnit)
// Its feet walk the top of the ball: one comes forward as the other pushes back, a step every RIDE.stride the ball rolls,
// so they work faster the faster it goes; stood still, they shuffle. Its arms are out wide, rocking for balance and swung
// out the other way into a turn; teetering after a crash they windmill. The braid swings behind. On foot, plain steps.
const sn = Math.sin, FALL = 0.35;
ART2.tumbleTroll = {
  pose(u, w, pose) {
    const R = u.ride, T = w.time;
    if (!R || !u.bould) { // on foot: its feet step under it as it walks
      const k = clamp(u.spd / 40, 0, 1), ph = u.bob * 1.6;
      pose['foot-l'] = { dy: 14 * k * sn(ph) }; pose['foot-r'] = { dy: -14 * k * sn(ph) };
      pose['top-braid'] = { r: 0.25 * k * sn(ph * 0.5) };
      const q = 1 - clamp((T - (u.offAt ?? -9)) / FALL, 0, 1); // (thrown off: arms flung up as it drops)
      if (q > 0) { pose['arm-l'] = { r: 1.1 * q }; pose['arm-r'] = { r: -1.1 * q }; }
      return;
    }
    const ph = R.dist / RIDE.stride * Math.PI, mv = clamp(R.sp / 60, 0, 1);
    const shuffle = (1 - mv) * 5 * sn(T * 5 + u.id);
    pose['foot-l'] = { dy: 28 * mv * sn(ph) + shuffle, dx: -3 * mv * Math.max(0, -sn(ph)) };
    pose['foot-r'] = { dy: -28 * mv * sn(ph) - shuffle, dx: 3 * mv * Math.max(0, sn(ph)) };
    const turn = clamp((R.turnV || 0) / RIDE.turn, -1, 1);
    let al = 0.12 * sn(T * 2.3 + u.id) - 0.35 * turn, ar = -0.12 * sn(T * 2.1 + u.id * 1.7) - 0.35 * turn;
    if (R.teeter > 0) { const q = clamp(R.teeter / RIDE.teeter, 0, 1), m = sn(T * 19) * 1.0 * q; al += m * (R.spin || 1); ar += m * (R.spin || 1); }
    pose['arm-l'] = { r: al, dy: 2 * sn(ph) }; pose['arm-r'] = { r: ar, dy: -2 * sn(ph) };
    pose['top-braid'] = { r: 0.3 * turn + 0.12 * sn(ph * 0.5) + (R.teeter > 0 ? 0.5 * sn(T * 13) : 0) };
  },
  // leaning into a turn, back to brake, wobbling when it teeters (in its own frame: +y its front)
  frame(ctx, u, w) {
    const R = u.ride;
    if (!R || !u.bould) { // thrown off its broken ball: it drops from the ball's top to the floor (drawn only: the sim has it down at once)
      const k = (w.time - (u.offAt ?? -9)) / FALL; if (k < 0 || k >= 1) return;
      const h = RIDE.hop * (1 - k * k) * 0.9, m = ctx.getTransform(), ux = m.c, uy = -m.a, l = Math.hypot(ux, uy) || 1; // (the screen's up, in the body's own frame)
      ctx.translate(ux / l * h * Math.sign(m.a * m.d - m.b * m.c || 1), uy / l * h * Math.sign(m.a * m.d - m.b * m.c || 1)); ctx.rotate(0.5 * k * (u.id % 2 ? 1 : -1));
      return;
    }
    const turn = clamp((R.turnV || 0) / RIDE.turn, -1, 1);
    ctx.rotate(-0.08 * turn + (R.teeter > 0 ? 0.22 * clamp(R.teeter / RIDE.teeter, 0, 1) * sn(R.teeter * 22) : 0));
  },
};

// The elite: rolls a little faster and brings the ball round quicker (tumbleBrain reads u.elite).
Object.assign(ELITES, {
  tumbleTroll: { tick() { return false; } }, // Rolls faster and turns sharper.
});

export const TUMBLE = {
  // A lean troll that rides its boulder (js/tumble.js above); on foot once the boulder is broken.
  tumbleTroll: { team: 'enemy', name: 'Tumble Troll', art: 'art/enemies/tumble-troll.svg', headR: 66, r: 30, vr: 31, turn: 3.4, accel: 240, face: 3.4, mass: 3.2, hp: 115, speed: 64,
    role: 'melee', range: 28, atkCd: 1.25, windup: 0.3, dmg: 10, knock: 160, arc: 2.2, temp: 0.3, commit: 1, xp: 30, coins: [6, 12], attackAnim: 'swing', res: { burn: 1.4 },
    brain: tumbleBrain, onDeath: (w, u) => dropBoulder(w, u) },
};
