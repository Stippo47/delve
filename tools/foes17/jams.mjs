// Every time a troll in a dungeon run lets its boulder be because it got nowhere (foes9.js BOULDER_JAM): where it
// was, what it was after, what was round it.  node tools/foes17/jams.mjs <theme> <n> [secs]
const [theme, N, SECS] = process.argv.slice(2);
globalThis.location = { search: '?foes=' + (process.env.FOES || 'troll,rockTroll') };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const DG = await import('../../js/dungeon.js'), HE = await import('../../js/heroes.js'), P = await import('../../js/progress.js');
const { setSeed } = await import('../../js/util.js'); const { freshSave } = await import('../../js/save.js');
const { pathClear } = await import('../../js/path.js');
const kinds = new Set((process.env.FOES || 'troll,rockTroll').split(','));
const R = Math.round; let jams = 0, kinds2 = {};
for (let i = 0; i < +N; i++) {
  setSeed(700 + i * 7919);
  const s = freshSave(); for (const k of HE.STARTERS) { s.heroes[k].owned = true; s.heroes[k].level = 6; s.heroes[k].points = P.START_POINTS + 5; P.autoSpend(s, k); }
  s.party = HE.STARTERS.slice(); s.unlocks = { slotMini1: true, slotBoss1: true };
  const run = DG.newRun(s, { theme, party: HE.STARTERS.slice(), depth: 1, floor: 1 });
  let t = 0; const last = new Map();
  while (run.phase !== 'won' && run.phase !== 'lost' && t < +(SECS || 600)) {
    DG.update(run, 1 / 60); t += 1 / 60;
    const w = run.world;
    for (const u of w.units) if (kinds.has(u.kind) && !u.dead) {
      const r0 = last.get(u) || 0, r1 = u.bouldRest || 0; last.set(u, r1);
      if (!(r1 > 5.9 && r0 <= 0)) continue;
      jams++; const b = u.bould, tg = u.target;
      const inRoom = tg && tg.x > 0 && tg.y > 0 && tg.x < w.W && tg.y < w.H;
      const clear = tg && pathClear(w, u.x, u.y, tg.x, tg.y, 4);
      const near = w.walls.filter((r) => u.x > r.x - 100 && u.x < r.x + r.w + 100 && u.y > r.y - 100 && u.y < r.y + r.h + 100).length;
      const mates = w.units.filter((o) => o !== u && !o.dead && o.team === u.team && Math.hypot(o.x - u.x, o.y - u.y) < u.r + o.r + 20).length;
      const pressed = tg && b && Math.hypot(tg.x - b.x, tg.y - b.y) < b.r + tg.r + 40;
      const why = (b && b.held ? 'holding' : 'fetching') + (!tg ? ', no target' : !inRoom ? ', target out of the room' : pressed ? ', target at the boulder' : '');
      kinds2[why] = (kinds2[why] || 0) + 1;
      console.log(`run ${i} t ${t.toFixed(1)} ${u.kind}#${u.id} @${R(u.x)},${R(u.y)} tgt ${tg && tg.kind}@${tg && R(tg.x)},${tg && R(tg.y)} gap ${tg ? R(Math.hypot(tg.x - u.x, tg.y - u.y) - u.r - tg.r) : '-'} ${why} lineclear ${clear} walls near ${near} friends touching ${mates} boulder @${b && R(b.x)},${b && R(b.y)} path ${u.path ? u.path.length : '-'} room ${w.W}x${w.H} spd ${R(u.spd)} dv ${R(u.dvx)},${R(u.dvy)}`);
    }
  }
}
console.log('jams', jams, JSON.stringify(kinds2));
