// Screenshots of the camp screens at phone size, through the installed Edge (headless), plus a quick run to the
// result screen. Needs the dev server running and playwright-core in tools/node_modules.
//   node tools/camp-shots.mjs <outDir> [--port 8822] [--w 390 --h 844]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'camp-shots');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8822), W = +opt('w', 390), H = +opt('h', 844);
fs.mkdirSync(out, { recursive: true });

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await wait(450); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
const tap = async (sel) => { await page.click(sel, { force: true, timeout: 5000 }); await wait(120); };

await page.goto(`http://localhost:${site}/?seed=5`);
await page.waitForFunction(() => window.GAME && GAME.state === 'camp');
await shot('01-camp-fresh');
// a save with some progress: gold, gems, a second seat, a resting hero, potions, trinkets
await page.evaluate(() => {
  const s = GAME.save;
  s.gold = 1240; s.gems = 5; s.slots = 3; s.potions = 2; s.runs = 6; s.wins = 1;
  s.party = ['paladin', 'archer']; s.heroes.cleric.owned = true;
  s.heroes.twinfang.recoverUntil = Date.now() + 7 * 60e3;
  s.heroes.paladin.feat = true; s.heroes.paladin.best = 9; s.heroes.paladin.nodes = { shieldBash2: 1, might: 2, guard1: 1 };
  s.trinkets = ['frostRing', 'swiftBoots']; s.heroes.archer.trinkets = ['ironSkin'];
  s.dungeons = { crypt: { best: 3, cleared: 1 }, drains: { best: 2, cleared: 0 } };
  GAME.cheat({});
});
await shot('02-camp');
await tap('[data-act="potion:paladin"]');
await tap('[data-act="mercs"]');
await page.evaluate(() => { document.getElementById('campMain').scrollTop = 0; });
await shot('03-camp-mercs-potion');
await page.evaluate(() => { document.getElementById('campMain').scrollTop = 9999; });
await shot('04-camp-bottom');
await tap('[data-act="slot:2"]');
await shot('05-party-sheet');
await tap('[data-act="closesheet"]');
await tap('[data-act="tab:heroes"]');
await shot('06-roster');
await tap('[data-act="hero:paladin"]');
await shot('07-hero-top');
await page.evaluate(() => { document.getElementById('campMain').scrollTop = 900; });
await shot('08-hero-kit');
await page.evaluate(() => { document.querySelector('.tree-card').scrollIntoView({ block: 'start' }); });
await shot('09-hero-tree');
await tap('[data-node="shieldBash3"]');
await shot('10-node-sheet');
await tap('[data-act^="buynode"]');
await shot('11-node-bought');
await tap('[data-act="closesheet"]');
await tap('[data-act="back"]');
await tap('[data-act="hero:storm"]');
await shot('12-hero-locked');
await tap('[data-act="tab:shop"]');
await shot('13-shop');
await page.evaluate(() => { document.getElementById('campMain').scrollTop = 9999; });
await shot('14-shop-bottom');
await tap('[data-act="tab:camp"]');
await tap('[data-act="setout"]');
await shot('15-dungeon-pick');
// go in, run it out quickly, and show the result
await page.evaluate(() => GAME.record(true));
await tap('[data-act^="enter:"] >> nth=0');
await page.evaluate(() => { for (let i = 0; i < 40; i++) GAME.recFrame(1 / 30); });
await shot('16-run');
await page.evaluate(() => GAME.fastForward(900));
await page.evaluate(() => { const r = GAME.run; if (!r.summary) { GAME.run.leaving = true; GAME.fastForward(300); } GAME.endRun(GAME.run.phase === 'won' || GAME.run.phase === 'lost' ? GAME.run.phase : 'retreated'); });
await wait(1600);
await shot('17-result');
const rep = await page.evaluate(() => GAME.lastReport);
console.log('report', JSON.stringify(rep));
await tap('[data-act="home"]');
await shot('18-camp-after');
await browser.close(); edge.kill(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no page errors');
