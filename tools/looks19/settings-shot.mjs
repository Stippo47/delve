// Lane looks19: a still of the Settings panel's look groups (Outlines and health bars, Outline colour, Pixel look).
//   node tools/looks19/settings-shot.mjs <out.png> [--q "olcolor=mid&pixel=2"] [--click "olcolor:mid,pixel:2"]
import { openEdge, sweepProfile } from '../edge.mjs';
import path from 'node:path';
import fs from 'node:fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0]); fs.mkdirSync(path.dirname(out), { recursive: true });
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
setTimeout(() => { sweepProfile(edge.prof); process.exit(2); }, 120000).unref();
try {
  const ctx = await edge.browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e));
  await page.goto(`http://localhost:${opt('port', '8971')}/?seed=3&${opt('q', '')}`);
  await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000, polling: 200 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.CAMP.setMode('settings'));
  await page.waitForTimeout(500);
  for (const a of (opt('click', '') || '').split(',').filter(Boolean)) { await page.click(`[data-act="${a}"]`); await page.waitForTimeout(300); }
  await page.evaluate((dy) => { const el = document.querySelector('.draw-opts'); if (el) { el.scrollIntoView({ block: 'start' }); let p = el.parentElement; while (p && p.scrollHeight <= p.clientHeight + 2) p = p.parentElement; if (p) p.scrollTop += dy; } }, +opt('dy', 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: out });
  console.log(errs.length ? errs.join('\n') : 'no errors', '->', out);
} finally { await edge.close(); }
