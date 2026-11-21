// Ground puddles and the like (round 8, lane V): oil, burning ground, gas, water, mist and webs, each in four
// styles the player picks in the settings (like env.js's look), or ?puddle=1..4 for testing.
//   1 Inked  cartoon blobs with the ink outline, like everything else
//   2 Soft   no outline: soft-edged, see-through pools that fade into the floor
//   3 Bands  hard toon bands, dark rim to a light middle, a crisp highlight
//   4 Splat  ragged splats with drips and droplets round them, a rim in their own colour, detail on top
// No rainbow sheen on oil (designer, round 8): its highlight is a plain pale gloss.
import { INK, TAU, clamp } from './util.js';
import { OUTLINE } from './render.js';
import { hash, rgba, upright, upVec, inked, blob, flame, glowDisc } from './fx.js';

export const PUDDLE_STYLES = [
  { id: 1, name: 'Inked', blurb: 'Cartoon blobs with the same ink outline as the units.' },
  { id: 2, name: 'Soft', blurb: 'No outline: soft-edged, see-through pools that fade into the floor.' },
  { id: 3, name: 'Bands', blurb: 'Hard toon bands from a dark rim to a light middle, with a crisp highlight.' },
  { id: 4, name: 'Splat', blurb: 'Ragged splats with drips and droplets, a rim in their own colour.' },
];
const KEY = 'delve.puddle';
let cur = 0;
export function puddleStyle() {
  if (cur) return cur;
  let n = 0;
  try { n = +new URLSearchParams(location.search).get('puddle'); } catch {}
  if (!(n >= 1 && n <= 4)) { try { n = +localStorage.getItem(KEY); } catch {} }
  return (cur = n >= 1 && n <= 4 ? Math.round(n) : 1);
}
export function setPuddleStyle(n) { cur = clamp(Math.round(+n) || 1, 1, 4); try { localStorage.setItem(KEY, String(cur)); } catch {} return cur; }

// dark, main, light, gloss
const COL = {
  oil: ['#1E1917', '#352C28', '#54473F', '#E9E1D6'],
  fire: ['#A8301A', '#E8582A', '#FF9A3D', '#FFD27A'],
  gas: ['#4E7A22', '#82B23A', '#BCE070', '#E6F7B0'],
  water: ['#2F7FB8', '#5DB7E0', '#A8DDF4', '#F2FBFF'],
  mist: ['#8496B4', '#AFC0DA', '#DDE8F6', '#FFFFFF'],
  web: ['#A99FBF', '#DCD5EA', '#F4F0FA', '#FFFFFF'],
};
export const PUDDLE_TYPES = Object.keys(COL);

