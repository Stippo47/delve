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
export const OUTLINE = 2.4;
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
