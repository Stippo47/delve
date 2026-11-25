// Old Longlegs, the IK spider (round 19, lane spider19). A test boss: not placed in a dungeon yet. Design and numbers:
// docs/BOSS-ik-spider.md. The designer: "Make a new boss. Doesn't have to be in a dungeon yet. Mostly to test the
// shape. An IK spider. Its head/body is always flying / in the air. It has 6 legs that keep it up and walk on the
// ground. Its attacks are stomps and slamming its head into the ground; if it doesn't hit something it is stunned on
// the ground for a second. Each leg has its own hp and will break when the foot is destroyed. The leg will still show
// but badly damaged and can't attack; each leg damaged makes the time the head spends on the ground longer and how
// fast it can move [slower]. Before slamming its head it will have a telegraph circle underneath it as it walks for a
// bit, then will pause for a split second and slam. You can add additional abilities."
//
// How it is put together:
//   the body  one unit, the boss. It is held up in the air (k.h room units over the floor) and is on the FLYING layer
//             while it is up (tags.js layerOf: u.flyT, kept by the ALOFT hook): only shots reach it, it touches no body
//             on the floor, and it is drawn over everything on the floor. The unit sits where the body is DRAWN (the
//             floor point under it, k.gx / k.gy, plus its height up the screen), so a shot lands on the body you see;
//             its one shadow lies on the floor point (def.shadows, the shared shadow layer). Down from a slam, or
//             collapsed, it is on the floor layer like anyone else.
//   the legs  six, each a foot planted on the floor (k.legs[i].x / y, its height z while it steps) and a hip on the
//             body; the knee between is solved in the drawing (boss-spider-fx.js knee3: two bones, bent up and out).
//             A foot stays where it was put until it steps. The gait is two alternating tripods (front and rear of one
//             side with the middle of the other): a tripod goes when its feet have fallen a stride behind where they
//             belong, only while the other tripod is planted, each foot lifting in an arc to a spot ahead.
//   the feet  each leg's foot is a unit of its own (boss-kit.js part, a pool): the hit box the melee heroes reach. A
//             blow on a foot passes a share on to the body. A foot destroyed breaks its leg: it hangs limp and drags,
//             and can't stomp or carry. Each broken leg slows the walk and lengthens the time it lies stunned after a
//             missed slam. With four broken it can't stand: it collapses and fights from the floor.
// Its looks: js/boss-spider-fx.js (one figure, one outline: boss-draw.js).
import { alive, hurt, puff, addDanger, addBuff, spawn, kill, inZone, offFloor } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange } from './util.js';
import { hold, beginHold, due, again, stand, turnTo, crowd } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, lead, part, endParts, PART, place, notePhase, inside, stage, bfx, TEST_MOVE } from './boss-kit.js';
import { up } from './boss-draw.js';
import { drawSpider, drawSpiderFoot, drawDenFloor, drawDenAir, spiderShadows, spiderPortrait } from './boss-spider-fx.js';

export const SP = {
  body: { h: 44, low: 8, air: 30, hub: 6, hipR: 30 },   // how high it is carried; lying on the floor; flying from this height up; the hips sit round a hub this far ahead of its middle
  leg: { l1: 66, l2: 88, restR: 126, hpK: 0.1, share: 0.85, more: 0.25,   // bones; where a foot rests; a foot's health (of the body's); what a blow on a foot passes on (and a second foot caught by the same blow)
    footR: 19, stepDist: 26, settle: 12, over: 0.55, stepT: 0.24, lift: 16, drag: 108 },
  slow: [1, 0.9, 0.78, 0.66],     // its pace with 0, 1, 2, 3 legs broken
  collapseAt: 4, crawl: 0.42,     // this many broken: it can't stand; its pace on its belly
  keep: 112, turn: 1.15,          // how far it stands off its mark (a front leg's reach); how fast it turns (rad/s)
  stomp: { r: 66, tell: 0.66, dmg: 46, stagger: 30, knock: 170, lift: 78, stuck: 0.5, reachMin: 56, reachMax: 128, clear: 66, sector: 0.62, cd: [1.7, 2.5] },
  slam: { r: 96, track: 1.5, pause: 0.26, drop: 0.1, rear: 12, dmg: 105, knock: 320, stagger: 40, chase: 2.3,
    stun: 1.0, perLeg: 0.3, hitRest: 0.45, rise: 0.4, taken: 1.25, cd: [5.5, 7], other: 0.4 },
  web: { r: 62, tell: 0.85, dmg: 26, root: 1.5, patch: 6, cd: [6, 8], range: [150, 620] },
  brood: { n: 1, drop: 0.8, high: 32, cd: [15, 18], own: 3, scale: 0.7, hpMul: 0.45 },
  collapse: { dazed: 1.8, taken: 1.25 },
};
export const PHASE_AT = [1, 0.6];
const WAKE = 470, DUST = '#D9CDB0';
// th: where its foot rests round the body (0 is straight ahead); hip: where it joins the hub; side: -1 left, 1 right
// (its knee bends out to its own side); grp: its tripod.
export const LEGS = [
  { name: 'front left', th: -0.62, hip: -0.95, side: -1, grp: 0 }, { name: 'front right', th: 0.62, hip: 0.95, side: 1, grp: 1 },
  { name: 'middle left', th: -1.57, hip: -1.57, side: -1, grp: 1 }, { name: 'middle right', th: 1.57, hip: 1.57, side: 1, grp: 0 },
  { name: 'rear left', th: -2.5, hip: -2.2, side: -1, grp: 0 }, { name: 'rear right', th: 2.5, hip: 2.2, side: 1, grp: 1 },
];
const BREAK_ORDER = [1, 2, 4, 0, 5, 3]; // (?bossmove=legsN: which legs are broken for a clip)

