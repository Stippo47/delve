// Round 9: the approved additions for the Warren, the Sewers and the Crypt (deck roster2; the designer's notes word for
// word in docs/riffle-log/2026-11-21-round9.txt). Each kind has a base kit and an elite move (ELITES, elites.js).
// Variants are recolours of their base's art (recolor.js). Art round 8 drew the rat king (a heap of rats), the croc (two
// axes) and the crab (its blue and green kinds are it recoloured); the rest is PLACEHOLDER art until the real art comes.
//   The Warren: the spear-thrower goblin ("throws spears (which come back immediately)"), the bomber, the suicide
//     bomber ("Runs at enemy, stands next to them for a moment then explodes, needs to be killed quickly"), the wolf rider
//     ("Uses spear"), the frost shaman, the rock troll (its rolling boulder; the base troll's breakable boulder), the
//     drummer, mice ("goblins keep them as pets") and dynamite mice ("the boss could summon them").
//   The Sewers: the plague rat, the rat king as a normal enemy ("as it takes damage it releases a rat ... On death drops
//     3 more rats for a total of 13"), slime colours (base blue, sludge dark brownish green, toxic lime green), the
//     sludge slime ("moves 2x as fast when burning and on death leaves an oil puddle which immediately burns if it dies
//     burning leaving no small slimes"), the croc ("Should just drag instead. Does more damage to wet enemies. Has 2
//     axes, bite is an ability"), crabs ("Circles in, in wide circles ... Always faces target ... pinches them. Quite
//     fast"; blue: slow bubbles that wet; green: poison bubbles, two in a row), the brain leech ("Makes target fight
//     allies, can still be knocked off, any damage from allies to controlled ally will go to leach") and the blood leech
//     ("Leaches, gets off then shoots the blood as projectiles, then repeats").
//   The Crypt: the golden skeleton (double gold, homing golden bones that go through heroes and hit 1.5x; "immune to
//     status effects completely and has more hp") and the harrowing skeleton ("Revive 1 time after death. On revival
//     makes small burst of curse around them").
import { alive, opponents, allies, hurt, puff, sparks, flames, addStatus, setAnim, fx, addBuff, explode, spawn, heal, kill, addDanger, drive, steer, goalVec, turnSide, restoreSide } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { ELITES, lob, cone, line, around, rush, rushTick, summon, shoot, blink, openSpot, hold, beginHold, due, again, targetOf, gapTo, crowd, stand, turnTo, later } from './elites.js';
import { shamanBrain } from './enemies.js';
import { variantUrl } from './recolor.js';
import { fillOf } from './statuses.js';

const ART = (f) => `art/enemies/placeholder/${f}.svg`;
const FOE = { team: 'enemy', turn: 4, accel: 220, face: 4, mass: 1.2, temp: 0.35, commit: 0.9 };
const sees = (w, u, t, max) => t && dist(u.x, u.y, t.x, t.y) < max && lineClear(w, u.x, u.y, t.x, t.y, 4);
const lead = (t, k) => ({ x: t.x + (t.vx || 0) * k, y: t.y + (t.vy || 0) * k });
function every(w, u, dt, key, a, b, range, fn) {
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, key, dt, a)) return;
  if (!sees(w, u, t, range)) return;
  again(u, key, a, b); fn(t);
}

