// Round 14, lane I: turns sheets/*.html (written by build.mjs) into renders/*.png through the installed Edge, headless.
//   node design/icons-r14/render.mjs [name-prefix]     e.g. render.mjs mock-   (only those pages)
// Pages are opened as file:// URLs (no server). The browser is closed and its profile removed at the end.
import { openEdge } from '../../tools/edge.mjs'; // (round 14, lane L: the shared headless Edge, closed cleanly)
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv[2] || '';
const jobs = JSON.parse(fs.readFileSync(path.join(HERE, 'sheets', 'jobs.json'), 'utf8')).filter(([n]) => n.startsWith(only));
const out = path.join(HERE, 'renders'); fs.mkdirSync(out, { recursive: true });
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
const browser = edge.browser;
let errs = 0;
try {
  const pages = {};
  for (const [name, w, scale] of jobs) {
    const key = `${w}@${scale}`;
    if (!pages[key]) { pages[key] = await (await browser.newContext({ viewport: { width: w, height: 700 }, deviceScaleFactor: scale })).newPage(); pages[key].on('pageerror', (e) => { errs++; console.log('pageerror', name, String(e)); }); }
    const page = pages[key];
    await page.goto(pathToFileURL(path.join(HERE, 'sheets', name + '.html')).href);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    await page.locator('#shot').screenshot({ path: path.join(out, name + '.png') });
  }
  console.log('rendered', jobs.length, 'pages,', errs, 'page errors');
} finally {
  await edge.close(); // Browser.close over CDP, then anything still on its own profile, then the profile goes
}
