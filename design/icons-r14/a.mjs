// Style A, "painted emblem": the game's sprite style shrunk into a tile. The object itself is the picture: thick ink
// outline, flat colour with one soft shade step, a highlight. Abilities sit in a rounded square with a rim in the
// hero's role colour; trinkets in a round slot with a rim in the rarity colour; stats have no tile.
import { INK, UI_INK, at, path, circle, ellipse, rect, burst, spark, arc, sector } from './kit.mjs';
import * as P from './parts.mjs';
import { ROLE_COL, RARITY_COL } from './subjects.mjs';
const { place, streak } = P;
export const fit = (k, s, cx = 32, cy = 32) => `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">${s}</g>`;

export function tile(c, s, inner, state) {
  const col = s.kind === 'ability' ? ROLE_COL[s.role] : RARITY_COL[s.rarity];
  const locked = state === 'locked', cd = state === 'cooldown';
  const rim = locked ? '#3B4478' : col;
  const bg = c.linear(locked ? [[0, '#262B48'], [1, '#1B1F36']] : [[0, '#3A4379'], [1, '#222848']]);
  let base, clip, over = '';
  if (s.kind === 'ability') {
    base = at(rect(2, 2, 60, 60, 16), `fill="${UI_INK}"`) + at(rect(3.6, 3.6, 56.8, 56.8, 14.4), `fill="${rim}"`) + at(rect(6.6, 6.6, 50.8, 50.8, 11.6), `fill="${bg}"`)
      + at(path('M12 9.6H52'), `stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="${locked ? 0.05 : 0.14}" fill="none"`);
    clip = rect(6.6, 6.6, 50.8, 50.8, 11.6);
  } else {
    base = at(circle(32, 32, 30.4), `fill="${UI_INK}"`) + at(circle(32, 32, 28.8), `fill="${rim}"`) + at(circle(32, 32, 25.6), `fill="${bg}"`)
      + at(path(arc(32, 32, 22.6, -140, -40)), `stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="${locked ? 0.05 : 0.14}" fill="none"`);
    clip = circle(32, 32, 25.6);
  }
  const cid = c.clip(clip);
  inner = `<g clip-path="url(#${cid})"><g transform="translate(32 32) scale(${s.kind === 'ability' ? 0.93 : 0.9}) translate(-32 -32)">${inner}</g></g>`;
  if (locked) return base + `<g style="filter:grayscale(1) brightness(.42) contrast(.9)" opacity=".9">${inner}</g>` + padlock(c, 46, 46);
  if (cd) { // the game's clock wipe: the part still to wait is dark
    over = `<g clip-path="url(#${cid})">${at(sector(32, 32, 48, 0.62), `fill="${UI_INK}" opacity=".6"`)}</g>`;
    return base + `<g style="filter:saturate(.7)">${inner}</g>` + over;
  }
  return base + inner;
}
export function padlock(c, x, y, k = 1) {
  return c.obj([
    { s: path('M-5 0V-5A5 5 0 0 1 5-5V0'), f: 'steel', w: 3 },
    { s: rect(-8, -1, 16, 12.4, 3), f: 'gold', raw: '<circle cx="0" cy="4.4" r="2" fill="#2B2230"/>' },
  ], { t: `translate(${x} ${y}) scale(${k})`, ow: 2.4 });
}

