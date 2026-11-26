// The new heroes' looks (round 10, lane H), in the one effects style (docs/FX-STYLE.md): inked solid things, additive
// light, ground effects soft-edged and under the units. Three hooks into the older code:
//   PROJ2[kind](ctx, p, T, ang, sp)  a shot of a new kind (fx.js drawProjectile; ctx is at the shot, not rotated)
//   DRAW[f.draw](ctx, f, w, layer)   an fx of type 'k2' (fx.js drawGroundFx / drawAirFx; layer 'ground' | 'air')
//   SIG2[abilityId](ctx, f, k, el, w) an ability's own signature at the cast (fxkit.js drawSigAir; return false to skip
//                                     the default cast flash)
// installFx2 (called by fxkit.js) adds each new ability's element and signature time, and how its shots burst.
import { TAU, clamp, OUTLINES, inkFor } from './util.js'; // (round 19, lane looks19: inkFor)
import { inked, inkLine, glowDisc, star, upright, upVec, hash, easeOut, flame, blob, trail, roundRect } from './fx.js';
import { drawPuddle } from './puddles.js';
import { ART2, LOOK2 } from './looks2.js';
import { castShadow } from './height.js';
import { drawHeldWeapon } from './render.js'; // round 19 (lane sys19): a thrown weapon drawn as the one held // round 19 (lane sys19): one shadow system: what flies casts the units' shadow
// round 15 (lane E): a thing that stands (render.js def.upright): world units straight down the screen from it
const downAt = (u, d) => { const [vx, vy] = upVec(); return [u.x - vx * d, u.y - vy * d]; };
const crackAt = (ctx, u, x0, y0, x1, y1) => { ctx.save(); ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(u.x + x0, u.y + y0); ctx.lineTo(u.x + x1, u.y + y1); ctx.stroke(); ctx.restore(); };

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
    ctx.rotate(T * 20 + p.x * 0.01);
    if (drawHeldWeapon(ctx, p.owner, p.big ? 1.25 : 1)) return; // round 19 (lane sys19): the hammer he holds
    ctx.scale(s, s);
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
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 30, (f.cols || ['#FFE7A0'])[0], 0.22 * (1 - k / 0.3))); // (round 19: dimmer, the body stays readable)
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
  // (round 19: parry is fx-melee.js's)
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
  // (round 19: brace is fx-melee.js's, at the spear's real head)
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
  // (round 19: hibernate is fx-melee.js's)
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
  ctx.rotate(T * 18 + p.x * 0.01);
  if (drawHeldWeapon(ctx, p.owner)) return; // round 19 (lane sys19): the hammer he holds
  ctx.scale(1.6, 1.6);
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
Object.assign(EL2, { breadToss: 'song', harvest: 'bone', oldTales: 'nature', acidFlask: 'poison', elixir: 'blood', bangFlask: 'fire',
  healTotem: 'nature', spiritLink: 'water', rainDance: 'water', frogHex: 'nature', cursedBrew: 'necro', broomRide: 'necro',
  eldritchBeam: 'necro', summonImp: 'fire', darkBargain: 'blood' });
Object.assign(ALIAS2, { flask: 'vial', spirit: 'bolt', hexbolt: 'bolt', bread: 'note', cauldron: 'vial' });
// a lobbed thing rises and falls on its way. Round 19 (lane sys19): fx.js drawProjectile lifts every lob by its arc
// once (height.js projZ, each kind's peak kept there) and its shadow is the units' own (render.js drawShadows): this
// drew a second shadow and lifted it a second time. Kept so the shots' drawings can go on calling it; it does nothing.
export function lobUp() {}
// a tube of coloured brew, end over end (round 19, lane caster19: "the potions they use should look like the vials on
// their head. Skinny tubes. Same style but tubular"): pale glass, a cork, the brew filling its round bottom half
function tube(ctx, col, s = 1, cork = true) {
  ctx.save(); ctx.scale(s, s);
  const glass = () => { ctx.beginPath(); ctx.moveTo(-3.6, -9); ctx.lineTo(3.6, -9); ctx.lineTo(3.6, 7); ctx.arc(0, 7, 3.6, 0, Math.PI); ctx.closePath(); };
  inked(ctx, glass, '#EAF4F2');
  ctx.save(); glass(); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(-4, -1, 8, 13); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-4, -1, 8, 1.4); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-2.4, -8, 1.3, 15); ctx.restore();
  if (cork) inked(ctx, () => roundRect(ctx, -3, -13, 6, 4.5, 1.2), '#9A6A3C');
  ctx.restore();
}
PROJ2.flask = (ctx, p, T) => { lobUp(ctx, p); ctx.rotate(T * 12 + p.x * 0.01); tube(ctx, p.color || '#9BCB3C', 1.35); };
// a crusty loaf
// (round 13: "Doesnt look the best overall"): a big golden loaf, lobbed high, scored on top
// (round 19, lane caster19: "Don't like steam": no steam)
function loaf(ctx, T) {
  ctx.rotate(Math.sin(T * 5) * 0.4); ctx.scale(1.4, 1.4);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 12, 7.5, 0, 0, TAU); }, '#D08A40');
  ctx.fillStyle = '#E8AC5C'; ctx.beginPath(); ctx.ellipse(-1, -1.5, 9, 4.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#F8DCA0'; ctx.lineWidth = 2; for (const x of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(x - 2, -4); ctx.lineTo(x + 2, 3); ctx.stroke(); }
}
PROJ2.bread = (ctx, p, T) => { lobUp(ctx, p, 60); loaf(ctx, T); };
// Bread Toss on himself (round 19: "If he eats 1 too he needs to throw it up and down"): his loaf goes up from his hands,
// turning over, and drops back into them
DRAW.breadUp = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max), [vx, vy] = upVec(), h = u.vr * 0.4 + Math.sin(Math.PI * k) * 58;
  const fx0 = u.x + Math.cos(u.facing) * u.vr * 0.7, fy0 = u.y + Math.sin(u.facing) * u.vr * 0.7;
  ctx.save(); ctx.translate(fx0 + vx * h, fy0 + vy * h); ctx.rotate(k * TAU); loaf(ctx, f.t); ctx.restore();
};
// Sheaves (round 19, lane caster19: Grandpa's hay bunches): a sheaf of wheat stood on its end, tied at the waist with
// twine, its ears fanned out at the top; it sways, and settles in with a little bounce when it lands. Thrown, it turns
// over and over on its way.
function sheafShape(ctx, T, seed, s = 1) {
  ctx.save(); ctx.scale(s, s);
  const sway = Math.sin(T * 2.2 + seed) * 0.06;
  ctx.rotate(sway);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-4, -16); ctx.lineTo(-11, -30); ctx.lineTo(11, -30); ctx.lineTo(4, -16); ctx.lineTo(9, 0); ctx.closePath(); }, '#C99A3C');
  ctx.strokeStyle = '#A87A28'; ctx.lineWidth = 1.4; ctx.beginPath(); for (const x of [-5, -1.5, 2, 5.5]) { ctx.moveTo(x * 1.2, -1); ctx.lineTo(x * 0.4, -16); ctx.lineTo(x * 1.5, -29); } ctx.stroke();
  inked(ctx, () => roundRect(ctx, -6, -19, 12, 5, 2), '#8A5A30');
  for (let i = 0; i < 7; i++) { const b = -Math.PI / 2 + (i - 3) * 0.32, x = Math.cos(b) * 12, y = -30 + Math.sin(b) * 10 + 8;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b + Math.PI / 2 + Math.sin(T * 3 + i) * 0.05);
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -5, 3.2, 6.5, 0, 0, TAU); }, i % 2 ? '#E8C860' : '#F2D474');
    ctx.fillStyle = '#B88A2E'; for (const yy of [-8, -5, -2]) { ctx.fillRect(-1.6, yy, 3.2, 1); }
    ctx.restore(); }
  ctx.restore();
}
LOOK2.sheaf = (ctx, u, w) => {
  const k = k01((w.time - (u.bornT ?? w.time)) / 0.3), s = 1 + 0.25 * Math.sin(k * Math.PI) * (1 - k), end = u.lifeT != null ? k01(u.lifeT / 0.4) : 1;
  ctx.save(); ctx.globalAlpha *= end; upright(ctx, u.x, u.y + 8, () => { ctx.scale(1, 0.55 + 0.45 * easeOut(k)); sheafShape(ctx, w.time, u.id, s * 1.15); }); ctx.restore();
};
PROJ2.sheafFly = (ctx, p, T) => { lobUp(ctx, p, 50); ctx.rotate(T * 9); ctx.translate(0, 14); sheafShape(ctx, 0, 0, 0.8); };
// a striker's abilities quickened (a blow on a hayed foe): a gold arrow whirling once round over its head
DRAW.quicken = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max), [vx, vy] = upVec(), up = u.vr + 14, b0 = -Math.PI / 2 + easeOut(k) * TAU * 1.2;
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  upright(ctx, u.x + vx * up, u.y + vy * up, () => {
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 10, b0 - 2.4, b0); }, '#F2C14E', 3);
    ctx.save(); ctx.translate(Math.cos(b0) * 10, Math.sin(b0) * 10); ctx.rotate(b0 + Math.PI / 2); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -4.5); ctx.lineTo(-3, 4.5); ctx.closePath(); }, '#F2C14E'); ctx.restore();
  });
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, u.x + vx * up, u.y + vy * up, 18, '#FFE7A0', 0.5 * (1 - k / 0.3)));
  ctx.restore();
};
// the witch's cauldron flying (round 19, lane caster19: "the thrown projectile doesn't line up"): the very pot that lands,
// seen from above (the same as art/summons/cauldron.svg), as big as it stands, rocking as it flies; its brew slops
function potTop(ctx, s = 1) {
  ctx.save(); ctx.scale(s, s);
  for (let k = 0; k < 3; k++) { const b = Math.PI / 2 + k * TAU / 3; inkDisc(ctx, Math.cos(b) * 19, Math.sin(b) * 19, 4, '#3A3640'); }
  for (const sd of [-1, 1]) inkDisc(ctx, sd * 21, 0, 4.4, '#5E5966');
  inkDisc(ctx, 0, 0, 20, '#3A3640'); disc(ctx, 0, 0, 16.5, '#5E5966'); disc(ctx, 0, 0.3, 13.5, '#7FCB3A'); disc(ctx, -3, -3, 5, '#B6F07A');
  disc(ctx, 4, 3, 2.2, '#EAFFD0'); disc(ctx, -5, 4, 1.6, '#EAFFD0');
  ctx.restore();
}
PROJ2.cauldron = (ctx, p, T) => { lobUp(ctx, p, 70); ctx.rotate(Math.sin(T * 9) * 0.35); potTop(ctx, 1.45); };
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
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(f.x, f.y, f.r * 0.62, 0.8 * a); return; } // (the cloud's shadow, the size of the rain)
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
// a supply bundle: a tied canvas sack
PROJ2.bundle = (ctx, p, T) => { ctx.rotate(T * 6); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); }, '#D8C49A'); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.moveTo(0, -9); ctx.lineTo(0, 9); }, '#8A5A30', 2.4); };
// a flare: a red stick spitting light
PROJ2.flare = (ctx, p, T) => { lit(ctx, () => glowDisc(ctx, 0, 0, 30, '#FF5A3D', 0.7)); ctx.rotate(T * 9); inked(ctx, () => roundRect(ctx, -3, -9, 6, 18, 2), '#C8453D'); };
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
// Rogue Wave: a curl of sea water crashing outward in a cone
DRAW.wave = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), R = 30 + (f.r - 30) * e;
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, R, f.a - f.arc / 2, f.a + f.arc / 2); ctx.arc(f.x, f.y, Math.max(10, R - 26), f.a + f.arc / 2, f.a - f.arc / 2, true); ctx.closePath(); }, '#5DB7E0');
  ctx.strokeStyle = '#F2FBFF'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, R - 4, f.a - f.arc / 2 + 0.05, f.a + f.arc / 2 - 0.05); ctx.stroke();
  for (let i = 0; i < 8; i++) { const b = f.a + (hash(i, 3) - 0.5) * f.arc; disc(ctx, f.x + Math.cos(b) * (R + 6), f.y + Math.sin(b) * (R + 6), 4 * (1 - k), '#BFE9F8'); }
  ctx.restore();
};

// ----- batches 6 and 7
Object.assign(EL2, { runningThrow: 'earth', bound: 'earth', prey: 'blood', aimedShot: 'steel', bayonet: 'steel', ricochet: 'steel',
  shurikenFan: 'shadow', substitution: 'shadow', caltrops: 'steel', pointBlank: 'fire', grog: 'song', broadside: 'fire',
  stunStone: 'earth', ramCharge: 'earth', gravel: 'earth', jawTrap: 'steel', snareNet: 'nature', tripwire: 'steel',
  netThrow: 'nature', showboat: 'holy', shieldRush: 'earth', mock: 'song', befuddle: 'song', juggle: 'song',
  iaido: 'steel', focus: 'holy', crescentCut: 'steel', valkyrieCall: 'holy', spearThrow: 'storm', skyDive: 'holy' });
Object.assign(ALIAS2, { javelin: 'arrow', bullet: 'arrow', shuriken: 'dagger', stone: 'bone', net: 'thorn', ball: 'note', crescent: 'shard', spear: 'arrow', trapThrown: 'bone' });
const stick = (ctx, L, wd, col) => inked(ctx, () => roundRect(ctx, -L, -wd / 2, L * 2, wd, wd / 2), col);
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
// Aimed Shot: a thin red line held on the target while he aims
DRAW.aimLine = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.from || !f.to) return; const k = k01(f.t / f.max);
  ctx.save(); ctx.globalAlpha *= 0.35 + 0.5 * k; ctx.setLineDash([5, 7]); ctx.strokeStyle = '#FF5A3D'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.from.x, f.from.y); ctx.lineTo(f.to.x, f.to.y); ctx.stroke();
  ctx.setLineDash([]); ctx.beginPath(); ctx.arc(f.to.x, f.to.y, f.to.r + 12 - 8 * k, 0, TAU); ctx.stroke(); ctx.restore();
};
// Broadside: a cannonball's growing shadow and the warning ring, the ball dropping in
DRAW.shell = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), [vx, vy] = upVec(), h = (1 - k * k) * 220;
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.2 + 0.4 * k; ctx.fillStyle = '#2B2230'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 16 * k + 4, 11 * k + 3, 0, 0, TAU); ctx.fill();
    ctx.setLineDash([6, 6]); ctx.strokeStyle = '#FF6B5A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke(); ctx.restore(); return; }
  inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + vx * h, f.y + vy * h, 10, 0, TAU); }, '#3A3440');
};
// a net spread over the floor or over a held enemy
DRAW.netOn = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const e = f.unit, x = e ? e.x : f.x, y = e ? e.y : f.y, r = f.r, a = life(f, 0.05, 0.3);
  ctx.save(); ctx.globalAlpha *= 0.85 * a; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  if (OUTLINES) { ctx.strokeStyle = inkFor('#C9A070'); /* (round 19, lane looks19) */ ctx.lineWidth = 3.2; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * 10 - r, y - r); ctx.lineTo(x + i * 10 + r, y + r); ctx.moveTo(x + i * 10 + r, y - r); ctx.lineTo(x + i * 10 - r, y + r); ctx.stroke(); } } // (round 19, lane toggles19)
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
  // a warhammer head brought down on the spot (round 19, lane melee19: the Griffon's and Warhelm's one slam; the designer:
  // "Circular crater, no cracks", and the falling grey head was "What is that?"): the hammer in his hand is what comes
  // down (parts.js style.slamPose, a wind-up and a drive forward); the floor takes a round crater with a pale lip, a
  // white flash, a ring of dust rolling out to the blow's real reach and stone chips kicked up. No cracks, no lone head.
  hammer(ctx, m, k, layer) { crater(ctx, m, k, layer, { R: m.r, dust: '#E9DDC2', chips: ['#D8CCB6', '#B3A690'], hold: 0.9 }); },
};
export { crater };
// A round crater (round 19, lane melee19), shared by the warhammer slam, Skull Splitter's landing and the Maul: o.R the
// blow's reach, o.dust / o.chips its colours, o.hold how long the dent stays (s). The mark's own time is stretched to it.
function crater(ctx, m, k, layer, o) {
  if (!m._held) { m._held = true; m.max = Math.max(m.max, o.hold || 0.8); } // (fxkit gives a slam 0.42 s: the dent stays longer)
  const T = m.t, R = o.R, e = easeOut(k01(T / 0.32)), fade = k01((m.max - T) / 0.35), D = R * (o.dent || 0.42);
  if (layer === 'ground') {
    ctx.save(); ctx.globalAlpha *= fade;
    lit(ctx, () => glowDisc(ctx, m.x, m.y, R * (0.5 + 0.6 * e), '#FFF4DC', 0.22 * k01(1 - T / 0.3))); // light thrown on the floor
    disc(ctx, m.x, m.y, D * 1.18, 'rgba(255,248,230,0.42)');            // the lip, pushed up and catching the light
    disc(ctx, m.x, m.y, D, 'rgba(84,64,46,0.36)');                       // the dent
    disc(ctx, m.x + D * 0.12, m.y + D * 0.14, D * 0.72, 'rgba(40,30,24,0.22)'); // its shadowed far side
    ctx.restore(); return;
  }
  if (T < 0.1) lit(ctx, () => glowDisc(ctx, m.x, m.y, R * 0.7, '#FFFFFF', 0.6 * (1 - T / 0.1))); // (round 19: small, so the body beside it stays readable)
  // a low ring of dust rolling out to the reach: soft cream puffs, no ink (inked, they read as grey bubbles)
  const q = k01(T / 0.5);
  if (q < 1) { ctx.save(); const n = 10, rr = R * (0.4 + 0.65 * easeOut(q));
    for (let i = 0; i < n; i++) { const b = i / n * TAU + hash(m.seed, i) * 0.4, pr = R * (0.13 + 0.05 * hash(i, m.seed)) * (1 - 0.45 * q) + 2, x = m.x + Math.cos(b) * rr, y = m.y + Math.sin(b) * rr;
      ctx.globalAlpha = 0.55 * (1 - q) * (1 - q); disc(ctx, x, y, pr, o.dust); ctx.globalAlpha = 0.6 * (1 - q) * (1 - q); disc(ctx, x - pr * 0.2, y - pr * 0.25, pr * 0.6, '#FFF8E6'); }
    ctx.restore(); }
  // stone chips kicked up and falling back
  const c = k01(T / 0.42);
  if (c < 1) { ctx.save(); ctx.globalAlpha *= 1 - c * c; const [ux, uy] = upVec();
    for (let i = 0; i < 5; i++) { const b = i / 7 * TAU + hash(i, m.seed) * 0.8, d = R * (0.25 + 0.75 * easeOut(c)) * (0.7 + 0.4 * hash(m.seed, i)), hh = Math.sin(c * Math.PI) * 22 * (0.5 + hash(m.seed, i + 3));
      inked(ctx, () => blob(ctx, m.x + Math.cos(b) * d + ux * hh, m.y + Math.sin(b) * d + uy * hh, 3.6 + 1.4 * hash(i, 4), 5, i, 1), o.chips[i % 2]); }
    ctx.restore(); }
}
// (round 19: SLAM2.maul is fx-melee.js's)
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
// (round 19: parryGuard is fx-melee.js's)
// Last Stand: a gold blaze bursting up off him, and gold shards flung out low along the floor
DRAW.lastStand = (ctx, f, w, layer) => {
  const u = f.unit, x = alive2(u) ? u.x : f.x, y = alive2(u) ? u.y : f.y, k = k01(f.t / f.max), e = easeOut(k);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 12; i++) { const b = i / 12 * TAU + 0.3, r0 = 20 + 90 * e; K.streak(ctx, x + Math.cos(b) * r0, y + Math.sin(b) * r0, b, 0, 22 * (1 - k) + 6, 4, i % 2 ? '#F2C14E' : '#FFE7A0', '#FFFBEA'); } ctx.restore(); return; }
  if (k < 0.35) lit(ctx, () => glowDisc(ctx, x, y, 50, '#FFE7A0', 0.3 * (1 - k / 0.35))); // (round 19: dimmer, the body stays readable)
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
// (round 19: haste and whirled are fx-melee.js's)
// Whirled's burst: a white whirlwind spun up round it while it is flung about
DRAW.whirlBurst = (ctx, f, w, layer) => {
  const u = f.unit, x = alive2(u) ? u.x : f.x, y = alive2(u) ? u.y : f.y, k = k01(f.t / f.max), [vx, vy] = upVec();
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= (1 - k) * 0.6; ctx.fillStyle = 'rgba(238,243,248,0.5)'; ctx.beginPath(); ctx.ellipse(x, y, f.r * 1.8, f.r * 0.9, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 5; i++) { const h = i * 11, R = f.r * (0.7 + i * 0.22), b0 = f.t * 16 + i;
    inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(x + vx * h, y + vy * h, R, R * 0.4, 0, b0, b0 + 2.2); }, i % 2 ? '#EEF3F8' : '#FFFFFF', 3.6 - i * 0.4); }
  ctx.restore();
};
// Dirty (round 19, lane caster19: "Don't like the dirtied effect visual"; one look for Dirt Fling, Bury and his trait, on
// friend or foe): no smears on the face. The body takes a brown wash (its 'dirty' buff, render.js), and a little cloud of
// dust hangs about it the way it does round someone who has been rolling in the dirt: soft puffs that swell and drift off
// round its feet, more of them trailing when it moves, and now and then a crumb dropping off.
const DUST = ['#A0805A', '#8C6C48', '#B8996E'];
DRAW.dirtyOn = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u)) { ended(f, true); return; } ended(f, !hasHook(u, 'dirty'));
  if (u.hidden) return; const a = life(f, 0.2, 0.3), [vx, vy] = upVec(), R = u.vr;
  if (layer === 'ground') { // the dust at its feet, under it
    ctx.save(); ctx.globalAlpha *= a * 0.95;
    for (let i = 0; i < 8; i++) { const ph = (f.t * 0.7 + i / 7 + hash(i, u.id) * 0.3) % 1, b = i / 7 * TAU + f.t * 0.6 + hash(u.id, i), d = R * (0.85 + 0.45 * ph);
      ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); disc(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d * 0.75, R * (0.3 + 0.25 * ph), DUST[i % 3]); ctx.restore(); }
    ctx.restore(); return;
  }
  ctx.save(); ctx.globalAlpha *= a;
  // puffs rising off its edge, soft (light: dust is not inked)
  for (let i = 0; i < 5; i++) { const ph = (f.t * 0.9 + i / 5 + hash(u.id, i + 7) * 0.2) % 1, b = hash(i, u.id + 3) * TAU + f.t * 0.4, d = R * (1.0 + 0.3 * ph), up = 4 + ph * 16; // (off its edge: nothing over its face)
    ctx.save(); ctx.globalAlpha *= 0.6 * Math.sin(ph * Math.PI); disc(ctx, u.x + Math.cos(b) * d + vx * up, u.y + Math.sin(b) * d * 0.7 + vy * up, 4 + 7 * ph, DUST[(i + 1) % 3]); ctx.restore(); }
  // moving: puffs kicked up behind
  if ((u.spd || 0) > 25) for (let i = 0; i < 3; i++) { const ph = (f.t * 2.4 + i / 3) % 1, b = (u.mvA ?? u.facing) + Math.PI + (i - 1) * 0.5, d = R * (0.8 + 0.8 * ph);
    ctx.save(); ctx.globalAlpha *= 0.4 * (1 - ph); disc(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, 4 + 6 * ph, DUST[i % 3]); ctx.restore(); }
  // a crumb dropping off now and then (inked: a solid bit)
  for (let j = 0; j < 2; j++) { const c = f.t * 0.9 + hash(u.id, 2) + j * 0.5, ph = c % 1, b = hash(Math.floor(c), u.id + j) * TAU, d = R * 1.0, h = (1 - ph) * 14;
    if (ph < 0.85) { ctx.save(); ctx.globalAlpha *= 1 - ph / 0.85; inked(ctx, () => blob(ctx, u.x + Math.cos(b) * d + vx * h, u.y + Math.sin(b) * d * 0.7 + vy * h, 2.6, 4, b, 1), '#7A5A3A'); ctx.restore(); } }
  ctx.restore();
};
// the dirt knocked off (the Digger's spade on a dirtied foe, or the coat soaking up a blow): dust and crumbs knocked out of
// the far side of it, away from the blow (f.a), in a fan (round 19 check: a ring of crumbs round it read as spots on it)
DRAW.dirtOff = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec(), A = f.a ?? 0;
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 6; i++) { const b = A + (i / 5 - 0.5) * 1.6, d = f.r * (0.9 + 0.9 * e); ctx.save(); ctx.globalAlpha *= 0.5; disc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, f.r * (0.3 + 0.25 * e), DUST[i % 3]); ctx.restore(); }
  for (let i = 0; i < 6; i++) { const b = A + (hash(i, 5) - 0.5) * 1.5, d = f.r * (1.0 + 1.4 * e * (0.6 + 0.4 * hash(i, 2))), h = Math.sin(k * Math.PI) * 16 * hash(i, 9);
    inked(ctx, () => blob(ctx, f.x + Math.cos(b) * d + vx * h, f.y + Math.sin(b) * d + vy * h, 3.2 * (1 - 0.4 * k), 6, i, 1), i % 2 ? '#7A5A3A' : '#9C7650'); }
  ctx.restore();
};
// the spade's clods bursting out of the far side of what it struck: a spurt of dirt and dust fanning out from that spot
DRAW.clodBurst = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 5; i++) { const b = f.a + (i / 4 - 0.5) * 1.1, d = 4 + f.r * e; ctx.save(); ctx.globalAlpha *= 0.55; disc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 4 + 7 * e, DUST[i % 3]); ctx.restore(); }
  for (let i = 0; i < 6; i++) { const b = f.a + (hash(i, 3) - 0.5) * 1.2, d = 6 + f.r * 1.2 * e * (0.5 + 0.5 * hash(i, 7)); inked(ctx, () => blob(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 2.4 * (1 - 0.4 * k), 6, i, 1), i % 2 ? '#7A5A3A' : '#9C7650'); }
  ctx.restore();
};
// the spade's blow landing (round 19: "Don't like the hit effect"): a flat thwack of earth: the flat of the blade leaves a
// squashed puff of dust across the line of the blow, and chips of dirt flicked off to either side; no white star
DRAW.spadeThud = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), q = k01(k / 0.25), u = f.unit;
  const R = (u && alive2(u) ? u.r : f.r) * 0.85, x = (u && alive2(u) ? u.x : f.x) - Math.cos(f.a) * R, y = (u && alive2(u) ? u.y : f.y) - Math.sin(f.a) * R; // (on its near side, where the flat of the spade met it, riding on it)
  ctx.save(); ctx.translate(x, y); ctx.rotate(f.a);
  if (k < 0.3) { ctx.save(); ctx.globalAlpha *= 0.55 * (1 - k / 0.3); ctx.fillStyle = '#A8865E'; ctx.beginPath(); ctx.ellipse(0, 0, 5 + 3 * q, f.r * (0.5 + 0.4 * q), 0, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 4; i++) { const sd = i % 2 ? 1 : -1, lane = (i < 2 ? 0.45 : 0.8) * sd, d = f.r * (0.3 + 1.0 * e);
    ctx.save(); ctx.globalAlpha *= 0.45; disc(ctx, -4 - 10 * e, lane * f.r * (0.8 + 0.5 * e), 4 + 5 * e, DUST[i % 3]); ctx.restore();
    inked(ctx, () => blob(ctx, -2 - 6 * e + (i - 1.5) * 3, sd * d, 2.8 * (1 - 0.4 * k), 6, i, 1), i % 2 ? '#7A5A3A' : '#9C7650'); }
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
// (round 19: windSwirl and clap are fx-melee.js's)
// Bear Claws: four claw rakes torn across the enemy, alternating sides, each one fast
DRAW.clawRake = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), b = f.a + Math.PI / 2 + f.side * 0.55;
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = -1.5; i <= 1.5; i++) { const g = easeOut(k01((k - (i + 1.5) * 0.04) / 0.35)), L = 34, ox = f.x - Math.cos(f.a) * 6 + Math.cos(f.a) * i * 7 - Math.cos(b) * L / 2, oy = f.y - Math.sin(f.a) * 6 + Math.sin(f.a) * i * 7 - Math.sin(b) * L / 2;
    if (g > 0.05) K.streak(ctx, ox, oy, b, 0, L * g, 3.4, '#FFF8F0', '#FFFFFF'); }
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, 24, '#FFFFFF', 0.5 * (1 - k / 0.2)));
  ctx.restore();
};
// (round 19: spearCharge is fx-melee.js's, at the spear's real head)
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
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(S.x, S.y, 11, a, hh); return; }
  const x = S.x + vx * hh, y = S.y + vy * hh, rot = S.dart ? Math.atan2(S.y - u.y, S.x - u.x) + f.t * 18 : S.a + Math.PI / 2;
  ctx.save(); ctx.globalAlpha *= a;
  lit(ctx, () => glowDisc(ctx, x, y, 26, '#FFE66B', 0.35 + 0.15 * Math.sin(f.t * 30)));
  ctx.translate(x, y); ctx.rotate(rot);
  if (!drawHeldWeapon(ctx, u)) { // round 19 (lane sys19): the hammer he holds
    ctx.scale(1.5, 1.5);
    inked(ctx, () => roundRect(ctx, -2.4, -2, 4.8, 22, 2), '#7A4A28');
    inked(ctx, () => roundRect(ctx, -12, -13, 24, 13, 3), '#8E98A6'); ctx.fillStyle = '#C9D2DE'; ctx.fillRect(-10, -12, 20, 3.4);
  }
  ctx.restore();
  if (Math.sin(f.t * 23) > 0.6) { ctx.save(); ctx.globalAlpha *= a; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x - 2, y + 3); ctx.lineTo(x + 3, y - 6); ctx.lineTo(x + 11, y + 2); }, '#FFE66B', 2.2); ctx.restore(); }
};
// Skull Splitter: the thrown hammer lying where it fell, its head in the floor, until he lands on it
DRAW.hammerDown = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const a = life(f, 0.02, 0.1);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(f.x, f.y); ctx.rotate(f.a + Math.PI / 2);
  if (!drawHeldWeapon(ctx, f.unit)) { inked(ctx, () => roundRect(ctx, -2.6, -26, 5.2, 24, 2), '#7A4A28'); inked(ctx, () => roundRect(ctx, -13, -4, 26, 14, 3), '#8E98A6'); } // (round 19: the hammer he holds)
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
// Burrow (round 19, lane caster19: "Trail better. Maybe not transparent. And have it start fading later but much faster so u
// see less 'crumbs' of dirt in a line. Bigger churned clumps in trail"): a solid furrow of turned earth (drawn in passes, so
// it is one body with one outline), big churned clumps along it, the whole of it held while he is under and a good while
// after, then gone together in a quarter of a second (no trail shrinking into dots)
const SOIL = ['#4A3828', '#6E5238', '#8A6A48', '#A8865E'];
DRAW.burrowTrail = (ctx, f, w, layer) => {
  if (layer !== 'ground' || !f.unit) return; const u = f.unit;
  if (u.hidden && (!f.pts.length || Math.hypot(u.x - f.pts[f.pts.length - 1].x, u.y - f.pts[f.pts.length - 1].y) > 7)) f.pts.push({ x: u.x, y: u.y, t: f.t });
  const P = f.pts; if (!P.length) return;
  const a = k01((f.max - f.t) / 0.25), W = 15;
  ctx.save(); ctx.globalAlpha *= a;
  const rOf = (p, i) => W * (0.85 + 0.3 * hash(i, 5)) * Math.min(1, (f.t - p.t) / 0.08 + 0.3);
  const along = (fn) => { ctx.beginPath(); P.forEach((p, i) => fn(p, rOf(p, i), i)); };
  if (OUTLINES) { ctx.fillStyle = inkFor(SOIL[1]); /* (round 19, lane looks19) */ along((p, r) => { ctx.moveTo(p.x + r + 2.4, p.y); ctx.arc(p.x, p.y, r + 2.4, 0, TAU); }); ctx.fill(); }
  ctx.fillStyle = SOIL[1]; along((p, r) => { ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, TAU); }); ctx.fill();
  ctx.fillStyle = SOIL[0]; along((p, r) => { const rr = r * 0.45; ctx.moveTo(p.x + rr, p.y + 2); ctx.arc(p.x, p.y + 2, rr, 0, TAU); }); ctx.fill(); // the furrow's dark middle
  // the churned clumps, both sides of it
  P.forEach((p, i) => { if (i % 2) return; const q = P[Math.min(P.length - 1, i + 1)], dir = Math.atan2(q.y - p.y, q.x - p.x) || 0;
    for (const sd of [-1, 1]) { if (hash(i, sd + 3) < 0.25) continue; const off = W * (0.45 + 0.4 * hash(i, sd + 9)), cx = p.x + Math.cos(dir + sd * Math.PI / 2) * off, cy = p.y + Math.sin(dir + sd * Math.PI / 2) * off, r = 4.5 + 4 * hash(i, sd + 1);
      inked(ctx, () => blob(ctx, cx, cy, r, 5, i + sd, 0.85), SOIL[2]); disc(ctx, cx - r * 0.25, cy - r * 0.3, r * 0.45, SOIL[3]); } });
  ctx.restore();
  // where he is now, under the floor: the earth heaving up over him
  if (u.hidden) { const wob = Math.sin(f.t * 40) * 1.5; for (let i = 0; i < 5; i++) { const b = f.t * 7 + i * 1.26; inked(ctx, () => blob(ctx, u.x + Math.cos(b) * 9 + wob, u.y + Math.sin(b) * 7, 5 + (i % 2) * 2, 5, i, 0.85), i % 2 ? SOIL[2] : SOIL[3]); } }
};
// A mound of turned earth (round 19: "The dirt mound itself doesn't look good. Should also leave a mound behind when he
// emerges"): a pile of loose soil seen from above: lumpy dark base, a lighter heap on it lit from the top, clumps round
// its foot; open: a hole dug in its middle. It heaves up out of the floor, stays, and settles back in at the end.
// Used where the Digger goes under and comes up (Burrow) and where a buried foe digs out (Bury).
function mound(ctx, x, y, R, open, seed, rise = 1, wob = 0) {
  const r = R * (0.55 + 0.45 * rise);
  inked(ctx, () => blob(ctx, x + wob, y + 2, r * 1.12, 7, seed, 0.82), SOIL[1]);
  ctx.fillStyle = SOIL[2]; blob(ctx, x + wob - r * 0.06, y - r * 0.1, r * 0.86, 7, seed + 1, 0.8); ctx.fill();
  ctx.fillStyle = SOIL[3]; blob(ctx, x + wob - r * 0.18, y - r * 0.32, r * 0.48, 6, seed + 2, 0.7); ctx.fill();
  if (open) { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(x + wob, y - r * 0.02, r * 0.42, r * 0.32, 0, 0, TAU); }, SOIL[0]); ctx.fillStyle = '#2E2219'; ctx.beginPath(); ctx.ellipse(x + wob, y + r * 0.04, r * 0.3, r * 0.2, 0, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + hash(seed, i), d = r * (0.95 + 0.2 * hash(i, seed)), cr = r * (0.16 + 0.08 * hash(seed, i + 4));
    inked(ctx, () => blob(ctx, x + wob + Math.cos(b) * d, y + 2 + Math.sin(b) * d * 0.82, cr, 7, i, 0.9), i % 2 ? SOIL[2] : SOIL[1]); }
}
DRAW.mound = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const rise = easeOut(k01(f.t / 0.18)), sink = k01((f.max - f.t) / 0.45);
  ctx.save(); ctx.globalAlpha *= sink; mound(ctx, f.x, f.y, f.r, f.open, (f.x * 7 + f.y) | 0, rise * (0.7 + 0.3 * sink)); ctx.restore();
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
// Bury (round 19: "Doesn't look good"): it is under a mound of earth (the same mound Burrow leaves), shut over it; the
// mound shakes harder and its top cracks as it digs its way out; a burrower's mound goes where it digs
DRAW.buried = (ctx, f, w, layer) => {
  if (layer !== 'ground') return;
  const u = f.unit, x = u && u.buried ? u.x : f.x, y = u && u.buried ? u.y : f.y, k = k01(f.t / f.max), a = life(f, 0.05, 0.12);
  const shake = k > 0.55 ? Math.sin(f.t * 55) * 2.4 * (k - 0.55) / 0.45 : Math.sin(f.t * 30) * 0.6, R = Math.max(22, f.r * 1.05);
  ctx.save(); ctx.globalAlpha *= a; mound(ctx, x, y, R, false, (f.x * 7 + f.y) | 0, easeOut(k01(f.t / 0.15)), shake);
  if (k > 0.6) { const q = (k - 0.6) / 0.4; ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < 3; i++) { const b = i / 3 * TAU + 0.4, L = R * 0.6 * q, cx = x + shake - R * 0.1, cy = y - R * 0.2; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(b) * L * 0.5 + 3, cy + Math.sin(b) * L * 0.5); ctx.lineTo(cx + Math.cos(b + 0.3) * L, cy + Math.sin(b + 0.3) * L); } ctx.stroke(); }
  ctx.restore();
};
// the Haymaker's hay bale (round 15, lane E: art round 12's art/summons/haybale.svg, a rolled bale lying across its way,
// two twine bands). Round 19 ("remove the hairs on it"): the straw lines that ran over it as it rolled are gone; it
// leaves straw on the floor behind it instead (fx-melee.js hayTrail). Its flames are kept.
ART2.haybale = {
  over(ctx, u) { if (u.st && u.st.burn > 10) { ctx.save(); ctx.globalAlpha = Math.min(1, u.st.burn / 60); for (let i = 0; i < 3; i++) upright(ctx, u.x + (i - 1) * 12, u.y - 6, () => flame(ctx, 0, 0, 8)); ctx.restore(); } },
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
// the Alchemist's tube (round 19, lane caster19): the brew in the tube in their fist (art/heroes/alchemist.svg #arm-r-tube),
// painted in the colour of the one they'll throw next (round 13: "Bottle in hand should change to what she will throw"),
// purple while they drink Monstrosity's, on the arm as it is posed, so it moves with the throw
const BREW3 = ['#FF8A3D', '#9FDDF6', '#C8E63C'];
const TUBE_IN = (ctx) => { ctx.beginPath(); ctx.moveTo(-5.2, -6); ctx.lineTo(5.2, -6); ctx.lineTo(5.2, 40); ctx.bezierCurveTo(5.2, 45, 2.6, 47.6, 0, 47.6); ctx.bezierCurveTo(-2.6, 47.6, -5.2, 45, -5.2, 40); ctx.closePath(); };
ART2.alchemist = {
  top(ctx, u, w) {
    const P = u._pose; if (!P || !P['arm-r-tube'] || P['arm-r-tube'].hide || (u.kit && u.kit.monster)) return;
    const p = P['arm-r-tube'], drink = u.kit && u.kit.drinkUntil > w.time, col = drink ? '#9A5CC8' : BREW3[(((u.kit && u.kit.brew3) ?? -1) + 1) % 3];
    ctx.save(); ctx.translate(154 + (p.dx || 0), 108 + (p.dy || 0)); ctx.rotate(p.r || 0); ctx.translate(-154, -108); ctx.translate(148, 141); ctx.rotate(10 * Math.PI / 180);
    TUBE_IN(ctx); ctx.clip();
    const lvl = drink ? 20 + 26 * k01(1 - (u.kit.drinkUntil - w.time) / 0.55) : 20;
    ctx.fillStyle = col; ctx.fillRect(-7, lvl, 14, 52 - lvl); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-7, lvl, 14, 2.4);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 2; i++) { const ph = (w.time * 0.9 + i * 0.5) % 1; ctx.beginPath(); ctx.arc(i ? 2 : -1.5, 46 - ph * (46 - lvl), 1.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-4, -4, 2.2, 42);
    ctx.restore();
  },
};
DRAW.handFlask = () => {}; // (round 19: the tube is part of their picture, ART2.alchemist above; nothing makes this fx now)
// a tube drunk (Monstrosity's purple, or an Elixir they keep for themselves): bubbles fizz up off them as it goes down
DRAW.tubeSip = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max), [vx, vy] = upVec();
  const col = f.kind === 'monster' ? ['#9A5CC8', '#D9B6F2'] : [{ rage: '#FF5A3D', mend: '#9BE07A', ward: '#9FE0FF' }[f.kind] || '#9BE07A', '#FFFFFF'];
  ctx.save();
  for (let i = 0; i < 6; i++) { const ph = (k * 1.6 + i / 6) % 1, b = hash(i, u.id) * TAU, d = u.vr * 0.5, up = u.vr * 0.4 + ph * 30;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI) * (1 - k * 0.5); inkDisc(ctx, u.x + Math.cos(b) * d + vx * up, u.y + Math.sin(b) * d * 0.6 + vy * up, 2 + 2.5 * ph, i % 2 ? col[0] : col[1]); ctx.restore(); }
  ctx.restore();
};
// Brew Pools (round 19, lane caster19, the designer: "Don't like ice puddle, lightning, water. Winds could be improved"): each
// pool is the brew itself spilled out of its tube: a glossy splash of liquid in the brew's colour (soft-edged, no ring: a
// ground effect), with droplets thrown round it, and what each brew does rising out of it: cold breathes a frosty mist and
// snowflakes drift up off it (no ice); shocking fizzes, its bubbles popping in little crackling sparks (no bolts); water
// ripples where drops fall back into it and spits droplets up; whirling turns into a whirlpool, its foam drawn round and in,
// gusts curling up off it. Acid and fire are as they were.
const BREWC = { cold: ['#5FB0DC', '#A9E2F8', '#E8F8FF'], shock: ['#C8A028', '#EFD25C', '#FFF7C2'], water: ['#2F7FB8', '#5DB7E0', '#BFE9F8'], whirl: ['#5FB4A4', '#A8E6D8', '#F0FFFB'] };
function brewSplat(ctx, f, a, C) {
  const r = f.r * (0.55 + 0.45 * easeOut(k01(f.t / 0.25))), sd = Math.round(f.x * 5 + f.y);
  ctx.save(); ctx.globalAlpha *= a;
  ctx.save(); ctx.globalAlpha *= 0.35; ctx.fillStyle = C[0]; blob(ctx, f.x, f.y, r * 1.08, 12, sd, 0.85); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha *= 0.8; ctx.fillStyle = C[0]; blob(ctx, f.x, f.y, r * 0.95, 12, sd + 1, 0.82); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha *= 0.85; ctx.fillStyle = C[1]; blob(ctx, f.x - r * 0.04, f.y - r * 0.05, r * 0.78, 12, sd + 2, 0.8); ctx.fill(); ctx.restore();
  for (let i = 0; i < 6; i++) { const b = hash(sd, i) * TAU, d = r * (1.05 + 0.25 * hash(i, sd)); ctx.save(); ctx.globalAlpha *= 0.8; disc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d * 0.85, 2.5 + 3 * hash(i, 4), C[i % 2]); ctx.restore(); }
  ctx.save(); ctx.globalAlpha *= 0.55; ctx.fillStyle = C[2]; ctx.beginPath(); ctx.ellipse(f.x - r * 0.3, f.y - r * 0.32, r * 0.28, r * 0.1, -0.45, 0, TAU); ctx.fill(); ctx.restore();
  ctx.restore();
}
DRAW.brewPool = (ctx, f, w, layer) => {
  const a = life(f, 0.2, 0.5), C = BREWC[f.kind];
  if (!C) { // acid, fire: as before
    const K2 = { acid: 'gas', fire: 'fire' }[f.kind];
    if (layer === 'ground') { drawPuddle(ctx, K2, f.x, f.y, f.r * (0.55 + 0.45 * easeOut(k01(f.t / 0.25))), w.time, a, Math.round(f.x * 5 + f.y)); return; }
    if (f.kind === 'acid') { ctx.save(); ctx.globalAlpha *= a; for (let i = 0; i < 6; i++) { const ph = (f.t * 1.4 + hash(i, 5)) % 1, b = hash(i, 1) * TAU, d = f.r * 0.7 * hash(i, 8); ctx.save(); ctx.globalAlpha *= 1 - ph; inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 2 + 5 * ph, '#E6F7B0'); ctx.restore(); } ctx.restore(); }
    return;
  }
  const [vx, vy] = upVec(), R = f.r * 0.8, sd = Math.round(f.x * 5 + f.y);
  if (layer === 'ground') {
    brewSplat(ctx, f, a, C);
    ctx.save(); ctx.globalAlpha *= a;
    if (f.kind === 'water') for (let i = 0; i < 4; i++) { const ph = (f.t * 0.9 + i / 4) % 1, b = hash(i, sd) * TAU, d = R * 0.55 * hash(sd, i + 2); ctx.save(); ctx.globalAlpha *= 0.8 * (1 - ph); ctx.strokeStyle = C[2]; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 3 + 15 * ph, (3 + 15 * ph) * 0.6, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (f.kind === 'whirl') { for (let arm = 0; arm < 3; arm++) { ctx.save(); ctx.globalAlpha *= 0.85; ctx.strokeStyle = arm % 2 ? C[0] : '#FFFFFF'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.beginPath();
        for (let j = 0; j <= 14; j++) { const q = j / 14, b = -f.t * 5 + arm / 3 * TAU + q * 3.2, rr = R * (0.15 + 0.85 * q); const x = f.x + Math.cos(b) * rr, y = f.y + Math.sin(b) * rr * 0.85; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); }
      disc(ctx, f.x, f.y, R * 0.14, C[0]); }
    if (f.kind === 'shock') lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * (0.8 + 0.15 * Math.sin(f.t * 23)), '#FFE66B', 0.08));
    if (f.kind === 'cold') lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 0.8, '#DDF6FF', 0.08));
    ctx.restore(); return;
  }
  ctx.save(); ctx.globalAlpha *= a;
  if (f.kind === 'cold') { // frosty breath rising, snowflakes drifting up out of it
    for (let i = 0; i < 4; i++) { const ph = (f.t * 0.45 + i / 4) % 1, b = hash(i, sd) * TAU, d = R * 0.5 * hash(sd, i), up = ph * 34; ctx.save(); ctx.globalAlpha *= 0.4 * Math.sin(ph * Math.PI); disc(ctx, f.x + Math.cos(b) * d + Math.sin(f.t * 2 + i) * 6 + vx * up, f.y + Math.sin(b) * d * 0.7 + vy * up, 8 + 10 * ph, '#EEF9FF'); ctx.restore(); }
    for (let i = 0; i < 5; i++) { const ph = (f.t * 0.55 + i / 5 + hash(i, 3) * 0.2) % 1, b = hash(i, sd + 7) * TAU, d = R * 0.7 * hash(sd, i + 9), up = ph * 40, x = f.x + Math.cos(b) * d + Math.sin(f.t * 3 + i) * 5 + vx * up, y = f.y + Math.sin(b) * d * 0.7 + vy * up;
      ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); ctx.translate(x, y); ctx.rotate(f.t + i); inkLine(ctx, () => { ctx.beginPath(); for (let j = 0; j < 3; j++) { const c = Math.cos(j * Math.PI / 3) * 4, s2 = Math.sin(j * Math.PI / 3) * 4; ctx.moveTo(-c, -s2); ctx.lineTo(c, s2); } }, '#FFFFFF', 1.4); ctx.restore(); }
  } else if (f.kind === 'shock') { // fizzing: bubbles swell and pop in a crackle of tiny sparks
    for (let i = 0; i < 6; i++) { const ph = (f.t * 1.3 + i / 6 + hash(i, sd) * 0.3) % 1, b = hash(i, sd + 2) * TAU, d = R * 0.65 * hash(sd, i + 5), x = f.x + Math.cos(b) * d, y = f.y + Math.sin(b) * d * 0.8;
      if (ph < 0.75) { ctx.save(); ctx.globalAlpha *= 0.9; inkDisc(ctx, x, y, 1.5 + 4 * ph, C[2]); ctx.restore(); }
      else { const q = (ph - 0.75) / 0.25; lit(ctx, () => glowDisc(ctx, x, y, 12, '#FFE66B', 0.7 * (1 - q))); ctx.save(); ctx.globalAlpha *= 1 - q; ctx.strokeStyle = '#FFF7C2'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath();
        for (let j = 0; j < 4; j++) { const c = j / 4 * TAU + i, L0 = 4 + 7 * q; ctx.moveTo(x + Math.cos(c) * L0, y + Math.sin(c) * L0); ctx.lineTo(x + Math.cos(c + 0.4) * (L0 + 3), y + Math.sin(c + 0.4) * (L0 + 3)); ctx.lineTo(x + Math.cos(c) * (L0 + 6), y + Math.sin(c) * (L0 + 6)); } ctx.stroke(); ctx.restore(); } }
  } else if (f.kind === 'water') { // drops spat up that fall back in
    for (let i = 0; i < 4; i++) { const ph = (f.t * 1.1 + i / 4 + hash(i, sd) * 0.3) % 1, b = hash(i, sd + 4) * TAU, d = R * 0.5 * hash(sd, i + 1), h = Math.sin(ph * Math.PI) * 22;
      inkDisc(ctx, f.x + Math.cos(b) * (d + ph * 10) + vx * h, f.y + Math.sin(b) * (d + ph * 10) * 0.8 + vy * h, 2.8, i % 2 ? C[1] : C[2]); }
  } else if (f.kind === 'whirl') { // gusts curling up off the whirlpool, turning with it
    for (let i = 0; i < 3; i++) { const ph = (f.t * 0.8 + i / 3) % 1, b0 = -f.t * 4 + i / 3 * TAU, up = 6 + ph * 24, RR = R * (0.55 - 0.3 * ph);
      ctx.save(); ctx.globalAlpha *= 0.8 * Math.sin(ph * Math.PI); inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(f.x + vx * up, f.y + vy * up, RR, RR * 0.35, 0, b0, b0 + 1.8); }, '#FFFFFF', 2.2); ctx.restore(); }
  }
  ctx.restore();
};
// Elixir (round 19, lane caster19: "Splash could look better"): the tube breaks over the friend: a flash, shards of glass
// glinting off, the brew bursting out over them in a ring of heavy drops that fall back down onto it, a soft glow of the
// brew's colour sinking into the body, and the sign of what it gave rising off it
DRAW.elixirSplash = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const u = f.unit, x = alive2(u) ? u.x : f.x, y = alive2(u) ? u.y : f.y, k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
  const col = { rage: '#FF5A3D', mend: '#9BE07A', ward: '#9FE0FF' }[f.kind], light = { rage: '#FFB09A', mend: '#D6F5BE', ward: '#E2F8FF' }[f.kind];
  if (k < 0.12) lit(ctx, () => glowDisc(ctx, x, y, 60, '#FFFFFF', 0.8 * (1 - k / 0.12)));
  lit(ctx, () => glowDisc(ctx, x, y, f.r * 1.6, col, 0.45 * Math.sin(Math.min(1, k * 1.4) * Math.PI)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + 0.8, d = 8 + 30 * e, h = Math.sin(k01(k * 2) * Math.PI) * 14; if (k > 0.5) break;
    ctx.save(); ctx.translate(x + Math.cos(b) * d + vx * h, y + Math.sin(b) * d + vy * h); ctx.rotate(b + k * 8); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(4, 0); ctx.lineTo(-2, 3); ctx.closePath(); }, '#F4FAFA'); ctx.restore(); }
  for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.3, q = k01(k / 0.7), d = f.r * (0.3 + 1.0 * easeOut(q)), h = Math.sin(q * Math.PI) * (18 + 10 * hash(i, 2));
    inkDisc(ctx, x + Math.cos(b) * d + vx * h, y + Math.sin(b) * d * 0.75 + vy * h, (4.5 + 2 * hash(i, 5)) * (1 - 0.55 * k), i % 3 ? col : light); }
  const up = f.r + 10 + 26 * e;
  upright(ctx, x + vx * up, y + vy * up, () => {
    if (f.kind === 'mend') { inked(ctx, () => { ctx.beginPath(); ctx.rect(-3, -9, 6, 18); ctx.rect(-9, -3, 18, 6); }, '#9BE07A'); }
    else if (f.kind === 'ward') { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, -6); ctx.lineTo(7, 4); ctx.lineTo(0, 10); ctx.lineTo(-7, 4); ctx.lineTo(-9, -6); ctx.closePath(); }, '#9FE0FF'); }
    else { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-2, -2); ctx.lineTo(-5, -2); ctx.lineTo(2, -10); ctx.lineTo(0, -3); ctx.lineTo(4, -3); ctx.closePath(); }, '#FF8A3D'); }
  });
  ctx.restore();
};
// Monstrosity: steam and bubbles boiling up off them while they're the monster
DRAW.monster = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; } ended(f, !(u.kit && u.kit.monster));
  const [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= life(f, 0.2, 0.3);
  if (f.t < 0.35) lit(ctx, () => glowDisc(ctx, u.x, u.y, 70, '#C9A0F0', 0.6 * (1 - f.t / 0.35))); // (round 19: purple, the brew they drank)
  // (round 19: fewer and softer, off its edge, not spots over its face: purple steam rising, the odd bubble)
  for (let i = 0; i < 4; i++) { const ph = (f.t * 1.2 + i / 4 + hash(i, u.id) * 0.2) % 1, b = hash(i, 3) * TAU, d = u.vr * (0.9 + 0.2 * ph), up = 6 + ph * 30;
    ctx.save(); ctx.globalAlpha *= 0.45 * Math.sin(ph * Math.PI); disc(ctx, u.x + Math.cos(b) * d + vx * up, u.y + Math.sin(b) * d * 0.7 + vy * up, 4 + 6 * ph, i % 2 ? '#D9B6F2' : '#B48AE8'); ctx.restore(); }
  { const ph = (f.t * 0.9 + hash(u.id, 5)) % 1, b = hash(Math.floor(f.t * 0.9 + hash(u.id, 5)), u.id) * TAU, d = u.vr * 0.95; ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inkDisc(ctx, u.x + Math.cos(b) * d + vx * ph * 26, u.y + Math.sin(b) * d * 0.7 + vy * ph * 26, 2 + 2.5 * ph, '#D9B6F2'); ctx.restore(); }
  ctx.restore();
};

