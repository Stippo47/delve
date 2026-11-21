// The new heroes' kits (round 10, lane H): abilities, traits and attacks for the heroes in heroes2.js, in the same
// shape as kits.js (merged into ABILITIES / TRAITS / ATTACKS there). Extra pieces an ability here can have:
//   hook    a hook object (kits.js hooks) that is on while the ability is bought (its tiers read u.kit.tiers)
//   show    how lab.html's showcase stages it: { far, ally, single, hitme, shootme, mob } (lab.js)
// Lasting things an ability starts run on the unit's own timers (u.k2, ticked from kitTick), not new sim acts.
// The looks are in fx2.js: fx of type 'k2' with a `draw` name, shots of the new kinds, and each ability's 'sig'.
import { TAU, clamp, dist, angleTo, angleDiff, rand, rrange } from './util.js';
import { hurt, spawn, alive, opponents, allies, hpRatio, puff, setAnim, explode, blocked, stun, addBuff, fx, cleanse, textU, sparks } from './sim.js';
import { foesNear, friendsNear, hurtMost, dmgOf, ang, ring, cast, heal, addStatus, zone, shoot } from './kits.js';

// ---------------------------------------------------------------- helpers
const k2 = (w, o) => fx(w, { type: 'k2', ...o });                 // a look of our own (fx2.js DRAW[o.draw])
const tierOf = (u, id) => (u.kit && u.kit.tiers[id]) || 0;
const after = (u, t, f) => { u.later = [...(u.later || []).filter((l) => !l.done), { t, f }]; };
// a timer on the unit: tick(dt) every step while it runs, end() once
const timer = (u, id, t, tick, end) => { const k = u.k2 || (u.k2 = []); const old = k.find((x) => x.id === id); if (old) { old.t = t; old.tick = tick; old.end = end; return old; } const n = { id, t, tick, end }; k.push(n); return n; };
const inReach = (u, t, extra = 0) => t && alive(t) && dist(u.x, u.y, t.x, t.y) - u.r - t.r <= (u.def.range || 20) + extra;
const inFront = (u, e, arc) => angleDiff(ang(u, e), u.facing) < arc / 2;
const BUILDS = ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger', 'radiance', 'curse', 'entangle'];
// a melee blow drawn as a weapon arc (fxkit turns the 'swing' telegraph into the weapon's arc; aoe: a slam on the floor)
const swingMark = (w, u, R, arc, aoe) => w.telegraphs.push({ type: 'swing', x: u.x, y: u.y, r: R, a: u.facing, arc, t: 0.16, max: 0.16, color: '#FFFFFF', src: u, aoe });
// break off what an enemy is winding up: its act, and any danger zone it has showing
function interrupt(w, e) {
  if (e.def.boss) return;
  if (e.act && e.act.type !== 'slip') e.act = null;
  for (const z of w.danger) if (z.src === e && z.t > 0) { z.cancelled = true; z.done = true; }
}
const foeWinding = (w, e) => !!(e.act && e.act.type !== 'slip') || w.danger.some((z) => z.src === e && z.t > 0);

