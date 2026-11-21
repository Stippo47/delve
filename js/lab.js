// The renderer's test bench (lab.html): not part of the game. Modes:
//   grid  every sprite with art cycling walk -> ready -> its attack (or &anim=kind)
//   sheet one row per kind (&kinds=a,b,c), columns = rest, walk, ready, strike, struck, recover, ability, downed
//   fx    every effect, projectile and status
//   fight a real fight from the sim (heroes with art against art enemies); perf: the same with 30 units, timed
// window.LAB.frame(dt) steps and draws one frame (tools/labshot.mjs records with it).
import { loadSprites } from './sprites.js';
import { layout, draw, view, setZoom, snapCamera } from './render.js';
import { makeWorld, spawn, step, setAnim } from './sim.js';
import { DEFS } from './units.js';
import { HEROES } from './heroes.js';
import { buildGrid } from './path.js';
import { setSeed, TAU } from './util.js';

const P = new URLSearchParams(location.search);
const mode = P.get('m') || 'grid';
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
setSeed(+(P.get('seed') || 7));

// enemies drawn from parts that no def uses yet: lab-only kinds on skeleton numbers
const ENEMY_ART = ['rattler', 'rattler-loosejaw', 'rattler-jawless-spear', 'rattler-jawless-bow', 'gaper', 'brute', 'ghost', 'lizardman', 'lizardman-blade'];
for (const a of ENEMY_ART) {
  const bow = a.endsWith('bow');
  DEFS['lab-' + a] = { ...DEFS.skeleton, name: a, art: `art/enemies/${a}.svg`, attackAnim: bow ? 'draw' : a.endsWith('spear') ? 'thrust' : 'swing',
    role: bow ? 'ranged' : 'melee', range: bow ? 240 : 20, keep: bow ? 160 : undefined, windup: bow ? 0 : 0.45, headR: 72 };
}
const HERO_KINDS = Object.keys(HEROES);
const ART_KINDS = [...HERO_KINDS, ...ENEMY_ART.map((a) => 'lab-' + a)];

function room(W, H) {
  const w = makeWorld(W, H);
  w.doors = []; w.cleared = true; w.cells = null;
  return w;
}

let w, tick = () => {}, pad = 20;
const info = document.getElementById('info');

function dummy(x, y) { return { x, y, r: 20, vx: 0, vy: 0, dead: false, downed: false }; }

function setupGrid() {
  const kinds = (P.get('kinds') || '').split(',').filter(Boolean);
  const list = kinds.length ? kinds : ART_KINDS;
  const cols = +(P.get('cols') || 4), cell = 120, rows = Math.ceil(list.length / cols);
  w = room(rows * cell + 60, cols * cell);
  list.forEach((k, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const u = spawn(w, k, w.W - 60 - r * cell, cell / 2 + c * cell);
    u.team = 'hero'; u.facing = 0; u.mvA = 0; u.labI = i;
  });
  setZoom(+(P.get('zoom') || 0.72));
  const forced = P.get('anim');
  tick = (dt) => {
    w.time += dt;
    for (const u of w.units) {
      const cyc = 2.4, ph = ((w.time + u.labI * 0.31) % cyc);
      const d = u.def, kind = forced || d.attackAnim || 'swing';
      u.bob += dt * (3 + u.spd * 0.09);
      if (ph < 0.7) { u.spd = d.speed; u.target = null; }
      else if (ph < 1.5) { u.spd = 0; u.target = dummy(u.x + u.r + 20 + (kind === 'draw' || kind === 'cast' || kind === 'throw' ? 120 : d.range || 20), u.y); }
      else { u.spd = 0; u.target = null; }
      u.atkT = 1.5 - ph;
      if (u.anim) { u.anim.t += dt; if (u.anim.t >= u.anim.dur) u.anim = null; }
      if (ph >= 1.5 && ph - dt < 1.5) setAnim(u, kind, kind === 'ability' ? 0.6 : kind === 'draw' ? 0.32 : (d.windup || 0) + 0.28);
    }
  };
}

