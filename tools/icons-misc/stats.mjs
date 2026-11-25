// Round 19, icons-misc lane: the stat icons in style A (painted emblem, design/icons-r14 a.mjs) and style B (bold
// glyph, b.mjs). Every id statIcon() knows, plus the skill web's stat keys and a few the brief named (crit, regen).
// Each entry is (c) => markup in a 64x64 box, c a kit Ctx. Built to read at 20 px beside a number: one big object,
// thick ink, the speed-lines grammar for "faster" (attack speed, move speed, ability haste).
import { MAT, INK, at, path, circle, ellipse, rect, burst, spark, sector } from '../../design/icons-r14/kit.mjs';
import * as P from '../../design/icons-r14/parts.mjs';
import { STAT_ICONS as A14 } from '../../design/icons-r14/a.mjs';
import { STAT_GLYPH as B14, mono } from '../../design/icons-r14/b.mjs';
const { streak } = P;
Object.assign(MAT, {
  violet: ['#B9AAFF', '#6C5AD8'], teal: ['#8FF0E2', '#2FA89A'], pin: ['#FF8A78', '#C8333A'], ivory: ['#FFFDF4', '#D9D0B8'],
  slate: ['#6A6F86', '#3E4258'], bar: ['#3A2F3E', '#2A2230'],
});
const YEL = '#FFD23A';
const lines = (c, ys, col = YEL, ow = 3.4) => c.obj(ys.map(([x, y, l]) => ({ s: path(`M${x} ${y}H${x + l}`), f: col, w: 7 })), { ow });
const sparkBadge = (c, x = 50, y = 13, r = 10) => c.obj([{ s: spark(x, y, r), f: '#FFFFFF' }], { ow: 2.6 });

// ------------------------------------------------------------------------------------------------ shapes shared by A and B
const SH = {
  clock: (cx, cy, r) => circle(cx, cy, r),
  cross: 'M24 6H40V24H58V40H40V58H24V40H6V24H24Z',
  drop: 'M32 4C41 17 51 27 51 40A19 19 0 0 1 13 40C13 27 23 17 32 4Z',
  pin: 'M32 61C21 47 11 37 11 24A21 21 0 0 1 53 24C53 37 43 47 32 61Z',
  crown: 'M7 20L20 33L32 10L44 33L57 20L52 52H12Z',
  hex: 'M32 4L56 18V46L32 60L8 46V18Z',
  stone: 'M14 57V27A18 18 0 0 1 50 27V57Z',
  gem: 'M32 4L56 28L32 61L8 28Z',
  flag: 'M19 9H54L45 20.5L54 32H19Z',
  pouch: 'M15 32Q11 59 32 59Q53 59 49 32Q46 23 40 20H24Q18 23 15 32Z',
  stairs: 'M4 58V42H21V26H38V10H60V58Z',
};

// a round clock face with the game's cooldown wipe (the part still to wait is dark)
function clockA(c, cx = 32, cy = 35, r = 23, frac = 0.62) {
  return c.obj([
    { s: rect(cx - 5, cy - r - 8, 10, 8, 2.6), f: 'goldDk' },
    { s: circle(cx, cy, r), f: 'blue', hi: [path(`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx} ${cy - r}V${cy - r + 4}A${r - 4} ${r - 4} 0 0 0 ${cx - r + 4} ${cy}Z`)], hio: 0.35 },
    { s: circle(cx, cy, r - 5.4), f: 'cream', noOutline: true,
      raw: at(sector(cx, cy, r, frac), `fill="#3F6FC0" opacity=".55"`)
        + `<path d="M${cx} ${cy}V${cy - r + 9}M${cx} ${cy}L${cx + 8} ${cy + 5}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="3" fill="${INK}"/>` },
  ], { ow: 3.4 });
}
function gauge(c, frac, col, arrowUp) {
  const bar = rect(4, 30, 56, 26, 10);
  return c.obj([{ s: bar, f: 'bar', raw: at(rect(9, 35, 46 * frac, 16, 6), `fill="${MAT[col] ? c.fill(col) : col}"`) + at(rect(9, 35, 46 * frac, 5, 2.5), 'fill="#FFFFFF" opacity=".45"') }], { ow: 3.4 })
    + c.obj([{ s: arrowUp ? path('M16 24L32 4L48 24Z') : path('M16 4L32 24L48 4Z'), f: arrowUp ? col : 'steelDk' }], { ow: 3 });
}

