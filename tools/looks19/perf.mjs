// Lane looks19: draw time per frame (no game step: GAME.recFrame(0)) of one fight moment under each look, headless Edge
// without a GPU (slower than a phone's canvas, but the same for every look, so the ratios hold).
//   node tools/looks19/perf.mjs [--v "ink:olcolor=ink,own:olcolor=mid,px2:pixel=2"] [--at 4] [--n 120]
import { openEdge, sweepProfile } from '../edge.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const variants = opt('v', 'ink:olcolor=ink,own:olcolor=mid,one:olcolor=figure,px2:pixel=2,px3:pixel=3,px4:pixel=4,px2own:pixel=2&olcolor=mid').split(',').map((s) => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; });
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
setTimeout(() => { sweepProfile(edge.prof); process.exit(2); }, 600000).unref();
try {
  const ctx = await edge.browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  for (const [name, q] of variants) {
    const page = await ctx.newPage();
    await page.goto(`http://localhost:8971/?seed=3&${q}`);
    await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000, polling: 200 });
    const r = await page.evaluate(async ([b, at, n, zoom]) => {
      const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, m] = kn.split('*'); return { k, n: +m || 1, rank: +rank || 0 }; });
      GAME.save.cheat = true; const [red, blue] = b.split('|'); for (const s of parse(blue)) if (GAME.save.heroes[s.k]) GAME.save.heroes[s.k].owned = true;
      GAME.record(true); GAME.startBattle({ arena: 'crypt', a: parse(blue), b: parse(red) });
      (await import('/js/render.js')).setZoom(+zoom);
      for (let i = 0; i < at * 30; i++) GAME.recFrame(1 / 30);
      await new Promise((res) => setTimeout(res, 500)); for (let i = 0; i < 10; i++) GAME.recFrame(0); // warm: pictures in
      const t = []; for (let i = 0; i < n; i++) { const a = performance.now(); GAME.recFrame(0); document.getElementById('game').getContext('2d').getImageData(0, 0, 1, 1); t.push(performance.now() - a); }
      t.sort((x, y) => x - y); return { med: t[t.length >> 1], p90: t[Math.floor(t.length * 0.9)] };
    }, [opt('battle', 'ikSpider*1,slime*2,goblin*2,rattlerMace*1,brute*1|paladin,archer,cleric,necromancer'), +opt('at', 4), +opt('n', 120), opt('zoom', '0.8')]);
    console.log(`${name.padEnd(8)} draw median ${r.med.toFixed(2)} ms, 90% under ${r.p90.toFixed(2)} ms`);
    await page.close();
  }
} finally { await edge.close(); }
