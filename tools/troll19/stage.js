// Lane troll19 (round 19): staged scenes for the troll-shaped units (troll, rock troll, yeti), shared by the headless
// test (tools/troll19/walls.mjs evaluates this text in Node) and the clips (tools/clip.mjs --eval "<this text>;T19.stage('wall')").
// A battle "troll|paladin" (or rockTroll, yeti; any hero) must be running: GAME.run is it. The room is cleared of its
// own crates and rocks, then the scene's walls and rocks are put in, the hero is set where the scene wants it (rooted,
// harmless, very tough: it is there to be pushed), the troll a little way off with its boulder in its hands.
(() => {
  const T19 = (globalThis.T19 = globalThis.T19 || {});
  const ballOf = (u) => u.bould || u.snow || null;
  T19.ballOf = ballOf;
  // name: wall | corner | thin | pillar | door | crate | push | turn90 | turn135 | turn180 | live | friends
  T19.stage = (name, o = {}) => {
    const run = GAME.run, w = run.world;
    const u = w.units.find((q) => !q.dead && (q.kind === 'troll' || q.kind === 'rockTroll' || q.kind === 'yeti'));
    const hs = w.units.filter((q) => !q.dead && q.team !== u.team && q.team !== 'neutral');
    const h = hs[0];
    w.walls = w.walls.filter((r) => !r.grid); w.pillars = w.pillars.filter((p) => p.owner);
    const b = ballOf(u), br = b ? b.r : 41;
    const put = (tx, ty, fa, hx, hy, root = true) => {
      u.x = tx; u.y = ty; u.facing = u.mvA = fa; u.vx = u.vy = u.kx = u.ky = u.dvx = u.dvy = 0; u.spd = 0; u.chg = null; u.bJam = null; u.bouldRest = 0; u.home = { x: tx, y: ty };
      if (u.yt) { u.yt.heave = null; u.yt.rest = 0; u.yt.brawl = 0; u.yt.haul = null; }
      if (b) { const d = u.snow ? u.r * 0.82 + b.r : u.r * 0.54 + b.r + 8; b.x = tx + Math.cos(fa) * d; b.y = ty + Math.sin(fa) * d; b.vx = b.vy = 0; b.held = true; if (b.lastX != null) { b.lastX = b.x; b.lastY = b.y; } }
      h.x = hx; h.y = hy; h.vx = h.vy = h.kx = h.ky = 0; h.facing = Math.atan2(ty - hy, tx - hx);
      for (const q of hs) { q.maxHp = q.hp = 1e6; if (!o.fight) q.dmgMul = 0; if (root && q === h) q.rootT = 1e9; }
      u.maxHp = u.hp = 1e6; u.target = h; u.aggro = true;
    };
    const W = w.W, H = w.H, up = -Math.PI / 2;
    const S = {
      // the hero with its back to the room's top edge, the troll coming straight at it
      wall: () => put(W / 2, 330, up, W / 2, h.r + 2),
      // the hero in the room's corner
      corner: () => put(300, 300, -Math.PI * 0.75, h.r + 2, h.r + 2),
      // the hero against a thin wall standing in the room (36 thick): pushed into it, does it come out the far side?
      thin: () => { w.walls.push({ x: W / 2 - 220, y: 380, w: 440, h: 36, t19: true }); put(W / 2, 760, up, W / 2, 416 + h.r + 1); },
      // the hero against a rock
      pillar: () => { w.pillars.push({ x: W / 2, y: 380, r: 46, prop: 'rock' }); put(W / 2, 760, up, W / 2, 380 + 46 + h.r + 1); },
      // the hero behind a doorway 74 wide in a wall right across the room: too narrow for the boulder (82 across), and the only way
      door: () => { w.walls.push({ x: 0, y: 400, w: W / 2 - 37, h: 40, t19: true }, { x: W / 2 + 37, y: 400, w: W / 2 - 37, h: 40, t19: true }); put(W / 2, 720, up, W / 2, 400 - h.r - 4); },
      // the hero at the corner of a crate (a square block), the troll coming at the corner
      crate: () => { w.walls.push({ x: W / 2 - 40, y: 340, w: 80, h: 80, t19: true }); put(W / 2 + 40 + 260, 420 + 260, -Math.PI * 0.75, W / 2 + 40 + h.r * 0.72, 420 + h.r * 0.72); },
      // open floor, the hero standing square in its way: is he carried along on the boulder's front?
      push: () => put(W / 2 + 250, H / 2, Math.PI, W / 2 - 10, H / 2),
      // open floor: the hero off to its side, or behind it; how does it come round?
      turn90: () => put(W / 2, H / 2, 0, W / 2, H / 2 - 330),
      turn135: () => put(W / 2, H / 2, 0, W / 2 - 233, H / 2 - 233),
      turn180: () => put(W / 2, H / 2, 0, W / 2 - 330, H / 2),
      // a friend of its own between its boulder and the wall
      friends: () => { put(W / 2, 360, up, W / 2 + 420, H - 120); const f = w.units.find((q) => q !== u && q.team === u.team && !q.dead); if (f) { f.x = W / 2; f.y = f.r + 2; f.rootT = 1e9; f.maxHp = f.hp = 1e6; } u.target = h; },
      // nothing staged but a clean room: the hero fights back (o.fight)
      live: () => put(W / 2 + 200, H / 2, Math.PI, W / 2 - 200, H / 2, false),
    };
    S[name]();
    w.W += 0.01; // (the room's floor picture is cached by its size, render.js: painted again with the walls just put in)
    if (T19.regrid) T19.regrid(w); else import('./js/path.js').then((P) => P.buildGrid(w));
    return { run, w, u, h, hs };
  };
})();
