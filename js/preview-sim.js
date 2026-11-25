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
import { makeWorld, spawn, step, setAnim, hurt, meleeSwing, addStatus, stun, addBuff, unitNumbers, wallRect } from './sim.js';
import { sceneOf as abilitySceneOf, attackSceneOf, KINDS, FOE_HP, FOE_DMG, HERO_FLOOR, FRIEND_FLOOR, foeSceneOf, FOE_HERO_DMG, FOE_HERO_FLOOR, statusSceneOf, STATUS_SCENE } from './preview-scenes.js';
import { newStats } from './stats.js';
import { ABILITIES, initKit, cooldownOf } from './kits.js';
import { tagAbility } from './fxtag.js';
import { DEFS } from './units.js';
import { HEROES, tierBuild, freeNodes } from './heroes.js';
import { buildGrid } from './path.js';
import { battleFoe } from './dungeon.js';
import { ELITES } from './elites.js';
import { STATUS, HERO_STATUS } from './statuses.js';
import { whirl, spin, dirty, targeted, tracked, trapped, ward, weaken, k2 } from './kits2.js'; // (round 15, lane E: the newer heroes' eight)
import { STATUSES } from './bestiary.js';
import { TRINKETS } from './trinkets.js';
import { POTIONS, elixirKey } from './potions.js';
import { BOSS_ARENAS } from './bosses.js';
import { variantUrl } from './recolor.js';
import { getSeed, setSeed } from './util.js';
import { ELITE_MOVE } from './movetext.js';

// ---------------------------------------------------------------- the dummies
// A straw target that never moves, never strikes back on its own and never dies (it is topped up when low). Two:
// red (the monsters' side, as in the showcase) and blue, hero-coloured (what an enemy's moves are shown on).
const DUMMY = { name: 'Dummy', art: 'art/lab/dummy.svg', headR: 50, r: 28, vr: 22, turn: 0, accel: 0, face: 0, mass: 2.4, hp: 400, speed: 0,
  role: 'melee', range: 50, atkCd: 999, dmg: 0, arc: 1, temp: 0, commit: 0, xp: 0, coins: [0, 0], noElite: true, dummy: true, noCorpse: true };
DEFS.bookDummy = { ...DUMMY, team: 'enemy' };
DEFS.bookDummyBlue = { ...DUMMY, team: 'hero', art: variantUrl(DUMMY.art, { hue: 0, sat: 1, light: 0, accent: { from: 5, range: 22, hue: 212, sat: 1, light: 0.06 } }) };
// Round 14: a target can hold a weapon (art/lab/dummy-<weapon>.svg: the weapon is its own part, so it swings), for the
// scenes where something has to strike the hero or a status has to be broken by a blow.
const BLUE = { hue: 0, sat: 1, light: 0, accent: { from: 5, range: 22, hue: 212, sat: 1, light: 0.06 } };
export const WEAPONS = ['sword', 'bow', 'spear', 'hammer'];
for (const wp of WEAPONS) {
  const art = `art/lab/dummy-${wp}.svg`, attackAnim = wp === 'spear' || wp === 'bow' ? 'thrust' : 'swing';
  DEFS['bookDummy_' + wp] = { ...DUMMY, team: 'enemy', art, attackAnim };
  DEFS['bookDummyBlue_' + wp] = { ...DUMMY, team: 'hero', art: variantUrl(art, BLUE), attackAnim };
}
export const isDummy = (k) => !!(DEFS[k] && DEFS[k].dummy);

