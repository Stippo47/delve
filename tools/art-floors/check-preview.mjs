// Checks floors.html: the option is installed inside the game frame and a run paints with it.
//   node tools/art-floors/check-preview.mjs [--port 8942] [--floor b] [--theme crypt] [--out tools/art-floors/preview-check.png]
import { openEdge } from '../edge.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', 8942), floor = opt('floor', 'b'), theme = opt('theme', 'crypt'), out = opt('out', 'tools/art-floors/preview-check.png');
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push('' + e));
  await page.goto(`http://localhost:${port}/floors.html?floor=${floor}&seed=3`);
  const fr = () => page.frames().find((f) => /index\.html/.test(f.url()));
  for (let i = 0; i < 600 && !(fr() && await fr().evaluate(() => !!(window.GAME && GAME.ready && Array.isArray(window.__floors19))).catch(() => false)); i++) await page.waitForTimeout(200);
  const r = await fr().evaluate(async (theme) => { GAME.record(true); GAME.startRun({ depth: 1, theme, party: ['paladin', 'archer', 'cleric'] }); for (let i = 0; i < 30; i++) GAME.recFrame(1 / 30);
    const w = GAME.run.world; return { list: window.__floors19, hook: typeof w.paintGround, theme: w.theme.id }; }, theme);
  await page.waitForTimeout(500); await page.screenshot({ path: out });
  console.log(JSON.stringify(r), errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors');
} finally { await edge.close(); }
