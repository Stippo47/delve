// The Goblin Chieftain's war camp and moves, drawn (lane B, bosses3). He is the art lane's sprite (round 10: two axes,
// war paint, a clipped ear); this is his room (the hide stage, the war drums, the tunnel mouths) and what his axes do,
// drawn to sit beside him: figures with the one outline, soft gradients, his own reds and steel.
import { INK, TAU, clamp, OUTLINES } from './util.js';
import { inked, star } from './fx.js';
import { dustPuffs } from './fxkit.js';
import { figure, flashing, lin, rad, ballFill, gloss, glow, shade, ell, circ, rrect, poly, soft, up, BFX, easeOut, sm, k01, hash, slashBand, inkDisc, rgbaOf } from './boss-draw.js';

const WOOD = ['#B07C4A', '#8A5A34', '#5E3A20'], HIDE = ['#F2E0BC', '#DCC498', '#B89C6E'], RED = '#B8342A', STEEL = ['#EEF3F8', '#C9D2DE', '#8A94A6'], BONE = '#F2E8D0';

// ---- a war drum seen from above: a barrel of staves, a hide skin laced on with a red hand painted on it, two
// sticks that come down on every beat (u.beatT counts down from a beat)
export function drawDrum(ctx, u, w) {
  const b = clamp((u.beatT || 0) / 0.25, 0, 1), r = u.vr * (1 + 0.06 * b), T = w.time, hp = u.hp / u.maxHp, awake = !!u.awake;
  if (awake && b > 0) glow(ctx, u.x, u.y, r * 2.3, '#F2A23A', 0.3 * b);
  ctx.save(); ctx.translate(u.x, u.y);
  figure(ctx, { alpha: awake ? 1 : 0.75 }, (F) => {
    F.flash = flashing(u);
    F.shape(() => circ(ctx, 0, 0, r), () => rad(ctx, 0, 0, r * 0.6, r, WOOD[0], WOOD[2]));
    F.shape(() => circ(ctx, 0, 0, r * 0.8), ballFill(ctx, 0, 0, r * 0.8, HIDE[0], awake ? HIDE[1] : HIDE[2], HIDE[2]));
    F.detail(() => {
      ctx.strokeStyle = WOOD[2]; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a + 0.3) * r * 0.97, Math.sin(a + 0.3) * r * 0.97); } ctx.stroke(); // the lacing
      ctx.fillStyle = rgbaOf(RED, awake ? 0.9 : 0.5); ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.26, r * 0.22, 0, 0, TAU); ctx.fill(); // a painted hand
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * r * 0.13, -r * 0.24 + Math.abs(i) * r * 0.05, r * 0.05, r * 0.14, i * 0.22, 0, TAU); ctx.fill(); }
      if (hp < 0.66) { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.2); ctx.lineTo(-r * 0.05, r * 0.1); ctx.lineTo(r * 0.3, -r * 0.4); ctx.stroke(); }
      if (hp < 0.33) { ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.55); ctx.lineTo(r * 0.12, r * 0.08); ctx.stroke(); }
      gloss(ctx, -r * 0.3, -r * 0.4, r * 0.26, r * 0.1, -0.6, 0.35, '255,250,235');
    });
    // the sticks: lifted between beats, down on the skin on the beat
    if (awake) for (const s of [-1, 1]) { const up2 = (1 - b) * 0.5 * (s > 0 ? 1 : Math.max(0, Math.sin(T * 9))); F.at(s * r * 0.95, r * 0.5, s * (-0.9 + up2 * 0.5) - Math.PI / 2, () => { F.shape(() => rrect(ctx, -3, -r * 0.2, 6, r * 0.95, 3), WOOD[0]); F.shape(() => circ(ctx, 0, -r * 0.2, 6.5), BONE); }); }
  });
  ctx.restore();
}

