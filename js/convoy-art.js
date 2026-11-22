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
  frost: { kinds: { pine: 0.82, dead: 0.18 }, snow: true,
    ground: ['#DCE6EE', '#EEF4F8', '#C4D2DE'], tuft: '#A8B8C8', flower: [], road: ['#B4BCC6', '#9AA4B0'], floor: '#9AAABA',
    crowns: { pine: [['#173E3A', '#2A6458', '#4E8A78'], ['#1C4440', '#306A5E', '#56927E']], dead: [['#4A3E38', '#6E5E54', '#A09080']] },
    trunk: ['#4A3A30', '#6E5848'], under: ['#9AB0BE', '#D6E2EC'], rock: ['#5E6A78', '#8E9AA8', '#C4CED8'], cap: '#F4F8FC' },
  ember: { kinds: { charred: 0.55, dead: 0.45 }, embers: true, // ash and embers: a burnt wood still smouldering
    ground: ['#6E6A66', '#827C76', '#4E4A48'], tuft: '#4A4644', flower: [], road: ['#86827E', '#6A6662'], floor: '#1C1818',
    crowns: { charred: [['#262222', '#423C3A', '#6E6662']], dead: [['#1E1A1A', '#3A3230', '#5E5450']] },
    trunk: ['#1E1A1A', '#3A3230'], under: ['#3A3634', '#5A5450'], rock: ['#3E3A38', '#625C58', '#8E8680'], cap: '#4A4644', glow: '#FF7A2E' },
  spire: { kinds: { crag: 0.8, pine: 0.2 },
    ground: ['#C8C2B0', '#D8D2C0', '#B4AE9C'], tuft: '#9AA078', flower: ['#F6E6A8', '#C8B0F0'], road: ['#E2D8C0', '#C8BEA4'], floor: '#6E6A5E',
    crowns: { crag: [['#8A8478', '#B2ACA0', '#E8E2D4']], pine: [['#2A4A3A', '#3E6A50', '#6A9A74']] },
    trunk: ['#6E6458', '#8E8476'], under: ['#9AA078', '#BCC092'], rock: ['#8A8478', '#B2ACA0', '#E8E2D4'], cap: '#E8E2D4' },
  dunes: { kinds: { mound: 0.72, palm: 0.28 },
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

// ---------------------------------------------------------------- the edge's layout
// The things that line the road, decided once per stretch from the world's size: three depths a side, the deepest
// first, so the front row overlaps the ones behind. Each: { x, y, r, row, side, k, kind }. Now and then a fallen trunk
// reaches from under the trees onto the verge ({ fallen: true, x, a, L }).
export function edgeLayout(W, H, EDGE, look) {
  const out = [];
  const hills = look.kinds.mound || look.kinds.crag;
  const rows = hills ? [[-30, 70, 100, 120], [EDGE * 0.45, 66, 96, 104], [EDGE - 36, 48, 76, 78]] : [[-10, 70, 100, 104], [EDGE * 0.5, 62, 90, 88], [EDGE - 28, 44, 74, 64]];
  rows.forEach(([d, r0, r1, step], row) => {
    for (const side of [-1, 1]) {
      let i = 0;
      for (let x = -80 + hz(row, side) * step; x < W + 120; x += step * (0.7 + 0.6 * hz(row * 31 + i, side + 5)), i++) {
        const k = hz(x | 0, row * 7 + side + 11), j = hz(i, row + side * 3), kind = pickKind(look, hz(i * 3 + row, side * 7 + 2));
        let r = r0 + (r1 - r0) * k, dd = d + (j - 0.5) * (row === 2 ? 70 : 60);
        if (kind === 'round') r *= 0.8; else if (kind === 'dead') r *= 0.85; else if (kind === 'pine') r *= 0.9;
        if (row === 2) {
          if (hz(i, side + 40) < 0.12) continue; // a gap in the front row: the shade and the undergrowth behind show
          if (hz(i, side + 50) < 0.16) { r *= 1.3; dd += 22; } // an old tree leaning out over the verge
          else if (j < 0.3) { r *= 0.8; dd -= 14; } // a young one set back
        }
        out.push({ x, y: side < 0 ? dd : H - dd, r, row, side, k, kind, hue: hz(i, row * 13 + side + 7) });
      }
    }
  });
  if (look.fallen) for (const side of [-1, 1]) for (let x = 500 + hz(side, 90) * 600; x < W - 200; x += 900 + hz(x | 0, 91) * 700) out.push({ fallen: true, side, x, a: (hz(x | 0, 92) - 0.5) * 1.1, L: 200 + hz(x | 0, 93) * 90, r: 15 + hz(x | 0, 94) * 4, row: -1 });
  return out;
}

// ---------------------------------------------------------------- the ground (into render.js's floor cache)
// g is in world units. Broad soft patches, not specks: a few big tufts, flowers in small drifts; the road worn in; the
// forest floor and the canopy's shade at the edge; roots, bushes and fallen trunks where the trees meet the verge.
export function paintRoadGround(g, w, { EDGE, ROAD_HALF, look, trees }) {
  const W = w.W, H = w.H, mid = H / 2;
  g.fillStyle = look.ground[0]; g.fillRect(-60, -60, W + 120, H + 120);
  for (let i = 0; i < W * H / 60000; i++) { // big soft patches, lighter and darker
    const x = hz(i, 1) * W, y = EDGE + hz(i, 2) * (H - 2 * EDGE), r = 150 + hz(i, 3) * 200, c = hz(i, 4) < 0.5 ? look.ground[1] : look.ground[2];
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hexA(c, 0.55)); gr.addColorStop(0.6, hexA(c, 0.25)); gr.addColorStop(1, hexA(c, 0));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  if (look.embers) emberGround(g, W, H, EDGE, mid, ROAD_HALF, look);
  // the forest floor under the trees, and the shade the canopy throws on the verge
  for (const side of [-1, 1]) {
    const e = side < 0 ? EDGE : H - EDGE, y0 = side < 0 ? -60 : e + 30;
    g.fillStyle = look.floor; g.fillRect(-60, y0, W + 120, EDGE + 30);
    const fg = g.createLinearGradient(0, e - side * 30, 0, e + side * 40); fg.addColorStop(0, look.floor); fg.addColorStop(1, hexA(look.floor, 0));
    g.fillStyle = fg; g.fillRect(-60, Math.min(e - side * 30, e + side * 40), W + 120, 70);
    const sg = g.createLinearGradient(0, e - side * 30, 0, e + side * 140);
    sg.addColorStop(0, 'rgba(14,20,10,0.58)'); sg.addColorStop(0.35, 'rgba(14,20,10,0.26)'); sg.addColorStop(1, 'rgba(14,20,10,0)');
    g.fillStyle = sg; g.fillRect(-60, Math.min(e - side * 30, e + side * 140), W + 120, 170);
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
  for (let x = 300; x < W; x += (420 + hz(x, 6) * 500) / (look.puddles || 1)) {
    const y = mid + (hz(x, 7) - 0.5) * 90, rx = 24 + hz(x, 8) * 26;
    g.fillStyle = 'rgba(60,46,30,0.30)'; g.beginPath(); g.ellipse(x, y, rx + 4, rx * 0.5 + 3, 0, 0, TAU); g.fill();
    g.fillStyle = look.snow ? '#C8DCEA' : look.water || '#7E9AA0'; g.beginPath(); g.ellipse(x, y, rx, rx * 0.5, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(x + rx * 0.2, y - rx * 0.15, rx * 0.45, rx * 0.12, 0, 0, TAU); g.fill();
  }
  // a few big tufts of grass, and flowers in small drifts
  for (let i = 0; i < W * H / 22000; i++) {
    const x = hz(i, 21) * W, y = EDGE + 20 + hz(i, 22) * (H - 2 * EDGE - 40);
    if (Math.abs(y - mid) < ROAD_HALF + 10) continue;
    g.strokeStyle = look.tuft; g.lineWidth = 3.2;
    g.beginPath(); for (let b = -2; b <= 2; b++) { g.moveTo(x, y); g.lineTo(x + 11 + hz(i, b + 30) * 5, y + b * 4.5); } g.stroke();
  }
  if (look.flower.length) for (let i = 0; i < W * H / 420000; i++) {
    const cx = hz(i, 41) * W, cy = EDGE + 60 + hz(i, 42) * (H - 2 * EDGE - 120); if (Math.abs(cy - mid) < ROAD_HALF + 30) continue;
    const col = look.flower[Math.floor(hz(i, 43) * look.flower.length)];
    for (let j = 0; j < 6; j++) { const x = cx + (hz(i, j + 50) - 0.5) * 70, y = cy + (hz(i, j + 60) - 0.5) * 70; g.fillStyle = 'rgba(40,40,20,0.25)'; g.beginPath(); g.arc(x - 1.4, y + 2, 6.4, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 5.6, 0, TAU); g.fill(); g.fillStyle = '#F6C94A'; g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill(); }
  }
  if (look.graves) for (let x = 200; x < W; x += 160 + hz(x, 70) * 220) for (const s of [-1, 1]) { // the graveyard over the crypt: headstones on the verge
    const y = s < 0 ? EDGE + 50 + hz(x, 71) * 160 : H - EDGE - 50 - hz(x, 72) * 160;
    g.fillStyle = 'rgba(20,24,20,0.35)'; g.beginPath(); g.ellipse(x - 8, y + 10, 18, 12, 0, 0, TAU); g.fill();
    inked(g, () => { g.beginPath(); g.moveTo(x - 12, y - 16); g.lineTo(x + 8, y - 16); g.arc(x + 8, y, 16, -Math.PI / 2, Math.PI / 2); g.lineTo(x - 12, y + 16); g.closePath(); }, lin(g, x - 12, y, x + 24, y, '#C2C0B8', '#8E8C86'), 2.2);
  }
  // where the trees meet the verge: roots, fallen trunks, bushes
  for (const t of trees) {
    if (t.fallen) { fallenTrunk(g, t, H, EDGE, look); continue; }
    if (t.row !== 2) continue;
    const s = t.side;
    // (roots were tried here: at game size they read as thorns, so they're out; root() is kept for a later pass)
  }
  for (const side of [-1, 1]) { // undergrowth in little clumps along the verge
    const ey = side < 0 ? EDGE : H - EDGE;
    for (let x = 60 + hz(side, 81) * 120; x < W; x += 150 + hz(x | 0, 82) * 160) {
      const n = 1 + Math.floor(hz(x | 0, 83) * 3);
      for (let j = 0; j < n; j++) bush(g, x + j * 44 + (hz(x | 0, j + 84) - 0.5) * 20, ey - side * (62 + hz(x | 0, j + 85) * 46), 24 + hz(x | 0, j + 86) * 14, look);
    }
  }
}
// A root: a tapered, slightly curved limb reaching from under the crown out across the verge, inked, bark-shaded.
function root(g, t, j, look) {
  const dir = t.side < 0 ? 1 : -1, a = (j ? 1 : -1) * (0.3 + hz(t.x | 0, j + 5) * 0.55), L = 55 + hz(t.x | 0, j + 9) * 45;
  const x0 = t.x + Math.sin(a) * t.r * 0.45, y0 = t.y + dir * t.r * 0.62, x1 = x0 + Math.sin(a) * L, y1 = y0 + dir * Math.cos(a) * L;
  const ux = (x1 - x0) / L, uy = (y1 - y0) / L, px = -uy, py = ux, bend = (hz(t.x | 0, j + 12) - 0.5) * 14;
  const mx = (x0 + x1) / 2 + px * bend, my = (y0 + y1) / 2 + py * bend, w0 = 11, w1 = 2.5, wm = (w0 + w1) / 2;
  const path = () => { g.beginPath(); g.moveTo(x0 + px * w0, y0 + py * w0); g.quadraticCurveTo(mx + px * wm, my + py * wm, x1, y1); g.quadraticCurveTo(mx - px * wm, my - py * wm, x0 - px * w0, y0 - py * w0); g.closePath(); };
  g.save(); g.lineJoin = 'round'; g.fillStyle = 'rgba(14,20,10,0.3)'; g.translate(-LX * 4, -LY * 4); path(); g.fill(); g.restore();
  g.save(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 4.4; path(); g.stroke(); g.fillStyle = lin(g, x0 + px * w0, y0 + py * w0, x0 - px * w0, y0 - py * w0, look.trunk[1], look.trunk[0]); g.fill(); g.restore();
}
function fallenTrunk(g, t, H, EDGE, look) {
  const s = t.side, ey = s < 0 ? EDGE : H - EDGE, dir = s < 0 ? 1 : -1;
  const x0 = t.x, y0 = ey - dir * 70, x1 = x0 + Math.sin(t.a) * t.L, y1 = y0 + dir * Math.cos(t.a) * t.L, ang = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), R = t.r;
  g.save(); g.translate(x0, y0); g.rotate(ang);
  g.fillStyle = 'rgba(14,20,10,0.32)'; g.beginPath(); g.ellipse(L / 2 - 4, R * 0.9, L / 2 + 6, R + 4, 0, 0, TAU); g.fill();
  inked(g, () => { g.beginPath(); g.roundRect ? g.roundRect(0, -R, L, R * 2, R) : g.rect(0, -R, L, R * 2); }, lin(g, 0, -R, 0, R, look.trunk[1], look.trunk[0]), 2.4);
  g.strokeStyle = 'rgba(30,20,12,0.35)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { const y = -R * 0.6 + i * R * 0.4; g.beginPath(); g.moveTo(R, y); g.lineTo(L - R * 1.4, y + (hz(i, x0 | 0) - 0.5) * 4); g.stroke(); }
  inked(g, () => { g.beginPath(); g.ellipse(L - R * 0.4, 0, R * 0.55, R * 0.95, 0, 0, TAU); }, '#C8A878', 2); // the broken end
  g.strokeStyle = 'rgba(120,84,50,0.6)'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(L - R * 0.4, 0, R * 0.3, R * 0.55, 0, 0, TAU); g.stroke();
  inked(g, () => { g.beginPath(); g.moveTo(L * 0.45, -R * 0.8); g.lineTo(L * 0.52, -R * 2.1); g.lineTo(L * 0.58, -R * 0.8); g.closePath(); }, look.trunk[1], 1.6); // a snapped branch
  if (!look.snow && !look.embers) { g.fillStyle = hexA(look.under[1], 0.85); g.beginPath(); g.ellipse(L * 0.3, -R * 0.35, R * 1.1, R * 0.45, 0, 0, TAU); g.fill(); }
  if (look.snow) { g.fillStyle = '#F4F8FC'; g.beginPath(); g.ellipse(L * 0.5, -R * 0.4, L * 0.4, R * 0.45, 0, 0, TAU); g.fill(); }
  g.restore();
}
function bush(g, x, y, r, look) {
  const [dark, lite] = look.under;
  const lobes = [[0, 0, 0.8], [-0.62, 0.3, 0.6], [0.6, 0.28, 0.62], [0.08, -0.55, 0.58], [-0.3, -0.4, 0.5]];
  g.fillStyle = 'rgba(14,20,10,0.32)'; g.beginPath(); g.ellipse(x - 6, y + 8, r * 1.25, r * 0.95, 0, 0, TAU); g.fill();
  g.fillStyle = INK; g.beginPath(); for (const [dx, dy, k] of lobes) { g.moveTo(x + dx * r + k * r + 4, y + dy * r); g.arc(x + dx * r, y + dy * r, k * r + 4, 0, TAU); } g.fill();
  const gr = g.createRadialGradient(x + LX * r * 0.5, y + LY * r * 0.5, 1, x, y, r * 1.3); gr.addColorStop(0, lite); gr.addColorStop(1, dark);
  g.fillStyle = gr; g.beginPath(); for (const [dx, dy, k] of lobes) { g.moveTo(x + dx * r + k * r, y + dy * r); g.arc(x + dx * r, y + dy * r, k * r, 0, TAU); } g.fill();
  if (look.flower.length && hz(x | 0, y | 0) < 0.5) for (let i = 0; i < 3; i++) { const a = i * 2.1 + x; g.fillStyle = look.flower[i % look.flower.length]; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 3.4, 0, TAU); g.fill(); }
  if (look.snow) { g.fillStyle = 'rgba(250,252,255,0.85)'; g.beginPath(); g.ellipse(x + LX * r * 0.3, y + LY * r * 0.3, r * 0.6, r * 0.38, 0.6, 0, TAU); g.fill(); }
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

// ---------------------------------------------------------------- the canopy (over the units)
// Two strips, one a side, each its own cached canvas at the screen's scale. Three rows, deepest first, all drawn the
// same way, the deeper ones darker; the front row reaches a little past EDGE, over the verge. Each thing casts its
// shade down-screen onto what's behind it, and from the front row onto the verge and whoever stands there.
let cache = null;
export function drawCanopy(ctx, w, view, opt) {
  const { EDGE, look, trees } = opt, W = w.W, H = w.H, depth = EDGE + 140, pad = 60;
  let s = view.base * view.dpr; // (not the zoom: a pinch must not repaint it)
  if ((W + pad * 2) * depth * s * s > 3.2e6) s = Math.sqrt(3.2e6 / ((W + pad * 2) * depth));
  s = Math.round(s * 20) / 20;
  const key = `${W}x${H}:${s}:${opt.key}`;
  if (!cache || cache.key !== key || cache.w !== w) {
    const strips = [-1, 1].map((side) => {
      const c = document.createElement('canvas'); c.width = Math.ceil((W + pad * 2) * s); c.height = Math.ceil(depth * s);
      const g = c.getContext('2d'); g.scale(s, s);
      const y0 = side < 0 ? -40 : H - depth + 40; g.translate(pad, -y0);
      paintEdge(g, W, H, EDGE, look, trees.filter((t) => t.side === side && !t.fallen), side);
      return { c, y0 };
    });
    cache = { key, w, strips, s, pad };
  }
  for (const st of cache.strips) ctx.drawImage(st.c, -cache.pad, st.y0, st.c.width / cache.s, st.c.height / cache.s);
}
export function paintEdge(g, W, H, EDGE, look, trees, side) {
  const ey = side < 0 ? EDGE : H - EDGE;
  g.fillStyle = shade(look.floor, 0.7); g.fillRect(-60, side < 0 ? -60 : ey + 40, W + 120, EDGE + 40); // the deep wood behind everything
  const out = (t) => (side < 0 ? t.y + t.r : H - t.y + t.r);
  const order = trees.slice().sort((a, b) => a.row - b.row || (a.row === 2 ? out(a) - out(b) : 0));
  for (const t of order) {
    g.fillStyle = `rgba(8,12,6,${t.row === 2 ? 0.30 : 0.4})`; g.beginPath(); g.arc(t.x - LX * 22, t.y - LY * 22, t.r * 1.02, 0, TAU); g.fill();
    thing(g, t, look);
  }
}
function thing(g, t, look) {
  const pals = look.crowns[t.kind] || Object.values(look.crowns)[0], pal = pals[Math.floor(t.k * pals.length) % pals.length];
  const dim = (t.row === 0 ? 0.55 : t.row === 1 ? 0.76 : 1) * (0.93 + 0.14 * (t.hue || 0.5));
  const P = pal.map((c) => shade(c, dim));
  switch (t.kind) {
    case 'pine': return pine(g, t, P, look);
    case 'dead': return dead(g, t, P, look);
    case 'palm': return palm(g, t, P);
    case 'crag': return paintRock(g, t.x, t.y, t.r, { ...look, rock: P, cap: look.cap }, (t.x * 7) | 0);
    case 'mound': return crown(g, t, P, look, { n: 4, body: 0.72, lobe: [0.42, 0.5], at: 0.5, masses: 1, burrow: look.burrows });
    case 'round': return crown(g, t, P, look, { n: 10, body: 0.7, lobe: [0.24, 0.3], at: 0.76, masses: 1 });
    case 'charred': return crown(g, t, P, look, { n: 7, body: 0.6, lobe: [0.3, 0.4], at: 0.66, masses: 1, embers: true });
    default: return crown(g, t, P, look, { n: 6 + Math.floor(t.k * 2), body: 0.6, lobe: [0.38, 0.46], at: 0.62, masses: 2 });
  }
}
// A crown from above, drawn like the heroes: one silhouette with a thick ink line, scalloped by its lobes; a gradient
// from the shadow value to the body value towards the light, a soft crescent of shade on the far side, and one or two
// big soft lit masses on the near side (no per-lobe creases: they read as broccoli at game size).
function crown(g, t, [c0, c1, c2], look, o) {
  const { x, y, r } = t, lobes = [];
  for (let i = 0; i < o.n; i++) {
    const a = i / o.n * TAU + t.k * 6, b = o.lobe[0] + (o.lobe[1] - o.lobe[0]) * hz(i, (x * 3) | 0), d = o.at + 0.05 * hz(i + 9, x | 0);
    lobes.push([Math.cos(a) * d, Math.sin(a) * d, b]);
  }
  const shape = (grow) => { g.beginPath(); g.moveTo(x + r * o.body + grow, y); g.arc(x, y, r * o.body + grow, 0, TAU); for (const [dx, dy, b] of lobes) { g.moveTo(x + dx * r + b * r + grow, y + dy * r); g.arc(x + dx * r, y + dy * r, b * r + grow, 0, TAU); } };
  g.fillStyle = INK; shape(4.8); g.fill();
  const gr = g.createRadialGradient(x + LX * r * 0.4, y + LY * r * 0.4, r * 0.05, x, y, r * 1.1); gr.addColorStop(0, c1); gr.addColorStop(1, c0);
  g.fillStyle = gr; shape(0); g.fill();
  g.save(); shape(0); g.clip();
  g.fillStyle = 'rgba(4,8,2,0.28)'; g.beginPath(); g.arc(x - LX * r * 0.4, y - LY * r * 0.4, r * 0.98, 0, TAU); g.arc(x + LX * r * 0.14, y + LY * r * 0.14, r * 0.92, 0, TAU, true); g.fill('evenodd');
  const masses = o.masses === 2 ? [[0.26, 0.6], [-0.05, 0.32, 0.55]] : [[0.3, 0.55]];
  masses.forEach(([k, R, off = 0]) => {
    const cx = x + LX * r * k + (off ? -LY * r * off * 0.6 : 0), cy = y + LY * r * k + (off ? LX * r * off * 0.6 : 0), RR = r * R;
    const lg = g.createRadialGradient(cx + LX * RR * 0.35, cy + LY * RR * 0.35, 0, cx, cy, RR);
    lg.addColorStop(0, c2); lg.addColorStop(0.5, hexA(c2, 0.45)); lg.addColorStop(1, hexA(c2, 0));
    g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, RR, 0, TAU); g.fill();
  });
  if (o.embers && look.glow) { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = hz(i, x | 0) * TAU, d = r * (0.2 + 0.6 * hz(i + 3, x | 0)), ex = x + Math.cos(a) * d, ey = y + Math.sin(a) * d; const eg = g.createRadialGradient(ex, ey, 0, ex, ey, r * 0.16); eg.addColorStop(0, 'rgba(255,200,120,0.9)'); eg.addColorStop(0.4, hexA(look.glow, 0.55)); eg.addColorStop(1, hexA(look.glow, 0)); g.fillStyle = eg; g.fillRect(ex - r * 0.16, ey - r * 0.16, r * 0.32, r * 0.32); } g.globalCompositeOperation = 'source-over'; }
  if (look.snow) { g.fillStyle = 'rgba(246,250,254,0.9)'; g.beginPath(); g.ellipse(x + LX * r * 0.35, y + LY * r * 0.35, r * 0.45, r * 0.28, 0.6, 0, TAU); g.fill(); }
  if (o.burrow && hz(x | 0, 99) < 0.35 && t.row === 2) { g.fillStyle = '#2A2418'; g.beginPath(); g.ellipse(x - LX * r * 0.2, y - LY * r * 0.2 + (t.side < 0 ? r * 0.35 : -r * 0.35), r * 0.2, r * 0.13, 0, 0, TAU); g.fill(); }
  g.restore();
}
function pine(g, t, [c0, c1, c2], look) { // tiers of spiky stars; snow on the lit side of each tier where it snows
  const { x, y, r, k } = t;
  for (let tier = 0; tier < 3; tier++) {
    const R = r * (1 - tier * 0.28), n = 9 - tier, rot = k * 5 + tier * 0.4;
    const star = () => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + rot, rr = i % 2 ? R * 0.64 : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
    g.fillStyle = INK; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 8; star(); g.fill(); g.stroke();
    const gr = g.createRadialGradient(x + LX * R * 0.4, y + LY * R * 0.4, 0, x, y, R); gr.addColorStop(0, tier === 2 ? c2 : c1); gr.addColorStop(1, c0);
    g.fillStyle = gr; star(); g.fill();
    if (look.snow && tier === 2) { g.save(); star(); g.clip(); g.fillStyle = 'rgba(244,249,253,0.92)'; g.beginPath(); g.arc(x + LX * R * 0.4, y + LY * R * 0.4, R * 0.7, 0, TAU); g.fill(); g.restore(); }
    else if (look.snow) { g.fillStyle = 'rgba(244,249,253,0.55)'; g.beginPath(); g.arc(x + LX * R * 0.72, y + LY * R * 0.72, R * 0.16, 0, TAU); g.fill(); }
  }
}
function dead(g, t, [c0, c1, c2], look) { // bare branches from a trunk top, forking once; embers glowing in the cracks where it burns
  const { x, y, r, k } = t;
  const limbs = [];
  for (let i = 0; i < 4; i++) { // four uneven limbs, each bending once and forking at its end
    const a = i / 4 * TAU + k * 4 + (hz(i, (x * 5) | 0) - 0.5) * 0.9, L = r * (0.45 + 0.55 * hz(i, x | 0)), bend = (hz(i + 7, x | 0) - 0.5) * 0.9;
    const mx = x + Math.cos(a) * L * 0.55, my = y + Math.sin(a) * L * 0.55, ex = mx + Math.cos(a + bend) * L * 0.5, ey = my + Math.sin(a + bend) * L * 0.5;
    limbs.push([x, y, mx, my, 14], [mx, my, ex, ey, 10]);
    limbs.push([ex, ey, ex + Math.cos(a + bend - 0.6) * L * 0.35, ey + Math.sin(a + bend - 0.6) * L * 0.35, 6]);
    if (hz(i + 3, x | 0) < 0.6) limbs.push([mx, my, mx + Math.cos(a - bend + 0.8) * L * 0.4, my + Math.sin(a - bend + 0.8) * L * 0.4, 6]);
  }
  g.lineCap = 'round';
  for (const [a0, b0, a1, b1, wd] of limbs) { g.strokeStyle = INK; g.lineWidth = wd + 5; g.beginPath(); g.moveTo(a0, b0); g.lineTo(a1, b1); g.stroke(); }
  for (const [a0, b0, a1, b1, wd] of limbs) { g.strokeStyle = c1; g.lineWidth = wd; g.beginPath(); g.moveTo(a0, b0); g.lineTo(a1, b1); g.stroke(); g.strokeStyle = hexA(c2, 0.6); g.lineWidth = wd * 0.35; g.beginPath(); g.moveTo(a0 + 1.5, b0 - 1.5); g.lineTo(a1 + 1.5, b1 - 1.5); g.stroke(); }
  if (look.glow) { g.save(); g.globalCompositeOperation = 'lighter'; for (const [a0, b0, a1, b1, wd] of limbs) if (wd > 10) { g.strokeStyle = hexA(look.glow, 0.7); g.lineWidth = 3; g.beginPath(); g.moveTo(a0 + (a1 - a0) * 0.2, b0 + (b1 - b0) * 0.2); g.lineTo(a0 + (a1 - a0) * 0.7, b0 + (b1 - b0) * 0.7); g.stroke(); } g.restore(); }
  inked(g, () => { g.beginPath(); g.arc(x, y, r * 0.24, 0, TAU); }, lin(g, x + r * 0.2, y - r * 0.2, x - r * 0.2, y + r * 0.2, c2, c0), 2.4);
  g.strokeStyle = 'rgba(30,20,12,0.4)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r * 0.13, 0, TAU); g.stroke();
}
function palm(g, t, [c0, c1, c2]) { // a palm from above: long fronds round a crown
  const { x, y, r, k } = t;
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU + k * 3, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r, nx = -Math.sin(a) * r * 0.2, ny = Math.cos(a) * r * 0.2;
    const leaf = () => { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + ex) / 2 + nx, (y + ey) / 2 + ny, ex, ey); g.quadraticCurveTo((x + ex) / 2 - nx, (y + ey) / 2 - ny, x, y); g.closePath(); };
    g.save(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 4.8; leaf(); g.stroke(); g.fillStyle = lin(g, x, y, ex, ey, c1, c0); g.fill(); g.restore();
    g.strokeStyle = hexA(c2, 0.7); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(ex * 0.9 + x * 0.1, ey * 0.9 + y * 0.1); g.stroke();
  }
  inked(g, () => { g.beginPath(); g.arc(x, y, r * 0.16, 0, TAU); }, '#8A6A44', 2);
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