// ---------------------------------------------------------------- the Shaman (round 13)
const SPIRIT = ['#5FB8E8', '#9FE4FF', '#DDF6FF']; // the ancestors' light blue: dark, main, light
const spiritA = (u) => (u.lifeT != null ? clamp(u.lifeT / 0.6, 0, 1) : 1) * 0.92;
// the winged totem (round 15, lane E: art round 12's art/summons/totem.svg, a carved spirit pole that stands, foot down
// the screen; the code drawing's rise out of the floor and its crack under half health are kept)
ART2.totem = {
  // (round 19, lane caster19: "Should only have collisions on the base of the totem": the unit is its foot now (r 13), and the
  // picture stands up the screen from it)
  frame(ctx, u, w) { const rise = easeOut(k01((w.time - (u.bornT ?? w.time)) / 0.25)), foot = 33; ctx.scale(1, rise); ctx.translate(0, -foot); },
  over(ctx, u) { if (u.hp < u.maxHp * 0.5) crackAt(ctx, u, -5, -43, 2, -35); },
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
// the totem landing (round 19: "Should burst where it lands"): a white-teal flash, the ground knocked out round its
// foot (a dust ring and clods), and teal feathers of light flung out to the edge of its reach and fading
DRAW.totemLand = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= (1 - k) * 0.5; lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * (0.4 + 0.7 * e), '#7FE0D0', 0.7)); ctx.restore(); K.dustPuffs(ctx, f.x, f.y, 34, e, f.x | 0, 7, '#C9A47A'); return; }
  if (k < 0.18) lit(ctx, () => glowDisc(ctx, f.x, f.y, 60, '#E8FFF6', 0.8 * (1 - k / 0.18)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.2, d = 16 + (f.r - 16) * e, x = f.x + Math.cos(b) * d, y = f.y + Math.sin(b) * d * 0.8;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(9, 0); ctx.quadraticCurveTo(0, -5, -9, 0); ctx.quadraticCurveTo(0, 5, 9, 0); ctx.closePath(); }, i % 2 ? '#7FE0D0' : '#E8FFF6'); ctx.restore(); }
  ctx.restore();
};
// a blow taken off a friend (round 19: "a light orb should home from hero to totem to be absorbed"): a ball of teal light
// leaves the friend, swings out to one side and curls into the totem's carved head, where it sinks in with a flash
DRAW.totemOrb = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const to = f.to; if (!alive2(to)) return; const k = k01(f.t / (f.max - 0.12)), [vx, vy] = upVec();
  const tx = to.x + vx * 46, ty = to.y + vy * 46, x0 = f.x, y0 = f.y, mx = (x0 + tx) / 2 - (ty - y0) * 0.45 * f.side, my = (y0 + ty) / 2 + (tx - x0) * 0.45 * f.side, q = easeOut(k) * 0.4 + k * k * 0.6;
  const px = (1 - q) * (1 - q) * x0 + 2 * (1 - q) * q * mx + q * q * tx, py = (1 - q) * (1 - q) * y0 + 2 * (1 - q) * q * my + q * q * ty;
  if (k < 1) {
    for (let i = 1; i <= 4; i++) { const qq = Math.max(0, q - i * 0.05), tx2 = (1 - qq) * (1 - qq) * x0 + 2 * (1 - qq) * qq * mx + qq * qq * tx, ty2 = (1 - qq) * (1 - qq) * y0 + 2 * (1 - qq) * qq * my + qq * qq * ty;
      ctx.save(); ctx.globalAlpha *= 0.5 * (1 - i / 5); disc(ctx, tx2, ty2, 5 - i * 0.8, '#BFF6EC'); ctx.restore(); }
    lit(ctx, () => glowDisc(ctx, px, py, 18, '#7FE0D0', 0.75)); inkDisc(ctx, px, py, 5.5, '#E8FFF6');
  } else { const a = 1 - k01((f.t - (f.max - 0.12)) / 0.12); lit(ctx, () => glowDisc(ctx, tx, ty, 26, '#E8FFF6', 0.8 * a)); }
};
// Spirit Link (round 13: "Show underneath. Give outline."): inked teal threads between the linked, on the floor
// (round 19, lane caster19: "Not showy enough"): the threads reach out from the Shaman to each one as it is cast, light
// runs along them in both directions all the while, every one linked has a ring of teal motes going round its feet,
// and a blow shared out is seen: a bright pulse runs from the one struck along every thread to the others
DRAW.links = (ctx, f, w, layer) => {
  const g = (f.group || []).filter(alive2); if (g.length < 2) return; const a = life(f, 0.2, 0.4), grow = easeOut(k01(f.t / 0.35));
  const hub = f.from && alive2(f.from) ? f.from : g[0];
  const pairs = g.filter((o) => o !== hub).map((q, i) => [hub, q, i]);
  const ctl = (p, q, i) => { const mx = (p.x + q.x) / 2 + Math.sin(f.t * 3 + i) * 12, my = (p.y + q.y) / 2 + Math.cos(f.t * 3 + i) * 12; return [mx, my]; };
  const at = (p, q, i, t) => { const [mx, my] = ctl(p, q, i); return [(1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * mx + t * t * q.x, (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * my + t * t * q.y]; };
  if (layer === 'ground') {
    ctx.save(); ctx.globalAlpha *= a;
    for (const [p, q, i] of pairs) { // the thread, drawn out to its end as it grows
      const n = 16, pts = []; for (let j = 0; j <= n; j++) pts.push(at(p, q, i, j / n * grow));
      lit(ctx, () => { ctx.strokeStyle = 'rgba(127,224,208,0.35)'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); });
      inkLine(ctx, () => { ctx.beginPath(); pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); }, '#7FE0D0', 4.5);
      ctx.strokeStyle = '#E8FFF6'; ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      if (grow >= 1) for (let m = 0; m < 3; m++) { const ph = (f.t * 0.7 + m / 3 + i * 0.17) % 1, t = m % 2 ? ph : 1 - ph, [x, y] = at(p, q, i, t); lit(ctx, () => glowDisc(ctx, x, y, 9, '#7FE0D0', 0.7)); disc(ctx, x, y, 2.8, '#BFF6EC'); }
    }
    for (const o of g) for (let m = 0; m < 6; m++) { const b = f.t * 2 + m / 6 * TAU + o.id, R = o.vr * 1.05; ctx.save(); ctx.globalAlpha *= 0.9 * grow; inkDisc(ctx, o.x + Math.cos(b) * R, o.y + Math.sin(b) * R * 0.7, 3, m % 2 ? '#2FB3A4' : '#5FD0C0'); ctx.restore(); } // (round 19 check: teal, not white)
    ctx.restore(); return;
  }
  // a shared blow: a bright pulse out from the one struck, through the hub, to everyone else on the link
  for (const pu of f.pulses || []) { const age = (w.time - pu.t) / 0.45; if (age >= 1 || !alive2(pu.from)) continue;
    for (const [p, q, i] of pairs) { const fromHub = pu.from === hub, onThis = pu.from === q;
      if (!fromHub && !onThis) { if (age < 0.5) continue; } // (the others get it from the hub, a beat later)
      const t = onThis ? 1 - k01(age / 0.5) : fromHub ? k01(age / 0.5) : k01((age - 0.5) / 0.5), [x, y] = at(p, q, i, t);
      lit(ctx, () => glowDisc(ctx, x, y, 20, '#7FE0D0', 0.85)); inkDisc(ctx, x, y, 5, '#5FD0C0'); }
    lit(ctx, () => glowDisc(ctx, pu.from.x, pu.from.y, pu.from.vr * 1.4, '#7FE0D0', 0.5 * (1 - age))); }
};
// Spirit Link binding one on: a spirit thread's end snaps onto it: a teal flash and motes drawn in round it
DRAW.linkBind = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max);
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, u.x, u.y, u.vr * 1.8, '#7FE0D0', 0.7 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + k * 2, d = u.vr * (1.8 - 0.9 * easeOut(k)); inkDisc(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d * 0.8, 3 * (1 - 0.5 * k), i % 2 ? '#7FE0D0' : '#E8FFF6'); }
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
// The three spirits (round 15, lane E: art round 12's art/summons/spirit-bear, -eagle, -beaver.svg). Kept from their code
// drawings: drawn see-through (spiritA, fading out at the end of their life), a light-blue glow under each, the bear's
// rocking walk, the eagle lifted by u.hop (the rig does that) with its wings beating (the picture drawn narrower and
// wider across), the beaver's full turn when it shoots (u.spin: the rig does that). The bear's paw swing has no paw of
// its own in the picture: the rig's lunge on each blow takes its place.
const spiritGlow = (ctx, u, r) => { ctx.save(); ctx.globalAlpha *= spiritA(u); lit(ctx, () => glowDisc(ctx, 0, 0, r, SPIRIT[1], 0.25)); ctx.restore(); };
ART2.spiritBear = {
  frame(ctx, u) { spiritGlow(ctx, u, u.vr * 1.7); ctx.rotate(Math.sin(u.bob || 0) * 0.08 * clamp(u.spd / 40, 0, 1)); },
  alpha: (u) => spiritA(u),
};
// round 19 (lane caster19, "In game the wolf looks different from the rest"): the wolf is drawn like the others now
// (art/summons/spirit-wolf.svg, made with tools/caster19/animals.py), see-through, glowing, trotting with a sway
ART2.spiritWolf = {
  frame(ctx, u) { spiritGlow(ctx, u, u.vr * 1.6); ctx.rotate(Math.sin((u.bob || 0) * 1.4) * 0.07 * clamp(u.spd / 40, 0, 1)); },
  alpha: (u) => spiritA(u),
};
ART2.spiritEagle = {
  frame(ctx, u, w) { spiritGlow(ctx, u, 34); ctx.scale(1 - 0.16 * (0.5 + 0.5 * Math.sin(w.time * 11 + u.id)), 1); },
  alpha: (u) => spiritA(u),
};
ART2.spiritBeaver = {
  frame(ctx, u) { spiritGlow(ctx, u, 30); },
  alpha: (u) => spiritA(u),
};
// the totem in the air (thrown on an arc) and the beaver's homing spirit orb
PROJ2.totemFly = (ctx, p, T) => { // (round 19: its wings and beak as on the totem: the back totem's swept teal wings, a cream beak)
  lobUp(ctx, p, 60); ctx.rotate(Math.sin(T * 7) * 0.5);
  for (const sd of [-1, 1]) inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -10); ctx.bezierCurveTo(sd * 8, -18, sd * 18, -20, sd * 26, -18); ctx.bezierCurveTo(sd * 22, -14, sd * 22, -10, sd * 20, -8); ctx.bezierCurveTo(sd * 14, -8, sd * 10, -6, 0, -2); ctx.closePath(); }, '#2FB3A4');
  for (const sd of [-1, 1]) { ctx.fillStyle = '#F4EEDC'; ctx.beginPath(); ctx.moveTo(sd * 26, -18); ctx.bezierCurveTo(sd * 22, -14, sd * 22, -10, sd * 20, -8); ctx.lineTo(sd * 18, -16); ctx.closePath(); ctx.fill(); }
  inked(ctx, () => roundRect(ctx, -6, -14, 12, 32, 3), '#8B604C'); inked(ctx, () => roundRect(ctx, -7, -16, 14, 12, 4), '#DC611F');
  ctx.fillStyle = '#2FB3A4'; ctx.fillRect(-7, -14, 14, 3); ctx.fillStyle = '#F4EEDC'; ctx.beginPath(); ctx.moveTo(-3, -10); ctx.lineTo(0, -5); ctx.lineTo(3, -10); ctx.closePath(); ctx.fill();
};
PROJ2.spiritOrb = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 30, 8, SPIRIT[1]); ctx.restore(); lit(ctx, () => glowDisc(ctx, 0, 0, 18, SPIRIT[1], 0.6)); inkDisc(ctx, 0, 0, 6.5, SPIRIT[2]); };
IMPACT2D.spiritOrb = (ctx, m, k) => { const e = easeOut(k); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + m.seed, d = 4 + 16 * e; inkDisc(ctx, m.x + Math.cos(b) * d, m.y + Math.sin(b) * d, 3 * (1 - k) + 1, SPIRIT[2]); } ctx.restore(); };

