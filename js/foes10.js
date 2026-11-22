// Round 10, lane R: the approved Frost Hollow, Ember Deep and Gilded Spire kinds (deck roster2; the designer's words in
// docs/riffle-log/2026-11-21-round9.txt), each with a base kit and an elite move (ELITES, elites.js; a major adds one
// of MAJOR_MOVES on top). Variants are recolours of their base's art (recolor.js); new kinds wear PLACEHOLDER art (a
// recoloured kind) listed in docs/ART-NEEDED.md.
//   The Frost Hollow: the frost wolf (bite chills; a pack freezes a hero solid), the ice slime ("No leaves ice trails ...
//     When this slime [hops] it will spawn a small cold aura around itself where it 'lands'"; shatters into shards), the
//     frost spider (webs chill), the yeti ("the same shape and fighting style as trolls. It instead rolls its 'boulders'
//     as large snowballs it always throws, can fight melee too hits stagger, snowballs heavy cold. No roar"), the icicle
//     wraith ("Make this the wraith. Cold ghost that spawns icicles"), and the frost spirit (deck notes). "Ogre no".
//   The Ember Deep: the fire spider (burns, spits fireballs), the hellhound (fire trail, a short cone of flame), the
//     cinder bat (dives at a hero and explodes), the fire spirit, and the Pit Lord tuned up (a whip of fire, rifts that
//     spit imps).
//   The Gilded Spire: the fallen angel (curses instead of radiance), the sun blade (spins through the party in straight
//     lines; can't be staggered), the choir sprite (its song heals; a stagger silences it), the golem and the gilded
//     golem (shots from the front bounce back), the healing and ward spirits, and the Twin Heralds ("They have abilities
//     that separate them").
// Out (RETHINK / IDK with no replacement): the Brood Queen, Old Frost (as a mini), the Winter Queen (lane B), the magma
// golem, the ash wraith, the Dragonborn Champion, the Archon, the Hollow Saint.
import { alive, opponents, allies, hurt, puff, sparks, flames, addStatus, setAnim, fx, addBuff, explode, spawn, heal, kill, addDanger, drive, steer, goalVec } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { ELITES, lob, cone, line, around, rush, rushTick, summon, shoot, blink, openSpot, pounce, hold, beginHold, due, again, targetOf, gapTo, crowd, stand, turnTo, later } from './elites.js';
import { slam, courtFalls } from './enemies.js';
import { FOES } from './foes.js';
import { wolfBrain } from './wildwood.js';
import { variantUrl } from './recolor.js';
import { sees, lead, every, spiritBrain, spiritDeath, golemBrain, blast, dropOn } from './families.js';

const ART = (f) => `art/enemies/placeholder/${f}.svg`;
const FOE = { team: 'enemy', turn: 4, accel: 220, face: 4, mass: 1.2, temp: 0.35, commit: 0.9 };
const firePatch = (w, x, y, r = 40, t = 4) => { if (!w.hazards.some((h) => h.type === 'fire' && dist(h.x, h.y, x, y) < r)) w.hazards.push({ type: 'fire', x, y, r, t, max: t }); };
const coldPatch = (w, x, y, r, t) => { if (!w.hazards.some((h) => h.type === 'mist' && dist(h.x, h.y, x, y) < r * 0.8)) w.hazards.push({ type: 'mist', x, y, r, t, max: t }); };
function shards(w, u, n, o = {}) { // ice flung out all round (from o.x, o.y if given)
  const a0 = rand() * TAU, x = o.x ?? u.x, y = o.y ?? u.y, sp = o.speed || 300;
  for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU;
    w.projectiles.push({ kind: 'shard', x: x + Math.cos(a) * 20, y: y + Math.sin(a) * 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 7, team: u.team, owner: u, dmg: (o.dmg || 4) * u.dmgMul, o: { knock: 70, chill: o.chill || 16 }, life: o.life || 0.7, a }); }
  puff(w, x, y, '#DFF6FF', 14, 130, 6, 0.5);
}
function fireball(w, u, a, o = {}) {
  shoot(w, u, a, { kind: 'fireball', speed: o.speed || 250, dmg: o.dmg || 4, r: 8, life: 1.6, hitO: { knock: 40 },
    onHit: (w2, p) => explode(w2, p.x, p.y, o.r || 36, (o.blast || 4) * u.dmgMul, { burn: o.burn || 22 }, u, '#FF8A3D') });
}

// ---------------------------------------------------------------- the Frost Hollow
// The yeti and its snowball. Round 13 (lane E; the designer on 0.12: "the biggest one was how the yeti moved with the
// snowball. The ball is its own entity. Should not move like it's nothing"). The ball is a heavy body of its own: a
// round obstacle in the room (w.pillars: its own hit circle; it blocks bodies and shots) with its own update (snowTick,
// run from a w.fx entry, so it rolls on whatever its yeti is doing, and after it falls):
//  - it rolls: what speed it is given it keeps, losing SNOW.fric a second, and it can't turn by itself; it grows as it
//    rolls (up to SNOW.grow times its packed size) and presses a track into the floor;
//  - the yeti pushes it: it walks round behind the ball (solid to it then), leans in with both hands and pushes it along
//    the line from its own middle through the ball's, slowly (SNOW.push of its pace, starting slower still) and turning
//    slowly, so to steer the ball it has to work its way round it;
//  - the heave: with a hero ahead of the ball and a clear line, the line shows on the floor; the yeti runs behind the
//    ball building speed, then heaves it off at SNOW.heave. The ball bowls through whoever is in its way (heavy cold, a
//    big shove; a body slows it and turns it a little), bursts on a wall or pillar it hits hard, and otherwise thuds to a
//    stop against it or rolls to rest out in the room, where the yeti walks over to it again;
//  - shots and blasts knock it off course and chip it; broken or burst, it's gone, and the yeti fights with its fists
//    until it packs a new one where it stands: a long stoop over a growing ball, knocked apart by a hard enough blow;
//  - a hero beside or behind it while it pushes: it leaves the ball where it is and fights bare-handed a while.
// The elite's ball is bigger and bursts into ice.
const SNOW = { r: 0.62, elite: 1.15, grow: 1.3, growK: 0.0011, push: 0.55, turn: 1.2, fric: 200, heave: 400, hurtSp: 130, burstSp: 220, pack: 1.4, reach: 0.82,
  hp: 50, dmg: 25, track: 7 };