// ---------------------------------------------------------------- the Warren
// A spear thrown out that comes straight back to the thrower, cutting both ways.
function boomSpear(w, u, a, o = {}) {
  const sp = 460, reach = o.reach || 300, life = reach / sp;
  setAnim(u, 'throw', 0.35);
  w.projectiles.push({ kind: 'dagger', x: u.x, y: u.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 9, team: u.team, owner: u, dmg: (o.dmg || 7) * u.dmgMul, o: { knock: 120 }, life, a,
    hitSet: new Set(), pierce: 4, land: (p) => { if (!alive(u)) return; const b = angleTo(p.x, p.y, u.x, u.y), dd = dist(p.x, p.y, u.x, u.y);
      w.projectiles.push({ kind: 'dagger', x: p.x, y: p.y, vx: Math.cos(b) * sp * 1.2, vy: Math.sin(b) * sp * 1.2, r: 9, team: u.team, owner: u, dmg: (o.dmg || 7) * 0.7 * u.dmgMul, o: { knock: 80 }, life: dd / (sp * 1.2), a: b, hitSet: new Set(), pierce: 4 }); } });
}
// A bomb with a lit fuse: lobbed, it lands and sits a moment (a circle on the floor) before it blows.
function fuseBomb(w, u, x, y, o = {}) {
  lob(w, u, x, y, { r: 18, tell: o.fly || 0.7, proj: 'vial', color: '#3A3236', kind: 'fire', dust: '#5A4A40', spawns: true,
    land: (w2, z) => addDanger(w2, { shape: 'circle', x: z.x, y: z.y, r: o.r || 72, t: o.fuse || 1.0, team: u.team, src: null, by: u, kind: 'fire', spawns: true,
      hit: { dmg: (o.dmg || 14) * u.dmgMul, knock: 300, heavy: true, burn: o.burn || 0 },
      onFire: (w3, q) => { explode(w3, q.x, q.y, 4, 0, { burn: 1 }, null, '#FF8A3D'); w3.shake = Math.max(w3.shake, 5); } }) });
}
// The suicide bomber (and dynamite mice): runs in, stops next to someone, the fuse fizzes, and it blows (with itself).
function fuseBrain(w, u, dt, o) {
  if (u.fuse != null) {
    u.fuse -= dt; stand(u, dt); u.dvx = u.dvy = 0;
    if (rand() < dt * 30) sparks(w, u.x, u.y - u.vr * 0.6, -Math.PI / 2 + rrange(-0.6, 0.6), 1, '#FFD27A');
    if (u.fuse <= 0) { u.fuse = null; u.blew = true; kill(w, u, null); }
    return true;
  }
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  if (gapTo(u, t) < (o.reach || 22)) {
    u.fuse = o.fuse; setAnim(u, 'ability', o.fuse);
    addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: o.r, t: o.fuse, team: u.team, src: u, kind: 'fire' });
    return true;
  }
  return false;
}
function blowUp(w, u, o) { // its own death: a blast only if the fuse ran out (killed in time, it just falls)
  if (!u.blew) return;
  explode(w, u.x, u.y, o.r, o.dmg * u.dmgMul, { burn: o.burn || 20 }, u, '#FF8A3D');
  w.shake = Math.max(w.shake, 7);
  if (o.fire) w.hazards.push({ type: 'fire', x: u.x, y: u.y, r: 50, t: 4, max: 4 });
}
// Drummer: no damage; everyone of its side close by attacks faster while it plays.
function drumBrain(w, u, dt) {
  if (hold(u, dt)) return true;
  if (!u.aggro) return false;
  if (due(u, 'beat', dt, 0.5)) {
    again(u, 'beat', 0.5);
    for (const a of [u, ...allies(w, u)]) if (dist(a.x, a.y, u.x, u.y) < 280) addBuff(a, { id: 'drums', dur: 0.8, atkSpeed: 1.3, move: 1.1 });
    u.beats = (u.beats || 0) + 1;
    if (u.beats % 4 === 0) { fx(w, { type: 'ring', x: u.x, y: u.y, r: 280, color: '#E0A04B', max: 0.5 }); setAnim(u, 'swing', 0.25); }
  }
  return false;
}
// Wolf rider: charges through the party, spear first; when the wolf falls, the goblin fights on with its spear.
function riderBrain(w, u, dt) {
  if (rushTick(w, u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'charge', dt, 2)) return false;
  const g = gapTo(u, t); if (g < 70 || g > 360 || !lineClear(w, u.x, u.y, t.x, t.y, u.r * 0.8)) return false;
  again(u, 'charge', u.elite ? 3.5 : 5, u.elite ? 4.5 : 7);
  rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 170, { tell: 0.45, dmg: 13, knock: 300, status: { stagger: 25 }, trail: 'rgba(190,170,140,0.7)' });
  return true;
}
// Frost shaman: a frost ball that bursts and chills (not fire), and an ice totem planted near the party.
function frostBall(w, u, t) {
  const a = angleTo(u.x, u.y, t.x, t.y), sp = 240;
  setAnim(u, 'cast', 0.4);
  w.projectiles.push({ kind: 'bolt', color: '#BFEFFF', x: u.x + Math.cos(a) * (u.r + 8), y: u.y + Math.sin(a) * (u.r + 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    r: 9, team: u.team, owner: u, dmg: 5 * u.dmgMul, o: { knock: 40, chill: 20 }, life: 1.6, a,
    onHit: (w2, p) => explode(w2, p.x, p.y, 48, 4 * u.dmgMul, { chill: 28 }, u, '#BFEFFF') });
}
function frostShamanBrain(w, u, dt) {
  every(w, u, dt, 'ball', 2.6, 3.4, u.def.range, (t) => frostBall(w, u, t));
  if (u.aggro && due(u, 'totem', dt, 4) && !w.stale) {
    const t = targetOf(w, u);
    if (t && w.units.filter((o) => o.kind === 'iceTotem' && o.calledBy === u && alive(o)).length < 2) {
      again(u, 'totem', 10, 12);
      const a = rand() * TAU, x = clamp(t.x + Math.cos(a) * 90, 60, w.W - 60), y = clamp(t.y + Math.sin(a) * 90, 60, w.H - 60);
      const p = openSpot(w, x, y, 0, 60, 24) || { x, y };
      later(w, p.x, p.y, 0.6, () => { const s = spawn(w, 'iceTotem', p.x, p.y, { mult: w.mult }); s.aggro = true; s.minion = true; s.calledBy = u; s.lifeT = 12; puff(w, p.x, p.y, '#DFF6FF', 12, 100, 6, 0.5); });
      setAnim(u, 'cast', 0.5);
    } else again(u, 'totem', 2);
  }
  return false;
}
function totemBrain(w, u, dt) {
  stand(u, dt); u.dvx = u.dvy = 0; u.spd = 0;
  for (const h of opponents(w, u)) if (dist(h.x, h.y, u.x, u.y) < 150 + h.r) addStatus(w, h, 'chill', 16 * dt, u);
  if (rand() < dt * 6) { const a = rand() * TAU, d = rrange(20, 150); w.particles.push({ x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d, vx: 0, vy: 0, rise: 20, up: 0, life: 0.8, max: 0.8, size: 3, color: '#EAF8FF' }); }
  return true;
}

// The troll's boulder (round 9). It walks behind a boulder, pushing it, turning slowly "like a car"; with a hero in
// front it either lets it go (it rolls at them, heavy knockback and stagger, slowing as it goes) or charges behind it;
// then it walks over and takes it up again. The boulder is a round obstacle (w.pillars, so it has its own hit box and
// blocks shots and bodies); it's gone when the troll dies. The rock troll's can't be hurt; the base troll's has its own
// health and breaks (then it fights bare-handed). The elite rock troll calls its boulder back, and its boulder is 25%
// bigger.
// Art round 8: the troll holds its boulder in both fists, so a held boulder sits HOLD of the troll's radius inside the
// troll's collider, against the fists (the troll and its own held or rolling boulder don't push each other: sim.js).
export const HOLD = -0.46;
// Round 13 (lane E; the designer, art round 8: "Try different heads. Make them slightly smaller keep boulder same size"):
// the boulder's size is its own, not the troll's: today's boulder (0.62 of the round-8 troll's collider, r 60 x the
// colliders' 1.1 = 66: 41 room units), grown only as an elite or major troll is (u.r over its kind's r), so a smaller
// troll still pushes the same boulder. def.boulderR overrides.
export const BOULDER_R = 41;
const BOULDER_JAM = 3, BOULDER_REST = 4; // round 14 (lane L): seconds getting nowhere before it lets the boulder be; seconds bare-handed after (round 17: 6 -> 4, and only when it had no line to roll it down)
// Round 17 (lane foes17; the designer: "look into the troll shaped enemies not being able to get their boulders"):
// BOULDER_REACH, how far past touching it can reach for its boulder (16 -> 26: a hero or a friend leaning on the far
// side no longer keeps its hands off it); BOULDER_RIP, the stoop to tear a new boulder out of the floor when it can't
// get to the one it has (wedged in a gap it can't fit through, walled in by its friends): the old one crumbles.
const BOULDER_REACH = 26, BOULDER_RIP = 1.1;
function boulderOf(w, u) {
  if (u.bould === undefined) {
    const big = u.elite && u.def.rock ? 1.25 : 1, r = Math.round((u.def.boulderR || BOULDER_R) * (u.r / (u.def.r || u.r)) * big);
    const d = u.r * (1 + HOLD) + r + 8;
    const b = { x: u.x + Math.cos(u.facing) * d, y: u.y + Math.sin(u.facing) * d, r, prop: 'troll-boulder', boulder: true, owner: u, team: u.team, vx: 0, vy: 0, held: true, hits: new Set() };
    if (!u.def.rock) { b.hp = b.maxHp = Math.round(55 * (w.mult || 1)); }
    u.bould = b; w.pillars.push(b);
  }
  if (u.bould && u.bould.hp != null && u.bould.hp <= 0) { // broken to pieces
    const b = u.bould; w.pillars.splice(w.pillars.indexOf(b), 1); u.bould = null;
    puff(w, b.x, b.y, '#9A9088', 22, 220, 7, 0.6); w.shake = Math.max(w.shake, 4);
    for (let i = 0; i < 6; i++) { const a = rand() * TAU; w.particles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: 0.6, max: 0.6, size: 7, color: '#8C8270' }); }
  }
  return u.bould;
}
export function dropBoulder(w, u) { const b = u.bould; if (b) { const i = w.pillars.indexOf(b); if (i >= 0) w.pillars.splice(i, 1); puff(w, b.x, b.y, '#9A9088', 14, 150, 6, 0.5); } u.bould = null; }
export function boulderBrain(w, u, dt) {
  if (u.ripT > 0) return ripTick(w, u, dt); // tearing a new one out of the floor
  const b = u.bould === null ? null : boulderOf(w, u);
  if (!b) return false;
  const front = (k = 8) => ({ x: u.x + Math.cos(u.facing) * (u.r * (1 + HOLD) + b.r + k), y: u.y + Math.sin(u.facing) * (u.r * (1 + HOLD) + b.r + k) });
  if (b.held) { // carried in front
    if (!(u.chg)) { const p = front(8 + Math.hypot(u.vx, u.vy) * dt * 3); b.x = p.x; b.y = p.y; }
  } else rollBoulder(w, u, b, dt);
  // round 14 (lane L): standing through the tell before it lets the boulder go (beginHold below). Nothing ran this
  // hold, so the tell never ended and the boulder was never let go: a troll kept it in front of it for good (until the
  // old stand-off clock made it drop it), and a hero pressed against it could never get at the troll.
  if (hold(u, dt)) return true;
  // charging behind it
  if (u.chg) {
    const c = u.chg;
    if (c.tell > 0) { c.tell -= dt; stand(u, dt); turnTo(u, c.a, 6, dt); const p = front(); b.x = p.x; b.y = p.y; return true; }
    u.dvx = Math.cos(c.a) * c.sp; u.dvy = Math.sin(c.a) * c.sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = c.a; u.spd = c.sp; u.facing = c.a;
    const p = front(10 + c.sp * dt * 2); b.x = p.x; b.y = p.y;
    boulderHits(w, u, b, c.sp, c.a);
    const nx = b.x + Math.cos(c.a) * (b.r + 6), ny = b.y + Math.sin(c.a) * (b.r + 6);
    if ((c.t -= dt) <= 0 || nx < 4 || ny < 4 || nx > w.W - 4 || ny > w.H - 4 || !lineClear(w, b.x, b.y, nx, ny, 2)) { u.chg = null; u.spd *= 0.2; b.hits.clear(); if (c.t > 0) w.shake = Math.max(w.shake, 4); }
    return true;
  }
  // round 14 (lane L; rooms that dragged on): a troll that gets nowhere (wedged in a gap too narrow for it, or walking
  // after a boulder it can't get to) lets it be: it rolls it at its mark, or leaves it where it lies, and fights
  // bare-handed a while before it goes for it again. Held in front of a wedged troll, the boulder plugged the way for
  // everyone, and the troll stood there with it for minutes.
  const jam = u.bJam || (u.bJam = { x: u.x, y: u.y, t: 0 });
  if (dist(u.x, u.y, jam.x, jam.y) > 40) { jam.x = u.x; jam.y = u.y; jam.t = 0; }
  if (u.bouldRest > 0) { u.bouldRest -= dt; if (!b.held) return false; }
  if (!b.held) { // go and get it (the elite calls it back to itself)
    if (u.def.rock && u.elite && b.vx * b.vx + b.vy * b.vy < 900 && due(u, 'recall', dt, 1)) {
      again(u, 'recall', 1.5); const a = angleTo(b.x, b.y, u.x, u.y); b.vx = Math.cos(a) * 300; b.vy = Math.sin(a) * 300; b.recalled = true;
    }
    if (dist(u.x, u.y, b.x, b.y) < u.r + b.r + BOULDER_REACH && (b.vx * b.vx + b.vy * b.vy < 3600 || b.recalled)) { b.held = true; b.recalled = false; b.hits.clear(); setAnim(u, 'ability', 0.3); jam.t = 0; return false; } // (round 17: a boulder it called back is caught as it comes: it rolled on through the troll and away, back and forth)
    // round 17 (lane foes17): it can't get to it (round 14 left it be a while and came back to try again, so a boulder
    // in a gap too narrow for it, or behind its friends, kept it walking up to it and standing by it for good): it
    // tears a new one out of the floor where it stands, and the old one crumbles
    if ((jam.t += dt) > BOULDER_JAM) { jam.t = 0; startRip(w, u); return true; }
    const [gx, gy] = goalVec(w, u, b.x, b.y), [sx, sy] = steer(w, u, gx, gy);
    drive(u, sx, sy, u.def.speed * (u.moveMul || 1), dt);
    turnTo(u, angleTo(u.x, u.y, b.x, b.y), 3, dt);
    return true;
  }
  const t = targetOf(w, u);
  if (t && u.aggro && !u.chg && !(u.el && u.el.holdT > 0) && gapTo(u, t) > (u.def.range || 30) + 12) jam.t += dt; else jam.t = 0;
  if (jam.t > BOULDER_JAM && t) { // wedged with it: let it go at its mark (it rolls till something stops it)
    // (round 17, lane foes17: bare-handed a while only when it has no line to roll it down: with a hero up against the
    // boulder, or a clear way to them, this is its throw, and it goes straight for the boulder after it, as after any
    // throw; the rest had it standing by its boulder for six seconds, then picking it up and wedging again)
    const a = angleTo(u.x, u.y, t.x, t.y), atIt = dist(t.x, t.y, b.x, b.y) < b.r + t.r + 40;
    jam.t = 0; u.bouldRest = atIt || lineClear(w, b.x, b.y, t.x, t.y, b.r * 0.7) ? 0 : BOULDER_REST;
    beginHold(u, 0.45, a, () => { if (!u.bould) return; const bb = u.bould; bb.held = false; const s = u.def.rock ? 360 : 320; bb.vx = Math.cos(a) * s; bb.vy = Math.sin(a) * s; bb.hits.clear(); });
    setAnim(u, 'throw', 0.45);
    return true;
  }
  if (!t || !u.aggro || !due(u, 'boulder', dt, 2)) return false;
  const d = dist(u.x, u.y, t.x, t.y), off = Math.abs(wrapAngle(angleTo(u.x, u.y, t.x, t.y) - u.facing));
  // a hero pressed up against the boulder gets it rolled into them point blank (else the boulder kept them off for ever)
  const pressed = dist(t.x, t.y, b.x, b.y) < b.r + t.r + 24;
  if (!pressed && (d < 120 || d > 420 || off > 0.4 || !lineClear(w, b.x, b.y, t.x, t.y, b.r * 0.7))) { again(u, 'boulder', 0.3); return false; }
  again(u, 'boulder', 5, 7);
  const a = angleTo(u.x, u.y, t.x, t.y);
  if (u.def.rock && chance(0.4)) { // charge behind it
    const len = d + 80, sp = u.def.speed * 2.4;
    u.chg = { a, tell: 0.6, t: len / sp, sp };
    addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, hw: b.r + 8, t: 0.6, team: u.team, src: u, kind: 'bone' });
    setAnim(u, 'ability', 0.6 + len / sp);
  } else { // let it go: it rolls at them
    beginHold(u, 0.45, a, () => { if (!u.bould) return; const bb = u.bould; bb.held = false; const s = u.def.rock ? 360 : 320; bb.vx = Math.cos(a) * s; bb.vy = Math.sin(a) * s; bb.hits.clear(); });
    addDanger(w, { shape: 'line', x1: b.x, y1: b.y, x2: b.x + Math.cos(a) * 420, y2: b.y + Math.sin(a) * 420, hw: b.r + 6, t: 0.45, team: u.team, src: u, kind: 'bone' });
    setAnim(u, 'throw', 0.45);
  }
  return true;
}
// The stoop to tear a new boulder out of the floor (round 17, lane foes17): the old one crumbles where it lies; the
// troll stands over the spot in front of it, the floor cracking and heaving, and comes up with a new one in its fists.
function startRip(w, u) {
  const old = u.bould; if (old) dropBoulder(w, u);
  u.bould = undefined; u.ripT = BOULDER_RIP; u.bJam = null; u.bouldRest = 0;
  setAnim(u, 'ability', BOULDER_RIP); stand(u, 0);
}
function ripTick(w, u, dt) {
  stand(u, dt); u.ripT -= dt;
  const k = u.r * (1 + HOLD) + (u.def.boulderR || BOULDER_R) + 8, x = u.x + Math.cos(u.facing) * k, y = u.y + Math.sin(u.facing) * k;
  if (rand() < dt * 18) { const a = rand() * TAU, d = rrange(0, 34); w.particles.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, rise: 30, up: 0, life: 0.5, max: 0.5, size: rrange(4, 8), color: '#8C8270' }); }
  if (u.ripT <= 0) { u.ripT = 0; boulderOf(w, u); puff(w, x, y, '#9A9088', 16, 160, 7, 0.5); w.shake = Math.max(w.shake, 3); }
  return true;
}
function rollBoulder(w, u, b, dt) {
  const sp = Math.hypot(b.vx, b.vy);
  if (sp < 4) { b.vx = b.vy = 0; return; }
  const k = Math.exp(-(b.recalled ? 0.4 : 0.9) * dt); b.vx *= k; b.vy *= k; // it slows as it goes
  const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
  const wall = nx < b.r || ny < b.r || nx > w.W - b.r || ny > w.H - b.r || w.walls.some((r) => nx > r.x - b.r && nx < r.x + r.w + b.r && ny > r.y - b.r && ny < r.y + r.h + b.r)
    || w.pillars.some((p) => p !== b && dist(nx, ny, p.x, p.y) < p.r + b.r);
  if (wall) { b.vx *= -0.25; b.vy *= -0.25; puff(w, b.x, b.y, '#CDBFA6', 8, 120, 5, 0.4); w.shake = Math.max(w.shake, 3); b.hits.clear(); return; }
  b.x = nx; b.y = ny;
  if (rand() < dt * 10) w.particles.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: 6, color: 'rgba(190,176,150,0.6)' });
  boulderHits(w, u, b, sp, Math.atan2(b.vy, b.vx));
}
function boulderHits(w, u, b, sp, a) {
  if (sp < 110) return;
  for (const h of opponents(w, u)) {
    if (b.hits.has(h) || dist(h.x, h.y, b.x, b.y) > b.r + h.r + 6) continue;
    b.hits.add(h);
    const side = Math.sign(Math.sin(angleTo(b.x, b.y, h.x, h.y) - a)) || 1;
    hurt(w, h, (u.def.rock ? 18 : 14) * u.dmgMul, u, { knock: 420, kAngle: a + side * 0.5, heavy: true, stagger: 50 });
  }
}

