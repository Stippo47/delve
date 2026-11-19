// Bosses: one per dungeon type is the goal; the Crypt's Bone King is the first (design: docs/BOSS-bone-king.md).
// A boss is an enemy def with boss: true and a brain that runs the whole fight (it always returns true): its own
// targeting, walking, attacks and phase turns. Its attacks are telegraphed with danger zones (sim.js addDanger),
// which the heroes steer out of. `arena` names the room layout dungeon.js builds for it.
import { alive, hurt, puff, sparks, goalVec, steer, drive, setAnim, addDanger, spawn, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { circleRect } from './path.js';

const turnTo = (u, a, rate, dt) => { u.facing = wrapAngle(u.facing + clamp(wrapAngle(a - u.facing), -rate * dt, rate * dt)); };
const stand = (u, dt) => { u.spd *= Math.exp(-dt * 10); u.dvx = Math.cos(u.mvA) * u.spd; u.dvy = Math.sin(u.mvA) * u.spd; };
const heroes = (w) => w.units.filter((o) => o.team === 'hero' && alive(o));

// ---------------------------------------------------------------- the Bone King
// Phases by health: 1 the Duel (cleave, grave lance), 2 the Court (adds from the graves, bone rows),
// 3 Unbound (blue crown fire: soul nova / soul ring, twin cleave, ghosts). Every attack: tell -> hit -> recovery.
const KING = {
  cleave: { r: 175, arc: 2.1, tell: 1.0, dmg: 18, rec: 0.9 },
  lance: { len: 460, hw: 36, tell: 1.3, dmg: 25, rec: 1.5, open: 0.35 },
  rows: { tell: 1.0, step: 50, r: 30, ripple: 0.07, len: 560, dmg: 12, rec: 0.9 },
  nova: { r: 160, tell: 2.0, dmg: 24, rec: 0.8 },
  ring: { r0: 170, r1: 380, tell: 1.7, dmg: 24, rec: 0.8 },
  leap: { r: 125, tell: 1.15, dmg: 18 },
  crown: { r: 200, tell: 0.9, dmg: 12 },
};
const WAKE = 380;

function kingBrain(w, u, dt) {
  const k = u.k || (u.k = { phase: 0, st: 'asleep', t: 0, cd: 1.2, cleaves: 0, last: null, tgtT: 0, addT: 8, ghostT: 6, novaNext: chance(0.5) });
  const speed = k.phase === 3 ? 0.8 : k.phase === 2 ? 0.92 : 1; // how long tells take
  const recK = k.phase === 3 ? 0.7 : 1;
  k.t -= dt; k.cd -= dt;

  // asleep on the throne until someone comes near or hurts him; then he rises
  if (k.st === 'asleep') {
    stand(u, dt);
    if (u.aggro || heroes(w).some((h) => dist(h.x, h.y, u.x, u.y) < WAKE)) {
      u.aggro = true; k.st = 'rise'; k.t = 1.0; setAnim(u, 'ability', 1.0);
      w.shake = Math.max(w.shake, 5); puff(w, u.x, u.y, '#CFC6B4', 18, 120, 7, 0.7);
    }
    return true;
  }
  if (k.st === 'rise') { stand(u, dt); if (k.t <= 0) { k.st = 'idle'; k.phase = 1; k.cd = 0.4; } return true; }

  // the court: graves keep opening while he's in phase 2 or 3
  if (k.phase >= 2) court(w, u, k, dt);

  // a busy state runs to its end
  if (k.st === 'tell' || k.st === 'act' || k.st === 'recover' || k.st === 'turn') {
    stand(u, dt);
    if (k.st === 'tell' && k.lock != null) turnTo(u, k.lock, 3, dt);
    if (k.st === 'act' && k.act) k.act(dt);
    if (k.t <= 0) {
      if (k.st === 'tell') { k.st = 'act'; k.t = k.actT || 0.25; }
      else if (k.st === 'act') { k.st = 'recover'; k.t = (k.rec || 0.6) * recK; k.act = null; if (k.after) { k.after(); k.after = null; } }
      else if (k.st === 'recover' || k.st === 'turn') { k.st = 'idle'; k.cd = rrange(0.7, 1.3) * recK; u.shield = null; u.shieldArc = null; k.lock = null; u.invulnT = 0; }
    }
    return true;
  }

  // phase turns happen between attacks
  const hp = u.hp / u.maxHp;
  if (k.phase === 1 && hp < 0.62) { turnToCourt(w, u, k); return true; }
  if (k.phase === 2 && hp < 0.3) { turnToUnbound(w, u, k); return true; }

  // who he wants: whoever is taunting him, else the nearest, rethought every second
  if ((k.tgtT -= dt) <= 0 || !u.target || !alive(u.target)) {
    k.tgtT = 1;
    const hs = heroes(w);
    if (u.tauntBy && u.tauntT > 0 && alive(u.tauntBy)) u.target = u.tauntBy;
    else { let best = null, bd = Infinity; for (const h of hs) { const d = dist(h.x, h.y, u.x, u.y) - (h === u.target ? 60 : 0); if (d < bd) { bd = d; best = h; } } u.target = best; }
  }
  const t = u.target;
  if (!t) { stand(u, dt); return true; }
  const d = dist(u.x, u.y, t.x, t.y), at = angleTo(u.x, u.y, t.x, t.y);
  turnTo(u, at, 2, dt);

  if (k.cd <= 0 && angleDiff(u.facing, at) < 0.5) {
    const far = heroes(w).filter((h) => dist(h.x, h.y, u.x, u.y) > 260);
    const close = d < KING.cleave.r + t.r * 0.5 - 10;
    let pick = null;
    if (k.phase === 3 && (k.soulCd ?? 0) <= w.time) pick = k.novaNext ? 'nova' : 'ring';
    else if (k.phase >= 2 && (k.rowsCd ?? 0) <= w.time && chance(0.45)) pick = 'rows';
    else if (close && (k.cleaves < 2 || !far.length)) pick = k.phase === 3 && chance(0.5) ? 'twin' : 'cleave';
    else if (!close || far.length) pick = 'lance';
    if (pick) { start(w, u, k, pick, speed, far.length && pick === 'lance' && !close ? far[Math.floor(rand() * far.length)] : t); return true; }
  }
  // walk at the one he wants, into cleaving distance
  const want = d > KING.cleave.r * 0.7;
  const [gx, gy] = want ? goalVec(w, u, t.x, t.y) : [0, 0];
  const [sx, sy] = steer(w, u, gx, gy);
  drive(u, sx, sy, want ? u.def.speed : 0, dt);
  return true;
}

function begin(u, k, tell, rec, lock) { k.st = 'tell'; k.t = tell; k.rec = rec; k.lock = lock; k.actT = 0.25; }

function start(w, u, k, what, speed, t) {
  const a = angleTo(u.x, u.y, t.x, t.y);
  k.last = what;
  if (what === 'cleave') {
    k.cleaves++;
    const c = KING.cleave;
    begin(u, k, c.tell * speed, c.rec, a); u.facing = wrapAngle(u.facing + clamp(wrapAngle(a - u.facing), -0.4, 0.4));
    cleaveZone(w, u, u.facing, c.arc, c.tell * speed);
    setAnim(u, 'swing', c.tell * speed + 0.25);
  } else if (what === 'twin') {
    k.cleaves++;
    const c = KING.cleave, t1 = c.tell * speed * 0.85, gap = 0.55;
    begin(u, k, t1 + gap, c.rec * 1.2, null); u.facing = a;
    cleaveZone(w, u, a - 0.55, 1.9, t1);
    cleaveZone(w, u, a + 0.55, 1.9, t1 + gap);
    setAnim(u, 'swing', t1 + 0.2);
    k.after = null; setTimeoutAnim(u, 'swing', t1 + 0.05, gap + 0.2);
  } else if (what === 'lance') {
    k.cleaves = 0;
    const L = KING.lance, tell = L.tell * speed;
    const end = lanceEnd(w, u, a, L.len);
    begin(u, k, tell, L.rec, a); u.facing = a;
    setAnim(u, 'thrust', tell + 0.3);
    const z = addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: end.x, y2: end.y, hw: L.hw, t: tell, team: u.team, src: u, kind: 'bone',
      onFire: (w2, z2) => {
        for (const o of heroes(w2)) {
          const side = Math.sign(Math.sin(angleTo(z2.x1, z2.y1, o.x, o.y) - a)) || (chance(0.5) ? 1 : -1);
          if (inLine(z2, o)) hurt(w2, o, L.dmg * u.dmgMul, u, { noDodge: true, knock: 300, kAngle: a + side * 1.25, heavy: true });
        }
      } });
    // the lunge itself: he slides down the line, then the sword sticks in the floor and he's open
    k.actT = 0.24;
    const sx = u.x, sy = u.y, ex = end.x - Math.cos(a) * u.r * 0.6, ey = end.y - Math.sin(a) * u.r * 0.6;
    let p = 0;
    k.act = (dt) => {
      p = Math.min(1, p + dt / 0.24);
      const e = 1 - (1 - p) * (1 - p);
      u.x = sx + (ex - sx) * e; u.y = sy + (ey - sy) * e; u.vx = u.vy = 0;
      if (rand() < 0.7) w.particles.push({ x: u.x - Math.cos(a) * u.r, y: u.y - Math.sin(a) * u.r, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 9, color: 'rgba(214,206,190,0.75)' });
    };
    k.after = () => {
      u.shield = -L.open; u.shieldArc = Math.PI + 0.1; // stuck: every hit lands harder
      w.shake = Math.max(w.shake, 6);
      sparks(w, u.x + Math.cos(a) * (u.r + 30), u.y + Math.sin(a) * (u.r + 30), a + Math.PI, 8, '#FFE7A0', 1.3);
      puff(w, u.x + Math.cos(a) * (u.r + 30), u.y + Math.sin(a) * (u.r + 30), '#BDB4A6', 12, 110, 6, 0.6);
    };
    void z;
  } else if (what === 'rows') {
    const R = KING.rows, tell = R.tell * speed;
    k.rowsCd = w.time + rrange(7, 9);
    begin(u, k, tell + 0.4, R.rec, null);
    setAnim(u, 'ability', tell + 0.3);
    // three rows: at up to three heroes, else fanned round the one he wants
    const hs = heroes(w).sort((p, q) => dist(p.x, p.y, u.x, u.y) - dist(q.x, q.y, u.x, u.y)).slice(0, 3);
    const angs = hs.map((h) => angleTo(u.x, u.y, h.x, h.y));
    while (angs.length < 3) angs.push(a + (angs.length === 1 ? -0.5 : 0.5));
    for (const ra of angs) {
      for (let i = 0, dd = u.r + 34; dd < R.len; i++, dd += R.step) {
        const x = u.x + Math.cos(ra) * dd, y = u.y + Math.sin(ra) * dd;
        if (x < 10 || y < 10 || x > w.W - 10 || y > w.H - 10 || w.walls.some((r) => circleRect(x, y, 6, r))) break;
        addDanger(w, { shape: 'circle', x, y, r: R.r, t: tell + i * R.ripple, team: u.team, src: u, kind: 'bone',
          hit: { dmg: R.dmg * u.dmgMul, knock: 130, kAngle: ra, stagger: 35 },
          onFire: (w2, z) => { spikeBurst(w2, z.x, z.y); } });
      }
    }
  } else if (what === 'nova' || what === 'ring') {
    const N = what === 'nova' ? KING.nova : KING.ring, tell = N.tell; // the soul attacks keep their full tell: they're the ones to read
    k.soulCd = w.time + rrange(6.5, 8); k.novaNext = what !== 'nova';
    begin(u, k, tell, N.rec, null);
    setAnim(u, 'cast', tell + 0.2);
    const hit = { dmg: N.dmg * u.dmgMul, chill: 45, knock: 210 };
    const fire = (w2, z) => { w2.shake = Math.max(w2.shake, 7); soulBurst(w2, z); };
    if (what === 'nova') addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: N.r, t: tell, team: u.team, src: u, kind: 'soul', hit, onFire: fire });
    else addDanger(w, { shape: 'ring', x: u.x, y: u.y, r0: N.r0, r1: N.r1, t: tell, team: u.team, src: u, kind: 'soul', hit: { ...hit, knock: 160 }, onFire: fire });
  }
}

