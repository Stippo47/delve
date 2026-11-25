// Round 19 (lane rogue19): the looks for the Bandit, the Shade, the Monk and the Cultist, and two shared statuses
// (Disarmed, Anti-heal), in the one effects style (docs/FX-STYLE.md): solid things inked, light additive and never
// outlined, ground effects soft-edged and under the units, nothing that matters thinner than 3 units, hashed noise, no
// blur. It adds its looks to fx2.js's table ('k2' fx by `draw` name), as fx-dash.js does.
import { TAU, clamp } from './util.js';
import { inked, inkLine, glowDisc, star, hash, easeOut, upright, upVec, roundRect } from './fx.js';
import { DRAW2, PROJ2 } from './fx2.js';
import { SLASH_OWN } from './fxkit.js';
import { view } from './render.js';
import { drawGear } from './parts.js';
import { headR } from './sprites.js';

const DRAW = DRAW2;
const k01 = (v) => clamp(v, 0, 1);
const sm = (k) => k * k * (3 - 2 * k);
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const alive2 = (u) => u && !u.dead && !u.downed;
const life = (f, i = 0.12, o = 0.3) => clamp(Math.min(f.t / i, (f.max - f.t) / o, 1), 0, 1);
const ended = (f, gone) => { if (gone && f.max > f.t + 0.25) f.max = f.t + 0.25; };
const inkDisc = (ctx, x, y, r, col) => inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); }, col);
export { k01, sm, lit, alive2, life, ended, inkDisc };

// ---------------------------------------------------------------- Disarmed
// The weapon its art holds (parts.js drawGear: the arm's weapon alone) spins up out of its hand, comes down a little way
// off, skids and lies there, a shadow under it, until the unit has it back (it fades as the hand fills again: the arm
// is drawn with its weapon once more, render.js / parts.js). A figure with no picture of its weapon: a plain blade.
DRAW.disarmFlick = (ctx, f, w, layer) => {
  const u = f.unit; if (!u || u.dead) { ended(f, true); return; }
  if (!(u.disarmT > 0) && !f.back) { f.back = true; f.max = Math.min(f.max, f.t + 0.35); }
  const FLY = 0.42, k = k01(f.t / FLY), e = easeOut(k);
  if (f.x1 == null) { const d = 46 + 18 * hash(u.id, 3); f.x1 = f.x + Math.cos(f.a) * d; f.y1 = f.y + Math.sin(f.a) * d; f.spin = (hash(u.id, 7) < 0.5 ? -1 : 1) * (2.2 + hash(u.id, 9)); }
  const slide = k >= 1 ? easeOut(k01((f.t - FLY) / 0.25)) * 8 : 0;
  const x = f.x + (f.x1 - f.x) * e + Math.cos(f.a) * slide, y = f.y + (f.y1 - f.y) * e + Math.sin(f.a) * slide;
  const [vx, vy] = upVec(), h = Math.sin(Math.PI * k) * 34 * (k < 1 ? 1 : 0);
  const rot = f.facing - Math.PI / 2 + f.spin * TAU * e + (k >= 1 ? 0 : 0);
  const fade = f.back ? 1 - k01((f.t - (f.max - 0.35)) / 0.35) : 1;
  const sizeU = (f.vr || 20) * 220 / (f.headR || headR(u.kind)), s = sizeU / 220;
  if (layer === 'ground') { // its shadow, small while it is up, then lying under it
    ctx.save(); ctx.globalAlpha *= 0.28 * fade * (0.5 + 0.5 * (1 - Math.sin(Math.PI * k)));
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, 12 * s * 5, 5 * s * 5, f.a, 0, TAU); ctx.fill(); ctx.restore();
    if (k < 1) return; // (once down it lies on the floor, under everyone: drawn here, not over them)
  } else if (k >= 1) return;
  ctx.save(); ctx.globalAlpha *= fade * (k >= 1 ? 0.92 : 1);
  ctx.translate(x + vx * h, y + vy * h); ctx.rotate(rot);
  ctx.save(); ctx.scale(s, s);
  const drawn = f.art && drawGear(ctx, f.art, sizeU * (view.scale || 1) * (view.dpr || 1));
  ctx.restore();
  if (!drawn) { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(3.5, -2); ctx.lineTo(-3.5, -2); ctx.closePath(); }, '#C9D2DE'); inked(ctx, () => { ctx.beginPath(); ctx.rect(-7, -5, 14, 3.4); }, '#8A5A30'); }
  ctx.restore();
  // the knock: a white flash at the hand as it leaves, a few glints where it lands
  if (layer === 'air' && f.t < 0.12) lit(ctx, () => glowDisc(ctx, f.x + Math.cos(f.facing) * u.r * 0.8, f.y + Math.sin(f.facing) * u.r * 0.8, 18, '#FFFFFF', 0.7 * (1 - f.t / 0.12)));
  if (k >= 1 && f.t - FLY < 0.25) { const q = (f.t - FLY) / 0.25; ctx.save(); ctx.globalAlpha *= 1 - q; for (let i = 0; i < 3; i++) { const b = f.a + Math.PI + (i - 1) * 0.7; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x + Math.cos(b) * (4 + 8 * q), y + Math.sin(b) * (4 + 8 * q)); ctx.lineTo(x + Math.cos(b) * (8 + 10 * q), y + Math.sin(b) * (8 + 10 * q)); }, '#FFF4C8', 2.2); } ctx.restore(); }
};

