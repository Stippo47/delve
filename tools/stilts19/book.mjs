// Lane stilts19: stills of where the Canopy Idol is registered: the Book's monster grid (the "No dungeon yet" group), its
// page and preview, and battle mode's picker tab. Phone size, through the installed Edge on this lane's own profile.
//   node tools/stilts19/book.mjs <outDir> [--port 8961]
import { openEdge } from '../edge.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const LANE = path.join(os.tmpdir(), 'delve-lane-stilts19'); fs.mkdirSync(LANE, { recursive: true }); process.env.TEMP = LANE; process.env.TMP = LANE;
const args = process.argv.slice(2), out = path.resolve(args[0] || 'idol-book'); fs.mkdirSync(out, { recursive: true });
const pi = args.indexOf('--port'), port = pi >= 0 ? args[pi + 1] : '8961';
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
const errors = [];
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  const wait = (ms) => page.waitForTimeout(ms), shot = async (name) => { await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
  await page.goto(`http://localhost:${port}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => { CAMP.setMode('book'); }); await wait(600);
  await page.evaluate(() => { BOOK.tab('monsters'); const sc = document.querySelector('#book .pg-page.on .un-scroll'); const t = [...sc.querySelectorAll('.un-h')].find((e) => /No dungeon yet/.test(e.textContent)); if (t) sc.scrollTop = t.offsetTop - 60; }); await wait(500);
  await shot('1-book-monsters');
  await page.evaluate(() => BOOK.open('foe', 'stiltIdol')); await wait(900); await shot('2-page');
  // its preview, a few moments into the loop
  await page.evaluate(() => { const i = [...document.querySelectorAll('#unit .pg-tabs *')].findIndex((e) => /Preview/.test(e.textContent)); UNIT.pager.go(Math.max(0, i), false); }); await wait(900);
  for (const [i, s] of [[3, 1.5], [4, 3.2], [5, 5.0], [6, 7.5]]) {
    const ok = await page.evaluate((s) => { const p = (window.UNIT && UNIT.player && UNIT.player.stage ? UNIT.player : null) || (BOOK.player && BOOK.player.stage ? BOOK.player : null); if (!p) return false; p.resume(); p.restart(); p.stop(); p.advance(s); return true; }, s);
    await wait(200); await shot(`${i}-preview-${s}s${ok ? '' : '-noplayer'}`);
  }
  await page.evaluate(() => { BOOK.close(); CAMP.setMode('ground'); GAME.openBattle(); }); await wait(500);
  await page.evaluate(() => { document.querySelector('[data-b="add:a"]').click(); }); await wait(300);
  await page.evaluate(() => { const b = document.querySelector('[data-b="tab:loose"]'); if (b) b.click(); }); await wait(400);
  await shot('7-battle-picker');
  console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no errors');
} finally { await edge.close(); }
