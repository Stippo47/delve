// Record a short clip of a run, frame by frame, so it plays smoothly whatever the machine's speed.
// Needs the dev server on :8811 and `npm i --no-save playwright-core` in tools/. Drives the installed Edge.
//   node tools/clip.mjs <out.mp4> [--seed N] [--depth D] [--secs S] [--skip S] [--speed 2] [--w 390 --h 844] [--fps 30] [--q a=1&b=2]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'clip.mp4');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8811); // the game's dev server
const seed = +opt('seed', 3), depth = +opt('depth', 1), secs = +opt('secs', 8), skip = +opt('skip', 0);
const W = +opt('w', 390), H = +opt('h', 844), fps = +opt('fps', 30), speed = +opt('speed', 1);

const frames = fs.mkdtempSync(path.join(path.dirname(out), '.frames-'));
// Edge won't take Playwright's pipe here, so start it ourselves with a debugging port and connect.
import { spawn } from 'node:child_process';
import os from 'node:os';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const q = opt('q', ''); // extra address options, e.g. --q "allnodes=1&trinkets=impLantern"
await page.goto(`http://localhost:${site}/?seed=${seed}${q ? '&' + q : ''}`);
await page.waitForFunction(() => window.GAME && GAME.state === 'camp');
await page.evaluate((d) => { GAME.record(true); GAME.startRun(d); }, depth);
if (skip) await page.evaluate((s) => { for (let i = 0; i < s * 30; i++) GAME.recFrame(1 / 30); }, skip);
const n = Math.round(secs * fps);
for (let i = 0; i < n; i++) {
  await page.evaluate((dt) => GAME.recFrame(dt), speed / fps);
  await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
}
// a plain kill() leaves Edge running on Windows: take its whole process tree down
await browser.close(); try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { edge.kill(); } try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'),
  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', out]);
fs.rmSync(frames, { recursive: true, force: true });
console.log(errors.length ? 'page errors:\n' + errors.join('\n') : 'no page errors', '->', out);
