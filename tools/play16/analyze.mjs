// Round 16, lane play16: the campaigns (docs/audit/data/play16/<strategy>-s<seed>.json) boiled down to the tables in
// docs/audit/play16.md and the numbers the charts draw (summary.json).
//   node tools/play16/analyze.mjs [--dir docs/audit/data/play16]
import fs from 'node:fs';
import { STRATS } from './strategies.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const DIR = opt('dir', 'docs/audit/data/play16');
const HP_POW = 0.75, HIT_STEP = 0.07, BOSS_HP_POW = 0.85, BOSS_HIT_STEP = 0.05; // (dungeon.js, as this lane found them)
const enemyPower = (m) => Math.sqrt((m > 1 ? Math.pow(m, HP_POW) : m) * (0.65 + 0.35 * m) * (m > 1 ? 1 + HIT_STEP * (m - 1) : 1));
const DUNGEONS = ['wildwood', 'warren', 'sewers', 'crypt'];
const NAMES = { wildwood: 'Wildwood', warren: 'Warren', sewers: 'Sewers', crypt: 'Crypt' };
const med = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y); if (!b.length) return null; const m = b.length / 2; return b.length % 2 ? b[m | 0] : (b[m - 1] + b[m]) / 2; };
const mean = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)); return b.length ? b.reduce((x, y) => x + y, 0) / b.length : null; };
const f1 = (x, d = 1) => (x == null ? '–' : (+x).toFixed(d));
const pct = (x) => (x == null ? '–' : Math.round(100 * x) + '%');

const files = fs.readdirSync(DIR).filter((f) => /-s\d+\.json$/.test(f));
const camps = files.map((f) => JSON.parse(fs.readFileSync(DIR + '/' + f, 'utf8')));
const by = {}; for (const c of camps) (by[c.strategy] || (by[c.strategy] = [])).push(c);
// a fresh Archer's measured power: the 1.0 every hero power here is read against
const FRESH = med(camps.filter((c) => c.starter === 'archer').map((c) => c.runs[0].heroes[0].probe.power));
const FRESH_OF = {}; for (const c of camps) (FRESH_OF[c.starter] || (FRESH_OF[c.starter] = [])).push(c.runs[0].heroes[0].probe.power);
const partyPower = (r) => mean(r.heroes.map((h) => h.probe.power)) / FRESH;
const pos = (rm) => (rm.f - 1) * 7 + rm.L; // 0..20: floor 1 room 1 .. floor 3's boss room
const fightish = (rm) => rm.kind === 'fight' || rm.kind === 'hazard' || rm.kind === 'elite';
const out = { FRESH, strategies: {} };
let md = '';
const line = (s = '') => { md += s + '\n'; };

// ---------------------------------------------------------------- milestones
function milestones(c) {
  const ev = (re) => { const e = c.events.find((x) => re.test(x.s)); return e ? e.run : null; };
  const starterAt = (run) => { if (run == null) return null; const r = c.runs[run - 1]; const k = c.starter; const j = r.party.indexOf(k); return j < 0 ? null : r.lvOut[j]; };
  const tierRun = (test) => { for (const r of c.runs) { const h = r.heroes.find((x) => x.k === c.starter); if (h && test(Object.values(h.tiers))) return { run: r.i, lv: h.lv, theme: r.theme }; } return null; };
  const m = { runs: c.runs.length, seat2: ev(/^seat 2/), seat3: ev(/^seat 3/), seat4: ev(/^seat 4/) };
  for (const d of DUNGEONS) { m[d] = ev(new RegExp('^' + d + ' boss')); m[d + 'Lv'] = starterAt(m[d]); m[d + 'Mini1'] = ev(new RegExp('^' + d + ' mini 1')); }
  m.tier2 = tierRun((t) => t.some((x) => x >= 2)); m.tier3 = tierRun((t) => t.some((x) => x >= 3)); m.all3 = tierRun((t) => t.every((x) => x >= 3));
  m.allAb = tierRun((t) => t.every((x) => x >= 1));
  return m;
}
line('## Milestones (median over seeds; run numbers count from 1)');
line();
line('| Strategy | Seat 2 | Seat 3 | Seat 4 | Wildwood boss (lv) | Warren boss (lv) | Sewers boss (lv) | Crypt boss | 1st tier II (lv) | 1st tier III (lv) | All three at III (lv, where) | Runs played |');
line('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const [name, cs] of Object.entries(by)) {
  const ms = cs.map(milestones);
  const g = (k) => med(ms.map((m) => m[k]));
  const tg = (k) => { const v = ms.map((m) => m[k]); const run = med(v.map((x) => x && x.run)), lv = med(v.map((x) => x && x.lv)); const wh = v.filter(Boolean).map((x) => NAMES[x.theme]); const miss = v.filter((x) => !x).length;
    return run == null ? `never (${cs.length})` : `${f1(run, 0)} (${f1(lv, 0)})${k === 'all3' ? ' ' + [...new Set(wh)].join('/') : ''}${miss ? ` [${miss} never]` : ''}`; };
  const dn = (d) => { const v = ms.map((m) => m[d]); const miss = v.filter((x) => x == null).length; const r = med(v); return r == null ? `not in ${ms[0].runs}+` : `${f1(r, 0)} (${f1(med(ms.map((m) => m[d + 'Lv'])), 0)})${miss ? ` [${miss} not]` : ''}`; };
  line(`| ${name} | ${f1(g('seat2'), 0)} | ${f1(g('seat3'), 0)} | ${f1(g('seat4'), 0)} | ${dn('wildwood')} | ${dn('warren')} | ${dn('sewers')} | ${dn('crypt')} | ${tg('tier2')} | ${tg('tier3')} | ${tg('all3')} | ${f1(med(ms.map((m) => m.runs)), 0)} |`);
  out.strategies[name] = { desc: STRATS[name] && STRATS[name].desc, seeds: cs.length, milestones: ms };
}
line();

