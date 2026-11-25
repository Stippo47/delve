// staging for tools/clip.mjs --eval: the yeti's snowball stopped in the room's corner, the hero out in the room
(() => { const w = GAME.run.world, u = w.units.find((o) => o.kind === 'yeti'), h = w.units.find((o) => o.team !== u.team && !o.dead);
  w.walls = w.walls.filter((r) => !r.grid); w.pillars = w.pillars.filter((p) => p.owner);
  const b = u.snow; u.x = 260; u.y = 260; u.facing = u.mvA = -2.4; u.vx = u.vy = u.kx = u.ky = 0; if (u.yt) { u.yt.heave = null; u.yt.rest = 0; u.yt.brawl = 0; u.yt.haul = null; }
  b.x = b.r + 1; b.y = b.r + 1; b.vx = b.vy = 0; b.held = false;
  h.x = 470; h.y = 400; h.rootT = 1e9; h.dmgMul = 0; h.hp = h.maxHp = 1e5;
  import('./js/path.js').then((P) => P.buildGrid(w)); })();
