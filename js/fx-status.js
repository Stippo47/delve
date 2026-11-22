// Round 13 (lane S): how the new statuses look on a unit (docs/STATUSES.md "How they look"). Marks on and over the
// body (render.js calls drawStatusMarks after fx.js drawStatusFx), and each one's burst (a world fx
// { type: 'statusBurst', kind, unit } from sim.js, drawn by drawStatusBurst: 'ground' under the units, 'air' over).
// No rings round the body: washes (render.js washesOf), body motion (render.js unitFrame) and marks.
//   charm      hearts rising off it, more as it builds; enthralled: a beating heart over its head
//   confuse    a wobbling question mark over the head; addled: two spirals chasing round its head
//   sleepy     slow small z's and a nodding head (unitFrame); asleep keeps the old Zs
//   bleed      red cuts on the body and drops falling (sim.js 'drip' particles); haemorrhage: a spray and a pool
//   fear       sweat flicking off its head and a tremble (unitFrame); terrified: fright lines round the head
import { TAU, clamp, INK } from './util.js';
import { upright, upVec, inked, inkLine, glowDisc, hash, star } from './fx.js';

export function heartPath(ctx, s) { // a heart centred on 0,0 (its point down the screen); the caller strokes and fills it
  ctx.beginPath(); ctx.moveTo(0, s * 0.85);
  ctx.bezierCurveTo(-s * 1.2, 0, -s * 0.9, -s * 0.95, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.9, -s * 0.95, s * 1.2, 0, 0, s * 0.85); ctx.closePath();
}
const heart = (ctx, x, y, s, col) => inked(ctx, () => { ctx.save(); ctx.translate(x, y); heartPath(ctx, s); ctx.restore(); }, col);
const fillOf = (u, k) => clamp(((u.st && u.st[k]) || 0) / 100, 0, 1);

