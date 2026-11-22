// The Great Engine: the Clockwork Foundry's boss (floor 3). Design and numbers: docs/BOSS-great-engine.md.
// Round 13, from scratch. The designer: "You know the terraria skeleton boss? Yeah do that here. Separate hands and
// head." (round 9), then "Redo from scratch. Also the should have arm segment between head and hands." (round 12).
// One machine: a furnace head on a turning cog, two jointed arms (shoulder, elbow, wrist: boss-draw.js ik2) that end
// in a hammer and a claw. The head is the boss; each hand is a unit of its own that can be broken, and welder drones
// come to forge it back. The arms are always there (k.arm): the hand units ride on their ends.
// Every move asks something different of the party (the doc's table). Art: drawn in code (js/boss-engine-fx.js).
import { alive, hurt, puff, sparks, flames, setAnim, addDanger, addBuff, spawn, kill, addStatus } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { hold, beginHold, due, again, stand, turnTo, crowd } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, farthest, lead, clipLine, part, endParts, PART, place, logOf, notePhase, inside,
  stage, bfx, liveZone, keepZone, canDrag, holdFast, TEST_MOVE } from './boss-kit.js';
import { drawEngine, drawEngineHand, drawEngineValve, drawFoundryFloor, drawEngineAir } from './boss-engine-fx.js';

export const GE = {
  arm: { l1: 104, l2: 100, side: 54, restSide: 150, restFwd: 46, reach: 470 },
  hand: { hpK: 0.11, share: 0.3, r: 34 },
  guard: [0.75, 1, 1.2],          // what the head takes with 2 / 1 / 0 hands up (a wider spread made the fight a coin toss on whether the first hand broke early)
  every: [2.6, 3.6],              // a hand move this often
  hammer: { r: 100, tell: 1.05, dmg: 71, stagger: 40, knock: 220, stuck: 1.7, stuckTaken: 1.6, lift: 130 },
  grab: { len: 560, hw: 30, tell: 0.9, speed: 1150, hold: 3.2, tick: 0.3, dmg: 8, burn: 9, gripK: 0.03, throwDmg: 40, throwKnock: 520, dazed: 1.4, hitDmg: 29 },
  swat: { r: 200, arc: 2.0, tell: 0.6, dmg: 25, knock: 440, cd: [3.5, 5] },
  vent: { r: 175, tell: 0.85, dmg: 46, burn: 25, knock: 300, cd: [5, 7] },
  whirl: { wind: 1.1, dur: 4.2, r: 286, rate: 5.4, speed: 0.9, dmg: 30, knock: 380, again: 0.8, dizzy: 1.7, dizzyTaken: 1.35, cd: [15, 18] },
  beam: { len: 900, hw: 28, tell: 1.2, sweep: 1.5, dur: 2.7, tick: 0.15, dmg: 14, burn: 9, cd: [12, 14] },
  press: { dur: 5.5, valveK: 0.075, r: 520, dmg: 109, knock: 460, burn: 30, vented: 3.2, ventedTaken: 1.5, cd: [24, 28] },
  drones: { wait: 3.5, n: 2, forge: 9, again: 9 },   // seconds of welding by one drone to forge a hand
  blast: { r: 230, tell: 0.9, dmg: 18, burn: 20, knock: 340 },
};
export const PHASE_AT = [1, 0.66, 0.34];
const WAKE = 480;
const IRON = '#B9B4AE';

