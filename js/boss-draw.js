// Lane B (bosses3): the drawing kit the designed bosses share. A boss body drawn in code has to sit beside the SVG art
// (few big clean shapes, soft gradients, one thick dark outline round the whole figure, matte), so a body is drawn as a
// FIGURE: its shapes are laid down twice, first every shape grown by the outline in ink, then every shape in paint.
// Shapes of one figure therefore share one outline (the union of grown shapes is the grown union: parts.js does the
// same with the SVG parts), however its joints bend. Where two shapes of a figure overlap, a thin dark seam parts them.
//   figure(ctx, { flash, wash, alpha, ol }, (F) => { F.shape(path, fill); F.line(path, color, width); F.detail(fn); })
// Also: gradients (lin, rad), paths (ell, rrect, capsule, poly, ribbon), two-bone arms (ik2), boss effects that live
// for a moment (bfx: pushed by the fight, drawn under or over the units by time, no state of their own).
import { INK, TAU, clamp, OUTLINE } from './util.js';
import { view } from './render.js';
import { inked, upright } from './fx.js';

export const OL = OUTLINE; // a boss's outline in room units: the one outline (round 19, lane outline19; it was 3.6, half again the heroes')
const SEAM = 'rgba(43,34,48,0.5)';

export function figure(ctx, o, body) {
  const F = { ctx, pass: 0, ol: o.ol || OL, flash: !!o.flash, wash: null,
    // a filled shape; fill: a colour, a gradient, or () => either (made only when painting). o.seam: false for no seam.
    shape(path, fill, so) {
      if (F.pass === 0) { ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = F.ol * 2; ctx.lineJoin = 'round'; path(); ctx.fill(); ctx.stroke(); return; }
      if (F.pass === 2) { ctx.fillStyle = F.wash; path(); ctx.fill(); return; }
      if (!(so && so.seam === false)) { ctx.strokeStyle = SEAM; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; path(); ctx.stroke(); }
      ctx.fillStyle = typeof fill === 'function' ? fill() : fill; path(); ctx.fill();
      // struck: a white wash over the shape for a frame (a big body gone solid white every blow was too much)
      if (F.flash || (so && so.flash)) { ctx.save(); ctx.globalAlpha *= 0.6; ctx.fillStyle = '#FFFFFF'; path(); ctx.fill(); ctx.restore(); }
    },
    // a stroked line as a solid thing (a rod, a chain link's bar)
    line(path, color, width, cap = 'round') {
      ctx.lineCap = cap; ctx.lineJoin = 'round';
      if (F.pass === 0) { ctx.strokeStyle = INK; ctx.lineWidth = width + F.ol * 2; path(); ctx.stroke(); return; }
      if (F.pass === 2) { ctx.strokeStyle = F.wash; ctx.lineWidth = width; path(); ctx.stroke(); return; }
      ctx.strokeStyle = SEAM; ctx.lineWidth = width + 2.4; path(); ctx.stroke();
      ctx.strokeStyle = typeof color === 'function' ? color() : color; ctx.lineWidth = width; path(); ctx.stroke();
    },
    // paint that sits on the shapes (highlights, rivets, glows): only in the paint pass
    detail(fn) { if (F.pass === 1) fn(); },
    // in a frame of its own: at (x, y), turned by a, scaled by s
    at(x, y, a, fn, s) { ctx.save(); ctx.translate(x, y); if (a) ctx.rotate(a); if (s && s !== 1) ctx.scale(s, s); fn(); ctx.restore(); },
  };
  ctx.save();
  if (o.alpha != null && o.alpha < 1) ctx.globalAlpha *= o.alpha;
  F.pass = 0; body(F);
  F.pass = 1; body(F);
  for (const [col, a] of o.wash || []) { F.pass = 2; F.wash = col; ctx.save(); ctx.globalAlpha *= a; body(F); ctx.restore(); }
  ctx.restore();
}
// Status washes over a code-drawn boss, as render.js washesOf gives the sprites: [colour, strength] pairs.
export function washOf(u, w) {
  const st = u.st || {}, out = [], q = (v) => clamp((v || 0) / 100, 0, 1);
  if (u.frozenT > 0 || q(st.chill) > 0.05) out.push(['#9FDDF6', u.frozenT > 0 ? 0.55 : 0.2 + 0.3 * q(st.chill)]);
  if (q(st.poison) > 0.05) out.push(['#9BCB3C', 0.16 + 0.28 * q(st.poison)]);
  if (q(st.burn) > 0.05) out.push(['#FF7A2F', (0.1 + 0.18 * q(st.burn)) * (0.7 + 0.3 * Math.sin(w.time * 25 + u.id))]);
  if (u.radiantT > 0 || q(st.radiance) > 0.03) out.push(['#FFF1B0', 0.12 + 0.3 * (u.radiantT > 0 ? 1 : q(st.radiance))]);
  if (u.hexed || q(st.curse) > 0.03) out.push(['#5A2A80', 0.12 + 0.26 * (u.hexed ? 1 : q(st.curse))]);
  if (q(st.wet) > 0.05) out.push(['#3F8FD8', 0.08 + 0.18 * q(st.wet)]);
  if (q(st.shock) > 0.05 && Math.sin(w.time * 31 + u.id * 3) > 0.55) out.push(['#FFF3A0', 0.3 + 0.35 * q(st.shock)]);
  for (const o of out) o[1] *= 0.6; // a boss is a lot of sprite: the same wash would drown it
  return out;
}
export const flashing = (u) => !!u && u.flashT > 0.085; // (only the first frame of a hit: a boss hit all the time read as solid white)

