// staging for tools/clip.mjs --eval: a chain enemy on open floor: a straight run at the hero, a sharp turn (the hero
// moved behind it at 3 s), a stop (its head held 1.5 s at 6.5 s), a knock back into its own body at 8.5 s
(() => { const w = GAME.run.world, u = w.units.find((o) => o.segs || (o.def.chain)), h = w.units.find((o) => o.team !== u.team && !o.dead && !o.linkTo);
  w.walls = w.walls.filter((r) => !r.grid); w.pillars = []; import('./js/path.js').then((P) => P.buildGrid(w));
  u.x = 260; u.y = 300; u.facing = u.mvA = 0; if (u.bur) u.bur.t = 1e9; else u.bur = { state: 'up', t: 1e9 };
  h.x = 1150; h.y = 560; h.rootT = 1e9; h.hp = h.maxHp = 1e6; h.dmgMul = 0; u.hp = u.maxHp = 1e6;
  const f0 = GAME.recFrame; let T = 0;
  GAME.recFrame = (dt) => { const t0 = T; T += dt; const at = (s) => t0 < s && T >= s;
    if (at(3)) { h.x = 180; h.y = 760; }
    if (at(6.5)) u.rootT = 1.5;
    if (at(8.5)) { u.kx = Math.cos(u.facing + Math.PI) * 650; u.ky = Math.sin(u.facing + Math.PI) * 650; }
    const e = u.el || (u.el = {}); e.strike = 99; e.lunge = 99; // (no strikes in this one: the walk only)
    return f0(dt); };
})();
