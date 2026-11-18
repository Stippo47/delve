import { loadSprites } from './sprites.js';
import { layout, draw, view, snapCamera } from './render.js';
import { newRun, update, FLOORS, LAYERS, rollTrinket } from './dungeon.js';
import { loadSave, writeSave } from './save.js';
import { HERO_ORDER, DEFS, TRINKETS, xpToNext, levelHp } from './units.js';
import { setSeed } from './util.js';
import { alive } from './sim.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
if (params.get('seed')) setSeed(+params.get('seed'));

const GEM = { lastBreath: '#FFE7A0', volatile: '#FF7A2F', frostRing: '#7FD6F5', emberRing: '#E8582A', venomFang: '#9BCB3C', vampTooth: '#C8553D', ironSkin: '#8F97A3', swiftBoots: '#A0683A' };

let save = loadSave();
let state = 'camp';
let run = null;
let selectedItem = null;
const SPEEDS = [1, 2, 4];

// ---------------------------------------------------------------- camp
function recLevel(depth) { return 1 + (depth - 1) * 3; }

function renderCamp() {
  $('cCoins').textContent = save.coins;
  $('dVal').textContent = save.depth;
  const avg = HERO_ORDER.reduce((a, k) => a + save.heroes[k].level, 0) / HERO_ORDER.length;
  const rec = recLevel(save.depth);
  $('dRec').textContent = `Recommended level ${rec}+` + (avg < rec - 1 ? ' — risky' : '');
  $('campNote').textContent = save.runs ? `${save.wins} cleared of ${save.runs} runs` : 'Beat a dungeon to keep the loot you find in it.';
  const hc = $('heroCards'); hc.innerHTML = '';
  for (const k of HERO_ORDER) {
    const h = save.heroes[k], d = DEFS[k];
    const el = document.createElement('div');
    el.className = 'hero' + (selectedItem ? ' target' : '');
    const tr = h.trinket ? TRINKETS[h.trinket.id] : null;
    el.innerHTML = `<img src="art/${k}.svg" alt=""><div class="name">${d.name}</div>
      <div class="muted">Level ${h.level}</div>
      <div class="bar xp" style="width:80%"><i style="width:${Math.round(100 * h.xp / xpToNext(h.level))}%"></i></div>
      <div class="stats">${levelHp(d.hp, h.level)} HP · ${abilityName(d.ability)}</div>
      <div class="slot ${tr ? 'filled' : ''}">${tr ? `<span class="gem" style="background:${GEM[h.trinket.id]}"></span>&nbsp;${tr.name}` : 'no trinket'}</div>`;
    el.onclick = () => {
      if (selectedItem) {
        if (h.trinket) save.inventory.push(h.trinket);
        h.trinket = selectedItem; save.inventory = save.inventory.filter((i) => i.uid !== selectedItem.uid); selectedItem = null;
      } else if (h.trinket) { save.inventory.push(h.trinket); h.trinket = null; }
      writeSave(save); renderCamp();
    };
    hc.appendChild(el);
  }
  const inv = $('inv'); inv.innerHTML = '';
  if (!save.inventory.length) inv.innerHTML = '<div class="muted">Nothing yet. Chests need keys — some enemies carry one.</div>';
  for (const it of save.inventory) {
    const b = document.createElement('button');
    b.className = 'item' + (selectedItem && selectedItem.uid === it.uid ? ' sel' : '');
    b.innerHTML = `<span class="gem" style="background:${GEM[it.id]}"></span>${TRINKETS[it.id].name}`;
    b.onclick = () => { selectedItem = selectedItem && selectedItem.uid === it.uid ? null : it; renderCamp(); };
    inv.appendChild(b);
  }
  $('desc').textContent = selectedItem ? TRINKETS[selectedItem.id].desc : 'Tap an equipped trinket to take it off.';
}
const abilityName = (a) => ({ barrage: 'Barrage', charge: 'Charge', shadowstep: 'Shadow Step' }[a] || '');

$('dMinus').onclick = () => { save.depth = Math.max(1, save.depth - 1); writeSave(save); renderCamp(); };
$('dPlus').onclick = () => { save.depth = Math.min(save.maxDepth, save.depth + 1); writeSave(save); renderCamp(); };
$('enterBtn').onclick = () => startRun(save.depth);

function show(s) {
  state = s;
  $('camp').classList.toggle('hidden', s !== 'camp');
  $('result').classList.toggle('hidden', s !== 'result');
  $('hud').classList.toggle('hidden', s !== 'run');
  if (s === 'camp') renderCamp();
}

