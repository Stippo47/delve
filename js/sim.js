// The combat simulation: AI (weighted move modes + context steering), physics, combat, statuses, hazards.
import { TAU, clamp, dist, dist2, angleTo, wrapAngle, angleDiff, rand, rrange, rint, chance, softmaxPick } from './util.js';
import { DEFS, FEEL, levelHp, levelDmg } from './units.js';
import { lineClear, pathClear, rayToRoundRect, circleRect, findPath, buildGrid } from './path.js';
import { kitThink, kitTick, hooksOf, segDist, heroAttack, kitReady, kitFireRandom, kitSetBack } from './kits.js';
import { trinketHooks } from './trinkets.js';
import { cue } from './sfx.js';
import { ARMOUR_CAP, ENEMY_ARMOUR, armourCut } from './armour.js';
import { STATUS, BUILD_IDS, needOf, fillOf, freshStatuses, RADIANCE, CURSE, ENTANGLE, POISON, CHARM, CONFUSE, SLEEPY, BLEED, FEAR, SHACKLE, cdRate, setBackDue, windMul } from './statuses.js';
import { MOB, bindBody, bodiesOf, mobMid, mobSlot, mobLead } from './mob.js'; // round 15 (the Mob): four bodies, one hero
import { tallyHurt, tallyHeal, tallyDown, noteStatus, tallyBlock, AUDIT } from './stats.js';

let NEXT_ID = 1;
let arcing = false; // an overload's arcs are landing (addStatus)
const DIRS = 16;
const DIR_X = [], DIR_Y = [];
for (let i = 0; i < DIRS; i++) { DIR_X.push(Math.cos(i / DIRS * TAU)); DIR_Y.push(Math.sin(i / DIRS * TAU)); }

export function makeWorld(W, H) {
  return {
    W, H, time: 0, units: [], projectiles: [], particles: [], texts: [], hazards: [], pickups: [], pillars: [], walls: [], grid: null,
    telegraphs: [], cleared: false, doorIn: { x: 0, y: H / 2 }, doorOut: { x: W, y: H / 2 },
    on: {}, shake: 0, hitstop: 0, corpses: [],
    fx: [], // visual effects the renderer draws (see docs/BUILD-v1.md: ring, zone, beam, wall, wave)
    danger: [], // telegraphed hits on the ground that the other side steers out of (see 'danger zones' below)
  };
}

// What the sprite is doing, for the renderer: u.anim = { kind, t, dur }. kind: 'swing' | 'thrust' | 'draw' | 'cast'
// | 'throw' | 'ability'. The renderer moves the sprite's arm parts from it (see docs/BUILD-v1.md).
export function setAnim(u, kind, dur) { u.anim = { kind, t: 0, dur }; }

const emit = (w, ev, ...a) => w.on[ev] && w.on[ev](...a);

// ---------------------------------------------------------------- spawning
export function spawn(w, kind, x, y, opts = {}) {
  const d = DEFS[kind];
  // Battle mode (battle.js): whatever a unit makes mid-fight (a split, called help, a raised body) joins its maker's
  // side: w.actor is the unit acting or dying right now (set in step, kill and the delayed callbacks).
  const team = opts.team || (w.battle && w.actor ? w.actor.team : d.team);
  const hero = d.team === 'hero';
  const lvl = opts.level || 1;
  const mult = opts.mult || 1;
  const maxHp = hero ? levelHp(d.hp, lvl) : Math.round(d.hp * mult * (opts.hpMul || 1));
  const u = {
    id: NEXT_ID++, kind, def: d, team, x, y, vx: 0, vy: 0, kx: 0, ky: 0, dvx: 0, dvy: 0,
    r: d.r * (opts.scale || 1), vr: (d.vr || d.r) * (opts.scale || 1), mass: d.mass * (opts.scale || 1), maxHp, hp: opts.hp != null ? Math.min(opts.hp, maxHp) : maxHp,
    dmgMul: hero ? levelDmg(1, lvl) : (0.65 + 0.35 * mult) * (team === 'enemy' || w.battle ? FEEL.enemyDmg : 1), level: lvl,
    facing: team === 'hero' ? 0 : Math.PI, atkT: rand() * d.atkCd, abilT: (d.abilCd || 0) * rrange(0.3, 0.7),
    mode: 'wander', modeT: 0, thinkT: rand() * 0.4, abilThinkT: rand() * 0.5, target: null, targetT: 0,
    st: freshStatuses(), frozenT: 0, stunT: 0, rootT: 0, sleepT: 0, koT: 0, buffs: [], later: null, freezeImmune: 0, dotAcc: 0,
    flashT: 0, invulnT: 0, act: null, dead: false, downed: false,
    trinkets: opts.trinkets || [], trinketHooks: trinketHooks(opts.trinkets), hasKey: !!opts.hasKey,
    strafeSign: chance(0.5) ? 1 : -1, wanderA: rand() * TAU, hazardT: 0, forcedGoal: null,
    gen: opts.gen || 0, bob: rand() * TAU, lastAttackT: -9, aggro: team === 'hero' || !!w.battle, potions: opts.potions || 0, path: null, pathT: 0, pathGoal: null,
    armor: ((d.armor ?? ENEMY_ARMOUR[kind]) || 0) * (hero ? 1 : Math.sqrt(Math.max(1, mult))), // armour.js (an enemy's grows a little with its dungeon's strength)
    home: { x, y }, atkMul: 1, moveMul: 1, mvA: hero ? 0 : Math.PI, spd: 0, sdx: 0, sdy: 0, lungeT: 0, recoilT: 0, hitT: 0, hitA: 0, tauntBy: null, tauntT: 0,
  };
  if (w.battle && !opts.team) u.adopt = true; // (step: takes the side of whoever it says called it)
  if (w.battle && w.actor) u.bkey = w.actor.bkey; // (stats.js: what a unit makes counts for its row)
  w.units.push(u);
  // round 14: what a charmed (or befuddled) unit makes, calls up or splits into is charmed the same way: the same side,
  // the same end, a follower's a follower too (killNow keeps the dying one's charm in u._flipWas for its split)
  const par = !opts.team && w.actor && w.actor !== u ? w.actor : null, fl = par && (par.trueTeam ? flipOf(par) : par._flipWas);
  if (fl && (fl.kind === 'charm' || fl.kind === 'befuddle')) {
    u.team = fl.trueTeam; u.adopt = false;
    turnSide(w, u, fl.team, fl.kind, fl.by, fl.until != null ? Math.max(0.5, fl.until - w.time) : null);
    if (fl.follower) u.follower = true;
  }
  // round 15 (the Mob, mob.js): a hero that is four bodies. The other three are made beside it and bound to it: their
  // health, statuses, buffs, kit and side are its own (accessors), so the four are one hero wherever one is spawned.
  if (d.bodies && !opts.noBodies) {
    u.bodies = [];
    d.bodies.forEach((k, i) => {
      const a = Math.PI + (i - 1) * 0.9, b = spawn(w, k, x + Math.cos(a) * MOB.slot, y + Math.sin(a) * MOB.slot, { team: u.team, level: lvl });
      b.partOf = u; b.summon = true; b.summonBy = u; b.hexSeen = true; b.adopt = false; b.aggro = true;
      bindBody(b, u); u.bodies.push(b);
    });
  }
  return u;
}
const flipOf = (u) => ({ team: u.team, trueTeam: u.trueTeam, kind: u.flipKind, by: u.flipBy, until: u.flipUntil, follower: !!u.follower });
// In a battle either kind of unit can be on either side, so what a unit is (a hero, or a monster) can't be read off
// its side there. In a run it is the side, as ever.
const heroic = (w, u) => (w.battle ? u.def.team === 'hero' : u.team === 'hero');
// ---- round 13 (lane S): one way to change sides. Charm's burst, the Jester's Befuddle and a brain leech's host all go
// through turnSide / restoreSide: u.trueTeam keeps the side it really belongs to (sideOf), u.flipKind says why it
// changed ('charm' | 'befuddle' | 'leech'), u.flipUntil when it comes back by itself (statusTick). A flipped unit dies,
// drops, and counts in the stats and the dungeon's checks as what it really is (killNow restores it first).
export const sideOf = (u) => u.trueTeam || u.team;
export function turnSide(w, u, team, kind, by, dur) {
  if (mobLead(u)) u = mobLead(u); // round 15 (the Mob): the four change sides as one (their side is the lead's)
  for (const b of u.bodies || []) { b.target = null; b.act = null; b.forcedGoal = null; }
  if (!u.trueTeam) u.trueTeam = u.team;
  u.team = team; u.flipKind = kind; u.flipBy = by || null; u.flipUntil = dur != null ? w.time + dur : null;
  if (u.team === u.trueTeam) { restoreSide(w, u); return; } // (turned back to its own side: nothing is flipped)
  u.target = null; u.tauntBy = null; u.tauntT = 0; u.aggro = true; u.forcedGoal = null; u.act = u.act && u.act.type === 'drink' ? u.act : null;
  if (w) for (const o of w.units) if (o.target === u) o.target = null; // whoever was after it lets go
  for (const s of u.segs || []) if (s !== u && !s.dead) turnSide(w, s, team, kind, by, null); // (round 14: a chain's body goes over with its head; restoreSide brings it back)
}
export function restoreSide(w, u) {
  if (mobLead(u)) u = mobLead(u); // round 15 (the Mob)
  if (!u.trueTeam) return;
  for (const b of u.bodies || []) b.target = null;
  u.team = u.trueTeam; u.trueTeam = null; u.flipKind = null; u.flipBy = null; u.flipUntil = null; u.target = null; u.befuddled = null; u.follower = false;
  if (w) for (const o of w.units) if (o.target === u) o.target = null;
  for (const s of u.segs || []) if (s !== u && s.trueTeam) restoreSide(w, s);
}

const alive = (u) => !u.dead && !u.downed;
// Ethereal units (a Wraith Veil ghost) are nobody's opponent or ally: they can't be targeted, hit or helped.
const opponents = (w, u) => w.units.filter((o) => alive(o) && o.team !== u.team && !o.ethereal);
const allies = (w, u) => w.units.filter((o) => alive(o) && o.team === u.team && o !== u && !o.ethereal && !o.def.rig && !mobLead(o)); // (round 15, the Mob: its other bodies are not more friends: the lead is the hero) // (lane W, round 14: def.rig = the wagon's body circles, convoy.js: nobody's friend)
const hpRatio = (u) => u.hp / u.maxHp;
const speedOf = (u) => {
  let s = u.def.speed * (u.moveMul || 1);
  for (const h of hooksOf(u)) if (h.moveSpeed) s *= h.moveSpeed(u);
  s *= 1 - Math.min(0.6, u.st.chill / 160);
  if (u.sickT > 0) s *= 1 - POISON.slow; else if (u.st.poison > 20) s *= 0.9; // poison slows a little; sickened (its burst), a lot
  if (u.inOil) s *= 0.7;
  if (u.st.entangle > 0) s *= 1 - ENTANGLE.slow * fillOf(u, 'entangle'); // entangled: very slow
  if (u.pulse != null) s *= u.pulse;       // slimes move in hops (round 9): their brain sets the pulse
  for (const b of u.buffs) if (b.move) s *= b.move;
  if (u.flinchT > 0) s *= 0.5;            // just took a blow
  if (u.fearT > 0) s *= FEAR.run;         // terrified: runs for it (round 13)
  if (u.staleBoost) s *= 1.3;              // a stand-off that's gone on too long (dungeon.js w.stale)
  if (u.rootT > 0 || u.tangledT > 0 || u.stunT > 0 || u.sleepT > 0 || u.buffs.some((b) => b.root)) s = 0;
  return s;
};
// How fast attacks come round: haste, buffs, traits (Momentum), poison.
const atkRate = (u) => {
  let r = u.atkMul || 1;
  for (const b of u.buffs) if (b.atkSpeed) r *= b.atkSpeed;
  for (const h of hooksOf(u)) if (h.atkSpeed) r *= h.atkSpeed(u);
  if (u.sickT > 0) r *= 1 - POISON.slow; else if (u.st.poison > 20) r *= 0.9;
  if (u.st.radiance > 0) r *= 1 - RADIANCE.atkSlow * fillOf(u, 'radiance'); // radiant: attacks come slower
  if (u.st.sleepy > 0) r *= 1 - SLEEPY.atkSlow * fillOf(u, 'sleepy');         // sleepy: attacks come slower (round 13)
  return r;
};
const buffMul = (u, key) => { let m = 1; for (const b of u.buffs) if (b[key] != null) m *= b[key]; return m; };
// A unit's plain blow before the target's side of it (lane T: the inspect panel and the About page read these through
// unitNumbers, so they always match what the sim does): its weapon's damage, and what its buffs and statuses do to
// everything it deals.
const hitDmg = (u) => u.def.dmg * u.dmgMul;
const blowMul = (u) => buffMul(u, 'dealt') * (u.st.radiance > 0 ? 1 - RADIANCE.weaken * fillOf(u, 'radiance') : 1) * (u.sickT > 0 ? 1 - POISON.weaken : 1); // radiant: much weaker blows; sickened: weaker
// The numbers a unit fights with right now: damage per weapon hit (before the target's armour and situational traits),
// weapon attacks per second (in reach), health, move speed (px/s) and reach.
export { ARMOUR_CAP };
export function unitNumbers(u) {
  // round 15 (the Mob): four bodies strike, each at its own pace: attacks a second is the four's together, and the
  // damage of a hit is their average blow (so hit x attacks is what the hero really deals)
  if (u.bodies) { let aps = 0, dps = 0; for (const b of [u, ...u.bodies]) { const a = atkRate(b) / (b.def.atkCd || 1); aps += a; dps += a * hitDmg(b) * blowMul(b); }
    return { hit: aps ? dps / aps : 0, aps, hp: u.maxHp, speed: speedOf(u), range: u.def.range || 0, armor: u.armor || 0 }; }
  return { hit: hitDmg(u) * blowMul(u), aps: atkRate(u) / (u.def.atkCd || 1), hp: u.maxHp, speed: speedOf(u), range: u.def.range || 0, armor: u.armor || 0 };
}
const immuneTo = (u, type) => u.buffs.some((b) => b.statusImmune || (b.immune && b.immune.includes(type))) || hooksOf(u).some((h) => h.immune && h.immune.includes(type));
const knockImmune = (u) => u.buffs.some((b) => b.knockImmune) || hooksOf(u).some((h) => h.knockImmune);

export function addBuff(u, b) {
  const old = u.buffs.find((x) => x.id === b.id);
  if (old) { Object.assign(old, b, { t: Math.max(old.t, b.dur) }); return old; }
  const nb = { ...b, t: b.dur }; u.buffs.push(nb); return nb;
}
export function stun(w, u, t) { if (!alive(u)) return; u.stunT = Math.max(u.stunT, u.def.boss ? t * 0.4 : t); u.act = u.act && u.act.type === 'drink' ? null : u.act; }
export function heal(w, u, amount, src, o) {
  if (!alive(u) || amount <= 0) return 0;
  // round 15 (the Mob): a heal on any body lands on the hero, and one heal that reaches several bodies (a healing
  // ring, a zone's tick) counts once
  if (mobLead(u)) u = mobLead(u);
  if (u.bodies) { const by = src || null; if (u.healAt === w.time && u.healBy === by && u.healAmt === amount) return 0; u.healAt = w.time; u.healBy = by; u.healAmt = amount; }
  // a hexed healer's heal turns: it hurts the friend instead (a tiny tick only turns inside a hex that has fired)
  if (src && src !== u && alive(src) && src.team === u.team && (src.hexUntil > w.time || (amount >= 1.5 && hexFires(w, src)))) {
    hurt(w, u, Math.min(amount, u.maxHp * CURSE.selfCap), null, { noDodge: true, hexTurned: true }); return 0;
  }
  if (AUDIT.on) AUDIT.on('healAsk', w, u, src, amount, o || {});
  if (u.st.curse > 0) amount *= Math.max(0, 1 - CURSE.healCut * fillOf(u, 'curse')); // cursed: heals do less, then nothing
  if (u.st.bleed > 0) amount *= 1 - BLEED.healCut * fillOf(u, 'bleed');             // bleeding: heals do less (round 13)
  amount *= buffMul(u, 'healTaken');                                               // a wound that won't close (round 13: healers' counters)
  if (AUDIT.on) AUDIT.on('healCut', w, u, src, amount, o || {});
  if (amount <= 0) return 0;
  if (u.def.cargo) amount /= 3; // lane C (convoy.js): heals mend the wagon at a third
  const before = u.hp; u.hp = Math.min(u.maxHp, u.hp + amount);
  if (w.stats) tallyHeal(w, u, src, u.hp - before, o);
  // a healing cross rising off the edge of the body (round 10: "need outline and need to be spread out around his sprite")
  if (u.hp - before > 2 && rand() < 0.5) { const a = rand() * Math.PI * 2, d = (u.vr || u.r) * (1 + 0.25 * rand()); w.particles.push({ x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d * 0.8, vx: 0, vy: 0, rise: 40, up: 0, life: 0.7, max: 0.7, size: 4.5, color: '#9BE07A', shape: 'plus' }); }
  return u.hp - before;
}
export function cleanse(u) { u.st = freshStatuses(); u.frozenT = 0; u.stunT = 0; u.rootT = 0; u.sleepT = 0; u.hexed = false; u.radiantT = 0; u.tangledT = 0; u.sickT = 0; u.addledT = 0; u.fearT = 0; u.lurchT = 0; u.shackledT = 0; if (u.flipKind === 'charm' && !u.follower) restoreSide(null, u); } // (round 14: a follower's charm is for good: a friend's cleanse doesn't break it)
// Cursed's burst: an armed hex fires on the unit's next attack, heal or summon. hexFires() arms the window (everything
// that action does in the next CURSE.windowT turns too) and says whether this one turns.
function hexFires(w, u) {
  if (u.hexUntil > w.time) return true;
  if (!u.hexed) return false;
  u.hexed = false; u.hexUntil = w.time + CURSE.windowT; u.hexSelf = 0;
  fx(w, { type: 'hex', kind: 'fire', unit: u, x: u.x, y: u.y, r: u.vr * 1.3, max: 0.7 });
  return true;
}
// A summon made by a hexed unit joins the other side (it keeps its life timer; a turned enemy add gets one).
function turnSummon(w, s, by) {
  s.team = by.team === 'hero' ? 'enemy' : 'hero'; s.summon = true; s.turned = true; s.turnedFrom = by; s.summonBy = null;
  s.target = null; s.aggro = true; if (s.lifeT == null) s.lifeT = 12;
  fx(w, { type: 'hex', kind: 'turn', unit: s, x: s.x, y: s.y, r: s.vr * 1.3, max: 0.8 });
}
// A visual effect, optionally with a tick (a lasting zone that does something every `every` seconds).
export function fx(w, f) { f.t = 0; f.max = f.max ?? f.dur ?? 0.5; if ((w.battle || (w.actor && w.actor.trueTeam)) && !f.by) f.by = w.actor || null; w.fx.push(f); return f; } // (round 14: a charmed unit's delayed calls run as it, so what it calls up is charmed too)
// Run a delayed callback as the unit it belongs to (battle mode: what it spawns is that unit's side's).
function actAs(w, by, fn) { const was = w.actor; w.actor = by || was; try { return fn(); } finally { w.actor = was; } }
export function zone(w, z) { return fx(w, { type: 'zone', ...z, max: z.dur, acc: 0 }); }
// A wall that melts away after a while (the A* grid is rebuilt when it comes and goes).
export function wallRect(w, r, dur, kind) {
  const wl = { ...r, temp: dur, kind }; w.walls.push(wl); buildGrid(w);
  for (const u of w.units) { const c = circleRect(u.x, u.y, u.r, wl); if (c) { u.x += c.nx * c.over; u.y += c.ny * c.over; } }
  return wl;
}

// ---------------------------------------------------------------- line of sight
function blocked(w, ax, ay, bx, by, team) { // (team, round 15 lane N: a shooter of that side sees over walls raised low for it: path.js lineClear)
  if (!lineClear(w, ax, ay, bx, by, 2, team)) return true;
  for (const p of w.pillars) {
    const dx = bx - ax, dy = by - ay; const L2 = dx * dx + dy * dy || 1;
    let t = ((p.x - ax) * dx + (p.y - ay) * dy) / L2; t = clamp(t, 0, 1);
    if (dist2(ax + dx * t, ay + dy * t, p.x, p.y) < (p.r + 4) ** 2) return true;
  }
  return false;
}

