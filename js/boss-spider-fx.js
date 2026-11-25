// Old Longlegs, drawn (round 19, lane spider19). One figure (boss-draw.js: every shape in ink, then in paint, so the
// whole jointed animal has one outline). Seen from above like everything else, and like everything else that stands up
// off the floor, height shows as a shift up the screen: the body rides k.h over its floor point (its shadow stays
// there, in the shared shadow layer), each foot is on the floor, and each knee is solved between hip and foot in three
// dimensions (knee3: two bones, bent up and a little fore or aft) and then put on the screen the same way. So a leg
// that reaches further bends less, a body that drops makes every knee jut, and nothing has to be posed by hand.
// What it looks like: a plum-coloured spider, a round thorax with a bone face plate, two bone fangs and four ember
// eyes, a bigger abdomen behind with a pale hourglass; six legs, each a dark thigh, a round knee, and a shin that ends
// in a bone greave tapering to a point (the greave is the foot: the part to hit). A broken leg is grey, its greave
// snapped out of line and dragging.
import { TAU, clamp, INK } from './util.js';
import { inked, inkLine } from './fx.js';
import { quake, dustPuffs } from './fxkit.js';
import { figure, washOf, flashing, lin, gloss, glow, ell, circ, capsule, poly, up, BFX, easeOut, sm, k01, hash, inkDisc } from './boss-draw.js';
import { castShadow } from './height.js';
import { SP, LEGS, hipOf } from './boss-spider.js';

const ABD = ['#9C7FB8', '#6B5088', '#40305A'], THX = ['#A78CC2', '#77598F', '#4A3765'];      // abdomen, thorax: light, main, dark
const LEG = ['#7C6297', '#5B4576', '#3D2E54'], KNEE = ['#B39ACB', '#8A6FA8', '#5B4576'];
const BONE = ['#FFF6E2', '#E6D8B8', '#B5A586'], MARK = '#EADFF2', EYE = ['#FFF0B0', '#FFB347', '#FF6A2E'];
const DEAD = ['#6A6170', '#514959', '#3A3441'], DEAD_BONE = ['#C4B9A8', '#978C7D'];
const SILK = '#F3EEF9';
const KNEE_OUT = 0.3, KNEE_UP = 0.35;

// ---------------------------------------------------------------- the knee
// A two-bone leg from the hip H to the foot F (each { x, y on the floor, z up }), bones l1 and l2, bent towards `pole`.
// Further than the bones reach, both stretch a little rather than leave the foot (the gait steps long before that).
export function knee3(H, F, l1, l2, pole) {
  const dx = F.x - H.x, dy = F.y - H.y, dz = F.z - H.z, d = Math.hypot(dx, dy, dz) || 0.001;
  const reach = (l1 + l2) * 0.985, s = d > reach ? d / reach : 1, L1 = l1 * s, L2 = l2 * s;
  const dd = clamp(d, Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.01);
  const a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const ux = dx / d, uy = dy / d, uz = dz / d;
  let px = pole.x, py = pole.y, pz = pole.z; const dot = px * ux + py * uy + pz * uz; px -= dot * ux; py -= dot * uy; pz -= dot * uz;
  const pn = Math.hypot(px, py, pz) || 1;
  return { x: H.x + ux * a + px / pn * h, y: H.y + uy * a + py / pn * h, z: H.z + uz * a + pz / pn * h };
}

