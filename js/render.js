// Canvas renderer for one room. Everything is drawn in room units, scaled and (in portrait) turned so the
// way out is at the top. One screen shows one chunk across (ACROSS units); a camera follows the party both ways.
import { getSprite, headR, tinted } from './sprites.js';
import { INK, TAU, clamp } from './util.js';
import { paintFloor, drawWallThemed, drawPillarThemed, drawThemeHazard, drawArena, drawDanger, drawSpikeFx, drawMood, voidColor } from './scenery.js';

// One outline thickness for everything drawn here, in room units. Matches what the SVG heroes show.
export const OUTLINE = 2.4;

export const view = { scale: 1, base: 1, zoom: 0.8, dpr: 1, cw: 0, ch: 0, rot: false, camX: null, camY: null, m: [1, 0, 0, 1, 0, 0] };
try { const z = +localStorage.getItem('delve.zoom'); if (z) view.zoom = z; } catch {}
export const ZOOM_MIN = 0.5, ZOOM_MAX = 1.5;
export function setZoom(z) { view.zoom = clamp(z, ZOOM_MIN, ZOOM_MAX); try { localStorage.setItem('delve.zoom', String(view.zoom)); } catch {} }
const ACROSS = 480; // one room chunk across = the screen's width in portrait

// topPad/bottomPad: screen space taken by the HUD. Portrait turns the room a quarter turn.
export function layout(canvas, w, topPad, bottomPad = 10, sidePad = 10) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
  view.dpr = dpr; view.cw = cw; view.ch = ch;
  view.rot = ch > cw;
  const pad = 26; // the wall frame around the floor
  const edge = 7; // how much of the side walls stays on screen
  const availW = cw - sidePad * 2, availH = ch - topPad - bottomPad;
  // one chunk across fills the screen's short side; anything bigger scrolls, both ways
  const across = view.rot ? availW : availH, along = view.rot ? availH : availW;
  // zoom 1 = one chunk across fills the screen's short side; the default shows a bit more
  const base = view.rot ? cw / (ACROSS + edge * 2) : Math.min(across / (ACROSS + edge * 2), along / 900);
  const s = base * view.zoom;
  view.scale = s; view.base = base;
  // the camera follows the party's middle, never further than the walls
  const heroes = w.units.filter((u) => u.team === 'hero' && !u.downed);
  let tx = w.W / 2, ty = w.H / 2;
  if (heroes.length) { tx = ty = 0; for (const h of heroes) { tx += h.x; ty += h.y; } tx /= heroes.length; ty /= heroes.length; }
  const halfX = along / (2 * s), halfY = across / (2 * s);
  const fit = (v, half, size) => { const lo = half - pad, hi = size - half + pad; return lo > hi ? size / 2 : clamp(v, lo, hi); };
  tx = fit(tx, halfX, w.W); ty = fit(ty, halfY, w.H);
  // the player's drag wins for a while, then the camera eases back to the party
  const now = performance.now(), fdt = Math.min(0.1, (now - (view.lastT || now)) / 1000); view.lastT = now;
  if (view.manualT > 0) {
    view.manualT -= fdt;
    if (view.manual != null) { view.manual = fit(view.manual, halfX, w.W); tx = view.manual; }
    if (view.manualY != null) { view.manualY = fit(view.manualY, halfY, w.H); ty = view.manualY; }
  } else { view.manual = null; view.manualY = null; }
  const ease = view.manualT > 0 ? 0.35 : 0.06;
  const snap = view.camX == null || view.camY == null || view.snap;
  view.camX = snap ? tx : view.camX + (tx - view.camX) * ease;
  view.camY = snap ? ty : view.camY + (ty - view.camY) * ease;
  view.snap = false;
  const midAcross = view.rot ? cw / 2 : topPad + availH / 2;
  const midAlong = view.rot ? topPad + availH / 2 : sidePad + availW / 2;
  if (view.rot) view.m = [0, -s, s, 0, midAcross - view.camY * s, midAlong + view.camX * s];  // world +x = screen up
  else view.m = [s, 0, 0, s, midAlong - view.camX * s, midAcross - view.camY * s];
}
export function snapCamera() { view.snap = true; view.manual = null; view.manualY = null; view.manualT = 0; }

