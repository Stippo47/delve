// The combat simulation: AI (weighted move modes + context steering), physics, combat, statuses, hazards.
import { TAU, clamp, dist, dist2, angleTo, wrapAngle, angleDiff, rand, rrange, rint, chance, softmaxPick } from './util.js';
import { DEFS, levelHp, levelDmg } from './units.js';
import { lineClear, rayToRect, circleRect, findPath, buildGrid } from './path.js';
import { kitThink, hooksOf, segDist } from './kits.js';
import { trinketHooks } from './trinkets.js';

let NEXT_ID = 1;
const DIRS = 16;
const DIR_X = [], DIR_Y = [];
for (let i = 0; i < DIRS; i++) { DIR_X.push(Math.cos(i / DIRS * TAU)); DIR_Y.push(Math.sin(i / DIRS * TAU)); }

export function makeWorld(W, H) {
  return {
    W, H, time: 0, units: [], projectiles: [], particles: [], texts: [], hazards: [], pickups: [], pillars: [], walls: [], grid: null,
    telegraphs: [], cleared: false, doorIn: { x: 0, y: H / 2 }, doorOut: { x: W, y: H / 2 },
    on: {}, shake: 0, hitstop: 0, corpses: [],
    fx: [], // visual effects the renderer draws (see docs/BUILD-v1.md: ring, zone, beam, wall, wave)
    danger: [], // telegraphed hits on the ground that the other side steers out of (see 'danger zones' below)
  };
}

// What the sprite is doing, for the renderer: u.anim = { kind, t, dur }. kind: 'swing' | 'thrust' | 'draw' | 'cast'
// | 'throw' | 'ability'. The renderer moves the sprite's arm parts from it (see docs/BUILD-v1.md).
export function setAnim(u, kind, dur) { u.anim = { kind, t: 0, dur }; }

const emit = (w, ev, ...a) => w.on[ev] && w.on[ev](...a);

// ---------------------------------------------------------------- spawning
export function spawn(w, kind, x, y, opts = {}) {
  const d = DEFS[kind];
  const team = opts.team || d.team;
  const hero = d.team === 'hero';
  const lvl = opts.level || 1;
  const mult = opts.mult || 1;
  const maxHp = hero ? levelHp(d.hp, lvl) : Math.round(d.hp * mult * (opts.hpMul || 1));
  const u = {
    id: NEXT_ID++, kind, def: d, team, x, y, vx: 0, vy: 0, kx: 0, ky: 0, dvx: 0, dvy: 0,
    r: d.r * (opts.scale || 1), vr: (d.vr || d.r) * (opts.scale || 1), mass: d.mass * (opts.scale || 1), maxHp, hp: opts.hp != null ? Math.min(opts.hp, maxHp) : maxHp,
    dmgMul: hero ? levelDmg(1, lvl) : 0.65 + 0.35 * mult, level: lvl,
    facing: team === 'hero' ? 0 : Math.PI, atkT: rand() * d.atkCd, abilT: (d.abilCd || 0) * rrange(0.3, 0.7),
    mode: 'wander', modeT: 0, thinkT: rand() * 0.4, abilThinkT: rand() * 0.5, target: null, targetT: 0,
    st: { burn: 0, chill: 0, poison: 0, wet: 0, shock: 0, stagger: 0 }, frozenT: 0, stunT: 0, rootT: 0, sleepT: 0, koT: 0, buffs: [], later: null, freezeImmune: 0, dotAcc: 0,
    flashT: 0, invulnT: 0, act: null, dead: false, downed: false,
    trinkets: opts.trinkets || [], trinketHooks: trinketHooks(opts.trinkets), hasKey: !!opts.hasKey,
    strafeSign: chance(0.5) ? 1 : -1, wanderA: rand() * TAU, hazardT: 0, forcedGoal: null,
    gen: opts.gen || 0, bob: rand() * TAU, lastAttackT: -9, aggro: team === 'hero', potions: opts.potions || 0, path: null, pathT: 0, pathGoal: null,
    atkMul: 1, moveMul: 1, mvA: hero ? 0 : Math.PI, spd: 0, sdx: 0, sdy: 0, lungeT: 0, recoilT: 0, hitT: 0, hitA: 0, tauntBy: null, tauntT: 0,
  };
  w.units.push(u);
  return u;
}

const alive = (u) => !u.dead && !u.downed;
// Ethereal units (a Wraith Veil ghost) are nobody's opponent or ally: they can't be targeted, hit or helped.
const opponents = (w, u) => w.units.filter((o) => alive(o) && o.team !== u.team && !o.ethereal);
const allies = (w, u) => w.units.filter((o) => alive(o) && o.team === u.team && o !== u && !o.ethereal);
const hpRatio = (u) => u.hp / u.maxHp;
const speedOf = (u) => {
  let s = u.def.speed * (u.moveMul || 1);
  for (const h of hooksOf(u)) if (h.moveSpeed) s *= h.moveSpeed(u);
  s *= 1 - Math.min(0.6, u.st.chill / 160);
  if (u.st.poison > 20) s *= 0.9;          // poison slows a little
  if (u.inOil) s *= 0.7;
  for (const b of u.buffs) if (b.move) s *= b.move;
  if (u.rootT > 0 || u.stunT > 0 || u.sleepT > 0 || u.buffs.some((b) => b.root)) s = 0;
  return s;
};
// How fast attacks come round: haste, buffs, traits (Momentum), poison.
const atkRate = (u) => {
  let r = u.atkMul || 1;
  for (const b of u.buffs) if (b.atkSpeed) r *= b.atkSpeed;
  for (const h of hooksOf(u)) if (h.atkSpeed) r *= h.atkSpeed(u);
  if (u.st.poison > 20) r *= 0.9;
  return r;
};
const buffMul = (u, key) => { let m = 1; for (const b of u.buffs) if (b[key] != null) m *= b[key]; return m; };
const immuneTo = (u, type) => u.buffs.some((b) => b.statusImmune || (b.immune && b.immune.includes(type))) || hooksOf(u).some((h) => h.immune && h.immune.includes(type));
const knockImmune = (u) => u.buffs.some((b) => b.knockImmune) || hooksOf(u).some((h) => h.knockImmune);

export function addBuff(u, b) {
  const old = u.buffs.find((x) => x.id === b.id);
  if (old) { Object.assign(old, b, { t: Math.max(old.t, b.dur) }); return old; }
  const nb = { ...b, t: b.dur }; u.buffs.push(nb); return nb;
}
export function stun(w, u, t) { if (!alive(u)) return; u.stunT = Math.max(u.stunT, u.def.boss ? t * 0.4 : t); u.act = u.act && u.act.type === 'drink' ? null : u.act; }
export function heal(w, u, amount, src) {
  if (!alive(u) || amount <= 0) return 0;
  const before = u.hp; u.hp = Math.min(u.maxHp, u.hp + amount);
  if (u.hp - before > 2 && rand() < 0.5) w.particles.push({ x: u.x + rrange(-12, 12), y: u.y, vx: 0, vy: 0, rise: 50, up: 0, life: 0.6, max: 0.6, size: 4, color: '#9BE07A' });
  return u.hp - before;
}
export function cleanse(u) { u.st.burn = 0; u.st.chill = 0; u.st.poison = 0; u.st.wet = 0; u.st.shock = 0; u.st.stagger = 0; u.frozenT = 0; u.stunT = 0; u.rootT = 0; u.sleepT = 0; }
// A visual effect, optionally with a tick (a lasting zone that does something every `every` seconds).
export function fx(w, f) { f.t = 0; f.max = f.max ?? f.dur ?? 0.5; w.fx.push(f); return f; }
export function zone(w, z) { return fx(w, { type: 'zone', ...z, max: z.dur, acc: 0 }); }
// A wall that melts away after a while (the A* grid is rebuilt when it comes and goes).
export function wallRect(w, r, dur, kind) {
  const wl = { ...r, temp: dur, kind }; w.walls.push(wl); buildGrid(w);
  for (const u of w.units) { const c = circleRect(u.x, u.y, u.r, wl); if (c) { u.x += c.nx * c.over; u.y += c.ny * c.over; } }
  return wl;
}

// ---------------------------------------------------------------- line of sight
function blocked(w, ax, ay, bx, by) {
  if (!lineClear(w, ax, ay, bx, by, 2)) return true;
  for (const p of w.pillars) {
    const dx = bx - ax, dy = by - ay; const L2 = dx * dx + dy * dy || 1;
    let t = ((p.x - ax) * dx + (p.y - ay) * dy) / L2; t = clamp(t, 0, 1);
    if (dist2(ax + dx * t, ay + dy * t, p.x, p.y) < (p.r + 4) ** 2) return true;
  }
  return false;
}

// ---------------------------------------------------------------- targeting
const SIGHT = 520, AGGRO = 400;
function wake(w, u) {
  if (u.aggro) return;
  u.aggro = true;
  for (const o of w.units) if (o.team === u.team && !o.aggro && alive(o) && dist(o.x, o.y, u.x, u.y) < 240) { o.aggro = true; }
}
function chooseTarget(w, u) {
  if (u.team === 'enemy' && !u.aggro) {
    for (const h of opponents(w, u)) if (dist(u.x, u.y, h.x, h.y) < AGGRO && !blocked(w, u.x, u.y, h.x, h.y)) { wake(w, u); break; }
    if (!u.aggro) { u.target = null; return; }
  }
  let opp = opponents(w, u);
  if (u.team === 'hero') opp = opp.filter((o) => o.aggro || dist(u.x, u.y, o.x, o.y) < SIGHT);
  if (!opp.length) { u.target = null; return; }
  const k = roleAlias(u);
  let best = null, bestS = -Infinity;
  const mates = allies(w, u);
  for (const o of opp) {
    const d = dist(u.x, u.y, o.x, o.y);
    let s = -d / (k === 'rogue' ? 900 : 300);
    // how many of my side are already on it, and how many of its side stand around it
    let on = 0; for (const a of mates) if (a.target === o) on++;
    let crowd = 0; for (const q of opp) if (q !== o && dist(q.x, q.y, o.x, o.y) < 95) crowd++;
    if (u.team === 'hero') {
      s -= on * 0.22;                                   // spread out: prefer enemies nobody is on yet
      s -= crowd * (k === 'rogue' ? 0.4 : 0.08);        // don't dive into a pack (the rogue most of all)
      if (k === 'rogue' && crowd === 0) s += 0.45;      // the rogue hunts the ones on their own, even far off
      // finish the kill: a nearly dead enemy someone is already hitting
      if ((k === 'archer' || k === 'rogue') && on > 0 && hpRatio(o) < 0.35) s += 0.55;
    }
    if (k === 'archer') { s += (1 - hpRatio(o)) * 0.5; if (d <= u.def.range && !blocked(w, u.x, u.y, o.x, o.y)) s += 0.6; }
    else if (k === 'rogue') { s += (1 - hpRatio(o)) * 1.1 + (o.target && o.target !== u ? 0.5 : 0) - (o.def.boss ? 0.3 : 0); }
    else if (k === 'knight') {
      s += o.target && o.target.kind !== 'knight' ? 0.35 : 0;
      // protect: go for whoever is on a hurt teammate
      if (o.target && o.target.team === 'hero' && o.target !== u && hpRatio(o.target) < 0.45) s += 0.9;
    }
    else if (k === 'rat') { s += o.kind === 'archer' ? 0.35 : 0; }
    if (u.team === 'enemy' && u.tauntT > 0 && u.tauntBy === o) s += 0.85; // the knight drew its attention
    if (o === u.target) s += 0.35; // stickiness
    if (s > bestS) { bestS = s; best = o; }
  }
  u.target = best;
}

