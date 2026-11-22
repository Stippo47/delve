// Stills of the wagon road's tree line (js/convoy-art.js) at phone size, through the installed Edge (headless): each
// take (?edge=crowns | firs | bank) in each country asked for, the camera held across at the left wood, the right
// wood, or the middle.
//   node tools/edge-shots.mjs <outDir> [--port 8847] [--edges crowns,firs,bank] [--lands wildwood,frost,ember]
//     [--lean -1,0] [--at 0] [--w 390 --h 844] [--party paladin,archer,cleric]
// --at S: seconds up the road before the still (so the rows have slid apart). Needs the folder served on --port
// (python -m http.server 8847) and playwright-core in tools/node_modules.
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'edge-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8847), W = +opt('w', 390), H = +opt('h', 844), at = +opt('at', 0);
const edges = opt('edges', 'crowns,firs,bank').split(','), lands = opt('lands', 'wildwood').split(','), leans = opt('lean', '-1').split(',').map(Number);
const party = opt('party', 'paladin,archer,cleric').split(',');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); if (args.includes('--v')) page.on('console', (m) => console.log('console', m.type(), m.text()));
  for (const e of edges) {
    await page.goto(`http://localhost:${site}/?seed=4&edge=${e}`);
    await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 150000, polling: 200 });
    for (const land of lands) for (const lean of leans) {
      await page.evaluate(([party, land, lean, at]) => {
        const s = GAME.save; s.unlocks = { ...(s.unlocks || {}), slotMini1: true, slotBoss1: true };
        for (const id of party) { const h = s.heroes[id]; h.owned = true; h.level = 5; }
        s.party = party.slice();
        GAME.record(true); GAME.startConvoy({ party, lands: [land] });
        const r = GAME.run; r.calm = 999; r.lean = lean; r.banner = null;
        for (let i = 0; i < Math.max(2, at) * 30; i++) GAME.recFrame(1 / 30);
        GAME.run.banner = null; GAME.recFrame(0);
      }, [party, land, lean, at]);
      const name = `edge-${e}-${land}${lean < 0 ? '' : lean > 0 ? '-right' : '-mid'}${at ? '-t' + at : ''}.png`;
      await page.waitForTimeout(500); await page.evaluate(() => GAME.recFrame(0)); // (sprites made on first sight are in by now)
      await page.waitForTimeout(150); await page.screenshot({ path: path.join(out, name) }); console.log('shot', name);
    }
  }
} catch (e) { errors.push('script: ' + (e.stack || e)); }
console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no errors');
try { await browser.close(); } catch {}
try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
process.exit(errors.length ? 1 : 0);
