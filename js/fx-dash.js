// Round 18 (lane dash18): how the dashes (js/dashes.js) look, in the one effects style (docs/FX-STYLE.md): solid things
// inked, light additive and never outlined, ground effects soft-edged and under the units, nothing that matters thinner
// than 3 units, hashed noise, no blur. It adds its looks to fx2.js's table ('k2' fx by `draw` name).
//   dashRibbon  the slash: the band the blade's point really swept (dashes.js records the blade every step of the way)
//   dashSettle  the tell at the feet: dust drawn in, a glint on the weapon, a scrape for the heavy, nothing for a beast
//   dashKick    the push off: a fan of dust thrown back
//   dashMark    the draw cut's promise on a foe: a thin white line across it, then the cut opening along it
//   dashHit     a cut landing now: a short thick streak through the body and a flash
//   dashPop     where a blink left from
//   dashArc     the hook's banked path on the floor
//   dashFurrow  the charge's two scuffed lines
//   dashFling   the heave at the end of a charge (a slam if there was a wall)
//   dashClaws   the pounce's rake: three long claw lines dragged back through the one landed on
//   dashLand    the landing: a low ring of dust
import { TAU, clamp } from './util.js';
import { inked, glowDisc, star, hash, easeOut } from './fx.js';
import { DRAW2 } from './fx2.js';
import { dustPuffs } from './fxkit.js';

const k01 = (v) => clamp(v, 0, 1);
const sm = (k) => k * k * (3 - 2 * k);
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
// a pointed streak from (x, y) along a: base at r0, point at r1, wd wide at its fattest (as fxkit's)
function streakPath(ctx, x, y, a, r0, r1, wd) {
  const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c, L = r1 - r0;
  const bx = x + c * r0, by = y + s * r0, tx = x + c * r1, ty = y + s * r1, mx = x + c * (r0 + L * 0.72), my = y + s * (r0 + L * 0.72);
  ctx.beginPath(); ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(mx + nx * wd * 1.25, my + ny * wd * 1.25, tx, ty);
  ctx.quadraticCurveTo(mx - nx * wd * 1.25, my - ny * wd * 1.25, bx, by); ctx.closePath();
}
function streak(ctx, x, y, a, r0, r1, wd, main, core) {
  if (r1 - r0 < 1) return;
  inked(ctx, () => streakPath(ctx, x, y, a, r0, r1, wd), main);
  ctx.fillStyle = core; streakPath(ctx, x, y, a, r0 + (r1 - r0) * 0.35, r1 - 1, wd * 0.38); ctx.fill();
}
// a streak pointed at both ends (a cut across a body), middle at (x, y)
function lens(ctx, x, y, a, L, wd, main, core) {
  if (L < 2) return; const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c;
  const path = (l, wv) => { ctx.beginPath(); ctx.moveTo(x - c * l, y - s * l); ctx.quadraticCurveTo(x + nx * wv, y + ny * wv, x + c * l, y + s * l); ctx.quadraticCurveTo(x - nx * wv, y - ny * wv, x - c * l, y - s * l); ctx.closePath(); };
  inked(ctx, () => path(L / 2, wd), main); ctx.fillStyle = core; path(L / 2 * 0.8, wd * 0.36); ctx.fill();
}
const dustDisc = (ctx, x, y, r, a, col = '#E9DDC2') => { if (a <= 0.01 || r < 0.5) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); };

DRAW2.none = () => {};

