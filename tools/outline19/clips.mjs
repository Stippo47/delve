// Lane outline19's before/after clips (the one outline), recorded with tools/clip.mjs, close in (--zoom).
//   node tools/outline19/clips.mjs --port 8935 --tag after [--only a,b]   (before: the round's start served on 8936)
// -> docs/clips/outline19/<name>-<tag>.mp4
import { execFile } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8935'), tag = opt('tag', 'after'), only = (opt('only', '') || '').split(',').filter(Boolean);
const out = path.resolve('docs/clips/outline19'); fs.mkdirSync(out, { recursive: true });
const CLIPS = {
  // sizes side by side: a troll, an orc, goblins, bees and slimelets against four heroes
  sizes: ['--battle', 'troll,orc,goblin*2,bee*3,slimeSmall*2|paladin,archer,berserker,cleric', '--zoom', '1.4', '--secs', '7', '--skip', '1.5', '--seed', '5'],
  // a boss drawn as SVG art (its outline was 2.5x a hero's)
  seraph: ['--battle', 'gildedSeraph|paladin,archer,cleric,berserker', '--zoom', '1.1', '--secs', '7', '--skip', '2', '--seed', '5'],
  // a boss drawn in code (boss-draw.js figure: its outline was 3.6)
  engine: ['--battle', 'greatEngine|paladin,archer,cleric,berserker', '--zoom', '1.0', '--secs', '7', '--skip', '2', '--seed', '5'],
  // a dungeon room: props (rocks, crates, pillars), rats
  room: ['--depth', '2', '--zoom', '1.3', '--secs', '7', '--skip', '3', '--seed', '11'],
};
const run = (name) => new Promise((res) => {
  const file = path.join(out, `${name}-${tag}.mp4`);
  execFile('node', ['tools/clip.mjs', file, '--port', port, ...CLIPS[name]], { timeout: 600000 }, (e, so, se) => { console.log(name, e ? 'FAILED ' + (se || e).toString().slice(-300) : '-> ' + file); res(); });
});
const names = Object.keys(CLIPS).filter((n) => !only.length || only.includes(n));
for (let i = 0; i < names.length; i += 2) await Promise.all(names.slice(i, i + 2).map(run));
