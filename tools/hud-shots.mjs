// Stills of the battle HUD and the pause/inspect panel at phone size, through the installed Edge (headless).
//   node tools/hud-shots.mjs <outDir> [--port 8832] [--seed 4] [--q 'theme=crypt'] [--party paladin,archer,cleric,pyromancer] [--mercs]
//   [--clip 8] also records that many seconds of the fight (30 fps, then ffmpeg) as hud-clip.mp4
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'hud-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8832), seed = +opt('seed', 4), q = opt('q', ''), W = +opt('w', 390), H = +opt('h', 844);
const party = opt('party', 'paladin,archer,pyromancer,cleric').split(',');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = async (name) => { await page.waitForTimeout(350); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
  await page.goto(`http://localhost:${site}/?seed=${seed}&lvl=6${q ? '&' + q : ''}`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(([party, MERCS]) => {
    const s = GAME.save; s.slots = 4; s.party = party; s.potions = 4; s.elixirs = { haste: 2, ironskin: 1, quick: 1 };
    for (const id of party) { s.heroes[id].owned = true; s.heroes[id].nodes = { ...Object.fromEntries(['1', '2'].flatMap((t) => []) ) }; }
    s.heroes[party[0]].trinkets = ['ironSkin', 'frostRing']; s.heroes[party[0]].nodes.slot2 = 1;
    s.heroes[party[1]].trinkets = ['thunderRing']; s.heroes[party[2]].trinkets = ['impLantern']; s.heroes[party[3]].trinkets = ['widowLocket'];
    s.tlv = { ironSkin: 2, impLantern: 3 };
    GAME.record(true);
    GAME.startRun({ theme: s.theme || 'crypt', party, mercs: MERCS, potions: { [party[0]]: 1, [party[3]]: 1 },
      elixirs: { [party[0]]: ['ironskin'], [party[1]]: ['haste'], [party[2]]: ['quick'] }, tlv: s.tlv });
  }, [party, args.includes('--mercs')]);
  await page.evaluate(() => { for (let i = 0; i < 30; i++) GAME.recFrame(1 / 30); });
  await shot('01-hud-start');
  for (let k = 0; k < 150; k++) {
    await page.evaluate(() => { for (let i = 0; i < 6; i++) GAME.recFrame(1 / 30); });
    const busy = await page.evaluate(() => GAME.run.world.units.filter((u) => u.team === 'enemy' && u.aggro && !u.dead).length >= 2 && document.querySelectorAll("#cards .sring").length >= 3);
    if (busy) break;
  }
  await shot('02-hud-fight');
  const clipSecs = +opt('clip', 0);
  if (clipSecs) {
    const frames = fs.mkdtempSync(path.join(out, '.frames-'));
    for (let i = 0; i < clipSecs * 30; i++) {
      await page.evaluate(() => GAME.recFrame(1 / 30));
      await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(frames, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', path.join(out, 'hud-clip.mp4')]);
    fs.rmSync(frames, { recursive: true, force: true }); console.log('clip', path.join(out, 'hud-clip.mp4'));
  }
  await page.evaluate((k) => GAME.pause(true, k), party[0]);
  await page.evaluate(() => { for (let i = 0; i < 10; i++) GAME.recFrame(1 / 30); });
  await shot('03-pause-hero');
  await page.evaluate(() => { const b = document.querySelector('.ip-body'); b.scrollTop = 9999; });
  await shot('04-pause-hero-items');
  await page.click('.ip-face.enemy >> nth=0', { force: true }).catch(() => {});
  await page.evaluate(() => { for (let i = 0; i < 10; i++) GAME.recFrame(1 / 30); });
  await shot('05-pause-enemy');
} finally {
  await browser.close().catch(() => {}); try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { edge.kill(); } try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
  console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no page errors');
}
