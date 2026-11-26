// Round 19 art lane (art-floors): floor terrain, three options for each of the nine dungeons. Code-drawn: each option
// paints the floor surface (flags, bricks, earth, sand, ice, plates...), its detail pieces (cracks, moss, roots,
// ripples, grates, bones, frost, brass plates, gilded inlays) and its edge (what gathers against the walls).
// Nothing here is wired into the game: it is an opt-in preview. floors.html?floor=<id>[,<id>...] (or ?floor=a|b|c for
// that option in every dungeon) loads the game in a frame and installs it; the stills come from tools/art-floors/shoot.mjs.
// It paints into the floor cache through render.js's w.paintGround hook, after the normal floor: everything inside the
// floor's chunks except water channels and free-standing walls, then its own soft shadow at the walls' feet.
// Rules kept: a narrow value range and low contrast (the units must pop off it), big chunky shapes, soft lit
// gradients, light from the screen's top left, no outlines, no speckle or fine noise, dressing never looks solid.
import { TAU, INK, OUTLINES, inkFor } from './util.js'; // (round 19, lane looks19: inkFor)
import { view, OUTLINE } from './render.js';

// ---------------------------------------------------------------- colour, chance, light
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (h, k) => toHex(hx(h).map((v) => (k < 0 ? v * (1 + k) : v + (255 - v) * k)));
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const rgba = (h, a) => { const c = hx(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// The light comes from the screen's top left; portrait turns the room a quarter turn (room +x is screen up).
const LD = () => (view.rot ? [0.7071, -0.7071] : [-0.7071, -0.7071]);
const mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// ---------------------------------------------------------------- shapes
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
// A closed polygon with its corners rounded.
function roundPoly(g, pts, r, add) {
  if (!add) g.beginPath();
  const n = pts.length; g.moveTo(...mid(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const rr = Math.min(r, Math.hypot(p[0] - a[0], p[1] - a[1]) * 0.45, Math.hypot(p[0] - b[0], p[1] - b[1]) * 0.45);
    g.arcTo(p[0], p[1], ...mid(p, b), rr);
  }
  g.closePath();
}
// A smooth closed curve through the midpoints of pts (a soft lobed blob).
function smooth(g, pts, add) {
  if (!add) g.beginPath();
  const n = pts.length; g.moveTo(...mid(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...mid(pts[i], pts[(i + 1) % n]));
  g.closePath();
}
function blobPts(cx, cy, rx, ry, rot, rnd, n = 8, wob = 0.22) {
  const c = Math.cos(rot), s = Math.sin(rot), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i + (rnd() - 0.5) * 0.35) / n * TAU, k = 1 - wob + rnd() * wob * 2, x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return pts;
}
// A tapered stroke (root, ripple, crack) as a filled shape: a centre line with a width at each point.
function taper(g, line, w0, w1, add) {
  if (!add) g.beginPath();
  const L = [], R = [], n = line.length;
  for (let i = 0; i < n; i++) {
    const p = line[i], a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const t = i / (n - 1), wd = (typeof w0 === 'function' ? w0(t) : w0 + (w1 - w0) * t) / 2;
    L.push([p[0] - dy * wd, p[1] + dx * wd]); R.push([p[0] + dy * wd, p[1] - dx * wd]);
  }
  const pts = [...L, ...R.reverse()];
  g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) { const m = mid(pts[i - 1], pts[i]); g.quadraticCurveTo(pts[i - 1][0], pts[i - 1][1], m[0], m[1]); }
  g.lineTo(...pts[pts.length - 1]); g.closePath();
}
function wander(x, y, a, steps, len, turn, rnd) {
  const pts = [[x, y]];
  for (let i = 0; i < steps; i++) { a += (rnd() - 0.5) * turn; x += Math.cos(a) * len; y += Math.sin(a) * len; pts.push([x, y]); }
  return pts;
}
function bez(p0, p1, p2, p3, t) { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; }

// ---------------------------------------------------------------- shading
// A lit gradient over a box, from the side towards the light to the far side.
function litFill(g, box, c, k) {
  const [lx, ly] = LD(), cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2, r = Math.max(box[2], box[3]) / 2;
  const gr = g.createLinearGradient(cx + lx * r, cy + ly * r, cx - lx * r, cy - ly * r);
  gr.addColorStop(0, shade(c, k)); gr.addColorStop(1, shade(c, -k)); return gr;
}
// Bevel: path() filled with fill, a light rim on the side towards the light and a dark rim on the far side, d wide.
// sunk swaps the rims (a hollow, a groove, a puddle). Works on unions of shapes (one path, many sub-paths).
function bev(g, path, fill, d, hi, lo, sunk) {
  const [lx, ly] = LD(); if (sunk) [hi, lo] = [lo, hi];
  g.save(); path(); g.clip();
  g.fillStyle = lo; path(); g.fill();
  g.save(); g.translate(lx * d, ly * d); path(); g.restore(); g.clip();
  g.fillStyle = hi; path(); g.fill();
  g.save(); g.translate(-lx * d, -ly * d); path(); g.restore(); g.clip();
  g.fillStyle = fill; path(); g.fill();
  g.restore();
}
// The usual stone: a lit gradient, rims from its own colour.
function stone(g, path, box, c, o = {}) {
  bev(g, path, litFill(g, box, c, o.k ?? 0.05), o.d ?? 2.4, o.hi || shade(c, o.hk ?? 0.16), o.lo || shade(c, -(o.lk ?? 0.13)), o.sunk);
}
// A soft drop shadow of a shape on the far side (for flat pieces lying on the floor), then the piece.
function lying(g, path, c, box, o = {}) {
  const [lx, ly] = LD(), d = o.sh ?? 2.5;
  g.save(); g.translate(-lx * d, -ly * d); g.fillStyle = o.shadow || 'rgba(30,20,30,0.16)'; path(); g.fill(); g.restore();
  stone(g, path, box, c, o);
}

// ---------------------------------------------------------------- the room
function roomOf(w, seed) {
  const cells = w.cells && w.cells.length ? w.cells : [{ c: 0, r: 0, x: 0, y: 0, w: w.W, h: w.H }];
  const F = new Set(cells.map((c) => c.c + ',' + c.r)), isF = (c, r) => F.has(c + ',' + r);
  const edges = [];
  for (const k of cells) {
    for (const [[oc, or], p0, p1] of [[[0, -1], [k.x, k.y], [k.x + k.w, k.y]], [[0, 1], [k.x, k.y + k.h], [k.x + k.w, k.y + k.h]],
      [[-1, 0], [k.x, k.y], [k.x, k.y + k.h]], [[1, 0], [k.x + k.w, k.y], [k.x + k.w, k.y + k.h]]]) {
      if (!isF(k.c + oc, k.r + or)) edges.push({ p0, p1, o: [oc, or], len: Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) });
    }
  }
  const blocks = (w.walls || []).filter((r) => !r.solid && r.temp == null && !r.prop);
  const water = w.water || [];
  const holes = [
    ...(w.pillars || []).map((p) => [p.x, p.y, p.r + 8]),
    ...(w.doors || []).map((d) => [w.W, d.y, 64]),
    ...(w.doorIn ? [[0, w.doorIn.y, 64]] : []),
  ];
  const inCell = (x, y, m) => cells.some((k) => x > k.x + m && x < k.x + k.w - m && y > k.y + m && y < k.y + k.h - m);
  const inRect = (x, y, r, m) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
  // is (x,y) open floor with room for something of radius r?
  const free = (x, y, r = 20) => inCell(x, y, r * 0.6) && !holes.some(([hx2, hy, hr]) => Math.hypot(x - hx2, y - hy) < hr + r)
    && !water.some((c) => inRect(x, y, c, r + 6)) && !blocks.some((b) => inRect(x, y, b, r + 6));
  const rnd = mulberry(seed ^ Math.round(w.W * 7 + w.H * 13) ^ cells.length * 977);
  const din = w.doorIn ? w.doorIn.y : w.H / 2, outs = (w.doors && w.doors.length ? w.doors : [{ y: w.H / 2 }]).map((d) => d.y);
  // the ways through: a gentle curve from the way in to each door
  const routes = outs.map((oy, i) => {
    const a = [-20, din], b = [w.W + 20, oy], j = (rnd() - 0.5) * 0.3 * w.H;
    const c1 = [w.W * 0.35, din + j], c2 = [w.W * 0.65, oy - j * 0.6];
    return (t) => bez(a, c1, c2, b, t);
  });
  // scatter: points on a jittered grid of the given spacing, kept to open floor
  const scatter = (sp, r, keep = 1) => {
    const out = [];
    for (let y = sp / 2; y < w.H; y += sp) for (let x = sp / 2; x < w.W; x += sp) {
      const px = x + (rnd() - 0.5) * sp * 0.8, py = y + (rnd() - 0.5) * sp * 0.8;
      if (rnd() < keep && free(px, py, r)) out.push([px, py]);
    }
    return out;
  };
  return { w, W: w.W, H: w.H, cells, edges, blocks, water, rnd, free, scatter, routes, area: cells.reduce((a, k) => a + k.w * k.h, 0) };
}

// ---------------------------------------------------------------- room-wide helpers
function base(g, R, c0, c1) {
  const [lx, ly] = LD(), cx = R.W / 2, cy = R.H / 2, r = Math.hypot(R.W, R.H) / 2;
  const gr = g.createLinearGradient(cx + lx * r, cy + ly * r, cx - lx * r, cy - ly * r); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
  g.fillStyle = gr; g.fillRect(-60, -60, R.W + 120, R.H + 120);
}
// Big soft patches (one union, so overlaps never darken): count per 100k square units.
function patches(g, R, { per, r0, r1, col, d = 2, hk = 0.08, lk = 0.08, sunk, flat, alpha, stretch = 0.65, lobes = 9, wob = 0.22, rot }) {
  const n = Math.max(1, Math.round(R.area / 100000 * per)), shapes = [];
  for (let i = 0; i < n; i++) {
    const r = r0 + R.rnd() * (r1 - r0);
    shapes.push(blobPts(R.rnd() * R.W, R.rnd() * R.H, r, r * (stretch + R.rnd() * (1 - stretch)), rot ?? R.rnd() * TAU, R.rnd, lobes, wob));
  }
  const path = () => { g.beginPath(); for (const s of shapes) smooth(g, s, true); };
  if (alpha) { g.save(); g.globalAlpha = alpha; }
  if (flat) { g.fillStyle = col; path(); g.fill(); } else bev(g, path, col, d, shade(col, hk), shade(col, -lk), sunk);
  if (alpha) g.restore();
  return shapes;
}
// A band against every wall: lobes centred on the wall line, one union, raised (drifts, moss) or flat (grime).
function edgeBand(g, R, { depth, step = 40, col, d = 2.5, hk = 0.1, lk = 0.1, flat, alpha, sunk, jitter = 0.5 }) {
  const shapes = [];
  for (const e of R.edges) {
    const n = Math.max(2, Math.ceil(e.len / step));
    for (let i = 0; i <= n; i++) {
      const p = mid(e.p0, e.p1, (i + (R.rnd() - 0.5) * jitter) / n), r = depth * (0.6 + R.rnd() * 0.8);
      const off = depth * (R.rnd() * 0.25);
      shapes.push(blobPts(p[0] - e.o[0] * off, p[1] - e.o[1] * off, r * 1.3, r, e.o[0] ? Math.PI / 2 : 0, R.rnd, 8, 0.18));
    }
  }
  const path = () => { g.beginPath(); for (const s of shapes) smooth(g, s, true); };
  if (alpha) { g.save(); g.globalAlpha = alpha; }
  if (flat) { g.fillStyle = col; path(); g.fill(); } else bev(g, path, col, d, shade(col, hk), shade(col, -lk), sunk);
  if (alpha) g.restore();
}
// A soft darkening that fades in from every wall (grime, soot, cold).
function edgeFade(g, R, col, a, reach) {
  for (const e of R.edges) {
    const m = mid(e.p0, e.p1), gr = g.createLinearGradient(m[0], m[1], m[0] - e.o[0] * reach, m[1] - e.o[1] * reach);
    gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr;
    const x0 = Math.min(e.p0[0], e.p1[0]), y0 = Math.min(e.p0[1], e.p1[1]);
    if (e.o[0]) g.fillRect(e.o[0] < 0 ? x0 : x0 - reach, y0, reach, e.len); else g.fillRect(x0, e.o[1] < 0 ? y0 : y0 - reach, e.len, reach);
  }
}
// The top-down shadow at the foot of every wall and round free-standing walls (as env.js's, which this paints over).
function footShadow(g, R) {
  edgeFade(g, R, '#100A18', 0.2, 24);
  for (const b of R.blocks) for (const [x, y, w2, h2, gx0, gy0, gx1, gy1] of [
    [b.x - 16, b.y, 16, b.h, b.x, 0, b.x - 16, 0], [b.x + b.w, b.y, 16, b.h, b.x + b.w, 0, b.x + b.w + 16, 0],
    [b.x, b.y - 16, b.w, 16, 0, b.y, 0, b.y - 16], [b.x, b.y + b.h, b.w, 16, 0, b.y + b.h, 0, b.y + b.h + 16]]) {
    const gr = g.createLinearGradient(gx0 || x, gy0 || y, gx1 || x, gy1 || y);
    gr.addColorStop(0, 'rgba(16,10,24,0.2)'); gr.addColorStop(1, 'rgba(16,10,24,0)'); g.fillStyle = gr; g.fillRect(x, y, w2, h2);
  }
}

// ---------------------------------------------------------------- surfaces
// Flagstones packed on a grid: each stone 1x1..3x2 units, rounded, lit. each(x, y, w, h, c, i) may add to a stone.
function ashlar(g, R, { u, gap, cols, grout, r = 6, sizes = [[1, 1, 3], [2, 1, 3], [1, 2, 3], [2, 2, 2]], vary = 0.06, o = {}, each, skip }) {
  g.fillStyle = grout; g.fillRect(-10, -10, R.W + 20, R.H + 20);
  const C = Math.ceil(R.W / u) + 1, Rw = Math.ceil(R.H / u) + 1, used = new Uint8Array(C * Rw), tot = sizes.reduce((a, s) => a + s[2], 0);
  let i = 0;
  for (let rr2 = 0; rr2 < Rw; rr2++) for (let c = 0; c < C; c++) {
    if (used[rr2 * C + c]) continue;
    let pick = R.rnd() * tot, sz = sizes[0];
    for (const s of sizes) { pick -= s[2]; if (pick <= 0) { sz = s; break; } }
    let [sw, sh] = sz;
    const fits = (a, b) => { for (let y = 0; y < b; y++) for (let x = 0; x < a; x++) if (c + x >= C || rr2 + y >= Rw || used[(rr2 + y) * C + c + x]) return false; return true; };
    while (!fits(sw, sh)) { if (sw >= sh && sw > 1) sw--; else if (sh > 1) sh--; else break; }
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) used[(rr2 + y) * C + c + x] = 1;
    const x = c * u + gap / 2, y = rr2 * u + gap / 2, ww = sw * u - gap, hh = sh * u - gap;
    if (skip && skip(x + ww / 2, y + hh / 2)) continue;
    const col = shade(cols[Math.floor(R.rnd() * cols.length)], (R.rnd() - 0.5) * 2 * vary);
    stone(g, () => rrect(g, x, y, ww, hh, r), [x, y, ww, hh], col, o);
    if (each) each(x, y, ww, hh, col, i++, sw, sh);
  }
}
// Bricks or setts in a running bond.
function bond(g, R, { tw, th, gap, cols, grout, r = 5, vary = 0.07, shift = 0.5, o = {}, each, noGrout }) {
  if (!noGrout) { g.fillStyle = grout; g.fillRect(-10, -10, R.W + 20, R.H + 20); }
  for (let j = 0, y = 0; y < R.H + th; j++, y += th) for (let x = -(j % 2) * tw * shift - tw * R.rnd() * 0.0; x < R.W + tw; x += tw) {
    const col = shade(cols[Math.floor(R.rnd() * cols.length)], (R.rnd() - 0.5) * 2 * vary);
    stone(g, () => rrect(g, x + gap / 2, y + gap / 2, tw - gap, th - gap, r), [x, y, tw, th], col, o);
    if (each) each(x + gap / 2, y + gap / 2, tw - gap, th - gap, col);
  }
}
// Irregular plates on a jittered grid (ice plates, crazy paving, cracked clay).
function plates(g, R, { S, J, gap, cols, grout, r = 8, vary = 0.06, o = {}, split = 0.25, each }) {
  g.fillStyle = grout; g.fillRect(-10, -10, R.W + 20, R.H + 20);
  const nx = Math.ceil(R.W / S) + 2, ny = Math.ceil(R.H / S) + 2, P = [];
  for (let j = -1; j <= ny; j++) for (let i = -1; i <= nx; i++) P[(j + 1) * (nx + 2) + i + 1] = [i * S + (R.rnd() - 0.5) * 2 * J, j * S + (R.rnd() - 0.5) * 2 * J];
  const at = (i, j) => P[(j + 1) * (nx + 2) + i + 1];
  const shrink = (pts, k) => { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; return pts.map((p) => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; return [p[0] - dx / d * k, p[1] - dy / d * k]; }); };
  for (let j = -1; j < ny; j++) for (let i = -1; i < nx; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1), hv = R.rnd();
    const pieces = hv < split / 2 ? [[a, b, c], [a, c, d]] : hv < split ? [[a, b, d], [b, c, d]] : [[a, b, c, d]];
    for (const pts of pieces) {
      const s = shrink(pts, gap / 2), col = shade(cols[Math.floor(R.rnd() * cols.length)], (R.rnd() - 0.5) * 2 * vary);
      const xs = s.map((p) => p[0]), ys = s.map((p) => p[1]), box = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
      stone(g, () => roundPoly(g, s, r), box, col, o);
      if (each) each(s, box, col);
    }
  }
}
function hexes(g, R, { Rr, gap, cols, grout, r = 6, vary = 0.06, o = {}, each }) {
  g.fillStyle = grout; g.fillRect(-10, -10, R.W + 20, R.H + 20);
  const h = Math.sqrt(3) * Rr;
  for (let i = -1; i * 1.5 * Rr < R.W + Rr * 2; i++) for (let j = -1; j * h < R.H + h; j++) {
    const cx = i * 1.5 * Rr + (R.rnd() - 0.5) * 3, cy = j * h + (i % 2 ? h / 2 : 0) + (R.rnd() - 0.5) * 3, rr2 = Rr - gap / 2;
    const pts = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + (R.rnd() - 0.5) * 0.08; const q = rr2 * (0.94 + R.rnd() * 0.08); pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); }
    const col = shade(cols[Math.floor(R.rnd() * cols.length)], (R.rnd() - 0.5) * 2 * vary);
    stone(g, () => roundPoly(g, pts, r), [cx - rr2, cy - rr2, rr2 * 2, rr2 * 2], col, o);
    if (each) each(cx, cy, pts, col);
  }
}

