// lane bases19: a few given looks, big (own checking): node tools/bases19/look.mjs out.png key1 key2 ...   (keys as folk.js folkKey)
import { folkSvg, parseFolkKey } from '../../js/folk.js';
import { img, write } from './lib.mjs';
import { shots } from './shot.mjs';
import fs from 'node:fs';
const [out, ...keys] = process.argv.slice(2), px = 620, cols = Math.min(3, keys.length);
let h = `<body style="margin:0;background:#EDE6D8;font:13px sans-serif;display:grid;grid-template-columns:repeat(${cols},${px}px)">`;
for (const k of keys) h += `<div style="position:relative">${img(folkSvg(parseFolkKey(k)), px)}<b style="position:absolute;left:6px;top:2px">${k}</b></div>`;
const page = out.replace(/\.png$/, '.html'); write(page, h);
await shots([{ src: page, out, w: cols * px, h: Math.ceil(keys.length / cols) * px, scale: 1 }]);
fs.unlinkSync(page);
