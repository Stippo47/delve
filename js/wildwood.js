// The Wildwood (round 9): the new first dungeon, a forest. The designer approved the roster (deck roster2) with changes,
// and these follow their words (docs/riffle-log/2026-11-21-round9.txt):
//   wolf, dire wolf; slime ("Shouldn't leave a corpse"); the big slime ("Spits into 2 normal slimes which split into 2
//   small slimelits. Can spit slime balls. This is not an elite"); the poison slime ("adds poison to those it touches,
//   when it splits it leaves behind a poison aura for a bit. Ofc immune to poison"); goblin and orange goblin; bandits
//   in six weapons ("1 sword and torch, Great sword, Axe, Sword and shield, Spear, 2 daggers"); the poacher ("Net is an
//   ability on cooldown. Attack is a bow. Elite variant will leave snares"); bandit brute; thornback boar; sproutling
//   ("Attack is a short ranged dash. When rooted shoots a slow projectile/becomes a weak turret"); ent ("Roots entangle
//   status effect", statuses.js ENTANGLE); wisp ("Doesnt zap", heals beasts).
//   Mini-bosses: the Alpha (floor 1) and the Bandit Chief (floor 2: "Whistle summons 3 random lower bandits or a wolf.
//   Smoke bomb on self appears somewhere else seconds later"). Boss: the Elder Ent (floor 3; docs/BOSS-elder-ent.md).
// Each kind has a base kit (a habit or two) and an elite move (ELITES, elites.js). Variants are recolours of their base's
// art (recolor.js). Art round 8 (design/class-round8): every kind here has its own art in art/enemies/ (each bandit its
// own weapon and headgear, the wolves capsule-shaped like the werewolf); headR is the head's radius in the art's units,
// set so the body fills the collider (body half-width x vr / r).
import { alive, opponents, allies, hurt, puff, sparks, flames, addStatus, setAnim, fx, addBuff, explode, spawn, heal, kill, addDanger } from './sim.js';
import { TAU, clamp, dist, angleTo, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { ELITES, lob, cone, line, around, rush, rushTick, summon, shoot, blink, openSpot, hold, beginHold, due, again, targetOf, gapTo, crowd, stand, turnTo, later } from './elites.js';
import { courtFalls, bruteBrain } from './enemies.js';
import { variantUrl } from './recolor.js';
import { dash } from './dashes.js'; // round 18 (lane dash18): the six dashes

const ART = (f) => `art/enemies/${f}.svg`;
const FOE = { team: 'enemy', turn: 4, accel: 220, face: 4, mass: 1.2, temp: 0.35, commit: 0.9 };
const BEAST = { ...FOE, beast: true }; // wisps mend beasts
const HUMAN = { ...FOE, headR: 54 };   // the round-5 hero-scale art
const sees = (w, u, t, max) => t && dist(u.x, u.y, t.x, t.y) < max && lineClear(w, u.x, u.y, t.x, t.y, 4);
const lead = (t, k) => ({ x: t.x + (t.vx || 0) * k, y: t.y + (t.vy || 0) * k });
const rootPuff = (w, x, y, n = 6) => puff(w, x, y, '#6E8F3A', n, 90, 5, 0.45);
const pillarAt = (w, x, y, r) => w.pillars.some((p) => dist(x, y, p.x, p.y) < p.r + r);

// ---------------------------------------------------------------- shared habits
// Wolves: a howl that turns the pack onto one hero (round 8 roster: "Its howl turns the whole pack onto one hero"), and
// a lunge: a short straight bite-rush after circling (the skirmisher's in-and-out does the circling).
export function howl(w, u, t, o = {}) {
  const pack = allies(w, u).filter((a) => a.def.wolf && dist(a.x, a.y, u.x, u.y) < (o.r || 460));
  for (const a of [u, ...pack]) { a.focus = t; a.focusT = o.focusT || 4.5; if (o.buff) addBuff(a, { id: 'howl', dur: o.buff, move: 1.3, atkSpeed: 1.25 }); }
  fx(w, { type: 'ring', x: u.x, y: u.y, r: o.r || 460, color: o.color || '#C9C2B4', max: 0.6 });
  setAnim(u, 'cast', 0.5);
  return pack.length;
}
export function wolfBrain(w, u, dt) {
  if (rushTick(w, u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  if (due(u, 'howl', dt, 3) && allies(w, u).filter((a) => a.def.wolf && dist(a.x, a.y, u.x, u.y) < 460).length >= 2) { again(u, 'howl', 11, 14); howl(w, u, t, { buff: u.elite ? 4 : 0 }); }
  if (!due(u, 'lunge', dt, 2)) return false;
  const g = gapTo(u, t); if (g < 50 || g > 230 || !lineClear(w, u.x, u.y, t.x, t.y, u.r * 0.8)) return false;
  again(u, 'lunge', 4, 6);
  rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 40, { style: 'pounce', tell: 0.35, dmg: u.def.dmg * 1.3, knock: 170, trail: 'rgba(200,194,180,0.6)' }); // (round 18, lane dash18: the wolf's lunge is a pounce: a crouch, a leap that hangs, a landing rake; it was a straight run through)
  return true;
}
// A pounce from far off that pins whoever it lands on (dire wolves, the Alpha).
function pinPounce(w, u, dt, o) {
  if (u.act) return false;
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'pin', dt, o.first || 2)) return false;
  const d = dist(u.x, u.y, t.x, t.y); if (d < o.min || d > o.max || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return false;
  again(u, 'pin', ...o.every);
  const p = lead(t, 0.35), a = angleTo(u.x, u.y, p.x, p.y), L = Math.max(0, dist(u.x, u.y, p.x, p.y) - u.r - t.r * 0.5);
  const x1 = u.x + Math.cos(a) * L, y1 = u.y + Math.sin(a) * L;
  // round 18 (lane dash18): the pounce of dashes.js (a crouch, a leap that hangs, a landing rake); whoever the rake
  // catches is pinned, as before. (It was a plain arc and a circle that struck.)
  dash(w, u, 'pounce', { x: x1, y: y1, tell: 0.3, air: (o.dur || 0.6) * 0.75, r: o.r, dmg: o.dmg * u.dmgMul, hit: { knock: 60, stagger: o.stagger || 0 }, dustCol: '#8C8270', rest: 0.3,
    land: (list) => { for (const h of list) { h.rootT = Math.max(h.rootT || 0, o.pin); if (o.maul) addBuff(u, { id: 'maul', dur: o.pin, atkSpeed: 2.2 }); } } });
  return false;
}
// Slime balls: lobbed globs that land with a splat (o.spawn: a slime climbs out of it).
function slimeBall(w, u, t, o = {}) {
  const p = lead(t, 0.5);
  lob(w, u, p.x, p.y, { r: o.r || 44, tell: o.tell || 0.9, proj: 'water', color: o.color || '#6FA6E6', spawns: !!o.spawn, kind: o.kind || 'water', dust: o.color || '#6FA6E6',
    hit: { dmg: o.dmg || 6, knock: 140, ...(o.status || {}) },
    land: (w2, z) => { if (o.cloud) w2.hazards.push({ type: 'gas', x: z.x, y: z.y, r: 40, t: 3, max: 3 });
      if (o.spawn && crowd(w2, 'enemy') < 24) { const s = spawn(w2, o.spawn, z.x, z.y, { mult: w2.mult, gen: 1 }); s.aggro = true; s.minion = true; s.calledBy = u; } } });
}
// Help called in from further off (a howl, a whistle): it runs in from open floor a way away, already angry, and
// scatters when its caller falls (courtFalls). Capped so a room can't flood.
export function edgeCall(w, u, kinds, n, cap = 18) {
  if (w.stale) return 0;
  let got = 0;
  for (let i = 0; i < n; i++) {
    if (crowd(w, u.team) >= cap) break;
    const k = kinds[Math.floor(rand() * kinds.length)];
    const p = openSpot(w, u.x, u.y, 320, 620, 30) || openSpot(w, u.x, u.y, 150, 320, 30); if (!p) continue;
    later(w, p.x, p.y, 0.5, () => { const a = spawn(w, k, p.x, p.y, { mult: w.mult }); a.aggro = true; a.court = true; a.minion = true; a.calledBy = u; puff(w, p.x, p.y, '#BFA98A', 10, 80, 6, 0.5); });
    got++;
  }
  return got;
}
function every(w, u, dt, key, a, b, range, fn) {
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, key, dt, a)) return;
  if (!sees(w, u, t, range)) return;
  again(u, key, a, b); fn(t);
}
// A thrown axe or knife (a spinning dagger shot).
function hurl(w, u, a, o = {}) {
  shoot(w, u, a, { kind: 'dagger', speed: o.speed || 400, dmg: o.dmg || 8, r: o.r || 9, life: o.life || 1.2, hitO: { knock: o.knock || 140, ...(o.status || {}) } });
}
// A net: a slow shot that holds whoever it catches.
function net(w, u, t, o = {}) {
  const a = angleTo(u.x, u.y, t.x + (t.vx || 0) * 0.4, t.y + (t.vy || 0) * 0.4);
  setAnim(u, 'throw', 0.35);
  shoot(w, u, a, { kind: 'vial', color: '#C9B58A', speed: 320, dmg: 3, r: 12, life: 1.3, hitO: { knock: 20 },
    onHit: (w2, p, h) => { h.rootT = Math.max(h.rootT || 0, o.pin || 1.6); puff(w2, h.x, h.y, '#C9B58A', 8, 60, 5, 0.5); } });
}
// A poacher's snare left on the floor (visible: it's laid, not hidden; dungeon.js springs it like the Warren's).
function snareAt(w, u, x, y) {
  const mine = w.hazards.filter((h) => h.type === 'snare' && h.by === u && !h.sprung).length;
  if (mine >= 3 || w.hazards.some((h) => dist(h.x, h.y, x, y) < 40)) return;
  if (w.walls.some((r) => x > r.x - 20 && x < r.x + r.w + 20 && y > r.y - 20 && y < r.y + r.h + 20)) return;
  w.hazards.push({ type: 'snare', x, y, r: 16, hidden: false, by: u });
  puff(w, x, y, '#B58B5A', 6, 50, 4, 0.4);
}
// A slam in front: a circle a little ahead fills, then a blow that sends heroes flying (the bandit brute).
function frontSlam(w, u, t, o) {
  const a = angleTo(u.x, u.y, t.x, t.y), x = u.x + Math.cos(a) * (u.r + o.ahead), y = u.y + Math.sin(a) * (u.r + o.ahead);
  addDanger(w, { shape: 'circle', x, y, r: o.r, t: o.tell, team: u.team, src: u, kind: 'bone', hit: { dmg: o.dmg * u.dmgMul, knock: o.knock, heavy: true, stagger: o.stagger || 0 },
    onFire: (w2, z) => { w2.shake = Math.max(w2.shake, 6); puff(w2, z.x, z.y, '#CDBFA6', 16, 200, 7, 0.5); } });
  beginHold(u, o.tell + 0.3, a); setAnim(u, 'ability', o.tell + 0.3);
}
// A line of roots bursting up out of the floor (ents): entangles.
function rootLine(w, u, a, len, o = {}) {
  line(w, u, a, len, { tell: o.tell || 0.9, hw: o.hw || 30, kind: 'root', anim: 'ability', hit: { dmg: o.dmg || 10, entangle: o.entangle || 55, knock: 60, ...(o.extra || {}) },
    fire: (w2, z) => { for (let k = 0.1; k < 1; k += 0.12) rootPuff(w2, z.x1 + (z.x2 - z.x1) * k, z.y1 + (z.y2 - z.y1) * k, 3); } });
}

