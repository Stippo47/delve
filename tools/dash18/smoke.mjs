// Round 18, lane dash18: a smoke test of the six dashes in Node (no browser). Each is started on a hero and on an
// enemy in a small battle, stepped to its end, and what it hit is printed; any throw fails.
//   node tools/dash18/smoke.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const SIM = await import('../../js/sim.js');
const DZ = await import('../../js/dashes.js');
const save = freshSave(); save.cheat = true;
let bad = 0;
function stage(a, b) {
  setSeed(7); const run = B.newBattle(save, { arena: 'crypt', a, b }); const w = run.world;
  w.pillars = []; w.walls = w.walls.filter((r) => r.solid);
  return { run, w };
}
function go(name, mk) {
  try {
    const { w, u, foes } = mk(); let hits = 0; const hp0 = foes.map((f) => f.hp);
    let t = 0; while (u.act && u.act.dv && t < 4) { SIM.step(w, 1 / 60); t += 1 / 60; }
    for (let i = 0; i < 30; i++) SIM.step(w, 1 / 60);
    const lost = foes.map((f, i) => Math.round(hp0[i] - f.hp));
    console.log(`${name.padEnd(26)} ${t.toFixed(2)}s  took ${lost.join(',')}  at ${Math.round(u.x)},${Math.round(u.y)}${u.act ? '  STILL ACTING ' + u.act.type : ''}`);
    if (u.act && u.act.dv) bad++;
  } catch (e) { bad++; console.log(name, 'THREW', e.stack.split('\n').slice(0, 4).join(' | ')); }
}
const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; if (a != null) u.facing = u.mvA = a; u.stunT = 0; };
const freeze = (list) => { for (const f of list) { f.stunT = 99; f.maxHp *= 5; f.hp = f.maxHp; } };
for (const side of ['hero', 'enemy']) {
  const mk = (heroKind, foeKind, n, f) => () => {
    const { w } = side === 'hero' ? stage([{ k: heroKind, n: 1 }], [{ k: foeKind, n }]) : stage([{ k: foeKind, n }], [{ k: heroKind, n: 1 }]);
    const u = w.units.find((x) => x.kind === heroKind), foes = w.units.filter((x) => x.kind === foeKind);
    const cx = w.W / 2, cy = w.H / 2; put(u, cx - 160, cy, 0); foes.forEach((e, i) => put(e, cx + i * 60, cy + (i % 2 ? 26 : -20) * (i ? 1 : 0), Math.PI)); freeze(foes);
    w.actor = u; f(w, u, foes); w.actor = null; return { w, u, foes };
  };
  const H = side === 'hero' ? 'samurai' : 'rattler', F = side === 'hero' ? 'rattler' : 'samurai';
  go(side + ' drawCut', mk(H, F, 3, (w, u, foes) => DZ.drawCut(w, u, { a: 0, len: 320, dmg: 20, hit: { knock: 100 } })));
  go(side + ' drawCut lance again', mk(H, F, 3, (w, u, foes) => DZ.drawCut(w, u, { a: 0, len: 320, dmg: 20, lance: true, hit: {}, again: () => ({ a: Math.PI, len: 300, tell: 0.1 }) })));
  go(side + ' blinkChain', mk(H, F, 4, (w, u, foes) => DZ.blinkChain(w, u, { targets: foes.slice(0, 3), n: 3, dmg: 15, hit: {} })));
  go(side + ' hook', mk(H, F, 2, (w, u, foes) => DZ.hook(w, u, { t: foes[0], dmg: 30, hit: {}, graze: 0.4 })));
  go(side + ' feint', mk(H, F, 2, (w, u, foes) => DZ.feint(w, u, { t: foes[0], dmg: 12, hit: {} })));
  go(side + ' feint out', mk(H, F, 2, (w, u, foes) => DZ.feint(w, u, { a: Math.PI, len: 150 })));
  go(side + ' dragFling', mk(H, F, 3, (w, u, foes) => DZ.dragFling(w, u, { a: 0, len: 300, dmg: 20, knock: 300, hit: {} })));
  go(side + ' pounce', mk(H, F, 2, (w, u, foes) => DZ.pounce(w, u, { t: foes[0], dmg: 16, hit: { knock: 100 } })));
}
console.log(bad ? `${bad} problems` : 'all six ran to their end');
process.exit(bad ? 1 : 0);
