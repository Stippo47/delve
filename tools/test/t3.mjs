import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:8811/index.html?seed=21');
await p.evaluate(() => { localStorage.clear(); });
await p.reload(); await p.waitForTimeout(700);
await p.click('#enterBtn');
for (const [i, ms] of [[1, 3200], [2, 2600], [3, 3000]]) { await p.waitForTimeout(ms); await p.screenshot({ path: `f${i}.png` }); }
await p.evaluate(() => GAME.fastForward(40));
await p.waitForTimeout(1500); await p.screenshot({ path: 'f4.png' });
await p.evaluate(() => { GAME.run.floor = 3; GAME.run.room = 2; GAME.fastForward(200); });
await p.waitForTimeout(800); await p.screenshot({ path: 'f5.png' });
console.log(await p.evaluate(() => GAME.state + ' ' + (GAME.run && GAME.run.phase)));
console.log(errs.join('\n') || 'no errors');
await b.close();