// ---------------------------------------------------------------- brains
// Slimes: the big slime spits slime balls; the poison slime's touch poisons (its def) and its split leaves a cloud.
function bigSlimeBrain(w, u, dt) { if (hold(u, dt)) return true; every(w, u, dt, 'spit', 3.5, 5, 400, (t) => slimeBall(w, u, t, { dmg: 7 })); return false; }
// Orange goblin: "1.5x as fast, weaves in and out of a fight and never stands still": straight after each blow it
// darts back out at a slant, then comes in again.
function weaveBrain(w, u, dt) {
  const t = targetOf(w, u); if (!t || !u.aggro || u.act) return false;
  if (w.time - u.lastAttackT < 0.2 && !u.wv) {
    u.wv = true; const a = angleTo(t.x, t.y, u.x, u.y) + (chance(0.5) ? 1 : -1) * rrange(0.5, 1.1);
    u.act = { type: 'dash', t: 0.3, max: 0.3, a };
    if (u.elite) hurl(w, u, angleTo(u.x, u.y, t.x, t.y), { dmg: 5, speed: 460, life: 0.8 }); // the elite flicks a knife as it goes
    return true;
  }
  if (w.time - u.lastAttackT > 0.6) u.wv = false;
  return false;
}
// Bandit (sword and shield): a shield bash when it's up close.
function shieldBash(w, u, dt) {
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !due(u, 'bash', dt, 3) || gapTo(u, t) > 34) return false;
  again(u, 'bash', 5.5, 7.5);
  cone(w, u, angleTo(u.x, u.y, t.x, t.y), { r: u.r + 58, arc: 1.2, tell: 0.35, kind: 'blade', anim: 'ability', hit: { dmg: 7, knock: 300, stagger: 30 } });
  return true;
}
// Bandit with a torch: sweeps it in a cone that sets you alight.
function torchSweep(w, u, dt) {
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !due(u, 'torch', dt, 3) || gapTo(u, t) > 90) return false;
  again(u, 'torch', 6, 8);
  cone(w, u, angleTo(u.x, u.y, t.x, t.y), { r: u.r + 100, arc: 1.3, tell: 0.55, kind: 'fire', anim: 'ability', hit: { dmg: 6, burn: 34, knock: 90 },
    fire: (w2, z) => { for (let i = 0; i < 8; i++) { const b = z.a + rrange(-z.arc / 2, z.arc / 2), d = rrange(30, z.r); flames(w2, z.x + Math.cos(b) * d, z.y + Math.sin(b) * d, 1, 10, 60); } } });
  return true;
}
// Greatsword: a whirling sweep all round.
function greatSweep(w, u, dt) {
  if (hold(u, dt)) return true;
  if (!u.aggro || !due(u, 'sweep', dt, 3) || !opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < u.r + h.r + 100)) return false;
  again(u, 'sweep', 7, 9);
  around(w, u, { r: u.r + 110, tell: 0.8, kind: 'blade', hit: { dmg: 14, knock: 320, heavy: true, stagger: 25 }, fire: (w2, z) => { for (let i = 0; i < 6; i++) sparks(w2, z.x + Math.cos(i) * z.r * 0.7, z.y + Math.sin(i) * z.r * 0.7, i + 1.6, 2, '#FFFFFF'); } });
  return true;
}
// Axe: throws it at whoever is a little way off.
function axeThrow(w, u, dt) {
  every(w, u, dt, 'axe', 5, 7, 380, (t) => { if (dist(u.x, u.y, t.x, t.y) < 140) { again(u, 'axe', 1); return; } setAnim(u, 'throw', 0.35);
    const a = angleTo(u.x, u.y, t.x + (t.vx || 0) * 0.4, t.y + (t.vy || 0) * 0.4); hurl(w, u, a, { dmg: 10, status: { stagger: 25 } }); if (u.elite) hurl(w, u, a + 0.18, { dmg: 10, status: { stagger: 25 } }); });
  return false;
}
// Spear: a lunge, the spear first.
function spearLunge(w, u, dt) {
  if (rushTick(w, u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'lunge', dt, 2.5)) return false;
  const g = gapTo(u, t); if (g < 40 || g > 190 || !lineClear(w, u.x, u.y, t.x, t.y, u.r * 0.8)) return false;
  again(u, 'lunge', 5, 7);
  rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 50, { style: 'lance', tell: 0.45, dmg: 12, knock: 220 }); // (round 18: the spear lunge is the draw cut with a spear)
  return true;
}
// Poacher: a bow (its attack) and a net on a cooldown.
function poacherBrain(w, u, dt) { every(w, u, dt, 'net', 3, 8, 330, (t) => net(w, u, t)); return false; }
// Bandit brute: a slow wind-up slam that sends heroes flying.
function bruteSlam(w, u, dt) {
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !due(u, 'slam', dt, 3) || gapTo(u, t) > 70) return false;
  again(u, 'slam', 6, 8);
  frontSlam(w, u, t, { ahead: 40, r: 82, tell: 1.0, dmg: 20, knock: 460, stagger: 40 });
  return true;
}
// Thornback boar: charges in a straight line; running into a wall or a rock dazes it.
function boarBrain(w, u, dt) {
  const c = u.chg;
  if (c) {
    if (c.tell > 0) { c.tell -= dt; stand(u, dt); turnTo(u, c.a, 9, dt); if (rand() < dt * 8) puff(w, u.x - Math.cos(c.a) * u.r, u.y - Math.sin(c.a) * u.r, '#A08A6A', 1, 40, 4, 0.3); return true; }
    u.dvx = Math.cos(c.a) * c.sp; u.dvy = Math.sin(c.a) * c.sp; u.vx = u.dvx; u.vy = u.dvy; u.mvA = c.a; u.spd = c.sp; u.facing = c.a;
    if (rand() < 0.6) w.particles.push({ x: u.x - Math.cos(c.a) * u.r, y: u.y - Math.sin(c.a) * u.r, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 7, color: 'rgba(190,170,140,0.7)' });
    for (const o of opponents(w, u)) {
      if (c.hit.has(o) || dist(u.x, u.y, o.x, o.y) > u.r + o.r + 6) continue;
      c.hit.add(o);
      const side = Math.sign(Math.sin(angleTo(u.x, u.y, o.x, o.y) - c.a)) || 1;
      hurt(w, o, u.def.dmg * 1.5 * u.dmgMul, u, { knock: 320, kAngle: c.a + side * 0.9, heavy: true, stagger: 35 });
    }
    const nx = u.x + Math.cos(c.a) * (u.r + 12), ny = u.y + Math.sin(c.a) * (u.r + 12);
    const wall = nx < 4 || ny < 4 || nx > w.W - 4 || ny > w.H - 4 || !lineClear(w, u.x, u.y, nx, ny, 2) || pillarAt(w, nx, ny, 4);
    if (wall) { // head first into it: dazed
      u.chg = null; u.spd = 0; u.stunT = Math.max(u.stunT, 1.8); u.koT = Math.max(u.koT || 0, 1.8);
      w.shake = Math.max(w.shake, 5); puff(w, nx, ny, '#CDBFA6', 14, 160, 6, 0.5); sparks(w, nx, ny, c.a + Math.PI, 5, '#FFF4C8');
      if (u.elite) for (let i = 0; i < 8; i++) shoot(w, u, i / 8 * TAU, { kind: 'thorn', speed: 320, dmg: 4, life: 0.8, hitO: { knock: 60 } }); // sheds its thorns
    } else if ((c.t -= dt) <= 0) { u.chg = null; u.spd *= 0.3; u.atkT = Math.max(u.atkT, 0.5); }
    return true;
  }
  const t = targetOf(w, u); if (!t || !u.aggro || u.act || !due(u, 'charge', dt, 2)) return false;
  const g = gapTo(u, t); if (g < 90 || g > 400 || !lineClear(w, u.x, u.y, t.x, t.y, u.r * 0.8)) return false;
  again(u, 'charge', 4.5, 6.5);
  const a = angleTo(u.x, u.y, t.x, t.y), len = g + 220, sp = u.def.speed * 2.7;
  u.chg = { a, tell: 0.6, t: len / sp, sp, hit: new Set() };
  addDanger(w, { shape: 'line', x1: u.x, y1: u.y, x2: u.x + Math.cos(a) * len, y2: u.y + Math.sin(a) * len, hw: u.r + 6, t: 0.6, team: u.team, src: u, kind: 'blade' });
  setAnim(u, 'ability', 0.6 + len / sp);
  return true;
}
// Sproutling: its attack is a short dash; left alone a while with nobody close, it roots itself and turns into a weak
// turret, spitting slow seeds and mending; anyone coming close makes it pull up its roots.
function sproutBrain(w, u, dt) {
  const s = u.sp || (u.sp = { calm: 0, rooted: false, shotT: 1, rootCd: rrange(1, 3) });
  if (u.hp < (s.lastHp ?? u.hp)) s.calm = 0; else s.calm += dt;
  s.lastHp = u.hp;
  const t = targetOf(w, u);
  if (s.rooted) {
    stand(u, dt); u.spd = 0; u.dvx = u.dvy = 0;
    if (t) turnTo(u, angleTo(u.x, u.y, t.x, t.y), 4, dt);
    if (u.hp < u.maxHp && !w.stale) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.03 * dt);
    if (opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 120 + h.r) || w.stale) { s.rooted = false; s.rootCd = rrange(4, 6); rootPuff(w, u.x, u.y, 8); return true; }
    if (t && (s.shotT -= dt) <= 0 && sees(w, u, t, 380)) {
      s.shotT = rrange(1.7, 2.3); setAnim(u, 'cast', 0.3);
      const a = angleTo(u.x, u.y, t.x, t.y);
      for (const da of u.elite ? [-0.2, 0, 0.2] : [0]) shoot(w, u, a + da, { kind: 'thorn', speed: 170, dmg: 4, life: 2.4, hitO: { knock: 40, entangle: u.elite ? 14 : 6 } });
    }
    return true;
  }
  if (rushTick(w, u, dt)) return true;
  if (!t || !u.aggro) return false;
  s.rootCd -= dt;
  if (s.rootCd <= 0 && s.calm > 2.5 && gapTo(u, t) > 200 && !w.stale) { s.rooted = true; rootPuff(w, u.x, u.y, 10); setAnim(u, 'ability', 0.4); return true; }
  if (!due(u, 'dash', dt, 1.2)) return false;
  const g = gapTo(u, t); if (g < 20 || g > 150 || !lineClear(w, u.x, u.y, t.x, t.y, u.r * 0.8)) return false;
  again(u, 'dash', 1.8, 2.6);
  rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 26, { style: 'pounce', r: u.r + 16, tell: 0.22, dmg: u.def.dmg, knock: 120, trail: 'rgba(140,190,90,0.6)' }); // (round 18: the sproutling's dash is a little pounce)
  return true;
}
// Ent: slams roots up in a line (Entangle); a hard blow knocks a sproutling loose from it.
function entBrain(w, u, dt) {
  if (hold(u, dt)) return true;
  const lost = (u.lastHp ?? u.hp) - u.hp; u.lastHp = u.hp;
  u.sproutCd = (u.sproutCd || 0) - dt;
  if (lost > u.maxHp * 0.08 && u.sproutCd <= 0 && !w.stale) { u.sproutCd = 3.5; summon(w, u, 'sproutling', 1, { color: '#5E7F32', own: 3 }); rootPuff(w, u.x, u.y, 10); }
  const t = targetOf(w, u); if (!t || !u.aggro || !due(u, 'roots', dt, 2.5)) return false;
  const d = dist(u.x, u.y, t.x, t.y); if (d < 90 || d > 470 || !lineClear(w, u.x, u.y, t.x, t.y, 4)) return false;
  again(u, 'roots', 5, 7);
  rootLine(w, u, angleTo(u.x, u.y, t.x, t.y), Math.min(470, d + 90));
  return true;
}
// Wisp: floats about, mends beasts near it (round 9: "Doesnt zap"), and blinks off when a hero comes close.
function wispBrain(w, u, dt) {
  if (due(u, 'mend', dt, 1.2)) {
    const b = allies(w, u).filter((a) => a.def.beast && a.hp < a.maxHp * 0.95 && dist(a.x, a.y, u.x, u.y) < 340).sort((a, b2) => a.hp / a.maxHp - b2.hp / b2.maxHp)[0];
    if (b && !w.stale) {
      again(u, 'mend', 2.6, 3.4); setAnim(u, 'cast', 0.4);
      heal(w, b, b.maxHp * 0.14, u);
      fx(w, { type: 'beam', x1: u.x, y1: u.y, x2: b.x, y2: b.y, kind: 'heal', max: 0.5, from: u, to: b });
      if (u.elite) addBuff(b, { id: 'bark', dur: 3, taken: 0.7 }); // the elite's light hardens the beast's hide a while
    } else again(u, 'mend', 0.6);
  }
  if (due(u, 'blink', dt, 1.5)) {
    const near = opponents(w, u).find((h) => dist(u.x, u.y, h.x, h.y) < 130 + h.r);
    const p = near && openSpot(w, u.x, u.y, 180, 290, u.r);
    if (p) { again(u, 'blink', 3, 4.2); blink(w, u, p.x, p.y, 'rgba(226,255,170,0.85)'); } else again(u, 'blink', 0.4);
  }
  if (rand() < dt * 5) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.6, y: u.y + rrange(-u.r, u.r) * 0.6, vx: 0, vy: 0, rise: 30, up: 0, life: 0.6, max: 0.6, size: 3, color: '#E6FFAA' });
  return false;
}

