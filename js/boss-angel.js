// The Gilded Seraph, remade as a biblically accurate angel: the Gilded Spire's boss (floor 3). Design and numbers:
// docs/BOSS-gilded-seraph.md. The designer, round 12: "I want one of those biblically accurate angels. 1 of it's
// abilities shoukd have horns. 4 chains from the corner of arena shoot out and if they hit something they drag them
// towards that corner. The quality of this boss that was made was poor".
// A great eye in a gold socket, two wheels set with eyes turning against each other, six wings (the art lane's round 10
// sprite: art/bosses/biblical-angel.svg; its wheels are the rig's two arms, turned by ANGEL_POSE below).
// The horns are trumpets (the lane's reading of "horns" on an angel): four of them stand round it and sound.
// The kind keeps the id gildedSeraph (the Spire's theme, the Book and saves name it).
import { alive, hurt, puff, sparks, setAnim, addDanger, addBuff, spawn, fx, kill, addStatus } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lob, hold, beginHold, due, again, stand, turnTo, openSpot, crowd } from './elites.js';
import { walkTo } from './enemies.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, randomHero, lead, clipLine, part, endParts, PART, place, logOf, notePhase, inside, stage, bfx, liveZone, keepZone, canDrag, holdFast, TEST_MOVE } from './boss-kit.js';
import { drawHorn, drawSanctumFloor, drawSanctumAir } from './boss-angel-fx.js';

export const AN = {
  smite: { r: 78, tell: 0.95, dmg: 39, glow: 18, cd: [2.8, 3.6] },
  wheels: { rings: [[150, 290, 1.35], [290, 430, 2.15]], inner: [0, 150, 2.9], dmg: 57, glow: 28, knock: 240, cd: [10.5, 12.5] },
  chains: { tell: 1.15, speed: 1500, hw: 22, reach: 980, dmg: 29, drag: 540, shackle: 0.9, cd: [13, 15.5], again: 1.3 },
  horns: { n: 4, out: 104, hpK: 0.032, arc: 1.0, r: 470, tell: 5.2, dmg: 73, glow: 40, knock: 430, cd: [21, 25] },
  host: { n: 2, hpK: 0.045, taken: 0.5, every: 30, note: { r: 60, dmg: 16, glow: 16 } },
  gaze: { arc: 1.5, r: 540, tell: 1.2, dur: 5, turn: 0.5, tick: 0.25, dmg: 7.8, glow: 13, cd: [15, 18] },
  burst: { r: 220, tell: 0.9, dmg: 16, glow: 20, knock: 320 },
};
export const PHASE_AT = [1, 0.6, 0.3];
const WAKE = 480, GOLD = '#FFE7A0';