// ---------------------------------------------------------------- abilities
export const ABILITIES2 = {
  // ----- Old Guard
  greatSweep: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, u.r + u.def.range + 40).filter((e) => inFront(u, e, 3.2)).length; return n >= 2 ? 0.85 : n ? 0.35 : 0; },
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t);
      cast(u, 'ability', 0.8);
      const R = u.r + u.def.range + 46, arc = 3.4;
      const sweep = (back) => {
        swingMark(w, u, R + 10, arc);
        for (const e of foesNear(w, u, u.x, u.y, R)) if (inFront(u, e, arc + 0.3)) hurt(w, e, dmgOf(u, 1.5), u, { knock: 280, kAngle: ang(u, e) + (back ? -0.5 : 0.5), heavy: true, stagger: tier >= 2 ? 45 : 0 });
        w.shake = Math.max(w.shake, 4);
      };
      k2(w, { draw: 'gather', unit: u, x: u.x, y: u.y, r: 30, max: 0.3, col: '#EEF3F8' });
      after(u, 0.3, () => sweep(false));
      if (tier >= 3) after(u, 0.62, () => { setAnim(u, 'ability', 0.5); sweep(true); });
    },
  },
  rallyCry: {
    score(w, u) {
      const pinned = [u, ...allies(w, u)].filter((a) => !a.summon && (a.stunT > 0.2 || a.rootT > 0.2 || a.koT > 0 || (a.st.stagger || 0) > 40 || a.tangledT > 0));
      if (pinned.length) return 0.95;
      return foesNear(w, u, u.x, u.y, 260).length >= 3 && friendsNear(w, u, u.x, u.y, 230).length ? 0.5 : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'ability', 0.5);
      for (const a of [u, ...friendsNear(w, u, u.x, u.y, 240)]) {
        a.stunT = 0; a.rootT = 0; a.koT = 0; a.tangledT = 0; a.st.stagger = 0;
        addBuff(a, { id: 'rally', dur: 5, knockImmune: true, move: tier >= 2 ? 1.2 : 1, glow: '#F2C14E' });
        if (tier >= 3) heal(w, a, a.maxHp * 0.12, u);
        k2(w, { draw: 'rally', unit: a, x: a.x, y: a.y, r: a.vr, max: 0.9 });
      }
    },
  },
  pommelStrike: {
    score: (w, u, t) => (inReach(u, t, 30) ? (foeWinding(w, t) ? 0.95 : 0.3) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'thrust', 0.3);
      interrupt(w, t);
      hurt(w, t, dmgOf(u, 0.8), u, { knock: tier >= 2 ? 460 : 120, heavy: true, noDodge: true });
      stun(w, t, 1);
      if (tier >= 3) u.kit.pommelMark = t;
      k2(w, { draw: 'bonk', x: t.x, y: t.y, r: t.vr, unit: t, max: 0.45 });
    },
    show: { single: true },
  },
  // ----- Dame
  riposte: {
    score: (w, u) => (opponents(w, u).some((e) => e.target === u && dist(u.x, u.y, e.x, e.y) < u.r + e.r + 70) ? 0.8 : 0),
    use(w, u, t, tier) {
      const dur = tier >= 3 ? 2.6 : 1.6; u.kit.riposteUntil = w.time + dur;
      addBuff(u, { id: 'riposte', dur, raise: true, move: 0.5 });
      k2(w, { draw: 'shieldUp', unit: u, x: u.x, y: u.y, r: u.r, max: dur });
    },
    hook: {
      taken(w, u, src, amt, o) {
        if (o.dot || !src || !(u.kit.riposteUntil > w.time)) return amt;
        const tier = tierOf(u, 'riposte');
        if (tier < 3 && angleDiff(angleTo(u.x, u.y, src.x, src.y), u.facing) > 1.3) return amt;
        if (tier >= 3) u.facing = angleTo(u.x, u.y, src.x, src.y);
        const near = dist(u.x, u.y, src.x, src.y) - u.r - src.r < (u.def.range || 24) + 40;
        if (near && alive(src) && w.time - (u.kit.ripT || -9) > 0.15) {
          u.kit.ripT = w.time; setAnim(u, 'thrust', 0.22);
          hurt(w, src, dmgOf(u, 1), u, { knock: 160, noDodge: true, stagger: tier >= 2 ? 40 : 0, ab: 'riposte' });
          k2(w, { draw: 'parry', x: u.x + Math.cos(u.facing) * (u.r + 6), y: u.y + Math.sin(u.facing) * (u.r + 6), a: u.facing, max: 0.35, ab: 'riposte' });
        }
        u.blockedAt = w.time;
        return amt * 0.2;
      },
    },
    show: { hitme: true },
  },
  challenge: {
    score(w, u) { if (u.kit.duel && u.kit.duel.until > w.time && alive(u.kit.duel.e)) return 0; return foesNear(w, u, u.x, u.y, 300).length ? 0.6 : 0; },
    use(w, u, t, tier) {
      const list = foesNear(w, u, u.x, u.y, 320); if (!list.length) return;
      const e = list.sort((a, b) => b.maxHp - a.maxHp)[0];
      cast(u, 'ability', 0.4);
      e.tauntBy = u; e.tauntT = 6; e.target = u; u.target = e;
      u.kit.duel = { e, until: w.time + 6 };
      k2(w, { draw: 'duel', unit: e, from: u, x: e.x, y: e.y, r: e.vr, max: 6 });
    },
    hook: {
      dealt(w, u, t, amt) { const d = u.kit.duel; return d && d.e === t && d.until > w.time ? amt * 1.3 : amt; },
      taken(w, u, src, amt) { const d = u.kit.duel; return d && d.e === src && d.until > w.time && tierOf(u, 'challenge') >= 2 ? amt * 0.7 : amt; },
      kill(w, u, v) { const d = u.kit.duel; if (d && d.e === v && d.until > w.time && tierOf(u, 'challenge') >= 3) { heal(w, u, u.maxHp * 0.2, u); u.kit.cd.challenge = 0.5; u.kit.duel = null; } },
    },
    show: { single: true },
  },
  disarm: {
    score: (w, u, t) => (inReach(u, t, 40) && !t.buffs.some((b) => b.id === 'disarmed') ? 0.45 + (t.def.boss || t.elite ? 0.3 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'swing', 0.35);
      const list = tier >= 3 ? foesNear(w, u, u.x, u.y, u.r + u.def.range + 60).filter((e) => inFront(u, e, 1.9)) : [t];
      for (const e of list) {
        hurt(w, e, dmgOf(u, 0.5), u, { knock: 60, noDodge: true });
        addBuff(e, { id: 'disarmed', dur: 5, dealt: 0.5, atkSpeed: tier >= 2 ? 0.7 : 1 });
        k2(w, { draw: 'disarm', x: e.x, y: e.y, a: ang(u, e), unit: e, r: e.vr, max: 0.8 });
      }
      swingMark(w, u, u.r + u.def.range + 20, 1.6);
    },
    show: { single: true },
  },
  // ----- Griffon
  swoop: {
    score(w, u) {
      const a = allies(w, u).filter((o) => !o.summon && hpRatio(o) < 0.6 && dist(u.x, u.y, o.x, o.y) > 130 && dist(u.x, u.y, o.x, o.y) < 480 && foesNear(w, u, o.x, o.y, 100).length);
      return a.length ? 0.95 : 0;
    },
    use(w, u, t, tier) {
      const a = hurtMost(allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 520)) || t; if (!a) return;
      const f = foesNear(w, u, a.x, a.y, 140).sort((p, q) => dist(a.x, a.y, p.x, p.y) - dist(a.x, a.y, q.x, q.y))[0];
      const ba = f ? angleTo(a.x, a.y, f.x, f.y) : angleTo(a.x, a.y, u.x, u.y), off = a.r + u.r + 4;
      const x1 = clamp(a.x + Math.cos(ba) * off, u.r, w.W - u.r), y1 = clamp(a.y + Math.sin(ba) * off, u.r, w.H - u.r);
      cast(u, 'ability', 0.8); u.facing = angleTo(u.x, u.y, x1, y1);
      k2(w, { draw: 'wings', unit: u, x: u.x, y: u.y, r: u.r, max: 0.62, flap: true });
      u.act = { type: 'leap', t: 0.6, max: 0.6, x0: u.x, y0: u.y, x1, y1, land: () => {
        w.shake = Math.max(w.shake, 7);
        ring(w, u, u.x, u.y, 120, dmgOf(u, 1.2), { knock: 320, heavy: true, stagger: tier >= 2 ? 45 : 0 }, '#E8D8B0');
        if (tier >= 3 && alive(a) && a !== t) addBuff(a, { id: 'swoopGuard', dur: 3, taken: 0.6, glow: '#FFE7A0' });
        if (f && alive(f)) u.facing = ang(u, f);
      } };
      u.invulnT = Math.max(u.invulnT, 0.5);
    },
    show: { far: true, ally: true, mob: 'ally' },
  },
  hammerThrow: {
    score(w, u, t) {
      if (!t || dist(u.x, u.y, t.x, t.y) > 330 || blocked(w, u.x, u.y, t.x, t.y)) return 0;
      const a = ang(u, t); return 0.3 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.3 && dist(u.x, u.y, e.x, e.y) < 340).length;
    },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.45);
      const a = t ? ang(u, t) : u.facing, st = { shock: tier >= 2 ? 30 : 0, stagger: tier >= 3 ? 40 : 0 }, r = tier >= 3 ? 14 : 10;
      after(u, 0.14, () => {
        u.kit.hammerOut = true;
        shoot(w, u, a, { kind: 'hammer', speed: 560, r, life: 0.55, pierce: 9, dmg: dmgOf(u, 1.1), st, knock: 120, extra: { big: tier >= 3 }, land: (p) => {
          // it comes back to his hand, hitting again on the way
          const b = angleTo(p.x, p.y, u.x, u.y);
          w.projectiles.push({ kind: 'hammer', x: p.x, y: p.y, vx: Math.cos(b) * 600, vy: Math.sin(b) * 600, r, team: u.team, owner: u, dmg: dmgOf(u, 0.9), o: { knock: 100, ...st, ab: 'hammerThrow' },
            life: 1.6, a: b, pierce: 9, hitSet: new Set(), home: u, turn: 14, catchBy: u, big: tier >= 3, ab: 'hammerThrow', tier });
        } });
      });
    },
    show: { far: true },
  },
  wingShield: {
    score(w, u) {
      const shots = w.projectiles.filter((p) => p.team !== u.team && !p.noHit && dist(p.x, p.y, u.x, u.y) < 320).length;
      return shots >= 1 ? 0.6 + 0.15 * shots : opponents(w, u).filter((e) => e.def.role === 'ranged' && e.target === u).length >= 2 ? 0.5 : 0;
    },
    use(w, u, t, tier) {
      const dur = tier >= 3 ? 5 : 3; u.kit.wingUntil = w.time + dur;
      addBuff(u, { id: 'wingShield', dur, frontBlock: 0.5, raise: true, move: 0.6 });
      k2(w, { draw: 'wings', unit: u, x: u.x, y: u.y, r: u.r, max: dur });
    },
    show: { shootme: true },
  },
  // ----- Bulwark
  brace: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 240).some((e) => e.target === u || dist(u.x, u.y, e.x, e.y) < 160) ? 0.6 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t);
      addBuff(u, { id: 'brace', dur: 3, root: true, frontBlock: 0.3 });
      const hit = new Set(); setAnim(u, 'thrust', 0.2);
      k2(w, { draw: 'brace', unit: u, x: u.x, y: u.y, r: u.r, max: 3 });
      timer(u, 'brace', 3, () => {
        const reach = u.r + u.def.range + 26;
        for (const e of foesNear(w, u, u.x, u.y, reach)) {
          if (hit.has(e) || !inFront(u, e, 1.5)) continue;
          hit.add(e); setAnim(u, 'thrust', 0.3);
          hurt(w, e, dmgOf(u, 1.9), u, { knock: 340, heavy: true, stagger: 40, noDodge: true, ab: 'brace' });
          e.spd = 0; e.vx = e.vy = 0;
          if (tierOf(u, 'brace') >= 3) e.rootT = Math.max(e.rootT || 0, 1);
          k2(w, { draw: 'bonk', x: e.x, y: e.y, unit: e, r: e.vr, max: 0.4, ab: 'brace' });
          if (tierOf(u, 'brace') < 2) { u.buffs = u.buffs.filter((b) => b.id !== 'brace'); return true; }
        }
      });
    },
  },
  shieldWall: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 260).length >= 3 && friendsNear(w, u, u.x, u.y, 170).length ? 0.75 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t);
      const dur = tier >= 2 ? 7 : 5;
      addBuff(u, { id: 'shieldWall', dur, root: true, knockImmune: true, frontBlock: 0.4, raise: true });
      puff(w, u.x + Math.cos(u.facing) * u.r, u.y + Math.sin(u.facing) * u.r, '#E9DDC2', 10, 120, 5, 0.45);
      k2(w, { draw: 'shieldWall', unit: u, x: u.x, y: u.y, r: 150, max: dur });
      timer(u, 'shieldWall', dur, () => {
        for (const a of friendsNear(w, u, u.x, u.y, 150)) addBuff(a, { id: 'shieldWallCover', dur: 0.3, taken: 0.7 });
        if (tierOf(u, 'shieldWall') >= 3) for (const e of foesNear(w, u, u.x, u.y, u.r + 26)) if (inFront(u, e, 1.6)) { const a = ang(u, e); e.kx += Math.cos(a) * 40; e.ky += Math.sin(a) * 40; }
      });
    },
  },
  impale: {
    score: (w, u, t) => (inReach(u, t, 40) && !(t.rootT > 0) ? 0.5 + (t.def.boss || t.elite ? 0.25 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'thrust', 0.4);
      const dur = tier >= 3 ? 2.5 : 1.5;
      hurt(w, t, dmgOf(u, 1.6), u, { knock: 30, noDodge: true, stagger: tier >= 3 ? 50 : 0 });
      t.rootT = Math.max(t.rootT || 0, dur); t.vx = t.vy = 0; t.kx = t.ky = 0;
      if (tier >= 2) addBuff(t, { id: 'impaled', dur, taken: 1.25 });
      k2(w, { draw: 'pin', unit: t, x: t.x, y: t.y, r: t.vr, a: u.facing, max: dur });
    },
    show: { single: true },
  },
  // ----- Bearskin
  maul: {
    score: (w, u, t) => (inReach(u, t, 20) ? 0.55 + (foeWinding(w, t) ? 0.3 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'ability', 0.6);
      after(u, 0.22, () => {
        if (!alive(t)) return;
        swingMark(w, u, u.r + u.def.range + 14, 0.8, { x: t.x, y: t.y, r: tier >= 3 ? 90 : 42 });
        hurt(w, t, dmgOf(u, 2), u, { heavy: true, knock: 110, noDodge: true });
        stun(w, t, tier >= 2 ? 1.6 : 1); w.shake = Math.max(w.shake, 6);
        if (tier >= 3) for (const e of foesNear(w, u, t.x, t.y, 90)) if (e !== t) hurt(w, e, dmgOf(u, 0.6), u, { stagger: 50, knock: 140, kAngle: angleTo(t.x, t.y, e.x, e.y), noDodge: true });
      });
    },
    show: { single: true },
  },
  hibernate: {
    score: (w, u) => (hpRatio(u) < 0.45 && !u.act ? 0.95 : 0),
    use(w, u, t, tier) {
      const pct = tier >= 2 ? 0.35 : 0.25;
      addBuff(u, { id: 'hibernate', dur: 3, taken: 0.4, root: true });
      u.act = { type: 'channel', t: 3, max: 3, every: 0.25, acc: 0, tick: () => heal(w, u, u.maxHp * pct / 12, u) };
      setAnim(u, 'ability', 0.4);
      k2(w, { draw: 'hibernate', unit: u, x: u.x, y: u.y, r: u.vr, max: 3 });
      if (tier >= 3) after(u, 3, () => { if (!alive(u)) return; setAnim(u, 'ability', 0.4); ring(w, u, u.x, u.y, 130, dmgOf(u, 0.6), { knock: 300, heavy: true }, '#A0683A'); k2(w, { draw: 'roar', unit: u, x: u.x, y: u.y, r: 130, max: 0.6, ab: 'hibernate' }); });
    },
  },
  bearRoar: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 140).length >= 2 ? 0.75 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.5); w.shake = Math.max(w.shake, 4);
      const r = tier >= 3 ? 175 : 135;
      for (const e of foesNear(w, u, u.x, u.y, r)) {
        addBuff(e, { id: 'cowed', dur: 5, dealt: 0.7 });
        if (tier >= 2) addStatus(w, e, 'stagger', 45, u);
        if (tier >= 3) hurt(w, e, dmgOf(u, 0.3), u, { knock: 260, kAngle: ang(u, e), noDodge: true });
      }
      k2(w, { draw: 'roar', unit: u, x: u.x, y: u.y, r, max: 0.6 });
    },
  },
};

