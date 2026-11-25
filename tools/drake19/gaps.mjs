// Lane drake19: fights in Node; where it goes a long while without a move, a line a second of what it was doing.
//   node tools/drake19/gaps.mjs [fights 16] [gap seconds 10]
globalThis.location = { search: '?bossroom&boss=cinder' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const party = ['paladin', 'archer', 'cleric', 'twinfang'], level = 44, R = Math.round, N = +process.argv[2] || 16, G = +process.argv[3] || 10;
let shown = 0;
for (let i = 0; i < N && shown < 3; i++) {
  setSeed(1 + i * 7919); const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(s, k); }
  s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  const run = newRun(s, { theme: 'ember', party, depth: 1, floor: 1 });
  let t = 0, last = 0, buf = [], n = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && t < 600) {
    update(run, 1 / 60); t += 1 / 60;
    const w = run.world, b = w.units.find((u) => u.kind === 'cinder' && u.cd); if (!b || !b.cd.phase || b.dead) continue;
    const k = b.cd, tg = b.target, e = b.el || {};
    if (k.mv !== 'prowl' && k.mv !== 'hold' || k.swing) { if (t - last > G && shown++ < 3) { console.log(`fight ${i}: nothing from ${last.toFixed(1)} to ${t.toFixed(1)}`); for (const l of buf) console.log('  ' + l); } last = t; buf = []; }
    else if (n++ % 60 === 0) buf.push(`${t.toFixed(1)} ${k.mv} at ${R(b.x)},${R(b.y)} f ${b.facing.toFixed(2)} spd ${R(Math.hypot(b.vx, b.vy))} pace ${R(k.pace || 0)} jam ${(k.jam || 0).toFixed(1)} behind ${!!k.behind} mark ${tg ? tg.kind + ' ' + R(tg.x) + ',' + R(tg.y) + ' d ' + R(Math.hypot(tg.x - b.x, tg.y - b.y)) : '-'} gap ${k.gap.toFixed(1)} due ${['bite', 'claw', 'scorch', 'rush', 'lash'].map((m) => m[0] + (e[m] ?? 0).toFixed(0)).join(' ')} heroes ${w.units.filter((u) => u.team === 'hero' && !u.dead && !u.downed).map((h) => h.kind[0] + R(h.x) + ',' + R(h.y)).join(' ')}`);
  }
}
