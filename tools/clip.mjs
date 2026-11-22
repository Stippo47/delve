// Record a short clip of a run, frame by frame, so it plays smoothly whatever the machine's speed.
// Needs the dev server on :8811 and `npm i --no-save playwright-core` in tools/. Drives the installed Edge.
//   node tools/clip.mjs <out.mp4> [--seed N] [--depth D] [--secs S] [--skip S] [--speed 2] [--w 390 --h 844] [--fps 30]
//   [--q 'theme=crypt&bossroom&lvl=6'] (extra address parameters for the game's test switches)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'clip.mp4');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8811); // the game's dev server
const seed = +opt('seed', 3), depth = +opt('depth', 1), secs = +opt('secs', 8), skip = +opt('skip', 0);
const W = +opt('w', 390), H = +opt('h', 844), fps = +opt('fps', 30), speed = +opt('speed', 1);

const frames = fs.mkdtempSync(path.join(path.dirname(out), '.frames-'));
// Edge won't take Playwright's pipe here, so start it ourselves with a debugging port and connect.
import { spawn } from 'node:child_process';
import os from 'node:os';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
// (round 14, lane W: whatever goes wrong below, Edge is taken down before this exits: a failed run used to leave it running)
const killEdge = () => {
  try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
  // (round 14, lane W) Edge starts itself again under another process id, which the line above doesn't reach, so every
  // run used to leave one running: take down whatever still runs on this run's own profile folder
  try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${path.basename(prof)}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
};
setTimeout(() => { console.error('clip.mjs: took too long, giving up'); killEdge(); try { fs.rmSync(frames, { recursive: true, force: true }); } catch {} process.exit(2); }, +opt('max', 480) * 1000).unref(); // (--max S: a run that hangs still takes its Edge down)
process.on('uncaughtException', (e) => { console.error(e); killEdge(); try { fs.rmSync(frames, { recursive: true, force: true }); } catch {} process.exit(1); });
process.on('unhandledRejection', (e) => { console.error(e); killEdge(); try { fs.rmSync(frames, { recursive: true, force: true }); } catch {} process.exit(1); });
page.on('pageerror', (e) => errors.push(String(e)));
const q = opt('q', ''); // extra address parameters
// Open the game and wait for it to be up. A small static server (python -m http.server) refuses some of a page's
// hundred requests when they come in a burst, and one module missing leaves the game never starting: so a load that
// isn't up in 30 s is tried again (what did arrive is cached), a few times. Polled on a timer: a headless page's frames
// can stall on a busy machine.
async function loadGame(page, url, up = () => window.GAME && GAME.ready) {
  for (let i = 0; ; i++) {
    try { if (i) await page.reload(); else await page.goto(url); await page.waitForFunction(up, null, { timeout: 30000, polling: 200 }); return; }
    catch (e) { if (i >= 5) throw e; }
  }
}
await loadGame(page, `http://localhost:${site}/?seed=${seed}${q ? '&' + q : ''}`, () => window.GAME && GAME.state === 'camp' && GAME.ready); // sprites loaded, camp shown
// --battle "rattler*10,necromancer|paladin,tower" [--arena crypt]: a battle (js/battle.js), Red's stacks then Blue's; kind*count@rank.
// Everything is fieldable for the clip (the cheat save), and --nodes "paladin:guard1+shieldBash1,..." gives heroes skills.
const battle = opt('battle', '');
if (battle) {
  await page.evaluate(([b, arena, nodes]) => {
    const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
    const [red, blue] = b.split('|');
    GAME.save.cheat = true;
    for (const part of (nodes || '').split(',').filter(Boolean)) { const [h, list] = part.split(':'); if (GAME.save.heroes[h]) GAME.save.heroes[h].nodes = Object.fromEntries(list.split('+').map((n) => [n, 1])); }
    GAME.record(true); GAME.startBattle({ arena, a: parse(blue), b: parse(red) });
  }, [battle, opt('arena', 'crypt'), opt('nodes', '')]);
} else if (args.includes('--convoy')) {
  // --convoy [--party paladin,archer,cleric] [--level 5] [--stretch 0-2] [--lands wildwood,warren]: the wagon mode
  // (js/convoy.js); at a roadside camp it shops as convoys.mjs does (or buys --pick repair|potion|trinket|sellsword first)
  await page.evaluate(([party, level, stretch, lands]) => {
    const s = GAME.save; s.unlocks = { ...(s.unlocks || {}), slotMini1: true, slotBoss1: true };
    for (const id of party) { const h = s.heroes[id]; h.owned = true; h.level = level; }
    s.party = party.slice();
    GAME.record(true); GAME.startConvoy({ party, stretch, lands: lands ? lands.split(',') : undefined });
  }, [opt('party', 'paladin,archer,cleric').split(','), +opt('level', 5), +opt('stretch', 0), opt('lands', '')]);
} else await page.evaluate(([d, party, level, quiet]) => { // [--party a,b,c] [--level N]: a dungeon run with that party (lane W)
  if (party) { const s = GAME.save; s.unlocks = { ...(s.unlocks || {}), slotMini1: true, slotBoss1: true }; for (const id of party.split(',')) { s.heroes[id].owned = true; s.heroes[id].level = level; } s.party = party.split(','); }
  GAME.record(true); GAME.startRun(d);
  if (quiet) { const w = GAME.run.world; w.wp = null; for (const u of w.units) if (u.team !== 'hero' && u.team !== 'neutral') { u.x = w.W + 4000; u.aggro = false; u.ethereal = true; } } // --quiet: the room's foes taken out of sight (the walk with nothing about)
  }, [depth, opt('party', ''), +opt('level', 5), args.includes('--quiet')]);