export const brokenOf = (k) => k.legs.reduce((n, L) => n + (L.broken ? 1 : 0), 0);
const paceOf = (k) => (k.collapsed ? SP.crawl : SP.slow[Math.min(brokenOf(k), SP.slow.length - 1)]);
const restH = (k) => (k.collapsed ? SP.body.low : SP.body.h);
// where a leg's foot belongs on the floor, and where its hip is (x, y on the floor under it, z its height)
export const restOf = (u, k, L) => ({ x: k.gx + Math.cos(u.facing + L.th) * L.R, y: k.gy + Math.sin(u.facing + L.th) * L.R });
export function hipOf(u, k, L) {
  const B = SP.body, f = u.facing;
  return { x: k.gx + k.sx + Math.cos(f) * B.hub + Math.cos(f + L.hip) * B.hipR, y: k.gy + k.sy + Math.sin(f) * B.hub + Math.sin(f + L.hip) * B.hipR, z: Math.max(B.low, k.h + k.bob) };
}

// Up in the air: flying (only shots reach it), and out of a blade's reach, so the fighters go for its feet (sim.js
// chooseTarget reads a unit's outOfReach list). Runs every step, stunned or not (sim.js statusTick: a hook's tick).
const ALOFT = {
  tick(w, u) {
    const k = u.sp; if (!k || k.h < SP.body.air) return;
    u.flyT = Math.max(u.flyT || 0, 0.12);
    // (and the other way about: those who shoot have the body to shoot at, and leave the feet to the blades)
    for (const h of heroesOf(w, u)) {
      const m = h.outOfReach || (h.outOfReach = new Map());
      if (h.def.role !== 'ranged') m.set(u, w.time + 0.4);
      else for (const L of k.legs) if (L.foot) m.set(L.foot, w.time + 0.4);
    }
  },
  struck(w, u) { if (u.sp) u.sp.hitT = w.time; }, // (a blow on the body itself: boss-kit.js part() lights u.flashT for a blow on a foot too)
};

function brain(w, u, dt) {
  const k = u.sp || (u.sp = make(w, u));
  steady(u); stage(w, 'spider', drawDenFloor, drawDenAir);
  w.bossLog = () => `phase ${k.phase} at ${Math.round(100 * Math.max(0, u.hp) / u.maxHp)}%, ${brokenOf(k)} legs broken${k.collapsed ? ' (collapsed ' + Math.round(k.collapsedAt) + 's)' : ''}, slams ${k.slamHits}/${k.slams}, stomps ${k.stompHits}/${k.stomps}${k.phaseT ? ' (' + k.phaseT.map((t) => Math.round(t)).join('/') + 's)' : ''}`;
  // the floor point under it: where the sim left the unit, less its height up the screen
  k.gx = u.x - k.ox; k.gy = u.y - k.oy; k.t += dt;
  for (const L of k.legs) if (L.foot && !alive(L.foot)) breakLeg(w, u, k, L);
  if (!k.collapsed && brokenOf(k) >= SP.collapseAt) collapse(w, u, k);
  dropsTick(w, u, k, dt);
  act(w, u, k, dt);
  // its height, its legs, and the unit put back where the body shows
  k.h += clamp(k.hGoal - k.h, -k.hRate * dt, k.hRate * dt);
  if (!k.slam && !k.fall && !(k.pose && k.pose.rear)) { k.hGoal = restH(k); k.hRate = 110; }
  if (k.pose && (k.pose.t -= dt) <= 0) k.pose = null;
  legsTick(w, u, k, dt);
  const [ux, uy] = up(); k.ox = ux * k.h * 0.9; k.oy = uy * k.h * 0.9;
  u.x = k.gx + k.ox; u.y = k.gy + k.oy; k.f0 = u.facing;
  const glare = k.slam && (k.slam.st === 'track' || k.slam.st === 'pause') ? 1 : k.pose ? 0.6 : 0;
  k.glare += (glare - k.glare) * Math.min(1, dt * 8);
  return true;
}

