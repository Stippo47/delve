// The sound in the real game page (Edge headless): unlock by a tap, the effects render, a run makes sounds and music,
// the settings sheet shows the sound controls, and nothing throws. Needs the dev server on --port (default 8836).
//   node tools/sound-smoke.mjs [--port 8836] [--secs 20]
import { openEdge } from './edge.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8836), secs = +opt('secs', 20);
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.location().url || '')) errors.push(m.text() + ' ' + m.location().url); });
await page.goto(`http://localhost:${site}/?seed=2`);
await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
await page.mouse.click(200, 400);                                  // the first tap unlocks the sound
const t0 = Date.now();
await page.evaluate(async () => { const m = await import('./js/audio.js'); for (let i = 0; i < 300 && !m.audioEngine(); i++) await new Promise((r) => setTimeout(r, 50)); await m.audioEngine().ready; });
const info = await page.evaluate(async () => {
  const m = await import('./js/audio.js'); const e = m.audioEngine();
  const played = {}; const real = e.play.bind(e);
  e.play = (n, o, w, p) => { const ok = real(n, o, w, p); if (ok) played[n] = (played[n] || 0) + 1; return ok; };
  window.__played = played;
  const bufs = Object.values(e.buffers); return { state: e.c.state, rate: e.c.sampleRate, buffers: bufs.length, mem: bufs.reduce((a, l) => a + l.reduce((x, b) => x + b.length * 4, 0), 0) };
});
console.log(`unlocked: ${info.state} at ${info.rate} Hz; ${info.buffers} effects ready in ${Date.now() - t0} ms (${(info.mem / 1e6).toFixed(1)} MB of buffers)`);
// the settings sheet
await page.evaluate(() => document.querySelector('[data-act="settings"]') && document.querySelector('[data-act="settings"]').click());
const sheet = await page.evaluate(() => ({ sliders: document.querySelectorAll('#sheet input[data-snd]').length, mute: !!document.querySelector('#sheet [data-snd="mute"]') }));
console.log('settings sheet: sliders', sheet.sliders, 'mute toggle', sheet.mute);
await page.evaluate(() => { const b = document.querySelector('#sheet [data-snd="mute"]'); b.click(); b.click(); document.querySelector('[data-act="closesheet"]') && document.querySelector('[data-act="closesheet"]').click(); });
// a run, live
await page.evaluate(() => GAME.startRun({ theme: 'crypt', party: ['paladin', 'archer', 'twinfang'] }));
await page.waitForTimeout(secs * 1000);
const after = await page.evaluate(async () => { const m = await import('./js/audio.js'); const e = m.audioEngine(); return { played: window.__played, tracks: e.music.tracks.map((t) => t.place + (t.leaving ? '(leaving)' : '')), t: e.c.currentTime }; });
console.log('music tracks:', after.tracks.join(', '), '| audio clock', after.t.toFixed(1), 's');
console.log('played in', secs, 's:', Object.entries(after.played).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await edge.close();
process.exit(errors.length ? 1 : 0);
