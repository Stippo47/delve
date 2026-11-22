// Round 13 (lane S): the Enchantress, the charming hero (the designer: "Add a charming hero. New charm status, can't
// hurt who is charming them, burst effect makes them fight for you for a bit"). Her data is in heroes2.js (enchantress);
// kits.js merges these. Each ability uses charm a different way:
//   Heartstring  ONE enemy: a thread pulls it out of its pack while charm pours into it, so a chosen threat turns
//   Sweetheart   charm as a DEFENCE for a friend: whoever keeps hitting the beloved falls for it (and can't hit it)
//   Heartbreak   the PAYOFF: every heart she has won breaks at once (damage and a swoon for the smitten, a blast
//                among their own friends for the enthralled)
// Trait, First Impression: the first blow an enemy lands on her charms it a lot (so it soon can't hit her again).
// Looks: fx-status.js (the 'kiss' shot, the thread, the beloved's mark, the breaking hearts).
import { dist, angleTo, rand, clamp } from './util.js';
import { hurt, alive, opponents, allies, stun, addBuff, fx, puff, restoreSide, setAnim } from './sim.js';
import { foesNear, friendsNear, dmgOf, cast, heal, addStatus, shoot } from './kits.js';

const tierOf = (u, id) => (u.kit && u.kit.tiers[id]) || 0;
const sfx = (w, o) => fx(w, { type: 'statusBurst', ...o });
const charmed = (e) => ((e.st.charm || 0) > 10 || e.flipKind === 'charm') && !e.follower; // (round 14: a follower, won for good when its room fell, is not hers to break)
// the one worth turning: the most dangerous foe in reach (elites, majors, big blows) not already hers
function threat(w, u, r) {
  let best = null, bs = 0;
  for (const e of foesNear(w, u, u.x, u.y, r)) {
    if (e.flipKind === 'charm' || e.charmImmuneT > 0 || e.def.boss || e.def.part || e.mini || e.floorFoe) continue; // (round 14: bosses take no charm)
    const s = (e.def.dmg || 5) * (e.dmgMul || 1) * (e.major ? 2.2 : e.elite ? 1.6 : 1) * (e.def.boss ? 0.4 : 1) + e.maxHp * 0.02;
    if (s > bs) { bs = s; best = e; }
  }
  return best;
}

