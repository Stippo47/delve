// Round 15 (lane N): the six new heroes' stand-in sprites, until the art lane's files land.
//   node tools/standins.mjs
// Each is an existing hero's SVG with its colours turned by js/recolor.js (as the Enchantress was made from the Witch),
// written to art/heroes/standin/<id>.svg. The ink outline is put back to the game's ink afterwards. The Mob's still
// picture (mob.svg: the four side by side, for faces in the camp and the Book) is the four bodies' files set into one.
// docs/ART-NEEDED.md lists what the real sprites need. Nothing in the game reads this file; run it again after
// changing a recolour below.
import fs from 'node:fs';
import path from 'node:path';
import { recolorSvgText } from '../js/recolor.js';

const INK = '#2B2230';
const A = (from, range, hue, sat = 1, light = 0) => ({ from, range, hue, sat, light });
// id: [base hero file, { hue, sat, light, accent }]
const MAKE = {
  'mob-torch': ['digger', { hue: 0, sat: 0.8, light: -0.02, accent: A(350, 24, 28, 0.75, -0.04) }],
  'mob-pitchfork': ['haymaker', { hue: 0, sat: 0.85, light: -0.02, accent: A(48, 14, 96, 0.55, -0.12) }],
  'mob-axe': ['werewolf', { hue: 0, sat: 0.9, light: 0, accent: A(2, 14, 128, 0.55, -0.04) }],
  'mob-dagger': ['bandit', { hue: 0, sat: 0.85, light: -0.03, accent: A(0, 14, 208, 0.7, -0.02) }],
  // (the Engineer's orange suit is the same hue as her skin: `only` picks the suit's colours by how strong and dark they are)
  clockwork: ['engineer', { hue: 0, sat: 1, light: 0, accent: A(24, 12, 196, 0.6, -0.04) }, (h, s, l) => h >= 15 && h <= 32 && s > 0.7 && l < 0.62],
  airMage: ['storm', { hue: 0, sat: 0.9, light: 0.03, accent: A(238, 34, 196, 0.5, 0.2) }],
  warden: ['tower', { hue: 0, sat: 0.8, light: -0.02, accent: A(225, 28, 214, 0.3, -0.16) }],
  telekinetic: ['seer', { hue: 0, sat: 1, light: 0, accent: A(268, 26, 304, 1.25, 0.02) }],
  earthMage: ['druid', { hue: 0, sat: 0.9, light: -0.02, accent: A(92, 34, 30, 0.75, -0.06) }],
};
const dir = path.resolve('art/heroes/standin');
fs.mkdirSync(dir, { recursive: true });
const made = {};
const hslOf = (hex) => { const n = parseInt(hex, 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60; } return [h, s, l]; };
for (const [id, [base, spec, only]] of Object.entries(MAKE)) {
  const src = fs.readFileSync(path.resolve('art/heroes', base + '.svg'), 'utf8');
  const inkNow = recolorSvgText(INK, spec);
  let out = only
    ? src.replace(/(url\(|href=")?#([0-9a-fA-F]{6})(?![0-9a-zA-Z_-])/g, (m, ref, hex) => (ref || !only(...hslOf(hex)) ? m : recolorSvgText('#' + hex, spec)))
    : recolorSvgText(src, spec).split(inkNow).join(INK).split(inkNow.toLowerCase()).join(INK);
  out = out.replace(/<svg /, `<svg data-standin="${id}: ${base} recoloured (tools/standins.mjs)" `);
  fs.writeFileSync(path.join(dir, id + '.svg'), out);
  made[id] = out;
  console.log('->', path.relative(process.cwd(), path.join(dir, id + '.svg')));
}
// the Mob's still picture: the four busts in a row, each in its own nested <svg> with its ids made its own
const four = ['mob-pitchfork', 'mob-torch', 'mob-axe', 'mob-dagger'];
const inner = four.map((id, i) => {
  const tag = 'm' + i + '-';
  const body = made[id].replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    .replace(/id="([^"]+)"/g, (m, n) => `id="${tag}${n}"`).replace(/url\(#([^)]+)\)/g, (m, n) => `url(#${tag}${n})`).replace(/href="#([^"]+)"/g, (m, n) => `href="#${tag}${n}"`);
  const [x, y] = [[-6, 30], [52, -4], [110, 30], [52, 76]][i];
  return `<svg x="${x}" y="${y}" width="116" height="116" viewBox="-10 -10 220 220">${body}</svg>`;
}).join('\n');
fs.writeFileSync(path.join(dir, 'mob.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 240 216" width="220" height="198" data-standin="mob: the four bodies' stand-ins set together (tools/standins.mjs)">\n${inner}\n</svg>\n`);
console.log('->', path.relative(process.cwd(), path.join(dir, 'mob.svg')));
