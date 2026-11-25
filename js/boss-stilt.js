// The Canopy Idol, the jungle stilt-walker (round 19, lane stilts19). A test boss: not placed in a dungeon yet. Design
// and numbers: docs/BOSS-stilt-idol.md. The designer, on Old Longlegs (js/boss-spider.js, which stays as it is): "This
// spider is good. Cool. Buuut, I was picturing something more on stilts, the head very high up like near where the
// witch would fly, much larger. Try again make this one jungle themed, spider shaped in how it has legs but not a
// spider."
//
// What it is: a great carved wooden idol head, mossed over and crowned with leaves, carried on a yoke of lashed poles
// by six bamboo stilts, each shod with a stone hoof. It is put together the way Old Longlegs is (the same rules, the
// designer liked them), only taller and bigger:
//   the head  one unit, the boss, held ID.body.h over the floor (the Witch's broom flies at 70; this rides at 132). Up
//             there it is on the FLYING layer (tags.js layerOf: u.flyT, kept by the ALOFT hook): only shots reach it and
//             it is drawn over everything on the floor. The unit sits where the head is DRAWN (the floor point under it,
//             k.gx / k.gy, plus its height up the screen), so a shot lands on the head you see; its one shadow lies on
//             the floor point far below (def.shadows, the shared shadow layer). Down from a slam, or collapsed, it is on
//             the floor layer like anyone else.
//   stilts    six, each a hoof planted on the floor (k.legs[i].x / y, its height z while it steps) and a hip on the
//             yoke; the knee between is solved in the drawing (boss-spider-fx.js knee3: a short thigh, a long shin). A
//             hoof stays where it was put until it steps. The gait is two alternating tripods, as Old Longlegs walks.
//   hooves    each stilt's hoof is a unit of its own (boss-kit.js part, a pool): the hit box the melee heroes reach. A
//             blow on a hoof passes a share on to the head. A hoof destroyed breaks its stilt: the bamboo snaps, hangs
//             and drags; it can't stomp or carry. Each broken stilt slows the walk and lengthens the time it lies
//             stunned after a missed slam. With four broken it can't stand: it collapses and fights from the floor.
// Its own two moves: a liana let down on someone far off, who is hauled in under it; seed pods shaken out of its crown,
// each a sproutling. Its looks: js/boss-stilt-fx.js (one figure, one outline: boss-draw.js).
import { alive, hurt, puff, addDanger, addBuff, spawn, kill, inZone, offFloor } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange } from './util.js';
import { hold, beginHold, due, again, stand, turnTo, crowd } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, lead, part, endParts, PART, place, notePhase, inside, stage, bfx, canDrag, holdFast, TEST_MOVE } from './boss-kit.js';
import { up } from './boss-draw.js';
import { drawIdol, drawIdolFoot, drawGladeFloor, drawGladeAir, idolShadows, idolPortrait } from './boss-stilt-fx.js';

export const ID = {
  hp: 1550,                       // (Old Longlegs: 1400. With 1400 the bench party won 40 fights of 40)
  body: { h: 132, low: 10, air: 34, sc: 330, big: 1.15 },   // how high the head is carried; lying on the floor; flying from this height up; how much bigger it is drawn for being nearer (1 + h / sc); the head's own size
  leg: { l1: 80, l2: 165, restR: 180, hpK: 0.1, share: 0.85, more: 0.25,   // thigh, shin; where a hoof rests; a hoof's health (of the head's); what a blow on a hoof passes on (and a second hoof caught by the same blow)
    footR: 22, stepDist: 38, settle: 18, over: 0.55, stepT: 0.32, lift: 34, drag: 150 },
  slow: [1, 0.9, 0.78, 0.66],     // its pace with 0, 1, 2, 3 stilts broken
  collapseAt: 4, crawl: 0.42,     // this many broken: it can't stand; its pace on its belly
  keep: 150, turn: 0.85,          // how far it stands off its mark (a front stilt's reach); how fast it turns (rad/s)
  edge: 96,                       // the head's picture is kept this far inside the room's walls
  stomp: { r: 70, tell: 0.74, dmg: 46, stagger: 30, knock: 170, lift: 104, stuck: 0.5, reachMin: 70, reachMax: 184, clear: 84, sector: 0.62, cd: [1.7, 2.5] },
  slam: { r: 110, track: 1.5, pause: 0.3, drop: 0.16, rear: 18, dmg: 105, knock: 340, stagger: 40, chase: 2.3,
    stun: 1.0, perLeg: 0.3, hitRest: 0.45, rise: 0.7, taken: 1.25, cd: [5.5, 7], other: 0.4 },
  vine: { r: 56, tell: 0.9, dmg: 22, haul: 0.5, off: 64, root: 0.8, cd: [9, 12], range: [190, 660] },
  pods: { n: 3, r: 52, tell: 1.2, drop: 0.45, dmg: 30, cd: [13, 16], hatch: 1, own: 3, scale: 0.9, hpMul: 0.45, near: [70, 150] },
  collapse: { dazed: 1.8, taken: 1.25 },
};
export const PHASE_AT = [1, 0.6];
const WAKE = 500, DUST = '#D9CDB0', LEAF = '#6BA544';
// th: where its hoof rests round the floor point (0 is straight ahead); hx, hy: its hip on the yoke (ahead, to the
// right); side: -1 left, 1 right (its knee bends out to its own side); grp: its tripod.
export const LEGS = [
  { name: 'front left', th: -0.62, hx: 36, hy: -50, side: -1, grp: 0 }, { name: 'front right', th: 0.62, hx: 36, hy: 50, side: 1, grp: 1 },
  { name: 'middle left', th: -1.57, hx: 0, hy: -56, side: -1, grp: 1 }, { name: 'middle right', th: 1.57, hx: 0, hy: 56, side: 1, grp: 0 },
  { name: 'rear left', th: -2.5, hx: -36, hy: -50, side: -1, grp: 0 }, { name: 'rear right', th: 2.5, hx: -36, hy: 50, side: 1, grp: 1 },
];
const BREAK_ORDER = [1, 2, 4, 0, 5, 3]; // (?bossmove=legsN: which stilts are broken for a clip)

