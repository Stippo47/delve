// Lane wurm19: stop the headless Edges this lane's stopped recordings left behind, and only those: an Edge started by
// tools/edge.mjs (its own delve-edge-* profile) whose pages are on this lane's ports. Other lanes' are left alone.
//   node tools/wurm19/sweep-edge.mjs [--ports 8946,8947] [--dry]
import { execFileSync } from 'node:child_process';
import { sweepProfile } from '../edge.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ports = opt('ports', '8946,8947').split(','), dry = args.includes('--dry');
const out = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command',
  `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*remote-debugging-port=*' -and $_.CommandLine -like '*delve-edge-*' -and $_.CommandLine -notlike '*--type=*' } | ForEach-Object { $_.CommandLine }`], { encoding: 'utf8' });
for (const line of out.split(/\r?\n/).filter(Boolean)) {
  const port = (line.match(/remote-debugging-port=(\d+)/) || [])[1], prof = (line.match(/user-data-dir=("?)([^"]*delve-edge-[A-Za-z0-9]+)/) || [])[2];
  if (!port || !prof) continue;
  let pages = [];
  try { pages = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) })).json(); } catch { console.log('no answer on', port, '(left alone)'); continue; }
  const mine = pages.some((p) => ports.some((q) => (p.url || '').includes(`localhost:${q}/`)));
  console.log(port, prof.split(/[\/]/).pop(), pages.map((p) => (p.url || '').slice(0, 40)).join(' | '), mine ? '-> this lane\'s' : '-> not ours');
  if (mine && !dry) sweepProfile(prof);
}
