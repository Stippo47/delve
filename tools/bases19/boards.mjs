// lane bases19: the boards' pictures, one figure per picture (never a composite of many): the figure large, and under
// it at game size (a hero's box is 44 px on the phone) in four facings, on a floor tone and on cream. The game's outline
// is put back on a copy for the picture (lib.mjs). A square thumb of the large figure goes beside each.
//   node tools/bases19/boards.mjs [set ...]      -> docs/clips/bases19/boards/<set>-<id>.png, thumbs/<set>-<id>.png
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { folkSvg, BASE } from '../../js/folk.js';
import { ROOT, img, write, GAME_PX } from './lib.mjs';
import { SETS } from './sets.mjs';
import { openEdge } from '../edge.mjs';
const OUT = path.join(ROOT, 'docs/clips/bases19/boards');
const want = process.argv.slice(2);
const all = { base: [{ id: 'base', name: 'The base person', spec: BASE }], ...SETS };
const items = Object.entries(all).filter(([set]) => !want.length || want.includes(set)).flatMap(([set, list]) => list.map((it) => ({ ...it, file: set === 'base' ? 'base' : `${set}-${it.id}` })));
const BIG = 640;
const row = (svg, bg, col) => `<div style="background:${bg};border-radius:12px;padding:10px 14px;display:flex;gap:14px;align-items:center"><span style="font:600 12px system-ui;color:${col};width:58px;line-height:1.25">game size</span>${[0, 90, 180, 270].map((d) => img(svg, GAME_PX, d)).join('')}</div>`;
let h = `<body style="margin:0;background:#EDE6D8;font:600 17px system-ui,Segoe UI,sans-serif;color:#2B2230">`;
for (const it of items) {
  const svg = folkSvg(it.spec);
  h += `<div id="b-${it.file}" style="width:720px;padding:10px 0 16px;display:flex;flex-direction:column;align-items:center;background:#EDE6D8"><div style="font:700 22px system-ui;padding:4px 0 0">${it.name}</div><div id="t-${it.file}" style="background:#EDE6D8;margin-bottom:6px">${img(svg, BIG)}</div><div style="display:flex;gap:12px">${row(svg, '#77895A', '#EEF3DE')}${row(svg, '#3E3743', '#CFC6D6')}</div></div>`;
}
const page = path.join(OUT, '_boards.html'); write(page, h);
const edge = await openEdge();
try {
  const ctx = await edge.browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); await p.goto(pathToFileURL(page).href); await p.waitForTimeout(800);
  fs.mkdirSync(path.join(OUT, 'thumbs'), { recursive: true });
  for (const it of items) { await p.locator(`#b-${it.file}`).screenshot({ path: path.join(OUT, it.file + '.png') }); await p.locator(`#t-${it.file}`).screenshot({ path: path.join(OUT, 'thumbs', it.file + '.png') }); }
} finally { await edge.close(); }
fs.unlinkSync(page);
console.log(items.length, 'pictures ->', OUT);
