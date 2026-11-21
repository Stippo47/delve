// How each dungeon type looks (lane C): the floor, rock, walls and pillars in the theme's palette, the floor dressing
// (bones, candles, moss, straw...), the theme hazards (grave mist, hidden snares), sewer water, a boss's arena
// (throne, graves), the danger-zone telegraphs, and the light/fog mood over the room. render.js calls in here.
// The look is the game's: warm, chunky, one heavy ink outline (OUTLINE), soft gradients lit from the left.
import { INK, TAU, clamp } from './util.js';
import { OUTLINE, view } from './render.js';
import { paintRoom, drawBlock, envVoid, envFogK } from './env.js';

const DEF_PAL = { floor: ['#E2D6BE', '#D3C5A9'], tile: ['rgba(160,140,110,0.10)', 'rgba(255,255,255,0.08)'], grout: 'rgba(120,100,80,0.10)',
  wall: ['#8C7E70', '#6E6157'], wallTop: 'rgba(255,255,255,0.12)', rock: ['#6B5D52', '#2F2734'], void: '#2F2734', accent: '#FFE14D' };
export const pal = (w) => (w.theme && w.theme.palette) || DEF_PAL;
export const voidColor = (w) => envVoid(w);

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
let soft = false; // floor dressing: a faint outline instead of the heavy ink one
function inked(g, pathFn, fill) {
  const o = soft ? 'rgba(30,20,30,0.28)' : INK;
  g.save(); g.fillStyle = o; g.strokeStyle = o; g.lineWidth = OUTLINE * (soft ? 1 : 2); g.lineJoin = 'round'; g.lineCap = 'round';
  pathFn(); g.fill(); g.stroke(); g.restore();
  g.fillStyle = fill; pathFn(); g.fill();
}
const hash = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
function lin(g, x0, y0, x1, y1, a, b) { const l = g.createLinearGradient(x0, y0, x1, y1); l.addColorStop(0, a); l.addColorStop(1, b); return l; }

// ---------------------------------------------------------------- the floor (drawn once per room into a cache)
// g is already scaled and translated so (0,0) is the room's corner; pad is how far the cache reaches past it.
// The look (floor pattern, walls, rock, light) comes from the environment style (env.js); the theme's water and
// floor dressing are painted here, the dressing soft and faint so it never looks solid.
export function paintFloor(g, w, pad) {
  const P = pal(w);
  paintRoom(g, w, pad, {
    water: w.water ? (lg) => { for (const c of w.water) water(lg, c, w); } : null,
    decor: (w.decor && w.decor.length) ? (lg) => { soft = true; try { for (const d of w.decor) decor(lg, d, P); } finally { soft = false; } } : null,
  });
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.round(clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k, 0, 255));
  return `rgb(${f(r)},${f(gg)},${f(b)})`;
}

