// Lane S's status clips: a battle (js/battle.js) recorded frame by frame like tools/clip.mjs, with an optional bit of
// script run every frame (to start a status on a chosen unit at a chosen moment, so its build-up and burst are sure
// to be in the clip). Also writes a few still frames (--stills 1.2,3.5) beside the mp4 for checking by eye.
//   node tools/status-clip.mjs out.mp4 --battle "red|blue" [--arena crypt] [--tier 3] [--secs 8] [--port 8885]
//        [--inject "js using w, t (seconds), U(kind, team)"] [--stills 1,2,3] [--w 520 --h 640] [--zoom 1]
import { openEdge } from './edge.mjs';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8885), secs = +opt('secs', 8), fps = 30, W = +opt('w', 520), H = +opt('h', 640);
const stills = (opt('stills', '') || '').split(',').filter(Boolean).map(Number);
const frames = fs.mkdtempSync(path.join(path.dirname(out), '.frames-'));
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://localhost:${site}/?seed=${+opt('seed', 3)}`);
await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 180000 });
await page.evaluate(async ([b, arena, tier]) => {
  const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
  const [red, blue] = b.split('|');
  GAME.save.cheat = true;
  const { tierBuild } = await import('./js/heroes.js');
  for (const s of [...parse(red), ...parse(blue)]) if (GAME.save.heroes[s.k]) GAME.save.heroes[s.k].nodes = tierBuild(s.k, tier);
  GAME.record(true); GAME.startBattle({ arena, a: parse(blue), b: parse(red) });
}, [opt('battle'), opt('arena', 'crypt'), +opt('tier', 3)]);
const inject = opt('inject', '');
const n = Math.round(secs * fps);
for (let i = 0; i < n; i++) {
  await page.evaluate(async ([dt, code, t]) => {
    if (code) { const S = await import('./js/sim.js'); const w = GAME.run.world; const U = (k, team) => w.units.find((u) => u.kind === k && !u.dead && (!team || (u.trueTeam || u.team) === team));
      const f = new Function('w', 't', 'U', 'S', 'dt', code); f(w, t, U, S, dt); }
    GAME.recFrame(dt);
  }, [1 / fps, inject, i / fps]);
  const file = path.join(frames, `f${String(i).padStart(4, '0')}.png`);
  await page.screenshot({ path: file });
  for (const s of stills) if (Math.round(s * fps) === i) fs.copyFileSync(file, out.replace(/\.mp4$/, `-${s}s.png`));
}
await edge.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'),
  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', out]);
fs.rmSync(frames, { recursive: true, force: true });
console.log(errors.length ? 'page errors:\n' + errors.join('\n') : 'no page errors', '->', out);