// ---------------------------------------------------------------- detail pieces (shared)
// A crack: a sunken tapering groove with a branch.
function crack(g, x, y, a, len, rnd, col, wd = 3.2) {
  const n = Math.max(3, Math.round(len / 12)), line = wander(x, y, a, n, len / n, 1.0, rnd);
  const path = () => { g.beginPath(); taper(g, line, (t) => wd * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)), 0, true);
    if (n > 4) { const k = Math.floor(n / 2), br = wander(line[k][0], line[k][1], a + (rnd() > 0.5 ? 0.9 : -0.9), 3, len / n * 0.8, 0.8, mulberry(n * 31 + Math.round(x))); taper(g, br, wd * 0.7, 0.3, true); } };
  bev(g, path, shade(col, -0.22), 1.2, shade(col, 0.1), shade(col, -0.35), true);
}
// A bone lying flat (no ink: dressing), chunky, faint.
function bone(g, x, y, a, L, col = '#D9D0BC') {
  const path = () => { g.beginPath(); g.save(); g.translate(x, y); g.rotate(a);
    g.roundRect(-L / 2, -3, L, 6, 3); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.moveTo(sx * L / 2 + 4.2, sy * 2.8); g.arc(sx * L / 2, sy * 2.8, 4.2, 0, TAU); } g.restore(); };
  lying(g, path, col, [x - L / 2, y - 6, L, 12], { d: 1.6, k: 0.05 });
}
function skull(g, x, y, a, s, col = '#D9D0BC') {
  const path = () => { g.beginPath(); g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.ellipse(0, 0, 10, 9, 0, 0, TAU); g.roundRect(-6, 5, 12, 8, 3); g.restore(); };
  lying(g, path, col, [x - 10 * s, y - 10 * s, 20 * s, 22 * s], { d: 1.6 });
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.fillStyle = shade(col, -0.45);
  for (const k of [-1, 1]) { g.beginPath(); g.ellipse(k * 4, 1, 3, 2.6, 0, 0, TAU); g.fill(); }
  g.restore();
}
function leaf(g, x, y, a, L, col) {
  const path = () => { g.beginPath(); g.save(); g.translate(x, y); g.rotate(a); g.moveTo(-L / 2, 0); g.quadraticCurveTo(0, -L * 0.42, L / 2, 0); g.quadraticCurveTo(0, L * 0.42, -L / 2, 0); g.restore(); };
  lying(g, path, col, [x - L / 2, y - L / 2, L, L], { d: 1.2, sh: 1.5, shadow: 'rgba(30,20,30,0.1)' });
  g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = shade(col, -0.16); g.lineWidth = 1.4; g.beginPath(); g.moveTo(-L * 0.4, 0); g.lineTo(L * 0.38, 0); g.stroke(); g.restore();
}
function leaves(g, x, y, R, cols, n = 5) {
  for (let i = 0; i < n; i++) { const a = R.rnd() * TAU, d = R.rnd() * 18; leaf(g, x + Math.cos(a) * d, y + Math.sin(a) * d, R.rnd() * TAU, 15 + R.rnd() * 7, cols[Math.floor(R.rnd() * cols.length)]); }
}
function pebbles(g, x, y, R, col, n = 4, s = 1) {
  for (let i = 0; i < n; i++) {
    const a = R.rnd() * TAU, d = R.rnd() * 16 * s, r = (5 + R.rnd() * 5) * s, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, pts = blobPts(px, py, r, r * 0.8, R.rnd() * TAU, R.rnd, 6, 0.12);
    lying(g, () => smooth(g, pts), shade(col, (R.rnd() - 0.5) * 0.1), [px - r, py - r, r * 2, r * 2], { d: 1.8 });
  }
}
// A puddle: a sunken lobed pool with a pale rim and a sheen.
function puddle(g, x, y, rx, ry, R, water, rim) {
  const a = R.rnd() * TAU, lobes = [blobPts(x, y, rx, ry, a, R.rnd, 10, 0.1)];
  for (let i = 0; i < 2; i++) { const b = R.rnd() * TAU, d = rx * 0.45; lobes.push(blobPts(x + Math.cos(b) * d, y + Math.sin(b) * d * 0.7, rx * 0.6, ry * 0.75, a, R.rnd, 9, 0.1)); }
  const pts = lobes[0], path = () => { g.beginPath(); for (const l of lobes) smooth(g, l, true); };
  g.save(); g.globalAlpha = 0.5; g.fillStyle = rim; g.translate(0, 0); g.beginPath(); for (const l of lobes) smooth(g, l.map(([px, py]) => [x + (px - x) * 1.18, y + (py - y) * 1.22]), true); g.fill(); g.restore();
  bev(g, path, litFill(g, [x - rx, y - ry, rx * 2, ry * 2], water, 0.06), 2.4, shade(water, 0.25), shade(water, -0.25), true);
  const [lx, ly] = LD();
  g.save(); path(); g.clip(); g.fillStyle = 'rgba(255,255,255,0.2)';
  g.beginPath(); g.ellipse(x + lx * rx * 0.35, y + ly * ry * 0.35, rx * 0.35, Math.max(3, ry * 0.14), Math.atan2(ly, lx) + Math.PI / 2, 0, TAU); g.fill(); g.restore();
}
// A drain grate set into the floor.
function grate(g, x, y, s, a, frame, hole) {
  g.save(); g.translate(x, y); g.rotate(a);
  stone(g, () => rrect(g, -22 * s, -22 * s, 44 * s, 44 * s, 7 * s), [-22 * s, -22 * s, 44 * s, 44 * s], frame, { d: 2.4 });
  for (let i = -1; i <= 1; i++) bev(g, () => rrect(g, i * 12 * s - 4 * s, -15 * s, 8 * s, 30 * s, 3.5 * s), hole, 2, shade(hole, 0.2), shade(hole, -0.3), true);
  g.restore();
}
// Frost feathers: a stem with paired fronds, white and faint.
function fern(g, x, y, a, L, rnd, col = '#FFFFFF', alpha = 0.4) {
  g.save(); g.globalAlpha = alpha; g.fillStyle = col;
  const line = wander(x, y, a, 6, L / 6, 0.5, rnd);
  g.beginPath(); taper(g, line, 5, 1, true);
  for (let i = 1; i < line.length - 1; i++) for (const side of [-1, 1]) {
    const p = line[i], dir = Math.atan2(line[i + 1][1] - p[1], line[i + 1][0] - p[0]) + side * 0.8, l = L * 0.3 * (1 - i / line.length);
    taper(g, [p, [p[0] + Math.cos(dir) * l * 0.5, p[1] + Math.sin(dir) * l * 0.5], [p[0] + Math.cos(dir + side * 0.2) * l, p[1] + Math.sin(dir + side * 0.2) * l]], 3.6, 0.8, true);
  }
  g.fill(); g.restore();
}
function glow(g, x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}

