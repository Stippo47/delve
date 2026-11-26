// Round 9: the approved additions for the Warren, the Sewers and the Crypt (deck roster2; the designer's notes word for
// word in docs/riffle-log/2026-11-21-round9.txt). Each kind has a base kit and an elite move (ELITES, elites.js).
// Variants are recolours of their base's art (recolor.js). Art round 8 drew the rat king (a heap of rats), the croc (two
// axes) and the crab (its blue and green kinds are it recoloured); the rest is PLACEHOLDER art until the real art comes.
//   The Warren: the spear-thrower goblin ("throws spears (which come back immediately)"), the bomber, the suicide
//     bomber ("Runs at enemy, stands next to them for a moment then explodes, needs to be killed quickly"), the wolf rider
//     ("Uses spear"), the frost shaman, the rock troll (its rolling boulder; the base troll's breakable boulder), the
//     drummer, mice ("goblins keep them as pets") and dynamite mice ("the boss could summon them").
//   The Sewers: the plague rat, the rat king as a normal enemy ("as it takes damage it releases a rat ... On death drops
//     3 more rats for a total of 13"), slime colours (base blue, sludge dark brownish green, toxic lime green), the
//     sludge slime ("moves 2x as fast when burning and on death leaves an oil puddle which immediately burns if it dies
//     burning leaving no small slimes"), the croc ("Should just drag instead. Does more damage to wet enemies. Has 2
//     axes, bite is an ability"), crabs ("Circles in, in wide circles ... Always faces target ... pinches them. Quite
//     fast"; blue: slow bubbles that wet; green: poison bubbles, two in a row), the brain leech ("Makes target fight
//     allies, can still be knocked off, any damage from allies to controlled ally will go to leach") and the blood leech
//     ("Leaches, gets off then shoots the blood as projectiles, then repeats").
//   The Crypt: the golden skeleton (double gold, homing golden bones that go through heroes and hit 1.5x; "immune to
//     status effects completely and has more hp") and the harrowing skeleton ("Revive 1 time after death. On revival
//     makes small burst of curse around them").
import { BUILD_IDS } from './statuses.js';
import { alive, opponents, allies, hurt, puff, sparks, flames, addStatus, setAnim, fx, addBuff, explode, spawn, heal, kill, addDanger, drive, steer, goalVec, turnSide, restoreSide, speedOf, stun } from './sim.js';
import { ballSweep, ballFits, giveBody, retireBody } from './boulders.js'; // (round 19, lane troll19: the boulder is a solid body; lane troll19b: with health)
import { TAU, clamp, dist, angleTo, wrapAngle, angleDiff, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { ELITES, lob, cone, line, around, rush, rushTick, summon, shoot, blink, openSpot, hold, beginHold, due, again, targetOf, gapTo, crowd, stand, turnTo, later } from './elites.js';
import { shamanBrain } from './enemies.js';
import { variantUrl } from './recolor.js';
import { fillOf, windMul } from './statuses.js';

const ART = (f) => `art/enemies/placeholder/${f}.svg`;
const FOE = { team: 'enemy', turn: 4, accel: 220, face: 4, mass: 1.2, temp: 0.35, commit: 0.9 };
const sees = (w, u, t, max) => t && dist(u.x, u.y, t.x, t.y) < max && lineClear(w, u.x, u.y, t.x, t.y, 4);
const lead = (t, k) => ({ x: t.x + (t.vx || 0) * k, y: t.y + (t.vy || 0) * k });
function every(w, u, dt, key, a, b, range, fn) {
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, key, dt, a)) return;
  if (!sees(w, u, t, range)) return;
  again(u, key, a, b); fn(t);
}

