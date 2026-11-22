// The new heroes' looks (round 10, lane H), in the one effects style (docs/FX-STYLE.md): inked solid things, additive
// light, ground effects soft-edged and under the units. Three hooks into the older code:
//   PROJ2[kind](ctx, p, T, ang, sp)  a shot of a new kind (fx.js drawProjectile; ctx is at the shot, not rotated)
//   DRAW[f.draw](ctx, f, w, layer)   an fx of type 'k2' (fx.js drawGroundFx / drawAirFx; layer 'ground' | 'air')
//   SIG2[abilityId](ctx, f, k, el, w) an ability's own signature at the cast (fxkit.js drawSigAir; return false to skip
//                                     the default cast flash)
// installFx2 (called by fxkit.js) adds each new ability's element and signature time, and how its shots burst.
import { TAU, clamp } from './util.js';
import { inked, inkLine, glowDisc, star, upright, upVec, hash, easeOut, flame, blob, trail, roundRect } from './fx.js';
import { drawPuddle } from './puddles.js';
import { LOOK2 } from './looks2.js';

const k01 = (v) => clamp(v, 0, 1);
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const disc = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill(); };
const inkDisc = (ctx, x, y, r, col) => inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); }, col);
const life = (f, i = 0.12, o = 0.3) => clamp(Math.min(f.t / i, (f.max - f.t) / o, 1), 0, 1);
let K = null; // fxkit's pieces (castFlash, streak, dustPuffs, EL), handed over by installFx2

// ---------------------------------------------------------------- each ability's element (FX-STYLE palette) and sig time
const EL2 = {
  greatSweep: 'steel', rallyCry: 'holy', pommelStrike: 'steel', riposte: 'steel', challenge: 'blood', disarm: 'steel',
  swoop: 'earth', hammerThrow: 'storm', wingShield: 'holy', brace: 'steel', shieldWall: 'earth', impale: 'steel',
  maul: 'earth', hibernate: 'earth', bearRoar: 'earth',
};
const SIGT2 = {};
// shots that burst like an older kind
const ALIAS2 = {};
const IMPACT2 = {};
export function installFx2(api) {
  K = api;
  for (const [k, v] of Object.entries(EL2)) if (!(k in api.CAST_EL)) api.CAST_EL[k] = v;
  for (const [k, v] of Object.entries(SIGT2)) if (!(k in api.SIG_T)) api.SIG_T[k] = v;
  Object.assign(api.IMPACT_ALIAS, ALIAS2); Object.assign(api.IMPACT_EL, IMPACT2);
}

// ---------------------------------------------------------------- shots
export const PROJ2 = {
  // Griffon's Stormhammer: a warhammer spinning end over end, a steel head on a wooden haft
  hammer(ctx, p, T, ang, sp) {
    const s = p.big ? 1.5 : 1.2;
    ctx.save(); ctx.rotate(ang); trail(ctx, sp, 40 * s, 10 * s, p.o && p.o.shock ? '#FFE66B' : '#EEF3F8'); ctx.restore();
    if (p.o && p.o.shock) lit(ctx, () => glowDisc(ctx, 0, 0, 26 * s, '#FFE66B', 0.45));
    ctx.rotate(T * 20 + p.x * 0.01); ctx.scale(s, s);
    inked(ctx, () => roundRect(ctx, -2.2, -2, 4.4, 20, 2), '#8A5A30');
    inked(ctx, () => roundRect(ctx, -10, -11, 20, 11, 2.5), '#A8B0BA');
    ctx.fillStyle = '#DCE3EC'; ctx.fillRect(-8.5, -10, 17, 3.2);
    ctx.fillStyle = '#6E7680'; ctx.fillRect(-2, -11, 4, 11);
    ctx.fillStyle = '#FFE14D'; ctx.fillRect(-10, -6.4, 20, 2.6); // round 13: the yellow line the designer asked for
  },
};

// ---------------------------------------------------------------- 'k2' looks
const DRAW = {
  // light gathering where the weapon will come from (a wind-up)
  gather(ctx, f, w, layer) {
    if (layer !== 'air') return; const u = f.unit, q = k01(f.t / f.max);
    const x = f.x + Math.cos(u ? u.facing : 0) * 26, y = f.y + Math.sin(u ? u.facing : 0) * 26;
    lit(ctx, () => glowDisc(ctx, x, y, 16 + 26 * q, f.col || '#FFFFFF', 0.25 + 0.45 * q));
    inked(ctx, () => star(ctx, x, y, 4 + 9 * q, 4, 0.3, q * 3), '#FFFFFF');
  },
  // Rally: gold chevrons rising off each ally
  rally(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), [vx, vy] = upVec();
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 40, (f.cols || ['#FFE7A0'])[0], 0.5 * (1 - k / 0.3)));
    for (let i = 0; i < 3; i++) { const q = k01(k * 1.4 - i * 0.18); if (q <= 0) continue; const up = f.r + 6 + 34 * easeOut(q) + i * 2;
      upright(ctx, f.x + vx * up, f.y + vy * up, () => inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-9, 5); ctx.lineTo(0, -3); ctx.lineTo(9, 5); }, (f.cols || ['#F2C14E', '#FFE7A0'])[i % 2], 4)); }
    ctx.restore();
  },
  // a hard knock on the head: a white star and little stars going round
  bonk(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
    if (k < 0.35) lit(ctx, () => glowDisc(ctx, f.x, f.y, 44, '#FFFFFF', 0.7 * (1 - k / 0.35)));
    ctx.save(); ctx.globalAlpha *= 1 - k;
    inked(ctx, () => star(ctx, f.x, f.y, (14 + 12 * e) * (1 - 0.4 * k), 6, 0.4, 0.3), '#FFF7C2');
    const hx = f.x + vx * (f.r + 10), hy = f.y + vy * (f.r + 10);
    for (let i = 0; i < 3; i++) { const b = i / 3 * TAU + f.t * 9; inked(ctx, () => star(ctx, hx + Math.cos(b) * 16, hy + Math.sin(b) * 6, 4.5, 5, 0.45, b), '#FFE66B'); }
    ctx.restore();
  },
  // Riposte: a soft light on the face of the raised shield while it waits
  shieldUp(ctx, f, w, layer) {
    if (layer !== 'air' || !f.unit) return; const u = f.unit, a = u.facing, x = u.x + Math.cos(a) * (u.r + 6), y = u.y + Math.sin(a) * (u.r + 6);
    lit(ctx, () => glowDisc(ctx, x, y, 22 + Math.sin(f.t * 12) * 3, '#EEF3F8', 0.28 * life(f)));
  },
  // a parry: steel sparks thrown off the shield and the counter-thrust's streak
  parry(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 34, '#FFFFFF', 0.8 * (1 - k / 0.3)));
    ctx.save(); ctx.globalAlpha *= 1 - k;
    K.streak(ctx, f.x, f.y, f.a, 4, 10 + 46 * e, 5, '#EEF3F8', '#FFFFFF');
    for (let i = -2; i <= 2; i++) { const b = f.a + Math.PI + i * 0.5; K.streak(ctx, f.x + Math.cos(b) * 6, f.y + Math.sin(b) * 6, b, 0, 8 + 10 * (1 - k), 2.4, '#FFF4C8', '#FFFFFF'); }
    ctx.restore();
  },
  // Challenge: crossed swords over the challenged enemy's head, a thin red line to her on the floor
  duel(ctx, f, w, layer) {
    const e = f.unit, d = f.from; if (!e) return; const a = life(f, 0.25, 0.4);
    if (layer === 'ground') { if (!d || d.dead || d.downed) return; ctx.save(); ctx.globalAlpha *= 0.45 * a; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -f.t * 30;
      ctx.strokeStyle = '#C8453D'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(e.x, e.y); ctx.stroke(); ctx.restore(); return; }
    const [vx, vy] = upVec(), up = e.vr + 20, pop = f.t < 0.3 ? 1 + 0.4 * Math.sin(f.t / 0.3 * Math.PI) : 1;
    ctx.save(); ctx.globalAlpha *= a;
    upright(ctx, e.x + vx * up, e.y + vy * up, () => { ctx.scale(pop, pop);
      for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * 0.75); inked(ctx, () => { roundRect(ctx, -2, -13, 4, 20, 1.5); }, '#EEF3F8'); inked(ctx, () => roundRect(ctx, -6, 6, 12, 3.4, 1.5), '#C8453D'); ctx.restore(); } });
    ctx.restore();
  },
  // Disarm: the enemy's blade knocked spinning up out of its hand
  disarm(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), [vx, vy] = upVec(), h = Math.sin(k * Math.PI) * 46, side = 30 * k;
    const x = f.x + Math.cos(f.a) * side + vx * (h + f.r * 0.5), y = f.y + Math.sin(f.a) * side + vy * (h + f.r * 0.5);
    ctx.save(); ctx.globalAlpha *= 1 - k * k; ctx.translate(x, y); ctx.rotate(k * 14);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(3, 4); ctx.lineTo(-3, 4); ctx.closePath(); }, '#C9D2DE');
    inked(ctx, () => roundRect(ctx, -6, 4, 12, 3, 1.5), '#8A5A30');
    ctx.restore();
    if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, 30, '#FFFFFF', 0.6 * (1 - k / 0.25)));
  },
  // Griffon's wings (round 13, showcase 4: "U can't even see the wings and they are too sharp ... Should look similar to
  // the ones on his sprite. But bigger and maybe more segments"): the helm's cream-and-gold wings, rounded feather lobes
  // fanned out from his shoulders, six a side, reaching well past his body (f.big: Wing Guard's, bigger still)
  wings(ctx, f, w, layer) {
    if (layer !== 'ground' || !f.unit) return; const u = f.unit, a = life(f, 0.15, 0.25);
    const beat = f.flap ? Math.sin(f.t * 22) * 0.3 : Math.sin(f.t * 4) * 0.05, spread = easeOut(k01(f.t / 0.2));
    const lift = u.hop || 0, [vx, vy] = upVec(), S = (f.big ? 1.25 : 1) * spread;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(u.x + vx * lift, u.y + vy * lift); ctx.rotate(u.facing - Math.PI / 2);
    for (const sd of [-1, 1]) { ctx.save(); ctx.scale(sd, 1); ctx.rotate(beat * spread);
      for (let i = 5; i >= 0; i--) { const L = (u.r * 0.6 + 22 + i * 9) * S, b = 1.95 - i * 0.24 - (f.big ? 0.75 * spread : 0), wd = 9 + i * 0.6; // (Wing Guard: wrapped forward round him)
        ctx.save(); ctx.translate(u.r * 0.35, -2); ctx.rotate(-b + Math.PI / 2);
        inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -L / 2, wd, L / 2 + 4, 0, 0, TAU); }, i % 2 ? '#F8EED8' : '#FFF6E4');
        ctx.fillStyle = i % 2 ? '#F2B53A' : '#E9A62E'; ctx.beginPath(); ctx.ellipse(0, -5, wd * 0.62, 7, 0, 0, TAU); ctx.fill();
        ctx.restore(); }
      ctx.restore(); }
    ctx.restore();
  },
  // Brace: a glint running up and down the set spear's head
  brace(ctx, f, w, layer) {
    if (layer !== 'air' || !f.unit) return; const u = f.unit, d = u.r + (u.def.range || 30) + 6, x = u.x + Math.cos(u.facing) * d, y = u.y + Math.sin(u.facing) * d;
    const p = 0.5 + 0.5 * Math.sin(f.t * 9);
    lit(ctx, () => glowDisc(ctx, x, y, 14 + 8 * p, '#FFFFFF', 0.4 * life(f)));
    ctx.save(); ctx.globalAlpha *= life(f) * p; inked(ctx, () => star(ctx, x, y, 7, 4, 0.3, f.t * 2), '#FFFFFF'); ctx.restore();
  },
  // Shield Wall: warm light poured on the floor round him (no ring), plates of light standing in front
  shieldWall(ctx, f, w, layer) {
    if (!f.unit) return; const u = f.unit, a = life(f, 0.3, 0.5);
    if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, u.x, u.y, f.r, '#F2C14E', 0.14 * a)); return; }
    ctx.save(); ctx.globalAlpha *= 0.65 * a;
    for (let i = -2; i <= 2; i++) { const b = u.facing + i * 0.32, d = u.r + 18, x = u.x + Math.cos(b) * d, y = u.y + Math.sin(b) * d;
      ctx.save(); ctx.translate(x, y); ctx.rotate(b); inked(ctx, () => roundRect(ctx, -3, -9, 6, 18, 2.5), i % 2 ? '#FFE7A0' : '#F2C14E'); ctx.restore(); }
    ctx.restore();
  },
  // Impale: the spear's mark left in the pinned enemy: a dark shaft stuck through it into the floor
  pin(ctx, f, w, layer) {
    if (layer !== 'air' || !f.unit) return; const e = f.unit, a = life(f, 0.05, 0.3), x = e.x - Math.cos(f.a) * e.r * 0.2, y = e.y - Math.sin(f.a) * e.r * 0.2;
    ctx.save(); ctx.globalAlpha *= a;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - Math.cos(f.a) * 34, y - Math.sin(f.a) * 34); ctx.lineTo(x, y); }, '#8A5A30', 5);
    if (f.t < 0.25) { const q = f.t / 0.25; lit(ctx, () => glowDisc(ctx, x, y, 34, '#FFFFFF', 0.6 * (1 - q))); }
    ctx.restore();
  },
  // Hibernate: slow breath puffs and a warm glow while he lies curled up
  hibernate(ctx, f, w, layer) {
    if (layer !== 'air' || !f.unit) return; const u = f.unit, a = life(f, 0.3, 0.4), [vx, vy] = upVec();
    lit(ctx, () => glowDisc(ctx, u.x, u.y, u.vr * 2, '#FFB070', 0.18 * a * (0.7 + 0.3 * Math.sin(f.t * 3))));
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 3; i++) { const ph = (f.t * 0.6 + i / 3) % 1, up = u.vr + 4 + ph * 40;
      ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI) * 0.8; inkDisc(ctx, u.x + vx * up + Math.cos(u.facing) * 10 + Math.sin(ph * 7) * 5, u.y + vy * up + Math.sin(u.facing) * 10, 4 + 5 * ph, '#F2E8DA'); ctx.restore(); }
    ctx.restore();
  },
  // a roar: brown-and-bone streaks bursting out along the floor to its reach
  roar(ctx, f, w, layer) {
    if (layer !== 'ground') return; const k = k01(f.t / f.max), e = easeOut(k), u = f.unit, x = u && !u.dead ? u.x : f.x, y = u && !u.dead ? u.y : f.y;
    ctx.save(); ctx.globalAlpha *= 1 - k;
    for (let i = 0; i < 16; i++) { const b = i / 16 * TAU + 0.2, r0 = 24 + (f.r - 40) * e; K.streak(ctx, x + Math.cos(b) * r0, y + Math.sin(b) * r0, b, 0, 26 * (1 - k) + 6, 3.6, i % 2 ? '#A0683A' : '#E9DDC2', '#FFF8E6'); }
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, x, y, f.r * 0.7, '#E9C9A0', 0.35 * (1 - k / 0.3)));
    ctx.restore();
  },
};
// ----- batch 2
// War Horn: three warm sound fronts rolling out across the floor
// War Horn, Mock, Showboat: a blast of sound. Round 10 (the designer dislikes rings round heroes): no rings rolling out
// round him; short curved sound lines burst out from him in every direction, three waves of them, and fade close by
DRAW.horn = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), u = f.unit && !f.unit.dead ? f.unit : f, r0 = (f.unit ? f.unit.vr : 20) + 8;
  const fa = f.unit ? f.unit.facing : 0, dirs = [-1.35, -0.45, 0.45, 1.35]; // four bursts of lines, out to the front and sides: never a ring
  for (let wv = 0; wv < 3; wv++) { const q = k01(k * 1.8 - wv * 0.28); if (q <= 0 || q >= 1) continue; const e = easeOut(q), R = r0 + 46 * e;
    ctx.save(); ctx.globalAlpha *= (1 - q) * (1 - q);
    for (const d of dirs) { const b = fa + d, half = 0.26 - 0.08 * q;
      inkLine(ctx, () => { ctx.beginPath(); ctx.arc(u.x, u.y, R, b - half, b + half); }, wv % 2 ? '#FFC85A' : '#FF9A55', 3.6 * (1 - 0.5 * q) + 1); }
    ctx.restore(); }
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, u.x, u.y, 50, '#FFC85A', 0.4 * (1 - k / 0.2)));
};
// speed lines behind a dash, in a colour
DRAW.streak = (ctx, f, w, layer) => {
  if (layer !== 'ground' || !f.unit) return; const u = f.unit, k = k01(f.t / f.max);
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = -2; i <= 2; i++) { const nx = -Math.sin(f.a) * i * 9, ny = Math.cos(f.a) * i * 9;
    K.streak(ctx, u.x + nx - Math.cos(f.a) * (u.r + 6), u.y + ny - Math.sin(f.a) * (u.r + 6), f.a + Math.PI, 0, 40 - Math.abs(i) * 8, 3, f.col || '#E9DDC2', '#FFFFFF'); }
  ctx.restore();
};
// Pickpocket: a little gold flash and coins jumping out of the purse
DRAW.coinPop = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), [vx, vy] = upVec();
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 36, '#FFD45A', 0.6 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 4; i++) { const b = (i - 1.5) * 0.7, h = Math.sin(k * Math.PI) * (26 + i * 5), s = 22 * k;
    inkDisc(ctx, f.x + Math.cos(b) * s + vx * (h + f.r * 0.6), f.y + Math.sin(b) * s * 0.3 + vy * (h + f.r * 0.6), 4.2, i % 2 ? '#FFD45A' : '#F2C14E'); }
  ctx.restore();
};
// Shadow Walk (round 13: "Shadow should be a union. Not overlapping circles"): her path left as one body of shadow smoke
// on the floor (puddles.js merges the bodies of a kind into one, with one outline), thinning away behind her
DRAW.shadowTrail = (ctx, f, w, layer) => {
  if (layer !== 'ground' || !f.unit) return; const u = f.unit;
  if (f.t < f.max - 0.9 && (!f.pts.length || Math.hypot(u.x - f.pts[f.pts.length - 1].x, u.y - f.pts[f.pts.length - 1].y) > 9)) f.pts.push({ x: u.x, y: u.y, t: f.t });
  f.pts.forEach((p, i) => { const a = k01(1 - (f.t - p.t) / 0.9); if (a > 0.02) drawPuddle(ctx, 'smoke', p.x, p.y, u.vr * (0.55 + 0.45 * a), w.time, a, i * 13 + 1); });
};
// Blackout: a pool of darkness on the floor with wisps at its edge (no ring)
DRAW.dark = (ctx, f, w, layer) => {
  const a = life(f, 0.3, 0.6);
  if (layer === 'ground') {
    const g = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r); g.addColorStop(0, `rgba(20,12,34,${0.55 * a})`); g.addColorStop(0.75, `rgba(28,18,46,${0.42 * a})`); g.addColorStop(1, 'rgba(28,18,46,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); return;
  }
  ctx.save(); ctx.globalAlpha *= a * 0.8;
  for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + f.t * 0.4, ph = (f.t * 0.7 + hash(i, 3)) % 1, d = f.r * (0.6 + 0.35 * ph);
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 5 * (1 - ph) + 2, '#5A4A7A'); ctx.restore(); }
  ctx.restore();
};
// Death Mark: a skull sigil turning over the marked one's head, tightening as it nears the burst
DRAW.skullMark = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const e = f.unit, [vx, vy] = upVec(), k = k01(f.t / 3), up = e.vr + 22;
  const x = e.x + vx * up, y = e.y + vy * up, s = 1 + 0.15 * Math.sin(f.t * (6 + 14 * k));
  lit(ctx, () => glowDisc(ctx, x, y, 20 + 10 * k, '#9B86C9', 0.35 + 0.3 * k));
  upright(ctx, x, y, () => { ctx.scale(s, s);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); }, '#E2D8FF');
    ctx.fillStyle = '#2E2440'; ctx.beginPath(); ctx.arc(-3.2, -1, 2.4, 0, TAU); ctx.arc(3.2, -1, 2.4, 0, TAU); ctx.fill(); });
  ctx.save(); ctx.globalAlpha *= 0.6; inkLine(ctx, () => { ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, f.t * 2, f.t * 2 + TAU * (1 - k)); }, '#9B86C9', 2.4); ctx.restore();
};
DRAW.markBurst = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 70, f.col || '#9B86C9', 0.8 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  inked(ctx, () => star(ctx, f.x, f.y, (16 + 30 * e), 8, 0.35, 0.2), '#5A4A7A');
  ctx.fillStyle = '#E2D8FF'; star(ctx, f.x, f.y, (6 + 12 * e), 8, 0.35, 0.2); ctx.fill();
  ctx.restore();
};
// a spray thrown out in a cone: hay, dirt (cols)
DRAW.spray = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 18; i++) { const b = f.a + (hash(i, 7) - 0.5) * f.arc, d = 20 + f.r * e * (0.5 + 0.5 * hash(i, 9)), h = Math.sin(k * Math.PI) * 18 * hash(i, 4);
    const x = f.x + Math.cos(b) * d + vx * h, y = f.y + Math.sin(b) * d + vy * h, col = f.cols[i % f.cols.length];
    if (f.cols[0] === '#E8C860') { ctx.save(); ctx.translate(x, y); ctx.rotate(b + i + k * 4); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); }, col, 2.6); ctx.restore(); }
    else inked(ctx, () => blob(ctx, x, y, 4 + 3 * hash(i, 2), 5, i, 1), col); }
  ctx.restore();
};
// straw stuck on those Pitch Hay covered
DRAW.hayOn = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const e = f.unit; ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.5);
  for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + 0.3, d = e.r * 0.6; ctx.save(); ctx.translate(e.x + Math.cos(b) * d, e.y + Math.sin(b) * d); ctx.rotate(b * 2.3); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); }, '#E8C860', 2.2); ctx.restore(); }
  ctx.restore();
};
// Burrow: a mound of churned earth running along under the floor
DRAW.mound = (ctx, f, w, layer) => {
  if (layer !== 'ground' || !f.unit) return; const u = f.unit;
  if (u.hidden && (!f.pts.length || Math.hypot(u.x - f.pts[f.pts.length - 1].x, u.y - f.pts[f.pts.length - 1].y) > 12)) f.pts.push({ x: u.x, y: u.y, t: f.t });
  for (const p of f.pts) { const a = k01(1 - (f.t - p.t) / 0.9); ctx.save(); ctx.globalAlpha *= a * 0.8; inked(ctx, () => blob(ctx, p.x, p.y, 10, 6, p.x, 1), '#7A5A3A'); ctx.restore(); }
  if (u.hidden) inked(ctx, () => blob(ctx, u.x, u.y, 18 + Math.sin(f.t * 30) * 2, 7, f.t * 8, 1), '#9C7650');
};
Object.assign(EL2, { thunderBlow: 'storm', warHorn: 'fire', skullSplitter: 'earth', smokeBomb: 'shadow', pickpocket: 'song', lowBlow: 'earth',
  shadowWalk: 'shadow', blackout: 'shadow', deathMark: 'necro', toss: 'earth', pitchHay: 'song', forkCharge: 'earth', dirtFling: 'earth', burrow: 'earth', spadeBat: 'earth' });
