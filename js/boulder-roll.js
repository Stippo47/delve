// Round 19 (lane boulder19). The designer: "visual overhaul of bolders. I want you to try 2 methods, it seems u are
// already trying 1 of them with the yeti where you have a circular texture just needs the placeholder removed. Second is
// getting a flat repeating texture, put a mask on the boulder to cut out from the texture, as it moves it pans the
// texture, and maybe it gets a fish eye like distortion to make it seem round. Should have the same look as the current
// boulder. Also give the boulder particle effect. A dirt trail."
//
// A troll's boulder (art/props/troll-boulder.svg) and a yeti's snowball (art/props/yeti-snowball.svg), drawn rolling:
//   ?boulder=a  the round picture turns on the ball the way a ball turns: about the line across its way, so what is on
//               top goes over the front and what was underneath comes up the back, in any direction and round a turn
//               (a true 3D turn of the ball; its two halves are two round pictures)
//   ?boulder=b  a flat repeating texture slides under a round mask the way the ball goes, by the distance it rolled,
//               through a fish-eye: quick in the middle, squeezed at the edge, so it reads round
//   ?boulder=old the round picture standing still (the yeti's with its two turning bands over it): the look before
// Both new ones have the same look as the picture: their surface is the picture itself with its light taken out, and
// the picture's own light (the top-left glow, the shade to the bottom right, the highlight) is put back on top, fixed
// to the room's light, so standing still they are the picture to the pixel. The outline is the prop's own (sprites.js).
// Everything here is drawing only: the ball's turn and the trail come from how far it moved between frames (draw-only
// fields on the ball, p._r19); nothing in the fight reads them, and no dice are used.
// Dirt trail (?dirt=0 to turn off): puffs of dust and small clods kicked out behind a rolling boulder, faint scuffs
// pressed into the floor; snow spray and clumps behind a snowball. More with speed, nothing standing still.
import { INK, TAU, clamp, OUTLINES, OUTLINE, readFlag, inkFor } from './util.js';
import { view } from './render.js';
import { hash } from './fx.js';

const LOOK_KEY = 'delve.boulder', DIRT_KEY = 'delve.dirt';
export const BOULDER_LOOKS = [
  { id: 'b', name: 'Rolling texture', blurb: 'A flat stone texture slides under the ball as it rolls.' },
  { id: 'a', name: 'Turning picture', blurb: 'The ball\'s picture turns over the way it rolls.' },
  { id: 'old', name: 'Before', blurb: 'The picture standing still, as it was.' }];
const readLook = () => {
  try { const v = new URLSearchParams(location.search).get('boulder'); if (BOULDER_LOOKS.some((l) => l.id === v)) return v; } catch {}
  try { const v = localStorage.getItem(LOOK_KEY); if (BOULDER_LOOKS.some((l) => l.id === v)) return v; } catch {}
  return 'b'; // the default (see docs/boulder19.md)
};
export let BOULDER_LOOK = readLook();
export function setBoulderLook(v) { if (BOULDER_LOOKS.some((l) => l.id === v)) { BOULDER_LOOK = v; try { localStorage.setItem(LOOK_KEY, v); } catch {} } return BOULDER_LOOK; }
export let DIRT = readFlag('dirt', DIRT_KEY);
export function setDirt(on) { DIRT = !!on; try { localStorage.setItem(DIRT_KEY, DIRT ? '1' : '0'); } catch {} return DIRT; }

// ---------------------------------------------------------------- the pictures, taken apart once
// From the prop's SVG: G = its lit base (the gradient fill), the light laid over it (the highlight and the shade, found
// by drawing them over black and over white), and the whole picture. Per pixel, the picture = surface x M + A, where
// M = G / B0 x (1 - the overlays' cover) and A = the overlays' colour; so the surface (its light taken out) =
// (picture - A) / M, flat B0 where the stone is plain, the moss and chips as they are. That surface goes on the ball.
const HI = 1024; // the pictures are read at this size
const SVGU = 220; // the prop's box in its own units (viewBox -10 -10 220 220; the ball's middle is at 100, 100)
export const art = {};
const KIND = {
  'troll-boulder': { snow: false },
  'yeti-snowball': { snow: true },
};
function rasterSvg(text) {
  return new Promise((res) => {
    const sized = text.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1').replace('<svg', `<svg width="${HI}" height="${HI}"`); // (drawn at its size, as sprites.js does)
    const img = new Image();
    const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = HI; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, HI, HI); URL.revokeObjectURL(url); res(c); };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}
