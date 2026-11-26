// Lane looks19: does the pixel look's room shimmer as the camera moves? Two lossless frames 1/30 s apart, in the page:
// the floor region of the second is matched to the first at whole-pixel shifts; prints the best shift and how many
// pixels still differ (0 at the right shift = the floor slid by whole pixels, no resampling).
//   node tools/looks19/shimmer.mjs --q "pixel=2" --battle "..." [--at 3]
import { openEdge, sweepProfile } from '../edge.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
setTimeout(() => { sweepProfile(edge.prof); process.exit(2); }, 180000).unref();
try {
  const ctx = await edge.browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:8971/?seed=3&${opt('q', '')}`);
  await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000, polling: 200 });
  const res = await page.evaluate(async ([b, at, zoom]) => {
    const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
    GAME.save.cheat = true; const [red, blue] = b.split('|'); for (const s of parse(blue)) if (GAME.save.heroes[s.k]) GAME.save.heroes[s.k].owned = true;
    GAME.record(true); GAME.startBattle({ arena: 'crypt', a: parse(blue), b: parse(red) });
    if (zoom) (await import('/js/render.js')).setZoom(+zoom);
    for (let i = 0; i < at * 30; i++) GAME.recFrame(1 / 30);
    const cv = document.getElementById('game'), g = cv.getContext('2d');
    const grab = () => g.getImageData(0, 0, cv.width, cv.height).data.slice();
    const out = [];
    for (let f = 0; f < 6; f++) {
      const A = grab(); GAME.recFrame(1 / 30); const B = grab(), W = cv.width, H = cv.height;
      // the floor band between the HUD and the cards, its left and right edges (units are mostly mid-screen): rows 300-1400, cols 0-120
      let best = null;
      for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) {
        let diff = 0, n = 0;
        for (let y = 300; y < 1400; y += 3) for (let x = 20; x < 120; x += 3) { const p = (y * W + x) * 4, q = ((y + dy) * W + (x + dx)) * 4; n++; if (Math.abs(A[p] - B[q]) + Math.abs(A[p + 1] - B[q + 1]) + Math.abs(A[p + 2] - B[q + 2]) > 6) diff++; }
        if (!best || diff < best[2]) best = [dx, dy, diff, n];
      }
      out.push(best);
    }
    return out;
  }, [opt('battle', 'ikSpider*1,slime*2,goblin*2,rattlerMace*1,brute*1|paladin,archer,cleric,necromancer'), +opt('at', 3), opt('zoom', '1.1')]);
  for (const [dx, dy, d, n] of res) console.log(`shift ${dx},${dy}: ${d} of ${n} sampled floor pixels differ`);
} finally { await edge.close(); }
