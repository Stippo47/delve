// Round 19, lane boulder19: film boulders and snowballs rolling on a cleared arena, close up, the camera riding with them.
//   node tools/boulder19/stage.mjs <out.mp4|out.png> [--port 8973] [--kind troll|snow] [--looks old,a,b] [--zoom 2.2]
//     [--prog dirs|push|still|turn] [--secs S] [--fps 30] [--at T (a still at T s)] [--perf] [--arena crypt] [--w 390 --h 844]
// Each look in --looks is one ball, side by side on the screen (top to bottom), all on the same path, labelled.
// The path is in screen directions (right, up ...): in portrait the room is turned, the tool turns it back.
import { openEdge } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0]), port = +opt('port', 8973), fps = +opt('fps', 30), W = +opt('w', 390), H = +opt('h', 844);
const kind = opt('kind', 'troll'), looks = opt('looks', 'old,a,b').split(','), zoom = +opt('zoom', 2.2), prog = opt('prog', 'dirs');
const still = args[0].endsWith('.png'), at = +opt('at', 1), perf = args.includes('--perf');
const LABEL = { old: 'Before', a: 'A: turning picture', b: 'B: rolling texture' };
// the program: segments in screen directions; speed in room units a second
const DIR = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1], upright: [0.7071, -0.7071], downleft: [-0.7071, 0.7071], downright: [0.7071, 0.7071], upleft: [-0.7071, -0.7071] };
const PROGS = {
  dirs: [['wait', 0.6], ['right', 330, 260], ['wait', 0.3], ['left', 330, 260], ['wait', 0.3], ['up', 330, 260], ['wait', 0.3], ['down', 330, 260], ['wait', 0.3],
    ['upright', 330, 260], ['wait', 0.3], ['downleft', 330, 260], ['wait', 0.3], ['turn', 1, 130, 230], ['wait', 0.5]],
  turn: [['wait', 0.4], ['turn', 1, 130, 230], ['turn', -1, 130, 230], ['wait', 0.4]],
  push: [['wait', 0.5], ['right', 140, 46], ['up', 90, 46], ['left', 140, 46], ['wait', 0.5]],
  still: [['wait', 2]],
  fast: [['wait', 0.4], ['right', 420, 340], ['wait', 0.2], ['up', 420, 340], ['wait', 0.4]],
  slow: [['wait', 0.3], ['up', 160, 80], ['wait', 0.3], ['right', 160, 80], ['wait', 0.3]],
};
const P = PROGS[prog];
// screen offset (sx, sy) at time t, by walking the program
function place(t) {
  let x = 0, y = 0, hd = 0; // hd: heading (screen angle) for the turns
  for (const seg of P) {
    if (seg[0] === 'wait') { if (t < seg[1]) return [x, y]; t -= seg[1]; continue; }
    if (seg[0] === 'turn') { // a full circle, curving one way (+1 right, -1 left), radius, speed
      const [, side, R, sp] = seg, len = 2 * Math.PI * R, d = Math.min(t, len / sp) * sp, a = d / R * side;
      const cx = x - Math.sin(hd) * R * side, cy = y + Math.cos(hd) * R * side; // the circle's middle, to the heading's side
      const px = cx + Math.sin(hd + a) * R * side, py = cy - Math.cos(hd + a) * R * side;
      if (t < len / sp) return [px, py]; t -= len / sp; x = px; y = py; continue;
    }
    const [dir, dist, sp] = seg, [ux, uy] = DIR[dir], T = dist / sp;
    hd = Math.atan2(uy, ux);
    if (t < T) return [x + ux * sp * t, y + uy * sp * t];
    x += ux * dist; y += uy * dist; t -= T;
  }
  return [x, y];
}
const total = P.reduce((s, seg) => s + (seg[0] === 'wait' ? seg[1] : seg[0] === 'turn' ? 2 * Math.PI * seg[2] / seg[3] : seg[1] / seg[2]), 0);
const secs = +opt('secs', still ? at + 0.05 : total);

