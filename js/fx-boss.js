// Lane B (bosses2): how the designed bosses' parts, rooms and moves look. Everything here is PLACEHOLDER art drawn in
// code in the game's matte, outlined, no-eyes style (docs/FX-STYLE.md); docs/ART-NEEDED-bosses.md lists the real art.
// Hooks: a part kind's def.draw(ctx, u, w) (render.js drawUnit), w.arenaDraw (under the units, scenery.js drawArena),
// w.arenaAir (over them, render.js).
import { TAU, clamp, INK } from './util.js';
import { inked, inkLine, glowDisc, flame, blob, upright, hash, rgba, upVec } from './fx.js';
const view_up = () => upVec();

const flash = (u) => u.flashT > 0.09; // (only the first frames of a hit: a boss hit all the time read as solid white)
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

// (Cinder is drawn in js/boss-cinder-fx.js: bosses3)

function clipRay(w, x, y, a, len) {
  let d = 0;
  for (; d < len; d += 12) { const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    if (px < 0 || py < 0 || px > w.W || py > w.H || w.pillars.some((p) => (px - p.x) ** 2 + (py - p.y) ** 2 < p.r * p.r) || w.walls.some((r) => px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h)) break; }
  return d;
}
// ---------------------------------------------------------------- the Gilded Spire: the Seraph and the sanctum
// A sun blade: a gold sword seen from above, point outwards along its facing; dark when she has fallen.
export function drawSunBlade(ctx, u, w) {
  const r = u.vr, f = flash(u), dark = u.fallen;
  ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(u.facing);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, r * 2, dark ? '#9B86C9' : '#FFE7A0', 0.35); ctx.restore();
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(r * 1.6, 0); ctx.lineTo(-r * 0.4, -r * 0.3); ctx.lineTo(-r * 0.4, r * 0.3); ctx.closePath(); }, f ? '#FFFFFF' : dark ? '#5A4A7A' : '#F2C14E');
  inked(ctx, () => { ctx.beginPath(); ctx.rect(-r * 0.55, -r * 0.6, r * 0.2, r * 1.2); }, dark ? '#2E2440' : '#C9A44A');
  inked(ctx, () => { ctx.beginPath(); ctx.rect(-r * 1.1, -r * 0.13, r * 0.6, r * 0.26); }, dark ? '#2E2440' : '#C9A44A');
  ctx.fillStyle = dark ? '#9B86C9' : '#FFFBEA'; ctx.beginPath(); ctx.moveTo(r * 1.4, 0); ctx.lineTo(-r * 0.3, -r * 0.08); ctx.lineTo(-r * 0.3, r * 0.08); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// A great sun set into the floor in the middle of the sanctum (it goes dark when she falls).
export function drawSanctum(ctx, w) {
  const s = w.sun; if (!s) return;
  const col = w.fallen ? 'rgba(90,74,122,0.35)' : 'rgba(242,193,78,0.35)';
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(s.x, s.y, 120, 0, TAU); ctx.fill();
  ctx.strokeStyle = w.fallen ? 'rgba(46,36,64,0.5)' : 'rgba(201,164,74,0.6)'; ctx.lineWidth = 4;
  ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.moveTo(s.x + Math.cos(a) * 130, s.y + Math.sin(a) * 130); ctx.lineTo(s.x + Math.cos(a) * (i % 2 ? 175 : 210), s.y + Math.sin(a) * (i % 2 ? 175 : 210)); } ctx.stroke();
  ctx.beginPath(); ctx.arc(s.x, s.y, 120, 0, TAU); ctx.stroke();
}
// The clock hands: shafts of light from her out to their length (stopped by pillars), an inked core and a glow.
export function drawHands(ctx, w) {
  const h = w.hands; if (!h) return;
  const col = h.fallen ? '#9B86C9' : '#FFE7A0';
  for (const a of h.as) {
    const L = clipRay(w, h.x, h.y, a, h.len), ex = h.x + Math.cos(a) * L, ey = h.y + Math.sin(a) * L;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(col, 0.35); ctx.lineCap = 'round'; ctx.lineWidth = 52; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore();
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); }, h.fallen ? '#5A4A7A' : '#FFF4C8', 10);
  }
}

// (the Sand Wurm is drawn in js/boss-wurm-fx.js: bosses3)
// (the Great Engine is drawn in js/boss-engine-fx.js: bosses3)

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
