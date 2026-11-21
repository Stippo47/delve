// Battle mode (round 10). The designer: "Add a battle game mode. I can pin any unit against each other and any enemy
// whose dungeon I have defeated. So I can make a team of 10 skeletons and necromancer vs a knight and tower."
// Two sides, Blue (a) and Red (b), each a list of stacks { k: kind, n: how many, rank: 0 plain | 1 elite | 2 major }.
// Heroes are the ones you own, with the build and trinkets they have in the camp; an enemy is as strong as it is on
// the first floor of the dungeon it comes from. Nothing is earned or lost: no gold, XP, drops or book counts.
//
// A battle is a run-shaped object ({ mode: 'battle', world, phase, t, ... }) so main.js can step and draw it like a
// run. The sim knows two teams, 'hero' and 'enemy'; w.battle = { side: { hero: 'a' | 'b', enemy: ... } } says which
// colour each is. Bosses only know how to fight from the 'enemy' team, so the side with a boss gets that team.
import { step, alive } from './sim.js';
import { DEFS } from './units.js';
import { HEROES, HERO_IDS } from './heroes.js';
import { THEMES, DUNGEON_ORDER } from './themes.js';
import { battleRoom, battleFoe, spawnHero, freeSpot, RANK_MULT, DUNGEON_RANK } from './dungeon.js';
import { battleStats } from './stats.js';
import { dungeonState } from './progress.js';
import { rrange } from './util.js';

export const SIDE_MAX = 20;      // units a side
export const STACK_MAX = 12;     // of one kind
export const SIDES = { a: { name: 'Blue', color: '#5FA8FF' }, b: { name: 'Red', color: '#FF6B5A' } };
export const RANKS = ['', 'Elite', 'Major'];
const TIME_LIMIT = 240;          // a fight that hasn't ended by then goes to whoever has more health left

// ---------------------------------------------------------------- who can be picked
// Every enemy kind a dungeon holds, in the order you meet them; its bosses (the floors' named mini-bosses, then the
// dungeon's own) last.
function kindsOf(T) {
  const kinds = [], bosses = [];
  const add = (k, list = kinds) => { if (k && DEFS[k] && DEFS[k].team !== 'hero' && !kinds.includes(k) && !bosses.includes(k)) (DEFS[k].boss ? bosses : list).push(k); };
  for (const F of T.floors || []) { for (const [k] of F.enemies || []) add(k); add(F.elite); for (const k of F.bossAdds || []) add(k); }
  for (const F of T.floors || []) add(F.mini);
  add(T.elite); for (const k of T.bossAdds || []) add(k); add(T.warden); add(T.boss); add(T.bossKind); // lane B: a theme's designed boss (bossKind) too
  return { kinds, bosses };
}
// { heroes: [id...], dungeons: [{ id, name, open, kinds: [kind...], bosses: [kind...] }] }. A kind is listed under the
// first dungeon it turns up in (that is the strength it fights at). save.cheat opens everything.
export function battleRoster(save) {
  const seen = new Set(), dungeons = [];
  for (const id of DUNGEON_ORDER) {
    const T = THEMES[id]; if (!T) continue;
    const { kinds, bosses } = kindsOf(T);
    const fresh = (k) => (seen.has(k) ? false : (seen.add(k), true));
    dungeons.push({ id, name: T.name, open: !!save.cheat || dungeonState(save, id).cleared > 0, kinds: kinds.filter(fresh), bosses: bosses.filter(fresh) });
  }
  const heroes = HERO_IDS.filter((h) => save.cheat || (save.heroes[h] && save.heroes[h].owned));
  return { heroes, dungeons };
}
export const homeOf = (() => { let map = null; return (kind) => {
  if (!map) { map = {}; for (const id of DUNGEON_ORDER) { const T = THEMES[id]; if (!T) continue; const { kinds, bosses } = kindsOf(T); for (const k of [...kinds, ...bosses]) if (!map[k]) map[k] = id; } }
  return map[kind] || null;
}; })();
export const isHero = (k) => !!HEROES[k];
export const isBoss = (k) => !!(DEFS[k] && DEFS[k].boss);
export const canRank = (k) => !isHero(k) && !isBoss(k) && !(DEFS[k] && DEFS[k].noElite);
export const countOf = (list) => list.reduce((a, s) => a + s.n, 0);

