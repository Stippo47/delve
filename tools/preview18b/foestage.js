// An enemy at a rank, shown against real heroes (round 18b, lane preview18b; the scenes are js/preview-scenes.js
// FOE_SCENES). attack: its plain blows or shots only (no brain, no ability, no elite move); kit: all it does at normal,
// with its first uses brought forward, and if it does something when it dies a hero fells it near the end so that shows
// too; elite / major: everything it does at that rank. Round 13 to 18 played it on blue straw targets that never moved,
// poked it from nowhere, had its health set lower with no blow, and moved up to it when its move was slow to come.
// The monster and its side don't fall (kept at a quarter, then mending) unless the stage fells it for its death move;
// the heroes hit softly and are kept up (FOE_HERO_DMG, FOE_HERO_FLOOR), so the loop lasts and the move comes round.
const FOE_KEEP = { keepUp: true, downed(w, u) { if (u._bookKilled) return false; u.hp = Math.max(1, u.maxHp * 0.25); u.invulnT = Math.max(u.invulnT, 0.25); return true; } };
function foeStage(S, spec) {
  const { id: k, move, rank } = spec, d0 = DEFS[k], boss = !!d0.boss;
  const r = canRank(k) ? (move === 'elite' ? Math.max(1, rank) : move === 'major' ? 2 : rank) : 0;
  const big = boss || (d0.r || 30) > 46;
  S.size = big ? [900, 620] : [560, 380];
  S.loop = move === 'attack' ? 4 : boss ? 10 : 6.5;
  if (move === 'elite' || move === 'major') S.fit = { min: 4.5, tail: dies0(k, move) ? 3.6 : 2.6, max: 14 };
  const dies = move !== 'attack' && !boss && (d0.onDeath || d0.splits || ((move === 'elite' || move === 'major') && eliteOf(k) && eliteOf(k).death));
  const words = move === 'elite' || move === 'major' ? (ELITE_MOVE[k] || ELITE_MOVE[d0.eliteAs] || '') : '';
  const sc = foeSceneOf(k, move, d0, words, MAJOR_KEY(d0));
  S.scene = sc.name;
  let u, heroes, killT, friend, pack = [], strikes;
  return () => {
    const [W, H] = S.size, w = S.w = room(W, H, S.w), K = big ? 1.6 : 1;
    w.mult = 1; w.bossAdds = ['goblin'];
    if (boss && d0.arena && BOSS_ARENAS[d0.arena]) { try { BOSS_ARENAS[d0.arena](w); buildGrid(w); } catch (e) { /* the hall is optional here */ } }
    const ux = sc.at ? W * sc.at[0] : W * (move === 'attack' ? 0.68 : 0.8), uy = sc.at ? H * sc.at[1] : H / 2;
    u = seededFoe(w, k, ux, uy, r);
    u.aggro = true; u.facing = Math.PI; u.dueSoon = sc.dueSoon ?? 0.4; u.abilT = sc.abilT ?? 1; // its moves come round soon, but not before you've seen it stand there
    if (move === 'attack') { u.def = { ...u.def, brain: null, ability: null, dashCd: 0 }; u.eliteFn = null; u.eliteDeath = null; }
    const watch = (fn, owns) => (fn ? function (...a) { S.mark(w); const hp0 = stateSum(w); const out = fn.apply(this, a); if (S.mark(w) > 0 || Math.abs(stateSum(w) - hp0) > 0.5 || (owns && out === true)) S.fire(); return out; } : fn); // owns: an elite move that takes the tick (returns true) is under way
    // what counts as its move going off: the kit's brain for 'kit'; the elite's own move for 'elite' (or its brain, when the
    // elite move lives there: the entry's tick does nothing and the brain reads u.elite); the major's moves for 'major'
    const E0 = eliteOf(k), noop = !E0 || !E0.tick || /^\s*tick\s*\(\s*\)\s*\{\s*return false;?\s*\}\s*$/.test(String(E0.tick));
    if (u.def.brain && (move === 'kit' || (move === 'elite' && noop))) u.def = { ...u.def, brain: watch(u.def.brain) };
    // while an elite or major is held for its move (below), its own brain waits too, unless that is where the move lives
    else if (u.def.brain && (move === 'major' || (move === 'elite' && !noop))) { const b0 = u.def.brain; u.def = { ...u.def, brain: function (...a) { return held() ? true : b0.apply(this, a); } }; }
    if (move === 'elite' || move === 'major') { u.eliteFn = watch(u.eliteFn, true); u.eliteDeath = watch(u.eliteDeath); }
    if (sc.hp) u.hp = u.maxHp * sc.hp; // (a move that waits for it to be hurt: it starts hurt, the heroes on it)
    u.barAlways = true; u.trinketHooks = [...(u.trinketHooks || []), FOE_KEEP];
    // the heroes: real ones, their abilities held, each where the scene puts them; they move and fight as in a run
    const at = (p) => [Math.min(W - 40, Math.max(40, ux + p[0] * K)), Math.min(H - 40, Math.max(40, uy + p[1] * K))];
    heroes = sc.heroes.map((h) => {
      const [x, y] = at(h.at), kind = DEFS[h.k] && HEROES[h.k] ? h.k : 'paladin';
      const o = fullAlly(w, kind, x, y);
      o.dmgMul *= FOE_HERO_DMG; o.barAlways = true; o.spec = h; o.facing = Math.atan2(uy - y, ux - x);
      if (h.hp) o.hp = o.maxHp * h.hp;
      o.trinketHooks = [...(o.trinketHooks || []), HERO_KEEP];
      if (h.hold) { o.baseMove = o.moveMul; o.moveMul = 1e-4; }
      return o;
    });
    w.stats = newStats([...new Set(heroes.map((o) => o.kind))]); // counted, never shown (the check tool reads it)
    // a friend of its own side, hurt, with a hero on it: for the kinds that mend, guard or quicken others (no blows of their
    // own), for the elite and major moves (war cries, raising the fallen) and for the scenes that ask for one
    friend = null;
    const fk = !boss && (sc.friend || !(d0.dmg > 0) || move === 'elite' || move === 'major') ? friendFor(k) : null;
    if (fk) { friend = spawn(w, fk, ux - 40 * K, uy + 110 * K, { mult: 1 }); friend.aggro = true; friend.facing = Math.PI; friend.home = { x: friend.x, y: friend.y }; friend.hp = friend.maxHp * 0.45; friend.barAlways = true; friend.trinketHooks = [...(friend.trinketHooks || []), FOE_KEEP]; friend.dmgMul *= 0.6; }
    // a pack kind (wolves: howls that need the pack about) gets two of its own kind beside it as well
    pack = [];
    if (move !== 'attack' && (sc.pack || d0.pack || d0.wolf)) for (const dy of [-1, 1]) { const o = spawn(w, k, ux + 30 * K, uy + dy * 105 * K, { mult: 1 }); o.aggro = true; o.facing = Math.PI; o.home = { x: o.x, y: o.y }; o.dueSoon = 9; o.barAlways = true; o.trinketHooks = [...(o.trinketHooks || []), FOE_KEEP]; o.dmgMul *= 0.6; pack.push(o); }
    if (move !== 'attack' && fk && d0.res !== undefined && /rais/i.test(ELITE_MOVE[k] || '')) w.corpses.push({ kind: fk, x: ux - 90, y: uy - 60, r: 30, vr: 22, facing: 1, kx: 0, ky: 0, spin: 0, z: 0, vz: 0, age: 5, t: 14, max: 14 });
    killT = dies && !S.fit ? S.loop - 1.8 : Infinity; // (an elite or major falls a beat after its move: below)
    const lastA = { t: u.lastAttackT, abil: u.abilT }, hold = { x: u.x, y: u.y }; S.hits = hitWatch(); strikes = [];
    function held() { return (move === 'elite' || move === 'major') && !S.fired() && S.t < 2; }
    S.hero = u; S.dummies = heroes; S.friends = [friend, ...pack].filter(Boolean);
    // the felling blow (a death move): the nearest hero turns on it and strikes, or shoots
    const fellIt = () => {
      const by = heroes.filter((o) => !o.downed).sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y))[0];
      if (!by) return;
      const a = Math.atan2(u.y - by.y, u.x - by.x), d = Math.hypot(u.x - by.x, u.y - by.y);
      by.facing = a; by.atkT = Math.max(by.atkT, 0.8);
      if (by.def.role === 'ranged' || d > by.r + u.r + 70) {
        setAnim(by, 'thrust', 0.3);
        w.projectiles.push({ kind: by.def.proj || 'arrow', color: by.def.projColor, x: by.x + Math.cos(a) * (by.r + 6), y: by.y + Math.sin(a) * (by.r + 6), vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, r: 7, team: by.team, owner: by, dmg: 0, o: {}, life: d / 620, a, noHit: true });
        strikes.push({ at: S.t + d / 620, by });
      } else { setAnim(by, by.def.attackAnim || 'swing', (by.def.windup || 0.2) + 0.28); strikes.push({ at: S.t + (by.def.windup || 0.2) + 0.1, by }); }
    };
    S.tick = () => {
      if (dies && S.fit && !lastA.fell && (S.firstT != null ? S.t >= S.firstT + 1.4 : move === 'elite' && !(eliteOf(k) || {}).tick && S.t > 2.2)) { lastA.fell = true; fellIt(); } // a move that is its death (falls apart and gets up) is shown by felling it
      if (S.t >= killT && !lastA.fell) { lastA.fell = true; fellIt(); }
      for (const s of strikes) if (!s.done && S.t >= s.at) { s.done = true; if (!u.dead && !u._bookKilled) { u._bookKilled = true; S.mark(w); u.invulnT = 0; hurt(w, u, u.hp + 1e6, s.by, { noDodge: true, heavy: true }); } }
      for (const o of heroes) {
        if (o.baseMove != null && S.t >= o.spec.hold) { o.moveMul = o.baseMove; o.baseMove = null; }
        if (o.spec.on === 'friend' && friend && !friend.dead && !friend.downed) o.target = friend;
      }
    };
    S.after = (dt) => {
      if (u.lastAttackT !== lastA.t) { lastA.t = u.lastAttackT; if (move === 'attack') S.fire(); }
      if (move === 'kit' && u.abilT > lastA.abil + 0.5) S.fire(); // its ability went off (sim.js resets the timer)
      lastA.abil = u.abilT;
      if (u._bookKilled && u.dead && S.mark(w) > 0) S.fire();
      const hit = S.hits(heroes) > 0;
      if (hit && (move === 'attack' || move === 'kit')) S.fire(); // its blows landed (for a kit, its brain may be its attack)
      if (move === 'kit' && d0.pass && Math.hypot(u.x - hold.x, u.y - hold.y) > 150) S.fire(); // a roller: rolling and bouncing is what it does
      // an elite or major is held where it stands (it can still act) until its move has gone off, so moves that want
      // room (throws, charges, leaps) get it before it has walked up to them; never longer than 2 s
      if (held() && !u.dead && !u.act) { u.x = hold.x; u.y = hold.y; u.vx = u.vy = 0; }
      // the heroes: their abilities held, kept up (they mend when low), kept in the yard
      for (const o of heroes) {
        for (const c in o.kit.cd) o.kit.cd[c] = Math.max(o.kit.cd[c], 5);
        if (o.downed) { o.downed = false; o.hp = o.maxHp * 0.3; }
        if (o.hp < o.maxHp * FOE_HERO_FLOOR) o.hp = o.maxHp * FOE_HERO_FLOOR;
        if (o.hp < o.maxHp * 0.35) o.hp += o.maxHp * 0.12 * dt;
        o.x = Math.min(W - 30, Math.max(30, o.x)); o.y = Math.min(H - 30, Math.max(30, o.y));
        if (o.baseMove != null && !o.act) { const q = Math.min(1, dt * 3), [hx, hy] = at(o.spec.at); o.x += (hx - o.x) * q; o.y += (hy - o.y) * q; }
      }
      // its own side: kept up, mending slowly once low (no health is ever set lower)
      for (const o of [u, friend, ...pack]) if (o && !o.dead && !o._bookKilled && o.hp < o.maxHp * 0.35) o.hp += o.maxHp * 0.25 * dt;
      if (!u.dead) { u.x = Math.min(W - 40, Math.max(40, u.x)); u.y = Math.min(H - 40, Math.max(40, u.y)); }
    };
  };
}