// ---------------------------------------------------------------- the Sewers
// The rat king: a knot of rats; as it's hurt, rats break loose (10 in it, one per tenth of its health), and three more
// when it dies: thirteen in all.
function ratKingBrain(w, u, dt) {
  const inside = 10, out = Math.floor((1 - u.hp / u.maxHp) * inside), gone = u.loosed || 0;
  if (out > gone && !w.stale) { u.loosed = out; looseRats(w, u, out - gone); }
  return false;
}
function looseRats(w, u, n) {
  for (let i = 0; i < n; i++) {
    if (crowd(w, u.team) >= 26) return;
    const a = rand() * TAU, s = spawn(w, chance(0.3) ? 'ratPlague' : 'rat', u.x + Math.cos(a) * u.r, u.y + Math.sin(a) * u.r, { mult: w.mult });
    s.kx = Math.cos(a) * 220; s.ky = Math.sin(a) * 220; s.aggro = true; s.minion = true; s.calledBy = u;
  }
  puff(w, u.x, u.y, '#9C8676', 6 + n * 2, 120, 5, 0.4);
}
// The sludge slime: twice as fast while burning, and dying burning it leaves no slimes (u.noSplit) but a burning patch
// of oil; otherwise the oil is left to light.
function sludgeBrain(w, u, dt) {
  const burning = u.st.burn > 8;
  u.noSplit = burning;
  if (burning) { addBuff(u, { id: 'sludgeburn', dur: 0.3, move: 2 }); if (rand() < dt * 10) flames(w, u.x, u.y, 1, u.vr * 0.6, 70); }
  return false;
}
function sludgeDeath(w, u) {
  const burning = u.st.burn > 8 || u.noSplit;
  w.hazards.push({ type: burning ? 'fire' : 'oil', x: u.x, y: u.y, r: 52, t: burning ? 5 : 14, max: burning ? 5 : 14 });
  if (burning) flames(w, u.x, u.y, 10, 30, 90);
}
// Croc: two axes (its attack), and a bite that holds and drags the hero (an ability). It hits wet heroes harder.
const WET_JAWS = { dealt(w, u, t, amt) { return amt * (1 + 0.6 * fillOf(t, 'wet')); } };
function crocBrain(w, u, dt) {
  if (!u.trinketHooks || !u.trinketHooks.includes(WET_JAWS)) u.trinketHooks = [...(u.trinketHooks || []), WET_JAWS];
  const g = u.drag;
  if (g) { // backing off with the hero in its jaws
    g.t -= dt;
    const h = g.who;
    if (!alive(h) || g.t <= 0 || Math.hypot(h.kx, h.ky) > 260) { u.drag = null; u.atkT = Math.max(u.atkT, 0.6); return false; }
    const a = g.a + Math.PI; u.dvx = Math.cos(a) * u.def.speed * 0.7; u.dvy = Math.sin(a) * u.def.speed * 0.7; u.mvA = a; u.spd = u.def.speed * 0.7; u.facing = g.a;
    h.x = u.x + Math.cos(g.a) * (u.r + h.r + 2); h.y = u.y + Math.sin(g.a) * (u.r + h.r + 2); h.rootT = Math.max(h.rootT || 0, 0.15);
    if ((g.tick -= dt) <= 0) { g.tick = 0.4; hurt(w, h, 4 * u.dmgMul, u, { noDodge: true, wet: u.elite ? 18 : 0 }); }
    return true;
  }
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'bite', dt, 3) || gapTo(u, t) > 24) return false;
  again(u, 'bite', 7, 9);
  const a = angleTo(u.x, u.y, t.x, t.y);
  beginHold(u, 0.4, a, () => { if (!alive(t) || gapTo(u, t) > 40) return; hurt(w, t, 14 * u.dmgMul, u, { knock: 0, wet: u.elite ? 40 : 0 }); u.drag = { who: t, a: angleTo(u.x, u.y, t.x, t.y), t: 1.4, tick: 0.4 }; });
  setAnim(u, 'ability', 0.5);
  return true;
}
// Crabs: they come in on wide circles (about 80% round, 20% in), always facing their mark, quick; close up, they pinch
// (the plain attack). The blue one shoots slow bubbles that soak, the green one poison bubbles, two at a time.
function crabBrain(w, u, dt) {
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  if (rushTick(w, u, dt)) return true;
  if (u.def.bubbles) every(w, u, dt, 'bub', 2.6, 3.4, 320, (tt) => bubbles(w, u, tt));
  const g = gapTo(u, t);
  if (g < 34 || u.act) return false; // close enough: pinch
  const a = angleTo(u.x, u.y, t.x, t.y), side = u.crabSide || (u.crabSide = chance(0.5) ? 1 : -1);
  if (u.stuckT > 0.6) u.crabSide = -side;
  const dx = Math.cos(a) * 0.2 + Math.cos(a + side * Math.PI / 2) * 0.8, dy = Math.sin(a) * 0.2 + Math.sin(a + side * Math.PI / 2) * 0.8;
  const [sx, sy] = steer(w, u, dx * 100, dy * 100);
  drive(u, sx, sy, u.def.speed * (u.moveMul || 1) * (u.staleBoost ? 1.3 : 1), dt);
  const mv = Math.hypot(u.x - (u.cx ?? u.x), u.y - (u.cy ?? u.y)); u.cx = u.x; u.cy = u.y; u.stuckT = mv < 20 * dt ? (u.stuckT || 0) + dt : 0;
  u.facing = wrapAngle(u.facing + clamp(wrapAngle(a - u.facing), -8 * dt, 8 * dt)); // always facing it
  return true;
}
function bubbles(w, u, t) {
  const n = u.def.bubbles.n, a = angleTo(u.x, u.y, t.x, t.y);
  setAnim(u, 'cast', 0.35);
  for (let i = 0; i < n; i++) later(w, u.x, u.y, 0.01 + i * 0.25, () => { if (!alive(u)) return;
    shoot(w, u, angleTo(u.x, u.y, t.x, t.y) + rrange(-0.06, 0.06), { kind: 'water', speed: 150, dmg: 4, r: 10, life: 2.4, hitO: { knock: 40, ...u.def.bubbles.hit },
      onHit: (w2, p) => puff(w2, p.x, p.y, u.def.bubbles.color, 8, 70, 5, 0.4) }); }, 4);
}
// Leeches. The blood leech latches on, drinks a few seconds, drops off and spits the blood back as shots, then again.
// The brain leech latches on and turns its host against its friends for a while (team swapped; the host's allies'
// blows on it go to the leech instead, and a hard knock throws the leech off).
function latchTo(w, u, h) { u.host = h; u.latchT = 0; u.mass = 0.05; }
function unlatch(w, u) {
  const h = u.host; u.host = null; u.mass = u.def.mass;
  if (h && h.charmed === u) { if (h.flipKind === 'leech') restoreSide(w, h); h.charmed = null; h.charmCd = 6; fx(w, { type: 'ring', x: h.x, y: h.y, r: h.r * 1.6, color: '#F2A0C8', max: 0.4 }); }
  if (h) { const a = rand() * TAU; u.x = h.x + Math.cos(a) * (h.r + u.r + 6); u.y = h.y + Math.sin(a) * (h.r + u.r + 6); u.kx = Math.cos(a) * 160; u.ky = Math.sin(a) * 160; }
  u.offT = rrange(2.5, 3.5);
}
function leechRide(w, u, dt) { // stuck to the host's back; true while on
  const h = u.host;
  if (!h) return false;
  if (!alive(h) || Math.hypot(h.kx, h.ky) > 240) { unlatch(w, u); return false; }
  const b = h.facing + Math.PI; u.x = h.x + Math.cos(b) * (h.r * 0.6); u.y = h.y + Math.sin(b) * (h.r * 0.6); u.vx = u.vy = u.kx = u.ky = 0; u.dvx = u.dvy = 0; u.spd = 0; u.facing = h.facing;
  u.latchT += dt;
  return true;
}
function bloodLeechBrain(w, u, dt) {
  if (leechRide(w, u, dt)) {
    if ((u.sipT = (u.sipT || 0) - dt) <= 0) { u.sipT = 0.5; const got = hurt(w, u.host, 3 * u.dmgMul, u, { dot: true, color: '#C8453D' }); heal(w, u, got, u); u.blood = (u.blood || 0) + 1; }
    if (u.latchT > 3) { const h = u.host; unlatch(w, u); spit(w, u, h); }
    return true;
  }
  return leechHop(w, u, dt, false);
}
function spit(w, u, h) {
  const n = Math.min(u.elite ? 6 : 3, Math.max(2, u.blood || 0)); u.blood = 0;
  const a = h ? angleTo(u.x, u.y, h.x, h.y) : u.facing;
  for (let i = 0; i < n; i++) later(w, u.x, u.y, 0.25 + i * 0.18, () => { if (!alive(u)) return; const t = targetOf(w, u) || h; if (!t || !alive(t)) return;
    shoot(w, u, angleTo(u.x, u.y, t.x, t.y) + rrange(-0.1, 0.1), { kind: 'bolt', color: '#C8453D', speed: 300, dmg: 5, r: 7, life: 1.4, hitO: { knock: 40 } }); }, 4);
}
function brainLeechBrain(w, u, dt) {
  if (leechRide(w, u, dt)) {
    const h = u.host, others = w.units.filter((o) => o !== h && alive(o) && !o.summon && (o.team === 'hero' || o.trueTeam === 'hero') && o.team !== 'enemy');
    if (u.latchT > (u.elite ? 7 : 5) || !others.length) unlatch(w, u); // never the last one standing
    else if (h.charmed === u) { h.target = null; }
    return true;
  }
  return leechHop(w, u, dt, true);
}
function leechHop(w, u, dt, charm) {
  if (u.offT > 0) { u.offT -= dt; return false; }
  const t = targetOf(w, u); if (!t || !u.aggro || t.summon || !(t.team === 'hero') || u.act) return false;
  if (charm) { // only on a hero that isn't the last one up, and not one just let go
    const up = w.units.filter((o) => o.team === 'hero' && alive(o) && !o.summon).length;
    if (up < 2 || t.charmCd > 0 || t.charmed || t.trueTeam) return false;
  }
  if (gapTo(u, t) > 12) return false;
  latchTo(w, u, t);
  if (charm) { turnSide(w, t, u.team, 'leech', u); t.charmed = u; fx(w, { type: 'ring', x: t.x, y: t.y, r: t.r * 1.6, color: '#F2A0C8', max: 0.5 }); }
  puff(w, t.x, t.y, charm ? '#F2A0C8' : '#C8453D', 8, 70, 5, 0.4);
  return true;
}