// What's wrong with a setup, as a sentence, or null. Stacks that can't be fielded any more (a hero sold, a save from
// before) are dropped by cleanSetup first.
export function setupProblem(setup) {
  if (!countOf(setup.a) || !countOf(setup.b)) return 'Each side needs someone.';
  if (setup.a.some((s) => isBoss(s.k)) && setup.b.some((s) => isBoss(s.k))) return 'Bosses can only be on one side.';
  return null;
}
export function cleanSetup(save, setup) {
  const R = battleRoster(save), ok = new Set(R.heroes);
  for (const d of R.dungeons) if (d.open) for (const k of [...d.kinds, ...d.bosses]) ok.add(k);
  const fix = (list) => (Array.isArray(list) ? list : []).filter((s) => s && ok.has(s.k) && s.n > 0)
    .map((s) => ({ k: s.k, n: Math.min(STACK_MAX, Math.floor(s.n)), rank: canRank(s.k) ? Math.max(0, Math.min(2, s.rank | 0)) : 0 }));
  const arena = setup && THEMES[setup.arena] && (save.cheat || DUNGEON_ORDER.indexOf(setup.arena) <= 0 || dungeonState(save, setup.arena).open) ? setup.arena : DUNGEON_ORDER.find((id) => THEMES[id]);
  return { arena, a: fix(setup && setup.a), b: fix(setup && setup.b) };
}

// ---------------------------------------------------------------- the fight
const keyOf = (side, s) => `${side}:${s.k}:${s.rank || 0}`;
const frontish = (k) => { const r = DEFS[k].heroRole || DEFS[k].role; return r === 'tank' ? 0 : r === 'melee' || r === 'skirmish' ? 1 : 2; };

export function newBattle(save, setupIn) {
  const setup = cleanSetup(save, setupIn);
  const bossSide = setup.a.some((s) => isBoss(s.k)) ? 'a' : 'b';           // (that side fights as the sim's 'enemy' team)
  const teamOf = { [bossSide]: 'enemy', [bossSide === 'a' ? 'b' : 'a']: 'hero' };
  const boss = [...setup.a, ...setup.b].find((s) => isBoss(s.k) && DEFS[s.k].arena);
  const most = Math.max(countOf(setup.a), countOf(setup.b));
  const w = battleRoom(setup.arena, { arena: boss ? DEFS[boss.k].arena : null, big: most > 10, obstacles: most > 10 ? 3 : 2 });
  w.battle = { side: { [teamOf.a]: 'a', [teamOf.b]: 'b' } };
  w.stats = battleStats([...setup.a.map((s) => keyOf('a', s)), ...setup.b.map((s) => keyOf('b', s))]);
  w.on.kill = (u) => { if (u.def.onDeath) u.def.onDeath(w, u); };
  const run = { mode: 'battle', theme: setup.arena, floor: 1, party: [], hired: [], heroes: {}, world: w, phase: 'fight', t: 0, fade: 1, coins: 0, gems: 0,
    save, banner: null, stats: null, setup, sides: { a: [], b: [] }, winner: null };

  for (const side of ['a', 'b']) {
    const dir = side === 'a' ? 1 : -1;                                       // Blue starts low (the bottom of the screen), Red high
    // the line-up: tanks in front, fighters behind them, shooters and casters at the back
    const units = [];
    for (const s of setup[side]) for (let i = 0; i < s.n; i++) units.push(s);
    units.sort((p, q) => frontish(p.k) - frontish(q.k));
    const perRow = Math.max(3, Math.floor((w.H - 110) / 66));
    const front = w.W / 2 - dir * Math.min(210, w.W * 0.2);
    units.forEach((s, i) => {
      const row = Math.floor(i / perRow), inRow = Math.min(perRow, units.length - row * perRow), j = i % perRow;
      let x = front - dir * row * 72, y = w.H / 2 + (j - (inRow - 1) / 2) * Math.min(66, (w.H - 110) / inRow);
      if (isBoss(s.k) && w.throne) { x = w.throne.x; y = w.throne.y; }
      const r = DEFS[s.k].r;
      for (let t = 0; t < 12 && !freeSpot(w, x, y, r); t++) { x = Math.max(r + 20, Math.min(w.W - r - 20, x + rrange(-40, 40))); y = Math.max(r + 20, Math.min(w.H - r - 20, y + rrange(-50, 50))); }
      let u;
      if (isHero(s.k)) {
        const sv = (save.heroes && save.heroes[s.k]) || {};
        u = spawnHero(w, save, s.k, { level: Math.max(1, sv.level || 1), potions: 0, trinkets: (sv.trinkets || []).slice() }, x, y, setup.arena);
      } else {
        const home = homeOf(s.k);
        u = battleFoe(w, s.k, x, y, RANK_MULT[DUNGEON_RANK[home] || 0] || 1, s.rank || 0);
      }
      u.team = teamOf[side]; u.aggro = true; u.adopt = false;
      u.facing = u.mvA = dir > 0 ? 0 : Math.PI;
      u.bkey = keyOf(side, s); u.home = { x, y };
      run.sides[side].push(u);
    });
  }
  run.start = { a: run.sides.a.length, b: run.sides.b.length };
  return run;
}

