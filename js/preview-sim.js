// The Book's previews, the simulation half (round 13, lane K; the designer: "On every ability I want the preview clips
// you made in riffle to be shown (can be simulated not recorded) for every unit and ability and tier ... For the
// enemies the same preview will show up for them with their abilities against dummies at normal, elite, and major
// tier", and "All status effects and trinkets should have previews aswell").
// No DOM here: js/preview.js draws a stage into a canvas; tools/preview-check.mjs steps every stage in Node.
//
// A spec says what to play:
//   { t: 'hero', id, move: 'attack' | <abilityId> | 'trait', tier: 0..3 }   tier = heroes.js tierBuild (the one meaning)
//   { t: 'foe', id, move: 'attack' | 'kit' | 'elite' | 'major', rank: 0..2 } dungeon.js battleFoe (normal / elite / major)
//   { t: 'status', id }      a fighter with the status building up, then bursting (or a timed state put on it)
//   { t: 'trinket', id }     a hero wearing it, in the situation that makes it fire
//   { t: 'potion', id }      a hero who drinks it
// makeStage(spec) -> { w, loop, step(dt), reset(), fired(), locked, why }: its own small world, never the run's. The
// stage loops by itself: it plays the move, waits a beat, and builds its world again.
// Every list comes from the data (HEROES, DEFS and the dungeons' rosters, ELITES / MAJOR_MOVES, STATUS and the
// Book's STATUSES words, TRINKETS, POTIONS), so new heroes, enemies, statuses and trinkets show up without edits here.
import { makeWorld, spawn, step, setAnim, hurt, meleeSwing, addStatus, stun, addBuff } from './sim.js';
import { ABILITIES, initKit } from './kits.js';
import { tagAbility } from './fxtag.js';
import { DEFS } from './units.js';
import { HEROES, tierBuild, freeNodes } from './heroes.js';
import { buildGrid } from './path.js';
import { battleFoe } from './dungeon.js';
import { ELITES } from './elites.js';
import { STATUS } from './statuses.js';
import { STATUSES } from './bestiary.js';
import { TRINKETS } from './trinkets.js';
import { POTIONS, elixirKey } from './potions.js';
import { BOSS_ARENAS } from './bosses.js';
import { variantUrl } from './recolor.js';
import { ELITE_MOVE } from './movetext.js';

// ---------------------------------------------------------------- the dummies
// A straw target that never moves, never strikes back on its own and never dies (it is topped up when low). Two:
// red (the monsters' side, as in the showcase) and blue, hero-coloured (what an enemy's moves are shown on).
const DUMMY = { name: 'Dummy', art: 'art/lab/dummy.svg', headR: 50, r: 28, vr: 22, turn: 0, accel: 0, face: 0, mass: 2.4, hp: 400, speed: 0,
  role: 'melee', range: 50, atkCd: 999, dmg: 0, arc: 1, temp: 0, commit: 0, xp: 0, coins: [0, 0], noElite: true, dummy: true, noCorpse: true };
DEFS.bookDummy = { ...DUMMY, team: 'enemy' };
DEFS.bookDummyBlue = { ...DUMMY, team: 'hero', art: variantUrl(DUMMY.art, { hue: 0, sat: 1, light: 0, accent: { from: 5, range: 22, hue: 212, sat: 1, light: 0.06 } }) };
export const isDummy = (k) => !!(DEFS[k] && DEFS[k].dummy);

// ---------------------------------------------------------------- staging the hero's moves (the showcase's rules)
// The same rules as lab.html?m=show (lab.js setupShow), which made the Riffle clips: where the dummies stand and who
// else is needed, for the kits.js abilities that don't say it themselves (kits2.js abilities carry a `show`).
const FAR = new Set(['charge', 'leap', 'hook', 'backstab', 'dash', 'barrage', 'frostArrow', 'fireball', 'flameWall', 'iceShard', 'iceWall',
  'chainLightning', 'thunderclap', 'stormCloud', 'smite', 'entangle', 'raiseDead', 'lifeDrain', 'boneSpear', 'miasma', 'mend', 'rejuvenate', 'cure', 'encore']);
const NEEDS_ALLY = new Set(['guard', 'mend', 'sanctuary', 'warSong', 'encore', 'rejuvenate', 'cure', 'consecrate']);
const SINGLE = new Set(['shieldBash', 'backstab', 'smite', 'hook', 'mend', 'encore', 'rejuvenate', 'cure', 'guard']);
const CAST_AT = 0.45; // when the ability goes off, seconds into the loop

export const HERO_W = 470, HERO_H = 350;
// keep: the stage's last world. It is emptied and filled again rather than replaced, so render.js's floor picture
// (cached per world) is painted once per stage, not once per loop.
function room(W, H, keep) {
  let w = makeWorld(W, H);
  if (keep && keep.W === W && keep.H === H) { for (const k of Object.keys(keep)) delete keep[k]; Object.assign(keep, w); w = keep; }
  w.doors = []; w.cleared = true; w.cells = null; w.walls = []; buildGrid(w);
  w.camAt = { x: W / 2, y: H / 2 }; // the camera stays put (render.js layout)
  w.doorIn = { x: 0, y: -4000 }; // no doorway drawn: a practice yard, not a room on the way
  w.bookPreview = true;
  return w;
}
const heroNodes = (id, tier) => ({ ...freeNodes(id), ...tierBuild(id, tier) });
function dummyAt(w, x, y, side = 'enemy') {
  const d = spawn(w, side === 'enemy' ? 'bookDummy' : 'bookDummyBlue', x, y);
  d.facing = side === 'enemy' ? Math.PI : 0; d.home = { x, y }; d.aggro = false; d.atkT = 999;
  return d;
}
// keep a dummy where it belongs and in one piece (a knocked or pulled one is let go for a moment, as on the bench)
// firm: back in place quickly, so blows keep landing (a spar), not left where a knock sent it (a showcase move)
function tendDummy(w, d, dt, firm) {
  if (d.gone) return;
  d.atkT = 999;
  if (Math.hypot(d.kx, d.ky) > 20) d._free = firm ? 0.3 : 1.4;
  if (d._free > 0) d._free -= dt;
  else { const k = Math.min(1, dt * (firm ? 6 : 1.6)); d.x += (d.home.x - d.x) * k; d.y += (d.home.y - d.y) * k; }
  if (d.hp < d.maxHp * 0.12) d.hp = d.maxHp;
  if (d.downed) { d.downed = false; d.hp = d.maxHp; }
  if (!w.units.includes(d) && !d.gone) { d.dead = false; d.hp = d.maxHp; w.units.push(d); }
}
// a dummy knocked flat and taken away for the rest of the loop (either side: a hero-side one would only be downed)
function fell(w, d) {
  d.gone = true; d.dead = true; d.hp = 0; const i = w.units.indexOf(d); if (i >= 0) w.units.splice(i, 1);
  for (const o of w.units) if (o.target === d) o.target = null;
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; w.particles.push({ x: d.x, y: d.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 0.45, max: 0.45, size: 5, color: '#E6C979' }); }
}
const fullAlly = (w, kind, x, y) => {
  const a = spawn(w, kind, x, y, { level: 9 }); initKit(a, kind, {}, 1); for (const k in a.kit.cd) a.kit.cd[k] = 9;
  a.facing = 0; a.home = { x, y }; return a;
};