export function drawStatusMarks(ctx, u, T) {
  if (u.downed || u.dead || u.hidden) return;
  const st = u.st || {}, vr = u.vr, [ux, uy] = upVec();
  const head = (k) => [u.x + ux * vr * k, u.y + uy * vr * k];
  // ---- charm
  const enthralled = u.flipKind === 'charm';
  if ((st.charm || 0) > 3 || enthralled) {
    const f = enthralled ? 1 : fillOf(u, 'charm'), n = enthralled ? 3 : 1 + Math.round(2 * f);
    for (let i = 0; i < n; i++) {
      const ph = (T * 0.8 + i / n + u.id * 0.23) % 1, an = (i * 2.4 + u.id) % TAU, rr = vr * 0.75;
      const px = u.x + Math.cos(an) * rr + ux * ph * 26, py = u.y + Math.sin(an) * rr * 0.7 + uy * ph * 26;
      ctx.globalAlpha = Math.sin(ph * Math.PI); upright(ctx, px, py, () => heart(ctx, 0, 0, 3.6 + 2.6 * f, '#FF8AC8')); }
    ctx.globalAlpha = 1;
    if (enthralled) { const [hx, hy] = head(1.45), beat = 1 + 0.18 * Math.max(0, Math.sin(T * 9)) ** 4;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, hx, hy, 16, '#FF8AC8', 0.5); ctx.restore();
      upright(ctx, hx, hy, () => { heart(ctx, 0, 0, 8.5 * beat, '#FF5AAE'); ctx.fillStyle = '#FFE0F0'; ctx.beginPath(); ctx.arc(-3, -2.5, 1.8, 0, TAU); ctx.fill(); }); }
  }
  // ---- confused / addled
  if (u.addledT > 0) {
    const [hx, hy] = head(1.25);
    upright(ctx, hx, hy, () => { for (let i = 0; i < 2; i++) { const a = -T * 6 + i * Math.PI, x = Math.cos(a) * vr * 0.65, y = Math.sin(a) * vr * 0.22;
      inkLine(ctx, () => { ctx.beginPath(); for (let j = 0; j <= 14; j++) { const t = j / 14, r = 1 + 6 * t, b = t * 9 + a * 2; ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } }, '#C9A8F0', 2.4); } });
  } else if ((st.confuse || 0) > 12) {
    const f = fillOf(u, 'confuse'), [hx, hy] = head(1.3), s = 0.7 + 0.5 * f;
    upright(ctx, hx, hy, () => { ctx.rotate(Math.sin(T * 4 + u.id) * 0.35); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, 0.4 + f);
      inkLine(ctx, () => { ctx.beginPath(); ctx.arc(0, -6, 5, Math.PI * 1.05, Math.PI * 0.45, false); ctx.lineTo(0, 3); }, '#C9A8F0', 3.2);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 8, 2.2, 0, TAU); }, '#C9A8F0'); });
    ctx.globalAlpha = 1;
  }
  // ---- sleepy (one small z at a time, slow)
  if ((st.sleepy || 0) > 8 && !(u.sleepT > 0)) {
    const f = fillOf(u, 'sleepy'), ph = (T * 0.4 + u.id * 0.17) % 1, s = 2.6 + 2.4 * f;
    upright(ctx, u.x, u.y, () => { const x = vr * 0.55 + ph * 8, y = -vr * 0.95 - ph * 20; ctx.globalAlpha = Math.sin(ph * Math.PI) * (0.5 + 0.5 * f);
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.lineTo(x + s, y + s); }, '#C9B8FF', 2); });
    ctx.globalAlpha = 1;
  }
  // ---- bleeding: cuts on the body, more as it builds (each one where its own hash puts it)
  if ((st.bleed || 0) > 4) {
    const f = fillOf(u, 'bleed'), n = 1 + Math.round(2 * f);
    for (let i = 0; i < n; i++) { const an = hash(u.id, i, 5) * TAU, rr = vr * (0.25 + 0.45 * hash(i, u.id, 9)), x = u.x + Math.cos(an) * rr, y = u.y + Math.sin(an) * rr, a = an + 0.9, L = 5 + 4 * f;
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); }, '#B0202C', 3); }
  }
  // ---- fear: sweat flicking off the head; terrified, fright lines too
  if ((st.fear || 0) > 8 || u.fearT > 0) {
    const f = u.fearT > 0 ? 1 : fillOf(u, 'fear'), n = 1 + Math.round(2 * f);
    for (let i = 0; i < n; i++) { const ph = (T * 1.8 + i / n + u.id * 0.29) % 1, side = i % 2 ? 1 : -1;
      upright(ctx, u.x, u.y, () => { const x = side * (vr * 0.5 + ph * 12), y = -vr * 0.8 - Math.sin(ph * Math.PI) * 12 + ph * 6; ctx.globalAlpha = 1 - ph;
        inked(ctx, () => { ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.quadraticCurveTo(x + 3, y + 1, x, y + 3); ctx.quadraticCurveTo(x - 3, y + 1, x, y - 4); ctx.closePath(); }, '#9FDDF6'); }); }
    ctx.globalAlpha = 1;
    if (u.fearT > 0) upright(ctx, u.x, u.y, () => { const j = Math.floor(T * 12);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42, r0 = vr * 1.05 + (hash(j, i) * 3), r1 = r0 + 8;
        inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.9 - vr * 0.2); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * 0.9 - vr * 0.2); }, '#FFFFFF', 2.4); } });
  }
}

