// Every strategy in strategies.mjs over several seeds, side by side (one node process each, --jobs at a time).
//   node tools/play16/all.mjs [--seeds 4] [--jobs 12] [--runs 160] [--until 4] [--only a,b]
import { spawn } from 'node:child_process';
import { STRATS } from './strategies.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const seeds = +opt('seeds', 4), jobs = +opt('jobs', 12), only = opt('only') ? opt('only').split(',') : Object.keys(STRATS);
const todo = [];
for (const s of only) for (let seed = 1; seed <= seeds; seed++) todo.push([s, seed]);
let running = 0;
const next = () => {
  while (running < jobs && todo.length) {
    const [s, seed] = todo.shift(); running++;
    const p = spawn(process.execPath, ['tools/play16/campaign.mjs', '--strategy', s, '--seed', String(seed), '--runs', opt('runs', '160'), '--until', opt('until', '4')], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = ''; p.stdout.on('data', (d) => { out += d; });
    p.on('close', (code) => { running--; process.stdout.write(out.trim().split('\n').slice(-1)[0] + (code ? ` (exit ${code})` : '') + '\n'); next(); });
  }
};
next();
