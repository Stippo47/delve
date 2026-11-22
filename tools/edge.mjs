// One headless Edge for a recording tool, and a clean end to it (round 14, lane L).
//   const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--mute-audio'] });   // edge.browser: a playwright Browser over CDP
//   ...
//   await edge.close();
// Why: the pid that spawn(msedge) returns is a launcher that hands over to another process and exits, so taskkill on it
// found nothing and every run left a headless Edge behind (hundreds by round 14). close() asks the browser to quit over
// CDP (Browser.close), then stops whatever is still running with this tool's own profile folder (delve-edge-XXXXXX, in
// the temp folder: only processes started for this run carry it, so other tools' and the user's Edge are left alone),
// then removes the folder. If the tool dies first (an error, Ctrl+C) the same clean-up runs on the way out.
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

// The ids of running processes whose command line names this profile folder (Windows: through PowerShell's CIM query).
export function profileProcesses(prof) {
  const tag = path.basename(prof).replace(/'/g, '');
  if (!/^delve-edge-[A-Za-z0-9]+$/.test(tag)) return []; // only ever our own folders
  try {
    const out = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command',
      `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${tag}*' } | ForEach-Object { $_.ProcessId }`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 });
    return out.split(/\s+/).filter((s) => /^\d+$/.test(s)).map(Number);
  } catch { return []; }
}
// Stop every process still on this profile folder, then remove the folder (synchronous, so it also runs on exit).
export function sweepProfile(prof) {
  for (let pass = 0; pass < 3; pass++) {
    const pids = profileProcesses(prof);
    if (!pids.length) break;
    for (const pid of pids) { try { execFileSync('taskkill', ['/PID', String(pid), '/F'], { stdio: 'ignore' }); } catch {} }
  }
  for (let i = 0; i < 5; i++) { try { fs.rmSync(prof, { recursive: true, force: true }); break; } catch { const t = Date.now() + 300; while (Date.now() < t) { /* the folder can stay locked a moment */ } } }
}

// flags: Edge's own switches (default: headless, no GPU, no sound, no scrollbars); the debugging port and the profile are added here.
export async function openEdge({ flags = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'], port = 9300 + Math.floor(Math.random() * 500) } = {}) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
  const proc = spawn(EDGE, [...flags, `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
  let browser = null, closed = false;
  const onExit = () => { if (!closed) { closed = true; sweepProfile(prof); } };
  process.on('exit', onExit);
  for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => { onExit(); process.exit(1); });
  for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
  if (!browser) { onExit(); throw new Error('headless Edge did not start'); }
  async function close() {
    if (closed) return;
    try { const cs = await browser.newBrowserCDPSession(); await cs.send('Browser.close'); } catch {}
    await browser.close().catch(() => {});
    // give it a moment to go by itself, then stop what's left on our profile
    for (let i = 0; i < 10 && profileProcesses(prof).length; i++) await new Promise((r) => setTimeout(r, 300));
    closed = true;
    sweepProfile(prof);
    try { proc.kill(); } catch {}
  }
  return { browser, prof, port, proc, close };
}