// ---------------------------------------------------------------- runs per dungeon, gold
line('## Runs, wipes and gold per dungeon (mean per campaign)');
line();
line('| Strategy | Dungeon | Runs | Wipes | Left/won | Rooms a run | Gold made | Lost to wipes/leaving | Spent: trinkets / levels / heroes / draughts |');
line('|---|---|---|---|---|---|---|---|---|');
for (const [name, cs] of Object.entries(by)) for (const d of DUNGEONS) {
  const per = cs.map((c) => { const rs = c.runs.filter((r) => r.theme === d); return { n: rs.length, wipes: rs.filter((r) => r.res === 'lost').length, ok: rs.filter((r) => r.res !== 'lost').length, rooms: mean(rs.map((r) => r.nRooms)),
    raw: rs.reduce((a, r) => a + r.gold.raw, 0), lost: rs.reduce((a, r) => a + r.gold.lost, 0), sp: ['trinkets', 'upgrades', 'heroes', 'potions'].map((k) => rs.reduce((a, r) => a + r.camp.spent[k], 0)) }; }).filter((x) => x.n);
  if (!per.length) continue;
  line(`| ${name} | ${NAMES[d]} | ${f1(mean(per.map((x) => x.n)))} | ${f1(mean(per.map((x) => x.wipes)))} | ${f1(mean(per.map((x) => x.ok)))} | ${f1(mean(per.map((x) => x.rooms)))} | ${f1(mean(per.map((x) => x.raw)), 0)} | ${f1(mean(per.map((x) => x.lost)), 0)} | ${[0, 1, 2, 3].map((j) => f1(mean(per.map((x) => x.sp[j])), 0)).join(' / ')} |`);
}
line();

