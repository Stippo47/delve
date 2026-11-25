// Round 15 (lane N): how the six newer heroes' kits (kits3.js) look, in the one effects style (docs/FX-STYLE.md):
// solid things inked, light additive and never outlined, ground effects soft-edged and under the units, nothing that
// matters thinner than 3 units, no words, no blur. It fills fx2.js's tables (DRAW2: 'k2' fx by `draw` name; PROJ2:
// shots by kind) and looks2.js WALL2 (a timed wall by kind: render.js), and draws Shackled's marks on a unit
// (drawMarks3, called by render.js after the other statuses' marks).
// Looks that were an open guess come in graded takes (js/fxvar.js, ?v_<key>=N): `shackle` (1 Irons, 2 Wound, 3 Staked)
// and `timeBubble` (1 Dial, 2 Glass). Take 1 is the game's.
import { TAU, clamp, INK } from './util.js';
import { inked, inkLine, glowDisc, star, upright, upVec, hash, easeOut, flame, roundRect, trail } from './fx.js';
import { PROJ2, DRAW2, IMPACT2D } from './fx2.js';
import { WALL2 } from './looks2.js';
import { drawPuddle } from './puddles.js';
import { drawPillarThemed } from './scenery.js';
import { variant } from './fxvar.js';
import { castShadow } from './height.js'; // round 19 (lane sys19): one shadow system

const k01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, k) => a + (b - a) * k;
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const fade = (f, i = 0.12, o = 0.3) => clamp(Math.min(f.t / i, (f.max - f.t) / o, 1), 0, 1);
const live = (u) => u && !u.dead && !u.downed;
// palettes (dark / main / light)
const EARTH = ['#7A6A58', '#A99C8B', '#E9DDC2'], IRON = ['#4E5564', '#8A94A6', '#C9D2DE'], BRASS = ['#8A6424', '#DEAF59', '#F6E3A6'], FORCE = ['#7A4FC2', '#B58CFF', '#E2D0FF'], WIND = ['#C9D2DE', '#EEF3F8', '#FFFFFF'];
let K = null; // fxkit's pieces (streak, dustPuffs, EL), handed over by installFx3
export function installFx3(api) {
  K = api;
  const EL3 = { pileOn: 'earth', surround: 'earth', scatter: 'earth', rewind: 'holy', timeBubble: 'frost', stopClock: 'holy', gale: 'steel', updraft: 'steel', cyclone: 'steel',
    manacle: 'steel', nullify: 'steel', chainGang: 'steel', hurl: 'necro', levitate: 'necro', mindShield: 'necro', earthquake: 'earth', spikeChain: 'earth', stoneWall: 'earth' };
  for (const [k, v] of Object.entries(EL3)) if (!(k in api.CAST_EL)) api.CAST_EL[k] = v;
  // how the new shots burst: brass for the clock hand, steel for the manacles and the gust; her stone like any stone
  Object.assign(api.IMPACT_EL, { clockHand: 'holy', manacles: 'steel', gust: 'steel' });
  IMPACT2D.tkStone = (ctx, m, k) => IMPACT2D.stone(ctx, m, k);
}

// ---------------------------------------------------------------- small shapes
// a soft puff of dust (light: no outline)
const dust = (ctx, x, y, r, a, col = '#E9DDC2') => { if (a <= 0.01 || r < 0.5) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); };
// a lump of rock: an inked irregular polygon
function rock(ctx, x, y, r, seed, col = EARTH[1], hi = EARTH[2], rot = 0) {
  const n = 7, pts = []; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, rr = r * (0.72 + 0.4 * hash(seed, i)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  inked(ctx, () => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); }, col);
  ctx.fillStyle = hi; ctx.beginPath(); ctx.moveTo(pts[5][0], pts[5][1]); ctx.lineTo(pts[6][0], pts[6][1]); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
}
// a stone spike standing out of the floor (it leans up the screen: top-down), h high, wd half-wide at the base
function spike(ctx, x, y, h, wd, lean = 0, col = EARTH[1], hi = EARTH[2]) {
  if (h < 1) return;
  upright(ctx, x, y, () => {
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-wd, 0); ctx.lineTo(lean * h, -h); ctx.lineTo(wd, 0); ctx.quadraticCurveTo(0, wd * 0.55, -wd, 0); ctx.closePath(); }, col);
    ctx.fillStyle = hi; ctx.beginPath(); ctx.moveTo(-wd * 0.7, -1); ctx.lineTo(lean * h, -h + 2); ctx.lineTo(-wd * 0.05, -1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = EARTH[0]; ctx.beginPath(); ctx.moveTo(wd * 0.25, -1); ctx.lineTo(lean * h, -h + 3); ctx.lineTo(wd * 0.8, -1); ctx.closePath(); ctx.fill();
  });
}
// one chain link (an inked iron ring, long along a)
function link(ctx, x, y, a, s = 1, col = IRON[1]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 4.6 * s, 2.7 * s, 0, 0, TAU); }, col, 2.2 * s); ctx.restore(); }
// a chain from a to b that hangs slack by `sag`
function chain(ctx, x1, y1, x2, y2, sag = 0, s = 1, col = IRON[1]) {
  const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.round(L / (7.5 * s))), nx = -(y2 - y1) / (L || 1), ny = (x2 - x1) / (L || 1);
  for (let i = 0; i <= n; i++) { const k = i / n, o = Math.sin(k * Math.PI) * sag; link(ctx, lerp(x1, x2, k) + nx * o, lerp(y1, y2, k) + ny * o, Math.atan2(y2 - y1, x2 - x1) + (i % 2 ? 0.5 : -0.5), s, col); }
}
// an iron cuff: a ring, open by `gap` radians when it hasn't closed yet
function cuff(ctx, x, y, r, a, gap = 0) {
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y, r, a + gap / 2, a + TAU - gap / 2); }, IRON[1], 3.4);
  ctx.save(); ctx.strokeStyle = IRON[2]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r, a + 2.2, a + 3.4); ctx.stroke(); ctx.restore();
}
function padlock(ctx, x, y, s) {
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y - 3.5 * s, 3.6 * s, Math.PI, 0); }, IRON[2], 2.2 * s);
  inked(ctx, () => roundRect(ctx, x - 5.5 * s, y - 3.5 * s, 11 * s, 9 * s, 2 * s), BRASS[1]);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y + 0.6 * s, 1.5 * s, 0, TAU); ctx.fill(); ctx.fillRect(x - 0.7 * s, y + 0.6 * s, 1.4 * s, 3 * s);
}
// a speech bubble (white, inked, its tail down-left) with a red bar struck across it: no word from this one
function hushMark(ctx, x, y, s) {
  inked(ctx, () => { ctx.beginPath(); ctx.ellipse(x, y, 10 * s, 7.5 * s, 0, 0, TAU); ctx.moveTo(x - 6 * s, y + 4.5 * s); ctx.lineTo(x - 10 * s, y + 11 * s); ctx.lineTo(x - 1.5 * s, y + 6.5 * s); ctx.closePath(); }, '#FFFBEA');
  ctx.fillStyle = INK; for (const dx of [-4.5, 0, 4.5]) { ctx.beginPath(); ctx.arc(x + dx * s, y, 1.3 * s, 0, TAU); ctx.fill(); }
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x - 11 * s, y + 7 * s); ctx.lineTo(x + 11 * s, y - 7 * s); }, '#E5484D', 3 * s);
}
// a clock face on the floor: ticks round the rim and two hands at angles h1, h2 (no fill: the floor shows through)
function dial(ctx, x, y, r, h1, h2, a = 1, ticks = 12) {
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < ticks; i++) { const b = i / ticks * TAU, big = i % 3 === 0, r0 = r - (big ? 9 : 5); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x + Math.cos(b) * r0, y + Math.sin(b) * r0); ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); }, BRASS[1], big ? 3.4 : 2.2); }
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(h1) * r * 0.78, y + Math.sin(h1) * r * 0.78); }, BRASS[2], 3);
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(h2) * r * 0.5, y + Math.sin(h2) * r * 0.5); }, BRASS[1], 4.2);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); }, BRASS[2]);
  ctx.restore();
}
// a streak of wind: a curved white stroke, inked, from (x, y) along a
function gustLine(ctx, x, y, a, len, bend, wd = 3, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(a);
  inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, bend, len, 0); }, WIND[1], wd);
  ctx.restore();
}
const handOf = (u) => (u ? [u.x + Math.cos(u.facing) * (u.r + 4), u.y + Math.sin(u.facing) * (u.r + 4)] : [0, 0]);