// pathClear (path.js) for the ball: walls and the other round things, not itself
function pathClear(w, ax, ay, bx, by, pad, self) {
  if (!lineClear(w, ax, ay, bx, by, pad)) return false;
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
  for (const p of w.pillars) { if (p === self) continue; const k = clamp(((p.x - ax) * dx + (p.y - ay) * dy) / L2, 0, 1), qx = ax + dx * k - p.x, qy = ay + dy * k - p.y; if (qx * qx + qy * qy < (p.r + pad) ** 2) return false; }
  return true;
}
// A line on the floor that only warns, until the ball is let go: the ball is the blow, so nothing strikes along the line
// when it runs out (a cancelled zone: no strike drawn or heard, no flash).
const WARN = { cancelled: true };
const snowOf = (w, u) => (u.snow && w.pillars.includes(u.snow) ? u.snow : (u.snow = null));
const handsOn = (u, b) => u.r * SNOW.reach + b.r; // the ball against its hands (just inside its collider: sim.js ownBoulder)
// Which way the ball has to go to reach (tx, ty): straight, or round the walls and rocks (the path finder, asked for a
// body the ball's size; the ball itself taken out of the room while it asks)
function ballWay(w, b, tx, ty) {
  const nav = b.nav || (b.nav = { path: null, pathT: 0, pathGoal: null });
  nav.x = b.x; nav.y = b.y; nav.r = b.r;
  const i = w.pillars.indexOf(b); if (i >= 0) w.pillars.splice(i, 1);
  try { const [gx, gy] = goalVec(w, nav, tx, ty); return Math.atan2(gy, gx); } finally { if (i >= 0) w.pillars.splice(i, 0, b); }
}
function newSnow(w, u, r0) {
  const p = { x: u.x + Math.cos(u.facing) * (u.r * SNOW.reach + 4), y: u.y + Math.sin(u.facing) * (u.r * SNOW.reach + 4) };
  const hp = Math.round(SNOW.hp * (r0 / 26) ** 2 * (w.mult || 1) ** 0.7);
  const b = { x: p.x, y: p.y, r: 4, r0, snowball: true, owner: u, team: u.team, vx: 0, vy: 0, roll: 0, rollA: u.facing, held: true, packing: true, big: !!u.elite,
    hp, maxHp: hp, hits: new Map(), onShot: snowShot, seen: new Set(), lastX: p.x, lastY: p.y };
  w.pillars.push(b); u.snow = b;
  b.drv = fx(w, { type: 'snowDrive', every: 1 / 60, max: 1e9, tick: () => snowTick(w, b, 1 / 60) });
  return b;
}
function dropSnow(w, b) { // gone (burst, broken, melted)
  const i = w.pillars.indexOf(b); if (i >= 0) w.pillars.splice(i, 1);
  if (b.drv) b.drv.max = b.drv.t;
  if (b.owner && b.owner.snow === b) b.owner.snow = null;
}
function burstSnow(w, b, loud = true) {
  dropSnow(w, b);
  const u = b.owner, by = u && alive(u) ? u : null;
  puff(w, b.x, b.y, '#F4FBFF', loud ? 22 : 12, loud ? 220 : 120, 8, 0.6);
  for (let i = 0; i < 8; i++) { const a = rand() * TAU, s = rrange(90, 220); w.particles.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.55, max: 0.55, size: rrange(5, 9) * b.r / 26, color: '#EEF7FF' }); }
  if (!loud) return;
  w.shake = Math.max(w.shake, 3);
  for (const h of opponents(w, b)) if (dist(h.x, h.y, b.x, b.y) < b.r + h.r + 40) addStatus(w, h, 'chill', 16, by);
  if (b.big && by) shards(w, by, 7, { x: b.x, y: b.y, dmg: 5, chill: 20 }); // (the elite's: into ice)
}
// A shot that hits the ball chips it (sim.js) and knocks it along the shot's way, more the smaller it is.
function snowShot(w, b, p) {
  const sp = Math.hypot(p.vx, p.vy) || 1, k = clamp((p.dmg || 4) * 7, 25, 110) * (26 / b.r) ** 2;
  if (!b.packing) { b.vx += p.vx / sp * k; b.vy += p.vy / sp * k; b.held = false; } // (in its maker's hands, it only chips)
  w.particles.push({ x: p.x, y: p.y, vx: -p.vx / sp * 60, vy: -p.vy / sp * 60, life: 0.35, max: 0.35, size: 5, color: '#FFFFFF' });
}
// The ball's own update: pushed, rolling, hitting, growing, leaving a track; and when its yeti is gone, it melts away.
function snowTick(w, b, dt) {
  if (!w.pillars.includes(b)) { if (b.drv) b.drv.max = b.drv.t; return; }
  const u = b.owner, up = u && alive(u);
  if (b.hitT > 0) b.hitT = Math.max(0, b.hitT - dt);
  if (b.hp <= 0) { burstSnow(w, b); return; }
  // blasts nearby throw it about (an explosion this frame: sim.js explode leaves a 'blast' telegraph)
  for (const t of w.telegraphs) if (t.type === 'blast' && !b.seen.has(t) && dist(t.x, t.y, b.x, b.y) < t.r + b.r) {
    b.seen.add(t); const a = angleTo(t.x, t.y, b.x, b.y); b.vx += Math.cos(a) * 160 * (26 / b.r); b.vy += Math.sin(a) * 160 * (26 / b.r); b.hp -= 8; b.held = false;
  }
  if (b.packing) return; // in the yeti's hands, still being made (yetiBrain)
  // pushed: the yeti's hands press into it, so it goes along the line from the yeti's middle through its own
  if (b.held && up) {
    const d = dist(u.x, u.y, b.x, b.y), want = handsOn(u, b);
    if (d < want && d > 0.01) {
      const nx = (b.x - u.x) / d, ny = (b.y - u.y) / d, vn = u.vx * nx + u.vy * ny, bn = b.vx * nx + b.vy * ny;
      b.x = u.x + nx * want; b.y = u.y + ny * want;
      if (bn < vn) { b.vx += nx * (vn - bn); b.vy += ny * (vn - bn); }
    }
  } else if (!up) b.held = false;
  let sp = Math.hypot(b.vx, b.vy);
  if (sp > 0) { const s2 = Math.max(0, sp - SNOW.fric * dt); b.vx *= s2 / sp; b.vy *= s2 / sp; sp = s2; }
  if (sp < 1) { b.vx = b.vy = 0; if (!up) { b.melt = (b.melt || 0) + dt; b.r = Math.max(2, b.r - b.r0 * dt / 3.5); if (b.r <= 3) { burstSnow(w, b, false); } } return; }
  const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
  // a wall, the room's edge or another obstacle: it bursts if it hits hard, else it stops against it (a small bounce)
  const blocked = nx < b.r || ny < b.r || nx > w.W - b.r || ny > w.H - b.r || w.walls.some((r) => nx > r.x - b.r && nx < r.x + r.w + b.r && ny > r.y - b.r && ny < r.y + r.h + b.r)
    || w.pillars.some((p) => p !== b && !p.painted && dist(nx, ny, p.x, p.y) < p.r + b.r);
  if (blocked) {
    if (sp > SNOW.burstSp && !b.held) { burstSnow(w, b); return; }
    if (sp > 60) { puff(w, b.x + b.vx / sp * b.r, b.y + b.vy / sp * b.r, '#F4FBFF', 6, 70, 5, 0.4); w.shake = Math.max(w.shake, 1.5); }
    b.vx *= -0.15; b.vy *= -0.15; b.hits.clear(); return;
  }
  const step = Math.hypot(nx - b.x, ny - b.y);
  b.x = nx; b.y = ny; b.roll += step / b.r; b.rollA = Math.atan2(b.vy, b.vx);
  if (b.r < b.r0 * SNOW.grow) b.r = Math.min(b.r0 * SNOW.grow, b.r + step * SNOW.growK * b.r0); // it picks up snow as it goes
  // its track, pressed into the floor (foe-draw.js draws w.snowTrack under everything)
  if (dist(b.x, b.y, b.lastX, b.lastY) > 9) {
    const tr = w.snowTrack || (w.snowTrack = []);
    tr.push({ x1: b.lastX, y1: b.lastY, x2: b.x, y2: b.y, r: b.r * 0.72, t: w.time }); b.lastX = b.x; b.lastY = b.y;
    while (tr.length && (tr.length > 260 || w.time - tr[0].t > SNOW.track)) tr.shift();
  }
  if (sp > 120 && rand() < dt * 30) { const s = rand() < 0.5 ? 1 : -1, a = b.rollA + Math.PI + s * 0.6; w.particles.push({ x: b.x - Math.cos(b.rollA) * b.r * 0.8 + Math.cos(a + s) * b.r * 0.6, y: b.y - Math.sin(b.rollA) * b.r * 0.8 + Math.sin(a + s) * b.r * 0.6, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50, life: 0.45, max: 0.45, size: rrange(3, 6), color: 'rgba(244,250,255,0.9)' }); }
  // bodies in its way: fast, it bowls them over (each once a run); it is slowed and turned a little by each
  if (sp < SNOW.hurtSp) return;
  for (const h of opponents(w, b)) {
    const d = dist(h.x, h.y, b.x, b.y); if (d > b.r + h.r + 2) continue;
    if ((b.hits.get(h) || -9) > w.time - 1) continue;
    b.hits.set(h, w.time);
    const a = b.rollA, side = Math.sign(Math.sin(angleTo(b.x, b.y, h.x, h.y) - a)) || 1, k = clamp(sp / 340, 0.5, 1.25) * (b.r / 26);
    hurt(w, h, SNOW.dmg * k * (up ? u.dmgMul : 1), up ? u : null, { knock: 260 + 160 * k, kAngle: a + side * 0.45, heavy: true, stagger: 45, chill: b.big ? 70 : 55 });
    puff(w, h.x, h.y, '#F4FBFF', 10, 140, 6, 0.45);
    // the body it hit: the ball loses a share of its speed (more for a heavy one) and glances off it
    const n = { x: (h.x - b.x) / (d || 1), y: (h.y - b.y) / (d || 1) }, into = b.vx * n.x + b.vy * n.y, m = clamp((h.mass || 1) / 6, 0.12, 0.6);
    if (into > 0) { b.vx -= n.x * into * (0.5 + m); b.vy -= n.y * into * (0.5 + m); }
    b.vx *= 1 - m * 0.5; b.vy *= 1 - m * 0.5;
  }
}
// Packing a new ball where it stands: a stoop over a growing ball. A hard blow (or a stun, a freeze, a shove) knocks
// it apart before it's done.
function packTick(w, u, Y, dt) {
  const b = snowOf(w, u);
  const skipped = w.time - Y.last > 0.12; Y.last = w.time; // it was stunned, frozen or asleep meanwhile (its brain didn't run)
  if (!b || b.hp <= 0 || skipped || u.hp < Y.hp0 - u.maxHp * 0.07 || Math.hypot(u.kx, u.ky) > 140) { // knocked apart
    if (b) { burstSnow(w, b, false); }
    Y.st = 'bare'; again(u, 'pack', 2, 3); u._force = null; u.lean = 0;
    textOf(w, u, 'knocked apart');
    return false;
  }
  Y.t += dt; stand(u, dt);
  const k = clamp(Y.t / (SNOW.pack * (u.elite ? 0.8 : 1)), 0, 1);
  b.r = 4 + (b.r0 - 4) * (1 - (1 - k) * (1 - k));
  const fr = u.r * SNOW.reach + b.r * 0.75; b.x = u.x + Math.cos(u.facing) * fr; b.y = u.y + Math.sin(u.facing) * fr;
  // stooped, its hands patting the snow round the ball
  const s = Math.sin(Y.t * 11), c = Math.cos(Y.t * 11);
  u.lean = 0.16; u._force = { 'arm-r': { dy: 4 + 7 * Math.max(0, s), r: 0.3 + 0.2 * s }, 'arm-l': { dy: 4 + 7 * Math.max(0, -s), r: -0.3 + 0.2 * c } };
  if ((Y.puffT = (Y.puffT || 0) - dt) <= 0) { Y.puffT = 0.16; w.particles.push({ x: b.x + rrange(-b.r, b.r), y: b.y + rrange(-b.r, b.r), vx: rrange(-40, 40), vy: rrange(-40, 40), life: 0.4, max: 0.4, size: rrange(3, 6), color: '#F4FBFF' }); }
  if (k >= 1) { b.packing = false; b.r = b.r0; b.vx = b.vy = 0; Y.st = 'ball'; puff(w, b.x, b.y, '#F4FBFF', 8, 70, 5, 0.4); }
  return true;
}
const textOf = (w, u, s) => {}; // (no words over the arena: show, don't tell)
function yetiBrain(w, u, dt) {
  const Y = u.yt || (u.yt = { st: 'bare', brawl: 0, last: 0, pushT: 0 });
  if (Y.st !== 'pack') { u._force = null; u.lean = 0; }
  if (hold(u, dt)) { Y.last = w.time; return true; }
  if (Y.st === 'pack') return packTick(w, u, Y, dt);
  Y.last = w.time;
  let b = snowOf(w, u);
  if (b && b.packing) { burstSnow(w, b, false); b = null; } // (a ball left half-made)
  const t = targetOf(w, u);
  // ---- no ball: fists, until it can stop to pack another
  if (!b) {
    Y.st = 'bare';
    if (w.stale || !u.aggro || u.anim || !due(u, 'pack', dt, 1)) return false;
    again(u, 'pack', 1.2, 2); // (the wait after the next one is lost)
    const r0 = Math.round(u.r * SNOW.r * (u.elite ? SNOW.elite : 1));
    newSnow(w, u, r0);
    Y.st = 'pack'; Y.t = 0; Y.hp0 = u.hp; Y.last = w.time; Y.puffT = 0;
    puff(w, u.x + Math.cos(u.facing) * u.r * 0.6, u.y + Math.sin(u.facing) * u.r * 0.6, '#F4FBFF', 8, 60, 5, 0.4);
    return true;
  }
  // ---- the heave under way: a tell, then a run behind the ball building speed, then it lets go
  const H = Y.heave;
  if (H) {
    const a = H.a;
    if (H.tell > 0) { // it shuffles round behind the ball onto the line, and crouches to drive
      H.tell -= dt; b.held = true;
      const want = handsOn(u, b) + 2, px = b.x - Math.cos(a) * want, py = b.y - Math.sin(a) * want, dd = dist(u.x, u.y, px, py);
      if (dd > 4) { const m = angleTo(u.x, u.y, px, py), sp = Math.min(dd / dt, u.def.speed * 2.2); u.dvx = Math.cos(m) * sp; u.dvy = Math.sin(m) * sp; u.mvA = m; u.spd = sp; } else stand(u, dt);
      turnTo(u, angleTo(u.x, u.y, b.x, b.y), 6, dt);
      u.lean = 0.2; u._force = { 'arm-r': { dy: 2, r: 0.18 }, 'arm-l': { dy: 2, r: -0.18 } }; // crouched behind it, about to drive
      return true;
    }
    H.t += dt; b.held = true;
    const sp = u.def.speed * (u.moveMul || 1) * (0.7 + 1.9 * clamp(H.t / H.run, 0, 1)); // building speed
    u.dvx = Math.cos(a) * sp; u.dvy = Math.sin(a) * sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = a; u.spd = sp; turnTo(u, a, 6, dt);
    u.lean = 0.24; const st = Math.sin(H.t * 16); u._force = { 'arm-r': { dy: 9 + 2 * st, r: 0.12 }, 'arm-l': { dy: 9 - 2 * st, r: -0.12 } };
    const ahead = !pathClear(w, b.x, b.y, b.x + Math.cos(a) * 30, b.y + Math.sin(a) * 30, b.r * 0.95, b);
    if (H.t >= H.run || ahead || dist(u.x, u.y, b.x, b.y) > handsOn(u, b) + 30) { // let go: the heave
      const go = SNOW.heave * (u.elite ? 1.1 : 1) * (ahead ? 0.6 : 1);
      b.held = false; b.vx = Math.cos(a) * go; b.vy = Math.sin(a) * go; b.hits.clear();
      Y.heave = null; Y.rest = 0.55; u.spd *= 0.3;
      setAnim(u, 'throw', 0.4); puff(w, b.x, b.y, '#F4FBFF', 10, 110, 6, 0.4);
    }
    return true;
  }
  if (Y.rest > 0) { Y.rest -= dt; stand(u, dt); u.lean = 0.1; u._force = { 'arm-r': { dy: 12 * Y.rest / 0.55, r: 0.1 }, 'arm-l': { dy: 12 * Y.rest / 0.55, r: -0.1 } }; return true; }
  // ---- fighting bare-handed beside its ball: a hero at its side or back while it pushes
  const opp = opponents(w, u);
  const flank = opp.find((h) => gapTo(u, h) < 22 && angleDiff(angleTo(u.x, u.y, h.x, h.y), angleTo(u.x, u.y, b.x, b.y)) > 0.9);
  Y.calm = (Y.calm || 0) - dt;
  if (flank && Y.brawl <= 0 && Y.calm <= 0 && !w.stale) { Y.brawl = rrange(2.5, 4); b.held = false; }
  if (Y.brawl > 0) { // (then back to the ball a while, whoever is at its back)
    Y.brawl -= dt; b.held = false; if (Y.brawl <= 0) Y.calm = rrange(4, 6);
    return false;
  }
  if (w.stale && !b.held && dist(u.x, u.y, b.x, b.y) > 160) return false; // a stand-off gone on too long: no fetching
  // its ball rolled off far, and the party is on it: it leaves that one to melt and packs another where it stands
  if (!b.held && dist(u.x, u.y, b.x, b.y) > 300 && opp.some((h) => dist(u.x, u.y, h.x, h.y) < 240)) { b.owner = null; u.snow = null; again(u, 'pack', 0.6, 1.2); return false; }
  if (!u.aggro) { b.held = false; return false; } // (the plain brain notices the party)
  // its own eyes while it works the ball (the plain brain, which picks targets, doesn't run meanwhile): the nearest
  // (the nearest to the ball, and better one it can roll the ball at without walking round it)
  if (due(u, 'look', dt, 0.2)) {
    again(u, 'look', 0.6);
    const ub = angleTo(u.x, u.y, b.x, b.y), cost = (h) => dist(b.x, b.y, h.x, h.y) + 150 * angleDiff(ub, angleTo(b.x, b.y, h.x, h.y));
    const n = opp.filter((h) => !h.ethereal).sort((p, q) => cost(p) - cost(q))[0];
    if (n && (!t || cost(n) < cost(t) - 80)) u.target = n;
  }
  if (!targetOf(w, u)) return false;
  const tg = targetOf(w, u);
  // ---- point blank: a hero pressed against the front of the ball gets it shoved into them
  const ba = angleTo(u.x, u.y, b.x, b.y), dB = dist(u.x, u.y, b.x, b.y), behind = dB < handsOn(u, b) + 14;
  const pressed = behind && opp.find((h) => dist(h.x, h.y, b.x, b.y) < b.r + h.r + 16 && angleDiff(angleTo(b.x, b.y, h.x, h.y), ba) < 0.9);
  if (pressed && due(u, 'shove', dt, 0.6)) {
    again(u, 'shove', 2.2, 3);
    Y.heave = { a: angleTo(b.x, b.y, pressed.x, pressed.y), tell: 0.3, run: 0.15, t: 0 };
    addDanger(w, { shape: 'line', x1: b.x, y1: b.y, x2: b.x + Math.cos(Y.heave.a) * 200, y2: b.y + Math.sin(Y.heave.a) * 200, hw: b.r + 6, t: 0.45, team: u.team, src: u, kind: 'ice', ...WARN });
    return true;
  }
  // ---- round behind the ball, then push it on towards the target
  const straight = pathClear(w, b.x, b.y, tg.x, tg.y, b.r * 0.9, b); // (round the rocks and walls when it must)
  const A = straight ? angleTo(b.x, b.y, tg.x, tg.y) : ballWay(w, b, tg.x, tg.y), want = handsOn(u, b), side = angleDiff(ba, A);
  const px = b.x - Math.cos(A) * (want + 4), py = b.y - Math.sin(A) * (want + 4);
  b.held = dB < u.r + b.r + 16 && side < 1.1; // its hands go on it only from behind; otherwise it's in the way (solid)
  const lined = b.held && side < 0.55 && dB < want + 10;
  // the heave, when a hero is ahead with room to roll (a little off its line will do: it shuffles round as it crouches)
  const d = dist(b.x, b.y, tg.x, tg.y);
  if (b.held && dB < want + 14 && d > 90 && d < 520 && side < 0.85 && straight && due(u, 'heave', dt, 0.4)) {
    again(u, 'heave', 0.8, 1.4);
    const a = angleTo(b.x, b.y, tg.x + (tg.vx || 0) * 0.4, tg.y + (tg.vy || 0) * 0.4);
    let len = 140; while (len < 620 && pathClear(w, b.x, b.y, b.x + Math.cos(a) * (len + 40), b.y + Math.sin(a) * (len + 40), b.r * 0.9, b)) len += 40;
    Y.heave = { a, tell: 0.55, run: 0.6, t: 0 };
    addDanger(w, { shape: 'line', x1: b.x, y1: b.y, x2: b.x + Math.cos(a) * len, y2: b.y + Math.sin(a) * len, hw: b.r + 8, t: 1.15, team: u.team, src: u, kind: 'ice', ...WARN });
    return true;
  }
  if (!lined) { // walk round to the far side of it, or up to it
    Y.pushT = 0;
    const touching = b.held && dB < want + 6;
    const [gx, gy] = goalVec(w, u, px, py), [sx, sy] = steer(w, u, gx, gy);
    drive(u, sx, sy, u.def.speed * (u.moveMul || 1) * (touching ? SNOW.push : 1), dt);
    turnTo(u, dB < 150 ? ba : u.mvA, touching ? SNOW.turn : 3, dt);
    if (touching) { u.lean = 0.12; u._force = pushPose(u); }
    return true;
  }
  Y.pushT += dt;
  // pushing: slow to get going, slow to turn, and only ever along the line through the ball
  const sp = u.def.speed * (u.moveMul || 1) * SNOW.push * (0.45 + 0.55 * clamp(Y.pushT / 1.2, 0, 1));
  const aim = angleTo(u.x, u.y, px + Math.cos(A) * 60, py + Math.sin(A) * 60);
  const [sx, sy] = steer(w, u, Math.cos(aim), Math.sin(aim));
  drive(u, sx, sy, sp, dt, 0.5);
  turnTo(u, ba, SNOW.turn, dt);
  u.lean = 0.14; u._force = pushPose(u);
  return true;
}
// Both hands on the ball, shoving with each step.
const pushPose = (u) => { const s = Math.sin(u.bob); return { 'arm-r': { dy: 7 + 2.5 * s, r: 0.16 }, 'arm-l': { dy: 7 - 2.5 * s, r: -0.16 } }; };
// The icicle wraith: hangs back and drops icicles on the party from above (a shadow shows where); cold to the touch.
function wraithBrain(w, u, dt) {
  every(w, u, dt, 'ice', 2.4, 3.2, 460, (t) => { const p = lead(t, 0.7); setAnim(u, 'cast', 0.4); icicle(w, u, p.x, p.y, 1); });
  return false;
}
function icicle(w, u, x, y, k = 1) {
  dropOn(w, u, x, y, { r: 42 * k, tell: 1.0, kind: 'ice', hit: { dmg: 9, chill: 30, knock: 90 },
    land: (w2, z) => { puff(w2, z.x, z.y, '#DFF6FF', 10, 120, 5, 0.45); for (let i = 0; i < 5; i++) { const a = rand() * TAU; w2.particles.push({ x: z.x, y: z.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.4, max: 0.4, size: 4, color: '#BFE9F8' }); } } });
}