// ------------------------------------------------------------------------------------------------ style A
export const STAT_A = {
  hp: A14.hp, armor: A14.armor, dmg: A14.dmg, aps: A14.atkSpeed, speed: A14.moveSpeed, range: A14.range,
  cd: (c) => clockA(c),
  haste: (c) => lines(c, [[4, 27, 13], [6, 43, 10]]) + `<g transform="translate(6 0)">${clockA(c, 32, 35, 21)}</g>`,
  heal: (c) => c.obj([{ s: path(SH.cross), f: 'ghost', hi: [path('M24 6H40V11H24ZM6 24H24V29H6Z')], hio: 0.55, sh: [path('M40 40H58V58H40Z')], sho: 0.15 }], { t: 'translate(32 32) scale(.92) translate(-32 -32)', ow: 3.6 }),
  potency: (c) => c.obj([{ s: path(SH.drop), f: 'necro', hi: [streak('M21 37Q21 30 26 24', 4.4)], hio: 0.7, sh: [path('M40 20Q54 34 50 46Q46 58 30 60L60 64V20Z')], sho: 0.2 }], { ow: 3.6 })
    + c.obj([{ s: circle(36, 44, 4.4), f: '#FFFFFF', o: 0.85 }, { s: circle(27, 50, 2.6), f: '#FFFFFF', o: 0.85 }], { ow: 0 }),
  regen: (c) => c.obj(P.heart('ghost'), { t: 'translate(32 33) scale(1.02)', ow: 3.6 })
    + c.obj([{ s: path('M28.5 21H35.5V28H42.5V35H35.5V42H28.5V35H21.5V28H28.5Z'), f: '#FFFFFF' }], { ow: 2.2 }),
  crit: (c) => c.obj([{ s: burst(32, 32, 29, 13, 8, -90), f: 'fire' }], { ow: 3.4 }) + c.obj([{ s: burst(32, 32, 15, 7, 8, -67.5), f: 'fireCore' }], { ow: 2.4 }),
  kills: (c) => c.obj(P.skull(), { t: 'translate(32 32) scale(1.38)', ow: 2.6 }),
  runs: (c) => c.obj([{ s: path('M16 59V7'), f: 'wood', w: 5, k: 0.4 }, { s: path(SH.flag), f: 'red', hi: [path('M19 9H54L51.4 12.4H19Z')], hio: 0.5, sh: [path('M19 24H60V34H19Z')], sho: 0.18 }, { s: circle(16, 6.5, 4.4), f: 'gold' }], { ow: 3.4 }),
  taken: (c) => c.obj(P.heart('blood'), { t: 'translate(32 33) scale(1.02)', ow: 3.6 })
    + `<path d="M33 10L27 22L36 30L28 40L33 50" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linejoin="round" stroke-linecap="round"/>`,
  blocked: (c) => c.obj([
    { s: circle(30, 34, 24), f: 'steelDk', hi: [path('M6 34A24 24 0 0 1 30 10V15A19 19 0 0 0 11 34Z')], hio: 0.5 },
    { s: circle(30, 34, 18.6), f: 'wood', noOutline: true, ink: [path('M12 28H48M12 40H48')], inkw: 1.8 },
    { s: circle(30, 34, 7), f: 'steel' },
  ], { ow: 3.4 }) + c.obj([{ s: burst(50, 13, 12, 5, 6, -90), f: 'bolt' }], { ow: 2.6 }),
  downs: (c) => c.obj([{ s: ellipse(32, 56, 26, 6), f: 'earth' }], { ow: 3 }) + c.obj([{ s: path(SH.stone), f: 'stone', hi: [streak('M20 50V28Q20 19 27 15', 4)], hio: 0.4, sh: [path('M38 0H52V58H38Z')], sho: 0.18,
    raw: `<path d="M32 22V40M25 28H39" fill="none" stroke="${INK}" stroke-width="3.8" stroke-linecap="round"/>` }], { ow: 3.4 }),
  revives: (c) => at(circle(32, 30, 28), `fill="${c.radial([[0, '#B5F29A', 0.55], [1, '#B5F29A', 0]])}"`)
    + c.obj([{ s: ellipse(32, 17, 8.6, 10.6), f: 'gold', w: 6.4, k: 0.3 }, { s: path('M32 30V59'), f: 'gold', w: 8, k: 0.35, cap: 'butt' }, { s: path('M15 33H49'), f: 'gold', w: 8, k: 0.35 }], { ow: 3.4 }),
  best: (c) => c.obj([{ s: burst(32, 34, 29, 12.6, 5, -90), f: 'gold', hi: [path('M32 5L26 22H4L19 30Z')], hio: 0.45, sh: [path('M32 34L64 22V64H32Z')], sho: 0.14 }], { ow: 3.4 }),
  xp: (c) => c.obj([{ s: path(SH.gem), f: 'violet', hi: [path('M32 4L8 28H32Z')], hio: 0.45, sh: [path('M32 28H56L32 61Z')], sho: 0.25, ink: [path('M8 28H56M32 4V61')], inkw: 1.4 }], { ow: 3.4 }),
  gold: (c) => c.obj([
    { s: circle(32, 33, 25), f: 'gold', sh: [path('M7 38H64V64H7Z')], sho: 0.12 },
    { s: circle(32, 33, 17), f: 'goldDk', noOutline: true, raw: `<circle cx="32" cy="33" r="17" fill="none" stroke="#8A5A12" stroke-width="2.4" opacity=".7"/>` + at(burst(32, 33, 10, 4.4, 5, -90), 'fill="#FFE07A"') },
  ], { ow: 3.4 }) + at(streak('M14 25Q17 15 26 11', 3.4), 'fill="none" stroke="#FFFFFF" stroke-linecap="round" opacity=".75"'),
  found: (c) => c.obj([{ s: path(SH.pin), f: 'pin', hi: [streak('M17 22Q19 12 28 8', 4)], hio: 0.6, sh: [path('M44 0H64V64H32Z')], sho: 0.15 }, { s: circle(32, 24, 8), f: 'cream' }], { ow: 3.4 }),
  elite: (c) => c.obj([{ s: spark(32, 32, 29), f: 'holy' }], { ow: 3.4 }) + c.obj([{ s: spark(32, 32, 12), f: '#FFFFFF', noOutline: true }], { ow: 0 }),
  major: (c) => c.obj([{ s: path(SH.crown), f: 'gold', hi: [path('M7 20L20 33L32 10V16L20 38Z')], hio: 0.4, sh: [path('M10 44H60V60H10Z')], sho: 0.2,
    raw: '<circle cx="32" cy="40" r="5" fill="#E0504A" stroke="#2B2230" stroke-width="2"/><circle cx="20" cy="43" r="3.4" fill="#6C9BE6" stroke="#2B2230" stroke-width="1.8"/><circle cx="44" cy="43" r="3.4" fill="#6C9BE6" stroke="#2B2230" stroke-width="1.8"/>' },
    { s: circle(7, 19, 4), f: 'gold' }, { s: circle(57, 19, 4), f: 'gold' }, { s: circle(32, 9, 4.4), f: 'gold' }], { ow: 3.4 }),
  tier: (c) => c.obj([{ s: path(SH.hex), f: 'gold', sh: [path('M32 32H64V64H32Z')], sho: 0.15 }, { s: path('M32 14L46 22V42L32 50L18 42V22Z'), f: 'holy', noOutline: true,
    raw: `<path d="M22 40L32 30L42 40M22 30L32 20L42 30" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>` }], { ow: 3.4 }),
  fill: (c) => gauge(c, 0.72, 'gold', true),
  decay: (c) => gauge(c, 0.3, '#9BA2C0', false),
  time: (c) => c.obj([
    { s: circle(32, 9, 5), f: 'gold', w: 3.4, k: 0.3 },
    { s: circle(32, 36, 24), f: 'gold' },
    { s: circle(32, 36, 18.4), f: 'cream', noOutline: true, raw: `<path d="M32 36V23M32 36L41 41" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><circle cx="32" cy="36" r="3" fill="${INK}"/>` },
  ], { ow: 3.4 }),
  bag: (c) => c.obj([{ s: path(SH.pouch), f: 'tan', hi: [streak('M20 50Q16 40 20 32', 4)], hio: 0.4, sh: [path('M38 20H64V64H38Z')], sho: 0.18 },
    { s: path('M22 20L16 9Q32 15 48 9L42 20Z'), f: 'tan' }, { s: rect(18, 17, 28, 7, 3.4), f: 'leather' }, { s: circle(32, 41, 5.4), f: 'gold' }], { ow: 3.4 }),
  floor: (c) => c.obj([{ s: path(SH.stairs), f: 'stone', hi: [path('M4 42H21V46H4ZM21 26H38V30H21ZM38 10H60V14H38Z')], hio: 0.55, sh: [path('M4 52H64V64H4Z')], sho: 0.2,
    ink: [path('M21 42V58M38 26V58')], inkw: 2 }], { ow: 3.6 }),
};
// the skill web's keys (heroes.js STATS) and its mastery tips: the same pictures; an ability's own power,
// cooldown, mending and potency nodes wear a spark (it is that ability's, not the hero's)
Object.assign(STAT_A, {
  atkSpeed: STAT_A.aps, moveSpeed: STAT_A.speed, status: STAT_A.potency,
  abDmg: (c) => `<g transform="translate(-3 3)">${STAT_A.dmg(c)}</g>` + sparkBadge(c),
  abCd: (c) => `<g transform="translate(-3 3) scale(.92)">${STAT_A.cd(c)}</g>` + sparkBadge(c),
  abHeal: (c) => `<g transform="translate(-2 4) scale(.9)">${STAT_A.heal(c)}</g>` + sparkBadge(c),
  abStatus: (c) => `<g transform="translate(-3 3) scale(.94)">${STAT_A.potency(c)}</g>` + sparkBadge(c),
  mastery: (c) => c.obj([{ s: circle(32, 32, 28), f: 'gold', w: 5, k: 0.35 }], { ow: 3 }) + `<g transform="translate(32 33) scale(.72) translate(-32 -34)">${STAT_A.best(c)}</g>`,
});