// ---------------------------------------------------------------- noticing that something happened
// Every new effect, shot, telegraph, danger zone, puddle, unit or body the world gains is counted once.
function marker() {
  const seen = new WeakSet();
  return (w) => {
    let n = 0;
    for (const list of [w.fx, w.danger, w.telegraphs, w.projectiles, w.hazards, w.units, w.corpses, w.pickups]) for (const o of list) if (!seen.has(o)) { seen.add(o); n++; }
    return n;
  };
}
const hpSum = (w) => w.units.reduce((a, u) => a + (u.hp || 0), 0);
// health, statuses, timed states and buffs of everyone: what a hook can change without making anything new
const stateSum = (w) => { let a = 0; for (const u of w.units) { a += (u.hp || 0) + (u.frozenT || 0) + (u.stunT || 0) + (u.rootT || 0) + (u.invulnT > 0 ? 7 : 0) + u.buffs.length * 13 + (u.ethereal ? 50 : 0); for (const k in u.st) a += u.st[k] || 0; if (u.kit) for (const k in u.kit.cd) a += u.kit.cd[k] > 900 ? u.kit.cd[k] - 999 : 0; } return a; };
// a dummy hit since the last look (sim.js hurt sets hitT)
function hitWatch() { const last = new WeakMap(); return (list) => { let n = 0; for (const d of list) { const h = d.hitT || 0; if (h > (last.get(d) ?? 0) + 1e-6) n++; last.set(d, h); } return n; }; }
// Hook objects (a trait, a trinket) wrapped so the stage sees when one does something: a hook that returns a changed
// number (dealt / taken / speeds), a true (downed / evade), or leaves new things or changed health in the world.
const PASSIVE = { dealt: 3, taken: 3 };
function watchHooks(obj, w, mark, onFire) {
  if (!obj || obj._watched) return obj;
  const out = { _watched: true };
  for (const [k, f] of Object.entries(obj)) {
    if (typeof f !== 'function') { out[k] = f; continue; }
    out[k] = function (...args) {
      mark(w); const hp0 = stateSum(w);
      const r = f.apply(this, args);
      const amt = PASSIVE[k] ? args[PASSIVE[k]] : null;
      if (mark(w) > 0 || Math.abs(stateSum(w) - hp0) > 0.01 || r === true
        || (amt != null && typeof r === 'number' && Math.abs(r - amt) > 1e-6)
        || ((k === 'moveSpeed' || k === 'atkSpeed' || k === 'shockMul') && typeof r === 'number' && r !== 1)) onFire(k);
      return r;
    };
  }
  return out;
}

// ---------------------------------------------------------------- the lists the Book shows
// A hero's moves: its attack, each ability (locked below tier 1), its trait.
export function heroMoves(id) {
  const h = HEROES[id]; if (!h) return [];
  return [{ move: 'attack', name: h.attack.name, kind: 'attack' }, ...h.abilities.map((a, i) => ({ move: a.id, name: a.name, kind: 'ability', i, ab: a })),
    { move: 'trait', name: h.trait.name, kind: 'trait' }];
}
// What the major's extra move is, by how the kind fights (elites.js makeMajor's rule), and the call for kinds without
// an elite move of their own.
export const MAJOR_KEY = (d) => (d.role === 'ranged' ? 'volley' : d.role === 'skirmish' ? 'charge' : 'quake');
export const canRank = (k) => !!DEFS[k] && !DEFS[k].boss && !DEFS[k].noElite;
const eliteOf = (k) => ELITES[k] || ELITES[DEFS[k].eliteAs];
const plainAttack = (d) => (d.atkCd || 0) < 99 && (d.dmg || 0) > 0;
const hasKit = (d) => !!(d.brain || d.ability || d.onDeath || d.splits || d.dashCd || d.hitSt || d.hops && d.onHop);
// An enemy's moves at a rank: its plain attack (if it has one), how it fights (its brain, ability and death), the
// elite's move from rank 1 and the major's from rank 2.
export function foeMoves(k, rank = 0) {
  const d = DEFS[k]; if (!d) return [];
  const out = [];
  if (plainAttack(d)) out.push({ move: 'attack', kind: 'attack' });
  if (hasKit(d) || !out.length) out.push({ move: 'kit', kind: 'kit' });
  const E = eliteOf(k);
  if (canRank(k) && rank >= 1 && E && ELITE_MOVE[k] !== '' && !(ELITE_MOVE[k] == null && ELITE_MOVE[DEFS[k].eliteAs] === '')) out.push({ move: 'elite', kind: 'elite' });
  if (canRank(k) && rank >= 2) out.push({ move: 'major', kind: 'major', key: MAJOR_KEY(d), call: !E || !E.tick });
  return out;
}
// Every status the Book names, and how each is shown. Build-ups (statuses.js STATUS) build to their burst; the states
// a burst leaves (frozen, sickened...) are shown by building their cause; the rest are put on directly.
const FROM_BURST = { frozen: 'chill', sick: 'poison', radiant: 'radiance', hexed: 'curse', tangled: 'entangle', ko: 'stagger' };
const PUT_ON = {
  root: (w, s) => { s.rootT = 3; },
  sleep: (w, s) => { s.sleepT = 3; },
  stun: (w, s) => { stun(w, s, 1.6); },
  guard: (w, s, o) => { s.guardBy = o.friend; s.guardT = 4; o.friend.guardOf = s; },
  invuln: (w, s) => { s.invulnT = 2.5; },
  taunt: (w, s, o) => { s.tauntBy = o.dummy; s.tauntT = 3.5; },
  buff: (w, s) => { addBuff(s, { id: 'book-buff', dur: 3.5, atkSpeed: 1.5, move: 1.3 }); },
  debuff: (w, s) => { addBuff(s, { id: 'book-debuff', dur: 3.5, atkSpeed: 0.6, move: 0.6 }); },
  rage: (w, s) => { addBuff(s, { id: 'rage', dur: 3.5, atkSpeed: 1.5, move: 1.4, taken: 0.7 }); },
};
export const statusIds = () => [...new Set([...Object.keys(STATUSES), ...Object.keys(STATUS)])];
export const statusHow = (id) => (STATUS[id] ? 'build' : FROM_BURST[id] && STATUS[FROM_BURST[id]] ? 'burst' : PUT_ON[id] ? 'put' : null);
export const trinketIds = () => Object.keys(TRINKETS).filter((k) => !TRINKETS[k].potion);
export const potionIds = () => Object.keys(POTIONS);