// ------------------------------------------------------------------------------------------------ abilities
export const ICONS = {
  // the Paladin's shield shoved forward into a white-gold bang
  shieldBash: (c) => c.obj([{ s: burst(43.6, 23.6, 13.6, 6.2, 8, -80), f: 'holy' }, { s: burst(43.6, 23.6, 6.8, 3.2, 8, -57), f: '#FFFFFF', noOutline: true }])
    + c.obj(P.shield(), { t: 'translate(25.5 34.5) rotate(-12) scale(.96)' }),
  // three arrows loosed as a fan
  barrage: (c) => c.obj([
    ...place(P.arrow(41, { fletch: 'cream' }), 'translate(14.5 50.5) rotate(-73)'),
    ...place(P.arrow(41, { fletch: 'cream' }), 'translate(14.5 50.5) rotate(-17)'),
  ]) + c.obj(place(P.arrow(47, { fletch: 'cream', big: 1.12 }), 'translate(13 52) rotate(-45)')),
  // one arrow with a head of ice
  frostArrow: (c) => c.obj([
    ...place(P.arrow(50, { head: 'frost', fletch: 'frostDk', shaft: 'frost', big: 1.75, w: 3.4 }), 'translate(13 51) rotate(-45)'),
  ]) + c.obj([{ s: spark(19, 20, 7.4), f: '#FFFFFF' }, { s: spark(47.5, 45, 5), f: '#DDF6FF' }], { ow: 2.2 }),
  // the Archer mid-tumble (the hood seen from above, as in the game) with the turn drawn round him
  roll: (c) => c.obj([{ s: P.puff(45, 52.6, 6), f: 'stone' }], { ow: 2.2 })
    + c.obj([
      { s: path(arc(32, 34, 20.6, 22, -152)), f: 'cream', w: 5, cap: 'butt' },
      { s: path('M6 20.6L20.6 28.6L8.6 38.4Z'), f: 'cream' },
    ], { ow: 2.6 })
    + c.obj(P.hood(), { t: 'translate(33 35.5) rotate(-32) scale(.86)' }),
  // the Berserker's flail going round: the spiked ball, its chain and the red sweep it leaves
  whirl: (c) => fit(0.94, c.obj([{ s: path('M36.2 11.8A23.4 23.4 0 1 0 50.6 46.6A20.4 20.4 0 1 1 34 20.6Z'), f: 'red', hi: [path('M36.2 11.8A23.4 23.4 0 0 0 9 30L13 31A19.6 19.6 0 0 1 35.6 15.4Z')], hic: '#FFD0A0', hio: 0.5 }])
    + c.obj([{ s: path('M22 46L29.4 36.6'), f: 'wood', w: 5.6, k: 0.4 }, { s: path('M30.6 35L42 23.6'), f: '#C9D2DE', w: 3.4, dash: '0.1 5.4' }])
    + c.obj(P.spikeBall(9.2, 8), { t: 'translate(43.6 22)' }), 33, 32),
  // a bolt that jumps on from spark to spark
  chainLightning: (c) => fit(0.86, c.obj([{ s: path('M13 13.6L35 17.4L27.4 27.4L50.6 26M50.6 26L32.6 37.6L41.6 43.6L21.6 53'), f: 'bolt', w: 6.4, cap: 'butt' }], { ow: 3 }).replace(/stroke-linejoin="round"/g, 'stroke-linejoin="miter" stroke-miterlimit="6"')
    + c.obj([{ s: burst(13.6, 14, 8.6, 4, 4, -90), f: '#FFFFFF' }, { s: burst(50.6, 26, 8, 3.6, 4, -70), f: '#FFFFFF' }, { s: burst(21.6, 52.4, 7.4, 3.4, 4, -100), f: '#FFFFFF' }], { ow: 2.4 })),
  // a ring of light on the floor and the mending it gives
  sanctuary: (c) => at(path('M11 44L17 10H47L53 44Z'), `fill="${c.linear([[0, '#FFE7A0', 0], [1, '#FFE7A0', 0.5]])}"`)
    + c.obj([{ s: ellipse(32, 44, 21, 8.6), f: '#FFF3C0', noOutline: true, o: 0.55 }, { s: ellipse(32, 44, 21, 8.6), f: 'gold', w: 5, k: 0.35 }])
    + c.obj([{ s: path('M27.4 10.6H36.6V19.4H45.4V28.6H36.6V37.4H27.4V28.6H18.6V19.4H27.4Z'), f: 'ghost', hi: [path('M27.4 10.6H36.6V13.6H27.4ZM18.6 19.4H27.4V22.4H18.6ZM36.6 19.4H45.4V22.4H36.6Z')], hio: 0.5 }]),
  // a bony hand out of the grave dirt, lit from below
  raiseDead: (c) => at(ellipse(32, 40, 23, 20), `fill="${c.radial([[0, '#B5F29A', 0.55], [1, '#B5F29A', 0]])}"`)
    + c.obj(P.boneHand(), { t: 'translate(32.5 31.5) scale(.96)' })
    + c.obj([{ s: path('M6 60Q9 46 21 45.4Q26 41.6 33 43.6Q40 41 45 45.4Q56 46.6 58 60Z'), f: 'earth' }])
    + at(ellipse(32.5, 45.6, 9, 2.6), 'fill="#D8FFB0" opacity=".9"'),
  // Twinfang's fang out of a curl of shadow
  backstab: (c) => c.obj([{ s: circle(15.6, 23.6, 6.4), f: 'shadow' }, { s: circle(23, 13.6, 6.6), f: 'shadow' }, { s: circle(34.6, 9.4, 5.6), f: 'shadow' },
      { s: path('M52 9C36 3 14 12 12 32C11 42 16 50 24 53C18 44 20 33 28 27C36 21 47 21 52 9Z'), f: 'shadow', sh: [path('M12 32C11 42 16 50 24 53C18 44 20 33 28 27L22 20Q13 26 12 32Z')], sho: 0.25 }])
    + c.obj(P.fang(), { t: 'translate(40.6 27) rotate(32) scale(.84)' })
    + c.obj([{ s: spark(18.4, 53.6, 5.6), f: '#FFFFFF' }], { ow: 2.2 }),
  // a wolf, head back, howling, over the ring that called it
  callWolf: (c) => c.obj([{ s: ellipse(32, 51, 21, 5.6), f: '#D8F2A8', noOutline: true, o: 0.35 }, { s: ellipse(32, 51, 21, 5.6), f: 'leaf', w: 4, k: 0.2 }])
    + c.obj(P.wolfHead(), { t: 'translate(29.5 31.5) rotate(-36) scale(.94)' }),

  // ---------------------------------------------------------------------------------------------- trinkets
  vampTooth: (c) => c.obj([
    { s: path('M-11-19Q-6.4-24.4 0-20.4Q6.4-24.4 11-19Q14.4-5 5 13Q2 19.4 0.6 24Q-3 14-7.6 4Q-13-9-11-19Z'), f: 'bone', sh: [path('M2-24H16V26H0Q8 0 2-24Z')], shc: '#8A7A58', sho: 0.3,
      hi: [streak('M-6.6-15Q-7.6-8-5-1', 3)], hio: 0.8, raw: '<path d="M-14 4Q-9 9-6 3.6Q-3 0 0 5.6Q3 10 6.4 3Q9-1 14 5V28H-14Z" fill="#C8303A"/>' },
    { s: path('M9.6 15.6C12.6 20 14.4 22.4 14.4 25A4.8 4.8 0 0 1 4.8 25C4.8 22.4 6.6 20 9.6 15.6Z'), f: 'blood' },
  ], { t: 'translate(31 31) rotate(8) scale(.9)' }),
  hookChain: (c) => c.obj([
    { s: ellipse(0, 0, 5.6, 3.8), f: 'steelDk', w: 3, t: 'translate(49.6 14.6) rotate(-32)' },
    { s: ellipse(0, 0, 5.6, 3.8), f: 'steelDk', w: 3, t: 'translate(42.4 19.4) rotate(-32)' },
  ], { ow: 2.4, t: 'translate(-3 3)' }) + c.obj([
    { s: path('M36 26V40A10 10 0 0 1 16 40'), f: 'steel', w: 7.4, k: 0.35, cap: 'butt' },
    { s: path('M9.6 41L16 27.4L22.6 41Z'), f: 'steel' },
    { s: circle(36, 23.6, 4.4), f: 'steel', w: 3.6, k: 0.3 },
  ], { t: 'translate(-3 3)' }) + at(path('M30.6 31V42'), 'stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity=".7" fill="none"'),
  whirlingKnives: (c) => c.obj([
    { s: path(arc(32, 32, 21, 128, 216)), f: '#C9D2DE', w: 3.2 }, { s: path(arc(32, 32, 21, -52, 36)), f: '#C9D2DE', w: 3.2 },
  ], { ow: 2 }) + c.obj(P.knife(), { t: 'translate(30.6 21.6) rotate(102) scale(.8)' }) + c.obj(P.knife(), { t: 'translate(33.4 42.4) rotate(282) scale(.8)' }),
  phoenixFeather: (c) => c.obj([
    { s: path('M13 55L30 33'), f: 'bone', w: 3, k: 0.5 },
    { s: path('M17.6 50C11 35 22 16 46 8C52 23 44 43 23.6 52.4Z'), f: 'feather',
      raw: `<path d="M21.6 46.6C19 35 28 22.4 42.6 14C45 25 38.6 39 25.6 48.6Z" fill="${c.fill('fire')}"/><path d="M26 41.6C26 34 32 26.6 39.6 20.6C40 27.6 35.6 36 28.6 42.6Z" fill="#FFF0A0"/>`,
      ink: [path('M17 37L22 39.6M22.6 26.6L28 30M47 26.6L42 28.6M41 39.6L36.6 39')], inkw: 1.6 },
    { s: path('M46 8C49 4 47.4 1 44.6-1.4C52.6 0.6 55.6 6.6 52.6 12.6C51 15.6 47.6 15 46 12Z'), f: 'fire' },
  ], { t: 'translate(4.4 5.6) scale(.86)' }) + c.obj([{ s: spark(46.6, 44, 4.6), f: '#FFE7A0' }], { ow: 2 }),
};