function brain(w, u, dt) {
  const k = u.ge || (u.ge = make(w, u));
  steady(u); logOf(w, u, k); stage(w, 'engine', drawFoundryFloor, drawEngineAir);
  k.t += dt; u.shadowK = 0.7; // (its shadow sits under the dome and cog, not out past them)
  // the head's guard: how many hands are up
  const up = k.arm.filter((a) => a.hand && alive(a.hand)).length;
  addBuff(u, { id: 'engineGuard', dur: 0.2, taken: GE.guard[2 - up] });
  repairs(w, u, k, dt);
  const busy = armsTick(w, u, k, dt);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.1, null); steam(w, u.x, u.y, 18); w.shake = Math.max(w.shake, 6); notePhase(w, k); })) return true;
  if (TEST_MOVE && !k.tested) { k.tested = true; // ?bossmove=whirl|beam|press|break: that move first (clips, the bench)
    if (TEST_MOVE === 'break') for (const a of k.arm) if (a.hand) { a.hand.partOf = null; kill(w, a.hand, null); }
    if (TEST_MOVE === 'whirl') { k.phase = Math.max(k.phase, 2); again(u, 'whirl', 1.2); }
    if (TEST_MOVE === 'beam') { k.phase = 3; again(u, 'beam', 1.2); again(u, 'press', 30); }
    if (TEST_MOVE === 'press') { k.phase = 3; again(u, 'press', 1.2); again(u, 'beam', 30); } }
  k.heat = clamp(k.heat + (k.phase >= 3 ? dt * 0.5 : -dt), 0, 1); u.heat = k.heat;
  // smoke from its stacks: a puff now and then, thick and fast when it runs hot
  if (rand() < dt * (2.2 + 5 * k.heat + (k.whirl ? 6 : 0))) { const s = rand() < 0.5 ? -1 : 1, bx = u.x - Math.cos(u.facing) * u.r * 1.2 + Math.cos(u.facing + Math.PI / 2) * s * 27, by = u.y - Math.sin(u.facing) * u.r * 1.2 + Math.sin(u.facing + Math.PI / 2) * s * 27;
    w.particles.push({ x: bx, y: by, vx: -Math.cos(u.facing) * 26 + rrange(-10, 10), vy: -Math.sin(u.facing) * 26 + rrange(-10, 10), rise: 34, up: 0, life: 1.1, max: 1.1, size: rrange(7, 11), color: k.heat > 0.5 ? 'rgba(70,60,66,0.6)' : 'rgba(225,225,232,0.6)', drag: 0.97 }); }
  if (pressTick(w, u, k, dt)) return true;
  if (whirlTick(w, u, k, dt)) return true;
  if (beamTick(w, u, k, dt)) return true;
  if (hold(u, dt)) return true;
  if (!busy && phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const d = dist(u.x, u.y, t.x, t.y), at = angleTo(u.x, u.y, t.x, t.y), K = k.phase >= 3 ? 0.8 : k.phase >= 2 ? 0.9 : 1;
  k.look = at;
  const hs = heroesOf(w, u), free = k.arm.filter((a) => a.hand && alive(a.hand) && !a.job);
  if (!busy) {
    // the big moves, each on its own clock
    if (k.phase >= 3 && due(u, 'press', dt, 7)) { again(u, 'press', ...GE.press.cd); startPress(w, u, k); return true; }
    if (k.phase >= 3 && due(u, 'beam', dt, 2.5)) { again(u, 'beam', ...GE.beam.cd); startBeam(w, u, k, hs); return true; }
    if (k.phase >= 2 && due(u, 'whirl', dt, 3)) { again(u, 'whirl', ...GE.whirl.cd.map((x) => x * K)); startWhirl(w, u, k); return true; }
  }
  // crowded: a hand swats them off; with no hand free, the boiler vents
  const near = hs.filter((h) => dist(h.x, h.y, u.x, u.y) < 150 + h.r);
  if (near.length && due(u, 'swat', dt, 1.4)) {
    again(u, 'swat', ...GE.swat.cd.map((x) => x * K));
    const a = free.sort((p, q) => dist(p.x, p.y, near[0].x, near[0].y) - dist(q.x, q.y, near[0].x, near[0].y))[0];
    if (a) swat(w, u, k, a, angleTo(u.x, u.y, near[0].x, near[0].y));
    else if (!busy) { vent(w, u, k); return true; }
  }
  // the hands take turns: the hammer falls, the claw snatches
  if (due(u, 'hand', dt, 1.3)) {
    again(u, 'hand', ...GE.every.map((x) => x * K));
    const order = k.turn++ % 2 ? [1, 0] : [0, 1];
    for (const i of order) {
      const a = k.arm[i]; if (!a.hand || !alive(a.hand) || a.job) continue;
      if (i === 0) { const who = pickIn(w, u, hs, t, GE.arm.reach - 40); if (who) { hammer(w, u, k, a, who); break; } }
      else if (!k.arm.some((b) => b.job && b.job.type === 'grab')) { const who = hs.length > 1 ? (farthest(w, u) !== t || chance(0.5) ? farthest(w, u) : t) : t; if (who && dist(u.x, u.y, who.x, who.y) < GE.grab.len) { grab(w, u, k, a, who); break; } }
    }
  }
  // it drifts after its mark, keeping a little off, turning like a heavy thing
  if (d > 290) walkTo(w, u, t.x, t.y, 1, dt); else if (d < 170) { const p = inside(w, u.x - Math.cos(at) * 120, u.y - Math.sin(at) * 120, u.r + 30); walkTo(w, u, p.x, p.y, 0.7, dt); } else stand(u, dt);
  turnTo(u, at, 1.9, dt);
  return true;
}
function make(w, u) {
  const k = { phase: 0, t: 0, turn: 0, heat: 0, look: u.facing, arm: [0, 1].map((i) => ({ i, s: i ? 1 : -1, x: u.x, y: u.y, vx: 0, vy: 0, lift: 0, open: 0, ang: u.facing, hand: null, job: null, down: 0, forge: 0, wave: 0 })) };
  for (const a of k.arm) { const r = restOf(u, a, 0); a.x = r.x; a.y = r.y; forgeHand(w, u, k, a, true); }
  return k;
}
const pickIn = (w, u, hs, t, reach) => { const ok = hs.filter((h) => dist(h.x, h.y, u.x, u.y) < reach); return ok.includes(t) && chance(0.6) ? t : ok[Math.floor(rand() * ok.length)] || null; };
export const shoulderOf = (u, a) => { const p = u.facing + a.s * Math.PI / 2; return { x: u.x + Math.cos(p) * GE.arm.side - Math.cos(u.facing) * 8, y: u.y + Math.sin(p) * GE.arm.side - Math.sin(u.facing) * 8 }; };
function restOf(u, a, T) {
  const p = u.facing + a.s * Math.PI / 2, bob = Math.sin(T * 2.2 + a.i * 2.4) * 9, A = GE.arm;
  // a broken arm hangs back, close in; a whole one hovers out at its side, a little forward, pumping
  const side = a.hand ? A.restSide + bob : 84, fwd = a.hand ? A.restFwd + Math.cos(T * 2.2 + a.i * 2.4) * 6 : -62;
  return { x: u.x + Math.cos(p) * side + Math.cos(u.facing) * fwd, y: u.y + Math.sin(p) * side + Math.sin(u.facing) * fwd };
}
function steam(w, x, y, n = 12, sp = 200) { for (let i = 0; i < n; i++) { const a = rand() * TAU, v = rrange(60, sp); w.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rise: 30, life: 0.8, max: 0.8, size: rrange(6, 11), color: 'rgba(238,238,243,0.78)' }); } }