// Draw fn in a frame centred on (x,y) that stays upright on screen (texts, bars, shadows).
function upright(ctx, x, y, fn) { ctx.save(); ctx.translate(x, y); if (view.rot) ctx.rotate(Math.PI / 2); fn(); ctx.restore(); }
// Which way "up the screen" points in room units.
function upVec() { return view.rot ? [1, 0] : [0, -1]; }

let floorCache = null;
// The room's floor, rock and dressing, drawn once into a canvas (scenery.js paints it in the dungeon type's look).
function floor(w) {
  const key = w.W + 'x' + w.H + ':' + view.base.toFixed(3) + ':' + view.dpr;
  if (floorCache && floorCache.key === key && floorCache.w === w) return floorCache.c;
  const pad = 26;
  const c = document.createElement('canvas');
  let s = view.base * view.dpr;
  const area = (w.W + pad * 2) * (w.H + pad * 2);
  if (area * s * s > 12e6) s = Math.sqrt(12e6 / area); // a big room's floor is cached a little softer
  c.width = Math.ceil((w.W + pad * 2) * s); c.height = Math.ceil((w.H + pad * 2) * s);
  const g = c.getContext('2d');
  g.scale(s, s); g.translate(pad, pad);
  paintFloor(g, w, pad);
  floorCache = { key, c, w, pad, s };
  return c;
}