// Every spec there is (the headless check runs them all). kinds: the enemy kinds to cover.
export function allSpecs(kinds) {
  const out = [];
  for (const id of Object.keys(HEROES)) for (let tier = 0; tier <= 3; tier++) for (const m of heroMoves(id)) out.push({ t: 'hero', id, move: m.move, tier });
  for (const k of kinds) for (let rank = 0; rank <= (canRank(k) ? 2 : 0); rank++) for (const m of foeMoves(k, rank)) out.push({ t: 'foe', id: k, move: m.move, rank });
  for (const id of statusIds()) out.push({ t: 'status', id });
  for (const id of trinketIds()) out.push({ t: 'trinket', id });
  for (const id of potionIds()) out.push({ t: 'potion', id });
  return out;
}
export const specKey = (s) => [s.t, s.id, s.move || '', s.t === 'hero' ? s.tier : s.t === 'foe' ? s.rank : ''].join(':');

// ---------------------------------------------------------------- stages
export function makeStage(spec) {
  const make = { hero: spec.move === 'trait' ? traitStage : heroStage, foe: foeStage, status: statusStage, trinket: trinketStage, potion: trinketStage }[spec.t];
  if (!make) throw new Error('no stage for ' + spec.t);
  const S = { spec, loop: 3, t: 0, w: null, fires: 0, locked: false, why: '', tick: () => {}, size: [HERO_W, HERO_H] };
  const build = make(S, spec);
  S.loops = 0; S.loopsFired = 0;
  S.reset = () => { if (S.w) { S.loops++; if (S.fires > S.fires0) S.loopsFired++; } S.fires0 = S.fires; S.t = 0; S.firstT = null; S.felled = false; if (S.fit) S.loop = S.fit.max; S.mark = marker(); build(); S.mark(S.w); };
  S.step = (dt) => {
    if (S.t >= S.loop) S.reset();
    S.t += dt; S.tick(dt); step(S.w, dt); if (S.after) S.after(dt);
    const w = S.w, seen = S._seen || (S._seen = new WeakSet()), g = S.sig;
    for (const [k, list] of [['fx', w.fx], ['proj', w.projectiles], ['units', w.units], ['danger', w.danger], ['hazards', w.hazards], ['tele', w.telegraphs]]) for (const o of list) if (!seen.has(o)) {
      seen.add(o); g[k]++;
      if (o.r) g.size = (g.size || 0) + Math.round(o.r / 10); // bigger rings, zones, blasts
      if (o.max || o.dur || o.t) g.time = (g.time || 0) + Math.round((o.max || o.dur || o.t || 0) * 2); // longer-lasting things
    }
    // what it did to the dummies: how far each status got, how long they were held, how hurt they were (their bars show it)
    for (const d of S.dummies || []) {
      for (const k in d.st) if (d.st[k] > 5) g['st_' + k] = Math.max(g['st_' + k] || 0, Math.round(d.st[k] / 25));
      for (const k of ['stunT', 'rootT', 'sleepT', 'frozenT', 'koT', 'tangledT']) if (d[k] > 0.2) g[k] = Math.max(g[k] || 0, Math.round(d[k] * 2));
      const lost = Math.round(10 * (1 - d.hp / d.maxHp)); g.hurt = Math.max(g.hurt || 0, lost);
      if (d.buffs && d.buffs.length) g.buffs = Math.max(g.buffs || 0, d.buffs.length);
    }
    for (const o of w.units) if (o.team === (S.hero && S.hero.team) && o !== S.hero && !o.summon) { g.allyHp = Math.max(g.allyHp || 0, Math.round(10 * o.hp / o.maxHp)); g.allyBuffs = Math.max(g.allyBuffs || 0, o.buffs.length); }
    if (S.hero) { const h = S.hero; g.heroHp = Math.max(g.heroHp || 0, Math.round(10 * h.hp / h.maxHp)); g.heroBuffs = Math.max(g.heroBuffs || 0, h.buffs.length); if (h.invulnT > 0.2) g.inv = Math.max(g.inv || 0, Math.round(h.invulnT * 2)); }
  };
  // S.fit = { min, tail, max }: a loop that ends a beat after its move first goes off (never before min), or at max if it
  // hasn't: so a move that comes round at its own pace is in every loop shown, and the loop isn't longer than it needs
  S.fire = () => { S.fires++; if (S.firstT == null && S.fires > (S.fires0 || 0)) { S.firstT = S.t; if (S.fit) S.loop = Math.min(S.fit.max, Math.max(S.fit.min, S.t + S.fit.tail)); } };
  // a rough fingerprint of what the loop did: new things made in the world, by kind (the tier check compares tiers)
  S.sig = { fx: 0, proj: 0, units: 0, danger: 0, hazards: 0, tele: 0 };
  S.fired = () => S.fires > (S.fires0 || 0); // in this loop
  S.reset();
  return S;
}

