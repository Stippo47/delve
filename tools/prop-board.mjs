// A board of prop SVGs for a close look, each at 2x and 1x game size beside the archer, on a plain floor colour.
//   node tools/prop-board.mjs <out.png> --props crate,barrel,rock-1 [--port 8833] [--dir art/props] [--bg #B9B5B2]
// Props are 220 boxes = 86.4 room units (doors 360 = 141.4); 1x = 2 px per room unit, as on a phone.
import { chromium } from 'playwright-core';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'props.png');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8833), dir = opt('dir', 'art/props'), bg = opt('bg', '#B9B5B2');
const names = opt('props', 'crate').split(',');
const box = (n) => (n.startsWith('door') ? 141.4 : 86.4);
const cell = (n) => `<figure><div class="big"><img src="/${dir}/${n}.svg" style="width:${box(n) * 4}px"></div>
  <div class="row"><img src="/${dir}/${n}.svg" style="width:${box(n) * 2}px"><img src="/art/heroes/archer.svg" style="width:${86.4 * 2 * 22 / 22}px;opacity:.9"></div><figcaption>${n}</figcaption></figure>`;
const html = `<!doctype html><html><head><style>body{margin:0;background:${bg};font:600 18px system-ui;color:#2B2230;display:flex;flex-wrap:wrap;gap:10px;padding:10px}
figure{margin:0;display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.12);border-radius:10px;padding:6px}
.big{display:flex;align-items:center;justify-content:center}.row{display:flex;align-items:center;gap:4px}</style></head><body>${names.map(cell).join('')}</body></html>`;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
try {
  const page = await (await browser.newContext({ viewport: { width: +opt('w', 1400), height: 400 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(`http://localhost:${site}/index.html`);
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await page.screenshot({ path: out, fullPage: true });
} finally {
  await browser.close().catch(() => {});
  try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { edge.kill(); }
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
}
console.log('->', out);