// ------------------------------------------------------------------------------------------------ style B
// one flat colour per stat, the ink outline, no shading: r14's bold glyph without a tile. A stat's colour is the one
// round 14 gave it; the new ones take the colour their style A picture is painted in.
export const STAT_COL = {
  dmg: '#FF8A6E', hp: '#F0606A', armor: '#6FA3F0', aps: '#FFD23A', speed: '#5FD0B8', range: '#C9A8F0', cd: '#7FB8F0', haste: '#4FD8C8',
  heal: '#6CD06A', potency: '#B58CFF', regen: '#7CE0A0', crit: '#FFB347', kills: '#E8E2D0', runs: '#F07060', taken: '#E8604C', blocked: '#7FB8E8',
  downs: '#A99C8B', revives: '#7CE0A0', best: '#F5B841', xp: '#8C7CFF', gold: '#FFCB4A', found: '#FF7A6A', elite: '#FFE6A0', major: '#F5B841',
  tier: '#F5B841', fill: '#F5B841', decay: '#9BA2C0', time: '#F2E8D2', bag: '#D8A866', floor: '#C3D0E6', mastery: '#F5B841',
};
const one = (s, f, extra = {}) => ({ s, f, ...extra });
const holes = (d) => `<path d="${d}" fill="${INK}"/>`;
const blines = (c, f, ys) => c.obj(ys.map(([x, y, l]) => ({ s: path(`M${x} ${y}H${x + l}`), f, w: 7 })), { ow: 4 });
function clockB(c, f, cx = 32, cy = 35, r = 23) {
  return c.obj([one(rect(cx - 5, cy - r - 8, 10, 8, 2.6), f), one(circle(cx, cy, r), f, { raw: `<path d="M${cx} ${cy}V${cy - r + 8}M${cx} ${cy}L${cx + 8} ${cy + 5}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` })], { ow: 4 });
}
const BG = {
  hp: (c, f) => B14.hp(c, f), armor: (c, f) => B14.armor(c, f), dmg: (c, f) => B14.dmg(c, f), aps: (c, f) => B14.atkSpeed(c, f), speed: (c, f) => B14.moveSpeed(c, f), range: (c, f) => B14.range(c, f),
  cd: (c, f) => clockB(c, f),
  haste: (c, f) => blines(c, f, [[4, 27, 13], [6, 43, 10]]) + `<g transform="translate(6 0)">${clockB(c, f, 32, 35, 21)}</g>`,
  heal: (c, f) => c.obj([one(path(SH.cross), f)], { t: 'translate(32 32) scale(.92) translate(-32 -32)', ow: 4.3 }),
  potency: (c, f) => c.obj([one(path(SH.drop), f, { raw: '<circle cx="36" cy="44" r="4.4" fill="#2B2230" opacity=".5"/><circle cx="27" cy="50" r="2.6" fill="#2B2230" opacity=".5"/>' })], { ow: 4 }),
  regen: (c, f) => c.obj([one(path(P.heartD), f, { raw: holes('M-3.5-12H3.5V-5H10.5V2H3.5V9H-3.5V2H-10.5V-5H-3.5Z') })], { t: 'translate(32 33) scale(1.02)', ow: 4 }),
  crit: (c, f) => c.obj([one(burst(32, 32, 29, 13, 8, -90), f, { ink: [burst(32, 32, 14, 6.6, 8, -67.5)], inkw: 2.6 })], { ow: 4 }),
  kills: (c, f) => c.obj(mono(P.skull(), f).map((p) => ({ ...p, raw: '<ellipse cx="-6.6" cy="-1" rx="4.5" ry="5" fill="#2B2230"/><ellipse cx="6.6" cy="-1" rx="4.5" ry="5" fill="#2B2230"/><path d="M0 5.4L2.4 9.6H-2.4Z" fill="#2B2230"/><path d="M-5.6 12.6V19M0 12.6V19M5.6 12.6V19" stroke="#2B2230" stroke-width="2" fill="none"/>' })), { t: 'translate(32 32) scale(1.38)', ow: 2.9 }),
  runs: (c, f) => c.obj([one(path('M16 59V7'), f, { w: 5 }), one(path(SH.flag), f), one(circle(16, 6.5, 4.4), f)], { ow: 4 }),
  taken: (c, f) => c.obj([one(path(P.heartD), f)], { t: 'translate(32 33) scale(1.02)', ow: 4 }) + `<path d="M33 10L27 22L36 30L28 40L33 50" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`,
  blocked: (c, f) => c.obj([one(circle(30, 34, 24), f, { ink: [circle(30, 34, 18), circle(30, 34, 6)], inkw: 2.6 })], { ow: 4 }) + c.obj([one(burst(50, 13, 12, 5, 6, -90), f)], { ow: 3 }),
  downs: (c, f) => c.obj([one(path(SH.stone), f, { raw: `<path d="M32 22V40M25 28H39" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` }), one(path('M6 58H58'), f, { w: 5 })], { ow: 4 }),
  revives: (c, f) => c.obj([one(ellipse(32, 17, 8.6, 10.6), f, { w: 6.4 }), one(path('M32 30V59'), f, { w: 8, cap: 'butt' }), one(path('M15 33H49'), f, { w: 8 })], { ow: 4 }),
  best: (c, f) => c.obj([one(burst(32, 34, 29, 12.6, 5, -90), f)], { ow: 4 }),
  xp: (c, f) => c.obj([one(path(SH.gem), f, { ink: [path('M8 28H56M32 4V61')], inkw: 2.2 })], { ow: 4 }),
  gold: (c, f) => c.obj([one(circle(32, 33, 25), f, { ink: [circle(32, 33, 17)], inkw: 2.6 })], { ow: 4 }),
  found: (c, f) => c.obj([one(path(SH.pin), f, { raw: holes('M32 16A8 8 0 1 0 32.01 16Z') })], { ow: 4 }),
  elite: (c, f) => c.obj([one(spark(32, 32, 29), f)], { ow: 4 }),
  major: (c, f) => c.obj([one(path(SH.crown), f), one(circle(7, 19, 4), f), one(circle(57, 19, 4), f), one(circle(32, 9, 4.4), f)], { ow: 4 }),
  tier: (c, f) => c.obj([one(path(SH.hex), f, { raw: `<path d="M22 40L32 30L42 40M22 30L32 20L42 30" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>` })], { ow: 4 }),
  fill: (c, f) => c.obj([one(rect(4, 30, 56, 26, 10), '#3A2F3E', { raw: at(rect(9, 35, 33, 16, 6), `fill="${f}"`) })], { ow: 4 }) + c.obj([one(path('M16 24L32 4L48 24Z'), f)], { ow: 3.4 }),
  decay: (c, f) => c.obj([one(rect(4, 30, 56, 26, 10), '#3A2F3E', { raw: at(rect(9, 35, 14, 16, 6), `fill="${f}"`) })], { ow: 4 }) + c.obj([one(path('M16 4L32 24L48 4Z'), f)], { ow: 3.4 }),
  time: (c, f) => c.obj([one(circle(32, 9, 5), f, { w: 3.6 }), one(circle(32, 36, 24), f, { raw: `<path d="M32 36V23M32 36L41 41" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` })], { ow: 4 }),
  bag: (c, f) => c.obj([one(path(SH.pouch), f), one(path('M22 20L16 9Q32 15 48 9L42 20Z'), f), one(rect(18, 17, 28, 7, 3.4), f)], { ow: 4 }),
  floor: (c, f) => c.obj([one(path(SH.stairs), f)], { ow: 4 }),
  mastery: (c, f) => c.obj([one(circle(32, 32, 28), f, { w: 5 })], { ow: 3.4 }) + c.obj([one(burst(32, 34, 20, 8.6, 5, -90), f)], { ow: 3.4 }),
};
const bSpark = (c) => c.obj([{ s: spark(50, 13, 10), f: '#FFFFFF' }], { ow: 3 });
export const STAT_B = Object.fromEntries(Object.entries(BG).map(([id, fn]) => [id, (c) => fn(c, STAT_COL[id])]));
Object.assign(STAT_B, {
  atkSpeed: STAT_B.aps, moveSpeed: STAT_B.speed, status: STAT_B.potency,
  abDmg: (c) => `<g transform="translate(-3 3)">${BG.dmg(c, STAT_COL.dmg)}</g>` + bSpark(c),
  abCd: (c) => `<g transform="translate(-3 3) scale(.92)">${BG.cd(c, STAT_COL.cd)}</g>` + bSpark(c),
  abHeal: (c) => `<g transform="translate(-2 4) scale(.9)">${BG.heal(c, STAT_COL.heal)}</g>` + bSpark(c),
  abStatus: (c) => `<g transform="translate(-3 3) scale(.94)">${BG.potency(c, STAT_COL.potency)}</g>` + bSpark(c),
});

// names for the sheets
export const STAT_NAMES = {
  hp: 'Health', armor: 'Armour', dmg: 'Damage', aps: 'Attack speed', speed: 'Move speed', range: 'Reach', cd: 'Cooldown', haste: 'Ability haste',
  heal: 'Healing', potency: 'Potency', regen: 'Regen', crit: 'Critical', kills: 'Kills', runs: 'Runs', taken: 'Taken', blocked: 'Blocked', downs: 'Downs',
  revives: 'Revives', best: 'Best hit', xp: 'XP', gold: 'Gold', found: 'Found in', elite: 'Elite', major: 'Major', tier: 'Level / tier', fill: 'Fills at',
  decay: 'Fades', time: 'Time', bag: 'In the bag', floor: 'Floor', mastery: 'Mastery', abDmg: 'Ability power', abCd: 'Ability cooldown',
  abHeal: 'Ability mending', abStatus: 'Ability potency',
};
// what the game asks for under another name (the skill web's keys)
export const STAT_ALIAS = { atkSpeed: 'aps', moveSpeed: 'speed', status: 'potency' };