// ---------------------------------------------------------------- targeting
const SIGHT = 720, AGGRO = 540; // round 6: longer view range for everyone
const WINDOW_PULL = 0.8;        // how much a hero would rather hit a boss while its window is open than its adds
function wake(w, u) {
  if (u.aggro) return;
  u.aggro = true;
  for (const o of w.units) if (o.team === u.team && !o.aggro && alive(o) && dist(o.x, o.y, u.x, u.y) < 320) { o.aggro = true; }
}
// round 15 (the Mob): one of its other bodies fights what the lead fights; if that is out of its reach and something
// else is at arm's length, that; with the lead under orders (a door, a friend to lift) or nothing about, nothing.
function bodyTarget(w, u) {
  const l = u.partOf, lt = l.target && alive(l.target) && !l.target.ethereal && l.target.team !== u.team ? l.target : null;
  if (l.forcedGoal || u.forcedGoal) { u.target = null; return; }
  const gap = (o) => dist(u.x, u.y, o.x, o.y) - u.r - o.r;
  if (l.mobLoose > w.time) { let b = null, bd = 420; for (const o of opponents(w, u)) { const g = gap(o); if (g < bd) { bd = g; b = o; } } u.target = b; return; } // (Scatter: each on its own, whatever is nearest)
  if (lt && gap(lt) <= u.def.range + 46) { u.target = lt; return; }
  let best = lt, bd = lt ? Math.min(gap(lt), MOB.near) : MOB.near;
  for (const o of opponents(w, u)) { const g = gap(o); if (g < bd && (g <= u.def.range + 14 || !lt)) { bd = g; best = o; } }
  u.target = best;
}
function chooseTarget(w, u) {
  if (mobLead(u)) { bodyTarget(w, u); return; }
  if (u.team === 'enemy' && !u.aggro) {
    for (const h of opponents(w, u)) if (dist(u.x, u.y, h.x, h.y) < AGGRO && !blocked(w, u.x, u.y, h.x, h.y)) { wake(w, u); break; }
    if (!u.aggro) { u.target = null; return; }
  }
  let opp = opponents(w, u);
  if (u.team === 'hero') opp = opp.filter((o) => o.aggro || dist(u.x, u.y, o.x, o.y) < SIGHT);
  if (!opp.length) { u.target = null; return; }
  const k = roleAlias(u);
  let best = null, bestS = -Infinity;
  const mates = allies(w, u);
  const pick = w.pick && u.team === 'hero' ? w.pick : null; // lane W (round 14, convoy.js): each hero keeps to its own side of the wagon
  for (const o of opp) {
    const d = dist(u.x, u.y, o.x, o.y);
    let s = -d / (k === 'rogue' ? 900 : 300);
    if (pick) { const b = pick(u, o); if (b == null) continue; s += b; } // (null: not this hero's to fight)
    // how many of my side are already on it, and how many of its side stand around it
    let on = 0; for (const a of mates) if (a.target === o) on++;
    let crowd = 0; for (const q of opp) if (q !== o && dist(q.x, q.y, o.x, o.y) < 95) crowd++;
    if (heroic(w, u)) {
      s -= on * 0.22;                                   // spread out: prefer enemies nobody is on yet
      s -= crowd * (k === 'rogue' ? 0.4 : 0.08);        // don't dive into a pack (the rogue most of all)
      if (k === 'rogue' && crowd === 0) s += 0.45;      // the rogue hunts the ones on their own, even far off
      // finish the kill: a nearly dead enemy someone is already hitting
      if ((k === 'archer' || k === 'rogue') && on > 0 && hpRatio(o) < 0.35) s += 0.55;
      // round 14 (lane L): the one mending the others first (a choir sprite, a light spirit, a repair drone, an elite
      // shaman: "kill it first"), or the fight can't end
      if (o.def.mends || (o.elite && o.kind === 'orcShaman')) s += 0.5;
      // a boss that can only be hit while it's up (the Sand Wurm out of the sand: boss-wurm.js wurmOut): go for it while
      // it shows, not for its brood (the scarabs took the party's blows through every window it was out)
      if ((o.partOf || o).wurmOut) s += WINDOW_PULL;
    }
    if (k === 'archer') { s += (1 - hpRatio(o)) * 0.5; if (d <= u.def.range && !blocked(w, u.x, u.y, o.x, o.y, u.team)) s += 0.6; }
    else if (k === 'rogue') { s += (1 - hpRatio(o)) * 1.1 + (o.target && o.target !== u ? 0.5 : 0) - (o.def.boss ? 0.3 : 0); }
    else if (k === 'knight') {
      s += o.target && o.target.kind !== 'knight' ? 0.35 : 0;
      // protect: go for whoever is on a hurt teammate
      if (o.target && o.target.team === (w.battle ? u.team : 'hero') && o.target !== u && hpRatio(o.target) < 0.45) s += 0.9;
    }
    else if (k === 'rat') { s += o.kind === 'archer' ? 0.35 : 0; }
    if ((u.team === 'enemy' || w.battle) && u.tauntT > 0 && u.tauntBy === o) s += 0.85; // the knight drew its attention
    if (u.focusT > 0 && u.focus === o) s += 1.2; // round 9: a howl (wolves) or a call turns a pack onto one hero
    if (o === u.target) s += 0.35; // stickiness
    if (u.st.charm > 0 && u.stBy && u.stBy.charm === o) s -= 3;        // round 13: it won't go for whoever is charming it
    if (u.hunting && o.def.heroRole === 'support') s += u.def.hunter; // round 13: healer hunters go for the party's healer (round 14: only while the mood is on it: think)
    if (u.def.charmBonus && (o.st.charm > 0 || o.flipKind === 'charm')) s += 0.8; // the Succubus goes for the charmed
    if (u.outOfReach && u.outOfReach.get(o) > w.time) s -= REACH_PENALTY; // round 14 (lane L): one it couldn't get at (reachCheck)
    if (s > bestS) { bestS = s; best = o; }
  }
  u.target = best;
}
// Round 14, lane L (rooms that dragged on for minutes): a unit that gets no nearer to its target, and can't hit it from
// where it is, for REACH_T seconds (a troll after a shooter behind a wall it is too big to get round, a knight after a bee
// it never catches, a shooter with a rock between it and its mark) counts that target out of its reach for REACH_REST
// seconds and goes for another it can get at, if there is one (with only the one left, it keeps on at it).
const REACH_T = 6, REACH_REST = 8, REACH_PENALTY = 1.2;
function reachCheck(w, u) {
  const t = u.target;
  if (!t || u.forcedGoal) { u.chase = null; return; }
  const d = dist(u.x, u.y, t.x, t.y), gap = d - u.r - t.r;
  const canHit = u.def.role === 'ranged' ? d <= (u.def.range || 0) && !blocked(w, u.x, u.y, t.x, t.y, u.team) : gap <= (u.def.range || 20) + 10;
  const c = u.chase;
  if (canHit || !c || c.t !== t || gap < c.best - 30) { u.chase = { t, best: c && c.t === t ? Math.min(c.best, gap) : gap, since: w.time }; return; }
  if (w.time - c.since < REACH_T) return;
  (u.outOfReach || (u.outOfReach = new Map())).set(t, w.time + REACH_REST);
  u.chase = null;
  if (u.outOfReach.size > 8) for (const [o, until] of u.outOfReach) if (until <= w.time || !alive(o)) u.outOfReach.delete(o);
}

// Round 14 (lane L): a shooter standing in a mirror-faced enemy's front while that enemy faces someone else (so it can
// get round to its side, and its shots would only come back at it).
const mirrorFront = (w, u, t) => !!t.def.mirror && u.def.role === 'ranged' && heroic(w, u) && t.target && t.target !== u && alive(t.target)
  && angleDiff(angleTo(t.x, t.y, u.x, u.y), t.facing) < t.def.mirror + 0.25;
// The old trio's brains, by role: shooters like the archer, skirmishers like the rogue, tanks like the knight.
function roleAlias(u) {
  const r = u.def.heroRole;
  if (!r) return u.kind;
  if (r === 'tank') return 'knight';
  if (r === 'skirmish') return 'rogue';
  if (r === 'ranged' || r === 'caster' || (r === 'support' && u.def.range > 60)) return 'archer';
  return u.kind;
}

// ---------------------------------------------------------------- move-mode choice
const MODES = ['approach', 'hold', 'kite', 'strafe', 'flank', 'retreat', 'wander'];

function scoreModes(w, u) {
  const t = u.target;
  const sc = { approach: 0, hold: 0, kite: 0, strafe: 0, flank: 0, retreat: 0, wander: 0 };
  if (!t) { sc.wander = 1; return sc; }
  const d = dist(u.x, u.y, t.x, t.y);
  const gap = d - u.r - t.r;
  const role = u.def.role;
  const ready = u.atkT <= 0.15;
  if (role === 'melee') {
    // 'in range' must mean the swing can land (tryAttack allows range + 2): holding just outside it was a stand-off
    // where both sides waited for ever
    const inRange = gap <= u.def.range;
    sc.approach = inRange ? 0.1 : 1;
    sc.hold = inRange ? 1.05 : 0;
    if (heroic(w, u) && hpRatio(u) < 0.18) sc.retreat = 0.5;
  } else if (role === 'ranged') {
    let near = Infinity;
    for (const o of opponents(w, u)) near = Math.min(near, dist(u.x, u.y, o.x, o.y) - o.r);
    const los = !blocked(w, u.x, u.y, t.x, t.y, u.team);
    sc.kite = near < u.def.keep && !u.staleBoost ? 0.5 + 1.1 * (1 - near / u.def.keep) : 0;
    sc.approach = d > u.def.range * 0.92 || !los ? 1 : 0.05;
    sc.strafe = d <= u.def.range ? (los ? 0.75 : 0.9) : 0.15;
    sc.hold = d <= u.def.range && los && ready ? 0.55 : 0;
  } else { // skirmish: in and out
    const inRange = gap <= u.def.range;
    const sinceAtk = w.time - u.lastAttackT;
    sc.approach = ready ? (inRange ? 0.3 : 1) : 0.15;
    sc.hold = inRange && ready ? 0.9 : 0;
    sc.flank = t.target && t.target !== u && gap < 180 ? (u.kind === 'rogue' ? 0.95 : 0.6) : 0;
    sc.retreat = !ready && sinceAtk < 0.9 ? (u.kind === 'rogue' ? 1.05 : 0.6) : 0;
    sc.strafe = !ready ? 0.55 : 0.1;
  }
  return sc;
}

// Round 14 (the designer, of the healer hunters: "Have a higher chance to go for healer. Not hard targeting."): every
// few seconds a hunter rolls whether it is after the healer for now (HUNT.p); only then does the healer score its bonus.
export const HUNT = { p: 0.5, every: [3, 5] };
function think(w, u) {
  const prevT = u.target;
  reachCheck(w, u);
  if (u.def.hunter && !(u.huntT > w.time)) { u.huntT = w.time + rrange(...HUNT.every); u.hunting = chance(HUNT.p); }
  chooseTarget(w, u);
  const sc = scoreModes(w, u);
  const list = MODES.map((m) => (sc[m] > 0 ? sc[m] : -4)); // modes that don't apply are effectively off
  const cur = MODES.indexOf(u.mode);
  if (cur >= 0) list[cur] += 0.25; // hysteresis: incumbent bonus
  let best = 0; for (let i = 1; i < list.length; i++) if (list[i] > list[best]) best = i;
  const locked = u.modeT < u.def.commit && cur >= 0 && list[best] - list[cur] < 0.8 && prevT === u.target;
  if (!locked) {
    const i = softmaxPick(list, u.def.temp * 0.6);
    if (MODES[i] !== u.mode) { u.mode = MODES[i]; u.modeT = 0; if (u.mode === 'strafe' || u.mode === 'flank' || u.mode === 'retreat') u.strafeSign = quietSide(w, u); }
  }
}

// Which way round the target has fewer of its friends (so strafing doesn't run into a pack).
function quietSide(w, u) {
  const t = u.target; if (!t) return u.strafeSign;
  const a = angleTo(u.x, u.y, t.x, t.y);
  let l = 0, r = 0;
  for (const o of opponents(w, u)) {
    if (o === t) continue;
    const d = dist(u.x, u.y, o.x, o.y); if (d > 260) continue;
    const side = Math.sin(angleTo(u.x, u.y, o.x, o.y) - a);
    if (side > 0) r += 1 / (1 + d / 120); else l += 1 / (1 + d / 120);
  }
  if (Math.abs(l - r) < 0.15) return chance(0.35) ? -u.strafeSign : u.strafeSign;
  return r > l ? -1 : 1;
}

// ---------------------------------------------------------------- danger zones
// A telegraphed hit: a shape on the ground that fills up, then strikes everyone of the other side inside it.
// The other side sees it and steers out (after a short reaction), so big attacks can be dodged.
//   { shape: 'circle', x, y, r } | { shape: 'ring', x, y, r0, r1 } (safe inside r0) |
//   { shape: 'cone', x, y, a, arc, r } | { shape: 'line', x1, y1, x2, y2, hw }
//   + { t (seconds to the hit), max, team (who made it), src?, kind ('bone' | 'soul' | 'blade' | 'water': the colour),
//       hit?: { dmg, ...hurt options }, onFire?(w, z) }
// Pushed with addDanger; the sim counts t down, strikes at 0 (only if src is still standing), and drops it soon after.
export function addDanger(w, z) { z.max = z.max || z.t; z.age = 0; if (w.battle && !z.by) z.by = z.src || w.actor || null; w.danger.push(z); return z; }
export function inZone(z, x, y, pad = 0) {
  switch (z.shape) {
    case 'circle': return dist2(x, y, z.x, z.y) < (z.r + pad) ** 2;
    case 'ring': { const d = dist(x, y, z.x, z.y); return d > z.r0 - pad && d < z.r1 + pad; }
    case 'cone': { const d = dist(x, y, z.x, z.y); return d < z.r + pad && (d < pad + 8 || angleDiff(angleTo(z.x, z.y, x, y), z.a) < z.arc / 2 + Math.atan2(pad, Math.max(d, 1))); }
    case 'line': {
      const dx = z.x2 - z.x1, dy = z.y2 - z.y1, L2 = dx * dx + dy * dy || 1;
      const k = clamp(((x - z.x1) * dx + (y - z.y1) * dy) / L2, 0, 1);
      return dist2(x, y, z.x1 + dx * k, z.y1 + dy * k) < (z.hw + pad) ** 2;
    }
  }
  return false;
}
const threatens = (z, u) => z.team !== u.team && z.t > 0;
function dangerTick(w, dt) {
  for (const z of w.danger) {
    z.t -= dt / (z.src && z.src.winding ? windMul(z.src) : 1); z.age += dt; // (round 14: a sleepy unit's telegraph fills slower while it winds up)
    if (z.t > 0 || z.done) continue;
    z.done = true;
    if (z.src && (z.src.dead || z.src.downed)) { z.cancelled = true; continue; }
    if (z.hit) for (const o of w.units) if (alive(o) && o.team !== z.team && inZone(z, o.x, o.y, o.r * 0.5)) hurt(w, o, z.hit.dmg, z.src || null, { noDodge: true, ...z.hit });
    if (z.onFire) actAs(w, z.src || z.by, () => z.onFire(w, z));
  }
  w.danger = w.danger.filter((z) => z.t > -0.3);
}
// Where to stand to be out of every zone that threatens u: the nearest safe spot (null if u is safe).
// A unit only reacts once a zone has been showing for its reaction time.
function dangerEscape(w, u) {
  if (!w.danger.length) return null;
  if (u.react == null) u.react = rrange(0.12, 0.32);
  const live = w.danger.filter((z) => threatens(z, u) && z.age >= u.react);
  if (!live.some((z) => inZone(z, u.x, u.y, u.r * 0.6))) { u.escape = null; return null; }
  if (u.escape && u.escape.until > w.time && !live.some((z) => inZone(z, u.escape.x, u.escape.y, u.r * 0.75))) return u.escape;
  let best = null, bd = Infinity;
  for (let i = 0; i < DIRS; i++) for (let d = 24; d <= 300; d += 22) {
    const x = u.x + DIR_X[i] * d, y = u.y + DIR_Y[i] * d;
    if (x < u.r || y < u.r || x > w.W - u.r || y > w.H - u.r || !lineClear(w, u.x, u.y, x, y, u.r * 0.8)) break;
    if (live.some((z) => inZone(z, x, y, u.r * 0.75))) continue;
    const cost = d + (live.some((z) => z.shape !== 'ring' && dist(x, y, z.x ?? z.x1, z.y ?? z.y1) < dist(u.x, u.y, z.x ?? z.x1, z.y ?? z.y1)) ? 25 : 0);
    if (cost < bd) { bd = cost; best = { x, y }; }
    break;
  }
  u.escape = best ? { ...best, until: w.time + 0.3 } : null;
  return u.escape;
}

// ---------------------------------------------------------------- context steering
const interest = new Float32Array(DIRS), danger = new Float32Array(DIRS);

function steer(w, u, gx, gy, opts = {}) {
  const gl = Math.hypot(gx, gy);
  if (gl < 1e-4) return [0, 0];
  gx /= gl; gy /= gl;
  for (let i = 0; i < DIRS; i++) {
    const dp = DIR_X[i] * gx + DIR_Y[i] * gy;
    interest[i] = Math.max(0, dp) + (opts.side ? 0.15 * Math.max(0, DIR_X[i] * -gy * opts.side + DIR_Y[i] * gx * opts.side) : 0);
    danger[i] = 0;
  }
  const R = u.r;
  const look = 46 + R + Math.min(70, u.spd * 0.22); // a fast unit looks further ahead
  // walls
  for (let i = 0; i < DIRS; i++) {
    const dx = DIR_X[i], dy = DIR_Y[i];
    let tWall = Infinity;
    if (dx > 0) tWall = Math.min(tWall, (w.W - R - u.x) / dx); if (dx < 0) tWall = Math.min(tWall, (R - u.x) / dx);
    if (dy > 0) tWall = Math.min(tWall, (w.H - R - u.y) / dy); if (dy < 0) tWall = Math.min(tWall, (R - u.y) / dy);
    if (tWall < look) danger[i] = Math.max(danger[i], 1 - tWall / look);
  }
  const avoidCircle = (cx, cy, cr, weight, range) => {
    const d = dist(u.x, u.y, cx, cy) - cr - R;
    if (d > range) return;
    const a = angleTo(u.x, u.y, cx, cy);
    const spread = Math.atan2(cr + R, Math.max(1, d + cr + R)) + 0.25;
    const k = weight * clamp(1 - d / range, 0, 1);
    for (let i = 0; i < DIRS; i++) {
      const ad = angleDiff(i / DIRS * TAU, a);
      if (ad < spread) danger[i] = Math.max(danger[i], k * (1 - ad / (spread * 1.6)));
    }
  };
  for (const p of w.pillars) if (!ownBoulder(u, p)) avoidCircle(p.x, p.y, p.r, 1, 70);
  // telegraphed hits: don't walk into one (escaping one that's already under you is movement()'s job)
  if (w.danger.length) for (const z of w.danger) {
    if (!threatens(z, u) || inZone(z, u.x, u.y, R * 0.6)) continue;
    for (let i = 0; i < DIRS; i++) if (inZone(z, u.x + DIR_X[i] * look, u.y + DIR_Y[i] * look, R * 0.6)) danger[i] = Math.max(danger[i], 0.92);
  }
  for (const r of w.walls) {
    if (u.x < r.x - look - R || u.x > r.x + r.w + look + R || u.y < r.y - look - R || u.y > r.y + r.h + look + R) continue;
    // already against this wall: only the directions into it are blocked (rays from inside the padded box all read
    // as blocked, which froze units touching a wall)
    const touch = circleRect(u.x, u.y, R + 2, r);
    if (touch) {
      for (let i = 0; i < DIRS; i++) { const into = -(DIR_X[i] * touch.nx + DIR_Y[i] * touch.ny); if (into > 0.15) danger[i] = Math.max(danger[i], Math.min(1, into * 1.4)); }
      continue;
    }
    for (let i = 0; i < DIRS; i++) { const tt = rayToRoundRect(u.x, u.y, DIR_X[i], DIR_Y[i], r, R); if (tt < look) danger[i] = Math.max(danger[i], 1 - tt / look); }
  }
  const fear = heroic(w, u) ? 0.9 : 0.45;
  for (const h of w.hazards) if (!h.hidden && h.up !== false && h.type !== 'beam' && ((h.type !== 'oil' && h.type !== 'web') || heroic(w, u))) avoidCircle(h.x, h.y, h.r * 0.85, h.type === 'oil' || h.type === 'web' ? 0.35 : fear, 40);
  for (const o of w.units) {
    if (o === u || !alive(o) || o.ethereal || u.ethereal) continue;
    if (o.team === u.team) avoidCircle(o.x, o.y, o.r + (heroic(w, u) ? 14 : 0), 0.45, 18);
    else if (u.def.role === 'ranged' && o !== u.target) avoidCircle(o.x, o.y, o.r, 0.7, 60);
    else if (u.def.role === 'skirmish' && heroic(w, u) && o !== u.target) avoidCircle(o.x, o.y, o.r, 0.75, 55);
  }
  // Commitment: directions close to where it's already heading score a little higher, so two near-equal ways round
  // an obstacle (or a goal right between two of the 16 slots: diagonals) don't win in turn tick after tick, which
  // read as rapid left-right jitter.
  const hx = u.spd > 10 ? Math.cos(u.mvA) : u.sdx, hy = u.spd > 10 ? Math.sin(u.mvA) : u.sdy;
  const val = new Float32Array(DIRS);
  let bi = 0, bv = -1;
  for (let i = 0; i < DIRS; i++) {
    const keep = 0.12 * Math.max(0, DIR_X[i] * hx + DIR_Y[i] * hy);
    val[i] = (interest[i] + (interest[i] > 0 ? keep : 0)) * (1 - danger[i]);
    if (val[i] > bv) { bv = val[i]; bi = i; }
  }
  if (bv < 0.04) return [0, 0];
  // A heading between slots, not snapped to one: fit a parabola through the best slot and its neighbours and take
  // its peak. The result turns smoothly as the goal turns, instead of jumping 22.5 degrees at a time.
  const vl = val[(bi + DIRS - 1) % DIRS], vr = val[(bi + 1) % DIRS];
  const den = vl - 2 * bv + vr;
  const off = den < -1e-6 ? clamp(0.5 * (vl - vr) / den, -0.5, 0.5) : 0;
  const a = (bi + off) / DIRS * TAU;
  return [Math.cos(a), Math.sin(a)];
}

