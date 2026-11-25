// Walls and the way round them. Walls are axis-aligned rectangles {x, y, w, h} in room units.
// A* runs on a coarse grid built once per room, with walls grown by a body's width so a path never
// hugs a corner too tightly; the route is then pulled straight wherever there's a clear line.
import { clamp } from './util.js';

const CELL = 24;
const CLEAR = 46; // how far paths keep from walls and pillars: wider than the widest hero (Tower, r 40 since round 6)

// Does the segment a->b pass through rectangle r grown by pad? (slab test)
export function segHitsRect(ax, ay, bx, by, r, pad = 0) {
  const x0 = r.x - pad, y0 = r.y - pad, x1 = r.x + r.w + pad, y1 = r.y + r.h + pad;
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dy = by - ay;
  for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dy, ay - y0], [dy, y1 - ay]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}

// Distance along a ray (unit direction) to a rectangle, or Infinity.
export function rayToRect(ax, ay, dx, dy, r, pad = 0) {
  const x0 = r.x - pad, y0 = r.y - pad, x1 = r.x + r.w + pad, y1 = r.y + r.h + pad;
  let t0 = -Infinity, t1 = Infinity;
  if (dx === 0) { if (ax < x0 || ax > x1) return Infinity; } else { let a = (x0 - ax) / dx, b = (x1 - ax) / dx; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
  if (dy === 0) { if (ay < y0 || ay > y1) return Infinity; } else { let a = (y0 - ay) / dy, b = (y1 - ay) / dy; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
  if (t1 < Math.max(0, t0)) return Infinity;
  return Math.max(0, t0);
}

// How far a circle of radius rad can travel along a ray (unit direction) before it touches rectangle r, or Infinity.
// The exact sweep: the ray against the rectangle grown by rad with rounded corners. (rayToRect with a pad grows it
// with square corners: a body standing in that square corner's empty bit read every direction as blocked at 0, and
// froze there; that was most of the 'stuck behind rocks and crates'.) 0 when the circle already overlaps it.
export function rayToRoundRect(ax, ay, dx, dy, r, rad) {
  const cx = clamp(ax, r.x, r.x + r.w), cy = clamp(ay, r.y, r.y + r.h);
  if ((ax - cx) ** 2 + (ay - cy) ** 2 < rad * rad) return 0;
  let t = Math.min(rayToRect(ax, ay, dx, dy, { x: r.x - rad, y: r.y, w: r.w + 2 * rad, h: r.h }), rayToRect(ax, ay, dx, dy, { x: r.x, y: r.y - rad, w: r.w, h: r.h + 2 * rad }));
  for (const [px, py] of [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]]) {
    const ox = px - ax, oy = py - ay, along = ox * dx + oy * dy; if (along < 0) continue;
    const off2 = ox * ox + oy * oy - along * along; if (off2 >= rad * rad) continue;
    t = Math.min(t, along - Math.sqrt(rad * rad - off2));
  }
  return Math.max(0, t);
}

// Push a circle out of a rectangle. Returns the push normal {nx, ny, d} or null.
export function circleRect(x, y, rad, r) {
  const cx = clamp(x, r.x, r.x + r.w), cy = clamp(y, r.y, r.y + r.h);
  let dx = x - cx, dy = y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rad * rad) return null;
  if (d2 > 1e-6) { const d = Math.sqrt(d2); return { nx: dx / d, ny: dy / d, over: rad - d }; }
  // centre inside the rectangle: push out the nearest side
  const l = x - r.x, rr = r.x + r.w - x, t = y - r.y, b = r.y + r.h - y;
  const m = Math.min(l, rr, t, b);
  if (m === l) return { nx: -1, ny: 0, over: l + rad };
  if (m === rr) return { nx: 1, ny: 0, over: rr + rad };
  if (m === t) return { nx: 0, ny: -1, over: t + rad };
  return { nx: 0, ny: 1, over: b + rad };
}

// over (round 15, lane N): a side whose shots go over walls marked `over` for it (the Earth Mage's stone wall is raised
// low on her own side: the party sees and shoots over it, the enemy doesn't)
export function lineClear(w, ax, ay, bx, by, pad = 0, over = null) {
  for (const r of w.walls) if (!(over && r.over === over) && segHitsRect(ax, ay, bx, by, r, pad)) return false;
  return true;
}

