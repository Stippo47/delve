// Round 18, lane dash18: exact-text replacements from a JSON list (a small edit tool for this lane's own files).
//   node tools/dash18/rep.mjs <file> <edits.json>     edits: [[from, to], ...]; every `from` must be there exactly once
// (a file with Windows line ends is matched and written with them)
import fs from 'node:fs';
const [file, list] = process.argv.slice(2);
let s = fs.readFileSync(file, 'utf8'); const crlf = s.includes('\r\n'); const nl = (t) => (crlf ? t.replace(/\r?\n/g, '\r\n') : t);
const edits = JSON.parse(fs.readFileSync(list, 'utf8')); let bad = 0;
for (const [a0, b0] of edits) { const a = nl(a0), b = nl(b0), n = s.split(a).length - 1; if (n !== 1) { console.error(`${n} matches: ${a.slice(0, 70)}`); bad++; continue; } s = s.replace(a, () => b); }
if (bad) process.exit(1);
fs.writeFileSync(file, s); console.log(`${edits.length} edits -> ${file}`);