// ---------------------------------------------------------------- the options
// Each: { theme, name, blurb, paint(g, R) }. Ids are <theme>-<option>; a, b, c are their order.
export const FLOORS = {};
const def = (id, theme, name, blurb, paint) => { FLOORS[id] = { id, theme, name, blurb, paint }; };

// ======== The Wildwood: an old forest, then a bandit camp, then the old grove
const WW = { grass: '#A3AE76', grass2: '#98A46B', earth: '#B4A67E', moss: '#8D9E5E', under: '#879759', stone: '#B3B4A0', bark: '#8F8C62', leaves: ['#B9A05E', '#A98457', '#9CAA62', '#B2AD6C'] };
function roots(g, R, col, every = 300) {
  for (const e of R.edges) {
    const n = Math.floor(e.len / every);
    for (let i = 0; i < n; i++) {
      if (R.rnd() < 0.35) continue;
      const p = mid(e.p0, e.p1, (i + 0.3 + R.rnd() * 0.4) / n), a = Math.atan2(-e.o[1], -e.o[0]) + (R.rnd() - 0.5) * 0.9;
      const line = wander(p[0] + e.o[0] * 6, p[1] + e.o[1] * 6, a, 7, 14 + R.rnd() * 8, 0.7, R.rnd);
      if (!R.free(line[4][0], line[4][1], 10)) continue;
      const k = Math.floor(2 + R.rnd() * 3), br = wander(line[k][0], line[k][1], a + (R.rnd() > 0.5 ? 0.8 : -0.8), 4, 11, 0.6, R.rnd);
      lying(g, () => { g.beginPath(); taper(g, line, 22, 3, true); taper(g, br, 12, 2, true); }, col, [p[0] - 60, p[1] - 60, 120, 120], { d: 2.4, k: 0.06, sh: 2, shadow: 'rgba(30,30,10,0.14)' });
    }
  }
}
def('wildwood-loam', 'wildwood', 'Mossy loam', 'Soft forest floor: big moss and bare-earth patches, leaf drifts, roots reaching in from the walls.', (g, R) => {
  base(g, R, shade(WW.grass, 0.03), shade(WW.grass2, -0.02));
  patches(g, R, { per: 1.1, r0: 70, r1: 150, col: WW.earth, sunk: true, d: 2, hk: 0.06, lk: 0.06 });
  patches(g, R, { per: 1.0, r0: 60, r1: 130, col: WW.moss, d: 2.4 });
  patches(g, R, { per: 0.7, r0: 40, r1: 80, col: shade(WW.grass, 0.06), d: 2, lobes: 7 });
  edgeBand(g, R, { depth: 26, col: WW.under, d: 2.5 });
  roots(g, R, WW.bark);
  for (const [x, y] of R.scatter(170, 24, 0.28)) leaves(g, x, y, R, WW.leaves, 4 + Math.floor(R.rnd() * 3));
  for (const [x, y] of R.scatter(260, 20, 0.12)) pebbles(g, x, y, R, WW.stone, 3);
});
def('wildwood-stones', 'wildwood', 'Stepping stones', 'Grass and earth with a trail of big flat stepping stones from the way in to every door, moss on their shady side.', (g, R) => {
  base(g, R, shade(WW.grass, 0.02), shade(WW.grass2, -0.03));
  patches(g, R, { per: 0.9, r0: 70, r1: 140, col: shade(WW.grass, 0.07), d: 2 });
  patches(g, R, { per: 0.5, r0: 50, r1: 110, col: WW.earth, sunk: true, d: 2, hk: 0.05, lk: 0.05 });
  edgeBand(g, R, { depth: 26, col: WW.under, d: 2.5 });
  const placed = [];
  const put = (x, y, r) => {
    if (!R.free(x, y, r * 0.6) || placed.some(([px, py, pr]) => Math.hypot(x - px, y - py) < r + pr + 6)) return;
    placed.push([x, y, r]);
    const pts = blobPts(x, y, r, r * (0.72 + R.rnd() * 0.2), R.rnd() * TAU, R.rnd, 7, 0.12), col = shade(WW.stone, (R.rnd() - 0.5) * 0.08);
    lying(g, () => smooth(g, pts), col, [x - r, y - r, r * 2, r * 2], { d: 2.4, sh: 1.6, k: 0.05, hk: 0.12, lk: 0.1, shadow: 'rgba(40,40,20,0.14)' });
    const [lx, ly] = LD(); // moss on the side away from the light
    g.save(); smooth(g, pts); g.clip(); const m = blobPts(x - lx * r * 0.75, y - ly * r * 0.75, r * 0.7, r * 0.45, Math.atan2(ly, lx) + Math.PI / 2, R.rnd, 7, 0.25);
    bev(g, () => smooth(g, m), WW.moss, 1.5, shade(WW.moss, 0.1), shade(WW.moss, -0.1)); g.restore();
  };
  for (const f of R.routes) { let t = 0.02, k = 0; while (t < 0.99) { const p = f(t), q = f(Math.min(1, t + 0.005)), a = Math.atan2(q[1] - p[1], q[0] - p[0]), len = Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.005;
    const side = (k++ % 2 ? 1 : -1) * (12 + R.rnd() * 14), r = 26 + R.rnd() * 9; put(p[0] - Math.sin(a) * side, p[1] + Math.cos(a) * side, r); t += (r * 2 + 14) / len; } }
  for (const [x, y] of R.scatter(320, 40, 0.15)) put(x, y, 18 + R.rnd() * 10);
  for (const [x, y] of R.scatter(190, 24, 0.22)) leaves(g, x, y, R, WW.leaves, 4);
});
def('wildwood-trail', 'wildwood', 'Worn trail', 'A trodden dirt trail winds from door to door through the grass, wheel ruts down its middle, leaves at its sides.', (g, R) => {
  base(g, R, shade(WW.grass, 0.0), shade(WW.grass2, -0.04));
  patches(g, R, { per: 1.2, r0: 70, r1: 150, col: shade(WW.grass, 0.07), d: 2 });
  patches(g, R, { per: 0.5, r0: 50, r1: 100, col: WW.moss, d: 2 });
  const blobs = [], line = [];
  for (const f of R.routes) for (let t = 0; t <= 1.001; t += 0.012) { const p = f(t); blobs.push(blobPts(p[0], p[1], 66 + R.rnd() * 18, 58 + R.rnd() * 14, R.rnd() * TAU, R.rnd, 8, 0.15)); line.push(p); }
  bev(g, () => { g.beginPath(); for (const b of blobs) smooth(g, b, true); }, litFill(g, [0, 0, R.W, R.H], WW.earth, 0.03), 3, shade(WW.earth, -0.12), shade(WW.earth, 0.1));
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const f of R.routes) for (const side of [-22, 22]) {
    g.beginPath(); for (let t = 0; t <= 1.001; t += 0.01) { const p = f(t), q = f(Math.min(1, t + 0.01)), a = Math.atan2(q[1] - p[1], q[0] - p[0]); const x = p[0] - Math.sin(a) * side, y = p[1] + Math.cos(a) * side; t ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = rgba(shade(WW.earth, -0.2), 0.3); g.lineWidth = 9; g.stroke();
  }
  g.restore();
  edgeBand(g, R, { depth: 26, col: WW.under, d: 2.5 });
  roots(g, R, WW.bark, 380);
  for (let i = 0; i < line.length; i += 9) { const p = line[i], s = R.rnd() > 0.5 ? 1 : -1; const x = p[0] + s * (70 + R.rnd() * 20) * 0.7, y = p[1] + s * (70 + R.rnd() * 20) * 0.7; if (R.free(x, y, 20) && R.rnd() < 0.6) leaves(g, x, y, R, WW.leaves, 4); }
  for (const [x, y] of R.scatter(300, 20, 0.15)) pebbles(g, x, y, R, WW.stone, 3);
});

