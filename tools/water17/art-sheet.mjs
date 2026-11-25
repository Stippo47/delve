// round 17 (lane water17): the Water Mage's placeholder beside the Frost Mage it is built on, big and at 8 turns, 70 and 40 px
//   node tools/water17/art-sheet.mjs [out.png]
import fs from 'node:fs';
import path from 'node:path';
import { openEdge } from '../edge.mjs';
const out = path.resolve(process.argv[2] || 'tools/water17/art-sheet.png');
const svg = (f) => 'data:image/svg+xml;base64,' + Buffer.from(fs.readFileSync(f)).toString('base64');
const W = svg('art/heroes/waterMage.svg'), F = svg('art/heroes/frost.svg'), C = svg('art/heroes/cleric.svg');
const turns = (src, px) => Array.from({ length: 8 }, (_, i) => `<img src="${src}" style="width:${px}px;transform:rotate(${i * 45}deg)">`).join('');
const html = `<body style="margin:0;background:#3B3A44;font:14px sans-serif;color:#ddd;padding:12px">
<div style="display:flex;gap:16px;align-items:end"><div><img src="${W}" width="300"><br>Water Mage (placeholder)</div><div><img src="${F}" width="180"><br>Frost Mage</div><div><img src="${C}" width="180"><br>Cleric</div></div>
<div style="margin-top:10px">${turns(W, 70)}</div><div>${turns(W, 40)}</div><div style="margin-top:6px;background:#9C8F78;display:inline-block">${turns(W, 40)}</div></body>`;
const edge = await openEdge();
try { const ctx = await edge.browser.newContext({ viewport: { width: 760, height: 560 } }); const pg = await ctx.newPage(); await pg.setContent(html); await pg.waitForTimeout(400); await pg.screenshot({ path: out }); } finally { await edge.close(); }
console.log(out);