// ---------------------------------------------------------------- paint
export function lin(ctx, x0, y0, x1, y1, ...cols) { const g = ctx.createLinearGradient(x0, y0, x1, y1); cols.forEach((c, i) => g.addColorStop(cols.length > 1 ? i / (cols.length - 1) : 0, c)); return g; }
export function rad(ctx, x, y, r0, r1, ...cols) { const g = ctx.createRadialGradient(x, y, r0, x, y, Math.max(r0 + 0.01, r1)); cols.forEach((c, i) => g.addColorStop(cols.length > 1 ? i / (cols.length - 1) : 0, c)); return g; }
// a round thing lit from its upper left: light, main, dark
export const ballFill = (ctx, x, y, r, light, main, dark) => () => { const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.15); g.addColorStop(0, light); g.addColorStop(0.5, main); g.addColorStop(1, dark); return g; };
// the matte gloss the art carries: a soft pale oval
export function gloss(ctx, x, y, rx, ry, rot = -0.5, a = 0.3, col = '255,255,255') { ctx.save(); ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); ctx.restore(); }
export function rgbaOf(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
export function glow(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgbaOf(color, a)); g.addColorStop(0.5, rgbaOf(color, a * 0.45)); g.addColorStop(1, rgbaOf(color, 0));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
}
// a soft dark patch on the floor (a hole's mouth, a shadow under something lifted)
export function shade(ctx, x, y, rx, ry, a = 0.3, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx); g.addColorStop(0, `rgba(43,34,48,${a})`); g.addColorStop(0.65, `rgba(43,34,48,${a * 0.8})`); g.addColorStop(1, 'rgba(43,34,48,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------------- paths (each begins its own path)
export const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
export const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); };
export function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); else ctx.rect(x, y, w, h); }
export function poly(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
// a closed curve through points (a soft blob through its corners)
export function soft(ctx, pts) {
  const n = pts.length; ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if (!i) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(a[0], a[1], mx, my); }
  const a = pts[0], b = pts[1 % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); ctx.closePath();
}
// two circles and the skin between them (an arm segment, a neck, a tail joint)
export function capsule(ctx, x1, y1, r1, x2, y2, r2) {
  const d = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  if (d < Math.abs(r1 - r2) + 0.01) { ctx.arc(r1 > r2 ? x1 : x2, r1 > r2 ? y1 : y2, Math.max(r1, r2), 0, TAU); return; }
  const b = Math.acos(clamp((r1 - r2) / d, -1, 1));
  ctx.arc(x1, y1, r1, a + b, a - b + TAU); ctx.arc(x2, y2, r2, a - b, a + b); ctx.closePath();
}
// a body along a spine: pts [{x, y}], its half-width at each by rOf(i); round at both ends
export function ribbon(ctx, pts, rOf) {
  const n = pts.length; if (n < 2) return ctx.beginPath();
  const L = [], R = [];
  for (let i = 0; i < n; i++) { const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(n - 1, i + 1)], a = Math.atan2(q1.y - q0.y, q1.x - q0.x), r = rOf(i);
    L.push([p.x - Math.sin(a) * r, p.y + Math.cos(a) * r]); R.push([p.x + Math.sin(a) * r, p.y - Math.cos(a) * r]); }
  ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
  const e = pts[n - 1], ea = Math.atan2(e.y - pts[n - 2].y, e.x - pts[n - 2].x); ctx.arc(e.x, e.y, Math.max(0.1, rOf(n - 1)), ea + Math.PI / 2, ea - Math.PI / 2, true);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  const s = pts[0], sa = Math.atan2(pts[1].y - s.y, pts[1].x - s.x); ctx.arc(s.x, s.y, Math.max(0.1, rOf(0)), sa - Math.PI / 2, sa + Math.PI / 2, true);
  ctx.closePath();
}
// a toothed wheel
export function gear(ctx, x, y, r, teeth, depth = 0.16, rot = 0) {
  ctx.beginPath(); const n = teeth * 4;
  for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, rr = (i % 4 < 2) ? r : r * (1 - depth); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath();
}

