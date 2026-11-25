// A status, put on by a fighter in view (round 18b, lane preview18b; who puts each on is js/preview-scenes.js
// STATUS_SCENE). Round 13 to 18 built it in pulses on a goblin from a blue straw target that never moved, or put the
// state on directly from nowhere. Now a build-up rides on a real hero's blows or shots (each one that lands carries a
// share of it, so the bar jumps as it lands, and it bursts on the third), a timed state comes from the ability that
// puts it on in a run, cast by the stage at the right moment, and a state on a hero is put on by a friend (or by the
// hero itself) while an enemy is on it.
// Round 14 ("For something like frozen show the shatter as well as just leaving it alone"): where what follows a burst
// depends on what is done to it, the stage shows both, turn about (S.way; spec.way holds it to one):
//   alone     nothing touches it: a frozen fighter thaws, a sleeper sleeps it out (the hero who put it on stops)
//   trigger   a hero beside it (STATUS_SCENE trigger: a Warhelm's hammer, a Paladin's sword) strikes: ice shatters,
//             a sleeper is woken
const WAYS = {
  chill: { name: 'Shattered', when: (s) => s.frozenT > 0, wait: 0.9, blow: { heavy: true } },
  sleepy: { name: 'Woken', when: (s) => s.sleepT > 0, wait: 2.4, blow: {} },
  sleep: { name: 'Woken', when: (s) => s.sleepT > 0, wait: 1.1, blow: {} },
};
const wayOf = (id) => WAYS[FROM_BURST[id] || id] || null;
export const statusWays = (id) => (wayOf(id) && statusHow(id) ? [{ id: 'alone', name: 'Left alone' }, { id: 'trigger', name: wayOf(id).name }] : null);
// a timed state is on: its own timer, or the hook or buff it is made of (kits2.js onUnit: dirty, targeted, tracked...)
const STATE_ON = { stun: (s) => s.stunT > 0, root: (s) => s.rootT > 0, sleep: (s) => s.sleepT > 0, guard: (s) => !!(s.guardBy && s.guardT > 0), invuln: (s) => s.invulnT > 0,
  taunt: (s) => s.tauntT > 0, rage: (s) => s.buffs.some((b) => b.id === 'rage'), silenced: (s) => s.silencedT > 0,
  buff: (s) => s.buffs.some((b) => b.dur < 900 && ((b.atkSpeed || 1) > 1 || (b.move || 1) > 1 || (b.dealt || 1) > 1)),
  debuff: (s) => s.buffs.some((b) => b.dur < 900 && ((b.atkSpeed || 1) < 1 || (b.move || 1) < 1 || (b.dealt || 1) < 1)) };
