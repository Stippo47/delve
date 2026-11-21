// Screenshots of every camp state (round 9: the camp ground, the fire, the trail map, hero zoom, trader, book,
// settings) at phone size, through the installed Edge (headless), plus the result card; and two short clips: the camp
// alive (with the zoom to the fire) and the map scrolling. Needs the dev server running and playwright-core in
// tools/node_modules; ffmpeg on the path for the clips.
//   node tools/camp-shots.mjs <outDir> [--port 8854] [--w 390 --h 844] [--no-clips] [--no-run]
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const out = path.resolve(args[0] || 'camp-shots');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8854), W = +opt('w', 390), H = +opt('h', 844);
const clips = !args.includes('--no-clips'), runIt = !args.includes('--no-run');
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
const shot = async (name, ms = 600) => { await wait(ms); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
const tap = async (sel) => { await page.click(sel, { force: true, timeout: 5000 }); await wait(180); };
const closeSheet = () => page.evaluate(() => { const b = document.querySelector('#sheet .backdrop'); if (b) b.click(); });
const where = (t) => page.evaluate((t) => CAMP.scene.screenOf(t), t);
const tapAt = async (p) => { await page.mouse.click(p.x, p.y); await wait(200); };
const tapScene = async (t) => tapAt(await where(t));
const scrollPanel = (y) => page.evaluate((y) => { const b = document.querySelector('#campPanel .pp-body'); if (b) b.scrollTop = y; }, y);

// a save with some progress (round 8's contract: permanent levels, xp, skill points)
const setup = () => page.evaluate(() => {
  const s = GAME.save;
  s.gold = 1240; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: false }; s.potions = 2; s.elixirs = { haste: 1, ironskin: 2, fireproof: 1 }; s.runs = 6; s.wins = 1;
  s.party = ['paladin', 'archer'];
  for (const id of ['cleric', 'tower', 'twinfang', 'pyromancer', 'druid', 'bard']) s.heroes[id].owned = true;
  const lv = { paladin: [7, 210, 3], archer: [5, 120, 1], cleric: [3, 40, 0], tower: [2, 10, 2], twinfang: [4, 60, 0], pyromancer: [3, 20, 0], druid: [2, 30, 1], bard: [1, 0, 1] };
  for (const [id, [l, x, p]] of Object.entries(lv)) Object.assign(s.heroes[id], { level: l, xp: x, points: p });
  s.heroes.twinfang.recoverUntil = Date.now() + 2 * 60e3 + 20e3;
  s.heroes.paladin.nodes = { shieldBash1: 1, shieldBashCd: 2, shieldBash2: 1, guard1: 1, offence0: 2 };
  s.heroes.archer.nodes = { barrage1: 1 };
  s.trinkets = ['frostRing', 'swiftBoots', 'frostRing']; s.heroes.paladin.trinkets = ['ironSkin']; s.tlv = { ironSkin: 2 };
  s.dungeons = { warren: { best: 3, cleared: 1, checkpoint: 3, minis: [true, true] }, sewers: { best: 2, cleared: 0, checkpoint: 2, minis: [true, false] } }; s.mercs = false;
  s.seen = { rat: { met: 9, beaten: 9 }, rattler: { met: 12, beaten: 11 }, rattlerBow: { met: 4, beaten: 4 }, ghost: { met: 2, beaten: 2 }, graveWarden: { met: 1, beaten: 1 }, slime: { met: 3, beaten: 3 }, goblin: { met: 8, beaten: 8 } };
  s.gems = 7; // another lane restores the count (BUILD-v5); the camp shows it when it's there
  GAME.cheat({});
});
// let the wanderers walk for a few seconds before a still, so they're spread about
const settle = (secs = 3) => page.evaluate((n) => { CAMP.scene.record(true); for (let i = 0; i < n; i++) CAMP.scene.advance(1 / 30); CAMP.scene.record(false); }, secs * 30);

async function clip(name, frames, each) {
  const dir = fs.mkdtempSync(path.join(out, '.frames-'));
  await page.evaluate(() => CAMP.scene.record(true));
  for (let i = 0; i < frames; i++) {
    await page.evaluate(([i]) => { window.__f = i; }, [i]);
    if (each) await each(i);
    await page.evaluate(() => CAMP.scene.advance(1 / 30));
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) });
  }
  await page.evaluate(() => CAMP.scene.record(false));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(dir, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', path.join(out, name + '.mp4')]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('clip', name);
}

await page.goto(`http://localhost:${site}/?seed=5`, { timeout: 60000 });
await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000 });
await page.evaluate(() => { localStorage.clear(); });
await page.reload(); await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000 });
await shot('00-fresh-ground', 1200);
await setup();
await settle(4);
await shot('01-ground', 900);

// the fire: the party pick
await tapScene('fire');
await shot('02-fire', 900);
await tap('[data-act="pickh:cleric"]');
await shot('03-fire-picked', 500);
await tapScene({ seat: 2 });
await wait(1600);
await shot('04-fire-seated', 300);
await tap('[data-act="pickh:tower"]');
await tapScene({ seat: 0 }); // swaps the paladin out
await wait(1600);
await shot('05-fire-swapped', 300);
await tapScene({ seat: 3 });
await shot('06-fire-locked-seat', 300);
await tap('[data-act="pack"]');
await tap('#sheet [data-act="givep:heal"]');
await tap('#sheet [data-act="givep:haste"]');
await shot('07-potions');
await tap('#sheet .sheet-actions [data-act="closesheet"]');
await scrollPanel(9999);
await shot('08-fire-list-bottom', 400);