function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
// Fill a path twice: ink grown by the outline, then the colour. Keeps every outline the same thickness.
function inked(ctx, pathFn, fill) {
  ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round';
  pathFn(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = fill; pathFn(); ctx.fill();
}

const SPRITE_KIND = { boss: 'boss', slimeSmall: 'slimeSmall' };

export function draw(ctx, w) {
  const d = view.dpr, m = view.m;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.fillStyle = voidColor(w); ctx.fillRect(0, 0, view.cw, view.ch);
  const sh = w.shake > 0 ? (Math.random() - 0.5) * w.shake : 0, sv = w.shake > 0 ? (Math.random() - 0.5) * w.shake : 0;
  ctx.setTransform(d * m[0], d * m[1], d * m[2], d * m[3], d * (m[4] + sh), d * (m[5] + sv));
  const fl = floor(w);
  const s = view.scale;
  ctx.drawImage(fl, -floorCache.pad, -floorCache.pad, fl.width / floorCache.s, fl.height / floorCache.s);
  drawDoors(ctx, w);
  for (const r of w.walls) if (!r.solid) drawWallThemed(ctx, r, w);
  for (const h of w.hazards) if (!drawThemeHazard(ctx, h, w.time)) drawHazard(ctx, h, w.time);
  drawArena(ctx, w);
  drawDanger(ctx, w);
  for (const p of w.pickups) drawPickup(ctx, p, w.time);
  // shadows, cast towards the bottom of the screen
  for (const p of w.pillars) upright(ctx, p.x, p.y, () => { ctx.fillStyle = 'rgba(43,34,48,0.22)'; ctx.beginPath(); ctx.ellipse(4, p.r * 0.45, p.r * 1.1, p.r * 0.6, 0, 0, TAU); ctx.fill(); });
  for (const p of w.pillars) drawPillar(ctx, p, w);
  for (const u of w.units) upright(ctx, u.x, u.y, () => { ctx.fillStyle = 'rgba(43,34,48,0.18)'; ctx.beginPath(); ctx.ellipse(2, u.vr * 0.7, u.vr * 1.25, u.vr * 0.55, 0, 0, TAU); ctx.fill(); });
  for (const t of w.telegraphs) if (t.type === 'ring') drawRing(ctx, t);
  for (const c of w.corpses) drawCorpse(ctx, c);
  const order = [...w.units].sort((a, b) => (a.downed ? -1 : 0) - (b.downed ? -1 : 0) || screenDepth(a) - screenDepth(b));
  const dt = Math.min(0.05, Math.max(0, w.time - (w._lastDraw ?? w.time))); w._lastDraw = w.time;
  for (const u of order) { if (u.kind === 'rat' && !u.downed) drawTail(ctx, u, dt); drawUnit(ctx, u, w); }
  for (const p of w.projectiles) drawProjectile(ctx, p);
  for (const p of w.particles) drawParticle(ctx, p);
  ctx.globalAlpha = 1;
  for (const t of w.telegraphs) if (t.type === 'swing') drawSwing(ctx, t); else if (t.type === 'blast') drawBlast(ctx, t);
  for (const f of w.fx) drawSpikeFx(ctx, f);
  drawMood(ctx, w, view.cw, view.ch, view.dpr);
  ctx.setTransform(d * m[0], d * m[1], d * m[2], d * m[3], d * m[4], d * m[5]);
  for (const u of order) drawOverlay(ctx, u);
  // Words over the arena (damage numbers, ability names) are off: show, don't tell. drawText stays for later use.
}
const screenDepth = (u) => (view.rot ? -u.x : u.y);

// The way in (behind the party) and the doors ahead, each marked with what kind of room it leads to.
const DOOR_COL = { fight: '#C8553D', hazard: '#E0884B', elite: '#8E3B5B', treasure: '#F2B53A', fountain: '#5DB7E0', decision: '#9B7BD6', boss: '#2B2230' };
function drawDoors(ctx, w) {
  arch(ctx, 0, w.doorIn.y, -1, true, false, w.time);
  for (const d of w.doors || []) {
    arch(ctx, w.W, d.y, 1, w.cleared, d.chosen, w.time, DOOR_COL[d.kind]);
    // what's behind it, on a stone plaque on the floor in front
    upright(ctx, w.W - 40, d.y, () => {
      inked(ctx, () => roundRect(ctx, -17, -17, 34, 34, 9), '#A99C8B');
      roomIcon(ctx, d.kind, 12);
    });
  }
}
// A doorway in the wall band at x (the room's edge), facing into the room (dir -1: the way in, +1: a way out).
function arch(ctx, x, y, dir, open, chosen, t, col) {
  const half = 44, band = 26, o = dir > 0 ? x : x - band;
  // stone jambs either side
  for (const sy of [-1, 1]) inked(ctx, () => roundRect(ctx, o - 2, y + sy * (half + 6) - 7, band + 4, 14, 5), '#9A8C7C');
  // the opening
  ctx.fillStyle = INK; ctx.fillRect(o, y - half, band, half * 2);
  if (!open) {
    // a shut wooden door: planks and two iron bands
    const g = ctx.createLinearGradient(o, y - half, o, y + half); g.addColorStop(0, '#9A6A3E'); g.addColorStop(1, '#7A5130');
    ctx.fillStyle = g; ctx.fillRect(o + 3, y - half + 3, band - 6, half * 2 - 6);
    ctx.fillStyle = 'rgba(43,34,48,0.35)'; for (let i = 1; i < 4; i++) ctx.fillRect(o + 3, y - half + 3 + i * (half * 2 - 6) / 4 - 1, band - 6, 2);
    ctx.fillStyle = '#4A4247'; for (const k of [-0.55, 0.55]) ctx.fillRect(o + 3, y + k * half - 3, band - 6, 6);
  } else if (col) {
    // the opening glows in the colour of the room behind it; the one the party takes glows strongest
    const k = (chosen ? 1 : 0.55) * (0.8 + 0.2 * Math.sin(t * 3 + y));
    const R = chosen ? 130 : 95;
    const g = ctx.createRadialGradient(x, y, 4, x, y, R);
    g.addColorStop(0, hexA(col, 0.6 * k)); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fillRect(o + 4, y - half + 4, band - 8, half * 2 - 8);
    ctx.fillStyle = '#FFF4DC'; ctx.globalAlpha = 0.35 * k; ctx.fillRect(o + 8, y - half + 10, band - 16, half * 2 - 20); ctx.globalAlpha = 1;
  }
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function roomIcon(ctx, kind, r) {
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); }, DOOR_COL[kind] || '#999');
  ctx.fillStyle = '#FFF4DC'; ctx.strokeStyle = '#FFF4DC'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  const k = r / 11;
  ctx.beginPath();
  if (kind === 'fight' || kind === 'elite') { ctx.moveTo(-5 * k, -5 * k); ctx.lineTo(5 * k, 5 * k); ctx.moveTo(5 * k, -5 * k); ctx.lineTo(-5 * k, 5 * k); ctx.stroke(); if (kind === 'elite') { ctx.beginPath(); ctx.arc(0, -8 * k, 2 * k, 0, TAU); ctx.fill(); } }
  else if (kind === 'hazard') { ctx.moveTo(0, -6 * k); ctx.lineTo(5.5 * k, 4.5 * k); ctx.lineTo(-5.5 * k, 4.5 * k); ctx.closePath(); ctx.stroke(); }
  else if (kind === 'treasure') { ctx.rect(-5.5 * k, -3.5 * k, 11 * k, 8 * k); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5.5 * k, 0); ctx.lineTo(5.5 * k, 0); ctx.stroke(); }
  else if (kind === 'fountain') { ctx.moveTo(0, -6 * k); ctx.bezierCurveTo(5 * k, 0, 4 * k, 5 * k, 0, 5 * k); ctx.bezierCurveTo(-4 * k, 5 * k, -5 * k, 0, 0, -6 * k); ctx.fill(); }
  else if (kind === 'decision') { for (const x of [-4.5, 0, 4.5]) { ctx.moveTo(x * k + 1.6 * k, 0); ctx.arc(x * k, 0, 1.6 * k, 0, TAU); } ctx.fill(); }
  else if (kind === 'boss') { ctx.moveTo(-6 * k, 4 * k); ctx.lineTo(-6 * k, -4 * k); ctx.lineTo(-3 * k, 0); ctx.lineTo(0, -5 * k); ctx.lineTo(3 * k, 0); ctx.lineTo(6 * k, -4 * k); ctx.lineTo(6 * k, 4 * k); ctx.closePath(); ctx.fill(); }
}