// ---------------------------------------------------------------- Anti-heal
// Dull grey-green healing crosses, cracked through with a violet line, sinking off the body (healing's bright green
// crosses rise): the opposite read. Two at a time, each at its own spot round the body.
DRAW.antihealOn = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; } ended(f, !(u.buffs && u.buffs.some((b) => b.id === 'antiheal' && b.t > 0)));
  const [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= life(f, 0.15, 0.3);
  for (let i = 0; i < 2; i++) {
    const cyc = Math.floor(f.t * 0.8 + i * 0.5), ph = (f.t * 0.8 + i * 0.5) % 1, side = (hash(cyc, i, u.id) - 0.5) * 2;
    const up = u.vr * 0.9 + 10 - ph * 22, x = u.x + vx * up - vy * side * u.vr * 0.9, y = u.y + vy * up + vx * side * u.vr * 0.9;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI);
    upright(ctx, x, y, () => {
      inked(ctx, () => { ctx.beginPath(); const a = 2.2, b = 6.4; ctx.moveTo(-a, -b); ctx.lineTo(a, -b); ctx.lineTo(a, -a); ctx.lineTo(b, -a); ctx.lineTo(b, a); ctx.lineTo(a, a); ctx.lineTo(a, b); ctx.lineTo(-a, b); ctx.lineTo(-a, a); ctx.lineTo(-b, a); ctx.lineTo(-b, -a); ctx.lineTo(-a, -a); ctx.closePath(); }, '#8A9A7A');
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(-1, 0); ctx.lineTo(1, 2); ctx.lineTo(7, -6); }, '#9B7BD6', 2.4);
    });
    ctx.restore();
  }
  ctx.restore();
};