export const brokenOf = (k) => k.legs.reduce((n, L) => n + (L.broken ? 1 : 0), 0);
const paceOf = (k) => (k.collapsed ? ID.crawl : ID.slow[Math.min(brokenOf(k), ID.slow.length - 1)]);
const restH = (k) => (k.collapsed ? ID.body.low : ID.body.h);
// where a stilt's hoof belongs on the floor, and where its hip is (x, y on the floor under it, z its height)
export const restOf = (u, k, L) => ({ x: k.gx + Math.cos(u.facing + L.th) * L.R, y: k.gy + Math.sin(u.facing + L.th) * L.R });
export function hipOf(u, k, L) {
  const c = Math.cos(u.facing), s = Math.sin(u.facing);
  return { x: k.gx + k.sx + c * L.hx - s * L.hy, y: k.gy + k.sy + s * L.hx + c * L.hy, z: Math.max(ID.body.low, k.h + k.bob) };
}

// Up in the air: flying (only shots reach it), and out of a blade's reach, so the fighters go for its hooves (sim.js
// chooseTarget reads a unit's outOfReach list). Runs every step, stunned or not (sim.js statusTick: a hook's tick).
const ALOFT = {
  tick(w, u) {
    const k = u.si; if (!k || k.h < ID.body.air) return;
    u.flyT = Math.max(u.flyT || 0, 0.12);
    // (and the other way about: those who shoot have the head to shoot at, and leave the hooves to the blades)
    for (const h of heroesOf(w, u)) {
      const m = h.outOfReach || (h.outOfReach = new Map());
      if (h.def.role !== 'ranged') m.set(u, w.time + 0.4);
      else for (const L of k.legs) if (L.foot) m.set(L.foot, w.time + 0.4);
    }
  },
  struck(w, u) { if (u.si) u.si.hitT = w.time; }, // (a blow on the head itself: boss-kit.js part() lights u.flashT for a blow on a hoof too)
};

function brain(w, u, dt) {
  const k = u.si || (u.si = make(w, u));
  steady(u); stage(w, 'stiltIdol', drawGladeFloor, drawGladeAir);
  w.bossLog = () => `phase ${k.phase} at ${Math.round(100 * Math.max(0, u.hp) / u.maxHp)}%, ${brokenOf(k)} legs broken${k.collapsed ? ' (collapsed ' + Math.round(k.collapsedAt) + 's)' : ''}, slams ${k.slamHits}/${k.slams}, stomps ${k.stompHits}/${k.stomps}, vines ${k.vineHits}/${k.vines}, pods ${k.podHits}/${k.podN}${k.phaseT ? ' (' + k.phaseT.map((t) => Math.round(t)).join('/') + 's)' : ''}`;
  // the floor point under it: where the sim left the unit, less its height up the screen
  k.gx = u.x - k.ox; k.gy = u.y - k.oy; k.t += dt;
  for (const L of k.legs) if (L.foot && !alive(L.foot)) breakLeg(w, u, k, L);
  if (!k.collapsed && brokenOf(k) >= ID.collapseAt) collapse(w, u, k);
  haulsTick(w, u, k, dt);
  act(w, u, k, dt);
  // its height, its stilts, and the unit put back where the head shows
  k.h += clamp(k.hGoal - k.h, -k.hRate * dt, k.hRate * dt);
  if (!k.slam && !k.fall && !(k.pose && k.pose.rear)) { k.hGoal = restH(k); k.hRate = 190; }
  if (k.pose && (k.pose.t -= dt) <= 0) k.pose = null;
  // the floor point stays where the head's picture and its shadow are both inside the walls
  { const [ux, uy] = up(), o = k.h * 0.9, E = ID.edge, m = 60;
    const x1 = clamp(k.gx, Math.max(m, E - ux * o), Math.min(w.W - m, w.W - E - ux * o)), y1 = clamp(k.gy, Math.max(m, E - uy * o), Math.min(w.H - m, w.H - E - uy * o));
    if (x1 !== k.gx) { k.gx = x1; u.vx = u.dvx = 0; } if (y1 !== k.gy) { k.gy = y1; u.vy = u.dvy = 0; } } // (held there, it isn't walking: its hooves don't march on the spot)
  legsTick(w, u, k, dt);
  const [ux, uy] = up(); k.ox = ux * k.h * 0.9; k.oy = uy * k.h * 0.9;
  u.x = k.gx + k.ox; u.y = k.gy + k.oy; k.f0 = u.facing;
  const glare = k.slam && (k.slam.st === 'track' || k.slam.st === 'pause') ? 1 : k.pose ? 0.6 : 0;
  k.glare += (glare - k.glare) * Math.min(1, dt * 8);
  // the pods hanging behind its crown: each leaves as it starts to fall, and they grow back
  while (k.podDrops.length && w.time >= k.podDrops[0]) { k.podDrops.shift(); k.podsOn = Math.max(0, Math.floor(k.podsOn) - 1); }
  if (!k.podDrops.length && k.podsOn < 3) k.podsOn = Math.min(3, k.podsOn + dt / 3);
  return true;
}

