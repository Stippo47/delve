// Extra enemy kinds (merged into DEFS by units.js). Same fields as the enemies in units.js, plus `art` (the
// sprite file, built in parts), `headR` (the head's radius inside the 220 box, for sizing the art), `cost` (what one
// is worth when a room's enemy budget is spent; see dungeon.js), `pack` ([min, max]: small things come in groups)
// and optionally `brain(w, u, dt)` for behaviour of their own (return true to skip the usual brain that tick).
// Dungeon themes pick from these (see js/themes.js). Brains stay simple: one habit each (designer, round 1 + 4).
import { alive, opponents, hurt, puff, goalVec, steer, drive, blocked, setAnim, addDanger, explode, sparks, spawn, addStatus, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange, chance } from './util.js';
import { BOSSES } from './boss.js';
import { FOES } from './foes.js';
import { WILDWOOD } from './wildwood.js';
import { ELDER } from './elderent.js';
import { FOES9, boulderBrain, dropBoulder } from './foes9.js';

const BONE = { poison: 0.35, burn: 0.8, chill: 1.2 }; // skeletons: poison barely takes, cold bites
const SKELETON = { team: 'enemy', turn: 3.4, accel: 180, face: 3.4, mass: 1.3, temp: 0.3, commit: 1, res: BONE, headR: 60 };

// ---------------------------------------------------------------- small helpers for brains
export function turnTo(u, a, rate, dt) { u.facing = wrapAngle(u.facing + clamp(wrapAngle(a - u.facing), -rate * dt, rate * dt)); }
export function walkTo(w, u, x, y, mult, dt) {
  const [gx, gy] = goalVec(w, u, x, y);
  const [sx, sy] = steer(w, u, gx, gy);
  drive(u, sx, sy, u.def.speed * mult, dt);
}
export function stand(u, dt) { u.spd *= Math.exp(-dt * 10); u.dvx = Math.cos(u.mvA) * u.spd; u.dvy = Math.sin(u.mvA) * u.spd; }
// Wet (sim.js: soaked units fly further, freeze easier, lose poison, slip at 100).
export function soak(w, u, n) { if (alive(u)) addStatus(w, u, 'wet', n); }
function waterShot(w, u, a, o = {}) {
  const sp = o.speed || 150;
  w.projectiles.push({ kind: 'water', x: u.x + Math.cos(a) * (u.r + 8), y: u.y + Math.sin(a) * (u.r + 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    r: 9, team: u.team, owner: u, dmg: (o.dmg || 5) * u.dmgMul, o: { knock: 60 }, life: o.life || 2.4, a,
    onHit: (w2, p, t) => { soak(w2, t, o.wet || 45); puff(w2, p.x, p.y, '#8FD3F0', 8, 70, 5, 0.4); } });
}

// ---------------------------------------------------------------- brains
// Gaper: a piercing charge with its swords in a V ahead, ending in a rapid spin with the swords out to the sides.
function gaperBrain(w, u, dt) {
  const g = u.g || (u.g = { cd: rrange(2.5, 4.5) });
  g.cd -= dt;
  const t = u.target;
  if (!g.phase) {
    if (g.cd > 0 || !t || !alive(t) || !u.aggro) return false;
    const d = dist(u.x, u.y, t.x, t.y);
    if (d < 110 || d > 330 || blocked(w, u.x, u.y, t.x, t.y)) return false;
    const a = angleTo(u.x, u.y, t.x, t.y), len = Math.min(d + 80, 360), sp = u.def.speed * 2.8; // def.speed is the round-6 (fast) walk
    Object.assign(g, { phase: 'tell', t: 0.55, a, len, sp, hit: new Set() });
    addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, hw: u.r + 8, t: 0.55 + len / sp, team: u.team, src: u, kind: 'blade' });
    setAnim(u, 'ability', 0.55 + len / sp);
    return true;
  }
  if (g.phase === 'tell') {
    stand(u, dt); turnTo(u, g.a, 8, dt);
    if ((g.t -= dt) <= 0) { g.phase = 'charge'; g.t = g.len / g.sp; u.facing = g.a; }
    return true;
  }
  if (g.phase === 'charge') {
    u.dvx = Math.cos(g.a) * g.sp; u.dvy = Math.sin(g.a) * g.sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = g.a; u.spd = g.sp; u.facing = g.a;
    if (rand() < 0.5) w.particles.push({ x: u.x - Math.cos(g.a) * u.r, y: u.y - Math.sin(g.a) * u.r, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 6, color: 'rgba(225,215,190,0.7)' });
    for (const o of opponents(w, u)) {
      if (g.hit.has(o) || dist(u.x, u.y, o.x, o.y) > u.r + o.r + 6) continue;
      g.hit.add(o);
      const side = Math.sign(Math.sin(angleTo(u.x, u.y, o.x, o.y) - g.a)) || 1;
      hurt(w, o, u.def.dmg * 1.4 * u.dmgMul, u, { knock: 280, kAngle: g.a + side * 1.1, heavy: true }); // run through: thrown aside
    }
    if ((g.t -= dt) <= 0 || (u.x < u.r + 4 || u.y < u.r + 4 || u.x > w.W - u.r - 4 || u.y > w.H - u.r - 4)) { g.phase = 'spin'; g.t = 0.8; g.tick = 0; setAnim(u, 'ability', 0.8); }
    return true;
  }
  if (g.phase === 'spin') {
    stand(u, dt); u.facing = wrapAngle(u.facing + 17 * dt);
    if ((g.tick -= dt) <= 0) {
      g.tick = 0.2;
      for (const o of opponents(w, u)) if (dist(u.x, u.y, o.x, o.y) < u.r + o.r + 34) hurt(w, o, u.def.dmg * 0.45 * u.dmgMul, u, { knock: 150 });
      sparks(w, u.x + Math.cos(u.facing) * (u.r + 20), u.y + Math.sin(u.facing) * (u.r + 20), u.facing + Math.PI / 2, 2, '#FFFFFF');
    }
    if ((g.t -= dt) <= 0) { g.phase = null; g.cd = rrange(6, 8.5); u.atkT = Math.max(u.atkT, 0.7); }
    return true;
  }
  return false;
}

