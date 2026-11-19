// Effects drawing: w.fx (ring, zone, beam, wall, wave, pillar), projectiles of every kind, the looks of the newer
// statuses, and the renderer's own small touches (impact stars, coin sparkles). Everything is drawn in room units
// with the one outline thickness (OUTLINE) where a thing has an outline. Show, don't tell: no words, no bars.
import { INK, TAU, clamp } from './util.js';
import { OUTLINE, view } from './render.js';
import { STYLE } from './parts.js';

const easeOut = (k) => 1 - (1 - k) * (1 - k) * (1 - k);
// a stable pseudo-random number from integers (flicker that doesn't need state)
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
export function upright(ctx, x, y, fn) { ctx.save(); ctx.translate(x, y); if (view.rot) ctx.rotate(Math.PI / 2); fn(); ctx.restore(); }
const upVec = () => (view.rot ? [1, 0] : [0, -1]);
function inked(ctx, pathFn, fill) {
  ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round';
  pathFn(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = fill; pathFn(); ctx.fill();
}
// a stroke with an ink border: the same path stroked twice
function inkLine(ctx, pathFn, color, width, cap = 'round') {
  ctx.save(); ctx.lineCap = cap; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = width + OUTLINE * 2; pathFn(); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = width; pathFn(); ctx.stroke();
  ctx.restore();
}
function flamePath(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 1.9);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r * 1.05, y - r * 0.4, x + r * 0.85, y + r * 0.25);
  ctx.arc(x, y + r * 0.1, r * 0.87, 0.2, Math.PI - 0.2);
  ctx.bezierCurveTo(x - r * 1.05, y - r * 0.4, x - r * 0.5, y - r * 1.1, x, y - r * 1.9); ctx.closePath();
}
function flame(ctx, x, y, r, outer = '#FF8A3D', inner = '#FFE08A') {
  inked(ctx, () => flamePath(ctx, x, y, r), outer);
  ctx.fillStyle = inner; flamePath(ctx, x, y + r * 0.25, r * 0.5); ctx.fill();
}
function blob(ctx, x, y, r, n, ph, sq = 1) {
  ctx.beginPath();
  for (let i = 0; i <= n * 2; i++) {
    const a = i / (n * 2) * TAU, rr = r * (1 + 0.08 * Math.sin(a * 3 + ph));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * sq;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function star(ctx, x, y, r, n = 4, inner = 0.38, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU - Math.PI / 2, rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath();
}
function glowDisc(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(0.5, rgba(color, a * 0.45)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
// a jagged line from a to b, its kinks re-rolled every `rate` seconds
function jag(ctx, x1, y1, x2, y2, t, seed, n = 7, amp = 0.09, rate = 0.06) {
  const L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / (L || 1), ny = (x2 - x1) / (L || 1), f = Math.floor(t / rate);
  ctx.beginPath(); ctx.moveTo(x1, y1);
  for (let i = 1; i < n; i++) { const k = i / n, o = (hash(f, i, seed) - 0.5) * 2 * L * amp * Math.sin(k * Math.PI); ctx.lineTo(x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o); }
  ctx.lineTo(x2, y2);
}
function bolt(ctx, x1, y1, x2, y2, t, seed, width = 3, color = '#FFF3A0') {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba(color, 0.25); ctx.lineWidth = width * 5; jag(ctx, x1, y1, x2, y2, t, seed); ctx.stroke(); ctx.restore();
  inkLine(ctx, () => jag(ctx, x1, y1, x2, y2, t, seed), color, width);
  ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = width * 0.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; jag(ctx, x1, y1, x2, y2, t, seed); ctx.stroke(); ctx.restore();
}

// fade in quickly, out over the last part
const life = (f, inT = 0.2, outT = 0.35) => clamp(Math.min(f.t / inT, (f.max - f.t) / outT, 1), 0, 1);

// ---------------------------------------------------------------- ground effects (under the units)
const ZONE = {
  holy: '#F2C14E', fire: '#E8582A', poison: '#7DB83A', ice: '#9FDDF6', storm: '#5B6C9A', vines: '#4E8A3A', heal: '#8BE07A', sanctuary: '#FFF1B0',
};
export function drawGroundFx(ctx, w) {
  for (const f of w.fx || []) if (f.type === 'zone') zone(ctx, f, w.time);
}
function zone(ctx, f, T) {
  const a = life(f, 0.25, 0.45), grow = 0.55 + 0.45 * easeOut(clamp(f.t / 0.3, 0, 1)), r = f.r * grow, x = f.x, y = f.y;
  const seed = Math.round(x * 7 + y * 13);
  ctx.save(); ctx.globalAlpha = a;
  switch (f.kind) {
    case 'fire': {
      const k = 1 + Math.sin(T * 14 + x) * 0.04;
      inked(ctx, () => blob(ctx, x, y, r * k, 8, seed + T * 0.6, 0.9), '#D9481F');
      ctx.fillStyle = '#FF8A3D'; blob(ctx, x, y, r * 0.72 * k, 7, -T * 1.2, 0.9); ctx.fill();
      ctx.fillStyle = '#FFC85A'; blob(ctx, x, y, r * 0.38, 6, T * 2, 0.9); ctx.fill();
      const n = Math.max(4, Math.round(r / 9));
      for (let i = 0; i < n; i++) {
        const an = i / n * TAU + seed, rr = r * (0.3 + 0.45 * hash(i, seed)), fl = 0.7 + 0.3 * Math.sin(T * 9 + i * 2.3);
        upright(ctx, x + Math.cos(an) * rr, y + Math.sin(an) * rr, () => flame(ctx, 0, 0, (6 + 4 * hash(seed, i)) * fl));
      }
      break;
    }
    case 'poison': {
      inked(ctx, () => blob(ctx, x, y, r, 8, seed, 0.92), '#4F7A22');
      ctx.fillStyle = '#7DB83A'; blob(ctx, x, y, r * 0.8, 7, seed + 1, 0.92); ctx.fill();
      ctx.fillStyle = 'rgba(210,240,140,0.35)'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.12, -0.5, 0, TAU); ctx.fill();
      for (let i = 0; i < 6; i++) { // bubbles swell and pop
        const ph = (T * 0.9 + hash(i, seed)) % 1, an = hash(seed, i, 3) * TAU, rr = r * 0.62 * Math.sqrt(hash(i, seed, 5));
        const br = 2 + 5 * ph; if (ph > 0.9) continue;
        inked(ctx, () => { ctx.beginPath(); ctx.arc(x + Math.cos(an) * rr, y + Math.sin(an) * rr, br, 0, TAU); }, '#B5DE5E');
      }
      break;
    }
    case 'ice': {
      inked(ctx, () => blob(ctx, x, y, r, 9, seed, 1), '#BFE9F8');
      ctx.fillStyle = '#E4F7FD'; blob(ctx, x, y, r * 0.7, 6, seed + 2, 1); ctx.fill();
      const n = 7;
      for (let i = 0; i < n; i++) {
        const an = i / n * TAU + seed, d = r * 0.55, s = 8 + 4 * hash(i, seed);
        ctx.save(); ctx.translate(x + Math.cos(an) * d, y + Math.sin(an) * d); ctx.rotate(an);
        inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s * 1.4, 0); ctx.lineTo(0, -s * 0.45); ctx.lineTo(-s * 0.6, 0); ctx.lineTo(0, s * 0.45); ctx.closePath(); }, '#CFF3FF');
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(s * 1.2, 0); ctx.lineTo(0, -s * 0.35); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'storm': {
      ctx.fillStyle = 'rgba(43,34,48,0.28)'; blob(ctx, x, y, r, 7, T * 0.5 + seed, 0.95); ctx.fill();
      ctx.fillStyle = 'rgba(70,82,120,0.25)'; blob(ctx, x + 4, y - 3, r * 0.7, 6, -T * 0.7, 0.95); ctx.fill();
      // rain streaks and the odd strike on the ground
      ctx.strokeStyle = 'rgba(200,220,255,0.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const [ux, uy] = upVec();
      for (let i = 0; i < 12; i++) { const ph = (T * 2.2 + hash(i, seed)) % 1, an = hash(seed, i) * TAU, rr = r * 0.85 * Math.sqrt(hash(i, seed, 7));
        const px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr; const l = 10 * (1 - ph);
        ctx.beginPath(); ctx.moveTo(px + ux * l, py + uy * l); ctx.lineTo(px + ux * (l - 5), py + uy * (l - 5)); ctx.stroke(); }
      const f8 = Math.floor(T / 0.12);
      if (hash(f8, seed) < 0.35) { const an = hash(f8, seed, 1) * TAU, rr = r * 0.6 * hash(f8, seed, 2), px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr;
        bolt(ctx, px + ux * 46, py + uy * 46, px, py, T, f8, 2.2); glowDisc(ctx, px, py, 18, '#FFF3A0', 0.6); }
      break;
    }
    case 'vines': {
      ctx.fillStyle = 'rgba(60,90,40,0.22)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      const n = 7, g = clamp(f.t / 0.5, 0, 1);
      for (let i = 0; i < n; i++) {
        const a0 = i / n * TAU + seed, sw = (hash(i, seed) > 0.5 ? 1 : -1);
        const path = () => { ctx.beginPath(); for (let s = 0; s <= 12 * g; s++) { const k = s / 12, rr = r * (0.15 + 0.8 * k), an = a0 + sw * k * 2.2 + Math.sin(T * 1.5 + i) * 0.04; s ? ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : ctx.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } };
        inkLine(ctx, path, i % 2 ? '#5E9E3E' : '#4A8433', 3.2);
        if (g > 0.6) { const k = 0.7, rr = r * (0.15 + 0.8 * k), an = a0 + sw * k * 2.2; leaf(ctx, x + Math.cos(an) * rr, y + Math.sin(an) * rr, an + sw * 1.2, 6); }
      }
      break;
    }
    case 'heal': case 'holy': case 'sanctuary': {
      const col = ZONE[f.kind], pulse = 0.85 + 0.15 * Math.sin(T * 4 + seed);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r * 1.05, col, 0.32 * pulse); ctx.restore();
      ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = f.kind === 'sanctuary' ? 4 : 2.6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      if (f.kind !== 'heal') { // a turning ring of rune marks
        ctx.save(); ctx.translate(x, y); ctx.rotate(T * (f.kind === 'holy' ? 0.5 : -0.3));
        ctx.strokeStyle = rgba(f.kind === 'holy' ? '#FFF4C8' : '#FFFFFF', 0.85); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        const n = Math.round(r / 7);
        for (let i = 0; i < n; i++) { const an = i / n * TAU; ctx.beginPath(); ctx.arc(0, 0, r * 0.82, an, an + TAU / n * 0.45); ctx.stroke(); }
        ctx.restore();
      }
      // motes rising: crosses for healing, sparks of light for the others
      const [ux, uy] = upVec();
      for (let i = 0; i < 7; i++) {
        const ph = (T * 0.6 + hash(i, seed)) % 1, an = hash(seed, i, 4) * TAU, rr = r * 0.8 * Math.sqrt(hash(i, seed, 9));
        const px = x + Math.cos(an) * rr + ux * ph * 26, py = y + Math.sin(an) * rr + uy * ph * 26, al = Math.sin(ph * Math.PI);
        ctx.globalAlpha = a * al;
        if (f.kind === 'heal') upright(ctx, px, py, () => inked(ctx, () => { ctx.beginPath(); ctx.rect(-1.6, -5, 3.2, 10); ctx.rect(-5, -1.6, 10, 3.2); }, '#C8F5B0'));
        else { ctx.fillStyle = '#FFFBEA'; star(ctx, px, py, 3.5, 4, 0.35); ctx.fill(); }
      }
      break;
    }
  }
  ctx.restore();
}
function leaf(ctx, x, y, a, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.8, s, 0); ctx.quadraticCurveTo(0, s * 0.8, -s, 0); ctx.closePath(); }, '#7CC25A');
  ctx.restore();
}