function make(w, u) {
  const k = { phase: 0, t: 0, gx: u.x, gy: u.y, ox: 0, oy: 0, h: ID.body.h, hGoal: ID.body.h, hRate: 190, bob: 0, bobV: 0, sx: 0, sy: 0, f0: u.facing,
    legs: LEGS.map((d, i) => ({ ...d, i, R: ID.leg.restR, x: 0, y: 0, z: 0, foot: null, broken: false, bt: 0, step: null, job: null, hvx: 0, hvy: 0, hx0: 0, hy0: 0, err: 0, along: 0, stillT: 0, sw: 0, swV: 0 })),
    slam: null, fall: null, pose: null, collapsed: false, collapsedAt: 0, hauls: [], podsOn: 3, podDrops: [], glare: 0, hitT: -9, blowAt: -1,
    slams: 0, slamHits: 0, stomps: 0, stompHits: 0, vines: 0, vineHits: 0, podN: 0, podHits: 0 };
  // (the unit is where the head shows; the first tick finds the floor point under it)
  const [ux, uy] = up(); k.ox = ux * k.h * 0.9; k.oy = uy * k.h * 0.9; k.gx = u.x - k.ox; k.gy = u.y - k.oy;
  for (const L of k.legs) {
    const r = restOf(u, k, L); L.x = r.x; L.y = r.y; L.hx0 = r.x; L.hy0 = r.y;
    // (one blow that catches several hooves, a spin under it, passes its full share on once and a quarter for each more)
    L.foot = part(w, u, 'stiltFoot', r.x, r.y, { pool: true, hp: u.maxHp * ID.leg.hpK, share: () => { const first = k.blowAt !== w.time; k.blowAt = w.time; return ID.leg.share * (first ? 1 : ID.leg.more); } });
    L.foot.leg = L; L.foot.shadowK = 0;
  }
  if (!u.trinketHooks.includes(ALOFT)) u.trinketHooks = [...u.trinketHooks, ALOFT];
  return k;
}

function act(w, u, k, dt) {
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 0.8, null); k.pose = { kind: 'roar', t: 0.8, max: 0.8 }; bfx(w, { type: 'idRoar', u, max: 0.6 }); notePhase(w, k); })) return;
  if (TEST_MOVE && !k.tested) { k.tested = true; testMove(w, u, k, TEST_MOVE); }
  if (fallTick(w, u, k, dt)) return;
  if (slamTick(w, u, k, dt)) return;
  if (hold(u, dt)) return;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return;
  const t = pickTarget(w, u, k, dt, 1.1, (h) => dist(h.x, h.y, k.gx, k.gy) - (h === u.target ? 60 : 0));
  if (!t) { stand(u, dt); return; }
  const hs = heroesOf(w, u), K = k.phase >= 2 ? 0.82 : 1, pace = paceOf(k);
  if (due(u, 'slam', dt, 4.5)) { again(u, 'slam', ...ID.slam.cd.map((x) => x * K)); startSlam(w, u, k, hs, t); return; }
  if (due(u, 'pods', dt, 6)) { again(u, 'pods', ...ID.pods.cd.map((x) => x * K)); if (pods(w, u, k, hs)) return; }
  if (due(u, 'vine', dt, 3)) {
    const who = vineMark(u, k, hs);
    if (who) { again(u, 'vine', ...ID.vine.cd.map((x) => x * K)); vine(w, u, k, who); return; }
    again(u, 'vine', 1.5);
  }
  if (due(u, 'stomp', dt, 1.2)) {
    if (stomps(w, u, k, hs, k.phase >= 2 ? 3 : 2)) { again(u, 'stomp', ...ID.stomp.cd.map((x) => x * K)); return; }
    again(u, 'stomp', 0.35);
  }
  // aloft it stands off its mark by a front stilt's reach; on its belly it drags itself right up to them
  const d = dist(k.gx, k.gy, t.x, t.y), at = angleTo(k.gx, k.gy, t.x, t.y), near = k.collapsed ? u.r + t.r + 20 : ID.keep;
  if (d > near + 16) walkTo(w, u, t.x + k.ox, t.y + k.oy, pace, dt); else stand(u, dt);
  turnTo(u, at, ID.turn * (0.5 + 0.5 * pace), dt);
}
function testMove(w, u, k, m) { // ?bossmove=walk|slam|stomp|vine|pods|legs1..legs6|legs3m: that first (clips, the bench)
  const only = (key, t) => { for (const o of ['slam', 'vine', 'stomp', 'pods']) again(u, o, o === key ? t : 40); };
  if (m === 'slam') only('slam', 0.8);
  if (m === 'stomp') only('stomp', 0.4);
  if (m === 'vine') only('vine', 0.6);
  if (m === 'pods') only('pods', 0.6);
  if (m === 'walk') only('', 0);
  const n = /^legs(\d)(m?)$/.exec(m); // legsN: N stilts broken and no moves (to watch it walk); legsNm: N broken, moves as ever
  if (n) { if (!n[2]) only('', 0); for (const i of BREAK_ORDER.slice(0, +n[1])) { const L = k.legs[i]; if (L.foot) { L.foot.partOf = null; kill(w, L.foot, null); } } }
}