function water(g, c, w) {
  // a channel of murky water between two stone banks
  g.fillStyle = INK; g.fillRect(c.x - OUTLINE * 2 - 3, c.y, c.w + OUTLINE * 4 + 6, c.h);
  g.fillStyle = '#7E8A6C'; g.fillRect(c.x - 3, c.y, c.w + 6, c.h); // the bank's lip
  const wg = lin(g, c.x, 0, c.x + c.w, 0, '#4F8C8A', '#2E5E63');
  g.fillStyle = wg; g.fillRect(c.x + 3, c.y, c.w - 6, c.h);
  g.fillStyle = 'rgba(160,220,210,0.25)';
  for (let y = 20; y < c.h; y += 46) { const k = hash(c.x, y); g.beginPath(); g.ellipse(c.x + c.w * (0.25 + 0.5 * k), c.y + y, c.w * 0.18, 3, 0, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(20,40,40,0.25)'; g.fillRect(c.x + c.w - 14, c.y, 11, c.h); // shade on the right bank
}

// ---------------------------------------------------------------- floor dressing
const BONE = '#EDE3CB', BONE_D = '#CDBF9E';
function bone(g, x, y, a, L) {
  g.save(); g.translate(x, y); g.rotate(a);
  inked(g, () => { g.beginPath(); rr(g, -L / 2, -2.6, L, 5.2, 2.6); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.moveTo(sx * L / 2 + 3.6, sy * 2.6); g.arc(sx * L / 2, sy * 2.6, 3.6, 0, TAU); } }, lin(g, -L / 2, -6, L / 2, 6, BONE, BONE_D));
  g.restore();
}
function decor(g, d, P) {
  const { x, y, a, s, v } = d;
  g.save();
  switch (d.type) {
    case 'bones': bone(g, x, y, a, 22 * s); bone(g, x + 4, y - 3, a + 1.3 + v * 0.3, 18 * s); break;
    case 'bonepile': for (let i = 0; i < 4; i++) bone(g, x + Math.cos(a + i * 1.7) * 9, y + Math.sin(a + i * 1.7) * 9, a + i * 0.9, 18 * s); break;
    case 'skulls': for (let i = 0; i <= v % 2; i++) {
      const sx = x + i * 16, sy = y + i * 6;
      inked(g, () => { g.beginPath(); g.arc(sx, sy, 8 * s, 0, TAU); rr(g, sx - 5 * s, sy + 4 * s, 10 * s, 6 * s, 2); }, lin(g, sx - 8, sy, sx + 8, sy, BONE, BONE_D));
      g.fillStyle = '#3A3036'; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(sx + k * 3.2 * s, sy + 0.5 * s, 2.3 * s, 2 * s, 0, 0, TAU); g.fill(); }
    } break;
    case 'candles': {
      const glow = g.createRadialGradient(x, y, 2, x, y, 46 * s); glow.addColorStop(0, 'rgba(255,214,140,0.35)'); glow.addColorStop(1, 'rgba(255,214,140,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(x, y, 46 * s, 0, TAU); g.fill();
      const n = 2 + v % 2;
      for (let i = 0; i < n; i++) {
        const cx = x + Math.cos(a + i * 2.1) * 8 * s, cy = y + Math.sin(a + i * 2.1) * 8 * s, r = (3.6 + (i % 2) * 1.2) * s;
        inked(g, () => { g.beginPath(); g.arc(cx, cy, r, 0, TAU); }, '#F4EAD2');
        g.fillStyle = '#FFB347'; g.beginPath(); g.arc(cx, cy, r * 0.5, 0, TAU); g.fill();
        g.fillStyle = '#FFF4C4'; g.beginPath(); g.arc(cx - r * 0.15, cy - r * 0.15, r * 0.25, 0, TAU); g.fill();
      }
    } break;
    case 'slab': {
      g.translate(x, y); g.rotate(Math.round(a / (Math.PI / 2)) * Math.PI / 2 + (v - 1) * 0.08);
      inked(g, () => rr(g, -30 * s, -17 * s, 60 * s, 34 * s, 6), lin(g, -30, -17, 30, 17, '#B3AFA9', '#8E8A86'));
      g.fillStyle = 'rgba(255,255,255,0.28)'; rr(g, -14 * s, -2.5 * s, 28 * s, 5 * s, 2); g.fill(); rr(g, -2.5 * s, -10 * s, 5 * s, 20 * s, 2); g.fill();
    } break;
    case 'web': {
      g.translate(x, y); g.rotate(a); g.strokeStyle = 'rgba(245,245,250,0.45)'; g.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) { const b = i / 6 * TAU; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(b) * 26 * s, Math.sin(b) * 26 * s); g.stroke(); }
      for (const r of [8, 15, 22]) { g.beginPath(); for (let i = 0; i <= 6; i++) { const b = i / 6 * TAU, rr2 = r * s * (i % 2 ? 0.9 : 1); i ? g.lineTo(Math.cos(b) * rr2, Math.sin(b) * rr2) : g.moveTo(Math.cos(b) * rr2, Math.sin(b) * rr2); } g.stroke(); }
    } break;
    case 'crack': {
      g.strokeStyle = 'rgba(40,32,40,0.30)'; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(x, y); let px = x, py = y, b = a;
      for (let i = 0; i < 5; i++) { b += (hash(x + i, y) - 0.5) * 1.4; px += Math.cos(b) * 12 * s; py += Math.sin(b) * 12 * s; g.lineTo(px, py); }
      g.stroke();
    } break;
    case 'grate': {
      g.translate(x, y); g.rotate(Math.round(a / (Math.PI / 2)) * Math.PI / 2);
      inked(g, () => rr(g, -20 * s, -20 * s, 40 * s, 40 * s, 5), '#4C514A');
      g.fillStyle = '#1F2420'; for (let i = -1; i <= 1; i++) { rr(g, i * 11 * s - 3.5 * s, -14 * s, 7 * s, 28 * s, 2); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.12)'; rr(g, -18 * s, -18 * s, 10 * s, 36 * s, 4); g.fill();
    } break;
    case 'moss': for (let i = 0; i < 5; i++) {
      const mx = x + Math.cos(a + i * 1.3) * 16 * s, my = y + Math.sin(a + i * 1.3) * 11 * s;
      g.fillStyle = i % 2 ? 'rgba(96,140,60,0.45)' : 'rgba(130,170,80,0.40)'; g.beginPath(); g.ellipse(mx, my, 16 * s, 11 * s, a, 0, TAU); g.fill();
    } break;
    case 'puddle': {
      g.fillStyle = 'rgba(46,80,84,0.35)'; g.beginPath(); g.ellipse(x, y, 34 * s, 20 * s, a, 0, TAU); g.fill();
      g.fillStyle = 'rgba(190,230,225,0.35)'; g.beginPath(); g.ellipse(x - 9 * s, y - 5 * s, 10 * s, 3 * s, a, 0, TAU); g.fill();
    } break;
    case 'pipe': {
      inked(g, () => { g.beginPath(); g.arc(x, y, 15 * s, 0, TAU); }, lin(g, x - 15, y - 15, x + 15, y + 15, '#8A9278', '#5E654F'));
      g.fillStyle = '#1F2420'; g.beginPath(); g.arc(x + 1, y + 1, 9 * s, 0, TAU); g.fill();
      g.fillStyle = 'rgba(120,180,90,0.6)'; g.beginPath(); g.ellipse(x + 2, y + 8 * s, 6 * s, 3 * s, 0, 0, TAU); g.fill();
    } break;
    case 'straw': {
      g.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const b = a + hash(x, i) * 1.4 - 0.7, sx = x + (hash(i, y) - 0.5) * 30 * s, sy = y + (hash(y, i) - 0.5) * 20 * s, L = 10 + hash(i, i) * 10;
        g.strokeStyle = i % 3 ? '#E8C877' : '#C9A24E'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(b) * L, sy + Math.sin(b) * L); g.stroke();
      }
    } break;
    case 'planks': {
      g.translate(x, y); g.rotate(a);
      for (let i = 0; i < 2 + v % 2; i++) {
        const py = i * 11 - 8, L = (40 + hash(i, x) * 16) * s;
        inked(g, () => rr(g, -L / 2 + i * 5, py - 4, L, 8, 2), lin(g, 0, py - 4, 0, py + 4, '#A87A4C', '#7D5634'));
      }
    } break;
    case 'firepit': {
      inked(g, () => { g.beginPath(); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU; g.moveTo(x + Math.cos(b) * 22 * s + 6, y + Math.sin(b) * 22 * s); g.arc(x + Math.cos(b) * 22 * s, y + Math.sin(b) * 22 * s, 6, 0, TAU); } }, '#8F8A84');
      g.fillStyle = '#3B312E'; g.beginPath(); g.arc(x, y, 16 * s, 0, TAU); g.fill();
      const glow = g.createRadialGradient(x, y, 1, x, y, 15 * s); glow.addColorStop(0, 'rgba(255,140,60,0.85)'); glow.addColorStop(1, 'rgba(255,90,30,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(x, y, 15 * s, 0, TAU); g.fill();
    } break;
    case 'rubble': for (let i = 0; i < 4; i++) {
      const sx = x + Math.cos(a + i * 1.6) * 12 * s, sy = y + Math.sin(a + i * 1.6) * 9 * s, r = (5 + hash(i, x) * 4) * s;
      inked(g, () => { g.beginPath(); g.ellipse(sx, sy, r, r * 0.8, a + i, 0, TAU); }, lin(g, sx - r, sy - r, sx + r, sy + r, '#B9A58A', '#8A7660'));
    } break;
    case 'dais': throne(g, x, y, P); break;
  }
  g.restore();
}