const edge = await openEdge({ port: 9700 + (port % 50) });
const frames = still ? null : fs.mkdtempSync(path.join(path.dirname(out), '.frames-'));
try {
  const page = await (await edge.browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  const q = opt('q', '');
  await page.goto(`http://localhost:${port}/?seed=4${q ? '&' + q : ''}`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000, polling: 200 });
  await page.evaluate(async ([kind, looks, zoom, arena, grow, hurt]) => {
    const R = await import('./js/render.js'), B = await import('./js/boulder-roll.js');
    await B.loadBoulderArt('troll-boulder'); await B.loadBoulderArt('yeti-snowball');
    GAME.save.cheat = true;
    GAME.startBattle({ arena, a: [{ k: 'paladin', n: 1, rank: 0 }], b: [{ k: kind === 'snow' ? 'yeti' : 'troll', n: 1, rank: 0 }], size: 'l' });
    GAME.record(true);
    const w = GAME.run.world;
    w.units.length = 0; w.pillars.length = 0; for (let i = w.walls.length - 1; i >= 0; i--) if (w.walls[i].prop) w.walls.splice(i, 1); /* (the grid's crates) */ w.hazards.length = 0; w.telegraphs.length = 0; GAME.run.fade = 0; // (no steps run here: the fade-in would stay)
    const r = kind === 'snow' ? 34 : 41;
    w._st = { balls: looks.map((lk) => kind === 'snow' ? { x: 0, y: 0, r, snowball: true, roll: 0, rollA: 0, hp: 10, maxHp: 10, team: 'enemy', look19: lk } : { x: 0, y: 0, r, prop: 'troll-boulder', boulder: true, team: 'enemy', vx: 0, vy: 0, look19: lk }) };
    w.pillars.push(...w._st.balls);
    R.view.zoom = zoom;
    window.__st = { R, B, w, grow, hurt };
  }, [kind, looks, zoom, opt('arena', kind === 'snow' ? 'frost' : 'crypt'), args.includes('--grow'), opt('hurt', null) == null ? null : +opt('hurt')]);
  // one frame: the program's place, each ball in its row; the camera rides on the group
  const frame = (t, dt) => page.evaluate(([t, dt, off, LABEL]) => {
    const { R, B, w } = window.__st, v = R.view, [sx, sy] = off, n = w._st.balls.length, gap = w._st.balls[0].r * 2.9;
    const toW = (ax, ay) => (v.rot || window.innerHeight > window.innerWidth ? [-ay, ax] : [ax, ay]); // screen offset -> room offset (portrait: the room's +x is the screen's up)
    const mx = w.W / 2, my = w.H / 2;
    w._st.balls.forEach((b, i) => {
      const [ox, oy] = toW(sx, sy + (i - (n - 1) / 2) * gap), nx = mx + ox, ny = my + oy;
      const st = Math.hypot(nx - b.x, ny - b.y); if (b.snowball && st > 0.01 && b.x) { b.roll += st / b.r; b.rollA = Math.atan2(ny - b.y, nx - b.x); } // (what the sim does: foes10.js)
      b.x = nx; b.y = ny;
      if (window.__st.grow && b.snowball) b.r = Math.min(34, 6 + t * 9); if (window.__st.hurt != null) b.hp = b.maxHp * (1 - window.__st.hurt);
    });
    const [cx, cy] = toW(sx, sy); w.camAt = { x: mx + cx, y: my + cy };
    w.time += dt; R.snapCamera(); const t0 = performance.now(); GAME.recFrame(0); const st = window.__st; st.ft = (st.ft || 0) + performance.now() - t0; st.fn = (st.fn || 0) + 1;
    // labels, beside each ball, on the screen
    const cv = document.querySelector('canvas'), g = cv.getContext('2d'), d = v.dpr, m = v.m;
    g.save(); g.setTransform(d, 0, 0, d, 0, 0); g.font = 'bold 15px system-ui, sans-serif'; g.textBaseline = 'middle';
    for (const b of w._st.balls) { const X = m[0] * b.x + m[2] * b.y + m[4], Y = m[1] * b.x + m[3] * b.y + m[5], r = b.r * v.scale;
      const tx = Math.min(v.cw - 8 - g.measureText(LABEL[b.look19]).width, X + r + 10); g.lineWidth = 4; g.strokeStyle = 'rgba(20,16,30,0.85)'; g.strokeText(LABEL[b.look19], tx, Y - r - 6); g.fillStyle = '#FFF4DC'; g.fillText(LABEL[b.look19], tx, Y - r - 6); }
    g.restore();
  }, [t, dt, place(t), LABEL]);
  // warm up: the props' pictures and the rolled pictures are made the first time a size is asked for
  for (let i = 0; i < 8; i++) { await frame(0, 0); await page.waitForTimeout(150); }
  if (perf) {
    await page.evaluate(() => { const B = window.__st.B; B.PERF19.ms = 0; B.PERF19.n = 0; B.PERF19.px = 0; window.__st.ft = 0; window.__st.fn = 0; });
    let tot = 0; const N = Math.round(total * 30);
    for (let i = 0; i < N; i++) { const t0 = await page.evaluate(() => performance.now()); await frame(i / 30, 1 / 30); tot += (await page.evaluate(() => performance.now())) - t0; }
    const r = await page.evaluate(() => { const P = window.__st.B.PERF19; return { ms: P.ms, n: P.n, px: P.px, ft: window.__st.ft / window.__st.fn }; });
    console.log(`balls ${looks.join(',')} zoom ${zoom}: rolled pictures ${r.n}, ${(r.ms / r.n).toFixed(3)} ms each (${Math.round(r.px / r.n)} px), the game's whole draw ${r.ft.toFixed(2)} ms a frame`);
  } else if (still) {
    for (let t = 0; t < at; t += 1 / fps) await frame(t, 1 / fps);
    await frame(at, 1 / fps);
    await page.screenshot({ path: out });
  } else {
    const n = Math.round(secs * fps);
    for (let i = 0; i < n; i++) { await frame(i / fps, 1 / fps); await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) }); }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', out]);
  }
  console.log(errs.length ? 'page errors:\n' + errs.join('\n') : 'no page errors', '->', out);
} finally {
  await edge.close();
  if (frames) fs.rmSync(frames, { recursive: true, force: true });
}
