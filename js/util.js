// Small shared helpers: maths, random, colours.

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));
export const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
export const wrapAngle = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
export const angleDiff = (a, b) => Math.abs(wrapAngle(a - b));

// Seedable RNG so runs can be replayed in tests.
let seed = (Math.random() * 2 ** 32) >>> 0;
export function setSeed(s) { seed = s >>> 0; }
export const getSeed = () => seed; // stats probes (numbers.js) put the run's dice back as they were
export function rand() {
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const rrange = (a, b) => a + rand() * (b - a);
export const rint = (a, b) => Math.floor(rrange(a, b + 1));
export const pick = (arr) => arr[Math.floor(rand() * arr.length)];
export const chance = (p) => rand() < p;

// Weighted pick with softmax temperature: higher temp = more variance.
export function softmaxPick(scores, temp) {
  const t = Math.max(0.02, temp);
  let max = -Infinity;
  for (const s of scores) if (s > max) max = s;
  let sum = 0;
  const w = scores.map((s) => { const e = Math.exp((s - max) / t); sum += e; return e; });
  let r = rand() * sum;
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return w.length - 1;
}

export const INK = '#2B2230';
// One outline thickness for everything with an outline, in room units (round 19, lane outline19: "check that outline
// thickness is consistent everywhere"). The renderer draws it round every unit, summon, prop and thrown thing at this
// width whatever its size (parts.js, sprites.js getProp); code drawings stroke OUTLINE * 2 (half of it outside).
// (round 19, lane looks19: a live binding, so the pixel look can hold it at one pixel: setOutlineWidth)
export let OUTLINE = 2.4;
export const OUTLINE_BASE = 2.4;
export function setOutlineWidth(v) { OUTLINE = v; }
// Round 19 (lane toggles19; the designer: "Give me an option to turn off outlines and hp bars completely in settings"):
// whether the ink outline is drawn at all (Settings, Outlines; ?outlines=0 / 1 for testing, not saved). A live binding:
// every ink pass reads it (if (OUTLINES) ...), so a flip shows on the next frame. Cached pictures that bake an outline
// in (the floor, the camp's still background, props, the procedural sprites) put OUTLINES in their cache key, so they
// are painted again once when it changes; the parts' rigs keep their ink copies and simply don't draw them.
// (canvas ignores lineWidth = 0, so an ink pass is skipped, never drawn at width 0)
const OL_KEY = 'delve.outlines';
const readFlag = (q, key) => {
  try { const v = new URLSearchParams(location.search).get(q); if (v === '0' || v === '1') return v === '1'; } catch {}
  try { const v = localStorage.getItem(key); if (v === '0' || v === '1') return v === '1'; } catch {}
  return true;
};
export let OUTLINES = readFlag('outlines', OL_KEY);
export function setOutlines(on) { OUTLINES = !!on; try { localStorage.setItem(OL_KEY, OUTLINES ? '1' : '0'); } catch {} return OUTLINES; }
export { readFlag };

// ---------------------------------------------------------------- the outline's colour (round 19, lane looks19)
// The designer: "This might be easier said than done. But tried coloured outlines depending on the colour of the entity.
// I'm exploring looks." Settings, Outline colour (Ink / Own colour, with a shade): with Own colour every thing's outline
// is a dark shade of its own colour: a red slime's dark red, a blue robe's dark blue, a grey boulder's dark grey.
// inkFor(fill) is the one helper: give it the fill a thing is painted with (a colour string, or a gradient: its stops
// are noted as they are added, below) and it gives back the outline's colour, INK while the setting is Ink. Pictures
// (the SVG figures, props) take their own colour from their pixels (parts.js, sprites.js), through inkRGB / OLCOL.
// Cached pictures that bake an outline in put OLKEY in their cache key, as they do OUTLINES.
// The shade: the colour mixed toward INK (a cool dark purple: shadows lean cool, the way pixel art shades) by OLCOL.k.
// k: how far toward INK at least; cap: the lightest an outline may come out (a luminance, 0-1), so a white or pale thing
// (bone, snow, a cleric's robe) still gets an edge that reads on a pale floor: it is taken further toward INK.
export const OL_SHADES = { dark: { k: 0.72, cap: 0.2 }, mid: { k: 0.58, cap: 0.27 }, light: { k: 0.45, cap: 0.35 } };
const OC_KEY = 'delve.olcolor';
const OL_HOWS = new Set(['pixel', 'part', 'figure']);
function readOl() {
  let v = null, k = null, how = null;
  try { const q = new URLSearchParams(location.search); v = q.get('olcolor'); k = q.get('olk'); how = q.get('olhow'); } catch {}
  if (!v) { try { v = localStorage.getItem(OC_KEY); } catch {} }
  return olOf(v, k, how);
}
function olOf(v, k, how) {
  const own = !!v && v !== 'ink';
  // 'figure': one colour for each whole thing (its commonest colour), at the middle shade
  const sh = OL_SHADES[v] || OL_SHADES.mid;
  const kk = k != null && isFinite(+k) && +k > 0 ? clamp(+k > 1 ? +k / 100 : +k, 0.05, 0.98) : sh.k;
  const hw = OL_HOWS.has(how) ? how : v === 'figure' ? 'figure' : 'pixel';
  return { own, name: own ? (OL_SHADES[v] || v === 'figure' ? v : 'mid') : 'ink', k: kk, cap: sh.cap, how: hw, key: own ? 'o' + kk + ':' + sh.cap + hw : 'ink' };
}
export let OLCOL = readOl();
export let OLKEY = OLCOL.key;
// v: 'ink' | 'dark' | 'mid' | 'light' | 'figure' (saved; ?olcolor= for testing, ?olk=0.6 a shade of its own,
// ?olhow=pixel|part|figure: each pixel's own colour (the default), each part's, the whole figure's)
export function setOlColor(v) { OLCOL = olOf(v, null, null); OLKEY = OLCOL.key; inkCache.clear(); try { localStorage.setItem(OC_KEY, OLCOL.name); } catch {} return OLCOL; }
const INK_RGB = [0x2B, 0x22, 0x30];
const hex2 = (v) => (v < 16 ? '0' : '') + v.toString(16);
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, INK_Y = lum(...INK_RGB);
// how far one colour goes toward INK: at least OLCOL.k, more for a light colour (no lighter than OLCOL.cap)
export function shadeK(r, g, b, sh = OLCOL) { const y = lum(r, g, b), c = sh.cap; let k = sh.k; if (y * (1 - k) + INK_Y * k > c && y > c) k = Math.max(k, (y - c) / (y - INK_Y)); return k; }
// the shade a colour would get under a named setting (Settings' swatches)
export function inkPreview(fill, name) {
  const sh = OL_SHADES[name === 'figure' ? 'mid' : name], c = parseColor(fill); if (!sh || !c) return INK;
  const k = shadeK(c[0], c[1], c[2], sh), j = 1 - k;
  return '#' + hex2(Math.round(c[0] * j + INK_RGB[0] * k)) + hex2(Math.round(c[1] * j + INK_RGB[1] * k)) + hex2(Math.round(c[2] * j + INK_RGB[2] * k));
}
// the shade of one colour, as '#rrggbb'
export function inkRGB(r, g, b) {
  const k = shadeK(r, g, b), j = 1 - k;
  return '#' + hex2(Math.round(r * j + INK_RGB[0] * k)) + hex2(Math.round(g * j + INK_RGB[1] * k)) + hex2(Math.round(b * j + INK_RGB[2] * k));
}
// the same on pixels in place (an ImageData's array): parts.js's per-pixel outline
export function shadePixels(a) {
  for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const r = a[i], g = a[i + 1], b = a[i + 2], k = shadeK(r, g, b), j = 1 - k;
    a[i] = r * j + INK_RGB[0] * k; a[i + 1] = g * j + INK_RGB[1] * k; a[i + 2] = b * j + INK_RGB[2] * k; }
}
// '#rgb' / '#rrggbb' / '#rrggbbaa' / 'rgb(...)' / 'rgba(...)' -> [r, g, b, a] or null
export function parseColor(c) {
  if (typeof c !== 'string') return null;
  if (c[0] === '#') {
    let h = c.slice(1); if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16); if (!isFinite(n)) return null;
    return [n >> 16, (n >> 8) & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1];
  }
  const m = /^rgba?\(([^)]+)\)/i.exec(c); if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
  return p.length >= 3 ? [p[0], p[1], p[2], p.length > 3 ? p[3] : 1] : null;
}
const inkCache = new Map();
// The outline's colour for a thing painted with fill (INK while the setting is Ink, or for a fill it can't read).
export function inkFor(fill) {
  if (!OLCOL.own || fill == null) return INK;
  if (typeof fill === 'string') {
    let v = inkCache.get(fill); if (v) return v;
    const c = parseColor(fill); v = c ? inkRGB(c[0], c[1], c[2]) : INK;
    if (inkCache.size > 4000) inkCache.clear();
    inkCache.set(fill, v); return v;
  }
  if (typeof fill === 'function') return inkFor(fill());
  const st = fill._st; // a gradient: the mean of its stops, each weighted by how solid it is
  if (st && st.length) {
    if (fill._ink && fill._ink[0] === OLKEY) return fill._ink[1];
    let r = 0, g = 0, b = 0, w = 0;
    for (const s of st) { const c = parseColor(s); if (!c) continue; const a = Math.max(0.05, c[3]); r += c[0] * a; g += c[1] * a; b += c[2] * a; w += a; }
    const v = w ? inkRGB(r / w, g / w, b / w) : INK; fill._ink = [OLKEY, v]; return v;
  }
  return INK;
}
// a gradient remembers its colour stops (for inkFor). Nothing here outside a browser.
try {
  const P = CanvasGradient.prototype, add = P.addColorStop;
  if (!P._olNoted) { P._olNoted = true; P.addColorStop = function (o, c) { (this._st || (this._st = [])).push(c); return add.call(this, o, c); }; }
} catch {}

// ---------------------------------------------------------------- the pixel look (round 19, lane looks19)
// The designer: "I want to see what they look like pixelated". Settings, Pixel look (Off / 2 / 3 / 4): the fight is
// drawn at a lower resolution, one pixel every PIXEL screen points, and scaled up without smoothing (render.js), so the
// whole room reads as pixel art; the HUD, menus and cards stay sharp. ?pixel=0|2|3|4 for testing (not saved).
const PX_KEY = 'delve.pixel';
export const PIXEL_SIZES = [0, 2, 3, 4];
function readPixel() {
  try { const v = new URLSearchParams(location.search).get('pixel'); if (v != null && isFinite(+v)) return clamp(+v, 0, 8); } catch {}
  try { const v = localStorage.getItem(PX_KEY); if (v != null && isFinite(+v)) return clamp(+v, 0, 8); } catch {}
  return 0;
}
export let PIXEL = readPixel();
export function setPixel(n) { PIXEL = clamp(+n || 0, 0, 8); try { localStorage.setItem(PX_KEY, String(PIXEL)); } catch {} return PIXEL; }
