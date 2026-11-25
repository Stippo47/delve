// Lane drake19: record a Cinder fight frame by frame, keep the frames and a line of the fight's state per frame, so a
// move can be found by name and looked at closely. Needs this lane's server (node tools/serve.mjs 8962 .).
//   node tools/drake19/watch.mjs <outdir> [--party a,b,c,d] [--level 44] [--secs 150] [--zoom 0.8] [--seed 3] [--fps 30]
//     [--q 'bossmove=rush&bossphase=2'] [--follow] (camera on the drake) [--mp4 name.mp4]
//     [--from S] (skip S seconds of fight first) [--until] (stop when the fight ends) [--scale 2] [--port 8962]
import { openEdge, sweepProfile } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'docs/clips/drake19/watch');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', 8962), seed = +opt('seed', 3), secs = +opt('secs', 150), fps = +opt('fps', 30), W = +opt('w', 844), H = +opt('h', 390);
const q = opt('q', ''), party = opt('party', 'paladin,archer,cleric,twinfang'), level = +opt('level', 44), from = +opt('from', 0);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (/^f\d+\.(png|jpg)$/.test(f)) fs.rmSync(path.join(out, f));
const edge = await openEdge({});
const kill = () => sweepProfile(edge.prof);
setTimeout(() => { console.error('watch.mjs: took too long'); kill(); process.exit(2); }, +opt('max', 1500) * 1000).unref();
process.on('uncaughtException', (e) => { console.error(e); kill(); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error(e); kill(); process.exit(1); });
const ctx = await edge.browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: +opt('scale', 2) });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('response', (r) => { if (r.status() === 404) errors.push('404: ' + new URL(r.url()).pathname); });
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
const url = `http://localhost:${port}/?seed=${seed}&theme=ember&bossroom&boss=cinder${q ? '&' + q : ''}`;
for (let i = 0; ; i++) { try { if (i) await page.reload(); else await page.goto(url); await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 30000, polling: 200 }); break; } catch (e) { if (i >= 5) throw e; } }
await page.evaluate(async ([party, level]) => {
  const s = GAME.save, P = await import('./js/progress.js');
  s.unlocks = { ...(s.unlocks || {}), slotMini1: true, slotBoss1: true };
  for (const id of party) { s.heroes[id].owned = true; s.heroes[id].level = level; }
  s.party = party.slice();
  for (const id of party) { const h = s.heroes[id]; h.points = Math.max(0, P.START_POINTS + h.level - 1 - P.spentPoints(s, id)); P.autoSpend(s, id); }
  GAME.record(true); GAME.startRun(1);
}, [party.split(','), level]);
if (opt('zoom')) await page.evaluate(async (z) => { (await import('./js/render.js')).setZoom(+z); }, opt('zoom'));
if (opt('eval')) await page.evaluate((js) => { (0, eval)(js); }, opt('eval'));
if (from) await page.evaluate((s) => { for (let i = 0; i < s * 30; i++) GAME.recFrame(1 / 30); }, from);
const follow = args.includes('--follow'), until = args.includes('--until');
const n = Math.round(secs * fps), log = [];
let ended = 0;
for (let i = 0; i < n; i++) {
  const st = await page.evaluate(([dt, follow]) => {
    const r = GAME.run, w = r && r.world; if (!w) return null;
    const b = w.units.find((u) => u.cd && u.kind === 'cinder');
    if (follow && b && !b.dead) { const k = b.cd; let x = b.x, y = b.y; const ps = (k.parts || []).filter((p) => !p.dead).slice(0, 4); for (const p of ps) { x += p.x; y += p.y; } x /= ps.length + 1; y /= ps.length + 1;
      const c = w._cam || (w._cam = { x, y }); c.x += (x - c.x) * 0.1; c.y += (y - c.y) * 0.1; w.camAt = c; }
    GAME.recFrame(dt);
    if (!b) return { t: +w.time.toFixed(2), run: r.phase, none: true };
    const k = b.cd, R = (v) => Math.round(v), e = b.el || {};
    const mv = b.dead ? 'dead' : k.mv ? k.mv : k.br ? (k.br.t > 0 ? 'scorch-tell' : 'scorch') : k.ch ? (k.ch.t > 0 ? 'rush-tell' : 'rush') : k.ring ? 'ring' : k.roarT > 0 ? 'roar' : e.holdT > 0 ? 'hold' : k.phase ? 'prowl' : 'asleep';
    const t = b.target;
    return { t: +w.time.toFixed(2), run: r.phase, mv, sw: k.swing ? 1 : 0, ph: k.phase, hp: +(b.hp / b.maxHp).toFixed(3), x: R(b.x), y: R(b.y), f: +b.facing.toFixed(2), sp: R(Math.hypot(b.vx || 0, b.vy || 0)), spd: R(b.spd || 0),
      look: +(k.look ?? 0).toFixed(2), jaw: +(b.jaw || 0).toFixed(2), d: t ? R(Math.hypot(t.x - b.x, t.y - b.y)) : -1, tail: k.tail && !k.tail.dead ? 1 : 0, dead: !!b.dead,
      heroes: w.units.filter((u) => u.team === 'hero').map((h) => [h.kind, R(h.x), R(h.y), h.downed ? 'D' : h.dead ? 'X' : R(100 * h.hp / h.maxHp)]),
      dz: w.danger.filter((z) => z.team === b.team && !z.done && z.t > 0 && z.hit).length, W: w.W, H: w.H };
  }, [1 / fps, follow]);
  log.push(st);
  await page.screenshot({ path: path.join(out, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 82 });
  if (until && st && (st.run === 'won' || st.run === 'lost' || st.dead)) { if (++ended > fps * 4) break; }
}
await edge.close();
fs.writeFileSync(path.join(out, 'state.json'), JSON.stringify(log));
// the moves, by frame: where the state changed
let last = ''; const lines = [];
log.forEach((s, i) => { if (!s || s.none) return; const key = `${s.mv}/sw${s.sw}/ph${s.ph}`; if (key !== last) { lines.push(`f${String(i).padStart(5, '0')} t=${s.t} ${key} hp=${s.hp} d=${s.d}`); last = key; } });
fs.writeFileSync(path.join(out, 'moves.txt'), lines.join('\n') + '\n');
if (opt('mp4')) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(out, 'f%05d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', path.resolve(opt('mp4'))]);
console.log(errors.length ? 'page errors:\n' + [...new Set(errors)].join('\n') : 'no page errors', '->', path.relative(process.cwd(), out), log.length, 'frames');
