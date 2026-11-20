// Environment looks (lane E, round 6): four styles the player can switch between (a setting, or ?env=1..4 for
// testing), each with its own floor, walls, rock and light in all three dungeon types: 12 floor patterns in all.
// Walls are seen from straight above: the floor sits in a pit whose sides slope up to a flat wall top, so every
// wall shows a bevelled face on the side towards the floor, lit from the screen's top left; free-standing walls
// show four faces sloping out from a flat top. Shadows are top-down: a soft darkening at the foot of every wall,
// even all round, never cast to one side. Everything here is painted once per room into the floor cache.
import { INK, TAU, clamp } from './util.js';
import { view, OUTLINE } from './render.js';

export const ENV_STYLES = [
  { id: 1, name: 'Carved', blurb: 'The default. Clean, chunky stone: rounded tiles with soft gradients, ink outlines, short bevelled walls.' },
  { id: 2, name: 'Flat', blurb: 'Graphic flat colour: crisp geometric tiles, three-tone bevels, no gradients, no outlines.' },
  { id: 3, name: 'Torchlit', blurb: 'Dark and deep: tall walls, torches on the walls throwing warm pools of light on the floor.' },
  { id: 4, name: 'Mosaic', blurb: 'Ornate patterned floors framed by a tiled border, walls capped with a trim, cut masonry.' },
];
const KEY = 'delve.env';
let cur = 0;
// The current style (1..4): ?env= wins, then the saved setting, then 1, Carved. Round 7 (looks-r6): the designer
// picked Carved for all three dungeon types as the default, and also ticked Torchlit for the Crypt and Mosaic for
// the Warren, so all four stay selectable in the settings.
export function envId() {
  if (cur) return cur;
  let n = 0;
  try { n = +new URLSearchParams(location.search).get('env'); } catch {}
  if (!(n >= 1 && n <= 4)) { try { n = +localStorage.getItem(KEY); } catch {} }
  return (cur = n >= 1 && n <= 4 ? Math.round(n) : 1);
}
// Pick a style (the settings menu calls this). The floor cache keys on envId(), so the next frame repaints.
export function setEnv(n) { cur = clamp(Math.round(+n) || 1, 1, 4); try { localStorage.setItem(KEY, String(cur)); } catch {} return cur; }

// ---------------------------------------------------------------- the looks, per style and dungeon type
// floor: tile colours; grout: the lines between; wall: the wall's stone (faces are shaded from it by the light);
// top: the wall's flat top; mass: the rock beyond the walls; trim: style 4's wall cap and floor border;
// light: style 3's torch light. D: how far a wall's face slopes (its height, seen from above); T: the top's width.
const LOOKS = {
  1: { D: 14, T: 16, ink: true, ao: 0.2, decorA: 0.5, rock: 'rock-1', fogK: 1,
    crypt: { pattern: 'flag', floor: ['#BDB9B6', '#A9A5A4'], grout: '#8C8890', wall: '#8E8C98', top: '#A9A7B2', mass: '#3A3742', void: '#25222C' },
    sewers: { pattern: 'brick', floor: ['#B7B998', '#A2A583'], grout: '#7D8064', wall: '#7E866A', top: '#98A084', mass: '#323A30', void: '#1E2620' },
    warren: { pattern: 'dirt', floor: ['#CDB089', '#B4946C'], grout: '#9C7A54', wall: '#9A7650', top: '#B48D64', mass: '#45342A', void: '#2C2019' } },
  2: { D: 18, T: 12, ink: false, ao: 0, flatShadow: 0.14, decorA: 0.42, rock: 'rock-2', fogK: 0.7,
    crypt: { pattern: 'diamond', floor: ['#C8C5D2', '#B1AEBF'], grout: '#9A97AA', dots: '#7C7894', wall: '#7A7790', top: '#9693AA', mass: '#2E2B3A', void: '#2E2B3A' },
    sewers: { pattern: 'hex', floor: ['#A8C3A0', '#94B08D', '#B9D0AC'], grout: '#6C886A', wall: '#5B7860', top: '#77937A', mass: '#22302A', void: '#22302A' },
    warren: { pattern: 'planks', floor: ['#CB9C64', '#BB8C56', '#D8AB72'], grout: '#7A5534', wall: '#8A6442', top: '#A67C54', mass: '#33251B', void: '#33251B' } },
  3: { D: 24, T: 10, ink: true, ao: 0.42, decorA: 0.42, rock: 'rock-3', fogK: 1.25, torches: true,
    crypt: { pattern: 'slate', floor: ['#706C76', '#5E5A65'], grout: '#34303A', wall: '#5C5866', top: '#6E6A78', mass: '#141218', void: '#141218', light: '255,178,102' },
    sewers: { pattern: 'cobble', floor: ['#5F6858', '#4D5548'], grout: '#3A4236', wall: '#4C5446', top: '#5E6758', mass: '#0F1410', void: '#0F1410', light: '214,236,140' },
    warren: { pattern: 'crazy', floor: ['#7E6652', '#6C5645'], grout: '#38291F', wall: '#604837', top: '#745A48', mass: '#160F0B', void: '#160F0B', light: '255,150,72' } },
  4: { D: 12, T: 18, ink: true, ao: 0.16, decorA: 0.45, rock: 'rock-4', fogK: 0.85, border: true,
    crypt: { pattern: 'checker', floor: ['#DED8CB', '#7D8098'], grout: '#3E4054', vein: 'rgba(255,255,255,0.18)', wall: '#B4AEA2', top: '#CAC4B8', mass: '#2A2833', void: '#22202A', trim: '#6E8FB0', trim2: '#C9A45A' },
    sewers: { pattern: 'herring', floor: ['#B47C5C', '#9E6A4D'], grout: '#5E4A3E', wall: '#8C8F7A', top: '#A3A68F', mass: '#202923', void: '#1C2420', trim: '#3F7360', trim2: '#C7B98A' },
    warren: { pattern: 'basket', floor: ['#C9774F', '#B56640'], grout: '#E2C9A6', wall: '#A8805A', top: '#C19870', mass: '#2F2017', void: '#2A1C14', trim: '#7A3F24', trim2: '#E8B65A' } },
};
export function lookOf(w) {
  const s = LOOKS[envId()], id = (w && w.theme && w.theme.id) || 'crypt';
  return { ...s, ...(s[id] || s.crypt), style: envId(), theme: id };
}
export const envVoid = (w) => lookOf(w).void;
export const envFogK = () => LOOKS[envId()].fogK;

