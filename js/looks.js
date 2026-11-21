// The two look settings lane V adds (round 8): the style of puddles and spills on the ground, and how an enemy shows
// its health once hurt. Four of each. The renderer reads them with puddleStyle() and hpStyle() (1..4); the settings
// tab lists them. If fx.js / render.js grow their own lists (PUDDLE_STYLES, HP_STYLES), register them here with
// useStyles() and the settings follow.
const read = (k, d) => { try { const n = +localStorage.getItem(k); return n >= 1 && n <= 4 ? n : d; } catch { return d; } };
const write = (k, n) => { try { localStorage.setItem(k, String(n)); } catch {} };
const param = (k) => { try { const n = +new URLSearchParams(location.search).get(k); return n >= 1 && n <= 4 ? n : 0; } catch { return 0; } };

let PUDDLES = [
  { id: 1, name: 'Glossy', blurb: 'Soft pools with a wet shine.' },
  { id: 2, name: 'Flat', blurb: 'Clean flat shapes, two tones.' },
  { id: 3, name: 'Inked', blurb: 'Outlined like the sprites.' },
  { id: 4, name: 'Bubbling', blurb: 'Alive: they bubble and ripple.' },
];
let HPS = [
  { id: 1, name: 'Bar above', blurb: 'A thin bar over the head.' },
  { id: 2, name: 'Ring', blurb: 'A ring round the feet that empties.' },
  { id: 3, name: 'Pips', blurb: 'A row of pips that go out.' },
  { id: 4, name: 'Tint', blurb: 'The enemy darkens as it weakens.' },
];
export function useStyles(o) { if (o.puddles) PUDDLES = o.puddles; if (o.hp) HPS = o.hp; }

export const puddleStyles = () => PUDDLES;
export const hpStyles = () => HPS;
export const puddleStyle = () => param('puddle') || read('delve.puddles', 1);
export const hpStyle = () => param('hpstyle') || read('delve.enemyHp', 1);
export const setPuddleStyle = (n) => write('delve.puddles', +n);
export const setHpStyle = (n) => write('delve.enemyHp', +n);

// Little pictures for the settings tiles.
const POOL = ['#5C4A6E', '#E8582A', '#9BCB3C', '#5FA8F0'];
export function puddleSwatch(l) {
  const blob = (c, i) => {
    const x = 6 + i * 14, d = `M${x} 18c0-6 4-9 7-9s7 2 7 7-3 9-7 9-7-2-7-7z`;
    if (l.id === 1) return `<path d="${d}" fill="${c}" opacity=".85"/><ellipse cx="${x + 5}" cy="14" rx="3" ry="1.6" fill="#fff" opacity=".55"/>`;
    if (l.id === 2) return `<path d="${d}" fill="${c}"/><path d="M${x + 2} 20c2 3 6 3 9 0" stroke="#000" stroke-opacity=".25" stroke-width="3" fill="none"/>`;
    if (l.id === 3) return `<path d="${d}" fill="${c}" stroke="#1A1424" stroke-width="2"/>`;
    return `<path d="${d}" fill="${c}" opacity=".8"/><circle cx="${x + 4}" cy="15" r="1.8" fill="none" stroke="#fff" stroke-opacity=".7"/><circle cx="${x + 9}" cy="19" r="1.2" fill="#fff" opacity=".6"/>`;
  };
  return `<svg viewBox="0 0 62 32">${POOL.map(blob).join('')}</svg>`;
}
export function hpSwatch(l) {
  const body = '<circle cx="31" cy="18" r="8" fill="#C9C2B0"/>';
  if (l.id === 1) return `<svg viewBox="0 0 62 32">${body}<rect x="19" y="4" width="24" height="4" rx="2" fill="#000" opacity=".5"/><rect x="19" y="4" width="14" height="4" rx="2" fill="#E8604C"/></svg>`;
  if (l.id === 2) return `<svg viewBox="0 0 62 32">${body}<ellipse cx="31" cy="27" rx="12" ry="3.4" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="2"/><path d="M19 27a12 3.4 0 0 1 20-2.6" fill="none" stroke="#E8604C" stroke-width="2.4"/></svg>`;
  if (l.id === 3) return `<svg viewBox="0 0 62 32">${body}${[0, 1, 2, 3, 4].map((i) => `<circle cx="${23 + i * 4}" cy="6" r="1.6" fill="${i < 3 ? '#E8604C' : '#000'}" opacity="${i < 3 ? 1 : 0.4}"/>`).join('')}</svg>`;
  return `<svg viewBox="0 0 62 32"><circle cx="31" cy="18" r="8" fill="#7A5048"/><circle cx="31" cy="18" r="8" fill="none" stroke="#E8604C" stroke-opacity=".6" stroke-width="2"/></svg>`;
}