// ---------------------------------------------------------------- traits
export const TRAITS2 = {
  oldSoldier: { tick(w, u) { for (const a of friendsNear(w, u, u.x, u.y, 150)) if (a !== u) addBuff(a, { id: 'oldSoldier', dur: 0.3, taken: 0.9 }); } },
  grace: {
    dealt(w, u, t, amt, o) {
      if (o.dot) return amt;
      const k = u.kit; if (k.pommelMark === t) { k.pommelMark = null; o.crit = true; return amt * 2; } // Old Guard's Pommel Strike III uses the same slot
      k.graceN = (k.graceN || 0) + 1; if (k.graceN % 3 === 0) { o.crit = true; return amt * 2; } return amt;
    },
  },
  skyborn: { immune: ['entangle'], tick(w, u) { u.rootT = 0; u.tangledT = 0; } },
  phalanx: { taken(w, u, src, amt) { const n = friendsNear(w, u, u.x, u.y, 130).filter((a) => a !== u).length; return amt * (1 - Math.min(0.3, 0.1 * n)); } },
  thickHide: {
    tick(w, u) {
      const p = u.kit.hide || (u.kit.hide = {});
      for (const s of BUILDS) { const v = u.st[s] || 0, was = p[s] ?? v; if (v > was) u.st[s] = was + (v - was) * 0.5; p[s] = u.st[s] || 0; }
    },
  },
};
// Old Guard's Pommel Strike III: his next blow on the struck enemy is a critical hit (he has no Grace)
TRAITS2.oldSoldier.dealt = (w, u, t, amt, o) => { if (!o.dot && u.kit.pommelMark === t) { u.kit.pommelMark = null; o.crit = true; return amt * 2; } return amt; };