function brain(w, u, dt) {
  const k = u.an || (u.an = { phase: 0, t: 0, chains: [], horns: [], spin: 1, wheelsOut: 0, eye: 0.6 });
  steady(u); logOf(w, u, k); stage(w, 'angel', drawSanctumFloor, drawSanctumAir);
  k.t += dt; k.spin += ((k.cast > 0 ? 3.2 : 1) - k.spin) * Math.min(1, dt * 3); if (k.cast > 0) k.cast -= dt; if (k.wheelsOut > 0) k.wheelsOut -= dt;
  chainsTick(w, u, k, dt);
  if (k.hornEnd > 0 && (k.hornEnd -= dt) <= 0) { for (const h of k.horns) if (alive(h)) { h.partOf = null; kill(w, h, null); } k.horns = []; } // the horns go, a beat after they sound
  hostTick(w, u, k, dt);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.0, null); k.cast = 1; flare(w, u.x, u.y); notePhase(w, k); })) return true;
  if (TEST_MOVE && !k.tested) { k.tested = true;
    if (TEST_MOVE === 'chains') again(u, 'chains', 0.8);
    if (TEST_MOVE === 'wheels') again(u, 'wheels', 0.8);
    if (TEST_MOVE === 'horns') { k.phase = Math.max(2, k.phase); again(u, 'horns', 0.8); again(u, 'chains', 30); again(u, 'wheels', 30); }
    if (TEST_MOVE === 'gaze') { k.phase = 3; again(u, 'gaze', 0.8); again(u, 'chains', 30); again(u, 'horns', 40); again(u, 'wheels', 30); } }
  if (gazeTick(w, u, k, dt)) return true;
  if (hornsTick(w, u, k, dt)) return true;
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const at = angleTo(u.x, u.y, t.x, t.y), hs = heroesOf(w, u), K = k.phase >= 3 ? 0.85 : 1;
  k.look = at;
  if (k.phase >= 3 && due(u, 'gaze', dt, 3)) { again(u, 'gaze', ...AN.gaze.cd); startGaze(w, u, k, at); return true; }
  if (k.phase >= 2 && due(u, 'horns', dt, 4)) { again(u, 'horns', ...AN.horns.cd); startHorns(w, u, k, at); return true; }
  if (due(u, 'chains', dt, 5) && !k.chains.length) { again(u, 'chains', ...AN.chains.cd.map((x) => x * K)); chains(w, u, k, hs); if (k.phase >= 3) k.chainAgain = AN.chains.again + AN.chains.tell; k.cast = 1.2; beginHold(u, 0.9, null); return true; }
  if (due(u, 'wheels', dt, 3)) { again(u, 'wheels', ...AN.wheels.cd.map((x) => x * K)); wheels(w, u, k); return true; }
  if (due(u, 'smite', dt, 1.5)) { again(u, 'smite', ...AN.smite.cd.map((x) => x * K)); smite(w, u, k, t); if (k.phase >= 3 && hs.length > 1) smite(w, u, k, randomHero(w, u, t)); }
  // it hangs between the middle of the hall and its mark, drifting; it turns its eye on whoever it wants
  const gx = w.W / 2 + (t.x - w.W / 2) * 0.4, gy = w.H / 2 + (t.y - w.H / 2) * 0.4;
  if (dist(u.x, u.y, gx, gy) > 60 && dist(u.x, u.y, t.x, t.y) > 170) walkTo(w, u, gx, gy, 1, dt); else stand(u, dt);
  turnTo(u, at, 2.2, dt);
  return true;
}
// how its sprite is posed (parts.js poseFor: def.pose): the wheels turn against each other, the wings sway
export function ANGEL_POSE(u, w) {
  const k = u.an || {}, a = (k.spinA = (k.spinA || 0) + (w._dt || 0.016) * 0.9 * (k.spin || 1));
  const hide = k.wheelsOut > 0;
  return { 'arm-l': { r: a, hide }, 'arm-r': { r: -a * 1.12, hide }, back: { r: Math.sin(w.time * 1.6) * 0.07 + (k.cast > 0 ? Math.sin(w.time * 14) * 0.03 : 0) }, pop: k.cast > 0 ? 0.6 : 0 };
}
function flare(w, x, y) { puff(w, x, y, GOLD, 16, 180, 7, 0.6); for (let i = 0; i < 6; i++) sparks(w, x, y, i / 6 * TAU, 1, '#FFFBEA'); w.shake = Math.max(w.shake, 4); }

