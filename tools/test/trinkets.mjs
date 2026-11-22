// Headless check of every trinket: one run per trinket (every hero wears it, all abilities bought), fast-forwarded.
// Counts how often each of the trinket's hooks ran and reports page errors and runs that get stuck.
//   node tools/test/trinkets.mjs [--port 8824] [--secs 240] [--seed 5] [--depth 1] [--only id,id] [--party a,b,c]
import { openEdge } from '../edge.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8824), secs = +opt('secs', 240), seed = +opt('seed', 5);
const only = opt('only', ''), party = opt('party', ''), depth = +opt('depth', 1);

const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--mute-audio'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
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
      if (stuckRoom > 200) return { stuck: true, phase: GAME.run.phase, rooms: GAME.run.rooms, t, calls,
        why: `${GAME.run.node.kind} room, quiet ${Math.round(GAME.run.quietT || 0)}s, ` + w.units.filter((u) => !u.dead).map((u) => `${u.kind}${u.downed ? '(down)' : ''}${u.ethereal ? '(ghost)' : ''}@${u.x | 0},${u.y | 0}${u.aggro ? '' : '(asleep)'}`).join(' ') };
    }
    const r = GAME.run;
    return { phase: r.phase, floor: r.floor, rooms: r.rooms, t, calls, etherealSeconds: ethereal, maxUnits, slowest, maxHz,
      left: Object.fromEntries(Object.entries(r.heroes).map(([k, h]) => [k, h.trinkets.join('+') + (h.down ? ' (down)' : '') + ' L' + h.level])) };
  }, { tq, secs, party, depth }).catch((e) => ({ thrown: true, errorsInRun: String(e).split(String.fromCharCode(10)).slice(0, 3).join(' | ') }));
  if (out.thrown) errors.push(out.errorsInRun);
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
  if (r.why) console.log('      stuck in', r.why);
  for (const e of r.errors.slice(0, 3)) console.log('     ERR', e);
}
console.log(bad ? `${bad} trinket runs had errors or got stuck` : 'all clean');
await edge.close();
