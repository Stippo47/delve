// Round 10, lane R: the Clockwork Foundry, a factory that never stopped, after the Sunken Dunes (deck roster2; the
// designer's words in docs/riffle-log/2026-11-21-round9.txt). Each kind has a base kit and an elite move (ELITES).
//   The gear sprite ("Doesnt target just moves. Pierces ... bounces off walls in a diagonal") and the cog sprite
//   ("slightly homes in on target in direction of movement"); the bomb bot ("Lights its fuse when it noticed you and runs
//   in a straight line. And explodes after a set time") and the auto bomb bot ("can turn itself off if it over shoots at
//   the end of the burn timer, turning slowly to face target again starting over"; "Both explode when burned"); the
//   automaton (hits hard, then overheats and stands open); the steam turret ("Turns slowly to fire: get behind it") and
//   its variants ("Flame thrower, machine gun, laser ... Mortar ... Has a fire and poison variant"); the tesla coil
//   (a shock that chains between heroes, worse on the wet); the repair drone (mends constructs: kill it first); the
//   foundry smith (a red-hot hammer: every hit burns); the bees ("Bee (metallic) spawns in swarms does a long ranged
//   straight dash. Moves around in zigzags. Wasp circles around target shooting weak short ranged stingers. Hornet,
//   like wasp but shoots 5 on repeat and can do the bee dash. Alternates. All 3 come in 3 variations copper, bronze,
//   and steel, each more hp and damage then the last"); the saw blade ("Runs along the walls quickly, half submerged
//   hurting enemies hit"). From the deck notes too: the chain crawler (a chain), the drill bot (a burrower), the shock
//   spirit; the gun and laser turrets are wall-mounted.
// The Foreman and the Twin Pistons (approved mini-bosses) are not built yet: floors end on majors for now. The Great
// Engine was a RETHINK ("the terraria skeleton boss ... Separate hands and head"): lane B's, theme.bossKind is its hook.
// Everything here wore PLACEHOLDER art (recoloured kinds; docs/ART-NEEDED.md) until art round 9 drew it (design/class-round9):
// the auto bomb bot, the bronze and steel bees, wasps and hornets, and the fire and gas mortars are recolours of it.
import { alive, opponents, allies, hurt, puff, sparks, flames, addStatus, setAnim, fx, addBuff, explode, spawn, heal, kill, addDanger } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { ELITES, lob, cone, line, around, rush, rushTick, shoot, hold, beginHold, due, again, targetOf, gapTo, crowd, stand, turnTo, later, openSpot } from './elites.js';
import { variantUrl } from './recolor.js';
import { sees, lead, every, burrowTick, chainHead, segBrain, killChain, turretBrain, bounceMove, touch, solidAt, blast, dropOn, overheat } from './families.js';
import { spirit } from './foes10.js';

const ART = (f) => `art/enemies/placeholder/${f}.svg`;
const FOE = { team: 'enemy', turn: 4, accel: 220, face: 4, mass: 1.2, temp: 0.35, commit: 0.9 };
const MACHINE = { poison: 0, curse: 0, wet: 1.3, shock: 1.4, entangle: 0.5 }; // constructs: no blood to poison, but water and lightning get in
const STEAM = '#ECF0F4';

