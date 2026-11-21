// Screenshots of every camp screen (UI v3) at phone size, through the installed Edge (headless), plus the result
// card. Needs the dev server running and playwright-core in tools/node_modules.
//   node tools/camp-shots.mjs <outDir> [--port 8854] [--w 390 --h 844] [--web 100] [--no-run]
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'camp-shots');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8854), W = +opt('w', 390), H = +opt('h', 844), webN = +opt('web', 100);
fs.mkdirSync(out, { recursive: true });

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { edge.kill(); } try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} };
process.on('exit', cleanup);
process.on('uncaughtException', (e) => { console.error(e); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error(e); process.exit(1); });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name, ms = 500) => { await wait(ms); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
const tap = async (sel) => { await page.click(sel, { force: true, timeout: 5000 }); await wait(160); };
const closeSheet = () => page.evaluate(() => { const b = document.querySelector('#sheet .backdrop'); if (b) b.click(); });
const scroll = (y) => page.evaluate((y) => { document.getElementById('campMain').scrollTop = y; }, y);

// a save with some progress (the round 8 contract: permanent levels, xp, skill points)
const setup = () => page.evaluate(() => {
  const s = GAME.save;
  s.gold = 1240; s.slots = 3; s.potions = 2; s.elixirs = { haste: 1, ironskin: 2, fireproof: 1 }; s.runs = 6; s.wins = 1;
  s.party = ['paladin', 'archer']; s.heroes.cleric.owned = true; s.heroes.tower.owned = true; s.heroes.twinfang.owned = true;
  const lv = { paladin: [7, 210, 3], archer: [5, 120, 1], cleric: [3, 40, 0], tower: [2, 10, 2], twinfang: [4, 60, 0] };
  for (const [id, [l, x, p]] of Object.entries(lv)) Object.assign(s.heroes[id], { level: l, xp: x, points: p });
  s.heroes.twinfang.recoverUntil = Date.now() + 2 * 60e3 + 20e3;
  s.heroes.paladin.nodes = { shieldBash1: 1, shieldBash2: 1, might: 2, guard1: 1 };
  s.heroes.archer.nodes = { barrage1: 1 };
  s.trinkets = ['frostRing', 'swiftBoots', 'frostRing']; s.heroes.paladin.trinkets = ['ironSkin']; s.tlv = { ironSkin: 2 };
  s.dungeons = { warren: { best: 3, cleared: 1 }, sewers: { best: 2, cleared: 0 } }; s.mercs = false;
  s.seen = { rat: { met: 9, beaten: 9 }, rattler: { met: 12, beaten: 11 }, rattlerBow: { met: 4, beaten: 4 }, ghost: { met: 2, beaten: 2 }, graveWarden: { met: 1, beaten: 1 }, slime: { met: 3, beaten: 3 }, goblin: { met: 8, beaten: 8 } };
  GAME.cheat({});
});

await page.goto(`http://localhost:${site}/?seed=5`, { timeout: 60000 });
await page.waitForFunction(() => window.GAME && GAME.state === 'camp', null, { timeout: 60000 });
await page.evaluate(() => { localStorage.clear(); });
await page.reload(); await page.waitForFunction(() => window.GAME && GAME.state === 'camp', null, { timeout: 60000 });
await shot('00-fresh-home');
await setup();
await shot('01-home');
await scroll(9999);
await shot('02-home-bottom');
await scroll(0);
await tap('.seat.s0 .seat-face');
await shot('03-seat-sheet');
await closeSheet();
await tap('.seat.s0 .pockets');
await tap('#sheet [data-act="givep:heal"]');
await tap('#sheet [data-act="givep:haste"]');
await shot('04-pack-sheet');
await tap('#sheet .sheet-actions [data-act="closesheet"]');
await tap('[data-act="mercs"]');
await tap('.dcard[data-theme="crypt"]');
await scroll(9999);
await shot('05-locked-dungeon');
await tap('.dcard[data-theme="warren"]');
await tap('[data-act="floor:3"]');
await scroll(9999);
await shot('06-floor-3');
await tap('[data-act="tab:heroes"]');
await shot('07-heroes');
await tap('[data-act="hero:paladin"]');
await shot('08-hero-skills', 700);
await page.evaluate(() => { const g = document.querySelector('.wn[data-n="guard2"]') || document.querySelector('.wn.open'); const r = g.getBoundingClientRect(); window.__tapAt = [r.left + r.width / 2, r.top + r.height / 2]; });
const at = await page.evaluate(() => window.__tapAt);
await page.mouse.click(at[0], at[1]);
await shot('09-hero-node', 700);
await tap('.web-panel [data-learn]');
await shot('10-hero-learned', 600);
await tap('[data-act="sub:gear"]');
await shot('11-hero-gear');
await tap('[data-act="sub:about"]');
await shot('12-hero-about');
await tap('[data-act="back"]');
await tap('[data-act="hero:storm"]');
await shot('13-hero-locked');
await tap('[data-act="sub:skills"]');
await shot('14-hero-locked-skills', 700);
await tap('[data-act="tab:trader"]');
await shot('15-trader');
await tap('[data-act="ware:t:ironSkin"]');
await shot('16-ware-sheet');
await closeSheet();
await tap('[data-act="shop:pots"]');
await shot('17-trader-potions');
await tap('[data-act="tab:book"]');
await shot('18-book');
await tap('[data-act^="beast:"] >> nth=1');
await shot('19-beast-sheet');
await closeSheet();
await tap('[data-act="booktab:items"]');
await shot('20-book-items');
await tap('[data-act="tab:settings"]');
await shot('21-settings');
await scroll(9999);
await shot('22-settings-bottom');
await tap('[data-act="tab:camp"]');

// the result card, from a made-up report in the round 8 shape
await page.evaluate(async () => {
  const m = await import('./js/camp.js');
  document.getElementById('camp').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  m.showResult({ result: 'retreated', gold: 312, raw: 390, leaveCut: 78, theme: 'sewers', floor: 2, rooms: 10, kills: 64, checkpoint: 2,
    heroes: [{ id: 'paladin', from: 6, level: 7, xp: 210, points: 1 }, { id: 'archer', from: 4, level: 5, xp: 120, points: 1, hurt: true }], found: [] }, () => {});
});
await shot('23-result-left', 1500);
await page.evaluate(async () => {
  const m = await import('./js/camp.js');
  m.showResult({ result: 'won', gold: 940, raw: 940, theme: 'warren', floor: 3, rooms: 21, kills: 188, slotUnlocked: true, opened: 'sewers',
    heroes: [{ id: 'paladin', from: 5, level: 7, xp: 30, points: 2 }, { id: 'archer', from: 5, level: 6, xp: 300, points: 1 }, { id: 'cleric', from: 3, level: 3, xp: 80, points: 0, downed: true }], found: [] }, () => {});
});
await shot('24-result-won', 1500);

// the web at the size the designer wants (?web=N makes up an N-node web)
if (webN) {
  await page.goto(`http://localhost:${site}/?seed=5&web=${webN}`);
  await page.waitForFunction(() => window.GAME && GAME.state === 'camp', null, { timeout: 60000 });
  await page.evaluate(() => { const s = GAME.save; s.heroes.paladin.points = 6; s.heroes.paladin.nodes = { d0_0: 1, d0_1: 2, d1_0: 1, shieldBash1: 1, d0_11: 1 }; GAME.cheat({}); });
  await tap('[data-act="tab:heroes"]');
  await tap('[data-act="hero:paladin"]');
  await shot('25-web-100', 700);
  await page.evaluate(() => { const svg = document.querySelector('svg.web'); const r = svg.getBoundingClientRect(); svg.dispatchEvent(new WheelEvent('wheel', { deltaY: 500, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true })); });
  await shot('26-web-100-zoomed-out', 500);
}

await browser.close().catch(() => {});
console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no page errors');
