// The Elder Ent: the Wildwood's boss (floor 3), a designed fight like the Bone King's. The design, with every number:
// docs/BOSS-elder-ent.md. The designer (round 9): "When burning takes double damage, all of its attacks do burn, and
// attacks faster. Immune to all other effects." From the roster: root cages that pin, falling branches you see coming,
// a grove of sproutlings that feed it; set it alight and it rampages.
// Art (art round 8): art/enemies/elder-ent.svg, built in parts: its crown sways (#back), its branch arms swing.
import { alive, opponents, hurt, puff, flames, sparks, setAnim, fx, addBuff, spawn, heal, addDanger } from './sim.js';
import { TAU, clamp, dist, angleTo, rand, rrange, chance } from './util.js';
import { lineClear } from './path.js';
import { lob, cone, line, around, hold, beginHold, due, again, crowd, stand, turnTo, later } from './elites.js';
import { walkTo, courtFalls } from './enemies.js';
import { variantUrl } from './recolor.js';

// Every attack: a tell (a shape fills on the ground), the hit, a short recovery (the hold). Burning: tells and
// cooldowns x BURN.k, blows burn, twice the damage taken.
export const EE = {
  sweep: { r: 230, arc: 2.4, tell: 0.8, dmg: 25, knock: 320, rec: 0.6 },
  roots: { len: 560, hw: 40, tell: 0.9, dmg: 17, entangle: 65, rec: 0.4, patch: 5, patchR: 44 },
  branch: { r: 70, tell: 1.05, dmg: 24, stagger: 45 },
  cage: { r: 84, tell: 0.95, dmg: 14, entangle: 110 },
  stomp: { r: 240, tell: 0.9, dmg: 16, knock: 360 },
  grove: { every: 13, feed: 0.012, reach: 320, cap: 6 },
};
export const PHASE_AT = [1, 0.65, 0.35];
export const BURN = { k: 0.7, taken: 2, move: 1.35, atk: 1.4, hitBurn: 22, at: 8 };
const WAKE = 420;

const heroes = (w, u) => w.units.filter((o) => o.team !== u.team && alive(o) && !o.ethereal); // its opponents, whichever side it's on (battle mode)
const rootPuff = (w, x, y, n = 6) => puff(w, x, y, '#6E8F3A', n, 90, 5, 0.45);
// Immune to everything but fire: the build-ups by its res (all 0 but burn), and the timers cleared every tick.
const STEADY = { tick(w, u) { u.stunT = 0; u.rootT = 0; u.sleepT = 0; u.koT = 0; u.frozenT = 0; u.tangledT = 0; }, knockImmune: true };

