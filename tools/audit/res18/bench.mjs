// Round 18, lane res18: how much a status-reliant hero loses to enemy resistances, per dungeon, today and under the
// proposal. MEASURES ONLY: the proposed numbers are put on the defs in memory for the run, never written.
//   node tools/audit/res18/bench.mjs [--heroes pyromancer,frost] [--seeds 2] [--budget 36] [--out file.json]
// Each fight: the hero (tier III) with a Paladin and a Cleric (tier III) against one room's worth of a dungeon floor's
// fight roster (weight x cost, packs, as dungeon.js rollKinds spends a budget), at battle mode's unscaled strength (every
// monster at the Wildwood's first-floor strength, so dungeons differ only by who is in them). The same group and seed
// under each condition:
//   none  every enemy kind's def.res emptied (takes everything in full; code-only immunities still stand: the gilded
//         shell, bosses' charm), the yardstick
//   now   the game as it is
//   prop  the proposal's base rules (proposal.mjs), with --calls the named call packages too (all: every call)
// Per fight: the hero's main status landed (points a second of fight), its damage a second (blows and its statuses'
// ticks credited to it), the fight's time, and whether the party won.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const B = await imp('js/battle.js');
const SIM = await imp('js/sim.js');
const { setSeed } = await imp('js/util.js');
const { freshSave } = await imp('js/save.js');
const { AUDIT } = await imp('js/stats.js');
const { DEFS } = await imp('js/units.js');
const { THEMES, DUNGEON_ORDER } = await imp('js/themes.js');
const P = await imp('tools/audit/res18/proposal.mjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const MAIN = { pyromancer: 'burn', warlock: 'burn', frost: 'chill', plague: 'poison', twinfang: 'poison', storm: 'shock', witch: 'curse',
  enchantress: 'charm', slinger: 'sleepy', bard: 'sleepy', seer: 'confuse', cultist: 'bleed', werewolf: 'bleed', druid: 'entangle', warden: 'shackle', archer: 'chill' };
const HEROES = arg('heroes') ? arg('heroes').split(',') : Object.keys(MAIN);
const SEEDS = +arg('seeds', 2), BUDGET = +arg('budget', 36), T_MAX = 150, DT = 1 / 60;
const callsArg = arg('calls', '');
const CALLS = callsArg === 'all' ? Object.keys(P.CALLS).concat(Object.keys(P.RAISE), ['bossPoison']) : callsArg.split(',').filter(Boolean);
const save = freshSave(); save.cheat = true;

// the three res tables, for every enemy kind
const ENEMY = Object.keys(DEFS).filter((k) => DEFS[k].team !== 'hero');
const NOW = Object.fromEntries(ENEMY.map((k) => [k, DEFS[k].res]));
const PROP = Object.fromEntries(ENEMY.map((k) => [k, P.proposedRes(k, DEFS[k], { calls: [] }).res]));
const PROPC = Object.fromEntries(ENEMY.map((k) => [k, P.proposedRes(k, DEFS[k], { calls: CALLS }).res]));
const setRes = (T) => { for (const k of ENEMY) { if (T === null) DEFS[k].res = {}; else DEFS[k].res = T[k]; } };

// a room's group: a small seeded generator of its own (the same group under every condition)
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function group(roster, seed) {
  const r = mulberry(seed), out = {};
  let budget = BUDGET;
  for (let g = 0; budget > 0 && g < 40; g++) {
    let tot = 0; for (const [, wt] of roster) tot += wt;
    let x = r() * tot, k = roster[roster.length - 1][0]; for (const [kk, wt] of roster) { x -= wt; if (x <= 0) { k = kk; break; } }
    const d = DEFS[k]; if (!d || d.boss) continue;
    const c = d.cost || 3, pk = d.pack;
    if (c > budget + 1.5 && Object.keys(out).length) { if (g > 20) break; continue; }
    const n = pk ? Math.max(1, Math.min(pk[0] + Math.floor(r() * (pk[1] - pk[0] + 1)), Math.ceil(budget / c))) : 1;
    out[k] = (out[k] || 0) + n; budget -= n * c;
  }
  return Object.entries(out).map(([k, n]) => ({ k, n: Math.min(12, n) }));
}
const ownerOf = (u) => { let o = u; for (let i = 0; i < 6 && o; i++) { if (o.def && o.def.hero && !o.summonBy) return o; o = o.summonBy || o.ghostOf || o.owner || null; } return null; };