// The second swing of a twin cleave: re-arm the arm animation part-way through the tell.
function setTimeoutAnim(u, kind, at, dur) { u.k.anim2 = { at, kind, dur, t: 0 }; }

function cleaveZone(w, u, a, arc, tell) {
  const c = KING.cleave;
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a, arc, r: c.r, t: tell, team: u.team, src: u, kind: 'bone',
    hit: { dmg: c.dmg * u.dmgMul, knock: 260, heavy: true },
    onFire: (w2, z) => { w2.shake = Math.max(w2.shake, 5); for (let i = -2; i <= 2; i++) sparks(w2, z.x + Math.cos(z.a + i * 0.35) * z.r * 0.8, z.y + Math.sin(z.a + i * 0.35) * z.r * 0.8, z.a + i * 0.35, 2, '#FFFFFF'); } });
}

function inLine(z, o) {
  const dx = z.x2 - z.x1, dy = z.y2 - z.y1, L2 = dx * dx + dy * dy || 1;
  const k = clamp(((o.x - z.x1) * dx + (o.y - z.y1) * dy) / L2, 0, 1);
  return dist(o.x, o.y, z.x1 + dx * k, z.y1 + dy * k) < z.hw + o.r * 0.5;
}

// Where a lance stops: its full length, or the first pillar or wall in the way (the safe shadow behind it).
function lanceEnd(w, u, a, len) {
  let d = u.r;
  for (; d < len; d += 10) {
    const x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d;
    if (x < u.r * 0.6 || y < u.r * 0.6 || x > w.W - u.r * 0.6 || y > w.H - u.r * 0.6) break;
    if (w.pillars.some((p) => dist(x, y, p.x, p.y) < p.r + 22)) break;
    if (w.walls.some((r) => circleRect(x, y, 22, r))) break;
  }
  return { x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d };
}