// The old trio's brains, by role: shooters like the archer, skirmishers like the rogue, tanks like the knight.
function roleAlias(u) {
  const r = u.def.heroRole;
  if (!r) return u.kind;
  if (r === 'tank') return 'knight';
  if (r === 'skirmish') return 'rogue';
  if (r === 'ranged' || r === 'caster' || (r === 'support' && u.def.range > 60)) return 'archer';
  return u.kind;
}

// ---------------------------------------------------------------- move-mode choice
const MODES = ['approach', 'hold', 'kite', 'strafe', 'flank', 'retreat', 'wander'];

function scoreModes(w, u) {
  const t = u.target;
  const sc = { approach: 0, hold: 0, kite: 0, strafe: 0, flank: 0, retreat: 0, wander: 0 };
  if (!t) { sc.wander = 1; return sc; }
  const d = dist(u.x, u.y, t.x, t.y);
  const gap = d - u.r - t.r;
  const role = u.def.role;
  const ready = u.atkT <= 0.15;
  if (role === 'melee') {
    const inRange = gap <= u.def.range + 6;
    sc.approach = inRange ? 0.1 : 1;
    sc.hold = inRange ? 1.05 : 0;
    if (u.team === 'hero' && hpRatio(u) < 0.18) sc.retreat = 0.5;
  } else if (role === 'ranged') {
    let near = Infinity;
    for (const o of opponents(w, u)) near = Math.min(near, dist(u.x, u.y, o.x, o.y) - o.r);
    const los = !blocked(w, u.x, u.y, t.x, t.y);
    sc.kite = near < u.def.keep ? 0.5 + 1.1 * (1 - near / u.def.keep) : 0;
    sc.approach = d > u.def.range * 0.92 || !los ? 1 : 0.05;
    sc.strafe = d <= u.def.range ? (los ? 0.75 : 0.9) : 0.15;
    sc.hold = d <= u.def.range && los && ready ? 0.55 : 0;
  } else { // skirmish: in and out
    const inRange = gap <= u.def.range + 4;
    const sinceAtk = w.time - u.lastAttackT;
    sc.approach = ready ? (inRange ? 0.3 : 1) : 0.15;
    sc.hold = inRange && ready ? 0.9 : 0;
    sc.flank = t.target && t.target !== u && gap < 180 ? (u.kind === 'rogue' ? 0.95 : 0.6) : 0;
    sc.retreat = !ready && sinceAtk < 0.9 ? (u.kind === 'rogue' ? 1.05 : 0.6) : 0;
    sc.strafe = !ready ? 0.55 : 0.1;
  }
  return sc;
}

function think(w, u) {
  const prevT = u.target;
  chooseTarget(w, u);
  const sc = scoreModes(w, u);
  const list = MODES.map((m) => (sc[m] > 0 ? sc[m] : -4)); // modes that don't apply are effectively off
  const cur = MODES.indexOf(u.mode);
  if (cur >= 0) list[cur] += 0.25; // hysteresis: incumbent bonus
  let best = 0; for (let i = 1; i < list.length; i++) if (list[i] > list[best]) best = i;
  const locked = u.modeT < u.def.commit && cur >= 0 && list[best] - list[cur] < 0.8 && prevT === u.target;
  if (!locked) {
    const i = softmaxPick(list, u.def.temp * 0.6);
    if (MODES[i] !== u.mode) { u.mode = MODES[i]; u.modeT = 0; if (u.mode === 'strafe' || u.mode === 'flank' || u.mode === 'retreat') u.strafeSign = quietSide(w, u); }
  }
}

// Which way round the target has fewer of its friends (so strafing doesn't run into a pack).
function quietSide(w, u) {
  const t = u.target; if (!t) return u.strafeSign;
  const a = angleTo(u.x, u.y, t.x, t.y);
  let l = 0, r = 0;
  for (const o of opponents(w, u)) {
    if (o === t) continue;
    const d = dist(u.x, u.y, o.x, o.y); if (d > 260) continue;
    const side = Math.sin(angleTo(u.x, u.y, o.x, o.y) - a);
    if (side > 0) r += 1 / (1 + d / 120); else l += 1 / (1 + d / 120);
  }
  if (Math.abs(l - r) < 0.15) return chance(0.35) ? -u.strafeSign : u.strafeSign;
  return r > l ? -1 : 1;
}

// ---------------------------------------------------------------- danger zones
// A telegraphed hit: a shape on the ground that fills up, then strikes everyone of the other side inside it.
// The other side sees it and steers out (after a short reaction), so big attacks can be dodged.
//   { shape: 'circle', x, y, r } | { shape: 'ring', x, y, r0, r1 } (safe inside r0) |
//   { shape: 'cone', x, y, a, arc, r } | { shape: 'line', x1, y1, x2, y2, hw }
//   + { t (seconds to the hit), max, team (who made it), src?, kind ('bone' | 'soul' | 'blade' | 'water': the colour),
//       hit?: { dmg, ...hurt options }, onFire?(w, z) }
// Pushed with addDanger; the sim counts t down, strikes at 0 (only if src is still standing), and drops it soon after.
export function addDanger(w, z) { z.max = z.max || z.t; z.age = 0; w.danger.push(z); return z; }
export function inZone(z, x, y, pad = 0) {
  switch (z.shape) {
    case 'circle': return dist2(x, y, z.x, z.y) < (z.r + pad) ** 2;
    case 'ring': { const d = dist(x, y, z.x, z.y); return d > z.r0 - pad && d < z.r1 + pad; }
    case 'cone': { const d = dist(x, y, z.x, z.y); return d < z.r + pad && (d < pad + 8 || angleDiff(angleTo(z.x, z.y, x, y), z.a) < z.arc / 2 + Math.atan2(pad, Math.max(d, 1))); }
    case 'line': {
      const dx = z.x2 - z.x1, dy = z.y2 - z.y1, L2 = dx * dx + dy * dy || 1;
      const k = clamp(((x - z.x1) * dx + (y - z.y1) * dy) / L2, 0, 1);
      return dist2(x, y, z.x1 + dx * k, z.y1 + dy * k) < (z.hw + pad) ** 2;
    }
  }
  return false;
}
const threatens = (z, u) => z.team !== u.team && z.t > 0;
function dangerTick(w, dt) {
  for (const z of w.danger) {
    z.t -= dt; z.age += dt;
    if (z.t > 0 || z.done) continue;
    z.done = true;
    if (z.src && (z.src.dead || z.src.downed)) { z.cancelled = true; continue; }
    if (z.hit) for (const o of w.units) if (alive(o) && o.team !== z.team && inZone(z, o.x, o.y, o.r * 0.5)) hurt(w, o, z.hit.dmg, z.src || null, { noDodge: true, ...z.hit });
    if (z.onFire) z.onFire(w, z);
  }
  w.danger = w.danger.filter((z) => z.t > -0.3);
}
// Where to stand to be out of every zone that threatens u: the nearest safe spot (null if u is safe).
// A unit only reacts once a zone has been showing for its reaction time.
function dangerEscape(w, u) {
  if (!w.danger.length) return null;
  if (u.react == null) u.react = rrange(0.12, 0.32);
  const live = w.danger.filter((z) => threatens(z, u) && z.age >= u.react);
  if (!live.some((z) => inZone(z, u.x, u.y, u.r * 0.6))) { u.escape = null; return null; }
  if (u.escape && u.escape.until > w.time && !live.some((z) => inZone(z, u.escape.x, u.escape.y, u.r * 0.75))) return u.escape;
  let best = null, bd = Infinity;
  for (let i = 0; i < DIRS; i++) for (let d = 24; d <= 300; d += 22) {
    const x = u.x + DIR_X[i] * d, y = u.y + DIR_Y[i] * d;
    if (x < u.r || y < u.r || x > w.W - u.r || y > w.H - u.r || !lineClear(w, u.x, u.y, x, y, u.r * 0.8)) break;
    if (live.some((z) => inZone(z, x, y, u.r * 0.75))) continue;
    const cost = d + (live.some((z) => z.shape !== 'ring' && dist(x, y, z.x ?? z.x1, z.y ?? z.y1) < dist(u.x, u.y, z.x ?? z.x1, z.y ?? z.y1)) ? 25 : 0);
    if (cost < bd) { bd = cost; best = { x, y }; }
    break;
  }
  u.escape = best ? { ...best, until: w.time + 0.3 } : null;
  return u.escape;
}

// ---------------------------------------------------------------- context steering
const interest = new Float32Array(DIRS), danger = new Float32Array(DIRS);

