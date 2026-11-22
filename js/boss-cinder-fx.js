// Cinder, the Old Drake, drawn (lane B, bosses3). One animal, one outline (boss-draw.js): a long wingless drake seen
// from above: a horned head on a neck, a deep-chested body that bends along the path it walks, four legs that step
// (feet planted, knees bending), a tail tapering to a bone blade, dark scutes down its back. Its fire is the game's
// fire: the same inked flames (fx.js flame), the same fire puddles on the floor (puddles.js), the Pyromancer's
// fireball for what falls from the roof. The fight's state is u.cd (boss-cinder.js).
import { TAU, clamp } from './util.js';
import { flame, upright, inked, star, drawProjectile } from './fx.js';
import { dustPuffs } from './fxkit.js';
import { drawPuddle } from './puddles.js';
import { figure, washOf, flashing, lin, rad, ballFill, gloss, glow, shade, ell, circ, poly, soft, capsule, ribbon, ik2, up, BFX, easeOut, sm, k01, hash, slashBand, inkDisc, streak, rgbaOf } from './boss-draw.js';
import { SPINE, LEN, SHOULDER, HIP, at_ } from './boss-cinder.js';

const SCALE = ['#D2714A', '#9C432E', '#632318'], BELLY = ['#B55A3C', '#7E3323'], PLATE = ['#4E3038', '#301C24'], RIM = '#E9B48E', EMBER = '#FF9A4D';
const HORN = ['#F4E6CC', '#BFA98C', '#5E4A44'], MOUTH = ['#3A1418', '#7A2A22'];
const rOf = (off) => { for (let i = 1; i < SPINE.length; i++) if (off <= SPINE[i][0]) { const [o0, r0] = SPINE[i - 1], [o1, r1] = SPINE[i], q = (off - o0) / (o1 - o0); return r0 + (r1 - r0) * q * q * (3 - 2 * q); } return SPINE[SPINE.length - 1][1]; };

