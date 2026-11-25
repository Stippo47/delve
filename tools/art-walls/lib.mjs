// Round 19 art lane (walls): the SVG builder and the shared painters the wall options are made from.
// Coordinates are room units (1 SVG unit = 1 room unit). A wall is drawn in its own frame: x = u runs along the wall,
// y = v runs out of the room (v = 0 is the foot, where the wall meets the floor; v < 0 is up the wall, away from the
// room). The face (the wall's inner side, folded flat like the doors' arch) is v in [-F, 0]; the cap (the wall's top,
// seen from above) is v in [-H, -F]. Everything along a wall repeats every P = 160 units, so a run tiles.
export const P = 160;

// ---------------------------------------------------------------- numbers and colours
export const f1 = (n) => (Math.round(n * 10) / 10).toString();
export const hash = (a, b = 0) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
export function shade(h, k) { return hex(rgb(h).map((v) => (k < 0 ? v * (1 + k) : v + (255 - v) * k))); } // k < 0 darker, > 0 lighter
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); }
export const jit = (h, i, j, k) => shade(h, (hash(i, j) - 0.5) * k); // a block's own small difference in tone

// ---------------------------------------------------------------- the builder
export class Svg {
  constructor() { this.defs = []; this.body = []; this.cache = new Map(); this.n = 0; }
  id(p) { return p + (this.n++).toString(36); }
  add(s) { this.body.push(s); return this; }
  // a linear gradient in the shape's own box (x1 y1 x2 y2 in 0..1); stops: [[offset, colour, opacity?], ...]
  lg(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
    const key = 'l' + JSON.stringify([stops, x1, y1, x2, y2]);
    if (!this.cache.has(key)) {
      const id = this.id('g');
      this.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`);
      this.cache.set(key, `url(#${id})`);
    }
    return this.cache.get(key);
  }
  // a linear gradient in user space (room units)
  lgu(stops, x1, y1, x2, y2) {
    const key = 'u' + JSON.stringify([stops, x1, y1, x2, y2]);
    if (!this.cache.has(key)) {
      const id = this.id('g');
      this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`);
      this.cache.set(key, `url(#${id})`);
    }
    return this.cache.get(key);
  }
  rg(stops, cx = 0.4, cy = 0.35, r = 0.7) {
    const key = 'r' + JSON.stringify([stops, cx, cy, r]);
    if (!this.cache.has(key)) {
      const id = this.id('g');
      this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`);
      this.cache.set(key, `url(#${id})`);
    }
    return this.cache.get(key);
  }
  clip(d) { const id = this.id('c'); this.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return `url(#${id})`; }
  open(attrs) { this.body.push(`<g ${attrs}>`); return this; }
  close() { this.body.push('</g>'); return this; }
  svg(viewBox, comment) {
    const [x, y, w, h] = viewBox;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(x)} ${f1(y)} ${f1(w)} ${f1(h)}" width="${f1(w * 4)}" height="${f1(h * 4)}">\n  <!-- ${comment} -->\n  <defs>\n    ${this.defs.join('\n    ')}\n  </defs>\n  <g id="sprite">\n${this.body.join('\n')}\n  </g>\n</svg>\n`;
  }
}

// ---------------------------------------------------------------- paths
export const rrect = (x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); return `M${f1(x + r)} ${f1(y)}H${f1(x + w - r)}Q${f1(x + w)} ${f1(y)} ${f1(x + w)} ${f1(y + r)}V${f1(y + h - r)}Q${f1(x + w)} ${f1(y + h)} ${f1(x + w - r)} ${f1(y + h)}H${f1(x + r)}Q${f1(x)} ${f1(y + h)} ${f1(x)} ${f1(y + h - r)}V${f1(y + r)}Q${f1(x)} ${f1(y)} ${f1(x + r)} ${f1(y)}Z`; };
export const poly = (pts) => 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
// a smooth closed path through the points (Catmull-Rom as cubic Beziers)
export function smooth(pts, t = 1) {
  const n = pts.length; let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * t, p1[1] + (p2[1] - p0[1]) / 6 * t], c2 = [p2[0] - (p3[0] - p1[0]) / 6 * t, p2[1] - (p3[1] - p1[1]) / 6 * t];
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + 'Z';
}
// a lumpy round stone: n points round an ellipse, each pushed in or out a little
export function blob(cx, cy, rx, ry, seed, lump = 0.12, n = 9, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + i / n * Math.PI * 2, k = 1 + (hash(seed, i) - 0.5) * 2 * lump;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(pts);
}
// points along a cubic Bezier
export function bez(p0, p1, p2, p3, n = 18) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return out;
}
// a tapered tube along a line of points (roots, vines, tails): width w0 at the start, w1 at the end
export function tube(pts, w0, w1, shift = 0) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2, p = pts[i];
    L.push([p[0] + nx * (w + shift * w), p[1] + ny * (w + shift * w)]); R.push([p[0] - nx * (w - shift * w), p[1] - ny * (w - shift * w)]);
  }
  return poly([...L, ...R.reverse()]);
}

