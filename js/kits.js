// Hero kits: the 45 abilities and 15 traits from heroes.js, made to work. Each ability has
// score(w, u, t, tier) -> how much it's worth using right now (0 = not now) and use(w, u, t, tier).
// Traits (and trinkets, see trinkets.js) are "hooks": small objects whose functions sim.js calls at set moments:
//   tick(w, u, dt)                       every step
//   dealt(w, u, target, amt, o) -> amt   when u hurts something
//   taken(w, u, src, amt, o) -> amt      when u is hurt
//   hit(w, u, target, amt, o)            after u's hit lands
//   kill(w, u, victim)                   u killed something
//   death(w, u, victim)                  something died within 260 of u
//   downed(w, u, src) -> true            u would go down: return true to stay up (the hook sets hp)
//   evade(w, u, src, amt, o) -> true     a blow (not a dot) is about to land on u: return true and it misses
//   struck(w, u, src, amt, o)            after a blow (not a dot) landed on u
//   fallen(w, u, src)                    u went down (a hero) or died (not called for summons)
//   allyDown(w, u, victim)               a unit on u's side went down or died anywhere in the room (not summons)
//   moveSpeed(u) -> mul, atkSpeed(u) -> mul, immune: [status...], knockImmune: true
//   reviveRate, reviveHp                 numbers read by the revive code
// Hit options worth knowing in hooks: o.dot (damage over time), o.shot (a projectile hit), o.proc (damage a trinket
// made itself: trinkets that react to hits skip these, so they never set each other off in a loop).
import { HEROES, TIER_CD, ROLE_TUNE, statsFor, tierOf } from './heroes.js';
import { TAU, clamp, dist, angleTo, angleDiff, rand, rrange, chance } from './util.js';
import {
  hurt, addStatus as simAddStatus, spawn, alive, opponents, allies, hpRatio, puff, setAnim, explode, blocked, textU,
  stun, heal as simHeal, addBuff, fx, zone as simZone, cleanse, wallRect,
} from './sim.js';
import { lineClear } from './path.js';
import { cue } from './sfx.js';
import { tagAbility } from './fxtag.js';
import { STATUS } from './statuses.js';
import { ABILITIES2, TRAITS2, ATTACKS2, kit2Tick } from './kits2.js';

// ---------------------------------------------------------------- the skill web's stat nodes (round 8)
// u.kit.mods = statsFor(hero, nodes) (heroes.js). Generic stats go straight onto the unit in initKit; an ability's own
// nodes (its damage, heal, statuses) apply while that ability is being used: kitThink sets u.kit.using around use(),
// and what an ability leaves behind (a zone's ticks, a delayed blow, a ray, a shot) carries the ability with it.
const abMod = (u, key, ab) => { const k = u && u.kit; if (!k || !k.mods) return 0; const a = k.mods.ab[ab || k.using]; return (a && a[key]) || 0; };
function withAb(u, ab, f) {
  if (!ab || !u.kit) return f;
  return (...args) => { const k = u.kit, prev = k.using; k.using = ab; try { return f(...args); } finally { k.using = prev; } };
}
// (round 11: a role can heal less or more across the board: heroes.js ROLE_TUNE[role].heal)
const roleHeal = (src) => { const h = src && src.kit && HEROES[src.kit.hero], t = h && ROLE_TUNE[h.role]; return (t && t.heal) || 1; };
const healMul = (src) => (src && src.kit && src.kit.mods ? (1 + src.kit.mods.heal + abMod(src, 'abHeal')) * roleHeal(src) : 1);
const statusMul = (src, ab) => (src && src.kit && src.kit.mods ? 1 + src.kit.mods.status + abMod(src, 'abStatus', ab) : 1);
const heal = (w, t, amt, src) => simHeal(w, t, amt * healMul(src), src);
const addStatus = (w, t, type, amt, src) => simAddStatus(w, t, type, amt * statusMul(src), src);
const zone = (w, z) => { const u = z.src, ab = u && u.kit && u.kit.using; if (ab && z.tick) z.tick = withAb(u, ab, z.tick); return simZone(w, z); };
const HIT_STATUSES = ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger'];
// The hook every hero with stat nodes wears: statuses on its blows building faster. (Armour nodes add to u.armor in initKit.)
function statHook(mods) {
  return {
    hit(w, u, t, amt, o) {
      const m = statusMul(u, o.ab) - 1; if (m <= 0 || o.proc) return;
      for (const s of HIT_STATUSES) if (o[s]) simAddStatus(w, t, s, o[s] * m, u);
    },
  };
}

// ---------------------------------------------------------------- helpers
const near = (w, u, x, y, r, team) => w.units.filter((o) => alive(o) && !o.ethereal && o.team === team && dist(x, y, o.x, o.y) < r + o.r);
const foesNear = (w, u, x, y, r) => near(w, u, x, y, r, u.team === 'hero' ? 'enemy' : 'hero');
const friendsNear = (w, u, x, y, r) => near(w, u, x, y, r, u.team);
const hurtMost = (list) => list.reduce((b, o) => (!b || hpRatio(o) < hpRatio(b) ? o : b), null);
const dmgOf = (u, k) => (u.def.dmg || 8) * (u.dmgMul || 1) * k * (1 + abMod(u, 'abDmg'));
const ang = (u, t) => angleTo(u.x, u.y, t.x, t.y);
const isUndead = (o) => /skeleton|rattler|gaper|brute|ghost|banshee|boss/.test(o.kind) || o.def.undead;

