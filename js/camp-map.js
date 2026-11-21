// The trail map (round 9): a top-down forest seen from above, scrolled bottom-up. At the bottom a clearing with the
// camp's fire; a trail winds up from it, left and right a little but mostly up, through each dungeon's biome in
// order (meta.dungeonOrder(), so a new first dungeon shows up by itself). On the trail: each floor's start is a large
// dot, each room a small dot, each boss a simple skull. Beaten = white, the highest checkpoint = yellow, not yet =
// grey. Tapping a floor start you can reach picks it (the camp shows the Set out bar).
// World units: CSS pixels; wy runs upward from the bottom of the clearing.
import * as M from './meta.js';
import { themeColors } from './ui-kit.js';
import { INK } from './util.js';

const TAU = Math.PI * 2;
const GAP = 30, HEAD = 150, CLEAR = 300, TOP = 220;
const WHITE = '#F2E8D2', YELLOW = '#F5B841', GREY = '#5A6080';
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hex(c) { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return [90, 90, 100]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a, b, k) { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`; }

export function makeMap(api) {
  let W = 390, H = 844, scroll = 0, vel = 0, held = false, pick = null, built = null, st = 0;

  // ---- the trail, built from the dungeon order and the save
  function build() {
    const save = api.save(), order = M.dungeonOrder(), THEMES = api.themes();
    const nodes = [], bands = [];
    let wy = CLEAR;
    // the frontier: the furthest open dungeon's checkpoint
    const open = order.filter((t) => M.dungeonOpen(save, t)), front = open[open.length - 1];
    order.forEach((t, di) => {
      const th = THEMES[t] || {}, s = M.dungeonState(save, t), cp = s.checkpoint, y0 = wy;
      const band = { t, th, di, y0, y1: 0, open: s.open, cleared: s.cleared, best: s.best, cp, c: themeColors(th) };
      wy += HEAD;
      for (let f = 1; f <= M.FLOORS; f++) {
        const beatenFloor = s.cleared > 0 || f < cp;
        const startCol = !s.open ? GREY : t === front && f === cp ? YELLOW : (f <= cp ? WHITE : GREY);
        nodes.push({ kind: 'floor', t, f, wy, col: startCol, reach: s.open && f <= cp, di });
        wy += GAP * 1.35;
        for (let r = 0; r < M.ROOMS; r++) { nodes.push({ kind: 'room', t, f, r, wy, col: s.open && beatenFloor ? WHITE : GREY, di }); wy += GAP; }
        if (f === M.FLOORS) { nodes.push({ kind: 'boss', t, wy: wy + 6, col: s.open && s.cleared ? WHITE : GREY, di }); wy += GAP * 1.6; }
        else wy += GAP * 0.35;
      }
      band.y1 = wy + 40; wy += 70;
      bands.push(band);
    });
    const total = wy + TOP;
    for (const n of nodes) n.x = trailX(n.wy);
    built = { nodes, bands, total, key: keyOf() };
    return built;
  }
  const keyOf = () => { const s = api.save(); return JSON.stringify([s.dungeons, M.dungeonOrder()]); };
  const trailX = (wy) => W / 2 + Math.sin(wy / 210 + 0.6) * W * 0.2 + Math.sin(wy / 77) * W * 0.035;
  const sy = (wy) => H - (wy - scroll);
  const maxScroll = () => Math.max(0, (built ? built.total : 0) - H);

  // ---- drawing
  function draw(g, w, h, dt, time, stIn) {
    W = w; H = h; st = stIn || 0;
    if (!built || built.key !== keyOf() || built.w !== W) { build(); built.w = W; for (const n of built.nodes) n.x = trailX(n.wy); }
    if (!held) { scroll += vel * dt; vel *= Math.pow(0.04, dt); if (Math.abs(vel) < 4) vel = 0; }
    scroll = clamp(scroll, 0, maxScroll());
    const lo = scroll - 80, hi = scroll + H + 80; // visible wy range
    g.fillStyle = '#121C1E'; g.fillRect(0, 0, W, H);
    // the camp's own forest under the clearing
    forest(g, 0, CLEAR + 40, '#16282A', '#1E3634', 11, lo, hi);
    for (const b of built.bands) {
      if (b.y1 < lo - 200 || b.y0 > hi + 200) continue;
      const base = mix(b.c.floor, '#0E1120', 0.55), deep = mix(b.c.rock, '#0E1120', 0.35);
      const top = sy(b.y1 + 60), bot = sy(b.y0 - 60);
      const gr = g.createLinearGradient(0, bot, 0, top);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.12, base); gr.addColorStop(0.88, base); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, top, W, bot - top);
      forest(g, b.y0 - 20, b.y1 + 20, deep, mix(b.c.wall, '#0E1120', 0.25), b.di * 31 + 5, lo, hi, b.c.accent);
    }
    // the clearing and the fire at the bottom
    clearing(g, time);
    // the trail itself
    const ns = built.nodes;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(20,16,14,0.55)'; g.lineWidth = 20; trail(g, lo, hi); g.stroke();
    g.strokeStyle = '#5A4A3C'; g.lineWidth = 13; trail(g, lo, hi); g.stroke();
    g.strokeStyle = 'rgba(242,232,210,0.12)'; g.lineWidth = 2; g.setLineDash([3, 9]); trail(g, lo, hi); g.stroke(); g.setLineDash([]);
    // locked biomes greyed out, with what opens them
    for (const b of built.bands) {
      if (b.y1 < lo - 200 || b.y0 > hi + 200) continue;
      if (!b.open) { const top = sy(b.y1), bot = sy(b.y0); g.fillStyle = 'rgba(14,17,32,0.55)'; g.fillRect(0, top, W, bot - top); }
    }
    for (const n of ns) { if (n.wy < lo || n.wy > hi) continue; node(g, n, time); }
    for (const b of built.bands) if (b.y0 + HEAD > lo && b.y0 < hi + 40) banner(g, b);
    // the top: a fade so the bar reads
    const tg = g.createLinearGradient(0, 0, 0, st + 90); tg.addColorStop(0, 'rgba(10,12,22,0.9)'); tg.addColorStop(1, 'rgba(10,12,22,0)');
    g.fillStyle = tg; g.fillRect(0, 0, W, st + 90);
  }
  function trail(g, lo, hi) {
    g.beginPath();
    const a = Math.max(CLEAR - 150, lo - 40), b = Math.min(built.total - TOP + 20, hi + 40);
    let first = true;
    for (let wy = a; wy <= b; wy += 8) { const x = trailX(wy), y = sy(wy); if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y); }
  }
  function forest(g, y0, y1, dark, lite, seed, lo, hi, accent) {
    const n = Math.round((y1 - y0) / 22);
    for (let i = 0; i < n; i++) {
      const wy = y0 + (i + hash(seed + i)) * 22; if (wy < lo - 40 || wy > hi + 40) continue;
      for (let s = 0; s < 2; s++) {
        const tx = trailX(wy), side = s ? 1 : -1, gap = 46 + hash(seed + i * 3 + s) * (W * 0.32);
        const x = tx + side * gap, r = 15 + hash(seed * 2 + i + s * 7) * 14;
        if (x < -30 || x > W + 30) continue;
        const y = sy(wy);
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(x + 3, y + 5, r, 0, TAU); g.fill();
        g.fillStyle = INK; g.beginPath(); g.arc(x, y, r + 2, 0, TAU); g.fill();
        g.fillStyle = dark; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
        g.fillStyle = lite; g.globalAlpha = 0.55; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.28, r * 0.5, 0, TAU); g.fill(); g.globalAlpha = 1;
        if (accent && hash(seed + i * 5 + s) < 0.12) { g.fillStyle = accent; g.globalAlpha = 0.7; g.beginPath(); g.arc(x + side * (r + 8), y + 4, 3, 0, TAU); g.fill(); g.globalAlpha = 1; }
      }
      // the far edges: fill them so no gaps show
      for (const x of [8, W - 8]) { const r = 22 + hash(seed + i * 9 + x) * 10, y = sy(wy); g.fillStyle = INK; g.beginPath(); g.arc(x, y, r + 2, 0, TAU); g.fill(); g.fillStyle = dark; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    }
  }
  function clearing(g, time) {
    const x = trailX(CLEAR - 150), y = sy(150);
    const gr = g.createRadialGradient(x, y, 10, x, y, 150);
    gr.addColorStop(0, '#3A3230'); gr.addColorStop(0.6, '#26282C'); gr.addColorStop(1, 'rgba(30,34,38,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 150, 0, TAU); g.fill();
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; g.fillStyle = '#6B6870'; g.beginPath(); g.arc(x + Math.cos(a) * 14, y + Math.sin(a) * 14, 3.6, 0, TAU); g.fill(); }
    const f = 0.85 + 0.15 * Math.sin(time * 8);
    g.save(); g.globalCompositeOperation = 'lighter';
    const lg = g.createRadialGradient(x, y, 2, x, y, 90 * f); lg.addColorStop(0, 'rgba(255,150,60,0.5)'); lg.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = lg; g.beginPath(); g.arc(x, y, 90, 0, TAU); g.fill();
    for (const [r, c] of [[10, '#FF6A2A'], [6.5, '#FFB347'], [3.4, '#FFE59A']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y - 1, r * f, 0, TAU); g.fill(); }
    g.restore();
    g.font = '850 11px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#C9CEE4';
    g.fillText('CAMP', x, y + 34);
  }
  function node(g, n, time) {
    const x = n.x, y = sy(n.wy), sel = pick && n.kind === 'floor' && pick.t === n.t && pick.f === n.f;
    if (n.kind === 'boss') { skull(g, x, y, n.col); return; }
    const r = n.kind === 'floor' ? 9 : 4.2;
    if (n.col === YELLOW || sel) { // the checkpoint glows
      const a = 0.35 + 0.25 * Math.sin(time * 4);
      g.fillStyle = `rgba(245,184,65,${a})`; g.beginPath(); g.arc(x, y, r + 7 + (sel ? 3 : 0), 0, TAU); g.fill();
    }
    g.fillStyle = INK; g.beginPath(); g.arc(x, y, r + 2.2, 0, TAU); g.fill();
    g.fillStyle = n.col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (sel) { g.strokeStyle = '#FFF6D8'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r + 5, 0, TAU); g.stroke(); }
    if (n.kind === 'floor') {
      const left = x > W / 2;
      g.font = '850 11px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'; g.textAlign = left ? 'right' : 'left'; g.textBaseline = 'middle';
      g.lineWidth = 3; g.strokeStyle = 'rgba(8,10,20,0.85)'; const lx = x + (left ? -16 : 16);
      const txt = `FLOOR ${n.f}`; g.strokeText(txt, lx, y); g.fillStyle = n.reach ? (n.col === YELLOW ? YELLOW : WHITE) : '#7A809C'; g.fillText(txt, lx, y);
      g.textBaseline = 'alphabetic';
    }
  }
  function skull(g, x, y, col) {
    g.save(); g.translate(x, y);
    g.fillStyle = INK; g.beginPath(); g.arc(0, -2, 13.5, 0, TAU); g.fill(); g.fillRect(-9.5, 4, 19, 11);
    g.fillStyle = col; g.beginPath(); g.arc(0, -2, 11, 0, TAU); g.fill(); g.fillRect(-7, 4, 14, 8.5);
    g.fillStyle = INK; g.beginPath(); g.arc(-4.4, -2, 3.2, 0, TAU); g.arc(4.4, -2, 3.2, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(0, 2.5); g.lineTo(-1.8, 5.5); g.lineTo(1.8, 5.5); g.closePath(); g.fill();
    g.fillRect(-3.4, 8, 1.6, 4.5); g.fillRect(1.8, 8, 1.6, 4.5);
    g.restore();
  }
  function banner(g, b) {
    const y = sy(b.y0 + HEAD * 0.5), tx = trailX(b.y0 + HEAD * 0.5), left = tx > W / 2;
    const s = M.dungeonState(api.save(), b.t);
    const name = (b.th.name || b.t).toUpperCase();
    const status = !b.open ? M.dungeonLockText(b.t) : b.cleared ? `Cleared${b.cleared > 1 ? ' ×' + b.cleared : ''}` : s.best ? `Reached floor ${s.best}` : 'Not yet entered';
    g.font = '900 15px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    const w1 = g.measureText(name).width; g.font = '750 11.5px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    const w2 = g.measureText(status).width, bw = Math.min(W * 0.62, Math.max(w1, w2) + 28), bh = 46;
    const bx = left ? 16 : W - 16 - bw;
    g.fillStyle = 'rgba(14,17,32,0.82)'; g.strokeStyle = b.open ? b.c.accent : '#3B4478'; g.lineWidth = 1.5;
    g.beginPath(); g.roundRect ? g.roundRect(bx, y - bh / 2, bw, bh, 12) : g.rect(bx, y - bh / 2, bw, bh); g.fill(); g.stroke();
    g.textAlign = 'left'; g.fillStyle = b.open ? '#F2E8D2' : '#7A809C'; g.font = '900 15px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    g.fillText(name, bx + 14, y - 3, bw - 28);
    g.fillStyle = b.open ? b.c.accent : '#9BA2C0'; g.font = '750 11.5px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    g.fillText(status, bx + 14, y + 14, bw - 28);
  }

  // ---- input
  function hit(sx, syy) {
    if (!built) return null;
    let best = null, bd = 26;
    for (const n of built.nodes) {
      if (n.kind !== 'floor') continue;
      const d = Math.hypot(sx - n.x, syy - sy(n.wy)); if (d < bd) { bd = d; best = n; }
    }
    if (!best) return { type: 'mapnone' };
    if (!best.reach) return { type: 'maplocked', theme: best.t, floor: best.f };
    return { type: 'mapfloor', theme: best.t, floor: best.f };
  }
  let lastDrag = 0, lastT = 0;
  return {
    draw, hit,
    grab() { held = true; vel = 0; lastT = performance.now(); },
    drag(dy) { scroll += dy; const now = performance.now(), dtt = Math.max(1, now - lastT); lastDrag = dy; vel = dy / dtt * 1000 * 0.9; lastT = now; },
    release() { held = false; if (performance.now() - lastT > 80) vel = 0; },
    setPick(p) { pick = p; },
    // open at the frontier: the yellow node about a third up from the bottom
    open(w, h) {
      W = w || W; H = h || H; build(); built.w = W; for (const n of built.nodes) n.x = trailX(n.wy);
      const y = built.nodes.find((n) => n.col === YELLOW);
      scroll = clamp((y ? y.wy : 0) - H * 0.42, 0, maxScroll()); vel = 0; pick = null;
    },
    scrollTo(v) { scroll = clamp(v, 0, maxScroll()); vel = 0; },
    reveal(t, f) { const n = built && built.nodes.find((x) => x.kind === 'floor' && x.t === t && x.f === f); if (n) { scroll = clamp(n.wy - H * 0.45, 0, maxScroll()); vel = 0; } },
    get scroll() { return scroll; }, get max() { return maxScroll(); },
    nodeAt(t, f) { const n = built && built.nodes.find((x) => x.kind === 'floor' && x.t === t && x.f === f); return n ? { x: n.x, y: sy(n.wy) } : null; },
  };
}