// the smoke bomb: a black ball with a lit fuse
// Warhelm's warhammer flying head over heels, crackling with shock
PROJ2.warhammer = (ctx, p, T, ang, sp) => {
  ctx.save(); ctx.rotate(ang); trail(ctx, sp, 50, 14, '#FFE66B'); ctx.restore();
  lit(ctx, () => glowDisc(ctx, 0, 0, 30, '#FFE66B', 0.4));
  ctx.rotate(T * 18 + p.x * 0.01); ctx.scale(1.6, 1.6);
  inked(ctx, () => roundRect(ctx, -2.4, -2, 4.8, 22, 2), '#7A4A28');
  inked(ctx, () => roundRect(ctx, -12, -13, 24, 13, 3), '#8E98A6'); ctx.fillStyle = '#C9D2DE'; ctx.fillRect(-10, -12, 20, 3.4);
};
// the Bandit's bolas: two weighted balls on a cord, whirling
PROJ2.bolas = (ctx, p, T) => {
  ctx.rotate(T * 22); const L = 15;
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, 5, L, 0); }, '#C9A070', 2.4);
  inkDisc(ctx, -L, 0, 5.5, '#6E5E50'); inkDisc(ctx, L, 0, 5.5, '#6E5E50'); disc(ctx, -L - 1.5, -1.5, 1.8, '#A89888'); disc(ctx, L - 1.5, -1.5, 1.8, '#A89888');
};
// a clod of earth (the Digger's spade throws three)
PROJ2.clod = (ctx, p, T) => { ctx.rotate(T * 9 + p.x); inked(ctx, () => blob(ctx, 0, 0, 6, 5, p.x | 0, 1), '#7A5A3A'); disc(ctx, -1.5, -1.5, 2, '#9C7650'); };
PROJ2.smokeBomb = (ctx, p, T, ang) => {
  ctx.rotate(T * 10); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); }, '#3A3440');
  ctx.fillStyle = '#6A6470'; ctx.beginPath(); ctx.arc(-2.5, -2.5, 3, 0, TAU); ctx.fill();
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(4, -5); ctx.quadraticCurveTo(9, -9, 8, -13); }, '#C9A070', 2);
  lit(ctx, () => glowDisc(ctx, 8, -13, 8, '#FFC85A', 0.8));
};

// ----- batch 3
Object.assign(EL2, { breadToss: 'song', harvest: 'bone', oldTales: 'song', acidFlask: 'poison', elixir: 'blood', bangFlask: 'fire',
  healTotem: 'nature', spiritLink: 'water', rainDance: 'water', frogHex: 'nature', cursedBrew: 'necro', broomRide: 'necro',
  eldritchBeam: 'necro', summonImp: 'fire', darkBargain: 'blood' });
Object.assign(ALIAS2, { flask: 'vial', spirit: 'bolt', hexbolt: 'bolt', bread: 'note', cauldron: 'vial' });
// a lobbed thing rises and falls on its way (kits2 lob sets life0): lift the drawing by the arc, a shadow left below
export function lobUp(ctx, p, H = 44) {
  if (!p.life0) return; const k = clamp(1 - p.life / p.life0, 0, 1), h = Math.sin(Math.PI * k) * Math.min(H, 20 + p.life0 * 60), [vx, vy] = upVec();
  ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.translate(vx * h, vy * h);
}
// a round flask of coloured brew, spinning
PROJ2.flask = (ctx, p, T) => {
  lobUp(ctx, p); ctx.rotate(T * 11 + p.x * 0.01); ctx.scale(1.5, 1.5);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 2, 6.5, 0, TAU); ctx.rect(-2.4, -8, 4.8, 6); }, '#E8F0EA');
  disc(ctx, 0, 3, 5, p.color || '#9BCB3C'); ctx.fillStyle = '#8A5A3A'; ctx.fillRect(-2.8, -10, 5.6, 3.2);
  disc(ctx, -2, 0.5, 1.5, 'rgba(255,255,255,0.75)');
};
// a crusty loaf
// (round 13: "Doesnt look the best overall"): a big golden loaf, lobbed high, scored on top, steam curling off it
PROJ2.bread = (ctx, p, T) => {
  lobUp(ctx, p, 60); const [vx, vy] = upVec();
  for (let i = 0; i < 2; i++) { const ph = (T * 1.6 + i * 0.5) % 1; ctx.save(); ctx.globalAlpha *= 0.7 * Math.sin(ph * Math.PI); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo((i - 0.5) * 8, 0); ctx.quadraticCurveTo((i - 0.5) * 8 + 5 * Math.sin(T * 6 + i), 0, (i - 0.5) * 8 + vx * (10 + ph * 16), vy * (10 + ph * 16)); }, '#FFFFFF', 2.2); ctx.restore(); }
  ctx.rotate(Math.sin(T * 5) * 0.4); ctx.scale(1.4, 1.4);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 12, 7.5, 0, 0, TAU); }, '#D08A40');
  ctx.fillStyle = '#E8AC5C'; ctx.beginPath(); ctx.ellipse(-1, -1.5, 9, 4.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#F8DCA0'; ctx.lineWidth = 2; for (const x of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(x - 2, -4); ctx.lineTo(x + 2, 3); ctx.stroke(); }
};
// the witch's cauldron flying (it lands upright)
PROJ2.cauldron = (ctx, p, T) => { lobUp(ctx, p); ctx.rotate(T * 8); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); }, '#3A3440'); disc(ctx, 0, 0, 6.5, '#7FCB3A'); };
// the Shaman's spirit: a teal wisp with a curling tail
PROJ2.spirit = (ctx, p, T, ang, sp) => {
  ctx.rotate(ang); trail(ctx, sp, 40, 8, '#7FE0D0');
  for (let i = 0; i < 3; i++) { const ph = (T * 3 + i / 3) % 1; disc(ctx, -8 - ph * 26, Math.sin(T * 10 + i * 2) * 6 * ph, 3 * (1 - ph) + 0.5, '#BFF6EC'); }
  lit(ctx, () => glowDisc(ctx, 0, 0, 20, '#7FE0D0', 0.6));
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(2, -8, -6, -3); ctx.quadraticCurveTo(-2, 0, -6, 3); ctx.quadraticCurveTo(2, 8, 10, 0); ctx.closePath(); }, '#7FE0D0');
  disc(ctx, 4, -1.5, 2.2, '#FFFFFF');
};
// a splash of brew where a flask burst
DRAW.splash = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.2, f.col, 0.5 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + hash(i, f.x | 0), d = f.r * (0.3 + 0.8 * e); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 4.5 * (1 - 0.6 * k), i % 2 ? f.col : '#FFFFFF'); }
  ctx.restore();
};
// crumbs and a warm glow where a loaf is eaten
DRAW.crumbs = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), [vx, vy] = upVec();
  if (k < 0.5) lit(ctx, () => glowDisc(ctx, f.x, f.y, 54, '#FFE7A0', 0.6 * (1 - k / 0.5)));
  ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 3; i++) { const q = k01(k * 1.3 - i * 0.12), up = 14 + 30 * easeOut(q); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + (i - 1) * 10, f.y); ctx.quadraticCurveTo(f.x + (i - 1) * 10 + 7 * Math.sin(f.t * 8 + i), f.y + vy * up * 0.5, f.x + (i - 1) * 10 + vx * up, f.y + vy * up); }, '#FFFFFF', 2.4); } ctx.restore();
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 7; i++) { const b = i / 7 * TAU, h = Math.sin(k * Math.PI) * 20 * hash(i, 2), d = 8 + 26 * easeOut(k); inkDisc(ctx, f.x + Math.cos(b) * d + vx * h, f.y + Math.sin(b) * d * 0.6 + vy * h, 2.8, i % 2 ? '#D89A50' : '#F2CF8A'); }
  ctx.restore();
};
// Old Tales: little speech puffs rising off the teller and the listeners
DRAW.bubble = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const u = f.unit, k = k01(f.t / f.max), [vx, vy] = upVec();
  ctx.save(); ctx.globalAlpha *= Math.sin(k * Math.PI);
  const n = f.talk ? 3 : 1;
  for (let i = 0; i < n; i++) { const q = k01(k * 1.4 - i * 0.2), up = u.vr + 10 + 26 * q;
    upright(ctx, u.x + vx * up + (i - 1) * 12 * (f.talk ? 1 : 0), u.y + vy * up, () => { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 10, 7, 0, 0, TAU); }, '#FFF8EA');
      for (const x of [-4, 0, 4]) disc(ctx, x, 0, 1.4, '#7A6A58'); }); }
  ctx.restore();
};
// Acid Flask: a hissing yellow-green pool with bubbles popping in it
DRAW.acid = (ctx, f, w, layer) => {
  const a = life(f, 0.2, 0.6);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.75 * a; ctx.fillStyle = '#8FB82A'; blob(ctx, f.x, f.y, f.r, 9, f.x * 0.1, 1); ctx.fill(); ctx.fillStyle = '#C8E63C'; blob(ctx, f.x - 4, f.y - 4, f.r * 0.7, 8, f.y * 0.1, 1); ctx.fill(); ctx.restore(); return; }
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 6; i++) { const ph = (f.t * 1.3 + hash(i, 5)) % 1, b = hash(i, 1) * TAU, d = f.r * 0.7 * hash(i, 8); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 2 + 4 * ph, '#E6F7B0'); }
  ctx.restore();
};
// Bang Flask: the flask sitting there, fuse sputtering, swelling before it goes
DRAW.fuse = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), s = 1.4 + 0.5 * k + 0.15 * Math.sin(f.t * 40);
  ctx.save(); ctx.translate(f.x, f.y); ctx.scale(s, s);
  if (f.bomb) { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); }, '#3A3440'); disc(ctx, -3, -3, 3, '#6A6470'); }
  else { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 2, 6.5, 0, TAU); ctx.rect(-2.4, -8, 4.8, 6); }, '#E8F0EA'); disc(ctx, 0, 3, 5, '#FF8A3D'); }
  ctx.restore();
  lit(ctx, () => glowDisc(ctx, f.x, f.y - 14 * s, 10 + 6 * Math.sin(f.t * 50), '#FFC85A', 0.8));
  ctx.save(); ctx.globalAlpha *= 0.25 + 0.4 * k; ctx.setLineDash([6, 6]); ctx.strokeStyle = '#FF6B5A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r || 95, 0, TAU); ctx.stroke(); ctx.restore();
};
// Rain Dance: a cloud's shadow on the floor and rain streaking down through it
DRAW.rain = (ctx, f, w, layer) => {
  const a = life(f, 0.3, 0.6);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.3 * a; ctx.fillStyle = '#2F5F88'; blob(ctx, f.x, f.y, f.r, 9, 1, 1); ctx.fill(); ctx.restore(); return; }
  const [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 26; i++) { const ph = (f.t * 2.4 + hash(i, 3)) % 1, b = hash(i, 4) * TAU, d = f.r * Math.sqrt(hash(i, 6)), x = f.x + Math.cos(b) * d, y = f.y + Math.sin(b) * d, h = 60 * (1 - ph);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x + vx * h, y + vy * h); ctx.lineTo(x + vx * (h - 12), y + vy * (h - 12)); }, '#9FD8F2', 1.8); }
  ctx.restore();
};
// Eldritch Beam: a magenta beam that thickens and brightens the longer it holds
DRAW.ebeam = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.from || !f.to) return; const p = f.from, q = f.to, h = Math.min(10, f.heat || 0), wd = (f.thin ? 2 : 3.5) + h * (f.thin ? 0.2 : 0.5), C = f.col || '#E05AB8';
  lit(ctx, () => { ctx.globalAlpha *= 0.35; ctx.strokeStyle = C; ctx.lineWidth = wd * 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.globalAlpha /= 0.35; glowDisc(ctx, q.x, q.y, 20 + h * 3, C, 0.6); });
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); }, C, wd);
  ctx.strokeStyle = '#FFE0F4'; ctx.lineWidth = wd * 0.35; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
};
// Summon Imp: a red-hot crack opening in the floor, then shutting
DRAW.gate = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const k = k01(f.t / f.max), o = Math.sin(k * Math.PI);
  const st = f.col === 'steel';
  lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 2, st ? '#DCE3EC' : '#FF5A3D', 0.5 * o));
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * o, f.r * 0.45 * o, 0, 0, TAU); }, st ? '#6E7680' : '#2B1A1A');
  ctx.fillStyle = st ? '#FFF4C8' : '#FF8A3D'; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 0.7 * o, f.r * 0.25 * o, 0, 0, TAU); ctx.fill();
};
// Dark Bargain: blood drawn out of him in a swirl, then pulled into his hands
DRAW.bargain = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const u = f.unit, k = k01(f.t / f.max);
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + k * 8, d = (u.vr + 30) * Math.sin(k * Math.PI) + 6; inkDisc(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, 4 * (1 - 0.5 * k), i % 2 ? '#C8453D' : '#E05AB8'); }
  if (k > 0.6) lit(ctx, () => glowDisc(ctx, u.x + Math.cos(u.facing) * 26, u.y + Math.sin(u.facing) * 26, 30, '#E05AB8', (k - 0.6) * 2));
  ctx.restore();
};

// ----- batch 4
Object.assign(EL2, { bloodPact: 'blood', ritualCircle: 'necro', soulCandle: 'shadow', flurry: 'steel', palmStrike: 'holy', innerPeace: 'holy',
  foresight: 'shadow', premonition: 'shadow', starfall: 'holy', hotMeal: 'fire', greaseFire: 'fire', foodFight: 'song',
  swarm: 'song', honeyPot: 'song', royalJelly: 'song' });