// ---------------------------------------------------------------- the Witch (round 13)
// the hex bolt (round 19, lane caster19, the designer: "More like minecraft enchanting table shape"): each hex is a rune of
// an old angular script (our own: straight strokes, hooks and dots, nothing copied), glowing pale green, held upright as
// it flies; a faint trail of the same rune's ghosts behind it, and small rune scratches peeling off and drifting away.
const RUNES = [
  [[[-4, -7], [-4, 7]], [[-4, -2], [4, -2], [4, 4]]],
  [[[-5, -6], [5, -6]], [[0, -6], [0, 6]], 'd', [4, 3]],
  [[[5, -7], [5, 7]], [[5, 0], [-5, 0], [-5, -5]]],
  [[[-5, -6], [5, -2], [-5, 2], [5, 6]]],
  [[[-3, -7], [-3, -1]], [[-3, 2], [-3, 7]], [[3, -7], [3, 7]]],
  [[[-5, -6], [-5, 6], [5, 6]], [[-1, -2], [3, 2]]],
  [[[-5, -6], [5, -6], [5, 0], [-5, 0], [-5, 6], [5, 6]]],
  [[[-4, -6], [-4, 2]], [[4, -7], [4, 4], [0, 7]]],
  [[[0, -7], [-5, 0], [0, 7], [5, 0], [0, -7]], 'd', [0, 0]],
  [[[-5, -5], [5, -5]], [[-5, 5], [5, 5]], [[0, -5], [0, 5]], 'd', [-4, 0]],
];
function rune(ctx, i, s, col, wd = 2.6) {
  const R = RUNES[((i % RUNES.length) + RUNES.length) % RUNES.length], path = () => { ctx.beginPath(); for (const st of R) if (Array.isArray(st) && Array.isArray(st[0])) st.forEach(([x, y], j) => (j ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s))); };
  inkLine(ctx, path, col, wd);
  for (let j = 0; j < R.length; j++) if (R[j] === 'd') inkDisc(ctx, R[j + 1][0] * s, R[j + 1][1] * s, wd * 0.75, col);
}
PROJ2.hexbolt = (ctx, p, T, ang, sp) => {
  const id = p.sym ?? 1, wob = Math.sin(T * 7 + p.x * 0.05) * 0.18;
  ctx.save(); ctx.rotate(ang); trail(ctx, sp, 30, 6, '#9BE36B'); ctx.restore();
  for (let i = 1; i <= 2; i++) { ctx.save(); ctx.translate(-Math.cos(ang) * i * 11, -Math.sin(ang) * i * 11); ctx.globalAlpha *= 0.32 / i; upright(ctx, 0, 0, () => rune(ctx, id, 1.05, '#C9F59A', 2)); ctx.restore(); }
  for (let i = 0; i < 2; i++) { const ph = (T * 2.2 + i * 0.5 + p.x * 0.01) % 1, b = ang + Math.PI + (i ? 0.7 : -0.7), d = 10 + ph * 18; ctx.save(); ctx.globalAlpha *= 0.6 * (1 - ph); upright(ctx, Math.cos(b) * d, Math.sin(b) * d - ph * 8, () => { ctx.rotate(ph); rune(ctx, id + 3 + i, 0.45, '#E4F5C8', 1.4); }); ctx.restore(); }
  lit(ctx, () => glowDisc(ctx, 0, 0, 22, '#9BE36B', 0.55));
  upright(ctx, 0, 0, () => { ctx.rotate(wob); rune(ctx, id, 1.25, '#E4F5C8', 2.8); });
};
// a puff of green hex smoke where a unit turns into something else
DRAW.poof = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 2, f.col, 0.6 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.3, d = f.r * (0.3 + 0.9 * e); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, f.r * 0.35 * (1 - 0.5 * k), i % 2 ? f.col : '#E4F5C8'); }
  ctx.restore();
};
// Hex (round 19, lane caster19: "Better frog visual but good implementation. Probably a smaller shadow"): a frog seen from
// above, drawn properly: a pear-shaped body, darker back with blotches and a pale stripe, big domed eyes on top of its
// head with slit pupils, a wide mouth line, little front legs, and its long back legs folded up in a Z either side, the
// webbed feet spread; on a hop the back legs kick out straight and it stretches. Its shadow is the unit's own, frog sized
// (kits2.js shadowK), not a second one.
DRAW.frog = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u)) { ended(f, true); return; } ended(f, !(u.frogUntil > w.time));
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ const hp = u.frogHop != null ? k01((w.time - u.frogHop) / 0.35) : 1; castShadow(u.x, u.y, 9 * clamp(u.vr / 20, 0.8, 1.6), 1, Math.sin(hp * Math.PI) * 16); return; } // (the unit is hidden while it is a frog: this is its only shadow, frog sized: "Probably a smaller shadow")
  const hop = u.frogHop != null ? k01((w.time - u.frogHop) / 0.35) : 1, air = Math.sin(hop * Math.PI), h = air * 16, [vx, vy] = upVec(), s = clamp(u.vr / 20, 0.8, 1.6) * (1 + h / 80);
  const kick = hop < 1 ? Math.sin(Math.min(1, hop * 1.6) * Math.PI) : 0, body = '#5FAE34', back = '#4A8E28', pale = '#A9E07A', foot = '#4A8E28';
  ctx.save(); ctx.translate(u.x + vx * h, u.y + vy * h); ctx.rotate(u.facing - Math.PI / 2); ctx.scale(s, s * (1 + 0.15 * kick)); // (its frame: +y its front)
  for (const sd of [-1, 1]) { // the back legs: thigh out, shin back in, the webbed foot (straight back when it kicks)
    const kx = sd * (13 - 5 * kick), ky = -6 - 6 * kick, fx0 = sd * (9 - 4 * kick), fy0 = -14 - 12 * kick;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(sd * 6, -4); ctx.lineTo(kx, ky); ctx.lineTo(fx0, fy0); }, body, 5.5);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(fx0, fy0); ctx.lineTo(fx0 + sd * 5, fy0 - 5); ctx.lineTo(fx0 + sd * 1, fy0 - 7); ctx.lineTo(fx0 - sd * 3, fy0 - 5); ctx.closePath(); }, foot);
  }
  for (const sd of [-1, 1]) { inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(sd * 6, 6); ctx.lineTo(sd * 11, 10); ctx.lineTo(sd * 10, 14); }, body, 3.5); }
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(9, 14, 11, 4, 10, -3); ctx.bezierCurveTo(9, -10, 5, -12, 0, -12); ctx.bezierCurveTo(-5, -12, -9, -10, -10, -3); ctx.bezierCurveTo(-11, 4, -9, 14, 0, 14); ctx.closePath(); }, u.flashT > 0.06 ? '#FFFFFF' : body);
  ctx.fillStyle = back; ctx.beginPath(); ctx.ellipse(0, -3, 6.5, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = pale; ctx.fillRect(-0.8, -9, 1.6, 12);
  ctx.fillStyle = '#3E7A20'; for (const [x, y, r] of [[-5, -6, 1.6], [4, -1, 1.4], [-3, 2, 1.2], [6, -7, 1.1]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-6, 11.5); ctx.quadraticCurveTo(0, 14, 6, 11.5); ctx.stroke();
  const blink = (w.time * 0.7 + u.id * 0.37) % 1 < 0.05;
  for (const sd of [-1, 1]) { inkDisc(ctx, sd * 5.5, 7, 3.8, '#F2E27A'); if (blink) { ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(sd * 5.5, 7, 3.8, 3.8, 0, 0, TAU); ctx.fill(); } else { ctx.fillStyle = '#2B2230'; ctx.beginPath(); ctx.ellipse(sd * 5.5, 7.3, 2.6, 1.1, 0, 0, TAU); ctx.fill(); disc(ctx, sd * 5.5 - 1, 5.8, 0.9, '#FFFFFF'); } }
  ctx.restore();
};
// the Witch's cauldron (round 15, lane E: art round 12's art/summons/cauldron.svg; round 19, lane caster19: "More top down
// cauldron. Opening more circular": the picture is seen from straight above now, and drawn flat like any unit): little
// flames lick out from under its belly all round, and bubbles rise and pop off the brew in its mouth
ART2.cauldron = {
  under(ctx, u, w) { for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + 0.3, R = u.vr * 1.05; upright(ctx, u.x + Math.cos(b) * R, u.y + Math.sin(b) * R * 0.9, () => flame(ctx, 0, 0, 4.5 + Math.sin(w.time * 20 + i * 1.7) * 1.2)); } },
  over(ctx, u, w) { const [vx, vy] = upVec(); for (let i = 0; i < 3; i++) { const ph = (w.time * 1.6 + i / 3) % 1, b = i / 3 * TAU + 0.6, d = 6; ctx.save(); ctx.globalAlpha *= 1 - ph; inkDisc(ctx, u.x + Math.cos(b) * d + vx * ph * 10, u.y + Math.sin(b) * d + vy * ph * 10, 2 + 3 * ph, '#C9F59A'); ctx.restore(); } },
};
// Cursed Brew landing (round 19: "Don't like landing effect"): the pot comes down hard: a dark ring of dust knocked out
// along the floor, green brew slopping over its rim in heavy drops that splash where they land, and a puff of purple curse
DRAW.potSlam = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
  if (layer === 'ground') {
    ctx.save(); ctx.globalAlpha *= (1 - k) * 0.6; ctx.strokeStyle = '#5A4A3A'; ctx.lineWidth = 16 * (1 - k) + 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (0.4 + 0.7 * e), f.r * (0.4 + 0.7 * e) * 0.85, 0, 0, TAU); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + 0.4, d = f.r * (0.45 + 0.4 * hash(i, 3)), q = k01((k - 0.25) / 0.2); if (q <= 0) continue; ctx.save(); ctx.globalAlpha *= (1 - k) * 0.9; inked(ctx, () => blob(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d * 0.85, 4 + 3 * hash(i, 9) * q, 5, i, 0.7), '#7FCB3A'); ctx.restore(); }
    return;
  }
  if (k < 0.15) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#C9F59A', 0.5 * (1 - k / 0.15)));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + 0.4, d = f.r * (0.45 + 0.4 * hash(i, 3)) * k01(k / 0.3), h = Math.sin(k01(k / 0.3) * Math.PI) * (22 + 12 * hash(i, 4)); if (k > 0.3) continue;
    inkDisc(ctx, f.x + Math.cos(b) * d + vx * h, f.y + Math.sin(b) * d * 0.85 + vy * h, 4.5, i % 2 ? '#9BE36B' : '#C9F59A'); }
  for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + 1, d = 14 + 26 * e, up = 10 + 20 * e; ctx.save(); ctx.globalAlpha *= 0.7; disc(ctx, f.x + Math.cos(b) * d + vx * up, f.y + Math.sin(b) * d * 0.7 + vy * up, 8 + 6 * e, i % 2 ? '#9A5CC8' : '#5A2A80'); ctx.restore(); }
  ctx.restore();
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
// Broom Ride (round 19, lane caster19: "make sure the broom is under her. Not on the ground. Better broom visual. Remove the
// broom from her hand when flying"): the broom is drawn in her own frame, under her body, so it is up there with her
// (lifted by her height, ART2.witch). A long crooked handle runs out past her front with a knot at its tip, the twigs a
// full bundle bound with a purple band flaring out behind her, their ends whipping in the wind; wind lines stream off it.
// Nothing is drawn on the floor (the 'broom' fx is only her flight's marker for the Book now).
DRAW.broom = () => {};
function broomUnder(ctx, w, T) {
  // (her frame: +y her front, room units)
  for (let i = -1; i <= 1; i++) { ctx.save(); ctx.globalAlpha *= 0.7; K.streak(ctx, i * 9, -60 - Math.abs(i) * 4, -Math.PI / 2, 0, 22 + 7 * Math.sin(T * 22 + i * 2), 2.2, '#EEF3F8', '#FFFFFF'); ctx.restore(); }
  // the twigs: a fan bound at the handle, each twig its own stroke, the ends flicking
  const tw = (n, sp) => { for (let i = 0; i < n; i++) { const q = i / (n - 1) - 0.5, end = -58 - 4 * Math.cos(q * 3) + Math.sin(T * 30 + i) * 2.5; ctx.moveTo(q * 7, -22); ctx.quadraticCurveTo(q * sp * 0.6, -38, q * sp + Math.sin(T * 26 + i * 1.3) * 2, end); } };
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-5, -22); ctx.quadraticCurveTo(-17, -40, -18 + Math.sin(T * 26) * 2, -60); ctx.lineTo(18 + Math.sin(T * 24 + 1) * 2, -60); ctx.quadraticCurveTo(17, -40, 5, -22); ctx.closePath(); }, '#D8B060');
  ctx.save(); ctx.strokeStyle = '#A8843A'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); tw(9, 30); ctx.stroke(); ctx.strokeStyle = '#F0D27A'; ctx.lineWidth = 1.1; ctx.beginPath(); tw(5, 22); ctx.stroke(); ctx.restore();
  // the handle: crooked, with a knot near the tip
  // (round 19 check: "reads beside/behind her": the handle runs on well out past her front, so it is seen going in under
  // her and out again)
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -26); ctx.bezierCurveTo(3, 2, -3, 34, 1, 64); }, '#8A5A30', 5.5);
  ctx.save(); ctx.strokeStyle = '#B88250'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-0.8, -24); ctx.bezierCurveTo(2, 2, -4, 34, 0, 62); ctx.stroke(); ctx.restore();
  inkDisc(ctx, 1.5, 63, 4.6, '#7A4E2A');
  inked(ctx, () => roundRect(ctx, -6.5, -27, 13, 6, 2.5), '#5A2A80'); ctx.fillStyle = '#9A5CC8'; ctx.fillRect(-5, -26, 10, 1.6);
}
ART2.witch = { frame(ctx, u, w) { if (u.kit && u.kit.broomUntil > w.time && !u.downed) broomUnder(ctx, w, w.time); } };
// a hex bomb dropped from the broom, and where it pops
PROJ2.hexBomb = (ctx, p, T) => { // (round 19: dropped from her height: it falls, faster and faster, to where it bursts)
  if (p.drop) { const q = 1 - p.life / p.life0, [vx, vy] = upVec(), h = p.drop * (1 - q * q); ctx.translate(vx * h, vy * h); } // (its shadow is the units' own: render.js drawShadows)
  ctx.rotate(T * 10); lit(ctx, () => glowDisc(ctx, 0, 0, 16, '#9BE36B', 0.5)); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); }, '#5A2A80'); inked(ctx, () => star(ctx, 0, 0, 5, 5, 0.42, T * 5), '#9BE36B'); };
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
// (round 15, lane E: the sword in his hand and the red wash are art round 12's demon form now, kits2.js summonImp: the
// red glow and the embers stay)
DRAW.demonForm = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u) || !u.kit || u.kit.demon !== f.D) { ended(f, true); return; } if (layer !== 'air') return;
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
  const h = 60 + 4 * Math.sin(f.t * 2);
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(f.x, f.y, 20, a, h); return; }
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

