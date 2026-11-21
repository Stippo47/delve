// A WebKit pass (Playwright's WebKit, the engine under iPhone Safari) over the camp and the battle HUD: every screen
// loads without errors, and the hero cards' HP and XP bars have real size. Stills go to <outDir>.
//   node tools/webkit-check.mjs <outDir> [--port 8854]
import { webkit } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'webkit-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8854);
// a newer installed WebKit build works too (the protocol is close enough); WEBKIT=path overrides
const exe = process.env.WEBKIT || [2104, 2370].map((r) => path.join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'webkit-' + r, 'Playwright.exe')).find((p) => fs.existsSync(p));
const browser = await webkit.launch(exe ? { executablePath: exe } : {});
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = async (name) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
  await page.goto(`http://localhost:${site}/?seed=5`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => { const s = GAME.save; s.gold = 900; s.unlocks = { slotMini1: true, slotBoss1: true }; s.party = ['paladin', 'archer'];
    s.heroes.paladin.level = 5; s.heroes.paladin.points = 2; s.heroes.archer.level = 3; GAME.cheat({}); });
  await shot('wk-01-camp');
  for (const t of ['heroes', 'trader', 'book', 'settings']) { await page.click(`[data-act="tab:${t}"]`); await shot('wk-02-' + t); }
  await page.click('[data-act="tab:heroes"]'); await page.click('[data-act="hero:paladin"]'); await shot('wk-03-hero-skills');
  await page.click('[data-act="tab:camp"]');
  await page.evaluate(() => { GAME.record(true); GAME.startRun({ theme: 'warren', party: ['paladin', 'archer'], mercs: true, potions: {}, elixirs: {}, tlv: {} }); for (let i = 0; i < 60; i++) GAME.recFrame(1 / 30); });
  await shot('wk-04-hud');
  const bars = await page.evaluate(() => [...document.querySelectorAll('.hcard')].map((c) => {
    const r = (s) => { const e = c.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
    return { k: c.dataset.k, hp: r('.hc-hp'), hpFill: r('.hc-hp > i'), xp: r('.hc-xp'), xpFill: r('.hc-xp > i'), lvl: r('.hc-lv'), ab: r('.hc-abil') };
  }));
  console.log(JSON.stringify(bars));
  for (const b of bars) if (!b.hp || b.hp[1] < 8 || b.hp[0] < 40 || !b.xp || b.xp[1] < 6 || b.xp[0] < 30) errors.push('bar too small on ' + b.k + ': ' + JSON.stringify(b));
  await page.evaluate(() => GAME.pause(true, 'paladin')); await shot('wk-05-pause');
} finally {
  await browser.close();
  console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'webkit: no page errors, bars all have size');
}
