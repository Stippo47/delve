// Catch-up check (round 14): three levelled heroes carry a level 1 hero through a dungeon, run after run on one save.
// Prints the newcomer's level, and the carriers', after each run.
//   node tools/carry.mjs [--theme crypt] [--level 33] [--runs 10] [--seed 1] [--party paladin,cleric,pyromancer] [--new archer]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newRun, update } = await import('../js/dungeon.js');
const { setSeed } = await import('../js/util.js');
const { freshSave } = await import('../js/save.js');
const P = await import('../js/progress.js');
const theme = opt('theme', 'crypt'), level = +opt('level', 33), runs = +opt('runs', 10), seed = +opt('seed', 1);
const carriers = opt('party', 'paladin,cleric,pyromancer').split(','), fresh = opt('new', 'archer');
const s = freshSave();
for (const k of [...carriers, fresh]) {
  const h = s.heroes[k]; h.owned = true; h.level = k === fresh ? 1 : level; h.points = P.START_POINTS + h.level - 1; P.autoSpend(s, k);
}
s.party = [...carriers, fresh]; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
for (const id of P.DUNGEON_ORDER) { s.dungeons[id] = s.dungeons[id] || {}; s.dungeons[id].open = true; if (id === theme) break; s.dungeons[id].cleared = 1; }
console.log(`${theme}: ${carriers.join(', ')} at level ${level} carrying ${fresh} from level 1`);
for (let i = 0; i < runs; i++) {
  setSeed(seed + i * 7919);
  const opts = P.runOptions(s, theme, {}, 1); opts.party = s.party.slice();
  const run = newRun(s, opts);
  let t = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < 4000) { update(run, 1 / 60); t += 1 / 60; }
  P.applySummary(s, run, run.phase === 'won' ? 'won' : run.phase, 0);
  for (const k of Object.keys(s.heroes)) s.heroes[k].recoverUntil = 0;
  P.autoSpend(s, fresh);
  console.log(`  run ${String(i + 1).padStart(2)} ${run.phase.padEnd(5)} floor ${run.floor} room ${run.map.L + 1} (${Math.round(t)}s): ${fresh} ${s.heroes[fresh].level} | ${carriers.map((k) => k.slice(0, 4) + ' ' + s.heroes[k].level).join(', ')}`);
}