// ---------------------------------------------------------------- the Chef, the Beekeeper, the Quartermaster (round 13)
// one of six foods (an apple, a drumstick, a pie, a wedge of cheese, a bread roll, a fish), drawn at 0,0
function foodShape(ctx, kind) {
  if (kind === 0) { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 1, 7.5, 0, TAU); }, '#D8402A'); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(1.5, -10); }, '#6E4A2A', 2); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(4, -8, 3.5, 2, 0.5, 0, TAU); }, '#6FA046'); disc(ctx, -2.5, -1.5, 2, '#FF9A80'); }
  else if (kind === 1) { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-2, 0, 8, 6.5, 0, 0, TAU); }, '#C8783A'); inked(ctx, () => roundRect(ctx, 4, -1.6, 9, 3.2, 1.6), '#F4EEDC'); inked(ctx, () => { ctx.beginPath(); ctx.arc(13, -2, 2.2, 0, TAU); ctx.arc(13, 2, 2.2, 0, TAU); }, '#F4EEDC'); }
  else if (kind === 2) { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); }, '#E0B060'); ctx.fillStyle = '#B0402A'; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#F2D28A'; ctx.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-5, i * 3.4); ctx.lineTo(5, i * 3.4); ctx.stroke(); } }
  else if (kind === 3) { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(9, 6); ctx.lineTo(9, -1); ctx.lineTo(-9, -7); ctx.closePath(); }, '#F2C84A'); disc(ctx, -3, 2, 1.8, '#D8A030'); disc(ctx, 4, 3, 1.4, '#D8A030'); }
  else if (kind === 4) { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 9, 6.5, 0, 0, TAU); }, '#D89A50'); ctx.strokeStyle = '#F2CF8A'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(-3, 4); ctx.moveTo(2, -4); ctx.lineTo(2, 4); ctx.stroke(); }
  else { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, TAU); ctx.moveTo(-8, 0); ctx.lineTo(-14, -5); ctx.lineTo(-14, 5); ctx.closePath(); }, '#8FB8D0'); disc(ctx, 5, -1, 1.4, '#2B2230'); }
}
PROJ2.food = (ctx, p, T) => { lobUp(ctx, p, 24); ctx.rotate(T * 8 + p.x * 0.02); ctx.scale(1.15, 1.15); foodShape(ctx, p.food ?? 2); };
// Hot Meal's plate on the floor: a white plate with the food on it, steaming, a warm glow; it fades out near its end
DRAW.meal = (ctx, f, w, layer) => {
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, f.x, f.y, 34, '#FFE7A0', 0.25 * life(f, 0.2, 1))); return; }
  const a = life(f, 0.15, 1), [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= a;
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(f.x, f.y, 15, 11, 0, 0, TAU); }, '#F4F0E8'); ctx.save(); ctx.translate(f.x, f.y); foodShape(ctx, f.kind ?? 2); ctx.restore();
  for (let i = 0; i < 2; i++) { const ph = (f.t * 0.9 + i * 0.5) % 1; ctx.save(); ctx.globalAlpha *= 0.7 * Math.sin(ph * Math.PI); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + (i - 0.5) * 8, f.y); ctx.quadraticCurveTo(f.x + (i - 0.5) * 8 + 6 * Math.sin(f.t * 5 + i), f.y + vy * 10, f.x + (i - 0.5) * 8 + vx * (12 + ph * 16), f.y + vy * (12 + ph * 16)); }, '#FFFFFF', 2.2); ctx.restore(); }
  ctx.restore();
};
// a bee (round 13: "Too many segments. 1 maybe 2 body segments"): a round head and one striped body, two wings beating
PROJ2.bee = (ctx, p, T, ang) => { ctx.rotate(ang); beeShape(ctx, T, 1); };
function beeShape(ctx, T, s2) {
  ctx.scale(s2, s2); const flap = Math.sin(T * 60) * 0.5;
  for (const sd of [-1, 1]) { ctx.save(); ctx.globalAlpha *= 0.8; ctx.rotate(sd * (0.9 + flap * 0.4)); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-1, sd * 0, 5.5, 3, 0, 0, TAU); }, '#EAF6FF'); ctx.restore(); }
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-2.5, 0, 6.5, 4.8, 0, 0, TAU); }, '#F2C84A'); ctx.fillStyle = '#2B2230'; ctx.fillRect(-5.5, -4.6, 2.2, 9.2); ctx.fillRect(-1.5, -4.8, 2.2, 9.6);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(5, 0, 3.4, 0, TAU); }, '#2B2230');
}
// bees pestering one: two or three bees going round it, darting in
DRAW.pester = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u) || !f.hk || f.hk.until <= w.time) { ended(f, true); return; } if (layer !== 'air') return;
  for (let i = 0; i < (f.hk.n || 1); i++) { const b = f.t * (5 + i) + i * 2.1, R = u.vr + 8 + Math.sin(f.t * 9 + i) * 6, x = u.x + Math.cos(b) * R, y = u.y + Math.sin(b) * R * 0.8;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b + Math.PI / 2); beeShape(ctx, f.t + i, 0.9); ctx.restore(); }
};
// Pollen: a golden puff carried back to the friend it mends
DRAW.pollen = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max), [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + f.t * 2, d = u.vr * (0.6 + 0.4 * k), up = 20 * k; disc(ctx, u.x + Math.cos(b) * d + vx * up, u.y + Math.sin(b) * d * 0.7 + vy * up, 3 * (1 - k) + 1, i % 2 ? '#FFD45A' : '#FFF0B0'); } ctx.restore(); };
// Smoker: thick white smoke rolling out in a cone from the smoker's spout
DRAW.smoker = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), a = life(f, 0.15, 0.6);
  if (layer === 'ground') { for (let i = 0; i < 7; i++) { const q = k01(f.t / 0.6 - i * 0.08), b = f.a + (hash(i, 4) - 0.5) * f.arc, d = 30 + f.r * 0.85 * q * (0.4 + 0.6 * hash(i, 7)); if (q > 0) drawPuddle(ctx, 'mist', f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 18 + 22 * q, w.time, a, i * 5 + 2, true); } return; }
  ctx.save(); ctx.globalAlpha *= a * 0.9;
  for (let i = 0; i < 9; i++) { const ph = (f.t * 0.8 + i / 9) % 1, b = f.a + (hash(i, 2) - 0.5) * f.arc, d = 20 + f.r * ph, s3 = 6 + 12 * ph; ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, s3, i % 2 ? '#F4F4F4' : '#DADDE4'); ctx.restore(); }
  ctx.restore();
};
// the Beekeeper's hive (round 15, lane E: art round 12's art/summons/beehive.svg, a straw skep that stands, foot down the
// screen): the code drawing's three bees going round it are kept
ART2.beehive = {
  over(ctx, u, w) { for (let i = 0; i < 3; i++) { const b = w.time * (3 + i) + i * 2, x = u.x + Math.cos(b) * (18 + i * 5), y = u.y - 14 + Math.sin(b) * 10; ctx.save(); ctx.translate(x, y); ctx.rotate(b + Math.PI / 2); beeShape(ctx, w.time + i, 0.7); ctx.restore(); } },
};
PROJ2.hiveFly = (ctx, p, T) => { lobUp(ctx, p, 50); ctx.rotate(Math.sin(T * 8) * 0.4); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-11, -14, 0, -16); ctx.quadraticCurveTo(11, -14, 10, 4); ctx.closePath(); }, '#E0B050'); };
PROJ2.honeyJar = (ctx, p, T) => { lobUp(ctx, p, 40); ctx.rotate(T * 9); inked(ctx, () => roundRect(ctx, -6, -6, 12, 13, 4), '#F2B42A'); inked(ctx, () => roundRect(ctx, -6.5, -9, 13, 4, 1.5), '#C9A070'); };
// Honey Glaze: golden honey running down the body, drops falling off it
DRAW.honeyOn = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const a = life(f, 0.15, 0.4), [vx, vy] = upVec();
  ctx.save(); ctx.globalAlpha *= a * 0.85;
  for (let i = 0; i < 4; i++) { const b = hash(i, u.id) * TAU, d = u.vr * 0.55, ph = (f.t * 0.7 + i / 4) % 1;
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, 4.5, 6 + 4 * ph, 0, 0, TAU); }, '#F2B42A');
    disc(ctx, u.x + Math.cos(b) * d - vx * ph * 18, u.y + Math.sin(b) * d - vy * ph * 18, 2.4 * (1 - ph) + 0.6, '#F2B42A'); }
  ctx.restore();
};
// the Quartermaster's things: a pack item thrown (p.item), the crate, the barricade, the pot over a head, his kit
const ITEM = [(ctx) => { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); }, '#8A8F99'); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(16, 0); }, '#5A3A2A', 3); },
  (ctx) => { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, TAU); }, '#3A3440'); disc(ctx, -2, -2, 3, '#6A6470'); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(18, 0); }, '#2B2230', 3.4); },
  (ctx) => { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(1, -6); ctx.lineTo(1, 2); ctx.lineTo(9, 2); ctx.lineTo(9, 7); ctx.lineTo(-7, 7); ctx.closePath(); }, '#7A4A2A'); },
  (ctx) => { inked(ctx, () => roundRect(ctx, -6, -7, 12, 13, 2), '#C9D2DE'); inkLine(ctx, () => { ctx.beginPath(); ctx.arc(7, 0, 4, -1.2, 1.2); }, '#8A94A6', 2.2); },
  (ctx) => { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-6, 0, 6, 5, 0, 0, TAU); }, '#A8B0BA'); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); }, '#8A94A6', 3); }];
