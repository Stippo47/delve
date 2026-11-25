// A still of the camp (lane outline19): node tools/outline19/camp-still.mjs <out.png> [--port 8935] [--mode fire]
import { openEdge } from '../edge.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const edge = await openEdge({ port: 9946 + (+opt('port', 8935) % 3) });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 })).newPage();
  await page.goto(`http://localhost:${opt('port', 8935)}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate((m) => { const s = GAME.save; for (const id of Object.keys(s.heroes)) s.heroes[id].owned = true; GAME.cheat({}); CAMP.setMode(m); }, opt('mode', 'fire'));
  await page.waitForTimeout(3000);
  await page.screenshot({ path: args[0] });
} finally { await edge.close(); }
