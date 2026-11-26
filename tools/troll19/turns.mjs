// Lane troll19: how a troll-shaped kind turns its boulder to face a hero off to its side or behind it (the staged
// scenes turn90 / turn135 / turn180 of tools/troll19/stage.js). Until the boulder is on the line from the troll to the
// hero (within 0.25 rad): how long it took, how far the troll's feet went, how far the boulder went. Before the lane the
// troll stood and the boulder swung round it; after, the troll walks round and the boulder shifts a little.
//   node tools/troll19/turns.mjs [--n 10] [--kinds troll,rockTroll,rockTroll@1,yeti]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const FS = await import('node:fs'), PATH = await import('node:path'), URL_ = await import('node:url');
const here = PATH.dirname(URL_.fileURLToPath(import.meta.url));
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { buildGrid } = await import('../../js/path.js');
const DT = 1 / 60, N = +opt('n', 10);
const save = freshSave(); save.cheat = true;
(0, eval)(FS.readFileSync(PATH.join(here, 'stage.js'), 'utf8'));
T19.regrid = (w) => { const own = w.pillars.filter((p) => p.owner); w.pillars = w.pillars.filter((p) => !p.owner); buildGrid(w); w.pillars.push(...own); };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
for (const kind of opt('kinds', 'troll,rockTroll,rockTroll@1,yeti').split(',')) for (const scene of ['turn90', 'turn135', 'turn180']) {
  let secs = 0, feet = 0, ball = 0, done = 0;
  for (let i = 0; i < N; i++) {
    setSeed(900 + i);
    const [k, rank] = kind.split('@');
    const run = B.newBattle(save, { arena: 'crypt', a: [{ k: 'paladin', n: 1 }], b: [{ k, n: 1, rank: +rank || 0 }] });
    globalThis.GAME = { run };
    const u = run.sides.b[0];
    for (const q of [...run.sides.a, ...run.sides.b]) q.maxHp = q.hp = 1e6;
    for (let j = 0; j < 30; j++) B.updateBattle(run, DT);
    if (u.yt) for (let j = 0; j < 300 && !(u.snow && !u.snow.packing); j++) B.updateBattle(run, DT);
    const S = T19.stage(scene), h = S.h;
    let px = u.x, py = u.y, b = T19.ballOf(u), bx = b.x, by = b.y, f = 0, bl = 0, t = 0;
    for (; t < 12; t += DT) {
      B.updateBattle(run, DT);
      b = T19.ballOf(u); if (!b) break;
      f += Math.hypot(u.x - px, u.y - py); bl += Math.hypot(b.x - bx, b.y - by); px = u.x; py = u.y; bx = b.x; by = b.y;
      const on = Math.abs(wrap(Math.atan2(b.y - u.y, b.x - u.x) - Math.atan2(h.y - u.y, h.x - u.x)));
      if (on < 0.25 && Math.hypot(b.x - u.x, b.y - u.y) < u.r + b.r + 10) { done++; break; }
    }
    secs += t; feet += f; ball += bl;
  }
  console.log(`${kind.padEnd(12)} ${scene.padEnd(8)} boulder on the line in ${(secs / N).toFixed(1)}s (${done}/${N}); the troll's feet went ${(feet / N).toFixed(0)}, the boulder ${(ball / N).toFixed(0)}`);
}
