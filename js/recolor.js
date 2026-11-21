// Variants by recolour (round 9: "Colour variations / maybe slightly different accents, that have different abilities
// and kits"). A def can say { variantOf: 'goblin', hue: 25, sat: 1.1, light: -0.05, accent: { from: 0, range: 40, hue: 200 } }
// and its sprite is the base kind's art with every colour turned at load time: no new art.
//   hue: degrees added to every colour's hue; sat: saturation x; light: lightness + (-1..1);
//   accent: colours whose hue is within `range` degrees of `from` (and not near-grey) take accent.hue (absolute, degrees),
//           accent.sat (x) and accent.light (+) instead, so a cap or a cloth can change on its own.
// The outline is added after (parts.js INK), so it stays black. SVG art is turned in its text (fill, stroke,
// stop-color, style); procedural sprites (rats, slimes) are turned pixel by pixel on the canvas.

function rgb2hsl(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
  }
  return [h, s, l];
}
function hsl2rgb(h, s, l) {
  if (s <= 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = ((t % 1) + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
const cl = (x) => Math.max(0, Math.min(1, x));

// One colour (0-255 each) through the spec.
export function recolorRGB(r, g, b, spec) {
  let [h, s, l] = rgb2hsl(r / 255, g / 255, b / 255);
  const A = spec.accent;
  let hit = false;
  if (A && s > 0.12) { let dh = Math.abs(h * 360 - A.from) % 360; if (dh > 180) dh = 360 - dh; hit = dh <= (A.range ?? 30); }
  if (hit) { h = (A.hue ?? (h * 360)) / 360; s = cl(s * (A.sat ?? 1)); l = cl(l + (A.light ?? 0)); }
  else { h = (h + (spec.hue || 0) / 360 + 1) % 1; s = cl(s * (spec.sat ?? 1)); l = cl(l + (spec.light || 0)); }
  const [R, G, B] = hsl2rgb(h, s, l);
  return [Math.round(R * 255), Math.round(G * 255), Math.round(B * 255)];
}
const hex2 = (n) => n.toString(16).padStart(2, '0');

// Every colour in an SVG's text, turned. Leaves url(#id) and href="#id" references alone.
export function recolorSvgText(text, spec) {
  if (!spec) return text;
  const one = (hex) => {
    const x = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const n = parseInt(x, 16), [r, g, b] = recolorRGB(n >> 16, (n >> 8) & 255, n & 255, spec);
    return '#' + hex2(r) + hex2(g) + hex2(b);
  };
  return text
    .replace(/(url\(|href=")?#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g, (m, ref, h) => (ref ? m : one(h)))
    .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/g, (m, r, g, b, a) => {
      const [R, G, B] = recolorRGB(+r, +g, +b, spec);
      return a ? `rgba(${R},${G},${B}${a})` : `rgb(${R},${G},${B})`;
    });
}

// A canvas turned in place (procedural sprites).
export function recolorCanvas(c, spec) {
  if (!spec) return c;
  const g = c.getContext('2d');
  let d; try { d = g.getImageData(0, 0, c.width, c.height); } catch { return c; }
  const a = d.data, memo = new Map();
  for (let i = 0; i < a.length; i += 4) {
    if (!a[i + 3]) continue;
    const key = (a[i] << 16) | (a[i + 1] << 8) | a[i + 2];
    let v = memo.get(key);
    if (!v) { v = recolorRGB(a[i], a[i + 1], a[i + 2], spec); memo.set(key, v); }
    a[i] = v[0]; a[i + 1] = v[1]; a[i + 2] = v[2];
  }
  g.putImageData(d, 0, 0);
  return c;
}

// The recolour part of a def (null if it has none).
export function specOf(d) {
  if (!d || (d.hue == null && d.sat == null && d.light == null && !d.accent)) return null;
  return { hue: d.hue || 0, sat: d.sat ?? 1, light: d.light || 0, accent: d.accent || null };
}
// A variant's art: the base file with its recolour in the address's fragment (parts.js loadArt reads it back), so each
// variant is its own cached rig without a file of its own.
export const variantUrl = (art, spec) => (art && spec ? art.split('#')[0] + '#v=' + encodeURIComponent(JSON.stringify(spec)) : art);
export function parseVariantUrl(url) {
  const i = url.indexOf('#v=');
  if (i < 0) return { file: url, spec: null };
  try { return { file: url.slice(0, i), spec: JSON.parse(decodeURIComponent(url.slice(i + 3))) }; } catch { return { file: url.slice(0, i), spec: null }; }
}