// Brute: raises its shield as an action. While it's up the brute walks slowly, turns slowly, and blocks almost
// everything from the front half (180 degrees); from behind it's open. It lowers it to swing.
export function bruteBrain(w, u, dt) {
  const b = u.b || (u.b = { cd: rrange(1, 3), up: 0 });
  b.cd -= dt;
  const t = u.target;
  if (b.up > 0) {
    b.up -= dt;
    if (t && alive(t)) {
      const gap = dist(u.x, u.y, t.x, t.y) - u.r - t.r;
      walkTo(w, u, t.x, t.y, gap < 30 ? 0 : 0.45, dt);
      turnTo(u, angleTo(u.x, u.y, t.x, t.y), 0.9, dt);
      if (gap < (u.def.range || 20) + 4 && b.up < 1.6) b.up = 0; // close enough: down with it and swing
    } else stand(u, dt);
    if (b.up <= 0) { u.shield = null; u.shieldArc = null; b.cd = rrange(4.5, 6.5); u.atkT = Math.min(u.atkT, 0.15); }
    return true;
  }
  if (b.cd <= 0 && t && alive(t) && u.aggro && !u.act) {
    const d = dist(u.x, u.y, t.x, t.y);
    const shot = w.projectiles.some((p) => p.team !== u.team && dist(p.x, p.y, u.x, u.y) < 220);
    if (d < 340 && d > 90 && (shot || chance(dt * 1.2))) {
      b.up = rrange(2.4, 3.4); u.shield = 0.88; u.shieldArc = Math.PI / 2; setAnim(u, 'ability', 0.35);
      return true;
    }
  }
  return false;
}

