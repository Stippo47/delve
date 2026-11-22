// Stills (and a few short films) of the Book at phone size, through the installed Edge (headless): each tab, a hero at
// every tier, a monster at each rank, statuses and items, and previews caught mid-play.
//   node tools/book-shots.mjs <outDir> [--port 8884] [--w 390 --h 844] [--clips] [--only name,name]
// Needs the dev server (python -m http.server <port>) and playwright-core in tools/node_modules. --clips also films a
// few previews frame by frame (stepped, so they play smoothly) into <outDir>/*.mp4 with ffmpeg.
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'book-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8884), W = +opt('w', 390), H = +opt('h', 844), clips = args.includes('--clips');
const only = (opt('only', '') || '').split(',').filter(Boolean);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
console.log('edge pid', edge.pid);
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errors.push('missing: ' + r.url()); });
  const want = (name) => !only.length || only.some((o) => name.includes(o));
  // set the Book, let it settle, then step the preview a fixed time (stopped, so the moment is the same every run)
  const pose = async (name, set, secs) => {
    if (!want(name)) return;
    await page.evaluate((s) => BOOK.set(s), set);
    await page.waitForTimeout(700); // art arrives
    await page.evaluate((s) => { BOOK.player.restart(); BOOK.player.stop(); BOOK.player.advance(s); }, secs);
    await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name);
  };
  await page.goto(`http://localhost:${site}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => {
    const s = GAME.save;
    for (const id of ['paladin', 'archer', 'necromancer', 'storm']) { s.heroes[id].owned = true; s.heroes[id].level = 6; }
    s.seen = s.seen || {};
    for (const k of ['rat', 'slime', 'wolf', 'direWolf', 'goblin', 'orcShaman', 'bandit', 'ent', 'elderEnt', 'rattler', 'rattlerBow', 'gaper', 'ghost', 'sproutling', 'alpha']) s.seen[k] = { met: 3, beaten: 2 };
    s.trinkets = ['thunderRing', 'phoenixFeather']; s.potions = { heal: 2 };
  });
  await page.evaluate(() => CAMP.setMode('book'));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, '00-open.png') }); console.log('shot 00-open');
  await pose('01-hero-attack', { tab: 'heroes', hero: 'paladin', tier: 3, hmove: 'attack' }, 1.2);
  await pose('02-hero-ability-t0-locked', { tab: 'heroes', hero: 'archer', tier: 0, hmove: 'barrage' }, 1);
  await pose('03-hero-ability-t1', { tab: 'heroes', hero: 'archer', tier: 1, hmove: 'barrage' }, 0.9);
  await pose('04-hero-ability-t3', { tab: 'heroes', hero: 'archer', tier: 3, hmove: 'barrage' }, 0.9);
  await pose('05-hero-chain-t1', { tab: 'heroes', hero: 'storm', tier: 1, hmove: 'chainLightning' }, 0.75);
  await pose('06-hero-chain-t3', { tab: 'heroes', hero: 'storm', tier: 3, hmove: 'chainLightning' }, 0.75);
  await pose('07-hero-raise-t3', { tab: 'heroes', hero: 'necromancer', tier: 3, hmove: 'raiseDead' }, 1.8);
  await pose('08-hero-trait', { tab: 'heroes', hero: 'paladin', tier: 2, hmove: 'trait' }, 2);
  await pose('09-monsters-normal', { tab: 'monsters', foe: 'orcShaman', rank: 0, fmove: 'kit' }, 2.5);
  await pose('10-monsters-elite', { tab: 'monsters', foe: 'orcShaman', rank: 1, fmove: 'elite' }, 2.5);
  await pose('11-monsters-major', { tab: 'monsters', foe: 'wolf', rank: 2, fmove: 'major' }, 3);
  await pose('12-monsters-boss', { tab: 'monsters', foe: 'elderEnt', rank: 0, fmove: 'kit' }, 4);
  await pose('13-status-burn', { tab: 'statuses', status: 'burn' }, 1.6);
  await pose('14-status-frozen', { tab: 'statuses', status: 'frozen' }, 2.6);
  await pose('15-status-radiant', { tab: 'statuses', status: 'radiant' }, 2.8);
  await pose('16-trinket-thunder', { tab: 'items', item: { k: 't', id: 'thunderRing' } }, 3.6);
  await pose('17-trinket-phoenix', { tab: 'items', item: { k: 't', id: 'phoenixFeather' } }, 2.4);
  await pose('18-potion-haste', { tab: 'items', item: { k: 'p', id: 'haste' } }, 1.5);
  // the page scrolled down (a hero's lower moves, opened)
  if (want('19-hero-scrolled')) {
    await page.evaluate(() => BOOK.set({ tab: 'heroes', hero: 'necromancer', tier: 2, hmove: 'lifeDrain' }));
    await page.waitForTimeout(600);
    await page.evaluate(() => { const p = document.querySelector('.bk-page'); p.scrollTop = p.scrollHeight; });
    await page.screenshot({ path: path.join(out, '19-hero-scrolled.png') }); console.log('shot 19-hero-scrolled');
  }
  // layout checks: nothing runs off the side, the tabs are on screen
  const fit = await page.evaluate(() => {
    const bad = [];
    for (const e of document.querySelectorAll('#book *')) { const r = e.getBoundingClientRect(); if (r.width && r.right > innerWidth + 1 && !e.closest('.bk-shelf')) bad.push(e.className || e.tagName); }
    const t = document.querySelector('.bk-tabs').getBoundingClientRect();
    return { bad: [...new Set(bad)].slice(0, 8), tabsBottom: t.bottom, h: innerHeight, stage: document.querySelector('.bk-stage').getBoundingClientRect().height };
  });
  if (fit.bad.length) errors.push('runs off the side: ' + fit.bad.join(', '));
  if (fit.tabsBottom > fit.h + 1) errors.push('the tabs are off screen');
  console.log('stage height', fit.stage);
  // what a frame costs (a step and a draw), on a hero, a big monster and a status
  for (const set of [{ tab: 'heroes', hero: 'necromancer', tier: 3, hmove: 'raiseDead' }, { tab: 'monsters', foe: 'elderEnt', rank: 0, fmove: 'kit' }, { tab: 'statuses', status: 'burn' }]) {
    await page.evaluate((s) => BOOK.set(s), set); await page.waitForTimeout(600);
    const ms = await page.evaluate(() => { BOOK.player.stop(); const t0 = performance.now(); for (let i = 0; i < 120; i++) BOOK.player.advance(1 / 60, 1 / 60); return (performance.now() - t0) / 120; });
    console.log('frame ms', JSON.stringify(set), ms.toFixed(2));
  }
  // films: stepped frame by frame
  if (clips) {
    const film = async (name, set, secs, fps = 30) => {
      if (!want(name)) return;
      await page.evaluate((s) => BOOK.set(s), set); await page.waitForTimeout(800);
      await page.evaluate(() => { BOOK.player.restart(); BOOK.player.stop(); });
      const dir = fs.mkdtempSync(path.join(out, '.f-'));
      const box = await page.evaluate(() => { const r = document.querySelector('.bk-stage').getBoundingClientRect(); return { x: 0, y: 0, width: innerWidth, height: Math.ceil(r.bottom + 260) }; });
      for (let i = 0; i < Math.round(secs * fps); i++) {
        await page.evaluate((dt) => BOOK.player.advance(dt, dt), 1 / fps);
        await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`), clip: box });
      }
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', path.join(out, name + '.mp4')]);
      fs.rmSync(dir, { recursive: true, force: true }); console.log('film', name);
    };
    await film('clip-storm-chain-t1', { tab: 'heroes', hero: 'storm', tier: 1, hmove: 'chainLightning' }, 3.4);
    await film('clip-storm-chain-t3', { tab: 'heroes', hero: 'storm', tier: 3, hmove: 'chainLightning' }, 3.4);
    await film('clip-orcshaman-elite', { tab: 'monsters', foe: 'orcShaman', rank: 1, fmove: 'elite' }, 6.5);
    await film('clip-status-chill', { tab: 'statuses', status: 'frozen' }, 6);
  }
} catch (e) { errors.push('script: ' + (e.stack || e)); }
console.log(errors.length ? 'ERRORS\n' + [...new Set(errors)].join('\n') : 'no errors');
try { await browser.close(); } catch {}
try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
