// The ruler for the Book's previews (round 18, lane preview18): what tools/preview-check.mjs reports, and what
// tools/preview18/measure.mjs used to count the old previews against the new ones. No DOM; it steps js/preview-sim.js.
//   measureAbility(id, ab, tier, loops) -> one record a loop:
//     cast / casts   when it first went off that loop, and how many times the hero's brain spent it
//     brain / forced the hero's own brain chose it (sim.js kitThink / kitReflex) / the stage cast it (preview-sim forceAt)
//     right          the game's own scorer agreed the scene called for it then (score or reflex >= 0.3), or, for one
//                    that works through a hook, the hook acted on a blow that was seen
//     shown          it drew something of its own or touched someone; reached: it touched a foe or a friend
//     sig            what it made, for the tier comparison; trace: where everyone was, a quarter second apart
//     unseen         blows on the hero side with nothing to see behind them (see `seen`)
//   unseenBlows(spec, loops) -> { blows, why }: the same count for any stage (an attack, a trait, a trinket, a potion)
const PS = await import('../js/preview-sim.js');
const { AUDIT, CUR, sourceOf, ownerOf, newStats } = await import('../js/stats.js');
const { ABILITIES } = await import('../js/kits.js');
const { setSeed } = await import('../js/util.js');
const DT = 1 / 30;

const isWeaponDummy = (s) => s && s.def.dummy && /dummy-/.test(s.def.art || '');
// a blow on the hero side that can be seen: a real unit, a shot, a zone or a burn, the hero's own price, a target that
// holds a weapon and is swinging it (or a bow)
export function seen(u, src, o) {
  if (o.dot || o.zone || o.explosion || o.gas || o.shot || o.slam || o.guarded) return true;
  // sim.js physics: thrown into a wall, or bowled over by a body flying into it (no src; it is moving fast as it lands)
  if (!src) return Math.hypot(u.kx || 0, u.ky || 0) > 25 || (u.partOf && Math.hypot(u.partOf.kx || 0, u.partOf.ky || 0) > 25) || (u.bodies || []).some((b) => Math.hypot(b.kx || 0, b.ky || 0) > 25);
  if (src === u || src.team === u.team) return true;
  if (!src.def.dummy) return true;
  return isWeaponDummy(src) && (!!src.anim || /bow/.test(src.def.art));
}

