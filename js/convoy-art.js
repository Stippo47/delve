// The wagon road's art (round 13, lane W): the ground (meadow, the worn road, the shaded verge, roots and undergrowth at
// the forest's foot), the canopy that draws OVER the units at the edge (so foes come out from under the trees), and the
// wagon with its ox team. Everything here is painted ONCE into cached canvases (render.js keeps the ground in its floor
// cache through w.paintGround; drawCanopy keeps two strips of its own); a frame only copies them.
// World axes: x runs up the road (up the screen in portrait), y across it. In portrait the light comes from the screen's
// top left = world (+x, -y); shadows fall to world (-x, +y).
import { INK, TAU, clamp } from './util.js';

// a fixed hash, so the caches come out the same every time
const hz = (a, b = 0) => { let h = Math.imul((a * 73856093) ^ (b * 19349663), 0x9E3779B1) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x85EBCA6B) >>> 0; return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };
const LX = 0.62, LY = -0.78; // the light, as a world direction (towards it)

// ---------------------------------------------------------------- the looks
// One per dungeon the road runs through (the underground ones become country above them: the Warren's hills, the
// Sewers' outfall, the graveyard over the Crypt...). edge: what lines the road (crown = round tree tops, pine, bare,
// mound = grassy hills, rock = boulders and crags, wall = a mossy brick embankment).
export const LOOKS = {
  wildwood: { edge: 'crown', ground: ['#93A65C', '#7F944C'], tuft: '#6E8A3C', flower: ['#F2E6A0', '#E8A0B8', '#FFFFFF'], road: ['#BFA472', '#A48A5C'],
    floor: '#3A4A24', crown: [['#2E5A2A', '#4C8236', '#86B850'], ['#36602A', '#5A8E38', '#9CC45A'], ['#2A5034', '#467A44', '#7EB066']], trunk: '#6B4A30', under: ['#3E6A2C', '#5E8E3A'] },
  warren: { edge: 'mound', ground: ['#A9AE6A', '#959A58'], tuft: '#7E8A44', flower: ['#F6E08A', '#FFFFFF'], road: ['#C2A878', '#A88E60'],
    floor: '#5E6A34', crown: [['#6E8A3C', '#90AA4C', '#C2D47A'], ['#7A8E40', '#9CB054', '#CCDA86']], trunk: '#5A4A34', under: ['#6A7E36', '#8AA04A'] },
  sewers: { edge: 'crown', ground: ['#7E8E6A', '#6E7E5C'], tuft: '#5E7A4A', flower: ['#C8E0A0'], road: ['#9A9488', '#7E786E'], // a fen of willows round the outfall
    floor: '#2E3A30', crown: [['#3A5244', '#5E7E5E', '#9CB884'], ['#40564A', '#668466', '#A8C090']], trunk: '#4A4038', under: ['#4E6A44', '#6E8E58'], water: '#4F7E72', puddles: 3 },
  crypt: { edge: 'crown', ground: ['#8A9478', '#78826A'], tuft: '#5E6E50', flower: ['#D8D0E8'], road: ['#ABA294', '#8E8678'],
    floor: '#2E3430', crown: [['#1E3A34', '#2E544A', '#4E7A66'], ['#243C3A', '#365A54', '#5A8478']], trunk: '#4A3E3A', under: ['#2E4A3E', '#46664E'], graves: true },
  frost: { edge: 'pine', ground: ['#DCE6EE', '#C8D4E0'], tuft: '#A8B8C8', flower: ['#FFFFFF'], road: ['#B4BCC6', '#9AA4B0'],
    floor: '#B8C6D4', crown: [['#1E4A44', '#2E6A5E', '#E8F2F8'], ['#24504A', '#367266', '#F2F8FC']], trunk: '#5A4638', under: ['#9AB0BE', '#C2D2DE'] },
  ember: { edge: 'crown', ground: ['#6A5A52', '#5A4C46'], tuft: '#4A3E3A', flower: ['#FF8A3D', '#FFC85A'], road: ['#9A8070', '#7E685A'], // a smouldering wood
    floor: '#2A2220', crown: [['#3A2A26', '#6A4436', '#E8783A'], ['#34282A', '#5E3E38', '#D86A3A']], trunk: '#2E2420', under: ['#4A3A34', '#6A5246'] },
  spire: { edge: 'rock', ground: ['#C8C2B0', '#B4AE9C'], tuft: '#9AA078', flower: ['#F6E6A8', '#C8B0F0'], road: ['#E2D8C0', '#C8BEA4'],
    floor: '#8A8474', crown: [['#8E8A82', '#B4AEA2', '#E6E0D2']], trunk: '#6E6458', under: ['#9AA078', '#B8BC90'] },
  dunes: { edge: 'mound', ground: ['#E2C68A', '#D2B478'], tuft: '#B8A060', flower: ['#E87A4A'], road: ['#C8A46A', '#B08E58'],
    floor: '#B8965A', crown: [['#C89E5A', '#DEB874', '#F4DCA0']], trunk: '#8A6A44', under: ['#A8A058', '#C4BC6A'], palms: true },
  foundry: { edge: 'rock', ground: ['#6A625C', '#5A524E'], tuft: '#4A4440', flower: ['#FF9A3A'], road: ['#8E8274', '#766A5E'],
    floor: '#3A3430', crown: [['#4E4642', '#7E706A', '#BCA898'], ['#5A443A', '#8A6450', '#C89470']], trunk: '#3A3230', under: ['#4E4842', '#6A625A'] },
};
export const lookOf = (theme) => LOOKS[theme] || LOOKS.wildwood;