// ---------------------------------------------------------------- a pose, and the figure drawn from it
// P: { gx, gy (the floor point under the body), f (facing), h (its height), T, legs: [{ i, hip, foot, side, broken,
// hurt 0..1, flash, since (seconds since it broke), ref (the fight's leg, for a steady draw order) }], glare 0..1 (its
// eyes), fang 0..1 (open), daze, flash, pulse (the abdomen swelling), jit }.
const hipAt = (gx, gy, f, h, d) => ({ x: gx + Math.cos(f) * SP.body.hub + Math.cos(f + d.hip) * SP.body.hipR, y: gy + Math.sin(f) * SP.body.hub + Math.sin(f + d.hip) * SP.body.hipR, z: h });
export function restPose(gx, gy, f, h = SP.body.h) {
  return { gx, gy, f, h, T: 0, glare: 0, fang: 0, daze: false, flash: false, pulse: 0, jit: 0,
    legs: LEGS.map((d, i) => ({ i, hip: hipAt(gx, gy, f, h, d), foot: { x: gx + Math.cos(f + d.th) * SP.leg.restR, y: gy + Math.sin(f + d.th) * SP.leg.restR, z: 0 }, side: d.side, broken: false, hurt: 0, flash: false, since: 9 })) };
}
export function drawPose(ctx, P, o = {}) {
  const [ux, uy] = o.up || up(), G = SP.leg, fx = Math.cos(P.f), fy = Math.sin(P.f);
  const pr = (p) => [p.x + ux * p.z * 0.9, p.y + uy * p.z * 0.9];
  const bodyDepth = -(P.gx * ux + P.gy * uy);
  const legs = P.legs.map((L) => {
    // a leg bends upwards (its knee is its highest point) and a little out to its own side; a broken one has no lift
    // left in it: its knee sags out sideways, down to the floor
    const s = L.side;
    let kn;
    if (L.broken) { // it hangs from the hip: the knee rests on the floor a little way out, the shin lies along the floor to the foot it drags
      const dx = L.foot.x - L.hip.x, dy = L.foot.y - L.hip.y, d = Math.hypot(dx, dy) || 1, kd = clamp(d - G.l2 * 0.86, 14, 40);
      kn = { x: L.hip.x + dx / d * kd - dy / d * s * 7, y: L.hip.y + dy / d * kd + dx / d * s * 7, z: 4 };
    } else { kn = knee3(L.hip, L.foot, G.l1, G.l2, { x: -fy * s * KNEE_OUT, y: fx * s * KNEE_OUT, z: 1 }); if (kn.z < 5) kn.z = 5; }
    // (how far up the screen the knee shows: only part of its height over the hip. At its true height a knee on the near
    // side of the body would be drawn over the body and its face)
    if (kn.z > L.hip.z) kn.z = L.hip.z + (kn.z - L.hip.z) * KNEE_UP;
    // legs on the far side of the body go under it, legs on the near side over it (held a little, so it doesn't flicker)
    const depth = -(L.hip.x * ux + L.hip.y * uy), ref = L.ref, over = depth > bodyDepth + (ref && ref._over ? -5 : 5);
    if (ref) ref._over = over;
    return { L, hip: pr(L.hip), knee: pr(kn), foot: pr(L.foot), kz: kn.z, depth, over };
  }).sort((a, b) => a.depth - b.depth);
  const jx = P.jit ? (hash(Math.floor(P.T * 50), 1) - 0.5) * P.jit : 0, jy = P.jit ? (hash(Math.floor(P.T * 50), 2) - 0.5) * P.jit : 0;
  const [bx, by] = pr({ x: P.gx + jx, y: P.gy + jy, z: P.h });
  figure(ctx, { wash: o.wash, alpha: o.alpha }, (F) => {
    F.flash = false;
    for (const A of legs) if (!A.over) drawLeg(F, ctx, A);
    F.flash = !!P.flash;
    drawBody(F, ctx, bx, by, P, 1 + P.h / 320);
    F.flash = false;
    for (const A of legs) if (A.over) drawLeg(F, ctx, A);
  });
}
function drawLeg(F, ctx, A) {
  const L = A.L, so = { flash: L.flash }, [hx, hy] = A.hip, [kx, ky] = A.knee, [x, y] = A.foot;
  const ks = 1 + A.kz / 400, hs = 1 + L.hip.z / 400, fs = 1 + L.foot.z / 170; // (a foot lifted towards you is drawn bigger)
  if (L.broken) {
    // the shin snapped a third of the way down: a stub, a strand of sinew, and the greave lying out of line on the floor
    const sx = kx + (x - kx) * 0.34, sy = ky + (y - ky) * 0.34, nx = -(y - ky), ny = x - kx, nl = Math.hypot(nx, ny) || 1, side = L.i & 1 ? 1 : -1;
    const sw = L.since < 0.4 ? Math.sin(L.since * 38) * 9 * (1 - L.since / 0.4) : 0, off = (11 + sw) * side;
    const lx = sx + nx / nl * off + (x - kx) * 0.07, ly = sy + ny / nl * off + (y - ky) * 0.07;
    F.shape(() => capsule(ctx, lx, ly, 6.2, x, y, 2.6), () => lin(ctx, lx, ly, x, y, DEAD_BONE[0], DEAD_BONE[1]));
    F.line(() => { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(lx, ly); }, '#8A5A66', 2.8);
    F.shape(() => capsule(ctx, kx, ky, 6.2 * ks, sx, sy, 5.2), DEAD[1]);
    F.shape(() => poly(ctx, [[sx - 6, sy - 3], [sx + 1, sy - 8], [sx + 3, sy - 1], [sx + 8, sy + 2], [sx + 1, sy + 4], [sx - 2, sy + 9]]), DEAD_BONE[1], { seam: false }); // the splintered end
    F.shape(() => capsule(ctx, hx, hy, 9.2 * hs, kx, ky, 7.2 * ks), () => lin(ctx, hx, hy, kx, ky, DEAD[2], DEAD[0]));
    F.shape(() => circ(ctx, kx, ky, 8.4 * ks), DEAD[0]);
    F.detail(() => { // cracks on the dead greave and the knee
      ctx.strokeStyle = 'rgba(43,34,48,0.7)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const mx = lx + (x - lx) * 0.45, my = ly + (y - ly) * 0.45;
      ctx.beginPath(); ctx.moveTo(mx + nx / nl * 5, my + ny / nl * 5); ctx.lineTo(mx - nx / nl * 1, my - ny / nl * 1 + 2); ctx.lineTo(mx - nx / nl * 5, my - ny / nl * 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(kx - 5, ky - 2); ctx.lineTo(kx, ky + 1); ctx.lineTo(kx + 4, ky - 3); ctx.stroke();
    });
    return;
  }
  const mx = kx + (x - kx) * 0.4, my = ky + (y - ky) * 0.4;
  F.shape(() => capsule(ctx, kx, ky, 6.4 * ks, mx, my, 6.2), LEG[1], so);                                                   // the shin, above the greave
  F.shape(() => capsule(ctx, mx, my, 7 * fs, x, y, 2.7 * fs), () => lin(ctx, mx, my, x, y, BONE[0], BONE[1], BONE[2]), so); // the bone greave, down to its point
  if (L.hurt > 0.3) F.detail(() => { // the greave cracks as the foot is hurt
    const nx = -(y - my), ny = x - mx, nl = Math.hypot(nx, ny) || 1, wx = nx / nl, wy = ny / nl;
    ctx.strokeStyle = 'rgba(43,34,48,0.72)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [q, n] of L.hurt > 0.65 ? [[0.28, 1], [0.58, -1]] : [[0.4, 1]]) {
      const cx = mx + (x - mx) * q, cy = my + (y - my) * q, wd = 5.2 * (1 - q * 0.6);
      ctx.beginPath(); ctx.moveTo(cx + wx * wd, cy + wy * wd); ctx.lineTo(cx + (x - mx) * 0.05 * n, cy + (y - my) * 0.05 * n); ctx.lineTo(cx - wx * wd, cy - wy * wd); ctx.stroke();
    }
  });
  F.shape(() => capsule(ctx, hx, hy, 9.4 * hs, kx, ky, 7.4 * ks), () => lin(ctx, hx, hy, kx, ky, LEG[2], LEG[1], LEG[0]), so);  // the thigh, up to the knee
  F.shape(() => circ(ctx, kx, ky, 8.8 * ks), () => { const g = ctx.createRadialGradient(kx - 3, ky - 3.5, 0.5, kx, ky, 10 * ks); g.addColorStop(0, KNEE[0]); g.addColorStop(0.55, KNEE[1]); g.addColorStop(1, KNEE[2]); return g; }, so);
  F.detail(() => gloss(ctx, kx - 2.6, ky - 3.2, 3.4, 1.9, -0.5, 0.3));
}
// a round thing lit from the screen's upper left, whatever way the body is turned (the frame is turned by f)
const lit = (ctx, x, y, r, f, c) => () => { const lx = -0.36 * r, ly = -0.42 * r, c0 = Math.cos(f), s0 = Math.sin(f);
  const g = ctx.createRadialGradient(x + lx * c0 + ly * s0, y - lx * s0 + ly * c0, r * 0.05, x, y, r * 1.15); g.addColorStop(0, c[0]); g.addColorStop(0.5, c[1]); g.addColorStop(1, c[2]); return g; };
