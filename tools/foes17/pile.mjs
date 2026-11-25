// Round 18 (lane foes17b): replay tools/foes17/stage/snake-run.js headless and log when a chain's links pile up
// (two links not side by side nearer than 0.6 of a gap), with what the head was doing.
//   node tools/foes17/pile.mjs [kind] [seed]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const kind = process.argv[2] || 'chainCrawler', seed = +(process.argv[3] || 3);
const B = await import('../../js/battle.js'); const { setSeed } = await import('../../js/util.js'); const { freshSave } = await import('../../js/save.js');
const fs = await import('node:fs');
const save = freshSave(); save.cheat = true; setSeed(seed);
const run = B.newBattle(save, { arena: 'crypt', a: [{ k: 'paladin', n: 1 }], b: [{ k: kind, n: 1 }] });
globalThis.GAME = { run, recFrame: (dt) => B.updateBattle(run, dt) };
globalThis.import_ = null;
for (let i = 0; i < 12; i++) GAME.recFrame(1 / 60);
let src = fs.readFileSync(new URL('./stage/snake-run.js', import.meta.url), 'utf8').replace("import('./js/path.js')", "import('../../js/path.js')");
(0, eval)(src);
const w = run.world, u = w.units.find((o) => o.segs), R = Math.round;
let t = 0, last = '';
for (; t < 10; t += 1 / 30) {
  GAME.recFrame(1 / 30);
  const segs = u.segs.filter((s) => !s.dead && !s.hidden), g = segs[0].gap; let worst = 9, wi = 0, wj = 0;
  for (let i = 0; i < segs.length; i++) for (let j = i + 2; j < segs.length; j++) { const d = Math.hypot(segs[i].x - segs[j].x, segs[i].y - segs[j].y) / g; if (d < worst) { worst = d; wi = i; wj = j; } }
  const hd = Math.min(...segs.slice(1).map((s) => Math.hypot(s.x - u.x, s.y - u.y) / g));
  const line = `${t.toFixed(2)} mode ${u.mode} tgt ${u.target && u.target.kind}@${u.target && R(u.target.x)},${u.target && R(u.target.y)} fear ${u.fearT > 0} esc ${!!u.escape} head ${R(u.x)},${R(u.y)} v ${R(Math.hypot(u.vx, u.vy))} k ${R(Math.hypot(u.kx, u.ky))} rush ${!!(u.el && u.el.rush)} act ${u.act ? u.act.type : '-'} hp ${R(u.hp)} links ${worst.toFixed(2)} (${wi},${wj}) head-to-body ${hd.toFixed(2)}`;
  if (worst < 0.6 || hd < 0.6 || Math.round(t * 30) % 15 === 0) console.log(line);
}
