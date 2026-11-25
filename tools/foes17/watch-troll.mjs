// Watch one troll in a dungeon run (tools/foes17/boulders.mjs --dungeon's seeds): every `every` s from `from` s,
// where it is, what it wants, what is round it.  node tools/foes17/watch-troll.mjs <theme> <i> <from> <to> [every]
const [theme, I, FROM, TO, EVERY] = process.argv.slice(2);
globalThis.location = { search: '?foes=' + (process.env.FOES || 'troll,rockTroll') };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const DG = await import('../../js/dungeon.js'), HE = await import('../../js/heroes.js'), P = await import('../../js/progress.js');
const { setSeed } = await import('../../js/util.js'); const { freshSave } = await import('../../js/save.js');
const kinds = new Set((process.env.FOES || 'troll,rockTroll').split(','));
setSeed(700 + +I * 7919);
const s = freshSave(); for (const k of HE.STARTERS) { s.heroes[k].owned = true; s.heroes[k].level = 6; s.heroes[k].points = P.START_POINTS + 5; P.autoSpend(s, k); }
s.party = HE.STARTERS.slice(); s.unlocks = { slotMini1: true, slotBoss1: true };
// (the same dice as boulders.mjs: it runs N runs one after another from setSeed each, so run i is replayed alone)
const run = DG.newRun(s, { theme, party: HE.STARTERS.slice(), depth: 1, floor: 1 });
let t = 0, next = +FROM; const R = Math.round;
while (t < +TO) {
  DG.update(run, 1 / 60); t += 1 / 60;
  if (t < next) continue; next += +(EVERY || 0.5);
  const w = run.world;
  for (const u of w.units) if (kinds.has(u.kind) && !u.dead) {
    const b = u.bould;
    const near = w.walls.filter((r) => u.x > r.x - 120 && u.x < r.x + r.w + 120 && u.y > r.y - 120 && u.y < r.y + r.h + 120).map((r) => `[${R(r.x)},${R(r.y)} ${R(r.w)}x${R(r.h)}]`).join('');
    const pil = w.pillars.filter((p) => p !== b && Math.hypot(p.x - u.x, p.y - u.y) < 200).map((p) => `(${R(p.x)},${R(p.y)} r${R(p.r)}${p.owner ? ' boulder' : ''})`).join('');
    console.log(`t ${t.toFixed(1)} ${u.kind}#${u.id} @${R(u.x)},${R(u.y)} r${R(u.r)} mode ${u.mode} tgt ${u.target && u.target.kind}@${u.target && R(u.target.x)},${u.target && R(u.target.y)} dv ${R(u.dvx)},${R(u.dvy)} v ${R(u.vx)},${R(u.vy)} spd ${R(u.spd)} boulder ${b ? `@${R(b.x)},${R(b.y)} r${b.r} ${b.held ? 'held' : 'loose'} v${R(Math.hypot(b.vx, b.vy))}` : '-'} rest ${(u.bouldRest || 0).toFixed(1)} jam ${u.bJam ? u.bJam.t.toFixed(1) : '-'} hold ${u.el && u.el.holdT > 0 ? u.el.holdT.toFixed(2) : '-'} path ${u.path ? u.path.map((p) => R(p.x) + ',' + R(p.y)).join(' ') : '-'} walls ${near} pillars ${pil} room ${w.W}x${w.H}`);
  }
}