// ---------------------------------------------------------------- the Warren
// A spear thrown out that comes straight back to the thrower, cutting both ways.
function boomSpear(w, u, a, o = {}) {
  const sp = 460, reach = o.reach || 300, life = reach / sp;
  setAnim(u, 'throw', 0.35);
  w.projectiles.push({ kind: 'dagger', x: u.x, y: u.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 9, team: u.team, owner: u, dmg: (o.dmg || 7) * u.dmgMul, o: { knock: 120 }, life, a,
    hitSet: new Set(), pierce: 4, land: (p) => { if (!alive(u)) return; const b = angleTo(p.x, p.y, u.x, u.y), dd = dist(p.x, p.y, u.x, u.y);
      w.projectiles.push({ kind: 'dagger', x: p.x, y: p.y, vx: Math.cos(b) * sp * 1.2, vy: Math.sin(b) * sp * 1.2, r: 9, team: u.team, owner: u, dmg: (o.dmg || 7) * 0.7 * u.dmgMul, o: { knock: 80 }, life: dd / (sp * 1.2), a: b, hitSet: new Set(), pierce: 4 }); } });
}
// A bomb with a lit fuse: lobbed, it lands and sits a moment (a circle on the floor) before it blows.
function fuseBomb(w, u, x, y, o = {}) {
  lob(w, u, x, y, { r: 18, tell: o.fly || 0.7, proj: 'vial', color: '#3A3236', kind: 'fire', dust: '#5A4A40', spawns: true,
    land: (w2, z) => addDanger(w2, { shape: 'circle', x: z.x, y: z.y, r: o.r || 72, t: o.fuse || 1.0, team: u.team, src: null, by: u, kind: 'fire', spawns: true,
      hit: { dmg: (o.dmg || 14) * u.dmgMul, knock: 300, heavy: true, burn: o.burn || 0 },
      onFire: (w3, q) => { explode(w3, q.x, q.y, 4, 0, { burn: 1 }, null, '#FF8A3D'); w3.shake = Math.max(w3.shake, 5); } }) });
}
// The suicide bomber (and dynamite mice): runs in, stops next to someone, the fuse fizzes, and it blows (with itself).
function fuseBrain(w, u, dt, o) {
  if (u.fuse != null) {
    u.fuse -= dt; stand(u, dt); u.dvx = u.dvy = 0;
    if (rand() < dt * 30) sparks(w, u.x, u.y - u.vr * 0.6, -Math.PI / 2 + rrange(-0.6, 0.6), 1, '#FFD27A');
    if (u.fuse <= 0) { u.fuse = null; u.blew = true; kill(w, u, null); }
    return true;
  }
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  if (gapTo(u, t) < (o.reach || 22)) {
    u.fuse = o.fuse; setAnim(u, 'ability', o.fuse);
    addDanger(w, { shape: 'circle', x: u.x, y: u.y, r: o.r, t: o.fuse, team: u.team, src: u, kind: 'fire' });
    return true;
  }
  return false;
}
function blowUp(w, u, o) { // its own death: a blast only if the fuse ran out (killed in time, it just falls)
  if (!u.blew) return;
  explode(w, u.x, u.y, o.r, o.dmg * u.dmgMul, { burn: o.burn || 20 }, u, '#FF8A3D');
  w.shake = Math.max(w.shake, 7);
  if (o.fire) w.hazards.push({ type: 'fire', x: u.x, y: u.y, r: 50, t: 4, max: 4 });
}
// Drummer: no damage; everyone of its side close by attacks faster while it plays.
function drumBrain(w, u, dt) {
  if (hold(u, dt)) return true;
  if (!u.aggro) return false;
  if (due(u, 'beat', dt, 0.5)) {
    again(u, 'beat', 0.5);
    for (const a of [u, ...allies(w, u)]) if (dist(a.x, a.y, u.x, u.y) < 280) addBuff(a, { id: 'drums', dur: 0.8, atkSpeed: 1.3, move: 1.1 });
    u.beats = (u.beats || 0) + 1;
    if (u.beats % 4 === 0) { fx(w, { type: 'ring', x: u.x, y: u.y, r: 280, color: '#E0A04B', max: 0.5 }); setAnim(u, 'swing', 0.25); }
  }
  return false;
}
// Wolf rider: charges through the party, spear first; when the wolf falls, the goblin fights on with its spear.
function riderBrain(w, u, dt) {
  if (rushTick(w, u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'charge', dt, 2)) return false;
  const g = gapTo(u, t); if (g < 70 || g > 360 || !lineClear(w, u.x, u.y, t.x, t.y, u.r * 0.8)) return false;
  again(u, 'charge', u.elite ? 3.5 : 5, u.elite ? 4.5 : 7);
  rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 170, { style: 'lance', tell: 0.45, dmg: 13, knock: 300, status: { stagger: 25 }, trail: 'rgba(190,170,140,0.7)' }); // (round 18, lane dash18: spear first: the draw cut with a spear)
  return true;
}
// Frost shaman: a frost ball that bursts and chills (not fire), and an ice totem planted near the party.
function frostBall(w, u, t) {
  const a = angleTo(u.x, u.y, t.x, t.y), sp = 240;
  setAnim(u, 'cast', 0.4);
  w.projectiles.push({ kind: 'bolt', color: '#BFEFFF', x: u.x + Math.cos(a) * (u.r + 8), y: u.y + Math.sin(a) * (u.r + 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    r: 9, team: u.team, owner: u, dmg: 5 * u.dmgMul, o: { knock: 40, chill: 20 }, life: 1.6, a,
    onHit: (w2, p) => explode(w2, p.x, p.y, 48, 4 * u.dmgMul, { chill: 28 }, u, '#BFEFFF') });
}
function frostShamanBrain(w, u, dt) {
  every(w, u, dt, 'ball', 2.6, 3.4, u.def.range, (t) => frostBall(w, u, t));
  if (u.aggro && due(u, 'totem', dt, 4) && !w.stale) {
    const t = targetOf(w, u);
    if (t && w.units.filter((o) => o.kind === 'iceTotem' && o.calledBy === u && alive(o)).length < 2) {
      again(u, 'totem', 10, 12);
      const a = rand() * TAU, x = clamp(t.x + Math.cos(a) * 90, 60, w.W - 60), y = clamp(t.y + Math.sin(a) * 90, 60, w.H - 60);
      const p = openSpot(w, x, y, 0, 60, 24) || { x, y };
      later(w, p.x, p.y, 0.6, () => { const s = spawn(w, 'iceTotem', p.x, p.y, { mult: w.mult }); s.aggro = true; s.minion = true; s.calledBy = u; s.lifeT = 12; puff(w, p.x, p.y, '#DFF6FF', 12, 100, 6, 0.5); });
      setAnim(u, 'cast', 0.5);
    } else again(u, 'totem', 2);
  }
  return false;
}
function totemBrain(w, u, dt) {
  stand(u, dt); u.dvx = u.dvy = 0; u.spd = 0;
  for (const h of opponents(w, u)) if (dist(h.x, h.y, u.x, u.y) < 150 + h.r) addStatus(w, h, 'chill', 16 * dt, u);
  if (rand() < dt * 6) { const a = rand() * TAU, d = rrange(20, 150); w.particles.push({ x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d, vx: 0, vy: 0, rise: 20, up: 0, life: 0.8, max: 0.8, size: 3, color: '#EAF8FF' }); }
  return true;
}

// The troll's boulder (round 9). It walks behind a boulder, pushing it (round 19: and walks round it to turn it; it
// turned slowly "like a car", the boulder swinging round the troll: see CARRY below); with a hero in
// front it either lets it go (it rolls at them, heavy knockback and stagger, slowing as it goes) or charges behind it;
// then it walks over and takes it up again. The boulder is a round obstacle (w.pillars, so it has its own hit box and
// blocks shots and bodies); it's gone when the troll dies. The rock troll's can't be hurt; the base troll's has its own
// health and breaks (then it fights bare-handed). The elite rock troll calls its boulder back, and its boulder is 25%
// bigger.
// Art round 8: the troll holds its boulder in both fists, so a held boulder sits HOLD of the troll's radius inside the
// troll's collider, against the fists (the troll and its own held or rolling boulder don't push each other: sim.js).
export const HOLD = -0.46;
// Round 13 (lane E; the designer, art round 8: "Try different heads. Make them slightly smaller keep boulder same size"):
// the boulder's size is its own, not the troll's: today's boulder (0.62 of the round-8 troll's collider, r 60 x the
// colliders' 1.1 = 66: 41 room units), grown only as an elite or major troll is (u.r over its kind's r), so a smaller
// troll still pushes the same boulder. def.boulderR overrides.
export const BOULDER_R = 41;
const BOULDER_JAM = 3, BOULDER_REST = 4; // round 14 (lane L): seconds getting nowhere before it lets the boulder be; seconds bare-handed after (round 17: 6 -> 4, and only when it had no line to roll it down)
// Round 17 (lane foes17; the designer: "look into the troll shaped enemies not being able to get their boulders"):
// BOULDER_REACH, how far past touching it can reach for its boulder (16 -> 26: a hero or a friend leaning on the far
// side no longer keeps its hands off it); BOULDER_RIP, the stoop to tear a new boulder out of the floor when it can't
// get to the one it has (wedged in a gap it can't fit through, walled in by its friends): the old one crumbles.
const BOULDER_REACH = 26, BOULDER_RIP = 1.1;
// Round 19 (lane troll19; the designer: "The troll should rotate more around the boulder when turning. Many times the
// boulder just pushes entities through walls and stuff as it supposedly doesnt get pushed back when being held."):
// the boulder is the heavy thing. In the troll's fists it is on a rod (boulders.js ballPass: b.grip, b.pull): the troll
// walking into it pushes it along the line from the troll's middle through the boulder's, walking away drags it, and
// nothing else moves it, so to send it another way the troll walks round it to the far side and then pushes (carry).
// It turned "like a car" with the boulder swinging round the troll, through whatever was there. The boulder is solid
// now: walls, rocks and the room's edge stop it, bodies push back on it by their mass, and a stopped boulder stops
// the troll (boulders.js).
//  orbit       how fast it steps round its boulder, of its walking pace (the rock troll's is the slower)
//  roll        as it steps round, it heaves the boulder a little the other way: the two turn about a point this share of
//              the rod from the boulder's middle (0: the boulder stays put and only the troll walks; 1 was the old way,
//              the boulder swinging round the troll). The boulder's part is solid too: against a wall only the troll moves
//  gain        it eases off as it comes onto its line (pace per radian still to go, of the rod's length a second)
//  pushOff/Span  it pushes at full pace within pushOff radians of its line, not at all past pushOff + pushSpan
//  haul        of its pace: dragging the boulder back out of a spot where it has no room to get round it
//  lose        this far past the rod's length the boulder is out of its fists (knocked away from it; the boulder caught)
//  setDown     seconds bare-handed after it sets the boulder down wedged, its mark where it can't bring the boulder round to
const CARRY = { orbit: 2.4, orbitRock: 1.9, roll: 0.3, gain: 3.4, pushOff: 0.28, pushSpan: 0.5, acc: 520, haul: 0.6, lose: 34, setDown: 3 };
const gripOf = (u, b) => u.r * (1 + HOLD) + b.r + 8; // the rod: the boulder's middle from the troll's, against its fists
// Round 19 (lane troll19b). The designer, after seeing 0.41.0: "Also the troll should fight back while going to
// boulder. And yes they should bowl more often. Boulder should go further and start a bit faster. Should show a charge
// up animation. Boulder should have hp and can be destroyed and targeted.idk why spikes come out when the boulder is
// bowled. They should back away from enemies to a min distance before the bowl otherwise they will charge forwards
// still holding the boulder. Boulder should do heavy knockback. Currently it just barely knocks things to the side.
// There no strong impact. Rock troll should have a huge boulder and the boulder comes back to them."
//  speed / speedRock  how fast it is let go (was 320 / 360), and fric, how fast it slows (was 0.9 a second): with
//              nobody in its way it rolls about 650 before it lies still (was 350), hitting hard for the first 480 of
//              that (was 230). Each body it strikes takes some of its speed (it keeps `keep` of it, less off a heavy
//              body) and it slows a little quicker from then on (fricSpent): through one hero it still goes about 380
//  wind        the wind-up before it is let go: the troll rears back with it (windPose): a step back at `rear` a
//              second, the boulder `pull` nearer its chest
//  min         room to roll: the boulder's face this far from its mark before it bowls; nearer, the troll backs off
//              first, dragging the boulder, at backPace of its pace, for at most `back` seconds (a wall at its back:
//              it bowls from where it is)
//  range       how far off (the boulder's face to its mark) it bowls from; further, it walks the boulder nearer
//  cd / cdRock seconds between taking the boulder up and the next bowl (the wait was 5 to 7 s from the last one, and
//              3 s more standing with the boulder against its mark)
//  fetch       its pace going for its boulder, of its walk (it rolls further now, and the troll hurries after it:
//              twice its walk, about a berserker's pace)
//  knock / knockPow  the blow's shove for a body of mass 1 at full speed (it was 420 for everybody, and half of it
//              sideways), times its mass to the knockPow: a heavier body is thrown less far, but not by its whole
//              weight (at full speed an archer about 290, a paladin 235, another troll 185; a fifth less behind a raised
//              shield; as it usually lands, a little slowed: an archer about 210, was 130; a paladin 140, was 70)
//  dmg / dmgRock  the blow (was 14 / 18: less, for what a wall does to a body thrown this hard, and for how often it comes)
//  hp / hpRock the boulder's health, of its troll's own (a troll's was a flat 55, a fifteenth of the troll's in a
//              battle, and only shots took it; the rock troll's could not be hurt)
//  regrow      seconds bare-handed before a rock troll tears up a new one (the troll's stays broken, as before)
//  rockR       the rock troll's boulder (the troll's is BOULDER_R, 41)
//  charge      how often the rock troll runs behind its boulder instead of bowling it (it was 2 in 5; now from further
//              off only, and it lets the boulder go on at the end of its run)
//  ret / retSlow / retSpent / retAfter / retGive  the rock troll's boulder rolls back to it at `ret` (the elite's at
//              retElite), once it has slowed to retSlow (it no longer hurts), or retSpent seconds after it struck
//              somebody, or retAfter seconds out; not back in retGive seconds (a wall between them), the troll goes
//              for it on foot
//  swat / swatRest  fists on its way to its boulder: at most this long over one blow, then this long before the next
const BOWL = { speed: 400, speedRock: 420, fric: 0.6, fricSpent: 0.8, keep: [0.7, 0.9], wind: 0.7, pull: 13, rear: 44, min: 120, back: 1.3, backPace: 1.5, range: 470, line: 520, cd: [1.4, 2.0], cdRock: [2.4, 3.2],
  fetch: 2.0, knock: 900, knockPow: 0.75, shield: 0.8, stun: 0.2, hitstop: 0.04, dmg: 6, dmgRock: 7, hp: 0.25, hpRock: 0.7, regrow: 7, rockR: 54, charge: 0.15,
  ret: 330, retElite: 400, retSlow: 120, retSpent: 1.3, retAfter: 2.4, retGive: 5, swat: 0.9, swatRest: 1.2 };
if (globalThis.BOWL19) Object.assign(BOWL, globalThis.BOWL19); // (for the tools: tools/troll19b, a test's own numbers)
function boulderOf(w, u) {
  if (u.bould === undefined) {
    // (round 19, lane troll19b: "Rock troll should have a huge boulder": BOWL.rockR, 54 against the troll's 41, nearly
    // as wide as the rock troll itself. Its elite's and its major's grow a little less than they do (66 and 80; they
    // were 64 and 79, a quarter bigger than a boulder of 41 grown as they are): a major's of 92 fitted few gaps)
    const grown = u.r / (u.def.r || u.r), r = Math.round(u.def.boulderR || (u.def.rock ? BOWL.rockR * grown ** 0.9 : BOULDER_R * grown));
    const b = { x: u.x, y: u.y, r, prop: 'troll-boulder', boulder: true, owner: u, team: u.team, vx: 0, vy: 0, held: true, pull: true, hits: new Set() };
    b.grip = gripOf(u, b);
    // (round 19, lane troll19: out from its own middle to its fists, as far as there is room: it was made in front of
    // the troll whatever stood there, a wall included)
    ballSweep(w, b, u.x + Math.cos(u.facing) * b.grip, u.y + Math.sin(u.facing) * b.grip);
    // (round 19, lane troll19b: every boulder has health, and a body that carries it: boulders.js giveBody. A swing, a
    // shot, a blast: all of it lands on that. Its health is a share of its troll's own (so it grows as the troll does,
    // elite, major, deeper floors): a troll's a quarter of the troll's, a rock troll's seven tenths of the rock troll's)
    giveBody(w, b, spawn, 'boulderBody', u.maxHp * (u.def.rock ? BOWL.hpRock : BOWL.hp));
    b.onShot = (w2, b2, p) => { const s = b2.body; if (s && !s.dead && p.team !== s.team && !(p.hitSet && p.hitSet.has(s))) hurt(w2, s, p.dmg || 0, p.owner && alive(p.owner) ? p.owner : null, { shot: true, kAngle: Math.atan2(p.vy, p.vx), knock: 0 }); };
    b.onBreak = (w2, b2) => breakBoulder(w2, u, b2);
    b.onBlocked = (w2, b2, sp) => boulderHits(w2, u, b2, sp, Math.atan2(b2.vy, b2.vx)); // (stopped by a body that couldn't give way: it hits them: boulders.js)
    b.rollTick = (w2, dt2) => rollBoulder(w2, u, b, dt2); // (round 19, lane troll19: boulders.js rolls it on while its troll is stunned, frozen or asleep: it stopped dead in mid-roll)
    u.bould = b; w.pillars.push(b);
  }
  return u.bould;
}
// Broken to pieces (round 19, lane troll19b: its health ran out, boulders.js): it bursts where it is, the way a thrown
// rock does (fx3.js rockBurst: a white knock, dust rolling out, rock thrown every way), and the troll is bare-handed.
function breakBoulder(w, u, b) {
  const i = w.pillars.indexOf(b); if (i >= 0) w.pillars.splice(i, 1);
  retireBody(b);
  if (u.bould === b) { u.bould = null; u.bThrow = null; u.chg = null; u.bPose = true; u.regrowT = BOWL.regrow; }
  fx(w, { type: 'k2', draw: 'rockBurst', x: b.x, y: b.y, r: b.r * 1.7, max: 0.7, shards: true });
  puff(w, b.x, b.y, '#B9AE9C', 18, 200, 8, 0.6); w.shake = Math.max(w.shake, 6);
  w.telegraphs.push({ type: 'blast', thud: true, x: b.x, y: b.y, r: b.r * 1.3, t: 0.25, max: 0.25, color: '#CFC3AA' }); // (a burst of dust, and its boom: audio.js)
  for (let k = 0; k < 9; k++) { const a = rand() * TAU, s = rrange(120, 260); w.particles.push({ x: b.x + Math.cos(a) * b.r * 0.4, y: b.y + Math.sin(a) * b.r * 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.7, max: 0.7, size: rrange(5, 9), color: k % 2 ? '#8C8270' : '#6C645C' }); }
}
export function dropBoulder(w, u) { const b = u.bould; if (b) { const i = w.pillars.indexOf(b); if (i >= 0) w.pillars.splice(i, 1); retireBody(b); puff(w, b.x, b.y, '#9A9088', 14, 150, 6, 0.5); } u.bould = null; }
// Its steps for one tick with its fists on the boulder (round 19, lane troll19): fwd along the line through the
// boulder (into it: pushing; negative: dragging it back), tan round it (positive swings the line anticlockwise: the
// troll goes the other way round), with a little momentum; its face is to the boulder.
function rodWalk(w, u, b, fwd, tan, dt, acc = CARRY.acc) {
  const phi = angleTo(u.x, u.y, b.x, b.y), c = Math.cos(phi), s = Math.sin(phi);
  let vx = c * fwd + s * tan, vy = s * fwd - c * tan;
  const ax = vx - u.dvx, ay = vy - u.dvy, al = Math.hypot(ax, ay), m = acc * dt;
  if (al > m) { vx = u.dvx + ax / al * m; vy = u.dvy + ay / al * m; }
  u.dvx = vx; u.dvy = vy; u.spd = Math.hypot(vx, vy); if (u.spd > 3) u.mvA = Math.atan2(vy, vx);
  u.facing = phi; u.sdx = u.sdy = 0;
  // the boulder's part of the turn: heaved the other way round the point they turn about, as far as the room lets it
  const got = u.dvx * s - u.dvy * c, k = CARRY.roll / (1 - CARRY.roll) * got * dt;
  if (Math.abs(k) > 0.01) ballSweep(w, b, b.x - s * k, b.y + c * k);
}
// Round onto the line a behind its boulder within `left` seconds (a tell: it shuffles round quickly, fists on it).
function lineUp(w, u, b, a, left, dt, fwd = 0) { // (round 19, lane troll19b: fwd, its step back as it rears)
  const err = wrapAngle(a - angleTo(u.x, u.y, b.x, b.y)), top = u.def.speed * (u.moveMul || 1) * 4.5;
  rodWalk(w, u, b, fwd, clamp(err * b.grip * (1 - CARRY.roll) / Math.max(left, dt * 2), -top, top), dt, 3000);
}
// Which way the boulder has to go to get to (tx, ty): straight, or round the walls and rocks (the path finder asked for
// a body the troll's width at the boulder's place; the boulder itself out of the room while it asks. As the yeti's
// ballWay, foes10.js).
function boulderWay(w, u, b, tx, ty) {
  const nav = b.nav || (b.nav = { path: null, pathT: 0, pathGoal: null });
  nav.x = b.x; nav.y = b.y; nav.r = Math.max(u.r, b.r); nav.def = u.def; // (def: the wagon mode's way round the wagon reads it, convoy.js roundRig)
  const i = w.pillars.indexOf(b); if (i >= 0) w.pillars.splice(i, 1);
  try { const [gx, gy] = goalVec(w, nav, tx, ty); return Math.atan2(gy, gx); } finally { if (i >= 0) w.pillars.splice(i, 0, b); }
}
// Has its body room to step round the boulder that way (sg: +1 swings the line anticlockwise), `span` radians on?
function roundFree(w, u, b, phi, sg, span) {
  for (const k of [0.3, 0.62]) {
    const a = phi + sg * Math.min(k, span);
    if (!ballFits(w, b, b.x - Math.cos(a) * b.grip, b.y - Math.sin(a) * b.grip, u.r - 5)) return false;
    if (k >= span) break;
  }
  return true;
}
// Has the boulder room to be swung round the troll that way, a quarter of a radian on?
const swingFree = (w, u, b, phi, sg) => ballFits(w, b, u.x + Math.cos(phi + sg * 0.25) * b.grip, u.y + Math.sin(phi + sg * 0.25) * b.grip, b.r - 2);
// Walking with the boulder in its fists (round 19, lane troll19). It wants the boulder to go the way A (at its mark,
// or round the walls to it). Near that line it pushes, stepping a little to the side as it goes to bring the boulder
// round; well off it, it stops pushing and walks round the boulder, the short way where its body has room, the long
// way where it hasn't; with no room either way it heaves the boulder round itself; with no room for that either
// (the boulder against a wall, in a corner) it pushes on or drags the boulder back
// out until it has. sim.js skips its own walking and facing for the tick (u.carryAt).
function carry(w, u, b, t, dt, standOff = false) { // (round 19, lane troll19b: standOff, it turns the boulder at its mark where it stands and doesn't push)
  u.carryAt = w.time;
  if (!t || !u.aggro) { rodWalk(w, u, b, 0, 0, dt); return; } // nothing to go for: it stands by its boulder
  const sp = speedOf(u), phi = angleTo(u.x, u.y, b.x, b.y);
  const A = boulderWay(w, u, b, t.x, t.y), err = wrapAngle(A - phi), ae = Math.abs(err);
  const C = u.bCar || (u.bCar = { dir: 0, until: 0 });
  let fwd = sp * clamp(1 - (ae - CARRY.pushOff) / CARRY.pushSpan, 0, 1), tan = 0;
  // (the designer, later in round 19: "Things that are touching the boulder almost get glued to it, in front. Like if he
  // rolls the bolder into someone it kind of holds the target in front.") With the boulder up against its mark it stops
  // pushing: it holds the boulder to them, turning it after them, and lets it go into them (the point-blank roll, a
  // wedged throw) instead of walking them across the room on the boulder's front. Anyone else in the boulder's way slips
  // off round its face (boulders.js SHED).
  if (standOff || dist(t.x, t.y, b.x, b.y) < b.r + t.r + 8) fwd = Math.min(fwd, 0);
  if (ae > 0.03) {
    let dir = C.until > w.time && C.dir ? C.dir : Math.sign(err) || 1;
    const rem = (sg) => (sg === Math.sign(err) ? ae : TAU - ae);
    if (!roundFree(w, u, b, phi, dir, rem(dir))) {
      if (roundFree(w, u, b, phi, -dir, rem(-dir))) { dir = -dir; C.dir = dir; C.until = w.time + 2.5; } // (the way round holds once picked, a while)
      else dir = 0;
    }
    const pace = sp * (u.def.rock ? CARRY.orbitRock : CARRY.orbit);
    if (dir) tan = dir * Math.min(pace, rem(dir) * b.grip * (1 - CARRY.roll) * CARRY.gain);
    // no room for its own body to step round the boulder (a wall at its back or its side), but room for the boulder:
    // it stands and heaves the boulder round itself instead, at the same turn (the old way of turning, with a solid boulder)
    else if (swingFree(w, u, b, phi, Math.sign(err) || 1)) {
      const sg = Math.sign(err) || 1, a2 = phi + sg * Math.min(ae, pace / (b.grip * (1 - CARRY.roll)) * dt, ae * CARRY.gain * dt);
      ballSweep(w, b, u.x + Math.cos(a2) * b.grip, u.y + Math.sin(a2) * b.grip);
    } else if (ae > CARRY.pushOff) {
      // no room to get round it here (walls or rocks on both sides of it): on with the boulder, or back out dragging it,
      // whichever way has the more room, until it can step round it (the way holds a moment once picked)
      if (!(C.wayT > w.time)) {
        const c = Math.cos(phi), s = Math.sin(phi);
        let ahead = 0, behind = 0;
        while (ahead < 150 && ballFits(w, b, b.x + c * (ahead + 30), b.y + s * (ahead + 30))) ahead += 30;
        while (behind < 150 && ballFits(w, b, u.x - c * (behind + 30), u.y - s * (behind + 30), u.r - 5)) behind += 30;
        C.way = ahead > behind ? 1 : behind > 0 ? -1 : 0; C.wayT = w.time + 1.2;
      }
      fwd = C.way > 0 ? sp * 0.8 : C.way < 0 ? -sp * CARRY.haul : 0;
      if (!fwd) C.idleAt = w.time; // (nothing it can do with the boulder here: boulderBrain counts it as wedged)
    }
  }
  rodWalk(w, u, b, fwd, tan, dt);
}
// The boulder let go down its line: `tell` seconds in which the troll steps round behind it onto the line (the line
// is on the floor from the boulder) and winds up, then it goes, along the line through the troll and the boulder.
// (round 19, lane troll19b: "idk why spikes come out when the boulder is bowled": the line on the floor was a danger
// zone of the 'bone' kind with no blow of its own, and a zone that runs out strikes: fxkit.js drew its strike, a row of
// bone spikes the whole length of the line, as the boulder left. The boulder is the blow, so the line only warns now:
// cancelled, as the yeti's, foes10.js WARN. The rock troll's charge line did the same.)
function startThrow(w, u, b, a, tell, line = true) {
  u.bThrow = { a, t: tell, max: tell };
  if (line) addDanger(w, { shape: 'line', x1: b.x, y1: b.y, x2: b.x + Math.cos(a) * BOWL.line, y2: b.y + Math.sin(a) * BOWL.line, hw: b.r + 6, t: tell, team: u.team, src: u, kind: 'bone', cancelled: true });
  setAnim(u, 'throw', tell);
}
// The wind-up (round 19, lane troll19b: "Should show a charge up animation"): k 0..1. The troll rears back, its fists
// drawn in, the boulder hauled back against its chest (b.grip, boulderBrain) and shaking (b.wind19, boulder-roll.js),
// grit kicked up round the boulder's foot, more as it comes to the top.
function windPose(w, u, b, k, dt) {
  u.bPose = true; u.lean = -0.34 * k;
  u._force = { 'arm-r': { dy: -8 * k, r: 0.34 * k }, 'arm-l': { dy: -8 * k, r: -0.34 * k } };
  b.wind19 = k;
  if (k > 0.03 && rand() < dt * (16 + 40 * k)) { // grit and dust flung up from under the boulder, out to its sides and back
    const side = rand() < 0.5 ? 1 : -1, back = angleTo(b.x, b.y, u.x, u.y), a = back + side * rrange(0.7, 1.9), s = rrange(70, 170) * (0.5 + k), stone = rand() < 0.45;
    w.particles.push({ x: b.x + Math.cos(a) * b.r * 0.85, y: b.y + Math.sin(a) * b.r * 0.85, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rise: stone ? 0 : 30, up: 0, life: 0.5, max: 0.5, size: stone ? rrange(3.5, 6) : rrange(6, 10), color: stone ? '#8C8270' : rand() < 0.5 ? '#D8CCB0' : '#E6DCC6' });
  }
}
function throwTick(w, u, b, dt) {
  const T = u.bThrow;
  if (!b.held) { u.bThrow = null; b.wind19 = 0; return false; }
  u.winding = true; T.t -= dt / windMul(u);
  const k = clamp(1 - T.t / (T.max || BOWL.wind), 0, 1), e = k * k * (3 - 2 * k);
  b.grip = gripOf(u, b) - BOWL.pull * e;
  lineUp(w, u, b, T.a, T.t, dt, k < 0.75 ? -BOWL.rear : 0); // (it steps back as it rears, then stands for the heave)
  windPose(w, u, b, e, dt);
  if (T.t <= 0) {
    u.bThrow = null; b.wind19 = 0;
    const a = angleTo(u.x, u.y, b.x, b.y), s = u.def.rock ? BOWL.speedRock : BOWL.speed, c = Math.cos(a), sn = Math.sin(a);
    b.held = false; b.vx = c * s; b.vy = sn * s; b.hits.clear(); b.outAt = w.time; b.recalled = false; b.spent = null; stand(u, dt);
    // the heave: it comes forward after it, and the floor behind the boulder goes up in dust
    u.lungeT = 0.18; u.bFollow = 0.3; setAnim(u, 'swing', 0.3);
    puff(w, b.x - c * b.r * 0.7, b.y - sn * b.r * 0.7, '#D8CCB0', 12, 170, 7, 0.5); w.shake = Math.max(w.shake, 3.5);
    for (let i = 0; i < 6; i++) { const q = a + Math.PI + rrange(-0.9, 0.9), v = rrange(120, 240); w.particles.push({ x: b.x - c * b.r * 0.6, y: b.y - sn * b.r * 0.6, vx: Math.cos(q) * v, vy: Math.sin(q) * v, life: 0.5, max: 0.5, size: rrange(4, 7), color: '#8C8270' }); }
  }
  return true;
}
// Wedged with its boulder again where it was wedged before (within 70, inside 20 s)? True the n-th time running.
function wedgedAgain(w, u, n) {
  const J = u.bWedge && dist(u.x, u.y, u.bWedge.x, u.bWedge.y) < 70 && w.time - u.bWedge.t < 20 ? u.bWedge : (u.bWedge = { x: u.x, y: u.y, n: 0, t: 0 });
  J.n++; J.t = w.time;
  if (J.n < n) return false;
  u.bWedge = null; return true;
}
export function boulderBrain(w, u, dt) {
  if (u.bPose) { u.bPose = false; u.lean = 0; u._force = null; } // (round 19, lane troll19b: the wind-up's pose is set again each tick it lasts)
  if (u.bFollow > 0) { u.bFollow -= dt; u.bPose = true; u.lean = 0.22 * clamp(u.bFollow / 0.3, 0, 1); } // (its follow-through after the heave)
  if (u.ripT > 0) return ripTick(w, u, dt); // tearing a new one out of the floor
  // (round 19, lane troll19b: the boulder broken (its health: breakBoulder). The troll fights on bare-handed, as before;
  // the rock troll, whose boulder is all it has, tears a new one out of the floor after BOWL.regrow seconds, at a moment
  // nobody is at its throat)
  if (u.bould === null && u.def.rock && u.regrowT != null && u.aggro && !w.stale) {
    if ((u.regrowT -= dt) <= 0 && !u.act && !opponents(w, u).some((h) => !h.ballOf && gapTo(u, h) < 30)) { u.regrowT = null; startRip(w, u); return true; }
    if (u.regrowT < -4) { u.regrowT = null; startRip(w, u); return true; } // (never left alone: it stoops for one all the same)
  }
  const b = u.bould === null ? null : boulderOf(w, u);
  if (!b) return false;
  b.grip = gripOf(u, b);
  // (round 19, lane troll19b: wedged in a wall for more than half a second (boulders.js b.wedged: a huge boulder dragged
  // on into a slot too narrow for it): no use to it there: it crumbles and the troll tears up a new one, round 17's rule.
  // One lay 66 deep between a crate and a wall for a minute while its troll snatched at it from the far side)
  if (b.wedged > 0.5) { startRip(w, u); return true; }
  if (!b.held) { rollBoulder(w, u, b, dt); b.rolledAt = w.time; }
  // (round 19, lane troll19: out of its fists: it was knocked away from it, or the boulder caught on something as it
  // was dragged: it lies where it is and the troll goes for it again)
  else if (dist(u.x, u.y, b.x, b.y) > b.grip + CARRY.lose) { b.held = false; b.vx = b.vy = 0; u.bThrow = null; u.chg = null; }
  // (and squeezed: no room for it and its boulder where they are, a wall at its back and the boulder up against
  // something: it lets go and steps off a moment; a second time in the same spot, the boulder is no use to it there:
  // the round-17 rule, it crumbles and the troll tears up a new one)
  else if (b.squeeze > 12) {
    if ((u.bSq = (u.bSq || 0) + dt) > 0.35) {
      u.bSq = 0; b.held = false; b.vx = b.vy = 0; u.bThrow = null; u.chg = null;
      if (wedgedAgain(w, u, 2)) { startRip(w, u); return true; }
      u.bouldRest = Math.max(u.bouldRest || 0, 1.5);
    }
  } else u.bSq = 0;
  // round 14 (lane L): standing through a tell (an elite's or a major's own move)
  if (hold(u, dt)) { if (b.held) u.facing = angleTo(u.x, u.y, b.x, b.y); return true; }
  if (u.bThrow) { if (throwTick(w, u, b, dt)) return true; }
  // charging behind it
  if (u.chg) {
    const c = u.chg;
    if (!b.held) u.chg = null;
    else if (c.tell > 0) { c.tell -= dt; u.winding = true; lineUp(w, u, b, c.a, c.tell, dt); windPose(w, u, b, clamp(1 - c.tell / 0.7, 0, 1) * 0.7, dt); if (c.tell <= 0) b.wind19 = 0; return true; } // (round 19: it steps round behind the boulder onto its line; lane troll19b: and rears back, as for a bowl)
    else {
      const phi = angleTo(u.x, u.y, b.x, b.y), err = wrapAngle(c.a - phi);
      rodWalk(w, u, b, c.sp, clamp(err * b.grip * 6, -c.sp * 0.6, c.sp * 0.6), dt, 4000); u.vx = u.dvx; u.vy = u.dvy;
      boulderHits(w, u, b, c.sp, phi);
      // (round 19: the boulder is solid, so it also ends when the boulder is stopped: a wall, a rock, somebody it can't shift)
      const mv = Math.hypot(b.x - (c.bx ?? b.x), b.y - (c.by ?? b.y)); c.bx = b.x; c.by = b.y; c.run = (c.run || 0) + dt;
      c.slow = c.run > 0.15 && mv < c.sp * dt * 0.35 ? (c.slow || 0) + dt : 0;
      const nx = b.x + Math.cos(phi) * (b.r + 6), ny = b.y + Math.sin(phi) * (b.r + 6);
      const ran = (c.t -= dt) <= 0;
      if (ran || c.slow > 0.1 || nx < 4 || ny < 4 || nx > w.W - 4 || ny > w.H - 4 || !lineClear(w, b.x, b.y, nx, ny, 2)) {
        u.chg = null; u.spd *= 0.2;
        // (round 19, lane troll19b: at the end of its run it lets the boulder go on ahead (it stopped with it in its
        // fists, up against whoever was there: "they will charge forwards still holding the boulder"); whoever the
        // run already struck isn't struck again by it. Stopped short by a wall or a body, it keeps hold as before)
        if (ran) {
          const s = c.sp + 250; b.held = false; b.vx = Math.cos(phi) * s; b.vy = Math.sin(phi) * s; b.outAt = w.time; b.recalled = false; b.spent = null;
          u.lungeT = 0.18; u.bFollow = 0.3; puff(w, b.x - Math.cos(phi) * b.r * 0.7, b.y - Math.sin(phi) * b.r * 0.7, '#D8CCB0', 10, 150, 6, 0.45);
        } else { b.hits.clear(); w.shake = Math.max(w.shake, 4); }
      }
      return true;
    }
  }
  // round 14 (lane L; rooms that dragged on): a troll that gets nowhere (wedged in a gap too narrow for it, or walking
  // after a boulder it can't get to) lets it be: it rolls it at its mark, or leaves it where it lies, and fights
  // bare-handed a while before it goes for it again. Held in front of a wedged troll, the boulder plugged the way for
  // everyone, and the troll stood there with it for minutes.
  const jam = u.bJam || (u.bJam = { x: u.x, y: u.y, t: 0 });
  if (dist(u.x, u.y, jam.x, jam.y) > 40) { jam.x = u.x; jam.y = u.y; jam.t = 0; }
  if (u.bouldRest > 0) { u.bouldRest -= dt; if (!b.held) return false; }
  if (!b.held) { // go and get it
    // (round 19, lane troll19b: "Rock troll should have a huge boulder and the boulder comes back to them": every rock
    // troll's, not only the elite's. Once it has slowed, or BOWL.retAfter seconds out, it rolls back to its troll,
    // wherever the troll has got to (turned towards it every step; it was sent at where the troll stood, once every
    // 1.5 s). The troll doesn't walk after it: it fights with its fists until the boulder is back in them. Not back
    // in BOWL.retGive seconds (a wall between them, a doorway too narrow), the troll goes and gets it, as a troll does.
    // The plain one's only shoulders people aside on its way home; the elite's hits them again (boulderHits).)
    const v2 = b.vx * b.vx + b.vy * b.vy;
    if (u.def.rock && b.outAt != null && !b.recalled && w.time - b.outAt > 0.45 && (v2 < BOWL.retSlow * BOWL.retSlow || (b.spent && w.time - b.spent > BOWL.retSpent) || w.time - b.outAt > BOWL.retAfter)) { b.recalled = true; b.backAt = w.time; b.hits.clear(); }
    if (b.recalled) {
      if (w.time - b.backAt > BOWL.retGive) { b.recalled = false; b.outAt = null; b.vx = b.vy = 0; }
      else {
        const a = angleTo(b.x, b.y, u.x, u.y), want = u.elite ? BOWL.retElite : BOWL.ret, k = Math.min(1, dt * 5);
        b.vx += (Math.cos(a) * want - b.vx) * k; b.vy += (Math.sin(a) * want - b.vy) * k;
      }
    }
    // (round 19, lane troll19b: and never from further than it can hold it at, CARRY.lose: a big boulder across a wall's
    // end was taken up and lost again every few steps, for as long as the fight lasted)
    if (dist(u.x, u.y, b.x, b.y) < Math.min(u.r + b.r + BOULDER_REACH, b.grip + CARRY.lose - 4) && (v2 < 3600 || b.recalled)) { // (round 17: a boulder it called back is caught as it comes: it rolled on through the troll and away, back and forth)
      b.held = true; b.vx = b.vy = 0; b.recalled = false; b.outAt = null; b.spent = null; b.hits.clear(); setAnim(u, 'ability', 0.3); jam.t = 0;
      again(u, 'boulder', ...(u.def.rock ? BOWL.cdRock : BOWL.cd)); u.bStand = null; // (round 19, lane troll19b: "they should bowl more often": the next one this soon after it has it again)
      return false;
    }
    if (b.recalled || (u.def.rock && b.outAt != null)) return false; // (its fists, the plain brain, while the boulder is out and on its way back)
    // (round 19, lane troll19b: "the troll should fight back while going to boulder": somebody in reach of its fists on
    // the way gets them (the plain brain's blow, its wind-up and all), then it walks on)
    if (swat(w, u, dt)) { if (u.bFetch) u.bFetch.at = w.time; return false; }
    // round 17 (lane foes17): it can't get to it (round 14 left it be a while and came back to try again, so a boulder
    // in a gap too narrow for it, or behind its friends, kept it walking up to it and standing by it for good): it
    // tears a new one out of the floor where it stands, and the old one crumbles
    // (getting nowhere: no nearer to it by 20 in BOULDER_JAM seconds; sliding to and fro along a wall in front of it
    // moved it far enough to count as getting somewhere)
    const dB = dist(u.x, u.y, b.x, b.y), F = u.bFetch && u.bFetch.b === b && w.time - u.bFetch.at < 0.5 ? u.bFetch : (u.bFetch = { b, best: dB, t: 0, at: w.time });
    F.at = w.time; if (dB < F.best - 20 || b.vx * b.vx + b.vy * b.vy > 3600 || Math.hypot(u.kx, u.ky) > 60) { F.best = Math.min(F.best, dB); F.t = 0; } // (not while it still rolls, or the troll is knocked about)
    if (dB > F.best + 60) F.best = dB; // (knocked back from it: counted from there)
    if ((F.t += dt) > BOULDER_JAM) { u.bFetch = null; jam.t = 0; startRip(w, u); return true; }
    const [gx, gy] = goalVec(w, u, b.x, b.y), [sx, sy] = steer(w, u, gx, gy);
    drive(u, sx, sy, u.def.speed * (u.moveMul || 1) * BOWL.fetch, dt); // (round 19, lane troll19b: BOWL.fetch, it hurries after it)
    turnTo(u, angleTo(u.x, u.y, b.x, b.y), 3, dt);
    return true;
  }
  const t = targetOf(w, u), phi = angleTo(u.x, u.y, b.x, b.y);
  // (round 19, lane troll19: or with no way to turn the boulder to its mark where it stands, carry's C.idleAt: its mark
  // may be in reach of its fists, behind it, and its fists are on the boulder)
  if (t && u.aggro && !(u.el && u.el.holdT > 0) && (gapTo(u, t) > (u.def.range || 30) + 12 || (u.bCar && w.time - u.bCar.idleAt < 0.1))) jam.t += dt; else jam.t = 0;
  if (jam.t > BOULDER_JAM && t) { // wedged with it: let it go at its mark (it rolls till something stops it)
    // (round 17, lane foes17: bare-handed a while only when it has no line to roll it down: with a hero up against the
    // boulder, or a clear way to them, this is its throw, and it goes straight for the boulder after it, as after any
    // throw; the rest had it standing by its boulder for six seconds, then picking it up and wedging again)
    // (round 19, lane troll19: with its mark off to its side or behind it, where it can't get the boulder round to push,
    // it sets the boulder down and uses its fists)
    // (and "at the boulder" only with nothing between them: a mark just past a gap too narrow for the boulder isn't at it.
    // The boulder went through the wall to them before; now the troll leaves it and goes round on foot)
    const a = angleTo(u.x, u.y, t.x, t.y), atIt = dist(t.x, t.y, b.x, b.y) < b.r + t.r + 40 && lineClear(w, b.x, b.y, t.x, t.y, b.r * 0.45);
    jam.t = 0; u.bouldRest = atIt || lineClear(w, b.x, b.y, t.x, t.y, b.r * 0.7) ? 0 : BOULDER_REST;
    // (wedged three times running without getting anywhere: this boulder is no use to it here: a new one, round 17's rule)
    const lined = angleDiff(a, phi) < 1.1;
    if ((u.bouldRest > 0 || !lined) && wedgedAgain(w, u, 3)) { startRip(w, u); return true; }
    if (lined) startThrow(w, u, b, a, 0.5, false);
    else { b.held = false; b.vx = b.vy = 0; u.bouldRest = Math.max(u.bouldRest, CARRY.setDown); return false; }
    return true;
  }
  // Round 19 (lane troll19b): the bowl. The designer: "yes they should bowl more often", "They should back away from
  // enemies to a min distance before the bowl otherwise they will charge forwards still holding the boulder."
  // With its mark in bowling range and a clear line, the troll no longer walks the boulder on into them: it stands
  // off, turning the boulder at them; with them nearer than BOWL.min it backs away first, dragging the boulder after
  // it (for BOWL.back seconds at most, or until something behind it stops it), and as soon as it may (BOWL.cd after
  // it took the boulder up) it winds up and bowls. Out of range, or with no line, it walks the boulder nearer as before.
  if (t && u.aggro) {
    const gap = dist(t.x, t.y, b.x, b.y) - b.r - t.r, S = u.bStand || (u.bStand = { back: 0, mv: 0, x: u.x, y: u.y });
    const clear = gap < BOWL.range && lineClear(w, b.x, b.y, t.x, t.y, b.r * 0.7), ready = due(u, 'boulder', dt, 1.5);
    if (clear) {
      jam.t = 0; // (standing off is its own doing, not a wedge)
      const aim = angleTo(b.x, b.y, t.x + (t.vx || 0) * 0.25, t.y + (t.vy || 0) * 0.25), off = angleDiff(aim, phi);
      const near = gap < BOWL.min && S.back < BOWL.back && !S.walled;
      if (ready && off < 1.3 && !near) {
        jam.t = 0; u.bStand = null; again(u, 'boulder', 4, 5); // (the real wait is set when it has the boulder again)
        if (u.def.rock && gap > 200 && chance(BOWL.charge)) { // charge behind it
          const len = gap + b.r + 110, sp = u.def.speed * 2.6;
          u.chg = { a: aim, tell: 0.7, t: len / sp, sp };
          addDanger(w, { shape: 'line', x1: b.x, y1: b.y, x2: b.x + Math.cos(aim) * len, y2: b.y + Math.sin(aim) * len, hw: b.r + 8, t: 0.7, team: u.team, src: u, kind: 'bone', cancelled: true });
          setAnim(u, 'ability', 0.7 + len / sp);
        } else startThrow(w, u, b, aim, BOWL.wind + 0.3 * Math.max(0, off - 0.4)); // let it go: it rolls at them
        return true;
      }
      if (near) {
        // backing off for room to roll: away from its mark, the boulder dragged after it and kept turned at them
        const err = wrapAngle(aim - phi), sp = speedOf(u), top = sp * CARRY.orbit;
        u.carryAt = w.time;
        rodWalk(w, u, b, -sp * BOWL.backPace, clamp(err * b.grip * 3, -top, top), dt);
        S.back += dt; S.mv += Math.hypot(u.x - S.x, u.y - S.y); S.x = u.x; S.y = u.y;
        if (S.back > 0.4 && S.mv < sp * S.back * 0.3) S.walled = true; // (something at its back: it bowls from where it stands)
        return false;
      }
      S.x = u.x; S.y = u.y;
      if (gap > BOWL.min + 40) { S.back = Math.max(0, S.back - dt); S.mv = 0; S.walled = false; }
      carry(w, u, b, t, dt, true); // standing off: it turns the boulder at them, and waits for its moment
      return false;
    }
  }
  carry(w, u, b, t, dt);
  return false;
}
// Its fists on the way to its boulder (round 19, lane troll19b; the designer: "the troll should fight back while going
// to boulder"). True while it stops for a blow: somebody is in reach, its fists are ready (or the blow is under way).
// The plain brain does the rest (it turns to them and swings, with the wind-up any troll's blow has). It doesn't stop
// for long: BOWL.swat seconds at most over one blow (somebody it can't turn to in time), then on to the boulder for
// BOWL.swatRest before it looks again; between blows (its fists not ready) it walks on.
function swat(w, u, dt) {
  const S = u.bSwat || (u.bSwat = { t: 0, rest: 0 });
  if (u.act) { S.t = 0; return true; } // mid-blow
  if (S.rest > 0) { S.rest -= dt; return false; }
  if (u.atkT > 0.15 || u.shackledT > 0 || u.disarmT > 0) { S.t = 0; return false; }
  let best = null, bd = (u.def.range || 30) + 6;
  for (const h of opponents(w, u)) { if (h.ballOf) continue; const g = gapTo(u, h); if (g < bd) { bd = g; best = h; } }
  if (!best) { S.t = 0; return false; }
  if ((S.t += dt) > BOWL.swat) { S.t = 0; S.rest = BOWL.swatRest; return false; }
  u.target = best; u.mode = 'approach';
  return true;
}
// The stoop to tear a new boulder out of the floor (round 17, lane foes17): the old one crumbles where it lies; the
// troll stands over the spot in front of it, the floor cracking and heaving, and comes up with a new one in its fists.
function startRip(w, u) {
  const old = u.bould; if (old) dropBoulder(w, u);
  u.bould = undefined; u.ripT = BOULDER_RIP; u.bJam = null; u.bouldRest = 0;
  setAnim(u, 'ability', BOULDER_RIP); stand(u, 0);
}
function ripTick(w, u, dt) {
  stand(u, dt); u.ripT -= dt;
  const k = u.r * (1 + HOLD) + (u.def.boulderR || BOULDER_R) + 8, x = u.x + Math.cos(u.facing) * k, y = u.y + Math.sin(u.facing) * k;
  if (rand() < dt * 18) { const a = rand() * TAU, d = rrange(0, 34); w.particles.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, rise: 30, up: 0, life: 0.5, max: 0.5, size: rrange(4, 8), color: '#8C8270' }); }
  if (u.ripT <= 0) { u.ripT = 0; const b = boulderOf(w, u); puff(w, b ? b.x : x, b ? b.y : y, '#9A9088', 16, 160, 7, 0.5); w.shake = Math.max(w.shake, 3); }
  return true;
}
function rollBoulder(w, u, b, dt) {
  const sp = Math.hypot(b.vx, b.vy);
  if (sp < 4) { b.vx = b.vy = 0; return; }
  const k = Math.exp(-(b.recalled ? 0.4 : b.spent ? BOWL.fricSpent : BOWL.fric) * dt); b.vx *= k; b.vy *= k; // it slows as it goes (round 19, lane troll19b: "Boulder should go further": 0.9 -> BOWL.fric)
  const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
  // (round 19, lane troll19: the true round shape against walls and their corners, boulders.js; it was a square box
  // against walls, so it stopped short of a corner it would have rolled past. And a wall it only grazes it rolls along:
  // let go beside a wall it was lying against, it stopped dead on the spot, and whoever stood in front of it was not hit)
  if (!ballFits(w, b, nx, ny)) {
    const x0 = b.x, y0 = b.y, step = sp * dt;
    ballSweep(w, b, nx, ny);
    const mx = b.x - x0, my = b.y - y0, along = (mx * b.vx + my * b.vy) / sp;
    if (along < step * 0.5) { // head on: it stops against it (a small bounce)
      b.x = x0; b.y = y0; boulderHits(w, u, b, sp, Math.atan2(b.vy, b.vx));
      b.vx *= -0.25; b.vy *= -0.25; puff(w, b.x, b.y, '#CDBFA6', 8, 120, 5, 0.4); w.shake = Math.max(w.shake, 3); b.hits.clear(); return;
    }
    const ml = Math.hypot(mx, my) || 1, keep = sp * (along / step); b.vx = mx / ml * keep; b.vy = my / ml * keep; // (along the wall, the slower for it)
  } else { b.x = nx; b.y = ny; }
  if (rand() < dt * 10) w.particles.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: 6, color: 'rgba(190,176,150,0.6)' });
  boulderHits(w, u, b, sp, Math.atan2(b.vy, b.vx));
}
// Round 19 (lane troll19b; the designer: "Boulder should do heavy knockback. Currently it just barely knocks things to
// the side. There no strong impact."). It knocked 420 whoever it hit, half a radian off its way to the side: a paladin
// went about 50. Now the blow throws them on down its way (a third of a radian to the side they were on, so they land
// clear of it), BOWL.knock for a body of mass 1 at full speed and less for a heavier one (as it usually
// lands an archer about 210, a paladin 140; BOWL.knockPow), off their feet for a moment (BOWL.stun), with an impact you can see and hear: a
// burst of dust and grit at the point it struck them (a blast: fxkit.js draws it, audio.js booms), sparks, the room
// shakes, and a hair of hit-stop. The boulder loses some of its speed to each (BOWL.keep, more to a heavy body) and
// rolls on.
// Walls stop a thrown body as they stop any knocked body (sim.js physics, and its wallHit).
function boulderHits(w, u, b, sp, a) {
  if (sp < 110) return;
  if (b.recalled && !u.elite) return; // (rolling home: the plain rock troll's only shoulders people aside, boulders.js)
  const full = u.def.rock ? BOWL.speedRock : BOWL.speed, k = clamp(0.55 + 0.45 * sp / full, 0.55, 1) * (b.recalled ? 0.6 : 1); // (a slower boulder throws less far: from full at full speed to a little over half)
  for (const h of opponents(w, u)) {
    if (b.hits.has(h) || dist(h.x, h.y, b.x, b.y) > b.r + h.r + 6) continue;
    b.hits.add(h);
    const to = angleTo(b.x, b.y, h.x, h.y), side = Math.sign(Math.sin(to - a)) || 1, m = Math.max(0.5, h.mass || 1);
    const kx0 = h.kx, ky0 = h.ky, shove = BOWL.knock * k * m ** BOWL.knockPow;
    hurt(w, h, (u.def.rock ? BOWL.dmgRock : BOWL.dmg) * (b.recalled ? 0.6 : 1) * u.dmgMul, u, { knock: shove, kAngle: a + side * 0.33, heavy: true, stagger: 30 }); // (stagger 50 -> 30: it bowls about twice as often, and three in a row are not to stun for seconds)
    // (a raised shield takes two fifths of any shove, sim.js hurt; of a boulder's it takes a fifth: BOWL.shield)
    { const gx = h.kx - kx0, gy = h.ky - ky0, got = Math.hypot(gx, gy), least = shove * 1.6 / m * BOWL.shield; if (got > 1 && got < least) { h.kx = kx0 + gx / got * least; h.ky = ky0 + gy / got * least; } }
    if (h.ballOf) continue; // (another troll's boulder: hurt, no more)
    if (alive(h) && k > 0.7 && !h.def.boss && !h.def.part) stun(w, h, BOWL.stun);
    const cx = b.x + Math.cos(to) * b.r, cy = b.y + Math.sin(to) * b.r;
    w.telegraphs.push({ type: 'blast', thud: true, x: cx, y: cy, r: 30 + b.r * 0.6 * k, t: 0.25, max: 0.25, color: '#D8CCB0' }); // (thud: no explosion: a yeti's ball isn't thrown about by it, foes10.js)
    sparks(w, cx, cy, a, 7, '#FFF6DC', 1.4);
    for (let i = 0; i < 5; i++) { const q = a + rrange(-1.2, 1.2), v = rrange(140, 300) * k; w.particles.push({ x: cx, y: cy, vx: Math.cos(q) * v, vy: Math.sin(q) * v, life: 0.5, max: 0.5, size: rrange(4, 7), color: i % 2 ? '#8C8270' : '#B9AE9C' }); }
    w.shake = Math.max(w.shake, 4 + 4 * k); w.hitstop = Math.max(w.hitstop || 0, BOWL.hitstop * k);
    if (!b.held) { const keep = clamp(1 - m / 9, ...BOWL.keep); b.vx *= keep; b.vy *= keep; if (!b.spent) b.spent = w.time; } // (it has spent some of itself on them)
  }
}

