// Lane rider19: a staged scene run headless, printing the ball and the heroes every few steps.
//   node tools/rider19/probe.mjs <scene> [blue=paladin] [secs=4] [every=6]
globalThis.location = { search: '?x' }; globalThis.DBG19 = process.env.DBG;
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const [scene = 'line', blue = 'paladin', secs = 4, every = 6] = process.argv.slice(2);
const B = await import('../../js/battle.js'); const { setSeed } = await import('../../js/util.js'); const { freshSave } = await import('../../js/save.js');
const fs = await import('node:fs');
setSeed(7); const save = freshSave(); save.cheat = true;
const run = B.newBattle(save, { arena: 'warren', a: blue.split(',').map((k) => ({ k, n: 1 })), b: [{ k: 'tumbleTroll', n: 1 }] });
globalThis.GAME = { run };
for (let i = 0; i < 60; i++) B.updateBattle(run, 1 / 60);
(0, eval)(fs.readFileSync('tools/rider19/stage.js', 'utf8').replace("import('./js/path.js')", "import('../../js/path.js')"));
const S = R19.stage(scene); console.log('ball at stage', S.u.bould && S.u.bould.body && S.u.bould.body.hp, S.u.bould && S.u.bould.body && S.u.bould.body.maxHp); await new Promise((r) => setTimeout(r, 50));
const f = (n) => Math.round(n);
for (let i = 0; i < secs * 60; i++) {
  B.updateBattle(run, 1 / 60);
  const u = S.u, b = u.bould, R = u.ride;
  if (i % every === 0) console.log((i / 60).toFixed(2), b ? `ball hp ${b.body ? f(b.body.hp) : '-'} u ${f(u.hp)} ${f(b.x)},${f(b.y)} sp ${R ? f(R.sp) : '-'} head ${R ? R.head.toFixed(2) : '-'} teeter ${R ? R.teeter.toFixed(2) : '-'} out ${R && R.out > run.world.time ? 1 : 0}` : `on foot ${f(u.x)},${f(u.y)} hp ${f(u.hp)}`, '|', S.hs.map((h) => `${h.kind[0]}${f(h.x)},${f(h.y)}${h.stunT > 0 ? '*' : ''}`).join(' '));
}
