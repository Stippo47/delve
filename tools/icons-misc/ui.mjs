// Round 19, icons-misc lane: the small UI pictures that were stand-ins (the CSS coin, the points diamond, the line
// glyphs on the camp's buttons and notes), painted as objects in the trinkets' no-container style. Layers as trinkets.mjs.
import { MAT, at, path, circle, ellipse, rect, burst, spark } from '../../design/icons-r14/kit.mjs';
import * as P from '../../design/icons-r14/parts.mjs';
import { POTION_DRAW } from './trinkets.mjs';
const { streak } = P;
Object.assign(MAT, { teal: ['#A8FFF2', '#2FB8A6'], door: ['#B07A45', '#6E4428'], cover: ['#E0605A', '#9A2E34'], moon: ['#FFF6C8', '#E8C25A'], banner: ['#6C9BE6', '#2E5AA8'] });
const L = (parts, opts = {}) => [parts, opts];
const flame = (x, y, k) => `M${x} ${y - 14 * k}C${x + 8 * k} ${y - 4 * k} ${x + 9 * k} ${y + 1 * k} ${x + 9 * k} ${y + 4 * k}A${9 * k} ${9 * k} 0 0 1 ${x - 9 * k} ${y + 4 * k}C${x - 9 * k} ${y + 1 * k} ${x - 8 * k} ${y - 4 * k} ${x} ${y - 14 * k}Z`;

