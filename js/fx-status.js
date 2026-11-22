// Round 13 (lane S): how the new statuses look on a unit (docs/STATUSES.md "How they look"). Marks on and over the
// body (render.js calls drawStatusMarks after fx.js drawStatusFx), and each one's burst (a world fx
// { type: 'statusBurst', kind, unit } from sim.js, drawn by drawStatusBurst: 'ground' under the units, 'air' over).
// No rings round the body: washes (render.js washesOf), body motion (render.js unitFrame) and marks.
//   charm      hearts rising off it, more as it builds; enthralled: a beating heart over its head
//   confuse    (round 14: "The spiral swirls should be shown when confused appearing on body randomly. Question marks
//              when bursted") little swirls popping up on the body here and there, more as it builds; addled:
//              question marks popping round its head; the burst throws question marks out
//   sleepy     slow small z's and a nodding head (unitFrame); asleep keeps the old Zs
//   bleed      (round 14: "Don't like visual at all": round 13's cuts, drops and dark wash are gone) three looks to
//              pick from, ?v_bleed=N (fxvar.js): 1 Spurts, 2 Trail, 3 Drop. Blood on the floor is drawBloodGround's.
//   fear       sweat flicking off its head and a tremble (unitFrame); terrified: fright lines round the head
import { TAU, clamp, INK } from './util.js';
import { upright, upVec, inked, inkLine, glowDisc, hash, star } from './fx.js';
import { PROJ2 } from './fx2.js';
import { variant } from './fxvar.js';

// The Enchantress's blown kiss and the Cupid's love arrow (sim projectiles of kind 'kiss' / 'loveArrow')
PROJ2.kiss = (ctx, p, T) => { // a pink heart, bobbing as it floats, a trail of little hearts
  const b = 1 + 0.12 * Math.sin(T * 14);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, 0, 0, 16, '#FF8AC8', 0.45); ctx.restore();
  for (let i = 1; i <= 3; i++) { const d = i * 9, a = Math.atan2(p.vy, p.vx); ctx.globalAlpha = 0.6 - i * 0.15; upright(ctx, -Math.cos(a) * d, -Math.sin(a) * d, () => heart(ctx, 0, 0, 4 - i * 0.7, '#FFB0D8')); }
  ctx.globalAlpha = 1; upright(ctx, 0, 0, () => heart(ctx, 0, 0, 8 * b, p.color || '#FF8AC8'));
};
PROJ2.loveArrow = (ctx, p, T, ang) => { // a gold arrow with a heart for a head and a pink wake
  ctx.save(); ctx.rotate(ang);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,138,200,0.45)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-6, 0); ctx.stroke(); ctx.restore();
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(4, 0); }, '#F2C84A', 3);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-30, -5); ctx.lineTo(-27, 0); ctx.lineTo(-30, 5); ctx.closePath(); }, '#FFFFFF');
  ctx.save(); ctx.translate(8, 0); ctx.rotate(-Math.PI / 2); heart(ctx, 0, 0, 6.5, '#FF5AAE'); ctx.restore();
  ctx.restore();
};

export function heartPath(ctx, s) { // a heart centred on 0,0 (its point down the screen); the caller strokes and fills it
  ctx.beginPath(); ctx.moveTo(0, s * 0.85);
  ctx.bezierCurveTo(-s * 1.2, 0, -s * 0.9, -s * 0.95, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.9, -s * 0.95, s * 1.2, 0, 0, s * 0.85); ctx.closePath();
}
const heart = (ctx, x, y, s, col) => inked(ctx, () => { ctx.save(); ctx.translate(x, y); heartPath(ctx, s); ctx.restore(); }, col);
const fillOf = (u, k) => clamp(((u.st && u.st[k]) || 0) / 100, 0, 1);

