// Round 13 (lane E): what the newer enemies need drawn beyond their art, kept out of render.js (which calls in here
// from a few marked lines). Everything is in room units, in the room's frame.
//   drawFoeGround   under everything that stands: a yeti's snowball track, a burrower's mound
//   snowRoll        over a yeti's snowball: it turns as it rolls (two bands round it, moving with the roll)
import { INK, TAU, clamp } from './util.js';
import { OUTLINE } from './render.js';

// ---------------------------------------------------------------- under everything
export function drawFoeGround(ctx, w) {
  const tr = w.snowTrack;
  if (tr && tr.length) { // pressed snow: a pale band with a faint darker rim, fading out over its seconds
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const B = 6; // by age, in a few bands, each one path (so the band's own overlaps don't darken it)
    for (const pass of [0, 1]) for (let k = 0; k < B; k++) {
      ctx.beginPath(); let any = false, wd = 0;
      for (const s of tr) { const age = clamp((w.time - s.t) / 7, 0, 1); if (Math.min(B - 1, Math.floor(age * B)) !== k) continue; ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); any = true; wd = Math.max(wd, s.r * 2); }
      if (!any) continue;
      const a = 1 - (k + 0.5) / B;
      if (pass === 0) { ctx.strokeStyle = `rgba(96,128,160,${0.16 * a})`; ctx.lineWidth = wd * 1.08; }
      else { ctx.strokeStyle = `rgba(255,255,255,${0.42 * a})`; ctx.lineWidth = wd * 0.86; }
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- a yeti's snowball, rolling
// Seen from above a ball turning about the axis across its way: two bands round it (great circles through that axis)
// sweep across its face from front to back as it rolls; only their halves on the top of the ball show. A crack or two
// as it's chipped; a white flash when a shot lands.
export function snowRoll(ctx, p) {
  const r = p.r, a = p.rollA || 0, ax = -Math.sin(a), ay = Math.cos(a), dx = Math.cos(a), dy = Math.sin(a);
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.97, 0, TAU); ctx.clip();
  ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(120,160,200,0.42)'; ctx.lineWidth = Math.max(1.4, r * 0.09);
  for (let i = 0; i < 2; i++) {
    const ph = (p.roll || 0) + i * Math.PI / 2;
    // the circle through the axis at angle ph from straight up: points cos(t)*axis + sin(t)*(sin(ph)*fwd ...)
    const c = Math.cos(ph), s = Math.sin(ph);
    ctx.beginPath();
    for (let k = 0; k <= 24; k++) {
      const t = k / 24 * Math.PI; // the half on top: sin(t) * c >= 0 when c > 0, else the other half
      const tt = c >= 0 ? t : -t;
      const x = Math.cos(tt) * r * 0.95, y = Math.sin(tt) * s * r * 0.95; // (across, along) the way it rolls
      const px = ax * x + dx * y, py = ay * x + dy * y;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(c);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const hurt = p.maxHp ? 1 - p.hp / p.maxHp : 0; // chipped: a crack or two
  if (hurt > 0.35) {
    ctx.strokeStyle = 'rgba(90,120,150,0.75)'; ctx.lineWidth = Math.max(1.2, r * 0.06); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.2); ctx.lineTo(-r * 0.15, -r * 0.05); ctx.lineTo(-r * 0.05, r * 0.3); ctx.lineTo(r * 0.25, r * 0.4);
    if (hurt > 0.65) { ctx.moveTo(r * 0.55, -r * 0.35); ctx.lineTo(r * 0.2, -r * 0.15); ctx.lineTo(r * 0.3, r * 0.1); }
    ctx.stroke();
  }
  if (p.hitT > 0) { ctx.fillStyle = `rgba(255,255,255,${clamp(p.hitT / 0.12, 0, 1) * 0.6})`; ctx.fillRect(-r, -r, r * 2, r * 2); }
  ctx.restore();
}
export { INK, OUTLINE };
