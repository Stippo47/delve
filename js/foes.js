// The three deeper dungeons (round 7: "Add 3 more harder dungeons. You can use the enemy sprites I said aren't good
// for now"): the Frost Hollow, the Ember Deep and the Gilded Spire, after the Crypt. Their kinds, each with a base
// kit (one habit, like the others) and an elite move (added to ELITES in elites.js), and each dungeon's warden and
// boss. The bosses are powered-up wardens for now (a fight of a few telegraphed moves and called help), not a
// designed fight like the Bone King.
// ART: everything here uses PLACEHOLDER art (art/enemies/placeholder/, from design/class-round4 and -round5 enemies
// the designer marked not good, plus a few picks still being fixed); swap the files when the art is redone.
import { alive, opponents, allies, hurt, puff, sparks, flames, addStatus, setAnim, fx, zone, addBuff, explode, spawn, heal, kill } from './sim.js';
import { TAU, clamp, dist, angleTo, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { ELITES, lob, cone, line, around, rush, rushTick, summon, shoot, blink, openSpot, pounce, hold, beginHold, due, again, targetOf, gapTo, crowd, makeElite, stand, later } from './elites.js';
import { slam, callAdds, courtFalls } from './enemies.js';

const ART = (f) => `art/enemies/placeholder/${f}.svg`;
const FOE = { team: 'enemy', turn: 4, accel: 220, face: 4, mass: 1.2, temp: 0.35, commit: 0.9 };

// ---------------------------------------------------------------- base habits
// Webs: a sticky patch on the floor that slows whoever walks through it (sim.js treats 'web' like oil).
function web(w, x, y, r = 46, t = 6) { w.hazards.push({ type: 'web', x, y, r, t, max: t }); }
// A momma spider's web cluster: lobbed at you; if it lands on you, you're stuck a moment; if it misses, a web stays.
function webShot(w, u, t, o = {}) {
  const p = { x: t.x + (t.vx || 0) * 0.4, y: t.y + (t.vy || 0) * 0.4 };
  lob(w, u, p.x, p.y, { r: o.r || 46, tell: o.tell || 0.8, proj: 'vial', color: '#E8E2F2', kind: 'web', dust: '#E8E2F2', hit: { dmg: o.dmg || 5 },
    land: (w2, z) => { let caught = false; for (const h of opponents(w2, u)) if (dist(h.x, h.y, z.x, z.y) < z.r + h.r * 0.5) { h.rootT = Math.max(h.rootT || 0, 1); caught = true; }
      if (!caught) web(w2, z.x, z.y, 50, 6); } });
}
// A shooter's lob/throw on its own clock (instead of the plain ranged attack): fn(target) when ready and in sight.
function every(w, u, dt, key, a, b, range, fn) {
  const t = targetOf(w, u); if (!t || !due(u, key, dt, a)) return;
  if (dist(u.x, u.y, t.x, t.y) > range || !lineClear(w, u.x, u.y, t.x, t.y, 4)) return;
  again(u, key, a, b); fn(t);
}
function snowball(w, u, a, o = {}) {
  shoot(w, u, a, { kind: 'bolt', color: '#F4FBFF', speed: o.speed || 260, dmg: o.dmg || 6, r: 9, life: 1.8, hitO: { chill: o.chill || 22, knock: 70 },
    onHit: (w2, p) => puff(w2, p.x, p.y, '#F4FBFF', 6, 70, 5, 0.35) });
}
function fireball(w, u, a, o = {}) {
  shoot(w, u, a, { kind: 'fireball', speed: o.speed || 240, dmg: o.dmg || 4, r: 8, life: 1.6, hitO: { knock: 40 },
    onHit: (w2, p) => explode(w2, p.x, p.y, o.r || 36, (o.blast || 4) * u.dmgMul, { burn: o.burn || 22 }, u, '#FF8A3D') });
}
function firePatch(w, x, y, r = 40, t = 4) { if (!w.hazards.some((h) => h.type === 'fire' && dist(h.x, h.y, x, y) < r)) w.hazards.push({ type: 'fire', x, y, r, t, max: t }); }
function smite(w, u, x, y, o = {}) { // a shaft of light from above: a circle fills, then it strikes
  lob(w, u, x, y, { r: o.r || 70, tell: o.tell || 0.9, kind: 'holy', dust: '#FFF1B0', hit: { dmg: o.dmg || 14, knock: 220, radiance: o.radiance ?? 30 },
    land: (w2, z) => fx(w2, { type: 'pillar', x: z.x, y: z.y, r: z.r * 0.8, kind: 'holy', max: 0.6 }) });
  setAnim(u, 'cast', 0.4);
}
// Bring back the freshest body lying close by (a corpse, sim.js) as one of its side again.
function raise(w, u, range, o = {}) {
  const c = (w.corpses || []).filter((c) => c.age > 0.6 && dist(c.x, c.y, u.x, u.y) < range && DEFS_OK(c.kind)).sort((a, b) => a.age - b.age)[0];
  if (!c || crowd(w, u.team) >= (o.cap || 20)) return false;
  w.corpses.splice(w.corpses.indexOf(c), 1);
  fx(w, { type: 'pillar', x: c.x, y: c.y, r: 30, kind: 'holy', max: 0.8 });
  later(w, c.x, c.y, 0.6, () => { const s = spawn(w, c.kind, c.x, c.y, { mult: w.mult, hpMul: 0.5 }); s.aggro = true; s.summonBy = u; puff(w, c.x, c.y, '#FFF1B0', 14, 120, 6, 0.5); });
  setAnim(u, 'cast', 0.6);
  return true;
}
let KINDS = null; // filled below: kinds that can be raised (enemies, not bosses or summons)
const DEFS_OK = (k) => KINDS && KINDS.has(k);
// Telegraphed volley: n snowballs/bolts in a ring round the unit.
function ringVolley(w, u, n, fn) { const a0 = rand() * TAU; for (let i = 0; i < n; i++) fn(a0 + i / n * TAU); }

// ---------------------------------------------------------------- the kinds
export const FOES = {
  // ---- the Frost Hollow: ice caves; bats in swarms, snowmen lobbing, spiders, the wailing dead, ogres
  bat: { ...FOE, name: 'Cave Bat', art: ART('bat'), headR: 44, r: 20, vr: 16, turn: 8, accel: 480, face: 8, mass: 0.5, hp: 22, speed: 82, role: 'skirmish',
    range: 12, atkCd: 0.8, dmg: 4, arc: 1.5, temp: 0.7, commit: 0.4, xp: 5, coins: [1, 2], cost: 2, pack: [2, 4], attackAnim: 'thrust', ability: 'dash', abilCd: 2.8,
    brain: (w, u) => { if (!u.vamp) { u.vamp = true; addBuff(u, { id: 'vamp', dur: 1e9, lifesteal: 0.5 }); } return false; } }, // its bite drinks
  snowman: { ...FOE, name: 'Snowman', art: ART('snowman'), headR: 60, r: 32, vr: 25, turn: 3, accel: 150, face: 3, mass: 1.6, hp: 56, speed: 34, role: 'ranged',
    range: 290, keep: 190, atkCd: 999, dmg: 6, xp: 12, coins: [2, 5], cost: 4, res: { chill: 0.1, burn: 1.6 },
    brain: (w, u, dt) => { every(w, u, dt, 'snow', 2.2, 3, 300, (t) => { setAnim(u, 'throw', 0.35); snowball(w, u, angleTo(u.x, u.y, t.x + (t.vx || 0) * 0.5, t.y + (t.vy || 0) * 0.5)); }); return false; } },
  spiderHunter: { ...FOE, name: 'Hunter Spider', art: ART('spider-hunter'), headR: 52, r: 26, vr: 20, turn: 7, accel: 420, face: 7, mass: 0.9, hp: 40, speed: 72, role: 'skirmish',
    range: 14, atkCd: 0.9, dmg: 6, poison: 22, arc: 1.4, temp: 0.55, commit: 0.5, xp: 9, coins: [2, 4], cost: 3, attackAnim: 'thrust', ability: 'dash', abilCd: 3.4,
    onDeath: (w, u) => web(w, u.x, u.y, 44, 5) }, // its bite poisons; it dies into a web
  spiderMomma: { ...FOE, name: 'Momma Spider', art: ART('spider-momma'), headR: 58, r: 34, vr: 26, turn: 3.4, accel: 200, face: 3.4, mass: 1.8, hp: 90, speed: 46, role: 'ranged',
    range: 250, keep: 170, atkCd: 999, dmg: 6, xp: 18, coins: [3, 7], cost: 6, onDeath: (w, u) => web(w, u.x, u.y, 60, 7),
    brain: (w, u, dt) => { every(w, u, dt, 'web', 3.5, 5, 300, (t) => webShot(w, u, t)); return false; } },
  banshee: { ...FOE, name: 'Banshee', art: ART('banshee'), headR: 56, r: 28, vr: 22, mass: 0.7, hp: 60, speed: 58, role: 'ranged', range: 200, keep: 140, atkCd: 999, dmg: 7,
    xp: 15, coins: [3, 6], cost: 5, undead: true, res: { poison: 0, burn: 1.3, chill: 0.2, curse: 0 },
    brain: (w, u, dt) => {
      if (hold(u, dt)) return true;
      const t = targetOf(w, u); if (!t || !due(u, 'wail', dt, 2.5) || dist(u.x, u.y, t.x, t.y) > 240) return false;
      again(u, 'wail', 4, 5.5);
      cone(w, u, angleTo(u.x, u.y, t.x, t.y), { r: 250, arc: 1.1, tell: 0.6, kind: 'soul', hit: { dmg: 7, curse: 32, stagger: 35, knock: 120 } }); // round 8: the wail curses
      return true;
    } },
  ogre: { ...FOE, name: 'Ogre', art: ART('ogre'), headR: 66, r: 42, vr: 31, turn: 2.6, accel: 150, face: 2.6, mass: 3, hp: 160, speed: 42, role: 'melee',
    range: 26, atkCd: 1.9, windup: 0.55, dmg: 18, knock: 260, arc: 2.0, heavy: true, temp: 0.25, commit: 1.2, xp: 28, coins: [6, 11], cost: 8, attackAnim: 'swing',
    brain: (w, u, dt) => slam(w, u, dt, { r: 120, tell: 0.9, dmg: 14, cdMin: 7, cdMax: 9 }) },

  // ---- the Ember Deep: fiends; imps in swarms flinging fire, fire slimes, devils, demons, dragonborn
  imp: { ...FOE, name: 'Imp', art: ART('imp'), headR: 44, r: 20, vr: 16, turn: 7, accel: 420, face: 7, mass: 0.6, hp: 26, speed: 70, role: 'ranged', range: 240, keep: 170,
    atkCd: 999, dmg: 4, temp: 0.6, commit: 0.5, xp: 5, coins: [1, 3], cost: 2, pack: [2, 3], res: { burn: 0 },
    brain: (w, u, dt) => { every(w, u, dt, 'fire', 2.9, 3.9, 260, (t) => { setAnim(u, 'throw', 0.35); fireball(w, u, angleTo(u.x, u.y, t.x, t.y)); }); return false; } },
  fireSlime: { ...FOE, name: 'Fire Slime', art: ART('slime-fire'), headR: 60, r: 25, vr: 22, turn: 3, accel: 140, face: 3.5, mass: 1.6, hp: 50, speed: 40, role: 'melee',
    range: 16, atkCd: 1.4, dmg: 8, knock: 90, arc: 2.2, temp: 0.3, commit: 1, xp: 10, coins: [2, 4], cost: 4, res: { burn: 0, chill: 1.5 },
    onDeath: (w, u) => firePatch(w, u.x, u.y, 46, 4),
    brain: (w, u, dt) => { if (u.aggro && u.spd > 20 && due(u, 'drip', dt, 1)) { again(u, 'drip', 1.1, 1.5); firePatch(w, u.x - Math.cos(u.mvA) * u.r, u.y - Math.sin(u.mvA) * u.r, 22, 2.5); } return false; } },
  devil: { ...FOE, name: 'Devil', art: ART('devil'), headR: 56, r: 32, vr: 24, hp: 70, speed: 62, role: 'melee', range: 44, atkCd: 1.3, windup: 0.3, dmg: 11, knock: 150, arc: 0.8,
    xp: 15, coins: [3, 6], cost: 5, attackAnim: 'thrust', ability: 'dash', abilCd: 4, res: { burn: 0.2 } },
  demon: { ...FOE, name: 'Demon', art: ART('demon'), headR: 64, r: 40, vr: 30, turn: 2.8, accel: 160, face: 2.8, mass: 2.6, hp: 150, speed: 46, role: 'melee',
    range: 26, atkCd: 1.8, windup: 0.5, dmg: 17, knock: 240, arc: 2.0, heavy: true, temp: 0.25, commit: 1.2, xp: 28, coins: [6, 11], cost: 8, attackAnim: 'swing', res: { burn: 0.2 },
    brain: (w, u, dt) => slam(w, u, dt, { r: 130, tell: 0.9, dmg: 15, cdMin: 7, cdMax: 9 }) },
  dragonborn: { ...FOE, name: 'Dragonborn', art: ART('dragonborn'), headR: 60, r: 36, vr: 27, turn: 3, accel: 180, face: 3, mass: 2, hp: 110, speed: 52, role: 'melee',
    range: 30, atkCd: 1.6, windup: 0.45, dmg: 15, knock: 200, arc: 1.9, heavy: true, temp: 0.3, commit: 1.1, xp: 22, coins: [4, 9], cost: 7, attackAnim: 'swing',
    ability: 'charge', abilCd: 9, res: { burn: 0.3 } },

  // ---- the Gilded Spire: the host above; cherubs shooting from the back, angels with spears, seraphs casting
  cherub: { ...FOE, name: 'Cherub', art: 'art/enemies/cherub.svg', headR: 40, r: 20, vr: 16, turn: 7, accel: 420, face: 7, mass: 0.6, hp: 24, speed: 66, role: 'ranged',
    range: 260, keep: 180, atkCd: 1.4, dmg: 4, temp: 0.6, commit: 0.5, xp: 6, coins: [1, 3], cost: 2, pack: [2, 3], attackAnim: 'draw', radiance: 12, res: { radiance: 0 } },
  angel: { ...FOE, name: 'Angel', art: ART('angel'), headR: 56, r: 31, vr: 23, hp: 80, speed: 60, role: 'melee', range: 40, atkCd: 1.3, windup: 0.25, dmg: 10, knock: 150, arc: 0.9,
    xp: 16, coins: [3, 7], cost: 5, attackAnim: 'thrust', ability: 'dash', abilCd: 4.5, radiance: 22, res: { radiance: 0 } },
  seraph: { ...FOE, name: 'Seraph', art: 'art/enemies/seraph.svg', headR: 56, r: 31, vr: 23, hp: 60, speed: 52, role: 'ranged', range: 280, keep: 200, atkCd: 1.5, dmg: 7,
    proj: 'bolt', projColor: '#FFF1B0', xp: 16, coins: [3, 7], cost: 5, attackAnim: 'cast', radiance: 20, res: { radiance: 0 } },

  // ---- wardens (floors 1 and 2) and bosses (floor 3): powered-up stand-ins
  broodQueen: { ...FOE, name: 'Brood Queen', art: ART('spider-momma'), headR: 58, r: 50, vr: 38, turn: 2.6, accel: 160, face: 2.6, mass: 4.5, hp: 400, speed: 44, role: 'melee',
    range: 26, atkCd: 1.7, windup: 0.5, dmg: 15, knock: 220, arc: 2, heavy: true, temp: 0.25, commit: 1.2, xp: 80, coins: [30, 45], boss: true, onDeath: courtFalls, attackAnim: 'thrust',
    brain: (w, u, dt) => {
      callAdds(w, u, dt, ['spiderHunter', 'spiderHunter', 'bat'], 16);
      every(w, u, dt, 'webs', 4, 5, 380, (t) => { webShot(w, u, t, { r: 52 }); for (const h of opponents(w, u)) if (h !== t && chance(0.5)) webShot(w, u, h, { r: 46 }); });
      return slam(w, u, dt, { r: 140, tell: 0.95, dmg: 18, cdMin: 7, cdMax: 9 });
    } },
  frostGiant: { ...FOE, name: 'Old Frost', art: ART('snowman'), headR: 60, r: 58, vr: 44, turn: 2, accel: 120, face: 2, mass: 6, hp: 820, speed: 40, role: 'melee',
    range: 30, atkCd: 2.0, windup: 0.6, dmg: 20, knock: 280, arc: 2.2, heavy: true, temp: 0.2, commit: 1.4, xp: 160, coins: [60, 80], boss: true, onDeath: courtFalls,
    attackAnim: 'swing', res: { chill: 0, burn: 1.4 },
    brain: (w, u, dt) => {
      if (hold(u, dt)) return true;
      callAdds(w, u, dt, ['snowman', 'bat', 'bat'], 18);
      every(w, u, dt, 'storm', 4.5, 6, 520, (t) => blizzard(w, u, t.x, t.y, 100));
      const t = targetOf(w, u);
      if (t && due(u, 'volley', dt, 6)) { again(u, 'volley', 8, 10); around(w, u, { r: 90, tell: 0.6, kind: 'ice', hit: { dmg: 10, knock: 200, chill: 30 }, fire: () => ringVolley(w, u, 10, (a) => snowball(w, u, a, { speed: 300, dmg: 7, chill: 30 })) }); return true; }
      return slam(w, u, dt, { r: 150, tell: 1.0, dmg: 20, cdMin: 7, cdMax: 9 });
    } },
  pitLord: { ...FOE, name: 'Pit Lord', art: ART('demon'), headR: 64, r: 50, vr: 38, turn: 2.4, accel: 150, face: 2.4, mass: 4.5, hp: 420, speed: 46, role: 'melee',
    range: 26, atkCd: 1.8, windup: 0.55, dmg: 17, knock: 240, arc: 2, heavy: true, temp: 0.25, commit: 1.2, xp: 80, coins: [30, 45], boss: true, onDeath: courtFalls,
    attackAnim: 'swing', res: { burn: 0 },
    brain: (w, u, dt) => {
      if (hold(u, dt)) return true;
      callAdds(w, u, dt, ['imp', 'imp', 'fireSlime'], 16);
      if (u.aggro && due(u, 'nova', dt, 5) && opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 260)) { again(u, 'nova', 8, 10); nova(w, u, 60, 240); return true; }
      return slam(w, u, dt, { r: 140, tell: 0.95, dmg: 18, cdMin: 6.5, cdMax: 8.5 });
    } },
  archfiend: { ...FOE, name: 'The Archfiend', art: ART('devil'), headR: 56, r: 54, vr: 40, turn: 2.4, accel: 150, face: 2.4, mass: 6, hp: 880, speed: 48, role: 'melee',
    range: 48, atkCd: 1.6, windup: 0.4, dmg: 18, knock: 220, arc: 1.0, heavy: true, temp: 0.2, commit: 1.4, xp: 160, coins: [60, 80], boss: true, onDeath: courtFalls,
    attackAnim: 'thrust', res: { burn: 0 },
    brain: (w, u, dt) => {
      if (hold(u, dt)) return true;
      callAdds(w, u, dt, ['imp', 'imp', 'devil'], 15);
      const t = targetOf(w, u); if (!t || !u.aggro) return false;
      const d = dist(u.x, u.y, t.x, t.y);
      if (d < 280 && due(u, 'breath', dt, 3)) { again(u, 'breath', 6, 7.5); breath(w, u, angleTo(u.x, u.y, t.x, t.y), 280); return true; }
      if (due(u, 'nova', dt, 7) && d < 260) { again(u, 'nova', 9, 11); nova(w, u, 70, 260); return true; }
      if (d > 160 && d < 520 && due(u, 'trident', dt, 4)) { again(u, 'trident', 5, 6.5);
        line(w, u, angleTo(u.x, u.y, t.x, t.y), Math.min(560, d + 100), { tell: 0.75, hw: 30, kind: 'fire', proj: 'fireball', hit: { dmg: 16, knock: 260, burn: 30 } }); return true; }
      return false;
    } },
  archon: { ...FOE, name: 'Archon', art: ART('angel'), headR: 56, r: 48, vr: 36, turn: 2.8, accel: 170, face: 2.8, mass: 4.5, hp: 440, speed: 52, role: 'melee',
    range: 44, atkCd: 1.4, windup: 0.35, dmg: 15, knock: 200, arc: 1.0, heavy: true, temp: 0.25, commit: 1.2, xp: 80, coins: [30, 45], boss: true, onDeath: courtFalls, attackAnim: 'thrust', radiance: 25, res: { radiance: 0 },
    brain: (w, u, dt) => {
      if (rushTick(w, u, dt)) return true;
      callAdds(w, u, dt, ['cherub', 'cherub', 'angel'], 16);
      const t = targetOf(w, u); if (!t || !u.aggro) return false;
      if (due(u, 'smite', dt, 3)) { again(u, 'smite', 4.5, 6); smite(w, u, t.x, t.y, { dmg: 16 }); for (const h of opponents(w, u)) if (h !== t && chance(0.6)) smite(w, u, h.x, h.y, { dmg: 12, r: 60 }); }
      const g = gapTo(u, t);
      if (g > 80 && g < 320 && due(u, 'charge', dt, 5) && lineClear(w, u.x, u.y, t.x, t.y, u.r)) { again(u, 'charge', 6, 8); rush(w, u, angleTo(u.x, u.y, t.x, t.y), g + 80, { tell: 0.55, dmg: 16, knock: 300 }); return true; }
      return false;
    } },
  radiant: { ...FOE, name: 'The Radiant', art: ART('seraph'), headR: 56, r: 54, vr: 40, turn: 2.4, accel: 150, face: 2.4, mass: 6, hp: 920, speed: 46, role: 'melee',
    range: 40, atkCd: 1.5, windup: 0.35, dmg: 18, knock: 220, arc: 1.2, heavy: true, temp: 0.2, commit: 1.4, xp: 160, coins: [60, 80], boss: true, onDeath: courtFalls, attackAnim: 'thrust', radiance: 25, res: { radiance: 0 },
    brain: (w, u, dt) => {
      if (hold(u, dt)) return true;
      callAdds(w, u, dt, ['angel', 'cherub', 'cherub'], 18);
      const t = targetOf(w, u); if (!t || !u.aggro) return false;
      if (due(u, 'smite', dt, 3)) { again(u, 'smite', 4, 5.5); for (const h of opponents(w, u)) smite(w, u, h.x + (h.vx || 0) * 0.5, h.y + (h.vy || 0) * 0.5, { dmg: 15 }); }
      if (due(u, 'raise', dt, 8)) { again(u, 'raise', 10, 13); if (raise(w, u, 600)) raise(w, u, 600); }
      if (due(u, 'ring', dt, 7) && dist(u.x, u.y, t.x, t.y) < 320) { again(u, 'ring', 9, 11);
        around(w, u, { r0: 90, r: 320, tell: 1.2, kind: 'holy', hit: { dmg: 20, knock: 280, radiance: 40 }, fire: (w2, z) => { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; fx(w2, { type: 'pillar', x: z.x + Math.cos(a) * 200, y: z.y + Math.sin(a) * 200, r: 26, kind: 'holy', max: 0.5 }); } } }); return true; }
      return false;
    } },
};
KINDS = new Set(Object.entries(FOES).filter(([, d]) => !d.boss).map(([k]) => k));

