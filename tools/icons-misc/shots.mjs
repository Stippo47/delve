// Round 19, icons-misc lane: real-size phone screenshots of where the new icons show: the hero's Stats page and skill
// web, the trader, the fire (potions), the camp purse, a trinket's Book page, and the inspect panel in a fight.
//   node tools/serve.mjs 8952 .   then   node tools/icons-misc/shots.mjs <outDir> [--port 8952] [--icons r19] [--tag x-] [--only a,b]
// --icons is passed as ?icons=... (see icons.js: a, b, statold, r19, soft, old). Headless Edge, its own temp profile.
import { openEdge } from '../edge.mjs';
import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'icon-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8952), icons = opt('icons', ''), tag = opt('tag', ''), only = opt('only', '').split(',').filter(Boolean);
const W = 390, H = 844;
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'], port: 8954 });
const errors = [];
try {
  const page = await (await edge.browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errors.push('missing: ' + r.url()); });
  const want = (n) => !only.length || only.some((o) => n.includes(o));
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = async (name, ms = 500, clip) => { if (!want(name)) return; await wait(ms); await page.screenshot({ path: path.join(out, tag + name + '.png'), ...(clip ? { clip } : {}) }); console.log('shot', tag + name); };
  const q = `?seed=4${icons ? '&icons=' + icons : ''}`;
  await page.goto(`http://localhost:${site}/${q}`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => {
    const s = GAME.save;
    s.gold = 1240; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: false }; s.potions = 2; s.elixirs = { haste: 1, ironskin: 2, fireproof: 1, regen: 1 }; s.runs = 9; s.wins = 2;
    for (const id of ['paladin', 'archer', 'necromancer', 'storm', 'cleric']) s.heroes[id].owned = true;
    Object.assign(s.heroes.paladin, { level: 7, xp: 96, points: 2, nodes: { shieldBash1: 1, shieldBashCd: 2, shieldBash2: 1, guard1: 1, offence0: 2, slot2: 1 }, trinkets: ['ironSkin', 'phoenixFeather'] });
    Object.assign(s.heroes.archer, { level: 5, xp: 40, points: 1, nodes: { barrage1: 1 }, trinkets: ['frostRing'] });
    s.party = ['paladin', 'archer']; s.tlv = { ironSkin: 2 };
    s.trinkets = ['thunderRing', 'frostRing', 'vampTooth', 'hookChain'];
    s.tally = s.tally || { foes: {}, heroes: {} };
    s.tally.heroes.paladin = { runs: 9, dmg: 4210, heal: 380, kills: 96, taken: 5120, blocked: 1840, downs: 2, revives: 3, best: 61, src: { dmg: { attack: 2900, 'ab:shieldBash': 1310 }, heal: { 'ab:consecrate': 380 }, kills: { attack: 70, 'ab:shieldBash': 26 } } };
    GAME.cheat({});
  });
  const go = async (m, o) => { await page.evaluate(([m, o]) => CAMP.setMode(m, o), [m, o]); await wait(500); };
  // ---- the hero's Stats page, top and the runs part, and the skill web
  await go('hero', { id: 'paladin', page: 'main' });
  await page.evaluate(() => UNIT.pager.go(3, false)); await shot('01-stats');
  await page.evaluate(() => { const s = document.querySelector('#unit .pg-page.on .un-scroll'); s.scrollTop = s.scrollHeight; }); await shot('02-stats-runs');
  await page.evaluate(() => UNIT.pager.go(1, false)); await shot('03-skill-web', 900);
  await page.evaluate(() => { const n = document.querySelector('#unit .wn.stat.open, #unit .wn.stat.owned'); if (n) n.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await shot('03b-skill-web-node', 900);
  // ---- the camp: purse, the fire with the potions button, the trader, a trinket's sheet
  await page.evaluate(() => { if (window.UNIT && UNIT.close) UNIT.close(); }); await go('ground'); await shot('04-camp', 900);
  await go('fire'); await shot('05-fire');
  await page.evaluate(() => document.querySelector('[data-act="pack"]') && document.querySelector('[data-act="pack"]').click()); await shot('06-potions-pack', 700);
  await page.evaluate(() => { const b = document.querySelector('[data-act="closesheet"]'); if (b) b.click(); });
  await go('trader'); await shot('07-trader', 900);
  await page.evaluate(() => { const s = document.querySelector('#campPanel .pp-body'); if (s) s.scrollTop = 600; }); await shot('08-trader-lower');
  await page.evaluate(() => { const w = document.querySelector('[data-act^="ware:t:"]'); if (w) w.click(); }); await shot('09-trinket-sheet', 700);
  await page.evaluate(() => { const b = document.querySelector('[data-act="closesheet"]'); if (b) b.click(); });
  // ---- the Book: the trinkets grid and one trinket's page
  await page.evaluate(() => { CAMP.setMode('book'); }); await wait(600);
  await page.evaluate(() => BOOK.tab('trinkets')); await shot('10-book-trinkets');
  await page.evaluate(() => BOOK.open('trinket', 'thunderRing')); await shot('11-book-trinket', 900);
  await page.evaluate(() => { BOOK.close(); });
  await go('settings'); await page.evaluate(() => { const g = document.querySelector('.icon-picks'); if (g) g.scrollIntoView(); }); await shot('12-settings-icons', 900);
  // ---- a fight, paused on the first hero: the inspect panel (trinkets and potions, the cards' 18 px trinkets)
  if (!only.length || want('13') || want('14') || want('15')) {
    await page.evaluate(() => {
      const s = GAME.save; s.party = ['paladin', 'archer'];
      GAME.record(true);
      GAME.startRun({ theme: 'crypt', party: s.party, potions: { paladin: 1 }, elixirs: { paladin: ['ironskin'], archer: ['haste'] }, tlv: s.tlv });
    });
    for (let k = 0; k < 120; k++) { await page.evaluate(() => { for (let i = 0; i < 6; i++) GAME.recFrame(1 / 30); }); if (await page.evaluate(() => GAME.run.world.units.some((u) => u.team === 'enemy' && u.aggro && !u.dead))) break; }
    await shot('13-fight');
    const dock = await page.evaluate(() => { const r = document.getElementById('dock').getBoundingClientRect(); return { x: r.left, y: r.top - 10, width: r.width, height: r.height + 10 }; });
    await shot('14-cards-zoom', 300, dock);
    await page.evaluate(() => GAME.pause(true, 'paladin')); await page.evaluate(() => { for (let i = 0; i < 10; i++) GAME.recFrame(1 / 30); });
    await page.evaluate(() => { const b = document.querySelector('.ip-body'); if (b) b.scrollTop = 9999; }); await shot('15-inspect-items');
  }
} finally {
  await edge.close();
}
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors');
