// One screenshot of a page on the dev server, through the installed Edge (headless).
//   node tools/shot.mjs <path-on-site> <out.png> [--port 8832] [--w 390 --h 844] [--full]
import { openEdge } from './edge.mjs';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const url = args[0], out = path.resolve(args[1] || 'shot.png');
const site = +opt('port', 8832), W = +opt('w', 390), H = +opt('h', 844);
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`http://localhost:${site}/${url}`);
  await page.waitForFunction(() => document.title === 'ready', null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: args.includes('--full') });
  console.log(errs.length ? 'errors:\n' + errs.join('\n') : 'ok', out);
} finally { await edge.close(); }
