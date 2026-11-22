// The Sand Wurm, drawn (lane B, bosses3). What is out of the sand is one figure (boss-draw.js): a plated golden body
// in the sand serpent's colours, thorned along its sides, tapering to a tail spike; a head whose two great mandibles
// open on a red maw ringed with teeth. What is under the sand shows on the floor: the mound that runs ahead of it, the
// furrow it leaves, the ground lifting in slabs where it will come up, the holes it uses. The fight's state is u.sw.
import { TAU, clamp } from './util.js';
import { inked } from './fx.js';
import { dustPuffs } from './fxkit.js';
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
  for (const s of [-1, 1]) F.at(R * 0.3, s * R * 0.62, s * (0.95 * open - 0.12), () => {
    F.shape(() => { ctx.beginPath(); ctx.moveTo(-R * 0.3, s * R * 0.3); ctx.quadraticCurveTo(R * 0.7, s * R * 0.5, R * 1.38, -s * R * 0.46); ctx.quadraticCurveTo(R * 0.55, -s * R * 0.12, -R * 0.12, -s * R * 0.3); ctx.closePath(); }, () => lin(ctx, 0, s * R * 0.4, R * 0.4, -s * R * 0.4, BONE[2], BONE[1], BONE[0]));
    F.detail(() => { ctx.fillStyle = BONE[0]; for (let i = 0; i < 3; i++) { const q = 0.38 + i * 0.2, x = R * 1.38 * q, y = -s * R * (0.02 + 0.3 * q * q); ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 1, y - s * 11); ctx.lineTo(x + 6, y); ctx.closePath(); ctx.fill(); }
      gloss(ctx, R * 0.4, s * R * 0.2, R * 0.3, R * 0.07, s * 0.3, 0.4); });
  });
  F.detail(() => { // the crest: three scutes fanned over the skull
    for (const [x, y, sc] of [[-R * 0.25, 0, 1], [-R * 0.05, -R * 0.52, 0.62], [-R * 0.05, R * 0.52, 0.62]]) { const p = R * 0.4 * sc;
      soft(ctx, [[x + p, y], [x + p * 0.2, y + p * 0.8], [x - p, y + p * 0.5], [x - p, y - p * 0.5], [x + p * 0.2, y - p * 0.8]]);
      ctx.fillStyle = lin(ctx, 0, y - p, 0, y + p, PLATE[0], PLATE[1]); ctx.fill(); ctx.strokeStyle = CREAM; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke(); }
    gloss(ctx, -R * 0.5, -R * 0.66, R * 0.3, R * 0.1, 0.2, 0.3, '255,246,214');
  });
}

export function drawWurm(ctx, u, w) {
  const k = u.sw; if (!k) return;
  const T = w.time, [ux, uy] = up();
  const list = [...k.parts].reverse().filter((p) => !p.dead && !p.hidden);
  if (u.hidden && !list.length) return;
  const stuck = u.stuck > 0; if (stuck) u.stuck -= w._dt || 0.016;
  figure(ctx, { wash: washOf(u, w), alpha: k.safe ? 0.85 : 1 }, (F) => {
    for (const p of list) { F.flash = false; const h = p.hop || 0; // (a blow on a ring of it doesn't flash: four heroes on eleven rings read as a white wurm)
      F.at(p.x + ux * h * 0.9, p.y + uy * h * 0.9, p.facing, () => segment(F, ctx, SEGR[p.seg] ?? p.vr, p.last, T, p.seg), (p.vis ?? 1) * (1 + h / 300)); }
    if (!u.hidden) { F.flash = flashing(u); const h = u.hop || 0, sh = stuck ? Math.sin(T * 70) * 1.5 : 0;
      F.at(u.x + ux * h * 0.9 + sh, u.y + uy * h * 0.9, u.facing, () => head(F, ctx, u.vr, u.jaw ?? 0.2, T), (u.vis ?? 1) * (1 + h / 300)); }
  });
}
const SEGR = [43, 43, 41, 39, 37, 35, 33, 30, 27, 24, 20];
// a segment as a unit only takes the blows: the body is drawn whole, with the head
export function drawWurmPart() {}