// ---------------------------------------------------------------- the Sewers
// The rat king: a knot of rats; as it's hurt, rats break loose (10 in it, one per tenth of its health), and three more
// when it dies: thirteen in all.
function ratKingBrain(w, u, dt) {
  const inside = 10, out = Math.floor((1 - u.hp / u.maxHp) * inside), gone = u.loosed || 0;
  if (out > gone && !w.stale) { u.loosed = out; looseRats(w, u, out - gone); }
  return false;
}
function looseRats(w, u, n) {
  for (let i = 0; i < n; i++) {
    if (crowd(w, u.team) >= 26) return;
    const a = rand() * TAU, s = spawn(w, chance(0.3) ? 'ratPlague' : 'rat', u.x + Math.cos(a) * u.r, u.y + Math.sin(a) * u.r, { mult: w.mult });
    s.kx = Math.cos(a) * 220; s.ky = Math.sin(a) * 220; s.aggro = true; s.minion = true; s.calledBy = u;
  }
  puff(w, u.x, u.y, '#9C8676', 6 + n * 2, 120, 5, 0.4);
}
// The sludge slime: twice as fast while burning, and dying burning it leaves no slimes (u.noSplit) but a burning patch
// of oil; otherwise the oil is left to light.
function sludgeBrain(w, u, dt) {
  const burning = u.st.burn > 8;
  u.noSplit = burning;
  if (burning) { addBuff(u, { id: 'sludgeburn', dur: 0.3, move: 2 }); if (rand() < dt * 10) flames(w, u.x, u.y, 1, u.vr * 0.6, 70); }
  return false;
}
function sludgeDeath(w, u) {
  const burning = u.st.burn > 8 || u.noSplit;
  w.hazards.push({ type: burning ? 'fire' : 'oil', x: u.x, y: u.y, r: 52, t: burning ? 5 : 14, max: burning ? 5 : 14 });
  if (burning) flames(w, u.x, u.y, 10, 30, 90);
}
// Croc: two axes (its attack), and a bite that holds and drags the hero (an ability). It hits wet heroes harder.
const WET_JAWS = { dealt(w, u, t, amt) { return amt * (1 + 0.6 * fillOf(t, 'wet')); } };
function crocBrain(w, u, dt) {
  if (!u.trinketHooks || !u.trinketHooks.includes(WET_JAWS)) u.trinketHooks = [...(u.trinketHooks || []), WET_JAWS];
  const g = u.drag;
  if (g) { // backing off with the hero in its jaws
    g.t -= dt;
    const h = g.who;
    if (!alive(h) || g.t <= 0 || Math.hypot(h.kx, h.ky) > 260) { u.drag = null; u.atkT = Math.max(u.atkT, 0.6); return false; }
    const a = g.a + Math.PI; u.dvx = Math.cos(a) * u.def.speed * 0.7; u.dvy = Math.sin(a) * u.def.speed * 0.7; u.mvA = a; u.spd = u.def.speed * 0.7; u.facing = g.a;
    h.x = u.x + Math.cos(g.a) * (u.r + h.r + 2); h.y = u.y + Math.sin(g.a) * (u.r + h.r + 2); h.rootT = Math.max(h.rootT || 0, 0.15);
    if ((g.tick -= dt) <= 0) { g.tick = 0.4; hurt(w, h, 4 * u.dmgMul, u, { noDodge: true, wet: u.elite ? 18 : 0 }); }
    return true;
  }
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'bite', dt, 3) || gapTo(u, t) > 24) return false;
  again(u, 'bite', 7, 9);
  const a = angleTo(u.x, u.y, t.x, t.y);
  beginHold(u, 0.4, a, () => { if (!alive(t) || gapTo(u, t) > 40) return; hurt(w, t, 14 * u.dmgMul, u, { knock: 0, wet: u.elite ? 40 : 0 }); u.drag = { who: t, a: angleTo(u.x, u.y, t.x, t.y), t: 1.4, tick: 0.4 }; });
  setAnim(u, 'ability', 0.5);
  return true;
}
// Crabs: they come in on wide circles (about 80% round, 20% in), always facing their mark, quick; close up, they pinch
// (the plain attack). The blue one shoots slow bubbles that soak, the green one poison bubbles, two at a time.
function crabBrain(w, u, dt) {
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  if (rushTick(w, u, dt)) return true;
  if (u.def.bubbles) every(w, u, dt, 'bub', 2.6, 3.4, 320, (tt) => bubbles(w, u, tt));
  const g = gapTo(u, t);
  if (g < 34 || u.act) return false; // close enough: pinch
  const a = angleTo(u.x, u.y, t.x, t.y), side = u.crabSide || (u.crabSide = chance(0.5) ? 1 : -1);
  if (u.stuckT > 0.6) u.crabSide = -side;
  const dx = Math.cos(a) * 0.2 + Math.cos(a + side * Math.PI / 2) * 0.8, dy = Math.sin(a) * 0.2 + Math.sin(a + side * Math.PI / 2) * 0.8;
  const [sx, sy] = steer(w, u, dx * 100, dy * 100);
  drive(u, sx, sy, u.def.speed * (u.moveMul || 1) * (u.staleBoost ? 1.3 : 1), dt);
  const mv = Math.hypot(u.x - (u.cx ?? u.x), u.y - (u.cy ?? u.y)); u.cx = u.x; u.cy = u.y; u.stuckT = mv < 20 * dt ? (u.stuckT || 0) + dt : 0;
  u.facing = wrapAngle(u.facing + clamp(wrapAngle(a - u.facing), -8 * dt, 8 * dt)); // always facing it
  return true;
}
function bubbles(w, u, t) {
  const n = u.def.bubbles.n, a = angleTo(u.x, u.y, t.x, t.y);
  setAnim(u, 'cast', 0.35);
  for (let i = 0; i < n; i++) later(w, u.x, u.y, 0.01 + i * 0.25, () => { if (!alive(u)) return;
    shoot(w, u, angleTo(u.x, u.y, t.x, t.y) + rrange(-0.06, 0.06), { kind: 'water', speed: 150, dmg: 4, r: 10, life: 2.4, hitO: { knock: 40, ...u.def.bubbles.hit },
      onHit: (w2, p) => puff(w2, p.x, p.y, u.def.bubbles.color, 8, 70, 5, 0.4) }); }, 4);
}
// Leeches. The blood leech latches on, drinks a few seconds, drops off and spits the blood back as shots, then again.
// The brain leech latches on and turns its host against its friends for a while (team swapped; the host's allies'
// blows on it go to the leech instead, and a hard knock throws the leech off).
function latchTo(w, u, h) { u.host = h; u.latchT = 0; u.mass = 0.05; }
function unlatch(w, u) {
  const h = u.host; u.host = null; u.mass = u.def.mass;
  if (h && h.charmed === u) { if (h.flipKind === 'leech') restoreSide(w, h); h.charmed = null; h.charmCd = 6; fx(w, { type: 'ring', x: h.x, y: h.y, r: h.r * 1.6, color: '#F2A0C8', max: 0.4 }); }
  if (h) { const a = rand() * TAU; u.x = h.x + Math.cos(a) * (h.r + u.r + 6); u.y = h.y + Math.sin(a) * (h.r + u.r + 6); u.kx = Math.cos(a) * 160; u.ky = Math.sin(a) * 160; }
  u.offT = rrange(2.5, 3.5);
}
function leechRide(w, u, dt) { // stuck to the host's back; true while on
  const h = u.host;
  if (!h) return false;
  if (!alive(h) || Math.hypot(h.kx, h.ky) > 240) { unlatch(w, u); return false; }
  const b = h.facing + Math.PI; u.x = h.x + Math.cos(b) * (h.r * 0.6); u.y = h.y + Math.sin(b) * (h.r * 0.6); u.vx = u.vy = u.kx = u.ky = 0; u.dvx = u.dvy = 0; u.spd = 0; u.facing = h.facing;
  u.latchT += dt;
  return true;
}
function bloodLeechBrain(w, u, dt) {
  if (leechRide(w, u, dt)) {
    if ((u.sipT = (u.sipT || 0) - dt) <= 0) { u.sipT = 0.5; const got = hurt(w, u.host, 3 * u.dmgMul, u, { dot: true, color: '#C8453D' }); heal(w, u, got, u); u.blood = (u.blood || 0) + 1; }
    if (u.latchT > 3) { const h = u.host; unlatch(w, u); spit(w, u, h); }
    return true;
  }
  return leechHop(w, u, dt, false);
}
function spit(w, u, h) {
  const n = Math.min(u.elite ? 6 : 3, Math.max(2, u.blood || 0)); u.blood = 0;
  const a = h ? angleTo(u.x, u.y, h.x, h.y) : u.facing;
  for (let i = 0; i < n; i++) later(w, u.x, u.y, 0.25 + i * 0.18, () => { if (!alive(u)) return; const t = targetOf(w, u) || h; if (!t || !alive(t)) return;
    shoot(w, u, angleTo(u.x, u.y, t.x, t.y) + rrange(-0.1, 0.1), { kind: 'bolt', color: '#C8453D', speed: 300, dmg: 5, r: 7, life: 1.4, hitO: { knock: 40 } }); }, 4);
}
function brainLeechBrain(w, u, dt) {
  if (leechRide(w, u, dt)) {
    const h = u.host, others = w.units.filter((o) => o !== h && alive(o) && !o.summon && (o.team === 'hero' || o.trueTeam === 'hero') && o.team !== 'enemy');
    if (u.latchT > (u.elite ? 7 : 5) || !others.length) unlatch(w, u); // never the last one standing
    else if (h.charmed === u) { h.target = null; }
    return true;
  }
  return leechHop(w, u, dt, true);
}
function leechHop(w, u, dt, charm) {
  if (u.offT > 0) { u.offT -= dt; return false; }
  const t = targetOf(w, u); if (!t || !u.aggro || t.summon || !(t.team === 'hero') || u.act) return false;
  if (charm) { // only on a hero that isn't the last one up, and not one just let go
    const up = w.units.filter((o) => o.team === 'hero' && alive(o) && !o.summon).length;
    if (up < 2 || t.charmCd > 0 || t.charmed || t.trueTeam) return false;
  }
  if (gapTo(u, t) > 12) return false;
  latchTo(w, u, t);
  if (charm) { turnSide(w, t, u.team, 'leech', u); t.charmed = u; fx(w, { type: 'ring', x: t.x, y: t.y, r: t.r * 1.6, color: '#F2A0C8', max: 0.5 }); }
  puff(w, t.x, t.y, charm ? '#F2A0C8' : '#C8453D', 8, 70, 5, 0.4);
  return true;
}

