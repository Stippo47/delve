// The Goblin Chieftain: the Warren's boss (floor 3). Design and numbers: docs/BOSS-chieftain.md.
// The designer, round 12: "Nothing read horribly but the art/ visuals arent good. All of the abilities seem kinda samey.
// As for the time. Make it last like 2 minutes. Increase his damage but lose hp. Similar ttk". Round 13: the art lane's
// new chief (two axes), his camp redrawn, and his moves sorted so each asks something else: a chop in his face, a
// charge down a lane (the bonfires stop it), an axe thrown round a ring, drums to break, lit mice to run from, a
// whirlwind to flee. The spear and the bomb barrage are gone (two more lines and circles). Harder blows, less health.
// Art: art round 10's Goblin Chieftain (art/bosses/goblin-chieftain.svg); the camp is drawn (js/boss-chieftain-fx.js).
import { alive, hurt, puff, sparks, setAnim, addDanger, addBuff, spawn, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, rand, rrange, chance } from './util.js';
import { hold, beginHold, due, again, crowd, stand, turnTo, later } from './elites.js';
import { walkTo, courtFalls } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, farthest, randomHero, lead, charge, chargeTick, PART, logOf, notePhase, inside, stage, bfx, liveZone, keepZone, TEST_MOVE } from './boss-kit.js';
import { drawDrum, drawCampFloor, drawCampAir } from './boss-chieftain-fx.js';

// Every move: a tell (a shape fills on the floor), the hit, a recovery (the hold: the party's window).
export const CH = {
  chop: { r: 180, arc: 1.9, tell: 0.8, dmg: 31, knock: 300, rec: 0.6 },
  charge: { len: 640, tell: 0.85, dmg: 37, knock: 360, dazed: 1.8, open: 1.4, rec: 0.5 },
  axe: { band: 32, rMin: 120, rMax: 250, tell: 1.0, dmg: 30, knock: 200, cd: [5, 6.5], fly: 0.8 },
  roar: { r: 230, tell: 0.9, dmg: 12, stagger: 40, knock: 320 },
  drum: { every: 14, calls: 2, cap: 4, hp: 90, haste: 0.06 },
  mice: { n: 2, every: 11 },
  spin: { tell: 0.7, dur: 2.8, r: 118, tick: 0.4, dmg: 18, knock: 260, speed: 0.85, dizzy: 1.6, open: 1.4, cd: [9, 11] },
};
export const PHASE_AT = [1, 0.7, 0.45, 0.2];
const WAKE = 430, DUST = '#CDB089';
const ADDS = ['goblin', 'goblin', 'goblinSpear', 'hobgoblin', 'goblinBomber'];

function brain(w, u, dt) {
  const k = u.ch || (u.ch = { phase: 0 });
  steady(u); logOf(w, u, k); stage(w, 'chief', drawCampFloor, drawCampAir);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 0.9, null); setAnim(u, 'ability', 0.9); roarFx(w, u, 150); notePhase(w, k); })) return true;
  if (TEST_MOVE && !k.tested) { k.tested = true;
    if (TEST_MOVE === 'axe') again(u, 'axe', 0.6);
    if (TEST_MOVE === 'spin') { k.phase = Math.max(3, k.phase); again(u, 'spin', 0.8); } }
  drums(w, u, k, dt);
  if (spinTick(w, u, k, dt)) return true;
  if (chargeTick(w, u, k, dt)) return true;
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  // the drums hurry him: every one still beating takes a little off his tells; the last stand takes more
  const K = (1 - CH.drum.haste * k.drumsUp) * (k.phase >= 4 ? 0.8 : 1);
  const d = dist(u.x, u.y, t.x, t.y), gap = d - u.r - t.r, at = angleTo(u.x, u.y, t.x, t.y);
  // up close: both axes come across
  if (gap < 110 && due(u, 'chop', dt, 0.6)) {
    again(u, 'chop', 2.2 * K, 3.2 * K);
    const C = CH.chop;
    addDanger(w, { shape: 'cone', x: u.x, y: u.y, a: at, arc: C.arc, r: C.r, t: C.tell * K, team: u.team, src: u, kind: 'blade', quiet: true, hit: H(u, { dmg: C.dmg, knock: C.knock, heavy: true }),
      onFire: (w2) => bfx(w2, { type: 'twinChop', x: u.x, y: u.y, a: at, arc: C.arc, r: C.r, max: 0.36 }) });
    beginHold(u, C.tell * K + C.rec, at); setAnim(u, 'swing', C.tell * K + 0.2);
    return true;
  }
  // phase 3 on: the whirlwind, at whoever he wants
  if (k.phase >= 3 && due(u, 'spin', dt, 2)) { again(u, 'spin', ...CH.spin.cd.map((x) => x * K * (k.phase >= 4 ? 0.75 : 1))); startSpin(w, u, k, K); return true; }
  // phase 2 on: a whistle, and dynamite mice come running out of the tunnels
  if (k.phase >= 2 && due(u, 'mice', dt, 3)) { again(u, 'mice', CH.mice.every * K, (CH.mice.every + 3) * K); whistle(w, u); return true; }
  // the charge: at the one furthest off, or the one he wants when they're out of reach
  if (due(u, 'charge', dt, 3) && (gap > 140 || chance(0.3))) {
    again(u, 'charge', 6.5 * K, 8.5 * K);
    const who = gap > 140 ? t : farthest(w, u) || t;
    startCharge(w, u, k, who, K, k.phase >= 4);
    return true;
  }
  // a thrown axe: round a ring that runs through him and one of them, and back to his hand
  if (due(u, 'axe', dt, 2)) {
    again(u, 'axe', ...CH.axe.cd.map((x) => x * K));
    const who = farthest(w, u) || t; throwAxe(w, u, who, K, 1);
    if (k.phase >= 3) { const o = randomHero(w, u, who); if (o && o !== who) throwAxe(w, u, o, K, -1, 0.35); }
    beginHold(u, CH.axe.tell * K + 0.3, angleTo(u.x, u.y, who.x, who.y)); setAnim(u, 'throw', CH.axe.tell * K + 0.2);
    return true;
  }
  if (gap > 30) walkTo(w, u, t.x, t.y, 1, dt); else stand(u, dt);
  turnTo(u, at, 3, dt);
  return true;
}
function roarFx(w, u, r) { bfx(w, { type: 'chiefRoar', x: u.x, y: u.y, r, max: 0.6 }); w.shake = Math.max(w.shake, 7); }