// ---------------------------------------------------------------- run
function startRun(depth) {
  selectedItem = null;
  save.runs++;
  run = newRun(save, depth);
  buildChips();
  show('run');
}

function buildChips() {
  const c = $('chips'); c.innerHTML = '';
  for (const k of HERO_ORDER) {
    const el = document.createElement('div'); el.className = 'chip'; el.id = 'chip-' + k;
    el.innerHTML = `<img src="art/${k}.svg" alt=""><div class="bars"><div class="bar"><i></i></div><div class="bar xp"><i></i></div><div class="lv"></div></div>`;
    c.appendChild(el);
  }
}

let hudT = 0;
function updateHud() {
  if (!run) return;
  const w = run.world;
  for (const k of HERO_ORDER) {
    const el = $('chip-' + k); if (!el) continue;
    const u = w.units.find((x) => x.kind === k);
    const hs = run.heroes[k];
    const down = hs.down || (u && u.downed);
    const hp = u ? u.hp / u.maxHp : (hs.hp != null ? hs.hp / levelHp(DEFS[k].hp, save.heroes[k].level) : 1);
    el.classList.toggle('down', !!down);
    el.querySelector('.bar > i').style.width = (down ? 0 : Math.max(0, hp) * 100) + '%';
    const sv = save.heroes[k];
    el.querySelector('.bar.xp > i').style.width = Math.round(100 * sv.xp / xpToNext(sv.level)) + '%';
    el.querySelector('.lv').textContent = 'Lv ' + sv.level + (down ? ' · down' : '');
  }
  $('where').textContent = `Depth ${run.depth} · Floor ${run.floor}/${FLOORS}`;
  drawMap();
  $('hCoins').textContent = run.coins; $('hKeys').textContent = run.keys; $('hBag').textContent = run.satchel.length;
  $('speedBtn').textContent = save.speed + '×';
  const boss = w.units.find((u) => u.def.boss && !u.dead);
  $('bossBar').classList.toggle('hidden', !boss);
  if (boss) { $('bossName').textContent = boss.def.name; $('bossBar').querySelector('i').style.width = Math.max(0, 100 * boss.hp / boss.maxHp) + '%'; }
  const b = $('banner');
  if (run.banner) { b.textContent = run.banner.s; b.classList.remove('hidden'); } else b.classList.add('hidden');
}

$('speedBtn').onclick = () => { save.speed = SPEEDS[(SPEEDS.indexOf(save.speed) + 1) % SPEEDS.length]; writeSave(save); updateHud(); };
$('retreatBtn').onclick = () => { if (run && run.phase !== 'won' && run.phase !== 'lost') endRun('retreated'); };

function endRun(result) {
  const r = run;
  let lines = [];
  let title = '';
  if (result === 'won') {
    title = 'Dungeon cleared!';
    const bonus = rollTrinket(); r.satchel.push(bonus);
    save.coins += r.coins; save.inventory.push(...r.satchel);
    save.maxDepth = Math.max(save.maxDepth, r.depth + 1); save.depth = Math.min(save.maxDepth, r.depth + 1); save.wins++;
    lines.push(`+${r.coins} coins`, `Loot kept: ${r.satchel.map((i) => TRINKETS[i.id].name).join(', ')}`, `Depth ${r.depth + 1} unlocked`);
  } else if (result === 'lost') {
    title = 'Party wiped';
    const kept = Math.floor(r.coins / 2); save.coins += kept;
    lines.push(`Kept ${kept} of ${r.coins} coins`, r.satchel.length ? `Lost: ${r.satchel.map((i) => TRINKETS[i.id].name).join(', ')}` : 'No loot was lost', 'Levels are kept.');
  } else {
    title = 'Retreated';
    save.coins += r.coins;
    lines.push(`Kept ${r.coins} coins`, r.satchel.length ? `Left behind: ${r.satchel.map((i) => TRINKETS[i.id].name).join(', ')}` : 'No loot was left behind');
  }
  lines.push(`Reached floor ${r.floor}, room ${r.map.L + 1} of ${LAYERS + 1} · ${r.kills} kills`);
  lines.push('Levels: ' + HERO_ORDER.map((k) => `${DEFS[k].name} ${save.heroes[k].level}`).join(' · '));
  writeSave(save);
  $('resultCard').innerHTML = `<h1>${title}</h1>${lines.map((l) => `<div class="muted" style="font-size:14px">${l}</div>`).join('')}<button class="btn big" id="toCamp">Back to camp</button>`;
  $('toCamp').onclick = () => { run = null; show('camp'); };
  window.GAME.lastResult = result;
  show('result');
}

