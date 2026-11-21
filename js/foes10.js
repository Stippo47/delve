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
import { alive, opponents, allies, hurt, puff, sparks, flames, addStatus, setAnim, fx, addBuff, explode, spawn, heal, kill, addDanger } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, rand, rrange, chance } from './util.js';
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
// The yeti: a snowball packed in front of it (a round body in the room, like the troll's boulder: it has its own hit
// circle and blocks shots, and it can be shot to pieces), always thrown: with a hero in front it rolls it at them
// (heavy cold, stagger, a big shove) and it bursts on whatever it hits; then it packs a new one. In between it fights
// with its fists (they stagger). The elite rolls a bigger one that bursts into ice.
function snowOf(w, u) { return u.snow && w.pillars.includes(u.snow) ? u.snow : (u.snow = null); }
function packSnow(w, u) {
  const big = u.elite ? 1.3 : 1, r = Math.round(u.r * 0.55 * big);
  const b = { x: u.x + Math.cos(u.facing) * (u.r + r + 8), y: u.y + Math.sin(u.facing) * (u.r + r + 8), r, snowball: true, owner: u, team: u.team, vx: 0, vy: 0, held: true, hp: Math.round(40 * (w.mult || 1) ** 0.7), maxHp: 0, spin: 0 };
  b.maxHp = b.hp; u.snow = b; w.pillars.push(b);
  puff(w, b.x, b.y, '#F4FBFF', 12, 90, 6, 0.5);
}
function burstSnow(w, u, b) {
  const i = w.pillars.indexOf(b); if (i >= 0) w.pillars.splice(i, 1);
  if (u && u.snow === b) u.snow = null;
  puff(w, b.x, b.y, '#F4FBFF', 20, 200, 8, 0.6); w.shake = Math.max(w.shake, 3);
  for (const h of opponents(w, u)) if (dist(h.x, h.y, b.x, b.y) < b.r + h.r + 40) addStatus(w, h, 'chill', 16, u);
  if (b.big && u) shards(w, u, 7, { x: b.x, y: b.y, dmg: 5, chill: 20 });
}
function yetiBrain(w, u, dt) {
  // the loose ones roll on their own (and are its, even while it stands through a throw)
  for (const b of w.pillars.filter((p) => p.snowball && p.owner === u && !p.held)) {
    const sp = Math.hypot(b.vx, b.vy);
    if (b.hp <= 0 || sp < 70) { burstSnow(w, u, b); continue; }
    const k = Math.exp(-0.55 * dt); b.vx *= k; b.vy *= k; b.spin += sp * dt / b.r;
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    if (nx < b.r || ny < b.r || nx > w.W - b.r || ny > w.H - b.r || w.walls.some((r) => nx > r.x - b.r && nx < r.x + r.w + b.r && ny > r.y - b.r && ny < r.y + r.h + b.r)
      || w.pillars.some((p) => p !== b && dist(nx, ny, p.x, p.y) < p.r + b.r)) { burstSnow(w, u, b); continue; }
    b.x = nx; b.y = ny;
    if (rand() < dt * 12) w.particles.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 6, color: 'rgba(240,248,255,0.8)' });
    const h = opponents(w, u).find((o) => dist(o.x, o.y, b.x, b.y) < b.r + o.r + 4);
    if (h) { hurt(w, h, (b.big ? 20 : 16) * u.dmgMul, u, { knock: 380, kAngle: Math.atan2(b.vy, b.vx), heavy: true, stagger: 45, chill: b.big ? 70 : 55 }); burstSnow(w, u, b); }
  }
  let b = snowOf(w, u);
  if (b && b.hp <= 0) { burstSnow(w, u, b); b = null; }
  if (b && b.held) { const p = { x: u.x + Math.cos(u.facing) * (u.r + b.r + 8), y: u.y + Math.sin(u.facing) * (u.r + b.r + 8) }; b.x = p.x; b.y = p.y; }
  if (hold(u, dt)) return true;
  if (!b) { // pack another
    if (w.stale || !u.aggro || !due(u, 'pack', dt, 1.2)) return false;
    again(u, 'pack', 2.5, 3.5);
    beginHold(u, 0.9, null, () => { if (alive(u) && !snowOf(w, u)) packSnow(w, u); });
    setAnim(u, 'ability', 0.9); puff(w, u.x, u.y, '#F4FBFF', 8, 60, 5, 0.4);
    return true;
  }
  const t = targetOf(w, u); if (!t || !due(u, 'roll', dt, 1.5)) return false;
  const d = dist(u.x, u.y, t.x, t.y), off = Math.abs(wrapAngle(angleTo(u.x, u.y, t.x, t.y) - u.facing));
  const pressed = dist(t.x, t.y, b.x, b.y) < b.r + t.r + 24;
  if (!pressed && (d < 110 || d > 460 || off > 0.45 || !lineClear(w, b.x, b.y, t.x, t.y, b.r * 0.7))) { again(u, 'roll', 0.3); return false; }
  again(u, 'roll', 1, 1.5);
  const a = angleTo(u.x, u.y, t.x + (t.vx || 0) * 0.3, t.y + (t.vy || 0) * 0.3);
  addDanger(w, { shape: 'line', x1: b.x, y1: b.y, x2: b.x + Math.cos(a) * 460, y2: b.y + Math.sin(a) * 460, hw: b.r + 6, t: 0.45, team: u.team, src: u, kind: 'ice' });
  beginHold(u, 0.45, a, () => { const bb = snowOf(w, u); if (!bb) return; bb.held = false; bb.big = !!u.elite; bb.vx = Math.cos(a) * 400; bb.vy = Math.sin(a) * 400; u.snow = null; });
  setAnim(u, 'throw', 0.45);
  return true;
}
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
const GOLEM = { ...FOE, name: 'Golem', art: variantUrl(ART('ogre'), { sat: 0.12, light: 0.04 }), headR: 66, r: 44, vr: 33, turn: 2, accel: 120, face: 2, mass: 4.5,
  hp: 210, speed: 34, role: 'melee', range: 28, atkCd: 2.1, windup: 0.6, dmg: 17, knock: 260, arc: 2.0, heavy: true, stagger: 35, temp: 0.2, commit: 1.4, xp: 34, coins: [6, 12],
  cost: 8, attackAnim: 'swing', construct: true, dust: '#B9AE9C', res: { poison: 0, burn: 0.6, chill: 0.6, curse: 0, wet: 0.5 }, brain: golemBrain };
