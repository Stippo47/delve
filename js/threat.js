// What is about to land on a unit, and who is on it (round 16 fixes, docs/audit/fixes16.md). The designer: "balance
// weaker abilities by how often they fire and if they fire in the right circumstances. Like a dodge roll only firing
// when they are actively about to take damage." Kits read these in their scores: a dodge goes when a blow is coming, a
// guard or a rescue when a friend is actually being hit. Reads only; it changes nothing.
//
// threatened(w, u, horizon): the soonest thing that will hit u within `horizon` seconds, or null:
//   { t, kind: 'melee' | 'charge' | 'shot' | 'zone', x, y, src }   (x, y: where it comes from, to get away from it)
//   melee   a foe in reach of u, winding up a blow at it (sim.js tryAttack's 'windup'), or with its next swing due
//   charge  a foe charging or about to charge along a line through u
//   shot    a projectile of the other side on course to pass through u
//   zone    a telegraphed danger zone of the other side (w.danger) that u stands in
// Like the steering out of danger zones (sim.js dangerEscape), a wind-up or a zone is only seen once it has been showing
// for the unit's reaction time (u.react). Anything that lands while u can't be hurt (invulnT) is no threat.
// attackers(w, a, slack): the foes on `a` right now: melee foes targeting it in reach (plus slack), shooters targeting
// it in range.
import { dist, angleTo, angleDiff } from './util.js';
import { opponents, alive } from './sim.js';
import { inZone } from './sim.js';
import { windMul } from './statuses.js';
import { dashThreat } from './dashes.js'; // round 18 (lane dash18): the six dashes say when they will reach a unit

const reactOf = (u) => (u.react == null ? 0.22 : u.react);
const busy = (e) => e.stunT > 0 || e.frozenT > 0 || e.sleepT > 0 || e.koT > 0 || e.fearT > 0 || e.radiantT > 0;
const gapOf = (a, b) => dist(a.x, a.y, b.x, b.y) - a.r - b.r;

export function threatened(w, u, horizon = 0.4) {
  if (!u || !alive(u)) return null;
  const safe = u.invulnT > 0 ? u.invulnT : 0, react = reactOf(u);
  let best = null;
  const note = (t, kind, x, y, src) => { if (t < safe || t > horizon) return; if (!best || t < best.t) best = { t, kind, x, y, src }; };
  for (const e of opponents(w, u)) {
    if (busy(e)) continue;
    const a = e.act, gap = gapOf(e, u), reach = (e.def.range || 20) + 12;
    if (e.strikes) { const t = e.strikes(u); if (t != null) note(t, 'charge', e.x, e.y, e); } // (round 19, lane drake19: a boss's own running move says when it will reach u: the Cinder's rush and scorch)
    if (a && a.type === 'windup' && e.target === u && gap <= reach && a.max - a.t >= Math.min(react, a.max * 0.6)) note(a.t * windMul(e), 'melee', e.x, e.y, e);
    else if (a && (a.type === 'chargeTell' || a.type === 'charge') && a.a != null) {
      const d = dist(e.x, e.y, u.x, u.y), off = angleDiff(a.a, angleTo(e.x, e.y, u.x, u.y));
      if (d < 420 && Math.sin(off) * d < u.r + e.r + 10 && off < 1.2) { const sp = (e.def.speed || 60) * 1.9; note((a.type === 'chargeTell' ? a.t : 0) + Math.max(0, gap) / Math.max(60, sp), 'charge', e.x, e.y, e); }
    } else if (a && a.dv) { const t = dashThreat(w, e, u); if (t != null) note(t, 'charge', e.x, e.y, e); // (round 18: a dash of dashes.js on its way to u, its tell counted)
    } else if (!a && e.target === u && e.def.role !== 'ranged' && !e.def.windup && gap <= reach && (e.atkT || 0) <= horizon
      && angleDiff(angleTo(e.x, e.y, u.x, u.y), e.facing) < 0.9) note(Math.max(0, e.atkT || 0), 'melee', e.x, e.y, e);
  }
  for (const p of w.projectiles) {
    if (p.team === u.team || p.noHit || p.dead || !(p.dmg > 0 || p.o)) continue;
    const vx = p.vx || 0, vy = p.vy || 0, v2 = vx * vx + vy * vy; if (v2 < 1) continue;
    const dx = u.x - p.x, dy = u.y - p.y, tc = (dx * vx + dy * vy) / v2;
    if (tc < 0 || (p.life != null && tc > p.life + 0.05)) continue;
    const mx = dx - vx * tc, my = dy - vy * tc;
    if (mx * mx + my * my < (u.r + (p.r || 6) + 4) ** 2 || (p.home === u && dx * dx + dy * dy < 160 * 160)) note(tc, 'shot', p.x, p.y, p.owner || null);
  }
  for (const z of w.danger) {
    if (z.team === u.team || z.done || !(z.t > 0) || !z.hit || (z.age || 0) < react) continue;
    if (!inZone(z, u.x, u.y, u.r * 0.5)) continue;
    const t = z.t * (z.src && z.src.winding ? windMul(z.src) : 1);
    note(t, 'zone', z.x ?? z.x1, z.y ?? z.y1, z.src || z.by || null);
  }
  return best;
}

export function attackers(w, a, slack = 30) {
  return opponents(w, a).filter((e) => e.target === a && !busy(e) && (e.def.role === 'ranged'
    ? dist(e.x, e.y, a.x, a.y) < (e.def.range || 300) + 40
    : gapOf(e, a) <= (e.def.range || 20) + slack));
}