// ---------------------------------------------------------------- the Bandit
const CORD = '#C9A070', IRON = '#5E5650', IRON_HI = '#9A9088';
// a bolas weight: a squat triangle, its point at (0, -h) (towards the middle), inked iron with a light edge
function weight(ctx, s = 1) {
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -7 * s); ctx.lineTo(6.2 * s, 4.5 * s); ctx.lineTo(-6.2 * s, 4.5 * s); ctx.closePath(); }, IRON);
  ctx.fillStyle = IRON_HI; ctx.beginPath(); ctx.moveTo(0, -4.4 * s); ctx.lineTo(2.2 * s, 0); ctx.lineTo(-1.4 * s, 0.6 * s); ctx.closePath(); ctx.fill();
}
// the bolas in flight: three triangle weights on cords knotted in the middle, whirling (the designer: three triangles)
PROJ2.bolas = (ctx, p, T) => {
  ctx.rotate(T * 20 + p.x * 0.01); const L = 15;
  for (let i = 0; i < 3; i++) { const b = i / 3 * TAU; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(b) * L, Math.sin(b) * L); }, CORD, 2.4); }
  for (let i = 0; i < 3; i++) { const b = i / 3 * TAU; ctx.save(); ctx.translate(Math.cos(b) * L, Math.sin(b) * L); ctx.rotate(b - Math.PI / 2); weight(ctx, 0.8); ctx.restore(); }
  inkDisc(ctx, 0, 0, 3, CORD);
};
// Bolas, on the one it caught (round 19: "a ring with 3 triangles pointing inwards spread out"): the cord pulled tight in a
// ring round its feet, the three weights on it a third of the way round from each other, each pointing in; it snaps tight
// as it lands and gives a jerk now and then as the trapped one strains
DRAW.bolasTrap = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u)) { ended(f, true); return; }
  if (!(u.h2 && u.h2.some((h) => h.id === 'trapped'))) ended(f, true);
  if (layer !== 'air') return;
  const snap = easeOut(k01(f.t / 0.14)), strain = Math.pow(Math.max(0, Math.sin(f.t * 7 + u.id)), 6) * 2.5;
  const R = (u.vr * 0.95 + 6) * (1 + 0.6 * (1 - snap)) + strain * 0.5, a0 = (f.a || 0) + 0.3;
  ctx.save(); ctx.globalAlpha *= life(f, 0.04, 0.25);
  inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(u.x, u.y, R, R * 0.92, 0, 0, TAU); }, CORD, 3.2);
  ctx.strokeStyle = '#E8CDA0'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.ellipse(u.x, u.y - 0.8, R, R * 0.92, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
  for (let i = 0; i < 3; i++) { const b = a0 + i / 3 * TAU + Math.sin(f.t * 9 + i) * 0.02 * strain, x = u.x + Math.cos(b) * R, y = u.y + Math.sin(b) * R * 0.92;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b + Math.PI / 2); weight(ctx, 1.15); ctx.restore(); }
  ctx.restore();
  if (f.t < 0.18) { ctx.save(); ctx.globalAlpha *= 1 - f.t / 0.18; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU, d = R + 4 + 10 * f.t / 0.18; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.x + Math.cos(b) * d, u.y + Math.sin(b) * d); ctx.lineTo(u.x + Math.cos(b) * (d + 6), u.y + Math.sin(b) * (d + 6)); }, '#FFF4C8', 2); } ctx.restore(); }
};
// Dirty Trick's punch (his free fist is the arm itself, parts.js anim.hand: no fist is drawn floating): where it lands, on
// the body it hit as that flies, a white flash, short white shock streaks thrown out the way the blow goes, a few stars
DRAW.banditPunch = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k01(k / 0.4)), a = f.a, u = f.unit;
  const x = u && !u.dead ? u.x - Math.cos(a) * u.r * 0.8 : f.x, y = u && !u.dead ? u.y - Math.sin(a) * u.r * 0.8 : f.y;
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, x, y, 18, '#FFFFFF', 0.5 * (1 - k / 0.2)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 5; i++) { const b = a + (i - 2) * 0.42, d0 = 6 + 14 * e, L = 12 * (1 - k) + 4;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x + Math.cos(b) * d0, y + Math.sin(b) * d0); ctx.lineTo(x + Math.cos(b) * (d0 + L), y + Math.sin(b) * (d0 + L)); }, '#FFFFFF', 3); }
  inked(ctx, () => star(ctx, x, y, 9 * (1 - 0.5 * k), 6, 0.45, a), '#FFF4C8');
  ctx.restore();
};
// Hostage: the cutlass held across its throat (a steel edge with a glint running along it), sweat drops popping off its head
DRAW.hostage = (ctx, f, w, layer) => {
  const e = f.unit, b = f.by; if (!alive2(e) || !alive2(b)) { ended(f, true); return; }
  if (!(e.h2 && e.h2.some((h) => h.id === 'hostage'))) ended(f, true);
  if (layer !== 'air') return; const [vx, vy] = upVec();
  ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.2);
  const a = b.facing, cx = e.x - Math.cos(a) * e.r * 0.15, cy = e.y - Math.sin(a) * e.r * 0.15, n = -Math.sin(a), m = Math.cos(a), L = e.r * 0.95;
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - n * L, cy - m * L); ctx.quadraticCurveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, cx + n * L, cy + m * L); ctx.lineTo(cx + n * L - Math.cos(a) * 4, cy + m * L - Math.sin(a) * 4); ctx.quadraticCurveTo(cx + Math.cos(a) * 1, cy + Math.sin(a) * 1, cx - n * L - Math.cos(a) * 4, cy - m * L - Math.sin(a) * 4); ctx.closePath(); }, '#DCE3EC');
  const g = (f.t * 0.8) % 1; if (g < 0.25) lit(ctx, () => glowDisc(ctx, cx + n * L * (g * 8 - 1), cy + m * L * (g * 8 - 1), 7, '#FFFFFF', 0.8));
  for (let i = 0; i < 2; i++) { const ph = (f.t * 1.4 + i * 0.5) % 1, sd = i ? 1 : -1, up = e.vr + 4 + ph * 10;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI);
    upright(ctx, e.x + vx * up - vy * sd * (8 + ph * 6), e.y + vy * up + vx * sd * (8 + ph * 6), () => inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(3.6, 0, 0, 3); ctx.quadraticCurveTo(-3.6, 0, 0, -5); }, '#BFE9F8'));
    ctx.restore(); }
  ctx.restore();
};