// Head for (tx,ty): straight there if there's a clear line, else along an A* route round the walls.
const CLEAR_PAD = 42; // a route is pulled straight no tighter than this (the A* grid keeps 46 from walls)
function goalVec(w, u, tx, ty) {
  if (w.detour) { const p = w.detour(u, tx, ty); if (p) { tx = p.x; ty = p.y; } } // lane W (round 14, convoy.js): the way round the wagon, which is solid and moves
  if ((!w.walls.length && !w.pillars.length) || pathClear(w, u.x, u.y, tx, ty, u.r * 0.9)) { u.path = null; return [tx - u.x, ty - u.y]; }
  u.pathT -= 1 / 60;
  const moved = !u.pathGoal || Math.hypot(u.pathGoal.x - tx, u.pathGoal.y - ty) > 60;
  if (!u.path || u.pathT <= 0 || moved) { u.path = findPath(w, u.x, u.y, tx, ty, Math.min(CLEAR_PAD, u.r * 0.9)); u.pathT = 0.6; u.pathGoal = { x: tx, y: ty }; }
  if (!u.path || !u.path.length) return [tx - u.x, ty - u.y];
  // the furthest route point we can see
  let k = 0;
  for (let i = u.path.length - 1; i >= 0; i--) if (pathClear(w, u.x, u.y, u.path[i].x, u.path[i].y, u.r * 0.9)) { k = i; break; }
  if (k > 0) u.path.splice(0, k);
  const p = u.path[0];
  if (Math.hypot(p.x - u.x, p.y - u.y) < 16 && u.path.length > 1) u.path.shift();
  return [u.path[0].x - u.x, u.path[0].y - u.y];
}

// Where a melee unit closing on t should head: straight at it, unless a friend already stands in that spot at t's
// side (then the nearest free spot round t), so a pack spreads round its target instead of queueing behind the one in
// front. Rethought a few times a second, not every tick, so the choice holds.
const SPOT_OFF = [0, 0.55, -0.55, 1.1, -1.1, 1.65, -1.65, 2.3, -2.3];
const spotAt = (t, u, a) => { const ring = t.r + u.r + Math.min(u.def.range, 30) * 0.5; return { x: t.x + Math.cos(a) * ring, y: t.y + Math.sin(a) * ring }; };
function approachSpot(w, u, t) {
  if (u.spotT > w.time && u.spotFor === t) return u.spotA == null ? null : spotAt(t, u, u.spotA);
  u.spotT = w.time + 0.5; u.spotFor = t; u.spotA = null;
  const mates = w.units.filter((o) => o !== u && o.team === u.team && alive(o) && !o.ethereal && dist(o.x, o.y, t.x, t.y) < t.r + o.r + 90);
  if (!mates.length) return null;
  const base = angleTo(t.x, t.y, u.x, u.y); // fixed for the life of the choice, so the spot doesn't slide round with u
  for (const off of SPOT_OFF) {
    const s = spotAt(t, u, base + off);
    if (s.x < u.r || s.y < u.r || s.x > w.W - u.r || s.y > w.H - u.r) continue;
    if (w.walls.some((r) => circleRect(s.x, s.y, u.r, r)) || w.pillars.some((p) => dist(s.x, s.y, p.x, p.y) < p.r + u.r)) continue;
    if (mates.some((o) => dist(o.x, o.y, s.x, s.y) < (o.r + u.r) * 0.95)) continue;
    if (off === 0) return null;
    u.spotA = base + off; return s;
  }
  return null;
}

// A troll's own boulder while it holds it, or while it is still rolling off (it starts inside the troll's collider):
// they don't push each other apart, and the troll doesn't steer round it (art round 8, foes9.js HOLD).
function ownBoulder(u, p) { return p.owner === u && (p.held || p.vx * p.vx + p.vy * p.vy > 10000); }
// How far u can go along (dx, dy) before a wall, the room's edge or a pillar (up to max).
function clearance(w, u, dx, dy, max) {
  let t = max;
  if (dx > 0) t = Math.min(t, (w.W - u.r - u.x) / dx); if (dx < 0) t = Math.min(t, (u.r - u.x) / dx);
  if (dy > 0) t = Math.min(t, (w.H - u.r - u.y) / dy); if (dy < 0) t = Math.min(t, (u.r - u.y) / dy);
  for (const r of w.walls) {
    if (u.x < r.x - max - u.r || u.x > r.x + r.w + max + u.r || u.y < r.y - max - u.r || u.y > r.y + r.h + max + u.r) continue;
    t = Math.min(t, rayToRoundRect(u.x, u.y, dx, dy, r, u.r));
  }
  for (const p of w.pillars) {
    if (ownBoulder(u, p)) continue;
    const ox = p.x - u.x, oy = p.y - u.y, along = ox * dx + oy * dy; if (along < 0) continue;
    const off2 = ox * ox + oy * oy - along * along, R = p.r + u.r;
    if (off2 < R * R) t = Math.min(t, Math.max(0, along - Math.sqrt(R * R - off2)));
  }
  return Math.max(0, t);
}
// The most open direction from u (the one with the most room ahead), leaning towards `pref` if given.
function openAngle(w, u, pref) {
  let best = 0, bv = -Infinity;
  for (let i = 0; i < DIRS; i++) {
    const a = i / DIRS * TAU;
    const v = clearance(w, u, DIR_X[i], DIR_Y[i], 220) + (pref != null ? 60 * Math.cos(a - pref) : 0);
    if (v > bv) { bv = v; best = a; }
  }
  return best;
}

// lane W (round 13, the designer: "make it so heroes don't huddle up when there is no enemy on screen. Including in
// dungeons"). looseSpot: u's own place round a shared waypoint: the party stands in a loose line across the way
// (w.looseGap apart, 125 by default; the wagon road sets more), every other one a step back, swaying a little, pulled
// in where a wall or rock is in the way. roomFrom: a push away from any friend nearer than LOOSE_R.
const LOOSE_R = 90;
function looseSpot(w, u, al, wx, wy) {
  const mates = al.filter((a) => !a.summon && !a.def.cargo); if (!mates.length || u.summon) return [wx, wy];
  const ids = [u.id, ...mates.map((a) => a.id)].sort((a, b) => a - b), i = ids.indexOf(u.id), n = ids.length;
  const gap = w.looseGap || 125, across = (i - (n - 1) / 2) * gap + Math.sin(w.time * 0.31 + u.id * 1.9) * gap * 0.22;
  const back = (i % 2 ? -0.45 : 0) * gap + Math.sin(w.time * 0.23 + u.id) * gap * 0.25;
  for (const k of [1, 0.6, 0.3]) {
    const sx = clamp(wx + back * k, u.r + 8, w.W - u.r - 8), sy = clamp(wy + across * k, u.r + 8, w.H - u.r - 8);
    if (!blocked(w, wx, wy, sx, sy) && !w.pillars.some((p) => dist(sx, sy, p.x, p.y) < p.r + u.r + 6)) return [sx, sy];
  }
  return [wx, wy];
}
function roomFrom(u, al, gx, gy) {
  const l = Math.hypot(gx, gy) || 1; let px = gx / l, py = gy / l, push = false;
  for (const a of al) { const d = dist(u.x, u.y, a.x, a.y), R = LOOSE_R + u.r + a.r - 50; if (d < R && d > 0.01) { const k = (R - d) / R * 1.4; px += (u.x - a.x) / d * k; py += (u.y - a.y) / d * k; push = true; } }
  return push ? [px, py] : [gx, gy];
}

function movement(w, u, dt) {
  let gx = 0, gy = 0, side = 0, mult = 1;
  const t = u.target;
  const esc = dangerEscape(w, u);
  // round 15 (the Mob): how far this body is from the middle of the other three. Past MOB.far it drops what it was
  // doing and runs back to them, faster than it walks, until it is inside the leash again. An ability can let go of
  // the leash for a while (kits3.js Scatter: lead.mobLoose). The lead with nothing to fight leads: the others come to it.
  let mobGap = 0, mobM = null;
  if ((mobLead(u) || u.bodies) && !u.forcedGoal && !(u.fearT > 0) && !((mobLead(u) || u).mobLoose > w.time) && !(u.bodies && !t)) {
    mobM = mobMid(u); mobGap = dist(u.x, u.y, mobM.x, mobM.y) * 4 / 3;
    u.mobBack = mobGap > MOB.far || (u.mobBack && mobGap > MOB.leash);
  } else u.mobBack = false;
  if (esc) {
    [gx, gy] = goalVec(w, u, esc.x, esc.y); mult = 1; // out of the telegraphed hit first
  } else if (u.mobBack) {
    [gx, gy] = goalVec(w, u, mobM.x, mobM.y); mult = MOB.rush;
  } else if (u.forcedGoal) {
    [gx, gy] = goalVec(w, u, u.forcedGoal.x, u.forcedGoal.y);
    // ease in on arrival so momentum doesn't carry it past and swing it back and forth
    const gd = Math.hypot(u.forcedGoal.x - u.x, u.forcedGoal.y - u.y);
    if (gd < 20) { gx = gy = 0; } else mult = clamp(gd / 140, 0.22, 1);
    if (u.forcedGoal.slow) mult *= u.forcedGoal.slow;
  } else if (mobLead(u) && (!t || mobLead(u).forcedGoal) && !(mobLead(u).mobLoose > w.time)) {
    // round 15 (the Mob): with nothing to fight (or the lead walking somewhere on purpose) a body keeps its place just
    // behind or beside the lead, and runs to catch up when it is left behind
    const sl = mobSlot(u), sd = dist(u.x, u.y, sl.x, sl.y);
    [gx, gy] = goalVec(w, u, sl.x, sl.y);
    if (sd < 12) gx = gy = 0; else mult = sd > MOB.leash ? MOB.rush : clamp(sd / 60, 0.3, 1);
  } else if (u.coinGoal && (!t || dist(u.x, u.y, t.x, t.y) > 240)) {
    [gx, gy] = goalVec(w, u, u.coinGoal.x, u.coinGoal.y); mult = clamp(u.coinGoal.d / 90, 0.35, 0.9);
  } else if (!t && u.team === 'hero' && !w.cleared) {
    // nothing in sight: press on through the room together, the slowest setting the pace
    // towards the next chunk of the room the party hasn't walked yet (dungeon.js keeps w.wp)
    const al = allies(w, u).filter((a) => !a.def.cargo); // (lane W: the wagon, convoy.js, sets no pace)
    // lane W (round 13, "heroes don't huddle up"): each walks to their own spot round the waypoint, not all to one point
    const px = w.wp ? w.wp.x : Math.min(w.W - 70, u.x + 220), py = w.wp ? w.wp.y : u.y; // (the pace is still set on the shared waypoint)
    const [wx, wy] = u.post ? [u.post.x, u.post.y] : looseSpot(w, u, al, px, py); // lane W (round 14, convoy.js): a hero guarding a side of the wagon has a post of its own there
    let md = dist(u.x, u.y, px, py); for (const a of al) md += dist(a.x, a.y, px, py); md /= al.length + 1;
    const ahead = u.post ? 0 : md - dist(u.x, u.y, px, py);
    [gx, gy] = goalVec(w, u, wx, wy);
    { const l = Math.hypot(gx, gy) || 1; gx /= l; gy /= l; gy += clamp((wy - u.y) / 140, -0.8, 0.8); } // lane W: and take up its place across the way as it goes
    const wd = dist(u.x, u.y, wx, wy);
    mult = u.post ? 0.85 : ahead > 90 ? 0.15 : ahead < -60 ? 0.85 : 0.6; // (a post: nobody to keep pace with)
    // ease in and stop at the waypoint (it circled round it, turning back and forth, until dungeon.js moved it on)
    if (wd < 50) { gx = gy = 0; } else mult *= clamp(wd / 160, 0.4, 1);
    [gx, gy] = roomFrom(u, al, gx, gy); // lane W: and a little room from the others
  } else if (!t || u.mode === 'wander') {
    u.wanderA += Math.sin(w.time * 0.7 + u.id * 2.3) * 0.9 * dt; // a slow meander, not a random jitter
    // idle enemies mill about near where they were put, and turn away from walls before they reach them
    // (a free random walk drifted into corners and pressed there)
    if (u.team === 'enemy' && u.home && dist(u.x, u.y, u.home.x, u.home.y) > 110) u.wanderA = angleTo(u.x, u.y, u.home.x, u.home.y) + Math.sin(u.id) * 0.6;
    else if (clearance(w, u, Math.cos(u.wanderA), Math.sin(u.wanderA), 90) < 70) u.wanderA = openAngle(w, u);
    gx = Math.cos(u.wanderA); gy = Math.sin(u.wanderA); mult = 0.35;
    if (u.team === 'hero') { // lane W (round 13): heroes meander apart, never off alone (back once 230 from the rest), never in a huddle
      const al = allies(w, u).filter((a) => !a.summon);
      if (al.length) { let cx = 0, cy = 0; for (const a of al) { cx += a.x; cy += a.y; } cx /= al.length; cy /= al.length;
        if (dist(u.x, u.y, cx, cy) > 230) { gx = cx - u.x; gy = cy - u.y; mult = 0.6; } else [gx, gy] = roomFrom(u, al, gx, gy); }
    }
  } else {
    const d = dist(u.x, u.y, t.x, t.y);
    const tx = (t.x - u.x) / (d || 1), ty = (t.y - u.y) / (d || 1);
    if (mirrorFront(w, u, t) && u.mode !== 'kite') {
      // round 14 (lane L): a shooter in front of a mirror-faced enemy (the gilded golem sends shots back) goes round to
      // its side while it faces someone else, instead of plinking at the mirror (a party stood round one for minutes)
      const off = wrapAngle(angleTo(t.x, t.y, u.x, u.y) - t.facing), a = t.facing + (Math.sign(off) || 1) * (t.def.mirror + 0.8), R = Math.min(u.def.range * 0.7, 240);
      [gx, gy] = goalVec(w, u, t.x + Math.cos(a) * R, t.y + Math.sin(a) * R); mult = 0.9;
    } else switch (u.mode) {
      case 'approach': {
        const gap = d - u.r - t.r;
        // round 14 (lane L): a gear that rolls where it's going (it chases nobody, and outruns most) is met, not chased:
        // a fighter heads for the point on its way nearest to it and waits there; with the gear rolling off, it stands
        // and lets it come back off a wall (running after one, a knight never caught it)
        if (t.def.pass && u.def.role !== 'ranged' && gap > u.def.range + 8) {
          const tv = Math.hypot(t.vx, t.vy);
          if (tv > 30) {
            const vx = t.vx / tv, vy = t.vy / tv, along = (u.x - t.x) * vx + (u.y - t.y) * vy;
            const mx = t.x + vx * Math.max(0, along), my = t.y + vy * Math.max(0, along);
            // (only where it will really come: a gear rattling to and fro between a rock and a wall never gets there,
            // so then it's walked up to as usual)
            if (along > 0 && pathClear(w, t.x, t.y, mx, my, t.r)) {
              if (dist(u.x, u.y, mx, my) < 18) { gx = gy = 0; break; }
              [gx, gy] = goalVec(w, u, mx, my); mult = clamp(dist(u.x, u.y, mx, my) / 80, 0.3, 1); break;
            }
            if (along <= 0 && pathClear(w, t.x, t.y, t.x + vx * 400, t.y + vy * 400, t.r)) { gx = gy = 0; break; } // rolling off into open floor: wait for it to come back
          }
        }
        const spot = u.def.role !== 'ranged' && gap > u.def.range + 8 ? approachSpot(w, u, t) : null;
        [gx, gy] = spot ? goalVec(w, u, spot.x, spot.y) : goalVec(w, u, t.x, t.y); { const l = Math.hypot(gx, gy) || 1; gx /= l; gy /= l; }
        if (u.kind === 'rat' || u.def.ratMove) {
          // rats dart side to side on the way in, then circle in close until their bite is ready
          const z = Math.sin(w.time * 7 + u.id * 1.7) * 0.85;
          gx += -ty * z; gy += tx * z;
          if (gap < 55 && u.atkT > 0.2) { gx = -ty * u.strafeSign + tx * 0.25; gy = tx * u.strafeSign + ty * 0.25; }
        }
        if (gap < u.def.range * 0.6) {
          // round 14 (lane L): a shooter this close with something in the way (a rock, a troll's boulder, a wall's corner)
          // steps round it to find a line, instead of standing behind it for ever
          if (u.def.role === 'ranged' && blocked(w, u.x, u.y, t.x, t.y, u.team)) {
            if (clearance(w, u, -ty * u.strafeSign, tx * u.strafeSign, 60) < 40) u.strafeSign = -u.strafeSign;
            gx = -ty * u.strafeSign + tx * 0.25; gy = tx * u.strafeSign + ty * 0.25; mult = 0.8;
          } else { gx = gy = 0; }
        }
        else if (u.def.role === 'melee') mult = clamp(gap / 70, 0.35, 1); // ease in, so speed doesn't carry it through
        break;
      }
      case 'hold': gx = gy = 0; break;
      case 'kite': {
        let ax = 0, ay = 0;
        for (const o of opponents(w, u)) { const od = dist(u.x, u.y, o.x, o.y); if (od < u.def.keep * 1.3) { ax += (u.x - o.x) / (od * od + 1); ay += (u.y - o.y) / (od * od + 1); } }
        gx = ax; gy = ay; side = u.strafeSign; mult = 0.8; // backing off while facing them is slower than running (else a shooter could kite for ever)
        // backing off into a wall or a corner: slide out along the open side instead of pressing into it
        const gl = Math.hypot(gx, gy);
        if (gl > 1e-6 && clearance(w, u, gx / gl, gy / gl, 120) < 90) {
          const oa = openAngle(w, u, Math.atan2(gy, gx)); gx = gx / gl + Math.cos(oa) * 1.4; gy = gy / gl + Math.sin(oa) * 1.4;
        }
        break;
      }
      case 'strafe': {
        gx = -ty * u.strafeSign; gy = tx * u.strafeSign;
        const want = u.def.role === 'ranged' ? u.def.range * 0.75 : u.r + t.r + 50;
        const corr = clamp((d - want) / 80, -1, 1);
        gx += tx * corr; gy += ty * corr; mult = 0.8; break;
      }
      case 'flank': {
        const bx = t.x - Math.cos(t.facing) * (t.r + u.r + 8), by = t.y - Math.sin(t.facing) * (t.r + u.r + 8);
        [gx, gy] = goalVec(w, u, bx, by);
        if (Math.hypot(gx, gy) < 8) { gx = tx; gy = ty; mult = 0.3; }
        side = u.strafeSign; break;
      }
      case 'retreat': gx = -tx; gy = -ty; side = u.strafeSign; mult = d < 260 ? 0.7 : 0.9; break; // backpedalling is slower
    }
  }
  // round 15 (the Mob, "They are strongly attracted to each other"): a body further than MOB.leash from the middle of
  // the others leans back towards them, harder the further it is (past MOB.far it runs back: the branch above).
  if (mobGap > MOB.leash && !u.mobBack) {
    const k = clamp((mobGap - MOB.leash) / (MOB.far - MOB.leash), 0, 1), px = mobM.x - u.x, py = mobM.y - u.y, pl = Math.hypot(px, py) || 1, gl = Math.hypot(gx, gy);
    if (gl > 0.05 && mult > 0) { gx = gx / gl * (1 - k) + px / pl * k; gy = gy / gl * (1 - k) + py / pl * k; mult = mult + (MOB.rush - mult) * k; }
    else if (k > 0.35) { gx = px / pl; gy = py / pl; mult = 0.4 + (MOB.rush - 0.4) * k; } // (standing at its blow: it only leaves it once it is well apart)
  }
  // round 13, fear: terrified, it runs from whoever frightened it; while fear builds it backs off from them, more as it builds
  // round 14 ("Doesn't seem to back away"): from the first point of fear it backs away (at least FEAR.back of its walk,
  // all of it from about half full) and doesn't step back in; terrified, it runs from where the fright came from even
  // once the frightener is gone (u.fearFrom)
  const scare = !esc && !u.forcedGoal ? fearOf(u) : null;
  const from = scare || (u.fearT > 0 && !esc && !u.forcedGoal ? u.fearFrom : null);
  u.backing = false;
  if (from) {
    const fd = dist(u.x, u.y, from.x, from.y) || 1, ax = (u.x - from.x) / fd, ay = (u.y - from.y) / fd;
    if (u.fearT > 0) { gx = ax; gy = ay; mult = 1; side = 0; const gl = Math.hypot(gx, gy); if (clearance(w, u, gx / gl, gy / gl, 110) < 80) { const oa = openAngle(w, u, Math.atan2(ay, ax)); gx = Math.cos(oa); gy = Math.sin(oa); } }
    else if (fd < FEAR.reach * (0.4 + 0.6 * fillOf(u, 'fear')) && u.st.fear > 1) { // (it keeps further off the more afraid it is: 40% of FEAR.reach to all of it)
      const k = Math.min(1, FEAR.back + FEAR.pull * fillOf(u, 'fear')), gl = Math.hypot(gx, gy) || 1;
      gx = gx / gl * (1 - k) + ax * k; gy = gy / gl * (1 - k) + ay * k; mult = Math.max(mult, 0.5 + 0.4 * k); side = 0; u.backing = true;
    }
  }
  // round 14, confused: a lurch walks off the way it turned (only a forced goal, a door or a revive, overrides it)
  if (u.lurchT > 0 && !u.forcedGoal) { gx = Math.cos(u.lurchA); gy = Math.sin(u.lurchA); mult = CONFUSE.lurchSpeed; side = 0; }
  // formation, lightly: an archer nearer the enemy than the knight leans back towards him
  if (roleAlias(u) === 'archer' && heroic(w, u) && t && !u.forcedGoal && !scare) {
    const kn = w.units.find((o) => o.team === u.team && (o.kind === 'knight' || o.def.heroRole === 'tank') && alive(o));
    if (kn) {
      const da = dist(u.x, u.y, t.x, t.y), dk = dist(kn.x, kn.y, t.x, t.y);
      if (da < dk) { const kd = dist(u.x, u.y, kn.x, kn.y) || 1; const k = 0.45 * clamp((dk - da) / 120, 0, 1);
        const gl = Math.hypot(gx, gy) || 1; gx = gx / gl + (kn.x - u.x) / kd * k; gy = gy / gl + (kn.y - u.y) / kd * k; }
    }
  }
  const wants = Math.hypot(gx, gy) > 0.05 && mult > 0.2;
  u.navWant = wants; // for tools/nav.mjs
  const mv = Math.hypot(u.x - (u.lastX ?? u.x), u.y - (u.lastY ?? u.y)); u.lastX = u.x; u.lastY = u.y;
  u.stuckT = wants && mv < 12 * dt ? (u.stuckT || 0) + dt : Math.max(0, (u.stuckT || 0) - dt * 2);
  if (u.stuckT > 1.2) { u.unstickT = 0.6; u.unstickA = openAngle(w, u, Math.atan2(gy, gx)); u.stuckT = 0; u.path = null; } // out towards open floor
  if (u.unstickT > 0) { u.unstickT -= dt; gx = Math.cos(u.unstickA); gy = Math.sin(u.unstickA); mult = Math.max(mult, 0.7); }
  const [sx, sy] = steer(w, u, gx, gy, { side });
  drive(u, sx, sy, speedOf(u) * mult * (esc ? 1.1 : 1), dt, esc ? 2.2 : 1); // getting out of a telegraph is a scramble: quick to turn and go
}