// ---------------------------------------------------------------- the edge's layout
// The things that line the road, decided once per stretch from the world's size: three depths a side, the deepest
// first, so the front row overlaps the ones behind. Each: { x, y, r, row, side, k }.
export function edgeLayout(W, H, EDGE, look) {
  const out = [];
  const rows = look.edge === 'wall' ? [] : look.edge === 'mound' || look.edge === 'rock' ? [[-40, 60, 95, 120], [EDGE * 0.45, 70, 100, 110], [EDGE - 40, 46, 70, 70]]
    : [[-10, 70, 100, 110], [EDGE * 0.5, 62, 88, 92], [EDGE - 28, 44, 72, 62]];
  rows.forEach(([d, r0, r1, step], row) => {
    for (const side of [-1, 1]) {
      let i = 0;
      for (let x = -80 + hz(row, side) * step; x < W + 120; x += step * (0.7 + 0.6 * hz(row * 31 + i, side + 5)), i++) {
        const k = hz(x | 0, row * 7 + side + 11), j = hz(i, row + side * 3);
        let r = r0 + (r1 - r0) * k, dd = d + (j - 0.5) * (row === 2 ? 70 : 60);
        if (row === 2) {
          if (hz(i, side + 40) < 0.12) continue; // a gap in the front row: the shade and the undergrowth behind show
          if (hz(i, side + 50) < 0.16) { r *= 1.35; dd += 22; } // an old tree leaning out over the verge
          else if (j < 0.3) { r *= 0.78; dd -= 14; } // a young one set back
        }
        out.push({ x, y: side < 0 ? dd : H - dd, r, row, side, k, hue: hz(i, row * 13 + side + 7) });
      }
    }
  });
  return out;
}

