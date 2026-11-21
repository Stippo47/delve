// Elites (designer, round 7): "Make it so every enemy can be 'elite' gaining an additional special ability on top of
// their base kit that they can use to fight. Have elites show up more often, be about 2-3x stronger than base and be
// about 1.5x faster. For example an elite slime will lob smaller slimes at your location on an interval and also
// split into 4 normal slimes (which also split themselves). Make them slightly less big and drop slightly less gold."
// An elite keeps its kind's whole kit and adds one move of its own (ELITES[kind]: tick(w, u, dt) -> true to skip the
// usual brain that tick; death(w, u) when it dies). Shown, not told: a gold rim round the sprite (render.js).
// Also the small toolkit the moves are built from (lobs, cones, lines, rushes, summons), shared with foes.js.
import { alive, opponents, allies, hurt, puff, sparks, flames, addDanger, spawn, addStatus, setAnim, fx, zone, addBuff, heal, explode, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';

// 2-3x as strong (hp x2.4, blows x1.8), 1.5x as fast (walking; attacks x1.2), gold x0.8, XP x3 (dungeon.js).
// Round 8: "Even bigger ... Base elites should be the size in between the normal and miniboss sized": 1.25.
export const ELITE = { hp: 2.4, dmg: 1.8, speed: 1.5, atk: 1.2, scale: 1.25, gold: 0.8 };
// Round 8, the mini-boss tier: "an even stronger version for the mini boss at the end of levels that anyone can be,
// even bigger and stronger than elites and have an additional ability". Any kind: its elite move plus one of
// MINI_MOVES (two when the kind has no elite move), bigger again, much tougher, and angry at half health. It counts as
// a boss for the rules (shorter stuns and freezes, the boss bar): its def is a copy with boss: true, mini: true.
export const MINI = { hp: 5.5, dmg: 2.3, speed: 1.25, atk: 1.25, scale: 1.6, gold: 7, mass: 3 };

export function makeElite(w, u) {
  if (u.elite) return u;
  u.elite = true;
  u.maxHp = Math.round(u.maxHp * ELITE.hp); u.hp = u.maxHp;
  u.dmgMul *= ELITE.dmg; u.moveMul = (u.moveMul || 1) * ELITE.speed; u.atkMul = (u.atkMul || 1) * ELITE.atk;
  u.r *= ELITE.scale; u.vr *= ELITE.scale; u.mass *= 1.3;
  u.coinMul = (u.coinMul || 1) * ELITE.gold;
  const E = ELITES[u.kind] || ELITES[u.def.eliteAs];
  if (E) { u.eliteFn = E.tick || null; u.eliteDeath = E.death || null; }
  u.el = u.el || {};
  return u;
}

export function makeMiniBoss(w, u) {
  if (u.mini) return u;
  u.mini = true; u.elite = true; // the elite's gold rim, on a bigger body
  u.maxHp = Math.round(u.maxHp * MINI.hp); u.hp = u.maxHp;
  u.dmgMul *= MINI.dmg; u.moveMul = (u.moveMul || 1) * MINI.speed; u.atkMul = (u.atkMul || 1) * MINI.atk;
  u.r *= MINI.scale; u.vr *= MINI.scale; u.mass *= MINI.mass;
  u.coinMul = (u.coinMul || 1) * MINI.gold;
  u.def = { ...u.def, boss: true, mini: true };
  const E = ELITES[u.kind] || ELITES[u.def.eliteAs];
  const role = u.def.role === 'ranged' ? 'volley' : u.def.role === 'skirmish' ? 'charge' : 'quake';
  const moves = [E, MINI_MOVES[role]];
  if (!E || !E.tick) moves.push(MINI_MOVES.call);
  const ticks = moves.filter((m) => m && m.tick).map((m) => m.tick);
  u.eliteFn = (w2, v, dt) => { enrage(w2, v); for (const f of ticks) if (f(w2, v, dt)) return true; return false; };
  u.eliteDeath = E && E.death ? E.death : null;
  u.el = u.el || {};
  return u;
}
// Below half health a mini-boss gets angry: faster at everything for the rest of the fight (a red flush, no text).
function enrage(w, u) {
  const e = E(u); if (e.enraged || u.hp > u.maxHp * 0.5) return;
  e.enraged = true;
  addBuff(u, { id: 'enraged', dur: 1e6, move: 1.2, atkSpeed: 1.3 });
  puff(w, u.x, u.y, '#E0404B', 18, 160, 7, 0.6); w.shake = Math.max(w.shake, 4);
}
// The mini-boss's extra moves, by how it fights.
export const MINI_MOVES = {
  // a slam that shakes the floor all round it
  quake: {
    tick(w, u, dt) {
      if (hold(u, dt)) return true;
      if (!due(u, 'mquake', dt, 3) || !opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 170 + h.r)) return false;
      again(u, 'mquake', E(u).enraged ? 4.5 : 6.5, E(u).enraged ? 6 : 8.5);
      around(w, u, { r: 175, tell: 0.9, kind: 'bone', hit: { dmg: 13, knock: 320, heavy: true, stagger: 70 },
        fire: (w2, z) => { w2.shake = Math.max(w2.shake, 7); puff(w2, z.x, z.y, '#D9CDB0', 22, 260, 8, 0.55); } });
      return true;
    },
  },
  // a ring of shots out all round
  volley: {
    tick(w, u, dt) {
      if (hold(u, dt)) return true;
      if (!u.aggro || !due(u, 'mring', dt, 3)) return false;
      again(u, 'mring', E(u).enraged ? 4.5 : 6, E(u).enraged ? 6 : 8);
      const n = 14, a0 = rand() * TAU, kind = u.def.proj || 'bolt', color = u.def.projColor;
      beginHold(u, 0.55, null, () => { for (let i = 0; i < n; i++) shoot(w, u, a0 + i / n * TAU, { kind, color, speed: 300, dmg: (u.def.dmg || 6) * 0.8, r: 7, life: 1.6, hitO: { knock: 90 } }); });
      setAnim(u, 'cast', 0.55); puff(w, u.x, u.y, color || '#FFF1B0', 10, 80, 6, 0.5);
      return true;
    },
  },
  // a long charge with a short tell
  charge: {
    tick(w, u, dt) {
      if (rushTick(w, u, dt)) return true;
      const t = targetOf(w, u); if (!t || !due(u, 'mrush', dt, 2.5)) return false;
      const g = gapTo(u, t); if (g < 70 || g > 340 || !lineClear(w, u.x, u.y, t.x, t.y, u.r * 0.8)) return false;
      again(u, 'mrush', E(u).enraged ? 3.5 : 5, E(u).enraged ? 4.5 : 6.5);
      rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 140, { tell: 0.45, dmg: 15, knock: 330, status: { stagger: 45 } });
      return true;
    },
  },
  // calls help from the floor's own roster
  call: {
    tick(w, u, dt) {
      if (!u.aggro || !due(u, 'mcall', dt, 4)) return false;
      again(u, 'mcall', 11, 14);
      const list = (w.theme && w.theme.enemies) || [[u.kind, 1]];
      const cheap = list.filter(([k]) => k !== u.kind && DEFS_COST(k) <= 3);
      const pool = cheap.length ? cheap : list;
      let tot = 0; for (const [, x] of pool) tot += x;
      let r = rand() * tot, kind = pool[0][0]; for (const [k, x] of pool) { r -= x; if (r <= 0) { kind = k; break; } }
      summon(w, u, kind, 2, { color: '#3A2E44', cap: 20 });
      setAnim(u, 'cast', 0.5);
      return false;
    },
  },
};
// what a kind is worth from a room's budget (set by dungeon.js, which knows the defs)
let DEFS_COST = () => 3;
export function setCostOf(f) { DEFS_COST = f; }

