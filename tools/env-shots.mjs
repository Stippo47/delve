// Stills of the dungeon's environment looks (lane E), frame-stepped in headless Edge. One Edge for the whole set.
//   node tools/env-shots.mjs <outDir> [--port 8833] [--themes crypt,sewers,warren] [--envs 1,2,3,4]
//        [--scenes start,doors,props] [--seed 3] [--zoom 0.8] [--w 390 --h 844]
// Files: <outDir>/<theme>-env<N>-<scene>.png. 'doors' pans to the far wall with the room cleared and one door
// chosen; 'props' puts one of every prop near the party (no sim steps after, so nothing moves).
import { chromium } from 'playwright-core';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const outDir = path.resolve(args[0] || 'env-shots');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8833), W = +opt('w', 390), H = +opt('h', 844), seed = +opt('seed', 3), zoom = +opt('zoom', 0.8);
const themes = opt('themes', 'crypt,sewers,warren').split(','), envs = opt('envs', '1,2,3,4').split(',');
const scenes = opt('scenes', 'start,doors,props').split(',');
fs.mkdirSync(outDir, { recursive: true });
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const errors = [];
try {
  for (const theme of themes) for (const env of envs) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${theme} env${env}: ${e}`));
    await page.goto(`http://localhost:${site}/?seed=${seed}&env=${env}&party=paladin,archer,twinfang`);
    await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 180000 });
    for (const scene of scenes) {
      await page.evaluate(async ({ theme, scene, zoom }) => {
        const R = await import('./js/render.js');
        GAME.record(true); GAME.startRun({ depth: 1, theme, party: ['paladin', 'archer', 'twinfang'] });
        R.setZoom(zoom);
        for (let i = 0; i < 45; i++) GAME.recFrame(1 / 30); // the fade in, the party walks in a little
        const w = GAME.run.world;
        if (scene === 'doors') {
          w.cleared = true; if (w.doors && w.doors[0]) w.doors[0].chosen = true;
          R.view.manual = w.W; R.view.manualY = w.doors && w.doors.length ? w.doors[0].y : w.H / 2; R.view.manualT = 999; R.view.snap = true;
        } else if (scene === 'props') {
          const h = w.units.find((u) => u.team === 'hero'); const x0 = h ? h.x + 40 : 200, y0 = h ? h.y : w.H / 2;
          for (const u of w.units) if (u.team !== 'hero') { u.x = -9999; }
          w.pillars.push({ x: x0 + 120, y: y0 - 150, r: 24 }, { x: x0 + 120, y: y0 - 50, r: 27 }, { x: x0 + 120, y: y0 + 60, r: 32 }, { x: x0 + 120, y: y0 + 170, r: 35 });
          w.pillars.push({ x: x0 + 260, y: y0 - 110, r: 38, fountain: true }, { x: x0 + 260, y: y0 + 110, r: 38, fountain: true, used: true });
          w.pickups.push({ type: 'chest', x: x0 + 400, y: y0 - 150, free: true }, { type: 'chest', x: x0 + 400, y: y0 - 50, open: true, free: true },
            { type: 'pedestal', x: x0 + 400, y: y0 + 60, reward: 'potion' }, { type: 'pedestal', x: x0 + 400, y: y0 + 170, reward: 'trinket' });
          w.hazards.push({ type: 'oil', x: x0 + 540, y: y0 - 110, r: 40 }, { type: 'spikes', x: x0 + 540, y: y0 + 20, r: 30 }, { type: 'spikes', x: x0 + 540, y: y0 + 140, r: 30, up: false });
          R.view.manual = x0 + 300; R.view.manualY = y0; R.view.manualT = 999; R.view.snap = true;
        }
        GAME.recFrame(0);
      }, { theme, scene, zoom });
      await new Promise((r) => setTimeout(r, 400)); // prop art rasterises in the background
      await page.evaluate(() => { GAME.recFrame(0); });
      await new Promise((r) => setTimeout(r, 150));
      await page.evaluate(() => { GAME.recFrame(0); });
      const f = path.join(outDir, `${theme}-env${env}-${scene}.png`);
      await page.screenshot({ path: f });
      console.log(f);
    }
    await ctx.close();
  }
} finally {
  await browser.close().catch(() => {});
  try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { edge.kill(); }
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
}
console.log(errors.length ? 'page errors:\n' + errors.join('\n') : 'no page errors');
