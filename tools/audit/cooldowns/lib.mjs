// Balance audit, lane "cooldowns" (round 16). Runs battle-mode fights headless and watches one hero: at every cast it
// works out what the ability left behind that lasts (a buff, an act, a form, a timer, a summon, a zone...), follows each
// of those to the step it ends, and notes how much of the ability's cooldown is left at that moment.
//
// Nothing in js/ is changed. The ability's use() is wrapped from here (ABILITIES[id].use) so the world can be looked at
// just before and just after it runs; everything else is read off the world each step.
//
// A cooldown rule other than today's can be tried from here too (rule 'a' or 'b', see setRule): the kit's cooldown is
// written from the runner, so the game's code stays as it is.
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORLD, JUNK } from './classes.mjs'; // (which lasting things are out in the world, and leftovers that aren't effects)

globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const B = await imp('js/battle.js');
const { setSeed } = await imp('js/util.js');
const { freshSave } = await imp('js/save.js');
const { HEROES, HERO_IDS } = await imp('js/heroes.js');
const K = await imp('js/kits.js');
const { AUDIT, ownerOf } = await imp('js/stats.js');
export { HEROES, HERO_IDS };
export const cooldownOf = K.cooldownOf;
const DT = 1 / 60;

// ---------------------------------------------------------------- the scenarios
// duel: the hero alone against one big brute (a long fight with one target).
// group: alone against four skeletons (a crowd).
// party: the hero with a tank and a healer friend (so abilities that work on friends have someone) against a bigger crowd.
const mates = (h) => (h === 'paladin' || h === 'cleric' ? ['bulwark', 'druid'] : ['paladin', 'cleric']);
export const SCENARIOS = {
  duel: (h, tier) => ({ a: [{ k: h, n: 1, tier }], b: [{ k: 'brute', n: 1, rank: tier >= 2 ? 1 : 0 }] }),
  group: (h, tier) => ({ a: [{ k: h, n: 1, tier }], b: [{ k: 'rattler', n: 3, rank: tier >= 3 ? 1 : 0 }, { k: 'rattlerBow', n: 1 }] }),
  party: (h, tier) => ({ a: [{ k: h, n: 1, tier }, ...mates(h).map((k) => ({ k, n: 1, tier }))],
    b: [{ k: 'rattler', n: 4, rank: tier >= 2 ? 1 : 0 }, { k: 'rattlerBow', n: 2 }, { k: 'brute', n: 1, rank: tier >= 3 ? 1 : 0 }] }),
};

// ---------------------------------------------------------------- what to ignore when diffing the hero
// Moving, drawing and bookkeeping fields that change on every cast; never a lasting effect.
const SKIP_U = new Set(['x', 'y', 'vx', 'vy', 'kx', 'ky', 'dvx', 'dvy', 'facing', 'mvA', 'spd', 'bob', 'anim', 'lungeT', 'recoilT', 'hitT', 'flashT',
  'atkT', 'abilT', 'modeT', 'target', 'goal', 'path', 'pathT', 'hop', 'winding', 'pulse', 'staleBoost', 'act', 'def', 'buffs', 'k2', 'h2', 'kit', 'st',
  'later', 'rays', 'home', 'lastHitBy', 'lastHit', 'stBy', 'bursts', 'healAt', 'healBy', 'healAmt', 'castT', 'seen', 'hexSeen', 'think', 'thinkT', 'aim',
  'stuckT', 'lastX', 'lastY', 'turnT', 'wantA', 'lookA', 'pose', 'tilt', 'squash', 'stepT', 'mvT']);
const SKIP_K = new Set(['cd', 'tiers', 'using', 'nodes', 'mods', 'trait', 'extra', 'statHook', 'hero', 'gAnim', 'jabAnim', 'cutAnim', 'slashAnim', 'stabDef', 'slashDef', 'charges']);
const isUntilKey = (k) => /until|end$|End$|At$/i.test(k);