// A projectile with its own look and what happens when it lands.
export function shoot(w, u, a, o) {
  const sp = o.speed || 480;
  w.projectiles.push({
    kind: o.kind || 'bolt', x: u.x + Math.cos(a) * (u.r + 6), y: u.y + Math.sin(a) * (u.r + 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    r: o.r || 6, team: u.team, owner: u, dmg: o.dmg ?? dmgOf(u, 1), o: { knock: o.knock ?? 30, ...(o.st || {}), crit: o.crit, heavy: o.heavy, ab: u.kit && u.kit.using },
    life: o.life || 1.2, a, pierce: o.pierce || 0, hitSet: o.pierce ? new Set() : null, land: o.land, grow: o.grow, color: o.color,
    ...(o.extra || {}),
  });
  return w.projectiles[w.projectiles.length - 1];
}
function arcHit(w, u, range, arc, dmg, o = {}) {
  let n = 0;
  for (const e of opponents(w, u)) {
    const d = dist(u.x, u.y, e.x, e.y) - u.r - e.r;
    if (d > range || angleDiff(angleTo(u.x, u.y, e.x, e.y), u.facing) > arc / 2 + 0.15) continue;
    hurt(w, e, dmg, u, { ...o }); n++;
  }
  return n;
}
function ring(w, u, x, y, r, dmg, o = {}, color = '#FFFFFF') {
  fx(w, { type: 'ring', x, y, r, color, max: 0.4 });
  let n = 0;
  for (const e of foesNear(w, u, x, y, r)) { hurt(w, e, dmg, u, { kAngle: angleTo(x, y, e.x, e.y), noDodge: true, ...o }); n++; }
  return n;
}
const cast = (u, kind = 'cast', dur = 0.45) => setAnim(u, kind, dur);
// for kits2.js (the new heroes' abilities)
export { near, foesNear, friendsNear, hurtMost, dmgOf, ang, isUndead, arcHit, ring, cast, heal, addStatus, zone, withAb, abMod, rectGap };

// ---------------------------------------------------------------- abilities
export const ABILITIES = {
  // ----- Paladin
  shieldBash: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) - u.r - t.r < 70 ? 0.55 + (t.target && t.target !== u ? 0.3 : 0) : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.35); u.facing = ang(u, t); u.kx += Math.cos(u.facing) * 260; u.ky += Math.sin(u.facing) * 260;
      const hits = tier >= 3 ? foesNear(w, u, u.x, u.y, u.r + 70).filter((e) => angleDiff(ang(u, e), u.facing) < 1.1) : [t];
      for (const e of hits) { hurt(w, e, dmgOf(u, 1.4), u, { knock: 280, heavy: true, stagger: 45 }); if (tier >= 2) stun(w, e, 0.8); }
      w.shake = Math.max(w.shake, 5);
    },
  },
  guard: {
    score: (w, u) => { const a = hurtMost(allies(w, u).filter((o) => !o.summon)); return a && hpRatio(a) < 0.65 && opponents(w, u).some((e) => e.target === a) ? 0.85 : 0; },
    use(w, u, t, tier) {
      const a = hurtMost(allies(w, u)); if (!a) return;
      cast(u, 'ability', 0.3);
      a.guardBy = u; a.guardT = 5; a.guardShare = tier >= 2 ? 0.6 : 0.4;
      u.forcedGoal = null; u.guardOf = a; u.guardOfT = 5;
      if (tier >= 3) heal(w, a, a.maxHp * 0.1, u);
      fx(w, { type: 'beam', x1: u.x, y1: u.y, x2: a.x, y2: a.y, kind: 'holy', max: 0.5 });
    },
  },
  consecrate: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 110).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.5);
      const r = tier >= 2 ? 140 : 105, dur = tier >= 2 ? 6 : 4;
      zone(w, { x: u.x, y: u.y, r, dur, kind: 'holy', src: u, every: 0.5, tick(z) {
        for (const e of foesNear(w, u, z.x, z.y, z.r)) hurt(w, e, dmgOf(u, 0.3) * (tier >= 3 && isUndead(e) ? 2.5 : 1), u, { dot: true, color: '#FFE7A0', burn: tier >= 3 && isUndead(e) ? 12 : 0 });
        for (const a of friendsNear(w, u, z.x, z.y, z.r)) heal(w, a, a.maxHp * 0.01, u); // (round 11: half what it was; he's a tank first)
      } });
    },
  },
  // ----- Tower
  holdTheLine: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 160).length >= 2 ? 0.75 : 0),
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 6 : 4; // round 9: no swing; he simply holds the shield out in front (parts.js)
      addBuff(u, { id: 'holdTheLine', dur, frontBlock: 0.6, root: true, reflect: tier >= 3 ? 0.5 : 0 });
      for (const e of foesNear(w, u, u.x, u.y, tier >= 2 ? 300 : 200)) { e.tauntBy = u; e.tauntT = dur; e.target = u; }
      puff(w, u.x, u.y, '#FFE7A0', 10, 140, 5, 0.45); // no ring round him (round 6): a burst of dust as the shield plants
    },
  },
  charge: {
    score(w, u, t) {
      if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); if (d < 85 || d > 340 || !lineClear(w, u.x, u.y, t.x, t.y, u.r)) return 0;
      return 0.4 + 0.3 * foesNear(w, u, t.x, t.y, 80).length;
    },
    use(w, u, t, tier) {
      const a = ang(u, t); u.facing = a; // round 9: no arm swing; the shield is held out in front while he charges (parts.js)
      u.act = { type: 'charge', t: tier >= 2 ? 0.7 : 0.55, max: 0.7, a, hit: new Set(), stagger: tier >= 3 ? 60 : 0, power: tier >= 2 ? 1.3 : 1 };
    },
  },
  groundPound: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 120).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.4); w.shake = Math.max(w.shake, 7);
      ring(w, u, u.x, u.y, 125, dmgOf(u, 1), { knock: 300, heavy: true, stagger: tier >= 2 ? 40 : 0 }, '#E8D8B0');
      if (tier >= 3) u.later = [{ t: 0.5, f: () => ring(w, u, u.x, u.y, 170, dmgOf(u, 0.6), { knock: 220, stagger: 30 }, '#E8D8B0') }];
    },
  },
  // ----- Archer
  barrage: {
    score(w, u, t) {
      if (!t || dist(u.x, u.y, t.x, t.y) > u.def.range || blocked(w, u.x, u.y, t.x, t.y)) return 0;
      let fuel = 0; for (const h of w.hazards) if ((h.type === 'oil' || h.type === 'gas') && foesNear(w, u, h.x, h.y, h.r).length) fuel = 0.4;
      return 0.1 + 0.35 * (foesNear(w, u, t.x, t.y, 90).length - 1) + fuel;
    },
    use(w, u, t, tier) {
      // round 9: a short charge first (the bow drawn, arrows gathering on it: fxkit), then the fan, each arrow at its own speed
      const n = tier >= 2 ? 7 : 5; cast(u, 'draw', 0.5); u.aimT = 0.42; u.aimCol = tier >= 2 ? '#FF8A3D' : null; u.aimHead = tier >= 2 ? '#FFD45A' : null;
      u.later = [{ t: 0.4, f: () => {
        const base = t && alive(t) ? ang(u, t) : u.facing; u.aimT = 0; u.recoilT = 0.14;
        for (let i = 0; i < n; i++) shoot(w, u, base + (i - (n - 1) / 2) * 0.08, { kind: tier >= 2 ? 'fireArrow' : 'arrow', speed: 360 + ((i * 3) % n) / (n - 1) * 300, dmg: dmgOf(u, 0.8), st: tier >= 2 ? { burn: 20 } : {}, pierce: tier >= 3 ? 2 : 0 });
      } }];
    },
  },
  frostArrow: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && !blocked(w, u.x, u.y, t.x, t.y) ? 0.35 + (t.def.boss ? 0.3 : 0) + 0.15 * foesNear(w, u, t.x, t.y, 80).length : 0),
    use(w, u, t, tier) {
      // round 9: a readable charge (cold drawn into the bow from all round her: fxkit), and snowflakes that linger
      cast(u, 'draw', 0.55); u.aimT = 0.47; u.aimCol = '#9FB7C8'; u.aimHead = '#BFE9F8';
      u.later = [{ t: 0.45, f: () => {
        u.aimT = 0; u.recoilT = 0.14;
        shoot(w, u, t && alive(t) ? ang(u, t) : u.facing, { kind: 'shard', speed: 560, dmg: dmgOf(u, 1.2), st: { chill: tier >= 2 ? 110 : 60 },
          land: (p) => { fx(w, { type: 'zone', kind: 'snow', x: p.x, y: p.y, r: tier >= 3 ? 80 : 45, max: 2 });
            if (tier >= 3) { fx(w, { type: 'ring', x: p.x, y: p.y, r: 80, color: '#BFEFFF', max: 0.4 }); for (const e of foesNear(w, u, p.x, p.y, 80)) addStatus(w, e, 'chill', 50, u); } } });
      } }];
    },
  },
  roll: {
    score(w, u) { const f = foesNear(w, u, u.x, u.y, 70); return f.length ? 0.9 : 0; },
    use(w, u, t, tier) {
      const f = foesNear(w, u, u.x, u.y, 90); let ax = 0, ay = 0; for (const e of f) { ax += u.x - e.x; ay += u.y - e.y; }
      const a = Math.atan2(ay, ax);
      u.act = { type: 'dash', t: 0.3, max: 0.3, a, roll: true, dir: Math.sin(a - u.facing) < 0 ? -1 : 1 }; u.invulnT = Math.max(u.invulnT, 0.3); // a full roll (round 9)
      if (tier >= 2) u.nextShotMul = 2;
      if (tier >= 3) zone(w, { x: u.x, y: u.y, r: 55, dur: 5, kind: 'vines', src: u, every: 0.25, tick(z) { for (const e of foesNear(w, u, z.x, z.y, z.r)) addStatus(w, e, 'chill', 10, u); } });
    },
  },
  // ----- Twinfang
  backstab: {
    // worth it on a hurt target busy with someone else (the cooldown is long since round 6: it came too often)
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) > 90 ? (1 - hpRatio(t)) * 0.6 + (t.target && t.target !== u ? 0.4 : 0) : 0),
    use(w, u, t, tier) {
      zone(w, { x: u.x, y: u.y, r: 62, dur: 1.6, kind: 'smoke', src: u }); // the cloud she leaves (round 9: bigger, a body like the puddles)
      const back = t.facing + Math.PI;
      u.x = clamp(t.x + Math.cos(back) * (t.r + u.r + 6), u.r, w.W - u.r); u.y = clamp(t.y + Math.sin(back) * (t.r + u.r + 6), u.r, w.H - u.r);
      u.vx = u.vy = 0; u.facing = u.mvA = ang(u, t); u.spd = 0; cast(u, 'thrust', 0.25);
      hurt(w, t, dmgOf(u, 3.2), u, { crit: true, noDodge: true, poison: tier >= 2 ? 40 : 0 });
      if (tier >= 3 && !alive(t)) u.kit.cd.backstab = 0.5;
      u.atkT = u.def.atkCd; u.mode = 'retreat'; u.modeT = 0;
    },
  },
  dash: {
    score(w, u, t) {
      if (!t) return 0;
      const close = foesNear(w, u, u.x, u.y, 60).length, gap = dist(u.x, u.y, t.x, t.y) - u.r - t.r;
      if (u.mode === 'retreat' && close) return 0.95;
      return u.mode !== 'retreat' && gap > 130 && gap < 320 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.8 : 0;
    },
    use(w, u, t, tier) {
      const close = foesNear(w, u, u.x, u.y, 60);
      const a = u.mode === 'retreat' && close.length ? angleTo(close[0].x, close[0].y, u.x, u.y) : ang(u, t);
      u.act = { type: 'dash', t: 0.2, max: 0.2, a };
      if (tier >= 2) { zone(w, { x: u.x, y: u.y, r: 64, dur: 2.5, kind: 'smoke', src: u, smoke: true }); for (const e of foesNear(w, u, u.x, u.y, 90)) if (e.target === u) e.target = null; }
      if (tier >= 3) { u.kit.charges = (u.kit.charges ?? 1) - 1; if (u.kit.charges > 0) u.kit.cd.dash = 0.6; else u.kit.charges = 2; }
    },
  },
  fanOfKnives: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 150).length >= 3 ? 0.8 : 0),
    use(w, u, t, tier) {
      // round 9: she spins once, throwing the knives one at a time round the circle as she turns
      const n = tier >= 3 ? 12 : 8, T = 0.42, a0 = u.facing; setAnim(u, 'spin', T); u.spin = { t0: w.time, dur: T, dir: 1 };
      u.later = [];
      for (let i = 0; i < n; i++) u.later.push({ t: (i + 0.5) / n * T, f: () => shoot(w, u, a0 + (i + 0.5) / n * TAU, { kind: 'dagger', speed: 520, life: 0.45, dmg: dmgOf(u, 1.2), st: tier >= 2 ? { poison: 25 } : {}, pierce: tier >= 3 ? 1 : 0 }) });
    },
  },
  // ----- Wildmane
  rage: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 130).length >= 2 || hpRatio(u) < 0.5 ? 0.8 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.45); w.shake = Math.max(w.shake, 4);
      addBuff(u, { id: 'rage', dur: tier >= 3 ? 8 : 5, taken: 0.7, atkSpeed: 1.4, move: 1.25, lifesteal: tier >= 2 ? 0.15 : 0, knockImmune: tier >= 3, glow: '#FF5A3D' });
      puff(w, u.x, u.y, '#FF6B4A', 16, 120, 6, 0.6);
    },
  },
  leap: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return d > 140 && d < 380 ? 0.6 + 0.2 * foesNear(w, u, t.x, t.y, 90).length : 0; },
    use(w, u, t, tier) {
      cast(u, 'ability', 0.6);
      u.act = { type: 'leap', t: 0.5, max: 0.5, x0: u.x, y0: u.y, x1: t.x - Math.cos(ang(u, t)) * (u.r + t.r), y1: t.y - Math.sin(ang(u, t)) * (u.r + t.r),
        land: () => { w.shake = Math.max(w.shake, 7); ring(w, u, u.x, u.y, 110, dmgOf(u, 1.3), { knock: 260, heavy: true, stagger: tier >= 2 ? 50 : 0 }, '#E8C9A0');
          if (tier >= 3 && !u.leapAgain) { u.leapAgain = true; u.kit.cd.leap = 0.4; } else u.leapAgain = false; } };
      u.invulnT = Math.max(u.invulnT, 0.4);
    },
  },
  cleave: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, u.r + 50).length >= 2 ? 0.75 : 0),
    use(w, u, t, tier) {
      // round 9: she spins round with the sword out (render.js u.spin), the blade's circle trailing it
      const spin = () => { setAnim(u, 'spin', 0.36); u.spin = { t0: w.time, dur: 0.36, dir: 1 }; fx(w, { type: 'ring', x: u.x, y: u.y, r: u.r + (tier >= 2 ? 70 : 50), color: '#FFFFFF', max: 0.36, a: u.facing, unit: u });
        for (const e of foesNear(w, u, u.x, u.y, u.r + (tier >= 2 ? 70 : 50))) hurt(w, e, dmgOf(u, 1.3), u, { knock: tier >= 2 ? 220 : 90, kAngle: ang(u, e) }); };
      spin(); if (tier >= 3) u.later = [{ t: 0.35, f: spin }];
    },
  },
  // ----- Berserker
  shockwave: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.75 : 0),
    use(w, u, t, tier) {
      const a = ang(u, t), n = tier >= 2 ? 5 : 3; u.facing = a; cast(u, 'ability', 0.4); w.shake = Math.max(w.shake, 5);
      u.later = [];
      for (let i = 0; i < n; i++) u.later.push({ t: 0.18 * i + 0.1, f: () => {
        const x = u.x + Math.cos(a) * (60 + i * 55), y = u.y + Math.sin(a) * (60 + i * 55);
        fx(w, { type: 'wave', x, y, a, r: 50, max: 0.35 });
        for (const e of foesNear(w, u, x, y, 50)) hurt(w, e, dmgOf(u, 0.8), u, { knock: 160, kAngle: a, noDodge: true, stagger: tier >= 3 ? 35 : 0 });
      } });
    },
  },
  whirl: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, 120).length; return n >= 2 ? 0.85 : n ? 0.4 : 0; },
    use(w, u, t, tier) {
      addBuff(u, { id: 'whirl', dur: tier >= 2 ? 5 : 3, move: 0.85, spinning: true, glow: '#FFFFFF' });
      u.spinHit = 0; u.spinPull = tier >= 3;
    },
  },
  unstoppable: {
    score: (w, u) => ((u.st.chill + u.st.poison + u.st.burn + (u.st.stagger || 0)) > 40 || u.rootT > 0 || (hpRatio(u) < 0.4 && foesNear(w, u, u.x, u.y, 120).length >= 2) ? 0.95 : 0),
    use(w, u, t, tier) {
      cleanse(u); cast(u, 'ability', 0.4);
      addBuff(u, { id: 'unstoppable', dur: tier >= 2 ? 4 : 2, statusImmune: true, knockImmune: true, glow: '#FFE7A0' });
      if (tier >= 3) heal(w, u, u.maxHp * 0.2, u);
      puff(w, u.x, u.y, '#FFE7A0', 14, 110, 6, 0.5);
    },
  },
  // ----- Granny Reaper
  reap: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, u.r + 60).length; return n >= 2 ? 0.9 : n ? 0.5 : 0; },
    use(w, u, t, tier) {
      // round 9: a spin, a little slower; a red orb pops off each one hit and flies home to her
      const r = u.r + (tier >= 2 ? 85 : 60); setAnim(u, 'spin', 0.5); u.spin = { t0: w.time, dur: 0.5, dir: 1 };
      fx(w, { type: 'ring', x: u.x, y: u.y, r, color: '#E8E2D0', max: 0.5, a: u.facing, unit: u });
      let n = 0; for (const e of foesNear(w, u, u.x, u.y, r)) { hurt(w, e, dmgOf(u, 1.4), u, { knock: 120, kAngle: ang(u, e) }); fx(w, { type: 'soulOrb', x: e.x, y: e.y, to: u, delay: 0.12 + n * 0.06, max: 1.1 }); n++; }
      if (tier >= 3 && n) heal(w, u, u.maxHp * 0.05 * n, u);
    },
  },
  hook: {
    score(w, u, t) { const far = opponents(w, u).filter((e) => { const d = dist(u.x, u.y, e.x, e.y); return d > 150 && d < 330 && !blocked(w, u.x, u.y, e.x, e.y); }); return far.length ? 0.55 : 0; },
    use(w, u, t, tier) {
      const far = opponents(w, u).filter((e) => { const d = dist(u.x, u.y, e.x, e.y); return d > 150 && d < 330 && !blocked(w, u.x, u.y, e.x, e.y); })
        .sort((a, b) => (b.def.role === 'ranged' ? 1 : 0) - (a.def.role === 'ranged' ? 1 : 0)).slice(0, tier >= 3 ? 2 : 1);
      cast(u, 'throw', 0.5);
      // round 9: the hook flies out slower (it bites at 0.3s), pulls much harder and always staggers (harder from II)
      for (const e of far) fx(w, { type: 'beam', x1: u.x, y1: u.y, x2: e.x, y2: e.y, kind: 'drain', max: 0.85, hookTo: e, hookFrom: u });
      u.later = [{ t: 0.3, f: () => { for (const e of far) { if (!alive(e)) continue;
        const a = angleTo(e.x, e.y, u.x, u.y), d = dist(u.x, u.y, e.x, e.y) - u.r - e.r - 6;
        e.kx += Math.cos(a) * d * 5.4 / Math.max(1, Math.sqrt(e.mass)); e.ky += Math.sin(a) * d * 5.4 / Math.max(1, Math.sqrt(e.mass));
        hurt(w, e, dmgOf(u, 0.5), u, { noDodge: true, stagger: tier >= 2 ? 70 : 40 });
      } } }];
    },
  },
  oldBones: { passiveTier: true }, // works through the 'oldBones' hook below
  // ----- Pyromancer
  fireball: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range + 40 && !blocked(w, u.x, u.y, t.x, t.y) ? 0.3 + 0.3 * foesNear(w, u, t.x, t.y, 90).length : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.75); // round 9: a short charge up (the fire gathering in her hands: fxkit), then the throw
      u.later = [{ t: 0.4, f: () => shoot(w, u, t && alive(t) ? ang(u, t) : u.facing, { kind: 'fireball', speed: 300, r: 10, dmg: dmgOf(u, 1.2), st: { burn: 25 }, land: (p) => {
        explode(w, p.x, p.y, tier >= 3 ? 110 : 80, dmgOf(u, 1.6), { burn: 35 }, u, '#FF8A3D');
        if (tier >= 2) zone(w, { x: p.x, y: p.y, r: 55, dur: 4, kind: 'fire', src: u, every: 0.3, tick(z) { for (const e of foesNear(w, u, z.x, z.y, z.r)) addStatus(w, e, 'burn', 12, u); } });
      } }) }];
    },
  },
  flameWall: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && foesNear(w, u, t.x, t.y, 120).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const a = ang(u, t) + Math.PI / 2, L = tier >= 2 ? 150 : 100, dur = tier >= 2 ? 6 : 4;
      const x1 = t.x + Math.cos(a) * L, y1 = t.y + Math.sin(a) * L, x2 = t.x - Math.cos(a) * L, y2 = t.y - Math.sin(a) * L;
      fx(w, { type: 'wall', x1, y1, x2, y2, kind: 'fire', max: dur });
      zone(w, { x: t.x, y: t.y, r: L, dur, src: u, every: 0.25, line: [x1, y1, x2, y2], tick(z) {
        for (const e of opponents(w, u)) if (segDist(e.x, e.y, x1, y1, x2, y2) < e.r + 14) addStatus(w, e, 'burn', 14, u);
        if (tier >= 3) for (const h of w.hazards) if (h.type === 'oil' && segDist(h.x, h.y, x1, y1, x2, y2) < h.r + 60) { h.type = 'fire'; h.t = 5; h.max = 5; }
      } });
    },
  },
  inferno: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, 120).length; return n >= 2 ? 0.9 : n ? 0.55 : 0; },
    use(w, u, t, tier) {
      cast(u, 'ability', 0.5);
      ring(w, u, u.x, u.y, 140, dmgOf(u, 1.5), { burn: 45, knock: tier >= 2 ? 260 : 60 }, '#FF8A3D');
      if (tier >= 3) addBuff(u, { id: 'fireproof', dur: 6, immune: ['burn'] });
    },
  },
  // ----- Frost mage
  iceShard: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range + 30 && !blocked(w, u.x, u.y, t.x, t.y) ? 0.45 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4);
      const n = tier >= 3 ? 3 : 1, a0 = ang(u, t);
      for (let i = 0; i < n; i++) { const mid = n === 1 || i === 1; // round 9: the middle spike is bigger and hits harder
        shoot(w, u, a0 + (i - (n - 1) / 2) * 0.18, { kind: 'shard', speed: 620, r: mid ? 8 : 6, dmg: dmgOf(u, mid ? 1.7 : 1.3), st: { chill: tier >= 2 ? 55 : 35 }, pierce: 4, extra: { big: mid && n > 1 } }); }
    },
  },
  frostNova: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, 110).length; return n >= 2 ? 0.9 : n ? 0.6 : 0; },
    use(w, u, t, tier) {
      // round 9: a charge up (cold drawn into her: fxkit), the burst, and snow and a cold rime that linger
      cast(u, 'ability', 0.8);
      const r = tier >= 2 ? 150 : 110;
      u.later = [{ t: 0.35, f: () => {
        fx(w, { type: 'ring', x: u.x, y: u.y, r, color: '#BFEFFF', max: 0.5 });
        fx(w, { type: 'zone', kind: 'snow', x: u.x, y: u.y, r: r * 0.9, max: 2.6 });
        for (const e of foesNear(w, u, u.x, u.y, r)) { addStatus(w, e, 'chill', 140, u); if (tier >= 3) e.frozenBonus = 2; }
      } }];
    },
  },
  iceWall: {
    score: (w, u, t) => (t && foesNear(w, u, u.x, u.y, 200).length >= 2 && dist(u.x, u.y, t.x, t.y) > 80 ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const a = ang(u, t), d = Math.min(110, dist(u.x, u.y, t.x, t.y) * 0.5), cx = u.x + Math.cos(a) * d, cy = u.y + Math.sin(a) * d;
      const L = tier >= 2 ? 200 : 130, dur = tier >= 2 ? 8 : 5;
      // walls are axis-aligned: lay it across the way the enemies come, rounded to the nearer axis
      const horiz = Math.abs(Math.cos(a)) < Math.abs(Math.sin(a));
      const rect = horiz ? { x: cx - L / 2, y: cy - 14, w: L, h: 28 } : { x: cx - 14, y: cy - L / 2, w: 28, h: L };
      const wl = wallRect(w, rect, dur, 'ice'); wl.fromX = u.x; wl.fromY = u.y; // the chunks fly out from her (fxkit drawIceWall)
      // III: chills what touches it (round 9: it used to reach far past the wall)
      if (tier >= 3) zone(w, { x: cx, y: cy, r: L / 2 + 30, dur, src: u, every: 0.3, tick() { for (const e of opponents(w, u)) if (rectGap(e, rect) < e.r + 10) addStatus(w, e, 'chill', 12, u); } });
    },
  },
  // ----- Storm mage
  chainLightning: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && !blocked(w, u.x, u.y, t.x, t.y) ? 0.3 + 0.2 * foesNear(w, u, t.x, t.y, 160).length : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4);
      const jumps = tier >= 2 ? 5 : 3; let cur = t, prev = u; const hit = new Set();
      for (let i = 0; i <= jumps && cur; i++) {
        fx(w, { type: 'beam', x1: prev.x, y1: prev.y, x2: cur.x, y2: cur.y, kind: 'lightning', max: 0.3 });
        hurt(w, cur, dmgOf(u, 1.1), u, { noDodge: true, shock: 40 }); hit.add(cur);
        prev = cur;
        const next = opponents(w, u).filter((e) => e !== cur && (tier >= 3 || !hit.has(e)) && dist(cur.x, cur.y, e.x, e.y) < 170).sort((a, b) => dist(cur.x, cur.y, a.x, a.y) - dist(cur.x, cur.y, b.x, b.y))[0];
        cur = next;
      }
    },
  },
  thunderclap: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 280 && foesNear(w, u, t.x, t.y, 90).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.45);
      fx(w, { type: 'pillar', x: t.x, y: t.y, r: 30, kind: 'lightning', max: 0.35 });
      ring(w, u, t.x, t.y, tier >= 2 ? 120 : 85, dmgOf(u, 1.2), { stagger: 55, shock: tier >= 3 ? 50 : 0, knock: 120 }, '#FFF27A');
      w.shake = Math.max(w.shake, 5);
    },
  },
  // Zeus Bolt (round 9, the designer: Storm Cloud "reworked ... 3 charges of a Zeus bolt projectile, which will mark
  // targets. The main attack will bounce between anyone who has been marked dealing heavy shock to them. Mark will go
  // away after it's been used once."). The id stays 'stormCloud' so bought nodes in saves keep working.
  stormCloud: {
    score(w, u, t) {
      if (!t || dist(u.x, u.y, t.x, t.y) > u.def.range + 40 || blocked(w, u.x, u.y, t.x, t.y)) return 0;
      const fresh = opponents(w, u).filter((e) => !(e.stormMark > w.time) && dist(u.x, u.y, e.x, e.y) < u.def.range + 40).length;
      return fresh >= 2 ? 0.7 : fresh ? 0.4 : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.6);
      const near = opponents(w, u).filter((e) => dist(u.x, u.y, e.x, e.y) < u.def.range + 60 && !blocked(w, u.x, u.y, e.x, e.y))
        .sort((a, b) => (a.stormMark > w.time ? 1 : 0) - (b.stormMark > w.time ? 1 : 0) || dist(t.x, t.y, a.x, a.y) - dist(t.x, t.y, b.x, b.y)).slice(0, 3);
      if (!near.length) near.push(t);
      u.later = [0, 1, 2].map((i) => ({ t: 0.08 + i * 0.17, f: () => {
        const e = alive(near[i % near.length]) ? near[i % near.length] : t; if (!alive(e)) return;
        shoot(w, u, ang(u, e), { kind: 'zeus', speed: 640, r: 9, life: 1, dmg: dmgOf(u, tier >= 2 ? 1.1 : 0.75), st: { shock: 20 }, knock: 60,
          extra: { onHit: (w2, p, x) => { x.stormMark = w2.time + (tier >= 3 ? 10 : 6); x.stormMarkHeavy = tier >= 3; } } });
      } }));
    },
  },
  // ----- Cleric
  // Mending Ray: a held ray of light to the most hurt ally (never herself) that heals over 4s. She keeps her feet
  // while it holds (she can back off) but doesn't attack; it breaks if they get too far apart or a wall comes between.
  mend: {
    score(w, u) {
      if (u.rays && u.rays.length) return 0;
      const a = hurtMost(allies(w, u).filter((o) => !o.summon && rayable(w, u, o)));
      return a && hpRatio(a) < 0.8 ? 1.15 - hpRatio(a) : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4);
      const list = allies(w, u).filter((o) => !o.summon && rayable(w, u, o)).sort((a, b) => hpRatio(a) - hpRatio(b)).slice(0, tier >= 3 ? 2 : 1);
      const pct = tier >= 2 ? 0.26 : 0.17;
      u.rays = list.map((a) => ({ to: a, t: RAY_T, rate: a.maxHp * pct / RAY_T, f: fx(w, { type: 'beam', kind: 'heal', from: u, to: a, x1: u.x, y1: u.y, x2: a.x, y2: a.y, max: RAY_T }) }));
    },
  },
  sanctuary: {
    score(w, u) { const fs = friendsNear(w, u, u.x, u.y, 160); return fs.some((a) => hpRatio(a) < 0.75) && foesNear(w, u, u.x, u.y, 260).length ? 0.75 : 0; },
    use(w, u, t, tier) {
      cast(u, 'ability', 0.5);
      const r = tier >= 2 ? 185 : 145; // round 9: the radius was too small
      zone(w, { x: u.x, y: u.y, r, dur: tier >= 2 ? 7 : 5, kind: 'sanctuary', src: u, every: 0.5, ward: tier >= 3, tick(z) {
        for (const a of [u, ...allies(w, u)]) if (dist(a.x, a.y, z.x, z.y) < z.r) { heal(w, a, a.maxHp * 0.025, u); a.mendGlow = w.time + 0.6; }
      } });
    },
  },
  smite: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && !blocked(w, u.x, u.y, t.x, t.y) ? 0.35 + (isUndead(t) ? 0.3 : 0) : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.45);
      fx(w, { type: 'pillar', x: t.x, y: t.y, r: 30, kind: 'holy', max: 0.45 });
      hurt(w, t, dmgOf(u, tier >= 2 ? 3.4 : 2.4) * (tier >= 3 && isUndead(t) ? 3 : 1), u, { noDodge: true, stagger: 50, radiance: 35, omni: true });
    },
  },
  // ----- Bard
  warSong: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 320).length >= 2 && friendsNear(w, u, u.x, u.y, 220).length >= 1 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.6);
      for (const a of [u, ...friendsNear(w, u, u.x, u.y, 220)]) { addBuff(a, { id: 'warSong', dur: 6, atkSpeed: tier >= 2 ? 1.4 : 1.25, move: tier >= 3 ? 1.2 : 1, glow: '#FFD27A' }); puff(w, a.x, a.y, '#FFD27A', 6, 70, 4, 0.5); }
    },
  },
  lullaby: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 170).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.6);
      const arc = tier >= 3 ? 2.4 : 1.6, a = t ? ang(u, t) : u.facing;
      fx(w, { type: 'wave', x: u.x, y: u.y, a, r: 180, arc, max: 0.6, kind: 'note' });
      const hit = foesNear(w, u, u.x, u.y, 190).filter((e) => angleDiff(ang(u, e), a) < arc / 2);
      for (const e of hit) addBuff(e, { id: 'lullaby', dur: 4, move: 0.55, atkSpeed: 0.7 });
      if (tier >= 3) { for (const e of hit) if (!e.def.boss) e.sleepT = 3; } // round 9: everyone it reaches, at III
      else if (tier >= 2) { const weak = hit.sort((p, q) => p.hp - q.hp)[0]; if (weak && !weak.def.boss) weak.sleepT = 3; }
    },
  },
  encore: {
    score(w, u) { const a = allies(w, u).filter((o) => o.kit && Object.values(o.kit.cd).some((c) => c > 4)); return a.length && foesNear(w, u, u.x, u.y, 320).length ? 0.6 : 0; },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const list = allies(w, u).filter((o) => o.kit).sort((p, q) => maxCd(q) - maxCd(p)).slice(0, tier >= 3 ? 2 : 1);
      for (const a of list) { const k = Object.keys(a.kit.cd).sort((p, q) => a.kit.cd[q] - a.kit.cd[p])[0]; if (k) a.kit.cd[k] = 0; if (tier >= 2) heal(w, a, a.maxHp * 0.1, u);
        fx(w, { type: 'beam', x1: u.x, y1: u.y, x2: a.x, y2: a.y, kind: 'holy', max: 0.4 }); }
    },
  },
  // ----- Druid
  entangle: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && foesNear(w, u, t.x, t.y, 80).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const r = tier >= 2 ? 110 : 75;
      zone(w, { x: t.x, y: t.y, r, dur: 1.6, kind: 'vines', src: u, every: 0.3, tick(z) { for (const e of foesNear(w, u, z.x, z.y, z.r)) { e.rootT = Math.max(e.rootT || 0, 0.4); if (tier >= 3) addStatus(w, e, 'poison', 8, u); } } });
    },
  },
  rejuvenate: {
    score: (w, u) => { const a = hurtMost([u, ...allies(w, u)].filter((o) => !o.regenT)); return a && hpRatio(a) < 0.75 ? 0.9 - hpRatio(a) * 0.6 : 0; },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4);
      const list = [u, ...allies(w, u)].filter((o) => !o.summon).sort((a, b) => hpRatio(a) - hpRatio(b)).slice(0, tier >= 3 ? 2 : 1);
      for (const a of list) { a.regenT = 6; a.regenRate = a.maxHp * (tier >= 2 ? 0.24 : 0.16) / 6; a.regenSrc = u; a.regenAb = u.kit && u.kit.using; fx(w, { type: 'zone', x: a.x, y: a.y, r: 26, kind: 'heal', max: 0.6 }); }
    },
  },
  callWolf: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 350).length >= 2 && !w.units.some((o) => o.summonBy === u && alive(o)) ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.8);
      // round 9: a summoning ring on the ground first, then the wolf steps out of it (not instant)
      const spots = []; for (let i = 0; i < (tier >= 3 ? 2 : 1); i++) { const a = u.facing + (i ? -1 : 1) * 0.9; spots.push({ x: clamp(u.x + Math.cos(a) * 60, 30, w.W - 30), y: clamp(u.y + Math.sin(a) * 60, 30, w.H - 30) }); }
      for (const p of spots) fx(w, { type: 'zone', kind: 'summon', x: p.x, y: p.y, r: 34, max: 1.1 });
      u.later = [{ t: 0.7, f: () => { for (const p of spots) {
        const s = spawn(w, 'wolf', p.x, p.y, { team: u.team, scale: tier >= 2 ? 1.25 : 1, hpMul: tier >= 2 ? 1.5 : 1 });
        s.summon = true; s.summonBy = u; s.lifeT = 15; s.aggro = true; s.dmgMul = u.dmgMul * (tier >= 2 ? 1.1 : 0.9);
      } } }];
    },
  },
  // ----- Necromancer
  raiseDead: {
    score: (w, u) => (w.corpses.length && foesNear(w, u, u.x, u.y, 380).length && w.units.filter((o) => o.summonBy === u && alive(o)).length < 7 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.6);
      const cs = w.corpses.filter((c) => c.z <= 0 && dist(u.x, u.y, c.x, c.y) < 400).slice(0, tier >= 2 ? 2 : 1);
      w.corpses = w.corpses.filter((c) => !cs.includes(c)); // the body gets up: it no longer lies there
      const spots = cs.length ? cs : [{ x: u.x + rrange(-40, 40), y: u.y + rrange(-40, 40) }];
      // round 9: each body is worth three small, weak, jawless minions that punch (units.js 'minion'), in a cold grey
      for (const c of spots) {
        for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5;
          const s = spawn(w, 'minion', c.x + Math.cos(a) * 18, c.y + Math.sin(a) * 18, { team: u.team });
          s.summon = true; s.summonBy = u; s.lifeT = 12; s.aggro = true; s.dmgMul = u.dmgMul; s.boom = tier >= 3; s.facing = a; }
        fx(w, { type: 'pillar', x: c.x, y: c.y, r: 24, kind: 'drain', max: 0.5 }); puff(w, c.x, c.y, '#B8C0C8', 12, 70, 6, 0.6);
      }
    },
  },
  lifeDrain: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 230 && !blocked(w, u.x, u.y, t.x, t.y) ? (hpRatio(u) < 0.85 ? 0.7 : 0.45) : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 3);
      const rays = new Map();
      // one ray held for the whole channel (round 9: "less blinky"), drawn over the target and under him (render.js)
      const hold = (from, to, thin) => { let f = rays.get(to); if (!f || f.t >= f.max) { f = fx(w, { type: 'beam', kind: 'drain', from, to, x1: from.x, y1: from.y, x2: to.x, y2: to.y, max: 0.4, over: thin ? null : u, thin }); rays.set(to, f); } else f.max = f.t + 0.4; };
      u.act = { type: 'channel', t: 3, max: 3, target: t, every: 0.25, acc: 0, tick: () => {
        if (!alive(t) || dist(u.x, u.y, t.x, t.y) > 280) { u.act = null; return; }
        hold(u, t, false);
        const got = hurt(w, t, dmgOf(u, tier >= 3 ? 0.55 : 0.4), u, { dot: true, color: '#9BE07A' });
        heal(w, u, got * 0.6, u); // (round 11: 60% of what it takes, not all of it; friends 30%, not 50%)
        if (tier >= 2) for (const a of friendsNear(w, u, u.x, u.y, 140)) heal(w, a, got * 0.3, u);
        // three thinner tendrils bounce off the target onto those round it, each a quarter as strong
        for (const e of opponents(w, u).filter((o) => o !== t && dist(o.x, o.y, t.x, t.y) < 150).slice(0, 3)) {
          hold(t, e, true); const g2 = hurt(w, e, dmgOf(u, tier >= 3 ? 0.55 : 0.4) / 4, u, { dot: true, color: '#9BE07A' }); heal(w, u, g2, u);
        }
      } };
    },
  },
  boneSpear: {
    score(w, u, t) { if (!t || blocked(w, u.x, u.y, t.x, t.y)) return 0; const a = ang(u, t); return 0.3 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.25 && dist(u.x, u.y, e.x, e.y) < 360).length; },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.4);
      shoot(w, u, ang(u, t), { kind: 'bone', speed: 640, r: tier >= 3 ? 12 : 8, life: tier >= 3 ? 0.9 : 0.65, dmg: dmgOf(u, 2), pierce: 8, knock: tier >= 2 ? 220 : 40 });
    },
  },
  // ----- Plague doctor
  miasma: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && foesNear(w, u, t.x, t.y, 90).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'throw', 0.4);
      shoot(w, u, ang(u, t), { kind: 'vial', speed: 380, dmg: dmgOf(u, 0.5), color: '#82B23A', land: (p) => { // the gas puddle's green (round 9)
        const r = tier >= 2 ? 95 : 70;
        zone(w, { x: p.x, y: p.y, r, dur: 5, kind: 'poison', src: u, every: 0.3, tick(z) { for (const e of foesNear(w, u, z.x, z.y, z.r)) { addStatus(w, e, 'poison', 9, u); if (tier >= 3) addBuff(e, { id: 'weakened', dur: 0.6, dealt: 0.7 }); } } });
      } });
    },
  },
  cure: {
    score(w, u) { const a = [u, ...allies(w, u)].find((o) => (o.st.poison + o.st.burn + o.st.chill + (o.st.wet || 0)) > 50 || o.stunT > 0 || o.rootT > 0); return a ? 0.85 : 0; },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4);
      const all = [u, ...allies(w, u)];
      const list = tier >= 3 ? all.filter((o) => dist(u.x, u.y, o.x, o.y) < 200) : [all.sort((a, b) => (b.st.poison + b.st.burn + b.st.chill) - (a.st.poison + a.st.burn + a.st.chill))[0]];
      // round 9: what is drawn out goes into his flask, and his next attack throws all of it at the enemy, as strong
      const got = u.kit.cured || (u.kit.cured = {});
      for (const a of list) {
        const cols = [];
        for (const s2 of CURE_STATUSES) if ((a.st[s2] || 0) > 1) { got[s2] = (got[s2] || 0) + a.st[s2]; cols.push(STATUS[s2] ? STATUS[s2].col : '#FFFFFF'); }
        cleanse(a); heal(w, a, a.maxHp * (tier >= 2 ? 0.2 : 0.1), u);
        fx(w, { type: 'cure', from: u, to: a, x1: u.x, y1: u.y, x2: a.x, y2: a.y, cols, max: 1.1 });
      }
    },
  },
  // Gas Form (round 9, the designer: Leeches "rework. Maybe turn into a gas cloud dash off in a direction and become
  // the doctor again"). The id stays 'leeches' for saves. He can't be hurt while he's gas; the gas he leaves poisons.
  leeches: {
    score(w, u, t) { const close = foesNear(w, u, u.x, u.y, 90).length; return close ? 0.85 : 0; },
    use(w, u, t, tier) {
      const f = foesNear(w, u, u.x, u.y, 140); let ax = 0, ay = 0; for (const e of f) { ax += u.x - e.x; ay += u.y - e.y; }
      const a = f.length ? Math.atan2(ay, ax) + rrange(-0.4, 0.4) : u.facing + Math.PI;
      u.gasT = 0.62; u.invulnT = Math.max(u.invulnT, 0.65);
      u.act = { type: 'dash', t: 0.6, max: 0.6, a, gas: true };
      u.gasForm = { tier, lx: u.x, ly: u.y, heal: tier >= 3 };
      drop(w, u, tier);
    },
  },
};
ABILITIES.oldBones = { score: () => 0, use() {} };
Object.assign(ABILITIES, ABILITIES2); // round 10 (lane H): the new heroes' abilities
const RAY_T = 4, RAY_RANGE = 380;
const CURE_STATUSES = ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger', 'radiance', 'curse'];
// how far a unit is from the edge of a rectangle (0 inside)
const rectGap = (o, r) => Math.hypot(Math.max(r.x - o.x, 0, o.x - r.x - r.w), Math.max(r.y - o.y, 0, o.y - r.y - r.h));
// Gas Form's trail: a body of poison gas left where he drifts (puddles.js merges them into one cloud)
function drop(w, u, tier) {
  zone(w, { x: u.x, y: u.y, r: 38, dur: tier >= 2 ? 4 : 3, kind: 'poison', src: u, every: 0.3, tick(z) { for (const e of foesNear(w, u, z.x, z.y, z.r)) addStatus(w, e, 'poison', tier >= 2 ? 14 : 8, u); } });
}