// ---------------------------------------------------------------- the arms
// Every tick: each arm's end goes where its job puts it, or springs back to rest; the hand unit rides on it.
// Returns true while a job that holds the whole machine still (none do: hands work while the head drifts) is on.
function armsTick(w, u, k, dt) {
  for (const a of k.arm) {
    if (a.hand && !alive(a.hand)) breakHand(w, u, k, a);
    const j = a.job;
    if (j && (j.any || a.hand)) { j.t += dt; if (j.run(dt) === false) a.job = null; }
    else {
      a.job = null;
      const r = k.pose ? k.pose(a) : restOf(u, a, k.t), st = a.hand ? 70 : 26, dm = a.hand ? 13 : 5;
      a.vx += ((r.x - a.x) * st - a.vx * dm) * dt; a.vy += ((r.y - a.y) * st - a.vy * dm) * dt;
      a.x += a.vx * dt; a.y += a.vy * dt;
      a.lift += (0 - a.lift) * Math.min(1, dt * 8); a.open += ((k.pose ? 0.2 : 0.35 + 0.25 * Math.sin(k.t * 1.3 + a.i)) - a.open) * Math.min(1, dt * 5);
      const sh = shoulderOf(u, a), want = a.hand ? u.facing + a.s * 0.25 : angleTo(sh.x, sh.y, a.x, a.y);
      a.ang = wrapAngle(a.ang + clamp(wrapAngle(want - a.ang), -6 * dt, 6 * dt));
    }
    // never further than the pistons go
    const sh = shoulderOf(u, a), dd = dist(sh.x, sh.y, a.x, a.y), max = a.job && a.job.far ? 640 : GE.arm.reach;
    if (dd > max) { a.x = sh.x + (a.x - sh.x) * max / dd; a.y = sh.y + (a.y - sh.y) * max / dd; }
    if (a.hand && alive(a.hand)) { place(a.hand, a.x, a.y, a.ang); a.hand.hop = a.lift; a.hand.open = a.open; a.hand.shadowK = 0.8; }
  }
  return false;
}
function forgeHand(w, u, k, a, quiet) {
  const h = part(w, u, a.i ? 'engineClaw' : 'engineHammer', a.x, a.y, { share: GE.hand.share, pool: true, hp: u.maxHp * GE.hand.hpK });
  h.arm = a; a.hand = h; a.down = 0; a.forge = 0; a.job = null;
  if (!quiet) { sparks(w, a.x, a.y, rand() * TAU, 10, '#FFE7A0', 1.3); puff(w, a.x, a.y, IRON, 12, 150, 7, 0.5); bfx(w, { type: 'forged', x: a.x, y: a.y, max: 0.5 }); }
}
function breakHand(w, u, k, a) {
  const h = a.hand; a.hand = null; a.job = null; a.down = GE.drones.wait; a.forge = 0; a.vx += rrange(-200, 200); a.vy += rrange(-200, 200);
  if (h && h.holding) release(w, h.holding, a, true);
  bfx(w, { type: 'handBreak', x: a.x, y: a.y, a: a.ang, claw: !!a.i, max: 0.9, seed: Math.floor(rand() * 999) });
  puff(w, a.x, a.y, '#8A94A6', 16, 220, 7, 0.6); for (let i = 0; i < 8; i++) sparks(w, a.x, a.y, rand() * TAU, 1, '#FFE7A0', 1.2);
  w.shake = Math.max(w.shake, 7);
}
// Welder drones come for a broken hand: two of them fly in from the room's edge and weld at the stump. Each second a
// drone welds is a second off the forging; shoot them down and the hand stays off until the next pair comes.
function repairs(w, u, k, dt) {
  for (const a of k.arm) {
    if (a.hand) continue;
    const mine = w.units.filter((o) => o.welds === a && alive(o));
    if (!mine.length && !w.stale) {
      if ((a.down -= dt) <= 0 && crowd(w, u.team) < 22) {
        a.down = GE.drones.again;
        for (let i = 0; i < GE.drones.n; i++) {
          const e = edgeNear(w, a.x, a.y, i), d = spawn(w, 'welderDrone', e.x, e.y, { mult: w.mult || 1, team: u.team });
          d.aggro = true; d.minion = true; d.calledBy = u; d.welds = a; d.core = u; d.slot = i ? 1 : -1; d.facing = angleTo(e.x, e.y, a.x, a.y);
        }
      }
    }
    for (const d of mine) if (d.welding) { a.forge += dt / GE.drones.forge * (k.phase >= 3 ? 1.3 : 1); }
    if (a.forge >= 1) forgeHand(w, u, k, a);
  }
}
function edgeNear(w, x, y, i) { const top = y < w.H / 2; return { x: clamp(x + (i ? 90 : -90), 60, w.W - 60), y: top ? 40 : w.H - 40 }; }
// The welder's brain: fly to the stump it mends (or, when all is whole, hang by the head) and weld.
function welderBrain(w, d, dt) {
  const u = d.core, a = d.welds;
  if (!u || !alive(u) || !a) return false;
  d.welding = false;
  const tx = a.hand ? u.x - Math.cos(u.facing) * 110 + d.slot * 50 : a.x + Math.cos(u.facing + d.slot * 1.2 + Math.PI) * 58,
    ty = a.hand ? u.y - Math.sin(u.facing) * 110 : a.y + Math.sin(u.facing + d.slot * 1.2 + Math.PI) * 58;
  const dd = dist(d.x, d.y, tx, ty);
  if (dd > 16) walkTo(w, d, tx, ty, dd > 120 ? 2.6 : 1, dt); else stand(d, dt);
  if (!a.hand) {
    turnTo(d, angleTo(d.x, d.y, a.x, a.y), 8, dt);
    if (dist(d.x, d.y, a.x, a.y) < 110) { d.welding = true; d.weldAt = { x: a.x, y: a.y }; if (rand() < dt * 9) sparks(w, a.x + rrange(-8, 8), a.y + rrange(-8, 8), rand() * TAU, 1, '#FFE7A0'); }
  } else if (a.hand && !u.ge.arm.some((b) => !b.hand)) { // nothing left to mend: it goes back up into the pipes
    if ((d.idleT = (d.idleT || 0) + dt) > 2.5) { puff(w, d.x, d.y, 'rgba(238,238,243,0.7)', 8, 80, 6, 0.4); d.partOf = null; d.noLoot = true; kill(w, d, null); }
  } else { const b = u.ge.arm.find((x) => !x.hand); if (b) d.welds = b; }
  return true;
}

