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