// ---------------------------------------------------------------- the Crypt
// The golden skeleton: golden bones all round it that home in on heroes and go through them, hitting 1.5x as hard.
function goldenBones(w, u, n) {
  const a0 = rand() * TAU, bones = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + i / n * TAU;
    const p = { kind: 'bone', color: '#F2C84A', x: u.x + Math.cos(a) * (u.r + 30), y: u.y + Math.sin(a) * (u.r + 30), vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, r: 8, team: u.team, owner: u,
      dmg: u.def.dmg * 1.5 * u.dmgMul, o: { knock: 80 }, life: 3.2, a, hitSet: new Set(), pierce: 3, home: true };
    w.projectiles.push(p); bones.push(p);
  }
  (u.bones || (u.bones = [])).push(...bones);
  setAnim(u, 'cast', 0.5);
}
function steerBones(w, u, dt) {
  if (!u.bones) return;
  u.bones = u.bones.filter((p) => p.life > 0);
  for (const p of u.bones) {
    let best = null, bd = Infinity; for (const h of opponents(w, u)) { if (p.hitSet.has(h)) continue; const d = dist(p.x, p.y, h.x, h.y); if (d < bd) { bd = d; best = h; } }
    const sp = Math.min(340, Math.hypot(p.vx, p.vy) + 260 * dt);
    let a = Math.atan2(p.vy, p.vx); if (best) a += clamp(wrapAngle(angleTo(p.x, p.y, best.x, best.y) - a), -3 * dt, 3 * dt);
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.a = a;
  }
}
function goldenBrain(w, u, dt) {
  if (!u.goldOn) { u.goldOn = true; addBuff(u, { id: 'gilded', dur: 1e9, statusImmune: true }); }
  steerBones(w, u, dt);
  if (u.aggro && due(u, 'bones', dt, 3) && opponents(w, u).some((h) => dist(h.x, h.y, u.x, u.y) < 420)) { again(u, 'bones', u.elite ? 5 : 8, u.elite ? 6.5 : 10); goldenBones(w, u, u.elite ? 8 : 5); }
  return false;
}
// The harrowing skeleton: falls, then gets up again once, with a burst of curse round it.
function harrowDeath(w, u) {
  if (u.harrowed) return;
  const { x, y } = u, elite = u.elite;
  later(w, x, y, 2.2, () => {
    const s = spawn(w, u.kind, x, y, { mult: w.mult }); s.harrowed = true; s.aggro = true; s.hp = s.maxHp * 0.6; s.minion = u.minion;
    if (elite) { s.elite = true; s.look = u.look; s.maxHp = u.maxHp; s.hp = u.maxHp * 0.6; s.dmgMul = u.dmgMul; s.r = u.r; s.vr = u.vr; }
    fx(w, { type: 'ring', x, y, r: 100, color: '#9A5CC8', max: 0.5 });
    for (const h of opponents(w, s)) if (dist(h.x, h.y, x, y) < 100 + h.r) hurt(w, h, 6 * s.dmgMul, s, { curse: elite ? 50 : 35, knock: 160 });
    puff(w, x, y, '#5A2A80', 16, 140, 6, 0.6);
  }, 30);
}