// Elites may carry a trinket they use, and drop when they die (round 8: "elites may spawn with trinkets on them that
// they will use. Even lower chance to spawn with 2x the trinkets"). Only trinkets that make sense on an enemy.
export const ENEMY_TRINKETS = ['frostRing', 'emberRing', 'venomFang', 'tideShell', 'leadWeight', 'vampTooth', 'ironSkin', 'swiftBoots',
  'thunderRing', 'whirlingKnives', 'brambleVest', 'cinderBoots', 'frostBloom', 'volatile', 'galeFeather', 'soulJar'];
export const ELITE_TRINKET = { one: 0.25, two: 0.05, mini: 0.6 };

// ---------------------------------------------------------------- toolkit
export const turnTo = (u, a, rate, dt) => { u.facing = wrapAngle(u.facing + clamp(wrapAngle(a - u.facing), -rate * dt, rate * dt)); };
export const stand = (u, dt) => { u.spd *= Math.exp(-dt * 10); u.dvx = Math.cos(u.mvA) * u.spd; u.dvy = Math.sin(u.mvA) * u.spd; };
const E = (u) => u.el || (u.el = {});
// A timer that counts down; true once it's run out (reset it with again()).
export function due(u, key, dt, first = 2) { const e = E(u); if (e[key] == null) e[key] = first * rrange(0.6, 1.2); e[key] -= dt; return e[key] <= 0; }
export function again(u, key, a, b = a) { E(u)[key] = rrange(a, b); }
// Standing still through a tell: true while it lasts (the caller returns true so the usual brain waits).
export function hold(u, dt) {
  const e = E(u); if (!(e.holdT > 0)) return false;
  e.holdT -= dt; stand(u, dt); if (e.face != null) turnTo(u, e.face, 7, dt);
  if (e.holdT <= 0 && e.then) { const f = e.then; e.then = null; f(); }
  return true;
}
export function beginHold(u, t, face, then) { const e = E(u); e.holdT = t; e.face = face; e.then = then || null; }
const live = (t) => t && alive(t) && !t.ethereal;
export const targetOf = (w, u) => (live(u.target) ? u.target : null);
export const gapTo = (u, t) => dist(u.x, u.y, t.x, t.y) - u.r - t.r;
const hitOf = (u, h) => (h ? { ...h, dmg: (h.dmg || 0) * u.dmgMul } : undefined);
// How many of my side are standing (summons are capped by it).
export const crowd = (w, team) => w.units.reduce((n, o) => n + (o.team === team && alive(o) ? 1 : 0), 0);