function steer(w, u, gx, gy, opts = {}) {
  const gl = Math.hypot(gx, gy);
  if (gl < 1e-4) return [0, 0];
  gx /= gl; gy /= gl;
  for (let i = 0; i < DIRS; i++) {
    const dp = DIR_X[i] * gx + DIR_Y[i] * gy;
    interest[i] = Math.max(0, dp) + (opts.side ? 0.15 * Math.max(0, DIR_X[i] * -gy * opts.side + DIR_Y[i] * gx * opts.side) : 0);
    danger[i] = 0;
  }
  const R = u.r;
  const look = 46 + R;
  // walls
  for (let i = 0; i < DIRS; i++) {
    const dx = DIR_X[i], dy = DIR_Y[i];
    let tWall = Infinity;
    if (dx > 0) tWall = Math.min(tWall, (w.W - R - u.x) / dx); if (dx < 0) tWall = Math.min(tWall, (R - u.x) / dx);
    if (dy > 0) tWall = Math.min(tWall, (w.H - R - u.y) / dy); if (dy < 0) tWall = Math.min(tWall, (R - u.y) / dy);
    if (tWall < look) danger[i] = Math.max(danger[i], 1 - tWall / look);
  }
  const avoidCircle = (cx, cy, cr, weight, range) => {
    const d = dist(u.x, u.y, cx, cy) - cr - R;
    if (d > range) return;
    const a = angleTo(u.x, u.y, cx, cy);
    const spread = Math.atan2(cr + R, Math.max(1, d + cr + R)) + 0.25;
    const k = weight * clamp(1 - d / range, 0, 1);
    for (let i = 0; i < DIRS; i++) {
      const ad = angleDiff(i / DIRS * TAU, a);
      if (ad < spread) danger[i] = Math.max(danger[i], k * (1 - ad / (spread * 1.6)));
    }
  };
  for (const p of w.pillars) avoidCircle(p.x, p.y, p.r, 1, 70);
  // telegraphed hits: don't walk into one (escaping one that's already under you is movement()'s job)
  if (w.danger.length) for (const z of w.danger) {
    if (!threatens(z, u) || inZone(z, u.x, u.y, R * 0.6)) continue;
    for (let i = 0; i < DIRS; i++) if (inZone(z, u.x + DIR_X[i] * look, u.y + DIR_Y[i] * look, R * 0.6)) danger[i] = Math.max(danger[i], 0.92);
  }
  for (const r of w.walls) {
    if (u.x < r.x - look - R || u.x > r.x + r.w + look + R || u.y < r.y - look - R || u.y > r.y + r.h + look + R) continue;
    // already against this wall: only the directions into it are blocked (rays from inside the padded box all read
    // as blocked, which froze units touching a wall)
    const touch = circleRect(u.x, u.y, R + 2, r);
    if (touch) {
      for (let i = 0; i < DIRS; i++) { const into = -(DIR_X[i] * touch.nx + DIR_Y[i] * touch.ny); if (into > 0.15) danger[i] = Math.max(danger[i], Math.min(1, into * 1.4)); }
      continue;
    }
    for (let i = 0; i < DIRS; i++) { const tt = rayToRect(u.x, u.y, DIR_X[i], DIR_Y[i], r, R); if (tt < look) danger[i] = Math.max(danger[i], 1 - tt / look); }
  }
  const fear = u.team === 'hero' ? 0.9 : 0.45;
  for (const h of w.hazards) if (!h.hidden && (h.type !== 'oil' || u.team === 'hero')) avoidCircle(h.x, h.y, h.r * 0.85, h.type === 'oil' ? 0.35 : fear, 40);
  for (const o of w.units) {
    if (o === u || !alive(o) || o.ethereal || u.ethereal) continue;
    if (o.team === u.team) avoidCircle(o.x, o.y, o.r + (u.team === 'hero' ? 14 : 0), 0.45, 18);
    else if (u.def.role === 'ranged' && o !== u.target) avoidCircle(o.x, o.y, o.r, 0.7, 60);
    else if (u.def.role === 'skirmish' && u.team === 'hero' && o !== u.target) avoidCircle(o.x, o.y, o.r, 0.75, 55);
  }
  let bi = 0, bv = -1;
  for (let i = 0; i < DIRS; i++) {
    const v = interest[i] * (1 - danger[i]);
    if (v > bv) { bv = v; bi = i; }
  }
  if (bv < 0.04) return [0, 0];
  // blend with neighbours for smoother headings
  const l = (bi + DIRS - 1) % DIRS, r = (bi + 1) % DIRS;
  const vl = interest[l] * (1 - danger[l]), vr = interest[r] * (1 - danger[r]);
  let x = DIR_X[bi] * bv + DIR_X[l] * vl * 0.5 + DIR_X[r] * vr * 0.5;
  let y = DIR_Y[bi] * bv + DIR_Y[l] * vl * 0.5 + DIR_Y[r] * vr * 0.5;
  const n = Math.hypot(x, y) || 1;
  return [x / n, y / n];
}

// Head for (tx,ty): straight there if there's a clear line, else along an A* route round the walls.
function goalVec(w, u, tx, ty) {
  if (!w.walls.length || lineClear(w, u.x, u.y, tx, ty, u.r * 0.9)) { u.path = null; return [tx - u.x, ty - u.y]; }
  u.pathT -= 1 / 60;
  const moved = !u.pathGoal || Math.hypot(u.pathGoal.x - tx, u.pathGoal.y - ty) > 60;
  if (!u.path || u.pathT <= 0 || moved) { u.path = findPath(w, u.x, u.y, tx, ty); u.pathT = 0.6; u.pathGoal = { x: tx, y: ty }; }
  if (!u.path || !u.path.length) return [tx - u.x, ty - u.y];
  // the furthest route point we can see
  let k = 0;
  for (let i = u.path.length - 1; i >= 0; i--) if (lineClear(w, u.x, u.y, u.path[i].x, u.path[i].y, u.r * 0.9)) { k = i; break; }
  if (k > 0) u.path.splice(0, k);
  const p = u.path[0];
  if (Math.hypot(p.x - u.x, p.y - u.y) < 16 && u.path.length > 1) u.path.shift();
  return [u.path[0].x - u.x, u.path[0].y - u.y];
}

function movement(w, u, dt) {
  let gx = 0, gy = 0, side = 0, mult = 1;
  const t = u.target;
  const esc = dangerEscape(w, u);
  if (esc) {
    [gx, gy] = goalVec(w, u, esc.x, esc.y); mult = 1; // out of the telegraphed hit first
  } else if (u.forcedGoal) {
    [gx, gy] = goalVec(w, u, u.forcedGoal.x, u.forcedGoal.y);
    // ease in on arrival so momentum doesn't carry it past and swing it back and forth
    const gd = Math.hypot(u.forcedGoal.x - u.x, u.forcedGoal.y - u.y);
    if (gd < 14) { gx = gy = 0; } else mult = clamp(gd / 90, 0.25, 1);
    if (u.forcedGoal.slow) mult *= u.forcedGoal.slow;
  } else if (u.coinGoal && (!t || dist(u.x, u.y, t.x, t.y) > 240)) {
    [gx, gy] = goalVec(w, u, u.coinGoal.x, u.coinGoal.y); mult = clamp(u.coinGoal.d / 90, 0.35, 0.9);
  } else if (!t && u.team === 'hero' && !w.cleared) {
    // nothing in sight: press on through the room together, the slowest setting the pace
    // towards the next chunk of the room the party hasn't walked yet (dungeon.js keeps w.wp)
    const al = allies(w, u);
    const wx = w.wp ? w.wp.x : Math.min(w.W - 70, u.x + 220), wy = w.wp ? w.wp.y : u.y;
    let md = dist(u.x, u.y, wx, wy); for (const a of al) md += dist(a.x, a.y, wx, wy); md /= al.length + 1;
    const ahead = md - dist(u.x, u.y, wx, wy);
    [gx, gy] = goalVec(w, u, wx, wy);
    if (dist(u.x, u.y, wx, wy) < 60) { gx *= 0.2; gy *= 0.2; }
    mult = ahead > 90 ? 0.15 : ahead < -60 ? 0.85 : 0.6;
  } else if (!t || u.mode === 'wander') {
    u.wanderA += rrange(-1.2, 1.2) * dt;
    gx = Math.cos(u.wanderA); gy = Math.sin(u.wanderA); mult = 0.35;
    if (u.team === 'hero') { // heroes drift together instead of scattering
      const al = allies(w, u);
      if (al.length) { let cx = 0, cy = 0; for (const a of al) { cx += a.x; cy += a.y; } cx /= al.length; cy /= al.length;
        if (dist(u.x, u.y, cx, cy) > 90) { gx = cx - u.x; gy = cy - u.y; mult = 0.6; } }
    }
  } else {
    const d = dist(u.x, u.y, t.x, t.y);
    const tx = (t.x - u.x) / (d || 1), ty = (t.y - u.y) / (d || 1);
    switch (u.mode) {
      case 'approach': {
        [gx, gy] = goalVec(w, u, t.x, t.y); { const l = Math.hypot(gx, gy) || 1; gx /= l; gy /= l; }
        const gap = d - u.r - t.r;
        if (u.kind === 'rat') {
          // rats dart side to side on the way in, then circle in close until their bite is ready
          const z = Math.sin(w.time * 7 + u.id * 1.7) * 0.85;
          gx += -ty * z; gy += tx * z;
          if (gap < 55 && u.atkT > 0.2) { gx = -ty * u.strafeSign + tx * 0.25; gy = tx * u.strafeSign + ty * 0.25; }
        }
        if (gap < u.def.range * 0.6) { gx = gy = 0; }
        break;
      }
      case 'hold': gx = gy = 0; break;
      case 'kite': {
        let ax = 0, ay = 0;
        for (const o of opponents(w, u)) { const od = dist(u.x, u.y, o.x, o.y); if (od < u.def.keep * 1.3) { ax += (u.x - o.x) / (od * od + 1); ay += (u.y - o.y) / (od * od + 1); } }
        gx = ax; gy = ay; side = u.strafeSign; break;
      }
      case 'strafe': {
        gx = -ty * u.strafeSign; gy = tx * u.strafeSign;
        const want = u.def.role === 'ranged' ? u.def.range * 0.75 : u.r + t.r + 50;
        const corr = clamp((d - want) / 80, -1, 1);
        gx += tx * corr; gy += ty * corr; mult = 0.8; break;
      }
      case 'flank': {
        const bx = t.x - Math.cos(t.facing) * (t.r + u.r + 8), by = t.y - Math.sin(t.facing) * (t.r + u.r + 8);
        [gx, gy] = goalVec(w, u, bx, by);
        if (Math.hypot(gx, gy) < 8) { gx = tx; gy = ty; mult = 0.3; }
        side = u.strafeSign; break;
      }
      case 'retreat': gx = -tx; gy = -ty; side = u.strafeSign; mult = d < 260 ? 0.7 : 0.9; break; // backpedalling is slower
    }
  }
  // formation, lightly: an archer nearer the enemy than the knight leans back towards him
  if (roleAlias(u) === 'archer' && u.team === 'hero' && t && !u.forcedGoal) {
    const kn = w.units.find((o) => o.team === u.team && (o.kind === 'knight' || o.def.heroRole === 'tank') && alive(o));
    if (kn) {
      const da = dist(u.x, u.y, t.x, t.y), dk = dist(kn.x, kn.y, t.x, t.y);
      if (da < dk) { const kd = dist(u.x, u.y, kn.x, kn.y) || 1; const k = 0.45 * clamp((dk - da) / 120, 0, 1);
        const gl = Math.hypot(gx, gy) || 1; gx = gx / gl + (kn.x - u.x) / kd * k; gy = gy / gl + (kn.y - u.y) / kd * k; }
    }
  }
  const wants = Math.hypot(gx, gy) > 0.05 && mult > 0.2;
  const mv = Math.hypot(u.x - (u.lastX ?? u.x), u.y - (u.lastY ?? u.y)); u.lastX = u.x; u.lastY = u.y;
  u.stuckT = wants && mv < 12 * dt ? (u.stuckT || 0) + dt : Math.max(0, (u.stuckT || 0) - dt * 2);
  if (u.stuckT > 1.2) { u.unstickT = 0.7; u.unstickA = rand() * TAU; u.stuckT = 0; u.path = null; }
  if (u.unstickT > 0) { u.unstickT -= dt; gx = Math.cos(u.unstickA); gy = Math.sin(u.unstickA); mult = Math.max(mult, 0.7); }
  const [sx, sy] = steer(w, u, gx, gy, { side });
  drive(u, sx, sy, speedOf(u) * mult * (esc ? 1.1 : 1), dt, esc ? 2.2 : 1); // getting out of a telegraph is a scramble: quick to turn and go
}

