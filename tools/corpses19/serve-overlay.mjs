// Lane corpses19: the game as it was, for "before" films, next to the game as it is. Serves <root> (the worktree) but
// takes any file found under <overlay> first (the files this lane changed, as they were at the branch's start:
// `git show HEAD~N:js/sim.js > overlay/js/sim.js`).
//   node tools/corpses19/serve-overlay.mjs <port> <overlay> [root=.]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const port = +process.argv[2], over = path.resolve(process.argv[3]), root = path.resolve(process.argv[4] || '.');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const a = path.join(over, p), b = path.join(root, p);
  if (!a.startsWith(over) || !b.startsWith(root)) { res.writeHead(403); res.end(); return; }
  const file = fs.existsSync(a) ? a : b;
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(port, '127.0.0.1', () => console.log('serving', root, 'with', over, 'over it, on', port));