// A thing thrown in an arc at (x, y): a circle fills on the ground where it will land (the heroes can step out),
// the thing flies there, and it lands with o.hit and o.land(w, z). It lands even if the thrower falls meanwhile.
export function lob(w, u, x, y, o = {}) {
  const tell = o.tell || 0.9, a = angleTo(u.x, u.y, x, y), d = dist(u.x, u.y, x, y);
  x = clamp(x, 30, w.W - 30); y = clamp(y, 30, w.H - 30);
  addDanger(w, { shape: 'circle', x, y, r: o.r || 60, t: tell, team: u.team, src: null, kind: o.kind || 'bone', spawns: !!o.spawns,
    hit: hitOf(u, o.hit), onFire: (w2, z) => { if (o.dust !== false) puff(w2, x, y, o.dust || '#CDBFA6', 10, 120, 6, 0.4); if (o.land) o.land(w2, z); } });
  if (o.proj) w.projectiles.push({ kind: o.proj, color: o.color, x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * d / tell, vy: Math.sin(a) * d / tell,
    r: o.pr || 8, team: u.team, owner: u, dmg: 0, o: {}, life: tell * 0.98, a, noHit: true, big: o.big });
  setAnim(u, 'throw', 0.35); u.facing = a;
}
// A cone in front (breath, a wail): the unit stands through the tell, facing it.
export function cone(w, u, a, o = {}) {
  const tell = o.tell || 0.7;
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a, arc: o.arc || 1.0, r: o.r || 200, t: tell, team: u.team, src: u, kind: o.kind || 'bone', hit: hitOf(u, o.hit), onFire: o.fire });
  beginHold(u, tell + (o.after || 0.2), a); setAnim(u, o.anim || 'cast', tell + 0.2);
}
// A straight line from the unit (a thrown spear, a riptide, a shockwave along the floor).
export function line(w, u, a, len, o = {}) {
  const tell = o.tell || 0.7, x2 = u.x + Math.cos(a) * len, y2 = u.y + Math.sin(a) * len;
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2, y2, hw: o.hw || 28, t: tell, team: u.team, src: u, kind: o.kind || 'blade', hit: hitOf(u, o.hit),
    onFire: (w2, z) => { if (o.proj) w2.projectiles.push({ kind: o.proj, color: o.color, x: z.x1, y: z.y1, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, r: 8, team: u.team, owner: u, dmg: 0, o: {}, life: len / 900, a, noHit: true });
      if (o.fire) o.fire(w2, z); } });
  beginHold(u, tell + (o.after || 0.15), a); setAnim(u, o.anim || 'throw', tell + 0.2);
}
// A circle or ring round the unit itself (a slam, a nova).
export function around(w, u, o = {}) {
  const tell = o.tell || 0.9;
  const z = o.r0 ? { shape: 'ring', x: u.x, y: u.y, r0: o.r0, r1: o.r } : { shape: 'circle', x: u.x, y: u.y, r: o.r || 120 };
  addDanger(w, { ...z, t: tell, team: u.team, src: u, kind: o.kind || 'bone', hit: hitOf(u, o.hit), onFire: o.fire });
  beginHold(u, tell + (o.after || 0.3), null); setAnim(u, 'ability', tell + 0.3);
}
// A rush in a straight line: hurts everyone it runs through once (o.hit), stops at walls. Runs from rushTick.
export function rush(w, u, a, len, o = {}) {
  const sp = o.speed || u.def.speed * 2.6;
  E(u).rush = { a, t: len / sp, sp, hit: new Set(), o, tell: o.tell || 0 };
  if (o.tell) addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, hw: u.r + 6, t: o.tell, team: u.team, src: u, kind: o.kind || 'blade' });
  setAnim(u, 'ability', (o.tell || 0) + len / sp);
}
export function rushTick(w, u, dt) {
  const r = E(u).rush; if (!r) return false;
  if (r.tell > 0) { r.tell -= dt; stand(u, dt); turnTo(u, r.a, 9, dt); return true; }
  u.dvx = Math.cos(r.a) * r.sp; u.dvy = Math.sin(r.a) * r.sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = r.a; u.spd = r.sp; u.facing = r.a;
  if (rand() < 0.5) w.particles.push({ x: u.x - Math.cos(r.a) * u.r, y: u.y - Math.sin(r.a) * u.r, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 6, color: r.o.trail || 'rgba(220,214,200,0.7)' });
  for (const o of opponents(w, u)) {
    if (r.hit.has(o) || dist(u.x, u.y, o.x, o.y) > u.r + o.r + 6) continue;
    r.hit.add(o);
    const side = Math.sign(Math.sin(angleTo(u.x, u.y, o.x, o.y) - r.a)) || 1;
    hurt(w, o, (r.o.dmg || 10) * u.dmgMul, u, { knock: r.o.knock || 240, kAngle: r.a + side * 1.0, heavy: true, ...(r.o.status || {}) });
  }
  const nx = u.x + Math.cos(r.a) * (u.r + 10), ny = u.y + Math.sin(r.a) * (u.r + 10);
  if ((r.t -= dt) <= 0 || nx < 0 || ny < 0 || nx > w.W || ny > w.H || !lineClear(w, u.x, u.y, nx, ny, 2)) { E(u).rush = null; u.spd *= 0.3; u.atkT = Math.max(u.atkT, 0.5); }
  return true;
}
// Called out of the floor next to the unit (a rift opens first, then they climb out). Capped so a room can't flood.
export function summon(w, u, kind, n, o = {}) {
  const cap = o.cap || 22;
  if (w.stale) return; // a stand-off that's gone on too long: nobody calls more help (dungeon.js w.stale)
  // round 8: no more than four of one caller's own at a time (rooms are fuller now; imps kept a room going for ever)
  const mine = () => w.units.reduce((k, o) => k + (o.calledBy === u && alive(o) ? 1 : 0), 0) + (u.el && u.el.coming || 0);
  for (let i = 0; i < n; i++) {
    if (crowd(w, u.team) >= cap || mine() >= (o.own || 4)) return;
    E(u).coming = (E(u).coming || 0) + 1;
    const a = rand() * TAU, d = u.r + rrange(30, 70), x = clamp(u.x + Math.cos(a) * d, 50, w.W - 50), y = clamp(u.y + Math.sin(a) * d, 50, w.H - 50);
    later(w, x, y, 0.6, () => { E(u).coming = Math.max(0, (E(u).coming || 0) - 1); const s = spawn(w, kind, x, y, { mult: w.mult, hpMul: o.hpMul, scale: o.scale }); s.aggro = true; s.minion = true; s.calledBy = u; s.summonBy = u; s.facing = a; puff(w, x, y, o.color || '#3A2E44', 8, 90, 6, 0.4); });
  }
}
// Something that happens in a moment at (x, y), shown by a small rift (counts as "still coming" for a room's end).
export function later(w, x, y, t, f, r = 26) { fx(w, { type: 'rift', x, y, r, at: t, max: t + 0.4, every: t, spawns: true, tick: (e) => { if (!e.done) { e.done = true; f(); } } }); }
// A shot: { kind, color, speed, dmg, r, life, hit options, onHit }.
export function shoot(w, u, a, o = {}) {
  const sp = o.speed || 300;
  w.projectiles.push({ kind: o.kind || 'arrow', color: o.color, x: u.x + Math.cos(a) * (u.r + 6), y: u.y + Math.sin(a) * (u.r + 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    r: o.r || 6, team: u.team, owner: u, dmg: (o.dmg || 5) * u.dmgMul, o: { knock: 40, ...(o.hitO || {}) }, life: o.life || 1.6, a, onHit: o.onHit });
}
// A blink: gone in a puff, back somewhere else.
export function blink(w, u, x, y, color = 'rgba(60,40,90,0.85)') {
  if (w.stale && u.team === 'enemy') return; // a stand-off that's gone on too long: no more slipping away
  puff(w, u.x, u.y, color, 12, 80, 7, 0.5);
  u.x = clamp(x, u.r, w.W - u.r); u.y = clamp(y, u.r, w.H - u.r); u.vx = u.vy = 0; u.kx = u.ky = 0; u.spd = 0;
  puff(w, u.x, u.y, color, 12, 80, 7, 0.5);
}
// A spot on open floor about d from (x, y), away from walls (null if none).
export function openSpot(w, x, y, d0, d1, r = 30) {
  for (let i = 0; i < 30; i++) {
    const a = rand() * TAU, d = rrange(d0, d1), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    if (px < r + 10 || py < r + 10 || px > w.W - r - 10 || py > w.H - r - 10) continue;
    if (w.walls.some((q) => px > q.x - r && px < q.x + q.w + r && py > q.y - r && py < q.y + q.h + r)) continue;
    if (w.pillars.some((p) => dist(px, py, p.x, p.y) < p.r + r)) continue;
    if (w.cells && !w.cells.some((c) => px > c.x && px < c.x + c.w && py > c.y && py < c.y + c.h)) continue;
    return { x: px, y: py };
  }
  return null;
}
const lead = (t, k) => ({ x: t.x + (t.vx || 0) * k, y: t.y + (t.vy || 0) * k });
const inSight = (w, u, t, max) => t && dist(u.x, u.y, t.x, t.y) < max && lineClear(w, u.x, u.y, t.x, t.y, 4);

// ---------------------------------------------------------------- one extra move per kind
// Each: tick(w, u, dt) -> true while it holds the unit (standing through a tell, rushing); death(w, u).
export const ELITES = {
  // Slime: lobs slimelets at you every few seconds; dies into four slimes (each of which splits as usual).
  slime: {
    tick(w, u, dt) {
      if (hold(u, dt)) return true;
      const t = targetOf(w, u); if (!t || !due(u, 'lob', dt, 2.5) || !inSight(w, u, t, 420)) return false;
      again(u, 'lob', 3.5, 5);
      const p = lead(t, 0.5);
      lob(w, u, p.x, p.y, { r: 46, tell: 0.9, proj: 'water', color: '#6CC9B0', spawns: true, kind: 'water', dust: '#6CC9B0', hit: { dmg: 5, knock: 140 },
        land: (w2, z) => { if (crowd(w2, 'enemy') < 24) { const s = spawn(w2, 'slimeSmall', z.x, z.y, { mult: w2.mult, gen: 1 }); s.aggro = true; } } });
      return false;
    },
    death(w, u) {
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU + 0.4, s = spawn(w, 'slime', u.x + Math.cos(a) * 18, u.y + Math.sin(a) * 18, { mult: w.mult, gen: 0 });
        s.kx = Math.cos(a) * 220; s.ky = Math.sin(a) * 220; s.aggro = true;
      }
    },
  },
  // Slimelet (only ever met when something makes one elite): it hops onto you.
  slimeSmall: { tick(w, u, dt) { return pounce(w, u, dt, { min: 90, max: 260, every: [3, 4.5], r: 50, dmg: 6 }); } },
  // Rat: plague-ridden; where it runs it leaves a trail of sickly gas.
  rat: {
    tick(w, u, dt) {
      if (!u.aggro || u.spd < 60 || !due(u, 'gas', dt, 0.4)) return false;
      again(u, 'gas', 0.8, 1.1);
      if (!w.hazards.some((h) => h.type === 'gas' && dist(h.x, h.y, u.x, u.y) < 30)) w.hazards.push({ type: 'gas', x: u.x - Math.cos(u.mvA) * u.r, y: u.y - Math.sin(u.mvA) * u.r, r: 26, t: 2.6, max: 2.6 });
      addBuff(u, { id: 'plague', dur: 1, immune: ['poison'] });
      return false;
    },
  },
  // Rattler: falls apart, then pulls itself back together once (a pile of bones that stands up again).
  rattler: {
    death(w, u) {
      const { x, y } = u;
      later(w, x, y, 2.4, () => { const s = spawn(w, 'rattler', x, y, { mult: w.mult, hpMul: 0.6 }); makeElite(w, s); s.eliteDeath = null; s.hp = s.maxHp * 0.5; s.aggro = true; puff(w, x, y, '#EDE4CD', 14, 120, 6, 0.5); }, 30);
    },
  },
  // Bone archer: a volley, five arrows fanned out.
  rattlerBow: {
    tick(w, u, dt) {
      if (hold(u, dt)) return true;
      const t = targetOf(w, u); if (!t || !due(u, 'volley', dt, 3) || !inSight(w, u, t, u.def.range)) return false;
      again(u, 'volley', 5, 7);
      const a = angleTo(u.x, u.y, t.x, t.y);
      beginHold(u, 0.45, a, () => { for (let i = -2; i <= 2; i++) shoot(w, u, a + i * 0.12, { kind: 'arrow', speed: 460, dmg: u.def.dmg * 0.8, life: 1.3 }); });
      setAnim(u, 'draw', 0.45);
      return true;
    },
  },
  // Bone spear: hurls a spear down a long line.
  rattlerSpear: {
    tick(w, u, dt) {
      if (hold(u, dt)) return true;
      const t = targetOf(w, u); if (!t || !due(u, 'jav', dt, 3)) return false;
      const d = dist(u.x, u.y, t.x, t.y); if (d < 140 || !inSight(w, u, t, 480)) return false;
      again(u, 'jav', 6, 8);
      line(w, u, angleTo(u.x, u.y, t.x, t.y), Math.min(520, d + 120), { tell: 0.7, hw: 24, proj: 'bone', hit: { dmg: 16, knock: 300, heavy: true } });
      return true;
    },
  },
  // Loose Jaw: brings the mace down so hard the floor jumps: a quake round it that staggers.
  rattlerMace: {
    tick(w, u, dt) {
      if (hold(u, dt)) return true;
      if (!due(u, 'quake', dt, 3) || !opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 130 + h.r)) return false;
      again(u, 'quake', 6, 8);
      around(w, u, { r: 135, tell: 0.85, kind: 'bone', hit: { dmg: 12, knock: 240, heavy: true, stagger: 60 }, fire: (w2, z) => { w2.shake = Math.max(w2.shake, 6); puff(w2, z.x, z.y, '#D9CDB0', 18, 220, 7, 0.5); } });
      return true;
    },
  },
  // Gaper: its spin throws bone splinters out all round.
  gaper: {
    tick(w, u, dt) {
      if (!(u.g && u.g.phase === 'spin') || !due(u, 'shard', dt, 0.15)) return false;
      again(u, 'shard', 0.14);
      shoot(w, u, u.facing + Math.PI / 2, { kind: 'bone', speed: 380, dmg: 4, life: 0.8 });
      return false;
    },
  },
  // Brute: with the shield up it bashes forward, bowling over whoever is in front.
  brute: {
    tick(w, u, dt) {
      if (rushTick(w, u, dt)) return true;
      const t = targetOf(w, u); if (!t || !(u.b && u.b.up > 0) || !due(u, 'bash', dt, 1)) return false;
      const g = gapTo(u, t); if (g < 20 || g > 220) return false;
      again(u, 'bash', 4, 6);
      rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 60, { tell: 0.35, dmg: 14, knock: 320, status: { stagger: 50 } });
      return true;
    },
  },
  // Ghost: fades out and comes back right behind its mark, with a gust of grave cold.
  ghost: {
    tick(w, u, dt) {
      const e = E(u);
      if (e.fadeT > 0) {
        e.fadeT -= dt; stand(u, dt);
        if (e.fadeT <= 0) {
          u.ethereal = false; const t = targetOf(w, u);
          if (t) { const b = t.facing + Math.PI; blink(w, u, t.x + Math.cos(b) * (t.r + u.r + 4), t.y + Math.sin(b) * (t.r + u.r + 4), 'rgba(200,235,255,0.8)'); u.facing = angleTo(u.x, u.y, t.x, t.y); }
          for (const o of opponents(w, u)) if (dist(u.x, u.y, o.x, o.y) < 80 + o.r) hurt(w, o, 8 * u.dmgMul, u, { chill: 45, knock: 120 });
          puff(w, u.x, u.y, '#DDF3FF', 16, 140, 6, 0.6);
        }
        return true;
      }
      const t = targetOf(w, u); if (!t || !due(u, 'fade', dt, 3) || dist(u.x, u.y, t.x, t.y) > 420) return false;
      again(u, 'fade', 6, 8);
      e.fadeT = 0.8; u.ethereal = true; puff(w, u.x, u.y, 'rgba(200,235,255,0.8)', 12, 60, 7, 0.6);
      return true;
    },
  },
  // Lizardman: a riptide: a surge of water down a line that soaks and washes you away.
  lizardman: {
    tick(w, u, dt) {
      if (hold(u, dt)) return true;
      const t = targetOf(w, u); if (!t || !due(u, 'tide', dt, 3) || !inSight(w, u, t, 380)) return false;
      again(u, 'tide', 6.5, 8);
      line(w, u, angleTo(u.x, u.y, t.x, t.y), 360, { tell: 0.75, hw: 34, kind: 'water', anim: 'thrust', hit: { dmg: 10, knock: 300, wet: 70 },
        fire: (w2, z) => { for (let k = 0; k < 1; k += 0.1) puff(w2, z.x1 + (z.x2 - z.x1) * k, z.y1 + (z.y2 - z.y1) * k, '#8FD3F0', 2, 90, 6, 0.5); } });
      return true;
    },
  },
  // Lizard blade: a cutting dash straight through the party, poisoning everyone it passes.
  lizardBlade: {
    tick(w, u, dt) {
      if (rushTick(w, u, dt)) return true;
      const t = targetOf(w, u); if (!t || !due(u, 'cut', dt, 2.5)) return false;
      const g = gapTo(u, t); if (g < 50 || g > 260 || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return false;
      again(u, 'cut', 4, 5.5);
      rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 130, { tell: 0.3, dmg: 9, knock: 160, status: { poison: 35 }, trail: 'rgba(140,200,120,0.6)' });
      return true;
    },
  },
  // Goblin: lobs a firebomb.
  goblin: {
    tick(w, u, dt) {
      const t = targetOf(w, u); if (!t || !due(u, 'bomb', dt, 2) || !inSight(w, u, t, 360)) return false;
      again(u, 'bomb', 5, 7);
      const p = lead(t, 0.6);
      lob(w, u, p.x, p.y, { r: 58, tell: 1.0, proj: 'vial', color: '#FF8A3D', kind: 'fire', dust: '#5A4A40', hit: { dmg: 9, knock: 160, burn: 35 }, land: (w2, z) => explode(w2, z.x, z.y, 4, 0, { burn: 1 }, null, '#FF8A3D') });
      return false;
    },
  },
  // Hobgoblin: a war cry: everyone of its side close by moves and strikes faster for a while.
  hobgoblin: {
    tick(w, u, dt) {
      if (hold(u, dt)) return true;
      if (!u.aggro || !due(u, 'rally', dt, 2)) return false;
      const near = allies(w, u).filter((a) => dist(a.x, a.y, u.x, u.y) < 240);
      if (!near.length) return false;
      again(u, 'rally', 8, 10);
      beginHold(u, 0.4, null, () => {
        fx(w, { type: 'ring', x: u.x, y: u.y, r: 240, color: '#E0604B', max: 0.5 });
        for (const a of [u, ...near]) { addBuff(a, { id: 'rally', dur: 4.5, move: 1.25, atkSpeed: 1.3 }); puff(w, a.x, a.y, '#E0604B', 5, 60, 4, 0.4); }
      });
      setAnim(u, 'cast', 0.4);
      return true;
    },
  },
  // Orc: throws its cleaver, which spins out and comes back.
  orc: {
    tick(w, u, dt) {
      const t = targetOf(w, u); if (!t || !due(u, 'axe', dt, 2.5)) return false;
      const d = dist(u.x, u.y, t.x, t.y); if (d < 130 || !inSight(w, u, t, 400)) return false;
      again(u, 'axe', 6, 8);
      const a = angleTo(u.x, u.y, t.x, t.y), sp = 420, life = Math.min(400, d + 60) / sp;
      setAnim(u, 'throw', 0.35);
      w.projectiles.push({ kind: 'dagger', x: u.x, y: u.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 10, team: u.team, owner: u, dmg: 12 * u.dmgMul, o: { knock: 200 }, life, a,
        hitSet: new Set(), pierce: 9, land: (p) => { if (!alive(u)) return; const b = angleTo(p.x, p.y, u.x, u.y), dd = dist(p.x, p.y, u.x, u.y);
          w.projectiles.push({ kind: 'dagger', x: p.x, y: p.y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, r: 10, team: u.team, owner: u, dmg: 8 * u.dmgMul, o: { knock: 120 }, life: dd / sp, a: b, hitSet: new Set(), pierce: 9 }); } });
      return false;
    },
  },
  // Orc shaman: mends the most hurt of its side with a gout of green fire.
  orcShaman: {
    tick(w, u, dt) {
      if (w.stale || !due(u, 'mend', dt, 3)) return false; // no mending in a stand-off (dungeon.js w.stale), like the troll
      const hurtOne = [u, ...allies(w, u)].filter((a) => dist(a.x, a.y, u.x, u.y) < 320 && a.hp < a.maxHp * 0.7).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (!hurtOne) return false;
      again(u, 'mend', 6, 8);
      setAnim(u, 'cast', 0.5);
      fx(w, { type: 'beam', x1: u.x, y1: u.y, x2: hurtOne.x, y2: hurtOne.y, kind: 'heal', max: 0.6, from: u, to: hurtOne });
      heal(w, hurtOne, hurtOne.maxHp * 0.3, u);
      for (let i = 0; i < 8; i++) w.particles.push({ x: hurtOne.x + rrange(-16, 16), y: hurtOne.y + rrange(-16, 16), vx: 0, vy: 0, rise: 50, up: 0, life: 0.7, max: 0.7, size: 4, color: '#9BE07A' });
      return false;
    },
  },
  // Troll: rips up the floor and hurls a boulder.
  troll: {
    tick(w, u, dt) {
      const t = targetOf(w, u); if (!t || !due(u, 'rock', dt, 3)) return false;
      const d = dist(u.x, u.y, t.x, t.y); if (d < 150 || d > 480 || !lineClear(w, u.x, u.y, t.x, t.y, 4)) return false;
      again(u, 'rock', 6, 8);
      const p = lead(t, 0.8);
      lob(w, u, p.x, p.y, { r: 70, tell: 1.1, proj: 'bone', color: '#8C8270', pr: 14, big: true, hit: { dmg: 15, knock: 280, heavy: true, stagger: 50 }, land: (w2) => { w2.shake = Math.max(w2.shake, 5); } });
      return false;
    },
  },
};