const { alive: simAlive } = await imp('js/sim.js');
const alive = (u) => !!u && simAlive(u);
const sameSide = (a, b) => (a.trueTeam || a.team) === (b.trueTeam || b.team);

function snap(w, u) {
  const side = [], foe = [];
  for (const o of w.units) { if (o.dead) continue; (sameSide(o, u) ? side : foe).push(o); }
  const buffsOf = (list) => { const m = new Map(); for (const o of list) { const b = new Map(); for (const x of o.buffs || []) b.set(x.id, x.t); m.set(o, b); } return m; };
  const hooksOf = (list) => { const m = new Map(); for (const o of list) { const b = new Map(); for (const x of o.h2 || []) b.set(x.id, x.until); m.set(o, b); } return m; };
  const uf = {}; for (const k of Object.keys(u)) if (!SKIP_U.has(k) && k[0] !== '_') uf[k] = u[k];
  const kf = {}; if (u.kit) for (const k of Object.keys(u.kit)) if (!SKIP_K.has(k)) kf[k] = u.kit[k];
  const af = new Map(); for (const o of side) if (o !== u) { const m = {}; for (const k of Object.keys(o)) if (typeof o[k] === 'number' && !SKIP_U.has(k) && (/T$/.test(k) || isUntilKey(k))) m[k] = o[k]; af.set(o, m); }
  return { act: u.act, def: u.def, rays: u.rays, side, foe, af, buffs: buffsOf(side), foeBuffs: buffsOf(foe), hooks: hooksOf(side), foeHooks: hooksOf(foe),
    k2: new Map((u.k2 || []).map((x) => [x.id, x.t])), units: new Set(w.units), fx: new Set(w.fx), hazards: new Set(w.hazards), walls: new Set(w.walls),
    proj: new Set(w.projectiles), uf, kf };
}

