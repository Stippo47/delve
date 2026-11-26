// When does a boulder or snowball roll fast in a fight? (lane boulder19: picking a fight to film)
//   node tools/boulder19/probe.mjs --battle "yeti*1|paladin,archer,cleric" --arena frost --seeds 1-6 [--secs 16]
import { openEdge } from '../edge.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const [s0, s1] = opt('seeds', '1-4').split('-').map(Number);
const edge = await openEdge({ port: 9793 });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  for (let seed = s0; seed <= s1; seed++) {
    await page.goto(`http://localhost:${opt('port', 8973)}/?seed=${seed}`);
    await page.waitForFunction(() => window.GAME && GAME.ready && GAME.state === 'camp', null, { timeout: 120000 });
    const r = await page.evaluate(([b, arena, secs]) => {
      const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [k, n] = x.split('*'); return { k, n: +n || 1, rank: 0 }; });
      const [red, blue] = b.split('|'); GAME.save.cheat = true; GAME.record(true); GAME.startBattle({ arena, a: parse(blue), b: parse(red) });
      const out = []; const last = new Map();
      for (let t = 0; t < secs; t += 0.1) { GAME.fastForward(0.1); const w = GAME.run.world;
        for (const p of w.pillars) if (p.boulder || p.snowball) { const l = last.get(p); if (l) { const sp = Math.hypot(p.x - l.x, p.y - l.y) / 0.1; if (sp > 200) out.push(t.toFixed(1)); } last.set(p, { x: p.x, y: p.y }); } }
      return [...new Set(out)].join(' ');
    }, [opt('battle'), opt('arena', 'crypt'), +opt('secs', 16)]);
    console.log('seed', seed, ':', r);
  }
} finally { await edge.close(); }
