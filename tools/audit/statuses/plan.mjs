// What the status audit fights: the matchups (each a mirror: the same stacks on both sides) and the conditions
// (control, every status at each rate, the damage-bonus ladder used to price them, a few pairs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const RATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/audit/data/statuses/rates.json'), 'utf8'));
export const STATUSES = Object.keys(RATES);

const H = (k, tier) => ({ k, n: 1, tier });
const E = (k, n = 1) => ({ k, n, rank: 0 });
export const HEROES8 = ['paladin', 'tower', 'archer', 'berserker', 'twinfang', 'pyromancer', 'cleric', 'bard'];
export const MATCHUPS = [];
for (const tier of [1, 3]) for (const k of HEROES8) MATCHUPS.push({ id: `${k}-t${tier}`, kind: 'hero', role: null, side: [H(k, tier)] });
for (const [k, what] of [['rattler', 'small melee (bone)'], ['bandit', 'medium melee'], ['orc', 'big melee'], ['troll', 'big melee'], ['poacher', 'ranged'], ['golem', 'armoured big']])
  MATCHUPS.push({ id: k, kind: 'enemy', what, side: [E(k)] });
MATCHUPS.push({ id: 'trio-t1', kind: 'group', what: 'Paladin, Archer, Cleric (tier I)', side: [H('paladin', 1), H('archer', 1), H('cleric', 1)] });
MATCHUPS.push({ id: 'trio-t3', kind: 'group', what: 'Berserker, Pyromancer, Bard (tier III)', side: [H('berserker', 3), H('pyromancer', 3), H('bard', 3)] });
MATCHUPS.push({ id: 'rattler-x3', kind: 'group', what: 'three rattlers', side: [E('rattler', 3)] });
MATCHUPS.push({ id: 'wolf-x3', kind: 'group', what: 'three wolves', side: [E('wolf', 3)] });

// damage-bonus ladder: `other` = the fed side's opponent hits this much harder; `fed` = the fed side does
export const LADDER = [
  { side: 'fed', mul: 1.3 }, { side: 'fed', mul: 1.15 },
  { side: 'other', mul: 1.1 }, { side: 'other', mul: 1.2 }, { side: 'other', mul: 1.35 }, { side: 'other', mul: 1.5 },
  { side: 'other', mul: 1.75 }, { side: 'other', mul: 2 }, { side: 'other', mul: 2.5 }, { side: 'other', mul: 3 },
];
export const ladderValue = (l) => (l.side === 'other' ? l.mul - 1 : -(l.mul - 1)); // +: worth that much bonus damage to the opponent

export const HOLD = 85, FLAT = 25;
export function conditions() {
  const C = [{ id: 'control' }];
  for (const st of STATUSES) {
    const seen = new Set();
    for (const lv of ['low', 'med', 'high']) {
      const r = RATES[st][lv].rate; if (seen.has(r)) continue; seen.add(r);
      C.push({ id: `${st}:${lv}`, status: st, level: lv, feed: { type: st, rate: r } });
    }
    C.push({ id: `${st}:hold`, status: st, level: 'hold', feed: { type: st, hold: HOLD } });
  }
  // every status at one flat rate (points a second), so the statuses compare point for point as well
  for (const st of STATUSES) C.push({ id: `${st}:flat`, status: st, level: 'flat', feed: { type: st, rate: FLAT } });
  for (const l of LADDER) C.push({ id: `bonus:${l.side}:${l.mul}`, bonus: l, value: ladderValue(l) });
  // pairs worth a look (both at their medium rate)
  for (const [x, y] of [['wet', 'chill'], ['wet', 'shock'], ['burn', 'chill'], ['wet', 'poison'], ['curse', 'bleed'], ['shock', 'stagger']])
    C.push({ id: `pair:${x}+${y}`, pair: [x, y], feed: [{ type: x, rate: RATES[x].med.rate }, { type: y, rate: RATES[y].med.rate }] });
  return C;
}