function leg(F, ctx, hx, hy, fx, fy, bend, a, front) {
  const j = ik2(hx, hy, fx, fy, front ? 40 : 44, front ? 42 : 44, bend);
  F.shape(() => capsule(ctx, j.ex, j.ey, 12.5, fx, fy, 10), () => lin(ctx, j.ex, j.ey, fx, fy, BELLY[0], BELLY[1]));
  F.shape(() => capsule(ctx, hx, hy, 18, j.ex, j.ey, 13.5), () => lin(ctx, hx, hy, j.ex, j.ey, SCALE[1], SCALE[0]));
  F.at(fx, fy, a, () => { // the foot: a broad paw, three claws forward
    for (const s of [-1, 0, 1]) F.shape(() => poly(ctx, [[8, s * 9 - 4.5], [27 - Math.abs(s) * 3, s * 12], [8, s * 9 + 4.5]]), HORN[0]);
    F.shape(() => ell(ctx, 0, 0, 15.5, 14), ballFill(ctx, 0, 0, 15, SCALE[0], SCALE[1], SCALE[2]));
  });
}
function scute(ctx, s, molten, T, i) { // a back plate: a dark arrowhead pointing down the body, a pale (or ember) rim
  soft(ctx, [[s, 0], [s * 0.1, s * 0.78], [-s * 0.95, s * 0.5], [-s * 0.6, 0], [-s * 0.95, -s * 0.5], [s * 0.1, -s * 0.78]]);
  ctx.fillStyle = lin(ctx, 0, -s, 0, s, PLATE[0], PLATE[1]); ctx.fill();
  ctx.strokeStyle = molten ? rgbaOf(EMBER, 0.75 + 0.25 * Math.sin(T * 5 + i)) : RIM; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
}
function head(F, ctx, R, jaw, T, hot, molten) {
  // the lower jaw: it drops forward and wide as the mouth opens, teeth along its edge, the fire in its throat
  const jx = jaw * R * 0.34, jw = 1 + jaw * 0.2;
  F.shape(() => soft(ctx, [[R * 1.42 + jx, 0], [R * 1.2 + jx, -R * 0.36 * jw], [R * 0.3, -R * 0.7 * jw], [-R * 0.2, 0], [R * 0.3, R * 0.7 * jw], [R * 1.2 + jx, R * 0.36 * jw]]), () => lin(ctx, 0, 0, R * 1.5, 0, MOUTH[0], hot > 0.1 ? '#FF8A3D' : MOUTH[1]));
  if (jaw > 0.12) F.detail(() => { ctx.fillStyle = HORN[0]; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const q = 0.45 + i * 0.17, x = R * (0.3 + q * 0.95) + jx * q, y = s * R * (0.66 - 0.3 * q) * jw; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y - s * 9); ctx.lineTo(x + 5, y); ctx.closePath(); ctx.fill(); }
    if (hot > 0.1) { ctx.fillStyle = rgbaOf('#FFE08A', hot); ctx.beginPath(); ctx.ellipse(R * 1.0 + jx * 0.6, 0, R * 0.36, R * 0.2 * jw, 0, 0, TAU); ctx.fill(); } });
  // horns swept back, cheek spikes
  for (const s of [-1, 1]) {
    F.shape(() => { ctx.beginPath(); ctx.moveTo(-R * 0.25, s * R * 0.42); ctx.quadraticCurveTo(-R * 1.1, s * R * 0.7, -R * 1.95, s * R * 1.22); ctx.quadraticCurveTo(-R * 1.0, s * R * 1.12, -R * 0.6, s * R * 0.88); ctx.closePath(); }, () => lin(ctx, -R * 0.4, 0, -R * 1.9, s * R, HORN[2], HORN[1], HORN[0]));
    F.shape(() => poly(ctx, [[R * 0.2, s * R * 0.74], [-R * 0.42, s * R * 1.3], [-R * 0.3, s * R * 0.76]]), () => lin(ctx, 0, s * R * 0.7, 0, s * R * 1.3, HORN[1], HORN[0]));
  }
  // the skull and snout over the jaw; it lifts back a little as the mouth opens
  F.at(-jaw * R * 0.1, 0, 0, () => {
    F.shape(() => soft(ctx, [[R * 1.5, 0], [R * 1.4, -R * 0.26], [R * 0.85, -R * 0.5], [R * 0.25, -R * 0.86], [-R * 0.5, -R * 0.9], [-R * 0.98, -R * 0.45], [-R * 0.98, R * 0.45], [-R * 0.5, R * 0.9], [R * 0.25, R * 0.86], [R * 0.85, R * 0.5], [R * 1.4, R * 0.26]]),
      () => { const g = ctx.createRadialGradient(-R * 0.1, -R * 0.35, R * 0.1, R * 0.2, 0, R * 1.5); g.addColorStop(0, SCALE[0]); g.addColorStop(0.55, SCALE[1]); g.addColorStop(1, SCALE[2]); return g; });
    F.detail(() => {
      ctx.fillStyle = '#2B1418'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(R * 1.27, s * R * 0.15, 4.2, 2.8, s * 0.5, 0, TAU); ctx.fill(); }
      for (const s of [-1, 1]) { // a glowing slit of an eye under a heavy brow
        ctx.save(); ctx.translate(R * 0.5, s * R * 0.5); ctx.rotate(s * 0.42);
        ctx.fillStyle = '#2B1418'; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.25, R * 0.12, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = molten ? '#FFE08A' : '#FFB347'; ctx.beginPath(); ctx.ellipse(1, 0, R * 0.17, R * 0.055, 0, 0, TAU); ctx.fill();
        ctx.translate(-R * 0.16, -s * R * 0.1); scute(ctx, R * 0.3, molten, T, s); ctx.restore(); }
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(-R * (0.05 + i * 0.36), 0); scute(ctx, R * (0.2 + i * 0.03), molten, T, i); ctx.restore(); }
      gloss(ctx, R * 0.75, -R * 0.2, R * 0.34, R * 0.09, 0.12, 0.26, '255,226,200');
    });
  });
}

