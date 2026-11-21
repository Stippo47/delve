// Sound cues: what happened, for js/audio.js to turn into sound. Pure JS (no WebAudio), so the sim, the camp and the
// Node test tools can all import it; until audio.js listens, cue() does nothing.
//
// Two sources:
// - cue(name, ...args): called where something happens that can't be seen afterwards (a hit's weight, a block,
//   a dodge, an ability being used, a purchase). A few one-liners in sim.js, kits.js and camp.js.
// - watchRun(run): called once a frame; it compares the world with the last frame and cues what's new (shots, spells,
//   explosions, deaths, statuses landing, boss tells and phase turns, coins, chests, doors, room and floor ends).
//   Doing it here keeps the game's files free of sound calls.
//
// A cue is { name, a, b, c } (the args as given); audio.js decides what each sounds like and how often it may play.

const queue = [];
let on = false;
export function listen(yes = true) { on = yes; if (!yes) queue.length = 0; }
export const listening = () => on;
export function cue(name, a, b, c) { if (on && queue.length < 400) queue.push({ name, a, b, c }); }
export function drain() { const out = queue.splice(0); return out; }

// ---------------------------------------------------------------- the watcher
const seen = new WeakSet();            // projectiles, fx, telegraphs, corpses, texts, danger zones already cued
const struck = new WeakSet();          // danger zones whose strike was cued
let W = null, last = null;             // the world being watched, and the run's numbers last frame
const units = new Map();               // unit id -> what it was last frame
const flying = new Set();              // projectiles that make a sound when they land (vials, water)

const STATUS = ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger'];
const snap = (u) => ({
  downed: u.downed, dead: u.dead, frozen: u.frozenT > 0, ko: u.koT > 0, root: u.rootT > 0, sleep: u.sleepT > 0,
  slip: !!(u.act && u.act.type === 'slip'), drink: !!(u.act && u.act.type === 'drink'), potions: u.potions,
  st: STATUS.map((s) => u.st[s] || 0), phase: u.k && u.k.phase, aggro: u.aggro, level: u.level,
});

// Mark everything in a new room as already heard (no burst of sound for what was set up before the first frame).
function baseline(w) {
  W = w; units.clear(); flying.clear();
  for (const list of [w.projectiles, w.fx, w.telegraphs, w.corpses, w.texts, w.danger]) for (const o of list || []) seen.add(o);
  for (const u of w.units) units.set(u.id, snap(u));
}

export function watchRun(run) {
  const w = run && run.world;
  if (!w) { W = null; last = null; return; }
  const fresh = w !== W;
  if (fresh) baseline(w);
  const prev = last;
  last = { phase: run.phase, coins: run.coins, keys: run.keys, gems: run.gems || 0, floor: run.floor, doorK: run.doorK,
    levels: Object.fromEntries(Object.entries(run.heroes || {}).map(([k, h]) => [k, h.level])), time: w.time,
    chests: w.pickups.filter((p) => p.type === 'chest' && p.open).length, peds: w.pickups.filter((p) => p.type === 'pedestal').length,
    fount: w.pillars.filter((p) => p.fountain && p.used).length };
  if (fresh) { if (prev && prev.floor === run.floor) cue('room'); return; }
  if (!prev) return;
  // a long jump (fast-forward, a debug skip): take the new state as it is
  if (w.time - prev.time > 1.5) { baseline(w); return; }

  // the run
  if (prev.phase !== run.phase) {
    if (prev.phase === 'fight' && run.phase === 'loot') cue('clear');
    if (run.phase === 'won') cue('won');
    else if (run.phase === 'lost') cue('lost');
    else if (run.phase === 'retreated') cue('retreated');
    else if (run.phase === 'transition') cue('leave');
  }
  if (run.floor > prev.floor) cue('floor');
  if (run.doorK != null && prev.doorK == null) { const d = w.doors && w.doors[run.doorK]; cue('door', d ? w.W - 20 : null, d ? d.y : null); }
  if (run.coins > prev.coins) cue('coin', run.coins - prev.coins);
  if (run.keys > prev.keys) cue('key');
  if (last.gems > prev.gems) cue('gem');
  if (last.chests > prev.chests) { const c = w.pickups.find((p) => p.type === 'chest' && p.open); cue('chest', c && c.x, c && c.y); }
  if (last.peds < prev.peds) cue('pedestal');
  if (last.fount > prev.fount) cue('fountain');
  for (const k in last.levels) if (prev.levels[k] != null && last.levels[k] > prev.levels[k]) { const u = w.units.find((o) => o.kind === k && o.team === 'hero'); cue('levelup', u); }

  // things that appeared
  for (const p of w.projectiles) if (!seen.has(p)) { seen.add(p); cue('shot', p); if (p.kind === 'vial' || p.kind === 'water') flying.add(p); }
  for (const p of flying) if (p.life <= 0 || !w.projectiles.includes(p)) { flying.delete(p); cue('land', p); }
  for (const f of w.fx) if (!seen.has(f)) { seen.add(f); cue('fx', f); }
  for (const t of w.telegraphs) if (!seen.has(t)) { seen.add(t); cue('tele', t); }
  for (const c of w.corpses) if (!seen.has(c)) { seen.add(c); cue('death', c); }
  for (const t of w.texts) if (!seen.has(t)) { seen.add(t); cue('word', t); }
  for (const z of w.danger) {
    if (!seen.has(z)) { seen.add(z); cue('tell', z); }
    if (z.done && !struck.has(z)) { struck.add(z); if (!z.cancelled) cue('strike', z); }
  }

  // units: what changed since last frame
  let arrivals = 0;
  const now = new Set();
  for (const u of w.units) {
    now.add(u.id);
    const s = snap(u), p = units.get(u.id);
    units.set(u.id, s);
    if (!p) { if (u.team === 'enemy' && !u.summon && !u.def.boss) arrivals++; continue; }
    if (u.team === 'hero' && !u.summon) {
      if (s.downed && !p.downed) cue('down', u);
      if (!s.downed && p.downed) cue('revive', u);
      if (s.potions < p.potions || (p.drink && !s.drink && s.potions < p.potions)) cue('drink', u);
    }
    if (s.downed || s.dead) continue;
    for (let i = 0; i < STATUS.length; i++) if (s.st[i] > 0.5 && p.st[i] <= 0.5) cue('status', u, STATUS[i]);
    if (s.st[2] < p.st[2] - 45 && !s.dead) cue('rot', u);           // poison tipping over: 100 -> 30
    if (s.frozen && !p.frozen) cue('freeze', u);
    if (s.ko && !p.ko) cue('ko', u);
    if (s.slip && !p.slip) cue('slip', u);
    if (s.root && !p.root) cue('status', u, 'root');
    if (s.sleep && !p.sleep) cue('status', u, 'sleep');
    if (u.def.boss) {
      if (s.aggro && !p.aggro) cue('bossWake', u);
      if (s.phase != null && p.phase != null && s.phase > p.phase && s.phase > 1) cue('bossPhase', u, s.phase);
    }
  }
  for (const id of units.keys()) if (!now.has(id)) units.delete(id);
  if (arrivals >= 3) cue('wave');
}

// For the tools: forget the world being watched.
export function resetWatch() { W = null; last = null; units.clear(); flying.clear(); }
