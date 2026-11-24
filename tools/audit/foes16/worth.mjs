// Round 17, lane foes16: every enemy kind's worth per cost point, at one strength (rank 0, battle mode's "scaled" off:
// the Wildwood's first floor, its first room, mult RANK_MULT[0]), measured the same way for every kind.
//   node tools/audit/foes16/worth.mjs [--dungeons wildwood,warren] [--kinds a,b] [--seeds 4] [--out file.json]
//
// The ruler is the Bandit (bandit, cost 3): its numbers are never tuned, so 1.00 is "as much per cost point as a Bandit".
// Four measures, each a ratio to the Bandit's, per cost point:
//   panel   a pack of about 12 cost points against one hero at a time (paladin, berserker, archer, pyromancer, tier I),
//           the hero kept on its feet until it has killed them all; the toll (health they took off it, statuses too) is
//           divided by Cn x (Cn + c) (Cn the pack's cost, c one's): a hero killing them one by one takes
//           dps x hp x n(n+1)/2 from n of them, so that is the toll's own size per cost point squared.
//   duel    about 12 cost points of the kind against Bandits of the same cost (the audit's match), sides swapped every
//           other seed. Lanchester's square law: the winner keeps sqrt(1 - weaker/stronger) of its strength, so
//           (1 - fB^2) / (1 - fX^2) (f the share of health a side has left, capped at 0.95) is the strength ratio,
//           times (Bandits' cost / its cost)^2 for the small mismatch.
//   mixP    about 3 cost points of it added to about 12 of a partner kind against the same hero panel: the extra toll it
//           brings against what 3 more points of the partner bring. The partner is the Bandit, or for a helper the
//           kind it helps (HELPERS).
//   mixD    the partner with about 3 of its points swapped for 3 of this kind, against the partner alone: from the
//           square law, its worth w per point satisfies strength ratio = ((a cP + w m c) / (b cP))^2.
// worth: the geometric mean of panel and duel (the duel capped at 1.6); for the helpers (kinds that do no damage
// themselves: spirits, the Wisp, the Drummer, the Choir Sprite, the Repair Drone, the Brain Leech), of mixP and mixD,
// times the partner's own worth.
// The panel's toll is a geometric mean over the four heroes (each +5), so one matchup can't swamp it.
import { writeFileSync } from 'node:fs';
import { DEFS, ROSTER, costOf, homeOf, fight, leftOf, stacks, opt, r2, gmean } from './lib.mjs';

export const PANEL = ['paladin', 'berserker', 'archer', 'pyromancer'];
// the helpers, each with the kind it helps in its own dungeon (the Wisp mends beasts, the Repair Drone machines...)
export const HELPERS = { wisp: 'wolf', drummer: 'hobgoblin', leechBrain: 'lizardBlade', spiritFrost: 'spiderFrost', spiritFire: 'hellhound', spiritHeal: 'angel',
  spiritWard: 'angel', choirSprite: 'angel', spiritHaste: 'jackal', spiritPoison: 'jackal', spiritShock: 'automaton', repairDrone: 'automaton' };
const DUEL_CAP = 1.6; // (a shooter that kites Bandits wins without a scratch however weak it is: the duel says little above this)
const RULER = 'bandit', C = 12;
const S = +opt('seeds', 4);
const onlyD = opt('dungeons') ? opt('dungeons').split(',') : null, onlyK = opt('kinds') ? opt('kinds').split(',') : null;

// a pack against one hero kept on its feet: the toll it takes
function toll(arena, foes, hero, seed) {
  let h = null, sum = 0;
  fight({ arena, a: [{ k: hero, n: 1, tier: 1 }], b: foes }, seed, {
    tMax: 150,
    prep: (run) => { h = run.sides.a[0]; },
    before: () => { if (h && !h.dead) { if (h.downed) h.downed = false; h.hp = h.maxHp; } },
    after: () => { if (h && h.hp < h.maxHp) sum += h.maxHp - Math.max(0, h.hp); },
  });
  return sum;
}
// the toll against each hero (its mean over the seeds), put together as a geometric mean (+5 each, so a hero that takes
// nothing doesn't zero it): one matchup a hero can't win (a tier I archer can't kill a Gilded Golem: its front sends the
// arrows back) doesn't swamp the other three
const EPS = 5;
function panelToll(arena, foes, seed0) {
  return gmean(PANEL.map((hero) => { let t = 0; for (let s = 0; s < S; s++) t += toll(arena, foes, hero, seed0 + s * 7919 + hero.length * 101) / S; return t + EPS; }));
}
// n of A against m of B with n*cA near m*cB, both near `target`
export function match(cA, cB, target = C) {
  let best = null;
  for (let n = 1; n <= 24; n++) for (let m = 1; m <= 24; m++) {
    const a = n * cA, b = m * cB, mis = Math.abs(a - b) / Math.max(a, b), tot = (a + b) / 2;
    const score = (mis > 0.1 ? 10 + mis * 10 : 0) + Math.abs(tot - target) / target;
    if (!best || score < best.score) best = { n, m, a, b, mis, score };
  }
  return best;
}
const cap = (f) => Math.min(0.95, f);
const sq = (fX, fB) => (1 - cap(fB) ** 2) / (1 - cap(fX) ** 2);
// side X (a list of stacks) against side Y: the strength ratio X / Y, averaged in logs over the seeds
function duel(arena, X, Y, seed0, n = 2 * S) {
  let lg = 0, wins = 0;
  for (let s = 0; s < n; s++) {
    const flip = s % 2 === 1, run = fight({ arena, a: flip ? Y : X, b: flip ? X : Y }, seed0 + s * 7919);
    const sx = flip ? 'b' : 'a', sy = flip ? 'a' : 'b';
    lg += Math.log(sq(leftOf(run, sx), leftOf(run, sy))); if (run.winner === sx) wins++; else if (run.winner === 'draw') wins += 0.5;
  }
  return { ratio: Math.exp(lg / n), win: wins / n };
}