// lineClear, and round obstacles too (pillars, barrels, boulders, braziers): can a body of radius pad go straight
// from a to b? Steering used to head straight at a goal behind two boulders sitting side by side (a gap narrower than
// the body), because only the walls were checked, and pushed back and forth at the gap.
// skip (round 17, lane foes17): a test for round things not to count (a troll's own boulder, for its own way about)
export function pathClear(w, ax, ay, bx, by, pad = 0, skip = null) {
  if (!lineClear(w, ax, ay, bx, by, pad)) return false;
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
  for (const p of w.pillars) {
    if (skip && skip(p)) continue;
    const k = clamp(((p.x - ax) * dx + (p.y - ay) * dy) / L2, 0, 1), qx = ax + dx * k - p.x, qy = ay + dy * k - p.y;
    if (qx * qx + qy * qy < (p.r + pad) ** 2) return false;
  }
  return true;
}

export function buildGrid(w) {
  const gw = Math.ceil(w.W / CELL), gh = Math.ceil(w.H / CELL);
  const block = new Uint8Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL;
    let b = x < CLEAR * 0.6 || y < CLEAR * 0.6 || x > w.W - CLEAR * 0.6 || y > w.H - CLEAR * 0.6;
    for (const r of w.walls) if (!b && circleRect(x, y, CLEAR, r)) b = true;
    for (const p of w.pillars) if (!b && Math.hypot(x - p.x, y - p.y) < p.r + CLEAR) b = true;
    block[j * gw + i] = b ? 1 : 0;
  }
  w.grid = { gw, gh, block };
}

const cellOf = (g, x, y) => [clamp(Math.floor(x / CELL), 0, g.gw - 1), clamp(Math.floor(y / CELL), 0, g.gh - 1)];

function nearestOpen(g, i, j) {
  if (!g.block[j * g.gw + i]) return [i, j];
  for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    const a = i + di, b = j + dj;
    if (a >= 0 && b >= 0 && a < g.gw && b < g.gh && !g.block[b * g.gw + a]) return [a, b];
  }
  return [i, j];
}

// A binary min-heap of cell indices ordered by f[] (rooms can be several screens each way).
function heap(f) {
  const a = [];
  return {
    size: () => a.length,
    push(k) { a.push(k); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (f[a[p]] <= f[a[i]]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } },
    pop() {
      const top = a[0], last = a.pop();
      if (a.length) { a[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i;
        if (l < a.length && f[a[l]] < f[a[m]]) m = l; if (r < a.length && f[a[r]] < f[a[m]]) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
      return top;
    },
  };
}

// A route of points from (ax,ay) to (bx,by), pulled straight, or null. pad: how wide a line the route keeps clear
// when it's pulled straight (the walker's radius), so a big body isn't sent across a corner it can't fit past.
export function findPath(w, ax, ay, bx, by, pad = 30, skip = null) {
  const g = w.grid; if (!g) return null;
  const [si, sj] = nearestOpen(g, ...cellOf(g, ax, ay));
  const [ti, tj] = nearestOpen(g, ...cellOf(g, bx, by));
  const N = g.gw * g.gh, start = sj * g.gw + si, goal = tj * g.gw + ti;
  const gs = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  gs[start] = 0;
  const h = (k) => { const x = k % g.gw, y = (k / g.gw) | 0; const dx = Math.abs(x - ti), dy = Math.abs(y - tj); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const f = new Float32Array(N).fill(Infinity); f[start] = h(start);
  const open = heap(f); open.push(start);
  let found = false, iter = 0;
  while (open.size() && iter++ < 30000) {
    const cur = open.pop();
    if (cur === goal) { found = true; break; }
    if (closed[cur]) continue; closed[cur] = 1;
    const cx = cur % g.gw, cy = (cur / g.gw) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= g.gw || ny >= g.gh) continue;
      const nk = ny * g.gw + nx;
      if (g.block[nk] || closed[nk]) continue;
      if (dx && dy && (g.block[cy * g.gw + nx] || g.block[ny * g.gw + cx])) continue; // no corner cutting
      const ng = gs[cur] + (dx && dy ? 1.414 : 1);
      if (ng < gs[nk]) { gs[nk] = ng; from[nk] = cur; f[nk] = ng + h(nk); open.push(nk); }
    }
  }
  if (!found) return null;
  const pts = [];
  for (let k = goal; k !== -1 && k !== start; k = from[k]) pts.push({ x: (k % g.gw + 0.5) * CELL, y: (((k / g.gw) | 0) + 0.5) * CELL });
  pts.reverse(); pts.push({ x: bx, y: by });
  // pull the string: drop points while there's a clear line past them
  const out = []; let px = ax, py = ay, i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !pathClear(w, px, py, pts[j].x, pts[j].y, pad, skip)) j--;
    out.push(pts[j]); px = pts[j].x; py = pts[j].y; i = j + 1;
  }
  return out;
}