// ---------------------------------------------------------------- shading pieces
// a soft lit block: a top-to-bottom gradient, a gloss along its top, a darker lip at its foot
export function block(s, x, y, w, h, c, o = {}) {
  const r = o.r ?? 4, lift = o.lift ?? 0.14, drop = o.drop ?? 0.16;
  s.add(`<path d="${rrect(x, y, w, h, r)}" fill="${s.lg([[0, shade(c, lift)], [0.55, c], [1, shade(c, -drop)]], 0, 0, 0.25, 1)}"/>`);
  if (o.gloss !== false && w > 6 && h > 6) {
    const gh = Math.min(h * 0.3, o.glossH ?? 5), gi = Math.min(3, r * 0.6 + 1.2);
    s.add(`<path d="${rrect(x + gi, y + 1.8, w - gi * 2, gh, Math.min(r, gh / 2))}" fill="#FFFFFF" opacity="${o.glossA ?? 0.2}"/>`);
  }
}
// a bulging stone (round, not cut): radial light from the top left
export function stone(s, d, c, o = {}) {
  s.add(`<path d="${d}" fill="${s.rg([[0, shade(c, o.lift ?? 0.2)], [0.6, c], [1, shade(c, -(o.drop ?? 0.22))]], 0.38, 0.3, 0.75)}"/>`);
}
// a band of light or dark over an area: a vertical gradient (v from y0 to y1), a at y0 and b at y1
export function wash(s, x, y0, w, y1, col, a, b) {
  const top = Math.min(y0, y1), h = Math.abs(y1 - y0);
  const st = y0 < y1 ? [[0, col, a], [1, col, b]] : [[0, col, b], [1, col, a]];
  s.add(`<rect x="${f1(x)}" y="${f1(top)}" width="${f1(w)}" height="${f1(h)}" fill="${s.lg(st)}"/>`);
}
// the periodic positions of a thing placed every P along the wall, covering [u0, u1] (with a margin)
export function every(u0, u1, at, m = 80, per = P) {
  const out = [];
  for (let k = Math.floor((u0 - m - at) / per); k * per + at <= u1 + m; k++) out.push(k * per + at);
  return out;
}
// courses of cut blocks between v = yTop and v = yBot, repeating every P. rows: [{ h, w: [widths summing to P], off, col }]
// from the foot upward. col(i, j) gives a block its colour.
export function courses(s, u0, u1, yBot, rows, col, o = {}) {
  let y = yBot;
  rows.forEach((row, j) => {
    const yt = y - row.h;
    for (const base of every(u0, u1, row.off || 0, 80)) {
      let x = base;
      row.w.forEach((bw, i) => {
        const gap = o.gap ?? 3;
        block(s, x + gap / 2, yt + gap / 2, bw - gap, row.h - gap, col(i, j, row), { r: o.r ?? 4, glossA: o.glossA, glossH: o.glossH, lift: o.lift, drop: o.drop });
        if (o.each) o.each(x, yt, bw, row.h, i, j);
        x += bw;
      });
    }
    y = yt;
  });
  return y;
}
// cut the widths into P: a repeating list of sizes, the last one stretched to make P exactly
export function split(sizes, seed = 0) {
  const out = []; let t = 0, i = 0;
  while (t < P) { const w = sizes[(i + seed) % sizes.length]; if (P - t - w < Math.min(...sizes) * 0.6) { out.push(P - t); break; } out.push(w); t += w; i++; }
  return out;
}