// ---------------------------------------------------------------- effects over the units
export function drawAirFx(ctx, w) {
  for (const f of w.fx || []) {
    if (f.type === 'ring') ring(ctx, f);
    else if (f.type === 'beam') beam(ctx, f, w.time);
    else if (f.type === 'wall') wall(ctx, f, w.time);
    else if (f.type === 'wave') wave(ctx, f);
    else if (f.type === 'pillar') pillar(ctx, f, w.time);
  }
}
function ring(ctx, f) {
  const k = clamp(f.t / f.max, 0, 1), r = f.r * easeOut(k), wd = 7 * (1 - k) + 1.5;
  ctx.save(); ctx.globalAlpha = 1 - k * k;
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(1, r), 0, TAU); }, f.color || '#FFFFFF', wd);
  ctx.restore();
}
function beam(ctx, f, T) {
  const a = life(f, 0.08, 0.2), { x1, y1, x2, y2 } = f, seed = Math.round(x1 + y2);
  ctx.save(); ctx.globalAlpha = a;
  if (f.kind === 'lightning') {
    bolt(ctx, x1, y1, x2, y2, T, seed, 3.4);
    // a forked branch or two
    const L = Math.hypot(x2 - x1, y2 - y1), f6 = Math.floor(T / 0.06);
    for (let b = 0; b < 1; b++) { const k = 0.3 + 0.4 * hash(f6, b, seed), bx = x1 + (x2 - x1) * k, by = y1 + (y2 - y1) * k, an = Math.atan2(y2 - y1, x2 - x1) + (hash(b, f6) - 0.5) * 1.6;
      bolt(ctx, bx, by, bx + Math.cos(an) * L * 0.25, by + Math.sin(an) * L * 0.25, T, seed + b + 9, 1.8); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x2, y2, 22, '#FFF3A0', 0.7); ctx.restore();
  } else if (f.kind === 'drain') {
    // a dark red ribbon, with blobs of life flowing back to the caster (x1, y1)
    const L = Math.hypot(x2 - x1, y2 - y1), an = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(an), ny = Math.cos(an);
    const path = (ph, amp) => { ctx.beginPath(); for (let i = 0; i <= 20; i++) { const k = i / 20, o = Math.sin(k * 9 + ph) * amp * Math.sin(k * Math.PI); const px = x1 + (x2 - x1) * k + nx * o, py = y1 + (y2 - y1) * k + ny * o; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } };
    inkLine(ctx, () => path(T * 8, 7), '#8E3B5B', 3.5);
    ctx.strokeStyle = 'rgba(214,92,120,0.8)'; ctx.lineWidth = 1.6; path(T * 8 + 2, 5); ctx.stroke();
    for (let i = 0; i < 5; i++) { const k = 1 - ((T * 1.4 + i / 5) % 1), o = Math.sin(k * 9 + T * 8) * 7 * Math.sin(k * Math.PI);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o, 3.2, 0, TAU); }, '#E0604B'); }
    void L;
  } else { // holy: a straight shaft of light
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,225,140,0.25)'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }, '#F2C14E', 9 + Math.sin(T * 30) * 1.2);
    ctx.save(); ctx.strokeStyle = '#FFFBEA'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x2, y2, 20, '#FFE7A0', 0.8); ctx.restore();
  }
  ctx.restore();
}
function wall(ctx, f, T) {
  const a = life(f, 0.2, 0.4), L = Math.hypot(f.x2 - f.x1, f.y2 - f.y1), rise = easeOut(clamp(f.t / 0.3, 0, 1)), seed = Math.round(f.x1 * 3 + f.y1);
  ctx.save(); ctx.globalAlpha = a;
  if (f.kind === 'fire') {
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); }, '#E8582A', 9);
    ctx.save(); ctx.strokeStyle = '#FFC85A'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.restore();
    const n = Math.max(2, Math.round(L / 15));
    for (let i = 0; i <= n; i++) { const k = i / n, fl = (0.7 + 0.3 * Math.sin(T * 10 + i * 1.9)) * rise;
      upright(ctx, f.x1 + (f.x2 - f.x1) * k, f.y1 + (f.y2 - f.y1) * k, () => flame(ctx, 0, 0, (8 + 3 * hash(i, seed)) * fl)); }
  } else { // ice: a row of crystal blocks
    const n = Math.max(2, Math.round(L / 22));
    for (let i = 0; i <= n; i++) { const k = i / n, s = (11 + 3 * hash(i, seed)) * rise;
      ctx.save(); ctx.translate(f.x1 + (f.x2 - f.x1) * k, f.y1 + (f.y2 - f.y1) * k); ctx.rotate(hash(seed, i) * TAU);
      const p = () => { ctx.beginPath(); for (let j = 0; j < 6; j++) { const an = j / 6 * TAU, rr = s * (j % 2 ? 0.85 : 1.08); j ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); };
      inked(ctx, p, '#BFE9F8');
      ctx.fillStyle = '#EAF9FF'; ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.15); ctx.lineTo(-s * 0.15, -s * 0.65); ctx.lineTo(s * 0.1, -s * 0.4); ctx.lineTo(-s * 0.35, s * 0.05); ctx.closePath(); ctx.fill();
      ctx.restore(); }
  }
  ctx.restore();
}
function wave(ctx, f) {
  // a crescent of dust and air rolling outward, its front edge bright, a few stones kicked up behind it
  const k = clamp(f.t / f.max, 0, 1), r = 16 + f.r * easeOut(k), half = 0.7, th = 10 + 16 * (1 - k), seed = Math.round(f.x * 3 + f.y);
  ctx.save(); ctx.globalAlpha = 1 - k * k;
  const g = ctx.createRadialGradient(f.x, f.y, Math.max(0, r - th), f.x, f.y, r);
  g.addColorStop(0, 'rgba(233,221,194,0)'); g.addColorStop(0.75, 'rgba(233,221,194,0.75)'); g.addColorStop(1, 'rgba(255,248,230,0.95)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, f.a - half, f.a + half); ctx.arc(f.x, f.y, Math.max(0, r - th), f.a + half, f.a - half, true); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#FFF8E6'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(f.x, f.y, r, f.a - half * 0.92, f.a + half * 0.92); ctx.stroke();
  for (let i = 0; i < 5; i++) { const an = f.a + (hash(i, seed) - 0.5) * half * 1.7, rr = r - th * (0.4 + 0.8 * hash(seed, i)), hop = Math.sin(clamp(k * 3 - hash(i, seed, 2), 0, 1) * Math.PI) * 6;
    inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(an) * rr, f.y + Math.sin(an) * rr - hop, 2.4 * (1 - k) + 0.8, 0, TAU); }, '#A99C8B'); }
  ctx.restore();
}
function pillar(ctx, f, T) {
  const k = clamp(f.t / f.max, 0, 1), a = k < 0.12 ? 1 : 1 - (k - 0.12) / 0.88, [ux, uy] = upVec(), H = 260;
  ctx.save();
  if (f.kind === 'lightning') {
    if (k < 0.35) { ctx.globalAlpha = 1 - k / 0.35; bolt(ctx, f.x + ux * H, f.y + uy * H, f.x, f.y, T, Math.round(f.x), 5); bolt(ctx, f.x + ux * H * 0.6 + uy * 30, f.y + uy * H * 0.6 - ux * 30, f.x, f.y, T, Math.round(f.y), 2.5); }
    ctx.globalAlpha = a; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, f.r * 1.4, '#FFF3A0', 0.9 * a); ctx.restore();
    // scorch left on the ground
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = 'rgba(43,34,48,0.35)'; blob(ctx, f.x, f.y, f.r * 0.55, 7, f.x, 1); ctx.fill();
  } else { // a shaft of light from above, seen from overhead: it leans up the screen
    ctx.globalAlpha = a;
    upright(ctx, f.x, f.y, () => {
      const g = ctx.createLinearGradient(0, 0, 0, -H);
      const col = f.kind === 'fire' ? '#FF9A3D' : '#FFE7A0';
      g.addColorStop(0, rgba(col, 0.75)); g.addColorStop(1, rgba(col, 0));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
      const wd = f.r * (0.8 + 0.15 * Math.sin(T * 20));
      ctx.beginPath(); ctx.moveTo(-wd, 0); ctx.lineTo(-wd * 0.7, -H); ctx.lineTo(wd * 0.7, -H); ctx.lineTo(wd, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, f.r * 1.3, '#FFE7A0', 0.85 * a); ctx.restore();
    ctx.strokeStyle = rgba('#FFF4C8', 0.9 * a); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.6 + 0.5 * k), 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- projectiles
const BOLT_COL = { pyromancer: '#FF9A3D', frost: '#9FE3FF', storm: '#FFE66B', necromancer: '#B48CFF', bard: '#FFD45A', druid: '#9BE36B' };
export function drawProjectile(ctx, p, T) {
  const ang = Math.atan2(p.vy, p.vx), sp = Math.hypot(p.vx, p.vy), age = (p.age = (p.age || 0));
  ctx.save(); ctx.translate(p.x, p.y);
  switch (p.kind) {
    case 'icicle': case 'shard': {
      ctx.rotate(ang); const L = p.kind === 'shard' ? 1.3 : 1;
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(12 * L, 0); ctx.lineTo(-8 * L, -4.8); ctx.lineTo(-11 * L, 0); ctx.lineTo(-8 * L, 4.8); ctx.closePath(); }, '#BFE9F8');
      ctx.fillStyle = '#F2FCFF'; ctx.beginPath(); ctx.moveTo(11 * L, 0); ctx.lineTo(-8 * L, -4); ctx.lineTo(-6 * L, 0); ctx.closePath(); ctx.fill();
      break;
    }
    case 'bolt': {
      const col = p.color || (p.owner && (BOLT_COL[p.owner.kind] || (STYLE[p.owner.kind] || {}).glow)) || '#C9A7FF';
      ctx.rotate(ang); trail(ctx, sp, 26, 5.5, col);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 16, col, 0.6); ctx.restore();
      inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); }, col);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(1, -1, 2.6, 0, TAU); ctx.fill();
      break;
    }
    case 'fireball': {
      ctx.rotate(ang); trail(ctx, sp, 34, 9, '#FF8A3D');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 26, '#FF9A3D', 0.55); ctx.restore();
      const wob = Math.sin(T * 30) * 0.6;
      inked(ctx, () => blob(ctx, 0, 0, 10 + wob, 6, T * 9, 1), '#E8582A');
      ctx.fillStyle = '#FFB347'; blob(ctx, 1.5, 0, 6.5, 5, -T * 11, 1); ctx.fill();
      ctx.fillStyle = '#FFF0B0'; ctx.beginPath(); ctx.arc(2.5, -1, 3, 0, TAU); ctx.fill();
      break;
    }
    case 'dagger': {
      ctx.rotate(ang);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(1, -3.6); ctx.lineTo(1, 3.6); ctx.closePath(); }, '#DCE0E6');
      inked(ctx, () => { ctx.beginPath(); ctx.rect(-1.5, -5, 3, 10); }, '#B48A3A');
      inked(ctx, () => { ctx.beginPath(); ctx.rect(-9, -1.8, 8, 3.6); }, '#5A3A2A');
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(2, -2.8); ctx.lineTo(2, 0); ctx.closePath(); ctx.fill();
      break;
    }
    case 'vial': {
      ctx.rotate(T * 12 + p.x * 0.01);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 2, 6.5, 0, TAU); ctx.rect(-2.6, -9, 5.2, 7); }, '#E8F0EA');
      ctx.fillStyle = p.color || '#8FCB3A'; ctx.beginPath(); ctx.arc(0, 3, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8A5A3A'; ctx.fillRect(-3, -11, 6, 3.5);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(-2, 0, 1.6, 0, TAU); ctx.fill();
      break;
    }
    case 'thorn': {
      ctx.rotate(ang);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(13, 0); ctx.quadraticCurveTo(0, -5, -9, -3.5); ctx.lineTo(-7, 0); ctx.lineTo(-9, 3.5); ctx.quadraticCurveTo(0, 2, 13, 0); ctx.closePath(); }, '#6FA046');
      ctx.fillStyle = '#A9D47A'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.quadraticCurveTo(0, -4, -7, -2.5); ctx.lineTo(-5, -0.5); ctx.closePath(); ctx.fill();
      break;
    }
    case 'note': {
      ctx.restore(); ctx.save();
      const [ux, uy] = upVec(), b = Math.sin(T * 14 + p.x * 0.05) * 4;
      ctx.translate(p.x + ux * b, p.y + uy * b);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 14, '#FFD45A', 0.45); ctx.restore();
      if (view.rot) ctx.rotate(Math.PI / 2);
      ctx.rotate(Math.sin(T * 9) * 0.2);
      inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-2, 5, 5, 3.8, -0.4, 0, TAU); ctx.rect(1.4, -10, 3, 15); ctx.moveTo(4.4, -10); ctx.quadraticCurveTo(12, -7, 9, 0); ctx.quadraticCurveTo(9, -5, 4.4, -5); ctx.closePath(); }, '#FFD45A');
      break;
    }
    case 'bone': {
      ctx.rotate(T * 16 + p.y * 0.01);
      inked(ctx, () => { ctx.beginPath(); ctx.rect(-8, -2, 16, 4); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.moveTo(sx * 9 + 3.2, sy * 2.6); ctx.arc(sx * 9, sy * 2.6, 3.2, 0, TAU); } }, '#EDE4CD');
      break;
    }
    case 'water': {
      ctx.rotate(ang); trail(ctx, sp, 20, 4, '#7EC8F0');
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.quadraticCurveTo(-2, -7, 5, -5); ctx.arc(5, 0, 5, -Math.PI / 2, Math.PI / 2); ctx.quadraticCurveTo(-2, 7, -11, 0); ctx.closePath(); }, '#5DB7E0');
      ctx.fillStyle = '#E6F7FF'; ctx.beginPath(); ctx.ellipse(5, -2, 2.4, 1.4, 0, 0, TAU); ctx.fill();
      break;
    }
    default: { // arrow, fireArrow
      ctx.rotate(ang);
      const fire = p.kind === 'fireArrow';
      if (fire) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 12, 0, 14, '#FF9A3D', 0.6); ctx.restore(); }
      inked(ctx, () => { roundRect(ctx, -17, -1.6, 28, 3.2, 1.6); }, fire ? '#FF8A3D' : '#C99A6A');
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-22, -5); ctx.lineTo(-12, -2); ctx.lineTo(-12, 2); ctx.lineTo(-22, 5); ctx.closePath(); }, '#F1E8DA');
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(9, -5); ctx.lineTo(9, 5); ctx.closePath(); }, fire ? '#FFD45A' : '#DCE0E6');
      if (fire) { ctx.restore(); ctx.save(); upright(ctx, p.x + Math.cos(ang) * 12, p.y + Math.sin(ang) * 12, () => flame(ctx, 0, 0, 5 + Math.sin(T * 30) * 0.8)); }
    }
  }
  ctx.restore();
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
// a fading streak behind a flying thing (in its own frame, +x forward)
function trail(ctx, sp, len, wd, col) {
  const L = Math.min(len, sp * 0.06 + 6);
  const g = ctx.createLinearGradient(-L, 0, 0, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.7));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -wd); ctx.lineTo(0, wd); ctx.closePath(); ctx.fill();
}

