// Round 19 art lane (enemy sprites): renders the boards listed in a JSON file through tools/art-foeart/board.html.
//   node tools/art-foeart/render.mjs <boards.json> [filter]
// boards.json: [{ out: "design/r19-art/foes/imp/imp-a.png", title, sub, kind, cur: [{url,label}], opt: [{url,label}] }]
// Serves the worktree on 8947 and drives a headless Edge on its own temp profile (tools/edge.mjs).
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { openEdge } from '../edge.mjs';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '../..');
const PORT = +(process.env.FOE_PORT || 8949); // (8947 was taken by another lane's server)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, buf) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(buf); });
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const list = JSON.parse(fs.readFileSync(path.resolve(ROOT, process.argv[2]), 'utf8')).filter((b) => !process.argv[3] || b.out.includes(process.argv[3]));
const edge = await openEdge({ port: PORT + 1 });
try {
  const ctx = edge.browser.contexts()[0] || await edge.browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/tools/art-foeart/board.html`);
  await page.waitForFunction(() => window.boardReady, null, { timeout: 30000 });
  for (const b of list) {
    const url = await page.evaluate((s) => window.board(s), b);
    const out = path.resolve(ROOT, b.out); fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', b.out);
    if (b.thumb) { const t = await page.evaluate((s) => window.thumb(s), b); fs.writeFileSync(path.resolve(ROOT, b.thumb), Buffer.from(t.split(',')[1], 'base64')); }
  }
} finally { await edge.close(); server.close(); }