function fight(hero, foes, seed) {
  setSeed(seed);
  const run = B.newBattle(save, { arena: 'crypt', size: 'l', scaled: false, a: [{ k: hero, n: 1, tier: 3 }, { k: 'paladin', n: 1, tier: 3 }, { k: 'cleric', n: 1, tier: 3 }], b: foes });
  const w = run.world, me = run.sides.a.find((u) => u.kind === hero) || run.sides.a[0], st = MAIN[hero];
  const m = { landed: 0, dmg: 0, t: 0, won: 0 };
  AUDIT.on = (ev, w2, u, src, amt, o) => {
    if (!src || u.team === me.team) return;
    if (ownerOf(src) !== me) return;
    if (ev === 'status' && o && o.type === st) m.landed += amt;
    else if (ev === 'hurt') m.dmg += amt;
  };
  // (a trap never counts as standing; what the foes made mid-fight does: split slimes, called help)
  const standing = (side) => side === 'a' ? run.sides.a.filter((u) => SIM.alive(u)).length : w.units.filter((u) => SIM.alive(u) && u.team === 'enemy' && !u.def.trap && !u.linkTo && !u.def.part).length;
  try {
    while (run.t < T_MAX) {
      if (w.hitstop > 0) { w.hitstop -= DT; continue; }
      run.t += DT; SIM.step(w, DT); w.pickups.length = 0;
      if (!standing('a')) break;
      if (!standing('b')) { m.won = 1; break; }
    }
  } finally { AUDIT.on = null; }
  m.t = run.t;
  return m;
}

const rows = [];
for (const hero of HEROES) {
  for (const id of DUNGEON_ORDER) {
    const T = THEMES[id];
    const acc = { none: [], now: [], prop: [], propc: [] };
    T.floors.forEach((F, fi) => {
      for (let s = 0; s < SEEDS; s++) {
        const seed = 7000 + fi * 101 + s * 13 + id.length * 977;
        const foes = group(F.enemies, seed);
        for (const [cond, tab] of [['none', null], ['now', NOW], ['prop', PROP], ...(CALLS.length ? [['propc', PROPC]] : [])]) {
          setRes(tab);
          acc[cond].push(fight(hero, foes, seed));
        }
      }
    });
    setRes(NOW);
    const sum = (L, f) => L.reduce((a, x) => a + f(x), 0);
    const row = { hero, status: MAIN[hero], dungeon: id };
    for (const c of Object.keys(acc)) { const L = acc[c]; if (!L.length) continue; const t = sum(L, (x) => x.t);
      row[c] = { landed: Math.round(sum(L, (x) => x.landed) / t * 10) / 10, dps: Math.round(sum(L, (x) => x.dmg) / t * 10) / 10, secs: Math.round(t / L.length), won: Math.round(sum(L, (x) => x.won) / L.length * 100) }; }
    rows.push(row);
    const f = (c) => (row[c] ? `${c} ${row[c].landed}/s dps ${row[c].dps} ${row[c].secs}s won ${row[c].won}%` : '');
    console.log(`${hero} ${MAIN[hero]} ${id}: ${f('none')} | ${f('now')} | ${f('prop')}${row.propc ? ' | ' + f('propc') : ''}`);
  }
}
if (arg('out')) writeFileSync(resolve(ROOT, arg('out')), JSON.stringify({ seeds: SEEDS, budget: BUDGET, calls: CALLS, rows }, null, 1));