// ---------------------------------------------------------------- shots
// the Warden's manacles: two iron cuffs on a short chain, turning as they fly
PROJ2.manacles = (ctx, p, T, ang, sp) => {
  ctx.save(); ctx.rotate(ang); trail(ctx, sp, 34, 7, IRON[2]); ctx.restore();
  ctx.rotate(T * 16);
  chain(ctx, -9, 0, 9, 0, 0, 0.8); cuff(ctx, -13, 0, 6.5, 0, 0.9); cuff(ctx, 13, 0, 6.5, Math.PI, 0.9);
};
// the Clockmaker's clock hand: a brass hand with a ring at its foot, flying point first
PROJ2.clockHand = (ctx, p, T, ang, sp) => {
  ctx.rotate(ang); trail(ctx, sp, 38, 6, BRASS[2]);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(3, -4.5); ctx.lineTo(-9, -1.6); ctx.lineTo(-9, 1.6); ctx.lineTo(3, 4.5); ctx.closePath(); }, BRASS[1]);
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(-13, 0, 4, 0, TAU); }, BRASS[2], 2.4);
  ctx.fillStyle = BRASS[2]; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(4, -2); ctx.lineTo(4, 0.4); ctx.closePath(); ctx.fill();
};
// the Air Mage's gust: a crescent of wind, hollow behind, two thin lines trailing
PROJ2.gust = (ctx, p, T, ang, sp) => {
  ctx.rotate(ang); const s = 1 + 0.08 * Math.sin(T * 30);
  lit(ctx, () => glowDisc(ctx, 0, 0, 20, '#DDEFFA', 0.3));
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-4, -15 * s); ctx.quadraticCurveTo(15, 0, -4, 15 * s); ctx.quadraticCurveTo(5, 0, -4, -15 * s); ctx.closePath(); }, WIND[1]);
  for (const sd of [-1, 1]) inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-8, sd * 9); ctx.quadraticCurveTo(-18, sd * 12, -30 - 6 * Math.sin(T * 22 + sd), sd * 7); }, WIND[1], 2.4);
};
// the Telekinetic's stone: a floor stone in a violet grip
PROJ2.tkStone = (ctx, p, T, ang, sp) => {
  ctx.save(); ctx.rotate(ang); trail(ctx, sp, 34, p.r * 0.9, FORCE[1]); ctx.restore();
  lit(ctx, () => glowDisc(ctx, 0, 0, p.r * 2.6, FORCE[1], 0.4));
  rock(ctx, 0, 0, p.r * 1.25, 7, EARTH[1], EARTH[2], T * 9);
};

