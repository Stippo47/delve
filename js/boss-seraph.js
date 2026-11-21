// The Gilded Seraph: the Gilded Spire's boss (floor 3). Design and numbers: docs/BOSS-gilded-seraph.md. The designer
// answered the Spire's boss card RETHINK (the Hollow Saint) and the Archon IDK, with no replacement, so this is a new
// design to be judged: the host of the Spire, six gold wings, three sun blades that circle her (they can be broken), the
// Archon's light-pillars sweeping like clock hands folded in, a choir that shields her, and a fall at the end (radiance
// turns to curse).
// Art: PLACEHOLDER, the seraph recoloured gold and bigger (art/enemies/placeholder/seraph.svg); the blades are drawn.
import { alive, hurt, puff, sparks, setAnim, addDanger, spawn, fx, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { lob, around, hold, beginHold, due, again, stand, turnTo, openSpot } from './elites.js';
import { walkTo, courtFalls } from './enemies.js';
import { variantUrl } from './recolor.js';
import { heroesOf, H, steady, asleep, phaseGate, pickTarget, farthest, randomHero, lead, clipLine, thud, part, endParts, PART, place, logOf, notePhase, deathBurst, inside } from './boss-kit.js';
import { drawSunBlade, drawSanctum, drawHands } from './fx-boss.js';

export const GS = {
  blades: { n: 3, orbit: 115, spin: 1.6, hpK: 0.035, reform: 15, every: [3.2, 4.4], len: 620, hw: 26, tell: 0.8, speed: 1100, dmg: 33, glow: 22 },
  smite: { r: 82, tell: 1.0, dmg: 37, glow: 30, cd: [4.5, 6] },
  hands: { n: 2, len: 600, hw: 26, spin: 0.55, dur: 8, tell: 1.2, tick: 0.2, dmg: 10, glow: 9, cd: [13, 15] },
  dive: { r: 140, tell: 1.3, dmg: 44, glow: 40, knock: 320, cd: [9, 11] },
  choir: { n: 2, hpK: 0.04, max: 10, again: 28 },
  fall: { k: 0.8 },
};
export const PHASE_AT = [1, 0.7, 0.4, 0.15];
const WAKE = 460;

const glowHit = (u, k, hit, amt) => (k.phase >= 4 ? { ...hit, curse: amt } : { ...hit, radiance: amt }); // fallen: curse, not light

function brain(w, u, dt) {
  const k = u.gs || (u.gs = { phase: 0 });
  if (!k.blades) { k.blades = []; k.orbitA = 0; makeBlades(w, u, k); }
  steady(u); logOf(w, u, k);
  orbit(w, u, k, dt);
  if (asleep(w, u, k, WAKE, PHASE_AT, () => { beginHold(u, 1.0, null); setAnim(u, 'cast', 1); flare(w, u.x, u.y); notePhase(w, k); })) return true;
  if (choirTick(w, u, k, dt)) return true;
  if (handsTick(w, u, k, dt)) return true;
  if (diveTick(w, u, k, dt)) return true;
  if (hold(u, dt)) return true;
  if (phaseGate(u, k, PHASE_AT, (p) => enter(w, u, k, p))) return true;
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const K = k.phase >= 4 ? GS.fall.k : 1, d = dist(u.x, u.y, t.x, t.y), at = angleTo(u.x, u.y, t.x, t.y);
  // the blades: one at a time leaves the circle and flies down a line at a hero, then comes back
  if (due(u, 'blade', dt, 1.5)) { again(u, 'blade', ...GS.blades.every.map((x) => x * K)); launch(w, u, k, k.phase >= 4 ? 2 : 1); }
  if (k.phase >= 2 && due(u, 'hands', dt, 2)) { again(u, 'hands', ...GS.hands.cd); startHands(w, u, k); return true; }
  if (k.phase >= 2 && due(u, 'dive', dt, 4)) { again(u, 'dive', ...GS.dive.cd.map((x) => x * K)); startDive(w, u, k, t); return true; }
  if (due(u, 'smite', dt, 1.5)) {
    again(u, 'smite', ...GS.smite.cd.map((x) => x * K));
    const hs = k.phase >= 3 ? heroesOf(w, u).slice(0, 2) : [t];
    for (const h of hs) { const p = lead(h, 0.5);
      addDanger(w, { shape: 'circle', x: p.x, y: p.y, r: GS.smite.r, t: GS.smite.tell, team: u.team, src: u, kind: k.phase >= 4 ? 'soul' : 'holy', hit: H(u, glowHit(u, k, { dmg: GS.smite.dmg, knock: 140 }, GS.smite.glow)),
        onFire: (w2, z) => fx(w2, { type: 'pillar', x: z.x, y: z.y, r: z.r * 0.8, kind: 'holy', max: 0.6 }) }); }
    beginHold(u, 0.5, at); setAnim(u, 'cast', 0.6);
    return true;
  }
  // she floats at a middle distance from her mark
  if (d < 220) { const a = at + Math.PI, p = inside(w, u.x + Math.cos(a) * 120, u.y + Math.sin(a) * 120, u.r + 20); walkTo(w, u, p.x, p.y, 0.8, dt); }
  else if (d > 400) walkTo(w, u, t.x, t.y, 0.8, dt); else stand(u, dt);
  turnTo(u, at, 3, dt);
  return true;
}

// ---- sun blades: three swords circling her; a broken one comes back after 15 s
function makeBlades(w, u, k) {
  for (let i = k.blades.filter((b) => alive(b)).length; i < GS.blades.n; i++) {
    const b = part(w, u, 'sunBlade', u.x, u.y, { share: 0, pool: true, hp: u.maxHp * GS.blades.hpK });
    b.slot = i; k.blades.push(b);
  }
  k.blades = k.blades.filter((b) => alive(b));
}
function orbit(w, u, k, dt) {
  k.orbitA += dt * GS.blades.spin;
  const live = k.blades.filter((b) => alive(b));
  if (live.length < GS.blades.n && (k.reformT = (k.reformT ?? GS.blades.reform) - dt) <= 0) { k.reformT = GS.blades.reform; makeBlades(w, u, k); }
  live.forEach((b, i) => {
    if (b.fly) { // out on its line and back
      const f = b.fly; f.t += dt;
      if (f.t < f.tell) { place(b, b.x, b.y, f.a); return; }
      const q = (f.t - f.tell) / f.go;
      if (q < 1) { const e = q < 0.5 ? q * 2 : 2 - q * 2; place(b, f.x0 + (f.x1 - f.x0) * e, f.y0 + (f.y1 - f.y0) * e, f.a + f.t * 20); return; }
      b.fly = null;
    }
    const a = k.orbitA + i / live.length * TAU, r = GS.blades.orbit;
    place(b, u.x + Math.cos(a) * r, u.y + Math.sin(a) * r, a + Math.PI / 2);
  });
}
function launch(w, u, k, n) {
  const free = k.blades.filter((b) => alive(b) && !b.fly);
  for (let i = 0; i < n && free[i]; i++) {
    const b = free[i], t = i ? randomHero(w, u, u.target) : u.target || randomHero(w, u); if (!t) return;
    const p = lead(t, 0.3), a = angleTo(b.x, b.y, p.x, p.y), e = clipLine(w, b.x, b.y, a, GS.blades.len, 12, 0), B = GS.blades;
    b.fly = { t: 0, tell: B.tell, go: 2 * e.d / B.speed + 0.05, x0: b.x, y0: b.y, x1: e.x, y1: e.y, a };
    addDanger(w, { shape: 'line', x1: b.x, y1: b.y, x2: e.x, y2: e.y, hw: B.hw, t: B.tell, team: u.team, src: u, kind: k.phase >= 4 ? 'soul' : 'holy', hit: H(u, glowHit(u, k, { dmg: B.dmg, knock: 150, kAngle: a + Math.PI / 2 }, B.glow)) });
  }
}

// ---- clock hands: beams of light from her turning slowly round her; she stands at their centre while they turn.
// A thin danger line is laid along each every tick so the heroes keep stepping out of it.
function startHands(w, u, k) {
  const H2 = GS.hands, n = k.phase >= 4 ? 3 : H2.n, a0 = rand() * TAU;
  k.hands = { t: H2.tell, run: H2.dur, tick: 0, dir: chance(0.5) ? 1 : -1, as: Array.from({ length: n }, (_, i) => a0 + i / n * TAU) };
  for (const a of k.hands.as) { const e = clipLine(w, u.x, u.y, a, H2.len, 10, u.r); addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: e.x, y2: e.y, hw: H2.hw, t: H2.tell, team: u.team, src: u, kind: 'holy' }); }
  setAnim(u, 'cast', H2.tell + H2.dur);
}
function handsTick(w, u, k, dt) {
  const h = k.hands; if (!h) return false;
  stand(u, dt);
  if (h.t > 0) { h.t -= dt; return true; }
  const H2 = GS.hands;
  h.as = h.as.map((a) => a + h.dir * H2.spin * (k.phase >= 4 ? 1.3 : 1) * dt);
  w.hands = { x: u.x, y: u.y, as: h.as, len: H2.len, fallen: k.phase >= 4 };
  if ((h.tick -= dt) <= 0) {
    h.tick = H2.tick;
    for (const a of h.as) {
      const e = clipLine(w, u.x, u.y, a, H2.len, 10, u.r);
      addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: e.x, y2: e.y, hw: H2.hw + 6, t: 0.3, team: u.team, src: u, kind: k.phase >= 4 ? 'soul' : 'holy' });
      for (const o of heroesOf(w, u)) {
        const dd = dist(u.x, u.y, o.x, o.y); if (dd > e.d + o.r) continue;
        const off = Math.abs(Math.sin(angleTo(u.x, u.y, o.x, o.y) - a)) * dd;
        if (off < H2.hw + o.r * 0.5 && angleDiff(angleTo(u.x, u.y, o.x, o.y), a) < Math.PI / 2) hurt(w, o, H2.dmg * u.dmgMul, u, glowHit(u, k, { noDodge: true, knock: 60, kAngle: a + h.dir * Math.PI / 2 }, H2.glow));
      }
    }
  }
  if ((h.run -= dt) <= 0) { k.hands = null; w.hands = null; beginHold(u, 0.8, null); }
  return true;
}

