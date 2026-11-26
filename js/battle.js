// Battle mode (round 10). The designer: "Add a battle game mode. I can pin any unit against each other and any enemy
// whose dungeon I have defeated. So I can make a team of 10 skeletons and necromancer vs a knight and tower."
// Two sides, Blue (a) and Red (b), each a list of stacks { k: kind, n: how many, rank: 0 plain | 1 elite | 2 major }.
// Heroes are the ones you own, with the build and trinkets they have in the camp; an enemy is as strong as it is on
// the first floor of the dungeon it comes from. Nothing is earned or lost: no gold, XP, drops or book counts.
//
// A battle is a run-shaped object ({ mode: 'battle', world, phase, t, ... }) so main.js can step and draw it like a
// run. The sim knows two teams, 'hero' and 'enemy'; w.battle = { side: { hero: 'a' | 'b', enemy: ... } } says which
// colour each is. Bosses only know how to fight from the 'enemy' team, so the side with a boss gets that team.
import { step, alive, bleedOut } from './sim.js';
import { DEFS } from './units.js';
import { HEROES, HERO_IDS, tierBuild } from './heroes.js';
import { spawn } from './sim.js';
import { initKit } from './kits.js';
import { THEMES, DUNGEON_ORDER } from './themes.js';
import { battleRoom, battleFoe, spawnHero, freeSpot, RANK_MULT, R12_MULT, DUNGEON_RANK } from './dungeon.js';
import { battleStats } from './stats.js';
import { dungeonState } from './progress.js';
import { rrange, clamp, TAU, INK } from './util.js';
import { LOOSE_BOSSES } from './bosses.js'; // round 19 (lane spider19): bosses in no dungeon yet

export const SIDE_MAX = 20;      // units a side
export const STACK_MAX = 12;     // of one kind
export const SIDES = { a: { name: 'Blue', color: '#5FA8FF' }, b: { name: 'Red', color: '#FF6B5A' } };
export const RANKS = ['', 'Elite', 'Major'];
// Round 13: a hero stack's tier. null = the build and trinkets it has at camp ("Yours"); 0-3 = heroes.js tierBuild
// (0 nothing bought, 1 the first shell with every ability, 2 the second shell, 3 the whole web), no trinkets.
export const TIERS = [null, 0, 1, 2, 3];
export const tierName = (t) => (t == null ? 'Yours' : 'Tier ' + t);
export const SIZES = { s: { name: 'Small', w: 960, h: 480 }, l: { name: 'Large', w: 1280, h: 960 }, h: { name: 'Huge', w: 1760, h: 1440 } };
// "Add dev unlock": save.battleDev (a switch on the battle page) fields everything, beaten or not, owned or not.
const devOpen = (save) => !!save.cheat || !!save.battleDev;
const TIME_LIMIT = 240;          // a fight that hasn't ended by then goes to whoever has more health left
// Round 18 (lane downed18), the designer: "Battle mode can have downed allies that can only be revived with abilities.
// (Corpses can be used for necromancy)". A hero at 0 goes down as in a dungeon (sim.js killNow): out of the fight,
// lying grey, not a target. Only an ability brings it back (Valkyrie's Call; the Clockmaker's Rewind III): no standing
// over it, no getting up when the fight ends. Nobody can finish it off, but after BLEED_T it bleeds out: it dies
// where it lies and leaves a body (sim.js bleedOut) that a Necromancer can raise. A downed hero is no body to raise.
// A side whose every fighter is down or dead has lost (standing() counts only those up).
export const BLEED_T = 15;

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
    dungeons.push({ id, name: T.name, open: devOpen(save) || dungeonState(save, id).cleared > 0, kinds: kinds.filter(fresh), bosses: bosses.filter(fresh) });
  }
  // round 19 (lane spider19): bosses that live in no dungeon yet (bosses.js LOOSE_BOSSES) on a tab of their own, always open
  { const loose = LOOSE_BOSSES.filter((k) => DEFS[k] && !seen.has(k)); const folk = Object.keys(DEFS).filter((k) => DEFS[k].folk && !seen.has(k)); /* (round 19, lane bases19: the Villager, a test unit) */ if (loose.length || folk.length) dungeons.push({ id: 'loose', name: 'No dungeon yet', open: true, kinds: folk, bosses: loose, note: 'Not in a dungeon yet. As strong as a boss of the third dungeon.' }); }
  const heroes = HERO_IDS.filter((h) => devOpen(save) || (save.heroes[h] && save.heroes[h].owned));
  return { heroes, dungeons };
}
export const homeOf = (() => { let map = null; return (kind) => {
  if (!map) { map = {}; for (const id of DUNGEON_ORDER) { const T = THEMES[id]; if (!T) continue; const { kinds, bosses } = kindsOf(T); for (const k of [...kinds, ...bosses]) if (!map[k]) map[k] = id; } }
  return map[kind] || (DEFS[kind] && DEFS[kind].home) || null; // (round 19, lane spider19: def.home, the dungeon whose strength a boss in no dungeon fights at)
}; })();
export const isHero = (k) => !!HEROES[k];
export const isBoss = (k) => !!(DEFS[k] && DEFS[k].boss);
export const canRank = (k) => !isHero(k) && !isBoss(k) && !(DEFS[k] && DEFS[k].noElite);
export const isTrap = (k) => !!(DEFS[k] && DEFS[k].trap);
export const countOf = (list) => list.reduce((a, s) => a + s.n, 0);