// The Bone King's dais and throne (the throne's back is towards the far wall, +x).
function throne(g, x, y) {
  inked(g, () => rr(g, x - 120, y - 160, 210, 320, 16), lin(g, x - 120, y - 160, x + 90, y + 160, '#ABA6A2', '#827D7A'));
  inked(g, () => rr(g, x - 90, y - 125, 165, 250, 12), lin(g, x - 90, y - 125, x + 75, y + 125, '#BDB8B3', '#94908C'));
  g.fillStyle = 'rgba(110,40,80,0.55)'; rr(g, x - 150, y - 34, 160, 68, 6); g.fill(); // a worn purple runner up to it
  // the throne: a high back, two arms, a seat
  inked(g, () => rr(g, x + 22, y - 62, 36, 124, 10), lin(g, x + 22, y - 62, x + 58, y + 62, '#6E6873', '#4A4450'));
  inked(g, () => { rr(g, x - 32, y - 62, 62, 22, 8); rr(g, x - 32, y + 40, 62, 22, 8); }, '#5E5864');
  inked(g, () => rr(g, x - 28, y - 42, 54, 84, 8), lin(g, x - 28, y - 42, x + 26, y + 42, '#7A3A62', '#552648'));
  for (const sy of [-1, 1]) inked(g, () => { g.beginPath(); g.arc(x + 52, y + sy * 62, 9, 0, TAU); }, BONE);
}