// ---------------------------------------------------------------- the Ember Deep
// Hellhound: a wolf of the pit. Leaves fire where it runs, breathes a short cone of flame up close, and still hunts in
// packs (the wolf's howl and lunge). The elite's lunge leaves a line of fire.
function houndBrain(w, u, dt) {
  if (hold(u, dt)) return true;
  if (u.aggro && u.spd > 40 && due(u, 'trail', dt, 0.4)) { again(u, 'trail', 0.45, 0.6); firePatch(w, u.x - Math.cos(u.mvA) * u.r, u.y - Math.sin(u.mvA) * u.r, u.el && u.el.rush && u.elite ? 30 : 20, 2.6); }
  const t = targetOf(w, u);
  if (t && due(u, 'breath', dt, 3) && gapTo(u, t) < 110 && !u.act) {
    again(u, 'breath', 5.5, 7);
    cone(w, u, angleTo(u.x, u.y, t.x, t.y), { r: u.r + 130, arc: 0.9, tell: 0.5, kind: 'fire', anim: 'ability', hit: { dmg: 6, burn: 38, knock: 90 },
      fire: (w2, z) => { for (let i = 0; i < 8; i++) { const b = z.a + rrange(-z.arc / 2, z.arc / 2), d = rrange(30, z.r); flames(w2, z.x + Math.cos(b) * d, z.y + Math.sin(b) * d, 1, 10, 60); } } });
    return true;
  }
  return wolfBrain(w, u, dt);
}
// Cinder bat: dives straight at a hero and bursts into flame (it goes with it). Killed first, it just falls.
function cinderBrain(w, u, dt) {
  const d = u.dive;
  if (d) {
    if (d.tell > 0) { d.tell -= dt; stand(u, dt); turnTo(u, d.a, 10, dt); return true; }
    u.dvx = Math.cos(d.a) * d.sp; u.dvy = Math.sin(d.a) * d.sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = d.a; u.spd = d.sp; u.facing = d.a;
    if (rand() < 0.6) flames(w, u.x - Math.cos(d.a) * u.r, u.y - Math.sin(d.a) * u.r, 1, 6, 40);
    const nx = u.x + Math.cos(d.a) * (u.r + 8), ny = u.y + Math.sin(d.a) * (u.r + 8);
    if ((d.t -= dt) <= 0 || opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < u.r + h.r + 4) || !lineClear(w, u.x, u.y, nx, ny, 2)) {
      if (u.elite) firePatch(w, u.x, u.y, 56, 4);
      blast(w, u, { r: u.elite ? 95 : 72, dmg: u.elite ? 16 : 12, burn: 34 });
    }
    return true;
  }
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'dive', dt, 1.5)) return false;
  const g = gapTo(u, t); if (g < 50 || g > 300 || !lineClear(w, u.x, u.y, t.x, t.y, u.r * 0.8)) return false;
  const a = angleTo(u.x, u.y, t.x + (t.vx || 0) * 0.3, t.y + (t.vy || 0) * 0.3), len = g + 80, sp = u.def.speed * 2.6;
  u.dive = { a, tell: 0.45, t: len / sp, sp };
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, hw: u.r + 10, t: 0.45, team: u.team, src: u, kind: 'fire' });
  setAnim(u, 'ability', 0.45 + len / sp);
  return true;
}
// The Pit Lord (floor 2), tuned up (approved as written): a whip of fire down a line, rifts near the party that spit
// imps, the ring of fire, and its slam.
function pitLordBrain(w, u, dt) {
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  if (due(u, 'rifts', dt, 3) && !w.stale) {
    again(u, 'rifts', 12, 15);
    const mine = w.units.filter((o) => o.calledBy === u && alive(o)).length;
    for (let i = 0; i < 2 && mine + i * 2 < 6; i++) {
      const p = openSpot(w, t.x, t.y, 150, 300, 30); if (!p) continue;
      fx(w, { type: 'rift', x: p.x, y: p.y, r: 34, at: 1.2, max: 1.6 });
      for (let k = 0; k < 2; k++) later(w, p.x, p.y, 1.0 + k * 0.6, () => { if (!alive(u) || crowd(w, u.team) >= 18) return; const s = spawn(w, 'imp', p.x + rrange(-14, 14), p.y + rrange(-14, 14), { team: u.team, mult: w.mult }); s.aggro = true; s.minion = true; s.court = true; s.calledBy = u; flames(w, p.x, p.y, 6, 20, 80); });
    }
  }
  const d = dist(u.x, u.y, t.x, t.y);
  if (d > 90 && d < 380 && due(u, 'whip', dt, 2) && lineClear(w, u.x, u.y, t.x, t.y, 4)) {
    again(u, 'whip', 4.5, 6);
    line(w, u, angleTo(u.x, u.y, t.x, t.y), Math.min(400, d + 60), { tell: 0.55, hw: 26, kind: 'fire', anim: 'swing', hit: { dmg: 14, burn: 35, knock: 220 },
      fire: (w2, z) => { for (let k = 0.1; k < 1; k += 0.12) flames(w2, z.x1 + (z.x2 - z.x1) * k, z.y1 + (z.y2 - z.y1) * k, 1, 8, 50); } });
    return true;
  }
  if (due(u, 'nova', dt, 5) && opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 260)) {
    again(u, 'nova', 8, 10);
    around(w, u, { r0: 60, r: 240, tell: 1.0, kind: 'fire', hit: { dmg: 16, knock: 260, burn: 40 }, fire: (w2, z) => { for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; flames(w2, z.x + Math.cos(a) * 150, z.y + Math.sin(a) * 150, 2, 14, 80); } w2.shake = Math.max(w2.shake, 5); } });
    return true;
  }
  return slam(w, u, dt, { r: 140, tell: 0.95, dmg: 18, cdMin: 6.5, cdMax: 8.5 });
}

