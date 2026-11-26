// The two look settings lane V adds (round 8): how puddles and spills look on the ground (js/puddles.js) and how an
// enemy shows its health once hurt (js/hpstyle.js). Four of each. The settings tab reads and sets them through here:
// when lane V's modules are in the build, their own lists and setters are used (so the renderer's cached choice
// changes at once); before that, the same names and localStorage keys stand in.
let PV = null, HV = null;
export async function loadLooks() {
  try { PV = await import('./puddles.js'); } catch { PV = null; }
  try { HV = await import('./hpstyle.js'); } catch { HV = null; }
}
const read = (k) => { try { const n = +localStorage.getItem(k); return n >= 1 && n <= 4 ? n : 1; } catch { return 1; } };
const write = (k, n) => { try { localStorage.setItem(k, String(n)); } catch {} };

const PUDDLES = [
  { id: 1, name: 'Inked', blurb: 'Cartoon blobs with the same ink outline as the units.' },
  { id: 2, name: 'Soft', blurb: 'No outline: soft-edged, see-through pools.' },
  { id: 3, name: 'Bands', blurb: 'Hard toon bands, dark rim to light middle.' },
  { id: 4, name: 'Splat', blurb: 'Ragged splats with drips and droplets.' },
];
const EHP = [
  { id: 1, name: 'Bar', blurb: 'A short slim bar under the feet.' },
  { id: 2, name: 'Arc', blurb: 'A curved gauge hugging the bottom of the body.' },
  { id: 3, name: 'Pips', blurb: 'A row of little pips over the head.' },
  { id: 4, name: 'Wash', blurb: 'No gauge: the figure darkens and reddens.' },
];
export const puddleStyles = () => (PV && PV.PUDDLE_STYLES) || PUDDLES;
export const hpStyles = () => (HV && HV.EHP_STYLES) || EHP;
export const puddleStyle = () => (PV ? PV.puddleStyle() : read('delve.puddle'));
export const hpStyle = () => (HV ? HV.ehpStyle() : read('delve.ehp'));
export const setPuddleStyle = (n) => (PV ? PV.setPuddleStyle(+n) : write('delve.puddle', +n));
export const setHpStyle = (n) => (HV ? HV.setEhpStyle(+n) : write('delve.ehp', +n));

// Little pictures for the settings tiles: four pools (oil, fire, gas, water) in each style.
const POOL = ['#4A3E5C', '#E8582A', '#9BCB3C', '#5FA8F0'];
export function puddleSwatch(l) {
  const blob = (c, i) => {
    const x = 4 + i * 15, d = `M${x} 17c0-6 4-9 7.5-9s7.5 2 7.5 7-3.5 9-7.5 9-7.5-2-7.5-7z`;
    if (l.id === 1) return `<path d="${d}" fill="${c}" stroke="#1A1424" stroke-width="2"/><ellipse cx="${x + 5}" cy="13" rx="2.6" ry="1.4" fill="#fff" opacity=".6"/>`;
    if (l.id === 2) return `<path d="${d}" fill="${c}" opacity=".55"/><path d="M${x + 2} 16c0-3 2-5 5.5-5s5.5 1 5.5 4-2 6-5.5 6-5.5-2-5.5-5z" fill="${c}" opacity=".5"/>`;
    if (l.id === 3) return `<path d="${d}" fill="#000" opacity=".35"/><path d="M${x + 1.6} 16.5c0-4.5 3-7 6-7s6 1.6 6 5.4-3 7-6 7-6-1.6-6-5.4z" fill="${c}"/><circle cx="${x + 5}" cy="13.5" r="1.4" fill="#fff"/>`;
    return `<path d="M${x} 16l3-6 3 3 4-4 2 6 3 3-5 4-5-1-4 2z" fill="${c}" stroke="${c}" stroke-width="1"/><circle cx="${x + 14}" cy="25" r="1.6" fill="${c}"/>`;
  };
  return `<svg viewBox="0 0 64 32">${POOL.map(blob).join('')}</svg>`;
}
export function hpSwatch(l) {
  const body = (c = '#C9C2B0') => `<circle cx="32" cy="15" r="8" fill="${c}"/>`;
  if (l.id === 1) return `<svg viewBox="0 0 64 32">${body()}<rect x="22" y="26" width="20" height="3.6" rx="1.8" fill="#000" opacity=".5"/><rect x="22" y="26" width="12" height="3.6" rx="1.8" fill="#E0604B"/></svg>`;
  if (l.id === 2) return `<svg viewBox="0 0 64 32">${body()}<path d="M22 22a12 8 0 0 0 20 0" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="3"/><path d="M22 22a12 8 0 0 0 12 4.6" fill="none" stroke="#E0604B" stroke-width="3" stroke-linecap="round"/></svg>`;
  if (l.id === 3) return `<svg viewBox="0 0 64 32">${body()}${[0, 1, 2, 3, 4].map((i) => `<circle cx="${24 + i * 4}" cy="3.5" r="1.6" fill="${i < 3 ? '#E0604B' : '#000'}" opacity="${i < 3 ? 1 : 0.4}"/>`).join('')}</svg>`;
  return `<svg viewBox="0 0 64 32">${body('#8A4A44')}<circle cx="32" cy="15" r="8" fill="none" stroke="#E0604B" stroke-opacity=".6" stroke-width="2"/></svg>`;
}

