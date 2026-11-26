// lane bases19: a quick look sheet (for the lane's own checking, not a board): node tools/bases19/sheet.mjs <set> <out.png> [px]
import { folkSvg, BASE, HAIRS, BEARDS, SKINS, BODIES, TUNICS, CLOTHS, JEWELS, HAIR_COLOURS, randomFolk, dice } from '../../js/folk.js';
import { img, write } from './lib.mjs';
import { shots } from './shot.mjs';
import fs from 'node:fs';
const [set, out, pxIn] = process.argv.slice(2), px = +pxIn || 300;
const extra = Object.fromEntries(process.argv.slice(5).map((a) => a.split('=')));
const items = [];
const add = (label, spec) => items.push([label, { ...BASE, ...extra, ...spec }]);
if (set === 'base') { add('base', {}); }
if (set === 'hair') for (const k in HAIRS) add(k, { hair: k });
if (set === 'beard') for (const k in BEARDS) add(k, { beard: k, hair: extra.hair || 'crop' });
if (set === 'skin') for (const k in SKINS) add(k, { skin: k, hair: extra.hair || 'crop', hairCol: 'umber' });
if (set === 'body') for (const k in BODIES) add(k, { body: k });
if (set === 'tunic') { for (const k in TUNICS) add(k, { tunic: k }); for (const k in CLOTHS) add(k, { cloth: k }); }
if (set === 'jewel') for (const k in JEWELS) add(k, { jewels: [k], hair: 'slick' });
if (set === 'haircol') for (const k in HAIR_COLOURS) add(k, { hairCol: k, hair: extra.hair || 'swept', beard: 'full' });
if (set === 'mix') { const r = dice(+extra.seed || 7); for (let i = 0; i < 24; i++) { const s = randomFolk(r); items.push([i + ' ' + s.body + ' ' + s.hair, s]); } }
const cols = Math.min(items.length, +extra.cols || 6), rows = Math.ceil(items.length / cols);
const small = 54;
let h = `<body style="margin:0;background:#EDE6D8;font:13px sans-serif;display:grid;grid-template-columns:repeat(${cols},${px}px)">`;
for (const [label, spec] of items) { const svg = folkSvg(spec); h += `<div style="position:relative;height:${px + 4}px">${img(svg, px)}<b style="position:absolute;left:6px;top:2px">${label}</b><div style="position:absolute;right:4px;bottom:2px;background:#4A4250;padding:3px;border-radius:5px">${img(svg, small)}</div></div>`; }
const page = out.replace(/\.png$/, '.html'); write(page, h);
await shots([{ src: page, out, w: cols * px, h: rows * (px + 4), scale: 1 }]);
fs.unlinkSync(page);
console.log(out, items.length);
