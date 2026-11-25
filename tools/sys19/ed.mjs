// tiny edit helper: node tools/sys19/ed.mjs <file> <script.json>  where script is [[from, to], ...] (exact, once each)
// (works on LF text; writes back CRLF if the file had CRLF)
import fs from 'node:fs';
const [file, spec] = process.argv.slice(2);
let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
for (const [a, b] of JSON.parse(fs.readFileSync(spec, 'utf8'))) { const i = s.indexOf(a); if (i < 0) { console.error('MISSING in ' + file + ': ' + a.slice(0, 90)); process.exit(1); } if (s.indexOf(a, i + 1) >= 0) { console.error('NOT UNIQUE in ' + file + ': ' + a.slice(0, 90)); process.exit(1); } s = s.slice(0, i) + b + s.slice(i + a.length); }
fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('ok', file);