function make(w, u) {
  const k = { phase: 0, t: 0, gx: u.x, gy: u.y, ox: 0, oy: 0, h: SP.body.h, hGoal: SP.body.h, hRate: 110, bob: 0, bobV: 0, sx: 0, sy: 0, f0: u.facing,
    legs: LEGS.map((d, i) => ({ ...d, i, R: SP.leg.restR, x: 0, y: 0, z: 0, foot: null, broken: false, bt: 0, step: null, job: null, hvx: 0, hvy: 0, hx: 0, hy: 0, err: 0, along: 0, stillT: 0 })),
    slam: null, fall: null, pose: null, collapsed: false, collapsedAt: 0, drops: [], glare: 0, hitT: -9, blowAt: -1, slams: 0, slamHits: 0, stomps: 0, stompHits: 0 };
  for (const L of k.legs) {
    const r = restOf(u, k, L); L.x = r.x; L.y = r.y; L.hx = r.x; L.hy = r.y;
    // (one blow that catches several feet, a spin under it, passes its full share on once and a quarter for each more)
    L.foot = part(w, u, 'spiderFoot', r.x, r.y, { pool: true, hp: u.maxHp * SP.leg.hpK, share: () => { const first = k.blowAt !== w.time; k.blowAt = w.time; return SP.leg.share * (first ? 1 : SP.leg.more); } });
    L.foot.leg = L; L.foot.shadowK = 0;
  }
  if (!u.trinketHooks.includes(ALOFT)) u.trinketHooks = [...u.trinketHooks, ALOFT];
  return k;
}

function act(w, u, k, dt) {
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 0.7, null); k.pose = { kind: 'hiss', t: 0.7, max: 0.7 }; bfx(w, { type: 'spHiss', u, max: 0.5 }); notePhase(w, k); })) return;
  if (TEST_MOVE && !k.tested) { k.tested = true; testMove(w, u, k, TEST_MOVE); }
  if (fallTick(w, u, k, dt)) return;
  if (slamTick(w, u, k, dt)) return;
  if (hold(u, dt)) return;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return;
  const t = pickTarget(w, u, k, dt, 1.1, (h) => dist(h.x, h.y, k.gx, k.gy) - (h === u.target ? 60 : 0));
  if (!t) { stand(u, dt); return; }
  const hs = heroesOf(w, u), K = k.phase >= 2 ? 0.82 : 1, pace = paceOf(k);
  if (due(u, 'slam', dt, 4.5)) { again(u, 'slam', ...SP.slam.cd.map((x) => x * K)); startSlam(w, u, k, hs, t); return; }
  if (due(u, 'brood', dt, 7)) { again(u, 'brood', ...SP.brood.cd); if (brood(w, u, k)) return; }
  if (due(u, 'web', dt, 3)) {
    const who = webMark(u, k, hs);
    if (who) { again(u, 'web', ...SP.web.cd.map((x) => x * K)); web(w, u, k, who); return; }
    again(u, 'web', 1.5);
  }
  if (due(u, 'stomp', dt, 1.2)) {
    if (stomps(w, u, k, hs, k.phase >= 2 ? 3 : 2)) { again(u, 'stomp', ...SP.stomp.cd.map((x) => x * K)); return; }
    again(u, 'stomp', 0.35);
  }
  // aloft it stands off its mark by a front leg's reach; on its belly it drags itself right up to them
  const d = dist(k.gx, k.gy, t.x, t.y), at = angleTo(k.gx, k.gy, t.x, t.y), near = k.collapsed ? u.r + t.r + 20 : SP.keep;
  if (d > near + 16) walkTo(w, u, t.x + k.ox, t.y + k.oy, pace, dt); else stand(u, dt);
  turnTo(u, at, SP.turn * (0.5 + 0.5 * pace), dt);
}
function testMove(w, u, k, m) { // ?bossmove=walk|slam|stomp|web|brood|legs1..legs6|legs3m: that first (clips, the bench)
  const only = (key, t) => { for (const o of ['slam', 'web', 'stomp', 'brood']) again(u, o, o === key ? t : 40); };
  if (m === 'slam') only('slam', 0.8);
  if (m === 'stomp') only('stomp', 0.4);
  if (m === 'web') only('web', 0.6);
  if (m === 'brood') { k.phase = 2; only('brood', 0.6); }
  if (m === 'walk') only('', 0);
  const n = /^legs(\d)(m?)$/.exec(m); // legsN: N legs broken and no moves (to watch it walk); legsNm: N broken, moves as ever
  if (n) { if (!n[2]) only('', 0); for (const i of BREAK_ORDER.slice(0, +n[1])) { const L = k.legs[i]; if (L.foot) { L.foot.partOf = null; kill(w, L.foot, null); } } }
}

