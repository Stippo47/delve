// Status audit (round 16, lane audit-statuses): one battle-mode fight with a status fed into one side at a fixed rate,
// measured through the stats.js AUDIT hook. MEASURES ONLY: nothing here changes a rule or a number in js/.
//   runFight({ a, b, seed, fed: 'a' | 'b', feed: { type, rate } | { type, hold } | [ ...several ], bonus: { side, mul } })
// feed.rate: points a second, given in one pulse every PULSE seconds (addStatus(w, u, type, rate * PULSE, src) on every
// unit of the fed side, src = an opposing unit, so credit and charm's charmer work).
// feed.hold: top the value up to `hold` every pulse (never past it): the build-up's effect alone, no burst.
// bonus: a plain damage bonus on every blow of one side's units (a 'dealt' buff, which sim.js hurt multiplies into
// every blow: weapon, abilities, shots; damage over time is not a blow), for calibrating a status's worth.
globalThis.location = globalThis.location || { search: '?x' };
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const B = await imp('js/battle.js');
const SIM = await imp('js/sim.js');
const { setSeed } = await imp('js/util.js');
const { freshSave } = await imp('js/save.js');
const { AUDIT } = await imp('js/stats.js');
const ST = await imp('js/statuses.js');
export const { STATUS, needOf } = ST;
export const BUILD_IDS = ST.BUILD_IDS;

export const DT = 1 / 60, PULSE = 1.0, MAX_T = 260;
const save = freshSave(); save.cheat = true;

// seconds after a burst in which the status can't build again (or the burst state holds it), from statuses.js; used
// only to pick feed rates that give a wanted burst period
export const LOCK = { burn: 0, chill: 0, poison: 0, wet: 0, shock: 0, stagger: 0, radiance: ST.RADIANCE.auraT + ST.RADIANCE.immuneT,
  curse: 0, entangle: ST.ENTANGLE.rootT + ST.ENTANGLE.immuneT, charm: ST.CHARM.immuneT, confuse: ST.CONFUSE.addledT + ST.CONFUSE.immuneT,
  sleepy: ST.SLEEPY.sleepT + ST.SLEEPY.immuneT, bleed: ST.BLEED.immuneT, fear: ST.FEAR.terrT + ST.FEAR.immuneT,
  shackle: ST.SHACKLE.dur + ST.SHACKLE.immuneT };
// the feed rate (points a second) that should give a burst every P seconds: decay + (need - after) / (P - lock),
// capped at 150 when the lock alone is about as long as P (then it bursts as soon as it can)
export function rateFor(type, P) {
  const S = STATUS[type], need = typeof S.need === 'function' ? 100 : S.need, free = P - LOCK[type];
  if (free < 1) return 150;
  return Math.min(150, Math.round((S.decay + (need - S.after) / free) * 10) / 10);
}

// is u in the status's burst state right now?
const IN_BURST = {
  burn: () => false, bleed: () => false,
  chill: (u) => u.frozenT > 0, poison: (u) => u.sickT > 0, wet: (u) => !!(u.act && u.act.type === 'slip'),
  shock: (u) => u.stunT > 0.35, stagger: (u) => u.koT > 0, radiance: (u) => u.radiantT > 0, curse: (u) => !!u.hexed || u.hexUntil > (u._w ? u._w.time : 0),
  entangle: (u) => u.rootT > 0, charm: (u) => u.flipKind === 'charm', confuse: (u) => u.addledT > 0, sleepy: (u) => u.sleepT > 0,
  fear: (u) => u.fearT > 0, shackle: (u) => u.shackledT > 0,
};
const ENT_COL = STATUS.entangle.col;
const disabled = (u) => u.stunT > 0 || u.frozenT > 0 || u.sleepT > 0 || u.koT > 0;
// can't strike its foes: disabled, glowing (Radiant), running (Terrified), in irons (Shackled: no basic attack), or fighting for the other side
const noStrike = (u) => disabled(u) || u.radiantT > 0 || u.fearT > 0 || u.shackledT > 0 || u.flipKind === 'charm';

const sideHealth = (run, side) => { let hp = 0, max = 0; for (const u of run.sides[side]) { max += u.maxHp; if (SIM.alive(u)) hp += Math.max(0, u.hp); } return max ? hp / max : 0; };