// ---------------------------------------------------------------- the heroes' own attacks (round 9)
// The designer's showcase notes gave the casters attacks of their own. heroAttack is called by sim.js tryAttack for a
// hero with a kit, instead of the plain shot; true = it attacked.
const A = (u, k) => dmgOf(u, k);
const ATTACKS = {
  // a fire spark: a little burn, and a small burst where it lands
  pyromancer(w, u, t, a) {
    shoot(w, u, a, { kind: 'spark', speed: 470, r: 6, dmg: A(u, 0.75), st: { burn: 10 }, knock: 30,
      land: (p) => { for (const e of opponents(w, u)) if (dist(p.x, p.y, e.x, e.y) < 34 + e.r) { hurt(w, e, A(u, 0.3), u, { noDodge: true, burn: 6, kAngle: angleTo(p.x, p.y, e.x, e.y), knock: 40 }); } fx(w, { type: 'pop', kind: 'fire', x: p.x, y: p.y, r: 34, max: 0.35 }); } });
  },
  // a snow bolt: a little chill, and two or three shards burst out the far side of what it hits (like a shatter's)
  frost(w, u, t, a) {
    shoot(w, u, a, { kind: 'frostbolt', speed: 440, r: 6, dmg: A(u, 0.85), st: { chill: 10 }, knock: 30,
      extra: { onHit: (w2, p, e) => { const n = 2 + (rand() < 0.5 ? 1 : 0);
        for (let i = 0; i < n; i++) { const b = a + (i - (n - 1) / 2) * 0.45; w2.projectiles.push({ kind: 'icicle', x: e.x + Math.cos(b) * e.r, y: e.y + Math.sin(b) * e.r, vx: Math.cos(b) * 330, vy: Math.sin(b) * 330, r: 5, team: u.team, owner: u, skip: e, dmg: A(u, 0.3), o: { chill: 8, knock: 20 }, life: 0.35 }); } } } });
  },
  // a chain of lightning from her to the target (no bolt), then on to every marked enemy (Zeus Bolt), shocking them hard
  storm(w, u, t) {
    let prev = u; const done = new Set();
    const hit = (e, marked) => { fx(w, { type: 'beam', kind: 'lightning', x1: prev.x, y1: prev.y, x2: e.x, y2: e.y, max: marked ? 0.3 : 0.2, small: !marked });
      hurt(w, e, A(u, marked ? 0.9 : 1), u, { noDodge: true, shock: marked ? (e.stormMarkHeavy ? 60 : 45) : 8 }); done.add(e); prev = e; };
    const m0 = t.stormMark > w.time; if (m0) t.stormMark = 0; hit(t, m0);
    for (;;) { const nx = opponents(w, u).filter((e) => !done.has(e) && e.stormMark > w.time && dist(prev.x, prev.y, e.x, e.y) < 320).sort((p, q) => dist(prev.x, prev.y, p.x, p.y) - dist(prev.x, prev.y, q.x, q.y))[0];
      if (!nx) break; nx.stormMark = 0; hit(nx, true); }
    u.recoilT = 0.1;
  },
  // three small slow orbs, one after another with a little spread, each homing a little; all three on one target: radiance
  cleric(w, u, t, a) {
    const volley = new Map();
    u.later = [0, 1, 2].map((i) => ({ t: i * 0.13, f: () => {
      const aim = t && alive(t) ? ang(u, t) : a;
      shoot(w, u, aim + (i - 1) * 0.22, { kind: 'orb', speed: 210, r: 5, life: 2, dmg: A(u, 0.34), knock: 10, color: '#FFF1B0',
        extra: { home: t, turn: 2.4, onHit: (w2, p, e) => { const n = (volley.get(e) || 0) + 1; volley.set(e, n); if (n === 3) addStatus(w2, e, 'radiance', 25, u); } } });
    } }));
  },
  // four notes in a spread, slower, all of them going through
  bard(w, u, t, a) {
    for (let i = 0; i < 4; i++) shoot(w, u, a + (i - 1.5) * 0.26, { kind: 'note', speed: 250, r: 7, life: 1.3, dmg: A(u, 0.5), pierce: 3, knock: 20 });
  },
  // a thorn that entangles a little
  druid(w, u, t, a) {
    shoot(w, u, a, { kind: 'thorn', speed: 520, dmg: A(u, 1), knock: 30, extra: { onHit: (w2, p, e) => { if (STATUS.entangle) addStatus(w2, e, 'entangle', 12, u); else addBuff(e, { id: 'thorned', dur: 1.2, move: 0.75 }); } } });
  },
  // the green flame from his hand, round a bone: a little curse; it shrinks and speeds up, stronger the closer it hits
  necromancer(w, u, t, a) {
    shoot(w, u, a, { kind: 'bone', speed: 230, r: 9, life: 1.5, dmg: A(u, 1.35), st: { curse: 8 }, knock: 30, extra: { accel: 1.3, grow: -3.5, fall: 0.9, necro: true } });
  },
  // a bubbling cluster of poison: starts small and fast, grows and slows, pops in a small cloud of poison where it ends;
  // after a Cure it carries what Cure drew out, as strong
  plague(w, u, t, a) {
    const cured = u.kit.cured; u.kit.cured = null;
    const st = { poison: 8 }; if (cured) for (const k in cured) st[k] = (st[k] || 0) + cured[k];
    shoot(w, u, a, { kind: 'cluster', speed: 470, r: 4, life: 0.8, dmg: A(u, 0.9), st, knock: 20, extra: { drag: 1.6, grow: 10, cured: cured ? Object.keys(cured) : null },
      land: (p) => { const r = 24 + p.r * 1.8; for (const e of opponents(w, u)) if (dist(p.x, p.y, e.x, e.y) < r + e.r) hurt(w, e, A(u, 0.35), u, { noDodge: true, poison: 6, kAngle: angleTo(p.x, p.y, e.x, e.y), knock: 30 });
        fx(w, { type: 'pop', kind: 'poison', x: p.x, y: p.y, r, max: 0.4 }); } });
  },
};
Object.assign(ATTACKS, ATTACKS2);
export const hasOwnAttack = (kind) => !!ATTACKS[kind]; // numbers.js measures these
export function heroAttack(w, u, t, a) {
  const f = ATTACKS[u.kind]; if (!f || u.summon) return false;
  f(w, u, t, a); return true;
}
const rayable = (w, u, o) => dist(u.x, u.y, o.x, o.y) < RAY_RANGE - 40 && !blocked(w, u.x, u.y, o.x, o.y);