// ---------------------------------------------------------------- the slash
// f.rib: { pts: [{ x0, y0 (the blade's root), x1, y1 (its point), t }], rel (when it was let go, or null), hold }
// The band's outer edge is the path of the point; it is thickest at the newest end and tapers to nothing at the oldest.
// Once let go, the tail runs up the band to the head over f.life.
DRAW2.dashRibbon = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const R = f.rib, P = R.pts; if (P.length < 2) return;
  const now = w.time, hang = 0.2;
  let i0 = 0;
  if (R.rel != null) { const q = k01((now - R.rel) / f.life); i0 = Math.floor(sm(q) * (P.length - 1)); }
  else if (!R.hold) { while (i0 < P.length - 2 && now - P[i0].t > hang) i0++; }
  const n = P.length - i0; if (n < 2) return;
  const th = f.th * (R.rel != null ? 1 - 0.4 * k01((now - R.rel) / f.life) : 1), [main, core] = f.col;
  const edge = (k, wk) => { // the band between the point's path and a line wk * th inside it, from the tail to the head
    ctx.beginPath();
    for (let i = i0; i < P.length; i++) { const p = P[i]; ctx.lineTo(p.x1, p.y1); }
    for (let i = P.length - 1; i >= i0; i--) { const p = P[i], s = (i - i0) / (n - 1), L = Math.hypot(p.x0 - p.x1, p.y0 - p.y1) || 1, t = Math.min(L * 0.8, th * wk * Math.pow(s, 0.8));
      ctx.lineTo(p.x1 + (p.x0 - p.x1) / L * t, p.y1 + (p.y0 - p.y1) / L * t); }
    ctx.closePath(); };
  ctx.save(); if (R.rel != null) ctx.globalAlpha *= 1 - 0.5 * k01((now - R.rel) / f.life);
  inked(ctx, () => edge(0, 1), main);
  ctx.fillStyle = core; edge(0, 0.42); ctx.fill();
  ctx.restore();
  // a glint riding the newest point while it is still cutting
  if (R.rel == null && !R.hold) { const p = P[P.length - 1]; lit(ctx, () => glowDisc(ctx, p.x1, p.y1, 13, '#FFFFFF', 0.55)); }
};

// ---------------------------------------------------------------- the tell
DRAW2.dashSettle = (ctx, f, w, layer) => {
  const u = f.unit; if (!u) return; const k = k01(f.t / f.max), [main, core] = f.col || ['#DCE3EC', '#FFFFFF'];
  if (layer === 'ground') {
    // dust drawn in to the feet from behind, quicker as it comes to the end
    const n = f.heavy ? 7 : 5, back = f.a + Math.PI;
    ctx.save(); ctx.globalAlpha *= 0.75 * Math.min(1, k * 4);
    for (let i = 0; i < n; i++) { const ph = (k * (f.heavy ? 2.2 : 1.6) + hash(i, 7, Math.round(f.max * 100))) % 1, b = back + (i - (n - 1) / 2) * (f.beast ? 0.5 : 0.36), d = u.vr * (f.heavy ? 0.9 : 0.7) + (f.heavy ? ph : 1 - ph) * (f.heavy ? 46 : 34);
      dustDisc(ctx, u.x + Math.cos(b) * d, u.y + Math.sin(b) * d, (f.heavy ? 7 : 4.5) * Math.sin(ph * Math.PI) + 1.5, Math.sin(ph * Math.PI) * 0.8, f.dark ? '#5A4A7A' : '#E9DDC2'); }
    ctx.restore();
    return;
  }
  if (f.beast || f.heavy || f.bare) return;
  // light gathering on the weapon: at the hip for a blade (the side it is drawn from), at the point for a spear
  const sd = f.side || 1, q = sm(k);
  const gx = f.lance ? u.x + Math.cos(f.a) * (u.r + 20) : u.x + Math.cos(f.a + 2.2 * sd) * u.vr * 0.75, gy = f.lance ? u.y + Math.sin(f.a) * (u.r + 20) : u.y + Math.sin(f.a + 2.2 * sd) * u.vr * 0.75;
  if (f.dark) { ctx.save(); ctx.globalAlpha *= 0.8 * q; for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + f.t * 5; inked(ctx, () => { ctx.beginPath(); ctx.arc(u.x + Math.cos(b) * u.vr * (1.2 - 0.5 * q), u.y + Math.sin(b) * u.vr * (1.2 - 0.5 * q), 3.4, 0, TAU); }, main); } ctx.restore(); return; }
  lit(ctx, () => glowDisc(ctx, gx, gy, 10 + 12 * q, core, 0.25 + 0.4 * q));
  if (k > 0.55) { const s = (k - 0.55) / 0.45; ctx.save(); ctx.globalAlpha *= Math.sin(s * Math.PI); inked(ctx, () => star(ctx, gx, gy, 5 + 9 * s, 4, 0.18, f.t * 3), core); ctx.restore(); }
};
// the push off: a fan of dust thrown back along the floor, and a low puff
DRAW2.dashKick = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const k = k01(f.t / f.max), e = easeOut(k), back = f.a + Math.PI, s = f.big ? 1.5 : 1;
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = -2; i <= 2; i++) { const b = back + i * 0.34, d0 = 8 + 26 * e * s, L = (30 - Math.abs(i) * 6) * s * (1 - 0.5 * k);
    ctx.fillStyle = '#E9DDC2'; streakPath(ctx, f.x + Math.cos(b) * d0, f.y + Math.sin(b) * d0, b, 0, L, 3.4 * s); ctx.fill(); }
  ctx.restore();
  dustPuffs(ctx, f.x, f.y, 18 * s, k, Math.round(f.x * 3 + f.y), 5);
};