// Momentum: the movement heading swings at the unit's turn rate, speed builds up and drops off,
// and a sharp turn bleeds speed. Nothing snaps.
function drive(u, sx, sy, want, dt, quick = 1) {
  const d = u.def;
  const k = 1 - Math.exp(-dt * 7);                // smooth the steering wish a little
  u.sdx += (sx - u.sdx) * k; u.sdy += (sy - u.sdy) * k;
  const m = Math.hypot(u.sdx, u.sdy);
  let goal = 0;
  if (m > 0.15 && want > 0) {
    const a = Math.atan2(u.sdy, u.sdx);
    const diff = wrapAngle(a - u.mvA);
    const turn = (d.turn || 5) * dt * quick * (u.spd < 15 ? 2.2 : 1); // turning on the spot is quicker than mid-stride
    u.mvA = wrapAngle(u.mvA + clamp(diff, -turn, turn));
    goal = want * Math.min(1, m) * Math.max(0.2, Math.cos(Math.min(Math.PI / 2, Math.abs(diff))));
  }
  const acc = (d.accel || 250) * dt * quick;
  u.spd += clamp(goal - u.spd, -acc * 1.6, acc);
  if (u.spd < 0) u.spd = 0;
  u.dvx = Math.cos(u.mvA) * u.spd; u.dvy = Math.sin(u.mvA) * u.spd;
}

// ---------------------------------------------------------------- facing
function updateFacing(u, dt) {
  let want = null;
  const t = u.target;
  if (t && !u.forcedGoal) {
    const d = dist(u.x, u.y, t.x, t.y);
    // backing off after a hit keeps the face to the enemy (a backpedal), rather than turning round to run
    const near = d < (u.def.role === 'ranged' ? u.def.range + 60 : 140) || u.mode === 'hold' || u.mode === 'kite';
    if (u.mode === 'retreat' ? d < 260 : near) want = angleTo(u.x, u.y, t.x, t.y);
  }
  if (want === null && u.spd > 8) want = u.mvA;
  if (want === null) return;
  const rate = (u.def.face || 5) * dt;
  const diff = wrapAngle(want - u.facing);
  u.facing = wrapAngle(u.facing + clamp(diff, -rate, rate));
}

// ---------------------------------------------------------------- damage & statuses
function text(w, x, y, s, color = '#FFFFFF', size = 1, pop = false) {
  w.texts.push({ x, y, s: String(s), color, size, life: 0.9, max: 0.9, vy: -40, pop });
}
// Text above a unit: anchored on the unit, lifted 'up' towards the top of the screen (the renderer knows which way that is).
function textU(w, x, y, up, s, color = '#FFFFFF', size = 1, pop = false) {
  w.texts.push({ x, y, up, s: String(s), color, size, life: 0.9, max: 0.9, vy: -40, pop });
}
function puff(w, x, y, color, n = 8, spd = 90, size = 5, life = 0.5) {
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU, v = spd * rrange(0.3, 1);
    w.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * rrange(0.6, 1), max: life, size: size * rrange(0.6, 1.3), color });
  }
}

// Shaped particles: 'flame' (licks of fire that rise and shrink), 'spark' (impact streaks), 'shard' (ice).
function flames(w, x, y, n, spread = 14, up = 70) {
  for (let i = 0; i < n; i++) w.particles.push({ shape: 'flame', x: x + rrange(-spread, spread), y: y + rrange(-spread, spread) * 0.6,
    vx: rrange(-20, 20), vy: rrange(-20, 20), rise: up * rrange(0.6, 1.1), up: 0, life: rrange(0.35, 0.6), max: 0.6, size: rrange(5, 9), color: '#FF8A3D', drag: 0.97 });
}
function sparks(w, x, y, a, n, color = '#FFFFFF', big = 1) {
  for (let i = 0; i < n; i++) { const b = a + rrange(-0.9, 0.9), v = rrange(180, 360) * big;
    w.particles.push({ shape: 'spark', x, y, vx: Math.cos(b) * v, vy: Math.sin(b) * v, life: 0.16, max: 0.16, size: 3 * big, color, drag: 0.85 }); }
}

export function hurt(w, u, amount, src, o = {}) {
  if (!alive(u) || u.invulnT > 0 || amount <= 0 || u.ethereal) return 0;
  if (u.team === 'enemy') wake(w, u);
  if (u.sleepT > 0 && !o.dot) u.sleepT = 0;
  // a hook can make the blow miss entirely (Blink Stone)
  if (!o.dot && hooksOf(u).some((h) => h.evade && h.evade(w, u, src, amount, o))) return 0;
  // someone guarding this unit takes part of the blow
  if (u.guardBy && u.guardT > 0 && alive(u.guardBy) && !o.dot && !o.guarded) {
    const share = amount * (u.guardShare || 0.4); amount -= share;
    hurt(w, u.guardBy, share, src, { ...o, guarded: true, knock: 0 });
  }
  if (u.act && u.act.type === 'drink' && !o.dot) u.act = null;
  if (!o.dot && !o.noDodge && u.def.dodge && chance(u.def.dodge)) { textU(w, u.x, u.y, u.r, 'dodge', '#CFE8FF', 0.8); return 0; }
  let amt = amount;
  if (src && alive(src)) { for (const h of hooksOf(src)) if (h.dealt) amt = h.dealt(w, src, u, amt, o); amt *= buffMul(src, 'dealt'); }
  for (const h of hooksOf(u)) if (h.taken) amt = h.taken(w, u, src, amt, o);
  amt *= buffMul(u, 'taken');
  if (u.koT > 0) amt *= 1.5;                                 // knocked out: wide open
  if (u.frozenT > 0 && u.frozenBonus) amt *= u.frozenBonus;  // Frost Nova III
  if (!o.dot && src) for (const b of u.buffs) if (b.frontBlock && angleDiff(angleTo(u.x, u.y, src.x, src.y), u.facing) < 1.3) {
    amt *= 1 - b.frontBlock; if (b.reflect && alive(src) && src !== u) hurt(w, src, amount * b.reflect, u, { noDodge: true, dot: true });
  }
  const shield = u.shield ?? u.def.shield; // u.shield / u.shieldArc: a shield raised as an action (brains set them)
  if (!o.dot && shield && src) {
    const a = angleTo(u.x, u.y, src.x, src.y);
    if (angleDiff(a, u.facing) < (u.shieldArc ?? 1.25)) { amt *= 1 - shield; puff(w, u.x + Math.cos(u.facing) * u.r, u.y + Math.sin(u.facing) * u.r, '#E8EDF3', 3, 60, 3, 0.25); }
  }
  // shatter: a hard hit on a frozen unit
  if (u.frozenT > 0 && !o.dot && (o.heavy || amount >= 12 || (o.knock || 0) >= 150)) shatter(w, u, src);
  u.hp -= amt;
  if (!o.dot) {
    const fromA = src ? angleTo(src.x, src.y, u.x, u.y) : o.kAngle != null ? o.kAngle : rand() * TAU;
    u.hitT = 0.16; u.hitA = fromA;
    const big = o.heavy || o.crit || amt >= 14;
    sparks(w, u.x - Math.cos(fromA) * u.r * 0.6, u.y - Math.sin(fromA) * u.r * 0.6, fromA, big ? 7 : 4, o.crit ? '#FFE14D' : '#FFFFFF', big ? 1.3 : 1);
    if (big) { w.hitstop = Math.max(w.hitstop, o.crit ? 0.09 : 0.06); w.shake = Math.max(w.shake, 4); }
    if (src && (src.kind === 'knight' || src.def.heroRole === 'tank') && u.team === 'enemy') { u.tauntBy = src; u.tauntT = 3; }
    u.flashT = 0.12; textU(w, u.x + rrange(-6, 6), u.y, u.r + 4, Math.round(amt), o.crit ? '#FFE14D' : '#FFFFFF', o.crit ? 1.3 : 1, true); }
  else { u.dotAcc += amt; if (u.dotAcc >= 4) { textU(w, u.x, u.y, u.r, Math.round(u.dotAcc), o.color || '#FF9A55', 0.75); u.dotAcc = 0; } }
  if (src && alive(src)) { const ls = src.buffs.reduce((a, b) => a + (b.lifesteal || 0), 0); if (ls) heal(w, src, amt * ls, src); }
  if (o.knock && !knockImmune(u)) {
    const a = o.kAngle != null ? o.kAngle : src ? angleTo(src.x, src.y, u.x, u.y) : rand() * TAU;
    const k = o.knock / u.mass * (u.st.wet > 60 ? 1.7 : 1);   // soaked units fly further
    u.kx += Math.cos(a) * k; u.ky += Math.sin(a) * k;
  }
  for (const s of ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger']) if (o[s]) addStatus(w, u, s, o[s], src);
  if (src && alive(src) && !o.dot) for (const h of hooksOf(src)) if (h.hit) h.hit(w, src, u, amt, o);
  if (!o.dot) for (const h of hooksOf(u)) if (h.struck) h.struck(w, u, src, amt, o);
  if (u.hp <= 0 && hooksOf(u).some((h) => h.downed && h.downed(w, u, src))) return amt;
  if (u.hp <= 0) kill(w, u, src);
  return amt;
}

export function addStatus(w, u, type, amount, src) {
  if (!alive(u) || u.ethereal || immuneTo(u, type)) return;
  const res = (u.def.res && u.def.res[type]) ?? 1;
  const s = u.st;
  if (type === 'chill' && s.wet > 30) amount *= 1.5;          // wet freezes easier
  if (type === 'shock' && s.wet > 30 && src) for (const h of hooksOf(src)) if (h.shockMul) amount *= h.shockMul;
  s[type] = (s[type] || 0) + amount * res;
  if (type === 'wet') {
    s.poison *= 0.5;                                             // water washes poison off
    if (s.wet >= 100) {                                          // soaked through: slips, spins, leaves a puddle
      s.wet = 60; u.act = { type: 'slip', t: 1, max: 1 }; u.stunT = Math.max(u.stunT, 1);
      // no new puddle on top of one: slipping in a puddle used to make puddles that soak and slip again, without end
      if (!w.hazards.some((h) => h.type === 'water' && dist(u.x, u.y, h.x, h.y) < h.r + 20)) w.hazards.push({ type: 'water', x: u.x, y: u.y, r: 42, t: 6, max: 6 });
      textU(w, u.x, u.y, u.r + 10, 'SLIP', '#8FD3FF', 1);
    }
    return;
  }
  if (type === 'shock') { s.shock = Math.min(120, s.shock); return; }
  if (type === 'stagger') {
    u.stunT = Math.max(u.stunT, u.def.boss ? 0.05 : 0.15);
    if (s.stagger >= 100) { s.stagger = 0; u.koT = u.def.boss ? 1.2 : 2.5; u.stunT = Math.max(u.stunT, u.koT); u.act = null; textU(w, u.x, u.y, u.r + 12, 'KO', '#FFE7A0', 1.2); }
    return;
  }
  if (type === 'burn') {
    if (u.frozenT > 0) { u.frozenT = 0; s.chill = 0; puff(w, u.x, u.y, 'rgba(235,240,245,0.8)', 10, 60, 9, 0.8); textU(w, u.x, u.y, u.r, 'thaw', '#DDEAF2', 0.8); }
    s.chill = Math.max(0, s.chill - amount);
    if (s.burn >= 100) { s.burn = 20; textU(w, u.x, u.y, u.r + 12, 'SCORCH', '#FF7A2F', 1.2); hurt(w, u, 22, src, { noDodge: true }); explode(w, u.x, u.y, 60, 10, { burn: 24 }, src, '#FF7A2F', u); }
  } else if (type === 'chill') {
    const need = 100 + u.freezeImmune;
    if (s.chill >= need && u.frozenT <= 0) {
      u.frozenT = u.def.boss ? 1.6 : 3; s.chill = 0; s.burn = 0; u.freezeImmune += 45; u.act = null;
      textU(w, u.x, u.y, u.r + 12, 'FREEZE', '#7FD6F5', 1.2); puff(w, u.x, u.y, '#BFEFFF', 10, 70, 4);
    }
  } else if (type === 'poison') {
    if (s.poison >= 100) { s.poison = 30; textU(w, u.x, u.y, u.r + 12, 'ROT', '#9BCB3C', 1.2); hurt(w, u, u.maxHp * 0.15, src, { noDodge: true, color: '#9BCB3C' }); }
  }
}

function shatter(w, u, src) {
  u.frozenT = 0; u.st.chill = 0;
  textU(w, u.x, u.y, u.r + 14, 'SHATTER', '#BFEFFF', 1.3);
  u.hp -= 26; u.flashT = 0.15;
  puff(w, u.x, u.y, '#E6F8FF', 18, 160, 5, 0.6);
  w.shake = Math.max(w.shake, 6);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + rand() * 0.3;
    w.projectiles.push({ kind: 'icicle', x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340,
      r: 5, team: 'neutral', owner: src, skip: u, dmg: 7, o: { chill: 30, noDodge: true }, life: 0.6 });
  }
}

