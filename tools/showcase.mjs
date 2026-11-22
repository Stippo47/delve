// The showcase: one short looping clip per hero attack and per ability, each used on target dummies (lab.html?m=show),
// recorded frame by frame in headless Edge, so it plays smoothly whatever the machine's speed.
//   node tools/showcase.mjs [--port 8853] [--heroes paladin,archer] [--abs attack,shieldBash] [--tier 3]
//        [--out clips/showcase] [--secs 3] [--fps 30] [--w 480 --h 360] [--sheet scratch/sheets] [--q extra=params]
// Writes <out>/<hero>-<ability>.mp4 (attack clips are <hero>-attack.mp4). With --sheet, also one contact sheet per
// hero (<sheet>/<hero>.png: a row per clip, eight moments from the cast on) for checking every clip by eye.
// Needs the dev server (python -m http.server <port>) and playwright-core in tools/node_modules.
import { chromium } from 'playwright-core';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HEROES } from '../js/heroes.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8853), secs = +opt('secs', 3), fps = +opt('fps', 30), W = +opt('w', 480), H = +opt('h', 360), tier = +opt('tier', 3);
const out = path.resolve(opt('out', 'clips/showcase')), sheet = opt('sheet', null), extra = opt('q', '');
const heroes = (opt('heroes', '') || Object.keys(HEROES).join(',')).split(',').filter(Boolean);
const only = (opt('abs', '') || '').split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });
if (sheet) fs.mkdirSync(path.resolve(sheet), { recursive: true });

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const SHEET_FRAMES = [12, 15, 18, 21, 25, 31, 40, 56]; // the cast is at 0.45 s (frame ~13 at 30 fps)
const made = [];
try {
  for (const hero of heroes) {
    const h = HEROES[hero]; if (!h) { console.log('no hero', hero); continue; }
    const list = ['attack', ...h.abilities.map((a) => a.id), 'trait'].filter((a) => (!only.length && a !== 'trait') || only.includes(a)); // (lane H2: --abs trait records the trait's bench)
    const rows = [];
    for (const ab of list) {
      const file = path.join(out, `${hero}-${ab}.mp4`);
      await page.goto(`http://localhost:${site}/lab.html?rec=1&m=show&hero=${hero}&ab=${ab}&tier=${tier}&loop=${secs}${extra ? '&' + extra : ''}`);
      await page.waitForFunction(() => window.LAB && LAB.ready, null, { timeout: 90000 }); // (lane H2: a loaded machine can take longer than 20 s)
      // the bench steps a few frames while the art loads: start the loop clean
      await page.evaluate(() => { LAB.restart && LAB.restart(); LAB.frame(0); });
      await new Promise((r) => setTimeout(r, 250));
      await page.evaluate(() => { LAB.restart && LAB.restart(); });
      const frames = fs.mkdtempSync(path.join(out, '.frames-'));
      const n = Math.round(secs * fps);
      for (let i = 0; i < n; i++) {
        await page.evaluate((dt) => LAB.frame(dt), 1 / fps);
        await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
      }
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'),
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', file]);
      if (sheet) {
        const row = path.join(frames, 'row.png');
        const ins = SHEET_FRAMES.flatMap((f) => ['-i', path.join(frames, `f${String(Math.min(n - 1, f)).padStart(4, '0')}.png`)]);
        const fc = SHEET_FRAMES.map((_, i) => `[${i}:v]scale=300:-1[s${i}]`).join(';') + ';' + SHEET_FRAMES.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${SHEET_FRAMES.length}`;
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fc, row]);
        const keep = path.join(path.resolve(sheet), `.${hero}-${ab}.png`); fs.copyFileSync(row, keep); rows.push(keep);
      }
      fs.rmSync(frames, { recursive: true, force: true });
      made.push(file); console.log('->', path.relative(process.cwd(), file));
    }
    if (sheet && rows.length) {
      const dst = path.join(path.resolve(sheet), `${hero}.png`);
      if (rows.length === 1) fs.copyFileSync(rows[0], dst);
      else execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...rows.flatMap((r) => ['-i', r]), '-filter_complex', `vstack=inputs=${rows.length}`, dst]);
      for (const r of rows) fs.rmSync(r, { force: true });
    }
  }
} finally {
  await browser.close().catch(() => {});
  try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { edge.kill(); }
  // (lane H2, round 13: headless Edge hands itself on to a second browser process that the taskkill above misses, so each
  // run left a browser behind: hundreds piled up. Kill whatever still runs with this run's own profile folder.)
  try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${path.basename(prof)}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
}
console.log(errors.length ? 'page errors:\n' + [...new Set(errors)].join('\n') : 'no page errors', `(${made.length} clips)`);
