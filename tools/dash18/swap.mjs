// Round 18, lane dash18: replace one ability's whole block in a kits file ("  key: {" down to its closing "  },")
// with the text of another file.   node tools/dash18/swap.mjs js/kits2.js iaido new-iaido.txt
import fs from 'node:fs';
const [file, key, src] = process.argv.slice(2);
const s = fs.readFileSync(file, 'utf8'), crlf = s.includes('\r\n'), L = s.split(/\r?\n/);
const i = L.findIndex((l) => l.startsWith(`  ${key}: {`)); if (i < 0) { console.error('no block', key); process.exit(1); }
if (L.filter((l) => l.startsWith(`  ${key}: {`)).length !== 1) { console.error('more than one', key); process.exit(1); }
let j = i; while (j < L.length && L[j] !== '  },') j++;
const neu = fs.readFileSync(src, 'utf8').replace(/\r?\n$/, '').split(/\r?\n/);
L.splice(i, j - i + 1, ...neu);
fs.writeFileSync(file, L.join(crlf ? '\r\n' : '\n')); console.log(`${key}: ${j - i + 1} lines -> ${neu.length}`);