// ---------------------------------------------------------------- more painters
// a round-headed rivet / stud / nail
export function rivet(s, x, y, r, c) {
  s.add(`<circle cx="${f1(x + r * 0.15)}" cy="${f1(y + r * 0.2)}" r="${f1(r)}" fill="#1A1020" opacity="0.28"/>`);
  s.add(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${s.rg([[0, shade(c, 0.45)], [0.6, c], [1, shade(c, -0.3)]], 0.35, 0.3, 0.8)}"/>`);
}
// a horizontal cylinder (a pipe, a log lying along the wall, a rail): lit along its top
export function hcyl(s, x, y, w, d, c, r = null) {
  s.add(`<path d="${rrect(x, y, w, d, r ?? d / 2)}" fill="${s.lg([[0, shade(c, 0.3)], [0.25, shade(c, 0.12)], [0.6, c], [1, shade(c, -0.35)]])}"/>`);
  s.add(`<path d="${rrect(x + 3, y + d * 0.14, w - 6, d * 0.16, d * 0.08)}" fill="#FFFFFF" opacity="0.32"/>`);
}
// a vertical cylinder (a post, a log standing up, a column): lit on its left
export function vcyl(s, x, y, w, h, c, r = null) {
  s.add(`<path d="${rrect(x, y, w, h, r ?? Math.min(w / 2, 4))}" fill="${s.lg([[0, shade(c, 0.12)], [0.3, shade(c, 0.24)], [0.65, c], [1, shade(c, -0.36)]], 0, 0, 1, 0)}"/>`);
  s.add(`<path d="${rrect(x + w * 0.22, y + 3, w * 0.13, h - 6, w * 0.06)}" fill="#FFFFFF" opacity="0.26"/>`);
}
// an icicle hanging from (x, y), len long
export function icicle(s, x, y, len, w, c = '#BFE8FA') {
  s.add(`<path d="M${f1(x - w / 2)} ${f1(y)}C${f1(x - w / 2)} ${f1(y + len * 0.45)} ${f1(x - 1)} ${f1(y + len * 0.8)} ${f1(x)} ${f1(y + len)}C${f1(x + 1)} ${f1(y + len * 0.8)} ${f1(x + w / 2)} ${f1(y + len * 0.45)} ${f1(x + w / 2)} ${f1(y)}Z" fill="${s.lg([[0, '#F4FCFF'], [0.5, c], [1, shade(c, -0.25)]], 0, 0, 1, 0.3)}"/>`);
  s.add(`<path d="M${f1(x - w * 0.22)} ${f1(y + 1)}C${f1(x - w * 0.22)} ${f1(y + len * 0.35)} ${f1(x - w * 0.08)} ${f1(y + len * 0.55)} ${f1(x - w * 0.05)} ${f1(y + len * 0.62)}" stroke="#FFFFFF" stroke-width="${f1(Math.max(1, w * 0.16))}" stroke-linecap="round" fill="none" opacity="0.7"/>`);
}
// a lumpy soft band (snow, sand, turf) between v = y0 (its far edge) and a bottom edge that bulges down to about y1
export function lumps(s, u0, u1, y0, y1, seed, c, o = {}) {
  const step = o.step ?? 22, pts = [];
  for (const b of every(u0, u1, 0, 60)) for (let x = 0; x < P; x += step) {
    const xx = b + x, k = hash(seed + x, 3);
    pts.push([xx, y1 - (o.amp ?? 4) * k]);
    pts.push([xx + step * 0.5, y1 + (o.amp ?? 4) * (0.6 + hash(seed + x, 7) * 0.5)]);
  }
  pts.sort((a, b) => a[0] - b[0]);
  const first = pts[0][0], last = pts[pts.length - 1][0];
  let d = `M${f1(first)} ${f1(y0)}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], n = pts[i + 1];
    if (i === 0) d += `L${f1(p[0])} ${f1(p[1])}`;
    if (n) d += `Q${f1(p[0] + (n[0] - p[0]) * 0.5)} ${f1(n[1] + (n[1] - p[1]) * 0.35)} ${f1(n[0])} ${f1(n[1])}`;
  }
  d += `L${f1(last)} ${f1(y0)}Z`;
  s.add(`<path d="${d}" fill="${s.lgu([[0, o.top ?? shade(c, -0.08)], [1, c]], 0, y0, 0, y1 + (o.amp ?? 4))}"/>`);
  return d;
}
// a gear seen face on
export function gear(s, cx, cy, r, teeth, c, hole = '#2B2230') {
  const pts = [];
  for (let i = 0; i < teeth * 4; i++) { const a = i / (teeth * 4) * Math.PI * 2, rr = i % 4 < 2 ? r : r * 0.8; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  s.add(`<path d="${poly(pts)}" fill="${s.rg([[0, shade(c, 0.35)], [0.6, c], [1, shade(c, -0.3)]], 0.35, 0.3, 0.85)}"/>`);
  s.add(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 0.55)}" fill="none" stroke="${shade(c, -0.25)}" stroke-width="${f1(r * 0.1)}" opacity="0.6"/>`);
  s.add(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 0.22)}" fill="${hole}"/>`);
}
// a soft patch of moss or grime: a blob with a soft gradient (never speckle)
export function patch(s, x, y, rx, ry, seed, c, a = 1) {
  s.add(`<path d="${blob(x, y, rx, ry, seed, 0.22, 8)}" fill="${s.rg([[0, shade(c, 0.18)], [0.7, c], [1, c, 0]], 0.4, 0.35, 0.65)}" opacity="${a}"/>`);
}