// ======== The Crypt: vaults, ossuary, royal tombs
const CR = { flag: '#B9B5B3', flag2: '#B2AFB2', grout: '#8E8A92', dust: '#C9C4BE', bone: '#D6CDB9', slate: '#827F8F', marble: '#C3C1C6', marble2: '#B9B7BE', wax: '#E3D9BF' };
def('crypt-flags', 'crypt', 'Grave flags', 'Worn flagstones in mixed sizes, some cracked, now and then a carved tomb slab; dust gathered against the walls.', (g, R) => {
  const tombs = [];
  ashlar(g, R, { u: 46, gap: 5, cols: [CR.flag, CR.flag2, mix(CR.flag, '#C2B6A8', 0.4)], grout: CR.grout, r: 7, vary: 0.05,
    sizes: [[1, 1, 3], [2, 1, 3], [1, 2, 3], [2, 2, 2], [3, 2, 0.5], [2, 3, 0.5]],
    each: (x, y, w, h, col, i, sw, sh) => {
      if (sw * sh >= 6 && R.free(x + w / 2, y + h / 2, 30)) tombs.push([x, y, w, h, col]);
      else if (R.rnd() < 0.13) crack(g, x + w * (0.2 + R.rnd() * 0.3), y + h * (0.2 + R.rnd() * 0.3), R.rnd() * TAU, Math.min(w, h) * 0.8, R.rnd, col);
    } });
  for (const [x, y, w, h, col] of tombs) { // a carved border and a cross, sunk into the slab
    const i = 9, cx = x + w / 2, cy = y + h / 2, long = w > h;
    bev(g, () => { g.beginPath(); g.roundRect(x + i, y + i, w - i * 2, h - i * 2, 5); g.roundRect(x + i + 4, y + i + 4, w - i * 2 - 8, h - i * 2 - 8, 3); }, shade(col, -0.08), 1.2, shade(col, 0.12), shade(col, -0.2), true);
    g.save(); g.fillStyle = 'black';
    const cross = () => { g.beginPath(); if (long) { g.roundRect(cx - 26, cy - 4, 52, 8, 3); g.roundRect(cx + 6, cy - 15, 8, 30, 3); } else { g.roundRect(cx - 4, cy - 26, 8, 52, 3); g.roundRect(cx - 15, cy - 14, 30, 8, 3); } };
    bev(g, cross, shade(col, -0.1), 1.4, shade(col, 0.12), shade(col, -0.22), true); g.restore();
  }
  edgeBand(g, R, { depth: 20, step: 36, col: CR.dust, alpha: 0.7, d: 1.6, hk: 0.06, lk: 0.08 });
  for (const [x, y] of R.scatter(240, 20, 0.2)) { bone(g, x, y, R.rnd() * TAU, 22); bone(g, x + 6, y - 5, R.rnd() * TAU, 17); }
});
def('crypt-cobble', 'crypt', 'Bone-dust cobbles', 'Big rounded cobbles, pale dust in the joints in drifts, scattered bones and a skull or two.', (g, R) => {
  g.fillStyle = CR.grout; g.fillRect(-10, -10, R.W + 20, R.H + 20);
  patches(g, R, { per: 1.2, r0: 70, r1: 140, col: mix(CR.grout, CR.dust, 0.55), flat: true });
  const S = 52;
  for (let j = 0; j * S * 0.86 < R.H + S; j++) for (let i = 0; i * S < R.W + S; i++) {
    const x = i * S + (j % 2) * S / 2 + (R.rnd() - 0.5) * 8, y = j * S * 0.86 + (R.rnd() - 0.5) * 8, r = 21 + R.rnd() * 3;
    const pts = blobPts(x, y, r, r * (0.82 + R.rnd() * 0.15), R.rnd() * TAU, R.rnd, 7, 0.1), col = shade(R.rnd() < 0.5 ? CR.flag : CR.flag2, (R.rnd() - 0.5) * 0.1);
    stone(g, () => smooth(g, pts), [x - r, y - r, r * 2, r * 2], col, { d: 2.4, k: 0.04, hk: 0.1, lk: 0.09 });
  }
  edgeBand(g, R, { depth: 22, step: 36, col: CR.dust, alpha: 0.75, d: 1.6, hk: 0.06, lk: 0.08 });
  for (const [x, y] of R.scatter(200, 22, 0.25)) { const a = R.rnd() * TAU; bone(g, x, y, a, 24); bone(g, x + 7, y + 4, a + 1.2, 18); if (R.rnd() < 0.3) skull(g, x - 14, y + 10, R.rnd() * TAU, 1); }
});
def('crypt-marble', 'crypt', 'Tomb marble', 'Big pale marble slabs with soft veins, slate diamonds set at the corners, a slate border round the room; old candle wax.', (g, R) => {
  const S = 104;
  g.fillStyle = shade(CR.marble, -0.16); g.fillRect(-10, -10, R.W + 20, R.H + 20);
  for (let j = 0; j * S < R.H; j++) for (let i = 0; i * S < R.W; i++) {
    const x = i * S + 2, y = j * S + 2, col = shade((i + j) % 2 ? CR.marble : CR.marble2, (R.rnd() - 0.5) * 0.04);
    stone(g, () => rrect(g, x, y, S - 4, S - 4, 4), [x, y, S, S], col, { d: 2, k: 0.04 });
    if (R.rnd() < 0.55) { // a soft vein
      g.save(); rrect(g, x, y, S - 4, S - 4, 4); g.clip(); g.strokeStyle = R.rnd() < 0.5 ? 'rgba(255,255,255,0.3)' : rgba(shade(col, -0.25), 0.25); g.lineWidth = 3 + R.rnd() * 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + R.rnd() * S, y - 4); g.bezierCurveTo(x + S * R.rnd(), y + S * 0.35, x + S * R.rnd(), y + S * 0.65, x + R.rnd() * S, y + S + 4); g.stroke(); g.restore();
    }
  }
  for (let j = 1; j * S < R.H; j++) for (let i = 1; i * S < R.W; i++) {
    const x = i * S, y = j * S; stone(g, () => roundPoly(g, [[x, y - 15], [x + 15, y], [x, y + 15], [x - 15, y]], 3), [x - 15, y - 15, 30, 30], CR.slate, { d: 2 });
  }
  for (const e of R.edges) { // the slate border: a band inside the wall with a pale inlaid line
    const q = (a, b) => { const P = (p, t) => [p[0] - e.o[0] * t, p[1] - e.o[1] * t]; return [P(e.p0, a), P(e.p1, a), P(e.p1, b), P(e.p0, b)]; };
    stone(g, () => { g.beginPath(); const p = q(0, 26); g.moveTo(...p[0]); for (const k of p.slice(1)) g.lineTo(...k); g.closePath(); }, [0, 0, R.W, R.H], shade(CR.slate, 0.12), { d: 2 });
    g.fillStyle = rgba(CR.marble, 0.6); g.beginPath(); const p = q(15, 19); g.moveTo(...p[0]); for (const k of p.slice(1)) g.lineTo(...k); g.closePath(); g.fill();
  }
  for (const [x, y] of R.scatter(230, 22, 0.25)) for (let k = 0; k < 2 + Math.floor(R.rnd() * 2); k++) {
    const px = x + (R.rnd() - 0.5) * 30, py = y + (R.rnd() - 0.5) * 30, r = 7 + R.rnd() * 7, pts = blobPts(px, py, r, r * 0.85, 0, R.rnd, 7, 0.2);
    lying(g, () => smooth(g, pts), CR.wax, [px - r, py - r, r * 2, r * 2], { d: 1.6, sh: 1.5, shadow: 'rgba(30,20,30,0.1)' });
  }
});

// ======== The Sewers: drains, cistern, nest
const SW = { brick: '#B2B594', brick2: '#A9AE8E', brick3: '#B7AE90', grout: '#7E8266', moss: '#8A9E5C', damp: '#8F9677', water: '#6E8C84', rim: '#C6C9AC', iron: '#6F756A', hole: '#3A4038', sett: '#A8AE9A', tile: '#B6C8B2', tile2: '#A9BCA6', tileGrout: '#909C88' };
def('sewers-brick', 'sewers', 'Wet brick', 'Rounded bricks in a running bond, big damp patches with a wet sheen, moss creeping from the walls, drain grates and puddles.', (g, R) => {
  bond(g, R, { tw: 80, th: 40, gap: 5, cols: [SW.brick, SW.brick2, SW.brick3], grout: shade(SW.grout, 0.12), r: 8, vary: 0.04, o: { d: 2.6, hk: 0.14, lk: 0.12 } });
  for (const [x, y] of R.scatter(230, 0, 0.55)) for (let k = 0; k < 3; k++) { // damp: soft dark stains with no edge
    const r = 50 + R.rnd() * 60, px = x + (R.rnd() - 0.5) * 80, py = y + (R.rnd() - 0.5) * 80, gr = g.createRadialGradient(px, py, 0, px, py, r);
    gr.addColorStop(0, 'rgba(36,54,36,0.16)'); gr.addColorStop(0.6, 'rgba(36,54,36,0.1)'); gr.addColorStop(1, 'rgba(36,54,36,0)'); g.fillStyle = gr; g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill(); }
  edgeBand(g, R, { depth: 24, col: SW.moss, d: 2.2, alpha: 0.9 });
  for (const [x, y] of R.scatter(330, 34, 0.35)) grate(g, x, y, 1, 0, SW.iron, SW.hole);
  for (const [x, y] of R.scatter(280, 50, 0.3)) puddle(g, x, y, 34 + R.rnd() * 12, 24 + R.rnd() * 8, R, SW.water, SW.rim);
});
def('sewers-setts', 'sewers', 'Mossy setts', 'Square stone setts with moss filling the joints in patches, round manhole covers, algae along the walls.', (g, R) => {
  g.fillStyle = SW.grout; g.fillRect(-10, -10, R.W + 20, R.H + 20);
  patches(g, R, { per: 1.5, r0: 60, r1: 130, col: SW.moss, flat: true });
  bond(g, R, { tw: 48, th: 48, gap: 5, cols: [SW.sett, shade(SW.sett, -0.04), mix(SW.sett, SW.brick3, 0.5)], grout: SW.grout, r: 6, vary: 0.05, shift: 0.5, noGrout: true });
  edgeBand(g, R, { depth: 22, col: shade(SW.moss, -0.04), d: 2.2, alpha: 0.85 });
  for (const [x, y] of R.scatter(360, 40, 0.4)) { // a manhole cover
    stone(g, () => { g.beginPath(); g.arc(x, y, 30, 0, TAU); }, [x - 30, y - 30, 60, 60], mix(SW.iron, SW.sett, 0.45), { d: 2.6 });
    bev(g, () => { g.beginPath(); g.arc(x, y, 22, 0, TAU); g.arc(x, y, 18, 0, TAU, true); }, shade(SW.iron, -0.1), 1.2, shade(SW.iron, 0.15), shade(SW.iron, -0.3), true);
    for (const k of [-1, 1]) bev(g, () => rrect(g, x - 3 + k * 7, y - 9, 6, 18, 3), mix(SW.hole, SW.iron, 0.5), 1.4, shade(SW.iron, 0.1), shade(SW.hole, -0.2), true);
  }
  for (const [x, y] of R.scatter(300, 46, 0.25)) puddle(g, x, y, 32 + R.rnd() * 10, 22 + R.rnd() * 6, R, SW.water, SW.rim);
});
def('sewers-tile', 'sewers', 'Cistern tiles', 'Old pale-green glazed tiles with a darker border row, a few missing down to the mortar, grime gathered at the walls.', (g, R) => {
  const S = 40, holes = new Set();
  g.fillStyle = SW.tileGrout; g.fillRect(-10, -10, R.W + 20, R.H + 20);
  for (let j = 0; j * S < R.H; j++) for (let i = 0; i * S < R.W; i++) {
    const x = i * S + 2, y = j * S + 2, cx = x + S / 2, cy = y + S / 2;
    const edge = Math.min(cx, cy, R.W - cx, R.H - cy) < S * 1.5;
    if (!edge && R.rnd() < 0.05 && R.free(cx, cy, 10)) { holes.add(i + ',' + j); bev(g, () => rrect(g, x, y, S - 4, S - 4, 3), '#8A8C74', 2, '#A2A48A', '#6E705C', true); continue; }
    const col = shade(edge ? shade(SW.tile2, -0.12) : (i + j) % 2 ? SW.tile : SW.tile2, (R.rnd() - 0.5) * 0.05);
    stone(g, () => rrect(g, x, y, S - 4, S - 4, 5), [x, y, S, S], col, { d: 2, k: 0.06, hk: 0.2 });
  }
  edgeFade(g, R, '#3C4434', 0.22, 70);
  for (const [x, y] of R.scatter(340, 34, 0.35)) grate(g, x, y, 1, 0, SW.iron, SW.hole);
  for (const [x, y] of R.scatter(300, 46, 0.25)) puddle(g, x, y, 32 + R.rnd() * 10, 22 + R.rnd() * 6, R, SW.water, SW.rim);
});

