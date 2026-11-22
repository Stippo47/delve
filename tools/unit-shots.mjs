// Stills and short films of the unit page and the Book (round 14, lane U) at phone size, through the installed Edge
// (headless): the Book's five grids, a hero's four pages, a monster's three at each rank, a trinket, a status, a
// dungeon, the Dev section; films of swiping between pages and of opening one hero's page from the camp and the Book.
//   node tools/unit-shots.mjs <outDir> [--port 8961] [--w 390 --h 844] [--clips] [--traits] [--only name,name]
// Needs a static server on the port (node tools/serve.mjs 8961) and playwright-core in tools/node_modules; ffmpeg on
// the path for --clips. --traits: one still of every hero's trait scene (a contact sheet for checking them by eye).
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'unit-shots'); fs.mkdirSync(out, { recursive: true });
const site = +opt('port', 8961), W = +opt('w', 390), H = +opt('h', 844), clips = args.includes('--clips'), traits = args.includes('--traits');
const only = (opt('only', '') || '').split(',').filter(Boolean);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'delve-edge-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let browser;
for (let i = 0; i < 60 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 250)); } }
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => errors.push('failed: ' + r.url().slice(0, 120)));
  page.on('response', (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errors.push('missing: ' + r.url()); });
  const want = (name) => !only.length || only.some((o) => name.includes(o));
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = async (name, ms = 450) => { if (!want(name)) return false; await wait(ms); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('shot', name); return true; };
  // the layout checks every screen gets: nothing runs off the side
  const fits = async (name) => {
    const bad = await page.evaluate(() => { const out = []; for (const root of ['#unit', '#book']) { const r0 = document.querySelector(root); if (!r0 || r0.classList.contains('hidden')) continue;
      for (const e of r0.querySelectorAll('.un-bar *, .pg-tabs *, .pg-page.on *, .bk-thing:not(.hidden) *, .un-rank *')) { if (e.closest('.treehost') || e.closest('svg')) continue; const r = e.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1)) out.push(e.className || e.tagName); } } return [...new Set(out.map(String))].slice(0, 6); });
    if (bad.length) errors.push(`${name}: runs off the side: ${bad.join(', ')}`);
  };
  // a preview stopped at a set moment, so a still is the same every run ('fire+0.3': a moment after its move goes off)
  const pose = (who, secs) => page.evaluate(([who, s]) => {
    const p = who === 'book' ? BOOK.player : UNIT.player; if (!p || !p.stage) return;
    p.resume(); p.restart(); p.stop();
    if (typeof s === 'string' && s.startsWith('fire+')) { const S = p.stage; for (let i = 0; i < 600 && !S.fired(); i++) p.advance(1 / 30, 1 / 30); p.advance(+s.slice(5)); } else p.advance(s);
  }, [who, secs]);
  await page.goto(`http://localhost:${site}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  // a save with some progress: a starter with a few nodes and a trinket, a hero with a long kit, monsters met and beaten
  await page.evaluate(() => {
    const s = GAME.save;
    s.gold = 1240; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: false }; s.potions = 2; s.elixirs = { haste: 1, ironskin: 2 }; s.runs = 9; s.wins = 2;
    for (const id of ['paladin', 'archer', 'necromancer', 'storm', 'quartermaster', 'cleric']) { s.heroes[id].owned = true; }
    Object.assign(s.heroes.paladin, { level: 7, xp: 96, points: 2, nodes: { shieldBash1: 1, shieldBashCd: 2, shieldBash2: 1, guard1: 1, offence0: 2 }, trinkets: ['ironSkin'] });
    Object.assign(s.heroes.archer, { level: 5, xp: 40, points: 1, nodes: { barrage1: 1 } });
    Object.assign(s.heroes.quartermaster, { level: 12, xp: 150, points: 0 });
    Object.assign(s.heroes.necromancer, { level: 4, xp: 20, points: 0 });
    s.party = ['paladin', 'archer']; s.tlv = { ironSkin: 2 };
    s.trinkets = ['thunderRing', 'phoenixFeather', 'frostRing'];
    s.dungeons = { wildwood: { best: 3, cleared: 2, checkpoint: 3, minis: [true, true] }, warren: { best: 2, cleared: 0, checkpoint: 2, minis: [true, false] } };
    s.seen = {};
    for (const k of ['wolf', 'slime', 'goblin', 'goblinOrange', 'slimeBig', 'slimePoison', 'direWolf', 'alpha', 'bandit', 'banditAxe', 'banditDagger', 'banditSpear', 'ent', 'elderEnt', 'sproutling', 'rat', 'orc', 'orcShaman', 'wolfRider', 'hobgoblin', 'jackal', 'rattler']) s.seen[k] = { met: 6, beaten: 5 };
    s.tally = s.tally || { foes: {}, heroes: {} };
    s.tally.foes = { wolf: { n: 41, elite: 5, major: 1 }, slime: { n: 63, elite: 4 }, goblin: { n: 58, elite: 7, major: 2 }, orcShaman: { n: 12, elite: 3, major: 1 }, elderEnt: { n: 2, boss: 2 }, bandit: { n: 22, elite: 2 }, alpha: { n: 3, mini: 3 } };
    s.tally.heroes.paladin = { runs: 9, dmg: 4210, heal: 380, kills: 96, taken: 5120, blocked: 1840, downs: 2, revives: 3, best: 61, src: { dmg: { attack: 2900, 'ab:shieldBash': 1310 }, heal: { 'ab:consecrate': 380 }, kills: { attack: 70, 'ab:shieldBash': 26 } } };
    GAME.cheat({});
  });
  // one of the quartermaster's whole web, so a long kit shows learned
  await page.evaluate(async () => { const { tierBuild } = await import('./js/heroes.js'); GAME.save.heroes.quartermaster.nodes = tierBuild('quartermaster', 2); GAME.cheat({}); });
  const openHero = async (id, pg) => { await page.evaluate(([id, pg]) => CAMP.setMode('hero', { id, page: pg }), [id, pg]); await wait(500); };
  const book = async () => { await page.evaluate(() => { BOOK && BOOK.close && document.getElementById('book') && !document.getElementById('book').classList.contains('hidden') && BOOK.close(); CAMP.setMode('book'); }); await wait(500); };

  // ---- the Book's five grids
  await book();
  for (const [i, id] of ['heroes', 'monsters', 'trinkets', 'statuses', 'dungeons'].entries()) {
    await page.evaluate((id) => BOOK.tab(id), id);
    if (await shot(`0${i + 1}-book-${id}`)) await fits('book-' + id);
  }
  // ---- a hero's four pages: a starter, and one with a long kit
  for (const [n, id] of [['10', 'paladin'], ['14', 'quartermaster']]) {
    await page.evaluate(() => CAMP.setMode('ground')); await wait(200);
    await openHero(id, 'main');
    if (await shot(`${n}-hero-${id}-main`)) await fits(id + '-main');
    await page.evaluate(() => UNIT.pager.go(1, false)); if (await shot(`${+n + 1}-hero-${id}-upgrades`, 700)) await fits(id + '-upgrades');
    await page.evaluate(() => UNIT.pager.go(2, false)); await wait(600);
    await page.evaluate((id) => UNIT.set({ move: id === 'paladin' ? 'shieldBash' : 'attack', tier: id === 'paladin' ? 2 : 1 }), id); await wait(500); await pose('unit', 1.1);
    if (await shot(`${+n + 2}-hero-${id}-preview`)) await fits(id + '-preview');
    await page.evaluate(() => UNIT.pager.go(3, false)); if (await shot(`${+n + 3}-hero-${id}-stats`)) await fits(id + '-stats');
  }
  // a locked ability still plays; a trait's scene; the lower half of a long stats page
  await page.evaluate(() => CAMP.setMode('ground')); await wait(200);
  await openHero('archer', 'preview');
  await page.evaluate(() => UNIT.set({ move: 'frostArrow', tier: 0 })); await wait(500); await pose('unit', 0.9); await shot('18-hero-archer-locked-preview');
  await page.evaluate(() => CAMP.setMode('ground')); await openHero('paladin', 'preview');
  await page.evaluate(() => UNIT.set({ move: 'trait', tier: 1 })); await wait(500); await pose('unit', 'fire+0.15'); await shot('19-hero-paladin-trait');
  await page.evaluate(() => { UNIT.pager.go(3, false); const s = document.querySelector('#unit .pg-page.on .un-scroll'); s.scrollTop = s.scrollHeight; }); await shot('19b-hero-paladin-stats-runs');
  // ---- a monster's three pages at base, elite and major (from the Book)
  await book(); await page.evaluate(() => BOOK.tab('monsters'));
  for (const [rk, name] of [[0, 'base'], [1, 'elite'], [2, 'major']]) {
    await page.evaluate((rk) => BOOK.open('foe', 'orcShaman', { rank: rk }), rk); await wait(500);
    await page.evaluate((rk) => { UNIT.state.rank = rk; UNIT.state.fmove = null; UNIT.set({}); UNIT.pager.go(0, false); }, rk);
    if (await shot(`2${rk}a-monster-${name}-overview`)) await fits('monster-overview');
    await page.evaluate(() => UNIT.pager.go(1, false)); await wait(600); await pose('unit', rk ? 'fire+0.3' : 2.4);
    if (await shot(`2${rk}b-monster-${name}-preview`)) await fits('monster-preview');
    await page.evaluate(() => UNIT.pager.go(2, false)); if (await shot(`2${rk}c-monster-${name}-stats`)) await fits('monster-stats');
    await page.evaluate(() => document.querySelector('#unit [data-un="back"]').click()); await wait(200);
  }
  // a boss: no ranks; the stats stepped to another floor
  await page.evaluate(() => BOOK.open('foe', 'elderEnt')); await wait(500); await shot('24-boss-overview');
  await page.evaluate(() => UNIT.pager.go(2, false)); await shot('24b-boss-stats');
  await page.evaluate(() => document.querySelector('#unit [data-un="back"]').click()); await wait(200);
  // ---- a trinket, a potion, statuses (a build-up at its burst; Frozen both ways), a dungeon
  await page.evaluate(() => BOOK.open('trinket', 'thunderRing')); await wait(700); await pose('book', 3.4); if (await shot('30-trinket')) await fits('trinket');
  await page.evaluate(() => { BOOK.close(); BOOK.open('trinket', 'phoenixFeather'); }); await wait(700); await pose('book', 'fire+0.5'); await shot('30b-trinket-phoenix');
  await page.evaluate(() => { BOOK.close(); BOOK.open('potion', 'haste'); }); await wait(700); await pose('book', 1.5); await shot('31-potion');
  await page.evaluate(() => { BOOK.close(); BOOK.open('status', 'burn'); }); await wait(700); await pose('book', 1.7); if (await shot('32-status-burn-building')) await fits('status');
  await pose('book', 'fire+0.2'); await shot('32b-status-burn-burst');
  await page.evaluate(() => { BOOK.close(); BOOK.open('status', 'frozen', { way: 'alone' }); }); await wait(700); await pose('book', 'fire+1.2'); await shot('33-status-frozen-left-alone');
  await page.evaluate(() => { BOOK.close(); BOOK.open('status', 'frozen', { way: 'trigger' }); }); await wait(700); await pose('book', 'fire+0.12'); await shot('33b-status-frozen-shattered');
  await page.evaluate(() => { BOOK.close(); BOOK.tab('dungeons'); BOOK.open('dungeon', 'wildwood'); }); if (await shot('34-dungeon')) await fits('dungeon');
  await page.evaluate(() => BOOK.close());
  // ---- the Dev section (Settings), and the battle page's picker without its switch
  await page.evaluate(() => { CAMP.setMode('settings'); }); await wait(500);
  await page.evaluate(() => { const b = document.querySelector('#campPanel .pp-body'); b.scrollTop = b.scrollHeight; }); await shot('40-settings-dev');
  if (want('41-battle')) { await page.evaluate(() => GAME.openBattle()); await wait(500); await page.evaluate(() => document.querySelector('[data-b="add:a"]').click()); await shot('41-battle-picker-no-dev'); await page.evaluate(() => { document.querySelector('[data-b="done"]').click(); document.querySelector('[data-b="close"]').click(); }); await wait(300); }

  // ---- every trait's scene, one still each (a moment after it first acts)
  if (traits) {
    const ids = await page.evaluate(async () => Object.keys((await import('./js/heroes.js')).HEROES));
    const dir = path.join(out, 'traits'); fs.mkdirSync(dir, { recursive: true });
    await page.evaluate(() => CAMP.setMode('ground'));
    for (const id of ids) {
      if (only.length && !only.includes(id) && !only.includes('traits')) continue;
      await page.evaluate((id) => { CAMP.setMode('ground'); CAMP.setMode('hero', { id, page: 'preview' }); UNIT.set({ move: 'trait', tier: 1 }); }, id); await wait(350);
      await pose('unit', 'fire+0.2');
      await page.screenshot({ path: path.join(dir, id + '.png'), clip: await page.evaluate(() => { const r = document.querySelector('#unit .pv-stage').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height + 96 }; }) });
    }
    console.log('trait stills in', dir);
  }

  // ---- films
  if (clips) {
    const film = async (name, secs, each, fps = 30, clip = null) => {
      const dir = fs.mkdtempSync(path.join(out, '.f-'));
      for (let i = 0; i < Math.round(secs * fps); i++) { await each(i / fps, 1 / fps, i); await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`), ...(clip ? { clip } : {}) }); }
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'), '-vf', 'scale=trunc(iw/4)*2:trunc(ih/4)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', path.join(out, name + '.mp4')]);
      fs.rmSync(dir, { recursive: true, force: true }); console.log('film', name);
    };
    const client = await page.context().newCDPSession(page);
    const touch = (type, x, y) => client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const ease = (k) => k * k * (3 - 2 * k);
    // a finger's path played over time: [[t, x, y] ...], with a dot drawn where it is
    await page.evaluate(() => { const d = document.createElement('div'); d.id = 'finger'; d.style.cssText = 'position:fixed;z-index:99;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(255,255,255,.35);box-shadow:0 0 0 2px rgba(255,255,255,.7);pointer-events:none;display:none'; document.body.appendChild(d); });
    const finger = (x, y, on) => page.evaluate(([x, y, on]) => { const d = document.getElementById('finger'); d.style.display = on ? 'block' : 'none'; d.style.left = x + 'px'; d.style.top = y + 'px'; }, [x, y, on]);
    let held = false;
    const at = async (x, y, down) => { if (down && !held) { await touch('touchStart', x, y); held = true; } else if (down) await touch('touchMove', x, y); else if (held) { await touch('touchEnd', x, y); held = false; } await finger(x, y, down); };
    if (want('clip-swipe')) {
      await page.evaluate(() => { CAMP.setMode('ground'); CAMP.setMode('hero', { id: 'paladin', page: 'main' }); }); await wait(700);
      // four swipes left through the hero's pages, one back, then a tap on a tab
      const swipes = [[0.5, 330, 60], [2.0, 330, 60], [4.2, 330, 60], [6.0, 80, 330]];
      await film('clip-swipe-hero-pages', 8.2, async (t, dt) => {
        await page.evaluate((dt) => { const p = UNIT.player; if (p && p.stage && UNIT.pager.id === 'preview') { p.stop(); p.advance(dt, dt); } }, dt);
        const s = swipes.find(([t0]) => t >= t0 && t < t0 + 0.5);
        if (s) { const k = ease((t - s[0]) / 0.45); await at(s[1] + (s[2] - s[1]) * Math.min(1, k), 560, t - s[0] < 0.46); }
        else { if (held) await at(0, 0, false); if (t > 7.4 && t < 7.45) await page.evaluate(() => document.querySelector('#unit .pg-tab').click()); }
        await wait(18);
      });
      await page.evaluate(() => { BOOK.close(); CAMP.setMode('book'); BOOK.tab('heroes'); }); await wait(600);
      const sw2 = [[0.4, 330, 60], [1.6, 330, 60], [2.8, 330, 60], [4.0, 330, 60]];
      await film('clip-swipe-book-grids', 5.4, async (t) => {
        const s = sw2.find(([t0]) => t >= t0 && t < t0 + 0.5);
        if (s) { const k = ease((t - s[0]) / 0.45); await at(s[1] + (s[2] - s[1]) * Math.min(1, k), 500, t - s[0] < 0.46); } else if (held) await at(0, 0, false);
        await wait(18);
      });
    }
    if (want('clip-same')) {
      // the same hero's page from the camp (a tap on the hero) and from the Book (a tap on its card)
      await page.evaluate(() => { BOOK.close(); CAMP.setMode('ground'); }); await wait(1500);
      const where = await page.evaluate(() => CAMP.scene.screenOf({ type: 'hero', id: 'paladin' }));
      const card = async () => page.evaluate(() => { const r = document.querySelector('#book [data-bk="hero:paladin"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 30 }; });
      let c = null;
      await film('clip-same-page-camp-and-book', 10.5, async (t, dt, i) => {
        const near = (a) => t >= a && t < a + dt;
        if (t > 0.6 && t < 1.0) await finger(where.x, where.y, true); else if (t >= 1.0 && t < 1.1) await finger(0, 0, false);
        if (near(1.0)) await page.mouse.click(where.x, where.y);
        if (near(3.6)) await page.evaluate(() => document.querySelector('#unit [data-un="back"]').click());
        if (near(4.6)) await page.evaluate(() => { CAMP.setMode('book'); BOOK.tab('heroes'); });
        if (near(5.6)) c = await card();
        if (c && t > 5.7 && t < 6.2) await finger(c.x, c.y, true); else if (t >= 6.2 && t < 6.3) await finger(0, 0, false);
        if (near(6.2) && c) await page.mouse.click(c.x, c.y);
        if (near(9.2)) await page.evaluate(() => document.querySelector('#unit [data-un="back"]').click());
        await wait(30);
      }, 20);
    }
    if (want('clip-status')) {
      await page.evaluate(() => { BOOK.close(); CAMP.setMode('book'); BOOK.tab('statuses'); BOOK.open('status', 'frozen'); }); await wait(900);
      await page.evaluate(() => { BOOK.player.restart(); BOOK.player.stop(); });
      const box = await page.evaluate(() => { const r = document.querySelector('.bk-thing .th-body').getBoundingClientRect(); return { x: 0, y: 0, width: innerWidth, height: Math.min(innerHeight, Math.ceil(r.top + 150)) }; });
      await film('clip-status-frozen-both-ways', 13, async (t, dt) => { await page.evaluate((dt) => BOOK.player.advance(dt, dt), dt); await wait(150); }, 30, box);
      await page.evaluate(() => { BOOK.close(); BOOK.open('status', 'burn'); }); await wait(900);
      await page.evaluate(() => { BOOK.player.restart(); BOOK.player.stop(); });
      await film('clip-status-burn-meter', 6, async (t, dt) => { await page.evaluate((dt) => BOOK.player.advance(dt, dt), dt); await wait(150); }, 30, box);
    }
    if (want('clip-trait')) {
      for (const id of (opt('trait', 'paladin,frost,twinfang,pyromancer,cleric') || '').split(',')) {
        await page.evaluate((id) => { BOOK.close(); CAMP.setMode('ground'); CAMP.setMode('hero', { id, page: 'preview' }); UNIT.set({ move: 'trait', tier: 1 }); }, id); await wait(700);
        await page.evaluate(() => { UNIT.player.resume(); UNIT.player.restart(); UNIT.player.stop(); });
        const box = await page.evaluate(() => { const r = document.querySelector('#unit .pv-cap').getBoundingClientRect(); return { x: 0, y: 0, width: innerWidth, height: Math.min(innerHeight, Math.ceil(r.top + 130)) }; });
        const secs = await page.evaluate(() => Math.min(9, UNIT.player.stage.fit ? UNIT.player.stage.fit.max : UNIT.player.stage.loop));
        await film('clip-trait-' + id, Math.min(7.5, secs), async (t, dt) => { await page.evaluate((dt) => UNIT.player.advance(dt, dt), dt); }, 30, box);
      }
    }
    if (want('clip-locked')) {
      await page.evaluate(() => { BOOK.close(); CAMP.setMode('ground'); CAMP.setMode('hero', { id: 'archer', page: 'preview' }); UNIT.set({ move: 'barrage', tier: 0 }); }); await wait(700);
      await page.evaluate(() => { UNIT.player.resume(); UNIT.player.restart(); UNIT.player.stop(); });
      await film('clip-locked-ability-still-plays', 3.4, async (t, dt) => { await page.evaluate((dt) => UNIT.player.advance(dt, dt), dt); });
    }
  }
} catch (e) { errors.push('script: ' + (e.stack || e)); }
console.log(errors.length ? 'ERRORS\n' + [...new Set(errors)].join('\n') : 'no errors');
// close the browser over CDP, then make sure nothing is left
try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close'); } catch {}
try { await browser.close(); } catch {}
try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
