// Stills of the dungeon's environment looks (lane E), frame-stepped in headless Edge. One Edge for the whole set.
//   node tools/env-shots.mjs <outDir> [--port 8833] [--themes crypt,sewers,warren] [--envs 1,2,3,4]
//        [--scenes start,doors,chosen,overview,props] [--seed 3] [--zoom 0.8] [--w 390 --h 844]
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
    await page.goto(`http://localhost:${site}/?seed=${seed}&env=${env}&party=paladin,archer,twinfang${opt("q", "") ? "&" + opt("q", "") : ""}`);
    await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 180000 });
    for (const scene of scenes) {
      if (scene === 'perf') { // how long painting the floor cache takes, for the room and the biggest room shape
        const ms = await page.evaluate(async ({ theme }) => {
          const S = await import('./js/scenery.js'), R = await import('./js/render.js');
          GAME.record(true); GAME.startRun({ depth: 1, theme, party: ['paladin', 'archer', 'twinfang'] }); GAME.recFrame(0);
          const time = (w) => { const pad = 48, s = Math.min(R.view.base * R.view.dpr, Math.sqrt(12e6 / ((w.W + pad * 2) * (w.H + pad * 2))));
            const c = document.createElement('canvas'); c.width = Math.ceil((w.W + pad * 2) * s); c.height = Math.ceil((w.H + pad * 2) * s);
            const g = c.getContext('2d'); g.scale(s, s); g.translate(pad, pad); const t0 = performance.now(); S.paintFloor(g, w, pad); g.getImageData(0, 0, 1, 1); return [Math.round(performance.now() - t0), w.W + 'x' + w.H, c.width + 'x' + c.height]; };
          const w = GAME.run.world, big = { ...w, W: 2200, H: 1440, cells: null, walls: [], water: null };
          return [time(w), time(w), time(big)];
        }, { theme });
        console.log(`${theme} env${env} paint ms [ms, room, cache px]:`, JSON.stringify(ms));
        continue;
      }
      await page.evaluate(async ({ theme, scene, zoom }) => {
        const R = await import('./js/render.js');
        GAME.record(true); GAME.startRun({ depth: 1, theme, party: ['paladin', 'archer', 'twinfang'] });
        R.setZoom(zoom);
        for (let i = 0; i < 45; i++) GAME.recFrame(1 / 30); // the fade in, the party walks in a little
        const w = GAME.run.world;
        if (scene === 'doors' || scene === 'chosen') {
          w.cleared = true; if (scene === 'chosen' && w.doors && w.doors[0]) w.doors[0].chosen = true;
          for (const u of w.units) if (u.team !== 'hero') u.x = -9999;
          const ds = w.doors && w.doors.length ? w.doors : [{ y: w.H / 2 }];
          R.view.manual = w.W; R.view.manualY = (ds[0].y + ds[ds.length - 1].y) / 2; R.view.manualT = 999; R.view.snap = true;
          // the game's camera stops just past the wall; for these stills look a little further so the arches show
          window.__shot = () => {
            const cv = document.getElementById('game'), hud = document.getElementById('hud').getBoundingClientRect();
            R.layout(cv, w, Math.round(hud.bottom) + 6, 10);
            if (R.view.rot) R.view.m[5] += 80 * R.view.scale; else R.view.m[4] -= 80 * R.view.scale;
            R.draw(cv.getContext('2d'), w);
          };
        } else if (scene === 'overview') {
          R.setZoom(0.5); R.view.manual = w.W / 2; R.view.manualY = w.H / 2; R.view.manualT = 999; R.view.snap = true;
        } else if (scene === 'props') {
          const h = w.units.find((u) => u.team === 'hero'); const x0 = h ? h.x + 40 : 200, y0 = h ? h.y : w.H / 2;
          for (const u of w.units) if (u.team !== 'hero') u.x = -9999;
          w.pillars.length = 0; w.hazards.length = 0; w.pickups.length = 0;
          const col = (i) => y0 - 180 + i * 120;
          w.pillars.push({ x: x0 + 130, y: col(0), r: 26, prop: 'crate' }, { x: x0 + 130, y: col(1), r: 24, prop: 'barrel' }, { x: x0 + 130, y: col(2), r: 28, prop: 'brazier' }, { x: x0 + 130, y: col(3), r: 33 });
          w.pillars.push({ x: x0 + 270, y: col(0), r: 38, fountain: true }, { x: x0 + 270, y: col(1), r: 38, fountain: true, used: true });
          w.pickups.push({ type: 'chest', x: x0 + 270, y: col(2), free: true }, { type: 'chest', x: x0 + 270, y: col(3), open: true, free: true },
            { type: 'pedestal', x: x0 + 400, y: col(0), reward: 'potion' }, { type: 'pedestal', x: x0 + 400, y: col(1), reward: 'trinket' });
          w.hazards.push({ type: 'oil', x: x0 + 400, y: col(2) + 20, r: 40 }, { type: 'spikes', x: x0 + 520, y: col(0), r: 30 }, { type: 'spikes', x: x0 + 520, y: col(1), r: 30, up: false });
          R.view.manual = x0 + 320; R.view.manualY = y0; R.view.manualT = 999; R.view.snap = true;
        }
        if (scene !== 'doors' && scene !== 'chosen') window.__shot = null;
        GAME.recFrame(0);
      }, { theme, scene, zoom });
      await new Promise((r) => setTimeout(r, 400)); // prop art rasterises in the background
      await page.evaluate(() => { if (window.__shot) window.__shot(); else GAME.recFrame(0); });
      await new Promise((r) => setTimeout(r, 150));
      await page.evaluate(() => { if (window.__shot) window.__shot(); else GAME.recFrame(0); });
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