// ---- moves
function startCharge(w, u, k, t, K, pair) {
  const p = lead(t, 0.35), a = angleTo(u.x, u.y, p.x, p.y);
  setAnim(u, 'ability', CH.charge.tell * K + 0.6);
  const end = () => { if (pair && !k.secondCharge && heroesOf(w, u).length > 1) { k.secondCharge = true; const o = randomHero(w, u, t); if (o) { startCharge(w, u, k, o, K * 0.8, true); return; } } k.secondCharge = false; beginHold(u, CH.charge.rec, null); };
  charge(w, u, k, a, CH.charge.len, { tell: CH.charge.tell * K, dmg: CH.charge.dmg, knock: CH.charge.knock, speed: 660, kind: 'blade', trail: 'rgba(205,176,137,0.8)',
    onEnd: end,
    onWall: () => { // into a wall or a bonfire: he staggers, dazed and open
      k.secondCharge = false;
      bfx(w, { type: 'chiefCrash', x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, max: 0.6 }); w.shake = Math.max(w.shake, 9);
      beginHold(u, CH.charge.dazed, null); setAnim(u, 'ability', CH.charge.dazed);
      addBuff(u, { id: 'dazed', dur: CH.charge.dazed, taken: CH.charge.open }); bfx(w, { type: 'chiefDazed', u, max: CH.charge.dazed });
    } });
}
// The axe flies a full circle: the ring runs through him and through where his mark will be. Step off the ring.
function throwAxe(w, u, t, K, dir, wait = 0) {
  const A = CH.axe, p = lead(t, 0.5), d = clamp(dist(u.x, u.y, p.x, p.y), A.rMin * 2, A.rMax * 2), a = angleTo(u.x, u.y, p.x, p.y), R = d / 2;
  const c = inside(w, u.x + Math.cos(a) * R, u.y + Math.sin(a) * R, 40), tell = A.tell * K + wait;
  addDanger(w, { shape: 'ring', x: c.x, y: c.y, r0: R - A.band, r1: R + A.band, t: tell, team: u.team, src: u, kind: 'blade', quiet: true, hit: H(u, { dmg: A.dmg, knock: A.knock }),
    onFire: (w2) => bfx(w2, { type: 'axeLoop', x: c.x, y: c.y, r: R, a0: angleTo(c.x, c.y, u.x, u.y), dir, max: A.fly }) });
}
// The whirlwind: axes out, he turns like a top and walks at his mark; a live circle shows his reach. Then he is dizzy.
function startSpin(w, u, k, K) {
  const S = CH.spin;
  k.spin = { t: 0, tell: S.tell * K, r: S.r, go: 0, hit: new Map(), z: null };
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: S.r, t: S.tell * K, team: u.team, src: u, kind: 'blade', quiet: true });
  setAnim(u, 'spin', S.tell * K + S.dur);
}
function spinTick(w, u, k, dt) {
  const s = k.spin; if (!s) return false;
  const S = CH.spin; s.t += dt;
  if (s.t < s.tell) { stand(u, dt); u.facing += 4 * dt * (s.t / s.tell); return true; } // winding up
  s.go = Math.min(1, s.go + dt * 4);
  u.facing += 15 * dt;
  const t = pickTarget(w, u, k, dt);
  if (t) walkTo(w, u, t.x, t.y, S.speed, dt); else stand(u, dt);
  s.z = s.z && w.danger.includes(s.z) ? s.z : liveZone(w, u, { shape: 'circle', x: u.x, y: u.y, r: S.r + 10, kind: 'blade' });
  keepZone(s.z, { x: u.x + (u.vx || 0) * 0.25, y: u.y + (u.vy || 0) * 0.25 });
  for (const h of heroesOf(w, u)) {
    if (dist(u.x, u.y, h.x, h.y) > S.r + h.r * 0.5 || (s.hit.get(h) || -9) > w.time - S.tick) continue;
    s.hit.set(h, w.time);
    hurt(w, h, S.dmg * u.dmgMul, u, { noDodge: true, knock: S.knock, kAngle: angleTo(u.x, u.y, h.x, h.y) + 0.5 }); sparks(w, h.x, h.y, angleTo(u.x, u.y, h.x, h.y), 4, '#FFFFFF');
  }
  if (rand() < dt * 14) w.particles.push({ x: u.x + rrange(-20, 20), y: u.y + rrange(-20, 20), vx: rrange(-60, 60), vy: rrange(-60, 60), life: 0.4, max: 0.4, size: 6, color: 'rgba(205,176,137,0.7)' });
  if (s.t >= s.tell + S.dur) { // dizzy: he sways where he stopped, open to everything
    k.spin = null; stand(u, dt);
    beginHold(u, S.dizzy, null); setAnim(u, 'ability', S.dizzy);
    addBuff(u, { id: 'dizzy', dur: S.dizzy, taken: S.open }); bfx(w, { type: 'chiefDazed', u, max: S.dizzy });
  }
  return true;
}
function whistle(w, u) {
  setAnim(u, 'cast', 0.6); beginHold(u, 0.6, null);
  const ts = w.tunnels || [];
  for (let i = 0; i < CH.mice.n && crowd(w, u.team) < 20; i++) {
    const tn = ts.length ? ts[Math.floor(rand() * ts.length)] : { x: u.x, y: u.y, a: 0 };
    if (tn.openT != null) tn.openT = 1.2;
    const x = tn.x + Math.cos(tn.a - Math.PI / 2) * 30, y = tn.y + Math.sin(tn.a - Math.PI / 2) * 30;
    later(w, x, y, 0.5 + i * 0.25, () => { const m = spawn(w, 'dynamouse', x, y, { mult: w.mult, team: u.team }); m.aggro = true; m.court = true; m.minion = true; m.calledBy = u; });
  }
}
// The war drums (phase 2 on): each still standing beats, and every so often calls goblins out of the nearest tunnel
// (or from beside itself, in a room with no tunnels).
function drums(w, u, k, dt) {
  const ds = w.units.filter((o) => o.kind === 'warDrum' && alive(o) && o.drumOf === u);
  k.drumsUp = k.phase >= 2 ? ds.length : 0;
  for (const d of ds) {
    d.beatT = Math.max(0, (d.beatT || 0) - dt);
    if (!d.awake) continue;
    d.beatIn = (d.beatIn ?? rrange(0.2, 0.8)) - dt;
    if (d.beatIn <= 0) { d.beatIn = k.phase >= 4 ? 0.45 : 0.7; d.beatT = 0.25; }
    d.callT = (d.callT ?? rrange(3, 6)) - dt;
    if (d.callT > 0 || w.stale) continue;
    d.callT = CH.drum.every * rrange(0.9, 1.1);
    callFrom(w, u, d, CH.drum.calls);
  }
}
function callFrom(w, u, d, n) {
  const adds = w.units.filter((o) => o.court && alive(o) && o.kind !== 'dynamouse' && o.kind !== 'warDrum').length;
  if (adds >= CH.drum.cap) return;
  const ts = (w.tunnels || []).slice().sort((a, b) => dist(a.x, a.y, d.x, d.y) - dist(b.x, b.y, d.x, d.y)), tn = ts[0] || { x: d.x, y: d.y, a: Math.PI / 2 };
  tn.openT = 1.5;
  for (let i = 0; i < n; i++) {
    const x = tn.x + Math.cos(tn.a - Math.PI / 2) * 34 + rrange(-14, 14), y = tn.y + Math.sin(tn.a - Math.PI / 2) * 34 + rrange(-14, 14);
    later(w, x, y, 0.6 + i * 0.3, () => { const g = spawn(w, ADDS[Math.floor(rand() * ADDS.length)], x, y, { mult: w.mult, team: u.team }); g.aggro = true; g.court = true; g.minion = true; g.calledBy = u; g.facing = angleTo(x, y, w.W / 2, w.H / 2); puff(w, x, y, '#8E6A46', 8, 90, 6, 0.5); });
  }
}