const PHASES = (P.get('ph') || 'rest,walk,walk2,ready,strike,struck,recover,ability,downed').split(',');
function setupSheet() {
  const kinds = (P.get('kinds') || 'paladin,archer,twinfang,wildmane').split(',');
  const cell = 120;
  w = room(kinds.length * cell + 40, PHASES.length * cell);
  kinds.forEach((k, r) => PHASES.forEach((ph, c) => {
    const u = spawn(w, k, w.W - 20 - cell / 2 - r * cell, cell / 2 + c * cell);
    u.team = 'hero'; u.facing = 0; u.mvA = 0; u.ph = ph;
  }));
  setZoom(+(P.get('zoom') || 0.5));
  const forced = P.get('anim');
  const pose = (u) => {
    const d = u.def, kind = forced || d.attackAnim || 'swing', dur = kind === 'draw' ? 0.32 : (d.windup || 0) + 0.28;
    const at = d.windup || 0;
    u.target = dummy(u.x + 80, u.y); u.atkT = 5; u._ready = 0; u.anim = null; u.spd = 0;
    const an = (t, k = kind, du = dur) => { u.anim = { kind: k, t, dur: du }; u._lastAnim = u.anim; u._from = 1; };
    if (u.ph === 'walk') { u.spd = d.speed; u.bob = Math.PI / 2; u.target = null; }
    if (u.ph === 'walk2') { u.spd = d.speed; u.bob = -Math.PI / 2; u.target = null; }
    if (u.ph === 'ready') { u.atkT = 0; u._ready = 1; }
    if (u.ph === 'strike') an(at + 0.035);
    if (u.ph === 'struck') an(at + 0.1);
    if (u.ph === 'recover') an(at + 0.19);
    if (u.ph === 'ability') an(0.6 * 0.32 + 0.08, 'ability', 0.6);
    if (u.ph === 'downed') u.downed = true;
    if (/^[\d.]+$/.test(u.ph)) an(+u.ph);
    if (/^p-?[\d.]+$/.test(u.ph)) u._force = { 'arm-r': { r: +u.ph.slice(1) } };
    if (/^r[\d.]+$/.test(u.ph)) { u._ready = +u.ph.slice(1); u.atkT = 0; }
  };
  for (const u of w.units) pose(u);
  tick = () => { for (const u of w.units) if (!u.downed) pose(u); };
}

function setupFight(n) {
  const heroes = (P.get('heroes') || (n > 12 ? 'paladin,archer,twinfang,wildmane,pyromancer,tower,granny,cleric,frost,berserker' : 'paladin,archer,twinfang,wildmane,pyromancer')).split(',');
  w = room(900, 480);
  w.walls = []; buildGrid(w);
  heroes.forEach((k, i) => { const u = spawn(w, k, 120 + (i % 2) * 40, 60 + i * (360 / heroes.length)); u.facing = 0; });
  const foes = ['lab-rattler', 'lab-rattler-loosejaw', 'lab-rattler-jawless-spear', 'lab-rattler-jawless-bow', 'lab-gaper', 'lab-brute', 'lab-lizardman', 'lab-lizardman-blade'];
  const m = n ? n - heroes.length : 6;
  for (let i = 0; i < m; i++) { const u = spawn(w, foes[i % foes.length], 380 + (i % 4) * 70, 60 + Math.floor(i / 4) * 80 + (i % 2) * 30); u.facing = Math.PI; u.aggro = true; }
  setZoom(+(P.get('zoom') || 0.8));
  tick = (dt) => { step(w, dt); for (const u of w.units) if (u.team === 'hero' && u.hp < u.maxHp * 0.3) u.hp = u.maxHp; };
}