// ======== The Warren: burrows, war camp, the pit
const WR = { earth: '#CDB089', earth2: '#BFA07A', worn: '#D7BE98', loam: '#B39270', pebble: '#BCAA94', straw: '#D6BA72', straw2: '#C2A05A', plank: '#B99368', flag: '#C9B190', grout: '#9C7E5A' };
function straw(g, x, y, R) {
  const n = 9;
  for (let i = 0; i < n; i++) { const a = R.rnd() * 1.2 - 0.6 + (i % 2) * Math.PI / 2 * 0.3, L = 16 + R.rnd() * 12, sx = x + (R.rnd() - 0.5) * 26, sy = y + (R.rnd() - 0.5) * 18;
    lying(g, () => taper(g, [[sx - Math.cos(a) * L / 2, sy - Math.sin(a) * L / 2], [sx, sy], [sx + Math.cos(a) * L / 2, sy + Math.sin(a) * L / 2]], 3.6, 2.4), i % 3 ? WR.straw : WR.straw2, [sx - L, sy - L, L * 2, L * 2], { d: 1, sh: 1.4, shadow: 'rgba(60,40,20,0.14)' }); }
}
function earthFloor(g, R) {
  base(g, R, shade(WR.earth, 0.02), shade(WR.earth2, -0.02));
  patches(g, R, { per: 1.0, r0: 80, r1: 160, col: WR.worn, d: 2, hk: 0.05, lk: 0.06 });
  patches(g, R, { per: 0.8, r0: 50, r1: 110, col: WR.loam, sunk: true, d: 2, hk: 0.06, lk: 0.06 });
}
function dugEdge(g, R) {
  edgeBand(g, R, { depth: 24, col: shade(WR.loam, -0.04), d: 2.4, hk: 0.1, lk: 0.12 });
  roots(g, R, '#9E8464', 360);
}
def('warren-earth', 'warren', 'Trodden earth', 'Packed earth worn pale where feet go, dark loam hollows, pebble clusters and straw, a dug lip with root ends at the walls.', (g, R) => {
  earthFloor(g, R); dugEdge(g, R);
  for (const [x, y] of R.scatter(220, 24, 0.3)) pebbles(g, x, y, R, WR.pebble, 4);
  for (const [x, y] of R.scatter(230, 26, 0.28)) straw(g, x, y, R);
});
def('warren-boards', 'warren', 'Plank walks', 'Earth with crooked goblin boardwalks laid door to door, nailed planks, a few loose ones kicked aside.', (g, R) => {
  earthFloor(g, R); dugEdge(g, R);
  const board = (x, y, a, L, Wd) => {
    const col = shade(WR.plank, (R.rnd() - 0.5) * 0.12), c = Math.cos(a), s = Math.sin(a);
    const path = () => { g.beginPath(); g.save(); g.translate(x, y); g.rotate(a); g.roundRect(-L / 2, -Wd / 2, L, Wd, 4); g.restore(); };
    lying(g, path, col, [x - L / 2, y - L / 2, L, L], { d: 2.2, sh: 2.4, hk: 0.12, lk: 0.12 });
    g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = rgba(shade(col, -0.25), 0.5); g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-L * 0.38, -Wd * 0.12); g.lineTo(L * 0.18, -Wd * 0.12); g.moveTo(-L * 0.1, Wd * 0.2); g.lineTo(L * 0.36, Wd * 0.2); g.stroke();
    g.fillStyle = shade(col, -0.4); for (const k of [-1, 1]) { g.beginPath(); g.arc(k * (L / 2 - 8), 0, 2.2, 0, TAU); g.fill(); }
    g.restore(); return [c, s];
  };
  for (const f of R.routes) for (let t = 0.02; t < 0.99; t += 0.0) {
    const p = f(t), q = f(Math.min(1, t + 0.005)), a = Math.atan2(q[1] - p[1], q[0] - p[0]), len = Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.005;
    if (R.free(p[0], p[1], 26)) board(p[0], p[1], a + Math.PI / 2 + (R.rnd() - 0.5) * 0.12, 92 + R.rnd() * 14, 32 + R.rnd() * 3);
    t += 36 / len;
  }
  for (const [x, y] of R.scatter(300, 50, 0.2)) board(x, y, R.rnd() * TAU, 64 + R.rnd() * 20, 28);
  for (const [x, y] of R.scatter(250, 26, 0.22)) straw(g, x, y, R);
});
def('warren-ruin', 'warren', 'Broken flags', 'Old dwarf-cut flagstones the goblins never kept up: whole stretches gone to earth, rubble at the broken edges.', (g, R) => {
  earthFloor(g, R);
  const holes = []; for (let i = 0, n = Math.max(3, Math.round(R.area / 200000)); i < n; i++) holes.push([R.rnd() * R.W, R.rnd() * R.H, 120 + R.rnd() * 100]);
  const inHole = (x, y) => holes.some(([hx2, hy, hr]) => Math.hypot(x - hx2, y - hy) < hr * (0.85 + 0.3 * Math.sin(x * 0.05 + y * 0.03)));
  // the flags, skipping the holes (each laid over the earth with a soft shadow, so the holes read as sunken)
  const u = 60, C = Math.ceil(R.W / u) + 1;
  for (let j = 0; j * u < R.H + u; j++) for (let i = 0; i < C; i += 1) {
    const w2 = R.rnd() < 0.45 ? 2 : 1, x = i * u + 3, y = j * u + 3, ww = w2 * u - 6, hh = u - 6;
    if (R.rnd() < 0.04) { if (w2 === 2) i++; continue; }
    if (inHole(x + ww / 2, y + hh / 2)) { if (w2 === 2) i++; continue; }
    lying(g, () => rrect(g, x, y, ww, hh, 7), shade(WR.flag, (R.rnd() - 0.5) * 0.1), [x, y, ww, hh], { d: 2.4, sh: 3, shadow: 'rgba(60,40,20,0.28)' });
    if (w2 === 2) i++;
  }
  dugEdge(g, R);
  for (const [hx2, hy, hr] of holes) for (let k = 0; k < 5; k++) { const a = R.rnd() * TAU, x = hx2 + Math.cos(a) * hr * 0.8, y = hy + Math.sin(a) * hr * 0.8; if (R.free(x, y, 16)) pebbles(g, x, y, R, WR.flag, 3, 1.1); }
  for (const [x, y] of R.scatter(280, 26, 0.2)) straw(g, x, y, R);
});

// Wind-made swells (snow drifts, dunes): a wide soft body along a gentle curve, a shade on the side away from the
// light, a bright crest on the side towards it. No edges: three see-through tapered fills.
function swells(g, R, { sp, keep, wind, body, lee, crest, L0 = 200, L1 = 340, W0 = 64, W1 = 84, a = [0.5, 0.8, 0.6] }) {
  const [lx, ly] = LD();
  for (const [x, y] of R.scatter(sp, 50, keep)) {
    const L = L0 + R.rnd() * (L1 - L0), an = wind + (R.rnd() - 0.5) * 0.3, bend = (R.rnd() - 0.5) * 50, line = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12 - 0.5; line.push([x + Math.cos(an) * L * t - Math.sin(an) * bend * (1 - 4 * t * t), y + Math.sin(an) * L * t + Math.cos(an) * bend * (1 - 4 * t * t)]); }
    const nx = -Math.sin(an), ny = Math.cos(an), side = nx * lx + ny * ly > 0 ? 1 : -1, off = (k) => line.map(([px, py]) => [px + nx * side * k, py + ny * side * k]);
    const W = W0 + R.rnd() * (W1 - W0), sw = (w0) => (t) => w0 * Math.sin(Math.PI * t) ** 0.6;
    g.save(); g.globalAlpha = a[0]; g.fillStyle = lee; taper(g, off(-W * 0.22), sw(W * 0.55), 0); g.fill();
    g.globalAlpha = a[1]; g.fillStyle = body; taper(g, line, sw(W * 0.7), 0); g.fill();
    g.globalAlpha = a[2]; g.fillStyle = crest; taper(g, off(W * 0.12), sw(W * 0.2), 0); g.fill();
    g.restore();
  }
}
// ======== The Frost Hollow: snowfield, web caves, glacier heart
const FR = { snow: '#D5E1EA', snow2: '#C9D7E1', drift: '#DEE8EF', ice: '#BDD3E2', plate: '#C3D6E4', crack: '#97AEC2', flag: '#B3C2CF', rime: '#E8EFF4' };
function icePatch(g, x, y, rx, ry, R) {
  const pts = blobPts(x, y, rx, ry, R.rnd() * TAU, R.rnd, 10, 0.1);
  bev(g, () => smooth(g, pts), litFill(g, [x - rx, y - ry, rx * 2, ry * 2], FR.ice, 0.07), 2.4, '#E7F1F7', shade(FR.ice, -0.18), true);
  const [lx, ly] = LD(); g.save(); smooth(g, pts); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineCap = 'round';
  for (const [o, wd] of [[0.2, 5], [0.42, 3]]) { g.lineWidth = wd; g.beginPath(); const cx = x + lx * rx * o, cy = y + ly * ry * o, a = Math.atan2(ly, lx) + Math.PI / 2; g.moveTo(cx - Math.cos(a) * rx * 0.35, cy - Math.sin(a) * rx * 0.35); g.lineTo(cx + Math.cos(a) * rx * 0.35, cy + Math.sin(a) * rx * 0.35); g.stroke(); }
  g.restore();
}
def('frost-snow', 'frost', 'Packed snow', 'Trodden snow with long soft drifts all lying one way, glassy ice patches, banks of snow piled against the walls.', (g, R) => {
  base(g, R, shade(FR.snow, 0.03), shade(FR.snow2, -0.02));
  const wind = R.rnd() * TAU;
  patches(g, R, { per: 0.6, r0: 90, r1: 170, col: shade(FR.snow, 0.03), flat: true, alpha: 0.6 });
  swells(g, R, { sp: 250, keep: 0.7, wind, body: FR.drift, lee: shade(FR.snow2, -0.07), crest: '#F6F9FB' });
  for (const [x, y] of R.scatter(300, 50, 0.4)) icePatch(g, x, y, 34 + R.rnd() * 18, 26 + R.rnd() * 10, R);
  edgeBand(g, R, { depth: 32, step: 44, col: '#E6EEF3', d: 3, hk: 0.5, lk: 0.1 });
});
def('frost-ice', 'frost', 'Glacier plates', 'Big pale-blue ice plates split by blue cracks, frost feathers growing across them, a few bubbles caught inside.', (g, R) => {
  plates(g, R, { S: 118, J: 30, gap: 6, cols: [FR.plate, shade(FR.plate, -0.03), mix(FR.plate, '#CFDCE4', 0.5)], grout: FR.crack, r: 10, vary: 0.04, o: { d: 2.6, hi: '#E6F0F6', k: 0.06 }, split: 0.3,
    each: (s, box) => { if (R.rnd() < 0.5) { g.save(); roundPoly(g, s, 10); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 14; g.lineCap = 'round'; const a = R.rnd() * TAU, cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
      g.beginPath(); g.moveTo(cx - Math.cos(a) * box[2], cy - Math.sin(a) * box[3]); g.lineTo(cx + Math.cos(a) * box[2], cy + Math.sin(a) * box[3]); g.stroke(); g.restore(); } } });
  for (const [x, y] of R.scatter(200, 30, 0.35)) fern(g, x, y, R.rnd() * TAU, 50 + R.rnd() * 30, R.rnd, '#FFFFFF', 0.38);
  for (const [x, y] of R.scatter(300, 20, 0.3)) for (let k = 0; k < 3; k++) { const r = 4 + R.rnd() * 4, bx = x + (R.rnd() - 0.5) * 22, by = y + (R.rnd() - 0.5) * 22;
    bev(g, () => { g.beginPath(); g.arc(bx, by, r, 0, TAU); }, mix(FR.plate, '#FFFFFF', 0.35), 1.4, '#FFFFFF', shade(FR.plate, -0.15), true); }
  edgeBand(g, R, { depth: 22, step: 40, col: '#E2EBF1', d: 2.5, hk: 0.5, lk: 0.08 });
});
def('frost-rime', 'frost', 'Rimed flags', 'Blue-grey flagstones with snow packed in the joints, rime creeping in from the walls, frost feathers on the stone.', (g, R) => {
  ashlar(g, R, { u: 62, gap: 6, cols: [FR.flag, shade(FR.flag, -0.04), mix(FR.flag, '#C0C6D2', 0.5)], grout: mix(FR.rime, FR.flag, 0.35), r: 9, vary: 0.04, o: { d: 2.4, k: 0.05, hk: 0.2, lk: 0.1 } });
  edgeBand(g, R, { depth: 40, step: 46, col: FR.rime, alpha: 0.75, flat: true });
  edgeBand(g, R, { depth: 20, step: 40, col: '#EEF3F7', d: 2.5, hk: 0.5, lk: 0.08 });
  for (const [x, y] of R.scatter(210, 30, 0.35)) fern(g, x, y, R.rnd() * TAU, 46 + R.rnd() * 26, R.rnd, '#F4F8FB', 0.45);
  for (const [x, y] of R.scatter(330, 44, 0.3)) icePatch(g, x, y, 34 + R.rnd() * 20, 22 + R.rnd() * 10, R);
});