// ---------------------------------------------------------------- walls and pillars
export function drawWallThemed(ctx, r, w) { if (r.kind === 'bone') boneBlock(ctx, r); else drawBlock(ctx, r, w); } // walls that come and go; the rest are in the floor cache
// One block of the Bone King's bone wall (boss.js boneWall, round 8): a heap of bone that bursts up, with spurs, and
// sinks back as it runs out.
function boneBlock(ctx, r) {
  const up = clamp(Math.min(((r.max || 6) - r.temp) / 0.18, r.temp / 0.4, 1), 0, 1), cx = r.x + r.w / 2, cy = r.y + r.h / 2, h = r.w / 2 * (0.4 + 0.6 * up), seed = Math.round(cx * 3 + cy);
  ctx.save();
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(cx, cy, h * 1.1, h, 0, 0, TAU); }, BONE_D);
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(cx - h * 0.15, cy - h * 0.2, h * 0.75, h * 0.62, 0, 0, TAU); }, BONE);
  for (let i = 0; i < 3; i++) { const a = (seed % 7) + i * 2.1, L = h * (1.1 + 0.25 * ((seed + i) % 3)), bx = cx + Math.cos(a) * h * 0.3, by = cy + Math.sin(a) * h * 0.3;
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(bx - Math.sin(a) * 4, by + Math.cos(a) * 4); ctx.lineTo(bx + Math.cos(a) * L, by + Math.sin(a) * L); ctx.lineTo(bx + Math.sin(a) * 4, by - Math.cos(a) * 4); ctx.closePath(); }, BONE); }
  ctx.restore();
}

export function drawPillarThemed(ctx, p, w) {
  const style = (w.theme && w.theme.pillar) || 'stone';
  if (style === 'pipe') {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); }, lin(ctx, p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r, '#8F9A7C', '#5C6450'));
    ctx.fillStyle = '#26302A'; ctx.beginPath(); ctx.arc(p.x + 2, p.y + 2, p.r * 0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,190,90,0.55)'; ctx.beginPath(); ctx.ellipse(p.x + 4, p.y + p.r * 0.35, p.r * 0.35, p.r * 0.16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#B4BCA2'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * p.r * 0.82, p.y + Math.sin(a) * p.r * 0.82, 2.2, 0, TAU); ctx.fill(); }
  } else if (style === 'barrel') {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); }, lin(ctx, p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r, '#B98A57', '#835C36'));
    ctx.strokeStyle = 'rgba(60,40,25,0.35)'; ctx.lineWidth = 1.6;
    for (let i = -2; i <= 2; i++) { const x = p.x + i * p.r * 0.33; const hh = Math.sqrt(Math.max(0, p.r * p.r - (x - p.x) ** 2)) * 0.9; ctx.beginPath(); ctx.moveTo(x, p.y - hh); ctx.lineTo(x, p.y + hh); ctx.stroke(); }
    ctx.strokeStyle = '#5A5458'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.86, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,210,0.16)'; ctx.beginPath(); ctx.arc(p.x - p.r * 0.2, p.y - p.r * 0.2, p.r * 0.5, 0, TAU); ctx.fill();
  } else {
    const P = pal(w);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); }, lin(ctx, p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r, shade(P.wall[0], 0.25), P.wall[1]));
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(p.x - p.r * 0.15, p.y - p.r * 0.15, p.r * 0.62, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(40,36,48,0.25)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.72, 0.4, 2.4); ctx.stroke();
  }
}