// ---------------------------------------------------------------- the floor's map, in the HUD
// Layers run left to right; the rooms you passed are filled, the one you're in is ringed, doors are lines.
const MAP_COL = { fight: '#C8553D', hazard: '#E0884B', elite: '#8E3B5B', treasure: '#F2B53A', fountain: '#5DB7E0', decision: '#9B7BD6', boss: '#2B2230' };
function drawMap() {
  const c = $('mapCanvas'); if (!c || !run) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3), cw = c.clientWidth, ch = c.clientHeight;
  if (c.width !== Math.round(cw * dpr)) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); }
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
  const m = run.map, nL = m.layers.length;
  const X = (L) => 8 + (cw - 16) * L / (nL - 1), Y = (n) => 4 + (ch - 8) * n.pos;
  const visited = new Set(m.path.map(([L, i]) => L + ':' + i));
  g.lineWidth = 1.5;
  m.layers.forEach((row, L) => row.forEach((n) => n.next.forEach((j) => {
    const b = m.layers[L + 1][j]; const on = visited.has(L + ':' + n.i) && visited.has(L + 1 + ':' + j);
    g.strokeStyle = on ? 'rgba(237,230,216,0.9)' : 'rgba(237,230,216,0.22)'; g.beginPath(); g.moveTo(X(L), Y(n)); g.lineTo(X(L + 1), Y(b)); g.stroke();
  })));
  m.layers.forEach((row, L) => row.forEach((n) => {
    const here = L === m.L && n.i === m.i, been = visited.has(L + ':' + n.i);
    g.fillStyle = MAP_COL[n.kind] || '#999'; g.globalAlpha = been || L > m.L ? 1 : 0.3;
    g.beginPath(); g.arc(X(L), Y(n), n.kind === 'boss' ? 5 : 3.5, 0, Math.PI * 2); g.fill();
    if (here) { g.globalAlpha = 1; g.strokeStyle = '#FFE14D'; g.lineWidth = 2; g.beginPath(); g.arc(X(L), Y(n), 7, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1.5; }
  }));
  g.globalAlpha = 1;
}

// Drag on the room to look around; the camera eases back to the party a couple of seconds after you let go.
let drag = null;
canvas.addEventListener('pointerdown', (e) => { if (state === 'run') drag = { x: e.clientX, y: e.clientY }; });
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
  const along = view.rot ? dy : -dx; // screen movement along the room's long axis, in room units below
  view.manual = (view.manual ?? view.camX) + along / view.scale; view.manualT = 2.5;
});
window.addEventListener('pointerup', () => { drag = null; });

// ---------------------------------------------------------------- loop
const STEP = 1 / 60;
let last = performance.now(), acc = 0, lastWorld = null;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (state === 'run' && run && !recording) drawRun(dt, true);
}

let recording = false;
function drawRun(dt, live) {
  {
    if (run.world !== lastWorld) { lastWorld = run.world; snapCamera(); }
    const hud = $('hud').getBoundingClientRect();
    layout(canvas, run.world, Math.round(hud.bottom) + 6, 10);
    acc += dt * (live ? save.speed : 1);
    let n = 0;
    while (acc >= STEP && n < 16) { update(run, STEP); acc -= STEP; n++; if (run.phase === 'won' || run.phase === 'lost') break; }
    if (acc > STEP * 16) acc = 0;
    draw(ctx, run.world);
    if (run.phase === 'transition' || run.fade > 0) {
      const a = run.phase === 'transition' ? run.fadeOut : run.fade;
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.fillStyle = `rgba(47,39,52,${Math.min(1, a)})`; ctx.fillRect(0, 0, view.cw, view.ch);
    }
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; updateHud(); }
    if (live && run.phase === 'won') endRun('won');
    else if (live && run.phase === 'lost') endRun('lost');
  }
}

document.addEventListener('visibilitychange', () => { last = performance.now(); acc = 0; });

window.GAME = {
  get save() { return save; }, get run() { return run; }, get state() { return state; },
  startRun, endRun, setSpeed: (s) => { save.speed = s; },
  // Recording clips: stop the live loop, then step and draw one frame at a time (tools/clip.mjs).
  record(on = true) { recording = on; acc = 0; },
  recFrame(dt) { if (run) drawRun(dt, false); },
  fastForward(seconds) { const n = Math.round(seconds / STEP); for (let i = 0; i < n && run && run.phase !== 'won' && run.phase !== 'lost'; i++) update(run, STEP); },
};

(async function boot() {
  await loadSprites();
  show('camp');
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (params.has('auto')) { save.speed = 4; startRun(+params.get('auto') || 1); }
})();