Object.assign(ALIAS2, { glimmer: 'bolt', bee: 'bolt' });
// the Seer's glimmer: a small violet crystal spinning
PROJ2.glimmer = (ctx, p, T, ang, sp) => {
  ctx.rotate(ang); trail(ctx, sp, 30, 6, '#C9B8FF'); lit(ctx, () => glowDisc(ctx, 0, 0, 16, '#C9B8FF', 0.6));
  ctx.rotate(T * 8); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 0); ctx.lineTo(0, 8); ctx.lineTo(-5, 0); ctx.closePath(); }, '#D9C8FF');
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(2.5, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
};
// a custard pie, cream up
PROJ2.pie = (ctx, p, T) => {
  ctx.rotate(T * 7); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); }, '#D89A50');
  disc(ctx, 0, 0, 7, '#FFF4D0'); disc(ctx, 0, 0, 2.4, '#C8453D');
};
// a bee: striped body, flickering wings
PROJ2.bee = (ctx, p, T, ang) => {
  ctx.rotate(ang + Math.sin(T * 30 + p.x) * 0.3);
  const wing = 0.5 + 0.5 * Math.abs(Math.sin(T * 60 + p.y));
  ctx.save(); ctx.globalAlpha *= 0.7; ctx.fillStyle = '#F2FBFF'; ctx.beginPath(); ctx.ellipse(-1, -6 * wing, 4, 6 * wing, 0.3, 0, TAU); ctx.ellipse(-1, 6 * wing, 4, 6 * wing, -0.3, 0, TAU); ctx.fill(); ctx.restore();
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0, 0, TAU); }, '#FFD45A');
  ctx.fillStyle = '#2B2230'; ctx.fillRect(-3, -4.5, 2.4, 9); ctx.fillRect(1.6, -4.5, 2.4, 9);
};
// Ritual Circle: a smouldering sigil burned into the floor, its runes turning
DRAW.circle = (ctx, f, w, layer) => {
  const a = life(f, 0.4, 0.5);
  if (layer === 'ground') {
    lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#9B2A4A', 0.22 * a));
    ctx.save(); ctx.globalAlpha *= 0.75 * a; ctx.strokeStyle = '#C8453D'; ctx.lineWidth = 3;
    ctx.beginPath(); for (let i = 0; i <= 5; i++) { const b = f.t * 0.5 + i * 2 * TAU / 5; const x = f.x + Math.cos(b) * f.r * 0.85, y = f.y + Math.sin(b) * f.r * 0.85; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.restore(); return;
  }
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 8; i++) { const b = -f.t * 0.6 + i / 8 * TAU; inked(ctx, () => star(ctx, f.x + Math.cos(b) * f.r * 0.92, f.y + Math.sin(b) * f.r * 0.92, 4.5, 4, 0.3, b), '#FF8A7A'); }
  ctx.restore();
};
// Soul Candle: a tall blue-white flame burning over his hand
DRAW.candle = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const u = f.unit, x = u.x + Math.cos(u.facing + 0.7) * (u.r - 4), y = u.y + Math.sin(u.facing + 0.7) * (u.r - 4);
  ctx.save(); ctx.globalAlpha *= life(f, 0.2, 0.4);
  lit(ctx, () => glowDisc(ctx, x, y, 30, '#6FC8FF', 0.5));
  upright(ctx, x, y, () => flame(ctx, 0, 0, 10 + Math.sin(f.t * 20) * 1.5, '#6FC8FF', '#F2FCFF'));
  ctx.restore();
};
// Inner Peace: a soft gold light pooled round him and motes rising slowly
DRAW.peace = (ctx, f, w, layer) => {
  if (!f.unit) return; const u = f.unit, a = life(f, 0.3, 0.5), [vx, vy] = upVec();
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, u.x, u.y, f.r, '#FFE7A0', 0.25 * a)); return; }
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 8; i++) { const ph = (f.t * 0.5 + i / 8) % 1, b = i * 2.4, d = u.vr + 8 + 14 * Math.sin(i); ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inked(ctx, () => star(ctx, u.x + Math.cos(b) * d + vx * ph * 40, u.y + Math.sin(b) * d + vy * ph * 40, 3.5, 4, 0.4, 0), '#FFF0B0'); ctx.restore(); }
  ctx.restore();
};
// Foresight: an open violet eye over the marked enemy
DRAW.eye = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const e = f.unit, [vx, vy] = upVec(), up = e.vr + 20, o = Math.min(1, f.t / 0.25) * life(f, 0.05, 0.4);
  const blink = Math.abs(Math.sin(f.t * 1.3)) > 0.97 ? 0.2 : 1;
  ctx.save(); ctx.globalAlpha *= o;
  lit(ctx, () => glowDisc(ctx, e.x + vx * up, e.y + vy * up, 22, '#C9B8FF', 0.45));
  upright(ctx, e.x + vx * up, e.y + vy * up, () => { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 12, 7 * blink, 0, 0, TAU); }, '#F4EEFF'); disc(ctx, 0, 0, 4 * blink, '#5A4A7A'); disc(ctx, -1, -1, 1.3 * blink, '#FFFFFF'); });
  ctx.restore();
};
// Premonition: a crystal shell round the warded ally, faceted, glinting
DRAW.ward = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const u = f.unit, a = life(f, 0.1, 0.3);
  ctx.save(); ctx.globalAlpha *= 0.55 * a;
  inkLine(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 6; i++) { const b = i / 6 * TAU + f.t * 0.8, x = u.x + Math.cos(b) * (u.r + 8), y = u.y + Math.sin(b) * (u.r + 8); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }, '#D9C8FF', 3);
  ctx.restore();
  lit(ctx, () => glowDisc(ctx, u.x, u.y, u.r + 16, '#C9B8FF', 0.2 * a));
};
// Starfall: a star dropping out of the sky, then bursting
DRAW.star = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), [vx, vy] = upVec(), fall = k01(k / 0.45);
  if (fall < 1) { const h = (1 - fall) * 160; ctx.save(); ctx.globalAlpha *= 0.4; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + vx * (h + 40), f.y + vy * (h + 40)); ctx.lineTo(f.x + vx * h, f.y + vy * h); }, '#FFF0B0', 3); ctx.restore();
    inked(ctx, () => star(ctx, f.x + vx * h, f.y + vy * h, 9, 5, 0.45, f.t * 6), '#FFE7A0'); return; }
  const q = (k - 0.45) / 0.55, e = easeOut(q);
  if (q < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 50, '#FFF0B0', 0.8 * (1 - q / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - q;
  inked(ctx, () => star(ctx, f.x, f.y, 12 + 28 * e, 5, 0.42, 0.3), '#F2C14E'); ctx.fillStyle = '#FFFBEA'; star(ctx, f.x, f.y, 5 + 10 * e, 5, 0.42, 0.3); ctx.fill();
  ctx.restore();
};
// Hot Meal: a steaming plate on the floor
DRAW.meal = (ctx, f, w, layer) => {
  const a = life(f, 0.15, 0.2), [vx, vy] = upVec();
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= a; inked(ctx, () => { ctx.beginPath(); ctx.ellipse(f.x, f.y, 15, 12, 0, 0, TAU); }, '#F2F2EE'); disc(ctx, f.x - 3, f.y, 6, '#C8702A'); disc(ctx, f.x + 4, f.y + 2, 4, '#7FA04A'); disc(ctx, f.x + 2, f.y - 4, 3.5, '#E0B050'); ctx.restore(); return; }
  ctx.save(); ctx.globalAlpha *= a * 0.7;
  for (let i = 0; i < 3; i++) { const ph = (f.t * 0.8 + i / 3) % 1; ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inkDisc(ctx, f.x + (i - 1) * 6 + Math.sin(ph * 6 + i) * 3 + vx * (10 + ph * 26), f.y + vy * (10 + ph * 26), 3 + 3 * ph, '#FFFFFF'); ctx.restore(); }
  ctx.restore();
};
// Grease Fire II: flames licking up off the spilled grease
DRAW.greaseFlames = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const a = life(f, 0.2, 0.6);
  ctx.save(); ctx.globalAlpha *= a;
  f.pts.forEach((p, i) => { for (let j = 0; j < 2; j++) { const b = hash(i, j) * TAU, d = 18 * hash(j, i); upright(ctx, p.x + Math.cos(b) * d, p.y + Math.sin(b) * d, () => flame(ctx, 0, 0, 7 + 2 * Math.sin(f.t * 14 + i + j))); } });
  ctx.restore();
};
// a splat of custard on a face
DRAW.pieFace = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const e = f.unit; ctx.save(); ctx.globalAlpha *= life(f, 0.05, 0.6);
  inked(ctx, () => blob(ctx, e.x + Math.cos(e.facing) * e.r * 0.35, e.y + Math.sin(e.facing) * e.r * 0.35, e.vr * 0.6, 7, e.id, 1), '#FFF4D0');
  ctx.restore();
};
// Honey Pot: a glossy amber pool
DRAW.honey = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const a = life(f, 0.2, 0.6);
  ctx.save(); ctx.globalAlpha *= 0.8 * a;
  ctx.fillStyle = '#C8861A'; blob(ctx, f.x, f.y, f.r, 9, f.x * 0.07, 1); ctx.fill();
  ctx.fillStyle = '#F2B42A'; blob(ctx, f.x - 3, f.y - 3, f.r * 0.8, 8, f.y * 0.07, 1); ctx.fill();
  ctx.fillStyle = 'rgba(255,248,220,0.6)'; ctx.beginPath(); ctx.ellipse(f.x - f.r * 0.3, f.y - f.r * 0.35, f.r * 0.25, f.r * 0.1, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
};
// a guard bee darting out to sting and back
DRAW.beeZip = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.from || !f.to) return; const k = k01(f.t / f.max), q = Math.sin(k * Math.PI), p = f.from, e = f.to;
  const x = p.x + (e.x - p.x) * q, y = p.y + (e.y - p.y) * q;
  ctx.save(); ctx.translate(x, y); PROJ2.bee(ctx, { x, y }, f.t, Math.atan2(e.y - p.y, e.x - p.x)); ctx.restore();
};

// ----- batch 5
Object.assign(EL2, { resupply: 'song', oilBlades: 'fire', flare: 'fire', pavise: 'earth', pinBolt: 'steel', crankUp: 'fire',
  looseFalcon: 'earth', keenEye: 'holy', flock: 'earth', bigBomb: 'fire', stickyBomb: 'fire', blastOff: 'fire',
  reelIn: 'steel', rogueWave: 'water', anchorDrop: 'steel' });
Object.assign(ALIAS2, { pot: 'bone', cbolt: 'arrow', harpoon: 'arrow', bomb: 'fireball' });
// a copper pot, tumbling
PROJ2.pot = (ctx, p, T) => { ctx.rotate(T * 12); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); }, '#C8784A'); disc(ctx, -2.5, -2.5, 3.2, '#F2B07A'); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(17, 0); }, '#5A3A2A', 3); };
// a supply bundle: a tied canvas sack
PROJ2.bundle = (ctx, p, T) => { ctx.rotate(T * 6); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); }, '#D8C49A'); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.moveTo(0, -9); ctx.lineTo(0, 9); }, '#8A5A30', 2.4); };
// a flare: a red stick spitting light
PROJ2.flare = (ctx, p, T) => { lit(ctx, () => glowDisc(ctx, 0, 0, 30, '#FF5A3D', 0.7)); ctx.rotate(T * 9); inked(ctx, () => roundRect(ctx, -3, -9, 6, 18, 2), '#C8453D'); };
// a crossbow bolt: short, thick, square-headed (big: the pinning bolt)
PROJ2.cbolt = (ctx, p, T, ang, sp) => {
  ctx.rotate(ang); const s = p.big ? 1.6 : 1.3; trail(ctx, sp, 44 * s, 4 * s, p.boom ? '#FF9A3D' : '#FFFFFF'); ctx.scale(s, s);
  if (p.boom) lit(ctx, () => glowDisc(ctx, 8, 0, 14, '#FF9A3D', 0.7));
  inked(ctx, () => roundRect(ctx, -14, -2, 22, 4, 2), '#6E5034');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(7, -4.5); ctx.lineTo(7, 4.5); ctx.closePath(); }, p.boom ? '#FF8A3D' : '#A8B0BA');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-18, -4); ctx.lineTo(-10, -1.5); ctx.lineTo(-10, 1.5); ctx.lineTo(-18, 4); ctx.closePath(); }, '#C8453D');
};
// a black bomb with a lit fuse ('big' colour: the Big Bomb)
PROJ2.bomb = (ctx, p, T) => {
  const s = p.color === 'big' ? 1.8 : 1.1; ctx.scale(s, s); ctx.rotate(T * 8);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); }, '#3A3440'); disc(ctx, -2.5, -2.5, 2.8, '#6A6470');
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(4, -6); ctx.quadraticCurveTo(9, -10, 8, -13); }, '#C9A070', 2);
  lit(ctx, () => glowDisc(ctx, 8, -13, 7, '#FFC85A', 0.9));
};
// a barbed harpoon, its rope running back to his hand
PROJ2.harpoon = (ctx, p, T, ang, sp) => {
  const o = p.owner;
  if (o && !o.dead) { ctx.save(); ctx.strokeStyle = '#C9A070'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo((o.x - p.x) / 2, (o.y - p.y) / 2 + 12, o.x - p.x, o.y - p.y); ctx.stroke(); ctx.restore(); }
  ctx.rotate(ang); const s = p.big ? 1.5 : 1.25; ctx.scale(s, s);
  inked(ctx, () => roundRect(ctx, -24, -1.8, 30, 3.6, 1.8), '#8A5A30');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(6, -5); ctx.lineTo(8, 0); ctx.lineTo(6, 5); ctx.closePath(); ctx.moveTo(6, -5); ctx.lineTo(2, -7); ctx.lineTo(5, -2); }, '#C9D2DE');
};
// Oil the Blades: a warm flicker on the weapon hand while it lasts
DRAW.oilGlow = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const u = f.unit, x = u.x + Math.cos(u.facing - 0.6) * (u.r + 4), y = u.y + Math.sin(u.facing - 0.6) * (u.r + 4);
  ctx.save(); ctx.globalAlpha *= life(f, 0.2, 0.5); upright(ctx, x, y, () => flame(ctx, 0, 0, 6 + Math.sin(f.t * 16) * 1.2)); ctx.restore();
};
// Flare: a red light pooled on the floor with the flare spitting at its middle
DRAW.flare = (ctx, f, w, layer) => {
  const a = life(f, 0.15, 0.6);
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#FF5A3D', (0.28 + 0.06 * Math.sin(f.t * 23)) * a)); return; }
  ctx.save(); ctx.globalAlpha *= a; inked(ctx, () => roundRect(ctx, f.x - 3, f.y - 8, 6, 14, 2), '#C8453D');
  lit(ctx, () => glowDisc(ctx, f.x, f.y - 8, 16 + Math.sin(f.t * 31) * 4, '#FFC85A', 0.9));
  for (let i = 0; i < 4; i++) { const ph = (f.t * 2 + i / 4) % 1, b = hash(i, 9) * TAU; disc(ctx, f.x + Math.cos(b) * ph * 30, f.y - 8 + Math.sin(b) * ph * 30, 2 * (1 - ph) + 0.5, '#FFE08A'); }
  ctx.restore();
};
// Pavise: the tall shield planted in front of him
DRAW.pavise = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const u = f.unit, a = f.a, x = u.x + Math.cos(a) * (u.r + 12), y = u.y + Math.sin(a) * (u.r + 12), rise = easeOut(k01(f.t / 0.2));
  ctx.save(); ctx.globalAlpha *= life(f, 0.05, 0.3); ctx.translate(x, y); ctx.rotate(a); ctx.scale(rise, 1);
  inked(ctx, () => roundRect(ctx, -6, -26, 12, 52, 4), '#6E7F98'); ctx.fillStyle = '#C8453D'; ctx.fillRect(-2, -20, 4, 40);
  ctx.restore();
};
// the falcon: a slate-grey bird, wings beating
DRAW.falcon = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const beat = Math.sin(f.t * 26) * 0.5;
  ctx.save(); ctx.globalAlpha *= life(f, 0.05, 0.1); ctx.translate(f.x, f.y); ctx.rotate(f.a);
  for (const s of [-1, 1]) inked(ctx, () => { ctx.beginPath(); ctx.moveTo(2, 0); ctx.quadraticCurveTo(-4, s * (14 + 6 * beat), -12, s * (20 + 8 * beat)); ctx.quadraticCurveTo(-6, s * 6, -6, 0); ctx.closePath(); }, '#6E7680');
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, TAU); }, '#8A94A6');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-18, -5); ctx.lineTo(-18, 5); ctx.closePath(); }, '#6E7680');
  disc(ctx, 9, 0, 4, '#A8B0BA'); ctx.fillStyle = '#E8B53A'; ctx.beginPath(); ctx.moveTo(13, -1.5); ctx.lineTo(17, 0); ctx.lineTo(13, 1.5); ctx.fill();
  ctx.restore();
};
// Call the Flock: a cloud of little birds sweeping along
DRAW.flock = (ctx, f, w, layer) => {
  if (layer !== 'air') return; ctx.save(); ctx.globalAlpha *= life(f, 0.05, 0.2);
  for (let i = 0; i < 9; i++) { const ox = (hash(i, 1) - 0.5) * 60, oy = (hash(i, 2) - 0.5) * 60 + Math.sin(f.t * 12 + i) * 5, beat = Math.sin(f.t * 30 + i * 2) * 0.5;
    ctx.save(); ctx.translate(f.x + ox, f.y + oy); ctx.rotate(f.a);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, -6 - 4 * beat); ctx.quadraticCurveTo(0, -1, 0, 0); ctx.quadraticCurveTo(0, 1, -6, 6 + 4 * beat); }, '#4A4450', 2.6); ctx.restore(); }
  ctx.restore();
};
// Sticky Bomb: the bomb stuck on, its fuse burning down, a red ring tightening
DRAW.sticky = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const e = f.unit, k = k01(f.t / f.max), x = e.x + Math.cos(e.facing + 2) * e.r * 0.6, y = e.y + Math.sin(e.facing + 2) * e.r * 0.6;
  ctx.save(); ctx.translate(x, y); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); }, '#3A3440'); ctx.restore();
  lit(ctx, () => glowDisc(ctx, x + 4, y - 7, 6 + 4 * Math.sin(f.t * 30), '#FFC85A', 0.9));
  ctx.save(); ctx.globalAlpha *= 0.3 + 0.5 * k; ctx.setLineDash([6, 6]); ctx.strokeStyle = '#FF6B5A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 30 * (1 - k) + 10, 0, TAU); ctx.stroke(); ctx.restore();
};
// a rope between the harpooner and what he caught
DRAW.rope = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.from || !f.to) return; const p = f.from, q = f.to, sag = 14 * Math.sin(f.t * 3);
  ctx.save(); ctx.globalAlpha *= life(f, 0.02, 0.2);
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo((p.x + q.x) / 2, (p.y + q.y) / 2 + sag, q.x, q.y); }, '#C9A070', 2.6); ctx.restore();
};
// Rogue Wave: a curl of sea water crashing outward in a cone
DRAW.wave = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), R = 30 + (f.r - 30) * e;
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, R, f.a - f.arc / 2, f.a + f.arc / 2); ctx.arc(f.x, f.y, Math.max(10, R - 26), f.a + f.arc / 2, f.a - f.arc / 2, true); ctx.closePath(); }, '#5DB7E0');
  ctx.strokeStyle = '#F2FBFF'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, R - 4, f.a - f.arc / 2 + 0.05, f.a + f.arc / 2 - 0.05); ctx.stroke();
  for (let i = 0; i < 8; i++) { const b = f.a + (hash(i, 3) - 0.5) * f.arc; disc(ctx, f.x + Math.cos(b) * (R + 6), f.y + Math.sin(b) * (R + 6), 4 * (1 - k), '#BFE9F8'); }
  ctx.restore();
};
// Drop Anchor: the anchor's shadow growing on the floor, then the anchor slamming down
DRAW.anchor = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), fall = k01(k / 0.85), [vx, vy] = upVec(), h = (1 - fall * fall) * 200;
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.25 + 0.3 * fall; ctx.fillStyle = '#2B2230'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 20 * fall + 6, 14 * fall + 4, 0, 0, TAU); ctx.fill();
    ctx.setLineDash([6, 6]); ctx.strokeStyle = '#FF6B5A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke(); ctx.restore(); return; }
  if (k > 0.9) return;
  upright(ctx, f.x + vx * h, f.y + vy * h, () => {
    inked(ctx, () => roundRect(ctx, -3, -34, 6, 34, 2), '#8A94A6');
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-20, -6); ctx.quadraticCurveTo(0, 10, 20, -6); ctx.lineTo(16, -2); ctx.quadraticCurveTo(0, 4, -16, -2); ctx.closePath(); }, '#A8B0BA');
    inked(ctx, () => roundRect(ctx, -12, -30, 24, 5, 2), '#8A94A6');
  });
};