// ---------------------------------------------------------------- the stages' yards
export const HERO_W = 470, HERO_H = 350, TRAIT_W = 380, TRAIT_H = 270;
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
function dummyAt(w, x, y, side = 'enemy', weapon = null) {
  const d = spawn(w, (side === 'enemy' ? 'bookDummy' : 'bookDummyBlue') + (weapon ? '_' + weapon : ''), x, y);
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
  if (!w.units.includes(d) && !d.gone) { d.dead = false; d.dying = false; d.hp = d.maxHp; w.units.push(d); } // (round 18: dying cleared too, or sim.js kill never takes it again)
}
// a dummy knocked flat and taken away for the rest of the loop (either side: a hero-side one would only be downed)
function fell(w, d) {
  d.gone = true; d.dead = true; d.hp = 0; const i = w.units.indexOf(d); if (i >= 0) w.units.splice(i, 1);
  for (const o of w.units) if (o.target === d) o.target = null;
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; w.particles.push({ x: d.x, y: d.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 0.45, max: 0.45, size: 5, color: '#E6C979' }); }
}
// a friend at tier I of each of its abilities (held: the stage never lets it use one), so what asks whether a friend
// would use an ability now (Encore, Old Tales, the Supply Crate) has an answer
const fullAlly = (w, kind, x, y) => {
  const a = spawn(w, kind, x, y, { level: 9 }); initKit(a, kind, { nodes: { ...freeNodes(kind), ...Object.fromEntries(HEROES[kind].abilities.map((ab) => [ab.id + '1', 1])) } }, 1); for (const k in a.kit.cd) a.kit.cd[k] = 9;
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
function watchHooks(obj, w, mark, onFire, test) {
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
        || ((k === 'moveSpeed' || k === 'atkSpeed' || k === 'shockMul') && typeof r === 'number' && r !== 1)
        || (test && test(k, args))) onFire(k, args);
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
export const MAJOR_KEY = (d) => d.majorMove || (d.role === 'ranged' ? 'volley' : d.role === 'skirmish' ? 'charge' : 'quake'); // (round 13, lane E: def.majorMove, a kind's own)
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
const FROM_BURST = { frozen: 'chill', sick: 'poison', radiant: 'radiance', hexed: 'curse', ko: 'stagger', charmed: 'charm', addled: 'confuse', terrified: 'fear', shackled: 'shackle' }; // (round 13, lane S: tangled is rooted now; the new bursts; round 15: Shackled)
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
  // round 15 (lane E): the newer heroes' timers, put on by the function each hero puts it on with, at its tier I numbers
  dirty: (w, s) => { dirty(w, s); },                            // the Digger's coat: 10 s, or till a blow lands
  targeted: (w, s) => { targeted(w, s, 6); },                   // the Marksman's Aimed Shot
  tracked: (w, s, o) => { tracked(w, s, 6, 2, o.dummy); },        // the Falconer's falcon (2 more a blow from the dummy's side)
  trapped: (w, s) => { const d = trapped(w, s, 2); const f = k2(w, { draw: 'trap', x: s.x, y: s.y, max: d }); f.snapT = f.t; f.held = s; }, // the Trapper's jaw trap, shut on it (his trap's own look, kits2.js jawTrap)
  warded: (w, s) => { ward(w, s, 30, 6); },                     // the Alchemist's Elixir
  weakened: (w, s) => { weaken(w, s, 4); },                     // the Shade's Blackout (held a while)
};
// round 15 (lane E): Whirled and Spun build up and burst like the rest, through the function that puts each on
const KIT_BUILD = { whirled: (w, s, amt, by) => whirl(w, s, amt, by), spun: (w, s, amt) => spin(w, s, amt) };
export const statusIds = () => [...new Set([...Object.keys(STATUSES), ...Object.keys(STATUS)])];
export const statusHow = (id) => (STATUS[id] || KIT_BUILD[id] ? 'build' : FROM_BURST[id] && STATUS[FROM_BURST[id]] ? 'burst' : PUT_ON[id] || STATUS_SCENE[id] || id === 'silenced' ? 'put' : null); // (round 18b: Silenced, a choir sprite stunned quiet)
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
// Round 14 (the designer: "I don't like the text pop ups", "No text pop up. You should be able to see the effect"):
// nothing is written on a stage. The words a round 13 stage raised off a unit are gone (what a tier adds is in the
// caption under the stage), and so are the game's own floating words and hit numbers (FREEZE, SCORCH, 14...): every
// unit on a stage that matters carries a health bar instead, so what a blow did is seen there. One switch:
const STAGE_TEXT = false;
export function makeStage(spec) {
  const make = { hero: spec.move === 'trait' ? traitStage : heroStage, foe: foeStage, status: statusStage, trinket: trinketStage, potion: trinketStage }[spec.t];
  if (!make) throw new Error('no stage for ' + spec.t);
  const S = { spec, loop: 3, t: 0, w: null, fires: 0, locked: false, why: '', tick: () => {}, size: [HERO_W, HERO_H] };
  const build = make(S, spec);
  S.loops = 0; S.loopsFired = 0;
  S.reset = () => { if (S.w) { S.loops++; if (S.fires > S.fires0) S.loopsFired++; } S.fires0 = S.fires; S.t = 0; S.firstT = null; S.felled = false; S.crutch = false; S.own = false; if (S.fit) S.loop = S.fit.max; S.mark = marker(); build(); S.mark(S.w); };
  S.step = (dt) => {
    if (S.t >= S.loop) S.reset();
    S.t += dt; S.tick(dt); step(S.w, dt); if (S.after) S.after(dt);
    if (!STAGE_TEXT && S.w.texts.length) S.w.texts.length = 0;
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

// A hero's attack or one of its abilities, in a small real fight set up for it (round 18, lane preview18; the scenes and
// the rules they follow are in js/preview-scenes.js). Round 13 to 17 played it on straw targets that stood still and
// never struck back; the stage cast the ability at 0.45 s whatever was going on, and the blows "parries" and "dodges"
// were shown against came from targets with no weapon.
//   S.scene    the scene's name; S.casts / S.castT / S.byBrain: how often it went off this loop, when it first did,
//              and whether the hero's own brain chose it (the check tool reads them); S.forced: the stage cast it
const FRIEND_KINDS = ['paladin', 'tower', 'archer', 'dame'];
// an enemy that may not fall (the scene isn't about killing it): kept up at a quarter of its health
const KEEP_UP = { keepUp: true, downed(w, u) { u.hp = Math.max(1, u.maxHp * 0.25); u.invulnT = Math.max(u.invulnT, 0.25); return true; } };
// the hero doesn't fall in a preview: a blow that would bring it down leaves it on its last scrap of health instead
// (after its own ways of not falling have had their say: Old Bones, Spare Second and the like come first, sim.js hooksOf)
const HERO_KEEP = { keepUp: true, downed(w, u) { u.hp = Math.max(1, u.hp); return true; } };
const tierNodes = (ab, tier) => { const o = {}; for (let i = 1; i <= tier; i++) o[ab + i] = 1; return o; };
function heroStage(S, spec) {
  const { id, move: ab, tier } = spec, attack = ab === 'attack', A = ABILITIES[ab];
  // Round 14 ("Should still preview when locked"): an ability the tier hasn't unlocked still plays, as it is at tier I;
  // S.asLocked tells the page to mark it locked.
  S.asLocked = !attack && tier < 1;
  const useTier = attack ? tier : Math.max(1, tier);
  const sc = attack ? attackSceneOf(id) : abilitySceneOf(ab, A);
  S.scene = sc.name;
  const passive = !!(A && A.passiveTier) || ab === 'oldBones'; // (Old Bones works through kits.js OLD_BONES: its cast does nothing)
  // long enough to see it run out: the longest time its words name at this tier ("for 8s"), plus a beat
  const H0 = attack ? null : HEROES[id].abilities.find((a) => a.id === ab);
  const secs = H0 ? [H0.desc, ...H0.tiers.slice(0, useTier)].join(' ').match(/(\d+(?:\.\d+)?)\s?s\b/g) : null;
  const longest = sc.secs ?? Math.min(8, secs ? Math.max(...secs.map((x) => parseFloat(x))) : 0);
  const readyAt = sc.readyAt ?? 0.3, forceAt = sc.forceAt ?? 2.4;
  if (attack) S.loop = 4;
  else S.fit = { min: 3.6, tail: longest + 1.5, max: Math.max(forceAt, sc.lethal || 0) + longest + 2.2 };
  let u, foes, friends, waiting, strikes, cast, baseMove, did, cd0;
  return () => {
    const w = S.w = room(HERO_W, HERO_H, S.w);
    const [hx, hy] = sc.hero || [100, 175];
    u = spawn(w, id, hx, hy, { level: 9 });
    initKit(u, id, { nodes: attack ? heroNodes(id, tier) : { ...freeNodes(id), ...tierNodes(ab, useTier) } }, 9);
    for (const k in u.kit.cd) u.kit.cd[k] = 999;
    u.facing = u.mvA = 0; u.home = { x: hx, y: hy };
    baseMove = u.moveMul; u.moveMul = 1e-4; // it holds its ground until the ability has gone (sim.js reads 0 as 1)
    if (sc.hp) u.hp = u.maxHp * sc.hp;
    if (sc.heroSt) for (const k in sc.heroSt) u.st[k] = sc.heroSt[k];
    if (sc.hp || sc.heroSt) u.barAlways = true;
    u.trinketHooks = [...(u.trinketHooks || []), HERO_KEEP];
    // an ability that only works through a hook (Substitution, Befuddle, Frenzy) shows when the hook acts
    if (u.kit.extra) u.kit.extra = u.kit.extra.map((h) => watchHooks(h, w, S.mark, () => went(false)));
    // the friends: real heroes, their abilities held, each where the scene puts it
    const fk = FRIEND_KINDS.filter((k) => k !== id && DEFS[k]);
    friends = (sc.friends || []).map((f, i) => {
      const o = fullAlly(w, f.k || fk[i % fk.length], f.at[0], f.at[1]);
      o.hp = o.maxHp * (f.hp ?? 0.6); o.barAlways = true; o.moveMul = 1e-4; o.spec = f; o.facing = 0;
      if (f.st) for (const k in f.st) o.st[k] = f.st[k];
      if (f.stun) stun(w, o, f.stun);
      return o;
    });
    // the enemies: real kinds with their own brains, tougher and softer-hitting than in a run
    foes = []; waiting = [];
    const kindOf = (k) => (sc.foeKind && ['melee', 'fast', 'heavy'].includes(k) ? KINDS[sc.foeKind] : KINDS[k] || k);
    const addFoe = (f) => {
      const e = spawn(w, kindOf(f.k), f.at[0], f.at[1], { mult: 1, hpMul: FOE_HP });
      e.aggro = true; e.dmgMul *= FOE_DMG; e.barAlways = true; e.spec = f; e.home = { x: f.at[0], y: f.at[1] };
      e.facing = Math.atan2(hy - e.y, hx - e.x);
      if (f.hp) e.hp = e.maxHp * f.hp;
      if (f.hold || sc.holdFoes) { e.baseMove = e.moveMul; e.moveMul = 1e-4; } // held where it stands (a line to go through) until the ability has gone
      if (!f.mortal) e.trinketHooks = [...(e.trinketHooks || []), KEEP_UP];
      if (sc.charmed && foes.length < 3) { e.st.charm = 70; e.stBy = { ...(e.stBy || {}), charm: u }; }
      foes.push(e); return e;
    };
    for (const f of sc.foes) if (f.delay) waiting.push(f); else addFoe(f);
    for (const [cx, cy] of sc.corpses || []) w.corpses.push({ kind: 'rattler', x: cx, y: cy, r: 34, vr: 24, facing: 1, kx: 0, ky: 0, spin: 0, z: 0, vz: 0, age: 5, t: 14, max: 14 });
    if (sc.wall) wallRect(w, sc.wall, 99, 'stone');
    for (const [ox, oy, or] of sc.oil || []) w.hazards.push({ type: 'oil', x: ox, y: oy, r: or, t: 99, max: 99 });
    w.stats = newStats([id, ...new Set(friends.map((o) => o.kind))]); // counted, never shown: the check tool reads what the ability did
    strikes = []; did = {}; cast = attack; cd0 = 999; S.casts = 0; S.followAt = null; S.castT = null; S.byBrain = false; S.forced = false;
    S.hits = hitWatch(); S.hero = u; S.dummies = foes; S.friends = friends;
    // a blow the scene needs (a friend struck down, the blow Old Bones shrugs off): the enemy turns, winds up and swings
    const strike = (e, v, dmg) => {
      if (!e || !v) return;
      const wind = Math.max(0.25, (e.def.windup || 0.3));
      e.facing = Math.atan2(v.y - e.y, v.x - e.x); setAnim(e, e.def.attackAnim || 'swing', wind + 0.28); e.atkT = Math.max(e.atkT, wind + 0.6);
      strikes.push({ at: S.t + wind, e, v, dmg });
    };
    const onWho = (f) => (f.on === 'hero' ? u : typeof f.on === 'number' ? friends[f.on] : null);
    const attackerOf = (v) => foes.find((e) => onWho(e.spec) === v && !e.dead) || foes.slice().sort((a, b) => Math.hypot(a.x - v.x, a.y - v.y) - Math.hypot(b.x - v.x, b.y - v.y))[0];
    function bestTarget() {
      let best = null, bs = -1; const keep = u.target;
      for (const e of foes) { if (e.dead) continue; u.target = e; let sc0 = 0; try { sc0 = Math.max(A.score ? A.score(w, u, e, useTier) : 0, A.reflex ? A.reflex(w, u, e, useTier) : 0); } catch (err) { sc0 = 0; } const d = Math.hypot(e.x - u.x, e.y - u.y); if (sc0 - d / 1e4 > bs) { bs = sc0 - d / 1e4; best = e; } }
      u.target = keep; return best || friends.find((o) => !o.dead) || u; // (a crate, a song: whoever is there)
    }
    function forceCast() {
      const t = bestTarget(); if (!t) return;
      u.target = t; u.kit.cd[ab] = cooldownOf(u, H0); u.kit.using = ab;
      try { tagAbility(w, u, ab, useTier, () => A.use(w, u, t, useTier)); } finally { u.kit.using = null; }
      S.forced = true; went(false); cd0 = u.kit.cd[ab]; if (u.kit.cd[ab] < 1.5) S.followAt = S.t + u.kit.cd[ab] + 1;
    }
    function went(byBrain) {
      if (!cast) for (const e of foes) if (e.baseMove != null) { e.holdT = S.t + (sc.holdFor ?? 0.4); } // held foes walk in a beat after it goes (holdFor: after a long aim)
      cast = true;
      if (S.castT == null) S.castT = S.t;
      S.casts++; if (byBrain) S.byBrain = true;
      S.fire();
    }
    S.tick = (dt) => {
      // late arrivals walk in
      for (const f of waiting) if (!f.in && S.t >= f.delay) { f.in = true; const e = addFoe(f); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; w.particles.push({ x: e.x, y: e.y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 0.35, max: 0.35, size: 5, color: '#C9B48A' }); } }
      // each enemy held to whoever the scene set it on
      for (const e of foes) { const v = onWho(e.spec); if (v && !v.downed && !v.dead && !e.dead && !(e.tauntT > 0) && !e.flipKind) e.target = v; }
      // the blows the scene asks for
      if (sc.lethal && !did.lethal && S.t >= sc.lethal) { did.lethal = true; strike(attackerOf(u), u, u.hp + 60); }
      friends.forEach((o, i) => { const f = o.spec;
        if (f.falls && !o._fell && S.t >= f.falls) { o._fell = true; strike(attackerOf(o), o, o.hp + 999); }
        if (f.struck && !o._struck && S.t >= f.struck) { o._struck = true; strike(attackerOf(o), o, o.maxHp * 0.55); } });
      for (const s of strikes) if (!s.done && S.t >= s.at) { s.done = true; if (!s.e.dead && !s.v.dead && !s.v.downed) { if (s.v === u) u.invulnT = 0; hurt(w, s.v, s.dmg, s.e, { noDodge: true, heavy: true, knock: 160 }); } }
      // the ability comes ready a moment in; the hero's own brain picks it when the scene calls for it (sim.js kitThink /
      // kitReflex, as in a run), or the stage casts it at forceAt
      if (!attack && !cast) {
        u.kit.cd[ab] = S.t >= readyAt ? Math.min(u.kit.cd[ab], 0) : 999; if (S.t >= readyAt) cd0 = Math.min(cd0, u.kit.cd[ab]);
        if (!passive && S.t >= forceAt && !u.act && A && A.use) forceCast();
      }
      // a tier that goes again at once (a second leap, a second lunge): if the brain hasn't taken it a second after it
      // came round, the stage does, at the best target there is
      if (cast && !attack && !passive && S.followAt != null && S.t >= S.followAt && u.kit.cd[ab] <= 0 && !u.act && S.casts < 3) { S.followAt = null; forceCast(); }
      // it holds its own attack until the ability has gone, so the ability is the first thing it does
      if ((!cast && !passive) || sc.noAttack) u.atkT = Math.max(u.atkT, 0.4); // (one that works through a hook fights from the start: its hook rides on the fight)
      // what it called up falls before the loop ends, so what happens when they fall (an explosion at a higher tier) shows
      if (cast && !attack && !S.felled && S.t > S.loop - 0.8) { S.felled = true; for (const o of w.units) if (o !== u && o.team === u.team && !o.dead && !o.downed && !friends.includes(o) && !o.partOf && (o.summonBy === u || o.summon)) hurt(w, o, o.hp + 9999, foes[0], { noDodge: true }); }
    };
    S.after = (dt) => {
      // did it go: the brain spent it (sim.js fireAbility sets its cooldown), or, for the attack, a blow landed
      if (attack) { if (S.hits(foes) > 0) went(true); }
      // (its cooldown then runs as in a run: a tier that goes again at once, a second lunge or dash, does; most come
      // round again only after the loop has ended)
      else if (!passive && S.t >= readyAt && u.kit.cd[ab] > cd0 + 0.3 && u.kit.cd[ab] < 900) { went(true); if (u.kit.cd[ab] < 1.5) S.followAt = S.t + u.kit.cd[ab] + 1; }
      cd0 = u.kit.cd[ab];
      if (passive && u.kit.tiers.oldBones && u.kit.oldBonesUsed && !did.bones) { did.bones = true; went(false); }
      // once it has gone it is itself again: it moves and fights as it would
      if (cast && u.moveMul < 0.01) u.moveMul = baseMove;
      if (!cast && !u.act && !u.forcedGoal) { const k = Math.min(1, dt * 2); u.x += (u.home.x - u.x) * k; u.y += (u.home.y - u.y) * k; }
      if (u.hp < u.maxHp - 0.5) u.barAlways = true;
      // the scene isn't about the hero falling (unless it is: Old Bones's blow): held above a share of its health
      if (!u.downed) u.hp = Math.max(u.hp, did.lethal ? 1 : u.maxHp * HERO_FLOOR);
      if (u.downed) { did.downT = (did.downT || 0) + dt; if (did.downT > 1) { u.downed = false; u.hp = u.maxHp * 0.3; did.downT = 0; } }
      for (const o of friends) {
        if (o.downed || o.dead) continue;
        if (!o.spec.falls && o.hp < o.maxHp * FRIEND_FLOOR) o.hp = o.maxHp * FRIEND_FLOOR;
        for (const k in o.kit.cd) o.kit.cd[k] = Math.max(o.kit.cd[k], 5);
        if (!o.act && !o.forcedGoal) { const k = Math.min(1, dt * 3); o.x += (o.home.x - o.x) * k; o.y += (o.home.y - o.y) * k; }
      }
      // the enemies keep their health up (a slow mend once low), so the loop lasts
      for (const e of foes) if (!e.dead && !e.spec.mortal && e.hp < e.maxHp * 0.35) e.hp += e.maxHp * 0.25 * dt;
      for (const e of foes) if (e.baseMove != null && e.holdT != null && S.t >= e.holdT) { e.moveMul = e.baseMove; e.baseMove = null; }
    };
  };
}

// ---------------------------------------------------------------- a hero's trait (round 14)
// The designer: "No text pop up. You should be able to see the effect ... Only show what you have to for the scenario.
// Instead of the archer you could give the targets bows and let them use them. (Can also use a sword, spear, or hammer
// when necessary.)" So each trait has its own small scene with only what it needs:
//   - whoever strikes the hero is a target holding the weapon the scene needs, stood in front of the hero, facing it;
//   - where a trait only changes a number, the scene sets two things side by side that differ in the one way the trait
//     cares about (a burning target beside a plain one, a friend beside the hero) and everyone's health bar is shown,
//     so the difference is there to see;
//   - each time the trait acts, a gold ring pulses once round whoever it acted for. No words anywhere on the stage.
// TRAIT_SCENE[traitId]:
//   foes   the targets: [{ at, w, hits, on, dmg, hitSt, off, from, until, hp, hpX, weak, st, root, elite, away, busy,
//          aim, joinAt }]
//            at      where it stands: 'front' (where the hero's own blows reach), 'adj' (at arm's length of the hero),
//                    'back' (behind the hero), 'a' / 'b' (a pair side by side in the hero's reach), 'c', 'line' (behind
//                    the front one), 'far', or [x, y]
//            w       the weapon it holds: 'sword' | 'bow' | 'spear' | 'hammer' (none: a plain target)
//            hits    seconds between its blows (with a bow: its shots); on: 'hero' (default) | 'ally' | 'both' | 'alt'
//            dmg     each blow, as a share of the victim's health; hitSt: what its blows carry
//            hp      the share of its health it starts on (and is put back to); hpX: its health in hero-blows (6)
//            weak    falls to one blow, for good; st: statuses kept on it; root, elite, away (its back to the hero),
//            busy    it is fighting the friend, not the hero; aim: false = the hero doesn't strike it
//   hero   { hp, lowAt, downAt, idle (never strikes), quiet (no blow before), walk: [from, to], abilities, set(u) }
//   allies [{ at: 'near' | 'far' | [x, y], hp, downAt, stunAt, st }]
//   aura   the trait works on friends near the hero: the ring pulses on them, not on him
//   revive the friend is down and the hero lifts it; fires(k, args): which hook calls count; note: a caption line
const TRAIT_SCENE = {
  bulwark: { foes: [{ at: 'adj', w: 'sword', hits: 1.3, dmg: 0.12 }, { at: 'back', w: 'sword', hits: 1.3, off: 0.65, dmg: 0.12 }], hero: { idle: true } },
  unmovable: { foes: [{ at: 'adj', w: 'hammer', hits: 1.5, on: 'both', dmg: 0.05, hitSt: { knock: 420, heavy: true } }], allies: [{ at: 'beside', hp: 1 }], hero: { idle: true } },
  steadyAim: { foes: [{ at: 'far', hpX: 5 }], hero: { walk: [0.2, 2.2] }, loop: 6.4 },
  opportunist: { foes: [{ at: 'a', w: 'sword', busy: true, hits: 1.2, on: 'ally', dmg: 0.04 }, { at: 'b' }], allies: [{ at: 'by-a', hp: 1 }] },
  bloodied: { foes: [{ at: 'front', w: 'sword', hits: 0.8, dmg: 0.13, hpX: 5 }] },
  momentum: { foes: [{ at: 'front', hpX: 14 }], loop: 6.5 },
  grim: { foes: [{ at: 'a', hp: 0.21, hpX: 8 }, { at: 'b', hpX: 8 }] },
  kindling: { foes: [{ at: 'a', st: { burn: 45 } }, { at: 'b' }] },
  coldBlood: { foes: [{ at: 'far', w: 'bow', hits: 0.55, on: 'alt', dmg: 0.03, hitSt: { chill: 34 }, aim: false }], allies: [{ at: 'beside', hp: 1 }], hero: { idle: true } },
  conductor: { foes: [{ at: 'a', st: { wet: 70 } }, { at: 'b' }] },
  raiser: { revive: true, foes: [{ at: [168, 213], w: 'sword', aim: false }] }, // (round 18: whoever fells the friend is there and swings)
  rhythm: { aura: true, foes: [], allies: [{ at: 'near', hp: 1 }, { at: 'far', hp: 1 }], hero: { idle: true } },
  barkskin: { foes: [{ at: 'adj', w: 'sword', hits: 0.9, dmg: 0.1, aim: false }], hero: { idle: true, walk: [2.8, 5.2] }, loop: 5.6 },
  soulHarvest: { foes: [{ at: 'a', weak: true }, { at: 'b', weak: true }, { at: 'c', weak: true }], hero: { abilities: true } },
  immunity: { foes: [{ at: 'front', st: { poison: 75 } }, { at: 'by-front' }] },
  oldSoldier: { aura: true, foes: [{ at: 'adj', w: 'sword', hits: 1, on: 'ally', dmg: 0.1, aim: false }], allies: [{ at: 'beside', hp: 1 }], hero: { idle: true } },
  lastStand: { foes: [{ at: 'adj', w: 'sword', hits: 1.2, dmg: 0.06 }], allies: [{ at: 'near', hp: 0.5, downAt: 1.4 }], hero: { abilities: true } },
  returnThrust: { foes: [{ at: 'front', w: 'sword', hits: 0.45, dmg: 0.04, until: 2.6 }, { at: 'line' }], hero: { quiet: 2.9 } },
  snatch: { foes: [{ at: 'front', w: 'sword', hits: 1.4, dmg: 0.05, hpX: 14 }] },
  dirtIn: { foes: [{ at: 'front', w: 'sword', hits: 1.1, dmg: 0.1 }], hero: { abilities: true } },
  familiar: { foes: [{ at: 'far' }] },
  bloodRite: { foes: [{ at: 'front', w: 'sword', hits: 1.5, dmg: 0.03, hpX: 30 }], hero: { abilities: true, hp: 0.55 } },
  pollen: { foes: [{ at: 'adj', hpX: 30 }], allies: [{ at: 'near', hp: 0.4 }] },
  requisition: { foes: [{ at: 'far' }], allies: [{ at: 'near', hp: 0.7 }], hero: { set: (u) => { u.kit.reqW = null; } }, hold: (w, u) => { if (u.kit.reqW === w && u.kit.reqT > 1 && u.kit.reqT <= 3) u.kit.reqT = 1; } },
  huntingPartner: { foes: [{ at: 'far', hpX: 14 }] },
  powderKeg: { foes: [{ at: [272, 135], weak: true }, { at: [308, 110], hp: 0.2 }, { at: [308, 162], hp: 0.2 }] },
  longShot: { foes: [{ at: [200, 80] }, { at: [345, 196] }] },
  plunder: { foes: [{ at: 'a', weak: true, coins: true }, { at: 'b', weak: true, coins: true }, { at: 'c', weak: true, coins: true }] },
  duelist: { foes: [{ at: 'front', w: 'sword', hits: 1, dmg: 0.08 }, { at: 'side', w: 'spear', hits: 1, off: 0.5, dmg: 0.08, joinAt: 3.2, aim: false }], hero: { abilities: true }, loop: 6.4 },
  keenEdge: { foes: [{ at: 'front', hpX: 12 }] },
  valhalla: { revive: true, reviveAt: 2.6, foes: [{ at: [168, 213], w: 'sword', hits: 1.3, on: 'ally', dmg: 0.04, aim: false }], allies: [{ at: 'beside', hp: 0.45, downAt: 2.6 }], hero: { hp: 0.6, idle: true } },
  overclock: { foes: [{ at: 'far', hpX: 30 }], hero: { abilities: true } },
  fromTheWild: { foes: [{ at: 'front', w: 'sword', hits: 1, dmg: 0.08 }], hero: { abilities: true, cast: ['turnWolf'], downAt: 3.2 }, loop: 6 },
  grace: { foes: [{ at: 'front', hpX: 10 }] },
  skyborn: { foes: [{ at: 'far', w: 'bow', hits: 0.55, on: 'alt', dmg: 0.03, hitSt: { entangle: 36 }, aim: false }], allies: [{ at: 'beside', hp: 1 }], hero: { idle: true } },
  phalanx: { foes: [{ at: 'adj', w: 'sword', hits: 1, dmg: 0.1 }], allies: [{ at: 'beside', hp: 1 }] },
  thickHide: { foes: [{ at: 'far', w: 'bow', hits: 0.5, on: 'alt', dmg: 0.02, hitSt: { burn: 24 }, aim: false }], allies: [{ at: 'beside', hp: 1 }], hero: { idle: true } },
  ironWill: { foes: [{ at: 'front', w: 'hammer', hits: 0.9, dmg: 0.05, hitSt: { stagger: 55 }, hpX: 8 }], hero: { lowAt: 2.8 }, loop: 6.4 },
  lightFingers: { foes: [{ at: 'a', weak: true, coins: true }, { at: 'b', weak: true, coins: true }] },
  fade: { foes: [{ at: 'front', w: 'sword', hits: 1, dmg: 0.06, until: 0.9 }], hero: { quiet: 3.7 }, loop: 6 },
  hardWork: { foes: [{ at: 'a', weak: true }, { at: 'b', weak: true }, { at: 'c', weak: true }, { at: 'back', w: 'sword', hits: 1.4, dmg: 0.03, aim: false, hpX: 30 }], hero: { hp: 0.5 } },
  prospector: { foes: [{ at: 'front' }] },
  seenItAll: { aura: true, foes: [], allies: [{ at: 'near', hp: 1, st: { stagger: 85 } }, { at: 'far', hp: 1, st: { stagger: 85 } }], hero: { idle: true } },
  catalyst: { foes: [{ at: 'front', hpX: 30 }] },
  ancestral: { foes: [{ at: [300, 200], w: 'hammer', hits: 9, aim: false }], allies: [{ at: [236, 200], hp: 0.3, downAt: 1.6 }, { at: 'near', hp: 0.5 }], hero: { hp: 0.5, idle: true } },
  crone: { foes: [{ at: 'a', st: { curse: 55 } }, { at: 'b' }] },
  infernal: { foes: [{ at: 'far', w: 'bow', hits: 0.5, on: 'alt', dmg: 0.02, hitSt: { burn: 30 }, aim: false }], allies: [{ at: 'beside', hp: 1 }], hero: { idle: true } },
  blackCandle: { foes: [{ at: 'adj' }] },
  deflect: { foes: [{ at: 'far', w: 'bow', hits: 0.4, dmg: 0.07, aim: false }], hero: { idle: true } },
  thirdEye: { foes: [{ at: 'adj', w: 'sword', hits: 0.45, dmg: 0.06, aim: false }], hero: { idle: true }, loop: 7 },
  wellFed: { aura: true, foes: [], allies: [{ at: 'near', hp: 0.4 }, { at: 'far', hp: 0.4 }], hero: { idle: true }, loop: 7 },
  beeFriend: { foes: [{ at: 'adj' }] },
  wellStocked: { foes: [{ at: 'far' }], allies: [{ at: 'near', hp: 0.5 }], hero: { set: (u) => { u.kit.stockT = 1.2; } }, note: 'On the stage the two minutes are cut to a second, so the hand-over shows.' },
  armourPiercing: { foes: [{ at: 'a', elite: true }, { at: 'b' }] },
  birdsEye: { always: true, foes: [{ at: [345, 135] }] },
  demolition: { foes: [{ at: 'front' }, { at: 'line' }], hero: { abilities: true }, fires: (k, args) => k === 'dealt' && !!(args[4] && args[4].blast) },
  oldSalt: { foes: [{ at: 'a', st: { wet: 70 } }, { at: 'b' }] },
  finisher: { foes: [{ at: 'a', hp: 0.42 }, { at: 'b' }] },
  deadeye: { foes: [{ at: 'a' }, { at: 'b' }] },
  assassin: { foes: [{ at: 'a', w: 'sword', away: true }, { at: 'b', w: 'sword' }] },
  dirtyFighting: { foes: [{ at: 'a', root: true }, { at: 'b' }] },
  watchful: { aura: true, foes: [], allies: [{ at: 'near', hp: 1, stunAt: 0.7 }, { at: 'far', hp: 1, stunAt: 0.7 }], hero: { idle: true } },
  trappersEye: { foes: [{ at: 'a', root: true }, { at: 'b' }] },
  arena: { foes: [{ at: 'a' }, { at: 'b' }, { at: 'c' }] },
  pratfall: { foes: [{ at: 'adj', w: 'sword', hits: 0.42, dmg: 0.05, aim: false }], hero: { idle: true }, loop: 7 },
  bushido: { foes: [{ at: 'front', w: 'sword', hits: 1, dmg: 0.05, hpX: 14 }], hero: { lowAt: 2.6 }, loop: 6.4 },
  chooser: { revive: true, foes: [{ at: [168, 213], w: 'sword', aim: false }] },
  handy: { foes: [{ at: 'far' }], hero: { abilities: true } },
  moonblood: { foes: [{ at: 'front', w: 'sword', hits: 1.5, dmg: 0.03, hpX: 14 }], hero: { hp: 0.5 } },
  firstImpression: { foes: [{ at: 'adj', w: 'sword', hits: 1.1, dmg: 0.08, aim: false }], hero: { idle: true } },
  // round 15 (lane N): the six newer heroes
  strengthInNumbers: { foes: [{ at: 'front', hpX: 40 }], loop: 5.6 },
  spareSecond: { foes: [{ at: 'adj', w: 'sword', hits: 1, dmg: 0.1, aim: false }], hero: { idle: true, downAt: 3.4 }, loop: 6 },
  stormsEye: { foes: [{ at: [286, 110], hpX: 60 }, { at: [322, 140], hpX: 60 }, { at: [286, 170], hpX: 60 }], hero: { abilities: true }, loop: 8.5 },
  ballAndChain: { foes: [{ at: 'far', hpX: 60 }], hero: { abilities: true, cast: ['manacle'] }, loop: 6 },
  poltergeist: { foes: [{ at: [262, 135], weak: true }, { at: [320, 105], hpX: 40 }, { at: [320, 170], hpX: 40 }] },
  aftershock: { foes: [{ at: [290, 115], hpX: 60 }, { at: [316, 165], hpX: 60 }], hero: { abilities: true, cast: ['spikeChain'] }, loop: 6 },
  // round 17 (lane water17): the Water Mage stands in a puddle and is struck
  splashback: { foes: [{ at: 'adj', w: 'sword', hits: 1.1, dmg: 0.05, aim: false, hpX: 30 }], hero: { idle: true }, loop: 5.6,
    hold: (w, u) => { if (!w.hazards.some((h) => h.type === 'water')) w.hazards.push({ type: 'water', x: u.x, y: u.y, r: 46 }); } },
};
export const traitNote = (id) => {
  const t = HEROES[id] && HEROES[id].trait, sc = t && TRAIT_SCENE[t.id];
  if (!sc) return '';
  if (sc.note) return sc.note;
  if (sc.hero && sc.hero.abilities) return `It rides on the abilities, so they are on in this preview (at tier I at least).`;
  return '';
};
const ANIM = { sword: 'swing', hammer: 'swing', spear: 'thrust', bow: 'thrust' };
const EVENT_HOOKS = new Set(['death', 'kill', 'allyDown', 'downed', 'struck']);
function traitStage(S, spec) {
  const { id, tier } = spec, d0 = DEFS[id], ranged = d0.role === 'ranged';
  const tid = HEROES[id].trait.id, sc = TRAIT_SCENE[tid] || {}, H = sc.hero || {};
  S.loop = sc.loop || 5.2; S.fit = { min: S.loop, tail: 2.2, max: 9 };
  S.size = [TRAIT_W, TRAIT_H]; // a small yard, so the few figures a scene needs (and their health bars) are drawn big
  let u, foes, allies, pin, did, swingT, turn, lastShot;
  return () => {
    const w = S.w = room(TRAIT_W, TRAIT_H, S.w);
    const specs = sc.foes || [{ at: 'front' }];
    const hx = specs.some((f) => f.at === 'back') ? 160 : 100, hy = TRAIT_H / 2;
    u = spawn(w, id, hx, hy, { level: 9 });
    initKit(u, id, { nodes: heroNodes(id, H.abilities ? Math.max(1, tier) : tier) }, 9);
    u.barAlways = true;
    const T = u.kit.trait || {};
    // the gold ring: once round whoever the trait just acted for (never more than once every 0.7 s on one unit)
    const cue = (who) => { if (!who || who.dead) return; if (S.t - (who._cueT ?? -9) < 0.7) return; who._cueT = S.t; w.fx.push({ type: 'ring', x: who.x, y: who.y, r: (who.vr || who.r) + 16, color: '#FFD45A', t: 0, max: 0.42, unit: who }); };
    const acted = () => { S.fire(); if (!sc.aura) cue(u); };
    // a standing trait (immune to something, never knocked back) shows each time a blow that carries it lands on him
    const standing = !sc.revive && (sc.always || !!(T.immune || T.knockImmune)), dealing = !sc.revive && !!T.shockMul;
    // a hook that answers something happening (a death, a kill, a friend or the hero going down) counts whenever it is called
    const counts = sc.fires || ((k) => EVENT_HOOKS.has(k));
    u.kit.trait = sc.revive ? T : watchHooks(T, w, S.mark, (k, args) => { if (!sc.fires || sc.fires(k, args)) acted(); }, counts);
    for (const k in u.kit.cd) u.kit.cd[k] = 999; // with abilities on, the stage casts them itself, in turn (below)
    if (H.hp) u.hp = u.maxHp * H.hp;
    if (H.set) H.set(u);
    u.facing = u.mvA = 0;
    const gap = u.r + 28, adjX = hx + gap + 12, frontX = ranged ? 285 : hx + gap + Math.max(8, d0.range - 6);
    const SPOT = { front: [frontX, hy], adj: [adjX, hy], back: [hx - gap - 12, hy], far: [330, hy], line: [frontX + 84, hy], side: [adjX - 30, hy + 70],
      a: ranged ? [276, hy - 52] : [frontX - 8, hy - 44], b: ranged ? [276, hy + 52] : [frontX - 8, hy + 44], c: ranged ? [334, hy] : [frontX + 34, hy], 'by-front': [frontX + 56, hy - 18] };
    const hit0 = Math.max(6, unitNumbers(u).hit);
    foes = [];
    const addFoe = (p) => {
      const [x, y] = Array.isArray(p.at) ? p.at : SPOT[p.at] || SPOT.front;
      const d = dummyAt(w, x, y, 'enemy', p.w);
      d.maxHp = d.hp = p.weak ? Math.max(1, hit0 * 0.5) : Math.round(hit0 * (p.hpX || 6));
      if (p.hp) d.hp = d.maxHp * p.hp;
      if (p.weak) d.gone = true; // falls for good to the hero's blow (never topped up)
      if (p.coins) d.def = { ...d.def, coins: [2, 3] };
      if (p.elite) d.elite = true;
      d.facing = p.away ? Math.atan2(y - hy, x - hx) : Math.atan2(hy - y, hx - x);
      d.barAlways = true;
      const f = { d, p, t: (p.hits || 0) * 0.5 + (p.off || 0), land: 0, n: 0 }; foes.push(f); return f;
    };
    for (const p of specs) if (!p.joinAt) addFoe(p);
    const A0 = sc.allies || (sc.revive ? [{ at: 'beside', hp: 0.6, downAt: 1.1 }] : []);
    const ASPOT = { near: [hx + 6, hy + 84], beside: [hx, hy + 78], far: [340, 46], 'by-a': [SPOT.a[0] + 66, SPOT.a[1] - 24] };
    allies = A0.map((a, i) => {
      const [x, y] = Array.isArray(a.at) ? a.at : ASPOT[a.at] || ASPOT.near;
      const o = fullAlly(w, id === 'paladin' ? (i ? 'tower' : 'archer') : i ? 'archer' : 'paladin', x, y);
      o.hp = o.maxHp * (a.hp ?? 0.6); o.barAlways = true; o.spec = a;
      if (a.st) for (const k in a.st) o.st[k] = a.st[k];
      return o;
    });
    for (const f of foes) if (f.p.busy && allies[0]) { f.d.target = allies[0]; f.d.facing = Math.atan2(allies[0].y - f.d.y, allies[0].x - f.d.x); }
    pin = { x: u.x, y: u.y }; did = {}; swingT = 0.5; turn = 0; lastShot = u.lastAttackT; S.hits = hitWatch(); S.hits2 = hitWatch();
    const aims = () => foes.filter((f) => f.p.aim !== false && w.units.includes(f.d));
    u.target = (aims()[0] || {}).d || null;
    S.hero = u; S.dummies = foes.map((f) => f.d);
    const armed = () => foes.find((f) => f.p.w && w.units.includes(f.d)) || null;
    // a blow meant to leave him low lands in full: what armour and blocks took off it comes through in the same moment
    const lowBlow = (v, d, to) => { for (let k = 0; to && k < 6 && !v.downed && v.hp > v.maxHp * to; k++) hurt(w, v, (v.hp - v.maxHp * (to - 0.03)) * 0.6, d, { noDodge: true, heavy: true, knock: 0 }); };
    const swingAt = (d, v) => { d.facing = Math.atan2(v.y - d.y, v.x - d.x); setAnim(d, ANIM[d.def.art.includes('hammer') ? 'hammer' : 'sword'] || 'swing', 0.3); };
    const strike = (f, v) => { // a target's blow, or its shot
      const d = f.d, p = f.p, a = Math.atan2(v.y - d.y, v.x - d.x), dmg = v.maxHp * (p.dmg ?? 0.08);
      d.facing = a; setAnim(d, ANIM[p.w] || 'swing', 0.3);
      if (p.w === 'bow') w.projectiles.push({ kind: 'arrow', x: d.x + Math.cos(a) * 30, y: d.y + Math.sin(a) * 30, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440, r: 6, team: d.team, owner: d, dmg, o: { knock: 10, ...(p.hitSt || {}) }, life: 1.4, a });
      else f.lands = (f.lands || []).concat([{ at: S.t + 0.16, v, dmg }]);
    };
    S.tick = (dt) => {
      const every = (p) => Math.floor(S.t / p) !== Math.floor((S.t - dt) / p);
      for (const k in u.kit.cd) u.kit.cd[k] = 999;
      // its abilities, cast in turn (the first at 0.6 s, then one every 1.3 s), each once a loop
      if (H.abilities && !u.downed && !u.act) HEROES[id].abilities.forEach((ab, i) => {
        if (did['ab' + i] || S.t < 0.6 + i * 1.3 || (H.cast && !H.cast.includes(ab.id))) return;
        did['ab' + i] = true; const A = ABILITIES[ab.id], tr = Math.max(1, tier), t = (aims()[0] || foes[0] || {}).d || null;
        if (A && t) { u.target = t; tagAbility(w, u, ab.id, tr, () => A.use(w, u, t, tr)); }
      });
      if (sc.hold) sc.hold(w, u);
      for (const p of specs) if (p.joinAt && S.t >= p.joinAt && !foes.some((f) => f.p === p)) { const f = addFoe(p); S.dummies.push(f.d); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; w.particles.push({ x: f.d.x, y: f.d.y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 0.4, max: 0.4, size: 5, color: '#E6C979' }); } }
      // the targets: what is kept on them, and their blows
      for (const f of foes) {
        const d = f.d, p = f.p; if (!w.units.includes(d)) continue;
        if (p.st) for (const k in p.st) d.st[k] = Math.max(d.st[k] || 0, p.st[k]);
        if (p.root) d.rootT = 9;
        if (p.hits && !did.free && S.t >= (p.from ?? 0.5) && S.t <= (p.until ?? 99) && !u.downed) {
          f.t -= dt;
          if (f.t <= 0) {
            f.t += p.hits; f.n++;
            const friend = allies.find((o) => !o.downed && !o.dead);
            const who = p.on === 'ally' ? [friend] : p.on === 'both' ? [u, friend] : p.on === 'alt' ? [f.n % 2 ? u : friend] : [u];
            for (const v of who) if (v) strike(f, v);
          }
        }
        if (f.lands) { for (const l of f.lands) if (S.t >= l.at && !l.done) { l.done = true; if (!l.v.downed && !l.v.dead) { hurt(w, l.v, l.dmg, d, { knock: 0, ...(p.hitSt || {}), ...(l.heavy ? { noDodge: true, heavy: true } : {}) }); lowBlow(l.v, d, l.to); } } f.lands = f.lands.filter((l) => !l.done); }
      }
      if (standing && sc.always && every(1)) acted();
      // the hero's own blows: a melee hero is pinned, so the stage swings for it, at the pace its attack speed gives
      const list = aims();
      if (H.idle || (H.quiet && S.t < H.quiet) || did.free || !list.length) { u.atkT = Math.max(u.atkT, 0.4); if (ranged) u.target = null; }
      else if (ranged) {
        if (u.lastAttackT !== lastShot) { lastShot = u.lastAttackT; turn++; }
        u.target = list[turn % list.length].d;
      } else {
        u.atkT = 9;
        const rate = unitNumbers(u).aps * (d0.atkCd || 1), beat = d0.role === 'skirmish' ? 0.5 : 0.9;
        swingT -= dt * Math.max(0.3, rate);
        if (swingT <= 0 && S.t < S.loop - 0.5 && !u.downed && !u.act) {
          swingT += beat; const t = list[turn++ % list.length].d;
          u.facing = Math.atan2(t.y - u.y, t.x - u.x); u.target = t; meleeSwing(w, u, d0.role === 'skirmish'); setAnim(u, d0.attackAnim || 'swing', (d0.windup || 0) + 0.28);
        }
      }
      // what happens to the hero and its friends
      // (round 18: what brings him low, or down, is a blow from the target in front of him, seen: it winds up and lands)
      if (H.lowAt && !did.low && S.t > H.lowAt) { did.low = true; const f = armed(); if (f) { swingAt(f.d, u); f.lands = (f.lands || []).concat([{ at: S.t + 0.16, v: u, dmg: Math.max(1, (u.hp - u.maxHp * 0.22) * 0.6), heavy: true, to: 0.24 }]); } }
      if (H.downAt && !did.down && S.t > H.downAt) { did.down = true; u.invulnT = 0; const f = armed(); if (f) swingAt(f.d, u); hurt(w, u, u.hp + 99999, f ? f.d : null, { noDodge: true }); }
      for (const o of allies) {
        const a = o.spec;
        if (a.downAt && !o._fell && S.t > a.downAt) { o._fell = true; const by = armed(); if (by) swingAt(by.d, o); hurt(w, o, o.hp + 99999, by ? by.d : null, { noDodge: true }); }
        if (a.stunAt && !o._stun && S.t > a.stunAt) { o._stun = true; stun(w, o, 3); }
      }
      // a trait that works on friends near the hero: the ring goes round each friend it reaches
      if (sc.aura && every(0.9) && S.t > 0.4) { const near = allies.filter((o) => !o.downed && Math.hypot(o.x - u.x, o.y - u.y) < 150); if (near.length) { S.fire(); near.forEach(cue); } }
      // a reviver is let go: it walks to the friend and lifts it, by the run's rule (dungeon.js revive: stand over
      // them for 3 s at the helper's reviveRate; up at its reviveHp)
      const down = allies.find((o) => o.downed);
      if (sc.revive && down && !did.free && S.t > (sc.reviveAt || 1.1) + 0.3) { did.free = true; for (const f of foes) if (w.units.includes(f.d)) fell(w, f.d); }
      if (sc.revive && did.free && down && !u.downed) {
        const dd = Math.hypot(down.x - u.x, down.y - u.y);
        if (dd > down.r + u.r + 16) { const a = Math.atan2(down.y - u.y, down.x - u.x); u.x += Math.cos(a) * 110 * dt; u.y += Math.sin(a) * 110 * dt; u.facing = u.mvA = a; u.spd = 110; }
        else {
          u.spd = 0; down.reviveT = (down.reviveT || 0) + dt * (T.reviveRate || 1);
          if (Math.random() < dt * 14) w.particles.push({ x: down.x + (Math.random() - 0.5) * 36, y: down.y + (Math.random() - 0.5) * 36, vx: 0, vy: 0, rise: 40, up: 0, life: 0.6, max: 0.6, size: 4, color: '#FFE7A0' });
          if (down.reviveT >= 3) { down.downed = false; down.reviveT = 0; down.hp = down.maxHp * (T.reviveHp || 0.1); down.invulnT = 1.2; w.fx.push({ type: 'ring', x: down.x, y: down.y, r: 50, color: '#FFE7A0', t: 0, max: 0.5 }); did.up = true; S.fire(); cue(down); }
        }
      }
      if (H.walk && S.t > H.walk[0] && S.t < H.walk[1]) { pin = { x: hx, y: hy + Math.sin((S.t - H.walk[0]) * 3.2) * 40 }; u.spd = 60; u.mvA = Math.cos((S.t - H.walk[0]) * 3.2) > 0 ? Math.PI / 2 : -Math.PI / 2; did.walking = true; }
      else if (did.walking) { did.walking = false; pin = { x: u.x, y: u.y }; u.spd = 0; }
    };
    S.after = (dt) => {
      if (did.walking) { u.x += (pin.x - u.x) * Math.min(1, dt * 8); u.y += (pin.y - u.y) * Math.min(1, dt * 8); u.vx = u.vy = 0; u.spd = 60; }
      else if (!did.free) { if (u.act) pin = { x: u.x, y: u.y }; else if (!u.downed) { u.x = pin.x; u.y = pin.y; u.vx = u.vy = 0; u.spd = 0; } }
      if (!H.downAt && !u.downed && u.hp < u.maxHp * 0.08) u.hp = u.maxHp * 0.08; // the scene isn't about him falling
      for (const f of foes) {
        const d = f.d, p = f.p;
        if (d.gone) continue;
        tendDummy(S.w, d, dt, true);
        if (p.hp && d.hp >= d.maxHp - 0.01) d.hp = d.maxHp * p.hp;
        if (p.away) d.facing = Math.atan2(d.y - hy, d.x - hx); else if (!p.hits && !p.busy) d.facing = Math.atan2(u.y - d.y, u.x - d.x);
      }
      if (standing && S.hits([u]) > 0) acted();                 // a blow or a shot that carries it just landed on him
      if (dealing && S.hits2(foes.map((f) => f.d)) > 0) acted(); // his own blow just landed
      for (const o of allies) if (!o.downed && !o.dead) { o.atkT = 999; const k = Math.hypot(o.kx, o.ky) > 20 ? 0 : Math.min(1, dt * 5); o.x += (o.home.x - o.x) * k; o.y += (o.home.y - o.y) * k; if (!did.up) o.facing = 0; }
    };
  };
}