// ======== The Ember Deep: ash wastes, the forges, the ash throne
const EM = { basalt: '#836A5E', basalt2: '#7A6257', grout: '#4E3A33', ash: '#A39088', ash2: '#8F7A70', rope: '#76605A', brick: '#8C5F50', brick2: '#7F574A', bgrout: '#4C332C', slag: '#5C3F36' };
function fissure(g, x, y, a, len, R) {
  const n = Math.max(3, Math.round(len / 14)), line = wander(x, y, a, n, len / n, 0.9, R.rnd);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(255,110,40,0.12)'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); line.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke();
  g.restore();
  g.fillStyle = '#5A2A1C'; taper(g, line, (t) => 6 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)), 0); g.fill();
  g.fillStyle = '#E8763A'; taper(g, line, (t) => 3 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)), 0); g.fill();
}
function cinders(g, x, y, R) {
  for (let i = 0; i < 4; i++) { const a = R.rnd() * TAU, d = R.rnd() * 14, r = 5 + R.rnd() * 4, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, pts = blobPts(px, py, r, r * 0.8, R.rnd() * TAU, R.rnd, 6, 0.15);
    lying(g, () => smooth(g, pts), '#5E4842', [px - r, py - r, r * 2, r * 2], { d: 1.6 });
    if (R.rnd() < 0.5) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, px, py, r * 1.1, '255,120,50', 0.35); g.restore(); } }
}
def('ember-basalt', 'ember', 'Basalt columns', 'The flat tops of basalt columns, a faint ember glow down some of the joints, ash drifted against the walls.', (g, R) => {
  const hot = [];
  hexes(g, R, { Rr: 46, gap: 6, cols: [EM.basalt, EM.basalt2, mix(EM.basalt, '#8A7060', 0.5)], grout: EM.grout, r: 8, vary: 0.05, o: { d: 2.6, hk: 0.14 },
    each: (cx, cy, pts) => { if (R.rnd() < 0.12 && R.free(cx, cy, 10)) { const k = Math.floor(R.rnd() * 6); hot.push([pts[k], pts[(k + 1) % 6], pts[(k + 2) % 6]]); } } });
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'; // ember light down a few joints
  for (const [a, b, c] of hot) for (const [wd, al] of [[14, 0.08], [6, 0.16], [2.4, 0.35]]) { g.strokeStyle = `rgba(255,110,40,${al})`; g.lineWidth = wd; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.stroke(); }
  g.restore();
  edgeBand(g, R, { depth: 24, step: 40, col: EM.ash, d: 2, hk: 0.1, lk: 0.1, alpha: 0.85 });
  for (const [x, y] of R.scatter(280, 24, 0.3)) cinders(g, x, y, R);
});
def('ember-ash', 'ember', 'Ash and lava ropes', 'Warm grey ash over old lava: long ropy ridges where the flow cooled, a glowing fissure here and there.', (g, R) => {
  base(g, R, shade(EM.ash2, 0.04), shade(EM.ash2, -0.06));
  patches(g, R, { per: 1.0, r0: 80, r1: 160, col: shade(EM.ash, -0.04), d: 2, hk: 0.06, lk: 0.06 });
  const flows = Math.max(2, Math.round(R.area / 260000));
  for (let f = 0; f < flows; f++) {
    let x = R.rnd() * R.W, y = R.rnd() < 0.5 ? -20 : R.H + 20, a = y < 0 ? Math.PI / 2 : -Math.PI / 2; a += (R.rnd() - 0.5) * 0.8;
    const line = wander(x, y, a, 18, 50, 0.5, R.rnd), wd = 60 + R.rnd() * 30, lobes = [];
    for (let i = 0; i < line.length; i++) { const [px, py] = line[i], r = wd * (0.4 + R.rnd() * 0.25); lobes.push(blobPts(px + (R.rnd() - 0.5) * wd * 0.4, py + (R.rnd() - 0.5) * wd * 0.4, r * 1.2, r, R.rnd() * TAU, R.rnd, 8, 0.15)); }
    lying(g, () => { g.beginPath(); for (const l of lobes) smooth(g, l, true); }, EM.rope, [0, 0, R.W, R.H], { d: 3, sh: 3, k: 0.04, hk: 0.12, lk: 0.12 });
  }
  edgeBand(g, R, { depth: 28, step: 42, col: EM.ash, d: 2, hk: 0.1, lk: 0.1 });
  for (const [x, y] of R.scatter(320, 40, 0.35)) fissure(g, x, y, R.rnd() * TAU, 60 + R.rnd() * 40, R);
  for (const [x, y] of R.scatter(260, 24, 0.25)) cinders(g, x, y, R);
});
def('ember-brick', 'ember', 'Scorched brick', 'Dark red forge brick with soot scorches, cooled slag spills with a last glow at their rim, soot thick at the walls.', (g, R) => {
  bond(g, R, { tw: 84, th: 42, gap: 6, cols: [EM.brick, EM.brick2, mix(EM.brick, '#7E6A60', 0.4)], grout: shade(EM.bgrout, 0.1), r: 8, vary: 0.04, o: { d: 2.6, hk: 0.12, lk: 0.14 } });
  for (const [x, y] of R.scatter(240, 30, 0.4)) { const r = 50 + R.rnd() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(30,16,12,0.32)'); gr.addColorStop(0.6, 'rgba(30,16,12,0.16)'); gr.addColorStop(1, 'rgba(30,16,12,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  edgeFade(g, R, '#1E100C', 0.3, 60);
  for (const [x, y] of R.scatter(300, 40, 0.35)) {
    const rx = 28 + R.rnd() * 14, pts = blobPts(x, y, rx, rx * 0.65, R.rnd() * TAU, R.rnd, 9, 0.22), rim = blobPts(x, y, rx + 5, rx * 0.65 + 5, 0, R.rnd, 9, 0.18);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,110,40,0.14)'; smooth(g, rim); g.fill(); g.restore();
    bev(g, () => smooth(g, pts), litFill(g, [x - rx, y - rx, rx * 2, rx * 2], EM.slag, 0.06), 2.2, shade(EM.slag, 0.3), shade(EM.slag, -0.2), true);
  }
});

// ======== The Gilded Spire: the steps, the choir halls, the sanctum
const SP = { marble: '#E5DBC4', marble2: '#DDD2B9', grout: '#CBBE9F', gold: '#D3B160', lav: '#CFC6D6', lav2: '#C4BACF', flag: '#E9E1CE' };
function rosette(g, x, y, r, col) {
  const pts = []; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, q = k % 2 ? r * 0.5 : r; pts.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); }
  stone(g, () => roundPoly(g, pts, 1.5), [x - r, y - r, r * 2, r * 2], col, { d: 1.8, hk: 0.3, k: 0.1 });
  stone(g, () => { g.beginPath(); g.arc(x, y, r * 0.32, 0, TAU); }, [x - r, y - r, r * 2, r * 2], shade(col, 0.1), { d: 1.4, hk: 0.3 });
}
def('spire-inlay', 'spire', 'Gilded marble', 'Cream marble slabs in a soft checker, a grid of gold inlay every second joint, gold rosettes where the lines cross.', (g, R) => {
  const S = 96;
  g.fillStyle = SP.grout; g.fillRect(-10, -10, R.W + 20, R.H + 20);
  for (let j = 0; j * S < R.H; j++) for (let i = 0; i * S < R.W; i++) {
    const x = i * S + 1.5, y = j * S + 1.5, col = shade((i + j) % 2 ? SP.marble : SP.marble2, (R.rnd() - 0.5) * 0.03);
    stone(g, () => rrect(g, x, y, S - 3, S - 3, 3), [x, y, S, S], col, { d: 1.8, k: 0.04, hk: 0.3 });
    if (R.rnd() < 0.5) { g.save(); rrect(g, x, y, S - 3, S - 3, 3); g.clip(); const c = blobPts(x + R.rnd() * S, y + R.rnd() * S, S * 0.5, S * 0.22, R.rnd() * TAU, R.rnd, 8, 0.3);
      g.fillStyle = R.rnd() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(190,170,130,0.12)'; smooth(g, c); g.fill(); g.restore(); }
  }
  const G = S * 2, line = (x0, y0, x1, y1) => { g.beginPath(); g.roundRect(Math.min(x0, x1) - 5, Math.min(y0, y1) - 5, Math.abs(x1 - x0) + 10, Math.abs(y1 - y0) + 10, 5); };
  for (let x = G; x < R.W; x += G) stone(g, () => line(x, 0, x, R.H), [x - 3, 0, 6, 6], SP.gold, { d: 1.4, hk: 0.3, k: 0.08 });
  for (let y = G; y < R.H; y += G) stone(g, () => line(0, y, R.W, y), [0, y - 3, 6, 6], SP.gold, { d: 1.4, hk: 0.3, k: 0.08 });
  for (let y = G; y < R.H; y += G) for (let x = G; x < R.W; x += G) rosette(g, x, y, 26, SP.gold);
  edgeFade(g, R, '#8A7A5A', 0.14, 40);
});
def('spire-sectile', 'spire', 'Opus sectile', 'Cut-stone octagons in cream with small lavender and gold squares between them, a lavender band round the walls.', (g, R) => {
  const P = 78, s = P / (1 + Math.SQRT2), k = s / Math.SQRT2; // octagon side s; k: corner cut
  g.fillStyle = shade(SP.grout, -0.04); g.fillRect(-10, -10, R.W + 20, R.H + 20);
  let n = 0;
  for (let j = 0; j * P < R.H + P; j++) for (let i = 0; i * P < R.W + P; i++) {
    const x = i * P, y = j * P, gp = 2.2, a = k + gp * 0.4, b = P - k - gp * 0.4;
    const oct = [[x + a, y + gp], [x + b, y + gp], [x + P - gp, y + a], [x + P - gp, y + b], [x + b, y + P - gp], [x + a, y + P - gp], [x + gp, y + b], [x + gp, y + a]];
    stone(g, () => roundPoly(g, oct, 3), [x, y, P, P], shade((i + j) % 2 ? SP.marble : SP.flag, (R.rnd() - 0.5) * 0.03), { d: 1.8, hk: 0.3, k: 0.04 });
    const cx = x + P, cy = y + P, q = k - gp; // the small square at the corner where four octagons meet
    const sq = [[cx, cy - q], [cx + q, cy], [cx, cy + q], [cx - q, cy]], gold = (i * 7 + j * 3 + n++) % 5 === 0;
    stone(g, () => roundPoly(g, sq, 2), [cx - q, cy - q, q * 2, q * 2], gold ? SP.gold : (i + j) % 2 ? SP.lav : SP.lav2, { d: 1.6, hk: 0.25 });
  }
  for (const e of R.edges) { const q = (a2, b2) => { const Pp = (p, t) => [p[0] - e.o[0] * t, p[1] - e.o[1] * t]; return [Pp(e.p0, a2), Pp(e.p1, a2), Pp(e.p1, b2), Pp(e.p0, b2)]; };
    stone(g, () => roundPoly(g, q(0, 22), 1), [0, 0, R.W, R.H], SP.lav2, { d: 1.8, hk: 0.2 });
    stone(g, () => roundPoly(g, q(8, 13), 1), [0, 0, R.W, R.H], SP.gold, { d: 1.2, hk: 0.3 }); }
});
def('spire-kintsugi', 'spire', 'Mended flags', 'Near-white flagstones, the cracked ones mended with angular gold seams; nothing else, so the units do all the talking.', (g, R) => {
  ashlar(g, R, { u: 52, gap: 4, cols: [SP.flag, shade(SP.flag, -0.03), mix(SP.flag, '#E2DACC', 0.5)], grout: SP.grout, r: 6, vary: 0.03, o: { d: 2, hk: 0.3, k: 0.04 },
    each: (x, y, w, h, col) => { if (R.rnd() < 0.08) { // a crack mended in gold: three or four straight runs
      const long = w >= h, n = 3 + Math.floor(R.rnd() * 2), line = [];
      for (let i = 0; i <= n; i++) { const t = i / n; line.push(long ? [x - 4 + (w + 8) * t, y + h * (0.2 + R.rnd() * 0.6)] : [x + w * (0.2 + R.rnd() * 0.6), y - 4 + (h + 8) * t]); }
      const [lx, ly] = LD(); g.save(); rrect(g, x, y, w, h, 6); g.clip(); g.lineJoin = 'miter'; g.lineCap = 'butt';
      const run = (dx, dy, c, wd) => { g.strokeStyle = c; g.lineWidth = wd; g.beginPath(); line.forEach(([px, py], i) => (i ? g.lineTo(px + dx, py + dy) : g.moveTo(px + dx, py + dy))); g.stroke(); };
      run(-lx * 1.2, -ly * 1.2, shade(SP.gold, -0.25), 5); run(0, 0, SP.gold, 4.5); run(lx * 1, ly * 1, shade(SP.gold, 0.4), 1.6); g.restore(); } } });
  edgeFade(g, R, '#8A7A5A', 0.12, 40);
});

// ======== The Sunken Dunes: the dunes, the buried halls, the sun chamber
const DN = { sand: '#E1C790', sand2: '#D4B67E', crest: '#ECD9AA', trough: '#CBAA72', stone: '#D0B07C', grout: '#B4925E', pot: '#C08A5E', clay: '#D3AE7C' };
function sandDrifts(g, R, depth = 34) { edgeBand(g, R, { depth, step: 48, col: shade(DN.sand, 0.06), d: 3, hk: 0.3, lk: 0.1 }); }
function shards(g, x, y, R) {
  for (let i = 0; i < 3; i++) { const a = R.rnd() * TAU, d = 8 + R.rnd() * 10, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, r = 6 + R.rnd() * 4, b = R.rnd() * TAU;
    const pts = [[px + Math.cos(b) * r, py + Math.sin(b) * r], [px + Math.cos(b + 2.2) * r, py + Math.sin(b + 2.2) * r], [px + Math.cos(b + 4) * r * 0.8, py + Math.sin(b + 4) * r * 0.8]];
    lying(g, () => roundPoly(g, pts, 2), shade(DN.pot, (R.rnd() - 0.5) * 0.1), [px - r, py - r, r * 2, r * 2], { d: 1.6 }); }
}
def('dunes-sand', 'dunes', 'Wind-swept sand', 'Smooth sand with fields of soft ripples all lying one way, half-buried slabs, pottery shards, drifts at the walls.', (g, R) => {
  base(g, R, shade(DN.sand, 0.02), shade(DN.sand2, -0.02));
  patches(g, R, { per: 0.8, r0: 90, r1: 170, col: shade(DN.sand, 0.05), d: 2.4, hk: 0.2, lk: 0.06 });
  const wind = R.rnd() * TAU;
  swells(g, R, { sp: 230, keep: 0.75, wind, body: shade(DN.sand, 0.05), lee: DN.trough, crest: DN.crest, L0: 240, L1: 420, W0: 70, W1: 100, a: [0.45, 0.7, 0.8] });
  for (const [x, y] of R.scatter(360, 50, 0.35)) { // a half-buried slab
    const a = R.rnd() * TAU, L = 70 + R.rnd() * 30, Wd = 40 + R.rnd() * 10;
    lying(g, () => { g.beginPath(); g.save(); g.translate(x, y); g.rotate(a); g.roundRect(-L / 2, -Wd / 2, L, Wd, 6); g.restore(); }, DN.stone, [x - L / 2, y - L / 2, L, L], { d: 2.6, sh: 3 });
    const s2 = blobPts(x + Math.cos(a) * L * 0.4, y + Math.sin(a) * L * 0.4, L * 0.42, Wd * 0.8, a, R.rnd, 8, 0.2);
    bev(g, () => smooth(g, s2), shade(DN.sand, 0.04), 2.4, shade(DN.sand, 0.3), shade(DN.sand, -0.1));
  }
  sandDrifts(g, R);
  for (const [x, y] of R.scatter(260, 24, 0.25)) shards(g, x, y, R);
});
const GLYPHS = [ // engraved signs, unit box -1..1
  (g) => { g.ellipse(0, 0, 0.9, 0.45, 0, 0, TAU); g.moveTo(0.28, 0); g.arc(0, 0, 0.28, 0, TAU); },
  (g) => { g.moveTo(0.3, -0.45); g.arc(0, -0.45, 0.3, 0, TAU); g.rect(-0.08, -0.15, 0.16, 1.05); g.rect(-0.45, -0.05, 0.9, 0.15); },
  (g) => { for (const y of [-0.45, 0, 0.45]) { g.rect(-0.85, y - 0.07, 1.7, 0.14); } },
  (g) => { g.moveTo(0.42, 0); g.arc(0, 0, 0.42, 0, TAU); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.rect(Math.cos(a) * 0.68 - 0.08, Math.sin(a) * 0.68 - 0.08, 0.16, 0.16); } },
];
def('dunes-tomb', 'dunes', 'Sandstone tomb', 'Big sandstone blocks, some cut with old signs (an eye, a key, water, the sun), sand blown over them in soft tongues.', (g, R) => {
  ashlar(g, R, { u: 56, gap: 5, cols: [DN.stone, shade(DN.stone, -0.04), mix(DN.stone, '#D8B98A', 0.5)], grout: DN.grout, r: 6, vary: 0.04, o: { d: 2.4, hk: 0.22, k: 0.05 },
    sizes: [[1, 1, 2], [2, 1, 3], [1, 2, 2], [2, 2, 2]],
    each: (x, y, w, h, col) => { if (R.rnd() < 0.12 && R.free(x + w / 2, y + h / 2, 20)) { const cx = x + w / 2, cy = y + h / 2, s = Math.min(w, h) * 0.36, f = GLYPHS[Math.floor(R.rnd() * GLYPHS.length)];
      bev(g, () => { g.beginPath(); g.save(); g.translate(cx, cy); g.scale(s, s); f(g); g.restore(); }, shade(col, -0.14), 1.8, shade(col, 0.22), shade(col, -0.3), true); } } });
  patches(g, R, { per: 1.4, r0: 40, r1: 90, col: shade(DN.stone, 0.12), d: 2.4, hk: 0.2, lk: 0.06, stretch: 0.35, lobes: 9, alpha: 0.85 });
  sandDrifts(g, R, 38);
  for (const [x, y] of R.scatter(300, 24, 0.2)) shards(g, x, y, R);
});
def('dunes-clay', 'dunes', 'Sun-cracked clay', 'A dried-out clay pan in big curled plates, sand blown into the cracks, a few shards and pebbles lying about.', (g, R) => {
  plates(g, R, { S: 100, J: 28, gap: 7, cols: [DN.clay, shade(DN.clay, -0.04), mix(DN.clay, '#C9A57A', 0.5)], grout: mix(DN.crest, DN.clay, 0.45), r: 12, vary: 0.035, o: { d: 3, hk: 0.2, lk: 0.14, k: 0.05 }, split: 0.25 });
  sandDrifts(g, R, 30);
  for (const [x, y] of R.scatter(250, 24, 0.25)) (R.rnd() < 0.5 ? shards : (gg, xx, yy, RR) => pebbles(gg, xx, yy, RR, '#BFA27A', 3))(g, x, y, R);
});