// ---------------------------------------------------------------- the kinds
const GOB = 'goblin';
export const FOES9 = {
  // ---- the Warren
  mouse: { variantOf: 'rat', name: 'Mouse', light: 0.12, sat: 0.7, size: 0.8, hp: 12, dmg: 3, xp: 3, ratMove: true },
  dynamouse: { variantOf: 'rat', name: 'Dynamite Mouse', hue: -10, light: 0.04, sat: 1.2, size: 0.85, hp: 12, dmg: 0, atkCd: 999, xp: 4, ratMove: true,
    brain: (w, u, dt) => fuseBrain(w, u, dt, { fuse: 0.9, r: 70 }), onDeath: (w, u) => blowUp(w, u, { r: 70, dmg: 14 }) },
  goblinSpear: { variantOf: GOB, name: 'Spear Goblin', hue: 25, light: -0.04, role: 'ranged', range: 220, keep: 150, atkCd: 999, xp: 6,
    brain: (w, u, dt) => { every(w, u, dt, 'spear', 2.4, 3.2, 300, (t) => { const a = angleTo(u.x, u.y, t.x, t.y); boomSpear(w, u, a); if (u.elite) { boomSpear(w, u, a - 0.25); boomSpear(w, u, a + 0.25); } }); return false; } },
  goblinBomber: { variantOf: GOB, name: 'Goblin Bomber', hue: -110, sat: 1.1, role: 'ranged', range: 260, keep: 200, atkCd: 999, xp: 7,
    brain: (w, u, dt) => { every(w, u, dt, 'bomb', 3, 4.2, 360, (t) => { const p = lead(t, 0.5); fuseBomb(w, u, p.x, p.y); if (u.elite) for (const da of [-1, 1]) fuseBomb(w, u, p.x + da * 90, p.y + rrange(-60, 60), { fuse: 1.2 }); }); return false; } },
  goblinSuicide: { variantOf: GOB, name: 'Suicide Bomber', hue: -150, sat: 0.9, light: -0.08, hp: 26, speed: 104, atkCd: 999, xp: 7, ability: null,
    brain: (w, u, dt) => fuseBrain(w, u, dt, { fuse: 1.1, r: u.elite ? 120 : 95 }), onDeath: (w, u) => blowUp(w, u, { r: u.elite ? 120 : 95, dmg: 26, fire: u.elite }) },
  drummer: { variantOf: GOB, name: 'Drummer', hue: -40, sat: 0.8, light: 0.05, role: 'ranged', range: 200, keep: 230, atkCd: 999, hp: 30, xp: 8, ability: null, brain: drumBrain },
  wolfRider: { team: 'enemy', name: 'Wolf Rider', art: variantUrl('art/enemies/wolf.svg', { hue: 18, sat: 1.2, light: -0.1 }), headR: 34, r: 30, vr: 22, turn: 5, accel: 320, face: 5, mass: 1.8,
    hp: 64, speed: 78, role: 'melee', range: 40, atkCd: 1.2, windup: 0.25, dmg: 9, knock: 160, arc: 0.9, temp: 0.4, commit: 0.8, xp: 16, coins: [3, 6], attackAnim: 'thrust',
    beast: true, brain: riderBrain,
    onDeath: (w, u) => { const s = spawn(w, 'goblinSpear', u.x, u.y, { mult: w.mult }); s.aggro = true; s.minion = u.minion; s.kx = u.kx; s.ky = u.ky; if (u.elite) { s.elite = true; s.look = u.look; } } },
  frostShaman: { variantOf: 'orcShaman', name: 'Frost Shaman', hue: 150, sat: 0.9, light: 0.04, res: { chill: 0.2, burn: 1.3 }, brain: frostShamanBrain },
  iceTotem: { team: 'enemy', name: 'Ice Totem', art: variantUrl('art/enemies/placeholder/snowman.svg', { light: 0.05, sat: 1.4, hue: 10 }), headR: 60, r: 20, vr: 16, turn: 0, accel: 0, face: 0,
    mass: 99, hp: 26, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0, temp: 0.2, commit: 2, xp: 2, coins: [0, 0], cost: 99, noCorpse: true, goo: '#DFF6FF', noElite: true,
    res: { chill: 0, poison: 0 }, brain: totemBrain },
  // round 19 (lane troll19b): a boulder's health (boulders.js giveBody): a unit that sits on the boulder and takes its
  // blows; it draws nothing, pushes nobody, takes no status; never in a room's roster (cost 99, as the totem)
  boulderBody: { team: 'enemy', name: 'Boulder', r: 41, vr: 41, turn: 0, accel: 0, face: 0, mass: 99, hp: 110, speed: 0, role: 'melee', range: 0, atkCd: 999, dmg: 0,
    temp: 0.2, commit: 1, xp: 0, coins: [0, 0], cost: 99, noElite: true, noCorpse: true, part: true, trap: true /* (never counted as a foe left standing: battle.js, dungeon.js) */, pass: true, ball: 'stone', goo: '#9A9088',
    res: Object.fromEntries(BUILD_IDS.map((id) => [id, 0])), draw: () => {}, brain: () => true },
  rockTroll: { variantOf: 'troll', name: 'Rock Troll', hue: 0, sat: 0.25, light: -0.02, rock: true, turn: 1.3, face: 1.6, hp: 172, /* (round 19, lane troll19b: 190 -> 172, as the troll's) */ xp: 34,
    brain: boulderBrain, onDeath: (w, u) => dropBoulder(w, u) },
  // ---- the Sewers
  ratPlague: { variantOf: 'rat', name: 'Plague Rat', hue: 70, sat: 1.3, light: -0.04, poison: 14, xp: 5, ratMove: true, res: { poison: 0 },
    onDeath: (w, u) => w.hazards.push({ type: 'gas', x: u.x, y: u.y, r: 54, t: 4, max: 4 }) },
  ratKing: { variantOf: 'rat', name: 'Rat King', art: 'art/enemies/rat-king.svg', headR: 66, size: 2.3, hp: 100, speed: 54, dmg: 9, knock: 140, arc: 2, role: 'melee', ability: null, xp: 26, coins: [5, 10],
    pack: null, ratMove: false, mass: 2.4, brain: ratKingBrain, onDeath: (w, u) => { u.hp = 0; looseRats(w, u, 3); } },
  slimeSludge: { variantOf: 'slime', name: 'Sludge Slime', hue: -150, sat: 0.55, light: -0.2, hp: 58, xp: 10, goo: '#5A5A30', res: { burn: 1.4 },
    brain: sludgeBrain, onDeath: sludgeDeath },
  croc: { team: 'enemy', name: 'Croc', art: 'art/enemies/croc.svg', headR: 56, r: 36, vr: 27, turn: 3.4, accel: 200, face: 3.4, mass: 2.2, hp: 110, speed: 54, role: 'melee', range: 22,
    atkCd: 1.0, windup: 0.25, dmg: 9, knock: 120, arc: 1.8, temp: 0.3, commit: 1, xp: 22, coins: [4, 8], attackAnim: 'swing', res: { burn: 0.8, chill: 1.3 }, brain: crocBrain },
  crab: { team: 'enemy', name: 'Sewer Crab', art: 'art/enemies/crab.svg', headR: 57, r: 24, vr: 19, turn: 8,
    accel: 460, face: 8, mass: 1.2, hp: 38, speed: 78, role: 'melee', range: 14, atkCd: 0.9, windup: 0.15, dmg: 7, knock: 90, arc: 1.4, shield: 0.5, temp: 0.4, commit: 0.8,
    xp: 9, coins: [2, 4], attackAnim: 'thrust', brain: crabBrain },
  crabBlue: { variantOf: 'crab', name: 'Blue Crab', hue: 180, xp: 10, bubbles: { n: 1, color: '#8FD3F0', hit: { wet: 40 } } },
  crabGreen: { variantOf: 'crab', name: 'Green Crab', hue: 90, xp: 11, bubbles: { n: 2, color: '#9BCB3C', hit: { poison: 22 } } },
  leechBlood: { variantOf: 'slimeSmall', name: 'Blood Leech', hue: 145, sat: 1.4, light: -0.1, hp: 22, speed: 92, dmg: 3, atkCd: 999, xp: 6, hops: null, noCorpse: false, goo: '#C8453D',
    role: 'melee', range: 6, brain: bloodLeechBrain },
  leechBrain: { variantOf: 'slimeSmall', name: 'Brain Leech', hue: 105, sat: 1.1, light: 0.06, hp: 24, speed: 86, dmg: 0, atkCd: 999, xp: 8, hops: null, noCorpse: false, goo: '#F2A0C8',
    role: 'melee', range: 6, brain: brainLeechBrain },
  // ---- the Crypt
  rattlerGold: { variantOf: 'rattler', name: 'Golden Skeleton', hue: 28, sat: 2.2, light: 0.04, hp: 85, coins: [4, 10], xp: 16,
    res: Object.fromEntries(BUILD_IDS.map((k) => [k, 0])), brain: goldenBrain }, // round 18 (the resistance audit): the shell blocks all fifteen, so the list says so
  rattlerHarrow: { variantOf: 'rattler', name: 'Harrowing Skeleton', hue: 250, sat: 0.6, light: -0.12, xp: 13, onDeath: harrowDeath },
};

