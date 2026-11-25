// The angel's hall and moves, drawn (lane B, bosses3). The angel itself is the art lane's sprite (round 10,
// art/bosses/biblical-angel.svg): what is drawn here in code is made to sit beside it: gold in the same four tones, the
// same blue eyes, one ink outline on solid things, none on light. Chains and hoops lie on the floor, under the units.
import { INK, TAU, clamp, OUTLINE } from './util.js';
import { inked, inkLine, star, upright } from './fx.js';
import { figure, flashing, lin, rad, gloss, glow, shade, ell, circ, soft, poly, up, BFX, easeOut, sm, k01, hash, inkDisc, streak, rgbaOf } from './boss-draw.js';

const GOLD = ['#FFE9A8', '#F2C14E', '#D99A22', '#A8741A'], WHITE = '#FFFBEA', BLUE = ['#7CC4F0', '#2F86C8', '#1B4E86'];

// an open eye as the wheels wear them: a white almond, a blue iris, a dark pupil, a glint
function eye(ctx, x, y, s, rot = 0, open = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.9 * open, s, 0); ctx.quadraticCurveTo(0, s * 0.9 * open, -s, 0); ctx.closePath(); }, WHITE);
  if (open > 0.3) { ctx.save(); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.9 * open, s, 0); ctx.quadraticCurveTo(0, s * 0.9 * open, -s, 0); ctx.clip();
    ctx.fillStyle = BLUE[1]; ctx.beginPath(); ctx.arc(0, 0, s * 0.46, 0, TAU); ctx.fill(); ctx.fillStyle = BLUE[2]; ctx.beginPath(); ctx.arc(0, 0, s * 0.22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-s * 0.16, -s * 0.16, s * 0.1, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
// a gold band round a circle (a wheel flown out of the angel), set with eyes, turning
function hoop(ctx, x, y, r, wd, rot, a = 1) {
  if (r < 8) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'butt';
  ctx.strokeStyle = INK; ctx.lineWidth = wd + OUTLINE * 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = GOLD[2]; ctx.lineWidth = wd; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = GOLD[1]; ctx.lineWidth = wd * 0.7; ctx.beginPath(); ctx.arc(x, y, r + wd * 0.06, 0, TAU); ctx.stroke();
  ctx.strokeStyle = GOLD[0]; ctx.lineWidth = wd * 0.22; ctx.beginPath(); ctx.arc(x, y, r + wd * 0.2, 0, TAU); ctx.stroke();
  const n = Math.max(6, Math.round(r / 26));
  for (let i = 0; i < n; i++) { const b = rot + i / n * TAU; eye(ctx, x + Math.cos(b) * r, y + Math.sin(b) * r, wd * 0.62, b + Math.PI / 2); }
  ctx.restore();
}
// a chain along a line from (x1, y1), d long: links seen from above, one flat, one on edge; inked gold
function chain(ctx, x1, y1, a, d, T, rattle = 0) {
  if (d < 6) return;
  const n = Math.max(1, Math.floor(d / 17));
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(a); ctx.lineCap = 'round';
  const links = (col, wd) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath();
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * (d / n), y = rattle ? Math.sin(T * 40 + i * 1.7) * rattle : 0;
      if (i % 2) { ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); } else { ctx.moveTo(x + 10, y); ctx.ellipse(x, y, 10, 6.5, 0, 0, TAU); } }
    ctx.stroke(); };
  links(INK, 4.6 + OUTLINE * 2); links(GOLD[2], 4.6); links(GOLD[0], 1.8);
  ctx.restore();
}
function shackle(ctx, x, y, a, shut) { // the chain's end: a gold cuff, open as it flies, shut on what it holds
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  const gap = shut ? 0.25 : 1.1, p = () => { ctx.beginPath(); ctx.arc(14, 0, 19, gap, TAU - gap); };
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 7.5 + OUTLINE * 2; p(); ctx.stroke(); ctx.strokeStyle = GOLD[1]; ctx.lineWidth = 7.5; p(); ctx.stroke(); ctx.strokeStyle = GOLD[0]; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(14, 0, 21, Math.PI * 0.9, Math.PI * 1.5); ctx.stroke();
  inkDisc(ctx, -5, 0, 6.5, GOLD[2]);
  ctx.restore();
}