// An enemy at a rank, with the same trinkets every loop: battleFoe picks an elite's or major's trinkets with the dice,
// so the dice are set by the kind and rank for that one call (and put back after).
const seedOf = (k, r) => { let h = 2166136261; for (const c of k + ':' + r) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
// Round 14 ("Make sure you don't show trinkets on elites or majors"): what the dice handed it is taken off again, so the
// stage shows the kind's own moves at that rank and nothing a trinket adds.
function seededFoe(w, k, x, y, r) { const keep = getSeed(); setSeed(seedOf(k, r)); try { const u = battleFoe(w, k, x, y, 1, r); u.trinkets = []; u.trinketHooks = []; u.carried = null; return u; } finally { setSeed(keep); } }
const dies0 = (k, move) => { const d = DEFS[k]; return !d.boss && !!(d.onDeath || d.splits || (eliteOf(k) && eliteOf(k).death)); };
/// An enemy at a rank, shown against real heroes (round 18b, lane preview18b; the scenes are js/preview-scenes.js
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
    const own = () => { S.own = true; S.fire(); }; // (its own move, not a plain blow: the check tool reads S.own)
    const watch = (fn, owns) => (fn ? function (...a) { S.mark(w); const hp0 = stateSum(w); const out = fn.apply(this, a); if (S.mark(w) > 0 || Math.abs(stateSum(w) - hp0) > 0.5 || (owns && out === true)) own(); return out; } : fn); // owns: an elite move that takes the tick (returns true) is under way
    // what counts as its move going off: the kit's brain for 'kit'; the elite's own move for 'elite' (or its brain, when the
    // elite move lives there: the entry's tick does nothing and the brain reads u.elite); the major's moves for 'major'
    const E0 = eliteOf(k), noop = !E0 || !E0.tick || /^\s*tick\s*\(\s*\)\s*\{\s*return false;?\s*\}\s*$/.test(String(E0.tick));
    if (u.def.brain && (move === 'kit' || (move === 'elite' && noop))) u.def = { ...u.def, brain: watch(u.def.brain) };
    // while an elite or major is held for its move (below), its own brain waits too, unless that is where the move lives
    else if (u.def.brain && (move === 'major' || (move === 'elite' && !noop))) { const b0 = u.def.brain; u.def = { ...u.def, brain: function (...a) { return held() ? true : b0.apply(this, a); } }; }
    if (move === 'elite' || move === 'major') { u.eliteFn = watch(u.eliteFn, true); u.eliteDeath = watch(u.eliteDeath); }
    if (sc.hp) u.hp = u.maxHp * sc.hp; // (a move that waits for it to be hurt: it starts hurt, the heroes on it)
    if (sc.prep) sc.prep(u);
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
    function held() { return (move === 'elite' || move === 'major') && !sc.free && !S.fired() && S.t < 2; }
    u.target = heroes[sc.aim || 0] || heroes[0]; // (who it goes for first: the scene's first hero, unless it names another)
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
      if (dies && S.fit && !lastA.fell && (S.firstT != null ? S.t >= S.firstT + 1.4 : move === 'elite' && !(eliteOf(k) || {}).tick && S.t > 1.2)) { lastA.fell = true; fellIt(); } // a move that is its death (falls apart and gets up) is shown by felling it
      if (S.t >= killT && !lastA.fell) { lastA.fell = true; fellIt(); }
      for (const s of strikes) if (!s.done && S.t >= s.at) { s.done = true; if (!u.dead && !u._bookKilled) { u._bookKilled = true; S.mark(w); u.invulnT = 0; hurt(w, u, u.hp + 1e6, s.by, { noDodge: true, heavy: true }); } }
      for (const o of heroes) {
        if (o.baseMove != null && S.t >= o.spec.hold) { o.moveMul = o.baseMove; o.baseMove = null; }
        if (o.spec.on === 'friend' && friend && !friend.dead && !friend.downed) o.target = friend;
      }
    };
    S.after = (dt) => {
      if (u.lastAttackT !== lastA.t) { lastA.t = u.lastAttackT; if (move === 'attack') own(); }
      if (move === 'kit' && u.abilT > lastA.abil + 0.5) own(); // its ability went off (sim.js resets the timer)
      lastA.abil = u.abilT;
      if (u._bookKilled && u.dead && S.mark(w) > 0) own();
      const hit = S.hits(heroes) > 0;
      if (hit && (move === 'attack' || (move === 'kit' && !hasKit(d0)))) own(); else if (hit && move === 'kit') S.fire(); // its blows landed (for a kit, its brain may be its attack)
      if (move === 'kit' && d0.pass && Math.hypot(u.x - hold.x, u.y - hold.y) > 150) own(); // a roller: rolling and bouncing is what it does
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
  buff: (s) => s.buffs.some((b) => b.dur >= 1 && b.dur < 900 && b.id !== 'rhythm' && ((b.atkSpeed || 1) > 1 || (b.move || 1) > 1 || (b.dealt || 1) > 1)),
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
      by = sc.at ? hero(sc.by, sc.at[0], hy + sc.at[1]) : hero(sc.by, ranged ? 95 : 205, hy);
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
      if (t === s && !o.dot && !o.proc && !done && S.t > 0.2) { S.srcSeen = true; gave++; const k = need * (sc.carry || 0.38); if (KIT_BUILD[src]) KIT_BUILD[src](w2, s, k, a); else addStatus(w2, s, src, k, a); }
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
      S.stDone = done; // (the check tool reads it: the burst, or the state, came)
    };
    S.after = (dt) => {
      if ((build && gave > 0 && !done) || (done && (!trig || struck === true || !W0 || !W0.when(s)))) S.fire(); // (it is on: building, or the state it bursts into)
      if (!build && stateOn(s, id)) S.fire();
      // once it is on, the one who put it on stops: what follows is the status's own (a sleeper sleeps, ice thaws)
      if (done || A) by.atkT = Math.max(by.atkT, 0.3); // (and a timed state's ability is the first thing it does: its blows wait)
      if (trig && !trig.dead) { trig.atkT = 99; if (!trig._wound) { trig.x = trig.home.x; trig.y = trig.home.y; } }
      for (const o of [s, by, foe, trig]) if (o && !o.dead && !o.downed && o.hp < o.maxHp * 0.3) o.hp += o.maxHp * 0.3 * dt; // (kept up: they mend once low)
      if (!s.dead) { s.x = Math.min(W - 40, Math.max(40, s.x)); s.y = Math.min(H - 40, Math.max(40, s.y)); }
      if (foe && !foe.dead) { foe.x = Math.min(W - 40, Math.max(40, foe.x)); foe.y = Math.min(H - 40, Math.max(40, foe.y)); }
      if (!by.dead) { by.x = Math.min(W - 30, Math.max(30, by.x)); by.y = Math.min(H - 30, Math.max(30, by.y)); }
    };
  };
}
// Silenced (round 18b): a choir sprite, a major, sings to mend the hobgoblin it is with (a mouth move); the Cleric's
// Smite comes down on it, the blow staggers it and its song stops (sim.js silence, by the sprite's own rule: a stagger
// silences it, foes10.js choirBrain), while the ring of shots a major throws out (no mouth in it) still goes; when the
// silence ends it sings again.
function silencedStage(S) {
  S.loop = 9; S.size = [ST_W + 60, ST_H + 30];
  let s, sl, pal, hob, cast;
  return () => {
    const [W, H] = S.size, w = S.w = room(W, H, S.w);
    s = seededFoe(w, 'choirSprite', 330, 120, 2); s.aggro = true; s.facing = Math.PI; s.barAlways = true; s.trinketHooks = [KEEP_UP]; s.dueSoon = 0.5;
    s.el = s.el || {}; s.el.mring = 3.1; // (its ring of shots comes round while it is silenced)
    hob = spawn(w, 'hobgoblin', 300, 215, { mult: 1 }); hob.aggro = true; hob.hp = hob.maxHp * 0.4; hob.barAlways = true; hob.dmgMul *= 0.4; hob.trinketHooks = [KEEP_UP];
    const hero = (kind, x, y) => { const o = fullAlly(w, kind, x, y); o.barAlways = true; o.dmgMul *= 0.2; o.trinketHooks = [...(o.trinketHooks || []), HERO_KEEP]; return o; };
    pal = hero('paladin', 210, 215); sl = hero('cleric', 90, 110);
    hob.target = pal; pal.target = hob;
    w.stats = newStats(['paladin', 'cleric']);
    cast = false; S.srcSeen = false; S.stDone = false; S.hero = s; S.dummies = [sl, pal]; S.friends = [hob];
    S.tick = () => {
      for (const o of [sl, pal]) holdKit(o);
      pal.target = hob; sl.target = s;
      if (!cast && S.t >= 1.3 && !sl.act) { cast = true; sl.kit.cd.smite = 0; sl.target = s; try { tagAbility(w, sl, 'smite', 1, () => ABILITIES.smite.use(w, sl, s, 1)); } finally { sl.kit.using = null; } S.srcSeen = true; }
    };
    S.after = (dt) => {
      if (s.silencedT > 0) { S.fire(); S.stDone = true; }
      sl.atkT = Math.max(sl.atkT, 0.3); // (the cleric only smites: its bolts would stagger it again)
      for (const o of [s, hob, pal, sl]) if (!o.dead && !o.downed && o.hp < o.maxHp * 0.3) o.hp += o.maxHp * 0.3 * dt;
      if (!s.dead) { s.x = Math.min(W - 40, Math.max(170, s.x)); s.y = Math.min(H - 40, Math.max(40, s.y)); }
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
  let u, dummies, ally, pin, did, lands;
  return () => {
    const w = S.w = room(HERO_W, HERO_H, S.w);
    const list = potion ? (spec.id === 'heal' ? [] : [elixirKey(spec.id)]) : [spec.id];
    u = spawn(w, kind, 140, 175, { level: 9, trinkets: list.slice(), potions: potion && spec.id === 'heal' ? 1 : 0 });
    initKit(u, kind, { nodes: freeNodes(kind) }, 9);
    for (const k in u.kit.cd) u.kit.cd[k] = 999;
    u.barAlways = true; // the wearer's health shows: a second life, a drain, a potion are seen on the bar
    if ((u.trinketHooks || []).some((h) => h.immune || h.knockImmune)) S.fire(); // always on
    u.trinketHooks = (u.trinketHooks || []).map((h) => watchHooks(h, w, S.mark, () => S.fire()));
    u.facing = u.mvA = 0;
    const near = 140 + u.r + 28 + Math.max(8, DEFS[kind].range - 6); // in reach of the wearer's weapon
    let spots = [[near, 175], [near + 20, 110], [near + 20, 240]];
    if (scene === 'crowd') spots = [[near, 175], [140, 175 - 70], [140, 175 + 70], [140 - 66, 175], [near - 20, 120]];
    if (scene === 'ranged') spots = [[300, 175], [360, 175], [420, 175]];
    if (scene === 'hook') spots = [[400, 120], [400, 240]];
    if (scene === 'drink') spots = [[430, 80], [430, 270]];
    // (round 18: whoever strikes the wearer holds a weapon and swings it; the far pair in the potion's yard shoot)
    const wp = scene === 'drink' ? 'bow' : scene === 'ranged' || scene === 'hook' ? null : 'sword';
    dummies = spots.map(([x, y]) => { const d = dummyAt(w, x, y, 'enemy', wp); d.aggro = true; return d; });
    ally = null;
    if (scene === 'friendDown' || scene === 'hook') { ally = fullAlly(w, 'archer', 220, 285); ally.barAlways = true; if (scene === 'hook') { dummies[1].target = ally; } }
    if (scene === 'fire') { w.hazards.push({ type: 'fire', x: 140, y: 175, r: 46, t: 99, max: 99 }); u.hp = u.maxHp * 0.6; }
    if (scene === 'hurt') u.hp = u.maxHp * 0.5;
    if (scene === 'drink') u.hp = u.maxHp * 0.45; // (shot lower from across the yard, below)
    if (scene === 'burnFoe') for (const d of dummies) d.st.burn = 60;
    pin = { x: u.x, y: u.y }; u.target = dummies[0]; did = {}; lands = [];
    // a target's blow: it turns, swings, and the blow lands a moment later
    const swing = (d, v, dmg, o, to) => { if (!d || !w.units.includes(d)) return; d.facing = Math.atan2(v.y - d.y, v.x - d.x); setAnim(d, 'swing', 0.3); lands.push({ at: S.t + 0.16, d, v, dmg, o, to }); };
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
        swing(dummies[0], u, u.maxHp * 0.03, { knock: 0, poison: scene === 'poison' ? 34 : 0 });
        if (scene === 'crowd') swing(dummies[1], u, u.maxHp * 0.01, { knock: 0 });
      }
      // the potion: the wearer is shot low from across the yard, then drinks once out of reach
      if (scene === 'drink' && S.t > 0.2 && beat(0.45) && u.hp > u.maxHp * 0.36 && !u.downed) { const d = dummies[Math.floor(S.t / 0.5) % 2], a = Math.atan2(u.y - d.y, u.x - d.x); d.facing = a; setAnim(d, 'thrust', 0.3); w.projectiles.push({ kind: 'arrow', x: d.x + Math.cos(a) * 30, y: d.y + Math.sin(a) * 30, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 6, team: d.team, owner: d, dmg: u.maxHp * 0.12, o: { knock: 10 }, life: 1.4, a }); }
      for (const l of lands) if (!l.done && S.t >= l.at) { l.done = true; if (!l.v.downed && !l.v.dead && w.units.includes(l.d)) { hurt(w, l.v, l.dmg, l.d, l.o); for (let k = 0; l.to && k < 6 && !l.v.downed && l.v.hp > l.v.maxHp * l.to; k++) hurt(w, l.v, l.v.hp - l.v.maxHp * (l.to - 0.03), l.d, { noDodge: true, heavy: true, knock: 0 }); } }
      if (scene === 'burnFoe' && beat(1)) for (const d of dummies) d.st.burn = Math.max(d.st.burn, 60);
      if (scene === 'kill' && beat(0.6) && S.t > 0.6) { const d = dummies[1 + (Math.floor(S.t / 0.6) % 2)]; if (d && w.units.includes(d)) { d.gone = true; hurt(w, d, 99999, u, { noDodge: true }); setTimeout0(d); } }
      if (scene === 'down' && !did.down && S.t > 1.6) { did.down = true; u.invulnT = 0; swing(dummies[0], u, u.hp + 99999, { noDodge: true }); }
      if (scene === 'low' && !did.low && S.t > 2.3) { did.low = true; swing(dummies[0], u, Math.max(1, u.hp - u.maxHp * 0.28), { noDodge: true, heavy: true }, 0.3); }
      if (scene === 'friendDown' && !did.fd && S.t > 1.4) { did.fd = true; swing(dummies[0], ally, ally.hp + 999, { noDodge: true }); }
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
  const pool = (g ? g.kinds : []).filter((o) => o !== k && DEFS[o] && DEFS[o].dmg > 0 && !DEFS[o].boss && !DEFS[o].part && !DEFS[o].chain && (DEFS[o].atkCd || 0) < 99);
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