// Momentum: the movement heading swings at the unit's turn rate, speed builds up and drops off,
// and a sharp turn bleeds speed. Nothing snaps.
function drive(u, sx, sy, want, dt, quick = 1) {
  const d = u.def;
  const k = 1 - Math.exp(-dt * 7);                // smooth the steering wish a little
  u.sdx += (sx - u.sdx) * k; u.sdy += (sy - u.sdy) * k;
  const m = Math.hypot(u.sdx, u.sdy);
  let goal = 0;
  if (m > 0.15 && want > 0) {
    const a = Math.atan2(u.sdy, u.sdx);
    const diff = wrapAngle(a - u.mvA);
    const turn = (d.turn || 5) * dt * quick * (u.spd < d.speed * 0.15 ? 2.2 : 1); // turning on the spot is quicker than mid-stride
    u.mvA = wrapAngle(u.mvA + clamp(diff, -turn, turn));
    goal = want * Math.min(1, m) * Math.max(0.2, Math.cos(Math.min(Math.PI / 2, Math.abs(diff))));
  }
  const acc = (d.accel || 250) * dt * quick;
  u.spd += clamp(goal - u.spd, -acc * 1.6, acc);
  if (u.spd < 0) u.spd = 0;
  u.dvx = Math.cos(u.mvA) * u.spd; u.dvy = Math.sin(u.mvA) * u.spd;
}

// ---------------------------------------------------------------- facing
function updateFacing(u, dt) {
  // round 14: a confused lurch swings it round to its random heading (quickly, but a turn you can see, not a snap);
  // terrified, it turns its back on what frightened it and faces the way it runs
  if (u.lurchT > 0 && !u.forcedGoal) { const d = wrapAngle(u.lurchA - u.facing), r = (u.def.face || 5) * 1.6 * dt; u.facing = wrapAngle(u.facing + clamp(d, -r, r)); return; }
  if (u.fearT > 0 && !u.forcedGoal) { if (u.spd > 4) { const d = wrapAngle(u.mvA - u.facing), r = (u.def.face || 5) * 1.6 * dt; u.facing = wrapAngle(u.facing + clamp(d, -r, r)); } return; }
  let want = null;
  const t = u.target;
  if (u.backing) { const s = fearOf(u); if (s) { const d = wrapAngle(angleTo(u.x, u.y, s.x, s.y) - u.facing), r = (u.def.face || 5) * dt; u.facing = wrapAngle(u.facing + clamp(d, -r, r)); return; } } // backing away: it keeps its eyes on what frightened it
  if (t && !u.forcedGoal) {
    const d = dist(u.x, u.y, t.x, t.y);
    // backing off after a hit keeps the face to the enemy (a backpedal), rather than turning round to run.
    // Facing the target switches on inside `reach` and only off again well outside it: without that gap a unit
    // hovering at the edge flipped between its target and its way of travel every tick (the rapid spinning).
    const reach = u.mode === 'retreat' ? 300 : u.def.role === 'ranged' ? u.def.range + 80 : 180;
    const near = u.mode === 'hold' || u.mode === 'kite' || d < (u.faceT ? reach + 90 : reach);
    u.faceT = near;
    if (near) want = angleTo(u.x, u.y, t.x, t.y);
  } else u.faceT = false;
  // with nothing to look at, face the way it's going, but only once properly moving (slowing to a stop it holds its
  // facing rather than following every small change of heading)
  if (want === null && u.spd > Math.max(8, u.def.speed * 0.3)) want = u.mvA;
  if (want === null) return;
  const rate = (u.def.face || 5) * dt;
  const diff = wrapAngle(want - u.facing);
  u.facing = wrapAngle(u.facing + clamp(diff, -rate, rate));
}

// ---------------------------------------------------------------- damage & statuses
function text(w, x, y, s, color = '#FFFFFF', size = 1, pop = false) {
  w.texts.push({ x, y, s: String(s), color, size, life: 0.9, max: 0.9, vy: -40, pop });
}
// Text above a unit: anchored on the unit, lifted 'up' towards the top of the screen (the renderer knows which way that is).
function textU(w, x, y, up, s, color = '#FFFFFF', size = 1, pop = false) {
  w.texts.push({ x, y, up, s: String(s), color, size, life: 0.9, max: 0.9, vy: -40, pop });
}
function puff(w, x, y, color, n = 8, spd = 90, size = 5, life = 0.5) {
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU, v = spd * rrange(0.3, 1);
    w.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * rrange(0.6, 1), max: life, size: size * rrange(0.6, 1.3), color });
  }
}

// Shaped particles: 'flame' (licks of fire that rise and shrink), 'spark' (impact streaks), 'shard' (ice).
function flames(w, x, y, n, spread = 14, up = 70) {
  for (let i = 0; i < n; i++) w.particles.push({ shape: 'flame', x: x + rrange(-spread, spread), y: y + rrange(-spread, spread) * 0.6,
    vx: rrange(-20, 20), vy: rrange(-20, 20), rise: up * rrange(0.6, 1.1), up: 0, life: rrange(0.35, 0.6), max: 0.6, size: rrange(5, 9), color: '#FF8A3D', drag: 0.97 });
}
function sparks(w, x, y, a, n, color = '#FFFFFF', big = 1) {
  for (let i = 0; i < n; i++) { const b = a + rrange(-0.9, 0.9), v = rrange(180, 360) * big;
    w.particles.push({ shape: 'spark', x, y, vx: Math.cos(b) * v, vy: Math.sin(b) * v, life: 0.16, max: 0.16, size: 3 * big, color, drag: 0.85 }); }
}

const KNOCK = 1.6; // every knockback, scaled (round 6: "more knockback, more physical juice")
const SHIELD_BEARERS = new Set(['paladin', 'tower', 'knight']); // heroes carrying a shield on the front
// Round 13 (lane S; the designer: "Need to separate damage taken vs damage blocked (deflections, shields, damage that
// didn't get through)"): what a shield, a block, armour, a ward, a dodge or being untouchable kept off a blow (not damage
// over time) is counted apart, as blocked (stats.js tallyBlock).
const blockedBy = (w, u, src, amt, o) => { if (w.stats && amt > 0 && !o.dot) tallyBlock(w, mobLead(u) || u, src, amt, o); }; // (round 15, the Mob: for the hero, whichever body it was)
export function hurt(w, u, amount, src, o = {}) {
  if (u && u.invulnT > 0 && alive(u) && amount > 0 && !u.ethereal) { blockedBy(w, u, src, amount, o); return 0; }
  if (!alive(u) || u.invulnT > 0 || amount <= 0 || u.ethereal) return 0;
  // round 15 (the Mob, mob.js): a blow on any of its bodies comes off the one pool (u.hp is the lead's). One blow, or
  // one tick of a zone, that catches several bodies lands in full on the first and MOB.share on each more; the same
  // for the statuses it carries.
  const pool = mobLead(u) || (u.bodies ? u : null);
  if (pool && !o.mobOnce) {
    const by = src || o.by || null, tag = (o.dot ? 'd:' : 'b:') + (o.pab || o.ab || o.stk || '');
    if (pool.blowAt === w.time && pool.blowBy === by && pool.blowTag === tag) { amount *= MOB.share; o = { ...o }; for (const s of BUILD_IDS) if (o[s]) o[s] *= MOB.share; }
    else { pool.blowAt = w.time; pool.blowBy = by; pool.blowTag = tag; }
    o = { ...o, mobOnce: true };
  }
  const me = pool || u; // (who the stats, the cheat-death hooks and the fall are for)
  if (u.def.cargo && !u.linkTo) { u.blowBy = src || null; u.blowT = w.time; } // lane W (round 14): the wagon itself was hit: its body circles won't count the same blow again (below)
  // round 10, chains (families.js): a body segment flinches, but the blow lands on its head (no shove: it follows)
  if (u.linkTo) { if (!alive(u.linkTo)) return 0; u.flashT = 0.12; u.hitT = 0.16; u.hitA = src ? angleTo(src.x, src.y, u.x, u.y) : 0; u.hitX = u.x; u.hitY = u.y;
    if (u.def.rig) { const h = u.linkTo, by = src || null; if (h.blowBy === by && w.time - h.blowT < (src ? 0.2 : 1e-6)) return 0; h.blowBy = by; h.blowT = w.time; } // lane W (round 14): the wagon's body circles: one blow that catches several lands once
    return hurt(w, u.linkTo, amount * (u.def.segTaken ?? 0.6), src, { ...o, knock: 0 }); }
  // a brain leech's host (round 9, foes9.js): its friends' blows go to the leech; the shove still lands (a hard one
  // knocks the leech off)
  if (u.charmed && src && src.team === u.trueTeam && !o.dot && alive(u.charmed)) {
    if (o.knock && !knockImmune(u)) { const a = o.kAngle != null ? o.kAngle : angleTo(src.x, src.y, u.x, u.y), k = o.knock * KNOCK / u.mass; u.kx += Math.cos(a) * k; u.ky += Math.sin(a) * k; }
    return hurt(w, u.charmed, amount, src, { ...o, knock: 0 });
  }
  if (src && src !== u && !o.dot && !o.hexTurned && !o.noHex) {
    if (src.radiantT > 0) { if (AUDIT.on) AUDIT.on('nullified', w, u, src, amount, { why: 'radiant' }); return 0; } // radiant: its glow is all it can do
    // round 13, charm: while it builds, a unit can't hurt whoever is charming it (its blow turns into a little heart)
    if (src.st && src.st.charm >= CHARM.guard && src.stBy && src.stBy.charm === u && src.flipKind !== 'charm') {
      if (rand() < 0.3) w.particles.push({ x: u.x + rrange(-6, 6), y: u.y - u.r * 0.4, vx: 0, vy: 0, rise: 40, up: 0, life: 0.5, max: 0.5, size: 4.5, color: STATUS.charm.col, shape: 'heart' });
      if (AUDIT.on) AUDIT.on('nullified', w, u, src, amount, { why: 'charm' });
      return 0;
    }
    if (alive(src) && hexFires(w, src)) { // hexed: the blow turns on the one who struck it
      const room = Math.max(0, src.maxHp * CURSE.selfCap - (src.hexSelf || 0)), self = Math.min(amount * CURSE.selfMul, room);
      src.hexSelf = (src.hexSelf || 0) + self;
      if (self > 0) hurt(w, src, self, null, { noDodge: true, hexTurned: true, color: STATUS.curse.col });
      if (AUDIT.on) AUDIT.on('nullified', w, u, src, amount, { why: 'hex' });
      return 0;
    }
  }
  if (u.team === 'enemy') wake(w, u);
  if (u.sleepT > 0 && !o.dot && !(u.deepT > 0)) u.sleepT = 0; // (round 13: Sleepy's sleep can't be broken for its first seconds)
  // a hook can make the blow miss entirely (Blink Stone)
  if (!o.dot && hooksOf(u).some((h) => h.evade && h.evade(w, u, src, amount, o))) { blockedBy(w, u, src, amount, o); return 0; }
  // someone guarding this unit takes part of the blow
  if (u.guardBy && u.guardT > 0 && alive(u.guardBy) && !o.dot && !o.guarded) {
    const share = amount * (u.guardShare || 0.4); amount -= share;
    hurt(w, u.guardBy, share, src, { ...o, guarded: true, knock: 0 });
  }
  if (u.act && u.act.type === 'drink' && !o.dot) u.act = null;
  if (src && !o.dot && src.buffs && src.buffs.some((b) => b.blind) && chance(0.6)) { textU(w, u.x, u.y, u.r, 'miss', '#CFE8FF', 0.8); blockedBy(w, u, src, amount, o); return 0; } // blinded (kits2: Digger's dirt, Bandit's smoke)
  if (!o.dot && !o.noDodge && u.def.dodge && chance(u.def.dodge)) { textU(w, u.x, u.y, u.r, 'dodge', '#CFE8FF', 0.8); blockedBy(w, u, src, amount, o); return 0; }
  let amt = amount;
  if (src && alive(src)) { for (const h of hooksOf(src)) if (h.dealt) amt = h.dealt(w, src, u, amt, o); amt *= blowMul(src); }
  if (u.st.curse > 0) amt *= 1 + CURSE.taken * fillOf(u, 'curse');             // cursed: blows land harder
  if (src && src.def.charmBonus && (u.st.charm > 0 || u.flipKind === 'charm')) amt *= 1 + src.def.charmBonus; // the Succubus: harder on the charmed (round 13)
  let kept = 0; // what the defences below keep off (round 13: counted as blocked)
  for (const h of hooksOf(u)) if (h.taken) { const b = amt; amt = h.taken(w, u, src, amt, o); if (amt < b) kept += b - amt; }
  { const m = buffMul(u, 'taken'); if (m < 1) kept += amt * (1 - m); amt *= m; }
  if (u.koT > 0) amt *= 1.5;                                 // knocked out: wide open
  if (u.frozenT > 0 && u.frozenBonus) amt *= u.frozenBonus;  // Frost Nova III
  if (!o.dot && src) for (const b of u.buffs) if (b.frontBlock && angleDiff(angleTo(u.x, u.y, src.x, src.y), u.facing) < 1.3) {
    kept += amt * b.frontBlock; amt *= 1 - b.frontBlock; u.blockedAt = w.time; if (b.reflect && alive(src) && src !== u) hurt(w, src, amount * b.reflect, u, { noDodge: true, dot: true, pab: b.id }); // (lane H1, round 13: pab, so the stats name the ability)
  }
  // where the blow comes from: a shot's own heading, else the line from whoever struck
  const fromA = o.kAngle != null && (o.shot || !src) ? o.kAngle : src ? angleTo(src.x, src.y, u.x, u.y) : o.kAngle != null ? o.kAngle : rand() * TAU;
  let onShield = false; // the blow landed on a raised shield (the hit shows there, not through it)
  const shield = u.shield ?? u.def.shield; // u.shield / u.shieldArc: a shield raised as an action (brains set them)
  if (!o.dot && shield && src) {
    const a = angleTo(u.x, u.y, src.x, src.y);
    if (angleDiff(a, u.facing) < (u.shieldArc ?? 1.25)) { kept += amt * shield; amt *= 1 - shield; onShield = true; u.blockedAt = w.time; }
  }
  if (!o.dot && src && !onShield && (u.buffs.some((b) => b.frontBlock) || SHIELD_BEARERS.has(u.kind)) && angleDiff(fromA + Math.PI, u.facing) < 1.1) onShield = true;
  // shatter: a hard hit on a frozen unit
  if (u.frozenT > 0 && !o.dot && (o.heavy || amount >= 12 || (o.knock || 0) >= 150)) shatter(w, u, src);
  // Armour (round 11; round 13, the designer: "A combination of the 2. % and fixed?"): each point takes one point off a
  // blow and ARMOUR_PCT (2%) off it as well, the whole cut never more than ARMOUR_CAP of the blow. A blow marked heavy,
  // or a critical one, gets past half of both. Burning, poison and the like (damage over time) ignore it.
  if (!o.dot && u.armor > 0) { const c = armourCut(u.armor * (src && (mobLead(src) || src.bodies) ? MOB.armour : 1), amt, o.heavy || o.crit); kept += c; amt -= c; } // (round 15, the Mob: armour's points count once across its four small blows, not four times)
  if (kept > 0) blockedBy(w, u, src, kept, o);
  u.hp -= amt;
  if (w.stats) tallyHurt(w, me, src, amt, o);
  if (!o.dot) cue('hit', u, src, { amt, crit: o.crit, heavy: o.heavy, shot: o.shot, blocked: u.blockedAt === w.time });
  if (!o.dot) {
    u.hitT = 0.16; u.hitA = fromA; u.hitBlock = onShield; u.hitZap = !!o.shock; // (the renderer: no star for lightning, round 10)
    // the impact point: on the body's edge facing the blow, or on the shield's face (pushed out a little further)
    const back = fromA + Math.PI;
    const sa = onShield ? u.facing + clamp(wrapAngle(back - u.facing), -0.7, 0.7) : back;
    const sr = o.omni ? 0 : onShield ? u.r * 1.05 + 4 : u.r * 0.85; // omni: a blow from everywhere at once (Smite, round 9)
    u.hitX = u.x + Math.cos(sa) * sr; u.hitY = u.y + Math.sin(sa) * sr;
    const big = o.heavy || o.crit || amt >= 14;
    if (o.omni) { u.hitOmni = true; for (let i = 0; i < 6; i++) sparks(w, u.x, u.y, i / 6 * TAU, 1, o.crit ? '#FFE14D' : '#FFFBEA', 1); }
    else if (onShield) sparks(w, u.hitX, u.hitY, sa, 6, '#FFF4C8', 1.1); // a clang: sparks thrown back off the shield
    else { u.hitOmni = false; sparks(w, u.hitX, u.hitY, fromA + (rand() < 0.5 ? Math.PI : 0), big ? 6 : 3, o.crit ? '#FFE14D' : '#FFFFFF', big ? 1.2 : 0.9); }
    if (big) puff(w, u.hitX, u.hitY, '#EDE6D6', 4, 90, 4, 0.3);
    // punch without freezing the game: only a crit holds the frame, and only a hair; the shake is small
    if (o.crit) w.hitstop = Math.max(w.hitstop, 0.025);
    if (big) w.shake = Math.max(w.shake, 1.5);
    // the body reacts: its stride breaks for a moment (heroes only on big hits, so a swarm can't pin them in place)
    if (!heroic(w, u) || big) { u.flinchT = Math.max(u.flinchT || 0, onShield ? 0.06 : big ? 0.2 : 0.1); u.spd *= onShield ? 0.85 : 0.6; }
    if (src && (src.kind === 'knight' || src.def.heroRole === 'tank') && (w.battle ? u.team !== src.team : u.team === 'enemy')) { u.tauntBy = src; u.tauntT = 3; }
    u.flashT = 0.12; textU(w, u.x + rrange(-6, 6), u.y, u.r + 4, Math.round(amt), o.crit ? '#FFE14D' : '#FFFFFF', o.crit ? 1.3 : 1, true); }
  else if (!o.quiet) { u.dotAcc += amt; if (u.dotAcc >= 4) { textU(w, u.x, u.y, u.r, Math.round(u.dotAcc), o.color || '#FF9A55', 0.75); u.dotAcc = 0; } }
  if (src && alive(src)) { const ls = src.buffs.reduce((a, b) => a + (b.lifesteal || 0), 0); if (ls) heal(w, src, amt * ls, src); }
  if (o.knock && !knockImmune(u)) {
    const a = o.kAngle != null ? o.kAngle : src ? angleTo(src.x, src.y, u.x, u.y) : rand() * TAU;
    // round 6: more knockback all round; a shield takes some of the shove; soaked units fly further
    const k = o.knock * KNOCK / u.mass * (u.st.wet > 60 ? 1.7 : 1) * (onShield ? 0.6 : 1);
    u.kx += Math.cos(a) * k; u.ky += Math.sin(a) * k;
  }
  if (!o.dot && u.st.bleed > 0) u.bleedHoldT = BLEED.holdT; // bleeding: every blow keeps it from wearing off (round 13)
  for (const s of BUILD_IDS) if (o[s]) addStatus(w, u, s, o[s], src, true);
  if (!o.dot && src && u.def.struck && alive(u)) u.def.struck(w, u, src, amt, o); // an enemy that answers a blow (round 13: the Succubus)
  if (!o.dot && src && src !== u && src.team !== u.team && alive(src)) for (const b of u.buffs) if (b.charmBack) addStatus(w, src, 'charm', b.charmBack, u); // round 13: the Enchantress's Sweetheart
  if (src && src.hitBurn && !o.dot && src !== u) addStatus(w, u, 'burn', src.hitBurn, src); // round 9: a burning Elder Ent's every blow burns
  if (src && alive(src) && !o.dot) for (const h of hooksOf(src)) if (h.hit) h.hit(w, src, u, amt, o);
  if (!o.dot) for (const h of hooksOf(u)) if (h.struck) h.struck(w, u, src, amt, o);
  if (u.hp <= 0 && hooksOf(me).some((h) => h.downed && h.downed(w, me, src))) return amt;
  if (u.hp <= 0) { if (w.stats) tallyDown(w, me, src, o); kill(w, me, src); }
  return amt;
}

