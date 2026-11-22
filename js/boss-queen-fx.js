// The Winter Queen's hall and moves, drawn (lane B, bosses3). She and her mirrors are sprites (art round 9); this is
// what her magic looks like: crystals with the Frost Mage's own cut (pale blue, a white facet, the ink outline), snow
// as the game draws it, and beams that are an inked core with a halo. Lingering things lie under the units.
import { TAU } from './util.js';
import { inked, inkLine } from './fx.js';
import { snowflake } from './puddles.js';
import { lin, glow, poly, up, upRot, BFX, easeOut, sm, k01, hash, rgbaOf } from './boss-draw.js';

const ICE = ['#4A9CC8', '#9FDDF6', '#DDF6FF', '#FFFFFF'];
// a crystal standing up out of the floor (it leans up the screen): h tall, wd half-wide, a white facet down one side
function crystal(ctx, x, y, h, wd, lean = 0) {
  if (h < 2) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(upRot() + lean);
  inked(ctx, () => poly(ctx, [[-wd, 0], [-wd * 0.7, -h * 0.62], [0, -h], [wd * 0.8, -h * 0.55], [wd, 0], [0, wd * 0.5]]), ICE[1]);
  ctx.fillStyle = ICE[2]; poly(ctx, [[-wd * 0.72, -2], [-wd * 0.5, -h * 0.6], [0, -h * 0.96], [0, -2]]); ctx.fill();
  ctx.fillStyle = ICE[3]; poly(ctx, [[-wd * 0.5, -h * 0.25], [-wd * 0.36, -h * 0.6], [-wd * 0.12, -h * 0.72], [-wd * 0.2, -h * 0.25]]); ctx.fill();
  ctx.restore();
}
// a crystal lying along a (flying, or gathered at her shoulder)
function shard(ctx, x, y, a, L, wd) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  inked(ctx, () => poly(ctx, [[L, 0], [L * 0.25, -wd], [-L * 0.6, -wd * 0.55], [-L * 0.75, 0], [-L * 0.6, wd * 0.55], [L * 0.25, wd]]), ICE[1]);
  ctx.fillStyle = ICE[2]; poly(ctx, [[L * 0.9, 0], [L * 0.25, -wd * 0.8], [-L * 0.55, -wd * 0.4], [-L * 0.55, 0]]); ctx.fill();
  ctx.restore();
}

