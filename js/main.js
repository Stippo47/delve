import { loadSprites } from './sprites.js';
import { layout, draw, view, snapCamera, setZoom, warmArt } from './render.js';
import { newRun, update, retreat, summarize, FLOORS } from './dungeon.js';
import { loadSave, writeSave } from './save.js';
import { DEFS, xpToNext, levelHp } from './units.js';
import { setSeed } from './util.js';
import { initCamp, showCamp, hideCamp, showResult, loadThemes, THEMES } from './camp.js';
import { applySummary, applyLoadout, MERCS } from './progress.js';
import { buildCards, updateCards } from './hud.js';
import { initAudio, audioFrame } from './audio.js';
import * as M from './meta.js';
import { I } from './ui-kit.js';
import { newBattle, updateBattle, callBattle } from './battle.js';
import { initBattleUI, openSetup, buildBattleDock, updateBattleDock, showBattleResult, battleTitle } from './battle-ui.js';
// lane C (convoy): the wagon mode
import { newConvoy, updateConvoy, turnBack, applyConvoy, takeChoice } from './convoy.js';
import { initConvoyUI, openSetOut, openRoadside, convoyHud, hideConvoyHud, showConvoyResult } from './convoy-ui.js';
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
  $('battle').classList.toggle('hidden', s !== 'setup');
  document.body.classList.toggle('battle', s === 'run' && !!run && run.mode === 'battle');
  { const cv = document.getElementById('convoy'); if (cv) cv.classList.toggle('hidden', s !== 'convoy'); } // lane C (convoy)
  document.body.classList.toggle('convoy', !!run && run.mode === 'convoy');
  if (!run || run.mode !== 'convoy') hideConvoyHud();
  $('hud').classList.toggle('hidden', s !== 'run');
  $('dock').classList.toggle('hidden', s !== 'run');
  $('leaveAsk').classList.add('hidden');
  if (s !== 'run') setPaused(false);
  if (s === 'camp') showCamp(); else hideCamp();
}

// ---------------------------------------------------------------- run
// opts: { theme, party, mercs, potions } from the camp. A bare number (the debug ?auto) goes in with the saved party.
function startRun(opts) {
  if (typeof opts !== 'object' || !opts) opts = { depth: +opts || 1, theme: params.get('theme') || save.theme || Object.keys(THEMES)[0], party: save.party, mercs: save.mercs }; // ?theme: testing
  run = newRun(save, opts);
  applyLoadout(run, opts); // elixirs and trinket levels onto the heroes' run lists (progress.js)
  met = new Set(); beaten = new Set();
  if (save.zoom) setZoom(save.zoom);
  warmArt(run.world);
  buildChips();
  show('run');
}

// ---------------------------------------------------------------- battle mode (battle.js, battle-ui.js)
const isBattle = () => !!run && run.mode === 'battle';
function startBattle(setup) {
  run = newBattle(save, setup);
  if (save.zoom) setZoom(save.zoom);
  warmArt(run.world);
  buildChips();
  show('run');
}
function endBattle() {
  const r = run, setup = r.setup;
  setPaused(false);
  if (view.zoom) save.zoom = view.zoom;
  writeSave(save);
  window.GAME.lastResult = r.summary.winner; window.GAME.lastReport = r.summary;
  showBattleResult(r.summary, { again: () => startBattle(setup), change: () => { run = null; openSetup(); show('setup'); }, camp: () => { run = null; show('camp'); } });
  show('result');
}

// ---------------------------------------------------------------- the wagon (lane C: convoy.js, convoy-ui.js)
const isConvoy = () => !!run && run.mode === 'convoy';
const stepOf = (r) => (r.mode === 'battle' ? updateBattle : r.mode === 'convoy' ? updateConvoy : update);
function openConvoy() { run = null; openSetOut(); show('convoy'); }
function startConvoy(opts = {}) { // (opts: tools only, e.g. { stretch: 2 } to start up the road)
  run = newConvoy(save, opts);
  if (!run.party.length) { run = null; return; }
  save.runs++; writeSave(save);
  if (save.zoom) setZoom(save.zoom);
  met = new Set(); beaten = new Set();
  warmArt(run.world);
  buildChips();
  show('run');
}
function roadside() { // the stop for the night: one frame with the wagon and the camp past the gate in view above the page
  setPaused(false);
  const w = run.world; if (w.camAt && run.wagon && state === 'run') { w.camAt.x = run.wagon.x - 300; snapCamera(); drawRun(0, false); }
  openRoadside(run); show('convoy');
}
function convoyPick(choice) {
  if (!run || run.phase !== 'roadside') return;
  noteBeasts(run.world);
  takeChoice(run, choice);
  warmArt(run.world); buildChips(); snapCamera(); lastWorld = run.world;
  show('run');
}
function endConvoy() {
  const r = run;
  setPaused(false);
  if (r.world) noteBeasts(r.world);
  if (view.zoom) save.zoom = view.zoom;
  const rep = applyConvoy(save, r);
  writeSave(save);
  window.GAME.lastResult = rep.result; window.GAME.lastReport = rep;
  showConvoyResult(rep, { again: () => { run = null; openConvoy(); }, camp: () => { run = null; show('camp'); } });
  show('result');
}