export function addStatus(w, u, type, amount, src, fromBlow) {
  if (!alive(u) || u.ethereal || immuneTo(u, type)) return;
  // round 15 (the Mob): a status lands on the hero whichever body it caught (its bursts hold all four); one cloud or
  // one pool of fire that several bodies stand in builds in full for the first and MOB.share for each more (a blow's
  // statuses were shared out already: hurt)
  if (mobLead(u) || u.bodies) {
    const l = mobLead(u) || u;
    if (!fromBlow) { const by = src || null, m = l.stAt || (l.stAt = {}); if (m[type] === w.time && l.stBy0 === by) amount *= MOB.share; else { m[type] = w.time; l.stBy0 = by; } }
    u = l;
  }
  if (u.linkTo) { if (alive(u.linkTo)) addStatus(w, u.linkTo, type, amount * (u.def.segTaken ?? 0.6), src); return; } // a chain's segment: its head takes it
  if (type === 'radiance' && (u.radiantT > 0 || u.radImmuneT > 0)) return; // glowing, or just was: its own aura can't feed it
  if (type === 'entangle' && u.tangleImmuneT > 0) return; // held fast already (an entangle root), or just got free
  if (NEW_BURSTS.has(type) && u[type + 'ImmuneT'] > 0) return; // round 13: just burst
  if (type === 'charm' && (u.flipKind === 'charm' || charmProof(u))) return; // enthralled already; round 14: "Bosses immune to charm"
  const res = (u.def.res && u.def.res[type]) ?? 1;
  const s = u.st;
  noteStatus(u, type, src); // its ticks and bursts count for whoever put it on (stats.js)
  if (type === 'chill' && s.wet > 30) amount *= 1.5;          // wet freezes easier
  if (type === 'shock' && s.wet > 30 && src) for (const h of hooksOf(src)) if (h.shockMul) amount *= h.shockMul;
  s[type] = (s[type] || 0) + amount * res;
  if (AUDIT.on) AUDIT.on('status', w, u, src, amount * res, { type }); // (round 16: tools/audit)
  const need = needOf(u, type), after = STATUS[type].after;
  const burst = () => { (u.bursts || (u.bursts = {}))[type] = w.time; if (AUDIT.on) AUDIT.on('burst', w, u, src, 0, { type }); }; // the HUD ring flashes when it bursts
  if (type === 'wet') {
    s.poison *= 0.5;                                             // water washes poison off
    if (s.wet >= need) {                                         // soaked through: slips, spins, leaves a puddle
      s.wet = after; burst(); u.act = { type: 'slip', t: 1, max: 1 }; u.stunT = Math.max(u.stunT, 1);
      // no new puddle on top of one: slipping in a puddle used to make puddles that soak and slip again, without end
      if (!w.hazards.some((h) => h.type === 'water' && dist(u.x, u.y, h.x, h.y) < h.r + 20)) w.hazards.push({ type: 'water', x: u.x, y: u.y, r: 42, t: 6, max: 6 });
      textU(w, u.x, u.y, u.r + 10, 'SLIP', '#8FD3FF', 1);
    }
    return;
  }
  if (type === 'shock') {
    if (s.shock >= need) {                                       // overload: a long jolt that arcs to two friends close by
      s.shock = after; burst(); stun(w, u, 1.0); u.act = null;
      textU(w, u.x, u.y, u.r + 12, 'OVERLOAD', STATUS.shock.col, 1.2);
      // (round 11: an arc that overloads its target doesn't arc again. With shock built up fast enough two units used to
      // overload each other back and forth without end, until the game fell over.)
      if (!arcing) {
        arcing = true;
        try {
          const near = w.units.filter((o) => o !== u && alive(o) && !o.ethereal && o.team === u.team && dist(o.x, o.y, u.x, u.y) < 140).slice(0, 2);
          for (const o of near) { fx(w, { type: 'beam', kind: 'lightning', x1: u.x, y1: u.y, x2: o.x, y2: o.y, max: 0.25 }); addStatus(w, o, 'shock', 30, src); }
        } finally { arcing = false; }
      }
    }
    return;
  }
  if (type === 'stagger') {
    u.stunT = Math.max(u.stunT, u.def.boss ? 0.05 : 0.15);
    if (s.stagger >= need) { s.stagger = after; burst(); u.koT = u.def.boss ? 1.2 : 2.5; u.stunT = Math.max(u.stunT, u.koT); u.act = null; textU(w, u.x, u.y, u.r + 12, 'KO', '#FFE7A0', 1.2); }
    return;
  }
  if (type === 'radiance') {
    if (s.radiance >= need) {                                    // RADIANT: a glow that can't attack, making others radiant
      s.radiance = after; burst(); u.radiantT = RADIANCE.auraT; u.act = null;
      textU(w, u.x, u.y, u.r + 12, 'RADIANT', STATUS.radiance.col, 1.2);
      fx(w, { type: 'aura', kind: 'radiance', unit: u, x: u.x, y: u.y, r: RADIANCE.auraR, max: RADIANCE.auraT });
    }
    return;
  }
  if (type === 'entangle') {
    if (s.entangle >= need) {                                    // TANGLED: rooted, attacks slowly, hurts, and more when it attacks
      // round 13 (lane S; the designer: "Tangled and rooted are the same thing"): the burst ROOTS, the one rooted state
      // every root uses (no tangled timer any more), and the vines squeeze once as they close
      const T = u.def.boss ? ENTANGLE.rootT * 0.4 : ENTANGLE.rootT;
      s.entangle = after; burst(); u.rootT = Math.max(u.rootT || 0, T); u.tangleImmuneT = T + ENTANGLE.immuneT; if (u.act && u.act.type !== 'drink') u.act = null;
      hurt(w, u, ENTANGLE.squeeze, null, { dot: true, color: STATUS.entangle.col, by: src, stk: 'entangle' });
      textU(w, u.x, u.y, u.r + 12, 'ROOTED', STATUS.entangle.col, 1.2);
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; w.particles.push({ x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: -Math.cos(a) * 30, vy: -Math.sin(a) * 30, life: 0.6, max: 0.6, size: 4, color: '#7FA04A' }); }
    }
    return;
  }
  if (type === 'charm') { if (s.charm >= need) { s.charm = after; burst(); charmBurst(w, u, src); } return; }
  if (type === 'confuse') { if (s.confuse >= need) { s.confuse = after; burst(); addledBurst(w, u); } return; }
  if (type === 'sleepy') {
    if (s.sleepy >= need) {                                      // falls asleep (the Lullaby's sleep: a blow wakes it)
      const T = u.def.boss ? SLEEPY.sleepT * 0.4 : SLEEPY.sleepT;
      s.sleepy = after; burst(); u.sleepT = Math.max(u.sleepT, T); u.deepT = u.def.boss ? 0.6 : SLEEPY.deepT; u.sleepyImmuneT = T + SLEEPY.immuneT; if (u.act && u.act.type !== 'drink') u.act = null;
      textU(w, u.x, u.y, u.r + 12, 'ASLEEP', STATUS.sleepy.col, 1.2);
      fx(w, { type: 'statusBurst', kind: 'sleepy', unit: u, x: u.x, y: u.y, r: u.vr, max: 1 });
    }
    return;
  }
  if (type === 'bleed') { if (s.bleed >= need) { s.bleed = after; burst(); haemorrhage(w, u, src); } return; }
  if (type === 'shackle') { if (s.shackle >= need) { s.shackle = after; burst(); shackleBurst(w, u, src); } return; } // round 15 (lane N)
  if (type === 'fear') { if (spreading) u.fearGenIn = Math.max(u.fearGenIn || 0, spreading); if (s.fear >= need) { s.fear = after; burst(); terrify(w, u, src); } return; }
  if (type === 'curse') {
    if (s.curse >= need) {                                       // HEXED: the next attack, heal or summon turns on it
      s.curse = after; burst(); u.hexed = true; u.hexT = CURSE.armT;
      textU(w, u.x, u.y, u.r + 12, 'HEXED', STATUS.curse.col, 1.2);
      fx(w, { type: 'hex', kind: 'arm', unit: u, x: u.x, y: u.y, r: u.vr * 1.3, max: 0.8 });
    }
    return;
  }
  if (type === 'burn') {
    if (u.frozenT > 0) { u.frozenT = 0; s.chill = 0; puff(w, u.x, u.y, 'rgba(235,240,245,0.8)', 10, 60, 9, 0.8); textU(w, u.x, u.y, u.r, 'thaw', '#DDEAF2', 0.8); }
    s.chill = Math.max(0, s.chill - amount);
    if (s.burn >= need) { s.burn = after; burst(); textU(w, u.x, u.y, u.r + 12, 'SCORCH', '#FF7A2F', 1.2); flames(w, u.x, u.y, 10, u.vr * 0.8, 90); hurt(w, u, 22, src, { noDodge: true, noHex: true, stk: 'burn', proc: true }); /* (proc: a scorch never sets off on-hit hooks again: with a fire-weak target that looped for ever) */ explode(w, u.x, u.y, 60, 10, { burn: 24, stk: 'burn' }, src, '#FF7A2F', u); }
  } else if (type === 'chill') {
    if (s.chill >= need && u.frozenT <= 0) {
      u.frozenT = u.def.boss ? 1.6 : 3; s.chill = after; s.burn = 0; u.freezeImmune += 45; u.act = null; burst();
      textU(w, u.x, u.y, u.r + 12, 'FREEZE', '#7FD6F5', 1.2); puff(w, u.x, u.y, '#BFEFFF', 10, 70, 4);
    }
  } else if (type === 'poison') {
    // round 11: no more 15% of its health at once. It is SICKENED: drained slowly, weaker and slower for a while.
    if (s.poison >= need) { s.poison = after; burst(); textU(w, u.x, u.y, u.r + 12, 'SICK', '#9BCB3C', 1.2); u.sickT = POISON.sickT; }
  }
}

// ---- round 13 (lane S): the new bursts (statuses.js has every number, docs/STATUSES.md the rules in words)
const NEW_BURSTS = new Set(['charm', 'confuse', 'sleepy', 'bleed', 'fear', 'shackle']);
// Round 14 ("Bosses immune to charm"): a boss, a floor's mini-boss and a boss's parts take no charm at all.
export const charmProof = (u) => !!(u.def.boss || u.def.part || u.mini || u.floorFoe);
function charmBurst(w, u, src) {
  const by = src && alive(src) ? src : null;
  const others = w.units.some((o) => o !== u && alive(o) && !o.summon && !o.ethereal && o.team === u.team);
  u.charmImmuneT = CHARM.immuneT;
  // round 14: an enemy is turned even when it is the last of its side (dungeon.js: the room then counts as won and it
  // follows the party on). Only the party's last hero standing, and in a battle the last unit of either side, swoons:
  // turned, there would be no one left fighting on its own side (a run would sit for 5 s; a battle would have nobody to fight).
  const lastStands = !others && (w.battle || heroic(w, u));
  if (!by || by.team === u.team || u.def.boss || u.def.noFlip || lastStands) { // SMITTEN: only swoons
    stun(w, u, CHARM.smitT); textU(w, u.x, u.y, u.r + 12, 'SMITTEN', STATUS.charm.col, 1.2);
  } else {
    const dur = CHARM.dur * (u.major || u.mini ? CHARM.major : u.elite ? CHARM.elite : 1);
    if (u.charmed) { const l = u.charmed; u.charmed = null; if (l.host === u) { l.host = null; l.mass = l.def.mass; } } // (a leech's hold is broken)
    turnSide(w, u, by.team, 'charm', by, dur); u.charmImmuneT = dur + CHARM.immuneT;
    textU(w, u.x, u.y, u.r + 12, 'CHARMED', STATUS.charm.col, 1.2);
  }
  fx(w, { type: 'statusBurst', kind: 'charm', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.9 });
}
// Round 15 (lane N): SHACKLED (statuses.js SHACKLE has the rule and every number). The irons lock: no basic attack for
// its time (step holds the attack clock; tryAttack and flail refuse), and every ability cooldown it has is set back by a
// share of that ability's own length, once, now. No word pops up: the irons show (fx3.js).
function shackleBurst(w, u, src) {
  const boss = !!(u.def.boss || u.def.part), k = boss ? SHACKLE.boss : u.major || u.mini ? SHACKLE.major : u.elite ? SHACKLE.elite : 1, T = SHACKLE.dur * k;
  const back = boss ? SHACKLE.bossSetback : SHACKLE.setback;
  u.shackledT = Math.max(u.shackledT || 0, T); u.shackledMax = T; u.shackleImmuneT = T + (boss ? SHACKLE.bossImmuneT : SHACKLE.immuneT);
  u.shackleBy = src && alive(src) ? src : null;
  if (u.kit) kitSetBack(u, back);
  else if (u.def.abilCd) u.abilT = Math.min(Math.max(u.def.abilCd, u.abilT), Math.max(0, u.abilT) + back * u.def.abilCd);
  if (u.def.dashCd) u.dashT = Math.min(Math.max(u.def.dashCd, u.dashT || 0), Math.max(0, u.dashT || 0) + back * u.def.dashCd);
  setBackDue(u, back);
  if (u.act && (u.act.type === 'windup' || u.act.type === 'drink')) u.act = null; // (a blow it was winding up is stopped in its hands)
  fx(w, { type: 'k2', draw: 'shackleSnap', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.7 }); // (fx3.js: the irons snapping shut)
  if (src && alive(src)) for (const h of hooksOf(src)) if (h.shackled) h.shackled(w, src, u, T); // (the Warden's trait)
}
function addledBurst(w, u) {
  const T = u.def.boss ? CONFUSE.addledT * 0.4 : CONFUSE.addledT;
  u.addledT = T; u.confuseImmuneT = T + CONFUSE.immuneT;
  textU(w, u.x, u.y, u.r + 12, 'ADDLED', STATUS.confuse.col, 1.2);
  fx(w, { type: 'statusBurst', kind: 'confuse', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.8 });
  // (round 14: no more every ability at once: addledTick lets one off at random now and then while it lasts)
}
// Addled, each tick (round 14, the designer: "will have a chance to trigger randomly while bursted"): now and then one
// ready ability goes off by itself, picked at random (heroes' kits; an enemy's own move), worth it or not.
function addledTick(w, u, dt) {
  if (u.act || u.forcedGoal) return false;
  const n = u.kit ? kitReady(u) : u.def.ability && u.abilT <= 0 ? 1 : 0;
  if (!n || !chance(dt * CONFUSE.trigger * (n > 1 ? 2 : 1))) return false;
  if (u.kit) return kitFireRandom(w, u);
  if (!u.target || !alive(u.target)) { const o = opponents(w, u).sort((a, b) => dist(u.x, u.y, a.x, a.y) - dist(u.x, u.y, b.x, b.y))[0]; if (!o) return false; u.target = o; }
  useAbility(w, u); return true;
}
function haemorrhage(w, u, src) {
  let loss = Math.max(0, u.hp) * BLEED.burst;
  if (u.def.boss) loss = Math.min(loss, u.maxHp * BLEED.bossCap);
  u.bleedImmuneT = BLEED.immuneT;
  textU(w, u.x, u.y, u.r + 12, 'HAEMORRHAGE', STATUS.bleed.col, 1.2);
  fx(w, { type: 'statusBurst', kind: 'bleed', unit: u, x: u.x, y: u.y, r: u.vr, max: 2, loss: loss / u.maxHp, hp0: u.hp / u.maxHp, a: u.hitA || 0 }); // (round 14: the burst's whole look is fx-status.js's, in the picked style; no sim particles)
  if (loss > 0) { hurt(w, u, loss, null, { dot: true, by: src, stk: 'bleed', color: STATUS.bleed.col, quiet: true }); textU(w, u.x, u.y, u.r + 2, '-' + Math.round(loss), '#FF6A5A', 1.3, true); }
}
function terrify(w, u, src) {
  u.fearImmuneT = FEAR.immuneT;
  textU(w, u.x, u.y, u.r + 12, u.def.boss ? 'COWERS' : 'TERRIFIED', '#EEF4E4', 1.2);
  fx(w, { type: 'statusBurst', kind: 'fear', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.8 });
  // an ability wasted: everything it had ready (or nearly) starts its cooldown again
  if (u.kit) for (const k in u.kit.cd) u.kit.cd[k] = Math.max(u.kit.cd[k], FEAR.waste);
  else if (u.def.abilCd) u.abilT = Math.max(u.abilT, Math.min(u.def.abilCd, FEAR.waste));
  if (u.def.boss) { stun(w, u, FEAR.bossT / 0.4); return; } // (stun() takes 60% off for bosses)
  u.fearT = FEAR.terrT; u.fearBy = src && alive(src) ? src : null; u.fearImmuneT = FEAR.terrT + FEAR.immuneT; if (u.act && u.act.type !== 'drink') u.act = null;
  // round 14: where the fright came from (it runs from there even once the frightener is gone), and how many hands this
  // panic has passed through (statusTick spreads it on, weaker each time)
  const f0 = u.fearBy || (u.stBy && u.stBy.fear && alive(u.stBy.fear) ? u.stBy.fear : null);
  u.fearFrom = f0 ? { x: f0.x, y: f0.y } : { x: u.x - Math.cos(u.facing) * 60, y: u.y - Math.sin(u.facing) * 60 };
  u.fearGen = u.fearGenIn || 0; u.fearGenIn = 0; u.lurchT = 0;
  u.el && (u.el.holdT = 0, u.el.then = null, u.el.rush = null); // (a tell or a rush it was in the middle of is dropped)
}
// Round 14 (the designer: "Will have a radius of fear around them giving other entities fear"): a terrified unit
// frightens its own side round it as it runs, weaker for every hand the panic has passed through (FEAR.spreadGen).
let spreading = 0; // the generation of fear being handed on right now (addStatus notes it on whoever takes it)
function fearSpread(w, u, dt) {
  const rate = FEAR.spread * FEAR.spreadGen ** (u.fearGen || 0); if (rate < 1) return;
  const by = u.fearBy && alive(u.fearBy) ? u.fearBy : null;
  spreading = (u.fearGen || 0) + 1;
  try { for (const o of w.units) if (o !== u && alive(o) && !o.ethereal && o.team === u.team && !o.summon && dist(o.x, o.y, u.x, u.y) < FEAR.spreadR + o.r) addStatus(w, o, 'fear', rate * dt, by); }
  finally { spreading = 0; }
}
// The one being afraid of: whoever frightened it last, while it's still about.
const fearOf = (u) => { const b = u.fearT > 0 ? u.fearBy : u.stBy && u.stBy.fear; return b && alive(b) && b.team !== u.team ? b : null; };

function shatter(w, u, src) {
  cue('shatter', u);
  u.frozenT = 0; u.st.chill = 0;
  textU(w, u.x, u.y, u.r + 14, 'SHATTER', '#BFEFFF', 1.3);
  u.hp -= 26; u.flashT = 0.15;
  if (w.stats) tallyHurt(w, u, src, 26, { stk: 'chill' });
  puff(w, u.x, u.y, '#E6F8FF', 18, 160, 5, 0.6);
  w.shake = Math.max(w.shake, 6);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + rand() * 0.3;
    w.projectiles.push({ kind: 'icicle', x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340,
      r: 5, team: 'neutral', owner: src, skip: u, dmg: 7, o: { chill: 30, noDodge: true }, life: 0.6 });
  }
}