// ---------------------------------------------------------------- cuts on a body
// The draw cut's mark: a thin bright line across the foe that trembles; at f.at it opens into the cut.
DRAW2.dashMark = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const e = f.unit, x = e ? e.x : f.x, y = e ? e.y : f.y, r = f.r || 22, [main, core] = f.col || ['#DCE3EC', '#FFFFFF'];
  if (f.t < f.at) {
    const q = k01(f.t / 0.08), sh = (hash(Math.floor(f.t * 50), 3) - 0.5) * 1.6;
    if (f.lance) { ctx.save(); ctx.globalAlpha *= q; inked(ctx, () => star(ctx, x + sh, y, 4.5, 4, 0.3, 0.6), core); ctx.restore(); return; }
    const L = r * 2.5 * q, nx = -Math.sin(f.a) * sh, ny = Math.cos(f.a) * sh;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 5.2; ctx.beginPath(); ctx.moveTo(x + nx - Math.cos(f.a) * L / 2, y + ny - Math.sin(f.a) * L / 2); ctx.lineTo(x + nx + Math.cos(f.a) * L / 2, y + ny + Math.sin(f.a) * L / 2); ctx.stroke();
    ctx.strokeStyle = core; ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore();
    // a glint running down the line as the moment comes
    const g = k01(f.t / f.at); lit(ctx, () => glowDisc(ctx, x + Math.cos(f.a) * L * (g - 0.5), y + Math.sin(f.a) * L * (g - 0.5), 8, '#FFFFFF', 0.7));
    return;
  }
  const k = k01((f.t - f.at) / (f.max - f.at)), e2 = easeOut(k01(k / 0.3));
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, x, y, r * 1.7, '#FFFFFF', 0.7 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  if (f.lance) { inked(ctx, () => star(ctx, x, y, (10 + 12 * e2) * (1 - 0.5 * k), 6, 0.3, 0.3), core); streak(ctx, x, y, f.a, -r * 0.4, r * (1.2 + 1.4 * e2), 7 * (1 - k), main, core); }
  else {
    lens(ctx, x, y, f.a, r * (2.6 + 1.6 * e2), (11 - 9 * k) * (0.6 + 0.4 * e2), main, core);
    for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, b = f.a + sd * (Math.PI / 2 + (hash(i, 5) - 0.5) * 0.9), d = r * 0.3 + r * 1.1 * e2; streak(ctx, x + Math.cos(f.a) * (i - 2.5) * r * 0.3, y + Math.sin(f.a) * (i - 2.5) * r * 0.3, b, d * 0.5, d + 10 * (1 - k), 2.6, core, '#FFFFFF'); }
  }
  ctx.restore();
};
// A cut landing now: a short thick streak through the body the way the blade went, a flash, chips.
DRAW2.dashHit = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k01(k / 0.35)), r = f.r || 22, [main, core] = f.col || ['#DCE3EC', '#FFFFFF'], s = f.big ? 1.3 : 1;
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, r * 1.4 * s, '#FFFFFF', 0.6 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  if (f.thud) inked(ctx, () => star(ctx, f.x, f.y, (12 + 10 * e) * (1 - 0.4 * k), 8, 0.55, 0.2), core);
  else lens(ctx, f.x, f.y, f.a, r * (1.8 + 1.5 * e) * s, (9 - 7 * k) * s, main, core);
  for (let i = 0; i < 4; i++) { const b = f.a + (i % 2 ? 1 : -1) * (0.5 + hash(i, Math.round(f.x)) * 0.8), d = r * 0.5 + r * 0.9 * e; streak(ctx, f.x, f.y, b, d * 0.6, d + 8 * (1 - k), 2.4, core, '#FFFFFF'); }
  ctx.restore();
};
// Where a blink left from: a ring of ink beads closing in and a line where the body stood.
DRAW2.dashPop = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + 0.4, d = 20 * (1 - e) + 4; inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 3.2 * (1 - k) + 1, 0, TAU); }, f.col || '#6E5E8E'); }
  ctx.restore();
};

