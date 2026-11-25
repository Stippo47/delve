// Lane drake19: one fight in Node, a line every third of a second: where it is, where it is going (its pass), what it does.
//   node tools/drake19/dbg2.mjs [seed] [query, e.g. bossmove=bite] [party] [seconds]
globalThis.location = { search: '?bossroom&boss=cinder' + (process.argv[3] ? '&' + process.argv[3] : '') };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const party = (process.argv[4] || 'paladin,twinfang,cleric').split(','), level = 44;
setSeed(+process.argv[2] || 3); const s = freshSave();
for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(s, k); }
s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
const run = newRun(s, { theme: 'ember', party, depth: 1, floor: 1 });
let t = 0, n = 0; const R = Math.round, end = +process.argv[5] || 16;
while (run.phase !== 'won' && run.phase !== 'lost' && t < end) {
  update(run, 1 / 60); t += 1 / 60;
  const w = run.world, b = w.units.find((u) => u.kind === 'cinder' && u.cd); if (!b || !b.cd.phase || b.dead) continue;
  const k = b.cd, g = k.pass, tg = b.target;
  if (n++ % (+process.argv[6] || 20) === 0 && t >= (+process.argv[7] || 0)) console.log(t.toFixed(2), k.mv, 'at', R(b.x), R(b.y), 'f', b.facing.toFixed(2), 'mvA', b.mvA.toFixed(2), 'spd', R(b.spd), 'pace', R(k.pace || 0), 'pass', g ? `${R(g.x)},${R(g.y)} t=${g.t.toFixed(1)}${g.on ? ' on' : ''}` : '-', 'mark', tg ? `${tg.kind} ${R(tg.x)},${R(tg.y)}` : '-', 'wish', Math.atan2(b.sdy, b.sdx).toFixed(2), 'gap', k.gap.toFixed(2));
}