const HERALD = { ...FOE, headR: 56, r: 46, vr: 34, turn: 3, accel: 200, face: 3, mass: 4, hp: 300, speed: 56, role: 'melee', range: 40, atkCd: 1.3, windup: 0.3, dmg: 13,
  knock: 180, arc: 1.0, heavy: true, temp: 0.25, commit: 1.1, xp: 60, coins: [18, 26], boss: true, attackAnim: 'thrust', brain: heraldBrain };
export const FOES10 = {
  // ---- the Frost Hollow
  frostWolf: { variantOf: 'wolf', name: 'Frost Wolf', hue: 175, sat: 0.3, light: 0.3, chill: 20, hp: 30, xp: 9, cost: 2.5, res: { chill: 0.2, burn: 1.3 } },
  slimeIce: { variantOf: 'slime', name: 'Ice Slime', hue: -12, sat: 0.5, light: 0.24, hp: 54, splits: false, xp: 10, cost: 3, goo: '#DFF6FF', res: { chill: 0, burn: 1.4 },
    onHop: (w, u) => coldPatch(w, u.x, u.y, 36, 2.4), onDeath: (w, u) => shards(w, u, 7) },
  spiderFrost: { variantOf: 'spiderHunter', name: 'Frost Spider', hue: 150, sat: 0.6, light: 0.18, poison: 0, chill: 22, xp: 10, res: { chill: 0.2 },
    onDeath: (w, u) => w.hazards.push({ type: 'web', cold: true, x: u.x, y: u.y, r: 48, t: 6, max: 6 }) },
  yeti: { ...FOE, name: 'Yeti', art: variantUrl('art/enemies/troll.svg', { hue: 170, sat: 0.12, light: 0.34 }), headR: 66, r: 42, vr: 31, turn: 2.6, accel: 150, face: 2.6, mass: 3,
    hp: 180, speed: 46, role: 'melee', range: 30, atkCd: 1.7, windup: 0.45, dmg: 15, knock: 220, arc: 2.2, stagger: 30, temp: 0.25, commit: 1.2, xp: 32, coins: [6, 12], cost: 8,
    attackAnim: 'swing', res: { chill: 0, burn: 1.3 }, brain: yetiBrain, onDeath: (w, u) => { const b = snowOf(w, u); if (b) burstSnow(w, u, b); } },
  frostWraith: { variantOf: 'ghost', name: 'Icicle Wraith', hue: 175, sat: 0.7, light: 0.16, role: 'ranged', range: 320, keep: 240, hp: 44, xp: 14, cost: 4,
    res: { poison: 0, burn: 1.5, chill: 0, curse: 0 }, brain: wraithBrain },
  spiritFrost: spirit('frost', 'Frost Spirit', { hue: 175, sat: 0.8, light: 0.2 }, { chill: 0 }),
  // ---- the Ember Deep
  spiderFire: { variantOf: 'spiderHunter', name: 'Fire Spider', hue: -40, sat: 1.5, light: 0.02, poison: 0, burn: 20, xp: 11, cost: 3.5, res: { burn: 0 },
    onDeath: (w, u) => firePatch(w, u.x, u.y, 40, 3.5),
    brain: (w, u, dt) => { every(w, u, dt, 'spit', 3, 4.2, 320, (t) => { setAnim(u, 'throw', 0.3); fireball(w, u, angleTo(u.x, u.y, t.x + (t.vx || 0) * 0.4, t.y + (t.vy || 0) * 0.4)); }); return false; } },
  hellhound: { variantOf: 'wolf', name: 'Hellhound', hue: -25, sat: 1.7, light: -0.16, burn: 14, hp: 40, dmg: 7, xp: 11, cost: 3, pack: [2, 3], res: { burn: 0, chill: 1.4 }, brain: houndBrain },
  cinderBat: { variantOf: 'bat', name: 'Cinder Bat', hue: -30, sat: 1.6, light: 0.05, hp: 20, xp: 6, cost: 2, pack: [2, 3], ability: null, atkCd: 999, res: { burn: 0 }, brain: cinderBrain },
  spiritFire: spirit('fire', 'Fire Spirit', { hue: -40, sat: 1.8, light: 0.1 }, { burn: 0 }),
  pitLord: { ...FOES.pitLord, brain: pitLordBrain },
  // ---- the Gilded Spire
  angelFallen: { variantOf: 'angel', name: 'Fallen Angel', hue: 230, sat: 0.55, light: -0.3, radiance: 0, curse: 22, xp: 17, res: { radiance: 0, curse: 0 } },
  sunBlade: { ...FOE, name: 'Sun Blade', art: variantUrl(ART('cherub'), { hue: 18, sat: 1.4, light: 0.16 }), headR: 46, r: 22, vr: 17, turn: 6, accel: 360, face: 6, mass: 0.8,
    hp: 46, speed: 70, role: 'skirmish', range: 14, atkCd: 999, dmg: 9, temp: 0.6, commit: 0.5, xp: 12, coins: [2, 5], cost: 4, noCorpse: true, goo: '#FFE7A0',
    res: { stagger: 0, radiance: 0, poison: 0, curse: 0 }, brain: bladeBrain },
  choirSprite: { ...FOE, name: 'Choir Sprite', art: variantUrl(ART('cherub'), { hue: -45, sat: 0.7, light: 0.14 }), headR: 46, r: 20, vr: 16, turn: 6, accel: 320, face: 6, mass: 0.5,
    hp: 34, speed: 58, role: 'ranged', range: 260, keep: 240, atkCd: 999, dmg: 0, temp: 0.5, commit: 0.6, xp: 11, coins: [2, 4], cost: 3.5, res: { radiance: 0 }, brain: choirBrain },
  golem: GOLEM,
  gildedGolem: { variantOf: 'golem', name: 'Gilded Golem', hue: -36, sat: 2.2, light: 0.12, mirror: 1.2, shield: 0.35, hp: 180, radiance: 18, xp: 38, cost: 9, dust: '#E8C65A',
    res: { poison: 0, burn: 0.6, chill: 0.6, curse: 0, wet: 0.5, radiance: 0 } },
  spiritHeal: spirit('heal', 'Light Spirit', { hue: 40, sat: 1.6, light: 0.22 }, { radiance: 0 }),
  spiritWard: spirit('ward', 'Ward Spirit', { hue: -100, sat: 1.2, light: 0.08 }, { radiance: 0 }),
  heraldLight: { ...HERALD, name: 'Herald of Light', herald: 'light', art: variantUrl(ART('angel'), { light: 0.14, sat: 1.3 }), radiance: 24, res: { radiance: 0 } },
  heraldFallen: { ...HERALD, name: 'Fallen Herald', herald: 'fallen', art: variantUrl(ART('angel'), { hue: 230, sat: 0.55, light: -0.3 }), curse: 24, res: { radiance: 0, curse: 0 } },
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