// ---- Hammer Fall: the hammer rises over a hero and comes down; then it is stuck in the floor (hit it)
function hammer(w, u, k, a, t) {
  const A = GE.hammer, p0 = lead(t, 0.55), sh = shoulderOf(u, a);
  let p = inside(w, p0.x, p0.y, 50); const dd = dist(sh.x, sh.y, p.x, p.y);
  if (dd > GE.arm.reach - 10) p = { x: sh.x + (p.x - sh.x) * (GE.arm.reach - 10) / dd, y: sh.y + (p.y - sh.y) * (GE.arm.reach - 10) / dd };
  const sx = a.x, sy = a.y, tell = A.tell * (k.phase >= 3 ? 0.85 : 1);
  const z = addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: A.r, t: tell, team: u.team, src: a.hand, kind: 'bone', quiet: true, hit: H(u, { dmg: A.dmg, stagger: A.stagger, knock: A.knock, heavy: true }),
    onFire: (w2) => { bfx(w2, { type: 'slam', x: p.x, y: p.y, r: A.r, max: 0.7, seed: Math.round(p.x + p.y) }); w2.shake = Math.max(w2.shake, 9); puff(w2, p.x, p.y, '#CFC4B0', 10, 240, 7, 0.5); } });
  a.job = { type: 'hammer', t: 0, z, run() {
    const j = a.job, tt = j.t;
    if (tt < tell) { // up and over: the arm reaches out, the hammer climbs, hangs, then drops in the last tenth
      const q = clamp(tt / (tell * 0.62), 0, 1), e = q * q * (3 - 2 * q), drop = clamp((tt - (tell - 0.11)) / 0.11, 0, 1);
      a.x = sx + (p.x - sx) * e; a.y = sy + (p.y - sy) * e; a.lift = A.lift * e * (1 - drop * drop); a.open = 1 - drop;
      a.ang = angleTo(sh.x, sh.y, p.x, p.y); a.vx = a.vy = 0;
      return true;
    }
    if (tt < tell + A.stuck) { // stuck fast: the arm heaves at it
      const q = (tt - tell) / A.stuck, tug = q > 0.55 ? Math.sin((q - 0.55) * 60) * 3.5 : 0, pa = angleTo(p.x, p.y, sh.x, sh.y);
      a.x = p.x + Math.cos(pa) * tug; a.y = p.y + Math.sin(pa) * tug; a.lift = 0; a.open = 0; a.hand.stuck = true;
      addBuff(a.hand, { id: 'stuck', dur: 0.15, taken: A.stuckTaken });
      return true;
    }
    a.hand.stuck = false; a.lift = 34; a.vx = (sh.x - p.x) * 1.2; a.vy = (sh.y - p.y) * 1.2; puff(w, p.x, p.y, '#CFC4B0', 8, 120, 6, 0.4);
    return false;
  } };
}
// ---- Claw Grab: the claw aims down a line, shoots out on its pistons and snatches the first one it meets; it hauls
// them to the furnace mouth and roasts them until the party breaks its grip (blows on the claw) or it throws them.
function grab(w, u, k, a, t) {
  const G = GE.grab, sh = shoulderOf(u, a), p = lead(t, 0.25), dir = angleTo(sh.x, sh.y, p.x, p.y), e = clipLine(w, sh.x, sh.y, dir, G.len, 18, 30);
  const tell = G.tell * (k.phase >= 3 ? 0.85 : 1), sx = a.x, sy = a.y, bx = sh.x - Math.cos(dir) * 30, by = sh.y - Math.sin(dir) * 30;
  addDanger(w, { shape: 'line', x1: sh.x, y1: sh.y, x2: e.x, y2: e.y, hw: G.hw, t: tell, team: u.team, src: a.hand, kind: 'blade', quiet: true });
  const j = a.job = { type: 'grab', t: 0, far: true, st: 'aim', d: 30, who: null, grip: 0, tick: 0, run(dt) {
    const hand = a.hand;
    if (j.st === 'aim') { // drawn back beside the shoulder, fingers wide
      const q = clamp(j.t / (tell * 0.6), 0, 1), s = q * q * (3 - 2 * q);
      a.x = sx + (bx - sx) * s; a.y = sy + (by - sy) * s; a.ang = dir; a.open = 1; a.lift = 0; a.vx = a.vy = 0;
      if (j.t >= tell) { j.st = 'fly'; bfx(w, { type: 'pistonShot', x: sh.x, y: sh.y, a: dir, max: 0.3 }); }
      return true;
    }
    if (j.st === 'fly') {
      j.d += G.speed * dt; const o = shoulderOf(u, a);
      a.x = o.x + Math.cos(dir) * j.d; a.y = o.y + Math.sin(dir) * j.d; a.ang = dir; a.open = 1;
      for (const h of heroesOf(w, u)) {
        if (dist(a.x, a.y, h.x, h.y) > hand.r + h.r) continue;
        hurt(w, h, G.hitDmg * u.dmgMul, u, { noDodge: true, knock: canDrag(h) ? 0 : 260, kAngle: dir, heavy: true });
        if (canDrag(h)) { j.who = h; h.heldBy = hand; hand.holding = h; j.grip = u.maxHp * G.gripK; j.hp0 = hand.hp; j.st = 'haul'; j.t = 0; j.from = { x: a.x, y: a.y };
          for (const o2 of heroesOf(w, u)) if (o2 !== h) { o2.focus = hand; o2.focusT = G.hold + 1; } // the party turns on the claw
          sparks(w, a.x, a.y, dir + Math.PI, 6, '#FFE7A0'); }
        else { j.st = 'back'; j.t = 0; j.from = { x: a.x, y: a.y }; }
        return true;
      }
      if (j.d >= e.d) { j.st = 'back'; j.t = 0; j.from = { x: a.x, y: a.y }; sparks(w, a.x, a.y, dir + Math.PI, 5, '#FFFFFF'); }
      return true;
    }
    const h = j.who, mouth = { x: u.x + Math.cos(u.facing) * (u.r + 52), y: u.y + Math.sin(u.facing) * (u.r + 52) };
    if (j.st === 'haul' || j.st === 'hold') {
      if (!alive(h) || h.heldBy !== hand) { j.st = 'back'; j.t = 0; j.from = { x: a.x, y: a.y }; if (h) h.heldBy = null; hand.holding = null; return true; }
      a.open = 0; a.ang = angleTo(u.x, u.y, a.x, a.y);
      if (j.st === 'haul') { const q = clamp(j.t / 0.5, 0, 1), s = q * q * (3 - 2 * q); a.x = j.from.x + (mouth.x - j.from.x) * s; a.y = j.from.y + (mouth.y - j.from.y) * s; if (q >= 1) { j.st = 'hold'; j.t = 0; } }
      else { a.x = mouth.x + Math.sin(j.t * 30) * 1.5; a.y = mouth.y; u.roast = 0.25; }
      holdFast(h, a.x + Math.cos(a.ang) * 16, a.y + Math.sin(a.ang) * 16, 0.25); h.facing = a.ang + Math.PI;
      // blows on the claw since it closed loosen it
      if (j.hp0 - hand.hp >= j.grip) { release(w, h, a, false); hand.holding = null; j.st = 'reel'; j.t = 0; beginHold(u, 0.2, null); bfx(w, { type: 'gripBreak', x: a.x, y: a.y, max: 0.45 }); return true; }
      if (j.st === 'hold') {
        if ((j.tick -= dt) <= 0) { j.tick = G.tick; hurt(w, h, G.dmg * u.dmgMul, u, { noDodge: true, burn: G.burn, dot: true }); flames(w, h.x, h.y, 2, 12, 80); }
        if (j.t >= G.hold) { // not freed: thrown across the room
          const ta = u.facing + rrange(-0.5, 0.5); h.heldBy = null; hand.holding = null; h.stunT = 0.3;
          hurt(w, h, G.throwDmg * u.dmgMul, u, { noDodge: true, knock: G.throwKnock, kAngle: ta, heavy: true });
          j.st = 'back'; j.t = 0; j.from = { x: a.x, y: a.y }; a.open = 1;
        }
      }
      return true;
    }
    if (j.st === 'reel') { // its grip broken: the claw hangs open, dazed (the party's window on it)
      a.open = 0.9; a.x += (restOf(u, a, k.t).x - a.x) * Math.min(1, dt * 3); a.y += (restOf(u, a, k.t).y - a.y) * Math.min(1, dt * 3);
      addBuff(hand, { id: 'stuck', dur: 0.15, taken: 1.4 });
      return j.t < G.dazed;
    }
    // back: the pistons pull it home
    const r = restOf(u, a, k.t), q = clamp(j.t / 0.45, 0, 1), s = q * q * (3 - 2 * q);
    a.x = j.from.x + (r.x - j.from.x) * s; a.y = j.from.y + (r.y - j.from.y) * s; a.open = 0.5; a.vx = a.vy = 0;
    return q < 1;
  } };
}
function release(w, h, a, broke) { if (!h) return; h.heldBy = null; h.stunT = Math.min(h.stunT, 0.1); h.invulnT = Math.max(h.invulnT, 0.3); puff(w, h.x, h.y, IRON, 8, 120, 6, 0.4); sparks(w, a.x, a.y, rand() * TAU, 8, '#FFE7A0', 1.2); }
// ---- Swat: a free hand backhands whoever crowds the head (a cone from the head; thrown hard, hurt a little)
function swat(w, u, k, a, at) {
  const S = GE.swat, a0 = at + a.s * S.arc / 2, a1 = at - a.s * S.arc / 2; // from its own side across the front
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a: at, arc: S.arc, r: S.r, t: S.tell, team: u.team, src: a.hand, kind: 'blade', quiet: true, hit: H(u, { dmg: S.dmg, knock: S.knock, heavy: true }),
    onFire: (w2) => { bfx(w2, { type: 'swat', u, a0, a1, r: S.r, max: 0.3 }); } });
  const R = S.r * 0.78, sx = a.x, sy = a.y;
  a.job = { type: 'swat', t: 0, run() {
    const tt = a.job.t;
    if (tt < S.tell) { const q = clamp(tt / (S.tell * 0.7), 0, 1), s = q * q * (3 - 2 * q), bx = u.x + Math.cos(a0 + a.s * 0.35) * R * 0.8, by = u.y + Math.sin(a0 + a.s * 0.35) * R * 0.8;
      a.x = sx + (bx - sx) * s; a.y = sy + (by - sy) * s; a.ang = a0; a.open = 0.2; a.vx = a.vy = 0; return true; }
    const q = clamp((tt - S.tell) / 0.16, 0, 1), an = a0 + (a1 - a0) * (1 - (1 - q) * (1 - q));
    a.x = u.x + Math.cos(an) * R; a.y = u.y + Math.sin(an) * R; a.ang = an - a.s * Math.PI / 2;
    if (tt > S.tell + 0.4) { a.vx = a.vy = 0; return false; }
    return true;
  } };
}
// ---- Steam Vent (no hand free): the boiler blows off round the head
function vent(w, u, k) {
  const V = GE.vent;
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: V.r, t: V.tell, team: u.team, src: u, kind: 'fire', col: '#E6E8F0', quiet: true, hit: H(u, { dmg: V.dmg, burn: V.burn, knock: V.knock }),
    onFire: (w2, z) => { bfx(w2, { type: 'steamBurst', x: z.x, y: z.y, r: V.r, max: 0.7 }); steam(w2, z.x, z.y, 20, 320); } });
  beginHold(u, V.tell + 0.35, null); k.shakeT = V.tell;
}

