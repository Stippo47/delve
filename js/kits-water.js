// Round 17 (lane water17): the Water Mage's kit (heroes-water.js), in kits2.js's shape and built from its shared pieces
// (onUnit timed hooks, k2 looks). Merged into ABILITIES / TRAITS / ATTACKS by kits.js; waterTick runs from kitTick.
// The looks are in fx-water.js. Every number and every call the design left open is in docs/HEROES-water17.md.
import { TAU, clamp, dist, angleTo, angleDiff, wrapAngle, rand, rrange } from './util.js';
import { hurt, alive, opponents, allies, hpRatio, puff, blocked, addBuff, sparks, setAnim, addStatus as simAddStatus } from './sim.js';
import { foesNear, friendsNear, dmgOf, ang, cast, heal, segDist, withAb, beset } from './kits.js';
import { k2, onUnit, offUnit, isOn, shove } from './kits2.js';
import { cue } from './sfx.js';

const tierOf = (u, id) => (u.kit && u.kit.tiers[id]) || 0;
const held = (u, f) => withAb(u, u.kit && u.kit.using, f); // what an ability leaves running keeps its web nodes
const bossy = (e) => !!(e.def.boss || e.def.part || e.fixed);
const realFriend = (a) => !a.summon && !a.def.cargo && !a.partOf;
const splash = (w, x, y) => cue('land', { kind: 'water', x, y }); // the game's water splash (audio.js 'land')
const drops = (w, x, y, n = 8, sp = 90) => puff(w, x, y, '#8FD3F0', n, sp, 5, 0.45);

// ---------------------------------------------------------------- magic or not
// The designer: bubbles "block magic, not physical attacks". The tag lane is writing the real rule (js/tags.js
// isMagicHit); until it lands, this one stand-in decides, for every blow the bubble meets:
//   - a source can say so outright: o.magic / o.physical;
//   - damage over time (burning, poison ticks) is not a blow: the bubble never meets it;
//   - a shot is physical when it is a thing thrown or loosed (PHYSICAL_SHOTS: arrows, fire arrows too, bullets,
//     knives, stones, boulders, bones, hammers...), magic when it is a spell's shot (MAGIC_SHOTS: bolts, sparks,
//     fireballs, frost bolts, orbs, notes, water, gusts, ice shards, hex bolts...), and otherwise magic only if it
//     carries a spell's status (below);
//   - any other blow (a swing, a slam, a danger zone, an ability's strike) is magic when it carries a spell's status
//     (burn, chill, shock, wet, curse, radiance, charm, sleepy, confuse, fear), or is an ability of a caster hero
//     (battle mode); everything else is physical: weapons, bites, claws, slams, shoves, bleeding cuts.
// WIRE: tags.js isMagicHit at merge
const SPELL_ST = ['burn', 'chill', 'shock', 'wet', 'curse', 'radiance', 'charm', 'sleepy', 'confuse', 'fear'];
const PHYSICAL_SHOTS = new Set(['arrow', 'fireArrow', 'loveArrow', 'bullet', 'pellet', 'dagger', 'knife', 'kunai', 'shuriken', 'javelin', 'harpoon',
  'stone', 'tkStone', 'clod', 'rock', 'boulder', 'cbolt', 'bolas', 'hammer', 'warhammer', 'aresSpear', 'cog', 'bomb', 'pot', 'pie', 'food', 'ball',
  'arm', 'manacles', 'clockHand', 'bee', 'vial', 'flask', 'thorn', 'bone']);
const MAGIC_SHOTS = new Set(['bolt', 'spark', 'frostbolt', 'fireball', 'orb', 'note', 'water', 'gust', 'shard', 'icicle', 'hexbolt', 'eyeBolt', 'shadowBolt',
  'spiritOrb', 'glimmer', 'zeus', 'kiss', 'kissTo', 'kissBack', 'heartbreak', 'soul', 'spirit', 'cluster', 'radiance', 'sleepy', 'fear', 'confuse', 'charm']);
