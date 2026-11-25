// Round 19 art lane (walls): one wall option round a stretch of room edge, the way the game would draw it: the
// theme's floor (env.js, the default Carved look), the wall pieces tiled along each side (turned so their foot meets
// the floor), the room's corner and a rock corner jutting in, one ink outline grown round the wall's mass (parts.js
// growInk, OUTLINE), the game's own doors (sprites.js getProp) set in two bays, and a hero for size.
// The screen is the game's portrait view: the way out (the doors) at the top.
import { loadProps, getProp } from '../../js/sprites.js';
import { paintRoom, lookOf } from '../../js/env.js';
import { growInk } from '../../js/parts.js';
import { INK, OUTLINE } from '../../js/util.js';

const q = new URLSearchParams(location.search);
const id = q.get('walls') || 'crypt-a';
const S = +(q.get('s') || 2); // pixels per room unit
const index = await (await fetch('design/r19-art/walls/index.json', { cache: 'no-store' })).json();
const o = index.find((x) => x.id === id);
if (!o) throw new Error('no option ' + id);
const { H, F, theme } = o, P = 160;
// the room's edge on screen (room units): the far wall's foot at Y0 with two doors, the room's corner at (XC, Y0), the
// side wall down to a rock corner at (XC, Y1), and the far wall again to the right of it
const SW = 760, SH = 640, Y0 = 170, XC = 540, Y1 = Y0 + 2 * P;
const DOORS = [[150, 'door-shut'], [330, 'door-open-treasure']];

const cv = document.getElementById('c'); cv.width = SW * S; cv.height = SH * S;
const g = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const x = c.getContext('2d'); x.setTransform(S, 0, 0, S, 0, 0); return [c, x]; };
const img = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('missing ' + src)); i.src = src; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = `design/r19-art/walls/${id}/`, bust = '?v=' + Date.now();
const [runA, runB, bay, cOut, cIn] = await Promise.all(['run-a', 'run-b', 'bay', 'corner-out', 'corner-in'].map((n) => img(dir + n + '.svg' + bust)));

g.setTransform(S, 0, 0, S, 0, 0);
// ---- the floor, as the game paints it (a world a little bigger than the picture, so its own old walls fall outside)
const world = { W: SW + 40, H: SH + 40, theme: { id: theme }, walls: [], doors: [], doorIn: { y: -999 } };
const L = lookOf(world);
g.save(); g.translate(-20, -20); paintRoom(g, world, 0, null); g.restore();
const floorPoly = [[-20, Y0], [XC, Y0], [XC, Y1], [SW + 20, Y1], [SW + 20, SH + 20], [-20, SH + 20]];
const path = (x, pts, keep) => { if (!keep) x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.closePath(); };
// the rock beyond the walls
g.save(); g.beginPath(); g.rect(-20, -20, SW + 40, SH + 40); path(g, floorPoly, true); g.fillStyle = o.mass || L.mass; g.fill('evenodd'); g.restore();
// the foot of every wall: the game's soft top-down shadow on the floor
g.save(); path(g, floorPoly); g.clip();
for (const [x0, y0, x1, y1, nx, ny] of [[-20, Y0, XC, Y0, 0, 1], [XC, Y0, XC, Y1, -1, 0], [XC, Y1, SW + 20, Y1, 0, 1]]) {
  const d = 30, gr = g.createLinearGradient(x0, y0, x0 + nx * d, y0 + ny * d);
  gr.addColorStop(0, 'rgba(16,10,24,0.32)'); gr.addColorStop(1, 'rgba(16,10,24,0)');
  g.fillStyle = gr; path(g, [[x0, y0], [x1, y1], [x1 + nx * d, y1 + ny * d], [x0 + nx * d, y0 + ny * d]]); g.fill();
}
g.restore();

