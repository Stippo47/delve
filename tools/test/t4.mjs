import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:8811/index.html?seed=33');
await p.evaluate(() => { localStorage.setItem('dungeon-save-v1', JSON.stringify({ coins: 214, maxDepth: 3, depth: 2, wins: 2, runs: 4,
  heroes: { knight: { level: 4, xp: 30, trinket: { id: 'ironSkin', uid: 1 } }, archer: { level: 5, xp: 80, trinket: { id: 'frostRing', uid: 2 } }, rogue: { level: 3, xp: 10, trinket: null } },
  inventory: [{ id: 'lastBreath', uid: 3 }, { id: 'volatile', uid: 4 }, { id: 'emberRing', uid: 5 }, { id: 'swiftBoots', uid: 6 }] })); });
await p.reload(); await p.waitForTimeout(800);
await p.screenshot({ path: 'camp.png' });
await p.click('.item'); await p.waitForTimeout(200); await p.screenshot({ path: 'camp-sel.png' });
await p.click('#enterBtn');
await p.waitForTimeout(6500); await p.screenshot({ path: 'g1.png' });
await p.waitForTimeout(3000); await p.screenshot({ path: 'g2.png' });
console.log(errs.join('\n') || 'no errors');
await b.close();
