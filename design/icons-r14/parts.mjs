// Painted pieces the styles share (style A's emblems, style C's scenes): each returns a list of parts for Ctx.obj().
// All are drawn about (0,0) and placed with a transform.
import { path, circle, ellipse, rect, burst } from './kit.mjs';

const T = (parts, t) => parts.map((p) => ({ ...p, t: t + (p.t ? ' ' + p.t : '') }));
export const place = T;

// The Paladin's heater shield, face on: gold rim, blue face, the lit half on the left. About 34 x 44.
export function shield(face = 'blue', rim = 'gold') {
  const f = 'M-12.4-14Q0-18.4 12.4-14L12.4 0Q12.4 12 0 18.2Q-12.4 12-12.4 0Z';
  return [
    { s: path('M-17-18.5Q0-24.5 17-18.5L17 0Q17 16.5 0 24.5Q-17 16.5-17 0Z'), f: rim, hi: [path('M-17-19Q0-25 17-19L17-15Q0-21-17-15Z')], hio: 0.35 },
    { s: path(f), f: face, noOutline: true, sh: [path('M0-20H14V20H0Z')], sho: 0.2, hi: [at2('M-8.6-10.6Q-4.6-12.2-1.6-12.4', 2.4)], hio: 0.7,
      raw: `<path d="${f}" fill="none" stroke="#2B2230" stroke-width="2.6" opacity=".55"/>` },
  ];
}
function at2(d, w) { return `<path d="${d}" stroke-width="${w}"/>`; }
export const streak = at2;

// An arrow along +x: tail at 0, tip at L. head: 'steel' | 'frost'.
export function arrow(L, { head = 'steel', fletch = 'red', shaft = 'wood', big = 1, w = 3.2 } = {}) {
  const h = 11 * big, hw = 6.4 * big;
  const parts = [
    { s: path(`M4 0H${L - h + 2}`), f: shaft, w, k: 0.35 },
    { s: path(`M${L} 0L${L - h}-${hw}L${L - h + 3.4 * big} 0L${L - h} ${hw}Z`), f: head, sh: [path(`M${L - h - 2} 0H${L + 2}V${hw + 2}H${L - h - 2}Z`)], sho: 0.2 },
  ];
  if (fletch) parts.push({ s: path('M1 0L-3.4-6H6.4L10.4 0L6.4 6H-3.4Z'), f: fletch, sh: [path('M-5 0H12V8H-5Z')], sho: 0.22 });
  return parts;
}

// The Berserker's flail head: a steel ball with spikes. r is the ball's radius.
export function spikeBall(r = 10, n = 8) {
  return [
    { s: burst(0, 0, r * 1.62, r * 0.82, n, -90 + 180 / n), f: 'bone' },
    { s: circle(0, 0, r), f: 'steelDk', noOutline: true, hi: [circle(-r * 0.34, -r * 0.36, r * 0.3)], hio: 0.7, sh: [path(`M${-r} ${r * 0.2}A${r} ${r} 0 0 0 ${r} ${r * 0.2}V${r + 2}H${-r}Z`)], sho: 0.2,
      raw: `<circle r="${r}" fill="none" stroke="#2B2230" stroke-width="2.2" opacity=".6"/>` },
  ];
}

// Twinfang's fang dagger, point down: white curved blade, gold guard, dark grip, gold pommel. About 20 x 58.
export function fang() {
  return [
    { s: rect(-3.3, -17, 6.6, 16, 2), f: 'grip', ink: [path('M-4-12L4-10M-4-7L4-5')], inkw: 1.3 },
    { s: circle(0, -18.5, 4.2), f: 'gold' },
    { s: path('M-6.4 2C-9.6 14-10.4 26-7 38C0.4 28.6 5.6 16 5.6 2Z'), f: 'white', sh: [path('M-1 0C-2 12-4 26-7 38C0.4 28.6 5.6 16 5.6 2Z')], shc: '#8A94A6', sho: 0.45 },
    { s: rect(-10, -3.4, 20, 6.8, 3.2), f: 'gold', hi: [rect(-10, -3.4, 20, 2.4, 0)], hio: 0.4 },
  ];
}

// A straight knife, point up (the trinket's little knives). About 14 x 42.
export function knife(blade = 'steel') {
  return [
    { s: rect(-3, 6, 6, 13, 2.4), f: 'leather' },
    { s: path('M0-23L5.6-14V5H-5.6V-14Z'), f: blade, sh: [path('M0-24V6H7V-24Z')], shc: '#7D879A', sho: 0.45 },
    { s: rect(-7.6, 3, 15.2, 5, 2.4), f: 'goldDk' },
  ];
}

