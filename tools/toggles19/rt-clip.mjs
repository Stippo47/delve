// Lane toggles19: a real-time clip of the camp (the camp's own clock runs; frames taken as it goes, ~12 a second).
//   node tools/toggles19/rt-clip.mjs <out.mp4> [--q "outlines=0"] [--secs 5] [--settings]
// --settings: opens the Settings screen, then flips Outlines off, Health bars off, and both back on, a couple of
// seconds apart (the taps are real clicks on the switches), printing the second of each flip.
import { openEdge, sweepProfile } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0]); fs.mkdirSync(path.dirname(out), { recursive: true });
const frames = fs.mkdtempSync(path.join(path.dirname(out), '.frames-'));
const port = opt('port', '8963'), q = opt('q', ''), secs = +opt('secs', 5), fps = 12;
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
setTimeout(() => { console.error('rt-clip: too long'); sweepProfile(edge.prof); process.exit(2); }, 300000).unref();
const errs = [];
try {
  const ctx = await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push('pageerror ' + e));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test((m.location() && m.location().url) || '')) errs.push('console ' + m.text()); });
  await page.goto(`http://localhost:${port}/?seed=3${q ? '&' + q : ''}`);
  await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000, polling: 200 });
  await page.waitForTimeout(1200);
  const steps = [];
  if (args.includes('--settings')) {
    await page.evaluate(() => { window.CAMP.setMode('settings'); });
    await page.waitForTimeout(600);
    // scroll the panel so the two switches and the health-style picker under them are in view
    await page.evaluate(() => { const el = document.querySelector('.draw-opts'); if (el) el.scrollIntoView({ block: 'start' }); });
    const flip = (act) => async () => { await page.click(`[data-act="${act}"]`); await page.evaluate(() => { const el = document.querySelector('.draw-opts'); if (el) el.scrollIntoView({ block: 'start' }); }); };
    steps.push([2, flip('outlines'), 'Outlines off'], [4.5, flip('hpbars'), 'Health bars off'], [7, flip('outlines'), 'Outlines on'], [9, flip('hpbars'), 'Health bars on']);
  }
  const n = Math.round(secs * fps), t0 = Date.now(); let si = 0;
  for (let i = 0; i < n; i++) {
    const t = i / fps;
    while (si < steps.length && t >= steps[si][0]) { await steps[si][1](); console.log(`${steps[si][2]} at ${t.toFixed(2)} s`); si++; }
    const wait = t0 + t * 1000 - Date.now(); if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
  }
  if (args.includes('--settings')) console.log('state at end:', await page.evaluate(() => [...document.querySelectorAll('.draw-opts .rowbtn')].map((e) => e.dataset.act + '=' + e.classList.contains('on')).join(' ')));
} finally { await edge.close(); }
// frames were taken as fast as the screenshots allow: number them as fps (a slow machine runs a little slow-motion)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', out]);
fs.rmSync(frames, { recursive: true, force: true });
console.log(errs.length ? errs.join('\n') : 'no page errors', '->', out);
