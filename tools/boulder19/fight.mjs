// Film a real fight with the camera on the boulder (or snowball) rather than its thrower (lane boulder19).
//   node tools/boulder19/fight.mjs <out.mp4> --battle "troll*1|paladin,archer,cleric" [--arena crypt] [--seed 3] [--secs 14]
//     [--zoom 1.3] [--q "boulder=b&dirt=1"] [--port 8973] [--fps 30]
// The camera eases toward the middle of the ball and its owner (the ball when they are far apart), so a throw stays in
// view; heroes at their save's levels with points spent as tools/clip.mjs does. The fight is the game's own (no changes).
import { openEdge } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0]), port = +opt('port', 8973), fps = +opt('fps', 30), secs = +opt('secs', 14), seed = +opt('seed', 3);
const edge = await openEdge();
const frames = fs.mkdtempSync(path.join(path.dirname(out), '.frames-'));
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`http://localhost:${port}/?seed=${seed}&${opt('q', '')}`);
  await page.waitForFunction(() => window.GAME && GAME.ready && GAME.state === 'camp', null, { timeout: 120000, polling: 200 });
  await page.evaluate(async ([b, arena, zoom]) => {
    const P = await import('./js/progress.js'), R = await import('./js/render.js');
    const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [k, n] = x.split('*'); return { k, n: +n || 1, rank: 0 }; });
    const [red, blue] = b.split('|'); GAME.save.cheat = true;
    for (const { k } of [...parse(red), ...parse(blue)]) { const h = GAME.save.heroes[k]; if (h) { h.owned = true; h.points = Math.max(0, P.START_POINTS + h.level - 1 - P.spentPoints(GAME.save, k)); P.autoSpend(GAME.save, k); } }
    GAME.record(true); GAME.startBattle({ arena, a: parse(blue), b: parse(red) });
    R.setZoom(zoom); window.__R = R;
  }, [opt('battle'), opt('arena', 'crypt'), +opt('zoom', 1.3)]);
  const n = Math.round(secs * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate((dt) => {
      const w = GAME.run && GAME.run.world; if (!w) return;
      const ball = w.pillars.find((p) => p.boulder || p.snowball), own = ball && ball.owner && !ball.owner.dead ? ball.owner : null;
      const foe = w.units.find((u) => (u.kind === 'troll' || u.kind === 'rockTroll' || u.kind === 'yeti') && !u.dead);
      let tx, ty;
      if (ball && own && Math.hypot(ball.x - own.x, ball.y - own.y) < 260) { tx = (ball.x + own.x) / 2; ty = (ball.y + own.y) / 2; }
      else if (ball) { tx = ball.x; ty = ball.y; } else if (foe) { tx = foe.x; ty = foe.y; }
      if (tx != null) { const c = w._cam19 || (w._cam19 = { x: tx, y: ty }); c.x += (tx - c.x) * 0.1; c.y += (ty - c.y) * 0.1; w.camAt = c; }
      GAME.recFrame(dt);
    }, 1 / fps);
    await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', out]);
  console.log(errs.length ? 'page errors:\n' + errs.join('\n') : 'no page errors', '->', out);
} finally {
  await edge.close();
  fs.rmSync(frames, { recursive: true, force: true });
}
