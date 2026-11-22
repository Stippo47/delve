// Stills of the wagon mode (js/convoy.js) at phone size, through the installed Edge (headless): the camp with the
// wagon parked at its edge, the Set out page, a stretch under way, a quiet spell (the party spread out), the roadside
// shop, the Bandit Chief's barricade, and the result card.
//   node tools/convoy-shots.mjs <outDir> [--port 8882] [--seed 4] [--w 390 --h 844] [--party paladin,archer,cleric] [--level 5]
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'convoy-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8882), seed = +opt('seed', 4), W = +opt('w', 390), H = +opt('h', 844);
const party = opt('party', 'paladin,archer,cleric').split(','), level = +opt('level', 5);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const killEdge = () => {
  try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
  // (round 14, lane W) Edge starts itself again under another process id, which the line above doesn't reach, so every
  // run used to leave one running: take down whatever still runs on this run's own profile folder
  try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${path.basename(prof)}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
};
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errors.push('missing: ' + r.url()); });
  const shot = async (name, ms = 450) => { await page.waitForTimeout(ms); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
  const tap = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) throw new Error('nothing matches ' + s); e.click(); }, sel);
  await page.goto(`http://localhost:${site}/?seed=${seed}&allnodes`); // (every skill: a fresh save's heroes have none, and fall before the stills)
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000, polling: 200 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000, polling: 200 });
  await page.evaluate(([party, level]) => {
    const s = GAME.save;
    s.unlocks = { ...(s.unlocks || {}) }; for (const k of ['slotMini1', 'slotBoss1']) s.unlocks[k] = true; s.slots = 3;
    for (const id of party) { const h = s.heroes[id]; h.owned = true; h.level = level; h.points = 0; }
    s.heroes.paladin && (s.heroes.paladin.nodes = { ...s.heroes.paladin.nodes, shieldBash1: 1, guard1: 1 });
    s.party = party.slice(); s.gold = 120;
    GAME.cheat({});
  }, [party, level]);
  await shot('01-camp-wagon', 1200);
  // the wagon at the camp's edge, tapped through the canvas (the real way in)
  await page.mouse.click(W * 0.36, H * 0.765); // where the wagon is parked on a 390 x 844 screen
  await page.waitForTimeout(500);
  if (await page.evaluate(() => GAME.state) !== 'convoy') { errors.push('tapping the parked wagon did not open its page'); await page.evaluate(() => GAME.openConvoy()); }
  await shot('02-set-out');
  await tap('[data-cv="go"]');
  await page.waitForFunction(() => GAME.state === 'run' && GAME.run && GAME.run.mode === 'convoy', null, { polling: 200 });
  await shot('03-road-start', 1200);
  await page.evaluate(() => GAME.fastForward(28));
  await shot('04-road-fight', 700);
  await page.evaluate(() => { const r = GAME.run; for (let i = 0; i < 80; i++) { if (!r.world.units.some((u) => u.team !== r.wagon.team && !u.dead && !u.downed && u.team !== 'neutral')) break; GAME.fastForward(0.5); } r.calm = 60; GAME.fastForward(22); });
  await shot('05-road-quiet', 700);
  // on to the end of the stretch: the roadside camp
  await page.evaluate(() => { const r = GAME.run; for (let i = 0; i < 1600 && r.phase === "road"; i++) { r.wagon.hp = Math.max(r.wagon.hp, r.wagon.maxHp * 0.5); for (const u of r.world.units) if (u.team === r.wagon.team && !u.downed && !u.dead) u.hp = Math.max(u.hp, u.maxHp * 0.6); GAME.fastForward(0.25); }
    if (r.phase === 'roadside') { r.wagonHp = Math.round(r.wagonMax * 0.45); r.coins = Math.max(r.coins, 90); } });
  await page.waitForFunction(() => GAME.state === 'convoy' || (GAME.run && GAME.run.phase !== 'road'), null, { timeout: 30000, polling: 200 });
  await page.evaluate(() => GAME.roadside());
  console.log('diag', await page.evaluate(() => JSON.stringify({ st: GAME.state, ph: GAME.run && GAME.run.phase, res: GAME.run && GAME.run.result, cv: (document.getElementById('convoy')||{}).className, n: document.querySelectorAll('.cv-choice').length })));
  await shot('06-roadside', 900);
  await tap('[data-cv="buy:repair"]'); await page.waitForTimeout(200);
  await shot('06b-roadside-bought', 400);
  const fit = await page.evaluate(() => { const p = document.querySelector('.cv-panel'); p.scrollTop = 1e4; const b = document.querySelector('.cv-go').getBoundingClientRect(); return { bottom: b.bottom, h: innerHeight }; });
  if (fit.bottom > fit.h + 1) errors.push('roadside: the set-off button is off screen');
  await tap('[data-cv="go-on"]');
  await page.waitForFunction(() => GAME.state === 'run' && GAME.run.phase === 'road' && GAME.run.stretch === 1, null, { polling: 200 });
  await shot('07-stretch2', 1500);
  // the last stretch, from its start (a second trip): the Bandit Chief's barricade
  await page.evaluate(([party]) => { GAME.startConvoy({ party, stretch: 2 }); }, [party]);
  await page.waitForFunction(() => GAME.state === 'run' && GAME.run.stretch === 2, null, { polling: 200 });
  await page.evaluate(() => { const r = GAME.run; r.wagon.x = r.barricade.x - 1000; for (const u of r.world.units) if (u.team === r.wagon.team && !u.def.cargo) u.x = r.wagon.x + 60; for (let i = 0; i < 40 && !r.chiefSeen && r.phase === 'road'; i++) GAME.fastForward(1); GAME.fastForward(5); });
  await shot('08-chief', 900);
  await page.evaluate(() => { const r = GAME.run; if (r.chief) r.chief.hp = 1; for (let i = 0; i < 400 && !GAME.run.summary; i++) GAME.fastForward(1); });
  await page.waitForFunction(() => GAME.state === 'result', null, { timeout: 30000, polling: 200 });
  await shot('09-result', 1200);
  const fr = await page.evaluate(() => { const b = document.querySelector('.r-foot .btn').getBoundingClientRect(); return { btnBottom: b.bottom, h: innerHeight }; });
  if (fr.btnBottom > fr.h + 1) errors.push('result: the buttons are off screen');
  await tap('[data-cr="camp"]');
  await page.waitForFunction(() => GAME.state === 'camp', null, { polling: 200 });
  await shot('10-camp-after', 900);
} catch (e) { errors.push('script: ' + (e.stack || e)); }
console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no errors');
try { await browser.close(); } catch {}
killEdge();
process.exit(errors.length ? 1 : 0);
