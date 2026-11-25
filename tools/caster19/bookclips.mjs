// Round 19 (lane caster19): one short film of each changed attack and ability, recorded off the Book's own preview player
// (a real little fight: tools/preview18/clips.mjs's way), stepped a frame at a time; with --zoom, cropped round the
// middle of the stage and scaled up, so the effects can be looked at closely. Nothing reads them.
//   node tools/caster19/bookclips.mjs [--port 8934] [--out docs/clips/caster19] [--only digger,witch-attack] [--zoom 1.6]
// Needs the dev server: node tools/serve.mjs 8934; run with TEMP pointed at this lane's own folder (its Edge profile).
import { openEdge } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', 8934), out = path.resolve(opt('out', 'docs/clips/caster19')), only = (opt('only', '') || '').split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });
// [file, hero, move, tier, seconds]
export const CLIPS = [
  ['digger-attack', 'digger', 'attack', 3, 4],
  ['digger-dirtFling-III', 'digger', 'dirtFling', 3, 6],
  ['digger-burrow-III', 'digger', 'burrow', 3, 6],
  ['digger-bury-III', 'digger', 'spadeBat', 3, 6],
  ['digger-trait', 'digger', 'trait', 3, 6],
  ['grandpa-breadToss-II', 'grandpa', 'breadToss', 2, 5],
  ['grandpa-harvest-III', 'grandpa', 'harvest', 3, 5],
  ['grandpa-sheaves-III', 'grandpa', 'oldTales', 3, 8],
  ['alchemist-attack', 'alchemist', 'attack', 3, 4],
  ['alchemist-brewPools-III', 'alchemist', 'acidFlask', 3, 6],
  ['alchemist-elixir-II', 'alchemist', 'elixir', 2, 5],
  ['alchemist-monstrosity-III', 'alchemist', 'bangFlask', 3, 7],
  ['shaman-attack', 'shaman', 'attack', 3, 4],
  ['shaman-healTotem-III', 'shaman', 'healTotem', 3, 7],
  ['shaman-spiritLink-III', 'shaman', 'spiritLink', 3, 7],
  ['shaman-ancestorsCall-III', 'shaman', 'rainDance', 3, 7],
  ['witch-attack', 'witch', 'attack', 3, 4],
  ['witch-hex-III', 'witch', 'frogHex', 3, 5],
  ['witch-cursedBrew-III', 'witch', 'cursedBrew', 3, 6],
  ['witch-broomRide-III', 'witch', 'broomRide', 3, 5],
];
const zoom = +opt('zoom', 0);
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
    const vf = zoom > 1 ? `crop=iw/${zoom}:ih/${zoom}:(iw-iw/${zoom})/2:(ih-ih/${zoom})/2,scale=trunc(iw*${zoom}/2)*2:trunc(ih*${zoom}/2)*2` : 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'), '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', path.join(out, name + '.mp4')]);
    fs.rmSync(dir, { recursive: true, force: true });
    const info = await page.evaluate(() => { const S = UNIT.player.stage; return { scene: S.scene, castT: S.castT, casts: S.casts, brain: S.byBrain, forced: S.forced, loop: S.loop }; });
    console.log('film', name, JSON.stringify(info));
  }
} finally { await edge.close(); }
if (errors.length) { console.log('errors:'); for (const e of errors) console.log('  ' + e); }