// ---- phase turns
function enter(w, u, k, p) {
  notePhase(w, k); u.ch.spin = null; k.ch = null;
  const R = CH.roar, roar = (extra) => { addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: R.r, t: R.tell, team: u.team, src: u, kind: 'blade', quiet: true, hit: H(u, { dmg: R.dmg, knock: R.knock, stagger: R.stagger }),
    onFire: (w2) => { roarFx(w2, u, R.r); if (extra) extra(w2); } }); beginHold(u, R.tell + 0.5, null); setAnim(u, 'ability', R.tell + 0.5); };
  u.invulnT = R.tell + 0.4;
  if (p === 2) roar(() => { for (const d of w.units) if (d.kind === 'warDrum' && alive(d) && d.drumOf === u) { d.awake = true; d.ethereal = false; d.callT = rrange(1, 3); } }); // the war drums wake
  else if (p === 3) { roar(); again(u, 'spin', 1.2); }
  else if (p === 4) roar((w2) => { for (const d of w2.units) if (d.kind === 'warDrum' && alive(d) && d.drumOf === u) { d.beatT = 0.25; callFrom(w2, u, d, 2); } }); // the last stand: every drum calls at once
}
function death(w, u) {
  for (const o of w.units) if (alive(o) && (o.calledBy === u || o.drumOf === u)) { puff(w, o.x, o.y, '#BFA98A', 8, 80, 5, 0.4); kill(w, o, null); } // his drums burst, the goblins he called go with him
  roarFx(w, u, 200); puff(w, u.x, u.y, DUST, 30, 240, 8, 0.8);
}