// ---------------------------------------------------------------- theme hazards (true if drawn here)
export function drawThemeHazard(ctx, h, t) {
  if (h.type === 'mist') {
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU + t * 0.35 + h.x, rr2 = h.r * (0.4 + 0.12 * Math.sin(t * 0.8 + i)), x = h.x + Math.cos(a) * rr2, y = h.y + Math.sin(a) * rr2 * 0.8;
      ctx.globalAlpha = 0.28; ctx.fillStyle = '#9FB8D8'; ctx.beginPath(); ctx.arc(x, y, h.r * 0.55, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#E4F1FF'; ctx.beginPath(); ctx.arc(h.x - h.r * 0.15, h.y - h.r * 0.15, h.r * 0.4, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; return true;
  }
  if (h.type === 'web') {
    // a spider's web on the floor (round 7): pale threads from the middle and rings between them; fades as it goes
    const a0 = h.max ? clamp(h.t / h.max * 3, 0, 1) : 1;
    ctx.save(); ctx.translate(h.x, h.y); ctx.globalAlpha = 0.7 * a0; ctx.strokeStyle = '#ECE6F4'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    const n = 8; ctx.beginPath();
    for (let i = 0; i < n; i++) { const b = i / n * TAU + h.x * 0.01; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(b) * h.r, Math.sin(b) * h.r); }
    for (const k of [0.35, 0.62, 0.9]) for (let i = 0; i <= n; i++) { const b = i / n * TAU + h.x * 0.01, r = h.r * k * (i % 2 ? 0.92 : 1); i ? ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r) : ctx.moveTo(Math.cos(b) * r, Math.sin(b) * r); }
    ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; return true;
  }
  if (h.type === 'beam') {
    // a gold sigil set in the floor (the Spire): it brightens as it gathers light, then calls a shaft down on itself
    const lit = h.lit > 0 ? 1 : 0;
    ctx.save(); ctx.translate(h.x, h.y);
    ctx.globalAlpha = 0.55 + 0.25 * lit; ctx.strokeStyle = '#C9A44A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, h.r * 0.92, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, h.r * 0.62, 0, TAU); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + t * 0.3; ctx.moveTo(Math.cos(b) * h.r * 0.62, Math.sin(b) * h.r * 0.62); ctx.lineTo(Math.cos(b + 2.1) * h.r * 0.62, Math.sin(b + 2.1) * h.r * 0.62); } ctx.stroke();
    ctx.fillStyle = '#F2C84A'; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU; ctx.beginPath(); ctx.arc(Math.cos(b) * h.r * 0.92, Math.sin(b) * h.r * 0.92, 3, 0, TAU); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1; return true;
  }
  if (h.type === 'snare') {
    // a goblin snare: iron jaws half buried in the dirt, easy to miss; once sprung, shut and spent
    ctx.save(); ctx.translate(h.x, h.y);
    const a = h.max ? clamp(h.t / h.max * 2, 0, 1) : 1;
    ctx.globalAlpha = h.sprung ? a : 0.55;
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, h.r, 0, TAU); }, '#6E6460');
    ctx.fillStyle = '#4A403E'; ctx.beginPath(); ctx.arc(0, 0, h.r * 0.45, 0, TAU); ctx.fill();
    ctx.fillStyle = '#C9C2BA';
    const n = 8, open = h.sprung ? 0.45 : 1;
    for (let i = 0; i < n; i++) { const b = i / n * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(b - 0.2) * h.r, Math.sin(b - 0.2) * h.r); ctx.lineTo(Math.cos(b) * h.r * (1 - 0.6 * open), Math.sin(b) * h.r * (1 - 0.6 * open)); ctx.lineTo(Math.cos(b + 0.2) * h.r, Math.sin(b + 0.2) * h.r); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1; return true;
  }
  return false;
}