// ---- a trumpet: a long gold horn, its bell towards its blast; it swells as its note climbs
export function drawHorn(ctx, u, w) {
  const T = w.time, sw = clamp(u.swell || 0, 0, 1), pulse = 1 + 0.05 * sw * Math.sin(T * (10 + 14 * sw)), born = k01((T - (u.born || 0)) / 0.3);
  ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(u.facing); ctx.scale(born * pulse, born * pulse);
  figure(ctx, {}, (F) => {
    F.flash = flashing(u);
    F.shape(() => ell(ctx, -36, 0, 7, 8), GOLD[2]);
    F.shape(() => soft(ctx, [[-36, 0], [-20, -5.5], [8, -8], [28, -17], [44, -31], [50, 0], [44, 31], [28, 17], [8, 8], [-20, 5.5]]), () => lin(ctx, 0, -30, 0, 30, GOLD[0], GOLD[1], GOLD[2]));
    F.shape(() => ell(ctx, 47, 0, 7.5, 32), () => lin(ctx, 0, -32, 0, 32, GOLD[0], GOLD[1], GOLD[3]));
    F.detail(() => { ctx.fillStyle = GOLD[3]; ctx.fillRect(-12, -7.5, 4, 15); ctx.fillRect(4, -8.6, 4, 17.2);
      ctx.fillStyle = '#5A3A10'; ctx.beginPath(); ctx.ellipse(48.5, 0, 4.2, 25, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rgbaOf('#FFF6D0', 0.35 + 0.65 * sw); ctx.beginPath(); ctx.ellipse(48.5, 0, 3.4, 8 + 15 * sw, 0, 0, TAU); ctx.fill();
      gloss(ctx, 6, -5, 22, 2.6, -0.1, 0.5, '255,255,240'); });
  });
  // the note: short arcs of sound out of the bell, quicker and wider as it climbs
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const q = (T * (1.4 + 2.2 * sw) + i / 3) % 1, d = 62 + q * (40 + 60 * sw); ctx.strokeStyle = rgbaOf('#FFF6D0', (1 - q) * (0.35 + 0.5 * sw)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, d, -0.3 - 0.12 * q, 0.3 + 0.12 * q); ctx.stroke(); }
  ctx.restore();
}

// ---------------------------------------------------------------- the hall's floor
export function drawSanctumFloor(ctx, w) {
  const T = w.time;
  if (w.sanctum) { // a great wheel inlaid in the floor, a ring bolted down in each corner for the chains
    const cx = w.W / 2, cy = w.H / 2, R = Math.min(w.W, w.H) * 0.34;
    ctx.save();
    ctx.fillStyle = 'rgba(242,193,78,0.1)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(201,164,74,0.4)'; ctx.lineWidth = 5; for (const rr of [R, R * 0.72, R * 0.3]) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke(); }
    ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.moveTo(cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } ctx.stroke();
    ctx.fillStyle = 'rgba(201,164,74,0.4)'; for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; ctx.save(); ctx.translate(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(0, -10, 13, 0); ctx.quadraticCurveTo(0, 10, -13, 0); ctx.fill(); ctx.restore(); }
    ctx.restore();
    for (const [x, y] of [[34, 34], [w.W - 34, 34], [34, w.H - 34], [w.W - 34, w.H - 34]]) { inkDisc(ctx, x, y, 20, GOLD[3]); inkDisc(ctx, x, y, 12, '#4A3A30'); ctx.strokeStyle = GOLD[0]; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y, 16, 3.4, 5.2); ctx.stroke(); }
  }
  // the gaze: the eye's sight laid on the floor, a broad cone of light with rays in it
  const g = w.angelGaze;
  if (g) { const fade = Math.min(1, g.t * 3, g.left * 3);
    ctx.save(); ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.arc(g.x, g.y, g.r, g.a - g.arc / 2, g.a + g.arc / 2); ctx.closePath(); ctx.clip();
    const gr = ctx.createRadialGradient(g.x, g.y, 30, g.x, g.y, g.r); gr.addColorStop(0, `rgba(255,240,180,${0.6 * fade})`); gr.addColorStop(0.6, `rgba(255,226,140,${0.34 * fade})`); gr.addColorStop(1, 'rgba(255,226,140,0)');
    ctx.fillStyle = gr; ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
    ctx.fillStyle = `rgba(255,251,234,${0.22 * fade})`; for (let i = 0; i < 7; i++) { const a = g.a + ((i + 0.5) / 7 - 0.5) * g.arc + Math.sin(T * 0.9 + i) * 0.04, wd = 0.035 + 0.02 * Math.sin(T * 2 + i * 1.3); ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.arc(g.x, g.y, g.r, a - wd, a + wd); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
  for (const u of w.units) {
    const k = u.an; if (!k || u.dead) continue;
    glow(ctx, u.x, u.y, u.vr * 2.6, GOLD[0], 0.2 + 0.05 * Math.sin(T * 3)); // its light, on the floor under it
    // the host's hymn: a ribbon of song along the floor from each singer, and a ring of it round the angel
    let sung = false;
    for (const s of w.units) if (s.singsFor === u && !s.dead) { sung = true; const a = Math.atan2(u.y - s.y, u.x - s.x), L = Math.hypot(u.x - s.x, u.y - s.y), nx = -Math.sin(a), ny = Math.cos(a);
      inkLine(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const q = i / 24, wob = Math.sin(q * 9 - T * 5) * 9 * Math.sin(q * Math.PI); ctx.lineTo(s.x + Math.cos(a) * L * q + nx * wob, s.y + Math.sin(a) * L * q + ny * wob); } }, GOLD[0], 4.5); }
    if (sung) { ctx.save(); ctx.strokeStyle = rgbaOf(GOLD[0], 0.75 + 0.2 * Math.sin(T * 6)); ctx.lineWidth = 5; ctx.setLineDash([16, 10]); ctx.lineDashOffset = T * 30; ctx.beginPath(); ctx.arc(u.x, u.y, u.vr * 1.5, 0, TAU); ctx.stroke(); ctx.restore(); }
    // the chains: taut along the floor from their corners
    for (const c of k.chains) {
      if (c.st === 'tell') { const q = 1 - clamp(c.t / 1.15, 0, 1); glow(ctx, c.cx, c.cy, 40 + 30 * q, GOLD[0], 0.5 * q); chain(ctx, c.cx, c.cy, c.a, 30 + 26 * q, T, 2.2); shackle(ctx, c.cx + Math.cos(c.a) * (30 + 26 * q), c.cy + Math.sin(c.a) * (30 + 26 * q), c.a, false); continue; }
      const hx = c.cx + Math.cos(c.a) * c.d, hy = c.cy + Math.sin(c.a) * c.d, held = c.st === 'drag' || c.st === 'hold';
      chain(ctx, c.cx, c.cy, c.a, Math.max(0, c.d - (held ? 16 : 0)), T, c.st === 'back' ? 1.5 : 0);
      shackle(ctx, hx - Math.cos(c.a) * (held ? 14 : 0), hy - Math.sin(c.a) * (held ? 14 : 0), c.a, held);
    }
  }
}
export function drawSanctumAir() {}