// Every step, for a unit with a kit: abilities that last (the Cleric's rays).
export function kitTick(w, u, dt) {
  kit2Tick(w, u, dt);
  if (u.gasForm) { const g = u.gasForm;
    if (u.gasT > 0) { if (dist(u.x, u.y, g.lx, g.ly) > 34) { g.lx = u.x; g.ly = u.y; drop(w, u, g.tier); } }
    else { if (g.heal) heal(w, u, u.maxHp * 0.15, u); u.gasForm = null; puff(w, u.x, u.y, '#BCE070', 10, 80, 6, 0.5); } }
  if (!u.rays) return;
  for (const r of u.rays) {
    r.t -= dt;
    const ok = r.t > 0 && alive(r.to) && alive(u) && u.stunT <= 0 && u.frozenT <= 0 && dist(u.x, u.y, r.to.x, r.to.y) < RAY_RANGE && lineClear(w, u.x, u.y, r.to.x, r.to.y, 2);
    if (!ok) { r.t = 0; r.f.max = Math.min(r.f.max, r.f.t + 0.15); continue; }
    withAb(u, r.ab, heal)(w, r.to, r.rate * dt, u); r.to.mendGlow = w.time + 0.2;
    u.atkT = Math.max(u.atkT, 0.2); // busy holding the ray
  }
  u.rays = u.rays.filter((r) => r.t > 0);
  if (!u.rays.length) u.rays = null;
}
const maxCd = (o) => Math.max(0, ...Object.values(o.kit.cd));
export function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / L, 0, 1);
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