// ----- batches 6 and 7
Object.assign(EL2, { runningThrow: 'earth', bound: 'earth', prey: 'blood', aimedShot: 'steel', bayonet: 'steel', ricochet: 'steel',
  shurikenFan: 'shadow', substitution: 'shadow', caltrops: 'steel', pointBlank: 'fire', grog: 'song', broadside: 'fire',
  stunStone: 'earth', ramCharge: 'earth', gravel: 'earth', jawTrap: 'steel', snareNet: 'nature', tripwire: 'steel',
  netThrow: 'nature', showboat: 'holy', shieldRush: 'earth', mock: 'song', befuddle: 'song', juggle: 'song',
  iaido: 'steel', focus: 'holy', crescentCut: 'steel', valkyrieCall: 'holy', spearThrow: 'storm', skyDive: 'holy' });
Object.assign(ALIAS2, { javelin: 'arrow', bullet: 'arrow', shuriken: 'dagger', stone: 'bone', net: 'thorn', ball: 'note', crescent: 'shard', spear: 'arrow', trapThrown: 'bone' });
const stick = (ctx, L, wd, col) => inked(ctx, () => roundRect(ctx, -L, -wd / 2, L * 2, wd, wd / 2), col);
PROJ2.javelin = (ctx, p, T, ang, sp) => { ctx.rotate(ang); const s = p.big ? 1.5 : 1.25; trail(ctx, sp, 50 * s, 4 * s, '#FFFFFF'); ctx.scale(s, s); stick(ctx, 18, 3.4, '#B07A45'); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(16, -4.5); ctx.lineTo(16, 4.5); ctx.closePath(); }, '#C9D2DE'); };
PROJ2.spear = (ctx, p, T, ang, sp) => { ctx.rotate(ang); trail(ctx, sp, 70, 7, p.o && p.o.shock ? '#FFE66B' : '#FFFFFF'); if (p.o && p.o.shock) lit(ctx, () => glowDisc(ctx, 14, 0, 24, '#FFE66B', 0.5)); ctx.scale(1.6, 1.6); stick(ctx, 22, 3.6, '#8A5A30');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(20, -6); ctx.lineTo(22, 0); ctx.lineTo(20, 6); ctx.closePath(); }, '#EEF3F8'); };
PROJ2.bullet = (ctx, p, T, ang, sp) => { ctx.rotate(ang); trail(ctx, sp, p.big ? 110 : 70, p.big ? 5 : 3.5, '#FFF4C8'); if (p.big) lit(ctx, () => glowDisc(ctx, 0, 0, 18, '#FFF4C8', 0.6)); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, p.big ? 7 : 5, p.big ? 4.5 : 3.5, 0, 0, TAU); }, '#8A94A6'); };
PROJ2.shuriken = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 26, 5, '#C9D2DE'); ctx.restore(); const s = p.big ? 1.4 : 1.1; ctx.scale(s, s); ctx.rotate(T * 26);
  inked(ctx, () => star(ctx, 0, 0, 10, 4, 0.32, 0), '#A8B0BA'); disc(ctx, 0, 0, 2.2, '#2B2230'); };
PROJ2.stone = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 26, p.r * 0.8, '#E9DDC2'); ctx.restore(); inked(ctx, () => blob(ctx, 0, 0, p.r * (p.big ? 1.25 : 1), 6, p.x * 0.05, 1), '#A99C8B'); disc(ctx, -p.r * 0.3, -p.r * 0.3, p.r * 0.35, '#D8CDB8'); };
PROJ2.net = (ctx, p, T) => { ctx.rotate(T * 5); const r = 14; inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); }, 'rgba(201,160,112,0.35)');
  ctx.strokeStyle = '#C9A070'; ctx.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 5, -r); ctx.lineTo(i * 5, r); ctx.moveTo(-r, i * 5); ctx.lineTo(r, i * 5); ctx.stroke(); } };
PROJ2.trapThrown = (ctx, p, T) => { ctx.rotate(T * 9); inkLine(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); }, '#6E7680', 3); };
PROJ2.ball = (ctx, p, T) => { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, TAU); }, p.color || '#C8453D'); disc(ctx, -2.5, -2.5, 2.4, '#FFFFFF'); };
PROJ2.crescent = (ctx, p, T, ang, sp) => { ctx.rotate(ang); lit(ctx, () => glowDisc(ctx, 0, 0, 30, '#FFFFFF', 0.4));
  inked(ctx, () => { ctx.beginPath(); ctx.arc(-14, 0, 26, -1.1, 1.1); ctx.arc(-24, 0, 26, 0.95, -0.95, true); ctx.closePath(); }, '#EEF3F8');
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-14, 0, 24, -0.7, 0.7); ctx.arc(-18, 0, 24, 0.6, -0.6, true); ctx.closePath(); ctx.fill(); };
// a gun's flash and a puff of powder smoke at the muzzle
DRAW.muzzle = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), u = f.unit, d = (u ? u.r : 30) + 22, x = f.x + Math.cos(f.a) * d, y = f.y + Math.sin(f.a) * d;
  if (k < 0.25) { lit(ctx, () => glowDisc(ctx, x, y, 30, '#FFE08A', 0.9 * (1 - k / 0.25))); inked(ctx, () => star(ctx, x, y, 12 * (1 - k * 2), 5, 0.4, f.a), '#FFF4C8'); }
  ctx.save(); ctx.globalAlpha *= 0.7 * (1 - k);
  for (let i = 0; i < 4; i++) { const b = f.a + (hash(i, 4) - 0.5) * 1.2, r = 6 + 14 * k; disc(ctx, x + Math.cos(b) * 16 * k * (i + 1) * 0.6, y + Math.sin(b) * 16 * k * (i + 1) * 0.6, r, '#D8D4CC'); }
  ctx.restore();
};
// Aimed Shot: a thin red line held on the target while he aims
DRAW.aimLine = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.from || !f.to) return; const k = k01(f.t / f.max);
  ctx.save(); ctx.globalAlpha *= 0.35 + 0.5 * k; ctx.setLineDash([5, 7]); ctx.strokeStyle = '#FF5A3D'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.from.x, f.from.y); ctx.lineTo(f.to.x, f.to.y); ctx.stroke();
  ctx.setLineDash([]); ctx.beginPath(); ctx.arc(f.to.x, f.to.y, f.to.r + 12 - 8 * k, 0, TAU); ctx.stroke(); ctx.restore();
};
// Substitution: the log left behind where she stood
DRAW.log = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const a = life(f, 0.02, 0.4); ctx.save(); ctx.globalAlpha *= a; ctx.translate(f.x, f.y); ctx.rotate(0.5);
  inked(ctx, () => roundRect(ctx, -16, -7, 32, 14, 6), '#8A5A30'); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(16, 0, 4, 7, 0, 0, TAU); }, '#D8B080'); ctx.restore();
};
// Caltrops: little iron spikes scattered on the floor
DRAW.caltrops = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.4);
  for (let i = 0; i < 16; i++) { const b = hash(i, 1) * TAU, d = f.r * Math.sqrt(hash(i, 2)); inked(ctx, () => star(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 5, 4, 0.3, i), '#6E7680'); }
  ctx.restore();
};
// Broadside: a cannonball's growing shadow and the warning ring, the ball dropping in
DRAW.shell = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), [vx, vy] = upVec(), h = (1 - k * k) * 220;
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.2 + 0.4 * k; ctx.fillStyle = '#2B2230'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 16 * k + 4, 11 * k + 3, 0, 0, TAU); ctx.fill();
    ctx.setLineDash([6, 6]); ctx.strokeStyle = '#FF6B5A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke(); ctx.restore(); return; }
  inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + vx * h, f.y + vy * h, 10, 0, TAU); }, '#3A3440');
};
// the Slinger's ram: a woolly cream ram with curled horns, charging
DRAW.ram = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const bob = Math.abs(Math.sin(f.t * 22)) * 3; ctx.save(); ctx.globalAlpha *= life(f, 0.05, 0.15); ctx.translate(f.x, f.y); ctx.rotate(f.a);
  inked(ctx, () => blob(ctx, -6, 0, 20 + bob * 0.3, 9, 1, 1), '#F2E8DA');
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(16, 0, 10, 8, 0, 0, TAU); }, '#7A6A58');
  for (const s of [-1, 1]) inked(ctx, () => { ctx.beginPath(); ctx.arc(14, s * 9, 6, 0, TAU); }, '#C9B898');
  ctx.restore();
  ctx.save(); ctx.globalAlpha *= 0.6; for (let i = 0; i < 3; i++) disc(ctx, f.x - Math.cos(f.a) * (30 + i * 12) + (hash(i, f.t * 10 | 0) - 0.5) * 16, f.y - Math.sin(f.a) * (30 + i * 12), 6 - i, '#E9DDC2'); ctx.restore();
};
// Jaw Trap: steel jaws open on the floor; shut once it has caught something
DRAW.trap = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const shut = f.snapT != null, x = f.held && !f.held.dead ? f.held.x : f.x, y = f.held && !f.held.dead ? f.held.y : f.y;
  ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.3); ctx.translate(x, y);
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); }, '#6E7680', 3);
  const o = shut ? 2 : 14;
  for (const s of [-1, 1]) inkLine(ctx, () => { ctx.beginPath(); for (let i = -3; i <= 3; i++) { const xx = i * 4, yy = s * (o - (i % 2 ? 3 : 0)); i === -3 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); } }, '#A8B0BA', 2.4);
  ctx.restore();
  if (shut && f.t - f.snapT < 0.3) lit(ctx, () => glowDisc(ctx, x, y, 40, '#FFFFFF', 0.7 * (1 - (f.t - f.snapT) / 0.3)));
};
// a net spread over the floor or over a held enemy
DRAW.netOn = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const e = f.unit, x = e ? e.x : f.x, y = e ? e.y : f.y, r = f.r, a = life(f, 0.05, 0.3);
  ctx.save(); ctx.globalAlpha *= 0.85 * a; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 3.2; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * 10 - r, y - r); ctx.lineTo(x + i * 10 + r, y + r); ctx.moveTo(x + i * 10 + r, y - r); ctx.lineTo(x + i * 10 - r, y + r); ctx.stroke(); }
  ctx.strokeStyle = '#C9A070'; ctx.lineWidth = 1.6; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * 10 - r, y - r); ctx.lineTo(x + i * 10 + r, y + r); ctx.moveTo(x + i * 10 + r, y - r); ctx.lineTo(x + i * 10 - r, y + r); ctx.stroke(); }
  ctx.restore();
};
// Tripwire: a taut wire between two pegs
DRAW.wire = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; ctx.save(); ctx.globalAlpha *= life(f, 0.15, 0.4);
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); }, '#C9D2DE', 2);
  for (const [x, y] of [[f.x1, f.y1], [f.x2, f.y2]]) inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); }, '#8A5A30');
  ctx.restore();
};
// Befuddle: stars and birds going round the confused one's head
DRAW.swirlStars = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const e = f.unit, [vx, vy] = upVec(), hx = e.x + vx * (e.vr + 12), hy = e.y + vy * (e.vr + 12);
  ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.3);
  for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + f.t * 5; inked(ctx, () => star(ctx, hx + Math.cos(b) * 18, hy + Math.sin(b) * 7, 4.5, 5, 0.45, b), i % 2 ? '#E05AB8' : '#FFD45A'); }
  ctx.restore();
};
// Iaido: the white line of the cut left hanging in the air
DRAW.slashLine = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), a = Math.atan2(f.y2 - f.y1, f.x2 - f.x1), L = Math.hypot(f.x2 - f.x1, f.y2 - f.y1);
  ctx.save(); ctx.globalAlpha *= 1 - k; K.streak(ctx, f.x1, f.y1, a, 0, L * (0.6 + 0.4 * easeOut(Math.min(1, k * 4))), 7 * (1 - k) + 1.5, '#EEF3F8', '#FFFFFF'); ctx.restore();
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x2, f.y2, 30, '#FFFFFF', 0.6 * (1 - k / 0.2)));
};

// ----- batch 8
Object.assign(EL2, { deployTurret: 'steel', tinker: 'storm', shockMine: 'storm', turnWolf: 'blood', frenzy: 'blood', pounce: 'earth' });
// Shock Mine: a squat steel mine on the floor, its light blinking
DRAW.mine = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.2);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, 11, 0, TAU); }, '#6E7680'); disc(ctx, f.x, f.y, 6, '#A8B0BA');
  if (Math.sin(f.t * 8) > 0) lit(ctx, () => glowDisc(ctx, f.x, f.y, 12, '#FFE66B', 0.9));
  ctx.restore();
};

// ---------------------------------------------------------------- round 13 (lane H2): slams and shot bursts of their own
// SLAM2[look](ctx, m, k, layer): a hero's slam on the floor (fxkit slamGround / slamAir; a hero's style.slam names it)
export const SLAM2 = {
  // a warhammer head brought down on the spot: a dark dent, a flash, a ring of dust and stone chips (no flail ball)
  hammer(ctx, m, k, layer) {
    const e = easeOut(k01((k - 0.12) / 0.6)), R = m.r;
    if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 1 - k; ctx.fillStyle = 'rgba(60,48,38,0.3)'; ctx.beginPath(); ctx.ellipse(m.x, m.y, R * 0.75, R * 0.6, m.a || 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(43,34,48,0.5)'; ctx.lineWidth = 2.2; for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + hash(m.seed, i); ctx.beginPath(); ctx.moveTo(m.x + Math.cos(b) * R * 0.25, m.y + Math.sin(b) * R * 0.25); ctx.lineTo(m.x + Math.cos(b) * R * (0.55 + 0.25 * hash(i, m.seed)), m.y + Math.sin(b) * R * (0.55 + 0.25 * hash(i, m.seed))); ctx.stroke(); }
      ctx.restore(); return; }
    if (k < 0.14) { const [ux, uy] = upVec(), h = (1 - k / 0.14) * 30; // the head coming down
      ctx.save(); ctx.translate(m.x + ux * h, m.y + uy * h); ctx.rotate(m.a || 0); inked(ctx, () => roundRect(ctx, -8, -13, 16, 26, 3), '#A8B0BA'); ctx.fillStyle = '#DCE3EC'; ctx.fillRect(-6, -11, 4, 22); ctx.restore(); return; }
    if (k < 0.28) lit(ctx, () => glowDisc(ctx, m.x, m.y, R * 1.2, '#FFF4DC', 0.55 * (1 - (k - 0.14) / 0.14)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    K.dustPuffs(ctx, m.x, m.y, R * 1.05, e, m.seed, 7);
    for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + hash(i, m.seed) * 0.8, d = R * (0.3 + 0.9 * e), hh = Math.sin(k01(k * 1.6) * Math.PI) * 16 * hash(m.seed, i + 2), [ux, uy] = upVec();
      inked(ctx, () => blob(ctx, m.x + Math.cos(b) * d + ux * hh, m.y + Math.sin(b) * d + uy * hh, 3.2, 5, i, 1), i % 2 ? '#A99C8B' : '#7A6A58'); }
    ctx.restore();
  },
};
// Maul (Bearskin): the club driven straight down: a crater with a raised rim, cracks running out, brown dust and chunks
SLAM2.maul = (ctx, m, k, layer) => {
  const e = easeOut(k01((k - 0.1) / 0.6)), R = m.r;
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 1 - k * 0.8;
    ctx.fillStyle = 'rgba(52,40,30,0.38)'; ctx.beginPath(); ctx.arc(m.x, m.y, R * 0.55, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(169,156,139,0.55)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(m.x, m.y, R * 0.6, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(43,34,48,0.55)'; ctx.lineWidth = 2.6;
    for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + hash(m.seed, i) * 0.5, L = R * (0.75 + 0.45 * hash(i, m.seed)) * Math.min(1, k * 4); ctx.beginPath(); ctx.moveTo(m.x + Math.cos(b) * R * 0.55, m.y + Math.sin(b) * R * 0.55);
      ctx.lineTo(m.x + Math.cos(b + 0.12) * (R * 0.55 + L * 0.5), m.y + Math.sin(b + 0.12) * (R * 0.55 + L * 0.5)); ctx.lineTo(m.x + Math.cos(b - 0.05) * (R * 0.55 + L), m.y + Math.sin(b - 0.05) * (R * 0.55 + L)); ctx.stroke(); }
    ctx.restore(); return; }
  if (k < 0.1) { const [ux, uy] = upVec(), h = (1 - k / 0.1) * 34; inked(ctx, () => { ctx.beginPath(); ctx.ellipse(m.x + ux * h, m.y + uy * h, 13, 10, 0, 0, TAU); }, '#8A5A30'); return; }
  if (k < 0.26) lit(ctx, () => glowDisc(ctx, m.x, m.y, R * 1.3, '#FFE9C8', 0.6 * (1 - (k - 0.1) / 0.16)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  K.dustPuffs(ctx, m.x, m.y, R * 1.15, e, m.seed, 9, '#C9A47A');
  for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + hash(i, m.seed), d = R * (0.4 + 0.8 * e), hh = Math.sin(k01(k * 1.5) * Math.PI) * 22 * (0.5 + hash(m.seed, i)), [ux, uy] = upVec();
    inked(ctx, () => blob(ctx, m.x + Math.cos(b) * d + ux * hh, m.y + Math.sin(b) * d + uy * hh, 4.5, 5, i, 1), i % 2 ? '#7A6A58' : '#5A4634'); }
  ctx.restore();
};
// Bury (the Digger): the spade's blade driven flat into the floor: a split in the ground and earth thrown out
SLAM2.spade = (ctx, m, k, layer) => {
  const e = easeOut(k01((k - 0.1) / 0.6)), R = m.r;
  if (layer === 'ground') { drawPuddle(ctx, 'earth', m.x, m.y, R * (0.6 + 0.4 * e), 0, 1 - k * 0.7, m.seed); return; }
  if (k < 0.1) { const [ux, uy] = upVec(), h = (1 - k / 0.1) * 30; ctx.save(); ctx.translate(m.x + ux * h, m.y + uy * h); ctx.rotate(m.a || 0); inked(ctx, () => roundRect(ctx, -12, -7, 24, 14, 4), '#A8B0BA'); ctx.restore(); return; }
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, m.x, m.y, R, '#FFF4DC', 0.5 * (1 - (k - 0.1) / 0.15)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + hash(i, m.seed), d = R * (0.3 + 0.8 * e), hh = Math.sin(k01(k * 1.4) * Math.PI) * 26 * (0.4 + hash(m.seed, i)), [ux, uy] = upVec();
    inked(ctx, () => blob(ctx, m.x + Math.cos(b) * d + ux * hh, m.y + Math.sin(b) * d + uy * hh, 4 + 2 * hash(i, 3), 5, i, 1), i % 2 ? '#7A5A3A' : '#9C7650'); }
  ctx.restore();
};
// IMPACT2D[kind](ctx, m, k): where a new kind of shot stops (fxkit impact)
export const IMPACT2D = {
  // a clod of earth bursting: crumbs and a little dust (the Digger's spade)
  clod(ctx, m, k) {
    const e = easeOut(k); ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < 5; i++) { const b = m.a + Math.PI + (hash(m.seed, i) - 0.5) * 2.6, d = 4 + 16 * e; inkDisc(ctx, m.x + Math.cos(b) * d, m.y + Math.sin(b) * d, 2.8 * (1 - 0.5 * k), i % 2 ? '#7A5A3A' : '#9C7650'); }
    K.dustPuffs(ctx, m.x, m.y, 18, e, m.seed, 4, '#C9A47A'); ctx.restore();
  },
  // Warhelm's hammer: yellow sparks thrown off and stone chips (it shocks what it hits)
  warhammer(ctx, m, k) {
    const e = easeOut(k);
    if (k < 0.25) lit(ctx, () => glowDisc(ctx, m.x, m.y, 40, '#FFF7C2', 0.6 * (1 - k / 0.25)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < 5; i++) { const b = m.a + Math.PI + (i - 2) * 0.7 + hash(m.seed, i) * 0.4, d = 8 + 22 * e;
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(m.x + Math.cos(b) * d, m.y + Math.sin(b) * d); ctx.lineTo(m.x + Math.cos(b + 0.3) * (d + 8), m.y + Math.sin(b + 0.3) * (d + 8)); ctx.lineTo(m.x + Math.cos(b) * (d + 15), m.y + Math.sin(b) * (d + 15)); }, '#FFE66B', 2.6); }
    ctx.restore();
  },
  // the Stormhammer: white puffy clouds bursting out where it strikes (round 13: "Should be white puffy clouds when hit")
  hammer(ctx, m, k) {
    const e = easeOut(k), S = m.ab ? 1.3 : 1;
    if (k < 0.25) lit(ctx, () => glowDisc(ctx, m.x, m.y, 34 * S, '#FFFFFF', 0.6 * (1 - k / 0.25)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + hash(m.seed, i), d = (6 + 24 * e) * S, r = (7 + 4 * hash(i, m.seed)) * S * (1 - 0.35 * k);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(m.x + Math.cos(b) * d, m.y + Math.sin(b) * d, r, 0, TAU); ctx.arc(m.x + Math.cos(b) * d + r * 0.7, m.y + Math.sin(b) * d - r * 0.3, r * 0.7, 0, TAU); }, i % 2 ? '#FFFFFF' : '#EEF3F8'); }
    ctx.restore();
  },
};

