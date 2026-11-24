// Runs worth.mjs (or dungeons.mjs) once per dungeon side by side and puts the rows in one file.
//   node tools/audit/foes16/par.mjs worth --out docs/audit/data/foes16/worth-before.json [--seeds 6] [other args passed on]
//   node tools/audit/foes16/par.mjs dungeons --out docs/audit/data/foes16/dungeons-before.json [--n 30]
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const tool = process.argv[2], args = process.argv.slice(3);
const oi = args.indexOf('--out'), out = args[oi + 1]; args.splice(oi, 2);
const DUNG = ['wildwood', 'warren', 'sewers', 'crypt', 'frost', 'ember', 'spire', 'dunes', 'foundry'];
const tmp = resolve(HERE, 'tmp-' + tool + '-' + process.pid); // (one folder a batch: two batches can run side by side)
mkdirSync(tmp, { recursive: true });
const t0 = Date.now();
const jobs = DUNG.map((d) => new Promise((ok, bad) => {
  const f = resolve(tmp, `${tool}-${d}.json`);
  const p = spawn(process.execPath, [resolve(HERE, tool + '.mjs'), '--dungeons', d, '--out', f, ...args], { stdio: ['ignore', 'pipe', 'inherit'] });
  let last = '';
  p.stdout.on('data', (b) => { last = String(b).trim().split('\n').pop(); });
  p.on('exit', (code) => { console.log(`${d} done (${((Date.now() - t0) / 1000).toFixed(0)}s) ${code ? 'EXIT ' + code : ''} ${last.slice(0, 120)}`); code ? bad(new Error(d)) : ok(JSON.parse(readFileSync(f, 'utf8'))); });
}));
const parts = await Promise.all(jobs);
const merged = { made: new Date().toISOString().slice(0, 10), args, rows: parts.flatMap((p) => p.rows), extra: parts.map((p) => { const { rows, ...rest } = p; return rest; }) };
writeFileSync(out, JSON.stringify(merged, null, 1));
rmSync(tmp, { recursive: true, force: true });
console.log('wrote', out, merged.rows.length, 'rows');