// ---------------------------------------------------------------- traits
export const TRAITS = {
  bulwark: { taken(w, u, src, amt, o) { return src && !o.dot && angleDiff(angleTo(u.x, u.y, src.x, src.y), u.facing) < 1.2 ? amt * 0.65 : amt; } },
  unmovable: { knockImmune: true },
  steadyAim: {
    tick(w, u, dt) { u.stillT = u.spd < 8 ? (u.stillT || 0) + dt : 0; if (u.stillT > 1.5 && !u.aimed) { u.aimed = true; puff(w, u.x, u.y, '#FFE7A0', 4, 30, 3, 0.4); } },
    dealt(w, u, t, amt, o) { if (u.aimed && !o.dot) { u.aimed = false; u.stillT = 0; o.crit = true; return amt * 2; } return amt; },
  },
  opportunist: { dealt(w, u, t, amt, o) { return t.target && t.target !== u ? amt * 1.5 : amt; } },
  bloodied: { dealt(w, u, t, amt) { return amt * (1 + 0.5 * (1 - hpRatio(u))); } },
  momentum: {
    tick(w, u, dt) { if (w.time - (u.lastHitT ?? -9) > 2) u.momentum = 0; },
    hit(w, u) { u.lastHitT = w.time; u.momentum = Math.min(10, (u.momentum || 0) + 1); },
    atkSpeed: (u) => 1 + 0.05 * (u.momentum || 0),
  },
  grim: { hit(w, u, t) { if (alive(t) && !t.def.boss && hpRatio(t) < 0.12) { textU(w, t.x, t.y, t.r + 8, 'REAPED', '#E8E2D0', 1); hurt(w, t, t.hp + 1, u, { noDodge: true, dot: true }); } } },
  kindling: { dealt(w, u, t, amt) { return t.st.burn > 10 ? amt * 1.2 : amt; } },
  coldBlood: { immune: ['chill'] },
  conductor: { shockMul: 2 },
  raiser: { reviveRate: 3, reviveHp: 0.3 },
  rhythm: { tick(w, u, dt) { for (const a of friendsNear(w, u, u.x, u.y, 180)) addBuff(a, { id: 'rhythm', dur: 0.3, move: 1.1 }); } },
  barkskin: { taken(w, u, src, amt) { return u.spd < 8 ? amt * 0.7 : amt; } },
  soulHarvest: { death(w, u) { if (u.kit) for (const k in u.kit.cd) u.kit.cd[k] = Math.max(0, u.kit.cd[k] - 0.8); } },
  immunity: {
    immune: ['poison'],
    tick(w, u, dt) { u.spreadT = (u.spreadT || 0) - dt; if (u.spreadT > 0) return; u.spreadT = 1;
      for (const e of foesNear(w, u, u.x, u.y, 260)) if (e.st.poison > 30) for (const f of foesNear(w, u, e.x, e.y, 90)) if (f !== e && f.st.poison < e.st.poison) addStatus(w, f, 'poison', 10, u); },
  },
};
Object.assign(TRAITS, TRAITS2);
// Granny's Old Bones is an ability on paper but works like a trait once bought.
const OLD_BONES = {
  downed(w, u) {
    const tier = u.kit.tiers.oldBones || 0; if (!tier || u.kit.oldBonesUsed) return false;
    u.kit.oldBonesUsed = true; u.hp = 1 + (tier >= 2 ? u.maxHp * 0.2 : 0); u.invulnT = 1;
    textU(w, u.x, u.y, u.r + 10, 'NOT YET', '#E8E2D0', 1.1);
    if (tier >= 3) { ring(w, u, u.x, u.y, 130, dmgOf(u, 1), { knock: 300, heavy: true }, '#E8E2D0'); w.fx[w.fx.length - 1].ab = 'oldBones'; } // drawn as a quake under the units
    return true;
  },
};