const litAt = (x, y, r, f) => { const lx = -0.36 * r, ly = -0.44 * r, c0 = Math.cos(f), s0 = Math.sin(f); return [x + lx * c0 + ly * s0, y - lx * s0 + ly * c0]; };
function drawBody(F, ctx, bx, by, P, sc) {
  const f = P.f, pulse = P.pulse || 0, open = clamp(P.fang || 0, 0, 1), gl = clamp(P.glare || 0, 0, 1);
  F.at(bx, by, f, () => {
    // (front is +x here) the spinneret, the abdomen, the thorax over its front edge
    F.shape(() => circ(ctx, -78, 0, 7), ABD[2]);
    F.shape(() => ell(ctx, -40, 0, 38 + pulse, 32 + pulse * 0.8), lit(ctx, -40, 0, 40, f, ABD));
    F.detail(() => { // a pale hourglass on its back
      ctx.fillStyle = MARK; ctx.globalAlpha *= 0.9;
      ctx.beginPath(); ctx.moveTo(-58, -13); ctx.quadraticCurveTo(-49, -4, -40, -3); ctx.quadraticCurveTo(-31, -4, -22, -13); ctx.lineTo(-22, 13); ctx.quadraticCurveTo(-31, 4, -40, 3); ctx.quadraticCurveTo(-49, 4, -58, 13); ctx.closePath(); ctx.fill();
      ctx.globalAlpha /= 0.9;
      const [gx, gy] = litAt(-40, 0, 34, f); gloss(ctx, gx, gy, 12, 6, -0.5 - f, 0.2);
    });
    F.shape(() => ell(ctx, 14, 0, 31, 29), lit(ctx, 14, 0, 32, f, THX));
    // its face: a bone plate over the front of the thorax, the fangs under its edge
    for (const s of [-1, 1]) F.at(44, s * 10, s * (-0.32 + 0.75 * open), () => F.shape(() => { ctx.beginPath(); ctx.moveTo(-4, s * 5.5); ctx.quadraticCurveTo(14, s * 7.5, 24, -s * 3); ctx.quadraticCurveTo(10, -s * 4, -4, -s * 5.5); ctx.closePath(); }, () => lin(ctx, 0, 0, 24, 0, BONE[1], BONE[0])));
    F.shape(() => { ctx.beginPath(); ctx.moveTo(21, -27); ctx.quadraticCurveTo(50, -25, 51, 0); ctx.quadraticCurveTo(50, 25, 21, 27); ctx.quadraticCurveTo(33, 0, 21, -27); ctx.closePath(); }, lit(ctx, 38, 0, 30, f, BONE));
    F.detail(() => {
      const [gx, gy] = litAt(12, 0, 26, f); gloss(ctx, gx, gy, 9, 4.5, -0.5 - f, 0.22);
      // four eyes on the plate: embers; they flare before a slam and go dull while it lies stunned
      const col = P.daze ? '#8C7E9C' : gl > 0.5 ? EYE[2] : EYE[1], core = P.daze ? '#B9AEC6' : EYE[0], k = P.daze ? 0.75 : 1 + 0.35 * gl;
      for (const [ex, ey, er] of [[41, -8.5, 4.3], [41, 8.5, 4.3], [33, -17.5, 2.9], [33, 17.5, 2.9]]) {
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex, ey, er * k + 1.5, 0, TAU); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, ey, er * k, 0, TAU); ctx.fill();
        ctx.fillStyle = core; ctx.beginPath(); ctx.arc(ex + 0.6, ey, er * k * 0.45, 0, TAU); ctx.fill();
      }
    });
  }, sc);
}