export function explode(w, x, y, r, dmg, statuses, src, color, skip) {
  w.telegraphs.push({ type: 'blast', x, y, r, t: 0.25, max: 0.25, color });
  if (statuses.burn) { flames(w, x, y, 14, r * 0.6, 90); sparks(w, x, y, 0, 0); }
  else puff(w, x, y, color, 16, r * 3, 6, 0.45);
  w.shake = Math.max(w.shake, 4);
  for (const o of w.units) {
    if (!alive(o) || o === skip) continue;
    if (dist(x, y, o.x, o.y) > r + o.r) continue;
    const friendly = src && o.team === src.team;
    hurt(w, o, dmg * (friendly ? 0.4 : 1), src, { noDodge: true, knock: 110, kAngle: angleTo(x, y, o.x, o.y),
      ...Object.fromEntries(Object.entries(statuses).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, v * (friendly ? 0.4 : 1)])), stk: statuses.stk, by: statuses.by }); // (round 13, lane E: by, who to count it for when src is null on purpose)
  }
  if (statuses.burn) igniteAround(w, x, y, r);
}

function igniteAround(w, x, y, r) {
  for (const h of [...w.hazards]) {
    if (dist(x, y, h.x, h.y) > r + h.r) continue;
    if (h.type === 'oil') { h.type = 'fire'; h.t = 5; h.max = 5; }
    else if (h.type === 'gas') { w.hazards.splice(w.hazards.indexOf(h), 1); text(w, h.x, h.y, 'BOOM', '#FFB347', 1.3); explode(w, h.x, h.y, h.r * 1.35, 18, { burn: 30 }, null, '#FFB347'); }
  }
}

// Corpses lie where they land for a while, fading out over the last few seconds (render.js draws them).
const CORPSE_LIFE = 14, MAX_CORPSES = 40;
// Coins burst out in every direction and land well spread (a big random radius rather than a pile).
export function scatterCoins(w, x, y, n, reach = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU, d = rrange(30, 140) * reach;          // where it ends up, from the friction below
    w.pickups.push({ type: 'coin', x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 6, vx: Math.cos(a) * d * COIN_DRAG, vy: Math.sin(a) * d * COIN_DRAG, v: 1, hop: rrange(0.25, 0.45) });
  }
}
function kill(w, u, src) {
  // (round 11: once only. Two exploding minions side by side used to kill each other back and forth without end: each
  // blast hurt the other while it was still mid-death, until the game fell over.)
  if (mobLead(u)) u = mobLead(u); // round 15 (the Mob): the four fall as one
  if (u.dying) return;
  u.dying = true;
  const was = w.actor; w.actor = u; // (battle mode: what it leaves behind is its side's)
  try { killNow(w, u, src); } finally { w.actor = was; u._flipWas = null; if (!u.dead) u.dying = false; } // (a downed hero can fall again once it's back up)
}
function killNow(w, u, src) {
  u.hp = 0;
  // (round 13: anything flipped, charmed, befuddled or a leech's host, dies, drops and counts as what it really is)
  u._flipWas = u.trueTeam ? flipOf(u) : null; // (round 14: but what it splits into stays charmed: spawn)
  if (u.trueTeam) restoreSide(w, u);
  if (u.charmed) { const l = u.charmed; u.charmed = null; if (l.host === u) { l.host = null; l.mass = l.def.mass; } } // a leech's host goes down as itself
  if (u.host) { const h = u.host; u.host = null; if (h.charmed === u) { if (h.flipKind === 'leech') restoreSide(w, h); h.charmed = null; h.charmCd = 6; } } // a leech dies: its host is itself again
  if (src && src !== u && alive(src)) for (const h of hooksOf(src)) if (h.kill) h.kill(w, src, u);
  for (const o of w.units) if (o !== u && alive(o) && dist(o.x, o.y, u.x, u.y) < 260) for (const h of hooksOf(o)) if (h.death) h.death(w, o, u);
  if (u.boom) explode(w, u.x, u.y, 80, 16, {}, u.summonBy || null, '#9BE07A', u);
  if (!u.summon) {   // going down (a hero) or dying: its own hooks, then its side's
    for (const h of hooksOf(u)) if (h.fallen) h.fallen(w, u, src);
    for (const o of w.units) if (o !== u && o.team === u.team && alive(o)) for (const h of hooksOf(o)) if (h.allyDown) h.allyDown(w, o, u);
  }
  if (u.summon) { u.dead = true; puff(w, u.x, u.y, '#B8C8DA', 10, 80, 5, 0.5); return; } // summons just fade (blue-grey: ours, round 8)
  for (const b of u.bodies || []) { b.act = null; b.target = null; b.forcedGoal = null; b.later = null; } // round 15 (the Mob): its other bodies drop what they were doing
  if (u.team === 'hero' && !w.battle) {
    u.downed = true; u.act = null; u.frozenT = 0; u.st = freshStatuses(); u.hexed = false; u.radiantT = 0; u.tangledT = 0; u.sickT = 0; u.addledT = 0; u.fearT = 0; u.shackledT = 0;
    textU(w, u.x, u.y, u.r + 10, 'DOWN', '#FF8A80', 1.1);
    emit(w, 'heroDown', u);
    return;
  }
  u.dead = true;
  // The body is thrown by the killing blow (its knockback, plus a kick away from the killer so even a light blow
  // sends it sliding), spins as it flies, lands, and lies there fading slowly.
  const la = src && src !== u ? angleTo(src.x, src.y, u.x, u.y) : Math.atan2(u.ky, u.kx) || rand() * TAU;
  const kick = 140 / Math.max(0.6, u.mass);
  const cvx = u.kx * 1.3 + Math.cos(la) * kick, cvy = u.ky * 1.3 + Math.sin(la) * kick, cs = Math.hypot(cvx, cvy);
  // slimes leave no body (round 9)
  if (!u.def.noCorpse) for (const b of [u, ...(u.bodies || [])]) w.corpses.push({ kind: b.kind, x: b.x, y: b.y, r: b.r, vr: b.vr, facing: b.facing, tint: b.tint, kx: cvx * (b === u ? 1 : rrange(0.5, 1.1)), ky: cvy * (b === u ? 1 : rrange(0.5, 1.1)), // (round 15, the Mob: each body leaves its own)
    spin: (rand() < 0.5 ? -1 : 1) * Math.min(14, cs / 40), z: 0, vz: Math.min(260, 60 + cs * 0.45), age: 0, t: CORPSE_LIFE, max: CORPSE_LIFE });
  if (w.corpses.length > MAX_CORPSES) w.corpses.splice(0, w.corpses.length - MAX_CORPSES);
  // the body itself flies now: a small puff (a slime, which leaves no body, bursts into goo)
  puff(w, u.x, u.y, u.def.goo || (u.kind.startsWith('slime') ? '#6FA6E6' : u.kind === 'rat' ? '#9C8676' : '#EDE4CD'), u.def.noCorpse ? 14 : 6, 110, 4, 0.4);
  if (u.st.poison > 40) w.hazards.push({ type: 'gas', x: u.x, y: u.y, r: 52, t: 4, max: 4 });
  if (u.eliteDeath) u.eliteDeath(w, u); // an elite's own end (elites.js: the elite slime bursts into four)
  // splits (once: gen 0 only) into two of def.splitsInto (slimelets unless it says); u.noSplit stops it (a sludge
  // slime that dies burning); def.onSplit for what else it leaves (a poison slime's cloud)
  if (u.def.splits && u.gen === 0 && !(u.elite && u.eliteDeath) && !u.noSplit) {
    const into = u.def.splitsInto || 'slimeSmall';
    for (const s of [-1, 1]) {
      const c = spawn(w, into, u.x + s * 12, u.y + s * 4, { mult: w.mult, gen: DEFS[into].splits ? 0 : 1 });
      c.kx = s * 140; c.ky = rrange(-60, 60); if (u.aggro) c.aggro = true;
      if (u.minion) { c.minion = true; c.calledBy = u.calledBy; }
    }
    if (u.def.onSplit) u.def.onSplit(w, u);
  }
  const [c0, c1] = u.def.coins || [0, 0];
  const coins = Math.round(rint(c0, c1) * (u.coinMul ?? 1)); // elites drop a little less (round 7)
  if (!w.battle) scatterCoins(w, u.x, u.y, coins);
  emit(w, 'kill', u, src);
}

// ---------------------------------------------------------------- attacks & abilities
function inMeleeArc(u, o, extra = 0) {
  const d = dist(u.x, u.y, o.x, o.y) - u.r - o.r;
  if (d > (u.def.range + extra)) return false;
  return angleDiff(angleTo(u.x, u.y, o.x, o.y), u.facing) < (u.def.arc || 1.5) / 2 + 0.2;
}

function meleeSwing(w, u, single) {
  const d = u.def;
  if (d.aoe) { // a blow that lands on the ground in front: everything in a small circle there (round 9: the Berserker's flail)
    const cx = u.x + Math.cos(u.facing) * (u.r + d.range * 0.55), cy = u.y + Math.sin(u.facing) * (u.r + d.range * 0.55);
    u.lungeT = 0.18;
    w.telegraphs.push({ type: 'swing', x: u.x, y: u.y, r: u.r + d.range + 10, a: u.facing, arc: d.arc || 1.5, t: 0.16, max: 0.16, src: u, aoe: { x: cx, y: cy, r: d.aoe } });
    for (const o of w.units) if (alive(o) && o.team !== u.team && !o.ethereal && dist(cx, cy, o.x, o.y) < d.aoe + o.r)
      hurt(w, o, d.dmg * u.dmgMul * rrange(0.9, 1.1), u, { knock: d.knock || 40, kAngle: angleTo(cx, cy, o.x, o.y), heavy: d.heavy });
    return;
  }
  const wild = u.addledT > 0; // addled (round 13): the blow lands on friends as well
  const targets = single && !wild ? (u.target && inMeleeArc(u, u.target, 6) ? [u.target] : []) : w.units.filter((o) => alive(o) && o !== u && !o.ethereal && (o.team !== u.team || wild) && inMeleeArc(u, o, 6));
  u.lungeT = 0.18;
  w.telegraphs.push({ type: 'swing', x: u.x, y: u.y, r: u.r + d.range + 10, a: u.facing, arc: d.arc || 1.5, t: 0.16, max: 0.16, color: u.team === 'hero' ? '#FFFFFF' : '#FFD2C2', src: u });
  for (const o of targets) {
    hurt(w, o, hitDmg(u) * rrange(0.9, 1.1), u, { knock: d.knock || 40, heavy: d.heavy, poison: d.poison, radiance: d.radiance, curse: d.curse,
      burn: d.burn, entangle: d.entangle, stagger: d.stagger, wet: d.wet, chill: d.team === 'enemy' ? d.chill : 0,
      charm: d.charm, confuse: d.confuse, sleepy: d.sleepy, bleed: d.bleed, fear: d.fear, shackle: d.shackle }); // (round 13: the new five too; round 15: Shackled, the Warden's chain) // round 9: a def's blow can carry any build-up (round 10: an enemy's chill too, the frost wolf's bite)
  }
}

function fireArrow(w, u, angle, o = {}) {
  const sp = o.speed || 520;
  u.recoilT = 0.14;
  w.projectiles.push({ kind: o.fire ? 'fireArrow' : u.loveShots ? 'loveArrow' : (u.def.proj || 'arrow'), color: u.def.projColor, x: u.x + Math.cos(angle) * (u.r + 6), y: u.y + Math.sin(angle) * (u.r + 6), // (round 13: the elite Cupid's love arrows)
    vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp, r: 6, team: u.team, owner: u, dmg: o.dmg ? o.dmg * u.dmgMul : hitDmg(u),
    o: { chill: o.fire ? 0 : u.def.chill, burn: o.fire ? 20 : 0, radiance: u.loveShots ? 0 : u.def.radiance, curse: u.def.curse, charm: u.loveShots || u.def.charm, confuse: u.def.confuse, sleepy: u.def.sleepy, bleed: u.def.bleed, fear: u.def.fear, knock: 30 }, life: 1.2, a: angle });
}

// Confused (round 13): with an attack ready and nothing in reach, it swings or shoots at the air now and then.
function flail(w, u, dt) {
  if (u.atkT > 0 || u.act || u.forcedGoal || !(u.st.confuse > 10) || u.shackledT > 0) return false;
  const t = u.target, inReach = t && dist(u.x, u.y, t.x, t.y) - u.r - t.r <= (u.def.range || 30) + 2;
  if (inReach || !chance(dt * CONFUSE.flail * fillOf(u, 'confuse'))) return false;
  if (u.def.role === 'ranged') fireArrow(w, u, u.facing + rrange(-0.5, 0.5)); else meleeSwing(w, u, false);
  setAnim(u, u.def.attackAnim || (u.def.role === 'ranged' ? 'draw' : 'swing'), 0.3);
  u.atkT = u.def.atkCd * rrange(0.9, 1.1); u.lastAttackT = w.time;
  return true;
}
function tryAttack(w, u) {
  const t = u.target;
  if (!t || u.atkT > 0 || u.act || u.forcedGoal || u.shackledT > 0) return; // (round 15: Shackled, no basic attacks)
  const d = dist(u.x, u.y, t.x, t.y);
  const face = angleDiff(angleTo(u.x, u.y, t.x, t.y), u.facing);
  const def = u.def;
  if (def.role === 'ranged') {
    if (mirrorFront(w, u, t)) return; // (round 14: round to its side first: the mirror sends the shot back)
    if (d <= def.range && face < 0.35 && !blocked(w, u.x, u.y, t.x, t.y, u.team)) {
      const lead = d / 520;
      const aim = angleTo(u.x, u.y, t.x + t.vx * lead, t.y + t.vy * lead) + rrange(-0.04, 0.04);
      if (!(u.kit && heroAttack(w, u, t, aim))) fireArrow(w, u, aim); // kits.js: a hero's own attack (round 9), else a plain shot
      setAnim(u, def.attackAnim || 'draw', 0.32);
      u.atkT = def.atkCd * rrange(0.9, 1.1); u.lastAttackT = w.time;
    }
    return;
  }
  if (d - u.r - t.r <= def.range + 2 && face < 0.6) {
    if (def.windup) { u.act = { type: 'windup', t: def.windup, max: def.windup }; }
    else meleeSwing(w, u, def.role === 'skirmish');
    setAnim(u, def.attackAnim || (def.role === 'skirmish' ? 'thrust' : 'swing'), (def.windup || 0) + 0.28);
    u.atkT = def.atkCd * rrange(0.9, 1.1); u.lastAttackT = w.time;
    if (u.kind === 'slime' || u.kind === 'slimeSmall' || u.def.spriteOf === 'slime' || u.def.spriteOf === 'slimeSmall') { u.kx += Math.cos(u.facing) * 60; u.ky += Math.sin(u.facing) * 60; }
  }
}

function abilityScore(w, u) {
  const t = u.target; if (!t) return 0;
  const d = dist(u.x, u.y, t.x, t.y);
  const opp = opponents(w, u);
  switch (u.def.ability) {
    case 'barrage': {
      if (d > u.def.range || blocked(w, u.x, u.y, t.x, t.y)) return 0;
      const n = opp.filter((o) => dist(o.x, o.y, t.x, t.y) < 85).length;
      let fuel = 0; // fire arrows into oil or gas
      for (const h of w.hazards) if ((h.type === 'oil' || h.type === 'gas') && opp.some((o) => dist(o.x, o.y, h.x, h.y) < h.r + o.r)) fuel += 0.35;
      return (n - 1) * 0.45 + 0.08 + Math.min(0.7, fuel);
    }
    case 'charge': {
      if (d < 85 || d > 340) return 0;
      const a = angleTo(u.x, u.y, t.x, t.y);
      let n = 0;
      for (const o of opp) { const od = dist(u.x, u.y, o.x, o.y); const off = Math.abs(Math.sin(angleTo(u.x, u.y, o.x, o.y) - a)) * od; if (od < d + 40 && off < 40) n++; }
      const protect = t.target && t.target.team === (w.battle ? u.team : 'hero') && t.target !== u ? 0.25 : 0;
      // a hazard or wall just past the target: the charge will slam it into it
      let behind = 0;
      const bx = t.x + Math.cos(a) * 90, by = t.y + Math.sin(a) * 90;
      for (const h of w.hazards) if (h.type !== 'gas' && dist(bx, by, h.x, h.y) < h.r + 30) behind = 0.4;
      if (bx < 20 || by < 20 || bx > w.W - 20 || by > w.H - 20) behind = Math.max(behind, 0.25);
      return 0.25 + (n - 1) * 0.35 + protect + behind;
    }
    case 'shadowstep': {
      if (d < 70) return 0;
      return (1 - hpRatio(t)) * 0.6 + (t.target && t.target !== u ? 0.45 : 0) + (t.def.boss ? 0.1 : 0);
    }
    case 'dash': {
      const gap = d - u.r - t.r;
      if (gap < 35 || gap > 170) return 0;
      return angleDiff(u.mvA, angleTo(u.x, u.y, t.x, t.y)) < 0.5 && u.spd > 30 ? 0.7 : 0;
    }
    case 'slam': {
      const n = opp.filter((o) => dist(u.x, u.y, o.x, o.y) < 130).length;
      return n * 0.45 - 0.1;
    }
  }
  return 0;
}

function useAbility(w, u) {
  const t = u.target;
  const def = u.def;
  u.abilT = def.abilCd;
  switch (def.ability) {
    case 'barrage': {
      const base = angleTo(u.x, u.y, t.x, t.y);
      textU(w, u.x, u.y, u.r + 12, 'BARRAGE', '#FFB36B', 0.9);
      for (let i = 0; i < 7; i++) fireArrow(w, u, base + (i - 3) * 0.075 + rrange(-0.02, 0.02), { fire: true, dmg: 7, speed: 470 + i * 8 });
      setAnim(u, 'ability', 0.45);
      u.atkT = Math.max(u.atkT, 0.6);
      break;
    }
    case 'charge': {
      const a = angleTo(u.x, u.y, t.x, t.y);
      u.facing = a;
      if (!heroic(w, u)) {
        // an enemy shows its charge first (a lane on the floor the heroes can step out of), then goes
        const len = u.def.speed * 1.9 * 0.55;
        u.act = { type: 'chargeTell', t: 0.45, max: 0.45, a };
        addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, hw: u.r + 6, t: 0.45, team: u.team, src: u, kind: 'blade' });
        setAnim(u, 'ability', 0.45 + 0.55);
      } else u.act = { type: 'charge', t: 0.55, max: 0.55, a, hit: new Set() };
      break;
    }
    case 'shadowstep': {
      puff(w, u.x, u.y, 'rgba(60,40,90,0.85)', 14, 70, 8, 0.6);
      const back = t.facing + Math.PI;
      let nx = t.x + Math.cos(back) * (t.r + u.r + 6), ny = t.y + Math.sin(back) * (t.r + u.r + 6);
      nx = clamp(nx, u.r, w.W - u.r); ny = clamp(ny, u.r, w.H - u.r);
      u.x = nx; u.y = ny; u.vx = u.vy = 0; u.facing = angleTo(u.x, u.y, t.x, t.y);
      u.spd = 0; u.mvA = u.facing; u.lungeT = 0.18;
      puff(w, u.x, u.y, 'rgba(60,40,90,0.85)', 14, 70, 8, 0.6);
      hurt(w, t, def.dmg * 3.2 * u.dmgMul, u, { crit: true, poison: 30, noDodge: true });
      setAnim(u, 'thrust', 0.3);
      textU(w, u.x, u.y, u.r + 12, 'BACKSTAB', '#C9A7FF', 0.9);
      u.atkT = def.atkCd; u.lastAttackT = w.time; u.mode = 'retreat'; u.modeT = 0;
      break;
    }
    case 'dash': {
      u.act = { type: 'dash', t: 0.22, max: 0.22, a: u.mvA };
      break;
    }
    case 'slam': {
      u.act = { type: 'slam', t: 0.8, max: 0.8 };
      w.telegraphs.push({ type: 'ring', x: u.x, y: u.y, r: 125, t: 0.8, max: 0.8, color: '#FF6B5A', src: u, wind: true });
      break;
    }
  }
}

