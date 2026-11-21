// The renderer's test bench (lab.html): not part of the game. Modes:
//   grid  every sprite with art cycling walk -> ready -> its attack (or &anim=kind)
//   sheet one row per kind (&kinds=a,b,c), columns = rest, walk, ready, strike, struck, recover, ability, downed
//   fx    every effect, projectile and status
//   fight a real fight from the sim (heroes with art against art enemies); perf: the same with 30 units, timed
//   show  the showcase (round 8): one hero uses its attack or one ability on target dummies, over and over
//         &hero=<id>&ab=attack|<abilityId>&tier=1..3 (3)&loop=<seconds> (3); tools/showcase.mjs records every one
//   puddles  every ground puddle in the chosen style (&puddle=1..4); ehp  enemies hurt by various amounts (&ehp=1..4)
// window.LAB.frame(dt) steps and draws one frame (tools/labshot.mjs records with it).
import { loadSprites } from './sprites.js';
import { layout, draw, view, setZoom, snapCamera } from './render.js';
import { makeWorld, spawn, step, setAnim, hurt, meleeSwing } from './sim.js';
import { ABILITIES, initKit } from './kits.js';
import { tagAbility } from './fxtag.js';
import { PUDDLE_TYPES, puddleStyle, PUDDLE_STYLES } from './puddles.js';
import { ehpStyle, EHP_STYLES } from './hpstyle.js';
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

let w, tick = () => {}, pad = 20, restartFn = null;
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
    { type: 'trinket', id: 'phoenixFeather', x: 120, y: 80 }, { type: 'trinket', id: 'blinkStone', x: 120, y: 150 }, { type: 'trinket', id: 'frostBloom', x: 120, y: 360 },
    { type: 'pedestal', x: 200, y: 80, reward: 'potion' }, { type: 'pedestal', x: 200, y: 190, reward: 'trinket' }, { type: 'coin', x: 200, y: 300, vx: 0, vy: 0 }, { type: 'key', x: 200, y: 360 });
  const u = spawn(w, 'archer', 120, 240); u.facing = 0; u.team = 'hero';
  const u2 = spawn(w, 'paladin', 760, 240); u2.facing = 0; u2.team = 'hero';
  w.fx.push({ type: 'pillar', x: 860, y: 70, r: 40, kind: 'holy', t: 0.2, max: 99 }); // the way out's shaft of light (round 8: rounded foot)
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

// ---------------------------------------------------------------- the showcase (round 8)
// A target dummy: never moves, never strikes back, never dies (it heals up when low).
DEFS['lab-dummy'] = { team: 'enemy', name: 'Dummy', art: 'art/lab/dummy.svg', headR: 50, r: 28, vr: 22, turn: 0, accel: 0, face: 0, mass: 2.4, hp: 400, speed: 0,
  role: 'melee', range: 0, atkCd: 999, dmg: 0, arc: 1, temp: 0, commit: 0 };
// where the dummies stand: next to the hero (melee, and moves round itself) or across the room (shots, leaps, pulls)
const FAR = new Set(['charge', 'leap', 'hook', 'backstab', 'dash', 'barrage', 'frostArrow', 'fireball', 'flameWall', 'iceShard', 'iceWall',
  'chainLightning', 'thunderclap', 'stormCloud', 'smite', 'entangle', 'raiseDead', 'lifeDrain', 'boneSpear', 'miasma', 'leeches', 'mend', 'rejuvenate', 'cure', 'encore']);
