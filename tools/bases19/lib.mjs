// lane bases19: shared bits for the folk boards. Pictures put the game's outline back on a copy of each figure (the
// art itself has none): 2.4 room units for a hero-sized figure = 2.4 * 220 / 89.6 SVG units, as tools/art-heroart/render.py.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const INK = '#2B2230';
export const LINE = 2.4 * 220 / (22 * 220 / 54);
export const GAME_PX = 44 * 248 / 220; // css px of the outlined 248 box at game size (a hero's 220 box is 44 px)
export function outlined(svg, r = LINE) {
  const a = r, b = r * 2.5 / 6, c = r * 4.6 / 6;
  const flt = `<filter id="olx" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="${a.toFixed(2)} ${b.toFixed(2)}" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="${b.toFixed(2)} ${a.toFixed(2)}" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="${c.toFixed(2)}" result="c"/><feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge><feFlood flood-color="${INK}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  return svg.replace('<defs>', '<defs>' + flt).replace('<g id="sprite">', '<g id="sprite" filter="url(#olx)">').replace('viewBox="-10 -10 220 220" width="220" height="220"', 'viewBox="-24 -24 248 248"');
}
export const dataUri = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
export const img = (svg, px, deg = 0) => `<img src="${dataUri(outlined(svg))}" style="width:${px}px;height:${px}px;transform:rotate(${deg}deg);display:block;flex:none">`;
export const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
