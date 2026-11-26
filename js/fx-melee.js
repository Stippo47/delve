// Round 19 (lane melee19): the knights' and brutes' looks, redone from the designer's notes on 0.19's heroes
// (docs/riffle-log/2026-11-25-v19-v21-partial.txt), in the one effects style (docs/FX-STYLE.md): solid things inked,
// light additive and never outlined, dust soft and unoutlined, ground effects under the units, hashed noise, no blur.
// It fills fx2.js's tables (DRAW2: 'k2' fx by `draw` name; SLAM2: a slam's look) like fx-dash.js; render.js imports it.
//   Old Guard   warCry (Rally), parryGuard / parry (Parry, and the Dame's Riposte), haste (every Haste)
//   Griffon     griffWings (Swoop's beat, Wing Guard's cover: the wings on his helm), downdraft, windSwirl, wingBlast,
//               clap (Stormhammer II, Wing Guard III, Storm Born III), whirled (the status)
//   Bulwark     brace, spearCharge (at the spear's real head)
//   Warhelm     SLAM2.splitter (Skull Splitter's landing)
//   Bearskin    clawSwipe, bearBite (Bear Claws), hibernate, bearWake (Hibernate), SLAM2.maul (Maul)
//   Haymaker    hayTrail, hayBurst (Hay Bale)
import { TAU, clamp, INK, OUTLINES } from './util.js';
import { inked, inkLine, glowDisc, star, upright, upVec, hash, easeOut } from './fx.js';
import { DRAW2, SLAM2, SIG2, crater } from './fx2.js';
// (round 19: these draw their own cast; the kit's default cast star, a white four-point star at the hand, was the "weird
// star" the designer saw on the Maul)
for (const id of ['maul', 'hibernate', 'bearRoar', 'pommelStrike', 'rallyCry', 'toss', 'forkCharge', 'swoop', 'wingShield', 'skullSplitter']) SIG2[id] = () => false;
import { OUTLINE } from './render.js';

const k01 = (v) => clamp(v, 0, 1);
const sm = (k) => { k = k01(k); return k * k * (3 - 2 * k); };
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const disc = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill(); };
const inkDisc = (ctx, x, y, r, col) => inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); }, col);
const life = (f, i = 0.12, o = 0.3) => k01(Math.min(f.t / i, (f.max - f.t) / o, 1));
const alive2 = (u) => u && !u.dead && !u.downed;
const ended = (f, gone) => { if (gone && f.max > f.t + 0.25) f.max = f.t + 0.25; };
// a pointed streak from (x, y) along a, base at r0, point at r1 (as fxkit's)
function streakPath(ctx, x, y, a, r0, r1, wd) {
  const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c, L = r1 - r0;
  const bx = x + c * r0, by = y + s * r0, tx = x + c * r1, ty = y + s * r1, mx = x + c * (r0 + L * 0.72), my = y + s * (r0 + L * 0.72);
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(mx + nx * wd / 2, my + ny * wd / 2, tx, ty); ctx.quadraticCurveTo(mx - nx * wd / 2, my - ny * wd / 2, bx, by); ctx.closePath();
}
function streak(ctx, x, y, a, r0, r1, wd, main, core) {
  if (r1 - r0 < 1) return;
  inked(ctx, () => streakPath(ctx, x, y, a, r0, r1, wd), main);
  if (core) { ctx.fillStyle = core; streakPath(ctx, x, y, a, r0 + (r1 - r0) * 0.35, r1 - 1, wd * 0.38); ctx.fill(); }
}
// soft dust: cream puffs with a lighter top, no ink (inked dust reads as grey bubbles)
function softDust(ctx, x, y, r, a, col = '#E9DDC2') { ctx.save(); ctx.globalAlpha *= a; disc(ctx, x, y, r, col); ctx.globalAlpha *= 0.85; disc(ctx, x - r * 0.2, y - r * 0.25, r * 0.6, '#FFF8E6'); ctx.restore(); }
// a point of a unit's sprite (SVG units: the 220 box, centre 100,100, front = +y) in the room, its part posed as drawn
// (u._pose, parts.js) about the part's pivot. Lunges and hops aside, this is where that bit of the picture is.
function spritePt(u, sx, sy, part, pivot) {
  const p = part && u._pose && u._pose[part];
  if (p) { const c = Math.cos(p.r || 0), s = Math.sin(p.r || 0), dx = sx - pivot[0], dy = sy - pivot[1]; sx = pivot[0] + (p.dx || 0) + dx * c - dy * s; sy = pivot[1] + (p.dy || 0) + dx * s + dy * c; }
  if (u.def.style && u.def.style.flip) sx = 200 - sx;
  const k = u.vr / (u.def.headR || 54), a = u.facing - Math.PI / 2, x = (sx - 100) * k, y = (sy - 100) * k;
  return { x: u.x + x * Math.cos(a) - y * Math.sin(a), y: u.y + x * Math.sin(a) + y * Math.cos(a) };
}
// where a body is drawn when it is off the floor (render.js unitFrame: lifted up the screen by 0.9 of its hop)
const lifted = (u) => { const [ux, uy] = upVec(), h = (u.hop || 0) * 0.9; return [u.x + ux * h, u.y + uy * h]; };

