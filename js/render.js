// Canvas renderer for one room. Everything is drawn in room units and scaled to fit the screen.
import { getSprite, headR } from './sprites.js';
import { INK, TAU, clamp } from './util.js';

export const view = { scale: 1, ox: 0, oy: 0, dpr: 1, cw: 0, ch: 0 };

export function layout(canvas, W, H, topPad, sidePad = 10) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
  const s = Math.min((cw - sidePad * 2) / W, (ch - topPad - sidePad) / H);
  view.scale = s; view.dpr = dpr; view.cw = cw; view.ch = ch;
  view.ox = (cw - W * s) / 2; view.oy = topPad + (ch - topPad - sidePad - H * s) / 2;
}

let floorCache = null;
function floor(w) {
  const key = w.W + 'x' + w.H + ':' + view.scale.toFixed(3) + ':' + view.dpr;
  if (floorCache && floorCache.key === key && floorCache.w === w) return floorCache.c;
  const pad = 26;
  const c = document.createElement('canvas');
  const s = view.scale * view.dpr;
  c.width = Math.ceil((w.W + pad * 2) * s); c.height = Math.ceil((w.H + pad * 2) * s);
  const g = c.getContext('2d');
  g.scale(s, s); g.translate(pad, pad);
  // wall frame
  g.fillStyle = INK; roundRect(g, -pad, -pad, w.W + pad * 2, w.H + pad * 2, 22); g.fill();
  g.fillStyle = '#6B5D52'; roundRect(g, -pad + 6, -pad + 6, w.W + pad * 2 - 12, w.H + pad * 2 - 12, 18); g.fill();
  g.fillStyle = '#5A4D44'; g.fillRect(-pad + 6, w.H / 2, w.W + pad * 2 - 12, w.H / 2 + pad - 8);
  // floor
  const fg = g.createLinearGradient(0, 0, 0, w.H); fg.addColorStop(0, '#E2D6BE'); fg.addColorStop(1, '#D3C5A9');
  g.fillStyle = fg; roundRect(g, 0, 0, w.W, w.H, 8); g.fill();
  g.save(); roundRect(g, 0, 0, w.W, w.H, 8); g.clip();
  const T = 60;
  for (let y = 0; y < w.H; y += T) for (let x = (y / T) % 2 ? -T / 2 : 0; x < w.W; x += T) {
    g.fillStyle = ((x + y) / T) % 3 < 1 ? 'rgba(160,140,110,0.10)' : 'rgba(255,255,255,0.08)';
    roundRect(g, x + 3, y + 3, T - 6, T - 6, 10); g.fill();
  }
  g.fillStyle = 'rgba(43,34,48,0.10)'; g.fillRect(0, 0, w.W, 10);
  g.restore();
  floorCache = { key, c, w, pad };
  return c;
}

function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }

const SPRITE_KIND = { boss: 'boss', slimeSmall: 'slimeSmall' };

export function draw(ctx, w, opts = {}) {
  const s = view.scale, d = view.dpr;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.fillStyle = '#2F2734'; ctx.fillRect(0, 0, view.cw, view.ch);
  const sh = w.shake > 0 ? (Math.random() - 0.5) * w.shake : 0, sv = w.shake > 0 ? (Math.random() - 0.5) * w.shake : 0;
  ctx.setTransform(d * s, 0, 0, d * s, d * (view.ox + sh), d * (view.oy + sv));
  const fl = floor(w);
  ctx.drawImage(fl, -floorCache.pad, -floorCache.pad, fl.width / (s * d), fl.height / (s * d));
  drawDoors(ctx, w, opts);
  for (const h of w.hazards) drawHazard(ctx, h, w.time);
  for (const p of w.pickups) drawPickup(ctx, p, w.time);
  for (const p of w.pillars) drawPillar(ctx, p);
  // shadows
  ctx.fillStyle = 'rgba(43,34,48,0.18)';
  for (const u of w.units) { ctx.beginPath(); ctx.ellipse(u.x + 2, u.y + u.r * 0.55, u.r * 1.05, u.r * 0.5, 0, 0, TAU); ctx.fill(); }
  for (const t of w.telegraphs) if (t.type === 'ring') drawRing(ctx, t);
  const order = [...w.units].sort((a, b) => (a.downed ? -1 : 0) - (b.downed ? -1 : 0) || a.y - b.y);
  for (const u of order) drawUnit(ctx, u, w);
  for (const p of w.projectiles) drawProjectile(ctx, p);
  for (const p of w.particles) { ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * p.life / p.max), 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  for (const t of w.telegraphs) if (t.type === 'swing') drawSwing(ctx, t); else if (t.type === 'blast') drawBlast(ctx, t);
  for (const t of w.texts) drawText(ctx, t);
}