export const UI_DRAW = {
  coin: () => [L([{ s: circle(32, 33, 25), f: 'gold', sh: [path('M7 38H64V64H7Z')], sho: 0.12, hi: [streak('M14 25Q17 15 26 11', 3.6)], hio: 0.8 },
    { s: circle(32, 33, 16.4), f: 'goldDk', noOutline: true, raw: '<circle cx="32" cy="33" r="16.4" fill="none" stroke="#8A5A12" stroke-width="2.4" opacity=".7"/>' + at(burst(32, 33, 10, 4.4, 5, -90), 'fill="#FFE07A" stroke="#8A5A12" stroke-width="1.4"') }], { ow: 3.2 })],
  points: () => [L([{ s: path('M32 3L58 32L32 61L6 32Z'), f: 'teal', hi: [path('M32 3L6 32H32Z')], hio: 0.5, sh: [path('M32 32H58L32 61Z')], shc: '#0E4A44', sho: 0.3, ink: [path('M6 32H58M32 3V61')], inkw: 1.2 }], { ow: 3.2 }),
    L([{ s: spark(50, 12, 6.4), f: '#FFFFFF' }], { ow: 2 })],
  key: () => [L([{ s: path('M30 33L56 59'), f: 'gold', w: 7.4, k: 0.35, cap: 'butt' }, { s: path('M47 50L53 44M53 56L59 50'), f: 'gold', w: 6, k: 0.35, cap: 'butt' },
    { s: circle(21, 22, 13.6), f: 'gold', w: 7.6, k: 0.3 }], { ow: 3 }), L([{ s: path('M12 15Q15 10 21 9'), f: '#FFF3C0', w: 2.6, noOutline: true }], { ow: 0 })],
  lock: () => [L([{ s: path('M20 30V20A12 12 0 0 1 44 20V30'), f: 'steel', w: 6.4, k: 0.35 },
    { s: rect(10, 28, 44, 32, 7), f: 'gold', hi: [rect(10, 28, 44, 6)], hio: 0.4, sh: [path('M32 28H64V64H32Z')], sho: 0.12, raw: '<circle cx="32" cy="41" r="5" fill="#2B2230"/><path d="M29.6 42H34.4L35.6 52H28.4Z" fill="#2B2230"/>' }], { ow: 3.2 })],
  flask: (c) => POTION_DRAW.heal(c),
  trader: () => [L([{ s: path('M15 32Q11 59 32 59Q53 59 49 32Q46 23 40 20H24Q18 23 15 32Z'), f: 'tan', hi: [streak('M20 50Q16 40 20 32', 4)], hio: 0.4, sh: [path('M38 20H64V64H38Z')], sho: 0.18 },
    { s: path('M22 20L16 9Q32 15 48 9L42 20Z'), f: 'tan' }, { s: rect(18, 17, 28, 7, 3.4), f: 'leather' }], { ow: 3.2 }),
    L([{ s: circle(32, 44, 9.4), f: 'gold', raw: '<circle cx="32" cy="44" r="5.4" fill="none" stroke="#B07A22" stroke-width="2"/>' }], { ow: 2.6 })],
  door: () => [L([{ s: path('M8 60V26A24 24 0 0 1 56 26V60Z'), f: 'stone', hi: [path('M8 26A24 24 0 0 1 32 2V8A18 18 0 0 0 14 26V60H8Z')], hio: 0.35 },
    { s: path('M14 60V27A18 18 0 0 1 50 27V60Z'), f: 'door', noOutline: true, raw: '<path d="M14 60V27A18 18 0 0 1 50 27V60Z" fill="none" stroke="#2B2230" stroke-width="2.6"/><path d="M26 12V60M38 12V60" stroke="#5A3420" stroke-width="2"/><path d="M14 24H50M14 48H50" stroke="#5E6678" stroke-width="3.4"/><circle cx="43" cy="38" r="2.6" fill="#FFE07A" stroke="#2B2230" stroke-width="1.4"/>' }], { ow: 3 })],
  flag: () => [L([{ s: path('M15 60V6'), f: 'wood', w: 5, k: 0.4 }, { s: path('M18 8H54L45 19.5L54 31H18Z'), f: 'banner', hi: [path('M18 8H54L51.4 11.4H18Z')], hio: 0.5, sh: [path('M18 23H60V33H18Z')], sho: 0.18 },
    { s: circle(15, 5.5, 4.4), f: 'gold' }, { s: ellipse(15, 59, 9, 3.6), f: 'stone' }], { ow: 3.2 })],
  crown: () => [L([{ s: path('M7 20L20 33L32 10L44 33L57 20L52 52H12Z'), f: 'gold', hi: [path('M7 20L20 33L32 10V16L20 38Z')], hio: 0.4, sh: [path('M10 44H60V60H10Z')], sho: 0.2,
    raw: '<circle cx="32" cy="40" r="5" fill="#E0504A" stroke="#2B2230" stroke-width="2"/><circle cx="20" cy="43" r="3.4" fill="#6C9BE6" stroke="#2B2230" stroke-width="1.8"/><circle cx="44" cy="43" r="3.4" fill="#6C9BE6" stroke="#2B2230" stroke-width="1.8"/>' },
    { s: circle(7, 19, 4), f: 'gold' }, { s: circle(57, 19, 4), f: 'gold' }, { s: circle(32, 9, 4.4), f: 'gold' }], { ow: 3.2 })],
  skull: () => [L(P.skull(), { t: 'translate(32 32) scale(1.4)', ow: 2.4 })],
  fire: () => [L([{ s: rect(-24, -5, 48, 10, 5), f: 'wood', t: 'translate(32 53) rotate(14)' }, { s: rect(-24, -5, 48, 10, 5), f: 'wood', t: 'translate(32 53) rotate(-14)' }], { ow: 3 }),
    L([{ s: path(flame(32, 33, 1.75)), f: 'fire', raw: `<path d="${flame(32, 40, 0.95)}" fill="#FFF0A0"/>` }], { ow: 3 })],
  moon: () => [L([{ s: path('M44 6A26 26 0 1 0 58 44A21 21 0 1 1 44 6Z'), f: 'moon', hi: [streak('M12 36Q12 22 22 14', 4)], hio: 0.6, sh: [path('M20 50Q40 58 58 44V64H20Z')], sho: 0.15 }], { ow: 3.2 }),
    L([{ s: spark(50, 22, 5), f: '#FFFFFF' }], { ow: 2 })],
  sword: () => [L(P.sword({ w: 7.6, len: 35 }), { t: 'translate(30.5 33.5) rotate(45) scale(1.08)', ow: 3.2 })],
  book: () => [L([{ s: rect(14, 10, 42, 50, 4), f: 'cream', ink: [path('M18 60V12M22 60V12')], inkw: 1 },
    { s: rect(8, 5, 42, 50, 5), f: 'cover', hi: [rect(8, 5, 7, 50)], hio: 0.25, raw: '<rect x="20" y="15" width="22" height="12" rx="2" fill="#FFF6E0" opacity=".85"/><path d="M24 19.6H38M24 23.4H34" stroke="#9A2E34" stroke-width="1.8"/>' },
    { s: rect(43, 5, 7, 7, 1.6), f: 'gold' }, { s: rect(43, 48, 7, 7, 1.6), f: 'gold' }], { ow: 3.2 })],
  chest: () => [L([{ s: rect(6, 30, 52, 28, 4), f: 'door', sh: [path('M32 30H64V64H32Z')], sho: 0.14 }, { s: path('M6 32V24Q6 10 32 10Q58 10 58 24V32Z'), f: 'door', hi: [path('M6 24Q6 10 32 10V15Q11 15 11 26Z')], hio: 0.3 },
    { s: rect(4, 28, 56, 7, 2), f: 'goldDk' }, { s: rect(27, 26, 10, 16, 2.6), f: 'gold', raw: '<circle cx="32" cy="32" r="2" fill="#2B2230"/><path d="M31 33H33V38H31Z" fill="#2B2230"/>' }], { ow: 3.2 })],
};
export const UI_NAMES = { coin: 'Gold', points: 'Skill points', key: 'Key', lock: 'Locked', flask: 'Potions button', trader: 'Trader', door: 'New dungeon', flag: 'Checkpoint', crown: 'Boss / trait', skull: 'Skull', fire: 'The fire', moon: 'Resting', sword: 'Weapon', book: 'Book', chest: 'Chest' };