// ================================================================ Old Guard
// Rally: a war cry. Gold sound bursts thrown out to his front and sides, three waves, and a gold light washing out over
// the floor to the cry's real reach (240), no ring; the friends it reaches get their own chevrons (fx2 'rally').
DRAW2.warCry = (ctx, f, w, layer) => {
  const u = alive2(f.unit) ? f.unit : null, x = u ? u.x : f.x, y = u ? u.y : f.y, k = k01(f.t / f.max), fa = u ? u.facing : 0, T = f.t;
  if (layer === 'ground') { // gold light poured over the floor out to the cry's reach, brightest at its edge (a soft band, no line)
    const e = easeOut(k01(T / 0.5)), R = f.r * (0.3 + 0.7 * e), a = 0.5 * (1 - k01((T - 0.6) / 0.6));
    if (a <= 0) return; const g = ctx.createRadialGradient(x, y, R * 0.2, x, y, R);
    g.addColorStop(0, `rgba(242,193,78,${0.16 * a})`); g.addColorStop(0.82, `rgba(242,193,78,${0.42 * a})`); g.addColorStop(1, 'rgba(242,193,78,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); return; }
  if (T < 0.12) lit(ctx, () => glowDisc(ctx, x, y, 34, '#FFE7A0', 0.3 * (1 - T / 0.12)));
  // three waves of the shout, 0.28 s apart, each its own burst of thick gold sound strokes out of his front and sides
  const r0 = (u ? u.vr : 24) + 8, dirs = [-1.5, -0.75, 0, 0.75, 1.5];
  for (let wv = 0; wv < 3; wv++) { const q = k01((T - wv * 0.28) / 0.5); if (q <= 0 || q >= 1) continue; const e = easeOut(q), R = r0 + 70 * e;
    ctx.save(); ctx.globalAlpha *= 1 - q * q;
    for (const d of dirs) { const b = fa + d, half = 0.28 - 0.08 * q; inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y, R, b - half, b + half); }, wv % 2 ? '#FFE7A0' : '#F2C14E', 6 * (1 - 0.45 * q) + 1.5); }
    ctx.restore(); }
};
// Parry (round 19, "Don't like look. Good implementation though"): no bar of light any more. He holds the greatsword
// itself flat across his front (kits2.js PARRY_POSE, through parts.js), and a cold glint runs up and down its edge while
// he waits. The blade's ends are read off the posed sprite.
const OG_PIVOT = [105, 152], OG_BASE = [81.7, 171.3], OG_TIP = [43.4, 203.4]; // (the blade's root and point: #ogBlade 16 and 66 down it, at 94,161 turned 50 degrees)
DRAW2.parryGuard = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const P = u.kit && u.kit.parry; ended(f, !(P && P.until > w.time && P.n > 0));
  if (w.time - ((P && P.caughtT) ?? -9) < 0.32) return; // (the guard drops for the riposte)
  const a = life(f, 0.15, 0.2), b0 = spritePt(u, ...OG_BASE, 'arm-r', OG_PIVOT), b1 = spritePt(u, ...OG_TIP, 'arm-r', OG_PIVOT), run = (Math.sin(f.t * 5) + 1) / 2;
  const gx = b0.x + (b1.x - b0.x) * run, gy = b0.y + (b1.y - b0.y) * run;
  ctx.save(); ctx.globalAlpha *= a;
  lit(ctx, () => { glowDisc(ctx, gx, gy, 14, '#FFFFFF', 0.9); ctx.globalAlpha *= 0.55; ctx.strokeStyle = '#DDF0FF'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.stroke(); });
  ctx.restore();
};
// a blow caught on the blade (Parry; the Dame's Riposte on her shield): a white clash, steel sparks spraying off the
// way the blow came, a short bright crescent where the blade turned it
DRAW2.parry = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, 24, '#FFFFFF', 0.6 * (1 - k / 0.2))); // (small: the body behind it stays readable)
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  // the turn: a crescent of steel light across the line of the blow
  const half = 0.9; inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x - Math.cos(f.a) * 10, f.y - Math.sin(f.a) * 10, 18 + 10 * e, f.a - half, f.a + half); }, '#EEF3F8', 5 * (1 - k) + 1);
  for (let i = 0; i < 7; i++) { const b = f.a + (hash(i, f.x | 0) - 0.5) * 2.2, d = 6 + 34 * e * (0.6 + 0.6 * hash(f.y | 0, i)); streak(ctx, f.x + Math.cos(b) * d * 0.4, f.y + Math.sin(b) * d * 0.4, b, 0, d * 0.6 + 6 * (1 - k), 3, i % 2 ? '#FFF4C8' : '#FFFFFF', null); }
  ctx.restore();
};
// Haste (round 19, the Rally's haste: "better visual effect"): a hasted body leaves pale blue copies of itself behind as
// it moves (render.js dashGhosts draws them from u._dvTrail), with thin speed lines; standing, little blue sparks
// whip up off its feet now and then
DRAW2.haste = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'ground' || !alive2(u)) return; ended(f, !(u.buffs && u.buffs.some((b) => b.id === 'haste')));
  const sp = Math.hypot(u.vx || 0, u.vy || 0), a = life(f, 0.1, 0.3), m = sp > 8 ? Math.atan2(u.vy, u.vx) : u.facing;
  if (sp > 12 && !u.hidden && f.t < f.max - 0.25) { const tr = u._dvTrail || (u._dvTrail = []); if (!f.lastT || w.time - f.lastT > 0.05) { f.lastT = w.time; tr.push({ x: u.x, y: u.y, f: u.facing, t: w.time, col: '#9FDDF6' }); } }
  ctx.save(); ctx.globalAlpha *= a * clamp(sp / 50, 0, 1);
  for (let i = -1; i <= 1; i++) { const ph = (f.t * 3.4 + hash(i + 2, u.id)) % 1, nx = -Math.sin(m) * i * 12, ny = Math.cos(m) * i * 12, d = u.r + 2 + ph * 22;
    streak(ctx, u.x + nx - Math.cos(m) * d, u.y + ny - Math.sin(m) * d, m + Math.PI, 0, 30 * (1 - ph) + 10, 2.4, '#BFE9F8', '#FFFFFF'); }
  ctx.restore();
  if (sp <= 24) { const ph = (f.t * 1.8) % 1, b = hash(Math.floor(f.t * 1.8), u.id) * TAU; ctx.save(); ctx.globalAlpha *= a * Math.sin(ph * Math.PI);
    const x0 = u.x + Math.cos(b) * u.r * 0.8, y0 = u.y + Math.sin(b) * u.r * 0.8, [ux, uy] = upVec();
    streak(ctx, x0, y0, Math.atan2(uy, ux), 0, 10 + 14 * ph, 2.6, '#BFE9F8', '#FFFFFF'); ctx.restore(); }
};