// ---------------------------------------------------------------- the heroes' own attacks (ranged heroes)
export const ATTACKS2 = {};

// ---------------------------------------------------------------- every step (kits.js kitTick)
export function kit2Tick(w, u, dt) {
  if (u.k2) {
    for (const k of u.k2) { k.t -= dt; if (k.t > 0 && k.tick && k.tick(dt) === true) k.t = 0; if (k.t <= 0 && k.end) { const e = k.end; k.end = null; e(); } }
    u.k2 = u.k2.filter((k) => k.t > 0); if (!u.k2.length) u.k2 = null;
  }
  if (!u.kit) return;
  // Wing Guard: shots coming at him are caught and thrown back
  if (u.kit.wingUntil > w.time) {
    const tier = tierOf(u, 'wingShield');
    for (const p of w.projectiles) {
      if (p.team === u.team || p.noHit || p.life <= 0 || p.team === 'neutral') continue;
      if (dist(p.x, p.y, u.x, u.y) > u.r + p.r + 28) continue;
      if (tier < 3 && angleDiff(angleTo(u.x, u.y, p.x, p.y), u.facing) > 1.3) continue;
      const o = p.owner, sp = Math.hypot(p.vx, p.vy) * 1.1, a = o && alive(o) ? angleTo(p.x, p.y, o.x, o.y) : Math.atan2(-p.vy, -p.vx);
      p.team = u.team; p.owner = u; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.a = a; p.life = Math.max(p.life, 1);
      p.dmg = (p.dmg || 6) * (tier >= 2 ? 2 : 1); if (p.hitSet) p.hitSet = new Set(); p.home = null;
      sparks(w, p.x, p.y, a, 6, '#FFF4C8', 1.1);
    }
  }
  // the Stormhammer comes back to his hand
  for (const p of w.projectiles) if (p.catchBy === u && dist(p.x, p.y, u.x, u.y) < u.r + 8) p.life = 0;
}