function drawWall(ctx, r) {
  // stone blocks seen from above: outlined, lit from the left, a lighter top face
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, '#8C7E70'); g.addColorStop(1, '#6E6157');
  inked(ctx, () => roundRect(ctx, r.x, r.y, r.w, r.h, 6), g);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, r.x + 5, r.y + 5, Math.max(0, r.w - 10), Math.max(0, r.h - 10), 4); ctx.fill();
}

function drawHazard(ctx, h, t) {
  ctx.save();
  if (h.type === 'oil') {
    inked(ctx, () => blob(ctx, h.x, h.y, h.r, 7, h.x * 0.1), '#3B3330');
    ctx.fillStyle = 'rgba(160,140,200,0.35)'; ctx.beginPath(); ctx.ellipse(h.x - h.r * 0.3, h.y - h.r * 0.35, h.r * 0.35, h.r * 0.14, -0.4, 0, TAU); ctx.fill();
  } else if (h.type === 'fire') {
    const k = 1 + Math.sin(t * 14 + h.x) * 0.05;
    inked(ctx, () => blob(ctx, h.x, h.y, h.r * k, 7, h.x * 0.1 + t), '#E8582A');
    ctx.fillStyle = '#FFB347'; blob(ctx, h.x, h.y, h.r * 0.62 * k, 6, -t * 1.3); ctx.fill();
    ctx.fillStyle = '#FFE58A'; blob(ctx, h.x, h.y, h.r * 0.28, 5, t * 2); ctx.fill();
    // a few standing flames on the patch
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + h.x, rr = h.r * 0.45, f = 0.75 + 0.25 * Math.sin(t * 9 + i * 2);
      upright(ctx, h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr, () => flameShape(ctx, 0, 0, 9 * f, '#FF8A3D', '#FFE08A'));
    }
  } else if (h.type === 'gas') {
    const a = h.max ? clamp(h.t / h.max, 0, 1) : 1;
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * TAU + t * 0.6, x = h.x + Math.cos(ang) * h.r * 0.45, y = h.y + Math.sin(ang) * h.r * 0.45;
      ctx.globalAlpha = 0.5 * a; ctx.fillStyle = '#5E8A2A'; ctx.beginPath(); ctx.arc(x, y, h.r * 0.55 + OUTLINE, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * TAU + t * 0.6, x = h.x + Math.cos(ang) * h.r * 0.45, y = h.y + Math.sin(ang) * h.r * 0.45;
      ctx.globalAlpha = 0.55 * a; ctx.fillStyle = '#A9D44A'; ctx.beginPath(); ctx.arc(x, y, h.r * 0.55, 0, TAU); ctx.fill();
    }
  } else if (h.type === 'spikes') {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); }, '#57534F');
    ctx.fillStyle = '#6E6965'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r - 4, 0, TAU); ctx.fill();
    const tips = [[0, 0]];
    const ring = Math.max(5, Math.round(h.r / 4.6));
    for (let i = 0; i < ring; i++) { const a = i / ring * TAU + 0.3; tips.push([Math.cos(a) * h.r * 0.58, Math.sin(a) * h.r * 0.58]); }
    for (const [dx, dy] of tips) {
      const x = h.x + dx, y = h.y + dy, r = 4.6;
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 0.8, y + 0.8, r + 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8D949C'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#D9DEE4'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, Math.PI * 0.55, Math.PI * 1.55); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x - 0.4, y - 0.4, 1.1, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