// ---------------------------------------------------------------- status looks (after the unit is drawn)
export function drawStatusFx(ctx, u, T) {
  if (u.downed) return;
  const st = u.st || {}, [ux, uy] = upVec(), vr = u.vr;
  if (u.rootT > 0) { // vines wound round the feet, over the body's edge
    const g = clamp((u._rootSeen = (u._rootSeen || 0) + 1) / 8, 0, 1);
    for (let i = 0; i < 4; i++) {
      const a0 = i / 4 * TAU + u.id, rr = vr * (0.95 + 0.12 * Math.sin(i * 2.1));
      inkLine(ctx, () => { ctx.beginPath(); ctx.arc(u.x, u.y, rr, a0, a0 + 1.3 * g); }, i % 2 ? '#5E9E3E' : '#4A8433', 3);
      if (g >= 1) leaf(ctx, u.x + Math.cos(a0 + 1.3) * rr, u.y + Math.sin(a0 + 1.3) * rr, a0 + 1.3 + Math.PI / 2, 5);
    }
  } else u._rootSeen = 0;
  if ((st.wet || 0) > 10) { // drips falling from the body
    const n = st.wet > 60 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const ph = (T * 1.6 + i / n + u.id * 0.37) % 1, an = (i * 2.4 + u.id) % TAU, rr = vr * 0.7;
      const px = u.x + Math.cos(an) * rr - ux * ph * 14, py = u.y + Math.sin(an) * rr - uy * ph * 14;
      ctx.globalAlpha = 1 - ph;
      upright(ctx, px, py, () => inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -4.5); ctx.quadraticCurveTo(3.2, 0, 2.8, 1.6); ctx.arc(0, 1.6, 2.8, 0, Math.PI); ctx.quadraticCurveTo(-3.2, 0, 0, -4.5); ctx.closePath(); }, '#7EC8F0'));
    }
    ctx.globalAlpha = 1;
  }
  if ((st.shock || 0) > 5) { // little arcs crackling round the body
    const f = Math.floor(T / 0.07);
    for (let i = 0; i < 2; i++) { if (hash(f, i, u.id) < 0.35) continue;
      const a0 = hash(f, i, u.id + 1) * TAU, a1 = a0 + 0.7 + hash(i, f) * 0.6, r0 = vr * 1.05;
      bolt(ctx, u.x + Math.cos(a0) * r0, u.y + Math.sin(a0) * r0, u.x + Math.cos(a1) * r0, u.y + Math.sin(a1) * r0, T, f + i * 7 + u.id, 1.6); }
  }
  const stag = st.stagger || 0;
  if (stag > 8 || u.sleepT > 0) {
    // stars circling over the head (stagger), bigger and slower when knocked out; Zs drifting up when asleep
    upright(ctx, u.x, u.y, () => {
      if (stag > 8) {
        const ko = stag >= 100, n = ko ? 3 : stag > 50 ? 2 : 1, R = vr * (ko ? 0.9 : 0.7);
        for (let i = 0; i < n; i++) { const a = T * (ko ? 3 : 5) + i / n * TAU, x = Math.cos(a) * R, y = -vr * 1.05 + Math.sin(a) * R * 0.35;
          inked(ctx, () => star(ctx, x, y, ko ? 6 : 5, 5, 0.45, a), '#FFE14D'); }
      }
      if (u.sleepT > 0) for (let i = 0; i < 2; i++) {
        const ph = (T * 0.55 + i * 0.5) % 1, s = 4 + 3 * ph, x = vr * 0.5 + ph * 10 + Math.sin(ph * 6) * 2, y = -vr * 0.9 - ph * 26;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.lineTo(x + s, y + s); }, '#DDEBFF', 2.2);
        ctx.globalAlpha = 1;
      }
    });
  }
}

