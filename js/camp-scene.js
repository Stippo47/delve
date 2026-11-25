// The camp ground (round 9): one top-down scene you look at, in the spirit of Nuclear Throne's campfire. The fire is
// in the middle of the screen; the party sits close round it on four seats (locked ones say what opens them); every
// other hero you own stands about or wanders the clearing, drawn from its real part sprites, top-down as in a run;
// heroes who are resting lie on bedrolls by the tent. The trader's cart, the book and the settings chest are things
// in the camp you tap.
//
// The camera eases between views: 'ground' (the whole camp), 'fire' (zoomed on the fire for the party pick, with
// "Delve" in the flames), and 'focus' (a hero or a thing in the top third of the screen, its panel below).
// The trail map is drawn on the same canvas by camp-map.js. Coordinates: world units are CSS pixels at zoom 1 on a
// 390-wide phone, the fire at (0, 0), y down.
import { HEROES, HERO_IDS } from './heroes.js';
import { DEFS } from './units.js';
import { getRig, drawRig, poseFor, LIMP } from './parts.js';
import { headR } from './sprites.js';
import { INK, OUTLINE } from './util.js';
import * as P from './progress.js';
import * as M from './meta.js';
import { paintWagon } from './convoy.js'; // lane C (convoy): the wagon parked at the camp's edge

const TAU = Math.PI * 2;
const HS = 0.46;            // a hero's sprite size in camp world units per sprite unit (a paladin is ~45 across)
// Round 19 (lane outline19): one outline in the camp, in camp world units, for the heroes (parts.js grows their inks to it)
// and every inked thing (ink() below; its calls asked for 1.2 to 2.4): OUTLINE at the heroes' camp scale, so a hero's
// outline is the same share of him as in a fight.
const CAMP_LINE = OUTLINE * HS;
const SEAT_R = 60;          // how far the seats sit from the fire's middle
const SEAT_A = [Math.PI * 0.75, Math.PI * 0.25, Math.PI * 1.25, Math.PI * 1.75]; // bottom-left, bottom-right, top-left, top-right
const WALK = 38;            // wandering speed, world units a second
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const wrapA = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export const seatPos = (i) => ({ x: Math.cos(SEAT_A[i]) * SEAT_R, y: Math.sin(SEAT_A[i]) * SEAT_R });

