// Lane wurm19: win rates with some of the wurm's numbers changed, without editing the file (SW is read as it goes).
//   node tools/wurm19/sweep.mjs [--n 60] [--level 51] [--party a,b,c,d] [--set breach.dmg=64,lunge.dmg=80,hp=700] [--scale 0.8] (all its blows x0.8)
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 60), level = +opt('level', 51);
globalThis.location = { search: '?bossroom&boss=sandWurm' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { SW, WURM } = await import('../../js/boss-wurm.js');
const P = await import('../../js/progress.js');
if (opt('scale')) for (const k of ['breach', 'lunge', 'inhale', 'coil']) SW[k].dmg *= +opt('scale');
if (opt('scale')) SW.breach.landDmg *= +opt('scale');
for (const kv of (opt('set', '') || '').split(',').filter(Boolean)) { const [path, v] = kv.split('='); if (path === 'hp') { WURM.defs.sandWurm.hp = +v; continue; } const ks = path.split('.'); let o = SW; for (const k of ks.slice(0, -1)) o = o[k]; o[ks[ks.length - 1]] = +v; }
const party = opt('party', 'paladin,archer,cleric,twinfang').split(',');
let won = 0, secs = 0, wsecs = 0;
for (let i = 0; i < n; i++) {
  setSeed(+opt('seed', 1) + i * 7919);
  const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(s, k); }
  s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  const run = newRun(s, { theme: 'dunes', party, depth: 1, floor: 1 });
  let t = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && t < 900) { update(run, 1 / 60); t += 1 / 60; }
  if (run.phase === 'won') { won++; wsecs += t; } secs += t;
}
console.log(`${opt('set', '') || 'as it is'}${opt('scale') ? ' x' + opt('scale') : ''} | level ${level} ${party.join(',')}: won ${won}/${n} (${Math.round(100 * won / n)}%), ${Math.round(secs / n)} s a fight, wins ${won ? Math.round(wsecs / won) : '-'} s`);
