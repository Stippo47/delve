// Ground bodies (round 9, lane V): oil, burning ground, gas, poison clouds, water, mist, webs, smoke, rime. The
// designer (round 9): "when 2 bodies overlap with each other they should merge into 1 body, they can't be fixed
// sprites. The dark parts of oil will merge with dark parts and the lighter will merge after with each other, then the
// outline will go around everything."
//
// So nothing here draws a puddle on its own. drawPuddle() only queues a body; flushPuddles() then paints every body of
// one kind into an offscreen layer, a pass at a time and in the same pass order for every body: the outline (every
// body grown by the ink), then the dark tone of every body, then the light tone of every body, then highlights. Where
// bodies overlap, the outline of one is covered by the dark of the other, the darks join, the lights join: one body
// with one outline round the lot. The layer goes onto the floor once per kind (only the part the bodies cover), and the
// solid things standing in it (flames, bubbles, threads) are drawn on top, inked like everything else.
//
// Seven styles to pick from in the settings (?puddle=1..7 for testing):
//   1 Inked       cartoon bodies with the ink outline, a light middle, a gloss
//   2 Soft        no outline: soft see-through pools that melt into each other and the floor
//   3 Bands       hard toon bands, dark edge to a light middle, no outline
//   4 Splat       ragged splats with droplets round them, the dark tone as the rim
//   5 Rimmed      ink outline, a bright rim just inside it, a dark middle: wet and glossy
//   6 Pixel       chunky low-resolution bodies, hard pixel edges, like an old game
//   7 Silhouette  one flat colour and a thin outline, nothing else: the quietest
import { INK, TAU, clamp } from './util.js';
import { OUTLINE, view } from './render.js';
import { hash, rgba, upright, upVec, inked, flame, glowDisc } from './fx.js';

export const PUDDLE_STYLES = [
  { id: 1, name: 'Inked', blurb: 'Cartoon bodies with the ink outline, a light middle and a gloss.' },
  { id: 2, name: 'Soft', blurb: 'No outline: soft see-through pools that melt into each other.' },
  { id: 3, name: 'Bands', blurb: 'Hard toon bands from a dark edge to a light middle.' },
  { id: 4, name: 'Splat', blurb: 'Ragged splats with droplets round them.' },
  { id: 5, name: 'Rimmed', blurb: 'An ink outline with a bright rim inside it and a dark middle.' },
  { id: 6, name: 'Pixel', blurb: 'Chunky low-resolution bodies with hard pixel edges.' },
  { id: 7, name: 'Silhouette', blurb: 'One flat colour and a thin outline.' },
];
const N_STYLES = PUDDLE_STYLES.length;
const KEY = 'delve.puddle';
let cur = 0;
export function puddleStyle() {
  if (cur) return cur;
  let n = 0;
  try { n = +new URLSearchParams(location.search).get('puddle'); } catch {}
  if (!(n >= 1 && n <= N_STYLES)) { try { n = +localStorage.getItem(KEY); } catch {} }
  return (cur = n >= 1 && n <= N_STYLES ? Math.round(n) : 1);
}
export function setPuddleStyle(n) { cur = clamp(Math.round(+n) || 1, 1, N_STYLES); try { localStorage.setItem(KEY, String(cur)); } catch {} return cur; }

// dark, main, light, gloss
const COL = {
  oil: ['#1E1917', '#352C28', '#54473F', '#E9E1D6'],
  fire: ['#A8301A', '#E8582A', '#FF9A3D', '#FFD27A'],
  gas: ['#4E7A22', '#82B23A', '#BCE070', '#E6F7B0'],
  water: ['#2F7FB8', '#5DB7E0', '#A8DDF4', '#F2FBFF'],
  mist: ['#8496B4', '#AFC0DA', '#DDE8F6', '#FFFFFF'],
  web: ['#A99FBF', '#DCD5EA', '#F4F0FA', '#FFFFFF'],
  smoke: ['#2E2440', '#4A3D63', '#6E5E8E', '#B8A8D8'],
  frost: ['#6FAFD4', '#BFE3F4', '#EAF8FF', '#FFFFFF'],
  earth: ['#3E3024', '#5A4634', '#7A6450', '#A8927A'],
};
export const PUDDLE_TYPES = ['oil', 'fire', 'gas', 'water', 'mist', 'web', 'smoke', 'frost'];
export const PUDDLE_COL = COL;
const ORDER = ['earth', 'oil', 'water', 'frost', 'web', 'fire', 'gas', 'mist', 'smoke'];
const CLOUD = { gas: 1, mist: 1, smoke: 1 };
const LAYER_A = { gas: 0.82, mist: 0.7, smoke: 0.88, web: 0.55, frost: 0.8, earth: 0.55 };