// ================================================================ Griffon
// The wings on his helm (art/heroes/griffon.svg #gWingL), as a path with its root at the origin, tip out to -68,-48
const WING = (c) => { c.beginPath(); c.moveTo(-2, 4); c.bezierCurveTo(-24, 4, -52, -14, -68, -48); c.quadraticCurveTo(-58, -56, -50, -50); c.quadraticCurveTo(-56, -64, -42, -66);
  c.quadraticCurveTo(-44, -78, -30, -74); c.quadraticCurveTo(-28, -86, -14, -76); c.quadraticCurveTo(-4, -68, 2, -50); c.bezierCurveTo(10, -30, 12, -6, -2, 4); c.closePath(); };
const WING_TIP = Math.atan2(-48, -68); // the way the tip points in the helm's own drawing
// one wing at (x, y), its tip turned to point along `toward`, s room units per helm unit, mirrored (side -1)
function wing(ctx, x, y, toward, s, side) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(toward - (side > 0 ? WING_TIP : Math.PI - WING_TIP)); ctx.scale(s * side, s);
  if (OUTLINES) { ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2 / s; ctx.lineJoin = 'round'; WING(ctx); ctx.fill(); ctx.stroke(); ctx.restore(); } // (round 19, lane toggles19)
  const g = ctx.createLinearGradient(-60, -70, -10, 4); g.addColorStop(0, '#FBD46E'); g.addColorStop(1, '#E09A2E'); ctx.fillStyle = g; WING(ctx); ctx.fill();
  ctx.save(); WING(ctx); ctx.clip();
  ctx.fillStyle = 'rgba(248,238,216,0.92)'; ctx.beginPath(); ctx.moveTo(2, 4); ctx.bezierCurveTo(-22, -2, -46, -20, -62, -48); ctx.lineTo(-52, -50); ctx.bezierCurveTo(-38, -26, -20, -12, 4, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(197,126,30,0.3)'; ctx.beginPath(); ctx.moveTo(-38, -62); ctx.bezierCurveTo(-28, -44, -14, -30, 2, -20); ctx.lineTo(4, -26); ctx.bezierCurveTo(-10, -36, -22, -48, -30, -66); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(197,126,30,0.24)'; ctx.beginPath(); ctx.moveTo(-52, -50); ctx.bezierCurveTo(-40, -34, -24, -20, -2, -10); ctx.lineTo(2, -14); ctx.bezierCurveTo(-18, -24, -34, -38, -44, -54); ctx.closePath(); ctx.fill();
  ctx.restore(); ctx.restore();
}
// Swoop's beat (f.flap) and Wing Guard (f.guard): the helm's wings, grown, drawn over him (round 19: "Wings same style
// as the one on his sprite, render above him. 40% smaller"). Wing Guard's are wrapped forward round his sides; Swoop's
// spread out to the sides and beat as he flies.
DRAW2.griffWings = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; ended(f, f.guard && !(u.kit && u.kit.wingUntil > w.time));
  const a = life(f, 0.12, 0.2), open = easeOut(k01(f.t / 0.2)) * (f.guard ? sm((f.max - f.t) / 0.25) : 1), [x, y] = lifted(u), sc = 1 + (u.hop || 0) / 110;
  const fa = u.facing, nx = -Math.sin(fa), ny = Math.cos(fa), root = u.r * 0.55 * sc;
  ctx.save(); ctx.globalAlpha *= a;
  for (const sd of [-1, 1]) {
    const rx = x + nx * root * sd - Math.cos(fa) * 4, ry = y + ny * root * sd - Math.sin(fa) * 4, out = fa + sd * Math.PI / 2;
    let toward, s;
    if (f.guard) { toward = out + (fa - out) * (0.34 * open) - sd * 0.5 * (1 - open) + Math.sin(f.t * 3) * 0.03 * sd; s = 0.6 * (0.7 + 0.3 * open); } // (mantled: out to his sides, curled a little forward) // (wrapped forward round him; folded back as they close)
    else { const beat = Math.sin(f.t * 21); toward = out - sd * (0.32 + 0.38 * beat); s = 0.62 * (1 - 0.18 * Math.abs(beat)); }
    wing(ctx, rx, ry, toward, s * sc, sd);
  }
  if (f.guard && f.t < 0.35) lit(ctx, () => glowDisc(ctx, x, y, u.r * 2.2, '#FFE7A0', 0.4 * (1 - f.t / 0.35)));
  ctx.restore();
};
// gold feathers, drifting: n of them from (x, y), spread out over spread radians round a, falling and turning
function feathers(ctx, f, x, y, a, spread, n, reach, k) {
  const [ux, uy] = upVec();
  for (let i = 0; i < n; i++) { const b = a + (hash(i, f.seed || 7) - 0.5) * spread, d = reach * easeOut(k) * (0.5 + 0.5 * hash(f.seed || 3, i)), h = Math.sin(k01(k * 1.4) * Math.PI) * 14 * hash(i, 9);
    const px = x + Math.cos(b) * d + ux * h + Math.sin(k * 9 + i) * 3, py = y + Math.sin(b) * d + uy * h;
    ctx.save(); ctx.translate(px, py); ctx.rotate(b + k * 5 * (i % 2 ? 1 : -1));
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(0, -4.2, 6, 0); ctx.quadraticCurveTo(0, 4.2, -6, 0); ctx.closePath(); }, i % 2 ? '#FBD46E' : '#F8EED8');
    ctx.restore(); }
}
// Swoop's take-off: the downdraft of his wings: dust driven out low along the floor, and a few loose feathers
DRAW2.downdraft = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k);
  if (layer === 'ground') { for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + hash(i, f.x | 0) * 0.5, d = f.r * (0.3 + 0.8 * e); softDust(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, (9 + 5 * hash(f.y | 0, i)) * (1 - 0.5 * k), 0.75 * (1 - k) * (1 - k)); } return; }
  ctx.save(); ctx.globalAlpha *= 1 - k * k; feathers(ctx, f, f.x, f.y, 0, TAU, 5, f.r * 0.9, k); ctx.restore();
};
// Swoop's landing (round 19: "whirl effect (which is flipped the wrong way)"): three bands of wind swept round him the
// way he spins, each trailing behind its own front (it led before), and a soft edge of moving air at the swirl's real
// reach (f.r: whoever is inside is whirled and thrown)
DRAW2.windSwirl = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k01(k / 0.5)), dir = f.dir || 1;
  if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= (1 - k) * 0.8;
    lit(ctx, () => { const g = ctx.createRadialGradient(f.x, f.y, f.r * 0.55, f.x, f.y, f.r); g.addColorStop(0, 'rgba(238,243,248,0)'); g.addColorStop(0.85, 'rgba(238,243,248,0.32)'); g.addColorStop(1, 'rgba(238,243,248,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.6 + 0.4 * e), 0, TAU); ctx.fill(); });
    ctx.restore(); return; }
  ctx.save(); ctx.globalAlpha *= (1 - k) * (1 - k * 0.5);
  for (let i = 0; i < 3; i++) { const b0 = i / 3 * TAU + dir * f.t * 8, N = 16, pts = [];
    for (let j = 0; j <= N; j++) { const q = j / N, b = b0 - dir * q * 2.2, R = f.r * (0.25 + 0.75 * (1 - q * 0.35)) * (0.45 + 0.55 * e); pts.push([f.x + Math.cos(b) * R, f.y + Math.sin(b) * R, 1 - q]); }
    // a tapering band: thick at its front (j = 0), to a point at its tail
    inked(ctx, () => { ctx.beginPath(); pts.forEach(([x, y, t], j) => { const n = pts[Math.min(N, j + 1)], p0 = pts[Math.max(0, j - 1)], dx = n[0] - p0[0], dy = n[1] - p0[1], L = Math.hypot(dx, dy) || 1, wd = 7 * t * (1 - k * 0.6) + 0.6; const X = x - dy / L * wd, Y = y + dx / L * wd; if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      for (let j = N; j >= 0; j--) { const [x, y, t] = pts[j], n = pts[Math.min(N, j + 1)], p0 = pts[Math.max(0, j - 1)], dx = n[0] - p0[0], dy = n[1] - p0[1], L = Math.hypot(dx, dy) || 1, wd = 7 * t * (1 - k * 0.6) + 0.6; ctx.lineTo(x + dy / L * wd, y - dx / L * wd); } ctx.closePath(); }, i % 2 ? '#EEF3F8' : '#FFFFFF'); }
  ctx.restore();
};
// Wing Guard's blast: his wing beats at the one that struck him: a white flash, two curved fronts of air thrown at it
// and a few gold feathers knocked loose
DRAW2.wingBlast = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k);
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, 44, '#FFF7E0', 0.7 * (1 - k / 0.25)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 2; i++) { const q = k01(k * 1.4 - i * 0.2); if (q <= 0) continue; const R = 14 + f.r * easeOut(q), half = 0.55 - 0.15 * q;
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, R, f.a - half, f.a + half); }, i ? '#EEF3F8' : '#FFFFFF', 5 * (1 - q) + 1.4); }
  feathers(ctx, f, f.x, f.y, f.a, 1.6, 3, f.r * 0.8, k);
  ctx.restore();
};
// a small thunderclap (Stormhammer II, Wing Guard III, Storm Born III). Round 19 ("I don't think I like the yellow
// arrows"): no zig-zag sparks; a white flash, a pale shock of air going out to its reach, white cloud puffs
DRAW2.clap = (ctx, f, w, layer) => {
  const k = k01(f.t / f.max), e = easeOut(k);
  if (layer === 'ground') { lit(ctx, () => { ctx.save(); ctx.globalAlpha *= (1 - k) * 0.8; const g = ctx.createRadialGradient(f.x, f.y, f.r * e * 0.6, f.x, f.y, f.r * e + 1); g.addColorStop(0, 'rgba(255,247,194,0)'); g.addColorStop(0.8, 'rgba(255,247,194,0.4)'); g.addColorStop(1, 'rgba(255,247,194,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * e + 1, 0, TAU); ctx.fill(); ctx.restore(); }); return; }
  if (k < 0.22) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.2, '#FFFBEA', 0.85 * (1 - k / 0.22)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + hash(i, f.x | 0), d = f.r * (0.2 + 0.65 * e), r = (6.5 + 3 * hash(i, f.y | 0)) * (1 - 0.4 * k);
    inked(ctx, () => { ctx.beginPath(); ctx.arc(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, r, 0, TAU); ctx.arc(f.x + Math.cos(b) * d + r * 0.7, f.y + Math.sin(b) * d - r * 0.3, r * 0.7, 0, TAU); }, i % 2 ? '#FFFFFF' : '#EEF3F8'); }
  ctx.restore();
};
// Whirled (round 19, on the Stormhammer: "try the whirled effect as circular and a radius around them"): white wind
// curls running round it on a circle, more and faster as it builds, and the faint circle they run on
DRAW2.whirled = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'ground' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; }
  const q = clamp(((u.k2s && u.k2s.whirl) || 0) / 100, 0, 1); ended(f, q <= 0.01);
  const a = life(f, 0.15, 0.25), n = 2 + Math.round(q * 3), R = u.vr * 1.3 + 4;
  ctx.save(); ctx.globalAlpha *= a * (0.55 + 0.45 * q);
  ctx.save(); ctx.globalAlpha *= 0.35; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, TAU); ctx.stroke(); ctx.restore();
  for (let i = 0; i < n; i++) { const b0 = f.t * (4 + 6 * q) + i / n * TAU;
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(u.x, u.y, R, b0, b0 + 0.9); }, i % 2 ? '#EEF3F8' : '#FFFFFF', 3.2); }
  ctx.restore();
};

