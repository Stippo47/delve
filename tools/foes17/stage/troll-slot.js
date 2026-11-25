// staging for tools/clip.mjs --eval: the troll's boulder in a ring of rocks, its one gap too narrow for the troll
(() => { const w = GAME.run.world, u = w.units.find((o) => o.kind === 'troll' || o.kind === 'rockTroll'), h = w.units.find((o) => o.team !== u.team && !o.dead);
  w.walls = w.walls.filter((r) => !r.grid); w.pillars = w.pillars.filter((p) => p.owner);
  for (let a = 40; a <= 320; a += 28) w.pillars.push({ x: 640 + Math.cos(a * Math.PI / 180) * 92, y: 470 + Math.sin(a * Math.PI / 180) * 92, r: 36, prop: 'rock' });
  const b = u.bould; u.x = 960; u.y = 520; u.facing = u.mvA = Math.PI; u.vx = u.vy = u.kx = u.ky = 0; u.bJam = null; u.bouldRest = 0;
  b.x = 640; b.y = 470; b.vx = b.vy = 0; b.held = false;
  h.x = 300; h.y = 430; h.rootT = 1e9; h.hp = h.maxHp = 1e5; h.dmgMul = 0;
  import('./js/path.js').then((P) => P.buildGrid(w)); })();