// the SVG's #sprite children sorted: the base (the ball's gradient fill), the light over it (the highlight ellipse and
// the shade over the whole ball), and the rest (chips, moss, streaks: the surface's own marks)
function variants(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const out = {};
  const make = (fn) => { const d = doc.cloneNode(true); fn(d); return new XMLSerializer().serializeToString(d); };
  const sort = (d) => {
    const sprite = d.getElementById('sprite'); const all = [...sprite.querySelectorAll('use, path, ellipse, circle')];
    const base = all.find((e) => e.tagName === 'use' && /#p2$/.test(e.getAttribute('href') || '') && /g1/.test(e.getAttribute('fill') || ''));
    const light = all.filter((e) => e !== base && (e.tagName === 'ellipse' || (e.tagName === 'use' && /#p2$/.test(e.getAttribute('href') || ''))));
    const moss = all.filter((e) => e.tagName === 'use' && /#p6$/.test(e.getAttribute('href') || ''));
    const marks = all.filter((e) => e !== base && !light.includes(e));
    return { base, light, marks, moss };
  };
  out.G = make((d) => { const s = sort(d); for (const e of [...s.light, ...s.marks]) e.remove(); });
  out.OB = make((d) => { const s = sort(d); s.base.setAttribute('fill', '#000000'); for (const e of s.marks) e.remove(); });
  out.OW = make((d) => { const s = sort(d); s.base.setAttribute('fill', '#FFFFFF'); for (const e of s.marks) e.remove(); });
  out.F = text;
  out.moss = make((d) => { const s = sort(d); s.base.remove(); for (const e of [...s.light, ...s.marks]) if (!s.moss.includes(e)) e.remove(); for (const e of s.moss) { e.setAttribute('fill', '#000000'); e.setAttribute('opacity', '1'); } });
  out.hasMoss = sort(doc).moss.length > 0;
  out.outline = (doc.getElementById('p2') || {}).getAttribute ? doc.getElementById('p2').getAttribute('d') : null; // the ball's own outline shape
  // the chips' and streaks' own shapes, to scatter more of them round the ball
  out.marks = sort(doc).marks.filter((e) => e.tagName === 'path').map((e) => ({ d: e.getAttribute('d'), fill: e.getAttribute('fill'), stroke: e.getAttribute('stroke'), sw: +(e.getAttribute('stroke-width') || 0), op: +(e.getAttribute('opacity') || 1) }));
  return out;
}
const loading = {};
export function boulderArtReady(name) { return !!(art[name] && art[name].ready); }
export function loadBoulderArt(name) {
  if (loading[name]) return loading[name];
  return (loading[name] = (async () => {
    try {
      const text = await (await fetch(`art/props/${name}.svg`)).text();
      const v = variants(text);
      const [G, OB, OW, F, MO] = await Promise.all([rasterSvg(v.G), rasterSvg(v.OB), rasterSvg(v.OW), rasterSvg(v.F), v.hasMoss ? rasterSvg(v.moss) : null]);
      if (!G || !OB || !OW || !F) return;
      const px = (c) => c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, HI, HI).data;
      const g = px(G), ob = px(OB), ow = px(OW), f = px(F);
      const mid = (HI / 2) * HI + HI / 2, B0 = [g[mid * 4], g[mid * 4 + 1], g[mid * 4 + 2]];
      // the ball's size: the area it covers (as a circle), and how far its bumps reach past that
      let area = 0, far = 0;
      for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) { const a = g[(y * HI + x) * 4 + 3]; if (a > 127) area++; if (a > 0) far = Math.max(far, Math.hypot(x + 0.5 - HI / 2, y + 0.5 - HI / 2)); }
      const Rhi = Math.sqrt(area / Math.PI); // the ball's radius in pixels of the HI picture
      // the surface: (picture - A) / M, in a canvas the size of the HI picture
      const sc = document.createElement('canvas'); sc.width = sc.height = HI; const sg = sc.getContext('2d', { willReadFrequently: true });
      const sd = sg.createImageData(HI, HI), s = sd.data;
      for (let i = 0; i < HI * HI; i++) {
        const o = i * 4; if (g[o + 3] < 250) { s[o] = B0[0]; s[o + 1] = B0[1]; s[o + 2] = B0[2]; s[o + 3] = 255; continue; } // (the soft edge and the dents between its bumps: plain stone)
        for (let c = 0; c < 3; c++) { const cover = (ow[o + c] - ob[o + c]) / 255, M = (g[o + c] / Math.max(1, B0[c])) * cover; s[o + c] = M > 0.02 ? clamp(Math.round((f[o + c] - ob[o + c]) / M), 0, 255) : B0[c]; }
        s[o + 3] = 255;
      }
      sg.putImageData(sd, 0, 0);
      let mossStamp = null;
      if (MO) { // the moss cap, cut out of the surface with its own shadow, to put a smaller patch round the back
        mossStamp = document.createElement('canvas'); mossStamp.width = mossStamp.height = HI; const mg = mossStamp.getContext('2d');
        mg.drawImage(MO, 0, 0); mg.globalCompositeOperation = 'source-in'; mg.drawImage(sc, 0, 0);
      }
      art[name] = { ready: true, path: v.outline ? new Path2D(v.outline) : null, G, OB, OW, surf: sc, B0, Rhi, far: far / Rhi, Rsvg: Rhi * SVGU / HI, mossStamp, marks: v.marks, snow: KIND[name].snow, tiles: new Map(), buckets: new Map() };
    } catch (e) { console.warn('boulder art', name, e); }
  })());
}
if (typeof document !== 'undefined') for (const n of Object.keys(KIND)) setTimeout(() => loadBoulderArt(n), 0); // (in the game only: the tools run the fights in node)

// ---------------------------------------------------------------- the surface, laid flat: one repeating tile
// The tile is 2 pi across each way, in the ball's own radius (one turn of the ball rolls one tile). Four round patches on
// it like a chequer: the picture's own face round the middle (pi, pi: the top of the ball as it stands), another face
// round the corner (0, 0: underneath, the other half of the ball for ?boulder=a), and two more for ?boulder=b only, at
// (pi, 0) and (0, pi), with more of the same chips and moss (or streaks of packed snow). Each patch keeps clear of the
// pi / 2 ring round the two poles, so the two halves of the ball meet without a seam.
const SPOTS = { // per kind: marks round the three other patches, in the ball's radius (x, y, turn, size)
  troll: [
    // underneath (0, 0)
    { at: [0, 0], moss: [0.15, -0.25, 2.3, 0.62], chips: [[-0.55, 0.35, 0.6, 1.0], [0.55, 0.42, 2.1, 0.85], [-0.1, -0.85, 4.0, 0.7]] },
    // (pi, 0) and (0, pi): ?boulder=b's other patches
    { at: [Math.PI, 0], moss: [-0.2, 0.35, 4.2, 0.5], chips: [[0.5, -0.4, 1.2, 0.9], [-0.6, -0.45, 3.0, 0.8], [0.45, 0.65, 5.1, 0.7]] },
    { at: [0, Math.PI], moss: null, chips: [[-0.35, 0.2, 0.3, 1.05], [0.5, -0.25, 2.6, 0.95], [0.1, 0.75, 4.4, 0.75], [-0.55, -0.7, 1.7, 0.7]] },
  ],
  snow: [
    { at: [0, 0], streaks: [[0, -0.55, 0.15, 1.0], [0.05, 0.25, -0.1, 1.0], [-0.1, 0.8, 0.2, 0.7]] },
    { at: [Math.PI, 0], streaks: [[0, -0.6, 0.7, 0.9], [0.1, 0.2, 0.75, 1.05], [0, 0.85, 0.6, 0.7]] },
    { at: [0, Math.PI], streaks: [[0.05, -0.45, -0.6, 1.0], [-0.1, 0.4, -0.5, 0.95]] },
  ],
};
// cracks on a chipped snowball (the old drawing's, snowRoll: in the ball's radius), on every patch
const CRACK1 = [[-0.5, -0.2], [-0.15, -0.05], [-0.05, 0.3], [0.25, 0.4]], CRACK2 = [[0.55, -0.35], [0.2, -0.15], [0.3, 0.1]];
export function tileFor(A, T, hurt) {
  const key = T + ':' + hurt; let t = A.tiles.get(key); if (t) return t;
  const c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d', { willReadFrequently: true });
  const k = T / TAU; // pixels per radius
  g.fillStyle = `rgb(${A.B0[0]},${A.B0[1]},${A.B0[2]})`; g.fillRect(0, 0, T, T);
  const svgToRad = 1 / A.Rsvg; // the picture's units to the ball's radius (at its middle)
  const wrap = (x, y, fn) => { for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) { g.save(); g.translate(x * k + ox, y * k + oy); fn(); g.restore(); } };
  const S = SPOTS[A.snow ? 'snow' : 'troll'];
  // a chip: the picture's own first chip shape (its middle near 70, 125), turned and sized
  const chipPaths = A.marks.filter((m) => m.fill && m.fill !== 'none').map((m) => ({ p: new Path2D(m.d), fill: m.fill, op: m.op }));
  const streakPaths = A.marks.filter((m) => m.stroke).map((m) => ({ p: new Path2D(m.d), stroke: m.stroke, sw: m.sw, op: m.op }));
  for (const spot of S) {
    for (const ch of spot.chips || []) {
      const cp = chipPaths[(Math.round(ch[2] * 7)) % Math.max(1, chipPaths.length)]; if (!cp) continue;
      const cx = cp === chipPaths[0] ? 70 : 133, cy = cp === chipPaths[0] ? 125 : 145;
      wrap(spot.at[0] + ch[0], spot.at[1] + ch[1], () => { g.rotate(ch[2]); g.scale(svgToRad * k * ch[3], svgToRad * k * ch[3]); g.translate(-cx, -cy); g.globalAlpha = cp.op; g.fillStyle = cp.fill; g.fill(cp.p); });
    }
    if (spot.moss && A.mossStamp) { // the moss cap from the picture (its middle near 130, 58), smaller and turned
      const [mx, my, rot, sz] = spot.moss, hiToRad = 1 / A.Rhi, cx = (130 + 10) * HI / SVGU, cy = (58 + 10) * HI / SVGU;
      wrap(spot.at[0] + mx, spot.at[1] + my, () => { g.rotate(rot); g.scale(hiToRad * k * sz, hiToRad * k * sz); g.drawImage(A.mossStamp, -cx, -cy); });
    }
    for (const st of spot.streaks || []) { // a streak of packed snow: the picture's middle streak, laid across
      const sp = streakPaths[0]; if (!sp) continue;
      wrap(spot.at[0] + st[0], spot.at[1] + st[1], () => { g.rotate(st[2]); g.scale(svgToRad * k * st[3], svgToRad * k * st[3]); g.translate(-100, -130); g.globalAlpha = sp.op; g.strokeStyle = sp.stroke; g.lineWidth = sp.sw; g.lineCap = 'round'; g.beginPath(); g.moveTo(44, 130); g.quadraticCurveTo(100, 152, 156, 124); g.stroke(); });
    }
  }
  g.globalAlpha = 1;
  // the picture's own face round the middle: the surface warped from the picture (seen straight down: a point at
  // distance d from its middle is pi/2 x asin(d) round the ball) into the flat tile (distance = the arc round the ball)
  const id = g.getImageData(0, 0, T, T), d = id.data, sd = A.surf.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, HI, HI).data;
  const R = Math.ceil(k * Math.PI / 2), c0 = T / 2;
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    const th = Math.hypot(x, y) / k; if (th > Math.PI / 2) continue;
    const s = th < 1e-6 ? 1 : Math.sin(th) / th, ox = HI / 2 + x / k * s * A.Rhi, oy = HI / 2 + y / k * s * A.Rhi;
    const ix = Math.min(HI - 1, Math.max(0, Math.floor(ox))), iy = Math.min(HI - 1, Math.max(0, Math.floor(oy))), o = (iy * HI + ix) * 4;
    const fade = clamp((1.38 - th) / 0.23, 0, 1), to = ((c0 + y) * T + (c0 + x)) * 4;
    for (let ch = 0; ch < 3; ch++) d[to + ch] = Math.round(sd[o + ch] * fade + A.B0[ch] * (1 - fade));
  }
  g.putImageData(id, 0, 0);
  if (hurt > 0) { // cracks (a chipped snowball), on all four patches
    g.strokeStyle = 'rgba(90,120,150,0.75)'; g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = 0.065 * k;
    for (const at of [[Math.PI, Math.PI], ...S.map((s) => s.at)]) for (const [i, cr] of [CRACK1, CRACK2].entries()) {
      if (i === 1 && hurt < 2) continue;
      wrap(at[0], at[1], () => { g.rotate(at[0] * 0.7 + at[1] * 1.3); g.beginPath(); cr.forEach(([x, y], j) => (j ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.stroke(); });
    }
  }
  t = { T, tex: new Uint32Array(g.getImageData(0, 0, T, T).data.buffer) };
  A.tiles.set(key, t);
  if (A.tiles.size > 6) A.tiles.delete(A.tiles.keys().next().value);
  return t;
}

// ---------------------------------------------------------------- one size of ball: what each pixel needs
// Rp: the ball's radius in screen pixels. Per pixel inside the picture's outline: its cover (the edge's soft pixels),
// the ball's face there (nx, ny, nz: nz < 0 faces us), the fish-eye's place on the flat tile (lu, lv, in the ball's
// radius: the arc from the middle), and the light (M x 256 per colour, A per colour).
const KL = new Float32Array(2049); // theta / sin(theta) by |cos(theta)|, for ?boulder=a
for (let i = 0; i <= 2048; i++) { const z = i / 2048; KL[i] = z >= 1 ? 1 : Math.acos(z) / Math.sqrt(1 - z * z); }
function bucketFor(A, Rp) {
  let b = A.buckets.get(Rp); if (b) return b;
  const half = Math.ceil(Rp * A.far) + 1, S = half * 2;
  const grab = (src) => { // the picture's middle, scaled so the ball is Rp across in S x S
    const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high'; const f = A.Rhi / Rp; g.drawImage(src, HI / 2 - half * f, HI / 2 - half * f, S * f, S * f, 0, 0, S, S);
    return g.getImageData(0, 0, S, S).data;
  };
  const G = grab(A.G), OB = grab(A.OB), OW = grab(A.OW);
  const idx = [], al = [], nx = [], ny = [], nz = [], lu = [], lv = [], M = [], Ad = [];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const o = (y * S + x) * 4; if (G[o + 3] === 0) continue;
    let X = (x + 0.5 - half) / Rp, Y = (y + 0.5 - half) / Rp; const r = Math.hypot(X, Y);
    if (r > 0.995) { X *= 0.995 / r; Y *= 0.995 / r; } // (a bump past the round: the ball's rim)
    const rr = Math.min(0.995, r), Z = -Math.sqrt(1 - rr * rr), th = Math.asin(rr), k = rr < 1e-6 ? 1 : th / rr;
    idx.push(y * S + x); al.push(G[o + 3]); nx.push(X); ny.push(Y); nz.push(Z); lu.push(X * k); lv.push(Y * k);
    for (let c = 0; c < 3; c++) { const cover = (OW[o + c] - OB[o + c]) / 255; M.push(Math.round(G[o + c] / Math.max(1, A.B0[c]) * cover * 256)); Ad.push(OB[o + c]); }
  }
  const c = document.createElement('canvas'); c.width = c.height = S;
  b = { Rp, S, half, n: idx.length, idx: Int32Array.from(idx), al: Uint8Array.from(al), nx: Float32Array.from(nx), ny: Float32Array.from(ny), nz: Float32Array.from(nz), lu: Float32Array.from(lu), lv: Float32Array.from(lv), M: Uint16Array.from(M), A: Uint8Array.from(Ad) };
  A.buckets.set(Rp, b);
  if (A.buckets.size > 24) A.buckets.delete(A.buckets.keys().next().value);
  return b;
}

// ---------------------------------------------------------------- how the ball has turned (draw-only fields, p._r19)
// From how far it moved since the last frame drawn, in the screen's own frame (the picture is drawn upright: in portrait
// the room is turned a quarter, so the room's +x is the screen's up). Rolling a distance d along a way, a ball turns
// d / radius about the line across that way, flat on the floor: R (the ball's turn, its own frame to the screen's:
// x right, y down, z into the floor) is turned by that each frame. ?boulder=b only slides the tile by d / radius.
export function ballR(p, name) { const A = art[name]; return p.r * (A ? A.Rsvg : 74) * (86.4 / SVGU) / 30; } // (the picture's ball in room units: a prop's 220 box is 86.4 at r 30)
function stateOf(p) {
  let s = p._r19;
  if (!s) s = p._r19 = { x: p.x, y: p.y, t: null, R: new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]), pu: 0, pv: 0, n: 0, sp: 0, ux: 1, uy: 0, acc: 0, k: 0, cv: null, img: null, sig: '' };
  return s;
}
// Note the ball's move since the last frame (once per frame: w.time), turn it and lay its trail.
export function noteRoll(p, w, name) {
  const s = stateOf(p), now = w.time;
  if (s.t === now) return s;
  const dt = s.t == null ? 0 : now - s.t; s.t = now;
  const dx = p.x - s.x, dy = p.y - s.y, L = Math.hypot(dx, dy); s.x = p.x; s.y = p.y;
  if (dt <= 0 || L < 1e-4 || L > Math.max(4 * p.r, 260)) { if (dt > 0) s.sp *= Math.exp(-dt * 10); return s; } // (standing, or put down somewhere new)
  s.sp = s.sp * 0.6 + (L / dt) * 0.4; s.ux = dx / L; s.uy = dy / L;
  const Rr = ballR(p, name), lx = view.rot ? dy : dx, ly = view.rot ? -dx : dy;
  // ?boulder=b: the tile slides the way it goes (the ball's top moves forward over its middle)
  s.pu = (s.pu + lx / Rr) % TAU; s.pv = (s.pv + ly / Rr) % TAU;
  // ?boulder=a: turned by L / radius about (ly, -lx, 0) / L (the line across its way, on the floor)
  const a = L / Rr, ax = ly / L, ay = -lx / L, c = Math.cos(a), sn = Math.sin(a), t = 1 - c;
  const Q = [c + t * ax * ax, t * ax * ay, sn * ay, t * ax * ay, c + t * ay * ay, -sn * ax, -sn * ay, sn * ax, c], R = s.R, N = new Float64Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) N[i * 3 + j] = Q[i * 3] * R[j] + Q[i * 3 + 1] * R[3 + j] + Q[i * 3 + 2] * R[6 + j];
  if (++s.n % 40 === 0) orthonormal(N);
  s.R = N;
  if (DIRT && p.dirt19 !== false) laySoil(w, p, s, L, dt, name); // (p.dirt19: a test's own switch, tools/boulder19)
  return s;
}
function orthonormal(R) { // Gram-Schmidt on the columns, so rounding never skews the ball
  const col = (j) => [R[j], R[3 + j], R[6 + j]], put = (j, v) => { R[j] = v[0]; R[3 + j] = v[1]; R[6 + j] = v[2]; };
  const nrm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
  const a = nrm(col(0)); let b = col(1); const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; b = nrm([b[0] - d * a[0], b[1] - d * a[1], b[2] - d * a[2]]);
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  put(0, a); put(1, b); put(2, c);
}