const spellSt = (o) => SPELL_ST.some((k) => o[k] > 0);
function isMagic(o, src) {
  if (!o || o.dot) return false;
  if (o.magic) return true; if (o.physical) return false;
  if (o.shotKind) return PHYSICAL_SHOTS.has(o.shotKind) ? false : MAGIC_SHOTS.has(o.shotKind) || spellSt(o);
  if (spellSt(o)) return true;
  return !!(src && src.def && src.def.heroRole === 'caster' && (o.ab || o.pab));
}
// a shot as the bubble sees it, before it lands
const shotO = (p) => ({ ...(p.o || {}), shot: true, shotKind: p.kind });
// an enemy that hurts with magic (its own blows or shots carry a spell, or it shoots spells): for the scores
function magicUser(e) {
  const d = e.def; if (!d) return false;
  if (SPELL_ST.some((k) => d[k] > 0) || (d.hitSt && SPELL_ST.some((k) => d.hitSt[k] > 0))) return true;
  if (d.proj && MAGIC_SHOTS.has(d.proj)) return true;
  return d.attackAnim === 'cast' || d.heroRole === 'caster';
}
// what magic is about to land on a: 0.9 a magic shot on course within 1 s, 0.8 a magic danger zone under it, 0
function magicComing(w, a) {
  for (const p of w.projectiles) {
    if (p.team === a.team || p.noHit || p.life <= 0 || !(p.dmg > 0) || !isMagic(shotO(p), p.owner)) continue;
    const vx = p.vx || 0, vy = p.vy || 0, v2 = vx * vx + vy * vy; if (v2 < 1) continue;
    const dx = a.x - p.x, dy = a.y - p.y, tc = (dx * vx + dy * vy) / v2; if (tc < 0 || tc > 1) continue;
    const mx = dx - vx * tc, my = dy - vy * tc; if (mx * mx + my * my < (a.r + (p.r || 6) + 6) ** 2) return 0.9;
  }
  for (const z of w.danger) if (z.team !== a.team && !z.done && z.t > 0 && z.t < 1.3 && z.hit && isMagic(z.hit, z.src) && inZoneOf(z, a)) return 0.8;
  return 0;
}
// (sim.js inZone, read loosely: circles and lines are what the enemies telegraph)
function inZoneOf(z, a) {
  if (z.shape === 'circle' || z.r) return dist(z.x, z.y, a.x, a.y) < (z.r || 0) + a.r * 0.5;
  if (z.x1 != null) return segDist(a.x, a.y, z.x1, z.y1, z.x2, z.y2) < (z.hw || 20) + a.r * 0.5;
  return false;
}

// ---------------------------------------------------------------- standing in water (the trait; Dome III's flood)
export function inWater(w, u) {
  if (!u || u.airborne) return false;
  for (const h of w.hazards) if (h.type === 'water' && dist(u.x, u.y, h.x, h.y) < h.r + u.r * 0.4) return true;
  if (w.water) for (const c of w.water) if (u.x > c.x && u.x < c.x + c.w && u.y > c.y && u.y < c.y + c.h) return true;
  return false;
}
// the lizardman's ball of water (enemies.js waterShot), thrown by her: soaks what it hits
function waterBall(w, u, x, y, a, dmg, wet, home) {
  const sp = rrange(230, 270);
  w.projectiles.push({ kind: 'water', x: x + Math.cos(a) * 14, y: y + Math.sin(a) * 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 9, team: u.team, owner: u,
    dmg, o: { knock: 60, wet, proc: true }, life: 1.6, a, home: home || null, turn: home ? 2.4 : 0,
    onHit: (w2, p) => drops(w2, p.x, p.y, 8, 70) });
}

