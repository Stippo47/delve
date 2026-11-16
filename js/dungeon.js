// Run flow: rooms → floors → dungeon. Heroes keep HP between rooms; downed heroes stay down until the
// floor is cleared, then come back at 10% HP. Loot found goes in the satchel and only leaves if you win.
import { makeWorld, spawn, step, alive } from './sim.js';
import { DEFS, HERO_ORDER, xpToNext, levelHp, levelDmg, TRINKET_IDS, TRINKETS } from './units.js';
import { rand, rrange, rint, pick, chance, dist, clamp } from './util.js';

export const W = 960, H = 480;
export const FLOORS = 3, ROOMS = 3;

export function newRun(save, depth) {
  const heroes = {};
  for (const k of HERO_ORDER) heroes[k] = { hp: null, down: false };
  const run = { depth, floor: 1, room: 1, coins: 0, satchel: [], keys: 0, heroes, phase: 'fight', t: 0, fade: 1, log: [], save, kills: 0, banner: null };
  buildRoom(run);
  return run;
}

export const isBossRoom = (run) => run.floor === FLOORS && run.room === ROOMS;

function placeFree(w, r, xmin, xmax, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const x = rrange(xmin, xmax), y = rrange(r + 30, H - r - 30);
    if (w.pillars.every((p) => dist(x, y, p.x, p.y) > p.r + r + 24) && w.hazards.every((h) => dist(x, y, h.x, h.y) > h.r + r + 10)) return { x, y };
  }
  return { x: rrange(xmin, xmax), y: rrange(r + 30, H - r - 30) };
}

function buildRoom(run) {
  const w = makeWorld(W, H);
  run.world = w;
  const boss = isBossRoom(run);
  w.mult = 1 + 0.22 * (run.depth - 1) + 0.09 * (run.floor - 1) + 0.03 * (run.room - 1);
  const template = boss ? 'boss' : pick(['pack', 'pack', 'hazard', 'treasure', 'mixed']);
  run.template = template;
  // pillars
  const np = boss ? 2 : rint(0, 3);
  for (let i = 0; i < np; i++) { const r = rrange(22, 36); const p = placeFree(w, r, 260, 700); w.pillars.push({ x: p.x, y: p.y, r }); }
  // hazards
  const nh = template === 'hazard' ? rint(2, 4) : template === 'mixed' ? rint(1, 2) : boss ? 1 : chance(0.3) ? 1 : 0;
  for (let i = 0; i < nh; i++) {
    const type = chance(0.5) ? 'oil' : 'spikes';
    const r = type === 'oil' ? rrange(34, 52) : rrange(24, 34);
    const p = placeFree(w, r, 230, 760); w.hazards.push({ type, x: p.x, y: p.y, r });
  }
  // heroes
  const ys = [H / 2, H / 2 - 60, H / 2 + 60];
  HERO_ORDER.forEach((k, i) => {
    const hs = run.heroes[k];
    if (hs.down) return;
    const sv = run.save.heroes[k];
    const u = spawn(w, k, 70 + (k === 'knight' ? 40 : 0), ys[i], { level: sv.level, trinket: sv.trinket ? sv.trinket.id : null, hp: hs.hp });
    u.facing = 0;
  });
  // enemies
  if (boss) {
    spawn(w, 'boss', W - 170, H / 2, { mult: w.mult });
    for (let i = 0; i < 2 + Math.floor(run.depth / 2); i++) { const p = placeFree(w, 22, W - 300, W - 60); spawn(w, 'skeleton', p.x, p.y, { mult: w.mult }); }
  } else {
    let budget = 5 + run.depth * 2 + run.floor * 2 + run.room;
    const kinds = [];
    while (budget > 0) {
      const roll = rand();
      let k = roll < 0.42 ? 'rat' : roll < 0.72 ? 'slime' : 'skeleton';
      const cost = { rat: 1, slime: 2, skeleton: 3 }[k];
      if (k === 'rat') { const n = Math.min(budget, rint(2, 4)); for (let j = 0; j < n; j++) kinds.push('rat'); budget -= n; continue; }
      kinds.push(k); budget -= cost;
    }
    const keyIdx = template === 'treasure' || chance(0.25) ? rint(0, kinds.length - 1) : -1;
    kinds.forEach((k, i) => { const p = placeFree(w, DEFS[k].r, W * 0.5, W - 50); const u = spawn(w, k, p.x, p.y, { mult: w.mult, hasKey: i === keyIdx }); u.facing = Math.PI; });
    if (template === 'treasure' || keyIdx >= 0) { const p = placeFree(w, 18, 380, W - 120); w.pickups.push({ type: 'chest', x: p.x, y: p.y, open: false }); }
  }
  w.on.kill = (u) => onKill(run, u);
  w.on.coin = (p) => { run.coins += p.v; };
  w.on.key = () => { run.keys++; text(run, 'key', '#FFE14D'); };
  run.phase = 'fight';
  run.t = 0;
  run.fade = 1;
}

function text(run, s, color) { const w = run.world; const hs = w.units.filter((u) => u.team === 'hero' && alive(u)); const h = hs[0]; if (h) w.texts.push({ x: h.x, y: h.y - 40, s, color, size: 1, life: 1, max: 1, vy: -30 }); }