// ---- the dive: up out of reach, then down on a hero (a circle fills where she'll land)
function startDive(w, u, k, t) {
  const p = lead(t, 0.6), q = inside(w, p.x, p.y, u.r + 10), D = GS.dive;
  k.dive = { t: 0, dur: D.tell, sx: u.x, sy: u.y, ex: q.x, ey: q.y };
  addDanger(w, { shape: 'circle', x: q.x, y: q.y, r: D.r, t: D.tell, team: u.team, src: u, kind: k.phase >= 4 ? 'soul' : 'holy', hit: H(u, glowHit(u, k, { dmg: D.dmg, knock: D.knock, heavy: true }, D.glow)),
    onFire: (w2, z) => { flare(w2, z.x, z.y); fx(w2, { type: 'pillar', x: z.x, y: z.y, r: z.r * 0.7, kind: 'holy', max: 0.7 }); } });
  setAnim(u, 'ability', D.tell);
}
function diveTick(w, u, k, dt) {
  const d = k.dive; if (!d) return false;
  d.t += dt; const q = clamp(d.t / d.dur, 0, 1), e = q * q * (3 - 2 * q);
  place(u, d.sx + (d.ex - d.sx) * e, d.sy + (d.ey - d.sy) * e);
  u.hop = Math.sin(q * Math.PI) * 160; u.invulnT = Math.max(u.invulnT, 0.05);
  if (q >= 1) { k.dive = null; u.hop = 0; beginHold(u, 0.9, null); }
  return true;
}

