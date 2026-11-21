// Effects drawing: w.fx (ring, zone, beam, wall, wave, pillar), projectiles of every kind, the looks of the newer
// statuses, and the renderer's own small touches (impact stars, coin sparkles). Everything is drawn in room units
// with the one outline thickness (OUTLINE) where a thing has an outline. Show, don't tell: no words, no bars.
import { INK, TAU, clamp } from './util.js';
import { OUTLINE, view } from './render.js';
import { STYLE } from './parts.js';
import { noteWorld, drawMarks, drawSigGround, drawSigAir, abilityRing, abilityBeam, abilityZone, EL, abilityRingGround, hookGround, abilityZoneAir, soulOrb, dustPuffs } from './fxkit.js';
import { drawPuddle, snowflake } from './puddles.js';

export function easeOut(k) { return 1 - (1 - k) * (1 - k) * (1 - k); }
// a stable pseudo-random number from integers (flicker that doesn't need state)
export function hash(a, b = 0, c = 0) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
export function upright(ctx, x, y, fn) { ctx.save(); ctx.translate(x, y); if (view.rot) ctx.rotate(Math.PI / 2); fn(); ctx.restore(); }
export function upVec() { return view.rot ? [1, 0] : [0, -1]; }
export function inked(ctx, pathFn, fill) {
  ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round';
  pathFn(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = fill; pathFn(); ctx.fill();
}
// a stroke with an ink border: the same path stroked twice
export function inkLine(ctx, pathFn, color, width, cap = 'round') {
  ctx.save(); ctx.lineCap = cap; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = width + OUTLINE * 2; pathFn(); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = width; pathFn(); ctx.stroke();
  ctx.restore();
}
export function flamePath(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 1.9);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r * 1.05, y - r * 0.4, x + r * 0.85, y + r * 0.25);
  ctx.arc(x, y + r * 0.1, r * 0.87, 0.2, Math.PI - 0.2);
  ctx.bezierCurveTo(x - r * 1.05, y - r * 0.4, x - r * 0.5, y - r * 1.1, x, y - r * 1.9); ctx.closePath();
}
export function flame(ctx, x, y, r, outer = '#FF8A3D', inner = '#FFE08A') {
  inked(ctx, () => flamePath(ctx, x, y, r), outer);
  ctx.fillStyle = inner; flamePath(ctx, x, y + r * 0.25, r * 0.5); ctx.fill();
}
export function blob(ctx, x, y, r, n, ph, sq = 1) {
  ctx.beginPath();
  for (let i = 0; i <= n * 2; i++) {
    const a = i / (n * 2) * TAU, rr = r * (1 + 0.08 * Math.sin(a * 3 + ph));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * sq;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
export function star(ctx, x, y, r, n = 4, inner = 0.38, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU - Math.PI / 2, rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath();
}
export function glowDisc(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(0.5, rgba(color, a * 0.45)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
// a jagged line from a to b, its kinks re-rolled every `rate` seconds
export function jag(ctx, x1, y1, x2, y2, t, seed, n = 7, amp = 0.09, rate = 0.06) {
  const L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / (L || 1), ny = (x2 - x1) / (L || 1), f = Math.floor(t / rate);
  ctx.beginPath(); ctx.moveTo(x1, y1);
  for (let i = 1; i < n; i++) { const k = i / n, o = (hash(f, i, seed) - 0.5) * 2 * L * amp * Math.sin(k * Math.PI); ctx.lineTo(x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o); }
  ctx.lineTo(x2, y2);
}
export function bolt(ctx, x1, y1, x2, y2, t, seed, width = 3, color = '#FFF3A0') {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba(color, 0.25); ctx.lineWidth = width * 5; jag(ctx, x1, y1, x2, y2, t, seed); ctx.stroke(); ctx.restore();
  inkLine(ctx, () => jag(ctx, x1, y1, x2, y2, t, seed), color, width);
  ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = width * 0.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; jag(ctx, x1, y1, x2, y2, t, seed); ctx.stroke(); ctx.restore();
}

// fade in quickly, out over the last part
export function life(f, inT = 0.2, outT = 0.35) { return clamp(Math.min(f.t / inT, (f.max - f.t) / outT, 1), 0, 1); }

// ---------------------------------------------------------------- ground effects (under the units)
const ZONE = {
  holy: '#F2C14E', fire: '#E8582A', poison: '#7DB83A', ice: '#9FDDF6', storm: '#5B6C9A', vines: '#4E8A3A', heal: '#8BE07A', sanctuary: '#FFF1B0',
};
export function drawGroundFx(ctx, w) {
  for (const f of w.fx || []) {
    if (f.type === 'zone') { if (!(f.ab || f.smoke || f.kind === 'smoke') || !abilityZone(ctx, f, w.time)) zone(ctx, f, w.time); }
    else if (f.type === 'rift') rift(ctx, f, w.time);
    else if (f.type === 'sig') drawSigGround(ctx, f, w);
    else if (f.type === 'wave' && f.ab === 'shockwave') eruption(ctx, f, 'ground');
    // round 9: these lie under the units
    else if (f.type === 'ring' && f.ab) abilityRingGround(ctx, f);
    else if (f.type === 'beam' && f.ab === 'hook') hookGround(ctx, f, w.time);
    else if (f.type === 'beam' && f.kind === 'heal') beam(ctx, f, w.time);
    else if (f.type === 'wall' && f.kind === 'fire') wall(ctx, f, w.time);
    else if (f.type === 'pop') pop(ctx, f, w.time, 'ground');
  }
  drawMarks(ctx, 0, 'ground');
}
// A small burst where a shot ends (round 9: the Pyromancer's spark, the Plague Doctor's cluster)
function pop(ctx, f, T, layer) {
  const k = clamp(f.t / f.max, 0, 1), e = easeOut(k), seed = Math.round(f.x * 3 + f.y);
  if (f.kind === 'poison') {
    if (layer === 'ground') { drawPuddle(ctx, 'gas', f.x, f.y, f.r * (0.6 + 0.5 * e), T, 1 - k * k, seed); return; }
    const [ux, uy] = upVec();
    ctx.save(); ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + seed, d = f.r * (0.3 + 0.8 * e); inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(b) * d + ux * e * 10, f.y + Math.sin(b) * d + uy * e * 10, 4 * (1 - k) + 1, 0, TAU); }, i % 2 ? '#BCE070' : '#82B23A'); }
    ctx.restore(); return;
  }
  if (layer === 'ground') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, f.r * 1.3, '#FF8A3D', 0.5 * (1 - k)); ctx.restore(); return; }
  ctx.save(); ctx.globalAlpha = 1 - k * k;
  for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + seed, d = f.r * (0.2 + 0.75 * e); upright(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, () => flame(ctx, 0, 0, 6 * (1 - 0.7 * k))); }
  ctx.restore();
}
// Where the next wave comes up (dungeon.js): a dark crack in the floor that opens and swirls, flares as the enemy
// climbs out, then closes. { x, y, r, at (seconds until the enemy appears) }.
function rift(ctx, f, T) {
  const open = easeOut(clamp(f.t / Math.max(0.01, f.at), 0, 1)), shut = clamp((f.max - f.t) / 0.35, 0, 1);
  const r = f.r * open * shut, seed = Math.round(f.x * 3 + f.y * 7);
  if (r < 1) return;
  ctx.save();
  inked(ctx, () => blob(ctx, f.x, f.y, r, 8, seed + T * 2, 0.9), '#1E1724');
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 3; i++) { // swirling arms of purple light
    const a0 = T * 4 + i / 3 * TAU;
    ctx.strokeStyle = i % 2 ? '#9B7BD6' : '#C9A7FF'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.6, a0, a0 + 1.4); ctx.stroke();
  }
  const flare = f.t > f.at ? clamp(1 - (f.t - f.at) / 0.3, 0, 1) : 0;
  if (flare > 0) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, f.r * 2, '#C9A7FF', 0.7 * flare); }
  ctx.restore();
}
function zone(ctx, f, T) {
  const a = life(f, 0.25, 0.45), grow = 0.55 + 0.45 * easeOut(clamp(f.t / 0.3, 0, 1)), r = f.r * grow, x = f.x, y = f.y;
  const seed = Math.round(x * 7 + y * 13);
  ctx.save(); ctx.globalAlpha = a;
  switch (f.kind) {
    case 'fire': case 'poison': { // burning ground and poison clouds are puddles (puddles.js: the player's chosen style)
      ctx.globalAlpha = 1; drawPuddle(ctx, f.kind === 'fire' ? 'fire' : 'gas', x, y, r, T, a, seed);
      break;
    }
    case 'smoke': { ctx.globalAlpha = 1; drawPuddle(ctx, 'smoke', x, y, r, T, a, seed); break; }
    case 'snow': { // round 9: Frost Arrow's and Frost Nova's lingering cold: a rime on the floor, snowflakes drifting down
      ctx.globalAlpha = 1; const la = clamp(Math.min(f.t / 0.2, (f.max - f.t) / 0.8), 0, 1);
      drawPuddle(ctx, 'frost', x, y, f.r * 0.85, T, la, seed);
      break;
    }
    case 'summon': { // round 9: Call Wolf's summoning ring: a ring of leaves and light drawn on the floor, then the wolf steps out
      const k = clamp(f.t / f.max, 0, 1), draw = easeOut(clamp(k / 0.5, 0, 1)), out = clamp((k - 0.6) / 0.4, 0, 1), R = f.r * 1.2;
      ctx.globalAlpha = 1 - out;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, R * 1.3, EL.nature[2], 0.35 + 0.3 * Math.sin(k * Math.PI)); ctx.restore();
      inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + TAU * draw); }, EL.nature[2], 3);
      inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y, R * 0.68, Math.PI / 2, Math.PI / 2 - TAU * draw, true); }, EL.nature[1], 2.4);
      for (let i = 0; i < 6; i++) { const b = i / 6 * TAU - Math.PI / 2 + k * 1.5; if (i / 6 > draw) continue; leaf(ctx, x + Math.cos(b) * R * 0.84, y + Math.sin(b) * R * 0.84, b + Math.PI / 2, 6); }
      if (k > 0.58 && k < 0.85) { const q = (k - 0.58) / 0.27; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, R * 1.6, '#E4F5C8', 0.8 * (1 - q)); ctx.restore();
        for (let i = 0; i < 8; i++) { const b = i / 8 * TAU, d = R * (0.4 + 0.9 * q); leaf(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, b + q * 3, 7 * (1 - q) + 2); } }
      break;
    }
    case 'ice': {
      inked(ctx, () => blob(ctx, x, y, r, 9, seed, 1), '#BFE9F8');
      ctx.fillStyle = '#E4F7FD'; blob(ctx, x, y, r * 0.7, 6, seed + 2, 1); ctx.fill();
      const n = 7;
      for (let i = 0; i < n; i++) {
        const an = i / n * TAU + seed, d = r * 0.55, s = 8 + 4 * hash(i, seed);
        ctx.save(); ctx.translate(x + Math.cos(an) * d, y + Math.sin(an) * d); ctx.rotate(an);
        inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s * 1.4, 0); ctx.lineTo(0, -s * 0.45); ctx.lineTo(-s * 0.6, 0); ctx.lineTo(0, s * 0.45); ctx.closePath(); }, '#CFF3FF');
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(s * 1.2, 0); ctx.lineTo(0, -s * 0.35); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'storm': {
      ctx.fillStyle = 'rgba(43,34,48,0.28)'; blob(ctx, x, y, r, 7, T * 0.5 + seed, 0.95); ctx.fill();
      ctx.fillStyle = 'rgba(70,82,120,0.25)'; blob(ctx, x + 4, y - 3, r * 0.7, 6, -T * 0.7, 0.95); ctx.fill();
      // rain streaks and the odd strike on the ground
      ctx.strokeStyle = 'rgba(200,220,255,0.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const [ux, uy] = upVec();
      for (let i = 0; i < 12; i++) { const ph = (T * 2.2 + hash(i, seed)) % 1, an = hash(seed, i) * TAU, rr = r * 0.85 * Math.sqrt(hash(i, seed, 7));
        const px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr; const l = 10 * (1 - ph);
        ctx.beginPath(); ctx.moveTo(px + ux * l, py + uy * l); ctx.lineTo(px + ux * (l - 5), py + uy * (l - 5)); ctx.stroke(); }
      const f8 = Math.floor(T / 0.12);
      if (hash(f8, seed) < 0.35) { const an = hash(f8, seed, 1) * TAU, rr = r * 0.6 * hash(f8, seed, 2), px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr;
        bolt(ctx, px + ux * 46, py + uy * 46, px, py, T, f8, 2.2); glowDisc(ctx, px, py, 18, '#FFF3A0', 0.6); }
      break;
    }
    case 'vines': {
      // round 9 redo (the flat spiral of lines was disliked): churned earth, then thick thorned tendrils whipping up out of
      // it all over the patch, each curling over at the top; at the end they wither back down, never just vanish
      if (f.ab === 'roll') break;
      ctx.globalAlpha = 1; drawPuddle(ctx, 'earth', x, y, r * 0.8, T, a, seed); // the tendrils: zoneAir
      break;
    }
    case 'holy': { // Consecrate: a warm glow of holy ground, motes rising, and (round 9) no cracks; a faint ring at its edge
      const pulse = 0.85 + 0.15 * Math.sin(T * 4 + seed);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r * 1.05, EL.holy[1], 0.26 * pulse);
      ctx.strokeStyle = rgba(EL.holy[2], 0.3 * pulse); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r * 0.98, 0, TAU); ctx.stroke();
      ctx.restore();
      motes(ctx, f, x, y, r, T, a, seed, false);
      break;
    }
    case 'sanctuary': { // a fence of light posts round the place she blessed (gold stakes with light rising), a soft wash inside
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r, EL.holy[2], 0.14); ctx.restore();
      const n = Math.max(8, Math.round(r / 16)), [ux, uy] = upVec();
      for (let i = 0; i < n; i++) { const an = i / n * TAU + seed * 0.1, px = x + Math.cos(an) * r * 0.92, py = y + Math.sin(an) * r * 0.92, h = 30 + 6 * Math.sin(T * 3 + i);
        const g = ctx.createLinearGradient(px, py, px + ux * h, py + uy * h); g.addColorStop(0, rgba(EL.holy[1], 0.9)); g.addColorStop(1, rgba(EL.holy[2], 0));
        ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + ux * h, py + uy * h); ctx.stroke();
        // round 9: a faint ring round each star point
        ctx.save(); ctx.globalAlpha *= 0.5 + 0.2 * Math.sin(T * 3 + i); ctx.strokeStyle = rgba(EL.holy[2], 0.7); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, 11 + Math.sin(T * 3 + i) * 1.5, 0, TAU); ctx.stroke(); ctx.restore();
        inked(ctx, () => star(ctx, px, py, 6.5, 4, 0.4, 0), EL.holy[2]); }
      motes(ctx, f, x, y, r, T, a, seed, false);
      break;
    }
    case 'heal': motes(ctx, f, x, y, r, T, a, seed, true); break;
  }
  ctx.restore();
}
// Things standing up out of a zone, drawn over the ground bodies (the puddle layer goes down after the ground fx)
function zoneAir(ctx, f, T) {
  const a = life(f, 0.25, 0.45), r = f.r * (0.55 + 0.45 * easeOut(clamp(f.t / 0.3, 0, 1))), x = f.x, y = f.y, seed = Math.round(x * 7 + y * 13);
  ctx.save(); ctx.globalAlpha = a;
  if (f.kind === 'vines') {
      const n = Math.max(6, Math.round(r / 12)), grow = easeOut(clamp(f.t / 0.35, 0, 1)), wither = clamp((f.max - f.t) / 0.5, 0, 1), [ux, uy] = upVec();
      for (let i = 0; i < n; i++) {
        const b = hash(seed, i) * TAU, d = r * 0.8 * Math.sqrt(hash(i, seed, 1)), bx = x + Math.cos(b) * d, by = y + Math.sin(b) * d;
        const g = clamp(grow * 1.3 - hash(i, seed, 2) * 0.3, 0, 1) * wither; if (g <= 0) continue;
        const H = (22 + 14 * hash(seed, i, 3)) * g, sw = hash(i, seed, 4) > 0.5 ? 1 : -1, wav = Math.sin(T * 3 + i) * 3;
        const tip = [bx + ux * H + (view.rot ? 0 : sw * 9 + wav), by + uy * H + (view.rot ? sw * 9 + wav : 0)];
        const path = () => { ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + ux * H * 0.6 - (view.rot ? 0 : sw * 6), by + uy * H * 0.6 - (view.rot ? sw * 6 : 0), tip[0], tip[1]); };
        const col = wither < 1 ? '#7A6A3A' : i % 2 ? '#5E9E3E' : '#4A8433';
        inkLine(ctx, path, col, 6 * g + 1);
        inked(ctx, () => { ctx.beginPath(); ctx.arc(tip[0], tip[1], 3.4 * g + 0.5, 0, TAU); }, col); // the curled tip
        if (g > 0.6) { leaf(ctx, bx + ux * H * 0.45 + (view.rot ? 0 : -sw * 5), by + uy * H * 0.45 + (view.rot ? -sw * 5 : 0), -sw * 0.8 - Math.PI / 2 * (view.rot ? 0 : 1), 6.5 * wither);
          inked(ctx, () => star(ctx, bx + ux * H * 0.7, by + uy * H * 0.7, 3, 3, 0.3, i), '#3E6E2A'); }
      }
  } else if (f.kind === 'snow') {
    const la = clamp(Math.min(f.t / 0.2, (f.max - f.t) / 0.8), 0, 1);
      const [ux, uy] = upVec();
      for (let i = 0; i < Math.max(6, Math.round(f.r / 9)); i++) { const ph = (T * 0.5 + hash(i, seed)) % 1, b = hash(seed, i) * TAU, d = f.r * Math.sqrt(hash(i, seed, 3));
        ctx.globalAlpha = la * Math.sin(ph * Math.PI); snowflake(ctx, x + Math.cos(b) * d + ux * (1 - ph) * 26 + Math.sin(ph * 5 + i) * 4, y + Math.sin(b) * d + uy * (1 - ph) * 26, 3 + 1.5 * hash(seed, i, 5), ph * 3 + i); }
  }
  ctx.restore();
}
function motes(ctx, f, x, y, r, T, a, seed, cross) {
  const [ux, uy] = upVec();
  for (let i = 0, n = Math.max(7, Math.round(r / 9)); i < n; i++) {
    const ph = (T * 0.6 + hash(i, seed)) % 1, an = hash(seed, i, 4) * TAU, rr = r * 0.8 * Math.sqrt(hash(i, seed, 9));
    const px = x + Math.cos(an) * rr + ux * ph * 30, py = y + Math.sin(an) * rr + uy * ph * 30, al = Math.sin(ph * Math.PI);
    ctx.globalAlpha = a * al;
    if (cross) upright(ctx, px, py, () => inked(ctx, () => { ctx.beginPath(); ctx.rect(-2, -6, 4, 12); ctx.rect(-6, -2, 12, 4); }, '#C8F5B0'));
    else inked(ctx, () => star(ctx, px, py, 4.5, 4, 0.35), '#FFFBEA');
  }
  ctx.globalAlpha = a;
}
export function leaf(ctx, x, y, a, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.8, s, 0); ctx.quadraticCurveTo(0, s * 0.8, -s, 0); ctx.closePath(); }, '#7CC25A');
  ctx.restore();
}

