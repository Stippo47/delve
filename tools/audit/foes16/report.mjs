// Round 17, lane foes16: the tables of docs/audit/foes16.md (after the "<!-- tables -->" line), from the data files.
//   node tools/audit/foes16/report.mjs [--before worth-before.json] [--after worth-final.json] [--dungeons ...] [--checks ...]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, opt, DEFS, D } from './lib.mjs';
import { PRICES } from '../../../js/prices.js';

const DATA = resolve(ROOT, 'docs/audit/data/foes16');
const read = (f) => JSON.parse(readFileSync(resolve(DATA, f), 'utf8'));
const before = Object.fromEntries(read(opt('before', 'worth-before.json')).rows.map((r) => [r.k, r]));
const after = read(opt('after', 'worth-final.json')).rows;
const OLD = read('old-prices.json'); // (each kind's cost, pack, health and blow on main before this lane)
const NAME = { wildwood: 'The Wildwood', warren: 'The Warren', sewers: 'The Sewers', crypt: 'The Crypt', frost: 'The Frost Hollow', ember: 'The Ember Deep',
  spire: 'The Gilded Spire', dunes: 'The Sunken Dunes', foundry: 'The Clockwork Foundry' };
const f2 = (x) => (x == null ? '-' : (Math.round(x * 100) / 100).toFixed(2));
const n1 = (x) => (Math.round(x * 10) / 10).toString();
const pk = (p) => (p ? `${p[0]}-${p[1]}` : '-');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const out = [];

out.push('## The table: every kind\n');
out.push('Health and damage are the def\'s, after the round 6 feel numbers (health x2), before any dungeon strength: what a kind '
  + 'has at mult 1. "dmg" is its plain blow (its moves\' blows and statuses move by the same "hit" factor). At the yardstick '
  + '(mult 0.75) a blow lands at 0.68x that and health is 0.75x. Worth is per cost point against the Bandit (1.00); the band '
  + 'is 0.80-1.25. H: a helper, measured in a group of the kind it helps.\n');
let inB = 0, inA = 0, n = 0;
for (const id of Object.keys(NAME)) {
  const rows = after.filter((r) => r.home === id);
  if (!rows.length) continue;
  out.push(`### ${NAME[id]}\n`);
  out.push(table(['kind', 'cost', 'pack', 'hp', 'dmg', 'worth', '', 'cost', 'pack', 'hp', 'dmg', 'hit x', 'worth'], rows.map((r) => {
    const b = before[r.k] || {}, p = PRICES[r.k] || {}, o = OLD[r.k] || {};
    n++; if (b.worth >= 0.8 && b.worth <= 1.25) inB++; if (r.worth >= 0.8 && r.worth <= 1.25) inA++;
    const dmgNow = (DEFS[r.k].dmg || 0) * (DEFS[r.k].hitMul || 1);
    const wa = r.worth < 0.8 || r.worth > 1.25 ? `**${f2(r.worth)}**` : f2(r.worth);
    return [`${r.name} (${r.k})${r.helper ? ' H' : ''}`, n1(o.cost), pk(o.pack), o.hp ?? '-', n1(o.dmg ?? 0), f2(b.worth), '->', n1(p.cost), pk(p.pack), DEFS[r.k].hp, n1(dmgNow), f2(p.hit), wa];
  })) + '\n');
}
out.push(`Within 0.80-1.25: ${inB} of ${n} kinds before, ${inA} of ${n} after.\n`);

// per dungeon: the median worth before and after
out.push('### Per dungeon, the median kind\n');
const med = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
out.push(table(['dungeon', 'kinds', 'median worth before', 'after', 'lowest after', 'highest after'], Object.keys(NAME).map((id) => {
  const rows = after.filter((r) => r.home === id && !r.helper && r.k !== 'sawBlade');
  const ws = rows.map((r) => r.worth), bs = rows.map((r) => before[r.k] && before[r.k].worth).filter((x) => x != null);
  return [NAME[id], rows.length, f2(med(bs)), f2(med(ws)), f2(Math.min(...ws)), f2(Math.max(...ws))];
})) + '\n');

// dungeons before / after
const dfile = opt('dungeons');
if (dfile && existsSync(resolve(DATA, dfile))) {
  const B = read('dungeons-before.json').rows, A = read(dfile).rows;
  out.push('## Each dungeon, floor by floor\n');
  out.push('A fixed party (paladin, archer, cleric, twinfang) at the level the campaign goes into each floor with, points spent, '
    + `no trinkets or potions, ${A[0].n} runs a floor (this batch ran Warren, Spire and Foundry at RANK_MULT 2.27, 5.29 and 7.35, a step before the final numbers: see the second batch above); "rooms" is rooms won on that floor (7 = the floor and its mini-boss or boss).\n`);
  out.push(table(['dungeon', 'floor', 'level', 'rooms before', 'after', 'floor won before', 'after'], A.map((a) => {
    const b = B.find((x) => x.theme === a.theme && x.floor === a.floor) || {};
    return [NAME[a.theme], a.floor, a.level, f2(b.rooms), f2(a.rooms), Math.round(100 * b.won) + '%', Math.round(100 * a.won) + '%'];
  })) + '\n');
  out.push(table(['dungeon', 'rooms a floor before', 'after', 'RANK_MULT before', 'after'], Object.keys(NAME).map((id) => {
    const b = B.filter((x) => x.theme === id), a = A.filter((x) => x.theme === id);
    const m = (xs) => xs.reduce((s, x) => s + x.rooms, 0) / xs.length;
    const rk = D.DUNGEON_RANK[id];
    return [NAME[id], f2(m(b)), f2(m(a)), D.R12_MULT[rk], D.RANK_MULT[rk]];
  })) + '\n');
}

const cfile = opt('checks');
if (cfile && existsSync(resolve(DATA, cfile))) {
  const B = read('checks-before.json').rows, A = read(cfile).rows;
  out.push('## The designer\'s cases\n');
  out.push(`${read(cfile).seeds} fights each, sides swapped every other fight, in the Wildwood. Rank 0 (the yardstick) unless "scaled" (battle mode's default: each at its own dungeon's first floor).\n`);
  out.push(table(['fight', 'cost', 'before (A wins - B wins)', 'after'], A.map((a) => {
    const b = B.find((x) => x.a === a.a && x.na === a.na && x.b === a.b && x.nb === a.nb && x.scaled === a.scaled) || {};
    const c = b.costA != null ? `${n1(b.costA)} v ${n1(b.costB)} -> ${n1(a.costA)} v ${n1(a.costB)}` : `${n1(a.costA)} v ${n1(a.costB)}`;
    return [`${a.na} ${DEFS[a.a].name} v ${a.nb} ${DEFS[a.b].name}${a.scaled ? ' (scaled)' : ''}`, c, b.winsA != null ? `${b.winsA}-${b.winsB}` : '-', `${a.winsA}-${a.winsB}`];
  })) + '\n');
}

const DOC = resolve(ROOT, 'docs/audit/foes16.md');
const head = existsSync(DOC) ? readFileSync(DOC, 'utf8').split('<!-- tables -->')[0] : '# foes16\n\n';
writeFileSync(DOC, head + '<!-- tables -->\n\n' + out.join('\n'));
console.log('wrote docs/audit/foes16.md');
