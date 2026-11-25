// Round 19, icons-misc lane: HTML pages -> PNGs through a headless Edge (tools/edge.mjs, its own temp profile).
//   node tools/icons-misc/snap.mjs <page.html> <out.png> [width=390] [scale=3]  (several: repeat the four)
import { openEdge } from '../edge.mjs';
import path from 'node:path'; import { pathToFileURL } from 'node:url';
const a = process.argv.slice(2), jobs = [];
for (let i = 0; i < a.length; i += 4) jobs.push([a[i], a[i + 1], +(a[i + 2] || 390), +(a[i + 3] || 3)]);
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'], port: 8953 });
try {
  for (const [html, png, w, s] of jobs) {
    const page = await (await edge.browser.newContext({ viewport: { width: w, height: 700 }, deviceScaleFactor: s })).newPage();
    page.on('pageerror', (e) => console.log('pageerror', String(e)));
    await page.goto(pathToFileURL(path.resolve(html)).href);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    await page.locator('#shot').screenshot({ path: png });
    console.log('wrote', png);
    await page.context().close();
  }
} finally { await edge.close(); }