// ---------------------------------------------------------------- its moves
BFX.hoop = { ground(ctx, f, k, w) { // a wheel flown out: it spreads to its ring and hangs there turning until it drops (the light is the zone's own)
  const q = k * f.max / f.tell, e = easeOut(k01(q / 0.6)), r = 50 + (f.r - 50) * e;
  if (q >= 1) { ctx.globalAlpha = 1 - k01((q - 1) / 0.2); }
  shade(ctx, f.x, f.y, r + f.band * 0.5, r + f.band * 0.5, 0.0);
  hoop(ctx, f.x, f.y, r, 17, f.dir * (w.time * 1.1 + q * 2), Math.min(1, q * 6));
} };
BFX.hornBlast = { air(ctx, f, k) { // the note let go: short bars of sound bursting down the cone
  ctx.lineCap = 'round';
  for (let row = 0; row < 4; row++) { const q = k01(k * 1.3 - row * 0.1); if (q <= 0 || q >= 1) continue; const d = 70 + (f.r - 70) * easeOut(q) * (0.5 + row * 0.17);
    for (let i = -2; i <= 2; i++) { const a = f.a + i * f.arc / 5.2; ctx.strokeStyle = INK; ctx.lineWidth = 12 * (1 - q) + 3; ctx.beginPath(); ctx.arc(f.x, f.y, d, a - 0.07, a + 0.07); ctx.stroke();
      ctx.strokeStyle = row % 2 ? GOLD[0] : WHITE; ctx.lineWidth = 8 * (1 - q) + 1; ctx.beginPath(); ctx.arc(f.x, f.y, d, a - 0.07, a + 0.07); ctx.stroke(); } }
} };
BFX.chainCatch = { air(ctx, f, k) { glow(ctx, f.x, f.y, 46, WHITE, 0.7 * (1 - k)); ctx.globalAlpha = 1 - k; inked(ctx, () => star(ctx, f.x, f.y, 22 * easeOut(k) + 6, 4, 0.3, 0.4), WHITE); } };
BFX.silenced = { air(ctx, f, k, w) { const u = f.u; if (!u || u.dead) return; const [ux, uy] = up(); ctx.globalAlpha = Math.min(1, (1 - k) * 4);
  for (let i = 0; i < 3; i++) { const a = w.time * 4 + i * TAU / 3, x = u.x + Math.cos(a) * u.vr * 0.8 + ux * u.vr, y = u.y + Math.sin(a) * u.vr * 0.3 + uy * u.vr; inked(ctx, () => star(ctx, x, y, 9, 4, 0.35, a), '#FFF7C2'); } } };
BFX.angelFall = { // it comes apart: the two wheels roll away and fall flat, feathers and light
  ground(ctx, f, k) { const e = easeOut(k); for (const s of [-1, 1]) { ctx.save(); ctx.globalAlpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25; hoop(ctx, f.x + s * 130 * e, f.y + 40 * e * s, 62, 15, s * k * 7, 1); ctx.restore(); } },
  air(ctx, f, k) { const [ux, uy] = up(), e = easeOut(k);
    if (k < 0.3) glow(ctx, f.x, f.y, 200, WHITE, 0.9 * (1 - k / 0.3));
    ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + hash(i, f.seed), d = (70 + 110 * hash(f.seed, i)) * e, drift = Math.sin(k * 6 + i) * 12, x = f.x + Math.cos(a) * d + drift - ux * 0, y = f.y + Math.sin(a) * d + uy * (30 * (1 - k)) * -1;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.sin(k * 5 + i) * 0.8); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(0, -7, 14, 0); ctx.quadraticCurveTo(0, 7, -13, 0); ctx.closePath(); }, i % 3 ? WHITE : GOLD[0]); ctx.restore(); } },
};
