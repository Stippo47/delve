// What each dungeon's battle arena holds (hazards hurt or soak whoever stands in them): node tools/audit/foes/arenas.mjs
import { boot } from './lib.mjs';
const G = await boot();
const { DUNGEON_ORDER } = await import('../../../js/themes.js');
for (const id of DUNGEON_ORDER) {
  const seen = {};
  for (let s = 0; s < 20; s++) { G.setSeed(s); const w = G.D.battleRoom(id, { W: 1280, H: 960, obstacles: 5 }); for (const h of w.hazards) seen[h.type] = (seen[h.type] || 0) + 1; seen.walls = (seen.walls || 0) + w.walls.length; seen.pillars = (seen.pillars || 0) + w.pillars.length; }
  console.log(id.padEnd(9), JSON.stringify(seen));
}
