import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message + '\n' + e.stack));
await p.goto('http://localhost:8811/index.html?seed=' + (process.argv[2] || 11));
await p.waitForTimeout(600);
const out = await p.evaluate(async () => {
  const res = [];
  localStorage.clear();
  for (let i = 0; i < 6; i++) {
    const d = GAME.save.depth;
    GAME.startRun(d);
    let t = 0, events = {};
    const w0 = () => GAME.run.world;
    const t0 = performance.now();
    while (GAME.run && GAME.run.phase !== 'won' && GAME.run.phase !== 'lost' && t < 900) {
      GAME.fastForward(1); t += 1;
      for (const x of GAME.run.world.texts) events[x.s.replace(/[0-9]+/g,'#')] = (events[x.s.replace(/[0-9]+/g,'#')]||0) + 1;
    }
    const r = GAME.run;
    const ph = r.phase;
    const summary = { depth: d, phase: ph, sim_s: t, ms: Math.round(performance.now() - t0), floor: r.floor, room: r.room, kills: r.kills, coins: r.coins, satchel: r.satchel.length,
      levels: Object.entries(GAME.save.heroes).map(([k, v]) => k[0] + v.level).join(' '),
      ev: Object.entries(events).filter(([k]) => /[A-Z]{3}|dodge|thaw|key|found/.test(k)).map(([k,v]) => k+':'+v).join(' ') };
    GAME.endRun(ph === 'won' ? 'won' : ph === 'lost' ? 'lost' : 'retreated');
    document.getElementById('toCamp').click();
    res.push(summary);
  }
  return res;
});
for (const r of out) console.log(JSON.stringify(r));
console.log(errs.join('\n') || 'no errors');
await b.close();
