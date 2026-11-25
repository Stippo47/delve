// Lane drake19: the Book's page of the Cinder Drake: a still of the page, and its preview recorded frame by frame.
//   node tools/drake19/book.mjs <outDir> [--port 8962] [--secs 12] [--name book-preview]
import { openEdge } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'docs/clips/drake19'), port = +opt('port', 8962), secs = +opt('secs', 12), name = opt('name', 'book-preview');
fs.mkdirSync(out, { recursive: true });
const edge = await openEdge({});
const errors = [];
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${port}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => { CAMP.setMode('book'); BOOK.open('foe', 'cinder', { page: 'preview' }); UNIT.set({ rank: 0, fmove: 'kit' }); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, name + '-page.png') });
  await page.evaluate(() => { const p = UNIT.player; p.resume && p.resume(); p.restart(); p.stop(); });
  const box = await page.evaluate(() => { const c = document.querySelector('#unit .pv-cv'); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  const dir = path.join(out, 'w-' + name); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
  const fps = 30;
  for (let i = 0; i < Math.round(secs * fps); i++) {
    await page.evaluate(() => { const p = UNIT.player; p.stop(); p.advance(1 / 30, 1 / 30); });
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 85, clip: box });
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%05d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', path.join(out, name + '.mp4')]);
  const info = await page.evaluate(() => { const S = UNIT.player.stage; return { scene: S.scene, loop: S.loop, firstT: S.firstT, heroes: (S.dummies || []).map((o) => o.kind) }; });
  console.log('film', name, JSON.stringify(info));
} finally { await edge.close(); }
if (errors.length) { console.log('errors:'); for (const e of [...new Set(errors)]) console.log('  ' + e); }