// ---------------------------------------------------------------- effects over the units
export function drawAirFx(ctx, w) {
  for (const f of w.fx || []) {
    if (f.type === 'ring') { if (!f.ab || !abilityRing(ctx, f)) ring(ctx, f); }
    else if (f.type === 'beam') { if (f.kind === 'heal' || f.over) continue; if (!f.ab || !abilityBeam(ctx, f, w.time)) beam(ctx, f, w.time); } // heal: on the ground; over: render.js
    else if (f.type === 'wall') { if (f.kind !== 'fire') wall(ctx, f, w.time); }
    else if (f.type === 'pop') pop(ctx, f, w.time, 'air');
    else if (f.type === 'soulOrb') soulOrb(ctx, f);
    else if (f.type === 'cure') cureFx(ctx, f, w.time);
    else if (f.type === 'zone' && (f.ab === 'rejuvenate' || f.ab === 'cure')) abilityZoneAir(ctx, f, w.time);
    else if (f.type === 'zone' && (f.kind === 'snow' || (f.kind === 'vines' && f.ab !== 'roll'))) zoneAir(ctx, f, w.time);
    else if (f.type === 'wave') { if (f.ab === 'shockwave') eruption(ctx, f, 'air'); else if (f.kind === 'note') noteCone(ctx, f, w.time); else wave(ctx, f); }
    else if (f.type === 'pillar') pillar(ctx, f, w.time);
    else if (f.type === 'aura') aura(ctx, f, w.time);
    else if (f.type === 'hex') hexMark(ctx, f, w.time);
    else if (f.type === 'zone' && f.kind === 'storm') stormCloud(ctx, f, w.time);
    else if (f.type === 'sig') drawSigAir(ctx, f, w);
  }
}
// Radiance's burst (sim.js, round 8): a warm glow round the radiant unit for its few seconds, its edge marking how far
// it reaches (whoever stands inside turns radiant), slow rays turning in it.
// Round 9: no hard ring: the light pours out of the radiant one in slow turning rays, and its reach is shown by a ring
// of little stars twinkling at the edge (whoever stands inside turns radiant).
function aura(ctx, f, T) {
  const a = life(f, 0.2, 0.5), r = f.r * (0.85 + 0.15 * easeOut(clamp(f.t / 0.3, 0, 1)));
  ctx.save();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, r, '#FFE48A', 0.38 * a);
  for (let i = 0; i < 10; i++) { const an = T * 0.5 + i / 10 * TAU, w2 = 0.09 + 0.04 * Math.sin(T * 2 + i);
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 0.95); g.addColorStop(0, rgba('#FFF4C0', 0.45 * a)); g.addColorStop(1, rgba('#FFF4C0', 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, r * 0.95, an - w2, an + w2); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  const n = Math.round(r / 9);
  for (let i = 0; i < n; i++) { const an = i / n * TAU - T * 0.3, tw = 0.5 + 0.5 * Math.sin(T * 5 + i * 1.7);
    ctx.globalAlpha = a * (0.35 + 0.65 * tw); inked(ctx, () => star(ctx, f.x + Math.cos(an) * r, f.y + Math.sin(an) * r, 2.5 + 3 * tw, 4, 0.3, 0), '#FFF4C0'); }
  ctx.restore();
}
// Cure (round 9 redo): his flask lobbed onto the ally, a splash of clean bubbles, and the statuses it draws out (their
// colours) streaming back into his hands (his next attack throws them).
function cureFx(ctx, f, T) {
  const k = clamp(f.t / f.max, 0, 1), [ux, uy] = upVec(), seed = Math.round(f.x1 + f.y2);
  const fly = clamp(k / 0.3, 0, 1);
  if (fly < 1) { const h = Math.sin(fly * Math.PI) * 36, x = f.x1 + (f.x2 - f.x1) * fly + ux * h, y = f.y1 + (f.y2 - f.y1) * fly + uy * h;
    ctx.save(); ctx.translate(x, y); ctx.rotate(fly * 9); ctx.scale(1.3, 1.3);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 2, 6.5, 0, TAU); ctx.rect(-2.6, -9, 5.2, 7); }, '#E8F0EA');
    ctx.fillStyle = '#7FD6C8'; ctx.beginPath(); ctx.arc(0, 3, 5, 0, TAU); ctx.fill(); ctx.restore(); return; }
  const g = clamp((k - 0.3) / 0.7, 0, 1), e = easeOut(g);
  if (g < 0.25) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x2, f.y2, 50, '#DFFFF6', 0.8 * (1 - g / 0.25)); ctx.restore(); }
  ctx.save(); ctx.globalAlpha = 1 - g;
  for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + g * 3, d = 10 + 30 * e, x = f.x2 + Math.cos(b) * d + ux * e * 22, y = f.y2 + Math.sin(b) * d + uy * e * 22;
    inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 4.5 * (1 - 0.5 * g), 0, TAU); }, i % 2 ? '#BFE9F8' : '#E6FFF4'); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x - 1.4, y - 1.4, 1.4, 0, TAU); ctx.fill(); }
  ctx.restore();
  const cols = f.cols && f.cols.length ? f.cols : ['#BFE9F8'];
  for (let i = 0; i < cols.length * 3; i++) { const q = clamp(g * 1.4 - i * 0.07, 0, 1); if (q <= 0 || q >= 1) continue;
    const side = i % 2 ? 1 : -1, a = Math.atan2(f.y1 - f.y2, f.x1 - f.x2), L = Math.hypot(f.x1 - f.x2, f.y1 - f.y2), bow = Math.sin(q * Math.PI) * L * 0.2 * side;
    const x = f.x2 + (f.x1 - f.x2) * q - Math.sin(a) * bow, y = f.y2 + (f.y1 - f.y2) * q + Math.cos(a) * bow;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, 12, cols[i % cols.length], 0.6); ctx.restore();
    inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 4 * (1 - 0.4 * q), 0, TAU); }, cols[i % cols.length]); }
}
// Cursed's burst: 'arm' a purple ring closing onto the unit (it's hexed now), 'fire' a purple flare as the hex turns
// its action round, 'turn' a swirl on a summon that changed sides.
function hexMark(ctx, f, T) {
  const k = clamp(f.t / f.max, 0, 1), a = 1 - k * k;
  ctx.save(); ctx.globalAlpha = a;
  if (f.kind === 'arm') {
    const r = f.r * (2.2 - 1.2 * easeOut(k));
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); }, '#B07ADC', 3.2);
    for (let i = 0; i < 6; i++) { const an = i / 6 * TAU - T * 2; inked(ctx, () => star(ctx, f.x + Math.cos(an) * r, f.y + Math.sin(an) * r, 4, 4, 0.4, an), '#E6D2F6'); }
  } else {
    const r = f.r * (0.6 + 1.6 * easeOut(k));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, r * 1.2, '#9A5CC8', 0.6 * a); ctx.restore();
    for (let i = 0; i < 3; i++) { const an = (f.kind === 'turn' ? T * 6 : 0) + i / 3 * TAU;
      inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, r * (0.6 + 0.2 * i), an, an + 1.6); }, i % 2 ? '#E6D2F6' : '#9A5CC8', 3 * (1 - k) + 1.2); }
  }
  ctx.restore();
}
function ring(ctx, f) {
  const k = clamp(f.t / f.max, 0, 1), r = f.r * easeOut(k), wd = 10 * (1 - k) + 2, col = f.color || '#FFFFFF';
  ctx.save();
  if (k < 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, f.r * 0.9, col, 0.35 * (1 - k / 0.3)); ctx.restore(); }
  ctx.globalAlpha = 1 - k * k;
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(1, r), 0, TAU); }, col, wd);
  ctx.restore();
}
// A branching bolt drawn as one shape (round 9: "each arm of lightning should merge with main branch having 1 outline.
// Base of these arms should also come directly from the main chain"): the main jag and its arms are built first, the
// arms starting on the main jag's own corners; then every line gets its ink, then every line its colour, then the core.
function boltTree(ctx, x1, y1, x2, y2, T, seed, width, arms, color = '#FFF3A0') {
  const L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / (L || 1), ny = (x2 - x1) / (L || 1), f = Math.floor(T / 0.06), n = 8, amp = 0.09;
  const main = [[x1, y1]];
  for (let i = 1; i < n; i++) { const k = i / n, o = (hash(f, i, seed) - 0.5) * 2 * L * amp * Math.sin(k * Math.PI); main.push([x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o]); }
  main.push([x2, y2]);
  const lines = [[main, width]], an0 = Math.atan2(y2 - y1, x2 - x1);
  for (let b = 0; b < arms; b++) { const j = 2 + Math.floor(hash(f, b, seed + 3) * (n - 3)), p = main[j], an = an0 + (hash(b, f, seed) < 0.5 ? -1 : 1) * (0.5 + 0.5 * hash(f, b, 7)), al = L * (0.18 + 0.14 * hash(b, seed, f));
    const pts = [p]; for (let i = 1; i <= 3; i++) { const k = i / 3, o = (hash(f, b, i + 11) - 0.5) * al * 0.3; pts.push([p[0] + Math.cos(an) * al * k - Math.sin(an) * o, p[1] + Math.sin(an) * al * k + Math.cos(an) * o]); }
    lines.push([pts, width * 0.55]); }
  const path = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(color, 0.22); for (const [pts, wd] of lines) { ctx.lineWidth = wd * 5; path(pts); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle = INK; for (const [pts, wd] of lines) { ctx.lineWidth = wd + OUTLINE * 2; path(pts); ctx.stroke(); }
  ctx.strokeStyle = color; for (const [pts, wd] of lines) { ctx.lineWidth = wd; path(pts); ctx.stroke(); }
  ctx.strokeStyle = '#FFFFFF'; for (const [pts, wd] of lines) { ctx.lineWidth = wd * 0.4; path(pts); ctx.stroke(); }
  ctx.restore();
}
export function drawBeam(ctx, f, T) { beam(ctx, f, T); }
function beam(ctx, f, T) {
  const a = f.from ? clamp(Math.min(f.t / 0.08, (f.max - f.t) / 0.25), 0, 1) : life(f, 0.08, 0.2), { x1, y1, x2, y2 } = f, seed = Math.round(x1 + y2);
  ctx.save(); ctx.globalAlpha = a;
  if (f.kind === 'lightning') {
    const big = f.ab ? 1.5 : f.small ? 0.8 : 1.1;
    boltTree(ctx, x1, y1, x2, y2, T, seed, 3.6 * big, f.small ? 1 : 2);
    const f6 = Math.floor(T / 0.06);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x2, y2, 32 * big, '#FFF3A0', 0.8); ctx.restore();
    inked(ctx, () => star(ctx, x2, y2, 12 * big * (0.8 + 0.2 * Math.sin(T * 40)), 4, 0.3, f6), '#FFFBEA');
  } else if (f.kind === 'drain') {
    // a dark red ribbon, with blobs of life flowing back to the caster (x1, y1). Round 9: held steady (no blinking),
    // and thin tendrils from the target on to those round it (f.thin)
    const th = f.thin ? 0.5 : 1;
    const an = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(an), ny = Math.cos(an);
    const path = (ph, amp) => { ctx.beginPath(); for (let i = 0; i <= 20; i++) { const k = i / 20, o = Math.sin(k * 9 + ph) * amp * Math.sin(k * Math.PI); const px = x1 + (x2 - x1) * k + nx * o, py = y1 + (y2 - y1) * k + ny * o; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } };
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(214,72,90,0.22)'; ctx.lineWidth = 16 * th; ctx.lineCap = 'round'; path(T * 4, 8 * th); ctx.stroke(); ctx.restore();
    inkLine(ctx, () => path(T * 4, 9 * th), '#8E3B5B', 5.5 * th);
    ctx.strokeStyle = 'rgba(255,138,122,0.85)'; ctx.lineWidth = 2.2 * th; path(T * 4 + 2, 6 * th); ctx.stroke();
    for (let i = 0; i < (f.thin ? 2 : 4); i++) { const k = 1 - ((T * 0.9 + i / 4) % 1), o = Math.sin(k * 9 + T * 4) * 9 * th * Math.sin(k * Math.PI);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o, 4.6 * th + 0.6, 0, TAU); }, '#E0604B'); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x2, y2, 24 * th, '#E0604B', 0.4); ctx.restore();
  } else if (f.kind === 'ray') {
    // round 10: an elemental spirit's ray to the friend it lends its element: a thin wavering line in its colour
    const c = f.col || '#FFF1B0', an = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(an), ny = Math.cos(an);
    const path = (ph, amp) => { ctx.beginPath(); for (let i = 0; i <= 16; i++) { const k = i / 16, o = Math.sin(k * 7 + ph) * amp * Math.sin(k * Math.PI); const px = x1 + (x2 - x1) * k + nx * o, py = y1 + (y2 - y1) * k + ny * o; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } };
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.35; ctx.strokeStyle = c; ctx.lineWidth = 12; ctx.lineCap = 'round'; path(T * 5, 5); ctx.stroke(); ctx.restore();
    inkLine(ctx, () => path(T * 5, 5), c, 3.6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x2, y2, 18, c, 0.45); ctx.restore();
  } else if (f.kind === 'heal') {
    // round 9: the mending ray is a plain straight beam lying under the units: a soft light and a bright core line
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,240,170,0.3)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,225,0.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  } else { // holy: a straight shaft of light
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,225,140,0.3)'; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }, '#F2C14E', 11 + Math.sin(T * 30) * 1.2);
    ctx.save(); ctx.strokeStyle = '#FFFBEA'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x2, y2, 26, '#FFE7A0', 0.85); ctx.restore();
  }
  ctx.restore();
}
function wall(ctx, f, T) {
  const a = life(f, 0.2, 0.4), L = Math.hypot(f.x2 - f.x1, f.y2 - f.y1), rise = easeOut(clamp(f.t / 0.3, 0, 1)), seed = Math.round(f.x1 * 3 + f.y1);
  ctx.save(); ctx.globalAlpha = a;
  if (f.kind === 'fire') {
    // round 9: on the ground, under the units; the flames staggered on either side of the line in two rows, varied in
    // size and timing, and drawn back to front so the ones in front sit over the ones behind
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,138,61,0.35)'; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.restore();
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); }, '#E8582A', 13);
    ctx.save(); ctx.strokeStyle = '#FFC85A'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.restore();
    const n = Math.max(4, Math.round(L / 13)), an = Math.atan2(f.y2 - f.y1, f.x2 - f.x1), nx = -Math.sin(an), ny = Math.cos(an), fl = [];
    for (let i = 0; i <= n; i++) { const k = (i + (hash(i, seed, 1) - 0.5) * 0.6) / n, side = (i % 2 ? 1 : -1) * (3 + 6 * hash(seed, i)), ph = hash(i, seed, 2) * TAU;
      const g = clamp(rise * 1.4 - hash(i, seed, 3) * 0.4, 0, 1), sz = (9 + 8 * hash(i, seed)) * (0.72 + 0.28 * Math.sin(T * (8 + 4 * hash(seed, i, 4)) + ph)) * g;
      const x = f.x1 + (f.x2 - f.x1) * clamp(k, 0, 1) + nx * side, y = f.y1 + (f.y2 - f.y1) * clamp(k, 0, 1) + ny * side;
      fl.push([view.rot ? -x : y, x, y, sz, Math.sin(T * 6 + ph) * 0.12]); }
    fl.sort((p, q) => p[0] - q[0]);
    for (const [, x, y, sz, sway] of fl) if (sz > 0.5) upright(ctx, x, y, () => { ctx.rotate(sway); flame(ctx, 0, 0, sz); });
  } else { // ice: a row of crystal blocks
    const n = Math.max(2, Math.round(L / 22));
    for (let i = 0; i <= n; i++) { const k = i / n, s = (13 + 3 * hash(i, seed)) * rise;
      ctx.save(); ctx.translate(f.x1 + (f.x2 - f.x1) * k, f.y1 + (f.y2 - f.y1) * k); ctx.rotate(hash(seed, i) * TAU);
      const p = () => { ctx.beginPath(); for (let j = 0; j < 6; j++) { const an = j / 6 * TAU, rr = s * (j % 2 ? 0.85 : 1.08); j ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); };
      inked(ctx, p, '#BFE9F8');
      ctx.fillStyle = '#EAF9FF'; ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.15); ctx.lineTo(-s * 0.15, -s * 0.65); ctx.lineTo(s * 0.1, -s * 0.4); ctx.lineTo(-s * 0.35, s * 0.05); ctx.closePath(); ctx.fill();
      ctx.restore(); }
  }
  ctx.restore();
}
function wave(ctx, f) {
  // a crescent of dust and air rolling outward, its front edge bright, a few stones kicked up behind it
  const k = clamp(f.t / f.max, 0, 1), r = 16 + f.r * easeOut(k), half = 0.7, th = 12 + 18 * (1 - k), seed = Math.round(f.x * 3 + f.y);
  ctx.save(); ctx.globalAlpha = 1 - k * k;
  const g = ctx.createRadialGradient(f.x, f.y, Math.max(0, r - th), f.x, f.y, r);
  g.addColorStop(0, 'rgba(233,221,194,0)'); g.addColorStop(0.75, 'rgba(233,221,194,0.8)'); g.addColorStop(1, 'rgba(255,248,230,0.95)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, f.a - half, f.a + half); ctx.arc(f.x, f.y, Math.max(0, r - th), f.a + half, f.a - half, true); ctx.closePath(); ctx.fill();
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, r, f.a - half * 0.92, f.a + half * 0.92); }, '#FFF8E6', 3);
  for (let i = 0; i < 5; i++) { const an = f.a + (hash(i, seed) - 0.5) * half * 1.7, rr = r - th * (0.4 + 0.8 * hash(seed, i)), hop = Math.sin(clamp(k * 3 - hash(i, seed, 2), 0, 1) * Math.PI) * 6;
    inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(an) * rr, f.y + Math.sin(an) * rr - hop, 3 * (1 - k) + 1, 0, TAU); }, '#A99C8B'); }
  ctx.restore();
}
// Shockwave: the floor erupts in a crescent of rock spikes across the way the wave runs, dust thrown up round them
function eruption(ctx, f, layer) {
  const k = clamp(f.t / f.max, 0, 1), seed = Math.round(f.x * 3 + f.y), nx = -Math.sin(f.a), ny = Math.cos(f.a);
  const up = k < 0.25 ? easeOut(k / 0.25) : 1 - 0.5 * clamp((k - 0.5) / 0.5, 0, 1);
  ctx.save();
  if (layer === 'ground') {
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = 'rgba(70,56,44,0.35)'; blob(ctx, f.x, f.y, f.r * 0.9, 7, seed, 0.8); ctx.fill();
    ctx.restore(); return;
  }
  // round 9 (the spikes were disliked): the floor heaves up in a crescent of earth (a raised, inked ridge), throws up
  // rubble and dust, and settles
  ctx.globalAlpha = 1 - clamp((k - 0.55) / 0.45, 0, 1);
  const half = 0.85, R0 = f.r * 0.55, th = 14 * up + 2;
  const ridge = (rr, t2) => { ctx.beginPath(); ctx.arc(f.x - Math.cos(f.a) * R0, f.y - Math.sin(f.a) * R0, rr + t2, f.a - half, f.a + half); ctx.arc(f.x - Math.cos(f.a) * R0, f.y - Math.sin(f.a) * R0, Math.max(1, rr - t2), f.a + half, f.a - half, true); ctx.closePath(); };
  inked(ctx, () => ridge(R0 + 8, th * 0.5), '#8A7258');
  ctx.fillStyle = '#B9A68A'; ridge(R0 + 8 + th * 0.12, th * 0.22); ctx.fill();
  for (let i = -3; i <= 3; i++) { const b = f.a + i * half / 3.4, rr = R0 + 8 + th * 0.4, h = hash(i + 5, seed), cx = f.x - Math.cos(f.a) * R0 + Math.cos(b) * rr, cy = f.y - Math.sin(f.a) * R0 + Math.sin(b) * rr;
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(cx, cy, (5 + 4 * h) * up + 1, (3.5 + 3 * h) * up + 1, b, 0, TAU); }, i % 2 ? '#6E5A46' : '#A08A6E'); }
  dustPuffs(ctx, f.x, f.y, f.r * 0.8, k, seed);
  const e = easeOut(k), [ux, uy] = upVec();
  for (let i = 0; i < 6; i++) { const b = f.a + (hash(seed, i) - 0.5) * 2.4, d = 14 + 30 * e, hop = Math.sin(k * Math.PI) * 18 * hash(i, seed);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(b) * d + ux * hop, f.y + Math.sin(b) * d + uy * hop, 4 * (1 - k) + 1.2, 0, TAU); }, i % 2 ? '#E9DDC2' : '#A99C8B'); }
  ctx.restore();
}
// Lullaby: a soft cone of drifting notes rolling out in front of the bard
// Lullaby (round 9: the light cone underneath was disliked): three soft waves of notes drifting out across the cone,
// each note swaying and leaving a little pale wisp, a few sleepy sparkles; nothing lit on the floor.
function noteCone(ctx, f, T) {
  const k = clamp(f.t / f.max, 0, 1), arc = f.arc || 1.6, seed = Math.round(f.x + f.y * 3);
  ctx.save();
  for (let wv = 0; wv < 3; wv++) { const q = clamp(k * 1.5 - wv * 0.2, 0, 1); if (q <= 0 || q >= 1) continue;
    const e = easeOut(q), n = 4 + wv;
    for (let i = 0; i < n; i++) {
      const b = f.a + ((i + 0.5) / n - 0.5) * arc * 0.9 + Math.sin(T * 3 + i + wv) * 0.06, d = f.r * (0.2 + 0.8 * e), x = f.x + Math.cos(b) * d, y = f.y + Math.sin(b) * d;
      ctx.globalAlpha = Math.sin(q * Math.PI);
      ctx.fillStyle = 'rgba(215,205,255,0.45)'; ctx.beginPath(); ctx.ellipse(x - Math.cos(b) * 10, y - Math.sin(b) * 10, 9, 5, b, 0, TAU); ctx.fill();
      upright(ctx, x, y, () => { ctx.rotate(Math.sin(T * 5 + i) * 0.4); inked(ctx, () => noteShape(ctx, 0.9), (i + wv) % 2 ? '#C9C2FF' : '#E6E0FF'); });
      if ((i + wv) % 3 === 0) inked(ctx, () => star(ctx, x + Math.cos(b + 1.2) * 12, y + Math.sin(b + 1.2) * 12, 3, 4, 0.35, T * 2), '#FFF0B0');
    }
  }
  ctx.restore();
}
function noteShape(ctx, s) {
  ctx.beginPath(); ctx.ellipse(-2 * s, 5 * s, 5 * s, 3.8 * s, -0.4, 0, TAU); ctx.rect(1.4 * s, -10 * s, 3 * s, 15 * s);
  ctx.moveTo(4.4 * s, -10 * s); ctx.quadraticCurveTo(12 * s, -7 * s, 9 * s, 0); ctx.quadraticCurveTo(9 * s, -5 * s, 4.4 * s, -5 * s); ctx.closePath();
}
// Storm Cloud: the cloud itself, over the patch it soaks (the rain and strikes are on the ground, zone())
function stormCloud(ctx, f, T) {
  const a = life(f, 0.3, 0.5), [ux, uy] = upVec(), cx = f.x + ux * 56, cy = f.y + uy * 56, R = f.r * 0.28, seed = Math.round(f.x + f.y);
  ctx.save(); ctx.globalAlpha = 0.6 * a;
  const lumps = [];
  for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + T * 0.3 + seed; lumps.push([cx + Math.cos(b) * R * 1.3, cy + Math.sin(b) * R * 0.9, R * (0.85 + 0.12 * Math.sin(T * 1.6 + i))]); }
  lumps.push([cx, cy, R * 1.15]);
  ctx.fillStyle = INK; for (const [x, y, r] of lumps) { ctx.beginPath(); ctx.arc(x, y, r + OUTLINE, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#5B6C9A'; for (const [x, y, r] of lumps) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#7E8DB8'; for (const [x, y, r] of lumps) { ctx.beginPath(); ctx.arc(x + ux * r * 0.25 - r * 0.15, y + uy * r * 0.25 - r * 0.15, r * 0.55, 0, TAU); ctx.fill(); }
  const f8 = Math.floor(T / 0.12);
  if (hash(f8, seed) < 0.3) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, cx, cy, R * 2, '#FFF3A0', 0.35); }
  ctx.restore();
}
function pillar(ctx, f, T) {
  const k = clamp(f.t / f.max, 0, 1), a = k < 0.12 ? 1 : 1 - (k - 0.12) / 0.88, [ux, uy] = upVec(), H = 260;
  ctx.save();
  if (f.kind === 'lightning') {
    const big = f.ab ? 1.4 : 1;
    if (k < 0.35) { ctx.globalAlpha = 1 - k / 0.35; bolt(ctx, f.x + ux * H, f.y + uy * H, f.x, f.y, T, Math.round(f.x), 6 * big); bolt(ctx, f.x + ux * H * 0.6 + uy * 30, f.y + uy * H * 0.6 - ux * 30, f.x, f.y, T, Math.round(f.y), 3 * big); }
    ctx.globalAlpha = a; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, f.r * 1.8 * big, '#FFF3A0', 0.9 * a); ctx.restore();
    if (k < 0.3) inked(ctx, () => star(ctx, f.x, f.y, f.r * 0.9 * big * (1 - k / 0.3) + 4, 6, 0.32, 0.2), '#FFFBEA');
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = 'rgba(43,34,48,0.35)'; blob(ctx, f.x, f.y, f.r * 0.6, 7, f.x, 1); ctx.fill();
  } else if (f.kind === 'drain') { // Raise Dead: the floor splits, dark light wells up, bone and spirit thrown out
    const e = easeOut(k), seed = Math.round(f.x * 3 + f.y);
    // round 9: "too coloured. More of an unsaturated cold grey"
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(40,42,48,0.5)'; blob(ctx, f.x, f.y, f.r * 1.3, 7, seed, 0.85); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, f.r * 2.2, '#A8B0BA', 0.55 * a); ctx.restore();
    for (let i = 0; i < 6; i++) { const ph = clamp(k * 1.4 - i * 0.06, 0, 1), b = i / 6 * TAU + seed, d = f.r * 0.5 + 10 * ph;
      inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(b) * d + ux * ph * 60, f.y + Math.sin(b) * d + uy * ph * 60, 6 * (1 - ph) + 1.5, 0, TAU); }, i % 2 ? '#D8DEE4' : '#A8B0BA'); }
    for (let i = 0; i < 5; i++) { const b = hash(seed, i) * TAU, d = 8 + 40 * e, hop = Math.sin(k * Math.PI) * 20;
      ctx.save(); ctx.translate(f.x + Math.cos(b) * d + ux * hop, f.y + Math.sin(b) * d + uy * hop); ctx.rotate(b + k * 7);
      inked(ctx, () => { ctx.beginPath(); ctx.rect(-5, -1.6, 10, 3.2); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.moveTo(sx * 5 + 2, sy * 2); ctx.arc(sx * 5, sy * 2, 2, 0, TAU); } }, '#EDE4CD'); ctx.restore(); }
  } else { // a shaft of light from above, seen from overhead: it leans up the screen; its foot is a rounded pool
    ctx.globalAlpha = a;
    const smite = f.ab === 'smite', col = f.kind === 'fire' ? '#FF9A3D' : '#FFE7A0';
    upright(ctx, f.x, f.y, () => {
      const g = ctx.createLinearGradient(0, 0, 0, -H);
      g.addColorStop(0, rgba(col, 0.75)); g.addColorStop(1, rgba(col, 0));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
      const wd = f.r * (0.8 + 0.15 * Math.sin(T * 20)) * (smite ? 1.25 : 1);
      // round 8: the shaft's foot is rounded (an ellipse on the floor), not cut off flat
      ctx.beginPath(); ctx.moveTo(wd, 0); ctx.lineTo(wd * 0.7, -H); ctx.lineTo(-wd * 0.7, -H); ctx.lineTo(-wd, 0); ctx.arc(0, 0, wd, Math.PI, 0, true); ctx.closePath(); ctx.fill(); // round 9: a full half circle
      ctx.restore();
    });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, f.r * 1.4, '#FFE7A0', 0.85 * a); ctx.restore();
    if (smite && k < 0.45) { const q = 1 - k / 0.45; for (let i = 0; i < 8; i++) { const b = i / 8 * TAU; ctx.save(); ctx.globalAlpha = q; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + Math.cos(b) * f.r * 0.6, f.y + Math.sin(b) * f.r * 0.6); ctx.lineTo(f.x + Math.cos(b) * f.r * (0.9 + 1.2 * (1 - q)), f.y + Math.sin(b) * f.r * (0.9 + 1.2 * (1 - q))); }, '#FFFBEA', 3.5); ctx.restore(); }
      inked(ctx, () => star(ctx, f.x, f.y, f.r * 0.8 * q + 3, 4, 0.3, 0.4), '#FFFBEA'); }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- projectiles