// ---------------------------------------------------------------- phase 2: the Whirl
// Both arms lock straight out and the whole machine spins like a rotor, driving at its mark: run from it. A live
// circle shows its reach. When it runs down it hangs there, dizzy: the party's window.
function startWhirl(w, u, k) {
  const W = GE.whirl;
  for (const a of k.arm) a.job = null;
  k.whirl = { t: 0, a: u.facing + Math.PI / 2, hit: new Map(), z: null };
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: W.r + 20, t: W.wind, team: u.team, src: u, kind: 'blade', quiet: true });
}
function whirlTick(w, u, k, dt) {
  const s = k.whirl; if (!s) return false;
  const W = GE.whirl; s.t += dt;
  const spinning = s.t >= W.wind && s.t < W.wind + W.dur, after = s.t - W.wind - W.dur;
  const rev = s.t < W.wind ? Math.pow(s.t / W.wind, 2) * 0.35 : spinning ? Math.min(1, 0.35 + (s.t - W.wind) * 2) * Math.min(1, (W.wind + W.dur - s.t) * 1.5 + 0.25) : Math.max(0, 0.25 - after * 0.5);
  s.a += W.rate * rev * dt; u.facing = wrapAngle(s.a - Math.PI / 2); u.spinV = rev;
  // the arms: straight out either side, rigid
  const R = GE.arm.side + GE.arm.l1 + GE.arm.l2 - 6, out = s.t < W.wind ? clamp(s.t / (W.wind * 0.7), 0, 1) : after > 0 ? Math.max(0.55, 1 - after) : 1;
  for (const a of k.arm) {
    const an = s.a + (a.s > 0 ? 0 : Math.PI), rr = GE.arm.side + (R - GE.arm.side) * out;
    a.x += (u.x + Math.cos(an) * rr - a.x) * Math.min(1, dt * 22); a.y += (u.y + Math.sin(an) * rr - a.y) * Math.min(1, dt * 22); a.ang = an; a.open = 0.1; a.lift = 0; a.vx = a.vy = 0; a.whirl = spinning ? rev : 0;
    if (a.hand && alive(a.hand)) { place(a.hand, a.x, a.y, a.ang); a.hand.hop = 0; a.hand.open = a.open; }
    else if (a.hand) breakHand(w, u, k, a);
  }
  if (spinning) {
    const t = pickTarget(w, u, k, dt);
    if (t) walkTo(w, u, t.x, t.y, W.speed * (k.phase >= 3 ? 1.2 : 1), dt); else stand(u, dt);
    s.z = s.z && w.danger.includes(s.z) ? s.z : liveZone(w, u, { shape: 'circle', x: u.x, y: u.y, r: W.r + 14, kind: 'blade' });
    keepZone(s.z, { x: u.x + (u.vx || 0) * 0.25, y: u.y + (u.vy || 0) * 0.25 });
    // whoever an arm passes over is struck (each arm, once every W.again seconds a hero)
    for (const h of heroesOf(w, u)) {
      const dd = dist(u.x, u.y, h.x, h.y); if (dd > W.r + h.r * 0.5 || dd < 30) continue;
      const ha = angleTo(u.x, u.y, h.x, h.y);
      if (!k.arm.some((a) => angleDiff(ha, a.ang) < 0.3 + h.r / dd)) continue;
      if ((s.hit.get(h) || -9) > w.time - W.again) continue;
      s.hit.set(h, w.time);
      hurt(w, h, W.dmg * u.dmgMul, u, { noDodge: true, knock: W.knock, kAngle: ha + 0.5, heavy: true });
      sparks(w, h.x, h.y, ha, 5, '#FFE7A0');
    }
    if (rand() < dt * 16) { const a = k.arm[rand() < 0.5 ? 0 : 1]; w.particles.push({ shape: 'spark', x: a.x, y: a.y, vx: Math.cos(a.ang + 1.6) * 200, vy: Math.sin(a.ang + 1.6) * 200, life: 0.18, max: 0.18, size: 3, color: '#FFE7A0', drag: 0.85 }); }
  } else stand(u, dt);
  if (after > 0) { // run down: it hangs there venting, arms slack
    if (!s.dizzy) { s.dizzy = true; steam(w, u.x, u.y, 16); bfx(w, { type: 'dizzy', u, max: W.dizzy }); }
    addBuff(u, { id: 'dizzy', dur: 0.15, taken: W.dizzyTaken });
    if (after >= W.dizzy) { k.whirl = null; u.spinV = 0; for (const a of k.arm) a.whirl = 0; }
  }
  return true;
}