export function measureAbility(id, ab, tier, loops = 2) {
  setSeed(11);
  const S = PS.makeStage({ t: 'hero', id, move: ab, tier });
  const A = ABILITIES[ab] || {}, passive = !!A.passiveTier || ab === 'oldBones';
  const rec = []; let cur = null;
  const newLoop = () => { cur = { brain: false, forced: false, cast: null, casts: 0, right: null, hook: 0, unseen: 0, unseenWhy: [], hit: new Set(), healed: new Set(), st: new Set(), buffs: new Set(), dmg: 0, heal: 0, summons: 0, fx: 0, r: 0, cc: 0, block: 0, kept: 0, dur: 0, kn: 0, trace: [], stAmt: {}, after: 0, held: new Set(), arc: 0, firstScore: null }; rec.push(cur); };
  newLoop();
  let hero = S.hero, inAb = 0, lastRunT = -9, lastBlow = null; const upWas = new Map(); const blowSeen = new Set();
  const mine = (src, o) => { const root = ownerOf(src); if (!root || root !== hero) return false; const s = sourceOf(src, root, o || {}); return s === 'ab:' + ab || s === 'pet' || (CUR.ab === ab && CUR.abU === hero); };
  AUDIT.on = (ev, w, u, src, amt, o = {}) => {
    if (w && w !== S.w) return;
    if (ev === 'abRun' && u === hero && o.ab === ab && o.at === 'pre') {
      if (S.t - lastRunT > 0.25) { // a new use (not one of its later pieces): count it
        if (cur.cast == null) { cur.cast = S.t; let sc = 0; try { sc = Math.max(A.score ? A.score(w, u, u.target, tier) : 0, A.reflex ? A.reflex(w, u, u.target, tier) : 0); } catch {} cur.firstScore = sc; }
      }
      lastRunT = S.t;
    }
    if (ev === 'cast' && u === hero && o.ab === ab) { cur.casts++; if (cur.right == null) cur.right = true; }
    if (ev === 'cast' && u === hero && o.ab !== ab) cur.other = (cur.other || 0) + 1;
    // every blow that reaches the hero or a friend, landed, caught, dodged or kept off (takenBuffs / block / keep)
    if ((ev === 'takenBuffs' || ev === 'block' || ev === 'keep') && u && u.team === hero.team && !u.summon && !u.partOf && !o.dot) {
      const key = u.id + ':' + (src ? src.id : 'x') + ':' + S.t.toFixed(3);
      if (!blowSeen.has(key)) { blowSeen.add(key); if (!seen(u, src, o)) { cur.unseen++; if (cur.unseenWhy.length < 3) cur.unseenWhy.push((u === hero ? 'hero' : u.kind) + '<-' + (src ? src.kind : 'nothing')); } }
    }
    if (ev === 'takenBuffs' && u && u.team !== hero.team) lastBlow = { u, t: S.t, mine: mine(src, o), hero: ownerOf(src || o.by) === hero };
    if (ev === 'hurt' && u && u.team !== hero.team && cur.cast != null && S.t - cur.cast < 6 && ownerOf(src || o.by) === hero) cur.after += amt;
    if (ev === 'hurt' && u && u.team !== hero.team && mine(src, o)) { cur.hit.add(u.id); cur.dmg += amt; if (o.knock) cur.kn = Math.max(cur.kn, Math.round(o.knock / 60)); }
    if (ev === 'heal' && u && u.team === hero.team && amt > 0.5 && (mine(src, o) || (cur.cast != null && ownerOf(src) === hero && S.t - cur.cast < 8))) { cur.healed.add(u.id); cur.heal += amt; }
    if (ev === 'status' && u && (mine(src, o) || (CUR.ab === ab && CUR.abU === hero) || (lastBlow && lastBlow.u === u && lastBlow.t === S.t && lastBlow.mine) || (cur.cast != null && ownerOf(src) === hero && !(lastBlow && lastBlow.u === u && lastBlow.t === S.t)) || (cur.cast != null && S.t - cur.cast < 6 && lastBlow && lastBlow.u === u && lastBlow.t === S.t && lastBlow.hero))) { cur.stAmt[o.type] = (cur.stAmt[o.type] || 0) + amt; cur.st.add((u.team === hero.team ? 'f:' : '') + o.type); }
    if (ev === 'buff' && CUR.ab === ab && CUR.abU === hero && u) cur.buffs.add((u === hero ? 'me:' : u.team === hero.team ? 'f:' : 'e:') + (o.id || '?') + '@' + Math.round((amt || 0) * 2) / 2 + ':' + Object.keys(o).filter((k) => !['id', 'dur', 't'].includes(k) && o[k] !== false && o[k] != null).sort().map((k) => k + (typeof o[k] === 'number' ? Math.round(o[k] * 20) / 20 : '')).join('/'));
    if (ev === 'hook' && (CUR.abU === hero || cur.cast != null) && u !== undefined) cur.buffs.add('h:' + String((o && o.id) || '?').replace(/\d+$/, '') + Object.keys(o || {}).filter((k) => typeof o[k] === 'number' && k !== 'until' && k !== 't').sort().map((k) => k + Math.round(o[k])).join('/'));
    if (ev === 'block' && u && u.team === hero.team) cur.block++;
    if (ev === 'guard' && o && o.by === hero) { cur.block++; cur.kept += amt; cur.shared = (cur.shared || 0) + amt; }
    if (ev === 'block' && u && u.team === hero.team) cur.kept += amt;
  };
  const seenFx = new WeakSet(), seenU = new WeakSet();
  let loops0 = S.loops, hp0 = null, ab0 = 0;
  const N = Math.ceil(loops * S.loop / DT) + 400;
  try {
    for (let i = 0; i < N && rec.length <= loops; i++) {
      if (S.loops !== loops0) { loops0 = S.loops; hero = S.hero; if (rec.length >= loops) { rec.length = loops; break; } newLoop(); lastRunT = -9; }
      if (!S.w.stats) S.w.stats = newStats([S.hero.kind, ...new Set(S.w.units.filter((o) => o.team === 'hero').map((o) => o.kind))]);
      const hpBefore = new Map(S.w.units.filter((o) => o.team === hero.team && !o.summon).map((o) => [o, o.hp]));
      const runs0 = lastRunT, fires0 = S.fires;
      let got = 0; const prev = AUDIT.on; const hurtSum = new Map();
      AUDIT.on = (ev, w, u, src, amt, o) => { if (ev === 'hurt' && u) hurtSum.set(u, (hurtSum.get(u) || 0) + amt); prev(ev, w, u, src, amt, o); };
      S.step(DT);
      AUDIT.on = prev;
      if (S.loops !== loops0) continue; // a fresh world: nothing to compare
      if (S.byBrain) cur.brain = true; if (S.forced) cur.forced = true;
      for (const o of S.w.units) if (o.team === hero.team && !o.summon) { const was = upWas.get(o); if (was && was.down && !o.downed) cur.revived = Math.max(cur.revived || 0, Math.round(10 * o.hp / o.maxHp)); const st = Object.values(o.st).reduce((a, b) => a + (b || 0), 0); if (was && cur.cast != null && was.st - st > 25) cur.cleansed = (cur.cleansed || 0) + 1; upWas.set(o, { down: o.downed, st }); }
      if (Math.floor(S.t * 4) !== Math.floor((S.t - DT) * 4)) cur.trace.push(S.w.units.map((o) => (o.x / 4 | 0) + ',' + (o.y / 4 | 0) + ',' + (o.hp | 0) + (o.downed ? 'd' : '') + ',' + (Object.values(o.st).reduce((p, q) => p + (q || 0), 0) / 10 | 0) + ',' + o.buffs.length + (o.stunT > 0 || o.rootT > 0 || o.sleepT > 0 || o.frozenT > 0 ? 'h' : '')).join(';') + '#' + S.w.fx.length + ',' + S.w.projectiles.length + ',' + S.w.hazards.length + ',' + S.w.walls.length);
      // health set lower with no blow behind it (and not by the hero's own ability this step)
      for (const [o, h] of hpBefore) if (S.w.units.includes(o) && !o.downed && o.maxHp && h - o.hp > (hurtSum.get(o) || 0) + o.maxHp * 0.02 && lastRunT === runs0) { cur.unseen++; if (cur.unseenWhy.length < 3) cur.unseenWhy.push((o === hero ? 'hero' : o.kind) + ' hp set'); }
      if (S.fires > fires0 && cur.cast == null && passive) { cur.cast = S.t; }
      if (passive && S.fires > fires0) cur.hook++;
      if (S.castT != null && cur.cast == null) cur.cast = S.castT;
      for (const f of [...S.w.fx, ...S.w.telegraphs, ...S.w.danger, ...S.w.hazards, ...S.w.projectiles, ...S.w.walls]) if (!seenFx.has(f)) { seenFx.add(f); if ((f.ab === ab || (cur.cast != null && f.temp != null)) && f.type !== 'sig') { cur.fx++; if (f.r) cur.r = Math.max(cur.r, Math.round(f.r / 8)); const d = f.dur || f.temp || f.max || 0; if (f.hw) cur.r = Math.max(cur.r, Math.round(f.hw / 6)); if (f.arc) cur.arc = Math.max(cur.arc, Math.round(f.arc * 4)); if (f.len) cur.r = Math.max(cur.r, Math.round(f.len / 30)); if (d < 60) cur.dur = Math.max(cur.dur, Math.round(d * 2)); if (f.w && f.h) cur.r = Math.max(cur.r, Math.round(Math.max(f.w, f.h) / 15)); } }
      // the hero itself: moved by it (a roll, a leap, a charge), made untouchable, hidden or changed
      if (cur.cast != null && S.t - cur.cast < 2) { if (!cur.at) cur.at = { x: hero.x, y: hero.y }; if (Math.hypot(hero.x - cur.at.x, hero.y - cur.at.y) > 60) cur.self = true; if (hero.invulnT > 0.2 || hero.ethereal || hero.hidden || hero.stealthT > 0 || (hero.buffs || []).some((b) => b.id && b.id !== 'rhythm')) cur.self = true; }
      for (const o of S.w.units) if (!seenU.has(o)) { seenU.add(o); if (o !== hero && (ownerOf(o) === hero || (o.summon && o.team === hero.team && S.t > 0.3))) cur.summons++; }
      for (const o of S.w.units) if (o.team !== hero.team) for (const k of ['stunT', 'rootT', 'sleepT', 'frozenT', 'koT', 'buriedT', 'pinT', 'liftT', 'fearT', 'shackledT', 'trappedT']) if (o[k] > 0.2) { cur.cc = Math.max(cur.cc, Math.round(o[k] * 2)); if (cur.cast != null) cur.held.add(o.id); }
    }
  } finally { AUDIT.on = null; }
  return rec.map((r) => ({ cast: r.cast, casts: r.casts, right: r.cast == null ? false : passive ? r.hook > 0 && r.unseen === 0 : r.brain || (r.firstScore != null && r.firstScore >= 0.3), brain: r.brain, forced: r.forced,
    score: r.firstScore, reached: r.hit.size + r.healed.size + r.st.size + r.buffs.size + r.summons + r.block > 0 || r.cc > 0, shown: r.hit.size + r.healed.size + r.st.size + r.buffs.size + r.summons + r.block + r.fx > 0 || r.cc > 0 || !!r.self,
    unseen: r.unseen, unseenWhy: r.unseenWhy,
    sig: { hit: r.hit.size, healed: r.healed.size, st: [...r.st].sort().map((k) => k + Math.round(Math.log2(1 + (r.stAmt[k.replace('f:', '')] || 0)))).join(','), held: r.held.size, arc: r.arc, after: Math.round(Math.log2(1 + r.after) * 3), shared: Math.round(Math.log2(1 + (r.shared || 0)) * 4), revived: r.revived || 0, cleansed: Math.min(r.cleansed || 0, 3), buffs: [...r.buffs].sort().join(','), summons: r.summons, r: r.r, cc: r.cc, dmg: Math.round(Math.log2(1 + r.dmg) * 2), heal: Math.round(Math.log2(1 + r.heal) * 2), block: Math.min(r.block, 9), kept: Math.round(Math.log2(1 + r.kept) * 2), fx: r.fx, dur: r.dur, kn: r.kn, casts: r.casts }, trace: r.trace.join('|') }));
}