// ---------------------------------------------------------------- round 13 (lane H2): the shared effects' looks
const alive2 = (u) => u && !u.dead && !u.downed;
// the effect on a unit has ended (its hook or buff is gone): let the look fade out
const ended = (f, gone) => { if (gone && f.max > f.t + 0.25) f.max = f.t + 0.25; };
const hasHook = (u, id) => !!(u && u.h2 && u.h2.some((h) => h.id === id));
// Parry: the greatsword held across him, a cold glint running along its edge while he waits
DRAW.parryGuard = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; ended(f, !(u.kit && u.kit.parry && u.kit.parry.until > w.time && u.kit.parry.n > 0));
  const a = life(f, 0.1, 0.25), b = u.facing + Math.PI / 2, cx = u.x + Math.cos(u.facing) * (u.r + 4), cy = u.y + Math.sin(u.facing) * (u.r + 4), L = u.r + 16;
  const run = ((f.t * 1.6) % 1) * 2 - 1;
  ctx.save(); ctx.globalAlpha *= a;
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - Math.cos(b) * L, cy - Math.sin(b) * L); ctx.lineTo(cx + Math.cos(b) * L, cy + Math.sin(b) * L); }, '#DCE3EC', 5);
  lit(ctx, () => glowDisc(ctx, cx + Math.cos(b) * L * run, cy + Math.sin(b) * L * run, 14, '#FFFFFF', 0.7));
  ctx.restore();
};
// Last Stand: a gold blaze bursting up off him, and gold shards flung out low along the floor
DRAW.lastStand = (ctx, f, w, layer) => {
  const u = f.unit, x = alive2(u) ? u.x : f.x, y = alive2(u) ? u.y : f.y, k = k01(f.t / f.max), e = easeOut(k);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 12; i++) { const b = i / 12 * TAU + 0.3, r0 = 20 + 90 * e; K.streak(ctx, x + Math.cos(b) * r0, y + Math.sin(b) * r0, b, 0, 22 * (1 - k) + 6, 4, i % 2 ? '#F2C14E' : '#FFE7A0', '#FFFBEA'); } ctx.restore(); return; }
  if (k < 0.35) lit(ctx, () => glowDisc(ctx, x, y, 70, '#FFE7A0', 0.75 * (1 - k / 0.35)));
};
// Challenge: the friend she shoves clear: a puff of dust and three chevrons pointing the way they go
DRAW.shoveAway = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 3; i++) { const d = 14 + i * 13 + 30 * e, x = f.x + Math.cos(f.a) * d, y = f.y + Math.sin(f.a) * d;
    ctx.save(); ctx.translate(x, y); ctx.rotate(f.a); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(4, 0); ctx.lineTo(-5, 8); }, '#FFE7A0', 4); ctx.restore(); }
  ctx.restore();
};
// a taunt landing on an enemy: a red "!" popping over its head
DRAW.tauntMark = (ctx, f, w, layer) => {
  const e = f.unit; if (layer !== 'air' || !alive2(e)) return; const k = k01(f.t / f.max), [vx, vy] = upVec(), up = e.vr + 16 + 8 * easeOut(k01(k / 0.3));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  upright(ctx, e.x + vx * up, e.y + vy * up, () => { const s = k < 0.2 ? 1 + 0.5 * Math.sin(k / 0.2 * Math.PI) : 1; ctx.scale(s, s);
    inked(ctx, () => { roundRect(ctx, -3, -14, 6, 15, 3); }, '#E04A3A'); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 6, 3.4, 0, TAU); }, '#E04A3A'); });
  ctx.restore();
};
// Haste: short pale speed lines streaming off the back of a hasted body as it moves
DRAW.haste = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'ground' || !alive2(u)) return; ended(f, !(u.buffs && u.buffs.some((b) => b.id === 'haste')));
  const sp = Math.hypot(u.vx || 0, u.vy || 0), a = life(f, 0.1, 0.3) * clamp(sp / 60, 0.25, 1), m = sp > 8 ? Math.atan2(u.vy, u.vx) : u.facing;
  ctx.save(); ctx.globalAlpha *= a * 0.8;
  for (let i = -1; i <= 1; i++) { const ph = (f.t * 3 + hash(i + 2, u.id)) % 1, nx = -Math.sin(m) * i * 11, ny = Math.cos(m) * i * 11, d = u.r + 4 + ph * 18;
    K.streak(ctx, u.x + nx - Math.cos(m) * d, u.y + ny - Math.sin(m) * d, m + Math.PI, 0, 18 * (1 - ph) + 4, 2.6, '#DDF6FF', '#FFFFFF'); }
  ctx.restore();
};
// Whirled: white wind curls going round its feet, faster and more of them as it builds
DRAW.whirled = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'ground' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; }
  const q = clamp(((u.k2s && u.k2s.whirl) || 0) / 100, 0, 1); ended(f, q <= 0.01);
  const a = life(f, 0.15, 0.25), n = 2 + Math.round(q * 3), R = u.vr * 1.25;
  ctx.save(); ctx.globalAlpha *= a * (0.5 + 0.5 * q);
  for (let i = 0; i < n; i++) { const b0 = f.t * (5 + 6 * q) + i / n * TAU;
    inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(u.x, u.y + u.vr * 0.35, R, R * 0.45, 0, b0, b0 + 1.1); }, i % 2 ? '#EEF3F8' : '#FFFFFF', 3.2); }
  ctx.restore();
};
// Whirled's burst: a white whirlwind spun up round it while it is flung about
DRAW.whirlBurst = (ctx, f, w, layer) => {
  const u = f.unit, x = alive2(u) ? u.x : f.x, y = alive2(u) ? u.y : f.y, k = k01(f.t / f.max), [vx, vy] = upVec();
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= (1 - k) * 0.6; ctx.fillStyle = 'rgba(238,243,248,0.5)'; ctx.beginPath(); ctx.ellipse(x, y, f.r * 1.8, f.r * 0.9, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 5; i++) { const h = i * 11, R = f.r * (0.7 + i * 0.22), b0 = f.t * 16 + i;
    inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(x + vx * h, y + vy * h, R, R * 0.4, 0, b0, b0 + 2.2); }, i % 2 ? '#EEF3F8' : '#FFFFFF', 3.6 - i * 0.4); }
  ctx.restore();
};
// Dirty: brown smears over the body and crumbs of dirt dropping off it
DRAW.dirtyOn = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; } ended(f, !hasHook(u, 'dirty'));
  const a = life(f, 0.15, 0.3), [vx, vy] = upVec();
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 5; i++) { const b = hash(i, u.id) * TAU, d = u.vr * 0.55 * hash(u.id, i + 3); ctx.save(); ctx.globalAlpha *= 0.8; inked(ctx, () => blob(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, 4 + 2 * hash(i, 9), 5, i, 1), i % 2 ? '#7A5A3A' : '#9C7650'); ctx.restore(); }
  for (let i = 0; i < 3; i++) { const ph = (f.t * 1.2 + i / 3) % 1, b = hash(i, 4) * TAU, d = u.vr * 0.7;
    ctx.save(); ctx.globalAlpha *= 1 - ph; disc(ctx, u.x + Math.cos(b) * d - vx * ph * 18, u.y + Math.sin(b) * d - vy * ph * 18, 2.4, '#7A5A3A'); ctx.restore(); }
  ctx.restore();
};
// a crosshair on a unit: Targeted (red) and Tracked (amber, with a falcon's feather tick)
DRAW.crosshair = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; } ended(f, !hasHook(u, f.tracked ? 'tracked' : 'targeted'));
  const a = life(f, 0.15, 0.3), R = u.vr + 8 + 6 * (1 - easeOut(k01(f.t / 0.25))), rot = f.t * 0.8, col = f.col || '#FF5A4A';
  ctx.save(); ctx.globalAlpha *= a;
  inkLine(ctx, () => { ctx.beginPath(); for (let i = 0; i < 4; i++) { const b = rot + i * Math.PI / 2; ctx.moveTo(u.x + Math.cos(b + 0.32) * R, u.y + Math.sin(b + 0.32) * R); ctx.arc(u.x, u.y, R, b + 0.32, b + Math.PI / 2 - 0.32); } }, col, 3);
  for (let i = 0; i < 4; i++) { const b = rot + i * Math.PI / 2 + Math.PI / 4; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.x + Math.cos(b) * (R - 7), u.y + Math.sin(b) * (R - 7)); ctx.lineTo(u.x + Math.cos(b) * (R + 6), u.y + Math.sin(b) * (R + 6)); }, col, 3); }
  ctx.restore();
};
// Spun: a slow wobble of gold chevrons going round its head, slower as it builds
DRAW.spunOn = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; }
  const q = clamp(((u.k2s && u.k2s.spun) || 0) / 100, 0, 1); ended(f, q <= 0.01);
  const [vx, vy] = upVec(), hx = u.x + vx * (u.vr + 12), hy = u.y + vy * (u.vr + 12);
  ctx.save(); ctx.globalAlpha *= life(f, 0.15, 0.25) * (0.5 + 0.5 * q);
  inkLine(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const b = i / 24 * TAU * 1.6 + f.t * (3 - 2 * q), r = 4 + i * 0.7; const x = hx + Math.cos(b) * r, y = hy + Math.sin(b) * r * 0.6; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } }, '#F2C14E', 2.8);
  ctx.restore();
};
// Spun's burst: dust kicked up behind as it marches off the way it faces
DRAW.spunGo = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'ground' || !alive2(u)) return; const a = life(f, 0.05, 0.3);
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = -1; i <= 1; i++) { const ph = (f.t * 4 + i * 0.3) % 1, m = u.facing, nx = -Math.sin(m) * i * 10, ny = Math.cos(m) * i * 10;
    K.streak(ctx, u.x + nx - Math.cos(m) * (u.r + 6 + ph * 14), u.y + ny - Math.sin(m) * (u.r + 6 + ph * 14), m + Math.PI, 0, 22 * (1 - ph) + 6, 3, '#E9DDC2', '#FFFFFF'); }
  ctx.restore();
};
// Weakened: grey chevrons sinking off the body (point down), a dull wash on it (render.js)
DRAW.weakOn = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; } ended(f, !(u.buffs && u.buffs.some((b) => b.id === f.buff)));
  const [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= life(f, 0.15, 0.3);
  for (let i = 0; i < 2; i++) { const ph = (f.t * 0.9 + i * 0.5) % 1, up = u.vr + 14 - ph * 24;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI);
    upright(ctx, u.x + vx * up + (i ? 8 : -8), u.y + vy * up, () => inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(0, 3); ctx.lineTo(7, -4); }, '#9AA2AE', 3.6));
    ctx.restore(); }
  ctx.restore();
};

// a gust of wind bursting out from a point (Swoop's take-off, Wing Guard's blast): short white wind strokes flying
// outward, each curling at its tail (never a ring)
DRAW.gust = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), n = f.a != null ? 5 : 9;
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < n; i++) { const b = f.a != null ? f.a + (i - 2) * 0.32 : i / n * TAU + 0.2 + hash(i, 3) * 0.3, d0 = 8 + f.r * 0.9 * e, L = 16 + 10 * (1 - k);
    const x0 = f.x + Math.cos(b) * d0, y0 = f.y + Math.sin(b) * d0, x1 = f.x + Math.cos(b) * (d0 + L), y1 = f.y + Math.sin(b) * (d0 + L), c = (i % 2 ? 1 : -1) * 7;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x0 - Math.sin(b) * c, y0 + Math.cos(b) * c); ctx.quadraticCurveTo(x0, y0, x1, y1); }, '#FFFFFF', 3.2 * (1 - k) + 1.2); }
  ctx.restore();
};
// Swoop's landing: three arms of wind spiralling out across the floor round him as he spins (under the units)
DRAW.windSwirl = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const k = k01(f.t / f.max), e = easeOut(k);
  ctx.save(); ctx.globalAlpha *= (1 - k) * 0.95;
  for (let i = 0; i < 3; i++) { const b0 = i / 3 * TAU + f.t * 7;
    inkLine(ctx, () => { ctx.beginPath(); for (let j = 0; j <= 14; j++) { const q = j / 14, b = b0 + q * 2.4, R = f.r * (0.15 + 0.85 * q) * (0.4 + 0.6 * e); const x = f.x + Math.cos(b) * R, y = f.y + Math.sin(b) * R; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); } }, i % 2 ? '#EEF3F8' : '#FFFFFF', 5 * (1 - k) + 1.5); }
  lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 0.7, '#EEF3F8', 0.25 * (1 - k)));
  ctx.restore();
};
// a small thunderclap: a flash, yellow sparks and a puff of white cloud (Stormhammer II, Wing Guard III's burst)
DRAW.clap = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.2, '#FFF7C2', 0.7 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + hash(i, f.x | 0), d = f.r * (0.2 + 0.7 * e);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d); ctx.lineTo(f.x + Math.cos(b + 0.25) * (d + 9), f.y + Math.sin(b + 0.25) * (d + 9)); ctx.lineTo(f.x + Math.cos(b) * (d + 16), f.y + Math.sin(b) * (d + 16)); }, '#FFE66B', 2.6);
    if (i % 2) inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(b + 0.5) * d * 0.7, f.y + Math.sin(b + 0.5) * d * 0.7, 7 * (1 - 0.5 * k), 0, TAU); }, '#FFFFFF'); }
  ctx.restore();
};

