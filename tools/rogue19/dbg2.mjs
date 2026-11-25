import { openEdge } from '../edge.mjs';
const edge = await openEdge(); const page = await (await edge.browser.newContext()).newPage();
page.on('pageerror', (e) => console.log('ERR', String(e)));
await page.goto('http://localhost:8933/tools/rogue19/bare-board.html?S=10&cols=1');
await page.waitForFunction(() => window.DONE, null, { timeout: 60000 });
const r = await page.evaluate(async (f) => { const P = await import('/js/parts.js'); const s = P.getRig(f, 192); return s.layers.map((l) => [l.id, l.bareOf, l.hasBare, l.w.toFixed(0), l.h.toFixed(0), l.x.toFixed(0), l.y.toFixed(0)].join(' ')).join('\n'); }, process.argv[2]);
console.log(r); await edge.close();