// The bursts (sim.js fx { type: 'statusBurst', kind, unit, r, max }): each one big enough to read without its word.
export function drawStatusBurst(ctx, f, T, layer) {
  const k = clamp(f.t / f.max, 0, 1), x = f.x, y = f.y, r = f.r || 20, [ux, uy] = upVec();
  if (layer === 'ground') {
    if (f.kind !== 'bleed') return;
    // haemorrhage: a pool of blood spreads under it and fades (no outline: it lies on the ground)
    const a = 0.75 * (1 - k * k);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#7A1420';
    for (let i = 0; i < 9; i++) { const an = hash(i, Math.round(x), 3) * TAU, d = r * (0.4 + 1.4 * hash(i, 7, Math.round(y))) * Math.min(1, k * 4), s = r * (0.22 + 0.3 * hash(i, 11));
      ctx.beginPath(); ctx.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, s, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x, y, r * (0.9 + 0.4 * Math.min(1, k * 3)), 0, TAU); ctx.fill(); ctx.restore();
    return;
  }
  const fade = 1 - k, e = 1 - (1 - k) ** 3;
  ctx.save();
  if (f.kind === 'charm') { // hearts bursting outward, a pink flash
    if (k < 0.3) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r * 2.4, '#FF8AC8', 0.7 * (1 - k / 0.3)); ctx.globalCompositeOperation = 'source-over'; }
    for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + 0.2, d = r * (0.6 + 1.6 * e); ctx.globalAlpha = fade;
      upright(ctx, x + Math.cos(an) * d, y + Math.sin(an) * d * 0.8, () => heart(ctx, 0, 0, 6 * (1 - 0.4 * k), i % 2 ? '#FF5AAE' : '#FF8AC8')); }
  } else if (f.kind === 'uncharm') { // the heart over its head cracks in two and falls away
    const [hx, hy] = [x + ux * r * 1.45, y + uy * r * 1.45];
    ctx.globalAlpha = fade;
    upright(ctx, hx, hy, () => { for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * (2 + 10 * e), 14 * e * e); ctx.rotate(s * 0.6 * e);
      ctx.beginPath(); ctx.rect(s < 0 ? -12 : 0, -12, 12, 24); ctx.clip(); heart(ctx, 0, 0, 8.5, '#FF5AAE'); ctx.restore(); } });
  } else if (f.kind === 'confuse') { // a lilac swirl flashing outward from the head
    const [hx, hy] = [x + ux * r, y + uy * r];
    ctx.globalAlpha = fade;
    inkLine(ctx, () => { ctx.beginPath(); for (let j = 0; j <= 30; j++) { const t = j / 30, rr = (4 + r * 1.6 * t) * (0.5 + 0.5 * e), b = t * 12 + k * 6; ctx.lineTo(hx + Math.cos(b) * rr, hy + Math.sin(b) * rr * 0.8); } }, '#C9A8F0', 3);
    for (let i = 0; i < 4; i++) { const an = i / 4 * TAU + k * 4, d = r * 1.4 * e; inked(ctx, () => star(ctx, hx + Math.cos(an) * d, hy + Math.sin(an) * d * 0.8, 5, 5, 0.45, an), '#FFE14D'); }
  } else if (f.kind === 'sleepy') { // a soft poof of sleep and one big Z
    ctx.globalAlpha = fade * 0.8; for (let i = 0; i < 7; i++) { const an = i / 7 * TAU, d = r * (0.5 + 0.8 * e);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(x + Math.cos(an) * d, y + Math.sin(an) * d * 0.8, r * 0.35 * (1 - 0.4 * k), 0, TAU); }, '#E4DDFF'); }
    ctx.globalAlpha = fade; const s = 9;
    upright(ctx, x, y, () => { const zy = -r * 1.3 - 20 * e; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, zy - s); ctx.lineTo(s, zy - s); ctx.lineTo(-s, zy + s); ctx.lineTo(s, zy + s); }, '#C9B8FF', 3.4); });
  } else if (f.kind === 'bleed') { // a red spray, streaks thrown out all round
    if (k < 0.25) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r * 2, '#FF3A3A', 0.6 * (1 - k / 0.25)); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = fade;
    for (let i = 0; i < 10; i++) { const an = hash(i, 3, Math.round(x)) * TAU, d0 = r * 0.8, d1 = d0 + r * (0.8 + hash(i, 5)) * e;
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * d0, y + Math.sin(an) * d0); ctx.lineTo(x + Math.cos(an) * d1, y + Math.sin(an) * d1); }, i % 2 ? '#C8453D' : '#8A1E28', 3.4 * (1 - 0.5 * k)); }
  } else if (f.kind === 'fear') { // a white fright: jagged lines bursting off the head, a pale flash
    if (k < 0.3) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r * 2, '#F4FFF0', 0.55 * (1 - k / 0.3)); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = fade;
    upright(ctx, x, y, () => { for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.38, r0 = r * (1.1 + 0.5 * e), r1 = r0 + 12;
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 - r * 0.2); ctx.lineTo(Math.cos(a + 0.12) * (r0 + 6), Math.sin(a + 0.12) * (r0 + 6) - r * 0.2); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 - r * 0.2); }, '#FFFFFF', 2.6); } });
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
