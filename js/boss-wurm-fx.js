// The Sand Wurm, drawn (lane B, bosses3). What is out of the sand is one figure (boss-draw.js): a plated golden body
// in the sand serpent's colours, thorned along its sides, tapering to a tail spike; a head whose two great mandibles
// open on a red maw ringed with teeth. What is under the sand shows on the floor: the mound that runs ahead of it, the
// furrow it leaves, the ground lifting in slabs where it will come up, the holes it uses. The fight's state is u.sw.
import { TAU, clamp } from './util.js';
import { inked } from './fx.js';
import { OUTLINE } from './render.js';
import { figure, washOf, flashing, lin, rad, ballFill, gloss, glow, shade, ell, circ, poly, soft, capsule, up, upRot, BFX, easeOut, sm, k01, hash, inkDisc, streak, rgbaOf } from './boss-draw.js';

const GOLD = ['#F0D48C', '#CFA04C', '#9C6E2A'], PLATE = ['#7A5330', '#55371A'], CREAM = '#F4E3B4', BONE = ['#FFF8EA', '#EADBB4', '#C9B487'];
const MAW = ['#8A3044', '#4A1626'], SAND = ['#8E6A3A', '#B58B5A', '#D9C08A', '#F2E2B8'];

function segment(F, ctx, r, last, T, i) {
  // thorns out of its sides, swept back
  for (const s of [-1, 1]) F.shape(() => poly(ctx, [[r * 0.25, s * r * 0.72], [-r * 0.62, s * r * 1.36], [-r * 0.42, s * r * 0.62]]), () => lin(ctx, 0, s * r * 0.6, 0, s * r * 1.36, BONE[1], BONE[0]));
  if (last) { // the tail: a taper and a spike
    F.shape(() => poly(ctx, [[-r * 0.5, -r * 0.36], [-r * 2.5, 0], [-r * 0.5, r * 0.36]]), () => lin(ctx, -r * 2.5, 0, -r * 0.5, 0, BONE[0], BONE[1]));
    F.shape(() => capsule(ctx, r * 0.1, 0, r, -r * 0.95, 0, r * 0.5), ballFill(ctx, 0, 0, r, GOLD[0], GOLD[1], GOLD[2]));
  } else F.shape(() => ell(ctx, 0, 0, r * 1.02, r), ballFill(ctx, 0, 0, r, GOLD[0], GOLD[1], GOLD[2]));
  F.detail(() => {
    // the back plate: a dark scute with a pale rim, as the dunes' serpent wears its diamonds
    const p = r * 0.56; ctx.lineJoin = 'round';
    soft(ctx, [[p, 0], [p * 0.3, p * 0.82], [-p * 0.75, p * 0.6], [-p, 0], [-p * 0.75, -p * 0.6], [p * 0.3, -p * 0.82]]);
    ctx.fillStyle = lin(ctx, 0, -p, 0, p, PLATE[0], PLATE[1]); ctx.fill(); ctx.strokeStyle = CREAM; ctx.lineWidth = 2.6; ctx.stroke();
    gloss(ctx, -r * 0.1, -r * 0.62, r * 0.42, r * 0.13, 0, 0.3, '255,246,214');
    ctx.strokeStyle = 'rgba(110,72,26,0.5)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(r * 0.2, 0, r * 0.82, 2.2, 4.08); ctx.stroke();
  });
}
// one of its two mandibles (s: -1 / 1), in a frame at its hinge: a curved bone hook, three teeth along its inner edge
function mandible(F, ctx, R, s) {
  const t = R / 50; // (the teeth were sized for the head: the bite's effect draws the same mandibles bigger)
  F.shape(() => { ctx.beginPath(); ctx.moveTo(-R * 0.3, s * R * 0.3); ctx.quadraticCurveTo(R * 0.7, s * R * 0.5, R * 1.38, -s * R * 0.46); ctx.quadraticCurveTo(R * 0.55, -s * R * 0.12, -R * 0.12, -s * R * 0.3); ctx.closePath(); }, () => lin(ctx, 0, s * R * 0.4, R * 0.4, -s * R * 0.4, BONE[2], BONE[1], BONE[0]));
  F.detail(() => { ctx.fillStyle = BONE[0]; for (let i = 0; i < 3; i++) { const q = 0.38 + i * 0.2, x = R * 1.38 * q, y = -s * R * (0.02 + 0.3 * q * q); ctx.beginPath(); ctx.moveTo(x - 5 * t, y); ctx.lineTo(x + 1 * t, y - s * 11 * t); ctx.lineTo(x + 6 * t, y); ctx.closePath(); ctx.fill(); }
    gloss(ctx, R * 0.4, s * R * 0.2, R * 0.3, R * 0.07, s * 0.3, 0.4); });
}
function head(F, ctx, R, jaw, T) {
  const open = clamp(jaw, 0, 1);
  // the neck's last ring and the skull
  F.shape(() => ell(ctx, -R * 0.2, 0, R * 1.0, R * 0.98), ballFill(ctx, -R * 0.2, 0, R, GOLD[0], GOLD[1], GOLD[2]));
  // the maw: a red gullet between the mandibles, wider as they part
  const mw = R * (0.2 + 0.62 * open), ml = R * (0.5 + 0.34 * open);
  F.shape(() => ell(ctx, R * 0.62, 0, ml, mw), () => rad(ctx, R * 0.5, 0, 2, ml, MAW[1], MAW[0]));
  F.detail(() => { // rings of teeth pointing in
    const n = 9; ctx.fillStyle = BONE[0];
    for (let i = 0; i < n; i++) { const a = -1.75 + 3.5 * i / (n - 1), cx = R * 0.62 + Math.cos(a) * ml * 0.92, cy = Math.sin(a) * mw * 0.92, tx = R * 0.62 + Math.cos(a) * ml * 0.5, ty = Math.sin(a) * mw * 0.5, nx = -Math.sin(a) * 5.5, ny = Math.cos(a) * 5.5;
      ctx.beginPath(); ctx.moveTo(cx + nx, cy + ny); ctx.lineTo(tx, ty); ctx.lineTo(cx - nx, cy - ny); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(30,8,14,0.55)'; ctx.beginPath(); ctx.ellipse(R * 0.5, 0, ml * 0.36, mw * 0.4, 0, 0, TAU); ctx.fill();
  });
  // two mandibles: shut they meet in a beak, open they stand wide
  for (const s of [-1, 1]) F.at(R * 0.3, s * R * 0.62, s * (0.95 * open - 0.12), () => mandible(F, ctx, R, s));
  F.detail(() => { // the crest: three scutes fanned over the skull
    for (const [x, y, sc] of [[-R * 0.25, 0, 1], [-R * 0.05, -R * 0.52, 0.62], [-R * 0.05, R * 0.52, 0.62]]) { const p = R * 0.4 * sc;
      soft(ctx, [[x + p, y], [x + p * 0.2, y + p * 0.8], [x - p, y + p * 0.5], [x - p, y - p * 0.5], [x + p * 0.2, y - p * 0.8]]);
      ctx.fillStyle = lin(ctx, 0, y - p, 0, y + p, PLATE[0], PLATE[1]); ctx.fill(); ctx.strokeStyle = CREAM; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke(); }
    gloss(ctx, -R * 0.5, -R * 0.66, R * 0.3, R * 0.1, 0.2, 0.3, '255,246,214');
  });
}

// What is out of the sand is drawn in two lots (round 19): the rings still on the floor at a hole's mouth, and the rings
// up in the air. Each lot is one figure with one outline, drawn where the first of its rings comes in the frame's
// order (render.js: floor first, then what is in the air), so a hero on the floor is never drawn over rings arcing
// overhead, and the body is drawn whether or not the head is out (the whole wurm used to be drawn from its head, which
// render.js skips once it is hidden: the rest of the body vanished the moment the head dived).
function drawLot(ctx, u, w, air) {
  const k = u.sw, [ux, uy] = up();
  const mine = (p) => !p.dead && !p.hidden && ((p._tier || 0) > 0) === air;
  const list = [...k.parts].reverse().filter(mine), headIn = mine(u);
  if (!list.length && !headIn) return;
  const sh = headIn && u.stuck > 0 ? Math.sin(w.time * 70) * 1.5 : 0;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const box = (x, y, r) => { if (x - r < x0) x0 = x - r; if (y - r < y0) y0 = y - r; if (x + r > x1) x1 = x + r; if (y + r > y1) y1 = y + r; };
  for (const p of list) { const h = p.hop || 0; box(p.x + ux * h * 0.9, p.y + uy * h * 0.9, (SEGR[p.seg] ?? p.vr) * 3.6); }
  if (headIn) { const h = u.hop || 0; box(u.x + ux * h * 0.9, u.y + uy * h * 0.9, u.vr * 3.2); }
  const body = (F, c) => {
    for (const p of list) { F.flash = false; const h = p.hop || 0; // (a blow on a ring of it doesn't flash: four heroes on eleven rings read as a white wurm)
      F.at(p.x + ux * h * 0.9, p.y + uy * h * 0.9, p.facing, () => segment(F, c, SEGR[p.seg] ?? p.vr, p.last, 0, p.seg), (p.vis ?? 1) * (1 + h / 300)); }
    if (headIn) { F.flash = flashing(u); const h = u.hop || 0;
      F.at(u.x + ux * h * 0.9 + sh, u.y + uy * h * 0.9, u.facing, () => head(F, c, u.vr, u.jaw ?? 0.2, 0), (u.vis ?? 1) * (1 + h / 300)); }
  };
  figure(ctx, {}, (F) => body(F, ctx));
  const wash = washOf(u, w); if (wash.length) washOver(ctx, wash, body, [x0, y0, x1, y1]);
  // a ring in a hole's mouth is down in the pit: the hole's dark lies over it, deepest in the middle (round 19: rings
  // grew from a speck in the middle of the hole; now they come up at half size out of the dark)
  if (!air) for (const h of k.holes) { if (!h.open) continue; const r = h.r * 0.86;
    const g = ctx.createRadialGradient(h.x, h.y, r * 0.15, h.x, h.y, r); g.addColorStop(0, 'rgba(30,18,12,0.86)'); g.addColorStop(0.6, 'rgba(30,18,12,0.6)'); g.addColorStop(1, 'rgba(30,18,12,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, TAU); ctx.fill(); }
}
// A status wash (chilled, frozen, poisoned, wet, burning...) over a whole lot at once (round 19). boss-draw.js figure()
// lays its wash shape by shape, so where two rings overlap it lands twice and every hidden edge shows through: a row of
// glass rings. Here the lot's shapes are filled flat into a small layer of their own (half size), the layer is tinted,
// and it is laid over the figure once.
const WL = { c: null };
function washOver(ctx, washes, body, b) {
  if (typeof document === 'undefined' || !ctx.getTransform) return;
  const m = ctx.getTransform(), q = 0.5, ga = ctx.globalAlpha;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) { const sx = m.a * x + m.c * y + m.e, sy = m.b * x + m.d * y + m.f; if (sx < x0) x0 = sx; if (sy < y0) y0 = sy; if (sx > x1) x1 = sx; if (sy > y1) y1 = sy; }
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(ctx.canvas.width, Math.ceil(x1)); y1 = Math.min(ctx.canvas.height, Math.ceil(y1));
  const wd = Math.ceil((x1 - x0) * q), ht = Math.ceil((y1 - y0) * q); if (wd < 2 || ht < 2) return;
  const c = WL.c || (WL.c = document.createElement('canvas'));
  if (c.width < wd || c.height < ht) { c.width = Math.max(c.width, wd); c.height = Math.max(c.height, ht); }
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, wd, ht);
  g.setTransform(m.a * q, m.b * q, m.c * q, m.d * q, (m.e - x0) * q, (m.f - y0) * q);
  const F = { ctx: g, pass: 2, flash: false,
    shape(path) { g.fillStyle = '#FFFFFF'; path(); g.fill(); },
    line(path, col, width, cap = 'round') { g.lineCap = cap; g.lineJoin = 'round'; g.strokeStyle = '#FFFFFF'; g.lineWidth = width; path(); g.stroke(); },
    detail() {},
    at(x, y, a, fn, sc) { g.save(); g.translate(x, y); if (a) g.rotate(a); if (sc && sc !== 1) g.scale(sc, sc); fn(); g.restore(); } };
  body(F, g);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const [col, a] of washes) { g.fillStyle = col; g.fillRect(0, 0, wd, ht); ctx.globalAlpha = ga * a; ctx.drawImage(c, 0, 0, wd, ht, x0, y0, wd / q, ht / q); }
  ctx.restore();
}
// The head and every ring are units; each draws the lot it belongs to, once a frame (the floor's drawing clears the mark).
function drawPiece(ctx, u, me, w) {
  const k = u && u.sw; if (!k) return;
  const air = (me._tier || 0) > 0, bit = air ? 2 : 1;
  if (k.drew & bit) return; k.drew |= bit;
  drawLot(ctx, u, w, air);
}
export function drawWurm(ctx, u, w) { drawPiece(ctx, u, u, w); }
const SEGR = [43, 43, 41, 39, 37, 35, 33, 30, 27, 24, 20];
// a ring of its body: a unit of its own that takes the blows, drawn with the rest of the lot it is in
export function drawWurmPart(ctx, p, w) { if (p.core && !p.core.dead) drawPiece(ctx, p.core, p, w); }