// A hero's attack or one of its abilities on the dummies (lab.js setupShow, at the tier asked).
function heroStage(S, spec) {
  const { id, move: ab, tier } = spec, H = HEROES[id], ranged = DEFS[id].role === 'ranged';
  const A = ABILITIES[ab], sh = (A && A.show) || {};
  S.locked = ab !== 'attack' && tier < 1;
  if (S.locked) S.why = 'Unlocks at tier I';
  // long enough to see it run out: the longest time its words name at this tier ("for 8s"), plus a beat
  const H0 = HEROES[id].abilities.find((a) => a.id === ab);
  const secs = H0 ? [H0.desc, ...H0.tiers.slice(0, Math.max(1, tier))].join(' ').match(/(\d+(?:\.\d+)?)\s?s\b/g) : null;
  const longest = secs ? Math.max(...secs.map((x) => parseFloat(x))) : 0;
  S.loop = ab === 'attack' ? 3 : Math.min(9.5, Math.max(3.4, CAST_AT + longest + 1));
  let u, dummies, ally, pin, cast, last, dmg0;
  return () => {
    const w = S.w = room(HERO_W, HERO_H, S.w);
    const far = ab === 'attack' ? ranged : FAR.has(ab) || sh.far;
    u = spawn(w, id, 110, 175, { level: 9 });
    initKit(u, id, { nodes: heroNodes(id, tier) }, 9);
    for (const k in u.kit.cd) u.kit.cd[k] = 999;
    u.facing = u.mvA = 0;
    const mx = far ? (ab === 'charge' ? 270 : 340) : 110 + u.r + 28 + (ab === 'attack' ? Math.max(8, DEFS[id].range - 6) : 14);
    const spots = [[mx, 175], [mx + (far ? 30 : 22), 105], [mx + (far ? 30 : 22), 245]];
    if (ab !== 'attack' && !SINGLE.has(ab) && !sh.single) spots.push([mx + 66, 175], [mx + 70, 100], [mx + 70, 250]); // six: enough for chains and jumps to run out at the lower tiers
    dummies = spots.map(([x, y]) => dummyAt(w, x, y));
    // bodies to raise (two: tier II raises two)
    if (ab === 'raiseDead') for (const [cx, cy] of [[mx - 50, 125], [mx - 40, 235]]) w.corpses.push({ kind: 'rattler', x: cx, y: cy, r: 34, vr: 24, facing: 1, kx: 0, ky: 0, spin: 0, z: 0, vz: 0, age: 5, t: 14, max: 14 });
    ally = null;
    if (NEEDS_ALLY.has(ab) || sh.ally) {
      const ak = id === 'paladin' ? 'archer' : 'paladin';
      ally = fullAlly(w, ak, ab === 'warSong' || ab === 'sanctuary' || ab === 'consecrate' ? 155 : 190, 285);
      ally.hp = ally.maxHp * 0.35;
      if (ab === 'cure') { ally.st.poison = 70; ally.st.burn = 50; }
      if (ab === 'guard') { ally.target = dummies[0]; dummies[0].target = ally; }
    }
    if (id === 'cleric' && ab === 'attack') { ally = fullAlly(w, 'paladin', 230, 140); ally.hp = ally.maxHp * 0.5; }
    if (sh.mob === 'ally' && ally) dummies.forEach((d, i) => { const a = -0.6 + i * 0.9; d.x = d.home.x = ally.x + Math.cos(a) * 62; d.y = d.home.y = ally.y - 40 + Math.sin(a) * 50; });
    if (sh.downed && ally) { ally.downed = true; ally.hp = 0; }
    pin = { x: u.x, y: u.y }; cast = false; u.target = dummies[0]; last = u.lastAttackT; S.hits = hitWatch();
    dmg0 = null;
    S.hero = u; S.dummies = dummies;
    S.tick = (dt) => {
      if (S.locked) { u.atkT = Math.max(u.atkT, 0.5); return; }
      if (!cast && S.t >= CAST_AT && ab !== 'attack') {
        cast = true; u.target = dummies[0];
        S.mark(w); dmg0 = hpSum(w);
        if (ab === 'oldBones') { u.kit.tiers.oldBones = tier; u.kit.oldBonesUsed = false; u.invulnT = 0; u.hp = 1; hurt(w, u, 50, dummies[0], { noDodge: true }); }
        else if (A) tagAbility(w, u, ab, tier, () => A.use(w, u, dummies[0], tier));
        for (const k in u.kit.cd) u.kit.cd[k] = 999;
        pin = { x: u.x, y: u.y };
      }
      if (ab !== 'attack' && !(sh.attacks && cast)) u.atkT = Math.max(u.atkT, 0.5);
      else if (!ranged) { // melee: the brain won't swing while pinned, so the stage swings on a beat
        u.atkT = 9; const d = DEFS[id], beat = d.role === 'skirmish' ? 0.5 : 1.1, t0 = S.t - CAST_AT;
        if (t0 >= 0 && Math.floor(t0 / beat) !== Math.floor((t0 - dt) / beat || -1) && t0 < S.loop - 0.9) {
          u.facing = Math.atan2(dummies[0].y - u.y, dummies[0].x - u.x); u.target = dummies[0];
          meleeSwing(w, u, d.role === 'skirmish'); setAnim(u, d.attackAnim || 'swing', (d.windup || 0) + 0.28);
        }
      }
      if ((sh.hitme || sh.shootme) && cast && Math.floor(S.t / 0.45) !== Math.floor((S.t - dt) / 0.45)) {
        const d0 = dummies[0];
        if (sh.hitme) { d0.facing = Math.atan2(u.y - d0.y, u.x - d0.x); hurt(w, u, 4, d0, { knock: 0 }); }
        else { const a = Math.atan2(u.y - d0.y, u.x - d0.x); w.projectiles.push({ kind: 'arrow', x: d0.x + Math.cos(a) * 30, y: d0.y + Math.sin(a) * 30, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 6, team: d0.team, owner: d0, dmg: 4, o: { knock: 10 }, life: 1.2, a }); }
      }
      if (sh.mob === 'walk' && cast) for (const d of dummies) d.home.x = Math.max(u.x + 70, d.home.x - 70 * dt);
      if (sh.killDummy && cast && S.t - CAST_AT > 0.6 && !u._killed) { u._killed = true; hurt(w, dummies[1], 99999, u, { noDodge: true }); hurt(w, dummies[2], 99999, u, { noDodge: true }); }
      if (sh.hitDummy && cast && Math.floor(S.t / 0.45) !== Math.floor((S.t - dt) / 0.45)) hurt(w, dummies[0], 14, null, { noDodge: true });
      // what it called up falls before the loop ends, so what happens when they fall (an explosion at a higher tier) shows
      if (cast && !S.felled && S.t > S.loop - 0.8) { S.felled = true; for (const o of w.units) if (o !== u && o.team === u.team && !o.dead && !o.downed && o !== ally && (o.summonBy === u || o.summon)) hurt(w, o, o.hp + 9999, dummies[0], { noDodge: true }); }
    };
    S.after = (dt) => {
      // did it do anything: a cast that left something in the world or changed someone's health; an attack that landed
      if (!S.locked) {
        if (ab === 'attack') { if (S.hits(ally ? [...dummies, ally] : dummies) > 0) S.fire(); }
        else if (cast && S.t < CAST_AT + 2) { if (S.mark(w) > 0 || (dmg0 != null && Math.abs(hpSum(w) - dmg0) > 0.5)) S.fire(); }
      }
      if (u.act) pin = { x: u.x, y: u.y };
      else if (!u.downed) { u.x = pin.x; u.y = pin.y; u.vx = u.vy = 0; }
      if (u.downed) { u.downed = false; u.hp = u.maxHp; }
      for (const d of dummies) { if (!(ally && d.target === ally)) d.target = null; tendDummy(w, d, dt); }
      if (ally) { ally.atkT = 999; ally.x = ally.home.x; ally.y = ally.home.y; for (const k in ally.kit.cd) ally.kit.cd[k] = Math.max(ally.kit.cd[k], 5); }
    };
  };
}

