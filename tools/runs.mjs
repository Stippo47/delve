// Headless batch of full runs in Node (no browser): checks nothing gets stuck, and measures how hard things are.
//   node tools/runs.mjs [--n 10] [--theme wildwood|warren|sewers|crypt|frost|ember|spire|dunes|foundry|all] [--seed 1] [--party paladin,archer,twinfang]
//     [--floor N] (start at floor N, a checkpoint) [--depth 1] [--boss] (start in floor 3's boss room)
//     [--level N] (every hero at level N with its points spent by progress.js autoSpend) [--max] (every node bought)
//     [--first] (level 1, the one starting point spent: tier I of the first ability) [--feel] (count jitter and stuck units)
//     [--allnodes] (every hero with every skill node, the game's ?allnodes) [--foes a,b] (only those kinds in rooms) [--v] (a line per run)
//   node tools/runs.mjs --campaign 60 [--seed 1] [--v]
//     plays a fresh save run after run like a player would: the newest open dungeon from its furthest checkpoint, the
//     highest-level heroes that fit the slots, points spent with autoSpend, heroes bought with gold when there's enough,
//     a trinket each when gold is spare; reports when each slot, boss and dungeon came.
//   [--rooms file.json] (round 14, lane L: every room's fight time, and snapshots of the long ones, for tools/long-rooms.mjs)
//   [--watch i:room[:every[:from]]] (one room of one run printed in full: run i as --v counts them (a campaign's from 1),
//     room as the room log's n; LR_WATCHV=1 adds each unit's steering. Replay a batch's run i with the batch's own --n and
//     --seed: earlier runs in a batch move the dice)
// A run is stuck if no room is finished for 420 simulated seconds, or 600 in a boss room.
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 10), seed0 = +opt('seed', 1), depth = +opt('depth', 1), level = +opt('level', 0), startFloor = +opt('floor', 1);
const boss = args.includes('--boss'), verbose = args.includes('--v');
// --bossid <id> (lane B): that designed boss in the boss room (dungeon.js ?boss=), whatever the theme
globalThis.location = { search: (boss ? '?bossroom' + (opt('floor') ? '&floor=' + opt('floor') : '') + (opt('bossid') ? '&boss=' + opt('bossid') : '') : '?x') + (args.includes('--allnodes') ? '&allnodes' : '') + (opt('foes') ? '&foes=' + opt('foes') : '') };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const feel = args.includes('--feel') ? { flips: 0, unitSecs: 0, stuck: 0, enemySecs: 0 } : null;
const DT = 1 / 60;
function feelTick(w, t) {
  for (const u of w.units) {
    if (u.dead || u.downed) continue;
    const f = u._f || (u._f = { a: u.facing, dir: 0, acc: 0, lastFlip: -9, px: u.x, py: u.y, pt: t });
    let d = u.facing - f.a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; f.a = u.facing;
    feel.unitSecs += DT;
    if (Math.abs(d) > 1e-4) { const s = Math.sign(d); if (s !== f.dir) { if (Math.abs(f.acc) > 0.5 && u.kind !== 'rat') { f.flipTs = (f.flipTs || []).filter((x) => t - x < 1.5); f.flipTs.push(t); } if (f.flipTs && f.flipTs.length >= 4) { f.flipTs = []; feel.flips++; } f.lastFlip = t; f.dir = s; f.acc = 0; } f.acc += d; }
    if (u.team === 'enemy' && u.aggro && u.target && !u.def.boss) {
      feel.enemySecs += DT;
      if (t - f.pt >= 2) { const gap = Math.hypot(u.target.x - u.x, u.target.y - u.y) - u.r - u.target.r; if (Math.hypot(u.x - f.px, u.y - f.py) < 25 && gap > (u.def.role === 'ranged' ? u.def.range : u.def.range + 40) && !u.act) feel.stuck += 2; f.px = u.x; f.py = u.y; f.pt = t; }
    }
  }
}
const { newRun, update, FLOORS } = await import('../js/dungeon.js');
const { setSeed } = await import('../js/util.js');
const { THEME_IDS } = await import('../js/themes.js');
const { HEROES, STARTERS, treeFor } = await import('../js/heroes.js');
const { freshSave } = await import('../js/save.js');
const P = await import('../js/progress.js');
const roomsOut = opt('rooms');
const rlog = roomsOut ? (await import('./room-log.mjs')).roomLog({ keep: +opt('keep', 100) }) : null;
const fsw = roomsOut ? await import('node:fs') : null;
function saveRooms() { if (rlog) fsw.writeFileSync(roomsOut, JSON.stringify({ args, rooms: rlog.rooms })); }