export function drawStatusMarks(ctx, u, T, w) {
  if (u.koT > 0 && !u.downed && !u.dead) { // lane H2 (round 13, the designer: "knock out doesnt have a visual effect"): stars going round its head
    const [vx, vy] = upVec(), hx = u.x + vx * ((u.vr || u.r) + 10), hy = u.y + vy * ((u.vr || u.r) + 10);
    for (let i = 0; i < 3; i++) { const b = i / 3 * TAU + T * 7; inked(ctx, () => star(ctx, hx + Math.cos(b) * 15, hy + Math.sin(b) * 6, 5, 5, 0.45, b), i % 2 ? '#FFFFFF' : '#FFE66B'); }
  }
  if (u.downed || u.dead || u.hidden) return;
  const st = u.st || {}, vr = u.vr, [ux, uy] = upVec();
  const head = (k) => [u.x + ux * vr * k, u.y + uy * vr * k];
  const above = (d) => [u.x + ux * (vr * 1.15 + d), u.y + uy * (vr * 1.15 + d)]; // over the health bar
  // ---- charm
  const enthralled = u.flipKind === 'charm';
  if ((st.charm || 0) > 3 || enthralled) {
    const f = enthralled ? 1 : fillOf(u, 'charm'), n = enthralled ? 3 : 1 + Math.round(2 * f);
    for (let i = 0; i < n; i++) {
      const ph = (T * 0.8 + i / n + u.id * 0.23) % 1, an = (i * 2.4 + u.id) % TAU, rr = vr * 0.75;
      const px = u.x + Math.cos(an) * rr + ux * ph * 26, py = u.y + Math.sin(an) * rr * 0.7 + uy * ph * 26;
      ctx.globalAlpha = Math.sin(ph * Math.PI); upright(ctx, px, py, () => heart(ctx, 0, 0, 4.6 + 3.4 * f, '#FF8AC8')); }
    ctx.globalAlpha = 1;
    if (enthralled) { const [hx, hy] = above(20), beat = 1 + 0.18 * Math.max(0, Math.sin(T * 9)) ** 4;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, hx, hy, 16, '#FF8AC8', 0.5); ctx.restore();
      upright(ctx, hx, hy, () => { heart(ctx, 0, 0, 10.5 * beat, '#FF5AAE'); ctx.fillStyle = '#FFE0F0'; ctx.beginPath(); ctx.arc(-3, -2.5, 1.8, 0, TAU); ctx.fill(); }); }
  }
  // ---- the Enchantress's Sweetheart: a little heart beside its head while it lasts
  if (u.buffs && u.buffs.some((b) => b.id === 'beloved')) { const [hx, hy] = head(1.25), q = 1 + 0.1 * Math.sin(T * 6);
    upright(ctx, hx, hy, () => heart(ctx, u.vr * 0.75, -2, 5.5 * q, '#FF8AC8')); }
  // ---- confused (round 14): swirls popping up on the body at random spots, more as it builds; addled: question marks
  if (u.addledT > 0) { // three question marks popping in and out round its head, each in its own time and place
    for (let i = 0; i < 3; i++) { const D = 0.9 + 0.25 * i, ph = (T + i * 0.37 + u.id * 0.11) / D, c = Math.floor(ph), p = ph - c;
      const ox = (i - 1) * vr * 0.62 + (hash(u.id, c, i) - 0.5) * vr * 0.3, oy = -vr * 1.1 - 8 - (i === 1 ? 10 : 0) - p * 8, pop = p < 0.15 ? p / 0.15 : 1, a = p > 0.75 ? (1 - p) / 0.25 : 1;
      upright(ctx, u.x, u.y, () => { ctx.translate(ox, oy); ctx.rotate(Math.sin(T * 5 + i * 2 + u.id) * 0.3); const s = (0.9 + 0.35 * hash(c, i, u.id)) * (0.5 + 0.5 * pop) * (1 + 0.25 * (1 - pop)); ctx.scale(s, s); ctx.globalAlpha = a; qmark(ctx); }); }
    ctx.globalAlpha = 1;
  } else if ((st.confuse || 0) > 8) {
    const f = fillOf(u, 'confuse'), n = 1 + Math.round(2 * f);
    for (let i = 0; i < n; i++) { const D = 0.85 + 0.2 * i, ph = (T + i * 0.31 + u.id * 0.17) / D, c = Math.floor(ph), p = ph - c;
      const an = hash(u.id, c, i + 7) * TAU, rr = vr * (0.12 + 0.55 * hash(c, i, u.id + 3)), R = (4.2 + 3.4 * f) * (p < 0.2 ? p / 0.2 : 1), a = p > 0.65 ? (1 - p) / 0.35 : 1, spin = T * 7 * (i % 2 ? -1 : 1);
      upright(ctx, u.x, u.y, () => { ctx.translate(Math.cos(an) * rr, Math.sin(an) * rr * 0.85 - vr * 0.1); ctx.globalAlpha = a; swirl(ctx, R, spin); }); }
    ctx.globalAlpha = 1;
  }
  // ---- sleepy (one small z at a time, slow)
  if ((st.sleepy || 0) > 8 && !(u.sleepT > 0)) {
    const f = fillOf(u, 'sleepy'), ph = (T * 0.4 + u.id * 0.17) % 1, s = 2.6 + 2.4 * f;
    upright(ctx, u.x, u.y, () => { const x = vr * 0.55 + ph * 8, y = -vr * 0.95 - ph * 20; ctx.globalAlpha = Math.sin(ph * Math.PI) * (0.5 + 0.5 * f);
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.lineTo(x + s, y + s); }, '#C9B8FF', 2); });
    ctx.globalAlpha = 1;
  }
  // ---- bleeding (round 14): the picked look (bleedMarks below)
  if ((st.bleed || 0) > 4) bleedMarks(ctx, u, T, w);
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
export function drawStatusBurst(ctx, f, T, layer, w) {
  const k = clamp(f.t / f.max, 0, 1), x = f.x, y = f.y, r = f.r || 20, [ux, uy] = upVec();
  if (f.kind === 'bleed') { haemorrhage(ctx, f, T, layer, w); return; } // round 14: in the picked look
  if (layer === 'ground') return;
  const fade = 1 - k, e = 1 - (1 - k) ** 3;
  ctx.save();
  if (f.kind === 'kissBack' && f.from && f.unit) { // round 14: the Succubus answers a blow (on its cooldown): a kiss flies from her to the striker
    const q = Math.min(1, k / 0.6), a = f.from, b = f.unit, px = a.x + (b.x - a.x) * q, py = a.y + (b.y - a.y) * q, lift = Math.sin(q * Math.PI) * 26;
    if (q < 1) upright(ctx, px, py, () => { ctx.translate(0, -lift); heart(ctx, 0, 0, 7.5 * (1 + 0.15 * Math.sin(T * 20)), '#FF5AAE'); });
    else { const g = (k - 0.6) / 0.4; ctx.globalAlpha = 1 - g; for (let i = 0; i < 5; i++) { const an = i / 5 * TAU + 0.3, d = 8 + 22 * g; upright(ctx, b.x + Math.cos(an) * d, b.y + Math.sin(an) * d * 0.8, () => heart(ctx, 0, 0, 4, '#FFB0D8')); } }
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (f.kind === 'heartstring' && f.from && f.unit) { // a pink thread from her hand to it, sagging and twitching, hearts running along it
    const a = f.from, b = f.unit, sag = 26 * Math.sin(T * 3), mx = (a.x + b.x) / 2 - uy * sag * 0.3 + ux * 0, my = (a.y + b.y) / 2 + Math.abs(sag) * 0.6;
    const end = Math.min(1, f.t / 0.2), x2 = a.x + (b.x - a.x) * end, y2 = a.y + (b.y - a.y) * end, fa = Math.min(1, (f.max - f.t) / 0.15);
    ctx.globalAlpha = fa;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,138,200,0.35)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke(); ctx.restore();
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, x2, y2); }, '#FF8AC8', 3);
    if (end >= 1) for (let i = 0; i < 3; i++) { const q = (T * 0.9 + i / 3) % 1, t1 = 1 - q, px = t1 * t1 * a.x + 2 * t1 * q * mx + q * q * b.x, py = t1 * t1 * a.y + 2 * t1 * q * my + q * q * b.y;
      upright(ctx, px, py, () => heart(ctx, 0, 0, 4.5, '#FF5AAE')); }
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (f.kind === 'kissTo') { // a kiss flying from her to the friend, a pink pop where it lands
    const q = Math.min(1, k / 0.6), px = f.x + (f.unit.x - f.x) * q, py = f.y + (f.unit.y - f.y) * q - Math.sin(q * Math.PI) * 30;
    if (q < 1) upright(ctx, px, py, () => heart(ctx, 0, 0, 8, '#FF8AC8'));
    else { const g = (k - 0.6) / 0.4; ctx.globalAlpha = 1 - g; for (let i = 0; i < 6; i++) { const an = i / 6 * TAU, d = 10 + 26 * g; upright(ctx, f.unit.x + Math.cos(an) * d, f.unit.y + Math.sin(an) * d * 0.8, () => heart(ctx, 0, 0, 4.5, '#FFB0D8')); } }
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (f.kind === 'heartbreakCast') { // her locket flashes: a burst of pink light
    if (k < 0.5) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, 60 * e + 10, '#FF8AC8', 0.6 * (1 - k / 0.5)); }
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (f.kind === 'heartbreak') { // a big heart over it cracks down the middle and the halves fall apart
    const [hx, hy] = [f.unit.x + ux * (r * 1.15 + 20), f.unit.y + uy * (r * 1.15 + 20)], crack = Math.min(1, k / 0.25), fall = Math.max(0, (k - 0.25) / 0.75);
    ctx.globalAlpha = 1 - fall * fall;
    upright(ctx, hx, hy, () => { for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * (1 + 14 * fall), 22 * fall * fall); ctx.rotate(s * 0.8 * fall);
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(s * 2.5, -6); ctx.lineTo(-s * 2, 0); ctx.lineTo(s * 2, 6); ctx.lineTo(0, 16); ctx.lineTo(s * 20, 16); ctx.lineTo(s * 20, -16); ctx.closePath(); ctx.clip();
      heart(ctx, 0, 0, 12, crack < 1 ? '#FF8AC8' : '#FF5AAE'); ctx.restore(); } });
    ctx.restore(); ctx.globalAlpha = 1; return;
  }
  if (f.kind === 'charm') { // hearts bursting outward, a pink flash
    if (k < 0.3) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r * 2.4, '#FF8AC8', 0.7 * (1 - k / 0.3)); ctx.globalCompositeOperation = 'source-over'; }
    for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + 0.2, d = r * (0.6 + 1.6 * e); ctx.globalAlpha = fade;
      upright(ctx, x + Math.cos(an) * d, y + Math.sin(an) * d * 0.8, () => heart(ctx, 0, 0, 6 * (1 - 0.4 * k), i % 2 ? '#FF5AAE' : '#FF8AC8')); }
  } else if (f.kind === 'uncharm') { // the heart over its head cracks in two and falls away
    const [hx, hy] = [x + ux * (r * 1.15 + 20), y + uy * (r * 1.15 + 20)];
    ctx.globalAlpha = fade;
    upright(ctx, hx, hy, () => { for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * (2 + 10 * e), 14 * e * e); ctx.rotate(s * 0.6 * e);
      ctx.beginPath(); ctx.rect(s < 0 ? -12 : 0, -12, 12, 24); ctx.clip(); heart(ctx, 0, 0, 8.5, '#FF5AAE'); ctx.restore(); } });
  } else if (f.kind === 'confuse') { // round 14 ("Question marks when bursted"): question marks burst out of its head
    upright(ctx, x, y, () => { for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + (i - 2) * 0.55, d = r * (0.9 + 1.3 * e), pop = Math.min(1, k / 0.15);
      ctx.save(); ctx.translate(Math.cos(an) * d, Math.sin(an) * d - r * 0.3); ctx.rotate((i - 2) * 0.25 + Math.sin(T * 9 + i) * 0.15); const s = (i === 2 ? 1.35 : 1.05) * (0.4 + 0.6 * pop) * (1 + 0.3 * (1 - pop)); ctx.scale(s, s); ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1; qmark(ctx); ctx.restore(); } });
  } else if (f.kind === 'sleepy') { // a soft poof of sleep and one big Z
    ctx.globalAlpha = fade * 0.8; for (let i = 0; i < 7; i++) { const an = i / 7 * TAU, d = r * (0.5 + 0.8 * e);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(x + Math.cos(an) * d, y + Math.sin(an) * d * 0.8, r * 0.35 * (1 - 0.4 * k), 0, TAU); }, '#E4DDFF'); }
    ctx.globalAlpha = fade; const s = 9;
    upright(ctx, x, y, () => { const zy = -r * 1.3 - 20 * e; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, zy - s); ctx.lineTo(s, zy - s); ctx.lineTo(-s, zy + s); ctx.lineTo(s, zy + s); }, '#C9B8FF', 3.4); });
  } else if (f.kind === 'fear') { // a white fright: jagged lines bursting off the head, a pale flash
    if (k < 0.3) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, x, y, r * 2, '#F4FFF0', 0.55 * (1 - k / 0.3)); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = fade;
    upright(ctx, x, y, () => { for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.38, r0 = r * (1.1 + 0.5 * e), r1 = r0 + 12;
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 - r * 0.2); ctx.lineTo(Math.cos(a + 0.12) * (r0 + 6), Math.sin(a + 0.12) * (r0 + 6) - r * 0.2); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 - r * 0.2); }, '#FFFFFF', 2.6); } });
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- round 14 (lane S, second pass)
// A question mark (Addled), centred on 0,0 in the upright frame, lilac with the ink line.
function qmark(ctx) {
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(0, -6, 5, Math.PI * 1.05, Math.PI * 0.45, false); ctx.lineTo(0, 3); }, '#C9A8F0', 3.2);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 8, 2.2, 0, TAU); }, '#C9A8F0');
}
// A little spiral (Confused), R across, turning with `spin`.
function swirl(ctx, R, spin) {
  if (R < 0.8) return;
  inkLine(ctx, () => { ctx.beginPath(); for (let j = 0; j <= 16; j++) { const t = j / 16, rr = R * (0.12 + 0.88 * t), b = spin + t * TAU * 1.6; ctx.lineTo(Math.cos(b) * rr, Math.sin(b) * rr * 0.85); } }, '#C9A8F0', 2.4);
}

