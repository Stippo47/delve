// Round 18 (lane preview18): short films of the Book's ability previews, recorded off the hero page's own preview
// player (js/preview.js), stepped a frame at a time so they play smoothly whatever the machine. Nothing reads them.
//   node tools/preview18/clips.mjs [--port 8993] [--out docs/clips/preview18] [--only mend,guard]
// Needs the dev server: node tools/serve.mjs 8993. Edge comes from tools/edge.mjs (its own profile folder under TEMP,
// which the caller points at this lane's own folder, so nothing here can stop another lane's browser).
import { openEdge } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', 8993), out = path.resolve(opt('out', 'docs/clips/preview18')), only = (opt('only', '') || '').split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });
// [file, hero, move, tier, seconds]
const CLIPS = [
  ['heal-cleric-mend-III', 'cleric', 'mend', 3, 7],
  ['group-wildmane-cleave-I', 'wildmane', 'cleave', 1, 4.5],
  ['parry-oldguard-pommelStrike-II', 'oldguard', 'pommelStrike', 2, 6],
  ['dodge-ninja-substitution-II', 'ninja', 'substitution', 2, 5],
  ['summon-engineer-deployTurret-I', 'engineer', 'deployTurret', 1, 7],
  ['summon-engineer-deployTurret-III', 'engineer', 'deployTurret', 3, 7],
  ['shooters-crossbowman-pavise-III', 'crossbowman', 'pavise', 3, 7],
  ['aura-bard-warSong-III', 'bard', 'warSong', 3, 7],
  ['bubble-waterMage-bubbleShield-II', 'waterMage', 'bubbleShield', 2, 7],
  ['revive-valkyrie-valkyrieCall-I', 'valkyrie', 'valkyrieCall', 1, 6],
  ['lethal-granny-oldBones-III', 'granny', 'oldBones', 3, 5],
  ['guard-paladin-guard-III', 'paladin', 'guard', 3, 6],
  ['trait-warhelm-ironWill', 'warhelm', 'trait', 1, 6],
];
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
const errors = [];
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${port}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  for (const [name, id, move, tier, secs] of CLIPS) {
    if (only.length && !only.some((o) => name.includes(o))) continue;
    await page.evaluate(([id, move, tier]) => { if (window.BOOK) BOOK.close(); CAMP.setMode('ground'); CAMP.setMode('hero', { id, page: 'preview' }); UNIT.set({ move, tier }); }, [id, move, tier]);
    await page.waitForTimeout(900);
    await page.evaluate(() => { const p = UNIT.player; p.resume(); p.restart(); p.stop(); });
    const box = await page.evaluate(() => { const c = document.querySelector('#unit .pv-cv'); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
    const dir = fs.mkdtempSync(path.join(out, '.f-')), fps = 30;
    for (let i = 0; i < Math.round(secs * fps); i++) {
      await page.evaluate(() => { const p = UNIT.player; p.stop(); p.advance(1 / 30, 1 / 30); });
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`), clip: box });
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', path.join(out, name + '.mp4')]);
    fs.rmSync(dir, { recursive: true, force: true });
    const info = await page.evaluate(() => { const S = UNIT.player.stage; return { scene: S.scene, castT: S.castT, casts: S.casts, brain: S.byBrain, forced: S.forced, loop: S.loop }; });
    console.log('film', name, JSON.stringify(info));
  }
} finally { await edge.close(); }
if (errors.length) { console.log('errors:'); for (const e of errors) console.log('  ' + e); }
