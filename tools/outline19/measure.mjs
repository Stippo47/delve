// Runs tools/outline19/measure.html in a headless Edge (own temp profile, own port) and saves what it found:
//   node tools/outline19/measure.mjs <tag> [--port 8935] [--q kind]
// -> tools/outline19/out/<tag>.json (one row per kind: band widths in device px and room units),
//    docs/clips/outline19/sheet-<tag>.png (contact sheet at game size) and sheet-<tag>-x3.png (the same, 3x, pixels kept).
// Needs the static server: node tools/serve.mjs 8935
import { openEdge } from '../edge.mjs';
import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const tag = args[0] || 'now', port = +opt('port', 8935), q = opt('q', '');
const outDir = path.resolve('tools/outline19/out'), shots = path.resolve('docs/clips/outline19');
fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(shots, { recursive: true });
const edge = await openEdge({ port: 9935 });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://localhost:${port}/tools/outline19/measure.html?q=${q}`);
  await page.waitForFunction(() => window.DONE, null, { timeout: 240000 });
  const rows = await page.evaluate(() => window.OUT);
  fs.writeFileSync(path.join(outDir, tag + '.json'), JSON.stringify(rows, null, 1));
  const save = async (name, scale) => {
    const url = await page.evaluate((s) => { const a = document.getElementById('sheet'); const c = document.createElement('canvas'); c.width = a.width * s; c.height = a.height * s; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(a, 0, 0, c.width, c.height); return c.toDataURL('image/png'); }, scale);
    fs.writeFileSync(path.join(shots, name), Buffer.from(url.split(',')[1], 'base64'));
  };
  await save(`sheet-${tag}.png`, 1); await save(`sheet-${tag}-x3.png`, 3);
  const ok = rows.filter((r) => !r.err), v = (k) => ok.map((r) => r[k]).filter((x) => x != null).sort((a, b) => a - b);
  const stat = (k) => { const a = v(k); return a.length ? `min ${a[0]} median ${a[a.length >> 1]} max ${a[a.length - 1]}` : '-'; };
  console.log(`renderer outline px: ${stat('rendPx')}`); console.log(`${ok.length} measured, ${rows.length - ok.length} not ready; total px: ${stat('totalPx')}; baked px: ${stat('bakedPx')}`);
  for (const g of ['hero', 'summon', 'enemy', 'boss', 'prop']) { const a = ok.filter((r) => r.grp === g).map((r) => r.rendPx ?? r.totalPx).sort((x, y) => x - y); if (a.length) console.log(g.padEnd(7), a.length, 'min', a[0], 'med', a[a.length >> 1], 'max', a[a.length - 1]); }
  if (errs.length) console.log('page errors:', errs.slice(0, 5));
} finally { await edge.close(); }