const NEEDS_ALLY = new Set(['guard', 'mend', 'sanctuary', 'warSong', 'encore', 'rejuvenate', 'cure', 'leeches', 'consecrate']);
const SINGLE = new Set(['shieldBash', 'backstab', 'smite', 'hook', 'mend', 'encore', 'rejuvenate', 'cure', 'guard']);
const SHOW_AT = 0.45; // when the ability goes off, seconds into the loop
function setupShow() {
  const hero = P.get('hero') || 'paladin', ab = P.get('ab') || 'attack', tier = +(P.get('tier') || 3), loop = +(P.get('loop') || 3);
  const H = HEROES[hero], ranged = DEFS[hero].role === 'ranged';
  const abl = H.abilities.find((a) => a.id === ab);
  info.textContent = H.name + ' · ' + (ab === 'attack' ? H.attack.name + ' (attack)' : abl ? abl.name + ' ' + 'I'.repeat(tier) : ab);
  info.style.cssText = 'font-size:15px;opacity:1;left:10px;top:8px;text-shadow:0 1px 0 #2B2230,0 -1px 0 #2B2230,1px 0 0 #2B2230,-1px 0 0 #2B2230';
  let u, dummies, ally, pin, cast;
  const build = () => {
    w = room(470, 350); w.walls = []; buildGrid(w);
    const far = ab === 'attack' ? ranged : FAR.has(ab);
    u = spawn(w, hero, 110, 175, { level: 9 });
    const nodes = {}; for (const a of H.abilities) for (let i = 1; i <= tier; i++) nodes[a.id + i] = 1;
    initKit(u, hero, { nodes }, 9);
    for (const k in u.kit.cd) u.kit.cd[k] = 999;
    u.facing = u.mvA = 0;
    const mx = far ? (ab === 'charge' ? 270 : 340) : 110 + u.r + 28 + (ab === 'attack' ? Math.max(8, DEFS[hero].range - 6) : 14);
    const spots = [[mx, 175], [mx + (far ? 30 : 22), 105], [mx + (far ? 30 : 22), 245]];
    if (ab !== 'attack' && !SINGLE.has(ab)) spots.push([mx + 66, 175]);
    dummies = spots.map(([x, y]) => { const d = spawn(w, 'lab-dummy', x, y); d.facing = Math.PI; d.home = { x, y }; d.aggro = false; return d; });
    if (ab === 'raiseDead') w.corpses.push({ kind: 'rattler', x: mx - 50, y: 125, r: 34, vr: 24, facing: 1, kx: 0, ky: 0, spin: 0, z: 0, vz: 0, age: 5, t: 14, max: 14 });
    ally = null;
    if (NEEDS_ALLY.has(ab)) {
      const ak = hero === 'paladin' ? 'archer' : 'paladin';
      ally = spawn(w, ak, ab === 'warSong' || ab === 'sanctuary' || ab === 'consecrate' ? 155 : 190, 285, { level: 9 });
      initKit(ally, ak, {}, 1); for (const k in ally.kit.cd) ally.kit.cd[k] = 9;
      ally.hp = ally.maxHp * 0.35; ally.facing = 0; ally.home = { x: ally.x, y: ally.y };
      if (ab === 'cure') { ally.st.poison = 70; ally.st.burn = 50; }
      if (ab === 'guard') { ally.target = dummies[0]; dummies[0].target = ally; }
    }
    pin = { x: u.x, y: u.y }; cast = false; u.target = dummies[0];
    w.time = 0;
  };
  build(); restartFn = () => { build(); snapCamera(); };
  setZoom(1); view.zoom = +(P.get('zoom') || 1.9);
  tick = (dt) => {
    if (w.time >= loop) { build(); snapCamera(); }
    if (!cast && w.time >= SHOW_AT && ab !== 'attack') {
      cast = true; u.target = dummies[0];
      const A = ABILITIES[ab];
      if (ab === 'oldBones') { u.kit.tiers.oldBones = tier; u.kit.oldBonesUsed = false; u.invulnT = 0; u.hp = 1; hurt(w, u, 50, dummies[0], { noDodge: true }); }
      else if (A) tagAbility(w, u, ab, tier, () => A.use(w, u, dummies[0], tier));
      for (const k in u.kit.cd) u.kit.cd[k] = 999;
      pin = { x: u.x, y: u.y };
    }
    if (ab !== 'attack') u.atkT = Math.max(u.atkT, 0.5); // only the ability, no plain attacks
    else if (!ranged) { // melee: the brain won't swing while pinned in place, so the bench swings on a beat
      u.atkT = 9; const d = DEFS[hero], beat = d.role === 'skirmish' ? 0.5 : 1.1, t0 = w.time - SHOW_AT;
      if (t0 >= 0 && Math.floor(t0 / beat) !== Math.floor((t0 - dt) / beat || -1) && t0 < loop - 0.9) {
        u.facing = Math.atan2(dummies[0].y - u.y, dummies[0].x - u.x); u.target = dummies[0];
        meleeSwing(w, u, d.role === 'skirmish'); setAnim(u, d.attackAnim || 'swing', (d.windup || 0) + 0.28);
      }
    }
    step(w, dt);
    if (u.act) pin = { x: u.x, y: u.y };
    else if (!u.downed) { u.x = pin.x; u.y = pin.y; u.vx = u.vy = 0; }
    if (u.downed) { u.downed = false; u.hp = u.maxHp; }
    for (const d of dummies) {
      d.atkT = 999; d.target = ally && d.target === ally ? ally : null;
      d.x += (d.home.x - d.x) * Math.min(1, dt * 1.6); d.y += (d.home.y - d.y) * Math.min(1, dt * 1.6);
      if (d.hp < d.maxHp * 0.12) d.hp = d.maxHp;
      if (!w.units.includes(d)) { d.dead = false; d.hp = d.maxHp; w.units.push(d); }
    }
    if (ally) { ally.atkT = 999; ally.x = ally.home.x; ally.y = ally.home.y; for (const k in ally.kit.cd) ally.kit.cd[k] = Math.max(ally.kit.cd[k], 5); }
  };
}

