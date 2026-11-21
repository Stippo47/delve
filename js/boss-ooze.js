// The Great Ooze: the Sewers' boss (floor 3). Design and numbers: docs/BOSS-great-ooze.md. The designer (round 9, the
// Rat King card): "Design a new boss. Maybe the slime king? The great ooze." The Thing in the Cistern ("Good except the
// water level rises idea") is folded in as its third phase: tentacles rise out of the canals to slam and drag.
// Art: PLACEHOLDER, a slime drawn in code (fx-boss.js drawOoze), the tentacles too.
import { alive, hurt, puff, sparks, setAnim, addDanger, spawn, heal, fx } from './sim.js';
import { TAU, clamp, dist, angleTo, rand, rrange, chance } from './util.js';
import { lob, around, hold, beginHold, due, again, crowd, stand, turnTo, later } from './elites.js';
import { walkTo, courtFalls } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, randomHero, lead, thud, logOf, notePhase, deathBurst, inside } from './boss-kit.js';
import { drawOoze, drawCistern, drawTentacles } from './fx-boss.js';

export const OZ = {
  hop: { r: 130, tell: 1.2, dmg: 60, knock: 300, puddle: 62, puddleT: 8, cd: [4, 5] },
  spit: { n: 3, r: 58, tell: 1.0, dmg: 28, poison: 30, puddle: 40, cd: [5.5, 7] },
  smother: { reach: 54, tell: 0.8, dmg: 42, poison: 36, knock: 240, cd: [3, 4] },
  brood: { every: 12, n: 2, cap: 5, absorb: 0.01 },
  tentacle: { len: 380, hw: 34, tell: 1.1, dmg: 46, wet: 50, knock: 200, cd: [5, 6.5] },
  grab: { r: 70, tell: 1.0, dmg: 20, wet: 60, reach: 260, cd: [7, 9] },
  melt: { gas: 60, gasT: 6, speed: 1.35, hopCd: [3.2, 4.2] },
};
export const PHASE_AT = [1, 0.7, 0.45, 0.2];
const WAKE = 420;

function brain(w, u, dt) {
  const k = u.oz || (u.oz = { phase: 0 });
  steady(u); logOf(w, u, k);
  // it shrinks as it loses itself (a quarter of its size from full to nothing)
  const size = 0.72 + 0.28 * clamp(u.hp / u.maxHp, 0, 1);
  u.r = u.def.r * size; u.vr = u.def.vr * size;
  u.wob = (u.wob || 0) + dt * (k.phase >= 4 ? 7 : 4);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.0, null); setAnim(u, 'ability', 1); thud(w, u.x, u.y, '#7CC07A', 18, 5); notePhase(w, k); })) return true;
  absorb(w, u, k, dt);
  if (k.phase >= 2) brood(w, u, k, dt);
  if (k.phase >= 3) cistern(w, u, k, dt);
  if (hopTick(w, u, k, dt)) return true;
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const d = dist(u.x, u.y, t.x, t.y), gap = d - u.r - t.r, at = angleTo(u.x, u.y, t.x, t.y);
  const melt = k.phase >= 4;
  // crowded: it heaves and smothers everything touching it
  const close = heroesOf(w, u).filter((h) => dist(h.x, h.y, u.x, u.y) - h.r - u.r < OZ.smother.reach * 0.7).length;
  if (close && due(u, 'smother', dt, 1.5) && (close >= 2 || chance(0.6))) {
    again(u, 'smother', ...OZ.smother.cd);
    around(w, u, { r: u.r + OZ.smother.reach, tell: OZ.smother.tell, kind: 'poison', after: 0.4, hit: { dmg: OZ.smother.dmg, poison: OZ.smother.poison, knock: OZ.smother.knock },
      fire: (w2, z) => { puff(w2, z.x, z.y, '#7CC07A', 18, 220, 8, 0.5); w2.shake = Math.max(w2.shake, 5); } });
    return true;
  }
  // the hop: up, over, and down on its mark
  if (due(u, 'hop', dt, 2.5)) { again(u, 'hop', ...(melt ? OZ.melt.hopCd : OZ.hop.cd)); startHop(w, u, k, t); return true; }
  // spit: globs of itself lobbed at the heroes
  if (due(u, 'spit', dt, 3) && d > 160) { again(u, 'spit', ...OZ.spit.cd); spit(w, u); return true; }
  // otherwise it oozes after its mark in slow surges
  const surge = 0.35 + 0.9 * Math.max(0, Math.sin(u.wob * 1.3));
  if (gap > 10) walkTo(w, u, t.x, t.y, surge * (melt ? OZ.melt.speed : 1), dt); else stand(u, dt);
  turnTo(u, at, 3, dt);
  return true;
}

