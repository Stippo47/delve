// Round 19 (lane rogue19): every art with its weapon, and bare (Disarmed), side by side, to check the split by eye.
//   node tools/rogue19/bare-board.mjs [--port 8933] [--out docs/clips/rogue19/bare-board.png] [--only heroes]
import { openEdge } from '../edge.mjs';
import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8933'), out = path.resolve(opt('out', 'docs/clips/rogue19/bare-board.png')), only = opt('only', '');
const dirs = only ? [only] : ['heroes', 'enemies', 'enemies/placeholder', 'bosses'];
const files = opt('files') ? opt('files').split(',').map((f) => 'art/' + f + '.svg') : dirs.flatMap((d) => fs.readdirSync('art/' + d).filter((f) => f.endsWith('.svg')).map((f) => 'art/' + d + '/' + f));
fs.mkdirSync(path.dirname(out), { recursive: true });
const html = `<!doctype html><html><body style="margin:0;background:#E9E2D0"><canvas id=c></canvas><script type=module>
import { loadArt, getRig, drawRig, rigHas } from '/js/parts.js';
const files = ${JSON.stringify(files)};
await Promise.all(files.map((f) => loadArt('/' + f)));
const S = +(new URLSearchParams(location.search).get('S') || 96), cols = +(new URLSearchParams(location.search).get('cols') || 6), rows = Math.ceil(files.length / cols), c = document.getElementById('c'); c.width = cols * S * 2 + cols * 6; c.height = rows * (S + 16); const g = c.getContext('2d');
const sets = files.map((f) => getRig('/' + f, S * 2));
await new Promise((r) => setTimeout(r, 4000));
const res = [];
files.forEach((f, i) => { const set = getRig('/' + f, S * 2); const x0 = (i % cols) * (S * 2 + 6), y0 = Math.floor(i / cols) * (S + 16);
  const armed = rigHas('/' + f, 'arm-r~bare') || rigHas('/' + f, 'arm-l~bare'); res.push([f, armed]);
  g.fillStyle = armed ? '#F6F0E0' : '#D9D0BC'; g.fillRect(x0, y0, S * 2, S + 14);
  if (set) for (const [j, pose] of [[0, {}], [1, (new URLSearchParams(location.search).get('hand') ? { 'arm-r': { bare: true } } : { 'arm-r': { bare: true }, 'arm-l': { bare: true } })]]) { g.save(); g.translate(x0 + j * S, y0); g.scale(S / 220, S / 220); g.translate(10, 10); drawRig(g, set, pose); g.restore(); }
  g.fillStyle = '#2B2230'; g.font = '10px sans-serif'; g.fillText(f.replace('art/', '').replace('.svg', ''), x0 + 2, y0 + S + 11); });
window.RES = res; window.DONE = true;
</script></body></html>`;
fs.writeFileSync('tools/rogue19/bare-board.html', html);
const edge = await openEdge(); const page = await (await edge.browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
page.on('pageerror', (e) => console.log('ERR', String(e)));
await page.goto(`http://localhost:${port}/tools/rogue19/bare-board.html?S=${opt('S', 96)}&cols=${opt('cols', 6)}&hand=${opt('hand', '')}`); await page.waitForFunction(() => window.DONE, null, { timeout: 60000 });
const res = await page.evaluate(() => window.RES);
const el = await page.$('#c'); await el.screenshot({ path: out });
console.log(res.filter(([, a]) => a).map(([f]) => f.replace('art/', '')).join(' '));
await edge.close();
