// Round 14, lane I: writes the sample icons (one SVG per icon per style) and the pages the renders are made from.
//   node design/icons-r14/build.mjs     -> a/ b/ c/ (svg, with two icons' cooldown and locked states), sheets/ (html)
//   node design/icons-r14/render.mjs    -> renders/ (png), through the installed Edge, headless
// Nothing here is loaded by the game.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { Ctx } from './kit.mjs';
import { ALL, ABILITIES, TRINKETS, STATS, ROLE_COL, RARITY_COL } from './subjects.mjs';
import * as GAME_ICONS from '../../js/icons.js';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const STYLES = { a: await import('./a.mjs'), b: await import('./b.mjs'), c: await import('./c.mjs') };
export const STYLE_INFO = {
  a: { name: 'Painted emblem', line: 'The sprite style in a tile: the object itself, outlined and shaded.', carry: 'Rim = role (abilities) or rarity (trinkets). The object keeps its own colours.' },
  b: { name: 'Bold glyph', line: 'Two tones: one cream shape on a tile in the role colour.', carry: 'Tile = role colour (abilities, square) or rarity (trinkets, hexagon).' },
  c: { name: 'Scene medallion', line: 'A round window onto the ability happening, as the game shows it.', carry: 'Backdrop = element, ring = role and the cooldown timer. Trinkets on a rarity diamond.' },
};

// one icon as a standalone svg string; state: undefined | 'cooldown' | 'locked'
export function draw(style, s, state, size = 64) {
  const S = STYLES[style], c = new Ctx(`${style}-${s.id}${state ? '-' + state[0] : ''}`);
  if (s.kind === 'stat') return c.svg(S.stat ? S.stat(c, s) : S.STAT_ICONS[s.id](c, s), { size });
  return c.svg(S.tile(c, s, S.ICONS[s.id](c, s, state), state), { size });
}
const STATE_OF = ['frostArrow', 'callWolf'];
for (const style of Object.keys(STYLES)) {
  const dir = path.join(HERE, style); fs.mkdirSync(dir, { recursive: true });
  for (const s of ALL) {
    fs.writeFileSync(path.join(dir, s.id + '.svg'), draw(style, s) + '\n');
    if (STATE_OF.includes(s.id)) for (const st of ['cooldown', 'locked']) fs.writeFileSync(path.join(dir, `${s.id}--${st}.svg`), draw(style, s, st) + '\n');
  }
}

