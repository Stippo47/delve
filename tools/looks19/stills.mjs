// Lane looks19: full-resolution stills of one staged fight (or the camp) under several looks, the same frame each,
// in one headless Edge. Needs the lane's server (node tools/serve.mjs 8971 .).
//   node tools/looks19/stills.mjs <outDir> --v "ink:olcolor=ink,own:olcolor=own,px2:pixel=2" [--battle "a*2,b|paladin,archer"]
//     [--arena crypt] [--q "bossroom&boss=cinder&theme=ember"] [--party paladin,archer,cleric --level 6] [--at 2,4]
//     [--zoom 1.1] [--camp] [--seed 3] [--w 414 --h 896] [--prefix fight]
// Each still: <outDir>/<prefix>-t<secs>-<variant>.png. Also prints the page's errors and the mean draw time per frame.
import { openEdge, sweepProfile } from '../edge.mjs';
import path from 'node:path';
import fs from 'node:fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const outDir = path.resolve(args[0]); fs.mkdirSync(outDir, { recursive: true });
const port = opt('port', '8971'), battle = opt('battle', ''), ats = opt('at', '2').split(',').map(Number), prefix = opt('prefix', 'fight');
const W = +opt('w', 414), H = +opt('h', 896), zoom = opt('zoom'), extra = opt('q', '');
const variants = opt('v', 'ink:olcolor=ink').split(',').map((s) => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; });
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
setTimeout(() => { console.error('stills: too long'); sweepProfile(edge.prof); process.exit(2); }, +opt('max', 600) * 1000).unref();
const SPEND = `async (s, ids) => { const P = await import('./js/progress.js'); for (const id of ids) { const h = s.heroes[id]; if (!h) continue; h.points = Math.max(0, P.START_POINTS + h.level - 1 - P.spentPoints(s, id)); P.autoSpend(s, id); } }`;
try {
  const ctx = await edge.browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  for (const [name, vq] of variants) {
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test((m.location() && m.location().url) || '')) errs.push('console ' + m.text()); });
    const q = [extra, vq].filter(Boolean).join('&');
    await page.goto(`http://localhost:${port}/?seed=${opt('seed', 3)}${q ? '&' + q : ''}`);
    await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000, polling: 200 });
    if (args.includes('--camp')) {
      await page.waitForTimeout(2500);
      if (opt('campeval')) { await page.evaluate((js) => (0, eval)(js), opt('campeval')); await page.waitForTimeout(1500); }
      await page.screenshot({ path: path.join(outDir, `${prefix}-${name}.png`) }); console.log(name, errs.length ? errs.join('\n') : 'ok'); await page.close(); continue;
    }
    await page.evaluate(async ([b, arena, party, level, SPEND]) => {
      const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
      const s = GAME.save; s.cheat = true;
      if (!b) { if (party) { s.unlocks = { ...(s.unlocks || {}), slotMini1: true, slotBoss1: true }; for (const id of party.split(',')) { s.heroes[id].owned = true; s.heroes[id].level = level; } s.party = party.split(','); }
        await (0, eval)(SPEND)(s, s.party || []); GAME.record(true); GAME.startRun(1); return; }
      const [red, blue] = b.split('|'); const ids = [...new Set([...parse(red), ...parse(blue)].map((x) => x.k))].filter((k) => s.heroes[k]);
      for (const k of ids) s.heroes[k].owned = true; await (0, eval)(SPEND)(s, ids);
      GAME.record(true); GAME.startBattle({ arena, a: parse(blue), b: parse(red) });
    }, [battle, opt('arena', 'crypt'), opt('party', ''), +opt('level', 6), SPEND]);
    if (zoom) await page.evaluate(async (z) => { (await import('/js/render.js')).setZoom(+z); }, zoom);
    let T = 0;
    for (const t of ats) {
      const n = Math.round((t - T) * 30);
      const ms = await page.evaluate((n) => { let tot = 0; for (let i = 0; i < n; i++) { const a = performance.now(); GAME.recFrame(1 / 30); tot += performance.now() - a; } return tot / Math.max(1, n); }, n); T = t;
      // two settle frames with no time passing, so async pictures (rigs at a new size) are in
      await page.waitForTimeout(300); await page.evaluate(() => { GAME.recFrame(0); }); await page.waitForTimeout(200); await page.evaluate(() => { GAME.recFrame(0); });
      await page.screenshot({ path: path.join(outDir, `${prefix}-t${t}-${name}.png`) });
      console.log(`${name} t${t}: ${ms.toFixed(2)} ms/frame (step + draw)`);
    }
    console.log(name, errs.length ? errs.join('\n') : 'no errors');
    await page.close();
  }
} finally { await edge.close(); }
