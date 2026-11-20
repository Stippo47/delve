// Screenshots of every camp screen at phone size, through the installed Edge (headless), for both camp layouts
// (round 7: the clearing and the fireside) and both skill trees (the grove and the star wheel), plus a quick run
// to the result screen. Needs the dev server running and playwright-core in tools/node_modules.
//   node tools/camp-shots.mjs <outDir> [--port 8822] [--w 390 --h 844] [--only clearing|fireside] [--no-run]
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'camp-shots');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8822), W = +opt('w', 390), H = +opt('h', 844), only = opt('only', null);
fs.mkdirSync(out, { recursive: true });

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
console.log('edge pid', edge.pid, 'debug port', port);
// a plain kill() leaves Edge running on Windows: take its whole process tree down, even when a step fails
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
const shot = async (name, ms = 450) => { await wait(ms); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
const tap = async (sel) => { await page.click(sel, { force: true, timeout: 5000 }); await wait(140); };
const scroll = (y) => page.evaluate((y) => { document.getElementById('campMain').scrollTop = y; }, y);
const scrollTo = (sel, block = 'start') => page.evaluate(([s, b]) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: b }); }, [sel, block]);
const closeSheet = () => tap('#sheet .backdrop');

await page.goto(`http://localhost:${site}/?seed=5`, { timeout: 60000 });
await page.waitForFunction(() => window.GAME && GAME.state === 'camp', null, { timeout: 60000 });
await shot('00-fresh-clearing');
await page.evaluate(() => GAME.cheat({ campLayout: 'fireside' }));
await shot('00-fresh-fireside');

// a save with some progress: gold, gems, a third seat, a resting hero, potions, trinkets
const setup = (layout, tree) => page.evaluate(([layout, tree]) => {
  const s = GAME.save;
  s.gold = 1240; s.gems = 5; s.slots = 3; s.potions = 2; s.elixirs = { haste: 1, ironskin: 2, fireproof: 1 }; s.runs = 6; s.wins = 1;
  s.party = ['paladin', 'archer']; s.heroes.cleric.owned = true; s.heroes.tower.owned = true;
  s.heroes.twinfang.recoverUntil = Date.now() + 2 * 60e3 + 20e3;
  s.heroes.paladin.feat = true; s.heroes.paladin.best = 9; s.heroes.paladin.nodes = { shieldBash1: 1, shieldBash2: 1, might: 2, guard1: 1 };
  s.heroes.archer.nodes = { barrage1: 1 };
  s.trinkets = ['frostRing', 'swiftBoots']; s.heroes.archer.trinkets = ['ironSkin']; s.tlv = { ironSkin: 2 };
  s.dungeons = { crypt: { best: 3, cleared: 1 }, sewers: { best: 2, cleared: 0 } }; s.mercs = false;
  s.seen = { rat: { met: 9, beaten: 9 }, rattler: { met: 12, beaten: 11 }, rattlerBow: { met: 4, beaten: 4 }, ghost: { met: 2, beaten: 2 }, graveWarden: { met: 1, beaten: 1 }, slime: { met: 3, beaten: 3 }, goblin: { met: 8, beaten: 8 } };
  GAME.cheat({ campLayout: layout, treeLayout: tree });
}, [layout, tree]);

// ---------------------------------------------------------------- the clearing, with the grove
if (!only || only === 'clearing') {
  const L = 'A';
  await setup('clearing', 'grove');
  await shot(`${L}01-home`);
  await tap('.cseat [data-act="pack:paladin"]');
  await shot(`${L}02-pack-sheet`);
  await tap('#sheet [data-act="givep:heal"]');
  await tap('#sheet [data-act="givep:haste"]');
  await tap('#sheet [data-act="packhero:archer"]');
  await tap('#sheet [data-act="givep:ironskin"]');
  await shot(`${L}03-pack-given`);
  await tap('#sheet .sheet-foot [data-act="closesheet"]');
  await tap('[data-act="mercs"]');
  await shot(`${L}04-home-packed-hired`);
  await tap('.cseat.empty');
  await shot(`${L}05-party-sheet`);
  await closeSheet();
  await page.evaluate(() => GAME.cheat({ slots: 2, party: ['paladin', 'archer'] }));
  await tap('.cseat.locked');
  await shot(`${L}06-seat-sheet`);
  await closeSheet();
  await page.evaluate(() => GAME.cheat({ slots: 3 }));
  await tap('.place.tent');
  await shot(`${L}07-tent`);
  await tap('[data-act="hero:paladin"]');
  await shot(`${L}08-hero-top`);
  await scrollTo('.tree-sec');
  await shot(`${L}09-tree-grove`);
  await scrollTo('.grove .rootnode', 'end');
  await shot(`${L}10-tree-grove-roots`);
  await tap('[data-node="shieldBash3"]');
  await shot(`${L}11-node-sheet`);
  await tap('#sheet [data-act^="buynode"]');
  await shot(`${L}12-node-bought`);
  await closeSheet();
  await tap('[data-node="might"]');
  await shot(`${L}13-node-stat`);
  await closeSheet();
  await tap('[data-act="back"]');
  await tap('[data-act="hero:storm"]');
  await shot(`${L}14-hero-locked`);
  await scrollTo('.tree-sec');
  await shot(`${L}15-tree-locked`);
  await tap('[data-act="back"]');
  await tap('[data-act="back"]');
  await tap('.place.cart');
  await shot(`${L}16-trader`);
  await scroll(9999);
  await shot(`${L}17-trader-bottom`);
  await tap('[data-act="ware:t:ironSkin"]');
  await shot(`${L}18-ware-sheet`);
  await closeSheet();
  await tap('[data-act="back"]');
  await tap('.place.book');
  await shot(`${L}19-book`);
  await tap('[data-act="book:items"]');
  await shot(`${L}20-book-items`);
  await tap('[data-act="book:beasts"]');
  await tap('[data-act^="beast:"] >> nth=0');
  await shot(`${L}21-beast-sheet`);
  await closeSheet();
  await tap('[data-act="back"]');
  await tap('[data-act="settings"]');
  await shot(`${L}22-settings`);
  await page.evaluate(() => { document.querySelector('#sheet .panel').scrollTop = 9999; });
  await shot(`${L}23-settings-bottom`);
  await tap('#sheet .sheet-foot [data-act="closesheet"]');
  await tap('[data-act="setout"]');
  await shot(`${L}24-signpost`);
  await scroll(9999);
  await shot(`${L}25-signpost-bottom`);
  await tap('[data-act="back"]');
  // a short phone too
  await page.setViewportSize({ width: 375, height: 667 });
  await shot(`${L}26-home-se`);
  await page.setViewportSize({ width: W, height: H });
}

