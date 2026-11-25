// The Canopy Idol, drawn (round 19, lane stilts19). One figure (boss-draw.js: every shape in ink, then in paint, so the
// whole jointed thing has one outline). Seen from above like everything else, and like everything else that stands up
// off the floor, height shows as a shift up the screen: the head rides k.h over its floor point (its shadow stays
// there, in the shared shadow layer), each hoof is on the floor, and each knee is solved between hip and hoof in three
// dimensions (boss-spider-fx.js knee3) and then put on the screen the same way. Nothing is posed by hand: with the head
// up, each stilt is a short thigh out from the yoke and a long shin slanting down to its hoof; when the head drops, the
// hooves stay where they are and every knee is left standing high over it.
// What it looks like: a great carved hardwood idol head (a heavy brow, two glowing eyes under it, a jutting jaw with
// bone teeth and two tusks, jade ear spools), its back grown over with moss and a crown of broad leaves and red
// blooms, seed pods hanging behind; under it a yoke of lashed poles, and six bamboo stilts (ringed with nodes, a knot
// of lashing at each knee), each ending in a carved stone hoof. The hoof is the part to hit. A broken stilt is dry and
// grey: snapped below the knee, the stump hanging and swinging, the hoof on its side on the floor at the end of a
// strand of lashing.
import { TAU, clamp, INK } from './util.js';
import { inked, inkLine } from './fx.js';
import { quake, dustPuffs } from './fxkit.js';
import { figure, washOf, flashing, lin, gloss, glow, ell, circ, capsule, poly, rrect, up, BFX, easeOut, sm, k01, hash, inkDisc } from './boss-draw.js';
import { castShadow } from './height.js';
import { knee3 } from './boss-spider-fx.js';
import { ID, LEGS, hipOf } from './boss-stilt.js';

const WOOD = ['#C08A58', '#8F5D38', '#5C3822'], BROW = ['#9A6740', '#6E452A', '#472B1A'];   // the idol's hardwood: light, main, dark
const MOSS = ['#A9D873', '#6DA846', '#3E7A38'], LEAF = ['#93D66B', '#58A848', '#2F7439'];
const BAM = ['#EDE08E', '#BDB35C', '#7F7B3A'], KNOT = ['#C9AE6C', '#8E7541', '#5A4827'];     // bamboo; the lashing at a joint
const STONE = ['#E6EBD6', '#AFBCA3', '#72826E'], JADE = ['#C6F2D6', '#6FC79C', '#3B8C6C'];
const BONE = ['#FFF6E2', '#E6D8B8', '#B5A586'], EYE = ['#F8FFC8', '#C6F24A', '#FF9A2E'];
const BLOOM = ['#FF9A6A', '#E8472F'], POD = ['#D98F52', '#9A4A4E', '#5E2A3A'], VINE = ['#86C456', '#4E8A3A'];
const DEAD = ['#B9B19A', '#8C856F', '#5F5A4B'], DEAD_STONE = ['#C9CBC0', '#93978C', '#62665E'];
const KNEE_OUT = 0.3;
const pz = (z) => 1 + z / 420;   // a part nearer the eye is drawn a little thicker
export const headScale = (h) => (1 + h / ID.body.sc) * ID.body.big;

