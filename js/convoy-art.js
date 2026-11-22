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
// Sewers' outfall fen, the graveyard over the Crypt...). kinds: what lines the road and how often (broad = big
// round-topped trees, round = smaller paler ones, pine, dead = bare branches, charred = burnt crowns, mound = grassy
// or sandy hills, palm, crag = faceted rock). crowns: each kind's three values (shadow, body, light).
export const LOOKS = {
  wildwood: { kinds: { broad: 0.5, round: 0.32, pine: 0.1, dead: 0.08 }, fallen: true, roots: true,
    ground: ['#8FA35A', '#A3B76A', '#7B8F4A'], tuft: '#6E8A3C', flower: ['#F2E6A0', '#E8A0B8', '#FFFFFF'], road: ['#BFA472', '#A48A5C'], floor: '#2E3C1E',
    crowns: { broad: [['#2C5528', '#4A7E34', '#8CBB52'], ['#2A5030', '#467A3E', '#82B45E']], round: [['#466E2A', '#6E9A3A', '#B4D068']], pine: [['#1C4036', '#2C6050', '#5E9A70']], dead: [['#4A3626', '#6E523A', '#9A7A58']] },
    trunk: ['#5A3E28', '#8A6440'], under: ['#3E6A2C', '#6A9A40'], rock: ['#5E5A56', '#8E8984', '#C4BEB4'], cap: '#6E8E3C' },
  warren: { kinds: { mound: 0.6, round: 0.4 }, burrows: true,
    ground: ['#A9AE6A', '#BCC078', '#959A58'], tuft: '#7E8A44', flower: ['#F6E08A', '#FFFFFF'], road: ['#C2A878', '#A88E60'], floor: '#4E5A2C',
    crowns: { mound: [['#6A7E36', '#8EA64A', '#C6D47E']], round: [['#4E7230', '#729A40', '#B2CE6A']] },
    trunk: ['#5A4A34', '#7A6648'], under: ['#6A7E36', '#94AA50'], rock: ['#6A6458', '#968E80', '#C8C0AE'], cap: '#8EA64A' },
  sewers: { kinds: { broad: 0.6, round: 0.3, dead: 0.1 }, puddles: 3, roots: true, fallen: true, // a fen of willows round the outfall
    ground: ['#7E8E6A', '#8E9E76', '#6A7A58'], tuft: '#5E7A4A', flower: ['#C8E0A0'], road: ['#9A9488', '#7E786E'], floor: '#24302A',
    crowns: { broad: [['#34503E', '#5A7E5A', '#9CBA84']], round: [['#46664A', '#6E906A', '#AECA96']], dead: [['#3E3630', '#5E544A', '#8A7E70']] },
    trunk: ['#4A4038', '#6E6254'], under: ['#4E6A44', '#76985E'], rock: ['#56584E', '#82847A', '#B2B4A8'], cap: '#5E7E4A', water: '#4F7E72' },
  crypt: { kinds: { broad: 0.45, pine: 0.35, dead: 0.2 }, graves: true, roots: true,
    ground: ['#8A9478', '#98A286', '#76806A'], tuft: '#5E6E50', flower: ['#D8D0E8'], road: ['#ABA294', '#8E8678'], floor: '#1E2624',
    crowns: { broad: [['#1C3632', '#2C5048', '#4E7A68']], pine: [['#183430', '#28504A', '#4A7A6C']], dead: [['#3A3236', '#5A5056', '#8A8088']] },
    trunk: ['#3E3436', '#625658'], under: ['#2E4A3E', '#4E6E56'], rock: ['#5A5A62', '#8A8A94', '#BCBCC6'], cap: '#4E6E56' },
  frost: { kinds: { pine: 0.82, dead: 0.18 }, snow: true, shade: '#3A5068', edge: [['#2A6458', '#DCE8F2', '#FFFFFF'], ['#306A5E', '#CFDFEC', '#F6FAFE']], // (edge: the tree line's values when they aren't a kind's: snow on dark firs)
    ground: ['#DCE6EE', '#EEF4F8', '#C4D2DE'], tuft: '#A8B8C8', flower: [], road: ['#B4BCC6', '#9AA4B0'], floor: '#9AAABA',
    crowns: { pine: [['#173E3A', '#2A6458', '#4E8A78'], ['#1C4440', '#306A5E', '#56927E']], dead: [['#4A3E38', '#6E5E54', '#A09080']] },
    trunk: ['#4A3A30', '#6E5848'], under: ['#9AB0BE', '#D6E2EC'], rock: ['#5E6A78', '#8E9AA8', '#C4CED8'], cap: '#F4F8FC' },
  ember: { kinds: { charred: 0.55, dead: 0.45 }, embers: true, // ash and embers: a burnt wood still smouldering
    ground: ['#6E6A66', '#827C76', '#4E4A48'], tuft: '#4A4644', flower: [], road: ['#86827E', '#6A6662'], floor: '#1C1818',
    crowns: { charred: [['#262222', '#423C3A', '#6E6662']], dead: [['#1E1A1A', '#3A3230', '#5E5450']] },
    trunk: ['#1E1A1A', '#3A3230'], under: ['#3A3634', '#5A5450'], rock: ['#3E3A38', '#625C58', '#8E8680'], cap: '#4A4644', glow: '#FF7A2E' },
  spire: { kinds: { crag: 0.8, pine: 0.2 }, shade: '#4A4638',
    ground: ['#C8C2B0', '#D8D2C0', '#B4AE9C'], tuft: '#9AA078', flower: ['#F6E6A8', '#C8B0F0'], road: ['#E2D8C0', '#C8BEA4'], floor: '#6E6A5E',
    crowns: { crag: [['#8A8478', '#B2ACA0', '#E8E2D4']], pine: [['#2A4A3A', '#3E6A50', '#6A9A74']] },
    trunk: ['#6E6458', '#8E8476'], under: ['#9AA078', '#BCC092'], rock: ['#8A8478', '#B2ACA0', '#E8E2D4'], cap: '#E8E2D4' },
  dunes: { kinds: { mound: 0.72, palm: 0.28 }, shade: '#6A5030',
    ground: ['#E2C68A', '#EED6A0', '#D2B478'], tuft: '#B8A060', flower: ['#E87A4A'], road: ['#C8A46A', '#B08E58'], floor: '#A88A52',
    crowns: { mound: [['#C29858', '#DEB874', '#F6E0A8']], palm: [['#2E5A2A', '#4C8236', '#8CBB52']] },
    trunk: ['#8A6A44', '#AE8A5C'], under: ['#A8A058', '#C8C070'], rock: ['#A07850', '#C49A6A', '#E8C894'], cap: '#F2DCA6' },
  foundry: { kinds: { crag: 0.75, dead: 0.25 }, embers: true,
    ground: ['#6A625C', '#7A726A', '#56504A'], tuft: '#4A4440', flower: [], road: ['#8E8274', '#766A5E'], floor: '#2A2624',
    crowns: { crag: [['#4A3E38', '#76645A', '#A8907C'], ['#3E3A38', '#625A56', '#948A82']], dead: [['#2A2420', '#4A3E36', '#6E6054']] },
    trunk: ['#2E2824', '#4A403A'], under: ['#4E4842', '#6A625A'], rock: ['#4A3E38', '#76645A', '#A8907C'], cap: '#8A5A3A', glow: '#FF8A3A' },
};
export const lookOf = (theme) => LOOKS[theme] || LOOKS.wildwood;
const pickKind = (look, k) => { let a = 0; const e = Object.entries(look.kinds), tot = e.reduce((s, [, v]) => s + v, 0); for (const [n, v] of e) { a += v / tot; if (k < a) return n; } return e[e.length - 1][0]; };