// ---------------------------------------------------------------- the boss
const dazedNow = (k) => !!((k.fall && k.fall.landed) || (k.slam && k.slam.st === 'down' && k.slam.missed));
export function drawSpider(ctx, u, w) {
  const k = u.sp, T = w.time;
  if (!k) { drawPose(ctx, restPose(u.x, u.y, u.facing), { wash: washOf(u, w) }); return; } // (before its first tick)
  const pose = k.pose, pk = pose ? 1 - pose.t / pose.max : 0, daze = dazedNow(k);
  // heaving to get up at the end of its stun
  const left = k.slam && k.slam.st === 'down' && k.slam.missed ? k.slam.t : k.fall ? k.fall.t : 9;
  const P = { gx: k.gx + k.sx, gy: k.gy + k.sy, f: u.facing, h: Math.max(SP.body.low, k.h + k.bob), T, daze,
    glare: k.glare, flash: T - k.hitT < 0.03, jit: daze && left < 0.35 ? 2.4 : 0,
    fang: Math.max(k.glare * 0.45, pose && pose.kind === 'hiss' ? Math.sin(Math.min(1, pk * 2.5) * Math.PI / 2) * (1 - sm(k01((pk - 0.75) / 0.25))) : 0, pose && pose.kind === 'spit' ? 1 - sm(k01((pk - 0.7) / 0.3)) : 0),
    pulse: pose && pose.kind === 'brood' ? Math.abs(Math.sin(pk * Math.PI * 3)) * 3 : Math.sin(T * 2.1 + u.id) * 0.7,
    legs: k.legs.map((L) => ({ i: L.i, ref: L, hip: hipOf(u, k, L), foot: { x: L.x, y: L.y, z: L.z }, side: L.side, broken: L.broken,
      hurt: L.foot ? clamp(1 - L.foot.hp / L.foot.maxHp, 0, 1) : 1, flash: !!L.foot && flashing(L.foot), since: L.broken ? T - L.bt : 9 })) };
  drawPose(ctx, P, { wash: washOf(u, w), alpha: u.invulnT > 0 ? 0.85 : 1 });
}
// The feet are drawn with the animal (one figure, one outline); as units they only take the blows.
export function drawSpiderFoot() {}
// Its one shadow, on the floor under the body (the shared shadow layer: render.js drawShadows, def.shadows); a foot
// lifted to stamp throws a small one where it hangs.
export function spiderShadows(u) {
  const k = u.sp; if (!k) return [[u.x, u.y, 30]];
  // (two discs in the one layer: its thorax and its abdomen, so the shadow is as long as it is)
  const s = 1 - Math.min(0.3, k.h / 150), c = Math.cos(u.facing), sn = Math.sin(u.facing), gx = k.gx + k.sx, gy = k.gy + k.sy;
  const out = [[gx + c * 16, gy + sn * 16, 24 * s], [gx - c * 36, gy - sn * 36, 29 * s]];
  for (const L of k.legs) if (L.job && L.z > 10) out.push([L.x, L.y, 8 * (1 - Math.min(0.45, L.z / 170))]);
  return out;
}
// A still picture of it for the Book's tile and the battle picker (inspect.js portrait reads def.portrait).
let PORT = null;
export function spiderPortrait() {
  if (PORT != null) return PORT;
  if (typeof document === 'undefined') return '';
  try {
    const c = document.createElement('canvas'); c.width = c.height = 240; const g = c.getContext('2d');
    g.translate(120, 140); g.scale(0.62, 0.62);
    drawPose(g, restPose(0, 0, Math.PI / 2), { up: [0, -1] });
    PORT = c.toDataURL();
  } catch { PORT = ''; }
  return PORT;
}