export function explode(w, x, y, r, dmg, statuses, src, color, skip) {
  w.telegraphs.push({ type: 'blast', x, y, r, t: 0.25, max: 0.25, color });
  if (statuses.burn) { flames(w, x, y, 14, r * 0.6, 90); sparks(w, x, y, 0, 0); }
  else puff(w, x, y, color, 16, r * 3, 6, 0.45);
  w.shake = Math.max(w.shake, 4);
  for (const o of w.units) {
    if (!alive(o) || o === skip) continue;
    if (dist(x, y, o.x, o.y) > r + o.r) continue;
    const friendly = src && o.team === src.team;
    hurt(w, o, dmg * (friendly ? 0.4 : 1), src, { noDodge: true, knock: 110, kAngle: angleTo(x, y, o.x, o.y),
      ...Object.fromEntries(Object.entries(statuses).map(([k, v]) => [k, v * (friendly ? 0.4 : 1)])) });
  }
  if (statuses.burn) igniteAround(w, x, y, r);
}

function igniteAround(w, x, y, r) {
  for (const h of [...w.hazards]) {
    if (dist(x, y, h.x, h.y) > r + h.r) continue;
    if (h.type === 'oil') { h.type = 'fire'; h.t = 5; h.max = 5; }
    else if (h.type === 'gas') { w.hazards.splice(w.hazards.indexOf(h), 1); text(w, h.x, h.y, 'BOOM', '#FFB347', 1.3); explode(w, h.x, h.y, h.r * 1.35, 18, { burn: 30 }, null, '#FFB347'); }
  }
}

function kill(w, u, src) {
  u.hp = 0;
  if (src && src !== u && alive(src)) for (const h of hooksOf(src)) if (h.kill) h.kill(w, src, u);
  for (const o of w.units) if (o !== u && alive(o) && dist(o.x, o.y, u.x, u.y) < 260) for (const h of hooksOf(o)) if (h.death) h.death(w, o, u);
  if (u.boom) explode(w, u.x, u.y, 80, 16, {}, u.summonBy || null, '#9BE07A', u);
  if (!u.summon) {   // going down (a hero) or dying: its own hooks, then its side's
    for (const h of hooksOf(u)) if (h.fallen) h.fallen(w, u, src);
    for (const o of w.units) if (o !== u && o.team === u.team && alive(o)) for (const h of hooksOf(o)) if (h.allyDown) h.allyDown(w, o, u);
  }
  if (u.summon) { u.dead = true; puff(w, u.x, u.y, '#9BE07A', 10, 80, 5, 0.5); return; } // summons just fade
  if (u.team === 'hero') {
    u.downed = true; u.act = null; u.frozenT = 0; u.st = { burn: 0, chill: 0, poison: 0 };
    textU(w, u.x, u.y, u.r + 10, 'DOWN', '#FF8A80', 1.1);
    emit(w, 'heroDown', u);
    return;
  }
  u.dead = true;
  w.corpses.push({ kind: u.kind, x: u.x, y: u.y, vr: u.vr, facing: u.facing, t: 0.35, max: 0.35, kx: u.kx * 0.3, ky: u.ky * 0.3 });
  puff(w, u.x, u.y, u.kind.startsWith('slime') ? '#6CC9B0' : u.kind === 'rat' ? '#9C8676' : '#EDE4CD', 12, 120, 5, 0.5);
  if (u.st.poison > 40) w.hazards.push({ type: 'gas', x: u.x, y: u.y, r: 52, t: 4, max: 4 });
  if (u.def.splits && u.gen === 0) {
    for (const s of [-1, 1]) {
      const c = spawn(w, 'slimeSmall', u.x + s * 12, u.y + s * 4, { mult: w.mult, gen: 1 });
      c.kx = s * 140; c.ky = rrange(-60, 60);
    }
  }
  const [c0, c1] = u.def.coins || [0, 0];
  const coins = rint(c0, c1);
  for (let i = 0; i < coins; i++) w.pickups.push({ type: 'coin', x: u.x + rrange(-10, 10), y: u.y + rrange(-10, 10), vx: rrange(-80, 80), vy: rrange(-80, 80), v: 1 });
  if (u.hasKey) w.pickups.push({ type: 'key', x: u.x, y: u.y, vx: 0, vy: 0 });
  emit(w, 'kill', u, src);
}

// ---------------------------------------------------------------- attacks & abilities
function inMeleeArc(u, o, extra = 0) {
  const d = dist(u.x, u.y, o.x, o.y) - u.r - o.r;
  if (d > (u.def.range + extra)) return false;
  return angleDiff(angleTo(u.x, u.y, o.x, o.y), u.facing) < (u.def.arc || 1.5) / 2 + 0.2;
}

function meleeSwing(w, u, single) {
  const d = u.def;
  const targets = single ? (u.target && inMeleeArc(u, u.target, 6) ? [u.target] : []) : w.units.filter((o) => alive(o) && o.team !== u.team && inMeleeArc(u, o, 6));
  u.lungeT = 0.18;
  w.telegraphs.push({ type: 'swing', x: u.x, y: u.y, r: u.r + d.range + 10, a: u.facing, arc: d.arc || 1.5, t: 0.16, max: 0.16, color: u.team === 'hero' ? '#FFFFFF' : '#FFD2C2' });
  for (const o of targets) {
    hurt(w, o, d.dmg * u.dmgMul * rrange(0.9, 1.1), u, { knock: d.knock || 40, heavy: d.heavy, poison: d.poison });
  }
}

function fireArrow(w, u, angle, o = {}) {
  const sp = o.speed || 520;
  u.recoilT = 0.14;
  w.projectiles.push({ kind: o.fire ? 'fireArrow' : (u.def.proj || 'arrow'), color: u.def.projColor, x: u.x + Math.cos(angle) * (u.r + 6), y: u.y + Math.sin(angle) * (u.r + 6),
    vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp, r: 6, team: u.team, owner: u, dmg: (o.dmg || u.def.dmg) * u.dmgMul,
    o: { chill: o.fire ? 0 : u.def.chill, burn: o.fire ? 20 : 0, knock: 30 }, life: 1.2, a: angle });
}

