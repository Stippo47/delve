// Lane toggles19: quick stills of one staged scene with the two switches set through the address, plus the page's
// console errors. Needs the lane's server (node tools/serve.mjs 8963 .).
//   node tools/toggles19/stills.mjs <outPrefix> --q "outlines=0&hpbars=0" [--battle "rat*3|paladin"] [--run] [--camp] [--at 1,3,5]
import { openEdge, sweepProfile } from '../edge.mjs';
import path from 'node:path';
import fs from 'node:fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0]); fs.mkdirSync(path.dirname(out), { recursive: true });
const port = opt('port', '8963'), q = opt('q', ''), battle = opt('battle', ''), ats = opt('at', '2').split(',').map(Number);
const W = +opt('w', 390), H = +opt('h', 844), zoom = opt('zoom');
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
const kill = () => sweepProfile(edge.prof);
setTimeout(() => { console.error('stills: too long'); kill(); process.exit(2); }, 240000).unref();
try {
  const ctx = await edge.browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e)); page.on('response', (r) => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()); }); page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text() + ' @ ' + (m.location() && m.location().url)); });
  await page.goto(`http://localhost:${port}/?seed=${opt('seed', 3)}${q ? '&' + q : ''}`);
  await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000, polling: 200 });
  if (args.includes('--camp')) { await page.waitForTimeout(1500); for (const t of ats) { await page.waitForTimeout(t * 100); await page.screenshot({ path: `${out}-camp${t}.png` }); } }
  else {
    await page.evaluate(async ([b, arena, run]) => {
      const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
      GAME.save.cheat = true;
      if (run) { GAME.record(true); GAME.startRun(1); return; }
      const [red, blue] = b.split('|'); for (const s of parse(blue)) if (GAME.save.heroes[s.k]) GAME.save.heroes[s.k].owned = true;
      GAME.record(true); GAME.startBattle({ arena, a: parse(blue), b: parse(red) });
    }, [battle, opt('arena', 'crypt'), args.includes('--run')]);
    if (zoom) await page.evaluate(async (z) => { (await import('/js/render.js')).setZoom(+z); }, zoom);
    let T = 0;
    // --flip: after the first still, both switches go off in the running game (no reload), as the Settings switches do
    for (const t of ats) { const n = Math.round((t - T) * 30); await page.evaluate((n) => { for (let i = 0; i < n; i++) GAME.recFrame(1 / 30); }, n); T = t; await page.screenshot({ path: `${out}-t${t}.png` });
      if (args.includes('--flip') && t === ats[0]) await page.evaluate(async () => { (await import('/js/util.js')).setOutlines(false); (await import('/js/hpstyle.js')).setHpBars(false); }); }
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
} finally { await edge.close(); }