// ---- Bleeding, in three looks (?v_bleed=N; fxvar.js). The blood palette (FX-STYLE): dark #7A2C40, main #C8453D,
// light #FF8A7A. Drops in the air are solid things (inked); blood on the floor is a ground effect (no outline).
//   1 Spurts  a heartbeat (quicker as it builds) squirts a jet of drops from a wound on its side; they splash on the floor.
//             Each beat the body flushes red for a blink (render.js washesOf, bleedFlash). Haemorrhage: it gushes
//             from all round at once and a pool spreads under it.
//   2 Trail   nothing on the body: a pool grows under its feet and it leaves a trail of blood wherever it goes.
//             Haemorrhage: the pool floods out and a crown of blood splashes up round it.
//   3 Drop    a blood drop over its head fills up like a gauge as it builds and throbs with each beat. Haemorrhage: the
//             drop swells and bursts, its blood thrown out all round.
const BLOOD = { dark: '#7A2C40', main: '#C8453D', light: '#FF8A7A', floor: '#8A1C26' };
const isRot = () => upVec()[0] === 1;
const toWorld = (x, y, lx, ly) => (isRot() ? [x - ly, y + lx] : [x + lx, y + ly]); // the upright frame's (lx, ly) on the floor
const bfill = (u) => clamp(((u.st && u.st.bleed) || 0) / 100, 0, 1);
// The heartbeat: beats so far (whole part: which beat; fraction: how far into it), quicker as it builds.
function heartbeat(u, T) {
  const dt = clamp(T - (u._bT ?? T), 0, 0.1); u._bT = T;
  u._bph = (u._bph || 0) + dt / (1.05 - 0.5 * bfill(u));
  return u._bph;
}
export const bleedLook = () => variant('bleed');
// render.js washesOf: Spurts flushes the body red for a blink on each beat (0 when not)
export function bleedFlash(u) {
  if (variant('bleed') !== 1 || !((u.st && u.st.bleed) > 4) || u._bph == null) return 0;
  const q = u._bph % 1; return q < 0.16 ? (0.22 + 0.25 * bfill(u)) * (1 - q / 0.16) : 0;
}
// Blood on the floor: splats kept on the world (w._blood), each fading over its life.
function splat(w, x, y, r, life = 2.6) {
  if (!w) return; const list = w._blood || (w._blood = []);
  list.push({ x, y, r, t0: w.time, life, seed: Math.floor(hash(x | 0, y | 0, list.length) * 1e6) });
  if (list.length > 140) list.splice(0, list.length - 140);
}
function blot(ctx, x, y, r, seed) { // a flat blob of blood: a disc and a few smaller ones round its edge
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  for (let i = 0; i < 4; i++) { const an = hash(seed, i) * TAU, d = r * (0.6 + 0.5 * hash(i, seed)), s = r * (0.3 + 0.3 * hash(seed, i, 7)); ctx.moveTo(x + Math.cos(an) * d + s, y + Math.sin(an) * d); ctx.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, s, 0, TAU); }
  ctx.fill();
}
const drop = (ctx, x, y, s) => inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); }, BLOOD.main);
const DROP_AT = (vr) => [vr * 0.95 + 16, -vr * 1.15 - 2]; // where Drop's gauge sits, upright from the unit: by the right end of its health bar
// a drop shape, its point up the screen (Drop's gauge)
function dropPath(ctx, s) { ctx.beginPath(); ctx.moveTo(0, -s * 1.35); ctx.quadraticCurveTo(s * 0.95, -s * 0.1, s * 0.95, s * 0.35); ctx.arc(0, s * 0.35, s * 0.95, 0, Math.PI); ctx.quadraticCurveTo(-s * 0.95, -s * 0.1, 0, -s * 1.35); ctx.closePath(); }