// ---------------------------------------------------------------- the queue
const Q = [];
// Queue one body. a: how present it is (0..1): a fading body shrinks rather than going see-through, so where it
// overlaps another the two stay one body to the end.
export function drawPuddle(ctx, type, x, y, r, T, a = 1, seed = 0) {
  if (!COL[type] || r < 1 || a <= 0.01) return;
  Q.push({ type, x, y, r, T, a: clamp(a, 0, 1), seed: seed || Math.round(x * 7 + y * 13) });
}

// a ragged splat outline: radius jumps by vertex, smoothed with quadratic curves
function splatPath(g, x, y, r, seed, n = 14, rough = 0.28) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (1 - rough / 2 + rough * hash(seed, i)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.92]); }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let m = mid(pts[n - 1], pts[0]); g.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; m = mid(p, q); g.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  g.closePath();
}
function blobPath(g, x, y, r, n, ph) {
  for (let i = 0; i <= n * 2; i++) {
    const a = i / (n * 2) * TAU, rr = r * (1 + 0.08 * Math.sin(a * 3 + ph) + 0.04 * Math.sin(a * 5 - ph * 0.7));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.9;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
}
// a cloud's lumps (gas, mist, smoke): they drift round its middle
function lumps(b) {
  if (b._l) return b._l;
  const { x, y, r, T, seed, type } = b, n = 6, spin = T * (type === 'gas' ? 0.5 : type === 'smoke' ? 0.35 : 0.25);
  const out = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU + spin + seed, d = r * (0.4 + 0.08 * Math.sin(T * 0.9 + i)); out.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, r * (0.5 + 0.06 * Math.sin(T * 1.3 + i * 2))]); }
  out.push([x, y, r * 0.58]);
  return (b._l = out);
}
// The body's outline path, grown by `grow` (world units) and scaled by `k` (1 = the whole body).
function bodyPath(g, b, k, grow, st, dx = 0, dy = 0) {
  const R = b.R * k + grow, x = b.x + dx * b.R, y = b.y + dy * b.R;
  if (CLOUD[b.type]) { for (const [lx, ly, lr] of lumps(b)) { const cx = b.x + (lx - b.x) * k + dx * b.R, cy = b.y + (ly - b.y) * k + dy * b.R; g.moveTo(cx + lr * k + grow, cy); g.arc(cx, cy, Math.max(0.5, lr * k + grow), 0, TAU); } return; }
  const breathe = b.type === 'fire' ? 1 + Math.sin(b.T * 10 + b.x) * 0.03 : 1;
  if (st === 4) splatPath(g, x, y, R * breathe, b.seed + (k < 0.95 ? 5 : 0), 14, k < 0.95 ? 0.22 : 0.28);
  else blobPath(g, x, y, R * breathe, 8, b.seed + (k < 0.95 ? 2 : 0) + (b.type === 'fire' ? b.T * 2 : 0));
}