// ---------------------------------------------------------------- the stilts
// Every tick: where each hoof belongs and how fast that spot moves over the floor (the walk and the turning); hooves in
// the air go on with their step; planted hooves stay put; a tripod whose hooves have fallen a stride behind steps, while
// the other tripod stands. A broken stilt drags its hoof. A stomping stilt is its job's. (Old Longlegs' gait, with a
// stilt-walker's longer, slower stride.)
function legsTick(w, u, k, dt) {
  const G = ID.leg, om = wrapAngle(u.facing - k.f0) / Math.max(dt, 1e-4);
  const down = !!k.fall || (!!k.slam && k.slam.st !== 'track' && k.slam.st !== 'pause');   // lying or getting up: nobody steps (stopped before the drop, the hooves it left behind catch up)
  const live = k.legs.filter((L) => !L.broken), air = [0, 0];
  for (const L of live) if (L.step || (L.job && L.z > 1)) air[L.grp]++;
  for (const L of k.legs) {
    const r = restOf(u, k, L), rx = r.x - k.gx, ry = r.y - k.gy, a = Math.min(1, dt * 12);
    L.hvx += (u.vx - om * ry - L.hvx) * a; L.hvy += (u.vy + om * rx - L.hvy) * a; L.hx0 = r.x; L.hy0 = r.y;
  }
  for (const L of k.legs) {
    if (L.broken) { dragLeg(w, u, k, L, dt); continue; }
    if (L.job) { stompTick(w, u, k, L, dt); continue; }
    const s = L.step; if (!s) { L.z = 0; continue; }
    // a step: the hoof swings in an arc to a spot ahead of where it belongs (the spot moves with the body: it lands on it)
    const sp = Math.hypot(L.hvx, L.hvy), mv = sp > 12, e2 = Math.min(1, dt * 10);
    s.ovx += ((mv ? L.hvx / sp * s.over : 0) - s.ovx) * e2; s.ovy += ((mv ? L.hvy / sp * s.over : 0) - s.ovy) * e2;
    s.t += dt;
    const q = clamp(s.t / s.T, 0, 1), e = q * q * (3 - 2 * q), tg = footSpot(w, L.hx0 + s.ovx, L.hy0 + s.ovy);
    L.x = s.x0 + (tg.x - s.x0) * e; L.y = s.y0 + (tg.y - s.y0) * e; L.z = Math.sin(Math.PI * q) * s.lift;
    if (q >= 1) { L.step = null; L.z = 0; L.x = tg.x; L.y = tg.y; for (let i = 0; i < 2; i++) w.particles.push({ x: L.x, y: L.y, vx: rrange(-22, 22), vy: rrange(-22, 22), life: 0.32, max: 0.32, size: 4, color: 'rgba(217,205,176,0.55)' }); }
  }
  if (!down) {
    const need = [false, false], lag = [0, 0];
    for (const L of live) {
      if (L.step || L.job) continue;
      const ex = L.hx0 - L.x, ey = L.hy0 - L.y, d = Math.hypot(ex, ey), sp = Math.hypot(L.hvx, L.hvy), mv = sp > 12;
      L.err = d; L.along = mv ? (ex * L.hvx + ey * L.hvy) / sp : 0; L.stillT = mv ? 0 : L.stillT + dt; L.mv = mv;
      const hp = hipOf(u, k, L);
      L.urgent = Math.hypot(L.x - hp.x, L.y - hp.y, hp.z) > (G.l1 + G.l2) * 0.95; // stretched as far as it goes: it steps now
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
        if (air[0] + air[1] >= maxAir) break; // (however far it is stretched: half its stilts stay on the floor)
        startStep(k, L, n++); air[g]++;
      }
      break; // one tripod a tick
    }
  }
  // the head rides on them: it dips while a tripod is in the air and leans after its hooves (a long sway: it is a long way up)
  const lifted = live.length ? (air[0] + air[1]) / live.length : 0;
  k.bobV += ((-12 * lifted - k.bob) * 90 - k.bobV * 9) * dt; k.bob += k.bobV * dt;
  let mx = 0, my = 0, n = 0; for (const L of live) { mx += L.x - L.hx0; my += L.y - L.hy0; n++; }
  const a = Math.min(1, dt * 5); k.sx += ((n ? mx / n * 0.34 : 0) - k.sx) * a; k.sy += ((n ? my / n * 0.34 : 0) - k.sy) * a;
  for (const L of k.legs) if (L.foot && alive(L.foot)) { place(L.foot, L.x, L.y, angleTo(k.gx, k.gy, L.x, L.y)); L.foot.hop = L.z; L.foot.shadowK = 0; }
}
function startStep(k, L, n) {
  const G = ID.leg, sp = Math.hypot(L.hvx, L.hvy);
  // how far ahead of its place it lands: so the other tripod's turn comes half way through this one's stride (an even
  // one-two, not two quick steps and a wait)
  const others = k.legs.filter((o) => !o.broken && o.grp !== L.grp && !o.step && !o.job);
  let over = G.over;
  if (others.length) over = clamp((G.over + 1) / 2 - others.reduce((a, o) => a + (o.along || 0), 0) / others.length / G.stepDist, 0.3, 1);
  L.step = { t: -n * 0.045, T: clamp(G.stepT * (1.15 - sp / 300), 0.2, 0.36), x0: L.x, y0: L.y, over: over * G.stepDist, ovx: 0, ovy: 0, lift: G.lift + Math.min(20, L.err * 0.3) };
}
// a hoof never comes down outside the room or inside a pillar
function footSpot(w, x, y) {
  const p = inside(w, x, y, 14);
  for (const o of w.pillars) { const d = dist(p.x, p.y, o.x, o.y), m = o.r + 11; if (d < m && d > 0) { p.x = o.x + (p.x - o.x) / d * m; p.y = o.y + (p.y - o.y) / d * m; } }
  return p;
}
// A broken stilt is snapped below the knee: what is left on the yoke sticks out and hangs; the rest of the shin lies on
// the floor with the hoof on it, on a strand of the lashing, pulled along once the slack is gone, and nudged back out to
// its own side if the head walks over it. The hanging stump swings as the head moves (L.sw: a pendulum, for the
// drawing).
function dragLeg(w, u, k, L, dt) {
  const hp = hipOf(u, k, L), dx = L.x - hp.x, dy = L.y - hp.y, d = Math.hypot(dx, dy) || 1, max = ID.leg.drag, min = 96;
  if (d > max) { L.x = hp.x + dx / d * max; L.y = hp.y + dy / d * max; if (rand() < dt * 7) w.particles.push({ x: L.x, y: L.y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 3.2, color: 'rgba(217,205,176,0.5)' }); }
  else if (d < min) { const a = u.facing + L.th, e = Math.min(1, dt * 5); L.x += (hp.x + Math.cos(a) * min - L.x) * e; L.y += (hp.y + Math.sin(a) * min - L.y) * e; }
  L.z = 0;
  const sp = Math.hypot(L.hvx, L.hvy);
  L.swV += ((Math.min(1, sp / 120) * Math.sin(k.t * 5.2 + L.i) * 0.5 - L.sw) * 40 - L.swV * 4) * dt; L.sw += L.swV * dt;
}
function breakLeg(w, u, k, L) {
  L.foot = null; L.broken = true; L.job = null; L.step = null; L.z = 0; L.bt = w.time; L.swV = 5;
  bfx(w, { type: 'idLegBreak', x: L.x, y: L.y, a: angleTo(k.gx, k.gy, L.x, L.y), max: 0.9, seed: L.i * 13 + 5 });
  puff(w, L.x, L.y, DUST, 10, 150, 6, 0.5); w.shake = Math.max(w.shake, 7);
  k.bobV -= 110; // it lurches
  if (!k.slam && !k.fall && alive(u)) { const e = u.el || (u.el = {}); e.holdT = Math.max(e.holdT || 0, 0.4); }
}
// Four stilts gone: it can't stand. It comes down where it is and lies dazed; from then on it fights from the floor.
function collapse(w, u, k) {
  k.collapsed = true; k.collapsedAt = w.time;
  if (k.slam && k.slam.z && !k.slam.z.done) { k.slam.z.done = true; k.slam.z.cancelled = true; k.slam.z.t = -1; }
  k.slam = null; k.pose = null; if (u.el) u.el.holdT = 0;
  for (const L of k.legs) if (L.job) { if (L.job.z && !L.job.z.done) { L.job.z.done = true; L.job.z.cancelled = true; L.job.z.t = -1; } L.job = null; }
  k.fall = { t: ID.collapse.dazed, landed: k.h <= ID.body.low + 1 };
  if (!k.fall.landed) fallFx(w, u, k);
  k.hGoal = ID.body.low; k.hRate = 520;
}
function fallTick(w, u, k, dt) {
  const f = k.fall; if (!f) return false;
  stand(u, dt);
  if (!f.landed && k.h <= ID.body.low + 1) {
    f.landed = true;
    bfx(w, { type: 'idSlam', x: k.gx, y: k.gy, r: ID.slam.r * 0.8, max: 0.8, seed: 9 }); puff(w, k.gx, k.gy, DUST, 14, 220, 7, 0.6); w.shake = Math.max(w.shake, 11);
    bfx(w, { type: 'idDazed', u, max: f.t });
    for (const h of heroesOf(w, u)) { h.focus = u; h.focusT = f.t; }
  }
  addBuff(u, { id: 'idolDown', dur: 0.15, taken: ID.collapse.taken });
  if ((f.t -= dt) <= 0) k.fall = null;
  return true;
}
// It has left its height: leaves hang in the air where its crown was and flutter down after it (the drawing's way of
// saying how far it fell).
function fallFx(w, u, k) { bfx(w, { type: 'idFall', x: k.gx + k.sx, y: k.gy + k.sy, h: k.h, f: u.facing, max: 1.5, seed: Math.round(k.gx + k.gy + w.time * 10) }); }