const REF = {}; // per arena: the ruler's own numbers
function ref(arena) {
  if (REF[arena]) return REF[arena];
  const c = costOf(RULER), n = Math.round(C / c);
  const pT = panelToll(arena, stacks(RULER, n), 70000);
  return (REF[arena] = { panel: pT / (n * c * (n * c + c)) });
}
// a partner P's group of about 12 points (nP of it) against the panel, and with about 3 points more of it (+dn)
const MIX = {};
function mixRef(arena, P) {
  const key = arena + ':' + P; if (MIX[key]) return MIX[key];
  const cP = costOf(P), nP = Math.max(1, Math.round(12 / cP)), dn = Math.max(1, Math.round(3 / cP));
  return (MIX[key] = { P, cP, nP, dn, t0: panelToll(arena, stacks(P, nP), 71000), t1: panelToll(arena, stacks(P, nP + dn), 71000) });
}

export function measure(k) {
  const arena = homeOf(k) || 'wildwood', c = costOf(k), R = ref(arena), seed = 1000 + [...k].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 100000;
  const out = { k, name: DEFS[k].name, home: arena, cost: c, hp: DEFS[k].hp, dmg: DEFS[k].dmg, hitMul: DEFS[k].hitMul || 1, helper: !!HELPERS[k] };
  // panel
  const n = Math.max(1, Math.min(24, Math.round(C / c))), Cn = n * c;
  out.panelN = n;
  out.panel = r2(panelToll(arena, stacks(k, n), seed) / (Cn * (Cn + c)) / R.panel);
  // duel against Bandits
  const mt = match(c, costOf(RULER));
  const d = duel(arena, stacks(k, mt.n), stacks(RULER, mt.m), seed + 5);
  out.duelN = mt.n; out.duelWin = r2(d.win);
  out.duel = r2(d.ratio * (mt.b / mt.a) ** 2);
  // in a mixed group
  const M = mixRef(arena, HELPERS[k] || RULER), m = Math.max(1, Math.round(3 / c)), mc = m * c;
  const tX = panelToll(arena, [...stacks(M.P, M.nP), ...stacks(k, m)], 71000);
  out.partner = M.P; out.mixN = m;
  out.mixP = r2(((tX - M.t0) / Math.max(1, M.t1 - M.t0)) * (M.dn * M.cP / mc));
  const a = M.nP - M.dn, dm = duel(arena, [...stacks(M.P, a), ...stacks(k, m)], stacks(M.P, M.nP), seed + 9);
  out.mixD = r2(Math.max(0.01, (M.nP * M.cP * Math.sqrt(dm.ratio) - a * M.cP) / mc));
  out.worth = r2(out.helper ? gmean([Math.max(0.05, out.mixP), out.mixD]) : gmean([out.panel, Math.min(DUEL_CAP, out.duel)]));
  return out;
}

const kinds = [];
for (const d of ROSTER.dungeons) { if (onlyD && !onlyD.includes(d.id)) continue; for (const k of d.kinds) if (!onlyK || onlyK.includes(k)) kinds.push(k); }
const t0 = Date.now(), rows = [], byK = {};
const one = (k) => byK[k] || (byK[k] = measure(k));
for (const k of kinds) {
  const r = one(k); rows.push(r);
  if (r.helper) { const pw = one(HELPERS[k]).worth; r.partnerWorth = pw; r.worth = r2(r.worth * pw); } // (relative to its partner, which has its own worth)
  console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s`, r.home, k, 'cost', r.cost, 'worth', r.worth, '| panel', r.panel, 'duel', r.duel, `(won ${r.duelWin})`, 'mixP', r.mixP, 'mixD', r.mixD);
}
if (opt('out')) writeFileSync(opt('out'), JSON.stringify({ seeds: S, rows, ref: REF }, null, 1));