// A hero's trait: a short spar where most traits get their moment. The hero fights three dummies that hit back and
// shoot at it; one dummy falls (kills, deaths near it); a friend goes down (friends falling, reviving); the hero is
// knocked low (low-health traits) and at the end takes a blow that would bring it down (traits that refuse to fall).
// What a trait needs to show (keyed by trait id; a trait not here gets the plain spar). Each sets the dummies (or the
// friend) up the way the trait's words ask: rooted, cursed, soaked, nearly dead, an elite, facing away...
const TRAIT_SCENE = {
  conductor: { dummy: (d) => { d.st.wet = Math.max(d.st.wet, 60); } },
  dirtyFighting: { dummy: (d) => { d.rootT = 9; d.st.stagger = Math.max(d.st.stagger, 50); } },
  trappersEye: { dummy: (d) => { d.rootT = 9; } },
  crone: { dummy: (d) => { d.st.curse = Math.max(d.st.curse, 50); } },
  finisher: { start: (d) => { d.hp = d.maxHp * 0.45; } },
  grim: { start: (d) => { d.hp = d.maxHp * 0.2; } },
  armourPiercing: { start: (d) => { d.elite = true; } },
  assassin: { start: (d) => { d.facing = 0; }, dummy: (d) => { d.facing = 0; } },
  blackCandle: { close: true }, beeFriend: { close: true },
  seenItAll: { friend: (w, a) => { a.st.stagger = 90; } }, watchful: { friend: (w, a) => { stun(w, a, 2); } },
  thickHide: { hitSt: { burn: 16, chill: 16 } },
  lightFingers: { start: (d) => { d.def = { ...d.def, coins: [2, 3] }; }, kill: true },
  deflect: { shooter: 0 },
  birdsEye: { always: true },
  handy: { abilities: true }, demolition: { abilities: true }, // they show through its abilities (tier I and up)
};
// A hero's trait: a short spar where it gets its moment. The hero swings or shoots at three dummies that hit and shoot
// back; then, by what the trait listens for (its hooks), a dummy falls (kill / death), a friend goes down (allyDown,
// revives), or the hero takes a blow that would bring it down (downed).
function traitStage(S, spec) {
  const { id, tier } = spec, ranged = DEFS[id].role === 'ranged';
  S.loop = 5.2;
  let u, dummies, ally, pin, did;
  return () => {
    const w = S.w = room(HERO_W, HERO_H, S.w);
    u = spawn(w, id, 110, 175, { level: 9 });
    initKit(u, id, { nodes: heroNodes(id, tier) }, 9);
    const T = u.kit.trait || {}, tid = HEROES[id].trait.id, sc = TRAIT_SCENE[tid] || {};
    if (sc.always || Object.values(T).some((v) => v && typeof v !== 'function')) S.fire(); // a standing property (immune, knockImmune, shockMul, reviveRate): always on
    u.kit.trait = watchHooks(T, w, S.mark, () => S.fire());
    for (const k in u.kit.cd) u.kit.cd[k] = sc.abilities ? 0.6 + Object.keys(u.kit.cd).indexOf(k) * 1.2 : 999;
    u.facing = u.mvA = 0;
    const mx = ranged ? 300 : 110 + u.r + 28 + Math.max(8, DEFS[id].range - 6);
    const spots = ranged ? [[mx, 175], [sc.close ? 190 : mx + 26, sc.close ? 110 : 105], [mx + 26, 245]] : [[mx, 175], [mx + 26, 105], [mx + 26, 245]];
    dummies = spots.map(([x, y]) => dummyAt(w, x, y));
    ally = fullAlly(w, id === 'paladin' ? 'archer' : 'paladin', 175, 290);
    for (const d of dummies) { d.target = ally; if (sc.start) sc.start(d); }
    pin = { x: u.x, y: u.y }; u.target = dummies[0]; did = {};
    S.hero = u; S.dummies = dummies;
    const wants = (...ks) => ks.some((k) => T[k]);
    S.tick = (dt) => {
      const w2 = S.w, beat = (p) => Math.floor(S.t / p) !== Math.floor((S.t - dt) / p);
      if (!sc.abilities) for (const k in u.kit.cd) u.kit.cd[k] = 999;
      if (sc.dummy) for (const d of dummies) sc.dummy(d);
      if (!ranged) {
        u.atkT = 9; const d = DEFS[id], b = d.role === 'skirmish' ? 0.5 : 0.9;
        if (S.t > 0.3 && beat(b) && S.t < S.loop - 0.6 && !u.downed) { const t = dummies.find((o) => w2.units.includes(o)) || dummies[0]; u.facing = Math.atan2(t.y - u.y, t.x - u.x); u.target = t; meleeSwing(w2, u, d.role === 'skirmish'); setAnim(u, d.attackAnim || 'swing', (d.windup || 0) + 0.28); }
      }
      if (S.t > 0.5 && beat(0.7) && !u.downed) { const d0 = dummies[0]; d0.facing = Math.atan2(u.y - d0.y, u.x - d0.x); hurt(w2, u, u.maxHp * 0.04, d0, { knock: 0, ...(sc.hitSt || {}) }); }
      if (S.t > 0.8 && beat(1.3)) { const d1 = dummies[sc.shooter ?? 2], a = Math.atan2(u.y - d1.y, u.x - d1.x); w2.projectiles.push({ kind: 'arrow', x: d1.x + Math.cos(a) * 30, y: d1.y + Math.sin(a) * 30, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 6, team: d1.team, owner: d1, dmg: 4, o: { knock: 10 }, life: 1.2, a }); }
      if (sc.friend && !did.friend && S.t > 1) { did.friend = true; sc.friend(w2, ally); }
      if ((sc.kill || wants('kill', 'death')) && !did.kill && S.t > 1.5) { did.kill = true; dummies[1].gone = true; hurt(w2, dummies[1], 99999, u, { noDodge: true }); }
      if (wants('allyDown', 'reviveRate', 'reviveHp') && !did.ally && S.t > 1.8) { did.ally = true; hurt(w2, ally, ally.hp + 99999, dummies[0], { noDodge: true }); }
      if (!did.low && S.t > 2.6) { did.low = true; u.hp = Math.min(u.hp, u.maxHp * 0.3); }
      if (wants('downed') && !did.down && S.t > 3.6) { did.down = true; u.invulnT = 0; hurt(w2, u, u.hp + 99999, dummies[0], { noDodge: true }); }
    };
    S.after = (dt) => {
      if (u.act) pin = { x: u.x, y: u.y }; else if (!u.downed) { u.x = pin.x; u.y = pin.y; u.vx = u.vy = 0; u.spd = 0; }
      for (const d of dummies) { if (sc.start && d.hp >= d.maxHp - 0.01 && d.hp > d.maxHp * 0.5) sc.start(d); tendDummy(S.w, d, dt, true); }
      if (!ally.downed) { ally.atkT = 999; ally.x = ally.home.x; ally.y = ally.home.y; }
    };
  };
}

