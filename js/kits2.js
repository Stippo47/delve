// The new heroes' kits (round 10, lane H): abilities, traits and attacks for the heroes in heroes2.js, in the same
// shape as kits.js (merged into ABILITIES / TRAITS / ATTACKS there). Extra pieces an ability here can have:
//   hook    a hook object (kits.js hooks) that is on while the ability is bought (its tiers read u.kit.tiers)
//   show    how lab.html's showcase stages it: { far, ally, single, hitme, shootme, mob } (lab.js)
// Lasting things an ability starts run on the unit's own timers (u.k2, ticked from kitTick), not new sim acts.
// The looks are in fx2.js: fx of type 'k2' with a `draw` name, shots of the new kinds, and each ability's 'sig'.
import { TAU, clamp, dist, angleTo, angleDiff, rand, rrange } from './util.js';
import { hurt, spawn, alive, opponents, allies, hpRatio, puff, setAnim, explode, blocked, stun, addBuff, fx, cleanse, textU, sparks, scatterCoins } from './sim.js';
import { lineClear } from './path.js';
import { foesNear, friendsNear, hurtMost, dmgOf, ang, ring, cast, heal, addStatus, zone, shoot, segDist } from './kits.js';

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
  // ----- Warhelm
  thunderBlow: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, u.r + 110).filter((e) => inFront(u, e, 1.7)).length; return n >= 2 ? 0.8 : n ? 0.35 : 0; },
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'ability', 0.55);
      after(u, 0.2, () => {
        const a = u.facing, cx = u.x + Math.cos(a) * (u.r + 30), cy = u.y + Math.sin(a) * (u.r + 30);
        swingMark(w, u, u.r + 40, 0.8, { x: cx, y: cy, r: 46 });
        fx(w, { type: 'wave', x: u.x, y: u.y, a, r: u.r + 120, arc: 1.7, max: 0.4 });
        w.shake = Math.max(w.shake, 7);
        const hit = foesNear(w, u, u.x, u.y, u.r + 120).filter((e) => inFront(u, e, 1.8));
        for (const e of hit) hurt(w, e, dmgOf(u, 1.2), u, { knock: 400, kAngle: ang(u, e), heavy: true, noDodge: true, shock: tier >= 2 ? 35 : 0 });
        if (tier >= 3) after(u, 0.25, () => { for (const e of hit) if (alive(e)) stun(w, e, 1); });
      });
    },
  },
  warHorn: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 300).length >= 2 && friendsNear(w, u, u.x, u.y, 240).length ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.7);
      for (const a of [u, ...friendsNear(w, u, u.x, u.y, 240)]) addBuff(a, { id: 'warHorn', dur: 6, dealt: tier >= 2 ? 1.35 : 1.25, taken: tier >= 2 ? 0.9 : 1, glow: '#FF9A55' });
      if (tier >= 3) for (const e of foesNear(w, u, u.x, u.y, 160)) addStatus(w, e, 'stagger', 40, u);
      k2(w, { draw: 'horn', unit: u, x: u.x, y: u.y, r: 240, max: 0.9 });
    },
    show: { ally: true },
  },
  skullSplitter: {
    score: (w, u, t) => (inReach(u, t, 20) ? 0.5 + (t.elite || t.def.boss ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'swing', 0.3);
      after(u, 0.1, () => { if (!alive(t)) return; swingMark(w, u, u.r + u.def.range + 14, 1.2); hurt(w, t, dmgOf(u, 1), u, { knock: 50, noDodge: true, stagger: tier >= 2 ? 80 : 45 }); });
      after(u, 0.45, () => {
        if (!alive(t)) return; setAnim(u, 'ability', 0.45);
        const m = (t.st.stagger || 0) >= 50 || t.koT > 0 ? 2 : 1;
        swingMark(w, u, u.r + u.def.range + 14, 0.7, { x: t.x, y: t.y, r: tier >= 3 ? 80 : 40 });
        hurt(w, t, dmgOf(u, 1.4) * m, u, { heavy: true, knock: 90, noDodge: true, crit: m > 1 });
        if (tier >= 3) for (const e of foesNear(w, u, t.x, t.y, 80)) if (e !== t) hurt(w, e, dmgOf(u, 0.5), u, { stagger: 30, knock: 120, kAngle: angleTo(t.x, t.y, e.x, e.y), noDodge: true });
        w.shake = Math.max(w.shake, 5);
      });
    },
    show: { single: true },
  },
  // ----- Bandit
  smokeBomb: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 280 && foesNear(w, u, t.x, t.y, 90).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.35);
      const r = tier >= 3 ? 115 : 85, dur = tier >= 3 ? 5 : 3;
      shoot(w, u, ang(u, t), { kind: 'smokeBomb', speed: 420, r: 7, life: Math.min(0.7, dist(u.x, u.y, t.x, t.y) / 420), dmg: 1, knock: 0, land: (p) => {
        puff(w, p.x, p.y, '#5A5560', 14, 140, 9, 0.6);
        zone(w, { x: p.x, y: p.y, r, dur, kind: 'smoke', src: u, smoke: true, every: 0.2, tick(z) {
          for (const e of foesNear(w, u, z.x, z.y, z.r)) { if (e.target && e.target.team !== e.team) e.target = null; addBuff(e, { id: 'smoked', dur: 0.45, blind: true, atkSpeed: tier >= 2 ? 0.65 : 1 }); }
        } });
      } });
    },
    show: { far: true },
  },
  pickpocket: {
    score(w, u, t) { if (!t) return 0; const g = dist(u.x, u.y, t.x, t.y) - u.r - t.r; return g > 20 && g < 200 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.55 : 0; },
    use(w, u, t, tier) {
      const a = t ? ang(u, t) : u.facing, robbed = new Set();
      u.act = { type: 'dash', t: 0.32, max: 0.32, a }; u.invulnT = Math.max(u.invulnT, 0.32);
      k2(w, { draw: 'streak', unit: u, x: u.x, y: u.y, a, max: 0.45, col: '#C8453D' });
      timer(u, 'pickpocket', 0.4, () => {
        for (const e of foesNear(w, u, u.x, u.y, u.r + 14)) {
          if (robbed.has(e)) continue; robbed.add(e);
          hurt(w, e, dmgOf(u, 1.5), u, { knock: 60, kAngle: a + Math.PI / 2, noDodge: true, ab: 'pickpocket' });
          if (!e.summon && !w.lab) scatterCoins(w, e.x, e.y, tier >= 2 ? 4 : 2, 0.7);
          if (tier >= 2) addBuff(e, { id: 'robbed', dur: 3, move: 0.6 });
          k2(w, { draw: 'coinPop', x: e.x, y: e.y, unit: e, r: e.vr, max: 0.6, ab: 'pickpocket' });
          if (tierOf(u, 'pickpocket') < 3) return true;
        }
      });
    },
    show: { far: true },
  },
  lowBlow: {
    score: (w, u, t) => (inReach(u, t, 20) && !(t.koT > 0) ? 0.5 + (foeWinding(w, t) ? 0.3 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'thrust', 0.3);
      hurt(w, t, dmgOf(u, 1.3), u, { knock: 80, noDodge: true });
      const d = (tier >= 2 ? 1.6 : 1) * (t.def.boss ? 0.4 : 1);
      t.koT = Math.max(t.koT || 0, d); stun(w, t, d); interrupt(w, t);
      k2(w, { draw: 'bonk', x: t.x, y: t.y, unit: t, r: t.vr, max: Math.max(0.5, d) });
    },
    hook: { dealt(w, u, t, amt, o) { if (!o.dot && t.koT > 0 && tierOf(u, 'lowBlow') >= 3) { o.crit = true; return amt * 2; } return amt; } },
    show: { single: true },
  },
  // ----- Shade
  shadowWalk: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return d < 260 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.7 : foesNear(w, u, u.x, u.y, 70).length >= 2 ? 0.6 : 0; },
    use(w, u, t, tier) {
      const go = (a, T) => {
        u.act = { type: 'dash', t: T, max: T, a }; u.invulnT = Math.max(u.invulnT, T + 0.05); u.ethereal = true;
        const cut = new Set();
        k2(w, { draw: 'shadowTrail', unit: u, x: u.x, y: u.y, max: T + 0.5, pts: [] });
        timer(u, 'shadowWalk', T, () => {
          for (const e of opponents(w, u)) if (!cut.has(e) && dist(u.x, u.y, e.x, e.y) < u.r + e.r + 12) {
            cut.add(e); hurt(w, e, dmgOf(u, 1.4), u, { knock: 90, kAngle: a + Math.PI / 2, noDodge: true, curse: tierOf(u, 'shadowWalk') >= 2 ? 30 : 0, ab: 'shadowWalk' });
            k2(w, { draw: 'parry', x: e.x, y: e.y, a: a + 0.8, max: 0.3, ab: 'shadowWalk' });
          }
        }, () => { u.ethereal = false; });
      };
      const a = t ? ang(u, t) : u.facing, T = tier >= 3 ? 0.42 : 0.3;
      go(a, T);
      if (tier >= 3) after(u, T + 0.15, () => { if (alive(u)) go(a + Math.PI, T); });
    },
    show: { far: true },
  },
  blackout: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 130).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.4);
      const r = tier >= 2 ? 170 : 130, dur = tier >= 3 ? 6 : 4, x = u.x, y = u.y;
      k2(w, { draw: 'dark', x, y, r, max: dur });
      timer(u, 'blackout', dur, () => { for (const e of foesNear(w, u, x, y, r)) addBuff(e, { id: 'blackout', dur: 0.3, dealt: 0.7, move: tier >= 3 ? 0.7 : 1 }); });
    },
    hook: { dealt(w, u, t, amt) { return t.buffs && t.buffs.some((b) => b.id === 'blackout') ? amt * 1.3 : amt; } },
  },
  deathMark: {
    score: (w, u, t) => (t && !t.deathMark && dist(u.x, u.y, t.x, t.y) < 260 ? 0.45 + (t.elite || t.def.boss ? 0.3 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.35);
      const mark = (e) => {
        const m = { by: u, hp0: e.hp }; e.deathMark = m;
        const f = k2(w, { draw: 'skullMark', unit: e, x: e.x, y: e.y, r: e.vr, max: 3, ab: 'deathMark' });
        timer(u, 'deathMark' + e.id, 3, () => {
          if (alive(e)) return;
          f.max = f.t;
          if (tierOf(u, 'deathMark') >= 3) { const n = opponents(w, u).filter((o) => o !== e && !o.deathMark).sort((p, q) => dist(e.x, e.y, p.x, p.y) - dist(e.x, e.y, q.x, q.y))[0]; if (n) mark(n); }
          return true;
        }, () => {
          if (!alive(e) || e.deathMark !== m) return; e.deathMark = null;
          const took = Math.max(0, m.hp0 - e.hp) * (tierOf(u, 'deathMark') >= 2 ? 1 : 0.5);
          k2(w, { draw: 'markBurst', x: e.x, y: e.y, r: e.vr, max: 0.5, ab: 'deathMark' });
          if (took > 0) hurt(w, e, Math.min(took, dmgOf(u, 12)), u, { noDodge: true, crit: true, omni: true, ab: 'deathMark' });
        });
      };
      mark(t);
    },
    show: { single: true, hitDummy: true },
  },
  // ----- Haymaker
  toss: {
    score: (w, u, t) => (inReach(u, t, 24) && !t.def.boss ? 0.55 : 0),
    use(w, u, t, tier) {
      const list = foesNear(w, u, u.x, u.y, u.r + u.def.range + 30).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y)).slice(0, tier >= 3 ? 2 : 1);
      if (!list.length) return; u.facing = ang(u, list[0]); cast(u, 'ability', 0.6);
      list.forEach((e, i) => {
        if (e.def.boss || e.def.brain || e.eliteFn || e.mass > 3.5) { hurt(w, e, dmgOf(u, 1.8), u, { knock: 200, stagger: 40, noDodge: true }); return; }
        const back = u.facing + Math.PI + (i ? 0.6 : -0.3), x1 = clamp(u.x + Math.cos(back) * 120, e.r, w.W - e.r), y1 = clamp(u.y + Math.sin(back) * 120, e.r, w.H - e.r);
        e.stunT = 0; e.target = null;
        e.act = { type: 'leap', t: 0.5, max: 0.5, x0: e.x, y0: e.y, x1, y1, land: () => {
          puff(w, e.x, e.y, '#E9DDC2', 8, 90, 5, 0.4); w.shake = Math.max(w.shake, 3);
          hurt(w, e, dmgOf(u, tierOf(u, 'toss') >= 2 ? 2.2 : 1.4), u, { noDodge: true, knock: 30, stagger: tierOf(u, 'toss') >= 2 ? 50 : 0, ab: 'toss' });
        } };
      });
    },
    show: { single: true },
  },
  pitchHay: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 160).filter((e) => inFront(u, e, 1.5)).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'throw', 0.4);
      const arc = tier >= 3 ? 2 : 1.4;
      k2(w, { draw: 'spray', x: u.x, y: u.y, a: u.facing, arc, r: 170, max: 0.6, cols: ['#E8C860', '#F2DC8A', '#C9A040'] });
      for (const e of foesNear(w, u, u.x, u.y, 175)) {
        if (!inFront(u, e, arc + 0.2)) continue;
        addBuff(e, { id: 'hay', dur: 4, move: 0.6 });
        if (tier >= 2) { const H = u.kit.hayed || (u.kit.hayed = []); H.push({ e, until: w.time + 6, last: e.st.burn || 0 }); }
        if (tier >= 3) addStatus(w, e, 'stagger', 40, u);
        k2(w, { draw: 'hayOn', unit: e, x: e.x, y: e.y, r: e.vr, max: tier >= 2 ? 6 : 4 });
      }
    },
  },
  forkCharge: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return d > 100 && d < 320 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.55 : 0; },
    use(w, u, t, tier) {
      const a = t ? ang(u, t) : u.facing, T = 0.5, held = [];
      u.facing = a; u.act = { type: 'dash', t: T, max: T, a }; setAnim(u, 'thrust', T);
      const spot = (e, i) => { const b = a + (i ? (i % 2 ? 0.4 : -0.4) : 0); e.x = u.x + Math.cos(b) * (u.r + e.r + 4); e.y = u.y + Math.sin(b) * (u.r + e.r + 4); e.vx = e.vy = e.kx = e.ky = 0; };
      timer(u, 'forkCharge', T, () => {
        for (const e of foesNear(w, u, u.x, u.y, u.r + 16)) if (!held.includes(e) && (tierOf(u, 'forkCharge') >= 3 || !held.length)) {
          held.push(e); hurt(w, e, dmgOf(u, 1.4), u, { noDodge: true, knock: 0, ab: 'forkCharge' });
        }
        held.forEach((e, i) => { if (alive(e) && e.mass <= 3.5 && !e.def.boss) spot(e, i); });
      }, () => {
        for (const e of held) if (alive(e)) {
          hurt(w, e, dmgOf(u, tierOf(u, 'forkCharge') >= 2 ? 2.4 : 1.8), u, { noDodge: true, heavy: true, knock: 220, kAngle: a, ab: 'forkCharge' });
          if (tierOf(u, 'forkCharge') >= 2) stun(w, e, 1);
        }
        if (held.length) { w.shake = Math.max(w.shake, 5); puff(w, u.x + Math.cos(a) * 40, u.y + Math.sin(a) * 40, '#E9DDC2', 10, 120, 6, 0.5); }
      });
      k2(w, { draw: 'streak', unit: u, x: u.x, y: u.y, a, max: 0.6, col: '#E9DDC2' });
    },
    show: { far: true },
  },
  // ----- Digger
  dirtFling: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 140).filter((e) => inFront(u, e, 1.5)).length >= 1 ? 0.6 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t);
      const fling = () => {
        cast(u, 'throw', 0.3);
        k2(w, { draw: 'spray', x: u.x, y: u.y, a: u.facing, arc: 1.3, r: 150, max: 0.55, cols: ['#7A5A3A', '#9C7650', '#5E4430'] });
        for (const e of foesNear(w, u, u.x, u.y, 150)) if (inFront(u, e, 1.5)) {
          addBuff(e, { id: 'dirt', dur: 2.5, blind: true });
          hurt(w, e, dmgOf(u, 0.6), u, { noDodge: true, knock: 40, stagger: tier >= 2 ? 40 : 0, kAngle: ang(u, e) });
        }
      };
      fling();
      if (tier >= 3) { after(u, 0.3, fling); after(u, 0.6, fling); }
    },
  },
  burrow: {
    score(w, u) { return opponents(w, u).some((e) => { const d = dist(u.x, u.y, e.x, e.y); return d > 160 && d < 460; }) ? 0.5 : 0; },
    use(w, u, t, tier) {
      const pick = (x, y, not) => opponents(w, u).filter((e) => e !== not && dist(x, y, e.x, e.y) > 120 && dist(x, y, e.x, e.y) < 480).sort((p, q) => (q.def.role === 'ranged' ? 1 : 0) - (p.def.role === 'ranged' ? 1 : 0) || dist(x, y, q.x, q.y) - dist(x, y, p.x, p.y))[0];
      const dive = (e, again) => {
        if (!e) return;
        const a = angleTo(e.x, e.y, u.x, u.y), x1 = clamp(e.x + Math.cos(a) * (e.r + u.r), u.r, w.W - u.r), y1 = clamp(e.y + Math.sin(a) * (e.r + u.r), u.r, w.H - u.r);
        puff(w, u.x, u.y, '#9C7650', 12, 100, 6, 0.5);
        u.hidden = true; u.ethereal = true; u.invulnT = Math.max(u.invulnT, 0.8);
        k2(w, { draw: 'mound', unit: u, x: u.x, y: u.y, max: 0.72, pts: [] });
        u.act = { type: 'leap', t: 0.7, max: 0.7, x0: u.x, y0: u.y, x1, y1, land: () => {
          u.hidden = false; u.ethereal = false; u.hop = 0; u.facing = ang(u, e);
          w.shake = Math.max(w.shake, 6); puff(w, u.x, u.y, '#9C7650', 16, 160, 7, 0.6);
          ring(w, u, u.x, u.y, 105, dmgOf(u, 2.4), { knock: 300, heavy: true, stagger: tier >= 2 ? 45 : 0 }, '#9C7650');
          if (again) after(u, 0.3, () => dive(pick(u.x, u.y, e), false));
        } };
      };
      dive(t && dist(u.x, u.y, t.x, t.y) > 120 ? t : pick(u.x, u.y), tier >= 3);
      timer(u, 'burrowSafe', 2.6, null, () => { if (!u.act || u.act.type !== 'leap') { u.hidden = false; u.ethereal = false; } });
    },
    show: { far: true },
  },
  spadeBat: {
    score: (w, u, t) => (inReach(u, t, 16) && !t.def.boss ? 0.5 : 0),
    use(w, u, t, tier) {
      if (!t) return; u.facing = ang(u, t); cast(u, 'ability', 0.5);
      after(u, 0.16, () => {
        if (!alive(t)) return;
        swingMark(w, u, u.r + u.def.range + 16, 1.6);
        const a = u.facing + 0.25;
        hurt(w, t, dmgOf(u, 2.2), u, { knock: 760, kAngle: a, heavy: true, noDodge: true });
        k2(w, { draw: 'bonk', x: t.x, y: t.y, unit: t, r: t.vr, max: 0.4 });
        const hit = new Set([t]);
        if (tier >= 2) timer(u, 'spadeBat', 0.7, () => { if (!alive(t)) return true; for (const o of foesNear(w, u, t.x, t.y, t.r + 20)) if (!hit.has(o)) { hit.add(o); hurt(w, o, dmgOf(u, 0.8), u, { knock: 280, kAngle: a, noDodge: true, ab: 'spadeBat' }); } });
        if (tier >= 3) after(u, 0.5, () => { if (alive(t)) stun(w, t, 1.2); });
      });
    },
    show: { single: true },
  },
  // ----- Grandpa Sickle
  breadToss: {
    score: (w, u) => { const a = hurtMost([u, ...allies(w, u)].filter((o) => !o.summon)); return a && hpRatio(a) < 0.7 ? 1 - hpRatio(a) : 0; },
    use(w, u, t, tier) {
      const list = [u, ...allies(w, u)].filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 420).sort((p, q) => hpRatio(p) - hpRatio(q)).slice(0, tier >= 2 ? 2 : 1);
      cast(u, 'throw', 0.4);
      list.forEach((a, i) => after(u, 0.12 + i * 0.15, () => {
        if (!alive(a)) return;
        if (a === u) { heal(w, u, u.maxHp * 0.2, u); k2(w, { draw: 'crumbs', x: u.x, y: u.y, unit: u, max: 0.6 }); return; }
        lob(w, u, a.x, a.y, 'bread', null, () => { if (!alive(a)) return; heal(w, a, a.maxHp * 0.2, u); k2(w, { draw: 'crumbs', x: a.x, y: a.y, unit: a, max: 0.6, ab: 'breadToss' });
          if (tierOf(u, 'breadToss') >= 3) { a.regenT = 4; a.regenRate = a.maxHp * 0.1 / 4; a.regenSrc = u; } });
      }));
    },
    show: { ally: true },
  },
  harvest: {
    score: (w, u) => { const n = foesNear(w, u, u.x, u.y, u.r + 70).length; return n >= 2 ? 0.8 : n ? 0.35 : 0; },
    use(w, u, t, tier) {
      const r = u.r + 72; setAnim(u, 'spin', 0.4); u.spin = { t0: w.time, dur: 0.4, dir: 1 };
      fx(w, { type: 'ring', x: u.x, y: u.y, r, color: '#EDE4CD', max: 0.4, a: u.facing, unit: u });
      let n = 0;
      for (const e of foesNear(w, u, u.x, u.y, r)) { n++; hurt(w, e, dmgOf(u, 0.9), u, { knock: 40, kAngle: ang(u, e), stagger: tier >= 2 ? 40 : 0 }); addBuff(e, { id: 'hamstrung', dur: 3, move: 0.5 }); }
      if (tier >= 3 && n) heal(w, u, u.maxHp * 0.04 * n, u);
    },
  },
  oldTales: {
    score: (w, u) => (allies(w, u).filter((a) => a.kit && dist(u.x, u.y, a.x, a.y) < 220 && Object.values(a.kit.cd).some((c) => c > 3)).length >= 1 ? 0.55 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.9);
      for (const a of friendsNear(w, u, u.x, u.y, 230)) {
        if (a === u) continue;
        if (a.kit) for (const k in a.kit.cd) a.kit.cd[k] = Math.max(0, a.kit.cd[k] - (tier >= 2 ? 3 : 2));
        if (tier >= 3) heal(w, a, a.maxHp * 0.08, u);
        k2(w, { draw: 'bubble', unit: a, x: a.x, y: a.y, r: a.vr, max: 1 });
      }
      k2(w, { draw: 'bubble', unit: u, x: u.x, y: u.y, r: u.vr, max: 1.2, talk: true });
    },
    show: { ally: true },
  },
  // ----- Alchemist
  acidFlask: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && foesNear(w, u, t.x, t.y, 80).length >= 2 ? 0.7 : t ? 0.25 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      lob(w, u, t.x, t.y, 'flask', '#C8E63C', (x, y) => {
        const r = tier >= 3 ? 92 : 66, dur = 4;
        k2(w, { draw: 'acid', x, y, r, max: dur, ab: 'acidFlask' });
        let acc = 0;
        timer(u, 'acid' + Math.round(x + y), dur, (dt) => { acc += dt; if (acc < 0.3) return; acc -= 0.3;
          for (const e of foesNear(w, u, x, y, r)) { hurt(w, e, dmgOf(u, 0.28), u, { dot: true, color: '#C8E63C', ab: 'acidFlask' }); if (tierOf(u, 'acidFlask') >= 2) addBuff(e, { id: 'acid', dur: 0.4, taken: 1.2 }); } });
      });
    },
    show: { far: true },
  },
  elixir: {
    score: (w, u) => { const a = hurtMost(allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 360)); return a && hpRatio(a) < 0.75 ? 0.75 : 0; },
    use(w, u, t, tier) {
      const a = hurtMost(allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 400)) || u;
      cast(u, 'throw', 0.4);
      const dose = (o) => { heal(w, o, o.maxHp * (tierOf(u, 'elixir') >= 2 ? 0.2 : 0.12), u); addBuff(o, { id: 'elixir', dur: 4, move: 1.3, atkSpeed: 1.3, glow: '#FF7AC8' }); k2(w, { draw: 'splash', x: o.x, y: o.y, r: 30, col: '#FF7AC8', max: 0.5, ab: 'elixir' }); };
      if (a === u) { dose(u); return; }
      lob(w, u, a.x, a.y, 'flask', '#FF7AC8', () => { if (alive(a)) dose(a); if (tierOf(u, 'elixir') >= 3) for (const o of friendsNear(w, u, a.x, a.y, 100)) if (o !== a) dose(o); });
    },
    show: { ally: true },
  },
  bangFlask: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 280 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      lob(w, u, t.x, t.y, 'flask', '#FF8A3D', (x, y) => {
        k2(w, { draw: 'fuse', x, y, max: 0.6, ab: 'bangFlask' });
        timer(u, 'bang' + Math.round(x * 3 + y), 0.6, null, () => {
          const spots = tierOf(u, 'bangFlask') >= 3 ? [0, 1, 2].map((i) => ({ x: x + Math.cos(i * 2.1) * 60, y: y + Math.sin(i * 2.1) * 60 })) : [{ x, y }];
          for (const p of spots) {
            w.telegraphs.push({ type: 'blast', x: p.x, y: p.y, r: spots.length > 1 ? 80 : 105, color: '#FFB347', t: 0.05, max: 0.05, ab: 'bangFlask' });
            for (const e of foesNear(w, u, p.x, p.y, spots.length > 1 ? 80 : 105)) hurt(w, e, dmgOf(u, spots.length > 1 ? 1 : 1.5), u, { knock: 430, kAngle: angleTo(p.x, p.y, e.x, e.y), heavy: true, noDodge: true, stagger: tierOf(u, 'bangFlask') >= 2 ? 50 : 0, ab: 'bangFlask' });
          }
          w.shake = Math.max(w.shake, 7);
        });
      });
    },
    show: { far: true },
  },
  // ----- Shaman
  healTotem: {
    score: (w, u) => (allies(w, u).filter((a) => !a.summon && hpRatio(a) < 0.8).length + (hpRatio(u) < 0.8 ? 1 : 0) >= 1 && foesNear(w, u, u.x, u.y, 320).length ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.5);
      const fr = allies(w, u).filter((a) => !a.summon && dist(u.x, u.y, a.x, a.y) < 300);
      let x = u.x, y = u.y; for (const a of fr) { x += a.x; y += a.y; } x /= fr.length + 1; y /= fr.length + 1;
      const dur = tier >= 2 ? 9 : 6, R = 135; let acc = 0, zap = 0;
      k2(w, { draw: 'totem', x, y, r: R, max: dur, ab: 'healTotem' });
      timer(u, 'healTotem', dur, (dt) => {
        acc += dt; zap += dt;
        if (acc >= 0.5) { acc -= 0.5; for (const a of [u, ...allies(w, u)]) if (dist(a.x, a.y, x, y) < R + a.r) { heal(w, a, a.maxHp * 0.011, u); a.mendGlow = w.time + 0.4; } }
        if (tierOf(u, 'healTotem') >= 3 && zap >= 1) { zap = 0; const e = foesNear(w, u, x, y, R)[0];
          if (e) { fx(w, { type: 'beam', kind: 'lightning', x1: x, y1: y - 30, x2: e.x, y2: e.y, max: 0.25 }); hurt(w, e, dmgOf(u, 0.7), u, { noDodge: true, shock: 15, ab: 'healTotem' }); } }
      });
    },
    show: { ally: true },
  },
  spiritLink: {
    score: (w, u) => (allies(w, u).filter((a) => !a.summon && dist(u.x, u.y, a.x, a.y) < 260).length >= 1 && opponents(w, u).filter((e) => e.target && e.target.team === u.team).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const n = tier >= 3 ? 5 : 3, dur = tier >= 3 ? 7 : 5;
      const group = [u, ...allies(w, u).filter((a) => !a.summon && dist(u.x, u.y, a.x, a.y) < 280).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))].slice(0, n);
      if (group.length < 2) return;
      u.kit.link = { group, until: w.time + dur, hp: group.map((a) => a.hp) };
      k2(w, { draw: 'links', group, x: u.x, y: u.y, max: dur, ab: 'spiritLink' });
      if (tier >= 2) for (const a of group) addBuff(a, { id: 'spiritLink', dur, taken: 0.9 });
    },
    show: { ally: true, hitAlly: true },
  },
  rainDance: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && foesNear(w, u, t.x, t.y, 110).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.7);
      const x = t.x, y = t.y, r = tier >= 3 ? 150 : 115, dur = 4; let acc = 0, bolt = 0;
      k2(w, { draw: 'rain', x, y, r, max: dur, ab: 'rainDance' });
      timer(u, 'rainDance', dur, (dt) => {
        acc += dt; bolt += dt; if (acc < 0.25) return; acc -= 0.25;
        for (const e of foesNear(w, u, x, y, r)) { addStatus(w, e, 'wet', 12, u); if (e.st.burn) e.st.burn *= 0.6; }
        for (const a of [u, ...allies(w, u)]) if (dist(a.x, a.y, x, y) < r) { a.st.burn = 0; if (tierOf(u, 'rainDance') >= 2) heal(w, a, a.maxHp * 0.012, u); }
        if (tierOf(u, 'rainDance') >= 3 && bolt >= 0.8) { bolt = 0; const e = foesNear(w, u, x, y, r).filter((o) => o.st.wet > 30)[0];
          if (e) { fx(w, { type: 'pillar', x: e.x, y: e.y, r: 26, kind: 'lightning', max: 0.3 }); hurt(w, e, dmgOf(u, 1.3), u, { noDodge: true, shock: 30, omni: true, ab: 'rainDance' }); } }
      });
    },
    show: { far: true },
  },
  // ----- Witch
  frogHex: {
    score: (w, u, t) => (t && !t.frogUntil && dist(u.x, u.y, t.x, t.y) < 280 ? 0.45 + (t.elite ? 0.3 : 0) + (foeWinding(w, t) ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.45);
      const frog = (e) => {
        const dur = tier >= 2 ? 3 : 2;
        k2(w, { draw: 'ebeam', from: u, to: e, x: u.x, y: u.y, max: 0.3, thin: true, col: '#9BE36B' });
        if (e.def.boss) { addStatus(w, e, 'curse', 40, u); return; }
        interrupt(w, e); e.atkT = Math.max(e.atkT, dur); e.abilT = Math.max(e.abilT || 0, dur); e.frogUntil = w.time + dur;
        addBuff(e, { id: 'frog', dur, move: 0.55, taken: 1.5 });
        k2(w, { draw: 'frog', unit: e, x: e.x, y: e.y, r: e.vr, max: dur, ab: 'frogHex' });
        timer(u, 'frog' + e.id, dur, null, () => { e.frogUntil = 0; });
      };
      frog(t);
      if (tier >= 3) { const n = opponents(w, u).filter((o) => o !== t && !o.frogUntil && !o.def.boss).sort((p, q) => dist(t.x, t.y, p.x, p.y) - dist(t.x, t.y, q.x, q.y))[0]; if (n) after(u, 0.2, () => alive(n) && frog(n)); }
    },
    show: { far: true },
  },
  cursedBrew: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      const r = tier >= 2 ? 115 : 85, dur = 5;
      lob(w, u, t.x, t.y, 'cauldron', null, (x, y) => {
        u.kit.brew = { x, y, r, until: w.time + dur };
        k2(w, { draw: 'cauldron', x, y, r, max: dur, ab: 'cursedBrew' }); let acc = 0;
        timer(u, 'cursedBrew', dur, (dt) => { acc += dt; if (acc < 0.3) return; acc -= 0.3; for (const e of foesNear(w, u, x, y, r)) addStatus(w, e, 'curse', 20, u); });
      });
    },
    hook: {
      death(w, u, v) {
        const b = u.kit.brew; if (!b || b.until < w.time || v.team === u.team || tierOf(u, 'cursedBrew') < 3 || dist(v.x, v.y, b.x, b.y) > b.r) return;
        k2(w, { draw: 'markBurst', x: v.x, y: v.y, r: 20, max: 0.5, ab: 'cursedBrew' });
        for (const e of foesNear(w, u, v.x, v.y, 90)) addStatus(w, e, 'curse', 35, u);
      },
    },
    show: { far: true },
  },
  broomRide: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 90).length ? 0.85 : 0),
    use(w, u, t, tier) {
      const f = foesNear(w, u, u.x, u.y, 160); let ax = 0, ay = 0; for (const e of f) { ax += u.x - e.x; ay += u.y - e.y; }
      const a = f.length ? Math.atan2(ay, ax) : u.facing + Math.PI, T = tier >= 3 ? 0.6 : 0.42;
      u.act = { type: 'dash', t: T, max: T, a };
      if (tier >= 3) u.invulnT = Math.max(u.invulnT, T + 0.1);
      k2(w, { draw: 'broom', unit: u, x: u.x, y: u.y, a, max: T + 0.2 });
      if (tier >= 2) for (let i = 0; i < 3; i++) after(u, 0.08 + i * 0.12, () => { const e = opponents(w, u).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[i % 2]; if (e) shoot(w, u, ang(u, e), { kind: 'hexbolt', speed: 380, r: 7, life: 1.2, dmg: dmgOf(u, 1.6), st: { curse: 12 }, extra: { home: e, turn: 4 } }); });
    },
  },
  // ----- Warlock
  eldritchBeam: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 250 && !blocked(w, u.x, u.y, t.x, t.y) ? 0.55 + (t.elite || t.def.boss ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 2.5);
      const second = tier >= 3 ? opponents(w, u).filter((o) => o !== t && dist(o.x, o.y, t.x, t.y) < 160)[0] : null;
      const f1 = k2(w, { draw: 'ebeam', from: u, to: t, x: u.x, y: u.y, max: 2.6, ab: 'eldritchBeam' });
      const f2 = second ? k2(w, { draw: 'ebeam', from: t, to: second, x: t.x, y: t.y, max: 2.6, thin: true, ab: 'eldritchBeam' }) : null;
      let n = 0;
      u.act = { type: 'channel', t: 2.5, max: 2.5, target: t, every: 0.25, acc: 0, tick: () => {
        if (!alive(t) || dist(u.x, u.y, t.x, t.y) > 300) { u.act = null; f1.max = f1.t; if (f2) f2.max = f2.t; return; }
        n++; const m = 1 + n * (tier >= 2 ? 0.35 : 0.2); f1.heat = n;
        hurt(w, t, dmgOf(u, 0.3) * m, u, { dot: true, color: '#E05AB8' });
        if (second && alive(second)) hurt(w, second, dmgOf(u, 0.15) * m, u, { dot: true, color: '#E05AB8' });
      } };
    },
    show: { far: true },
  },
  summonImp: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 380).length >= 2 && !w.units.some((o) => o.summonBy === u && alive(o)) ? 0.65 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.8);
      const spots = []; for (let i = 0; i < (tier >= 3 ? 2 : 1); i++) { const a = u.facing + (i ? -1 : 1) * 0.8; spots.push({ x: clamp(u.x + Math.cos(a) * 60, 30, w.W - 30), y: clamp(u.y + Math.sin(a) * 60, 30, w.H - 30) }); }
      for (const p of spots) k2(w, { draw: 'gate', x: p.x, y: p.y, r: 30, max: 1.1 });
      after(u, 0.7, () => { for (const p of spots) {
        const s = spawn(w, 'imp', p.x, p.y, { team: u.team, scale: tier >= 2 ? 1.2 : 1, hpMul: tier >= 2 ? 2 : 1.2 });
        s.summon = true; s.summonBy = u; s.lifeT = 15; s.aggro = true; s.dmgMul = u.dmgMul * (tier >= 2 ? 1.3 : 1);
      } });
    },
  },
  darkBargain: {
    score: (w, u) => { const others = Object.entries(u.kit.cd).filter(([k, c]) => k !== 'darkBargain' && c > 4).length; return others >= 2 && hpRatio(u) > 0.45 && foesNear(w, u, u.x, u.y, 320).length ? 0.7 : 0; },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const pay = Math.min(u.hp - 1, u.maxHp * (tier >= 2 ? 0.1 : 0.15)); u.hp -= pay;
      for (const k in u.kit.cd) if (k !== 'darkBargain') u.kit.cd[k] = 0;
      if (tier >= 3) for (const a of friendsNear(w, u, u.x, u.y, 200)) if (a !== u) heal(w, a, pay * 0.6, u);
      k2(w, { draw: 'bargain', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.8 });
    },
  },
  // ----- Cultist
  bloodPact: {
    score: (w, u) => (hpRatio(u) > 0.5 && foesNear(w, u, u.x, u.y, 300).length >= 2 && friendsNear(w, u, u.x, u.y, 230).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.6);
      u.hp -= Math.min(u.hp - 1, u.maxHp * 0.1);
      k2(w, { draw: 'bargain', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.8 });
      for (const a of [u, ...friendsNear(w, u, u.x, u.y, 230)]) {
        addBuff(a, { id: 'bloodPact', dur: 6, dealt: tier >= 2 ? 1.4 : 1.3, lifesteal: tier >= 3 ? 0.15 : 0, glow: '#C8453D' });
        k2(w, { draw: 'rally', unit: a, x: a.x, y: a.y, r: a.vr, max: 0.9, cols: ['#C8453D', '#FF8A7A'] });
      }
    },
    show: { ally: true },
  },
  ritualCircle: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 280 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.6);
      const x = t.x, y = t.y, r = tier >= 3 ? 140 : 105; let acc = 0;
      k2(w, { draw: 'circle', x, y, r, max: 4, ab: 'ritualCircle' });
      timer(u, 'ritualCircle', 4, (dt) => { acc += dt; if (acc < 0.3) return; acc -= 0.3; for (const e of foesNear(w, u, x, y, r)) addStatus(w, e, 'curse', 28, u); }, () => {
        if (tierOf(u, 'ritualCircle') < 2) return;
        for (const e of foesNear(w, u, x, y, r + 10)) { const a = angleTo(e.x, e.y, x, y), d = dist(e.x, e.y, x, y); e.kx += Math.cos(a) * d * 5; e.ky += Math.sin(a) * d * 5; addStatus(w, e, 'stagger', 30, u); }
        k2(w, { draw: 'markBurst', x, y, r: 30, max: 0.5, ab: 'ritualCircle' });
      });
    },
    show: { far: true },
  },
  soulCandle: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 220).filter((e) => hpRatio(e) < 0.5).length >= 2 ? 0.7 : foesNear(w, u, u.x, u.y, 220).length >= 4 ? 0.5 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.5); u.kit.candleUntil = w.time + 6;
      k2(w, { draw: 'candle', unit: u, x: u.x, y: u.y, max: 6 });
    },
    hook: {
      death(w, u, v) {
        if (!(u.kit.candleUntil > w.time) || v.team === u.team || v._souled || dist(u.x, u.y, v.x, v.y) > 240) return; v._souled = true;
        const tier = tierOf(u, 'soulCandle'), r = tier >= 2 ? 95 : 65;
        k2(w, { draw: 'markBurst', x: v.x, y: v.y, r: 20, max: 0.5, col: '#6FC8FF', ab: 'soulCandle' });
        for (const e of foesNear(w, u, v.x, v.y, r)) if (e !== v && e.hp > 0) hurt(w, e, dmgOf(u, 2.6), u, { noDodge: true, knock: 120, kAngle: angleTo(v.x, v.y, e.x, e.y), curse: 10, ab: 'soulCandle' });
        if (tier >= 3) heal(w, u, u.maxHp * 0.04, u);
      },
    },
    show: { killDummy: true },
  },
  // ----- Monk
  flurry: {
    score: (w, u, t) => (inReach(u, t, 14) ? 0.6 + (hpRatio(u) < 0.6 ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; const n = tier >= 3 ? 9 : 6;
      for (let i = 0; i < n; i++) after(u, i * 0.075, () => {
        if (!alive(t)) return; u.facing = ang(u, t); setAnim(u, 'punch', 0.1);
        const last = i === n - 1;
        hurt(w, t, dmgOf(u, 0.6), u, { knock: last && tier >= 2 ? 460 : 25, heavy: last, noDodge: true, ab: 'flurry' });
        heal(w, u, u.maxHp * 0.012, u);
        k2(w, { draw: 'parry', x: t.x - Math.cos(u.facing) * t.r * 0.6, y: t.y - Math.sin(u.facing) * t.r * 0.6, a: u.facing + (i % 2 ? 0.4 : -0.4), max: 0.2, ab: 'flurry' });
      });
    },
    show: { single: true },
  },
  palmStrike: {
    score(w, u, t) { if (!inReach(u, t, 20)) return 0; const a = ang(u, t); return 0.4 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.4 && dist(u.x, u.y, e.x, e.y) < 200).length; },
    use(w, u, t, tier) {
      if (!t) return; const a = ang(u, t), L = tier >= 3 ? 250 : 170; u.facing = a; cast(u, 'punch', 0.35);
      fx(w, { type: 'wave', x: u.x, y: u.y, a, r: L, arc: 0.5, max: 0.4 });
      const line = opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.45 && dist(u.x, u.y, e.x, e.y) - e.r < L).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y));
      line.forEach((e, i) => { hurt(w, e, dmgOf(u, i ? 0.9 : 1.4), u, { knock: 380, kAngle: a, noDodge: true, stagger: tier >= 2 ? 45 : 0 }); if (!i && tier >= 3) stun(w, e, 1); });
      w.shake = Math.max(w.shake, 4);
    },
    show: { single: false },
  },
  innerPeace: {
    score: (w, u) => { const bad = (o) => (o.st.burn + o.st.poison + o.st.chill + (o.st.curse || 0) + (o.st.stagger || 0)) > 50; return bad(u) || hpRatio(u) < 0.45 || (tierOf(u, 'innerPeace') >= 2 && allies(w, u).some((a) => bad(a) && dist(u.x, u.y, a.x, a.y) < 160)) ? 0.85 : 0; },
    use(w, u, t, tier) {
      const list = tier >= 2 ? [u, ...friendsNear(w, u, u.x, u.y, 170)] : [u];
      for (const a of list) { cleanse(a); heal(w, a, a.maxHp * 0.15, u); }
      addBuff(u, { id: 'innerPeace', dur: 2, root: true, taken: 0.7 });
      u.act = { type: 'channel', t: 2, max: 2, every: 1, acc: 0, tick: () => {} };
      if (tier >= 3) u.invulnT = Math.max(u.invulnT, 2);
      setAnim(u, 'ability', 0.5);
      k2(w, { draw: 'peace', unit: u, x: u.x, y: u.y, r: tier >= 2 ? 170 : u.vr * 2, max: 2 });
    },
    show: { ally: true },
  },
  // ----- Seer
  foresight: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 360).some((e) => !e.buffs.some((b) => b.id === 'foresight') && (e.elite || e.def.boss || e.maxHp > 120)) ? 0.75 : foesNear(w, u, u.x, u.y, 300).length >= 3 ? 0.45 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const list = foesNear(w, u, u.x, u.y, 380).sort((p, q) => q.maxHp - p.maxHp).slice(0, tier >= 3 ? 2 : 1);
      for (const e of list) {
        addBuff(e, { id: 'foresight', dur: 6, taken: 1.35, blind: tier >= 2 });
        k2(w, { draw: 'eye', unit: e, x: e.x, y: e.y, r: e.vr, max: 6, ab: 'foresight' });
      }
    },
    show: { single: true },
  },
  premonition: {
    score(w, u) { const a = [u, ...allies(w, u)].filter((o) => !o.summon && hpRatio(o) < 0.7 && opponents(w, u).filter((e) => e.target === o && dist(e.x, e.y, o.x, o.y) < 140).length >= 2); return a.length ? 0.85 : 0; },
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4);
      const threat = (o) => opponents(w, u).filter((e) => e.target === o && dist(e.x, e.y, o.x, o.y) < 160).length + (1 - hpRatio(o));
      const list = [u, ...allies(w, u)].filter((o) => !o.summon).sort((p, q) => threat(q) - threat(p)).slice(0, tier >= 2 ? 2 : 1);
      for (const a of list) { a.invulnT = Math.max(a.invulnT, tier >= 3 ? 2 : 1.2); if (tier >= 3) heal(w, a, a.maxHp * 0.1, u); k2(w, { draw: 'ward', unit: a, x: a.x, y: a.y, r: a.vr, max: tier >= 3 ? 2 : 1.2 }); }
    },
    show: { ally: true },
  },
  starfall: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 320 && foesNear(w, u, t.x, t.y, 110).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.8);
      const n = tier >= 3 ? 10 : 6, cx = t.x, cy = t.y;
      for (let i = 0; i < n; i++) after(u, 0.15 + i * 2 / n, () => {
        const near = foesNear(w, u, cx, cy, 120), e = near.length && rand() < 0.7 ? near[Math.floor(rand() * near.length)] : null;
        const x = e ? e.x + rrange(-10, 10) : cx + rrange(-90, 90), y = e ? e.y + rrange(-10, 10) : cy + rrange(-90, 90);
        k2(w, { draw: 'star', x, y, max: 0.55, ab: 'starfall' });
        after(u, 0.25, () => { for (const o of foesNear(w, u, x, y, 42)) hurt(w, o, dmgOf(u, 0.95), u, { noDodge: true, omni: true, radiance: tierOf(u, 'starfall') >= 2 ? 16 : 0, ab: 'starfall' }); });
      });
    },
    show: { far: true },
  },
  // ----- Chef
  hotMeal: {
    score: (w, u) => { const a = hurtMost([u, ...allies(w, u)].filter((o) => !o.summon)); return a && hpRatio(a) < 0.6 ? 0.85 : 0; },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.4);
      const list = [u, ...allies(w, u)].filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 380).sort((p, q) => hpRatio(p) - hpRatio(q)).slice(0, tier >= 2 ? 2 : 1);
      list.forEach((a, i) => {
        const b = angleTo(a.x, a.y, u.x, u.y); let x = a.x + Math.cos(b) * 70, y = a.y + Math.sin(b) * 70;
        const f = k2(w, { draw: 'meal', x, y, max: 10, ab: 'hotMeal' });
        timer(u, 'meal' + i, 10, (dt) => {
          if (alive(a)) { const c = angleTo(x, y, a.x, a.y), d = dist(x, y, a.x, a.y); x += Math.cos(c) * Math.min(d, 45 * dt); y += Math.sin(c) * Math.min(d, 45 * dt); f.x = x; f.y = y; }
          const who = [u, ...allies(w, u)].find((o) => !o.summon && dist(o.x, o.y, x, y) < o.r + 22); if (!who) return;
          heal(w, who, who.maxHp * 0.3, u); k2(w, { draw: 'crumbs', x: who.x, y: who.y, unit: who, max: 0.6, ab: 'hotMeal' });
          if (tierOf(u, 'hotMeal') >= 3) addBuff(who, { id: 'hotMeal', dur: 8, dealt: 1.2, glow: '#FFB070' });
          f.max = f.t + 0.15; return true;
        }, () => { f.max = Math.min(f.max, f.t + 0.3); });
      });
    },
    show: { ally: true },
  },
  greaseFire: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 170).filter((e) => inFront(u, e, 1.4)).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'throw', 0.4);
      const a = u.facing, spots = [[60, 0], [105, -0.2], [105, 0.2], [150, 0]];
      if (tier >= 3) spots.push([120, -0.55], [120, 0.55], [180, -0.3], [180, 0.3]);
      const pts = spots.map(([d, o]) => ({ x: u.x + Math.cos(a + o) * d, y: u.y + Math.sin(a + o) * d }));
      k2(w, { draw: 'spray', x: u.x, y: u.y, a, arc: tier >= 3 ? 1.6 : 1, r: 170, max: 0.5, cols: ['#E0B050', '#C8902A', '#FFE08A'] });
      for (const p of pts) w.hazards.push({ type: 'oil', x: p.x, y: p.y, r: 40, t: 6, max: 6 });
      for (const e of foesNear(w, u, u.x, u.y, 180)) if (inFront(u, e, 1.2)) hurt(w, e, dmgOf(u, 0.6), u, { noDodge: true, knock: 60, burn: tier >= 2 ? 25 : 0 });
      if (tier >= 2) { let acc = 0; k2(w, { draw: 'greaseFlames', pts, max: 6, ab: 'greaseFire' });
        timer(u, 'greaseFire', 6, (dt) => { acc += dt; if (acc < 0.3) return; acc -= 0.3; for (const e of opponents(w, u)) if (pts.some((p) => dist(p.x, p.y, e.x, e.y) < 40 + e.r * 0.5)) addStatus(w, e, 'burn', 11, u); }); }
    },
  },
  foodFight: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 300).length >= 3 ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'throw', 0.5);
      const list = foesNear(w, u, u.x, u.y, 330).filter((e) => !blocked(w, u.x, u.y, e.x, e.y)).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y)).slice(0, tier >= 3 ? 5 : 3);
      list.forEach((e, i) => after(u, i * 0.1, () => { if (!alive(e)) return; setAnim(u, 'throw', 0.2);
        shoot(w, u, ang(u, e), { kind: 'pie', speed: 420, r: 9, color: '#FFF4D0', life: 1.2, dmg: dmgOf(u, 0.7), knock: 60, extra: { home: e, turn: 3, onHit: (w2, p, x) => {
          addBuff(x, { id: 'pied', dur: 3, move: 0.6, blind: tierOf(u, 'foodFight') >= 2 });
          k2(w2, { draw: 'splash', x: x.x, y: x.y, r: 30, col: '#FFF4D0', max: 0.5, ab: 'foodFight' }); k2(w2, { draw: 'pieFace', unit: x, x: x.x, y: x.y, r: x.vr, max: 3, ab: 'foodFight' });
        } } }); }));
    },
    show: { far: true },
  },
  // ----- Beekeeper
  swarm: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 300).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      cast(u, 'throw', 0.5);
      const n = tier >= 3 ? 10 : 6, foes = foesNear(w, u, u.x, u.y, 360).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y));
      if (!foes.length) return;
      for (let i = 0; i < n; i++) { const e = foes[i % Math.min(foes.length, 4)];
        shoot(w, u, ang(u, e) + (i - n / 2) * 0.25, { kind: 'bee', speed: 300, r: 6, life: 2.6, dmg: dmgOf(u, 0.55), knock: 10, st: tier >= 2 ? { poison: 12 } : {}, extra: { home: e, turn: 7, onHit: (w2, p, x) => addBuff(x, { id: 'stung', dur: 2, move: 0.8 }) } }); }
    },
  },
  honeyPot: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 280 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      lob(w, u, t.x, t.y, 'flask', '#F2B42A', (x, y) => {
        const r = tier >= 3 ? 110 : 80; let acc = 0;
        k2(w, { draw: 'honey', x, y, r, max: 5, ab: 'honeyPot' });
        timer(u, 'honey' + Math.round(x + y * 3), 5, (dt) => { acc += dt; if (acc < 0.3) return; acc -= 0.3;
          for (const e of foesNear(w, u, x, y, r)) addStatus(w, e, 'entangle', 13, u);
          if (tierOf(u, 'honeyPot') >= 2) for (const a of [u, ...allies(w, u)]) if (dist(a.x, a.y, x, y) < r) heal(w, a, a.maxHp * 0.015, u); });
      });
    },
    show: { far: true },
  },
  royalJelly: {
    score: (w, u) => (allies(w, u).some((a) => !a.summon && a.target && dist(u.x, u.y, a.x, a.y) < 320 && !a.buffs.some((b) => b.id === 'royalJelly')) ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'throw', 0.4);
      const list = allies(w, u).filter((a) => !a.summon && dist(u.x, u.y, a.x, a.y) < 360).sort((p, q) => (q.target ? 1 : 0) - (p.target ? 1 : 0) || (q.def.dmg / q.def.atkCd) - (p.def.dmg / p.def.atkCd)).slice(0, tier >= 3 ? 2 : 1);
      if (!list.length) list.push(u);
      for (const a of list) { addBuff(a, { id: 'royalJelly', dur: 6, atkSpeed: 1.4, dealt: tier >= 2 ? 1.2 : 1, glow: '#FFD45A' }); k2(w, { draw: 'splash', x: a.x, y: a.y, r: 30, col: '#FFD45A', max: 0.5 }); k2(w, { draw: 'rally', unit: a, x: a.x, y: a.y, r: a.vr, max: 0.9, cols: ['#FFD45A', '#F2B42A'] }); }
    },
    show: { ally: true },
  },
  // ----- Quartermaster
  resupply: {
    score: (w, u) => { const a = hurtMost([u, ...allies(w, u)].filter((o) => !o.summon)); return a && (hpRatio(a) < 0.65 || (a.potions === 0 && hpRatio(a) < 0.85)) ? 0.8 : 0; },
    use(w, u, t, tier) {
      cast(u, 'throw', 0.4);
      const list = [u, ...allies(w, u)].filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 400).sort((p, q) => hpRatio(p) - hpRatio(q)).slice(0, tier >= 3 ? 2 : 1);
      const give = (a) => { heal(w, a, a.maxHp * (tierOf(u, 'resupply') >= 2 ? 0.12 : 0.06), u); if (!a.potions && a.resuppliedIn !== w) { a.potions = 1; a.resuppliedIn = w; } k2(w, { draw: 'crumbs', x: a.x, y: a.y, unit: a, max: 0.6, ab: 'resupply' }); };
      list.forEach((a, i) => after(u, i * 0.15, () => { if (!alive(a)) return; if (a === u) give(u); else lob(w, u, a.x, a.y, 'bundle', null, () => alive(a) && give(a)); }));
    },
    show: { ally: true },
  },
  oilBlades: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 320).length >= 2 && friendsNear(w, u, u.x, u.y, 230).filter((a) => a !== u && a.def.role !== 'ranged').length ? 0.65 : 0),
    use(w, u, t, tier) {
      cast(u, 'throw', 0.5);
      for (const a of [u, ...friendsNear(w, u, u.x, u.y, 240)]) {
        if (!a.kit) continue;
        a.hitBurn = tier >= 2 ? 12 : 7; if (tier >= 3) addBuff(a, { id: 'oilBlades', dur: 8, lifesteal: 0.04 });
        timer(a, 'oilBlades', 8, null, () => { a.hitBurn = 0; });
        k2(w, { draw: 'oilGlow', unit: a, x: a.x, y: a.y, r: a.vr, max: 8 });
      }
    },
    show: { ally: true },
  },
  flare: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 320 && foesNear(w, u, t.x, t.y, 110).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      lob(w, u, t.x, t.y, 'flare', null, (x, y) => {
        const r = tier >= 3 ? 150 : 110;
        k2(w, { draw: 'flare', x, y, r, max: 6, ab: 'flare' });
        timer(u, 'flare' + Math.round(x + y), 6, () => { for (const e of foesNear(w, u, x, y, r)) addBuff(e, { id: 'flared', dur: 0.35, taken: 1.2, move: tierOf(u, 'flare') >= 2 ? 0.75 : 1 }); });
      });
    },
    show: { far: true },
  },
  // ----- Crossbowman
  pavise: {
    score: (w, u) => (opponents(w, u).filter((e) => e.target === u).length >= 1 || w.projectiles.some((p) => p.team !== u.team && dist(p.x, p.y, u.x, u.y) < 300) ? 0.6 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t);
      const dur = tier >= 3 ? 9 : 6;
      addBuff(u, { id: 'pavise', dur, frontBlock: 0.6, root: true, atkSpeed: tier >= 2 ? 1.35 : 1 });
      puff(w, u.x + Math.cos(u.facing) * (u.r + 10), u.y + Math.sin(u.facing) * (u.r + 10), '#E9DDC2', 8, 90, 5, 0.4);
      k2(w, { draw: 'pavise', unit: u, x: u.x, y: u.y, a: u.facing, max: dur });
    },
    show: { shootme: true },
  },
  pinBolt: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && !blocked(w, u.x, u.y, t.x, t.y) && !(t.rootT > 0) ? 0.5 + (t.def.role !== 'ranged' && t.target && t.target !== u ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'shoot', 0.4);
      shoot(w, u, ang(u, t), { kind: 'cbolt', speed: 760, r: 8, dmg: dmgOf(u, 1.3), knock: 30, extra: { big: true, onHit: (w2, p, e) => {
        e.rootT = Math.max(e.rootT || 0, tier >= 3 ? 2.5 : 1.5); e.kx = e.ky = 0;
        if (tier >= 2) addStatus(w2, e, 'stagger', 40, u);
        k2(w2, { draw: 'pin', unit: e, x: e.x, y: e.y, r: e.vr, a: p.a, max: tier >= 3 ? 2.5 : 1.5, ab: 'pinBolt' });
      } } });
    },
    show: { far: true, single: true },
  },
  crankUp: {
    score: (w, u, t) => (!(u.kit.crank > 0) && t && foesNear(w, u, t.x, t.y, 90).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      setAnim(u, 'ability', 0.6); u.kit.crank = tier >= 3 ? 5 : 3; u.kit.crankR = tier >= 2 ? 80 : 55;
      k2(w, { draw: 'gather', unit: u, x: u.x, y: u.y, r: 30, max: 0.6, col: '#FF9A3D' });
      u.atkT = Math.min(u.atkT, 0.3);
    },
    show: { far: true, attacks: true },
  },
  // ----- Falconer
  looseFalcon: {
    score: (w, u) => (opponents(w, u).some((e) => dist(u.x, u.y, e.x, e.y) < 440) && !u.kit.falconOut ? 0.6 : 0),
    use(w, u, t, tier) {
      const far = (not) => opponents(w, u).filter((e) => e !== not && dist(u.x, u.y, e.x, e.y) < 460).sort((p, q) => dist(u.x, u.y, q.x, q.y) - dist(u.x, u.y, p.x, p.y))[0];
      let e = far(null); if (!e) return; cast(u, 'throw', 0.4);
      const f = k2(w, { draw: 'falcon', x: u.x, y: u.y, a: u.facing, max: 9, ab: 'looseFalcon' });
      let phase = 'fly', pt = 0, hits = 0, second = tier >= 3; u.kit.falconOut = true;
      timer(u, 'falcon', 8.5, (dt) => {
        const goal = phase === 'home' ? u : e;
        if (phase !== 'home' && !alive(e)) { const n = second ? far(e) : null; if (n) { e = n; second = false; phase = 'fly'; } else phase = 'home'; return; }
        const a = angleTo(f.x, f.y, goal.x, goal.y), d = dist(f.x, f.y, goal.x, goal.y);
        if (phase === 'peck') { pt += dt; f.x = e.x + Math.cos(pt * 5) * (e.r + 6); f.y = e.y + Math.sin(pt * 5) * (e.r + 6); f.a = pt * 5 + Math.PI / 2;
          if (pt > 0.5 * (hits + 1)) { hits++; hurt(w, e, dmgOf(u, 0.5), u, { noDodge: true, knock: 20, ab: 'looseFalcon' }); }
          if (pt > 2.5) { if (second) { const n = far(e); second = false; if (n) { e = n; phase = 'fly'; pt = 0; hits = 0; return; } } phase = 'home'; }
          return; }
        f.a = a; const sp = 560 * dt; f.x += Math.cos(a) * Math.min(sp, d); f.y += Math.sin(a) * Math.min(sp, d);
        if (d < goal.r + 8) {
          if (phase === 'home') { f.max = f.t; return true; }
          phase = 'peck'; pt = 0; hits = 0;
          addBuff(e, { id: 'falconMark', dur: 5, taken: 1.2, blind: tierOf(u, 'looseFalcon') >= 2 });
          hurt(w, e, dmgOf(u, 0.9), u, { noDodge: true, knock: 60, ab: 'looseFalcon' });
          k2(w, { draw: 'eye', unit: e, x: e.x, y: e.y, r: e.vr, max: 5, col: '#E0A060', ab: 'looseFalcon' });
        }
      }, () => { f.max = Math.min(f.max, f.t + 0.05); u.kit.falconOut = false; });
    },
    show: { far: true },
  },
  keenEye: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && foesNear(w, u, u.x, u.y, 300).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.4); u.kit.keenUntil = w.time + 6;
      if (tier >= 2) addBuff(u, { id: 'keenEye', dur: 6, atkSpeed: 1.3 });
      k2(w, { draw: 'eye', unit: u, x: u.x, y: u.y, r: u.vr, max: 6, col: '#FFE7A0' });
      u.atkT = Math.min(u.atkT, 0.2);
    },
    show: { far: true, attacks: true },
  },
  flock: {
    score(w, u, t) { if (!t) return 0; const a = ang(u, t); return opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.35 && dist(u.x, u.y, e.x, e.y) < 360).length >= 2 ? 0.65 : 0; },
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.4);
      const send = (a) => {
        const x0 = u.x, y0 = u.y, hit = new Set(); let s = 0;
        const f = k2(w, { draw: 'flock', x: x0, y: y0, a, max: 0.9, ab: 'flock' });
        timer(u, 'flock' + a.toFixed(2), 0.85, (dt) => {
          s += 460 * dt; f.x = x0 + Math.cos(a) * s; f.y = y0 + Math.sin(a) * s;
          for (const e of foesNear(w, u, f.x, f.y, 44)) if (!hit.has(e)) { hit.add(e); hurt(w, e, dmgOf(u, 0.7), u, { noDodge: true, knock: 70, kAngle: a, ab: 'flock' }); addBuff(e, { id: 'pecked', dur: 3, move: 0.65, blind: tierOf(u, 'flock') >= 2 }); }
        });
      };
      const a = ang(u, t); send(a);
      if (tier >= 3) after(u, 0.3, () => { send(a + 0.3); send(a - 0.3); });
    },
    show: { far: true },
  },
  // ----- Grenadier
  bigBomb: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && foesNear(w, u, t.x, t.y, 120).length >= 3 ? 0.8 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.5);
      lob(w, u, t.x, t.y, 'bomb', 'big', (x, y) => {
        k2(w, { draw: 'fuse', x, y, r: 120, max: 0.75, bomb: true, ab: 'bigBomb' });
        timer(u, 'bigBomb', 0.75, null, () => {
          blast(w, u, x, y, 120, 2, { burn: tierOf(u, 'bigBomb') >= 2 ? 30 : 0, stagger: 30 }, 'bigBomb');
          if (tierOf(u, 'bigBomb') >= 3) for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + 0.4, x2 = x + Math.cos(b) * 110, y2 = y + Math.sin(b) * 110;
            lob(w, u, x2, y2, 'bomb', null, () => after(u, 0.2, () => blast(w, u, x2, y2, 55, 0.8, {}, 'bigBomb'))); }
        });
      });
    },
    show: { far: true },
  },
  stickyBomb: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && !t.sticky ? 0.5 + (t.elite || t.def.boss ? 0.25 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.4);
      const targets = [t]; if (tier >= 3) { const n = opponents(w, u).filter((o) => o !== t && dist(u.x, u.y, o.x, o.y) < u.def.range + 40)[0]; if (n) targets.push(n); }
      targets.forEach((e) => shoot(w, u, ang(u, e), { kind: 'bomb', speed: 520, r: 8, dmg: dmgOf(u, 0.4), knock: 10, extra: { home: e, turn: 5, onHit: (w2, p, x) => {
        x.sticky = true; k2(w2, { draw: 'sticky', unit: x, x: x.x, y: x.y, r: x.vr, max: 2, ab: 'stickyBomb' });
        timer(u, 'sticky' + x.id, 2, null, () => { x.sticky = false; blast(w, u, x.x, x.y, tierOf(u, 'stickyBomb') >= 2 ? 100 : 72, 1.9, {}, 'stickyBomb'); });
      } } }));
    },
    show: { far: true },
  },
  blastOff: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 90).length ? 0.85 : 0),
    use(w, u, t, tier) {
      const f = foesNear(w, u, u.x, u.y, 160); let ax = 0, ay = 0; for (const e of f) { ax += u.x - e.x; ay += u.y - e.y; }
      const a = f.length ? Math.atan2(ay, ax) : u.facing + Math.PI;
      blast(w, u, u.x, u.y, 95, 0.9, { stagger: tier >= 2 ? 45 : 0 }, 'blastOff');
      const x1 = clamp(u.x + Math.cos(a) * 190, u.r, w.W - u.r), y1 = clamp(u.y + Math.sin(a) * 190, u.r, w.H - u.r);
      u.invulnT = Math.max(u.invulnT, 0.55);
      u.act = { type: 'leap', t: 0.5, max: 0.5, x0: u.x, y0: u.y, x1, y1, land: () => { if (tierOf(u, 'blastOff') >= 3) blast(w, u, u.x, u.y, 75, 0.7, {}, 'blastOff'); puff(w, u.x, u.y, '#E9DDC2', 8, 90, 5, 0.4); } };
    },
  },
  // ----- Harpooner
  reelIn: {
    score(w, u) { return opponents(w, u).some((e) => { const d = dist(u.x, u.y, e.x, e.y); return d > 150 && d < 380 && !blocked(w, u.x, u.y, e.x, e.y); }) ? 0.6 : 0; },
    use(w, u, t, tier) {
      const e = opponents(w, u).filter((o) => { const d = dist(u.x, u.y, o.x, o.y); return d > 120 && d < 400 && !blocked(w, u.x, u.y, o.x, o.y); }).sort((p, q) => (q.def.role === 'ranged' ? 1 : 0) - (p.def.role === 'ranged' ? 1 : 0))[0] || t; if (!e) return;
      cast(u, 'throw', 0.4);
      shoot(w, u, ang(u, e), { kind: 'harpoon', speed: 720, r: 9, life: 0.7, dmg: dmgOf(u, 2), knock: 0, extra: { big: true, home: e, turn: 6, onHit: (w2, p, x) => {
        const big = x.def.boss || x.mass > 2.6;
        if (big) { const a = ang(u, x), d = dist(u.x, u.y, x.x, x.y) - u.r - x.r - 6; u.act = { type: 'leap', t: 0.35, max: 0.35, x0: u.x, y0: u.y, x1: u.x + Math.cos(a) * d, y1: u.y + Math.sin(a) * d, land: () => {} }; }
        else { const a = angleTo(x.x, x.y, u.x, u.y), d = dist(u.x, u.y, x.x, x.y) - u.r - x.r - 6; x.kx += Math.cos(a) * d * 5.4 / Math.max(1, Math.sqrt(x.mass)); x.ky += Math.sin(a) * d * 5.4 / Math.max(1, Math.sqrt(x.mass)); }
        if (tier >= 2) addStatus(w2, x, 'stagger', 55, u);
        k2(w2, { draw: 'rope', from: u, to: x, x: u.x, y: u.y, max: tier >= 3 ? 4 : 0.5, ab: 'reelIn' });
        if (tier >= 3 && !big) timer(u, 'tether', 4, () => { if (!alive(x)) return true; const d = dist(u.x, u.y, x.x, x.y); if (d > 140) { const a = angleTo(x.x, x.y, u.x, u.y); x.x += Math.cos(a) * (d - 140) * 0.3; x.y += Math.sin(a) * (d - 140) * 0.3; } });
      } } });
    },
    show: { far: true, single: true },
  },
  rogueWave: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 200).filter((e) => inFront(u, e, 1.4)).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (t) u.facing = ang(u, t); cast(u, 'cast', 0.5);
      const a = u.facing, R = tier >= 2 ? 250 : 190, arc = tier >= 2 ? 1.6 : 1.2;
      k2(w, { draw: 'wave', x: u.x, y: u.y, a, r: R, arc, max: 0.7, ab: 'rogueWave' });
      for (const e of foesNear(w, u, u.x, u.y, R)) if (inFront(u, e, arc + 0.2)) { addStatus(w, e, 'wet', 60, u); hurt(w, e, dmgOf(u, 1.1), u, { knock: 340, kAngle: a, noDodge: true }); }
      if (tier >= 3) for (const d of [80, 140, 200]) w.hazards.push({ type: 'water', x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d, r: 44, t: 8, max: 8 });
    },
  },
  anchorDrop: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && foesNear(w, u, t.x, t.y, 100).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'ability', 0.7);
      const x = t.x, y = t.y, r = tier >= 2 ? 115 : 85;
      if (tier >= 3) { setAnim(u, 'spin', 0.4); u.spin = { t0: w.time, dur: 0.4, dir: 1 }; ring(w, u, u.x, u.y, 130, dmgOf(u, 0.6), { knock: 240 }, '#8A94A6'); }
      k2(w, { draw: 'anchor', from: u, x, y, r, max: 0.65, ab: 'anchorDrop' });
      after(u, 0.55, () => {
        w.shake = Math.max(w.shake, 7);
        w.telegraphs.push({ type: 'blast', x, y, r, color: '#C9D2DE', t: 0.05, max: 0.05 });
        for (const e of foesNear(w, u, x, y, r)) { hurt(w, e, dmgOf(u, 2.8), u, { heavy: true, noDodge: true, knock: 150, kAngle: angleTo(x, y, e.x, e.y) }); stun(w, e, 1.2); }
      });
    },
    show: { far: true },
  },
  // ----- Javelin Huntress
  runningThrow: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 260 && t.target && t.target !== u ? 0.6 : t && dist(u.x, u.y, t.x, t.y) < 220 ? 0.3 : 0),
    use(w, u, t, tier) {
      if (!t) return;
      const side = rand() < 0.5 ? 1 : -1, b = angleTo(t.x, t.y, u.x, u.y) + side * 1.9, gx = clamp(t.x + Math.cos(b) * (t.r + u.r + 70), u.r, w.W - u.r), gy = clamp(t.y + Math.sin(b) * (t.r + u.r + 70), u.r, w.H - u.r);
      u.act = { type: 'dash', t: 0.28, max: 0.28, a: angleTo(u.x, u.y, gx, gy) };
      k2(w, { draw: 'streak', unit: u, x: u.x, y: u.y, a: u.act.a, max: 0.4, col: '#E0A060' });
      const throwIt = (big) => { if (!alive(t)) return; u.facing = ang(u, t); setAnim(u, 'throw', 0.3);
        shoot(w, u, ang(u, t), { kind: 'javelin', speed: 640, r: 7, dmg: dmgOf(u, 1.4) * 2, crit: true, knock: 140, st: { stagger: tierOf(u, 'runningThrow') >= 2 ? 45 : 0 }, extra: { big } }); };
      after(u, 0.3, () => throwIt(true));
      if (tier >= 3) after(u, 0.5, () => throwIt(false));
    },
    show: { far: true },
  },
  bound: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 95).length ? 0.85 : 0),
    use(w, u, t, tier) {
      const f = foesNear(w, u, u.x, u.y, 150); let ax = 0, ay = 0; for (const e of f) { ax += u.x - e.x; ay += u.y - e.y; }
      const a = f.length ? Math.atan2(ay, ax) : u.facing + Math.PI, x1 = clamp(u.x + Math.cos(a) * 170, u.r, w.W - u.r), y1 = clamp(u.y + Math.sin(a) * 170, u.r, w.H - u.r);
      u.act = { type: 'leap', t: 0.45, max: 0.45, x0: u.x, y0: u.y, x1, y1, land: () => puff(w, u.x, u.y, '#E9DDC2', 6, 70, 4, 0.35) };
      u.invulnT = Math.max(u.invulnT, 0.3);
      after(u, 0.2, () => { const e = t && alive(t) ? t : foesNear(w, u, u.x, u.y, 300)[0]; if (!e) return; u.facing = ang(u, e);
        shoot(w, u, ang(u, e), { kind: 'javelin', speed: 620, r: 7, dmg: dmgOf(u, 1.3), knock: 100, pierce: tierOf(u, 'bound') >= 2 ? 4 : 0 }); });
      if (tier >= 3) u.kit.cd.bound = Math.max(0, (u.kit.cd.bound || 0) - 2);
    },
  },
  prey: {
    score: (w, u) => { const e = foesNear(w, u, u.x, u.y, 380).sort((p, q) => hpRatio(p) - hpRatio(q))[0]; return e && hpRatio(e) < 0.6 && !(u.kit.prey && u.kit.prey.until > w.time) ? 0.65 : 0; },
    use(w, u, t, tier) {
      const e = foesNear(w, u, u.x, u.y, 400).sort((p, q) => hpRatio(p) - hpRatio(q))[0]; if (!e) return;
      cast(u, 'cast', 0.3); u.kit.prey = { e, until: w.time + 8 }; u.target = e;
      addBuff(u, { id: 'prey', dur: 8, move: 1.4 });
      k2(w, { draw: 'eye', unit: e, x: e.x, y: e.y, r: e.vr, max: 8, col: '#E0A060', ab: 'prey' });
    },
    hook: {
      dealt(w, u, t, amt) { const p = u.kit.prey; return p && p.e === t && p.until > w.time ? amt * 1.5 : amt; },
      tick(w, u) { const p = u.kit.prey; if (p && p.until > w.time && alive(p.e) && tierOf(u, 'prey') >= 2) u.target = p.e; },
      kill(w, u, v) { const p = u.kit.prey; if (p && p.e === v) { if (tierOf(u, 'prey') >= 3) heal(w, u, u.maxHp * 0.15, u); u.kit.prey = null; u.buffs = u.buffs.filter((b) => b.id !== 'prey'); } },
    },
    show: { single: true, attacks: true },
  },
  // ----- Marksman
  aimedShot: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && !blocked(w, u.x, u.y, t.x, t.y) && !foesNear(w, u, u.x, u.y, 110).length ? 0.6 + (t.elite || t.def.boss ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'shoot', 1.1);
      k2(w, { draw: 'aimLine', from: u, to: t, x: u.x, y: u.y, max: 0.9 });
      u.act = { type: 'channel', t: 0.9, max: 0.9, target: t, every: 0.9, acc: 0, tick: () => {} };
      after(u, 0.9, () => {
        if (!alive(u)) return; const e = t && alive(t) ? t : foesNear(w, u, u.x, u.y, u.def.range)[0]; if (!e) return;
        let first = true; u.recoilT = 0.2;
        k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: ang(u, e), max: 0.5 });
        shoot(w, u, ang(u, e), { kind: 'bullet', speed: 1400, r: 7, life: 0.6, dmg: dmgOf(u, 2.5), crit: true, knock: 220, pierce: tierOf(u, 'aimedShot') >= 2 ? 9 : 1, extra: { big: true, onHit: (w2, p, x) => {
          if (first && tierOf(u, 'aimedShot') >= 3) { const d = x.def.boss ? 0.6 : 1.5; x.koT = Math.max(x.koT || 0, d); stun(w2, x, d); } first = false; } } });
      });
    },
    show: { far: true, single: true },
  },
  bayonet: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, u.r + 55).length ? 0.85 : 0),
    use(w, u, t, tier) {
      const e = foesNear(w, u, u.x, u.y, u.r + 70).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0]; if (!e) return;
      u.facing = ang(u, e); setAnim(u, 'thrust', 0.35); u.kx += Math.cos(u.facing) * 120; u.ky += Math.sin(u.facing) * 120;
      hurt(w, e, dmgOf(u, 0.8), u, { knock: 420, heavy: true, noDodge: true, stagger: tier >= 2 ? 50 : 0 });
      k2(w, { draw: 'parry', x: e.x - Math.cos(u.facing) * e.r * 0.6, y: e.y - Math.sin(u.facing) * e.r * 0.6, a: u.facing, max: 0.3 });
      if (tier >= 3) after(u, 0.3, () => { if (!alive(e)) return; u.facing = ang(u, e); setAnim(u, 'shoot', 0.3); k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: u.facing, max: 0.4 }); shoot(w, u, u.facing, { kind: 'bullet', speed: 1300, r: 6, dmg: dmgOf(u, 1.2), knock: 120 }); });
    },
    show: { single: true },
  },
  ricochet: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range && foesNear(w, u, t.x, t.y, 220).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'shoot', 0.4); const hit = new Set();
      k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: ang(u, t), max: 0.4 });
      const fire = (x, y, e, k, left, skip) => {
        const a = angleTo(x, y, e.x, e.y);
        w.projectiles.push({ kind: 'bullet', x, y, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, r: 6, team: u.team, owner: u, skip, dmg: dmgOf(u, k), o: { knock: 90, ab: 'ricochet' }, life: 0.5, a, ab: 'ricochet', tier,
          onHit: (w2, p, hitE) => { hit.add(hitE); if (left <= 0) return; const n = opponents(w2, u).filter((o) => !hit.has(o) && dist(o.x, o.y, hitE.x, hitE.y) < 230).sort((p1, q) => dist(hitE.x, hitE.y, p1.x, p1.y) - dist(hitE.x, hitE.y, q.x, q.y))[0];
            sparks(w2, hitE.x, hitE.y, a, 4, '#FFF4C8', 1); if (n) fire(hitE.x, hitE.y, n, k * (tierOf(u, 'ricochet') >= 3 ? 1.25 : 0.85), left - 1, hitE); } });
      };
      fire(u.x + Math.cos(ang(u, t)) * u.r, u.y + Math.sin(ang(u, t)) * u.r, t, 1.3, tier >= 2 ? 5 : 3, null);
    },
    show: { far: true },
  },
  // ----- Ninja
  shurikenFan: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 220 ? 0.45 + 0.15 * foesNear(w, u, t.x, t.y, 90).length : 0),
    use(w, u, t, tier) {
      if (!t) return; const n = tier >= 2 ? 5 : 3, a0 = ang(u, t); setAnim(u, 'throw', 0.3);
      for (let i = 0; i < n; i++) shoot(w, u, a0 + (i - (n - 1) / 2) * 0.2, { kind: 'shuriken', speed: 560, r: 7, life: 0.8, dmg: dmgOf(u, 1.4), knock: 30, st: tier >= 3 ? { poison: 18 } : {}, extra: { big: true } });
      after(u, 0.18, () => {
        zone(w, { x: u.x, y: u.y, r: 46, dur: 1.2, kind: 'smoke', src: u, smoke: true });
        const s = rand() < 0.5 ? 1 : -1, b = a0 + s * Math.PI / 2 + Math.PI * 0.15 * s;
        u.x = clamp(u.x + Math.cos(b) * 110, u.r, w.W - u.r); u.y = clamp(u.y + Math.sin(b) * 110, u.r, w.H - u.r); u.vx = u.vy = 0;
        puff(w, u.x, u.y, '#5A5560', 10, 80, 7, 0.45);
      });
    },
    show: { far: true },
  },
  substitution: {
    passiveTier: true, score: () => 0, use() {},
    hook: {
      taken(w, u, src, amt, o) {
        const k = u.kit; if (o.dot || amt < u.maxHp * 0.07 || (k.subReady || 0) > w.time) return amt;
        const tier = tierOf(u, 'substitution'), cd = tier >= 3 ? 7 : 12; k.subReady = w.time + cd; k.cd.substitution = cd;
        k2(w, { draw: 'log', x: u.x, y: u.y, max: 1.4, ab: 'substitution' }); puff(w, u.x, u.y, '#5A5560', 12, 90, 7, 0.5);
        if (tier >= 2) for (const e of foesNear(w, u, u.x, u.y, 80)) addBuff(e, { id: 'logSmoke', dur: 2, blind: true });
        const a = src ? angleTo(src.x, src.y, u.x, u.y) + rrange(-0.6, 0.6) : rand() * TAU;
        u.x = clamp(u.x + Math.cos(a) * 120, u.r, w.W - u.r); u.y = clamp(u.y + Math.sin(a) * 120, u.r, w.H - u.r); u.vx = u.vy = 0; u.invulnT = Math.max(u.invulnT, 0.3);
        return 0;
      },
    },
    show: { hitme: true },
  },
  caltrops: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 110).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      setAnim(u, 'throw', 0.3); const x = u.x, y = u.y, r = tier >= 2 ? 100 : 72; let acc = 0;
      k2(w, { draw: 'caltrops', x, y, r, max: 5, ab: 'caltrops' });
      timer(u, 'caltrops', 5, (dt) => { acc += dt; if (acc < 0.3) return; acc -= 0.3;
        for (const e of foesNear(w, u, x, y, r)) { addBuff(e, { id: 'caltrops', dur: 0.4, move: 0.55 }); if (e.spd > 10) hurt(w, e, dmgOf(u, 0.35), u, { dot: true, poison: tierOf(u, 'caltrops') >= 3 ? 6 : 0, ab: 'caltrops' }); } });
    },
  },
  // ----- Pirate
  pointBlank: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, u.r + 60).length ? 0.6 : 0),
    use(w, u, t, tier) {
      const list = foesNear(w, u, u.x, u.y, u.r + 70).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y));
      const bang = (e, side) => { if (!e || !alive(e)) return; u.facing = ang(u, e); setAnim(u, 'shoot', 0.3);
        k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a: u.facing, max: 0.45, side });
        hurt(w, e, dmgOf(u, 2.2), u, { knock: 400, heavy: true, noDodge: true, stagger: tierOf(u, 'pointBlank') >= 2 ? 50 : 0 }); w.shake = Math.max(w.shake, 4); };
      bang(list[0] || t, 1);
      if (tier >= 3) after(u, 0.25, () => bang(list[1] || list[0], -1));
    },
    show: { single: true },
  },
  grog: {
    score: (w, u) => (hpRatio(u) < 0.5 && foesNear(w, u, u.x, u.y, 200).length ? 0.8 : 0),
    use(w, u, t, tier) {
      setAnim(u, 'ability', 0.5);
      heal(w, u, u.maxHp * (tier >= 3 ? 0.3 : 0.2), u);
      addBuff(u, { id: 'grog', dur: 5, taken: 0.8, knockImmune: tier >= 2, glow: '#E0A060' });
      k2(w, { draw: 'splash', x: u.x, y: u.y, r: 30, col: '#C8902A', max: 0.5 });
    },
  },
  broadside: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 340 && foesNear(w, u, t.x, t.y, 130).length >= 2 ? 0.7 : 0),
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.5);
      const n = tier >= 3 ? 5 : 3, cx = t.x, cy = t.y, r = tier >= 2 ? 75 : 58;
      for (let i = 0; i < n; i++) {
        const near = foesNear(w, u, cx, cy, 130), e = near[i % Math.max(1, near.length)];
        const x = e ? e.x + rrange(-15, 15) : cx + rrange(-80, 80), y = e ? e.y + rrange(-15, 15) : cy + rrange(-80, 80);
        after(u, 0.2 + i * 0.22, () => { k2(w, { draw: 'shell', x, y, r, max: 0.6, ab: 'broadside' }); after(u, 0.6, () => blast(w, u, x, y, r, 1.4, {}, 'broadside')); });
      }
    },
    show: { far: true },
  },
  // ----- Slinger
  stunStone: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < u.def.range ? 0.4 + (foeWinding(w, t) ? 0.45 : 0) : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'spin', 0.35); u.spin = { t0: w.time, dur: 0.35, dir: 1 };
      after(u, 0.3, () => { const e = t && alive(t) ? t : null; if (!e) return; setAnim(u, 'throw', 0.25);
        shoot(w, u, ang(u, e), { kind: 'stone', speed: 640, r: 7, dmg: dmgOf(u, 1.3), knock: 60, extra: { big: true, onHit: (w2, p, x) => {
          interrupt(w2, x); stun(w2, x, tierOf(u, 'stunStone') >= 2 ? 1 : 0.6); k2(w2, { draw: 'bonk', x: x.x, y: x.y, unit: x, r: x.vr, max: 0.6, ab: 'stunStone' });
          if (tierOf(u, 'stunStone') >= 3 && !p.bounced) { const n = opponents(w2, u).filter((o) => o !== x && dist(o.x, o.y, x.x, x.y) < 200)[0];
            if (n) { const b = angleTo(x.x, x.y, n.x, n.y); w2.projectiles.push({ kind: 'stone', x: x.x, y: x.y, vx: Math.cos(b) * 560, vy: Math.sin(b) * 560, r: 6, team: u.team, owner: u, skip: x, dmg: dmgOf(u, 0.8), o: { knock: 40 }, life: 0.5, a: b, bounced: true,
              onHit: (w3, p3, y3) => { stun(w3, y3, 0.6); } }); } }
        } } }); });
    },
    show: { far: true },
  },
  ramCharge: {
    score(w, u, t) { if (!t) return 0; const a = ang(u, t); return opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.35 && dist(u.x, u.y, e.x, e.y) < 380).length >= 2 ? 0.65 : 0; },
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'cast', 0.4);
      const run = (off) => {
        const a = ang(u, t), nx = -Math.sin(a) * off, ny = Math.cos(a) * off, x0 = u.x - Math.cos(a) * 40 + nx, y0 = u.y - Math.sin(a) * 40 + ny, hit = new Set(); let s = 0;
        const f = k2(w, { draw: 'ram', x: x0, y: y0, a, max: 1, ab: 'ramCharge' });
        timer(u, 'ram' + off, 0.95, (dt) => { s += 540 * dt; f.x = x0 + Math.cos(a) * s; f.y = y0 + Math.sin(a) * s;
          for (const e of foesNear(w, u, f.x, f.y, 34)) if (!hit.has(e)) { hit.add(e); const side = Math.sign(Math.sin(angleTo(f.x, f.y, e.x, e.y) - a)) || 1;
            hurt(w, e, dmgOf(u, 1), u, { knock: 380, kAngle: a + side * 0.7, heavy: true, noDodge: true, stagger: tierOf(u, 'ramCharge') >= 2 ? 50 : 0, ab: 'ramCharge' }); } });
      };
      run(0); if (tier >= 3) after(u, 0.2, () => run(46));
    },
    show: { far: true },
  },
  gravel: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 200 && foesNear(w, u, t.x, t.y, 90).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'throw', 0.35);
      const n = tier >= 3 ? 14 : 9, arc = tier >= 3 ? 1.3 : 0.9, a0 = ang(u, t);
      for (let i = 0; i < n; i++) shoot(w, u, a0 + (rand() - 0.5) * arc, { kind: 'stone', speed: rrange(460, 640), r: 5, life: 0.5, dmg: dmgOf(u, 0.4), knock: tier >= 2 ? 110 : 20 });
    },
    show: { far: true },
  },
  // ----- Trapper
  jawTrap: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && t.def.role !== 'ranged' && (u.kit.traps || 0) < 3 ? 0.55 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'throw', 0.35);
      const n = tier >= 3 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const k = 0.55 + i * 0.12, off = (i ? 40 : 0), a = ang(u, t) + Math.PI / 2;
        const x = u.x + (t.x - u.x) * k + Math.cos(a) * off, y = u.y + (t.y - u.y) * k + Math.sin(a) * off;
        u.kit.traps = (u.kit.traps || 0) + 1;
        lob(w, u, x, y, 'trapThrown', null, () => {
          const f = k2(w, { draw: 'trap', x, y, max: 14, ab: 'jawTrap' });
          timer(u, 'trap' + Math.round(x * 7 + y), 14, () => {
            const e = foesNear(w, u, x, y, 22)[0]; if (!e) return;
            const T = tierOf(u, 'jawTrap') >= 2 ? 3 : 2; e.rootT = Math.max(e.rootT || 0, e.def.boss ? T * 0.4 : T); e.x = x; e.y = y; e.vx = e.vy = 0;
            hurt(w, e, dmgOf(u, tierOf(u, 'jawTrap') >= 2 ? 1.6 : 1), u, { noDodge: true, knock: 0, ab: 'jawTrap' });
            f.snapT = f.t; f.max = f.t + T; f.held = e; return true;
          }, () => { u.kit.traps = Math.max(0, (u.kit.traps || 1) - 1); if (!f.snapT) f.max = Math.min(f.max, f.t + 0.3); });
        });
      }
    },
    show: { far: true, mob: 'walk' },
  },
  snareNet: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 280 && foesNear(w, u, t.x, t.y, 80).length >= 2 ? 0.65 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'throw', 0.4); const r = tier >= 2 ? 95 : 70;
      lob(w, u, t.x, t.y, 'net', null, (x, y) => {
        k2(w, { draw: 'netOn', x, y, r, max: 2, ab: 'snareNet' });
        for (const e of foesNear(w, u, x, y, r)) addStatus(w, e, 'entangle', tierOf(u, 'snareNet') >= 3 ? 120 : 65, u);
      });
    },
    show: { far: true },
  },
  tripwire: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) > 120 && dist(u.x, u.y, t.x, t.y) < 320 && foesNear(w, u, t.x, t.y, 120).length >= 2 ? 0.6 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'throw', 0.35);
      const a = ang(u, t), cx = u.x + (t.x - u.x) * 0.6, cy = u.y + (t.y - u.y) * 0.6, L = tier >= 2 ? 130 : 85, px = -Math.sin(a), py = Math.cos(a);
      const x1 = cx + px * L, y1 = cy + py * L, x2 = cx - px * L, y2 = cy - py * L, done = new Set();
      k2(w, { draw: 'wire', x: cx, y: cy, x1, y1, x2, y2, max: 7, ab: 'tripwire' });
      timer(u, 'tripwire', 7, () => { for (const e of opponents(w, u)) if (!done.has(e) && segDist(e.x, e.y, x1, y1, x2, y2) < e.r * 0.6 + 6) {
        done.add(e); const d = (tierOf(u, 'tripwire') >= 3 ? 1.6 : 1) * (e.def.boss ? 0.4 : 1); e.koT = Math.max(e.koT || 0, d); stun(w, e, d); interrupt(w, e);
        hurt(w, e, dmgOf(u, 0.5), u, { noDodge: true, knock: 60, ab: 'tripwire' }); k2(w, { draw: 'bonk', x: e.x, y: e.y, unit: e, r: e.vr, max: d, ab: 'tripwire' }); } });
    },
    show: { far: true, mob: 'walk' },
  },
  // ----- Gladiator
  netThrow: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 220 && !(t.rootT > 0) ? 0.55 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'throw', 0.35);
      const list = [t]; if (tier >= 3) { const n = opponents(w, u).filter((o) => o !== t && dist(u.x, u.y, o.x, o.y) < 240)[0]; if (n) list.push(n); }
      for (const e of list) shoot(w, u, ang(u, e), { kind: 'net', speed: 480, r: 12, life: 0.8, dmg: dmgOf(u, 0.6), knock: 0, extra: { home: e, turn: 4, onHit: (w2, p, x) => {
        const d = (tierOf(u, 'netThrow') >= 2 ? 3 : 2) * (x.def.boss ? 0.4 : 1); x.rootT = Math.max(x.rootT || 0, d); x.netUntil = w2.time + d;
        k2(w2, { draw: 'netOn', unit: x, x: x.x, y: x.y, r: x.r + 10, max: d, ab: 'netThrow' });
      } } });
    },
    hook: { dealt(w, u, t, amt) { return t.netUntil > w.time ? amt * 1.4 : amt; } },
    show: { far: true, single: true },
  },
  showboat: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 200).length >= 2 && hpRatio(u) > 0.35 ? 0.65 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.6); u.kit.showUntil = w.time + 3;
      for (const e of foesNear(w, u, u.x, u.y, 210)) { e.tauntBy = u; e.tauntT = 3; e.target = u; }
      addBuff(u, { id: 'showboat', dur: 3, taken: 0.7, glow: '#F2C14E' });
      if (tier >= 2) heal(w, u, u.maxHp * 0.15, u);
      k2(w, { draw: 'rally', unit: u, x: u.x, y: u.y, r: u.vr, max: 1, cols: ['#F2C14E', '#C8453D'] });
      k2(w, { draw: 'horn', unit: u, x: u.x, y: u.y, r: 200, max: 0.8 });
    },
    hook: {
      struck(w, u, src) {
        if (!(u.kit.showUntil > w.time) || tierOf(u, 'showboat') < 3 || !src || !alive(src) || w.time - (u.kit.showHit || -9) < 0.2) return;
        if (dist(u.x, u.y, src.x, src.y) - u.r - src.r > 60) return;
        u.kit.showHit = w.time; u.facing = angleTo(u.x, u.y, src.x, src.y); setAnim(u, 'thrust', 0.2);
        hurt(w, src, dmgOf(u, 0.9), u, { knock: 120, noDodge: true, proc: true, ab: 'showboat' });
      },
    },
    show: { hitme: true },
  },
  shieldRush: {
    score(w, u, t) { if (!t) return 0; const g = dist(u.x, u.y, t.x, t.y) - u.r - t.r; return g > 40 && g < 220 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.6 : 0; },
    use(w, u, t, tier) {
      if (!t) return; const a = ang(u, t), hit = new Set(); u.facing = a;
      u.act = { type: 'dash', t: 0.25, max: 0.25, a }; addBuff(u, { id: 'shieldRush', dur: 0.3, raise: true, frontBlock: 0.5 });
      k2(w, { draw: 'streak', unit: u, x: u.x, y: u.y, a, max: 0.4 });
      timer(u, 'shieldRush', 0.3, () => {
        if (tierOf(u, 'shieldRush') >= 2) for (const e of foesNear(w, u, u.x, u.y, u.r + 10)) if (e !== t && !hit.has(e)) { hit.add(e); hurt(w, e, dmgOf(u, 0.5), u, { knock: 260, kAngle: a + (Math.sin(ang(u, e) - a) > 0 ? 0.8 : -0.8), noDodge: true, ab: 'shieldRush' }); }
      }, () => {
        if (!alive(t) || dist(u.x, u.y, t.x, t.y) - u.r - t.r > 70) return;
        u.facing = ang(u, t); setAnim(u, 'thrust', 0.3);
        hurt(w, t, dmgOf(u, 2.2), u, { knock: 160, noDodge: true, heavy: true, ab: 'shieldRush' }); if (tierOf(u, 'shieldRush') >= 3) stun(w, t, 1);
      });
    },
    show: { far: true, single: true },
  },
  // ----- Jester
  mock: {
    score: (w, u) => (allies(w, u).some((a) => !a.summon && hpRatio(a) < 0.5 && opponents(w, u).some((e) => e.target === a && dist(u.x, u.y, e.x, e.y) < 240)) ? 0.85 : foesNear(w, u, u.x, u.y, 200).length >= 3 ? 0.45 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.6); const r = tier >= 2 ? 250 : 180; u.kit.mockUntil = w.time + 3;
      for (const e of foesNear(w, u, u.x, u.y, r)) { e.tauntBy = u; e.tauntT = 3; e.target = u; if (tier >= 3) addBuff(e, { id: 'mocked', dur: 3, atkSpeed: 0.7 }); }
      k2(w, { draw: 'bubble', unit: u, x: u.x, y: u.y, r: u.vr, max: 1, talk: true });
      k2(w, { draw: 'horn', unit: u, x: u.x, y: u.y, r, max: 0.8 });
    },
    hook: { evade(w, u, src, amt, o) { if (u.kit.mockUntil > w.time && !o.dot && rand() < 0.6) { puff(w, u.x, u.y, '#FFD45A', 6, 60, 4, 0.35); return true; } return false; } },
  },
  befuddle: {
    score: (w, u, t) => (t && !t.def.boss && !t.major && dist(u.x, u.y, t.x, t.y) < 220 && foesNear(w, u, t.x, t.y, 160).length >= 2 ? 0.6 + (t.elite ? 0.2 : 0) : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5);
      const list = (t && !t.def.boss && !t.major ? [t] : []).concat(tier >= 3 ? opponents(w, u).filter((o) => o !== t && !o.def.boss && !o.major && dist(u.x, u.y, o.x, o.y) < 240).slice(0, 1) : []);
      const dur = tier >= 2 ? 5 : 3.5;
      for (const e of list) {
        if (e.befuddled) continue;
        const was = e.team; e.befuddled = { was, until: w.time + dur }; e.team = u.team; e.target = null; e.tauntBy = null; e.tauntT = 0; e.aggro = true;
        k2(w, { draw: 'swirlStars', unit: e, x: e.x, y: e.y, r: e.vr, max: dur, ab: 'befuddle' });
        timer(u, 'befuddle' + e.id, dur, null, () => { if (e.befuddled) { e.team = e.befuddled.was; e.befuddled = null; e.target = null; } });
      }
    },
    hook: { fallen(w, u) { for (const e of w.units) if (e.befuddled) { e.team = e.befuddled.was; e.befuddled = null; e.target = null; } } },
    show: { far: true, single: true },
  },
  juggle: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 240).length >= 2 ? 0.55 : 0),
    use(w, u, t, tier) {
      setAnim(u, 'throw', 0.4); const n = tier >= 3 ? 5 : 3, foes = foesNear(w, u, u.x, u.y, 260); if (!foes.length) return;
      const ball = (x, y, e, left, skip, col) => {
        const a = angleTo(x, y, e.x, e.y);
        w.projectiles.push({ kind: 'ball', x, y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 7, team: u.team, owner: u, skip, dmg: dmgOf(u, 1.6), o: { knock: 70, ab: 'juggle' }, life: 0.7, a, ab: 'juggle', tier, color: col,
          onHit: (w2, p, h) => { if (tierOf(u, 'juggle') >= 2) addBuff(h, { id: 'dazed', dur: 2, move: 0.6 }); if (left <= 0) return;
            const nx = opponents(w2, u).filter((o) => o !== h && dist(o.x, o.y, h.x, h.y) < 200)[0]; if (nx) ball(h.x, h.y, nx, left - 1, h, col); } });
      };
      const cols = ['#C8453D', '#FFD45A', '#5B8CDB', '#7FCB3A', '#E05AB8'];
      for (let i = 0; i < n; i++) ball(u.x, u.y, foes[i % foes.length], 2, null, cols[i]);
    },
    show: { far: true },
  },
  // ----- Samurai
  iaido: {
    score(w, u, t) { if (!t) return 0; const a = ang(u, t); return dist(u.x, u.y, t.x, t.y) < 280 && lineClear(w, u.x, u.y, t.x, t.y, u.r) ? 0.4 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.35 && dist(u.x, u.y, e.x, e.y) < 300).length : 0; },
    use(w, u, t, tier) {
      if (!t) return;
      const go = (a) => {
        const x0 = u.x, y0 = u.y, cut = new Set(); u.facing = a;
        u.act = { type: 'dash', t: 0.24, max: 0.24, a }; u.invulnT = Math.max(u.invulnT, 0.3); setAnim(u, 'swing', 0.3);
        timer(u, 'iaido', 0.26, () => { for (const e of opponents(w, u)) if (!cut.has(e) && dist(u.x, u.y, e.x, e.y) < u.r + e.r + 14) { cut.add(e);
          const crit = tierOf(u, 'iaido') >= 2; hurt(w, e, dmgOf(u, 1.6) * (crit ? 2 : 1), u, { crit, noDodge: true, knock: 70, kAngle: a + Math.PI / 2, ab: 'iaido' }); } },
          () => k2(w, { draw: 'slashLine', x: x0, y: y0, x1: x0, y1: y0, x2: u.x, y2: u.y, max: 0.5, ab: 'iaido' }));
      };
      const a = ang(u, t); cast(u, 'ability', 0.2); after(u, 0.12, () => go(a));
      if (tier >= 3) after(u, 0.55, () => alive(u) && go(a + Math.PI));
    },
    show: { far: true },
  },
  focus: {
    score: (w, u, t) => (!u.kit.focus && t && (t.elite || t.def.boss || t.maxHp > 120) && dist(u.x, u.y, t.x, t.y) < 200 ? 0.7 : !u.kit.focus && foesNear(w, u, u.x, u.y, 200).length ? 0.35 : 0),
    use(w, u, t, tier) {
      cast(u, 'cast', 0.5); u.kit.focus = true;
      k2(w, { draw: 'gather', unit: u, x: u.x, y: u.y, r: 30, max: 0.6, col: '#FFFFFF' });
      k2(w, { draw: 'peace', unit: u, x: u.x, y: u.y, r: u.vr * 2, max: 1 });
      u.atkT = Math.min(u.atkT, 0.2);
    },
    hook: {
      dealt(w, u, t, amt, o) {
        if (!u.kit.focus || o.dot || o.shot || o.proc) return amt; u.kit.focus = false; o.crit = true;
        const tier = tierOf(u, 'focus');
        if (tier >= 2) for (const e of foesNear(w, u, u.x, u.y, u.r + 70)) if (e !== t) hurt(w, e, dmgOf(u, 1.5), u, { noDodge: true, knock: 140, kAngle: ang(u, e), proc: true, ab: 'focus' });
        if (tier >= 2) fx(w, { type: 'ring', x: u.x, y: u.y, r: u.r + 70, color: '#FFFFFF', max: 0.35, a: u.facing, unit: u });
        if (tier >= 3) heal(w, u, u.maxHp * 0.15, u);
        return amt * 3;
      },
    },
    show: { attacks: true },
  },
  crescentCut: {
    score(w, u, t) { if (!t || dist(u.x, u.y, t.x, t.y) > 320) return 0; const a = ang(u, t); return 0.3 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.4 && dist(u.x, u.y, e.x, e.y) < 340).length; },
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'swing', 0.35); const a0 = ang(u, t), n = tier >= 3 ? 3 : 1;
      after(u, 0.1, () => { for (let i = 0; i < n; i++) shoot(w, u, a0 + (i - (n - 1) / 2) * 0.3, { kind: 'crescent', speed: 620, r: 14, life: 0.55, pierce: 9, dmg: dmgOf(u, 1.4), knock: 120, st: { stagger: tierOf(u, 'crescentCut') >= 2 ? 40 : 0 } }); });
    },
    show: { far: true },
  },
  // ----- Valkyrie
  valkyrieCall: {
    score: (w, u) => (u.kit.callW !== w && w.units.some((a) => a.team === u.team && a.downed && !a.dead && !a.summon) ? 1 : 0),
    use(w, u, t, tier) {
      const d = w.units.filter((a) => a.team === u.team && a.downed && !a.dead && !a.summon).sort((p, q) => dist(u.x, u.y, p.x, p.y) - dist(u.x, u.y, q.x, q.y))[0]; if (!d) return;
      u.kit.callW = w; cast(u, 'cast', 0.7);
      fx(w, { type: 'pillar', x: d.x, y: d.y, r: 34, kind: 'holy', max: 0.6 });
      after(u, 0.3, () => { if (!d.downed || d.dead) return; cleanse(d); d.downed = false; d.reviveT = 0; d.hp = d.maxHp * (tier >= 2 ? 0.4 : 0.25); d.invulnT = tier >= 3 ? 2 : 1; d.revivedByKit = true;
        k2(w, { draw: 'rally', unit: d, x: d.x, y: d.y, r: d.vr, max: 1, ab: 'valkyrieCall' }); k2(w, { draw: 'wings', unit: d, x: d.x, y: d.y, r: d.r, max: 0.9, flap: true }); });
    },
    show: { ally: true, downed: true },
  },
  spearThrow: {
    score(w, u, t) { if (!t || dist(u.x, u.y, t.x, t.y) > 340 || blocked(w, u.x, u.y, t.x, t.y)) return 0; const a = ang(u, t); return 0.3 + 0.2 * opponents(w, u).filter((e) => angleDiff(ang(u, e), a) < 0.3 && dist(u.x, u.y, e.x, e.y) < 340).length; },
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'throw', 0.45); const a = ang(u, t); let last = null;
      after(u, 0.14, () => shoot(w, u, a, { kind: 'spear', speed: 680, r: 9, life: 0.55, pierce: 9, dmg: dmgOf(u, 1.4), knock: 120, st: { shock: tier >= 2 ? 30 : 0 }, extra: { onHit: (w2, p, e) => { last = e; } }, land: (p) => {
        if (last && alive(last) && tierOf(u, 'spearThrow') >= 3) { last.rootT = Math.max(last.rootT || 0, 1.5); k2(w, { draw: 'pin', unit: last, x: last.x, y: last.y, r: last.vr, a, max: 1.5, ab: 'spearThrow' }); }
        const b = angleTo(p.x, p.y, u.x, u.y);
        w.projectiles.push({ kind: 'spear', x: p.x, y: p.y, vx: Math.cos(b) * 700, vy: Math.sin(b) * 700, r: 9, team: u.team, owner: u, dmg: dmgOf(u, 0.7), o: { knock: 60, ab: 'spearThrow' }, life: 1.4, a: b, pierce: 9, hitSet: new Set(), home: u, turn: 14, catchBy: u, ab: 'spearThrow', tier });
      } }));
    },
    show: { far: true },
  },
  skyDive: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return d > 130 && d < 380 ? 0.55 + 0.15 * foesNear(w, u, t.x, t.y, 90).length : 0; },
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'ability', 0.7);
      const a = ang(u, t), x1 = t.x - Math.cos(a) * (u.r + t.r) * 0.6, y1 = t.y - Math.sin(a) * (u.r + t.r) * 0.6;
      k2(w, { draw: 'wings', unit: u, x: u.x, y: u.y, r: u.r, max: 0.7, flap: true });
      u.act = { type: 'leap', t: 0.65, max: 0.65, x0: u.x, y0: u.y, x1, y1, land: () => {
        w.shake = Math.max(w.shake, 7);
        if (alive(t)) hurt(w, t, dmgOf(u, 1.8), u, { heavy: true, noDodge: true, knock: 200, crit: true });
        ring(w, u, u.x, u.y, 95, dmgOf(u, 0.8), { knock: 240, stagger: tier >= 2 ? 45 : 0 }, '#EEF3F8');
        if (tier >= 3) heal(w, u, u.maxHp * 0.15, u);
      } };
      u.invulnT = Math.max(u.invulnT, 0.6);
    },
    show: { far: true },
  },
  // ----- Engineer
  deployTurret: {
    score: (w, u) => (foesNear(w, u, u.x, u.y, 380).length >= 2 && !w.units.some((o) => o.summonBy === u && o.kind === 'turret' && alive(o)) ? 0.75 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.7);
      const n = tier >= 3 ? 2 : 1, a0 = t ? ang(u, t) : u.facing;
      for (let i = 0; i < n; i++) {
        const a = a0 + (n > 1 ? (i ? -0.9 : 0.9) : 0), x = clamp(u.x + Math.cos(a) * (u.r + 40), 30, w.W - 30), y = clamp(u.y + Math.sin(a) * (u.r + 40), 30, w.H - 30);
        k2(w, { draw: 'gate', x, y, r: 24, max: 0.6, col: 'steel' });
        after(u, 0.35, () => {
          const s = spawn(w, 'turret', x, y, { team: u.team, hpMul: 1 });
          s.summon = true; s.summonBy = u; s.lifeT = tierOf(u, 'deployTurret') >= 2 ? 25 : 15; s.aggro = true; s.dmgMul = u.dmgMul; s.facing = a0; s.baseA = a0; s.mvA = a0;
          if (tierOf(u, 'deployTurret') >= 2) s.atkMul = 1.4;
          puff(w, x, y, '#C9D2DE', 10, 90, 5, 0.4);
        });
      }
    },
  },
  tinker: {
    score(w, u) {
      const tur = w.units.filter((o) => o.summonBy === u && o.kind === 'turret' && alive(o) && hpRatio(o) < 0.6).length;
      const a = hurtMost(allies(w, u).filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 260));
      return tur || (a && hpRatio(a) < 0.6) ? 0.7 : 0;
    },
    use(w, u, t, tier) {
      cast(u, 'swing', 0.4);
      for (const s of w.units) if (s.summonBy === u && s.kind === 'turret' && alive(s)) { s.hp = s.maxHp; if (tier >= 3) s.hitBurn = 8; k2(w, { draw: 'bonk', x: s.x, y: s.y, unit: s, r: s.vr, max: 0.4 }); fx(w, { type: 'beam', kind: 'lightning', x1: u.x, y1: u.y, x2: s.x, y2: s.y, max: 0.2 }); }
      const a = hurtMost([u, ...allies(w, u)].filter((o) => !o.summon && dist(u.x, u.y, o.x, o.y) < 280));
      if (a) { heal(w, a, a.maxHp * 0.12, u); if (tier >= 2) addBuff(a, { id: 'tinker', dur: 5, taken: 0.75, glow: '#C9D2DE' }); k2(w, { draw: 'crumbs', x: a.x, y: a.y, unit: a, max: 0.6 }); }
    },
    show: { ally: true },
  },
  shockMine: {
    score: (w, u, t) => (t && dist(u.x, u.y, t.x, t.y) < 300 && (u.kit.mines || 0) < 3 ? 0.5 : 0),
    use(w, u, t, tier) {
      if (!t) return; setAnim(u, 'throw', 0.35);
      for (let i = 0; i < (tier >= 3 ? 2 : 1); i++) {
        const a = ang(u, t) + (i ? 0.5 : 0), d = Math.min(dist(u.x, u.y, t.x, t.y) * 0.6, 160) + i * 20, x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d;
        u.kit.mines = (u.kit.mines || 0) + 1;
        lob(w, u, x, y, 'trapThrown', null, () => {
          const f = k2(w, { draw: 'mine', x, y, max: 15, ab: 'shockMine' });
          timer(u, 'mine' + Math.round(x * 7 + y), 15, () => {
            if (!foesNear(w, u, x, y, 40).length) return;
            w.telegraphs.push({ type: 'blast', x, y, r: 80, color: '#FFE66B', t: 0.05, max: 0.05, ab: 'shockMine' });
            for (const e of foesNear(w, u, x, y, 80)) { hurt(w, e, dmgOf(u, 1.3), u, { noDodge: true, knock: 160, kAngle: angleTo(x, y, e.x, e.y), shock: tierOf(u, 'shockMine') >= 2 ? 45 : 0, ab: 'shockMine' }); stun(w, e, 1); }
            fx(w, { type: 'pillar', x, y, r: 26, kind: 'lightning', max: 0.3 }); f.max = f.t; return true;
          }, () => { u.kit.mines = Math.max(0, (u.kit.mines || 1) - 1); f.max = Math.min(f.max, f.t + 0.2); });
        });
      }
    },
    show: { far: true, mob: 'walk' },
  },
  // ----- Werewolf
  turnWolf: {
    score: (w, u) => (!u.kit.wolfUntil && foesNear(w, u, u.x, u.y, 260).length >= 2 ? 0.8 : 0),
    use(w, u, t, tier) {
      const dur = tier >= 2 ? 14 : 10, human = u.def, beast = WOLF_FORM(u);
      if (!beast) return;
      u.kit.wolfUntil = w.time + dur; u.def = beast; setAnim(u, 'ability', 0.5); w.shake = Math.max(w.shake, 4);
      if (tier >= 2) heal(w, u, u.maxHp * 0.2, u);
      k2(w, { draw: 'roar', unit: u, x: u.x, y: u.y, r: 120, max: 0.6 }); puff(w, u.x, u.y, '#6E6A6A', 16, 130, 7, 0.6);
      timer(u, 'turnWolf', dur, null, () => { u.def = human; u.kit.wolfUntil = 0; puff(w, u.x, u.y, '#6E6A6A', 12, 100, 6, 0.5); });
    },
    hook: { hit(w, u, t, amt, o) { if (u.kit.wolfUntil > w.time && tierOf(u, 'turnWolf') >= 3 && !o.dot && !o.proc) addStatus(w, t, 'poison', 12, u); } },
  },
  frenzy: {
    score: (w, u, t) => (inReach(u, t, 30) ? 0.6 : 0),
    use(w, u, t, tier) {
      cast(u, 'ability', 0.4); u.kit.frenzy = { until: w.time + 6, n: 0, howled: false };
      addBuff(u, { id: 'frenzy', dur: 6, lifesteal: tier >= 2 ? 0.12 : 0, glow: '#C8453D' });
    },
    hook: {
      hit(w, u, t, amt, o) {
        const f = u.kit.frenzy; if (!f || f.until < w.time || o.dot || o.proc) return;
        f.n = Math.min(6, f.n + 1);
        if (f.n >= 6 && !f.howled && tierOf(u, 'frenzy') >= 3) { f.howled = true; for (const e of foesNear(w, u, u.x, u.y, 160)) addStatus(w, e, 'stagger', 60, u); k2(w, { draw: 'roar', unit: u, x: u.x, y: u.y, r: 160, max: 0.6, ab: 'frenzy' }); }
      },
      atkSpeed: (u) => { const f = u.kit && u.kit.frenzy; return f && f.until > (u._wt || 0) ? 1 + 0.1 * f.n : 1; },
      tick(w, u) { u._wt = w.time; },
    },
    show: { attacks: true, single: true },
  },
  pounce: {
    score(w, u, t) { if (!t) return 0; const d = dist(u.x, u.y, t.x, t.y); return d > 120 && d < 340 && !t.def.boss ? 0.6 : 0; },
    use(w, u, t, tier) {
      if (!t) return; cast(u, 'ability', 0.6); const a = ang(u, t);
      u.act = { type: 'leap', t: 0.45, max: 0.45, x0: u.x, y0: u.y, x1: t.x - Math.cos(a) * (u.r + t.r) * 0.7, y1: t.y - Math.sin(a) * (u.r + t.r) * 0.7, land: () => {
        if (!alive(t)) return; const d = (tier >= 2 ? 1.6 : 1) * (t.def.boss ? 0.4 : 1);
        hurt(w, t, dmgOf(u, 1.4), u, { noDodge: true, heavy: true, knock: 0 }); stun(w, t, d); t.rootT = Math.max(t.rootT || 0, d); interrupt(w, t);
        k2(w, { draw: 'bonk', x: t.x, y: t.y, unit: t, r: t.vr, max: d });
        if (tier >= 3) for (let i = 1; i <= 4; i++) after(u, i * d / 5, () => { if (alive(t)) { setAnim(u, 'swing', 0.15); hurt(w, t, dmgOf(u, 0.5), u, { noDodge: true, knock: 0, ab: 'pounce' }); } });
      } };
      u.invulnT = Math.max(u.invulnT, 0.4);
    },
    show: { far: true, single: true },
  },
};
// the Werewolf's other shape (units.js builds it from heroes2.js form and hangs it on the hero's def)
const WOLF_FORM = (u) => u.def.formDef || null;
// a bomb's blast at x, y: radius r, damage k x his own, extra hit options; drawn as the kit's blast
function blast(w, u, x, y, r, k, o, ab) {
  w.telegraphs.push({ type: 'blast', x, y, r, color: '#FFB347', t: 0.05, max: 0.05, ab });
  for (const e of foesNear(w, u, x, y, r)) hurt(w, e, dmgOf(u, k), u, { knock: 260, kAngle: angleTo(x, y, e.x, e.y), heavy: true, noDodge: true, blast: true, ...o, ab });
  w.shake = Math.max(w.shake, r > 90 ? 8 : 4);
}
// a lobbed thing (no hit on the way; it lands where it was thrown): kind, colour, land(x, y)
function lob(w, u, x, y, kind, color, land) {
  const d = Math.max(30, dist(u.x, u.y, x, y)), a = angleTo(u.x, u.y, x, y), sp = Math.max(260, d * 1.6);
  w.projectiles.push({ kind, x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 6, team: u.team, owner: u, dmg: 0, o: {}, life: d / sp, a, noHit: true, color, land: () => land(x, y) });
}

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
  ironWill: {
    tick(w, u) { if (hpRatio(u) < 0.3) { u.stunT = 0; u.koT = 0; u.st.stagger = 0; } },
    dealt(w, u, t, amt) { return hpRatio(u) < 0.3 ? amt * 1.25 : amt; },
  },
  lightFingers: { kill(w, u, v) { const c = v.def.coins; if (c && !v.summon) scatterCoins(w, v.x, v.y, Math.max(1, Math.round((c[0] + c[1]) / 4)), 0.8); } },
  fade: {
    evade(w, u) { const k = u.kit; if (w.time - (k.lastHurt ?? -9) > 3) { k.lastHurt = w.time; puff(w, u.x, u.y, '#5A4A7A', 10, 70, 6, 0.5); k.faded = w.time; return true; } return false; },
    taken(w, u, src, amt, o) { if (!o.dot) u.kit.lastHurt = w.time; return amt; },
  },
  hardWork: { kill(w, u) { heal(w, u, u.maxHp * 0.08, u); } },
  seenItAll: { tick(w, u, dt) { for (const a of friendsNear(w, u, u.x, u.y, 170)) if (a.st.stagger > 0) a.st.stagger = Math.max(0, a.st.stagger - 12 * dt); } },
  catalyst: {
    hit(w, u, t, amt, o) { if (o.proc) return; for (const s of BUILDS) if (o[s]) addStatus(w, t, s, o[s] * 0.3, u); },
  },
  ancestral: {
    allyDown(w, u, v) { if (v.summon) return; for (const a of [u, ...allies(w, u)]) if (a !== v && !a.summon) { heal(w, a, a.maxHp * 0.1, u); k2(w, { draw: 'rally', unit: a, x: a.x, y: a.y, r: a.vr, max: 0.8 }); } },
  },
  crone: { dealt(w, u, t, amt) { return t.st && t.st.curse > 5 ? amt * 1.4 : amt; } },
  infernal: { immune: ['burn'] },
  blackCandle: { tick(w, u, dt) { const k = u.kit; k.candleT = (k.candleT || 0) - dt; if (k.candleT > 0) return; k.candleT = 0.5; for (const e of foesNear(w, u, u.x, u.y, 120)) addStatus(w, e, 'curse', 5, u); } },
  deflect: {
    evade(w, u, src, amt, o) {
      if (!o.shot || !src || rand() > 0.4) return false;
      const a = o.kAngle != null ? o.kAngle + Math.PI : angleTo(u.x, u.y, src.x, src.y);
      if (angleDiff(a, u.facing) > 1.2) return false;
      sparks(w, u.x + Math.cos(u.facing) * u.r, u.y + Math.sin(u.facing) * u.r, u.facing, 5, '#FFF4C8', 1); setAnim(u, 'punch', 0.15); return true;
    },
  },
  thirdEye: {
    tick(w, u) { if (u.buffs.some((b) => b.blind)) u.buffs = u.buffs.filter((b) => !b.blind); },
    evade(w, u, src, amt, o) { if (o.dot || rand() > 0.15) return false; puff(w, u.x, u.y, '#C9B8FF', 6, 60, 4, 0.35); return true; },
  },
  wellStocked: {
    tick(w, u, dt) {
      const k = u.kit; k.stockT = (k.stockT ?? 20) - dt; if (k.stockT > 0) return;
      const a = friendsNear(w, u, u.x, u.y, 220).find((o) => !o.summon && !o.potions); if (!a) { k.stockT = 2; return; }
      k.stockT = 120; a.potions = 1; k2(w, { draw: 'crumbs', x: a.x, y: a.y, unit: a, max: 0.6 });
    },
  },
  armourPiercing: { dealt(w, u, t, amt) { return t.elite || t.major || t.def.boss ? amt * 1.25 : amt; } },
  birdsEye: { tick(w, u) { if (u.kit.birdsEye) return; u.kit.birdsEye = true; u.def = { ...u.def, range: u.def.range * 1.25, keep: (u.def.keep || 150) * 1.15 }; } },
  demolition: { dealt(w, u, t, amt, o) { if (o.blast && o.knock) o.knock *= 2; return amt; } },
  oldSalt: { immune: ['wet'], dealt(w, u, t, amt) { return t.st && t.st.wet > 20 ? amt * 1.2 : amt; } },
  handy: { tick(w, u) { for (const s of w.units) if (s.summonBy === u && alive(s)) addBuff(s, { id: 'handy', dur: 0.3, taken: 0.7 }); } },
  moonblood: { tick(w, u, dt) { if (foesNear(w, u, u.x, u.y, 260).length) heal(w, u, u.maxHp * 0.01 * dt, u); } },
  finisher: { dealt(w, u, t, amt) { return hpRatio(t) < 0.5 ? amt * 1.25 : amt; } },
  deadeye: { dealt(w, u, t, amt, o) { if (!o.dot && t.hp >= t.maxHp * 0.999) { o.crit = true; return amt * 2; } return amt; } },
  assassin: { dealt(w, u, t, amt, o) { return o.shot && angleDiff(angleTo(t.x, t.y, u.x, u.y), t.facing) > 1.9 ? amt * 1.5 : amt; } },
  dirtyFighting: { dealt(w, u, t, amt) { return (t.st.stagger || 0) > 30 || t.stunT > 0 || t.rootT > 0 || t.koT > 0 || t.buffs.some((b) => b.move && b.move < 1) ? amt * 1.3 : amt; } },
  watchful: { tick(w, u, dt) { for (const a of friendsNear(w, u, u.x, u.y, 170)) { if (a.stunT > 0) a.stunT = Math.max(0, a.stunT - 0.4 * dt); if (a.sleepT > 0) a.sleepT = Math.max(0, a.sleepT - 0.4 * dt); } } },
  trappersEye: { dealt(w, u, t, amt) { return t.rootT > 0 || t.tangledT > 0 || t.koT > 0 ? amt * 1.3 : amt; } },
  arena: { dealt(w, u, t, amt) { return amt * (1 + Math.min(0.25, 0.05 * foesNear(w, u, u.x, u.y, 160).length)); } },
  pratfall: {
    downed(w, u) { if (u.kit.pratW === w) return false; u.kit.pratW = w; u.hp = Math.max(1, u.maxHp * 0.1); u.invulnT = 1; setAnim(u, 'spin', 0.5); u.spin = { t0: w.time, dur: 0.5, dir: 1 }; puff(w, u.x, u.y, '#FFD45A', 10, 90, 5, 0.5); return true; },
  },
  bushido: { atkSpeed: (u) => (hpRatio(u) < 0.35 ? 1.4 : 1) },
  chooser: { reviveRate: 2, reviveHp: 0.3 },
  wellFed: { tick(w, u, dt) { for (const a of friendsNear(w, u, u.x, u.y, 150)) if (!a.summon) heal(w, a, a.maxHp * 0.005 * dt, u); } },
  beeFriend: {
    tick(w, u, dt) {
      const k = u.kit; k.beeT = (k.beeT || 0) - dt; if (k.beeT > 0) return; k.beeT = 0.9;
      const e = foesNear(w, u, u.x, u.y, 100)[0]; if (!e) return;
      hurt(w, e, dmgOf(u, 0.35), u, { noDodge: true, knock: 5, proc: true }); k2(w, { draw: 'beeZip', x: u.x, y: u.y, from: u, to: e, max: 0.35 });
    },
  },
  prospector: {
    tick(w, u, dt) {
      const k = u.kit; if (!opponents(w, u).length) return;
      k.digT = (k.digT ?? 4) - dt; if (k.digT > 0) return; k.digT = 7;
      scatterCoins(w, u.x, u.y, 1, 0.5); puff(w, u.x, u.y, '#9C7650', 6, 60, 5, 0.4);
    },
  },
};
// Old Guard's Pommel Strike III: his next blow on the struck enemy is a critical hit (he has no Grace)
TRAITS2.oldSoldier.dealt = (w, u, t, amt, o) => { if (!o.dot && u.kit.pommelMark === t) { u.kit.pommelMark = null; o.crit = true; return amt * 2; } return amt; };