function tryAttack(w, u) {
  const t = u.target;
  if (!t || u.atkT > 0 || u.act || u.forcedGoal) return;
  const d = dist(u.x, u.y, t.x, t.y);
  const face = angleDiff(angleTo(u.x, u.y, t.x, t.y), u.facing);
  const def = u.def;
  if (def.role === 'ranged') {
    if (d <= def.range && face < 0.35 && !blocked(w, u.x, u.y, t.x, t.y)) {
      const lead = d / 520;
      fireArrow(w, u, angleTo(u.x, u.y, t.x + t.vx * lead, t.y + t.vy * lead) + rrange(-0.04, 0.04));
      setAnim(u, def.attackAnim || 'draw', 0.32);
      u.atkT = def.atkCd * rrange(0.9, 1.1); u.lastAttackT = w.time;
    }
    return;
  }
  if (d - u.r - t.r <= def.range + 2 && face < 0.6) {
    if (def.windup) { u.act = { type: 'windup', t: def.windup, max: def.windup }; }
    else meleeSwing(w, u, def.role === 'skirmish');
    setAnim(u, def.attackAnim || (def.role === 'skirmish' ? 'thrust' : 'swing'), (def.windup || 0) + 0.28);
    u.atkT = def.atkCd * rrange(0.9, 1.1); u.lastAttackT = w.time;
    if (u.kind === 'slime' || u.kind === 'slimeSmall') { u.kx += Math.cos(u.facing) * 60; u.ky += Math.sin(u.facing) * 60; }
  }
}

function abilityScore(w, u) {
  const t = u.target; if (!t) return 0;
  const d = dist(u.x, u.y, t.x, t.y);
  const opp = opponents(w, u);
  switch (u.def.ability) {
    case 'barrage': {
      if (d > u.def.range || blocked(w, u.x, u.y, t.x, t.y)) return 0;
      const n = opp.filter((o) => dist(o.x, o.y, t.x, t.y) < 85).length;
      let fuel = 0; // fire arrows into oil or gas
      for (const h of w.hazards) if ((h.type === 'oil' || h.type === 'gas') && opp.some((o) => dist(o.x, o.y, h.x, h.y) < h.r + o.r)) fuel += 0.35;
      return (n - 1) * 0.45 + 0.08 + Math.min(0.7, fuel);
    }
    case 'charge': {
      if (d < 85 || d > 340) return 0;
      const a = angleTo(u.x, u.y, t.x, t.y);
      let n = 0;
      for (const o of opp) { const od = dist(u.x, u.y, o.x, o.y); const off = Math.abs(Math.sin(angleTo(u.x, u.y, o.x, o.y) - a)) * od; if (od < d + 40 && off < 40) n++; }
      const protect = t.target && t.target.team === 'hero' && t.target !== u ? 0.25 : 0;
      // a hazard or wall just past the target: the charge will slam it into it
      let behind = 0;
      const bx = t.x + Math.cos(a) * 90, by = t.y + Math.sin(a) * 90;
      for (const h of w.hazards) if (h.type !== 'gas' && dist(bx, by, h.x, h.y) < h.r + 30) behind = 0.4;
      if (bx < 20 || by < 20 || bx > w.W - 20 || by > w.H - 20) behind = Math.max(behind, 0.25);
      return 0.25 + (n - 1) * 0.35 + protect + behind;
    }
    case 'shadowstep': {
      if (d < 70) return 0;
      return (1 - hpRatio(t)) * 0.6 + (t.target && t.target !== u ? 0.45 : 0) + (t.def.boss ? 0.1 : 0);
    }
    case 'dash': {
      const gap = d - u.r - t.r;
      if (gap < 35 || gap > 170) return 0;
      return angleDiff(u.mvA, angleTo(u.x, u.y, t.x, t.y)) < 0.5 && u.spd > 30 ? 0.7 : 0;
    }
    case 'slam': {
      const n = opp.filter((o) => dist(u.x, u.y, o.x, o.y) < 130).length;
      return n * 0.45 - 0.1;
    }
  }
  return 0;
}

function useAbility(w, u) {
  const t = u.target;
  const def = u.def;
  u.abilT = def.abilCd;
  switch (def.ability) {
    case 'barrage': {
      const base = angleTo(u.x, u.y, t.x, t.y);
      textU(w, u.x, u.y, u.r + 12, 'BARRAGE', '#FFB36B', 0.9);
      for (let i = 0; i < 7; i++) fireArrow(w, u, base + (i - 3) * 0.075 + rrange(-0.02, 0.02), { fire: true, dmg: 7, speed: 470 + i * 8 });
      setAnim(u, 'ability', 0.45);
      u.atkT = Math.max(u.atkT, 0.6);
      break;
    }
    case 'charge': {
      const a = angleTo(u.x, u.y, t.x, t.y);
      u.facing = a;
      u.act = { type: 'charge', t: 0.55, max: 0.55, a, hit: new Set() };
      textU(w, u.x, u.y, u.r + 12, 'CHARGE', '#BFD4FF', 0.9);
      break;
    }
    case 'shadowstep': {
      puff(w, u.x, u.y, 'rgba(60,40,90,0.85)', 14, 70, 8, 0.6);
      const back = t.facing + Math.PI;
      let nx = t.x + Math.cos(back) * (t.r + u.r + 6), ny = t.y + Math.sin(back) * (t.r + u.r + 6);
      nx = clamp(nx, u.r, w.W - u.r); ny = clamp(ny, u.r, w.H - u.r);
      u.x = nx; u.y = ny; u.vx = u.vy = 0; u.facing = angleTo(u.x, u.y, t.x, t.y);
      u.spd = 0; u.mvA = u.facing; u.lungeT = 0.18;
      puff(w, u.x, u.y, 'rgba(60,40,90,0.85)', 14, 70, 8, 0.6);
      hurt(w, t, def.dmg * 3.2 * u.dmgMul, u, { crit: true, poison: 30, noDodge: true });
      setAnim(u, 'thrust', 0.3);
      textU(w, u.x, u.y, u.r + 12, 'BACKSTAB', '#C9A7FF', 0.9);
      u.atkT = def.atkCd; u.lastAttackT = w.time; u.mode = 'retreat'; u.modeT = 0;
      break;
    }
    case 'dash': {
      u.act = { type: 'dash', t: 0.22, max: 0.22, a: u.mvA };
      break;
    }
    case 'slam': {
      u.act = { type: 'slam', t: 0.8, max: 0.8 };
      w.telegraphs.push({ type: 'ring', x: u.x, y: u.y, r: 125, t: 0.8, max: 0.8, color: '#FF6B5A' });
      break;
    }
  }
}

function runAction(w, u, dt) {
  const a = u.act;
  a.t -= dt;
  if (a.type === 'windup') {
    u.dvx = u.dvy = 0;
    if (a.t <= 0) { u.act = null; meleeSwing(w, u, false); }
  } else if (a.type === 'charge') {
    const sp = u.def.speed * 3.6;
    u.dvx = Math.cos(a.a) * sp; u.dvy = Math.sin(a.a) * sp; u.vx = u.dvx; u.vy = u.dvy;
    if (rand() < 0.6) w.particles.push({ x: u.x - Math.cos(a.a) * u.r, y: u.y - Math.sin(a.a) * u.r, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 7, color: 'rgba(220,226,235,0.7)' });
    for (const o of w.units) {
      if (!alive(o) || o.team === u.team || a.hit.has(o)) continue;
      if (dist(u.x, u.y, o.x, o.y) < u.r + o.r + 6) {
        a.hit.add(o);
        const side = Math.sign(Math.sin(angleTo(u.x, u.y, o.x, o.y) - a.a)) || 1;
        hurt(w, o, 18 * u.dmgMul * (a.power || 1), u, { knock: 340 * (a.power || 1), kAngle: a.a + side * 0.6, heavy: true, stagger: a.stagger || 0 });
        w.shake = Math.max(w.shake, 5);
      }
    }
    if (a.t <= 0) u.act = null;
  } else if (a.type === 'drink') {
    u.spd *= Math.exp(-dt * 6); u.dvx = Math.cos(u.mvA) * u.spd; u.dvy = Math.sin(u.mvA) * u.spd;
    if (a.t <= 0) { u.act = null; u.potions--; u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.45); puff(w, u.x, u.y, '#E0604B', 10, 70, 5, 0.6); emit(w, 'drank', u); }
  } else if (a.type === 'dash') {
    const sp = u.def.speed * 3.4;
    u.dvx = Math.cos(a.a) * sp; u.dvy = Math.sin(a.a) * sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = a.a; u.spd = sp;
    if (rand() < 0.5) w.particles.push({ x: u.x - Math.cos(a.a) * u.r, y: u.y - Math.sin(a.a) * u.r, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 5, color: 'rgba(200,190,170,0.7)' });
    if (a.t <= 0) { u.act = null; u.spd = u.def.speed; }
  } else if (a.type === 'leap') {
    const k = 1 - Math.max(0, a.t) / a.max;
    u.x = a.x0 + (a.x1 - a.x0) * k; u.y = a.y0 + (a.y1 - a.y0) * k; u.dvx = u.dvy = 0; u.vx = u.vy = 0;
    u.hop = Math.sin(Math.PI * k) * 40;                        // how high off the ground, for the renderer
    if (a.t <= 0) { u.act = null; u.hop = 0; a.land && a.land(); }
  } else if (a.type === 'channel') {
    u.dvx = u.dvy = 0; a.acc += dt;
    if (a.target && alive(a.target)) u.facing = angleTo(u.x, u.y, a.target.x, a.target.y);
    while (a.acc >= a.every && u.act === a) { a.acc -= a.every; a.tick(); }
    if (a.t <= 0 && u.act === a) u.act = null;
  } else if (a.type === 'slip') {
    u.dvx = u.dvy = 0; u.facing += dt * 14;
    if (a.t <= 0) u.act = null;
  } else if (a.type === 'slam') {
    u.dvx = u.dvy = 0;
    if (a.t <= 0) {
      u.act = null;
      textU(w, u.x, u.y, u.r + 14, 'SLAM', '#FF6B5A', 1.2);
      w.shake = Math.max(w.shake, 9);
      for (const o of w.units) if (alive(o) && o.team !== u.team && dist(u.x, u.y, o.x, o.y) < 125 + o.r)
        hurt(w, o, 20 * u.dmgMul, u, { knock: 260, heavy: true, noDodge: true });
      puff(w, u.x, u.y, '#D9CDB0', 24, 260, 7, 0.6);
    }
  }
}