// ---------------------------------------------------------------- the Shade
// a puff of shadow where she blinks in or out: inked dark smoke blobs thrown out (or drawn in), a violet flash
DRAW.shadowBlink = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k), r = f.r || 24;
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.35 * (1 - k); ctx.fillStyle = '#140E1E'; ctx.beginPath(); ctx.ellipse(f.x, f.y, r * (0.8 + 0.4 * e), r * 0.7 * (0.8 + 0.4 * e), 0, 0, TAU); ctx.fill(); ctx.restore(); return; }
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, r * 1.3, '#9B86C9', 0.5 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + hash(i, f.x | 0) * 0.6, d = f.out ? r * 0.9 * (1 - e) + 4 : 6 + r * 0.9 * e, s = (6 + 4 * hash(i, 5)) * (1 - 0.7 * k);
    inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, s, i % 2 ? '#2E2440' : '#3E3158'); }
  ctx.restore();
};
// incorporeal: smoke curling up off the body (the Shade's form: dark; a ghost's: pale mist), wisps that rise and thin
DRAW.incorpOn = (ctx, f, w, layer) => {
  const u = f.unit; if (!u || u.dead) { ended(f, true); return; } if (u.downed || !(u.incorpT > 0)) ended(f, true);
  if (layer !== 'air' || u.hidden) return; const [vx, vy] = upVec(), mist = f.look === 'mist';
  ctx.save(); ctx.globalAlpha *= life(f, 0.2, 0.25) * (mist ? 0.7 : 0.85);
  for (let i = 0; i < 5; i++) { const ph = (f.t * 0.9 + i / 5) % 1, cyc = Math.floor(f.t * 0.9 + i / 5), b = hash(cyc, i, u.id) * TAU, d = u.vr * (0.7 + 0.25 * ph);
    const x = u.x + Math.cos(b) * d + vx * ph * 22 + Math.sin(ph * 6 + i) * 3, y = u.y + Math.sin(b) * d * 0.9 + vy * ph * 22;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inkDisc(ctx, x, y, (mist ? 5 : 4.5) * (1 - ph * 0.6), mist ? '#DCEFFF' : (i % 2 ? '#2E2440' : '#4A3A6A')); ctx.restore(); }
  ctx.restore();
};
// a physical blow passing through the incorporeal: the blow's streaks go on out the far side, the body sheds a few wisps
DRAW.passThrough = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !u) return; const k = k01(f.t / f.max), a = f.a, mist = f.look === 'mist';
  ctx.save(); ctx.globalAlpha *= (1 - k) * 0.9;
  for (let i = -1; i <= 1; i++) { const nx = -Math.sin(a) * i * 8, ny = Math.cos(a) * i * 8, d0 = -u.r + (u.r * 2.2) * easeOut(k), L = 12;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.x + nx + Math.cos(a) * d0, u.y + ny + Math.sin(a) * d0); ctx.lineTo(u.x + nx + Math.cos(a) * (d0 + L), u.y + ny + Math.sin(a) * (d0 + L)); }, mist ? '#EAF6FF' : '#9B86C9', 2.4); }
  for (let i = 0; i < 4; i++) { const b = a + Math.PI / 2 * (i % 2 ? 1 : -1) + (i > 1 ? 0.5 : -0.5), d = u.r * 0.6 + 12 * k; inkDisc(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, 3.5 * (1 - k) + 1, mist ? '#DCEFFF' : '#3E3158'); }
  ctx.restore();
};