// ---------------------------------------------------------------- phase 3: the Furnace Beam and the Pressure
// The furnace door opens and a beam of white heat sweeps the room; the boilers stop it (get behind one).
function startBeam(w, u, k, hs) {
  const B = GE.beam, at = k.look;
  // sweep towards the side with more of them
  let side = 0; for (const h of hs) side += Math.sign(wrapAngle(angleTo(u.x, u.y, h.x, h.y) - at)) || 0;
  const dir = side > 0 ? 1 : side < 0 ? -1 : chance(0.5) ? 1 : -1, a0 = at - dir * B.sweep * 0.38; // it starts just beside them and sweeps across
  k.beam = { t: 0, a: a0, dir, tick: 0, z: null };
  const e = clipLine(w, u.x, u.y, a0, B.len, 12, u.r);
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: e.x, y2: e.y, hw: B.hw, t: B.tell, team: u.team, src: u, kind: 'fire', quiet: true });
  k.pose = (a) => { const p = u.facing + a.s * 1.9; return { x: u.x + Math.cos(p) * 130, y: u.y + Math.sin(p) * 130 }; }; // the hands brace behind it
}
function beamTick(w, u, k, dt) {
  const b = k.beam; if (!b) return false;
  const B = GE.beam; b.t += dt; stand(u, dt);
  turnTo(u, b.a, 5, dt);
  u.mouth = clamp(b.t / (B.tell * 0.8), 0, 1);
  if (b.t < B.tell) return true;
  if (b.t >= B.tell + B.dur) { k.beam = null; w.engineBeam = null; u.mouth = 0; k.pose = null; beginHold(u, 0.9, null); steam(w, u.x + Math.cos(u.facing) * u.r, u.y + Math.sin(u.facing) * u.r, 10); return true; }
  b.a += b.dir * B.sweep / B.dur * dt; u.facing = b.a;
  const ox = u.x + Math.cos(b.a) * (u.r * 0.7), oy = u.y + Math.sin(b.a) * (u.r * 0.7), e = clipLine(w, ox, oy, b.a, B.len, 6, 0);
  w.engineBeam = { x1: ox, y1: oy, x2: e.x, y2: e.y, t: b.t - B.tell, hw: B.hw };
  // the path just ahead of it, so they step out of its way
  const la = b.a + b.dir * 0.2, le = clipLine(w, ox, oy, la, B.len, 6, 0);
  b.z = b.z && w.danger.includes(b.z) ? b.z : liveZone(w, u, { shape: 'line', x1: ox, y1: oy, x2: le.x, y2: le.y, hw: B.hw + 10, kind: 'fire' });
  keepZone(b.z, { x1: ox, y1: oy, x2: le.x, y2: le.y });
  if ((b.tick -= dt) <= 0) {
    b.tick = B.tick;
    (w.scorch || (w.scorch = [])).push({ x: e.x, y: e.y, t0: w.time }); if (w.scorch.length > 60) w.scorch.shift();
    for (const h of heroesOf(w, u)) {
      const dx = e.x - ox, dy = e.y - oy, L2 = dx * dx + dy * dy || 1, q = clamp(((h.x - ox) * dx + (h.y - oy) * dy) / L2, 0, 1);
      if (dist(h.x, h.y, ox + dx * q, oy + dy * q) > B.hw + h.r * 0.5) continue;
      hurt(w, h, B.dmg * u.dmgMul, u, { noDodge: true, burn: B.burn, knock: 40, kAngle: b.a });
    }
    sparks(w, e.x, e.y, b.a + Math.PI, 2, '#FFE08A');
  }
  return true;
}
// The Pressure: it clamps its hands on its lid and the gauge climbs; a brass valve stands out of its back. Break the
// valve before the needle hits red and it vents (stunned, wide open); if not, the boiler blows across the room.
function startPress(w, u, k) {
  const P = GE.press;
  const bx = u.x - Math.cos(u.facing) * (u.r + 26), by = u.y - Math.sin(u.facing) * (u.r + 26);
  const v = part(w, u, 'engineValve', bx, by, { share: 0, pool: true, hp: u.maxHp * P.valveK });
  k.press = { t: 0, valve: v };
  for (const a of k.arm) a.job = null;
  k.pose = (a) => { const p = u.facing + a.s * 0.95; return { x: u.x + Math.cos(p) * (u.r + 22), y: u.y + Math.sin(p) * (u.r + 22) }; };
  for (const h of heroesOf(w, u)) { h.focus = v; h.focusT = P.dur; }
  bfx(w, { type: 'pressure', u, max: P.dur, r: P.r });
}
function pressTick(w, u, k, dt) {
  const s = k.press; if (!s) return false;
  const P = GE.press; s.t += dt; stand(u, dt);
  if (s.vented != null) { // the valve broke: steam roars out of its back, it hangs open
    s.vented += dt; addBuff(u, { id: 'vented', dur: 0.15, taken: P.ventedTaken }); u.gauge = Math.max(0, (u.gauge || 0) - dt * 2);
    if (rand() < dt * 30) { const a = u.facing + Math.PI + rrange(-0.5, 0.5), v = rrange(150, 380); w.particles.push({ x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rise: 20, life: 0.7, max: 0.7, size: rrange(7, 12), color: 'rgba(238,238,243,0.78)' }); }
    if (s.vented >= P.vented) { k.press = null; k.pose = null; u.gauge = 0; }
    return true;
  }
  const v = s.valve, q = s.t / P.dur; u.gauge = q; k.shakeT = 0.1; u.pressK = q;
  if (alive(v)) place(v, u.x - Math.cos(u.facing) * (u.r + 26), u.y - Math.sin(u.facing) * (u.r + 26), u.facing + Math.PI);
  if (rand() < dt * (4 + 18 * q)) { const a = rand() * TAU; w.particles.push({ x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, rise: 30, life: 0.5, max: 0.5, size: rrange(5, 9), color: 'rgba(238,238,243,0.7)' }); }
  if (!alive(v)) { // broken in time
    s.vented = 0; u.pressK = 0; w.bfx = (w.bfx || []).filter((f) => f.type !== 'pressure');
    bfx(w, { type: 'ventBurst', u, max: 0.6 }); steam(w, u.x, u.y, 26, 360); w.shake = Math.max(w.shake, 8);
    return true;
  }
  if (s.t >= P.dur) { // too late: the boiler blows
    v.partOf = null; kill(w, v, null); u.pressK = 0; u.gauge = 0;
    for (const h of heroesOf(w, u)) { const dd = dist(u.x, u.y, h.x, h.y); if (dd < P.r) hurt(w, h, P.dmg * u.dmgMul * (1 - 0.35 * dd / P.r), u, { noDodge: true, burn: P.burn, knock: P.knock, kAngle: angleTo(u.x, u.y, h.x, h.y), heavy: true }); }
    bfx(w, { type: 'boilerBlast', x: u.x, y: u.y, r: P.r, max: 0.9 }); steam(w, u.x, u.y, 40, 520); w.shake = Math.max(w.shake, 14);
    k.press = null; k.pose = null; beginHold(u, 1.0, null);
  }
  return true;
}

