// Headless batch of full runs in Node (no browser): checks nothing gets stuck, per dungeon type.
//   node tools/runs.mjs [--n 10] [--theme crypt|sewers|warren|all] [--seed 1] [--party paladin,archer,twinfang] [--depth 1]
//   [--boss] (start in floor 3's boss room) [--lvl N]
// A run is stuck if no room is finished for 300 simulated seconds (the biggest rooms take 150+).
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 10), seed0 = +opt('seed', 1), depth = +opt('depth', 1), lvl = +opt('lvl', 0);
const boss = args.includes('--boss');
// debug switches the game reads from the address
globalThis.location = { search: (boss ? '?bossroom' : '?x') + (lvl ? '&lvl=' + lvl : '') };
const { newRun, update, FLOORS } = await import('../js/dungeon.js');
const { setSeed } = await import('../js/util.js');
const { THEME_IDS } = await import('../js/themes.js');
const themes = opt('theme', 'all') === 'all' ? THEME_IDS : [opt('theme')];
const party = opt('party', '') ? opt('party').split(',') : undefined;
const DT = 1 / 60;
let stuck = 0;
for (const theme of themes) {
  const res = { won: 0, lost: 0, stuck: 0, floors: [0, 0, 0, 0], secs: 0, rooms: 0, bossT: [] };
  for (let i = 0; i < n; i++) {
    setSeed(seed0 + i * 7919);
    const save = { heroes: {}, depth };
    const run = newRun(save, { theme, party, depth });
    const w0 = Date.now();
    let t = 0, lastRooms = run.rooms, lastT = 0, bossStart = null, errs = null;
    try {
      while (run.phase !== 'won' && run.phase !== 'lost' && t < 3600) {
        update(run, DT); t += DT;
        if (run.rooms !== lastRooms) { lastRooms = run.rooms; lastT = t; if (args.includes('--arrive') && run.node.kind === 'boss' && run.floor === FLOORS) console.log('   arrive', run.world.units.filter((u) => u.team === 'hero').map((h) => h.kind + ':' + Math.round(100 * h.hp / h.maxHp) + '% lv' + h.level + ' pots' + h.potions).join(' '), 'downed', run.party.filter((k) => run.heroes[k].down).join(',')); }
        if (bossStart == null && run.floor === FLOORS && run.world.units.some((u) => u.def.boss && !u.dead)) bossStart = t; // the last boss is up
        if (t - lastT > 300) { run.stuckIn = run.phase + ' hitstop ' + run.world.hitstop + ' t ' + run.t + ' exitT ' + run.exitT + ' doorK ' + run.doorK + ' doors ' + JSON.stringify(run.world.doors) + ' task ' + (run.task && run.task.type) + ' pickups ' + run.world.pickups.map((p) => p.type + '@' + Math.round(p.x) + ',' + Math.round(p.y)).join(' ') + ' water ' + JSON.stringify(run.world.water) + ' enemies ' + run.world.units.filter((u) => u.team === 'enemy' && !u.dead).length + ' wp ' + JSON.stringify(run.world.wp) + ' toVisit ' + JSON.stringify(run.world.toVisit); run.phase = 'stuck'; break; }
      }
    } catch (e) { errs = e; run.phase = 'error'; }
    if (args.includes('--v')) console.log(`  ${theme} #${i}: ${run.phase} floor ${run.floor} in ${run.node.kind} rooms ${run.rooms} sim ${Math.round(t)}s wall ${Math.round((Date.now() - w0) / 1000)}s levels ${run.party.map((k) => run.heroes[k].level).join('/')}`);
    if (bossStart != null && (run.phase === 'won' || run.phase === 'lost')) res.bossT.push(Math.round(t - bossStart) + (run.phase === 'won' ? 'w' : 'l'));
    res[run.phase] = (res[run.phase] || 0) + 1;
    res.floors[run.floor]++; res.secs += t; res.rooms += run.rooms;
    if (run.phase === 'stuck' || run.phase === 'error') {
      stuck++;
      const w = run.world;
      console.log(run.stuckIn); console.log(`  ${theme} #${i} ${run.phase} floor ${run.floor} room ${run.map.L} kind ${run.node.kind} shape ${w.shape} phase ${run.phase}`, errs ? errs.stack : '',
        w.units.filter((u) => !u.dead).map((u) => `${u.kind}@${Math.round(u.x)},${Math.round(u.y)}${u.downed ? 'D' : ''}`).join(' '));
    }
  }
  console.log(theme.padEnd(7), `won ${res.won} lost ${res.lost} stuck ${res.stuck || 0} err ${res.error || 0}`, `| ended on floor 1/2/3: ${res.floors.slice(1).join('/')}`,
    `| avg ${Math.round(res.secs / n)}s ${Math.round(res.rooms / n)} rooms`, res.bossT.length ? `| final boss fights (s): ${res.bossT.join(' ')}` : '');
}
process.exit(stuck ? 1 : 0);