// ---- Smite: a pillar of light on a hero
function smite(w, u, k, t) {
  if (!t) return; const S = AN.smite, p = lead(t, 0.5), q = inside(w, p.x, p.y, 40);
  addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: S.r, t: S.tell, team: u.team, src: null, kind: 'holy', hit: H(u, { dmg: S.dmg, radiance: S.glow, knock: 90 }),
    onFire: (w2, z) => { fx(w2, { type: 'pillar', x: z.x, y: z.y, r: z.r * 0.7, kind: 'holy', max: 0.55 }); } });
  k.cast = Math.max(k.cast || 0, 0.5);
}
// ---- Wheel Within a Wheel: its two wheels fly out as hoops and come down, the nearer first, then the further
function wheels(w, u, k) {
  const W = AN.wheels, list = k.phase >= 3 ? [...W.rings, W.inner] : W.rings;
  list.forEach(([r0, r1, tell], i) => {
    const z = r0 > 0 ? { shape: 'ring', x: u.x, y: u.y, r0, r1 } : { shape: 'circle', x: u.x, y: u.y, r: r1 };
    addDanger(w, { ...z, t: tell, team: u.team, src: u, kind: 'holy', hit: H(u, { dmg: W.dmg, radiance: W.glow, knock: W.knock }), onFire: (w2) => { w2.shake = Math.max(w2.shake, 7); } });
    bfx(w, { type: 'hoop', x: u.x, y: u.y, r: (r0 + r1) / 2, band: (r1 - r0), max: tell + 0.25, tell, dir: i % 2 ? -1 : 1 });
  });
  const last = list[list.length - 1][2];
  k.wheelsOut = last + 0.2; k.cast = last; beginHold(u, last + 0.5, null);
}
// ---- the Chains: one from each corner of the hall, each at a hero; whatever a chain hits it drags to its corner
function chains(w, u, k, hs) {
  const C = AN.chains, m = 34, corners = [[m, m], [w.W - m, m], [m, w.H - m], [w.W - m, w.H - m]];
  // each corner takes the hero nearest it that no other corner has taken, while there are heroes to go round
  const free = hs.slice();
  for (const [cx, cy] of corners) {
    const pool = free.length ? free : hs; if (!pool.length) break;
    const t = pool.slice().sort((a, b) => dist(a.x, a.y, cx, cy) - dist(b.x, b.y, cx, cy))[0]; if (free.length) free.splice(free.indexOf(t), 1);
    const p = lead(t, 0.5), a = angleTo(cx, cy, p.x, p.y) + (free.length || hs.length >= 4 ? 0 : rrange(-0.12, 0.12)), e = clipLine(w, cx, cy, a, Math.min(C.reach, dist(cx, cy, p.x, p.y) + 150), 14, 30);
    const ch = { cx, cy, a, len: e.d, d: 0, st: 'tell', t: C.tell, who: null, born: w.time };
    ch.z = addDanger(w, { shape: 'line', x1: cx, y1: cy, x2: e.x, y2: e.y, hw: C.hw, t: C.tell, team: u.team, src: u, kind: 'holy', quiet: true });
    k.chains.push(ch);
  }
}
function chainsTick(w, u, k, dt) {
  const C = AN.chains;
  if (k.chainAgain > 0 && (k.chainAgain -= dt) <= 0 && alive(u)) { const hs = heroesOf(w, u); if (hs.length) chains(w, u, k, hs); } // phase 3: a second cast
  for (const c of k.chains) {
    const hx = c.cx + Math.cos(c.a) * c.d, hy = c.cy + Math.sin(c.a) * c.d;
    if (c.st === 'tell') { if ((c.t -= dt) <= 0) { c.st = 'out'; sparks(w, c.cx, c.cy, c.a, 5, '#FFFBEA'); } continue; }
    if (c.st === 'out') {
      c.d = Math.min(c.len, c.d + C.speed * dt);
      const x = c.cx + Math.cos(c.a) * c.d, y = c.cy + Math.sin(c.a) * c.d;
      for (const h of heroesOf(w, u)) {
        if (h.chainedBy || dist(h.x, h.y, x, y) > h.r + 26) continue;
        hurt(w, h, C.dmg * u.dmgMul, u, { noDodge: true, radiance: 14, knock: canDrag(h) ? 0 : 200, kAngle: c.a + Math.PI });
        bfx(w, { type: 'chainCatch', x, y, max: 0.35 });
        if (canDrag(h) && alive(h)) { c.who = h; h.chainedBy = c; c.st = 'drag'; } else c.st = 'back';
        break;
      }
      if (c.st === 'out' && c.d >= c.len) { c.st = 'back'; sparks(w, x, y, c.a + Math.PI, 4, '#FFFBEA'); }
      continue;
    }
    if (c.st === 'drag') {
      const h = c.who;
      if (!alive(h) || h.chainedBy !== c) { c.who = null; if (h) h.chainedBy = null; c.st = 'back'; continue; }
      c.d = Math.max(64, c.d - C.drag * dt);
      holdFast(h, c.cx + Math.cos(c.a) * c.d, c.cy + Math.sin(c.a) * c.d, 0.15);
      if (c.d <= 64) { h.chainedBy = null; h.stunT = 0; h.rootT = Math.max(h.rootT, C.shackle); c.held = { h, t: C.shackle }; c.who = null; c.st = 'hold'; bfx(w, { type: 'chainCatch', x: h.x, y: h.y, max: 0.35 }); }
      continue;
    }
    if (c.st === 'hold') { c.held.t -= dt; if (c.held.t <= 0 || !alive(c.held.h)) { c.st = 'back'; c.held = null; } continue; } // shackled at the corner a moment
    c.d -= C.speed * 0.8 * dt; if (c.d <= 0) c.gone = true;
  }
  if (k.chains.some((c) => c.gone)) k.chains = k.chains.filter((c) => !c.gone);
}
function dropChains(w, k) { for (const c of k.chains) { if (c.who) c.who.chainedBy = null; c.who = null; c.held = null; if (c.st !== 'back') c.st = 'back'; if (c.z) c.z.cancelled = true; } }

