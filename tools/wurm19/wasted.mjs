// Lane wurm19: how many blows land on the wurm's head while it is under the sand (each kept off: nothing happens), and
// how many abilities are cast with it as the target then. Per fight.   node tools/wurm19/wasted.mjs [--n 20]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 20), level = +opt('level', 51);
globalThis.location = { search: '?bossroom&boss=sandWurm' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const A = await import('../../js/stats.js');
const AUDIT = A.AUDIT;
const party = opt('party', 'paladin,archer,cleric,twinfang').split(',');
let blows = 0, casts = 0, castsAll = 0, secs = 0; const byAb = {};
AUDIT.on = (what, w, u, src, amt, o) => {
  if (what === 'keep' && u && u.sw && u.hidden && o && o.why === 'invuln' && !o.dot) blows++;
  if (what === 'cast' && u && u.team === 'hero') { castsAll++; const b = w.units.find((x) => x.sw); if (b && b.hidden && u.target === b) { casts++; byAb[o.ab] = (byAb[o.ab] || 0) + 1; } }
};
for (let i = 0; i < n; i++) {
  setSeed(1 + i * 7919);
  const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(s, k); }
  s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  const run = newRun(s, { theme: 'dunes', party, depth: 1, floor: 1 });
  let t = 0; while (run.phase !== 'won' && run.phase !== 'lost' && t < 900) { update(run, 1 / 60); t += 1 / 60; } secs += t;
}
console.log(`${party.join(',')}: blows on the buried head ${(blows / n).toFixed(1)} a fight; abilities cast with it as the target while it is under ${(casts / n).toFixed(1)} of ${(castsAll / n).toFixed(1)} a fight (${Object.entries(byAb).map(([k, v]) => k + ' ' + (v / n).toFixed(1)).join(', ')}); ${Math.round(secs / n)} s a fight`);