function spikeBurst(w, x, y) {
  for (let i = 0; i < 5; i++) { const b = rand() * TAU; w.particles.push({ shape: 'spark', x, y, vx: Math.cos(b) * 160, vy: Math.sin(b) * 160, life: 0.2, max: 0.2, size: 4, color: '#F1E8D2', drag: 0.85 }); }
  w.fx.push({ type: 'spike', x, y, r: 26, t: 0, max: 0.7 });
}
function soulBurst(w, z) {
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, r = z.shape === 'ring' ? rrange(z.r0, z.r1) : rrange(z.r * 0.3, z.r);
    w.particles.push({ x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, rise: 50, life: 0.7, max: 0.7, size: 7, color: '#9FE4FF' });
  }
}

// ---- phase turns
function turnToCourt(w, u, k) {
  k.phase = 2; k.st = 'turn'; k.t = 2.6; u.invulnT = 2.6; k.lock = null;
  setAnim(u, 'ability', 1.2);
  const th = w.throne || { x: w.W - 170, y: w.H / 2 };
  const L = KING.leap, sx = u.x, sy = u.y;
  addDanger(w, { shape: 'circle', x: th.x, y: th.y, r: L.r, t: L.tell, team: u.team, src: u, kind: 'bone',
    hit: { dmg: L.dmg * u.dmgMul, knock: 300, heavy: true },
    onFire: (w2) => { w2.shake = Math.max(w2.shake, 10); puff(w2, th.x, th.y, '#CFC6B4', 26, 260, 8, 0.7); crackGraves(w2, u, 1); } });
  let p = 0;
  k.act = null;
  k.turnMove = (dt) => { p = Math.min(1, p + dt / L.tell); const e = p * p * (3 - 2 * p); u.x = sx + (th.x - sx) * e; u.y = sy + (th.y - sy) * e; };
  k.st = 'turn'; k.actTurn = true;
  u.kTurn = k.turnMove;
}
function turnToUnbound(w, u, k) {
  k.phase = 3; k.st = 'turn'; k.t = 1.6; u.invulnT = 1.6; k.lock = null; k.soulCd = w.time + 2.5;
  setAnim(u, 'cast', 1.2);
  const C = KING.crown;
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: C.r, t: C.tell, team: u.team, src: u, kind: 'soul',
    hit: { dmg: C.dmg * u.dmgMul, knock: 360, chill: 20 },
    onFire: (w2, z) => { w2.shake = Math.max(w2.shake, 9); soulBurst(w2, z); w2.mood = 'unbound'; u.crown = true; } });
}

