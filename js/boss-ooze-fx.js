// The Great Ooze, drawn (lane B, bosses3): the picked slime's look at a boss's size. One soft-cornered block of
// jelly, lit from one corner to the other, a paler gloss on its lit shoulder, a darker band along its low edge, and
// in it what it has swallowed (bones, a skull, a shield), turning slowly. It is alive: it wobbles as it stands,
// squashes before a hop and stretches in the air, pulls itself round to roll. Its other half is drawn the same, smaller.
import { TAU, clamp, OUTLINES } from './util.js';
import { inked } from './fx.js';
import { figure, washOf, flashing, lin, glow, shade, ell, rrect, up, BFX, easeOut, sm, k01, hash, inkDisc, rgbaOf } from './boss-draw.js';

const GREEN = ['#B4E284', '#62B25C', '#347C48', '#1F5236'], MELT = ['#E4EC8E', '#B4C656', '#869A36', '#5E7226'], IN = 'rgba(38,84,52,0.5)';

function bone(ctx, L, wd) { ctx.beginPath(); ctx.rect(-L / 2, -wd / 2, L, wd); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.moveTo(sx * L / 2 + wd * 0.75, sy * wd * 0.62); ctx.arc(sx * L / 2, sy * wd * 0.62, wd * 0.75, 0, TAU); } }
export function drawOoze(ctx, u, w) {
  const T = w.time, dt = w._dt || 0.016, [ux, uy] = up(), king = u.core || u, melt = !!king.melting, C = melt ? MELT : GREEN;
  if (u.squashT > 0) u.squashT -= dt; if (u.landT > 0) u.landT -= dt;
  const R = u.vr, h = u.hop || 0, roll = clamp(u.rolling || 0, 0, 1), wob = u.wob || 0;
  // how it is pressed out of shape: a crouch or a landing flattens it, the air stretches it, standing it breathes
  let sq = (u.squash || 0) * 0.22 + (u.squashT > 0 ? 0.1 * Math.abs(Math.sin(T * 26)) : 0) + (u.landT > 0 ? 0.3 * (u.landT / 0.3) : 0);
  const sx = 1 + sq * 0.8 + 0.035 * Math.sin(wob * 1.3), sy = 1 - sq + 0.035 * Math.cos(wob * 1.3);
  const x = u.x + ux * h * 0.9, y = u.y + uy * h * 0.9, k = (1 + h / 320), corner = R * (0.5 + 0.48 * roll);
  ctx.save(); ctx.translate(x, y); ctx.rotate(u.facing + (roll ? u.rollA || 0 : 0)); ctx.scale(sx * k, sy * k);
  figure(ctx, { wash: washOf(u, w), alpha: u.invulnT > 0.3 ? 0.85 : 1 }, (F) => {
    F.flash = flashing(king) || flashing(u);
    const body = () => rrect(ctx, -R, -R, R * 2, R * 2, corner);
    F.shape(body, () => lin(ctx, -R * 0.8, -R * 0.8, R * 0.8, R * 0.8, C[0], C[1], C[2]));
    F.detail(() => {
      ctx.save(); body(); ctx.clip();
      // the darker band along its low edge, a rim of deeper green
      ctx.fillStyle = rgbaOf(C[3], 0.45); ctx.beginPath(); ctx.ellipse(R * 0.25, R * 1.5, R * 1.7, R * 0.95, -0.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgbaOf(C[3], 0.35); ctx.lineWidth = R * 0.12; body(); ctx.stroke();
      // what it has swallowed, turning slowly
      const things = [[0.1, 0.34, 0], [2.3, 0.42, 1], [4.4, 0.3, 2], [3.3, 0.5, 0], [5.5, 0.46, 3]];
      ctx.fillStyle = IN; ctx.strokeStyle = IN;
      things.forEach(([a0, d, kind], i) => { const a = a0 + T * 0.22 * (i % 2 ? 1 : -1), px = Math.cos(a) * R * d, py = Math.sin(a) * R * d;
        ctx.save(); ctx.translate(px, py); ctx.rotate(a * 1.4 + i);
        if (kind === 0) { bone(ctx, R * 0.42, R * 0.085); ctx.fill(); }
        else if (kind === 1) { ctx.beginPath(); ctx.arc(0, 0, R * 0.16, 0, TAU); ctx.rect(-R * 0.1, R * 0.08, R * 0.2, R * 0.1); ctx.fill(); ctx.fillStyle = rgbaOf(C[1], 0.9); ctx.beginPath(); ctx.arc(-R * 0.06, -R * 0.02, R * 0.04, 0, TAU); ctx.arc(R * 0.06, -R * 0.02, R * 0.04, 0, TAU); ctx.fill(); ctx.fillStyle = IN; }
        else if (kind === 2) { ctx.beginPath(); ctx.moveTo(0, -R * 0.17); ctx.quadraticCurveTo(R * 0.17, -R * 0.14, R * 0.15, 0); ctx.quadraticCurveTo(R * 0.1, R * 0.16, 0, R * 0.2); ctx.quadraticCurveTo(-R * 0.1, R * 0.16, -R * 0.15, 0); ctx.quadraticCurveTo(-R * 0.17, -R * 0.14, 0, -R * 0.17); ctx.fill(); }
        else { ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.arc(0, 0, R * 0.12, 0, TAU); ctx.stroke(); }
        ctx.restore(); });
      // bubbles rising through it
      for (let i = 0; i < 5; i++) { const q = (T * (0.25 + 0.1 * hash(i, 2)) + hash(i, 3)) % 1; ctx.fillStyle = `rgba(255,255,255,${0.3 * Math.sin(q * Math.PI)})`; ctx.beginPath(); ctx.arc((hash(i, 4) - 0.5) * R * 1.3, R * 0.7 - q * R * 1.3, R * (0.03 + 0.03 * hash(i, 5)), 0, TAU); ctx.fill(); }
      ctx.restore();
      // the gloss on its lit shoulder
      ctx.save(); ctx.translate(-R * 0.5, -R * 0.52); ctx.rotate(-0.7); ctx.fillStyle = 'rgba(255,255,255,0.42)'; rrect(ctx, -R * 0.24, -R * 0.075, R * 0.48, R * 0.15, R * 0.075); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(R * 0.36, R * 0.0, R * 0.05, 0, TAU); ctx.fill(); ctx.restore();
    });
  });
  ctx.restore();
}
export function drawCisternFloor() {}
export function drawCisternAir() {}

// ---------------------------------------------------------------- its moves: all of them made of itself
// a gob of ooze flung along the floor: an inked blob with its own gloss
function gob(ctx, x, y, r, melt) { if (r < 1) return; inkDisc(ctx, x, y, r, melt ? MELT[1] : GREEN[1]); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, TAU); ctx.fill(); }
BFX.oozeSplat = { // it lands: the floor under it splashed with ooze, gobs of it flung out and up
  ground(ctx, f, k) { const e = easeOut(k); ctx.globalAlpha = (1 - k) * 0.6; ctx.fillStyle = GREEN[2]; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + hash(i, f.seed), d = f.r * (0.5 + 0.55 * e) * (0.7 + 0.5 * hash(f.seed, i)); ctx.beginPath(); ctx.ellipse(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 22 * (1 - 0.4 * k), 12 * (1 - 0.4 * k), a, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = GREEN[0]; ctx.lineWidth = 14 * (1 - k) + 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.4 + 0.6 * e), 0, TAU); ctx.stroke(); },
  air(ctx, f, k) { const [ux, uy] = up(); if (k < 0.14) glow(ctx, f.x, f.y, f.r, '#E6F7B0', 0.6 * (1 - k / 0.14));
    for (let i = 0; i < 14; i++) { const a = hash(i, f.seed) * TAU, q = k01(k * (1.1 + 0.5 * hash(i, 2))); if (q >= 1) continue; const d = f.r * (0.4 + 0.9 * hash(f.seed, i)) * easeOut(q), hop = Math.sin(q * Math.PI) * (30 + 50 * hash(i, 7)); gob(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, (6 + 7 * hash(i, 11)) * (1 - 0.5 * q)); } },
};
BFX.oozeHeave = { ground(ctx, f, k) { // a heave: a ripple of itself rolling out from under it
  const u = f.u; if (!u) return; const e = easeOut(k); ctx.globalAlpha = (1 - k) * 0.7; ctx.strokeStyle = GREEN[1]; ctx.lineWidth = 18 * (1 - k) + 4; ctx.beginPath(); ctx.arc(u.x, u.y, f.r * (0.45 + 0.55 * e), 0, TAU); ctx.stroke(); ctx.strokeStyle = GREEN[0]; ctx.lineWidth = 6 * (1 - k) + 1; ctx.beginPath(); ctx.arc(u.x, u.y, f.r * (0.45 + 0.55 * e) + 5, 0, TAU); ctx.stroke(); },
  air(ctx, f, k) { const u = f.u; if (!u) return; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3, d = f.r * (0.5 + 0.5 * easeOut(k)); ctx.save(); ctx.globalAlpha = 1 - k; gob(ctx, u.x + Math.cos(a) * d, u.y + Math.sin(a) * d, 7 * (1 - k) + 2); ctx.restore(); } } };