function onKill(run, u) {
  run.kills++;
  const xp = Math.round((u.def.xp || 0) * (1 + 0.15 * (run.depth - 1)));
  const w = run.world;
  for (const h of w.units) {
    if (h.team !== 'hero' || !alive(h)) continue;
    const sv = run.save.heroes[h.kind];
    sv.xp += xp;
    while (sv.xp >= xpToNext(sv.level)) {
      sv.xp -= xpToNext(sv.level); sv.level++;
      const ratio = h.hp / h.maxHp;
      h.maxHp = levelHp(h.def.hp, sv.level); h.hp = Math.min(h.maxHp, h.maxHp * ratio + h.maxHp * 0.25);
      h.dmgMul = levelDmg(1, sv.level); h.level = sv.level;
      w.texts.push({ x: h.x, y: h.y - h.r - 18, s: 'LEVEL ' + sv.level, color: '#FFE14D', size: 1.2, life: 1.3, max: 1.3, vy: -30 });
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; w.particles.push({ x: h.x, y: h.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.6, max: 0.6, size: 4, color: '#FFE14D' }); }
    }
  }
}

function heroesAlive(run) { return run.world.units.filter((u) => u.team === 'hero' && alive(u)); }

export function rollTrinket() { return { id: pick(TRINKET_IDS), uid: Math.floor(rand() * 1e9) }; }

export function update(run, dt) {
  const w = run.world;
  run.t += dt;
  run.fade = Math.max(0, run.fade - dt * 2.5);
  if (run.banner) { run.banner.t -= dt; if (run.banner.t <= 0) run.banner = null; }
  if (run.phase === 'won' || run.phase === 'lost') return;
  if (run.phase === 'transition') {
    run.fadeOut += dt * 2.2;
    if (run.fadeOut >= 1) nextRoom(run);
    return;
  }
  step(w, dt);
  // track downed heroes
  for (const u of w.units) if (u.team === 'hero' && u.downed) run.heroes[u.kind].down = true;
  if (heroesAlive(run).length === 0) { run.phase = 'lost'; return; }
  const enemies = w.units.filter((u) => u.team === 'enemy' && alive(u));
  if (run.phase === 'fight' && enemies.length === 0) {
    w.cleared = true; run.phase = 'loot'; run.t = 0;
    if (isBossRoom(run)) { run.phase = 'won'; finishRoomHp(run); return; }
  }
  if (run.phase === 'loot') {
    const loose = w.pickups.filter((p) => p.type !== 'chest');
    const chest = w.pickups.find((p) => p.type === 'chest' && !p.open);
    if (loose.length && run.t < 3) return;
    if (chest && run.keys > 0) {
      const hs = heroesAlive(run);
      let near = hs[0]; for (const h of hs) if (dist(h.x, h.y, chest.x, chest.y) < dist(near.x, near.y, chest.x, chest.y)) near = h;
      near.forcedGoal = { x: chest.x, y: chest.y };
      run.chestT = (run.chestT || 0) + dt;
      if (dist(near.x, near.y, chest.x, chest.y) < near.r + 22 || run.chestT > 6) {
        run.chestT = 0;
        chest.open = true; run.keys--; near.forcedGoal = null;
        const item = rollTrinket(); run.satchel.push(item);
        w.texts.push({ x: chest.x, y: chest.y - 30, s: TRINKETS[item.id].name, color: '#FFE7A0', size: 1, life: 1.6, max: 1.6, vy: -24, item: item.id });
        for (let i = 0; i < 16; i++) { const a = rand() * Math.PI * 2; w.particles.push({ x: chest.x, y: chest.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.7, max: 0.7, size: 5, color: '#FFD45A' }); }
        run.t = 2.2;
      }
      return;
    }
    if (run.t < 0.6) return;
    run.phase = 'exit';
    const hs = heroesAlive(run);
    hs.forEach((h, i) => { h.forcedGoal = { x: W - 24, y: H / 2 + (i - 1) * 46 }; h.target = null; });
  }
  if (run.phase === 'exit') {
    const hs = heroesAlive(run);
    run.exitT = (run.exitT || 0) + dt;
    if (hs.every((h) => h.x > W - 70) || run.exitT > 8) { run.exitT = 0; finishRoomHp(run); run.phase = 'transition'; run.fadeOut = 0; }
  }
}

function finishRoomHp(run) {
  for (const u of run.world.units) if (u.team === 'hero') { const hs = run.heroes[u.kind]; hs.hp = u.hp; if (u.downed) hs.down = true; }
}

function nextRoom(run) {
  run.room++;
  if (run.room > ROOMS) {
    run.room = 1; run.floor++;
    for (const k of HERO_ORDER) { const hs = run.heroes[k]; if (hs.down) { hs.down = false; hs.hp = levelHp(DEFS[k].hp, run.save.heroes[k].level) * 0.1; } }
    run.banner = { s: 'Floor ' + run.floor, t: 1.8 };
  }
  buildRoom(run);
}

export function retreat(run) { run.phase = 'retreated'; }