// ---------------------------------------------------------------- phase turns: a blast of steam; both hands forged anew
function enter(w, u, k, p) {
  notePhase(w, k); u.invulnT = 1.5; const B = GE.blast;
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: B.r, t: B.tell, team: u.team, src: u, kind: 'fire', col: '#E6E8F0', quiet: true, hit: H(u, { dmg: B.dmg, burn: B.burn, knock: B.knock }),
    onFire: (w2, z) => { bfx(w2, { type: 'steamBurst', x: z.x, y: z.y, r: B.r, max: 0.7 }); steam(w2, z.x, z.y, 26, 360); w2.shake = Math.max(w2.shake, 8);
      for (const a of k.arm) if (!a.hand && alive(u)) forgeHand(w2, u, k, a); } });
  beginHold(u, B.tell + 0.5, null); k.shakeT = B.tell;
  if (p === 2) again(u, 'whirl', 2.2);
  if (p === 3) { w.overheat = true; again(u, 'beam', 2); again(u, 'press', 9); }
}
function death(w, u) {
  w.engineBeam = null; w.overheat = false;
  const k = u.ge;
  if (k) for (const a of k.arm) { if (a.hand && a.hand.holding) release(w, a.hand.holding, a, true); bfx(w, { type: 'handBreak', x: a.x, y: a.y, a: a.ang, claw: !!a.i, max: 1.1, seed: a.i * 7 + 3 }); }
  for (const o of w.units) if (o.calledBy === u && o.kind === 'welderDrone' && alive(o)) { o.partOf = null; kill(w, o, null); }
  endParts(w, u);
  bfx(w, { type: 'engineWreck', x: u.x, y: u.y, a: u.facing, max: 1.6, seed: 5 });
  steam(w, u.x, u.y, 40, 420); for (let i = 0; i < 16; i++) sparks(w, u.x, u.y, rand() * TAU, 1, '#FFE7A0', 1.5);
  w.shake = Math.max(w.shake, 12);
}