// Graves: a circle fills on the grave, then it bursts and n of his court climb out.
function crackGraves(w, u, n, only) {
  const graves = (w.graves || []).filter((g) => !only || g === only);
  for (const g of graves) {
    addDanger(w, { shape: 'circle', x: g.x, y: g.y, r: 62, t: 0.9, team: u.team, src: u, kind: 'bone', hit: { dmg: 10 * u.dmgMul, knock: 220 },
      onFire: (w2) => {
        g.open = true;
        puff(w2, g.x, g.y, '#BDB4A6', 16, 150, 7, 0.6);
        for (let i = 0; i < n; i++) {
          const kinds = w2.bossAdds || ['rattler'];
          const kind = typeof n === 'number' && g.ghost ? 'ghost' : kinds[Math.floor(rand() * kinds.length)];
          const a = spawn(w2, kind, g.x + rrange(-20, 20), g.y + rrange(-20, 20), { mult: w2.mult }); a.aggro = true; a.court = true;
          a.facing = angleTo(a.x, a.y, w2.W / 2, w2.H / 2);
        }
        g.ghost = false;
      } });
  }
}
function court(w, u, k, dt) {
  const adds = w.units.filter((o) => o.court && alive(o)).length;
  k.addT -= dt;
  if (k.addT <= 0 && adds < 2 && (w.graves || []).length) { k.addT = 14; crackGraves(w, u, 2, w.graves[Math.floor(rand() * w.graves.length)]); }
  if (k.phase === 3) {
    k.ghostT -= dt;
    if (k.ghostT <= 0 && adds < 5 && (w.graves || []).length) { k.ghostT = 10; const g = w.graves[Math.floor(rand() * w.graves.length)]; g.ghost = true; crackGraves(w, u, 1, g); }
  }
}