// ---------------------------------------------------------------- the ground (into render.js's floor cache)
// g is in world units. Quiet (round 14, the designer: "not a fan of the grass texture. Remove the dark green tufts of
// grass. Don't like the puddles"): broad soft patches of lighter and darker ground, flowers in a few small drifts, the
// road worn in, and the wood's own floor and its shade where the tree line stands over it. No tufts, no puddles, and
// nothing fussy at the trees' foot (round 13's bushes and fallen trunks went with its tree line).
export function paintRoadGround(g, w, { EDGE, ROAD_HALF, look }) {
  const W = w.W, H = w.H, mid = H / 2;
  g.fillStyle = look.ground[0]; g.fillRect(-60, -60, W + 120, H + 120);
  for (let i = 0; i < W * H / 60000; i++) { // big soft patches, lighter and darker
    const x = hz(i, 1) * W, y = EDGE + hz(i, 2) * (H - 2 * EDGE), r = 150 + hz(i, 3) * 200, c = hz(i, 4) < 0.5 ? look.ground[1] : look.ground[2];
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hexA(c, 0.55)); gr.addColorStop(0.6, hexA(c, 0.25)); gr.addColorStop(1, hexA(c, 0));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  if (look.embers) emberGround(g, W, H, EDGE, mid, ROAD_HALF, look);
  // the wood's floor (the tree line covers it), and its shade thinning out onto the verge
  const sh = look.shade || '#0E140A';
  for (const side of [-1, 1]) {
    const e = side < 0 ? EDGE : H - EDGE;
    g.fillStyle = look.floor; if (side < 0) g.fillRect(-60, -60, W + 120, e - 40 + 60); else g.fillRect(-60, e + 40, W + 120, EDGE + 20);
    const sg = g.createLinearGradient(0, e + side * 42, 0, e - side * 130); // (side -1: the wood is at the low y's, the open ground past e)
    sg.addColorStop(0, look.floor); sg.addColorStop(0.3, hexA(sh, 0.36)); sg.addColorStop(0.6, hexA(sh, 0.12)); sg.addColorStop(1, hexA(sh, 0));
    g.fillStyle = sg; g.fillRect(-60, Math.min(e + side * 42, e - side * 130), W + 120, 172);
  }
  // the road worn into the ground: a ragged edge, a lighter middle, two ruts, a grassy strip down the middle
  const edgeAt = (x, s) => ROAD_HALF + 10 * Math.sin(x * 0.013 + s * 2) + 7 * Math.sin(x * 0.041 + s * 5) + 4 * Math.sin(x * 0.11 + s);
  const band = (ofs, s0, s1) => { g.beginPath(); for (let x = -60; x <= W + 60; x += 16) g.lineTo(x, mid - edgeAt(x, s0) * ofs); for (let x = W + 60; x >= -60; x -= 16) g.lineTo(x, mid + edgeAt(x, s1) * ofs); g.closePath(); };
  band(1.16, 1, 2); g.fillStyle = 'rgba(60,48,26,0.22)'; g.fill();
  band(1, 1, 2); const rg = g.createLinearGradient(0, mid - ROAD_HALF, 0, mid + ROAD_HALF); rg.addColorStop(0, look.road[1]); rg.addColorStop(0.5, look.road[0]); rg.addColorStop(1, look.road[1]); g.fillStyle = rg; g.fill();
  g.lineCap = 'round';
  for (const dy of [-44, 44]) {
    g.beginPath(); for (let x = -60; x <= W + 60; x += 20) g.lineTo(x, mid + dy + 3 * Math.sin(x * 0.02 + dy)); g.strokeStyle = 'rgba(70,52,30,0.30)'; g.lineWidth = 16; g.stroke();
    g.strokeStyle = 'rgba(50,36,20,0.24)'; g.lineWidth = 4; g.stroke();
  }
  if (!look.snow && !look.embers) { g.beginPath(); for (let x = -60; x <= W + 60; x += 20) g.lineTo(x, mid + 4 * Math.sin(x * 0.017)); g.strokeStyle = hexA(look.tuft, 0.35); g.lineWidth = 22; g.stroke(); }
  // flowers in small drifts
  if (look.flower.length) for (let i = 0; i < W * H / 420000; i++) {
    const cx = hz(i, 41) * W, cy = EDGE + 110 + hz(i, 42) * (H - 2 * EDGE - 220); if (Math.abs(cy - mid) < ROAD_HALF + 30) continue;
    const col = look.flower[Math.floor(hz(i, 43) * look.flower.length)];
    for (let j = 0; j < 6; j++) { const x = cx + (hz(i, j + 50) - 0.5) * 70, y = cy + (hz(i, j + 60) - 0.5) * 70; g.fillStyle = 'rgba(40,40,20,0.25)'; g.beginPath(); g.arc(x - 1.4, y + 2, 6.4, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 5.6, 0, TAU); g.fill(); g.fillStyle = '#F6C94A'; g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill(); }
  }
  if (look.graves) for (let x = 200; x < W; x += 160 + hz(x, 70) * 220) for (const s of [-1, 1]) { // the graveyard over the crypt: headstones on the verge
    const y = s < 0 ? EDGE + 110 + hz(x, 71) * 160 : H - EDGE - 110 - hz(x, 72) * 160;
    g.fillStyle = 'rgba(20,24,20,0.35)'; g.beginPath(); g.ellipse(x - 8, y + 10, 18, 12, 0, 0, TAU); g.fill();
    inked(g, () => { g.beginPath(); g.moveTo(x - 12, y - 16); g.lineTo(x + 8, y - 16); g.arc(x + 8, y, 16, -Math.PI / 2, Math.PI / 2); g.lineTo(x - 12, y + 16); g.closePath(); }, lin(g, x - 12, y, x + 24, y, '#C2C0B8', '#8E8C86'), 2.2);
  }
}
// Ash and embers: scorched patches and glowing coals scattered over the grey (painted once, like the rest).
function emberGround(g, W, H, EDGE, mid, half, look) {
  for (let i = 0; i < W * H / 140000; i++) {
    const x = hz(i, 201) * W, y = EDGE + hz(i, 202) * (H - 2 * EDGE), r = 70 + hz(i, 203) * 110;
    if (Math.abs(y - mid) < half + 20) continue;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(20,16,16,0.55)'); gr.addColorStop(1, 'rgba(20,16,16,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    // coals smouldering in the scorch
    for (let j = 0; j < 6; j++) { const cx = x + (hz(i, j + 30) - 0.5) * r, cy = y + (hz(i, j + 40) - 0.5) * r; const cg = g.createRadialGradient(cx, cy, 0, cx, cy, 9); cg.addColorStop(0, 'rgba(255,190,110,0.9)'); cg.addColorStop(0.4, hexA(look.glow, 0.5)); cg.addColorStop(1, hexA(look.glow, 0)); g.fillStyle = cg; g.fillRect(cx - 9, cy - 9, 18, 18); }
    g.restore();
  }
}
// A rock on the open ground, faceted: an irregular outline, side facets shaded by how they face the light, a lit top
// facet, a cast shadow down-screen; moss, snow or sand on top by the look.
export function paintRock(g, x, y, r, look, seed = 0) {
  const n = 7, out = [], top = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU + hz(seed, 3) * 2, rr = r * (0.82 + 0.3 * hz(seed, i)); out.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.9]); }
  for (const [px, py] of out) top.push([x + (px - x) * 0.5 + LX * r * 0.2, y + (py - y) * 0.5 + LY * r * 0.2]);
  const [dk, md, lt] = look.rock;
  g.fillStyle = 'rgba(14,16,10,0.34)'; g.beginPath(); g.ellipse(x - LX * r * 0.35, y - LY * r * 0.35, r * 1.15, r * 0.95, 0, 0, TAU); g.fill();
  const poly = (pts) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); };
  g.save(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 5; poly(out); g.stroke(); g.fillStyle = dk; g.fill(); g.restore();
  for (let i = 0; i < n; i++) { // the side facets
    const a = out[i], b = out[(i + 1) % n], c = top[(i + 1) % n], d = top[i];
    const ex = (a[0] + b[0]) / 2 - x, ey = (a[1] + b[1]) / 2 - y, l = Math.hypot(ex, ey) || 1, lit = (ex * LX + ey * LY) / l;
    g.fillStyle = lit > 0.35 ? lt : lit > -0.2 ? md : dk; poly([a, b, c, d]); g.fill();
    g.strokeStyle = 'rgba(30,26,30,0.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(d[0], d[1]); g.stroke();
  }
  g.fillStyle = lin(g, x + LX * r, y + LY * r, x - LX * r * 0.3, y - LY * r * 0.3, lt, md); poly(top); g.fill();
  g.strokeStyle = 'rgba(30,26,30,0.35)'; g.lineWidth = 1.4; poly(top); g.stroke();
  if (look.cap) { g.save(); poly(top); g.clip(); g.fillStyle = hexA(look.cap, look.snow ? 0.95 : 0.7); g.beginPath(); g.ellipse(x + LX * r * 0.35, y + LY * r * 0.35, r * 0.45, r * 0.3, 0.5, 0, TAU); g.fill(); g.restore(); }
  g.save(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 4.8; poly(out); g.stroke(); g.restore();
}

// ---------------------------------------------------------------- the tree line (round 14; drawn over the units)
// The designer, on round 13's edge: "Don't like look. I think I also want larger less complex trees. Where you can't
// see the ground beneath them. Have them on a parallax where they move faster." So: big, simple shapes in three flat
// values with the game's ink line (like the heroes: no gradients, no per-leaf detail), two rows a side that overlap so
// only the dark of the wood shows between them, and each row is a layer nearer the camera than the ground: it slides
// past faster than the ground as the wagon rolls, the front row fastest.
// Three takes, picked by the address (?edge=crowns | firs | bank):
//   crowns: big round crowns, one lit mass each (hills and dunes are the same shape in their colours; crags are a
//           faceted rock)
//   firs:   tall dark firs seen from above, three flat tiers each, a jagged wall
//   bank:   no single trees: scalloped banks of canopy one behind the other, a lit rim, a shadow lip
// Each layer is one tile PER long for each side, painted once into its own canvas and repeated along the road; a frame
// only copies tiles, shifted (never repainted: a pinch zoom doesn't repaint them either).
export const EDGE_STYLES = ['crowns', 'firs', 'bank'];
export const EDGE_DEFAULT = 'crowns';
export function edgeStyle() { try { const q = new URLSearchParams(location.search).get('edge'); if (EDGE_STYLES.includes(q)) return q; } catch {} return EDGE_DEFAULT; }
const PER = 2400;         // a tile along the road (longer than a screen is tall at the default zoom, so no repeat shows at once)
const OVER = 150, OUT = 80, LAP = 3; // a tile reaches this far over the open ground, this far past the world's edge; tiles overlap a hair (no seam)
export const PARALLAX = [0.5, 1]; // how much faster than the ground each row slides (the back row, the front row)
// each take's two rows: the size of its things, how far their rim comes (from the tree line: + is over the open
// ground), how deep the notch between two neighbours may go, how much of a thing's radius is solid all round (K)
const ROWS = {
  crowns: [{ r: [155, 205], reach: [-120, -40], cusp: -215, K: 0.8, ink: 5 }, { r: [150, 200], reach: [30, 80], cusp: -40, K: 0.8, ink: 6.5 }],
  firs: [{ r: [165, 215], reach: [-110, -30], cusp: -230, K: 0.6, ink: 5 }, { r: [155, 205], reach: [40, 92], cusp: -44, K: 0.6, ink: 6.5 }],
  bank: [{ r: [70, 120], reach: [34, 70], cusp: -4, K: 1, ink: 6.5 }, { r: [70, 120], reach: [-80, -44], cusp: -104, K: 1, ink: 6 }],
};
// One row along a tile: things { x, d, r, k }, d = how far in from the world's edge the centre is. Each is put just far
// enough along from the last that their rims cross no deeper than the row's notch (so nothing shows between them), and
// the row closes on itself at PER.
function rowOf(seed, EDGE, cfg) {
  const out = []; let x = 0, prev = null;
  const mk = (i) => { const r = cfg.r[0] + (cfg.r[1] - cfg.r[0]) * hz(seed, i * 3 + 1); return { r, d: EDGE + cfg.reach[0] + (cfg.reach[1] - cfg.reach[0]) * hz(seed, i * 3 + 2) - r, k: hz(seed, i * 3 + 3) }; };
  const gap = (a, b, i) => { const c = EDGE + cfg.cusp + 18 * hz(seed, i * 7 + 5), half = (t) => Math.sqrt(Math.max(0, (t.r * cfg.K) ** 2 - (c - t.d) ** 2)); return Math.max(60, half(a) + half(b)); };
  for (let i = 0; i < 60; i++) {
    const t = mk(i);
    if (prev) x += gap(prev, t, i);
    if (x > PER - 110) break;
    t.x = x; out.push(t); prev = t;
  }
  const total = prev.x + gap(prev, out[0], 99);
  for (const t of out) t.x *= PER / total; // (a few percent: the notches stay covered, the row's K has the margin)
  return out;
}
const palsOf = (look, style) => (style === 'firs' && look.crowns.pine) || look.edge || look.crowns[Object.entries(look.kinds).sort((a, b) => b[1] - a[1])[0][0]] || Object.values(look.crowns)[0];
const deepOf = (look) => look.deep || shade(look.floor, 0.72);

let tiles = null;
export function drawCanopy(ctx, w, view, opt) {
  const { EDGE, look } = opt, H = w.H, style = opt.style || edgeStyle(), D = OUT + EDGE + OVER;
  let s = view.base * view.dpr; // (not the zoom: a pinch must not repaint it)
  if ((PER + LAP) * D * s * s > 1.5e6) s = Math.sqrt(1.5e6 / ((PER + LAP) * D));
  s = Math.round(s * 20) / 20;
  const key = `${EDGE}:${s}:${style}:${opt.key}`;
  if (!tiles || tiles.key !== key) tiles = { key, c: [0, 1].map((layer) => [-1, 1].map((side) => paintTile(layer, side, style, look, EDGE, s))) };
  const half = (view.rot ? view.ch : view.cw) / view.scale / 2 + 60, x0 = view.camX - half, x1 = view.camX + half;
  ctx.fillStyle = deepOf(look); // the deep wood past the tiles (a camera dragged past the world's edge)
  ctx.fillRect(x0, -3000, x1 - x0, 3000 - OUT + 2); ctx.fillRect(x0, H + OUT - 2, x1 - x0, 3000);
  for (let layer = 0; layer < 2; layer++) {
    const shift = -PARALLAX[layer] * (view.camX - (opt.from || 0));
    for (let k = Math.floor((x0 - shift) / PER); k * PER + shift < x1; k++) {
      ctx.drawImage(tiles.c[layer][0], k * PER + shift, -OUT, PER + LAP, D);
      ctx.drawImage(tiles.c[layer][1], k * PER + shift, H - EDGE - OVER, PER + LAP, D);
    }
  }
}
// One tile: a row of one side's wood, in a frame where x runs along the road and d in from the world's edge (the far
// side's tile is the same drawing turned over, lit from the same sky).
function paintTile(layer, side, style, look, EDGE, s) {
  const D = OUT + EDGE + OVER, c = document.createElement('canvas'); c.width = Math.ceil((PER + LAP) * s); c.height = Math.ceil(D * s);
  const g = c.getContext('2d'); g.scale(s, s);
  if (side < 0) g.translate(0, OUT); else { g.translate(0, EDGE + OVER); g.scale(1, -1); }
  const L = { x: LX, d: side < 0 ? LY : -LY }, cfg = ROWS[style][layer], deep = deepOf(look);
  const pals = palsOf(look, style).map((p) => (layer ? p : p.map((col) => shade(col, 0.7))));
  const row = rowOf((side < 0 ? 11 : 37) + layer * 100 + style.length, EDGE, cfg), all = [];
  for (const t of row) for (const o of [-PER, 0, PER]) if (style === 'bank' || (t.x + o > -t.r * 1.2 - 60 && t.x + o < PER + LAP + t.r * 1.2 + 60)) all.push({ ...t, x: t.x + o, pal: pals[Math.floor(t.k * 7.3) % pals.length] });
  all.sort((a, b) => b.x - a.x); // (each one laps over the one further up the road)
  g.lineJoin = 'round';
  if (!layer) { g.fillStyle = deep; g.fillRect(-20, -OUT - 20, PER + LAP + 40, OUT + 20 + EDGE - 62); } // the dark of the wood: no ground under the trees
  const crag = style === 'crowns' && palsOf(look) === look.crowns.crag;
  const sil = style === 'firs' ? firSil : style === 'bank' ? bankSil : crag ? cragSil : crownSil;
  // the row's shade on the verge, and on whoever stands under its rim: one flat shape
  const lip = hexA(look.shade || '#10140C', 0.3), lipD = side < 0 ? 36 : 16;
  if (layer || style === 'bank') { g.fillStyle = lip; g.beginPath(); for (const t of all) sil(g, t.x - 20, t.d + lipD, t.r, t.k, 0); g.fill(); }
  if (style === 'bank') { paintBank(g, all, pals[0], cfg, L, layer, lip, lipD); return c; }
  for (const t of all) (style === 'firs' ? paintFir : paintCrown)(g, t, sil, cfg.ink, L, look, layer);
  return c;
}
// A big crown from above: a round body and five lobes as one outline; inked; three flat values: the shadow value, the
// body value over all of it but a crescent on the side away from the light, and one lit mass towards the light.
function crownSil(g, x, d, r, k, grow) {
  g.moveTo(x + r * 0.8 + grow, d); g.arc(x, d, r * 0.8 + grow, 0, TAU);
  for (let i = 0; i < 5; i++) {
    const a = (i + k) / 5 * TAU + (hz(i, (k * 977) | 0) - 0.5) * 0.5, R = r * (0.38 + 0.09 * hz(i + 5, (k * 977) | 0)), px = x + Math.cos(a) * r * 0.58, pd = d + Math.sin(a) * r * 0.58;
    g.moveTo(px + R + grow, pd); g.arc(px, pd, R + grow, 0, TAU);
  }
}
// A crag: one faceted rock, the same three flat values (its top facet is the lit one).
function cragSil(g, x, d, r, k, grow) {
  const n = 8;
  for (let i = 0; i < n; i++) { const a = (i + k) / n * TAU, R = (r + grow) * (0.86 + 0.18 * hz(i, (k * 977) | 0)); i ? g.lineTo(x + Math.cos(a) * R, d + Math.sin(a) * R) : g.moveTo(x + Math.cos(a) * R, d + Math.sin(a) * R); }
  g.closePath();
}
function paintCrown(g, t, sil, ink, L, look) {
  const { x, d, r, k } = t, [c0, c1, c2] = t.pal, path = (dx, dd, rr = r) => { g.beginPath(); sil(g, x + dx, d + dd, rr, k, 0); };
  g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = ink * 2; path(0, 0); g.fill(); g.stroke();
  g.fillStyle = c0; path(0, 0); g.fill();
  g.save(); path(0, 0); g.clip();
  g.fillStyle = c1; path(L.x * r * 0.15, L.d * r * 0.15); g.fill();
  if (sil === cragSil) { g.fillStyle = c2; path(L.x * r * 0.3, L.d * r * 0.3, r * 0.52); g.fill(); }
  else { g.fillStyle = c2; path(L.x * r * 0.3, L.d * r * 0.3, r * 0.5); g.fill(); } // the lit mass: the crown's own shape, half the size, towards the light
  if (look.glow) { // embers still alight in the burnt crown: flat sparks on its dark side
    for (let i = 0; i < 4; i++) { const a = hz(i, (k * 991) | 0) * TAU, q = r * (0.25 + 0.45 * hz(i + 4, (k * 991) | 0)), ex = x - L.x * r * 0.2 + Math.cos(a) * q, ed = d - L.d * r * 0.2 + Math.sin(a) * q, R = r * (0.045 + 0.03 * hz(i + 8, (k * 991) | 0));
      g.fillStyle = look.glow; g.beginPath(); g.arc(ex, ed, R, 0, TAU); g.fill(); g.fillStyle = '#FFD9A0'; g.beginPath(); g.arc(ex + L.x * R * 0.3, ed + L.d * R * 0.3, R * 0.45, 0, TAU); g.fill(); }
  }
  g.restore();
}
// A fir from above: two flat tiers, each an eight-pointed star with deep notches, the top one a little towards the light
// on the skirt (so it leans like a cone), dark at the skirt and lit at the top; a small tip.
function firSil(g, x, d, r, k, grow) {
  const n = 8, rot = k * TAU;
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + rot, R = (i % 2 ? r * 0.62 : r) + grow; i ? g.lineTo(x + Math.cos(a) * R, d + Math.sin(a) * R) : g.moveTo(x + Math.cos(a) * R, d + Math.sin(a) * R); }
  g.closePath();
}
function paintFir(g, t, sil, ink, L, look) {
  const { x, d, r, k } = t, [c0, c1, c2] = look.snow ? [t.pal[0], '#DCE8F2', '#FFFFFF'] : t.pal; // (snow on the upper tier)
  [[1, 0, ink, c0], [0.56, 0.1, ink * 0.7, c1]].forEach(([q, off, lw, col], i) => {
    g.beginPath(); firSil(g, x + L.x * r * off, d + L.d * r * off, r * q, k + i * 0.0625, 0);
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = lw * 2; g.fill(); g.stroke();
    g.fillStyle = col; g.fill();
  });
  g.fillStyle = c2; g.beginPath(); firSil(g, x + L.x * r * 0.17, d + L.d * r * 0.17, r * 0.2, k + 0.125, 0); g.fill();
  if (look.glow) for (let i = 0; i < 3; i++) { const a = hz(i, (k * 991) | 0) * TAU, q = r * (0.66 + 0.1 * hz(i + 4, (k * 991) | 0)), R = r * 0.05; g.fillStyle = look.glow; g.beginPath(); g.arc(x + Math.cos(a) * q, d + Math.sin(a) * q, R, 0, TAU); g.fill(); }
}
// A bank of canopy: no single trees. A row of small rounds run together is one ribbon of leaf with a bumpy front, inked
// along its outline, flat (its body value, and the next value down in a crescent under each bump, away from the light).
// Four ribbons step up and back from the road, as a wood's edge does (low at the verge, tall inside), each lighter than
// the one below and throwing its shade on it: the lowest along the road is the slower layer, the three over it the faster.
function bankSil(g, x, d, r, k, grow) { g.moveTo(x + r + grow, d); g.arc(x, d, r + grow, 0, TAU); }
function paintBank(g, all, pal, cfg, L, layer, lip, lipD) {
  const lo = Math.min(...all.map((t) => t.d));
  const ribbon = (body, under, lift, slide, shadow) => {
    const path = (dx, dd) => { g.beginPath(); for (const t of all) bankSil(g, t.x + slide + dx, t.d + lift + dd, t.r, t.k, 0); g.rect(-400, -OUT - 400, PER + 800, OUT + 400 + lo + lift + dd); };
    if (shadow) { g.fillStyle = lip; path(-20, lipD); g.fill(); }
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = cfg.ink * 2; path(0, 0); g.fill(); g.stroke();
    g.fillStyle = under; path(0, 0); g.fill();
    g.save(); path(0, 0); g.clip(); g.fillStyle = body; path(L.x * 20, L.d * 20); g.fill(); g.restore();
  };
  const [c0, c1, c2] = pal;
  if (!layer) return ribbon(c1, c0, 0, 0, false);
  ribbon(c1, c0, 0, 0, false);
  ribbon(mix(c1, c2, 0.5), c1, -98, 170, true);
  ribbon(c2, mix(c1, c2, 0.5), -196, 395, true);
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
function mix(a, b, t) { const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), f = (sh) => Math.round(((p >> sh) & 255) * (1 - t) + ((q >> sh) & 255) * t); return '#' + ((1 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)).toString(16).slice(1); }
function shade(hex, k) { if (k === 1) return hex; const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(clamp(v * k, 0, 255)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
function hexA(c, a) { if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; } return c.replace('rgb(', 'rgba(').replace(')', `,${a})`); }