// ---------------------------------------------------------------- habits
// Gear and cog sprites: a rolling cog that goes where it's going, through the party (it doesn't stop for bodies), and
// off the walls at a diagonal. The cog leans a little towards whoever is ahead of it. The elite throws sparks off
// every wall it hits.
function gearBrain(w, u, dt) {
  if (u.mvA == null || !u.rolling) { u.rolling = true; u.mvA = (Math.floor(rand() * 4) + 0.5) * Math.PI / 2; }
  if (!u.aggro) { u.aggro = opponents(w, u).some((h) => dist(h.x, h.y, u.x, u.y) < 520); if (!u.aggro) { stand(u, dt); return true; } }
  if (u.def.homes) { // the cog: a slight turn towards a target ahead of it
    const t = opponents(w, u).filter((h) => angleDiff(angleTo(u.x, u.y, h.x, h.y), u.mvA) < 1.2).sort((a, b) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, b.x, b.y))[0];
    if (t) u.mvA += clamp(wrapAngle(angleTo(u.x, u.y, t.x, t.y) - u.mvA), -0.7 * dt, 0.7 * dt);
  }
  const was = u.mvA;
  bounceMove(w, u, u.def.speed * (u.moveMul || 1) * (u.staleBoost ? 1.3 : 1), dt);
  if (u.elite && Math.abs(wrapAngle(u.mvA - was)) > 0.5) for (let i = 0; i < 4; i++) shoot(w, u, u.mvA + (i - 1.5) * 0.4, { kind: 'bolt', color: '#FFD27A', speed: 300, dmg: 3, r: 5, life: 0.6, hitO: { knock: 40, burn: 8 } });
  u.facing = wrapAngle(u.facing + 14 * dt);
  touch(w, u, u.def.dmg, { knock: 170 }, 0.6);
  if (rand() < dt * 8) sparks(w, u.x - Math.cos(u.mvA) * u.r, u.y - Math.sin(u.mvA) * u.r, u.mvA + Math.PI, 1, '#FFE7A0');
  return true;
}
// Bomb bots: once they see you, the fuse is lit and they run straight at where you were; when it's out they blow (their
// own side too: knock one away in time). Fire sets them off at once. The auto bomb bot, if it overshot (nobody close at
// the end), puts its fuse out, turns slowly back to face you, and starts over. The elite's blast leaves fire.
function bombBrain(w, u, dt) {
  if (u.st.burn > 8) { boom(w, u); return true; }
  const f = u.fuse;
  if (f) {
    f.t -= dt;
    if (rand() < dt * 30) sparks(w, u.x, u.y - u.vr * 0.6, -Math.PI / 2 + rrange(-0.6, 0.6), 1, '#FFD27A');
    if (f.t > 0.5) { const sp = u.def.speed * 1.7 * (u.moveMul || 1); const nx = u.x + Math.cos(f.a) * (u.r + 6), ny = u.y + Math.sin(f.a) * (u.r + 6);
      if (solidAt(w, nx, ny, 4)) { stand(u, dt); } else { u.dvx = Math.cos(f.a) * sp; u.dvy = Math.sin(f.a) * sp; u.mvA = f.a; u.spd = sp; } u.facing = f.a; }
    else { stand(u, dt); if (!f.shown) { f.shown = true; addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: blastR(u), t: 0.5, team: 'neutral', src: u, kind: 'fire' }); } }
    if (f.t <= 0) {
      if (u.def.auto && !opponents(w, u).some((h) => dist(h.x, h.y, u.x, u.y) < blastR(u) + h.r + 20) && !w.stale) { // overshot: fuse out, turn back, start over
        u.fuse = null; u.cool = 1.4; puff(w, u.x, u.y, '#8A8F96', 8, 60, 5, 0.4); return true;
      }
      boom(w, u);
    }
    return true;
  }
  if (u.cool > 0) { u.cool -= dt; stand(u, dt); const t = targetOf(w, u) || opponents(w, u)[0]; if (t) turnTo(u, angleTo(u.x, u.y, t.x, t.y), 1.6, dt); if (u.cool <= 0) light(w, u, u.facing); return true; }
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  light(w, u, angleTo(u.x, u.y, t.x, t.y));
  return true;
}
const blastR = (u) => (u.elite ? 110 : 85) * (u.major ? 1.25 : 1);
function light(w, u, a) { u.fuse = { t: 2.4, a }; setAnim(u, 'ability', 2.4); puff(w, u.x, u.y, '#FFD27A', 6, 60, 4, 0.3); }
function boom(w, u) { if (u.elite) w.hazards.push({ type: 'fire', x: u.x, y: u.y, r: 60, t: 4, max: 4 }); blast(w, u, { r: blastR(u), dmg: u.elite ? 22 : 18, burn: 26 }); }
// Automaton: a sword construct. Three blows, then it overheats: it stands open a moment, venting steam, and takes
// harder blows. The elite's vent scalds whoever is close.
function autoBrain(w, u, dt) {
  if (u.hot > 0) {
    u.hot -= dt; stand(u, dt); u.dvx = u.dvy = 0;
    if (rand() < dt * 14) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.6, y: u.y + rrange(-u.r, u.r) * 0.6, vx: rrange(-20, 20), vy: rrange(-20, 20), rise: 50, up: 0, life: 0.9, max: 0.9, size: rrange(7, 12), color: 'rgba(236,240,244,0.6)', drag: 0.9 });
    return true;
  }
  if (w.time - u.lastAttackT < 0.05 && u.lastCount !== u.lastAttackT) { u.lastCount = u.lastAttackT; u.heat = (u.heat || 0) + 1; }
  if (u.heat >= 3) {
    u.heat = 0; u.hot = 2.2; addBuff(u, { id: 'open', dur: 2.2, taken: 1.6 }); setAnim(u, 'ability', 2.2);
    if (u.elite) around(w, u, { r: u.r + 70, tell: 0.4, kind: 'water', hit: { dmg: 8, burn: 34, wet: 20, knock: 200 } });
    return true;
  }
  return false;
}
// The turrets' shots. Steam: a hot bolt that soaks. Flame: a short cone of fire. Gun: a burst of small rounds. Laser: a
// long charge-up line, then the beam. Mortar: a shell up and over onto where you stand (fire and poison kinds).
const steamShot = (w, u, t) => { setAnim(u, 'cast', 0.25); for (const da of u.elite ? [-0.12, 0.12] : [0]) shoot(w, u, u.facing + da, { kind: 'water', color: STEAM, speed: 330, dmg: 7, r: 10, life: 1.6, hitO: { knock: 110, burn: 12, wet: 24 } }); };
const flameShot = (w, u, t) => cone(w, u, u.facing, { r: u.r + 170, arc: u.elite ? 1.2 : 0.75, tell: 0.35, kind: 'fire', anim: 'cast', after: 0.1, hit: { dmg: 7, burn: 36, knock: 80 },
  fire: (w2, z) => { for (let i = 0; i < 10; i++) { const b = z.a + rrange(-z.arc / 2, z.arc / 2), d = rrange(30, z.r); flames(w2, z.x + Math.cos(b) * d, z.y + Math.sin(b) * d, 1, 10, 60); } } });
