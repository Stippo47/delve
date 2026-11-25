// Round 18b (lane preview18b): short films of the Book's monster and status previews, recorded off the Book's own
// preview players (js/preview.js), stepped a frame at a time. Nothing reads them.
//   node tools/preview18b/clips.mjs [--port 8857] [--out docs/clips/preview18b] [--only wolf,silenced]
// Needs the dev server: node tools/serve.mjs 8857. Edge comes from tools/edge.mjs (its own profile folder under TEMP:
// run it with TEMP pointed at this lane's own folder, so nothing here can stop another lane's browser).
import { openEdge } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', 8857), out = path.resolve(opt('out', 'docs/clips/preview18b')), only = (opt('only', '') || '').split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });
// ['foe', file, kind, move, rank, seconds] | ['status', file, id, way, seconds]
const CLIPS = [
  ['foe', 'foe-wolf-kit-pack', 'wolf', 'kit', 0, 6.5],
  ['foe', 'foe-orcShaman-kit', 'orcShaman', 'kit', 0, 6],
  ['foe', 'foe-boar-elite-crash', 'boar', 'elite', 1, 6],
  ['foe', 'foe-banditBrute-elite-quake', 'banditBrute', 'elite', 1, 5.5],
  ['foe', 'foe-mortar-kit-shells', 'mortar', 'kit', 0, 6],
  ['foe', 'foe-choirSprite-kit-song', 'choirSprite', 'kit', 0, 6],
  ['foe', 'foe-alpha-boss-kit', 'alpha', 'kit', 0, 8],
  ['status', 'status-silenced', 'silenced', null, 9],
  ['status', 'status-chill-shattered', 'chill', 'trigger', 6],
  ['status', 'status-guard', 'guard', null, 5],
];
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
const errors = [];
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${port}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  for (const c of CLIPS) {
    const [t, name] = c;
    if (only.length && !only.some((o) => name.includes(o))) continue;
    let sel, getP;
    if (t === 'foe') {
      const [, , id, move, rank] = c;
      await page.evaluate(([id, move, rank]) => { CAMP.setMode('book'); BOOK.open('foe', id, { page: 'preview' }); UNIT.set({ rank, fmove: move }); }, [id, move, rank]);
      sel = '#unit .pv-cv'; getP = () => UNIT.player;
    } else {
      const [, , id, way] = c;
      await page.evaluate(([id, way]) => { if (window.UNIT) try { BOOK.close(); } catch (e) {} CAMP.setMode('book'); BOOK.open('status', id, way ? { way } : {}); }, [id, way]);
      sel = '#book .bk-thing .pv-cv'; getP = () => BOOK.player;
    }
    await page.waitForTimeout(1200);
    await page.evaluate((isFoe) => { const p = isFoe ? UNIT.player : BOOK.player; p.resume && p.resume(); p.restart(); p.stop(); }, t === 'foe');
    const box = await page.evaluate((sel) => { const c = document.querySelector(sel); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; }, sel);
    const dir = fs.mkdtempSync(path.join(out, '.f-')), fps = 30, secs = c[c.length - 1];
    for (let i = 0; i < Math.round(secs * fps); i++) {
      await page.evaluate((isFoe) => { const p = isFoe ? UNIT.player : BOOK.player; p.stop(); p.advance(1 / 30, 1 / 30); }, t === 'foe');
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`), clip: box });
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', path.join(out, name + '.mp4')]);
    fs.rmSync(dir, { recursive: true, force: true });
    const info = await page.evaluate((isFoe) => { const S = (isFoe ? UNIT.player : BOOK.player).stage; return { spec: S.spec, scene: S.scene, loop: S.loop, firstT: S.firstT, way: S.way, heroes: (S.dummies || []).map((o) => o.kind) }; }, t === 'foe');
    console.log('film', name, JSON.stringify(info));
  }
} finally { await edge.close(); }
if (errors.length) { console.log('errors:'); for (const e of errors) console.log('  ' + e); }