// any stage: every blow the hero side takes over a couple of loops that has nothing seen behind it
export function unseenBlows(spec, loops = 2) {
  setSeed(11);
  const S = PS.makeStage(spec); let blows = 0; const why = [], seenKey = new Set();
  AUDIT.on = (ev, w, u, src, amt, o = {}) => {
    if (w && w !== S.w) return;
    if (!(ev === 'takenBuffs' || ev === 'block' || ev === 'keep') || !u || !S.hero || u.team !== S.hero.team || u.summon || u.partOf || o.dot) return;
    const key = u.id + ':' + (src ? src.id : 'x') + ':' + S.t.toFixed(3); if (seenKey.has(key)) return; seenKey.add(key);
    if (!seen(u, src, o)) { blows++; if (why.length < 3) why.push((u === S.hero ? 'it' : u.kind) + '<-' + (src ? src.kind : 'nothing')); }
  };
  try {
    const n = Math.ceil(loops * S.loop / DT) + 6;
    for (let i = 0; i < n; i++) {
      if (!S.w.stats) S.w.stats = newStats([S.hero ? S.hero.kind : 'x']);
      const before = new Map(S.w.units.filter((o) => S.hero && o.team === S.hero.team && !o.summon).map((o) => [o, o.hp])); let hurtSum = new Map();
      const prev = AUDIT.on; AUDIT.on = (ev, w, u, src, amt, o) => { if (ev === 'hurt' && u) hurtSum.set(u, (hurtSum.get(u) || 0) + amt); if (ev === 'abRun') hurtSum.set('ab', 1); prev(ev, w, u, src, amt, o); };
      const L = S.loops; S.step(DT); AUDIT.on = prev;
      if (S.loops !== L) continue;
      if (!hurtSum.get('ab')) for (const [o, h] of before) if (S.w.units.includes(o) && !o.downed && h - o.hp > (hurtSum.get(o) || 0) + o.maxHp * 0.02) { blows++; if (why.length < 3) why.push((o === S.hero ? 'it' : o.kind) + ' health set lower'); }
    }
  } finally { AUDIT.on = null; }
  return { blows, why };
}