// ---------------------------------------------------------------- the Monk
// a fist's pow (round 19, Fists and Flurry: "Don't like visual"): where the fist lands, a white flash, a starburst of
// short inked spikes thrown out the way the blow goes (saffron at the root, white tips), a puff of force behind them;
// big (the third blow, Flurry's last): wider, more spikes, speed lines and a dust ring on the floor
function pow(ctx, x, y, a, r, k, big) {
  const e = easeOut(k01(k / 0.4));
  if (k < 0.18) lit(ctx, () => glowDisc(ctx, x, y, r * 1.1, '#FFFFFF', 0.45 * (1 - k / 0.18))); // (small: additive white on a pale floor goes to a flat white blob)
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  const n = big ? 9 : 6, span = big ? 2.6 : 1.9;
  for (let i = 0; i < n; i++) { const b = a + (i / (n - 1) - 0.5) * span, d0 = r * 0.35 + r * 0.3 * e, L = r * (0.55 + 0.35 * (i % 2)) * (1 - 0.5 * k);
    const x0 = x + Math.cos(b) * d0, y0 = y + Math.sin(b) * d0, x1 = x + Math.cos(b) * (d0 + L), y1 = y + Math.sin(b) * (d0 + L), nx = -Math.sin(b) * 2.6, ny = Math.cos(b) * 2.6;
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(x0 + nx, y0 + ny); ctx.lineTo(x1, y1); ctx.lineTo(x0 - nx, y0 - ny); ctx.closePath(); }, i % 2 ? '#FFF4C8' : '#F2A23A'); }
  inked(ctx, () => star(ctx, x, y, r * (0.42 + 0.12 * e) * (1 - 0.4 * k), big ? 8 : 6, 0.5, a), '#FFFBEA');
  ctx.restore();
}
DRAW.monkPow = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max);
  if (layer === 'ground') { if (f.big) { ctx.save(); ctx.globalAlpha *= 0.5 * (1 - k); dustRing(ctx, f.x, f.y, 14 + 30 * easeOut(k), k); ctx.restore(); } return; }
  pow(ctx, f.x, f.y, f.a, f.r || 16, k, !!f.big);
};
function dustRing(ctx, x, y, r, k) { for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + 0.3, d = r * (0.85 + 0.2 * hash(i, 7)); ctx.fillStyle = '#E9DDC2'; ctx.beginPath(); ctx.arc(x + Math.cos(b) * d, y + Math.sin(b) * d, 5 * (1 - k) + 1.5, 0, TAU); ctx.fill(); } }
// his plain blows (fxkit.js SLASH_OWN.palm): a pow where the fist lands; the third of a run a big one, with the Spun's
// gold spiral flung off it
SLASH_OWN.palm = (ctx, m, k, x, y) => {
  const u = m.u; if (!u || u.kind !== 'monk') return false;
  if (m.third == null) m.third = !!(u.kit && u.kit.combo && u.kit.combo % 3 === 0 && u.anim && u.anim.big);
  const px = x + Math.cos(m.a) * (m.R - 2), py = y + Math.sin(m.a) * (m.R - 2);
  pow(ctx, px, py, m.a, m.third ? 30 : 15, k01(k * (m.third ? 0.75 : 1)), m.third);
  if (m.third && k > 0.15) { ctx.save(); ctx.globalAlpha *= 1 - k; inkLine(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 18; i++) { const q = i / 18, b = m.a + q * 5 + k * 6, d = 4 + q * 14; const sx = px + Math.cos(m.a) * 22 * k + Math.cos(b) * d, sy = py + Math.sin(m.a) * 22 * k + Math.sin(b) * d; i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); } }, '#F2C14E', 2.6); ctx.restore(); }
  return true;
};
// Palm Strike (round 19: "Hand should turn large and flat. And push forward."): his open hand, grown great and flat,
// fingers together and pointing ahead, slides out from his own hand to the reach of the strike, a wash of force behind it
DRAW.bigPalm = (ctx, f, w, layer) => {
  const u = f.unit; if (!u) return; const k = k01(f.t / f.max), push = easeOut(k01(k / 0.45)), a = f.a;
  const ox = u.x + Math.cos(a) * u.r, oy = u.y + Math.sin(a) * u.r, d = (f.r - u.r - 30) * push, cx = ox + Math.cos(a) * d, cy = oy + Math.sin(a) * d;
  if (layer === 'ground') { lit(ctx, () => glowDisc(ctx, cx, cy, 40, '#FFE7A0', 0.25 * (1 - k))); return; }
  const fade = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4, s = 0.55 + 0.45 * easeOut(k01(k / 0.25));
  ctx.save(); ctx.globalAlpha *= fade;
  lit(ctx, () => { ctx.lineCap = 'round'; for (let i = -1; i <= 1; i++) { const nx = -Math.sin(a) * i * 13, ny = Math.cos(a) * i * 13, L = 20 + 18 * (1 - k); // (the push of air behind it: light, not inked)
    ctx.strokeStyle = 'rgba(255,240,200,' + (0.55 * (1 - k)) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + nx - Math.cos(a) * (26 + L), cy + ny - Math.sin(a) * (26 + L)); ctx.lineTo(cx + nx - Math.cos(a) * 26, cy + ny - Math.sin(a) * 26); ctx.stroke(); } });
  ctx.translate(cx, cy); ctx.rotate(a - Math.PI / 2); ctx.scale(s, s);
  // (in the hand's frame: +y forward; the palm faces the way it pushes, so we see its back from above: flat, broad)
  const skin = '#F2D2B0', shade = '#D9AE8A';
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-17, -24); ctx.lineTo(17, -24); ctx.quadraticCurveTo(21, -8, 20, 6);
    for (let i = 0; i < 4; i++) { const x0 = 20 - i * 10, x1 = x0 - 9.4; ctx.lineTo(x0, 22 + (i === 1 || i === 2 ? 6 : 0)); ctx.quadraticCurveTo((x0 + x1) / 2, 30 + (i === 1 || i === 2 ? 6 : 0), x1, 22 + (i === 1 || i === 2 ? 6 : 0)); }
    ctx.lineTo(-20, 6); ctx.lineTo(-26, -4); ctx.quadraticCurveTo(-31, -10, -27, -14); ctx.lineTo(-19, -10); ctx.closePath(); }, skin);
  ctx.strokeStyle = shade; ctx.lineWidth = 1.6; for (const x of [10.6, 0.6, -9.4]) { ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, 22); ctx.stroke(); }
  ctx.fillStyle = shade; ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.ellipse(0, -8, 12, 6, 0, 0, TAU); ctx.fill();
  ctx.restore();
  if (k > 0.3 && k < 0.6) lit(ctx, () => glowDisc(ctx, cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, 26, '#FFFFFF', 0.4 * (1 - (k - 0.3) / 0.3)));
};
// Inner Peace stopping a blow (round 19: "Doesnt look like he's blocking"): a curved plate of gold light where it met
// him, facing it, flaring and fading, sparks thrown back the way the blow came
DRAW.peaceBlock = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k01(k / 0.3)), u = f.unit, a = f.a;
  const R = (u ? u.r : 26) + 6 + 4 * e, cx = u ? u.x : f.x, cy = u ? u.y : f.y;
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, 20, '#FFF6C8', 0.55 * (1 - k / 0.2)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  const span = 0.75 + 0.25 * e;
  inked(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, R + 5, a - span, a + span); ctx.arc(cx, cy, R, a + span, a - span, true); ctx.closePath(); }, '#FFE7A0');
  ctx.strokeStyle = '#FFFBEA'; ctx.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { const b = a + i * span * 0.6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); ctx.lineTo(cx + Math.cos(b) * (R + 5), cy + Math.sin(b) * (R + 5)); ctx.stroke(); }
  for (let i = 0; i < 4; i++) { const b = a + (i - 1.5) * 0.45, d = R + 8 + 16 * e; inked(ctx, () => star(ctx, cx + Math.cos(b) * d, cy + Math.sin(b) * d, 3.5 * (1 - k) + 1, 4, 0.35, b), '#FFF4C8'); }
  ctx.restore();
};
// Dazed (Spun's burst, round 19: "Burst effect is dazed"): stars wheeling round over its head, a little spiral
DRAW.dazed = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; } if (!(u.stunT > 0) && f.t > 0.2) ended(f, true);
  const [vx, vy] = upVec(), up = u.vr + 12, hx = u.x + vx * up, hy = u.y + vy * up;
  ctx.save(); ctx.globalAlpha *= life(f, 0.1, 0.25);
  inkLine(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 20; i++) { const q = i / 20, b = q * 9 - f.t * 6, d = 2 + q * 9; const x = hx + Math.cos(b) * d, y = hy + Math.sin(b) * d * 0.6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }, '#F2C14E', 2.2);
  for (let i = 0; i < 3; i++) { const b = f.t * 5 + i / 3 * TAU; inked(ctx, () => star(ctx, hx + Math.cos(b) * 18, hy + Math.sin(b) * 7, 4.6, 5, 0.45, b), '#FFE66B'); }
  ctx.restore();
};