// Bear Claws: four claw rakes torn across the enemy, alternating sides, each one fast
DRAW.clawRake = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), b = f.a + Math.PI / 2 + f.side * 0.55;
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = -1.5; i <= 1.5; i++) { const g = easeOut(k01((k - (i + 1.5) * 0.04) / 0.35)), L = 34, ox = f.x - Math.cos(f.a) * 6 + Math.cos(f.a) * i * 7 - Math.cos(b) * L / 2, oy = f.y - Math.sin(f.a) * 6 + Math.sin(f.a) * i * 7 - Math.sin(b) * L / 2;
    if (g > 0.05) K.streak(ctx, ox, oy, b, 0, L * g, 3.4, '#FFF8F0', '#FFFFFF'); }
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, 24, '#FFFFFF', 0.5 * (1 - k / 0.2)));
  ctx.restore();
};
// a bite: two rows of fangs snapping shut on it, and drops of blood flung off
DRAW.bite = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), shut = easeOut(k01(k / 0.3)), s = clamp(f.r / 20, 0.8, 1.6), gap = (1 - shut) * 14 * s + 1.5;
  ctx.save(); ctx.globalAlpha *= k01((1 - k) / 0.4);
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(f.x - Math.sin(f.a) * gap * sd, f.y + Math.cos(f.a) * gap * sd); ctx.rotate(f.a + (sd > 0 ? Math.PI : 0));
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-14 * s, -2 * s); ctx.quadraticCurveTo(0, -5 * s, 14 * s, -2 * s); for (let i = 3; i >= 0; i--) { const x0 = -11 * s + i * 7.4 * s; ctx.lineTo(x0 + 3 * s, -1 * s); ctx.lineTo(x0, 6 * s); ctx.lineTo(x0 - 3 * s, -1 * s); } ctx.closePath(); }, '#FFF8F0'); ctx.restore(); }
  if (shut > 0.95) for (let i = 0; i < 5; i++) { const b = f.a + (hash(i, 7) - 0.5) * 2.4, d = 8 + 26 * easeOut(k01((k - 0.3) / 0.7)); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 3 * (1 - k) + 1, '#C8453D'); }
  ctx.restore();
};
// Return Thrust: a glint on the spear's head that grows with each blow he takes, until the thrust lets it go
DRAW.spearCharge = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; }
  const n = (u.kit && u.kit.pent) || 0; ended(f, n <= 0); if (n <= 0) return;
  const d = u.r + (u.def.range || 40) * 0.6, x = u.x + Math.cos(u.facing) * d, y = u.y + Math.sin(u.facing) * d, p = 0.5 + 0.5 * Math.sin(f.t * (6 + n * 2));
  lit(ctx, () => glowDisc(ctx, x, y, 10 + 5 * n + 4 * p, n >= 5 ? '#FFE7A0' : '#FFFFFF', 0.25 + 0.1 * n));
  ctx.save(); ctx.globalAlpha *= 0.6 + 0.4 * p; inked(ctx, () => star(ctx, x, y, 4 + n * 1.6, 4, 0.3, f.t * 2), '#FFFFFF'); ctx.restore();
};
// Return Thrust let go: a long white thrust streak through the whole line, thicker the more was wound up
DRAW.thrustLine = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), tip = f.r * easeOut(k01(k / 0.3)), base = f.r * 0.15 + tip * 0.6 * k01((k - 0.2) / 0.8);
  ctx.save(); ctx.globalAlpha *= 1 - k * k; K.streak(ctx, f.x, f.y, f.a, base, tip, (8 + f.n * 2.5) * (1 - 0.4 * k), '#DCE3EC', '#FFFFFF'); ctx.restore();
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x + Math.cos(f.a) * tip, f.y + Math.sin(f.a) * tip, 30, '#FFFFFF', 0.6 * (1 - k / 0.25)));
};

// Thunder Blow: the helm's crack on the skull: a white flash, a burst of sparks thrown back off the helm, short speed lines
DRAW.headbutt = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 46, '#FFFFFF', 0.8 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  inked(ctx, () => star(ctx, f.x, f.y, (16 + 14 * e) * (1 - 0.4 * k), 7, 0.45, 0.2), '#FFF7C2');
  for (let i = -2; i <= 2; i++) { const b = f.a + i * 0.45; K.streak(ctx, f.x + Math.cos(b) * 10, f.y + Math.sin(b) * 10, b, 0, 14 + 26 * e, 3, '#FFE66B', '#FFFFFF'); }
  ctx.restore();
};
// Storm Born: his warhammer circling him in the air, crackling; it darts out at an enemy and back (f.S: where it is)
DRAW.stormHammer = (ctx, f, w, layer) => {
  const u = f.unit, S = f.S; if (!alive2(u) || !S) { ended(f, true); return; } ended(f, !u.kit || u.kit.storm !== S);
  const a = life(f, 0.15, 0.25), [vx, vy] = upVec(), hh = 18 + 4 * Math.sin(f.t * 5);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= a * 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(S.x, S.y, 12, 6, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }
  const x = S.x + vx * hh, y = S.y + vy * hh, rot = S.dart ? Math.atan2(S.y - u.y, S.x - u.x) + f.t * 18 : S.a + Math.PI / 2;
  ctx.save(); ctx.globalAlpha *= a;
  lit(ctx, () => glowDisc(ctx, x, y, 26, '#FFE66B', 0.35 + 0.15 * Math.sin(f.t * 30)));
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1.5, 1.5);
  inked(ctx, () => roundRect(ctx, -2.4, -2, 4.8, 22, 2), '#7A4A28');
  inked(ctx, () => roundRect(ctx, -12, -13, 24, 13, 3), '#8E98A6'); ctx.fillStyle = '#C9D2DE'; ctx.fillRect(-10, -12, 20, 3.4);
  ctx.restore();
  if (Math.sin(f.t * 23) > 0.6) { ctx.save(); ctx.globalAlpha *= a; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x - 2, y + 3); ctx.lineTo(x + 3, y - 6); ctx.lineTo(x + 11, y + 2); }, '#FFE66B', 2.2); ctx.restore(); }
};
// Skull Splitter: the thrown hammer lying where it fell, its head in the floor, until he lands on it
DRAW.hammerDown = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const a = life(f, 0.02, 0.1);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(f.x, f.y); ctx.rotate(f.a + Math.PI / 2);
  inked(ctx, () => roundRect(ctx, -2.6, -26, 5.2, 24, 2), '#7A4A28'); inked(ctx, () => roundRect(ctx, -13, -4, 26, 14, 3), '#8E98A6');
  ctx.restore();
};

// Bolas: the cord wound round its legs, the two balls swinging
DRAW.bolasOn = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const a = life(f, 0.05, 0.25), y = u.y + u.r * 0.45;
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 2; i++) inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(u.x, y + i * 5 - 2, u.r * 0.75, u.r * 0.28, 0.15, 0, TAU); }, '#C9A070', 2.6);
  for (const sd of [-1, 1]) { const b = Math.sin(f.t * 6 + sd) * 0.5; inkDisc(ctx, u.x + sd * u.r * 0.8 + Math.sin(b) * 6, y + 8 + Math.cos(b) * 4, 5, '#6E5E50'); }
  ctx.restore();
};
// Stick 'Em Up: two little hands raised over its head, shaking
DRAW.handsUp = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { ended(f, true); return; } ended(f, !hasHook(u, 'handsUp'));
  const [vx, vy] = upVec(), up = u.vr + 10 + 4 * easeOut(k01(f.t / 0.2)), sh = Math.sin(f.t * 30) * 1.5;
  ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.2);
  upright(ctx, u.x + vx * up, u.y + vy * up, () => { for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 13 + sh, 0); ctx.rotate(sd * 0.25);
    inked(ctx, () => { roundRect(ctx, -5, -6, 10, 12, 4); }, '#F2D2B0'); for (let i = -1; i <= 1; i++) inked(ctx, () => roundRect(ctx, i * 3.2 - 1.4, -12, 2.8, 7, 1.4), '#F2D2B0'); ctx.restore(); } });
  ctx.restore();
};
// Snatch: the enemy's weapon spun out of its hand, lying on the floor where it landed until it is picked up
DRAW.droppedWeapon = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / 0.35), [vx, vy] = upVec(), h = Math.sin(k * Math.PI) * 36;
  const x = f.x0 + (f.x - f.x0) * k + vx * h, y = f.y0 + (f.y - f.y0) * k + vy * h, rot = k < 1 ? f.t * 20 : f.a + 0.6;
  ctx.save(); ctx.globalAlpha *= life(f, 0.02, 0.2); ctx.translate(x, y); ctx.rotate(rot);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(3.5, 4); ctx.lineTo(-3.5, 4); ctx.closePath(); }, '#C9D2DE');
  inked(ctx, () => roundRect(ctx, -7, 4, 14, 3.4, 1.5), '#8A5A30'); inked(ctx, () => roundRect(ctx, -1.8, 7, 3.6, 7, 1.5), '#6E4A2A');
  ctx.restore();
  if (k >= 1 && Math.sin(f.t * 8) > 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 16, '#FFD45A', 0.35));
};

// Toss: a puff of straw where it's forked up, and where it lands
DRAW.hayPuff = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + hash(i, f.x | 0), d = 10 + 40 * e, h = Math.sin(k * Math.PI) * 18 * hash(i, 5);
    ctx.save(); ctx.translate(f.x + Math.cos(b) * d + vx * h, f.y + Math.sin(b) * d * 0.6 + vy * h); ctx.rotate(b + k * 5); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); }, i % 2 ? '#E8C860' : '#F2DC8A', 2.6); ctx.restore(); }
  if (f.land) K.dustPuffs(ctx, f.x, f.y, 40, e, f.x | 0, 6);
  ctx.restore();
};
// Dirt Fling: inked clods of earth thrown out in a fan, arcing up and down
DRAW.clods = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
  ctx.save(); ctx.globalAlpha *= 1 - k * k * k;
  for (let i = 0; i < 14; i++) { const b = f.a + (hash(i, 7) - 0.5) * f.arc, d = 18 + f.r * e * (0.45 + 0.55 * hash(i, 9)), h = Math.sin(k * Math.PI) * 30 * hash(i, 4);
    inked(ctx, () => blob(ctx, f.x + Math.cos(b) * d + vx * h, f.y + Math.sin(b) * d + vy * h, 4 + 3 * hash(i, 2), 5, i, 1), i % 3 ? '#7A5A3A' : '#9C7650'); }
  K.dustPuffs(ctx, f.x + Math.cos(f.a) * f.r * 0.5 * e, f.y + Math.sin(f.a) * f.r * 0.5 * e, 40, e, 3, 5, '#C9A47A');
  ctx.restore();
};
// Burrow: churned earth left along the way under the floor, one merged body (puddles.js 'earth'), lingering then fading
DRAW.burrowTrail = (ctx, f, w, layer) => {
  if (layer !== 'ground' || !f.unit) return; const u = f.unit;
  if (u.hidden && (!f.pts.length || Math.hypot(u.x - f.pts[f.pts.length - 1].x, u.y - f.pts[f.pts.length - 1].y) > 10)) f.pts.push({ x: u.x, y: u.y, t: f.t });
  f.pts.forEach((p, i) => { const age = f.t - p.t, a = age < 1.6 ? 1 : k01(1 - (age - 1.6) / 1); if (a > 0.02) drawPuddle(ctx, 'earth', p.x, p.y, 15 * (0.4 + 0.6 * a) * (0.85 + 0.3 * hash(i, 5)), w.time, a, i * 7 + 3); });
  if (u.hidden) { const wob = Math.sin(f.t * 40) * 2; ctx.save(); for (let i = 0; i < 4; i++) { const b = f.t * 8 + i * 1.6; inked(ctx, () => blob(ctx, u.x + Math.cos(b) * 10 + wob, u.y + Math.sin(b) * 8, 4, 5, i, 1), '#9C7650'); } ctx.restore(); }
};
// earth bursting up out of the floor (going under, coming up, digging out): clods thrown up and out, dust; no ring
DRAW.erupt = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
  if (layer === 'ground') { drawPuddle(ctx, 'earth', f.x, f.y, f.r * 0.55 * (0.5 + 0.5 * e), w.time, 1 - k, f.x | 0); return; }
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  const n = f.big ? 12 : 7;
  for (let i = 0; i < n; i++) { const b = i / n * TAU + hash(i, f.y | 0), d = f.r * (0.2 + 0.8 * e), h = Math.sin(k01(k * 1.3) * Math.PI) * (f.big ? 40 : 24) * (0.5 + hash(i, 3));
    inked(ctx, () => blob(ctx, f.x + Math.cos(b) * d + vx * h, f.y + Math.sin(b) * d + vy * h, 3.5 + 2.5 * hash(i, 8), 5, i, 1), i % 2 ? '#7A5A3A' : '#9C7650'); }
  K.dustPuffs(ctx, f.x, f.y, f.r, e, f.x | 0, f.big ? 7 : 5, '#C9A47A');
  ctx.restore();
};
// Bury: a mound of earth where it went down, twitching as it tries to dig out
DRAW.buried = (ctx, f, w, layer) => {
  const u = f.unit, x = f.x, y = f.y, a = life(f, 0.05, 0.15), wob = Math.sin(f.t * 30) * 1.5 * k01(f.t / f.max);
  if (layer === 'ground') { drawPuddle(ctx, 'earth', x, y, f.r * 1.1, w.time, a, x | 0); return; }
  ctx.save(); ctx.globalAlpha *= a;
  inked(ctx, () => blob(ctx, x + wob, y, f.r * 0.85, 7, x | 0, 0.75), '#8A6A48');
  for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + 0.5; disc(ctx, x + Math.cos(b) * f.r * 0.4 + wob, y + Math.sin(b) * f.r * 0.3, 3, '#6E5034'); }
  ctx.restore();
};
// the Haymaker's hay bale, seen from above as it rolls: a round bale lying across its way, its straw bands rolling over
LOOK2.haybale = (ctx, u, w) => {
  const a = u.facing || 0, L = u.vr * 1.15, R = u.vr * 0.95, roll = (u.roll || 0) * 0.12, fl = u.flashT > 0.06;
  ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(a);
  inked(ctx, () => roundRect(ctx, -R, -L, R * 2, L * 2, R * 0.55), fl ? '#FFFFFF' : '#E2BE58');
  ctx.save(); ctx.beginPath(); roundRect(ctx, -R, -L, R * 2, L * 2, R * 0.55); ctx.clip();
  for (let i = -3; i <= 3; i++) { const xx = ((i * 11 + roll * 30) % 77 + 77) % 77 - 38; ctx.fillStyle = i % 2 ? '#C9A040' : '#F2DC8A'; ctx.fillRect(xx - 2.5, -L, 5, L * 2); }
  ctx.strokeStyle = '#8A6A2A'; ctx.lineWidth = 2.6; for (const yy of [-L * 0.45, L * 0.45]) { ctx.beginPath(); ctx.moveTo(-R, yy); ctx.lineTo(R, yy); ctx.stroke(); }
  ctx.restore();
  for (let i = 0; i < 5; i++) { const yy = -L + (i + 0.5) * L * 0.4, sd = i % 2 ? 1 : -1; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(sd * R, yy); ctx.lineTo(sd * (R + 6), yy + 3); }, '#E8C860', 2); }
  ctx.restore();
  if (u.st && u.st.burn > 10) { ctx.save(); ctx.globalAlpha = Math.min(1, u.st.burn / 60); for (let i = 0; i < 3; i++) upright(ctx, u.x + (i - 1) * 12, u.y - 6, () => flame(ctx, 0, 0, 8)); ctx.restore(); }
};

// Old Tales: his story book open over his head, its pages turning
DRAW.storyBook = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const [vx, vy] = upVec(), up = u.vr + 22 + 6 * easeOut(k01(f.t / 0.3)), a = life(f, 0.15, 0.3);
  ctx.save(); ctx.globalAlpha *= a;
  upright(ctx, u.x + vx * up, u.y + vy * up, () => {
    inked(ctx, () => roundRect(ctx, -22, -13, 44, 26, 3), '#8A4A2A');
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(-10, -14, -19, -10); ctx.lineTo(-19, 10); ctx.quadraticCurveTo(-10, 7, 0, 10); ctx.closePath(); }, '#FFF8EA');
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(10, -14, 19, -10); ctx.lineTo(19, 10); ctx.quadraticCurveTo(10, 7, 0, 10); ctx.closePath(); }, '#FFF8EA');
    ctx.fillStyle = '#A99C8B'; for (let i = 0; i < 4; i++) { ctx.fillRect(-16, -6 + i * 4, 12, 1.4); ctx.fillRect(4, -6 + i * 4, 12, 1.4); }
    const turn = (f.t * 2.2) % 1, sx = Math.cos(turn * Math.PI); // a page turning over
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(10 * sx, -14, 19 * sx, -10); ctx.lineTo(19 * sx, 10); ctx.quadraticCurveTo(10 * sx, 7, 0, 10); ctx.closePath(); }, '#F2E8D4');
  });
  lit(ctx, () => glowDisc(ctx, u.x + vx * up, u.y + vy * up, 34, '#FFE7A0', 0.3 * a));
  ctx.restore();
};
// Old Tales on a listener: a gold clock over its head, its hand spinning forward, and "-2s" rising off it
DRAW.tellClock = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const [vx, vy] = upVec(), k = k01(f.t / f.max), up = u.vr + 16, a = life(f, 0.15, 0.35);
  ctx.save(); ctx.globalAlpha *= a;
  upright(ctx, u.x + vx * up, u.y + vy * up, () => {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); }, '#F2C14E'); disc(ctx, 0, 0, 8, '#FFF8EA');
    const h = -Math.PI / 2 + easeOut(k01(f.t / 0.8)) * TAU * 1.5; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(h) * 7, Math.sin(h) * 7); }, '#7A4A2A', 2.2);
    ctx.globalAlpha *= k01((k - 0.25) / 0.2) * (1 - k01((k - 0.8) / 0.2));
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = '#2B2230'; const tx = 15, ty = 4 - 8 * k; ctx.strokeText('-' + f.secs + 's', tx, ty); ctx.fillStyle = '#FFE7A0'; ctx.fillText('-' + f.secs + 's', tx, ty);
  });
  ctx.restore();
};
// the Alchemist's hand: the flask she'll throw next, in its brew's colour (round 13: "Bottle in hand should change to
// what she will throw"); hidden while she's a monster
DRAW.handFlask = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u) || (u.kit && u.kit.monster)) return;
  const next = (((u.kit && u.kit.brew3) ?? -1) + 1) % 3, col = ['#FF8A3D', '#9FDDF6', '#C8E63C'][next];
  const a = u.facing - 0.53, d = u.vr * 1.3, x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d; // (over the flask in the art's hand)
  ctx.save(); ctx.translate(x, y); ctx.rotate(u.facing - Math.PI / 2 + 0.5); ctx.scale(1.35, 1.35);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 1.5, 5.2, 0, TAU); ctx.rect(-1.8, -6, 3.6, 4.5); }, '#E8F0EA'); disc(ctx, 0, 2.2, 3.8, col); ctx.fillStyle = '#8A5A3A'; ctx.fillRect(-2.1, -7.4, 4.2, 2.4);
  ctx.restore();
  lit(ctx, () => glowDisc(ctx, x, y, 10, col, 0.35));
};
// Brew Pools: a pool of the brew on the floor (merged with its own kind) and what stands up out of it
DRAW.brewPool = (ctx, f, w, layer) => {
  const a = life(f, 0.2, 0.5), K2 = { acid: 'gas', cold: 'frost', fire: 'fire', whirl: 'mist', shock: 'mist', water: 'water' }[f.kind];
  if (layer === 'ground') { drawPuddle(ctx, K2, f.x, f.y, f.r * (0.55 + 0.45 * easeOut(k01(f.t / 0.25))), w.time, a, Math.round(f.x * 5 + f.y)); return; }
  ctx.save(); ctx.globalAlpha *= a;
  if (f.kind === 'acid') for (let i = 0; i < 6; i++) { const ph = (f.t * 1.4 + hash(i, 5)) % 1, b = hash(i, 1) * TAU, d = f.r * 0.7 * hash(i, 8); ctx.save(); ctx.globalAlpha *= 1 - ph; inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 2 + 5 * ph, '#E6F7B0'); ctx.restore(); }
  else if (f.kind === 'cold') for (let i = 0; i < 5; i++) { const b = hash(i, 3) * TAU, d = f.r * 0.6 * hash(i, 4); ctx.save(); ctx.translate(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d); ctx.rotate(b); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(3, 0); ctx.lineTo(0, 4); ctx.lineTo(-3, 0); ctx.closePath(); }, '#DDF6FF'); ctx.restore(); }
  else if (f.kind === 'whirl') for (let i = 0; i < 3; i++) { const b0 = f.t * 6 + i / 3 * TAU; inkLine(ctx, () => { ctx.beginPath(); for (let j = 0; j <= 10; j++) { const q = j / 10, b = b0 + q * 2, R = f.r * (0.2 + 0.7 * q); const x = f.x + Math.cos(b) * R, y = f.y + Math.sin(b) * R; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); } }, '#FFFFFF', 3); }
  else if (f.kind === 'shock') { for (let i = 0; i < 3; i++) if (Math.sin(f.t * 17 + i * 2.1) > 0.3) { const b = hash(i, (f.t * 6) | 0) * TAU, d = f.r * 0.6; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + Math.cos(b) * d * 0.2, f.y + Math.sin(b) * d * 0.2); ctx.lineTo(f.x + Math.cos(b + 0.4) * d * 0.6, f.y + Math.sin(b + 0.4) * d * 0.6); ctx.lineTo(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d); }, '#FFE66B', 2.6); }
    lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#FFE66B', 0.15)); }
  else if (f.kind === 'water') for (let i = 0; i < 3; i++) { const ph = (f.t * 0.8 + i / 3) % 1; ctx.save(); ctx.globalAlpha *= 1 - ph; inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(f.x + (i - 1) * 14, f.y + (i % 2) * 10, 4 + 14 * ph, (4 + 14 * ph) * 0.5, 0, 0, TAU); }, '#BFE9F8', 2); ctx.restore(); }
  ctx.restore();
};
// Elixir: the potion bursts over the friend in its colour, with the sign of what it gave rising off it
DRAW.elixirSplash = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const u = f.unit, x = alive2(u) ? u.x : f.x, y = alive2(u) ? u.y : f.y, k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
  const col = { rage: '#FF5A3D', mend: '#9BE07A', ward: '#9FE0FF' }[f.kind];
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, x, y, 50, col, 0.6 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + 0.3, d = f.r * (0.4 + 1.1 * e), h = Math.sin(k * Math.PI) * 14; inkDisc(ctx, x + Math.cos(b) * d + vx * h, y + Math.sin(b) * d * 0.7 + vy * h, 4 * (1 - 0.6 * k), i % 2 ? col : '#FFFFFF'); }
  const up = f.r + 10 + 26 * e;
  upright(ctx, x + vx * up, y + vy * up, () => {
    if (f.kind === 'mend') { inked(ctx, () => { ctx.beginPath(); ctx.rect(-3, -9, 6, 18); ctx.rect(-9, -3, 18, 6); }, '#9BE07A'); }
    else if (f.kind === 'ward') { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, -6); ctx.lineTo(7, 4); ctx.lineTo(0, 10); ctx.lineTo(-7, 4); ctx.lineTo(-9, -6); ctx.closePath(); }, '#9FE0FF'); }
    else { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-2, -2); ctx.lineTo(-5, -2); ctx.lineTo(2, -10); ctx.lineTo(0, -3); ctx.lineTo(4, -3); ctx.closePath(); }, '#FF8A3D'); }
  });
  ctx.restore();
};
// Monstrosity: bubbles boiling up off her and green steam, while she's the monster
DRAW.monster = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; } ended(f, !(u.kit && u.kit.monster));
  const [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= life(f, 0.2, 0.3);
  if (f.t < 0.35) lit(ctx, () => glowDisc(ctx, u.x, u.y, 70, '#9BE36B', 0.6 * (1 - f.t / 0.35)));
  for (let i = 0; i < 6; i++) { const ph = (f.t * 1.5 + hash(i, u.id)) % 1, b = hash(i, 3) * TAU, d = u.vr * 0.8 * hash(i, 7), up = ph * 34;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inkDisc(ctx, u.x + Math.cos(b) * d + vx * up, u.y + Math.sin(b) * d * 0.7 + vy * up, 2.5 + 3.5 * ph, i % 2 ? '#B5DE5E' : '#7DB83A'); ctx.restore(); }
  ctx.restore();
};