PROJ2.pot = (ctx, p, T) => { ctx.rotate(T * 12); ITEM[p.item ?? 0](ctx); };
// the supply crate (round 15, lane E: art round 12's art/summons/supply-crate.svg; never turned, as the code drew it):
// the code drawing's slow gold pulse is kept
ART2.crate = { over(ctx, u, w) { if (Math.sin(w.time * 5) > 0.5) lit(ctx, () => glowDisc(ctx, u.x, u.y, 26, '#FFE7A0', 0.3)); } };
PROJ2.crateFly = (ctx, p, T) => { lobUp(ctx, p, 50); ctx.rotate(T * 5); inked(ctx, () => roundRect(ctx, -10, -10, 20, 20, 2), '#B8884A'); };
// the barricade (round 15, lane E: art round 12's art/summons/barricade.svg, and barricade-spiked.svg when it has its
// spikes, u.spikes; a plank wall across its way, turned to it as the code's was): the crack under half health is kept
const BARRICADE_SPIKED = 'art/summons/barricade-spiked.svg';
ART2.barricade = {
  art: (u) => (u.spikes ? BARRICADE_SPIKED : null), arts: [BARRICADE_SPIKED],
  over(ctx, u) { if (u.hp / u.maxHp < 0.5) crackAt(ctx, u, -10, -6, 4, 6); },
};
PROJ2.potFly = (ctx, p, T) => { lobUp(ctx, p, 46); ctx.rotate(T * 9); ITEM[1](ctx); };
// Pot Helmet: the pot upside down over its head, rattling as it blunders about
DRAW.potHead = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const a = life(f, 0.05, 0.25), sh = Math.sin(f.t * 25) * 1.5;
  ctx.save(); ctx.globalAlpha *= a; upright(ctx, u.x + sh, u.y - u.vr * 0.15, () => { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, u.vr * 0.85, Math.PI, 0); ctx.lineTo(u.vr * 0.95, 3); ctx.lineTo(-u.vr * 0.95, 3); ctx.closePath(); }, '#3A3440'); ctx.fillStyle = '#6A6470'; ctx.fillRect(-u.vr * 0.6, -u.vr * 0.55, u.vr * 0.4, 3);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.vr * 0.9, -2); ctx.lineTo(u.vr * 0.9 + 12, -6); }, '#2B2230', 3.4); });
  ctx.restore();
};
PROJ2.kitFly = (ctx, p, T) => { lobUp(ctx, p, 40); ctx.rotate(T * 8); kitShape(ctx, p.item); };
function kitShape(ctx, item) {
  if (item === 'whetstone') { inked(ctx, () => roundRect(ctx, -9, -4, 18, 8, 3), '#8A8F99'); ctx.fillStyle = '#C9D2DE'; ctx.fillRect(-7, -2.5, 14, 2); }
  else if (item === 'buckler') { inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); }, '#B8884A'); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, TAU); }, '#C9D2DE'); }
  else { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(1, -8); ctx.lineTo(1, 1); ctx.lineTo(9, 1); ctx.lineTo(9, 7); ctx.lineTo(-6, 7); ctx.closePath(); }, '#7A4A2A'); }
}
// Requisition: the kit he handed over, shown over the friend's head a moment
DRAW.kitOn = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max), [vx, vy] = upVec(), up = u.vr + 16 + 8 * easeOut(k01(k / 0.3)); ctx.save(); ctx.globalAlpha *= 1 - k01((k - 0.7) / 0.3); upright(ctx, u.x + vx * up, u.y + vy * up, () => { lit(ctx, () => glowDisc(ctx, 0, 0, 18, '#FFE7A0', 0.45)); kitShape(ctx, f.item); }); ctx.restore(); };

// ---------------------------------------------------------------- the Crossbowman, Falconer, Grenadier, Harpooner (round 13)
// the heavy crossbow bolt (round 13: "Remove tail from arrow"): a thick shaft, a steel head, short fletching, no trail
PROJ2.cbolt = (ctx, p, T, ang) => { ctx.rotate(ang); const s2 = p.big ? 1.3 : 1; ctx.scale(s2, s2);
  inked(ctx, () => roundRect(ctx, -16, -2.2, 24, 4.4, 2), '#8A5A30'); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(6, -5); ctx.lineTo(6, 5); ctx.closePath(); }, '#C9D2DE');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-19, -5); ctx.lineTo(-11, 0); ctx.lineTo(-19, 5); ctx.closePath(); }, '#E8E2D0');
  if (p.boom) lit(ctx, () => glowDisc(ctx, 0, 0, 16, '#C9D2DE', 0.5)); };
// the crossbow's string snapping forward: short white lines off the front of him
DRAW.twang = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = -1; i <= 1; i++) { const b = f.a + i * 0.5, d = u.r + 8 + 14 * easeOut(k); K.streak(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, b, 0, 10 * (1 - k) + 3, 2.4, '#EEF3F8', '#FFFFFF'); } ctx.restore(); };
// Pinning Bolt: the bolt stuck in it as it flies, and once it slams into a wall, it pinned there
DRAW.boltIn = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) { ended(f, true); return; } ctx.save(); ctx.globalAlpha *= life(f, 0.02, 0.2); ctx.translate(u.x - Math.cos(f.a) * u.r * 0.3, u.y - Math.sin(f.a) * u.r * 0.3); ctx.rotate(f.a); inked(ctx, () => roundRect(ctx, -26, -2.6, 22, 5.2, 2), '#8A5A30'); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-31, -6); ctx.lineTo(-21, 0); ctx.lineTo(-31, 6); ctx.closePath(); }, '#E8E2D0'); ctx.restore(); };
DRAW.pinWall = (ctx, f, w, layer) => { const u = f.unit; if (!alive2(u)) return; if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.35 * life(f, 0.05, 0.3); ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 2.4; for (let i = 0; i < 5; i++) { const b = f.a + Math.PI + (i - 2) * 0.5; ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(u.x + Math.cos(b) * (u.r + 16), u.y + Math.sin(b) * (u.r + 16)); ctx.stroke(); } ctx.restore(); return; } if (f.t < 0.3) lit(ctx, () => glowDisc(ctx, u.x, u.y, 40, '#FFFFFF', 0.6 * (1 - f.t / 0.3))); };
// Crank Up: a gear turning hard at his crossbow, clicks flying off, iron glints
DRAW.crank = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max), x = u.x + Math.cos(u.facing) * (u.r + 4), y = u.y + Math.sin(u.facing) * (u.r + 4);
  ctx.save(); ctx.globalAlpha *= 1 - k * k; ctx.translate(x, y); ctx.rotate(f.t * 14); inked(ctx, () => star(ctx, 0, 0, 11, 8, 0.72, 0), '#A8B0BA'); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); }, '#6E7680'); ctx.restore();
  ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 3; i++) { const ph = (f.t * 3 + i / 3) % 1, b = i * 2.1; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x + Math.cos(b) * (14 + ph * 12), y + Math.sin(b) * (14 + ph * 12)); ctx.lineTo(x + Math.cos(b) * (20 + ph * 12), y + Math.sin(b) * (20 + ph * 12)); }, '#EEF3F8', 2.4); } ctx.restore(); };
// the pavise: a tall painted shield standing on its own (seen from above: a long plank across the way, its prop behind)
// (round 15, lane E: art round 12's art/summons/pavise.svg, its face to its front, turned to it as the code's was; the
// crack under half health is kept)
ART2.pavise = { over(ctx, u) { if (u.hp < u.maxHp * 0.5) crackAt(ctx, u, -8, -3, 6, 2); } };
// the hunting knife: a broad blade turning end over end, a glint along it; gold under Keen Eye
PROJ2.knife = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 26, 6, p.keen ? '#FFE7A0' : '#EEF3F8'); ctx.restore(); if (p.keen) lit(ctx, () => glowDisc(ctx, 0, 0, 16, '#FFD45A', 0.5)); ctx.rotate(T * 22); ctx.scale(1.25, 1.25);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(12, 0); ctx.quadraticCurveTo(4, -5, -2, -4); ctx.lineTo(-2, 4); ctx.quadraticCurveTo(4, 5, 12, 0); ctx.closePath(); }, p.keen ? '#FFE7A0' : '#DCE3EC'); inked(ctx, () => roundRect(ctx, -10, -2.2, 8, 4.4, 2), '#6A4A2C'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(1, -1.6, 7, 1.2); };
// the falcon in flight (showcase 4: "Make the falcon that flies look like the one he was holding"): his slate-grey falcon
// with its pale chest, wings beating
DRAW.falcon = (ctx, f, w, layer) => {
  const [vx, vy] = upVec(), h = 26; if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(f.x, f.y, 10, life(f, 0.1, 0.1), h); return; }
  const beat = Math.sin(f.t * 26) * 0.45; ctx.save(); ctx.globalAlpha *= life(f, 0.05, 0.1); ctx.translate(f.x + vx * h, f.y + vy * h); ctx.rotate(f.a);
  for (const sd of [-1, 1]) { ctx.save(); ctx.scale(1, sd); ctx.rotate(-beat); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(4, 2); ctx.quadraticCurveTo(-2, 16, -12, 24); ctx.lineTo(-8, 16); ctx.lineTo(-14, 14); ctx.quadraticCurveTo(-6, 6, -4, 2); ctx.closePath(); }, '#4A5468'); ctx.restore(); }
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 11, 5.5, 0, 0, TAU); }, '#5A6478'); ctx.fillStyle = '#EFE6D4'; ctx.beginPath(); ctx.ellipse(2, 0, 6, 3.4, 0, 0, TAU); ctx.fill();
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-18, -4); ctx.lineTo(-16, 0); ctx.lineTo(-18, 4); ctx.closePath(); }, '#4A5468');
  inked(ctx, () => { ctx.beginPath(); ctx.arc(9, 0, 4.5, 0, TAU); }, '#4A5468'); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(12, -1.5); ctx.lineTo(16.5, 0.5); ctx.lineTo(12, 2); ctx.closePath(); }, '#E8B53A');
  ctx.restore();
};
// Keen Eye (round 13: "Don't like eye."): gold motes circling his throwing hand while it lasts
DRAW.keenHand = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const hx = u.x + Math.cos(u.facing + 0.6) * u.r, hy = u.y + Math.sin(u.facing + 0.6) * u.r; ctx.save(); ctx.globalAlpha *= life(f, 0.2, 0.4); lit(ctx, () => glowDisc(ctx, hx, hy, 16, '#FFD45A', 0.35)); for (let i = 0; i < 4; i++) { const b = f.t * 6 + i / 4 * TAU; inked(ctx, () => star(ctx, hx + Math.cos(b) * 12, hy + Math.sin(b) * 12, 3.2, 4, 0.4, b), '#FFE7A0'); } ctx.restore(); };
// Call the Flock: he is a flock of small grey birds wheeling round where he is
function smallBird(ctx, x, y, a, t, s2) { const beat = Math.sin(t * 30) * 0.6; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s2, s2);
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, -9 + beat * 5); ctx.quadraticCurveTo(-1, -3, 1, 0); ctx.quadraticCurveTo(-1, 3, -6, 9 - beat * 5); }, '#5A6478', 2.6);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.6, 0, 0, TAU); }, '#6E7890'); ctx.restore(); }
DRAW.flockForm = (ctx, f, w, layer) => { const u = f.unit; if (!alive2(u)) return; const F = f.F, a = life(f, 0.1, 0.2), [vx, vy] = upVec();
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ for (const b of F.birds) { const ang = f.t * 4 * b.s + b.o; castShadow(u.x + Math.cos(ang) * b.r, u.y + Math.sin(ang) * b.r * 0.7, 6, a, 22); } return; } // (he is hidden: each bird its own)
  ctx.save(); ctx.globalAlpha *= a; for (const b of F.birds) { const ang = f.t * 4 * b.s + b.o, x = u.x + Math.cos(ang) * b.r + vx * 22, y = u.y + Math.sin(ang) * b.r * 0.7 + vy * 22; smallBird(ctx, x, y, ang + Math.PI / 2, f.t + b.o, 1.1); } ctx.restore(); };
// the Grenadier's bomb (round 13: "Make sure shadow style matches"): an iron ball, a lit fuse, its shadow on the floor
PROJ2.bomb = (ctx, p, T) => { lobUp(ctx, p, p.color === 'big' ? 56 : 44); const s2 = p.color === 'big' ? 1.6 : 1; ctx.rotate(T * 8); ctx.scale(s2, s2);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); }, '#3A3440'); disc(ctx, -2.5, -2.5, 2.6, '#6A6470'); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(4, -6); ctx.quadraticCurveTo(8, -10, 7, -13); }, '#C9A070', 2); lit(ctx, () => glowDisc(ctx, 7, -13, 7, '#FFC85A', 0.9)); };
// the big bomb sitting where it landed: a great iron ball, its fuse fizzing down
// (round 15, lane E: art round 12's art/summons/big-bomb.svg, standing as the code's did. Kept: it swells faster as the
// fuse burns, and the spark's glow, which creeps down the picture's fuse from its tip, (121.7, 49.7) in its SVG units,
// towards the cap, (100, 64.5), as the code's spark did)
const bombK = (u) => (u.lifeT != null ? 1 - clamp(u.lifeT / 2, 0, 1) : 0);
ART2.bigBomb = {
  frame(ctx, u, w) { const sw = 1 + 0.08 * Math.sin(w.time * (10 + 30 * bombK(u))); ctx.scale(sw, sw); },
  top(ctx, u) { const k = bombK(u) * 0.75; lit(ctx, () => glowDisc(ctx, 121.7 - 21.7 * k, 49.7 + 14.8 * k, 23, '#FFC85A', 0.9)); },
};
// a grey burst of smoke and iron (the Grenadier: "Not fire themed"): a flash, a ring of grey smoke puffs rolling out,
// iron bits thrown; the floor layer gets a scorch
DRAW.smokeBlast = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k), R = f.r;
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.35 * (1 - k); ctx.fillStyle = '#2B2230'; ctx.beginPath(); ctx.arc(f.x, f.y, R * 0.45, 0, TAU); ctx.fill(); ctx.restore(); return; }
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, R * 1.3, '#FFF4DC', 0.9 * (1 - k / 0.2)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k; const n = Math.max(8, Math.round(R / 8));
  for (let i = 0; i < n; i++) { const b = (i + hash(i, f.x | 0) * 0.5) / n * TAU, d = R * (0.3 + 0.7 * e) * (0.8 + 0.25 * hash(f.y | 0, i)); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, (R * 0.17 + 4) * (1 - 0.6 * k), i % 2 ? '#A8A4AE' : '#D8D4DC'); }
  for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + 0.3, d = R * (0.2 + 1.1 * e); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 2.6 * (1 - k) + 1, '#3A3440'); }
  if (k < 0.3) inkDisc(ctx, f.x, f.y, R * 0.35 * (1 - k / 0.3), '#FFF4DC');
  ctx.restore();
};
// the same burst on the floor under him (Blast Off)
DRAW.groundBlast = (ctx, f, w, layer) => { if (layer !== 'ground') return; DRAW.smokeBlast(ctx, f, w, 'ground'); DRAW.smokeBlast(ctx, f, w, 'air'); };
// Sticky Bomb (round 13: "Doesnt look very sticky"): a splat of green goo holding the bomb on, strands dripping, it jiggling
DRAW.sticky = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const a = (f.a ?? 0) + Math.PI, x = u.x + Math.cos(a) * u.r * 0.6, y = u.y + Math.sin(a) * u.r * 0.6, k = k01(f.t / f.max), jig = Math.sin(f.t * (14 + 30 * k)) * 2, [vx, vy] = upVec();
  ctx.save(); inked(ctx, () => blob(ctx, x, y, 14, 7, u.id, 1), '#8FCB3A'); ctx.fillStyle = '#C8F59A'; blob(ctx, x - 3, y - 3, 6, 6, u.id + 1, 1); ctx.fill();
  for (let i = 0; i < 3; i++) { const ph = (f.t * 0.9 + i / 3) % 1, b = a + (i - 1) * 0.8; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x + Math.cos(b) * 9, y + Math.sin(b) * 9); ctx.lineTo(x + Math.cos(b) * 9 - vx * (6 + 14 * ph), y + Math.sin(b) * 9 - vy * (6 + 14 * ph)); }, '#8FCB3A', 2.6); }
  inked(ctx, () => { ctx.beginPath(); ctx.arc(x + jig, y, 8, 0, TAU); }, '#3A3440'); lit(ctx, () => glowDisc(ctx, x + jig + 5, y - 7, 6 + 5 * k, '#FFC85A', 0.9)); ctx.restore(); };
// the harpoon, like the one in his hand: a long wooden shaft and a barbed iron head
PROJ2.harpoon = (ctx, p, T, ang) => { ctx.rotate(p.back ? ang + Math.PI : ang); const s2 = p.big ? 1.3 : 1.1; ctx.scale(s2, s2);
  inked(ctx, () => roundRect(ctx, -26, -2, 28, 4, 2), '#9A6A3A'); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(2, -5); ctx.lineTo(4, -1.5); ctx.lineTo(-2, -4); ctx.lineTo(0, 0); ctx.lineTo(-2, 4); ctx.lineTo(4, 1.5); ctx.lineTo(2, 5); ctx.closePath(); }, '#A8B0BA'); };