// ---------------------------------------------------------------- their elite moves
Object.assign(ELITES, {
  mouse: { tick() { return false; } },          // (as rats: the elite rat's plague trail via eliteAs would be odd on a pet) none
  dynamouse: { tick() { return false; } },
  goblinSpear: { tick() { return false; } },    // three spears at once (its brain reads u.elite)
  goblinBomber: { tick() { return false; } },   // three bombs at once
  goblinSuicide: { tick() { return false; } },  // a bigger blast that leaves fire
  // Drummer: a beat that thumps everyone close back.
  drummer: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    if (!due(u, 'thump', dt, 3) || !opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 130 + h.r)) return false;
    again(u, 'thump', 5, 7); around(w, u, { r: 140, tell: 0.6, kind: 'bone', hit: { dmg: 5, knock: 340, stagger: 35 } }); return true;
  } },
  wolfRider: { tick() { return false; } },      // charges more often, and its goblin gets up elite too
  // Frost shaman: a blizzard where the party stands.
  frostShaman: { tick(w, u, dt) { every(w, u, dt, 'blizz', 5, 7, 420, (t) => lob(w, u, t.x, t.y, { r: 90, tell: 1.0, proj: 'bolt', color: '#F4FBFF', pr: 12, kind: 'ice', dust: '#F4FBFF', hit: { dmg: 8, chill: 50 } })); return false; } },
  rockTroll: { tick() { return false; } },      // calls its boulder back, and it's 25% bigger (boulderOf / boulderBrain read u.elite)
  ratPlague: { tick(w, u, dt) { return ELITES.rat.tick(w, u, dt); } }, // a trail of sickly gas, like an elite rat
  // Rat king: sheds a ring of rats at once when it's hurt badly.
  ratKing: { tick(w, u, dt) { if (u.hp < u.maxHp * 0.5 && !u.burst) { u.burst = true; looseRats(w, u, 4); } return false; } },
  // Sludge slime: lobs a glob of oil.
  slimeSludge: { tick(w, u, dt) { every(w, u, dt, 'oil', 4, 5.5, 380, (t) => lob(w, u, t.x, t.y, { r: 50, tell: 0.9, proj: 'water', color: '#5A5A30', kind: 'poison', dust: '#5A5A30', hit: { dmg: 4 },
    land: (w2, z) => { if (!w2.hazards.some((h) => (h.type === 'oil' || h.type === 'fire') && dist(h.x, h.y, z.x, z.y) < 40)) w2.hazards.push({ type: 'oil', x: z.x, y: z.y, r: 46, t: 12, max: 12 }); } })); return false; } },
  croc: { tick() { return false; } },           // its bite and its drag soak (crocBrain reads u.elite)
  // Crab: snaps both claws: a short lunge that staggers.
  crab: { tick(w, u, dt) {
    const t = targetOf(w, u); if (!t || !due(u, 'snap', dt, 2.5)) return false;
    const g = gapTo(u, t); if (g < 30 || g > 150 || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return false;
    again(u, 'snap', 4, 5.5); rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 20, { style: 'feint', tell: 0.3, dmg: 9, knock: 180, status: { stagger: 40 } }); return true; // (round 18, lane dash18: a scuttle to one side, then the snap: the feint)
  } },
  leechBlood: { tick() { return false; } },     // spits up to six shots (spit reads u.elite)
  leechBrain: { tick() { return false; } },     // holds its host longer
  rattlerGold: { tick() { return false; } },    // more bones, more often (goldenBrain reads u.elite)
  rattlerHarrow: { tick(w, u, dt) { // a cold, cursing aura while it walks
    if (!u.aggro || !due(u, 'aura', dt, 1)) return false; again(u, 'aura', 1);
    for (const h of opponents(w, u)) if (dist(h.x, h.y, u.x, u.y) < 110 + h.r) addStatus(w, h, 'curse', 8, u); return false;
  } },
});