// What's wrong with a setup, as a sentence, or null. Stacks that can't be fielded any more (a hero sold, a save from
// before) are dropped by cleanSetup first.
export function setupProblem(setup) {
  if (!countOf(setup.a) || !countOf(setup.b)) return 'Each side needs someone.';
  if (setup.a.some((s) => isBoss(s.k)) && setup.b.some((s) => isBoss(s.k))) return 'Bosses can only be on one side.';
  // round 16 fix: a trap (the Saw Blade) can't be hit, so it never counts as standing; a side of only traps lost at once
  if (['a', 'b'].some((sd) => setup[sd].every((s) => isTrap(s.k)))) return "A trap can't hold a side alone: add a fighter.";
  return null;
}
export function cleanSetup(save, setup) {
  const R = battleRoster(save), ok = new Set(R.heroes);
  for (const d of R.dungeons) if (d.open) for (const k of [...d.kinds, ...d.bosses]) ok.add(k);
  const fix = (list) => (Array.isArray(list) ? list : []).filter((s) => s && ok.has(s.k) && s.n > 0)
    .map((s) => ({ k: s.k, n: Math.min(STACK_MAX, Math.floor(s.n)), rank: canRank(s.k) ? Math.max(0, Math.min(2, s.rank | 0)) : 0,
      tier: isHero(s.k) && s.tier != null && s.tier >= 0 && s.tier <= 3 ? s.tier | 0 : null }));
  const arena = setup && THEMES[setup.arena] && (devOpen(save) || DUNGEON_ORDER.indexOf(setup.arena) <= 0 || dungeonState(save, setup.arena).open) ? setup.arena : DUNGEON_ORDER.find((id) => THEMES[id]);
  // scaled (the designer: "Both. Toggles scaled stats on and off."): on, a monster is as strong as on its own dungeon's
  // first floor; off, every monster is at the first dungeon's strength, so kinds can be compared like for like.
  return { arena, size: setup && SIZES[setup.size] ? setup.size : 'l', scaled: !setup || setup.scaled !== false, a: fix(setup && setup.a), b: fix(setup && setup.b) };
}

// ---------------------------------------------------------------- the fight
export const keyOf = (side, s) => `${side}:${s.k}:${s.rank || 0}:${s.tier == null ? 'y' : s.tier}`;
const frontish = (k) => { const r = DEFS[k].heroRole || DEFS[k].role; return r === 'tank' ? 0 : r === 'melee' || r === 'skirmish' ? 1 : 2; };