// the harpoon's rope (round 13: "Rope needs an outline. Render underneath him"): an inked rope on the floor from his hand
// to the harpoon (f.shot) or to the one it is stuck in (f.to), sagging; stuck: the harpoon drawn in it
DRAW.rope = (ctx, f, w, layer) => {
  const u = f.from; if (!alive2(u)) return; const tgt = f.to || f.shot; if (!tgt || (f.to && !alive2(f.to)) || (f.shot && f.shot.life <= 0)) { ended(f, true); if (!tgt || (f.shot && f.shot.life <= 0)) return; }
  if (layer === 'ground') { const mx = (u.x + tgt.x) / 2, my = (u.y + tgt.y) / 2 + 14 * Math.sin(f.t * 4); ctx.save(); ctx.globalAlpha *= life(f, 0.02, 0.15);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.x + Math.cos(u.facing) * u.r, u.y + Math.sin(u.facing) * u.r); ctx.quadraticCurveTo(mx, my, tgt.x, tgt.y); }, '#C9A070', 3.2); ctx.restore(); return; }
  if (f.stuck && f.to) { const e = f.to; ctx.save(); ctx.translate(e.x - Math.cos(f.a) * e.r * 0.35, e.y - Math.sin(f.a) * e.r * 0.35); ctx.rotate(f.a); inked(ctx, () => roundRect(ctx, -30, -2, 22, 4, 2), '#9A6A3A'); ctx.restore(); }
};
// Rogue Wave: a curling crest of sea water rolling out in front of him, foam on its lip, water left behind it
DRAW.rogueWave = (ctx, f, w, layer) => {
  const R = Math.min(f.r, 10 + f.sp * f.t), k = k01(f.t / f.max), a0 = f.a - f.arc / 2, a1 = f.a + f.arc / 2;
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.4 * (1 - k); ctx.fillStyle = '#5DB7E0'; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, R, a0, a1); ctx.closePath(); ctx.fill(); ctx.restore(); return; }
  ctx.save(); ctx.globalAlpha *= 1 - k01((k - 0.7) / 0.3);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, R, a0, a1); ctx.arc(f.x, f.y, Math.max(1, R - 18), a1, a0, true); ctx.closePath(); }, '#5DB7E0');
  ctx.fillStyle = '#BFE9F8'; ctx.beginPath(); ctx.arc(f.x, f.y, R - 2, a0 + 0.05, a1 - 0.05); ctx.arc(f.x, f.y, Math.max(1, R - 7), a1 - 0.05, a0 + 0.05, true); ctx.closePath(); ctx.fill();
  for (let i = 0; i <= 8; i++) { const b = a0 + (a1 - a0) * i / 8; inkDisc(ctx, f.x + Math.cos(b) * (R + 3), f.y + Math.sin(b) * (R + 3), 4 + 2 * Math.sin(f.t * 12 + i), '#F2FBFF'); }
  ctx.restore();
};
// Drop Anchor: a big iron anchor heaved off him, arcing high over to where it lands, its chain back to him
function anchorShape(ctx, s2) { ctx.scale(s2, s2);
  inked(ctx, () => roundRect(ctx, -3, -26, 6, 40, 3), '#6E7680'); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -30, 6, 0, TAU); }, '#6E7680'); disc(ctx, 0, -30, 2.6, '#2B2230');
  inked(ctx, () => roundRect(ctx, -12, -18, 24, 4.5, 2), '#6E7680');
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 4, 18, 0.15, Math.PI - 0.15); ctx.lineTo(-22, 10); ctx.lineTo(-14, 6); ctx.arc(0, 4, 13, Math.PI - 0.3, 0.3, true); ctx.lineTo(22, 10); ctx.closePath(); }, '#8A94A6'); }
DRAW.anchor = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), u = f.from, [vx, vy] = upVec(), x = f.x0 + (f.x - f.x0) * k, y = f.y0 + (f.y - f.y0) * k, h = Math.sin(k * Math.PI) * 110;
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(x, y, 16, 1, h);
    if (alive2(u)) inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(x, y); }, '#8A94A6', 3); return; }
  ctx.save(); ctx.translate(x + vx * h, y + vy * h); ctx.rotate(k * 3 - 1); anchorShape(ctx, 1.3 + 0.3 * Math.sin(k * Math.PI)); ctx.restore();
};
DRAW.anchorCrash = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k);
  if (layer === 'ground') { drawPuddle(ctx, 'earth', f.x, f.y, f.r * 0.5 * (0.6 + 0.4 * e), w.time, 1 - k, f.x | 0); return; }
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.2, '#FFF4DC', 0.8 * (1 - k / 0.2)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k; K.dustPuffs(ctx, f.x, f.y, f.r, e, f.x | 0, 9);
  ctx.save(); ctx.globalAlpha *= 1 - k01((k - 0.5) / 0.5); ctx.translate(f.x, f.y); ctx.rotate(0.3); anchorShape(ctx, 1.4); ctx.restore();
  ctx.restore();
};
DRAW.chainSweep = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const k = k01(f.t / f.max), b = f.t * 14; ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 6; i++) { const d = u.r + i * (f.r - u.r) / 6; inkDisc(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, 4, '#8A94A6'); } ctx.restore(); };

// ---------------------------------------------------------------- the Huntress, Marksman, Ninja, Pirate (round 13)
// the javelin: a long shaft, a leaf head, a short trail; the razor one serrated and red-edged; big: Bound's
PROJ2.javelin = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 34, 7, p.razor ? '#FF8A7A' : '#EEF3F8'); ctx.restore(); ctx.rotate(ang); const s2 = p.big ? 1.45 : 1.1; ctx.scale(s2, s2);
  inked(ctx, () => roundRect(ctx, -26, -1.8, 30, 3.6, 1.8), '#9A6A3A');
  if (p.razor) inked(ctx, () => { ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(10, -3); ctx.lineTo(8, -6); ctx.lineTo(6, -3); ctx.lineTo(3, -5.5); ctx.lineTo(2, 0); ctx.lineTo(3, 5.5); ctx.lineTo(6, 3); ctx.lineTo(8, 6); ctx.lineTo(10, 3); ctx.closePath(); }, '#E8C8C0');
  else inked(ctx, () => { ctx.beginPath(); ctx.moveTo(15, 0); ctx.quadraticCurveTo(8, -5, 2, -3.5); ctx.lineTo(2, 3.5); ctx.quadraticCurveTo(8, 5, 15, 0); ctx.closePath(); }, '#C9D2DE'); };
// Javelin Rain: a javelin dropping out of the sky onto the spot, its shadow growing under it
DRAW.javFall = (ctx, f, w, layer) => { const k = k01(f.t / f.max), [vx, vy] = upVec(), h = (1 - k * k) * 160;
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(f.x, f.y, 8, 0.3 + 0.7 * k, h); return; }
  ctx.save(); ctx.translate(f.x + vx * h, f.y + vy * h); ctx.rotate(Math.atan2(-vy, -vx)); ctx.scale(1.3, 1.3); inked(ctx, () => roundRect(ctx, -26, -1.8, 30, 3.6, 1.8), '#9A6A3A'); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(15, 0); ctx.quadraticCurveTo(8, -5, 2, -3.5); ctx.lineTo(2, 3.5); ctx.quadraticCurveTo(8, 5, 15, 0); ctx.closePath(); }, '#C9D2DE'); ctx.restore(); };
DRAW.javStuck = (ctx, f, w, layer) => { if (layer !== 'air') return; const a = life(f, 0.02, 0.4), [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= a; if (f.t < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, 30, '#FFFFFF', 0.6 * (1 - f.t / 0.2)));
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + vx * 26 + 6, f.y + vy * 26); }, '#9A6A3A', 3.6); ctx.restore(); };
// a gun's muzzle: a flash, a puff of white smoke rolling out, sparks (big: the musket, Point Blank)
DRAW.muzzle = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const u = f.unit, k = k01(f.t / f.max), e = easeOut(k), d = (u ? u.r : 20) + 14, S = f.big ? 1.4 : 1, x = (u && !u.dead ? u.x : f.x) + Math.cos(f.a) * d, y = (u && !u.dead ? u.y : f.y) + Math.sin(f.a) * d;
  if (k < 0.2) { lit(ctx, () => glowDisc(ctx, x, y, 28 * S, '#FFE7A0', 0.9 * (1 - k / 0.2))); inked(ctx, () => star(ctx, x, y, 14 * S * (1 - k / 0.2) + 4, 6, 0.42, f.a), '#FFF4C8'); }
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 5; i++) { const b = f.a + (i - 2) * 0.35, dd = 6 + 30 * S * e * (0.6 + 0.4 * hash(i, 3)); inkDisc(ctx, x + Math.cos(b) * dd, y + Math.sin(b) * dd, (5 + 7 * e) * S * (0.7 + 0.3 * hash(i, 5)), i % 2 ? '#E8E4EC' : '#FFFFFF'); }
  ctx.restore();
};
// Substitution: the log tumbling where she stood (bigger, rolling), and a streak of smoke to where she came out
DRAW.log = (ctx, f, w, layer) => { if (layer !== 'air') return; const k = k01(f.t / f.max), [vx, vy] = upVec(), h = Math.sin(k01(k * 2) * Math.PI) * 16;
  ctx.save(); ctx.globalAlpha *= 1 - k01((k - 0.7) / 0.3); ctx.translate(f.x + vx * h, f.y + vy * h); ctx.rotate(k * 5); ctx.scale(1.3, 1.3);
  inked(ctx, () => roundRect(ctx, -16, -7, 32, 14, 6), '#8A5A30'); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(16, 0, 4, 7, 0, 0, TAU); }, '#C9A070'); ctx.strokeStyle = '#6E4A2A'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(6, -2); ctx.moveTo(-6, 3); ctx.lineTo(9, 3); ctx.stroke(); ctx.restore(); };
DRAW.smokeDash = (ctx, f, w, layer) => { if (layer !== 'ground') return; const k = k01(f.t / f.max); for (let i = 0; i <= 6; i++) { const q = i / 6; drawPuddle(ctx, 'smoke', f.x + (f.x2 - f.x) * q, f.y + (f.y2 - f.y) * q, 10 + 6 * Math.sin(q * Math.PI), w.time, 1 - k, i * 3 + 1, true); } };
// Caltrops (round 13: "Should be shown spreading around her"): each one flung out from her on a little arc to where it
// lies, an inked iron star; one that has bitten is gone
DRAW.caltrops = (ctx, f, w, layer) => {
  const k = k01(f.t / 0.3), [vx, vy] = upVec(), a = life(f, 0.02, 0.5); if (layer !== (k < 1 ? 'air' : 'ground')) return; // (round 19, lane physics19: flung, they are in the air; lying, they are on the floor under every body. They were drawn over whoever stood on them)
  ctx.save(); ctx.globalAlpha *= a;
  for (const c of f.C) { if (!c.live) continue; const x = c.x0 + (c.x - c.x0) * easeOut(k), y = c.y0 + (c.y - c.y0) * easeOut(k), h = Math.sin(k * Math.PI) * 18;
    ctx.save(); ctx.translate(x + vx * h, y + vy * h); ctx.rotate(c.rot + (1 - k) * 8); inked(ctx, () => star(ctx, 0, 0, 6.5, 4, 0.32, 0), '#8A94A6'); disc(ctx, 0, 0, 1.6, '#C9D2DE'); ctx.restore(); }
  ctx.restore();
};
// Kunai Rain's kunai: a dark blade with a ring at the hilt
PROJ2.kunai = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 22, 5, '#C9D2DE'); ctx.restore(); ctx.rotate(ang); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(0, -3.5); ctx.lineTo(-4, 0); ctx.lineTo(0, 3.5); ctx.closePath(); }, '#5A6070'); inked(ctx, () => { ctx.beginPath(); ctx.arc(-8, 0, 3, 0, TAU); }, '#3A3440'); };
// Grog: the bottle tipped up to her mouth; then tipsy: little bubbles and a slow swirl over her head
DRAW.bottle = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const [vx, vy] = upVec(); ctx.save(); ctx.translate(u.x + vx * u.vr * 0.2 + Math.cos(u.facing) * u.r * 0.5, u.y + vy * u.vr * 0.2 + Math.sin(u.facing) * u.r * 0.5); ctx.rotate(u.facing + Math.PI * 0.85);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, 0, 0, TAU); ctx.rect(8, -2.5, 9, 5); }, '#6A8A3A'); disc(ctx, -2, -2, 2, '#A8C878'); ctx.restore(); };
DRAW.tipsy = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= life(f, 0.2, 0.4);
  for (let i = 0; i < 3; i++) { const ph = (f.t * 0.8 + i / 3) % 1; ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inkDisc(ctx, u.x + vx * (u.vr + 6 + ph * 22) + Math.sin(f.t * 3 + i) * 8, u.y + vy * (u.vr + 6 + ph * 22), 2.5 + 2 * ph, '#E8C870'); ctx.restore(); }
  ctx.restore(); };
PROJ2.grogFly = (ctx, p, T) => { lobUp(ctx, p, 40); ctx.rotate(T * 10); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0, 0, TAU); ctx.rect(7, -2, 7, 4); }, '#6A8A3A'); };
// Broadside (round 13: "They should come in from an arc off the screen"): a cannonball coming in from the edge of the
// room on a high arc, its shadow racing in and growing where it will land
DRAW.cannon = (ctx, f, w, layer) => { const k = k01(f.t / f.max), [vx, vy] = upVec(), x = f.sx + (f.x - f.sx) * k, y = f.sy + (f.y - f.sy) * k, h = Math.sin(k * Math.PI) * 220 + (1 - k) * 60;
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(x, y, 10 * (1.4 - 0.4 * k), 0.4 + 0.6 * k, h);
    ctx.save(); ctx.globalAlpha *= 0.4 * k; ctx.strokeStyle = '#C8453D'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.2 - 0.2 * k), 0, TAU); ctx.stroke(); ctx.restore(); return; }
  ctx.save(); ctx.translate(x + vx * h, y + vy * h); const s2 = 1.4 - 0.4 * k; ctx.scale(s2, s2); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); }, '#2B2230'); disc(ctx, -3, -3, 3.2, '#5A5060'); ctx.restore(); };

// ---------------------------------------------------------------- the Slinger, Trapper, Gladiator, Jester (round 13)
// a sling stone (round 13: "Bone particles bad"): a grey stone; its burst is grit and pebbles
IMPACT2D.stone = (ctx, m, k) => { const e = easeOut(k); ctx.save(); ctx.globalAlpha *= 1 - k * k; for (let i = 0; i < 5; i++) { const b = m.a + Math.PI + (hash(m.seed, i) - 0.5) * 2.4, d = 4 + 18 * e; inkDisc(ctx, m.x + Math.cos(b) * d, m.y + Math.sin(b) * d, 2.6 * (1 - 0.5 * k) + 0.5, i % 2 ? '#A99C8B' : '#7A6A58'); } K.dustPuffs(ctx, m.x, m.y, 16, e, m.seed, 4); ctx.restore(); };
IMPACT2D.bigStone = IMPACT2D.stone;
PROJ2.bigStone = (ctx, p, T) => { lobUp(ctx, p, 70); ctx.rotate(T * 6); inked(ctx, () => blob(ctx, 0, 0, 10, 7, 3, 1), '#8A7E70'); disc(ctx, -3, -3, 3, '#B0A494'); };
// Stunning Stone: the sling going round over his head, a blur and a glint
DRAW.slingWhirl = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const [vx, vy] = upVec(), hx = u.x + vx * (u.vr + 6), hy = u.y + vy * (u.vr + 6), b = f.t * 26; ctx.save(); ctx.globalAlpha *= life(f, 0.05, 0.1);
  inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(hx, hy, 22, 9, 0, b - 1.2, b); }, '#EEF3F8', 2.6); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(b) * 22, hy + Math.sin(b) * 9); }, '#8A5A30', 2); inkDisc(ctx, hx + Math.cos(b) * 22, hy + Math.sin(b) * 9, 5, '#8A7E70'); ctx.restore(); };
DRAW.stoneCrack = (ctx, f, w, layer) => { if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + 0.3, d = 6 + 24 * e; ctx.save(); ctx.translate(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d); ctx.rotate(b + k * 4); inked(ctx, () => blob(ctx, 0, 0, 4 * (1 - 0.5 * k), 5, i, 1), '#8A7E70'); ctx.restore(); } ctx.restore(); };
// the ram, redrawn (round 13: "Concept good. Execution poor"): a big woolly body of curls, a dark face, curled horns, legs
// pounding as it bounds; dust kicked up behind
DRAW.ram = (ctx, f, w, layer) => {
  const bound = Math.abs(Math.sin(f.t * 16)), [vx, vy] = upVec(), h = bound * 8;
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(f.x, f.y, 20, life(f, 0.05, 0.2), h); K.dustPuffs(ctx, f.x - Math.cos(f.a) * 30, f.y - Math.sin(f.a) * 30, 18, 0.5 + 0.5 * bound, (f.t * 10) | 0, 3); return; }
  ctx.save(); ctx.globalAlpha *= life(f, 0.05, 0.2); ctx.translate(f.x + vx * h, f.y + vy * h); ctx.rotate(f.a); ctx.scale(1.25, 1.25);
  for (const [lx, ly] of [[10, -11], [10, 11], [-12, -11], [-12, 11]]) { const sw = Math.sin(f.t * 16 + lx) * 4; inked(ctx, () => roundRect(ctx, lx - 3 + sw, ly - 3, 7, 6, 2.5), '#3A3440'); }
  inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 12; i++) { const b = i / 12 * TAU, rr = (i % 2 ? 15 : 17); ctx.lineTo(Math.cos(b) * rr * 1.25 - 3, Math.sin(b) * rr); } ctx.closePath(); }, '#F4EEDC');
  for (let i = 0; i < 5; i++) { ctx.strokeStyle = '#D8CFB8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-10 + i * 5, (i % 2 ? -4 : 4), 3.5, 0, TAU); ctx.stroke(); }
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(20, 0, 8, 6.5, 0, 0, TAU); }, '#4A4048');
  for (const sd of [-1, 1]) inkLine(ctx, () => { ctx.beginPath(); ctx.arc(17, sd * 7, 5.5, sd > 0 ? -1.6 : 1.6, sd > 0 ? 2.2 : -2.2, sd < 0); }, '#C9B890', 3.6);
  ctx.restore();
};
DRAW.wool = (ctx, f, w, layer) => { if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + hash(i, f.x | 0), d = 6 + 26 * e; inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 4.5 * (1 - 0.5 * k), '#F4EEDC'); } ctx.restore(); };
// Counting Sheep: a little sheep bounding over the spot (in on one side, out the other), a number for each
DRAW.sheepHop = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), [vx, vy] = upVec(), x = f.x + Math.cos(f.a) * (k - 0.5) * 90, y = f.y + Math.sin(f.a) * (k - 0.5) * 90, h = Math.sin(k * Math.PI) * 40;
  if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(x, y, 11, 1, h); return; }
  ctx.save(); ctx.globalAlpha *= 1 - k01((k - 0.8) / 0.2); ctx.translate(x + vx * h, y + vy * h); ctx.rotate(f.a);
  for (const [lx, ly] of [[6, -6], [6, 6], [-6, -6], [-6, 6]]) inked(ctx, () => roundRect(ctx, lx - 2 + (k < 0.5 ? 2 : -2), ly - 2, 4, 4, 1.5), '#3A3440');
  inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const b = i / 10 * TAU, rr = i % 2 ? 9 : 10.5; ctx.lineTo(Math.cos(b) * rr * 1.2, Math.sin(b) * rr); } ctx.closePath(); }, '#FFFFFF');
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(12, 0, 5, 4, 0, 0, TAU); }, '#3A3440'); ctx.restore();
  if (layer === 'air' && k > 0.45 && k < 0.65) { ctx.save(); ctx.globalAlpha *= 0.8; upright(ctx, f.x + vx * 50, f.y + vy * 50, () => { ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#2B2230'; ctx.strokeText('z', 0, 0); ctx.fillStyle = '#A99CD8'; ctx.fillText('z', 0, 0); }); ctx.restore(); }
};
// the Trapper's jaw trap (round 13: "That doesnt look like what he is holding"): his steel jaw trap: two toothed half
// rings open on the floor, a round pan between, a chain to its stake; snapped shut once it bites
DRAW.trap = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const a = life(f, 0.1, 0.3), shut = f.snapT != null ? easeOut(k01((f.t - f.snapT) / 0.08)) : 0;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(f.x, f.y);
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(14, 4); ctx.quadraticCurveTo(24, 14, 30, 8); }, '#6E7680', 2.2); inked(ctx, () => { ctx.beginPath(); ctx.arc(31, 8, 3, 0, TAU); }, '#6E7680');
  for (const sd of [-1, 1]) { ctx.save(); ctx.scale(1, sd); ctx.translate(0, (1 - shut) * 6);
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 15, Math.PI, TAU); }, '#8A94A6', 4);
    for (let i = 1; i < 6; i++) { const b = Math.PI + i / 6 * Math.PI; inked(ctx, () => { ctx.beginPath(); ctx.moveTo(Math.cos(b - 0.12) * 13, Math.sin(b - 0.12) * 13); ctx.lineTo(Math.cos(b) * 7, Math.sin(b) * 7); ctx.lineTo(Math.cos(b + 0.12) * 13, Math.sin(b + 0.12) * 13); ctx.closePath(); }, '#DCE3EC'); }
    ctx.restore(); }
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 5 * (1 - shut), 0, TAU); }, '#A8B0BA');
  ctx.restore();
};
PROJ2.pellet = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 14, 3.5, '#EEF3F8'); ctx.restore(); inkDisc(ctx, 0, 0, 3.2, '#6E7680'); };
IMPACT2D.pellet = (ctx, m, k) => { ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 3; i++) { const b = m.a + Math.PI + (i - 1) * 0.8, d = 3 + 9 * easeOut(k); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(m.x + Math.cos(b) * d, m.y + Math.sin(b) * d); ctx.lineTo(m.x + Math.cos(b) * (d + 4), m.y + Math.sin(b) * (d + 4)); }, '#FFF4C8', 1.8); } ctx.restore(); };
// Bush: he is a round leafy bush, rustling as it creeps
DRAW.bush = (ctx, f, w, layer) => { const u = f.unit; if (!alive2(u) || !(u.kit && u.kit.bushUntil > w.time)) { ended(f, true); return; } if (layer !== 'air') return; const rus = Math.sin(f.t * 12) * (u.spd > 5 ? 2 : 0.6), R = u.vr * 1.25;
  ctx.save(); ctx.globalAlpha *= life(f, 0.15, 0.25);
  inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 9; i++) { const b = i / 9 * TAU, rr = R * (i % 2 ? 0.86 : 1); ctx.arc(u.x + Math.cos(b) * rr * 0.55 + rus, u.y + Math.sin(b) * rr * 0.55, rr * 0.5, 0, TAU); } }, '#5A8A34');
  for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + 0.4; disc(ctx, u.x + Math.cos(b) * R * 0.4 + rus, u.y + Math.sin(b) * R * 0.4, R * 0.28, i % 2 ? '#6FA046' : '#7FB850'); }
  disc(ctx, u.x - R * 0.2 + rus, u.y - R * 0.25, R * 0.16, '#A9D47A'); ctx.restore(); };