// ---------------------------------------------------------------- the heroes' own attacks (ranged heroes)
const A = (u, k) => dmgOf(u, k);
export const ATTACKS2 = {
  // a lobbed flask that splashes; each one a different brew: fire, frost, acid in turn
  alchemist(w, u, t, a) {
    const k = u.kit, b = k.brew3 = ((k.brew3 ?? -1) + 1) % 3, st = [{ burn: 14 }, { chill: 16 }, { poison: 14 }][b], col = ['#FF8A3D', '#9FDDF6', '#C8E63C'][b];
    shoot(w, u, a, { kind: 'flask', speed: 400, r: 7, life: 1, dmg: A(u, 0.85), color: col, knock: 20, land: (p) => {
      for (const e of opponents(w, u)) if (dist(p.x, p.y, e.x, e.y) < 38 + e.r) hurt(w, e, A(u, 0.3), u, { noDodge: true, ...st, kAngle: angleTo(p.x, p.y, e.x, e.y), knock: 30 });
      k2(w, { draw: 'splash', x: p.x, y: p.y, r: 38, col, max: 0.4 });
    } });
  },
  // a teal spirit; a share of what it deals mends the most hurt ally
  shaman(w, u, t, a) {
    shoot(w, u, a, { kind: 'spirit', speed: 430, r: 7, dmg: A(u, 1), color: '#7FE0D0', knock: 25, extra: { onHit: (w2, p) => {
      const h = hurtMost([u, ...allies(w2, u)].filter((o) => !o.summon)); if (h && hpRatio(h) < 1) { heal(w2, h, p.dmg * 0.35, u); h.mendGlow = w2.time + 0.3; }
    } } });
  },
  // a wobbling green spark that curves after its target
  witch(w, u, t, a) {
    shoot(w, u, a + rrange(-0.35, 0.35), { kind: 'hexbolt', speed: 360, r: 7, life: 1.4, dmg: A(u, 1), knock: 25, extra: { home: t, turn: 3.5 } });
  },
  // a crystal mote that glances off onto a second enemy
  seer(w, u, t, a) {
    shoot(w, u, a, { kind: 'glimmer', speed: 480, r: 6, dmg: A(u, 0.9), knock: 20, extra: { onHit: (w2, p, e) => {
      const n = opponents(w2, u).filter((o) => o !== e && dist(o.x, o.y, e.x, e.y) < 200).sort((p1, q) => dist(e.x, e.y, p1.x, p1.y) - dist(e.x, e.y, q.x, q.y))[0]; if (!n) return;
      const b = angleTo(e.x, e.y, n.x, n.y);
      w2.projectiles.push({ kind: 'glimmer', x: e.x, y: e.y, vx: Math.cos(b) * 480, vy: Math.sin(b) * 480, r: 5, team: u.team, owner: u, skip: e, dmg: A(u, 0.55), o: { knock: 15 }, life: 0.5, a: b });
    } } });
  },
  // a bee buzzing after the target
  beekeeper(w, u, t, a) {
    shoot(w, u, a + rrange(-0.4, 0.4), { kind: 'bee', speed: 320, r: 6, life: 1.6, dmg: A(u, 0.95), knock: 10, extra: { home: t, turn: 6 } });
  },
  // a pot or a pan out of the pack
  quartermaster(w, u, t, a) { shoot(w, u, a, { kind: 'pot', speed: 430, r: 8, dmg: A(u, 1), knock: 70 }); },
  // a heavy bolt through the first enemy; after Crank Up it bursts
  crossbowman(w, u, t, a) {
    const k = u.kit, boom = k.crank > 0; if (boom) k.crank--;
    shoot(w, u, a, { kind: 'cbolt', speed: 720, r: 7, dmg: A(u, 1), knock: 50, pierce: 1, extra: { boom, onHit: boom ? (w2, p, e) => { if (p.boomed) return; p.boomed = true; blast(w2, u, e.x, e.y, k.crankR || 55, 0.6, { knock: 160 }, 'crankUp'); } : null } });
  },
  // a thrown hunting knife; under Keen Eye some land just right
  falconer(w, u, t, a) {
    const keen = u.kit.keenUntil > w.time && rand() < (tierOf(u, 'keenEye') >= 3 ? 0.5 : 0.3);
    shoot(w, u, a, { kind: 'dagger', speed: 560, r: 6, dmg: A(u, 1) * (keen ? 2 : 1), crit: keen, knock: 30, extra: { big: keen } });
  },
  // a small lobbed bomb that bursts where it lands
  grenadier(w, u, t, a) {
    const x = t.x + (t.vx || 0) * 0.3, y = t.y + (t.vy || 0) * 0.3;
    lob(w, u, x, y, 'bomb', null, () => blast(w, u, x, y, 50, 1.1, { knock: 150, heavy: false }, null));
  },
  // a thrown barbed harpoon on its rope
  harpooner(w, u, t, a) { shoot(w, u, a, { kind: 'harpoon', speed: 620, r: 7, life: 0.6, dmg: A(u, 1), knock: 40 }); },
  // a hard-thrown javelin
  huntress(w, u, t, a) { shoot(w, u, a, { kind: 'javelin', speed: 600, r: 7, dmg: A(u, 1), knock: 110 }); },
  // one long, hard musket shot
  marksman(w, u, t, a) { k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a, max: 0.45 }); shoot(w, u, a, { kind: 'bullet', speed: 1200, r: 6, life: 0.6, dmg: A(u, 1), knock: 120 }); },
  // a shuriken from either hand
  ninja(w, u, t, a) { shoot(w, u, a + rrange(-0.05, 0.05), { kind: 'shuriken', speed: 560, r: 6, life: 0.7, dmg: A(u, 1), knock: 15 }); },
  // a whirl and a stone
  slinger(w, u, t, a) { shoot(w, u, a, { kind: 'stone', speed: 580, r: 6, dmg: A(u, 1), knock: 50 }); },
  // a rifle shot
  trapper(w, u, t, a) { k2(w, { draw: 'muzzle', unit: u, x: u.x, y: u.y, a, max: 0.4 }); shoot(w, u, a, { kind: 'bullet', speed: 1100, r: 6, life: 0.6, dmg: A(u, 1), knock: 80 }); },
  // a magenta pact bolt: a third of what it deals heals him
  warlock(w, u, t, a) {
    shoot(w, u, a, { kind: 'bolt', speed: 470, r: 7, dmg: A(u, 1), color: '#E05AB8', knock: 25, extra: { onHit: (w2, p) => heal(w2, u, p.dmg * 0.33, u) } });
  },
};

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
  // Spirit Link: what each linked one lost since the last step is shared out evenly among them
  const L = u.kit.link;
  if (L) {
    if (L.until < w.time) u.kit.link = null;
    else {
      const live = L.group.map((a, i) => ({ a, i })).filter(({ a }) => alive(a));
      let lost = 0; for (const { a, i } of live) lost += Math.max(0, L.hp[i] - a.hp);
      if (lost > 0 && live.length > 1) { const share = lost / live.length; for (const { a, i } of live) a.hp = Math.min(a.maxHp, Math.max(1, a.hp + Math.max(0, L.hp[i] - a.hp) - share)); }
      L.hp = L.group.map((a) => a.hp);
    }
  }
  // Pitch Hay II: dry hay burns: burn builds twice as fast on those it covers
  if (u.kit.hayed) {
    for (const h of u.kit.hayed) { const b = h.e.st.burn || 0; if (b > h.last && alive(h.e)) h.e.st.burn = b + (b - h.last); h.last = h.e.st.burn || 0; }
    u.kit.hayed = u.kit.hayed.filter((h) => h.until > w.time && alive(h.e));
  }
  // the Stormhammer comes back to his hand
  for (const p of w.projectiles) if (p.catchBy === u && dist(p.x, p.y, u.x, u.y) < u.r + 8) p.life = 0;
}