// ---------------------------------------------------------------- the kinds
const WOLF = { ...BEAST, wolf: true, art: ART('wolf'), headR: 35, r: 24, vr: 18, turn: 7, accel: 420, face: 7, mass: 0.9, hp: 26, speed: 84, role: 'skirmish',
  range: 14, atkCd: 1.0, dmg: 5, arc: 1.4, temp: 0.6, commit: 0.5, xp: 7, coins: [1, 3], attackAnim: 'thrust', brain: wolfBrain };
const BANDIT = { ...HUMAN, art: ART('bandit'), r: 30, vr: 22, turn: 4, accel: 240, face: 4, mass: 1.3, hp: 52, speed: 56, role: 'melee', range: 22,
  atkCd: 1.3, windup: 0.3, dmg: 9, knock: 130, arc: 1.6, xp: 11, coins: [2, 6], attackAnim: 'swing' };
export const WILDWOOD = {
  wolf: { ...WOLF, name: 'Wolf' },
  direWolf: { variantOf: 'wolf', name: 'Dire Wolf', art: ART('dire-wolf'), size: 1.25, hp: 62, dmg: 9, speed: 80, xp: 14, coins: [2, 5],
    brain: (w, u, dt) => pinPounce(w, u, dt, { min: 150, max: 360, every: [4.5, 6], r: 50, dmg: 11, pin: u.elite ? 1.6 : 1, maul: u.elite }) || wolfBrain(w, u, dt) },
  slimeBig: { variantOf: 'slime', name: 'Big Slime', size: 1.6, light: -0.1, sat: 1.1, hp: 112, speed: 34, dmg: 11, knock: 150, xp: 16, coins: [3, 6],
    splitsInto: 'slime', hops: 1.5, brain: bigSlimeBrain },
  slimePoison: { variantOf: 'slime', name: 'Poison Slime', hue: -125, sat: 1.15, light: 0.02, hp: 50, poison: 18, xp: 10, goo: '#A6E04A',
    res: { poison: 0 }, splitsInto: 'slimeletPoison',
    onSplit: (w, u) => w.hazards.push({ type: 'gas', x: u.x, y: u.y, r: 58, t: 4, max: 4 }) },
  slimeletPoison: { variantOf: 'slimeSmall', name: 'Poison Slimelet', hue: -125, sat: 1.15, light: 0.02, poison: 10, goo: '#A6E04A', res: { poison: 0 } },
  goblinOrange: { variantOf: 'goblin', name: 'Orange Goblin', hue: -72, sat: 1.15, light: 0.03, speed: 129, temp: 0.9, commit: 0.25, xp: 7, brain: weaveBrain },
  // bandits: sword and shield, and five more weapons (the designer's list); the same placeholder art, recoloured
  bandit: { ...BANDIT, name: 'Bandit', shield: 0.5, brain: shieldBash },
  banditTorch: { variantOf: 'bandit', name: 'Torch Bandit', art: ART('bandit-torch'), shield: 0, burn: 10, brain: torchSweep },
  banditGreat: { variantOf: 'bandit', name: 'Greatsword Bandit', art: ART('bandit-greatsword'), shield: 0, hp: 70, speed: 48, dmg: 16, windup: 0.6,
    range: 34, arc: 2.6, knock: 230, heavy: true, atkCd: 2.0, xp: 15, brain: greatSweep },
  banditAxe: { variantOf: 'bandit', name: 'Axe Bandit', art: ART('bandit-axe'), shield: 0, dmg: 12, stagger: 20, windup: 0.45, heavy: true, xp: 13, brain: axeThrow },
  banditSpear: { variantOf: 'bandit', name: 'Spear Bandit', art: ART('bandit-spear'), shield: 0, range: 46, arc: 0.8, attackAnim: 'thrust',
    dmg: 10, xp: 12, brain: spearLunge },
  banditDagger: { variantOf: 'bandit', name: 'Knife Bandit', art: ART('bandit-daggers'), shield: 0, role: 'skirmish', hp: 40, speed: 80, dmg: 5, atkCd: 0.55, windup: 0,
    range: 14, poison: 8, temp: 0.6, commit: 0.4, attackAnim: 'thrust', ability: 'dash', abilCd: 3.2, brain: null },
  poacher: { ...HUMAN, name: 'Poacher', art: ART('poacher'), r: 30, vr: 22, hp: 44, speed: 54, role: 'ranged', range: 260, keep: 190, atkCd: 1.6, dmg: 7,
    attackAnim: 'draw', xp: 13, coins: [2, 6], brain: poacherBrain },
  banditBrute: { ...HUMAN, name: 'Bandit Brute', art: ART('bandit-brute'), headR: 64, r: 40, vr: 30, mass: 2.8, turn: 2.8, face: 2.8, hp: 150, speed: 42, role: 'melee',
    range: 28, atkCd: 1.9, windup: 0.6, dmg: 15, knock: 260, arc: 1.9, heavy: true, temp: 0.25, commit: 1.2, xp: 28, coins: [5, 10], attackAnim: 'swing', brain: bruteSlam },
  boar: { ...BEAST, name: 'Thornback Boar', art: ART('boar'), headR: 41, r: 32, vr: 25, turn: 3.6, accel: 260, face: 3.6, mass: 2.2, hp: 88, speed: 60, role: 'melee',
    range: 18, atkCd: 1.4, windup: 0.25, dmg: 10, knock: 180, arc: 1.4, temp: 0.3, commit: 1, xp: 18, coins: [3, 7], attackAnim: 'thrust', brain: boarBrain },
  sproutling: { ...FOE, name: 'Sproutling', art: ART('sproutling'), headR: 34, r: 20, vr: 15, turn: 6, accel: 380, face: 6,
    mass: 0.6, hp: 20, speed: 68, role: 'melee', range: 60, atkCd: 999, dmg: 5, xp: 4, coins: [0, 2], res: { burn: 1.6 }, brain: sproutBrain },
  ent: { ...FOE, name: 'Ent', art: ART('ent'), headR: 59, r: 46, vr: 34, turn: 2, accel: 110, face: 2,
    mass: 4, hp: 220, speed: 30, role: 'melee', range: 32, atkCd: 2.0, windup: 0.7, dmg: 15, knock: 240, arc: 2.2, heavy: true, temp: 0.2, commit: 1.4, xp: 36, coins: [6, 12],
    attackAnim: 'swing', res: { burn: 1.8, entangle: 0 }, brain: entBrain },
  wisp: { ...FOE, name: 'Wisp', art: ART('wisp'), headR: 34, r: 20, vr: 16, turn: 6, accel: 300, face: 6,
    mass: 0.4, hp: 26, speed: 62, role: 'ranged', range: 240, keep: 210, atkCd: 999, dmg: 0, temp: 0.5, commit: 0.6, xp: 9, coins: [1, 4], noCorpse: true, goo: '#E6FFAA',
    res: { poison: 0, curse: 0 }, brain: wispBrain },

  // ---- the mini-bosses
  alpha: { ...BEAST, wolf: true, name: 'The Alpha', art: ART('alpha'), headR: 40, r: 46, vr: 34, turn: 4, accel: 300, face: 4, mass: 4,
    hp: 430, speed: 64, role: 'melee', range: 24, atkCd: 1.2, windup: 0.3, dmg: 13, knock: 200, arc: 1.8, temp: 0.25, commit: 1.2, xp: 80, coins: [30, 45], boss: true,
    attackAnim: 'thrust', onDeath: courtFalls, brain: alphaBrain },
  banditChief: { ...HUMAN, name: 'The Bandit Chief', art: ART('bandit-chief'), r: 44, vr: 32, turn: 4, accel: 260, face: 4, mass: 3.5, hp: 400, speed: 58, role: 'melee',
    range: 24, atkCd: 1.1, windup: 0.25, dmg: 12, knock: 160, arc: 1.6, temp: 0.3, commit: 1, xp: 80, coins: [35, 50], boss: true, attackAnim: 'swing', onDeath: courtFalls,
    brain: chiefBrain },
};