// ---------------------------------------------------------------- the Crypt
// The golden skeleton: golden bones all round it that home in on heroes and go through them, hitting 1.5x as hard.
function goldenBones(w, u, n) {
  const a0 = rand() * TAU, bones = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + i / n * TAU;
    const p = { kind: 'bone', color: '#F2C84A', x: u.x + Math.cos(a) * (u.r + 30), y: u.y + Math.sin(a) * (u.r + 30), vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, r: 8, team: u.team, owner: u,
      dmg: u.def.dmg * 1.5 * u.dmgMul, o: { knock: 80 }, life: 3.2, a, hitSet: new Set(), pierce: 3, home: true };
    w.projectiles.push(p); bones.push(p);
  }
  (u.bones || (u.bones = [])).push(...bones);
  setAnim(u, 'cast', 0.5);
}
function steerBones(w, u, dt) {
  if (!u.bones) return;
  u.bones = u.bones.filter((p) => p.life > 0);
  for (const p of u.bones) {
    let best = null, bd = Infinity; for (const h of opponents(w, u)) { if (p.hitSet.has(h)) continue; const d = dist(p.x, p.y, h.x, h.y); if (d < bd) { bd = d; best = h; } }
    const sp = Math.min(340, Math.hypot(p.vx, p.vy) + 260 * dt);
    let a = Math.atan2(p.vy, p.vx); if (best) a += clamp(wrapAngle(angleTo(p.x, p.y, best.x, best.y) - a), -3 * dt, 3 * dt);
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.a = a;
  }
}
function goldenBrain(w, u, dt) {
  if (!u.goldOn) { u.goldOn = true; addBuff(u, { id: 'gilded', dur: 1e9, statusImmune: true }); }
  steerBones(w, u, dt);
  if (u.aggro && due(u, 'bones', dt, 3) && opponents(w, u).some((h) => dist(h.x, h.y, u.x, u.y) < 420)) { again(u, 'bones', u.elite ? 5 : 8, u.elite ? 6.5 : 10); goldenBones(w, u, u.elite ? 8 : 5); }
  return false;
}
// The harrowing skeleton: falls, then gets up again once, with a burst of curse round it.
function harrowDeath(w, u) {
  if (u.harrowed) return;
  const { x, y } = u, elite = u.elite;
  later(w, x, y, 2.2, () => {
    const s = spawn(w, u.kind, x, y, { mult: w.mult }); s.harrowed = true; s.aggro = true; s.hp = s.maxHp * 0.6; s.minion = u.minion;
    if (elite) { s.elite = true; s.look = u.look; s.maxHp = u.maxHp; s.hp = u.maxHp * 0.6; s.dmgMul = u.dmgMul; s.r = u.r; s.vr = u.vr; }
    fx(w, { type: 'ring', x, y, r: 100, color: '#9A5CC8', max: 0.5 });
    for (const h of opponents(w, s)) if (dist(h.x, h.y, x, y) < 100 + h.r) hurt(w, h, 6 * s.dmgMul, s, { curse: elite ? 50 : 35, knock: 160 });
    puff(w, x, y, '#5A2A80', 16, 140, 6, 0.6);
  }, 30);
}