// ---------------------------------------------------------------- the legs
// Every tick: where each foot belongs and how fast that spot moves over the floor (the body's walk and its turning);
// feet in the air go on with their step; planted feet stay put; a tripod whose feet have fallen a stride behind steps,
// while the other tripod stands. A broken leg drags. A stomping leg is its job's.
function legsTick(w, u, k, dt) {
  const G = SP.leg, om = wrapAngle(u.facing - k.f0) / Math.max(dt, 1e-4);
  const down = !!k.fall || (!!k.slam && k.slam.st !== 'track');   // dropping, lying or getting up: nobody steps
  const live = k.legs.filter((L) => !L.broken), air = [0, 0];
  for (const L of live) if (L.step || (L.job && L.z > 1)) air[L.grp]++;
  for (const L of k.legs) {
    const r = restOf(u, k, L), rx = r.x - k.gx, ry = r.y - k.gy, a = Math.min(1, dt * 12);
    L.hvx += (u.vx - om * ry - L.hvx) * a; L.hvy += (u.vy + om * rx - L.hvy) * a; L.hx = r.x; L.hy = r.y;
  }
  for (const L of k.legs) {
    if (L.broken) { dragLeg(w, u, k, L, dt); continue; }
    if (L.job) { stompTick(w, u, k, L, dt); continue; }
    const s = L.step; if (!s) { L.z = 0; continue; }
    // a step: the foot swings in an arc to a spot ahead of where it belongs (the spot moves with the body: it lands on it)
    const sp = Math.hypot(L.hvx, L.hvy), mv = sp > 12, e2 = Math.min(1, dt * 10);
    s.ovx += ((mv ? L.hvx / sp * s.over : 0) - s.ovx) * e2; s.ovy += ((mv ? L.hvy / sp * s.over : 0) - s.ovy) * e2;
    s.t += dt;
    const q = clamp(s.t / s.T, 0, 1), e = q * q * (3 - 2 * q), tg = footSpot(w, L.hx + s.ovx, L.hy + s.ovy);
    L.x = s.x0 + (tg.x - s.x0) * e; L.y = s.y0 + (tg.y - s.y0) * e; L.z = Math.sin(Math.PI * q) * s.lift;
    if (q >= 1) { L.step = null; L.z = 0; L.x = tg.x; L.y = tg.y; if (rand() < 0.6) w.particles.push({ x: L.x, y: L.y, vx: rrange(-14, 14), vy: rrange(-14, 14), life: 0.3, max: 0.3, size: 3.6, color: 'rgba(217,205,176,0.55)' }); }
  }
  if (!down) {
    const need = [false, false], lag = [0, 0];
    for (const L of live) {
      if (L.step || L.job) continue;
      const ex = L.hx - L.x, ey = L.hy - L.y, d = Math.hypot(ex, ey), sp = Math.hypot(L.hvx, L.hvy), mv = sp > 12;
      L.err = d; L.along = mv ? (ex * L.hvx + ey * L.hvy) / sp : 0; L.stillT = mv ? 0 : L.stillT + dt; L.mv = mv;
      const hp = hipOf(u, k, L);
      L.urgent = Math.hypot(L.x - hp.x, L.y - hp.y, hp.z) > (G.l1 + G.l2) * 0.93; // stretched as far as it goes: it steps now
      L.need = L.urgent || (mv ? d > G.stepDist : d > G.settle && L.stillT > 0.18);
      if (L.need) need[L.grp] = true;
      lag[L.grp] = Math.max(lag[L.grp], d);
    }
    const maxAir = Math.max(1, Math.floor(live.length / 2));
    for (const g of lag[1] > lag[0] ? [1, 0] : [0, 1]) {
      if (!need[g]) continue;
      const urgent = live.some((L) => L.grp === g && L.urgent && !L.step && !L.job);
      if (air[1 - g] > 0 && !urgent) continue;
      let n = 0;
      for (const L of live) {
        if (L.grp !== g || L.step || L.job) continue;
        if (!L.need && L.err <= (L.mv ? G.stepDist * 0.45 : G.settle)) continue;
        if (air[0] + air[1] >= maxAir && !L.urgent) break;
        startStep(k, L, n++); air[g]++;
      }
      break; // one tripod a tick
    }
  }
  // the body rides on them: it dips while a tripod is in the air and leans after its feet
  const lifted = live.length ? (air[0] + air[1]) / live.length : 0;
  k.bobV += ((-7 * lifted - k.bob) * 150 - k.bobV * 13) * dt; k.bob += k.bobV * dt;
  let mx = 0, my = 0, n = 0; for (const L of live) { mx += L.x - L.hx; my += L.y - L.hy; n++; }
  const a = Math.min(1, dt * 7); k.sx += ((n ? mx / n * 0.3 : 0) - k.sx) * a; k.sy += ((n ? my / n * 0.3 : 0) - k.sy) * a;
  for (const L of k.legs) if (L.foot && alive(L.foot)) { place(L.foot, L.x, L.y, angleTo(k.gx, k.gy, L.x, L.y)); L.foot.hop = L.z; L.foot.shadowK = 0; }
}
function startStep(k, L, n) {
  const G = SP.leg, sp = Math.hypot(L.hvx, L.hvy);
  // how far ahead of its place it lands: so the other tripod's turn comes half way through this one's stride (an even
  // one-two, not two quick steps and a wait)
  const others = k.legs.filter((o) => !o.broken && o.grp !== L.grp && !o.step && !o.job);
  let over = G.over;
  if (others.length) over = clamp((G.over + 1) / 2 - others.reduce((a, o) => a + (o.along || 0), 0) / others.length / G.stepDist, 0.3, 1);
  L.step = { t: -n * 0.035, T: clamp(G.stepT * (1.15 - sp / 300), 0.17, 0.3), x0: L.x, y0: L.y, over: over * G.stepDist, ovx: 0, ovy: 0, lift: G.lift + Math.min(14, L.err * 0.25) };
}
// a foot never comes down outside the room or inside a pillar
function footSpot(w, x, y) {
  const p = inside(w, x, y, 14);
  for (const o of w.pillars) { const d = dist(p.x, p.y, o.x, o.y), m = o.r + 9; if (d < m && d > 0) { p.x = o.x + (p.x - o.x) / d * m; p.y = o.y + (p.y - o.y) / d * m; } }
  return p;
}
// A broken leg hangs from its hip: its foot trails on the floor, pulled along once the slack is gone, and is nudged
// back out to its own side if the body walks over it.
function dragLeg(w, u, k, L, dt) {
  const hp = hipOf(u, k, L), dx = L.x - hp.x, dy = L.y - hp.y, d = Math.hypot(dx, dy) || 1, max = SP.leg.drag, min = 54;
  if (d > max) { L.x = hp.x + dx / d * max; L.y = hp.y + dy / d * max; if (rand() < dt * 7) w.particles.push({ x: L.x, y: L.y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 3.2, color: 'rgba(217,205,176,0.5)' }); }
  else if (d < min) { const a = u.facing + L.th, e = Math.min(1, dt * 5); L.x += (hp.x + Math.cos(a) * min - L.x) * e; L.y += (hp.y + Math.sin(a) * min - L.y) * e; }
  L.z = 0;
}
function breakLeg(w, u, k, L) {
  L.foot = null; L.broken = true; L.job = null; L.step = null; L.z = 0; L.bt = w.time;
  bfx(w, { type: 'spLegBreak', x: L.x, y: L.y, a: angleTo(k.gx, k.gy, L.x, L.y), max: 0.8, seed: L.i * 13 + 5 });
  puff(w, L.x, L.y, DUST, 10, 150, 6, 0.5); w.shake = Math.max(w.shake, 7);
  k.bobV -= 90; // it lurches
  if (!k.slam && !k.fall && alive(u)) { const e = u.el || (u.el = {}); e.holdT = Math.max(e.holdT || 0, 0.4); }
}
// Four legs gone: it can't stand. It comes down where it is and lies dazed; from then on it fights from the floor.
function collapse(w, u, k) {
  k.collapsed = true; k.collapsedAt = w.time;
  if (k.slam && k.slam.z && !k.slam.z.done) { k.slam.z.done = true; k.slam.z.cancelled = true; k.slam.z.t = -1; }
  k.slam = null; k.pose = null; if (u.el) u.el.holdT = 0;
  for (const L of k.legs) if (L.job) { if (L.job.z && !L.job.z.done) { L.job.z.done = true; L.job.z.cancelled = true; L.job.z.t = -1; } L.job = null; }
  k.fall = { t: SP.collapse.dazed, landed: k.h <= SP.body.low + 1 };
  k.hGoal = SP.body.low; k.hRate = 420;
}
function fallTick(w, u, k, dt) {
  const f = k.fall; if (!f) return false;
  stand(u, dt);
  if (!f.landed && k.h <= SP.body.low + 1) {
    f.landed = true;
    bfx(w, { type: 'spSlam', x: k.gx, y: k.gy, r: SP.slam.r * 0.8, max: 0.75, seed: 9 }); puff(w, k.gx, k.gy, DUST, 14, 220, 7, 0.6); w.shake = Math.max(w.shake, 10);
    bfx(w, { type: 'spDazed', u, max: f.t });
    for (const h of heroesOf(w, u)) { h.focus = u; h.focusT = f.t; }
  }
  addBuff(u, { id: 'spiderDown', dur: 0.15, taken: SP.collapse.taken });
  if ((f.t -= dt) <= 0) k.fall = null;
  return true;
}

