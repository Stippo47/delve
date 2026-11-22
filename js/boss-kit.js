// Lane B (bosses2): what every designed boss shares (js/boss-*.js). A boss is an enemy def with boss: true and a brain
// that runs the whole fight (it always returns true): waking, phase turns by health, its own targeting, telegraphed
// moves (sim.js addDanger: the heroes steer out of them) and a recovery after each (the party's window). The small
// tools for one move at a time (lob, cone, line, around, hold, due, again, summon, later) are elites.js's.
// Parts (a drake's body, a wurm's segments, an engine's hands) are units of their own the heroes can hit: part()
// makes one; its blows go on to the boss (shared: the part keeps no health of its own; or a pool of its own that
// breaks).
import { alive, hurt, puff, sparks, spawn, kill, addDanger, fx } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange } from './util.js';
import { circleRect } from './path.js';
import { stand } from './elites.js';
import { drawBfx } from './boss-draw.js';
import { BUILD_IDS } from './statuses.js';

// the boss's opponents (whichever side it is on: battle mode can put a boss on either team)
export const heroesOf = (w, u) => w.units.filter((o) => alive(o) && !o.ethereal && o.team !== u.team);
export const H = (u, hit) => (hit ? { ...hit, dmg: (hit.dmg || 0) * u.dmgMul } : undefined);
export const param = (k) => { try { return typeof location !== 'undefined' ? new URLSearchParams(location.search).get(k) : null; } catch { return null; } };

// Bosses don't fly about: no knockback, and a stun is short (sim.js already cuts a boss's stuns to 40%).
export const STEADY = { knockImmune: true };
export function steady(u) { if (!u.trinketHooks.includes(STEADY)) u.trinketHooks = [...u.trinketHooks, STEADY]; }

// Asleep until a hero comes within `range` or hurts it; then onWake(). ?bossphase=N (testing, clips) starts the fight
// just above phase N's line, so the turn into it plays first. Returns true while it's still asleep.
export function asleep(w, u, k, range, PHASE_AT, onWake) {
  if (k.phase > 0) return false;
  stand(u, 0.016);
  if (!(u.aggro || heroesOf(w, u).some((h) => dist(h.x, h.y, u.x, u.y) < range))) return true;
  u.aggro = true; k.phase = 1;
  const n = Math.round(+param('bossphase') || 1);
  if (n > 1 && n <= PHASE_AT.length) { u.hp = u.maxHp * (PHASE_AT[n - 1] + 0.005); k.phase = n - 1; k.skipTo = n; }
  if (onWake) onWake();
  return false;
}
// Between moves: has health fallen past the next phase's line? Then k.phase goes up and enter(phase) plays its turn.
export function phaseGate(u, k, PHASE_AT, enter) {
  if (k.phase >= PHASE_AT.length) return false;
  if (u.hp / u.maxHp >= PHASE_AT[k.phase]) return false;
  k.phase++; enter(k.phase);
  return true;
}
// Who it wants: whoever is taunting it, else the nearest (a bit sticky), rethought every `every` seconds.
export function pickTarget(w, u, k, dt, every = 1.1, score) {
  if ((k.tgtT = (k.tgtT || 0) - dt) <= 0 || !u.target || !alive(u.target) || u.target.ethereal) {
    k.tgtT = every;
    if (u.tauntBy && u.tauntT > 0 && alive(u.tauntBy) && !u.tauntBy.ethereal) u.target = u.tauntBy;
    else {
      let best = null, bd = Infinity;
      for (const h of heroesOf(w, u)) { const d = score ? score(h) : dist(h.x, h.y, u.x, u.y) - (h === u.target ? 60 : 0); if (d < bd) { bd = d; best = h; } }
      u.target = best;
    }
  }
  return u.target && alive(u.target) && !u.target.ethereal ? u.target : null;
}
export const farthest = (w, u) => heroesOf(w, u).sort((a, b) => dist(b.x, b.y, u.x, u.y) - dist(a.x, a.y, u.x, u.y))[0] || null;
export const randomHero = (w, u, not) => { const hs = heroesOf(w, u).filter((h) => h !== not); return hs.length ? hs[Math.floor(rand() * hs.length)] : heroesOf(w, u)[0] || null; };
export const lead = (t, s) => ({ x: t.x + (t.vx || 0) * s, y: t.y + (t.vy || 0) * s });

// Where a line from (x, y) at angle a stops: its full length, or the first pillar, wall or room edge in the way.
export function clipLine(w, x, y, a, len, pad = 20, from = 0) {
  let d = from;
  for (; d < len; d += 10) {
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    if (px < pad || py < pad || px > w.W - pad || py > w.H - pad) break;
    if (w.pillars.some((p) => dist(px, py, p.x, p.y) < p.r + pad)) break;
    if (w.walls.some((r) => circleRect(px, py, pad, r))) break;
  }
  return { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, d };
}
export const inside = (w, x, y, m = 40) => ({ x: clamp(x, m, w.W - m), y: clamp(y, m, w.H - m) });