// ---------------------------------------------------------------- the engine room: an iron floor, four boilers, a furnace glow
function foundry(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 270, y: Hh / 2 };
  for (const [fx, fy] of [[0.34, 0.24], [0.34, 0.76], [0.6, 0.2], [0.6, 0.8]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 38 });
  w.arenaDecor = [[0.15, 0.25, 'pipe'], [0.15, 0.75, 'pipe'], [0.85, 0.16, 'rubble'], [0.85, 0.84, 'crack']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.2, v: 0 }));
  w.engineRoom = true;
  stage(w, 'engine', drawFoundryFloor, drawEngineAir);
}

const HAND = (name, o) => PART(name, { r: GE.hand.r, vr: GE.hand.r, mass: 30, hp: 100, draw: drawEngineHand, construct: true, ...o });
export const ENGINE = {
  defs: {
    greatEngine: { team: 'enemy', name: 'The Great Engine', r: 56, vr: 56, turn: 1.9, accel: 120, face: 1.9, mass: 14, hp: 680, speed: 44, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 240, coins: [100, 120], boss: true, arena: 'foundry', noCorpse: true, construct: true,
      res: { poison: 0, burn: 0.5, chill: 0.8, shock: 1.4, wet: 1.3, stagger: 0.4, radiance: 0.5, curse: 0.5 }, draw: drawEngine, brain, onDeath: death },
    engineHammer: HAND('The Great Engine (hammer)', { res: { shock: 1.4 } }),
    engineClaw: HAND('The Great Engine (claw)', { res: { shock: 1.4 } }),
    engineValve: PART('The Great Engine (valve)', { r: 24, vr: 24, mass: 30, hp: 100, draw: drawEngineValve }),
    // a welder drone: the Foundry's repair drone on the Engine's errand (flies to a broken hand and forges it back)
    welderDrone: { variantOf: 'repairDrone', name: 'Welder Drone', hp: 34, xp: 0, coins: [0, 0], cost: 99, noElite: true, brain: welderBrain },
  },
  arenas: { foundry },
};