// Lizardman: a tail spin that knocks back whoever is close and throws up three slow balls of water (soaking).
export function tailSpin(w, u, dt, o = {}) {
  const s = u.ts || (u.ts = { cd: rrange(2, 4) });
  s.cd -= dt;
  if (s.t > 0) {
    stand(u, dt); u.facing = wrapAngle(u.facing + (s.t < (o.tell || 0.45) ? 15 : 3) * dt);
    if ((s.t -= dt) <= 0) {
      const t = u.target, a0 = t ? angleTo(u.x, u.y, t.x, t.y) : u.facing, n = o.shots || 3;
      for (let i = 0; i < n; i++) waterShot(w, u, a0 + i / n * TAU + rrange(-0.15, 0.15), { speed: rrange(130, 165), dmg: o.dmg || 5 });
      s.cd = rrange(o.cdMin || 6, o.cdMax || 8.5); u.atkT = Math.max(u.atkT, 0.5);
    }
    return true;
  }
  if (s.cd > 0 || !u.aggro || u.act) return false;
  const near = opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < u.r + h.r + 70);
  if (!near) return false;
  const tell = o.tell || 0.45;
  s.t = tell + 0.3;
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: u.r + (o.reach || 46), t: tell, team: u.team, src: u, kind: 'water',
    hit: { dmg: (o.hitDmg || 7) * u.dmgMul, knock: o.knock || 190 } });
  setAnim(u, 'ability', tell + 0.3);
  return true;
}

// Ghost: drifts in and curses what it brushes against (round 8: ghosts curse, they no longer chill).
export function ghostBrain(w, u, dt) {
  u.gT = (u.gT ?? rrange(0.4, 1.2)) - dt;
  const t = u.target;
  if (t && alive(t) && u.gT <= 0 && dist(u.x, u.y, t.x, t.y) - u.r - t.r < 18) {
    u.gT = u.def.touchCd;
    hurt(w, t, u.def.touchDmg * u.dmgMul, u, { curse: 30, knock: 50 });
    setAnim(u, 'cast', 0.35);
    puff(w, t.x, t.y, '#B48CE0', 6, 50, 5, 0.5);
  }
  return false;
}

// Orc shaman: lobs a ball of green-gold fire that bursts and sets things alight.
export function shamanBrain(w, u, dt) {
  u.sT = (u.sT ?? rrange(1, 2.5)) - dt;
  const t = u.target;
  if (!t || !alive(t) || u.sT > 0) return false;
  const d = dist(u.x, u.y, t.x, t.y);
  if (d > u.def.range || blocked(w, u.x, u.y, t.x, t.y)) return false;
  u.sT = rrange(2.6, 3.4);
  const a = angleTo(u.x, u.y, t.x, t.y), sp = 240;
  setAnim(u, 'cast', 0.4);
  w.projectiles.push({ kind: 'fireball', x: u.x + Math.cos(a) * (u.r + 8), y: u.y + Math.sin(a) * (u.r + 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    r: 9, team: u.team, owner: u, dmg: 5 * u.dmgMul, o: { knock: 40 }, life: 1.6, a,
    onHit: (w2, p) => explode(w2, p.x, p.y, 48, 5 * u.dmgMul, { burn: 30 }, u, '#FF8A3D') });
  return false;
}

// Troll: grows back what it loses once it's left alone for a moment, unless it has been burned lately.
function trollBrain(w, u, dt) {
  if (u.st.burn > 4) u.burnedT = 4;
  if (u.hp < (u.lastHp ?? u.hp)) u.calmT = 2.5;
  u.lastHp = u.hp;
  u.burnedT = (u.burnedT || 0) - dt; u.calmT = (u.calmT || 0) - dt;
  if (u.burnedT <= 0 && u.calmT <= 0 && u.hp < u.maxHp && !w.stale) {
    u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.025 * dt);
    if (rand() < dt * 5) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.6, y: u.y + rrange(-u.r, u.r) * 0.6, vx: 0, vy: 0, rise: 30, life: 0.6, max: 0.6, size: 4, color: '#8FD16A' });
  }
  return false;
}