function drawPillar(ctx, p, w) {
  if (!p.fountain) return drawPillarThemed(ctx, p, w);
  if (p.fountain) {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); }, '#A99C8B');
    ctx.fillStyle = p.used ? '#7FA9BC' : '#5DB7E0'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.72, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(p.x - p.r * 0.25, p.y - p.r * 0.25, p.r * 0.3, p.r * 0.12, -0.6, 0, TAU); ctx.fill();
    return;
  }
  const g = ctx.createLinearGradient(p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r);
  g.addColorStop(0, '#B8AC9A'); g.addColorStop(1, '#857A6C');
  inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); }, g);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(p.x - p.r * 0.15, p.y - p.r * 0.15, p.r * 0.62, 0, TAU); ctx.fill();
}

function blob(ctx, x, y, r, n, ph) {
  ctx.beginPath();
  for (let i = 0; i <= n * 2; i++) {
    const a = i / (n * 2) * TAU;
    const rr = r * (1 + 0.08 * Math.sin(a * 3 + ph));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.82;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function tri(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.87, y + r * 0.5); ctx.lineTo(x - r * 0.87, y + r * 0.5); ctx.closePath(); }
// A lick of flame, tip up, base at (x,y). Outlined like everything else.
function flamePath(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 1.9);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r * 1.05, y - r * 0.4, x + r * 0.85, y + r * 0.25);
  ctx.arc(x, y + r * 0.1, r * 0.87, 0.2, Math.PI - 0.2);
  ctx.bezierCurveTo(x - r * 1.05, y - r * 0.4, x - r * 0.5, y - r * 1.1, x, y - r * 1.9); ctx.closePath();
}
function flameShape(ctx, x, y, r, outer, inner) {
  inked(ctx, () => flamePath(ctx, x, y, r), outer);
  ctx.fillStyle = inner; flamePath(ctx, x, y + r * 0.25, r * 0.5); ctx.fill();
}

function drawPickup(ctx, p, t) {
  if (p.type === 'coin') {
    // blinks out over its last second and a half
    if (p.life != null && p.life < 1.5 && Math.sin(t * 22) < 0) return;
    inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, TAU); }, '#F2B53A');
    ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(p.x - 1.6, p.y - 1.6, 2, 0, TAU); ctx.fill();
  } else if (p.type === 'key') {
    const b = Math.sin(t * 5) * 2;
    upright(ctx, p.x, p.y, () => {
      ctx.translate(0, b);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -6, 6, 0, TAU); roundRect(ctx, -2, -2, 4, 16, 1.5); roundRect(ctx, 0, 9, 7, 3.5, 1); }, '#FFD45A');
    });
  } else if (p.type === 'pedestal') {
    upright(ctx, p.x, p.y, () => {
      inked(ctx, () => roundRect(ctx, -18, -14, 36, 28, 6), '#A99C8B');
      const col = { potion: '#E0604B', xp: '#FFE14D', coins: '#F2B53A', trinket: '#C9A7FF' }[p.reward];
      const bob = Math.sin(t * 3 + p.y) * 2;
      if (p.reward === 'potion') inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -4 + bob, 7, 0, TAU); roundRect(ctx, -2.5, -15 + bob, 5, 6, 1.5); }, col);
      else if (p.reward === 'coins') { for (const [x, y] of [[-5, 0], [5, 0], [0, -6]]) inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y - 3 + bob, 5, 0, TAU); }, col); }
      else if (p.reward === 'xp') inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr = i % 2 ? 4 : 9; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr - 3 + bob); } ctx.closePath(); }, col);
      else inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -12 + bob); ctx.lineTo(7, -3 + bob); ctx.lineTo(0, 6 + bob); ctx.lineTo(-7, -3 + bob); ctx.closePath(); }, col);
    });
  } else if (p.type === 'chest') {
    upright(ctx, p.x, p.y, () => {
      ctx.fillStyle = 'rgba(43,34,48,0.2)'; ctx.beginPath(); ctx.ellipse(2, 14, 26, 9, 0, 0, TAU); ctx.fill();
      inked(ctx, () => roundRect(ctx, -21, -15, 42, 30, 6), p.open ? '#7A4A26' : '#A0683A');
      ctx.fillStyle = '#F2B53A'; ctx.fillRect(-21, -3, 42, 6);
      if (!p.open) inked(ctx, () => roundRect(ctx, -5, -5, 10, 10, 2.5), '#FFE08A');
      else { ctx.fillStyle = '#FFE7A0'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(0, -10, 16, 0, TAU); ctx.fill(); }
    });
  }
}

