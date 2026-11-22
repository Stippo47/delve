// Round 14, lane I: turns sheets/*.html (written by build.mjs) into renders/*.png through the installed Edge, headless.
//   node design/icons-r14/render.mjs [name-prefix]     e.g. render.mjs mock-   (only those pages)
// Pages are opened as file:// URLs (no server). The browser is closed and its profile removed at the end.
import { chromium } from '../../tools/node_modules/playwright-core/index.mjs';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv[2] || '';
const jobs = JSON.parse(fs.readFileSync(path.join(HERE, 'sheets', 'jobs.json'), 'utf8')).filter(([n]) => n.startsWith(only));
const out = path.join(HERE, 'renders'); fs.mkdirSync(out, { recursive: true });
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser, errs = 0;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
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
  // Edge's launcher hands over to another process, so the pid we spawned is not the browser's: ask the browser itself
  // to close, then end anything still running on this profile, then remove the profile.
  try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close'); } catch {}
  await browser.close().catch(() => {}); try { edge.kill(); } catch {}
  const left = `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -match '${path.basename(prof)}' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  await new Promise((r) => setTimeout(r, 400));
  try { execFileSync('powershell', ['-NoProfile', '-Command', left], { stdio: 'ignore' }); } catch {}
  for (let i = 0; i < 10; i++) { try { fs.rmSync(prof, { recursive: true, force: true }); break; } catch { await new Promise((r) => setTimeout(r, 300)); } }
  if (fs.existsSync(prof)) console.log('note: could not remove', prof);
}