const gunShot = (w, u, t) => { setAnim(u, 'cast', 0.6); for (let i = 0; i < (u.elite ? 9 : 6); i++) later(w, u.x, u.y, 0.02 + i * 0.09, () => { if (alive(u)) shoot(w, u, u.facing + rrange(-0.09, 0.09), { kind: 'bolt', color: '#FFD27A', speed: 520, dmg: 3, r: 5, life: 1.1, hitO: { knock: 40 } }); }, 4); };
function laserShot(w, u, t) {
  const a = u.facing, len = 760;
  beginHold(u, 0.9, a, () => { if (!alive(u)) return; fx(w, { type: 'beam', kind: 'ray', col: '#FF5A4A', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, max: 0.35 }); w.shake = Math.max(w.shake, 2); });
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, hw: u.elite ? 26 : 18, t: 0.9, team: u.team, src: u, kind: 'fire', hit: { dmg: 16 * u.dmgMul, knock: 160, burn: 18 } });
  setAnim(u, 'cast', 0.9);
}
const shell = (el) => (w, u, t) => {
  const p = lead(t, 1.0), hit = { dmg: 12, knock: 220, ...(el === 'fire' ? { burn: 30 } : el === 'poison' ? { poison: 30 } : { stagger: 30 }) };
  const one = (x, y) => lob(w, u, x, y, { r: 62, tell: 1.25, proj: 'bone', color: el === 'fire' ? '#FF8A3D' : el === 'poison' ? '#9BCB3C' : '#5A5E66', pr: 10, kind: el === 'fire' ? 'fire' : el === 'poison' ? 'poison' : 'bone', dust: '#8A8F96', hit,
    land: (w2, z) => { w2.shake = Math.max(w2.shake, 3);
      if (el === 'fire' && !w2.hazards.some((h) => h.type === 'fire' && dist(h.x, h.y, z.x, z.y) < 50)) w2.hazards.push({ type: 'fire', x: z.x, y: z.y, r: 54, t: 4, max: 4 });
      if (el === 'poison' && !w2.hazards.some((h) => h.type === 'gas' && dist(h.x, h.y, z.x, z.y) < 50)) w2.hazards.push({ type: 'gas', x: z.x, y: z.y, r: 56, t: 5, max: 5 }); } });
  one(p.x, p.y); if (u.elite) for (const s of [-1, 1]) one(p.x + s * 90, p.y + rrange(-50, 50));
};
// Tesla coil: never moves; every so often a shock that jumps from the nearest hero to the next and the next (twice the
// shock and half again the harm on anyone wet). The elite's jumps go further, to more of them.
function teslaBrain(w, u, dt) {
  if (!u.placed) { u.placed = true; u.fixed = true; }
  u.dvx = u.dvy = 0; u.spd = 0; overheat(w, u, dt);
  if (rand() < dt * 4) sparks(w, u.x + rrange(-8, 8), u.y - u.vr * 0.5, rand() * TAU, 1, '#FFF27A');
  if (!due(u, 'zap', dt, 1.5)) return true;
  const first = opponents(w, u).filter((h) => dist(h.x, h.y, u.x, u.y) < 320 && lineClear(w, u.x, u.y, h.x, h.y, 4)).sort((a, b) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, b.x, b.y))[0];
  if (!first) { again(u, 'zap', 0.4); return true; }
  u.aggro = true; u.target = first;
  again(u, 'zap', 2.2, 2.8);
  const chain = [first], reach = u.elite ? 220 : 170, n = u.elite ? 5 : 3;
  while (chain.length < n) { const last = chain[chain.length - 1], nx = opponents(w, u).filter((h) => !chain.includes(h) && dist(h.x, h.y, last.x, last.y) < reach).sort((a, b) => dist(last.x, last.y, a.x, a.y) - dist(last.x, last.y, b.x, b.y))[0]; if (!nx) break; chain.push(nx); }
  let from = u;
  for (const h of chain) {
    const wet = h.st.wet > 30;
    fx(w, { type: 'beam', kind: 'lightning', x1: from.x, y1: from.y, x2: h.x, y2: h.y, max: 0.3, small: true });
    hurt(w, h, 7 * (wet ? 1.5 : 1) * u.dmgMul, u, { shock: 28 * (wet ? 2 : 1), knock: 40, noDodge: true });
    from = h;
  }
  setAnim(u, 'cast', 0.3);
  return true;
}
// Repair drone: floats about mending the most broken construct near it (kill it first). The elite also shields it a while.
function droneBrain(w, u, dt) {
  if (!due(u, 'mend', dt, 1.2)) return false;
  const b = allies(w, u).filter((a) => a.def.construct && a.hp < a.maxHp * 0.95 && dist(a.x, a.y, u.x, u.y) < 340).sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
  if (!b || w.stale) { again(u, 'mend', 0.6); return false; }
  again(u, 'mend', 2.4, 3); setAnim(u, 'cast', 0.4);
  heal(w, b, b.maxHp * 0.12, u);
  fx(w, { type: 'beam', kind: 'heal', x1: u.x, y1: u.y, x2: b.x, y2: b.y, max: 0.5, from: u, to: b });
  sparks(w, b.x, b.y, rand() * TAU, 4, '#FFE7A0');
  if (u.elite) addBuff(b, { id: 'plated', dur: 3, taken: 0.6 });
  return false;
}
// Foundry smith: a slow brute with a red-hot hammer (every blow burns, its def), and a slam in front that sends you
// flying and sets the floor alight. The elite throws a red-hot ingot.
function smithBrain(w, u, dt) {
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !due(u, 'slam', dt, 3) || gapTo(u, t) > 70) return false;
  again(u, 'slam', 6, 8);
  const a = angleTo(u.x, u.y, t.x, t.y), x = u.x + Math.cos(a) * (u.r + 40), y = u.y + Math.sin(a) * (u.r + 40);
  addDanger(w, { shape: 'circle', x, y, r: 80, t: 0.9, team: u.team, src: u, kind: 'fire', hit: { dmg: 18 * u.dmgMul, knock: 420, heavy: true, burn: 40, stagger: 30 },
    onFire: (w2, z) => { w2.shake = Math.max(w2.shake, 6); flames(w2, z.x, z.y, 12, 50, 90); if (!w2.hazards.some((h) => h.type === 'fire' && dist(h.x, h.y, z.x, z.y) < 50)) w2.hazards.push({ type: 'fire', x: z.x, y: z.y, r: 50, t: 3, max: 3 }); } });
  beginHold(u, 1.2, a); setAnim(u, 'ability', 1.2);
  return true;
}
// Bees. Bee: zigzags in, and now and then a long straight dash through you. Wasp: circles its mark, flicking short
// stingers. Hornet: circles like a wasp, then alternates five stingers and the bee's dash. The elite bee dashes twice,
// the elite wasp's stingers poison, the elite hornet fires eight.
function zigzag(w, u, t, dt) {
  const a = angleTo(u.x, u.y, t.x, t.y), side = Math.sin(w.time * 5 + u.id) > 0 ? 1 : -1, d = a + side * 0.9;
  const sp = u.def.speed * (u.moveMul || 1);
  u.dvx = Math.cos(d) * sp; u.dvy = Math.sin(d) * sp; u.mvA = d; u.spd = sp; u.facing = a;
}
function circleAt(w, u, t, dt, R) {
  const a = angleTo(t.x, t.y, u.x, u.y), d = dist(u.x, u.y, t.x, t.y), side = u.orbit || (u.orbit = chance(0.5) ? 1 : -1);
  const tang = a + side * Math.PI / 2, rad = clamp((d - R) / 60, -1, 1), sp = u.def.speed * (u.moveMul || 1);
  let vx = Math.cos(tang) - Math.cos(a) * rad, vy = Math.sin(tang) - Math.sin(a) * rad; const L = Math.hypot(vx, vy) || 1;
  vx /= L; vy /= L;
  if (solidAt(w, u.x + vx * 30, u.y + vy * 30, u.r)) { u.orbit = -side; }
  u.dvx = vx * sp; u.dvy = vy * sp; u.mvA = Math.atan2(vy, vx); u.spd = sp; u.facing = angleTo(u.x, u.y, t.x, t.y);
}
function beeDash(w, u, t) {
  const g = gapTo(u, t); if (g < 80 || g > 400 || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return false;
  rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 180, { tell: 0.4, speed: u.def.speed * 4, dmg: u.def.dmg * 1.6, knock: 200, trail: 'rgba(255,210,120,0.6)' });
  return true;
}
const stinger = (w, u, a) => shoot(w, u, a + rrange(-0.08, 0.08), { kind: 'dagger', speed: 360, dmg: u.def.dmg * 0.6, r: 5, life: 0.5, hitO: { knock: 30, poison: u.elite && u.def.wasp ? 18 : 0 } });
function beeBrain(w, u, dt) {
  if (rushTick(w, u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  if (u.again > 0) { u.again = 0; if (beeDash(w, u, t)) return true; }
  if (due(u, 'dash', dt, 2) && beeDash(w, u, t)) { again(u, 'dash', 3.5, 5); if (u.elite) u.again = 1; return true; }
  if (gapTo(u, t) > 30) { zigzag(w, u, t, dt); return true; }
  return false;
}
function waspBrain(w, u, dt) {
  if (rushTick(w, u, dt)) return true;
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  circleAt(w, u, t, dt, 150);
  if (dist(u.x, u.y, t.x, t.y) < 210 && due(u, 'sting', dt, 1)) {
    if (u.def.hornet) {
      u.turn5 = !u.turn5;
      if (u.turn5) { again(u, 'sting', 2.2, 2.8); const n = u.elite ? 8 : 5; for (let i = 0; i < n; i++) later(w, u.x, u.y, 0.02 + i * 0.09, () => { if (alive(u) && alive(t)) stinger(w, u, angleTo(u.x, u.y, t.x, t.y)); }, 4); }
      else { again(u, 'sting', 2.2, 2.8); if (beeDash(w, u, t)) return true; }
    } else { again(u, 'sting', 1, 1.3); stinger(w, u, angleTo(u.x, u.y, t.x, t.y)); }
  }
  return true;
}
// The saw blade: a trap, not a fighter. It runs back and forth along a wall's face, half sunk into it, cutting whatever
// of the other side it meets (it can't be hit; it winds down when the room is won).
function sawBrain(w, u, dt) {
  if (!u.run) layRun(w, u);
  const r = u.run;
  u.ethereal = true;
  if (!r) { stand(u, dt); return true; }
  r.s += r.v * dt; if (r.s < r.s0) { r.s = r.s0; r.v = Math.abs(r.v); } if (r.s > r.s1) { r.s = r.s1; r.v = -Math.abs(r.v); }
  u.x = r.x + r.dx * r.s; u.y = r.y + r.dy * r.s; u.facing = wrapAngle(u.facing + 18 * dt);
  if (rand() < dt * 20) sparks(w, u.x + r.nx * 4, u.y + r.ny * 4, Math.atan2(r.ny, r.nx) + rrange(-0.8, 0.8), 1, '#FFE7A0');
  const T = u.touched || (u.touched = new Map());
  for (const h of opponents(w, u)) {
    if (dist(u.x, u.y, h.x, h.y) > u.r + h.r || (T.get(h) || -9) > w.time - 0.6) continue;
    T.set(h, w.time);
    hurt(w, h, u.def.dmg * u.dmgMul, u, { knock: 260, kAngle: Math.atan2(r.ny, r.nx), noDodge: true });
  }
  return true;
}
// Pick the wall face nearest where it was put, and the open stretch of it either side.
function layRun(w, u) {
  u.fixed = true;
  const faces = [];
  const add = (x, y, dx, dy, nx, ny, lo, hi) => faces.push({ x, y, dx, dy, nx, ny, lo, hi });
  add(0, 0, 0, 1, 1, 0, 0, w.H); add(w.W, 0, 0, 1, -1, 0, 0, w.H); add(0, 0, 1, 0, 0, 1, 0, w.W); add(0, w.H, 1, 0, 0, -1, 0, w.W);
  for (const q of w.walls) { add(q.x, q.y, 0, 1, -1, 0, 0, q.h); add(q.x + q.w, q.y, 0, 1, 1, 0, 0, q.h); add(q.x, q.y, 1, 0, 0, -1, 0, q.w); add(q.x, q.y + q.h, 1, 0, 0, 1, 0, q.w); }
  const open = (f, s) => { const px = f.x + f.dx * s + f.nx * 40, py = f.y + f.dy * s + f.ny * 40; return !solidAt(w, px, py, 20) && (!w.cells || w.cells.some((c) => px > c.x && px < c.x + c.w && py > c.y && py < c.y + c.h)); };
  let best = null, bd = Infinity;
  for (const f of faces) {
    const s = clamp((u.x - f.x) * f.dx + (u.y - f.y) * f.dy, f.lo + 20, f.hi - 20), px = f.x + f.dx * s, py = f.y + f.dy * s, d = dist(u.x, u.y, px, py);
    if (d >= bd || d > 500 || !open(f, s) || px < 180) continue;
    let s0 = s, s1 = s; while (s0 - 20 > f.lo + 20 && open(f, s0 - 20)) s0 -= 20; while (s1 + 20 < f.hi - 20 && open(f, s1 + 20)) s1 += 20;
    if (s1 - s0 < 160) continue;
    bd = d; best = { ...f, s, s0, s1, v: u.def.speed * (chance(0.5) ? 1 : -1) };
  }
  u.run = best;
}
// The chain crawler: a mechanical centipede, a chain (families.js): head and eight plated segments, one health bar; it
// winds after you and its bite shocks. The elite's segments fire bolts out to the sides.
function crawlerBrain(w, u, dt) {
  chainHead(w, u, dt);
  if (rushTick(w, u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'lunge', dt, 2.5)) return false;
  const g = gapTo(u, t); if (g < 60 || g > 280 || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return false;
  again(u, 'lunge', 5, 6.5);
  rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 80, { tell: 0.45, dmg: 13, knock: 220, status: { shock: 30 }, trail: 'rgba(255,240,170,0.6)' });
  return true;
}
// The drill bot: a burrower (families.js): drills under the floor and comes up beside a hero spinning.
const DRILL = { up: [3, 4.5], under: [1.2, 2], near: 40, r: 64, tell: 0.6, hit: { dmg: 9, knock: 240, stagger: 30 }, dirt: '#6E6A64', speed: 2,
  then: (w, u) => { if (u.elite) for (let i = 0; i < 6; i++) shoot(w, u, i / 6 * TAU, { kind: 'bolt', color: '#C9CED6', speed: 320, dmg: 4, r: 6, life: 0.6, hitO: { knock: 60 } }); } };

// ---------------------------------------------------------------- the kinds
const TURRET = { ...FOE, headR: 60, r: 26, vr: 22, turn: 0, accel: 0, face: 0, mass: 99, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 6, xp: 9, coins: [1, 4], cost: 3.5,
  noCorpse: true, construct: true, goo: '#8A8F96', res: { ...MACHINE, stagger: 0 }, brain: turretBrain };
const turretArt = (spec) => variantUrl('art/enemies/mimic.svg', spec); // (unused since art round 9: every turret has its own art)
// the fire and gas mortars: the mortar with its brass trim turned red and green (art round 9)
const mortarArt = (hue, light) => variantUrl('art/enemies/mortar.svg', { accent: { from: 40, range: 30, hue, sat: hue < 30 ? 1.25 : 1, light } });
const BEE = { ...FOE, art: 'art/enemies/bee.svg', headR: 56, r: 15, vr: 12, turn: 8, accel: 520, face: 8, mass: 0.35, hp: 14, speed: 86,
  role: 'skirmish', range: 10, atkCd: 0.8, dmg: 5, arc: 1.4, temp: 0.6, commit: 0.4, xp: 4, coins: [0, 2], cost: 1.2, pack: [3, 5], attackAnim: 'thrust', construct: true,
  noCorpse: true, goo: '#C9A46A', res: MACHINE, brain: beeBrain };
// copper, bronze, steel: each more health and harm than the last
const METAL = { Copper: { hue: 0, sat: 1, light: 0, hp: 1, dmg: 1, xp: 1, cost: 1 }, Bronze: { hue: 18, sat: 0.6, light: -0.08, hp: 1.6, dmg: 1.3, xp: 1.4, cost: 1.4 },
  Steel: { hue: 190, sat: 0.25, light: 0.08, hp: 2.4, dmg: 1.7, xp: 1.9, cost: 1.9 } };
const metal = (base, M, name) => { const m = METAL[M], d = base; return { variantOf: d.id, name: `${M} ${name}`, hue: m.hue, sat: m.sat, light: m.light, hp: Math.round(d.hp * m.hp), dmg: +(d.dmg * m.dmg).toFixed(1), xp: Math.round(d.xp * m.xp), cost: +(d.cost * m.cost).toFixed(1) }; };
const BASES = {
  bee: { ...BEE, id: 'bee', name: 'Copper Bee' },
  wasp: { ...BEE, id: 'wasp', name: 'Copper Wasp', wasp: true, art: 'art/enemies/wasp.svg', headR: 58, hp: 18, speed: 80, role: 'ranged', range: 200, keep: 150, atkCd: 999, dmg: 5, xp: 5, cost: 1.6, pack: [2, 3], brain: waspBrain },
  hornet: { ...BEE, id: 'hornet', name: 'Copper Hornet', wasp: true, hornet: true, art: 'art/enemies/hornet.svg', headR: 62, r: 19, vr: 15, hp: 26, speed: 80, role: 'ranged', range: 200, keep: 150, atkCd: 999, dmg: 6, xp: 8, cost: 2.6, pack: [1, 2], brain: waspBrain },
};
export const FOUNDRY = {
  gearSprite: { variantOf: 'slimeSmall', name: 'Gear Sprite', art: 'art/enemies/gear-sprite.svg', headR: 65, r: 20, vr: 18, mass: 1, hp: 30, speed: 92, dmg: 6, atkCd: 999, hops: null,
    xp: 6, coins: [1, 3], cost: 2, pack: [1, 2], pass: true, construct: true, noCorpse: true, goo: '#8A8F96', res: MACHINE, brain: gearBrain },
  cogSprite: { variantOf: 'gearSprite', name: 'Cog Sprite', art: 'art/enemies/cog-sprite.svg', homes: true, hp: 36, xp: 7, cost: 2.4 },
  bombBot: { ...FOE, name: 'Bomb Bot', art: 'art/enemies/bomb-bot.svg', headR: 45, r: 22, vr: 19, turn: 5, accel: 300, face: 5, mass: 0.8,
    hp: 26, speed: 68, role: 'melee', range: 10, atkCd: 999, dmg: 0, temp: 0.4, commit: 1, xp: 6, coins: [1, 3], cost: 2.5, pack: [1, 2], construct: true, noCorpse: true, goo: '#8A8F96',
    res: { ...MACHINE, burn: 1.5 }, brain: bombBrain },
  autoBomb: { variantOf: 'bombBot', name: 'Auto Bomb Bot', hue: 200, sat: 0.6, light: -0.02, auto: true, hp: 34, xp: 8, cost: 3 },
  automaton: { ...FOE, name: 'Automaton', art: 'art/enemies/automaton.svg', headR: 54, r: 33, vr: 24, turn: 4, accel: 240, face: 4, mass: 2,
    hp: 96, speed: 54, role: 'melee', range: 26, atkCd: 0.9, windup: 0.25, dmg: 11, knock: 170, arc: 1.8, heavy: true, temp: 0.3, commit: 1.1, xp: 18, coins: [3, 7], cost: 6,
    attackAnim: 'swing', construct: true, goo: '#C9A46A', res: MACHINE, brain: autoBrain },
  turretSteam: { ...TURRET, name: 'Steam Turret', art: 'art/enemies/turret-steam.svg', hp: 70, turret: { turn: 0.7, cd: 1.6, aim: 0.15, range: 520, fire: steamShot } },
  turretFlame: { ...TURRET, name: 'Flame Turret', art: 'art/enemies/turret-flame.svg', hp: 70, res: { ...TURRET.res, burn: 0 }, turret: { turn: 0.9, cd: 2.4, aim: 0.2, range: 230, fire: flameShot } },
  turretGun: { ...TURRET, name: 'Gun Turret', art: 'art/enemies/turret-gun.svg', hp: 60, turret: { wall: true, arc: 1.1, turn: 1.0, cd: 2.4, aim: 0.2, range: 560, fire: gunShot } },
  turretLaser: { ...TURRET, name: 'Laser Turret', art: 'art/enemies/turret-laser.svg', hp: 64, cost: 4, turret: { wall: true, arc: 1.2, turn: 0.45, cd: 4.2, aim: 0.12, range: 760, fire: laserShot } },
  mortar: { ...TURRET, name: 'Mortar', art: 'art/enemies/mortar.svg', hp: 72, cost: 4, turret: { turn: 1.2, cd: 3.4, aim: 0.6, range: 620, fire: shell('') } },
  mortarFire: { ...TURRET, name: 'Fire Mortar', art: mortarArt(8, -0.04), hp: 72, cost: 4.5, res: { ...TURRET.res, burn: 0 }, turret: { turn: 1.2, cd: 3.6, aim: 0.6, range: 620, fire: shell('fire') } },
  mortarPoison: { ...TURRET, name: 'Gas Mortar', art: mortarArt(95, -0.06), hp: 72, cost: 4.5, turret: { turn: 1.2, cd: 3.6, aim: 0.6, range: 620, fire: shell('poison') } },
  teslaCoil: { ...TURRET, name: 'Tesla Coil', art: 'art/enemies/tesla-coil.svg', headR: 52, r: 24, vr: 20, hp: 80, cost: 4.5, res: { ...MACHINE, shock: 0, stagger: 0 }, turret: null, brain: teslaBrain },
  repairDrone: { ...FOE, name: 'Repair Drone', art: 'art/enemies/repair-drone.svg', headR: 55, r: 18, vr: 15, turn: 6, accel: 300, face: 6, mass: 0.4,
    hp: 30, speed: 62, role: 'ranged', range: 240, keep: 220, atkCd: 999, dmg: 0, temp: 0.5, commit: 0.6, xp: 10, coins: [2, 4], cost: 3, construct: true, noCorpse: true, goo: '#8A8F96',
    res: MACHINE, brain: droneBrain },
  foundrySmith: { ...FOE, name: 'Foundry Smith', art: 'art/enemies/smith.svg', headR: 66, r: 40, vr: 30, turn: 2.8, accel: 160, face: 2.8,
    mass: 2.8, hp: 160, speed: 42, role: 'melee', range: 28, atkCd: 1.9, windup: 0.55, dmg: 13, burn: 25, knock: 250, arc: 1.9, heavy: true, temp: 0.25, commit: 1.2, xp: 30, coins: [5, 10],
    cost: 8, attackAnim: 'swing', res: { burn: 0, chill: 1.3 }, brain: smithBrain },
  ...BASES,
  beeBronze: metal(BASES.bee, 'Bronze', 'Bee'), beeSteel: metal(BASES.bee, 'Steel', 'Bee'),
  waspBronze: metal(BASES.wasp, 'Bronze', 'Wasp'), waspSteel: metal(BASES.wasp, 'Steel', 'Wasp'),
  hornetBronze: metal(BASES.hornet, 'Bronze', 'Hornet'), hornetSteel: metal(BASES.hornet, 'Steel', 'Hornet'),
  sawBlade: { variantOf: 'slimeSmall', name: 'Saw Blade', art: 'art/enemies/saw-blade.svg', headR: 67, r: 22, vr: 20, mass: 99, hp: 999, speed: 190, dmg: 8, atkCd: 999, hops: null,
    xp: 0, coins: [0, 0], cost: 2.5, trap: true, pass: true, noElite: true, noCorpse: true, goo: '#C9CED6', brain: sawBrain },
  chainCrawler: { ...FOE, name: 'Chain Crawler', art: 'art/enemies/crawler-head.svg', headR: 40, r: 30, vr: 23, turn: 3.2, accel: 260, face: 4, mass: 2.4,
    hp: 190, speed: 62, role: 'melee', range: 18, atkCd: 1.1, windup: 0.2, dmg: 11, knock: 150, arc: 1.4, temp: 0.4, commit: 1, xp: 32, coins: [5, 10], cost: 8, attackAnim: 'thrust',
    construct: true, chain: { n: 8, seg: 'crawlerPlate', gap: 28, taper: 0.6 }, res: MACHINE, brain: crawlerBrain, onDeath: killChain },
  crawlerPlate: { variantOf: 'slimeSmall', name: 'Crawler Plate', art: 'art/enemies/crawler-plate.svg', headR: 46, r: 26, vr: 22, mass: 2, hp: 999, speed: 0, atkCd: 999, dmg: 0, hops: null,
    xp: 0, coins: [0, 0], cost: 99, noCorpse: true, noElite: true, segment: true, touchDmg: 5, segTaken: 0.6, construct: true, goo: '#8A8F96', brain: segBrain },
  drillBot: { ...FOE, name: 'Drill Bot', art: 'art/enemies/drill-bot.svg', headR: 49, r: 24, vr: 20, turn: 6, accel: 320, face: 6, mass: 1.2,
    hp: 48, speed: 66, role: 'skirmish', range: 14, atkCd: 1.0, dmg: 7, arc: 1.6, temp: 0.5, commit: 0.6, xp: 10, coins: [2, 4], cost: 3.5, attackAnim: 'thrust', construct: true,
    noCorpse: true, goo: '#8A8F96', res: MACHINE, brain: (w, u, dt) => hold(u, dt) || burrowTick(w, u, dt, DRILL) },
  spiritShock: { ...spirit('shock', 'Storm Spirit', { hue: 15, sat: 1.4, light: 0.2 }, { shock: 0 }), art: 'art/enemies/spirit-shock.svg', headR: 30 }, // art round 9
};
for (const k of Object.keys(BASES)) delete FOUNDRY[k].id;

// ---------------------------------------------------------------- their elite moves
const NONE = { tick() { return false; } };
Object.assign(ELITES, {
  gearSprite: NONE,      // sparks off every wall it hits (gearBrain reads u.elite)
  bombBot: NONE,         // its blast leaves fire (boom reads u.elite)
  automaton: NONE,       // its overheat scalds whoever is close (autoBrain reads u.elite)
  turretSteam: NONE, turretFlame: NONE, turretGun: NONE, turretLaser: NONE, mortar: NONE, mortarFire: NONE, mortarPoison: NONE, // two bolts, a wider cone, a longer burst, a wider beam, three shells
  teslaCoil: NONE,       // jumps further, to more (teslaBrain reads u.elite)
  repairDrone: NONE,     // shields what it mends (droneBrain reads u.elite)
  // Foundry smith: throws a red-hot ingot that leaves the floor burning.
  foundrySmith: { tick(w, u, dt) { every(w, u, dt, 'ingot', 5, 7, 420, (t) => { const p = lead(t, 0.7); lob(w, u, p.x, p.y, { r: 58, tell: 1.0, proj: 'fireball', kind: 'fire', dust: '#5A4A40', hit: { dmg: 12, burn: 35, knock: 200 },
    land: (w2, z) => { if (!w2.hazards.some((h) => h.type === 'fire' && dist(h.x, h.y, z.x, z.y) < 50)) w2.hazards.push({ type: 'fire', x: z.x, y: z.y, r: 52, t: 4, max: 4 }); } }); }); return false; } },
  bee: NONE, wasp: NONE, hornet: NONE, // two dashes; poison stingers; eight stingers (their brains read u.elite)
  // Chain crawler: its plates fire bolts out to the sides.
  chainCrawler: { tick(w, u, dt) {
    if (!u.segs || !due(u, 'plates', dt, 3)) return false;
    again(u, 'plates', 4, 5.5);
    u.segs.forEach((s, i) => { if (alive(s)) later(w, s.x, s.y, 0.05 + i * 0.07, () => { if (alive(s)) for (const side of [-1, 1]) shoot(w, s, s.facing + side * Math.PI / 2, { kind: 'bolt', color: '#FFF27A', speed: 320, dmg: 4, r: 6, life: 0.9, hitO: { knock: 50, shock: 10 } }); }, 6); });
    return false;
  } },
  drillBot: NONE,        // throws scrap all round when it surfaces (DRILL.then reads u.elite)
  spiritShock: NONE,
});