// ---------------------------------------------------------------- effects bench
function setupFx() {
  w = room(960, 480);
  w.walls = []; buildGrid(w);
  const zones = ['holy', 'fire', 'poison', 'ice', 'storm', 'vines', 'heal', 'sanctuary'];
  const statuses = [['wet', (u) => { u.st.wet = 80; }], ['shock', (u) => { u.st.shock = 70; }], ['stagger', (u) => { u.st.stagger = 60; }],
    ['ko', (u) => { u.st.stagger = 100; }], ['root', (u) => { u.rootT = 9; }], ['sleep', (u) => { u.sleepT = 9; }], ['ethereal', (u) => { u.ethereal = true; }],
    ['burn', (u) => { u.st.burn = 70; }], ['chill', (u) => { u.st.chill = 70; }], ['poison', (u) => { u.st.poison = 70; }], ['frozen', (u) => { u.frozenT = 9; }],
    ['radiance', (u) => { u.st.radiance = 70; }], ['radiant', (u) => { u.radiantT = 99; w.fx.push({ type: 'aura', kind: 'radiance', unit: u, x: u.x, y: u.y, r: 120, t: 0, max: 99 }); }], ['curse', (u) => { u.st.curse = 70; }], ['hexed', (u) => { u.hexed = true; u.hexT = 99; }]];
  const kinds = ['paladin', 'archer', 'twinfang', 'wildmane', 'frost', 'storm', 'druid', 'tower', 'cleric', 'granny', 'bard'];
  statuses.forEach(([n, f], i) => { const u = spawn(w, kinds[i % kinds.length], 880 - Math.floor(i / 4) * 95, 70 + (i % 4) * 110); u.facing = 0; u.team = 'hero'; f(u); u.label = n; });
  const proj = ['arrow', 'fireArrow', 'bolt', 'fireball', 'shard', 'dagger', 'vial', 'thorn', 'note', 'bone', 'water', 'icicle'];
  const owners = { bolt: 'pyromancer' };
  const fxs = () => {
    w.fx = [];
    zones.forEach((k, i) => w.fx.push({ type: 'zone', x: 520 - Math.floor(i / 4) * 130, y: 70 + (i % 4) * 110, r: 50, kind: k, t: 0, max: 99 }));
    w.fx.push({ type: 'beam', kind: 'lightning', x1: 260, y1: 30, x2: 330, y2: 150, t: 0, max: 99 });
    w.fx.push({ type: 'beam', kind: 'drain', x1: 260, y1: 170, x2: 330, y2: 260, t: 0, max: 99 });
    w.fx.push({ type: 'beam', kind: 'holy', x1: 260, y1: 290, x2: 330, y2: 400, t: 0, max: 99 });
    w.fx.push({ type: 'wall', kind: 'fire', x1: 200, y1: 40, x2: 200, y2: 200, t: 0, max: 99 });
    w.fx.push({ type: 'wall', kind: 'ice', x1: 200, y1: 260, x2: 200, y2: 430, t: 0, max: 99 });
    w.fx.push({ type: 'pillar', kind: 'holy', x: 120, y: 80, r: 40, t: 0, max: 1.2, loop: true });
    w.fx.push({ type: 'pillar', kind: 'lightning', x: 120, y: 200, r: 40, t: 0.3, max: 1.2, loop: true });
    w.fx.push({ type: 'wave', x: 40, y: 330, a: 0, r: 160, t: 0, max: 1, loop: true });
    w.fx.push({ type: 'ring', x: 120, y: 420, r: 60, color: '#FFD45A', t: 0.2, max: 0.8, loop: true });
  };
  fxs();
  const shoot = () => proj.forEach((k, i) => {
    const o = owners[k] ? w.units[0] : null;
    w.projectiles.push({ kind: k, x: 40 + (w.time * 0) , y: 20 + i * 38, vx: 160, vy: 0, r: 6, team: 'neutral', owner: o, dmg: 0, o: {}, life: 9, a: 0, lab: true, color: k === 'bolt' ? '#FF9A3D' : undefined });
  });
  setZoom(+(P.get('zoom') || 0.62));
  let shotT = 0;
  tick = (dt) => {
    w.time += dt;
    for (const f of w.fx) { f.t += dt; if (f.loop && f.t >= f.max) f.t = 0; }
    for (const p of w.projectiles) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x > 150) p.x = 40; }
    shotT -= dt; if (shotT <= 0 && !w.projectiles.length) { shoot(); shotT = 99; }
    for (const u of w.units) { u.bob += dt * 3; if (u.anim) { u.anim.t += dt; if (u.anim.t >= u.anim.dur) u.anim = null; } }
  };
  // the sim moves the fx only once lane work lands; here the bench does it
}