// ------------------------------------------------------------------------------------------------ the pages
// ids must stay unique when one icon is on a page several times
let uid = 0;
const ic = (style, s, px, state) => draw(style, s, state, px).replace(/\b(id="|url\(#)([a-c]-)/g, (m, a, b) => `${a}u${uid}-${b}`).replace(/^<svg /, () => { uid++; return `<svg style="display:block" `; });
const by = (id) => ALL.find((s) => s.id === id);
const CSS = `*{box-sizing:border-box}html,body{margin:0;background:#0E1120;color:#F2E8D2;font:650 13px/1.3 ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-variant-numeric:tabular-nums}
body{width:390px}b{font-weight:850}.cap{font-size:10px;font-weight:850;letter-spacing:.09em;text-transform:uppercase;color:#9BA2C0}.q{color:#9BA2C0}
.panel{background:#171B2E;border-radius:14px;box-shadow:inset 0 0 0 1px #2E3560;padding:10px;margin:8px}
h1{font-size:17px;font-weight:850;margin:0}.sub{font-size:11.5px;color:#9BA2C0;margin-top:2px}`;
const page = (body, extra = '') => `<!doctype html><meta charset="utf-8"><style>${CSS}${extra}</style><body><div id="shot">${body}</div></body>\n`;

// the big sheet: every icon large enough to judge the drawing
function sheet(style) {
  const I = STYLE_INFO[style];
  const cell = (s, px, w) => `<div style="width:${w}px;text-align:center">${ic(style, s, px)}<div style="font-size:8.5px;line-height:1.15;margin-top:3px;color:#C8CCE0;height:20px">${s.name}</div></div>`;
  const row = (list, px, w, gap) => `<div style="display:flex;gap:${gap}px;justify-content:center;margin-top:8px">${list.map((s) => cell(s, px, w)).join('')}</div>`;
  const st = (id) => { const s = by(id); return `<div style="text-align:center"><div style="display:flex;gap:6px">${ic(style, s, 44)}${ic(style, s, 44, 'cooldown')}${ic(style, s, 44, 'locked')}</div></div>`; };
  return page(`<div style="padding:12px 9px 12px">
    <h1>Style ${style.toUpperCase()} · ${I.name}</h1><div class="sub">${I.line}</div>
    <div class="cap" style="margin-top:12px">Abilities</div>
    ${row(ABILITIES.slice(0, 5).map((a) => by(a.id)), 68, 70, 5)}${row(ABILITIES.slice(5).map((a) => by(a.id)), 68, 70, 5)}
    <div class="cap" style="margin-top:6px">Trinkets</div>${row(TRINKETS.map((a) => by(a.id)), 68, 70, 5)}
    <div class="cap" style="margin-top:6px">Stats</div>${row(STATS.map((a) => by(a.id)), 46, 58, 4)}
    <div class="cap" style="margin-top:6px">Ready · on cooldown · locked</div>
    <div style="display:flex;gap:22px;justify-content:center;margin-top:8px">${st('frostArrow')}${st('callWolf')}</div>
    <div class="sub" style="margin-top:10px;text-align:center">${I.carry}</div>
  </div>`);
}

// the hero's card from the battle dock, at its real size (css/hud.css), with today's icons or a style's
const HUD_CSS = `.hcard{position:relative;display:block;width:89px;padding:6px;border-radius:14px;background:rgba(23,27,46,.96);box-shadow:inset 0 0 0 1px #2E3560,0 4px 12px rgba(0,0,0,.4)}
.hc-top{position:relative;display:block;height:38px;margin-bottom:5px}.hc-face{position:absolute;left:0;top:0;width:38px;height:38px;border-radius:11px;overflow:hidden;background:radial-gradient(circle at 50% 30%,#343C6A,#1B2038 75%);box-shadow:inset 0 0 0 1.5px #3B4478}
.hc-face img{position:absolute;left:2px;top:2px;width:34px;height:34px;object-fit:contain}.hc-items{position:absolute;left:42px;right:0;top:0;height:38px;line-height:0}
.hc-items .it{display:inline-block;width:18px;height:18px;margin:0 1px 1px 0;vertical-align:top}.hc-items .it svg{display:block;width:100%;height:100%}
.bar{position:relative;display:block;border-radius:999px;background:#0E1120;overflow:hidden}.bar>i{position:absolute;left:0;top:0;bottom:0;border-radius:999px}.bar>em{position:relative;display:block;text-align:center;font-style:normal;font-weight:850;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.6)}
.hc-hp{height:13px}.hc-hp>i{background:linear-gradient(180deg,#7BDB6E,#3FA447);width:72%}.hc-hp>em{font-size:9.5px;line-height:13px}
.hc-xprow{position:relative;display:block;height:16px;margin-top:3px;padding-left:13px}.lvl{position:absolute;left:0;top:0;z-index:1;min-width:17px;height:16px;padding:0 3px;font-size:10.5px;line-height:16px;text-align:center;border-radius:6px;background:#F5B841;color:#3A2606;font-weight:850;box-shadow:0 0 0 1.5px #0E1120}
.hc-xp{height:10px;margin-top:3px;border-radius:0 999px 999px 0}.hc-xp>i{background:#8C7CFF;width:40%}.hc-xp>em{font-size:8px;line-height:10px}
.hc-abil{display:flex;justify-content:space-between;margin-top:6px}
.ab{position:relative;display:block;width:24px;height:24px;border-radius:50%;background:#2A3156;box-shadow:inset 0 0 0 1.5px var(--ac)}.ab .ico{position:absolute;left:3px;top:3px;width:18px;height:18px}
.ab::after{content:'';position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%;background:conic-gradient(rgba(8,10,20,.78) calc(var(--p,0)*360deg),rgba(8,10,20,0) 0deg)}.ab.ready{box-shadow:inset 0 0 0 2px var(--ac),0 0 8px var(--ac)}
.nab{display:block;width:24px;height:24px}.ico{display:block}`;
const KIT = ['barrage', 'frostArrow', 'roll'], WORN = ['vampTooth', 'hookChain'];
function hudCard(style) {
  const face = '<div class="hc-face"><img src="../../../art/heroes/archer.svg" alt=""></div>';
  const bars = '<div class="bar hc-hp"><i></i><em>130/180</em></div><div class="hc-xprow"><span class="lvl">7</span><div class="bar hc-xp"><i></i><em>212/530</em></div></div>';
  if (!style) { // today
    const ab = (id, i) => `<span class="ab${i === 0 ? ' ready' : ''}" style="--ac:${GAME_ICONS.ABILITY_COLOR[GAME_ICONS.abilityGlyph(id)]};--p:${i === 1 ? 0.62 : 0}">${GAME_ICONS.icon('ability', id)}</span>`;
    return `<div class="hcard"><div class="hc-top">${face}<div class="hc-items">${WORN.map((t) => `<span class="it">${GAME_ICONS.icon('trinket', t)}</span>`).join('')}</div></div>${bars}<div class="hc-abil">${KIT.map(ab).join('')}</div></div>`;
  }
  const ab = (id, i) => `<span class="nab"${i === 0 ? ` style="filter:drop-shadow(0 0 3px ${ROLE_COL.ranged})"` : ''}>${ic(style, by(id), 24, i === 1 ? 'cooldown' : undefined)}</span>`;
  return `<div class="hcard"><div class="hc-top">${face}<div class="hc-items">${WORN.map((t) => `<span class="it">${ic(style, by(t), 18)}</span>`).join('')}</div></div>${bars}<div class="hc-abil">${KIT.map(ab).join('')}</div></div>`;
}
// a unit's stats: the designer's "sword + a number"
function statBlock(style) {
  const chip = (s, px, fs) => `<span style="display:inline-flex;align-items:center;gap:${px > 15 ? 5 : 3}px">${ic(style, s, px)}<b style="font-size:${fs}px">${s.val}</b></span>`;
  const stats = STATS.map((s) => by(s.id));
  return `<div class="panel" style="padding:10px 10px 12px">
    <div style="display:flex;align-items:center;gap:9px"><span style="display:block;width:40px;height:40px;border-radius:12px;background:radial-gradient(circle at 50% 30%,#343C6A,#1B2038 75%);box-shadow:inset 0 0 0 2px ${ROLE_COL.ranged};overflow:hidden"><img src="../../../art/heroes/archer.svg" style="width:36px;height:36px;margin:2px" alt=""></span>
      <div><b style="font-size:17px">Archer</b><div class="cap" style="color:${ROLE_COL.ranged}">Ranged · level 7</div></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:11px;padding:7px 8px;background:#1F2440;border-radius:10px">${stats.map((s) => chip(s, 14, 12.5)).join('')}</div>
    <div class="cap" style="margin-top:10px">The same, in a grid with names</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">${stats.map((s) => `<div style="background:#1F2440;border-radius:10px;padding:7px 8px"><div>${chip(s, 16, 16)}</div><div class="q" style="font-size:10px;margin-top:1px">${s.name}</div></div>`).join('')}</div>
  </div>`;
}
function mock(style) {
  const I = STYLE_INFO[style];
  const rowAb = (id, state, note) => { const s = by(id); return `<div style="display:flex;gap:10px;align-items:center;padding:6px 0"><span style="flex:none">${ic(style, s, 40, state)}</span><div style="min-width:0"><b>${s.name}</b> <span class="q" style="font-size:11px">${note}</span><div class="q" style="font-size:11px;line-height:1.25">${s.desc}</div></div></div>`; };
  const tr = (id) => { const s = by(id); return `<div style="text-align:center;width:84px"><div style="display:inline-block">${ic(style, s, 36)}</div><div style="font-size:9.5px;line-height:1.15;margin-top:3px">${s.name}</div><div style="font-size:9px;color:${RARITY_COL[s.rarity]};text-transform:capitalize">${s.rarity}</div></div>`; };
  return page(`<div style="padding:10px 8px 2px"><h1>Style ${style.toUpperCase()} at real size</h1><div class="sub">${I.name}: the icons as big as the game shows them.</div></div>
    <div style="margin:8px;padding:12px 10px 10px;border-radius:14px;background:linear-gradient(180deg,#5A6A4E,#3D4A3A 55%,#141829);display:flex;gap:10px;justify-content:center;align-items:flex-end">
      <div style="text-align:center"><div class="cap" style="color:#E8E2D0;margin-bottom:5px;text-shadow:0 1px 2px #000">Today</div>${hudCard(null)}</div>
      <div style="text-align:center"><div class="cap" style="color:#E8E2D0;margin-bottom:5px;text-shadow:0 1px 2px #000">Style ${style.toUpperCase()}</div>${hudCard(style)}</div>
      <div style="width:150px;font-size:10.5px;line-height:1.3;color:#E8E2D0;text-shadow:0 1px 2px #000;align-self:center">The Archer's card in a fight: three abilities at 24 px (the first ready, the second coming round), two trinkets at 18 px.</div>
    </div>
    ${statBlock(style)}
    <div class="panel"><div class="cap">Abilities, 40 px</div>${rowAb('chainLightning', undefined, '· 9s')}${rowAb('frostArrow', 'cooldown', '· coming round')}${rowAb('callWolf', 'locked', '· unlocks at level 5')}</div>
    <div class="panel"><div class="cap">Trinkets, 36 px</div><div style="display:flex;justify-content:space-between;margin-top:7px">${TRINKETS.map((t) => tr(t.id)).join('')}</div></div>`, HUD_CSS);
}
const statsPage = (style) => page(`<div style="padding:10px 8px 0"><h1>Stats · style ${style.toUpperCase()}</h1><div class="sub">${STYLE_INFO[style].name}. Top row: icons at 14 px beside a number. Below: 16 px.</div></div>${statBlock(style)}
  <div style="display:flex;gap:6px;justify-content:center;padding:4px 8px 12px">${STATS.map((s) => `<div style="width:58px;text-align:center">${ic(style, by(s.id), 50)}<div style="font-size:9px;color:#C8CCE0;margin-top:2px">${s.name}</div></div>`).join('')}</div>`, HUD_CSS);
// a square that shows four icons large (the board's tile for a style)
const thumb = (style) => page(`<div style="width:360px;height:360px;background:#171B2E;display:grid;grid-template-columns:1fr 1fr;place-items:center;padding:14px">${['frostArrow', 'chainLightning', 'callWolf', 'phoenixFeather'].map((id) => ic(style, by(id), 150)).join('')}</div>`);
// one icon alone: big, and at the sizes the game would show it
function single(style, s) {
  const sizes = s.kind === 'stat' ? [[32, ''], [16, s.val], [14, s.val]] : s.kind === 'trinket' ? [[44, ''], [36, ''], [18, '']] : [[44, ''], [28, ''], [24, '']];
  const what = s.kind === 'ability' ? `${s.hero} · ${s.role}` : s.kind === 'trinket' ? `Trinket · ${s.rarity}` : 'Stat';
  return page(`<div style="width:300px;height:300px;background:#171B2E;padding:12px;position:relative">
    <div style="display:flex;justify-content:center;margin-top:2px">${ic(style, s, 176)}</div>
    <div style="text-align:center;margin-top:8px"><b style="font-size:17px">${s.name}</b><div class="cap">${what} · style ${style.toUpperCase()}</div></div>
    <div style="display:flex;gap:14px;justify-content:center;align-items:center;margin-top:9px;height:46px">${sizes.map(([px, v]) => `<span style="display:inline-flex;align-items:center;gap:4px">${ic(style, s, px)}${v ? `<b style="font-size:${px > 15 ? 16 : 13}px">${v}</b>` : ''}</span>`).join('')}</div>
  </div>`).replace('body{width:390px}', 'body{width:300px}');
}
// descriptions for the mock's ability rows (js/heroes.js)
Object.assign(by('chainLightning'), { desc: 'A bolt that jumps from enemy to enemy, shocking.' });
Object.assign(by('frostArrow'), { desc: 'A frost-tipped arrow.' });
Object.assign(by('callWolf'), { desc: 'A summoning ring opens and a wolf steps out to fight beside the party.' });

const out = path.join(HERE, 'sheets'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const jobs = [];
for (const style of Object.keys(STYLES)) {
  fs.writeFileSync(path.join(out, `sheet-${style}.html`), sheet(style)); jobs.push([`sheet-${style}`, 390, 3]);
  fs.writeFileSync(path.join(out, `mock-${style}.html`), mock(style)); jobs.push([`mock-${style}`, 390, 3]);
  fs.writeFileSync(path.join(out, `stats-${style}.html`), statsPage(style)); jobs.push([`stats-${style}`, 390, 3]);
  fs.writeFileSync(path.join(out, `thumb-${style}.html`), thumb(style).replace('body{width:390px}', 'body{width:360px}')); jobs.push([`thumb-${style}`, 360, 2]);
  for (const s of ALL) { fs.writeFileSync(path.join(out, `icon-${style}-${s.id}.html`), single(style, s)); jobs.push([`icon-${style}-${s.id}`, 300, 3]); }
}
fs.writeFileSync(path.join(out, 'jobs.json'), JSON.stringify(jobs));
console.log('styles', Object.keys(STYLES).join(' '), '| icons', ALL.length, '| pages', jobs.length);