// When he falls, his court falls with him.
function kingDeath(w, u) {
  w.mood = null;
  for (const o of w.units) if (o.court && alive(o)) kill(w, o, null);
  for (let i = 0; i < 40; i++) { const a = rand() * TAU, v = rrange(60, 260); w.particles.push({ x: u.x, y: u.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9, max: 0.9, size: rrange(4, 8), color: chance(0.2) ? '#9FE4FF' : '#EDE4CD' }); }
  (w.remains = w.remains || []).push({ kind: 'king', x: u.x, y: u.y, a: u.facing });
  w.shake = Math.max(w.shake, 12);
}

export const BOSSES = {
  boneKing: {
    team: 'enemy', name: 'The Bone King', art: 'art/bosses/bone-king.svg', headR: 50, r: 56, vr: 38, turn: 2, accel: 120, face: 2, mass: 6,
    hp: 950, speed: 46, role: 'melee', range: 30, atkCd: 999, arc: 2, temp: 0.2, commit: 1.4, xp: 160, coins: [60, 80], boss: true,
    res: { poison: 0.3, burn: 0.6, chill: 0.5 }, arena: 'throne',
    brain: (w, u, dt) => {
      const k = u.k;
      if (k && k.st === 'turn' && u.kTurn) u.kTurn(dt);
      if (k && k.anim2) { k.anim2.t += dt; if (k.anim2.t >= k.anim2.at) { setAnim(u, k.anim2.kind, k.anim2.dur); k.anim2 = null; } }
      return kingBrain(w, u, dt);
    },
    onDeath: kingDeath,
  },
};
