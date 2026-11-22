// Stills of battle mode at phone size, through the installed Edge (headless): the camp with the sparring ring, the
// setup page (empty, the picker, two sides filled), a battle under way, paused on a unit, and the result card.
//   node tools/battle-shots.mjs <outDir> [--port 8876] [--seed 4] [--w 390 --h 844] [--fresh] (a new save: only the heroes you start with)
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'battle-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8876), seed = +opt('seed', 4), W = +opt('w', 390), H = +opt('h', 844), fresh = args.includes('--fresh');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errors.push('missing: ' + r.url()); });
  const shot = async (name, ms = 450) => { await page.waitForTimeout(ms); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
  const tap = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) throw new Error('nothing matches ' + s); e.click(); }, sel);
  await page.goto(`http://localhost:${site}/?seed=${seed}`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  if (!fresh) await page.evaluate(() => {
    const s = GAME.save;
    for (const id of ['paladin', 'tower', 'archer', 'necromancer', 'pyromancer', 'cleric']) { const h = s.heroes[id]; h.owned = true; h.level = 8; }
    s.heroes.necromancer.nodes = { raiseDead1: 1, raiseDead2: 1, lifeDrain1: 1 }; s.heroes.paladin.nodes = { shieldBash1: 1, guard1: 1 }; s.heroes.tower.nodes = { charge1: 1, groundPound1: 1 };
    for (const d of ['wildwood', 'warren', 'sewers', 'crypt']) s.dungeons[d] = { best: 3, cleared: 1, checkpoint: 3, minis: [true, true] };
    GAME.cheat({});
  });
  await shot('01-camp-ring', 900);
  await page.evaluate(() => GAME.openBattle());
  await shot('02-setup-empty');
  await tap('[data-b="add:b"]');
  await shot('03-picker-heroes');
  await tap('[data-b="tab:crypt"]');
  await shot('04-picker-crypt');
  const lockedTab = await page.evaluate(() => { const t = document.querySelector('.bp-tabs .locked'); if (t) { t.click(); return true; } return false; });
  if (lockedTab) await shot('05-picker-locked');
  if (!fresh) {
    await tap('[data-b="tab:crypt"]');
    for (let i = 0; i < 10; i++) await tap('[data-b="pick:rattler"]');
    await tap('[data-b="pick:gaper"]');
    await tap('[data-b="tab:heroes"]'); await tap('[data-b="pick:necromancer"]');
    await tap('[data-b="done"]');
    await tap('[data-b="add:a"]'); await tap('[data-b="pick:paladin"]'); await tap('[data-b="pick:tower"]'); await tap('[data-b="done"]');
    await tap('[data-b="tag:b:1"]');
    await tap('[data-b="tag:a:0"]'); await tap('[data-b="tag:a:0"]'); await tap('[data-b="tag:a:0"]'); // the Paladin to tier 2
    await tap('[data-b="add:a"]'); await tap('[data-b="astier:3"]'); await shot('05b-picker-add-at'); await tap('[data-b="pick:paladin"]'); await tap('[data-b="done"]');
    await shot('06-setup-filled');
    await tap('[data-b="fight"]');
    await page.waitForFunction(() => GAME.state === 'run' && GAME.run && GAME.run.mode === 'battle');
    await shot('07-battle-start', 900);
    await page.evaluate(() => GAME.fastForward(5));
    await shot('08-battle-mid', 700);
    await page.evaluate(() => GAME.pause(true, 'paladin'));
    await shot('09-battle-paused', 500);
    await page.evaluate(() => { GAME.pause(false); GAME.fastForward(300); });
    await page.waitForFunction(() => GAME.state === 'result', null, { timeout: 30000 });
    await shot('10-result', 900);
    const fit = await page.evaluate(() => { const b = document.querySelector('.r-foot .btn').getBoundingClientRect(); return { btnBottom: b.bottom, h: innerHeight }; });
    if (fit.btnBottom > fit.h + 1) errors.push('result: the buttons are off screen');
    await tap('[data-br="again"]');
    await page.waitForFunction(() => GAME.state === 'run');
    await page.evaluate(() => GAME.fastForward(2));
    await tap('#retreatBtn');
    await page.waitForFunction(() => GAME.state === 'result', null, { timeout: 30000 });
    await shot('11-result-stopped', 600);
    await tap('[data-br="change"]');
    await shot('12-setup-again');
    await tap('[data-b="close"]');
    await page.waitForFunction(() => GAME.state === 'camp');
  }
} catch (e) { errors.push('script: ' + (e.stack || e)); }
console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no errors');
try { await browser.close(); } catch {}
try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
process.exit(errors.length ? 1 : 0);
