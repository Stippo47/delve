// The Great Engine, drawn (lane B, bosses3). One figure (boss-draw.js): a turning cog under a riveted iron dome with a
// brass furnace mouth and a lamp for an eye, two smokestacks at its back, and two jointed arms (shoulder hub, upper
// arm, elbow gear, forearm, wrist) that end in a hammer and a three-fingered claw. The arms telescope on bright piston
// rods when they reach. All of it shares one outline. The fight's state is u.ge (boss-engine.js).
import { TAU, clamp, dist } from './util.js';
import { flame, upright, inked, star } from './fx.js';
import { quake, dustPuffs, EL } from './fxkit.js';
import { figure, washOf, flashing, lin, rad, ballFill, gloss, glow, shade, ell, circ, rrect, capsule, gear, poly, ik2, up, BFX, easeOut, sm, k01, hash, slashBand, inkDisc, rgbaOf } from './boss-draw.js';
import { GE, shoulderOf } from './boss-engine.js';

const IRON = ['#7C8498', '#565C6D', '#383C48'], IRON_D = ['#5B6170', '#40444F', '#2B2E38'];
const BRASS = ['#FFD875', '#E9A93A', '#B5771C'], STEEL = ['#F4F7FA', '#C9D2DE', '#8A94A6'];
const HOT = ['#FFF0B0', '#FFC85A', '#FF8A3D', '#C8401F'];