// ---------------------------------------------------------------- the beam (her attack)
// 2 s on, 1.5 s off (the off part runs at her attack speed). Pulses every 0.4 s: an enemy is hurt and soaked a little;
// a friend is healed and washed (burning put out, half the poison off: what Wet washes, and the burning a beam of water
// puts out), never soaked. Who it goes to, the call: the most hurt friend in reach and in sight when one is under 60%,
// or burning or poisoned (over 30) and under 90%; else the nearest enemy in reach. Mid-beam on an enemy it swings to a
// friend that drops under 40%. Never herself. Only while there are enemies to fight (no free top-ups between rooms).
export const BEAM = { on: 2, off: 1.5, every: 0.4, first: 0.2, dmg: 0.52, heal: 0.016, burnOff: 45, poisonKeep: 0.5, slack: 40, friendAt: 0.6, washAt: 0.9, switchAt: 0.4 };
const reach = (u) => u.def.range || 215;
const sees = (w, u, o, slack = 0) => dist(u.x, u.y, o.x, o.y) - o.r <= reach(u) + slack && !blocked(w, u.x, u.y, o.x, o.y);
const dirty = (a) => (a.st.burn || 0) > 30 || (a.st.poison || 0) > 30;
function beamFriend(w, u, under = BEAM.friendAt) {
  let best = null;
  for (const a of allies(w, u)) {
    if (!realFriend(a) || a.downed || a.ethereal || !sees(w, u, a)) continue;
    const r = hpRatio(a), want = r < under || (under >= BEAM.friendAt && dirty(a) && r < BEAM.washAt);
    if (want && (!best || r < hpRatio(best))) best = a;
  }
  return best;
}
function nearestFoe(w, u) {
  let best = null, bd = Infinity;
  for (const e of opponents(w, u)) { if (e.ethereal || e.hidden || !sees(w, u, e)) continue; const d = dist(u.x, u.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  return best;
}
const fighting = (w, u) => opponents(w, u).some((e) => !e.dead && (e.aggro || w.bookPreview || w.battle));
function startBeam(w, u, to) {
  const k = u.kit, ally = to.team === u.team;
  if (k.wb && k.wb.f) k.wb.f.max = Math.min(k.wb.f.max, k.wb.f.t + 0.1);
  const f = k2(w, { draw: 'tideBeam', from: u, to, x1: u.x, y1: u.y, x2: to.x, y2: to.y, max: BEAM.on + 0.2, ally, unit: null });
  k.wb = { to, ally, t: BEAM.on, acc: BEAM.every - BEAM.first, f, n: 0, chk: 0.5 };
  setAnim(u, 'cast', 0.32); u.lastAttackT = w.time; u.atkT = 99;
  splash(w, u.x, u.y);
}
function endBeam(u) {
  const k = u.kit, b = k.wb; if (!b) return;
  if (b.f) b.f.max = Math.min(b.f.max, b.f.t + 0.15);
  k.wb = null; u.atkT = BEAM.off;
}
function pulse(w, u, b) {
  const to = b.to; b.n++;
  if (b.ally) {
    heal(w, to, to.maxHp * BEAM.heal, u); to.mendGlow = w.time + 0.3;
    if (to.st.burn > 0) to.st.burn = Math.max(0, to.st.burn - BEAM.burnOff);
    if (to.st.poison > 0) to.st.poison *= BEAM.poisonKeep;
    const a = rand() * TAU, d = (to.vr || to.r) * (0.9 + 0.3 * rand());
    w.particles.push({ x: to.x + Math.cos(a) * d, y: to.y + Math.sin(a) * d * 0.8, vx: 0, vy: 0, rise: 40, up: 0, life: 0.7, max: 0.7, size: 4.5, color: '#9BE07A', shape: 'plus' });
  } else {
    hurt(w, to, dmgOf(u, BEAM.dmg), u, { noDodge: true, knock: 22, kAngle: ang(u, to), wet: u.def.wet || 7 });
  }
  drops(w, to.x, to.y, 3, 50);
}
// the attack: tryAttack found an enemy in reach and in front; she picks who the beam goes to by the rule above
function beamAttack(w, u, t) {
  const k = u.kit; if (k.wb) return;
  const f = beamFriend(w, u), e = nearestFoe(w, u);
  const to = f || e || t; if (!to) return;
  startBeam(w, u, to);
}
function beamTick(w, u, dt) {
  const k = u.kit; if (!k) return;
  if (k.wbW !== w) { k.wbW = w; k.wb = null; }
  const b = k.wb;
  const held0 = u.shackledT > 0 || u.stunT > 0 || u.frozenT > 0 || u.sleepT > 0 || u.koT > 0 || u.fearT > 0 || u.radiantT > 0 || u.downed || !alive(u) || !!u.act;
  if (!b) {
    // a friend in trouble and nothing in reach to shoot at (or the attack not called): the beam goes to them on its own
    if (u.atkT <= 0 && !held0 && !u.forcedGoal && fighting(w, u)) { const f = beamFriend(w, u); if (f) startBeam(w, u, f); }
    return;
  }
  u.atkT = Math.max(u.atkT, 99);
  if (held0 || !alive(b.to) || b.to.downed || b.to.ethereal || !sees(w, u, b.to, BEAM.slack) || (b.ally && !fighting(w, u))) { endBeam(u); return; }
  b.t -= dt; b.acc += dt; b.chk -= dt;
  if (!b.ally && b.chk <= 0) { b.chk = 0.5; const f = beamFriend(w, u, BEAM.switchAt); if (f) { b.to = f; b.ally = true; b.f.to = f; b.f.ally = true; splash(w, f.x, f.y); } }
  while (b.acc >= BEAM.every && b.t > -0.01) { b.acc -= BEAM.every; pulse(w, u, b); }
  if (b.t <= 0) endBeam(u);
}

// ---------------------------------------------------------------- Bubble Shields
// A bubble on a friend (or herself): a magic blow on them is stopped whole (its statuses too) and its damage comes off
// the bubble's strength; a physical one goes through and leaves the bubble be. It pops when its strength is spent or
// its time runs out (both: the call). Popping: Wet 40 on the one inside, and every enemy within 95 knocked back (a
// small hit). Tier III: a pop throws what it caught back at whoever cast the last of it, as a ball of water.
export const BUBBLE = { dur: [0, 6, 8, 8], hold: [0, 0.33, 0.42, 0.42], n: [0, 1, 2, 3], popWet: 40, popR: 95, popKnock: 300, popDmg: 0.4, reach: 380 };
function bubbleOn(w, u, a, tier) {
  const dur = BUBBLE.dur[tier], cap = a.maxHp * BUBBLE.hold[tier];
  const B = { left: cap, cap, held: 0, last: null, tier, by: u, popped: false };
  const f = k2(w, { draw: 'bubble', unit: a, x: a.x, y: a.y, r: a.vr || a.r, max: dur + 0.05, B });
  B.f = f;
  addBuff(a, { id: 'bubbled', dur });
  const soak = (amt, src) => { B.left -= amt; B.held += amt; if (src) B.last = src; f.hitT = w.time; if (B.left <= 0) pop(w, a, B); };
  onUnit(w, a, 'bubble', dur, {
    evade(w2, u2, src, amt, o) { if (B.popped || !isMagic(o, src)) return false; soak(amt, src); sparks(w2, u2.x, u2.y, src ? angleTo(u2.x, u2.y, src.x, src.y) : 0, 4, '#BFE9F8', 0.9); return true; },
    // a magic shot is caught on the bubble's skin before it lands (its blast, if it has one, never goes off)
    tick(w2, u2, dt) {
      if (B.popped) return;
      for (const p of w2.projectiles) {
        if (p.team === u2.team || p.noHit || p.life <= 0 || !(p.dmg > 0) || p.bubbleSeen === u2) continue;
        const sp = Math.hypot(p.vx || 0, p.vy || 0), d = dist(p.x, p.y, u2.x, u2.y);
        if (d > u2.r + (p.r || 6) + sp * dt * 1.6 + 6 || ((p.vx || 0) * (u2.x - p.x) + (p.vy || 0) * (u2.y - p.y)) <= 0) continue;
        if (!isMagic(shotO(p), p.owner)) { p.bubbleSeen = u2; continue; }
        p.life = 0; p.landed = true; drops(w2, p.x, p.y, 6, 80);
        soak(p.dmg, p.owner && alive(p.owner) ? p.owner : null);
        if (B.popped) return;
      }
    },
  }, (u2) => pop(w, u2, B));
}
function pop(w, a, B) {
  if (B.popped) return; B.popped = true;
  offUnit(a, 'bubble'); a.buffs = a.buffs.filter((b) => b.id !== 'bubbled');
  const u = B.by;
  B.f.max = Math.min(B.f.max, B.f.t + 0.02);
  k2(w, { draw: 'bubblePop', x: a.x, y: a.y, r: (a.vr || a.r) + 14, max: 0.55 });
  splash(w, a.x, a.y);
  if (!alive(a)) return;
  simAddStatus(w, a, 'wet', BUBBLE.popWet, u);
  withAb(u, 'bubbleShield', () => {
    for (const e of foesNear(w, u, a.x, a.y, BUBBLE.popR)) {
      const k = angleTo(a.x, a.y, e.x, e.y);
      hurt(w, e, dmgOf(u, BUBBLE.popDmg), u, { noDodge: true, knock: bossy(e) ? 80 : BUBBLE.popKnock, kAngle: k, wet: 15, ab: 'bubbleShield' });
    }
    // III: what it caught goes back at whoever cast it
    if (B.tier >= 3 && B.held > 0 && B.last && alive(B.last) && alive(u)) {
      const dmg = clamp(B.held * 0.6, dmgOf(u, 0.8), dmgOf(u, 3.2));
      waterBall(w, u, a.x, a.y, angleTo(a.x, a.y, B.last.x, B.last.y), dmg, 30, B.last);
      const p = w.projectiles[w.projectiles.length - 1]; p.r = 13; p.big = true; p.o.proc = false; p.o.ab = 'bubbleShield'; p.life = 2.2;
    }
  })();
}
// who needs a bubble: [{ a, s }] best first (magic about to land on them, magic users on them, then the hurt)
function bubbleNeeds(w, u) {
  const out = [];
  for (const a of [u, ...allies(w, u)]) {
    if (!alive(a) || a.downed || !realFriend(a) || a.ethereal || isOn(w, a, 'bubble') || dist(u.x, u.y, a.x, a.y) > BUBBLE.reach) continue;
    let s = magicComing(w, a);
    if (!s) { const on = opponents(w, a).filter((e) => e.target === a && !e.dead && magicUser(e) && dist(e.x, e.y, a.x, a.y) < (e.def.range || 30) + 160).length; if (on) s = Math.min(0.75, 0.45 + 0.15 * on); }
    if (s) out.push({ a, s: s + (hpRatio(a) < 0.5 ? 0.12 : 0) });
  }
  return out.sort((p, q) => q.s - p.s);
}

// ---------------------------------------------------------------- the Dome
// Placed over her and the friends round her. Enemy bodies: whoever was outside when it rose stays out, whoever was
// inside stays in (pressed against its skin; a dash, leap or charge into it is broken off). Bosses too; a fixed thing
// (a turret, a boss's part) is let be. The party walks in and out freely. Shots: every enemy shot that meets its skin,
// from outside or from inside, glances off (the skin is a mirror for them; they stay the enemy's); a lobbed thing
// that would come down across it splashes on the skin and never lands. Telegraphed strikes on the floor (danger zones)
// are not shots: they still land. Enemies inside: Wet 16 a second. Friends inside: healed 2.5% a second.
// Tier III: when it comes down, a pool of water stays where it stood (6 s): standing water, the game's own kind.
export const DOME = { r: [0, 135, 165, 165], dur: [0, 4, 6, 6], wet: 16, heal: 0.025, flood: 0.8, floodT: 6 };
function domePlan(w, u, tier) {
  const R = DOME.r[tier];
  const party = [u, ...allies(w, u).filter((a) => realFriend(a) && !a.downed && dist(u.x, u.y, a.x, a.y) < R * 1.5)];
  let cx = 0, cy = 0; for (const a of party) { cx += a.x; cy += a.y; } cx /= party.length; cy /= party.length;
  const dm = dist(cx, cy, u.x, u.y); if (dm > R - 40) { const k = (R - 40) / dm; cx = u.x + (cx - u.x) * k; cy = u.y + (cy - u.y) * k; }
  cx = clamp(cx, 30, w.W - 30); cy = clamp(cy, 30, w.H - 30);
  const near = opponents(w, u).filter((e) => !e.dead && e.aggro && !e.ethereal && dist(e.x, e.y, cx, cy) < R + 90 && e.target && e.target.team === u.team).length;
  let shots = 0; for (const p of w.projectiles) if (p.team !== u.team && p.team !== 'neutral' && !(p.noHit && !p.land) && p.life > 0 && dist(p.x, p.y, cx, cy) < R + 260 && ((p.vx || 0) * (cx - p.x) + (p.vy || 0) * (cy - p.y)) > 0) shots++;
  const shooters = opponents(w, u).filter((e) => !e.dead && e.aggro && (e.def.role === 'ranged' || magicUser(e)) && e.target && e.target.team === u.team && dist(e.x, e.y, cx, cy) > R).length;
  const low = party.some((a) => hpRatio(a) < 0.45 && beset(w, a) > 0);
  const s = (near >= 4 ? 0.6 : near === 3 ? 0.45 : near === 2 ? 0.25 : 0) + Math.min(0.4, shots * 0.12 + shooters * 0.1) + (low ? 0.3 : 0) + (party.length >= 3 && near >= 2 ? 0.1 : 0);
  return { x: cx, y: cy, R, s: near + shots + shooters ? clamp(s, 0, 0.95) : 0 };
}
function raiseDome(w, u, tier, x, y) {
  const R = DOME.r[tier], dur = DOME.dur[tier], side = new WeakMap(), pside = new WeakMap(), team = u.team;
  let last = w.time, wetAcc = 0, healAcc = 0;
  const f = k2(w, { draw: 'waterDome', x, y, r: R, max: dur, src: u, every: 1 / 64, hits: [], tier });
  splash(w, x, y);
  const enemyOf = (o) => o.team !== team && o.team !== 'neutral';
  for (const e of w.units) if (alive(e) && enemyOf(e)) side.set(e, dist(e.x, e.y, x, y) < R);
  f.tick = held(u, () => {
    const dt = Math.min(0.1, w.time - last); last = w.time; if (dt <= 0) return;
    const RR = R; // (the look grows in; the skin holds from the start)
    // bodies: held on their side of the skin
    for (const e of w.units) {
      if (!alive(e) || !enemyOf(e) || e.ethereal || e.fixed || e.def.part || e.linkTo || e.burrowed) continue;
      if (!side.has(e)) side.set(e, dist(e.x, e.y, x, y) < RR);
      const inside = side.get(e), d = dist(e.x, e.y, x, y) || 0.01, nx = (e.x - x) / d, ny = (e.y - y) / d, edge = e.r * 0.5;
      const out = inside ? d > RR - edge : d < RR + edge; if (!out) continue;
      const to = inside ? RR - edge : RR + edge; e.x = x + nx * to; e.y = y + ny * to;
      const vn = e.vx * nx + e.vy * ny, kn = e.kx * nx + e.ky * ny, sg = inside ? 1 : -1;
      if (vn * sg > 0) { e.vx -= vn * nx; e.vy -= vn * ny; } if (kn * sg > 0) { e.kx -= kn * nx * 1.3; e.ky -= kn * ny * 1.3; }
      const A = e.act; if (A && (A.type === 'dash' || A.type === 'leap' || A.type === 'charge' || A.type === 'chargeTell')) { e.act = null; e.hop = 0; }
      if (rand() < dt * 3) f.hits.push({ x: x + nx * RR, y: y + ny * RR, t: f.t });
    }
    // shots: glance off the skin
    for (const p of w.projectiles) {
      if (p.team === team || p.life <= 0) continue;
      const d = dist(p.x, p.y, x, y) || 0.01; if (!pside.has(p)) pside.set(p, d < RR);
      const inside = pside.get(p), nxp = p.x + (p.vx || 0) / 60 * 1.3, nyp = p.y + (p.vy || 0) / 60 * 1.3, dn = dist(nxp, nyp, x, y), m = (p.r || 6) + 4;
      if (inside ? dn < RR - m : dn > RR + m) continue;
      const nx = (p.x - x) / d, ny = (p.y - y) / d;
      f.hits.push({ x: x + nx * RR, y: y + ny * RR, t: f.t });
      if (p.noHit && p.land) { p.life = 0; p.landed = true; drops(w, p.x, p.y, 8, 90); continue; } // a lob: it splashes on the skin
      const vn = p.vx * nx + p.vy * ny; p.vx -= 2 * vn * nx; p.vy -= 2 * vn * ny; p.a = Math.atan2(p.vy, p.vx); p.home = null;
      const to = inside ? RR - m : RR + m; p.x = x + nx * to; p.y = y + ny * to;
      if (p.hitSet) p.hitSet.clear(); sparks(w, p.x, p.y, Math.atan2(ny, nx) * (inside ? -1 : 1), 4, '#BFE9F8', 0.9);
    }
    // inside: the enemies soaked, the friends mended
    wetAcc += dt; healAcc += dt;
    if (wetAcc >= 0.25) { wetAcc -= 0.25; for (const e of foesNear(w, u, x, y, RR)) if (side.get(e)) simAddStatus(w, e, 'wet', DOME.wet * 0.25, u); }
    if (healAcc >= 0.5) { healAcc -= 0.5; for (const a of friendsNear(w, u, x, y, RR)) if (realFriend(a) && !a.downed && a.hp < a.maxHp) { heal(w, a, a.maxHp * DOME.heal * 0.5, u); a.mendGlow = w.time + 0.4; } }
    f.hits = f.hits.filter((h) => f.t - h.t < 0.5);
    // III: it comes down as a flood
    if (tier >= 3 && !f.flooded && f.t >= f.max - 1 / 30) {
      f.flooded = true;
      w.hazards.push({ type: 'water', x, y, r: R * DOME.flood, t: DOME.floodT, max: DOME.floodT });
      k2(w, { draw: 'domeFall', x, y, r: R, max: 0.6 }); splash(w, x, y);
    }
  });
  return f;
}

// ---------------------------------------------------------------- the Water Cannon
// She stands and holds a jet of water straight out (380 long, to the first wall or rock), pulsing every 0.15 s:
// enemies in it are hurt, shoved down the line and soaked; friends in it are healed and washed as the beam washes.
// Tier III: it turns after the enemy it was aimed at (1.3 radians a second), sweeping across whatever is between.
export const CANNON = { len: 380, hw: [0, 24, 32, 32], dur: [0, 1.2, 1.6, 1.6], every: 0.15, dmg: 0.36, knock: 85, wet: 9, heal: 0.014, turn: 1.3 };
function jetLen(w, u, a, L) {
  let d = 24; while (d < L) { const n = Math.min(L, d + 20); if (blocked(w, u.x, u.y, u.x + Math.cos(a) * n, u.y + Math.sin(a) * n)) break; d = n; }
  return d;
}
function onLine(w, u, a, L, hw) {
  const x2 = u.x + Math.cos(a) * L, y2 = u.y + Math.sin(a) * L, E = [], F = [];
  for (const o of w.units) {
    if (!alive(o) || o === u || o.ethereal) continue;
    if (segDist(o.x, o.y, u.x, u.y, x2, y2) > hw + o.r) continue;
    if (((o.x - u.x) * Math.cos(a) + (o.y - u.y) * Math.sin(a)) < 0) continue;
    if (o.team === u.team) { if (!o.def.cargo) F.push(o); } else if (o.team !== 'neutral') E.push(o);
  }
  return { E, F, x2, y2 };
}
function cannonPlan(w, u, tier) {
  const hw = CANNON.hw[tier]; let best = null;
  for (const t of opponents(w, u)) {
    if (t.dead || t.ethereal || t.hidden || dist(u.x, u.y, t.x, t.y) > CANNON.len - 20 || blocked(w, u.x, u.y, t.x, t.y)) continue;
    const a = ang(u, t), L = jetLen(w, u, a, CANNON.len), { E, F } = onLine(w, u, a, L, hw);
    const hurtF = F.filter((f) => realFriend(f) && hpRatio(f) < 0.85).length;
    const s = (E.length >= 3 ? 0.85 : E.length === 2 ? 0.6 : 0.22) + Math.min(0.4, hurtF * 0.2) + (E.length === 1 && opponents(w, u).length === 1 ? 0.15 : 0);
    if (!best || s > best.s) best = { t, a, s, n: E.length };
  }
  return best;
}
function fireCannon(w, u, t, tier, a0) {
  const T = CANNON.dur[tier], hw = CANNON.hw[tier]; let a = a0;
  cast(u, 'cast', T);
  const f = k2(w, { draw: 'waterJet', unit: u, x: u.x, y: u.y, a, len: jetLen(w, u, a, CANNON.len), hw, max: T + 0.25, tier }); u.kit.jetF = f;
  splash(w, u.x, u.y);
  u.act = { type: 'channel', t: T, max: T, target: null, every: CANNON.every, acc: 0, jet: true, tick: held(u, () => {
    if (tier >= 3 && t && alive(t) && !t.ethereal) { const d = wrapAngle(ang(u, t) - a); a += clamp(d, -CANNON.turn * CANNON.every, CANNON.turn * CANNON.every); }
    u.facing = a; f.a = a; const L = jetLen(w, u, a, CANNON.len); f.len = L;
    const { E, F } = onLine(w, u, a, L, hw);
    for (const e of E) hurt(w, e, dmgOf(u, CANNON.dmg), u, { noDodge: true, knock: bossy(e) ? 20 : CANNON.knock, kAngle: a, wet: CANNON.wet });
    for (const o of F) {
      if (o.downed) continue;
      if (o.hp < o.maxHp) { heal(w, o, o.maxHp * CANNON.heal, u); o.mendGlow = w.time + 0.3; }
      if (o.st.burn > 0) o.st.burn = Math.max(0, o.st.burn - BEAM.burnOff * 0.5);
      if (o.st.poison > 0) o.st.poison *= 0.75;
    }
  }) };
  u.facing = a;
}

// ---------------------------------------------------------------- the abilities
export const ABILITIES_WATER = {
  bubbleShield: {
    score(w, u) { const N = bubbleNeeds(w, u); return N.length ? clamp(N[0].s + (N.length >= 2 ? 0.1 : 0), 0, 0.95) : 0; },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4);
      const n = BUBBLE.n[tier], got = bubbleNeeds(w, u).map((x) => x.a).slice(0, n);
      // the rest go to whoever is worst off (hurt and being hit), then to herself
      if (got.length < n) {
        const rest = [u, ...allies(w, u)].filter((a) => alive(a) && !a.downed && realFriend(a) && !a.ethereal && !got.includes(a) && !isOn(w, a, 'bubble') && dist(u.x, u.y, a.x, a.y) < BUBBLE.reach)
          .sort((p, q) => (hpRatio(p) - 0.2 * beset(w, p)) - (hpRatio(q) - 0.2 * beset(w, q)));
        for (const a of rest) { if (got.length >= n) break; got.push(a); }
      }
      for (const a of got) { bubbleOn(w, u, a, tier); k2(w, { draw: 'bubbleBlow', from: u, to: a, x1: u.x, y1: u.y, x2: a.x, y2: a.y, max: 0.35 }); }
      splash(w, u.x, u.y);
    },
    show: { ally: true, shootme: 'spell' },
  },
  waterDome: {
    score(w, u, t, tier) { if (u.kit.domeT > w.time) return 0; return domePlan(w, u, tier).s; },
    use(w, u, t, tier) {
      const P = domePlan(w, u, tier);
      cast(u, 'ability', 0.55); u.kit.domeT = w.time + DOME.dur[tier];
      raiseDome(w, u, tier, P.x, P.y);
    },
    show: { far: true, ally: true, shootme: true },
  },
  waterCannon: {
    score(w, u, t, tier) { const P = cannonPlan(w, u, tier); return P ? P.s : 0; },
    use(w, u, t, tier) {
      const P = cannonPlan(w, u, tier), tt = (P && P.t) || t, a = P ? P.a : tt ? ang(u, tt) : u.facing;
      fireCannon(w, u, tt, tier, a);
    },
    show: { far: true },
  },
};