// ---------------------------------------------------------------- an arena's moving parts (graves, the throne's king)
export function drawArena(ctx, w) {
  for (const g of w.graves || []) {
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.a);
    inked(ctx, () => rr(ctx, -44, -26, 88, 52, 8), lin(ctx, -44, -26, 44, 26, '#A29D97', '#7A7570'));
    ctx.fillStyle = '#231E28'; rr(ctx, -34, -16, 68, 32, 5); ctx.fill();
    if (!g.open) inked(ctx, () => rr(ctx, -38, -20, 76, 40, 6), lin(ctx, -38, -20, 38, 20, '#B9B4AE', '#8F8A85'));
    else { ctx.rotate(0.35); inked(ctx, () => rr(ctx, -10, 18, 76, 30, 6), lin(ctx, -10, 18, 66, 48, '#B9B4AE', '#8F8A85')); }
    ctx.restore();
  }
  for (const r of w.remains || []) {
    for (let i = 0; i < 7; i++) bone(ctx, r.x + Math.cos(r.a + i * 0.9) * 22, r.y + Math.sin(r.a + i * 0.9) * 16, r.a + i * 1.1, 26);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(r.x + 6, r.y - 4, 15, 0, TAU); }, lin(ctx, r.x - 10, r.y - 20, r.x + 20, r.y + 10, BONE, BONE_D));
    // the crown, rolled free
    ctx.save(); ctx.translate(r.x + 40, r.y + 26); ctx.rotate(r.a);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(-14, -6); ctx.lineTo(-7, 0); ctx.lineTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(14, -6); ctx.lineTo(14, 6); ctx.closePath(); }, '#9A9AA6');
    ctx.restore();
  }
  // the Bone King's cold crown fire lights the floor round him
  for (const u of w.units) if (u.crown && !u.dead) {
    const k = 0.85 + 0.15 * Math.sin(w.time * 7);
    const g = ctx.createRadialGradient(u.x, u.y, u.r * 0.5, u.x, u.y, u.r * 3.2 * k);
    g.addColorStop(0, 'rgba(127,214,245,0.45)'); g.addColorStop(1, 'rgba(127,214,245,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(u.x, u.y, u.r * 3.2 * k, 0, TAU); ctx.fill();
  }
}