// ---------------------------------------------------------------- the ground (into render.js's floor cache)
// g is in world units. mid: the road's line; half: the track's half-width; EDGE: where the canopy ends.
export function paintRoadGround(g, w, { EDGE, ROAD_HALF, look, trees }) {
  const W = w.W, H = w.H, mid = H / 2;
  // the meadow: two greens in broad soft bands, so it isn't flat
  g.fillStyle = look.ground[0]; g.fillRect(-60, -60, W + 120, H + 120);
  for (let i = 0; i < W * H / 26000; i++) {
    const x = hz(i, 1) * W, y = EDGE + hz(i, 2) * (H - 2 * EDGE), r = 50 + hz(i, 3) * 120;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, look.ground[1]); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.55; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalAlpha = 1;
  // the forest floor under the trees, and the shade the canopy throws on the verge
  for (const side of [-1, 1]) {
    const e = side < 0 ? EDGE : H - EDGE, y0 = side < 0 ? -60 : e + 30;
    g.fillStyle = look.floor; g.fillRect(-60, y0, W + 120, EDGE + 30);
    const fg = g.createLinearGradient(0, e - side * 30, 0, e + side * 40); fg.addColorStop(0, look.floor); fg.addColorStop(1, hexA(look.floor, 0));
    g.fillStyle = fg; g.fillRect(-60, Math.min(e - side * 30, e + side * 40), W + 120, 70);
    const sg = g.createLinearGradient(0, e - side * 30, 0, e + side * 130);
    sg.addColorStop(0, 'rgba(18,26,12,0.62)'); sg.addColorStop(0.35, 'rgba(18,26,12,0.30)'); sg.addColorStop(1, 'rgba(18,26,12,0)');
    g.fillStyle = sg; g.fillRect(-60, Math.min(e - side * 30, e + side * 130), W + 120, 160);
  }
  // the road worn into the ground: a ragged edge, a lighter middle, two ruts, a grassy strip down the middle
  const edgeAt = (x, s) => ROAD_HALF + 10 * Math.sin(x * 0.013 + s * 2) + 7 * Math.sin(x * 0.041 + s * 5) + 4 * Math.sin(x * 0.11 + s);
  const band = (ofs, s0, s1) => { g.beginPath(); for (let x = -60; x <= W + 60; x += 16) g.lineTo(x, mid - edgeAt(x, s0) * ofs); for (let x = W + 60; x >= -60; x -= 16) g.lineTo(x, mid + edgeAt(x, s1) * ofs); g.closePath(); };
  band(1.16, 1, 2); g.fillStyle = 'rgba(60,48,26,0.22)'; g.fill();
  band(1, 1, 2); const rg = g.createLinearGradient(0, mid - ROAD_HALF, 0, mid + ROAD_HALF); rg.addColorStop(0, look.road[1]); rg.addColorStop(0.5, look.road[0]); rg.addColorStop(1, look.road[1]); g.fillStyle = rg; g.fill();
  for (const dy of [-44, 44]) {
    g.beginPath(); for (let x = -60; x <= W + 60; x += 20) g.lineTo(x, mid + dy + 3 * Math.sin(x * 0.02 + dy)); g.strokeStyle = 'rgba(70,52,30,0.34)'; g.lineWidth = 16; g.lineCap = 'round'; g.stroke();
    g.strokeStyle = 'rgba(50,36,20,0.28)'; g.lineWidth = 4; g.stroke();
  }
  g.beginPath(); for (let x = -60; x <= W + 60; x += 20) g.lineTo(x, mid + 4 * Math.sin(x * 0.017)); g.strokeStyle = 'rgba(120,150,70,0.30)'; g.lineWidth = 22; g.stroke();
  // hoof marks between the ruts, stones and puddles along the track
  for (let x = 0; x < W; x += 34) { const k = hz(x, 9); g.fillStyle = 'rgba(70,52,30,0.22)'; g.beginPath(); g.ellipse(x, mid + (k - 0.5) * 50, 5, 3.5, 0, 0, TAU); g.fill(); }
  for (let x = 0; x < W; x += 19) {
    const k = hz(x, 4), s = k < 0.5 ? -1 : 1, y = mid + s * (edgeAt(x, s < 0 ? 1 : 2) - 6 + hz(x, 5) * 18);
    g.fillStyle = k < 0.25 ? look.tuft : 'rgba(110,96,72,0.55)'; g.beginPath(); g.ellipse(x, y, 3 + k * 5, 2.5 + k * 3, k * 3, 0, TAU); g.fill();
  }
  for (let x = 300; x < W; x += (420 + hz(x, 6) * 500) / (look.puddles || 1)) {
    const y = mid + (hz(x, 7) - 0.5) * 90, rx = 24 + hz(x, 8) * 26;
    g.fillStyle = 'rgba(60,46,30,0.35)'; g.beginPath(); g.ellipse(x, y, rx + 4, rx * 0.5 + 3, 0, 0, TAU); g.fill();
    g.fillStyle = look.water || '#7E9AA0'; g.beginPath(); g.ellipse(x, y, rx, rx * 0.5, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(x + rx * 0.2, y - rx * 0.15, rx * 0.45, rx * 0.12, 0, 0, TAU); g.fill();
  }
  // the meadow's grass: tufts drawn as little fans of blades, and flowers in small drifts
  g.lineCap = 'round';
  for (let i = 0; i < W * H / 2600; i++) {
    const x = hz(i, 21) * W, y = EDGE - 10 + hz(i, 22) * (H - 2 * EDGE + 20);
    if (Math.abs(y - mid) < ROAD_HALF + 6) continue;
    g.strokeStyle = look.tuft; g.lineWidth = 2.4;
    g.beginPath(); for (let b = -2; b <= 2; b++) { g.moveTo(x, y); g.lineTo(x + 7 + hz(i, b + 30) * 4, y + b * 3); } g.stroke();
  }
  for (let i = 0; i < W * H / 70000; i++) {
    const cx = hz(i, 41) * W, cy = EDGE + 40 + hz(i, 42) * (H - 2 * EDGE - 80); if (Math.abs(cy - mid) < ROAD_HALF + 20) continue;
    const col = look.flower[Math.floor(hz(i, 43) * look.flower.length)];
    for (let j = 0; j < 7; j++) { const x = cx + (hz(i, j + 50) - 0.5) * 60, y = cy + (hz(i, j + 60) - 0.5) * 60; g.fillStyle = 'rgba(40,40,20,0.25)'; g.beginPath(); g.arc(x - 0.8, y + 1, 3, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
  }
  if (look.graves) for (let x = 200; x < W; x += 160 + hz(x, 70) * 220) for (const s of [-1, 1]) { // the graveyard over the crypt: headstones on the verge
    const y = s < 0 ? EDGE + 40 + hz(x, 71) * 140 : H - EDGE - 40 - hz(x, 72) * 140;
    g.fillStyle = 'rgba(20,24,20,0.35)'; g.beginPath(); g.ellipse(x - 6, y + 8, 14, 9, 0, 0, TAU); g.fill();
    inked(g, () => { g.beginPath(); g.moveTo(x - 9, y - 12); g.lineTo(x + 6, y - 12); g.arc(x + 6, y, 12, -Math.PI / 2, Math.PI / 2); g.lineTo(x - 9, y + 12); g.closePath(); }, lin(g, x - 9, y, x + 18, y, '#B8B6AE', '#8E8C86'), 2);
  }
  // roots and undergrowth at the forest's foot: what peeks out from under the front row of trees
  for (const t of trees) {
    if (t.row !== 2) continue;
    const s = t.side, ey = s < 0 ? EDGE : H - EDGE;
    if (look.edge === 'crown' || look.edge === 'pine' || look.edge === 'bare') {
      for (let j = 0; j < 3; j++) { // roots
        const a = (hz(t.x | 0, j) - 0.5) * 1.6, L = 30 + hz(t.x | 0, j + 9) * 40, x0 = t.x + (j - 1) * 16, y0 = ey - s * 20;
        const x1 = x0 + Math.sin(a) * L, y1 = y0 + s * Math.cos(a) * L;
        g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 11; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 8, (y0 + y1) / 2, x1, y1); g.stroke();
        g.strokeStyle = look.trunk; g.lineWidth = 6; g.stroke();
      }
    }
    // a bush or fern clump on the verge in front of every other tree
    if (hz(t.x | 0, 77) < 0.65) bush(g, t.x + (hz(t.x | 0, 78) - 0.5) * 60, ey + s * (8 + hz(t.x | 0, 79) * 22), 16 + hz(t.x | 0, 80) * 12, look.under);
  }
  if (look.edge === 'wall') paintWalls(g, W, H, EDGE, look);
  // the gate and the camp past it are drawn by convoy.js's paintRoad after this
}
function bush(g, x, y, r, [dark, lite]) {
  const lobes = [[0, 0, 1], [-0.6, 0.35, 0.7], [0.6, 0.3, 0.72], [0.1, -0.55, 0.65]];
  g.fillStyle = 'rgba(20,28,12,0.35)'; g.beginPath(); g.ellipse(x - 5, y + 6, r * 1.3, r * 0.9, 0, 0, TAU); g.fill();
  g.fillStyle = INK; g.beginPath(); for (const [dx, dy, k] of lobes) { g.moveTo(x + dx * r + k * r + 3, y + dy * r); g.arc(x + dx * r, y + dy * r, k * r + 3, 0, TAU); } g.fill();
  const gr = g.createRadialGradient(x + r * 0.3, y - r * 0.4, 1, x, y, r * 1.4); gr.addColorStop(0, lite); gr.addColorStop(1, dark);
  g.fillStyle = gr; g.beginPath(); for (const [dx, dy, k] of lobes) { g.moveTo(x + dx * r + k * r, y + dy * r); g.arc(x + dx * r, y + dy * r, k * r, 0, TAU); } g.fill();
}
function paintWalls(g, W, H, EDGE, look) { // the Sewers' outfall: a brick embankment with culvert mouths
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -60 : H - EDGE + 6, y1 = s < 0 ? EDGE - 6 : H + 60;
    g.fillStyle = INK; g.fillRect(-60, y0 - 5, W + 120, y1 - y0 + 10);
    g.fillStyle = lin(g, 0, y0, 0, y1, look.crown[0][1], look.crown[0][0]); g.fillRect(-60, y0, W + 120, y1 - y0);
    g.strokeStyle = 'rgba(30,34,28,0.35)'; g.lineWidth = 2;
    for (let y = y0 + 22; y < y1; y += 22) { g.beginPath(); g.moveTo(-60, y); g.lineTo(W + 60, y); g.stroke(); for (let x = ((y / 22) % 2) * 22 - 60; x < W + 60; x += 44) { g.beginPath(); g.moveTo(x, y - 22); g.lineTo(x, y); g.stroke(); } }
  }
}

// ---------------------------------------------------------------- the canopy (over the units)
// Two strips, one a side, each its own cached canvas at the screen's scale. Tree tops in three rows, deepest first;
// each crown: a drop shadow on what's below, a thick ink outline round its lobes, a dark-to-light gradient towards the
// light, a few lit lobes and a rim of shade. The front row reaches a little past EDGE, over the verge.
let cache = null;
export function drawCanopy(ctx, w, view, opt) {
  const { EDGE, look, trees } = opt, W = w.W, H = w.H, depth = EDGE + 130, pad = 60;
  let s = view.base * view.dpr; // (not the zoom: a pinch must not repaint it)
  if ((W + pad * 2) * depth * s * s > 3.2e6) s = Math.sqrt(3.2e6 / ((W + pad * 2) * depth));
  s = Math.round(s * 20) / 20;
  const key = `${W}x${H}:${s}:${opt.key}`;
  if (!cache || cache.key !== key || cache.w !== w) {
    const strips = [-1, 1].map((side) => {
      const c = document.createElement('canvas'); c.width = Math.ceil((W + pad * 2) * s); c.height = Math.ceil(depth * s);
      const g = c.getContext('2d'); g.scale(s, s);
      const y0 = side < 0 ? -40 : H - depth + 40; g.translate(pad, -y0);
      paintEdge(g, W, H, EDGE, look, trees.filter((t) => t.side === side), side);
      return { c, y0 };
    });
    cache = { key, w, strips, s, pad };
  }
  for (const st of cache.strips) ctx.drawImage(st.c, -cache.pad, st.y0, st.c.width / cache.s, st.c.height / cache.s);
}
export function paintEdge(g, W, H, EDGE, look, trees, side) {
  if (look.edge === 'wall') return paintWallTop(g, W, H, EDGE, look, side);
  const ey = side < 0 ? EDGE : H - EDGE;
  // the deep wood: a dark mass behind every crown, so no gap shows the ground
  g.fillStyle = shade(look.floor, 0.55); g.fillRect(-60, side < 0 ? -60 : ey + 40, W + 120, EDGE + 20);
  // back rows first; in the front row, the ones reaching furthest out over the verge last (they lie on top)
  const out = (t) => (side < 0 ? t.y + t.r : H - t.y + t.r);
  const order = trees.slice().sort((a, b) => a.row - b.row || (a.row === 2 ? out(a) - out(b) : 0));
  for (const t of order) {
    // the shade a crown throws down-screen: onto the row behind, and from the front row onto the verge and whoever stands there
    g.fillStyle = `rgba(10,16,8,${t.row === 2 ? 0.30 : 0.42})`; g.beginPath(); g.arc(t.x - LX * 20, t.y - LY * 20, t.r * 1.04, 0, TAU); g.fill();
    crown(g, t, look);
  }
}
// A round crown from above, drawn like the heroes: one silhouette with a thick ink line, scalloped by the clumps of leaves
// round its rim; inside, the clumps facing the light lit (a soft gradient each, a crease of shade on their far side), the
// side away from the light in shadow. Mounds and rocks use the same build with fewer, flatter clumps.
function crown(g, t, look) {
  const pal = look.crown[Math.floor(t.k * look.crown.length) % look.crown.length];
  const dim = (t.row === 0 ? 0.6 : t.row === 1 ? 0.8 : 1) * (0.92 + 0.16 * (t.hue || 0.5));
  const { x, y, r } = t;
  if (look.edge === 'pine') return pine(g, x, y, r, pal, dim, t.k);
  if (look.edge === 'bare') return bare(g, x, y, r, pal, t.k);
  const tree = look.edge === 'crown', rock = look.edge === 'rock';
  const n = tree ? 8 + Math.floor(t.k * 3) : rock ? 5 : 5;
  const body = tree ? 0.62 : 0.7, lobes = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + t.k * 6, b = (tree ? 0.33 : 0.36) + 0.1 * hz(i, (x * 3) | 0);
    const d = (tree ? 0.66 : 0.6) + 0.06 * hz(i + 9, x | 0);
    lobes.push([Math.cos(a) * d, Math.sin(a) * d, b]);
  }
  const shape = (grow) => {
    g.beginPath();
    if (rock) { poly(g, x, y, r * body + grow, 7, t.k * 4); for (const [dx, dy, b] of lobes) poly(g, x + dx * r, y + dy * r, b * r + grow, 6, t.k + dx); return; }
    g.moveTo(x + r * body + grow, y); g.arc(x, y, r * body + grow, 0, TAU);
    for (const [dx, dy, b] of lobes) { g.moveTo(x + dx * r + b * r + grow, y + dy * r); g.arc(x + dx * r, y + dy * r, b * r + grow, 0, TAU); }
  };
  g.fillStyle = INK; shape(4.8); g.fill();
  const gr = g.createRadialGradient(x + LX * r * 0.45, y + LY * r * 0.45, r * 0.05, x, y, r * 1.1);
  gr.addColorStop(0, shade(pal[1], dim)); gr.addColorStop(1, shade(pal[0], dim));
  g.fillStyle = gr; shape(0); g.fill();
  g.save(); shape(0); g.clip();
  // the shadow side: a broad soft dark crescent away from the light
  g.fillStyle = 'rgba(6,12,4,0.30)'; g.beginPath(); g.arc(x - LX * r * 0.35, y - LY * r * 0.35, r * 0.95, 0, TAU); g.arc(x + LX * r * 0.12, y + LY * r * 0.12, r * 0.9, 0, TAU, true); g.fill('evenodd');
  // the clumps: those round the rim that face the light, then two inner ones; each lit towards the light, creased on its far side
  const clumps = lobes.filter(([dx, dy]) => dx * LX + dy * LY > -0.25).map(([dx, dy, b]) => [dx * 0.9, dy * 0.9, b * 0.82]);
  clumps.push([LX * 0.18 - LY * 0.2, LY * 0.18 + LX * 0.2, 0.36], [LX * 0.3 + LY * 0.18, LY * 0.3 - LX * 0.18, 0.3]);
  for (const [dx, dy, b] of clumps) {
    const cx = x + dx * r, cy = y + dy * r, R = b * r;
    g.strokeStyle = 'rgba(6,12,4,0.32)'; g.lineWidth = Math.max(2, r * 0.045); g.beginPath(); g.arc(cx - LX * R * 0.12, cy - LY * R * 0.12, R, Math.atan2(-LY, -LX) - 1.1, Math.atan2(-LY, -LX) + 1.1); g.stroke();
    const lg = g.createRadialGradient(cx + LX * R * 0.45, cy + LY * R * 0.45, 0, cx, cy, R);
    lg.addColorStop(0, shade(pal[2], dim)); lg.addColorStop(0.55, hexA(shade(pal[1], dim), 0.75)); lg.addColorStop(1, hexA(shade(pal[1], dim), 0));
    g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  }
  g.restore();
  if (look.palms && t.row === 2 && t.k < 0.3) pine(g, x, y, r * 0.55, ['#2E5A2A', '#4C8236', '#86B850'], 1, t.k);
}
function pine(g, x, y, r, pal, dim, k) { // a pine from above: tiers of spiky stars, snow on the lit side if the look is snowy
  for (let tier = 0; tier < 3; tier++) {
    const R = r * (1 - tier * 0.28), n = 9 - tier, rot = k * 5 + tier * 0.4;
    const star = (grow) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + rot, rr = (i % 2 ? R * 0.62 : R) + grow; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
    g.fillStyle = INK; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 7; star(0); g.fill(); g.stroke();
    const gr = g.createRadialGradient(x + LX * R * 0.4, y + LY * R * 0.4, 0, x, y, R);
    gr.addColorStop(0, shade(pal[tier === 2 ? 2 : 1], dim)); gr.addColorStop(1, shade(pal[0], dim));
    g.fillStyle = gr; star(0); g.fill();
  }
}
function bare(g, x, y, r, pal, k) { // a burnt tree: a dark trunk top and branches, embers glowing in the forks
  g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + k * 4, L = r * (0.6 + 0.4 * hz(i, x | 0));
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
    g.strokeStyle = INK; g.lineWidth = 15; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.4) * L * 0.6, y + Math.sin(a + 0.4) * L * 0.6, ex, ey); g.stroke();
    g.strokeStyle = pal[1]; g.lineWidth = 8; g.stroke();
    g.fillStyle = pal[2]; g.globalAlpha = 0.8; g.beginPath(); g.arc(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5, 3, 0, TAU); g.fill(); g.globalAlpha = 1;
  }
  inked(g, () => { g.beginPath(); g.arc(x, y, r * 0.28, 0, TAU); }, pal[0], 2.4);
}
function paintWallTop(g, W, H, EDGE, look, side) { // the embankment's coping and the culvert mouths, over whoever is at its foot
  const ey = side < 0 ? EDGE : H - EDGE;
  for (let x = 120; x < W; x += 520) {
    const cy = ey - side * 6;
    inked(g, () => { g.beginPath(); g.ellipse(x, cy, 62, 30, 0, 0, TAU); }, '#2A2E2A', 2.4);
    g.fillStyle = look.water; g.beginPath(); g.ellipse(x, cy + side * 10, 44, 16, 0, 0, TAU); g.fill();
  }
  g.fillStyle = INK; g.fillRect(-60, ey - side * 10 - 9, W + 120, 18);
  g.fillStyle = look.crown[0][2]; g.fillRect(-60, ey - side * 10 - 6, W + 120, 12);
  for (let x = -40; x < W + 60; x += 90) { const k = hz(x, 3); if (k < 0.5) bush(g, x, ey - side * 4, 12 + k * 14, look.under); }
}