// ---------------------------------------------------------------- its den, and what lies on the floor
const mouthOf = (u) => { const k = u.sp, f = u.facing; return { x: k.gx + k.sx + Math.cos(f) * 64, y: k.gy + k.sy + Math.sin(f) * 64, z: Math.max(SP.body.low, k.h + k.bob) }; };
function spiderling(ctx, x, y, r, a) { // a small dark spider, as the ones it calls are (the Hunter Spider's brown)
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  for (let i = 0; i < 6; i++) { const s = i < 3 ? -1 : 1, b = (i % 3 - 1) * 0.75; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(Math.cos(b) * r * 0.4, s * r * 0.5); ctx.lineTo(Math.cos(b) * r * 0.9 + Math.sin(b) * r * 0.5, s * r * 1.35); }, '#6D5249', 2.2); }
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(-r * 0.25, 0, r * 0.75, r * 0.62, 0, 0, TAU); }, '#5A4343');
  inked(ctx, () => { ctx.beginPath(); ctx.arc(r * 0.55, 0, r * 0.45, 0, TAU); }, '#6D5249');
  ctx.restore();
}
export function drawDenFloor(ctx, w) {
  const [ux, uy] = up();
  if (w.spiderDen) { // old webs across the corners
    ctx.save(); ctx.strokeStyle = 'rgba(236,230,246,0.2)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (const [cx, cy, a0] of [[0, 0, 0], [w.W, 0, Math.PI / 2], [w.W, w.H, Math.PI], [0, w.H, -Math.PI / 2]]) {
      const R = 210;
      for (let i = 0; i <= 5; i++) { const a = a0 + i / 5 * Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * (0.86 + 0.14 * hash(i, cx + cy)), cy + Math.sin(a) * R * (0.86 + 0.14 * hash(i, cx + cy))); ctx.stroke(); }
      for (let j = 1; j <= 4; j++) { ctx.beginPath(); for (let i = 0; i <= 5; i++) { const a = a0 + i / 5 * Math.PI / 2, rr = R * j / 4.6 * (i % 5 ? 0.93 : 1); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; if (i) { const am = a0 + (i - 0.5) / 5 * Math.PI / 2; ctx.quadraticCurveTo(cx + Math.cos(am) * rr * 0.86, cy + Math.sin(am) * rr * 0.86, px, py); } else ctx.moveTo(px, py); } ctx.stroke(); }
    }
    ctx.restore();
  }
  // its brood coming down on their threads, from under it (so: under the body, and in its shadow)
  for (const u of w.units) {
    const k = u.sp; if (!k || u.dead || !k.drops.length) continue;
    const top = { x: k.gx + k.sx - Math.cos(u.facing) * 34, y: k.gy + k.sy - Math.sin(u.facing) * 34, z: Math.max(SP.body.low, k.h + k.bob) };
    for (const d of k.drops) {
      const q = clamp(1 - d.t / d.max, 0, 1), e = sm(q), x = top.x + (d.x - top.x) * e, y = top.y + (d.y - top.y) * e, z = top.z * (1 - e);
      const tx = top.x + ux * top.z * 0.9, ty = top.y + uy * top.z * 0.9, px = x + ux * z * 0.9, py = y + uy * z * 0.9;
      castShadow(d.x, d.y, 9 * (0.5 + 0.5 * e), 0.4 + 0.6 * e, z);
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); }, SILK, 1.8);
      spiderling(ctx, px, py, 9, hash(d.seed, 1) * TAU + q * 3);
    }
  }
}
export function drawDenAir(ctx, w) {
  // whoever is stuck in its web: strands over them, pegged to the floor round them
  for (const h of w.units) {
    if (h.dead || h.downed) continue;
    const b = (h.buffs || []).find((x) => x.id === 'webbed'); if (!b || !(b.t > 0)) continue;
    const a = Math.min(1, b.t / 0.25), r = h.vr * 1.15, s = h.id * 1.7;
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 6; i++) { const an = s + i / 6 * TAU; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(h.x + Math.cos(an) * r * 0.5, h.y + Math.sin(an) * r * 0.5); ctx.lineTo(h.x + Math.cos(an) * r * 1.75, h.y + Math.sin(an) * r * 1.75); }, SILK, 2.2); }
    for (const [rr, off] of [[r * 0.55, 0.2], [r * 1.02, 0.5]]) inkLine(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 6; i++) { const an = s + i / 6 * TAU, am = s + (i - 0.5) / 6 * TAU, px = h.x + Math.cos(an) * rr, py = h.y + Math.sin(an) * rr; if (i) ctx.quadraticCurveTo(h.x + Math.cos(am) * rr * (1 - off * 0.3), h.y + Math.sin(am) * rr * (1 - off * 0.3), px, py); else ctx.moveTo(px, py); } }, SILK, 2);
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
BFX.spStomp = { // a foot comes down: a small dent, a ring of dust
  ground(ctx, f, k) { quake(ctx, f.x, f.y, f.r, k, f.seed); },
  air(ctx, f, k) { if (k < 0.14) glow(ctx, f.x, f.y, f.r * 0.9, '#FFF8E6', 0.6 * (1 - k / 0.14)); dustPuffs(ctx, f.x, f.y, f.r * 0.5, k, f.seed, 5); },
};
BFX.spSlam = { // the body hits the floor: a wide dent, a wave of dust rolling out, stones
  // (the flash is on the floor, under it, and the dust is thrown out from its edge: the body itself stays in plain sight)
  ground(ctx, f, k) { quake(ctx, f.x, f.y, f.r * 1.15, k, f.seed); if (k < 0.16) glow(ctx, f.x, f.y, f.r * 1.5, '#FFF8E6', 0.8 * (1 - k / 0.16)); },
  air(ctx, f, k) { dustRing(ctx, f.x, f.y, f.r * 0.72, f.r * 1.75, k, f.seed, 15, 11); },
};
BFX.spDazed = { air(ctx, f, k, w) { // stunned on the floor: stars going round its head until it gets up
  const u = f.u; if (!u || u.dead || !u.sp || !dazedNow(u.sp)) return;
  const [ux, uy] = up(), c = Math.cos(u.facing), s = Math.sin(u.facing), hx = u.x + c * 26, hy = u.y + s * 26;
  ctx.globalAlpha = Math.min(1, (1 - k) * 5, k * 12);
  for (let i = 0; i < 3; i++) { const a = w.time * 4.2 + i * TAU / 3, x = hx + Math.cos(a) * 34 + ux * 30, y = hy + Math.sin(a) * 13 + uy * 30;
    inked(ctx, () => { ctx.beginPath(); for (let j = 0; j < 8; j++) { const b = a + j / 8 * TAU, rr = j % 2 ? 3.4 : 9; ctx.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); } ctx.closePath(); }, '#FFF7C2'); }
} };
BFX.spLegBreak = { air(ctx, f, k) { // the greave shatters: bone chips fly and are gone
  const e = easeOut(k), [ux, uy] = up();
  if (k < 0.18) glow(ctx, f.x, f.y, 50, '#FFF8E6', 0.8 * (1 - k / 0.18));
  ctx.globalAlpha = k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
  for (let i = 0; i < 7; i++) { const b = f.a + (i - 3) * 0.55 + (hash(f.seed, i) - 0.5), d = (26 + 60 * hash(i, f.seed)) * e, hop = Math.sin(k01(k * 1.3) * Math.PI) * (18 + 20 * hash(i, 7)), x = f.x + Math.cos(b) * d + ux * hop, y = f.y + Math.sin(b) * d + uy * hop;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b + k * 9 * (i % 2 ? 1 : -1));
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(5, -4.5); ctx.lineTo(7, 2); ctx.lineTo(-3, 4.5); ctx.closePath(); }, i % 3 ? BONE[1] : BONE[2]);
    ctx.restore(); }
} };
BFX.spHiss = { air(ctx, f, k) { // a hiss: short lines flung out from its fangs
  const u = f.u; if (!u || u.dead) return;
  const e = easeOut(k); ctx.globalAlpha = 1 - k;
  for (let i = 0; i < 5; i++) { const a = u.facing + (i - 2) * 0.34, r0 = 74 + 46 * e, r1 = r0 + 20 * (1 - 0.5 * k);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(u.x + Math.cos(a) * r0, u.y + Math.sin(a) * r0); ctx.lineTo(u.x + Math.cos(a) * r1, u.y + Math.sin(a) * r1); }, '#FFFFFF', 3.4); }
} };
// The web ball: it swells between the fangs, then flies a high arc from there to its mark, a strand trailing.
const LAUNCH = 0.34;
function webAt(f, k) {
  const u = f.u;
  if (k < LAUNCH) { if (!u || u.dead || !u.sp) return null; const m = mouthOf(u); return { ...m, gather: k / LAUNCH }; }
  if (f.x0 == null) { if (!u || !u.sp) return null; const m = mouthOf(u); f.x0 = m.x; f.y0 = m.y; f.z0 = m.z; }
  const q = (k - LAUNCH) / (1 - LAUNCH);
  return { x: f.x0 + (f.x1 - f.x0) * q, y: f.y0 + (f.y1 - f.y0) * q, z: f.z0 * (1 - q) + Math.sin(Math.PI * q) * 74, q };
}
BFX.spWebShot = {
  ground(ctx, f, k) { const s = webAt(f, k); if (s && s.q != null) castShadow(s.x, s.y, 10, 1, s.z); },
  air(ctx, f, k) {
    const s = webAt(f, k); if (!s) return;
    const [ux, uy] = up(), x = s.x + ux * s.z * 0.9, y = s.y + uy * s.z * 0.9;
    if (s.q == null) { inkDisc(ctx, x, y, 3 + 8 * sm(s.gather), SILK); return; }
    const q0 = Math.max(0, s.q - 0.16), bx = f.x0 + (f.x1 - f.x0) * q0, by = f.y0 + (f.y1 - f.y0) * q0, bz = f.z0 * (1 - q0) + Math.sin(Math.PI * q0) * 74;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(bx + ux * bz * 0.9, by + uy * bz * 0.9); ctx.lineTo(x, y); }, SILK, 3.4);
    inkDisc(ctx, x, y, 11 * (1 + s.z / 300), SILK);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x - 3, y - 3.5, 3.6, 0, TAU); ctx.fill();
  },
};
BFX.spWebLand = { air(ctx, f, k) { // it bursts into a web where it lands: strands thrown out, then gone (what stays is the web on the floor, or on whoever it caught)
  const e = easeOut(k01(k / 0.5)); ctx.globalAlpha = 1 - sm(k01((k - 0.4) / 0.6));
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + hash(f.seed, i) * 0.5, r = f.r * (0.55 + 0.5 * hash(i, f.seed)) * e;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * r * 0.2, f.y + Math.sin(a) * r * 0.2); ctx.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); }, SILK, 2.6); }
  if (k < 0.2) glow(ctx, f.x, f.y, f.r, '#FFFFFF', 0.5 * (1 - k / 0.2));
} };
// Its death: it comes down where it stood, its legs curl in under it, and it fades. While it is still falling it is
// drawn over the room; once down, on the floor under everyone.
function deathPose(f, k) {
  const drop = sm(k01(k / 0.22)), curl = sm(k01((k - 0.12) / 0.5)), h = f.h + (SP.body.low - f.h) * drop;
  const P = restPose(f.x, f.y, f.f, h); P.daze = true; P.T = 0;
  P.legs = f.legs.map((L) => { const d = LEGS[L.i], hip = hipAt(f.x, f.y, f.f, h, d), a = f.f + d.th, cx = hip.x + Math.cos(a) * 34, cy = hip.y + Math.sin(a) * 34;
    return { i: L.i, hip, foot: { x: L.x + (cx - L.x) * curl, y: L.y + (cy - L.y) * curl, z: 0 }, side: d.side, broken: L.broken, hurt: 1, flash: false, since: 9 }; });
  return P;
}
BFX.spDeath = {
  air(ctx, f, k) { if (k < 0.25) drawPose(ctx, deathPose(f, k), {}); },
  ground(ctx, f, k) { if (k >= 0.25) drawPose(ctx, deathPose(f, k), { alpha: 1 - sm(k01((k - 0.7) / 0.3)), wash: [['#3A3441', 0.35 * sm(k01((k - 0.3) / 0.4))]] }); },
};
