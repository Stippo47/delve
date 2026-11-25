// Outline audit, by the numbers: for every unit kind drawn from SVG parts, the outline the renderer gives it today
// (the part inks grown by data-line or 6 SVG units, scaled with the sprite) in room units, and what each art file
// bakes into itself (dark strokes, dark under-copies).  node tools/outline19/line-audit.mjs [--json]
import fs from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.window = globalThis; globalThis.document = { createElement: () => ({ getContext: () => null }) };
const { DEFS } = await import('../../js/units.js');
const { headR } = await import('../../js/sprites.js');
const rows = [];
// (the files' data-line as they were before the strip: git show a6ec722, so this still tells the old spread)
import { execFileSync } from 'node:child_process';
const lineOf = (file) => { try { const t = execFileSync('git', ['show', 'a6ec722:' + file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); const m = t.match(/id="sprite"[^>]*data-line="([\d.]+)"/) || t.match(/data-line="([\d.]+)"[^>]*id="sprite"/); return m ? +m[1] : 6; } catch { return null; } };
for (const [k, d] of Object.entries(DEFS)) {
  if (!d || !d.art || !d.vr) continue;
  const file = d.art.split('?')[0].split('#')[0];
  const line = lineOf(file); if (line == null) continue;
  const sizeU = d.vr * 220 / (d.headR || headR(k));
  rows.push({ kind: k, file, vr: d.vr, headR: d.headR || headR(k), line, room: +(line * sizeU / 220).toFixed(2) });
}
rows.sort((a, b) => a.room - b.room);
if (process.argv.includes('--json')) console.log(JSON.stringify(rows));
else { for (const r of rows) console.log(r.room.toFixed(2).padStart(5), r.kind.padEnd(18), r.file); const v = rows.map((r) => r.room); console.log('n', v.length, 'min', Math.min(...v), 'max', Math.max(...v), 'median', v.sort((a, b) => a - b)[v.length >> 1]); }
