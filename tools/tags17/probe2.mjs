import { openEdge } from '../edge.mjs';
const edge = await openEdge(); const ctx = await edge.browser.newContext({ viewport: { width: 844, height: 390 } }); const page = await ctx.newPage();
await page.goto('http://localhost:8971/?seed=5'); await page.waitForFunction(() => window.GAME && GAME.state === 'camp' && GAME.ready, null, { timeout: 60000 });
const r = await page.evaluate(async () => {
  GAME.save.cheat = true; GAME.record(true); GAME.startBattle({ arena: 'crypt', a: [{ k: 'pyromancer', n: 1 }], b: [{ k: 'imp', n: 1 }] });
  const w = GAME.run.world, i = w.units.find((u) => u.kind === 'imp'); const out = [];
  i.hx = i.x; i.hy = i.y; for (let f = 0; f < 20; f++) { i.forcedGoal = { x: i.hx, y: i.hy }; GAME.recFrame(1 / 30); out.push([i.rootT, i.forcedGoal ? 1 : 0].join(':')); }
  return out.join(' ') + ' | ' + JSON.stringify(Object.keys(i).filter((k) => /root/i.test(k)).map((k) => [k, i[k]]));
});
console.log(r); await edge.close(); process.exit(0);