// ---------------------------------------------------------------- on the floor
// The hook's path: a soft line of dust where the body ran, wider where it banked hardest.
DRAW2.dashArc = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const u = f.unit;
  if (u && u.act && u.act.dv && u.act.dv.lines && (!f.pts.length || Math.hypot(u.x - f.pts[f.pts.length - 1].x, u.y - f.pts[f.pts.length - 1].y) > 7)) f.pts.push({ x: u.x, y: u.y, t: f.t });
  for (let i = 0; i < f.pts.length; i++) { const p = f.pts[i], a = k01(1 - (f.t - p.t) / 0.45); if (a > 0.02) dustDisc(ctx, p.x, p.y, 5 + 5 * Math.sin(i / Math.max(1, f.pts.length - 1) * Math.PI), a * 0.55); }
};
// The charge's two scuffed lines from where it set off to where it is.
DRAW2.dashFurrow = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const u = f.unit; if (u && u.act && u.act.dv && u.act.dv.lines) { f.ex = u.x; f.ey = u.y; }
  if (f.ex == null) return; const L = Math.hypot(f.ex - f.x0, f.ey - f.y0), a = f.a, k = k01((f.t - (f.max - 0.7)) / 0.7);
  ctx.save(); ctx.globalAlpha *= 0.5 * (1 - k); ctx.fillStyle = '#E9DDC2';
  for (const sd of [-1, 1]) { const ox = -Math.sin(a) * sd * 11, oy = Math.cos(a) * sd * 11; streakPath(ctx, f.x0 + ox, f.y0 + oy, a, 0, L, 4.5); ctx.fill(); }
  ctx.restore();
};
// The heave: two crescents of force thrown off the front, one behind the other; a slam adds a burst where the wall is.
DRAW2.dashFling = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [main, core] = f.col || ['#DCE3EC', '#FFFFFF'];
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let j = 0; j < 2; j++) { const q = k01(e - j * 0.22); if (q <= 0) continue; const d = f.r * (0.2 + 1.5 * q), R = f.r * (0.9 + 0.5 * q), cx = f.x + Math.cos(f.a) * (d - R), cy = f.y + Math.sin(f.a) * (d - R), half = 0.75 - 0.2 * q, th = (11 - 5 * j) * (1 - 0.6 * k);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, R, f.a - half, f.a + half); ctx.arc(cx - Math.cos(f.a) * th * 0.9, cy - Math.sin(f.a) * th * 0.9, R, f.a + half, f.a - half, true); ctx.closePath(); }, j ? main : core); }
  if (f.slam) inked(ctx, () => star(ctx, f.x + Math.cos(f.a) * f.r * 1.3, f.y + Math.sin(f.a) * f.r * 1.3, (16 + 14 * e) * (1 - 0.5 * k), 8, 0.5, 0.3), '#FFFFFF');
  ctx.restore();
};
// The landing: a low ring of dust thrown out, flatter ahead of it.
DRAW2.dashLand = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const k = k01(f.t / f.max), e = easeOut(k);
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.3, d = f.r * (0.5 + 0.9 * e) * (1 + 0.3 * Math.cos(b - f.a)); dustDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 7 * (1 - 0.6 * k), 0.7, f.col || '#E9DDC2'); }
  ctx.restore();
};
// The rake: three long claw lines dragged back through the one landed on, one after another, each a pointed streak.
DRAW2.dashClaws = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), r = f.r || 20, [main, core] = f.col || ['#FFCDBD', '#FFF6F2'], back = f.a + Math.PI;
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, r * 1.5, '#FFFFFF', 0.5 * (1 - k / 0.2)));
  ctx.save(); ctx.globalAlpha *= k01((1 - k) / 0.45);
  for (let i = -1; i <= 1; i++) { const g = easeOut(k01((k - (i + 1) * 0.07) / 0.3)); if (g <= 0.03) continue;
    const off = i * r * 0.62, b = back + i * 0.1, L = r * 3.1, ox = f.x - Math.sin(f.a) * off + Math.cos(f.a) * r * 1.4, oy = f.y + Math.cos(f.a) * off + Math.sin(f.a) * r * 1.4;
    streak(ctx, ox, oy, b, L * g * 0.25 * k, L * g, 5.2 * (1 - 0.3 * k), main, core); }
  ctx.restore();
};