// ---- the war camp: two chunks by two; the chief on his stage at the far end, four drums near the corners, two
// bonfire pillars, tunnel mouths in the side walls
function warcamp(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 200, y: Hh / 2 };
  w.stage = { x: W - 200, y: Hh / 2 };
  for (const [fx, fy] of [[0.42, 0.3], [0.42, 0.7]]) w.pillars.push({ x: W * fx, y: Hh * fy, r: 40 });
  w.tunnels = [[0.25, 0], [0.62, 0], [0.25, 1], [0.62, 1]].map(([fx, s]) => ({ x: W * fx, y: s ? Hh : 0, a: s ? 0 : Math.PI, openT: 0 }));
  w.arenaDecor = [[0.3, 0.45, 'firepit'], [0.72, 0.5, 'bonepile'], [0.55, 0.15, 'straw'], [0.55, 0.85, 'straw'], [0.15, 0.5, 'planks']].map(([fx, fy, type]) => ({ type, x: W * fx, y: Hh * fy, a: rand() * TAU, s: 1.2, v: 0 }));
  w.drumAt = [[0.6, 0.12], [0.6, 0.88], [0.86, 0.14], [0.86, 0.86]].map(([fx, fy]) => ({ x: W * fx, y: Hh * fy }));
  stage(w, 'chief', drawCampFloor, drawCampAir);
}

export const CHIEFTAIN = {
  defs: {
    chieftain: { team: 'enemy', name: 'The Goblin Chieftain', art: 'art/bosses/goblin-chieftain.svg', headR: 67, r: 50, vr: 38, turn: 2.4, accel: 160, face: 2.6, mass: 6,
      hp: 500, speed: 54, role: 'melee', range: 30, atkCd: 999, arc: 2, temp: 0.2, commit: 1.2, xp: 160, coins: [60, 80], boss: true, arena: 'warcamp', attackAnim: 'swing', style: { dual: true }, flashAt: 0.095,
      res: { stagger: 0.5, chill: 0.7, poison: 0.3 }, brain: (w, u, dt) => { if (!u.ch) placeDrums(w, u); return brain(w, u, dt); }, onDeath: death },
    // a war drum: stands where it's put, beats, calls goblins; smash it
    warDrum: PART('War Drum', { r: 30, vr: 30, hp: CH.drum.hp, mass: 40, draw: drawDrum }),
  },
  arenas: { warcamp },
};
// The drums go down with the room the first time the chief thinks (they're the room's, not his parts). In a room
// that isn't his camp (battle mode) they stand in a square round where he starts.
function placeDrums(w, u) {
  const at = w.drumAt || [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => inside(w, u.x + sx * 230, u.y + sy * 200, 50));
  for (const p of at) { const d = spawn(w, 'warDrum', p.x, p.y, { team: u.team }); d.maxHp = d.hp = Math.round(CH.drum.hp * Math.sqrt(w.mult || 1)); d.aggro = true; d.court = true; d.drumOf = u; d.dmgMul = 0; d.ethereal = true; d.shadowK = 0.8; } // quiet (not there to hit) until phase 2 wakes them
}
