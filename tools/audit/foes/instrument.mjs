// The foes audit's measuring: who did what to whom in a battle-mode fight, and which of an enemy's own moves went off.
//
// Everything here is on the tool's side (no game numbers change):
//  - every non-hero def's brain / onDeath / onSplit / onHop / struck is wrapped. While one runs, what it makes (shots,
//    danger zones, fx with a tick, delayed calls, hazards, units) is tagged with the unit and the move, and those
//    things' own callbacks run under the same tag later (the way js/stats.js tags a hero's ability).
//  - a move "fires" when one of the unit's own countdown timers jumps up inside its brain: every due()/again() timer
//    (u.el.<key>, elites.js) and every home-made one (u.gT, u.g.cd, u.ts.cd ...). A timer seen for the first time is a
//    move the brain has "armed" (looked at). Timers are found by name, so a few that are not moves (a troll's calm
//    clock) show up too; docs/audit/foes.md names the ones that matter.
//  - a basic attack fires when u.atkT jumps up outside the brain (sim.js tryAttack); a def.ability (dash, charge) when
//    u.abilT does.
//  - js/stats.js AUDIT.on gives every blow, block, heal, death, status and burst. A blow is put down to:
//      st:<status>  a status's own damage (burn ticks, a scorch, poison...) - credited to whoever put it on
//      mv:<timer>   a brain move (the timer that fired, or the last one that did when a move runs over several frames)
//      ab:<ability> the sim's built-in abilities (only charge hurts)
//      death / split / hop / struck   what the def's own hooks did
//      spawn:<kind> what a unit it made (a summon, a split slimelet) did
//      attack       the plain swing or shot
//      mirror       a shot bounced back by a mirror (the gilded golem)
import { DT } from './lib.mjs';

const HOOKS = ['brain', 'onDeath', 'onSplit', 'onHop', 'struck'];
const HOOK_MV = { onDeath: 'death', onSplit: 'split', onHop: 'hop', struck: 'struck' };
const SKIP_SUB = new Set(['dueLen', 'holdT', 'face', 'coming']);
// a home-made timer's name: t, ...T, cd, ...Cd (a position, a speed or a count is not one); every due() timer in u.el is
const TIMERISH = /(^t$|T$|^cd$|Cd$|CD$|^cd[A-Z]|Timer$|timer$)/;