const members = (r) => [...r.party, ...(r.hired || [])];
const artOf = (k) => (DEFS[k] && DEFS[k].art) || (MERCS.find((m) => m.kind === k) || {}).art || `art/${k}.svg`;
// The hero cards live in the dock along the bottom (hud.js); tapping one pauses and inspects that hero.
function buildChips() {
  if (isBattle()) { buildBattleDock(run, (u) => { if (inspecting() && selected() === u) setPaused(false); else setPaused(true, u); }); return; }
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
  if (isBattle()) { // no map, no purse, no boss bar: the time, and the strip below (battle-ui.js)
    if (!updateBattleDock(run)) buildChips();
    $('where').textContent = battleTitle(run);
    $('speedBtn').textContent = save.speed + '×';
    const rb = $('retreatBtn'); if (rb.dataset.on !== 'battle') { rb.dataset.on = 'battle'; rb.innerHTML = I.flag; rb.classList.remove('leaving'); }
    $('bossBar').classList.add('hidden'); $('banner').classList.add('hidden');
    return;
  }
  if (!updateCards(run)) buildChips();
  noteBeasts(w);
  if (isConvoy()) { // lane C: the wagon's strip, the purse; no floor map
    convoyHud(run);
    $('speedBtn').textContent = save.speed + '×';
    const rb = $('retreatBtn'); if (rb.dataset.on !== 'convoy') { rb.dataset.on = 'convoy'; rb.innerHTML = I.flag; rb.classList.remove('leaving'); }
    const chief = w.units.find((u) => u.chief && !u.dead && u.aggro);
    $('bossBar').classList.toggle('hidden', !chief);
    if (chief) { $('bossName').textContent = chief.def.name; $('bossBar').querySelector('i').style.width = Math.max(0, 100 * chief.hp / chief.maxHp) + '%'; }
    const b = $('banner'); if (run.banner) { b.textContent = run.banner.s; b.classList.remove('hidden', 'soft'); } else b.classList.add('hidden');
    return;
  }
  const th = THEMES[run.theme];
  $('where').textContent = `${th ? th.name + ' · ' : ''}Floor ${run.floor}/${FLOORS}`;
  drawMap();
  $('hCoins').textContent = run.coins;
  { const g = $('hGems'); if (g) { g.textContent = run.gems || 0; g.parentNode.classList.toggle('hidden', !run.gems); } } // gems (round 9)
  const rb = $('retreatBtn'), leaving = !!run.leaving;
  if (rb.dataset.on !== String(leaving)) { rb.dataset.on = String(leaving); rb.innerHTML = leaving ? 'Stay' : I.door; rb.classList.toggle('leaving', leaving); }
  $('speedBtn').textContent = save.speed + '×';
  const boss = w.units.find((u) => (u.def.boss || u.floorFoe) && !u.dead); // (a floor's last foe can be a major now: round 9)
  $('bossBar').classList.toggle('hidden', !boss);
  if (boss) { $('bossName').textContent = boss.def.name; $('bossBar').querySelector('i').style.width = Math.max(0, 100 * boss.hp / boss.maxHp) + '%'; }
  const b = $('banner');
  const msg = run.banner ? run.banner.s : run.leaving && (run.phase === 'fight' || run.phase === 'loot') ? 'Leaving after this room' : null;
  if (msg) { b.textContent = msg; b.classList.remove('hidden'); b.classList.toggle('soft', !run.banner); } else b.classList.add('hidden');
}