// ---------------------------------------------------------------- the scene
// api: { save(), onTap(hit), map (camp-map.js instance) }
export function makeScene(canvas, api) {
  let g = canvas.getContext('2d'); // (let: the still background is painted through the same helpers into its own canvas)
  let W = 390, H = 844, dpr = 1, s0 = 1, halfW = 195, halfH = 422, st = 0;
  const cam = { fx: 0, fy: 0, ax: 195, ay: 422, k: 1 }, want = { ...cam };
  let mode = 'ground', focus = null, running = false, raf = 0, last = 0, time = 0;
  let pickHero = null;      // the hero picked in the fire's list, waiting for a seat
  const figs = new Map();   // heroId -> figure
  const sparks = [];
  let visitor = null;       // an unrecruited hero being looked at: stands at the camp's edge

  // ---- where things are (scaled to the screen's shape so everything stays on it)
  const L = { trader: { x: 0, y: 0 }, book: { x: 0, y: 0 }, settings: { x: 0, y: 0 }, tent: { x: 0, y: 0 }, edge: { x: 0, y: 0 }, battle: { x: 0, y: 0 }, wagon: { x: 0, y: 0 } };
  function place() {
    const ox = Math.min(halfW - 62, 128), oy = Math.min(halfH - 110, 232);
    L.trader = { x: ox - 4, y: -oy + 6 };
    L.book = { x: -ox + 6, y: -oy + 10 };
    L.settings = { x: -ox + 10, y: oy - 14 };
    L.tent = { x: ox - 8, y: oy - 8 };
    L.edge = { x: 0, y: oy + 34 };
    L.battle = { x: -8, y: -oy + 2 }; // the sparring ring (battle mode, round 10): between the book and the cart
    L.wagon = { x: -ox * 0.42, y: oy + 6 }; // lane C (convoy): the wagon, parked at the bottom edge facing the road out
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(200, r.width || innerWidth); H = Math.max(300, r.height || innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    s0 = Math.min(W / 390, H / 780);
    halfW = W / 2 / s0; halfH = H / 2 / s0;
    try { st = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--st')) || 0; } catch { st = 0; }
    place(); aim(true);
  }

  // ---- the camera
  function aim(snap) {
    const k0 = s0;
    if (mode === 'fire') Object.assign(want, { fx: 0, fy: 4, ax: W / 2, ay: st + (H * 0.47 - st) * 0.5 + 18, k: k0 * 2.05 });
    else if (mode === 'focus' && focus) {
      const p = focusPos();
      Object.assign(want, { fx: p.x, fy: p.y - (focus.type === 'hero' ? 4 : 0), ax: W / 2, ay: st + (H / 3 - st) * 0.5 + 22, k: k0 * (focus.type === 'hero' ? 2.9 : 2.1) });
    } else Object.assign(want, { fx: 0, fy: 0, ax: W / 2, ay: H / 2, k: k0 });
    if (snap) Object.assign(cam, want);
  }
  function focusPos() {
    if (!focus) return { x: 0, y: 0 };
    if (focus.type === 'hero') { const f = figs.get(focus.id) || (visitor && visitor.id === focus.id ? visitor : null); return f ? { x: f.x, y: f.y } : L.edge; }
    return L[focus.type] || { x: 0, y: 0 };
  }
  const toScreen = (x, y) => ({ x: (x - cam.fx) * cam.k + cam.ax, y: (y - cam.fy) * cam.k + cam.ay });
  const toWorld = (sx, sy) => ({ x: (sx - cam.ax) / cam.k + cam.fx, y: (sy - cam.ay) / cam.k + cam.fy });

  // ---- the heroes: who sits, who rests, who wanders
  function sync() {
    const save = api.save(), now = Date.now();
    const party = save.party.slice(0, M.slots(save));
    const keep = new Set();
    for (const id of HERO_IDS) {
      if (!save.heroes[id] || !save.heroes[id].owned) continue;
      keep.add(id);
      let f = figs.get(id);
      if (!f) { f = newFig(id); figs.set(id, f); }
      const seat = party.indexOf(id), resting = P.recoverLeft(save, id, now) > 0;
      if (seat >= 0) { if (f.seat !== seat) { f.seat = seat; const p = seatPos(seat); setGoal(f, p.x, p.y, 'sit'); } }
      else if (resting) { if (f.state !== 'rest' && f.goalKind !== 'rest') { f.seat = -1; const p = bedPos(id); setGoal(f, p.x, p.y, 'rest'); } }
      else if (f.seat >= 0 || f.state === 'sit' || f.state === 'rest' || f.goalKind === 'sit' || f.goalKind === 'rest') { f.seat = -1; const p = wanderPoint(f); setGoal(f, p.x, p.y, 'idle'); }
    }
    for (const id of [...figs.keys()]) if (!keep.has(id)) figs.delete(id);
  }
  function newFig(id) {
    const def = DEFS[id], save = api.save(), seat = save.party.indexOf(id);
    const f = { id, def, x: 0, y: 0, facing: Math.PI / 2, state: 'idle', goalKind: null, gx: 0, gy: 0, t: 1 + hash(id.length * 3.1) * 3, seat: -1,
      u: { def, kind: id, spd: 0, bob: hash(id.length) * 6, facing: Math.PI / 2, anim: null, target: null, st: {}, buffs: [] } };
    if (seat >= 0 && seat < M.slots(save)) { const p = seatPos(seat); f.x = p.x; f.y = p.y; f.state = 'sit'; f.seat = seat; f.facing = Math.atan2(-p.y, -p.x); }
    else if (P.recoverLeft(save, id) > 0) { const p = bedPos(id); f.x = p.x; f.y = p.y; f.state = 'rest'; }
    else { const p = wanderPoint(f, HERO_IDS.indexOf(id)); f.x = p.x; f.y = p.y; f.facing = hash(HERO_IDS.indexOf(id) + 9) * TAU; }
    f.u.facing = f.facing;
    return f;
  }
  function setGoal(f, x, y, kind) { f.gx = x; f.gy = y; f.goalKind = kind; f.state = 'walk'; }
  function bedPos(id) {
    const save = api.save(), list = HERO_IDS.filter((h) => save.heroes[h].owned && P.recoverLeft(save, h) > 0 && !save.party.includes(h));
    const i = Math.max(0, list.indexOf(id));
    return { x: L.tent.x - 58 - (i % 3) * 34, y: L.tent.y + 6 - Math.floor(i / 3) * 40 + (i % 2) * 8 };
  }
  // somewhere on the clearing, away from the fire, the things, the top bar and the other wanderers
  function wanderPoint(f, seed) {
    let best = null, bd = -1;
    for (let k = 0; k < 14; k++) {
      const r = seed != null ? hash(seed * 13.7 + k) : Math.random(), r2 = seed != null ? hash(seed * 7.3 + k * 1.9) : Math.random();
      const x = (r * 2 - 1) * (halfW - 30), y = (r2 * 2 - 1) * (halfH - 92) + 14;
      if (Math.hypot(x, y) < 118) continue;
      let d = Infinity;
      for (const o of [L.trader, L.book, L.settings, L.tent, L.battle, L.wagon]) d = Math.min(d, Math.hypot(x - o.x, y - o.y) - 62);
      for (const o of figs.values()) if (o !== f && o.state !== 'sit') d = Math.min(d, Math.hypot(x - (o.goalKind ? o.gx : o.x), y - (o.goalKind ? o.gy : o.y)) - 40);
      if (d > bd) { bd = d; best = { x, y }; }
      if (d > 40) break;
    }
    return best || { x: 0, y: 150 };
  }

  function stepFig(f, dt) {
    const u = f.u;
    if (u.anim) { u.anim.t += dt; if (u.anim.t >= u.anim.dur) u.anim = null; }
    if (focus && focus.type === 'hero' && focus.id === f.id && f.state !== 'walk') { // looked at: turn to the viewer
      if (f.state !== 'sit' && f.state !== 'rest') turn(f, Math.PI / 2, dt, 4);
      u.spd = 0;
      return;
    }
    if (f.state === 'walk') {
      const dx = f.gx - f.x, dy = f.gy - f.y, d = Math.hypot(dx, dy);
      if (d < 3) {
        f.x = f.gx; f.y = f.gy; u.spd = 0;
        f.state = f.goalKind === 'sit' ? 'sit' : f.goalKind === 'rest' ? 'rest' : 'idle'; f.goalKind = null; f.t = 2 + Math.random() * 4;
      } else {
        const sp = Math.min(WALK * (f.goalKind === 'sit' ? 2.8 : f.goalKind === 'rest' ? 1.6 : 1), d * 3);
        let vx = dx / d * sp, vy = dy / d * sp;
        // keep clear of the fire unless heading for a seat
        const fr = Math.hypot(f.x, f.y);
        if (f.goalKind !== 'sit' && fr < 108) { vx += f.x / fr * 40; vy += f.y / fr * 40; }
        f.x += vx * dt; f.y += vy * dt;
        turn(f, Math.atan2(vy, vx), dt, 7);
        u.spd = Math.hypot(vx, vy) * 2.2; // the walk cycle reads at camp scale with a little more swing
      }
    } else if (f.state === 'sit') {
      u.spd = 0; turn(f, Math.atan2(-f.y, -f.x), dt, 5);
    } else if (f.state === 'rest') {
      u.spd = 0;
    } else { // idle: look about, sometimes practise a blow, then wander somewhere else
      u.spd = 0;
      f.t -= dt;
      if (f.look != null) turn(f, f.look, dt, 3);
      if (f.t <= 0) {
        const r = Math.random();
        if (r < 0.42) { const p = wanderPoint(f); setGoal(f, p.x, p.y, 'idle'); }
        else if (r < 0.72) { f.look = Math.random() * TAU; f.t = 1.5 + Math.random() * 2.5; }
        else { const k = f.def.attackAnim || (f.def.role === 'ranged' ? 'draw' : 'swing'); u.anim = { kind: k, t: 0, dur: k === 'draw' ? 0.9 : 0.5 }; f.t = 1.2 + Math.random() * 2; }
      }
    }
    u.bob += dt * (3 + u.spd * 0.09);
    u.facing = f.facing;
  }
  function turn(f, to, dt, rate) { f.facing = wrapA(f.facing + wrapA(to - f.facing) * Math.min(1, dt * rate)); }
  function separate() {
    const list = [...figs.values()].filter((f) => f.state === 'idle' || f.state === 'walk');
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d < 44) { const p = (44 - d) * 0.25; a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p; }
    }
  }

  // ---------------------------------------------------------------- drawing
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (Math.abs(canvas.clientHeight - H) > 1 || Math.abs(canvas.clientWidth - W) > 1) resize(); // --app-h set late, rotation
    step(dt); render(dt);
  }
  function step(dt) {
    time += dt;
    const e = 1 - Math.exp(-dt * 7);
    if (mode === 'focus' && focus) aim(false);
    for (const k of ['fx', 'fy', 'ax', 'ay', 'k']) cam[k] = lerp(cam[k], want[k], e);
    for (const f of figs.values()) stepFig(f, dt);
    if (visitor) stepFig(visitor, dt);
    separate();
    // sparks off the fire
    if (Math.random() < dt * 9) sparks.push({ x: (Math.random() - 0.5) * 14, y: -4, vx: (Math.random() - 0.5) * 10, vy: -26 - Math.random() * 30, life: 0, max: 0.9 + Math.random() * 0.9 });
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life += dt; s.x += s.vx * dt + Math.sin(time * 3 + i) * 4 * dt; s.y += s.vy * dt; if (s.life > s.max) sparks.splice(i, 1); }
  }

  function render(dt) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (mode === 'map' && api.map) { api.map.draw(g, W, H, dt, time, st); return; }
    g.fillStyle = '#131A22'; g.fillRect(0, 0, W, H);
    g.save();
    g.translate(cam.ax, cam.ay); g.scale(cam.k, cam.k); g.translate(-cam.fx, -cam.fy);
    const b = background(); // the ground, the fire's stones and the camp's things: painted once, not every frame
    g.drawImage(b.c, -b.BX, -b.BY, b.BX * 2, b.BY * 2);
    for (let i = 0; i < 4; i++) seatLog(i);
    shadows();
    const list = [...figs.values()];
    if (visitor) list.push(visitor);
    list.sort((a, b) => a.y - b.y);
    for (const f of list) drawFig(f);
    fireTop();
    light();
    g.restore();
    vignette();
    labels();
    if (mode === 'fire') delveText();
  }

  // Everything in the camp that never moves, kept as one picture (0.11.1: painting ~250 shapes at 3x a frame made the
  // camp crawl on a phone). Repainted when the screen's size changes or the number of bedrolls by the tent does.
  let bg = null, bgKey = '';
  function background() {
    const save = api.save(), resting = HERO_IDS.filter((h) => save.heroes[h].owned && P.recoverLeft(save, h) > 0 && !save.party.includes(h)).length;
    const key = [W, H, dpr, resting].join('|');
    if (bg && bgKey === key) return bg;
    const BX = halfW + 150, BY = halfH + 150;
    let q = s0 * dpr * 1.3; // a little finer than the screen, so zooming in on a hero doesn't blur it much
    const px = BX * 2 * q * BY * 2 * q; if (px > 6e6) q *= Math.sqrt(6e6 / px);
    const c = (bg && bg.c) || document.createElement('canvas');
    c.width = Math.ceil(BX * 2 * q); c.height = Math.ceil(BY * 2 * q);
    const main = g; g = c.getContext('2d');
    try {
      g.setTransform(q, 0, 0, q, BX * q, BY * q);
      ground(); stones();
      thing('tent'); thing('trader'); thing('book'); thing('settings'); thing('battle'); thing('wagon');
    } finally { g = main; }
    bg = { c, BX, BY }; bgKey = key;
    return bg;
  }
  // the clearing: night grass, a trodden ring round the fire, trees closing in at the edges
  function ground() {
    const R = Math.max(halfW, halfH) + 400;
    g.fillStyle = '#18222A'; g.fillRect(-R, -R, R * 2, R * 2);
    for (let i = 0; i < 70; i++) { // patches of darker and lighter grass
      const x = (hash(i * 3.3) * 2 - 1) * (halfW + 80), y = (hash(i * 5.1 + 2) * 2 - 1) * (halfH + 80), r = 24 + hash(i * 1.7) * 46;
      g.fillStyle = i % 3 ? 'rgba(10,16,20,0.35)' : 'rgba(40,58,56,0.28)';
      g.beginPath(); g.ellipse(x, y, r, r * 0.7, hash(i) * 3, 0, TAU); g.fill();
    }
    const gr = g.createRadialGradient(0, 0, 20, 0, 0, 170);
    gr.addColorStop(0, '#3A3230'); gr.addColorStop(0.55, '#2C2A2C'); gr.addColorStop(1, 'rgba(32,36,40,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 170, 0, TAU); g.fill();
    // a trodden path out of the camp, to the trail
    g.strokeStyle = 'rgba(58,50,46,0.7)'; g.lineWidth = 34; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 80); g.quadraticCurveTo(-30, halfH * 0.6, 10, halfH + 60); g.stroke();
    // grass tufts
    g.strokeStyle = 'rgba(70,96,84,0.45)'; g.lineWidth = 1.6;
    for (let i = 0; i < 90; i++) {
      const x = (hash(i * 9.7) * 2 - 1) * halfW, y = (hash(i * 4.9 + 7) * 2 - 1) * halfH;
      if (Math.hypot(x, y) < 140) continue;
      g.beginPath(); g.moveTo(x - 3, y + 2); g.lineTo(x - 4, y - 4); g.moveTo(x, y + 2); g.lineTo(x, y - 6); g.moveTo(x + 3, y + 2); g.lineTo(x + 5, y - 3); g.stroke();
    }
    // pebbles
    for (let i = 0; i < 26; i++) {
      const a = hash(i * 2.2) * TAU, r = 90 + hash(i * 6.1) * 120;
      ink(() => { g.beginPath(); g.ellipse(Math.cos(a) * r, Math.sin(a) * r, 3 + hash(i) * 3, 2.4 + hash(i) * 2, a, 0, TAU); }, '#4A4A52', 1.6);
    }
    // trees round the edge, top-down canopies
    const trees = [];
    for (let i = 0; i < 46; i++) {
      const side = i % 4, t = hash(i * 7.7) * 2 - 1, depth = hash(i * 3.9) * 50;
      const x = side < 2 ? (side ? 1 : -1) * (halfW + 6 - depth) : t * (halfW + 30);
      const y = side < 2 ? t * (halfH + 30) : (side === 2 ? -1 : 1) * (halfH + 10 - depth * 0.8);
      trees.push({ x, y, r: 26 + hash(i * 2.9) * 22 });
    }
    trees.sort((a, b) => a.y - b.y);
    for (const tr of trees) tree(tr.x, tr.y, tr.r);
  }
  function tree(x, y, r) {
    g.fillStyle = 'rgba(5,8,12,0.4)'; g.beginPath(); g.ellipse(x + 4, y + 6, r * 1.02, r * 0.95, 0, 0, TAU); g.fill();
    ink(() => { g.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, rr = r * (0.86 + 0.14 * hash(x + k)); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }, '#112420', 2.2);
    g.fillStyle = '#183230'; g.beginPath(); g.arc(x - r * 0.18, y - r * 0.2, r * 0.6, 0, TAU); g.fill();
    g.fillStyle = 'rgba(80,120,100,0.18)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.28, 0, TAU); g.fill();
  }
  function ink(path, fill) { // (a third argument, the width each call once asked for, is no longer read: CAMP_LINE)
    path(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = CAMP_LINE * 2; g.stroke(); g.fillStyle = fill; g.fill();
  }

  // the fire: a ring of stones, crossed logs, flames that never sit still
  function stones() {
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * TAU + 0.2, r = 25;
      ink(() => { g.beginPath(); g.ellipse(Math.cos(a) * r, Math.sin(a) * r, 6.2, 5, a, 0, TAU); }, i % 2 ? '#6B6870' : '#7C7882', 1.5);
    }
    g.fillStyle = '#1C1514'; g.beginPath(); g.arc(0, 0, 19, 0, TAU); g.fill();
    for (const [a, c] of [[0.5, '#6B4129'], [-0.6, '#80502F'], [1.9, '#734630']]) {
      g.save(); g.rotate(a); ink(() => { g.beginPath(); g.roundRect ? g.roundRect(-17, -3.6, 34, 7.2, 3.6) : g.rect(-17, -3.6, 34, 7.2); }, c, 1.3); g.restore();
    }
  }
  function fireTop() {
    const fl = (i) => 0.82 + 0.18 * Math.sin(time * (7 + i * 2.3) + i * 1.7) * Math.sin(time * (3.1 + i) + i);
    g.save(); g.globalCompositeOperation = 'lighter';
    const layers = [[16, '#FF5A1F', 0.85], [12, '#FF8A2F', 0.9], [8, '#FFB347', 0.95], [4.6, '#FFE59A', 1]];
    layers.forEach(([r, c, a], i) => {
      g.globalAlpha = a; g.fillStyle = c; g.beginPath();
      for (let k = 0; k <= 12; k++) {
        const ang = k / 12 * TAU, wob = 1 + 0.22 * Math.sin(ang * 3 + time * (6 + i) + i) + 0.12 * Math.sin(ang * 5 - time * 9);
        const rr = r * fl(i) * wob, lift = Math.max(0, -Math.sin(ang)) * r * 0.35; // licks lean up the screen a little
        g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr - lift - 2);
      }
      g.closePath(); g.fill();
    });
    for (const s of sparks) { const k = s.life / s.max; g.globalAlpha = (1 - k) * 0.9; g.fillStyle = k < 0.4 ? '#FFE59A' : '#FF8A2F'; g.beginPath(); g.arc(s.x, s.y, 1.4 * (1 - k * 0.5), 0, TAU); g.fill(); }
    g.restore();
  }
  function light() {
    const f = 0.9 + 0.1 * Math.sin(time * 5.3) * Math.sin(time * 2.1 + 1);
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, -4, 6, 0, 0, 230 * f);
    gr.addColorStop(0, 'rgba(255,150,60,0.42)'); gr.addColorStop(0.25, 'rgba(255,120,50,0.16)'); gr.addColorStop(0.6, 'rgba(255,100,40,0.05)'); gr.addColorStop(1, 'rgba(255,100,40,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 240, 0, TAU); g.fill();
    // the trader's lantern
    const lx = L.trader.x - 30, ly = L.trader.y + 22, lg = g.createRadialGradient(lx, ly, 2, lx, ly, 70);
    lg.addColorStop(0, 'rgba(255,210,120,0.3)'); lg.addColorStop(1, 'rgba(255,210,120,0)');
    g.fillStyle = lg; g.beginPath(); g.arc(lx, ly, 70, 0, TAU); g.fill();
    g.restore();
  }
  let vig = null, vigKey = '';
  function vignette() { // (0.11.1: painted once, small, and stretched: a full-screen gradient a frame is a lot of pixels at 3x)
    const key = W + 'x' + H;
    if (!vig || vigKey !== key) {
      vig = vig || document.createElement('canvas'); vigKey = key;
      const k = 1 / 6; vig.width = Math.ceil(W * k); vig.height = Math.ceil(H * k);
      const x = vig.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0);
      const gr = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
      gr.addColorStop(0, 'rgba(6,8,16,0)'); gr.addColorStop(1, 'rgba(6,8,16,0.62)');
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
    }
    g.imageSmoothingEnabled = true; g.drawImage(vig, 0, 0, W, H);
  }

  // a seat: a short log on its side round the fire; a locked one is darker, with a padlock
  function seatLog(i) {
    const save = api.save(), open = i < M.slots(save), p = seatPos(i), a = SEAT_A[i] + Math.PI / 2;
    g.save(); g.translate(p.x * 1.18, p.y * 1.18); g.rotate(a);
    ink(() => { g.beginPath(); g.roundRect ? g.roundRect(-20, -7, 40, 14, 7) : g.rect(-20, -7, 40, 14); }, open ? '#6E4A30' : '#3A2E2A', 1.5);
    g.fillStyle = open ? '#8A5E3C' : '#463832'; g.beginPath(); g.ellipse(-19, 0, 4, 6.4, 0, 0, TAU); g.fill();
    g.strokeStyle = open ? 'rgba(60,36,20,0.6)' : 'rgba(20,16,14,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-12, -2.5); g.lineTo(12, -2.5); g.moveTo(-8, 2.5); g.lineTo(14, 2.5); g.stroke();
    g.restore();
    if (!open) padlock(p.x, p.y, 1);
    const empty = open && !save.party[i];
    if (empty || (mode === 'fire' && pickHero && open)) { // an open seat waiting: a soft ring where a hero would sit
      const pulse = mode === 'fire' && pickHero ? 0.55 + 0.45 * Math.sin(time * 6) : 0.5;
      g.save(); g.strokeStyle = `rgba(245,184,65,${0.5 * pulse + 0.2})`; g.lineWidth = 2; g.setLineDash([4, 4]);
      g.beginPath(); g.arc(p.x, p.y, 17, 0, TAU); g.stroke(); g.restore();
    }
  }
  function padlock(x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(14,17,32,0.85)'; g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(242,232,210,0.35)'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = '#9BA2C0'; g.lineWidth = 2; g.beginPath(); g.arc(0, -2.5, 3.6, Math.PI, 0); g.stroke();
    g.fillStyle = '#9BA2C0'; g.fillRect(-5, -2.5, 10, 7.5);
    g.restore();
  }

  // the things in the camp
  function thing(kind) {
    const p = L[kind];
    g.save(); g.translate(p.x, p.y);
    if (kind === 'trader') { // a covered cart, wheels at the sides, crates and a lantern
      g.fillStyle = 'rgba(5,8,12,0.4)'; g.beginPath(); g.ellipse(4, 8, 52, 34, 0, 0, TAU); g.fill();
      ink(() => { g.beginPath(); g.rect(-50, -26, 10, 22); g.rect(40, -26, 10, 22); g.rect(-50, 8, 10, 22); g.rect(40, 8, 10, 22); }, '#2A2020', 1.2);
      ink(() => { g.beginPath(); g.roundRect ? g.roundRect(-42, -32, 84, 62, 8) : g.rect(-42, -32, 84, 62); }, '#7A5232', 1.6);
      for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#E9DCC0' : '#B8423A'; g.fillRect(-38 + k * 15.2, -28, 15.2, 50); }
      g.strokeStyle = 'rgba(43,34,48,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-38, -3); g.lineTo(38, -3); g.stroke();
      g.strokeStyle = INK; g.lineWidth = CAMP_LINE * 2; g.strokeRect(-38, -28, 76, 50);
      ink(() => { g.beginPath(); g.rect(-30, 26, 18, 16); g.rect(-8, 30, 14, 12); }, '#9A6B40', 1.3);
      g.strokeStyle = '#5A3A22'; g.lineWidth = 2; g.beginPath(); g.moveTo(-30, 34); g.lineTo(-12, 34); g.moveTo(-21, 26); g.lineTo(-21, 42); g.stroke();
      ink(() => { g.beginPath(); g.moveTo(-44, -6); g.lineTo(-64, -10); g.moveTo(-44, 6); g.lineTo(-64, 10); }, '#6E4A30', 1.2);
      g.fillStyle = '#FFE08A'; g.beginPath(); g.arc(-30, 22, 4, 0, TAU); g.fill();
    } else if (kind === 'book') { // an open book on a stump
      g.fillStyle = 'rgba(5,8,12,0.4)'; g.beginPath(); g.ellipse(3, 6, 26, 24, 0, 0, TAU); g.fill();
      ink(() => { g.beginPath(); g.arc(0, 0, 22, 0, TAU); }, '#6E4A30', 1.6);
      g.strokeStyle = 'rgba(40,24,14,0.55)'; g.lineWidth = 1.4; for (const r of [6, 12, 17]) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); }
      g.save(); g.rotate(-0.18);
      ink(() => { g.beginPath(); g.rect(-19, -13, 38, 26); }, '#5A2E3A', 1.3);
      g.fillStyle = '#F2E8D2'; g.fillRect(-17, -11, 16, 22); g.fillRect(1, -11, 16, 22);
      g.fillStyle = '#B9AE96'; for (let k = 0; k < 4; k++) { g.fillRect(-14, -7 + k * 5, 10, 1.4); g.fillRect(4, -7 + k * 5, 10, 1.4); }
      g.fillStyle = '#C8453D'; g.fillRect(-1, 9, 2.4, 9);
      g.restore();
    } else if (kind === 'battle') { // a sparring ring: a roped circle of posts on trodden sand, a blue and a red flag, two crossed blades
      g.fillStyle = 'rgba(5,8,12,0.4)'; g.beginPath(); g.ellipse(3, 6, 34, 30, 0, 0, TAU); g.fill();
      ink(() => { g.beginPath(); g.arc(0, 0, 28, 0, TAU); }, '#B79F74', 1.6);
      g.fillStyle = '#A38B62'; g.beginPath(); g.arc(0, 0, 19, 0, TAU); g.fill();
      g.strokeStyle = '#E9DCC0'; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.arc(0, 0, 28, 0, TAU); g.stroke(); g.setLineDash([]);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5; ink(() => { g.beginPath(); g.arc(Math.cos(a) * 28, Math.sin(a) * 28, 3.6, 0, TAU); }, '#6E4A30', 1.1); }
      for (const [sx, col] of [[-1, '#5FA8FF'], [1, '#FF6B5A']]) ink(() => { g.beginPath(); g.moveTo(sx * 28, -6); g.lineTo(sx * 28 + sx * 13, -1); g.lineTo(sx * 28, 4); g.closePath(); }, col, 1.1);
      for (const s of [-1, 1]) { g.save(); g.rotate(s * 0.75);
        ink(() => { g.beginPath(); g.rect(-1.8, -15, 3.6, 22); }, '#DCE2EC', 1.1); ink(() => { g.beginPath(); g.rect(-5.5, 7, 11, 2.6); g.rect(-1.6, 9.6, 3.2, 6.5); }, '#8A5A34', 1); g.restore(); }
    } else if (kind === 'wagon') { // lane C (convoy): the trader's wagon, ox and all, nose to the road out (js/convoy.js paints it)
      g.rotate(Math.PI / 2); g.scale(0.3, 0.3); g.translate(-55, 0); paintWagon(g); // (round 13: the bigger wagon, drawn smaller here)
    } else if (kind === 'settings') { // a tool chest with a lantern on it
      g.fillStyle = 'rgba(5,8,12,0.4)'; g.beginPath(); g.ellipse(3, 6, 30, 22, 0, 0, TAU); g.fill();
      ink(() => { g.beginPath(); g.roundRect ? g.roundRect(-26, -18, 52, 36, 5) : g.rect(-26, -18, 52, 36); }, '#4E5A78', 1.6);
      g.fillStyle = '#3B4560'; g.fillRect(-26, -3, 52, 6);
      g.fillStyle = '#C9A34A'; g.fillRect(-4, -6, 8, 10);
      // a cog painted on the lid
      g.save(); g.translate(-13, -10); g.fillStyle = '#9BA2C0';
      g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, r = k % 2 ? 4.2 : 5.8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
      g.fillStyle = '#4E5A78'; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fill(); g.restore();
      ink(() => { g.beginPath(); g.arc(14, -9, 6, 0, TAU); }, '#E8C26A', 1.2);
    } else if (kind === 'tent') { // a tent seen from above, ridge down the middle, and bedrolls
      g.fillStyle = 'rgba(5,8,12,0.4)'; g.beginPath(); g.ellipse(4, 8, 42, 34, 0, 0, TAU); g.fill();
      ink(() => { g.beginPath(); g.moveTo(-34, -30); g.lineTo(34, -30); g.lineTo(38, 30); g.lineTo(-38, 30); g.closePath(); }, '#3F5578', 1.8);
      g.fillStyle = '#334866'; g.beginPath(); g.moveTo(0, -30); g.lineTo(34, -30); g.lineTo(38, 30); g.lineTo(0, 30); g.closePath(); g.fill();
      g.strokeStyle = INK; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, -32); g.lineTo(0, 32); g.stroke();
      g.fillStyle = '#1A2234'; g.beginPath(); g.moveTo(-8, 30); g.lineTo(0, 18); g.lineTo(8, 30); g.closePath(); g.fill();
      const save = api.save(), resting = HERO_IDS.filter((h) => save.heroes[h].owned && P.recoverLeft(save, h) > 0 && !save.party.includes(h)).length;
      for (let i = 0; i < Math.max(2, resting); i++) {
        const bx = -58 - (i % 3) * 34, by = 6 - Math.floor(i / 3) * 40 + (i % 2) * 8;
        ink(() => { g.beginPath(); g.roundRect ? g.roundRect(bx - 14, by - 22, 28, 44, 9) : g.rect(bx - 14, by - 22, 28, 44); }, i % 2 ? '#7B5A6A' : '#6A6A86', 1.4);
        g.fillStyle = 'rgba(242,232,210,0.5)'; g.beginPath(); g.ellipse(bx, by - 14, 9, 5, 0, 0, TAU); g.fill();
      }
    }
    g.restore();
  }

  function shadows() {
    g.fillStyle = 'rgba(5,6,12,0.3)';
    for (const f of [...figs.values(), visitor].filter(Boolean)) {
      const r = f.def.vr * 1.75 * HS * 0.86;
      g.beginPath(); g.ellipse(f.x, f.y + 2, f.state === 'rest' ? r * 1.2 : r, f.state === 'rest' ? r * 0.8 : r, 0, 0, TAU); g.fill();
    }
  }
  // round 15 (the Mob, mob.js): a hero that is four bodies sits, walks and rests at camp as four: the other three are
  // drawn close round the first, turned the same way, each a step out of time with the next
  function drawFig(f) {
    drawBody(f, f.def, f.id, f.x, f.y, f.u);
    (f.def.bodies || []).forEach((k, i) => { const a = f.facing + [2.2, -2.2, Math.PI][i % 3], d = f.def.vr * HS * (i === 2 ? 3.4 : 2.9);
      drawBody(f, DEFS[k], k, f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, { ...f.u, def: DEFS[k], kind: k, bob: (f.u.bob || 0) + 1.3 * (i + 1), anim: null }); });
  }
  function drawBody(f, def, id, fx, fy, fu) {
    const sizeU = def.vr * 220 / headR(id) * HS;
    // 0.11.1: nobody off the screen is drawn, and only the hero being looked at gets a sprite made at the zoomed
    // size. (Every hero's parts were re-made at up to 640 px whenever the camp zoomed in, on screen or not: some 250 MB
    // of pictures, and the fire and the hero pages ran at a few frames a second.)
    const sp = toScreen(fx, fy), rad = sizeU * cam.k * 0.75;
    if (sp.x < -rad || sp.x > W + rad || sp.y < -rad || sp.y > H + rad) return;
    const looked = mode === 'focus' && focus && focus.type === 'hero' && focus.id === f.id;
    const fine = looked || (mode === 'fire' && (f.state === 'sit' || f.goalKind === 'sit'));
    // (asked for at the zoom the camera is heading to, not each size it passes through on the way)
    const set = getRig(def.art, sizeU * (fine ? want.k : Math.min(want.k, s0 * 1.25)) * dpr * 1.04, sizeU * OUTLINE / CAMP_LINE); if (!set) return;
    const lying = f.state === 'rest';
    const pose = lying ? LIMP : poseFor(fu, {}, 1 / 60);
    g.save(); g.translate(fx, fy);
    if (f.state === 'walk') { const k = Math.abs(Math.cos(fu.bob)) * 0.025; g.scale(1 + k, 1 + k); }
    g.rotate(lying ? -Math.PI / 2 + 0.2 : f.facing - Math.PI / 2);
    const k = sizeU / 220; g.scale(k, k); g.translate(-100, -100);
    drawRig(g, set, pose, { alpha: lying ? 0.9 : 1 });
    g.restore();
  }

  // screen-space words: names, the points dot, the things' labels, rest timers, locked seats' hints
  function labels() {
    const save = api.save(), zoomed = cam.k / s0, groundA = clamp(1.6 - zoomed * 0.75, 0, 1), now = Date.now();
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    // (0.11.1: each word is painted once into its own little picture; outlined text every frame is slow on a phone)
    const word = (txt, x, y, size, col, a = 1, weight = 850) => {
      const w = wordSprite(txt, size, col, weight);
      g.globalAlpha = a; g.drawImage(w.c, Math.round((x - w.w / 2) * dpr) / dpr, Math.round((y - w.base) * dpr) / dpr, w.w, w.h); g.globalAlpha = 1;
    };
    if (groundA > 0.02) {
      for (const [kind, name, dy] of [['trader', 'TRADER', 54], ['book', 'BOOK', 38], ['settings', 'SETTINGS', 34], ['tent', 'TENT', 46], ['battle', 'BATTLE', 46], ['wagon', 'WAGON', 66]]) {
        if (kind === 'tent') continue;
        const p = toScreen(L[kind].x, L[kind].y + dy); word(name, p.x, p.y, 11, '#C9CEE4', groundA);
      }
    }
    const nameA = mode === 'fire' ? 1 : groundA;
    for (const f of figs.values()) {
      const p = toScreen(f.x, f.y), r = f.def.vr * 1.4 * HS * cam.k;
      const left = P.recoverLeft(save, f.id, now);
      if (nameA > 0.02 && (mode === 'ground' || f.state === 'sit' || f.goalKind === 'sit')) {
        word(HEROES[f.id].name, p.x, p.y + r + 13 * Math.min(1.25, zoomed * 0.7 + 0.3), mode === 'fire' ? 13 : 10.5, f.state === 'sit' ? '#F2E8D2' : '#B8BEDA', nameA * (mode === 'fire' ? 1 : 0.85));
        if (mode === 'fire' && f.state === 'sit') word(`Lv ${M.level(save, f.id)}`, p.x, p.y + r + 28, 11, '#F5B841', 1);
      }
      if (left > 0 && nameA > 0.02 && f.state === 'rest') word(`${Math.ceil(left / 60000)}m rest`, p.x, p.y - r - 6, 10.5, '#9BA2C0', nameA);
      const pts = M.points(save, f.id);
      if (pts > 0 && pts !== Infinity && nameA > 0.02 && !(focus && focus.id === f.id)) {
        const y = p.y - r - (left > 0 ? 20 : 6);
        const m = pointMark(); g.globalAlpha = nameA; g.drawImage(m, p.x - 16, y - 16, 32, 32); g.globalAlpha = 1; // (no canvas shadow: a blur a hero a frame is slow on a phone)
      }
    }
    // locked seats: what opens them (the next one at ground level, all of them at the fire)
    const n = M.slots(save), hint = M.nextSlotHint(save);
    for (let i = n; i < 4; i++) {
      if (!hint) break;
      if (mode !== 'fire' && i !== n) continue;
      const a = mode === 'fire' ? 1 : groundA; if (a < 0.02) continue;
      const p = seatPos(i), text = i === n ? hint : later(i);
      if (mode === 'fire') { const s = toScreen(p.x, p.y); wrapWords(text, s.x, s.y + 13 * cam.k / s0 + 16, 11.5, 120, a, false); }
      else { const s = toScreen(p.x, p.y + (p.y < 0 ? -20 : 20)); wrapWords(text, s.x, p.y < 0 ? s.y - 16 : s.y + 12, 10, 96, a, p.y < 0); }
    }
    function wrapWords(text, x, y, size, maxW, a, up) {
      g.font = `750 ${size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
      const lines = [], words = text.split(' '); let line = '';
      for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
      if (line) lines.push(line);
      const lh = size * 1.22, y0 = up ? y - (lines.length - 1) * lh : y;
      lines.forEach((l, k) => word(l, x, y0 + k * lh, size, '#9BA2C0', a, 750));
    }
    function later(i) { const u = P.slotUnlocks(save).filter((x) => !x.have); return (u[i - n] || {}).text || ''; }
  }
  const wordCache = new Map(); let wordDpr = 0;
  function wordSprite(txt, size, col, weight) {
    if (wordDpr !== dpr || wordCache.size > 240) { wordCache.clear(); wordDpr = dpr; }
    const key = weight + '|' + size + '|' + col + '|' + txt;
    let w = wordCache.get(key); if (w) return w;
    const font = `${weight} ${size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
    g.font = font; const tw = Math.ceil(g.measureText(txt).width) + 10, th = Math.ceil(size * 1.5) + 8, base = Math.ceil(size * 1.1) + 4;
    const c = document.createElement('canvas'); c.width = Math.ceil(tw * dpr); c.height = Math.ceil(th * dpr);
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.font = font; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
    x.lineWidth = 3.4; x.strokeStyle = 'rgba(8,10,20,0.85)'; x.strokeText(txt, tw / 2, base); x.fillStyle = col; x.fillText(txt, tw / 2, base);
    w = { c, w: tw, h: th, base }; wordCache.set(key, w); return w;
  }
  let markImg = null, markDpr = 0;
  function pointMark() { // a teal diamond with a soft glow: unspent skill points
    if (markImg && markDpr === dpr) return markImg;
    const c = document.createElement('canvas'); c.width = c.height = Math.ceil(32 * dpr); markDpr = dpr;
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 16 * dpr, 16 * dpr);
    const gr = x.createRadialGradient(0, 0, 2, 0, 0, 15); gr.addColorStop(0, 'rgba(79,216,200,0.6)'); gr.addColorStop(1, 'rgba(79,216,200,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(0, 0, 15, 0, TAU); x.fill();
    x.rotate(Math.PI / 4); x.fillStyle = '#4FD8C8'; x.fillRect(-4, -4, 8, 8);
    return (markImg = c);
  }
  function delveText() {
    const p = toScreen(0, -2), k = clamp((cam.k / s0 - 1.2) / 0.8, 0, 1); if (k < 0.05) return;
    const sz = 34, fl = Math.sin(time * 9) * 0.6 + Math.sin(time * 13.3) * 0.4;
    g.save(); g.globalAlpha = k * (0.88 + 0.12 * Math.sin(time * 7));
    g.font = `900 ${sz}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const gr = g.createLinearGradient(0, p.y - sz / 2, 0, p.y + sz / 2);
    gr.addColorStop(0, '#FFF6C8'); gr.addColorStop(0.55, '#FFC24A'); gr.addColorStop(1, '#FF6A2A');
    g.shadowColor = 'rgba(255,120,40,0.95)'; g.shadowBlur = 18;
    g.lineWidth = 4; g.strokeStyle = 'rgba(70,20,0,0.55)'; g.strokeText('DELVE', p.x + fl * 0.6, p.y + fl * 0.4);
    g.fillStyle = gr; g.fillText('DELVE', p.x + fl * 0.6, p.y + fl * 0.4);
    g.shadowBlur = 0; g.globalAlpha = k * 0.85; g.font = `800 11px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`; g.fillStyle = '#FFE2A8';
    g.fillText('TAP TO SET OUT', p.x, p.y + sz * 0.78);
    g.restore();
  }

  // ---------------------------------------------------------------- taps
  function hitAt(sx, sy) {
    if (mode === 'map') return api.map ? api.map.hit(sx, sy) : null;
    const w = toWorld(sx, sy), save = api.save();
    const near = (p, r) => Math.hypot(w.x - p.x, w.y - p.y) <= r;
    if (mode === 'fire') {
      if (near({ x: 0, y: 0 }, 30)) return { type: 'delve' };
      for (let i = 0; i < 4; i++) if (near(seatPos(i), 28)) return { type: 'seat', i, open: i < M.slots(save) };
      return { type: 'back' };
    }
    if (mode === 'focus') return { type: 'back' };
    // ground: heroes first (the nearest within reach), then the fire, then the things
    let best = null, bd = 30;
    for (const f of figs.values()) { const d = Math.hypot(w.x - f.x, w.y - (f.y - 3)); if (d < bd) { bd = d; best = f; } }
    if (best) return { type: 'hero', id: best.id };
    if (near({ x: 0, y: 0 }, 44)) return { type: 'fire' };
    for (const k of ['trader', 'book', 'settings', 'battle']) if (near(L[k], k === 'trader' ? 58 : 40)) return { type: k };
    if (Math.abs(w.x - L.wagon.x) < 30 && w.y > L.wagon.y - 40 && w.y < L.wagon.y + 64) return { type: 'wagon' }; // lane C
    for (let i = 0; i < 4; i++) if (near(seatPos(i), 26)) return { type: 'fire' };
    return null;
  }

  // one finger: a tap picks, a drag scrolls the map
  let down = null;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, last: e.clientY, id: e.pointerId };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    if (mode === 'map' && api.map) api.map.grab();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
    if (mode === 'map' && api.map && down.moved) api.map.drag(e.clientY - down.last);
    down.last = e.clientY;
  });
  const up = (e) => {
    if (!down || e.pointerId !== down.id) return;
    const r = canvas.getBoundingClientRect();
    if (mode === 'map' && api.map) api.map.release();
    if (!down.moved && performance.now() - down.t < 600) { const h = hitAt(e.clientX - r.left, e.clientY - r.top); if (h) api.onTap(h); }
    down = null;
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { if (mode === 'map' && api.map) api.map.release(); down = null; });
  canvas.addEventListener('wheel', (e) => { if (mode === 'map' && api.map) { e.preventDefault(); api.map.drag(-e.deltaY); api.map.release(); } }, { passive: false });
  window.addEventListener('resize', () => { if (running) resize(); });

  return {
    start() { if (running) return; running = true; resize(); sync(); last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    sync, resize,
    get mode() { return mode; },
    setMode(m, o = {}) {
      mode = m; focus = o.focus || null; pickHero = o.pick || null;
      if (focus && focus.type === 'hero' && !figs.has(focus.id)) { // someone not recruited yet: a visitor at the camp's edge
        const def = DEFS[focus.id];
        visitor = { id: focus.id, def, x: L.edge.x, y: L.edge.y - 10, facing: -Math.PI / 2, state: 'idle', t: 99, seat: -1, u: { def, kind: focus.id, spd: 0, bob: 0, facing: -Math.PI / 2, anim: null, target: null, st: {}, buffs: [] } };
      } else if (!focus || focus.type !== 'hero' || figs.has(focus.id)) visitor = null;
      aim(!!o.snap);
    },
    setPick(id) { pickHero = id; },
    // a quick hand for the test tools: freeze the wanderers somewhere sensible
    figures: () => figs,
    // recording clips (tools/camp-shots.mjs): stop the live loop, then step and draw one frame at a time
    record(on) { if (on) { running = false; cancelAnimationFrame(raf); resize(); sync(); } else { running = false; this.start(); } },
    advance(dt = 1 / 30) { step(dt); render(dt); },
    // where something is on screen, for the test tools: 'fire', 'trader' | 'book' | 'settings', { seat: i }, { hero: id }
    screenOf(t) {
      const p = t === 'fire' ? { x: 0, y: 0 } : typeof t === 'string' ? L[t] : t.seat != null ? seatPos(t.seat) : figs.get(t.hero) || { x: 0, y: 0 };
      return toScreen(p.x, p.y - (t.hero ? 3 : 0));
    },
  };
}