// Round 8: every shot bigger, with a trail; ability shots in their own shape (FX-STYLE.md sizes).
const BOLT_COL = { pyromancer: '#FF9A3D', frost: '#9FE3FF', storm: '#FFE66B', necromancer: '#B48CFF', bard: '#FFD45A', druid: '#9BE36B' };
export function drawProjectile(ctx, p, T) {
  const ang = Math.atan2(p.vy, p.vx), sp = Math.hypot(p.vx, p.vy);
  // a lobbed thing flies in an arc, lifted up the screen in mid-flight, its shadow on the floor
  let lx = 0, ly = 0;
  if (p.noHit && sp < 700) {
    if (p._life0 == null) p._life0 = p.life;
    const q = 1 - clamp(p.life / (p._life0 || 1), 0, 1), [ux, uy] = upVec(), h = Math.sin(q * Math.PI) * Math.min(80, sp * p._life0 * 0.22);
    lx = ux * h; ly = uy * h;
    ctx.fillStyle = 'rgba(43,34,48,0.22)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 6, 0, 0, TAU); ctx.fill();
  }
  ctx.save(); ctx.translate(p.x + lx, p.y + ly);
  const ab = p.ab;
  switch (p.kind) {
    case 'icicle': case 'shard': {
      ctx.rotate(ang);
      if (ab === 'frostArrow') { frostArrow(ctx, sp, T); break; }
      const L = ab === 'iceShard' ? (p.big ? 2.9 : 2.2) : p.kind === 'shard' ? 1.5 : 1.15;
      trail(ctx, sp, 26 * L, 5 * L, '#BFE9F8');
      if (ab === 'iceShard') frostMotes(ctx, T, 12 * L, 6 * L, p.x); // round 9: particle trails
      if (ab) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 14 * L, '#DDF6FF', 0.55); ctx.restore(); }
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(12 * L, 0); ctx.lineTo(-8 * L, -3.8 * L); ctx.lineTo(-11 * L, 0); ctx.lineTo(-8 * L, 3.8 * L); ctx.closePath(); }, '#BFE9F8');
      ctx.fillStyle = '#F2FCFF'; ctx.beginPath(); ctx.moveTo(11 * L, 0); ctx.lineTo(-8 * L, -3.2 * L); ctx.lineTo(-6 * L, 0); ctx.closePath(); ctx.fill();
      break;
    }
    case 'bolt': {
      const col = p.color || (p.owner && (BOLT_COL[p.owner.kind] || (STYLE[p.owner.kind] || {}).glow)) || '#C9A7FF';
      const s = ab ? 1.4 : 1.25;
      ctx.rotate(ang); trail(ctx, sp, 36 * s, 7 * s, col);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 20 * s, col, 0.6); ctx.restore();
      inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 7.5 * s, 0, TAU); }, col);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(1.2 * s, -1.2 * s, 3 * s, 0, TAU); ctx.fill();
      break;
    }
    case 'fireball': {
      const s = ab === 'fireball' ? 1.55 : p.big ? 1.4 : 1.15;
      ctx.rotate(ang);
      // a smoke wake, then the fire's own trail: round 9, tongues of flame streaming back off it, embers falling away
      for (let i = 1; i <= 4; i++) { const d = i * 12 * s, w2 = (6 + i * 2.2) * s; ctx.fillStyle = `rgba(70,58,58,${0.3 - i * 0.06})`; ctx.beginPath(); ctx.arc(-d - 10 * s, Math.sin(T * 12 + i) * 4, w2, 0, TAU); ctx.fill(); }
      trail(ctx, sp, 46 * s, 11 * s, '#FF8A3D');
      for (let i = 0; i < 5; i++) { const ph = (T * 3.2 + i / 5) % 1, d = (8 + ph * 36) * s, o = Math.sin(T * 14 + i * 2.1) * 5 * s * ph;
        ctx.save(); ctx.translate(-d, o); ctx.rotate(Math.PI / 2); ctx.globalAlpha = 1 - ph; flame(ctx, 0, 0, (7 - 4 * ph) * s, i % 2 ? '#FF8A3D' : '#E8582A', '#FFE08A'); ctx.restore(); }
      for (let i = 0; i < 4; i++) { const ph = (T * 2.4 + i / 4 + 0.13) % 1; ctx.fillStyle = `rgba(255,200,90,${1 - ph})`; ctx.beginPath(); ctx.arc(-(14 + ph * 50) * s, Math.sin(i * 3.1 + T * 5) * 10 * s * ph, 1.8 * s, 0, TAU); ctx.fill(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 28 * s, '#FF9A3D', 0.6); ctx.restore();
      const wob = Math.sin(T * 30) * 0.6;
      inked(ctx, () => blob(ctx, 0, 0, (10 + wob) * s, 6, T * 9, 1), '#E8582A');
      ctx.fillStyle = '#FFB347'; blob(ctx, 1.5 * s, 0, 6.5 * s, 5, -T * 11, 1); ctx.fill();
      ctx.fillStyle = '#FFF0B0'; ctx.beginPath(); ctx.arc(2.5 * s, -1 * s, 3 * s, 0, TAU); ctx.fill();
      break;
    }
    case 'dagger': { // round 9: a better knife: a long leaf blade with a bright edge, a curved guard, a wrapped grip, a pommel
      const s = ab ? 1.6 : p.r >= 10 ? 1.8 : 1.45;
      ctx.rotate(ang); trail(ctx, sp, 26 * s, 3.4 * s, '#EEF3F8');
      ctx.scale(s, s);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(17, 0); ctx.quadraticCurveTo(8, -4.6, 1, -3.2); ctx.lineTo(1, 3.2); ctx.quadraticCurveTo(8, 4.6, 17, 0); ctx.closePath(); }, '#C9D2DE');
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(1, -6.5); ctx.quadraticCurveTo(-1.5, 0, 1, 6.5); ctx.lineTo(-1.2, 6); ctx.quadraticCurveTo(-3.6, 0, -1.2, -6); ctx.closePath(); }, '#B48A3A');
      inked(ctx, () => { ctx.beginPath(); ctx.rect(-9, -1.9, 8, 3.8); }, '#5A3A2A');
      inked(ctx, () => { ctx.beginPath(); ctx.arc(-10.5, 0, 2.4, 0, TAU); }, '#B48A3A');
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(16, -0.2); ctx.quadraticCurveTo(8, -3.6, 2, -2.4); ctx.lineTo(2, -0.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(43,34,48,0.5)'; ctx.lineWidth = 0.8; for (const x of [-7, -4.5, -2]) { ctx.beginPath(); ctx.moveTo(x, -1.9); ctx.lineTo(x + 1, 1.9); ctx.stroke(); }
      break;
    }
    case 'vial': {
      ctx.rotate(T * 12 + p.x * 0.01); const s = ab ? 1.7 : 1.45; ctx.scale(s, s);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 2, 6.5, 0, TAU); ctx.rect(-2.6, -9, 5.2, 7); }, '#E8F0EA');
      ctx.fillStyle = p.color || '#8FCB3A'; ctx.beginPath(); ctx.arc(0, 3, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8A5A3A'; ctx.fillRect(-3, -11, 6, 3.5);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(-2, 0, 1.6, 0, TAU); ctx.fill();
      break;
    }
    case 'thorn': {
      ctx.rotate(ang); trail(ctx, sp, 24, 4, '#A9D47A'); ctx.scale(1.6, 1.6);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(13, 0); ctx.quadraticCurveTo(0, -5, -9, -3.5); ctx.lineTo(-7, 0); ctx.lineTo(-9, 3.5); ctx.quadraticCurveTo(0, 2, 13, 0); ctx.closePath(); }, '#6FA046');
      ctx.fillStyle = '#A9D47A'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.quadraticCurveTo(0, -4, -7, -2.5); ctx.lineTo(-5, -0.5); ctx.closePath(); ctx.fill();
      break;
    }
    case 'note': {
      ctx.restore(); ctx.save();
      const [ux, uy] = upVec(), b = Math.sin(T * 14 + p.x * 0.05) * 5;
      ctx.translate(p.x + ux * b, p.y + uy * b);
      ctx.save(); ctx.rotate(ang); trail(ctx, sp, 26, 5, '#FFD45A'); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 20, '#FFD45A', 0.5); ctx.restore();
      if (view.rot) ctx.rotate(Math.PI / 2);
      ctx.rotate(Math.sin(T * 9) * 0.2);
      inked(ctx, () => noteShape(ctx, 1.4), '#FFD45A');
      break;
    }
    case 'bone': {
      if (ab === 'boneSpear') { ctx.rotate(ang); boneLance(ctx, sp, T, p.tier || 1); break; }
      if (p.necro) { ctx.rotate(ang); necroDart(ctx, sp, T, p.r / 9); break; }
      const s = p.big ? 2.2 : 1.45;
      ctx.save(); ctx.rotate(ang); trail(ctx, sp, 24 * s, 4 * s, p.owner && p.owner.kind === 'necromancer' ? '#B48CFF' : '#EDE4CD'); ctx.restore();
      ctx.rotate(T * 16 + p.y * 0.01); ctx.scale(s, s);
      inked(ctx, () => { ctx.beginPath(); ctx.rect(-8, -2, 16, 4); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.moveTo(sx * 9 + 3.2, sy * 2.6); ctx.arc(sx * 9, sy * 2.6, 3.2, 0, TAU); } }, '#EDE4CD');
      break;
    }
    case 'water': {
      ctx.rotate(ang); trail(ctx, sp, 30, 6, '#7EC8F0'); ctx.scale(1.5, 1.5);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.quadraticCurveTo(-2, -7, 5, -5); ctx.arc(5, 0, 5, -Math.PI / 2, Math.PI / 2); ctx.quadraticCurveTo(-2, 7, -11, 0); ctx.closePath(); }, '#5DB7E0');
      ctx.fillStyle = '#E6F7FF'; ctx.beginPath(); ctx.ellipse(5, -2, 2.4, 1.4, 0, 0, TAU); ctx.fill();
      break;
    }
    case 'spark': { // round 9: the Pyromancer's spark: a small flame-shaped bolt with an ember wake
      ctx.rotate(ang); trail(ctx, sp, 30, 6, '#FF8A3D');
      for (let i = 0; i < 3; i++) { const ph = (T * 4 + i / 3) % 1; ctx.fillStyle = `rgba(255,200,90,${1 - ph})`; ctx.beginPath(); ctx.arc(-6 - ph * 26, Math.sin(i * 2.7 + T * 9) * 5 * ph, 2, 0, TAU); ctx.fill(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 20, '#FF9A3D', 0.55); ctx.restore();
      ctx.rotate(-Math.PI / 2); flame(ctx, 0, 6, 7.5 + Math.sin(T * 30) * 0.8, '#FF8A3D', '#FFF0B0');
      break;
    }
    case 'frostbolt': { // round 9: the Frost Mage's snow bolt: a packed snowball with a frost trail and flakes
      ctx.rotate(ang); trail(ctx, sp, 34, 8, '#DDF6FF'); frostMotes(ctx, T, 14, 7, p.x);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 20, '#BFE9F8', 0.5); ctx.restore();
      inked(ctx, () => blob(ctx, 0, 0, 8.5, 6, p.x * 0.1, 1), '#E8F8FF');
      ctx.fillStyle = '#BFE9F8'; ctx.beginPath(); ctx.arc(-2, 2, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(2, -2.5, 2.4, 0, TAU); ctx.fill();
      break;
    }
    case 'orb': { // round 9: the Cleric's three small slow orbs of light
      ctx.rotate(ang); trail(ctx, sp, 22, 4, '#FFF1B0');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 14, '#FFE7A0', 0.65); ctx.restore();
      inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 4.6, 0, TAU); }, '#FFF1B0');
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0.8, -0.8, 2, 0, TAU); ctx.fill();
      break;
    }
    case 'cluster': { // round 9: the Plague Doctor's bubbling cluster of poison, growing as it slows
      const r = p.r, seed = Math.round(p._seed || (p._seed = p.x * 7 + p.y));
      const bl = []; for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + T * 3, d = r * 0.6; bl.push([Math.cos(b) * d, Math.sin(b) * d, r * (0.55 + 0.15 * Math.sin(T * 9 + i * 2))]); } bl.push([0, 0, r * 0.75]);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, r * 2.2, '#9BCB3C', 0.45); ctx.restore();
      ctx.fillStyle = INK; ctx.beginPath(); for (const [x, y, rr] of bl) { ctx.moveTo(x + rr + OUTLINE, y); ctx.arc(x, y, rr + OUTLINE, 0, TAU); } ctx.fill();
      ctx.fillStyle = '#82B23A'; ctx.beginPath(); for (const [x, y, rr] of bl) { ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, TAU); } ctx.fill();
      ctx.fillStyle = '#BCE070'; ctx.beginPath(); for (const [x, y, rr] of bl) { ctx.moveTo(x - rr * 0.2 + rr * 0.45, y - rr * 0.25); ctx.arc(x - rr * 0.2, y - rr * 0.25, rr * 0.45, 0, TAU); } ctx.fill();
      ctx.fillStyle = '#FFFFFF'; for (const [x, y, rr] of bl) { ctx.beginPath(); ctx.arc(x - rr * 0.35, y - rr * 0.4, Math.max(0.8, rr * 0.18), 0, TAU); ctx.fill(); }
      if (p.cured) p.cured.forEach((k, i) => { const b = T * 5 + i / p.cured.length * TAU; ctx.fillStyle = ({ burn: '#FF7A2F', chill: '#7FD6F5', wet: '#5DB7E0', shock: '#FFE66B', stagger: '#E9DDC2', radiance: '#FFE48A', curse: '#9A5CC8', poison: '#9BCB3C' })[k] || '#FFFFFF';
        ctx.beginPath(); ctx.arc(Math.cos(b) * r * 1.3, Math.sin(b) * r * 1.3, 2.6, 0, TAU); ctx.fill(); });
      void seed;
      break;
    }
    case 'zeus': { // round 9: Zeus Bolt: a thrown thunderbolt, a zigzag of light with a white core
      ctx.rotate(ang); trail(ctx, sp, 50, 9, '#FFE66B');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 30, '#FFF3A0', 0.7); ctx.restore();
      const z = () => { ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(4, -6); ctx.lineTo(6, -1.5); ctx.lineTo(-10, -5); ctx.lineTo(-20, 0); ctx.lineTo(-4, 6); ctx.lineTo(-6, 1.5); ctx.lineTo(10, 5); ctx.closePath(); };
      inked(ctx, z, '#FFE66B'); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(4, -3); ctx.lineTo(-14, 0); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill();
      if (Math.floor(T / 0.05) % 3 === 0) bolt(ctx, -10, 0, -38, (hash(Math.floor(T / 0.05), 3) - 0.5) * 20, T, 5, 1.6);
      break;
    }
    default: { // arrow, fireArrow
      ctx.rotate(ang);
      const fire = p.kind === 'fireArrow';
      trail(ctx, sp, 34, 3.2, fire ? '#FF9A3D' : '#FFFFFF');
      ctx.scale(1.3, 1.3);
      if (fire) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 12, 0, 16, '#FF9A3D', 0.65); ctx.restore(); }
      inked(ctx, () => { roundRect(ctx, -17, -1.7, 28, 3.4, 1.7); }, fire ? '#FF8A3D' : '#C99A6A');
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-22, -5); ctx.lineTo(-12, -2); ctx.lineTo(-12, 2); ctx.lineTo(-22, 5); ctx.closePath(); }, '#F1E8DA');
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(9, -5); ctx.lineTo(9, 5); ctx.closePath(); }, fire ? '#FFD45A' : '#DCE0E6');
      if (fire) { ctx.restore(); ctx.save(); upright(ctx, p.x + lx + Math.cos(ang) * 16, p.y + ly + Math.sin(ang) * 16, () => flame(ctx, 0, 0, 7 + Math.sin(T * 30) * 1)); }
    }
  }
  ctx.restore();
}
// The Frost Arrow (Archer): an arrow with a big ice head, frost streaming off behind it
function frostArrow(ctx, sp, T) {
  trail(ctx, sp, 60, 9, '#BFE9F8');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 14, 0, 24, '#DDF6FF', 0.6); ctx.restore();
  for (let i = 0; i < 4; i++) { const d = 14 + ((T * 90 + i * 13) % 52); ctx.fillStyle = `rgba(242,252,255,${0.9 - d / 70})`; star(ctx, -d, Math.sin(i * 2.3 + T * 8) * 6, 3, 4, 0.4, d); ctx.fill(); }
  ctx.scale(1.35, 1.35);
  inked(ctx, () => { roundRect(ctx, -25, -1.7, 32, 3.4, 1.7); }, '#9FB7C8'); // round 9: a slightly longer shaft
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-30, -5); ctx.lineTo(-20, -2); ctx.lineTo(-20, 2); ctx.lineTo(-30, 5); ctx.closePath(); }, '#F2FCFF');
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(8, -7); ctx.lineTo(3, 0); ctx.lineTo(8, 7); ctx.closePath(); }, '#BFE9F8');
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(8, -5.5); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill();
}
// frost motes streaming off behind a cold shot (its own frame, +x forward)
function frostMotes(ctx, T, len, spread, seed) {
  for (let i = 0; i < 5; i++) { const ph = (T * 3 + i / 5 + seed * 0.001) % 1, d = len * 0.4 + ph * len * 2.4;
    ctx.fillStyle = `rgba(242,252,255,${(1 - ph) * 0.95})`; star(ctx, -d, Math.sin(i * 2.3 + T * 8) * spread * ph, 2.6 * (1 - ph * 0.5), 4, 0.4, d * 0.1); ctx.fill(); }
}
// The Necromancer's dart (round 9): the green flame from his hand, wrapped round a small bone, shrinking as it speeds up
function necroDart(ctx, sp, T, s) {
  s = clamp(s, 0.45, 1.2);
  trail(ctx, sp, 34 * s, 7 * s, '#A8F060');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 22 * s, '#A8F060', 0.55); ctx.restore();
  ctx.save(); ctx.rotate(-Math.PI / 2); flame(ctx, 0, 8 * s, 9 * s * (1 + 0.08 * Math.sin(T * 30)), '#6FCF3A', '#E8FFC8'); ctx.restore();
  ctx.save(); ctx.scale(s, s); inked(ctx, () => { ctx.beginPath(); ctx.rect(-7, -1.6, 14, 3.2); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.moveTo(sx * 7 + 2.6, sy * 2); ctx.arc(sx * 7, sy * 2, 2.6, 0, TAU); } }, '#EDE4CD'); ctx.restore();
}
// The Bone Spear (round 9: "I don't like the sprite"): a spine of linked vertebrae ending in a long curved fang, soul
// fire flaring off the back, a violet wake
function boneLance(ctx, sp, T, tier) {
  const s = tier >= 3 ? 1.3 : 1.1;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(-110 * s, 0, 0, 0); g.addColorStop(0, 'rgba(155,123,214,0)'); g.addColorStop(1, 'rgba(155,123,214,0.7)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-110 * s, 0); ctx.lineTo(-24 * s, -10 * s); ctx.lineTo(0, -6 * s); ctx.lineTo(0, 6 * s); ctx.lineTo(-24 * s, 10 * s); ctx.closePath(); ctx.fill();
  glowDisc(ctx, 20 * s, 0, 26 * s, '#9B7BD6', 0.45);
  ctx.restore();
  ctx.save(); ctx.rotate(Math.PI / 2); for (let i = 0; i < 3; i++) flame(ctx, (i - 1) * 4 * s, 30 * s + Math.sin(T * 20 + i) * 2, (6 - Math.abs(i - 1) * 1.5) * s, '#9B7BD6', '#E2D8FF'); ctx.restore();
  ctx.scale(s, s);
  // the spine: vertebrae, each a rounded block with little side spurs, joined in a row
  for (let i = 0; i < 6; i++) { const x = -28 + i * 7.2;
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(x, 0, 3.6, 4.2, 0, 0, TAU); ctx.moveTo(x - 1, -3.5); ctx.lineTo(x + 1.5, -7); ctx.lineTo(x + 2.5, -3); ctx.moveTo(x - 1, 3.5); ctx.lineTo(x + 1.5, 7); ctx.lineTo(x + 2.5, 3); }, i % 2 ? '#E2D8C0' : '#EDE4CD'); }
  // the fang: long, curved, serrated on its inside edge
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(14, -5); ctx.quadraticCurveTo(30, -5, 40, 2); ctx.lineTo(34, 1.5); ctx.lineTo(31, 4); ctx.lineTo(27, 3); ctx.lineTo(23, 5.5); ctx.lineTo(19, 4.5); ctx.lineTo(14, 5.5); ctx.closePath(); }, '#F4EEDD');
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(16, -3.5); ctx.quadraticCurveTo(29, -3.5, 37, 1); ctx.lineTo(30, -0.5); ctx.lineTo(16, -1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#B9AD94'; ctx.fillRect(12, -5, 3, 10.5);
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
// a fading streak behind a flying thing (in its own frame, +x forward)
function trail(ctx, sp, len, wd, col) {
  const L = Math.min(len, sp * 0.08 + 8);
  const g = ctx.createLinearGradient(-L, 0, 0, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.7));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -wd); ctx.lineTo(0, wd); ctx.closePath(); ctx.fill();
}