// ---- the Trumpets (phase 2 on): four horns stand round it and a note climbs; each horn left whole at the end
// sounds down its cone. Break the horn that points at you, or get out of its cone.
function startHorns(w, u, k, at) {
  const N = AN.horns; k.hornT = N.tell; k.cast = N.tell;
  for (let i = 0; i < N.n; i++) {
    const a = at + i * TAU / N.n, x = u.x + Math.cos(a) * N.out, y = u.y + Math.sin(a) * N.out;
    const h = part(w, u, 'seraphHorn', x, y, { share: 0, pool: true, hp: u.maxHp * N.hpK }); h.facing = a; h.hornA = a; h.born = w.time; h.tell = N.tell; k.horns.push(h);
    addDanger(w, { shape: 'cone', x, y, a, arc: N.arc, r: N.r, t: N.tell, team: u.team, src: h, kind: 'holy', hit: H(u, { dmg: N.dmg, radiance: N.glow, knock: N.knock, kAngle: a, heavy: true }),
      onFire: (w2) => { bfx(w2, { type: 'hornBlast', x, y, a, r: N.r, arc: N.arc, max: 0.6 }); w2.shake = Math.max(w2.shake, 9); } });
    puff(w, x, y, GOLD, 8, 120, 6, 0.5);
  }
}
function hornsTick(w, u, k, dt) {
  if (!(k.hornT > 0)) return false;
  stand(u, dt); k.hornT -= dt;
  for (const h of k.horns) if (alive(h)) { place(h, u.x + Math.cos(h.hornA) * AN.horns.out, u.y + Math.sin(h.hornA) * AN.horns.out, h.hornA); h.swell = 1 - k.hornT / AN.horns.tell; }
  if (k.hornT <= 0 || !k.horns.some((h) => alive(h))) { // sounded, or all broken: they are gone
    const early = k.hornT > 0;
    k.hornT = 0; k.hornEnd = 0.35;
    beginHold(u, early ? 1.6 : 0.7, null); if (early) { addBuff(u, { id: 'silenced', dur: 1.6, taken: 1.3 }); bfx(w, { type: 'silenced', u, max: 1.6 }); } // every horn broken: it reels
  }
  return true;
}

// ---- the Host (phase 2 on): two singers rise at the hall's sides; while either sings, half of every blow on it is
// turned aside, and they lob notes of light. Kill them.
function hostTick(w, u, k, dt) {
  if (k.phase < 2 || !alive(u)) return;
  const singers = w.units.filter((o) => o.singsFor === u && alive(o));
  u.hymn = singers.length;
  if (singers.length) addBuff(u, { id: 'hymn', dur: 0.2, taken: AN.host.taken });
  if (!singers.length && due(u, 'host', dt, 1) && !w.stale && crowd(w, u.team) < 20) {
    again(u, 'host', AN.host.every);
    for (let i = 0; i < AN.host.n; i++) {
      const p = openSpot(w, u.x, u.y, 300, 520, 40) || inside(w, u.x + rrange(-300, 300), u.y + rrange(-300, 300));
      const s = spawn(w, 'seraphSinger', p.x, p.y, { mult: w.mult || 1, team: u.team }); s.singsFor = u; s.court = true; s.aggro = true; s.minion = true; s.calledBy = u;
      s.maxHp = s.hp = Math.round(u.maxHp * AN.host.hpK); flare(w, p.x, p.y);
    }
  }
}
function singerBrain(w, s, dt) {
  stand(s, dt); s.bob += dt * 2;
  const u = s.singsFor;
  if (!u || !alive(u)) { kill(w, s, null); return true; }
  turnTo(s, angleTo(s.x, s.y, u.x, u.y), 4, dt);
  if (due(s, 'note', dt, 2)) { again(s, 'note', 3.2, 4.2); const t = randomHero(w, s), N = AN.host.note; if (t) lob(w, s, t.x, t.y, { r: N.r, tell: 1.0, kind: 'holy', proj: 'note', color: GOLD, hit: { dmg: N.dmg, radiance: N.glow } }); }
  return true;
}