// ---------------------------------------------------------------- the renderer's own touches
// Short-lived marks the renderer adds itself (not in the sim): impact stars, coin sparkles.
const local = [];
export function noteHits(w) {
  for (const u of w.units) {
    if (u.hitT > (u._seenHit || 0) + 0.02 && !u.downed) {
      const r = u.r * 0.55;
      local.push({ type: 'impact', x: u.x - Math.cos(u.hitA) * r, y: u.y - Math.sin(u.hitA) * r, a: u.hitA, t: 0, max: 0.13, big: u.hitT > 0.15 && w.hitstop > 0 });
    }
    u._seenHit = u.hitT;
  }
  // coins that vanished while still fresh were picked up
  const now = new Set();
  for (const p of w.pickups) if (p.type === 'coin') now.add(p);
  if (w._coins) for (const p of w._coins) if (!now.has(p) && (p.life == null || p.life > 0.05)) local.push({ type: 'sparkle', x: p.x, y: p.y, t: 0, max: 0.4 });
  w._coins = now;
}
export function drawLocal(ctx, dt) {
  for (const f of local) {
    f.t += dt; const k = clamp(f.t / f.max, 0, 1);
    if (f.type === 'impact') {
      const s = (f.big ? 13 : 9) * (0.6 + 0.6 * easeOut(k));
      ctx.save(); ctx.globalAlpha = 1 - k * k;
      inked(ctx, () => star(ctx, f.x, f.y, s, 4, 0.3, f.a), '#FFFFFF');
      ctx.restore();
    } else if (f.type === 'sparkle') {
      ctx.save(); ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 4; i++) { const an = i / 4 * TAU + 0.4, d = 4 + 16 * easeOut(k);
        ctx.fillStyle = i % 2 ? '#FFE08A' : '#FFFFFF'; star(ctx, f.x + Math.cos(an) * d, f.y + Math.sin(an) * d, 4.5 * (1 - k) + 1, 4, 0.35); ctx.fill(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, 16 * (1 - k) + 4, '#FFD45A', 0.7 * (1 - k)); ctx.restore();
      ctx.restore();
    }
  }
  for (let i = local.length - 1; i >= 0; i--) if (local[i].t >= local[i].max) local.splice(i, 1);
}
