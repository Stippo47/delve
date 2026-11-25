// Round 17 (lane water17): how the Water Mage's kit (kits-water.js) looks, in the one effects style (docs/FX-STYLE.md):
// the water palette (dark #2F7FB8, main #5DB7E0, light #BFE9F8, core #F2FBFF); solid water (the beam's ribbon, the jet,
// the drops) inked; light and the domes' skins additive and never outlined; the dome's floor soft-edged and under the
// units; nothing that matters thinner than 3 units; no words; no blur. It fills fx2.js's DRAW2 table ('k2' fx by
// `draw` name). Her shots are the lizardman's balls of water (fx.js 'water').
import { TAU, clamp } from './util.js';
import { inked, inkLine, glowDisc, upVec, hash, easeOut } from './fx.js';
import { DRAW2 } from './fx2.js';

const k01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, k) => a + (b - a) * k;
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const fade = (f, i = 0.12, o = 0.3) => clamp(Math.min(f.t / i, (f.max - f.t) / o, 1), 0, 1);
const live = (u) => u && !u.dead && !u.downed;
const WATER = ['#2F7FB8', '#5DB7E0', '#BFE9F8', '#F2FBFF'];
const rgba = (r, g, b, a) => `rgba(${r},${g},${b},${a})`;
export function installFxWater(api) {
  for (const [k, v] of Object.entries({ bubbleShield: 'water', waterDome: 'water', waterCannon: 'water' })) if (!(k in api.CAST_EL)) api.CAST_EL[k] = v;
}
// a drop of water: inked, round at the back and pointed the way it flies
function drop(ctx, x, y, a, s, col = WATER[1]) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s * 1.6, 0); ctx.quadraticCurveTo(s * 0.2, -s, -s * 0.6, -s * 0.75); ctx.arc(-s * 0.6, 0, s * 0.75, -Math.PI / 2, Math.PI / 2, true); ctx.quadraticCurveTo(s * 0.2, s, s * 1.6, 0); ctx.closePath(); }, col);
  ctx.fillStyle = WATER[3]; ctx.beginPath(); ctx.ellipse(-s * 0.5, -s * 0.3, s * 0.32, s * 0.2, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
// a little round bubble (inked rim, clear middle, a glint)
function bub(ctx, x, y, r, a = 1) {
  if (r < 1) return; ctx.save(); ctx.globalAlpha *= a;
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }, WATER[2], Math.max(1.4, r * 0.35));
  ctx.fillStyle = WATER[3]; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, Math.max(0.8, r * 0.28), 0, TAU); ctx.fill();
  ctx.restore();
}
// a wavy ribbon from (x1, y1) to (x2, y2): the path, `amp` across, phase ph
function ribbon(ctx, x1, y1, x2, y2, amp, ph, waves = 5) {
  const an = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(an), ny = Math.cos(an), L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(8, Math.round(L / 12));
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const k = i / n, o = Math.sin(k * waves * Math.PI + ph) * amp * Math.sin(k * Math.PI); const px = x1 + (x2 - x1) * k + nx * o, py = y1 + (y2 - y1) * k + ny * o; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
}
const handOf = (u, a) => [u.x + Math.cos(a) * (u.r + 8), u.y + Math.sin(a) * (u.r + 8)];