// Round 18b (lane preview18b): the same ruler for the monsters' pages and the statuses.
//   measureStage(spec, loops) -> one record a loop, for a { t: 'foe' } or { t: 'status' } spec:
//     fired / first / fires   the move (or the status) went off that loop, when it first did, and how often (goes
//                             at least 0.8 s apart)
//     straw                   straw targets on the stage (dummies: never moving, never striking back of their own)
//     against                 the real heroes it was shown on (kinds)
//     reached                 what the move made touched someone within REACH s of going off: a hero struck,
//                             statused, held or shoved by its side, or a friend of its own mended, shielded or quickened,
//                             or help called in
//     crutch                  the stage had to help it (a target stepped up to it, its health set lower)
//     unseen / unseenWhy      blows on either side with nothing seen behind them (a target with no weapon swinging at
//                             nothing, a blow from no one), or health set lower with no blow
//     stFrom                  (statuses) where the status came from: 'seen' (a real fighter's blow, shot, zone or
//                             ability), 'nothing' (put on by the stage, or by a straw target that never moved)
const REACH = 3.5;
const dummy = (s) => !!(s && s.def && s.def.dummy);
export function seenAny(u, src, o) {
  if (o.dot || o.zone || o.explosion || o.gas || o.shot || o.slam || o.guarded || o.hexTurned || o.proc || o.stk) return true; // (proc, stk: a status bursting)
  // (no source: sim.js physics, a body slammed into a wall or bowled over by one flying into it, or spikes: a plain
  // noDodge blow, seen as it lands)
  if (!src) return Math.hypot(u.kx || 0, u.ky || 0) > 25 || (u.bodies || []).some((b) => Math.hypot(b.kx || 0, b.ky || 0) > 25) || (o.noDodge && Object.keys(o).length === 1);
  if (src === u) return true;
  if (!dummy(src)) return true;
  return isWeaponDummy(src) && (!!src.anim || /bow/.test(src.def.art));
}
export function measureStage(spec, loops = 2) {
  setSeed(11);
  const S = PS.makeStage(spec);
  if (S.locked) return [{ locked: true, why: S.why }];
  const rec = []; let cur = null;
  const side = () => (S.hero ? S.hero.team : 'enemy');
  const newLoop = () => {
    cur = { fired: false, first: null, fires: 0, straw: 0, against: new Set(), reached: false, crutch: !!S.crutch, unseen: 0, unseenWhy: [], stFrom: null };
    rec.push(cur);
    for (const o of S.w.units) { if (dummy(o)) cur.straw++; else if (S.hero && o.team !== side() && !o.summon) cur.against.add(o.kind); }
  };
  newLoop();
  const keys = new Set();
  const within = () => cur.first != null && S.t - cur.first <= REACH + 1e-6;
  const mineSide = (src) => { const r = ownerOf(src); return !!r && r.team === side() && !dummy(r); };
  AUDIT.on = (ev, w, u, src, amt, o = {}) => {
    if (w && w !== S.w) return;
    if ((ev === 'takenBuffs' || ev === 'block' || ev === 'keep') && u && !o.dot && !u.partOf) {
      const key = u.id + ':' + (src ? src.id : 'x') + ':' + S.t.toFixed(3);
      if (!keys.has(key)) { keys.add(key); if (!seenAny(u, src, o)) { cur.unseen++; if (cur.unseenWhy.length < 3) cur.unseenWhy.push((u === S.hero ? 'it' : u.kind) + '<-' + (src ? src.kind : 'nothing')); } }
    }
    if (spec.t === 'foe' && within() && u) {
      if ((ev === 'hurt' || ev === 'status' || ev === 'block' || ev === 'keep') && u.team !== side() && (mineSide(src || o.by) || !(src || o.by))) cur.reached = true; // (no source: a blast, a zone of its own: nothing else on its stage hurts the heroes)
      if (ev === 'heal' && u.team === side() && src && src !== u && mineSide(src)) cur.reached = true;
      if (ev === 'buff' && u.team === side() && !dummy(u)) cur.reached = true;
    }
  };
  const seenU = new WeakSet(); for (const o of S.w.units) seenU.add(o);
  let loops0 = S.loops;
  const N = Math.ceil((loops + 0.2) * S.loop / DT) + 400;
  try {
    for (let i = 0; i < N; i++) {
      if (S.loops !== loops0) { loops0 = S.loops; if (rec.length >= loops) break; newLoop(); for (const o of S.w.units) seenU.add(o); }
      if (!S.w.stats) S.w.stats = newStats([...new Set(S.w.units.filter((o) => o.team === 'hero' && !dummy(o)).map((o) => o.kind))]);
      const hpBefore = new Map(S.w.units.filter((o) => !dummy(o) && !o.partOf).map((o) => [o, o.hp]));
      const hurtSum = new Map(); const prev = AUDIT.on;
      AUDIT.on = (ev, w, u, src, amt, o) => { if (ev === 'hurt' && u) hurtSum.set(u, (hurtSum.get(u) || 0) + amt); prev(ev, w, u, src, amt, o); };
      const f0 = S.fires, L = S.loops;
      S.step(DT);
      AUDIT.on = prev;
      if (S.loops !== L) continue;
      if (S.fires > f0) { if (S.t - (cur.lastGo ?? -9) > 0.8) cur.fires++; cur.lastGo = S.t; if (cur.first == null) cur.first = S.t; cur.fired = true; } // (a go: what fires within 0.8 s of the last is the same go)
      if (S.crutch) cur.crutch = true;
      for (const [o, h] of hpBefore) if (S.w.units.includes(o) && !o.downed && !o.dead && !o.dying && o.maxHp && h - o.hp > (hurtSum.get(o) || 0) + o.maxHp * 0.02) { cur.unseen++; if (cur.unseenWhy.length < 3) cur.unseenWhy.push((o === S.hero ? 'it' : o.kind) + ' health set lower'); }
      for (const o of S.w.units) if (!seenU.has(o)) { seenU.add(o); if (spec.t === 'foe' && within() && o.team === side() && !dummy(o)) cur.reached = true; }
      if (spec.t === 'foe' && within() && !cur.reached) {
        // held, frozen, rooted or put to sleep by its side (a grab, a pin: not always a blow)
        for (const o of S.w.units) if (o.trueTeam && o.trueTeam !== side()) { cur.reached = true; break; } else if (o.team !== side() && !dummy(o) && (o.stunT > 0.05 || o.rootT > 0.05 || o.frozenT > 0.05 || o.sleepT > 0.05 || o.forcedGoal || o.charmed || o.trueTeam)) { cur.reached = true; break; } // (charmed, trueTeam: ridden by a leech, turned)
      }
      // (statuses) where it came from: the stage says (S.srcSeen: true when a real fighter put it on, in view)
      if (spec.t === 'status' && S.fired() && cur.stFrom == null) cur.stFrom = S.srcSeen ? 'seen' : 'nothing';
      if (spec.t === 'status' && S.stDone) cur.reached = true; // (a status: its burst, or the state, came on the one it is shown on)
    }
  } finally { AUDIT.on = null; }
  return rec.slice(0, loops).map((r) => ({ ...r, against: [...r.against] }));
}
