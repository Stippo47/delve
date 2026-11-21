// Cinder, the Old Drake: the Ember Deep's boss (floor 3). Design and numbers: docs/BOSS-cinder.md. The designer
// (round 9): "Very large, made of multiple components. No wings. No flying. Fire call that drops fireballs from the sky
// as an ability. Scorch. Shoots a narrow cone of flames forwards head turning slowly. Obstacles block it. More
// abilities."
// Built in parts: the head is the boss (full damage, the boss bar), five body segments follow its path (armoured: half
// of each blow gets through), and the tail has a health pool of its own: break it and the lash stops.
// Art: PLACEHOLDER, every part drawn in code (fx-boss.js drawDrakeHead / drawDrakeSegment).
import { alive, hurt, puff, sparks, flames, setAnim, addDanger, addBuff, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { cone, around, hold, beginHold, due, again, stand, turnTo } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, randomHero, lead, charge, chargeTick, thud, part, endParts, PART, place, logOf, notePhase, deathBurst, inside } from './boss-kit.js';
import { drawDrakeHead, drawDrakeSegment, drawPit, drawBreath } from './fx-boss.js';

export const CD = {
  body: [42, 40, 38, 35, 32], tailR: 26, gap: 6, segShare: 0.2, tailShare: 0.3, tailHp: 0.1,
  bite: { r: 160, arc: 1.4, tell: 0.75, dmg: 46, burn: 20, knock: 260, rec: 0.5 },
  scorch: { len: 440, arc: 0.42, tell: 1.0, dur: 3.0, turn: 0.55, tick: 0.15, dmg: 9, burn: 14, cd: [7.5, 9.5] },
  tail: { r: 140, tell: 0.8, dmg: 38, knock: 340, near: 170 },
  call: { n: 8, r: 76, tell: 1.3, spread: 0.7, dmg: 36, burn: 30, fire: 5, cd: [9, 11] },
  rush: { len: 560, tell: 1.0, dmg: 42, knock: 340, cd: [8, 10] },
  roar: { r: 230, tell: 0.9, dmg: 14, knock: 320, burn: 20 },
  molten: { drip: 1.3, fireR: 34, fireT: 4, cap: 16 },
};
export const PHASE_AT = [1, 0.65, 0.35];
const WAKE = 470;

function brain(w, u, dt) {
  const k = u.cd || (u.cd = { phase: 0 });
  if (!k.parts) build(w, u, k);
  steady(u); logOf(w, u, k);
  follow(w, u, k, dt);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.0, null); setAnim(u, 'ability', 1); roarFx(w, u); notePhase(w, k); })) return true;
  if (k.phase >= 3) drip(w, u, k, dt);
  if (breathTick(w, u, k, dt)) return true;
  if (chargeTick(w, u, k, dt)) return true;
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const d = dist(u.x, u.y, t.x, t.y), gap = d - u.r - t.r, at = angleTo(u.x, u.y, t.x, t.y);
  const fast = k.phase >= 3 ? 0.85 : 1;
  // the tail: anyone standing by it gets lashed (while it's whole)
  const tail = k.tail && alive(k.tail) ? k.tail : null;
  if (tail && due(u, 'lash', dt, 1) && heroesOf(w, u).some((h) => dist(h.x, h.y, tail.x, tail.y) < CD.tail.near)) {
    again(u, 'lash', 3.5 * fast, 5 * fast);
    addDanger(w, { shape: 'circle', x: tail.x, y: tail.y, r: CD.tail.r, t: CD.tail.tell, team: u.team, src: u, kind: 'fire', hit: H(u, { dmg: CD.tail.dmg, knock: CD.tail.knock, heavy: true }),
      onFire: (w2, z) => { thud(w2, z.x, z.y, '#B5754A', 14, 6); tail.lashT = 0.4; } });
    tail.lashT = CD.tail.tell + 0.4;
  }
  // up close in front: the bite
  if (gap < 110 && angleDiff(u.facing, at) < 0.7 && due(u, 'bite', dt, 0.6)) {
    again(u, 'bite', 2.4 * fast, 3.2 * fast);
    cone(w, u, u.facing, { r: CD.bite.r, arc: CD.bite.arc, tell: CD.bite.tell * fast, kind: 'fire', anim: 'swing', after: CD.bite.rec, hit: { dmg: CD.bite.dmg, burn: CD.bite.burn, knock: CD.bite.knock, heavy: true } });
    return true;
  }
  // phase 2 on: the fire call (fireballs out of the dark onto the heroes)
  if (k.phase >= 2 && due(u, 'call', dt, 2)) { again(u, 'call', ...CD.call.cd.map((x) => x * (k.phase >= 3 ? 0.75 : 1))); fireCall(w, u, k); return true; }
  // the scorch: a narrow cone of flame, the head turning slowly after its mark
  if (due(u, 'scorch', dt, 3) && d < CD.scorch.len + 60) { again(u, 'scorch', ...CD.scorch.cd); startBreath(w, u, k, at); return true; }
  // phase 2 on: the coil rush: head down, the whole body after it
  if (k.phase >= 2 && due(u, 'rush', dt, 4) && gap > 120) {
    again(u, 'rush', ...CD.rush.cd);
    const p = lead(t, 0.3);
    setAnim(u, 'ability', CD.rush.tell + 0.6);
    charge(w, u, k, angleTo(u.x, u.y, p.x, p.y), CD.rush.len, { tell: CD.rush.tell, dmg: CD.rush.dmg, knock: CD.rush.knock, speed: 560, kind: 'fire', trail: 'rgba(255,138,61,0.7)', status: { burn: 20 },
      onEnd: () => beginHold(u, 0.6, null), onWall: () => { thud(w, u.x, u.y, '#B5754A', 18, 8); beginHold(u, 1.4, null); } });
    return true;
  }
  // otherwise it crawls after its mark, turning slowly, as a long body does
  if (gap > 60) walkTo(w, u, t.x, t.y, 1, dt); else stand(u, dt);
  turnTo(u, at, 1.6, dt);
  return true;
}

