// The Goblin Chieftain: the Warren's boss (floor 3). Design and numbers: docs/BOSS-chieftain.md. The designer (round 9,
// the Warboss card): "Chieftain. More abilities." From the roster: charges, a spinning cleaver, and war drums round
// the room that call waves until they're smashed; from the Warren deck note: spears that come back, and dynamite mice
// ("the boss could summon them").
// Art: art round 9's Goblin Chieftain (art/bosses/goblin-chieftain.svg, design/class-round9); the drums are drawn in code (fx-boss.js).
import { alive, hurt, puff, sparks, setAnim, addDanger, addBuff, spawn, kill } from './sim.js';
import { TAU, dist, angleTo, rand, rrange, chance } from './util.js';
import { lob, cone, line, around, hold, beginHold, due, again, crowd, stand, turnTo, later } from './elites.js';
import { walkTo, courtFalls } from './enemies.js';
import { variantUrl } from './recolor.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, farthest, randomHero, lead, clipLine, charge, chargeTick, thud, part, PART, logOf, notePhase, deathBurst, inside } from './boss-kit.js';
import { drawDrum, drawWarcamp, drawSpears } from './fx-boss.js';

// Every move: a tell (a shape fills on the ground), the hit, a recovery (the hold: the party's window).
export const CH = {
  chop: { r: 175, arc: 1.9, tell: 0.85, dmg: 30, knock: 280, rec: 0.7 },
  charge: { len: 620, tell: 0.85, dmg: 34, knock: 340, dazed: 1.7, open: 1.35, rec: 0.5 },
  spear: { len: 640, hw: 26, tell: 0.75, dmg: 22, back: 0.5, rec: 0.35 },
  roar: { r: 230, tell: 0.9, dmg: 10, stagger: 40, knock: 300 },
  drum: { every: 14, calls: 2, cap: 5, hp: 110, haste: 0.06 },
  mice: { n: 3, every: 11 },
  spin: { dur: 2.4, r: 105, step: 0.32, dmg: 13, knock: 230, dizzy: 1.5, open: 1.35 },
  bombs: { n: 5, r: 72, tell: 1.0, dmg: 19, burn: 28 },
};
export const PHASE_AT = [1, 0.7, 0.45, 0.2];
const WAKE = 430;
const ADDS = ['goblin', 'goblin', 'goblinSpear', 'hobgoblin', 'goblinBomber'];

function brain(w, u, dt) {
  const k = u.ch || (u.ch = { phase: 0 });
  steady(u); logOf(w, u, k);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 0.9, null); setAnim(u, 'ability', 0.9); thud(w, u.x, u.y, '#CDB089', 18, 6); notePhase(w, k); })) return true;
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
  // up close: the chop
  if (gap < 110 && due(u, 'chop', dt, 0.6)) {
    again(u, 'chop', 2.2 * K, 3.2 * K);
    cone(w, u, at, { r: CH.chop.r, arc: CH.chop.arc, tell: CH.chop.tell * K, kind: 'blade', anim: 'swing', after: CH.chop.rec, hit: { dmg: CH.chop.dmg, knock: CH.chop.knock, heavy: true } });
    return true;
  }
  // phase 3 on: the cleaver spin, at whoever he wants
  if (k.phase >= 3 && due(u, 'spin', dt, 2)) { again(u, 'spin', (k.phase >= 4 ? 7 : 10) * K, (k.phase >= 4 ? 9 : 12) * K); startSpin(w, u, k); return true; }
  // phase 3 on: a barrage of bombs lobbed round the heroes
  if (k.phase >= 3 && due(u, 'bombs', dt, 4)) { again(u, 'bombs', 9 * K, 11 * K); bombs(w, u, K); return true; }
  // phase 2 on: a whistle, and dynamite mice come running out of the tunnels
  if (k.phase >= 2 && due(u, 'mice', dt, 3)) { again(u, 'mice', CH.mice.every * K, (CH.mice.every + 3) * K); whistle(w, u); return true; }
  // the charge: at the one furthest off, or the one he wants when they're out of reach
  if (due(u, 'charge', dt, 3) && (gap > 140 || chance(0.3))) {
    again(u, 'charge', 6.5 * K, 8.5 * K);
    const who = gap > 140 ? t : farthest(w, u) || t;
    startCharge(w, u, k, who, K, k.phase >= 4);
    return true;
  }
  // the spear: thrown down a line, and it flies straight back to his hand
  if (due(u, 'spear', dt, 2) && gap > 90) {
    again(u, 'spear', 4.5 * K, 6 * K);
    spear(w, u, farthest(w, u) || t, K);
    return true;
  }
  if (gap > 30) walkTo(w, u, t.x, t.y, 1, dt); else stand(u, dt);
  turnTo(u, at, 3, dt);
  return true;
}