// ---------------------------------------------------------------- stomps
// A stilt lifts high over a hero near it and stamps down. A small circle where it will land; break the hoof first and
// it never comes down (the circle is the hoof's: sim.js drops a zone whose maker has fallen).
function stomps(w, u, k, hs, n) {
  const S = ID.stomp, pairs = [];
  const standing = k.legs.filter((L) => !L.broken && !L.job && !L.step).length;
  for (const L of k.legs) {
    if (L.broken || L.job || L.step || !L.foot || !alive(L.foot)) continue;
    const hp = hipOf(u, k, L);
    for (const h of hs) {
      if (offFloor(h)) continue;
      const p0 = lead(h, 0.25), p = inside(w, p0.x, p0.y, 30), d = dist(hp.x, hp.y, p.x, p.y);
      if (d < S.reachMin || d > Math.min(S.reachMax, Math.sqrt(Math.max(0, (ID.leg.l1 + ID.leg.l2) ** 2 * 0.9 - hp.z * hp.z))) || dist(k.gx, k.gy, p.x, p.y) < S.clear) continue;
      // only on its own side of the body: a stilt never reaches across the body or another stilt
      if (Math.abs(wrapAngle(angleTo(k.gx, k.gy, p.x, p.y) - (u.facing + L.th))) > S.sector) continue;
      pairs.push({ L, h, p, d: dist(L.x, L.y, p.x, p.y) });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  const legs = [], marks = new Set(); let done = 0;
  for (const q of pairs) {
    if (done >= n || standing - done <= (k.collapsed ? 0 : 3)) break; // (aloft, three hooves stay on the floor)
    if (legs.includes(q.L) || marks.has(q.h) || legs.some((o) => Math.abs(o.i - q.L.i) === 2)) continue; // (never two neighbours on one side at once)
    legs.push(q.L); marks.add(q.h); done++;
    stomp(w, u, k, q.L, q.p);
  }
  if (done) { beginHold(u, S.tell + 0.12, null); }
  return done;
}
function stomp(w, u, k, L, p) {
  const S = ID.stomp, tell = S.tell * (k.phase >= 2 ? 0.9 : 1);
  k.stomps++;
  const z = addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: S.r, t: tell, team: u.team, src: L.foot, kind: 'bone', quiet: true, hit: { dmg: 0 },
    onFire: (w2, z2) => {
      let hit = 0;
      for (const h of heroesOf(w2, u)) if (!offFloor(h) && inZone(z2, h.x, h.y, h.r * 0.5)
        && hurt(w2, h, S.dmg * u.dmgMul, L.foot, { noDodge: true, zone: 'bone', stagger: S.stagger, knock: S.knock, kAngle: angleTo(k.gx, k.gy, h.x, h.y), heavy: true }) > 0) hit++; // (thrown away from the body, not under it)
      if (hit) k.stompHits++;
      bfx(w2, { type: 'idStomp', x: p.x, y: p.y, r: S.r, max: 0.6, seed: Math.round(p.x + p.y) }); puff(w2, p.x, p.y, DUST, 7, 150, 5, 0.4);
      w2.shake = Math.max(w2.shake, 6); k.bobV -= 60;
    } });
  // where it hangs before it comes down: out past the mark with the stilt nearly straight (lifted close in, its knee
  // stood up over the head and the shin crossed its face)
  const hp = hipOf(u, k, L), d = dist(hp.x, hp.y, p.x, p.y) || 1, md = clamp(d + 34, 150, 196);
  L.step = null; L.job = { type: 'stomp', x0: L.x, y0: L.y, p, z, stuck: S.stuck, mx: hp.x + (p.x - hp.x) / d * md, my: hp.y + (p.y - hp.y) / d * md };
}
function stompTick(w, u, k, L, dt) {
  const j = L.job, S = ID.stomp, z = j.z;
  if (z.cancelled) { L.job = null; return; }
  if (!z.done) { // lifted up and out, a hang at the top, and down on the mark in the last sixth
    const q = clamp(1 - z.t / z.max, 0, 1), l0 = clamp(q / 0.42, 0, 1), e = l0 * l0 * (3 - 2 * l0), dr = clamp((q - 0.84) / 0.16, 0, 1), d2 = dr * dr;
    const ax = j.x0 + (j.mx - j.x0) * e, ay = j.y0 + (j.my - j.y0) * e;
    L.x = ax + (j.p.x - ax) * d2; L.y = ay + (j.p.y - ay) * d2; L.z = S.lift * e * (1 - d2);
    return;
  }
  L.x = j.p.x; L.y = j.p.y; L.z = 0; // driven into the floor a moment, then it walks back to its place
  if ((j.stuck -= dt) <= 0) L.job = null;
}