$('pauseBtn').onclick = () => setPaused(!paused);
$('speedBtn').onclick = () => { save.speed = SPEEDS[(SPEEDS.indexOf(save.speed) + 1) % SPEEDS.length]; writeSave(save); updateHud(); };
// Leave: the room is finished first; tap again to stay after all. Leaving before the floor is done costs a cut of
// the gold (round 8: 20%), so that asks first, with the numbers.
$('retreatBtn').onclick = () => {
  if (!run || run.summary) return;
  if (isBattle()) { callBattle(run); return; } // stop the battle here: on to the result
  if (isConvoy()) { askTurnBack(); return; } // lane C
  if (run.leaving) { retreat(run, false); updateHud(); return; }
  if (!M.leaveCost(run).lose) { retreat(run, true); updateHud(); return; }
  askLeave();
};
function askTurnBack() { // lane C (convoy): the flag turns the wagon back, after asking
  const el = $('leaveAsk'), cut = Math.ceil(run.coins * 0.2), wasPaused = paused;
  if (paused) setPaused(false);
  paused = true;
  el.innerHTML = `<div class="la-panel"><h2>Turn back?</h2>
    <p>The wagon goes home undelivered: no pay, and you lose 20% of the gold picked up.</p>
    <div class="la-sum"><span class="coin"></span><span>${run.coins - cut} kept</span><span class="lose">−${cut}</span></div>
    <div class="la-actions"><button class="btn" data-la="stay">Keep going</button><button class="btn danger" data-la="go">Turn back</button></div></div>`;
  el.classList.remove('hidden');
  el.onclick = (e) => {
    const b = e.target.closest('[data-la]'); if (!b && e.target !== el) return;
    el.classList.add('hidden'); el.onclick = null;
    paused = false;
    if (b && b.dataset.la === 'go') turnBack(run); else if (wasPaused) setPaused(true);
  };
}
function askLeave() {
  const el = $('leaveAsk'), cut = M.leaveCost(run).gold, wasPaused = paused;
  if (paused) setPaused(false);
  paused = true; // hold the fight while asking, without the inspect panel
  el.innerHTML = `<div class="la-panel"><h2>Leave the dungeon?</h2>
    <p>Floor ${run.floor} isn't finished: leaving costs ${Math.round(M.LEAVE_CUT * 100)}% of this run's gold. The party goes once this room is clear. Finish the floor to keep it all.</p>
    <div class="la-sum"><span class="coin"></span><span>${run.coins - cut} kept</span><span class="lose">−${cut}</span></div>
    <div class="la-actions"><button class="btn" data-la="stay">Keep going</button><button class="btn danger" data-la="go">Leave</button></div></div>`;
  el.classList.remove('hidden');
  el.onclick = (e) => {
    const b = e.target.closest('[data-la]'); if (!b && e.target !== el) return;
    el.classList.add('hidden'); el.onclick = null;
    if (b && b.dataset.la === 'go') { retreat(run, true); }
    paused = false; if (wasPaused) setPaused(true);
    updateHud();
  };
}

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
const MAP_COL = { fight: '#E8604C', hazard: '#E0884B', elite: '#C060A0', treasure: '#F5B841', fountain: '#5DB7E0', decision: '#9B7BD6', boss: '#FF4A3A', mini: '#FF8A3A' };
function drawMap() {
  const c = $('mapCanvas'); if (!c || !run) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3), cw = c.clientWidth, ch = c.clientHeight;
  if (c.width !== Math.round(cw * dpr)) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); }
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
  // one dot per layer: the rooms you went through, where you are, how many to go, then the boss
  const m = run.map, nL = m.layers.length;
  const X = (L) => 8 + (cw - 16) * L / (nL - 1), y = ch / 2;
  g.strokeStyle = 'rgba(242,232,210,0.2)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(0), y); g.lineTo(X(nL - 1), y); g.stroke();
  g.strokeStyle = 'rgba(245,184,65,0.9)'; g.beginPath(); g.moveTo(X(0), y); g.lineTo(X(m.L), y); g.stroke();
  for (let L = 0; L < nL; L++) {
    const been = L <= m.L, step = m.path[L], n = step ? m.layers[step[0]][step[1]] : null;
    const boss = L === nL - 1;
    g.fillStyle = been && n ? MAP_COL[n.kind] || '#999' : boss ? MAP_COL.boss : 'rgba(242,232,210,0.3)';
    g.beginPath(); g.arc(X(L), y, boss ? 5 : been ? 3.8 : 2.6, 0, Math.PI * 2); g.fill();
    if (L === m.L) { g.strokeStyle = '#F5B841'; g.lineWidth = 2; g.beginPath(); g.arc(X(L), y, 7, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1.5; }
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
    if (u && !u.def.cargo) { if (paused) select(u); else setPaused(true, u); } // (lane C: the wagon has no page)
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
  audioFrame({ state, run, speed: save.speed, quiet: recording, project: hearAt });
}
// Where a sound is on screen: left/right pan, and quieter the further off screen it is.
function hearAt(x, y) {
  const m = view.m; if (!view.cw) return null;
  const sx = m[0] * x + m[2] * y + m[4], sy = m[1] * x + m[3] * y + m[5];
  const off = Math.max(0, Math.abs(sx - view.cw / 2) - view.cw / 2, Math.abs(sy - view.ch / 2) - view.ch / 2);
  return { pan: Math.max(-1, Math.min(1, (sx / view.cw) * 2 - 1)) * 0.6, gain: Math.max(0.3, 1 - off / 500) };
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
      while (acc >= STEP && n < 16) { stepOf(run)(run, STEP); acc -= STEP; n++; if (run.summary || run.phase === 'roadside') break; } // (lane C: stepOf)
      if (acc > STEP * 16) acc = 0;
    }
    draw(ctx, run.world);
    if (paused) drawSelection(ctx, performance.now() / 1000);
    if (run.phase === 'transition' || run.fade > 0) {
      const a = run.phase === 'transition' ? run.fadeOut : run.fade;
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.fillStyle = `rgba(14,17,32,${Math.min(1, a)})`; ctx.fillRect(0, 0, view.cw, view.ch);
    }
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; updateHud(); }
    if (live && run.mode === 'battle') { if (run.summary) endBattle(); }
    else if (live && run.mode === 'convoy') { if (run.summary) endConvoy(); else if (run.phase === 'roadside') roadside(); } // lane C
    else if (live && (run.phase === 'won' || run.phase === 'lost' || run.phase === 'retreated')) endRun(run.phase);
  }
}

