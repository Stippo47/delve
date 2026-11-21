// Run stats (round 9, lane T; docs/BUILD-v5.md "Lane T"). Pure: no DOM, no imports (sim.js, fxtag.js and
// trinkets.js call in here, so it must not import them back). The sim counts into w.stats, which dungeon.js points at
// run.stats for every room; the lab and the balance batches have no w.stats and nothing is counted.
//
// run.stats = run.summary.stats = {
//   order: [heroId...]  (the party, then the sellswords),  mercs: [heroId...],
//   heroes: { [heroId]: { dmg, heal, taken, kills, downs, revives, best (biggest single blow), bestBy (its source),
//     src: { dmg: { [source]: n }, heal: { [source]: n }, kills: { [source]: n } } } },
//   foes: { [enemyKind]: { n, elite, mini, boss, major } }  (every enemy defeated, whoever finished it) }
// A source is 'attack' (the weapon), 'ab:<abilityId>', 'tk:<trinketId>' (a trinket's own work; 'tk:pot:<id>' for an
// elixir), 'pet' (summons and minions), 'st:<status>' (burn, poison... that the hero put on), or 'other'.
// Credit: a summon's work goes to whoever made it (summonBy, up the chain), a ghost's to its body; damage that a
// status does goes to whoever applied the status last (u.stBy, set in sim.js addStatus).

// What is running right now: a trinket's hook (tk, set by tagTrinket below) or an ability's use or one of its later
// landings (ab + abU, set by fxtag.js).
export const CUR = { tk: null, tkU: null, ab: null, abU: null };

export function newStats(order = [], mercs = []) {
  const heroes = {};
  for (const k of order) heroes[k] = { dmg: 0, heal: 0, taken: 0, kills: 0, downs: 0, revives: 0, best: 0, bestBy: null, src: { dmg: {}, heal: {}, kills: {} } };
  return { order: order.slice(), mercs: mercs.slice(), heroes, foes: {} };
}

// The unit whose work this is: up the summon chain, a ghost back to its body.
export function ownerOf(u) {
  let o = u;
  for (let i = 0; i < 5 && o; i++) {
    if (o.summonBy) o = o.summonBy;
    else if (o.ghostOf) o = o.ghostOf;
    else break;
  }
  return o;
}
const heroKey = (S, r) => (r && r.team === 'hero' && !r.turned && S.heroes[r.kind] ? r.kind : null);

// Which part of the hero did it. src: the unit that struck (or healed); root: its owner; o: the hit's options.
function sourceOf(src, root, o = {}) {
  if (o.stk) return 'st:' + o.stk;
  const tk = o.tk || (CUR.tk && (CUR.tkU === root || CUR.tkU === src) ? CUR.tk : null); // only the wearer's own trinket
  if (tk) return 'tk:' + tk;
  if (src && 'ghostOf' in src) return 'tk:wraithVeil'; // a Wraith Veil ghost fighting on
  if (src && src !== root) return src.tkSrc ? 'tk:' + src.tkSrc : 'pet';
  const ab = o.pab || o.ab || (root.kit && root.kit.using) || (CUR.abU === root ? CUR.ab : null);
  if (ab) return 'ab:' + ab;
  if (o.proc) return 'other';
  return 'attack';
}
const add = (m, k, n) => { m[k] = (m[k] || 0) + n; };

// sim.js hurt: after the blow has come off u.hp. amt: the blow; the part that met health counts (overkill doesn't).
export function tallyHurt(w, u, src, amt, o = {}) {
  const S = w.stats; if (!S || !(amt > 0)) return;
  const eff = Math.min(amt, Math.max(0, u.hp + amt));
  // taken: a party hero's own body
  if (u.team === 'hero' && !u.summon && S.heroes[u.kind]) S.heroes[u.kind].taken += eff;
  if (u.team !== 'enemy') return;
  const by = src || o.by, root = ownerOf(by), k = heroKey(S, root); if (!k) return;
  const h = S.heroes[k], s = sourceOf(by, root, o);
  h.dmg += eff; add(h.src.dmg, s, eff);
  if (!o.dot && amt > h.best) { h.best = amt; h.bestBy = s; }
}
// sim.js heal: what actually came back. o.pab: the ability a lasting heal (regrowth, leeches) came from.
export function tallyHeal(w, u, src, got, o = {}) {
  const S = w.stats; if (!S || !(got > 0) || u.team !== 'hero') return;
  const root = ownerOf(src), k = heroKey(S, root); if (!k) return;
  const h = S.heroes[k], s = sourceOf(src, root, o);
  h.heal += got; add(h.src.heal, s, got);
}
// sim.js hurt, just before kill(): a party hero going down, or an enemy killed (credited to the hero behind the blow).
export function tallyDown(w, u, src, o = {}) {
  const S = w.stats; if (!S) return;
  if (u.team === 'hero' && !u.summon) { if (S.heroes[u.kind]) S.heroes[u.kind].downs++; return; }
  if (u.team !== 'enemy') return;
  const by = src || o.by, root = ownerOf(by), k = heroKey(S, root); if (!k) return;
  const h = S.heroes[k]; h.kills++; add(h.src.kills, sourceOf(by, root, o), 1);
}
// dungeon.js revive: a helper brought someone back up.
export function tallyRevive(S, helper) { if (S && helper && S.heroes[helper.kind]) S.heroes[helper.kind].revives++; }
// dungeon.js onKill: an enemy fell (whoever or whatever finished it).
export function tallyFoe(S, u) {
  if (!S || !u || u.summon) return;
  const f = S.foes[u.kind] || (S.foes[u.kind] = { n: 0, elite: 0, mini: 0, boss: 0, major: 0 });
  f.n++;
  if (u.mini) f.mini++; else if (u.def && u.def.boss) f.boss++; else if (u.major) f.major++; else if (u.elite) f.elite++;
}
// sim.js addStatus: who put this status on (so its ticks and bursts count for them).
export function noteStatus(u, type, src) { if (src) (u.stBy || (u.stBy = {}))[type] = src; }