// ================================================================ Bulwark
// round 19 ("Star isn't on spear head"): the set spear's glint and the wound-up Return Thrust's star sit on the spear's
// real head (art/heroes/r12/bulwark.svg: the point at 184,204, the head's middle at 186,182; arm-r turns about 150,108)
const BW_PIVOT = [150, 108], BW_HEAD = [186, 184];
DRAW2.brace = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const q = spritePt(u, ...BW_HEAD, 'arm-r', BW_PIVOT), p = 0.5 + 0.5 * Math.sin(f.t * 9);
  lit(ctx, () => glowDisc(ctx, q.x, q.y, 14 + 8 * p, '#FFFFFF', 0.45 * life(f)));
  ctx.save(); ctx.globalAlpha *= life(f) * (0.5 + 0.5 * p); inked(ctx, () => star(ctx, q.x, q.y, 7, 4, 0.3, f.t * 2), '#FFFFFF'); ctx.restore();
};
DRAW2.spearCharge = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) { if (!alive2(u)) ended(f, true); return; }
  const n = (u.kit && u.kit.pent) || 0; ended(f, n <= 0); if (n <= 0) return;
  const q = spritePt(u, ...BW_HEAD, 'arm-r', BW_PIVOT), p = 0.5 + 0.5 * Math.sin(f.t * (6 + n * 2));
  lit(ctx, () => glowDisc(ctx, q.x, q.y, 10 + 5 * n + 4 * p, n >= 5 ? '#FFE7A0' : '#FFFFFF', 0.25 + 0.1 * n));
  ctx.save(); ctx.globalAlpha *= 0.6 + 0.4 * p; inked(ctx, () => star(ctx, q.x, q.y, 4 + n * 1.6, 4, 0.3, f.t * 2), '#FFFFFF'); ctx.restore();
};