export function instrument(G) {
  const { DEFS, S, sim } = G;
  let F = null;             // the current fight's tallies (null: not counting)
  let CTX = null;           // { u, mv, buf } while a hooked function runs
  let BASE = null;          // the fields every unit has straight out of spawn (never a move timer)

  const sideOf = (u) => (u && u.bkey ? u.bkey[0] : null);
  const rowOf = (key) => {
    if (!F || !key) return null;
    return F.rows[key] || (F.rows[key] = { dmg: {}, dmgTo: 0, fires: {}, armed: {}, taken: 0, blocked: 0, heal: {}, st: {}, bursts: {}, kills: 0, lost: 0, n: 0 });
  };
  const add = (m, k, n) => { m[k] = (m[k] || 0) + n; };
  const isOrig = (u) => !!(u && u._orig);
  // the original unit (from newBattle) behind u: its own row key and the move name for what u did
  function credit(src, o = {}) {
    if (o._own) return { key: (S.ownerOf(o._own) || o._own).bkey || o._own.bkey, mv: isOrig(o._own) ? o._mv : 'spawn:' + o._own.kind + '/' + o._mv, u: o._own };
    if (!src) return null;
    const root = S.ownerOf(src);
    const key = (root && root.bkey) || src.bkey;
    if (!key) return null;
    if (src !== root && !isOrig(src)) return { key, mv: 'spawn:' + src.kind, u: root };
    if (!isOrig(src) && src.bkey) return { key, mv: 'spawn:' + src.kind, u: src };
    return { key, mv: null, u: src };
  }

  // ---- tagging what a hooked call makes
  function lens(w) { return [w.projectiles.length, w.danger.length, w.fx.length, w.hazards.length, w.units.length]; }
  function wrapCb(obj, k, ctx) {
    const g = obj && obj[k];
    if (typeof g !== 'function' || g._au) return;
    const f = function (...a) { return runIn({ u: ctx.u, mv: ctx.mv, fixed: true }, ctx.w, () => g.apply(this, a)); };
    f._au = true; obj[k] = f;
  }
  function tagNew(w, L, laterN, ctx) {
    const c = { u: ctx.u, mv: ctx.mv, w };
    for (let i = L[0]; i < w.projectiles.length; i++) { const p = w.projectiles[i]; if (p._au) continue; p._au = true; p.o = p.o || {}; if (!p.o._own) { p.o._own = c.u; p.o._mv = c.mv; } wrapCb(p, 'onHit', c); wrapCb(p, 'land', c); }
    for (let i = L[1]; i < w.danger.length; i++) { const z = w.danger[i]; if (z._au) continue; z._au = true; if (z.hit && !z.hit._own) { z.hit._own = c.u; z.hit._mv = c.mv; } wrapCb(z, 'onFire', c); }
    for (let i = L[2]; i < w.fx.length; i++) { const f = w.fx[i]; if (f._au) continue; f._au = true; wrapCb(f, 'tick', c); }
    for (let i = L[3]; i < w.hazards.length; i++) { const h = w.hazards[i]; if (!h._own) { h._own = c.u; h._mv = c.mv; } }
    for (let i = L[4]; i < w.units.length; i++) { const s = w.units[i]; if (!s._made) { s._made = c.u; s._madeMv = c.mv; } }
    const lt = ctx.u && ctx.u.later;
    if (lt) for (let i = laterN; i < lt.length; i++) wrapCb(lt[i], 'f', c);
  }

  // ---- timers
  function snap(u) {
    const o = {};
    for (const k in u) {
      const v = u[k];
      if (BASE.has(k)) continue;
      if (typeof v === 'number') { if (TIMERISH.test(k)) o[k] = v; }
      else if (v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype && !v.def && !v.kind) {
        for (const k2 in v) if (typeof v[k2] === 'number' && !SKIP_SUB.has(k2) && (k === 'el' || TIMERISH.test(k2))) o[k + '.' + k2] = v[k2];
      }
    }
    return o;
  }
  const mvName = (k) => 'mv:' + (k.startsWith('el.') ? k.slice(3) : k);

  function runIn(ctx, w, fn) {
    const prev = CTX; CTX = ctx; ctx.w = w; ctx.buf = [];
    const L = lens(w), laterN = ctx.u && ctx.u.later ? ctx.u.later.length : 0;
    const u = ctx.u, timed = ctx.brain && F && u && u.bkey;
    const pre = timed ? snap(u) : null, atk0 = timed ? u.atkT : 0;
    let r;
    try { r = fn(); } finally {
      if (timed) {
        const post = snap(u), R = rowOf(u.bkey), fired = [];
        for (const k in post) {
          if (pre[k] == null) { if (!(k in pre)) R.armed[mvName(k)] = 1; continue; }
          if (post[k] - pre[k] > 0.25 && post[k] > 0.3) fired.push(k);
        }
        if (!fired.length && u.atkT - atk0 > 0.25) fired.push('atkT');
        for (const k of fired) add(R.fires, (isOrig(u) ? '' : 'spawn:' + u.kind + '/') + mvName(k), 1);
        if (fired.length) { const best = fired.find((k) => k.startsWith('el.')) || fired[0]; u._mvCur = mvName(best); }
        ctx.mv = u._mvCur || 'mv:brain';
        u._brainAtk = u.atkT; u._brainF = F.frame;
      }
      if (F && w) tagNew(w, L, laterN, ctx);
      CTX = prev;
      for (const e of ctx.buf) (e.heal ? onHeal : onHurt)(e.w, e.u, e.src, e.amt, { ...e.o, _own: ctx.u, _mv: ctx.mv });
    }
    return r;
  }

  for (const [k, d] of Object.entries(DEFS)) {
    if (d.team === 'hero' || d._auWrapped) continue;
    d._auWrapped = true;
    for (const h of HOOKS) {
      const g = d[h]; if (typeof g !== 'function') continue;
      d[h] = function (w, u, ...a) {
        if (!F) return g.call(this, w, u, ...a);
        return runIn({ u, mv: HOOK_MV[h] || null, brain: h === 'brain' }, w, () => g.call(this, w, u, ...a));
      };
    }
  }

  // ---- the events
  function onHurt(w, u, src, amt, o) {
    if (!F || !(amt > 0)) return;
    if (CTX && !o._own && !o.stk && !o.dot) { if (CTX.fixed) o = { ...o, _own: CTX.u, _mv: CTX.mv }; else { CTX.buf.push({ w, u, src, amt, o }); return; } }
    const vR = rowOf(S.ownerOf(u).bkey || u.bkey);
    if (vR) vR.taken += amt;
    let c, mv;
    if (o.stk) { // a status's own damage: whoever put it on
      const by = o.by || src || (u._stOwn && u._stOwn[o.stk]);
      c = credit(by, {}); mv = 'st:' + o.stk;
    } else {
      c = credit(src || o.by, o);
      if (c && o.shot && src && o._own && sideOf(o._own) === sideOf(u) && sideOf(src) !== sideOf(u)) c = { key: src.bkey, mv: 'mirror', u: src };
      if (!c && !src && !o.by && o.noDodge && Object.keys(o).length === 1 && u._lastHit && F.t - u._lastHit.t < 1.5) c = { ...u._lastHit.c, mv: 'wall slam' }; // sim.js wallHit: knocked into a wall
      else if (c) u._lastHit = { c, t: F.t };
      mv = c && c.mv;
      if (c && !mv) mv = src && src.act && src.act.type === 'charge' ? 'ab:charge' : o.pab ? 'ab:' + o.pab : 'attack';
    }
    if (!c || !c.key) { add(F.lost, (o.stk ? 'st:' + o.stk : 'none') + (process.env.AU_DEBUG ? ' ' + u.kind + '<' + (src ? src.kind : '-') + ' ' + Object.keys(o).join('/') : ''), amt); return; }
    if (c.key[0] === sideOf(S.ownerOf(u)) || c.key[0] === sideOf(u)) { add(F.friendly, c.key, amt); return; }
    const R = rowOf(c.key); add(R.dmg, mv, amt); R.dmgTo += amt;
    if (F.onDmg) F.onDmg(c.key, u, amt, F.t);
  }
  function onHeal(w, u, src, amt, o) {
    const c = credit(src || u, o._own ? o : {});
    if (c && c.key) add(rowOf(c.key).heal, c.mv || (o.pab ? 'ab:' + o.pab : 'other'), amt);
  }
  S.AUDIT.on = (ev, w, u, src, amt, o = {}) => {
    if (!F) return;
    if (ev === 'hurt') return onHurt(w, u, src, amt, o);
    if (ev === 'block') { const R = rowOf(S.ownerOf(u).bkey || u.bkey); if (R) R.blocked += amt; return; }
    if (ev === 'heal') {
      if (CTX && !CTX.fixed && !o.pab) { CTX.buf.push({ heal: true, w, u, src, amt, o }); return; }
      return onHeal(w, u, src, amt, CTX && !o.pab ? { ...o, _own: CTX.u, _mv: CTX.mv } : o);
    }
    if (ev === 'down') {
      const vR = rowOf(u.bkey); if (vR && isOrig(u)) vR.lost++;
      const c = credit(src || o.by, o); if (c && c.key && sideOf({ bkey: c.key }) !== sideOf(u) && isOrig(u)) rowOf(c.key).kills++;
      return;
    }
    if (ev === 'status') {
      let by = src;
      if (!by && w && w.hazards) { const h = w.hazards.find((h) => h._own && Math.hypot(u.x - h.x, u.y - h.y) < h.r + u.r); if (h) by = h._own; }
      if (!by && CTX) by = CTX.u;
      if (by && !src) (u._stOwn || (u._stOwn = {}))[o.type] = by;
      const c = credit(by, {}); if (!c || !c.key || sideOf({ bkey: c.key }) === sideOf(u)) return;
      const R = rowOf(c.key), s = R.st[o.type] || (R.st[o.type] = { amt: 0, n: 0 });
      s.amt += amt; s.n++;
      return;
    }
    if (ev === 'burst') {
      const by = src || (u._stOwn && u._stOwn[o.type]);
      const c = credit(by, {}); if (!c || !c.key || sideOf({ bkey: c.key }) === sideOf(u)) return;
      add(rowOf(c.key).bursts, o.type, 1);
    }
  };

  // ---- a fight
  function baseFields() {
    if (BASE) return BASE;
    BASE = new Set(['_orig', '_mvCur', '_brainAtk', '_brainF', '_atk0', '_abil0', '_stOwn', '_made', '_madeMv', 'lastHp']);
    const w = G.D.battleRoom('crypt', { W: 960, H: 480 });
    for (const k of Object.keys(DEFS)) { try { const u = sim.spawn(w, k, 400, 240, { mult: 1 }); for (const f in u) BASE.add(f); } catch (e) { /* a part that needs its owner */ } }
    return BASE;
  }

  // setup: newBattle's; o.onFrame(run, F); o.tMax seconds; o.prep(run) after newBattle (e.g. an immortal hero)
  function fight(setup, seed, o = {}) {
    baseFields();
    G.setSeed(seed);
    const run = G.B.newBattle(G.save, setup);
    for (const side of ['a', 'b']) for (const u of run.sides[side]) { u._orig = true; }
    F = { rows: {}, lost: {}, friendly: {}, frame: 0, t: 0, onDmg: o.onDmg || null };
    for (const side of ['a', 'b']) for (const u of run.sides[side]) rowOf(u.bkey).n++;
    if (o.prep) o.prep(run, F);
    const tMax = o.tMax || 400;
    try {
      while (run.phase === 'fight' && run.t < tMax) {
        const w = run.world;
        for (const u of w.units) { u._atk0 = u.atkT; u._abil0 = u.abilT; }
        F.frame++;
        G.B.updateBattle(run, DT); F.t = run.t;
        for (const u of w.units) {
          if (u._orig && !u.dead && !u.downed && u.bkey) rowOf(u.bkey).up = (rowOf(u.bkey).up || 0) + DT;
          if (!u.bkey || u.dead || u.def.team === 'hero') continue;
          const R = rowOf(u.bkey), pre = isOrig(u) ? '' : 'spawn:' + u.kind + '/';
          const ref = u._brainF === F.frame ? u._brainAtk : u._atk0;
          if (u._atk0 != null && u.atkT - ref > 0.25 && u.def.atkCd < 900) add(R.fires, pre + 'attack', 1);
          if (u._abil0 != null && u.def.ability && u.abilT - u._abil0 > 0.25) add(R.fires, pre + 'ab:' + u.def.ability, 1);
        }
        if (o.onFrame) o.onFrame(run, F);
      }
      if (run.phase === 'fight') G.B.callBattle(run);
    } finally { /* keep F for the caller */ }
    const out = { winner: run.winner, time: run.t, timeUp: !!run.timeUp, rows: F.rows, unclaimed: F.lost, friendly: F.friendly, run };
    F = null;
    return out;
  }
  return { fight };
}