// ---------------------------------------------------------------- the Shaman (round 13)
const SPIRIT = ['#5FB8E8', '#9FE4FF', '#DDF6FF']; // the ancestors' light blue: dark, main, light
const spiritA = (u) => (u.lifeT != null ? clamp(u.lifeT / 0.6, 0, 1) : 1) * 0.92;
// the winged totem (like the one on his back): a carved pole of stacked faces, teal wings at the top
LOOK2.totem = (ctx, u, w) => {
  const fl = u.flashT > 0.06, rise = easeOut(k01((w.time - (u.bornT ?? (u.bornT = w.time))) / 0.25));
  upright(ctx, u.x, u.y, () => { ctx.scale(1, rise);
    ctx.save(); ctx.globalAlpha *= 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 6, 18, 7, 0, 0, TAU); ctx.fill(); ctx.restore();
    for (const sd of [-1, 1]) inked(ctx, () => { ctx.beginPath(); ctx.moveTo(sd * 8, -34); ctx.quadraticCurveTo(sd * 30, -48, sd * 34, -30); ctx.quadraticCurveTo(sd * 24, -30, sd * 26, -22); ctx.quadraticCurveTo(sd * 16, -26, sd * 8, -22); ctx.closePath(); }, fl ? '#FFFFFF' : '#2FB3A4');
    inked(ctx, () => roundRect(ctx, -10, -40, 20, 46, 4), fl ? '#FFFFFF' : '#A0705A');
    ctx.fillStyle = '#D7713C'; ctx.fillRect(-10, -26, 20, 4); ctx.fillRect(-10, -8, 20, 4);
    ctx.fillStyle = '#F4EEDC'; for (const yy of [-33, -16]) { ctx.fillRect(-6, yy, 4, 3); ctx.fillRect(2, yy, 4, 3); ctx.fillRect(-4, yy + 6, 8, 2.4); }
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -42, 5, 0, TAU); }, '#2FB3A4');
  });
  if (u.hp < u.maxHp * 0.5) { ctx.save(); ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(u.x - 5, u.y - 10); ctx.lineTo(u.x + 2, u.y - 2); ctx.stroke(); ctx.restore(); }
};
// the totem's reach: a faint teal glow on the floor round it with motes drifting in (no ring)
DRAW.totemReach = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u)) { ended(f, true); return; } const a = life(f, 0.3, 0.4);
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, u.x, u.y, f.r, '#7FE0D0', 0.16 * a)); return; }
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 6; i++) { const ph = (f.t * 0.5 + i / 6) % 1, b = i / 6 * TAU + 0.4, d = f.r * (1 - ph); ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); disc(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, 2.6, '#BFF6EC'); ctx.restore(); }
  ctx.restore();
};
// a blow drawn off a friend into the totem: a teal streak from the friend to it
DRAW.totemTake = (ctx, f, w, layer) => {
  if (layer !== 'air' || !alive2(f.from)) return; const k = k01(f.t / f.max), t = f.from, a = Math.atan2(t.y - f.y, t.x - f.x), L = Math.hypot(t.x - f.x, t.y - f.y);
  ctx.save(); ctx.globalAlpha *= 1 - k; K.streak(ctx, f.x, f.y, a, L * k * 0.6, L * Math.min(1, k * 2), 4, '#7FE0D0', '#E8FFF6'); ctx.restore();
};
// Spirit Link (round 13: "Show underneath. Give outline."): inked teal threads between the linked, on the floor
DRAW.links = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const g = (f.group || []).filter(alive2); if (g.length < 2) return; const a = life(f, 0.2, 0.4);
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 1; i < g.length; i++) { const p = g[i - 1], q = g[i], mx = (p.x + q.x) / 2 + Math.sin(f.t * 3 + i) * 10, my = (p.y + q.y) / 2 + Math.cos(f.t * 3 + i) * 10;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(mx, my, q.x, q.y); }, '#7FE0D0', 4.5);
    const ph = (f.t * 0.8 + i * 0.3) % 1; disc(ctx, p.x + (q.x - p.x) * ph, p.y + (q.y - p.y) * ph, 3.2, '#E8FFF6'); }
  ctx.restore();
};
// an ancestor spirit rising out of the floor: a teal-blue column of light and motes
DRAW.spiritRise = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), [vx, vy] = upVec();
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.4, SPIRIT[1], 0.45 * (1 - k))); return; }
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 7; i++) { const ph = (k * 1.4 + hash(i, 3)) % 1, b = hash(i, 7) * TAU; disc(ctx, f.x + Math.cos(b) * f.r * 0.6 + vx * ph * 50, f.y + Math.sin(b) * f.r * 0.4 + vy * ph * 50, 3 * (1 - ph) + 1, SPIRIT[2]); }
  ctx.restore();
};
// the spirit bear, from above: a round light-blue body, shoulders, a snout, round ears; it rocks as it walks
LOOK2.spiritBear = (ctx, u, w) => {
  const fl = u.flashT > 0.06, rock = Math.sin(u.bob || 0) * 0.08 * clamp(u.spd / 40, 0, 1), swing = u.anim ? Math.sin(Math.min(1, u.anim.t / u.anim.dur) * Math.PI) : 0;
  ctx.save(); ctx.globalAlpha *= spiritA(u); ctx.translate(u.x, u.y); ctx.rotate(u.facing + rock);
  lit(ctx, () => glowDisc(ctx, 0, 0, u.vr * 1.7, SPIRIT[1], 0.25));
  for (const sd of [-1, 1]) inked(ctx, () => { ctx.beginPath(); ctx.ellipse(10 + (sd > 0 ? swing * 10 : 0), sd * 17, 8, 6, 0, 0, TAU); }, SPIRIT[0]);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-4, 0, 24, 21, 0, 0, TAU); }, fl ? '#FFFFFF' : SPIRIT[1]);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(14, 0, 13, 12, 0, 0, TAU); }, fl ? '#FFFFFF' : SPIRIT[1]);
  for (const sd of [-1, 1]) inked(ctx, () => { ctx.beginPath(); ctx.arc(10, sd * 10, 4.5, 0, TAU); }, SPIRIT[1]);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(24, 0, 5.5, 5, 0, 0, TAU); }, SPIRIT[2]); disc(ctx, 28, 0, 2, '#2B2230');
  ctx.restore();
};
// the spirit eagle, wings spread, beating, high over the friend it mends
LOOK2.spiritEagle = (ctx, u, w) => {
  const beat = Math.sin(w.time * 11 + u.id) * 0.35, [vx, vy] = upVec(), up = u.hop || 0;
  ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(u.x, u.y, 14, 6, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha *= spiritA(u); ctx.translate(u.x + vx * up, u.y + vy * up); ctx.rotate(u.facing);
  lit(ctx, () => glowDisc(ctx, 0, 0, 34, SPIRIT[1], 0.25));
  for (const sd of [-1, 1]) { ctx.save(); ctx.scale(1, sd); ctx.rotate(-beat);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(4, 2); ctx.quadraticCurveTo(-2, 18, -10, 30); ctx.lineTo(-6, 22); ctx.lineTo(-14, 24); ctx.lineTo(-8, 16); ctx.lineTo(-14, 14); ctx.quadraticCurveTo(-6, 6, -4, 2); ctx.closePath(); }, SPIRIT[1]); ctx.restore(); }
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, 0, 0, TAU); }, SPIRIT[1]);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-22, -6); ctx.lineTo(-20, 0); ctx.lineTo(-22, 6); ctx.closePath(); }, SPIRIT[0]);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(11, 0, 5.5, 0, TAU); }, SPIRIT[2]); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(15, -2); ctx.lineTo(21, 1); ctx.lineTo(15, 2.5); ctx.closePath(); }, '#F2C14E');
  ctx.restore();
};
// the spirit beaver: a round body, a flat paddle tail, two front teeth; it spins when it shoots
LOOK2.spiritBeaver = (ctx, u, w) => {
  const fl = u.flashT > 0.06; let rot = u.facing;
  if (u.spin) { const k = (w.time - u.spin.t0) / u.spin.dur; if (k >= 0 && k < 1) rot += TAU * k; }
  ctx.save(); ctx.globalAlpha *= spiritA(u); ctx.translate(u.x, u.y); ctx.rotate(rot);
  lit(ctx, () => glowDisc(ctx, 0, 0, 30, SPIRIT[1], 0.25));
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-20, 0, 10, 7, 0, 0, TAU); }, SPIRIT[0]);
  ctx.strokeStyle = 'rgba(43,34,48,0.35)'; ctx.lineWidth = 1.4; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-26, i * 3); ctx.lineTo(-14, i * 3); ctx.stroke(); }
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-2, 0, 15, 13, 0, 0, TAU); }, fl ? '#FFFFFF' : SPIRIT[1]);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(12, 0, 8, 0, TAU); }, fl ? '#FFFFFF' : SPIRIT[1]);
  inked(ctx, () => roundRect(ctx, 18, -2.5, 4, 5, 1), '#FFFFFF');
  for (const sd of [-1, 1]) disc(ctx, 13, sd * 4, 1.6, '#2B2230');
  ctx.restore();
};
// the totem in the air (thrown on an arc) and the beaver's homing spirit orb
PROJ2.totemFly = (ctx, p, T) => { lobUp(ctx, p, 60); ctx.rotate(T * 9); inked(ctx, () => roundRect(ctx, -5, -16, 10, 26, 3), '#A0705A'); for (const sd of [-1, 1]) inked(ctx, () => { ctx.beginPath(); ctx.ellipse(sd * 9, -12, 7, 4, sd * 0.4, 0, TAU); }, '#2FB3A4'); };
PROJ2.spiritOrb = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 30, 8, SPIRIT[1]); ctx.restore(); lit(ctx, () => glowDisc(ctx, 0, 0, 18, SPIRIT[1], 0.6)); inkDisc(ctx, 0, 0, 6.5, SPIRIT[2]); };
IMPACT2D.spiritOrb = (ctx, m, k) => { const e = easeOut(k); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + m.seed, d = 4 + 16 * e; inkDisc(ctx, m.x + Math.cos(b) * d, m.y + Math.sin(b) * d, 3 * (1 - k) + 1, SPIRIT[2]); } ctx.restore(); };

// ---------------------------------------------------------------- the Witch (round 13)
// the hex bolt: a green spark wrapped round one of five witch's signs (p.sym): a moon, a star, an eye, a spiral, a skull
PROJ2.hexbolt = (ctx, p, T, ang, sp) => {
  ctx.save(); ctx.rotate(ang); trail(ctx, sp, 34, 7, '#9BE36B'); ctx.restore();
  lit(ctx, () => glowDisc(ctx, 0, 0, 20, '#9BE36B', 0.55));
  upright(ctx, 0, 0, () => { const s = p.sym ?? 1, c = '#C9F59A';
    if (s === 0) inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 8, 0.6, TAU - 0.6); ctx.arc(4, 0, 6, TAU - 0.9, 0.9, true); ctx.closePath(); }, c);
    else if (s === 1) inked(ctx, () => star(ctx, 0, 0, 9, 5, 0.42, T * 4), c);
    else if (s === 2) { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(0, -9, 10, 0); ctx.quadraticCurveTo(0, 9, -10, 0); ctx.closePath(); }, c); disc(ctx, 0, 0, 3.2, '#5A2A80'); }
    else if (s === 3) inkLine(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 20; i++) { const b = i / 20 * TAU * 1.7 + T * 6, r = 1.5 + i * 0.4; const x = Math.cos(b) * r, y = Math.sin(b) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } }, c, 2.6);
    else { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -1.5, 7, Math.PI, 0); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); }, c); disc(ctx, -2.6, -1, 2, '#2B2230'); disc(ctx, 2.6, -1, 2, '#2B2230'); }
  });
};
// a puff of green hex smoke where a unit turns into something else
DRAW.poof = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 2, f.col, 0.6 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.3, d = f.r * (0.3 + 0.9 * e); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, f.r * 0.35 * (1 - 0.5 * k), i % 2 ? f.col : '#E4F5C8'); }
  ctx.restore();
};
// Hex: the frog it has become, seen from above: a squat green body, big round eyes, folded back legs; it hops
DRAW.frog = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u)) { ended(f, true); return; } ended(f, !(u.frogUntil > w.time));
  const hop = u.frogHop != null ? k01((w.time - u.frogHop) / 0.35) : 1, h = Math.sin(hop * Math.PI) * 16, [vx, vy] = upVec(), s = clamp(u.vr / 20, 0.8, 1.6) * (1 + h / 80);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(u.x, u.y, 13 * s, 7 * s, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }
  ctx.save(); ctx.translate(u.x + vx * h, u.y + vy * h); ctx.rotate(u.facing); ctx.scale(s, s);
  const leg = hop < 1 ? 0.6 : 0;
  for (const sd of [-1, 1]) { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-8 - leg * 6, sd * 9, 7 + leg * 4, 4, sd * (0.5 - leg), 0, TAU); }, '#4E9A2A'); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(7, sd * 8, 4, 2.6, sd * 0.4, 0, TAU); }, '#4E9A2A'); }
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 12, 10, 0, 0, TAU); }, u.flashT > 0.06 ? '#FFFFFF' : '#6FB83A');
  ctx.fillStyle = '#A9E07A'; ctx.beginPath(); ctx.ellipse(-2, 0, 6, 5, 0, 0, TAU); ctx.fill();
  for (const sd of [-1, 1]) { inked(ctx, () => { ctx.beginPath(); ctx.arc(8, sd * 5.5, 4, 0, TAU); }, '#E8F5C8'); disc(ctx, 9, sd * 5.5, 2, '#2B2230'); }
  ctx.restore();
};
// the Witch's cauldron on the floor: black iron on three stubby legs, green brew bubbling, a little fire under it
LOOK2.cauldron = (ctx, u, w) => {
  const fl = u.flashT > 0.06;
  ctx.save(); ctx.globalAlpha *= 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(u.x, u.y + 6, 24, 9, 0, 0, TAU); ctx.fill(); ctx.restore();
  for (let i = 0; i < 3; i++) upright(ctx, u.x + (i - 1) * 10, u.y + 10, () => flame(ctx, 0, 0, 5 + Math.sin(w.time * 20 + i) * 1));
  upright(ctx, u.x, u.y, () => {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); }, fl ? '#FFFFFF' : '#3A3440');
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -4, 16, 9, 0, 0, TAU); }, '#7FCB3A');
    for (let i = 0; i < 3; i++) { const ph = (w.time * 1.6 + i / 3) % 1; ctx.save(); ctx.globalAlpha *= 1 - ph; inkDisc(ctx, (i - 1) * 7, -4 - ph * 4, 2 + 3 * ph, '#C9F59A'); ctx.restore(); }
    ctx.fillStyle = '#6A6470'; ctx.fillRect(-20, -6, 40, 3);
  });
};
// Cursed Brew's fumes: purple wisps curling up off the pot and drifting out over its reach
DRAW.fumes = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u)) { ended(f, true); return; } const a = life(f, 0.3, 0.4), [vx, vy] = upVec();
  if (layer === 'ground') { drawPuddle(ctx, 'smoke', u.x, u.y, f.r * 0.8, w.time, a * 0.6, u.id * 3 + 1, true); return; }
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 7; i++) { const ph = (f.t * 0.5 + i / 7) % 1, b = i / 7 * TAU + f.t * 0.3, d = f.r * 0.85 * ph, up = 24 + ph * 26;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI) * 0.8; inkDisc(ctx, u.x + Math.cos(b) * d + vx * up, u.y + Math.sin(b) * d + vy * up, 5 + 6 * ph, i % 2 ? '#9A5CC8' : '#5A2A80'); ctx.restore(); }
  ctx.restore();
};
// Broom Ride (round 13: "Doesnt look like they are ridding it"): the broom drawn under her body at her height, its
// handle out past her front, the bristles behind, so she sits on it; wind lines behind
DRAW.broom = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'ground' || !alive2(u)) return; const a = life(f, 0.1, 0.2), up = u.hop || 0, [vx, vy] = upVec(), sc = 1 + up / 110;
  ctx.save(); ctx.globalAlpha *= 0.25 * a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(u.x, u.y, 26, 10, u.facing, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(u.x, u.y); ctx.rotate(u.facing); ctx.scale(sc * 0.7, sc * 0.7);
  inked(ctx, () => roundRect(ctx, -30, -2.6, 64, 5.2, 2.6), '#8A5A30');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-26, -4); ctx.lineTo(-46, -13); ctx.lineTo(-50, 0); ctx.lineTo(-46, 13); ctx.lineTo(-26, 4); ctx.closePath(); }, '#D8B060');
  ctx.strokeStyle = '#A8843A'; ctx.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-28, i * 1.5); ctx.lineTo(-47, i * 4.4); ctx.stroke(); }
  inked(ctx, () => roundRect(ctx, -29, -5, 5, 10, 2), '#5A2A80');
  for (let i = -1; i <= 1; i++) K.streak(ctx, -52, i * 8, Math.PI, 0, 18 + 6 * Math.sin(f.t * 20 + i), 2.2, '#EEF3F8', '#FFFFFF');
  ctx.restore();
};
// a hex bomb dropped from the broom, and where it pops
PROJ2.hexBomb = (ctx, p, T) => { lobUp(ctx, p, 30); ctx.rotate(T * 10); lit(ctx, () => glowDisc(ctx, 0, 0, 16, '#9BE36B', 0.5)); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); }, '#5A2A80'); inked(ctx, () => star(ctx, 0, 0, 5, 5, 0.42, T * 5), '#9BE36B'); };
DRAW.hexPop = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.3, '#9BE36B', 0.6 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k; inked(ctx, () => star(ctx, f.x, f.y, f.r * (0.3 + 0.6 * e), 7, 0.45, k), '#5A2A80');
  for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + 0.5, d = f.r * (0.3 + 0.8 * e); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 3.5 * (1 - k) + 1, '#9BE36B'); }
  ctx.restore();
};

