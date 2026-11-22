// Render the game's sound for a stretch of play to a file, offline, and measure it (ffmpeg volumedetect + loudness).
// Needs the dev server (python -m http.server <port> from the repo) and playwright-core in tools/. Drives the installed Edge.
//   node tools/sound-render.mjs <out.wav> [--port 8836] [--secs 30] [--camp 0] [--skip 0] [--theme crypt] [--party paladin,archer,twinfang]
//   [--seed 1] [--q 'bossroom&lvl=6'] [--music] (music only) [--board] (every effect in a row, measured) [--only a,b] [--m4a] (also write a small .m4a next to it for listening) [--log] (print each sound with its time)
import { openEdge } from './edge.mjs';
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'sound.wav');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8836);
const o = { secs: +opt('secs', 30), camp: +opt('camp', 0), skip: +opt('skip', 0), theme: opt('theme', 'crypt'), seed: +opt('seed', 1),
  party: opt('party', 'paladin,archer,twinfang').split(','), musicOnly: args.includes('--music') };

const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--mute-audio'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
const page = await (await browser.newContext()).newPage();
page.on('pageerror', (e) => console.log('page error:', String(e)));
const q = opt('q', '');
await page.goto(`http://localhost:${site}/tools/sound-render.html${q ? '?' + q : ''}`);
await page.waitForFunction(() => window.renderReady, null, { timeout: 60000 });
const t0 = Date.now();
const ff = (a) => { const r = spawnSync('ffmpeg', a, { encoding: 'utf8' }); return (r.stdout || '') + (r.stderr || ''); };
function measure() {
  const vd = ff(['-hide_banner', '-nostats', '-i', out, '-af', 'volumedetect,ebur128=peak=true:framelog=quiet', '-f', 'null', '-']);
  for (const l of vd.split('\n')) if (/mean_volume|max_volume|^\s+I:|^\s+LRA:|^\s+Peak:/.test(l)) console.log(l.replace(/\[Parsed_\w+ @ \w+\] /, '').trim());
  if (args.includes('--m4a')) { const m = out.replace(/\.wav$/i, '.m4a'); ff(['-y', '-hide_banner', '-i', out, '-c:a', 'aac', '-b:a', '128k', m]); console.log('listening copy:', m); }
}
if (args.includes('--board')) {   // every effect in a row, and how each measures (rms dB, peak, tail = level in its last 5%)
  const b = await page.evaluate((only) => window.renderBoard({ only }), opt('only', '') ? opt('only').split(',') : null);
  await edge.close();
  fs.writeFileSync(out, Buffer.from(b.wav, 'base64'));
  for (const r of b.table) console.log(`${String(r.at).padStart(7)}s ${r.n.padEnd(13)} ${r.len.toFixed(2)}s rms ${r.rms} peak ${r.peak} tail ${r.tail}${r.tail > 0.02 ? '  <- ends loud' : ''}`);
  measure(); process.exit(0);
}
const res = await page.evaluate((o) => window.renderSound(o), o);
await edge.close();
fs.writeFileSync(out, Buffer.from(res.wav, 'base64'));
console.log(`rendered ${o.camp + o.secs}s in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out} (run ended: ${res.phase}, floor ${res.floor}), sample peak ${res.peak.toFixed(3)}`);
console.log('played:', Object.entries(res.played).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
if (args.includes('--log')) console.log(res.plays.map(([t, n]) => `${t} ${n}`).join('\n'));
measure();