// a sleeve of the arm from (x1, y1) towards (x2, y2), nominal length l; its piston rod shows past the sleeve
function bone(F, ctx, x1, y1, x2, y2, l, r, cols) {
  const d = Math.hypot(x2 - x1, y2 - y1) || 1, a = Math.atan2(y2 - y1, x2 - x1), L = Math.min(l, d);
  if (d > l + 2) F.line(() => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }, STEEL[1], 8.5, 'butt');
  F.at(x1, y1, a, () => {
    F.shape(() => capsule(ctx, 0, 0, r, L, 0, r * 0.86), () => lin(ctx, 0, -r, 0, r, cols[0], cols[1], cols[2]));
    F.detail(() => { ctx.fillStyle = BRASS[1]; ctx.fillRect(L * 0.62, -r * 0.84, 7, r * 1.68); ctx.fillStyle = 'rgba(43,34,48,0.35)'; ctx.fillRect(L * 0.62 - 1.2, -r * 0.84, 1.2, r * 1.68); ctx.fillRect(L * 0.62 + 7, -r * 0.84, 1.2, r * 1.68);
      gloss(ctx, L * 0.3, -r * 0.45, L * 0.22, r * 0.2, 0, 0.22); });
  });
}
function hammerHead(F, ctx, fl) {
  const o = { flash: fl };
  F.shape(() => rrect(ctx, -34, -11, 34, 22, 6), () => lin(ctx, 0, -11, 0, 11, IRON_D[0], IRON_D[1], IRON_D[2]), o);
  F.shape(() => rrect(ctx, -12, -35, 56, 70, 13), () => lin(ctx, 0, -35, 0, 35, IRON[0], IRON[1], IRON[2]), o);
  F.shape(() => rrect(ctx, 36, -39, 15, 78, 7), () => lin(ctx, 0, -39, 0, 39, BRASS[0], BRASS[1], BRASS[2]), o);
  F.shape(() => rrect(ctx, -15, -38, 12, 76, 6), () => lin(ctx, 0, -38, 0, 38, BRASS[0], BRASS[1], BRASS[2]), o);
  if (!fl) F.detail(() => {
    // a hazard band across the block, clipped to it
    ctx.save(); rrect(ctx, 6, -31, 22, 62, 4); ctx.clip(); ctx.fillStyle = '#F2C14E'; ctx.fillRect(6, -31, 22, 62);
    ctx.fillStyle = '#2B2230'; for (let y = -50; y < 50; y += 18) { ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(28, y + 14); ctx.lineTo(28, y + 23); ctx.lineTo(6, y + 9); ctx.closePath(); ctx.fill(); } ctx.restore();
    gloss(ctx, 4, -23, 13, 5, 0.1, 0.3); gloss(ctx, 43, -24, 4, 9, 0, 0.35, '255,250,220');
    ctx.fillStyle = '#C3CAD8'; for (const [x, y] of [[-3, -27], [-3, 27], [31, -27], [31, 27]]) { ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill(); }
  });
}
function clawHand(F, ctx, open, fl) {
  const o = { flash: fl };
  for (const s of [-1, 0, 1]) { // three talons: splayed when open, hooked together when shut
    const b = s * (0.28 + 0.6 * open);
    F.at(Math.cos(s * 0.95) * 17, Math.sin(s * 0.95) * 17, b, () => {
      F.shape(() => { ctx.beginPath(); ctx.moveTo(-4, -8.5); ctx.quadraticCurveTo(24, -11 - s * 3, 44, -s * (9 - 8 * open) * 1.2); ctx.quadraticCurveTo(22, 5 - s * 3, -4, 8.5); ctx.closePath(); }, () => lin(ctx, 0, -9, 10, 9, STEEL[0], STEEL[1], STEEL[2]), o);
      if (!fl) F.detail(() => { ctx.fillStyle = BRASS[1]; ctx.beginPath(); ctx.arc(1, 0, 5, 0, TAU); ctx.fill(); });
    });
  }
  F.shape(() => circ(ctx, 0, 0, 23), ballFill(ctx, 0, 0, 23, IRON[0], IRON[1], IRON[2]), o);
  F.shape(() => rrect(ctx, -30, -12, 18, 24, 6), () => lin(ctx, 0, -12, 0, 12, IRON_D[0], IRON_D[1], IRON_D[2]), o);
  if (!fl) F.detail(() => { ctx.strokeStyle = BRASS[1]; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.stroke(); ctx.fillStyle = '#2B2E38'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); gloss(ctx, -8, -11, 8, 4, -0.5, 0.3); });
}
function stump(F, ctx, T, i) {
  F.shape(() => rrect(ctx, -16, -11, 20, 22, 5), () => lin(ctx, 0, -11, 0, 11, IRON_D[0], IRON_D[1], IRON_D[2]));
  for (const s of [-1, 0, 1]) F.line(() => { ctx.beginPath(); ctx.moveTo(3, s * 6); ctx.quadraticCurveTo(12, s * 9 + Math.sin(T * 9 + s + i) * 3, 17, s * 11 + Math.sin(T * 7 + s * 2) * 4); }, s ? BRASS[1] : '#C8453D', 3);
  F.detail(() => { if (hash(Math.floor(T * 14), i) > 0.55) { ctx.fillStyle = '#FFF7C2'; star(ctx, 19 + hash(Math.floor(T * 14), 3) * 6, (hash(Math.floor(T * 14), 5) - 0.5) * 20, 7, 4, 0.3, T * 9); ctx.fill(); } });
}