// ---------------------------------------------------------------- the floor: ripples, the furrow, the mound, the holes
// a heap of loose sand seen from above: a shadow on its down-screen side, a lit top
function heap(ctx, x, y, rx, ry, rot, a = 1) {
  const [ux, uy] = up();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = `rgba(96,64,28,${0.4 * a})`; ctx.beginPath(); ctx.ellipse(-ux * 0 + 0, 0, rx * 1.12, ry * 1.2, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x + ux * ry * 0.22, y + uy * ry * 0.22); ctx.rotate(rot);
  ctx.fillStyle = rgbaOf(SAND[2], 0.95 * a); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rgbaOf(SAND[3], 0.8 * a); ctx.beginPath(); ctx.ellipse(-rx * 0.12, -ry * 0.2, rx * 0.6, ry * 0.5, 0, 0, TAU); ctx.fill();
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
function drawHole(ctx, h) {
  const k = h.open ? k01(h.age / 0.15) : 1 - k01((h.age - h.shut) / 1.1), r = h.r * (0.45 + 0.55 * k);
  if (k <= 0.02) return;
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + h.x, rr = r * (1.06 + 0.1 * hash(i, Math.round(h.x))); heap(ctx, h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr, r * 0.36, r * 0.26, a + 1.57, k); }
  ctx.save(); ctx.globalAlpha = k;
  ctx.fillStyle = rad(ctx, h.x, h.y, r * 0.2, r, '#1E120C', '#3A2416', '#6E4A26'); ctx.beginPath(); ctx.ellipse(h.x, h.y, r, r * 0.92, 0, 0, TAU); ctx.fill();
  ctx.restore();
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
  for (const u of w.units) {
    const k = u.sw; if (!k || u.dead) continue;
    // the furrow: where it has dug, the sand lies heaped and slumps back over a few seconds
    for (let i = 0; i < k.trail.length; i++) { const p = k.trail[i], age = T - p.t0, a = 1 - k01(age / 6.5); if (a <= 0) continue;
      heap(ctx, p.x + Math.cos(p.a + 1.57) * 5 * (i % 2 ? 1 : -1), p.y + Math.sin(p.a + 1.57) * 5 * (i % 2 ? 1 : -1), 21 - 5 * k01(age / 6), 13, p.a, a * 0.9);
      ctx.strokeStyle = `rgba(96,64,28,${0.4 * a})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x - Math.cos(p.a) * 9, p.y - Math.sin(p.a) * 9); ctx.lineTo(p.x + Math.cos(p.a) * 9, p.y + Math.sin(p.a) * 9); ctx.stroke(); }
    for (const h of k.holes) drawHole(ctx, h);
    // the mound: the sand swelling over its back, slabs of crust tipping off its front, grit jumping
    if (u.hidden && k.st !== 'tell' && k.st !== 'coil2') { const m = k.mound, hv = clamp(m.heave, 0.3, 2), R = 34 + 9 * hv + 3 * Math.sin(T * 13);
      shade(ctx, m.x, m.y, R * 1.7, R * 1.5, 0.22);
      for (let i = 0; i < 4; i++) slab(ctx, m.x, m.y, m.a + (i - 1.5) * 0.62, R * (0.95 + 0.12 * Math.sin(T * 9 + i * 2)), 13 + 3 * (i % 2), 4 + 5 * hv * (0.5 + 0.5 * Math.sin(T * 11 + i * 1.9)), i + 3);
      heap(ctx, m.x - Math.cos(m.a) * 34, m.y - Math.sin(m.a) * 34, R * 0.7, R * 0.5, m.a, 1); heap(ctx, m.x - Math.cos(m.a) * 14, m.y - Math.sin(m.a) * 14, R * 0.95, R * 0.66, m.a, 1); heap(ctx, m.x + Math.cos(m.a) * 6, m.y + Math.sin(m.a) * 6, R * 0.9, R * 0.74, m.a, 1);
      ctx.strokeStyle = 'rgba(96,64,28,0.45)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m.x - Math.cos(m.a) * 40, m.y - Math.sin(m.a) * 40); ctx.lineTo(m.x + Math.cos(m.a) * 10, m.y + Math.sin(m.a) * 10); ctx.stroke();
      for (let i = 0; i < 6; i++) { const q = (T * 2.4 + hash(i, 5)) % 1, b = m.a + (hash(i, Math.floor(T * 2.4 + hash(i, 5))) - 0.5) * 3.4, d = R * (0.7 + q * 0.9), hop = Math.sin(q * Math.PI) * 16, [ux, uy] = up();
        ctx.fillStyle = rgbaOf(i % 2 ? SAND[1] : SAND[0], 1 - q); ctx.beginPath(); ctx.arc(m.x + Math.cos(b) * d + ux * hop, m.y + Math.sin(b) * d + uy * hop, 3.2, 0, TAU); ctx.fill(); }
    }
  }
}
export function drawDunesAir() {}

// ---------------------------------------------------------------- its moves, on the floor and in the air
// dust in small puffs rolling out round (x, y): n of them, each `size` across at first
function dustRing(ctx, x, y, R, k, seed, n, size = 12) {
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < n; i++) { const a = (i + hash(seed, i)) / n * TAU, d = R * (0.45 + 0.6 * easeOut(k)) * (0.8 + 0.4 * hash(i, seed)); inkDisc(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, size * (1 - 0.5 * k) * (0.7 + 0.6 * hash(seed, i, 3)) + 1.5, i % 3 ? SAND[2] : SAND[3]); }
  ctx.restore();
}
const clod = (ctx, x, y, r, i) => inkDisc(ctx, x, y, r, i % 3 === 0 ? SAND[3] : i % 3 === 1 ? SAND[2] : SAND[1]);
// a jet of sand standing up out of the floor (leans up the screen), h tall: a pointed spray, two lesser ones beside it
function plume(ctx, x, y, h, wd, a = 1, lean = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(upRot() + lean); ctx.globalAlpha *= a;
  const jet = (ox, hh, ww, col, hi) => {
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(ox - ww, 0); ctx.quadraticCurveTo(ox - ww * 0.9, -hh * 0.55, ox + ww * 0.15, -hh); ctx.quadraticCurveTo(ox + ww * 0.95, -hh * 0.5, ox + ww, 0); ctx.quadraticCurveTo(ox, ww * 0.45, ox - ww, 0); ctx.closePath(); }, col);
    ctx.fillStyle = hi; ctx.beginPath(); ctx.moveTo(ox - ww * 0.55, -2); ctx.quadraticCurveTo(ox - ww * 0.5, -hh * 0.5, ox + ww * 0.05, -hh * 0.86); ctx.quadraticCurveTo(ox - ww * 0.05, -hh * 0.4, ox + ww * 0.05, -2); ctx.closePath(); ctx.fill();
  };
  jet(-wd * 0.95, h * 0.58, wd * 0.62, SAND[1], SAND[2]); jet(wd * 0.95, h * 0.68, wd * 0.62, SAND[1], SAND[2]); jet(0, h, wd * 0.8, SAND[2], SAND[3]);
  ctx.restore();
}
BFX.wurmHeave = { ground(ctx, f, k) { // where it will come up: the ground swells, and its crust lifts in slabs, more and higher as it comes
  const e = sm(k), R = f.r, n = 11;
  shade(ctx, f.x, f.y, R * (0.5 + 0.5 * e), R * (0.5 + 0.5 * e) * 0.92, 0.2 * e);
  ctx.fillStyle = rgbaOf(SAND[3], 0.3 * e); ctx.beginPath(); ctx.ellipse(f.x, f.y - 4 * e, R * 0.5 * e + 6, (R * 0.5 * e + 6) * 0.9, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < n; i++) { const born = hash(f.seed, i) * 0.6; if (k < born) continue; const q = k01((k - born) / 0.4), a = i / n * TAU + hash(i, f.seed), d = R * (0.22 + 0.6 * hash(f.seed, i, 2));
    slab(ctx, f.x, f.y, a, d, 12 + 9 * hash(i, 9), (3 + 9 * e) * q * (0.6 + 0.4 * Math.sin(k * 50 + i * 2)), i + f.seed); }
} };
BFX.wurmBreach = {
  ground(ctx, f, k) { // the crust thrown back in a ring, the dust rolling out along the floor
    const e = easeOut(k), R = f.r;
    ctx.globalAlpha = (1 - k) * 0.85; ctx.strokeStyle = SAND[3]; ctx.lineWidth = 20 * (1 - k) + 3; ctx.beginPath(); ctx.arc(f.x, f.y, R * (0.35 + 0.75 * e), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + hash(i, f.seed); slab(ctx, f.x, f.y, a, R * (0.4 + 0.5 * e), 13 + 6 * hash(i, 4), 10 * (1 - k), i + 20); }
  },
  air(ctx, f, k) { // the fountain: spouts of sand up out of the hole, clods flung wide
    const [ux, uy] = up(), R = f.r, rise = Math.sin(k01(k / 0.75) * Math.PI);
    if (k < 0.14) glow(ctx, f.x, f.y, R, '#FFF4D6', 0.7 * (1 - k / 0.14));
    dustRing(ctx, f.x, f.y, R * 1.1, k, f.seed, 14, 13); dustRing(ctx, f.x, f.y, R * 0.6, k, f.seed + 5, 8, 11);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.4, d = R * 0.28 * (0.5 + easeOut(k)); plume(ctx, f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * 0.7, (85 + 60 * hash(i, f.seed)) * rise + 6, 13 + 4 * hash(f.seed, i), k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3, Math.cos(a) * 0.35); }
    for (let i = 0; i < 16; i++) { const a = hash(i, f.seed) * TAU, q = k01(k * (1.1 + 0.5 * hash(i, 2))), d = R * (0.3 + 1.25 * hash(f.seed, i)) * easeOut(q), hop = Math.sin(q * Math.PI) * (50 + 70 * hash(i, 7));
      if (q >= 1) continue; clod(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, (5 + 6 * hash(i, 11)) * (1 - 0.4 * q), i); }
  },
};
BFX.wurmDive = { air(ctx, f, k) { // head first into the sand: a low splash
  const [ux, uy] = up(), rise = Math.sin(k01(k / 0.8) * Math.PI);
  dustRing(ctx, f.x, f.y, 70, k, f.seed, 9, 11);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.8; plume(ctx, f.x + Math.cos(a) * 26, f.y + Math.sin(a) * 18, (38 + 22 * hash(i, f.seed)) * rise + 4, 11, k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3); }
  for (let i = 0; i < 8; i++) { const a = hash(i, f.seed) * TAU, d = 90 * hash(f.seed, i) * easeOut(k), hop = Math.sin(k * Math.PI) * 40 * hash(i, 7); clod(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, 5 * (1 - 0.5 * k) + 1, i); }
} };
BFX.wurmLunge = {
  ground(ctx, f, k) { ctx.globalAlpha = (1 - k) * 0.5; ctx.strokeStyle = 'rgba(96,64,28,0.7)'; ctx.lineCap = 'round'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); },
  air(ctx, f, k) { const a = Math.atan2(f.y2 - f.y1, f.x2 - f.x1), L = Math.hypot(f.x2 - f.x1, f.y2 - f.y1);
    for (let i = 0; i < 7; i++) { const q = (i + 0.5) / 7, s = i % 2 ? 1 : -1, d = (30 + 40 * easeOut(k)) * s; ctx.save(); ctx.globalAlpha = 1 - k; clod(ctx, f.x1 + Math.cos(a) * L * q - Math.sin(a) * d, f.y1 + Math.sin(a) * L * q + Math.cos(a) * d, 6 * (1 - k) + 2, i); ctx.restore(); }
    dustRing(ctx, f.x2, f.y2, 60, k, 4, 8, 11); },
};
BFX.wurmInhale = {
  ground(ctx, f, k, w) { // the room breathed in: bands of sand running to the maw from all round, a dark well at its mouth
    if (f.mx == null) return; const T = w.time, R = f.range, fade = Math.min(1, k * 8, (1 - k) * 8);
    shade(ctx, f.mx, f.my, 170, 160, 0.3 * fade);
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) { // curved streaks, fat at the tail, drawn in to a point
      const a = i / 26 * TAU + hash(i, 3) * 0.3, q = (T * (0.6 + 0.4 * hash(i, 1)) + hash(i, 2)) % 1, d1 = 50 + R * 0.8 * (1 - q) * (0.4 + 0.6 * hash(i, 4)), len = 60 + 100 * q, sw = 0.7 * (1 - q * 0.5);
      const x0 = f.mx + Math.cos(a + sw) * (d1 + len), y0 = f.my + Math.sin(a + sw) * (d1 + len), xm = f.mx + Math.cos(a + sw * 0.75) * (d1 + len * 0.5), ym = f.my + Math.sin(a + sw * 0.75) * (d1 + len * 0.5), x1 = f.mx + Math.cos(a + sw * 0.5) * d1, y1 = f.my + Math.sin(a + sw * 0.5) * d1;
      for (const [wd, al] of [[10, 0.16], [5, 0.3]]) { ctx.strokeStyle = rgbaOf(SAND[3], al * (0.5 + 0.5 * q) * fade); ctx.lineWidth = wd * (0.6 + 0.6 * q); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(xm, ym, x1, y1); ctx.stroke(); }
    }
  },
  air(ctx, f, k, w) { // grit and clods torn off the floor, spiralling into the maw
    if (f.mx == null) return; const T = w.time, R = f.range * 0.6, fade = Math.min(1, k * 8, (1 - k) * 8), [ux, uy] = up();
    ctx.globalAlpha = fade;
    for (let i = 0; i < 16; i++) { const q = (T * (0.7 + 0.5 * hash(i, 7)) + hash(i, 8)) % 1, a = hash(i, 9) * TAU + q * 1.6, d = 30 + R * (1 - q) * (1 - q), hop = Math.sin(q * Math.PI) * 26;
      clod(ctx, f.mx + Math.cos(a) * d + ux * hop, f.my + Math.sin(a) * d + uy * hop, 3 + 5 * (1 - q), i); }
  },
};
BFX.wurmChomp = { air(ctx, f, k) { // the jaws shut: two tusk crescents snapping together, sand jumping
  const e = easeOut(k01(k / 0.3)), gap = f.r * 0.8 * (1 - e);
  ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(f.x - Math.sin(f.a) * gap * s, f.y + Math.cos(f.a) * gap * s); ctx.rotate(f.a);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-f.r * 0.8, s * f.r * 0.5); ctx.quadraticCurveTo(0, s * f.r * 0.62, f.r * 0.8, s * f.r * 0.5); ctx.quadraticCurveTo(0, s * f.r * 0.2, -f.r * 0.8, s * f.r * 0.5); ctx.closePath(); }, BONE[1]);
    ctx.fillStyle = BONE[0]; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * f.r * 0.26 - 9, s * f.r * 0.34); ctx.lineTo(i * f.r * 0.26, s * f.r * 0.04); ctx.lineTo(i * f.r * 0.26 + 9, s * f.r * 0.34); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
  if (k > 0.25) dustRing(ctx, f.x, f.y, f.r * 0.9, k01((k - 0.25) / 0.75), 6, 12, 12);
} };
BFX.wurmRingHeave = { ground(ctx, f, k) { const e = sm(k), n = 26; for (let i = 0; i < n; i++) { const born = hash(i, 8) * 0.5; if (k < born) continue; const a = i / n * TAU; slab(ctx, f.x, f.y, a, f.r * (0.86 + 0.28 * hash(i, 2)), 12 + 7 * hash(i, 5), (3 + 9 * e) * (0.6 + 0.4 * Math.sin(k * 60 + i)), i); } } };
BFX.wurmRing = { air(ctx, f, k) { // the whole ring bursts: a spout every few paces round it
  const rise = Math.sin(k01(k / 0.8) * Math.PI), [ux, uy] = up(), n = 14;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, x = f.x + Math.cos(a) * f.r, y = f.y + Math.sin(a) * f.r; plume(ctx, x, y, (60 + 40 * hash(i, 3)) * rise + 5, 14, k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3);
    for (let j = 0; j < 2; j++) { const b = a + (j ? 0.5 : -0.5), d = 70 * easeOut(k), hop = Math.sin(k * Math.PI) * 50; clod(ctx, x + Math.cos(b) * d + ux * hop, y + Math.sin(b) * d + uy * hop, 6 * (1 - 0.5 * k) + 1, i + j); } }
  for (let i = 0; i < n; i++) { const a = i / n * TAU; dustRing(ctx, f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r, 60, k, i + 2, 4, 11); }
} };
BFX.wurmRoar = { air(ctx, f, k, w) { // its roar: short lines bursting from the maw, sand shaken off the roof
  const u = f.u; if (!u || u.dead || u.hidden) return; const T = w.time, [ux, uy] = up(), x = u.x + ux * (u.hop || 0) * 0.9, y = u.y + uy * (u.hop || 0) * 0.9;
  ctx.globalAlpha = Math.min(1, k * 6, (1 - k) * 4);
  for (let i = 0; i < 9; i++) { const q = (T * 2.2 + i / 9) % 1, a = u.facing + (i - 4) * 0.2; streak(ctx, x, y, a, u.vr * 1.3 + 90 * q, u.vr * 1.3 + 90 * q + 34, 5, '#FFF4D6'); }
} };
BFX.wurmChunk = { air(ctx, f, k) { // dead: each ring of it slumps and scatters
  const e = easeOut(k), [ux, uy] = up(); ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  for (let i = 0; i < 4; i++) { const a = f.a + i * 1.57 + hash(f.seed, i), d = f.r * 1.6 * e * (0.5 + hash(i, f.seed)), hop = Math.sin(k01(k * 1.3) * Math.PI) * 30;
    ctx.save(); ctx.translate(f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop); ctx.rotate(a + k * 5);
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, f.r * 0.5, f.r * 0.36, 0, 0, TAU); }, i % 2 ? GOLD[1] : PLATE[0]); ctx.restore(); }
  dustRing(ctx, f.x, f.y, f.r * 1.6, k, f.seed, 6, 10);
} };