const dies0 = (k, move) => { const d = DEFS[k]; return !d.boss && !!(d.onDeath || d.splits || (eliteOf(k) && eliteOf(k).death)); };
// An enemy at a rank against hero-coloured dummies. attack: its plain blows or shots only (no brain, no ability, no
// elite move); kit: all it does at normal, with its first uses brought forward, and if it does something when it dies
// it is struck down near the end so that shows too; elite / major: everything it does at that rank.
function foeStage(S, spec) {
  const { id: k, move, rank } = spec, d0 = DEFS[k], boss = !!d0.boss;
  const r = canRank(k) ? (move === 'elite' ? Math.max(1, rank) : move === 'major' ? 2 : rank) : 0;
  const big = boss || (d0.r || 30) > 46;
  S.size = big ? [900, 620] : [560, 380];
  S.loop = move === 'attack' ? 4 : boss ? 10 : 6.5;
  if (move === 'elite' || move === 'major') S.fit = { min: 4.5, tail: dies0(k, move) ? 3.6 : 2.6, max: 14 };
  const dies = move !== 'attack' && !boss && (d0.onDeath || d0.splits || ((move === 'elite' || move === 'major') && eliteOf(k) && eliteOf(k).death));
  let u, dummies, killT, friend;
  return () => {
    const [W, H] = S.size, w = S.w = room(W, H, S.w);
    w.mult = 1; w.bossAdds = ['goblin'];
    if (boss && d0.arena && BOSS_ARENAS[d0.arena]) { try { BOSS_ARENAS[d0.arena](w); buildGrid(w); } catch (e) { /* the hall is optional here */ } }
    const ux = W * (move === 'attack' ? 0.68 : 0.8), uy = H / 2;
    u = battleFoe(w, k, ux, uy, 1, r);
    u.aggro = true; u.facing = Math.PI; u.dueSoon = 0.4; u.abilT = 1; // its moves come round soon, but not before you've seen it stand there if (boss) u.floorFoe = true;
    if (move === 'attack') { u.def = { ...u.def, brain: null, ability: null, dashCd: 0 }; u.eliteFn = null; u.eliteDeath = null; }
    const watch = (fn, owns) => (fn ? function (...a) { S.mark(w); const hp0 = stateSum(w); const out = fn.apply(this, a); if (S.mark(w) > 0 || Math.abs(stateSum(w) - hp0) > 0.5 || (owns && out === true)) S.fire(); return out; } : fn); // owns: an elite move that takes the tick (returns true) is under way
    // what counts as its move going off: the kit's brain for 'kit'; the elite's own move for 'elite' (or its brain, when the
    // elite move lives there: the entry's tick does nothing and the brain reads u.elite); the major's moves for 'major'
    const E0 = eliteOf(k), noop = !E0 || !E0.tick || /^\s*tick\s*\(\s*\)\s*\{\s*return false;?\s*\}\s*$/.test(String(E0.tick));
    if (u.def.brain && (move === 'kit' || (move === 'elite' && noop))) u.def = { ...u.def, brain: watch(u.def.brain) };
    // while an elite or major is held for its move (below), its own brain waits too, unless that is where the move lives
    else if (u.def.brain && (move === 'major' || (move === 'elite' && !noop))) { const b0 = u.def.brain; u.def = { ...u.def, brain: function (...a) { return held() ? true : b0.apply(this, a); } }; }
    if (move === 'elite' || move === 'major') { u.eliteFn = watch(u.eliteFn, true); u.eliteDeath = watch(u.eliteDeath); }
    const gap = (u.r || 30) + 30 + (move === 'attack' || move === 'kit' ? 0 : 200); // the elite's and major's moves often want room (throws, charges): their dummies start further off
    const spots = big ? [[ux - gap - 60, uy], [ux - 260, uy - 170], [ux - 300, uy + 170], [ux - 470, uy]] : move === 'attack' ? [[ux - gap - 20, uy], [ux - 150, uy - 110], [ux - 170, uy + 110], [ux - 300, uy]] : [[ux - gap - 20, uy], [ux - 250, uy - 115], [ux - 275, uy + 115], [ux - 385, uy]];
    dummies = spots.map(([x, y]) => dummyAt(w, x, y, 'hero'));
    u.target = dummies[0];
    // a friend of its own side, hurt, for the kinds that mend, guard or quicken others (no blows of their own) and for
    // the elite and major moves (war cries, raising the fallen)
    friend = null;
    const fk = !boss && (!(d0.dmg > 0) || move === 'elite' || move === 'major') ? friendFor(k) : null;
    if (fk) { friend = spawn(w, fk, ux - 40, uy + (big ? 160 : 110), { mult: 1 }); friend.aggro = true; friend.facing = Math.PI; friend.home = { x: friend.x, y: friend.y }; friend.hp = friend.maxHp * 0.5; }
    if (move !== 'attack' && fk && d0.res !== undefined && /rais/i.test(ELITE_MOVE[k] || '')) w.corpses.push({ kind: fk, x: ux - 90, y: uy - 60, r: 30, vr: 22, facing: 1, kx: 0, ky: 0, spin: 0, z: 0, vz: 0, age: 5, t: 14, max: 14 });
    killT = dies && !S.fit ? S.loop - 1.8 : Infinity; // (an elite or major falls a beat after its move: below)
    const lastA = { t: u.lastAttackT, abil: u.abilT }, hold = { x: u.x, y: u.y }; S.hits = hitWatch();
    function held() { return (move === 'elite' || move === 'major') && !S.fired() && S.t < 2; }
    S.hero = u; S.dummies = dummies;
    S.tick = () => {
      // a kit's spar: the close dummy falls part way through, so what it does at reach (throws, charges, spits) shows too
      if (move === 'kit' && !boss && !dummies[0].gone && S.t > S.loop * 0.45) fell(w, dummies[0]);
      if (dies && S.fit && (S.firstT != null ? S.t >= S.firstT + 1.4 : move === 'elite' && !(eliteOf(k) || {}).tick && S.t > 2.2)) killT = 0; // a move that is its death (falls apart and gets up) is shown by felling it
      if (S.t >= killT && !u._bookKilled && !u.dead) { u._bookKilled = true; S.mark(w); u.invulnT = 0; hurt(w, u, u.hp + 1e6, dummies[0], { noDodge: true }); }
    };
    S.after = (dt) => {
      if (u.lastAttackT !== lastA.t) { lastA.t = u.lastAttackT; if (move === 'attack') S.fire(); }
      if (move === 'kit' && u.abilT > lastA.abil + 0.5) S.fire(); // its ability went off (sim.js resets the timer)
      if (move === 'kit') { const n = w.hazards.length + w.danger.length + w.fx.length; if (n > (lastA.n || 0)) S.fire(); lastA.n = n; } // puddles, zones, effects: not from a plain blow
      if ((move === 'elite' || move === 'major') && !lastA.hurt && S.t > 2.2) { lastA.hurt = true; u.hp = Math.max(1, u.maxHp * 0.45); } // moves that wait for it to be hurt
      lastA.abil = u.abilT;
      if (u._bookKilled && u.dead && S.mark(w) > 0) S.fire();
      const hit = S.hits(dummies) > 0;
      if (hit && (move === 'attack' || move === 'kit')) S.fire(); // its blows landed (for a kit, its brain may be its attack)
      for (const d of dummies) tendDummy(w, d, dt);
      if (friend && !friend.dead) { friend.x = friend.home.x; friend.y = friend.home.y; friend.atkT = Math.max(friend.atkT, 0.5); if (friend.hp > friend.maxHp * 0.7) friend.hp = friend.maxHp * 0.45; }
      // the nearest dummy pokes back now and then (moves that answer a blow: counters, crashes)
      // the nearest dummy swings at it now and then (moves that answer a blow: parries, counters, crashes). It turns,
      // winds up (a swing a sidestepper can see coming) and lands a feather of a blow.
      if (move !== 'attack' && !u.dead && Math.floor(S.t / 1.1) !== Math.floor((S.t - dt) / 1.1) && S.t > 0.6) { const d = dummies.reduce((b, o) => (Math.hypot(o.x - u.x, o.y - u.y) < Math.hypot(b.x - u.x, b.y - u.y) ? o : b)); if (Math.hypot(d.x - u.x, d.y - u.y) < u.r + d.r + 90) { d.facing = Math.atan2(u.y - d.y, u.x - d.x); setAnim(d, 'swing', 0.3); d._poke = S.t + 0.18; } }
      for (const d of dummies) if (d._poke && S.t >= d._poke) { d._poke = 0; if (!u.dead && Math.hypot(d.x - u.x, d.y - u.y) < u.r + d.r + 110) hurt(w, u, 1, d, { knock: 0 }); }
      // an elite or major is held where it stands (it can still act) until its move has gone off, so moves that want
      // room (throws, charges, leaps) get it before it has walked up to the dummies; never longer than 3 s
      if (held() && !u.dead && !u.act) { u.x = hold.x; u.y = hold.y; u.vx = u.vy = 0; }
      // nothing yet by 2.4 s: the nearest dummy steps up close, for the moves that want a target at arm's length
      if ((move === 'elite' || move === 'major') && !S.fired() && S.t > 2.4 && !lastA.stepped) { lastA.stepped = true; const d = dummies[0]; d.home = { x: u.x - Math.cos(u.facing) * 0 - (u.r + d.r + 26), y: u.y }; d._free = 0; }
      if (move === 'kit' && d0.pass && Math.hypot(u.x - hold.x, u.y - hold.y) > 150) S.fire(); // a roller: rolling and bouncing is what it does
      // keep it on the stage and the stage going: hurt by its own moves or a reflected shot, it heals up
      if (!u.dead && u.hp < u.maxHp * 0.2) u.hp = u.maxHp * 0.6;
      if (!u.dead) { u.x = Math.min(W - 40, Math.max(40, u.x)); u.y = Math.min(H - 40, Math.max(40, u.y)); }
    };
  };
}