// ---------------------------------------------------------------- the Alpha (floor 1)
// A giant wolf. It calls the pack in waves, its howl makes every wolf faster (and turns them all on one hero), it pounces
// from far off and pins, and up close it rends in a wide bite.
function alphaBrain(w, u, dt) {
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  const hurtK = u.hp < u.maxHp * 0.5 ? 0.75 : 1;
  if (due(u, 'pack', dt, 4)) { again(u, 'pack', 14 * hurtK, 17 * hurtK); edgeCall(w, u, ['wolf'], u.hp < u.maxHp * 0.5 ? 3 : 2); puff(w, u.x, u.y, '#C9C2B4', 10, 90, 6, 0.4); }
  if (due(u, 'howl', dt, 2)) { again(u, 'howl', 9, 11); howl(w, u, t, { r: 900, buff: 5, focusT: 5, color: '#E8E2D0' }); w.shake = Math.max(w.shake, 3); return false; }
  if (pinPounce(w, u, dt, { first: 3, min: 160, max: 380, every: [5, 6.5], r: 62, dmg: 14, pin: 1, stagger: 30, dur: 0.7 })) return true;
  if (u.act) return false;
  if (due(u, 'rend', dt, 2.5) && gapTo(u, t) < 70) {
    again(u, 'rend', 4.5, 6);
    cone(w, u, angleTo(u.x, u.y, t.x, t.y), { r: u.r + 110, arc: 1.7, tell: 0.55, kind: 'blade', anim: 'ability', hit: { dmg: 16, knock: 260, stagger: 30 } });
    return true;
  }
  return false;
}
// The court of any floor's last foe scatters when it falls (callAdds marks them u.court).