// ---------------------------------------------------------------- stomps
// A leg lifts high over a hero near it and stamps down. A small circle where it will land; break the foot first and it
// never comes down (the circle is the foot's: sim.js drops a zone whose maker has fallen).
function stomps(w, u, k, hs, n) {
  const S = SP.stomp, pairs = [];
  const standing = k.legs.filter((L) => !L.broken && !L.job && !L.step).length;
  for (const L of k.legs) {
    if (L.broken || L.job || L.step || !L.foot || !alive(L.foot)) continue;
    const hp = hipOf(u, k, L);
    for (const h of hs) {
      if (offFloor(h)) continue;
      const p0 = lead(h, 0.25), p = inside(w, p0.x, p0.y, 30), d = dist(hp.x, hp.y, p.x, p.y);
      if (d < S.reachMin || d > S.reachMax || dist(k.gx, k.gy, p.x, p.y) < S.clear) continue;
      // only on its own side of the body: a leg never reaches across the body or another leg
      if (Math.abs(wrapAngle(angleTo(k.gx, k.gy, p.x, p.y) - (u.facing + L.th))) > S.sector) continue;
      pairs.push({ L, h, p, d: dist(L.x, L.y, p.x, p.y) });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  const legs = [], marks = new Set(); let done = 0;
  for (const q of pairs) {
    if (done >= n || standing - done <= (k.collapsed ? 0 : 3)) break; // (aloft, three feet stay on the floor)
    if (legs.includes(q.L) || marks.has(q.h) || legs.some((o) => Math.abs(o.i - q.L.i) === 2)) continue; // (never two neighbours on one side at once)
    legs.push(q.L); marks.add(q.h); done++;
    stomp(w, u, k, q.L, q.p);
  }
  if (done) { beginHold(u, S.tell + 0.12, null); }
  return done;
}
function stomp(w, u, k, L, p) {
  const S = SP.stomp, tell = S.tell * (k.phase >= 2 ? 0.9 : 1);
  k.stomps++;
  const z = addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: S.r, t: tell, team: u.team, src: L.foot, kind: 'bone', quiet: true, hit: { dmg: 0 },
    onFire: (w2, z2) => {
      let hit = 0;
      for (const h of heroesOf(w2, u)) if (!offFloor(h) && inZone(z2, h.x, h.y, h.r * 0.5)
        && hurt(w2, h, S.dmg * u.dmgMul, L.foot, { noDodge: true, zone: 'bone', stagger: S.stagger, knock: S.knock, kAngle: angleTo(k.gx, k.gy, h.x, h.y), heavy: true }) > 0) hit++; // (thrown away from the body, not under it)
      if (hit) k.stompHits++;
      bfx(w2, { type: 'spStomp', x: p.x, y: p.y, r: S.r, max: 0.6, seed: Math.round(p.x + p.y) }); puff(w2, p.x, p.y, DUST, 7, 150, 5, 0.4);
      w2.shake = Math.max(w2.shake, 5); k.bobV -= 50;
    } });
  L.step = null; L.job = { type: 'stomp', x0: L.x, y0: L.y, p, z, stuck: S.stuck };
}
function stompTick(w, u, k, L, dt) {
  const j = L.job, S = SP.stomp, z = j.z;
  if (z.cancelled) { L.job = null; return; }
  if (!z.done) { // straight up first, then carried over the mark, a hang at the top, and down in the last seventh
    const q = clamp(1 - z.t / z.max, 0, 1), e0 = clamp((q - 0.25) / 0.45, 0, 1), e = e0 * e0 * (3 - 2 * e0), l0 = clamp(q / 0.36, 0, 1), dr = clamp((q - 0.86) / 0.14, 0, 1);
    L.x = j.x0 + (j.p.x - j.x0) * e; L.y = j.y0 + (j.p.y - j.y0) * e; L.z = S.lift * l0 * l0 * (3 - 2 * l0) * (1 - dr * dr);
    return;
  }
  L.x = j.p.x; L.y = j.p.y; L.z = 0; // driven into the floor a moment, then it walks back to its place
  if ((j.stuck -= dt) <= 0) L.job = null;
}

