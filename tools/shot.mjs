// One screenshot of a page on the dev server, through the installed Edge (headless).
//   node tools/shot.mjs <path-on-site> <out.png> [--port 8832] [--w 390 --h 844] [--full]
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const url = args[0], out = path.resolve(args[1] || 'shot.png');
const site = +opt('port', 8832), W = +opt('w', 390), H = +opt('h', 844);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`http://localhost:${site}/${url}`);
  await page.waitForFunction(() => document.title === 'ready', null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: args.includes('--full') });
  console.log(errs.length ? 'errors:\n' + errs.join('\n') : 'ok', out);
} finally { await browser.close().catch(() => {}); try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { edge.kill(); } try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }
