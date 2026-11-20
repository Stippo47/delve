import { loadSprites } from './sprites.js';
import { layout, draw, view, snapCamera, setZoom, warmArt } from './render.js';
import { newRun, update, retreat, summarize, FLOORS } from './dungeon.js';
import { loadSave, writeSave } from './save.js';
import { DEFS, xpToNext, levelHp } from './units.js';
import { setSeed } from './util.js';
import { initCamp, showCamp, hideCamp, showResult, loadThemes, THEMES } from './camp.js';
import { applySummary, applyLoadout, MERCS } from './progress.js';
import { buildCards, updateCards } from './hud.js';
import { initInspect, openInspect, closeInspect, inspecting, selected, select, unitAt, drawSelection, panelHeight, refreshInspect } from './inspect.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
if (params.get('seed')) setSeed(+params.get('seed'));

let save = loadSave();
let state = 'camp';
let run = null;
const SPEEDS = [1, 2, 4];

function show(s) {
  state = s;
  $('camp').classList.toggle('hidden', s !== 'camp');
  $('result').classList.toggle('hidden', s !== 'result');
  $('hud').classList.toggle('hidden', s !== 'run');
  $('dock').classList.toggle('hidden', s !== 'run');
  if (s !== 'run') setPaused(false);
  if (s === 'camp') showCamp(); else hideCamp();
}

// ---------------------------------------------------------------- run
// opts: { theme, party, mercs, potions } from the camp. A bare number (the debug ?auto) goes in with the saved party.
function startRun(opts) {
  if (typeof opts !== 'object' || !opts) opts = { depth: +opts || 1, theme: save.theme || Object.keys(THEMES)[0], party: save.party, mercs: save.mercs };
  run = newRun(save, opts);
  applyLoadout(run, opts); // elixirs and trinket levels onto the heroes' run lists (progress.js)
  met = new Set(); beaten = new Set();
  if (save.zoom) setZoom(save.zoom);
  warmArt(run.world);
  buildChips();
  show('run');
}

const members = (r) => [...r.party, ...(r.hired || [])];
const artOf = (k) => (DEFS[k] && DEFS[k].art) || (MERCS.find((m) => m.kind === k) || {}).art || `art/${k}.svg`;
// The hero cards live in the dock along the bottom (hud.js); tapping one pauses and inspects that hero.
function buildChips() {
  buildCards(run, artOf, (k) => {
    const u = run.world.units.find((x) => x.kind === k && x.team === 'hero' && !x.summon && !x.dead);
    if (inspecting() && selected() === u) { setPaused(false); return; }
    setPaused(true, u);
  });
}

// ---------------------------------------------------------------- pause and inspect
let paused = false;
function setPaused(on, unit) {
  paused = !!on && state === 'run' && !!run;
  document.body.classList.toggle('paused', paused);
  $('pauseBtn').classList.toggle('on', paused);
  if (paused) openInspect(run, unit);
  else { closeInspect(); view.manualT = Math.min(view.manualT || 0, 0.6); }
}

// The bestiary counts: every enemy kind seen awake in a room is met; every one that dies is beaten.
let met = new Set(), beaten = new Set();
function noteBeasts(w) {
  for (const u of w.units) {
    if (u.team !== 'enemy' || u.summon) continue;
    const s = save.seen[u.kind] || (save.seen[u.kind] = { met: 0, beaten: 0 });
    if (u.aggro && !met.has(u)) { met.add(u); s.met++; }
    if (u.dead && !beaten.has(u)) { beaten.add(u); s.beaten++; }
  }
}

let hudT = 0;
function updateHud() {
  if (!run) return;
  const w = run.world;
  if (!updateCards(run)) buildChips();
  noteBeasts(w);
  const th = THEMES[run.theme];
  $('where').textContent = `${th ? th.name + ' · ' : ''}Floor ${run.floor}/${FLOORS}`;
  drawMap();
  $('hCoins').textContent = run.coins; $('hKeys').textContent = run.keys; $('hBag').textContent = run.satchel.length;
  $('hKeys').parentElement.classList.toggle('hidden', !run.keys);
  $('hBag').parentElement.classList.toggle('hidden', !run.satchel.length);
  $('hGems').textContent = run.gems || 0;
  $('retreatBtn').textContent = run.leaving ? 'Stay' : 'Leave';
  $('retreatBtn').classList.toggle('leaving', !!run.leaving);
  $('speedBtn').textContent = save.speed + '×';
  const boss = w.units.find((u) => u.def.boss && !u.dead);
  $('bossBar').classList.toggle('hidden', !boss);
  if (boss) { $('bossName').textContent = boss.def.name; $('bossBar').querySelector('i').style.width = Math.max(0, 100 * boss.hp / boss.maxHp) + '%'; }
  const b = $('banner');
  const msg = run.banner ? run.banner.s : run.leaving && (run.phase === 'fight' || run.phase === 'loot') ? 'Leaving after this room' : null;
  if (msg) { b.textContent = msg; b.classList.remove('hidden'); b.classList.toggle('soft', !run.banner); } else b.classList.add('hidden');
}

$('pauseBtn').onclick = () => setPaused(!paused);
$('speedBtn').onclick = () => { save.speed = SPEEDS[(SPEEDS.indexOf(save.speed) + 1) % SPEEDS.length]; writeSave(save); updateHud(); };
// Leave: the room is finished first; tap again to stay after all.
$('retreatBtn').onclick = () => { if (run && !run.summary) { retreat(run, !run.leaving); updateHud(); } };