// A status on a fighter (a goblin, of the monsters' side) sparring with a blue dummy, a friend beside it: the status
// builds up in pulses to its burst, or the state it comes from is built, or the state is put on directly.
const SUBJECT = ['goblin', 'orc', 'bandit'];
function statusStage(S, spec) {
  const id = spec.id, how = statusHow(id), src = FROM_BURST[id] || id;
  S.loop = 6; S.size = [360, 250]; // a small yard: the one fighter is what matters, so it is drawn bigger
  if (!how) { S.locked = true; S.why = 'No preview for this one yet'; }
  let s, dummy, friend, done;
  return () => {
    const [W, H] = S.size, w = S.w = room(W, H, S.w);
    const kind = SUBJECT.find((k) => DEFS[k]) || 'rat';
    s = spawn(w, kind, 205, 115, { mult: 1 }); s.aggro = true; s.facing = Math.PI;
    friend = spawn(w, kind, 262, 190, { mult: 1 }); friend.aggro = false; friend.facing = Math.PI; friend.home = { x: friend.x, y: friend.y };
    dummy = dummyAt(w, 205 - s.r - 46, 115, 'hero');
    s.target = dummy; done = false;
    S.hero = s; S.dummies = [dummy];
    const need = STATUS[src] ? (typeof STATUS[src].need === 'function' ? STATUS[src].need(s) : STATUS[src].need) : 100;
    S.tick = (dt) => {
      if (S.locked || done) return;
      const beat = Math.floor(S.t / 0.28) !== Math.floor((S.t - dt) / 0.28);
      if (how === 'put') { if (S.t > 0.6) { PUT_ON[id](w, s, { friend, dummy }); done = true; } return; }
      if (S.t > 0.4 && beat) addStatus(w, s, src, need / 7, dummy);
      if (s.bursts && s.bursts[src] != null) done = true;
    };
    S.after = (dt) => {
      if ((s.bursts && s.bursts[src] != null) || (how === 'put' && done)) S.fire();
      for (const o of [s, friend]) { if (!o.dead && o.hp < o.maxHp * 0.3) o.hp = o.maxHp; }
      if (!friend.dead) { friend.x = friend.home.x; friend.y = friend.home.y; friend.atkT = 999; }
      if (!s.dead) { s.x = Math.min(290, Math.max(150, s.x)); s.y = Math.min(200, Math.max(60, s.y)); }
      tendDummy(w, dummy, dt, true);
    };
  };
}