// ---------------------------------------------------------------- joints
// A two-bone arm from the shoulder (sx, sy) to the hand (hx, hy), bones l1 and l2, bending to side `bend` (+1 / -1).
// Past its reach it telescopes: ext is how much further the hand is than the bones go (the fight draws piston rods).
export function ik2(sx, sy, hx, hy, l1, l2, bend = 1) {
  const dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 0.001, a = Math.atan2(dy, dx);
  const reach = l1 + l2, ext = Math.max(0, d - reach * 0.985), k = ext > 0 ? d / (reach * 0.985) : 1, L1 = l1 * k, L2 = l2 * k;
  const dd = clamp(d, Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.01);
  const c = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, L1 * L1 - c * c));
  return { ex: sx + Math.cos(a) * c - Math.sin(a) * h * bend, ey: sy + Math.sin(a) * c + Math.cos(a) * h * bend, ext, k };
}
export const up = () => (view.rot ? [1, 0] : [0, -1]);
export const upRot = () => (view.rot ? Math.PI / 2 : 0);

// ---------------------------------------------------------------- effects that live for a moment
// The fight pushes one with bfx(w, { type, max, ... }) (boss-kit.js); a drawer per type is registered here by the
// boss's own art file: BFX[type] = { ground?(ctx, f, k, w), air?(ctx, f, k, w) }, k = 0..1 through its life.
export const BFX = {};
export function drawBfx(ctx, w, layer) {
  const L = w.bfx; if (!L || !L.length) return;
  for (const f of L) { const d = BFX[f.type]; if (!d || !d[layer]) continue; const k = (w.time - f.t0) / f.max; if (k < 0 || k >= 1) continue; ctx.save(); d[layer](ctx, f, k, w); ctx.restore(); }
  if (layer === 'air' && L.length > 40) w.bfx = L.filter((f) => w.time - f.t0 < f.max);
}
export const easeOut = (k) => 1 - (1 - k) * (1 - k) * (1 - k);
export const easeIn = (k) => k * k;
export const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
export const k01 = (k) => clamp(k, 0, 1);
export function hash(a, b = 0, c = 0) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

// ---------------------------------------------------------------- carriers, as fxkit.js draws the heroes' (kept the same shapes)
// A crescent band from angle aT (its pointed tail) to aH (its head), outer radius R, thickest (th) at the head.
function bandPath(ctx, cx, cy, R, aT, aH, th, pointed) {
  const span = aH - aT, n = Math.max(6, Math.ceil(Math.abs(span) * 9)), dir = span >= 0 ? 1 : -1;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = aT + span * i / n; ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
  const rm = R - th / 2;
  if (pointed) { const b = aH + dir * Math.min(0.22, th / R * 0.9); ctx.lineTo(cx + Math.cos(b) * (R - th * 0.35), cy + Math.sin(b) * (R - th * 0.35)); }
  else ctx.arc(cx + Math.cos(aH) * rm, cy + Math.sin(aH) * rm, th / 2, aH, aH + Math.PI * dir, dir < 0);
  for (let i = n; i >= 0; i--) { const s = i / n, a = aT + span * s; const r = R - th * Math.pow(s, 0.85); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  ctx.closePath();
}
export function slashBand(ctx, cx, cy, R, aT, aH, th, main, core, pointed = false) {
  if (Math.abs(aH - aT) < 0.02 || th < 0.6) return;
  inked(ctx, () => bandPath(ctx, cx, cy, R, aT, aH, th, pointed), main);
  ctx.fillStyle = core; bandPath(ctx, cx, cy, R - th * 0.1, aT + (aH - aT) * 0.3, aH, th * 0.36, pointed); ctx.fill();
}
function streakPath(ctx, x, y, a, r0, r1, wd) {
  const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c, L = r1 - r0;
  const bx = x + c * r0, by = y + s * r0, tx = x + c * r1, ty = y + s * r1, mx = x + c * (r0 + L * 0.72), my = y + s * (r0 + L * 0.72);
  ctx.beginPath(); ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(mx + nx * wd * 1.25, my + ny * wd * 1.25, tx, ty);
  ctx.quadraticCurveTo(mx - nx * wd * 1.25, my - ny * wd * 1.25, bx, by); ctx.closePath();
}
export function streak(ctx, x, y, a, r0, r1, wd, main, core) {
  if (r1 - r0 < 1) return;
  inked(ctx, () => streakPath(ctx, x, y, a, r0, r1, wd), main);
  if (core) { ctx.fillStyle = core; streakPath(ctx, x, y, a, r0 + (r1 - r0) * 0.35, r1 - 1, wd * 0.38); ctx.fill(); }
}
// a thing standing up out of the floor leans up the screen
export function spike(ctx, x, y, h, wd, col, hi) {
  upright(ctx, x, y, () => {
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-wd, 0); ctx.lineTo(0, -h); ctx.lineTo(wd, 0); ctx.quadraticCurveTo(0, wd * 0.6, -wd, 0); ctx.closePath(); }, col);
    if (hi) { ctx.fillStyle = hi; ctx.beginPath(); ctx.moveTo(-wd * 0.7, -1); ctx.lineTo(0, -h + 2); ctx.lineTo(-wd * 0.05, -1); ctx.closePath(); ctx.fill(); }
  });
}
export function inkDisc(ctx, x, y, r, col) { inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); }, col); }
