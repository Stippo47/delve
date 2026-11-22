// Screenshots or a clip of the renderer bench (lab.html), frame-stepped in headless Edge.
//   node tools/labshot.mjs <out.png|out.mp4> --q "m=sheet&kinds=paladin,archer" [--port 8821] [--w 390 --h 844]
//        [--secs S (mp4)] [--fps 30] [--pre S (seconds stepped before the first shot)] [--dpr 2] [--stats]
import { openEdge } from './edge.mjs';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'lab.png');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8821), q = opt('q', 'm=grid'), W = +opt('w', 390), H = +opt('h', 844);
const secs = +opt('secs', 0), fps = +opt('fps', 30), pre = +opt('pre', 0), dpr = +opt('dpr', 2);
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:${site}/lab.html?rec=1&${q}`);
await page.waitForFunction(() => window.LAB && LAB.ready, null, { timeout: 20000 });
if (pre) await page.evaluate((s) => { for (let i = 0; i < Math.round(s * 30); i++) LAB.frame(1 / 30); }, pre);
await page.evaluate(() => LAB.frame(0));
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => { LAB.frame(0); LAB.reset(); });
if (!secs) { await page.evaluate(() => LAB.frame(0)); await page.screenshot({ path: out }); }
else {
  const frames = fs.mkdtempSync(path.join(path.dirname(out), '.frames-'));
  const n = Math.round(secs * fps);
  for (let i = 0; i < n; i++) { await page.evaluate((dt) => LAB.frame(dt), 1 / fps); await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) }); }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'),
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', out]);
  fs.rmSync(frames, { recursive: true, force: true });
}
if (args.includes('--stats')) console.log(JSON.stringify(await page.evaluate(() => LAB.stats())));
// a plain kill() leaves Edge's process tree running on Windows (art round 8 found hundreds left over): take it all down
await edge.close();
console.log(errors.length ? 'page errors:\n' + errors.join('\n') : 'no page errors', '->', out);