function drawDoors(ctx, w, opts) {
  const dh = 110;
  ctx.fillStyle = '#3A3036';
  ctx.fillRect(-22, w.H / 2 - dh / 2, 18, dh);
  ctx.fillStyle = w.cleared ? '#F4E3B5' : '#3A3036';
  ctx.fillRect(w.W + 4, w.H / 2 - dh / 2, 18, dh);
  if (!w.cleared) { ctx.fillStyle = '#8F97A3'; for (let i = 0; i < 4; i++) ctx.fillRect(w.W + 6 + (i % 2) * 6, w.H / 2 - dh / 2 + 10 + i * 24, 6, 16); }
  else { ctx.fillStyle = 'rgba(255,225,140,0.25)'; ctx.beginPath(); ctx.ellipse(w.W - 10, w.H / 2, 40, dh / 2 + 10, 0, 0, TAU); ctx.fill(); }
}

function drawHazard(ctx, h, t) {
  ctx.save();
  if (h.type === 'oil') {
    ctx.fillStyle = INK; blob(ctx, h.x, h.y, h.r + 4, 7, h.x * 0.1); ctx.fill();
    ctx.fillStyle = '#3B3330'; blob(ctx, h.x, h.y, h.r, 7, h.x * 0.1); ctx.fill();
    ctx.fillStyle = 'rgba(160,140,200,0.35)'; ctx.beginPath(); ctx.ellipse(h.x - h.r * 0.3, h.y - h.r * 0.35, h.r * 0.35, h.r * 0.14, -0.4, 0, TAU); ctx.fill();
  } else if (h.type === 'fire') {
    const k = 1 + Math.sin(t * 14 + h.x) * 0.05;
    ctx.fillStyle = INK; blob(ctx, h.x, h.y, h.r + 4, 7, h.x * 0.1); ctx.fill();
    ctx.fillStyle = '#E8582A'; blob(ctx, h.x, h.y, h.r * k, 7, h.x * 0.1 + t); ctx.fill();
    ctx.fillStyle = '#FFB347'; blob(ctx, h.x, h.y, h.r * 0.62 * k, 6, -t * 1.3); ctx.fill();
    ctx.fillStyle = '#FFE58A'; blob(ctx, h.x, h.y, h.r * 0.28, 5, t * 2); ctx.fill();
  } else if (h.type === 'gas') {
    const a = h.max ? clamp(h.t / h.max, 0, 1) : 1;
    ctx.globalAlpha = 0.55 * a;
    ctx.fillStyle = '#9BCB3C';
    for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU + t * 0.6; ctx.beginPath(); ctx.arc(h.x + Math.cos(ang) * h.r * 0.45, h.y + Math.sin(ang) * h.r * 0.45, h.r * 0.55, 0, TAU); ctx.fill(); }
  } else if (h.type === 'spikes') {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9C9184'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU, rr = i === 0 ? 0 : h.r * 0.55;
      const x = h.x + Math.cos(a) * rr, y = h.y + Math.sin(a) * rr;
      ctx.fillStyle = INK; tri(ctx, x, y, 9); ctx.fill();
      ctx.fillStyle = '#DCE0E6'; tri(ctx, x, y, 6); ctx.fill();
    }
  }
  ctx.restore();
}

