// A WebKit pass (Playwright's WebKit, the engine under iPhone Safari) over the unit page and the Book (round 14, lane
// U): every page opens without errors, the pages have real height and scroll, the preview's canvas has size, a swipe
// turns the page. Stills go to <outDir>.
//   node tools/unit-webkit.mjs <outDir> [--port 8961]
import { webkit } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'webkit-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8961);
const exe = process.env.WEBKIT || [2104, 2370].map((r) => path.join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'webkit-' + r, 'Playwright.exe')).find((p) => fs.existsSync(p));
const browser = await webkit.launch(exe ? { executablePath: exe } : {});
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = async (name) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
  await page.goto(`http://localhost:${site}/?seed=5`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => { const s = GAME.save; s.gold = 900; s.party = ['paladin']; s.heroes.paladin.level = 5; s.heroes.paladin.points = 2; s.trinkets = ['frostRing'];
    s.seen = { wolf: { met: 3, beaten: 2 }, orcShaman: { met: 3, beaten: 2 }, elderEnt: { met: 1, beaten: 1 } }; GAME.cheat({}); });
  // the sizes that have gone wrong on iPhone Safari before: a page with no height, a scroller that doesn't scroll, a canvas of no size
  const sizes = (root) => page.evaluate((root) => {
    const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
    const on = document.querySelector(root + ' .pg-page.on'), sc = on && on.querySelector('.un-scroll');
    return { view: r(document.querySelector(root + ' .pg-view')), page: r(on), scroll: r(sc), tabs: r(document.querySelector(root + ' .pg-tabs')), cv: r(document.querySelector(root + ' .pv-cv')), tree: r(document.querySelector(root + ' .treehost')) };
  }, root);
  const need = (name, s, keys) => { for (const k of keys) if (!s[k] || s[k][0] < 300 || s[k][1] < (k === 'tabs' ? 40 : 200)) errors.push(`${name}: ${k} has no size: ${JSON.stringify(s)}`); };
  await page.evaluate(() => CAMP.setMode('hero', { id: 'paladin' })); await shot('wk-10-hero-main'); need('hero main', await sizes('#unit'), ['view', 'page', 'scroll', 'tabs']);
  await page.evaluate(() => UNIT.pager.go(1, false)); await shot('wk-11-hero-upgrades'); need('hero upgrades', await sizes('#unit'), ['view', 'page', 'tree']);
  await page.evaluate(() => UNIT.pager.go(2, false)); await page.waitForTimeout(900); await shot('wk-12-hero-preview'); need('hero preview', await sizes('#unit'), ['view', 'page', 'cv']);
  await page.evaluate(() => UNIT.pager.go(3, false)); await shot('wk-13-hero-stats'); need('hero stats', await sizes('#unit'), ['view', 'page', 'scroll']);
  // a swipe turns the page (pointer events of a touch, as a finger gives them)
  await page.evaluate(() => UNIT.pager.go(0, false));
  await page.evaluate(async () => {
    const v = document.querySelector('#unit .pg-view'), ev = (type, x) => v.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: 600 }));
    ev('pointerdown', 330); for (let x = 320; x >= 80; x -= 20) { ev('pointermove', x); await new Promise((r) => setTimeout(r, 12)); } ev('pointerup', 80);
  });
  await page.waitForTimeout(500);
  if (await page.evaluate(() => UNIT.pager.id) !== 'upgrades') errors.push('a swipe did not turn the page: ' + await page.evaluate(() => UNIT.pager.id));
  await page.evaluate(() => document.querySelector('#unit [data-un="back"]').click());
  await page.evaluate(() => CAMP.setMode('book')); await shot('wk-20-book-heroes'); need('book heroes', await sizes('#book'), ['view', 'page', 'scroll', 'tabs']);
  { await page.evaluate(() => BOOK.tab('monsters')); const sc = await page.evaluate(() => { const s = document.querySelector('#book .pg-page.on .un-scroll'); s.scrollTop = 300; const out = [s.scrollTop, s.scrollHeight, s.clientHeight]; s.scrollTop = 0; return out; });
    if (!(sc[1] > sc[2]) || sc[0] < 100) errors.push('the monsters grid does not scroll: ' + JSON.stringify(sc)); }
  for (const id of ['monsters', 'trinkets', 'statuses', 'dungeons']) { await page.evaluate((id) => BOOK.tab(id), id); await shot('wk-21-book-' + id); need('book ' + id, await sizes('#book'), ['view', 'page', 'scroll']); }
  await page.evaluate(() => BOOK.open('foe', 'orcShaman', { rank: 1 })); await shot('wk-30-monster-overview'); need('monster overview', await sizes('#unit'), ['view', 'page', 'scroll']);
  await page.evaluate(() => UNIT.pager.go(1, false)); await page.waitForTimeout(900); await shot('wk-31-monster-preview'); need('monster preview', await sizes('#unit'), ['view', 'page', 'cv']);
  await page.evaluate(() => UNIT.pager.go(2, false)); await shot('wk-32-monster-stats');
  await page.evaluate(() => document.querySelector('#unit [data-un="back"]').click());
  await page.evaluate(() => BOOK.open('status', 'frozen')); await page.waitForTimeout(900); await shot('wk-40-status');
  const th = await page.evaluate(() => { const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }; return { cv: r('.bk-thing .pv-cv'), meter: r('.bk-thing .tm-bar'), seg: r('.bk-thing .un-seg') }; });
  if (th.cv[1] < 200 || th.meter[0] < 150 || th.meter[1] < 10 || th.seg[1] < 36) errors.push('status page sizes: ' + JSON.stringify(th));
  await page.evaluate(() => { BOOK.close(); BOOK.open('dungeon', 'wildwood'); }); await shot('wk-41-dungeon');
  await page.evaluate(() => { BOOK.close(); CAMP.setMode('settings'); }); await shot('wk-50-settings');
} catch (e) { errors.push('script: ' + (e.stack || e)); } finally {
  await browser.close();
  console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'webkit: no page errors, every page has size, a swipe turns the page');
}
