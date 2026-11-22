// Round 13 (lane E): what the newer enemies need drawn beyond their art, kept out of render.js (which calls in here
// from a few marked lines). Everything is in room units, in the room's frame.
//   drawFoeGround   under everything that stands: a yeti's snowball track, a burrower's mound
//   snowRoll        over a yeti's snowball: it turns as it rolls (two bands round it, moving with the roll)
//   drawFoe         a chain as one body; the sun blade with its point in a wall; a spirit's tail
import { INK, TAU, clamp } from './util.js';
import { OUTLINE, view } from './render.js';
import { getRig, paintRig, composeRig, drawComposed, poseFor } from './parts.js';

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
  for (const u of w.units) {
    if (u.dead) continue;
    // a burrower under the floor (scarabs, the drill bot, the sand serpent): the mound it raises, moving with it; a
    // serpent's links under the sand behind it, a lower ridge
    if (u.bur && u.bur.state === 'under') mound(ctx, u.x, u.y, u.r * 1.05, u.facing, u.bur.dirt, w.time + u.id);
    else if (u.linkTo && u.hidden && u.linkTo.bur) mound(ctx, u.x, u.y, u.r * 0.8, u.facing, u.linkTo.bur.dirt, w.time + u.id, 0.7);
    // the sun blade's point driven into the floor: the stone cracked round it
    if (u.bl && u.bl.st === 'stuck' && u.bl.floor) {
      const L = u.vr * 1.72 * (u.squash || 1), x = u.x + Math.cos(u.facing) * L, y = u.y + Math.sin(u.facing) * L, R = u.vr * 0.9, k = clamp(u.bl.t / 0.2, 0, 1);
      ctx.save(); ctx.strokeStyle = 'rgba(70,56,44,0.55)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + u.id, r1 = R * (0.55 + 0.45 * ((i * 7 + u.id) % 3) / 2) * k; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + 0.2) * r1 * 0.5, y + Math.sin(a + 0.2) * r1 * 0.5); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); }
      ctx.stroke(); ctx.fillStyle = 'rgba(70,56,44,0.35)'; ctx.beginPath(); ctx.arc(x, y, u.vr * 0.22, 0, TAU); ctx.fill(); ctx.restore();
    }
  }
}

// A mound of earth pushed up from below: a long soft hump along the way it's going, lit from the top left, a dark
// crack along its crest, clods rolling off it.
function mound(ctx, x, y, r, a, col = '#B59A6A', t = 0, k = 1) {
  const L = r * (1.25 + 0.06 * Math.sin(t * 9)), Wd = r * 0.82 * k;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = 'rgba(50,34,18,0.22)'; ctx.beginPath(); ctx.ellipse(3, 4, L * 1.05, Wd * 1.1, 0, 0, TAU); ctx.fill(); // its shade
  ctx.fillStyle = col; ctx.strokeStyle = 'rgba(60,40,22,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, L, Wd, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,225,0.35)'; ctx.beginPath(); ctx.ellipse(-L * 0.15, -Wd * 0.3, L * 0.7, Wd * 0.45, 0, 0, TAU); ctx.fill(); // lit side
  ctx.strokeStyle = 'rgba(60,40,22,0.5)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-L * 0.55, 0); ctx.lineTo(-L * 0.1, Wd * 0.12); ctx.lineTo(L * 0.5, -Wd * 0.05); ctx.stroke(); // the crack along its crest
  ctx.fillStyle = col; for (let i = 0; i < 3; i++) { const q = (t * 1.7 + i / 3) % 1, s2 = i % 2 ? 1 : -1; ctx.beginPath(); ctx.arc(L * (0.6 - 1.4 * q), s2 * Wd * (0.9 + 0.3 * q), 2.6 * (1 - q * 0.5), 0, TAU); ctx.fill(); }
  ctx.restore();
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
// ---------------------------------------------------------------- a chain drawn as one body
// A chain (the sand serpent, the chain crawler: families.js) is a head and its links, each a unit of its own. Drawn one
// by one, each link's own outline showed as a dark line across the body where it overlaps the next. So the whole chain
// is drawn at its head's turn, the way one figure's parts are (parts.js): every piece's outline first, tail to head,
// then every piece's colours over them in the same order: the outline hugs the body as one shape, and the links' own
// pattern runs on from one to the next. A link under the sand isn't drawn (its mound is: drawFoeGround).
function drawChain(ctx, h, w, dt, R) {
  const pieces = [...h.segs.filter((s) => !s.dead && !s.hidden).reverse(), ...(h.hidden ? [] : [h])];
  if (!pieces.length) return;
  const sets = pieces.map((p) => { const sizeU = p.vr * 220 / (p.def.headR || 60); return { p, sizeU, set: getRig(p.def.art, sizeU * view.scale * view.dpr * 1.04) }; });
  if (sets.some((s) => !s.set)) return; // (still rendering: a fraction of a second)
  const pose = (p) => { if (p !== h) return {}; const q = poseFor(p, w, dt); q.front = { dy: 3 + 3 * Math.sin(w.time * 26 + p.id) * (Math.sin(w.time * 2.3 + p.id) > 0.3 ? 1 : 0) }; return q; }; // (the serpent's tongue flickers now and then)
  const frame = (s) => { ctx.save(); R.unitFrame(ctx, s.p, w); const k = s.sizeU / 220; ctx.scale(k, k); ctx.translate(-100, -100); };
  const poses = sets.map((s) => pose(s.p));
  sets.forEach((s, i) => { frame(s); paintRig(ctx, s.set, poses[i], 'ink'); ctx.restore(); });
  const washes = R.washesOf(h, w);
  sets.forEach((s, i) => {
    frame(s);
    if (s.p.flashT > 0.06 || h.flashT > 0.06) { const k = composeRig(s.set, poses[i], 'sil', '#FFFFFF'); drawComposed(ctx, k); } // a link that was struck flashes
    else {
      paintRig(ctx, s.set, poses[i], 'sil'); // (the parts' colours, no outline)
      for (const [col, a] of washes) { if (a <= 0.01) continue; const k = composeRig(s.set, poses[i], 'sil', col); const ga = ctx.globalAlpha; ctx.globalAlpha = ga * a; drawComposed(ctx, k); ctx.globalAlpha = ga; }
    }
    ctx.restore();
  });
}

// ---------------------------------------------------------------- units (render.js calls this before drawUnit)
// True when it drew the unit itself (render.js then skips drawUnit). R: render.js's drawUnit, unitFrame, washesOf.
export function drawFoe(ctx, u, w, dt, R) {
  if (u.linkTo && u.def.segment) return true; // a chain's link: drawn with its head
  if (u.segs && u.def.art && !u.downed) { drawChain(ctx, u, w, dt, R); return true; }
  if (u.stuckIn) { // the sun blade with its point in a wall: the part inside the wall isn't drawn
    const r = u.stuckIn, B = 1e5;
    ctx.save(); ctx.beginPath(); ctx.rect(-B, -B, 2 * B, 2 * B); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip('evenodd');
    R.drawUnit(ctx, u, w); ctx.restore();
    return true;
  }
  return false;
}
export { INK, OUTLINE };