const WIND_ACTS = new Set(['windup', 'chargeTell', 'slam']);
function runAction(w, u, dt) {
  const a = u.act;
  if (WIND_ACTS.has(a.type)) { u.winding = true; a.t -= dt / windMul(u); } else a.t -= dt; // round 14: sleepy, every wind-up runs slower
  if (a.type === 'windup') {
    u.dvx = u.dvy = 0;
    if (a.t <= 0) { u.act = null; meleeSwing(w, u, false); }
  } else if (a.type === 'charge') {
    const sp = u.def.speed * 1.9; // def.speed is already the round-6 (fast) walking speed
    u.dvx = Math.cos(a.a) * sp; u.dvy = Math.sin(a.a) * sp; u.vx = u.dvx; u.vy = u.dvy;
    if (rand() < 0.6) w.particles.push({ x: u.x - Math.cos(a.a) * u.r, y: u.y - Math.sin(a.a) * u.r, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 7, color: 'rgba(220,226,235,0.7)' });
    for (const o of w.units) {
      if (!alive(o) || o.team === u.team || a.hit.has(o)) continue;
      if (dist(u.x, u.y, o.x, o.y) < u.r + o.r + 6) {
        a.hit.add(o);
        const side = Math.sign(Math.sin(angleTo(u.x, u.y, o.x, o.y) - a.a)) || 1;
        hurt(w, o, (a.dmg ?? 18 * u.dmgMul) * (a.power || 1), u, { knock: 340 * (a.power || 1), kAngle: a.a + side * 0.6, heavy: true, stagger: a.stagger || 0, pab: a.ab }); // lane H1 (round 13) hook: a.ab names the ability for the stats, a.dmg its blow
        w.shake = Math.max(w.shake, 5);
      }
    }
    if (a.t <= 0) u.act = null;
  } else if (a.type === 'chargeTell') {
    u.dvx = u.dvy = 0; u.spd *= Math.exp(-dt * 12); u.facing = a.a;
    if (a.t <= 0) u.act = { type: 'charge', t: 0.55, max: 0.55, a: a.a, hit: new Set() };
  } else if (a.type === 'drink') {
    u.spd *= Math.exp(-dt * 6); u.dvx = Math.cos(u.mvA) * u.spd; u.dvy = Math.sin(u.mvA) * u.spd;
    if (a.t <= 0) { u.act = null; u.potions--; u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.45 * Math.max(0, 1 - CURSE.healCut * fillOf(u, 'curse'))); puff(w, u.x, u.y, '#E0604B', 10, 70, 5, 0.6); emit(w, 'drank', u); }
  } else if (a.type === 'dash') {
    const sp = u.def.speed * 2.1 * (a.slide ? 0.15 + 1.7 * Math.max(0, a.t) / a.max : 1); // a slide (the archer's Roll) eases out
    u.dvx = Math.cos(a.a) * sp; u.dvy = Math.sin(a.a) * sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = a.a; u.spd = sp;
    if (rand() < 0.5) w.particles.push({ x: u.x - Math.cos(a.a) * u.r, y: u.y - Math.sin(a.a) * u.r, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 5, color: 'rgba(200,190,170,0.7)' });
    if (a.t <= 0) { u.act = null; u.spd = u.def.speed; }
  } else if (a.type === 'leap') {
    const k = 1 - Math.max(0, a.t) / a.max;
    u.x = a.x0 + (a.x1 - a.x0) * k; u.y = a.y0 + (a.y1 - a.y0) * k; u.dvx = u.dvy = 0; u.vx = u.vy = 0;
    u.hop = Math.sin(Math.PI * k) * 40;                        // how high off the ground, for the renderer
    if (a.t <= 0) { u.act = null; u.hop = 0; a.land && a.land(); }
  } else if (a.type === 'channel') {
    u.dvx = u.dvy = 0; a.acc += dt;
    if (a.target && alive(a.target)) u.facing = angleTo(u.x, u.y, a.target.x, a.target.y);
    while (a.acc >= a.every && u.act === a) { a.acc -= a.every; a.tick(); }
    if (a.t <= 0 && u.act === a) u.act = null;
  } else if (a.type === 'slip') {
    u.dvx = u.dvy = 0; u.facing += dt * 14;
    if (a.t <= 0) u.act = null;
  } else if (a.type === 'slam') {
    u.dvx = u.dvy = 0;
    if (a.t <= 0) {
      u.act = null;
      textU(w, u.x, u.y, u.r + 14, 'SLAM', '#FF6B5A', 1.2);
      w.shake = Math.max(w.shake, 9);
      for (const o of w.units) if (alive(o) && o.team !== u.team && dist(u.x, u.y, o.x, o.y) < 125 + o.r)
        hurt(w, o, 20 * u.dmgMul, u, { knock: 260, heavy: true, noDodge: true });
      puff(w, u.x, u.y, '#D9CDB0', 24, 260, 7, 0.6);
    }
  }
}

// ---------------------------------------------------------------- statuses over time
function statusTick(w, u, dt) {
  const s = u.st;
  if (s.wet > 0) s.wet = Math.max(0, s.wet - STATUS.wet.decay * dt);
  if (s.stagger > 0) s.stagger = Math.max(0, s.stagger - STATUS.stagger.decay * dt);
  if (s.shock > 0) {                                             // a stun that comes back every so often, once it has built a little
    s.shock = Math.max(0, s.shock - STATUS.shock.decay * dt);
    u.shockT = (u.shockT ?? 0.4) - dt;
    if (u.shockT <= 0 && s.shock >= 20) { u.shockT = 1.1; u.stunT = Math.max(u.stunT, u.def.boss ? 0.1 : 0.3); sparks(w, u.x, u.y, rand() * TAU, 4, '#FFF27A', 0.8); }
  }
  if (s.radiance > 0) s.radiance = Math.max(0, s.radiance - STATUS.radiance.decay * dt);
  if (s.curse > 0) s.curse = Math.max(0, s.curse - STATUS.curse.decay * dt);
  // round 13 (lane S): the new five drain away (bleeding holds still while blows keep landing); the bursts run out
  for (const k of ['charm', 'confuse', 'sleepy', 'fear', 'shackle']) if (s[k] > 0) s[k] = Math.max(0, s[k] - STATUS[k].decay * dt); // (round 15: Shackled too)
  if (s.bleed > 0) {
    if (u.bleedHoldT > 0) u.bleedHoldT -= dt; else s.bleed = Math.max(0, s.bleed - STATUS.bleed.decay * dt);
    hurt(w, u, s.bleed * BLEED.dot * dt, null, { dot: true, color: STATUS.bleed.col, by: u.stBy && u.stBy.bleed, stk: 'bleed' });
    // (round 14: "Don't like visual at all": the drops it shed are gone; fx-status.js draws the bleeding, in three looks)
  }
  if (u.deepT > 0 && !(u.sleepT > 0)) u.deepT = 0;
  if (u.fearT > 0) fearSpread(w, u, dt); // round 14: the panic spreads to its own side round it
  if (!(s.fear > 0)) u.fearGenIn = 0;
  for (const k of ['deepT', 'addledT', 'fearT', 'lurchT', 'charmImmuneT', 'confuseImmuneT', 'sleepyImmuneT', 'bleedImmuneT', 'fearImmuneT', 'shackledT', 'shackleImmuneT']) if (u[k] > 0) u[k] = Math.max(0, u[k] - dt);
  if (u.flipUntil != null && w.time >= u.flipUntil) { // a charm (or a Befuddle) runs out: back to its own side
    const k = u.flipKind; restoreSide(w, u);
    if (k === 'charm') fx(w, { type: 'statusBurst', kind: 'uncharm', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.6 });
  }
  if (!alive(u)) return;
  entangleTick(w, u, dt);
  if (!alive(u)) return;
  if (u.radiantT > 0) {                                          // the radiant glow: everyone else close by turns radiant
    u.radiantT -= dt;
    if (rand() < dt * 10) w.particles.push({ x: u.x + rrange(-u.vr, u.vr), y: u.y + rrange(-u.vr, u.vr), vx: 0, vy: 0, rise: 40, up: 0, life: 0.7, max: 0.7, size: 4, color: '#FFF1B0' });
    for (const o of w.units) if (o !== u && alive(o) && !o.ethereal && dist(o.x, o.y, u.x, u.y) < RADIANCE.auraR + o.r) addStatus(w, o, 'radiance', RADIANCE.auraRate * dt, u);
    if (u.radiantT <= 0) { u.radiantT = 0; u.radImmuneT = RADIANCE.immuneT; }
  } else if (u.radImmuneT > 0) u.radImmuneT -= dt;
  if (u.hexed && (u.hexT -= dt) <= 0) u.hexed = false;           // an unused hex wears off
  for (const k of ['stunT', 'rootT', 'sleepT', 'koT', 'guardT', 'guardOfT', 'flinchT', 'gasT', 'focusT', 'charmCd']) if (u[k] > 0) u[k] = Math.max(0, u[k] - dt);
  const wm = windMul(u); // round 14: sleepy, a charged shot and anything else queued up comes slower
  if (u.aimT > 0) u.aimT = Math.max(0, u.aimT - dt / wm);
  for (const b of u.buffs) b.t -= dt;
  if (u.buffs.length) u.buffs = u.buffs.filter((b) => b.t > 0);
  if (u.regenT > 0) { u.regenT -= dt; heal(w, u, u.regenRate * dt, u.regenSrc, { pab: u.regenAb }); }
  if (u.leechT > 0) {                                            // leeches: drain this one, heal the leech-giver's side
    u.leechT -= dt; const got = hurt(w, u, 3 * dt * (u.leechMul || 1), u.leechBy, { dot: true, color: '#C8553D', pab: u.leechAb });
    const side = w.units.filter((a) => alive(a) && u.leechBy && a.team === u.leechBy.team).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (side) heal(w, side, got * 1.5 * (u.leechMul || 1), u.leechBy, { pab: u.leechAb });
  }
  if (u.lifeT != null) { u.lifeT -= dt; if (u.lifeT <= 0) { kill(w, u, null); return; } }
  if (u.later) { for (const l of u.later) { l.t -= dt / wm; if (l.t <= 0 && !l.done) { l.done = true; l.f(); } } if (u.later.every((l) => l.done)) u.later = null; }
  for (const b of u.buffs) if (b.spinning) {                      // Whirl: hits everything round about, pulls with tier III
    u.spinT = (u.spinT || 0) - dt; if (u.spinT > 0) continue; u.spinT = 0.4;
    for (const e of opponents(w, u)) if (dist(u.x, u.y, e.x, e.y) < u.r + e.r + 50) { // sparks only where it hits (round 9)
      hurt(w, e, u.def.dmg * u.dmgMul * 0.6, u, { pab: b.id, kAngle: u.spinPull ? angleTo(e.x, e.y, u.x, u.y) : angleTo(u.x, u.y, e.x, e.y), knock: u.spinPull ? 80 : 120 });
    }
  }
  for (const h of hooksOf(u)) if (h.tick) h.tick(w, u, dt);
  if (u.kit) kitTick(w, u, dt);
  if (s.burn > 0) {
    s.burn = Math.max(0, s.burn - STATUS.burn.decay * dt);
    // burning: hurts from a little build-up (it used to wait for 30, so most burns never showed or hurt), and the body
    // gives off licks of flame, more as it builds (fx.js drawStatusFx draws flames on the body too)
    if (s.burn >= 8) hurt(w, u, (1.5 + s.burn * 0.06) * dt, null, { dot: true, color: '#FF9A55', by: u.stBy && u.stBy.burn, stk: 'burn' });
    if (s.burn > 4 && rand() < dt * (4 + 10 * fillOf(u, 'burn'))) flames(w, u.x, u.y - u.vr * 0.3, 1, u.vr * 0.6, 60);
  }
  if (s.chill > 0) s.chill = Math.max(0, s.chill - STATUS.chill.decay * dt);
  if (u.sickT > 0) { // sickened (poison's burst): a slow drain; it is weaker and slower meanwhile (blowMul, speedOf, atkRate)
    u.sickT = Math.max(0, u.sickT - dt);
    hurt(w, u, u.maxHp * POISON.drain / POISON.sickT * dt * (u.def.boss ? 0.4 : 1), null, { dot: true, color: '#9BCB3C', by: u.stBy && u.stBy.poison, stk: 'poison' });
    if (rand() < dt * 9) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.8, y: u.y + rrange(-u.r, u.r) * 0.8, vx: rrange(-12, 12), vy: -32, life: 0.8, max: 0.8, size: 5, color: '#B6E05A' });
    if (u.sickT <= 0) s.poison = Math.min(s.poison, POISON.ends); // round 13 (the designer: "Poison should drop lower after its burst is over"): 30 at the burst; round 14 ("Poison drops to 20%"): 20 when the sickness ends, not 0
  }
  if (s.poison > 0) { s.poison = Math.max(0, s.poison - STATUS.poison.decay * dt); hurt(w, u, s.poison * 0.07 * dt, null, { dot: true, color: '#9BCB3C', by: u.stBy && u.stBy.poison, stk: 'poison' });
    if (s.poison > 25 && rand() < dt * 6) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.7, y: u.y + rrange(-u.r, u.r) * 0.7, vx: 0, vy: -25, life: 0.6, max: 0.6, size: 4, color: '#9BCB3C' }); }
  if (u.frozenT > 0) u.frozenT -= dt;
  if (u.freezeImmune > 0) u.freezeImmune = Math.max(0, u.freezeImmune - 4 * dt);
}

// Round 15 (the Mob): what one of its other bodies ticks for itself each step. Everything of the pool (statuses, buffs,
// the kit, the trait's and trinkets' own ticks) is the lead's and runs in the lead's statusTick, once.
function bodyTick(w, u, dt) {
  for (const k of ['flinchT', 'gasT', 'focusT']) if (u[k] > 0) u[k] = Math.max(0, u[k] - dt);
  if (u.later) { for (const l of u.later) { l.t -= dt; if (l.t <= 0 && !l.done) { l.done = true; l.f(); } } if (u.later && u.later.every((l) => l.done)) u.later = null; }
  if (u.h2) for (const h of u.h2.slice()) if (h.tick) h.tick(w, u, dt); // (a timed hook hung on this body itself: flung, whirled)
}

// Entangle (statuses.js ENTANGLE): walking and attacking while it holds hurts a little (its burst roots: addStatus).
// An attack or ability is seen as a new u.anim (every swing, shot and cast sets one).
function entangleTick(w, u, dt) {
  const s = u.st, fill = s.entangle > 0 ? fillOf(u, 'entangle') : 0;
  if (s.entangle > 0) s.entangle = Math.max(0, s.entangle - STATUS.entangle.decay * dt);
  if (u.tangleImmuneT > 0) u.tangleImmuneT -= dt;
  const anim = u.anim && u.anim !== u._entAnim ? u.anim : null;
  if (anim) u._entAnim = anim;
  if (!fill) return;
  const moved = Math.hypot(u.dvx || 0, u.dvy || 0) * dt;
  if (moved > 0) hurt(w, u, ENTANGLE.walkDmg * fill * moved / 100, null, { dot: true, color: STATUS.entangle.col });
  if (anim) hurt(w, u, ENTANGLE.atkDmg * fill, null, { dot: true, color: STATUS.entangle.col });
}

// ---------------------------------------------------------------- physics
const SLAM_SPEED = 320; // knockback speed above which a body hitting a wall gets hurt (knockback is bigger since round 6)
function wallHit(w, u, speed) {
  if (speed > SLAM_SPEED) {
    const dmg = 4 + (speed - SLAM_SPEED) * 0.05;
    hurt(w, u, dmg, null, { noDodge: true });
    textU(w, u.x, u.y, u.r + 10, 'SLAM', '#FFD9A0', 0.9);
    puff(w, u.x, u.y, '#CDBFA6', 8, 90, 5, 0.4);
  }
}

function physics(w, dt) {
  const us = w.units;
  for (const u of us) {
    if (u.dead || u.downed) continue;
    if (u.fixed) { u.vx = u.vy = u.kx = u.ky = 0; continue; } // round 10: set in place by its brain (a turret on a wall, a chain's segment)
    const frozen = u.frozenT > 0;
    const acc = Math.min(1, dt * 20);
    if (frozen) { u.vx *= 0.8; u.vy *= 0.8; }
    else { u.vx += (u.dvx - u.vx) * acc; u.vy += (u.dvy - u.vy) * acc; }
    u.x += (u.vx + u.kx) * dt; u.y += (u.vy + u.ky) * dt;
    const kd = Math.exp(-5 * dt); u.kx *= kd; u.ky *= kd;
    // walls
    const ks = Math.hypot(u.kx, u.ky);
    if (u.x < u.r) { u.x = u.r; if (u.kx < 0) { wallHit(w, u, ks); u.kx *= -0.25; } }
    if (u.x > w.W - u.r) { u.x = w.W - u.r; if (u.kx > 0) { wallHit(w, u, ks); u.kx *= -0.25; } }
    if (u.y < u.r) { u.y = u.r; if (u.ky < 0) { wallHit(w, u, ks); u.ky *= -0.25; } }
    if (u.y > w.H - u.r) { u.y = w.H - u.r; if (u.ky > 0) { wallHit(w, u, ks); u.ky *= -0.25; } }
    for (const r of w.walls) {
      const c = circleRect(u.x, u.y, u.r, r); if (!c) continue;
      u.x += c.nx * c.over; u.y += c.ny * c.over;
      const into = -(u.kx * c.nx + u.ky * c.ny);
      if (into > 0) { wallHit(w, u, into); u.kx += c.nx * into * 1.25; u.ky += c.ny * into * 1.25; }
    }
    for (const p of w.pillars) {
      if (ownBoulder(u, p)) continue; // art round 8: a troll's boulder rests in its fists, inside its collider
      const d = dist(u.x, u.y, p.x, p.y), m = u.r + p.r;
      if (d < m && d > 0) {
        const nx = (u.x - p.x) / d, ny = (u.y - p.y) / d;
        u.x = p.x + nx * m; u.y = p.y + ny * m;
        const into = -(u.kx * nx + u.ky * ny);
        if (into > 0) { wallHit(w, u, into); u.kx += nx * into * 1.25; u.ky += ny * into * 1.25; }
      }
    }
  }
  // unit-unit
  for (let i = 0; i < us.length; i++) {
    const a = us[i]; if (a.dead || a.downed || a.ethereal) continue;
    for (let j = i + 1; j < us.length; j++) {
      const b = us[j]; if (b.dead || b.downed || b.ethereal) continue;
      if (a.def.pass || b.def.pass || (a.fixed && b.fixed) || (a.linkTo && a.linkTo === b.linkTo) || a.linkTo === b || b.linkTo === a) continue; // round 10: things that roll through (gear sprites), chains (round 13, lane E: a chain's head and its own links too: the first link, fixed, shoved its head off across the room at ~1900 a second)
      const dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy; const m = a.r + b.r;
      if (d2 >= m * m || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = m - d;
      const ta = a.fixed ? 0 : b.fixed ? 1 : b.mass / (a.mass + b.mass), tb = 1 - ta;
      a.x -= nx * over * ta; a.y -= ny * over * ta; b.x += nx * over * tb; b.y += ny * over * tb;
      // bowling: a fast knocked body transfers momentum
      const ka = Math.hypot(a.kx, a.ky), kb = Math.hypot(b.kx, b.ky);
      if (ka > 200 && a.kx * nx + a.ky * ny > 0) { b.kx += nx * ka * 0.6 * a.mass / b.mass; b.ky += ny * ka * 0.6 * a.mass / b.mass; a.kx *= 0.5; a.ky *= 0.5;
        if (a.team !== b.team || a.team === 'enemy') hurt(w, b, 3 + ka * 0.02, null, { noDodge: true }); }
      else if (kb > 200 && -(b.kx * nx + b.ky * ny) > 0) { a.kx -= nx * kb * 0.6 * b.mass / a.mass; a.ky -= ny * kb * 0.6 * b.mass / a.mass; b.kx *= 0.5; b.ky *= 0.5;
        if (a.team !== b.team || b.team === 'enemy') hurt(w, a, 3 + kb * 0.02, null, { noDodge: true }); }
    }
  }
}

// ---------------------------------------------------------------- projectiles, hazards, pickups
function projectiles(w, dt) {
  for (const p of w.projectiles) {
    p.life -= dt;
    if (!p.aimSeen) { // round 13: a confused shooter's shot goes wide; an addled one's can hit its own side
      p.aimSeen = true; const o = p.owner;
      if (o && o.st && o.st.confuse > 5 && !p.home) { const e = rrange(-1, 1) * CONFUSE.aim * fillOf(o, 'confuse'), a = Math.atan2(p.vy, p.vx) + e, sp = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.a = a; }
      if (o && o.addledT > 0) p.wild = true;
    }
    // round 9 shot behaviours: home (turns towards a unit), accel (speeds up), drag (slows), grow (radius/s), fall (damage
    // lost per second, the necromancer's dart)
    if (p.home && alive(p.home) && p.turn) { const a = Math.atan2(p.vy, p.vx), want = angleTo(p.x, p.y, p.home.x, p.home.y), sp = Math.hypot(p.vx, p.vy), na = a + clamp(wrapAngle(want - a), -p.turn * dt, p.turn * dt); p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp; }
    if (p.accel) { const m = 1 + p.accel * dt; p.vx *= m; p.vy *= m; }
    if (p.drag) { const m = Math.exp(-p.drag * dt); p.vx *= m; p.vy *= m; }
    if (p.grow) p.r = Math.max(2, p.r + p.grow * dt);
    if (p.fall) p.dmg *= Math.exp(-p.fall * dt);
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0 || p.y < 0 || p.x > w.W || p.y > w.H) p.life = 0;
    for (const pl of w.pillars) if (dist(p.x, p.y, pl.x, pl.y) < pl.r && p.life > 0) {
      p.life = 0;
      if (pl.hp != null && !p.noHit && p.team !== pl.team) { pl.hp -= p.dmg || 0; pl.hitT = 0.12; } // round 9: a troll's boulder can be shot to pieces
      if (pl.onShot && !p.noHit && p.team !== pl.team) pl.onShot(w, pl, p); // round 13 (lane E): a yeti's snowball is knocked off course (foes10.js)
    }
    for (const r of w.walls) if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h && !(r.over && r.over === p.team)) p.life = 0; // (round 15, lane N: r.over, a wall its own side shoots over)
    if (p.life <= 0 && p.land && !p.landed) { p.landed = true; actAs(w, p.owner, () => p.land(p)); }
    if (p.kind === 'fireArrow') for (const h of w.hazards) if ((h.type === 'oil' || h.type === 'gas') && dist(p.x, p.y, h.x, h.y) < h.r) { igniteAround(w, p.x, p.y, 4); p.life = Math.min(p.life, 0.02); }
    if (p.life <= 0 || p.noHit) continue; // noHit: only a look (a lobbed thing; its landing is a danger zone)
    for (const u of w.units) {
      if (!alive(u) || u === p.skip || u === p.owner || u.ethereal) continue;
      if (p.team !== 'neutral' && u.team === p.team && !p.wild) { // round 10: a shot that does something to friends it passes (the Cleric's orbs heal)
        if (p.allyHit && u !== p.owner && !(p.allySeen || (p.allySeen = new Set())).has(u) && dist(p.x, p.y, u.x, u.y) < u.r + p.r) { p.allySeen.add(u); p.allyHit(w, p, u); }
        continue;
      }
      if (p.hitSet && p.hitSet.has(u)) continue;
      if (u.def.hitAt ? u.def.hitAt(u, p.x, p.y, p.r) : dist(p.x, p.y, u.x, u.y) < u.r + p.r) { // (round 13, lane E: def.hitAt, a body that isn't round: the sun blade)
        // round 10, the gilded golem: a shot that hits its front bounces back at whoever shot it
        if (u.def.mirror && !p.noMirror && angleDiff(Math.atan2(-p.vy, -p.vx), u.facing) < (u.def.mirror || 1.2)) {
          const back = p.owner && alive(p.owner) ? angleTo(p.x, p.y, p.owner.x, p.owner.y) : Math.atan2(-p.vy, -p.vx), sp = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(back) * sp; p.vy = Math.sin(back) * sp; p.a = back; p.team = u.team; p.owner = u; p.noMirror = true; p.home = null; p.life = Math.max(p.life, 1);
          if (p.hitSet) p.hitSet.clear(); u.blockedAt = w.time; sparks(w, p.x, p.y, back, 6, '#FFF1B0', 1.1);
          break;
        }
        const friendly = p.team === 'neutral' && p.owner && u.team === p.owner.team;
        const o = { ...p.o, kAngle: Math.atan2(p.vy, p.vx), shot: true, pab: p.ab, tk: p.tk };
        if (friendly) { for (const k of ['chill', 'burn', 'poison']) if (o[k]) o[k] *= 0.4; }
        const mul = p.owner && p.owner.nextShotMul && !p.hitSet ? p.owner.nextShotMul : 1;
        if (mul > 1) p.owner.nextShotMul = 0;
        hurt(w, u, p.dmg * (friendly ? 0.4 : 1) * mul, p.owner, o);
        if (p.onHit) p.onHit(w, p, u); // a projectile with an effect of its own (water that soaks, a fireball that bursts)
        if (p.hitSet && p.pierce > 0) { p.hitSet.add(u); p.pierce--; continue; }
        p.life = 0;
        if (p.land && !p.landed) { p.landed = true; actAs(w, p.owner, () => p.land(p)); }
        if (p.kind === 'fireArrow') puff(w, p.x, p.y, '#FF8A3D', 4, 60, 4, 0.3);
        else puff(w, p.x, p.y, p.kind === 'icicle' ? '#DFF6FF' : '#F2E6CC', 3, 50, 3, 0.25);
        break;
      }
    }
  }
  for (const p of w.projectiles) if (p.life <= 0 && p.land && !p.landed) { p.landed = true; actAs(w, p.owner, () => p.land(p)); }
  w.projectiles = w.projectiles.filter((p) => p.life > 0);
}