// ---------------------------------------------------------------- the trait
// Splashback: hit (a blow, not burning or poison) while she stands in water, she throws three of the lizardman's balls
// of water back at whoever hit her (a fan of three, a little homing on it); not more often than every 0.6 s, so a crowd
// can't make a fountain of her.
export const SPLASH = { n: 3, spread: 0.32, dmg: 0.45, wet: 30, gap: 0.6 };
export const TRAITS_WATER = {
  splashback: {
    struck(w, u, src, amt, o) {
      if (!src || !alive(src) || src.team === u.team || src === u || !alive(u) || !inWater(w, u)) return;
      if ((u.kit.splashT || 0) > w.time) return; u.kit.splashT = w.time + SPLASH.gap;
      const a0 = angleTo(u.x, u.y, src.x, src.y);
      for (let i = 0; i < SPLASH.n; i++) waterBall(w, u, u.x, u.y, a0 + (i - (SPLASH.n - 1) / 2) * SPLASH.spread, dmgOf(u, SPLASH.dmg), SPLASH.wet, src);
      k2(w, { draw: 'splashUp', x: u.x, y: u.y, r: u.vr + 12, max: 0.5 });
      splash(w, u.x, u.y);
    },
  },
};

// ---------------------------------------------------------------- the attack, and every step
export const ATTACKS_WATER = {
  waterMage(w, u, t) { beamAttack(w, u, t); },
};
export function waterTick(w, u, dt) {
  if (u.kind !== 'waterMage' || !u.kit || u.summon) return;
  beamTick(w, u, dt);
  const J = u.kit.jetF; if (J && (!u.act || !u.act.jet)) { J.max = Math.min(J.max, J.t + 0.15); u.kit.jetF = null; } // (the jet broken off: a stun, a shove)
}
// for the checks (tools/water17): what the bubble counts as magic
export { isMagic, magicUser };