// ---------------------------------------------------------------- shared big moves
function blizzard(w, u, x, y, r) {
  lob(w, u, x, y, { r, tell: 1.0, proj: 'bolt', color: '#F4FBFF', pr: 12, kind: 'ice', dust: '#F4FBFF', hit: { dmg: 8, chill: 50 },
    land: (w2, z) => zone(w2, { x: z.x, y: z.y, r: z.r, kind: 'ice', dur: 3, every: 0.5, tick: () => { for (const h of opponents(w2, u)) if (dist(h.x, h.y, z.x, z.y) < z.r + h.r * 0.4) addStatus(w2, h, 'chill', 16); } }) });
}
function nova(w, u, r0, r1) {
  around(w, u, { r0, r: r1, tell: 1.0, kind: 'fire', hit: { dmg: 16, knock: 260, burn: 40 }, fire: (w2, z) => { for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; flames(w2, z.x + Math.cos(a) * (r0 + r1) / 2, z.y + Math.sin(a) * (r0 + r1) / 2, 2, 14, 80); } w2.shake = Math.max(w2.shake, 5); } });
}
function breath(w, u, a, r) {
  cone(w, u, a, { r, arc: 0.95, tell: 0.7, kind: 'fire', anim: 'ability', hit: { dmg: 10, burn: 50, knock: 140 },
    fire: (w2, z) => { for (let i = 0; i < 14; i++) { const b = z.a + rrange(-z.arc / 2, z.arc / 2), d = rrange(30, z.r); flames(w2, z.x + Math.cos(b) * d, z.y + Math.sin(b) * d, 1, 10, 70); } } });
}