// ---------------------------------------------------------------- the fireside, with the star wheel
if (!only || only === 'fireside') {
  const L = 'B';
  await setup('fireside', 'wheel');
  await shot(`${L}01-home`);
  await tap('.bcard [data-act="sit:cleric"]');
  await shot(`${L}02-cleric-sits`);
  await tap('.bcard [data-act="sit:tower"]');
  await shot(`${L}03-full-toast`, 300);
  await tap('[data-act="focus:paladin"]');
  await shot(`${L}04-fan`);
  await tap('.fan [data-act="pack:paladin"]');
  await shot(`${L}05-pack-sheet`);
  await tap('#sheet [data-act="givep:heal"]');
  await tap('#sheet [data-act="givep:ironskin"]');
  await tap('#sheet .sheet-foot [data-act="closesheet"]');
  await tap('[data-act="mercs"]');
  await shot(`${L}06-home-packed-hired`);
  await page.evaluate(() => { const b = document.querySelector('.bench'); b.scrollLeft = 9999; });
  await shot(`${L}07-bench-end`);
  await page.evaluate(() => { const b = document.querySelector('.bench'); b.scrollLeft = 0; });
  await tap('.bcard [data-act="hero:paladin"]');
  await shot(`${L}08-hero-top`);
  await scrollTo('.tree-sec');
  await shot(`${L}09-tree-wheel`);
  await scrollTo('.bpanel');
  await shot(`${L}10-wheel-panel`);
  await scrollTo('.tree-sec');
  await tap('.wnode[data-node="guard2"]');
  await shot(`${L}11-wheel-turned`, 1000);
  await scrollTo('.bpanel');
  await shot(`${L}12-wheel-turned-panel`);
  await tap('.bpanel [data-act="buynode:guard2"]');
  await shot(`${L}13-wheel-bought`);
  await tap('.wtab[data-act="spin:2"]');
  await scrollTo('.tree-sec');
  await shot(`${L}14-wheel-utility`, 1000);
  await tap('[data-act="back"]');
  await tap('.bcard [data-act="hero:storm"]');
  await scrollTo('.tree-sec');
  await shot(`${L}15-wheel-locked`);
  await tap('[data-act="back"]');
  await tap('.footbar [data-act="place:shop"]');
  await shot(`${L}16-trader`);
  await tap('[data-act="back"]');
  await tap('.footbar [data-act="place:book"]');
  await shot(`${L}17-book`);
  await tap('[data-act="back"]');
  await tap('[data-act="setout"]');
  await shot(`${L}18-mountain`);
  await scroll(0);
  await shot(`${L}19-mountain-top`);
  await tap('[data-act="back"]');
  await page.setViewportSize({ width: 375, height: 667 });
  await shot(`${L}20-home-se`);
  await page.setViewportSize({ width: W, height: H });
  // the grove under the fireside and the wheel under the clearing, to show they mix
  await page.evaluate(() => GAME.cheat({ treeLayout: 'grove' }));
  await tap('.bcard [data-act="hero:archer"]');
  await scrollTo('.tree-sec');
  await shot(`${L}21-archer-grove`);
  await tap('[data-act="back"]');
}

// ---------------------------------------------------------------- go in, run it out quickly, and show the result
if (!args.includes('--no-run')) {
  await page.evaluate(() => GAME.cheat({ campLayout: 'clearing', treeLayout: 'grove' }));
  await tap('[data-act="setout"]');
  await page.evaluate(() => GAME.record(true));
  await tap('[data-act^="enter:"] >> nth=0');
  await page.evaluate(() => { for (let i = 0; i < 40; i++) GAME.recFrame(1 / 30); });
  await shot('R1-run');
  await page.evaluate(() => GAME.fastForward(900));
  await page.evaluate(() => { const r = GAME.run; if (!r.summary) { GAME.run.leaving = true; GAME.fastForward(300); } GAME.endRun(GAME.run.phase === 'won' || GAME.run.phase === 'lost' ? GAME.run.phase : 'retreated'); });
  await wait(1600);
  await shot('R2-result');
  await tap('[data-act="home"]');
  await shot('R3-camp-after');
}

await browser.close().catch(() => {});
console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no page errors');