// ---------------------------------------------------------------- colour and light
const hex3 = (h) => { if (h[0] !== '#') return h.match(/[\d.]+/g).slice(0, 3).map(Number); const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export function shade(h, k) { // k < 0 darkens, k > 0 lightens
  const c = hex3(h).map((v) => Math.round(clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k, 0, 255)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const hash = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
// The light comes from the screen's top left. A face's brightness from its normal in room units (portrait turns the
// room a quarter turn: room +x is screen up, room +y screen right).
const LX = -0.5, LY = -0.866;
function faceK(nx, ny) { const sx = view.rot ? ny : nx, sy = view.rot ? -nx : ny; return sx * LX + sy * LY; }
// A gradient running from a box's top-left corner on screen to its bottom-right one.
function litGrad(g, x, y, w, h, a, b) {
  const l = view.rot ? g.createLinearGradient(x + w, y, x, y + h) : g.createLinearGradient(x, y, x + w, y + h);
  l.addColorStop(0, a); l.addColorStop(1, b); return l;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
function poly(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }

// ---------------------------------------------------------------- the room's edges
// Every side of a floor chunk with rock or the outside beyond it is a wall edge. Each end of an edge is convex
// (+1: the floor's corner, the wall wraps round it), straight (0) or concave (-1: a rock corner juts into the floor),
// so faces and bands meet in clean mitres.
function floorCells(w) { return w.cells && w.cells.length ? w.cells : [{ c: 0, r: 0, x: 0, y: 0, w: w.W, h: w.H }]; }
function roomEdges(w) {
  const cells = floorCells(w), F = new Set(cells.map((c) => c.c + ',' + c.r)), isF = (c, r) => F.has(c + ',' + r);
  const out = [];
  for (const k of cells) {
    const sides = [ // [outward grid step, along grid step, p0, p1]
      [[0, -1], [1, 0], [k.x, k.y], [k.x + k.w, k.y]],
      [[0, 1], [1, 0], [k.x, k.y + k.h], [k.x + k.w, k.y + k.h]],
      [[-1, 0], [0, 1], [k.x, k.y], [k.x, k.y + k.h]],
      [[1, 0], [0, 1], [k.x + k.w, k.y], [k.x + k.w, k.y + k.h]],
    ];
    for (const [[oc, or], [dc, dr], p0, p1] of sides) {
      if (isF(k.c + oc, k.r + or)) continue;
      const end = (s) => (!isF(k.c + s * dc, k.r + s * dr) ? 1 : isF(k.c + s * dc + oc, k.r + s * dr + or) ? -1 : 0);
      out.push({ p0, p1, o: [oc, or], d: [dc, dr], s0: end(-1), s1: end(1) });
    }
  }
  return out;
}
// The quad between offsets a and b from an edge (positive: into the wall, negative: into the floor).
function edgeQuad(e, a, b) {
  const P = (p, t, s, sg) => [p[0] + e.o[0] * t + sg * e.d[0] * s * t, p[1] + e.o[1] * t + sg * e.d[1] * s * t];
  return [P(e.p0, a, e.s0, -1), P(e.p1, a, e.s1, 1), P(e.p1, b, e.s1, 1), P(e.p0, b, e.s0, -1)];
}
// A free-standing wall's four sides (outward normals), each end concave from the floor's side. A side that touches
// the room's edge is left out and the wall reaches on into the room's wall there.
function blockEdges(r, w, reach) {
  const at = { t: r.y <= 1, b: r.y + r.h >= w.H - 1, l: r.x <= 1, rt: r.x + r.w >= w.W - 1 };
  const x0 = r.x - (at.l ? reach : 0), y0 = r.y - (at.t ? reach : 0), x1 = r.x + r.w + (at.rt ? reach : 0), y1 = r.y + r.h + (at.b ? reach : 0);
  const sides = [];
  if (!at.t) sides.push({ p0: [x0, y0], p1: [x1, y0], o: [0, 1], d: [1, 0], n: [0, -1], s0: at.l ? 0 : -1, s1: at.rt ? 0 : -1 });
  if (!at.b) sides.push({ p0: [x0, y1], p1: [x1, y1], o: [0, -1], d: [1, 0], n: [0, 1], s0: at.l ? 0 : -1, s1: at.rt ? 0 : -1 });
  if (!at.l) sides.push({ p0: [x0, y0], p1: [x0, y1], o: [1, 0], d: [0, 1], n: [-1, 0], s0: at.t ? 0 : -1, s1: at.b ? 0 : -1 });
  if (!at.rt) sides.push({ p0: [x1, y0], p1: [x1, y1], o: [-1, 0], d: [0, 1], n: [1, 0], s0: at.t ? 0 : -1, s1: at.b ? 0 : -1 });
  return { sides, box: [x0, y0, x1 - x0, y1 - y0] };
}

// ---------------------------------------------------------------- painting a room
// g is scaled and translated so (0,0) is the floor's corner; pad is how far the cache reaches past it.
// hooks: { water(g), decor(g) } paint the theme's water and floor dressing (scenery.js) inside the floor.
export function paintRoom(g, w, pad, hooks) {
  const L = lookOf(w), edges = roomEdges(w), cells = floorCells(w);
  // the rock beyond the walls
  g.fillStyle = L.mass; g.fillRect(-pad, -pad, w.W + pad * 2, w.H + pad * 2);
  massTexture(g, w, pad, L);
  // the floor
  g.save(); g.beginPath(); for (const k of cells) g.rect(k.x, k.y, k.w, k.h); g.clip();
  PATTERNS[L.pattern](g, w, L);
  if (L.border) for (const e of edges) border(g, e, L);
  if (hooks && hooks.water) hooks.water(g);
  if (hooks && hooks.decor) {
    // the floor dressing on its own layer, laid down faint so nothing on the ground looks solid or important
    // (at half the cache's resolution: it is faint anyway, and a phone's canvas memory is short)
    const c = document.createElement('canvas'); c.width = Math.ceil(g.canvas.width / 2); c.height = Math.ceil(g.canvas.height / 2);
    const lg = c.getContext('2d'), m = g.getTransform(); lg.setTransform(m.a / 2, m.b / 2, m.c / 2, m.d / 2, m.e / 2, m.f / 2);
    hooks.decor(lg);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = L.decorA; g.drawImage(c, 0, 0, g.canvas.width, g.canvas.height); g.restore();
    c.width = c.height = 0; // let it go now (Safari holds canvas memory until then)
  }
  // top-down shadow at the foot of every wall, the same all round
  const blocks = (w.walls || []).filter((r) => !r.solid && r.temp == null).map((r) => blockEdges(r, w, L.D + L.T));
  footShadow(g, L, edges.map((e) => edgeQuad(e, 0, -22)), blocks.flatMap((b) => b.sides.map((e) => edgeQuad(e, 0, -16))));
  if (L.torches) torchLight(g, w, edges, L);
  g.restore();
  // the walls round the room: a face sloping up from the floor, then the flat top
  for (const e of edges) face(g, edgeQuad(e, 0, L.D), -e.o[0], -e.o[1], L);
  for (const e of edges) top(g, edgeQuad(e, L.D, L.D + L.T), L);
  if (L.ink) {
    g.save(); g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round';
    g.lineWidth = OUTLINE * 1.6; for (const e of edges) { g.beginPath(); g.moveTo(...e.p0); g.lineTo(...e.p1); g.stroke(); }
    g.lineWidth = OUTLINE; for (const e of edges) { const q = edgeQuad(e, L.D + L.T, L.D + L.T); g.beginPath(); g.moveTo(...q[0]); g.lineTo(...q[1]); g.stroke(); }
    g.restore();
  }
  // free-standing walls
  for (const b of blocks) block(g, b, L);
  if (L.torches) for (const t of torchSpots(w, edges, L)) torch(g, t, L);
}

// Temporary walls (a frost wall...) still draw every frame, in the same look.
export function drawBlock(ctx, r, w) { const L = lookOf(w); block(ctx, blockEdges(r, w, 0), L); }

function face(g, q, nx, ny, L) {
  const k = faceK(nx, ny), base = L.wall;
  if (L.style === 2) { g.fillStyle = k > 0.3 ? shade(base, 0.28) : k < -0.3 ? shade(base, -0.3) : shade(base, -0.06); poly(g, q); g.fill(); return; }
  // darker at the foot, lighter at the lip
  const c = k >= 0 ? shade(base, 0.32 * k) : shade(base, 0.42 * k);
  const gr = g.createLinearGradient((q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2, (q[2][0] + q[3][0]) / 2, (q[2][1] + q[3][1]) / 2);
  gr.addColorStop(0, shade(base, (k >= 0 ? 0.32 * k : 0.42 * k) - (L.style === 3 ? 0.4 : 0.18)));
  gr.addColorStop(1, c);
  g.fillStyle = gr; poly(g, q); g.fill();
  // courses of stone along the face
  g.save(); poly(g, q); g.clip();
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1.4;
  for (const f of L.style === 3 ? [0.33, 0.66] : [0.5]) {
    const a = [q[0][0] + (q[3][0] - q[0][0]) * f, q[0][1] + (q[3][1] - q[0][1]) * f], b = [q[1][0] + (q[2][0] - q[1][0]) * f, q[1][1] + (q[2][1] - q[1][1]) * f];
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  }
  g.restore();
  // the lip catches the light
  g.strokeStyle = `rgba(255,255,255,${0.1 + 0.12 * Math.max(0, k)})`; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...q[2]); g.lineTo(...q[3]); g.stroke();
}
function top(g, q, L) {
  g.fillStyle = L.top; poly(g, q); g.fill();
  if (L.style === 4) { // the trim: a coloured cap with a bright line along it
    const m = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    g.fillStyle = L.trim; poly(g, [q[0], q[1], m(q[1], q[2], 0.4), m(q[0], q[3], 0.4)]); g.fill();
    g.strokeStyle = L.trim2; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...m(q[0], q[3], 0.4)); g.lineTo(...m(q[1], q[2], 0.4)); g.stroke();
  } else if (L.style !== 2) { // block joints across the top
    const len = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), n = Math.max(1, Math.round(len / 46));
    g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1.4;
    for (let i = 1; i < n; i++) { const f = i / n; g.beginPath(); g.moveTo(q[0][0] + (q[1][0] - q[0][0]) * f, q[0][1] + (q[1][1] - q[0][1]) * f); g.lineTo(q[3][0] + (q[2][0] - q[3][0]) * f, q[3][1] + (q[2][1] - q[3][1]) * f); g.stroke(); }
  }
}
function block(g, b, L) {
  const D = Math.min(L.D, b.box[2] / 2 - 6, b.box[3] / 2 - 6);
  if (L.ink) { g.save(); g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = OUTLINE * 1.6; g.lineJoin = 'round'; g.beginPath(); g.rect(...b.box); g.fill(); g.stroke(); g.restore(); }
  for (const e of b.sides) face(g, edgeQuad(e, 0, D), e.n[0], e.n[1], L);
  // the flat top, inset by the faces
  const at = b.sides.reduce((a, e) => { a[e.n.join()] = 1; return a; }, {});
  const x0 = b.box[0] + (at['-1,0'] ? D : 0), y0 = b.box[1] + (at['0,-1'] ? D : 0);
  const x1 = b.box[0] + b.box[2] - (at['1,0'] ? D : 0), y1 = b.box[1] + b.box[3] - (at['0,1'] ? D : 0);
  const q = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  g.fillStyle = L.style === 2 ? L.top : litGrad(g, x0, y0, x1 - x0, y1 - y0, shade(L.top, 0.1), shade(L.top, -0.06)); poly(g, q); g.fill();
  if (L.style === 4) { g.strokeStyle = L.trim; g.lineWidth = 4; g.strokeRect(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8); }
  else if (L.style !== 2) {
    g.save(); poly(g, q); g.clip(); g.strokeStyle = 'rgba(0,0,0,0.13)'; g.lineWidth = 1.4;
    const long = x1 - x0 > y1 - y0, len = long ? x1 - x0 : y1 - y0, n = Math.max(1, Math.round(len / 44));
    for (let i = 1; i < n; i++) { g.beginPath(); if (long) { const x = x0 + (x1 - x0) * i / n; g.moveTo(x, y0); g.lineTo(x, y1); } else { const y = y0 + (y1 - y0) * i / n; g.moveTo(x0, y); g.lineTo(x1, y); } g.stroke(); }
    g.restore();
  }
}
function footShadow(g, L, quads, bq) {
  if (L.flatShadow) { g.fillStyle = `rgba(20,14,30,${L.flatShadow})`; for (const q of [...quads, ...bq]) { const h = [q[0], q[1], mid(q[1], q[2], 0.45), mid(q[0], q[3], 0.45)]; poly(g, h); g.fill(); } return; }
  for (const q of [...quads, ...bq]) {
    const a = mid(q[0], q[1], 0.5), b = mid(q[3], q[2], 0.5);
    const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); gr.addColorStop(0, `rgba(16,10,24,${L.ao})`); gr.addColorStop(1, 'rgba(16,10,24,0)');
    g.fillStyle = gr; poly(g, q); g.fill();
  }
}
const mid = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

function border(g, e, L) { // style 4: a tiled band round the floor's edge
  g.fillStyle = L.trim; poly(g, edgeQuad(e, -6, -30)); g.fill();
  g.fillStyle = L.trim2; poly(g, edgeQuad(e, -9, -12)); g.fill(); poly(g, edgeQuad(e, -24, -27)); g.fill();
  // small squares set along the band
  const len = Math.hypot(e.p1[0] - e.p0[0], e.p1[1] - e.p0[1]), n = Math.floor(len / 36);
  g.fillStyle = shade(L.trim, 0.25);
  for (let i = 1; i < n; i++) { const f = i / n, p = [e.p0[0] + (e.p1[0] - e.p0[0]) * f - e.o[0] * 18, e.p0[1] + (e.p1[1] - e.p0[1]) * f - e.o[1] * 18]; g.save(); g.translate(p[0], p[1]); g.rotate(Math.PI / 4); g.fillRect(-3.2, -3.2, 6.4, 6.4); g.restore(); }
}

// ---------------------------------------------------------------- style 3's torches
function torchSpots(w, edges, L) {
  const out = [], doors = (w.doors || []).map((d) => d.y), din = w.doorIn ? w.doorIn.y : -999;
  for (const e of edges) {
    const len = Math.hypot(e.p1[0] - e.p0[0], e.p1[1] - e.p0[1]); if (len < 220) continue;
    const n = Math.max(1, Math.round(len / 340));
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n, x = e.p0[0] + (e.p1[0] - e.p0[0]) * f, y = e.p0[1] + (e.p1[1] - e.p0[1]) * f;
      if (e.o[0] === 1 && x >= w.W - 1 && doors.some((dy) => Math.abs(dy - y) < 95)) continue;
      if (e.o[0] === -1 && x <= 1 && Math.abs(din - y) < 95) continue;
      out.push({ x: x + e.o[0] * (L.D + L.T * 0.5), y: y + e.o[1] * (L.D + L.T * 0.5), fx: x - e.o[0] * 4, fy: y - e.o[1] * 4 });
    }
  }
  return out;
}
function torchLight(g, w, edges, L) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const t of torchSpots(w, edges, L)) {
    const gr = g.createRadialGradient(t.fx, t.fy, 4, t.fx, t.fy, 210);
    gr.addColorStop(0, `rgba(${L.light},0.30)`); gr.addColorStop(0.45, `rgba(${L.light},0.12)`); gr.addColorStop(1, `rgba(${L.light},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(t.fx, t.fy, 210, 0, TAU); g.fill();
  }
  g.restore();
}
function torch(g, t, L) {
  const gl = g.createRadialGradient(t.x, t.y, 1, t.x, t.y, 26);
  gl.addColorStop(0, `rgba(${L.light},0.75)`); gl.addColorStop(1, `rgba(${L.light},0)`);
  g.fillStyle = gl; g.beginPath(); g.arc(t.x, t.y, 26, 0, TAU); g.fill();
  g.fillStyle = INK; g.beginPath(); g.arc(t.x, t.y, 7.5, 0, TAU); g.fill();
  g.fillStyle = '#4A3F3A'; g.beginPath(); g.arc(t.x, t.y, 5.2, 0, TAU); g.fill();
  g.fillStyle = '#FFB347'; g.beginPath(); g.arc(t.x, t.y, 4, 0, TAU); g.fill();
  g.fillStyle = '#FFF0B8'; g.beginPath(); g.arc(t.x - 0.8, t.y - 0.8, 2, 0, TAU); g.fill();
}

// ---------------------------------------------------------------- the rock beyond the walls
function massTexture(g, w, pad, L) {
  const x0 = -pad, y0 = -pad, X = w.W + pad, Y = w.H + pad;
  if (L.style === 1) { // big soft lumps
    for (let i = 0, n = (X - x0) * (Y - y0) / 2600; i < n; i++) {
      const x = x0 + hash(i, 1.3) * (X - x0), y = y0 + hash(i, 2.7) * (Y - y0), r = 10 + hash(i, 3.1) * 16;
      g.fillStyle = 'rgba(255,255,255,0.035)'; g.beginPath(); g.ellipse(x - 2, y - 2, r, r * 0.75, hash(i, 4), 0, TAU); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.07)'; g.beginPath(); g.ellipse(x + 3, y + 3, r * 0.8, r * 0.55, hash(i, 5), 0, TAU); g.fill();
    }
  } else if (L.style === 2) { // a fine diagonal hatch
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 3;
    for (let s = x0 + y0 - 40; s < X + Y; s += 18) { g.beginPath(); g.moveTo(s - y0, y0); g.lineTo(s - Y, Y); g.stroke(); }
  } else if (L.style === 3) { // faint cracked rock
    g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 2;
    for (let i = 0, n = (X - x0) * (Y - y0) / 9000; i < n; i++) {
      let x = x0 + hash(i, 6.1) * (X - x0), y = y0 + hash(i, 7.3) * (Y - y0), a = hash(i, 8) * TAU;
      g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { a += hash(i, j) - 0.5; x += Math.cos(a) * 16; y += Math.sin(a) * 16; g.lineTo(x, y); } g.stroke();
    }
  } else { // cut blocks in courses
    g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 2;
    for (let j = 0, y = y0; y < Y; j++, y += 34) { g.beginPath(); g.moveTo(x0, y); g.lineTo(X, y); g.stroke(); for (let x = x0 + (j % 2) * 34; x < X; x += 68) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 34); g.stroke(); } }
  }
}

// ---------------------------------------------------------------- the 12 floors
const PATTERNS = {
  // Crypt
  flag(g, w, L) { // 1: big rounded flagstones in rows of mixed lengths, each softly lit
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const RH = 64, gap = 5;
    for (let j = 0, y = 0; y < w.H; j++, y += RH) {
      for (let x = -hash(j, 3) * 90, i = 0; x < w.W; i++) {
        const sw = 66 + Math.floor(hash(i, j + 0.5) * 4) * 24, c = shade(L.floor[0], (hash(i + 7, j * 3) - 0.5) * 0.16);
        g.fillStyle = litGrad(g, x, y, sw, RH, shade(c, 0.07), shade(c, -0.07)); rr(g, x + gap / 2, y + gap / 2, sw - gap, RH - gap, 10); g.fill();
        x += sw;
      }
    }
  },
  diamond(g, w, L) { // 2: diamond tiles in two flat tones, small square inserts where four corners meet
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const d = 64, h = d / 2, gap = 2.2;
    for (let j = -1; j * h < w.H + d; j++) for (let i = -1; i * d < w.W + d; i++) {
      const cx = i * d + (j % 2 ? h : 0), cy = j * h;
      g.fillStyle = j % 2 ? L.floor[1] : L.floor[0];
      poly(g, [[cx, cy - h + gap], [cx + h - gap, cy], [cx, cy + h - gap], [cx - h + gap, cy]]); g.fill();
    }
    g.fillStyle = L.dots;
    for (let j = -1; j * h < w.H + d; j++) for (let i = -1; i * d < w.W + d; i++) { const cx = i * d + (j % 2 ? 0 : h), cy = j * h; g.fillRect(cx - 5, cy - 5, 10, 10); }
  },
  slate(g, w, L) { // 3: big dark slate slabs in a running bond, a few cracked
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const SW = 132, SH = 88, gap = 3;
    for (let j = 0, y = 0; y < w.H; j++, y += SH) for (let i = -1, x = (j % 2) * -SW / 2; x < w.W; i++, x += SW) {
      const hv = hash(i + 3.1, j + 1.7), c = shade(L.floor[0], (hv - 0.5) * 0.22);
      g.fillStyle = litGrad(g, x, y, SW, SH, shade(c, 0.05), shade(c, -0.1)); g.fillRect(x + gap / 2, y + gap / 2, SW - gap, SH - gap);
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2; g.strokeRect(x + gap / 2 + 1, y + gap / 2 + 1, SW - gap - 2, SH - gap - 2);
      if (hv > 0.78) {
        g.strokeStyle = 'rgba(20,16,24,0.45)'; g.lineWidth = 1.6; g.beginPath();
        let px = x + 10 + hash(i, j) * 40, py = y + 6; g.moveTo(px, py);
        for (let k = 0; k < 5; k++) { px += 6 + hash(k, i) * 18; py += 8 + hash(j, k) * 10; g.lineTo(px, Math.min(py, y + SH - 4)); }
        g.stroke();
      }
    }
  },
  checker(g, w, L) { // 4: a marble checkerboard with faint veins
    const S = 52;
    for (let j = 0; j * S < w.H; j++) for (let i = 0; i * S < w.W; i++) {
      const dark = (i + j) % 2, x = i * S, y = j * S;
      g.fillStyle = litGrad(g, x, y, S, S, shade(L.floor[dark], 0.05), shade(L.floor[dark], -0.05)); g.fillRect(x, y, S, S);
      if (hash(i, j) > 0.55) {
        g.strokeStyle = dark ? L.vein : 'rgba(80,80,110,0.14)'; g.lineWidth = 1.4; g.beginPath();
        g.moveTo(x + hash(i, 1) * S, y); g.bezierCurveTo(x + S * 0.2, y + S * 0.4, x + S * 0.8, y + S * 0.5, x + hash(j, 2) * S, y + S); g.stroke();
      }
    }
    g.strokeStyle = L.grout; g.globalAlpha = 0.35; g.lineWidth = 1;
    for (let x = 0; x < w.W; x += S) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, w.H); g.stroke(); }
    for (let y = 0; y < w.H; y += S) { g.beginPath(); g.moveTo(0, y); g.lineTo(w.W, y); g.stroke(); }
    g.globalAlpha = 1;
  },
  // Sewers
  brick(g, w, L) { // 5: rounded bricks in a running bond, softly lit
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const TW = 64, TH = 34, gap = 3.5;
    for (let j = 0, y = 0; y < w.H; j++, y += TH) for (let i = 0, x = j % 2 ? -TW / 2 : 0; x < w.W; i++, x += TW) {
      const c = shade(L.floor[0], (hash(i + j * 0.37, j) - 0.5) * 0.18);
      g.fillStyle = litGrad(g, x, y, TW, TH, shade(c, 0.07), shade(c, -0.07)); rr(g, x + gap / 2, y + gap / 2, TW - gap, TH - gap, 6); g.fill();
    }
  },
  hex(g, w, L) { // 6: flat hexagon tiles in three tones
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const R = 27, hgt = Math.sqrt(3) * R, rr2 = R - 2.2;
    for (let i = -1; i * 1.5 * R < w.W + R * 2; i++) for (let j = -1; j * hgt < w.H + hgt; j++) {
      const cx = i * 1.5 * R, cy = j * hgt + (i % 2 ? hgt / 2 : 0), hv = hash(i, j);
      g.fillStyle = L.floor[hv < 0.45 ? 0 : hv < 0.8 ? 1 : 2];
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; k ? g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2) : g.moveTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.closePath(); g.fill();
    }
  },
  cobble(g, w, L) { // 7: wet cobbles: rounded stones, a shine on some, darker damp patches
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const S = 28;
    for (let j = 0; j * S < w.H + S; j++) for (let i = 0; i * S < w.W + S; i++) {
      const x = i * S + (j % 2) * S / 2 + (hash(i, j) - 0.5) * 6, y = j * S + (hash(j, i) - 0.5) * 6, hv = hash(i + 1.3, j + 2.1);
      const rx = 11 + hv * 3, ry = 10 + hash(i, j + 5) * 3;
      g.fillStyle = shade(L.floor[0], (hv - 0.5) * 0.14); g.beginPath(); g.ellipse(x, y, rx, ry, hv * 3, 0, TAU); g.fill();
      if (hv > 0.7) { g.fillStyle = 'rgba(220,240,230,0.08)'; g.beginPath(); g.ellipse(x - 3, y - 3, rx * 0.45, ry * 0.25, -0.6, 0, TAU); g.fill(); }
    }
    for (let i = 0; i < w.W * w.H / 90000; i++) { const x = hash(i, 9) * w.W, y = hash(i, 10) * w.H; g.fillStyle = 'rgba(10,20,16,0.22)'; g.beginPath(); g.ellipse(x, y, 60 + hash(i, 11) * 50, 30 + hash(i, 12) * 20, hash(i, 13) * 3, 0, TAU); g.fill(); }
  },
  herring(g, w, L) { // 8: brick herringbone
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const u = 17, gap = 2.4, X = w.W / u, Y = w.H / u;
    for (let i = -Math.ceil(Y / 2) - 3; i < (X + Y) / 2 + 3; i++) for (let j = -Math.ceil(Y / 4) - 3; j < X / 4 + 3; j++) {
      const ox = (i + 2 * j) * u, oy = (i - 2 * j) * u;
      if (ox > w.W + 3 * u || oy > w.H + 3 * u || ox < -4 * u || oy < -4 * u) continue;
      const c1 = shade(L.floor[hash(i, j) < 0.5 ? 0 : 1], (hash(j, i) - 0.5) * 0.12), c2 = shade(L.floor[hash(i + 9, j) < 0.5 ? 0 : 1], (hash(j + 9, i) - 0.5) * 0.12);
      g.fillStyle = c1; rr(g, ox + gap / 2, oy + gap / 2, 2 * u - gap, u - gap, 2); g.fill();
      g.fillStyle = c2; rr(g, ox + 2 * u + gap / 2, oy - u + gap / 2, u - gap, 2 * u - gap, 2); g.fill();
    }
  },
  // Warren
  dirt(g, w, L) { // 9: packed earth, soft blotches, worn ruts, a scatter of pebbles
    g.fillStyle = litGrad(g, 0, 0, w.W, w.H, L.floor[0], L.floor[1]); g.fillRect(0, 0, w.W, w.H);
    g.globalAlpha = 0.5;
    for (let i = 0; i < w.W * w.H / 26000; i++) {
      const x = hash(i, 1) * w.W, y = hash(i, 2) * w.H, r = 60 + hash(i, 3) * 90;
      g.fillStyle = hash(i, 4) < 0.5 ? 'rgba(110,74,40,0.16)' : 'rgba(255,240,200,0.12)'; g.beginPath(); g.ellipse(x, y, r, r * 0.6, hash(i, 5) * 3, 0, TAU); g.fill();
    }
    g.globalAlpha = 1; g.strokeStyle = 'rgba(110,74,40,0.12)'; g.lineCap = 'round';
    for (let i = 0; i < w.W / 500; i++) {
      const y = hash(i, 11) * w.H; g.lineWidth = 14 + hash(i, 12) * 10;
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w.W * 0.3, y + 60 * (hash(i, 13) - 0.5), w.W * 0.6, y - 80 * (hash(i, 14) - 0.5), w.W, y + 40 * (hash(i, 15) - 0.5)); g.stroke();
    }
    for (let i = 0; i < w.W * w.H / 5000; i++) {
      const x = hash(i, 6) * w.W, y = hash(i, 7) * w.H, r = 1.6 + hash(i, 8) * 2.4;
      g.fillStyle = 'rgba(80,55,30,0.25)'; g.beginPath(); g.arc(x + 1, y + 1, r, 0, TAU); g.fill();
      g.fillStyle = 'rgba(235,215,180,0.4)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
  },
  planks(g, w, L) { // 10: floorboards running forward, staggered joints, nail heads
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const PW = 26, gap = 2.5;
    for (let j = 0, y = 0; y < w.H; j++, y += PW) for (let x = -hash(j, 1) * 160, i = 0; x < w.W; i++) {
      const len = 110 + Math.floor(hash(i, j + 0.3) * 4) * 40, hv = hash(i + 2, j);
      g.fillStyle = L.floor[hv < 0.4 ? 0 : hv < 0.75 ? 1 : 2]; g.fillRect(x + gap / 2, y + gap / 2, len - gap, PW - gap);
      g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(x + gap / 2, y + PW * 0.55, len - gap, 2); // a grain line
      g.fillStyle = L.grout; for (const nx of [x + 7, x + len - 7]) for (const ny of [y + 7, y + PW - 7]) { g.beginPath(); g.arc(nx, ny, 1.7, 0, TAU); g.fill(); }
      x += len;
    }
  },
  crazy(g, w, L) { // 11: crazy paving: flat irregular stones, shared jittered corners
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const S = 58, J = 17, nx = Math.ceil(w.W / S) + 2, ny = Math.ceil(w.H / S) + 2;
    const P = (i, j) => [i * S + (hash(i, j) - 0.5) * 2 * J, j * S + (hash(j + 0.5, i) - 0.5) * 2 * J];
    const shrink = (pts, k) => { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; return pts.map((p) => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; return [p[0] - dx / d * k, p[1] - dy / d * k]; }); };
    for (let j = -1; j < ny; j++) for (let i = -1; i < nx; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1), hv = hash(i + 0.7, j + 0.3);
      const pieces = hv > 0.6 ? [[a, b, c], [a, c, d]] : hv < 0.12 ? [[a, b, d], [b, c, d]] : [[a, b, c, d]];
      pieces.forEach((pts, k) => {
        const col = shade(L.floor[(i + j + k + 4) % 2], (hash(i * 3 + k, j) - 0.5) * 0.2);
        const s = shrink(pts, 2.4); g.fillStyle = col; poly(g, s); g.fill();
        g.fillStyle = 'rgba(255,230,200,0.06)'; poly(g, shrink(s, 5)); g.fill();
      });
    }
  },
  basket(g, w, L) { // 12: terracotta basketweave: pairs of tiles turning each block
    g.fillStyle = L.grout; g.fillRect(0, 0, w.W, w.H);
    const S = 25, gap = 2.6;
    for (let bj = 0; bj * 2 * S < w.H; bj++) for (let bi = 0; bi * 2 * S < w.W; bi++) {
      const x = bi * 2 * S, y = bj * 2 * S, across = (bi + bj) % 2;
      for (let k = 0; k < 2; k++) {
        const c = shade(L.floor[(bi + k) % 2], (hash(bi * 2 + k, bj) - 0.5) * 0.14);
        const [tx, ty, tw, th] = across ? [x, y + k * S, 2 * S, S] : [x + k * S, y, S, 2 * S];
        g.fillStyle = litGrad(g, tx, ty, tw, th, shade(c, 0.06), shade(c, -0.06)); rr(g, tx + gap / 2, ty + gap / 2, tw - gap, th - gap, 3); g.fill();
      }
    }
  },
};

// ---------------------------------------------------------------- obstacles: which prop stands for a pillar
// Small ones (r up to 29) are crates (two path cells square), barrels or braziers; bigger ones are rocks in the
// style's rock. The Sewers keep some of their pipes.
export function obstacleFor(p, w) {
  const L = lookOf(w), h = hash(Math.round(p.x), Math.round(p.y));
  if (p.r > 29) return L.rock;
  if (L.theme === 'warren') return h < 0.55 ? 'crate' : 'barrel';
  if (L.theme === 'sewers') return h < 0.45 ? 'pipe' : h < 0.8 ? 'barrel' : 'crate';
  return h < 0.6 ? 'brazier' : L.rock;
}
// How big each obstacle's art is drawn: [box in room units for its 220 file, scale with r?]
export const OBSTACLE_SIZE = { crate: 30, barrel: 30, brazier: 30 };