// ---------------------------------------------------------------- the head slam
// A circle shows on the floor under it and goes with it as it scuttles after its mark; then it stops dead for a split
// second, rears, and drops. Whoever is under it is crushed and thrown clear. If nobody is, it lies there stunned: on
// the floor, where every blade can reach it, a second and more for each broken leg.
function startSlam(w, u, k, hs, t) {
  const S = SP.slam;
  // whoever can't get away first (webbed, stunned, floored); else its mark, or now and then someone else near
  const stuck = hs.filter((h) => !offFloor(h) && dist(h.x, h.y, k.gx, k.gy) < 340 && (h.stunT > 0.3 || h.rootT > 0.3 || h.koT > 0 || h.frozenT > 0.3 || (h.buffs || []).some((b) => b.id === 'webbed' && b.t > 0.4)));
  const near = hs.filter((h) => h !== t && !offFloor(h) && dist(h.x, h.y, k.gx, k.gy) < 300);
  const who = stuck.sort((a, b) => dist(a.x, a.y, k.gx, k.gy) - dist(b.x, b.y, k.gx, k.gy))[0] || (near.length && rand() < S.other ? near[Math.floor(rand() * near.length)] : t);
  const z = addDanger(w, { shape: 'circle', x: k.gx, y: k.gy, r: S.r, t: S.track + S.pause, team: u.team, src: u, kind: 'bone', quiet: true, hit: { dmg: 0 },
    onFire: (w2, z2) => slamLand(w2, u, k, z2) });
  k.slam = { st: 'track', who, z, t: 0, T: 0, missed: false };
  k.slams++;
}
function slamTick(w, u, k, dt) {
  const s = k.slam; if (!s) return false;
  const S = SP.slam, B = SP.body;
  if (s.st === 'track' || s.st === 'pause') {
    const z = s.z; u.winding = true;
    if (z.done) { k.slam = null; return false; } // (it was called off: the slam never landed)
    if (z.t > S.pause) {
      if (!s.who || !alive(s.who) || s.who.ethereal) s.who = heroesOf(w, u).sort((a, b) => dist(a.x, a.y, k.gx, k.gy) - dist(b.x, b.y, k.gx, k.gy))[0] || null;
      const t = s.who;
      if (t && dist(k.gx, k.gy, t.x, t.y) > 10) { walkTo(w, u, t.x + k.ox, t.y + k.oy, S.chase * paceOf(k), dt); turnTo(u, angleTo(k.gx, k.gy, t.x, t.y), SP.turn * 1.4, dt); }
      else stand(u, dt);
      z.x = k.gx + u.vx * dt; z.y = k.gy + u.vy * dt; // the circle goes with it
    } else { // the split second: it stops, rears, and in the last tenth comes down
      s.st = 'pause'; stand(u, dt); u.vx *= 0.6; u.vy *= 0.6;
      if (z.t > S.drop) { k.hGoal = restH(k) + (k.collapsed ? 22 : S.rear); k.hRate = 140; }
      else { k.hGoal = B.low; k.hRate = Math.max(300, (k.h - B.low) / Math.max(0.02, z.t)); }
    }
    return true;
  }
  stand(u, dt);
  if (s.st === 'down') {
    if (s.missed) addBuff(u, { id: 'spiderDown', dur: 0.15, taken: S.taken });
    if ((s.t -= dt) <= 0) { s.st = 'rise'; s.t = S.rise; k.hGoal = restH(k); k.hRate = Math.max(40, (restH(k) - B.low) / S.rise); }
    return true;
  }
  if ((s.t -= dt) <= 0) k.slam = null;
  return true;
}
function slamLand(w, u, k, z) {
  const s = k.slam, S = SP.slam;
  if (!s || s.z !== z || !alive(u)) return;
  if (u.stunT > 0 || u.frozenT > 0 || u.sleepT > 0) { k.slam = null; return; } // held fast in the air: it never came down
  k.h = SP.body.low; k.hGoal = SP.body.low;
  let hit = 0;
  for (const h of heroesOf(w, u)) if (!offFloor(h) && inZone(z, h.x, h.y, h.r * 0.5)
    && hurt(w, h, S.dmg * u.dmgMul, u, { noDodge: true, zone: 'bone', stagger: S.stagger, knock: S.knock, kAngle: angleTo(z.x, z.y, h.x, h.y), heavy: true }) > 0) hit++;
  bfx(w, { type: 'spSlam', x: z.x, y: z.y, r: S.r, max: 0.75, seed: Math.round(z.x + z.y) }); puff(w, z.x, z.y, DUST, 14, 240, 7, 0.6);
  w.shake = Math.max(w.shake, hit ? 11 : 9);
  s.st = 'down'; s.missed = !hit; s.t = s.T = hit ? S.hitRest : S.stun + S.perLeg * brokenOf(k);
  if (hit) k.slamHits++;
  else { bfx(w, { type: 'spDazed', u, max: s.t }); for (const h of heroesOf(w, u)) { h.focus = u; h.focusT = s.t; } } // the party turns on it while it lies there
}