// ---------------------------------------------------------------- the kinds
const GOB = 'goblin';
export const FOES9 = {
  // ---- the Warren
  mouse: { variantOf: 'rat', name: 'Mouse', light: 0.12, sat: 0.7, size: 0.8, hp: 12, dmg: 3, xp: 3, ratMove: true },
  dynamouse: { variantOf: 'rat', name: 'Dynamite Mouse', hue: -10, light: 0.04, sat: 1.2, size: 0.85, hp: 12, dmg: 0, atkCd: 999, xp: 4, ratMove: true,
    brain: (w, u, dt) => fuseBrain(w, u, dt, { fuse: 0.9, r: 70 }), onDeath: (w, u) => blowUp(w, u, { r: 70, dmg: 14 }) },
  goblinSpear: { variantOf: GOB, name: 'Spear Goblin', hue: 25, light: -0.04, role: 'ranged', range: 220, keep: 150, atkCd: 999, xp: 6,
    brain: (w, u, dt) => { every(w, u, dt, 'spear', 2.4, 3.2, 300, (t) => { const a = angleTo(u.x, u.y, t.x, t.y); boomSpear(w, u, a); if (u.elite) { boomSpear(w, u, a - 0.25); boomSpear(w, u, a + 0.25); } }); return false; } },
  goblinBomber: { variantOf: GOB, name: 'Goblin Bomber', hue: -110, sat: 1.1, role: 'ranged', range: 260, keep: 200, atkCd: 999, xp: 7,
    brain: (w, u, dt) => { every(w, u, dt, 'bomb', 3, 4.2, 360, (t) => { const p = lead(t, 0.5); fuseBomb(w, u, p.x, p.y); if (u.elite) for (const da of [-1, 1]) fuseBomb(w, u, p.x + da * 90, p.y + rrange(-60, 60), { fuse: 1.2 }); }); return false; } },
  goblinSuicide: { variantOf: GOB, name: 'Suicide Bomber', hue: -150, sat: 0.9, light: -0.08, hp: 26, speed: 104, atkCd: 999, xp: 7, ability: null,
    brain: (w, u, dt) => fuseBrain(w, u, dt, { fuse: 1.1, r: u.elite ? 120 : 95 }), onDeath: (w, u) => blowUp(w, u, { r: u.elite ? 120 : 95, dmg: 26, fire: u.elite }) },
  drummer: { variantOf: GOB, name: 'Drummer', hue: -40, sat: 0.8, light: 0.05, role: 'ranged', range: 200, keep: 230, atkCd: 999, hp: 30, xp: 8, ability: null, brain: drumBrain },
  wolfRider: { team: 'enemy', name: 'Wolf Rider', art: variantUrl('art/enemies/wolf.svg', { hue: 18, sat: 1.2, light: -0.1 }), headR: 34, r: 30, vr: 22, turn: 5, accel: 320, face: 5, mass: 1.8,
    hp: 64, speed: 78, role: 'melee', range: 40, atkCd: 1.2, windup: 0.25, dmg: 9, knock: 160, arc: 0.9, temp: 0.4, commit: 0.8, xp: 16, coins: [3, 6], attackAnim: 'thrust',
    beast: true, brain: riderBrain,
    onDeath: (w, u) => { const s = spawn(w, 'goblinSpear', u.x, u.y, { mult: w.mult }); s.aggro = true; s.minion = u.minion; s.kx = u.kx; s.ky = u.ky; if (u.elite) { s.elite = true; s.look = u.look; } } },
  frostShaman: { variantOf: 'orcShaman', name: 'Frost Shaman', hue: 150, sat: 0.9, light: 0.04, res: { chill: 0.2, burn: 1.3 }, brain: frostShamanBrain },
  iceTotem: { team: 'enemy', name: 'Ice Totem', art: variantUrl('art/enemies/placeholder/snowman.svg', { light: 0.05, sat: 1.4, hue: 10 }), headR: 60, r: 20, vr: 16, turn: 0, accel: 0, face: 0,
    mass: 99, hp: 26, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0, temp: 0.2, commit: 2, xp: 2, coins: [0, 0], cost: 99, noCorpse: true, goo: '#DFF6FF', noElite: true,
    res: { chill: 0, poison: 0 }, brain: totemBrain },
  rockTroll: { variantOf: 'troll', name: 'Rock Troll', hue: 0, sat: 0.25, light: -0.02, rock: true, turn: 1.3, face: 1.6, hp: 190, xp: 34,
    brain: boulderBrain, onDeath: (w, u) => dropBoulder(w, u) },
  // ---- the Sewers
  ratPlague: { variantOf: 'rat', name: 'Plague Rat', hue: 70, sat: 1.3, light: -0.04, poison: 14, xp: 5, ratMove: true, res: { poison: 0 },
    onDeath: (w, u) => w.hazards.push({ type: 'gas', x: u.x, y: u.y, r: 54, t: 4, max: 4 }) },
  ratKing: { variantOf: 'rat', name: 'Rat King', art: 'art/enemies/rat-king.svg', headR: 66, size: 2.3, hp: 100, speed: 54, dmg: 9, knock: 140, arc: 2, role: 'melee', ability: null, xp: 26, coins: [5, 10],
    pack: null, ratMove: false, mass: 2.4, brain: ratKingBrain, onDeath: (w, u) => { u.hp = 0; looseRats(w, u, 3); } },
  slimeSludge: { variantOf: 'slime', name: 'Sludge Slime', hue: -150, sat: 0.55, light: -0.2, hp: 58, xp: 10, goo: '#5A5A30', res: { burn: 1.4 },
    brain: sludgeBrain, onDeath: sludgeDeath },
  croc: { team: 'enemy', name: 'Croc', art: 'art/enemies/croc.svg', headR: 56, r: 36, vr: 27, turn: 3.4, accel: 200, face: 3.4, mass: 2.2, hp: 110, speed: 54, role: 'melee', range: 22,
    atkCd: 1.0, windup: 0.25, dmg: 9, knock: 120, arc: 1.8, temp: 0.3, commit: 1, xp: 22, coins: [4, 8], attackAnim: 'swing', res: { burn: 0.8, chill: 1.3 }, brain: crocBrain },
  crab: { team: 'enemy', name: 'Sewer Crab', art: 'art/enemies/crab.svg', headR: 57, r: 24, vr: 19, turn: 8,
    accel: 460, face: 8, mass: 1.2, hp: 38, speed: 78, role: 'melee', range: 14, atkCd: 0.9, windup: 0.15, dmg: 7, knock: 90, arc: 1.4, shield: 0.5, temp: 0.4, commit: 0.8,
    xp: 9, coins: [2, 4], attackAnim: 'thrust', brain: crabBrain },
  crabBlue: { variantOf: 'crab', name: 'Blue Crab', hue: 180, xp: 10, bubbles: { n: 1, color: '#8FD3F0', hit: { wet: 40 } } },
  crabGreen: { variantOf: 'crab', name: 'Green Crab', hue: 90, xp: 11, bubbles: { n: 2, color: '#9BCB3C', hit: { poison: 22 } } },
  leechBlood: { variantOf: 'slimeSmall', name: 'Blood Leech', hue: 145, sat: 1.4, light: -0.1, hp: 22, speed: 92, dmg: 3, atkCd: 999, xp: 6, hops: null, noCorpse: false, goo: '#C8453D',
    role: 'melee', range: 6, brain: bloodLeechBrain },
  leechBrain: { variantOf: 'slimeSmall', name: 'Brain Leech', hue: 105, sat: 1.1, light: 0.06, hp: 24, speed: 86, dmg: 0, atkCd: 999, xp: 8, hops: null, noCorpse: false, goo: '#F2A0C8',
    role: 'melee', range: 6, brain: brainLeechBrain },
  // ---- the Crypt
  rattlerGold: { variantOf: 'rattler', name: 'Golden Skeleton', hue: 28, sat: 2.2, light: 0.04, hp: 85, coins: [4, 10], xp: 16,
    res: { poison: 0, burn: 0, chill: 0, wet: 0, shock: 0, stagger: 0, radiance: 0, curse: 0, entangle: 0 }, brain: goldenBrain },
  rattlerHarrow: { variantOf: 'rattler', name: 'Harrowing Skeleton', hue: 250, sat: 0.6, light: -0.12, xp: 13, onDeath: harrowDeath },
};

