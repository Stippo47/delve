// Round 14, lane L (docs/LONG-ROOMS.md): why rooms drag on. Plays a spread of runs through tools/runs.mjs --rooms and
// reports how long each room's fight took; for the long ones, what was going on.
//   node tools/long-rooms.mjs --sweep [--n 4] [--seed 1] [--dir scratch/lr] [--jobs 12] [--themes all] [--parties all] [--levels on,under]
//     every dungeon x every party below x on-level / under-levelled, n runs each, side by side, then the report
//   node tools/long-rooms.mjs --campaigns 1,2,3,4 [--runs 150] [--dir scratch/lr]   (runs.mjs --campaign N --seed S, side by side)
//   [--snap name] (sweep, campaigns): play from a copy of js/ and tools/ taken at the start, scratch/snap-<name>
//   node tools/long-rooms.mjs --report [--dir scratch/lr | --files a.json,b.json] [--long 120] [--list 40] [--why]
//     the fight-time distribution per dungeon (median, 90th, 99th percentile, share over 120 s and 240 s), bosses apart;
//     --why: every long room's cause (see `cause` below) with its count and share of the long-room time
//   node tools/long-rooms.mjs --show <file> <run> <room> [--every 30]   one long room, snapshot by snapshot
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fs = await import('node:fs');
const path = await import('node:path');
const { spawn } = await import('node:child_process');
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dir = opt('dir', path.join(here, '..', 'scratch', 'lr'));

export const PARTIES = {
  four: 'paladin,archer,cleric,twinfang',          // the starters and the first healer (what a new player fields)
  nohealer: 'paladin,archer,twinfang,pyromancer',
  twohealers: 'paladin,cleric,druid,archer',
  ranged: 'archer,pyromancer,frost,marksman',
  melee: 'paladin,wildmane,berserker,twinfang',
  soloTank: 'paladin',                              // one hero left: a tank alone
  soloShot: 'archer',                               // one hero left: a shooter alone
  soloHeal: 'cleric',                               // one hero left: a healer alone
};
// the level a party has in each dungeon (dungeon.js FOE_LEVEL: the round 12 campaign), and under-levelled
const FOE_LEVEL = [[1, 11], [11, 17], [17, 24], [24, 33], [33, 38], [38, 43], [43, 49], [49, 53], [53, 58]];
const THEMES = ['wildwood', 'warren', 'sewers', 'crypt', 'frost', 'ember', 'spire', 'dunes', 'foundry'];
const levelFor = (theme, kind) => { const [a, b] = FOE_LEVEL[THEMES.indexOf(theme)]; return kind === 'under' ? Math.max(1, Math.round(a * 0.7)) : Math.round((a + b) / 2); };

// --snap name: run from a copy of js/ and tools/ taken now (scratch/snap-<name>), so editing the game meanwhile can't
// mix two versions into one batch
let runner = path.join(here, 'runs.mjs');
if (opt('snap')) {
  const to = path.join(here, '..', 'scratch', 'snap-' + opt('snap'));
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(path.join(here, '..', 'js'), path.join(to, 'js'), { recursive: true });
  fs.mkdirSync(path.join(to, 'tools'), { recursive: true });
  for (const f of fs.readdirSync(here)) if (f.endsWith('.mjs')) fs.copyFileSync(path.join(here, f), path.join(to, 'tools', f));
  runner = path.join(to, 'tools', 'runs.mjs');
}
function runJobs(jobs, n) {
  fs.mkdirSync(dir, { recursive: true });
  let next = 0, live = 0, done = 0;
  return new Promise((res) => {
    const go = () => {
      while (live < n && next < jobs.length) {
        const j = jobs[next++]; live++;
        const p = spawn(process.execPath, [runner, ...j.args, '--rooms', path.resolve(j.out)], { stdio: ['ignore', 'pipe', 'pipe'] });
        let log = ''; p.stdout.on('data', (d) => { log += d; }); p.stderr.on('data', (d) => { log += d; });
        p.on('close', () => { live--; done++; fs.writeFileSync(j.out.replace(/\.json$/, '.txt'), log); process.stdout.write(`\r  ${done}/${jobs.length} jobs`); if (done === jobs.length) { process.stdout.write('\n'); res(); } else go(); });
      }
    };
    go();
  });
}