// ---------------------------------------------------------------- statuses over time
function statusTick(w, u, dt) {
  const s = u.st;
  if (s.wet > 0) s.wet = Math.max(0, s.wet - 6 * dt);
  if (s.stagger > 0) s.stagger = Math.max(0, s.stagger - 12 * dt);
  if (s.shock > 0) {                                             // a stun that comes back every so often
    s.shock = Math.max(0, s.shock - 14 * dt);
    u.shockT = (u.shockT ?? 0.4) - dt;
    if (u.shockT <= 0) { u.shockT = 1.1; u.stunT = Math.max(u.stunT, u.def.boss ? 0.1 : 0.3); sparks(w, u.x, u.y, rand() * TAU, 4, '#FFF27A', 0.8); }
  }
  for (const k of ['stunT', 'rootT', 'sleepT', 'koT', 'guardT', 'guardOfT']) if (u[k] > 0) u[k] = Math.max(0, u[k] - dt);
  for (const b of u.buffs) b.t -= dt;
  if (u.buffs.length) u.buffs = u.buffs.filter((b) => b.t > 0);
  if (u.regenT > 0) { u.regenT -= dt; heal(w, u, u.regenRate * dt, u.regenSrc); }
  if (u.leechT > 0) {                                            // leeches: drain this one, heal the leech-giver's side
    u.leechT -= dt; const got = hurt(w, u, 3 * dt * (u.leechMul || 1), u.leechBy, { dot: true, color: '#C8553D' });
    const side = w.units.filter((a) => alive(a) && u.leechBy && a.team === u.leechBy.team).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (side) heal(w, side, got * 1.5 * (u.leechMul || 1), u.leechBy);
  }
  if (u.lifeT != null) { u.lifeT -= dt; if (u.lifeT <= 0) { kill(w, u, null); return; } }
  if (u.later) { for (const l of u.later) { l.t -= dt; if (l.t <= 0 && !l.done) { l.done = true; l.f(); } } if (u.later.every((l) => l.done)) u.later = null; }
  for (const b of u.buffs) if (b.spinning) {                      // Whirl: hits everything round about, pulls with tier III
    u.spinT = (u.spinT || 0) - dt; if (u.spinT > 0) continue; u.spinT = 0.4;
    w.fx.push({ type: 'ring', x: u.x, y: u.y, r: u.r + 50, color: '#FFFFFF', t: 0, max: 0.2 });
    for (const e of opponents(w, u)) if (dist(u.x, u.y, e.x, e.y) < u.r + e.r + 50) {
      hurt(w, e, u.def.dmg * u.dmgMul * 0.6, u, { kAngle: u.spinPull ? angleTo(e.x, e.y, u.x, u.y) : angleTo(u.x, u.y, e.x, e.y), knock: u.spinPull ? 80 : 120 });
    }
  }
  for (const h of hooksOf(u)) if (h.tick) h.tick(w, u, dt);
  if (s.burn > 0) { s.burn = Math.max(0, s.burn - 7 * dt); if (s.burn >= 30) { hurt(w, u, (2 + s.burn * 0.05) * dt, null, { dot: true, color: '#FF9A55' });
    if (rand() < dt * 9) flames(w, u.x, u.y - u.vr * 0.3, 1, u.vr * 0.6, 60); } }
  if (s.chill > 0) s.chill = Math.max(0, s.chill - 6 * dt);
  if (s.poison > 0) { s.poison = Math.max(0, s.poison - 4 * dt); hurt(w, u, s.poison * 0.07 * dt, null, { dot: true, color: '#9BCB3C' });
    if (s.poison > 25 && rand() < dt * 6) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.7, y: u.y + rrange(-u.r, u.r) * 0.7, vx: 0, vy: -25, life: 0.6, max: 0.6, size: 4, color: '#9BCB3C' }); }
  if (u.frozenT > 0) u.frozenT -= dt;
  if (u.freezeImmune > 0) u.freezeImmune = Math.max(0, u.freezeImmune - 4 * dt);
}

// ---------------------------------------------------------------- physics
const SLAM_SPEED = 210;
function wallHit(w, u, speed) {
  if (speed > SLAM_SPEED) {
    const dmg = 4 + (speed - SLAM_SPEED) * 0.05;
    hurt(w, u, dmg, null, { noDodge: true });
    textU(w, u.x, u.y, u.r + 10, 'SLAM', '#FFD9A0', 0.9);
    puff(w, u.x, u.y, '#CDBFA6', 8, 90, 5, 0.4);
  }
}

function physics(w, dt) {
  const us = w.units;
  for (const u of us) {
    if (u.dead || u.downed) continue;
    const frozen = u.frozenT > 0;
    const acc = Math.min(1, dt * 20);
    if (frozen) { u.vx *= 0.8; u.vy *= 0.8; }
    else { u.vx += (u.dvx - u.vx) * acc; u.vy += (u.dvy - u.vy) * acc; }
    u.x += (u.vx + u.kx) * dt; u.y += (u.vy + u.ky) * dt;
    const kd = Math.exp(-5 * dt); u.kx *= kd; u.ky *= kd;
    // walls
    const ks = Math.hypot(u.kx, u.ky);
    if (u.x < u.r) { u.x = u.r; if (u.kx < 0) { wallHit(w, u, ks); u.kx *= -0.25; } }
    if (u.x > w.W - u.r) { u.x = w.W - u.r; if (u.kx > 0) { wallHit(w, u, ks); u.kx *= -0.25; } }
    if (u.y < u.r) { u.y = u.r; if (u.ky < 0) { wallHit(w, u, ks); u.ky *= -0.25; } }
    if (u.y > w.H - u.r) { u.y = w.H - u.r; if (u.ky > 0) { wallHit(w, u, ks); u.ky *= -0.25; } }
    for (const r of w.walls) {
      const c = circleRect(u.x, u.y, u.r, r); if (!c) continue;
      u.x += c.nx * c.over; u.y += c.ny * c.over;
      const into = -(u.kx * c.nx + u.ky * c.ny);
      if (into > 0) { wallHit(w, u, into); u.kx += c.nx * into * 1.25; u.ky += c.ny * into * 1.25; }
    }
    for (const p of w.pillars) {
      const d = dist(u.x, u.y, p.x, p.y), m = u.r + p.r;
      if (d < m && d > 0) {
        const nx = (u.x - p.x) / d, ny = (u.y - p.y) / d;
        u.x = p.x + nx * m; u.y = p.y + ny * m;
        const into = -(u.kx * nx + u.ky * ny);
        if (into > 0) { wallHit(w, u, into); u.kx += nx * into * 1.25; u.ky += ny * into * 1.25; }
      }
    }
  }
  // unit-unit
  for (let i = 0; i < us.length; i++) {
    const a = us[i]; if (a.dead || a.downed || a.ethereal) continue;
    for (let j = i + 1; j < us.length; j++) {
      const b = us[j]; if (b.dead || b.downed || b.ethereal) continue;
      const dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy; const m = a.r + b.r;
      if (d2 >= m * m || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = m - d;
      const ta = b.mass / (a.mass + b.mass), tb = 1 - ta;
      a.x -= nx * over * ta; a.y -= ny * over * ta; b.x += nx * over * tb; b.y += ny * over * tb;
      // bowling: a fast knocked body transfers momentum
      const ka = Math.hypot(a.kx, a.ky), kb = Math.hypot(b.kx, b.ky);
      if (ka > 200 && a.kx * nx + a.ky * ny > 0) { b.kx += nx * ka * 0.6 * a.mass / b.mass; b.ky += ny * ka * 0.6 * a.mass / b.mass; a.kx *= 0.5; a.ky *= 0.5;
        if (a.team !== b.team || a.team === 'enemy') hurt(w, b, 3 + ka * 0.02, null, { noDodge: true }); }
      else if (kb > 200 && -(b.kx * nx + b.ky * ny) > 0) { a.kx -= nx * kb * 0.6 * b.mass / a.mass; a.ky -= ny * kb * 0.6 * b.mass / a.mass; b.kx *= 0.5; b.ky *= 0.5;
        if (a.team !== b.team || b.team === 'enemy') hurt(w, a, 3 + kb * 0.02, null, { noDodge: true }); }
    }
  }
}

// ---------------------------------------------------------------- projectiles, hazards, pickups
function projectiles(w, dt) {
  for (const p of w.projectiles) {
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0 || p.y < 0 || p.x > w.W || p.y > w.H) p.life = 0;
    for (const pl of w.pillars) if (dist(p.x, p.y, pl.x, pl.y) < pl.r) p.life = 0;
    for (const r of w.walls) if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) p.life = 0;
    if (p.life <= 0 && p.land && !p.landed) { p.landed = true; p.land(p); }
    if (p.kind === 'fireArrow') for (const h of w.hazards) if ((h.type === 'oil' || h.type === 'gas') && dist(p.x, p.y, h.x, h.y) < h.r) { igniteAround(w, p.x, p.y, 4); p.life = Math.min(p.life, 0.02); }
    if (p.life <= 0) continue;
    for (const u of w.units) {
      if (!alive(u) || u === p.skip || u === p.owner || u.ethereal) continue;
      if (p.team !== 'neutral' && u.team === p.team) continue;
      if (p.hitSet && p.hitSet.has(u)) continue;
      if (dist(p.x, p.y, u.x, u.y) < u.r + p.r) {
        const friendly = p.team === 'neutral' && p.owner && u.team === p.owner.team;
        const o = { ...p.o, kAngle: Math.atan2(p.vy, p.vx), shot: true };
        if (friendly) { for (const k of ['chill', 'burn', 'poison']) if (o[k]) o[k] *= 0.4; }
        const mul = p.owner && p.owner.nextShotMul && !p.hitSet ? p.owner.nextShotMul : 1;
        if (mul > 1) p.owner.nextShotMul = 0;
        hurt(w, u, p.dmg * (friendly ? 0.4 : 1) * mul, p.owner, o);
        if (p.onHit) p.onHit(w, p, u); // a projectile with an effect of its own (water that soaks, a fireball that bursts)
        if (p.hitSet && p.pierce > 0) { p.hitSet.add(u); p.pierce--; continue; }
        p.life = 0;
        if (p.land && !p.landed) { p.landed = true; p.land(p); }
        if (p.kind === 'fireArrow') puff(w, p.x, p.y, '#FF8A3D', 4, 60, 4, 0.3);
        else puff(w, p.x, p.y, p.kind === 'icicle' ? '#DFF6FF' : '#F2E6CC', 3, 50, 3, 0.25);
        break;
      }
    }
  }
  for (const p of w.projectiles) if (p.life <= 0 && p.land && !p.landed) { p.landed = true; p.land(p); }
  w.projectiles = w.projectiles.filter((p) => p.life > 0);
}