export const CHARM_ABILITIES = {
  heartstring: {
    score: (w, u) => { const e = threat(w, u, 300); return !u.kit.string && e ? 0.55 + (e.elite || e.major ? 0.3 : 0) : 0; },
    use(w, u, t, tier) {
      const e = threat(w, u, 320); if (!e) return;
      cast(u, 'cast', 0.5);
      tie(w, u, e, tier >= 2 ? 6 : 4, tier >= 3 ? 1 : 0);
    },
  },
  sweetheart: {
    score: (w, u) => { const a = beloved(w, u); return a ? 0.75 : 0; },
    use(w, u, t, tier) {
      const a = beloved(w, u); if (!a) return;
      cast(u, 'cast', 0.45);
      const list = [a];
      if (tier >= 3) { const b = [u, ...allies(w, u)].filter((o) => o !== a && !o.summon && dist(u.x, u.y, o.x, o.y) < 320).sort((p, q) => hits(w, q) - hits(w, p))[0]; if (b) list.push(b); }
      const dur = tier >= 2 ? 8 : 6;
      for (const o of list) {
        addBuff(o, { id: 'beloved', dur, charmBack: 16 }); // sim.js hurt: a blow on it charms the striker towards it
        if (tier >= 2) heal(w, o, o.maxHp * 0.1, u);
        sfx(w, { kind: 'kissTo', from: u, unit: o, x: u.x, y: u.y, x2: o.x, y2: o.y, max: 0.5 });
      }
    },
  },
  heartbreak: {
    score: (w, u) => { const n = opponentsCharmed(w, u).length; return n >= 2 ? 0.5 + 0.15 * n : n === 1 && opponents(w, u).length <= 2 ? 0.5 : 0; },
    use(w, u, t, tier) {
      const list = opponentsCharmed(w, u); if (!list.length) return;
      cast(u, 'ability', 0.6);
      sfx(w, { kind: 'heartbreakCast', unit: u, x: u.x, y: u.y, r: u.vr, max: 0.6 });
      let n = 0;
      for (const e of list) {
        n++;
        sfx(w, { kind: 'heartbreak', unit: e, x: e.x, y: e.y, r: e.vr, max: 0.9 });
        if (e.flipKind === 'charm') { // enthralled: the thrall ends in a burst among its own friends
          const side = e.trueTeam, x = e.x, y = e.y;
          restoreSide(w, e); e.charmImmuneT = 6; stun(w, e, 0.8);
          for (const o of w.units) if (o !== e && alive(o) && o.team === side && !o.ethereal && dist(x, y, o.x, o.y) < 90 + o.r) hurt(w, o, dmgOf(u, 1.6), u, { noDodge: true, knock: 160, kAngle: angleTo(x, y, o.x, o.y) });
        } else { // smitten: the more it was charmed, the harder it breaks
          const f = clamp(e.st.charm / 100, 0, 1);
          e.st.charm = 0;
          hurt(w, e, dmgOf(u, 1 + 1.6 * f), u, { noDodge: true });
          stun(w, e, tier >= 2 ? 1.6 : 1);
        }
      }
      if (tier >= 3) for (const a of [u, ...allies(w, u)]) if (!a.summon) heal(w, a, a.maxHp * 0.04 * Math.min(4, n), u);
    },
  },
};
// The thread: charm pours into it, and it is drawn out of its pack towards her. Breaks if it gets too far, or once
// it has turned (tier III: it jumps on to the next threat once).
function tie(w, u, e, dur, jumps) {
  u.kit.string = { e, until: w.time + dur, jumps };
  sfx(w, { kind: 'heartstring', from: u, unit: e, x: e.x, y: e.y, max: dur });
}
export function charmTick(w, u, dt) {
  const s = u.kit && u.kit.string; if (!s) return;
  const e = s.e, done = !alive(e) || !alive(u) || w.time > s.until || dist(u.x, u.y, e.x, e.y) > 420 || e.team === u.team;
  if (done) {
    for (const f of w.fx) if (f.kind === 'heartstring' && f.from === u && f.unit === e) f.max = Math.min(f.max, f.t + 0.15);
    u.kit.string = null;
    if (e.team === u.team && s.jumps > 0) { const n = threat(w, u, 320); if (n) tie(w, u, n, Math.max(2, s.until - w.time), s.jumps - 1); }
    return;
  }
  addStatus(w, e, 'charm', 30 * dt, u);
  if (!e.def.boss && !e.rootT) { const a = angleTo(e.x, e.y, u.x, u.y), d = dist(u.x, u.y, e.x, e.y); if (d > u.r + e.r + 60) { e.kx += Math.cos(a) * 120 * dt / (e.mass || 1); e.ky += Math.sin(a) * 120 * dt / (e.mass || 1); } }
}
const hits = (w, a) => opponents(w, a).filter((e) => e.target === a).length;
function beloved(w, u) {
  let best = null, bs = 1;
  for (const a of [u, ...allies(w, u)]) { if (a.summon || a.buffs.some((b) => b.id === 'beloved')) continue; const n = hits(w, a); if (dist(u.x, u.y, a.x, a.y) < 340 && n > bs) { bs = n; best = a; } }
  return best;
}
const opponentsCharmed = (w, u) => w.units.filter((e) => alive(e) && !e.ethereal && (e.trueTeam || e.team) !== u.team && charmed(e) && dist(u.x, u.y, e.x, e.y) < 300);

export const CHARM_TRAITS = {
  firstImpression: {
    struck(w, u, src) {
      if (!src || src === u || src.team === u.team || !src.st) return;
      const seen = u.kit.seen || (u.kit.seen = new Set()); if (seen.has(src.id)) return; seen.add(src.id);
      addStatus(w, src, 'charm', 45, u);
    },
  },
};
export const CHARM_ATTACKS = {
  // a blown kiss: a slow heart that floats to its target and charms a little
  enchantress(w, u, t, a) {
    setAnim(u, 'cast', 0.35);
    shoot(w, u, a, { kind: 'kiss', speed: 330, r: 8, dmg: dmgOf(u, 1), color: '#FF8AC8', knock: 10, st: { charm: 14 } });
  },
};
