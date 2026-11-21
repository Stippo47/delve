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
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 40, '#FFE7A0', 0.5 * (1 - k / 0.3)));
    for (let i = 0; i < 3; i++) { const q = k01(k * 1.4 - i * 0.18); if (q <= 0) continue; const up = f.r + 6 + 34 * easeOut(q) + i * 2;
      upright(ctx, f.x + vx * up, f.y + vy * up, () => inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-9, 5); ctx.lineTo(0, -3); ctx.lineTo(9, 5); }, i % 2 ? '#FFE7A0' : '#F2C14E', 4)); }
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
      for (let i = 0; i < 4; i++) { const L = (u.r + 14 + i * 7) * spread, b = 0.6 + i * 0.32;
        inked(ctx, () => { ctx.beginPath(); ctx.moveTo(6, -4); ctx.quadraticCurveTo(Math.cos(b) * L * 0.6 + 4, -Math.sin(b) * L * 0.2 - 10, Math.cos(b) * L, -Math.sin(b) * L * 0.45 - 4); ctx.quadraticCurveTo(Math.cos(b) * L * 0.5, 6, 6, 4); ctx.closePath(); }, i % 2 ? '#E9E2D2' : '#FFFFFF'); }
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
DRAW.horn = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const k = k01(f.t / f.max);
  for (let i = 0; i < 3; i++) { const q = k01(k * 1.6 - i * 0.25); if (q <= 0 || q >= 1) continue; const R = 30 + (f.r - 30) * easeOut(q);
    ctx.save(); ctx.globalAlpha *= (1 - q) * 0.8; ctx.setLineDash([14, 10]);
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, R, 0, TAU); }, i % 2 ? '#FFC85A' : '#FF9A55', 4 * (1 - q) + 1.5); ctx.restore(); }
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, 60, '#FFC85A', 0.5 * (1 - k / 0.25)));
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
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 70, '#9B86C9', 0.8 * (1 - k / 0.3)));
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

export function drawK2(ctx, f, w, layer) { const d = DRAW[f.draw]; if (d) { ctx.save(); d(ctx, f, w, layer); ctx.restore(); } }

// ---------------------------------------------------------------- signatures at the cast
export const SIG2 = {};
