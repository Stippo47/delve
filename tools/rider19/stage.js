// Lane rider19 (round 19): staged scenes for the tumble troll, evaluated in the page (tools/rider19/clip.sh) or in Node.
// A battle "tumbleTroll|<heroes>" must be running (GAME.run). The room's own crates and rocks are cleared.
//   cross   open floor, one hero far across the room, free to walk: the troll rides over to him
//   line    four heroes stood in a row down its way (held for its first half second), harmless and very tough: it rolls through them
//   wall    the hero stood near the room's left edge, the troll rolling up at him at full pace: it throws him aside, rolls
//           on into the wall: the crash, the teeter
//   break   three heroes that do hurt; its ball nearly broken (40 health left): the ball breaks, it falls, fights on foot
//   live    nothing staged but the clean room (the whole fight)
(() => {
  const R19 = (globalThis.R19 = globalThis.R19 || {});
  R19.stage = (name) => {
    const run = GAME.run, w = run.world;
    const u = w.units.find((q) => !q.dead && q.kind === 'tumbleTroll');
    const hs = w.units.filter((q) => !q.dead && q.team !== u.team && q.team !== 'neutral' && !q.ballOf);
    w.walls = w.walls.filter((r) => !r.grid); w.pillars = w.pillars.filter((p) => p.owner);
    const W = w.W, H = w.H, b = u.bould;
    const at = (q, x, y) => { q.x = x; q.y = y; q.vx = q.vy = q.kx = q.ky = q.dvx = q.dvy = 0; };
    const ride = (x, y, head, sp = 0) => { at(u, x, y); if (b) { b.x = x; b.y = y; b.vx = b.vy = 0; } const R = u.ride; if (R) { R.head = head; R.sp = sp; R.teeter = 0; } u.facing = head; u.aggro = true; };
    const tough = (q, harmless = true) => { q.maxHp = q.hp = 1e6; if (harmless) q.dmgMul = 0; };
    if (name === 'cross') { ride(240, H / 2, 0); at(hs[0], W - 240, H / 2); tough(hs[0]); u.target = hs[0]; }
    if (name === 'line') { ride(220, H / 2, 0, 0); hs.forEach((h, i) => { at(h, W / 2 - 150 + i * 135, H / 2 + (i % 2 ? 18 : -18)); tough(h); h.rootT = 0.6; }); u.target = hs[hs.length - 1]; u.maxHp = u.hp = 1e6; if (b && b.body) b.body.maxHp = b.body.hp = 1e6; }
    if (name === 'wall') { ride(W / 2 + 60, H / 2, Math.PI, 205); at(hs[0], 150, H / 2 - 8); tough(hs[0]); hs[0].rootT = 1e9; u.target = hs[0]; if (b && b.body) b.body.maxHp = b.body.hp = 1e6; }
    if (name === 'break') { ride(W / 2 + 200, H / 2, Math.PI, 0); const pos = [[W / 2 - 160, H / 2 - 40], [W / 2 - 300, H / 2 + 60], [W / 2 - 180, H / 2 + 110]]; hs.forEach((h, i) => { if (pos[i]) at(h, ...pos[i]); h.maxHp = h.hp = 600; }); u.maxHp = u.hp = 400; if (b && b.body) b.body.hp = Math.min(b.body.maxHp, 40); }
    if (name === 'live') { /* as the game made it */ }
    w.W += 0.01;
    import('./js/path.js').then((P) => P.buildGrid(w));
    return { run, w, u, hs, h: hs[0] };
  };
})();