// ---------------------------------------------------------------- units
const ease = (k) => Math.sin(k * Math.PI);

function drawUnit(ctx, u, w) {
  const s = view.scale * view.dpr;
  const kind = SPRITE_KIND[u.kind] || u.kind;
  const sizeU = u.vr * 220 / headR(kind);
  const spr = getSprite(kind, sizeU * s);
  ctx.save();
  ctx.translate(u.x, u.y);
  // hit: squashed and shoved along the blow
  if (u.hitT > 0 && !u.downed) {
    const k = u.hitT / 0.16;
    ctx.rotate(u.hitA); ctx.translate(4 * k, 0); ctx.scale(1 - 0.16 * k, 1 + 0.1 * k); ctx.rotate(-u.hitA);
  }
  ctx.rotate(u.downed ? u.facing - Math.PI / 2 + 0.6 : u.facing - Math.PI / 2);
  // in the sprite's own frame forward is +y
  let fx = 0, fy = 0, sc = 1, tilt = 0;
  const moving = !u.downed && u.spd > 6;
  if (moving) { // a small step bounce, no side-to-side wobble (the arms will swing once the art is in parts)
    const k = clamp(u.spd / (u.def.speed || 60), 0, 1.3);
    sc = 1 + Math.abs(Math.cos(u.bob)) * 0.03 * k;
  }
  if (u.lungeT > 0) { const k = ease(1 - u.lungeT / 0.18); fy += u.vr * 0.5 * k; sc *= 1 + 0.08 * k; }
  if (u.recoilT > 0) { fy -= u.vr * 0.22 * (u.recoilT / 0.14); }
  if (u.act && (u.act.type === 'windup' || u.act.type === 'slam')) {
    const k = 1 - u.act.t / u.act.max; fy -= u.vr * 0.3 * k; sc *= 1 + 0.1 * k; tilt += Math.sin(w.time * 40) * 0.03 * k;
  }
  if (u.act && u.act.type === 'charge') { fy += u.vr * 0.15; sc *= 1.04; }
  ctx.translate(fx, fy); ctx.rotate(tilt); ctx.scale(sc, sc);
  if (u.invulnT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(w.time * 18));
  if (u.downed) ctx.globalAlpha = 0.75;
  if (spr) {
    let img = u.downed ? spr.grey : u.flashT > 0.06 ? spr.flash : spr.img;
    ctx.drawImage(img, -sizeU / 2, -sizeU / 2, sizeU, sizeU);
    // status washes over the sprite itself rather than rings around it
    if (!u.downed && u.flashT <= 0.06) {
      const chill = u.frozenT > 0 ? 1 : clamp(u.st.chill / 100, 0, 1), poison = clamp(u.st.poison / 100, 0, 1), burn = clamp(u.st.burn / 100, 0, 1);
      if (chill > 0.05) { ctx.globalAlpha = 0.25 + 0.4 * chill; ctx.drawImage(tinted(spr, '#9FDDF6'), -sizeU / 2, -sizeU / 2, sizeU, sizeU); }
      if (poison > 0.05) { ctx.globalAlpha = 0.2 + 0.35 * poison; ctx.drawImage(tinted(spr, '#9BCB3C'), -sizeU / 2, -sizeU / 2, sizeU, sizeU); }
      if (burn > 0.3) { ctx.globalAlpha = (0.12 + 0.2 * burn) * (0.7 + 0.3 * Math.sin(w.time * 25 + u.id)); ctx.drawImage(tinted(spr, '#FF7A2F'), -sizeU / 2, -sizeU / 2, sizeU, sizeU); }
    }
  } else {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, u.vr, 0, TAU); }, u.team === 'hero' ? '#5FA35A' : '#C8553D');
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  if (u.frozenT > 0) drawIce(ctx, u, w);
}

// A tail as a short chain of points that trails the body on springs, so it whips round on turns.
function drawTail(ctx, u, dt) {
  const back = u.facing + Math.PI, seg = u.vr * 0.42, n = 4;
  const ax = u.x + Math.cos(back) * u.vr * 0.85, ay = u.y + Math.sin(back) * u.vr * 0.85;
  if (!u.tail) { u.tail = []; for (let i = 1; i <= n; i++) u.tail.push({ x: ax + Math.cos(back) * seg * i, y: ay + Math.sin(back) * seg * i, vx: 0, vy: 0 }); }
  let px = ax, py = ay, pa = back;
  for (let i = 0; i < n; i++) {
    const p = u.tail[i];
    // where this point would rest: one segment straight back from the one before it
    const rx = px + Math.cos(pa) * seg, ry = py + Math.sin(pa) * seg;
    p.vx += (rx - p.x) * 60 * dt; p.vy += (ry - p.y) * 60 * dt;
    const damp = Math.exp(-dt * 9); p.vx *= damp; p.vy *= damp;
    p.x += p.vx * dt; p.y += p.vy * dt;
    // keep the segment length
    const dx = p.x - px, dy = p.y - py, L = Math.hypot(dx, dy) || 1;
    p.x = px + dx / L * seg; p.y = py + dy / L * seg;
    pa = Math.atan2(p.y - py, p.x - px); px = p.x; py = p.y;
  }
  const path = () => { ctx.beginPath(); ctx.moveTo(ax, ay); for (const p of u.tail) ctx.lineTo(p.x, p.y); };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2 + OUTLINE * 2; path(); ctx.stroke();
  ctx.strokeStyle = '#D8A39A'; ctx.lineWidth = 2.2; path(); ctx.stroke();
  ctx.restore();
}

function drawIce(ctx, u, w) {
  // a block of ice around the unit, seen from above: an outlined, see-through crystal
  const r = u.vr * 1.35;
  ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(u.id);
  const path = () => { ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, rr = r * (i % 2 ? 0.92 : 1.05); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); };
  ctx.globalAlpha = 0.85; ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round'; path(); ctx.stroke();
  ctx.globalAlpha = 0.45; ctx.fillStyle = '#CFF3FF'; path(); ctx.fill();
  ctx.globalAlpha = 0.7; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.2, -r * 0.65); ctx.lineTo(-r * 0.05, -r * 0.5); ctx.lineTo(-r * 0.45, -r * 0.05); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawCorpse(ctx, c) {
  const kind = SPRITE_KIND[c.kind] || c.kind;
  const sizeU = c.vr * 220 / headR(kind);
  const spr = getSprite(kind, sizeU * view.scale * view.dpr); if (!spr) return;
  const k = 1 - c.t / c.max; // 0 -> 1
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.facing - Math.PI / 2 + k * 0.6);
  const sc = 1 + 0.25 * Math.sin(Math.min(1, k * 2.2) * Math.PI / 2) - 0.6 * Math.max(0, k - 0.45);
  ctx.scale(sc, sc); ctx.globalAlpha = clamp(1.4 - k * 1.5, 0, 1);
  ctx.drawImage(k < 0.25 ? spr.flash : spr.img, -sizeU / 2, -sizeU / 2, sizeU, sizeU);
  ctx.restore(); ctx.globalAlpha = 1;
}

