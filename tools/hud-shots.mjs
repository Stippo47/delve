// Stills of the battle HUD (UI v3), the pause/inspect panel and the leave question at phone size, through the
// installed Edge (headless).
//   node tools/hud-shots.mjs <outDir> [--port 8854] [--seed 4] [--w 390 --h 844] [--q 'theme=crypt']
//     [--party paladin,archer,cleric,pyromancer] [--mercs] [--clip 8] (records that many seconds as hud-clip.mp4)
//     [--inject 'js with w, S, GAME'] (run before the zoom and pause shots: put statuses or buffs on someone)
import { openEdge } from './edge.mjs';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'hud-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8854), seed = +opt('seed', 4), q = opt('q', ''), W = +opt('w', 390), H = +opt('h', 844);
const party = opt('party', 'paladin,archer,pyromancer,cleric').split(',');
const tag = opt('tag', '');
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = async (name) => { await page.waitForTimeout(350); await page.screenshot({ path: path.join(out, tag + name + '.png') }); console.log('shot', tag + name); };
  await page.goto(`http://localhost:${site}/?seed=${seed}&lvl=6${q ? '&' + q : ''}`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(([party, MERCS]) => {
    const s = GAME.save; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.party = party; s.potions = 4; s.elixirs = { haste: 2, ironskin: 1, quick: 1 };
    const H = { paladin: ['shieldBash', 'guard', 'consecrate'], archer: ['barrage', 'frostArrow', 'roll'], pyromancer: ['fireball', 'flameWall', 'inferno'], cleric: ['mend', 'sanctuary', 'smite'] };
    for (const id of party) { s.heroes[id].owned = true; s.heroes[id].nodes = Object.fromEntries((H[id] || []).flatMap((a, i) => (i < 2 ? [[a + '1', 1]] : []))); }
    s.heroes[party[0]].trinkets = ['ironSkin', 'frostRing']; s.heroes[party[0]].nodes.slot2 = 1;
    if (party[1]) s.heroes[party[1]].trinkets = ['thunderRing']; if (party[2]) s.heroes[party[2]].trinkets = ['impLantern']; if (party[3]) s.heroes[party[3]].trinkets = ['widowLocket'];
    s.tlv = { ironSkin: 2, impLantern: 3 };
    GAME.record(true);
    GAME.startRun({ theme: 'crypt', party, mercs: MERCS, potions: { [party[0]]: 1 },
      elixirs: { [party[0]]: ['ironskin'], ...(party[1] ? { [party[1]]: ['haste'] } : {}) }, tlv: s.tlv });
  }, [party, args.includes('--mercs')]);
  await page.evaluate(() => { for (let i = 0; i < 30; i++) GAME.recFrame(1 / 30); });
  await shot('01-hud-start');
  for (let k = 0; k < 200; k++) {
    await page.evaluate(() => { for (let i = 0; i < 6; i++) GAME.recFrame(1 / 30); });
    const busy = await page.evaluate(() => GAME.run.world.units.filter((u) => u.team === 'enemy' && u.aggro && !u.dead).length >= 2 && document.querySelectorAll('#cards .sring').length >= 2);
    if (busy) break;
  }
  await shot('02-hud-fight');
  // --inject 'js': run in the page with w (the world) and S (sim.js) before the zoom and the pause shots (lane S: statuses on the cards)
  if (opt('inject', '')) await page.evaluate(async (code) => { const S = await import('./js/sim.js'); new Function('w', 'S', 'GAME', code)(GAME.run.world, S, GAME); for (let i = 0; i < 3; i++) GAME.recFrame(1 / 30); }, opt('inject', ''));
  const clipSecs = +opt('clip', 0);
  if (clipSecs) {
    const frames = fs.mkdtempSync(path.join(out, '.frames-'));
    for (let i = 0; i < clipSecs * 30; i++) {
      await page.evaluate(() => GAME.recFrame(1 / 30));
      await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(frames, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', path.join(out, tag + 'hud-clip.mp4')]);
    fs.rmSync(frames, { recursive: true, force: true }); console.log('clip', path.join(out, tag + 'hud-clip.mp4'));
  }
  // a zoom on the cards, to check the bars and numbers
  const dock = await page.evaluate(() => { const r = document.getElementById('dock').getBoundingClientRect(); return { x: r.left, y: r.top - 20, width: r.width, height: r.height + 20 }; });
  await page.screenshot({ path: path.join(out, tag + '03-cards-zoom.png'), clip: dock }); console.log('shot', tag + '03-cards-zoom');
  await page.evaluate((k) => GAME.pause(true, k), party[0]);
  await page.evaluate(() => { for (let i = 0; i < 10; i++) GAME.recFrame(1 / 30); });
  await shot('04-pause-hero');
  await page.evaluate(() => { const b = document.querySelector('.ip-body'); b.scrollTop = 9999; });
  await shot('05-pause-hero-items');
  await page.click('.ip-face.enemy >> nth=0', { force: true }).catch(() => {});
  await page.evaluate(() => { for (let i = 0; i < 10; i++) GAME.recFrame(1 / 30); });
  await shot('06-pause-enemy');
  await page.evaluate(() => GAME.pause(false));
  await page.evaluate(() => { GAME.run.coins = 137; GAME.ask(); for (let i = 0; i < 4; i++) GAME.recFrame(1 / 30); });
  await shot('07-leave-ask');
} finally {
  await edge.close();
  console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no page errors');
}