// ---------------------------------------------------------------- web spit
// It rears and spits a ball of web in a high arc at someone far off. Caught under it: stuck fast (the slam looks for
// whoever is stuck). Nobody under it: a web is left on the floor, slowing whoever crosses.
function webMark(u, k, hs) {
  const [a, b] = SP.web.range;
  const ok = hs.filter((h) => { const d = dist(h.x, h.y, k.gx, k.gy); return !offFloor(h) && d > a && d < b && !h.def.boss && !h.def.part && !(h.buffs || []).some((x) => x.id === 'webbed'); });
  return ok.sort((p, q) => dist(q.x, q.y, k.gx, k.gy) - dist(p.x, p.y, k.gx, k.gy))[0] || null;
}
function web(w, u, k, t) {
  const W = SP.web, p0 = lead(t, 0.45), p = inside(w, p0.x, p0.y, 40), tell = W.tell;
  addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: W.r, t: tell, team: u.team, src: null, by: u, kind: 'web', quiet: true, hit: H(u, { dmg: W.dmg }),
    onFire: (w2, z) => {
      let caught = 0;
      for (const h of heroesOf(w2, u)) if (!offFloor(h) && !h.def.boss && !h.def.part && inZone(z, h.x, h.y, h.r * 0.5)) { addBuff(h, { id: 'webbed', dur: W.root, root: true }); h.vx = h.vy = 0; caught++; }
      if (!caught) w2.hazards.push({ type: 'web', x: z.x, y: z.y, r: W.r - 2, t: W.patch, max: W.patch });
      bfx(w2, { type: 'spWebLand', x: z.x, y: z.y, r: W.r, max: 0.5, seed: Math.round(z.x * 3 + z.y) });
    } });
  bfx(w, { type: 'spWebShot', u, x1: p.x, y1: p.y, max: tell, seed: Math.round(p.x + p.y) });
  k.pose = { kind: 'spit', t: tell * 0.55, max: tell * 0.55 };
  beginHold(u, tell * 0.55 + 0.15, angleTo(k.gx, k.gy, p.x, p.y));
}

