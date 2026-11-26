// lane bases19: the base beside approved art, same scale, the game's outline on each (own checking)
import fs from 'node:fs';
import path from 'node:path';
import { folkSvg, BASE } from '../../js/folk.js';
import { img, write, ROOT, dataUri } from './lib.mjs';
import { shots } from './shot.mjs';
const out = process.argv[2], px = 420;
const file = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const items = [['approved base 1', null, file('design/base-approved/base-1s-160.svg')], ['folk base', folkSvg(BASE)], ['monk', file('art/heroes/monk.svg')], ['haymaker', file('art/heroes/haymaker.svg')], ['bandit', file('art/heroes/bandit.svg')], ['folk fat', folkSvg({ ...BASE, body: 'fat', hair: 'balding', beard: 'full' })], ['folk fem', folkSvg({ ...BASE, body: 'feminine', hair: 'long', hairCol: 'blonde' })], ['werewolf', file('art/heroes/werewolf.svg')]];
let h = `<body style="margin:0;background:#EDE6D8;font:13px sans-serif;display:grid;grid-template-columns:repeat(4,${px}px)">`;
for (const [label, svg, raw] of items) {
  const big = raw ? `<img src="${dataUri(raw)}" style="width:${px * 220 / 248}px;margin:${px * 14 / 248}px">` : img(svg, px);
  const small = raw ? `<img src="${dataUri(raw)}" style="width:44px">` : img(svg, 49.6);
  h += `<div style="position:relative;height:${px + 70}px">${big}<b style="position:absolute;left:6px;top:2px">${label}</b><div style="position:absolute;left:10px;bottom:4px;background:#4A4250;padding:6px;border-radius:5px;display:flex;gap:6px">${small}${small.replace('rotate(0deg)', 'rotate(90deg)')}${small.replace('rotate(0deg)', 'rotate(180deg)')}</div></div>`;
}
const page = out.replace(/\.png$/, '.html'); write(page, h);
await shots([{ src: page, out, w: 4 * px, h: 2 * (px + 70), scale: 2 }]);
fs.unlinkSync(page);