// Its face for the Book, the inspect panel and the battle lists (inspect.js portrait: def.picture): the head with its
// jaws apart, two rings of neck behind it, drawn the way the fight draws them. A picture's address, made once.
let PIC = null;
export function wurmPicture() {
  if (PIC != null) return PIC;
  if (typeof document === 'undefined') return '';
  try {
    const c = document.createElement('canvas'); c.width = c.height = 192; const g = c.getContext('2d');
    g.translate(96, 84); g.scale(0.74, 0.74);
    figure(g, {}, (F) => {
      F.at(26, 150, -1.95, () => segment(F, g, 41, false, 0, 2));
      F.at(6, 96, -1.72, () => segment(F, g, 43, false, 0, 1));
      F.at(0, 40, -Math.PI / 2, () => segment(F, g, 43, false, 0, 0));
      F.at(0, -14, -Math.PI / 2, () => head(F, g, 50, 0.8, 0));
    });
    PIC = c.toDataURL();
  } catch (e) { PIC = ''; }
  return PIC;
}

// ---------------------------------------------------------------- the floor: ripples, the furrow, the mound, the holes
// a heap of loose sand seen from above: a shadow on its down-screen side, a lit top
function heap(ctx, x, y, rx, ry, rot, a = 1, lit = 0.8) {
  const [ux, uy] = up();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = `rgba(96,64,28,${0.4 * a})`; ctx.beginPath(); ctx.ellipse(0, 0, rx * 1.12, ry * 1.2, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x + ux * ry * 0.22, y + uy * ry * 0.22); ctx.rotate(rot);
  ctx.fillStyle = rgbaOf(SAND[2], 0.95 * a); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rgbaOf(SAND[3], lit * a); ctx.beginPath(); ctx.ellipse(-rx * 0.12, -ry * 0.2, rx * 0.6, ry * 0.5, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
// a slab of crust lifted by what is under it: a dark underside showing, a pale top, tipped away from (cx, cy)
function slab(ctx, cx, cy, a, d, size, lift, seed) {
  const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, [ux, uy] = up(), n = 5, pts = [];
  for (let i = 0; i < n; i++) { const b = a + i / n * TAU + hash(seed, i) * 0.5, rr = size * (0.7 + 0.5 * hash(i, seed)); pts.push([Math.cos(b) * rr, Math.sin(b) * rr * 0.8]); }
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(80,52,24,0.6)'; poly(ctx, pts); ctx.fill();
  ctx.translate(ux * lift, uy * lift);
  ctx.fillStyle = SAND[1]; poly(ctx, pts.map(([px, py]) => [px * 1.04, py * 1.04])); ctx.fill();
  ctx.fillStyle = SAND[3]; poly(ctx, pts.map(([px, py]) => [px * 0.86, py * 0.86 - 1])); ctx.fill();
  ctx.restore();
}
function drawHole(ctx, h, T) {
  const k = h.shutT == null ? k01((T - h.t0) / 0.15) : 1 - k01((T - h.shutT) / 1.1), r = h.r * (0.45 + 0.55 * k);
  if (k <= 0.02) return;
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + h.x, rr = r * (1.06 + 0.1 * hash(i, Math.round(h.x))); heap(ctx, h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr, r * 0.36, r * 0.26, a + 1.57, k); }
  ctx.save(); ctx.globalAlpha = k;
  ctx.fillStyle = rad(ctx, h.x, h.y, r * 0.2, r, '#1E120C', '#3A2416', '#6E4A26'); ctx.beginPath(); ctx.ellipse(h.x, h.y, r, r * 0.92, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
// The furrow (round 19: it was a see-through braid 30 wide behind a wurm 90 across; the designer on the Digger's burrow:
// "Maybe not transparent. And have it start fading later but much faster so you see less crumbs of dirt in a line.
// Bigger churned clumps in trail."): a churned track as wide as the wurm, a ridge of big heaps thrown up on either side
// and a dark trough between; it lies solid for FURROW_HOLD seconds, then slumps back in FURROW_FADE.
const FURROW_HOLD = 4.2, FURROW_FADE = 0.9;
function drawFurrow(ctx, k, T) {
  const tr = k.trail, n = tr.length; if (!n) return;
  const aOf = (p) => { const age = T - p.t0; return age < FURROW_HOLD ? 1 : 1 - k01((age - FURROW_HOLD) / FURROW_FADE); };
  // the trough: one soft dark band along the run (drawn in stretches, so a jump of the mound doesn't join two runs)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 1; i < n; i++) { const p = tr[i - 1], q = tr[i], a = Math.min(aOf(p), aOf(q)); if (a <= 0 || Math.hypot(q.x - p.x, q.y - p.y) > 60) continue;
    ctx.strokeStyle = `rgba(96,64,28,${0.17 * a})`; ctx.lineWidth = 58; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  // the churn: clumps of every size thrown up along both edges, a smaller one now and then down the middle (each step
  // of the run keeps its own clumps by its place in the room, so they don't shuffle as old steps drop off the list)
  for (let i = 0; i < n; i++) { const p = tr[i], a = aOf(p); if (a <= 0) continue;
    const nx = Math.cos(p.a + 1.57), ny = Math.sin(p.a + 1.57), ax = Math.cos(p.a), ay = Math.sin(p.a), sd = Math.round(p.x * 3 + p.y * 7);
    for (const s of [-1, 1]) { const h1 = hash(sd, s + 2), h2 = hash(sd, s + 5), h3 = hash(sd, s + 8), d = 21 + 15 * h1, f = 16 * (h2 - 0.5), rx = 13 + 13 * h3;
      heap(ctx, p.x + nx * d * s + ax * f, p.y + ny * d * s + ay * f, rx, rx * (0.62 + 0.2 * h1), p.a + (h2 - 0.5) * 1.6, a, 0.45); }
    if (hash(sd, 11) < 0.3) { const h = hash(sd, 12); heap(ctx, p.x + nx * 14 * (h - 0.5) + ax * 8, p.y + ny * 14 * (h - 0.5) + ay * 8, 9 + 6 * h, 6 + 4 * h, p.a + h * 2, a * 0.85, 0.4); } }
}
export function drawDunesFloor(ctx, w) {
  const T = w.time;
  if (w.dunesRoom) { // wind ripples across the court
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 11; i++) { const y = (i + 0.5) / 11 * w.H;
      ctx.strokeStyle = 'rgba(120,84,40,0.13)'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = -20; x <= w.W + 20; x += 36) ctx.lineTo(x, y + Math.sin(x * 0.011 + i * 1.7) * 13); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,200,0.12)'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = -20; x <= w.W + 20; x += 36) ctx.lineTo(x, y - 6 + Math.sin(x * 0.011 + i * 1.7) * 13); ctx.stroke(); }
    ctx.restore();
  }
  // (the fight's state is kept by the room, boss-wurm.js w.wurms: the furrow and the holes outlive the wurm; they used
  // to vanish in the frame it died)
  for (const k of w.wurms || []) {
    const u = k.u;
    k.drew = 0; if (u.stuck > 0) u.stuck -= w._dt || 0.016; // (a new frame: neither lot of its body is drawn yet)
    ctx.save(); drawFurrow(ctx, k, T); ctx.restore();
    for (const h of k.holes) drawHole(ctx, h, T);
    if (u.dead) continue;
    // the mound: the sand swelling over its back, as wide as the wurm, slabs of crust tipping off its front, grit jumping.
    // It shows a beat after the wurm has gone down (it used to pop up on top of the hole, the pit still open under it).
    if (u.hidden && !u.wurmOut && k.st !== 'tell') { const m = k.mound, hv = clamp(m.heave, 0.3, 2), R = 46 + 10 * hv + 3 * Math.sin(T * 13), [ux, uy] = up();
      const fade = k.underAt == null || k.st === 'asleep' ? 1 : k01((k.t - k.underAt - 0.12) / 0.3); if (fade <= 0) continue;
      ctx.save(); ctx.globalAlpha = fade;
      shade(ctx, m.x, m.y, R * 1.7, R * 1.5, 0.22);
      for (let i = 0; i < 5; i++) slab(ctx, m.x, m.y, m.a + (i - 2) * 0.5, R * (0.95 + 0.12 * Math.sin(T * 9 + i * 2)), 14 + 4 * (i % 2), 4 + 5 * hv * (0.5 + 0.5 * Math.sin(T * 11 + i * 1.9)), i + 3);
      heap(ctx, m.x - Math.cos(m.a) * 44, m.y - Math.sin(m.a) * 44, R * 0.7, R * 0.52, m.a, 1); heap(ctx, m.x - Math.cos(m.a) * 18, m.y - Math.sin(m.a) * 18, R * 0.95, R * 0.7, m.a, 1); heap(ctx, m.x + Math.cos(m.a) * 8, m.y + Math.sin(m.a) * 8, R * 0.9, R * 0.78, m.a, 1);
      ctx.strokeStyle = 'rgba(96,64,28,0.45)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m.x - Math.cos(m.a) * 50, m.y - Math.sin(m.a) * 50); ctx.lineTo(m.x + Math.cos(m.a) * 14, m.y + Math.sin(m.a) * 14); ctx.stroke();
      for (let i = 0; i < 7; i++) { const q = (T * 2.4 + hash(i, 5)) % 1, b = m.a + (hash(i, Math.floor(T * 2.4 + hash(i, 5))) - 0.5) * 3.4, d = R * (0.7 + q * 0.9), hop = Math.sin(q * Math.PI) * 18;
        ctx.globalAlpha = fade * (1 - q * q); clod(ctx, m.x + Math.cos(b) * d + ux * hop, m.y + Math.sin(b) * d + uy * hop, 4.2, i); }
      ctx.restore();
    }
  }
}
export function drawDunesAir() {}

// ---------------------------------------------------------------- its moves, on the floor and in the air
// Round 19: the grit and dust were discs in the floor's own colour with an ink outline, fading out: on sand they read
// as soap bubbles. Dust is the game's dust now (fxkit.js dustPuffs: pale, solid, each puff shrinking away to nothing),
// and a clod is a small angular lump of darker, damp sand with a lit top.
// dust rolling out round (x, y): n clouds of it, each a clump of three puffs under one outline (single outlined discs
// read as balls), `size` across at its biggest, swelling fast and then shrinking away to nothing
function dustRing(ctx, x, y, R, k, seed, n, size = 12) {
  const grow = k < 0.18 ? 0.45 + 3 * k : 1 - k01((k - 0.18) / 0.82); if (grow <= 0.08) return;
  const lumps = [];
  for (let i = 0; i < n; i++) { const a = (i + hash(seed, i)) / n * TAU, d = R * (0.45 + 0.6 * easeOut(k)) * (0.8 + 0.4 * hash(i, seed)), r = size * grow * (0.8 + 0.5 * hash(seed, i, 3)), cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d;
    lumps.push([cx, cy, r], [cx - Math.sin(a) * r * 0.95, cy + Math.cos(a) * r * 0.95, r * 0.72], [cx + Math.sin(a) * r * 0.85 + Math.cos(a) * r * 0.3, cy - Math.cos(a) * r * 0.85 + Math.sin(a) * r * 0.3, r * 0.62]); }
  figure(ctx, { ol: OUTLINE }, (F) => { for (const [cx, cy, r] of lumps) F.shape(() => circ(ctx, cx, cy, r), SAND[3], { seam: false });
    F.detail(() => { ctx.fillStyle = '#FFF8E6'; for (let i = 0; i < lumps.length; i += 3) { const [cx, cy, r] = lumps[i]; circ(ctx, cx - r * 0.22, cy - r * 0.26, r * 0.5); ctx.fill(); } }); });
}
function clod(ctx, x, y, r, i) {
  if (r < 1.2) return;
  const pts = []; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + hash(i, j) * 0.9, rr = r * (0.78 + 0.5 * hash(j, i)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  inked(ctx, () => poly(ctx, pts), i % 3 === 0 ? SAND[1] : SAND[0]);
  if (r > 3) { ctx.fillStyle = SAND[3]; poly(ctx, pts.map(([px, py]) => [x + (px - x) * 0.5 - r * 0.14, y + (py - y) * 0.5 - r * 0.2])); ctx.fill(); }
}
// Sand thrown out of a hole, seen from above (round 19: it was a bundle of tall stakes standing on the hole, drawn over
// the wurm coming out of it): rays of pale sand shot out along the floor from the hole's rim, as round a crater, each
// its own length; they shoot out fast and sift away. On the floor, flat, no outline (docs/FX-STYLE.md: ground effects).
function spray(ctx, x, y, R, k, seed, n, wd = 13, r0k = 0.3) {
  const e = easeOut(k01(k / 0.3)), a = 1 - k01((k - 0.3) / 0.6); if (a <= 0) return;
  for (const [col, ox, al] of [['96,64,28', 3, 0.22], ['246,232,196', 0, 0.92]]) { ctx.fillStyle = `rgba(${col},${al * a})`; ctx.beginPath();
    for (let i = 0; i < n; i++) { const b = (i + 0.7 * hash(seed, i)) / n * TAU, len = R * (0.4 + 0.75 * hash(i, seed)), r0 = R * r0k, r1 = r0 + len * e, hw = wd * (0.35 + 0.5 * hash(seed, i, 2)), c = Math.cos(b), sn = Math.sin(b);
      ctx.moveTo(x + c * r0 - sn * hw + ox, y + sn * r0 + c * hw + ox); ctx.lineTo(x + c * r1 + ox, y + sn * r1 + ox); ctx.lineTo(x + c * r0 + sn * hw + ox, y + sn * r0 - c * hw + ox); ctx.closePath(); }
    ctx.fill(); }
}
BFX.wurmHeave = { ground(ctx, f, k) { // where it will come up: the ground swells, and its crust lifts in slabs, more and higher as it comes
  const e = sm(k), R = f.r, n = 11;
  shade(ctx, f.x, f.y, R * (0.5 + 0.5 * e), R * (0.5 + 0.5 * e) * 0.92, 0.2 * e);
  ctx.fillStyle = rgbaOf(SAND[3], 0.3 * e); ctx.beginPath(); ctx.ellipse(f.x, f.y - 4 * e, R * 0.5 * e + 6, (R * 0.5 * e + 6) * 0.9, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < n; i++) { const born = hash(f.seed, i) * 0.6; if (k < born) continue; const q = k01((k - born) / 0.4), a = i / n * TAU + hash(i, f.seed), d = R * (0.22 + 0.6 * hash(f.seed, i, 2));
    slab(ctx, f.x, f.y, a, d, 12 + 9 * hash(i, 9), (3 + 9 * e) * q * (0.6 + 0.4 * Math.sin(k * 50 + i * 2)), i + f.seed); }
} };
BFX.wurmBreach = {
  ground(ctx, f, k) { // the crust thrown back in a ring, sand shot out along the floor
    const e = easeOut(k), R = f.r;
    ctx.save(); ctx.globalAlpha = (1 - k) * 0.85; ctx.strokeStyle = SAND[3]; ctx.lineWidth = 20 * (1 - k) + 3; ctx.beginPath(); ctx.arc(f.x, f.y, R * (0.35 + 0.75 * e), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + hash(i, f.seed); slab(ctx, f.x, f.y, a, R * (0.4 + 0.5 * e), 13 + 6 * hash(i, 4), 10 * (1 - k), i + 20); }
    ctx.restore();
    spray(ctx, f.x, f.y, R * 1.25, k, f.seed, 16, 13);
  },
  air(ctx, f, k) { // dust rolling out, clods flung wide
    const [ux, uy] = up(), R = f.r;
    if (k < 0.14) glow(ctx, f.x, f.y, R, '#FFF4D6', 0.7 * (1 - k / 0.14));
    dustRing(ctx, f.x, f.y, R * 1.05, k, f.seed, 7, 15);
    for (let i = 0; i < 14; i++) { const a = hash(i, f.seed) * TAU, q = k01(k * (1.1 + 0.5 * hash(i, 2))), d = R * (0.3 + 1.25 * hash(f.seed, i)) * easeOut(q), hop = Math.sin(q * Math.PI) * (50 + 70 * hash(i, 7));
      if (q >= 1) continue; clod(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, (5 + 5 * hash(i, 11)) * (1 - 0.4 * q), i); }
  },
};
BFX.wurmDive = { // head first into the sand: a low splash
  ground(ctx, f, k) { spray(ctx, f.x, f.y, 84, k, f.seed, 11, 10, 0.5); },
  air(ctx, f, k) {
    const [ux, uy] = up();
    dustRing(ctx, f.x, f.y, 70, k, f.seed, 5, 12);
    for (let i = 0; i < 8; i++) { const a = hash(i, f.seed) * TAU, d = 90 * hash(f.seed, i) * easeOut(k), hop = Math.sin(k * Math.PI) * 40 * hash(i, 7); clod(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, 5 * (1 - 0.6 * k), i); }
  },
};
BFX.wurmLunge = {
  ground(ctx, f, k) { ctx.globalAlpha = (1 - k) * 0.5; ctx.strokeStyle = 'rgba(96,64,28,0.7)'; ctx.lineCap = 'round'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); },
  air(ctx, f, k) { const a = Math.atan2(f.y2 - f.y1, f.x2 - f.x1), L = Math.hypot(f.x2 - f.x1, f.y2 - f.y1);
    for (let i = 0; i < 7; i++) { const q = (i + 0.5) / 7, s = i % 2 ? 1 : -1, d = (40 + 40 * easeOut(k)) * s; clod(ctx, f.x1 + Math.cos(a) * L * q - Math.sin(a) * d, f.y1 + Math.sin(a) * L * q + Math.cos(a) * d, 6 * (1 - k), i); }
  },
};
// The head stuck in the sand after a lunge (round 19: it lay there shut with nothing holding it): the sand it drove into
// heaped over its jaws, one pile with one outline, thrown up as it lands and crumbling as it pulls free.
BFX.wurmStuck = { air(ctx, f, k) {
  const up0 = easeOut(k01(k / 0.1)), down = 1 - k01((k - 0.8) / 0.2), g = up0 * down, ca = Math.cos(f.a), sa = Math.sin(f.a);
  if (g <= 0.05) return;
  const at = (d, s) => [f.x + ca * d - sa * s, f.y + sa * d + ca * s];
  figure(ctx, {}, (F) => {
    for (const [d, s, r] of [[26, -22, 21], [30, 20, 23], [44, -2, 27], [10, 2, 18]]) { const [x, y] = at(d, s);
      F.shape(() => ell(ctx, x, y, r * g * 1.15, r * g, f.a), () => rad(ctx, x - r * 0.3, y - r * 0.35, 1, r * 1.3, SAND[3], SAND[2], SAND[1]), { seam: false }); }
  });
  if (k < 0.35) { const q = k / 0.35, [ux, uy] = up(); for (let i = 0; i < 7; i++) { const b = f.a + (hash(i, f.seed) - 0.5) * 2.6, d = 30 + 70 * hash(f.seed, i) * easeOut(q), hop = Math.sin(q * Math.PI) * 34 * hash(i, 3), [x, y] = at(34, 0);
    clod(ctx, x + Math.cos(b) * d + ux * hop, y + Math.sin(b) * d + uy * hop, 5 * (1 - 0.5 * q), i); } }
} };
BFX.wurmInhale = {
  ground(ctx, f, k, w) { // the room breathed in: bands of sand running to the maw from all round, a dark well at its mouth
    if (f.mx == null) return; const T = w.time, R = f.range, fade = Math.min(1, k * 8, (1 - k) * 8);
    shade(ctx, f.mx, f.my, 170, 160, 0.3 * fade);
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) { // curved streaks, fat at the tail, drawn in to a point (round 19: stronger, a shadow beside each: they were faint scratches)
      const a = i / 26 * TAU + hash(i, 3) * 0.3, q = (T * (0.6 + 0.4 * hash(i, 1)) + hash(i, 2)) % 1, d1 = 50 + R * 0.8 * (1 - q) * (0.4 + 0.6 * hash(i, 4)), len = 60 + 100 * q, sw = 0.7 * (1 - q * 0.5);
      const x0 = f.mx + Math.cos(a + sw) * (d1 + len), y0 = f.my + Math.sin(a + sw) * (d1 + len), xm = f.mx + Math.cos(a + sw * 0.75) * (d1 + len * 0.5), ym = f.my + Math.sin(a + sw * 0.75) * (d1 + len * 0.5), x1 = f.mx + Math.cos(a + sw * 0.5) * d1, y1 = f.my + Math.sin(a + sw * 0.5) * d1;
      const ends = Math.min(1, q * 5, (1 - q) * 5);
      for (const [wd, col, al, off] of [[13, '110,74,32', 0.2, 3], [7, '255,246,220', 0.62, 0]]) { ctx.strokeStyle = `rgba(${col},${al * (0.5 + 0.5 * q) * fade * ends})`; ctx.lineWidth = wd * (0.6 + 0.6 * q); ctx.beginPath(); ctx.moveTo(x0 + off, y0 + off); ctx.quadraticCurveTo(xm + off, ym + off, x1 + off, y1 + off); ctx.stroke(); }
    }
  },
  air(ctx, f, k, w) { // clods torn off the floor, spiralling into the maw
    if (f.mx == null) return; const T = w.time, R = f.range * 0.6, fade = Math.min(1, k * 8, (1 - k) * 8), [ux, uy] = up();
    for (let i = 0; i < 18; i++) { const q = (T * (0.7 + 0.5 * hash(i, 7)) + hash(i, 8)) % 1, a = hash(i, 9) * TAU + q * 1.6, d = 30 + R * (1 - q) * (1 - q), hop = Math.sin(q * Math.PI) * 26;
      clod(ctx, f.mx + Math.cos(a) * d + ux * hop, f.my + Math.sin(a) * d + uy * hop, (3 + 4.5 * (1 - q)) * fade * Math.min(1, q * 6), i); }
  },
};
// The bite at the end of the inhale (round 19: it was two straight tusk bars with teeth closing from the sides over the
// head, nothing like its jaws). The jaws that bite are the head's own now: it darts forward and its mandibles clap shut
// (boss-wurm.js inhale). This is what the bite does to the place: a white snap at the maw, the sand jumping all the way
// out to the bite's reach.
BFX.wurmChomp = {
  ground(ctx, f, k) { const e = easeOut(k);
    ctx.save(); ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = SAND[3]; ctx.lineWidth = 16 * (1 - k) + 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.3 + 0.7 * e), 0, TAU); ctx.stroke(); ctx.restore();
    spray(ctx, f.x, f.y, f.r * 0.8, k, 6, 14, 12, 0.35); },
  air(ctx, f, k) { const [ux, uy] = up();
    if (k < 0.2) glow(ctx, f.x, f.y, f.r * 0.8, '#FFF4D6', 0.75 * (1 - k / 0.2));
    dustRing(ctx, f.x, f.y, f.r * 0.9, k, 6, 8, 15);
    for (let i = 0; i < 10; i++) { const a = hash(i, 5) * TAU, q = k01(k * (1.2 + 0.4 * hash(i, 2))), d = f.r * (0.3 + 0.7 * hash(5, i)) * easeOut(q), hop = Math.sin(q * Math.PI) * (30 + 40 * hash(i, 7)); if (q >= 1) continue;
      clod(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, 5.5 * (1 - 0.5 * q), i); } },
};
BFX.wurmRingHeave = { ground(ctx, f, k) { const e = sm(k), n = 26; for (let i = 0; i < n; i++) { const born = hash(i, 8) * 0.5; if (k < born) continue; const a = i / n * TAU; slab(ctx, f.x, f.y, a, f.r * (0.86 + 0.28 * hash(i, 2)), 12 + 7 * hash(i, 5), (3 + 9 * e) * (0.6 + 0.4 * Math.sin(k * 60 + i)), i); } } };
BFX.wurmRing = { // the whole ring bursts: sand shot out every few paces round it
  ground(ctx, f, k) { const n = 14; for (let i = 0; i < n; i++) { const a = i / n * TAU; spray(ctx, f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r, 66, k, i + 3, 6, 10, 0.25); } },
  air(ctx, f, k) {
    const [ux, uy] = up(), n = 14;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, x = f.x + Math.cos(a) * f.r, y = f.y + Math.sin(a) * f.r;
      for (let j = 0; j < 2; j++) { const b = a + (j ? 0.5 : -0.5), d = 70 * easeOut(k), hop = Math.sin(k * Math.PI) * 50; clod(ctx, x + Math.cos(b) * d + ux * hop, y + Math.sin(b) * d + uy * hop, 6 * (1 - 0.7 * k), i + j); }
      if (i % 2 === 0) dustRing(ctx, x, y, 50, k, i + 2, 2, 13); }
  },
};
BFX.wurmRoar = { air(ctx, f, k, w) { // its roar: sound lines bursting from the maw, wave after wave (the game's shout lines, a boss's size)
  const u = f.u; if (!u || u.dead || u.hidden) return; const T = w.time, [ux, uy] = up(), x = u.x + ux * (u.hop || 0) * 0.9, y = u.y + uy * (u.hop || 0) * 0.9;
  ctx.globalAlpha = Math.min(1, k * 6, (1 - k) * 4) * (u.vis ?? 1);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 9; i++) { const q = (T * 1.8 + j / 2 + i * 0.037) % 1, a = u.facing + (i - 4) * 0.2, r0 = u.vr * 1.4 + 150 * q, th = 8.5 * (1 - 0.6 * q);
    if (th > 1.5) streak(ctx, x, y, a, r0, r0 + 52 - 14 * q, th, '#FFF4D6'); }
} };
// Dead: each ring of it that was out drops where it is, as itself (the same ring, the same head), tips a little, and
// sinks into the sand, which heaps over it (round 19: it burst into brown ovals).
BFX.wurmChunk = {
  ground(ctx, f, k) { const g = sm((k - 0.3) / 0.4) * (1 - k01((k - 0.85) / 0.15)); if (g > 0.02) heap(ctx, f.x, f.y, f.r * 1.05 * g, f.r * 0.8 * g, f.a, 1); },
  air(ctx, f, k) {
    const [ux, uy] = up(), fall = k01(k / 0.2), h = f.hop * (1 - fall * fall), sink = 1 - 0.92 * sm((k - 0.4) / 0.5), turn = (hash(f.seed, 3) - 0.5) * 0.9 * sm(k / 0.4);
    if (k < 0.92) figure(ctx, {}, (F) => F.at(f.x + ux * h * 0.9, f.y + uy * h * 0.9, f.a + turn, () => (f.head ? head(F, ctx, f.r, f.jaw * (1 - fall), 0) : segment(F, ctx, f.r, f.last, 0, f.seg)), f.vis * (1 + h / 300) * sink));
    if (k > 0.18) dustRing(ctx, f.x, f.y, f.r * 1.5, k01((k - 0.18) / 0.6), f.seed, 3, 11);
  },
};