// ======== The Clockwork Foundry: the scrapyard, the assembly line, the engine room
const FD = { steel: '#9A9890', steel2: '#929089', grout: '#55534E', brass: '#B89C62', oil: '#3C3A36', brick: '#8E8E89', brick2: '#868680', bgrout: '#5C5A55', tread: '#8E8C85' };
function rivet(g, x, y, r, col) { stone(g, () => { g.beginPath(); g.arc(x, y, r, 0, TAU); }, [x - r, y - r, r * 2, r * 2], col, { d: 1.3, hk: 0.3, k: 0.12 }); }
function oilStain(g, x, y, R) {
  const r = 30 + R.rnd() * 30, pts = blobPts(x, y, r, r * 0.7, R.rnd() * TAU, R.rnd, 9, 0.25);
  g.fillStyle = 'rgba(40,36,32,0.2)'; smooth(g, pts); g.fill();
  const [lx, ly] = LD(); g.save(); smooth(g, pts); g.clip(); g.strokeStyle = 'rgba(200,210,230,0.18)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r * 0.5, Math.atan2(ly, lx) - 0.5, Math.atan2(ly, lx) + 0.5); g.stroke(); g.restore();
}
function brassHatch(g, x, y) {
  stone(g, () => { g.beginPath(); g.arc(x, y, 22, 0, TAU); }, [x - 22, y - 22, 44, 44], FD.brass, { d: 2.4, hk: 0.3, k: 0.08 });
  bev(g, () => { g.beginPath(); g.roundRect(x - 12, y - 3, 24, 6, 3); g.roundRect(x - 3, y - 12, 6, 24, 3); }, shade(FD.brass, -0.3), 1.2, shade(FD.brass, 0.3), shade(FD.brass, -0.4), true);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; rivet(g, x + Math.cos(a) * 16, y + Math.sin(a) * 16, 2.6, shade(FD.brass, 0.05)); }
}
function brassPlate(g, x, y, a) {
  g.save(); g.translate(x, y); g.rotate(a);
  stone(g, () => rrect(g, -30, -18, 60, 36, 5), [-30, -18, 60, 36], FD.brass, { d: 2.2, hk: 0.3, k: 0.08 });
  bev(g, () => { g.beginPath(); for (const yy of [-6, 4]) g.roundRect(-18, yy, 36, 3.5, 1.7); }, shade(FD.brass, -0.2), 1, shade(FD.brass, 0.3), shade(FD.brass, -0.35), true);
  for (const [px, py] of [[-24, -12], [24, -12], [-24, 12], [24, 12]]) rivet(g, px, py, 2.6, FD.brass);
  g.restore();
}
function hazardEdge(g, R) { // muted hazard stripes along the walls
  for (const e of R.edges) {
    const Pp = (p, t) => [p[0] - e.o[0] * t, p[1] - e.o[1] * t], q = [Pp(e.p0, 0), Pp(e.p1, 0), Pp(e.p1, 18), Pp(e.p0, 18)];
    g.save(); roundPoly(g, q, 1); g.clip(); g.fillStyle = '#A99366'; g.fill();
    g.fillStyle = '#7A766E'; const d = [e.p1[0] - e.p0[0], e.p1[1] - e.p0[1]].map((v) => v / e.len);
    for (let t = -20; t < e.len + 20; t += 36) { const a = [e.p0[0] + d[0] * t, e.p0[1] + d[1] * t]; g.beginPath(); g.moveTo(...a); g.lineTo(a[0] + d[0] * 18, a[1] + d[1] * 18); g.lineTo(a[0] + d[0] * 36 - e.o[0] * 18, a[1] + d[1] * 36 - e.o[1] * 18); g.lineTo(a[0] + d[0] * 18 - e.o[0] * 18, a[1] + d[1] * 18 - e.o[1] * 18); g.closePath(); g.fill(); }
    g.restore();
  }
}
def('foundry-plates', 'foundry', 'Riveted plates', 'Big steel deck plates, rivets at their corners, soft oil stains with a sheen, brass hatches; muted hazard stripes at the walls.', (g, R) => {
  bond(g, R, { tw: 144, th: 96, gap: 5, cols: [FD.steel, FD.steel2, mix(FD.steel, '#9C968A', 0.5)], grout: FD.grout, r: 7, vary: 0.04, o: { d: 2.6, hk: 0.2, k: 0.05 },
    each: (x, y, w, h, col) => { for (const [px, py] of [[x + 10, y + 10], [x + w - 10, y + 10], [x + 10, y + h - 10], [x + w - 10, y + h - 10], [x + w / 2, y + 10], [x + w / 2, y + h - 10]]) rivet(g, px, py, 3.2, col); } });
  for (const [x, y] of R.scatter(230, 30, 0.35)) oilStain(g, x, y, R);
  hazardEdge(g, R);
  for (const [x, y] of R.scatter(330, 30, 0.35)) brassHatch(g, x, y);
});
def('foundry-tread', 'foundry', 'Tread plate', 'Panels of chunky diamond tread plate, the raised bars soft and low, brass name plates bolted down, a scorch or two.', (g, R) => {
  const P = 168;
  g.fillStyle = FD.grout; g.fillRect(-10, -10, R.W + 20, R.H + 20);
  for (let j = 0; j * P < R.H; j++) for (let i = 0; i * P < R.W; i++) {
    const x = i * P + 3, y = j * P + 3, col = shade(FD.tread, (R.rnd() - 0.5) * 0.06);
    stone(g, () => rrect(g, x, y, P - 6, P - 6, 8), [x, y, P, P], col, { d: 2.6, hk: 0.2 });
    g.save(); rrect(g, x + 8, y + 8, P - 22, P - 22, 4); g.clip();
    const s = 40; const bars = () => { g.beginPath(); for (let v = 0; v * s < P + s; v++) for (let u = 0; u * s < P + s; u++) { const bx = x + u * s + (v % 2) * s / 2, by = y + v * s * 0.6, a = v % 2 ? 0.75 : -0.75;
      g.save(); g.translate(bx, by); g.rotate(a); g.roundRect(-12, -4, 24, 8, 4); g.restore(); } };
    bev(g, bars, shade(col, 0.03), 1.6, shade(col, 0.16), shade(col, -0.14));
    g.restore();
  }
  for (const [x, y] of R.scatter(260, 30, 0.3)) { const r = 46 + R.rnd() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(40,30,24,0.26)'); gr.addColorStop(1, 'rgba(40,30,24,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  edgeFade(g, R, '#1E1C1A', 0.2, 50);
  for (const [x, y] of R.scatter(320, 40, 0.35)) brassPlate(g, x, y, Math.round(R.rnd()) * Math.PI / 2);
});
def('foundry-rails', 'foundry', 'Brick and brass', 'Grey factory brick with brass rails sunk into it running door to door, round brass turn plates, bolted floor plates.', (g, R) => {
  bond(g, R, { tw: 72, th: 36, gap: 5, cols: [FD.brick, FD.brick2, mix(FD.brick, '#8C8478', 0.5)], grout: shade(FD.bgrout, 0.12), r: 7, vary: 0.04, o: { d: 2.4, hk: 0.14, lk: 0.12 } });
  for (const f of R.routes) { // a sunk channel with two brass rails in it
    const pts = []; for (let t = 0; t <= 1.0001; t += 0.01) pts.push(f(t));
    bev(g, () => taper(g, pts, 46, 46), shade(FD.bgrout, 0.1), 2.4, shade(FD.bgrout, 0.3), shade(FD.bgrout, -0.2), true);
    for (const side of [-13, 13]) {
      const rail = pts.map((p, i) => { const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], a = Math.atan2(q[1] - o[1], q[0] - o[0]); return [p[0] - Math.sin(a) * side, p[1] + Math.cos(a) * side]; });
      stone(g, () => taper(g, rail, 6, 6), [0, 0, R.W, R.H], FD.brass, { d: 1.4, hk: 0.35, k: 0.06 });
    }
  }
  const mids = R.routes.map((f) => f(0.5));
  for (const [x, y] of mids.slice(0, 1)) if (R.free(x, y, 20)) {
    stone(g, () => { g.beginPath(); g.arc(x, y, 44, 0, TAU); }, [x - 44, y - 44, 88, 88], mix(FD.brass, FD.brick, 0.45), { d: 2.4, hk: 0.2, k: 0.05, sunk: true });
    bev(g, () => { g.beginPath(); g.arc(x, y, 34, 0, TAU); g.arc(x, y, 30, 0, TAU, true); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.save(); g.translate(x, y); g.rotate(a); g.rect(8, -2, 22, 4); g.restore(); } }, shade(FD.brass, -0.2), 1.2, shade(FD.brass, 0.3), shade(FD.brass, -0.35), true);
    rivet(g, x, y, 6, FD.brass);
  }
  edgeFade(g, R, '#1E1C1A', 0.18, 50);
  for (const [x, y] of R.scatter(300, 40, 0.3)) brassPlate(g, x, y, Math.round(R.rnd()) * Math.PI / 2);
  for (const [x, y] of R.scatter(280, 30, 0.25)) oilStain(g, x, y, R);
});