// every puddle type in the current puddle style (&puddle=1..4)
function setupPuddles() {
  w = room(540, 400); w.walls = []; buildGrid(w);
  const st = puddleStyle();
  info.textContent = 'puddles · style ' + st + ' ' + PUDDLE_STYLES[st - 1].name + ' · oil, burning ground, gas / water, mist, web';
  info.style.cssText = 'font-size:14px;opacity:1;left:10px;top:8px;text-shadow:0 1px 0 #2B2230,0 -1px 0 #2B2230,1px 0 0 #2B2230,-1px 0 0 #2B2230';
  PUDDLE_TYPES.forEach((type, i) => w.hazards.push({ type, x: 105 + (i % 3) * 165, y: 125 + Math.floor(i / 3) * 165, r: 54 }));
  setZoom(1); view.zoom = +(P.get('zoom') || 1.62);
  tick = (dt) => { w.time += dt; };
}
// enemies hurt to various amounts, in the current enemy-health style (&ehp=1..4)
function setupEhp() {
  w = room(540, 400); w.walls = []; buildGrid(w);
  const st = ehpStyle();
  info.textContent = 'enemy health · style ' + st + ' ' + EHP_STYLES[st - 1].name + ' · full, 85%, 60%, 35% / 15%, 70%, 50%, 25%';
  info.style.cssText = 'font-size:14px;opacity:1;left:10px;top:8px;text-shadow:0 1px 0 #2B2230,0 -1px 0 #2B2230,1px 0 0 #2B2230,-1px 0 0 #2B2230';
  const kinds = ['rattler', 'goblin', 'orc', 'rattlerBow', 'brute', 'lizardman', 'slime', 'ghost'];
  const hp = [1, 0.85, 0.6, 0.35, 0.15, 0.7, 0.5, 0.25];
  kinds.forEach((k, i) => { if (!DEFS[k]) return; const e = spawn(w, k, 105 + (i % 4) * 110, 120 + Math.floor(i / 4) * 160); e.facing = Math.PI / 2; e.hp = e.maxHp * hp[i]; e.atkT = 999; e._hpLag = e.maxHp * Math.min(1, hp[i] + 0.15); e._hpSeen = e.hp; e._hpWait = 99; });
  setZoom(1); view.zoom = +(P.get('zoom') || 1.62);
  tick = (dt) => { w.time += dt; };
}

if (mode === 'grid') setupGrid();
else if (mode === 'show') setupShow();
else if (mode === 'puddles') setupPuddles();
else if (mode === 'ehp') setupEhp();
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
  restart() { if (restartFn) restartFn(); },
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