// A warden's slam: a telegraphed ring round itself when the party crowds it.
export function slam(w, u, dt, o) {
  u.slT = (u.slT ?? rrange(3, 5)) - dt;
  if (u.slamming > 0) { u.slamming -= dt; stand(u, dt); return true; }
  if (u.slT > 0 || !u.aggro) return false;
  const n = opponents(w, u).filter((h) => dist(u.x, u.y, h.x, h.y) < o.r + h.r).length;
  if (n === 0 || (n === 1 && chance(0.6))) { u.slT = 0.6; return false; }
  u.slT = rrange(o.cdMin, o.cdMax); u.slamming = o.tell + 0.35;
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: o.r, t: o.tell, team: u.team, src: u, kind: 'bone',
    hit: { dmg: o.dmg * u.dmgMul, knock: 260, heavy: true }, onFire: (w2, z) => { w2.shake = Math.max(w2.shake, 8); puff(w2, z.x, z.y, '#D9CDB0', 22, 240, 7, 0.6); } });
  setAnim(u, 'ability', o.tell + 0.35);
  return true;
}

// Calls a few more from the room's edges, now and then.
export function callAdds(w, u, dt, kinds, every, n = 2) {
  u.callT = (u.callT ?? every * 0.5) - dt;
  if (u.callT > 0 || !u.aggro) return;
  u.callT = every;
  const mine = w.units.filter((o) => o.team === u.team && alive(o) && o !== u).length;
  if (mine >= 3) return;
  for (let i = 0; i < n; i++) {
    const k = kinds[Math.floor(rand() * kinds.length)];
    const y = chance(0.5) ? 50 : w.H - 50, x = clamp(u.x + rrange(-250, 250), 80, w.W - 80);
    const a = spawn(w, k, x, y, { mult: w.mult }); a.aggro = true; a.court = true;
    puff(w, x, y, '#BFA98A', 10, 80, 6, 0.5);
  }
}

// When a warden falls, the ones it called scatter (they're gone with it).
export function courtFalls(w) { for (const o of w.units) if (o.court && alive(o)) { puff(w, o.x, o.y, '#BFA98A', 8, 80, 5, 0.4); kill(w, o, null); } }

