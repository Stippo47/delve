// Round 19, icons-misc lane: every trinket (js/trinkets.js) and potion (js/potions.js) as the object itself, no
// medallion or frame (the designer, round 14: "Maybe just no container?"). One drawing each, two treatments:
//   paint  style A's painted object: the sprite ink outline round the whole figure, one shade step, a highlight
//   soft   a lighter painted look: no ink, a thin pale rim in a light tint of each piece's own colour, a soft cast shadow
// A drawing is (c) => [[parts, opts], ...]: layers for Ctx.obj (design/icons-r14/kit.mjs), in a 64x64 box.
import { MAT, INK, at, path, circle, ellipse, rect, burst, spark, arc } from '../../design/icons-r14/kit.mjs';
import * as P from '../../design/icons-r14/parts.mjs';
const { place, streak } = P;
Object.assign(MAT, {
  glass: ['#F6FCFF', '#BFD5E2'], sand: ['#FFE6A0', '#D9A441'], tide: ['#A8DCF8', '#3E8FC7'], veil: ['#F4F8FF', '#AFC4EA'],
  bomb: ['#6E6680', '#2F2A3C'], ember: ['#FF9A5A', '#C8401F'], ivory: ['#FFFDF4', '#D9D0B8'], violet: ['#B9AAFF', '#6C5AD8'],
  thorn: ['#F0E6C8', '#B8A878'], scale: ['#FFB060', '#D84A1F'],
});
const L = (parts, opts = {}) => [parts, opts];
const ring = (band, gem, extra = []) => [
  L([{ s: ellipse(32, 42, 18.5, 14.5), f: band, w: 7.6, k: 0.3 }]),
  L([{ s: path('M21 24H43L38.6 32H25.4Z'), f: band === 'gold' ? 'goldDk' : 'steelDk' }, ...gem], { ow: 3 }),
  ...extra,
];
// a little bottle: neck, round or tall body, liquid in the lower part, a cork, a glint
function bottle(shape, liquid, cork = 'wood', mark = '') {
  const body = { round: 'M26 18V24A19 19 0 1 0 38 24V18Z', tall: 'M24 18V24L16 31V54Q16 60 22 60H42Q48 60 48 54V31L40 24V18Z',
    flat: 'M25 18V24Q10 30 10 44Q10 60 32 60Q54 60 54 44Q54 30 39 24V18Z', square: 'M23 18V24H15V55Q15 60 20 60H44Q49 60 49 55V24H41V18Z',
    cone: 'M26 18V27L10 52Q8 60 16 60H48Q56 60 54 52L38 27V18Z' }[shape];
  const top = { round: 32, tall: 33, flat: 34, square: 32, cone: 38 }[shape];
  return [L([
    { s: path(body), f: 'glass', raw: at(rect(0, top, 64, 40), `fill="${MAT[liquid] ? '' : liquid}"`).replace('fill=""', `fill="${liquid}"`)
      + at(path(`M0 ${top}H64V${top + 3.4}H0Z`), 'fill="#FFFFFF" opacity=".45"') + mark
      + `<path d="M${shape === 'cone' ? 24 : 19} ${top + 4}Q${shape === 'cone' ? 18 : 16} ${top + 12} ${shape === 'cone' ? 18 : 19} ${top + 20}" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity=".75"/>` },
    { s: rect(22, 4, 20, 14, 4), f: cork, hi: [rect(22, 4, 20, 4)], hio: 0.35 },
  ], { ow: 3 })];
}
const flameD = (x, y, k = 1) => `M${x} ${y - 14 * k}C${x + 8 * k} ${y - 4 * k} ${x + 9 * k} ${y + 1 * k} ${x + 9 * k} ${y + 4 * k}A${9 * k} ${9 * k} 0 0 1 ${x - 9 * k} ${y + 4 * k}C${x - 9 * k} ${y + 1 * k} ${x - 8 * k} ${y - 4 * k} ${x} ${y - 14 * k}Z`;