// ---------------------------------------------------------------- round 19 (lane looks19): the two looks being tried
// The designer: "tried coloured outlines depending on the colour of the entity. I'm exploring looks." and "I want to
// see what they look like pixelated". Settings: Outline colour (util.js OLCOL / setOlColor) and Pixel look (util.js
// PIXEL / setPixel), with a little picture each.
import { inkPreview, INK as INK_C } from './util.js';
export const OL_LOOKS = [
  { id: 'ink', name: 'Ink', blurb: 'One dark ink line round everything, as before.' },
  { id: 'mid', name: 'Own colour', blurb: 'Every part ringed in a dark shade of its own colour.' },
  { id: 'light', name: 'Own colour, bright', blurb: 'A lighter shade: more colour, a softer edge.' },
  { id: 'figure', name: 'One colour each', blurb: 'Each thing ringed in one shade: its main colour.' },
];
// four little figures: a red blob, a blue one with a gold hilt, a green one, a bone-white one
export function olSwatch(l) {
  const ring = (c) => (l.id === 'ink' ? INK_C : inkPreview(c, l.id));
  const one = (main, part) => (l.id === 'figure' ? ring(main) : ring(part));
  const fig = (x, main, part) => `<circle cx="${x}" cy="17" r="5.4" fill="${main}" stroke="${ring(main)}" stroke-width="2.6"/><rect x="${x + 2.5}" y="6" width="3.4" height="7" rx="1.2" fill="${part}" stroke="${one(main, part)}" stroke-width="2"/>`;
  return `<svg viewBox="0 0 64 32"><rect x="0" y="0" width="64" height="32" rx="6" fill="#B9B5B2"/>${fig(9, '#D9534F', '#E8C26A')}${fig(24.5, '#3F7AC4', '#E8C26A')}${fig(40, '#7FB04A', '#B07A4A')}${fig(55.3, '#EDE3CB', '#9AA0AA')}</svg>`;
}
export const PX_LOOKS = [
  { id: 0, name: 'Off', blurb: 'Sharp, as it has always been.' },
  { id: 2, name: 'Small pixels', blurb: 'Each pixel 2 points across.' },
  { id: 3, name: 'Medium pixels', blurb: 'Each pixel 3 points across.' },
  { id: 4, name: 'Big pixels', blurb: 'Each pixel 4 points across.' },
];
// a red blob with its outline and a glint, drawn on a grid of the look's pixels (smooth for Off)
export function pxSwatch(l) {
  const bg = '<rect x="0" y="0" width="64" height="32" rx="6" fill="#B9B5B2"/>', R = 8.5, cx = 32, cy = 16;
  if (!l.id) return `<svg viewBox="0 0 64 32">${bg}<circle cx="${cx}" cy="${cy}" r="${R}" fill="#D9534F" stroke="${INK_C}" stroke-width="2.4"/><circle cx="${cx - 3}" cy="${cy - 3}" r="2.5" fill="#F2A098"/></svg>`;
  const c = l.id * 1.35, out = [];
  const n = Math.ceil((R + c) / c) + 1; // (the grid centred on the blob, so each size comes out round)
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) { const gx = cx - c / 2 + i * c, gy = cy - c / 2 + j * c;
    const d = Math.hypot(gx + c / 2 - cx, gy + c / 2 - cy), dh = Math.hypot(gx + c / 2 - (cx - 3), gy + c / 2 - (cy - 3));
    const f = d < R ? (dh < 2.8 ? '#F2A098' : '#D9534F') : d < R + c ? INK_C : null;
    if (f) out.push(`<rect x="${gx.toFixed(2)}" y="${gy.toFixed(2)}" width="${(c + 0.05).toFixed(2)}" height="${(c + 0.05).toFixed(2)}" fill="${f}"/>`);
  }
  return `<svg viewBox="0 0 64 32" shape-rendering="crispEdges">${bg}${out.join('')}</svg>`;
}