// ---- the Gaze (phase 3): the great eye opens wide; its sight is a broad cone of light that turns slowly after its
// mark. In it: radiance, fast. Get out of its sight.
function startGaze(w, u, k, at) {
  const G = AN.gaze; k.gz = { t: 0, a: at, z: null, tick: 0 }; k.cast = G.tell + G.dur;
  addDanger(w, { shape: 'cone', x: u.x, y: u.y, a: at, arc: G.arc, r: G.r, t: G.tell, team: u.team, src: u, kind: 'holy', quiet: true });
}
function gazeTick(w, u, k, dt) {
  const g = k.gz; if (!g) return false;
  const G = AN.gaze; g.t += dt; stand(u, dt);
  k.eye += ((g.t < G.tell + G.dur ? 1 : 0.6) - k.eye) * Math.min(1, dt * 5); u.eyeOpen = k.eye;
  if (g.t < G.tell) { turnTo(u, g.a, 4, dt); return true; }
  if (g.t >= G.tell + G.dur) { k.gz = null; w.angelGaze = null; u.eyeOpen = 0.6; beginHold(u, 0.7, null); return true; }
  const t = pickTarget(w, u, k, dt);
  if (t) g.a = wrapAngle(g.a + clamp(wrapAngle(angleTo(u.x, u.y, t.x, t.y) - g.a), -G.turn * dt, G.turn * dt));
  u.facing = g.a; k.look = g.a;
  w.angelGaze = { x: u.x, y: u.y, a: g.a, arc: G.arc, r: G.r, t: g.t - G.tell, left: G.tell + G.dur - g.t };
  g.z = g.z && w.danger.includes(g.z) ? g.z : liveZone(w, u, { shape: 'cone', x: u.x, y: u.y, a: g.a, arc: G.arc, r: G.r, kind: 'holy' });
  keepZone(g.z, { x: u.x, y: u.y, a: g.a });
  if ((g.tick -= dt) <= 0) { g.tick = G.tick;
    for (const h of heroesOf(w, u)) { const dd = dist(u.x, u.y, h.x, h.y); if (dd > G.r + h.r || angleDiff(angleTo(u.x, u.y, h.x, h.y), g.a) > G.arc / 2) continue;
      hurt(w, h, G.dmg * u.dmgMul, u, { noDodge: true, radiance: G.glow, dot: true }); } }
  return true;
}

// ---- phase turns: a burst of light round it
function enter(w, u, k, p) {
  notePhase(w, k); k.gz = null; w.angelGaze = null; u.invulnT = 1.3; k.cast = 1.4; const B = AN.burst;
  addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: B.r, t: B.tell, team: u.team, src: u, kind: 'holy', hit: H(u, { dmg: B.dmg, radiance: B.glow, knock: B.knock }), onFire: (w2, z) => flare(w2, z.x, z.y) });
  beginHold(u, B.tell + 0.4, null);
  if (p === 2) { again(u, 'horns', 6); again(u, 'host', 0.5); }
  if (p === 3) { again(u, 'gaze', 2.5); u.eyeOpen = 0.8; }
}
function death(w, u) {
  const k = u.an; w.angelGaze = null;
  if (k) { dropChains(w, k); for (const c of k.chains) c.gone = true; k.chains = []; }
  for (const o of w.units) if (o.singsFor === u && alive(o)) kill(w, o, null);
  endParts(w, u);
  bfx(w, { type: 'angelFall', x: u.x, y: u.y, max: 1.6, seed: 4 }); flare(w, u.x, u.y); w.shake = Math.max(w.shake, 12);
}

// ---- the sanctum: a white and gold hall, two pillars, a wheel of eyes inlaid in the floor, a chain ring in each corner
function sanctum(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 240, y: Hh / 2 };
  for (const [fx2, fy] of [[0.5, 0.16], [0.5, 0.84]]) w.pillars.push({ x: W * fx2, y: Hh * fy, r: 34 });
  w.arenaDecor = [[0.2, 0.5, 'candles'], [0.8, 0.3, 'slab'], [0.8, 0.7, 'slab']].map(([fx2, fy, type]) => ({ type, x: W * fx2, y: Hh * fy, a: 0, s: 1.2, v: 0 }));
  w.sanctum = true;
  stage(w, 'angel', drawSanctumFloor, drawSanctumAir);
}

export const ANGEL = {
  defs: {
    gildedSeraph: { team: 'enemy', name: 'The Gilded Seraph', art: 'art/bosses/biblical-angel.svg', headR: 58, r: 52, vr: 58, turn: 2.2, accel: 140, face: 2.2, mass: 8, hp: 950, speed: 40, role: 'ranged', range: 300,
      atkCd: 999, arc: 2, temp: 0.2, commit: 1.2, xp: 220, coins: [90, 110], boss: true, arena: 'sanctum', attackAnim: 'cast', pose: ANGEL_POSE, flashAt: 0.095,
      res: { radiance: 0, curse: 0.5, poison: 0.3, stagger: 0.5 }, brain, onDeath: death },
    seraphHorn: PART('The Gilded Seraph (a trumpet)', { r: 26, vr: 26, mass: 30, hp: 100, res: { radiance: 0 }, draw: drawHorn }),
    seraphSinger: { team: 'enemy', name: 'Choir Singer', art: 'art/bosses/choir-singer.svg', headR: 40, r: 26, vr: 20, turn: 3, accel: 100, face: 3, mass: 2,
      hp: 60, speed: 0, role: 'ranged', range: 300, atkCd: 999, temp: 0.2, commit: 1, xp: 6, coins: [0, 0], noElite: true, res: { radiance: 0 }, brain: singerBrain },
  },
  arenas: { sanctum },
};
