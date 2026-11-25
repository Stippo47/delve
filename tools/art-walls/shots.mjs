// Round 19 art lane (walls): one full-resolution picture per wall option, drawn by scene.html in headless Edge.
//   node tools/serve.mjs 8941 .          (in another shell, from the worktree root)
//   node tools/art-walls/shots.mjs [ids or themes, comma separated]   -> design/r19-art/walls/<id>/<id>.png
import { openEdge } from '../edge.mjs';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const OUT = path.join(ROOT, 'design', 'r19-art', 'walls');
const index = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
const only = process.argv[2] ? process.argv[2].split(',') : null;
const edge = await openEdge();
try {
  const ctx = await edge.browser.newContext({ viewport: { width: 1600, height: 1300 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  for (const o of index) {
    if (only && !only.includes(o.id) && !only.includes(o.theme)) continue;
    errs.length = 0;
    await page.goto(`http://127.0.0.1:8941/tools/art-walls/scene.html?walls=${o.id}`);
    try { await page.waitForFunction(() => window.SCENE_DONE, null, { timeout: 60000 }); } catch { console.log(o.id, 'FAILED', errs.join(' | ')); continue; }
    const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
    fs.writeFileSync(path.join(OUT, o.id, o.id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    console.log('shot', o.id, errs.length ? 'errors: ' + errs.join(' | ') : '');
  }
} finally { await edge.close(); }