// The lasting things one cast left: a list of { key, cls, on() } (on: is it still there?). cls says whose it is:
// state (on the hero himself: an act, a form, a buff, a timer, a flag), ally (on a friend), summon, zone, foe.
// Things a piece of an ability already owned up to: a piece can run inside another one's run (a summon's delayed
// spawn landing inside a zone's tick), and the outer one mustn't take them.
let CLAIM = new WeakSet();
function claim(w, A) { for (const list of [w.units, w.fx, w.hazards, w.walls, w.projectiles]) for (const o of list) if (!A.units.has(o) && !A.fx.has(o) && !A.hazards.has(o) && !A.walls.has(o) && !A.proj.has(o)) CLAIM.add(o); }
function diff(w, u, A, Z) {
  const out = [], add = (key, cls, on, extra) => { if (!JUNK.has(key)) out.push({ key, cls, on, ...extra }); };
  if (Z.act && Z.act !== A.act) { const act = Z.act; add('act:' + act.type, 'state', () => u.act === act); }
  if (u.rays && u.rays !== A.rays) { const R = u.rays; add('rays', 'ally', () => !!u.rays && R.some((r) => u.rays.includes(r) && alive(r.to))); }
  if (Z.def !== A.def) { const d = Z.def; add('form', 'state', () => u.def === d); }
  // buffs and hooks, on the hero and friends, and on foes
  const buffDiff = (before, list, clsSelf, clsOther) => {
    const groups = new Map();
    for (const o of list) {
      if (!alive(o)) continue;
      const b0 = before.get(o) || new Map();
      for (const x of o.buffs || []) { const was = b0.get(x.id); if (was == null || x.t > was + 0.05) {
        const cls = o === u ? clsSelf : clsOther, key = (cls === 'state' ? 'buff:' : cls + 'Buff:') + x.id;
        if (!groups.has(key)) groups.set(key, { cls, id: x.id, units: [] }); groups.get(key).units.push(o); } }
    }
    for (const [key, g] of groups) add(key, g.cls, () => g.units.some((o) => alive(o) && o.buffs.some((x) => x.id === g.id && x.t > 0)), { n: g.units.length });
  };
  const sideNow = w.units.filter((o) => !o.dead && sameSide(o, u)), foeNow = w.units.filter((o) => !o.dead && !sameSide(o, u));
  buffDiff(A.buffs, sideNow, 'state', 'ally');
  buffDiff(A.foeBuffs, foeNow, 'foe', 'foe');
  const hookDiff = (before, list, clsSelf, clsOther) => {
    const groups = new Map();
    for (const o of list) {
      if (!alive(o)) continue;
      const h0 = before.get(o) || new Map();
      for (const x of o.h2 || []) { const was = h0.get(x.id); if (was == null || x.until > was + 0.05) {
        const cls = o === u ? clsSelf : clsOther, id = x.id.replace(/\d+$/, ''), key = (cls === 'state' ? 'hook:' : cls + 'Hook:') + id;
        if (!groups.has(key)) groups.set(key, { cls, list: [] }); groups.get(key).list.push([o, x.id]); } }
    }
    for (const [key, g] of groups) add(key, g.cls, () => g.list.some(([o, id]) => alive(o) && o.h2 && o.h2.some((x) => x.id === id && x.until > w.time)), { n: g.list.length });
  };
  hookDiff(A.hooks, sideNow, 'state', 'ally');
  hookDiff(A.foeHooks, foeNow, 'foe', 'foe');
  for (const x of u.k2 || []) { const was = A.k2.get(x.id); if (was == null || x.t > was + 0.05) { const id = x.id; add('timer:' + id.replace(/\d+$/, ''), 'state', () => !!u.k2 && u.k2.some((y) => y.id === id && y.t > 0)); } }
  // new units the hero owns
  const born = new Map();
  for (const s of w.units) if (!A.units.has(s) && !CLAIM.has(s) && !s.dead && s !== u && !s.partOf && ownerOf(s) === u) { if (!born.has(s.kind)) born.set(s.kind, []); born.get(s.kind).push(s); }
  for (const [kind, list] of born) add('summon:' + kind, 'summon', () => list.some((s) => alive(s) && w.units.includes(s)), { n: list.length, life: list[0].lifeT ?? null });
  // zones, hazards, walls, long-lived projectiles
  for (const f of w.fx) if (!A.fx.has(f) && !CLAIM.has(f) && (f.type === 'zone' || f.tick || f.ward) && f.max >= 0.75) add('zone:' + (f.draw || f.kind || f.type), 'zone', () => w.fx.includes(f) && f.t < f.max);
  for (const h of w.hazards) if (!A.hazards.has(h) && !CLAIM.has(h)) add('hazard:' + h.type, 'zone', () => w.hazards.includes(h));
  for (const r of w.walls) if (!A.walls.has(r) && !CLAIM.has(r)) add('wall:' + (r.kind || 'wall'), 'zone', () => w.walls.includes(r));
  for (const p of w.projectiles) if (!A.proj.has(p) && !CLAIM.has(p) && (p.life == null || p.life > 1.2)) add('proj:' + (p.kind || 'shot'), 'zone', () => w.projectiles.includes(p));
  // flags and timers on the hero and his kit
  const fields = (obj, before, pre) => {
    if (!obj) return;
    for (const k of Object.keys(obj)) {
      if ((pre === 'u.' ? SKIP_U : SKIP_K).has(k) || k[0] === '_') continue;
      const v = obj[k], b = before[k]; if (v === b) continue;
      if (typeof v === 'number') {
        if (isUntilKey(k) && v > w.time + 0.3 && v < w.time + 300) add(pre + k, 'state', () => obj[k] > w.time);
        else if (v > 0.3 && !(b > 0) && /T$|Timer$|^t$|Left$/.test(k)) { const v0 = v; let seen = w.time; const c = add(pre + k, 'state', () => obj[k] > 0, { tick: true, v0 }); void c; void seen; }
      } else if (v && typeof v === 'object' && !Array.isArray(v) && v !== b) // (an object with its own clock, charges or health is over when they are)
        add(pre + k, 'state', () => obj[k] === v && !(v.until != null && v.until <= w.time) && !(v.until != null && v.n != null && v.n <= 0) && !(v.hp != null && v.team && !alive(v)));
      else if (v === true && !b) add(pre + k, 'state', () => obj[k] === true);
    }
  };
  fields(u, A.uf, 'u.');
  // timers on friends (a heal over time, a shield): numbers ending in T that went up, or an "until" time
  const ag = new Map();
  for (const o of sideNow) { if (o === u || !alive(o) || o.summon || !A.af.has(o)) continue; const m = A.af.get(o);
    for (const k of Object.keys(o)) { const v = o[k]; if (typeof v !== 'number' || SKIP_U.has(k)) continue; const b = m[k];
      const until = isUntilKey(k) && v > w.time + 0.3 && v < w.time + 300 && v !== b, tm = /T$/.test(k) && v > 0.3 && !(b > v - 0.05);
      if (until || tm) { const key = 'ally.' + k; if (!ag.has(key)) ag.set(key, { k, until, list: [] }); ag.get(key).list.push(o); } } }
  for (const [key, g] of ag) add(key, 'ally', () => g.list.some((o) => alive(o) && (g.until ? o[g.k] > w.time : o[g.k] > 0)), { n: g.list.length });
  fields(u.kit, A.kf, 'kit.');
  return out;
}