// ---- the camp's floor: his stage (a great hide pegged down with tusks), the tunnel mouths in the walls
export function drawCampFloor(ctx, w) {
  for (const t of w.tunnels || []) { // a timber-framed hole in the wall; a lantern glow in it when something is coming
    if (t.openT > 0) t.openT = Math.max(0, t.openT - (w._dt || 0.016));
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.a);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 58, Math.PI, TAU); ctx.closePath(); }, lin(ctx, 0, -58, 0, 0, WOOD[0], WOOD[2]));
    ctx.fillStyle = '#1E1510'; ctx.beginPath(); ctx.arc(0, 0, 43, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = WOOD[2]; ctx.lineWidth = 3; for (const a of [3.5, 4.0, 4.71, 5.4, 5.9]) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 44, Math.sin(a) * 44); ctx.lineTo(Math.cos(a) * 57, Math.sin(a) * 57); ctx.stroke(); }
    if (t.openT > 0) glow(ctx, 0, -12, 70, '#F2A23A', 0.5 * clamp(t.openT, 0, 1));
    ctx.restore();
  }
  const s = w.stage; if (!s) return;
  ctx.save(); ctx.translate(s.x, s.y);
  shade(ctx, 0, 6, 150, 190, 0.2);
  const hide = () => soft(ctx, [[0, -168], [70, -150], [124, -92], [112, -20], [128, 60], [84, 140], [0, 168], [-84, 140], [-128, 60], [-112, -20], [-124, -92], [-70, -150]]);
  inked(ctx, hide, lin(ctx, -120, -160, 120, 160, '#A9825A', '#7E5C3C'));
  ctx.fillStyle = 'rgba(255,236,200,0.14)'; ctx.beginPath(); ctx.ellipse(-16, -24, 78, 112, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgbaOf(RED, 0.55); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 70, 0.5, 2.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 70, 3.64, 5.74); ctx.stroke(); // war paint: two arcs and a hand
  ctx.fillStyle = rgbaOf(RED, 0.55); ctx.beginPath(); ctx.ellipse(0, 6, 22, 19, 0, 0, TAU); ctx.fill(); for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * 11, -22 + Math.abs(i) * 4, 4.5, 12, i * 0.22, 0, TAU); ctx.fill(); }
  ctx.restore();
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.31, x = s.x + Math.cos(a) * 124, y = s.y + Math.sin(a) * 164; // tusks pegging it down
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-7, 6); ctx.quadraticCurveTo(-5, -12, 3, -22); ctx.quadraticCurveTo(8, -8, 7, 6); ctx.closePath(); }, lin(ctx, 0, 6, 0, -22, '#D9CBA8', BONE)); ctx.restore(); }
}
// an axe like the ones he holds: a crescent of steel on a short haft, seen from above
function axe(ctx, x, y, a, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  inked(ctx, () => rrect(ctx, -4, -24, 8, 44, 4), WOOD[1]);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-2, -22); ctx.quadraticCurveTo(26, -34, 30, -4); ctx.quadraticCurveTo(14, -10, -2, -6); ctx.closePath(); }, lin(ctx, 0, -30, 28, -4, STEEL[0], STEEL[2]));
  ctx.restore();
}
export function drawCampAir(ctx, w) {
  for (const u of w.units) { const k = u.ch; if (!k || u.dead || !k.spin || !(k.spin.go > 0)) continue;
    // the whirlwind: a crescent of steel dragged behind each axe as he turns
    for (const s of [0, Math.PI]) { const a = u.facing + s + Math.PI / 2; slashBand(ctx, u.x, u.y, k.spin.r * 0.95, a - 1.7, a - 0.1, 26, '#FFCDBD', '#FFF6F2', true); } }
}

// ---------------------------------------------------------------- his moves
BFX.twinChop = { air(ctx, f, k) { // both axes: two crescents sweep in from either side and cross in front of him
  const e = easeOut(k01(k / 0.45)), fade = 1 - 0.5 * k;
  for (const s of [-1, 1]) { const a0 = f.a + s * f.arc / 2, a1 = f.a - s * f.arc * 0.25, h = a0 + (a1 - a0) * e, t = a0 + (a1 - a0) * sm(k01((k - 0.2) / 0.8)); slashBand(ctx, f.x, f.y, f.r * (s > 0 ? 0.96 : 0.82), t, h, 32 * fade, '#FFCDBD', '#FFF6F2', true); }
} };
BFX.axeLoop = { // a thrown axe: it flies the whole ring, turning end over end, and comes back to his hand
  ground(ctx, f, k) { const q = k01(k / 0.85); ctx.globalAlpha = 0.5 * (1 - k); ctx.strokeStyle = 'rgba(70,56,44,0.6)'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, f.a0, f.a0 + f.dir * TAU * q, f.dir < 0); ctx.stroke(); },
  air(ctx, f, k) { const q = k01(k / 0.85), a = f.a0 + f.dir * TAU * (q * q * (3 - 2 * q)); if (q >= 1) return;
    slashBand(ctx, f.x, f.y, f.r + 15, a - f.dir * 0.9, a, 30, '#FFCDBD', '#FFF6F2', true);
    axe(ctx, f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r, k * 40 * f.dir, 1.5); },
};
BFX.chiefCrash = { air(ctx, f, k) { if (k < 0.2) glow(ctx, f.x, f.y, 90, '#FFF4DC', 0.8 * (1 - k / 0.2)); ctx.globalAlpha = 1 - k; inked(ctx, () => star(ctx, f.x, f.y, 34 * easeOut(k) + 10, 6, 0.4, 0.3), '#FFF4DC'); dustPuffs(ctx, f.x, f.y, 70, k, 5, 8); } };
BFX.chiefDazed = { air(ctx, f, k, w) { const u = f.u; if (!u || u.dead) return; const [ux, uy] = up(); ctx.globalAlpha = Math.min(1, (1 - k) * 4);
  for (let i = 0; i < 3; i++) { const a = w.time * 4 + i * TAU / 3, x = u.x + Math.cos(a) * u.vr * 0.8 + ux * u.vr, y = u.y + Math.sin(a) * u.vr * 0.3 + uy * u.vr; inked(ctx, () => star(ctx, x, y, 9, 4, 0.35, a), '#FFF7C2'); } } };
BFX.chiefRoar = { // his roar: dust rolling out along the floor, short lines of sound all round him
  ground(ctx, f, k) { const e = easeOut(k); ctx.globalAlpha = (1 - k) * 0.6; ctx.strokeStyle = '#E9DDC2'; ctx.lineWidth = 22 * (1 - k) + 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.3 + 0.7 * e), 0, TAU); ctx.stroke(); },
  air(ctx, f, k) { ctx.lineCap = 'round'; const d = f.r * (0.35 + 0.6 * easeOut(k)); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; if (OUTLINES) { ctx.strokeStyle = INK; ctx.lineWidth = 9 * (1 - k) + 2; ctx.beginPath(); ctx.arc(f.x, f.y, d, a - 0.08, a + 0.08); ctx.stroke(); } ctx.strokeStyle = '#FFF4DC'; ctx.lineWidth = 5.5 * (1 - k) + 1; ctx.beginPath(); ctx.arc(f.x, f.y, d, a - 0.08, a + 0.08); ctx.stroke(); } dustPuffs(ctx, f.x, f.y, f.r * 0.7, k, 3, 9); },
};