// ---------------------------------------------------------------- the Warlock and the Cultist (round 13)
// the pact bolt: a magenta eye like the one on his sceptre, a gold lid round it, a flame tail; it looks where it flies
PROJ2.eyeBolt = (ctx, p, T, ang, sp) => {
  const s2 = p.small ? 0.65 : 1; ctx.save(); ctx.rotate(ang); trail(ctx, sp, 34 * s2, 9 * s2, '#E05AB8'); ctx.restore();
  lit(ctx, () => glowDisc(ctx, 0, 0, 22 * s2, '#E05AB8', 0.5)); ctx.rotate(ang); ctx.scale(s2, s2);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.quadraticCurveTo(0, -11, 11, 0); ctx.quadraticCurveTo(0, 11, -11, 0); ctx.closePath(); }, '#F2C14E');
  disc(ctx, 0, 0, 6.5, '#E05AB8'); disc(ctx, 1.5, 0, 2.6, '#2B2230'); disc(ctx, -1.5, -2.5, 1.4, '#FFFFFF');
};
IMPACT2D.eyeBolt = (ctx, m, k) => { const e = easeOut(k); if (k < 0.25) lit(ctx, () => glowDisc(ctx, m.x, m.y, 24, '#E05AB8', 0.6 * (1 - k / 0.25))); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 5; i++) { const b = m.a + Math.PI + (i - 2) * 0.6, d = 4 + 16 * e; upright(ctx, m.x + Math.cos(b) * d, m.y + Math.sin(b) * d, () => flame(ctx, 0, 0, 4.5 * (1 - 0.6 * k), '#E05AB8', '#FFC8E8')); } ctx.restore(); };
// the Cultist's shadow bolt: a violet streak with a dark core
PROJ2.shadowBolt = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 38, 9, '#9A5CC8'); ctx.restore(); lit(ctx, () => glowDisc(ctx, 0, 0, 18, '#9A5CC8', 0.55)); inkDisc(ctx, 0, 0, 6.5, '#5A2A80'); disc(ctx, -1.5, -1.5, 2.2, '#D9C8FF'); };
// Eldritch Beam: a writhing magenta ray, an inked core and a glow, thicker as it heats; an open eye where it starts
DRAW.eldritchRay = (ctx, f, w, layer) => {
  if (layer !== 'air' || !alive2(f.from) || !alive2(f.to)) return; const p = f.from, q = f.to, a = Math.atan2(q.y - p.y, q.x - p.x), L = Math.hypot(q.x - p.x, q.y - p.y), heat = Math.min(1, (f.heat || 0) / 10), wd = 5 + 7 * heat, al = life(f, 0.1, 0.15);
  const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16, wob = Math.sin(k * 14 - f.t * 22) * (4 + 4 * heat) * Math.sin(k * Math.PI); pts.push([p.x + Math.cos(a) * L * k - Math.sin(a) * wob, p.y + Math.sin(a) * L * k + Math.cos(a) * wob]); }
  const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  ctx.save(); ctx.globalAlpha *= al;
  lit(ctx, () => { ctx.globalAlpha *= 0.45; ctx.strokeStyle = '#E05AB8'; ctx.lineWidth = wd * 3; ctx.lineCap = 'round'; path(); ctx.stroke(); });
  inkLine(ctx, path, '#F27ACB', wd); ctx.strokeStyle = '#FFE0F2'; ctx.lineWidth = wd * 0.35; path(); ctx.stroke();
  lit(ctx, () => glowDisc(ctx, q.x, q.y, 20 + 16 * heat, '#E05AB8', 0.6));
  ctx.restore();
};
// a magenta burst: the ray's end, Awaken's exploding blows, Dark Bargain's bursting ones
DRAW.eyeBurst = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.3, '#FFC8E8', 0.8 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k; const n = f.small ? 6 : 10;
  for (let i = 0; i < n; i++) { const b = i / n * TAU + hash(i, f.x | 0), d = f.r * (0.25 + 0.75 * e); upright(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, () => flame(ctx, 0, 0, (f.small ? 4 : 6) * (1 - 0.6 * k), '#E05AB8', '#FFC8E8')); }
  if (!f.small) inked(ctx, () => star(ctx, f.x, f.y, f.r * 0.35 * (1 - k), 8, 0.4, 0.2), '#FFE0F2');
  ctx.restore();
};
// the imp going into him, or out of him: a streak of magenta fire
DRAW.impInto = (ctx, f, w, layer) => { if (layer !== 'air' || !f.from || !f.to) return; const k = k01(f.t / f.max), a = Math.atan2(f.to.y - f.from.y, f.to.x - f.from.x), L = Math.hypot(f.to.x - f.from.x, f.to.y - f.from.y); ctx.save(); ctx.globalAlpha *= 1 - k; K.streak(ctx, f.from.x, f.from.y, a, L * k * 0.7, L * Math.min(1, k * 2), 8, '#E05AB8', '#FFE0F2'); ctx.restore(); };
// Awaken: the demon: a big black-and-red blade held out from his hand (swung with his arm), horns of flame, embers
DRAW.demonForm = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u) || !u.kit || u.kit.demon !== f.D) { ended(f, true); return; } if (layer !== 'air') return;
  const an = u.anim, sw = an && an.kind === 'swing' ? Math.sin(Math.min(1, an.t / an.dur) * Math.PI) : 0, b = u.facing - 0.9 + sw * 1.9, hx = u.x + Math.cos(u.facing + 0.6) * u.r * 0.7, hy = u.y + Math.sin(u.facing + 0.6) * u.r * 0.7;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(b);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(4, -4); ctx.lineTo(54, -7); ctx.lineTo(66, 0); ctx.lineTo(54, 7); ctx.lineTo(4, 4); ctx.closePath(); }, '#3A1A2A');
  ctx.fillStyle = '#E0304A'; ctx.beginPath(); ctx.moveTo(8, -1.5); ctx.lineTo(56, -2.5); ctx.lineTo(62, 0); ctx.lineTo(56, 2.5); ctx.lineTo(8, 1.5); ctx.closePath(); ctx.fill();
  inked(ctx, () => roundRect(ctx, -3, -9, 6, 18, 2), '#8A1E28'); inked(ctx, () => roundRect(ctx, -12, -2.5, 10, 5, 2), '#3A1A2A');
  ctx.restore();
  lit(ctx, () => glowDisc(ctx, u.x, u.y, u.vr * 1.6, '#E0304A', 0.18 + 0.06 * Math.sin(f.t * 8)));
  const [vx, vy] = upVec(); for (let i = 0; i < 4; i++) { const ph = (f.t * 1.2 + i / 4) % 1, a2 = hash(i, u.id) * TAU; ctx.save(); ctx.globalAlpha *= 1 - ph; disc(ctx, u.x + Math.cos(a2) * u.vr * 0.8 + vx * ph * 30, u.y + Math.sin(a2) * u.vr * 0.6 + vy * ph * 30, 2.4, '#FF6A3A'); ctx.restore(); }
};
DRAW.demonBlink = (ctx, f, w, layer) => { if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k); if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 40, '#E0304A', 0.7 * (1 - k / 0.3))); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 7; i++) { const b = i / 7 * TAU, d = 8 + 26 * e; upright(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, () => flame(ctx, 0, 0, 5 * (1 - k), '#B0204A', '#FF8A7A')); } ctx.restore(); };
// blood drawn from one to another (Dark Bargain into the imp; Blood Rite back into the Cultist): red drops along the way
DRAW.bloodTo = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.from || !f.to) return; const k = k01(f.t / f.max), p = f.from, q = f.to;
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 6; i++) { const ph = clamp(k * 1.6 - i * 0.1, 0, 1); if (ph <= 0 || ph >= 1) continue; const x = p.x + (q.x - p.x) * ph, y = p.y + (q.y - p.y) * ph - Math.sin(ph * Math.PI) * 20; inkDisc(ctx, x, y, 4 - i * 0.3, i % 2 ? '#C8453D' : '#8A1E28'); }
  ctx.restore();
};
// Sacrifice: the dagger's killing cut, a red crescent, and blood thrown off
DRAW.sacrifice = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, 50, '#C8453D', 0.7 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k; K.streak(ctx, f.x - Math.cos(f.a + 1.2) * 30, f.y - Math.sin(f.a + 1.2) * 30, f.a + 1.2, 0, 60 * Math.min(1, k * 4), 7 * (1 - k) + 2, '#C8453D', '#FFE0DA');
  for (let i = 0; i < 8; i++) { const b = f.a + (hash(i, 3) - 0.5) * 2.4, d = 8 + 40 * e; inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 3.5 * (1 - 0.6 * k), i % 2 ? '#C8453D' : '#8A1E28'); }
  ctx.restore();
};

// ---------------------------------------------------------------- the Monk and the Seer (round 13)
// a soft round burst of force where a fist lands (Flurry: "Looks too sharp"): puffs fanned out the way the blow goes
DRAW.forcePuff = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.5, '#FFF4DC', 0.6 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 6; i++) { const b = f.a + (i - 2.5) * 0.45, d = f.r * (0.2 + 0.8 * e); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, f.r * 0.28 * (1 - 0.5 * k) + 1, i % 2 ? '#EEF3F8' : '#FFFFFF'); }
  ctx.restore();
};
// Palm Strike: a wall of force rolling out from his open palm, soft white curls across his front
DRAW.palmWave = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 9; i++) { const b = f.a + (i - 4) * 0.36, d = 20 + f.r * e, s2 = 9 * (1 - 0.5 * k) + 3; inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, s2, i % 2 ? '#FFF4DC' : '#FFFFFF'); }
  if (k < 0.25) { const px = f.x + Math.cos(f.a) * 30, py = f.y + Math.sin(f.a) * 30; lit(ctx, () => glowDisc(ctx, px, py, 40, '#FFF4DC', 0.7 * (1 - k / 0.25))); }
  ctx.restore();
};
// the print of the open palm on whatever it struck: a hand of gold light, fading
DRAW.palmPrint = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max);
  ctx.save(); ctx.globalAlpha *= (1 - k) * 0.9; ctx.translate(f.x, f.y); ctx.rotate(f.a - Math.PI / 2); const s2 = 1 + 0.3 * easeOut(k);  ctx.scale(s2, s2);
  inked(ctx, () => { roundRect(ctx, -8, -6, 16, 14, 5); }, '#FFE7A0');
  for (let i = 0; i < 4; i++) inked(ctx, () => roundRect(ctx, -8 + i * 4.2, -15, 3.4, 10, 1.7), '#FFE7A0');
  inked(ctx, () => { ctx.save(); ctx.rotate(-0.8); roundRect(ctx, 6, -3, 3.4, 9, 1.7); ctx.restore(); }, '#FFE7A0');
  ctx.restore();
};
// Foresight (round 13: "Better visual."): a great violet eye opens over the marked one; three beams of pale light pin it
DRAW.seerEye = (ctx, f, w, layer) => {
  const e = f.unit; if (!alive2(e)) { ended(f, true); return; } const [vx, vy] = upVec(), up = e.vr + 30, o = life(f, 0.05, 0.4), open = easeOut(k01(f.t / 0.35)), blink = Math.abs(Math.sin(f.t * 1.1)) > 0.985 ? 0.15 : 1;
  const ex = e.x + vx * up, ey = e.y + vy * up;
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, e.x, e.y, e.vr * 1.6, '#C9B8FF', 0.25 * o)); return; }
  ctx.save(); ctx.globalAlpha *= o;
  lit(ctx, () => { for (let i = -1; i <= 1; i++) { ctx.globalAlpha = 0.3 * o; ctx.strokeStyle = '#E2D8FF'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(e.x + i * e.r * 0.6, e.y); ctx.stroke(); } glowDisc(ctx, ex, ey, 30, '#C9B8FF', 0.5); });
  upright(ctx, ex, ey, () => { const h = 10 * open * blink;
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-19, 0); ctx.quadraticCurveTo(0, -h * 1.6, 19, 0); ctx.quadraticCurveTo(0, h * 1.6, -19, 0); ctx.closePath(); }, '#F4EEFF');
    if (h > 1) { disc(ctx, 0, 0, Math.min(8, h * 0.8), '#7A5AC8'); disc(ctx, 0, 0, Math.min(4, h * 0.4), '#2E2440'); disc(ctx, -2, -2, 1.6, '#FFFFFF'); }
    for (let i = 0; i < 5; i++) { const b = -Math.PI / 2 + (i - 2) * 0.35; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(Math.cos(b) * 14 * open, Math.sin(b) * 12 * open); ctx.lineTo(Math.cos(b) * 21 * open, Math.sin(b) * 18 * open); }, '#9B86C9', 2); } });
  ctx.restore();
};
// Blinding Flash: a white-violet flare bursting off her crystal, crystal shards flung out
DRAW.flash = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.4) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * (0.5 + 0.7 * e), '#FFFFFF', 0.85 * (1 - k / 0.4)));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.2, d = 16 + f.r * 0.8 * e; ctx.save(); ctx.translate(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d); ctx.rotate(b); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, -3.5); ctx.lineTo(-6, 0); ctx.lineTo(0, 3.5); ctx.closePath(); }, i % 2 ? '#E2D8FF' : '#FFFFFF'); ctx.restore(); }
  ctx.restore();
};
// blinded: a bar of light across its eyes and little stars swimming round it
DRAW.blindOn = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const [vx, vy] = upVec(), up = u.vr * 0.35;
  ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.3);
  upright(ctx, u.x + vx * up, u.y + vy * up, () => { lit(ctx, () => { ctx.globalAlpha *= 0.6; ctx.fillStyle = '#FFFFFF'; roundRect(ctx, -u.vr * 0.8, -4, u.vr * 1.6, 8, 4); ctx.fill(); }); });
  for (let i = 0; i < 3; i++) { const b = f.t * 3 + i / 3 * TAU; inked(ctx, () => star(ctx, u.x + vx * (u.vr + 8) + Math.cos(b) * 14, u.y + vy * (u.vr + 8) + Math.sin(b) * 5, 3.5, 4, 0.4, b), '#F4EEFF'); }
  ctx.restore();
};
// Ill Omen: a dark star turning slowly over the enemies, its shadow on the floor
DRAW.omen = (ctx, f, w, layer) => {
  const a = life(f, 0.3, 0.5), [vx, vy] = upVec();
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.3 * a; ctx.fillStyle = '#2E2440'; star(ctx, f.x, f.y, f.r, 7, 0.55, f.t * 0.3); ctx.fill(); ctx.restore(); return; }
  const h = 60 + 4 * Math.sin(f.t * 2);
  ctx.save(); ctx.globalAlpha *= a;
  lit(ctx, () => glowDisc(ctx, f.x + vx * h, f.y + vy * h, 40, '#9B86C9', 0.35));
  inked(ctx, () => star(ctx, f.x + vx * h, f.y + vy * h, 20, 7, 0.45, f.t * 0.6), '#2E2440');
  ctx.fillStyle = '#9B86C9'; star(ctx, f.x + vx * h, f.y + vy * h, 8, 7, 0.45, f.t * 0.6); ctx.fill();
  ctx.restore();
};
// Ill Omen: a blow gone astray onto a friend: a little "!?" popping over the one hit
DRAW.oops = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max), [vx, vy] = upVec(), up = u.vr + 14 + 10 * easeOut(k);
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  upright(ctx, u.x + vx * up, u.y + vy * up, () => { ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3.5; ctx.strokeStyle = '#2B2230'; ctx.strokeText('!?', 0, 5); ctx.fillStyle = '#C9B8FF'; ctx.fillText('!?', 0, 5); });
  ctx.restore();
};

export function drawK2(ctx, f, w, layer) { const d = DRAW[f.draw]; if (d) { ctx.save(); d(ctx, f, w, layer); ctx.restore(); } }

// ---------------------------------------------------------------- signatures at the cast
export const SIG2 = {};
