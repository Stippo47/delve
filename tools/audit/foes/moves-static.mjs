// The moves each enemy's brain can time with due() (elites.js), read from the source: the brain's own text and every
// function it calls, so far down as they go. node tools/audit/foes/moves-static.mjs  -> docs/audit/data/foes/moves-static.json
// (A move on a home-made clock, not due(), is not listed here; the batches find those by their timers.)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { boot, ROOT } from './lib.mjs';
const G = await boot(); // (before instrument: the brains are the game's own functions)
const R = G.B.battleRoster(G.save);
const src = {};
for (const f of readdirSync(resolve(ROOT, 'js'))) if (f.endsWith('.js')) src[f] = readFileSync(resolve(ROOT, 'js', f), 'utf8');
// name -> [body text...]
const FN = Object.create(null);
function bodyFrom(text, i) {
  const open = text.indexOf('{', i), nl = text.indexOf('\n', i);
  if (open < 0) return text.slice(i, nl);
  // an arrow with an expression body: up to the end of the line
  const arrow = text.indexOf('=>', i);
  if (arrow >= 0 && arrow < open && text.slice(arrow + 2, open).trim().length) return text.slice(i, nl < 0 ? undefined : nl);
  let depth = 0;
  for (let j = open; j < text.length; j++) { const c = text[j]; if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) return text.slice(i, j + 1); } }
  return text.slice(i);
}
// a name is looked up in the file that calls it, else in the file it was imported from (one module's helpers don't
// leak into another's: many files have their own charge(), beam() ...)
const IMP = {};
for (const [file, text] of Object.entries(src)) {
  const im = IMP[file] = Object.create(null);
  for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/([\w.-]+)'/g)) for (const part of m[1].split(',')) { const [a, b] = part.trim().split(/\s+as\s+/); if (a) im[(b || a).trim()] = { file: m[2], name: a.trim() }; }
  for (const re of [/function\s+([A-Za-z_$][\w$]*)\s*\(/g, /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g]) {
    let m; while ((m = re.exec(text))) (FN[m[1]] || (FN[m[1]] = [])).push({ file, body: bodyFrom(text, m.index) });
  }
}
function defsOf(name, file) {
  const all = FN[name]; if (!all) return [];
  const here = all.filter((d) => d.file === file); if (here.length) return here;
  const im = IMP[file] && IMP[file][name];
  if (im) return (FN[im.name] || []).filter((d) => d.file === im.file);
  return [];
}
const SKIP = new Set(['due', 'again', 'hold', 'beginHold', 'stand', 'turnTo', 'hurt', 'spawn', 'addDanger', 'kill', 'alive', 'opponents', 'dist', 'angleTo', 'rrange', 'chance', 'rand', 'puff', 'sparks', 'setAnim', 'addStatus', 'explode', 'targetOf', 'gapTo', 'crowd', 'later', 'fx', 'zone']);
function keysOf(text, file, seen = new Set(), depth = 0) {
  const keys = new Set();
  for (const m of text.matchAll(/\bdue\(\s*[\w.]+\s*,\s*'(\w+)'/g)) keys.add(m[1]);
  for (const m of text.matchAll(/\bevery\(\s*w\w*\s*,\s*\w+\s*,\s*dt\s*,\s*'(\w+)'/g)) keys.add(m[1]);
  if (depth > 7) return keys;
  for (const m of text.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
    const n = m[1]; if (SKIP.has(n)) continue;
    for (const d of defsOf(n, file)) { const id = d.file + ':' + n; if (seen.has(id)) continue; seen.add(id); for (const k of keysOf(d.body, d.file, seen, depth + 1)) keys.add(k); }
  }
  return keys;
}
const out = {};
for (const d of R.dungeons) for (const k of [...d.kinds, ...d.bosses]) {
  const D = G.DEFS[k], fns = ['brain', 'onDeath', 'onHop', 'onSplit', 'struck'].filter((h) => typeof D[h] === 'function');
  const keys = new Set();
  const where = [];
  for (const h of fns) {
    const t = D[h].toString(), file = Object.keys(src).find((f) => src[f].includes(t)) || Object.keys(src).find((f) => src[f].includes(t.slice(0, 60)));
    where.push(file || '?');
    for (const x of keysOf(t, file)) keys.add(x);
  }
  out[k] = { dungeon: d.id, hooks: fns, files: [...new Set(where)], due: [...keys].sort(), ability: D.ability || null };
}
writeFileSync(resolve(ROOT, 'docs/audit/data/foes/moves-static.json'), JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(14), v.hooks.join('+').padEnd(14), v.files.join(',').padEnd(12), v.due.join(' '), v.ability ? '[ability ' + v.ability + ']' : '');