// ---------------------------------------------------------------- status looks (after the unit is drawn)
export function drawStatusFx(ctx, u, T) {
  if (u.downed) return;
  const st = u.st || {}, [ux, uy] = upVec(), vr = u.vr;
  if (u.rootT > 0 || (u._rootFade || 0) > 0) { // vines wound round the feet, over the body's edge; round 9: they wither away
    if (u.rootT > 0) u._rootFade = 1; else u._rootFade = Math.max(0, u._rootFade - 0.06);
    const g = clamp((u._rootSeen = (u._rootSeen || 0) + 1) / 8, 0, 1) * (u.rootT > 0 ? 1 : u._rootFade);
    ctx.save(); ctx.globalAlpha = u.rootT > 0 ? 1 : u._rootFade;
    for (let i = 0; i < 4; i++) {
      const a0 = i / 4 * TAU + u.id, rr = vr * (0.95 + 0.12 * Math.sin(i * 2.1));
      inkLine(ctx, () => { ctx.beginPath(); ctx.arc(u.x, u.y, rr, a0, a0 + 1.3 * g); }, u.rootT > 0 ? (i % 2 ? '#5E9E3E' : '#4A8433') : '#7A6A3A', 3.4);
      if (g >= 0.6) leaf(ctx, u.x + Math.cos(a0 + 1.3 * g) * rr, u.y + Math.sin(a0 + 1.3 * g) * rr, a0 + 1.3 * g + Math.PI / 2, 5 * g);
    }
    ctx.restore();
  } else u._rootSeen = 0;
  if ((st.wet || 0) > 10) { // drips falling from the body
    const n = st.wet > 60 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const ph = (T * 1.6 + i / n + u.id * 0.37) % 1, an = (i * 2.4 + u.id) % TAU, rr = vr * 0.7;
      const px = u.x + Math.cos(an) * rr - ux * ph * 14, py = u.y + Math.sin(an) * rr - uy * ph * 14;
      ctx.globalAlpha = 1 - ph;
      upright(ctx, px, py, () => inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -4.5); ctx.quadraticCurveTo(3.2, 0, 2.8, 1.6); ctx.arc(0, 1.6, 2.8, 0, Math.PI); ctx.quadraticCurveTo(-3.2, 0, 0, -4.5); ctx.closePath(); }, '#7EC8F0'));
    }
    ctx.globalAlpha = 1;
  }
  if ((st.burn || 0) > 4) { // burning (round 9: animated: "burn looks worse with flames static"): each lick is born on the
    // body, climbs and sways as it flickers, shrinks away, and comes back somewhere else; more and taller as it builds
    const f = clamp(st.burn / 100, 0, 1), n = 2 + Math.round(4 * f);
    for (let i = 0; i < n; i++) {
      const per = 0.55 + 0.25 * hash(i, u.id), ph = (T / per + hash(u.id, i)) % 1, cyc = Math.floor(T / per + hash(u.id, i));
      const an = hash(cyc, i, u.id) * TAU, rr = vr * (0.2 + 0.55 * hash(i, cyc, u.id));
      const lift = ph * vr * 0.5, px = u.x + Math.cos(an) * rr + ux * (vr * 0.1 + lift), py = u.y + Math.sin(an) * rr + uy * (vr * 0.1 + lift);
      const sz = (5 + 7 * f) * Math.sin(Math.min(1, ph * 1.4) * Math.PI * 0.5 + (ph > 0.5 ? (ph - 0.5) * Math.PI : 0)) * (ph < 0.75 ? 1 : 1 - (ph - 0.75) / 0.25);
      if (sz < 0.8) continue;
      upright(ctx, px, py, () => { ctx.rotate(Math.sin(T * 11 + i * 2) * 0.22); ctx.scale(1 + 0.12 * Math.sin(T * 17 + i), 1 - 0.1 * Math.sin(T * 17 + i)); flame(ctx, 0, 0, sz); });
    }
  }
  if ((st.radiance || 0) > 2 || u.radiantT > 0) { // radiance (round 9: no halo): golden glints twinkling on the body, more as it
    // builds, and thin beams of light rising off it
    const f = u.radiantT > 0 ? 1 : clamp(st.radiance / 100, 0, 1), n = 1 + Math.round(3 * f);
    for (let i = 0; i < n; i++) { const per = 0.7, ph = (T / per + i / n + u.id * 0.11) % 1, cyc = Math.floor(T / per + i / n + u.id * 0.11), q = Math.sin(ph * Math.PI);
      const an = hash(cyc, i, u.id) * TAU, rr = vr * 0.85 * Math.sqrt(hash(i, cyc, u.id)), x = u.x + Math.cos(an) * rr, y = u.y + Math.sin(an) * rr;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, 10 * q + 2, '#FFE48A', 0.6 * q); ctx.restore();
      ctx.save(); ctx.globalAlpha = q; inked(ctx, () => star(ctx, x, y, (4 + 4 * f) * q + 1, 4, 0.2, 0), '#FFF4C0'); ctx.restore(); }
    for (let i = 0; i < 1 + Math.round(2 * f); i++) { const ph = (T * 0.9 + i * 0.37 + u.id * 0.2) % 1, an = (i * 2.3 + u.id) % TAU, x = u.x + Math.cos(an) * vr * 0.5, y = u.y + Math.sin(an) * vr * 0.5;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(ph * Math.PI) * (0.4 + 0.5 * f); ctx.strokeStyle = '#FFF1B0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + ux * ph * 14, y + uy * ph * 14); ctx.lineTo(x + ux * (ph * 14 + 16), y + uy * (ph * 14 + 16)); ctx.stroke(); ctx.restore(); }
  }
  if ((st.curse || 0) > 2 || u.hexed) { // cursed: dark wisps curling up off the body; hexed: an open eye over the head
    const f = u.hexed ? 1 : clamp(st.curse / 100, 0, 1), n = 1 + Math.round(3 * f);
    for (let i = 0; i < n; i++) {
      const ph = (T * 0.9 + i / n + u.id * 0.31) % 1, an = (i * 2.1 + u.id) % TAU, rr = vr * 0.6;
      const px = u.x + Math.cos(an) * rr + ux * ph * 22, py = u.y + Math.sin(an) * rr + uy * ph * 22;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * (0.55 + 0.45 * f);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(px + Math.sin(ph * 9 + i) * 3, py, 3.2 + 2.4 * f * (1 - ph), 0, TAU); }, i % 2 ? '#5A2A80' : '#9A5CC8');
    }
    ctx.globalAlpha = 1;
    if (u.hexed) upright(ctx, u.x, u.y, () => { const y = -vr * 1.3, s = 1 + 0.12 * Math.sin(T * 7);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-8 * s, y); ctx.quadraticCurveTo(0, y - 7 * s, 8 * s, y); ctx.quadraticCurveTo(0, y + 7 * s, -8 * s, y); ctx.closePath(); }, '#E6D2F6');
      ctx.fillStyle = '#5A2A80'; ctx.beginPath(); ctx.arc(0, y, 2.6 * s, 0, TAU); ctx.fill(); });
  }
  if ((st.shock || 0) > 5) { // little arcs crackling round the body
    const f = Math.floor(T / 0.07);
    for (let i = 0; i < 2; i++) { if (hash(f, i, u.id) < 0.35) continue;
      const a0 = hash(f, i, u.id + 1) * TAU, a1 = a0 + 0.7 + hash(i, f) * 0.6, r0 = vr * 1.05;
      bolt(ctx, u.x + Math.cos(a0) * r0, u.y + Math.sin(a0) * r0, u.x + Math.cos(a1) * r0, u.y + Math.sin(a1) * r0, T, f + i * 7 + u.id, 1.6); }
  }
  const stag = st.stagger || 0;
  if (stag > 8 || u.sleepT > 0) {
    // stars circling over the head (stagger), bigger and slower when knocked out; Zs drifting up when asleep
    upright(ctx, u.x, u.y, () => {
      if (stag > 8) {
        const ko = stag >= 100, n = ko ? 3 : stag > 50 ? 2 : 1, R = vr * (ko ? 0.9 : 0.7);
        for (let i = 0; i < n; i++) { const a = T * (ko ? 3 : 5) + i / n * TAU, x = Math.cos(a) * R, y = -vr * 1.05 + Math.sin(a) * R * 0.35;
          inked(ctx, () => star(ctx, x, y, ko ? 6 : 5, 5, 0.45, a), '#FFE14D'); }
      }
      if (u.sleepT > 0) for (let i = 0; i < 2; i++) {
        const ph = (T * 0.55 + i * 0.5) % 1, s = 4 + 3 * ph, x = vr * 0.5 + ph * 10 + Math.sin(ph * 6) * 2, y = -vr * 0.9 - ph * 26;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.lineTo(x + s, y + s); }, '#DDEBFF', 2.2);
        ctx.globalAlpha = 1;
      }
    });
  }
}

