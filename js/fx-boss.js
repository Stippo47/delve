// Lane B (bosses2): how the designed bosses' parts, rooms and moves look. Everything here is PLACEHOLDER art drawn in
// code in the game's matte, outlined, no-eyes style (docs/FX-STYLE.md); docs/ART-NEEDED-bosses.md lists the real art.
// Hooks: a part kind's def.draw(ctx, u, w) (render.js drawUnit), w.arenaDraw (under the units, scenery.js drawArena),
// w.arenaAir (over them, render.js).
import { TAU, clamp, INK } from './util.js';
import { inked, inkLine, glowDisc, flame, blob, upright, hash, rgba, upVec } from './fx.js';
const view_up = () => upVec();

const flash = (u) => u.flashT > 0.06;
const lit = (c, u) => (flash(u) ? '#FFFFFF' : c);

// ---------------------------------------------------------------- the Warren: the war camp
// A war drum seen from above: a wooden rim, a hide skin with a painted red hand, two crossed sticks; it swells when it
// beats (u.beatT counts down from a beat).
export function drawDrum(ctx, u) {
  const b = clamp((u.beatT || 0) / 0.25, 0, 1), r = u.vr * (1 + 0.08 * b);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(u.x, u.y, r, 0, TAU); }, lit('#8A5A34', u));
  inked(ctx, () => { ctx.beginPath(); ctx.arc(u.x, u.y, r * 0.78, 0, TAU); }, lit(u.awake ? '#E8D2A8' : '#CDB994', u));
  ctx.fillStyle = 'rgba(176,52,40,0.85)'; ctx.beginPath(); ctx.arc(u.x, u.y, r * 0.3, 0, TAU); ctx.fill();
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(u.x + Math.cos(a) * r * 0.9, u.y + Math.sin(a) * r * 0.9, 2.2, 0, TAU); ctx.fill(); }
  if (b > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, u.x, u.y, r * 2, '#F2A23A', 0.35 * b); ctx.restore(); }
  const hp = u.hp / u.maxHp;
  if (hp < 0.66) { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(u.x - r * 0.5, u.y - r * 0.2); ctx.lineTo(u.x, u.y + r * 0.1); ctx.lineTo(u.x + r * 0.3, u.y - r * 0.4); ctx.stroke(); }
  if (hp < 0.33) { ctx.beginPath(); ctx.moveTo(u.x - r * 0.2, u.y + r * 0.5); ctx.lineTo(u.x + r * 0.1, u.y + r * 0.05); ctx.stroke(); }
}
// The war camp's floor: tunnel mouths in the side walls (goblins come out of them), the chief's hide-and-bone stage.
export function drawWarcamp(ctx, w) {
  for (const t of w.tunnels || []) {
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.a);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 54, Math.PI, TAU); ctx.closePath(); }, '#6E5038');
    ctx.fillStyle = '#1E1510'; ctx.beginPath(); ctx.arc(0, 0, 40, Math.PI, TAU); ctx.closePath(); ctx.fill();
    if (t.openT > 0) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, -10, 60, '#F2A23A', 0.4 * clamp(t.openT, 0, 1)); }
    ctx.restore();
  }
  const s = w.stage; if (!s) return;
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(s.x, s.y, 110, 150, 0, 0, TAU); }, '#8E6A46');
  ctx.fillStyle = 'rgba(255,230,180,0.12)'; ctx.beginPath(); ctx.ellipse(s.x - 14, s.y - 18, 80, 110, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, x = s.x + Math.cos(a) * 118, y = s.y + Math.sin(a) * 158;
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y - 18); ctx.lineTo(x + 6, y); ctx.closePath(); }, '#EDE4CD'); }
}
// ---------------------------------------------------------------- the Sewers: the Great Ooze and the cistern
// The ooze: one wobbling body (no eyes), darker at the rim, things it has swallowed floating in it, a gloss on top.
// It crouches (u.squash) before a hop and rises up the screen while it's in the air (u.hop; its shadow stays below).
export function drawOoze(ctx, u, w) {
  const [ux, uy] = view_up();
  const h = u.hop || 0, sq = u.squash || 0, x = u.x + ux * h, y = u.y + uy * h, r = u.vr * (1 + 0.12 * sq), t = w.time;
  const melt = w.melting, main = melt ? '#8DB04A' : '#6FAE62', dark = melt ? '#5E7A2A' : '#3F6E3E', light = melt ? '#C9DE6E' : '#A9D47A';
  ctx.save();
  if (u.invulnT > 0) ctx.globalAlpha = 0.7;
  inked(ctx, () => blob(ctx, x, y, r, 9, (u.wob || 0), 1 - 0.18 * sq), flash(u) ? '#FFFFFF' : dark);
  ctx.fillStyle = flash(u) ? '#FFFFFF' : main; blob(ctx, x - r * 0.06, y - r * 0.08, r * 0.84, 8, (u.wob || 0) * 1.3 + 1, 1 - 0.18 * sq); ctx.fill();
  // swallowed things: a bone, a skull-ish lump, a rusty grate bar, drifting slowly round inside
  for (let i = 0; i < 4; i++) {
    const a = t * 0.25 + i * 1.7, d = r * (0.25 + 0.3 * hash(i, u.id)), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    ctx.fillStyle = i % 2 ? 'rgba(237,228,205,0.55)' : 'rgba(43,34,48,0.28)';
    ctx.save(); ctx.translate(px, py); ctx.rotate(a * 1.3); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.13, r * 0.05, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = light; ctx.globalAlpha *= 0.7; ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.3, r * 0.15, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
}
// Something stirs in the canals (phase 3 on): slow dark rings on the water.
export function drawCistern(ctx, w) {
  if (!w.stirring) return;
  for (const c of w.water || []) for (let i = 0; i < 3; i++) {
    const k = ((w.time * 0.35 + i / 3 + c.x * 0.01) % 1), y = (hash(i, Math.floor(w.time * 0.35 + i / 3 + c.x * 0.01)) * 0.8 + 0.1) * w.H;
    ctx.strokeStyle = `rgba(30,40,60,${0.35 * (1 - k)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(c.x + c.w / 2, y, 10 + k * c.w * 0.6, 8 + k * 30, 0, 0, TAU); ctx.stroke();
  }
}
// The Thing's arms: a curl breaking the water at the canal's edge through the tell, then the lash, then back under.
export function drawTentacles(ctx, w) {
  for (const s of w.tentacles || []) {
    const ext = s.t < s.tell ? 0.12 + 0.08 * Math.sin(s.t * 12) : s.t < s.tell + 0.3 ? 1 : Math.max(0, 1 - (s.t - s.tell - 0.3) / 0.4);
    const L = Math.hypot(s.x2 - s.x1, s.y2 - s.y1) * ext, a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1), n = 12, base = s.grab ? 22 : 30;
    if (L < 4) continue;
    const pts = [];
    for (let i = 0; i <= n; i++) { const q = i / n, bend = Math.sin(q * Math.PI) * 0.18 * L * (s.grab ? -1 : 1); pts.push([s.x1 + Math.cos(a) * L * q - Math.sin(a) * bend, s.y1 + Math.sin(a) * L * q + Math.cos(a) * bend, base * (1 - q * 0.75)]); }
    for (const [px, py, r] of pts) inked(ctx, () => { ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); }, '#4A5A6E');
    for (const [px, py, r] of pts) { ctx.fillStyle = '#5E7088'; ctx.beginPath(); ctx.arc(px, py, r * 0.86, 0, TAU); ctx.fill(); }
    for (let i = 2; i < n; i += 2) { const [px, py, r] = pts[i]; ctx.fillStyle = '#C9B8C8'; ctx.beginPath(); ctx.arc(px + Math.cos(a + 1.6) * r * 0.45, py + Math.sin(a + 1.6) * r * 0.45, r * 0.22, 0, TAU); ctx.fill(); }
  }
}

// A thrown spear in flight (out and back), and the chief's cleaver-spin trail.
export function drawSpears(ctx, w) {
  for (const s of w.spears || []) {
    const k = clamp(s.t / s.dur, 0, 1), x = s.x1 + (s.x2 - s.x1) * k, y = s.y1 + (s.y2 - s.y1) * k, a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1) + (s.back ? Math.PI : 0);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(22, 0); }, '#8A5A34', 4);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(36, 0); ctx.lineTo(20, -7); ctx.lineTo(20, 7); ctx.closePath(); }, '#C9D2DE');
    ctx.restore();
  }
}