// --watch i:room[:every[:from]]: run i (0-based in a batch, as in --v; 1-based in a campaign), room `room` (its count in
// the run, the room log's n), printed in full every `every` seconds (default 10) from `from` seconds into the room
const watch = opt('watch') ? opt('watch').split(':').map(Number) : null;
const watchMod = watch ? await import('./room-log.mjs') : null;
// One run to its end. Returns { run, t, phase }.
function play(save, opts, meta) {
  const run = newRun(save, opts);
  if (rlog) rlog.newRun({ ...meta, lv: (opts.party || run.party).map((k) => run.heroes[k] && run.heroes[k].level) });
  const watching = watch && meta && meta.i === watch[0] - (meta.label === 'campaign' ? 1 : 0);
  let t = 0, lastRooms = run.rooms, lastT = 0, err = null, wT = 0, wNext = 0, wGeo = false;
  try {
    while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < 4000) {
      update(run, DT); t += DT;
      if (rlog) rlog.tick(run, DT);
      if (watching && run.rooms === watch[1]) {
        wT += DT;
        if (!wGeo) { wGeo = true; console.log(watchMod.geoPrint(run.world)); }
        if (wT >= (watch[3] || 0) && wT >= wNext) { wNext = wT + (watch[2] || 10); console.log(watchMod.watchPrint(run, wT)); }
      } else if (watching && run.rooms > watch[1]) { console.log(watchMod.watchPrint(run, wT)); process.exit(0); }
      if (feel) feelTick(run.world, t);
      if (run.rooms !== lastRooms) { lastRooms = run.rooms; lastT = t; }
      if (t - lastT > (run.node.kind === 'boss' ? 600 : 420)) { run.was = run.phase + (run.task ? ' task ' + run.task.type : '') + ' pickups ' + run.world.pickups.map((p) => p.type).join(',') + ' fx ' + run.world.fx.filter((f) => f.spawns && !f.done).length + ' danger ' + run.world.danger.filter((z) => z.spawns && !z.done).length; run.phase = 'stuck'; break; }
    }
  } catch (e) { err = e; run.phase = 'error'; }
  if (rlog) rlog.stop(run, run.phase === 'won' || run.phase === 'lost' || run.phase === 'retreated' ? run.phase : run.phase === 'stuck' || run.phase === 'error' ? run.phase : 'cap');
  if (run.phase === 'stuck' || run.phase === 'error') {
    const w = run.world;
    console.log(`  ${run.theme} ${run.phase} floor ${run.floor} room ${run.map.L} kind ${run.node.kind} shape ${w.shape}`, err ? err.stack : '',
      w.units.filter((u) => !u.dead).map((u) => `${u.kind}@${Math.round(u.x)},${Math.round(u.y)}${u.downed ? 'D' : ''}${u.minion ? 'm' : ''}[${u.mode}${u.target ? '>' + u.target.kind : ''}${u.forcedGoal ? ' forced' : ''} hp${Math.round(100 * u.hp / u.maxHp)}${['atkT', 'stunT', 'rootT', 'tangledT', 'frozenT', 'flinchT'].filter((k) => u[k] > 0.05).map((k) => ' ' + k + u[k].toFixed(1)).join('')}${u.act ? ' act ' + u.act.type : ''}${u.ethereal ? ' eth' : ''}]`).join(' '), 'phase', run.phase, 'waves', JSON.stringify(w.waves && { left: w.waves.left, pending: !!w.waves.pending }), 'was', run.was, 'hitstop', w.hitstop, 'roomT', Math.round(run.t), 'node', run.node.kind, 'through', run.through, 'exitT', run.exitT);
  }
  return { run, t, phase: run.phase };
}