// ---------------------------------------------------------------- the Bandit Chief (floor 2)
// "Whistle summons 3 random lower bandits or a wolf. Smoke bomb on self appears somewhere else seconds later"; and from
// the roster, a fan of thrown knives.
const LOWER = ['bandit', 'banditDagger', 'banditSpear', 'banditTorch', 'banditAxe'];
function chiefBrain(w, u, dt) {
  const c = u.ch || (u.ch = { smoke: 0, hpMark: u.hp });
  if (c.smoke > 0) { // gone in the smoke: nobody can touch it; it comes out somewhere else
    c.smoke -= dt; stand(u, dt); u.dvx = u.dvy = 0;
    if (c.smoke <= 0) {
      const p = openSpot(w, u.x, u.y, 260, 520, u.r) || openSpot(w, u.x, u.y, 120, 300, u.r);
      u.ethereal = false; u.hidden = false;
      if (p) { u.x = p.x; u.y = p.y; }
      smokeCloud(w, u.x, u.y, 70); u.atkT = 0; c.hpMark = u.hp;
      const t = targetOf(w, u) || opponents(w, u)[0]; if (t) u.facing = angleTo(u.x, u.y, t.x, t.y);
    }
    return true;
  }
  if (hold(u, dt)) return true;
  const t = targetOf(w, u); if (!t || !u.aggro) return false;
  // smoke bomb: on a clock, or when it's been hurt a fair bit since it last came out
  if (!w.stale && (due(u, 'smoke', dt, 8) || c.hpMark - u.hp > u.maxHp * 0.18)) {
    again(u, 'smoke', 10, 13); smokeCloud(w, u.x, u.y, 90);
    c.smoke = rrange(1.6, 2.4); u.ethereal = true; u.hidden = true; u.target = null;
    return true;
  }
  if (due(u, 'whistle', dt, 4)) {
    again(u, 'whistle', 12, 15); setAnim(u, 'cast', 0.5);
    fx(w, { type: 'ring', x: u.x, y: u.y, r: 160, color: '#F2E6C8', max: 0.45 });
    if (chance(0.3)) edgeCall(w, u, ['wolf'], 1); else edgeCall(w, u, LOWER, 3);
    return false;
  }
  if (due(u, 'knives', dt, 3)) {
    const d = dist(u.x, u.y, t.x, t.y);
    if (d > 110 && sees(w, u, t, 420)) {
      again(u, 'knives', 5, 7);
      const a = angleTo(u.x, u.y, t.x, t.y);
      beginHold(u, 0.4, a, () => { for (let i = -2; i <= 2; i++) hurl(w, u, a + i * 0.16, { dmg: 7, speed: 440, life: 1.1, knock: 90 }); });
      setAnim(u, 'throw', 0.4);
      return true;
    } else again(u, 'knives', 1);
  }
  return false;
}
function smokeCloud(w, x, y, r) {
  for (let i = 0; i < 26; i++) { const a = rand() * TAU, d = rand() * r; w.particles.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, rise: 10, up: 0, life: rrange(0.9, 1.6), max: 1.6, size: rrange(10, 18), color: 'rgba(120,116,124,0.55)', drag: 0.9 }); }
}