export function drawEngine(ctx, u, w) {
  const k = u.ge, T = w.time, [ux, uy] = up();
  const heat = u.heat || 0, mouth = u.mouth || 0, press = u.pressK || 0;
  const jit = (k && k.shakeT > 0 ? 2.2 : 0) + press * 3.2 + (u.roast > 0 ? 1 : 0);
  if (k && k.shakeT > 0) k.shakeT -= w._dt || 0.016; if (u.roast > 0) u.roast -= w._dt || 0.016;
  const jx = jit ? (hash(Math.floor(T * 50), 1) - 0.5) * jit : 0, jy = jit ? (hash(Math.floor(T * 50), 2) - 0.5) * jit : 0;
  const bob = Math.sin(T * 1.9) * 2.2, hx = u.x + jx + ux * bob, hy = u.y + jy + uy * bob, R = u.vr;
  const fa = u.facing - Math.PI / 2, cogA = T * (0.5 + 1.6 * heat) + (u.spinV ? 0 : 0);
  // where the lamp looks: at its mark, in the head's own frame
  const la = k ? k.look - u.facing : 0, lx = -Math.sin(la) * 5.5, ly = Math.cos(la) * 5.5;
  const arms = k ? k.arm.map((a) => {
    const sh = shoulderOf(u, a), lift = a.lift || 0, hxw = a.x + ux * lift * 0.9, hyw = a.y + uy * lift * 0.9;
    const sx = sh.x + jx + ux * bob, sy = sh.y + jy + uy * bob, j = ik2(sx, sy, hxw, hyw, GE.arm.l1, GE.arm.l2, a.s * (a.hand ? 1 : 1));
    return { a, sx, sy, ex: j.ex + ux * lift * 0.15, ey: j.ey + uy * lift * 0.15, hx: hxw, hy: hyw, sc: 1 + lift / 300, fl: a.hand ? flashing(a.hand) : false };
  }) : [];
  const hf = flashing(u);
  figure(ctx, { wash: washOf(u, w), alpha: u.invulnT > 0 ? 0.82 : 1 }, (F) => {
    F.flash = false;
    // the cog it rides on, the smokestacks at its back
    F.at(hx, hy, fa, () => {
      F.shape(() => gear(ctx, 0, 0, R * 1.2, 12, 0.15, cogA), () => rad(ctx, 0, 0, R * 0.6, R * 1.2, '#4A4F5C', '#2E323C'));
      for (const s of [-1, 1]) {
        F.shape(() => capsule(ctx, s * 24, -R * 0.62, 12, s * 27, -R * 1.2, 12.5), () => lin(ctx, s * 24 - 12, 0, s * 24 + 12, 0, IRON[0], IRON[1], IRON[2]));
        F.detail(() => { ctx.fillStyle = BRASS[1]; ctx.beginPath(); ctx.ellipse(s * 27, -R * 1.2, 12.5, 12.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1F1A22'; ctx.beginPath(); ctx.arc(s * 27, -R * 1.2, 8, 0, TAU); ctx.fill();
          if (heat > 0.05) { ctx.fillStyle = rgbaOf(HOT[2], 0.6 * heat); ctx.beginPath(); ctx.arc(s * 27, -R * 1.2, 6, 0, TAU); ctx.fill(); } });
      }
      // the valve on its back, while the pressure climbs
      if (k && k.press && k.press.valve && !k.press.valve.dead) {
        const vf = flashing(k.press.valve), spin = T * (1 + 6 * press);
        F.shape(() => rrect(ctx, -9, -R - 22, 18, 26, 5), () => lin(ctx, -9, 0, 9, 0, BRASS[0], BRASS[1], BRASS[2]), { flash: vf });
        F.at(0, -R - 26, spin, () => { F.shape(() => { ctx.beginPath(); ctx.arc(0, 0, 23, 0, TAU); ctx.moveTo(15, 0); ctx.arc(0, 0, 15, 0, TAU, true); }, '#D8473C', { flash: vf });
          for (let i = 0; i < 3; i++) F.at(0, 0, i * TAU / 6, () => F.shape(() => rrect(ctx, -18, -3.5, 36, 7, 3), '#C63C33', { flash: vf, seam: false }));
          F.shape(() => circ(ctx, 0, 0, 6.5), BRASS[1], { flash: vf }); });
      }
    });
    // the dome
    F.flash = hf;
    F.at(hx, hy, fa, () => {
      F.shape(() => circ(ctx, 0, 0, R), ballFill(ctx, 0, 0, R, IRON[0], IRON[1], IRON[2]));
      // the furnace mouth: a brass jaw at the front, bars over the fire; the bars part when it opens
      F.shape(() => rrect(ctx, -33, R * 0.34, 66, R * 0.86, 12), () => lin(ctx, 0, R * 0.34, 0, R * 1.2, BRASS[0], BRASS[1], BRASS[2]));
      F.detail(() => {
        ctx.strokeStyle = BRASS[1]; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(43,34,48,0.4)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, R * 0.82 + 3.6, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.82 - 3.6, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#B9C0CE'; for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; if (Math.sin(a) > 0.55) continue; ctx.beginPath(); ctx.arc(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92, 2.5, 0, TAU); ctx.fill(); }
        gloss(ctx, -R * 0.36, -R * 0.5, R * 0.3, R * 0.15, -0.6, 0.26);
        // the fire behind the bars
        const mx = -25, my = R * 0.5, mw = 50, mh = R * 0.56, lit = clamp(0.35 + 0.65 * heat + mouth, 0, 1);
        ctx.save(); rrect(ctx, mx, my, mw, mh, 7); ctx.fillStyle = '#231820'; ctx.fill(); ctx.clip();
        ctx.fillStyle = lin(ctx, 0, my, 0, my + mh, rgbaOf(HOT[3], lit), rgbaOf(HOT[2], lit), rgbaOf(HOT[1], lit)); ctx.fillRect(mx, my, mw, mh);
        if (mouth > 0.1) { ctx.fillStyle = rgbaOf('#FFFBEA', mouth); ctx.beginPath(); ctx.ellipse(0, my + mh * 0.6, 16 * mouth, mh * 0.5, 0, 0, TAU); ctx.fill(); }
        for (let i = 0; i < 4; i++) { const bx = (i - 1.5) * 12, off = Math.sign(bx) * mouth * (14 + Math.abs(bx) * 0.4); ctx.fillStyle = '#3A3F4C'; ctx.fillRect(bx + off - 3, my, 6, mh); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(bx + off - 3, my, 2, mh); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(43,34,48,0.55)'; ctx.lineWidth = 2; rrect(ctx, mx, my, mw, mh, 7); ctx.stroke();
      });
      // the lamp: a brass ring, dark glass, an ember that looks at its mark
      F.shape(() => circ(ctx, 0, -R * 0.12, 19), ballFill(ctx, 0, -R * 0.12, 19, BRASS[0], BRASS[1], BRASS[2]));
      F.detail(() => { const cy = -R * 0.12; ctx.fillStyle = '#1E2230'; ctx.beginPath(); ctx.arc(0, cy, 13.5, 0, TAU); ctx.fill();
        const ir = 6.5 + 2 * heat + (press > 0 ? 1.5 * Math.sin(T * 20) : 0); ctx.fillStyle = heat > 0.5 ? '#FF5A2E' : '#FFB347'; ctx.beginPath(); ctx.arc(lx, cy + ly, ir, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFF0B0'; ctx.beginPath(); ctx.arc(lx, cy + ly, ir * 0.45, 0, TAU); ctx.fill(); gloss(ctx, -5, cy - 6, 5, 2.6, -0.5, 0.5); });
      // the gauge
      F.shape(() => circ(ctx, R * 0.56, -R * 0.52, 12.5), BRASS[1]);
      F.detail(() => { const gx = R * 0.56, gy = -R * 0.52, g = clamp(u.gauge ?? 0.12 + 0.3 * heat, 0, 1); ctx.fillStyle = '#F4F2EA'; ctx.beginPath(); ctx.arc(gx, gy, 9.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#D8473C'; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.arc(gx, gy, 9.5, -0.5, 0.75); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#2B2230'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; const na = -3.6 + g * 4.1 + (g > 0.8 ? Math.sin(T * 40) * 0.12 : 0); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * 8, gy + Math.sin(na) * 8); ctx.stroke(); });
    });
    // the arms, over the dome's sides: upper arm, forearm, elbow gear, shoulder hub (a blow on the head flashes the dome, not the arms)
    F.flash = false;
    for (const A of arms) {
      const a = A.a;
      bone(F, ctx, A.sx, A.sy, A.ex, A.ey, GE.arm.l1, 14, IRON);
      bone(F, ctx, A.ex, A.ey, A.hx, A.hy, GE.arm.l2 - 14, 12.5, IRON_D);
      F.shape(() => gear(ctx, A.ex, A.ey, 18, 8, 0.2, a.ang * 2 + a.i), ballFill(ctx, A.ex, A.ey, 18, BRASS[0], BRASS[1], BRASS[2]));
      F.detail(() => { ctx.fillStyle = '#3A3F4C'; ctx.beginPath(); ctx.arc(A.ex, A.ey, 6, 0, TAU); ctx.fill(); });
      F.shape(() => circ(ctx, A.sx, A.sy, 21), ballFill(ctx, A.sx, A.sy, 21, BRASS[0], BRASS[1], BRASS[2]));
      F.detail(() => { ctx.fillStyle = '#3A3F4C'; ctx.beginPath(); ctx.arc(A.sx, A.sy, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#B9C0CE'; ctx.beginPath(); ctx.arc(A.sx, A.sy, 3, 0, TAU); ctx.fill(); gloss(ctx, A.sx - 7, A.sy - 9, 7, 3.5, -0.5, 0.4, '255,250,220'); });
    }
    for (const A of arms) {
      const a = A.a; F.flash = A.fl;
      F.at(A.hx, A.hy, a.ang, () => { if (!a.hand) stump(F, ctx, T, a.i); else if (a.i) clawHand(F, ctx, clamp(a.open, 0, 1), A.fl); else hammerHead(F, ctx, A.fl); }, A.sc);
    }
  });
  // (its light falls on the floor under it, drawFoundryFloor: no glow over the sprite)
}
// The hands and the valve are drawn with the machine (one figure, one outline); as units they only take the blows.
export function drawEngineHand() {}
export function drawEngineValve() {}

// ---------------------------------------------------------------- the room and what lies on its floor
export function drawFoundryFloor(ctx, w) {
  const T = w.time;
  if (w.engineRoom) { // a great turntable set in the floor, a hazard ring round it, rails to the walls
    const cx = w.W / 2, cy = w.H / 2, R = Math.min(w.W, w.H) * 0.3;
    ctx.save();
    ctx.fillStyle = 'rgba(40,36,48,0.2)'; ctx.fillRect(0, cy - 26, w.W, 52);
    ctx.strokeStyle = 'rgba(30,26,34,0.3)'; ctx.lineWidth = 4; for (const dy of [-26, 26]) { ctx.beginPath(); ctx.moveTo(0, cy + dy); ctx.lineTo(w.W, cy + dy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(52,48,62,0.3)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(242,193,78,0.3)'; ctx.beginPath(); ctx.arc(cx, cy, R - 8, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(43,34,48,0.35)'; ctx.setLineDash([22, 22]); ctx.beginPath(); ctx.arc(cx, cy, R - 8, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(30,26,34,0.3)'; ctx.lineWidth = 3; for (const rr of [R, R - 16, R * 0.45]) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(30,26,34,0.32)'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.39; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.72, 5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // where the beam passed: the floor glows, then cools
  for (const s of w.scorch || []) { const k = (T - s.t0) / 3.5; if (k >= 1) continue; ctx.fillStyle = `rgba(60,34,30,${0.3 * (1 - k)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 24, 0, TAU); ctx.fill(); if (k < 0.4) glow(ctx, s.x, s.y, 34, HOT[2], 0.5 * (1 - k / 0.4)); }
  const b = w.engineBeam;
  if (b) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,138,61,0.28)'; ctx.lineWidth = b.hw * 3.4; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke(); ctx.restore(); }
  // the furnace lights the floor under a hot engine
  for (const u of w.units) if (u.ge && !u.dead) { const h = Math.max(u.heat || 0, u.mouth || 0); if (h < 0.05) continue;
    glow(ctx, u.x + Math.cos(u.facing) * u.vr * 1.3, u.y + Math.sin(u.facing) * u.vr * 1.3, u.vr * 2.2, HOT[2], 0.34 * h * (0.85 + 0.15 * Math.sin(T * 6))); glow(ctx, u.x, u.y, u.vr * 3.2, HOT[2], 0.16 * h); }
}
export function drawEngineAir(ctx, w) {
  const T = w.time;
  for (const u of w.units) {
    const k = u.ge; if (!k || u.dead) continue;
    // the whirl: each arm drags a crescent of blurred steel behind it
    for (const a of k.arm) if (a.whirl > 0.3) { const R = dist(u.x, u.y, a.x, a.y) + 30; slashBand(ctx, u.x, u.y, R, a.ang - 1.5 * a.whirl, a.ang - 0.12, 30 * a.whirl, '#FFCDBD', '#FFF6F2', true); }
    // welders at work: a white arc from each to the stump
    for (const d of w.units) if (d.welds && d.core === u && d.welding && !d.dead && d.weldAt) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,247,194,${0.5 + 0.4 * hash(Math.floor(T * 20), d.id)})`; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(d.x, d.y); const mx = (d.x + d.weldAt.x) / 2 + (hash(Math.floor(T * 20), d.id, 2) - 0.5) * 14, my = (d.y + d.weldAt.y) / 2 + (hash(Math.floor(T * 20), d.id, 3) - 0.5) * 14; ctx.quadraticCurveTo(mx, my, d.weldAt.x, d.weldAt.y); ctx.stroke(); ctx.restore();
      glow(ctx, d.weldAt.x, d.weldAt.y, 22, '#FFF7C2', 0.6);
    }
  }
  const b = w.engineBeam;
  if (b) { // the beam: an inked white-hot core, a halo, a flare where it stops
    const a = Math.atan2(b.y2 - b.y1, b.x2 - b.x1), fl = 0.85 + 0.15 * Math.sin(T * 50), wdt = b.hw * 0.8 * fl * clamp(b.t / 0.15, 0.2, 1);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#2B2230'; ctx.lineWidth = wdt + 7; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.strokeStyle = HOT[2]; ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.strokeStyle = HOT[0]; ctx.lineWidth = wdt * 0.55; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = wdt * 0.2; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.restore();
    glow(ctx, b.x2, b.y2, 70, HOT[1], 0.7); glow(ctx, b.x1, b.y1, 50, HOT[0], 0.6);
    for (let i = 0; i < 5; i++) { const q = hash(i, Math.floor(T * 24)), an = a + Math.PI + (q - 0.5) * 2.4; upright(ctx, b.x2 + Math.cos(an) * 20 * q, b.y2 + Math.sin(an) * 20 * q, () => flame(ctx, 0, 0, 7 + 6 * q)); }
  }
}

// ---------------------------------------------------------------- its blows
const steamPuffs = (ctx, x, y, r, k, seed, n = 9) => dustPuffs(ctx, x, y, r, k, seed, n, '#EEF0F5');
BFX.slam = { // the hammer lands: a dent and a wave of dust under the units, a white flash and stones over them
  ground(ctx, f, k) { quake(ctx, f.x, f.y, f.r, k, f.seed); },
  air(ctx, f, k) { if (k < 0.16) glow(ctx, f.x, f.y, f.r * 1.1, '#FFF8E6', 0.8 * (1 - k / 0.16)); dustPuffs(ctx, f.x, f.y, f.r * 0.55, k, f.seed, 6); },
};
BFX.swat = { air(ctx, f, k) { const u = f.u, e = easeOut(k01(k / 0.5)), h = f.a0 + (f.a1 - f.a0) * e, t = f.a0 + (f.a1 - f.a0) * sm(k01((k - 0.25) / 0.75)); slashBand(ctx, u.x, u.y, f.r * 0.98, t, h, 30 * (1 - 0.5 * k), '#FFCDBD', '#FFF6F2', true); } };
BFX.steamBurst = {
  ground(ctx, f, k) { const e = easeOut(k); ctx.globalAlpha = (1 - k) * 0.55; ctx.strokeStyle = '#F4F5FA'; ctx.lineWidth = 26 * (1 - k) + 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.3 + 0.7 * e), 0, TAU); ctx.stroke(); },
  air(ctx, f, k) { steamPuffs(ctx, f.x, f.y, f.r * 0.9, k, 7, 12); steamPuffs(ctx, f.x, f.y, f.r * 0.5, k, 3, 7); },
};
BFX.forged = { air(ctx, f, k) { glow(ctx, f.x, f.y, 60, '#FFF7C2', 0.8 * (1 - k)); ctx.globalAlpha = 1 - k; inked(ctx, () => star(ctx, f.x, f.y, 26 * easeOut(k) + 6, 4, 0.3, k * 2), '#FFF7C2'); } };
BFX.gripBreak = { air(ctx, f, k) { glow(ctx, f.x, f.y, 50, '#FFFFFF', 0.7 * (1 - k)); ctx.globalAlpha = 1 - k; inked(ctx, () => star(ctx, f.x, f.y, 30 * easeOut(k) + 8, 6, 0.4, 0.3), '#FFFFFF'); } };
BFX.pistonShot = { air(ctx, f, k) { steamPuffs(ctx, f.x, f.y, 40, k, 2, 5); } };
BFX.handBreak = { air(ctx, f, k) { // the hand flies apart: its pieces tumble out and are gone
  const e = easeOut(k), [ux, uy] = up();
  ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  for (let i = 0; i < 6; i++) { const b = f.a + (i - 2.5) * 0.9 + hash(f.seed, i), d = (40 + 70 * hash(i, f.seed)) * e, hop = Math.sin(k01(k * 1.25) * Math.PI) * 34, x = f.x + Math.cos(b) * d + ux * hop, y = f.y + Math.sin(b) * d + uy * hop;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b + k * 7 * (i % 2 ? 1 : -1));
    if (f.claw && i < 3) inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(6, -8, 20, 0); ctx.quadraticCurveTo(6, 4, -14, 6); ctx.closePath(); }, STEEL[1]);
    else inked(ctx, () => rrect(ctx, -11, -9, 22, 18, 4), i % 2 ? IRON[1] : BRASS[1]);
    ctx.restore(); }
  if (k < 0.2) glow(ctx, f.x, f.y, 70, '#FFF7C2', 0.8 * (1 - k / 0.2));
} };
BFX.dizzy = { air(ctx, f, k, w) { const u = f.u; if (!u || u.dead) return; const [ux, uy] = up(); ctx.globalAlpha = Math.min(1, (1 - k) * 4);
  for (let i = 0; i < 3; i++) { const a = w.time * 4 + i * TAU / 3, x = u.x + Math.cos(a) * u.vr * 0.75 + ux * u.vr * 0.9, y = u.y + Math.sin(a) * u.vr * 0.3 + uy * u.vr * 0.9; inked(ctx, () => star(ctx, x, y, 9, 4, 0.35, a), '#FFF7C2'); } } };
BFX.pressure = { ground(ctx, f, k, w) { // the gauge climbing, on the floor: rings of heat creeping out from under it, faster and redder
  const u = f.u; if (!u || u.dead) return;
  const col = k < 0.6 ? '#FFC85A' : '#FF6A3D', R = f.r;
  ctx.save(); ctx.globalAlpha = 0.06 + 0.05 * k; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.12 + 0.16 * k; ctx.beginPath(); ctx.arc(u.x, u.y, R * k, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.5; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(u.x, u.y, R * k, 0, TAU); ctx.stroke();
  ctx.globalAlpha = 0.85; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([12, 9]); ctx.lineDashOffset = -w.time * 30; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
} };
BFX.ventBurst = { air(ctx, f, k) { const u = f.u; if (!u) return; const a = u.facing + Math.PI; for (let i = 0; i < 3; i++) steamPuffs(ctx, u.x + Math.cos(a + (i - 1) * 0.4) * (u.vr + 90 * easeOut(k)), u.y + Math.sin(a + (i - 1) * 0.4) * (u.vr + 90 * easeOut(k)), 46, k, i, 5); glow(ctx, u.x, u.y, 90, '#FFFFFF', 0.5 * (1 - k)); } };
BFX.boilerBlast = {
  ground(ctx, f, k) { const e = easeOut(k); ctx.globalAlpha = (1 - k) * 0.6; ctx.strokeStyle = HOT[1]; ctx.lineWidth = 50 * (1 - k) + 6; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * e, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#F4F5FA'; ctx.lineWidth = 20 * (1 - k) + 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * e * 0.92, 0, TAU); ctx.stroke(); },
  air(ctx, f, k) { if (k < 0.2) glow(ctx, f.x, f.y, f.r * 0.8, '#FFF8E6', 0.9 * (1 - k / 0.2)); steamPuffs(ctx, f.x, f.y, f.r * 0.8, k, 11, 16); steamPuffs(ctx, f.x, f.y, f.r * 0.45, k, 5, 9);
    const n = 10; for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.3, d = f.r * 0.7 * easeOut(k); ctx.save(); ctx.globalAlpha = 1 - k; upright(ctx, f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, () => flame(ctx, 0, 0, 13 * (1 - k) + 3)); ctx.restore(); } },
};
BFX.engineWreck = { air(ctx, f, k) { // it comes apart: the dome drops, the cog rolls off, plates and bolts fly
  const e = easeOut(k), [ux, uy] = up();
  ctx.globalAlpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
  if (k < 0.25) glow(ctx, f.x, f.y, 150, '#FFF0B0', 0.9 * (1 - k / 0.25));
  const cx = f.x + Math.cos(f.a + 2.2) * 150 * e, cy = f.y + Math.sin(f.a + 2.2) * 150 * e;
  inked(ctx, () => gear(ctx, cx, cy, 60, 12, 0.15, k * 9), '#3A3F4C');
  inked(ctx, () => circ(ctx, cx, cy, 20), '#22252C');
  const dx = f.x + Math.cos(f.a - 1.2) * 60 * e, dy = f.y + Math.sin(f.a - 1.2) * 60 * e + uy * 0;
  ctx.save(); ctx.translate(dx, dy); ctx.rotate(k * 1.4); inked(ctx, () => circ(ctx, 0, 0, 50), IRON[1]); ctx.fillStyle = IRON[0]; ctx.beginPath(); ctx.ellipse(-14, -16, 22, 12, -0.6, 0, TAU); ctx.fill(); inked(ctx, () => circ(ctx, 0, -6, 15), BRASS[1]); ctx.fillStyle = '#1E2230'; ctx.beginPath(); ctx.arc(0, -6, 10, 0, TAU); ctx.fill(); ctx.restore();
  for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + hash(f.seed, i), d = (80 + 130 * hash(i, f.seed)) * e, hop = Math.sin(k01(k * 1.2) * Math.PI) * 50 * hash(i, 3), x = f.x + Math.cos(b) * d + ux * hop, y = f.y + Math.sin(b) * d + uy * hop;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b + k * 8); inked(ctx, () => rrect(ctx, -10, -7, 20, 14, 3), i % 3 ? IRON[1] : BRASS[1]); ctx.restore(); }
  dustPuffs(ctx, f.x, f.y, 150, k, f.seed, 12, '#EEF0F5');
} };