// A save with the party at a level (points spent), or everything bought.
function buildSave(party) {
  const s = freshSave();
  for (const k of party) {
    const h = s.heroes[k]; h.owned = true;
    if (args.includes('--max')) { for (const nd of treeFor(k)) if (!nd.free) h.nodes[nd.id] = nd.max; h.level = 120; continue; }
    const lv = args.includes('--first') ? 1 : level || 1;
    h.level = lv; h.points = P.START_POINTS + lv - 1;
    P.autoSpend(s, k);
  }
  s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  return s;
}

if (opt('campaign')) campaign(+opt('campaign'));
else batch();

function batch() {
  const themes = opt('theme', 'all') === 'all' ? THEME_IDS : [opt('theme')];
  const party = opt('party', '') ? opt('party').split(',') : STARTERS.slice();
  let bad = 0;
  for (const theme of themes) {
    const res = { won: 0, lost: 0, stuck: 0, error: 0, floors: [0, 0, 0, 0], secs: 0, rooms: 0, minis: [0, 0], gold: 0, gained: 0, deaths: [] };
    for (let i = 0; i < n; i++) {
      setSeed(seed0 + i * 7919);
      const save = buildSave(party);
      const { run, t, phase } = play(save, { theme, party, depth, floor: startFloor }, { label: opt('label', ''), i });
      res[phase] = (res[phase] || 0) + 1;
      res.floors[run.floor]++; res.secs += t; res.rooms += run.rooms; res.gold += run.coins;
      run.minis.forEach((m, j) => { if (m) res.minis[j]++; });
      res.gained += party.reduce((a, k) => a + (run.heroes[k].gained || 0), 0) / party.length;
      if (phase === 'lost') res.deaths.push(`${run.floor}.${run.map.L + 1}`);
      if (verbose) console.log(`  ${theme} #${i}: ${phase} floor ${run.floor} room ${run.map.L + 1} (${run.node.kind}) rooms ${run.rooms} sim ${Math.round(t)}s gold ${run.coins} levels ${party.map((k) => run.heroes[k].level).join('/')}${run.world && run.world.bossLog ? ' boss ' + run.world.bossLog() : ''}`);
      if (phase === 'stuck' || phase === 'error') bad++;
    }
    console.log(theme.padEnd(7), `won ${res.won}/${n} lost ${res.lost} stuck ${res.stuck} err ${res.error}`, `| ended on floor 1/2/3: ${res.floors.slice(1).join('/')}`,
      `| minis ${res.minis.join('/')}`, `| avg ${Math.round(res.secs / n)}s ${Math.round(res.rooms / n)} rooms ${Math.round(res.gold / n)} gold +${(res.gained / n).toFixed(1)} lv`,
      res.deaths.length ? `| fell at ${res.deaths.sort().join(' ')}` : '');
  }
  if (feel) console.log(`feel: spinning back and forth ${(feel.flips / (feel.unitSecs / 60)).toFixed(2)} per unit-minute | enemies stuck ${(100 * feel.stuck / Math.max(1, feel.enemySecs)).toFixed(1)}% of their angry time`);
  saveRooms();
  process.exit(bad ? 1 : 0);
}