function setupProps() {
  w = room(900, 480);
  w.walls = []; w.cleared = true;
  const kinds = ['fight', 'hazard', 'elite', 'treasure', 'fountain', 'decision', 'boss'];
  w.doors = [{ y: 70, kind: 'fight', chosen: true }, { y: 190, kind: 'treasure' }, { y: 310, kind: 'boss' }, { y: 420, kind: 'fountain' }];
  if (P.get('shut')) w.cleared = false;
  void kinds;
  w.pillars.push({ x: 640, y: 80, r: 30, prop: 'obstacle-rock' }, { x: 640, y: 200, r: 30, prop: 'obstacle-pillar' }, { x: 640, y: 320, r: 30, prop: 'obstacle-crates' }, { x: 520, y: 400, r: 38, fountain: true }, { x: 400, y: 400, r: 38, fountain: true, used: true });
  w.hazards.push({ type: 'oil', x: 520, y: 80, r: 40 }, { type: 'spikes', x: 520, y: 200, r: 30 }, { type: 'spikes', x: 520, y: 300, r: 30, up: false }, { type: 'fire', x: 400, y: 80, r: 34 }, { type: 'gas', x: 400, y: 200, r: 40 });
  w.pickups.push({ type: 'chest', x: 300, y: 80, free: true, open: false }, { type: 'chest', x: 300, y: 190, open: false }, { type: 'chest', x: 300, y: 300, open: true, free: true },
    { type: 'pedestal', x: 200, y: 80, reward: 'potion' }, { type: 'pedestal', x: 200, y: 190, reward: 'trinket' }, { type: 'coin', x: 200, y: 300, vx: 0, vy: 0 }, { type: 'key', x: 200, y: 360 });
  const u = spawn(w, 'archer', 120, 240); u.facing = 0; u.team = 'hero';
  const u2 = spawn(w, 'paladin', 760, 240); u2.facing = 0; u2.team = 'hero';
  setZoom(+(P.get('zoom') || 0.62));
  tick = (dt) => { w.time += dt; };
}

// ---------------------------------------------------------------- status bench (lane S, round 8)
// Real fights from the sim that build statuses to their bursts: heroes against angels (radiance) on the left, against
// ghosts and a banshee (curse) on the right, a fire patch in each for burn. Heroes are topped up so it runs on.
// &foe=angel|ghost to have one side only.
function setupStatus() {
  w = room(1100, 560);
  w.walls = [{ x: 530, y: 0, w: 40, h: 560 }]; buildGrid(w);
  const sides = [[0, ['angel', 'cherub', 'seraph']], [570, ['ghost', 'ghost', 'banshee']]];
  for (const [x0, foes] of sides) {
    ['paladin', 'archer', 'cleric'].forEach((k, i) => { const u = spawn(w, k, x0 + 90, 140 + i * 140, { level: 6 }); u.facing = 0; });
    foes.forEach((k, i) => { const u = spawn(w, k, x0 + 400, 140 + i * 140, { mult: 1.2 }); u.facing = Math.PI; u.aggro = true; });
    w.hazards.push({ type: 'fire', x: x0 + 250, y: 470, r: 46 });
  }
  setZoom(+(P.get('zoom') || 0.5));
  tick = (dt) => { step(w, dt);
    for (const u of w.units) { if (u.team === 'hero' && u.hp < u.maxHp * 0.3) u.hp = u.maxHp; if (u.team === 'enemy' && u.hp < u.maxHp * 0.2) u.hp = u.maxHp; } };
}

if (mode === 'grid') setupGrid();
else if (mode === 'props') setupProps();
else if (mode === 'sheet') setupSheet();
else if (mode === 'fx') setupFx();
else if (mode === 'fight') setupFight(0);
else if (mode === 'perf') setupFight(+(P.get('n') || 30));
else if (mode === 'status') setupStatus();

let last = 0, drawMs = [], live = !P.has('rec');
function frame(dt) {
  tick(dt);
  layout(canvas, w, pad, 10);
  const t0 = performance.now();
  draw(ctx, w);
  drawMs.push(performance.now() - t0); if (drawMs.length > 240) drawMs.shift();
}
window.LAB = {
  frame, get w() { return w; },
  stats() { const a = [...drawMs].sort((x, y) => x - y); return { n: a.length, units: w.units.length, mean: a.reduce((s, x) => s + x, 0) / a.length, p50: a[a.length >> 1], p95: a[Math.floor(a.length * 0.95)] }; },
  reset() { drawMs = []; },
};
(async () => {
  await loadSprites();
  snapCamera();
  // a few frames so the rasters arrive
  for (let i = 0; i < 3; i++) { frame(0); await new Promise((r) => setTimeout(r, 120)); }
  window.LAB.ready = true;
  if (live) {
    const loop = (now) => { const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; frame(dt); const s = window.LAB.stats(); info.textContent = `${mode} · ${w.units.length} units · draw ${s.mean.toFixed(2)}ms`; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
})();