// ---------------------------------------------------------------- the cooldown rule under test
// today: the game's own (the cooldown runs from the cast).
// a: the cooldown is held at full while the ability's state lasts and starts running when it ends.
// b: the cooldown is set to its full length plus the effect's average length (RULE.add[abilityId], seconds).
// c: the cooldown runs from the cast as today, but when the effect ends at least RULE.frac of the full cooldown is left
//    (a rest after the effect: nothing changes where plenty is left already).
export const RULE = { mode: 'today', add: {}, only: null, cls: {}, keys: {}, frac: 0.5 };
export function setRule(mode, o = {}) { RULE.mode = mode; RULE.add = o.add || {}; RULE.only = o.only || null; RULE.cls = o.cls || {}; RULE.keys = o.keys || {}; RULE.frac = o.frac ?? 0.5; }
const counts = (id, c, cls) => (RULE.keys[id] ? RULE.keys[id].includes(c.key) : c.cls === cls);
const ruled = (id) => RULE.mode !== 'today' && (!RULE.only || RULE.only.includes(id));

// ---------------------------------------------------------------- the watcher
const W = { hero: null, w: null, rec: null };
let wrapped = false;
function wrapAll() {
  if (wrapped) return; wrapped = true;
  for (const id of Object.keys(K.ABILITIES)) {
    const A = K.ABILITIES[id]; if (!A || typeof A.use !== 'function') continue;
    const orig = A.use;
    A.use = function (w, u, t, tier) {
      if (u !== W.hero || w !== W.w) return orig.apply(this, arguments);
      const before = snap(w, u);
      let r; try { r = orig.apply(this, arguments); } finally { W.rec.afterCast(id, tier, before, t); }
      return r;
    };
  }
}

