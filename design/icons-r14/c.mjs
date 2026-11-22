// Style C, "scene medallion": a round window onto the ability happening, the way the game shows it (often from
// above). The backdrop is the element's colour, edge to edge; the ring is the hero's role colour and doubles as the
// cooldown timer. Trinkets are the object breaking out of a diamond plate in the rarity colour. Stats are a white
// glyph on a small coloured chip.
import { INK, UI_INK, at, path, circle, ellipse, rect, burst, spark, arc, sector } from './kit.mjs';
import * as P from './parts.mjs';
import * as A from './a.mjs';
import { STAT_GLYPH } from './b.mjs';
import { ROLE_COL, RARITY_COL, ELEMENT } from './subjects.mjs';
const { place, streak } = P;
const R = 24.4; // the window

function window_(c, s, scene, state) {
  const col = ROLE_COL[s.role], [dark, main, light] = ELEMENT[s.element];
  const locked = state === 'locked', cd = state === 'cooldown';
  const cid = c.clip(circle(32, 32, R));
  const back = locked ? at(circle(32, 32, R), 'fill="#1D2238"')
    : at(circle(32, 32, R), `fill="${main}"`) + at(circle(32, 32, R), `fill="${c.radial([[0, light, 0.7], [0.75, light, 0]], 0.5, 0.42, 0.5)}"`)
      + at(circle(32, 32, R), `fill="${c.radial([[0.55, dark, 0], [1, dark, 0.95]])}"`);
  let ring;
  if (cd) ring = at(circle(32, 32, 29.2), 'fill="#2A3050"') + at(path(arc(32, 32, 27.2, -90, -90 + 360 * 0.6)), `fill="none" stroke="${col}" stroke-width="4" stroke-linecap="butt"`);
  else ring = at(circle(32, 32, 29.2), `fill="${locked ? '#3B4478' : c.linear([[0, lighten(col, 0.28)], [1, darken(col, 0.18)]])}"`);
  let pic = `<g clip-path="url(#${cid})">${scene}</g>`;
  if (locked) pic = `<g style="filter:grayscale(1) brightness(.4)" opacity=".85">${pic}</g>`;
  if (cd) pic = `<g style="filter:saturate(.4) brightness(.78)">${at(circle(32, 32, R), `fill="${main}"`)}${pic}</g>`;
  return at(circle(32, 32, 30.8), `fill="${UI_INK}"`) + ring + at(circle(32, 32, R + 1.5), `fill="${INK}"`) + (cd ? '' : back) + pic
    + (locked || cd ? '' : at(path(arc(32, 32, 27.3, -150, -100)), 'fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity=".5"'))
    + (locked ? A.padlock(c, 47, 47) : '');
}
function plate(c, s, obj, state) {
  const col = RARITY_COL[s.rarity], locked = state === 'locked';
  const D = (r) => path(`M32 ${32 - r}L${32 + r} 32L32 ${32 + r}L${32 - r} 32Z`);
  return at(D(27), `fill="${UI_INK}" stroke="${UI_INK}" stroke-width="7" stroke-linejoin="round"`)
    + at(D(27), `fill="${c.linear([[0, lighten(col, 0.25)], [1, darken(col, 0.2)]])}" stroke="${c.linear([[0, lighten(col, 0.25)], [1, darken(col, 0.2)]])}" stroke-width="4" stroke-linejoin="round"`)
    + at(D(22), `fill="${darken(col, 0.62)}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`)
    + at(circle(32, 32, 17), `fill="${c.radial([[0, lighten(col, 0.3), 0.75], [1, col, 0]])}"`)
    + `<g transform="translate(32 33) scale(1.06) translate(-32 -32)">${obj}</g>`;
}
function hex(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const lighten = (h, k) => toHex(hex(h).map((v) => v + (255 - v) * k));
export const darken = (h, k) => toHex(hex(h).map((v) => v * (1 - k)));

export function tile(c, s, inner, state) { return s.kind === 'ability' ? window_(c, s, inner, state) : plate(c, s, inner, state); }

// a small enemy, the kind the game's rooms are full of: a round dark body, two wide eyes
const foe = (c, x, y, r, f = '#5A4A6E', rot = 0) => c.obj([{ s: path(`M${-r} ${r * 0.7}C${-r * 1.1} ${-r * 0.6} ${-r * 0.5} ${-r} 0 ${-r}C${r * 0.5} ${-r} ${r * 1.1} ${-r * 0.6} ${r} ${r * 0.7}Q0 ${r * 1.05} ${-r} ${r * 0.7}Z`), f,
  raw: `<circle cx="${-r * 0.36}" cy="${-r * 0.12}" r="${r * 0.3}" fill="#FFFFFF"/><circle cx="${r * 0.36}" cy="${-r * 0.12}" r="${r * 0.3}" fill="#FFFFFF"/><circle cx="${-r * 0.3}" cy="${-r * 0.1}" r="${r * 0.13}" fill="#2B2230"/><circle cx="${r * 0.42}" cy="${-r * 0.1}" r="${r * 0.13}" fill="#2B2230"/>` }], { t: `translate(${x} ${y}) rotate(${rot})`, ow: 2.4 });
const soft = (shape, fill, o = 1) => at(shape, `fill="${fill}" opacity="${o}"`);
const miter = (s) => s.replace(/stroke-linejoin="round"/g, 'stroke-linejoin="miter" stroke-miterlimit="6"');
const plus = (x, y, r, w) => path(`M${x - w} ${y - r}h${w * 2}v${r - w}h${r - w}v${w * 2}h-${r - w}v${r - w}h-${w * 2}v-${r - w}h-${r - w}v-${w * 2}h${r - w}z`);

export const ICONS = {
  // the shield driven into an enemy, which goes flying
  shieldBash: (c) => at(path('M9 27H15M8 36H13M10 45H15'), 'stroke="#FFF8E0" stroke-width="2.6" stroke-linecap="round" opacity=".75" fill="none"')
    + foe(c, 46.4, 19, 7.6, '#6A4E7E', 26)
    + c.obj([{ s: burst(39.6, 30.6, 10.6, 4.6, 8, -75), f: '#FFFFFF' }], { ow: 2.2 })
    + c.obj(P.shield(), { t: 'translate(25.6 35.6) rotate(-14) scale(.8)', ow: 3.6 }),
  // the fan in flight: every arrow at its own speed
  barrage: (c) => at(path('M2 62L20 14M2 62L40 22M2 62L52 40'), 'stroke="#E4F5C8" stroke-width="5" stroke-linecap="round" opacity=".3" fill="none"')
    + c.obj([
      ...place(P.arrow(30, { fletch: null, big: 1.15 }), 'translate(3 61) rotate(-74) translate(20 0)'),
      ...place(P.arrow(42, { fletch: null, big: 1.15 }), 'translate(3 61) rotate(-55) translate(18 0)'),
      ...place(P.arrow(34, { fletch: null, big: 1.15 }), 'translate(3 61) rotate(-35) translate(18 0)'),
      ...place(P.arrow(40, { fletch: null, big: 1.15 }), 'translate(3 61) rotate(-15) translate(16 0)'),
    ], { ow: 2.6 }),
  // the arrow in flight, frost streaming off it
  frostArrow: (c) => soft(path('M2 62L24 30L34 40Z'), '#FFFFFF', 0.55) + soft(path('M10 62L28 40L32 44Z'), '#FFFFFF', 0.5)
    + c.obj([{ s: path('M12 30L17 22L22 30L17 38Z'), f: 'frost', t: 'rotate(20 17 30)' }, { s: path('M38 50L42 44L46 50L42 56Z'), f: 'frost', t: 'rotate(-30 42 50)' }], { ow: 2.2 })
    + c.obj(place(P.arrow(50, { head: 'frost', fletch: null, shaft: 'frost', big: 2.15, w: 4 }), 'translate(10 54) rotate(-45)'))
    + c.obj([{ s: spark(46.5, 40.5, 4.2), f: '#FFFFFF' }, { s: spark(22.6, 16.4, 5), f: '#FFFFFF' }], { ow: 1.8 }),
  // the Archer tumbling back along the floor, dust where he was
  roll: (c) => soft(rect(0, 49, 64, 20), '#4E4034', 0.9) + at(path('M4 49H60'), `stroke="${INK}" stroke-width="2.4" fill="none"`)
    + soft(path('M56 48C54 28 40 17 22 22C36 23 46 33 47 48Z'), '#FFF6E0', 0.8)
    + c.obj([{ s: P.puff(42.6, 51, 6.2), f: 'cream' }, { s: P.puff(53.6, 52, 4.2), f: 'cream' }], { ow: 2.2 })
    + c.obj(P.hood(), { t: 'translate(27 34.6) rotate(-50) scale(.62)', ow: 4.2 }),
  // from above, as in the game: the Berserker in the middle, the flail going all the way round
  whirl: (c) => c.obj([{ s: path('M35.6 12.6A20.6 20.6 0 1 0 49.6 44.6A18.6 18.6 0 1 1 33.6 20Z'), f: 'cream' }], { ow: 2.6 })
    + c.obj([{ s: path('M33 33L42 24'), f: '#DDE3EC', w: 3, dash: '0.1 4.6' }], { ow: 2 })
    + c.obj([
      { s: circle(0, 5, 8.4), f: '#F2C7A0' },
      { s: path('M-10.4 5C-11.4-6-6-12.4 0-12.4C6-12.4 11.4-6 10.4 5Q0-1.6-10.4 5Z'), f: '#5A3F44' },
      { s: path('M0-18L2.8-12.6L6-13.6L4.6-7.4L7.6-5.6L3.6-2L0 2.4L-3.6-2L-7.6-5.6L-4.6-7.4L-6-13.6L-2.8-12.6Z'), f: 'fire' },
    ], { t: 'translate(30.6 35) rotate(-24) scale(.74)', ow: 3.6 })
    + c.obj(P.spikeBall(7.4, 8), { t: 'translate(43.4 22)' }),
  // three enemies and the bolt going through each in turn
  chainLightning: (c) => miter(c.obj([{ s: path('M26 4L18 17L25 19L15 40L29.6 32L27 25L39 20L44 31L39.6 34L48 45'), f: 'bolt', w: 5, cap: 'butt' }], { ow: 2.6 }))
    + [[15, 41.6, 7.4], [39.6, 20.6, 6.6], [48, 45.6, 6.8]].map(([x, y, r]) => soft(circle(x, y + r * 0.1, r + 4.4), '#FFF7C2', 0.55) + foe(c, x, y, r, '#9AA6DA')).join(''),
  // the circle of light on the floor, allies' health rising out of it
  sanctuary: (c) => at(path('M8 44L16 0H48L56 44Z'), `fill="${c.linear([[0, '#FFFBEA', 0], [1, '#FFFBEA', 0.75]])}"`)
    + c.obj([{ s: ellipse(32, 45, 22, 8.6), f: '#FFFBEA', noOutline: true, o: 0.9 }, { s: ellipse(32, 45, 22, 8.6), f: 'gold', w: 4.6, k: 0.2 }], { ow: 2.6 })
    + c.obj([{ s: plus(32, 26, 10.6, 4.4), f: 'ghost' }], { ow: 2.8 })
    + c.obj([{ s: plus(16.4, 30, 5.4, 2.2), f: '#FFFFFF' }, { s: plus(47.6, 19, 5.4, 2.2), f: '#FFFFFF' }], { ow: 2 }),
  // the dead getting up: three small skeletons out of the floor
  raiseDead: (c) => soft(ellipse(32, 46, 30, 16), c.radial([[0, '#B5F29A', 0.9], [1, '#B5F29A', 0]]))
    + c.obj(P.skull('#B5F29A'), { t: 'translate(14.6 39.5) rotate(-10) scale(.52)', ow: 4.6 }) + c.obj(P.skull('#B5F29A'), { t: 'translate(49.4 39.5) rotate(10) scale(.52)', ow: 4.6 })
    + c.obj(P.skull('#B5F29A'), { t: 'translate(32 29.6) scale(.82)', ow: 3.2 })
    + c.obj([{ s: path('M0 64V48Q6 44 12 47Q18 43 24 47.6Q32 43.6 40 47.6Q46 43 52 47Q58 44 64 48V64Z'), f: 'earth' }], { ow: 2.6 }),
  // the victim from behind (a goblin), and what is behind the victim
  backstab: (c) => soft(path('M26 6C40-2 60 6 58 24C56 38 42 42 34 34C26 26 18 14 26 6Z'), '#1E1830', 0.8)
    + at(path('M30.6 13.6Q34 12 36.6 14.6Q33.6 16.6 30.6 13.6ZM40 12.6Q43.4 11.4 45.8 14.2Q42.8 15.8 40 12.6Z'), 'fill="#FFFFFF"')
    + c.obj(P.fang(), { t: 'translate(44 28) rotate(47) scale(.8)', ow: 3.4 })
    + c.obj([
      { s: path('M6 66C6 56 12 52 21 52C30 52 36 56 36 66Z'), f: 'leather' },
      { s: path('M13 36L0.6 29.6L10.6 46Z'), f: 'leaf' }, { s: path('M29 36L41.4 29.6L31.4 46Z'), f: 'leaf' },
      { s: circle(21, 41, 10.4), f: 'leaf', hi: [streak('M14 37.6Q15.4 33.6 19.4 32.4', 2.4)], hio: 0.45, sh: [path('M21 28Q28 41 21 54H34V28Z')], sho: 0.2 },
    ], { ow: 2.8 })
    + c.obj([{ s: spark(31, 45.6, 4.4), f: '#FFFFFF' }], { ow: 1.8 }),
  // the wolf stepping out of the ring that called it, howling
  callWolf: (c) => soft(circle(40, 22.6, 13.6), '#E4F5C8', 0.95)
    + c.obj([{ s: ellipse(32, 51, 23, 6.4), f: '#D8F2A8', noOutline: true, o: 0.75 }, { s: ellipse(32, 51, 23, 6.4), f: '#A9D47A', w: 3.6 }], { ow: 2.4 })
    + c.obj(P.wolfHead(), { t: 'translate(28 36.5) rotate(-36) scale(1.02)' }),

  // trinkets: style A's objects, larger, over the plate
  vampTooth: (c) => A.ICONS.vampTooth(c), hookChain: (c) => A.ICONS.hookChain(c), whirlingKnives: (c) => A.ICONS.whirlingKnives(c), phoenixFeather: (c) => A.ICONS.phoenixFeather(c),
};

const CHIP = { dmg: '#D8503C', hp: '#D0405A', armor: '#3F6FC0', atkSpeed: '#C68A12', moveSpeed: '#2E9A84', range: '#7A5AC0' };
export const stat = (c, s) => at(circle(32, 32, 31), `fill="${UI_INK}"`) + at(circle(32, 32, 29.4), `fill="${c.linear([[0, lighten(CHIP[s.id], 0.18)], [1, darken(CHIP[s.id], 0.12)]])}"`)
  + `<g transform="translate(32 32) scale(${s.id === 'range' ? 0.7 : 0.74}) translate(-32 -32)">${STAT_GLYPH[s.id](c, '#FFFFFF', 3)}</g>`;