// ---------------------------------------------------------------- the head slam
// A circle shows on the floor under it, on its shadow, and goes with it as it strides after its mark; then it stops
// dead for a split second, rears, and the head drops the whole way down between its stilts. Whoever is under it is
// crushed and thrown clear. If nobody is, it lies there stunned: on the floor, where every blade can reach it, a second
// and more for each broken stilt.
function startSlam(w, u, k, hs, t) {
  const S = ID.slam;
  // whoever can't get away first (tangled, stunned, floored); else its mark, or now and then someone else near
  const stuck = hs.filter((h) => !offFloor(h) && dist(h.x, h.y, k.gx, k.gy) < 360 && (h.stunT > 0.3 || h.rootT > 0.3 || h.koT > 0 || h.frozenT > 0.3 || (h.buffs || []).some((b) => b.id === 'vined' && b.t > 0.4)));
  const near = hs.filter((h) => h !== t && !offFloor(h) && dist(h.x, h.y, k.gx, k.gy) < 320);
  const who = stuck.sort((a, b) => dist(a.x, a.y, k.gx, k.gy) - dist(b.x, b.y, k.gx, k.gy))[0] || (near.length && rand() < S.other ? near[Math.floor(rand() * near.length)] : t);
  const z = addDanger(w, { shape: 'circle', x: k.gx, y: k.gy, r: S.r, t: S.track + S.pause, team: u.team, src: u, kind: 'bone', quiet: true, hit: { dmg: 0 },
    onFire: (w2, z2) => slamLand(w2, u, k, z2) });
  k.slam = { st: 'track', who, z, t: 0, T: 0, missed: false, fell: false };
  k.slams++;
}
function slamTick(w, u, k, dt) {
  const s = k.slam; if (!s) return false;
  const S = ID.slam, B = ID.body;
  if (s.st === 'track' || s.st === 'pause') {
    const z = s.z; u.winding = true;
    if (z.done) { k.slam = null; return false; } // (it was called off: the slam never landed)
    if (z.t > S.pause) {
      if (!s.who || !alive(s.who) || s.who.ethereal) s.who = heroesOf(w, u).sort((a, b) => dist(a.x, a.y, k.gx, k.gy) - dist(b.x, b.y, k.gx, k.gy))[0] || null;
      const t = s.who;
      if (t && dist(k.gx, k.gy, t.x, t.y) > 10) { walkTo(w, u, t.x + k.ox, t.y + k.oy, S.chase * paceOf(k), dt); turnTo(u, angleTo(k.gx, k.gy, t.x, t.y), ID.turn * 1.4, dt); }
      else stand(u, dt);
      z.x = k.gx + u.vx * dt; z.y = k.gy + u.vy * dt; // the circle goes with it
    } else { // the split second: it stops, rears, and in the last sixth of a second comes down
      s.st = 'pause'; stand(u, dt); u.vx *= 0.6; u.vy *= 0.6;
      z.x = k.gx; z.y = k.gy;
      if (z.t > S.drop) { k.hGoal = restH(k) + (k.collapsed ? 26 : S.rear); k.hRate = 150; }
      else { if (!s.fell) { s.fell = true; if (k.h > 60) fallFx(w, u, k); } k.hGoal = B.low; k.hRate = Math.max(300, (k.h - B.low) / Math.max(0.02, z.t)); }
    }
    return true;
  }
  stand(u, dt);
  if (s.st === 'down') {
    if (s.missed) addBuff(u, { id: 'idolDown', dur: 0.15, taken: S.taken });
    if ((s.t -= dt) <= 0) { s.st = 'rise'; s.t = k.collapsed ? 0.4 : S.rise; k.hGoal = restH(k); k.hRate = Math.max(40, (restH(k) - B.low) / s.t); }
    return true;
  }
  if ((s.t -= dt) <= 0) k.slam = null;
  return true;
}
function slamLand(w, u, k, z) {
  const s = k.slam, S = ID.slam;
  if (!s || s.z !== z || !alive(u)) return;
  if (u.stunT > 0 || u.frozenT > 0 || u.sleepT > 0) { k.slam = null; return; } // held fast in the air: it never came down
  k.h = ID.body.low; k.hGoal = ID.body.low;
  let hit = 0;
  for (const h of heroesOf(w, u)) if (!offFloor(h) && inZone(z, h.x, h.y, h.r * 0.5)
    && hurt(w, h, S.dmg * u.dmgMul, u, { noDodge: true, zone: 'bone', stagger: S.stagger, knock: S.knock, kAngle: angleTo(z.x, z.y, h.x, h.y), heavy: true }) > 0) hit++;
  bfx(w, { type: 'idSlam', x: z.x, y: z.y, r: S.r, max: 0.8, seed: Math.round(z.x + z.y) }); puff(w, z.x, z.y, DUST, 16, 260, 7, 0.6); puff(w, z.x, z.y, LEAF, 8, 200, 5, 0.7);
  w.shake = Math.max(w.shake, hit ? 13 : 11);
  s.st = 'down'; s.missed = !hit; s.t = s.T = hit ? S.hitRest : S.stun + S.perLeg * brokenOf(k);
  if (hit) k.slamHits++;
  else { bfx(w, { type: 'idDazed', u, max: s.t }); for (const h of heroesOf(w, u)) { h.focus = u; h.focusT = s.t; } } // the party turns on it while it lies there
}