// The situation that makes each trinket fire (unknown ones get the plain fight: blows both ways).
const SCENE = {
  phoenixFeather: 'down', wraithVeil: 'down', howlingSkull: 'down', lastBreath: 'down', timeSand: 'low',
  boneCharm: 'kill', soulJar: 'kill', frostBloom: 'kill', widowLocket: 'friendDown', galeFeather: 'crowd',
  kindlingFlask: 'burnFoe', salamanderScale: 'fire', snakeCharm: 'poison', splitShard: 'ranged', hookChain: 'hook',
  cinderBoots: 'walk', swiftBoots: 'walk', vampTooth: 'hurt', impLantern: 'crowd',
  heal: 'drink',
};
export const sceneOf = (spec) => SCENE[spec.id] || 'fight';
function trinketStage(S, spec) {
  const scene = sceneOf(spec), potion = spec.t === 'potion';
  const kind = scene === 'ranged' || scene === 'hook' ? 'archer' : 'paladin';
  S.loop = 5;
  let u, dummies, ally, pin, did;
  return () => {
    const w = S.w = room(HERO_W, HERO_H, S.w);
    const list = potion ? (spec.id === 'heal' ? [] : [elixirKey(spec.id)]) : [spec.id];
    u = spawn(w, kind, 140, 175, { level: 9, trinkets: list.slice(), potions: potion && spec.id === 'heal' ? 1 : 0 });
    initKit(u, kind, { nodes: freeNodes(kind) }, 9);
    for (const k in u.kit.cd) u.kit.cd[k] = 999;
    if ((u.trinketHooks || []).some((h) => h.immune || h.knockImmune)) S.fire(); // always on
    u.trinketHooks = (u.trinketHooks || []).map((h) => watchHooks(h, w, S.mark, () => S.fire()));
    u.facing = u.mvA = 0;
    const near = 140 + u.r + 28 + Math.max(8, DEFS[kind].range - 6); // in reach of the wearer's weapon
    let spots = [[near, 175], [near + 20, 110], [near + 20, 240]];
    if (scene === 'crowd') spots = [[near, 175], [140, 175 - 70], [140, 175 + 70], [140 - 66, 175], [near - 20, 120]];
    if (scene === 'ranged') spots = [[300, 175], [360, 175], [420, 175]];
    if (scene === 'hook') spots = [[400, 120], [400, 240]];
    if (scene === 'drink') spots = [[430, 80], [430, 270]];
    dummies = spots.map(([x, y]) => { const d = dummyAt(w, x, y); d.aggro = true; return d; });
    ally = null;
    if (scene === 'friendDown' || scene === 'hook') { ally = fullAlly(w, 'archer', 220, 285); if (scene === 'hook') { dummies[1].target = ally; } }
    if (scene === 'fire') { w.hazards.push({ type: 'fire', x: 140, y: 175, r: 46, t: 99, max: 99 }); u.hp = u.maxHp * 0.6; }
    if (scene === 'hurt') u.hp = u.maxHp * 0.5;
    if (scene === 'drink') u.hp = u.maxHp * 0.3;
    if (scene === 'burnFoe') for (const d of dummies) d.st.burn = 60;
    pin = { x: u.x, y: u.y }; u.target = dummies[0]; did = {};
    S.hero = u; S.dummies = dummies;
    S.tick = (dt) => {
      const beat = (p) => Math.floor(S.t / p) !== Math.floor((S.t - dt) / p);
      for (const k in u.kit.cd) u.kit.cd[k] = 999;
      if (kind !== 'archer' && scene !== 'drink') { // the paladin swings on a beat
        u.atkT = 9;
        if (S.t > 0.3 && beat(0.8) && !u.downed) { const t = dummies.find((o) => w.units.includes(o)) || dummies[0]; u.facing = Math.atan2(t.y - u.y, t.x - u.x); u.target = t; meleeSwing(w, u, false); setAnim(u, DEFS[kind].attackAnim || 'swing', (DEFS[kind].windup || 0) + 0.28); }
      }
      if (scene === 'drink') u.atkT = 9;
      if (scene !== 'drink' && scene !== 'ranged' && scene !== 'hook' && S.t > 0.5 && beat(0.6) && !u.downed && !u.ethereal) {
        const d0 = dummies[0]; hurt(w, u, u.maxHp * 0.03, d0, { knock: 0, poison: scene === 'poison' ? 34 : 0 });
        if (scene === 'crowd') hurt(w, u, u.maxHp * 0.01, dummies[1], { knock: 0 });
      }
      if (scene === 'burnFoe' && beat(1)) for (const d of dummies) d.st.burn = Math.max(d.st.burn, 60);
      if (scene === 'kill' && beat(1.2) && S.t > 0.6) { const d = dummies[1 + (Math.floor(S.t / 1.2) % 2)]; if (d && w.units.includes(d)) { d.gone = true; hurt(w, d, 99999, u, { noDodge: true }); setTimeout0(d); } }
      if (scene === 'down' && !did.down && S.t > 1.6) { did.down = true; u.invulnT = 0; hurt(w, u, u.hp + 99999, dummies[0], { noDodge: true }); }
      if (scene === 'low' && !did.low && S.t > 1.6) { did.low = true; u.hp = u.maxHp * 0.36; hurt(w, u, u.maxHp * 0.08, dummies[0], { noDodge: true }); }
      if (scene === 'friendDown' && !did.fd && S.t > 1.4) { did.fd = true; hurt(w, ally, ally.hp + 999, dummies[0], { noDodge: true }); }
      if (scene === 'walk') pin = { x: 140 + Math.sin(S.t * 1.6) * 70, y: 175 + Math.sin(S.t * 3.2) * 30 };
    };
    // a felled dummy stands again a moment later
    function setTimeout0(d) { d._back = S.t + 0.7; }
    S.after = (dt) => {
      if (scene === 'walk' && !u.act) { const dx = pin.x - u.x, dy = pin.y - u.y; u.mvA = Math.atan2(dy, dx); u.spd = 120; u.x += dx * Math.min(1, dt * 6); u.y += dy * Math.min(1, dt * 6); }
      else if (u.act) pin = { x: u.x, y: u.y };
      else if (!u.downed && !u.ethereal && scene !== 'drink') { u.x = pin.x; u.y = pin.y; u.vx = u.vy = 0; }
      if (scene === 'drink') { u.x = pin.x; u.y = pin.y; }
      if (potion && spec.id === 'heal' && u.potions === 0) S.fire();
      for (const d of dummies) { if (d._back != null && S.t >= d._back) { d._back = null; d.gone = false; } tendDummy(w, d, dt, true); }
      if (ally && !ally.downed) { ally.atkT = 999; ally.x = ally.home.x; ally.y = ally.home.y; }
    };
  };
}

// ---------------------------------------------------------------- the Book's monster groups
// Every enemy kind under the first dungeon it turns up in (battle.js's rule, so the Book and the battle page agree),
// bosses last; kinds that live in no dungeon's roster (called help, totems, summons of bosses) under "Elsewhere".
import { battleRoster } from './battle.js';
const partOfSomething = (k, d) => d.segTaken != null || d.linkKind || d.part || /(Segment|Tail|Plate|Coil|Image)$/.test(k);
let groupsCache = null;
// a plain fighter from the kind's own dungeon (a construct for a construct), to stand beside it
function friendFor(k) {
  if (!groupsCache) groupsCache = foeGroups();
  const g = groupsCache.find((x) => x.kinds.includes(k)), d = DEFS[k];
  const pool = (g ? g.kinds : []).filter((o) => o !== k && DEFS[o] && DEFS[o].dmg > 0 && !DEFS[o].boss && !DEFS[o].part && (DEFS[o].atkCd || 0) < 99);
  const mid = (o) => DEFS[o].r >= 26 && DEFS[o].r <= 44; // big enough to see beside it, not a giant
  return pool.find((o) => mid(o) && !!DEFS[o].construct === !!d.construct) || pool.find(mid) || pool[0] || 'goblin';
}
export function foeGroups() {
  const R = battleRoster({ cheat: true, heroes: {} }), seen = new Set(), groups = [];
  for (const d of R.dungeons) { const kinds = [...d.kinds, ...d.bosses].filter((k) => !seen.has(k) && DEFS[k]); kinds.forEach((k) => seen.add(k)); if (kinds.length) groups.push({ id: d.id, name: d.name, kinds }); }
  const rest = Object.keys(DEFS).filter((k) => { const d = DEFS[k]; return d.team === 'enemy' && !d.dummy && !seen.has(k) && !(d.cost >= 99) && !(d.noElite && !d.boss) && k !== 'boss' && k !== 'skeleton' && !k.startsWith('lab-') && !partOfSomething(k, d); });
  if (rest.length) groups.push({ id: 'elsewhere', name: 'Elsewhere', kinds: rest });
  return groups;
}