Object.assign(DRAW2, {
  // ---- the Tide beam: a rope of water from her staff to who it is on, foam running down it, a splash where it lands.
  // On a friend it runs paler and clearer (the heal shows as the green crosses rising off them: kits-water.js)
  tideBeam(ctx, f, w, layer) {
    if (layer !== 'air' || !live(f.from) || !f.to || f.to.dead) return;
    const u = f.from, t = f.to, a0 = Math.atan2(t.y - u.y, t.x - u.x), [x1, y1] = handOf(u, a0), reachK = easeOut(k01(f.t / 0.15));
    const x2 = lerp(x1, t.x, reachK), y2 = lerp(y1, t.y, reachK), a = fade(f, 0.05, 0.18), T = w.time, ally = !!f.ally;
    const body = ally ? WATER[2] : WATER[1], wd = ally ? 5.5 : 7;
    ctx.save(); ctx.globalAlpha *= a;
    lit(ctx, () => { ctx.lineCap = 'round'; ctx.strokeStyle = ally ? 'rgba(191,233,248,0.3)' : 'rgba(93,183,224,0.3)'; ctx.lineWidth = wd * 3; ribbon(ctx, x1, y1, x2, y2, 4, T * 9); ctx.stroke(); });
    inkLine(ctx, () => ribbon(ctx, x1, y1, x2, y2, 4, T * 9), body, wd + Math.sin(T * 13) * 0.7);
    ctx.strokeStyle = WATER[3]; ctx.lineWidth = 2; ctx.lineCap = 'round'; ribbon(ctx, x1, y1, x2, y2, 3, T * 9 + 0.6); ctx.stroke();
    // foam: small inked blobs running from her to them
    const an = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(an), ny = Math.cos(an), L = Math.hypot(x2 - x1, y2 - y1);
    for (let i = 0; i < 4; i++) { const k = (T * 1.6 + i / 4) % 1; if (k * L > L - 6) continue; const o = Math.sin(k * 5 * Math.PI + T * 9) * 4 * Math.sin(k * Math.PI);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o, 2.6 + 1.2 * hash(i, 3), 0, TAU); }, WATER[3]); }
    if (reachK >= 1) { // the splash on them: a crown of drops thrown back, re-rolled every 0.12 s
      const st = Math.floor(T / 0.12);
      lit(ctx, () => glowDisc(ctx, x2, y2, 22, ally ? '#DDF6FF' : '#7EC8F0', 0.55));
      for (let i = 0; i < 3; i++) { const b = an + Math.PI + (hash(st, i) - 0.5) * 2.2, q = ((T / 0.12) % 1), d = 6 + 14 * q; ctx.save(); ctx.globalAlpha *= 1 - q; drop(ctx, x2 + Math.cos(b) * d, y2 + Math.sin(b) * d, b, 2.6 + hash(i, st) * 1.4, body); ctx.restore(); }
    }
    ctx.restore();
  },

  // ---- Bubble Shields
  // the bubble round the one inside: a clear skin that wobbles, a bright rim of light, a glint; it shivers where magic hits
  bubble(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !live(u)) return;
    const k = easeOut(k01(f.t / 0.22)), hit = f.hitT ? k01(1 - (w.time - f.hitT) / 0.3) : 0, T = w.time;
    const R = ((u.vr || u.r) + 14) * k * (1 + 0.1 * hit), left = f.B ? k01(f.B.left / Math.max(1, f.B.cap)) : 1;
    const end = f.max - f.t < 1.2 ? 0.5 + 0.5 * Math.sin(f.t * 22) : 1; // (about to burst: it trembles)
    ctx.save();
    ctx.translate(u.x, u.y);
    const sq = 1 + 0.05 * Math.sin(T * 6) * end, sq2 = 1 - 0.05 * Math.sin(T * 6) * end;
    ctx.scale(sq, sq2);
    lit(ctx, () => {
      const g = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R); g.addColorStop(0, rgba(191, 233, 248, 0.04)); g.addColorStop(0.8, rgba(191, 233, 248, 0.16 + 0.1 * hit)); g.addColorStop(1, rgba(242, 251, 255, 0.42 + 0.3 * hit));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(191, 233, 248, 0.5 + 0.35 * left); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R - 1.5, 0, TAU); ctx.stroke();
    });
    // the glint (top left: lit from the left, as the sprites are) and a smaller one opposite
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, R * 0.72, Math.PI * 1.08, Math.PI * 1.42); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(R * 0.5, R * 0.5, 2.2, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // blown from her staff to the friend: a short stream of little bubbles
  bubbleBlow(ctx, f, w, layer) {
    if (layer !== 'air') return; const q = k01(f.t / f.max);
    for (let i = 0; i < 5; i++) { const k = k01(q * 1.5 - i * 0.12); if (k <= 0 || k >= 1) continue; const s = Math.sin(k * Math.PI);
      bub(ctx, lerp(f.x1, f.x2, k) + Math.sin(i * 2 + k * 6) * 6, lerp(f.y1, f.y2, k) + Math.cos(i * 3 + k * 6) * 6, 3 + 3 * s, 1); }
  },
  // the pop: a flash of the skin, then a ring of drops flying out and falling
  bubblePop(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
    if (k < 0.25) lit(ctx, () => { ctx.strokeStyle = rgba(242, 251, 255, 0.9 * (1 - k / 0.25)); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 + 0.3 * k), 0, TAU); ctx.stroke(); glowDisc(ctx, f.x, f.y, f.r * 1.3, '#BFE9F8', 0.5 * (1 - k / 0.25)); });
    const [vx, vy] = upVec();
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.3 * hash(i, 5), d = f.r * (0.8 + 1.3 * e), hop = Math.sin(k * Math.PI) * 14 * hash(i, 7);
      drop(ctx, f.x + Math.cos(b) * d + vx * hop, f.y + Math.sin(b) * d + vy * hop, b, 3 + 1.6 * hash(i, 2) * (1 - k * 0.5)); }
    ctx.restore();
  },

  // ---- the Dome
  // under the units: the floor tinted by the water standing over it, rings moving out across it; over them: the skin (a
  // rim of slow bright arcs, never inked: it is light on water), bubbles rising inside, a ripple where something meets it
  waterDome(ctx, f, w, layer) {
    const a = fade(f, 0.25, 0.35), g0 = easeOut(k01(f.t / 0.3)), r = f.r * (0.35 + 0.65 * g0), T = w.time;
    if (layer === 'ground') {
      ctx.save(); ctx.globalAlpha *= a;
      const g = ctx.createRadialGradient(f.x, f.y, r * 0.2, f.x, f.y, r); g.addColorStop(0, rgba(93, 183, 224, 0.1)); g.addColorStop(0.85, rgba(93, 183, 224, 0.24)); g.addColorStop(1, rgba(93, 183, 224, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.fill();
      ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { const q = (T * 0.35 + i / 3) % 1; ctx.strokeStyle = rgba(191, 233, 248, 0.32 * (1 - q)); ctx.beginPath(); ctx.arc(f.x, f.y, r * (0.15 + 0.8 * q), 0, TAU); ctx.stroke(); }
      ctx.restore(); return;
    }
    lit(ctx, () => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(93, 183, 224, 0.22 * a); ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(f.x, f.y, r - 5, 0, TAU); ctx.stroke();
      ctx.lineWidth = 4.5;
      for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + T * 0.5 * (i % 2 ? 1 : -1); ctx.strokeStyle = rgba(221, 246, 255, (0.5 + 0.25 * Math.sin(T * 3 + i)) * a); ctx.beginPath(); ctx.arc(f.x, f.y, r - 3, b, b + 0.42); ctx.stroke(); }
      for (const h of f.hits || []) { const q = k01((f.t - h.t) / 0.5); ctx.strokeStyle = rgba(242, 251, 255, 0.85 * (1 - q) * a); ctx.lineWidth = 3.2; ctx.beginPath(); ctx.arc(h.x, h.y, 6 + 18 * easeOut(q), 0, TAU); ctx.stroke(); }
    });
    // bubbles drifting up inside it (a handful, each on its own clock)
    const [vx, vy] = upVec();
    for (let i = 0; i < 7; i++) { const ph = (T * 0.45 + hash(i, 11)) % 1, b = hash(i, 4, Math.floor(T * 0.45 + hash(i, 11))) * TAU, rr = r * 0.75 * Math.sqrt(hash(i, 9, Math.floor(T * 0.45 + hash(i, 11))));
      const x = f.x + Math.cos(b) * rr + vx * ph * 30, y = f.y + Math.sin(b) * rr + vy * ph * 30; bub(ctx, x, y, 2.5 + 2.5 * Math.sin(ph * Math.PI), a * Math.sin(ph * Math.PI)); }
  },
  // Dome III: it comes down: the skin falls outward as a ring of drops
  domeFall(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
    ctx.save(); ctx.globalAlpha *= 1 - k;
    for (let i = 0; i < 18; i++) { const b = i / 18 * TAU + 0.2 * hash(i, 1), d = f.r * (0.95 + 0.25 * e), fall = (1 - e) * 26;
      drop(ctx, f.x + Math.cos(b) * d + vx * fall, f.y + Math.sin(b) * d + vy * fall, Math.atan2(-vy, -vx), 3.2 + 1.4 * hash(i, 3)); }
    ctx.restore();
  },

  // ---- the Water Cannon: a thick jet from her staff, a light halo round it, foam chunks streaming down it and spray at
  // its end; it reaches out in the first 0.12 s and thins as it runs out
  waterJet(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !live(u)) return;
    const a = fade(f, 0.08, 0.25), out = easeOut(k01(f.t / 0.12)), A = f.a ?? u.facing, ca = Math.cos(A), sa = Math.sin(A), T = w.time;
    const [x1, y1] = handOf(u, A), L = Math.max(10, (f.len || 300) * out - u.r), x2 = x1 + ca * L, y2 = y1 + sa * L, hw = f.hw * (0.75 + 0.25 * a);
    const nx = -sa, ny = ca;
    const band = (wd, wob) => { ctx.beginPath(); const n = Math.max(6, Math.round(L / 18));
      for (let i = 0; i <= n; i++) { const k = i / n, o = Math.sin(k * 14 - T * 30) * wob; ctx.lineTo(x1 + ca * L * k + nx * (wd * (0.55 + 0.45 * Math.min(1, k * 4)) + o), y1 + sa * L * k + ny * (wd * (0.55 + 0.45 * Math.min(1, k * 4)) + o)); }
      for (let i = n; i >= 0; i--) { const k = i / n, o = Math.sin(k * 14 - T * 30 + 1.3) * wob; ctx.lineTo(x1 + ca * L * k - nx * (wd * (0.55 + 0.45 * Math.min(1, k * 4)) + o), y1 + sa * L * k - ny * (wd * (0.55 + 0.45 * Math.min(1, k * 4)) + o)); }
      ctx.closePath(); };
    ctx.save(); ctx.globalAlpha *= a;
    lit(ctx, () => { ctx.fillStyle = 'rgba(93,183,224,0.28)'; band(hw * 1.35, 3); ctx.fill(); glowDisc(ctx, x2, y2, hw * 2.2, '#7EC8F0', 0.5); });
    inked(ctx, () => band(hw * 0.7, 2.2), WATER[1]);
    ctx.fillStyle = WATER[2]; band(hw * 0.36, 1.5); ctx.fill();
    ctx.fillStyle = WATER[3]; band(hw * 0.12, 1); ctx.fill();
    // foam chunks racing down it
    for (let i = 0; i < 9; i++) { const k = (T * 2.4 + i / 9) % 1, o = (hash(i, 2) - 0.5) * hw * 1.0;
      inked(ctx, () => { ctx.beginPath(); ctx.arc(x1 + ca * L * k + nx * o, y1 + sa * L * k + ny * o, 2.6 + 2.4 * hash(i, 5), 0, TAU); }, WATER[3]); }
    // spray where it ends: drops thrown forward and out, re-rolled every 0.1 s
    const st = Math.floor(T / 0.1), q = (T / 0.1) % 1;
    for (let i = 0; i < 5; i++) { const b = A + (hash(st, i) - 0.5) * 2.4, d = hw * 0.6 + hw * 1.4 * q; ctx.save(); ctx.globalAlpha *= 1 - q; drop(ctx, x2 + Math.cos(b) * d, y2 + Math.sin(b) * d, b, 3 + 1.8 * hash(i, st)); ctx.restore(); }
    ctx.restore();
  },

  // ---- Splashback: water thrown up round her feet as the three balls go
  splashUp(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [vx, vy] = upVec();
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.4, '#BFE9F8', 0.45 * (1 - k / 0.3)));
    ctx.save(); ctx.globalAlpha *= 1 - k;
    lit(ctx, () => { ctx.strokeStyle = 'rgba(221,246,255,0.8)'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (0.6 + 0.6 * e), f.r * (0.6 + 0.6 * e) * 0.8, 0, 0, TAU); ctx.stroke(); });
    for (let i = 0; i < 7; i++) { const b = i / 7 * TAU, d = f.r * (0.5 + 0.7 * e), up = Math.sin(k * Math.PI) * 22 * (0.6 + 0.4 * hash(i, 3)); drop(ctx, f.x + Math.cos(b) * d + vx * up, f.y + Math.sin(b) * d * 0.8 + vy * up, b, 3 + hash(i, 1) * 1.5); }
    ctx.restore();
  },
});
