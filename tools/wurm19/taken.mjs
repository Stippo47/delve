// Lane wurm19: what the party loses health to, by what the wurm is doing at that moment (and to its brood).
//   node tools/wurm19/taken.mjs [--n 20] [--level 51]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 20), level = +opt('level', 51);
globalThis.location = { search: '?bossroom&boss=sandWurm' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const party = opt('party', 'paladin,archer,cleric,twinfang').split(',');
const lost = {}, downs = {}, healed = { n: 0 }; let won = 0, secs = 0, idle = 0, hsecs = 0, moved = 0;
for (let i = 0; i < n; i++) {
  setSeed(1 + i * 7919);
  const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(s, k); }
  s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  const run = newRun(s, { theme: 'dunes', party, depth: 1, floor: 1 });
  let t = 0; const prev = new Map();
  while (run.phase !== 'won' && run.phase !== 'lost' && t < 900) {
    update(run, 1 / 60); t += 1 / 60;
    const w = run.world, b = w.units.find((u) => u.sw); if (!b) continue;
    const st = b.sw.st + (b.sw.act ? '+act' : '');
    for (const h of w.units) { if (h.team !== 'hero' || h.summon) continue; const p = prev.get(h);
      if (p) { if (h.hp < p.hp - 0.01) lost[st] = (lost[st] || 0) + (p.hp - h.hp) / h.maxHp; if (h.hp > p.hp + 0.01 && !p.downed) healed.n += (h.hp - p.hp) / h.maxHp; if (h.downed && !p.downed) downs[st] = (downs[st] || 0) + 1;
        if (!h.downed) { hsecs += 1 / 60; if (!h.target) idle += 1 / 60; moved += Math.hypot(h.x - p.x, h.y - p.y); } }
      prev.set(h, { hp: h.hp, downed: h.downed, x: h.x, y: h.y }); }
  }
  if (run.phase === 'won') won++; secs += t;
}
const f = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / n).toFixed(2)}`).join('  ');
console.log(`won ${won}/${n}, ${Math.round(secs / n)} s a fight`);
console.log('health lost (hero-healths a fight) while it was in:', f(lost));
console.log('heroes downed a fight while it was in:', f(downs));
console.log(`healed ${(healed.n / n).toFixed(2)} hero-healths a fight; no target ${(100 * idle / hsecs).toFixed(1)}% of the time; walked ${Math.round(moved / hsecs)} a second`);