// ---------------------------------------------------------------- painting, and the opt-in preview
export const OPTIONS = {}; // theme -> [id, id, id] in order (a, b, c)
for (const id in FLOORS) (OPTIONS[FLOORS[id].theme] ||= []).push(id);

// Paint option id over the floor already in the cache (g as render.js gives it: (0,0) is the floor's corner).
export function paintFloor19(g, w, id) {
  const F = FLOORS[id]; if (!F) return;
  const R = roomOf(w, [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7));
  g.save();
  g.beginPath(); for (const k of R.cells) g.rect(k.x, k.y, k.w, k.h); g.clip();
  g.beginPath(); g.rect(-100, -100, R.W + 200, R.H + 200);
  for (const b of R.blocks) g.rect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
  g.clip('evenodd');
  F.paint(g, R);
  for (const c of R.water) water(g, c); // painted again over the option (the old dressing could show through it)
  footShadow(g, R);
  g.restore();
}
// The sewer channel as scenery.js paints it: murky water between two stone banks.
function water(g, c) {
  if (OUTLINES) { g.fillStyle = inkFor('#7E8A6C'); g.fillRect(c.x - OUTLINE * 2 - 3, c.y, c.w + OUTLINE * 4 + 6, c.h); } // (round 19, lane toggles19; lane looks19: inkFor)
  g.fillStyle = '#7E8A6C'; g.fillRect(c.x - 3, c.y, c.w + 6, c.h);
  const wg = g.createLinearGradient(c.x, 0, c.x + c.w, 0); wg.addColorStop(0, '#4F8C8A'); wg.addColorStop(1, '#2E5E63');
  g.fillStyle = wg; g.fillRect(c.x + 3, c.y, c.w - 6, c.h);
  const hs = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  g.fillStyle = 'rgba(160,220,210,0.25)';
  for (let y = 20; y < c.h; y += 46) { const k = hs(c.x, y); g.beginPath(); g.ellipse(c.x + c.w * (0.25 + 0.5 * k), c.y + y, c.w * 0.18, 3, 0, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(20,40,40,0.25)'; g.fillRect(c.x + c.w - 14, c.y, 11, c.h);
}
// Which option a world gets from a ?floor= list: ids, or a / b / c for that option in every dungeon.
export function pickFor(list, themeId) {
  for (const s of list) {
    if (FLOORS[s] && FLOORS[s].theme === themeId) return s;
    const k = 'abc'.indexOf(s); if (k >= 0 && OPTIONS[themeId] && OPTIONS[themeId][k]) return OPTIONS[themeId][k];
  }
  return null;
}
// Preview only: every room world without a ground painter of its own gets one (render.js calls w.paintGround while
// it fills the floor cache). Installed on Object.prototype so no game file changes; an own paintGround (the convoy's
// road) still wins, and setting one makes it the object's own.
export function installFloorPreview(list) {
  if (typeof list === 'string') list = list.split(',').map((s) => s.trim()).filter(Boolean);
  const fns = {};
  Object.defineProperty(Object.prototype, 'paintGround', {
    configurable: true,
    get() {
      if (!this || !this.theme || !this.pillars || typeof this.W !== 'number') return undefined;
      const id = pickFor(list, this.theme.id); if (!id) return undefined;
      return (fns[id] ||= (g, w) => paintFloor19(g, w, id));
    },
    set(v) { Object.defineProperty(this, 'paintGround', { value: v, writable: true, configurable: true, enumerable: true }); },
  });
  return list;
}
