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