// ---- moves
function startHop(w, u, k, t) {
  const p = lead(t, 0.6), q = inside(w, p.x, p.y, u.r + 10), tell = OZ.hop.tell * (k.phase >= 4 ? 0.85 : 1);
  k.hop = { sx: u.x, sy: u.y, ex: q.x, ey: q.y, t: 0, dur: tell };
  setAnim(u, 'ability', tell);
  addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: OZ.hop.r, t: tell, team: u.team, src: u, kind: 'poison', hit: H(u, { dmg: OZ.hop.dmg, knock: OZ.hop.knock, heavy: true }),
    onFire: (w2, z) => {
      thud(w2, z.x, z.y, '#7CC07A', 22, 9);
      // where it lands it leaves itself behind: a slick of ooze (slows; it burns, like oil)
      w2.hazards.push({ type: 'oil', x: z.x, y: z.y, r: OZ.hop.puddle, t: OZ.hop.puddleT, max: OZ.hop.puddleT, ooze: true });
      if (k.phase >= 4) w2.hazards.push({ type: 'gas', x: z.x, y: z.y, r: OZ.melt.gas, t: OZ.melt.gasT, max: OZ.melt.gasT });
      if (k.phase >= 2) shed(w2, u, k, 2, z.x, z.y, 0.15);
    } });
}
function hopTick(w, u, k, dt) {
  const h = k.hop; if (!h) return false;
  h.t += dt;
  const p = clamp(h.t / h.dur, 0, 1), rise = p < 0.25 ? 0 : (p - 0.25) / 0.75; // it crouches a moment, then it's up
  const e = rise * rise * (3 - 2 * rise);
  u.x = h.sx + (h.ex - h.sx) * e; u.y = h.sy + (h.ey - h.sy) * e; u.vx = u.vy = u.dvx = u.dvy = u.kx = u.ky = 0; u.spd = 0;
  u.hop = Math.sin(rise * Math.PI) * 120; u.squash = p < 0.25 ? p / 0.25 : 0;
  if (rise > 0.05 && rise < 0.95) u.invulnT = Math.max(u.invulnT, 0.05); // in the air: out of reach (not ethereal: battle mode counts ethereal units as gone)
  if (p >= 1) { k.hop = null; u.hop = 0; u.squash = 0; u.ethereal = false; beginHold(u, 0.6, null); }
  return true;
}
function spit(w, u) {
  const hs = heroesOf(w, u);
  for (let i = 0; i < OZ.spit.n && hs.length; i++) {
    const h = hs[i % hs.length], p = lead(h, 0.5), a = rand() * TAU, off = i < hs.length ? 0 : rrange(60, 120), q = inside(w, p.x + Math.cos(a) * off, p.y + Math.sin(a) * off);
    lob(w, u, q.x, q.y, { r: OZ.spit.r, tell: OZ.spit.tell + i * 0.15, kind: 'poison', proj: 'vial', color: '#7CC07A', dust: '#7CC07A', hit: { dmg: OZ.spit.dmg, poison: OZ.spit.poison, knock: 90 },
      land: (w2, z) => { if (w2.hazards.filter((x) => x.ooze).length < 14) w2.hazards.push({ type: 'oil', x: z.x, y: z.y, r: OZ.spit.puddle, t: 6, max: 6, ooze: true }); } });
  }
  beginHold(u, 0.6, null); setAnim(u, 'cast', 0.5);
}
// Slimes bud off it (the brood). They come back to it if they can: one that touches it is drunk back in and heals it.
function shed(w, u, k, n, x = u.x, y = u.y, delay = 0.5) {
  for (let i = 0; i < n; i++) {
    if (w.units.filter((o) => o.broodOf === u && alive(o)).length >= OZ.brood.cap || crowd(w, u.team) > 18) return;
    const a = rand() * TAU, d = u.r + 30, px = clamp(x + Math.cos(a) * d, 40, w.W - 40), py = clamp(y + Math.sin(a) * d, 40, w.H - 40);
    later(w, px, py, delay + i * 0.2, () => { const s = spawn(w, chance(0.3) ? 'slimeSludge' : 'slime', px, py, { mult: w.mult * 0.8, team: u.team }); s.aggro = true; s.court = true; s.broodOf = u; s.gen = 1; s.kx = Math.cos(a) * 160; s.ky = Math.sin(a) * 160; puff(w, px, py, '#7CC07A', 8, 90, 6, 0.4); });
  }
}
function brood(w, u, k, dt) {
  if (due(u, 'brood', dt, 3) && !w.stale) { again(u, 'brood', OZ.brood.every * (k.phase >= 4 ? 0.7 : 1)); shed(w, u, k, OZ.brood.n); setAnim(u, 'ability', 0.5); }
}
function absorb(w, u, k, dt) {
  for (const s of w.units) {
    if (s.broodOf !== u || !alive(s) || k.hop) continue;
    // after a while out in the room each slime turns and crawls home to it: kill them before they get there
    if (s.homeAt == null) s.homeAt = w.time + rrange(8, 11);
    if (w.time > s.homeAt) s.forcedGoal = { x: u.x, y: u.y, slow: 0.9 };
    if (dist(s.x, s.y, u.x, u.y) > u.r + s.r + 4) continue;
    s.hp = 0; s.dead = true; s.broodOf = null; // drunk back in
    heal(w, u, u.maxHp * OZ.brood.absorb, null);
    puff(w, s.x, s.y, '#9BE07A', 10, 70, 6, 0.4);
    fx(w, { type: 'beam', x1: s.x, y1: s.y, x2: u.x, y2: u.y, kind: 'heal', max: 0.4 });
  }
}
// The Thing in the Cistern (phase 3 on): arms rise out of the canals. A slam is a line from the canal's edge across at a
// hero; a grab is a circle on a hero near the water that drags them in.
function cistern(w, u, k, dt) {
  const canals = w.water || []; if (!canals.length) return;
  const edge = (c, h) => { const left = h.x < c.x + c.w / 2; return { x: left ? c.x : c.x + c.w, y: clamp(h.y, 40, w.H - 40), a: left ? Math.PI : 0 }; };
  const near = (h) => canals.slice().sort((a, b) => Math.abs(h.x - (a.x + a.w / 2)) - Math.abs(h.x - (b.x + b.w / 2)))[0];
  if (due(u, 'tentacle', dt, 1.5)) {
    again(u, 'tentacle', ...OZ.tentacle.cd.map((x) => x * (k.phase >= 4 ? 0.8 : 1)));
    const hs = heroesOf(w, u).slice(0, 2);
    for (const h of hs) {
      const c = near(h), e = edge(c, h), a = angleTo(e.x, e.y, h.x, h.y), x2 = e.x + Math.cos(a) * OZ.tentacle.len, y2 = e.y + Math.sin(a) * OZ.tentacle.len;
      tentacleFx(w, e.x, e.y, x2, y2, OZ.tentacle.tell);
      addDanger(w, { shape: 'line', x1: e.x, y1: e.y, x2, y2, hw: OZ.tentacle.hw, t: OZ.tentacle.tell, team: u.team, src: u, kind: 'water',
        hit: H(u, { dmg: OZ.tentacle.dmg, wet: OZ.tentacle.wet, knock: OZ.tentacle.knock, kAngle: a + Math.PI / 2 * (chance(0.5) ? 1 : -1) }),
        onFire: (w2, z) => { w2.shake = Math.max(w2.shake, 5); for (let q = 0.2; q < 1; q += 0.2) puff(w2, z.x1 + (z.x2 - z.x1) * q, z.y1 + (z.y2 - z.y1) * q, '#8FD3F0', 3, 90, 5, 0.4); } });
    }
  }
  if (due(u, 'grab', dt, 4)) {
    again(u, 'grab', ...OZ.grab.cd);
    const h = heroesOf(w, u).filter((o) => { const c = near(o); return Math.abs(o.x - (c.x + c.w / 2)) < OZ.grab.reach; })[0];
    if (!h) return;
    const c = near(h), cx = c.x + c.w / 2, p = lead(h, 0.4);
    tentacleFx(w, cx, p.y, p.x, p.y, OZ.grab.tell, true);
    addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: OZ.grab.r, t: OZ.grab.tell, team: u.team, src: u, kind: 'water',
      onFire: (w2, z) => {
        for (const o of heroesOf(w2, u)) if (dist(o.x, o.y, z.x, z.y) < z.r + o.r * 0.5) { // caught: dragged into the canal
          hurt(w2, o, OZ.grab.dmg * u.dmgMul, u, { noDodge: true, wet: OZ.grab.wet, knock: 30 + Math.abs(o.x - cx) * 2.6, kAngle: angleTo(o.x, o.y, cx, o.y) });
          o.rootT = Math.max(o.rootT || 0, 0.25);
        }
        puff(w2, z.x, z.y, '#8FD3F0', 12, 110, 6, 0.5);
      } });
  }
}
function tentacleFx(w, x1, y1, x2, y2, tell, grab) { (w.tentacles || (w.tentacles = [])).push({ x1, y1, x2, y2, t: 0, tell, dur: tell + 0.7, grab: !!grab }); }