// ---------------------------------------------------------------- the curve, room by room
// For each dungeon and room position: the enemies' strength there (per foe, from enemyMult), the party's measured power
// (per hero, a fresh Archer = 1) when it got there, their ratio, and what the room cost.
function curve(names, d) {
  const rows = [];
  for (let p = 0; p < 21; p++) {
    const visits = [], first = [];
    for (const name of names) for (const c of by[name] || []) {
      let seen = false;
      for (const r of c.runs) if (r.theme === d) for (const rm of r.rooms) if (pos(rm) === p) { const v = { rm, r, hero: partyPower(r) }; visits.push(v); if (!seen) { first.push(v); seen = true; } }
    }
    if (!visits.length) { rows.push({ p, n: 0 }); continue; }
    const fights = visits.filter((v) => fightish(v.rm));
    const m = med(visits.map((v) => v.rm.m));
    rows.push({ p, f: (p / 7 | 0) + 1, room: p % 7 + 1, n: visits.length, m, enemy: enemyPower(m), heroFirst: med(first.map((v) => v.hero)), heroAll: med(visits.map((v) => v.hero)),
      lvFirst: med(first.map((v) => mean(v.r.heroes.map((h) => h.lv)))), size: med(visits.map((v) => v.r.party.length)),
      taken: mean(fights.map((v) => v.rm.takenPct)), minHp: mean(fights.map((v) => v.rm.minHp)), fightT: med(fights.map((v) => v.rm.fightT)),
      wipe: visits.filter((v) => v.rm.end === 'lost').length / visits.length, foes: mean(fights.map((v) => v.rm.foes)), elites: mean(fights.map((v) => v.rm.elites)),
      majorRooms: visits.filter((v) => v.rm.majors > 0).length / visits.length, takenFirst: mean(first.filter((v) => fightish(v.rm)).map((v) => v.rm.takenPct)), wipeFirst: first.filter((v) => v.rm.end === 'lost').length / first.length });
  }
  return rows;
}
const GROUPS = { baseline: ['archer-fill'], solo: ['archer-solo'], everyone: Object.keys(by) };
out.curves = {};
for (const [g, names] of Object.entries(GROUPS)) for (const d of DUNGEONS) out.curves[g + ':' + d] = curve(names, d);
for (const [g, label] of [['baseline', 'Archer, seats filled (archer-fill)'], ['solo', 'Lone Archer (archer-solo)']]) for (const d of ['wildwood', 'warren', 'sewers']) {
  const rows = out.curves[g + ':' + d]; if (!rows.some((r) => r.n)) continue;
  line(`### ${NAMES[d]}: ${label}`);
  line();
  line('| Room | Enemy strength (x a strength-1 foe) | Party power when first there (x a fresh Archer) | Enemy / hero | Avg level first there | Damage taken (% of party health), fights | Lowest health in fights | Fight time (s) | Wipes here | Foes | Rooms with a major |');
  line('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) if (r.n) line(`| ${r.f}.${r.room}${r.room === 7 ? (r.f === 3 ? ' boss' : ' mini') : ''} | ${f1(r.enemy, 2)} | ${f1(r.heroFirst, 2)} | ${f1(r.enemy / r.heroFirst, 2)} | ${f1(r.lvFirst, 0)} | ${pct(r.taken)} | ${pct(r.minHp)} | ${f1(r.fightT, 0)} | ${pct(r.wipe)} | ${f1(r.foes)} | ${pct(r.majorRooms)} |`);
  line();
}

// ---------------------------------------------------------------- floors' last foes
line('## Mini-bosses and bosses (every strategy; party levels are the mean level going in)');
line();
line('| Dungeon | Floor | Foe | Fights | Won | First fight won | Time to kill (s, wins) | Its health (as spawned, solo / party of 2 / 3+) | Lowest party health in wins | Wins with a hero down | Wins never under 50% | Party level at first win |');
line('|---|---|---|---|---|---|---|---|---|---|---|---|');
out.bosses = {};
for (const d of DUNGEONS) for (const fl of [1, 2, 3]) {
  const fights = [], firsts = [], firstWinLv = [];
  for (const c of camps) { let had = false, won = false;
    for (const r of c.runs) if (r.theme === d) for (const rm of r.rooms) if (rm.f === fl && rm.boss) { const v = { rm, r, size: r.party.length, lv: mean(r.heroes.map((h) => h.lv)) }; fights.push(v); if (!had) { firsts.push(v); had = true; } if (rm.boss.killed && !won) { won = true; firstWinLv.push(v.lv); } } }
  if (!fights.length) continue;
  const wins = fights.filter((v) => v.rm.boss.killed);
  const hpBy = (s) => med(fights.filter((v) => (s === 3 ? v.size >= 3 : v.size === s)).map((v) => v.rm.boss.hp));
  const kind = fights[0].rm.boss.kind;
  out.bosses[d + fl] = { kind, fights: fights.length, wins: wins.length, ttk: med(wins.map((v) => v.rm.boss.ttk)), minHp: med(wins.map((v) => v.rm.boss.minHp)) };
  line(`| ${NAMES[d]} | ${fl} | ${kind} | ${fights.length} | ${pct(wins.length / fights.length)} | ${pct(firsts.filter((v) => v.rm.boss.killed).length / firsts.length)} | ${f1(med(wins.map((v) => v.rm.boss.ttk)), 0)} | ${[1, 2, 3].map((s) => f1(hpBy(s), 0)).join(' / ')} | ${pct(med(wins.map((v) => v.rm.boss.minHp)))} | ${pct(wins.filter((v) => v.rm.boss.downs > 0).length / Math.max(1, wins.length))} | ${pct(wins.filter((v) => v.rm.boss.minHp >= 0.5).length / Math.max(1, wins.length))} | ${f1(med(firstWinLv), 0)} |`);
}
line();
// the same, split by strategy for the Wildwood's three
line('### Wildwood floor foes by strategy (wins / fights, median time to kill, median lowest party health in wins)');
line();
line('| Strategy | The Alpha (1) | Bandit Chief (2) | Elder Ent (3) |');
line('|---|---|---|---|');
for (const [name, cs] of Object.entries(by)) {
  const cell = (fl) => { const f = []; for (const c of cs) for (const r of c.runs) if (r.theme === 'wildwood') for (const rm of r.rooms) if (rm.f === fl && rm.boss) f.push(rm);
    const w = f.filter((x) => x.boss.killed); return f.length ? `${w.length}/${f.length}, ${f1(med(w.map((x) => x.boss.ttk)), 0)} s, ${pct(med(w.map((x) => x.boss.minHp)))}` : '–'; };
  line(`| ${name} | ${cell(1)} | ${cell(2)} | ${cell(3)} |`);
}
line();

// ---------------------------------------------------------------- majors and elites, where they first show
line('## Where elites and majors first show (per campaign: the first room with one, as floor.room of the Wildwood, and on which run)');
line();
line('| Strategy | First elite (run, room) | First major (run, room) | Wildwood rooms with a major | Wildwood floor 1 rooms with a major |');
line('|---|---|---|---|---|');
for (const [name, cs] of Object.entries(by)) {
  const fe = [], fm = []; let wr = 0, wm = 0, f1r = 0, f1m = 0;
  for (const c of cs) { let e = null, m = null;
    for (const r of c.runs) for (const rm of r.rooms) { if (r.theme !== 'wildwood') continue; wr++; if (rm.majors) wm++; if (rm.f === 1) { f1r++; if (rm.majors) f1m++; }
      if (!e && rm.elites) e = `run ${r.i}, ${rm.f}.${rm.L + 1}`; if (!m && rm.majors) m = `run ${r.i}, ${rm.f}.${rm.L + 1}`; }
    fe.push(e || 'none'); fm.push(m || 'none'); }
  line(`| ${name} | ${fe.join('; ')} | ${fm.join('; ')} | ${pct(wm / wr)} | ${pct(f1m / f1r)} |`);
}
line();

// ---------------------------------------------------------------- levels and power over runs
out.levels = {}; out.power = {};
for (const [name, cs] of Object.entries(by)) {
  const n = Math.max(...cs.map((c) => c.runs.length));
  out.levels[name] = []; out.power[name] = [];
  for (let i = 0; i < n; i++) {
    const at = cs.map((c) => c.runs[i]).filter(Boolean);
    if (at.length < Math.ceil(cs.length / 2)) break;
    out.levels[name].push(med(at.map((r) => r.heroes.find((h) => h.k === c0(cs).starter).lv)));
    out.power[name].push(med(at.map((r) => r.heroes.find((h) => h.k === c0(cs).starter).probe.power / FRESH)));
  }
}
function c0(cs) { return cs[0]; }
line('## The starter by run (median level going in, and measured power x a fresh Archer)');
line();
const RUNS_AT = [1, 2, 3, 5, 8, 10, 15, 20, 30, 40, 60, 80];
line('| Strategy | ' + RUNS_AT.map((r) => 'run ' + r).join(' | ') + ' |');
line('|---|' + RUNS_AT.map(() => '---').join('|') + '|');
for (const name of Object.keys(by)) line(`| ${name} | ${RUNS_AT.map((r) => (out.levels[name][r - 1] != null ? `${out.levels[name][r - 1]} (${f1(out.power[name][r - 1])})` : '')).join(' | ')} |`);
line();
// fresh starters
line(`Fresh starters' measured power: ${Object.entries(FRESH_OF).map(([k, v]) => `${k} ${f1(med(v) / FRESH, 2)}`).join(', ')} (a fresh Archer = 1; its raw probe ${f1(FRESH, 1)}).`);
line();

// ---------------------------------------------------------------- the first runs of the baseline, told
line('## The baseline campaigns, run by run (archer-fill: the first 12 runs of each seed)');
line();
for (const c of by['archer-fill'] || []) {
  line(`Seed ${c.seed}:`);
  for (const r of c.runs.slice(0, 12)) {
    const evs = c.events.filter((e) => e.run === r.i).map((e) => e.s).join(', ');
    const tiers = r.heroes.map((h) => `${h.k} ${h.lv}${'→' + r.lvOut[r.party.indexOf(h.k)]} [${Object.values(h.tiers).join('')}]`).join(', ');
    const bossR = r.rooms.filter((x) => x.boss).map((x) => `${x.boss.kind} ${x.boss.killed ? 'down in ' + x.boss.ttk + ' s, party at ' + pct(x.boss.minHp) + ' lowest' : 'won (party wiped)'}`).join('; ');
    line(`- run ${r.i}: ${NAMES[r.theme] || r.theme} from floor ${r.from}, ${r.res === 'lost' ? 'wiped' : r.res === 'won' ? 'beat the boss' : 'left'} at ${r.endF}.${r.endL + 1}; ${tiers}; gold +${r.gold.kept} (lost ${r.gold.lost})${r.camp.bought.length ? '; bought ' + r.camp.bought.join(', ') : ''}${bossR ? '; ' + bossR : ''}${evs ? '; **' + evs + '**' : ''}`);
  }
  line();
}
fs.writeFileSync(DIR + '/summary.json', JSON.stringify(out));
fs.writeFileSync(DIR + '/tables.md', md);
console.log(md.length + ' chars of tables; ' + camps.length + ' campaigns');