function endRun(result) {
  const r = run;
  setPaused(false);
  if (r.world) noteBeasts(r.world);
  summarize(r);
  if (view.zoom) save.zoom = view.zoom;
  const rep = applySummary(save, r, result);
  writeSave(save);
  window.GAME.lastResult = result; window.GAME.lastReport = rep;
  showResult(rep, () => { run = null; show('camp'); });
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
  // one dot per layer: the rooms you went through, where you are, how many to go, then the boss
  const m = run.map, nL = m.layers.length;
  const X = (L) => 8 + (cw - 16) * L / (nL - 1), y = ch / 2;
  g.strokeStyle = 'rgba(237,230,216,0.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(0), y); g.lineTo(X(nL - 1), y); g.stroke();
  g.strokeStyle = 'rgba(237,230,216,0.9)'; g.beginPath(); g.moveTo(X(0), y); g.lineTo(X(m.L), y); g.stroke();
  for (let L = 0; L < nL; L++) {
    const been = L <= m.L, step = m.path[L], n = step ? m.layers[step[0]][step[1]] : null;
    const boss = L === nL - 1;
    g.fillStyle = been && n ? MAP_COL[n.kind] || '#999' : boss ? MAP_COL.boss : 'rgba(237,230,216,0.35)';
    g.beginPath(); g.arc(X(L), y, boss ? 5 : been ? 3.8 : 2.6, 0, Math.PI * 2); g.fill();
    if (L === m.L) { g.strokeStyle = '#FFE14D'; g.lineWidth = 2; g.beginPath(); g.arc(X(L), y, 7, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1.5; }
  }
}

// Drag on the room to look around; the camera eases back to the party a couple of seconds after you let go.
let drag = null;
const touches = new Map(); let pinch = null;
let press = null;
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'run') return;
  press = { x: e.clientX, y: e.clientY, t: performance.now() };
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: view.zoom }; drag = null; }
  else drag = { x: e.clientX, y: e.clientY };
});
window.addEventListener('pointermove', (e) => {
  if (!touches.has(e.pointerId)) return;
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && touches.size === 2) { const [a, b] = [...touches.values()]; setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(20, pinch.d)); }
});
// A tap on a unit (no drag, no pinch) pauses and shows it; a tap on nothing while paused does nothing.
const lift = (e) => {
  if (press && touches.size === 1 && run && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10 && performance.now() - press.t < 400) {
    const u = unitAt(run.world, e.clientX, e.clientY);
    if (u) { if (paused) select(u); else setPaused(true, u); }
  }
  press = null;
  touches.delete(e.pointerId); if (touches.size < 2) pinch = null;
};
window.addEventListener('pointerup', lift); window.addEventListener('pointercancel', lift);
canvas.addEventListener('wheel', (e) => { if (state !== 'run') return; e.preventDefault(); setZoom(view.zoom * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
window.addEventListener('pointermove', (e) => {
  if (!drag || pinch) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
  const along = view.rot ? dy : -dx, across = view.rot ? -dx : -dy; // the room follows the finger
  view.manual = (view.manual ?? view.camX) + along / view.scale;
  view.manualY = (view.manualY ?? view.camY) + across / view.scale; view.manualT = paused ? 1e9 : 2.5;
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
    const bottom = paused ? panelHeight() : view.ch - $('dock').getBoundingClientRect().top;
    layout(canvas, run.world, Math.round(hud.bottom) + 6, Math.max(10, Math.round(bottom) + 6));
    if (!paused) {
      acc += dt * (live ? save.speed : 1);
      let n = 0;
      while (acc >= STEP && n < 16) { update(run, STEP); acc -= STEP; n++; if (run.summary) break; }
      if (acc > STEP * 16) acc = 0;
    }
    draw(ctx, run.world);
    if (paused) drawSelection(ctx, performance.now() / 1000);
    if (run.phase === 'transition' || run.fade > 0) {
      const a = run.phase === 'transition' ? run.fadeOut : run.fade;
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.fillStyle = `rgba(47,39,52,${Math.min(1, a)})`; ctx.fillRect(0, 0, view.cw, view.ch);
    }
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; updateHud(); }
    if (live && (run.phase === 'won' || run.phase === 'lost' || run.phase === 'retreated')) endRun(run.phase);
  }
}

document.addEventListener('visibilitychange', () => { last = performance.now(); acc = 0; });

window.GAME = {
  get save() { return save; }, get run() { return run; }, get state() { return state; },
  startRun, endRun, setSpeed: (s) => { save.speed = s; },
  // Recording clips: stop the live loop, then step and draw one frame at a time (tools/clip.mjs).
  record(on = true) { recording = on; acc = 0; },
  recFrame(dt) { if (run) drawRun(dt, false); },
  pause(on = true, kind) { const u = kind && run && run.world.units.find((x) => x.kind === kind && !x.dead); setPaused(on, u); },
  fastForward(seconds) { const n = Math.round(seconds / STEP); for (let i = 0; i < n && run && !run.summary; i++) update(run, STEP); },
  // debug: change the camp's save while testing, e.g. GAME.cheat({ gold: 999, gems: 9 })
  cheat(o) { Object.assign(save, o); writeSave(save); if (state === 'camp') showCamp(); },
};

(async function boot() {
  initCamp({ save, onSetOut: (opts) => startRun(opts) });
  initInspect(() => setPaused(false));
  await Promise.all([loadSprites(), loadThemes()]);
  show('camp');
  window.GAME.ready = true; // tools/clip.mjs waits for this before starting a run
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (params.has('auto')) { save.speed = 4; startRun(+params.get('auto') || 1); }
})();
