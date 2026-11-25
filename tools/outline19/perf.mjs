// Frame cost of a fight (lane outline19, before/after the renderer's one outline): headless Edge at iPhone 11 size
// (414 x 896, dpr 2), the processor slowed (default 6x) so frames are bound by drawing, a run started with ?auto=D.
// Prints frames a second and the share of frames over 1/30 s, three windows of a few seconds; also how long the
// first pictures of every unit in the room took to build (parts.js sets, outline included).
//   node tools/outline19/perf.mjs [--port 8935] [--depth 4] [--slow 6] [--secs 5] [--seed 7]
import { openEdge } from '../edge.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', 8935), depth = +opt('depth', 4), slow = +opt('slow', 6), secs = +opt('secs', 5), seed = +opt('seed', 7);
const edge = await openEdge({ port: 9937 + (port % 7) });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  await page.goto(`http://localhost:${port}/?seed=${seed}`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(`http://localhost:${port}/?seed=${seed}&auto=${depth}`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: slow });
  for (let i = 0; i < 3; i++) {
    const r = await page.evaluate(async (secs) => {
      let n = 0, slowN = 0, last = performance.now(); const t0 = last;
      await new Promise((done) => { const f = (now) => { n++; if (now - last > 34) slowN++; last = now; if (now - t0 < secs * 1000) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); });
      return { fps: n / ((performance.now() - t0) / 1000), slow: slowN / n };
    }, secs);
    console.log(`window ${i + 1}: ${r.fps.toFixed(1)} frames a second, ${(r.slow * 100).toFixed(0)}% over 34 ms`);
  }
} finally { await edge.close(); }