export function newBattle(save, setupIn) {
  const setup = cleanSetup(save, setupIn);
  const bossSide = setup.a.some((s) => isBoss(s.k)) ? 'a' : 'b';           // (that side fights as the sim's 'enemy' team)
  const teamOf = { [bossSide]: 'enemy', [bossSide === 'a' ? 'b' : 'a']: 'hero' };
  const boss = [...setup.a, ...setup.b].find((s) => isBoss(s.k) && DEFS[s.k].arena);
  const most = Math.max(countOf(setup.a), countOf(setup.b));
  const sz = SIZES[setup.size] || SIZES.l;
  const w = battleRoom(setup.arena, { arena: boss ? DEFS[boss.k].arena : null, W: sz.w, H: sz.h, obstacles: Math.round(2 * sz.w * sz.h / (960 * 480)) });
  w.battle = { side: { [teamOf.a]: 'a', [teamOf.b]: 'b' } };
  w.stats = battleStats([...setup.a.map((s) => keyOf('a', s)), ...setup.b.map((s) => keyOf('b', s))]);
  w.on.kill = (u) => { if (u.def.onDeath) u.def.onDeath(w, u); };
  w.drawBodies = (ctx) => drawDowned(ctx, w); // render.js: with the bodies, under everything (round 19, lane corpses19: it was over the units)
  const run = { mode: 'battle', theme: setup.arena, floor: 1, party: [], hired: [], heroes: {}, world: w, phase: 'fight', t: 0, fade: 1, coins: 0, gems: 0,
    save, banner: null, stats: null, setup, sides: { a: [], b: [] }, winner: null,
    log: [] }; // round 18: { t, ev: 'down' | 'up' | 'out', side, k, by, ab } (who went down, who brought whom back, who bled out)
  w.on.heroDown = (u) => { u.bleedT = BLEED_T; const S = w.stats.rows[u.bkey]; if (S) S.downs = (S.downs || 0) + 1; run.log.push({ t: run.t, ev: 'down', side: sideOf(w, u), k: u.kind }); };

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
        if (s.tier == null) u = spawnHero(w, save, s.k, { level: Math.max(1, sv.level || 1), potions: 0, trinkets: (sv.trinkets || []).slice() }, x, y, setup.arena);
        else { u = spawn(w, s.k, x, y, { level: 1, potions: 0, trinkets: [] }); initKit(u, s.k, { nodes: tierBuild(s.k, s.tier) }, 1); } // a set tier: that build, nothing else
      } else {
        const home = homeOf(s.k);
        // (round 17: a boss isn't priced, prices.js, so it keeps the old strength table, R12_MULT)
        u = battleFoe(w, s.k, x, y, setup.scaled ? (isBoss(s.k) ? R12_MULT : RANK_MULT)[DUNGEON_RANK[home] || 0] || 1 : RANK_MULT[0], s.rank || 0);
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

// Round 16 fix: out of sight is not out of the fight. A hero (anything with a kit) that goes ethereal (Burrow, Broom
// Ride, Call the Flock, Bush, the Shade's Shadow Walk, Blackout and Fade) and a foe the Digger buried are still in it:
// a lone one going under used to end the battle on the spot. Traps (the Saw Blade) never count: they can't be hit.
const outOfSight = (u) => !!(u.kit || u.buried || (u.bur && u.bur.state === 'under'));
const fighting = (u) => alive(u) && !u.def.trap && !(u.linkTo && u.def.segment) && !(u.partOf && u.partOf.bodies) && (!u.ethereal || outOfSight(u)); // (round 15, the Mob: its four bodies are one fighter, its lead) // (round 13, lane E: one under the sand is still in it: a lone sand serpent or scarab going under ended the fight; a chain's links are its head's, not more of it)
export const sideOf = (w, u) => (w.battle ? w.battle.side[u.trueTeam || u.team] || null : null); // (round 13: a charmed or befuddled unit still belongs to its own side)
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
  downedTick(run, dt);
  w.pickups.length = 0; // nothing to pick up in a battle
  w.stale = run.t > 75;  // a stand-off (a shooter kiting something that regrows): everyone presses in, nothing mends or flees
  const a = standing(run, 'a').length, b = standing(run, 'b').length;
  // (something still on its way in: bones pulling themselves together, a lobbed slimelet)
  const coming = w.danger.some((z) => z.spawns && !z.done) || w.fx.some((f) => f.spawns && !f.done);
  if ((!a || !b) && !coming) end(run, a ? 'a' : b ? 'b' : 'draw');
  else if (run.t > TIME_LIMIT) { const ha = healthOf(run, 'a'), hb = healthOf(run, 'b'); end(run, Math.abs(ha - hb) < 0.02 ? 'draw' : ha > hb ? 'a' : 'b', true); }
}
// Round 18: the downed bleed out; a revive (kits2.js Valkyrie's Call, kits3.js Rewind: u.revivedByKit) is noted.
function downedTick(run, dt) {
  const w = run.world;
  for (const u of w.units) {
    if (u.revivedByKit) {
      u.revivedByKit = false; u.bleedT = 0;
      const by = u.revivedBy, S = w.stats.rows;
      if (S[u.bkey]) S[u.bkey].revived = (S[u.bkey].revived || 0) + 1;
      if (by && S[by.bkey]) S[by.bkey].revives = (S[by.bkey].revives || 0) + 1;
      run.log.push({ t: run.t, ev: 'up', side: sideOf(w, u), k: u.kind, by: by ? by.kind : null, ab: u.revivedAb || null });
      u.revivedBy = null; u.revivedAb = null;
    }
    if (!u.downed || u.dead || u.partOf) continue;
    if (u.bleedT == null) u.bleedT = BLEED_T;
    u.bleedT -= dt;
    if (u.bleedT <= 0) { bleedOut(w, u); run.log.push({ t: run.t, ev: 'out', side: sideOf(w, u), k: u.kind }); }
  }
}
// A downed hero's ring in its side's colour runs down as it bleeds out, pulsing over its last few seconds.
function drawDowned(ctx, w) {
  for (const u of w.units) {
    if (!u.downed || u.dead || u.partOf || u.bleedT == null) continue;
    const left = clamp(u.bleedT / BLEED_T, 0, 1), late = u.bleedT < 4, R = u.vr * 1.6 + 8, sd = sideOf(w, u);
    ctx.save(); ctx.lineCap = 'round';
    ctx.globalAlpha = late ? 0.6 + 0.35 * Math.sin(w.time * 11) : 0.85;
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = sd ? SIDES[sd].color : '#F2C14E'; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.arc(u.x, u.y, R, -Math.PI / 2, -Math.PI / 2 + Math.max(0.05, left) * TAU); ctx.stroke();
    ctx.restore();
  }
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
      const down = mine.filter((u) => u.downed && !u.dead).length; // (round 18: lying downed when it ended)
      return { k: s.k, n: s.n, rank: s.rank || 0, tier: s.tier, left, down, ...(S.rows[keyOf(side, s)] || {}) };
    }) };
    sides[side].left = sides[side].rows.reduce((n, r) => n + r.left, 0);
  }
  const revives = run.log.filter((e) => e.ev === 'up'), bleeds = run.log.filter((e) => e.ev === 'out').length;
  run.summary = { battle: true, winner: run.winner, timeUp: !!run.timeUp, time: run.t, arena: run.theme, sides, setup: run.setup, revives, bleeds };
  return run.summary;
}