export function drawCinder(ctx, u, w) {
  const k = u.cd; if (!k) return;
  const T = w.time, [ux, uy] = up(), molten = !!u.molten, hot = clamp(Math.max(k.br && k.br.t <= 0 ? 1 : 0, (k.roarT || 0) > 0 ? 0.8 : 0, (u.jaw || 0) > 0.6 ? 0.5 : 0), 0, 1);
  const pts = []; for (let off = 26; off < LEN; off += 13) pts.push({ ...at_(k, u, off), off }); pts.push({ ...at_(k, u, LEN), off: LEN });
  const sh = at_(k, u, SHOULDER), hp = at_(k, u, HIP), tip = pts[pts.length - 1];
  const look = clamp(((k.look ?? u.facing) - u.facing + Math.PI * 3) % TAU - Math.PI, -0.65, 0.65), ha = u.facing + look;
  const lg = (u.lungeT || 0) > 0 ? Math.sin((1 - u.lungeT / 0.18) * Math.PI) * 20 : 0, hx = u.x + Math.cos(ha) * lg, hy = u.y + Math.sin(ha) * lg;
  const daze = k.dazed > 0 ? Math.sin(T * 9) * 0.12 : 0; if (k.dazed > 0) k.dazed -= w._dt || 0.016;
  figure(ctx, { wash: washOf(u, w), alpha: u.invulnT > 0.3 ? 0.85 : 1 }, (F) => {
    F.flash = false;
    // the tail's blade (while it has one)
    if (k.tail && !k.tail.dead) { F.flash = flashing(k.tail);
      F.at(tip.x, tip.y, tip.a + Math.PI, () => { F.shape(() => { ctx.beginPath(); ctx.moveTo(-6, -7); ctx.quadraticCurveTo(22, -34, 62, -12); ctx.lineTo(84, 0); ctx.lineTo(62, 12); ctx.quadraticCurveTo(22, 34, -6, 7); ctx.closePath(); }, () => lin(ctx, 0, 0, 84, 0, HORN[2], HORN[1], HORN[0]));
        F.detail(() => { ctx.strokeStyle = 'rgba(94,74,68,0.6)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(70, 0); ctx.stroke(); }); });
      F.flash = false; }
    // legs under the body: hind, then front
    for (const l of [...k.legs].reverse()) { const p = l.off === SHOULDER ? sh : hp, r = rOf(l.off) * 0.62, lift = l.lift || 0;
      leg(F, ctx, p.x + Math.cos(p.a + l.s * Math.PI / 2) * r, p.y + Math.sin(p.a + l.s * Math.PI / 2) * r, l.x + ux * lift, l.y + uy * lift, l.off === SHOULDER ? l.s : -l.s, p.a + l.s * 0.25, l.off === SHOULDER); }
    // the body: one skin from the neck to the tail's tip
    F.shape(() => ribbon(ctx, pts, (i) => rOf(pts[i].off)), SCALE[1]);
    F.detail(() => {
      // lit along its back (a paler band, a little up-screen of the middle), darker down its flanks
      ctx.save(); ribbon(ctx, pts, (i) => rOf(pts[i].off)); ctx.clip();
      ctx.fillStyle = rgbaOf(SCALE[2], 0.55); ribbon(ctx, pts.map((p) => ({ x: p.x - ux * 7, y: p.y - uy * 7 })), (i) => rOf(pts[i].off)); ctx.fill();
      ctx.fillStyle = SCALE[1]; ribbon(ctx, pts.map((p) => ({ x: p.x + ux * 3, y: p.y + uy * 3 })), (i) => rOf(pts[i].off) * 0.9); ctx.fill();
      ctx.fillStyle = rgbaOf(SCALE[0], 0.8); ribbon(ctx, pts.map((p) => ({ x: p.x + ux * 5, y: p.y + uy * 5 })), (i) => rOf(pts[i].off) * 0.5); ctx.fill();
      if (molten) { ctx.strokeStyle = rgbaOf(EMBER, 0.7 + 0.3 * Math.sin(T * 6)); ctx.lineWidth = 3; ctx.lineCap = 'round'; // cracks of fire across its flanks
        for (let i = 2; i < pts.length - 4; i += 2) { const p = pts[i], r = rOf(p.off), s = i % 4 ? 1 : -1, nx = Math.cos(p.a + Math.PI / 2) * s, ny = Math.sin(p.a + Math.PI / 2) * s; ctx.beginPath(); ctx.moveTo(p.x + nx * r * 0.45, p.y + ny * r * 0.45); ctx.lineTo(p.x + nx * r * 0.7 + Math.cos(p.a) * 7, p.y + ny * r * 0.7 + Math.sin(p.a) * 7); ctx.lineTo(p.x + nx * r * 0.98, p.y + ny * r * 0.98); ctx.stroke(); } }
      ctx.restore();
      // scutes down the spine, smaller towards the tail
      for (let off = 50, i = 0; off < LEN - 30; off += 30, i++) { const p = at_(k, u, off), r = rOf(off); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); scute(ctx, Math.max(6, r * 0.42), molten, T, i); ctx.restore(); }
    });
    // the head, turned towards its mark
    F.flash = flashing(u);
    F.at(hx, hy, ha + daze, () => head(F, ctx, u.vr, clamp(u.jaw || 0, 0, 1), T, hot, molten));
  });
}
export function drawCinderPart() {} // (the body is drawn whole, with the head)

// ---------------------------------------------------------------- the pit's floor: lava at its edges, fire where it breathes
export function drawPitFloor(ctx, w) {
  const T = w.time;
  for (const p of w.lava || []) { drawPuddle(ctx, 'fire', p.x, p.y, p.r, T, 1, Math.round(p.x * 7 + p.y * 13)); glow(ctx, p.x, p.y, p.r * 1.7, '#FF8A3D', 0.16 + 0.04 * Math.sin(T * 2 + p.x)); }
  const b = w.drakeBreath;
  if (b) { // the scorch on the floor: the game's own fire, laid down the cone as far as the rock lets it
    const n = 5;
    for (let i = 0; i < n; i++) { const a = b.a + (i / (n - 1) - 0.5) * b.arc * 0.9, L = clipRay(w, b.x, b.y, a, b.len);
      for (let d = 34; d < L; d += 36) drawPuddle(ctx, 'fire', b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 13 + d * 0.055, T, k01(b.t * 4), i * 31 + Math.round(d)); }
    glow(ctx, b.x + Math.cos(b.a) * b.len * 0.45, b.y + Math.sin(b.a) * b.len * 0.45, b.len * 0.6, '#FF8A3D', 0.22);
  }
  for (const u of w.units) if (u.cd && !u.dead && u.molten) glow(ctx, u.x, u.y, 150, '#FF8A3D', 0.14 + 0.04 * Math.sin(T * 5));
}
export function drawPitAir(ctx, w) {
  const b = w.drakeBreath, T = w.time;
  if (!b) return;
  // tongues of flame streaming down the cone, small at the jaws and big at the far end, the nearer ones drawn over the further
  const fl = [], [ux, uy] = up();
  for (let i = 0; i < 7; i++) { const a = b.a + (i / 6 - 0.5) * b.arc * 0.86, L = clipRay(w, b.x, b.y, a, b.len);
    for (let j = 0; j < 5; j++) { const q = (T * 1.9 + j / 5 + hash(i, 3) * 0.2) % 1, d = L * q; if (d < 10) continue;
      const sway = Math.sin(T * 9 + i * 2 + j) * 5 * q, x = b.x + Math.cos(a) * d - Math.sin(a) * sway, y = b.y + Math.sin(a) * d + Math.cos(a) * sway;
      fl.push([-(x * ux + y * uy), x, y, (7 + 13 * q) * (0.85 + 0.3 * hash(i, j)) * Math.min(1, b.t * 5) * (q > 0.86 ? (1 - q) / 0.14 : 1), Math.sin(T * 7 + i + j) * 0.2]); } }
  fl.sort((p, q) => p[0] - q[0]);
  for (const [, x, y, sz, sway] of fl) if (sz > 1) upright(ctx, x, y, () => { ctx.rotate(sway); flame(ctx, 0, 0, sz); });
  // the jet at its jaws: a short hot core
  streak(ctx, b.x - Math.cos(b.a) * 14, b.y - Math.sin(b.a) * 14, b.a, 0, 96 + 10 * Math.sin(T * 40), 15, '#FF8A3D', '#FFE08A');
}
function clipRay(w, x, y, a, len) {
  let d = 0;
  for (; d < len; d += 12) { const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    if (px < 0 || py < 0 || px > w.W || py > w.H || w.pillars.some((p) => (px - p.x) ** 2 + (py - p.y) ** 2 < p.r * p.r) || w.walls.some((r) => px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h)) break; }
  return d;
}

// ---------------------------------------------------------------- its moves
BFX.drakeBite = { air(ctx, f, k) { // the snap: two rows of fangs closing, a lick of fire between
  const e = easeOut(k01(k / 0.35)), gap = f.r * 0.42 * (1 - e), cx = f.x + Math.cos(f.a) * f.r * 0.62, cy = f.y + Math.sin(f.a) * f.r * 0.62;
  ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(cx - Math.sin(f.a) * gap * s, cy + Math.cos(f.a) * gap * s); ctx.rotate(f.a);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-f.r * 0.42, s * 14); ctx.quadraticCurveTo(0, s * 30, f.r * 0.42, s * 14); for (let i = 3; i >= -3; i--) { ctx.lineTo(i * f.r * 0.12 + f.r * 0.06, s * 12); ctx.lineTo(i * f.r * 0.12, s * -4); } ctx.closePath(); }, HORN[0]); ctx.restore(); }
  if (k > 0.25) for (let i = 0; i < 5; i++) { const a = f.a + (i - 2) * 0.35, d = f.r * (0.5 + 0.4 * k); upright(ctx, f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, () => flame(ctx, 0, 0, 10 * (1 - k) + 2)); }
} };
BFX.drakeLash = { air(ctx, f, k) { const e = easeOut(k01(k / 0.55)), h = f.a0 + (f.a1 - f.a0) * e, t = f.a0 + (f.a1 - f.a0) * sm(k01((k - 0.2) / 0.8)); slashBand(ctx, f.x, f.y, f.r * 0.98, t, h, 34 * (1 - 0.5 * k), '#FFCDBD', '#FFF6F2', true); dustPuffs(ctx, f.x + Math.cos(h) * f.r * 0.8, f.y + Math.sin(h) * f.r * 0.8, 30, k, 3, 4); } };
BFX.drakeRoar = { air(ctx, f, k, w) { // a roar: short lines bursting from its jaws, embers
  const u = f.u; if (!u || u.dead) return; const T = w.time, a0 = u.facing; ctx.globalAlpha = Math.min(1, k * 6, (1 - k) * 4);
  for (let i = 0; i < 9; i++) { const q = (T * 2.4 + i / 9) % 1, a = a0 + (i - 4) * 0.22; streak(ctx, u.x, u.y, a, u.vr * 1.7 + 80 * q, u.vr * 1.7 + 80 * q + 32, 5, '#FFE8C2'); }
} };
BFX.roarBurst = {
  ground(ctx, f, k) { const e = easeOut(k); ctx.globalAlpha = (1 - k) * 0.6; ctx.strokeStyle = '#FFC85A'; ctx.lineWidth = 24 * (1 - k) + 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.3 + 0.7 * e), 0, TAU); ctx.stroke(); },
  air(ctx, f, k) { const r = f.r * (0.3 + 0.7 * easeOut(k)), n = 16; ctx.globalAlpha = 1 - k * k; for (let i = 0; i < n; i++) { const a = i / n * TAU; upright(ctx, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, () => flame(ctx, 0, 0, 11 * (1 - 0.6 * k))); } },
};
BFX.fireFall = { // a fireball out of the dark: its shadow gathers on the floor, then the ball itself comes down the last stretch
  ground(ctx, f, k) { shade(ctx, f.x, f.y, 20 + 30 * k, 16 + 24 * k, 0.12 + 0.3 * k); },
  air(ctx, f, k, w) { const q = k01((k - 0.5) / 0.5); if (q <= 0) return; const [ux, uy] = up(), h = (1 - q * q) * 460;
    drawProjectile(ctx, { kind: 'fireball', ab: 'fireball', x: f.x + ux * h + uy * h * 0.12, y: f.y + uy * h - ux * h * 0.12, vx: -ux * 600 - uy * 70, vy: -uy * 600 + ux * 70, life: 1 }, w.time); },
};
BFX.ringMark = { ground(ctx, f, k, w) { ctx.globalAlpha = Math.min(1, (1 - k) * 3) * 0.8; ctx.strokeStyle = '#FF7A2F'; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -w.time * 40; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); } };
BFX.drakeCrouch = { air(ctx, f, k) { const u = f.u; if (!u || u.dead) return; dustPuffs(ctx, u.x - Math.cos(u.facing) * 60, u.y - Math.sin(u.facing) * 60, 50, k, 2, 5); } };
BFX.drakeCrash = { air(ctx, f, k) { if (k < 0.2) glow(ctx, f.x, f.y, 90, '#FFF4DC', 0.8 * (1 - k / 0.2)); ctx.globalAlpha = 1 - k; inked(ctx, () => star(ctx, f.x, f.y, 34 * easeOut(k) + 10, 6, 0.4, 0.3), '#FFF4DC'); dustPuffs(ctx, f.x, f.y, 70, k, 5, 8); } };
BFX.drakeDazed = { air(ctx, f, k, w) { const u = f.u; if (!u || u.dead) return; const [ux, uy] = up(); ctx.globalAlpha = Math.min(1, (1 - k) * 4);
  for (let i = 0; i < 3; i++) { const a = w.time * 4 + i * TAU / 3, x = u.x + Math.cos(a) * u.vr * 0.8 + ux * u.vr * 0.9, y = u.y + Math.sin(a) * u.vr * 0.32 + uy * u.vr * 0.9; inked(ctx, () => star(ctx, x, y, 9, 4, 0.35, a), '#FFF7C2'); } } };