BFX.oozeBounce = { air(ctx, f, k) { const [ux, uy] = up(); for (let i = 0; i < 7; i++) { const a = f.a + Math.PI + (i - 3) * 0.4, d = 70 * easeOut(k), hop = Math.sin(k * Math.PI) * 24; ctx.save(); ctx.globalAlpha = 1 - k; gob(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, 7 * (1 - 0.5 * k)); ctx.restore(); } } };
BFX.oozeTear = { air(ctx, f, k) { // it tears in two: strings of itself stretched between the halves, snapping
  ctx.globalAlpha = 1 - k; ctx.lineCap = 'round'; for (let i = -1; i <= 1; i++) { const off = i * 16, sag = 14 * Math.sin(k * Math.PI), L = 30 + 90 * easeOut(k), nx = Math.cos(f.a), ny = Math.sin(f.a), px = -ny * off, py = nx * off;
    if (OUTLINES) { ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 9 * (1 - k) + 2; ctx.beginPath(); ctx.moveTo(f.x + px - nx * L, f.y + py - ny * L); ctx.quadraticCurveTo(f.x + px, f.y + py + sag, f.x + px + nx * L, f.y + py + ny * L); ctx.stroke(); } // (round 19, lane toggles19)
    ctx.strokeStyle = GREEN[1]; ctx.lineWidth = 5 * (1 - k) + 1; ctx.beginPath(); ctx.moveTo(f.x + px - nx * L, f.y + py - ny * L); ctx.quadraticCurveTo(f.x + px, f.y + py + sag, f.x + px + nx * L, f.y + py + ny * L); ctx.stroke(); }
} };
BFX.oozeDrink = { air(ctx, f, k) { const u = f.u; if (!u) return; const e = sm(k); gob(ctx, f.x + (u.x - f.x) * e, f.y + (u.y - f.y) * e, 12 * (1 - 0.6 * k)); } };
BFX.oozeBurst = { air(ctx, f, k) { const [ux, uy] = up(); ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; for (let i = 0; i < 18; i++) { const a = hash(i, f.seed) * TAU, d = (60 + 200 * hash(f.seed, i)) * easeOut(k), hop = Math.sin(k01(k * 1.2) * Math.PI) * (40 + 60 * hash(i, 3)); gob(ctx, f.x + Math.cos(a) * d + ux * hop, f.y + Math.sin(a) * d + uy * hop, (9 + 9 * hash(i, 4)) * (1 - 0.5 * k)); } } };
