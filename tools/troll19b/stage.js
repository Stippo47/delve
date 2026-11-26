// Lane troll19b (round 19): more staged scenes for the trolls' bowl, on top of tools/troll19/stage.js (T19.stage).
// Evaluated in the page after stage.js (tools/troll19b/clip.sh) or in Node (tools/troll19b/bowls.mjs).
//   bowl    open floor, a hero 320 off, free to walk and to be knocked about, harmless and very tough
//   near    the same, the hero up close in front of the boulder (does the troll walk on into him holding it?)
//   stand   the hero rooted 380 off (how far the boulder goes, how it starts, what it does when it lands on him)
//   fetch   the boulder lying 300 off, the hero rooted beside the troll's way to it (does it hit back on the way?)
//   break   two heroes that do hurt (the boulder's health; nobody dies)
(() => {
  const T = globalThis.T19;
  T.stage2 = (name, o = {}) => {
    const base = name === 'fetch' ? 'push' : name === 'break' ? 'live' : 'push';
    const S = T.stage(base, name === 'break' ? { fight: true } : {});
    const { w, u, h, hs } = S, W = w.W, H = w.H, b = T.ballOf(u);
    const at = (q, x, y) => { q.x = x; q.y = y; q.vx = q.vy = q.kx = q.ky = 0; };
    const ball = (x, y, held = true) => { if (!b) return; b.x = x; b.y = y; b.vx = b.vy = 0; b.held = held; if (b.lastX != null) { b.lastX = x; b.lastY = y; } };
    const hold = () => { const d = u.snow ? u.r * 0.82 + b.r : u.r * 0.54 + b.r + 8; ball(u.x + Math.cos(u.facing) * d, u.y + Math.sin(u.facing) * d); };
    for (const q of hs) q.rootT = 0;
    if (name === 'bowl') { at(u, W / 2 + 200, H / 2); at(h, W / 2 - 200, H / 2); if (b) hold(); }
    if (name === 'near') { at(u, W / 2 + 120, H / 2); if (b) hold(); at(h, (b ? b.x - b.r : u.x - u.r) - h.r - 30, H / 2); h.rootT = 1e9; }
    if (name === 'stand') { at(u, W / 2 + 230, H / 2); at(h, W / 2 - 230, H / 2); h.rootT = 1e9; if (b) hold(); }
    if (name === 'fetch') { at(u, W / 2 + 260, H / 2); if (b) ball(W / 2 - 160, H / 2, false); at(h, W / 2 + 60, H / 2 - u.r - h.r - 6); h.rootT = 1e9; u.facing = u.mvA = Math.PI; }
    if (name === 'break') { at(u, W / 2 + 200, H / 2); if (b) hold(); at(h, W / 2 - 160, H / 2 - 40); if (hs[1]) at(hs[1], W / 2 - 300, H / 2 + 60); }
    for (const q of hs) q.facing = Math.atan2(u.y - q.y, u.x - q.x);
    return S;
  };
})();