// ---------------------------------------------------------------- the report
function load(files) {
  const rooms = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const r of d.rooms) { r.file = path.basename(f); rooms.push(r); }
  }
  return rooms;
}
const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
export function dist(rooms) {
  const f = rooms.map((r) => r.fight);
  return { n: f.length, med: pct(f, 0.5), p90: pct(f, 0.9), p95: pct(f, 0.95), p99: pct(f, 0.99), max: Math.max(0, ...f),
    o120: f.filter((x) => x > 120).length, o240: f.filter((x) => x > 240).length, stuck: rooms.filter((r) => r.end === 'stuck').length };
}
const line = (name, d) => `${name.padEnd(10)} rooms ${String(d.n).padStart(5)}  median ${d.med.toFixed(0).padStart(4)}s  p90 ${d.p90.toFixed(0).padStart(4)}s  p99 ${d.p99.toFixed(0).padStart(4)}s  max ${d.max.toFixed(0).padStart(4)}s  >120s ${(100 * d.o120 / Math.max(1, d.n)).toFixed(1).padStart(5)}% (${d.o120})  >240s ${(100 * d.o240 / Math.max(1, d.n)).toFixed(1).padStart(5)}% (${d.o240})  stuck ${d.stuck}`;
function report(files) {
  const all = load(files);
  const long = +opt('long', 120);
  const plain = all.filter((r) => r.kind !== 'boss'), boss = all.filter((r) => r.kind === 'boss');
  console.log(`\n${files.length} files, ${all.length} rooms with enemies (${plain.length} plain, ${boss.length} boss)`);
  console.log('\nplain rooms (fight time: walking in to the last enemy down, or the wipe)');
  console.log(line('all', dist(plain)));
  for (const th of THEMES) { const rs = plain.filter((r) => r.theme === th); if (rs.length) console.log(line(th, dist(rs))); }
  const labels = [...new Set(plain.map((r) => r.label || ''))];
  if (labels.length > 1) { console.log('\nby party'); for (const lb of labels.sort()) console.log(line(lb.slice(0, 10), dist(plain.filter((r) => (r.label || '') === lb)))); }
  console.log('\nboss rooms'); console.log(line('all', dist(boss)));
  for (const th of THEMES) { const rs = boss.filter((r) => r.theme === th); if (rs.length) console.log(line(th, dist(rs))); }
  // stand-offs: the longest stretch with nothing falling and nothing new coming in (a room's own enemy down, a wave)
  for (const r of all) gaps(r);
  const G = +opt('gap', 45);
  const gl = (name, rs) => { const g = rs.map((r) => r.maxGap); return `${name.padEnd(10)} longest stretch without a kill: median ${pct(g, 0.5).toFixed(0).padStart(3)}s p90 ${pct(g, 0.9).toFixed(0).padStart(3)}s p99 ${pct(g, 0.99).toFixed(0).padStart(4)}s | rooms with one over ${G}s: ${(100 * rs.filter((r) => r.maxGap > G).length / Math.max(1, rs.length)).toFixed(1).padStart(4)}% | stand-off time (past ${G}s) ${rs.reduce((a, r) => a + r.stall, 0).toFixed(0)}s of ${rs.reduce((a, r) => a + r.fight, 0).toFixed(0)}s fighting`; };
  console.log('\nstand-offs, plain rooms'); console.log(gl('all', plain));
  for (const th of THEMES) { const rs = plain.filter((r) => r.theme === th); if (rs.length) console.log(gl(th, rs)); }
  if (labels.length > 1) for (const lb of labels.sort()) console.log(gl(lb.slice(0, 10), plain.filter((r) => (r.label || '') === lb)));
  console.log(gl('boss', boss));
  const lr = plain.filter((r) => r.fight > long).sort((a, b) => b.fight - a.fight);
  if (args.includes('--why')) why(lr, long);
  const nl = +opt('list', 0);
  for (const r of lr.slice(0, nl)) console.log(`  ${r.fight.toFixed(0).padStart(4)}s ${r.end.padEnd(7)} ${r.file} run ${r.run} room ${r.n} ${r.theme} f${r.floor}.${r.L + 1} ${r.kind} ${r.shape} ${r.label || ''} ${r.cause ? '[' + r.cause + ']' : ''}`);
  return { all, plain, boss, lr };
}

// The stretches between things happening: the room's start, each of its own enemies falling, each wave arriving, the
// end. r.maxGap the longest; r.stall the seconds past G in all of them (a stand-off's length); r.stretches [from, to].
export function gaps(r, G = +opt('gap', 45)) {
  const ev = [0, ...(r.kt || []), ...(r.wt || []), r.fight].sort((a, b) => a - b);
  r.maxGap = 0; r.stall = 0; r.stretches = [];
  for (let i = 1; i < ev.length; i++) { const g = ev[i] - ev[i - 1]; if (g > r.maxGap) r.maxGap = g; if (g > G) { r.stall += g - G; r.stretches.push([ev[i - 1], ev[i]]); } }
  return r;
}