document.addEventListener('visibilitychange', () => { last = performance.now(); acc = 0; });

window.GAME = {
  get save() { return save; }, get run() { return run; }, get state() { return state; },
  startRun, endRun, startBattle, openBattle: () => { openSetup(); show('setup'); }, setSpeed: (s) => { save.speed = s; },
  // Recording clips: stop the live loop, then step and draw one frame at a time (tools/clip.mjs).
  record(on = true) { recording = on; acc = 0; },
  recFrame(dt) { if (run) drawRun(dt, false); },
  pause(on = true, kind) { const u = kind && run && run.world.units.find((x) => x.kind === kind && !x.dead); setPaused(on, u); },
  fastForward(seconds) { const n = Math.round(seconds / STEP); for (let i = 0; i < n && run && !run.summary && run.phase !== 'roadside'; i++) stepOf(run)(run, STEP); },
  // lane C (convoy): the wagon's pages, for tools/clip.mjs and tools/convoy-shots.mjs
  openConvoy, startConvoy, convoyPick, roadside: () => { if (run && run.phase === 'roadside') roadside(); },
  // debug: change the camp's save while testing, e.g. GAME.cheat({ gold: 999 })
  cheat(o) { Object.assign(save, o); writeSave(save); if (state === 'camp') showCamp(); },
  ask: () => askLeave(),
};

(async function boot() {
  initCamp({ save, onSetOut: (opts) => startRun(opts), onBattle: () => { openSetup(); show('setup'); }, onConvoy: () => openConvoy() });
  initConvoyUI({ save: () => save, run: () => run, onSetOut: () => startConvoy(), onClose: () => show('camp'), onPick: (c) => convoyPick(c) }); // lane C
  initBattleUI({ save: () => save, persist: () => writeSave(save), onFight: (setup) => startBattle(setup), onClose: () => show('camp') });
  initAudio();
  initInspect(() => setPaused(false));
  await Promise.all([loadSprites(), loadThemes()]);
  show('camp');
  window.GAME.ready = true; // tools/clip.mjs waits for this before starting a run
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (params.has('auto')) { save.speed = 4; startRun(+params.get('auto') || 1); }
})();
