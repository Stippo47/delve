// Style B, "bold glyph": two tones only. One solid cream shape with the ink outline, on a tile filled with the
// hero's role colour (abilities, a rounded square) or the rarity colour (trinkets, a hexagon). Built to be read at a
// glance at the smallest size. Stats are the same kind of glyph without a tile, each in its own colour.
import { INK, UI_INK, at, path, circle, ellipse, rect, burst, spark, arc, sector } from './kit.mjs';
import * as P from './parts.mjs';
import { ROLE_COL, RARITY_COL } from './subjects.mjs';
const { place } = P;
const fit = (k, s, cx = 32, cy = 32) => `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">${s}</g>`;
export const CREAM = '#FFF6E0';
const DARK = '#2B2230';

// any painted parts as one flat colour (their ink lines kept)
export const mono = (parts, col = CREAM) => parts.map((p) => ({ s: p.s, t: p.t, w: p.w, cap: p.cap, dash: p.dash, f: col, ink: p.ink, inkw: p.inkw ? p.inkw * 1.25 : undefined, noOutline: p.noOutline }));
// a fat arrow along +x from 0 to L, one closed shape
export const gArrow = (L, hw = 8, hl = 12, w = 5) => path(`M0-${w / 2}H${L - hl}V-${hw}L${L} 0L${L - hl} ${hw}V${w / 2}H0Z`);
const HEX = 'M32 2.4L57.6 17.2V46.8L32 61.6L6.4 46.8V17.2Z';
const hexIn = 'M32 5.6L54.8 18.8V45.2L32 58.4L9.2 45.2V18.8Z';

export function tile(c, s, inner, state) {
  const col = s.kind === 'ability' ? ROLE_COL[s.role] : RARITY_COL[s.rarity];
  const locked = state === 'locked', cd = state === 'cooldown';
  const shapeOut = s.kind === 'ability' ? rect(2, 2, 60, 60, 16) : at(path(HEX), 'stroke-linejoin="round"');
  const shapeIn = s.kind === 'ability' ? rect(4.6, 4.6, 54.8, 54.8, 13.6) : path(hexIn);
  const cid = c.clip(shapeIn);
  inner = `<g clip-path="url(#${cid})"><g transform="translate(32 ${s.kind === 'ability' ? 31.4 : 32}) scale(${s.kind === 'ability' ? 0.86 : 0.8}) translate(-32 -32)">${inner}</g></g>`;
  const face = (fill, lip = 0.24) => at(shapeIn, `fill="${fill}"`)
    + `<g clip-path="url(#${cid})">${at(rect(0, 52.4, 64, 12), `fill="#000000" opacity="${lip}"`)}${at(rect(0, 0, 64, 11), 'fill="#FFFFFF" opacity=".13"')}</g>`;
  const out = at(shapeOut, `fill="${s.kind === 'ability' ? UI_INK : UI_INK}"${s.kind === 'ability' ? '' : ` stroke="${UI_INK}" stroke-width="2"`}`);
  if (locked) // an empty socket: dark, a dashed edge in the tile's colour, the glyph as a ghost
    return out + at(shapeIn, 'fill="#1D2238"') + at(shapeIn, `fill="none" stroke="${col}" stroke-width="2.4" stroke-dasharray="5 4" opacity=".7"`)
      + `<g opacity=".3" style="filter:grayscale(1)">${inner}</g>` + padlock(c, 46.5, 46.5);
  if (cd) { // the tile drains and fills back up from the bottom as the ability comes round
    const lvl = 0.42, y = 59.4 - 54.8 * lvl;
    return out + face('#39405F', 0.2) + `<g clip-path="url(#${cid})">${at(rect(0, y, 64, 64), `fill="${col}"`)}${at(rect(0, y, 64, 2.2), 'fill="#FFFFFF" opacity=".35"')}${at(rect(0, 52.4, 64, 12), 'fill="#000000" opacity=".24"')}</g>`
      + `<g opacity=".78">${inner}</g>`;
  }
  return out + face(col) + inner;
}
export function padlock(c, x, y, k = 1) {
  return c.obj([{ s: path('M-5 0V-5A5 5 0 0 1 5-5V0'), f: CREAM, w: 3 }, { s: rect(-8, -1, 16, 12.4, 3), f: CREAM, raw: '<circle cx="0" cy="4.4" r="2" fill="#2B2230"/>' }], { t: `translate(${x} ${y}) scale(${k})`, ow: 2.4 });
}