// ---------------------------------------------------------------- danger zones (sim.js addDanger)
// The shape shows at once, dashed; inside it a fill grows from nothing to the edge as the hit comes; then a flash.
const ZONE_COL = { bone: '#E0604B', blade: '#E0604B', soul: '#7FD6F5', water: '#5DB7E0', fire: '#FF7A2F', holy: '#F2C84A', ice: '#8FD3FF', web: '#B9AFD6', poison: '#9BCB3C' };
function zonePath(ctx, z, k) {
  ctx.beginPath();
  if (z.shape === 'circle') ctx.arc(z.x, z.y, Math.max(0.1, z.r * k), 0, TAU);
  else if (z.shape === 'ring') { const r1 = z.r0 + (z.r1 - z.r0) * k; ctx.arc(z.x, z.y, Math.max(z.r0 + 0.1, r1), 0, TAU); ctx.moveTo(z.x + z.r0, z.y); ctx.arc(z.x, z.y, z.r0, 0, TAU, true); }
  else if (z.shape === 'cone') { ctx.moveTo(z.x, z.y); ctx.arc(z.x, z.y, Math.max(0.1, z.r * k), z.a - z.arc / 2, z.a + z.arc / 2); ctx.closePath(); }
  else if (z.shape === 'line') {
    const a = Math.atan2(z.y2 - z.y1, z.x2 - z.x1), L = Math.hypot(z.x2 - z.x1, z.y2 - z.y1) * k;
    const ex = z.x1 + Math.cos(a) * L, ey = z.y1 + Math.sin(a) * L, nx = -Math.sin(a) * z.hw, ny = Math.cos(a) * z.hw;
    ctx.moveTo(z.x1 + nx, z.y1 + ny); ctx.lineTo(ex + nx, ey + ny); ctx.arc(ex, ey, z.hw, a + Math.PI / 2, a - Math.PI / 2, true);
    ctx.lineTo(z.x1 - nx, z.y1 - ny); ctx.arc(z.x1, z.y1, z.hw, a - Math.PI / 2, a + Math.PI / 2, true); ctx.closePath();
  }
}
export function drawDanger(ctx, w) {
  if (!w.danger || !w.danger.length) return;
  ctx.save(); ctx.lineJoin = 'round';
  for (const z of w.danger) {
    const col = ZONE_COL[z.kind] || '#E0604B';
    if (z.t > 0) {
      const k = clamp(z.age / (z.max || 1), 0, 1);
      ctx.globalAlpha = 0.16; ctx.fillStyle = col; zonePath(ctx, z, 1); ctx.fill('evenodd');
      ctx.globalAlpha = 0.22 + 0.3 * k; zonePath(ctx, z, k); ctx.fill('evenodd');
      ctx.globalAlpha = 0.85; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([12, 9]); ctx.lineDashOffset = -w.time * 30;
      zonePath(ctx, z, 1); ctx.stroke(); ctx.setLineDash([]);
    } else if (!z.cancelled) {
      const f = clamp(1 + z.t / 0.3, 0, 1); // fades over 0.3s after the hit
      ctx.globalAlpha = 0.55 * f; ctx.fillStyle = '#FFF4E0'; zonePath(ctx, z, 1); ctx.fill('evenodd');
      ctx.globalAlpha = 0.5 * f; ctx.fillStyle = col; zonePath(ctx, z, 1); ctx.fill('evenodd');
    }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

// Bone spikes that burst up out of the floor (the Bone King's rows and bone walls). Round 9, in the effects style: a
// knot of inked bone spikes standing up out of the floor (leaning up the screen like everything upright), then sinking.
export function drawSpikeFx(ctx, f) {
  if (f.type !== 'spike') return false;
  const k = f.t / f.max, up = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.4) / 0.6);
  const rot = view.rot ? Math.PI / 2 : 0;
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + f.x, d = i ? f.r * 0.32 : 0, h = (i ? 18 : 28) * (0.8 + 0.3 * ((i * 7 + Math.round(f.x)) % 3) / 2) * up, wd = i ? 5.5 : 8;
    ctx.save(); ctx.translate(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d); ctx.rotate(rot);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-wd, 0); ctx.lineTo(0, -h); ctx.lineTo(wd, 0); ctx.quadraticCurveTo(0, wd * 0.6, -wd, 0); ctx.closePath(); }, BONE);
    ctx.fillStyle = '#FFF8EA'; ctx.beginPath(); ctx.moveTo(-wd * 0.7, -1); ctx.lineTo(0, -h + 2); ctx.lineTo(-wd * 0.05, -1); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  return true;
}

// ---------------------------------------------------------------- the light: fog round the edges, the theme's tint
// Drawn in screen space over the room. A boss can set w.mood ('unbound': dark and cold).
export function drawMood(ctx, w, cw, ch, dpr) {
  const m = (w.theme && w.theme.mood) || null; if (!m) return;
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const dark = w.mood === 'unbound';
  const fog = dark ? 'rgba(10,18,40,' : m.fog, k = dark ? 0.82 : Math.min(0.9, m.fogK * envFogK());
  const R = Math.hypot(cw, ch) / 2;
  const g = ctx.createRadialGradient(cw / 2, ch / 2, R * (dark ? 0.2 : 0.3), cw / 2, ch / 2, R);
  g.addColorStop(0, fog + '0)'); g.addColorStop(1, fog + k + ')');
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  if (m.tint || dark) { ctx.fillStyle = dark ? 'rgba(40,70,140,0.14)' : m.tint; ctx.fillRect(0, 0, cw, ch); }
  ctx.restore();
}