// ---------------------------------------------------------------- a pose, and the figure drawn from it
// P: { gx, gy (the floor point under the head), f (facing), h (its height), T, legs: [{ i, hip, foot, side, broken,
// hurt 0..1, flash, sw (a broken stilt's swing) }], glare 0..1 (its
// eyes), maw 0..1 (open), daze, flash, pods 0..3 (hanging behind), shake 0..1 (its crown), jit }.
const hipAt = (gx, gy, f, h, d) => ({ x: gx + Math.cos(f) * d.hx - Math.sin(f) * d.hy, y: gy + Math.sin(f) * d.hx + Math.cos(f) * d.hy, z: h });
export function restPose(gx, gy, f, h = ID.body.h) {
  return { gx, gy, f, h, T: 0, glare: 0, maw: 0, daze: false, flash: false, pods: 3, shake: 0, jit: 0,
    legs: LEGS.map((d, i) => ({ i, hip: hipAt(gx, gy, f, h, d), foot: { x: gx + Math.cos(f + d.th) * ID.leg.restR, y: gy + Math.sin(f + d.th) * ID.leg.restR, z: 0 }, side: d.side, broken: false, hurt: 0, flash: false, sw: 0 })) };
}
export function drawPose(ctx, P, o = {}) {
  const [ux, uy] = o.up || up(), G = ID.leg, fx = Math.cos(P.f), fy = Math.sin(P.f);
  const pr = (p) => [p.x + ux * p.z * 0.9, p.y + uy * p.z * 0.9];
  const legs = P.legs.map((L) => {
    const s = L.side;
    let kn, stub = null;
    if (L.broken) {
      // what is left of it: the thigh still sticks out from the yoke, stiff in its lashing, sagging; the shin is snapped a
      // little below the knee and that stump hangs straight down, well short of the floor, and swings (L.sw)
      const a = P.f + LEGS[L.i].th, nx = Math.cos(a), ny = Math.sin(a), tx = -ny, ty = nx, sw = L.sw || 0;
      const dr1 = Math.min(56, Math.max(0, L.hip.z - 5)), h1 = Math.sqrt(G.l1 * G.l1 - dr1 * dr1);
      kn = { x: L.hip.x + nx * h1, y: L.hip.y + ny * h1, z: L.hip.z - dr1 };
      const SL = 30, dr2 = Math.min(SL * 0.97, Math.max(0, kn.z - 4)), h2 = Math.sqrt(SL * SL - dr2 * dr2);
      stub = { x: kn.x + nx * h2 + tx * sw * 22, y: kn.y + ny * h2 + ty * sw * 22, z: kn.z - dr2 };
    } else {
      // a stilt bends upwards (and a little out to its own side): a short thigh up and out, a long shin down
      kn = knee3(L.hip, L.foot, G.l1, G.l2, { x: -fy * s * KNEE_OUT, y: fx * s * KNEE_OUT, z: 1 });
      if (kn.z < 6) kn.z = 6;
    }
    // Every stilt is drawn under the head. Seen from above and in front, whatever of a stilt lies behind the head's
    // picture is lower than the head and further off, so the head hides it: a hoof lifted to stamp passes under its
    // chin, not across its face. (With the head down on the floor its knees are left standing over it; drawn under it
    // all the same, so the head stays in plain sight.) Far stilts first.
    const depth = -(L.hip.x * ux + L.hip.y * uy);
    return { L, hip: pr(L.hip), knee: pr(kn), foot: pr(L.foot), stub: stub && pr(stub), kz: kn.z, sz: stub ? stub.z : 0, depth };
  }).sort((a, b) => a.depth - b.depth);
  const jx = P.jit ? (hash(Math.floor(P.T * 50), 1) - 0.5) * P.jit : 0, jy = P.jit ? (hash(Math.floor(P.T * 50), 2) - 0.5) * P.jit : 0;
  const [bx, by] = pr({ x: P.gx + jx, y: P.gy + jy, z: P.h });
  figure(ctx, { wash: o.wash, alpha: o.alpha }, (F) => {
    F.flash = false;
    for (const A of legs) drawLeg(F, ctx, A);
    drawYoke(F, ctx, bx, by, P);
    F.flash = !!P.flash;
    drawHead(F, ctx, bx, by, P, headScale(P.h));
  });
}
// a length of bamboo from a to b: a tapering cane with a ring at each node
function cane(F, ctx, ax, ay, ar, bx, by, br, cols, nodes, so) {
  F.shape(() => capsule(ctx, ax, ay, ar, bx, by, br), () => lin(ctx, ax, ay, bx, by, cols[2], cols[1], cols[0]), so);
  for (const q of nodes) { const x = ax + (bx - ax) * q, y = ay + (by - ay) * q, r = (ar + (br - ar) * q) * 1.22;
    F.shape(() => circ(ctx, x, y, r), cols[1], { ...so, seam: false }); }
  F.detail(() => { // the dark line of each node, across the cane
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    ctx.strokeStyle = 'rgba(60,58,24,0.55)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    for (const q of nodes) { const x = ax + dx * q, y = ay + dy * q, r = (ar + (br - ar) * q) * 0.95; ctx.beginPath(); ctx.moveTo(x + nx * r, y + ny * r); ctx.lineTo(x - nx * r, y - ny * r); ctx.stroke(); }
  });
}
// a knot of lashing round a joint
function knot(F, ctx, x, y, r, so, dead) {
  const c = dead ? DEAD : KNOT;
  F.shape(() => circ(ctx, x, y, r), () => { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0.5, x, y, r * 1.1); g.addColorStop(0, c[0]); g.addColorStop(0.55, c[1]); g.addColorStop(1, c[2]); return g; }, so);
  F.detail(() => { ctx.strokeStyle = dead ? 'rgba(60,56,44,0.6)' : 'rgba(62,90,40,0.85)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.62, y - r * 0.5); ctx.lineTo(x + r * 0.62, y + r * 0.5); ctx.moveTo(x - r * 0.62, y + r * 0.5); ctx.lineTo(x + r * 0.62, y - r * 0.5); ctx.stroke(); });
}
function drawLeg(F, ctx, A) {
  const L = A.L, so = { flash: L.flash }, [hx, hy] = A.hip, [kx, ky] = A.knee, [x, y] = A.foot;
  const ks = pz(A.kz), hs = pz(L.hip.z), fs = 1 + L.foot.z / 260; // (a hoof lifted towards you is drawn bigger)
  if (L.broken) {
    const [sx, sy] = A.stub, ss = pz(A.sz);
    // the rest of the shin lies on the floor with the hoof on its end, tied to the stump by a strand of the lashing
    // (it lies askew, not in line with the stump: in line, the pieces read as one whole grey stilt)
    const dx = x - sx, dy = y - sy, d = Math.hypot(dx, dy) || 1, bx0 = d > 6 ? dx / d : 1, by0 = d > 6 ? dy / d : 0, sk = (L.i & 1 ? 1 : -1) * 1.05;
    const ax = bx0 * Math.cos(sk) - by0 * Math.sin(sk), ay = bx0 * Math.sin(sk) + by0 * Math.cos(sk);
    const tx = x - ax * 22, ty = y - ay * 22, ex = x - ax * 74, ey = y - ay * 74;
    F.line(() => { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + ex) / 2 - ay * 10, (sy + ey) / 2 + ax * 10, ex, ey); }, '#6E7F4A', 2.6);
    cane(F, ctx, tx, ty, 4.6, ex, ey, 4.4, DEAD, [0.3, 0.7]);
    F.shape(() => poly(ctx, [[ex + ay * 5, ey - ax * 5], [ex - ax * 8 + ay * 2, ey - ay * 8 - ax * 2], [ex - ax * 2, ey - ay * 2], [ex - ax * 9 - ay * 3, ey - ay * 9 + ax * 3], [ex - ay * 5, ey + ax * 5]]), DEAD[0], { seam: false });
    F.shape(() => capsule(ctx, x, y, 9.4, tx, ty, 6.4), () => lin(ctx, x, y, tx, ty, DEAD_STONE[1], DEAD_STONE[0]));
    F.detail(() => { // the cracked hoof
      ctx.strokeStyle = 'rgba(43,34,48,0.7)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const mx = x - ax * 9, my = y - ay * 9;
      ctx.beginPath(); ctx.moveTo(mx - ay * 7, my + ax * 7); ctx.lineTo(mx + ax * 3, my + ay * 3); ctx.lineTo(mx + ay * 7 - ax * 2, my - ax * 7 - ay * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx + ax * 3, my + ay * 3); ctx.lineTo(x + ax * 2 - ay * 5, y + ay * 2 + ax * 5); ctx.stroke();
    });
    // the stilt itself: dry and grey, the thigh hanging from the hip, the snapped shin below the knee
    cane(F, ctx, kx, ky, 5 * ks, sx, sy, 4.6 * ss, DEAD, []);
    { const ux2 = sx - kx, uy2 = sy - ky, ul = Math.hypot(ux2, uy2) || 1, cx = ux2 / ul, cy = uy2 / ul; // its splintered end
      F.shape(() => poly(ctx, [[sx - cy * 5 * ss, sy + cx * 5 * ss], [sx + cx * 9 - cy * 2, sy + cy * 9 + cx * 2], [sx + cx * 2, sy + cy * 2], [sx + cx * 11 + cy * 3, sy + cy * 11 - cx * 3], [sx + cy * 5 * ss, sy - cx * 5 * ss]]), DEAD[0], { seam: false }); }
    cane(F, ctx, hx, hy, 5.8 * hs, kx, ky, 5.2 * ks, DEAD, [0.55]);
    knot(F, ctx, kx, ky, 7.4 * ks, null, true);
    knot(F, ctx, hx, hy, 6.6 * hs, null, true);
    return;
  }
  // the long shin down to the hoof; the stone hoof, heavier at the floor
  const tx = kx + (x - kx) * 0.84, ty = ky + (y - ky) * 0.84;
  cane(F, ctx, kx, ky, 5.3 * ks, tx, ty, 4.5 * fs, BAM, [0.2, 0.42, 0.64, 0.86], so);
  F.shape(() => capsule(ctx, tx, ty, 6.6 * fs, x, y, 9.6 * fs), () => lin(ctx, tx, ty, x, y, STONE[0], STONE[1], STONE[2]), so);
  F.detail(() => {
    const dx = x - tx, dy = y - ty, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    // a carved band round it, and a little moss
    ctx.strokeStyle = 'rgba(70,84,70,0.75)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const bx = tx + dx * 0.42, by = ty + dy * 0.42, bw = 7.2 * fs;
    ctx.beginPath(); ctx.moveTo(bx + nx * bw, by + ny * bw); ctx.lineTo(bx - nx * bw, by - ny * bw); ctx.stroke();
    ctx.fillStyle = MOSS[1]; ctx.beginPath(); ctx.arc(x + nx * 4 * fs, y + ny * 4 * fs, 2.6 * fs, 0, TAU); ctx.fill();
    if (L.hurt > 0.3) { // it cracks as the hoof is hurt
      ctx.strokeStyle = 'rgba(43,34,48,0.75)'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      for (const [q, n] of L.hurt > 0.65 ? [[0.62, 1], [0.95, -1]] : [[0.8, 1]]) {
        const cx = tx + dx * q, cy = ty + dy * q, wd = (6 + 3 * q) * fs;
        ctx.beginPath(); ctx.moveTo(cx + nx * wd, cy + ny * wd); ctx.lineTo(cx + dx * 0.12 * n, cy + dy * 0.12 * n); ctx.lineTo(cx - nx * wd, cy - ny * wd); ctx.stroke();
      }
    }
  });
  // the short thigh out from the yoke, the knots of lashing at knee and hip
  cane(F, ctx, hx, hy, 5.9 * hs, kx, ky, 5.4 * ks, BAM, [0.5], so);
  knot(F, ctx, kx, ky, 7.6 * ks, so);
  knot(F, ctx, hx, hy, 6.6 * hs, so);
}
// a round thing lit from the screen's upper left, whatever way the head is turned (the frame is turned by f)
const lit = (ctx, x, y, r, f, c) => () => { const lx = -0.36 * r, ly = -0.42 * r, c0 = Math.cos(f), s0 = Math.sin(f);
  const g = ctx.createRadialGradient(x + lx * c0 + ly * s0, y - lx * s0 + ly * c0, r * 0.05, x, y, r * 1.15); g.addColorStop(0, c[0]); g.addColorStop(0.5, c[1]); g.addColorStop(1, c[2]); return g; };