// Spear of Ares: a great bronze-headed spear trailing red-gold
PROJ2.aresSpear = (ctx, p, T, ang, sp) => { ctx.save(); ctx.rotate(ang); trail(ctx, sp, 60, 12, '#F2A23A'); ctx.restore(); lit(ctx, () => glowDisc(ctx, 0, 0, 26, '#F2A23A', 0.45)); ctx.rotate(ang); ctx.scale(1.6, 1.6);
  inked(ctx, () => roundRect(ctx, -28, -2, 32, 4, 2), '#8A4A2A'); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(4, -6); ctx.lineTo(2, 0); ctx.lineTo(4, 6); ctx.closePath(); }, '#D8A040'); inked(ctx, () => roundRect(ctx, -30, -4, 5, 8, 2), '#C8453D'); };
// Arena: a ring drawn in the sand round the two of them (the designer asked for the ring), sand-coloured with stakes
DRAW.arenaRing = (ctx, f, w, layer) => { if (layer !== 'ground') return; const a = life(f, 0.3, 0.5), q = easeOut(k01(f.t / 0.35));
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(232,212,160,0.22)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * q, 0, TAU); ctx.fill();
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, f.r * q, 0, TAU); }, '#E8D4A0', 4);
  for (let i = 0; i < 10; i++) { const b = i / 10 * TAU; inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(b) * f.r * q, f.y + Math.sin(b) * f.r * q, 4.5, 0, TAU); }, '#C8453D'); }
  ctx.restore(); };
// confetti: a puff of coloured bits (the Jester's swap and kick, a ball's bounce)
DRAW.confetti = (ctx, f, w, layer) => { if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec(), n = f.small ? 6 : 12, cols = ['#C8453D', '#FFD45A', '#5B8CDB', '#7FCB3A', '#E05AB8'];
  ctx.save(); ctx.globalAlpha *= 1 - k * k; for (let i = 0; i < n; i++) { const b = i / n * TAU + hash(i, f.x | 0), d = (f.small ? 8 : 12) + (f.small ? 16 : 34) * e, h = Math.sin(k * Math.PI) * 14 * hash(i, 3);
    ctx.save(); ctx.translate(f.x + Math.cos(b) * d + vx * h, f.y + Math.sin(b) * d + vy * h); ctx.rotate(b + k * 8); ctx.fillStyle = cols[i % 5]; ctx.fillRect(-3, -1.6, 6, 3.2); ctx.restore(); } ctx.restore(); };

// ---------------------------------------------------------------- the Samurai, Valkyrie, Engineer, Werewolf (round 13)
// Iaido's charge: the blade half out of its sheath, light gathering along it, the floor darkening in a line ahead
DRAW.iaidoCharge = (ctx, f, w, layer) => { const u = f.unit; if (!alive2(u)) return; const q = k01(f.t / f.max);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.3 * q; ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 8; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(u.x + Math.cos(f.a) * 200 * q, u.y + Math.sin(f.a) * 200 * q); ctx.stroke(); ctx.restore(); return; }
  const x = u.x + Math.cos(f.a + 0.7) * u.r * 0.8, y = u.y + Math.sin(f.a + 0.7) * u.r * 0.8; lit(ctx, () => glowDisc(ctx, x, y, 14 + 26 * q, '#FFFFFF', 0.3 + 0.5 * q));
  ctx.save(); ctx.globalAlpha *= q; inked(ctx, () => star(ctx, x, y, 4 + 10 * q, 4, 0.25, f.t * 6), '#FFFFFF'); ctx.restore(); };
// Focus: his blade held level before him, a pale edge of light running along it while he waits
DRAW.focusGuard = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; ended(f, !(u.kit && u.kit.focusUntil > w.time));
  const ready = !((u.kit.focusNext || 0) > w.time), a = life(f, 0.1, 0.25), cx = u.x + Math.cos(u.facing) * (u.r + 6), cy = u.y + Math.sin(u.facing) * (u.r + 6), b = u.facing + Math.PI / 2;
  ctx.save(); ctx.globalAlpha *= a * (ready ? 1 : 0.4); lit(ctx, () => { ctx.strokeStyle = 'rgba(238,243,248,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - Math.cos(b) * 20, cy - Math.sin(b) * 20); ctx.lineTo(cx + Math.cos(b) * 20, cy + Math.sin(b) * 20); ctx.stroke(); }); ctx.restore(); };
// Crescent Cut: one heavy white crescent across the enemy
DRAW.crescentSlash = (ctx, f, w, layer) => { if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k01(k / 0.3)); if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.5, '#FFFFFF', 0.7 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k; inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, f.a - 1.4 * e, f.a + 1.4 * e); ctx.arc(f.x - Math.cos(f.a) * 10, f.y - Math.sin(f.a) * 10, f.r * 0.82, f.a + 1.4 * e, f.a - 1.4 * e, true); ctx.closePath(); }, '#EEF3F8'); ctx.restore(); };
// a burst of light (Valkyrie's Call, Sky Dive): a gold flash, light rays and gold stars thrown out
DRAW.radiantBurst = (ctx, f, w, layer) => { const k = k01(f.t / f.max), e = easeOut(k);
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#FFE48A', 0.4 * (1 - k))); return; }
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 0.8, '#FFFBEA', 0.8 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.2, d = 14 + f.r * 0.8 * e; inked(ctx, () => star(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 5 * (1 - 0.5 * k), 4, 0.35, b), '#FFE48A'); } ctx.restore(); };
// Light of Valhalla: a soft gold glow under her while a friend is near (on the floor, no ring)
DRAW.valhalla = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'ground') return; if (!u || u.dead) { ended(f, true); return; } if (u.downed || !(u.kit && u.kit.glowOn)) return;
  lit(ctx, () => glowDisc(ctx, u.x, u.y, f.r * (0.9 + 0.05 * Math.sin(f.t * 2)), '#FFE7A0', 0.16)); };
// Overclock: gears turning hard over her head and a spark or two
DRAW.overclock = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const [vx, vy] = upVec(), k = k01(f.t / f.max), x = u.x + vx * (u.vr + 14), y = u.y + vy * (u.vr + 14);
  ctx.save(); ctx.globalAlpha *= 1 - k * k; for (const [dx, sz, dir] of [[-7, 8, 1], [7, 6, -1]]) { ctx.save(); ctx.translate(x + dx, y); ctx.rotate(f.t * 12 * dir); inked(ctx, () => star(ctx, 0, 0, sz, 8, 0.7, 0), '#FFD45A'); disc(ctx, 0, 0, sz * 0.35, '#8A5A30'); ctx.restore(); } ctx.restore(); };
// her turret thrown into its spot, tumbling
PROJ2.turretFly = (ctx, p, T) => { lobUp(ctx, p, 50); ctx.rotate(T * 8); inked(ctx, () => roundRect(ctx, -10, -10, 20, 20, 4), '#8A94A6'); inked(ctx, () => roundRect(ctx, 6, -2.5, 12, 5, 2), '#5A6070'); };
PROJ2.droneFly = (ctx, p, T) => { lobUp(ctx, p, 30); ctx.rotate(T * 10); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); }, '#E0B050'); };
PROJ2.cog = (ctx, p, T) => { ctx.rotate(T * 16); inked(ctx, () => star(ctx, 0, 0, 9, 8, 0.72, 0), '#A8B0BA'); disc(ctx, 0, 0, 3, '#5A6070'); };
IMPACT2D.cog = (ctx, m, k) => { ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 4; i++) { const b = m.a + Math.PI + (i - 1.5) * 0.7, d = 4 + 14 * easeOut(k); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(m.x + Math.cos(b) * d, m.y + Math.sin(b) * d); ctx.lineTo(m.x + Math.cos(b) * (d + 5), m.y + Math.sin(b) * (d + 5)); }, '#FFF4C8', 2); } ctx.restore(); };
PROJ2.snowball = (ctx, p, T) => { lobUp(ctx, p, 70); ctx.rotate(T * 5); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); }, '#F2FBFF'); disc(ctx, -3, -3, 3, '#DDF6FF'); };
DRAW.snowBurst = (ctx, f, w, layer) => { if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k); if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#DDF6FF', 0.7 * (1 - k / 0.2))); ctx.save(); ctx.globalAlpha *= 1 - k * k; for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + 0.3, d = f.r * (0.2 + 0.8 * e); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 5 * (1 - 0.5 * k), i % 2 ? '#FFFFFF' : '#DDF6FF'); } ctx.restore(); };
DRAW.buildSparks = (ctx, f, w, layer) => { if (layer !== 'air') return; const k = k01(f.t / f.max); ctx.save(); ctx.globalAlpha *= 1 - k; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + f.t * 3, d = 10 + 26 * easeOut(k); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d); ctx.lineTo(f.x + Math.cos(b) * (d + 6), f.y + Math.sin(b) * (d + 6)); }, '#FFE66B', 2.2); } ctx.restore(); };
// the turret's barrels (round 13: "Make barrel swap between showing 2 and 1 (with 2 dark barrels below) to look like it's
// spinning"): drawn over its art while it fires: two barrels and one, swapping, two dark ones under
const turretBarrels = (ctx, u, w) => { const fire = (u.firing || 0) > w.time, swap = fire && Math.floor(w.time * 30) % 2;
  ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(u.facing); const L = u.vr * 1.25;
  for (const o of [-3.2, 3.2]) inked(ctx, () => roundRect(ctx, 6, o - 2, L, 4, 1.5), '#3A3440');
  if (swap) inked(ctx, () => roundRect(ctx, 6, -2.2, L + 2, 4.4, 1.5), '#8A94A6'); else for (const o of [-5.5, 5.5]) inked(ctx, () => roundRect(ctx, 6, o - 2.2, L + 2, 4.4, 1.5), '#8A94A6');
  if (fire) lit(ctx, () => glowDisc(ctx, 8 + L + 4, 0, 12, '#FFE7A0', 0.8)); ctx.restore(); };
DRAW.turretTop = (ctx, f, w, layer) => { const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; } turretBarrels(ctx, u, w); };
// the four towers and the drones (round 15, lane E: art round 12's art/summons/engineer-*.svg, each tower on the
// Engineer's round wooden deck, #back. The torcher and the mortar turn their top, #top, the deck staying put (def.turret,
// the deck held where it was set down: u.baseA); the tesla and the medbay stand and never turn, as the code drew them.
// Kept from the code drawings: the torcher's jet of flames along its facing while it flames, the tesla's glow at its ball
// when it zaps, the mortar's kick back after a shot, the medbay's slow green pulse, the med drone's wobble and spinning
// rotors (it rides u.hop, the rig does that), the wind-up drone's key turning and its waddle as it steps)
const towerSet = (u) => { if (u.baseA == null) u.baseA = u.facing; }; // (where the deck was set down: the way it faced then)
ART2.torcher = {
  pose(u) { towerSet(u); },
  over(ctx, u, w) { if (u.flaming) { const L = 180; ctx.save(); for (let i = 0; i < 9; i++) { const q = ((w.time * 3 + i / 9) % 1), d = 30 + q * L; upright(ctx, u.x + Math.cos(u.facing) * d + Math.sin(i * 7) * 6, u.y + Math.sin(u.facing) * d + Math.cos(i * 5) * 6, () => flame(ctx, 0, 0, 6 + 8 * q)); } ctx.restore(); } },
};
ART2.tesla = { over(ctx, u, w) { const z = (w.time - (u.zapT || -9)); if (z < 0.3 || Math.sin(w.time * 20) > 0.7) { const [x, y] = downAt(u, -18); lit(ctx, () => glowDisc(ctx, x, y, 18, '#FFE66B', 0.7)); } } }; // (the ball: 18 up the screen from its middle)
ART2.snowMortar = {
  pose(u, w, pose) { towerSet(u); const rec = Math.max(0, 1 - (w.time - (u.recoil || -9)) / 0.3); if (rec > 0) pose.top = { dy: -rec * 10 }; }, // (the code's 4 room units back)
};
ART2.medbay = { over(ctx, u, w) { if (Math.sin(w.time * 4) > 0.5) lit(ctx, () => glowDisc(ctx, u.x, u.y, 28, '#9BE07A', 0.35)); } };
ART2.medDrone = {
  frame(ctx, u, w) { ctx.rotate(Math.sin(w.time * 9 + u.id) * 0.4); },
  top(ctx, u, w) { ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 2.6; ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    for (const [x, sd] of [[71.2, 1], [128.8, -1]]) { const b = w.time * 40 * sd; ctx.beginPath(); ctx.moveTo(x - Math.cos(b) * 10, 98.3 - Math.sin(b) * 10); ctx.lineTo(x + Math.cos(b) * 10, 98.3 + Math.sin(b) * 10); ctx.stroke(); }
    ctx.restore(); },
};
ART2.windup = {
  frame(ctx, u) { ctx.rotate(Math.sin(u.key || 0) * 0.12); },
  pose(u, w, pose) { pose.back = { sx: Math.max(0.15, Math.abs(Math.cos((u.key || 0) * 0.6))) }; },
};

export function drawK2(ctx, f, w, layer) { const d = DRAW[f.draw]; if (d) { ctx.save(); d(ctx, f, w, layer); ctx.restore(); } }
export const DRAW2 = DRAW; // round 15 (lane N): fx3.js adds the six newer heroes' looks to the same table

// ---------------------------------------------------------------- signatures at the cast
export const SIG2 = {};
// SLASH2[shape](ctx, m, k, x, y): a melee weapon's own look (fxkit.js slash; round 19, lane caster19)
export const SLASH2 = {};
// the Alchemist's monster punching: a knuckle-shaped thump of purple force where the fist lands, thick strokes on past it
SLASH2.fist = (ctx, m, k, x, y) => {
  const px = x + Math.cos(m.a) * (m.R - 2), py = y + Math.sin(m.a) * (m.R - 2), e = easeOut(k01(k / 0.4)); if (k < 0.22) lit(ctx, () => glowDisc(ctx, px, py, 26, '#E8D8FF', 0.7 * (1 - k / 0.22)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k; for (let i = -2; i <= 2; i++) { const b = m.a + i * 0.38; K.streak(ctx, px + Math.cos(b) * (10 + 22 * e), py + Math.sin(b) * (10 + 22 * e), b, 0, 20 * (1 - k) + 6, 6.5 - Math.abs(i) * 1.3, '#9A5CC8', '#F4EAFF'); }
  ctx.translate(px, py); ctx.rotate(m.a); const S = 1.25 - 0.35 * e; ctx.scale(S, S);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 9, 12, 0, 0, TAU); }, '#C9A0F0'); for (const yy of [-7, -2.4, 2.4, 7]) inkDisc(ctx, 6.5, yy, 3.2, '#D9B6F2'); ctx.restore();
};
// round 19 (lane caster19): no cast flash for these (Harvest: "Shows a random star on him as he jumps"); each shows itself
for (const id of ['breadToss', 'harvest', 'oldTales', 'dirtFling', 'burrow', 'spadeBat']) SIG2[id] = () => false;
