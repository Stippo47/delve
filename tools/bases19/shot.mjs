// lane bases19: screenshot an html file (or url) with headless Edge.  node tools/bases19/shot.mjs <html|url> <out.png> <w> <h> [scale] [selector]
import { openEdge } from '../edge.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export async function shots(jobs) { // [{src, out, w, h, scale, sel, wait}]
  const edge = await openEdge();
  try {
    for (const j of jobs) {
      const ctx = await edge.browser.newContext({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: j.scale || 1 });
      const page = await ctx.newPage();
      const url = /^https?:/.test(j.src) ? j.src : pathToFileURL(path.resolve(j.src)).href;
      await page.goto(url); await page.waitForTimeout(j.wait || 400);
      if (j.sel) await page.locator(j.sel).screenshot({ path: j.out, omitBackground: !!j.clear }); else await page.screenshot({ path: j.out, omitBackground: !!j.clear, fullPage: !!j.full });
      await ctx.close();
    }
  } finally { await edge.close(); }
}
if (process.argv[1] && process.argv[1].endsWith('shot.mjs')) {
  const [src, out, w, h, scale, sel] = process.argv.slice(2);
  await shots([{ src, out, w: +w || 800, h: +h || 600, scale: +scale || 1, sel }]);
}