function drawPillar(ctx, p) {
  ctx.fillStyle = 'rgba(43,34,48,0.22)'; ctx.beginPath(); ctx.ellipse(p.x + 5, p.y + p.r * 0.45, p.r * 1.1, p.r * 0.6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r);
  g.addColorStop(0, '#B8AC9A'); g.addColorStop(1, '#857A6C');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
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

function drawPickup(ctx, p, t) {
  if (p.type === 'coin') {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F2B53A'; ctx.beginPath(); ctx.arc(p.x, p.y, 4.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(p.x - 1.4, p.y - 1.4, 1.8, 0, TAU); ctx.fill();
  } else if (p.type === 'key') {
    const b = Math.sin(t * 5) * 2;
    ctx.save(); ctx.translate(p.x, p.y + b);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, -6, 9, 0, TAU); ctx.fill(); ctx.fillRect(-4, -4, 8, 20);
    ctx.fillStyle = '#FFD45A'; ctx.beginPath(); ctx.arc(0, -6, 5.5, 0, TAU); ctx.fill(); ctx.fillRect(-1.5, -2, 3, 16); ctx.fillRect(0, 9, 6, 3);
    ctx.restore();
  } else if (p.type === 'chest') {
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(43,34,48,0.2)'; ctx.beginPath(); ctx.ellipse(2, 14, 26, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; roundRect(ctx, -24, -18, 48, 36, 8); ctx.fill();
    ctx.fillStyle = p.open ? '#7A4A26' : '#A0683A'; roundRect(ctx, -19, -13, 38, 26, 5); ctx.fill();
    ctx.fillStyle = '#F2B53A'; ctx.fillRect(-19, -3, 38, 6);
    if (!p.open) { ctx.fillStyle = INK; roundRect(ctx, -6, -6, 12, 12, 3); ctx.fill(); ctx.fillStyle = '#FFE08A'; ctx.fillRect(-2, -3, 4, 6); }
    else { ctx.fillStyle = '#FFE7A0'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(0, -10, 16, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

function drawUnit(ctx, u, w) {
  const s = view.scale * view.dpr;
  const kind = SPRITE_KIND[u.kind] || u.kind;
  const sizeU = u.r * 220 / headR(kind);
  const spr = getSprite(kind, sizeU * s);
  ctx.save();
  ctx.translate(u.x, u.y);
  // status rings under the unit
  statusRing(ctx, u);
  let sc = 1;
  if (u.flashT > 0) sc = 1.07;
  if (!u.downed && Math.hypot(u.vx, u.vy) > 10) sc *= 1 + Math.sin(u.bob) * 0.018;
  ctx.rotate(u.downed ? u.facing - Math.PI / 2 + 0.6 : u.facing - Math.PI / 2);
  ctx.scale(sc, sc);
  if (u.invulnT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(w.time * 18));
  if (u.downed) ctx.globalAlpha = 0.75;
  if (spr) {
    const img = u.downed ? spr.grey : u.flashT > 0.06 ? spr.flash : spr.img;
    ctx.drawImage(img, -sizeU / 2, -sizeU / 2, sizeU, sizeU);
  } else {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, u.r + 3, 0, TAU); ctx.fill();
    ctx.fillStyle = u.team === 'hero' ? '#5FA35A' : '#C8553D'; ctx.beginPath(); ctx.arc(0, 0, u.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (u.frozenT > 0) {
    ctx.fillStyle = INK; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 7, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.6; ctx.fillStyle = '#BFEFFF'; ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 4, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.8; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(u.x - u.r * 0.4, u.y - u.r * 0.45, u.r * 0.35, u.r * 0.16, -0.6, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (u.act && (u.act.type === 'windup' || u.act.type === 'slam')) {
    const k = 1 - u.act.t / u.act.max;
    ctx.fillStyle = INK; ctx.font = `900 ${18 + 6 * k}px system-ui, sans-serif`; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeText('!', u.x, u.y - u.r - 10); ctx.fillStyle = '#FF6B5A'; ctx.fillText('!', u.x, u.y - u.r - 10);
  }
  if (u.hasKey && !u.downed) { ctx.fillStyle = '#FFD45A'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(u.x + u.r * 0.8, u.y - u.r * 0.8, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
  // hp bar for damaged enemies and all heroes
  if (!u.downed && (u.team === 'hero' || u.hp < u.maxHp)) {
    const bw = Math.max(26, u.r * 1.8), bx = u.x - bw / 2, by = u.y + u.r + 7;
    ctx.fillStyle = INK; roundRect(ctx, bx - 2, by - 2, bw + 4, 7, 3); ctx.fill();
    ctx.fillStyle = u.team === 'hero' ? '#7CC06F' : '#E0604B';
    roundRect(ctx, bx, by, bw * clamp(u.hp / u.maxHp, 0, 1), 3, 1.5); ctx.fill();
  }
}

function statusRing(ctx, u) {
  const st = u.st; const r = u.r + 5;
  const arcs = [['burn', '#FF7A2F', 100], ['chill', '#7FD6F5', 100 + u.freezeImmune], ['poison', '#9BCB3C', 100]];
  let start = Math.PI * 0.5;
  for (const [k, c, max] of arcs) {
    const v = st[k]; if (v < 3) continue;
    const span = clamp(v / max, 0, 1) * TAU * 0.33;
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, r, start, start + span); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, start, start + span); ctx.stroke();
    start += TAU * 0.333;
  }
}

function drawProjectile(ctx, p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
  if (p.kind === 'icicle') {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -5); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#CFF3FF'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -2.8); ctx.lineTo(-5, 2.8); ctx.closePath(); ctx.fill();
  } else {
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.strokeStyle = p.kind === 'fireArrow' ? '#FF8A3D' : '#C99A6A'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(8, 0); ctx.stroke();
    ctx.fillStyle = p.kind === 'fireArrow' ? '#FFD45A' : '#DCE0E6'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(6, -3.5); ctx.lineTo(6, 3.5); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
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
  ctx.save(); ctx.globalAlpha = 0.55 * (1 - k); ctx.fillStyle = t.color || '#FFB347'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * (0.4 + 0.6 * k), 0, TAU); ctx.fill(); ctx.restore();
}
function drawText(ctx, t) {
  const a = clamp(t.life / t.max * 1.6, 0, 1);
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `800 ${Math.round(15 * (t.size || 1))}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.lineWidth = 4.5; ctx.strokeStyle = INK; ctx.strokeText(t.s, t.x, t.y);
  ctx.fillStyle = t.color; ctx.fillText(t.s, t.x, t.y);
  ctx.restore();
}