// ---- the body: segments follow the head's path
function build(w, u, k) {
  k.parts = []; k.trail = [];
  const back = u.facing + Math.PI;
  for (let d = 0; d < 600; d += 6) k.trail.push({ x: u.x + Math.cos(back) * d, y: u.y + Math.sin(back) * d });
  let off = 0, prevR = u.r;
  CD.body.forEach((r, i) => {
    off += prevR + r + CD.gap; prevR = r;
    const p = part(w, u, 'drakeSegment', u.x + Math.cos(back) * off, u.y + Math.sin(back) * off, { share: CD.segShare });
    p.r = r; p.vr = r; p.seg = i; p.off = off; k.parts.push(p);
  });
  off += prevR + CD.tailR + CD.gap;
  const tl = part(w, u, 'drakeTail', u.x + Math.cos(back) * off, u.y + Math.sin(back) * off, { share: CD.tailShare, pool: true, hp: u.maxHp * CD.tailHp });
  tl.r = CD.tailR * 1.1; tl.vr = CD.tailR; tl.off = off; tl.tail = true; k.tail = tl; k.parts.push(tl);
}
function follow(w, u, k, dt) {
  const last = k.trail[0];
  if (!last || dist(last.x, last.y, u.x, u.y) > 3) { k.trail.unshift({ x: u.x, y: u.y }); if (k.trail.length > 400) k.trail.length = 400; }
  // walk the trail back from the head: each part sits at its distance along it
  let acc = dist(u.x, u.y, k.trail[0].x, k.trail[0].y), i = 0;
  const at = (want) => {
    while (i < k.trail.length - 1) {
      const a = k.trail[i], b = k.trail[i + 1], L = dist(a.x, a.y, b.x, b.y);
      if (acc + L >= want) { const q = (want - acc) / (L || 1); return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, a: angleTo(b.x, b.y, a.x, a.y) }; }
      acc += L; i++;
    }
    const e = k.trail[k.trail.length - 1]; return { x: e.x, y: e.y, a: u.facing };
  };
  for (const p of k.parts) { if (!alive(p)) continue; const q = at(p.off); place(p, q.x, q.y, q.a); }
}
function onTailBreak(w, t) {
  const u = t.core; if (!u || !alive(u)) return;
  thud(w, t.x, t.y, '#B5754A', 24, 10);
  for (let i = 0; i < 12; i++) flames(w, t.x + rrange(-30, 30), t.y + rrange(-30, 30), 1, 14, 90);
  beginHold(u, 2.0, null); setAnim(u, 'ability', 2); u.stunT = Math.max(u.stunT, 0.4);
  addBuff(u, { id: 'tailless', dur: 2.0, taken: 1.3 });
}