// Bars, marks and status meters, upright above or below each unit.
const STATUS = [['burn', '#FF7A2F'], ['chill', '#7FD6F5'], ['poison', '#9BCB3C']];
const SHOW_BARS = false; // health and status bars live in the HUD now (designer, round 2)
function drawOverlay(ctx, u) {
  if (u.downed) return;
  upright(ctx, u.x, u.y, () => {
    if (u.act && (u.act.type === 'windup' || u.act.type === 'slam')) {
      const k = 1 - u.act.t / u.act.max;
      ctx.font = `900 ${18 + 6 * k}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.lineWidth = OUTLINE * 2; ctx.strokeStyle = INK; ctx.strokeText('!', 0, -u.vr - 12); ctx.fillStyle = '#FF6B5A'; ctx.fillText('!', 0, -u.vr - 12);
    }
    if (u.hasKey) inked(ctx, () => { ctx.beginPath(); ctx.arc(u.vr * 0.8, -u.vr * 0.8, 4.5, 0, TAU); }, '#FFD45A');
    let by = u.vr + 8;
    if (SHOW_BARS && (u.team === 'hero' || u.hp < u.maxHp)) {
      const bw = Math.max(26, u.vr * 1.8);
      inked(ctx, () => roundRect(ctx, -bw / 2, by, bw, 3.5, 1.75), '#3A2F3E');
      ctx.fillStyle = u.team === 'hero' ? '#7CC06F' : '#E0604B'; roundRect(ctx, -bw / 2, by, bw * clamp(u.hp / u.maxHp, 0, 1), 3.5, 1.75); ctx.fill();
      by += 3.5 + OUTLINE * 2 + 1;
    }
    // status build-up: a short meter per status, filling to the threshold
    const list = SHOW_BARS ? STATUS.filter(([k]) => u.st[k] >= 3) : [];
    if (list.length) {
      const pw = 14, gap = 4, tot = list.length * pw + (list.length - 1) * gap;
      list.forEach(([k, col], i) => {
        const x = -tot / 2 + i * (pw + gap), max = k === 'chill' ? 100 + u.freezeImmune : 100, f = clamp(u.st[k] / max, 0, 1);
        inked(ctx, () => roundRect(ctx, x, by, pw, 3, 1.5), '#3A2F3E');
        ctx.fillStyle = col; roundRect(ctx, x, by, pw * f, 3, 1.5); ctx.fill();
      });
    }
  });
}

function drawProjectile(ctx, p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
  if (p.kind === 'icicle') {
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -4.5); ctx.lineTo(-7, 4.5); ctx.closePath(); }, '#CFF3FF');
  } else {
    // a bigger arrow: shaft, fletching, head
    const fire = p.kind === 'fireArrow';
    inked(ctx, () => { roundRect(ctx, -17, -1.6, 28, 3.2, 1.6); }, fire ? '#FF8A3D' : '#C99A6A');
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-22, -5); ctx.lineTo(-12, -2); ctx.lineTo(-12, 2); ctx.lineTo(-22, 5); ctx.closePath(); }, '#F1E8DA');
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(9, -5); ctx.lineTo(9, 5); ctx.closePath(); }, fire ? '#FFD45A' : '#DCE0E6');
  }
  ctx.restore();
}

function drawParticle(ctx, p) {
  const k = clamp(p.life / p.max, 0, 1);
  if (p.shape === 'flame') {
    const [ux, uy] = upVec();
    upright(ctx, p.x + ux * (p.up || 0), p.y + uy * (p.up || 0), () => flameShape(ctx, 0, 0, p.size * (0.35 + 0.65 * k), k > 0.5 ? '#FF8A3D' : '#E8582A', '#FFE08A'));
  } else if (p.shape === 'spark') {
    const a = Math.atan2(p.vy, p.vx), len = 6 + 10 * k;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = p.size + OUTLINE * 2; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.restore(); ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = k; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * k), 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
}

function drawSwing(ctx, t) {
  const k = t.t / t.max;
  ctx.save(); ctx.globalAlpha = 0.7 * k; ctx.strokeStyle = t.color; ctx.lineWidth = 6 * k + 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(t.x, t.y, t.r, t.a - t.arc / 2, t.a + t.arc / 2); ctx.stroke(); ctx.restore();
}
function drawRing(ctx, t) {
  const k = 1 - t.t / t.max;
  ctx.save(); ctx.globalAlpha = 0.25 + 0.3 * k; ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * k, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.8; ctx.strokeStyle = t.color; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, TAU); ctx.stroke(); ctx.restore();
}
function drawBlast(ctx, t) {
  const k = 1 - t.t / t.max;
  ctx.save(); ctx.globalAlpha = 0.5 * (1 - k); ctx.fillStyle = t.color || '#FFB347'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * (0.4 + 0.6 * k), 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.8 * (1 - k); ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * (0.5 + 0.5 * k), 0, TAU); ctx.stroke(); ctx.restore();
}
function drawText(ctx, t) {
  const a = clamp(t.life / t.max * 1.6, 0, 1);
  const age = t.max - t.life;
  const pop = t.pop ? 1 + 0.6 * Math.max(0, 1 - age / 0.12) : 1;   // damage numbers land big, then settle
  const [ux, uy] = upVec();
  upright(ctx, t.x + ux * (t.up || 0), t.y + uy * (t.up || 0), () => {
    ctx.globalAlpha = a;
    ctx.font = `800 ${Math.round(15 * (t.size || 1) * pop)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.lineWidth = OUTLINE * 2; ctx.strokeStyle = INK; ctx.strokeText(t.s, 0, 0);
    ctx.fillStyle = t.color; ctx.fillText(t.s, 0, 0);
  });
  ctx.globalAlpha = 1;
}