// A charge: a line shows for `tell`, then the boss runs down it, hurting everyone it runs through once. It stops at
// the line's end, or at a wall or pillar (o.onWall: it hit something; o.onEnd: it ran out). Run chargeTick every tick.
export function charge(w, u, k, a, len, o = {}) {
  const end = clipLine(w, u.x, u.y, a, len, u.r * 0.8, u.r);
  const sp = o.speed || 620;
  k.ch = { a, t: o.tell || 0.8, run: end.d / sp, sp, hit: new Set(), o, wall: end.d < len - 12 };
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: end.x, y2: end.y, hw: u.r + 8, t: (o.tell || 0.8) + end.d / sp * 0.5, team: u.team, src: u, kind: o.kind || 'blade' });
  return k.ch;
}
export function chargeTick(w, u, k, dt) {
  const c = k.ch; if (!c) return false;
  if (c.t > 0) { c.t -= dt; stand(u, dt); u.facing = wrapAngle(u.facing + clamp(wrapAngle(c.a - u.facing), -8 * dt, 8 * dt)); return true; }
  u.dvx = Math.cos(c.a) * c.sp; u.dvy = Math.sin(c.a) * c.sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = c.a; u.spd = c.sp; u.facing = c.a;
  if (rand() < 0.6) w.particles.push({ x: u.x - Math.cos(c.a) * u.r, y: u.y - Math.sin(c.a) * u.r, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 8, color: c.o.trail || 'rgba(214,196,160,0.75)' });
  for (const h of heroesOf(w, u)) {
    if (c.hit.has(h) || dist(u.x, u.y, h.x, h.y) > u.r + h.r + 6) continue;
    c.hit.add(h);
    const side = Math.sign(Math.sin(angleTo(u.x, u.y, h.x, h.y) - c.a)) || 1;
    hurt(w, h, (c.o.dmg || 14) * u.dmgMul, u, { noDodge: true, knock: c.o.knock || 300, kAngle: c.a + side * 1.1, heavy: true, ...(c.o.status || {}) });
  }
  if ((c.run -= dt) <= 0) {
    k.ch = null; u.spd = 0; u.vx = u.vy = u.dvx = u.dvy = 0;
    if (c.wall && c.o.onWall) c.o.onWall(); else if (c.o.onEnd) c.o.onEnd();
  }
  return true;
}

// A burst of dust and sparks with a little shake (a slam landing, a wall hit).
export function thud(w, x, y, col = '#D9CDB0', n = 16, shake = 6) {
  puff(w, x, y, col, n, 200, 7, 0.6); for (let i = 0; i < 5; i++) sparks(w, x, y, rand() * TAU, 1, '#FFF4DC');
  w.shake = Math.max(w.shake, shake);
}

// ---------------------------------------------------------------- parts
// A part: a unit of its own (so heroes pick it, aim at it, swing at it) that the boss moves. o.share: how much of each
// blow goes on to the boss. o.pool: the part has its own health and can be broken (onBreak); else it never loses any.
// The boss's death takes its parts with it (endParts).
export function part(w, core, kind, x, y, o = {}) {
  const p = spawn(w, kind, x, y, { mult: w.mult || 1, hpMul: o.hpMul || 1, team: core.team });
  p.core = core; p.aggro = true; p.partOf = core; p.facing = core.facing; p.mvA = core.facing;
  p.dmgMul = core.dmgMul;
  if (o.hp) { p.maxHp = Math.round(o.hp); p.hp = p.maxHp; }
  const share = o.share ?? 1, pool = !!o.pool;
  p.trinketHooks = [...p.trinketHooks, STEADY, {
    struck(w2, me, src, amt) {
      if (!alive(core)) return;
      if (!pool) me.hp = me.maxHp; // a shared part keeps no health of its own: every blow is the boss's
      const k = typeof share === 'function' ? share() : share;
      if (k > 0) { core.hp -= amt * k; core.flashT = 0.1; if (core.hp <= 0) kill(w2, core, src); }
    },
  }];
  return p;
}
export function endParts(w, core) { for (const o of w.units) if (o.partOf === core && alive(o)) { o.partOf = null; kill(w, o, null); } }
// A part kind: no brain of its own (the boss moves it), no loot, drawn by `draw`.
export const PART = (name, o) => ({ team: 'enemy', name, r: 30, vr: 30, turn: 0, accel: 0, face: 0, mass: 30, hp: 100, speed: 0, role: 'melee', range: 0,
  atkCd: 999, temp: 0.2, commit: 1, xp: 0, coins: [0, 0], noElite: true, noCorpse: true, part: true, brain: () => true, ...o,
  // statuses don't take on parts: touching parts set each other off (a scorch burst burns its neighbours, which burst
  // in turn), and a rot burst is a share of the part's own health, passed on to the boss
  // (bosses3, after round 13's statuses: every status there is, so a part can't be charmed over to the other side or frightened off)
  res: { ...Object.fromEntries(BUILD_IDS.map((id) => [id, 0])), ...(o.res || {}) } });