// ================================================================ Warhelm
// Skull Splitter's landing (round 19: "Better visual effects"): the warhammer's crater, wider, with the shock it carries
// cracking out of it: short forked arcs of lightning running out over the floor to the slam's reach (no X stars)
SLAM2.splitter = (ctx, m, k, layer) => {
  crater(ctx, m, k, layer, { R: m.r, dust: '#E9DDC2', chips: ['#D8CCB6', '#B3A690'], hold: 1, dent: 0.42 });
  if (layer !== 'air') return; const T = m.t, q = k01(T / 0.32); if (q >= 1) return;
  ctx.save(); ctx.globalAlpha *= 1 - q;
  const re = Math.floor(T * 24); // (the kinks re-rolled a few times a second: crackling)
  for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + hash(i, m.seed) * 0.6, L = m.r * (0.6 + 0.4 * easeOut(q)) * (0.8 + 0.3 * hash(m.seed, i)), r0 = m.r * 0.3, pts = [];
    for (let j = 0; j <= 4; j++) { const d = r0 + (L - r0) * j / 4, o = j && j < 4 ? (hash(i * 7 + j, re) - 0.5) * 20 : 0; pts.push([m.x + Math.cos(b) * d - Math.sin(b) * o, m.y + Math.sin(b) * d + Math.cos(b) * o]); }
    const path = () => { ctx.beginPath(); pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
    lit(ctx, () => { ctx.globalAlpha *= 0.35; ctx.strokeStyle = '#FFE66B'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; path(); ctx.stroke(); });
    inkLine(ctx, path, '#FFE14D', 4.2); ctx.strokeStyle = '#FFFBEA'; ctx.lineWidth = 1.6; path(); ctx.stroke(); }
  ctx.restore();
};

