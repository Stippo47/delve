// A still of a fight at phone size (lane outline19): node tools/outline19/still.mjs <out.png> [--port 8935] [--zoom 1.5] [--b goblin] [--a paladin] [--t 2.5]
import { openEdge } from '../edge.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const edge = await openEdge({ port: 9940 + (+opt('port', 8935) % 5) });
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [k, n] = x.split('*'); return { k, n: +n || 1, rank: 0 }; });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 })).newPage();
  await page.goto(`http://localhost:${opt('port', 8935)}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(async ([a, b, z]) => { (await import('./js/render.js')).setZoom(z); GAME.save.cheat = true; GAME.startBattle({ arena: 'crypt', a, b }); }, [parse(opt('a', 'paladin,archer,cleric')), parse(opt('b', 'goblin*2,troll')), +opt('zoom', 1.5)]);
  await page.waitForTimeout(+opt('t', 2.5) * 1000);
  await page.screenshot({ path: args[0] });
} finally { await edge.close(); }