function brain(w, u, dt) {
  const k = u.ee || (u.ee = { phase: 0, st: 'asleep', t: 0, beds: w.beds || [] });
  if (!u.trinketHooks || !u.trinketHooks.includes(STEADY)) u.trinketHooks = [...(u.trinketHooks || []), STEADY];
  // burning: double damage taken, every blow burns, faster at everything (round 9)
  const burning = u.st.burn > BURN.at;
  u.burning = burning; u.hitBurn = burning ? BURN.hitBurn : 0;
  if (burning) { addBuff(u, { id: 'ablaze', dur: 0.3, taken: BURN.taken, move: BURN.move, atkSpeed: BURN.atk }); if (rand() < dt * 14) flames(w, u.x + rrange(-u.r, u.r) * 0.6, u.y + rrange(-u.r, u.r) * 0.6, 1, 14, 90); }
  const K = (burning ? BURN.k : 1) * (k.phase >= 3 ? 0.85 : 1);
  // asleep among the trees until someone comes near or hurts it
  if (k.st === 'asleep') {
    stand(u, dt);
    if (u.aggro || heroes(w, u).some((h) => dist(h.x, h.y, u.x, u.y) < WAKE)) {
      u.aggro = true; k.st = 'awake'; k.phase = 1; beginHold(u, 1.2, null); setAnim(u, 'ability', 1.2);
      w.shake = Math.max(w.shake, 6); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; rootPuff(w, u.x + Math.cos(a) * u.r * 1.2, u.y + Math.sin(a) * u.r * 1.2, 2); }
    }
    return true;
  }
  if (hold(u, dt)) return true;
  // phase turns: a stamp that throws everyone back, then the next part of the fight
  const hp = u.hp / u.maxHp;
  if (k.phase < 3 && hp < PHASE_AT[k.phase]) {
    k.phase++;
    around(w, u, { r: EE.stomp.r, tell: EE.stomp.tell, kind: 'root', hit: { dmg: EE.stomp.dmg, knock: EE.stomp.knock, heavy: true, burn: u.hitBurn || undefined },
      fire: (w2, z) => { w2.shake = Math.max(w2.shake, 8); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; rootPuff(w2, z.x + Math.cos(a) * z.r * 0.8, z.y + Math.sin(a) * z.r * 0.8, 2); } } });
    if (k.phase === 2) { again(u, 'grove', 1.5); }
    return true;
  }
  // the grove: sproutlings grow from the seed beds and root beside it; while rooted near it, they feed it
  if (k.phase >= 2) grove(w, u, k, dt);
  const t = pickTarget(w, u, k, dt);
  if (!t) { stand(u, dt); return true; }
  const d = dist(u.x, u.y, t.x, t.y), gap = d - u.r - t.r, at = angleTo(u.x, u.y, t.x, t.y);
  const hit = (h) => (u.hitBurn ? { ...h, burn: u.hitBurn } : h);
  // up close: the sweep
  if (gap < 120 && due(u, 'sweep', dt, 1)) {
    again(u, 'sweep', 2.8 * K, 3.8 * K);
    cone(w, u, at, { r: EE.sweep.r, arc: EE.sweep.arc, tell: EE.sweep.tell * K, kind: 'bone', anim: 'ability', after: EE.sweep.rec, hit: hit({ dmg: EE.sweep.dmg, knock: EE.sweep.knock, heavy: true }) });
    return true;
  }
  // root cage: a ring of roots springs up round a hero (two in the last phase): rooted at once if it's caught
  if (k.phase >= 2 && due(u, 'cage', dt, 3)) {
    again(u, 'cage', 7 * K, 9 * K);
    const hs = heroes(w, u).sort((a, b) => dist(a.x, a.y, u.x, u.y) - dist(b.x, b.y, u.x, u.y));
    const picks = [t, ...(k.phase >= 3 ? hs.filter((h) => h !== t).slice(-1) : [])];
    for (const h of picks) lob(w, u, h.x + (h.vx || 0) * 0.3, h.y + (h.vy || 0) * 0.3, { r: EE.cage.r, tell: EE.cage.tell * K, kind: 'root', dust: '#6E8F3A', hit: hit({ dmg: EE.cage.dmg, entangle: EE.cage.entangle }),
      land: (w2, z) => { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; rootPuff(w2, z.x + Math.cos(a) * z.r, z.y + Math.sin(a) * z.r, 2); } } });
    setAnim(u, 'cast', 0.6); beginHold(u, 0.5, at);
    return true;
  }
  // roots: a line (three fanned in the last phase) that entangles
  if (d < 640 && due(u, 'roots', dt, 2)) {
    again(u, 'roots', 4.5 * K, 6 * K);
    const fan = k.phase >= 3 ? [-0.32, 0, 0.32] : [0];
    for (const da of fan) line(w, u, at + da, EE.roots.len, { tell: EE.roots.tell * K, hw: EE.roots.hw, kind: 'root', anim: 'ability', after: EE.roots.rec,
      hit: hit({ dmg: EE.roots.dmg, entangle: EE.roots.entangle, knock: 60 }), fire: (w2, z) => {
        // the roots stay up a while where they broke through: grasping ground (dungeon.js 'roots' hazard)
        for (let q = 0.18; q < 1; q += 0.2) { const x = z.x1 + (z.x2 - z.x1) * q, y = z.y1 + (z.y2 - z.y1) * q; rootPuff(w2, x, y, 3);
          if (w2.hazards.filter((h) => h.type === 'roots' && h.t != null).length < 18) w2.hazards.push({ type: 'roots', x, y, r: EE.roots.patchR, t: EE.roots.patch, max: EE.roots.patch }); } } });
    return true;
  }
  // falling branches: circles on the floor under heroes, then the branches come down
  if (due(u, 'branch', dt, 4)) {
    again(u, 'branch', 7.5 * K, 9.5 * K);
    const hs = heroes(w, u), n = k.phase >= 3 ? 8 : k.phase >= 2 ? 6 : 4;
    for (let i = 0; i < n; i++) {
      const h = hs[i % hs.length], off = i < hs.length ? 0 : rrange(60, 140), a = rand() * TAU;
      const x = clamp(h.x + (h.vx || 0) * 0.4 + Math.cos(a) * off, 40, w.W - 40), y = clamp(h.y + (h.vy || 0) * 0.4 + Math.sin(a) * off, 40, w.H - 40);
      addDanger(w, { shape: 'circle', x, y, r: EE.branch.r, t: EE.branch.tell * K + i * 0.12, team: u.team, src: null, kind: 'bone', hit: hit({ dmg: EE.branch.dmg * u.dmgMul, stagger: EE.branch.stagger, knock: 120 }),
        onFire: (w2, z) => { puff(w2, z.x, z.y, '#7A5A3A', 12, 140, 6, 0.5); sparks(w2, z.x, z.y, rand() * TAU, 3, '#C9A27A'); w2.shake = Math.max(w2.shake, 3); } });
    }
    setAnim(u, 'cast', 0.7); beginHold(u, 0.6, at);
    return true;
  }
  // otherwise it walks at its mark, slowly, turning like a tree
  if (gap > 40) walkTo(w, u, t.x, t.y, 0.8, dt); else stand(u, dt);
  turnTo(u, at, 1.8, dt);
  return true;
}
function pickTarget(w, u, k, dt) {
  if ((k.tgtT = (k.tgtT || 0) - dt) <= 0 || !u.target || !alive(u.target) || u.target.ethereal) {
    k.tgtT = 1.2;
    if (u.tauntBy && u.tauntT > 0 && alive(u.tauntBy)) u.target = u.tauntBy;
    else { let best = null, bd = Infinity; for (const h of heroes(w, u)) { const dd = dist(h.x, h.y, u.x, u.y) - (h === u.target ? 60 : 0); if (dd < bd) { bd = dd; best = h; } } u.target = best; }
  }
  return u.target && alive(u.target) ? u.target : null;
}
// The grove: every EE.grove.every seconds 2 (3 in the last phase) sproutlings grow out of the seed beds (or beside it)
// already rooted; a rooted sproutling within reach feeds it (a thin green beam): kill them and the healing stops.
function grove(w, u, k, dt) {
  if (due(u, 'grove', dt, 2) && !w.stale) {
    again(u, 'grove', EE.grove.every);
    const mine = w.units.filter((o) => o.feeds === u && alive(o)).length, n = Math.min(k.phase >= 3 ? 3 : 2, EE.grove.cap - mine);
    for (let i = 0; i < n && crowd(w, u.team) < 20; i++) {
      const bed = k.beds.length ? k.beds[Math.floor(rand() * k.beds.length)] : null, a = rand() * TAU;
      const x = bed ? bed.x + rrange(-24, 24) : u.x + Math.cos(a) * (u.r + 90), y = bed ? bed.y + rrange(-24, 24) : u.y + Math.sin(a) * (u.r + 90);
      later(w, x, y, 0.8, () => { const s = spawn(w, 'sproutling', x, y, { mult: w.mult }); s.aggro = true; s.minion = true; s.calledBy = u; s.court = true; s.feeds = u;
        s.sp = { calm: 0, rooted: true, shotT: 1.5, rootCd: 6 }; rootPuff(w, x, y, 10); });
    }
  }
  if (u.burning || w.stale) return; // a burning tree drinks nothing
  for (const s of w.units) {
    if (s.feeds !== u || !alive(s) || !(s.sp && s.sp.rooted) || dist(s.x, s.y, u.x, u.y) > EE.grove.reach) continue;
    heal(w, u, u.maxHp * EE.grove.feed * dt, null);
    if (rand() < dt * 1.5) fx(w, { type: 'beam', x1: s.x, y1: s.y, x2: u.x, y2: u.y, kind: 'heal', max: 0.45, from: s, to: u });
  }
}

export const ELDER = {
  elderEnt: { team: 'enemy', name: 'The Elder Ent', art: 'art/enemies/elder-ent.svg', headR: 66, r: 64, vr: 48, turn: 1.4, accel: 90,
    face: 1.4, mass: 9, hp: 1850, speed: 38, role: 'melee', range: 34, atkCd: 999, arc: 2, temp: 0.2, commit: 1.4, xp: 160, coins: [60, 80], boss: true, arena: 'grove',
    res: { burn: 1, chill: 0, poison: 0, wet: 0, shock: 0, stagger: 0, radiance: 0, curse: 0, entangle: 0 }, onDeath: (w, u) => { courtFalls(w); for (let i = 0; i < 20; i++) rootPuff(w, u.x + rrange(-u.r, u.r), u.y + rrange(-u.r, u.r), 2); },
    brain },
};