// ================================================================ Bearskin
// Bear Claws' swing (round 19: "He does the swinging"): his paw is drawn back and raked in across his front (kits2.js
// CLAW_KEYS, the left and right in turn), and three claw marks are drawn along the path his claws really take, from the
// moment the rake starts, thick at their leading end, fading after
const PAW = [[138, 172], [158, 170], [178, 163]], PAW_PIVOT = [160, 108];
const mixP = (a, b, q) => ({ r: (a.r || 0) + ((b.r || 0) - (a.r || 0)) * q, dx: (a.dx || 0) + ((b.dx || 0) - (a.dx || 0)) * q, dy: (a.dy || 0) + ((b.dy || 0) - (a.dy || 0)) * q });
function posedPt(u, sx, sy, pivot, p) {
  const c = Math.cos(p.r || 0), s = Math.sin(p.r || 0), dx = sx - pivot[0], dy = sy - pivot[1]; sx = pivot[0] + (p.dx || 0) + dx * c - dy * s; sy = pivot[1] + (p.dy || 0) + dx * s + dy * c;
  const k = u.vr / (u.def.headR || 54), a = u.facing - Math.PI / 2, x = (sx - 100) * k, y = (sy - 100) * k;
  return { x: u.x + x * Math.cos(a) - y * Math.sin(a), y: u.y + x * Math.sin(a) + y * Math.cos(a) };
}
DRAW2.clawSwipe = (ctx, f, w, layer) => {
  const u = f.unit; if (layer !== 'air' || !alive2(u)) return; const T = f.t; if (T < f.t1) return;
  const L = f.hand === 'arm-l', W = L ? { r: -f.W.r, dx: -f.W.dx, dy: f.W.dy } : f.W, S = L ? { r: -f.S.r, dx: -f.S.dx, dy: f.S.dy } : f.S, piv = L ? [200 - PAW_PIVOT[0], PAW_PIVOT[1]] : PAW_PIVOT;
  const head = easeOut(k01((T - f.t1) / (f.t2 - f.t1))) * 1.15, tail = sm(k01((T - f.t2) / 0.22)) * 1.15, fade = k01((f.max - T) / 0.15);
  if (head - tail < 0.03) return;
  ctx.save(); ctx.globalAlpha *= fade;
  for (const [px, py] of PAW) { const sx = L ? 200 - px : px, N = 10, pts = [];
    for (let i = 0; i <= N; i++) { const q = tail + (head - tail) * i / N; pts.push(posedPt(u, sx, py, piv, mixP(W, S, q))); }
    inked(ctx, () => { ctx.beginPath(); pts.forEach((p, i) => { const n = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], dx = n.x - o.x, dy = n.y - o.y, l = Math.hypot(dx, dy) || 1, wd = 4 * Math.pow(i / N, 1.2) + 0.5; (i ? ctx.lineTo : ctx.moveTo).call(ctx, p.x - dy / l * wd, p.y + dx / l * wd); });
      for (let i = N; i >= 0; i--) { const p = pts[i], n = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], dx = n.x - o.x, dy = n.y - o.y, l = Math.hypot(dx, dy) || 1, wd = 4 * Math.pow(i / N, 1.2) + 0.5; ctx.lineTo(p.x + dy / l * wd, p.y - dx / l * wd); } ctx.closePath(); }, '#FFF8F0'); }
  ctx.restore();
};
// the bite at the end (round 19: "Rotate bite 90 degrees so it's always flat with him"): two rows of fangs lying across
// his facing, one on his side of it and one beyond, snapping shut along the line he faces; blood flung off after
DRAW2.bearBite = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), open = easeOut(k01(k / 0.18)), shut = k < 0.24 ? 0 : easeOut(k01((k - 0.24) / 0.12)), s = clamp(f.r / 20, 0.9, 1.7);
  const gap = (1 - shut) * (10 + 8 * open) * s + 1.5, a = f.a;
  ctx.save(); ctx.globalAlpha *= k01((1 - k) / 0.35);
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(f.x - Math.cos(a) * gap * sd, f.y - Math.sin(a) * gap * sd); ctx.rotate(a - sd * Math.PI / 2);
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-15 * s, -2 * s); ctx.quadraticCurveTo(0, -6 * s, 15 * s, -2 * s); for (let i = 3; i >= 0; i--) { const x0 = -11.5 * s + i * 7.7 * s, L = i === 0 || i === 3 ? 8.5 : 6; ctx.lineTo(x0 + 3 * s, -1 * s); ctx.lineTo(x0, L * s); ctx.lineTo(x0 - 3 * s, -1 * s); } ctx.closePath(); }, '#FFF8F0');
    ctx.restore(); }
  if (shut > 0.95) { if (k < 0.45) lit(ctx, () => glowDisc(ctx, f.x, f.y, 30 * s, '#FFFFFF', 0.6 * (1 - (k - 0.36) / 0.09)));
    for (let i = 0; i < 5; i++) { const b = a + (hash(i, 7) - 0.5) * 2.4, d = 8 + 26 * easeOut(k01((k - 0.36) / 0.64)); inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 3 * (1 - k) + 1, '#C8453D'); } }
  ctx.restore();
};
// Hibernate (round 19: "Doesnt show the status effect on him"): he lies curled up low (kits2.js: u.squish, breathing),
// a warm glow on him, and big inked Zs float up off him, swaying, clear of his health bar
const zPath = (c, s) => { c.beginPath(); c.moveTo(-6 * s, -7 * s); c.lineTo(6 * s, -7 * s); c.lineTo(6 * s, -4 * s); c.lineTo(-1.6 * s, 4 * s); c.lineTo(6 * s, 4 * s); c.lineTo(6 * s, 7 * s); c.lineTo(-6 * s, 7 * s); c.lineTo(-6 * s, 4 * s); c.lineTo(1.6 * s, -4 * s); c.lineTo(-6 * s, -4 * s); c.closePath(); };
DRAW2.hibernate = (ctx, f, w, layer) => {
  const u = f.unit; if (!alive2(u)) { ended(f, true); return; } ended(f, !(u.sleepT > 0));
  const a = life(f, 0.3, 0.35), [vx, vy] = upVec();
  if (layer === 'ground') { const R = u.vr * 2.2, p = 0.8 + 0.2 * Math.sin(f.t * 3.2), g = ctx.createRadialGradient(u.x, u.y, 0, u.x, u.y, R); // (a warm pool of light under him, normal blend: additive is lost on a pale floor)
    g.addColorStop(0, `rgba(255,150,60,${0.55 * a * p})`); g.addColorStop(0.7, `rgba(255,150,60,${0.3 * a * p})`); g.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, TAU); ctx.fill(); return; }
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 3; i++) { const ph = (f.t * 0.55 + i / 3) % 1, up = u.vr + 14 + ph * 50, side = u.vr * 1.35 + ph * 18, s = 1.5 + 1.3 * ph;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI);
    upright(ctx, u.x + vx * up + (vx ? 0 : side) + Math.sin(ph * 6 + i) * 4, u.y + vy * up + (vy ? 0 : side), () => { ctx.rotate(-0.18 + Math.sin(ph * 5) * 0.15); inked(ctx, () => zPath(ctx, s), '#D8ECFF'); });
    ctx.restore(); }
  ctx.restore();
};
// Hibernate III, waking (round 19: "Don't like the burst effect"): no ring. He rears up roaring: thick brown-and-bone
// sound bursts thrown out of his front, three waves, and dust blown out low along the floor all round to the roar's reach
DRAW2.bearWake = (ctx, f, w, layer) => {
  const u = alive2(f.unit) ? f.unit : null, x = u ? u.x : f.x, y = u ? u.y : f.y, k = k01(f.t / f.max), e = easeOut(k), fa = u ? u.facing : 0;
  if (layer === 'ground') { for (let i = 0; i < 12; i++) { const b = i / 12 * TAU + hash(i, f.t > 0 ? 5 : 5) * 0.4, d = f.r * (0.3 + 0.7 * e); softDust(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, (7 + 4 * hash(i, 3)) * (1 - 0.5 * k), 0.5 * (1 - k) * (1 - k), '#D9C3A0'); } return; }
  const r0 = (u ? u.vr : 24) + 10;
  for (let wv = 0; wv < 3; wv++) { const q = k01(k * 1.6 - wv * 0.2); if (q <= 0 || q >= 1) continue; const R = r0 + (f.r - r0) * easeOut(q);
    ctx.save(); ctx.globalAlpha *= (1 - q) * (1 - q * 0.4);
    for (const d of [-0.62, 0, 0.62]) { const b = fa + d, half = 0.3 - 0.08 * q; inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y, R, b - half, b + half); }, wv % 2 ? '#E9DDC2' : '#A0683A', 6.5 * (1 - 0.5 * q) + 1.5); } // (the roar out of his front; the dust shows it reaches all round)
    ctx.restore(); }
};
// Maul (round 19: "Don't like"): the club comes straight down (kits2.js MAUL_KEYS); a deep brown crater and a heavier
// kick of dust and clods; III its round reach (everything round it is staggered) shows as the dust ring going out to it
SLAM2.maul = (ctx, m, k, layer) => crater(ctx, m, k, layer, { R: m.r, dust: '#D9C3A0', chips: ['#7A6A58', '#5A4634'], hold: 1, dent: m.r > 60 ? 0.38 : 0.62 });

