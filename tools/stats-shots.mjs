// Stills of the run stats (round 9, lane T) at phone size, through the installed Edge (headless): a real run played
// fast to its result card (the top, the leaders, the party, a hero opened to its sources, the enemies defeated), then
// a hero's About page (its real numbers and lifetime totals) and the book with the defeated counts.
//   node tools/stats-shots.mjs <outDir> [--port 8854] [--seed 4] [--w 390 --h 844] [--theme crypt] [--secs 260]
//     [--party paladin,necromancer,pyromancer,cleric] [--mercs]
import { openEdge } from './edge.mjs';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] || 'stats-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8854), seed = +opt('seed', 4), W = +opt('w', 390), H = +opt('h', 844), theme = opt('theme', 'crypt'), secs = +opt('secs', 260);
const party = opt('party', 'paladin,necromancer,pyromancer,cleric').split(',');
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] }); // tools/edge.mjs: one headless Edge, closed cleanly
const browser = edge.browser;
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = async (name, ms = 400) => { await page.waitForTimeout(ms); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); };
  const scrollTo = (sel, pad = 8) => page.evaluate(([sel, pad]) => { const s = document.querySelector('#result .r-scroll'), t = document.querySelector(sel); if (s && t) s.scrollTop += t.getBoundingClientRect().top - s.getBoundingClientRect().top - pad; }, [sel, pad]);
  await page.goto(`http://localhost:${site}/?seed=${seed}`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(([party, mercs, theme]) => {
    const s = GAME.save; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.party = party; s.potions = 4;
    const AB = { paladin: ['shieldBash', 'guard', 'consecrate'], necromancer: ['raiseDead', 'lifeDrain', 'boneSpear'], pyromancer: ['fireball', 'flameWall', 'inferno'], cleric: ['mend', 'sanctuary', 'smite'], archer: ['barrage', 'frostArrow', 'roll'] };
    for (const id of party) { const h = s.heroes[id]; h.owned = true; h.level = 9; h.nodes = Object.fromEntries((AB[id] || []).map((a) => [a + '1', 1])); h.nodes.offence0 = 2; }
    s.heroes[party[0]].trinkets = ['ironSkin', 'thunderRing']; s.heroes[party[0]].nodes.slot2 = 1;
    if (party[1]) s.heroes[party[1]].trinkets = ['boneCharm']; if (party[2]) s.heroes[party[2]].trinkets = ['impLantern']; if (party[3]) s.heroes[party[3]].trinkets = ['vampTooth'];
    s.tlv = { ironSkin: 2, impLantern: 2 };
    s.seen = {};
    GAME.startRun({ theme, party, mercs, potions: { [party[0]]: 1 }, elixirs: {}, tlv: s.tlv });
  }, [party, args.includes('--mercs'), theme]);
  await page.evaluate((secs) => { GAME.fastForward(secs); const r = GAME.run; if (!r.summary) { r.leaving = true; GAME.fastForward(200); }
    GAME.endRun(r.phase === 'won' || r.phase === 'lost' ? r.phase : 'retreated'); }, secs);
  await shot('01-result-top', 1800);
  await scrollTo('.rstats');
  await shot('02-result-leaders');
  await scrollTo('.rs-row');
  await shot('03-result-party');
  const open = party.find((k) => k === 'necromancer') || party[0];
  await page.evaluate((k) => document.querySelector(`[data-rs="${k}"]`).click(), open);
  await scrollTo(`[data-rs="${open}"]`);
  await shot('04-result-hero-sources');
  await scrollTo('.foes', 40);
  await shot('05-result-defeated');
  // the card's own measure: it must scroll inside, and the button stay on screen
  const fit = await page.evaluate(() => { const c = document.querySelector('.rcard').getBoundingClientRect(), b = document.querySelector('.r-foot .btn').getBoundingClientRect();
    const s = document.querySelector('.r-scroll'); return { cardBottom: c.bottom, btnBottom: b.bottom, h: innerHeight, scrolls: s.scrollHeight > s.clientHeight }; });
  console.log('fit', JSON.stringify(fit));
  if (fit.btnBottom > fit.h + 1) errors.push('result: the button is off screen');
  await page.click('[data-act="home"]', { force: true });
  await page.waitForTimeout(600);
  await page.evaluate((k) => CAMP.setMode('hero', { id: k, sub: 'about' }), party[0]);
  await shot('06-about-numbers', 900);
  await page.evaluate(() => { const b = document.querySelector('#campPanel .pp-body'); if (b) b.scrollTop = 9999; });
  await shot('07-about-lifetime');
  await page.evaluate(() => CAMP.setMode('book'));
  await shot('08-book-counts', 900);
  await page.click('[data-act^="beast:"] >> nth=0', { force: true }).catch(() => {});
  await shot('09-beast-sheet', 600);
} finally {
  await edge.close();
  console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no page errors');
}