// A wolf's head and neck in profile, looking right, mouth open in a howl; turn it up with a rotate. The neck runs off
// to the lower left so a tile can crop it (a bust). About 64 x 56.
export const wolfD = path('M-36 4L-14-6L-17-22Q-8-18-4-12.5C3-13.5 8-11 12-8.6L23-6.6Q28-6 27-2.4Q18 1.6 9 3.6Q16 6 21.4 9Q23.4 12 19.6 12.6Q10 13.6 4.6 12.4C-1 15-3 19-3.6 23.4L-9.6 23L-11.6 29L-26 33Z');
export function wolfHead() {
  return [
    { s: wolfD, f: 'wolf',
      hi: [path('M27-2.4Q18 1.6 9 3.6Q16 6 21.4 9Q23.4 12 19.6 12.6Q10 13.6 4.6 12.4C-1 15-3 19-3.6 23.4L-9.6 23L-11.6 29L-26 33L-29 27C-19 25-11 18-7 10C-4 4 4-1.6 12-4.4Q18-6.2 23-6.6Q28-6 27-2.4Z')], hic: '#F2F5FA', hio: 0.72,
      sh: [path('M-36 4L-14-6L-17-22Q-12-20-9.6-17C-10.6-10-13-3-19 3C-25 9-30 12-35 13Z')], shc: '#2B2F45', sho: 0.24,
      ink: [path('M3.4-4.6Q6.4-6.8 9.6-4.6')], inkw: 2.2,
      raw: '<path d="M23-7.4Q28-6.6 27-2.6L22.6-1.2Q21.6-4.6 23-7.4Z" fill="#2B2230"/><path d="M-14.4-17.6Q-9.6-15.6-7-12L-11.6-7.6Z" fill="#E8A0A8" opacity=".9"/><path d="M12.6 3L14.4 6.6L16.4 2Z" fill="#FFFFFF"/>' },
  ];
}

// A skull, face on (the Necromancer's): dome, cheeks, jaw; eyes take a colour (glow). About 34 x 38.
export function skull(eye = '#2B2230', glow) {
  const d = 'M0-19C11.6-19 17-11.4 17-2.4C17 3.6 14.4 7.4 11.4 9.4V15.6Q11.4 18.6 8.4 18.6H-8.4Q-11.4 18.6-11.4 15.6V9.4C-14.4 7.4-17 3.6-17-2.4C-17-11.4-11.6-19 0-19Z';
  return [
    { s: path(d), f: 'bone', sh: [path('M3-20H18V20H7Q10 4 3-20Z')], shc: '#8A7A58', sho: 0.28,
      raw: `${glow ? `<ellipse cx="-6.6" cy="-1" rx="6.4" ry="6.8" fill="${glow}" opacity=".5"/><ellipse cx="6.6" cy="-1" rx="6.4" ry="6.8" fill="${glow}" opacity=".5"/>` : ''}
        <ellipse cx="-6.6" cy="-1" rx="4.5" ry="5" fill="#2B2230"/><ellipse cx="6.6" cy="-1" rx="4.5" ry="5" fill="#2B2230"/>
        ${eye !== '#2B2230' ? `<circle cx="-6.6" cy="-0.6" r="2.3" fill="${eye}"/><circle cx="6.6" cy="-0.6" r="2.3" fill="${eye}"/>` : ''}
        <path d="M0 5.4L2.4 9.6H-2.4Z" fill="#2B2230"/><path d="M-5.6 12.6V19M0 12.6V19M5.6 12.6V19" stroke="#2B2230" stroke-width="1.8" fill="none"/>` },
  ];
}

// A bony hand reaching up out of the ground (wrist at the bottom). About 34 x 46.
export function boneHand() {
  const finger = (x, y, len, a, w = 5.6) => ({ s: rect(-w / 2, -len, w, len + 3, w / 2), f: 'bone', t: `translate(${x} ${y}) rotate(${a})`, ink: [path(`M${-w / 2} ${-len * 0.48}H${w / 2}`)], inkw: 1.5 });
  return [
    { s: rect(-4.2, 6, 8.4, 24, 3), f: 'bone', sh: [rect(0.6, 6, 6, 24)], shc: '#8A7A58', sho: 0.3 },
    finger(-11.4, 3, 9.5, -62, 5.8),
    finger(-8.2, -6.4, 12, -20), finger(-2.8, -8, 15.5, -5), finger(3, -8, 14.5, 9), finger(8.2, -5.6, 11, 24),
    { s: path('M-10.6 8.6Q-12.6-3-8.4-8H8.6Q12.6-3 10.4 8.6Q0 12.6-10.6 8.6Z'), f: 'bone', sh: [path('M2-9H14V12H4Q7 2 2-9Z')], shc: '#8A7A58', sho: 0.28, ink: [path('M-4.6-4V2M0.4-4.6V2.4M5.2-4V2')], inkw: 1.3 },
  ];
}