// ---------------------------------------------------------------- the renderer's own touches
// Short-lived marks the renderer adds itself (not in the sim): impact stars, coin sparkles, death bursts.
const local = [];
// A death burst's colour: bone for the dead that walk, the slimes' and rats' own, purple for our summons.
const SUMMON_BURST = '#B8C8DA'; // ours: blue-grey (round 8; was purple)
function burstColor(u) {
  if (u.summon) return SUMMON_BURST;
  const k = u.kind;
  if (k.startsWith('slime')) return '#6CC9B0';
  if (k === 'rat') return '#B49C8A';
  if (u.def.undead || /skeleton|rattler|gaper|brute|ghost|bone|grave/i.test(k) || (u.def.res && u.def.res.poison < 0.5)) return '#EDE4CD';
  return '#F2B27A';
}
export function noteHits(w) {
  noteWorld(w);
  for (const u of w.units) {
    if (u.hitT > (u._seenHit || 0) + 0.02 && !u.downed) {
      // at the point the sim worked out: the body's edge facing the blow, or the face of a raised shield
      const r = u.r * 0.85, x = u.hitX ?? u.x - Math.cos(u.hitA) * r, y = u.hitY ?? u.y - Math.sin(u.hitA) * r;
      local.push({ type: 'impact', x, y, a: u.hitA, t: 0, max: u.hitBlock ? 0.16 : 0.13, big: u.flinchT > 0.15, block: u.hitBlock, fa: u.facing });
    }
    u._seenHit = u.hitT;
  }
  // something that was here last frame and is gone with no HP left has died: it bursts (round 7). Done here, not in
  // the sim, so it needs nothing from sim.js; a hero who goes down stays in the list and doesn't burst.
  const was = w._here, here = new Set();
  for (const u of w.units) if (!u.ethereal) here.add(u);
  if (was) for (const u of was) if (!here.has(u) && u.hp <= 0) {
    local.push({ type: 'death', x: u.x, y: u.y, r: Math.max(14, u.vr), color: burstColor(u), seed: u.id, t: 0, max: u.def.boss ? 0.75 : 0.5, big: !!u.def.boss });
  }
  w._here = here;
  // coins that vanished while still fresh were picked up
  const now = new Set();
  for (const p of w.pickups) if (p.type === 'coin') now.add(p);
  if (w._coins) for (const p of w._coins) if (!now.has(p) && (p.life == null || p.life > 0.05)) local.push({ type: 'sparkle', x: p.x, y: p.y, t: 0, max: 0.4 });
  w._coins = now;
}
// A body bursting: a white pop at the core, a shock ring, puffs in its colour thrown outward, a few sparks past them.
function deathBurst(ctx, f, k) {
  const e = easeOut(k), R = f.r * 1.3, n = f.big ? 11 : 8;
  ctx.save();
  if (k < 0.35) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, R * (1.4 + 1.8 * e), '#FFF4DC', 1 - k / 0.35); ctx.restore(); }
  ctx.globalAlpha = (1 - k) * (1 - k);
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, R * (0.5 + 1.6 * e), 0, TAU); }, '#FFF8EC', 6 * (1 - k) + 1);
  ctx.globalAlpha = 1 - k * k * k;
  for (let i = 0; i < n; i++) {
    const a = (i + hash(f.seed, i) * 0.6) / n * TAU, d = R * (0.2 + (1.05 + 0.45 * hash(i, f.seed)) * e), pr = R * (0.42 + 0.16 * hash(f.seed, i, 3)) * (1 - e) + 1.5;
    inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, pr, 0, TAU); }, i % 3 === 2 ? '#FFF6E6' : f.color);
  }
  if (k < 0.45) inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, R * 0.7 * (1 - k / 0.45) + 1, 0, TAU); }, '#FFFFFF');
  ctx.globalAlpha = 1 - k;
  for (let i = 0; i < 5; i++) {
    const a = (i + 0.5) / 5 * TAU + hash(f.seed, i, 7), d = R * (0.7 + 1.9 * e);
    inked(ctx, () => star(ctx, f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 6 * (1 - k) + 1.5, 4, 0.35, a), '#FFFFFF');
  }
  ctx.restore();
}
export function drawLocal(ctx, dt) {
  drawMarks(ctx, dt, 'air');
  for (const f of local) {
    f.t += dt; const k = clamp(f.t / f.max, 0, 1);
    if (f.type === 'impact') {
      const s = (f.big ? 15 : 10) * (0.6 + 0.6 * easeOut(k));
      ctx.save(); ctx.globalAlpha = 1 - k * k;
      if (f.block) { // a clang on the shield: a bright arc along its face, and a hard white star
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, 22 * (1 - k) + 6, '#FFF4C8', 0.8); ctx.restore();
        inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x - Math.cos(f.fa) * 12, f.y - Math.sin(f.fa) * 12, 14 + 6 * k, f.fa - 0.9, f.fa + 0.9); }, '#FFF8E0', 3 * (1 - k) + 1);
      }
      inked(ctx, () => star(ctx, f.x, f.y, s, 4, 0.3, f.a), f.block ? '#FFF4C8' : '#FFFFFF');
      ctx.restore();
    } else if (f.type === 'death') {
      deathBurst(ctx, f, k);
    } else if (f.type === 'sparkle') {
      ctx.save(); ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 4; i++) { const an = i / 4 * TAU + 0.4, d = 4 + 16 * easeOut(k);
        ctx.fillStyle = i % 2 ? '#FFE08A' : '#FFFFFF'; star(ctx, f.x + Math.cos(an) * d, f.y + Math.sin(an) * d, 4.5 * (1 - k) + 1, 4, 0.35); ctx.fill(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, f.x, f.y, 16 * (1 - k) + 4, '#FFD45A', 0.7 * (1 - k)); ctx.restore();
      ctx.restore();
    }
  }
  for (let i = local.length - 1; i >= 0; i--) if (local[i].t >= local[i].max) local.splice(i, 1);
}