// a ragged splat outline: radius jumps by vertex, smoothed with quadratic curves
function splatPath(ctx, x, y, r, seed, n = 14, rough = 0.28) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (1 - rough / 2 + rough * hash(seed, i)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.9]); }
  ctx.beginPath();
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let m = mid(pts[n - 1], pts[0]); ctx.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; m = mid(p, q); ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  ctx.closePath();
}
function soft(ctx, x, y, r, col, a, inner = 0.45) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(inner, rgba(col, a * 0.85)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
const fill = (ctx, col, path) => { ctx.fillStyle = col; path(); ctx.fill(); };

// Draw one puddle. a: how present it is (fading in/out), 0..1.
export function drawPuddle(ctx, type, x, y, r, T, a = 1, seed = 0, style = puddleStyle()) {
  const c = COL[type]; if (!c || r < 1) return;
  seed = seed || Math.round(x * 7 + y * 13);
  ctx.save(); ctx.globalAlpha *= a;
  if (type === 'web') web(ctx, x, y, r, T, seed, style, c);
  else if (type === 'gas' || type === 'mist') cloud(ctx, type, x, y, r, T, seed, style, c);
  else pool(ctx, type, x, y, r, T, seed, style, c);
  ctx.restore();
}

// oil, water, burning ground
function pool(ctx, type, x, y, r, T, seed, st, c) {
  const fire = type === 'fire', water = type === 'water';
  const breathe = fire ? 1 + Math.sin(T * 10 + x) * 0.03 : 1;
  if (st === 1) {
    inked(ctx, () => blob(ctx, x, y, r * breathe, 8, seed, 0.88), c[1]);
    fill(ctx, c[2], () => blob(ctx, x - r * 0.06, y - r * 0.06, r * 0.66, 7, seed + 2, 0.88));
    if (fire) fill(ctx, c[3], () => blob(ctx, x, y, r * 0.34, 6, T * 2, 0.88));
    else { ctx.fillStyle = rgba(c[3], 0.6); ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.3, r * 0.26, r * 0.1, -0.5, 0, TAU); ctx.fill(); }
  } else if (st === 2) {
    if (fire) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r * 1.25, c[2], 0.45 * breathe); ctx.restore(); soft(ctx, x, y, r, c[0], 0.55, 0.3); soft(ctx, x, y, r * 0.65, c[2], 0.6); }
    else { soft(ctx, x, y, r * 1.05, c[0], type === 'oil' ? 0.85 : 0.55, 0.55); soft(ctx, x - r * 0.1, y - r * 0.1, r * 0.6, c[2], 0.4); }
    if (!fire) { // a soft gloss drifting slowly over the surface
      const gx = x - r * 0.25 + Math.sin(T * 0.6 + seed) * r * 0.12, gy = y - r * 0.28;
      ctx.fillStyle = rgba(c[3], type === 'oil' ? 0.22 : 0.35); ctx.beginPath(); ctx.ellipse(gx, gy, r * 0.32, r * 0.1, -0.45, 0, TAU); ctx.fill();
    }
  } else if (st === 3) {
    fill(ctx, c[0], () => blob(ctx, x, y, r * breathe, 8, seed, 0.88));
    fill(ctx, c[1], () => blob(ctx, x - r * 0.04, y - r * 0.05, r * 0.8, 7, seed + 1, 0.88));
    fill(ctx, c[2], () => blob(ctx, x - r * 0.1, y - r * 0.12, r * 0.48, 6, seed + 2, 0.88));
    if (fire) fill(ctx, c[3], () => blob(ctx, x - r * 0.1, y - r * 0.1, r * 0.22, 5, T * 2, 0.88));
    else { ctx.strokeStyle = c[3]; ctx.lineWidth = Math.max(2, r * 0.06); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r * 0.62, -2.6, -1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 0.62, -1.65, -1.5); ctx.stroke(); }
  } else {
    fill(ctx, fire ? '#2E2420' : c[0], () => splatPath(ctx, x, y, r * breathe, seed));
    fill(ctx, fire ? '#4A3328' : c[1], () => splatPath(ctx, x - r * 0.03, y - r * 0.03, r * 0.84, seed + 5, 12, 0.22));
    for (let i = 0; i < 5; i++) { const b = hash(seed, i, 3) * TAU, d = r * (1.05 + 0.3 * hash(i, seed)), s = r * (0.07 + 0.07 * hash(seed, i, 9));
      fill(ctx, fire ? '#2E2420' : c[0], () => { ctx.beginPath(); ctx.arc(x + Math.cos(b) * d, y + Math.sin(b) * d * 0.9, s, 0, TAU); }); }
    if (fire) { // embers glowing in a scorch
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const b = hash(seed, i, 1) * TAU, d = r * 0.7 * Math.sqrt(hash(i, seed, 2)), g = 0.5 + 0.5 * Math.sin(T * 6 + i * 1.7);
        glowDisc(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, r * 0.3, c[2], 0.55 * g); }
      ctx.restore();
    } else if (type === 'oil') { // slow bubbles that swell and pop
      for (let i = 0; i < 3; i++) { const ph = (T * 0.35 + hash(i, seed)) % 1, b = hash(seed, i, 6) * TAU, d = r * 0.5 * hash(i, seed, 7);
        if (ph > 0.85) continue; ctx.strokeStyle = rgba(c[3], 0.35); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x + Math.cos(b) * d, y + Math.sin(b) * d, 2 + ph * r * 0.12, 0, TAU); ctx.stroke(); }
    }
    if (water) { // ripples
      for (let i = 0; i < 2; i++) { const ph = (T * 0.5 + i * 0.5 + hash(seed, i)) % 1; ctx.strokeStyle = rgba(c[3], 0.5 * (1 - ph)); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(x, y, r * 0.75 * ph + 2, r * 0.65 * ph + 2, 0, 0, TAU); ctx.stroke(); }
    }
    ctx.strokeStyle = fire ? '#5A3020' : c[0]; ctx.lineWidth = 2; splatPath(ctx, x, y, r * breathe, seed); ctx.stroke();
  }
  if (water && st !== 4) { // a ripple or two running out over the water
    const ph = (T * 0.45 + hash(seed, 1)) % 1; ctx.strokeStyle = rgba(c[3], 0.55 * (1 - ph)); ctx.lineWidth = st === 3 ? 2.4 : 1.6;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.7 * ph + 3, r * 0.62 * ph + 3, 0, 0, TAU); ctx.stroke();
  }
  if (fire) { // flames standing in the burning patch: inked in 1, 3 and 4, soft light in 2
    const n = Math.max(3, Math.round(r / 11));
    for (let i = 0; i < n; i++) {
      const b = i / n * TAU + seed, rr = r * (0.2 + 0.5 * hash(i, seed)), fl = 0.7 + 0.3 * Math.sin(T * 9 + i * 2.3), s = (8 + 6 * hash(seed, i)) * fl * Math.min(1.5, r / 36);
      if (st === 2) { const [ux, uy] = upVec(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x + Math.cos(b) * rr + ux * s, y + Math.sin(b) * rr + uy * s, s * 1.8, c[3], 0.7); ctx.restore(); }
      else upright(ctx, x + Math.cos(b) * rr, y + Math.sin(b) * rr, () => flame(ctx, 0, 0, s, c[2], c[3]));
    }
  }
}