function hazards(w, dt) {
  for (const h of w.hazards) if (h.t != null) h.t -= dt;
  w.hazards = w.hazards.filter((h) => h.t == null || h.t > 0);
  for (const u of w.units) {
    if (!alive(u) || u.ethereal) continue;
    u.inOil = false; u.soakedT = 0;
    u.hazardT -= dt;
    for (const h of w.hazards) {
      if (dist(u.x, u.y, h.x, h.y) > h.r + u.r * 0.4) continue;
      if (h.type === 'oil' || h.type === 'web') u.inOil = true; // web (round 7): sticky, slows like oil
      else if (h.type === 'fire') addStatus(w, u, 'burn', 34 * dt);
      else if (h.type === 'gas') addStatus(w, u, 'poison', 24 * dt);
      else if (h.type === 'water' && !u.soakedT) { u.soakedT = 1; addStatus(w, u, 'wet', Math.min(20 * dt, Math.max(0, 90 - u.st.wet))); } // standing water soaks to 90, never tips into a slip (a slip's puddle would feed itself)
      // spikes: up is false once the room is won (they've sunk)
      else if (h.type === 'spikes' && h.up !== false && u.hazardT <= 0) { u.hazardT = 0.6; hurt(w, u, 5 + Math.hypot(u.kx, u.ky) * 0.03, null, { noDodge: true }); }
    }
  }
}

// Coins lie where they fall and must be walked over; they fade after a while. A hero who comes close pulls them in:
// within MAGNET they home in fast (accelerating, so they snap in rather than drift).
export const COIN_LIFE = 25;
const COIN_DRAG = 3.2, MAGNET = 110;
function pickups(w, dt) {
  const heroes = w.units.filter((u) => u.team === 'hero' && alive(u) && !u.summon && !u.def.cargo); // lane C (convoy): the wagon picks up nothing
  for (const h of heroes) h.coinGoal = null;
  for (const p of w.pickups) {
    // a chest falling in (dungeon.js drops one by the party when a room is won): a thump and a puff as it lands
    if (p.type === 'chest' && p.drop > 0) { p.drop -= dt; if (p.drop <= 0) { puff(w, p.x, p.y, '#CDBFA6', 12, 130, 6, 0.45); w.shake = Math.max(w.shake, 3); } }
    if (p.type !== 'coin' && p.type !== 'key') continue;
    if (p.type === 'coin') {
      if (p.life == null) p.life = COIN_LIFE;
      p.life -= dt;
      if (p.life <= 0) { p.got = true; continue; }
      if (p.hop > 0) p.hop = Math.max(0, p.hop - dt); // still in the air from the burst (the renderer lifts it)
    }
    let near = null, nd = Infinity;
    for (const h of heroes) { const d = dist(p.x, p.y, h.x, h.y); if (d < nd) { nd = d; near = h; } }
    if (near && nd < near.r + MAGNET && !(p.hop > 0)) {
      p.homing = true;
      const a = angleTo(p.x, p.y, near.x, near.y), sp = Math.max(Math.hypot(p.vx, p.vy), 120) + 1600 * dt;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
    } else {
      p.homing = false;
      const k = Math.exp(-COIN_DRAG * dt); p.vx *= k; p.vy *= k;
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = clamp(p.x, 6, w.W - 6); p.y = clamp(p.y, 6, w.H - 6);
    if (!p.homing) for (const wl of w.walls) { const c = circleRect(p.x, p.y, 6, wl); if (c) { p.x += c.nx * c.over; p.y += c.ny * c.over; } }
    if (near && nd < near.r + 8) { p.got = true; emit(w, p.type, p, near); continue; }
    // a hero who isn't busy fighting goes for coins close by
    if (near && nd < 220 && (!near.coinGoal || nd < near.coinGoal.d)) near.coinGoal = { x: p.x, y: p.y, d: nd };
  }
  w.pickups = w.pickups.filter((p) => !p.got);
}

// Bodies: in the air they fly on, spinning, and bounce off walls; on the ground they slide to a stop and lie still.
function corpses(w, dt) {
  for (const c of w.corpses) {
    c.t -= dt; c.age += dt;
    if (c.z > 0 || c.vz > 0) { c.vz -= 900 * dt; c.z += c.vz * dt; if (c.z <= 0) { c.z = 0; c.vz = c.vz < -160 ? -c.vz * 0.3 : 0; c.kx *= 0.7; c.ky *= 0.7; } }
    const k = Math.exp(-(c.z > 0 ? 0.8 : 4.5) * dt); c.kx *= k; c.ky *= k; c.spin *= Math.exp(-(c.z > 0 ? 0.5 : 5) * dt);
    c.x += c.kx * dt; c.y += c.ky * dt; c.facing += c.spin * dt;
    const r = c.r * 0.6;
    if (c.x < r) { c.x = r; c.kx = Math.abs(c.kx) * 0.4; } if (c.x > w.W - r) { c.x = w.W - r; c.kx = -Math.abs(c.kx) * 0.4; }
    if (c.y < r) { c.y = r; c.ky = Math.abs(c.ky) * 0.4; } if (c.y > w.H - r) { c.y = w.H - r; c.ky = -Math.abs(c.ky) * 0.4; }
    for (const wl of w.walls) { const h = circleRect(c.x, c.y, r, wl); if (h) { c.x += h.nx * h.over; c.y += h.ny * h.over; const into = c.kx * h.nx + c.ky * h.ny; if (into < 0) { c.kx -= 1.4 * into * h.nx; c.ky -= 1.4 * into * h.ny; } } }
    for (const p of w.pillars) { const d = dist(c.x, c.y, p.x, p.y), m = p.r + r; if (d < m && d > 0) { c.x = p.x + (c.x - p.x) / d * m; c.y = p.y + (c.y - p.y) / d * m; } }
  }
  w.corpses = w.corpses.filter((c) => c.t > 0);
}

// ---------------------------------------------------------------- main step
export function step(w, dt) {
  w.time += dt;
  // a summon that came out of a hexed unit's ability joins the other side
  for (const s of w.units) if (s.summonBy && !s.hexSeen) { s.hexSeen = true; const by = s.summonBy; if (alive(by) && (by.hexUntil > w.time || hexFires(w, by))) turnSummon(w, s, by); }
  w.shake = Math.max(0, w.shake - dt * 30);
  if (w.battle) for (const s of w.units) if (s.adopt) { s.adopt = false; const by = s.calledBy || s.summonBy || s.feeds; if (by && by.team && by.team !== 'neutral') s.team = by.team; s.aggro = true; }
  for (const u of w.units) {
    if (!alive(u)) continue;
    w.actor = u;
    u.staleBoost = !!w.stale && (u.team === 'enemy' || !!w.battle);
    const body = !!mobLead(u); // round 15 (the Mob): one of its other bodies. The pool's clocks, statuses and kit are the lead's and tick with it, once
    u.flashT = Math.max(0, u.flashT - dt); if (!body) u.invulnT = Math.max(0, u.invulnT - dt);
    const cdr = cdRate(u); // round 15 (lane N): Shackled building, every ability cooldown runs slower
    u.atkT -= dt * atkRate(u); u.abilT -= dt * cdr;
    if (u.shackledT > 0) u.atkT = Math.max(u.atkT, SHACKLE.hold); // SHACKLED: its attack clock is held (the brains that strike off u.atkT are held with it)
    if (u.kit && !body) for (const k in u.kit.cd) u.kit.cd[k] -= dt * (1 - Math.min(0.5, u.st.wet / 200)) * cdr; // wet slows abilities
    u.modeT += dt; u.bob += dt * (3 + u.spd * 0.09);
    u.lungeT = Math.max(0, u.lungeT - dt); u.recoilT = Math.max(0, u.recoilT - dt); u.hitT = Math.max(0, u.hitT - dt);
    if (u.tauntT > 0) { u.tauntT -= dt; if (u.tauntT <= 0 || !u.tauntBy || !alive(u.tauntBy)) { u.tauntBy = null; u.tauntT = 0; } }
    if (body) bodyTick(w, u, dt); else statusTick(w, u, dt);
    if (!alive(u)) continue;
    if (u.anim) { u.anim.t += dt / (u.winding ? windMul(u) : 1); if (u.anim.t >= u.anim.dur) u.anim = null; } // (round 14: a sleepy wind-up's pose plays out slower too)
    u.winding = false; // (set again this tick by whatever wind-up it is in: runAction, elites.js hold / rushTick, boss-kit chargeTick)
    if (u.frozenT > 0 || u.stunT > 0 || u.sleepT > 0) { if (!u.act || u.act.type !== 'slip') { u.dvx = u.dvy = 0; u.spd = 0; continue; } }
    // slimes (round 9: "All slimes move in forward burst, pause then move again"): a hop, then a rest; def.onHop(w, u)
    // when it lands
    if (u.def.hops) {
      const per = u.def.hops, k = ((w.time + u.id * 0.37) % per) / per, was = u.pulse ?? 1;
      u.pulse = k < 0.34 ? 0.4 + 2.6 * Math.sin(Math.PI * k / 0.34) : 0.15;
      if (was > 0.5 && u.pulse <= 0.15 && u.def.onHop && u.aggro) u.def.onHop(w, u);
    }
    // a unit with its own brain (bosses, special enemies) runs it first; returning true skips the usual brain
    if (u.eliteFn && !(u.fearT > 0) && u.eliteFn(w, u, dt)) continue; // an elite's extra move (elites.js) (round 14: not while terrified: it runs)
    if (u.def.brain && !(u.fearT > 0) && u.def.brain(w, u, dt)) continue; // (terrified: the plain brain below runs it off)
    if (u.target && !alive(u.target)) u.target = null;
    u.thinkT -= dt;
    if (u.thinkT <= 0) { u.thinkT = 0.4 + rand() * 0.08; think(w, u); }
    if (u.act) { const charging = u.act.type === 'charge' || u.act.type === 'dash'; if (u.act.type !== 'dash') u.spd *= Math.exp(-dt * 10); if (u.act.type === 'charge') { u.mvA = u.act.a; u.spd = u.def.speed * 1.5; } runAction(w, u, dt); if (!charging) updateFacing(u, dt); continue; }
    movement(w, u, dt);
    if (u.rootT > 0) { u.dvx = u.dvy = 0; u.spd = 0; }
    updateFacing(u, dt);
    // confused (round 13; round 14, "Should also make them turn randomly"): now and then it swings round to a random
    // heading and walks off that way for a moment (movement and updateFacing follow u.lurchA while u.lurchT lasts)
    if (u.st.confuse > 5 && !(u.lurchT > 0) && chance(dt * CONFUSE.turn * fillOf(u, 'confuse'))) { u.lurchA = wrapAngle(u.facing + rrange(1.5, 3.1) * (chance(0.5) ? 1 : -1)); u.lurchT = rrange(...CONFUSE.lurchT); }
    const radiant = u.radiantT > 0 || u.fearT > 0; // radiant: it glows, and can't attack or use an ability (terrified: it only runs)
    if (radiant) { /* no attacks */ }
    else if (u.addledT > 0) { if (!body && addledTick(w, u, dt)) continue; } // (addled: its abilities only go off by themselves, at random)
    else if (flail(w, u, dt)) continue;
    else if (body) { /* round 15 (the Mob): the abilities are the lead's to use */ }
    else if (u.kit) { u.abilThinkT -= dt; if (u.abilThinkT <= 0) { u.abilThinkT = 0.35; if (kitThink(w, u)) continue; } }
    else if (u.def.ability && u.abilT <= 0 && !u.forcedGoal) {
      u.abilThinkT -= dt;
      if (u.abilThinkT <= 0) {
        u.abilThinkT = 0.5;
        const s = abilityScore(w, u);
        if (s > 0) {
          const lastOne = opponents(w, u).length === 1;
          let ch = clamp(0.02 + s * 0.55, 0, 0.92);
          if (lastOne) ch = Math.max(ch * 3, 0.4);
          if (u.st.sleepy > 0) ch *= 1 - SLEEPY.abilCut * fillOf(u, 'sleepy'); // sleepy: fewer abilities (round 13)
          if (chance(ch)) useAbility(w, u);
        }
      }
    }
    if (u.def.dashCd && !u.act && !u.forcedGoal) {
      u.dashT = (u.dashT ?? 1) - dt;
      const t = u.target;
      if (u.dashT <= 0 && t) {
        let near = Infinity, no = null; for (const o of opponents(w, u)) { const od = dist(u.x, u.y, o.x, o.y) - o.r; if (od < near) { near = od; no = o; } }
        const gap = dist(u.x, u.y, t.x, t.y) - u.r - t.r;
        let a = null;
        if (u.mode === 'retreat' && no && near < u.r + 60) a = angleTo(no.x, no.y, u.x, u.y);            // get out of reach
        else if (u.mode !== 'retreat' && gap > 130 && gap < 320 && u.atkT <= 0.2 && lineClear(w, u.x, u.y, t.x, t.y, u.r)) a = angleTo(u.x, u.y, t.x, t.y); // close in
        if (a !== null) { u.act = { type: 'dash', t: 0.2, max: 0.2, a }; u.dashT = u.def.dashCd; continue; }
      }
    }
    if (!u.act && !body && u.potions > 0 && hpRatio(u) < 0.35) {
      let near = Infinity; for (const o of opponents(w, u)) near = Math.min(near, dist(u.x, u.y, o.x, o.y) - o.r);
      if (near > 150 && chance(dt * 3)) { u.act = { type: 'drink', t: 1, max: 1 }; }
    }
    if (!u.act && !radiant) tryAttack(w, u);
  }
  w.actor = null;
  physics(w, dt);
  dangerTick(w, dt);
  projectiles(w, dt);
  hazards(w, dt);
  pickups(w, dt);
  for (const p of w.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; const dr = p.drag || 0.92; p.vx *= dr; p.vy *= dr; if (p.rise) p.up += p.rise * dt; }
  corpses(w, dt);
  w.particles = w.particles.filter((p) => p.life > 0);
  if (w.particles.length > 400) w.particles.splice(0, w.particles.length - 400);
  for (const t of w.texts) { t.life -= dt; t.up = (t.up || 0) - t.vy * dt; t.vy *= 0.94; }
  w.texts = w.texts.filter((t) => t.life > 0);
  for (const f of w.fx) {
    f.t += dt;
    // a beam tied to two units (a heal ray) follows them, and ends early if either falls
    if (f.unit) { f.x = f.unit.x; f.y = f.unit.y; if (!alive(f.unit)) f.max = Math.min(f.max, f.t); } // an aura or mark riding on a unit
    if (f.from && f.to) { if (!alive(f.from) || !alive(f.to)) f.max = Math.min(f.max, f.t); f.x1 = f.from.x; f.y1 = f.from.y; f.x2 = f.to.x; f.y2 = f.to.y; }
    if (f.tick) { f.acc = (f.acc || 0) + dt; while (f.acc >= (f.every || 0.5)) { f.acc -= f.every || 0.5; actAs(w, f.src || f.by, () => f.tick(f)); } }
    if (f.follow && f.src) { const e = w.units.filter((o) => alive(o) && o.team !== f.src.team).sort((a, b) => dist(a.x, a.y, f.x, f.y) - dist(b.x, b.y, f.x, f.y))[0];
      if (e) { const a = angleTo(f.x, f.y, e.x, e.y); f.x += Math.cos(a) * 40 * dt; f.y += Math.sin(a) * 40 * dt; } }
    // a ward eases enemies out of it (round 9: it used to fling them, and the slams and bowling hurt them)
    if (f.ward && f.src) for (const e of w.units) if (alive(e) && e.team !== f.src.team && dist(e.x, e.y, f.x, f.y) < f.r + e.r) { const a = angleTo(f.x, f.y, e.x, e.y), d = f.r + e.r - dist(e.x, e.y, f.x, f.y); e.x += Math.cos(a) * Math.min(d, 260 * dt); e.y += Math.sin(a) * Math.min(d, 260 * dt); }
  }
  w.fx = w.fx.filter((f) => f.t < f.max);
  let wallsGone = false;
  for (const r of w.walls) if (r.temp != null) { r.temp -= dt; if (r.temp <= 0) wallsGone = true; }
  if (wallsGone) {
    for (const r of w.walls) if (r.kind === 'bone' && r.temp <= 0) puff(w, r.x + r.w / 2, r.y + r.h / 2, '#E6DCC4', 6, 70, 5, 0.5); // a bone wall crumbles
    w.walls = w.walls.filter((r) => r.temp == null || r.temp > 0); buildGrid(w);
  }
  for (const t of w.telegraphs) t.t -= dt / (t.wind && t.src && t.src.winding ? windMul(t.src) : 1);
  w.telegraphs = w.telegraphs.filter((t) => t.t > 0);
  w.units = w.units.filter((u) => !u.dead);
}

export { alive, opponents, allies, hpRatio, wake, puff, textU, goalVec, steer, drive, blocked, updateFacing, meleeSwing, sparks, flames, kill, dangerEscape, fearOf };
