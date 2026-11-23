// Where a status simply doesn't take: every hero and every kind in battle mode's roster (bosses too) given 60 of each
// status once (addStatus, the opponent as the source). Prints the kinds that take none or only part, and the special
// rules (charm on bosses, ghosts and curse, angels and radiance). Writes docs/audit/data/statuses/immunity.json.
//   node tools/audit/statuses/immunity.mjs
import { takes, BUILD_IDS } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const B = await import(pathToFileURL(path.join(ROOT, 'js/battle.js')).href);
const { freshSave } = await import(pathToFileURL(path.join(ROOT, 'js/save.js')).href);
const save = freshSave(); save.cheat = true;
const R = B.battleRoster(save);
const kinds = [...R.heroes, ...R.dungeons.flatMap((d) => [...d.kinds, ...d.bosses])];
const out = {}, none = {}, part = {}, more = {};
for (const k of kinds) {
  out[k] = {};
  for (const st of BUILD_IDS) {
    let r; try { r = takes(k, st, 60); } catch (e) { r = { err: String(e.message || e) }; }
    out[k][st] = r;
    if (r.err) continue;
    const g = r.got / 60;
    if (g < 0.01) (none[st] || (none[st] = [])).push(k + (r.ethereal ? ' (ethereal at start)' : ''));
    else if (g < 0.95) (part[st] || (part[st] = [])).push(`${k} ${Math.round(g * 100)}%`);
    else if (g > 1.05) (more[st] || (more[st] = [])).push(`${k} ${Math.round(g * 100)}%`);
  }
}
fs.writeFileSync('docs/audit/data/statuses/immunity.json', JSON.stringify({ kinds: kinds.length, none, part, more, out }));
console.log(kinds.length, 'kinds');
for (const st of BUILD_IDS) {
  console.log(`\n${st}: takes none (${(none[st] || []).length}): ${(none[st] || []).join(', ')}`);
  console.log(`  takes part (${(part[st] || []).length}): ${(part[st] || []).join(', ')}`);
  console.log(`  takes more (${(more[st] || []).length}): ${(more[st] || []).join(', ')}`);
}