const stateOn = (s, id) => (STATE_ON[id] ? STATE_ON[id](s) : (s.h2 || []).some((h) => h.id === id) || s.buffs.some((b) => b.id === id));
// keep every ability of a fighter held (the stage casts the one it shows)
const holdKit = (o) => { if (o && o.kit) for (const c in o.kit.cd) o.kit.cd[c] = Math.max(o.kit.cd[c], 5); };
const ST_W = 420, ST_H = 270;
function statusStage(S, spec) {
  const id = spec.id, how = statusHow(id), src = FROM_BURST[id] || id, W0 = wayOf(id);
  if (id === 'silenced') return silencedStage(S, spec);
  S.loop = W0 ? 7.5 : 6; S.size = [ST_W, ST_H]; // a small yard: the few fighters are what matter, so they are drawn bigger
  if (!how) { S.locked = true; S.why = 'No preview for this one yet'; }
  const sc = statusSceneOf(id, src), heroSide = sc.side === 'hero', build = how === 'build' || how === 'burst';
  const A = sc.ab ? ABILITIES[sc.ab] : null, tier = sc.tier || 1;
  let s, by, foe, trig, done, struck, cast, n = 0, gave;
  return () => {
    const [W, H] = S.size, w = S.w = room(W, H, S.w);
    S.way = W0 && how ? spec.way || (n++ % 2 ? 'trigger' : 'alone') : null;
    S.srcSeen = false; done = false; struck = null; cast = false; gave = 0; foe = null; trig = null;
    const hy = H / 2 - 10;
    const hero = (kind, x, y) => { const o = fullAlly(w, DEFS[kind] && HEROES[kind] ? kind : 'cleric', x, y); o.barAlways = true; o.dmgMul *= 0.25; o.trinketHooks = [...(o.trinketHooks || []), HERO_KEEP]; return o; };
    const enemy = (kind, x, y) => { const e = spawn(w, kind, x, y, { mult: 1 }); e.aggro = true; e.facing = Math.PI; e.barAlways = true; e.dmgMul *= 0.35; e.trinketHooks = [...(e.trinketHooks || []), KEEP_UP]; e.home = { x, y }; return e; };
    if (!heroSide) {
      s = enemy(sc.on || 'orc', 290, hy);
      const ranged = DEFS[sc.by] && DEFS[sc.by].role === 'ranged';
      by = hero(sc.by, ranged ? 95 : 205, hy);
      s.target = by;
      if (sc.archer) { const a = hero('archer', 120, hy + 80); s.target = a; s.tauntWant = a; } // (a taunt: it was going for the archer)
    } else {
      s = hero(sc.on, sc.front ? 190 : 165, hy); if (sc.hp) s.hp = s.maxHp * sc.hp;
      foe = enemy('orc', 285, hy); foe.target = s;
      by = sc.by === 'self' ? s : hero(sc.by, sc.front ? 105 : 90, hy + (sc.front ? 0 : 70));
    }
    if (S.way === 'trigger' && sc.trigger) { trig = hero(sc.trigger, 290, hy + 78); trig.atkT = 99; trig.facing = -Math.PI / 2; trig.home = { x: trig.x, y: trig.y }; }
    w.stats = newStats([...new Set([by, s, trig].filter((o) => o && o.team === 'hero').map((o) => o.kind))]);
    const need = STATUS[src] ? (typeof STATUS[src].need === 'function' ? STATUS[src].need(s) : STATUS[src].need) : HERO_STATUS[src] && HERO_STATUS[src].need ? HERO_STATUS[src].need : 100;
    // a build-up rides on the hero's own blows and shots: each that lands on it carries a share
    if (build && !sc.ab) by.trinketHooks = [...by.trinketHooks, { dealt(w2, a, t, amt, o) {
      if (t === s && !o.dot && !o.proc && !done && S.t > 0.2) { S.srcSeen = true; gave++; const k = need * 0.38; if (KIT_BUILD[src]) KIT_BUILD[src](w2, s, k, a); else addStatus(w2, s, src, k, a); }
      return amt; } }];
    S.hero = s; S.dummies = [by, foe, trig].filter((o) => o && o !== s);
    S.tick = () => {
      for (const o of [by, s, foe, trig]) holdKit(o);
      if (!by.dead && !by.downed) { if (!heroSide) by.target = s; else if (foe && sc.by !== 'self' && by.target !== foe) by.target = foe; }
      // the timed state: the ability that puts it on, cast once it is time (and in reach, for a blow)
      if (A && !cast && S.t >= (sc.castAt ?? 0.6) && !by.act && !by.dead) {
        const t = heroSide ? (foe || s) : s, gap = Math.hypot(t.x - by.x, t.y - by.y) - t.r - by.r;
        if (!sc.reach || gap < sc.reach || S.t > 2.6) {
          cast = true; by.target = t; by.kit.cd[sc.ab] = 0; by.kit.using = sc.ab; by.facing = Math.atan2(t.y - by.y, t.x - by.x);
          try { tagAbility(w, by, sc.ab, tier, () => A.use(w, by, t, tier)); } finally { by.kit.using = null; }
          S.srcSeen = true;
        }
      }
      // the trigger: once the burst's state is on it, the hero beside it winds up and strikes
      if (trig && done && struck !== true && W0.when(s)) {
        if (struck == null) struck = S.t + W0.wait;
        if (S.t >= struck - 0.3 && !trig._wound) { trig._wound = true; trig.facing = Math.atan2(s.y - trig.y, s.x - trig.x); setAnim(trig, trig.def.attackAnim || 'swing', 0.4); }
        if (S.t >= struck) { struck = true; hurt(w, s, 16, trig, { knock: 0, noDodge: true, ...W0.blow }); }
      }
      if (!done) done = build ? !!(s.bursts && s.bursts[src] != null) || (src !== id && stateOn(s, id)) : stateOn(s, id);
    };
    S.after = (dt) => {
      if ((build && gave > 0 && !done) || (done && (!trig || struck === true || !W0 || !W0.when(s)))) S.fire(); // (it is on: building, or the state it bursts into)
      if (!build && stateOn(s, id)) S.fire();
      // once it is on, the one who put it on stops: what follows is the status's own (a sleeper sleeps, ice thaws)
      if (done || (A && cast)) by.atkT = Math.max(by.atkT, 0.3);
      if (trig && !trig.dead) { trig.atkT = 99; if (!trig._wound) { trig.x = trig.home.x; trig.y = trig.home.y; } }
      for (const o of [s, by, foe, trig]) if (o && !o.dead && !o.downed && o.hp < o.maxHp * 0.3) o.hp += o.maxHp * 0.3 * dt; // (kept up: they mend once low)
      if (!s.dead) { s.x = Math.min(W - 40, Math.max(40, s.x)); s.y = Math.min(H - 40, Math.max(40, s.y)); }
      if (foe && !foe.dead) { foe.x = Math.min(W - 40, Math.max(40, foe.x)); foe.y = Math.min(H - 40, Math.max(40, foe.y)); }
      if (!by.dead) { by.x = Math.min(W - 30, Math.max(30, by.x)); by.y = Math.min(H - 30, Math.max(30, by.y)); }
    };
  };
}
// Silenced (round 18b): a choir sprite, a major, sings to mend the hobgoblin it is with (a mouth move); the Slinger's
// stun stone knocks it silly and its song stops (sim.js silence, by the sprite's own rule: any stun silences it), while
// the ring of shots a major throws out (no mouth in it) still goes; when the silence ends it sings again.
function silencedStage(S) {
  S.loop = 8.4; S.size = [ST_W + 60, ST_H + 30];
  let s, sl, pal, hob, cast;
  return () => {
    const [W, H] = S.size, w = S.w = room(W, H, S.w);
    s = seededFoe(w, 'choirSprite', 330, 120, 2); s.aggro = true; s.facing = Math.PI; s.barAlways = true; s.trinketHooks = [KEEP_UP]; s.dueSoon = 0.5;
    s.el = s.el || {}; s.el.mring = 3.1; // (its ring of shots comes round while it is silenced)
    hob = spawn(w, 'hobgoblin', 300, 215, { mult: 1 }); hob.aggro = true; hob.hp = hob.maxHp * 0.4; hob.barAlways = true; hob.dmgMul *= 0.4; hob.trinketHooks = [KEEP_UP];
    const hero = (kind, x, y) => { const o = fullAlly(w, kind, x, y); o.barAlways = true; o.dmgMul *= 0.2; o.trinketHooks = [...(o.trinketHooks || []), HERO_KEEP]; return o; };
    pal = hero('paladin', 210, 215); sl = hero('slinger', 90, 110);
    hob.target = pal; pal.target = hob;
    w.stats = newStats(['paladin', 'slinger']);
    cast = false; S.srcSeen = false; S.hero = s; S.dummies = [sl, pal]; S.friends = [hob];
    S.tick = () => {
      for (const o of [sl, pal]) holdKit(o);
      pal.target = hob; sl.target = s;
      if (!cast && S.t >= 1.3 && !sl.act) { cast = true; sl.kit.cd.stunStone = 0; try { tagAbility(w, sl, 'stunStone', 1, () => ABILITIES.stunStone.use(w, sl, s, 1)); } finally { sl.kit.using = null; } S.srcSeen = true; }
    };
    S.after = (dt) => {
      if (s.silencedT > 0) S.fire();
      if (cast) sl.atkT = Math.max(sl.atkT, 0.3); // (the slinger's work is done: its stones would stun it again)
      for (const o of [s, hob, pal, sl]) if (!o.dead && !o.downed && o.hp < o.maxHp * 0.3) o.hp += o.maxHp * 0.3 * dt;
      if (!s.dead) { s.x = Math.min(W - 40, Math.max(170, s.x)); s.y = Math.min(H - 40, Math.max(40, s.y)); }
    };
  };
}