export function drawGlacierFloor(ctx, w) {
  const T = w.time, d = w.dais;
  if (d) { // her dais: a six-sided slab of blue ice, a paler face, a frosted rim
    const hex = (r) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; ctx.lineTo(d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * 1.2); } ctx.closePath(); };
    inked(ctx, () => hex(120), lin(ctx, d.x - 100, d.y - 120, d.x + 100, d.y + 120, '#BCE6F8', '#8FCBE8'));
    ctx.fillStyle = lin(ctx, d.x - 80, d.y - 100, d.x + 80, d.y + 100, '#E2F6FF', '#B5E2F6'); hex(96); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(d.x - 30, d.y - 40, 40, 16, -0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(74,156,200,0.4)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(d.x + 14, d.y - 70); ctx.lineTo(d.x + 30, d.y - 16); ctx.lineTo(d.x + 12, d.y + 34); ctx.moveTo(d.x + 30, d.y - 16); ctx.lineTo(d.x + 58, d.y + 6); ctx.stroke();
  }
  // the lattice: lines of cold between her and her mirrors. Gathering: thin and pale, running out from her. Lit: a
  // band of frost on the floor, an inked beam, crystals standing along it
  const L = w.queenLattice;
  if (L) for (const [x1, y1, x2, y2] of L.edges) {
    const a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
    if (!L.on) { ctx.save(); ctx.strokeStyle = rgbaOf(ICE[2], 0.5 + 0.4 * L.k); ctx.lineWidth = 3 + 5 * L.k; ctx.lineCap = 'round'; ctx.setLineDash([10, 12]); ctx.lineDashOffset = -T * 60; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * L.k, y1 + (y2 - y1) * L.k); ctx.stroke(); ctx.restore(); continue; }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(159,221,246,0.35)'; ctx.lineWidth = 54; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }, ICE[1], 15);
    ctx.save(); ctx.strokeStyle = ICE[3]; ctx.lineWidth = 5.5 + 1.5 * Math.sin(T * 30); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    const n = Math.max(3, Math.round(len / 46)), grow = k01(L.t / 0.4);
    for (let i = 1; i < n; i++) { const q = i / n, s = i % 2 ? 1 : -1; crystal(ctx, x1 + Math.cos(a) * len * q - Math.sin(a) * 15 * s, y1 + Math.sin(a) * len * q + Math.cos(a) * 15 * s, (16 + 12 * hash(i, Math.round(x1))) * grow, 6, s * 0.2); }
  }
  // the eye of the storm: the still ground round her, its edge marked on the floor
  const e = w.stormEye;
  if (e && e.u && !e.u.dead && w.blizzard) { ctx.save(); ctx.globalAlpha = Math.min(1, w.blizzard); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.lineDashOffset = T * 40; ctx.beginPath(); ctx.arc(e.u.x, e.u.y, e.r, 0, TAU); ctx.stroke(); ctx.restore(); }
}
export function drawGlacierAir(ctx, w) {
  if (!w.blizzard) return;
  w.blizzard = Math.min(1, w.blizzard + (w._dt || 0.016) * 0.5);
  // the blizzard: a white veil over the room and snow driving across it, all but the eye round her
  const b = w.blizzard, T = w.time, e = w.stormEye && w.stormEye.u && !w.stormEye.u.dead ? w.stormEye : null;
  ctx.save();
  ctx.beginPath(); ctx.rect(-200, -200, w.W + 400, w.H + 400); if (e) { ctx.moveTo(e.u.x + e.r, e.u.y); ctx.arc(e.u.x, e.u.y, e.r, 0, TAU, true); } ctx.clip('evenodd');
  ctx.fillStyle = `rgba(235,245,255,${0.3 * b})`; ctx.fillRect(-200, -200, w.W + 400, w.H + 400);
  ctx.strokeStyle = `rgba(255,255,255,${0.8 * b})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < 110; i++) { const sx = hash(i, 1) * (w.W + 400), sy = hash(i, 2) * w.H, sp = 420 + hash(i, 3) * 300, x = ((sx + T * sp) % (w.W + 400)) - 200, y = (sy + T * sp * 0.35) % w.H; ctx.moveTo(x, y); ctx.lineTo(x - 24, y - 9); }
  ctx.stroke();
  for (let i = 0; i < 18; i++) { const sx = hash(i, 5) * (w.W + 400), sy = hash(i, 6) * w.H, sp = 200 + hash(i, 7) * 120, x = ((sx + T * sp) % (w.W + 400)) - 200, y = (sy + T * sp * 0.35) % w.H; ctx.globalAlpha = b; snowflake(ctx, x, y, 7 + 5 * hash(i, 8), T + i); }
  ctx.restore();
  if (e) { // snow swirling round the eye's edge
    for (let i = 0; i < 16; i++) { const a = T * 1.6 + i / 16 * TAU, r = e.r + 8 + 10 * Math.sin(T * 3 + i); ctx.save(); ctx.globalAlpha = 0.9 * b; snowflake(ctx, e.u.x + Math.cos(a) * r, e.u.y + Math.sin(a) * r, 6 + 3 * (i % 3), a); ctx.restore(); } }
}

// ---------------------------------------------------------------- her moves
BFX.fanGather = { air(ctx, f, k) { // five crystals form in a fan over her shoulders, points out, and grow
  const u = f.u; if (!u || u.dead) return; const g = easeOut(k);
  for (let i = 0; i < f.n; i++) { const a = f.a + (i - (f.n - 1) / 2) * 0.42, d = u.vr * 1.25; ctx.save(); ctx.globalAlpha = Math.min(1, k * 3); shard(ctx, u.x + Math.cos(a) * d, u.y + Math.sin(a) * d, a, 20 * g + 4, 7 * g + 1.5); ctx.restore(); }
  glow(ctx, u.x + Math.cos(f.a) * u.vr, u.y + Math.sin(f.a) * u.vr, 44, ICE[2], 0.4 * k);
} };
BFX.frostBurst = { // ice bursts out of the floor: a ring of tall crystals, a second ring behind it, snow thrown up
  ground(ctx, f, k) { ctx.globalAlpha = (1 - k) * 0.55; ctx.fillStyle = ICE[2]; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.4 + 0.6 * easeOut(k)), 0, TAU); ctx.fill(); },
  air(ctx, f, k) {
    const up2 = k < 0.16 ? easeOut(k / 0.16) : 1 - sm(k01((k - 0.5) / 0.5));
    if (k < 0.15) glow(ctx, f.x, f.y, f.r * 1.1, ICE[3], 0.8 * (1 - k / 0.15));
    const list = [];
    for (const [rr, n, hh] of [[0.92, Math.max(10, Math.round(f.r / 13)), 46], [0.56, Math.max(7, Math.round(f.r / 22)), 32]]) for (let i = 0; i < n; i++) { const a = (i + 0.5 * hash(i, f.seed)) / n * TAU, x = f.x + Math.cos(a) * f.r * rr, y = f.y + Math.sin(a) * f.r * rr; list.push([y, x, hh * (0.75 + 0.5 * hash(f.seed, i)), Math.cos(a) * 0.3]); }
    list.sort((p, q) => p[0] - q[0]);
    for (const [y, x, h, lean] of list) crystal(ctx, x, y, h * up2, 9, lean);
    const [ux, uy] = up();
    for (let i = 0; i < 10; i++) { const a = hash(i, f.seed) * TAU, d = f.r * (0.3 + 0.8 * hash(f.seed, i)) * easeOut(k), hop = Math.sin(k * Math.PI) * 40 * hash(i, 4); ctx.save(); ctx.globalAlpha = 1 - k; snowflake(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, 7, a); ctx.restore(); }
  },
};
BFX.snowBlink = { air(ctx, f, k) { // gone, or come, in a swirl of snow
  ctx.globalAlpha = 1 - k; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + k * 5, r = 12 + 46 * easeOut(k); snowflake(ctx, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 8 * (1 - 0.5 * k), a); }
  glow(ctx, f.x, f.y, 60, ICE[3], 0.6 * (1 - k));
} };
BFX.mirrorBreak = { air(ctx, f, k) { // a mirror broken: shards of it flung out, turning
  const e = easeOut(k), [ux, uy] = up(); ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + hash(i, f.seed), d = (30 + 80 * hash(f.seed, i)) * e, hop = Math.sin(k01(k * 1.3) * Math.PI) * 30; ctx.save(); ctx.translate(f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop); ctx.rotate(a + k * 7); inked(ctx, () => poly(ctx, [[12, 0], [-4, -8], [-10, 3]]), i % 2 ? ICE[2] : ICE[1]); ctx.restore(); }
} };