// ---------------------------------------------------------------- the kinds
export const ENEMIES = {
  // the crypt's dead (art: art/enemies, round 3/4 picks)
  rattler: { ...SKELETON, name: 'Rattler', art: 'art/enemies/rattler.svg', r: 33, vr: 24, hp: 50, speed: 52, role: 'melee',
    range: 22, atkCd: 1.4, windup: 0.4, dmg: 10, knock: 120, arc: 1.7, xp: 10, coins: [2, 5], cost: 3, attackAnim: 'swing' },
  rattlerBow: { ...SKELETON, name: 'Bone Archer', art: 'art/enemies/rattler-jawless-bow.svg', r: 31, vr: 23, hp: 36, speed: 50, role: 'ranged',
    range: 250, keep: 160, atkCd: 1.7, dmg: 7, xp: 10, coins: [2, 5], cost: 3, attackAnim: 'draw', temp: 0.35 },
  rattlerSpear: { ...SKELETON, name: 'Bone Spear', art: 'art/enemies/rattler-jawless-spear.svg', r: 32, vr: 23, hp: 46, speed: 50, role: 'melee',
    range: 46, atkCd: 1.6, windup: 0.35, dmg: 11, knock: 140, arc: 0.8, xp: 11, coins: [2, 5], cost: 3, attackAnim: 'thrust',
    ability: 'dash', abilCd: 4.5 }, // lunges in behind the spear
  rattlerMace: { ...SKELETON, name: 'Loose Jaw', art: 'art/enemies/rattler-loosejaw.svg', r: 34, vr: 24, hp: 60, speed: 46, role: 'melee',
    range: 22, atkCd: 1.8, windup: 0.55, dmg: 14, knock: 210, arc: 1.6, heavy: true, xp: 12, coins: [2, 6], cost: 4, attackAnim: 'swing' },
  gaper: { ...SKELETON, name: 'Gaper', art: 'art/enemies/gaper.svg', r: 38, vr: 31, mass: 1.6, hp: 90, speed: 54, role: 'melee',
    range: 26, atkCd: 1.3, windup: 0.3, dmg: 11, knock: 130, arc: 2.4, xp: 20, coins: [4, 8], cost: 6, attackAnim: 'swing', brain: gaperBrain },
  brute: { ...SKELETON, name: 'Brute', art: 'art/enemies/brute.svg', r: 40, vr: 28, mass: 2.6, turn: 2.6, face: 2.6, hp: 140, speed: 44, role: 'melee',
    range: 24, atkCd: 1.9, windup: 0.55, dmg: 17, knock: 230, arc: 1.8, heavy: true, xp: 26, coins: [5, 10], cost: 7, attackAnim: 'swing', brain: bruteBrain },
  ghost: { team: 'enemy', name: 'Ghost', art: 'art/enemies/ghost.svg', headR: 58, r: 28, vr: 22, turn: 4, accel: 160, face: 4, mass: 0.6, hp: 40, speed: 64,
    role: 'melee', range: 14, atkCd: 999, touchCd: 1.3, touchDmg: 6, dmg: 6, arc: 2, temp: 0.5, commit: 0.8, xp: 12, coins: [2, 5], cost: 3,
    res: { poison: 0, burn: 1.3, chill: 0.2, curse: 0 }, brain: ghostBrain },
  // the sewers (rats and slimes are in units.js)
  lizardman: { team: 'enemy', name: 'Lizardman', art: 'art/enemies/lizardman.svg', headR: 56, r: 32, vr: 23, turn: 4, accel: 220, face: 4, mass: 1.4,
    hp: 64, speed: 58, role: 'melee', range: 40, atkCd: 1.4, windup: 0.3, dmg: 10, knock: 120, arc: 0.9, temp: 0.35, commit: 0.9, xp: 14, coins: [3, 6],
    cost: 5, attackAnim: 'thrust', res: { burn: 0.8, chill: 1.4 }, brain: (w, u, dt) => tailSpin(w, u, dt) },
  lizardBlade: { team: 'enemy', name: 'Lizard Blade', art: 'art/enemies/lizardman-blade.svg', headR: 56, r: 31, vr: 23, turn: 6, accel: 360, face: 6, mass: 1.1,
    hp: 52, speed: 72, role: 'skirmish', range: 16, atkCd: 0.85, dmg: 8, arc: 1.6, temp: 0.5, commit: 0.5, xp: 12, coins: [2, 5], cost: 3,
    attackAnim: 'swing', ability: 'dash', abilCd: 3.4, res: { burn: 0.8, chill: 1.4 } },
  // the warren (art: round-5 greenskins, design/class-round5/enemies; headR = body half-width x vr / r, so the body fills the hit circle)
  goblin: { team: 'enemy', name: 'Goblin', art: 'art/enemies/goblin.svg', headR: 42, r: 22, vr: 16, turn: 8, accel: 480, face: 8, mass: 0.6, hp: 22, speed: 86,
    role: 'skirmish', range: 12, atkCd: 0.8, dmg: 5, arc: 1.5, temp: 0.7, commit: 0.4, xp: 5, coins: [1, 3], cost: 2, pack: [2, 3],
    attackAnim: 'thrust', ability: 'dash', abilCd: 3 },
  hobgoblin: { team: 'enemy', name: 'Hobgoblin', art: 'art/enemies/hobgoblin.svg', headR: 54, r: 31, vr: 22, turn: 3.6, accel: 200, face: 3.6, mass: 1.4,
    hp: 60, speed: 52, role: 'melee', range: 20, atkCd: 1.3, windup: 0.3, dmg: 8, knock: 110, arc: 1.5, shield: 0.4, temp: 0.3, commit: 1,
    xp: 11, coins: [2, 5], cost: 3, attackAnim: 'swing' },
  orc: { team: 'enemy', name: 'Orc', art: 'art/enemies/orc.svg', headR: 62, r: 36, vr: 27, turn: 3, accel: 170, face: 3, mass: 1.9, hp: 90, speed: 50,
    role: 'melee', range: 22, atkCd: 1.7, windup: 0.5, dmg: 14, knock: 190, arc: 1.8, heavy: true, temp: 0.3, commit: 1.1, xp: 18, coins: [3, 7], cost: 5, attackAnim: 'swing',
    ability: 'charge', abilCd: 9 }, // barrels into the party, bowling them aside
  orcShaman: { team: 'enemy', name: 'Orc Shaman', art: 'art/enemies/orc-shaman.svg', headR: 56, r: 33, vr: 25, turn: 3.4, accel: 180, face: 3.4, mass: 1.4,
    hp: 60, speed: 48, role: 'ranged', range: 250, keep: 190, atkCd: 999, dmg: 5, temp: 0.4, commit: 0.9, xp: 16, coins: [3, 7], cost: 5, brain: shamanBrain },
  troll: { team: 'enemy', name: 'Troll', art: 'art/enemies/troll.svg', headR: 66, r: 42, vr: 31, turn: 2.6, accel: 150, face: 2.6, mass: 3, hp: 170, speed: 46,
    role: 'melee', range: 30, atkCd: 1.7, windup: 0.45, dmg: 16, knock: 200, arc: 2.4, temp: 0.25, commit: 1.2, xp: 30, coins: [6, 12], cost: 8,
    attackAnim: 'swing', res: { burn: 1.4 }, // round 9: "The base troll should also attack with a boulder. But its boulder has a health pool and can break" (foes9.js)
    brain: (w, u, dt) => { const busy = boulderBrain(w, u, dt); trollBrain(w, u, dt); return busy; }, onDeath: (w, u) => dropBoulder(w, u) },

  // ---- wardens: the end of floors 1 and 2 (and, until each theme has a boss of its own, floor 3 too)
  graveWarden: { ...SKELETON, name: 'Grave Warden', art: 'art/enemies/brute.svg', r: 50, vr: 36, mass: 4.5, turn: 2.2, face: 2.2, hp: 420, speed: 42,
    role: 'melee', range: 26, atkCd: 1.8, windup: 0.6, dmg: 18, knock: 240, arc: 2, heavy: true, xp: 80, coins: [30, 45], boss: true, onDeath: courtFalls, attackAnim: 'swing',
    brain: (w, u, dt) => slam(w, u, dt, { r: 140, tell: 0.95, dmg: 20, cdMin: 6, cdMax: 8 }) || bruteBrain(w, u, dt) },
  lizardChief: { team: 'enemy', name: 'Lizard Chief', art: 'art/enemies/lizardman-blade.svg', headR: 56, r: 48, vr: 34, turn: 3, accel: 200, face: 3, mass: 4,
    hp: 380, speed: 54, role: 'melee', range: 30, atkCd: 1.4, windup: 0.4, dmg: 13, knock: 180, arc: 1.8, temp: 0.25, commit: 1.2, xp: 80, coins: [30, 45],
    boss: true, onDeath: courtFalls, attackAnim: 'swing', res: { burn: 0.8, chill: 1.2 },
    brain: (w, u, dt) => { callAdds(w, u, dt, ['rat', 'rat', 'lizardBlade'], 18); return tailSpin(w, u, dt, { shots: 6, reach: 70, tell: 0.75, hitDmg: 10, knock: 200, cdMin: 6, cdMax: 8, dmg: 6 }); } },
  warboss: { team: 'enemy', name: 'Orc Warboss', art: 'art/enemies/orc.svg', headR: 62, r: 50, vr: 37, turn: 2.4, accel: 150, face: 2.4, mass: 4.5,
    hp: 400, speed: 48, role: 'melee', range: 26, atkCd: 1.8, windup: 0.55, dmg: 16, knock: 240, arc: 2, heavy: true, temp: 0.25, commit: 1.2, xp: 80, coins: [30, 45],
    boss: true, onDeath: courtFalls, attackAnim: 'swing',
    brain: (w, u, dt) => { callAdds(w, u, dt, ['goblin', 'goblin', 'hobgoblin', 'dynamouse', 'dynamouse'], 20, 1); return slam(w, u, dt, { r: 145, tell: 0.95, dmg: 18, cdMin: 6.5, cdMax: 8.5 }); } },

  ...BOSSES,
  ...FOES, // round 7: the three deeper dungeons' kinds and their wardens and bosses (js/foes.js)
  ...WILDWOOD, ...ELDER, // round 9: the Wildwood, the new first dungeon (js/wildwood.js, js/elderent.js)
  ...FOES9, // round 9: the approved additions for the Warren, the Sewers and the Crypt (js/foes9.js)
};