// ---------------------------------------------------------------- their elite moves
Object.assign(ELITES, {
  // Wolf: its howl also hastens the pack (wolfBrain reads u.elite).
  wolf: { tick() { return false; } },
  // Dire wolf: a pin long enough to maul (pinPounce: maul).
  direWolf: { tick() { return false; } },
  // Big slime: its spit carries a slime that climbs out where it lands.
  slimeBig: { tick(w, u, dt) { if (hold(u, dt)) return true; every(w, u, dt, 'brood', 5, 7, 420, (t) => slimeBall(w, u, t, { dmg: 6, spawn: 'slime', tell: 1.0 })); return false; } },
  // Poison slime: lobs a glob of poison that leaves a cloud.
  slimePoison: { tick(w, u, dt) { every(w, u, dt, 'glob', 4, 5.5, 400, (t) => slimeBall(w, u, t, { dmg: 5, color: '#A6E04A', kind: 'poison', status: { poison: 30 }, cloud: true })); return false; } },
  // Orange goblin: flicks a knife each time it darts out (weaveBrain reads u.elite).
  goblinOrange: { tick() { return false; } },
  // Bandit: the shield goes up and it walks in behind it (the Crypt brute's way).
  bandit: { tick: bruteBrain },
  // Torch bandit: throws its torch: a burning patch where it lands.
  banditTorch: { tick(w, u, dt) { every(w, u, dt, 'toss', 5, 7, 380, (t) => lob(w, u, t.x, t.y, { r: 52, tell: 0.9, proj: 'fireball', kind: 'fire', dust: '#5A4A40', hit: { dmg: 6, burn: 30 },
    land: (w2, z) => { if (!w2.hazards.some((h) => h.type === 'fire' && dist(h.x, h.y, z.x, z.y) < 50)) w2.hazards.push({ type: 'fire', x: z.x, y: z.y, r: 46, t: 4, max: 4 }); } })); return false; } },
  // Greatsword: a cleave that runs down a long line.
  banditGreat: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    const t = targetOf(w, u); if (!t || !due(u, 'cleave', dt, 3) || !sees(w, u, t, 320)) return false;
    again(u, 'cleave', 6, 8); line(w, u, angleTo(u.x, u.y, t.x, t.y), 320, { tell: 0.75, hw: 34, kind: 'blade', anim: 'ability', hit: { dmg: 16, knock: 300, heavy: true } }); return true;
  } },
  // Axe bandit: two axes at once (axeThrow reads u.elite).
  banditAxe: { tick() { return false; } },
  // Spear bandit: throws the spear down a long line.
  banditSpear: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    const t = targetOf(w, u); if (!t || !due(u, 'jav', dt, 3)) return false;
    const d = dist(u.x, u.y, t.x, t.y); if (d < 150 || !sees(w, u, t, 480)) return false;
    again(u, 'jav', 6, 8); line(w, u, angleTo(u.x, u.y, t.x, t.y), Math.min(500, d + 120), { tell: 0.7, hw: 22, proj: 'dagger', hit: { dmg: 15, knock: 280, heavy: true } }); return true;
  } },
  // Knife bandit: a puff of smoke, and it's behind you.
  banditDagger: { tick(w, u, dt) {
    const t = targetOf(w, u); if (!t || !due(u, 'behind', dt, 3) || dist(u.x, u.y, t.x, t.y) > 360) return false;
    again(u, 'behind', 6, 8); const b = t.facing + Math.PI;
    blink(w, u, t.x + Math.cos(b) * (t.r + u.r + 4), t.y + Math.sin(b) * (t.r + u.r + 4), 'rgba(120,116,124,0.8)');
    u.facing = angleTo(u.x, u.y, t.x, t.y); hurt(w, t, u.def.dmg * 2 * u.dmgMul, u, { knock: 120, poison: 20 }); setAnim(u, 'thrust', 0.3);
    return false;
  } },
  // Poacher: lays snares round about (round 9: "Elite variant will leave snares").
  poacher: { tick(w, u, dt) {
    if (!u.aggro || !due(u, 'snare', dt, 2)) return false;
    again(u, 'snare', 4, 6);
    const t = targetOf(w, u), a = t ? angleTo(u.x, u.y, t.x, t.y) + rrange(-0.8, 0.8) : rand() * TAU, d = rrange(60, 140);
    snareAt(w, u, clamp(u.x + Math.cos(a) * d, 40, w.W - 40), clamp(u.y + Math.sin(a) * d, 40, w.H - 40));
    return false;
  } },
  // Bandit brute: brings the club down so hard the ground jumps all round.
  banditBrute: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    if (!due(u, 'quake', dt, 3) || !opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 150 + h.r)) return false;
    again(u, 'quake', 7, 9);
    around(w, u, { r: 160, tell: 0.9, kind: 'bone', hit: { dmg: 12, knock: 300, heavy: true, stagger: 50 }, fire: (w2, z) => { w2.shake = Math.max(w2.shake, 6); puff(w2, z.x, z.y, '#CDBFA6', 18, 220, 7, 0.5); } });
    return true;
  } },
  // Boar: sheds its thorns all round when it crashes (boarBrain reads u.elite).
  boar: { tick() { return false; } },
  // Sproutling: rooted, it spits three seeds that tangle (sproutBrain reads u.elite).
  sproutling: { tick() { return false; } },
  // Ent: a ring of roots all round it when the party crowds it.
  ent: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    if (!due(u, 'ring', dt, 3) || !opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 160 + h.r)) return false;
    again(u, 'ring', 7, 9);
    around(w, u, { r: 170, tell: 1.0, kind: 'root', hit: { dmg: 8, entangle: 70, knock: 80 }, fire: (w2, z) => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; rootPuff(w2, z.x + Math.cos(a) * z.r * 0.7, z.y + Math.sin(a) * z.r * 0.7, 2); } } });
    return true;
  } },
  // Wisp: its light hardens the beast it mends (wispBrain reads u.elite).
  wisp: { tick() { return false; } },
});