if (opt('zoom')) await page.evaluate(async (z) => { (await import('./js/render.js')).setZoom(+z); }, opt('zoom')); // --zoom 1.4: the camera closer in (0.5 to 1.5)
const convoyStep = () => page.evaluate((pick) => { const r = GAME.run; if (r && r.mode === 'convoy' && r.phase === 'roadside') GAME.convoyPick(pick || 'auto'); }, opt('pick', ''));
if (skip) await page.evaluate((s) => { for (let i = 0; i < s * 30; i++) { GAME.recFrame(1 / 30); const r = GAME.run; if (r && r.mode === 'convoy' && r.phase === 'roadside') GAME.convoyPick('auto'); } }, skip);
// --down N (convoy): after the skip, the second hero drops N behind the wagon (a revive, or one left behind) and the
// waves hold off for 20 s, so the clip shows the downed hero's ring and what becomes of them
if (args.includes('--convoy') && opt('down')) await page.evaluate((back) => { const r = GAME.run, wg = r.wagon; r.calm = 20;
  const h = r.world.units.filter((u) => u.team === wg.team && !u.def.cargo && !u.downed && !u.dead && r.heroes[u.kind])[1];
  if (h) { h.x = wg.x - back; h.y = wg.y + 150; h.hp = 0; h.downed = true; h.target = null; h.forcedGoal = null; } }, +opt('down'));
// --lean X (convoy): hold the camera across the road (-1 the left wood .. 1 the right); --calm S: no foes for S seconds
if (args.includes('--convoy') && (opt('lean') != null || opt('calm') != null)) await page.evaluate(([lean, calm]) => { const r = GAME.run; if (lean != null) r.lean = +lean; if (calm != null) r.calm = +calm; }, [opt('lean', null), opt('calm', null)]);
// --send left:5,right:5 (convoy): after the skip, a crowd from each side named (ahead | behind | left | right), n foes each
if (args.includes('--convoy') && opt('send')) await page.evaluate((list) => { for (const part of list.split(',')) { const [dir, n] = part.split(':'); GAME.run.send(dir, +n || 5); } }, opt('send'));
// --eval "js": run in the page after the skip (staging a clip: GAME.run is the trip)
if (opt('eval')) await page.evaluate((js) => { (0, eval)(js); }, opt('eval'));
const n = Math.round(secs * fps);
// --follow yeti: the camera stays on the one of that kind nearest the fighting (then on it till it falls) (with --zoom, a close look at one enemy)
const follow = opt('follow', '');
for (let i = 0; i < n; i++) {
  if (follow) await page.evaluate((k) => { const w = GAME.run && GAME.run.world; if (!w) return; const near = (o) => Math.min(...w.units.filter((h) => h.team !== o.team && !h.dead && h.team !== 'neutral').map((h) => Math.hypot(h.x - o.x, h.y - o.y)), 9e9); const u = (w._fol && !w._fol.dead ? w._fol : null) || w.units.filter((o) => o.kind === k && !o.dead).sort((p, q) => near(p) - near(q))[0] || w._fol; if (u) { w._fol = u; const c = w._cam || (w._cam = { x: u.x, y: u.y }); c.x += (u.x - c.x) * 0.12; c.y += (u.y - c.y) * 0.12; w.camAt = c; } }, follow);
  await page.evaluate((dt) => GAME.recFrame(dt), speed / fps);
  await convoyStep();
  await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
}
// a plain kill() leaves Edge running on Windows: take its whole process tree down
try { await browser.close(); } catch {} killEdge();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'),
  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', out]);
fs.rmSync(frames, { recursive: true, force: true });
console.log(errors.length ? 'page errors:\n' + errors.join('\n') : 'no page errors', '->', out);
