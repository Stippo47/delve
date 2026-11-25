// Tables for docs/outline19.md from tools/outline19/out/before.json and after.json (measure.mjs) and line-audit.mjs.
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const B = JSON.parse(fs.readFileSync('tools/outline19/out/before.json', 'utf8')), A = JSON.parse(fs.readFileSync('tools/outline19/out/after.json', 'utf8'));
const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const st = (rows) => { const a = rows.map((r) => r.totalPx).sort((x, y) => x - y); return `${a.length} | ${a[0]} | ${q(a, 0.1)} | ${q(a, 0.5)} | ${q(a, 0.9)} | ${a[a.length - 1]}`; };
console.log('| group | n | min | 10% | median | 90% | max |  (device px, iPhone 11 at the default zoom; before / after)'); console.log('|---|---|---|---|---|---|---|');
for (const g of ['hero', 'summon', 'enemy', 'boss', 'prop']) { console.log(`| ${g} before | ${st(B.filter((r) => r.grp === g && !r.err))} |`); console.log(`| ${g} after | ${st(A.filter((r) => r.grp === g && !r.err))} |`); }
const L = JSON.parse(execFileSync('node', ['tools/outline19/line-audit.mjs', '--json'], { encoding: 'utf8' }));
const hist = {}; for (const r of L) { const b = (Math.floor(r.room * 2) / 2).toFixed(1); hist[b] = (hist[b] || 0) + 1; }
console.log('\nold outline in room units (computed: line x size), kinds per half unit:', JSON.stringify(hist));
const v = L.map((r) => r.room).sort((a, b) => a - b); console.log('n', v.length, 'min', v[0], 'median', q(v, 0.5), 'max', v[v.length - 1]);
console.log('thinnest:', L.slice(0, 6).map((r) => `${r.kind} ${r.room}`).join(', '));
console.log('thickest:', L.slice(-8).map((r) => `${r.kind} ${r.room}`).join(', '));
