// Round 17 (lane tags17): the tag clips, each a staged battle (docs/clips/tags17/). Needs this worktree served
// (node tools/serve.mjs 8971 .) and playwright-core in tools/. Frame by frame, like tools/clip.mjs.
//   node tools/tags17/clips.mjs [name ...] [--port 8971]
import { openEdge, sweepProfile } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', 8971), fps = 30, W = 844, H = 390;
const outDir = path.resolve('docs/clips/tags17'); fs.mkdirSync(outDir, { recursive: true });

// Each: the battle (Blue | Red), the staging (runs once, in the page, with the sim's modules), a step hook (each
// frame), who the camera follows, the zoom and the length.
const CLIPS = {
  'wrench-repair': { blue: 'engineer,paladin', red: 'rattler', secs: 7, zoom: 2.1, follow: 'engineer', stage: `
    const e = w.units.find((u) => u.kind === 'engineer'), p = w.units.find((u) => u.kind === 'paladin'), r = w.units.find((u) => u.kind === 'rattler');
    r.x = w.W - 40; r.y = w.H - 40; r.rootT = 1e9; r.aggro = false; r.maxHp = r.hp = 1e6; r.ethereal = false;
    e.x = w.W * 0.4; e.y = w.H * 0.5; p.x = e.x + 40; p.y = e.y + 70; p.hp = p.maxHp * 0.35; G.hold.push(p);
    const t = S.spawn(w, 'turret', e.x + 170, e.y - 20, { team: e.team, level: 1 }); t.summon = true; t.summonBy = e; t.fixed = true; t.hp = t.maxHp * 0.3; t.lifeT = 60;
    G.e = e; G.t = t; G.p = p;` },
  'fire-in-water': { blue: 'paladin', red: 'imp,fireSlime', secs: 6, zoom: 1.5, follow: 'imp', stage: `
    const p = w.units.find((u) => u.kind === 'paladin'); p.x = 60; p.y = 60; G.hold.push(p); p.ethereal = true;
    const cx = w.W * 0.5, cy = w.H * 0.5;
    w.hazards.push({ type: 'water', x: cx, y: cy, r: 110 });
    for (const [k, dx] of [['imp', -40], ['fireSlime', 50]]) { const u = w.units.find((o) => o.kind === k); u.x = cx + dx; u.y = cy; G.hold.push(u); u.maxHp = u.hp = 200; }` },
  'kindled': { blue: 'pyromancer', red: 'imp', secs: 6, zoom: 2.2, follow: 'imp', stage: `
    const p = w.units.find((u) => u.kind === 'pyromancer'), i = w.units.find((u) => u.kind === 'imp');
    p.x = w.W * 0.4; p.y = w.H * 0.5; i.x = w.W * 0.56; i.y = w.H * 0.5; i.maxHp = i.hp = 400; p.maxHp = p.hp = 1e5; G.hold.push(p, i); G.p = p; G.i = i; G.last = -9;`,
    each: `if (w.time - G.last > 1.2) { G.last = w.time; const a = Math.atan2(G.i.y - G.p.y, G.i.x - G.p.x); G.p.facing = a; K.shoot(w, G.p, a, { kind: 'fireball', speed: 520, r: 9, dmg: 6, st: { burn: 34 }, color: '#FF8A3D' }); }` },
  'choir-silenced': { blue: 'paladin', red: 'choirSprite,rattler*2', secs: 9, zoom: 2.1, follow: 'choirSprite', stage: `
    const p = w.units.find((u) => u.kind === 'paladin'); p.x = 60; p.y = 60; G.hold.push(p); p.ethereal = true;
    const c = w.units.find((u) => u.kind === 'choirSprite'), cx = w.W * 0.5, cy = w.H * 0.5; c.x = cx; c.y = cy; G.hold.push(c); c.aggro = true; c.maxHp = c.hp = 1e5;
    w.units.filter((u) => u.kind === 'rattler').forEach((r, i) => { r.x = cx + (i ? 80 : -80); r.y = cy + 30; G.hold.push(r); r.maxHp = 600; r.hp = 150; });
    G.c = c; G.p = p;`, each: `if (!G.hit && w.time - G.t0 > 3.2) { G.hit = true; S.addStatus(w, G.c, 'stagger', 30, G.p); }` },
  'slime-gas-and-slam': { blue: 'tower', red: 'slime,rattler', secs: 9, zoom: 1.9, follow: 'slime', stage: `
    const h = w.units.find((u) => u.kind === 'tower'), s = w.units.find((u) => u.kind === 'slime');
    h.x = w.W * 0.52; h.y = w.H * 0.5; G.hold.push(h); h.maxHp = h.hp = 1e5; s.x = w.W * 0.2; s.y = w.H * 0.5; s.maxHp = s.hp = 2000; s.aggro = true;
    w.hazards.push({ type: 'gas', x: w.W * 0.32, y: w.H * 0.5, r: 70 });
    const r = w.units.find((u) => u.kind === 'rattler'); r.x = h.x + 10; r.y = h.y + 85; r.maxHp = r.hp = 1e4; G.hold.push(r); // (on the floor inside the slam: it is hit, the slime up in its hop is not)
    G.h = h; G.s = s; G.last = -9;`,
    each: `const s = G.s, h = G.h; if (s && !s.dead && s.airborne && Math.hypot(s.x - h.x, s.y - h.y) < 120 && w.time - G.last > 1.2) { G.last = w.time; K.ABILITIES.groundPound.use(w, h, s, 1); }` },
};

