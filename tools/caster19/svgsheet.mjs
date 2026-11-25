// A sheet of SVG pictures side by side, big, for looking at art (round 19, lane caster19).
//   node tools/caster19/svgsheet.mjs <out.png> <a.svg> [b.svg ...] [--size 300] [--port 8934] [--bg #CFC8BE]
// Needs the dev server (node tools/serve.mjs 8934). Paths are relative to the site root.
import { openEdge } from '../edge.mjs';
import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flags = new Set(['--size', '--port', '--bg']);
const files = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !flags.has(all[i]) && !flags.has(all[i - 1] === undefined ? '' : args.slice(1)[i - 1]));
const out = path.resolve(args[0]), size = +opt('size', 300), port = +opt('port', 8934), bg = opt('bg', '#CFC8BE');
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: size * files.length + 20, height: size + 40 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(`http://localhost:${port}/index.html`).catch(() => {});
  await page.setContent(`<body style="margin:0;background:${bg};display:flex;gap:4px;padding:8px;font:12px sans-serif">${files.map((f) => `<div><img src="http://localhost:${port}/${f}?v=${Date.now()}" width="${size}" height="${size}"><div>${f}</div></div>`).join('')}</body>`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: out });
  console.log('ok', out);
} finally { await edge.close(); }
