// The Settings page's Dev rows (lane boulder19): node tools/boulder19/settings-shot.mjs <out.png> [--port 8973] [--q boulder=a]
import { openEdge } from '../edge.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const edge = await openEdge({ port: 9792 });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  page.on('pageerror', (e) => console.log('ERR', String(e)));
  await page.goto(`http://localhost:${opt('port', 8973)}/?seed=4&${opt('q', '')}`);
  await page.waitForFunction(() => window.GAME && GAME.ready && window.CAMP, null, { timeout: 120000 });
  await page.evaluate(() => CAMP.setMode('settings')); await page.waitForTimeout(700);
  await page.evaluate(() => { const g = document.querySelector('.settings .group.dev'); if (g) g.scrollIntoView({ block: 'end' }); }); await page.waitForTimeout(400);
  if (args.includes('--tap')) { await page.evaluate(() => document.querySelector('[data-act="boulder:a"]').click()); await page.waitForTimeout(300); await page.evaluate(() => { const g = document.querySelector('.settings .group.dev'); if (g) g.scrollIntoView({ block: 'end' }); }); await page.waitForTimeout(300); console.log('saved', await page.evaluate(() => localStorage.getItem('delve.boulder'))); }
  await page.screenshot({ path: args[0] });
} finally { await edge.close(); }