// ---------------------------------------------------------------- the brood (phase 2)
// Spiderlings let themselves down on threads from under its body. No more than three of its own at once. Each is a
// Hunter Spider from the moment it leaves the belly: it hangs in the air on its thread (u.hop: drawn lifted, its shadow
// on the floor, over the floor's units and under the body) and can do nothing until it lands.
function brood(w, u, k) {
  const B = SP.brood; if (w.stale) return false;
  const mine = w.units.reduce((n, o) => n + (o.calledBy === u && alive(o) ? 1 : 0), 0);
  let n = 0;
  for (let i = 0; i < B.n + (k.phase >= 2 ? 1 : 0); i++) {
    if (mine + n >= B.own || crowd(w, u.team) + n >= 22) break;
    const a = rand() * TAU, d = rrange(52, 92), p = inside(w, k.gx + Math.cos(a) * d, k.gy + Math.sin(a) * d, 50), T = B.drop + i * 0.2;
    const x0 = k.gx - Math.cos(u.facing) * 30, y0 = k.gy - Math.sin(u.facing) * 30;
    const s = spawn(w, 'spiderHunter', x0, y0, { mult: w.mult || 1, hpMul: B.hpMul, scale: B.scale });
    s.aggro = true; s.minion = true; s.calledBy = u; s.summonBy = u; s.facing = s.mvA = a; s.hop = B.high; s.atkT = T + 0.3;
    addBuff(s, { id: 'onThread', dur: T, root: true });
    k.drops.push({ s, x0, y0, x: p.x, y: p.y, t: T, max: T }); n++;
  }
  if (!n) return false;
  k.pose = { kind: 'brood', t: 0.9, max: 0.9 }; beginHold(u, 0.9, null);
  return true;
}
function dropsTick(w, u, k, dt) {
  if (!k.drops.length) return;
  for (const d of k.drops) {
    d.t -= dt;
    const s = d.s; if (!alive(s)) { d.t = 0; continue; }
    const q = clamp(1 - d.t / d.max, 0, 1), e = q * q * (3 - 2 * q);
    place(s, d.x0 + (d.x - d.x0) * e, d.y0 + (d.y - d.y0) * e); s.hop = d.t > 0 ? SP.brood.high * (1 - e) : 0;
  }
  k.drops = k.drops.filter((d) => d.t > 0);
}

// ---------------------------------------------------------------- phase 2, death
function enter(w, u, k, p) {
  notePhase(w, k); u.invulnT = 1.0;
  beginHold(u, 1.1, null); k.pose = { kind: 'hiss', t: 1.1, max: 1.1, rear: true }; k.hGoal = restH(k) + (k.collapsed ? 0 : 14); k.hRate = 90;
  bfx(w, { type: 'spHiss', u, max: 0.7 }); w.shake = Math.max(w.shake, 7);
  again(u, 'brood', 1.0); again(u, 'slam', 3.5);
}
function death(w, u) {
  const k = u.sp;
  for (const o of w.units) if (o.calledBy === u && o.kind === 'spiderHunter' && alive(o)) { o.noLoot = true; kill(w, o, null); }
  // (its feet go with it without a burst each: the animal dies as one, in the picture below)
  if (k) for (const L of k.legs) if (L.foot && alive(L.foot)) { L.foot.partOf = null; L.foot.dead = true; L.foot = null; } // (health left on it: fx.js bursts whatever vanishes at 0)
  endParts(w, u);
  if (k) {
    for (const L of k.legs) for (const z of [L.job && L.job.z]) if (z && !z.done) { z.done = true; z.cancelled = true; z.t = -1; }
    bfx(w, { type: 'spDeath', x: k.gx, y: k.gy, f: u.facing, h: Math.max(SP.body.low, k.h), max: 1.7,
      legs: k.legs.map((L) => ({ i: L.i, x: L.x, y: L.y, broken: L.broken })) });
  }
  puff(w, u.x, u.y, DUST, 18, 240, 7, 0.7); w.shake = Math.max(w.shake, 12);
}

// ---------------------------------------------------------------- its den: an open hall, cobwebs in the corners
function den(w) {
  w.throne = { x: w.W - 330, y: w.H / 2 };
  w.spiderDen = true;
  stage(w, 'spider', drawDenFloor, drawDenAir);
}

export const SPIDER = {
  defs: {
    // (home: the dungeon whose strength it fights at in battle mode, battle.js; bookOpen: its page in the Book is open
    // without meeting it, book.js: it lives in no dungeon yet)
    ikSpider: { team: 'enemy', name: 'Old Longlegs', r: 42, vr: 46, turn: 1.6, accel: 200, face: 1.2, mass: 14, hp: 1400, speed: 40, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 170, coins: [65, 85], boss: true, arena: 'spiderDen', noCorpse: true, labels: ['beast'], home: 'sewers', bookOpen: true,
      res: { stagger: 0.4 }, draw: drawSpider, shadows: spiderShadows, brain, onDeath: death, get portrait() { return spiderPortrait(); } },
    spiderFoot: PART('Old Longlegs (a foot)', { r: SP.leg.footR, vr: 17, mass: 30, hp: 100, labels: ['beast'], draw: drawSpiderFoot }),
  },
  arenas: { spiderDen: den },
};