BFX.drakeTailOff = { air(ctx, f, k) { const e = easeOut(k), [ux, uy] = up(), hop = Math.sin(k01(k * 1.2) * Math.PI) * 60; ctx.globalAlpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
  ctx.save(); ctx.translate(f.x - Math.cos(f.a) * 120 * e + ux * hop, f.y - Math.sin(f.a) * 120 * e + uy * hop); ctx.rotate(f.a + Math.PI + k * 9);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-40, -7); ctx.quadraticCurveTo(-14, -30, 22, -12); ctx.lineTo(44, 0); ctx.lineTo(22, 12); ctx.quadraticCurveTo(-14, 30, -40, 7); ctx.closePath(); }, HORN[1]); ctx.restore(); } };
BFX.drakeFall = { air(ctx, f, k) { const [ux, uy] = up(), e = easeOut(k); ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  for (let i = 0; i < 3; i++) { const a = f.a + 1.57 + i * 2.1 + hash(f.seed, i), d = f.r * 2 * e * (0.4 + hash(i, f.seed)), hop = Math.sin(k01(k * 1.3) * Math.PI) * 24;
    ctx.save(); ctx.translate(f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop); ctx.rotate(a + k * 4); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, f.r * 0.6, f.r * 0.4, 0, 0, TAU); }, i % 2 ? SCALE[1] : PLATE[0]); ctx.restore(); }
  dustPuffs(ctx, f.x, f.y, f.r * 2, k, f.seed, 5, '#B5754A'); } };