// ---------------------------------------------------------------- the liana
// A liana uncoils from under the head and drops on someone standing far off: a green circle where they will be. Caught:
// hauled in across the floor to just under it and left tangled a moment (the slam looks for whoever is stuck). It is how
// it gets at those who stand back and shoot.
function vineMark(u, k, hs) {
  const [a, b] = ID.vine.range;
  const ok = hs.filter((h) => { const d = dist(h.x, h.y, k.gx, k.gy); return !offFloor(h) && d > a && d < b && !h.def.boss && !h.def.part && !(h.buffs || []).some((x) => x.id === 'vined'); });
  return ok.sort((p, q) => dist(q.x, q.y, k.gx, k.gy) - dist(p.x, p.y, k.gx, k.gy))[0] || null;
}
function vine(w, u, k, t) {
  const V = ID.vine, p0 = lead(t, 0.45), p = inside(w, p0.x, p0.y, 40), tell = V.tell;
  k.vines++;
  const f = bfx(w, { type: 'idVine', u, x1: p.x, y1: p.y, max: tell + 0.12, tell, seed: Math.round(p.x + p.y) });
  addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: V.r, t: tell, team: u.team, src: u, kind: 'bone', quiet: true, hit: H(u, { dmg: V.dmg }),
    onFire: (w2, z) => {
      let caught = 0;
      for (const h of heroesOf(w2, u)) {
        if (offFloor(h) || h.def.boss || h.def.part || !inZone(z, h.x, h.y, h.r * 0.5)) continue;
        caught++;
        if (!canDrag(h)) { addBuff(h, { id: 'vined', dur: V.root, root: true }); continue; }
        // hauled to a spot just short of the floor point under it, on the side they came from
        const a = angleTo(k.gx, k.gy, h.x, h.y), q = inside(w2, k.gx + Math.cos(a) * V.off, k.gy + Math.sin(a) * V.off, 40);
        k.hauls.push({ h, x0: h.x, y0: h.y, x1: q.x, y1: q.y, t: 0, T: V.haul });
        bfx(w2, { type: 'idHaul', u, h, max: V.haul + 0.25 });
      }
      if (caught) k.vineHits++;
      bfx(w2, { type: 'idVineLand', x: z.x, y: z.y, r: V.r, max: 0.5, hit: caught > 0, seed: Math.round(z.x * 3 + z.y) });
      puff(w2, z.x, z.y, caught ? LEAF : DUST, 6, 120, 5, 0.4);
    } });
  f.z = true;
  k.pose = { kind: 'cast', t: tell, max: tell };
  beginHold(u, tell * 0.6, angleTo(k.gx, k.gy, p.x, p.y));
}
function haulsTick(w, u, k, dt) {
  if (!k.hauls.length) return;
  for (const j of k.hauls) {
    const h = j.h; j.t += dt;
    if (!alive(h) || !alive(u)) { j.t = j.T + 1; continue; }
    const q = clamp(j.t / j.T, 0, 1), e = q * q * (3 - 2 * q);
    holdFast(h, j.x0 + (j.x1 - j.x0) * e, j.y0 + (j.y1 - j.y0) * e, 0.12);
    if (q >= 1) addBuff(h, { id: 'vined', dur: ID.vine.root, root: true });
  }
  k.hauls = k.hauls.filter((j) => j.t < j.T);
}