// A finished run's numbers, rounded, for the summary.
export function finishStats(S) {
  if (!S) return null;
  const r = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Math.round(v)]).filter(([, v]) => v > 0));
  const heroes = {};
  for (const [k, h] of Object.entries(S.heroes)) heroes[k] = { ...h, dmg: Math.round(h.dmg), heal: Math.round(h.heal), taken: Math.round(h.taken), best: Math.round(h.best),
    src: { dmg: r(h.src.dmg), heal: r(h.src.heal), kills: r(h.src.kills) } };
  return { order: S.order.slice(), mercs: S.mercs.slice(), heroes, foes: JSON.parse(JSON.stringify(S.foes)) };
}

// ---------------------------------------------------------------- trinket credit
// trinkets.js trinketHooks wraps each worn trinket's hooks with this: while one runs, CUR.tk names it, and what it
// leaves behind (a shot, a zone, a summon, a later blow) keeps the name, the way fxtag.js does it for abilities.
const EVENTS = ['tick', 'dealt', 'taken', 'hit', 'kill', 'death', 'downed', 'evade', 'struck', 'fallen', 'allyDown'];
export function tagTrinket(id, hooks) {
  if (!hooks || !id) return hooks;
  const out = { ...hooks };
  for (const k of EVENTS) if (typeof hooks[k] === 'function') { const g = hooks[k]; out[k] = function (w, ...a) { return within(id, w, a[0], () => g.call(this, w, ...a)); }; }
  return out;
}
function within(id, w, u, fn, wearer = u) {
  const prev = CUR.tk, prevU = CUR.tkU; CUR.tk = id; CUR.tkU = wearer;
  const ok = w && w.units && w.fx && w.projectiles;
  const nu = ok ? w.units.length : 0, nf = ok ? w.fx.length : 0, np = ok ? w.projectiles.length : 0;
  try { return fn(); } finally {
    if (ok) {
      for (let i = nu; i < w.units.length; i++) if (!w.units[i].tkSrc) w.units[i].tkSrc = id;
      for (let i = nf; i < w.fx.length; i++) keep(id, w, w.fx[i], 'tick', wearer);
      for (let i = np; i < w.projectiles.length; i++) { const p = w.projectiles[i]; if (!p.tk) p.tk = id; keep(id, w, p, 'land', wearer); keep(id, w, p, 'onHit', wearer); }
      if (u && u.later) for (const l of u.later) keep(id, w, l, 'f', wearer);
    }
    CUR.tk = prev; CUR.tkU = prevU;
  }
}
function keep(id, w, o, k, wearer) {
  const g = o && o[k]; if (typeof g !== 'function' || g._tk) return;
  const f = function (...a) { return within(id, w, null, () => g.apply(this, a), wearer); }; f._tk = true; o[k] = f;
}

// ---------------------------------------------------------------- lifetime (save.tally)
// save.tally = { foes: { [kind]: { n, elite, mini, boss, major } }, heroes: { [heroId]: { dmg, heal, taken, kills,
//   downs, revives, best, runs, src: { dmg, heal, kills } } } }. Sellswords aren't kept.
export function bankTally(save, S) {
  if (!S) return;
  const t = save.tally || (save.tally = { foes: {}, heroes: {} });
  t.foes = t.foes || {}; t.heroes = t.heroes || {};
  for (const [k, f] of Object.entries(S.foes || {})) {
    const g = t.foes[k] || (t.foes[k] = { n: 0, elite: 0, mini: 0, boss: 0, major: 0 });
    for (const key of Object.keys(g)) g[key] += f[key] || 0;
  }
  for (const [k, h] of Object.entries(S.heroes || {})) {
    if ((S.mercs || []).includes(k)) continue;
    const g = t.heroes[k] || (t.heroes[k] = { dmg: 0, heal: 0, taken: 0, kills: 0, downs: 0, revives: 0, best: 0, runs: 0, src: { dmg: {}, heal: {}, kills: {} } });
    for (const key of ['dmg', 'heal', 'taken', 'kills', 'downs', 'revives']) g[key] += Math.round(h[key] || 0);
    g.best = Math.max(g.best || 0, Math.round(h.best || 0)); g.runs++;
    for (const m of ['dmg', 'heal', 'kills']) { g.src[m] = g.src[m] || {}; for (const [s, v] of Object.entries((h.src && h.src[m]) || {})) add(g.src[m], s, Math.round(v)); }
  }
}
// A save's tally made safe to read (save.js normalise).
export function cleanTally(t) {
  const out = { foes: {}, heroes: {} };
  if (!t || typeof t !== 'object') return out;
  const num = (v) => Math.max(0, Math.round(+v || 0));
  for (const [k, f] of Object.entries(t.foes || {})) if (f && typeof f === 'object') out.foes[k] = { n: num(f.n), elite: num(f.elite), mini: num(f.mini), boss: num(f.boss), major: num(f.major) };
  for (const [k, h] of Object.entries(t.heroes || {})) {
    if (!h || typeof h !== 'object') continue;
    const src = {};
    for (const m of ['dmg', 'heal', 'kills']) { src[m] = {}; for (const [s, v] of Object.entries((h.src && h.src[m]) || {})) if (num(v)) src[m][s] = num(v); }
    out.heroes[k] = { dmg: num(h.dmg), heal: num(h.heal), taken: num(h.taken), kills: num(h.kills), downs: num(h.downs), revives: num(h.revives), best: num(h.best), runs: num(h.runs), src };
  }
  return out;
}