const litAt = (x, y, r, f) => { const lx = -0.36 * r, ly = -0.44 * r, c0 = Math.cos(f), s0 = Math.sin(f); return [x + lx * c0 + ly * s0, y - lx * s0 + ly * c0]; };
// a leaf from (x, y) pointing along a, len long and wid wide at its belly
const leafPath = (ctx, x, y, a, len, wid) => { const c = Math.cos(a), s = Math.sin(a), tx = x + c * len, ty = y + s * len, mx = x + c * len * 0.42, my = y + s * len * 0.42;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(mx - s * wid, my + c * wid, tx, ty); ctx.quadraticCurveTo(mx + s * wid, my - c * wid, x, y); ctx.closePath(); };
// the yoke the head sits on: three poles across, a stilt lashed to each end (room units: the hips are where the fight has them)
function drawYoke(F, ctx, bx, by, P) {
  F.at(bx, by, P.f, () => {
    for (const [x, y] of [[36, 50], [0, 56], [-36, 50]]) F.line(() => { ctx.beginPath(); ctx.moveTo(x, -y); ctx.lineTo(x, y); }, BAM[2], 7);
  });
}
function drawHead(F, ctx, bx, by, P, sc) {
  const f = P.f, open = clamp(P.maw || 0, 0, 1), gl = clamp(P.glare || 0, 0, 1), T = P.T, sh = P.shake || 0;
  F.at(bx, by, f, () => {
    // (front is +x here) its crown of leaves, fanned out behind and to the sides; the seed pods hanging behind
    const LV = [[Math.PI, 58, 19], [Math.PI - 0.52, 56, 18], [Math.PI + 0.52, 56, 18], [Math.PI - 1.02, 50, 17], [Math.PI + 1.02, 50, 17], [Math.PI - 1.5, 40, 15], [Math.PI + 1.5, 40, 15]];
    LV.forEach(([a0, len, wid], i) => {
      const a = a0 + Math.sin(T * 1.5 + i * 1.7) * 0.045 + (sh ? Math.sin(T * 38 + i * 2.1) * 0.16 * sh : 0), x0 = -18 + Math.cos(a0) * 14, y0 = Math.sin(a0) * 16;
      F.shape(() => leafPath(ctx, x0, y0, a, len, wid), () => lin(ctx, x0, y0, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len, LEAF[2], LEAF[1], LEAF[0]));
      F.detail(() => { ctx.strokeStyle = 'rgba(38,92,48,0.7)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + Math.cos(a) * 8, y0 + Math.sin(a) * 8); ctx.lineTo(x0 + Math.cos(a) * len * 0.86, y0 + Math.sin(a) * len * 0.86); ctx.stroke(); });
    });
    const np = Math.round(clamp(P.pods ?? 3, 0, 3));
    [[-58, 0], [-52, -17], [-52, 17]].slice(0, np).forEach(([px, py], i) => {
      const wob = Math.sin(T * 2.3 + i * 2) * 1.5 + (sh ? Math.sin(T * 44 + i) * 3 * sh : 0);
      F.shape(() => ell(ctx, px, py + wob, 9, 7), lit(ctx, px, py + wob, 9, f, POD));
      F.detail(() => { ctx.strokeStyle = 'rgba(70,30,40,0.6)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(px - 7, py + wob); ctx.lineTo(px + 7, py + wob); ctx.stroke(); });
    });
    // the head: a domed back, a long jaw block, the brow across it, an ear spool each side
    for (const s of [-1, 1]) F.shape(() => circ(ctx, 0, s * 36, 9), lit(ctx, 0, s * 36, 9, f, JADE));
    F.shape(() => ell(ctx, -8, 0, 36, 33), lit(ctx, -8, 0, 40, f, WOOD));
    // its mouth: the lower jaw juts out when it opens; bone teeth along it, two tusks at the corners
    F.shape(() => rrect(ctx, 46, -22, 10 + 9 * open, 44, 3), '#2E1A1A', { seam: false });
    F.shape(() => rrect(ctx, 54 + 9 * open, -25, 9, 50, 4.5), () => lin(ctx, 54, 0, 66, 0, BROW[1], BROW[2]));
    for (const y of [-17, -8.5, 0, 8.5, 17]) F.shape(() => rrect(ctx, 49 + 9 * open, y - 3.6, 7.5, 7.2, 2), BONE[0]);
    for (const s of [-1, 1]) F.shape(() => { ctx.beginPath(); ctx.moveTo(50, s * 22); ctx.quadraticCurveTo(64, s * 25, 72, s * 37); ctx.quadraticCurveTo(58, s * 36, 46, s * 30); ctx.closePath(); }, () => lin(ctx, 48, 0, 72, 0, BONE[1], BONE[0]));
    F.shape(() => rrect(ctx, 2, -28, 50, 56, 14), () => lin(ctx, 2, 0, 52, 0, WOOD[1], WOOD[0], WOOD[1]));
    F.shape(() => rrect(ctx, 16, -32, 12, 64, 6), () => lin(ctx, 16, 0, 28, 0, BROW[1], BROW[0]));
    // moss over the back of it, blooms in the moss
    F.shape(() => { ctx.beginPath(); ctx.moveTo(-2, -29); ctx.quadraticCurveTo(-46, -34, -43, 0); ctx.quadraticCurveTo(-46, 34, -2, 29); ctx.quadraticCurveTo(-12, 14, -6, 0); ctx.quadraticCurveTo(-12, -14, -2, -29); ctx.closePath(); }, lit(ctx, -22, 0, 34, f, MOSS));
    for (const [qx, qy, r] of [[-26, -13, 8], [-13, 17, 7], [-33, 9, 6.5]]) {
      F.shape(() => { ctx.beginPath(); for (let j = 0; j < 10; j++) { const a = j / 10 * TAU + qx, rr = j % 2 ? r * 0.5 : r; ctx.lineTo(qx + Math.cos(a) * rr, qy + Math.sin(a) * rr); } ctx.closePath(); }, BLOOM[j0(qx)]);
      F.detail(() => { ctx.fillStyle = '#FFE27A'; ctx.beginPath(); ctx.arc(qx, qy, r * 0.3, 0, TAU); ctx.fill(); });
    }
    F.detail(() => {
      // lighter tufts in the moss
      ctx.fillStyle = 'rgba(190,232,130,0.55)'; for (const [mx, my, mr] of [[-30, -22, 4], [-18, 3, 5], [-34, -4, 3.5], [-22, 24, 4], [-10, -18, 3.5]]) { ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill(); }
      const [gx, gy] = litAt(26, 0, 30, f); gloss(ctx, gx + 6, gy, 11, 5, -0.5 - f, 0.2);
      // the carving: a nose ridge down the jaw block, a curl on each cheek
      ctx.fillStyle = WOOD[0]; rrect(ctx, 28, -5, 22, 10, 5); ctx.fill();
      ctx.fillStyle = 'rgba(60,34,20,0.75)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(46.5, s * 2.6, 1.5, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(70,40,24,0.6)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(41, s * 18, 5, s > 0 ? 0.6 : -0.6 - Math.PI * 1.4, s > 0 ? 0.6 + Math.PI * 1.4 : -0.6); ctx.stroke(); }
      // two eyes under the brow: they flare before a slam and go dull while it lies stunned
      const col = P.daze ? '#7E8C6A' : gl > 0.5 ? EYE[2] : EYE[1], core = P.daze ? '#A9B596' : EYE[0], k = P.daze ? 0.72 : 1 + 0.4 * gl;
      for (const s of [-1, 1]) {
        const ex = 34, ey = s * 15;
        ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(ex, ey, 6.6 * k + 1.6, 5.4 * k + 1.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ex, ey, 6.6 * k, 5.4 * k, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = core; ctx.beginPath(); ctx.arc(ex + 0.8, ey, 2.7 * k, 0, TAU); ctx.fill();
        if (!P.daze && gl > 0.15) glow(ctx, ex, ey, 9 * gl + 7, gl > 0.5 ? '#FFB347' : '#D8FF7A', 0.3 * gl);
      }
    });
  }, sc);
}
const j0 = (x) => (Math.round(Math.abs(x)) % 2 ? 0 : 1);

// ---------------------------------------------------------------- the boss
const dazedNow = (k) => !!((k.fall && k.fall.landed) || (k.slam && k.slam.st === 'down' && k.slam.missed));
export function drawIdol(ctx, u, w) {
  const k = u.si, T = w.time;
  if (!k) { const [ux, uy] = up(), o = ID.body.h * 0.9; drawPose(ctx, restPose(u.x - ux * o, u.y - uy * o, u.facing), { wash: washOf(u, w) }); return; } // (before its first tick)
  const pose = k.pose, pk = pose ? 1 - pose.t / pose.max : 0, daze = dazedNow(k);
  // heaving to get up at the end of its stun
  const left = k.slam && k.slam.st === 'down' && k.slam.missed ? k.slam.t : k.fall ? k.fall.t : 9;
  const P = { gx: k.gx + k.sx, gy: k.gy + k.sy, f: u.facing, h: Math.max(ID.body.low, k.h + k.bob), T, daze,
    glare: k.glare, flash: T - k.hitT < 0.03, jit: daze && left < 0.35 ? 2.6 : 0, pods: k.podsOn,
    maw: Math.max(k.glare * 0.5, pose && pose.kind === 'roar' ? Math.sin(Math.min(1, pk * 2.5) * Math.PI / 2) * (1 - sm(k01((pk - 0.75) / 0.25))) : 0),
    shake: pose && pose.kind === 'shake' ? Math.sin(Math.min(1, pk * 1.4) * Math.PI) : pose && pose.kind === 'roar' ? 0.5 * (1 - pk) : 0,
    legs: k.legs.map((L) => ({ i: L.i, hip: hipOf(u, k, L), foot: { x: L.x, y: L.y, z: L.z }, side: L.side, broken: L.broken, sw: L.sw,
      hurt: L.foot ? clamp(1 - L.foot.hp / L.foot.maxHp, 0, 1) : 1, flash: !!L.foot && flashing(L.foot) })) };
  drawPose(ctx, P, { wash: washOf(u, w), alpha: u.invulnT > 0 ? 0.85 : 1 });
}
// The hooves are drawn with the rest of it (one figure, one outline); as units they only take the blows.
export function drawIdolFoot() {}
// Its one shadow, on the floor far under the head (the shared shadow layer: render.js drawShadows, def.shadows); a
// hoof lifted to stamp throws a small one where it hangs. The higher the head, the smaller and (two discs for a long
// head) the closer together.
export function idolShadows(u) {
  const k = u.si; if (!k) { const [ux, uy] = up(), o = ID.body.h * 0.9; return [[u.x - ux * o, u.y - uy * o, 30]]; }
  const s = 1 - Math.min(0.14, k.h / 900), c = Math.cos(u.facing), sn = Math.sin(u.facing), gx = k.gx + k.sx, gy = k.gy + k.sy;
  const out = [[gx + c * 24, gy + sn * 24, 29 * s], [gx - c * 22, gy - sn * 22, 33 * s]];
  for (const L of k.legs) if (!L.broken && L.z > 10) out.push([L.x, L.y, 8 * (1 - Math.min(0.45, L.z / 200))]);
  return out;
}
// A still picture of it for the Book's tile and the battle picker (inspect.js portrait reads def.portrait).
let PORT = null;
export function idolPortrait() {
  if (PORT != null) return PORT;
  if (typeof document === 'undefined') return '';
  try {
    const c = document.createElement('canvas'); c.width = c.height = 240; const g = c.getContext('2d');
    g.translate(120, 132); g.scale(0.52, 0.52);
    drawPose(g, restPose(0, 0, Math.PI / 2), { up: [0, -1] });
    PORT = c.toDataURL();
  } catch { PORT = ''; }
  return PORT;
}

// ---------------------------------------------------------------- its glade, and what lies on the floor
// a small leaf lying or flying: at (x, y), turned by a, s long
function leafBit(ctx, x, y, a, s, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.62, s, 0); ctx.quadraticCurveTo(0, s * 0.62, -s, 0); ctx.closePath(); }, col); ctx.restore(); }
// where the liana leaves the head: its rim, on the side of whatever it reaches for
// (the head's outline is longer ahead than behind and narrower across: the liana comes out from under its edge, not out of its face)
const rimOf = (u, tx, ty) => { const k = u.si, gx = k.gx + k.sx, gy = k.gy + k.sy, z = Math.max(ID.body.low, k.h + k.bob), sc = headScale(z), a = Math.atan2(ty - gy, tx - gx), c = Math.cos(a - u.facing), sn = Math.sin(a - u.facing);
  const r = 1 / Math.hypot(c / ((c > 0 ? 66 : 52) * sc), sn / (40 * sc)); return { x: gx + Math.cos(a) * r, y: gy + Math.sin(a) * r, z: z - 4 }; };
// a liana from a to b (each { x, y, z }): hanging slack by `sag`, writhing by `wig`; leaves along it
function liana(ctx, a, b, sag, wig, T, alpha = 1) {
  const [ux, uy] = up(), n = 14, pts = [];
  for (let i = 0; i <= n; i++) { const s = i / n, z = a.z + (b.z - a.z) * s - Math.sin(Math.PI * s) * sag, wv = Math.sin(s * 9 + T * 9) * wig * Math.sin(Math.PI * s);
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    pts.push([a.x + dx * s - dy / d * wv + ux * Math.max(0, z) * 0.9, a.y + dy * s + dx / d * wv + uy * Math.max(0, z) * 0.9]); }
  ctx.save(); ctx.globalAlpha *= alpha;
  inkLine(ctx, () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); }, VINE[1], 5.4);
  ctx.strokeStyle = VINE[0]; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x - 0.8, y - 0.8) : ctx.moveTo(x - 0.8, y - 0.8))); ctx.stroke();
  for (let i = 2; i < n; i += 3) { const [x, y] = pts[i], [x2, y2] = pts[i + 1]; leafBit(ctx, x + (i % 2 ? 5 : -5), y + 4, Math.atan2(y2 - y, x2 - x) + (i % 2 ? 1 : -1), 5.5, LEAF[1]); }
  ctx.restore();
  return pts[n];
}
export function drawGladeFloor(ctx, w) {
  if (!w.idolGlade) return;
  // ferns out of the corners, fallen leaves about the floor
  ctx.save();
  for (const [cx, cy, a0] of [[0, 0, 0], [w.W, 0, Math.PI / 2], [w.W, w.H, Math.PI], [0, w.H, -Math.PI / 2]]) {
    for (let i = 0; i < 5; i++) {
      const a = a0 + (i + 0.5) / 5 * Math.PI / 2, len = 150 + 70 * hash(i, cx + cy), c = Math.cos(a), s = Math.sin(a);
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#3F7A38'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + c * len, cy + s * len); ctx.stroke();
      ctx.fillStyle = i % 2 ? '#4E8F3E' : '#5FA548';
      for (let j = 2; j < 11; j++) { const d = len * j / 11, wd = 26 * Math.sin(Math.PI * j / 11.5) + 5; for (const sd of [-1, 1]) { const bx = cx + c * d, by = cy + s * d, aa = a + sd * 1.05;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + Math.cos(aa - 0.3) * wd * 0.6, by + Math.sin(aa - 0.3) * wd * 0.6, bx + Math.cos(aa) * wd, by + Math.sin(aa) * wd); ctx.quadraticCurveTo(bx + Math.cos(aa + 0.4) * wd * 0.5, by + Math.sin(aa + 0.4) * wd * 0.5, bx, by); ctx.fill(); } }
    }
  }
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 46; i++) { const x = 60 + hash(i, 3) * (w.W - 120), y = 60 + hash(i, 5) * (w.H - 120), a = hash(i, 7) * TAU, s = 6 + 5 * hash(i, 9);
    ctx.fillStyle = ['#5FA548', '#7BB04A', '#A9A44A', '#4E8F3E'][i % 4]; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.45, a, 0, TAU); ctx.fill(); }
  ctx.restore();
}
export function drawGladeAir(ctx, w) {
  // whoever stands on the floor behind the head's picture (it is drawn over the floor, a long way up the screen from
  // where it stands): a pale ring over the head where they are, so nobody is lost under it
  for (const u of w.units) {
    const k = u.si; if (!k || u.dead || k.h < 46) continue;
    const sc = headScale(k.h), c = Math.cos(u.facing), sn = Math.sin(u.facing);
    for (const h of w.units) {
      if (h === u || h.dead || h.def.part || h.flyT > 0 || h.team === u.team) continue;
      const dx = h.x - u.x, dy = h.y - u.y, lx = dx * c + dy * sn, ly = -dx * sn + dy * c;
      if ((lx / ((lx > 0 ? 60 : 62) * sc)) ** 2 + (ly / (40 * sc)) ** 2 > 1) continue;
      ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.arc(h.x, h.y, h.vr * 1.05, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
  // whoever is tangled in its liana: coils round them
  for (const h of w.units) {
    if (h.dead || h.downed) continue;
    const b = (h.buffs || []).find((x) => x.id === 'vined'); if (!b || !(b.t > 0)) continue;
    const a = Math.min(1, b.t / 0.25), r = h.vr * 1.05, s = h.id * 1.7;
    ctx.save(); ctx.globalAlpha *= a;
    for (const [dy, rr, ph] of [[-0.35, 1.0, 0], [0.25, 1.12, 1.4]]) inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(h.x, h.y + dy * r, r * rr, r * 0.42, s + ph, 0.3, TAU - 0.5); }, VINE[1], 3.6);
    for (let i = 0; i < 4; i++) { const an = s + i / 4 * TAU; leafBit(ctx, h.x + Math.cos(an) * r * 1.05, h.y + Math.sin(an) * r * 0.75, an + 0.6, 5.5, LEAF[i % 2]); }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- its blows
// dust thrown out in a ring from r0 to r1: small inked puffs, fading
function dustRing(ctx, x, y, r0, r1, k, seed, n, size) {
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < n; i++) { const a = (i + hash(seed, i)) / n * TAU, d = r0 + (r1 - r0) * easeOut(k) * (0.75 + 0.5 * hash(i, seed));
    inkDisc(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, size * (1 - 0.5 * k) * (0.7 + 0.6 * hash(i, seed + 1)), i % 3 ? '#E9DDC2' : '#FFF8E6'); }
  ctx.restore();
}
// leaves thrown out along the floor from (x, y), each with a little hop
function leafBurst(ctx, x, y, r0, r1, k, seed, n) {
  const [ux, uy] = up(), e = easeOut(k);
  ctx.save(); ctx.globalAlpha *= k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  for (let i = 0; i < n; i++) { const a = (i + hash(seed, i, 3)) / n * TAU, d = r0 + (r1 - r0) * e * (0.6 + 0.6 * hash(i, seed, 4)), hop = Math.sin(k01(k * 1.25) * Math.PI) * (16 + 26 * hash(i, seed, 5));
    leafBit(ctx, x + Math.cos(a) * d + ux * hop, y + Math.sin(a) * d + uy * hop, a + k * 7 * (i % 2 ? 1 : -1), 6 + 3 * hash(i, 8), LEAF[i % 3]); }
  ctx.restore();
}
BFX.idStomp = { // a hoof comes down: a dent, a ring of dust
  ground(ctx, f, k) { quake(ctx, f.x, f.y, f.r, k, f.seed); },
  air(ctx, f, k) { if (k < 0.14) glow(ctx, f.x, f.y, f.r * 0.9, '#FFF8E6', 0.6 * (1 - k / 0.14)); dustPuffs(ctx, f.x, f.y, f.r * 0.5, k, f.seed, 6); },
};
BFX.idSlam = { // the head hits the floor: a wide dent, a wave of dust rolling out, leaves knocked out of its crown
  // (the flash is on the floor, under it, and the dust is thrown out from its edge: the head itself stays in plain sight)
  ground(ctx, f, k) { quake(ctx, f.x, f.y, f.r * 1.2, k, f.seed); if (k < 0.16) glow(ctx, f.x, f.y, f.r * 1.6, '#FFF8E6', 0.85 * (1 - k / 0.16)); },
  air(ctx, f, k) { dustRing(ctx, f.x, f.y, f.r * 0.7, f.r * 1.8, k, f.seed, 18, 12); leafBurst(ctx, f.x, f.y, f.r * 0.5, f.r * 1.6, k, f.seed, 11); },
};
BFX.idFall = { air(ctx, f, k) { // where it fell from: streaks down the screen for a moment, and leaves left hanging in the air that flutter down after it
  const [ux, uy] = up(), tx = -uy, ty = ux;
  if (k < 0.22) { const q = k / 0.22, top = f.h * 0.9, bot = f.h * 0.9 * (1 - Math.min(1, q * 2.1));
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,240,' + (0.7 * (1 - q)).toFixed(3) + ')';
    for (let i = 0; i < 8; i++) { const o = (i - 3.5) * 17 + (hash(f.seed, i) - 0.5) * 8, t0 = top + 50 * hash(i, f.seed) + 10;
      ctx.lineWidth = 4.6 - 3 * q; ctx.beginPath(); ctx.moveTo(f.x + tx * o + ux * t0, f.y + ty * o + uy * t0); ctx.lineTo(f.x + tx * o + ux * (bot + 46), f.y + ty * o + uy * (bot + 46)); ctx.stroke(); }
    ctx.restore(); }
  ctx.globalAlpha = k < 0.04 ? k / 0.04 : k > 0.72 ? 1 - (k - 0.72) / 0.28 : 1;
  for (let i = 0; i < 18; i++) {
    const a = hash(f.seed, i, 1) * TAU, d = 12 + 62 * hash(f.seed, i, 2), z0 = f.h + 34 * hash(f.seed, i, 3) - 4, z = z0 * (1 - 0.94 * Math.pow(k, 1.25)), fl = Math.sin(k * 11 + i * 2.2) * (10 + 8 * hash(i, 4));
    const x = f.x + Math.cos(a) * d * (1 + 0.5 * k) + tx * fl + ux * z * 0.9, y = f.y + Math.sin(a) * d * (1 + 0.5 * k) + ty * fl + uy * z * 0.9;
    leafBit(ctx, x, y, a + Math.sin(k * 9 + i) * 1.2, (8 + 5 * hash(i, 6)) * (1 + z / 400), LEAF[i % 3]);
  }
} };
BFX.idDazed = { air(ctx, f, k, w) { // stunned on the floor: stars going round its head until it gets up
  const u = f.u; if (!u || u.dead || !u.si || !dazedNow(u.si)) return;
  const [ux, uy] = up(), c = Math.cos(u.facing), s = Math.sin(u.facing), hx = u.x + c * 20, hy = u.y + s * 20;
  ctx.globalAlpha = Math.min(1, (1 - k) * 5, k * 12);
  for (let i = 0; i < 4; i++) { const a = w.time * 4.2 + i * TAU / 4, x = hx + Math.cos(a) * 46 + ux * 34, y = hy + Math.sin(a) * 17 + uy * 34;
    inked(ctx, () => { ctx.beginPath(); for (let j = 0; j < 8; j++) { const b = a + j / 8 * TAU, rr = j % 2 ? 3.6 : 9.5; ctx.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); } ctx.closePath(); }, '#FFF7C2'); }
} };
BFX.idLegBreak = { air(ctx, f, k) { // the hoof shatters and the cane splits: stone chips and splinters fly and are gone
  const e = easeOut(k), [ux, uy] = up();
  if (k < 0.18) glow(ctx, f.x, f.y, 54, '#FFF8E6', 0.8 * (1 - k / 0.18));
  ctx.globalAlpha = k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
  for (let i = 0; i < 10; i++) { const b = f.a + (i - 4.5) * 0.5 + (hash(f.seed, i) - 0.5), d = (26 + 70 * hash(i, f.seed)) * e, hop = Math.sin(k01(k * 1.3) * Math.PI) * (20 + 30 * hash(i, 7)), x = f.x + Math.cos(b) * d + ux * hop, y = f.y + Math.sin(b) * d + uy * hop;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b + k * 9 * (i % 2 ? 1 : -1));
    if (i % 2) inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-11, -1.6); ctx.lineTo(10, -2.4); ctx.lineTo(12, 1); ctx.lineTo(-9, 2.2); ctx.closePath(); }, i % 4 === 1 ? BAM[0] : BAM[1]); // a splinter of cane
    else inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, -3.5); ctx.lineTo(5, -5); ctx.lineTo(7, 2); ctx.lineTo(-3, 5); ctx.closePath(); }, i % 4 ? STONE[1] : STONE[2]);       // a chip of stone
    ctx.restore(); }
} };
BFX.idRoar = { air(ctx, f, k) { // a roar: short lines flung out from its jaw, leaves shaken loose
  const u = f.u; if (!u || u.dead) return;
  const e = easeOut(k); ctx.globalAlpha = 1 - k;
  const sc = headScale(u.si ? u.si.h : ID.body.h);
  for (let i = 0; i < 5; i++) { const a = u.facing + (i - 2) * 0.32, r0 = 74 * sc + 50 * e, r1 = r0 + 24 * (1 - 0.5 * k);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.x + Math.cos(a) * r0, u.y + Math.sin(a) * r0); ctx.lineTo(u.x + Math.cos(a) * r1, u.y + Math.sin(a) * r1); }, '#FFFFFF', 3.6); }
} };
BFX.idShake = { air(ctx, f, k) { // it shakes its crown: leaves flung out of it
  const u = f.u; if (!u || !u.si) return;
  if (f.x == null) { f.x = u.x; f.y = u.y; f.fc = u.facing; }
  const e = easeOut(k), [ux, uy] = up(); ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
  for (let i = 0; i < 9; i++) { const a = f.fc + Math.PI + (i - 4) * 0.42, d = 30 + (50 + 50 * hash(i, 3)) * e, drop = 40 * k * k;
    leafBit(ctx, f.x + Math.cos(a) * d - ux * drop, f.y + Math.sin(a) * d - uy * drop, a + k * 8 * (i % 2 ? 1 : -1), 6.5 + 3 * hash(i, 5), LEAF[i % 3]); }
} };
// The liana: it uncoils from the head's rim and comes down on its mark through the tell; its tip is on the floor as
// the circle goes off.
BFX.idVine = { air(ctx, f, k, w) {
  const u = f.u; if (!u || u.dead || !u.si) return;
  const kt = Math.min(1, k * f.max / f.tell), e = sm(kt), a = rimOf(u, f.x1, f.y1);
  const tip = { x: a.x + (f.x1 - a.x) * e, y: a.y + (f.y1 - a.y) * e, z: a.z * (1 - e * e) };
  const fade = k * f.max > f.tell ? 1 - (k * f.max - f.tell) / (f.max - f.tell) : 1;
  const [tx, ty] = liana(ctx, a, tip, 26 * (1 - e) * e * 4 * 0.5, 7 * (1 - e), w.time, fade);
  ctx.save(); ctx.globalAlpha *= fade; inkDisc(ctx, tx, ty, 6.5, VINE[0]); leafBit(ctx, tx - 6, ty + 5, 2.4, 7, LEAF[0]); leafBit(ctx, tx + 6, ty + 5, 0.7, 7, LEAF[1]); ctx.restore();
} };
BFX.idHaul = { air(ctx, f, k, w) { // caught: the liana taut from the head to whoever it has, hauling them in
  const u = f.u, h = f.h; if (!u || u.dead || !u.si || !h || h.dead) return;
  const a = rimOf(u, h.x, h.y), fade = k > 0.72 ? 1 - (k - 0.72) / 0.28 : 1;
  liana(ctx, a, { x: h.x, y: h.y, z: 10 }, 8 + 30 * k, 1.5, w.time, fade);
} };
BFX.idVineLand = { air(ctx, f, k) { // where it comes down: leaves thrown up; nobody there, a puff of dust too
  leafBurst(ctx, f.x, f.y, 6, f.r * 0.95, k, f.seed, f.hit ? 8 : 6);
  if (k < 0.2) glow(ctx, f.x, f.y, f.r, '#E8FFD0', 0.45 * (1 - k / 0.2));
  if (!f.hit) dustPuffs(ctx, f.x, f.y, f.r * 0.4, k, f.seed, 5);
} };
// A seed pod: it hangs on in the crown for the first of the tell, then falls the whole height to its circle.
function podAt(f, k) {
  if (k < f.rel) return null;
  const q = (k - f.rel) / (1 - f.rel);
  return { x: f.x0 + (f.x1 - f.x0) * (1 - (1 - q) * (1 - q)), y: f.y0 + (f.y1 - f.y0) * (1 - (1 - q) * (1 - q)), z: f.z0 * (1 - q * q), q };
}
BFX.idPod = {
  ground(ctx, f, k) { const s = podAt(f, k); if (s) castShadow(s.x, s.y, 16, 1, s.z); },
  air(ctx, f, k) {
    const s = podAt(f, k); if (!s) return;
    const [ux, uy] = up(), x = s.x + ux * s.z * 0.9, y = s.y + uy * s.z * 0.9, sc = 1 + s.z / 330, rot = f.seed + s.q * 5;
    if (s.q > 0.35) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,240,0.4)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + ux * 12, y + uy * 12); ctx.lineTo(x + ux * (12 + 34 * s.q), y + uy * (12 + 34 * s.q)); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * 1.3, sc * 1.3);
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 11, 8.5, 0, 0, TAU); }, POD[1]);
    ctx.fillStyle = POD[0]; ctx.beginPath(); ctx.ellipse(-2.5, -2.5, 6, 3.6, -0.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(70,30,40,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-10, 0.5); ctx.lineTo(10, 0.5); ctx.stroke();
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(9, -2); ctx.lineTo(15, -4); ctx.lineTo(14, 1.5); ctx.closePath(); }, LEAF[1]);
    ctx.restore();
  },
};
BFX.idPodBurst = { // it splits where it lands: husk thrown out, a puff of yellow dust
  ground(ctx, f, k) { quake(ctx, f.x, f.y, f.r * 0.9, k, f.seed); },
  air(ctx, f, k) {
    const e = easeOut(k), [ux, uy] = up();
    if (k < 0.16) glow(ctx, f.x, f.y, f.r, '#FFF3B0', 0.6 * (1 - k / 0.16));
    dustPuffs(ctx, f.x, f.y, f.r * 0.55, k, f.seed, 7, '#DCE08A');
    ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    for (let i = 0; i < 6; i++) { const a = (i + hash(f.seed, i)) / 6 * TAU, d = (14 + 40 * hash(i, f.seed)) * e, hop = Math.sin(k01(k * 1.3) * Math.PI) * (12 + 16 * hash(i, 7));
      ctx.save(); ctx.translate(f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop); ctx.rotate(a + k * 8);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-7, 0); ctx.quadraticCurveTo(0, -7, 7, 0); ctx.quadraticCurveTo(0, -2, -7, 0); ctx.closePath(); }, i % 2 ? POD[1] : POD[0]); ctx.restore(); }
  },
};
// Its death: the head comes down where it stood, its stilts fall outward and lie flat round it, and it fades. While
// it is still falling it is drawn over the room; once down, on the floor under everyone.
function deathPose(f, k) {
  const drop = sm(k01(k / 0.2)), splay = sm(k01((k - 0.1) / 0.5)), h = f.h + (ID.body.low - f.h) * drop, G = ID.leg;
  const P = restPose(f.x, f.y, f.f, h); P.daze = true; P.T = 0; P.pods = 0;
  P.legs = f.legs.map((L) => { const d = LEGS[L.i], hip = hipAt(f.x, f.y, f.f, h, d), a = Math.atan2(L.y - hip.y, L.x - hip.x), R = (G.l1 + G.l2) * 0.97, cx = hip.x + Math.cos(a) * R, cy = hip.y + Math.sin(a) * R;
    return { i: L.i, hip, foot: { x: L.x + (cx - L.x) * splay, y: L.y + (cy - L.y) * splay, z: 0 }, side: d.side, broken: L.broken, hurt: 1, flash: false, sw: 0 }; });
  return P;
}
BFX.idDeath = {
  air(ctx, f, k) { if (k < 0.2) drawPose(ctx, deathPose(f, k), {}); },
  ground(ctx, f, k) { if (k >= 0.2) drawPose(ctx, deathPose(f, k), { alpha: 1 - sm(k01((k - 0.7) / 0.3)), wash: [['#3A3441', 0.35 * sm(k01((k - 0.3) / 0.4))]] }); },
};
