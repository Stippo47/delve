import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:8811/index.html?seed=99');
const out = await p.evaluate(async () => { localStorage.clear(); let wins = 0, n = 0;
  for (let s = 0; s < 30; s++) { GAME.startRun(GAME.save.depth); let t = 0; while (GAME.run.phase !== 'won' && GAME.run.phase !== 'lost' && t < 1200) { GAME.fastForward(2); t += 2; }
    if (t >= 1200) return 'STUCK at ' + JSON.stringify({ phase: GAME.run.phase, f: GAME.run.floor, r: GAME.run.room });
    n++; if (GAME.run.phase === 'won') wins++; GAME.endRun(GAME.run.phase); document.getElementById('toCamp').click(); }
  return `runs ${n}, wins ${wins}, reached depth ${GAME.save.maxDepth}, levels ` + Object.values(GAME.save.heroes).map(h => h.level).join('/'); });
console.log(out); console.log(errs.join('\n') || 'no errors'); await b.close();
