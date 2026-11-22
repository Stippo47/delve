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
page.on('pageerror', (e) => errors.push(String(e)));
const q = opt('q', ''); // extra address parameters
await page.goto(`http://localhost:${site}/?seed=${seed}${q ? '&' + q : ''}`);
await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 180000 }); // sprites loaded, camp shown
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
const convoyStep = () => page.evaluate((pick) => { const r = GAME.run; if (r && r.mode === 'convoy' && r.phase === 'roadside') GAME.convoyPick(pick || 'auto'); }, opt('pick', ''));
if (skip) await page.evaluate((s) => { for (let i = 0; i < s * 30; i++) { GAME.recFrame(1 / 30); const r = GAME.run; if (r && r.mode === 'convoy' && r.phase === 'roadside') GAME.convoyPick('auto'); } }, skip);
// --down N (convoy): after the skip, the second hero drops N behind the wagon (a revive, or one left behind) and the
// waves hold off for 20 s, so the clip shows the downed hero's ring and what becomes of them
if (args.includes('--convoy') && opt('down')) await page.evaluate((back) => { const r = GAME.run, wg = r.wagon; r.waveT = 20;
  const h = r.world.units.filter((u) => u.team === wg.team && !u.def.cargo && !u.downed && !u.dead && r.heroes[u.kind])[1];
  if (h) { h.x = wg.x - back; h.y = wg.y + 150; h.hp = 0; h.downed = true; h.target = null; h.forcedGoal = null; } }, +opt('down'));
const n = Math.round(secs * fps);
for (let i = 0; i < n; i++) {
  await page.evaluate((dt) => GAME.recFrame(dt), speed / fps);
  await convoyStep();
  await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
}
// a plain kill() leaves Edge running on Windows: take its whole process tree down
await browser.close(); try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { edge.kill(); } try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'),
  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', out]);
fs.rmSync(frames, { recursive: true, force: true });
console.log(errors.length ? 'page errors:\n' + errors.join('\n') : 'no page errors', '->', out);