// ---------------------------------------------------------------- seed pods
// It shakes its crown and pods fall out of it, one at each of up to three heroes: a circle where each will land, the
// pod falling the whole height. It bursts where it lands; the first of each shower splits open on a sproutling. No
// more than three of its own at once.
function pods(w, u, k, hs) {
  const P = ID.pods; if (w.stale) return false;
  const marks = hs.filter((h) => !offFloor(h) && !h.def.part).sort(() => rand() - 0.5).slice(0, P.n + (k.phase >= 2 ? 1 : 0));
  const n = P.n + (k.phase >= 2 ? 1 : 0), spots = [];
  for (let i = 0; i < n; i++) {
    let p;
    if (marks[i]) { const l = lead(marks[i], 0.5); p = inside(w, l.x, l.y, 40); }
    else { const a = rand() * TAU, d = rrange(...P.near); p = inside(w, k.gx + Math.cos(a) * d, k.gy + Math.sin(a) * d, 50); }
    if (spots.some((s) => dist(s.x, s.y, p.x, p.y) < P.r * 0.9)) { const a = rand() * TAU; p = inside(w, p.x + Math.cos(a) * P.r * 1.4, p.y + Math.sin(a) * P.r * 1.4, 50); }
    spots.push(p);
  }
  let hatch = P.hatch + (k.phase >= 2 ? 1 : 0);
  spots.forEach((p, i) => {
    const tell = P.tell + i * 0.14, sprout = hatch-- > 0;
    k.podN++;
    // where it leaves the crown: the back of the head, at its height
    const c = Math.cos(u.facing), s = Math.sin(u.facing), x0 = k.gx + k.sx - c * 44 + (i - 1) * -s * 16, y0 = k.gy + k.sy - s * 44 + (i - 1) * c * 16;
    addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: P.r, t: tell, team: u.team, src: null, by: u, kind: 'bone', quiet: true, hit: { dmg: 0 },
      onFire: (w2, z) => {
        let hit = 0;
        for (const h of heroesOf(w2, u)) if (!offFloor(h) && inZone(z, h.x, h.y, h.r * 0.5)
          && hurt(w2, h, P.dmg * u.dmgMul, alive(u) ? u : null, { noDodge: true, zone: 'bone', stagger: 14, knock: 120, kAngle: angleTo(z.x, z.y, h.x, h.y) }) > 0) hit++;
        if (hit) k.podHits++;
        bfx(w2, { type: 'idPodBurst', x: z.x, y: z.y, r: P.r, max: 0.6, seed: Math.round(z.x * 3 + z.y) }); puff(w2, z.x, z.y, '#C9D36A', 8, 150, 5, 0.5);
        w2.shake = Math.max(w2.shake, 4);
        if (!sprout || !alive(u) || w2.stale) return;
        const mine = w2.units.reduce((m, o) => m + (o.calledBy === u && alive(o) ? 1 : 0), 0);
        if (mine >= P.own || crowd(w2, u.team) >= 22) return;
        const sp = spawn(w2, 'sproutling', z.x, z.y, { mult: w2.mult || 1, hpMul: P.hpMul, scale: P.scale });
        sp.aggro = true; sp.minion = true; sp.calledBy = u; sp.summonBy = u; sp.facing = sp.mvA = rand() * TAU; sp.atkT = 0.6;
      } });
    bfx(w, { type: 'idPod', u, x0, y0, z0: Math.max(ID.body.low, k.h) + 8, x1: p.x, y1: p.y, max: tell, rel: 1 - P.drop / tell, seed: i * 7 + Math.round(p.x) });
    k.podDrops.push(w.time + tell - P.drop);
  });
  bfx(w, { type: 'idShake', u, max: 0.7 });
  k.pose = { kind: 'shake', t: 0.8, max: 0.8 }; beginHold(u, 0.8, null);
  return true;
}

// ---------------------------------------------------------------- phase 2, death
function enter(w, u, k, p) {
  notePhase(w, k); u.invulnT = 1.0;
  beginHold(u, 1.1, null); k.pose = { kind: 'roar', t: 1.1, max: 1.1, rear: true }; k.hGoal = restH(k) + (k.collapsed ? 0 : 16); k.hRate = 90;
  bfx(w, { type: 'idRoar', u, max: 0.8 }); w.shake = Math.max(w.shake, 7);
  again(u, 'pods', 1.0); again(u, 'slam', 3.5);
}
function death(w, u) {
  const k = u.si;
  for (const o of w.units) if (o.calledBy === u && o.kind === 'sproutling' && alive(o)) { o.noLoot = true; kill(w, o, null); }
  // (its hooves go with it without a burst each: it falls as one, in the picture below)
  if (k) for (const L of k.legs) if (L.foot && alive(L.foot)) { L.foot.partOf = null; L.foot.dead = true; L.foot = null; } // (health left on it: fx.js bursts whatever vanishes at 0)
  endParts(w, u);
  if (k) {
    for (const L of k.legs) for (const z of [L.job && L.job.z]) if (z && !z.done) { z.done = true; z.cancelled = true; z.t = -1; }
    k.hauls = [];
    bfx(w, { type: 'idDeath', x: k.gx, y: k.gy, f: u.facing, h: Math.max(ID.body.low, k.h), max: 2.0,
      legs: k.legs.map((L) => ({ i: L.i, x: L.x, y: L.y, broken: L.broken })) });
    if (k.h > 60) fallFx(w, u, k);
  }
  puff(w, u.x, u.y, DUST, 18, 240, 7, 0.7); puff(w, u.x, u.y, LEAF, 12, 220, 6, 0.9); w.shake = Math.max(w.shake, 12);
}

// ---------------------------------------------------------------- its glade: an open overgrown hall
function glade(w) {
  w.throne = { x: w.W - 380, y: w.H / 2 };
  w.idolGlade = true;
  stage(w, 'stiltIdol', drawGladeFloor, drawGladeAir);
}

export const STILT = {
  defs: {
    // (home: the dungeon whose strength it fights at in battle mode, battle.js; bookOpen: its page in the Book is open
    // without meeting it, book.js: it lives in no dungeon yet)
    stiltIdol: { team: 'enemy', name: 'The Canopy Idol', r: 56, vr: 62, turn: 1.4, accel: 190, face: 1.2, mass: 18, hp: ID.hp, speed: 40, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 170, coins: [65, 85], boss: true, arena: 'idolGlade', noCorpse: true, labels: ['plant'], home: 'sewers', bookOpen: true,
      res: { stagger: 0.4 }, draw: drawIdol, shadows: idolShadows, brain, onDeath: death, get portrait() { return idolPortrait(); } },
    stiltFoot: PART('The Canopy Idol (a hoof)', { r: ID.leg.footR, vr: 19, mass: 30, hp: 100, labels: ['plant'], draw: drawIdolFoot }),
  },
  arenas: { idolGlade: glade },
};