// ---- the choir (phase 3): two singers rise at the sides of the room; while either sings she is shielded (no harm
// comes to her) for up to 14 s. Once more every 28 s while the phase lasts.
function choirTick(w, u, k, dt) {
  if (k.phase < 3) return false;
  const singers = w.units.filter((o) => o.singsFor === u && alive(o));
  if (singers.length && k.choirT > 0) { k.choirT -= dt; u.invulnT = Math.max(u.invulnT, 0.1); u.shielded = true; }
  else { if (u.shielded) { u.shielded = false; for (const s of singers) kill(w, s, null); } }
  if (k.phase === 3 && !singers.length && due(u, 'choir', dt, 0.3)) {
    again(u, 'choir', GS.choir.again);
    k.choirT = GS.choir.max;
    for (let i = 0; i < GS.choir.n; i++) {
      const p = openSpot(w, u.x, u.y, 300, 520, 40) || inside(w, u.x + rrange(-300, 300), u.y + rrange(-300, 300));
      const s = spawn(w, 'seraphSinger', p.x, p.y, { mult: w.mult, team: u.team }); s.singsFor = u; s.court = true; s.aggro = true;
      s.maxHp = s.hp = Math.round(u.maxHp * GS.choir.hpK); flare(w, p.x, p.y);
      fx(w, { type: 'beam', x1: s.x, y1: s.y, x2: u.x, y2: u.y, kind: 'heal', max: GS.choir.max, from: s, to: u });
    }
  }
  return false;
}
function singerBrain(w, s, dt) {
  stand(s, dt); s.bob += dt * 2;
  if (!s.singsFor || !alive(s.singsFor)) { kill(w, s, null); return true; }
  if (due(s, 'note', dt, 2)) { again(s, 'note', 3, 4); const t = randomHero(w, s); if (t) lob(w, s, t.x, t.y, { r: 60, tell: 1.0, kind: 'holy', proj: 'note', color: '#FFE7A0', hit: { dmg: 12, radiance: 18 } }); }
  return true;
}