function hazards(w, dt) {
  for (const h of w.hazards) if (h.t != null) h.t -= dt;
  w.hazards = w.hazards.filter((h) => h.t == null || h.t > 0);
  for (const u of w.units) {
    if (!alive(u) || u.ethereal) continue;
    u.inOil = false; u.soakedT = 0;
    u.hazardT -= dt;
    for (const h of w.hazards) {
      if (dist(u.x, u.y, h.x, h.y) > h.r + u.r * 0.4) continue;
      if (h.type === 'oil') u.inOil = true;
      else if (h.type === 'fire') addStatus(w, u, 'burn', 34 * dt);
      else if (h.type === 'gas') addStatus(w, u, 'poison', 24 * dt);
      else if (h.type === 'water' && !u.soakedT) { u.soakedT = 1; addStatus(w, u, 'wet', Math.min(20 * dt, Math.max(0, 90 - u.st.wet))); } // standing water soaks to 90, never tips into a slip (a slip's puddle would feed itself)
      else if (h.type === 'spikes' && u.hazardT <= 0) { u.hazardT = 0.6; hurt(w, u, 5 + Math.hypot(u.kx, u.ky) * 0.03, null, { noDodge: true }); }
    }
  }
}

// Coins lie where they fall and must be walked over; they fade after a few seconds. Keys wait to be picked up.
export const COIN_LIFE = 25;
function pickups(w, dt) {
  const heroes = w.units.filter((u) => u.team === 'hero' && alive(u));
  for (const h of heroes) h.coinGoal = null;
  for (const p of w.pickups) {
    if (p.type !== 'coin' && p.type !== 'key') continue;
    if (p.type === 'coin') {
      if (p.life == null) p.life = COIN_LIFE;
      p.life -= dt;
      if (p.life <= 0) { p.got = true; continue; }
    }
    let near = null, nd = Infinity;
    for (const h of heroes) { const d = dist(p.x, p.y, h.x, h.y); if (d < nd) { nd = d; near = h; } }
    // only a short pull right at the feet
    if (near && nd < near.r + 26) { const a = angleTo(p.x, p.y, near.x, near.y); p.vx += Math.cos(a) * 300 * dt * 6; p.vy += Math.sin(a) * 300 * dt * 6; }
    p.vx *= Math.exp(-4 * dt); p.vy *= Math.exp(-4 * dt);
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = clamp(p.x, 6, w.W - 6); p.y = clamp(p.y, 6, w.H - 6);
    for (const wl of w.walls) { const c = circleRect(p.x, p.y, 6, wl); if (c) { p.x += c.nx * c.over; p.y += c.ny * c.over; } }
    if (near && nd < near.r + 6) { p.got = true; emit(w, p.type, p, near); continue; }
    // a hero who isn't busy fighting goes for coins close by
    if (near && nd < 170 && (!near.coinGoal || nd < near.coinGoal.d)) near.coinGoal = { x: p.x, y: p.y, d: nd };
  }
  w.pickups = w.pickups.filter((p) => !p.got);
}

// ---------------------------------------------------------------- main step
export function step(w, dt) {
  w.time += dt;
  w.shake = Math.max(0, w.shake - dt * 30);
  for (const u of w.units) {
    if (!alive(u)) continue;
    u.flashT = Math.max(0, u.flashT - dt); u.invulnT = Math.max(0, u.invulnT - dt);
    u.atkT -= dt * atkRate(u); u.abilT -= dt;
    if (u.kit) for (const k in u.kit.cd) u.kit.cd[k] -= dt * (1 - Math.min(0.5, u.st.wet / 200)); // wet slows abilities
    u.modeT += dt; u.bob += dt * (3 + u.spd * 0.09);
    u.lungeT = Math.max(0, u.lungeT - dt); u.recoilT = Math.max(0, u.recoilT - dt); u.hitT = Math.max(0, u.hitT - dt);
    if (u.tauntT > 0) { u.tauntT -= dt; if (u.tauntT <= 0 || !u.tauntBy || !alive(u.tauntBy)) { u.tauntBy = null; u.tauntT = 0; } }
    statusTick(w, u, dt);
    if (!alive(u)) continue;
    if (u.anim) { u.anim.t += dt; if (u.anim.t >= u.anim.dur) u.anim = null; }
    if (u.frozenT > 0 || u.stunT > 0 || u.sleepT > 0) { if (!u.act || u.act.type !== 'slip') { u.dvx = u.dvy = 0; u.spd = 0; continue; } }
    // a unit with its own brain (bosses, special enemies) runs it first; returning true skips the usual brain
    if (u.def.brain && u.def.brain(w, u, dt)) continue;
    if (u.target && !alive(u.target)) u.target = null;
    u.thinkT -= dt;
    if (u.thinkT <= 0) { u.thinkT = 0.4 + rand() * 0.08; think(w, u); }
    if (u.act) { const charging = u.act.type === 'charge' || u.act.type === 'dash'; if (u.act.type !== 'dash') u.spd *= Math.exp(-dt * 10); if (u.act.type === 'charge') { u.mvA = u.act.a; u.spd = u.def.speed * 1.5; } runAction(w, u, dt); if (!charging) updateFacing(u, dt); continue; }
    movement(w, u, dt);
    if (u.rootT > 0) { u.dvx = u.dvy = 0; u.spd = 0; }
    updateFacing(u, dt);
    if (u.kit) { u.abilThinkT -= dt; if (u.abilThinkT <= 0) { u.abilThinkT = 0.35; if (kitThink(w, u)) continue; } }
    else if (u.def.ability && u.abilT <= 0 && !u.forcedGoal) {
      u.abilThinkT -= dt;
      if (u.abilThinkT <= 0) {
        u.abilThinkT = 0.5;
        const s = abilityScore(w, u);
        if (s > 0) {
          const lastOne = opponents(w, u).length === 1;
          let ch = clamp(0.02 + s * 0.55, 0, 0.92);
          if (lastOne) ch = Math.max(ch * 3, 0.4);
          if (chance(ch)) useAbility(w, u);
        }
      }
    }
    if (u.def.dashCd && !u.act && !u.forcedGoal) {
      u.dashT = (u.dashT ?? 1) - dt;
      const t = u.target;
      if (u.dashT <= 0 && t) {
        let near = Infinity, no = null; for (const o of opponents(w, u)) { const od = dist(u.x, u.y, o.x, o.y) - o.r; if (od < near) { near = od; no = o; } }
        const gap = dist(u.x, u.y, t.x, t.y) - u.r - t.r;
        let a = null;
        if (u.mode === 'retreat' && no && near < u.r + 60) a = angleTo(no.x, no.y, u.x, u.y);            // get out of reach
        else if (u.mode !== 'retreat' && gap > 130 && gap < 320 && u.atkT <= 0.2 && lineClear(w, u.x, u.y, t.x, t.y, u.r)) a = angleTo(u.x, u.y, t.x, t.y); // close in
        if (a !== null) { u.act = { type: 'dash', t: 0.2, max: 0.2, a }; u.dashT = u.def.dashCd; continue; }
      }
    }
    if (!u.act && u.potions > 0 && hpRatio(u) < 0.35) {
      let near = Infinity; for (const o of opponents(w, u)) near = Math.min(near, dist(u.x, u.y, o.x, o.y) - o.r);
      if (near > 150 && chance(dt * 3)) { u.act = { type: 'drink', t: 1, max: 1 }; }
    }
    if (!u.act) tryAttack(w, u);
  }
  physics(w, dt);
  dangerTick(w, dt);
  projectiles(w, dt);
  hazards(w, dt);
  pickups(w, dt);
  for (const p of w.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; const dr = p.drag || 0.92; p.vx *= dr; p.vy *= dr; if (p.rise) p.up += p.rise * dt; }
  for (const c of w.corpses) { c.t -= dt; c.x += c.kx * dt; c.y += c.ky * dt; }
  w.corpses = w.corpses.filter((c) => c.t > 0);
  w.particles = w.particles.filter((p) => p.life > 0);
  if (w.particles.length > 400) w.particles.splice(0, w.particles.length - 400);
  for (const t of w.texts) { t.life -= dt; t.up = (t.up || 0) - t.vy * dt; t.vy *= 0.94; }
  w.texts = w.texts.filter((t) => t.life > 0);
  for (const f of w.fx) {
    f.t += dt;
    if (f.tick) { f.acc = (f.acc || 0) + dt; while (f.acc >= (f.every || 0.5)) { f.acc -= f.every || 0.5; f.tick(f); } }
    if (f.follow && f.src) { const e = w.units.filter((o) => alive(o) && o.team !== f.src.team).sort((a, b) => dist(a.x, a.y, f.x, f.y) - dist(b.x, b.y, f.x, f.y))[0];
      if (e) { const a = angleTo(f.x, f.y, e.x, e.y); f.x += Math.cos(a) * 40 * dt; f.y += Math.sin(a) * 40 * dt; } }
    if (f.ward && f.src) for (const e of w.units) if (alive(e) && e.team !== f.src.team && dist(e.x, e.y, f.x, f.y) < f.r + e.r) { const a = angleTo(f.x, f.y, e.x, e.y); e.kx += Math.cos(a) * 200 * dt * 6; e.ky += Math.sin(a) * 200 * dt * 6; }
  }
  w.fx = w.fx.filter((f) => f.t < f.max);
  let wallsGone = false;
  for (const r of w.walls) if (r.temp != null) { r.temp -= dt; if (r.temp <= 0) wallsGone = true; }
  if (wallsGone) { w.walls = w.walls.filter((r) => r.temp == null || r.temp > 0); buildGrid(w); }
  for (const t of w.telegraphs) t.t -= dt;
  w.telegraphs = w.telegraphs.filter((t) => t.t > 0);
  w.units = w.units.filter((u) => !u.dead);
}

export { alive, opponents, allies, hpRatio, wake, puff, textU, goalVec, steer, drive, blocked, updateFacing, meleeSwing, sparks, flames, kill, dangerEscape };