const OW = 3.2;
export const GLYPH = {
  // ---------------------------------------------------------------------------------------------- abilities
  shieldBash: (c, f = CREAM) => c.obj([
    { s: path('M48 17L55 10'), f, w: 5.6 }, { s: path('M51.6 31.6H60'), f, w: 5.6 }, { s: path('M48 46L55 53'), f, w: 5.6 },
  ], { ow: OW }) + c.obj([{ s: path('M-17-18.5Q0-24.5 17-18.5L17 0Q17 16.5 0 24.5Q-17 16.5-17 0Z'), f,
    ink: [path('M-10.4-11.6Q0-15.2 10.4-11.6L10.4 0Q10.4 9.6 0 14.8Q-10.4 9.6-10.4 0Z')], inkw: 2.6 }], { t: 'translate(26 32) rotate(-8) scale(.98)', ow: OW }),
  barrage: (c, f = CREAM) => c.obj([
    { s: gArrow(34, 7.6, 11, 5), f, t: 'translate(30.4 50) rotate(-126)' }, { s: gArrow(34, 7.6, 11, 5), f, t: 'translate(33.6 50) rotate(-54)' },
  ], { ow: OW }) + c.obj([{ s: gArrow(46, 9, 13, 6), f, t: 'translate(32 52) rotate(-90)' }], { ow: OW })
    + c.obj([{ s: path('M9 46Q32 66 55 46'), f, w: 6 }], { ow: OW }),
  frostArrow: (c, f = CREAM) => c.obj([
    { s: path('M-10.5 0H10.5'), f, w: 4.6, t: 'translate(20.5 21)' }, { s: path('M-10.5 0H10.5'), f, w: 4.6, t: 'translate(20.5 21) rotate(60)' }, { s: path('M-10.5 0H10.5'), f, w: 4.6, t: 'translate(20.5 21) rotate(120)' },
  ], { ow: OW }) + c.obj([{ s: path('M0-2.8H28V-9L45 0L28 9V2.8H0Z'), f, t: 'translate(17.5 53) rotate(-45)' }], { ow: OW }),
  roll: (c, f = CREAM) => c.obj([{ s: path('M8 54.3H56'), f, w: 5 }, { s: path(arc(33, 36, 17, 90, -172)), f, w: 7.6, cap: 'butt' }, { s: path('M6 33L26.4 31L17.6 49Z'), f }], { ow: OW })
    + c.obj([{ s: circle(33, 36, 7.4), f }], { ow: OW }),
  whirl: (c, f = CREAM) => fit(0.94, c.obj([{ s: path('M34 9.6A24.6 24.6 0 1 0 53 46A20.6 20.6 0 1 1 32 21.6Z'), f }], { ow: OW })
    + c.obj([{ s: burst(0, 0, 15.6, 8.2, 8, -67.5), f, ink: [circle(0, 0, 6.6)], inkw: 2.4 }], { t: 'translate(44 21.6)', ow: OW }), 34, 32),
  chainLightning: (c, f = CREAM) => fit(0.92, c.obj([{ s: path('M13.6 14.6L35 18L26.6 28.4L48.6 26.4M48.6 26.4L30 38.4L40 44.4L21.6 52'), f, w: 7, cap: 'butt' }], { ow: OW }).replace(/stroke-linejoin="round"/g, 'stroke-linejoin="miter" stroke-miterlimit="6"')
    + c.obj([{ s: circle(13.6, 14.6, 6), f }, { s: circle(48.6, 26.4, 6), f }, { s: circle(21.2, 52, 6), f }], { ow: OW }), 31, 32),
  sanctuary: (c, f = CREAM) => c.obj([{ s: ellipse(32, 44.6, 20.6, 8.4), f, w: 6 }], { ow: OW })
    + c.obj([{ s: path('M26.6 7.6H37.4V17.2H47V28H37.4V37.6H26.6V28H17V17.2H26.6Z'), f }], { ow: OW }),
  raiseDead: (c, f = CREAM) => c.obj(mono(P.boneHand(), f), { t: 'translate(32 29) scale(1.04)', ow: OW })
    + c.obj([{ s: path('M4 58.6Q6 49 19 48.6Q26 45.4 32 47.4Q38 45.4 45 48.6Q58 49 60 58.6Z'), f }], { ow: OW }),
  // the dagger going into a turned back
  backstab: (c, f = CREAM) => at(path('M26 64C26 51 30 46 37 44.6A10.4 10.4 0 1 1 47 44.6C54 46 58 51 58 64Z'), `fill="${DARK}" opacity=".62"`)
    + c.obj(mono(P.fang(), f), { t: 'translate(20 25) rotate(-50) scale(.9)', ow: OW }),
  callWolf: (c, f = CREAM) => c.obj([{ s: P.wolfD, f, ink: [path('M3.4-4.6Q6.4-6.8 9.6-4.6'), path('M-13-16.4L-8.4-11.4')], inkw: 2.6, raw: '<path d="M23-7.4Q28-6.6 27-2.6L22.6-1.2Q21.6-4.6 23-7.4Z" fill="#2B2230"/>' }], { t: 'translate(29.5 34.5) rotate(-38) scale(1.14)', ow: OW }),

  // ---------------------------------------------------------------------------------------------- trinkets
  vampTooth: (c, f = CREAM) => c.obj([
    { s: path('M-11-19Q-6.4-24.4 0-20.4Q6.4-24.4 11-19Q14.4-5 5 13Q2 19.4 0.6 24Q-3 14-7.6 4Q-13-9-11-19Z'), f },
    { s: path('M11 13.6C14.6 19 16.6 21.6 16.6 24.6A5.6 5.6 0 0 1 5.4 24.6C5.4 21.6 7.4 19 11 13.6Z'), f },
  ], { t: 'translate(30 31) rotate(8) scale(.92)', ow: OW }),
  hookChain: (c, f = CREAM) => c.obj([
    { s: ellipse(0, 0, 5.4, 3.8), f, w: 3.4, t: 'translate(46.6 13.4) rotate(-35)' }, { s: ellipse(0, 0, 5.4, 3.8), f, w: 3.4, t: 'translate(40 18) rotate(-35)' },
  ], { ow: 2.6 }) + c.obj([
    { s: path('M35 26V39A9.6 9.6 0 0 1 15.8 39'), f, w: 8, cap: 'butt' }, { s: path('M8.6 40.6L15.8 26L23 40.6Z'), f }, { s: circle(35, 23.6, 4.6), f, w: 3.8 },
  ], { ow: OW }),
  whirlingKnives: (c, f = CREAM) => c.obj([{ s: path(arc(32, 32, 21, 128, 216)), f, w: 4 }, { s: path(arc(32, 32, 21, -52, 36)), f, w: 4 }], { ow: 2.6 })
    + c.obj(mono(P.knife(), f), { t: 'translate(30.6 21.4) rotate(102) scale(.82)', ow: OW }) + c.obj(mono(P.knife(), f), { t: 'translate(33.4 42.6) rotate(282) scale(.82)', ow: OW }),
  phoenixFeather: (c, f = CREAM) => c.obj([
    { s: path('M13 55L26 38'), f, w: 3.6 },
    { s: path('M17.6 50C11 35 22 16 46 8C49 4 47.4 1 44.6-1.4C52.6 0.6 55.6 6.6 52.6 12.6C52 28 42 44 23.6 52.4Z'), f,
      ink: [path('M21 47L43 16M17 36L23.4 39.4M23 25.6L30 30M47.6 27L41 29.6M41.6 40L36 39.4')], inkw: 2.2 },
  ], { t: 'translate(5.4 7) scale(.84)', ow: OW }),
};