// ---------------------------------------------------------------- a campaign from a fresh save
function campaign(N) {
  const save = freshSave();
  const PREF = ['paladin', 'archer', 'cleric', 'twinfang', 'pyromancer', 'tower', 'wildmane', 'druid', 'frost', 'storm', 'bard', 'berserker', 'granny', 'necromancer', 'plague'];
  const events = [];
  const note = (i, s) => { events.push(`run ${i + 1}: ${s}`); };
  let bad = 0, totalT = 0;
  const walls = {};
  for (let i = 0; i < N; i++) {
    setSeed(seed0 + i * 7919);
    // buy heroes when there's gold for one and a free slot to fill (cheapest first, in the order above)
    for (const id of PREF) if (!save.heroes[id].owned && save.gold >= P.heroPrice(id) + 100 && P.ownedCount(save) < P.slotCount(save) + 1) { P.unlockHero(save, id); note(i, `bought ${id}`); }
    const owned = PREF.filter((id) => save.heroes[id].owned).sort((a, b) => save.heroes[b].level - save.heroes[a].level || PREF.indexOf(a) - PREF.indexOf(b));
    const party = owned.slice(0, P.slotCount(save));
    for (const k of party) P.autoSpend(save, k);
    // a common trinket for anyone without one, when gold is spare
    for (const k of party) if (!save.heroes[k].trinkets.length && save.gold > 450) { const t = P.shopTrinkets().find((x) => x.rarity === 'common'); if (t && P.buyTrinket(save, t.id)) P.equip(save, k, t.id, 0); }
    // potions: a healing draught each when there's gold to spare
    for (const k of party) if (save.gold > 300 && save.potions < party.length) P.buyPotion(save, 'heal');
    // trinket levels when rich
    for (const k of party) for (const t of save.heroes[k].trinkets) if (save.gold > 900) P.upgradeTrinket(save, t);
    const theme = P.openDungeons(save).slice(-1)[0], st = P.dungeonState(save, theme);
    save.party = party;
    // the furthest checkpoint, unless the last three runs from it all fell in its first two rooms: then one floor back
    const key = theme + st.checkpoint, wall = (walls[key] || 0) >= 3;
    const floor = wall ? Math.max(1, st.checkpoint - 1) : st.checkpoint;
    if (wall) walls[key] = 0;
    const potionFor = {}; party.forEach((k, j) => { if (j < save.potions) potionFor[k] = ['heal']; });
    const opts = P.runOptions(save, theme, potionFor, floor);
    P.payForRun(save, opts);
    opts.party = party;
    const { run, t, phase } = play(save, opts, { label: 'campaign', i });
    totalT += t;
    if (opts.floor === st.checkpoint && run.floor === opts.floor && run.map.L < 2 && phase !== 'won') walls[key] = (walls[key] || 0) + 1;
    else if (run.floor > opts.floor || run.map.L >= 2) walls[key] = 0;
    if (phase === 'stuck' || phase === 'error') { bad++; run.phase = 'lost'; }
    const rep = P.applySummary(save, run, run.phase === 'won' ? 'won' : run.phase, 0);
    for (const k of Object.keys(save.heroes)) save.heroes[k].recoverUntil = 0;
    if (rep.slots.unlocked.length) note(i, `slot ${rep.slots.after} (${rep.slots.unlocked.join(',')})`);
    if (rep.opened.length) note(i, `opened ${rep.opened.join(',')}`);
    if (rep.minis.some(Boolean)) rep.minis.forEach((m, j) => { if (m) note(i, `${theme} mini ${j + 1}`); });
    if (rep.bossKilled) note(i, `${theme} BOSS`);
    if (verbose) console.log(`  #${String(i + 1).padStart(3)} ${theme.padEnd(6)} from f${opts.floor} ${run.phase.padEnd(9)} f${run.floor}.${run.map.L + 1} party ${party.map((k) => k.slice(0, 4) + save.heroes[k].level).join(' ')} gold +${rep.gold} (-${rep.lost}) bank ${save.gold} ${Math.round(t)}s`);
  }
  console.log(events.join('\n'));
  const lv = Object.entries(save.heroes).filter(([, h]) => h.owned).map(([k, h]) => `${k} ${h.level}`).join(', ');
  console.log(`after ${N} runs (${Math.round(totalT / 60)} sim minutes, ${Math.round(totalT / N / 60)} a run): slots ${save.slots}, gold ${save.gold}, heroes: ${lv}`);
  console.log('dungeons:', Object.entries(save.dungeons).map(([k, d]) => `${k} cp${d.checkpoint} best ${d.best} boss x${d.cleared}`).join(' | '));
  saveRooms();
  process.exit(bad ? 1 : 0);
}