// A boot in profile, toe to the right. About 40 x 46, sole on y = 22.
export function boot(body = 'tan', cuff = 'leaf') {
  return [
    { s: path('M-14-20H3V1L15 7Q20 9.6 20 15V22H-16V-4Z'), f: body, sh: [path('M-18 14.6H22V24H-18Z')], shc: '#2B2230', sho: 0.5, hi: [streak('M-9.6-13V-1', 3.4)], hio: 0.35 },
    { s: rect(-17.4, -24.4, 23, 9, 3.6), f: cuff },
  ];
}

// A heart. About 52 x 46 about (0,0).
export const heartD = 'M0 23C-19 10-26 1-26-8.4A13 13 0 0 1 0-12.6A13 13 0 0 1 26-8.4C26 1 19 10 0 23Z';
export function heart(f = 'red') {
  return [{ s: path(heartD), f, sh: [path('M0 23C19 10 26 1 26-8.4Q26-14 23-17Q22 0 0 14Z')], sho: 0.22, hi: [streak('M-18.6-9.4Q-18-15 -12.4-16.4', 4.2)], hio: 0.75 }];
}

// A sword, point up: steel blade with a lit and a shaded half, gold guard, wrapped grip, pommel. About 30 x 60.
export function sword({ blade = 'steel', guard = 'gold', w = 6.2, len = 34 } = {}) {
  return [
    { s: rect(-3.4, 8, 6.8, 13, 1.6), f: 'leather', ink: [path('M-4 12L4 14M-4 16L4 18')], inkw: 1.3 },
    { s: circle(0, 23.4, 4.6), f: guard },
    { s: path(`M0-${len}L${w}-${len - 8}V6H-${w}V-${len - 8}Z`), f: blade, sh: [path(`M0-${len + 2}H${w + 2}V8H0Z`)], shc: '#7D879A', sho: 0.5 },
    { s: rect(-13, 3, 26, 6.6, 3.2), f: guard, hi: [rect(-13, 3, 26, 2.2)], hio: 0.4 },
  ];
}

// A bow, drawn, with an arrow on the string pointing +x. Fat on purpose: it has to read at 14 px. About 54 x 58.
export function bow() {
  return [
    { s: path('M-6-24L-14 0L-6 24'), f: '#EDE6D0', w: 3 },
    { s: path('M-6-25Q24-14 24 0Q24 14-6 25'), f: 'tan', w: 8.6, k: 0.35 },
    { s: path('M-14 0H24'), f: 'bone', w: 5, k: 0.4 },
    { s: path('M38 0L20-10.4L24 0L20 10.4Z'), f: 'steel' },
  ];
}

// A hero's hooded head from above, as the game shows it (the Archer's: leaf-green hood, gold brow band). About 30 x 38.
export function hood(cloth = 'leaf', band = 'gold') {
  return [
    { s: circle(0, 7.4, 10.6), f: '#F2C7A0', raw: '<path d="M-3.4 12.6Q0 14.6 3.4 12.6" fill="none" stroke="#B07560" stroke-width="1.6" stroke-linecap="round"/>' },
    { s: path('M0-19C10-14 15.4-4.6 14.4 6Q13.4 10 10.8 9Q0 2.4-10.8 9Q-13.4 10-14.4 6C-15.4-4.6-10-14 0-19Z'), f: cloth,
      sh: [path('M0-20C5-10 5 0 0 5.4L16 12V-20Z')], sho: 0.2, hi: [streak('M-8.6-3.6Q-7.6-9.6-3.4-13', 2.6)], hio: 0.5,
      raw: '<path d="M-11.4 8.4Q0 1.6 11.4 8.4" fill="none" stroke="#2B2230" stroke-width="5.4" stroke-linecap="round"/><path d="M-11.4 8.4Q0 1.6 11.4 8.4" fill="none" stroke="#F2C14E" stroke-width="2.6" stroke-linecap="round"/>' },
  ];
}

// A puff of dust or smoke: three lobes.
export const puff = (x, y, r) => path(`M${x - r} ${y}a${r * 0.62} ${r * 0.62} 0 0 1 ${r * 0.7}-${r * 0.6}a${r * 0.7} ${r * 0.7} 0 0 1 ${r * 1.1} ${r * 0.1}a${r * 0.5} ${r * 0.5} 0 0 1 ${r * 0.2} ${r}h-${r * 1.7}a${r * 0.5} ${r * 0.5} 0 0 1-${r * 0.3}-${r * 0.5}z`);
export { ellipse, circle, rect, path };
