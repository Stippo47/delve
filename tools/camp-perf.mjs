// How smoothly the camp runs at phone size and pixel density (headless Edge with the processor slowed; for comparing
// before and after, not what a phone shows): the camp ground, the fire, a hero page, the map.
//   node tools/camp-perf.mjs [--port 8811] [--gpu] [--slow 4] [--secs 3] [--w 390 --h 844 --dpr 3]
import { openEdge } from './edge.mjs';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8811), frames = +opt('frames', 120), W = +opt('w', 390), H = +opt('h', 844), dpr = +opt('dpr', 3);
const edge = await openEdge({ flags: ['--headless=new', ...(args.includes('--gpu') ? ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] : ['--disable-gpu']), '--hide-scrollbars', '--mute-audio'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr, hasTouch: true })).newPage();
  await page.goto(`http://localhost:${site}/`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => { const s = GAME.save; for (const id of Object.keys(s.heroes)) s.heroes[id].owned = true; GAME.cheat({}); });
  await page.waitForTimeout(1500);
  // frames a second with the live loop running, the processor slowed (--slow N, default 4) to stand in for a phone.
  // (Timing draw calls and reading a pixel back each frame pushes the canvas off the GPU, so that measures nothing real.)
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +opt('slow', 4) });
  const fps = (mode, o) => page.evaluate(async ([mode, o, secs]) => {
    CAMP.setMode(mode, o || {});
    await new Promise((r) => setTimeout(r, 1200)); // the camera settles
    let n = 0, worst = 0, last = performance.now(); const t0 = last;
    await new Promise((done) => { const f = (now) => { n++; worst = Math.max(worst, now - last); last = now; if (now - t0 < secs * 1000) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); });
    return { fps: n / ((performance.now() - t0) / 1000), worst };
  }, [mode, o, +opt('secs', 3)]);
  for (const [name, mode, o] of [['ground', 'ground'], ['fire', 'fire'], ['hero page', 'hero', { id: 'paladin' }], ['map', 'map']]) { const r = await fps(mode, o); console.log(`${name.padEnd(10)} ${r.fps.toFixed(1)} frames a second, the longest ${r.worst.toFixed(0)} ms`); }
} catch (e) { console.log('error', e.stack || e); }
await edge.close();
