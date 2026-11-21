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

// ---------------------------------------------------------------- the Frost Hollow: the glacier hall
// Her dais: a six-sided slab of blue ice with a frosted rim.
export function drawGlacier(ctx, w) {
  const d = w.dais; if (!d) return;
  const hex = (r) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; ctx.lineTo(d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * 1.2); } ctx.closePath(); };
  inked(ctx, () => hex(120), '#A9D8EE');
  ctx.fillStyle = '#C9EAF8'; hex(96); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(d.x - 30, d.y - 40, 40, 16, -0.5, 0, TAU); ctx.fill();
}
// The blizzard: a white veil over the room and snow driving across it.
export function drawBlizzard(ctx, w) {
  const b = w.blizzard || 0, t = w.time;
  ctx.fillStyle = `rgba(235,245,255,${0.2 * b})`; ctx.fillRect(0, 0, w.W, w.H);
  ctx.strokeStyle = `rgba(255,255,255,${0.75 * b})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 90; i++) {
    const sx = hash(i, 1) * (w.W + 400), sy = hash(i, 2) * w.H, sp = 380 + hash(i, 3) * 260;
    const x = ((sx + t * sp) % (w.W + 400)) - 200, y = (sy + t * sp * 0.35) % w.H;
    ctx.moveTo(x, y); ctx.lineTo(x - 22, y - 8);
  }
  ctx.stroke();
}

// ---------------------------------------------------------------- the Ember Deep: Cinder and the pit
// The head: a long horned wedge pointing where it faces, no eyes; the mouth glows while it breathes.
export function drawDrakeHead(ctx, u, w) {
  const r = u.vr, f = flash(u);
  ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(u.facing);
  if (u.invulnT > 0) ctx.globalAlpha = 0.75;
  for (const s of [-1, 1]) inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-r * 0.1, s * r * 0.45); ctx.quadraticCurveTo(-r * 0.7, s * r * 1.05, -r * 1.25, s * r * 0.95); ctx.lineTo(-r * 0.5, s * r * 0.35); ctx.closePath(); }, f ? '#FFFFFF' : '#3E1E18');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(r * 1.3, 0); ctx.quadraticCurveTo(r * 0.9, r * 0.62, -r * 0.2, r * 0.75); ctx.quadraticCurveTo(-r * 0.95, r * 0.55, -r * 0.95, 0); ctx.quadraticCurveTo(-r * 0.95, -r * 0.55, -r * 0.2, -r * 0.75); ctx.quadraticCurveTo(r * 0.9, -r * 0.62, r * 1.3, 0); ctx.closePath(); }, f ? '#FFFFFF' : '#7A3424');
  ctx.fillStyle = f ? '#FFFFFF' : '#9A4A30'; ctx.beginPath(); ctx.ellipse(r * 0.55, 0, r * 0.62, r * 0.36, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5A2018'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-r * (0.15 + i * 0.28), 0); ctx.lineTo(-r * (0.3 + i * 0.28), -r * 0.12); ctx.lineTo(-r * (0.45 + i * 0.28), 0); ctx.lineTo(-r * (0.3 + i * 0.28), r * 0.12); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#2B2230'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(r * 1.08, s * r * 0.14, r * 0.06, 0, TAU); ctx.fill(); }
  if (u.breathing || w.molten) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, r * 1.25, 0, r * (u.breathing ? 0.9 : 0.4), '#FF8A3D', u.breathing ? 0.7 : 0.3); }
  ctx.restore();
}
// A body segment: a round armoured back with a ridge of plates; molten cracks in the last phase. The tail tapers to a
// spiked blade.
export function drawDrakeSegment(ctx, u, w) {
  const r = u.vr, f = flash(u), tail = !!u.tail;
  ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(u.facing);
  if (tail) {
    const sw = (u.lashT > 0 ? Math.sin(w.time * 20) * 0.5 : 0); ctx.rotate(sw);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(r * 0.9, -r * 0.8); ctx.quadraticCurveTo(-r * 0.6, -r * 0.6, -r * 2.1, 0); ctx.quadraticCurveTo(-r * 0.6, r * 0.6, r * 0.9, r * 0.8); ctx.closePath(); }, f ? '#FFFFFF' : '#7A3424');
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-r * 1.7, 0); ctx.lineTo(-r * 2.5, -r * 0.7); ctx.lineTo(-r * 2.9, 0); ctx.lineTo(-r * 2.5, r * 0.7); ctx.closePath(); }, f ? '#FFFFFF' : '#C9B0A0');
  } else {
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r, 0, 0, TAU); }, f ? '#FFFFFF' : '#7A3424');
    ctx.fillStyle = f ? '#FFFFFF' : '#8E4430'; ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.8, r * 0.7, 0, 0, TAU); ctx.fill();
    for (let i = -1; i <= 1; i++) inked(ctx, () => { ctx.beginPath(); ctx.moveTo(i * r * 0.5 + r * 0.22, 0); ctx.lineTo(i * r * 0.5, -r * 0.2); ctx.lineTo(i * r * 0.5 - r * 0.22, 0); ctx.lineTo(i * r * 0.5, r * 0.2); ctx.closePath(); }, '#C9B0A0');
  }
  if (w.molten) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,150,60,${0.55 + 0.25 * Math.sin(w.time * 6 + u.id)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.3); ctx.lineTo(-r * 0.1, r * 0.55); ctx.lineTo(r * 0.4, r * 0.25); ctx.moveTo(-r * 0.4, -r * 0.5); ctx.lineTo(r * 0.2, -r * 0.35); ctx.stroke(); }
  ctx.restore();
}
// The pit's lava pools (glowing, outlined) and its cracks.
export function drawPit(ctx, w) {
  for (const p of w.lava || []) {
    inked(ctx, () => blob(ctx, p.x, p.y, p.r, 7, p.x * 0.05), '#C8401F');
    ctx.fillStyle = '#FF8A3D'; blob(ctx, p.x, p.y, p.r * 0.72, 6, w.time * 0.6 + p.y); ctx.fill();
    ctx.fillStyle = '#FFC85A'; blob(ctx, p.x, p.y, p.r * 0.35, 5, -w.time); ctx.fill();
  }
}
// Over the units: the flame of the scorch (tongues of fire down the cone, each stopped by a pillar or wall) and the
// fireballs coming down out of the dark for the fire call.
export function drawBreath(ctx, w) {
  const dt = w._dt || 0.016, b = w.breath;
  if (b) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const a = b.a + (i / 8 - 0.5) * b.arc, e = clipRay(w, b.x, b.y, a, b.len);
      for (let s = 0.15; s < 1; s += 0.17) {
        const q = (s + b.t * 1.8 + i * 0.13) % 1, L = e * q;
        glowDisc(ctx, b.x + Math.cos(a) * L, b.y + Math.sin(a) * L, 14 + 26 * q, q < 0.4 ? '#FFE08A' : '#FF8A3D', 0.35 * (1 - q * 0.6));
      }
    }
    ctx.restore();
    for (let i = 0; i < 6; i++) { const a = b.a + (hash(i, Math.floor(b.t * 10)) - 0.5) * b.arc, e = clipRay(w, b.x, b.y, a, b.len), q = 0.3 + 0.6 * hash(i + 9, Math.floor(b.t * 10));
      flame(ctx, b.x + Math.cos(a) * e * q, b.y + Math.sin(a) * e * q, 9 + 6 * q); }
  }
  if (w.falling) {
    for (const f of w.falling) f.t += dt;
    w.falling = w.falling.filter((f) => f.t < f.dur);
    const [ux, uy] = view_up();
    for (const f of w.falling) {
      const k = f.t / f.dur; if (k < 0.45) continue; // it shows only in the last part of the fall
      const h = (1 - (k - 0.45) / 0.55) * 420, x = f.x + ux * h, y = f.y + uy * h;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, 40, '#FF8A3D', 0.5); ctx.restore();
      inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); }, '#FF8A3D'); ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
    }
  }
}
function clipRay(w, x, y, a, len) {
  let d = 0;
  for (; d < len; d += 12) { const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    if (px < 0 || py < 0 || px > w.W || py > w.H || w.pillars.some((p) => (px - p.x) ** 2 + (py - p.y) ** 2 < p.r * p.r) || w.walls.some((r) => px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h)) break; }
  return d;
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
