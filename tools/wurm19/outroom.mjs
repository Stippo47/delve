// Lane wurm19: when is a ring of it outside the room, or lying in a column? (state, which ring, how far out, how high)
globalThis.location = { search: '?bossroom&boss=sandWurm' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const party = ['paladin', 'archer', 'cleric', 'twinfang'], cnt = {}, low = {};
for (let i = 0; i < 12; i++) {
  setSeed(1 + i * 7919);
  const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = 51; h.points = P.START_POINTS + 50; P.autoSpend(s, k); }
  s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  const run = newRun(s, { theme: 'dunes', party, depth: 1, floor: 1 });
  let t = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && t < 900) { update(run, 1 / 60); t += 1 / 60;
    const w = run.world, b = w.units.find((u) => u.sw); if (!b) continue; const k = b.sw;
    for (const p of [b, ...k.parts]) { if (p.hidden || p.dead) continue;
      if (p.x < 10 || p.y < 10 || p.x > w.W - 10 || p.y > w.H - 10) { const key = 'out ' + k.st + (k.act ? '+act' : '') + ' ' + (p === b ? 'head' : 'ring'); cnt[key] = (cnt[key] || 0) + 1 / 60; }
      for (const c of w.pillars) if (Math.hypot(p.x - c.x, p.y - c.y) < c.r + p.r * 0.5) { const key = 'column ' + k.st + (k.act ? '+act' : '') + ' ' + ((p.hop || 0) > 30 ? 'high' : 'low'); cnt[key] = (cnt[key] || 0) + 1 / 60; } }
  }
}
console.log(Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v.toFixed(1)} s`).join('\n'));