// ---------------------------------------------------------------- the Gilded Spire
// Sun blade: a floating sword that can't be staggered. It picks a hero and spins through the party in a straight line
// (a line shows first), cutting everyone it passes, then turns for another pass. The elite sheds radiant bolts all
// round at the end of each pass.
function bladeBrain(w, u, dt) {
  if (!u.steady) { u.steady = true; addBuff(u, { id: 'steady', dur: 1e9, knockImmune: true }); }
  u.facing = wrapAngle(u.facing + (u.pass ? 22 : 6) * dt); // always turning
  const p = u.pass;
  if (p) {
    if (p.tell > 0) { p.tell -= dt; stand(u, dt); return true; }
    u.dvx = Math.cos(p.a) * p.sp; u.dvy = Math.sin(p.a) * p.sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = p.a; u.spd = p.sp;
    if (rand() < 0.7) sparks(w, u.x, u.y, p.a + Math.PI, 1, '#FFF1B0');
    for (const h of opponents(w, u)) {
      if (p.hit.has(h) || dist(u.x, u.y, h.x, h.y) > u.r + h.r + 6) continue;
      p.hit.add(h); const side = Math.sign(Math.sin(angleTo(u.x, u.y, h.x, h.y) - p.a)) || 1;
      hurt(w, h, u.def.dmg * u.dmgMul, u, { knock: 220, kAngle: p.a + side * 1.2, radiance: 14 });
    }
    const nx = u.x + Math.cos(p.a) * (u.r + 8), ny = u.y + Math.sin(p.a) * (u.r + 8);
    if ((p.t -= dt) <= 0 || nx < 10 || ny < 10 || nx > w.W - 10 || ny > w.H - 10 || !lineClear(w, u.x, u.y, nx, ny, 2)) {
      u.pass = null; u.spd *= 0.2;
      if (u.elite) for (let i = 0; i < 6; i++) shoot(w, u, i / 6 * TAU + rand(), { kind: 'bolt', color: '#FFF1B0', speed: 280, dmg: 5, r: 7, life: 1.2, hitO: { knock: 60, radiance: 12 } });
    }
    return true;
  }
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'pass', dt, 1.5)) return false;
  const d = dist(u.x, u.y, t.x, t.y); if (d > 420 || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return false;
  again(u, 'pass', 2.4, 3.4);
  const a = angleTo(u.x, u.y, t.x, t.y), len = d + 180, sp = u.def.speed * 3.4;
  u.pass = { a, tell: 0.55, t: len / sp, sp, hit: new Set() };
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, hw: u.r + 8, t: 0.55, team: u.team, src: u, kind: 'holy' });
  setAnim(u, 'ability', 0.55 + len / sp);
  return true;
}
// Choir sprite: sings, and everything of its side in the song mends; a stagger (or any stun) silences it a while.
// The elite's song quickens them too.
function choirBrain(w, u, dt) {
  if (u.st.stagger > 20 || u.koT > 0 || u.stunT > 0) { if (!(u.silT > 0)) { puff(w, u.x, u.y, '#B8B0C8', 8, 60, 5, 0.4); } u.silT = 4; }
  if (u.silT > 0) { u.silT -= dt; return false; }
  if (!u.aggro || !due(u, 'song', dt, 1)) return false;
  again(u, 'song', 1);
  const R = 230;
  for (const a of [u, ...allies(w, u)]) if (dist(a.x, a.y, u.x, u.y) < R + a.r) {
    if (!w.stale && a.hp < a.maxHp) heal(w, a, a.maxHp * 0.04, u);
    if (u.elite) addBuff(a, { id: 'choir', dur: 1.2, move: 1.2, atkSpeed: 1.2 });
  }
  for (const h of opponents(w, u)) if (dist(h.x, h.y, u.x, u.y) < R + h.r) addStatus(w, h, 'sleepy', 8, u); // round 13: its lovely song makes the party sleepy
  u.beat = (u.beat || 0) + 1;
  if (u.beat % 2 === 0) { fx(w, { type: 'ring', x: u.x, y: u.y, r: R, color: '#FFE7A0', max: 0.6 }); setAnim(u, 'cast', 0.4); }
  for (let i = 0; i < 3; i++) w.particles.push({ x: u.x + rrange(-14, 14), y: u.y + rrange(-10, 10), vx: rrange(-20, 20), vy: 0, rise: 40, up: 0, life: 0.9, max: 0.9, size: 4, color: '#FFE7A0' });
  return false;
}
// The Twin Heralds (floor 2's mini-boss): one of light, one fallen. Each mends while the other is near (a bright line
// joins them), so the party has to pull them apart; and their own moves part them: the light one blinks far off and
// calls light down on the party, the fallen one charges a hero clean across the room.
function heraldBrain(w, u, dt) {
  if (u.def.herald === 'light' && !u.twin) { // the light one brings its twin
    u.twin = true;
    const p = openSpot(w, u.x, u.y, 90, 160, u.r) || { x: u.x, y: clamp(u.y + 140, 60, w.H - 60) };
    const f = spawn(w, 'heraldFallen', p.x, p.y, { team: u.team, mult: 1 });
    f.maxHp = u.maxHp; f.hp = u.hp; f.dmgMul = u.dmgMul; f.facing = u.facing; f.twin = u; u.twin = f; f.court = false;
  }
  if (rushTick(w, u, dt)) return true;
  if (hold(u, dt)) return true;
  const tw = u.twin && u.twin !== true && alive(u.twin) ? u.twin : null;
  if (tw && dist(u.x, u.y, tw.x, tw.y) < 300) {
    if (!w.stale && u.hp < u.maxHp) heal(w, u, u.maxHp * 0.02 * dt, tw);
    if (u.def.herald === 'light' && (!u.tie || u.tie.t >= u.tie.max)) u.tie = fx(w, { type: 'beam', kind: 'ray', col: '#FFE7A0', from: u, to: tw, x1: u.x, y1: u.y, x2: tw.x, y2: tw.y, max: 0.5 });
  }
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  if (u.def.herald === 'light') {
    if (due(u, 'part', dt, 6)) { // away from its twin, and light on everyone
      again(u, 'part', 9, 11);
      const from = tw || u, p = openSpot(w, from.x, from.y, 380, 600, u.r) || openSpot(w, u.x, u.y, 250, 450, u.r);
      if (p) blink(w, u, p.x, p.y, 'rgba(255,240,180,0.85)');
      for (const h of opponents(w, u)) lob(w, u, h.x + (h.vx || 0) * 0.5, h.y + (h.vy || 0) * 0.5, { r: 64, tell: 1.0, kind: 'holy', dust: '#FFF1B0', hit: { dmg: 13, knock: 200, radiance: 30 },
        land: (w2, z) => fx(w2, { type: 'pillar', x: z.x, y: z.y, r: z.r * 0.8, kind: 'holy', max: 0.6 }) });
      setAnim(u, 'cast', 0.5);
      return false;
    }
    if (due(u, 'spear', dt, 3) && dist(u.x, u.y, t.x, t.y) > 140 && sees(w, u, t, 460)) {
      again(u, 'spear', 5, 6.5);
      line(w, u, angleTo(u.x, u.y, t.x, t.y), 480, { tell: 0.65, hw: 28, kind: 'holy', proj: 'bolt', color: '#FFF1B0', hit: { dmg: 14, knock: 260, radiance: 30 } });
      return true;
    }
  } else {
    const g = gapTo(u, t);
    if (due(u, 'part', dt, 5) && g > 60 && g < 520 && lineClear(w, u.x, u.y, t.x, t.y, u.r)) { // a charge clean across the room
      again(u, 'part', 8, 10);
      rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 260, { tell: 0.6, dmg: 16, knock: 320, status: { curse: 35, stagger: 40 }, trail: 'rgba(90,50,120,0.7)' });
      return true;
    }
    if (due(u, 'gloom', dt, 4) && opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 200 + h.r)) {
      again(u, 'gloom', 7, 9);
      around(w, u, { r: 200, tell: 0.9, kind: 'soul', hit: { dmg: 10, knock: 240, curse: 40 } });
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------- the kinds
const SPIRIT = { ...FOE, art: variantUrl('art/enemies/ghost.svg', { hue: 0, sat: 0.4, light: 0.2 }), headR: 58, r: 18, vr: 15, turn: 6, accel: 300, face: 6, mass: 0.4,
  hp: 30, speed: 60, role: 'ranged', range: 280, keep: 250, atkCd: 999, dmg: 0, temp: 0.5, commit: 0.6, xp: 9, coins: [1, 3], cost: 2.5, noCorpse: true,
  res: { poison: 0, curse: 0 }, brain: spiritBrain, onDeath: spiritDeath };
const spirit = (el, name, spec, res = {}) => ({ ...SPIRIT, spirit: el, name, art: variantUrl('art/enemies/ghost.svg', spec), res: { ...SPIRIT.res, ...res }, goo: null });
export { spirit, SPIRIT };
const GOLEM = { ...FOE, name: 'Golem', art: 'art/enemies/golem.svg', headR: 66, r: 44, vr: 33, turn: 2, accel: 120, face: 2, mass: 4.5,
  hp: 210, speed: 34, role: 'melee', range: 28, atkCd: 2.1, windup: 0.6, dmg: 17, knock: 260, arc: 2.0, heavy: true, stagger: 35, temp: 0.2, commit: 1.4, xp: 34, coins: [6, 12],
  cost: 8, attackAnim: 'swing', construct: true, dust: '#B9AE9C', res: { poison: 0, burn: 0.6, chill: 0.6, curse: 0, wet: 0.5 }, brain: golemBrain };
const HERALD = { ...FOE, headR: 56, r: 46, vr: 34, turn: 3, accel: 200, face: 3, mass: 4, hp: 300, speed: 56, role: 'melee', range: 40, atkCd: 1.3, windup: 0.3, dmg: 13,
  knock: 180, arc: 1.0, heavy: true, temp: 0.25, commit: 1.1, xp: 60, coins: [18, 26], boss: true, attackAnim: 'thrust', brain: heraldBrain };
export const FOES10 = {
  // ---- the Frost Hollow
  frostWolf: { variantOf: 'wolf', name: 'Frost Wolf', art: 'art/enemies/frost-wolf.svg', chill: 20, hp: 30, xp: 9, cost: 2.5, res: { chill: 0.2, burn: 1.3 } },
  slimeIce: { variantOf: 'slime', name: 'Ice Slime', art: 'art/enemies/ice-slime.svg', headR: 64, hp: 54, splits: false, xp: 10, cost: 3, goo: '#DFF6FF', res: { chill: 0, burn: 1.4 },
    onHop: (w, u) => coldPatch(w, u.x, u.y, 36, 2.4), onDeath: (w, u) => shards(w, u, 7) },
  spiderFrost: { variantOf: 'spiderHunter', name: 'Frost Spider', art: 'art/enemies/frost-spider.svg', headR: 54, poison: 0, chill: 22, xp: 10, res: { chill: 0.2 },
    onDeath: (w, u) => w.hazards.push({ type: 'web', cold: true, x: u.x, y: u.y, r: 48, t: 6, max: 6 }) },
  yeti: { ...FOE, name: 'Yeti', art: 'art/enemies/yeti.svg', headR: 68, r: 42, vr: 31, turn: 2.6, accel: 150, face: 2.6, mass: 3,
    hp: 180, speed: 46, role: 'melee', range: 30, atkCd: 1.7, windup: 0.45, dmg: 15, knock: 220, arc: 2.2, stagger: 30, temp: 0.25, commit: 1.2, xp: 32, coins: [6, 12], cost: 8,
    attackAnim: 'swing', res: { chill: 0, burn: 1.3 }, brain: yetiBrain, onDeath: (w, u) => { const b = snowOf(w, u); if (b && b.packing) burstSnow(w, b, false); else if (b) b.held = false; } }, // (its ball rolls on, and melts)
  frostWraith: { variantOf: 'ghost', name: 'Icicle Wraith', art: 'art/enemies/icicle-wraith.svg', headR: 37, role: 'ranged', range: 320, keep: 240, hp: 44, xp: 14, cost: 4,
    res: { poison: 0, burn: 1.5, chill: 0, curse: 0 }, brain: wraithBrain },
  spiritFrost: { ...spirit('frost', 'Frost Spirit', { hue: 175, sat: 0.8, light: 0.2 }, { chill: 0 }), art: 'art/enemies/spirit-frost.svg', headR: 30 }, // art round 9
  // ---- the Ember Deep
  spiderFire: { variantOf: 'spiderHunter', name: 'Fire Spider', art: 'art/enemies/fire-spider.svg', headR: 54, poison: 0, burn: 20, xp: 11, cost: 3.5, res: { burn: 0 },
    onDeath: (w, u) => firePatch(w, u.x, u.y, 40, 3.5),
    brain: (w, u, dt) => { every(w, u, dt, 'spit', 3, 4.2, 320, (t) => { setAnim(u, 'throw', 0.3); fireball(w, u, angleTo(u.x, u.y, t.x + (t.vx || 0) * 0.4, t.y + (t.vy || 0) * 0.4)); }); return false; } },
  hellhound: { variantOf: 'wolf', name: 'Hellhound', art: 'art/enemies/hellhound.svg', burn: 14, bleed: 16, hunter: 1.4, hp: 40, /* round 13: its bite bleeds; it hunts the party's healer */ dmg: 7, xp: 11, cost: 3, pack: [2, 3], res: { burn: 0, chill: 1.4 }, brain: houndBrain },
  cinderBat: { variantOf: 'bat', name: 'Cinder Bat', art: 'art/enemies/cinder-bat.svg', hp: 20, xp: 6, cost: 2, pack: [2, 3], ability: null, atkCd: 999, res: { burn: 0 }, brain: cinderBrain },
  spiritFire: { ...spirit('fire', 'Fire Spirit', { hue: -40, sat: 1.8, light: 0.1 }, { burn: 0 }), art: 'art/enemies/spirit-fire.svg', headR: 30 }, // art round 9
  pitLord: { ...FOES.pitLord, art: 'art/enemies/pit-lord.svg', headR: 68, brain: pitLordBrain }, // art round 9: its own art (it wore the round-5 demon)
  // ---- the Gilded Spire
  angelFallen: { variantOf: 'angel', name: 'Fallen Angel', art: 'art/enemies/fallen-angel.svg', radiance: 0, curse: 22, xp: 17, res: { radiance: 0, curse: 0 } },
  sunBlade: { ...FOE, name: 'Sun Blade', art: 'art/enemies/sun-blade.svg', headR: 58, r: 36, vr: 52, turn: 6, accel: 360, face: 6, mass: 0.8,
    hp: 46, speed: 70, role: 'skirmish', range: 14, atkCd: 999, dmg: 9, temp: 0.6, commit: 0.5, xp: 12, coins: [2, 5], cost: 4, noCorpse: true, goo: '#FFE7A0',
    res: { stagger: 0, radiance: 0, poison: 0, curse: 0 }, brain: bladeBrain },
  choirSprite: { ...FOE, name: 'Choir Sprite', art: 'art/enemies/choir-sprite.svg', headR: 40, r: 20, vr: 16, turn: 6, accel: 320, face: 6, mass: 0.5,
    hp: 34, speed: 58, role: 'ranged', range: 260, keep: 240, atkCd: 999, dmg: 0, temp: 0.5, commit: 0.6, xp: 11, coins: [2, 4], cost: 3.5, res: { radiance: 0 }, brain: choirBrain },
  golem: GOLEM,
  gildedGolem: { variantOf: 'golem', name: 'Gilded Golem', art: 'art/enemies/gilded-golem.svg', mirror: 1.2, shield: 0.35, hp: 180, radiance: 18, xp: 38, cost: 9, dust: '#E8C65A',
    res: { poison: 0, burn: 0.6, chill: 0.6, curse: 0, wet: 0.5, radiance: 0 } },
  spiritHeal: { ...spirit('heal', 'Light Spirit', { hue: 40, sat: 1.6, light: 0.22 }, { radiance: 0 }), art: 'art/enemies/spirit-heal.svg', headR: 30 }, // art round 9
  spiritWard: { ...spirit('ward', 'Ward Spirit', { hue: -100, sat: 1.2, light: 0.08 }, { radiance: 0 }), art: 'art/enemies/spirit-ward.svg', headR: 30 }, // art round 9
  heraldLight: { ...HERALD, name: 'Herald of Light', herald: 'light', art: 'art/enemies/herald-light.svg', radiance: 24, res: { radiance: 0 } },
  heraldFallen: { ...HERALD, name: 'Fallen Herald', herald: 'fallen', art: 'art/enemies/herald-fallen.svg', curse: 24, res: { radiance: 0, curse: 0 } },
};

// ---------------------------------------------------------------- their elite moves
Object.assign(ELITES, {
  frostWolf: { tick() { return false; } }, // the wolf's: its howl hastens the pack
  // Ice slime: lobs a glob of ice that leaves a wide patch of freezing air.
  slimeIce: { tick(w, u, dt) { if (hold(u, dt)) return true; every(w, u, dt, 'glob', 4, 5.5, 400, (t) => { const p = lead(t, 0.5); lob(w, u, p.x, p.y, { r: 60, tell: 0.9, proj: 'water', color: '#DFF6FF', kind: 'ice', dust: '#DFF6FF', hit: { dmg: 6, chill: 40, knock: 120 }, land: (w2, z) => coldPatch(w2, z.x, z.y, 70, 4) }); }); return false; } },
  // Frost spider: leaps on you from afar; the bite freezes.
  spiderFrost: { tick(w, u, dt) { return pounce(w, u, dt, { min: 120, max: 320, every: [3.5, 5], r: 52, dmg: 10, status: { chill: 45 }, kind: 'ice', dust: '#DFF6FF' }); } },
  yeti: { tick() { return false; } },      // a bigger snowball that bursts into ice (yetiBrain reads u.elite)
  // Icicle wraith: a ring of icicles round its mark.
  frostWraith: { tick(w, u, dt) { every(w, u, dt, 'ring', 5, 7, 460, (t) => { setAnim(u, 'cast', 0.5); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; icicle(w, u, t.x + Math.cos(a) * 70, t.y + Math.sin(a) * 70, 0.85); } }); return false; } },
  spiritFrost: { tick() { return false; } }, spiritFire: { tick() { return false; } }, spiritHeal: { tick() { return false; } }, spiritWard: { tick() { return false; } }, // two rays (spiritBrain reads u.elite)
  // Fire spider: leaps on you from afar; the bite sets you alight.
  spiderFire: { tick(w, u, dt) { return pounce(w, u, dt, { min: 120, max: 320, every: [3.5, 5], r: 52, dmg: 10, status: { burn: 40 }, kind: 'fire', dust: '#5A4A40' }); } },
  hellhound: { tick() { return false; } }, // its lunge leaves a line of fire (houndBrain reads u.elite)
  cinderBat: { tick() { return false; } }, // a bigger blast that leaves fire (cinderBrain reads u.elite)
  // Fallen angel: a shaft of darkness where you stand (curses).
  angelFallen: { tick(w, u, dt) { every(w, u, dt, 'smite', 3.5, 5, 460, (t) => { setAnim(u, 'cast', 0.4); lob(w, u, t.x + (t.vx || 0) * 0.5, t.y + (t.vy || 0) * 0.5, { r: 66, tell: 0.9, kind: 'soul', dust: '#7A5A9A', hit: { dmg: 13, knock: 200, curse: 34 } }); }); return false; } },
  sunBlade: { tick() { return false; } },  // radiant bolts at the end of each pass (bladeBrain reads u.elite)
  choirSprite: { tick() { return false; } }, // its song quickens (choirBrain reads u.elite)
});