// ---------------------------------------------------------------- their elite moves
Object.assign(ELITES, {
  // Bat: a screech in a cone that rattles you to a stop.
  bat: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    const t = targetOf(w, u); if (!t || !due(u, 'screech', dt, 3) || dist(u.x, u.y, t.x, t.y) > 200) return false;
    again(u, 'screech', 5.5, 7); cone(w, u, angleTo(u.x, u.y, t.x, t.y), { r: 220, arc: 1.3, tell: 0.5, kind: 'soul', hit: { dmg: 4, stagger: 75 } }); return true;
  } },
  // Snowman: a blizzard: a big lob that leaves a patch of freezing air.
  snowman: { tick(w, u, dt) { every(w, u, dt, 'blizz', 5, 7, 420, (t) => blizzard(w, u, t.x, t.y, 90)); return false; } },
  // Hunter spider: leaps onto you from a distance.
  spiderHunter: { tick(w, u, dt) { return pounce(w, u, dt, { min: 120, max: 320, every: [3.5, 5], r: 52, dmg: 10, status: { poison: 30 } }); } },
  // Momma spider: her brood hatches: spiderlings come out of her.
  spiderMomma: { tick(w, u, dt) { if (u.aggro && due(u, 'brood', dt, 4)) { again(u, 'brood', 9, 11); summon(w, u, 'spiderHunter', 2, { scale: 0.7, hpMul: 0.45, color: '#5A4A5E' }); } return false; } },
  // Banshee: a cry that drags everyone close by towards her.
  banshee: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    if (!u.aggro || !due(u, 'pull', dt, 4)) return false;
    const near = opponents(w, u).filter((h) => dist(u.x, u.y, h.x, h.y) < 340); if (!near.length) return false;
    again(u, 'pull', 7, 9);
    beginHold(u, 0.6, null, () => { fx(w, { type: 'ring', x: u.x, y: u.y, r: 340, color: '#B48CFF', max: 0.5 });
      for (const h of opponents(w, u)) if (dist(u.x, u.y, h.x, h.y) < 340) { const a = angleTo(h.x, h.y, u.x, u.y); h.kx += Math.cos(a) * 420 / h.mass; h.ky += Math.sin(a) * 420 / h.mass; hurt(w, h, 4 * u.dmgMul, u, { curse: 22 }); } });
    setAnim(u, 'cast', 0.6); return true;
  } },
  // Ogre: splits the floor: a shockwave down a line.
  ogre: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    const t = targetOf(w, u); if (!t || !due(u, 'split', dt, 3) || dist(u.x, u.y, t.x, t.y) > 420) return false;
    again(u, 'split', 6, 8); line(w, u, angleTo(u.x, u.y, t.x, t.y), 420, { tell: 0.85, hw: 38, kind: 'bone', anim: 'ability', hit: { dmg: 14, knock: 260, stagger: 60, heavy: true } }); return true;
  } },
  // Imp: when you get close it blinks away, leaving fire where it stood.
  imp: { tick(w, u, dt) {
    if (!due(u, 'blink', dt, 1)) return false;
    const near = opponents(w, u).find((h) => dist(u.x, u.y, h.x, h.y) < 120 + h.r); if (!near) return false;
    const p = openSpot(w, u.x, u.y, 200, 300, u.r); if (!p) return false;
    again(u, 'blink', 4, 5.5); firePatch(w, u.x, u.y, 40, 3.5); blink(w, u, p.x, p.y, 'rgba(255,138,61,0.8)'); return false;
  } },
  // Fire slime: lobs a glob of magma that leaves a burning patch.
  fireSlime: { tick(w, u, dt) { every(w, u, dt, 'magma', 3.5, 5, 380, (t) => lob(w, u, t.x, t.y, { r: 50, tell: 0.9, proj: 'fireball', kind: 'fire', dust: '#5A4A40', hit: { dmg: 7, burn: 30 }, land: (w2, z) => firePatch(w2, z.x, z.y, 50, 4) })); return false; } },
  // Devil: opens the floor and calls up imps.
  devil: { tick(w, u, dt) { if (u.aggro && due(u, 'imps', dt, 4)) { again(u, 'imps', 10, 12); summon(w, u, 'imp', 2, { color: '#5A2A20' }); } return false; } },
  // Demon: a ring of fire bursting out round it.
  demon: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    if (!u.aggro || !due(u, 'nova', dt, 4) || !opponents(w, u).some((h) => dist(u.x, u.y, h.x, h.y) < 240)) return false;
    again(u, 'nova', 7, 9); nova(w, u, 60, 230); return true;
  } },
  // Dragonborn: breathes fire in a cone.
  dragonborn: { tick(w, u, dt) {
    if (hold(u, dt)) return true;
    const t = targetOf(w, u); if (!t || !due(u, 'breath', dt, 3) || dist(u.x, u.y, t.x, t.y) > 240) return false;
    again(u, 'breath', 6, 8); breath(w, u, angleTo(u.x, u.y, t.x, t.y), 250); return true;
  } },
  // Cherub: arrow rain: a circle on the floor peppered from above.
  cherub: { tick(w, u, dt) { every(w, u, dt, 'rain', 4, 5.5, 420, (t) => lob(w, u, t.x, t.y, { r: 80, tell: 1.0, kind: 'holy', dust: '#FFF1B0', hit: { dmg: 6, knock: 80, radiance: 18 },
    land: (w2, z) => { for (let i = 0; i < 12; i++) { const a = rand() * TAU, d = rand() * z.r; sparks(w2, z.x + Math.cos(a) * d, z.y + Math.sin(a) * d, rand() * TAU, 1, '#FFF1B0'); } } })); return false; } },
  // Angel: smites: a shaft of light where you stand.
  angel: { tick(w, u, dt) { every(w, u, dt, 'smite', 4.5, 6, 460, (t) => smite(w, u, t.x + (t.vx || 0) * 0.5, t.y + (t.vy || 0) * 0.5)); return false; } },
  // Seraph: raises the fallen of its side.
  seraph: { tick(w, u, dt) { if (u.aggro && due(u, 'raise', dt, 4)) { again(u, 'raise', 9, 11); raise(w, u, 450); } return false; } },
});