// gas and mist: drifting clouds
function cloud(ctx, type, x, y, r, T, seed, st, c) {
  const gas = type === 'gas', n = 6, spin = T * (gas ? 0.5 : 0.25);
  const lumps = [];
  for (let i = 0; i < n; i++) { const b = i / n * TAU + spin + seed, d = r * (0.38 + 0.08 * Math.sin(T * 0.9 + i)); lumps.push([x + Math.cos(b) * d, y + Math.sin(b) * d * 0.85, r * (0.5 + 0.06 * Math.sin(T * 1.3 + i * 2))]); }
  lumps.push([x, y, r * 0.55]);
  if (st === 1) {
    ctx.save(); ctx.globalAlpha *= 0.75;
    ctx.fillStyle = INK; for (const [lx, ly, lr] of lumps) { ctx.beginPath(); ctx.arc(lx, ly, lr + OUTLINE, 0, TAU); ctx.fill(); }
    ctx.fillStyle = c[1]; for (const [lx, ly, lr] of lumps) { ctx.beginPath(); ctx.arc(lx, ly, lr, 0, TAU); ctx.fill(); }
    ctx.fillStyle = c[2]; for (const [lx, ly, lr] of lumps) { ctx.beginPath(); ctx.arc(lx - lr * 0.2, ly - lr * 0.22, lr * 0.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  } else if (st === 2) {
    for (const [lx, ly, lr] of lumps) soft(ctx, lx, ly, lr * 1.25, c[1], gas ? 0.55 : 0.5, 0.4);
    soft(ctx, x, y, r * 0.6, c[2], 0.4);
  } else if (st === 3) {
    ctx.save(); ctx.globalAlpha *= 0.8;
    ctx.fillStyle = c[0]; for (const [lx, ly, lr] of lumps) { ctx.beginPath(); ctx.arc(lx, ly, lr, 0, TAU); ctx.fill(); }
    ctx.fillStyle = c[1]; for (const [lx, ly, lr] of lumps) { ctx.beginPath(); ctx.arc(lx - lr * 0.1, ly - lr * 0.12, lr * 0.72, 0, TAU); ctx.fill(); }
    ctx.fillStyle = c[2]; for (const [lx, ly, lr] of lumps) { ctx.beginPath(); ctx.arc(lx - lr * 0.22, ly - lr * 0.26, lr * 0.36, 0, TAU); ctx.fill(); }
    ctx.restore();
  } else { // curling wisps and bubbles
    soft(ctx, x, y, r * 1.05, c[1], gas ? 0.5 : 0.45, 0.5);
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + spin * 1.6 + seed, rr = r * (0.35 + 0.35 * hash(i, seed));
      ctx.strokeStyle = rgba(i % 2 ? c[2] : c[0], 0.85); ctx.lineWidth = Math.max(3, r * 0.09);
      ctx.beginPath(); ctx.arc(x + Math.cos(b) * rr * 0.4, y + Math.sin(b) * rr * 0.4, rr * 0.6, b, b + 2.2); ctx.stroke(); }
    if (gas) for (let i = 0; i < 6; i++) { const ph = (T * 0.8 + hash(i, seed)) % 1, b = hash(seed, i, 3) * TAU, d = r * 0.7 * Math.sqrt(hash(i, seed, 5)), [ux, uy] = upVec();
      if (ph > 0.9) continue; inked(ctx, () => { ctx.beginPath(); ctx.arc(x + Math.cos(b) * d + ux * ph * 10, y + Math.sin(b) * d + uy * ph * 10, 1.5 + 4 * ph, 0, TAU); }, c[2]); }
  }
}

// webs: threads from the middle and rings between them
function web(ctx, x, y, r, T, seed, st, c) {
  const n = 8, rings = st === 4 ? [0.3, 0.55, 0.8, 1] : [0.35, 0.62, 0.9];
  const spokes = () => { ctx.beginPath(); for (let i = 0; i < n; i++) { const b = i / n * TAU + seed * 0.01; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } };
  const loops = () => { ctx.beginPath(); for (const k of rings) for (let i = 0; i <= n; i++) { const b = i / n * TAU + seed * 0.01, rr = r * k * (i % 2 ? 0.9 : 1);
    const px = x + Math.cos(b) * rr, py = y + Math.sin(b) * rr; if (i) { const pb = (i - 0.5) / n * TAU + seed * 0.01, sag = r * k * 0.82; ctx.quadraticCurveTo(x + Math.cos(pb) * sag, y + Math.sin(pb) * sag, px, py); } else ctx.moveTo(px, py); } };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (st === 1) {
    ctx.strokeStyle = INK; ctx.lineWidth = 2 + OUTLINE * 2; spokes(); ctx.stroke(); loops(); ctx.stroke();
    ctx.strokeStyle = c[2]; ctx.lineWidth = 2; spokes(); ctx.stroke(); loops(); ctx.stroke();
  } else if (st === 2) {
    soft(ctx, x, y, r, c[1], 0.18);
    ctx.strokeStyle = rgba(c[2], 0.55); ctx.lineWidth = 1.3; spokes(); ctx.stroke(); loops(); ctx.stroke();
  } else if (st === 3) {
    ctx.strokeStyle = c[0]; ctx.lineWidth = 3.4; spokes(); ctx.stroke(); loops(); ctx.stroke();
    ctx.strokeStyle = c[3]; ctx.lineWidth = 1.6; spokes(); ctx.stroke(); loops(); ctx.stroke();
    for (let i = 0; i < 6; i++) { const b = (i + 0.5) / 6 * TAU, d = r * rings[i % rings.length]; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x + Math.cos(b) * d, y + Math.sin(b) * d, 2.2, 0, TAU); ctx.fill(); }
  } else {
    fill(ctx, rgba(c[1], 0.35), () => splatPath(ctx, x, y, r * 0.45, seed, 10, 0.4));
    ctx.strokeStyle = c[1]; ctx.lineWidth = 2.6; spokes(); ctx.stroke(); loops(); ctx.stroke();
    for (let i = 0; i < 5; i++) { const b = hash(seed, i) * TAU, d = r * (0.3 + 0.6 * hash(i, seed)); fill(ctx, c[2], () => { ctx.beginPath(); ctx.arc(x + Math.cos(b) * d, y + Math.sin(b) * d, 3 + 2 * hash(seed, i, 4), 0, TAU); }); }
  }
}

// A hazard on the floor (w.hazards) drawn as a puddle, if it is one. Timed ones fade over their last part.
const HAZ = { oil: 'oil', fire: 'fire', gas: 'gas', water: 'water', mist: 'mist', web: 'web' };
export function drawHazardPuddle(ctx, h, T) {
  const type = HAZ[h.type]; if (!type) return false;
  let a = 1;
  if (h.max) a = clamp(Math.min((h.max - h.t) / 0.25 + 0.2, h.t / Math.min(1.2, h.max * 0.35)), 0, 1);
  drawPuddle(ctx, type, h.x, h.y, h.r, T, a);
  return true;
}