// One fight. Returns what happened to every cast of the watched hero.
export function fight(heroId, tier, scenario, seed, o = {}) {
  wrapAll();
  const save = freshSave(); save.cheat = true;
  setSeed(seed);
  const setup = { arena: 'crypt', size: 'l', ...SCENARIOS[scenario](heroId, tier) };
  const run = B.newBattle(save, setup);
  const w = run.world, u = run.sides.a.find((x) => x.kind === heroId);
  const abs = HEROES[heroId].abilities;
  const casts = [];          // every cast: { ab, t, cd, comps: [{ key, cls, end, cdEnd, why }], next }
  const open = [];           // comps still running: { c, cast }
  const lastCast = {};       // ab -> the cast before (to fill in the gap to the next one)
  const onTime = {};         // ab -> cls -> { t, dmg, taken } while it is up
  const offAcc = { t: 0, dmg: 0, taken: 0 };
  let stepDmg = 0, stepTaken = 0, aliveT = 0, attacks = 0, lastAtk = u.atkT;
  const held = {};           // rule a: ab -> the cast whose state holds its cooldown
  // rule a: the cooldown is held from the moment the effect is there (at the cast, or when a thrown thing lands) until
  // it is over; a later cast's effect takes the hold over
  const holdFor = (cast, c) => {
    if ((RULE.mode !== 'a' && RULE.mode !== 'c') || !ruled(cast.ab) || lastCast[cast.ab] !== cast) return;
    const cls = RULE.cls[cast.ab] || 'state'; if (!counts(cast.ab, c, cls) || held[cast.ab]) return;
    held[cast.ab] = { cast, cls }; if (RULE.mode === 'a') u.kit.cd[cast.ab] = 1e6;
  };
  // merge what one piece of an ability left into its cast (the cast itself, a delayed landing, a zone's tick)
  const attach = (cast, comps) => {
    for (const c of comps) {
      if (WORLD[cast.ab] && WORLD[cast.ab][c.key]) c.cls = WORLD[cast.ab][c.key];
      const old = cast.comps.find((x) => x.key === c.key);
      if (!old) { const n = { ...c, end: null, cdEnd: null, why: null }; cast.comps.push(n); open.push({ c: n, cast }); holdFor(cast, n); continue; }
      if (old.static) continue;
      const was = old.on, now = c.on; old.on = () => was() || now();
      if (old.end != null) { old.end = null; old.cdEnd = null; old.why = null; open.push({ c: old, cast }); }
    }
  };
  const rec = {
    afterCast(id, tier2, before, target) {
      const ab = abs.find((a) => a.id === id), cd = u.kit.cd[id];
      const cast = { ab: id, tier: tier2, t: w.time, cd, full: cooldownOf(u, ab), comps: [], next: null, target, atk: 0, other: 0, re: 0 };
      if (lastCast[id]) lastCast[id].next = w.time;
      lastCast[id] = cast;
      casts.push(cast);
      attach(cast, diff(w, u, before, snap(w, u))); claim(w, before);
      if (ruled(id)) {
        if (RULE.mode === 'b') { const ad = RULE.add[id]; u.kit.cd[id] = cd + ((ad && typeof ad === 'object' ? ad[tier2] : ad) || 0); }
        else for (const c of cast.comps) holdFor(cast, c);
      }
    },
  };
  // every later piece of an ability (a projectile landing, a zone's tick, a queued follow-up, a leap's landing: fxtag.js
  // runs each one tagged with its ability) is looked at before and after it runs, and what it left joins the cast
  const pieces = [];
  W.hero = u; W.w = w; W.rec = rec;
  AUDIT.on = (ev, w2, v, src, amt, o) => {
    if (w2 !== w) return;
    if (ev === 'abRun') { if (v !== u) return; if (o.at === 'pre') pieces.push(snap(w, u)); else { const A = pieces.pop(); if (A && lastCast[o.ab]) { attach(lastCast[o.ab], diff(w, u, A, snap(w, u))); claim(w, A); } } return; }
    if (ev === 'hurt') { if (v === u) stepTaken += amt; else if (src && ownerOf(src) === u && !sameSide(v, u)) stepDmg += amt; }
    else if (ev === 'cast' && v === u) { const seen = new Set(); for (const x of open) if (x.c.cls !== 'foe' && !seen.has(x.cast)) { seen.add(x.cast); if (x.cast.ab === o.ab) x.cast.re++; else x.cast.other++; } }
  };
  let t = 0;
  try {
    while (run.phase === 'fight' && t < 260) {
      B.updateBattle(run, DT); t += DT;
      const up = alive(u);
      if (up) aliveT += DT;
      // an attack started: its clock jumped up
      if (u.atkT > lastAtk + 0.05) { attacks++; const seen = new Set(); for (const x of open) if (x.c.cls !== 'foe' && !seen.has(x.cast)) { seen.add(x.cast); x.cast.atk++; } }
      lastAtk = u.atkT;
      // who is still running
      for (let i = open.length - 1; i >= 0; i--) {
        const { c, cast } = open[i];
        let on = false; try { on = up && c.on(); } catch (e) { on = false; }
        if (c.tick && on && w.time - cast.t > 1.0 && c.v0 != null) { // a "timer" field that never moved is a stored number, not a timer
          const cur = c.key.startsWith('kit.') ? u.kit[c.key.slice(4)] : u[c.key.slice(2)];
          if (cur === c.v0) { c.static = true; open.splice(i, 1); continue; }
          c.v0 = null;
        }
        if (!on) {
          c.end = w.time; c.cdEnd = u.kit.cd[cast.ab];
          c.why = !up ? 'down' : (u.stunT > 0 || u.frozenT > 0 || u.sleepT > 0) ? 'cc' : 'end';
          c.tgtDead = !!(cast.target && !alive(cast.target));
          open.splice(i, 1);
        }
      }
      // rule a: the held cooldown starts once the state is over
      for (const id in held) { const h = held[id]; if (!h.cast.comps.some((c) => counts(id, c, h.cls) && !c.static && c.end == null && c.why !== 'fightEnd')) {
        const ab = abs.find((a) => a.id === id), full = cooldownOf(u, ab); delete held[id];
        u.kit.cd[id] = RULE.mode === 'a' ? full : Math.max(u.kit.cd[id], RULE.frac * full);
        for (const c of h.cast.comps) if (c.cdEnd != null && c.end === w.time) c.cdEnd = u.kit.cd[id];
      } }
      // damage in and out, split by which abilities' states are up
      if (up) {
        const upAbs = new Map();
        for (const x of open) { const m = upAbs.get(x.cast.ab) || new Set(); m.add(x.c.cls); upAbs.set(x.cast.ab, m); }
        for (const ab of abs) { const m = upAbs.get(ab.id); const T = onTime[ab.id] || (onTime[ab.id] = {});
          for (const cls of ['state', 'ally', 'summon', 'zone', 'foe']) { const R = T[cls] || (T[cls] = { t: 0, dmg: 0, taken: 0 }); if (m && m.has(cls)) { R.t += DT; R.dmg += stepDmg; R.taken += stepTaken; } } }
        offAcc.t += DT; offAcc.dmg += stepDmg; offAcc.taken += stepTaken;
      }
      stepDmg = 0; stepTaken = 0;
    }
  } finally { AUDIT.on = null; W.hero = null; W.w = null; W.rec = null; }
  for (const { c } of open) { c.end = null; c.why = 'fightEnd'; }
  return { hero: heroId, tier, scenario, seed, winner: run.winner, time: run.t, aliveT, attacks, total: offAcc, onTime,
    casts: casts.map((k) => ({ ab: k.ab, tier: k.tier, t: +k.t.toFixed(2), cd: +k.cd.toFixed(2), next: k.next == null ? null : +k.next.toFixed(2), atk: k.atk, other: k.other, re: k.re,
      comps: k.comps.filter((c) => !c.static).map((c) => ({ key: c.key, cls: c.cls, n: c.n, end: c.end == null ? null : +c.end.toFixed(2), cdEnd: c.cdEnd == null ? null : +Math.min(c.cdEnd, 9999).toFixed(2), why: c.why, td: c.tgtDead || undefined })) })),
    end: +w.time.toFixed(2) };
}