// ---- the walls, on their own layer
const [wc, wg] = mk();
// a run of wall in a frame (ox, oy, turned or not) between u = a and u = b, tiles every P from u = 0
function run(ox, oy, side, a, b, pick) {
  wg.save(); wg.translate(ox, oy); if (side) wg.transform(0, 1, -1, 0, 0, 0);
  wg.beginPath(); wg.rect(a, -H - 1, b - a, H + 1); wg.clip();
  for (let k = Math.floor(a / P); k * P < b; k++) wg.drawImage(pick(k), k * P, -H, P, H);
  wg.restore();
}
// the far wall: its frame's u = 0 at the room's corner, so it meets the corner piece in step
run(XC, Y0, false, -XC - 20, 0, (k) => (k === -1 ? runB : runA));
for (const [x] of DOORS) { wg.save(); wg.translate(XC, Y0); wg.drawImage(bay, x - XC - 80, -H, P, H); wg.restore(); }
wg.drawImage(cOut, XC, Y0 - H, H, H);
// the side wall, down from the room's corner to the rock corner
run(XC, Y0, true, 0, Y1 - Y0 - H, (k) => (k === 0 ? runB : runA));
wg.drawImage(cIn, XC, Y1 - H, H, H);
// the far wall again, right of the rock corner
run(XC, Y1, false, H, SW + 20 - XC, () => runA);
// the light: faces turned from the top-left light a little darker, those turned to it a little lighter (env.js faceK)
wg.save(); wg.globalCompositeOperation = 'source-atop';
wg.fillStyle = 'rgba(24,14,34,0.10)'; path(wg, [[-20, Y0], [XC, Y0], [XC + F, Y0 - F], [-20, Y0 - F]]); wg.fill();
path(wg, [[XC, Y1], [XC + F, Y1 - F], [SW + 20, Y1 - F], [SW + 20, Y1]]); wg.fill();
wg.fillStyle = 'rgba(255,248,230,0.07)'; path(wg, [[XC, Y0], [XC + F, Y0 - F], [XC + F, Y1 - F], [XC, Y1]]); wg.fill();
wg.restore();
// one ink outline round the wall's mass, then the wall
g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(growInk(wc, OUTLINE * S, INK), 0, 0); g.drawImage(wc, 0, 0); g.restore();

// ---- the doors, the game's own art and outline
await loadProps();
async function propOf(name, box) {
  const px = box * S, size = Math.max(16, Math.min(1024, Math.ceil(px / 16) * 16));
  for (let i = 0; i < 400; i++) { const e = getProp(name, px, OUTLINE * S); if (e && e.ready && e.size === size) return e; await sleep(25); }
  throw new Error('prop ' + name + ' did not load');
}
for (const [x, name] of DOORS) {
  const e = await propOf(name, 141.4), box = 141.4, pu = (e.pad || 0) / e.size * box;
  if (e.extra && !e.over) { g.globalAlpha = 0.85; g.drawImage(e.extra, x - box / 2, Y0 - box / 2, box, box); g.globalAlpha = 1; }
  g.drawImage(e.img, x - box / 2 - pu, Y0 - box / 2 - pu, box + pu * 2, box + pu * 2);
  if (e.extra && e.over) { g.globalAlpha = 0.85; g.drawImage(e.extra, x - box / 2, Y0 - box / 2, box, box); g.globalAlpha = 1; }
}

// ---- a hero beside the wall, for size (the Archer: head r 22, its 220 box drawn 86.4 across)
{
  const hx = 240, hy = Y0 + 52, box = 22 * 220 / 56, px = Math.round(box * S);
  const sh = g.createRadialGradient(hx, hy + 2, 2, hx, hy + 2, 34); sh.addColorStop(0, 'rgba(16,10,24,0.34)'); sh.addColorStop(1, 'rgba(16,10,24,0)');
  g.fillStyle = sh; g.beginPath(); g.arc(hx, hy + 2, 34, 0, Math.PI * 2); g.fill();
  const im = await img('art/heroes/archer.svg'), pad = 12;
  const hc = document.createElement('canvas'); hc.width = hc.height = px + pad * 2; hc.getContext('2d').drawImage(im, pad, pad, px, px);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const X = Math.round((hx - box / 2) * S) - pad, Y = Math.round((hy - box / 2) * S) - pad;
  g.drawImage(growInk(hc, OUTLINE * S, INK), X, Y); g.drawImage(hc, X, Y); g.restore();
}
window.SCENE_DONE = true;