// ---- the scorch: the cone shows for its tell, then flame pours down it while the head swings slowly after the mark.
// Pillars and walls stop the flame (a hero behind one is safe). A thin danger cone is laid down every tick so the
// heroes keep stepping out of it.
function startBreath(w, u, k, at) {
  const S = CD.scorch, ph = k.phase >= 3;
  k.br = { t: S.tell, run: S.dur * (ph ? 1.2 : 1), turn: S.turn * (ph ? 1.45 : 1), tick: 0, a: u.facing + clamp(wrapAngle(at - u.facing), -0.4, 0.4) };
  u.facing = k.br.a;
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a: k.br.a, arc: S.arc, r: S.len, t: S.tell, team: u.team, src: u, kind: 'fire' });
  setAnim(u, 'cast', S.tell + k.br.run);
}
function breathTick(w, u, k, dt) {
  const b = k.br; if (!b) return false;
  stand(u, dt);
  if (b.t > 0) { b.t -= dt; return true; }
  const S = CD.scorch, t = pickTarget(w, u, k, dt);
  if (t) b.a = wrapAngle(b.a + clamp(wrapAngle(angleTo(u.x, u.y, t.x, t.y) - b.a), -b.turn * dt, b.turn * dt));
  u.facing = b.a; u.breathing = true;
  w.breath = { x: u.x + Math.cos(b.a) * u.r * 0.8, y: u.y + Math.sin(b.a) * u.r * 0.8, a: b.a, arc: S.arc, len: S.len, t: (w.breath && w.breath.t || 0) + dt };
  if ((b.tick -= dt) <= 0) {
    b.tick = S.tick;
    addDanger(w, { shape: 'cone', x: u.x, y: u.y, a: b.a, arc: S.arc + 0.1, r: S.len, t: 0.22, team: u.team, src: u, kind: 'fire' });
    for (const h of heroesOf(w, u)) {
      const dd = dist(u.x, u.y, h.x, h.y);
      if (dd > S.len + h.r || angleDiff(angleTo(u.x, u.y, h.x, h.y), b.a) > S.arc / 2 + Math.atan2(h.r * 0.6, dd)) continue;
      if (!lineClear(w, u.x, u.y, h.x, h.y, 2) || w.pillars.some((p) => segNear(u.x, u.y, h.x, h.y, p.x, p.y, p.r))) continue; // behind a pillar: safe
      hurt(w, h, S.dmg * u.dmgMul, u, { noDodge: true, burn: S.burn, knock: 40, kAngle: b.a });
    }
  }
  if ((b.run -= dt) <= 0) { k.br = null; u.breathing = false; w.breath = null; beginHold(u, 0.7, null); }
  return true;
}
const segNear = (ax, ay, bx, by, px, py, r) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, q = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1); return dist(ax + dx * q, ay + dy * q, px, py) < r; };