// ---------------------------------------------------------------- drawing the ball
// The rolled ball in place of the prop's picture, the same size, with the same outline round it (false: not drawn, the
// caller draws the prop as before)
export const PERF19 = { ms: 0, n: 0, px: 0 };
export function drawRolled(ctx, p, w, name, look = p.look19 || BOULDER_LOOK) {
  if (look !== 'a' && look !== 'b') return false;
  const A = art[name]; if (!A || !A.ready) { loadBoulderArt(name); return false; }
  const s = noteRoll(p, w, name);
  const Rr = ballR(p, name), want = Rr * view.scale * view.dpr;
  const Rp = want > 40 ? Math.ceil(want / 4) * 4 : Math.max(3, Math.ceil(want / 2) * 2);
  const b = bucketFor(A, Rp);
  const hurt = A.snow && p.maxHp ? (1 - p.hp / p.maxHp > 0.65 ? 2 : 1 - p.hp / p.maxHp > 0.35 ? 1 : 0) : 0;
  const T = Math.min(1024, Math.max(128, 2 ** Math.ceil(Math.log2(TAU * Rp * 0.75))));
  const tile = tileFor(A, T, hurt);
  const flash = A.snow && p.hitT > 0 ? Math.round(clamp(p.hitT / 0.12, 0, 1) * 0.6 * 255) : 0; // (a snowball's white flash when a shot lands, as before; a troll's boulder never had one: its hitT is set by a shot and never runs down, sim.js)
  const R = s.R, sig = look + Rp + ':' + T + ':' + hurt + ':' + flash + ':' + (look === 'a' ? R.join(',') : s.pu + ',' + s.pv);
  if (!s.cv || s.cv.width !== b.S) { s.cv = document.createElement('canvas'); s.cv.width = s.cv.height = b.S; s.cx = s.cv.getContext('2d'); s.img = s.cx.createImageData(b.S, b.S); s.u32 = new Uint32Array(s.img.data.buffer); s.sig = ''; }
  if (s.sig !== sig) {
    const t0 = performance.now();
    s.sig = sig;
    paint(b, tile, s, look, flash);
    s.cx.putImageData(s.img, 0, 0);
    PERF19.ms += performance.now() - t0; PERF19.n++; PERF19.px += b.n;
  }
  const f = Rr / Rp; // room units per pixel of the bucket
  ctx.save(); ctx.translate(p.x, p.y); if (view.rot) ctx.rotate(Math.PI / 2);
  if (OUTLINES && A.path) { // the outline: the picture's own outline shape, OUTLINE outside it whatever the ball's size (as getProp's,
    // drawn here so a growing snowball never shows another size's picture standing in with its thicker ring)
    // (looks19's inkFor(fill) gives the outline its own colour: the lead wires it at merge; INK as every prop had)
    const k = Rr / A.Rsvg; ctx.save(); ctx.scale(k, k); ctx.translate(-100, -100);
    ctx.fillStyle = ctx.strokeStyle = inkFor(p.prop === 'yeti-snowball' ? '#d8e3ec' : '#8a847c'); ctx.lineJoin = 'round'; ctx.lineWidth = OUTLINE * 2 / k; ctx.fill(A.path); ctx.stroke(A.path); ctx.restore(); // (lead, merge: outline colour via inkFor)
  }
  ctx.drawImage(s.cv, -b.half * f, -b.half * f, b.S * f, b.S * f);
  ctx.restore();
  return true;
}
function paint(b, tile, s, look, flash) {
  const { n, idx, al, nx, ny, nz, lu, lv, M, A } = b, out = s.u32, tex = tile.tex, T = tile.T, Tm = T - 1, k = T / TAU, c0 = T / 2, OFF = T * 8;
  const R = s.R, r00 = R[0], r01 = R[1], r02 = R[2], r10 = R[3], r11 = R[4], r12 = R[5], r20 = R[6], r21 = R[7], r22 = R[8];
  const pu = s.pu * k, pv = s.pv * k;
  for (let i = 0; i < n; i++) {
    let u, v;
    if (look === 'a') { // the ball's own point under this pixel: q = R^T n; its half (z < 0: the face we saw at the start)
      const x = nx[i], y = ny[i], z = nz[i];
      const qx = r00 * x + r10 * y + r20 * z, qy = r01 * x + r11 * y + r21 * z, qz = r02 * x + r12 * y + r22 * z;
      const kk = KL[((qz < 0 ? -qz : qz) * 2048) | 0] * k;
      if (qz < 0) { u = c0 + qx * kk; v = c0 + qy * kk; } else { u = qx * kk; v = qy * kk; }
    } else { u = c0 + lu[i] * k - pu; v = c0 + lv[i] * k - pv; } // the flat tile through the fish-eye, slid by the roll
    const t = tex[(((v + OFF) | 0) & Tm) * T + (((u + OFF) | 0) & Tm)], j = i * 3;
    let r = ((t & 255) * M[j] >> 8) + A[j] + flash, g = (((t >> 8) & 255) * M[j + 1] >> 8) + A[j + 1] + flash, bl = (((t >> 16) & 255) * M[j + 2] >> 8) + A[j + 2] + flash;
    if (r > 255) r = 255; if (g > 255) g = 255; if (bl > 255) bl = 255;
    out[idx[i]] = ((al[i] << 24) | (bl << 16) | (g << 8) | r) >>> 0;
  }
}