// ---------------------------------------------------------------- the Cultist
// Blood Pact (round 19: "Don't like look of status effect"): drops of blood rising slowly off the bound, swaying as they
// go (inked, dark crimson to red), a cut flashing across each as it is bound; the body's own wash is a dark crimson
// (the buff's, render.js). Also Sacrifice III's strength (buff 'sacrificeMight').
function drop(ctx, s, col) { inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -6 * s); ctx.quadraticCurveTo(4.6 * s, 1 * s, 0, 4.4 * s); ctx.quadraticCurveTo(-4.6 * s, 1 * s, 0, -6 * s); }, col); ctx.fillStyle = '#FF8A7A'; ctx.beginPath(); ctx.arc(-1.3 * s, 0.4 * s, 1.1 * s, 0, TAU); ctx.fill(); }
DRAW.pactOn = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; }
  ended(f, !(u.buffs && u.buffs.some((b) => b.id === (f.buff || 'bloodPact') && b.t > 0)));
  const [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= life(f, 0.15, 0.3);
  for (let i = 0; i < 3; i++) { const ph = (f.t * 0.6 + i / 3) % 1, cyc = Math.floor(f.t * 0.6 + i / 3), side = (hash(cyc, i, u.id) - 0.5) * 1.6, up = u.vr * 0.5 + ph * 30;
    const x = u.x + vx * up - vy * side * u.vr + Math.sin(ph * 7 + i) * 2.5, y = u.y + vy * up + vx * side * u.vr;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); upright(ctx, x, y, () => drop(ctx, 0.95, i % 2 ? '#8A1E28' : '#C8453D')); ctx.restore(); }
  if (f.cut && f.t < 0.3) { const q = f.t / 0.3; ctx.globalAlpha *= 1 - q; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.x - u.vr * 0.8, u.y - u.vr * 0.3); ctx.lineTo(u.x - u.vr * 0.8 + u.vr * 1.6 * easeOut(k01(q * 3)), u.y - u.vr * 0.3 + u.vr * 0.6 * easeOut(k01(q * 3))); }, '#C8453D', 3); }
  ctx.restore();
};
// Ritual Circle's doomed one (round 19): a bone-white skull over its head, a red ring round the skull running down as the
// count does; it pales while the doomed one is outside the circle
DRAW.doomMark = (ctx, f, w, layer) => {
  const e = f.unit; if (layer !== 'air' || !alive2(e)) { if (!alive2(e)) ended(f, true); return; }
  const [vx, vy] = upVec(), up = e.vr + 22, x = e.x + vx * up, y = e.y + vy * up, left = 1 - k01(f.t / f.T), inside = Math.hypot(e.x - f.cx, e.y - f.cy) <= f.cr;
  const pulse = 1 + (inside ? 0.12 * Math.max(0, Math.sin(f.t * (6 + 10 * (1 - left)))) : 0);
  ctx.save(); ctx.globalAlpha *= life(f, 0.15, 0.2) * (inside ? 1 : 0.4);
  upright(ctx, x, y, () => {
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + TAU * left); ctx.stroke();
    ctx.strokeStyle = '#C8453D'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + TAU * left); ctx.stroke();
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -1.5, 7.5, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(4.5, 6); ctx.lineTo(-4.5, 6); ctx.closePath(); }, '#EDE4CD');
    ctx.fillStyle = '#2B2230'; ctx.beginPath(); ctx.arc(-3, -1.5, 2.1, 0, TAU); ctx.arc(3, -1.5, 2.1, 0, TAU); ctx.fill(); ctx.fillRect(-0.7, 2, 1.4, 2.4);
  });
  ctx.restore();
};