function flare(w, x, y) { puff(w, x, y, '#FFE7A0', 18, 180, 7, 0.6); for (let i = 0; i < 6; i++) sparks(w, x, y, i / 6 * TAU, 1, '#FFFBEA'); w.shake = Math.max(w.shake, 4); }

// ---- phase turns: a burst of light round her
function enter(w, u, k, p) {
  notePhase(w, k); k.hands = null; w.hands = null; k.dive = null; u.hop = 0;
  u.invulnT = 1.3;
  around(w, u, { r: 210, tell: 0.9, kind: p >= 4 ? 'soul' : 'holy', after: 0.4, hit: glowHit(u, k, { dmg: 12, knock: 300 }, 20), fire: (w2, z) => flare(w2, z.x, z.y) });
  if (p === 2) again(u, 'hands', 1.5);
  if (p === 3) again(u, 'choir', 1.2);
  if (p === 4) { u.fallen = true; w.fallen = true; again(u, 'hands', 2); for (const b of k.blades) if (alive(b)) b.fallen = true; }
}
function death(w, u) {
  courtFalls(w); endParts(w, u); w.hands = null; w.fallen = false;
  deathBurst(w, u, ['#FFE7A0', '#F2C14E', '#FFFBEA', '#5A4A7A']);
}

// ---- the sanctum: a gold-and-white hall, four pillars (they stop blades and the hands' light), a sun set in the floor
function sanctum(w) {
  const W = w.W, Hh = w.H;
  w.throne = { x: W - 220, y: Hh / 2 };
  for (const [fx2, fy] of [[0.36, 0.25], [0.36, 0.75], [0.64, 0.25], [0.64, 0.75]]) w.pillars.push({ x: W * fx2, y: Hh * fy, r: 34 });
  w.sun = { x: W * 0.5, y: Hh / 2 };
  w.arenaDecor = [[0.15, 0.3, 'candles'], [0.15, 0.7, 'candles'], [0.85, 0.25, 'slab'], [0.85, 0.75, 'slab']].map(([fx2, fy, type]) => ({ type, x: W * fx2, y: Hh * fy, a: 0, s: 1.2, v: 0 }));
  w.arenaDraw = (ctx, w2) => drawSanctum(ctx, w2);
  w.arenaAir = (ctx, w2) => drawHands(ctx, w2);
}

const ART = variantUrl('art/enemies/placeholder/seraph.svg', { hue: 10, sat: 1.2, light: 0.08 });
export const SERAPH = {
  defs: {
    gildedSeraph: { team: 'enemy', name: 'The Gilded Seraph', art: ART, headR: 56, r: 48, vr: 38, turn: 3, accel: 180, face: 3, mass: 6, hp: 1100, speed: 50, role: 'ranged', range: 300,
      atkCd: 999, arc: 2, temp: 0.2, commit: 1.2, xp: 220, coins: [90, 110], boss: true, arena: 'sanctum', attackAnim: 'cast',
      res: { radiance: 0, curse: 0.5, poison: 0.3, stagger: 0.5 }, brain, onDeath: death },
    sunBlade: PART('Sun Blade', { r: 22, vr: 22, mass: 20, hp: 100, res: { radiance: 0 }, draw: drawSunBlade }),
    seraphSinger: { team: 'enemy', name: 'Choir Singer', art: variantUrl('art/enemies/placeholder/cherub.svg', { hue: 10, sat: 1.1, light: 0.1 }), headR: 46, r: 26, vr: 20, turn: 3, accel: 100, face: 3, mass: 2,
      hp: 60, speed: 0, role: 'ranged', range: 300, atkCd: 999, temp: 0.2, commit: 1, xp: 6, coins: [0, 0], noElite: true, res: { radiance: 0 }, brain: singerBrain },
  },
  arenas: { sanctum },
};