// ---------------------------------------------------------------- the dirt trail
// Laid by distance rolled (so faster = more), sized and thickened by speed (k: 0 at a walk's push, 1 at a full roll);
// nothing standing still. Behind the ball: puffs of dust (inked like the game's other dust, fxkit.js dustPuffs), small
// clods flung back and up that land and fade, faint scuffs pressed into the floor (no outline: ground marks never have
// one). A snowball: spray and clumps of snow, no scuffs (it leaves its own track, foe-draw.js).
const DUST = ['#E2D6BE', '#EDE5D4', '#D3C6AC'], CLOD = ['#8C8270', '#6C645C', '#7A6A55'], SNOWP = ['#F4FAFF', '#FFFFFF', '#E2EEF8'], SNOWC = ['#EEF6FF', '#D8E8F6'];
let seq = 1;
function laySoil(w, p, s, L, dt, name) {
  const snow = KIND[name] && KIND[name].snow, list = w._dirt19 || (w._dirt19 = []);
  const k = clamp((s.sp - 30) / 260, 0, 1), Rr = ballR(p, name), sz = Rr / 40;
  s.k = k;
  if (s.sp < 12) return;
  s.acc += L;
  const every = 8;
  while (s.acc >= every) {
    s.acc -= every; const n = seq++, h = (j) => hash(n, j, 19);
    const bx = p.x - s.ux * Rr * 0.82, by = p.y - s.uy * Rr * 0.82, px = -s.uy, py = s.ux; // the ball's back, and across
    const side = (h(1) - 0.5) * 2;
    // a puff: most steps at a roll, now and then at a push; left behind where the ball's back was, drifting out to its
    // side a little, so the puffs make a wake behind it
    if (h(2) < 0.1 + 0.65 * k) {
      const off = side * Rr * 0.38, out = (8 + 26 * k) * (0.5 + 0.5 * h(3)), back = 6 + 16 * k;
      list.push({ type: 'puff', x: bx + px * off, y: by + py * off, vx: -s.ux * back + px * side * out, vy: -s.uy * back + py * side * out, z: 0, vz: 5 + 10 * k,
        t: 0, max: 0.3 + 0.38 * k + 0.12 * h(4), s: (4.5 + 8.5 * k) * (0.7 + 0.3 * h(5)) * sz * (snow ? 1.05 : 1), col: (snow ? SNOWP : DUST)[Math.floor(h(6) * 3)], n });
    }
    // a clod: only rolling, not pushed at a walk
    if (k > 0.2 && h(7) < 0.32 * k) {
      const a = Math.atan2(-s.uy, -s.ux) + (h(8) - 0.5) * 1.9, sp = 50 + 120 * k * h(9);
      list.push({ type: 'clod', x: p.x - s.ux * Rr * 0.6 + px * side * Rr * 0.4, y: p.y - s.uy * Rr * 0.6 + py * side * Rr * 0.4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, z: 2, vz: 70 + 110 * k * h(10),
        t: 0, max: 0.7 + 0.4 * h(11), s: (1.6 + 1.6 * h(12)) * sz * (snow ? 1.3 : 1), col: (snow ? SNOWC : CLOD)[Math.floor(h(13) * (snow ? 2 : 3))], spin: (h(14) - 0.5) * 16, n, bounced: false });
    }
    // a scuff in the floor where it pressed (stone dust), the dirt ball only
    if (!snow && k > 0.08 && h(15) < 0.5 + 0.4 * k) {
      const off = side * Rr * 0.3;
      list.push({ type: 'scuff', x: p.x - s.ux * Rr * 0.15 + px * off, y: p.y - s.uy * Rr * 0.15 + py * off, a: Math.atan2(s.uy, s.ux) + (h(16) - 0.5) * 0.4, len: (7 + 9 * k) * sz, wd: (2 + 2.5 * h(17)) * sz,
        t: 0, max: 1.4 + 0.8 * k, al: 0.07 + 0.12 * k, n });
    }
  }
  if (list.length > 260) list.splice(0, list.length - 260);
}
// age the trail by the game's clock (slow motion and pause respected); once a frame, before either layer is drawn
function ageSoil(w) {
  const list = w._dirt19; if (!list || !list.length) { w._dirtT = w.time; return list; }
  const dt = clamp(w.time - (w._dirtT ?? w.time), 0, 0.05); w._dirtT = w.time;
  if (dt > 0) for (const q of list) {
    q.t += dt;
    if (q.type === 'puff') { const dr = Math.exp(-dt * 4); q.vx *= dr; q.vy *= dr; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; }
    else if (q.type === 'clod') {
      q.x += q.vx * dt; q.y += q.vy * dt; q.vz -= 520 * dt; q.z += q.vz * dt;
      if (q.z <= 0) { q.z = 0; if (!q.bounced && q.vz < -40) { q.vz = -q.vz * 0.3; q.vx *= 0.5; q.vy *= 0.5; q.bounced = true; } else { q.vz = 0; q.vx *= Math.exp(-dt * 10); q.vy *= Math.exp(-dt * 10); } }
    }
  }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].t >= list[i].max) list.splice(i, 1);
  return list;
}
// the scuffs, on the floor (render.js: with the other ground marks)
export function drawSoilGround(ctx, w) {
  const list = ageSoil(w); if (!list || !list.length) return;
  ctx.save(); ctx.lineCap = 'round';
  for (const q of list) {
    if (q.type !== 'scuff') continue;
    const e = q.t / q.max, a = q.al * (e < 0.1 ? e / 0.1 : 1 - (e - 0.1) / 0.9);
    ctx.strokeStyle = `rgba(70,56,44,${a})`; ctx.lineWidth = q.wd;
    const cx = Math.cos(q.a) * q.len / 2, cy = Math.sin(q.a) * q.len / 2;
    ctx.beginPath(); ctx.moveTo(q.x - cx, q.y - cy); ctx.lineTo(q.x + cx, q.y + cy); ctx.stroke();
  }
  ctx.restore();
}
// the puffs and clods, just over the floor, under the balls (a ball hides what it kicks up under its own edge)
export function drawSoil(ctx, w) {
  const list = w._dirt19; if (!list || !list.length) return;
  const ux = view.rot ? 1 : 0, uy = view.rot ? 0 : -1; // the screen's up, in the room
  // the puffs as one cloud: every puff's ink first, then every puff's colour over it, so puffs that touch merge into
  // one outlined cloud (the way bodies of a kind merge, puddles.js); each swells, then shrinks away
  const blobs = [];
  for (const q of list) if (q.type === 'puff') {
    const e = q.t / q.max, r = q.s * (e < 0.2 ? 0.45 + 0.55 * e / 0.2 : Math.pow(1 - (e - 0.2) / 0.8, 0.7)); if (r < 0.4) continue;
    const x = q.x + ux * q.z, y = q.y + uy * q.z, h = hash(q.n, 3) * TAU;
    blobs.push([x, y, r, q.col], [x + Math.cos(h) * r * 0.7, y + Math.sin(h) * r * 0.7, r * 0.62, q.col]);
  }
  if (blobs.length) {
    if (OUTLINES) { ctx.fillStyle = inkFor(blobs[0][3]); ctx.beginPath(); for (const [x, y, r] of blobs) { ctx.moveTo(x + r + OUTLINE, y); ctx.arc(x, y, r + OUTLINE, 0, TAU); } ctx.fill(); }
    for (const [x, y, r, c] of blobs) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  }
  for (const q of list) if (q.type === 'clod') {
    const e = q.t / q.max, x = q.x + ux * q.z, y = q.y + uy * q.z, r = q.s * (e > 0.75 ? 1 - (e - 0.75) / 0.25 : 1);
    if (r > 0.3) chip(ctx, x, y, r, q.spin * q.t + q.n, q.col, q.n);
  }
}
function chip(ctx, x, y, r, rot, col, n) { // a small stone chip / clump of snow: five corners, a little uneven
  const path = () => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i / 5 * TAU, rr = r * (0.75 + 0.5 * hash(n, i, 5)); i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); };
  if (OUTLINES) { ctx.save(); ctx.strokeStyle = inkFor(col); ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round'; path(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = col; path(); ctx.fill();
}