// Delve in the flames: the trail map
await tapScene('fire');
await shot('09-map', 900);
await page.evaluate(() => CAMP.map.scrollTo(0));
await shot('10-map-clearing', 400);
await page.evaluate(() => CAMP.map.scrollTo(CAMP.map.max));
await shot('11-map-top-locked', 400);
await page.evaluate(() => CAMP.map.reveal('warren', 2));
await wait(200);
const n2 = await page.evaluate(() => CAMP.map.nodeAt('warren', 2));
await tapAt(n2);
await shot('12-map-picked', 500);

// back to the camp ground, then a hero zoom
await tap('[data-act="back"]'); await tap('[data-act="back"]');
await settle(1);
await tapScene({ hero: 'paladin' });
await shot('13-hero-skills', 1000);
await tap('[data-act="sub:gear"]');
await shot('14-hero-gear', 500);
await tap('[data-act="sub:skills"]');
await page.evaluate(() => { const g = document.querySelector('.wn.open:not(.ability)') || document.querySelector('.wn.open'); const r = g.getBoundingClientRect(); window.__tapAt = [r.left + r.width / 2, r.top + r.height / 2]; });
const at = await page.evaluate(() => window.__tapAt);
await page.mouse.click(at[0], at[1]);
await shot('15-hero-node', 700);
await tap('.web-panel [data-learn]');
await shot('16-hero-learned', 600);
await tap('[data-act="sub:about"]');
await shot('17-hero-about');
await tap('[data-act="back"]');

// a hero not recruited yet: from the fire's list, standing at the camp's edge
await tapScene('fire');
await scrollPanel(9999);
await tap('[data-act="recruitpage:storm"]');
await shot('18-recruit', 1000);
await tap('[data-act="back"]'); await tap('[data-act="back"]');

// the things in the camp
await tapScene('trader');
await shot('19-trader', 1000);
await tap('#campPanel .ware >> nth=0');
await shot('20-ware-sheet');
await tap('#sheet [data-act^="buyt:"]');
await closeSheet();
await shot('21-trader-bought', 400);
await tap('[data-act="back"]');
await tapScene('book');
await shot('22-book', 1000);
await tap('[data-act^="beast:"] >> nth=1');
await shot('23-beast-sheet');
await closeSheet();
await tap('[data-act="back"]');
await tapScene('settings');
await shot('24-settings', 1000);
await scrollPanel(9999);
await shot('25-settings-cheats', 400);
await tap('[data-act="webAll"]');
await tap('[data-act="back"]');
await tapScene({ hero: 'archer' });
await tap('[data-act="sub:skills"]');
await shot('26-web-all-shown', 800);
await page.evaluate(async () => { const m = await import('./js/skilltree.js'); m.setShowAll(false); });
await tap('[data-act="sub:gear"]'); await tap('[data-act="sub:skills"]');
await shot('27-web-hidden', 800);
await tap('[data-act="back"]');

if (clips) {
  // the camp alive: wanderers, the fire, then the zoom to the fire and back
  await clip('clip-camp-alive', 240, async (i) => {
    if (i === 120) await page.evaluate(() => CAMP.setMode('fire'));
    if (i === 200) await page.evaluate(() => CAMP.setMode('ground'));
  });
  // the map scrolling from the camp's clearing up through the biomes
  await page.evaluate(() => CAMP.setMode('map'));
  const max = await page.evaluate(() => CAMP.map.max);
  await clip('clip-map-scroll', 210, async (i) => { const k = Math.min(1, i / 190), e = k * k * (3 - 2 * k); await page.evaluate((v) => CAMP.map.scrollTo(v), e * max); });
  await page.evaluate(() => CAMP.setMode('ground'));
}

if (runIt) {
  // a real run, fast-forwarded, to its result card, then back to the camp (the trader has new stock)
  await page.evaluate(() => { CAMP.setMode('map'); });
  await wait(300);
  await page.evaluate(() => CAMP.map.scrollTo(0));
  const n1 = await page.evaluate(() => { CAMP.map.reveal('warren', 1); return CAMP.map.nodeAt('warren', 1); });
  await tapAt(n1);
  await page.evaluate(() => GAME.record(true));
  await tap('[data-act="enter"]');
  await page.evaluate(() => { for (let i = 0; i < 40; i++) GAME.recFrame(1 / 30); });
  await shot('28-run', 300);
  await page.evaluate(() => { GAME.fastForward(240); const r = GAME.run; if (!r.summary) { r.leaving = true; GAME.fastForward(200); }
    GAME.endRun(r.phase === 'won' || r.phase === 'lost' ? r.phase : 'retreated'); });
  await shot('29-result', 1600);
  await tap('[data-act="home"]');
  await settle(2);
  await shot('30-camp-after', 600);
  await tapScene('trader');
  await shot('31-trader-new-stock', 1000);
}

await browser.close().catch(() => {});
console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no page errors');