// ---------------------------------------------------------------- per-unit kit
// build: { nodes: { nodeId: rank } } from the save; level: the hero's level (permanent since round 8; it no longer
// switches tiers on: a bought tier works from the start).
export function initKit(u, heroId, build = {}, level = 1) {
  const h = HEROES[heroId]; if (!h) return;
  const nodes = build.nodes || {};
  const mods = statsFor(heroId, nodes);
  u.kit = { hero: heroId, nodes, mods, cd: {}, tiers: {}, trait: TRAITS[h.trait.id] || {}, charges: 2, using: null };
  for (const ab of h.abilities) u.kit.cd[ab.id] = rrange(1, 3);
  u.dmgMul *= 1 + mods.dmg;
  const hpMul = 1 + mods.hp; u.maxHp = Math.round(u.maxHp * hpMul); u.hp = Math.min(u.maxHp, u.hp * hpMul);
  u.atkMul = 1 + mods.atkSpeed; u.moveMul = 1 + mods.moveSpeed;
  if (mods.range) { const r = u.def.range; u.def = { ...u.def, range: r > 60 ? r * (1 + mods.range) : r + 60 * mods.range }; }
  u.armor = (u.armor || 0) + Math.round(mods.armor * 100); // the web's Armour nodes: points (stored as hundredths, like every stat)
  u.kit.statHook = mods.status || Object.values(mods.ab).some((a) => a.abStatus) ? statHook(mods) : null;
  refreshKit(u, level);
}
// Which tier of each ability is on: the highest bought in a row.
export function refreshKit(u, level) {
  if (!u.kit) return;
  for (const ab of HEROES[u.kit.hero].abilities) u.kit.tiers[ab.id] = tierOf(u.kit.nodes, ab.id);
  // kits2.js: an ability that also works all the time once bought (its hook), like Old Bones
  u.kit.extra = HEROES[u.kit.hero].abilities.filter((ab) => u.kit.tiers[ab.id] && ABILITIES[ab.id] && ABILITIES[ab.id].hook).map((ab) => ABILITIES[ab.id].hook);
}
// How long an ability takes to come round: its base, -10% per tier past I, the web's haste and its own cooldown nodes.
export function cooldownOf(u, ab) {
  const k = u.kit, m = k.mods || { haste: 0, ab: {} };
  return ab.cd * (1 - TIER_CD * Math.max(0, (k.tiers[ab.id] || 1) - 1)) * Math.max(0.5, 1 - m.haste - abMod(u, 'abCd', ab.id));
}
// The hook objects active on a unit: its trait, Old Bones if it has it, and its trinkets' hooks.
export function hooksOf(u) {
  const out = [];
  if (u.kit) { out.push(u.kit.trait); if (u.kit.tiers.oldBones) out.push(OLD_BONES); if (u.kit.statHook) out.push(u.kit.statHook); if (u.kit.extra) out.push(...u.kit.extra); }
  if (u.trinketHooks) out.push(...u.trinketHooks);
  return out;
}
// Each think, pick the best ready ability (if any is worth it) and use it.
export function kitThink(w, u) {
  const k = u.kit; if (!k || u.act || u.forcedGoal) return false;
  const h = HEROES[k.hero];
  let best = null, bs = 0;
  for (const ab of h.abilities) {
    const tier = k.tiers[ab.id]; if (!tier || k.cd[ab.id] > 0) continue;
    const A = ABILITIES[ab.id]; if (!A || A.passiveTier) continue;
    const s = A.score(w, u, u.target, tier) * rrange(0.85, 1.15);
    if (s > bs) { bs = s; best = ab; }
  }
  if (!best || bs < 0.3) return false;
  const lastOne = opponents(w, u).length === 1;
  if (!chance(clamp(0.25 + bs * 0.6, 0, 0.95)) && !lastOne) return false;
  k.cd[best.id] = cooldownOf(u, best);
  const hadLater = u.later, hadRays = u.rays;
  k.using = best.id;
  try { tagAbility(w, u, best.id, k.tiers[best.id], () => ABILITIES[best.id].use(w, u, u.target, k.tiers[best.id])); } finally { k.using = null; } // fxtag.js: each ability drawn in its own look
  // what the ability left to happen later keeps its ability (its damage, heal and status nodes)
  if (u.later && u.later !== hadLater) for (const l of u.later) if (!l.ab) { l.ab = best.id; l.f = withAb(u, best.id, l.f); }
  if (u.rays && u.rays !== hadRays) for (const r of u.rays) if (!r.ab) r.ab = best.id;
  cue('ability', u, best.id);
  return true;
}
