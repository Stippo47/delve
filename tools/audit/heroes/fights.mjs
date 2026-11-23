// Round 16 (the balance audit): one fight of a scenario (scenarios.mjs) with the recorder on (recorder.mjs).
// Import after setting globalThis.location and globalThis.localStorage.
//   battle(hero, tier, scenario, seed, record) and dungeon(hero, tier, seed, record) -> { outcome, t, hpLeft, ..., data }
// A Recorder subclass can be passed as record (tools that want more than the counts).
// opts.fairEnd (a what-if for the test runner only, not the game): the battle does not end while a side still has
// someone alive who is only out of sight (ethereal or hidden: underground, a flock, a broom, buried). battle.js ends it
// on the spot (report section 4, vanish-check.mjs); this lets those heroes' fights run their course to be measured.
const B = await import('../../../js/battle.js');
const D = await import('../../../js/dungeon.js');
const { setSeed } = await import('../../../js/util.js');
const { HEROES, tierBuild } = await import('../../../js/heroes.js');
const { freshSave } = await import('../../../js/save.js');
const { Recorder } = await import('./recorder.mjs');
const { step } = await import('../../../js/sim.js');
const SC = await import('./scenarios.mjs');
const DT = 1 / 60;
const save = freshSave(); save.cheat = true;
const alive = (u) => !!u && !u.dead && !u.downed;
const recOf = (record) => (!record ? null : typeof record === 'function' ? new record() : new Recorder());

// ---------------------------------------------------------------- one battle
// updateBattle (battle.js) as it is, with its end check counting a living unit that is out of sight as still in the fight
function updateFair(run, dt) {
  const w = run.world;
  run.fade = Math.max(0, run.fade - dt * 2.5);
  if (run.phase !== 'fight') return;
  if (w.hitstop > 0) { w.hitstop -= dt; return; }
  run.t += dt; step(w, dt); w.pickups.length = 0; w.stale = run.t > 75;
  const inIt = (u) => alive(u) && !(u.linkTo && u.def.segment) && !(u.partOf && u.partOf.bodies);
  const n = (side) => w.units.filter((u) => inIt(u) && B.sideOf(w, u) === side).length;
  const a = n('a'), b = n('b'), coming = w.danger.some((z) => z.spawns && !z.done) || w.fx.some((f) => f.spawns && !f.done);
  if ((!a || !b) && !coming) { run.phase = 'over'; run.winner = a ? 'a' : b ? 'b' : 'draw'; }
}
export function battle(hero, tier, sc, seed, record = true, opts = {}) {
  setSeed(seed);
  const a = [{ k: hero, n: 1, tier }]; if (sc.ally) a.push({ k: sc.ally(hero), n: 1, tier });
  const foes = sc.foes(hero, tier);
  const run = B.newBattle(save, { arena: 'crypt', size: 'l', scaled: false, a, b: foes });
  const w = run.world, mult = SC.FOE_MULT[tier] * (typeof sc.mul === 'object' ? sc.mul[tier] : sc.mul || 1);
  // stronger monsters at the higher tiers: made again as a stronger place's (battleFoe with a bigger mult), where they stood
  if (mult && mult !== D.RANK_MULT[0]) run.sides.b = run.sides.b.map((u) => {
    if (HEROES[u.kind]) return u;
    const s = foes.find((x) => x.k === u.kind), n = D.battleFoe(w, u.kind, u.x, u.y, mult, (s && s.rank) || 0);
    w.units = w.units.filter((x) => x !== u);
    n.team = u.team; n.aggro = true; n.adopt = false; n.facing = n.mvA = u.facing; n.bkey = u.bkey; n.home = u.home;
    return n;
  });
  const f = run.sides.a.find((u) => u.kind === hero);
  const rec = recOf(record); if (rec) rec.attach(w, f);
  const up = opts.fairEnd ? updateFair : B.updateBattle;
  while (run.phase === 'fight' && run.t < SC.BATTLE_CAP) { up(run, DT); if (rec) rec.step(true); }
  const data = rec ? rec.finish() : null;
  const timeout = run.phase === 'fight';
  const hpOf = (side) => { let h = 0, m = 0; for (const u of run.sides[side]) { m += u.maxHp; if (alive(u)) h += Math.max(0, u.hp); } return m ? h / m : 0; };
  return { outcome: timeout ? 'timeout' : run.winner === 'a' ? 'win' : run.winner === 'b' ? 'loss' : 'draw', t: run.t, hpLeft: alive(f) ? f.hp / f.maxHp : 0,
    sideHp: hpOf('a'), foeHp: hpOf('b'), data, run };
}

// ---------------------------------------------------------------- one dungeon floor
export function dungeon(hero, tier, seed, record = true) {
  const party = [hero, ...SC.MATES(hero)], theme = SC.DUNGEON_THEMES[seed % SC.DUNGEON_THEMES.length];
  const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = 1; h.trinkets = []; h.nodes = tierBuild(k, tier); }
  s.party = party.slice(); s.trinkets = []; s.potions = 0; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true };
  setSeed(seed);
  const run = D.newRun(s, { theme, party, asRank: tier >= 3 ? 1 : 0, bare: true });
  const rec = recOf(record);
  const find = (w) => w.units.find((u) => u.kind === hero && !u.summon && (u.trueTeam || u.team) === 'hero');
  let t = 0, cleared = false;
  const fightingIn = (w) => w.units.some((e) => (e.trueTeam || e.team) === 'enemy' && alive(e) && e.aggro && !(e.def && e.def.trap));
  if (rec) { const f = find(run.world); if (f) rec.attach(run.world, f); }
  while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < SC.DUNGEON_CAP) {
    D.update(run, DT); t += DT;
    if (run.floor > 1) { cleared = true; break; }
    if (rec) {
      const w = run.world;
      if (rec.w !== w || !rec.f || rec.f.dead) { const f = find(w); if (f && f !== rec.f) rec.attach(w, f); }
      if (rec.w === w) rec.step(fightingIn(w));
    }
  }
  const data = rec ? rec.finish() : null;
  const f = find(run.world);
  return { outcome: cleared ? 'win' : run.phase === 'lost' ? 'loss' : 'timeout', t: data ? data.t : t, rooms: run.rooms, theme, hpLeft: alive(f) ? f.hp / f.maxHp : 0, data };
}