// ---------------------------------------------------------------- one room, snapshot by snapshot
function show(file, run, n) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const r = d.rooms.find((x) => x.run === run && x.n === n);
  if (!r) { console.log('no such room'); return; }
  const every = +opt('every', 30);
  console.log(`${r.theme} f${r.floor}.${r.L + 1} ${r.kind} ${r.shape} ${r.W}x${r.H} fight ${r.fight.toFixed(0)}s end ${r.end} party ${r.party.join(',')} lv ${r.lv} label ${r.label}`);
  let prev = null;
  for (const s of r.snaps || []) {
    if (prev && s.t - prev.t < every && s !== r.snaps[r.snaps.length - 1]) continue;
    const dt = prev ? s.t - prev.t : s.t || 1;
    const rate = (k) => (prev ? ((s[k] - prev[k]) / dt).toFixed(1) : '-');
    const her = Object.entries(s.her).map(([k, v]) => `${k.slice(0, 5)} d${prev && prev.her[k] ? ((v.d - prev.her[k].d) / dt).toFixed(1) : '-'} h${prev && prev.her[k] ? ((v.h - prev.her[k].h) / dt).toFixed(1) : '-'}`).join(' ');
    console.log(`t${s.t} heroes took ${rate('hT')}/s healed ${rate('hH')}/s | enemies took ${rate('eT')}/s healed ${rate('eH')}/s | ${her}${s.wave ? ' waves ' + s.wave.left + (s.wave.pend ? 'p' : '') : ''}${s.coming ? ' coming' : ''}`);
    for (const u of s.u) if (!u.f.includes('l')) console.log(`    ${u.s === 'hero' ? 'H' : 'E'} ${u.k}#${u.id} ${u.hp}%/${u.mhp} @${u.x},${u.y} ${u.m}${u.tg ? '>' + u.tg : ''} ${u.f} tk${u.tk} hl${u.hl} spd${u.spd} ${u.role} rng${u.rng}`);
    prev = s;
  }
}