// Under the units (fx.js drawGroundFx): every splat, and Trail's pool under each bleeding unit.
export function drawBloodGround(ctx, w) {
  const list = w._blood;
  ctx.save(); ctx.fillStyle = BLOOD.floor;
  if (list && list.length) {
    for (const b of list) { const age = w.time - b.t0; if (age < 0 || age > b.life) continue; ctx.globalAlpha = 0.78 * Math.min(1, (b.life - age) / 0.8); blot(ctx, b.x, b.y, b.r * Math.min(1, 0.4 + age * 6), b.seed); }
    if (list.some((b) => w.time - b.t0 > b.life)) w._blood = list.filter((b) => w.time - b.t0 <= b.life);
  }
  if (variant('bleed') === 2) for (const u of w.units) {
    if (u.dead || u.downed || u.hidden || !((u.st && u.st.bleed) > 4)) continue;
    const f = bfill(u), ph = (u._bph || 0) % 1, beat = 1 + 0.06 * Math.max(0, 1 - ph / 0.25);
    ctx.globalAlpha = 0.8; blot(ctx, ...toWorld(u.x, u.y, 0, u.vr * 0.42), u.vr * (0.55 + 0.75 * f) * beat, u.id * 13 + 5);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

function bleedMarks(ctx, u, T, w) {
  const v = variant('bleed'), f = bfill(u), vr = u.vr, ph = heartbeat(u, T), n = Math.floor(ph), q = ph - n;
  if (v === 1) { // Spurts: a jet of drops from the wound in its side on every beat
    const side = hash(u.id, 3) < 0.5 ? -1 : 1, wx = side * vr * 0.6, wy = -vr * 0.1 - 0.25 * vr * hash(u.id, 4), yl = vr * 0.8;
    const L = vr * (0.9 + 1.2 * f), H = vr * (0.45 + 0.4 * f), nd = 3 + Math.round(2 * f), sz = 2.8 + 2.4 * f;
    upright(ctx, u.x, u.y, () => {
      for (let i = 0; i < nd; i++) { const t = (q - i * 0.045) / 0.5; if (t <= 0 || t >= 1) continue;
        const spread = 1 - i * 0.1, x = wx + side * L * t * spread, y = wy + (yl - wy) * t * t - H * 4 * t * (1 - t);
        drop(ctx, x, y, sz * (1 - i * 0.13)); }
    });
    if (w && q > 0.62 && (u._bLand ?? -1) < n) { u._bLand = n; // the jet lands: it splashes on the floor beside it
      const [x, y] = toWorld(u.x, u.y, wx + side * L * 0.95, yl + vr * 0.05); splat(w, x, y, 3.5 + 3.5 * f);
      const [x2, y2] = toWorld(u.x, u.y, wx + side * L * 0.7, yl); splat(w, x2, y2, 2.2 + 2 * f); }
  } else if (v === 2) { // Trail: the pool (drawBloodGround) and a mark left wherever it goes
    if (w) { const l = u._bTrail; if (!l || Math.hypot(u.x - l.x, u.y - l.y) > 14 + 6 * (1 - f) || T - l.t > 0.7) {
      u._bTrail = { x: u.x, y: u.y, t: T }; const [x, y] = toWorld(u.x, u.y, (hash(u.id, n, 2) - 0.5) * vr * 0.6, vr * 0.55); splat(w, x, y, 2.8 + 4.5 * f, 3.2); } }
  } else { // Drop: a gauge over its head, filling as it builds, throbbing on each beat
    const throb = 1 + 0.16 * Math.max(0, 1 - q / 0.22), s = 7.5 * throb;
    upright(ctx, u.x, u.y, () => { ctx.translate(...DROP_AT(vr)); // (beside its health bar, at the right end: the bar is drawn over anything above the head)
      inked(ctx, () => dropPath(ctx, s), '#FFE8E2');
      ctx.save(); dropPath(ctx, s); ctx.clip(); const top = s * 1.3 - (s * 2.65) * Math.max(0.08, f); ctx.fillStyle = BLOOD.main; ctx.fillRect(-s * 1.2, top, s * 2.4, s * 3);
      ctx.fillStyle = BLOOD.light; ctx.fillRect(-s * 1.2, top, s * 2.4, 1.6); ctx.restore();
      ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(-s * 0.38, s * 0.1, s * 0.16, s * 0.32, 0.3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    });
  }
}

// Haemorrhage, the burst (sim.js fx { type: 'statusBurst', kind: 'bleed', unit, max: 2 }), in the picked look.
function haemorrhage(ctx, f, T, layer, w) {
  const v = variant('bleed'), u = f.unit, x = f.x, y = f.y, r = f.r || 20, k = clamp(f.t / 1, 0, 1);
  if (layer === 'ground') {
    if (!f._pooled && w) { f._pooled = true; // the blood it loses lands round it and lies there a while
      if (v === 1) { splat(w, ...toWorld(x, y, 0, r * 0.3), r * 1.0, 4); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.4, [px, py] = toWorld(x, y, Math.cos(a) * r * 1.9, Math.sin(a) * r * 1.2 + r * 0.5); splat(w, px, py, r * 0.32, 4); } }
      if (v === 2) { splat(w, ...toWorld(x, y, 0, r * 0.3), r * 1.5, 4.5); for (let i = 0; i < 8; i++) { const a = hash(i, 9) * TAU, d = r * (1.4 + 0.8 * hash(i, 4)); splat(w, x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.22 + 0.15 * hash(i, 5)), 4.5); } }
      if (v === 3) splat(w, ...toWorld(x, y, 0, r * 0.3), r * 0.8, 3.5);
    }
    if (v === 2 && k < 1) { ctx.save(); ctx.fillStyle = BLOOD.floor; ctx.globalAlpha = 0.85 * (1 - k * k); blot(ctx, ...toWorld(x, y, 0, r * 0.3), r * (0.9 + 1.0 * (1 - (1 - Math.min(1, k * 2.5)) ** 2)), 77); ctx.restore(); } // the pool floods out
    return;
  }
  if (k >= 1) return;
  const e = 1 - (1 - k) ** 3;
  ctx.save();
  if (v === 1) { // a gush from all round at once: six jets out and down
    upright(ctx, x, y, () => { for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + 0.4, dx = Math.cos(a), sx = r * 0.6 * dx, sy = -r * 0.25 + Math.sin(a) * r * 0.3;
      for (let i = 0; i < 4; i++) { const t = clamp((k - i * 0.05) / 0.6, 0, 1); if (t <= 0 || t >= 1) continue;
        const px = sx + dx * r * 1.4 * t * (1 - i * 0.08), py = sy + (r * 0.9 - sy) * t * t - r * (0.5 + 0.3 * Math.abs(Math.sin(a))) * 4 * t * (1 - t);
        drop(ctx, px, py, (4.6 - i * 0.7)); } } });
  } else if (v === 2) { // a crown of blood splashes up round it and falls back
    upright(ctx, x, y, () => { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, t = clamp(k / 0.7, 0, 1); if (t >= 1) continue;
      const px = Math.cos(a) * r * (0.9 + 1.0 * t), py = r * 0.35 + Math.sin(a) * r * 0.45 * (0.9 + t) - r * 1.1 * 4 * t * (1 - t) * (0.7 + 0.3 * hash(i, 2));
      drop(ctx, px, py, 3.8 * (1 - 0.4 * t)); } });
  } else { // the drop swells over its head and bursts, its blood thrown out all round
    const [lx, ly] = DROP_AT(r), [hx, hy] = toWorld(u ? u.x : x, u ? u.y : y, lx, ly);
    if (k < 0.18) upright(ctx, hx, hy, () => { const s = 7.5 * (1 + 0.9 * (k / 0.18)); inked(ctx, () => dropPath(ctx, s), BLOOD.main); });
    else { const t = (k - 0.18) / 0.82;
      if (t < 0.25) { ctx.globalCompositeOperation = 'lighter'; glowDisc(ctx, hx, hy, 26, '#FF8A7A', 0.7 * (1 - t / 0.25)); ctx.globalCompositeOperation = 'source-over'; inked(ctx, () => star(ctx, hx, hy, 14 * (1 - t), 6, 0.4, 0.3), '#FFFFFF'); }
      upright(ctx, hx, hy, () => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, px = Math.cos(a) * 30 * e, py = Math.sin(a) * 18 * e + 46 * t * t; ctx.globalAlpha = 1 - t * t; drop(ctx, px, py, 3.6 * (1 - 0.4 * t)); } }); }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
