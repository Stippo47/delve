// Dump the rolled-surface tiles (lane boulder19, a check): node tools/boulder19/tile.mjs [--port 8973] [--T 512]
import { openEdge } from '../edge.mjs';
import fs from 'node:fs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const edge = await openEdge({ port: 9791 });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 400, height: 400 } })).newPage();
  page.on('pageerror', (e) => console.log('ERR', String(e)));
  await page.goto(`http://localhost:${opt('port', 8973)}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  const urls = await page.evaluate(async ([T, hurt]) => {
    const B = await import('./js/boulder-roll.js'); const out = {};
    for (const n of ['troll-boulder', 'yeti-snowball']) {
      await B.loadBoulderArt(n); const A = B.art[n], t = B.tileFor(A, T, hurt);
      const c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d'); const id = g.createImageData(T, T); new Uint32Array(id.data.buffer).set(t.tex); g.putImageData(id, 0, 0);
      out[n] = c.toDataURL('image/png'); out[n + '-surf'] = A.surf.toDataURL('image/png');
    }
    return out;
  }, [+opt('T', 512), +opt('hurt', 0)]);
  for (const [k, v] of Object.entries(urls)) fs.writeFileSync(`docs/clips/boulder19/tile-${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
  console.log('ok');
} finally { await edge.close(); }
