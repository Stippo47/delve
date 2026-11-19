// Headless check of every trinket: one run per trinket (every hero wears it, all abilities bought), fast-forwarded.
// Counts how often each of the trinket's hooks ran and reports page errors and runs that get stuck.
//   node tools/test/trinkets.mjs [--port 8824] [--secs 240] [--seed 5] [--depth 1] [--only id,id] [--party a,b,c]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8824), secs = +opt('secs', 240), seed = +opt('seed', 5);
const only = opt('only', ''), party = opt('party', ''), depth = +opt('depth', 1);

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const dport = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--mute-audio', `--remote-debugging-port=${dport}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
// Edge's main process outlives a plain kill() on Windows: take the whole tree down, also when the script is stopped.
import { execFileSync } from 'node:child_process';
function quit() { try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }
process.on('SIGINT', () => { quit(); process.exit(1); }); process.on('SIGTERM', () => { quit(); process.exit(1); });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${dport}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });

async function runOne(tq, s) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e).split('\n').slice(0, 3).join(' | ')));
  await page.goto(`http://localhost:${site}/?seed=${s}&allnodes=1&trinkets=${tq}`);
  await page.waitForFunction(() => window.GAME && GAME.state === 'camp');
  const out = await page.evaluate(async ({ tq, secs, party, depth }) => {
    const { TRINKETS } = await import('/js/trinkets.js');
    const calls = {};
    const ids = tq === 'all' ? Object.keys(TRINKETS) : tq.split(',');
    for (const id of ids) for (const [k, f] of Object.entries(TRINKETS[id].hooks)) if (typeof f === 'function' && k !== 'moveSpeed' && k !== 'atkSpeed') {
      if (f.__wrapped) continue;
      const g = function (...a) { const key = id + '.' + k; calls[key] = (calls[key] || 0) + 1; return f.apply(this, a); }; g.__wrapped = true;
      TRINKETS[id].hooks[k] = g;
    }
    if (party) GAME.save.party = party.split(',');
    GAME.startRun(depth);
    let slowest = 0, maxHz = 0, t = 0, ghosts = 0, ethereal = 0, maxUnits = 0, rooms = 0, stuckRoom = 0, lastRooms = 0;
    while (t < secs && GAME.run.phase !== 'won' && GAME.run.phase !== 'lost') {
      const c0 = performance.now(); GAME.fastForward(1); t += 1; slowest = Math.max(slowest, performance.now() - c0);
      const w = GAME.run.world;
      for (const u of w.units) if (u.ethereal) { ethereal++; if (u.ghostOf) ghosts++; }
      maxUnits = Math.max(maxUnits, w.units.length); maxHz = Math.max(maxHz, w.hazards.length);
      if (slowest > 5000) return { stuck: true, slow: true, phase: GAME.run.phase, rooms: GAME.run.rooms, t, calls, slowest, maxHz };
      if (GAME.run.rooms !== lastRooms) { lastRooms = GAME.run.rooms; stuckRoom = 0; } else stuckRoom++;
      if (stuckRoom > 200) return { stuck: true, phase: GAME.run.phase, rooms: GAME.run.rooms, t, calls };
    }
    const r = GAME.run;
    return { phase: r.phase, floor: r.floor, rooms: r.rooms, t, calls, etherealSeconds: ethereal, maxUnits, slowest, maxHz,
      left: Object.fromEntries(Object.entries(r.heroes).map(([k, h]) => [k, h.trinkets.join('+') + (h.down ? ' (down)' : '') + ' L' + h.level])) };
  }, { tq, secs, party, depth });
  await page.close();
  return { ...out, errors };
}

const { TRINKET_IDS } = await (async () => {
  const p = await ctx.newPage(); await p.goto(`http://localhost:${site}/`);
  const r = await p.evaluate(async () => Object.keys((await import('/js/trinkets.js')).TRINKETS)); await p.close(); return { TRINKET_IDS: r };
})();
const list = only ? only.split(',') : [...TRINKET_IDS, 'all'];
let bad = 0;
for (const id of list) {
  const r = await runOne(id, seed);
  const flag = r.errors.length || r.stuck || r.slowest > 1500 ? '!!' : '  ';
  if (flag === '!!') bad++;
  console.log(`${flag} ${id.padEnd(16)} ${r.stuck ? 'STUCK' : r.phase} f${r.floor} rooms ${r.rooms} t${r.t} ${JSON.stringify(r.calls)}${r.etherealSeconds ? ' ethereal-s ' + r.etherealSeconds : ''} units<=${r.maxUnits} hazards<=${r.maxHz} slowest 1s step ${Math.round(r.slowest)}ms`);
  if (r.left) console.log('     ', JSON.stringify(r.left));
  for (const e of r.errors.slice(0, 3)) console.log('     ERR', e);
}
console.log(bad ? `${bad} trinket runs had errors or got stuck` : 'all clean');
await browser.close(); quit();