// ---------------------------------------------------------------- causes (filled in from the data: docs/LONG-ROOMS.md)
function why(lr, long) {
  const by = {};
  let tot = 0;
  for (const r of lr) { r.cause = cause(r); const c = by[r.cause] || (by[r.cause] = { n: 0, t: 0, ex: [] }); c.n++; c.t += r.fight - long; tot += r.fight - long; if (c.ex.length < 6) c.ex.push(`${r.file}:${r.run}:${r.n}`); }
  console.log(`\nlong plain rooms (> ${long}s): ${lr.length}; time past ${long}s: ${tot.toFixed(0)}s`);
  for (const [k, c] of Object.entries(by).sort((a, b) => b[1].t - a[1].t)) console.log(`  ${k.padEnd(28)} ${String(c.n).padStart(4)} rooms  ${(100 * c.t / Math.max(1, tot)).toFixed(1).padStart(5)}% of the time   e.g. ${c.ex.join(' ')}`);
}
// A long room's cause. A room whose kills kept coming (no stretch over G) is a slow grind ('steady: ...'); otherwise the
// cause is its longest stand-off's (stretchCause).
export function cause(r) {
  gaps(r);
  const excess = r.fight - +opt('long', 120);
  if (!r.stretches.length || r.stall < 0.25 * excess) return 'steady: ' + steadyWhy(r);
  const s = r.stretches.slice().sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0];
  return stretchCause(r, s[0], s[1]);
}
const isMain = (u) => u.s === 'enemy' && !/[mslT]/.test(u.f);
const KIT_NAMES = { sawBlade: 1 };
function steadyWhy(r) {
  const heal = r.party.filter((k) => ['cleric', 'druid', 'bard', 'shaman', 'seer', 'beekeeper', 'quartermaster', 'enchantress', 'grandpa', 'chef'].includes(k)).length;
  if (r.party.length === 1) return 'one hero, many enemies';
  return heal >= 2 ? 'two healers' : heal === 1 ? 'one healer' : 'no healer';
}
export function stretchCause(r, a, b) {
  const ss = (r.snaps || []).filter((s) => s.t >= a + 10 && s.t <= b);
  if (ss.length < 2) return 'stand-off (no snapshots)';
  const s0 = ss[0], s1 = ss[ss.length - 1], dt = Math.max(1, s1.t - s0.t);
  const frac = (f) => ss.filter(f).length / ss.length;
  const up = (s) => s.u.filter((u) => u.s === 'hero' && !u.f.includes('D') && !u.f.includes('s')).length;
  const lone = frac((s) => up(s) === 1) > 0.6;
  // the room's own enemies standing through the stretch
  const ids = new Map();
  for (const s of ss) for (const u of s.u) if (isMain(u)) { const e = ids.get(u.id) || ids.set(u.id, { id: u.id, k: u.k, n: 0, first: u, last: u, calm: 0, hid: 0, fixed: 0, targeted: 0, modes: {} }).get(u.id); e.n++; e.last = u; if (u.f.includes('z')) e.calm++; if (/[eh]/.test(u.f)) e.hid++; if (u.f.includes('x')) e.fixed++; e.modes[u.m] = (e.modes[u.m] || 0) + 1;
    if (s.u.some((h) => h.s === 'hero' && !h.f.includes('D') && h.tg === u.k + '#' + u.id)) e.targeted++; }
  const foes = [...ids.values()].filter((e) => e.n >= ss.length * 0.5);
  const took = (e) => e.last.tk - e.first.tk, healed = (e) => e.last.hl - e.first.hl;
  const eT = (s1.eT - s0.eT) / dt, eH = (s1.eH - s0.eH) / dt, hT = (s1.hT - s0.hT) / dt, hH = (s1.hH - s0.hH) / dt;
  const heroModes = {}; let heroN = 0;
  for (const s of ss) for (const u of s.u) if (u.s === 'hero' && !u.f.includes('D') && !u.f.includes('s')) { heroN++; const m = u.f.includes('F') ? 'forced' : u.m; heroModes[m] = (heroModes[m] || 0) + 1; }
  const hm = (m) => (heroModes[m] || 0) / Math.max(1, heroN);
  const pre = lone ? 'last hero: ' : '';
  if (!foes.length) return pre + 'nothing left but called help / parts';
  if (foes.every((e) => e.calm > e.n * 0.6 && e.targeted < e.n * 0.3)) return pre + 'a group never met (calm, nobody goes)';
  if (foes.every((e) => e.hid > e.n * 0.5)) return pre + 'enemies hidden or untouchable';
  if (hm('forced') > 0.3) return pre + 'heroes held on a forced goal (revive)';
  const fx = foes.filter((e) => e.fixed > e.n * 0.5);
  if (eT < 1.5) {
    if (fx.length === foes.length) return pre + 'a fixed enemy nobody can hit';
    if (foes.some((e) => (e.modes.wander || 0) > e.n * 0.5 && e.targeted < e.n * 0.5)) return pre + 'an enemy nobody targets (wanders)';
    return pre + 'nobody hurting anyone' + (hT < 1.5 ? ' (both sides idle)' : ' (heroes cannot hurt them)');
  }
  if (eH > 0.5 * eT) return pre + 'enemies heal as fast as they are hurt';
  const low = foes.filter((e) => e.last.hp < 30 && e.first.hp < 40);
  const kite = hm('kite');
  // what the party dealt against what the enemies have left
  const left = foes.reduce((x, e) => x + e.last.hp / 100 * e.last.mhp, 0), eta = left / Math.max(0.1, eT);
  if (hH > 0.7 * hT && hT > 1) {
    if (kite > 0.3) return pre + 'kiting and healing (nobody falls)';
    return pre + 'party heals what it takes; enemies slow to fall' + (low.length ? ' (a low one unfinished)' : '');
  }
  if (kite > 0.3) return pre + 'kiting a chaser';
  if (low.length) return pre + 'a nearly dead enemy unfinished';
  return pre + 'slow damage (eta ' + (eta > 120 ? '>120' : eta > 60 ? '60-120' : '<60') + 's)';
}

// ---------------------------------------------------------------- what to do
if (args.includes('--sweep')) {
  const themes = opt('themes', 'all') === 'all' ? THEMES : opt('themes').split(',');
  const parties = opt('parties', 'all') === 'all' ? Object.keys(PARTIES) : opt('parties').split(',');
  const levels = opt('levels', 'on,under').split(',');
  const jobs = [];
  for (const th of themes) for (const p of parties) for (const lv of levels) {
    const L = levelFor(th, lv), tag = `${th}-${p}-${lv}`;
    jobs.push({ out: path.join(dir, tag + '.json'), args: ['--theme', th, '--party', PARTIES[p], '--level', String(L), '--n', opt('n', '4'), '--seed', opt('seed', '1'), '--label', `${p}/${lv}`] });
  }
  await runJobs(jobs, +opt('jobs', '12'));
  report(jobs.map((j) => j.out));
} else if (opt('campaigns')) {
  const seeds = opt('campaigns').split(',');
  const jobs = seeds.map((s) => ({ out: path.join(dir, `campaign-s${s}.json`), args: ['--campaign', opt('runs', '150'), '--seed', s, '--v'] }));
  await runJobs(jobs, seeds.length);
  report(jobs.map((j) => j.out));
} else if (args.includes('--report')) {
  const files = opt('files') ? opt('files').split(',') : fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));
  report(files);
} else if (args.includes('--show')) {
  const i = args.indexOf('--show'); show(args[i + 1], +args[i + 2], +args[i + 3]);
}