// A hop onto the target from a little way off: a circle shows where it lands (used by slimelets and spiders).
export function pounce(w, u, dt, o) {
  if (u.act) return false;
  const t = targetOf(w, u); if (!t || !due(u, 'pounce', dt, o.every[0])) return false;
  const d = dist(u.x, u.y, t.x, t.y); if (d < o.min || d > o.max || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return false;
  again(u, 'pounce', ...o.every);
  const p = lead(t, 0.3), a = angleTo(u.x, u.y, p.x, p.y), L = Math.max(0, dist(u.x, u.y, p.x, p.y) - u.r - t.r * 0.5);
  const x1 = u.x + Math.cos(a) * L, y1 = u.y + Math.sin(a) * L, dur = 0.5;
  addDanger(w, { shape: 'circle', x: x1, y: y1, r: o.r, t: dur, team: u.team, src: u, kind: o.kind || 'bone', hit: hitOf(u, { dmg: o.dmg, knock: 180, ...(o.status || {}) }) });
  u.act = { type: 'leap', t: dur, max: dur, x0: u.x, y0: u.y, x1, y1, land: () => puff(w, u.x, u.y, o.dust || '#CDBFA6', 8, 90, 5, 0.4) };
  u.facing = a; setAnim(u, 'ability', dur);
  return false;
}