export const TRINKET_DRAW = {
  phoenixFeather: (c) => [
    L([{ s: path('M13 55L30 33'), f: 'bone', w: 3.4, k: 0.5 },
      { s: path('M17.6 50C11 35 22 16 46 8C52 23 44 43 23.6 52.4Z'), f: 'feather',
        raw: `<path d="M21.6 46.6C19 35 28 22.4 42.6 14C45 25 38.6 39 25.6 48.6Z" fill="${c.fill('fire')}"/><path d="M26 41.6C26 34 32 26.6 39.6 20.6C40 27.6 35.6 36 28.6 42.6Z" fill="#FFF0A0"/>`,
        ink: [path('M17 37L22 39.6M22.6 26.6L28 30M47 26.6L42 28.6M41 39.6L36.6 39')], inkw: 1.6 },
      { s: path('M46 8C49 4 47.4 1 44.6-1.4C52.6 0.6 55.6 6.6 52.6 12.6C51 15.6 47.6 15 46 12Z'), f: 'fire' }], { t: 'translate(1 3) scale(.98)' }),
    L([{ s: spark(50, 47, 5.6), f: '#FFE7A0' }], { ow: 2.2 }),
  ],
  wraithVeil: () => [L([{ s: path('M32 4C47 4 55 16 55 31V59L47.6 52L40 59.4L32 52L24 59.4L16.4 52L9 59V31C9 16 17 4 32 4Z'), f: 'veil',
    hi: [streak('M16 44V31Q16 16 26 10', 4.4)], hio: 0.8, sh: [path('M40 0H64V64H44Q50 40 40 0Z')], shc: '#5A6A9A', sho: 0.25,
    raw: '<ellipse cx="24.6" cy="29" rx="4.4" ry="6.2" fill="#2B2230"/><ellipse cx="39.4" cy="29" rx="4.4" ry="6.2" fill="#2B2230"/><ellipse cx="32" cy="42" rx="3.4" ry="4.6" fill="#2B2230" opacity=".8"/>' }])],
  timeSand: () => [
    L([{ s: path('M15 10V54'), f: 'goldDk', w: 3.6, k: 0.3 }, { s: path('M49 10V54'), f: 'goldDk', w: 3.6, k: 0.3 },
      { s: path('M18 11H46C46 24 36 28 36 32C36 36 46 40 46 53H18C18 40 28 36 28 32C28 28 18 24 18 11Z'), f: 'glass',
        raw: `<path d="M22 15H42C41 21 35 25 32 29C29 25 23 21 22 15Z" fill="#E8C878"/><path d="M20 51C22 43 29 41 32 38.6C35 41 42 43 44 51Z" fill="#E0B050"/><path d="M32 29V41" stroke="#E8C878" stroke-width="2.2"/><path d="M21 15Q21 23 27 28" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>` },
      { s: rect(10, 4, 44, 8, 3.4), f: 'wood', hi: [rect(10, 4, 44, 3)], hio: 0.35 }, { s: rect(10, 52, 44, 8, 3.4), f: 'wood', hi: [rect(10, 52, 44, 3)], hio: 0.35 }], { ow: 3 })],
  impLantern: () => [L([
    { s: circle(32, 7, 4.6), f: 'iron', w: 3.2, k: 0.3 },
    { s: path('M22 16L14 5L28 11Z'), f: 'blood' }, { s: path('M42 16L50 5L36 11Z'), f: 'blood' },
    { s: rect(17, 17, 30, 31, 5), f: 'fire', raw: `<path d="${flameD(32, 34, 1.05)}" fill="#FFF0A0"/><ellipse cx="28.6" cy="37" rx="1.8" ry="2.4" fill="#2B2230"/><ellipse cx="35.4" cy="37" rx="1.8" ry="2.4" fill="#2B2230"/><path d="M26 17V48M38 17V48" stroke="#2B2230" stroke-width="2.6" opacity=".55"/>` },
    { s: path('M18 18L24 10H40L46 18Z'), f: 'iron' },
    { s: rect(14, 46, 36, 9, 3.4), f: 'iron', hi: [rect(14, 46, 36, 3)], hio: 0.35 },
  ], { ow: 3 })],
  blinkStone: () => [
    L([{ s: path('M32 4L51 21L44 58H20L13 21Z'), f: 'violet', hi: [path('M32 4L13 21H32Z')], hio: 0.5, sh: [path('M32 21H51L44 58H32Z')], sho: 0.22, ink: [path('M13 21H51M32 4V58M23 21L32 58L41 21')], inkw: 1.3 }], { ow: 3 }),
    L([{ s: spark(52, 10, 7.4), f: '#FFFFFF' }, { s: spark(11, 46, 4.6), f: '#E6D8FF' }], { ow: 2.2 }),
  ],
  thunderRing: () => ring('gold', [{ s: path('M32 2L46 14L32 29L18 14Z'), f: 'bolt', hi: [path('M32 2L18 14H32Z')], hio: 0.6, raw: '<path d="M34 7L28 15H34L30 23" fill="none" stroke="#2B2230" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' }],
    [L([{ s: spark(53, 14, 5.4), f: '#FFF7C2' }, { s: spark(10, 22, 4.4), f: '#FFF7C2' }], { ow: 2 })]),
  frostRing: () => ring('steelDk', [{ s: path('M32 1L42 15L32 30L22 15Z'), f: 'frost', hi: [path('M32 1L22 15H32Z')], hio: 0.7, sh: [path('M32 15H42L32 30Z')], shc: '#2E5A88', sho: 0.3 }]),
  emberRing: () => ring('gold', [{ s: path(flameD(32, 16, 1.05)), f: 'ember', hi: [circle(28, 14, 3.4)], hio: 0.6 }]),
  boneCharm: () => [
    L([{ s: path('M32 3Q40 10 34 22'), f: 'leather', w: 3, k: 0.3 }]),
    L([{ s: rect(-17, -5, 34, 10, 3), f: 'bone' }, { s: circle(-18, -5.4, 6.4), f: 'bone' }, { s: circle(-18, 5.4, 6.4), f: 'bone' }, { s: circle(18, -5.4, 6.4), f: 'bone' }, { s: circle(18, 5.4, 6.4), f: 'bone', sh: [rect(-30, 2, 60, 20)], shc: '#8A7A58', sho: 0.3 },
      { s: rect(-4, -7.6, 8, 15.2, 2), f: 'leather' }], { t: 'translate(32 40) rotate(-35) scale(1.05)' }),
  ],
  widowLocket: () => [
    L([{ s: path('M14 3Q32 26 50 3'), f: 'goldDk', w: 2.8, k: 0.3, dash: '0.1 5' }], { ow: 1.8 }),
    L([{ s: circle(32, 18, 4.2), f: 'gold', w: 3, k: 0.3 },
      { s: path(P.heartD), f: 'gold', t: 'translate(32 40) scale(.88)', hi: [streak('M-17-9Q-17-15-11-16.6', 4)], hio: 0.75, sh: [path('M0 23C19 10 26 1 26-8.4Q26-14 23-17Q22 0 0 14Z')], sho: 0.2,
        raw: '<path d="M0 15C-12 7-16 1-16-5A8 8 0 0 1 0-8A8 8 0 0 1 16-5C16 1 12 7 0 15Z" fill="none" stroke="#B07A22" stroke-width="2.2"/><circle cx="0" cy="-1" r="5.4" fill="#9B5BC9" stroke="#2B2230" stroke-width="1.8"/><circle cx="-1.6" cy="-2.8" r="1.6" fill="#FFFFFF" opacity=".8"/>' }], { ow: 3 }),
  ],
  whirlingKnives: () => [
    L([{ s: path(arc(32, 32, 25, 128, 216)), f: '#C9D2DE', w: 3.4 }, { s: path(arc(32, 32, 25, -52, 36)), f: '#C9D2DE', w: 3.4 }], { ow: 2 }),
    L(P.knife(), { t: 'translate(30.4 20.4) rotate(102) scale(.92)' }), L(P.knife(), { t: 'translate(33.6 43.6) rotate(282) scale(.92)' }),
  ],
  splitShard: () => [
    L([{ s: path('M3 32L25 20L34 32L25 44Z'), f: 'frostDk', hi: [path('M3 32L25 20L34 32Z')], hio: 0.5 },
      { s: path('M38 26L61 9L53 31Z'), f: 'frost', sh: [path('M53 31L61 9L64 30Z')], sho: 0.2 }, { s: path('M38 38L53 33L61 55Z'), f: 'frost', sh: [path('M53 33L61 55L64 34Z')], sho: 0.2 }], { ow: 3 }),
    L([{ s: spark(40, 15, 4.4), f: '#FFFFFF' }, { s: spark(42, 50, 3.6), f: '#FFFFFF' }], { ow: 1.8 }),
  ],
  cinderBoots: () => [
    L([{ s: path('M4 58C2 50 8 46 9 39C13 45 15 50 13 58Z'), f: 'fire' }, { s: path('M14 59C13 53 17 50 18 46C21 50 22 54 21 59Z'), f: 'fireCore' }], { ow: 2.4 }),
    L(P.boot('earth', 'red'), { t: 'translate(34 34) scale(1.08)' }),
    L([{ s: circle(54, 12, 3.6), f: 'fire' }, { s: circle(58, 24, 2.6), f: 'fireCore' }, { s: circle(48, 4.6, 2.4), f: 'ember' }], { ow: 2 }),
  ],
  brambleVest: () => [
    L([[6, 30, -1], [6, 44, -1], [58, 30, 1], [58, 44, 1], [20, 6, 0], [44, 6, 0]].map(([x, y, d]) => ({ s: d ? path(`M${x + d * 9} ${y - 4}L${x} ${y}L${x + d * 9} ${y + 4}Z`) : path(`M${x - 4} ${y + 8}L${x} ${y - 2}L${x + 4} ${y + 8}Z`), f: 'thorn' })), { ow: 2.4 }),
    L([{ s: path('M18 8L26 14H38L46 8L56 18L50 26V55Q32 60 14 55V26L8 18Z'), f: 'leaf', sh: [path('M32 0H64V64H32Z')], sho: 0.16,
      raw: `<path d="M26 14L32 27L38 14Z" fill="#2F5E24"/><path d="M32 27V58" stroke="#2B2230" stroke-width="2" opacity=".6"/><path d="M14 36Q24 31 30 38Q36 45 50 40" fill="none" stroke="#2F5E24" stroke-width="3.4" stroke-linecap="round"/><path d="M20 34L18 30M28 36L28 31M40 42L42 38" stroke="#F0E6C8" stroke-width="2" stroke-linecap="round"/>` }], { ow: 3 }),
  ],
  soulJar: () => [L([
    { s: path('M20 17H44C52 24 55 32 55 40C55 52 45 60 32 60C19 60 9 52 9 40C9 32 12 24 20 17Z'), f: 'glass',
      raw: '<path d="M32 28C41 29 44 38 38 44C32 50 22 45 25 38C27 33 34 35 32 40" fill="none" stroke="#5B9CE0" stroke-width="4.4" stroke-linecap="round"/><circle cx="32" cy="28" r="4.6" fill="#BFE8FF"/><path d="M15 32Q12 40 16 48" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>' },
    { s: rect(18, 11, 28, 7, 3.4), f: 'glass' }, { s: rect(22, 3, 20, 9, 3), f: 'wood' },
  ], { ow: 3 })],
  frostBloom: () => [L([
    ...[0, 60, 120, 180, 240, 300].map((a) => ({ s: path('M0 0L6.6-13L0-29L-6.6-13Z'), f: 'frost', t: `translate(32 32) rotate(${a})`, sh: [path('M0-30H8V0H0Z')], shc: '#2E5A88', sho: 0.22 })),
    { s: circle(32, 32, 7.4), f: 'white' },
  ], { ow: 2.8 })],
  galeFeather: () => [
    L([{ s: path('M13 56L28 35'), f: 'bone', w: 3.2, k: 0.5 },
      { s: path('M15 52C9 36 20 16 44 6C51 22 43 42 21 54Z'), f: 'white', sh: [path('M44 6C51 22 43 42 21 54L40 60L64 20Z')], shc: '#7D8FA8', sho: 0.35,
        ink: [path('M19 50L42 12M16 38L22 41M21 27L27 31M45 25L39 28M39 39L34 39')], inkw: 1.6 }], { ow: 3 }),
    L([{ s: path('M36 50Q50 50 54 44Q57 38 51 37'), f: '#BFE8FF', w: 3.6 }, { s: path('M44 59H60'), f: '#BFE8FF', w: 3.6 }, { s: path('M46 31H60'), f: '#BFE8FF', w: 3.6 }], { ow: 2 }),
  ],
  salamanderScale: () => {
    // a big scale, its face covered in rows of little scales
    const D = 'M32 4C46 8 57 18 57 32C57 47 44 56 32 60C20 56 7 47 7 32C7 18 18 8 32 4Z';
    const rows = [[18, [20, 32, 44]], [30, [14, 26, 38, 50]], [42, [20, 32, 44]], [53, [26, 38]]];
    const sc = rows.map(([y, xs]) => xs.map((x) => `<path d="M${x - 6} ${y}A6 6.4 0 0 0 ${x + 6} ${y}" fill="none" stroke="#B8341A" stroke-width="2.6" stroke-linecap="round"/>`).join('')).join('');
    return [L([{ s: path(D), f: 'scale', hi: [streak('M14 30Q15 17 26 11', 4.4)], hio: 0.6, sh: [path('M32 0H64V64H32Z')], sho: 0.15, raw: sc }], { ow: 3 })];
  },
  snakeCharm: () => [
    L([{ s: path('M42 14C52 15 56 22 50 28C43 35 22 30 17 39C13 47 21 55 33 55C42 55 47 51 50 46'), f: 'leaf', w: 9.6, k: 0.35 }], { ow: 3 }),
    L([{ s: path('M42 14C52 15 56 22 50 28C43 35 22 30 17 39C13 47 21 55 33 55C42 55 47 51 50 46'), f: '#2F5E24', w: 3, dash: '0.1 7', noOutline: true }], { ow: 0 }),
    L([{ s: ellipse(38, 13, 9.4, 7), f: 'leaf', raw: '<circle cx="40.6" cy="11" r="2" fill="#2B2230"/>' }], { ow: 3 }),
    L([{ s: path('M29 14H22L19 11M22 14L19 17'), f: '#E0504A', w: 1.8, noOutline: true }], { ow: 0 }),
  ],
  kindlingFlask: () => bottle('round', '#FF8A3D', 'wood', `<path d="${flameD(32, 44, 0.75)}" fill="#FFF0A0"/>`),
  hookChain: () => [
    L([{ s: ellipse(0, 0, 6.4, 4.4), f: 'steelDk', w: 3.4, t: 'translate(52 10) rotate(-32)' }, { s: ellipse(0, 0, 6.4, 4.4), f: 'steelDk', w: 3.4, t: 'translate(44 15.4) rotate(-32)' }], { ow: 2.4 }),
    L([{ s: path('M37 25V41A11 11 0 0 1 15 41'), f: 'steel', w: 8.4, k: 0.35, cap: 'butt' }, { s: path('M8 42L15 27L22.4 42Z'), f: 'steel' }, { s: circle(37, 22, 5), f: 'steel', w: 4, k: 0.3 }]),
  ],
  howlingSkull: () => [
    L([{ s: path('M8 14Q2 27 8 40'), f: 'bone', w: 3.6, k: 0.4 }, { s: path('M56 14Q62 27 56 40'), f: 'bone', w: 3.6, k: 0.4 }, { s: path('M2 8Q-6 27 2 46'), f: 'bone', w: 3, k: 0.4 }, { s: path('M62 8Q70 27 62 46'), f: 'bone', w: 3, k: 0.4 }], { ow: 2.2 }),
    L(P.skull('#FF6A3D', '#FF8A3D'), { t: 'translate(32 31) scale(1.22)', ow: 2.6 }),
  ],
  lastBreath: () => [
    L([{ s: ellipse(32, 57, 17, 5.4), f: 'goldDk' }]),
    L([{ s: rect(22, 26, 20, 31, 4), f: 'ivory', hi: [rect(24, 26, 5, 31)], hio: 0.6, raw: '<path d="M22 30Q26 32 27 38Q28 32 33 31Q36 34 37 30Q40 31 42 30V26H22Z" fill="#E9E1C8"/>' },
      { s: path('M32 26V20'), f: '#2B2230', w: 2 }, { s: path(flameD(32, 13, 0.9)), f: 'fire', raw: `<path d="${flameD(32, 16, 0.5)}" fill="#FFF6C0"/>` }], { ow: 3 }),
  ],
  volatile: () => [
    L([{ s: rect(-6, -5, 12, 10, 2.4), f: 'iron', t: 'translate(40 20) rotate(40)' }, { s: circle(28, 38, 21), f: 'bomb', hi: [streak('M14 34Q16 24 25 20', 4.4)], hio: 0.5, sh: [path('M28 38L64 38V64H0Z')], sho: 0.15 },
      { s: path('M43 16Q48 8 54 10'), f: 'wood', w: 3, k: 0.4 }], { ow: 3 }),
    L([{ s: burst(55, 9, 8.4, 3.6, 6, -90), f: 'fire' }, { s: circle(55, 9, 2.4), f: '#FFF0A0', noOutline: true }], { ow: 2.2 }),
  ],
  venomFang: () => [L([
    { s: path('M16 5H42C42 24 35 42 21 60C24 41 22 22 16 5Z'), f: 'bone', sh: [path('M30 0H50V64H26Q36 30 30 0Z')], shc: '#8A7A58', sho: 0.3,
      hi: [streak('M21 9Q24 22 24 34', 3)], hio: 0.8, raw: '<path d="M27 14Q30 30 24 50" fill="none" stroke="#7CC03A" stroke-width="4" stroke-linecap="round"/>' },
    { s: path('M43 38C47 44 49 47 49 50A6 6 0 0 1 37 50C37 47 39 44 43 38Z'), f: 'leaf', hi: [circle(41, 48, 1.6)], hio: 0.8 },
  ], { ow: 3 })],
  tideShell: () => [L([
    { s: path('M24 53H40L38 61H26Z'), f: 'blueDk' },
    { s: path('M32 56L7 34C5 17 17 5 32 5C47 5 59 17 57 34Z'), f: 'tide', hi: [path('M32 5C17 5 5 17 7 34L13 30C13 18 22 9 32 9Z')], hio: 0.5,
      ink: [path('M32 56V6M32 56L17 9M32 56L47 9M32 56L8 22M32 56L56 22')], inkw: 1.8 },
  ], { ow: 3 })],
  leadWeight: () => [L([
    { s: path('M24 18V13A8 8 0 0 1 40 13V18'), f: 'iron', w: 5, k: 0.3 },
    { s: path('M17 18H47L57 58H7Z'), f: 'iron', hi: [path('M17 18H25L17 58H7Z')], hio: 0.3, sh: [path('M40 18H48L58 58H44Z')], sho: 0.22, ink: [path('M12 40H52')], inkw: 2 },
  ], { ow: 3 })],
  vampTooth: () => [L([
    { s: path('M-11-19Q-6.4-24.4 0-20.4Q6.4-24.4 11-19Q14.4-5 5 13Q2 19.4 0.6 24Q-3 14-7.6 4Q-13-9-11-19Z'), f: 'bone', sh: [path('M2-24H16V26H0Q8 0 2-24Z')], shc: '#8A7A58', sho: 0.3,
      hi: [streak('M-6.6-15Q-7.6-8-5-1', 3)], hio: 0.8, raw: '<path d="M-14 4Q-9 9-6 3.6Q-3 0 0 5.6Q3 10 6.4 3Q9-1 14 5V28H-14Z" fill="#C8303A"/>' },
    { s: path('M9.6 15.6C12.6 20 14.4 22.4 14.4 25A4.8 4.8 0 0 1 4.8 25C4.8 22.4 6.6 20 9.6 15.6Z'), f: 'blood' },
  ], { t: 'translate(30 31) rotate(8) scale(1.08)' })],
  ironSkin: () => [L([{ s: path('M14 10L24 5Q32 11 40 5L50 10L55 24L48 30V52Q32 61 16 52V30L9 24Z'), f: 'steel', sh: [path('M32 0H64V64H32Z')], shc: '#5E6678', sho: 0.25, hi: [streak('M20 46V30', 3.6)], hio: 0.6,
    raw: '<path d="M32 12V56" stroke="#2B2230" stroke-width="2" opacity=".5"/><path d="M16 30Q32 36 48 30" fill="none" stroke="#2B2230" stroke-width="2.2" opacity=".55"/>' + [[20, 15], [44, 15], [21, 40], [43, 40], [32, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#5E6678" stroke="#2B2230" stroke-width="1.2"/>`).join('') }], { ow: 3 })],
  swiftBoots: () => [
    L([{ s: path('M20 18C8 4-2 10 2 18C-2 23 2 29 9 27C7 33 13 35 18 30Z'), f: 'white', sh: [path('M0 22H24V40H0Z')], shc: '#7D8FA8', sho: 0.3, ink: [path('M18 22L5 17M18 25L7 25')], inkw: 1.4 }], { ow: 2.6 }),
    L(P.boot('tan', 'gold'), { t: 'translate(36 34) scale(1.08)' }),
  ],
};

// ------------------------------------------------------------------------------------------------ potions
// bottle shape and colour tell them apart (as the old set), each with its mark in the liquid
export const POTION_DRAW = {
  heal: () => bottle('round', '#E0504A', 'wood', '<path d="M28.5 37H35.5V44H42.5V51H35.5V58H28.5V51H21.5V44H28.5Z" fill="#FFFFFF" stroke="#2B2230" stroke-width="1.6"/>'),
  haste: () => [...bottle('tall', '#F0D83A', 'wood', '<path d="M35 36L26 48H33L29 58L40 44H33Z" fill="#FFFFFF" stroke="#2B2230" stroke-width="1.6" stroke-linejoin="round"/>'),
    L([{ s: path('M53 30H62'), f: '#F0D83A', w: 4.4 }, { s: path('M55 40H63'), f: '#F0D83A', w: 4.4 }], { ow: 2.2 })],
  quick: () => bottle('flat', '#5FA8F0', 'violet', '<circle cx="32" cy="46" r="8.6" fill="#FFFFFF" stroke="#2B2230" stroke-width="1.8"/><path d="M32 41V46L35.6 48.4" fill="none" stroke="#2B2230" stroke-width="2.2" stroke-linecap="round"/>'),
  fireproof: () => bottle('square', '#3E8FC7', 'wood', `<path d="${flameD(32, 46, 0.62)}" fill="#FF8A3D" stroke="#2B2230" stroke-width="1.6"/><path d="M22 56L42 36" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round"/>`),
  ironskin: () => bottle('square', '#8F97A3', 'iron', '<path d="M32 37L40 40V46C40 51 36 54 32 56C28 54 24 51 24 46V40Z" fill="#E3E8F0" stroke="#2B2230" stroke-width="1.6"/>'),
  regen: () => bottle('cone', '#5FB55A', 'leafDk', '<path d="M24 54C24 46 30 42 40 41C38 46 36 50 30 52C34 52 37 50 39 48C38 54 32 57 24 54Z" fill="#E6F6D8" stroke="#2B2230" stroke-width="1.4"/>'),
};

// ------------------------------------------------------------------------------------------------ the two treatments
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const base = (f) => (MAT[f] ? MAT[f][1] : /^#[0-9a-f]{6}$/i.test(f || '') ? f : '#8A94A6');
const lite = (f) => (MAT[f] ? MAT[f][0] : /^#[0-9a-f]{6}$/i.test(f || '') ? f : '#C9D2DE');
// soft: like Ctx.obj, but every piece is outlined thinly in a darker shade of its own colour (no ink), with a soft
// shadow cast down and to the right instead of the ink rim keeping it off the panel
function softObj(c, parts, opts = {}) {
  const ow = (opts.ow === undefined ? 3 : opts.ow) * 0.6;
  const r2 = (n) => Math.round(n * 100) / 100, tr = (p) => (p.t ? ` transform="${p.t}"` : '');
  let shadow = '', under = '';
  for (const p of parts) {
    if (p.noOutline || !ow) continue;
    const line = mix(lite(p.f), '#FFFFFF', 0.5);
    const cap = `stroke-linecap="${p.cap || 'round'}" stroke-linejoin="round"`;
    if (p.w) {
      shadow += at(p.s, `fill="none" stroke="#05060E" stroke-width="${r2(p.w + ow * 2)}" ${cap}${tr(p)}`);
      under += at(p.s, `fill="none" stroke="${line}" stroke-width="${r2(p.w + ow * 2)}" ${cap}${tr(p)}`);
    } else {
      shadow += at(p.s, `fill="#05060E" stroke="#05060E" stroke-width="${r2(ow * 2)}" stroke-linejoin="round"${tr(p)}`);
      under += at(p.s, `fill="${line}" stroke="${line}" stroke-width="${r2(ow * 2)}" stroke-linejoin="round"${tr(p)}`);
    }
  }
  const top = c.obj(parts.map((p) => ({ ...p, noOutline: true, hio: p.hio === undefined ? 0.75 : Math.min(1, p.hio * 1.25), sho: p.sho === undefined ? 0.16 : p.sho * 0.7 })), { ow: 0, ink: '#5A4A66' });
  const g = `<g opacity=".55" transform="translate(1.8 2.8)">${shadow}</g><g>${under}</g>${top}`;
  return opts.t ? `<g transform="${opts.t}">${g}</g>` : g;
}
export function render(c, layers, treatment) {
  return layers.map(([parts, opts]) => (treatment === 'soft' ? softObj(c, parts, opts) : c.obj(parts, opts))).join('');
}
export const TREATMENTS = {
  paint: { name: 'Painted object', line: 'Style A\'s painted object with the container taken away: the sprite ink outline round the whole thing, one shade step, a highlight.' },
  soft: { name: 'Soft paint', line: 'Lighter: no ink. The edge is a thin pale rim in a light tint of the object\'s own colours, and it casts a soft shadow down and to the right.' },
};
