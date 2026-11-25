// staging for tools/clip.mjs --eval: a chain enemy on open floor, the hero far off: a straight run, a stop (its head
// held 1.2 s at 2 s), a sharp turn (the hero moved behind it at 3.6 s), a hard knock straight back into its own body
// at 6.6 s, then on again. Its body is laid out again straight behind it where it is put (it was put here from
// across the room: its old trail would drag it round).
(() => { const w = GAME.run.world, u = w.units.find((o) => o.segs || (o.def.chain)), h = w.units.find((o) => o.team !== u.team && !o.dead && !o.linkTo);
  w.walls = w.walls.filter((r) => !r.grid); w.pillars = []; import('./js/path.js').then((P) => P.buildGrid(w));
  u.x = 520; u.y = 260; u.facing = u.mvA = 0; u.vx = u.vy = 0;
  if (u.segs) { u.trail = []; for (let d = 0; d <= 520; d += 3) u.trail.push({ x: u.x - d, y: u.y }); }
  if (u.bur) u.bur.t = 1e9; else u.bur = { state: 'up', t: 1e9 };
  h.x = 1180; h.y = 620; h.rootT = 1e9; h.hp = h.maxHp = 1e6; h.dmgMul = 0; u.hp = u.maxHp = 1e6; u.aggro = true; u.target = h;
  const f0 = GAME.recFrame; let T = 0;
  GAME.recFrame = (dt) => { const t0 = T; T += dt; const at = (s) => t0 < s && T >= s;
    if (at(2)) u.rootT = 1.2;
    if (at(3.6)) { h.x = 120; h.y = 820; }
    if (at(6.6)) { const a = Math.atan2(u.vy, u.vx) + Math.PI; u.kx = Math.cos(a) * 650; u.ky = Math.sin(a) * 650; } // (back the way it was going)
    const e = u.el || (u.el = {}); e.strike = 99; e.lunge = 99; // (no strikes in this one: the walk only)
    return f0(dt); };
})();