export function runFight({ a, b, seed, fed = 'b', feed = null, bonus = null, arena = 'crypt', immortal = false, maxT = MAX_T }) {
  const feeds = feed ? (Array.isArray(feed) ? feed : [feed]) : [];
  const other = fed === 'a' ? 'b' : 'a';
  setSeed(seed);
  const run = B.newBattle(save, { arena, size: 'l', a, b });
  const w = run.world;
  const fedSet = new Set(run.sides[fed]), otherSet = new Set(run.sides[other]);
  const sideOfU = (u) => { if (!u) return null; let o = u; for (let i = 0; i < 5 && o; i++) { if (fedSet.has(o)) return fed; if (otherSet.has(o)) return other; o = o.summonBy || o.ghostOf || null; } const s = B.sideOf(w, u); return s; };
  const types = feeds.map((f) => f.type);
  const m = { bursts: {}, burstOther: {}, stDmg: {}, stDmgOther: {}, inBurst: {}, built: {}, added: {}, stunned: 0, hexSelf: 0, entWalk: 0,
    blockedFed: 0, healFed: 0, noStrike: 0, blowsFed: 0, blowsOther: 0, castsFed: 0, castsOther: 0, healAsk: 0, healCut: 0,
    nullFed: { radiant: 0, charm: 0, hex: 0 }, nullFedAmt: { radiant: 0, charm: 0, hex: 0 }, nullOther: { radiant: 0, charm: 0, hex: 0 }, nullOtherAmt: { radiant: 0, charm: 0, hex: 0 } };
  for (const t of types) { m.bursts[t] = 0; m.burstOther[t] = 0; m.stDmg[t] = 0; m.stDmgOther[t] = 0; m.inBurst[t] = 0; m.built[t] = 0; m.added[t] = 0; }
  const burstTimes = [];
  AUDIT.on = (ev, w2, u, src, amt, o) => {
    const s = sideOfU(u);
    if (ev === 'hurt') {
      const k = o && o.stk;
      if (k && m.stDmg[k] != null) { if (s === fed) m.stDmg[k] += amt; else m.stDmgOther[k] += amt; }
      if (o && o.hexTurned && s === fed) m.hexSelf += amt;
      if (o && o.dot && !o.stk && o.color === ENT_COL && s === fed) m.entWalk += amt;
      if (src && !(o && o.dot)) { const ss = sideOfU(src); if (ss === fed && s !== fed) m.blowsFed++; else if (ss === other && s !== other) m.blowsOther++; }
    } else if (ev === 'burst') {
      if (m.bursts[o.type] != null) { if (s === fed) { m.bursts[o.type]++; burstTimes.push(w2.time); } else m.burstOther[o.type]++; }
    } else if (ev === 'status') {
      if (m.added[o.type] != null && s === fed) m.added[o.type] += amt;
    } else if (ev === 'block') { if (s === fed) m.blockedFed += amt; }
    else if (ev === 'heal') { if (s === fed) m.healFed += amt; }
    else if (ev === 'healAsk') { if (s === fed) m.healAsk += amt; }
    else if (ev === 'healCut') { if (s === fed) m.healCut += amt; }
    else if (ev === 'cast') { if (s === fed) m.castsFed++; else if (s === other) m.castsOther++; }
    else if (ev === 'nullified') { const ss = sideOfU(src); if (ss === fed) { m.nullFed[o.why]++; m.nullFedAmt[o.why] += amt; } else if (ss === other) { m.nullOther[o.why]++; m.nullOtherAmt[o.why] += amt; } }
  };
  if (bonus) for (const u of run.sides[bonus.side]) SIM.addBuff(u, { id: 'auditBonus', dealt: bonus.mul, dur: 1e9 });
  if (immortal) for (const u of [...run.sides.a, ...run.sides.b]) { u.maxHp = u.hp = 1e7; }
  let t = 0, nextPulse = 0;
  try {
    while (run.phase === 'fight' && t < maxT) {
      if (feeds.length && t >= nextPulse) {
        nextPulse += PULSE;
        const foes = run.sides[other].filter((u) => SIM.alive(u));
        const anyFoe = foes[0] || B.standing(run, other)[0] || null;
        for (const u of run.sides[fed]) {
          if (!SIM.alive(u)) continue;
          // the opposing unit nearest this one is the source (the charmer, the frightener, whose the credit is)
          let src = anyFoe, best = 1e18;
          for (const f of foes) { const d = (f.x - u.x) ** 2 + (f.y - u.y) ** 2; if (d < best) { best = d; src = f; } }
          for (const f of feeds) {
            let amt;
            if (f.hold != null) { // (what addStatus multiplies in: the kind's resistance, and wet's 1.5 for chill)
              const res = (u.def.res && u.def.res[f.type]) ?? 1, wetX = f.type === 'chill' && u.st && u.st.wet > 30 ? 1.5 : 1;
              amt = res > 0 ? Math.max(0, Math.min(f.hold, needOf(u, f.type) - 1) - ((u.st && u.st[f.type]) || 0)) / (res * wetX) : 0;
            }
            else amt = f.rate * PULSE;
            if (amt > 0) SIM.addStatus(w, u, f.type, amt, src);
          }
        }
      }
      B.updateBattle(run, DT); t += DT;
      for (const u of run.sides[fed]) {
        if (!SIM.alive(u)) continue;
        u._w = w;
        if (disabled(u)) m.stunned += DT;
        if (noStrike(u)) m.noStrike += DT;
        for (const ty of types) { if (IN_BURST[ty](u)) m.inBurst[ty] += DT; if (u.st && u.st[ty] > 0) m.built[ty] += DT; }
      }
    }
    if (run.phase === 'fight') B.callBattle(run);
  } finally { AUDIT.on = null; }
  const S = w.stats;
  const rowsOf = (side) => Object.entries(S.rows).filter(([k]) => k.startsWith(side + ':')).map(([, r]) => r);
  const sum = (rows, k) => rows.reduce((x, r) => x + (r[k] || 0), 0);
  const fr = rowsOf(fed), or = rowsOf(other);
  const hf = sideHealth(run, fed), ho = sideHealth(run, other);
  const win = run.winner === fed ? 1 : run.winner === other ? 0 : 0.5;
  // burst period: the mean gap between the fed side's bursts (one unit: its own; a group: all of them pooled, so
  // divide by the group's size for each unit's own period)
  const gaps = []; for (let i = 1; i < burstTimes.length; i++) gaps.push(burstTimes[i] - burstTimes[i - 1]);
  return {
    win, margin: hf - ho, hpFed: hf, hpOther: ho, time: run.t, timeUp: !!run.timeUp,
    dmgFed: sum(fr, 'dmg'), takenFed: sum(fr, 'taken'), dmgOther: sum(or, 'dmg'), takenOther: sum(or, 'taken'),
    killsFed: sum(fr, 'kills'), lostFed: sum(fr, 'lost'),
    firstBurst: burstTimes.length ? burstTimes[0] : null, meanGap: gaps.length ? gaps.reduce((x, y) => x + y, 0) / gaps.length : null,
    ...m,
  };
}

// a fresh unit of a kind given `amt` of a status once: did it take? (immunities and resistances)
export function takes(kind, type, amt = 60, rank = 0) {
  setSeed(1);
  const isH = B.isHero(kind);
  const run = B.newBattle(save, { arena: 'crypt', size: 'l', a: [isH ? { k: kind, n: 1, tier: 1 } : { k: kind, n: 1, rank }], b: [{ k: 'paladin', n: 1, tier: 1 }] });
  const w = run.world, u = run.sides.a[0], src = run.sides.b[0];
  // a battle sets 'enemy' for the side with a boss; addStatus needs no fight
  let burst = false; AUDIT.on = (ev, w2, uu, s, a2, o) => { if (ev === 'burst' && uu === u) burst = true; };
  const before = (u.st && u.st[type]) || 0;
  try { SIM.addStatus(w, u, type, amt, src); } finally { AUDIT.on = null; }
  const got = ((u.st && u.st[type]) || 0) - before;
  return { got: Math.round(got * 10) / 10, res: u.def.res && u.def.res[type] != null ? u.def.res[type] : 1, boss: !!u.def.boss, ethereal: !!u.ethereal };
}