if (args.includes('hush-test')) CLIPS['hush-test'] = { blue: 'paladin', red: 'ogre', secs: 1, zoom: 1.5, follow: 'ogre', stage: `
    const p = w.units.find((u) => u.kind === 'paladin'); p.x = 60; p.y = 60; G.hold.push(p); p.ethereal = true;
    const o = w.units.find((u) => u.kind === 'ogre'); o.x = w.W / 2; o.y = w.H / 2; G.hold.push(o); S.silence(w, o, 5, null);` };
const names = args.filter((a) => !a.startsWith('--') && CLIPS[a]);
const list = names.length ? names : Object.keys(CLIPS);
const edge = await openEdge();
const killEdge = () => sweepProfile(edge.prof);
process.on('uncaughtException', (e) => { console.error(e); killEdge(); process.exit(1); });
try {
  for (const name of list) {
    const C = CLIPS[name];
    const ctx = await edge.browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    for (let i = 0; ; i++) { try { if (i) await page.reload(); else await page.goto(`http://localhost:${port}/?seed=5`); await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 30000, polling: 200 }); break; } catch (e) { if (i >= 4) throw e; } }
    await page.evaluate(async ([C]) => {
      const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
      GAME.save.cheat = true;
      for (const k of C.blue.split(',')) if (GAME.save.heroes[k]) { GAME.save.heroes[k].owned = true; GAME.save.heroes[k].nodes = {}; }
      GAME.record(true); GAME.startBattle({ arena: 'crypt', a: parse(C.blue), b: parse(C.red) });
      const S = await import('./js/sim.js'), K = await import('./js/kits.js'), w = GAME.run.world, G = (window.__G = { t0: w.time, hold: [] });
      window.__S = S; window.__K = K;
      new Function('w', 'S', 'K', 'G', C.stage)(w, S, K, G);
      for (const u of G.hold) { u.hx = u.x; u.hy = u.y; }
      (await import('./js/render.js')).setZoom(C.zoom);
      window.__each = C.each ? new Function('w', 'S', 'K', 'G', C.each) : null;
    }, [C]);
    const frames = fs.mkdtempSync(path.join(outDir, '.frames-'));
    const n = Math.round(C.secs * fps);
    for (let i = 0; i < n; i++) {
      await page.evaluate(([k, dt]) => {
        const w = GAME.run && GAME.run.world; if (!w) return;
        const G = window.__G; for (const u of G.hold) if (!u.dead) { u.forcedGoal = { x: u.hx, y: u.hy }; u.target = null; }
        if (window.__each) window.__each(w, window.__S, window.__K, G);
        const u = w.units.find((o) => o.kind === k && !o.dead); if (u) { const c = w._cam || (w._cam = { x: u.x, y: u.y }); c.x += (u.x - c.x) * 0.12; c.y += (u.y - c.y) * 0.12; w.camAt = c; }
        GAME.recFrame(dt);
      }, [C.follow, 1 / fps]);
      await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
    }
    const out = path.join(outDir, name + '.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', out]);
    fs.rmSync(frames, { recursive: true, force: true });
    const facts = await page.evaluate(() => { const G = window.__G || {}, w = GAME.run && GAME.run.world; return JSON.stringify({ repairs: G.e && G.e.repairs, turret: G.t && Math.round(G.t.hp) + '/' + Math.round(G.t.maxHp), paladin: G.p && Math.round(G.p.hp) + '/' + Math.round(G.p.maxHp), slime: G.s && Math.round(G.s.hp), roots: (G.hold || []).map((u) => u.kind + ':' + (u.rootT || 0).toFixed(2) + ':' + (u._rootFade || 0).toFixed(2)).join(' '), time: w && w.time.toFixed(1) }); });
    console.log(name, '->', out, errors.length ? 'page errors: ' + errors.join(' | ') : 'no page errors', facts);
    await ctx.close();
  }
} finally { await edge.close(); }
process.exit(0);