// ---------------------------------------------------------------- their elite moves
Object.assign(ELITES, {
  mouse: { tick() { return false; } },          // (as rats: the elite rat's plague trail via eliteAs would be odd on a pet) none
  dynamouse: { tick() { return false; } },
  goblinSpear: { tick() { return false; } },    // three spears at once (its brain reads u.elite)
  goblinBomber: { tick() { return false; } },   // three bombs at once
  goblinSuicide: { tick() { return false; } },  // a bigger blast that leaves fire
  // Drummer: a beat that thumps everyone close back.
  drummer: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    if (!due(u, 'thump', dt, 3) || !opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 130 + h.r)) return false;
    again(u, 'thump', 5, 7); around(w, u, { r: 140, tell: 0.6, kind: 'bone', hit: { dmg: 5, knock: 340, stagger: 35 } }); return true;
  } },
  wolfRider: { tick() { return false; } },      // charges more often, and its goblin gets up elite too
  // Frost shaman: a blizzard where the party stands.
  frostShaman: { tick(w, u, dt) { every(w, u, dt, 'blizz', 5, 7, 420, (t) => lob(w, u, t.x, t.y, { r: 90, tell: 1.0, proj: 'bolt', color: '#F4FBFF', pr: 12, kind: 'ice', dust: '#F4FBFF', hit: { dmg: 8, chill: 50 } })); return false; } },
  rockTroll: { tick() { return false; } },      // calls its boulder back, and it's 25% bigger (boulderOf / boulderBrain read u.elite)
  ratPlague: { tick(w, u, dt) { return ELITES.rat.tick(w, u, dt); } }, // a trail of sickly gas, like an elite rat
  // Rat king: sheds a ring of rats at once when it's hurt badly.
  ratKing: { tick(w, u, dt) { if (u.hp < u.maxHp * 0.5 && !u.burst) { u.burst = true; looseRats(w, u, 4); } return false; } },
  // Sludge slime: lobs a glob of oil.
  slimeSludge: { tick(w, u, dt) { every(w, u, dt, 'oil', 4, 5.5, 380, (t) => lob(w, u, t.x, t.y, { r: 50, tell: 0.9, proj: 'water', color: '#5A5A30', kind: 'poison', dust: '#5A5A30', hit: { dmg: 4 },
    land: (w2, z) => { if (!w2.hazards.some((h) => (h.type === 'oil' || h.type === 'fire') && dist(h.x, h.y, z.x, z.y) < 40)) w2.hazards.push({ type: 'oil', x: z.x, y: z.y, r: 46, t: 12, max: 12 }); } })); return false; } },
  croc: { tick() { return false; } },           // its bite and its drag soak (crocBrain reads u.elite)
  // Crab: snaps both claws: a short lunge that staggers.
  crab: { tick(w, u, dt) {
    const t = targetOf(w, u); if (!t || !due(u, 'snap', dt, 2.5)) return false;
    const g = gapTo(u, t); if (g < 30 || g > 150 || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return false;
    again(u, 'snap', 4, 5.5); rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 20, { tell: 0.3, dmg: 9, knock: 180, status: { stagger: 40 } }); return true;
  } },
  leechBlood: { tick() { return false; } },     // spits up to six shots (spit reads u.elite)
  leechBrain: { tick() { return false; } },     // holds its host longer
  rattlerGold: { tick() { return false; } },    // more bones, more often (goldenBrain reads u.elite)
  rattlerHarrow: { tick(w, u, dt) { // a cold, cursing aura while it walks
    if (!u.aggro || !due(u, 'aura', dt, 1)) return false; again(u, 'aura', 1);
    for (const h of opponents(w, u)) if (dist(h.x, h.y, u.x, u.y) < 110 + h.r) addStatus(w, h, 'curse', 8, u); return false;
  } },
});
