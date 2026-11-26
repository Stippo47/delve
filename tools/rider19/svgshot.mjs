// Lane rider19: SVG files side by side on the dungeon floor's grey, each at the given px size, for looking at art.
//   node tools/rider19/svgshot.mjs out.png 300 art/enemies/troll.svg art/enemies/tumble-troll.svg ...
import { openEdge } from '../edge.mjs';
import fs from 'node:fs';
import path from 'node:path';
const [out, size, ...files] = process.argv.slice(2);
const px = +size || 300;
const imgs = files.map((f) => `<img src="data:image/svg+xml;base64,${Buffer.from(fs.readFileSync(f)).toString('base64')}" width="${px}" height="${px}">`).join('');
const html = `<html><body style="margin:0;background:#B4B0B8;display:flex;gap:10px;padding:10px">${imgs}</body></html>`;
const edge = await openEdge();
const page = await (await edge.browser.newContext({ viewport: { width: files.length * (px + 10) + 10, height: px + 20 } })).newPage();
await page.setContent(html); await page.waitForTimeout(300);
await page.screenshot({ path: path.resolve(out) });
await edge.close();