export const ICONS = Object.fromEntries(Object.keys(GLYPH).map((id) => [id, (c) => GLYPH[id](c)]));

// ------------------------------------------------------------------------------------------------ stats
// the same glyphs serve style C (white, on a chip); f is the fill, ow the outline
const lines = (c, f, ow, ys) => c.obj(ys.map(([x, y, l]) => ({ s: path(`M${x} ${y}H${x + l}`), f, w: 7 })), { ow });
export const STAT_GLYPH = {
  dmg: (c, f, ow = 4) => c.obj(mono(P.sword({ w: 8, len: 35 }), f), { t: 'translate(30.5 33.5) rotate(45) scale(1.06)', ow }),
  hp: (c, f, ow = 4) => c.obj([{ s: path(P.heartD), f }], { t: 'translate(32 32.5) scale(.98)', ow }),
  armor: (c, f, ow = 4) => c.obj([{ s: path('M-17-18.5Q0-24.5 17-18.5L17 0Q17 16.5 0 24.5Q-17 16.5-17 0Z'), f, ink: [path('M0-20V23')], inkw: 2.6 }], { t: 'translate(32 32) scale(1.1)', ow: ow / 1.1 }),
  atkSpeed: (c, f, ow = 4) => lines(c, f, ow, [[8, 23, 17], [11, 41, 13]]) + c.obj(mono(P.sword({ w: 8, len: 30 }), f), { t: 'translate(40 35) rotate(45) scale(.96)', ow }),
  moveSpeed: (c, f, ow = 4) => lines(c, f, ow, [[7, 19, 13], [9, 37, 9]]) + c.obj(mono(P.boot(), f), { t: 'translate(40.6 33.5) scale(1.02)', ow }),
  range: (c, f, ow = 4) => c.obj(mono(P.bow(), f), { t: 'translate(24.6 39.4) rotate(-45) scale(.86)', ow: ow / 0.86 }),
};
export const stat = (c, s) => STAT_GLYPH[s.id](c, s.col, 4);