// ================================================================ Haymaker
// Hay Bale (round 19: "remove the hairs on it. Have it leave a trail of hay hairs"): straw dropped on the floor as the
// bale rolls, lying where it fell, fading after a couple of seconds
DRAW2.hayTrail = (ctx, f, w, layer) => {
  if (layer !== 'ground') return; const b = f.bale, here = alive2(b); // (f.bale, not f.unit: sim.js would end the trail with the bale)
  if (here) { if (f.lx == null || Math.hypot(b.x - f.lx, b.y - f.ly) > 13) { f.lx = b.x; f.ly = b.y; const n = (f.n = (f.n || 0) + 1), o = (hash(n, 1) - 0.5) * b.r * 1.5, h = b.head || b.facing || 0; f.pts.push({ x: b.x - Math.sin(h) * o, y: b.y + Math.cos(h) * o, a: hash(2, n) * TAU, t: f.t, c: n % 3 }); } }
  while (f.pts.length && f.t - f.pts[0].t > 2.2) f.pts.shift();
  if (!here && !f.pts.length) { f.max = f.t; return; }
  for (const p of f.pts) { const age = f.t - p.t, a = age < 1.4 ? 1 : 1 - (age - 1.4) / 0.8; if (a <= 0) continue;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(p.x, p.y); ctx.rotate(p.a);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(0, 1.4, 5, -0.4); }, ['#E8C860', '#F2DC8A', '#C9A040'][p.c], 1.8); ctx.restore(); }
};
// the bale bursting hay over the one it rolls into (round 19: "burst with hay when hitting someone"): a spray of straw
// thrown out mostly the way it was knocked, and a puff of chaff
DRAW2.hayBurst = (ctx, f, w, layer) => {
  if (layer !== 'air') return; const k = k01(f.t / f.max), e = easeOut(k), [ux, uy] = upVec();
  if (k < 0.15) lit(ctx, () => glowDisc(ctx, f.x, f.y, 36, '#FFF0B0', 0.5 * (1 - k / 0.15)));
  for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + hash(i, f.x | 0), d = 10 + 26 * e; softDust(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, (8 + 3 * hash(i, 2)) * (1 - 0.5 * k), 0.7 * (1 - k) * (1 - k), '#F2DC8A'); }
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 16; i++) { const b = f.a + (hash(i, 7) - 0.5) * 1.5, d = 14 + f.r * e * (0.4 + 0.6 * hash(i, 9)), h = Math.sin(k * Math.PI) * 26 * hash(i, 4);
    ctx.save(); ctx.translate(f.x + Math.cos(b) * d + ux * h, f.y + Math.sin(b) * d + uy * h); ctx.rotate(b + i + k * 6);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); }, ['#E8C860', '#F2DC8A', '#C9A040'][i % 3], 2.6); ctx.restore(); }
  ctx.restore();
};