// ---- moves
function startCharge(w, u, k, t, K, pair) {
  const p = lead(t, 0.35), a = angleTo(u.x, u.y, p.x, p.y);
  setAnim(u, 'ability', CH.charge.tell * K + 0.6);
  const end = () => { if (pair && !k.secondCharge && heroesOf(w, u).length > 1) { k.secondCharge = true; const o = randomHero(w, u, t); if (o) { startCharge(w, u, k, o, K * 0.8, true); return; } } k.secondCharge = false; beginHold(u, CH.charge.rec, null); };
  charge(w, u, k, a, CH.charge.len, { tell: CH.charge.tell * K, dmg: CH.charge.dmg, knock: CH.charge.knock, speed: 640, kind: 'blade', trail: 'rgba(205,176,137,0.8)',
    onEnd: end,
    onWall: () => { // into a wall or a pillar: he staggers, dazed and open
      k.secondCharge = false;
      thud(w, u.x + Math.cos(a) * u.r, u.y + Math.sin(a) * u.r, '#CDB089', 20, 8);
      beginHold(u, CH.charge.dazed, null); setAnim(u, 'ability', CH.charge.dazed);
      addBuff(u, { id: 'dazed', dur: CH.charge.dazed, taken: CH.charge.open });
      u.dazedT = CH.charge.dazed;
    } });
}
function spear(w, u, t, K) {
  const p = lead(t, 0.3), a = angleTo(u.x, u.y, p.x, p.y), S = CH.spear, tell = S.tell * K;
  const end = clipLine(w, u.x, u.y, a, S.len, 14, u.r);
  const hit = H(u, { dmg: S.dmg, knock: 160, kAngle: a });
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: end.x, y2: end.y, hw: S.hw, t: tell, team: u.team, src: u, kind: 'blade', hit,
    onFire: (w2, z) => {
      (w2.spears || (w2.spears = [])).push({ x1: z.x1, y1: z.y1, x2: z.x2, y2: z.y2, t: 0, dur: 0.22 });
      // it comes straight back: the same line again, from the far end to his hand
      addDanger(w2, { shape: 'line', x1: z.x2, y1: z.y2, x2: u.x, y2: u.y, hw: S.hw, t: S.back, team: u.team, src: u, kind: 'blade', hit: { ...hit, kAngle: a + Math.PI },
        onFire: (w3, z2) => { (w3.spears || (w3.spears = [])).push({ x1: z2.x1, y1: z2.y1, x2: z2.x2, y2: z2.y2, t: 0, dur: 0.2 }); } });
    } });
  beginHold(u, tell + S.rec, a); setAnim(u, 'throw', tell + 0.2);
}
function startSpin(w, u, k) {
  k.spin = { t: CH.spin.dur, tick: 0 }; setAnim(u, 'ability', CH.spin.dur);
  around(w, u, { r: CH.spin.r, tell: 0.6, kind: 'blade', hit: { dmg: CH.spin.dmg, knock: CH.spin.knock } }); // the wind-up: the first circle, standing
  beginHold(u, 0.6, null);
}
function spinTick(w, u, k, dt) {
  const s = k.spin; if (!s) return false;
  if (hold(u, dt)) return true; // the wind-up
  s.t -= dt; s.tick -= dt;
  u.facing += 16 * dt;
  const t = pickTarget(w, u, k, dt);
  if (t) walkTo(w, u, t.x, t.y, 0.8, dt); else stand(u, dt);
  if (s.tick <= 0) {
    s.tick = CH.spin.step;
    const ax = u.x + (u.vx || 0) * CH.spin.step, ay = u.y + (u.vy || 0) * CH.spin.step;
    addDanger(w, { shape: 'circle', x: ax, y: ay, r: CH.spin.r, t: CH.spin.step, team: u.team, src: u, kind: 'blade', hit: H(u, { dmg: CH.spin.dmg, knock: CH.spin.knock }),
      onFire: (w2, z) => { for (let i = 0; i < 3; i++) sparks(w2, z.x + Math.cos(u.facing + i * 2) * z.r * 0.8, z.y + Math.sin(u.facing + i * 2) * z.r * 0.8, u.facing + i * 2 + 1.5, 1, '#FFFFFF'); } });
  }
  if (s.t <= 0) { // dizzy: he sways where he stopped, open to everything
    k.spin = null; stand(u, dt);
    beginHold(u, CH.spin.dizzy, null); setAnim(u, 'ability', CH.spin.dizzy);
    addBuff(u, { id: 'dizzy', dur: CH.spin.dizzy, taken: CH.spin.open }); u.dazedT = CH.spin.dizzy;
  }
  return true;
}
function bombs(w, u, K) {
  const hs = heroesOf(w, u);
  for (let i = 0; i < CH.bombs.n && hs.length; i++) {
    const h = hs[i % hs.length], off = i < hs.length ? 0 : rrange(70, 150), a = rand() * TAU, p = lead(h, 0.5);
    const q = inside(w, p.x + Math.cos(a) * off, p.y + Math.sin(a) * off);
    lob(w, u, q.x, q.y, { r: CH.bombs.r, tell: CH.bombs.tell * K + i * 0.14, kind: 'fire', proj: 'cluster', color: '#4A4247', dust: '#3B3330',
      hit: { dmg: CH.bombs.dmg, burn: CH.bombs.burn, knock: 180 }, land: (w2, z) => { thud(w2, z.x, z.y, '#5A4A44', 10, 4); for (let j = 0; j < 4; j++) sparks(w2, z.x, z.y, rand() * TAU, 1, '#FFB347'); } });
  }
  beginHold(u, 0.7, null); setAnim(u, 'throw', 0.5);
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
// The war drums (phase 2 on): each still standing beats, and every so often calls goblins out of the nearest tunnel.
function drums(w, u, k, dt) {
  const ds = w.units.filter((o) => o.kind === 'warDrum' && alive(o));
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
  const adds = w.units.filter((o) => o.court && alive(o) && o.kind !== 'dynamouse').length;
  if (adds >= CH.drum.cap) return;
  const ts = (w.tunnels || []).slice().sort((a, b) => dist(a.x, a.y, d.x, d.y) - dist(b.x, b.y, d.x, d.y)), tn = ts[0];
  if (!tn) return;
  tn.openT = 1.5;
  for (let i = 0; i < n; i++) {
    const x = tn.x + Math.cos(tn.a - Math.PI / 2) * 34 + rrange(-14, 14), y = tn.y + Math.sin(tn.a - Math.PI / 2) * 34 + rrange(-14, 14);
    later(w, x, y, 0.6 + i * 0.3, () => { const g = spawn(w, ADDS[Math.floor(rand() * ADDS.length)], x, y, { mult: w.mult, team: u.team }); g.aggro = true; g.court = true; g.facing = angleTo(x, y, w.W / 2, w.H / 2); puff(w, x, y, '#8E6A46', 8, 90, 6, 0.5); });
  }
}

// ---- phase turns
function enter(w, u, k, p) {
  notePhase(w, k); u.ch.spin = null; k.ch = null;
  const roar = (extra) => around(w, u, { r: CH.roar.r, tell: CH.roar.tell, kind: 'blade', after: 0.5, hit: { dmg: CH.roar.dmg, knock: CH.roar.knock, stagger: CH.roar.stagger },
    fire: (w2, z) => { thud(w2, z.x, z.y, '#CDB089', 24, 9); if (extra) extra(w2); } });
  u.invulnT = CH.roar.tell + 0.4;
  if (p === 2) roar(() => { for (const d of w.units) if (d.kind === 'warDrum' && alive(d)) { d.awake = true; d.ethereal = false; d.callT = rrange(1, 3); } }); // the war drums wake
  else if (p === 3) { roar(); again(u, 'spin', 1.2); }
  else if (p === 4) roar((w2) => { for (const d of w2.units) if (d.kind === 'warDrum' && alive(d)) { d.beatT = 0.25; callFrom(w2, u, d, 2); } }); // the last stand: every drum calls at once
}
function death(w, u) {
  courtFalls(w);
  for (const d of w.units) if (d.kind === 'warDrum' && alive(d)) kill(w, d, null);
  deathBurst(w, u, ['#CDB089', '#8E6A46', '#F2A23A']);
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
  w.arenaDraw = (ctx, w2) => { drawWarcamp(ctx, w2); for (const t of w2.tunnels) t.openT = Math.max(0, t.openT - (w2._dt || 0.016)); };
  w.arenaAir = (ctx, w2) => { if (w2.spears) { for (const s of w2.spears) s.t += w2._dt || 0.016; w2.spears = w2.spears.filter((s) => s.t < s.dur); drawSpears(ctx, w2); } };
  w.onBossSpawn = null;
}

export const CHIEFTAIN = {
  defs: {
    chieftain: { team: 'enemy', name: 'The Goblin Chieftain', art: 'art/bosses/goblin-chieftain.svg', headR: 67, r: 50, vr: 38, turn: 2.4, accel: 160, face: 2.6, mass: 6,
      hp: 1300, speed: 54, role: 'melee', range: 30, atkCd: 999, arc: 2, temp: 0.2, commit: 1.2, xp: 160, coins: [60, 80], boss: true, arena: 'warcamp', attackAnim: 'swing',
      res: { stagger: 0.5, chill: 0.7, poison: 0.3 }, brain: (w, u, dt) => { if (!u.ch) placeDrums(w, u); return brain(w, u, dt); }, onDeath: death },
    // a war drum: stands where it's put, beats, calls goblins; smash it
    warDrum: PART('War Drum', { r: 30, vr: 30, hp: CH.drum.hp, mass: 40, draw: drawDrum }),
  },
  arenas: { warcamp },
};
// The drums go down with the room the first time the chief thinks (they're the room's, not his parts).
function placeDrums(w, u) {
  for (const p of w.drumAt || []) { const d = spawn(w, 'warDrum', p.x, p.y, { team: u.team }); d.maxHp = d.hp = Math.round(CH.drum.hp * Math.sqrt(w.mult || 1)); d.aggro = true; d.court = true; d.dmgMul = 0; d.ethereal = true; } // quiet (not there to hit) until phase 2 wakes them
}