// A unit moved by hand: put it at (x, y), facing a, with no slide of its own.
export function place(u, x, y, a) { u.x = x; u.y = y; u.vx = u.vy = u.dvx = u.dvy = u.kx = u.ky = 0; u.spd = 0; if (a != null) { u.facing = a; u.mvA = a; } }

// The boss's line for tools/runs.mjs --v: the phase it got to and how long its fight ran.
export function logOf(w, u, k) { w.bossLog = () => `phase ${k.phase} at ${Math.round(100 * Math.max(0, u.hp) / u.maxHp)}%${k.phaseT ? ' (' + k.phaseT.map((t) => Math.round(t)).join('/') + 's)' : ''}`; }
export function notePhase(w, k) { (k.phaseT || (k.phaseT = [])).push(w.time); }

// A shower of coins etc. is the sim's; this is the boss's last flourish: a big puff of its colour.
export function deathBurst(w, u, cols) { for (let i = 0; i < 40; i++) { const a = rand() * TAU, v = rrange(60, 260); w.particles.push({ x: u.x, y: u.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9, max: 0.9, size: rrange(4, 8), color: cols[i % cols.length] }); } w.shake = Math.max(w.shake, 12); }
export { fx };

// ---------------------------------------------------------------- lane B (bosses3): the stage and effects of a fight
// A boss's own drawing under the units (ground) and over them (air). The room's builder calls it, and so does the
// brain on its first tick: a boss fighting in a room that isn't its own (battle mode, two bosses on a side) still gets
// its effects. Keyed, so each is hooked once; it keeps whatever w.arenaDraw / w.arenaAir was there.
export function stage(w, key, ground, air) {
  const S = w.bossStage || (w.bossStage = { keys: {}, ground: [], air: [], g: null, a: null });
  if (!S.keys[key]) { S.keys[key] = true; if (ground) S.ground.push(ground); if (air) S.air.push(air); }
  if (w.arenaDraw !== S.g) { const g0 = w.arenaDraw; S.g = w.arenaDraw = (ctx, w2) => { if (g0) g0(ctx, w2); for (const f of S.ground) f(ctx, w2); drawBfx(ctx, w2, 'ground'); }; }
  if (w.arenaAir !== S.a) { const a0 = w.arenaAir; S.a = w.arenaAir = (ctx, w2) => { if (a0) a0(ctx, w2); for (const f of S.air) f(ctx, w2); drawBfx(ctx, w2, 'air'); }; }
}
// An effect that lives for f.max seconds from now (boss-draw.js BFX[f.type] draws it by the room's clock).
export function bfx(w, f) {
  f.t0 = w.time; const L = w.bfx || (w.bfx = []);
  if (L.length > 90) w.bfx = L.filter((g) => w.time - g.t0 < g.max);
  (w.bfx || L).push(f); return f;
}
// A zone the fight moves and keeps alive itself (a spin's reach, a beam's path): shown full, never strikes; the other
// side keeps stepping out of it. Call keep() every tick it should stay; drop it by not calling.
export function liveZone(w, u, z) { const d = addDanger(w, { ...z, t: 0.3, max: 0.01, team: u.team, src: u, quiet: true, soft: true }); d.age = 9; return d; }
export function keepZone(z, set) { if (!z) return; Object.assign(z, set); z.t = 0.3; z.done = false; }
// Whether a unit can be picked up and carried (a claw's grab, a chain's drag): not a boss, a part, or one that's dug in.
export const canDrag = (h) => alive(h) && !h.ethereal && !h.def.boss && !h.def.part && !(h.buffs || []).some((b) => b.id === 'unstoppable' || b.knockImmune) && !(h.trinketHooks || []).some((t) => t.knockImmune);
// Held fast by something for a moment: it can't act, and it goes where it's put.
export function holdFast(h, x, y, t = 0.2) { h.stunT = Math.max(h.stunT, t); h.x = x; h.y = y; h.vx = h.vy = h.dvx = h.dvy = h.kx = h.ky = 0; h.spd = 0; h.act = null; }
// Testing and clips: ?bossmove=<name> makes a boss open with that move (each boss reads it in its own brain).
export const TEST_MOVE = param('bossmove');