const fighting = (u) => alive(u) && !u.ethereal;
export const sideOf = (w, u) => (w.battle ? w.battle.side[u.team] || null : null);
// Everyone still standing on a side (what it called up mid-fight too).
export function standing(run, side) { const w = run.world; return w.units.filter((u) => fighting(u) && sideOf(w, u) === side); }
const healthOf = (run, side) => { let hp = 0, max = 0; for (const u of run.sides[side]) { max += u.maxHp; if (fighting(u)) hp += Math.max(0, u.hp); } return max ? hp / max : 0; };

export function updateBattle(run, dt) {
  const w = run.world;
  run.fade = Math.max(0, run.fade - dt * 2.5);
  if (run.phase !== 'fight') { run.endT = (run.endT || 0) + dt; if (run.endT < 1.6) { step(w, dt); w.pickups.length = 0; } else if (!run.summary) summarizeBattle(run); return; }
  if (w.hitstop > 0) { w.hitstop -= dt; return; }
  run.t += dt;
  step(w, dt);
  w.pickups.length = 0; // nothing to pick up in a battle
  w.stale = run.t > 75;  // a stand-off (a shooter kiting something that regrows): everyone presses in, nothing mends or flees
  const a = standing(run, 'a').length, b = standing(run, 'b').length;
  // (something still on its way in: bones pulling themselves together, a lobbed slimelet)
  const coming = w.danger.some((z) => z.spawns && !z.done) || w.fx.some((f) => f.spawns && !f.done);
  if ((!a || !b) && !coming) end(run, a ? 'a' : b ? 'b' : 'draw');
  else if (run.t > TIME_LIMIT) { const ha = healthOf(run, 'a'), hb = healthOf(run, 'b'); end(run, Math.abs(ha - hb) < 0.02 ? 'draw' : ha > hb ? 'a' : 'b', true); }
}
function end(run, winner, timeUp) { run.phase = 'over'; run.winner = winner; run.timeUp = !!timeUp; run.endT = 0; }
// Stop it now (the Leave button): whoever has more of its health left takes it.
export function callBattle(run) { if (run.phase !== 'fight') return; const ha = healthOf(run, 'a'), hb = healthOf(run, 'b'); end(run, Math.abs(ha - hb) < 0.02 ? 'draw' : ha > hb ? 'a' : 'b', true); run.endT = 9; summarizeBattle(run); }

// For the result card: per side, one row for each stack with what it did.
export function summarizeBattle(run) {
  if (run.summary) return run.summary;
  const S = run.world.stats, sides = {};
  for (const side of ['a', 'b']) {
    sides[side] = { left: 0, start: run.start[side], health: healthOf(run, side), rows: run.setup[side].map((s) => {
      const mine = run.sides[side].filter((u) => u.bkey === keyOf(side, s)), left = mine.filter(fighting).length;
      return { k: s.k, n: s.n, rank: s.rank || 0, left, ...(S.rows[keyOf(side, s)] || {}) };
    }) };
    sides[side].left = sides[side].rows.reduce((n, r) => n + r.left, 0);
  }
  run.summary = { battle: true, winner: run.winner, timeUp: !!run.timeUp, time: run.t, arena: run.theme, sides, setup: run.setup };
  return run.summary;
}