// ---- the fire call: it roars at the roof and fireballs come down out of the dark: on the heroes and scattered round
// the room, each a circle that fills, then burning ground where it lands
function fireCall(w, u, k) {
  const C = CD.call, n = k.phase >= 3 ? 12 : C.n, hs = heroesOf(w, u);
  roarFx(w, u); setAnim(u, 'cast', 0.9); beginHold(u, 0.9, null);
  for (let i = 0; i < n; i++) {
    const h = hs[i % Math.max(1, hs.length)];
    let x, y;
    if (h && i < hs.length * 2) { const p = lead(h, 0.8), a = rand() * TAU, off = i < hs.length ? 0 : rrange(70, 140); x = p.x + Math.cos(a) * off; y = p.y + Math.sin(a) * off; }
    else { x = rrange(80, w.W - 80); y = rrange(80, w.H - 80); }
    const q = inside(w, x, y, 50), tell = C.tell + i * 0.12;
    (w.falling || (w.falling = [])).push({ x: q.x, y: q.y, t: 0, dur: tell });
    addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: C.r, t: tell, team: u.team, src: null, kind: 'fire', hit: H(u, { dmg: C.dmg, burn: C.burn, knock: 160 }),
      onFire: (w2, z) => { flames(w2, z.x, z.y, 10, z.r * 0.6, 100); w2.shake = Math.max(w2.shake, 4); if (w2.hazards.filter((x2) => x2.type === 'fire').length < 24) w2.hazards.push({ type: 'fire', x: z.x, y: z.y, r: 46, t: C.fire, max: C.fire }); } });
  }
}
// phase 3: its body runs molten, dripping fire as it crawls
function drip(w, u, k, dt) {
  for (const p of k.parts) {
    if (!alive(p)) continue;
    p.dripT = (p.dripT ?? rrange(0, CD.molten.drip)) - dt;
    if (p.dripT > 0) continue;
    p.dripT = CD.molten.drip * rrange(0.8, 1.3);
    if (w.hazards.filter((h) => h.drip).length >= CD.molten.cap) continue;
    w.hazards.push({ type: 'fire', x: p.x, y: p.y, r: CD.molten.fireR, t: CD.molten.fireT, max: CD.molten.fireT, drip: true });
  }
}
function roarFx(w, u) { puff(w, u.x, u.y, '#FF8A3D', 16, 160, 7, 0.6); for (let i = 0; i < 6; i++) flames(w, u.x + rrange(-30, 30), u.y + rrange(-30, 30), 1, 16, 80); w.shake = Math.max(w.shake, 6); }

// ---- phase turns: a roar that throws everyone back
function enter(w, u, k, p) {
  notePhase(w, k); k.br = null; u.breathing = false; w.breath = null; k.ch = null;
  u.invulnT = CD.roar.tell + 0.4;
  around(w, u, { r: CD.roar.r, tell: CD.roar.tell, kind: 'fire', after: 0.5, hit: { dmg: CD.roar.dmg, knock: CD.roar.knock, burn: CD.roar.burn }, fire: (w2) => roarFx(w2, u) });
  if (p === 2) again(u, 'call', 1.2);
  if (p === 3) { w.molten = true; again(u, 'call', 2); }
}
function death(w, u) {
  w.breath = null; w.molten = false;
  for (const p of (u.cd && u.cd.parts) || []) if (alive(p)) { thud(w, p.x, p.y, '#B5754A', 8, 4); }
  endParts(w, u);
  deathBurst(w, u, ['#FF8A3D', '#C8401F', '#FFC85A', '#6E2A1E']);
}

// ---- the pit: a wide cavern, four basalt pillars (they stop the scorch), lava cracks; the drake coiled at the far end
function pit(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 260, y: Hh / 2 };
  for (const [fx, fy] of [[0.35, 0.27], [0.35, 0.73], [0.6, 0.22], [0.6, 0.78]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 40 });
  w.arenaDecor = [[0.15, 0.5, 'crack'], [0.48, 0.5, 'crack'], [0.8, 0.2, 'bonepile'], [0.8, 0.8, 'skulls'], [0.25, 0.15, 'rubble'], [0.25, 0.85, 'rubble']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.3, v: 0 }));
  w.lava = [[0.08, 0.12, 60], [0.92, 0.5, 70], [0.5, 0.95, 55], [0.5, 0.05, 55]].map(([fx, fy, r]) => ({ x: W * fx, y: Hh * fy, r }));
  w.arenaDraw = (ctx, w2) => drawPit(ctx, w2);
  w.arenaAir = (ctx, w2) => drawBreath(ctx, w2);
}

export const CINDER = {
  defs: {
    cinder: { team: 'enemy', name: 'Cinder, the Old Drake', r: 46, vr: 46, turn: 1.6, accel: 110, face: 1.6, mass: 12, hp: 1250, speed: 42, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 200, coins: [80, 100], boss: true, arena: 'pit', noCorpse: true,
      res: { burn: 0, chill: 1.3, wet: 1.3, stagger: 0.4, poison: 0.25 }, draw: drawDrakeHead, brain, onDeath: death },
    drakeSegment: PART('Cinder (body)', { r: 40, vr: 40, mass: 40, hp: 100, res: { burn: 0 }, draw: drawDrakeSegment }),
    drakeTail: PART('Cinder (tail)', { r: 26, vr: 26, mass: 40, hp: 100, res: { burn: 0 }, draw: drawDrakeSegment, onDeath: onTailBreak }),
  },
  arenas: { pit },
};
