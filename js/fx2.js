// The new heroes' looks (round 10, lane H), in the one effects style (docs/FX-STYLE.md): inked solid things, additive
// light, ground effects soft-edged and under the units. Three hooks into the older code:
//   PROJ2[kind](ctx, p, T, ang, sp)  a shot of a new kind (fx.js drawProjectile; ctx is at the shot, not rotated)
//   DRAW[f.draw](ctx, f, w, layer)   an fx of type 'k2' (fx.js drawGroundFx / drawAirFx; layer 'ground' | 'air')
//   SIG2[abilityId](ctx, f, k, el, w) an ability's own signature at the cast (fxkit.js drawSigAir; return false to skip
//                                     the default cast flash)
// installFx2 (called by fxkit.js) adds each new ability's element and signature time, and how its shots burst.
import { TAU, clamp } from './util.js';
import { inked, inkLine, glowDisc, star, upright, upVec, hash, easeOut, flame, blob, trail, roundRect } from './fx.js';

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
const ALIAS2 = { hammer: 'bone' };
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
  // Griffon's wings: two feathered wings spread behind him (under the body), beating while he flies
  wings(ctx, f, w, layer) {
    if (layer !== 'ground' || !f.unit) return; const u = f.unit, a = life(f, 0.15, 0.25);
    const beat = f.flap ? Math.sin(f.t * 22) * 0.35 : Math.sin(f.t * 4) * 0.06, spread = easeOut(k01(f.t / 0.2));
    const lift = u.hop || 0, [vx, vy] = upVec();
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(u.x + vx * lift, u.y + vy * lift); ctx.rotate(u.facing - Math.PI / 2);
    for (const s of [-1, 1]) { ctx.save(); ctx.scale(s, 1); ctx.rotate((0.35 + beat) * spread - 0.2);
      // round 10 (the heroes lane: "Wing Guard's wings are faint"): longer, reaching well past the body, in his own gold
      for (let i = 0; i < 4; i++) { const L = (u.r + 28 + i * 11) * spread, b = 0.6 + i * 0.32;
        inked(ctx, () => { ctx.beginPath(); ctx.moveTo(6, -4); ctx.quadraticCurveTo(Math.cos(b) * L * 0.6 + 4, -Math.sin(b) * L * 0.2 - 12, Math.cos(b) * L, -Math.sin(b) * L * 0.45 - 4); ctx.quadraticCurveTo(Math.cos(b) * L * 0.5, 8, 6, 4); ctx.closePath(); }, ['#F8EED8', '#FBD46E', '#F9CB5C', '#E09A2E'][i]); }
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
// Shadow Walk: dark after-images left along her path
DRAW.shadowTrail = (ctx, f, w, layer) => {
  if (layer !== 'ground' || !f.unit) return; const u = f.unit;
  if (f.t < f.max - 0.5 && (!f.pts.length || Math.hypot(u.x - f.pts[f.pts.length - 1].x, u.y - f.pts[f.pts.length - 1].y) > 10)) f.pts.push({ x: u.x, y: u.y, t: f.t });
  for (const p of f.pts) { const a = k01(1 - (f.t - p.t) / 0.5); if (a <= 0) continue; ctx.save(); ctx.globalAlpha *= a * 0.55; disc(ctx, p.x, p.y, u.vr * (0.6 + 0.6 * a), '#2E2440'); ctx.restore(); }
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
// a round flask of coloured brew, spinning
PROJ2.flask = (ctx, p, T) => {
  ctx.rotate(T * 11 + p.x * 0.01); ctx.scale(1.5, 1.5);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 2, 6.5, 0, TAU); ctx.rect(-2.4, -8, 4.8, 6); }, '#E8F0EA');
  disc(ctx, 0, 3, 5, p.color || '#9BCB3C'); ctx.fillStyle = '#8A5A3A'; ctx.fillRect(-2.8, -10, 5.6, 3.2);
  disc(ctx, -2, 0.5, 1.5, 'rgba(255,255,255,0.75)');
};
// a crusty loaf
PROJ2.bread = (ctx, p, T) => {
  ctx.rotate(T * 6 + p.x * 0.01);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, TAU); }, '#D89A50');
  ctx.strokeStyle = '#F2CF8A'; ctx.lineWidth = 2; for (const x of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(x - 2, -4); ctx.lineTo(x + 2, 4); ctx.stroke(); }
};
// the witch's cauldron flying (it lands upright)
PROJ2.cauldron = (ctx, p, T) => { ctx.rotate(T * 8); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); }, '#3A3440'); disc(ctx, 0, 0, 6.5, '#7FCB3A'); };
// the Shaman's spirit: a teal wisp with a curling tail
PROJ2.spirit = (ctx, p, T, ang, sp) => {
  ctx.rotate(ang); trail(ctx, sp, 40, 8, '#7FE0D0');
  for (let i = 0; i < 3; i++) { const ph = (T * 3 + i / 3) % 1; disc(ctx, -8 - ph * 26, Math.sin(T * 10 + i * 2) * 6 * ph, 3 * (1 - ph) + 0.5, '#BFF6EC'); }
  lit(ctx, () => glowDisc(ctx, 0, 0, 20, '#7FE0D0', 0.6));
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(2, -8, -6, -3); ctx.quadraticCurveTo(-2, 0, -6, 3); ctx.quadraticCurveTo(2, 8, 10, 0); ctx.closePath(); }, '#7FE0D0');
  disc(ctx, 4, -1.5, 2.2, '#FFFFFF');
};
// the Witch's hex bolt: a green spark wrapped in a violet curl
PROJ2.hexbolt = (ctx, p, T, ang, sp) => {
  ctx.rotate(ang); trail(ctx, sp, 34, 7, '#9BE36B');
  lit(ctx, () => glowDisc(ctx, 0, 0, 18, '#9BE36B', 0.55));
  inked(ctx, () => star(ctx, 0, 0, 8, 5, 0.45, T * 9), '#9BE36B');
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 11, T * 12, T * 12 + 3.6); }, '#B07BE0', 2.4);
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
  if (k < 0.4) lit(ctx, () => glowDisc(ctx, f.x, f.y, 40, '#FFE7A0', 0.5 * (1 - k / 0.4)));
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
// the Healing Totem: a carved post with wings standing on the floor, light pouring round its foot
DRAW.totem = (ctx, f, w, layer) => {
  const a = life(f, 0.3, 0.5), rise = easeOut(k01(f.t / 0.35));
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#8BE07A', (0.16 + 0.05 * Math.sin(f.t * 4)) * a)); return; }
  ctx.save(); ctx.globalAlpha *= a;
  upright(ctx, f.x, f.y, () => { ctx.scale(1, rise);
    inked(ctx, () => roundRect(ctx, -7, -46, 14, 46, 3), '#B06A3A');
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-7, -38); ctx.lineTo(-24, -46); ctx.lineTo(-7, -30); ctx.closePath(); ctx.moveTo(7, -38); ctx.lineTo(24, -46); ctx.lineTo(7, -30); ctx.closePath(); }, '#2FA08F');
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -46, 8, 0, TAU); }, '#E0A060'); disc(ctx, -3, -47, 1.8, '#2B2230'); disc(ctx, 3, -47, 1.8, '#2B2230'); });
  for (let i = 0; i < 4; i++) { const ph = (f.t * 0.8 + i / 4) % 1, [vx, vy] = upVec(), b = i * 1.7; ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI) * 0.8; inkDisc(ctx, f.x + Math.cos(b) * 30 + vx * ph * 50, f.y + Math.sin(b) * 20 + vy * ph * 50, 3, '#A9D47A'); ctx.restore(); }
  ctx.restore();
};
// Spirit Link: teal threads between the linked
DRAW.links = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const g = f.group.filter((a) => !a.dead && !a.downed); if (g.length < 2) return; const a = life(f, 0.3, 0.4);
  ctx.save(); ctx.globalAlpha *= 0.7 * a;
  for (let i = 0; i < g.length; i++) { const p = g[i], q = g[(i + 1) % g.length]; if (g.length === 2 && i) break;
    lit(ctx, () => { ctx.strokeStyle = 'rgba(127,224,208,0.35)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo((p.x + q.x) / 2 + Math.sin(f.t * 3 + i) * 14, (p.y + q.y) / 2 + Math.cos(f.t * 3 + i) * 14, q.x, q.y); ctx.stroke(); });
    ctx.strokeStyle = '#BFF6EC'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo((p.x + q.x) / 2 + Math.sin(f.t * 3 + i) * 14, (p.y + q.y) / 2 + Math.cos(f.t * 3 + i) * 14, q.x, q.y); ctx.stroke(); }
  ctx.restore();
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
// Hex: a fat green frog sat on top of the enemy (it covers it)
DRAW.frog = (ctx, f, w, layer) => {
  if (layer !== 'air' || !f.unit) return; const e = f.unit, hop = Math.abs(Math.sin(f.t * 5)) * 8, [vx, vy] = upVec(), s = e.vr / 16 * (f.t < 0.2 ? f.t / 0.2 : 1);
  if (f.t < 0.25) lit(ctx, () => glowDisc(ctx, e.x, e.y, 50, '#9BE36B', 0.7 * (1 - f.t / 0.25)));
  ctx.save(); ctx.translate(e.x + vx * hop, e.y + vy * hop); ctx.rotate(e.facing - Math.PI / 2); ctx.scale(s, s);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 16, 18, 0, 0, TAU); }, '#6FB83A');
  for (const sx of [-1, 1]) { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(sx * 15, -9, 6, 9, sx * 0.5, 0, TAU); }, '#5A9A2E'); inked(ctx, () => { ctx.beginPath(); ctx.arc(sx * 7, 12, 5, 0, TAU); }, '#8FD45A'); }
  disc(ctx, 0, 2, 9, '#A9E07A');
  ctx.restore();
};
// Cursed Brew: a black cauldron bubbling purple fumes, the fumes spread on the floor
DRAW.cauldron = (ctx, f, w, layer) => {
  const a = life(f, 0.2, 0.6);
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.4 * a; ctx.fillStyle = '#6A4A9A'; blob(ctx, f.x, f.y, f.r, 9, f.t * 0.6, 1); ctx.fill(); ctx.restore(); return; }
  ctx.save(); ctx.globalAlpha *= a;
  upright(ctx, f.x, f.y, () => { inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -6, 15, 12, 0, 0, TAU); }, '#3A3440'); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -14, 13, 5, 0, 0, TAU); }, '#7FCB3A'); });
  const [vx, vy] = upVec();
  for (let i = 0; i < 5; i++) { const ph = (f.t * 0.9 + i / 5) % 1; ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI) * 0.9; inkDisc(ctx, f.x + Math.sin(i * 2 + f.t * 2) * 10 + vx * (16 + ph * 44), f.y + vy * (16 + ph * 44), 4 + 6 * ph, i % 2 ? '#9B7BD6' : '#7FCB3A'); ctx.restore(); }
  ctx.restore();
};
// Broom Ride: bristle streaks and a violet trail behind her
DRAW.broom = (ctx, f, w, layer) => {
  if (layer !== 'ground' || !f.unit) return; const u = f.unit, k = k01(f.t / f.max);
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = -2; i <= 2; i++) { const nx = -Math.sin(f.a) * i * 6, ny = Math.cos(f.a) * i * 6; K.streak(ctx, u.x + nx - Math.cos(f.a) * u.r, u.y + ny - Math.sin(f.a) * u.r, f.a + Math.PI, 0, 34 - Math.abs(i) * 5, 2.6, i % 2 ? '#C9A060' : '#B07BE0', '#FFFFFF'); }
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

export function drawK2(ctx, f, w, layer) { const d = DRAW[f.draw]; if (d) { ctx.save(); d(ctx, f, w, layer); ctx.restore(); } }

// ---------------------------------------------------------------- signatures at the cast
export const SIG2 = {};