// ---------------------------------------------------------------- the layer
const LY = { c: null };
function layer(w, h) {
  if (!LY.c) LY.c = document.createElement('canvas');
  if (LY.c.width !== w || LY.c.height !== h) { LY.c.width = w; LY.c.height = h; }
  return LY.c;
}
// Draw every queued body. tf: the world's canvas transform (render.js), so the layer lines up with the floor.
export function flushPuddles(ctx, tf) {
  if (!Q.length) return;
  const st = puddleStyle(), cv = ctx.canvas;
  const h = st === 6 ? 0.13 : st === 2 ? 0.5 : 1; // the pixel style draws its layer at about an eighth of the size
  const lw = Math.max(1, Math.ceil(cv.width * h)), lh = Math.max(1, Math.ceil(cv.height * h));
  const c = layer(lw, lh), g = c.getContext('2d');
  const [a, b2, c2, d, e, f] = tf.map((v) => v * h), k = Math.hypot(a, b2);
  for (const type of ORDER) {
    const all = Q.filter((q) => q.type === type); if (!all.length) continue;
    const col = COL[type];
    // round 10 (Backstab: "Smoke doesn't fade out"): a smoke cloud fades away rather than shrinking to a blob, so each
    // one is its own layer at its own alpha (two clouds no longer join; they hardly ever meet)
    const smoke = type === 'smoke';
    for (const bs of smoke ? all.map((q) => [q]) : [all]) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of bs) {
      q.R = q.r * (smoke ? 0.85 + 0.15 * q.a : 0.35 + 0.65 * q.a); q._l = null;
      const sx = a * q.x + c2 * q.y + e, sy = b2 * q.x + d * q.y + f, sr = (q.r * 1.5 + 12) * k;
      x0 = Math.min(x0, sx - sr); y0 = Math.min(y0, sy - sr); x1 = Math.max(x1, sx + sr); y1 = Math.max(y1, sy + sr);
    }
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(lw, Math.ceil(x1)); y1 = Math.min(lh, Math.ceil(y1));
    if (x1 <= x0 || y1 <= y0) continue;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(x0, y0, x1 - x0, y1 - y0);
    g.setTransform(a, b2, c2, d, e, f);
    paintLayer(g, bs, st, col, type);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = (LAYER_A[type] || 1) * (st === 2 ? 0.9 : st === 7 ? 0.9 : 1) * (smoke ? bs[0].a : 1);
    ctx.imageSmoothingEnabled = st !== 6;
    ctx.drawImage(c, x0, y0, x1 - x0, y1 - y0, x0 / h, y0 / h, (x1 - x0) / h, (y1 - y0) / h);
    ctx.restore();
    for (const q of bs) details(ctx, q, st, col);
    }
  }
  Q.length = 0;
}

// One pass over every body of the kind: fill all their paths as one path, so they join.
function pass(g, bs, col, k, grow, st, dx = 0, dy = 0) {
  g.fillStyle = col; g.beginPath();
  for (const q of bs) bodyPath(g, q, k, grow, st, dx, dy);
  g.fill('nonzero');
}
function paintLayer(g, bs, st, c, type) {
  const fire = type === 'fire', cloud = !!CLOUD[type], web = type === 'web';
  if (st === 1 || st === 6) { // Inked (and Pixel, drawn small)
    pass(g, bs, INK, 1, OUTLINE, st);
    pass(g, bs, c[1], 1, 0, st);
    pass(g, bs, c[2], cloud ? 0.62 : 0.64, 0, st, -0.08, -0.1);
    if (fire) pass(g, bs, c[3], 0.32, 0, st, -0.04, -0.04);
  } else if (st === 2) { // Soft: gradient discs that sum where they overlap
    for (const q of bs) { const R = q.R * 1.15; softDisc(g, q.x, q.y, R, c[web ? 1 : 0], web ? 0.35 : type === 'oil' ? 0.85 : 0.6); }
    g.globalCompositeOperation = 'source-atop';
    for (const q of bs) softDisc(g, q.x - q.R * 0.12, q.y - q.R * 0.12, q.R * 0.65, c[2], fire ? 0.9 : 0.55);
    g.globalCompositeOperation = 'source-over';
  } else if (st === 3) { // Bands
    pass(g, bs, c[0], 1, 0, st);
    pass(g, bs, c[1], 0.8, 0, st, -0.04, -0.05);
    pass(g, bs, c[2], 0.48, 0, st, -0.1, -0.12);
    if (fire) pass(g, bs, c[3], 0.22, 0, st, -0.1, -0.1);
  } else if (st === 4) { // Splat: the dark tone is the rim, droplets round it
    pass(g, bs, fire ? '#2E2420' : c[0], 1, 0, st);
    g.fillStyle = fire ? '#2E2420' : c[0]; g.beginPath();
    for (const q of bs) for (let i = 0; i < 5; i++) { const b = hash(q.seed, i, 3) * TAU, d = q.R * (1.08 + 0.3 * hash(i, q.seed)), s = q.R * (0.07 + 0.07 * hash(q.seed, i, 9)); g.moveTo(q.x + Math.cos(b) * d + s, q.y + Math.sin(b) * d * 0.9); g.arc(q.x + Math.cos(b) * d, q.y + Math.sin(b) * d * 0.9, s, 0, TAU); }
    g.fill();
    pass(g, bs, fire ? '#4A3328' : c[1], 0.84, 0, st);
    if (!fire) pass(g, bs, c[2], 0.4, 0, st, -0.12, -0.12);
  } else if (st === 5) { // Rimmed: ink, a bright rim, the dark middle
    pass(g, bs, INK, 1, OUTLINE, st);
    pass(g, bs, c[2], 1, 0, st);
    pass(g, bs, c[0], 1, -Math.max(3, 0) - 2, st, 0.03, 0.04);
    if (fire) pass(g, bs, c[1], 0.55, 0, st);
    else pass(g, bs, c[1], 0.5, 0, st, 0.05, 0.06);
  } else { // Silhouette
    pass(g, bs, INK, 1, OUTLINE * 0.5, st);
    pass(g, bs, c[1], 1, 0, st);
  }
}
function softDisc(g, x, y, r, col, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.55, rgba(col, a * 0.85)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}