// ---- phase turns
function enter(w, u, k, p) {
  notePhase(w, k); k.hop = null; u.hop = 0; u.ethereal = false;
  u.invulnT = 1.2;
  around(w, u, { r: u.r + 110, tell: 0.9, kind: 'poison', after: 0.4, hit: { dmg: 10, knock: 320, poison: 15 },
    fire: (w2, z) => { thud(w2, z.x, z.y, '#7CC07A', 26, 8); } });
  if (p === 2) shed(w, u, k, 3, u.x, u.y, 1.0); // it shudders and splits
  if (p === 3) { again(u, 'tentacle', 1.4); w.stirring = 1; } // the water stirs: something else is down there
  if (p === 4) { shed(w, u, k, 2, u.x, u.y, 1.0); w.melting = true; } // it melts: faster, and its hops leave gas
}
function death(w, u) {
  courtFalls(w); u.ethereal = false; w.melting = false;
  w.hazards.push({ type: 'oil', x: u.x, y: u.y, r: 110, t: 12, max: 12, ooze: true });
  deathBurst(w, u, ['#7CC07A', '#4F8A5A', '#B5DE5E']);
}

// ---- the cistern: two canals across the room (wading soaks and slows; from phase 3 arms rise out of them), pipe
// pillars, grates; the ooze sits in the far pool
function cisternRoom(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 220, y: Hh / 2 };
  w.water = [{ x: W * 0.28, y: 0, w: 96, h: Hh }, { x: W * 0.58, y: 0, w: 96, h: Hh }];
  for (const [fx, fy] of [[0.45, 0.22], [0.45, 0.78], [0.78, 0.15], [0.78, 0.85]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 32 });
  w.arenaDecor = [[0.12, 0.3, 'grate'], [0.12, 0.7, 'grate'], [0.86, 0.5, 'grate'], [0.4, 0.5, 'puddle'], [0.7, 0.4, 'moss'], [0.7, 0.62, 'moss'], [0.2, 0.5, 'pipe']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.2, v: 0 }));
  w.arenaDraw = (ctx, w2) => drawCistern(ctx, w2);
  w.arenaAir = (ctx, w2) => { if (w2.tentacles) { for (const t of w2.tentacles) t.t += w2._dt || 0.016; w2.tentacles = w2.tentacles.filter((t) => t.t < t.dur); drawTentacles(ctx, w2); } };
}

export const OOZE = {
  defs: {
    greatOoze: { team: 'enemy', name: 'The Great Ooze', r: 66, vr: 70, turn: 2, accel: 120, face: 2, mass: 7, hp: 1350, speed: 52, role: 'melee', range: 30, atkCd: 999, arc: 2,
      temp: 0.2, commit: 1.2, xp: 160, coins: [60, 80], boss: true, arena: 'cistern', noCorpse: true, goo: '#7CC07A',
      res: { poison: 0, wet: 0, stagger: 0.4, burn: 1.4, chill: 1.2 }, draw: drawOoze, brain, onDeath: death },
  },
  arenas: { cistern: cisternRoom },
};