// ---------------------------------------------------------------- the wagon
// Top-down, facing +x. The bed and its hooped cover between four big wheels, the driver on his bench, crates lashed
// at the tail, the shaft forward to a yoke and two oxen side by side. About 330 long and 130 across: the biggest thing
// on the road. (0, 0) is the middle of the bed, the unit's centre.
export function paintWagon(ctx, { roll = 0, hurt = 0, flash = false } = {}) {
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
  const ink = (fn, fill, lw = 2.4) => { ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = lw * 2; ctx.lineJoin = 'round'; fn(); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.fillStyle = fill; fn(); ctx.fill(); };
  const L = (x0, y0, x1, y1, a, b) => { const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  ctx.save();
  // one soft shadow under the whole team
  ctx.fillStyle = 'rgba(30,26,14,0.30)'; ctx.beginPath(); ctx.ellipse(40, 8, 180, 70, 0, 0, TAU); ctx.fill();
  // the shaft and the yoke
  ink(() => rr(60, -6, 92, 12, 5), '#8A6A44', 2);
  ink(() => rr(146, -52, 14, 104, 6), '#7A5A3C', 2);
  // the oxen, side by side, stepping in turn
  const step = Math.sin(roll * 0.09) * 6;
  for (const [oy, ph] of [[-28, 1], [28, -1]]) {
    for (const [lx, ly, p] of [[142, -13, 1], [142, 13, -1], [196, -13, -1], [196, 13, 1]]) ink(() => { ctx.beginPath(); ctx.ellipse(lx + step * p * ph, oy + ly, 9, 6, 0, 0, TAU); }, '#3E2C20', 1.6);
    ink(() => { ctx.beginPath(); ctx.ellipse(170, oy, 40, 21, 0, 0, TAU); }, L(170, oy - 20, 170, oy + 22, '#A88458', '#7A5A3C'));
    ctx.fillStyle = 'rgba(255,240,210,0.22)'; ctx.beginPath(); ctx.ellipse(176, oy - 8, 26, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5E442E'; ctx.beginPath(); ctx.ellipse(160, oy + 4, 9, 7, 0.4, 0, TAU); ctx.fill(); // a patch
    ink(() => { ctx.beginPath(); ctx.ellipse(214, oy, 15, 13, 0, 0, TAU); }, L(214, oy - 12, 214, oy + 12, '#9A7650', '#6E5034'));
    ctx.fillStyle = '#E8C8B0'; ctx.beginPath(); ctx.ellipse(224, oy, 6, 8, 0, 0, TAU); ctx.fill(); // the muzzle
    for (const s of [-1, 1]) ink(() => { ctx.beginPath(); ctx.moveTo(214, oy + s * 8); ctx.quadraticCurveTo(220, oy + s * 24, 232, oy + s * 21); ctx.lineTo(230, oy + s * 17); ctx.quadraticCurveTo(221, oy + s * 17, 219, oy + s * 6); ctx.closePath(); }, '#EFE4CC', 1.3);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(126, oy + ph * 6); ctx.quadraticCurveTo(118, oy + ph * 14 + Math.sin(roll * 0.05 + oy) * 4, 112, oy + ph * 4); ctx.stroke(); // the tail
  }
  // the wheels: big, at the four corners, spokes going round
  for (const wx of [-58, 44]) for (const s of [-1, 1]) {
    ink(() => rr(wx - 26, s * 60 - 8, 52, 16, 6), '#3A2C24', 2);
    ctx.fillStyle = '#8A7058'; for (let k = 0; k < 4; k++) { const p = ((roll * 1.1 + k * 13) % 52) - 26; if (Math.abs(p) < 22) ctx.fillRect(wx + p - 1.5, s * 60 - 6, 3, 12); }
    ink(() => { ctx.beginPath(); ctx.arc(wx, s * 60, 5, 0, TAU); }, '#B8955A', 1.2);
  }
  // the bed
  ink(() => rr(-98, -54, 176, 108, 10), L(0, -54, 0, 54, '#94683E', '#6A4428'));
  ctx.strokeStyle = 'rgba(43,30,20,0.35)'; ctx.lineWidth = 2; for (const y of [-27, 0, 27]) { ctx.beginPath(); ctx.moveTo(-96, y); ctx.lineTo(76, y); ctx.stroke(); }
  // crates and a barrel lashed at the tail
  ink(() => rr(-122, -44, 30, 34, 4), L(0, -44, 0, -10, '#C09060', '#8E6438'), 2);
  ink(() => rr(-120, 6, 28, 32, 4), L(0, 6, 0, 38, '#B4854E', '#86603A'), 2);
  ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-122, -44); ctx.lineTo(-92, -10); ctx.moveTo(-92, -44); ctx.lineTo(-122, -10); ctx.stroke();
  // the cover on its hoops: cream canvas, shaded away from the light, red bands, the hoops showing as ribs
  ink(() => rr(-86, -48, 140, 96, 34), L(0, -48, 0, 48, '#FFF6E2', '#CDBB98'), 2.4);
  ctx.save(); rr(-86, -48, 140, 96, 34); ctx.clip();
  ctx.fillStyle = L(0, -48, 0, 48, '#D2574A', '#9E3228'); ctx.fillRect(-48, -48, 16, 96); ctx.fillRect(6, -48, 16, 96);
  ctx.strokeStyle = 'rgba(70,50,40,0.28)'; ctx.lineWidth = 3; for (const x of [-66, -40, -14, 12, 38]) { ctx.beginPath(); ctx.moveTo(x, -48); ctx.lineTo(x, 48); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-12, -26, 62, 10, 0, 0, TAU); ctx.fill();
  if (hurt > 0.35) { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, -30); ctx.lineTo(-36, -14); ctx.lineTo(-42, 2); ctx.moveTo(14, 16); ctx.lineTo(28, 30); ctx.stroke(); }
  if (hurt > 0.65) { ctx.fillStyle = 'rgba(43,34,48,0.75)'; ctx.beginPath(); ctx.ellipse(-20, 24, 16, 9, 0.4, 0, TAU); ctx.fill(); }
  ctx.restore();
  // the driver's bench and the driver (a hat from above), the reins to the yoke
  ink(() => rr(58, -36, 16, 72, 4), '#9A6B40', 1.8);
  ink(() => { ctx.beginPath(); ctx.arc(68, -12, 13, 0, TAU); }, L(68, -24, 68, 2, '#8E7A5A', '#5E4E38'), 1.8);
  ctx.fillStyle = '#6A563C'; ctx.beginPath(); ctx.arc(68, -12, 7, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3A2A1C'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(76, -10); ctx.lineTo(150, -28); ctx.moveTo(76, -8); ctx.lineTo(150, 28); ctx.stroke();
  if (hurt > 0.65) { ctx.fillStyle = '#3A2C24'; ctx.fillRect(-96, 40, 40, 10); }
  if (flash) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#FFFFFF'; rr(-98, -54, 176, 108, 10); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}

// ---------------------------------------------------------------- bits
function inked(g, fn, fill, lw = 2.4) { g.save(); g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = lw * 2; g.lineJoin = 'round'; fn(); g.fill(); g.stroke(); g.restore(); g.fillStyle = fill; fn(); g.fill(); }
function lin(g, x0, y0, x1, y1, a, b) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }
function poly(g, x, y, r, n, k) { for (let i = 0; i <= n; i++) { const a = i / n * TAU + k, rr = r * (0.82 + 0.18 * hz(i, (k * 100) | 0)); i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
function shade(hex, k) { if (k === 1) return hex; const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(clamp(v * k, 0, 255)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
function hexA(c, a) { if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; } return c.replace('rgb(', 'rgba(').replace(')', `,${a})`); }