// ------------------------------------------------------------------------------------------------ stats (no tile)
const speedLines = (c, col, ys = [[8, 23, 17], [11, 41, 13]]) => c.obj(ys.map(([x, y, l]) => ({ s: path(`M${x} ${y}H${x + l}`), f: col, w: 7 })), { ow: 3.4 });
export const STAT_ICONS = {
  dmg: (c) => c.obj(P.sword({ w: 7.6, len: 35 }), { t: 'translate(30.5 33.5) rotate(45) scale(1.08)', ow: 3.4 }),
  hp: (c) => c.obj(P.heart('red'), { t: 'translate(32 32.5) scale(1)', ow: 3.6 }),
  armor: (c) => c.obj(P.shield('blue', 'steel'), { t: 'translate(32 32) scale(1.12)', ow: 3.2 }),
  atkSpeed: (c) => speedLines(c, '#FFD23A') + c.obj(P.sword({ w: 7.6, len: 30 }), { t: 'translate(40 35) rotate(45) scale(.96)', ow: 3.6 }),
  moveSpeed: (c) => speedLines(c, '#FFD23A', [[7, 19, 13], [9, 37, 9]]) + c.obj(P.boot('tan', 'leaf'), { t: 'translate(40 33.5) scale(1.04)', ow: 3.4 }),
  range: (c) => c.obj(P.bow(), { t: 'translate(24.6 39.4) rotate(-45) scale(.86)', ow: 4.2 }),
};