// ---------------------------------------------------------------- 'k2' looks
Object.assign(DRAW2, {
  // ===== the Mob
  // the torch-bearer's torch: a head of pitch and a live flame at the end of what he holds
  torchFlame(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !u || u.dead || u.downed || u.ethereal) return;
    const sw = u.anim && u.anim.kind === 'swing' ? Math.sin(k01(u.anim.t / u.anim.dur) * Math.PI) : 0, a = u.facing - 0.42 + 1.0 * sw, d = u.vr * 1.9 + 4 * sw;
    const x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d, fl = 1 + 0.18 * Math.sin(w.time * 23 + u.id) + 0.1 * Math.sin(w.time * 37);
    lit(ctx, () => glowDisc(ctx, x, y, 20, '#FF8A3D', 0.32));
    inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); }, '#4A3A30');
    upright(ctx, x, y, () => flame(ctx, Math.sin(w.time * 9) * 0.8, -2, 5.2 * fl));
  },
  // Pile On: a brawl's dust round the one they hold, knocks popping out of it
  scuffle(ctx, f, w, layer) {
    const u = f.unit, x = u && live(u) ? u.x : f.x, y = u && live(u) ? u.y : f.y, a = fade(f, 0.15, 0.3), st = Math.floor(w.time * 9);
    if (layer === 'ground') { for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + w.time * 1.4, rr = f.r * (0.8 + 0.25 * hash(st, i)); dust(ctx, x + Math.cos(b) * rr, y + Math.sin(b) * rr * 0.85, 9 + 6 * hash(i, st), 0.5 * a); } return; }
    // the brawl's cloud: inked puffs boiling round its edge (never over its middle: who is held stays in sight)
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 6; i++) { const ph = (w.time * 2.2 + i / 6) % 1, b = i / 6 * TAU + Math.floor(w.time * 2.2 + i / 6) * 2.4, rr = f.r * (0.95 + 0.25 * ph), s = (7 + 5 * hash(i, 2)) * Math.sin(ph * Math.PI);
      if (s > 1.5) inked(ctx, () => { ctx.beginPath(); ctx.arc(x + Math.cos(b) * rr, y + Math.sin(b) * rr, s, 0, TAU); ctx.arc(x + Math.cos(b) * rr + s * 0.9, y + Math.sin(b) * rr + s * 0.3, s * 0.7, 0, TAU); }, '#F2EDE2'); }
    ctx.restore();
    for (let i = 0; i < 2; i++) { const ph = (w.time * 3.2 + i * 0.5) % 1, s2 = Math.floor(w.time * 3.2 + i * 0.5), b = hash(s2, i) * TAU, rr = f.r * (0.55 + 0.4 * hash(i, s2));
      ctx.save(); ctx.globalAlpha *= a * (1 - ph); inked(ctx, () => star(ctx, x + Math.cos(b) * rr, y + Math.sin(b) * rr, 5 + 7 * easeOut(ph), 4, 0.4, b), '#FFF7C2'); ctx.restore(); }
  },
  // the heave: thrown clear, three hard streaks the way it goes
  heave(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 36, '#FFFFFF', 0.6 * (1 - k / 0.3)));
    ctx.save(); ctx.globalAlpha *= 1 - k;
    for (let i = -1; i <= 1; i++) K.streak(ctx, f.x - Math.sin(f.a) * i * 11, f.y + Math.cos(f.a) * i * 11, f.a, 6 + 30 * e, 30 + 70 * e, 6, EARTH[2], '#FFFFFF');
    ctx.restore();
  },
  // Surround: four shoving fronts closing on the knot, dust kicked up behind them
  herd(ctx, f, w, layer) {
    const T2 = f.max - f.t1 - 0.3, k = k01((f.t - f.t1) / T2), r = lerp(f.r, 36, k * (2 - k)), out = k01((f.t - f.t1 - T2) / 0.3);
    if (layer === 'ground') {
      if (f.t < f.t1) { const q = k01(f.t / f.t1); for (let i = 0; i < 4; i++) { const b = f.a + i * TAU / 4; dust(ctx, f.x + Math.cos(b) * f.r * q, f.y + Math.sin(b) * f.r * q, 12, 0.5 * q, '#FFF8E6'); } return; }
      for (let i = 0; i < 4; i++) { const b = f.a + i * TAU / 4; for (let j = 0; j < 3; j++) dust(ctx, f.x + Math.cos(b + (j - 1) * 0.22) * (r + 40 + j * 9), f.y + Math.sin(b + (j - 1) * 0.22) * (r + 40 + j * 9), 12 - j * 2, 0.55 * (1 - out), '#FFF8E6'); }
      if (out > 0) for (let i = 0; i < 8; i++) { const b = i / 8 * TAU; dust(ctx, f.x + Math.cos(b) * (30 + 46 * easeOut(out)), f.y + Math.sin(b) * (30 + 46 * easeOut(out)), 12 * (1 - out) + 3, 0.6 * (1 - out), '#FFF8E6'); }
      return;
    }
    if (f.t < f.t1) return;
    // the shove: a thick white crescent in front of each of them as they close, bowed towards the middle
    ctx.save(); ctx.globalAlpha *= 1 - out;
    for (let i = 0; i < 4; i++) { const b = f.a + i * TAU / 4, cx = f.x + Math.cos(b) * (r + 2), cy = f.y + Math.sin(b) * (r + 2);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, 30, b + Math.PI - 0.8, b + Math.PI + 0.8); ctx.arc(cx + Math.cos(b) * 10, cy + Math.sin(b) * 10, 27, b + Math.PI + 0.62, b + Math.PI - 0.62, true); ctx.closePath(); }, '#FFFFFF'); }
    ctx.restore();
  },
  // Surround II: the torch's fire on the floor where they met, flames standing in it
  torchFire(ctx, f, w, layer) {
    const a = fade(f, 0.25, 0.6);
    if (layer === 'ground') { drawPuddle(ctx, 'fire', f.x, f.y, f.r * (0.6 + 0.4 * k01(f.t / 0.3)), w.time, a, Math.round(f.x * 7 + f.y)); return; }
    for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + 0.4, rr = f.r * (0.25 + 0.5 * hash(i, 3)), s = 5 + 4 * hash(i, 9) + 1.5 * Math.sin(w.time * 11 + i * 2);
      ctx.save(); ctx.globalAlpha *= a; upright(ctx, f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr * 0.8, () => flame(ctx, 0, 0, s)); ctx.restore(); }
  },
  // knocked off its feet: stars going round it low, dust under it
  tumble(ctx, f, w, layer) {
    const u = f.unit; if (!u || !live(u)) return; const a = fade(f, 0.1, 0.25);
    if (layer === 'ground') { dust(ctx, u.x, u.y, f.r * 1.3, 0.25 * a); return; }
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 3; i++) { const b = i / 3 * TAU + w.time * 6; inked(ctx, () => star(ctx, u.x + Math.cos(b) * (f.r + 6), u.y + Math.sin(b) * (f.r + 6) * 0.55, 4.6, 5, 0.45, b), '#FFE66B'); }
    ctx.restore();
  },
  // Scatter: they burst apart: dust thrown four ways from where they stood
  scatterBurst(ctx, f, w, layer) {
    if (layer !== 'ground') return; const k = k01(f.t / f.max), e = easeOut(k);
    for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.3; dust(ctx, f.x + Math.cos(b) * (12 + 62 * e), f.y + Math.sin(b) * (12 + 62 * e), 13 * (1 - k) + 3, 0.55 * (1 - k)); }
  },

  // ===== the Clockmaker
  // Rewind: afterimages running back along the way the friend came, a dial under where they are put, turning backwards
  rewind(ctx, f, w, layer) {
    const k = k01(f.t / f.max), P = f.path || [[f.x, f.y]], n = P.length;
    const at = (q) => { const s = k01(q) * (n - 1), i = Math.min(n - 2, Math.floor(s)), fr = s - i; return n < 2 ? P[0] : [lerp(P[i][0], P[i + 1][0], fr), lerp(P[i][1], P[i + 1][1], fr)]; };
    if (layer === 'ground') {
      dial(ctx, f.x1, f.y1, f.r + 20, -f.t * 14, -f.t * 3.5, fade(f, 0.12, 0.3));
      ctx.save(); ctx.globalAlpha *= 0.55 * fade(f, 0.1, 0.4); ctx.setLineDash([7, 9]); ctx.lineDashOffset = f.t * 90; ctx.strokeStyle = BRASS[1]; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore(); return;
    }
    // the playhead runs from now (the end of the path) back to then (its start) in the first 40% of the look
    const head = 1 - easeOut(k01(k / 0.4));
    for (let i = 0; i < 6; i++) { const q = head + i * 0.11; if (q > 1.001) continue; const [x, y] = at(q), a = (1 - i / 6) * (1 - k) * 0.8;
      lit(ctx, () => { glowDisc(ctx, x, y, f.r * 1.5, '#9FD0FF', a * 0.55); ctx.strokeStyle = `rgba(246,227,166,${a})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, f.r * 0.9, 0, TAU); ctx.stroke(); }); }
  },
  // a brass flash: a ring of ticks thrown outwards
  clockFlash(ctx, f, w, layer) {
    const k = k01(f.t / f.max), e = easeOut(k);
    if (layer === 'air') { if (k < 0.35) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.6, '#FFF0B0', 0.7 * (1 - k / 0.35))); return; }
    ctx.save(); ctx.globalAlpha *= 1 - k;
    for (let i = 0; i < 12; i++) { const b = i / 12 * TAU, r0 = f.r * (0.6 + 0.9 * e); inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + Math.cos(b) * r0, f.y + Math.sin(b) * r0); ctx.lineTo(f.x + Math.cos(b) * (r0 + 8), f.y + Math.sin(b) * (r0 + 8)); }, BRASS[1], 3); }
    ctx.restore();
  },
  // Slow Time: the bubble. Take 1 Dial: a great clock face on the floor whose hands barely move, the air inside it cold
  // and thick, slow motes hanging in it. Take 2 Glass: a dome of pale glass with a bright rim and a slow shine.
  timeBubble(ctx, f, w, layer) {
    const a = fade(f, 0.3, 0.5), grow = easeOut(k01(f.t / 0.35)), r = f.r * grow, v = variant('timeBubble');
    if (layer === 'ground') {
      ctx.save(); ctx.globalAlpha *= a;
      const g = ctx.createRadialGradient(f.x, f.y, r * 0.2, f.x, f.y, r); g.addColorStop(0, 'rgba(143,184,224,0.2)'); g.addColorStop(0.8, 'rgba(143,184,224,0.26)'); g.addColorStop(1, 'rgba(143,184,224,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.fill();
      if (v === 1) dial(ctx, f.x, f.y, r - 6, f.t * 0.5 - 1.2, f.t * 0.06 + 0.6, 0.85, 12);
      else { ctx.strokeStyle = 'rgba(221,239,250,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, r - 4, 0, TAU); ctx.stroke(); }
      ctx.restore(); return;
    }
    ctx.save(); ctx.globalAlpha *= a;
    // slow motes: each drifts a little and hangs
    for (let i = 0; i < 12; i++) { const b = hash(i, 5) * TAU + f.t * 0.12 * (i % 2 ? 1 : -1), rr = r * (0.2 + 0.7 * hash(i, 11)); lit(ctx, () => glowDisc(ctx, f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr * 0.9, 5 + 3 * hash(i, 2), '#DDEFFA', 0.5)); }
    if (v === 2) lit(ctx, () => { const b = f.t * 0.5; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.86, b, b + 0.7); ctx.stroke(); ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.86, b + 3.4, b + 3.7); ctx.stroke(); });
    ctx.restore();
  },
  // Stop the Clock: a ring of ticks sweeps out from him across the room, and the floor goes cold while time stands
  clockStop(ctx, f, w, layer) {
    if (layer !== 'ground') return; const k = k01(f.t / 0.4), e = easeOut(k), hold = k01(Math.min(f.t / 0.2, (f.max - f.t) / 0.3));
    ctx.save(); ctx.globalAlpha *= 0.16 * hold; ctx.fillStyle = '#BFD4EE'; ctx.fillRect(-200, -200, w.W + 400, w.H + 400); ctx.restore();
    if (k < 1) { ctx.save(); ctx.globalAlpha *= 1 - k * k; const r = 30 + (f.r - 30) * e;
      for (let i = 0; i < 24; i++) { const b = i / 24 * TAU; inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(f.x + Math.cos(b) * r, f.y + Math.sin(b) * r); ctx.lineTo(f.x + Math.cos(b) * (r + (i % 2 ? 9 : 16)), f.y + Math.sin(b) * (r + (i % 2 ? 9 : 16))); }, BRASS[1], 3.4); }
      ctx.restore(); }
    dial(ctx, f.x, f.y, 46, -1.1, 0.5, 0.9 * hold);
  },
  // a stopped clock under each one held: its hands don't move; when time starts again the ticks fly off
  stoppedDial(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'ground' || !u || u.dead) return; const over = k01((f.t - f.dur) / 0.25), r = f.r + 12 + 16 * easeOut(over);
    dial(ctx, u.x, u.y, r, 0.9 + u.id, -1.4 + u.id * 0.7, k01(f.t / 0.15) * (1 - over), 8);
  },
  // a clock hand's hit: a moment lost (a small brass tick at its side)
  tick(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !u || !live(u)) return; const k = k01(f.t / f.max), [vx, vy] = upVec(), x = u.x + vx * (f.r * 0.2) + 14, y = u.y + vy * (f.r * 0.2);
    ctx.save(); ctx.globalAlpha *= 1 - k * k; dial(ctx, x - 14 + (u.vr + 4), y, 9, -k * 5, -1, 1, 4); ctx.restore();
  },

  // ===== the Air Mage
  // Gale: a wall of wind running down the lane: a bowed front, long streaks rushing behind it, leaves caught in it
  gale(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), run = easeOut(k01(f.t / 0.3)), a = f.a, c = Math.cos(a), s = Math.sin(a), al = 1 - k01((k - 0.55) / 0.45);
    ctx.save(); ctx.globalAlpha *= al;
    for (let i = 0; i < 16; i++) { const off = (hash(i, 3) - 0.5) * 2 * f.hw, ph = (f.t * 2.6 + hash(i, 7)) % 1, d = 20 + ph * f.r * run * 0.95, len = 38 + 46 * hash(i, 5);
      gustLine(ctx, f.x + c * d - s * off, f.y + s * d + c * off, a, len, (hash(i, 9) - 0.5) * 14, 2.6 + 1.2 * hash(i, 1), 0.85 * Math.sin(ph * Math.PI)); }
    // the front
    const d = 26 + (f.r - 26) * run, fx = f.x + c * d, fy = f.y + s * d;
    ctx.translate(fx, fy); ctx.rotate(a);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, -f.hw); ctx.quadraticCurveTo(26, 0, -6, f.hw); ctx.quadraticCurveTo(10, 0, -6, -f.hw); ctx.closePath(); }, WIND[1]);
    ctx.restore();
  },
  // something landing hard: dust thrown out and a white knock
  slamPuff(ctx, f, w, layer) {
    const k = k01(f.t / f.max), e = easeOut(k);
    if (layer === 'ground') { for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.2; dust(ctx, f.x + Math.cos(b) * f.r * (0.5 + 0.9 * e), f.y + Math.sin(b) * f.r * (0.5 + 0.9 * e) * 0.85, 10 * (1 - k) + 3, 0.6 * (1 - k)); } return; }
    if (k < 0.3) { lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.3, '#FFFFFF', 0.6 * (1 - k / 0.3))); inked(ctx, () => star(ctx, f.x, f.y, f.r * (0.5 + 0.5 * e), 6, 0.45, 0.3), '#FFFBEA'); }
  },
  // Updraft: a column of rising air: rings turning on the floor, streaks climbing up round whatever it lifted
  updraft(ctx, f, w, layer) {
    const a = fade(f, 0.15, 0.3);
    if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.7 * a; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const b = f.t * (5 - i) + i * 2.1, rr = f.r * (0.45 + 0.27 * i); ctx.strokeStyle = 'rgba(238,243,248,0.8)'; ctx.lineWidth = 4 - i * 0.6; ctx.beginPath(); ctx.arc(f.x, f.y, rr, b, b + 2.3); ctx.stroke(); }
      ctx.restore(); return; }
    const [vx, vy] = upVec();
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 9; i++) { const ph = (f.t * 1.5 + hash(i, 4)) % 1, b = i / 9 * TAU + f.t * 1.1, rr = f.r * (0.55 + 0.35 * hash(i, 2)), up = ph * 74, x = f.x + Math.cos(b) * rr + vx * up, y = f.y + Math.sin(b) * rr * 0.6 + vy * up;
      ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI);
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + vx * 20, y + vy * 20); }, WIND[1], 3); ctx.restore(); }
    ctx.restore();
  },
  // Cyclone: a whirlwind: dust turning on the floor, and bands of wind stacked up the screen, wider as they climb
  cyclone(ctx, f, w, layer) {
    const a = fade(f, 0.3, 0.4), [vx, vy] = upVec(), T = f.t;
    if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.55 * a; for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + T * 4.5, rr = f.r * (0.35 + 0.6 * hash(i, 1)); dust(ctx, f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr * 0.8, 9 + 5 * hash(i, 6), 0.6); } ctx.restore(); return; }
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 5; i++) { const up = 6 + i * 15, rx = 16 + i * 11 + 3 * Math.sin(T * 5 + i), cx = f.x + vx * up + Math.sin(T * 3 + i * 0.9) * 5, cy = f.y + vy * up, b = T * (9 - i) + i * 1.7;
      ctx.save(); ctx.translate(cx, cy); if (vx) ctx.rotate(Math.PI / 2);
      inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, rx, rx * 0.36, 0, b, b + 3.6); }, i % 2 ? WIND[0] : WIND[1], 5 - i * 0.3);
      ctx.restore(); }
    for (let i = 0; i < 6; i++) { const b = T * 7 + i * 1.05, up = 10 + 62 * hash(i, 8), rx = 20 + up * 0.6; rock(ctx, f.x + vx * up + Math.cos(b) * rx, f.y + vy * up + Math.sin(b) * rx * 0.36, 2.6 + 1.6 * hash(i, 3), i, EARTH[1], EARTH[2], b); }
    ctx.restore();
  },
  // a clap of wind: curled streaks thrown out in a ring
  windClap(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 0.8, '#FFFFFF', 0.55 * (1 - k / 0.3)));
    for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + 0.2, d = f.r * (0.25 + 0.75 * e); gustLine(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, b + 1.1, 26 + 10 * hash(i, 2), 9, 3.4, 1 - k * k); }
  },

  // ===== the Warden
  // Manacles II: staked to the floor: an iron stake behind it, a short chain to its feet
  stake(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'ground' || !u || !live(u)) return; const a = fade(f, 0.1, 0.25), b = u.facing + Math.PI, x = u.x + Math.cos(b) * (f.r + 16), y = u.y + Math.sin(b) * (f.r + 16);
    ctx.save(); ctx.globalAlpha *= a; chain(ctx, u.x + Math.cos(b) * f.r * 0.5, u.y + Math.sin(b) * f.r * 0.5, x, y, 2);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); }, IRON[0]); ctx.fillStyle = IRON[2]; ctx.beginPath(); ctx.arc(x - 1.4, y - 1.4, 2, 0, TAU); ctx.fill(); ctx.restore();
  },
  // Nullify: a grey ring of nothing rolling out from him: broken dashes, the colour gone out of the floor behind it
  nullWave(ctx, f, w, layer) {
    if (layer !== 'ground') return; const k = k01(f.t / f.max), e = easeOut(k), r = f.r * e;
    ctx.save(); ctx.globalAlpha *= 0.3 * (1 - k); ctx.fillStyle = '#8A94A6'; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < 14; i++) { const b = i / 14 * TAU + 0.15 * (i % 2); inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(4, r), b, b + 0.24); }, i % 2 ? IRON[2] : IRON[1], 5); }
    ctx.restore();
    if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, 60, '#EEF3F8', 0.6 * (1 - k / 0.25)));
  },
  // a shot nullified: it drops out of the air as grey dust
  fizzle(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), [vx, vy] = upVec();
    for (let i = 0; i < 5; i++) { const b = i / 5 * TAU; dust(ctx, f.x + Math.cos(b) * 10 * k - vx * 14 * k * k, f.y + Math.sin(b) * 10 * k - vy * 14 * k * k, 4 * (1 - k) + 1.5, 0.8 * (1 - k), '#C9D2DE'); }
  },
  // nullified (Nullify; round 17 lane tags17: it was 'silenced'): a padlock on its chest for as long as it can use nothing
  nulled(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !u || !live(u) || u.hidden) return; const a = fade(f, 0.12, 0.3), pop = f.t < 0.2 ? 1 + 0.5 * Math.sin(f.t / 0.2 * Math.PI) : 1;
    ctx.save(); ctx.globalAlpha *= a; upright(ctx, u.x, u.y, () => padlock(ctx, 0, 1, 1.15 * pop)); ctx.restore();
  },
  // round 17 (lane tags17): SILENCED (sim.js silence): a speech bubble over its head, crossed out, while its mouth is
  // shut. It ends early when the silence does (a cleanse).
  hushed(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !u || !live(u) || u.hidden) return; if (!(u.silencedT > 0)) { f.max = Math.min(f.max, f.t + 0.25); }
    const a = fade(f, 0.12, 0.25), pop = f.t < 0.2 ? 1 + 0.4 * Math.sin(f.t / 0.2 * Math.PI) : 1, bob = Math.sin(f.t * 4) * 1.5;
    ctx.save(); ctx.globalAlpha *= a; upright(ctx, u.x, u.y, () => hushMark(ctx, (u.vr || 20) * 1.4 + 10, -(u.vr || 20) * 1.4 - 6 + bob, 2.1 * pop)); // (beside the head, clear of the health bar) ctx.restore();
  },
  // Chain Gang: a chain along the floor from his belt to each one he holds: slack when it stands close, taut at its end
  chainTo(ctx, f, w, layer) {
    const u = f.from, e = f.unit; if (layer !== 'ground' || !live(u) || !live(e)) return;
    const d = Math.hypot(e.x - u.x, e.y - u.y), slack = k01(1 - d / f.len), a = fade(f, 0.12, 0.25);
    ctx.save(); ctx.globalAlpha *= a; chain(ctx, u.x, u.y, e.x, e.y, 16 * slack * (e.id % 2 ? 1 : -1)); ctx.restore();
  },
  // the Warden's chain as it swings: links thrown out along the arc, an iron weight leading
  chainSwing(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !u || !live(u)) return; const k = k01(f.t / f.max), sw = easeOut(k01(k / 0.5)), a0 = f.a - 1.05, a1 = a0 + 2.1 * sw, r = f.r;
    ctx.save(); ctx.globalAlpha *= 1 - k01((k - 0.6) / 0.4);
    const n = 7; for (let i = 1; i <= n; i++) { const q = i / n, b = a1 - 0.5 * (1 - q) * sw, rr = r * q; link(ctx, u.x + Math.cos(b) * rr, u.y + Math.sin(b) * rr, b + (i % 2 ? 0.6 : -0.6), 1.05); }
    const wx = u.x + Math.cos(a1) * (r + 5), wy = u.y + Math.sin(a1) * (r + 5);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(wx, wy, 6.5, 0, TAU); }, IRON[0]); ctx.fillStyle = IRON[2]; ctx.beginPath(); ctx.arc(wx - 1.8, wy - 1.8, 2.2, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // Ball and Chain: an iron ball dragged behind whatever he has shackled
  ironBall(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'ground' || !u || !live(u)) return; const a = fade(f, 0.12, 0.25);
    const want = (u.spd > 8 ? u.mvA : u.facing) + Math.PI; f.ba = f.ba == null ? want : f.ba + Math.atan2(Math.sin(want - f.ba), Math.cos(want - f.ba)) * 0.12;
    const x = u.x + Math.cos(f.ba) * (f.r + 20), y = u.y + Math.sin(f.ba) * (f.r + 20);
    ctx.save(); ctx.globalAlpha *= a; chain(ctx, u.x + Math.cos(f.ba) * f.r * 0.6, u.y + Math.sin(f.ba) * f.r * 0.6, x, y, 2);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 9.5, 0, TAU); }, IRON[0]); ctx.fillStyle = IRON[1]; ctx.beginPath(); ctx.arc(x - 2.6, y - 2.8, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = IRON[2]; ctx.beginPath(); ctx.arc(x - 3.4, y - 3.6, 1.5, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // Shackled's burst: the irons snap shut: two iron arcs clap together on it and sparks jump
  shackleSnap(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !u || u.dead) return; const k = k01(f.t / f.max), shut = easeOut(k01(k / 0.25)), r = f.r + 10, gap = 26 * (1 - shut);
    ctx.save(); ctx.globalAlpha *= 1 - k01((k - 0.6) / 0.4);
    for (const sd of [-1, 1]) inkLine(ctx, () => { ctx.beginPath(); ctx.arc(u.x + sd * gap, u.y, r, sd > 0 ? -1.25 : Math.PI - 1.25, sd > 0 ? 1.25 : Math.PI + 1.25); }, IRON[1], 5.5);
    ctx.restore();
    if (k > 0.2 && k < 0.6) { const q = (k - 0.2) / 0.4; lit(ctx, () => glowDisc(ctx, u.x, u.y, r * 1.4, '#EEF3F8', 0.5 * (1 - q)));
      for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + 0.5; K.streak(ctx, u.x + Math.cos(b) * r, u.y + Math.sin(b) * r, b, 2, 6 + 16 * easeOut(q), 2.8, IRON[2], '#FFFFFF'); } }
  },

  // ===== the Telekinetic
  // Hurl: the thing lifts off the floor in a violet grip, hangs, and is flung; its shadow stays on the floor under it
  tkThrow(ctx, f, w, layer) {
    const fly = k01((f.t - f.lift) / f.fly), up = f.t < f.lift ? easeOut(k01(f.t / f.lift)) : 1, gx = lerp(f.x, f.x1, fly * fly), gy = lerp(f.y, f.y1, fly * fly);
    const h = 40 * up * (1 - fly * fly) + 26 * Math.sin(fly * Math.PI), [vx, vy] = upVec(), X = gx + vx * h, Y = gy + vy * h;
    if (layer === 'ground') { /* round 19 (lane sys19): its shadow is the units' own (height.js castShadow) */ castShadow(gx, gy, f.r, 1, h); return; }
    lit(ctx, () => { glowDisc(ctx, X, Y, f.r * 2, FORCE[1], 0.45);
      if (f.t < f.lift && live(f.from)) { const [hx, hy] = handOf(f.from); ctx.strokeStyle = 'rgba(181,140,255,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + X) / 2, (hy + Y) / 2 - 18, X, Y); ctx.stroke(); } });
    ctx.save(); ctx.translate(X, Y); ctx.rotate(fly * 5 + (f.t < f.lift ? Math.sin(f.t * 20) * 0.06 : 0));
    if (f.pillar) drawPillarThemed(ctx, { x: 0, y: 0, r: f.pillar.r }, w); else rock(ctx, 0, 0, f.r, 31, EARTH[1], EARTH[2]);
    ctx.restore();
    if (f.t < f.lift) for (let i = 0; i < 4; i++) rock(ctx, f.x + (hash(i, 2) - 0.5) * f.r * 2, f.y + vy * (10 + 22 * up * hash(i, 7)) + vx * 10, 2.6, i);
  },
  // where it lands: a white knock, dust rolling out to its true reach, rock thrown in every direction
  rockBurst(ctx, f, w, layer) {
    const k = k01(f.t / f.max), e = easeOut(k);
    if (layer === 'ground') { for (let i = 0; i < 12; i++) { const b = i / 12 * TAU; dust(ctx, f.x + Math.cos(b) * f.r * (0.3 + 0.75 * e), f.y + Math.sin(b) * f.r * (0.3 + 0.75 * e), 14 * (1 - k) + 4, 0.6 * (1 - k)); } return; }
    if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#FFFFFF', 0.8 * (1 - k / 0.2)));
    const [vx, vy] = upVec(); ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + hash(i, 4), d = f.r * (0.2 + 0.85 * e) * (0.6 + 0.4 * hash(i, 6)), up = Math.sin(k * Math.PI) * 22 * hash(i, 8); rock(ctx, f.x + Math.cos(b) * d + vx * up, f.y + Math.sin(b) * d + vy * up, 6.5 - 3 * k + 2 * hash(i, 1), i, EARTH[1], EARTH[2], k * 7 + i); }
    if (f.shards) for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.4; K.streak(ctx, f.x + Math.cos(b) * f.r * 0.3, f.y + Math.sin(b) * f.r * 0.3, b, 4, 12 + f.r * 0.75 * e, 3.4, EARTH[2], '#FFFFFF'); }
    ctx.restore();
  },
  // the hole a slab was torn out of
  floorHole(ctx, f, w, layer) {
    if (layer !== 'ground') return; const a = fade(f, 0.15, 1.5);
    ctx.save(); ctx.globalAlpha *= 0.5 * a; ctx.fillStyle = INK; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const b = i / 8 * TAU, rr = f.r * (0.7 + 0.4 * hash(i, 13)); ctx.lineTo(f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr * 0.8); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  },
  // Levitate: held in the air: a violet glow round it, a wavering thread of force from her hand, its shadow far below
  tkHold(ctx, f, w, layer) {
    const u = f.unit; if (!u || !live(u)) return; const a = fade(f, 0.2, 0.3), [vx, vy] = upVec(), X = u.x + vx * (u.hop || 0) * 0.9, Y = u.y + vy * (u.hop || 0) * 0.9;
    if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.5 * a; ctx.strokeStyle = FORCE[1]; ctx.lineWidth = 3; ctx.setLineDash([6, 7]); ctx.lineDashOffset = -f.t * 24; ctx.beginPath(); ctx.ellipse(u.x, u.y, f.r * 1.1, f.r * 0.6, 0, 0, TAU); ctx.stroke(); ctx.restore(); return; }
    lit(ctx, () => { glowDisc(ctx, X, Y, f.r * 2.1, FORCE[1], 0.2 * a);
      if (live(f.from)) { const [hx, hy] = handOf(f.from); ctx.strokeStyle = `rgba(181,140,255,${0.6 * a})`; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + X) / 2 + sd * 14 * Math.sin(f.t * 6), (hy + Y) / 2 + sd * 14 * Math.cos(f.t * 6), X, Y); ctx.stroke(); } } });
    ctx.save(); ctx.globalAlpha *= a; for (let i = 0; i < 4; i++) { const b = f.t * 3 + i * TAU / 4; rock(ctx, X + Math.cos(b) * (f.r + 8), Y + Math.sin(b) * (f.r + 8) * 0.5, 2.6, i, FORCE[2], '#FFFFFF', b); } ctx.restore();
  },
  // too heavy to lift: pressed down instead (violet weight closing in from both sides)
  pressed(ctx, f, w, layer) {
    const u = f.unit; if (layer !== 'air' || !u || !live(u)) return; const a = fade(f, 0.15, 0.3), sq = 4 * Math.sin(f.t * 7);
    lit(ctx, () => glowDisc(ctx, u.x, u.y, f.r * 1.7, FORCE[1], 0.3 * a));
    ctx.save(); ctx.globalAlpha *= a; for (const sd of [-1, 1]) inkLine(ctx, () => { ctx.beginPath(); ctx.arc(u.x + sd * (f.r + 12 + sq), u.y, f.r * 0.9, sd > 0 ? Math.PI - 0.8 : -0.8, sd > 0 ? Math.PI + 0.8 : 0.8); }, FORCE[1], 4); ctx.restore();
  },
  // Mind Shield: the dome: a faint violet floor, a rim of slow bright arcs, and a ring round every shot it has caught
  mindDome(ctx, f, w, layer) {
    const a = fade(f, 0.2, 0.2), r = f.r * easeOut(k01(f.t / 0.25));
    if (layer === 'ground') {
      ctx.save(); ctx.globalAlpha *= a; const g = ctx.createRadialGradient(f.x, f.y, r * 0.5, f.x, f.y, r); g.addColorStop(0, 'rgba(181,140,255,0.08)'); g.addColorStop(0.85, 'rgba(181,140,255,0.22)'); g.addColorStop(1, 'rgba(181,140,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.fill(); ctx.restore(); return;
    }
    lit(ctx, () => { ctx.lineCap = 'round'; ctx.lineWidth = 4.5;
      for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + f.t * 0.6; ctx.strokeStyle = `rgba(226,208,255,${(0.45 + 0.25 * Math.sin(f.t * 4 + i)) * a})`; ctx.beginPath(); ctx.arc(f.x, f.y, r - 3, b, b + 0.5); ctx.stroke(); }
      for (const c of f.caught || []) { const p = c.p; if (!p || p.life <= 0) continue; glowDisc(ctx, p.x, p.y, 16, FORCE[1], 0.6 * a); ctx.strokeStyle = `rgba(226,208,255,${0.8 * a})`; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(p.x, p.y, 9 + Math.sin(f.t * 9 + p.x) * 1.5, 0, TAU); ctx.stroke(); } });
  },
  // the dome let go as a shove: violet arcs thrown out
  forceBurst(ctx, f, w, layer) {
    if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), r = f.r * (0.4 + 0.6 * e);
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 0.9, FORCE[2], 0.6 * (1 - k / 0.3)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k; for (let i = 0; i < 10; i++) { const b = i / 10 * TAU; inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, r, b, b + 0.34); }, FORCE[1], 5); } ctx.restore();
  },
  // a body in her grip (Poltergeist): violet light under it as it flies
  tkGlow(ctx, f, w, layer) {
    const c = f.corpse; if (layer !== 'air' || !c) return; const [vx, vy] = upVec(), a = fade(f, 0.05, 0.3);
    lit(ctx, () => glowDisc(ctx, c.x + vx * (c.z || 0), c.y + vy * (c.z || 0), f.r * 2.2, FORCE[1], 0.5 * a));
  },

  // ===== the Earth Mage
  // Earthquake: the floor in pieces: cracks that shift with every jolt, slabs heaving, stones hopping, dust
  quake(ctx, f, w, layer) {
    const a = fade(f, 0.2, 0.5), st = Math.floor(f.t / 0.12), [vx, vy] = upVec();
    if (layer === 'ground') {
      ctx.save(); ctx.globalAlpha *= 0.3 * a; ctx.fillStyle = EARTH[0]; ctx.beginPath(); for (let i = 0; i < 18; i++) { const b = i / 18 * TAU, rr = f.r * (0.86 + 0.14 * hash(i, 21)); ctx.lineTo(f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < 9; i++) { const b0 = i / 9 * TAU + 0.3 * hash(i, 2); let px = f.x + Math.cos(b0) * f.r * 0.12, py = f.y + Math.sin(b0) * f.r * 0.12, b = b0;
        ctx.strokeStyle = 'rgba(43,34,48,0.7)'; ctx.lineWidth = 4.5 - (i % 3); ctx.beginPath(); ctx.moveTo(px, py);
        for (let j = 1; j <= 4; j++) { b += (hash(i, j, st % 3) - 0.5) * 0.9; const d = f.r * 0.22; px += Math.cos(b) * d; py += Math.sin(b) * d; ctx.lineTo(px, py); }
        ctx.stroke(); }
      for (let i = 0; i < 8; i++) { const b = hash(i, st) * TAU, rr = f.r * hash(st, i, 3) * 0.9; dust(ctx, f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr, 8 + 6 * hash(i, st, 5), 0.4); }
      ctx.restore(); return;
    }
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 9; i++) { const b = hash(i, 17) * TAU, rr = f.r * (0.15 + 0.75 * hash(i, 23)), ph = (f.t * 2.4 + hash(i, 4)) % 1, hop = Math.sin(ph * Math.PI) * (8 + 10 * hash(i, 6));
      rock(ctx, f.x + Math.cos(b) * rr + vx * hop, f.y + Math.sin(b) * rr + vy * hop, 4 + 3.5 * hash(i, 9), i, EARTH[1], EARTH[2], ph * 2); }
    ctx.restore();
  },
  // Earthquake III: the floor heaves up: a ring of slabs thrust out of it, then they sink
  heaveUp(ctx, f, w, layer) {
    const k = k01(f.t / f.max), up = k < 0.25 ? easeOut(k / 0.25) : 1 - k01((k - 0.5) / 0.5);
    if (layer === 'ground') { for (let i = 0; i < 12; i++) { const b = i / 12 * TAU; dust(ctx, f.x + Math.cos(b) * f.r * (0.4 + 0.6 * easeOut(k)), f.y + Math.sin(b) * f.r * (0.4 + 0.6 * easeOut(k)), 15 * (1 - k) + 4, 0.55 * (1 - k)); } return; }
    if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 0.9, '#FFF8E6', 0.5 * (1 - k / 0.2)));
    const L = []; for (let i = 0; i < 11; i++) { const b = i / 11 * TAU, rr = f.r * (i % 2 ? 0.75 : 0.42); L.push([f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr, i]); }
    L.sort((p, q) => (vyOf() ? p[1] - q[1] : q[0] - p[0]));
    for (const [x, y, i] of L) spike(ctx, x, y, (26 + 20 * hash(i, 3)) * up, 10 + 5 * hash(i, 5), (hash(i, 7) - 0.5) * 0.5);
  },
  // Spike Chain: stone spikes bursting out of the floor one after another along the line, each standing a moment
  spikeRun(ctx, f, w, layer) {
    const L = Math.hypot(f.x1 - f.x, f.y1 - f.y), n = Math.max(2, Math.round(L / 19));
    if (layer === 'ground') { const k = k01(f.t / f.run); ctx.save(); ctx.globalAlpha *= 0.55 * fade(f, 0.05, 0.4); ctx.strokeStyle = 'rgba(43,34,48,0.65)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(lerp(f.x, f.x1, k), lerp(f.y, f.y1, k)); ctx.stroke(); ctx.restore(); return; }
    const S = []; for (let i = 1; i <= n; i++) { const q = i / n, born = q * f.run, age = f.t - born; if (age < 0) continue; const off = (hash(i, 3) - 0.5) * 12, nx = -(f.y1 - f.y) / (L || 1), ny = (f.x1 - f.x) / (L || 1);
      const up = age < 0.09 ? easeOut(age / 0.09) : 1 - k01((age - 0.4) / 0.28); if (up <= 0) continue; S.push([lerp(f.x, f.x1, q) + nx * off, lerp(f.y, f.y1, q) + ny * off, i, up, age]); }
    S.sort((p, q) => (vyOf() ? p[1] - q[1] : q[0] - p[0]));
    for (const [x, y, i, up, age] of S) { if (age < 0.16) dust(ctx, x, y, 9 * (1 - age / 0.16) + 4, 0.6 * (1 - age / 0.16)); spike(ctx, x, y, (17 + 12 * hash(i, 5)) * up, 6.5 + 3 * hash(i, 7), (hash(i, 9) - 0.5) * 0.7); }
  },
  // the spike that comes up under one enemy: three, the middle one tall (held: it stands as long as the root)
  bigSpike(ctx, f, w, layer) {
    const u = f.unit && live(f.unit) ? f.unit : null, x = u ? u.x : f.x, y = u ? u.y : f.y, k = k01(f.t / f.max), up = f.t < 0.1 ? easeOut(f.t / 0.1) : 1 - k01((f.max - 0.25 - f.t) / -0.25);
    if (layer === 'ground') { if (f.t < 0.3) dust(ctx, x, y, f.r * (0.8 + f.t * 2), 0.5 * (1 - f.t / 0.3)); return; }
    if (f.t < 0.12) lit(ctx, () => glowDisc(ctx, x, y, f.r * 1.2, '#FFF8E6', 0.6 * (1 - f.t / 0.12)));
    const h = k01(up); spike(ctx, x - f.r * 0.55, y + 2, 20 * h, 7, -0.35); spike(ctx, x + f.r * 0.55, y + 2, 22 * h, 7, 0.35); spike(ctx, x, y + f.r * 0.5, 36 * h, 9.5, 0.06 * Math.sin(k * 9));
  },
  // Aftershock's tell: the floor cracking open under the one it is coming for, grit jumping
  aftCrack(ctx, f, w, layer) {
    const u = f.unit && live(f.unit) ? f.unit : null, x = u ? u.x : f.x, y = u ? u.y : f.y, k = k01(f.t / f.max);
    if (layer !== 'ground') { const [vx, vy] = upVec(); for (let i = 0; i < 4; i++) { const ph = (f.t * 3 + i * 0.25) % 1, b = i * 1.7; rock(ctx, x + Math.cos(b) * f.r * 0.8 + vx * Math.sin(ph * Math.PI) * 9, y + Math.sin(b) * f.r * 0.6 + vy * Math.sin(ph * Math.PI) * 9, 2.4, i); } return; }
    ctx.save(); ctx.globalAlpha *= k01(f.t / 0.15) * (1 - k01((k - 0.85) / 0.15)); ctx.strokeStyle = 'rgba(43,34,48,0.75)'; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 5; i++) { let b = i / 5 * TAU + 0.4, px = x, py = y; ctx.beginPath(); ctx.moveTo(px, py); for (let j = 1; j <= 3; j++) { b += (hash(i, j) - 0.5) * 0.9; const d = (f.r * 0.5 + 6) * k01(k * 2.2); px += Math.cos(b) * d; py += Math.sin(b) * d * 0.8; ctx.lineTo(px, py); } ctx.stroke(); }
    ctx.restore();
  },
  // Stone Wall coming up: a white knock along its whole length and grit thrown off both faces
  wallRise(ctx, f, w, layer) {
    const k = k01(f.t / f.max), e = easeOut(k), n = Math.max(4, Math.round((f.horiz ? f.w : f.h) / 26));
    if (layer === 'air') { if (k < 0.3) lit(ctx, () => { ctx.fillStyle = `rgba(255,248,230,${0.7 * (1 - k / 0.3)})`; ctx.fillRect(f.x - f.w / 2 - 8, f.y - f.h / 2 - 8, f.w + 16, f.h + 16); }); return; }
    for (let i = 0; i < n; i++) for (const sd of [-1, 1]) { const q = (i + 0.5) / n, out = (14 + 30 * e) * sd, x = f.horiz ? f.x - f.w / 2 + f.w * q : f.x + out, y = f.horiz ? f.y + out : f.y - f.h / 2 + f.h * q; dust(ctx, x, y, 11 * (1 - k) + 3, 0.6 * (1 - k), '#FFF8E6'); }
  },
  // Stone Wall III: the wall comes down on their side: rocks tumbling out, dust
  rubble(ctx, f, w, layer) {
    const k = k01(f.t / f.max), e = easeOut(k), n = Math.max(6, Math.round((f.horiz ? f.w : f.h) / 22)), [vx, vy] = upVec();
    for (let i = 0; i < n; i++) { const q = (i + 0.5) / n, bx = f.horiz ? f.x - f.w / 2 + f.w * q : f.x, by = f.horiz ? f.y : f.y - f.h / 2 + f.h * q, out = (16 + 44 * hash(i, 3)) * e * f.side, x = bx + (f.horiz ? (hash(i, 5) - 0.5) * 14 : out), y = by + (f.horiz ? out : (hash(i, 5) - 0.5) * 14);
      if (layer === 'ground') { dust(ctx, x, y, 14 * (1 - k) + 5, 0.55 * (1 - k)); continue; }
      const hop = Math.sin(k01(k * 1.5) * Math.PI) * 14 * hash(i, 7); ctx.save(); ctx.globalAlpha *= 1 - k01((k - 0.6) / 0.4); rock(ctx, x + vx * hop, y + vy * hop, 8 + 5 * hash(i, 9), i, EARTH[1], EARTH[2], k * 5 + i); ctx.restore(); }
  },
});
const vyOf = () => upVec()[1] !== 0; // (portrait: things further down the screen are drawn later)

// ---------------------------------------------------------------- the Earth Mage's wall (a timed wall of kind 'stone')
// Rough slabs standing out of the floor side by side: each has a dark face towards the bottom of the screen and a
// lighter top, cracks, grit at its foot; they heave up as the wall comes and sink as it goes.
WALL2.stone = (ctx, r, T) => {
  if (r._t0 == null) r._t0 = r.temp;
  const age = r._t0 - r.temp, up = k01(Math.min(age / 0.22, r.temp / 0.35)), horiz = r.w >= r.h, len = horiz ? r.w : r.h, n = Math.max(3, Math.round(len / 46)), [vx, vy] = upVec();
  for (let i = 0; i < n; i++) {
    const q = (i + 0.5) / n, cx = horiz ? r.x + r.w * q : r.x + r.w / 2, cy = horiz ? r.y + r.h / 2 : r.y + r.h * q, hw = (horiz ? r.w / n : r.w) / 2 + 1, hh = (horiz ? r.h : r.h / n) / 2 + 1;
    const rise = k01(up * 1.3 - hash(i, 2) * 0.3), H = (16 + 9 * hash(i, 4)) * easeOut(rise), jit = (hash(i, 6) - 0.5) * 4;
    if (rise <= 0) continue;
    // the grit it pushed up
    for (let j = 0; j < 3; j++) dust(ctx, cx + (hash(i, j) - 0.5) * hw * 2.2, cy + (hash(j, i) - 0.5) * hh * 2.4, 6, 0.4 * (age < 0.6 ? 1 - age / 0.6 : 0));
    // the slab's sides (dark) and its top (light), lifted up the screen by its height
    inked(ctx, () => { roundRect(ctx, cx - hw + jit * 0.3, cy - hh, hw * 2, hh * 2, 5); }, EARTH[0]);
    ctx.save(); ctx.translate(vx * H, vy * H);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - hw + 2, cy - hh + 3 + jit); ctx.lineTo(cx - hw * 0.3, cy - hh - 1); ctx.lineTo(cx + hw - 2, cy - hh + 2 - jit); ctx.lineTo(cx + hw, cy + hh - 3); ctx.lineTo(cx + hw * 0.2, cy + hh + 1); ctx.lineTo(cx - hw, cy + hh - 2); ctx.closePath(); }, EARTH[1]);
    ctx.fillStyle = EARTH[2]; ctx.beginPath(); ctx.moveTo(cx - hw + 5, cy - hh + 6 + jit); ctx.lineTo(cx - hw * 0.3, cy - hh + 2); ctx.lineTo(cx + hw * 0.1, cy - hh * 0.2); ctx.lineTo(cx - hw + 4, cy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(43,34,48,0.5)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + hw * 0.5, cy - hh + 3); ctx.lineTo(cx + hw * 0.2, cy); ctx.lineTo(cx + hw * 0.55, cy + hh - 3); ctx.stroke();
    ctx.restore();
  }
};

// ---------------------------------------------------------------- Shackled on a unit (render.js, after the other marks)
// While it builds: the irons, open, closing as it fills. SHACKLED: shut, the chain between them taut, a lock on it.
// Three takes (fxvar.js `shackle`): 1 Irons (a cuff at each wrist and the chain across its front), 2 Wound (a chain
// wound round its body, link by link as it builds, a lock where the ends meet), 3 Staked (the cuffs, and a chain
// down to a ring bolted to the floor behind it).
export function drawMarks3(ctx, u, w) {
  if (!u.st || u.dead || u.hidden || (u.ethereal && !u.exiting)) return;
  const on = u.shackledT > 0, fill = on ? 1 : k01((u.st.shackle || 0) / 100); if (fill < 0.05) return;
  const v = variant('shackle'), R = u.vr, a = u.facing, c = Math.cos(a), s = Math.sin(a), [vx, vy] = upVec(), hop = (u.hop || 0) * 0.9, X = u.x + vx * hop, Y = u.y + vy * hop;
  ctx.save();
  if (v === 2) {
    // Wound: the chain goes round its body link by link (16 is all the way round), and is locked where the ends meet
    const n = on ? 16 : Math.round(15 * fill);
    for (let i = 0; i < n; i++) { const b = a + 0.25 + i / 16 * TAU, wob = Math.sin(i * 1.9) * 0.05; link(ctx, X + Math.cos(b) * R * (1.02 + wob), Y + Math.sin(b) * R * (1.02 + wob), b + Math.PI / 2 + (i % 2 ? 0.5 : -0.5), 1.05, on ? IRON[2] : IRON[1]); }
    if (on) upright(ctx, X + c * R * 1.02, Y + s * R * 1.02, () => padlock(ctx, 0, 0, 1.1));
  } else {
    // the wrists: out at its sides and a little forward (where the art's hands are), never over its face
    const wr = R * 1.06, fw = R * 0.42, lx = X + c * fw - s * wr, ly = Y + s * fw + c * wr, rx = X + c * fw + s * wr, ry = Y + s * fw - c * wr, gap = on ? 0 : 0.5 + 2.2 * (1 - fill);
    if (v === 3) { const bx = u.x - c * (R + 30), by = u.y - s * (R + 30); ctx.save(); ctx.globalAlpha *= fill; chain(ctx, u.x - c * R * 0.95, u.y - s * R * 0.95, bx, by, on ? 0 : 3); inked(ctx, () => { ctx.beginPath(); ctx.arc(bx, by, 5.5, 0, TAU); }, IRON[0]); ctx.restore(); }
    else if (on) { chain(ctx, lx, ly, rx, ry, R * 0.75, 0.95, IRON[2]); upright(ctx, (lx + rx) / 2 + c * R * 0.75, (ly + ry) / 2 + s * R * 0.75, () => padlock(ctx, 0, 0, 1)); } // locked: the chain hangs across its front, a lock in the middle
    else { // closing: a few links hang from each cuff, more as it fills; they don't meet until it bursts
      const n = Math.round(1 + 3 * fill); for (const [hx, hy, sd] of [[lx, ly, -1], [rx, ry, 1]]) for (let i = 1; i <= n; i++) link(ctx, hx + c * i * 6.5 + s * sd * i * -1.6, hy + s * i * 6.5 - c * sd * i * -1.6, a + (i % 2 ? 0.5 : -0.5), 0.9);
    }
    cuff(ctx, lx, ly, on ? 7.5 : 6.5, a + Math.PI / 2, gap); cuff(ctx, rx, ry, on ? 7.5 : 6.5, a - Math.PI / 2, gap);
  }
  ctx.restore();
}