// ---------------------------------------------------------------- what stands in a body (per body, inked)
function details(ctx, q, st, c) {
  const { type, x, y, T, seed } = q, r = q.R;
  ctx.save(); ctx.globalAlpha *= clamp(q.a * 1.6, 0, 1);
  if (type === 'fire') { // flames standing in the burning patch
    const n = Math.max(3, Math.round(r / 11));
    for (let i = 0; i < n; i++) {
      const b = i / n * TAU + seed, rr = r * (0.2 + 0.5 * hash(i, seed)), fl = 0.7 + 0.3 * Math.sin(T * 9 + i * 2.3), s = (8 + 6 * hash(seed, i)) * fl * Math.min(1.5, r / 36);
      if (st === 2) { const [ux, uy] = upVec(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x + Math.cos(b) * rr + ux * s, y + Math.sin(b) * rr + uy * s, s * 1.8, c[3], 0.7); ctx.restore(); }
      else upright(ctx, x + Math.cos(b) * rr, y + Math.sin(b) * rr, () => { ctx.rotate(Math.sin(T * 7 + i) * 0.12); flame(ctx, 0, 0, s, c[2], c[3]); });
    }
  } else if (type === 'oil') { // a pale gloss and slow bubbles that swell and pop
    if (st !== 7) { ctx.fillStyle = rgba(c[3], st === 2 ? 0.22 : 0.4); ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.3, r * 0.26, r * 0.09, -0.5, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 3; i++) { const ph = (T * 0.35 + hash(i, seed)) % 1, b = hash(seed, i, 6) * TAU, d = r * 0.5 * hash(i, seed, 7);
      if (ph > 0.85) continue; ctx.strokeStyle = rgba(c[3], 0.35); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x + Math.cos(b) * d, y + Math.sin(b) * d, 2 + ph * r * 0.1, 0, TAU); ctx.stroke(); }
  } else if (type === 'water') { // ripples
    for (let i = 0; i < 2; i++) { const ph = (T * 0.45 + i * 0.5 + hash(seed, i)) % 1; ctx.strokeStyle = rgba(c[3], 0.55 * (1 - ph)); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(x, y, r * 0.7 * ph + 3, r * 0.62 * ph + 3, 0, 0, TAU); ctx.stroke(); }
  } else if (type === 'gas') { // bubbles rising and popping
    const [ux, uy] = upVec();
    for (let i = 0; i < 5; i++) { const ph = (T * 0.8 + hash(i, seed)) % 1, b = hash(seed, i, 3) * TAU, d = r * 0.7 * Math.sqrt(hash(i, seed, 5));
      if (ph > 0.9) continue; inked(ctx, () => { ctx.beginPath(); ctx.arc(x + Math.cos(b) * d + ux * ph * 12, y + Math.sin(b) * d + uy * ph * 12, 1.5 + 3.5 * ph, 0, TAU); }, c[2]); }
  } else if (type === 'smoke') { // wisps curling off the top
    const [ux, uy] = upVec();
    for (let i = 0; i < 3; i++) { const ph = (T * 0.7 + i / 3 + hash(seed, i)) % 1, b = hash(seed, i, 2) * TAU, d = r * 0.5;
      ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI) * 0.8; ctx.fillStyle = c[2];
      ctx.beginPath(); ctx.arc(x + Math.cos(b) * d + ux * ph * 26 + Math.sin(ph * 7) * 3, y + Math.sin(b) * d + uy * ph * 26, r * 0.14 * (1 - ph * 0.5), 0, TAU); ctx.fill(); ctx.restore(); }
  } else if (type === 'web') { // threads from the middle and rings between them
    const n = 8, rings = [0.35, 0.62, 0.9], rot = seed * 0.01;
    const path = () => { ctx.beginPath();
      for (let i = 0; i < n; i++) { const b = i / n * TAU + rot; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); }
      for (const kk of rings) for (let i = 0; i <= n; i++) { const b = i / n * TAU + rot, rr = r * kk * (i % 2 ? 0.9 : 1), px = x + Math.cos(b) * rr, py = y + Math.sin(b) * rr;
        if (i) { const pb = (i - 0.5) / n * TAU + rot, sag = r * kk * 0.82; ctx.quadraticCurveTo(x + Math.cos(pb) * sag, y + Math.sin(pb) * sag, px, py); } else ctx.moveTo(px, py); } };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (st === 1 || st === 5 || st === 6) { ctx.strokeStyle = INK; ctx.lineWidth = 1.6 + OUTLINE * 2; path(); ctx.stroke(); }
    ctx.strokeStyle = st === 3 ? c[3] : c[2]; ctx.lineWidth = st === 2 ? 1.2 : 1.8; path(); ctx.stroke();
  } else if (type === 'frost') { // snowflakes settling
    for (let i = 0; i < 4; i++) { const b = hash(seed, i) * TAU, d = r * 0.7 * Math.sqrt(hash(i, seed)), tw = 0.5 + 0.5 * Math.sin(T * 3 + i * 2);
      snowflake(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, 3 + 2 * tw, T * 0.5 + i); }
  }
  if (st === 3 && (type === 'oil' || type === 'water')) { // the bands' crisp highlight
    ctx.strokeStyle = c[3]; ctx.lineWidth = Math.max(2, r * 0.06); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r * 0.62, -2.6, -1.9); ctx.stroke();
  }
  ctx.restore();
}
export function snowflake(ctx, x, y, s, rot = 0, col = '#FFFFFF') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round';
  const arms = () => { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s); ctx.lineTo(-Math.cos(a) * s, -Math.sin(a) * s); } };
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4 + OUTLINE * 1.2; arms(); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 1.6; arms(); ctx.stroke();
  ctx.restore();
}

// A hazard on the floor (w.hazards) drawn as a body, if it is one. Timed ones shrink away over their last part.
const HAZ = { oil: 'oil', fire: 'fire', gas: 'gas', water: 'water', mist: 'mist', web: 'web', smoke: 'smoke', frost: 'frost' };
export function drawHazardPuddle(ctx, h, T) {
  const type = HAZ[h.type]; if (!type) return false;
  let a = 1;
  if (h.max) a = clamp(Math.min((h.max - h.t) / 0.6, h.t / Math.min(1.2, h.max * 0.35)), 0, 1);
  drawPuddle(ctx, type, h.x, h.y, h.r, T, a, Math.round(h.x * 7 + h.y * 13));
  return true;
}
