// Turns the foes audit's batches (docs/audit/data/foes/*.json) into the tables of docs/audit/foes.md: everything below
// the line "<!-- tables -->" is rewritten; the write-up above it is kept as it is.
//   node tools/audit/foes/report.mjs [--print]   (also docs/audit/data/foes/summary.json: the per-kind numbers the write-up quotes)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { boot, ROOT, flag } from './lib.mjs';
const G = await boot();
const R = G.B.battleRoster(G.save);
const DATA = resolve(ROOT, 'docs/audit/data/foes');
const load = (n) => (existsSync(resolve(DATA, n + '.json')) ? JSON.parse(readFileSync(resolve(DATA, n + '.json'), 'utf8')) : null);
const mix = load('mix'), rr = load('rr'), cm = load('cm'), panel = load('panel'), swarm = load('swarm'), boss = load('boss'), rw = load('ratswolf'), stat = load('moves-static');
const OLD_COST = { rat: 1, slime: 2, slimeSmall: 1, skeleton: 3 };
const costOf = (k) => G.DEFS[k].cost ?? OLD_COST[k] ?? 3;
const nm = (k) => `${G.DEFS[k] ? G.DEFS[k].name : k} (${k})`;
const pct = (x) => (x == null || isNaN(x) ? '-' : Math.round(100 * x) + '%');
const f1 = (x) => (x == null || isNaN(x) ? '-' : (Math.round(x * 10) / 10).toString());
const f2 = (x) => (x == null || isNaN(x) ? '-' : (Math.round(x * 100) / 100).toString());
const median = (a) => { const s = a.filter((x) => x != null && !isNaN(x)).sort((p, q) => p - q); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const DNAME = Object.fromEntries(R.dungeons.map((d) => [d.id, d.name]));
const out = [];
const SUM = {}; // kind -> numbers
const S = (k) => SUM[k] || (SUM[k] = { k, name: G.DEFS[k].name, dungeon: G.B.homeOf(k), cost: costOf(k) });

// ---------------------------------------------------------------- the move names
// due() timers are named by the code; home-made clocks are named here (what the brain does when that clock is reset).
export const LABEL = {
  'attack': 'basic attack', 'ab:dash': 'dash (sim ability)', 'ab:charge': 'charge (sim ability)', 'wall slam': 'knocked into a wall',
  'mv:sT': 'fireball', 'mv:gT': 'touch', 'mv:g.t': 'charge + spin (each phase)', 'mv:g.cd': 'charge + spin', 'mv:ts.cd': 'tail spin', 'mv:slT': 'slam',
  'mv:callT': 'calls adds', 'mv:b.cd': 'shield up', 'mv:calmT': '(regrow pause, not a move)', 'mv:burnedT': '(burn block on regrow, not a move)',
  'mv:brain': "its brain's own blows (contact, no clock)", 'mv:g': 'charge + spin',
  'mv:atkT': 'its own strike (the brain sets the attack clock)', 'death': 'on death', 'split': 'on split', 'hop': 'on landing a hop', 'struck': 'answer to a blow', 'mirror': 'shot bounced back',
};
const lab = (m) => LABEL[m] || (m.startsWith('mv:') ? m.slice(3) : m.startsWith('st:') ? 'status: ' + m.slice(3) : m.startsWith('spawn:') ? 'made: ' + m.slice(6) : m);
const NOT_SET = new Set(['mv:calmT', 'mv:burnedT', 'mv:look', 'mv:bJam', 'mv:bJam.t', 'mv:repick', 'mv:flinchT', 'mv:g.t', 'mv:g']);
// the gaper's one move shows on two clocks (g.t when its first charge starts, g.cd when each one ends): counted once, by g.cd
const NOT_MOVES = { has: (m) => NOT_SET.has(m) || /tgtT$|shakeT$/.test(m) };
const MERGE = { 'mv:g.t': 'mv:g.cd', 'mv:g': 'mv:g.cd' };
const merged = (o, fires) => { const r = {}; for (const [k, v] of Object.entries(o || {})) { if (fires && MERGE[k]) continue; const m = MERGE[k] || k; r[m] = (r[m] || 0) + v; } return r; };

// ---------------------------------------------------------------- 1v1
if (rr) {
  out.push(`## 1. One against one, inside each dungeon\n\n${rr.fights} fights, ${rr.seeds} seeds a pair (half with each kind on each side), at rank 0 (everyone at the Wildwood's strength) and at home strength (as strong as on its own dungeon's first floor). A win is worth 1, a draw 1/2. "Score" is the share of its fights a kind won against every other kind of its dungeon. "Upsets" are pairs where the cheaper kind (by \`cost\`) won at least 70% against one at least 1.5x its cost.\n`);
  for (const d of R.dungeons) {
    const kinds = d.kinds, rows = [];
    for (const strength of ['r0', 'home']) {
      for (const k of kinds) {
        let sc = 0, n = 0;
        for (const p of rr.pairs) if (p.d === d.id && p.strength === strength && (p.A === k || p.B === k)) { const t = p.wA + p.wB + p.draw, me = p.A === k ? p.wA : p.wB; sc += (me + p.draw / 2) / t; n++; }
        S(k)['rr_' + strength] = n ? sc / n : null;
      }
    }
    const sorted = kinds.slice().sort((a, b) => SUM[b].rr_r0 - SUM[a].rr_r0);
    for (const k of sorted) rows.push([nm(k), f1(costOf(k)), pct(SUM[k].rr_r0), pct(SUM[k].rr_home)]);
    const ups = rr.pairs.filter((p) => p.d === d.id && p.strength === 'r0').map((p) => {
      const t = p.wA + p.wB + p.draw, cA = costOf(p.A), cB = costOf(p.B);
      const [lo, hi, wLo] = cA < cB ? [p.A, p.B, (p.wA + p.draw / 2) / t] : [p.B, p.A, (p.wB + p.draw / 2) / t];
      return { lo, hi, wLo, ratio: Math.max(cA, cB) / Math.min(cA, cB) };
    }).filter((u) => u.ratio >= 1.5 && u.wLo >= 0.7).sort((a, b) => b.ratio - a.ratio);
    out.push(`### ${d.name}\n\n` + table(['kind', 'cost', 'score at rank 0', 'score at home strength'], rows) + '\n');
    if (ups.length) out.push(`Upsets (rank 0${ups.length > 8 ? `, the 8 widest of ${ups.length}` : ''}): ` + ups.slice(0, 8).map((u) => `${G.DEFS[u.lo].name} (cost ${costOf(u.lo)}) beats ${G.DEFS[u.hi].name} (cost ${costOf(u.hi)}) ${pct(u.wLo)}`).join('; ') + '.\n');
    const draws = rr.pairs.filter((p) => p.d === d.id && p.strength === 'r0' && p.draw / (p.wA + p.wB + p.draw) >= 0.5);
    if (draws.length) out.push('Mostly draws (time ran out, 240 s): ' + draws.map((p) => `${G.DEFS[p.A].name} v ${G.DEFS[p.B].name}`).join('; ') + '.\n');
  }
}

// ---------------------------------------------------------------- cost-matched
if (cm) {
  out.push(`## 2. Groups of equal cost\n\n${cm.fights} fights, ${cm.seeds} seeds a pair, rank 0. Each pair is n of one kind against m of the other with n x cost and m x cost within 10% of each other (each side near 8 points, 12 of a kind at most). The value score is the share a kind won of those fights: 50% is a fair price for its cost; well under 50% means it is worth less than it costs, well over means it is worth more. "vs next" is the same against every kind of the next dungeon (at the same rank-0 strength, so like for like).\n`);
  for (const d of R.dungeons) {
    const rows = [];
    for (const k of d.kinds) {
      for (const tag of ['in', 'next', 'prev']) {
        let sc = 0, n = 0;
        for (const p of cm.pairs) {
          const t = p.wA + p.wB + p.draw; if (!t) continue;
          const inTag = tag === 'in' ? p.tag === 'in' && p.d === d.id : tag === 'next' ? p.tag === 'next' && p.A === k : p.tag === 'next' && p.B === k;
          if (!inTag || (p.A !== k && p.B !== k)) continue;
          sc += ((p.A === k ? p.wA : p.wB) + p.draw / 2) / t; n++;
        }
        S(k)['cm_' + tag] = n ? sc / n : null;
      }
    }
    const sorted = d.kinds.slice().sort((a, b) => SUM[b].cm_in - SUM[a].cm_in);
    for (const k of sorted) rows.push([nm(k), f1(costOf(k)), pct(SUM[k].cm_in), pct(SUM[k].cm_next), pct(SUM[k].cm_prev)]);
    out.push(`### ${d.name}\n\n` + table(['kind', 'cost', 'value score in its dungeon', 'vs next dungeon', 'vs previous dungeon'], rows) + '\n');
    const mis = cm.pairs.filter((p) => p.d === d.id && p.tag === 'in' && p.mismatch > 10);
    if (mis.length) out.push(`(${mis.length} pairs could not be matched within 10%; the worst was ${Math.max(...mis.map((p) => p.mismatch))}%.)\n`);
  }
  // per dungeon: how strong its kinds are, per cost, against the next dungeon's
  const rows = [];
  for (let i = 0; i + 1 < R.dungeons.length; i++) {
    const a = R.dungeons[i], b = R.dungeons[i + 1];
    let sc = 0, n = 0; for (const p of cm.pairs) if (p.tag === 'next' && p.d === b.id) { const t = p.wA + p.wB + p.draw; sc += (p.wA + p.draw / 2) / t; n++; }
    rows.push([a.name, b.name, pct(sc / n), n]);
  }
  out.push('### Dungeon against the next, per cost\n\nThe earlier dungeon\'s share of the wins when every kind meets every kind of the next at equal cost and equal (rank 0) strength. Under 50%: the later kinds are stronger for their cost (which RANK_MULT then adds to).\n\n' + table(['dungeon', 'next', 'earlier kinds win', 'pairs'], rows) + '\n');
}

// ---------------------------------------------------------------- panel
if (panel) {
  out.push(`## 3. Against a hero\n\n${panel.fights} fights, ${panel.seeds} seeds each, rank 0. Each kind alone, and as a pack of about ${panel.packCost} cost points (n = 16 / cost, rounded), against each of ${panel.panel.join(', ')} at tier I and tier II. The hero is kept on its feet (topped up every frame), so a fight runs until the hero has killed them all: **toll** is the damage they deal to the hero before they all die. "Hero down" is how often that toll passed the hero's own health (the fight it would have lost) and how fast. "Toughness" is the damage they soaked (health lost plus what armour, shields and dodges kept off). **Threat per cost** is the pack's toll divided by its cost, averaged over the eight heroes and tiers; the last column is that against the dungeon's median (1.0 = the median; under 0.5 or over 2 is flagged).\n`);
  const byK = {};
  for (const r of panel.recs) (byK[r.k] || (byK[r.k] = [])).push(r);
  for (const [k, list] of Object.entries(byK)) {
    const P = list.filter((r) => r.size === 'pack'), O = list.filter((r) => r.size === 'one');
    const mean = (l, f) => l.reduce((a, r) => a + f(r), 0) / Math.max(1, l.length);
    const s = S(k);
    s.packN = P[0] && P[0].n; s.packCost = P[0] && P[0].cost;
    s.tollPerCost = mean(P, (r) => r.toll / r.cost);
    s.tollPerCostT1 = mean(P.filter((r) => r.tier === 1), (r) => r.toll / r.cost);
    s.oneTollPerCost = mean(O, (r) => r.toll / r.cost);
    s.toughPerCost = mean(P, (r) => (r.taken + r.blocked) / r.cost);
    s.heroDown = mean(P, (r) => r.died / r.seeds);
    s.heroDownT1 = mean(P.filter((r) => r.tier === 1), (r) => r.died / r.seeds);
    s.ttk = median(P.map((r) => r.ttk));
    s.clear = median(P.map((r) => r.clear));
    s.dpsPack = mean(P, (r) => (r.clear ? r.toll / r.clear : null) || 0);
    s.byHero = Object.fromEntries(P.map((r) => [r.hero + r.tier, Math.round(r.toll / r.cost * 10) / 10]));
    s.timeUps = P.reduce((a, r) => a + r.timeUps, 0);
  }
  for (const d of R.dungeons) {
    const med = median(d.kinds.map((k) => SUM[k] && SUM[k].tollPerCost)), medT = median(d.kinds.map((k) => SUM[k] && SUM[k].toughPerCost));
    for (const k of d.kinds) if (SUM[k]) { SUM[k].threatRel = med ? SUM[k].tollPerCost / med : null; SUM[k].toughRel = medT ? SUM[k].toughPerCost / medT : null; }
    const sorted = d.kinds.filter((k) => SUM[k] && SUM[k].tollPerCost != null).sort((a, b) => SUM[b].tollPerCost - SUM[a].tollPerCost);
    const rows = sorted.map((k) => { const s = SUM[k]; const flagS = s.threatRel < 0.5 ? ' **low**' : s.threatRel > 2 ? ' **high**' : '';
      return [nm(k), f1(s.cost), `${s.packN} (${f1(s.packCost)})`, f1(s.tollPerCost), f1(s.oneTollPerCost), f1(s.toughPerCost), pct(s.heroDown), s.ttk == null ? '-' : f1(s.ttk) + ' s', s.clear == null ? '-' : f1(s.clear) + ' s', f2(s.threatRel) + flagS]; });
    out.push(`### ${d.name}\n\n` + table(['kind', 'cost', 'pack (cost)', 'threat per cost (pack)', 'threat per cost (alone)', 'toughness per cost', 'hero down', 'time to down (median)', 'time to clear (median)', 'vs dungeon median'], rows) + '\n');
  }
}

// ---------------------------------------------------------------- mixed group
if (mix) {
  out.push(`## 3b. In a mixed group

${mix.fights} fights, ${mix.seeds} seeds, rank 0. A plain group of the dungeon's partner kind (about 12 cost points) against the paladin and the archer at tier I (kept on their feet), with and without about 4 points of the kind added. **Added threat per cost** = the extra toll it brings, per cost point. The yardstick is what 4 more points of the partner kind itself add. This is where the helpers (spirits, drummers, healers) show: alone against a hero they do almost nothing.
`);
  for (const d of R.dungeons) {
    const list = mix.recs.filter((r) => r.d === d.id); if (!list.length) continue;
    for (const r of list) { S(r.k).mixAdded = r.addedPerCost; S(r.k).mixYard = r.yard; S(r.k).mixRel = r.yard ? r.addedPerCost / r.yard : null; }
    const rows = list.slice().sort((a, b) => b.addedPerCost - a.addedPerCost).map((r) => [nm(r.k), f1(costOf(r.k)), `${r.n} (${r.cost})`, f1(r.added.paladin), f1(r.added.archer), f1(r.addedPerCost), f2(r.yard ? r.addedPerCost / r.yard : null)]);
    out.push(`### ${d.name} (partner: ${nm(list[0].partner)} x${list[0].nPartner}; yardstick ${f1(list[0].yard)} a point)

` + table(['kind', 'cost', 'added (cost)', 'added per cost v paladin', 'v archer', 'added per cost', 'vs yardstick'], rows) + '\n');
  }
}

// ---------------------------------------------------------------- moves
const SCEN = [['1v1', '1v1 in its dungeon'], ['group', 'cost-matched groups'], ['mix', 'in a mixed group v a hero'], ['vsSwarm', 'alone v 8 goblins'], ['vsRanged', 'v the archer'], ['vsHero', 'v paladin, berserker, pyromancer']];
function movesOf(k) {
  const M = {}, A = {}, D = {};
  for (const src of [rr, cm, swarm, panel, mix]) if (src && src.moves && src.moves[k]) for (const [scen, m] of Object.entries(src.moves[k])) M[scen] = { ...m, fires: merged(m.fires, true), dmg: merged(m.dmg), armed: merged(m.armed) };
  return M;
}
{
  out.push(`## 4. Each enemy's own moves\n\nA move "fires" when its clock is reset inside the brain (every due() move by its own name; a home-made clock by the field it keeps, named below where it is clear). Fires are per minute of that kind being alive. "Damage" is the share of everything the kind did (its own blows, its moves, what it made, the statuses it put on). Scenarios: ${SCEN.map((s) => s[1]).join('; ')}. "Never fired" lists moves its code has (due() timers, from the source) or that it armed in a fight but that went off in none of them.\n`);
  const never = [];
  for (const d of R.dungeons) {
    const lines = [];
    for (const k of d.kinds) {
      const M = movesOf(k); if (!Object.keys(M).length) continue;
      const fires = {}, dmg = {}, armed = new Set();
      const cols = [];
      for (const [scen] of SCEN) {
        const m = M[scen]; if (!m) { cols.push(null); continue; }
        const per = m.up / 60;
        cols.push({ m, per });
        for (const [mv, n] of Object.entries(m.fires)) fires[mv] = (fires[mv] || 0) + n;
        for (const [mv, n] of Object.entries(m.dmg)) dmg[mv] = (dmg[mv] || 0) + n;
        for (const mv of Object.keys(m.armed)) armed.add(mv);
      }
      const totDmg = Object.values(dmg).reduce((a, b) => a + b, 0);
      const declared = new Set(((stat && stat[k] && stat[k].due) || []).map((x) => 'mv:' + x));
      const moveKeys = [...new Set([...Object.keys(fires), ...armed, ...declared, ...Object.keys(dmg)])].filter((mv) => !mv.startsWith('spawn:') || !mv.includes('/'));
      // (only due() moves can be called "never fired": a home-made state object shows up once, at its first brain call, and its clocks fire under their own names)
      const neverK = [...declared].filter((mv) => !fires[mv] && !NOT_MOVES.has(mv));
      if (neverK.length) never.push({ k, moves: neverK, armed: neverK.filter((mv) => armed.has(mv)) });
      S(k).moves = {}; S(k).dmgShare = {};
      const rows = [];
      for (const mv of moveKeys.sort((a, b) => (dmg[b] || 0) - (dmg[a] || 0) || (fires[b] || 0) - (fires[a] || 0))) {
        if (!fires[mv] && !dmg[mv] && !declared.has(mv) && !armed.has(mv)) continue;
        if (NOT_MOVES.has(mv) && !dmg[mv]) continue;
        // a move's state object made as its due() move starts (the boar's chg with its charge): the same move twice; shown once
        if (!declared.has(mv) && !LABEL[mv] && !dmg[mv] && mv.startsWith('mv:') && Object.entries(fires).some(([o, n]) => o !== mv && declared.has(o) && Math.abs(n - fires[mv]) <= 0.15 * n)) continue;
        const row = [lab(mv) + (mv.startsWith('mv:') && lab(mv) !== mv.slice(3) ? ` (${mv.slice(3)})` : '')];
        for (const c of cols) row.push(c ? (c.m.fires[mv] ? f1(c.m.fires[mv] / Math.max(0.01, c.per)) : mv.startsWith('st:') || mv === 'wall slam' || mv.startsWith('spawn:') ? '' : '0') : '');
        row.push(totDmg ? pct((dmg[mv] || 0) / totDmg) : '-');
        S(k).moves[mv] = fires[mv] || 0; S(k).dmgShare[mv] = totDmg ? (dmg[mv] || 0) / totDmg : 0;
        rows.push(row);
      }
      if (!rows.length) continue;
      lines.push(`**${nm(k)}**` + (G.DEFS[k].brain ? '' : ' (no brain: the sim\'s plain fighting)') + '\n\n' + table(['move', ...SCEN.map((s) => 'fires/min ' + s[0]), 'share of its damage'], rows));
    }
    out.push(`### ${d.name}\n\n` + lines.join('\n\n') + '\n');
  }
  out.push('### Moves that never fired\n\nIn any fight of any batch (1v1, groups, swarm, the hero panel). "armed" means the brain looked at the move\'s clock but never let it go off; "in the code" means a due() timer the brain can reach that was never even looked at.\n\n' +
    table(['kind', 'never fired', 'armed but held back'], never.map((n) => [nm(n.k), n.moves.map(lab).join(', '), n.armed.map(lab).join(', ') || '-'])) + '\n');
  SUM._never = never;
}

// ---------------------------------------------------------------- statuses
{
  const rows = [];
  for (const d of R.dungeons) for (const k of d.kinds) {
    const M = movesOf(k), st = {}, bu = {}, sd = {}; let tot = 0, up = 0;
    for (const m of Object.values(M)) {
      up += m.up;
      for (const [t, s] of Object.entries(m.st)) { const x = st[t] || (st[t] = { amt: 0, n: 0 }); x.amt += s.amt; x.n += s.n; }
      for (const [t, n] of Object.entries(m.bursts)) bu[t] = (bu[t] || 0) + n;
      for (const [mv, n] of Object.entries(m.dmg)) { tot += n; if (mv.startsWith('st:')) sd[mv.slice(3)] = (sd[mv.slice(3)] || 0) + n; }
    }
    const types = Object.keys(st).filter((t) => st[t].amt > 0.5);
    if (!types.length && !Object.keys(sd).length) continue;
    const min = up / 60;
    S(k).statuses = Object.fromEntries(types.map((t) => [t, { perMin: st[t].amt / min, bursts: (bu[t] || 0) / min, dmgShare: tot ? (sd[t] || 0) / tot : 0 }]));
    rows.push([nm(k), DNAME[d.id], types.map((t) => `${t} ${Math.round(st[t].amt / min)}/min` + (bu[t] ? `, ${f1(bu[t] / min)} bursts/min` : '') + (sd[t] ? `, ${pct(sd[t] / tot)} of its damage` : '')).join('; ')]);
  }
  out.push('## 5. Statuses the enemies put on\n\nOver every batch: how much build-up a kind adds a minute it is alive (after the target\'s resistances), how often that tips into a burst, and what share of the kind\'s damage the status did itself (ticks and bursts; a blow that carries the status counts as the blow).\n\n' + table(['kind', 'dungeon', 'statuses'], rows) + '\n');
}

// ---------------------------------------------------------------- swarm
if (swarm) {
  const rows = swarm.recs.slice().sort((a, b) => b.kills - a.kills).map((r) => [nm(r.k), DNAME[r.d], pct(r.wins / swarm.seeds), f1(r.kills), f1(r.time) + ' s']);
  for (const r of swarm.recs) { S(r.k).swarmWin = r.wins / swarm.seeds; S(r.k).swarmKills = r.kills; }
  out.push(`## 6. Alone against a crowd\n\n${swarm.fights} fights: each kind, one of it, against eight Goblins (rank 0, ${swarm.seeds} seeds). Mostly here for the moves table; the kill count says who can handle a crowd.\n\n<details><summary>All kinds</summary>\n\n` + table(['kind', 'dungeon', 'won', 'goblins killed (of 8)', 'fight time'], rows) + '\n\n</details>\n');
}

// ---------------------------------------------------------------- bosses
if (boss) {
  const rows = boss.recs.map((r) => [nm(r.k), DNAME[r.d], 'tier ' + r.tier, pct(r.wins / boss.seeds), f1(r.heroesLost) + ' of 4', pct(r.bossHpLeft), f1(r.time) + ' s', r.timeUps]);
  out.push(`## 7. Bosses\n\n${boss.fights} fights in battle mode: each boss at its home strength against ${boss.party.join(', ')} at tier I and II (${boss.seeds} seeds). The full-run boss bench is tools/runs.mjs --boss (not redone here).\n\n` + table(['boss', 'dungeon', 'party', 'boss wins', 'heroes lost', 'boss health left', 'fight time', 'time ran out'], rows) + '\n');
  const lines = [];
  for (const k of [...new Set(boss.recs.map((r) => r.k))]) {
    const m = boss.moves[k] && boss.moves[k].boss; if (!m) continue;
    const tot = Object.values(m.dmg).reduce((a, b) => a + b, 0), per = m.up / 60;
    const declared = ((stat && stat[k] && stat[k].due) || []).map((x) => 'mv:' + x);
    const fz = (mv) => m.fires[mv] || Object.entries(m.fires).filter(([q]) => q.endsWith('/' + mv)).reduce((a, [, n]) => a + n, 0);
    const keys = [...new Set([...Object.keys(m.fires), ...Object.keys(m.dmg), ...declared])].filter((mv) => !mv.includes('/') && !NOT_MOVES.has(mv));
    lines.push(`**${nm(k)}**: ` + keys.sort((a, b) => (m.dmg[b] || 0) - (m.dmg[a] || 0)).map((mv) => `${lab(mv)} ${fz(mv) ? f1(fz(mv) / per) + '/min' + (m.fires[mv] ? '' : ' (in its second form)') : mv.startsWith('mv:') || mv.startsWith('ab:') ? '**never**' : ''}${m.dmg[mv] ? ' ' + pct(m.dmg[mv] / tot) : ''}`).join(', '));
  }
  out.push('Boss moves (fires a minute, share of the boss side\'s damage; "made:" is what its adds did):\n\n' + lines.join('\n\n') + '\n');
}

// ---------------------------------------------------------------- rats and wolf
if (rw) {
  const rows = rw.recs.map((r) => [r.strength === 'r0' ? 'rank 0' : 'home', G.DEFS[r.rats].name, `${r.nRats} (${r.ratCost})`, `${r.nWolves} (${r.wolfCost})`, pct(r.ratWins / rw.seeds), pct(r.wolfWins / rw.seeds), f1(r.time) + ' s', f1(r.ratsLeft), f1(r.wolvesLeft)]);
  const look = Object.entries(rw.look).map(([key, v]) => { const [st, k] = key.split(':'); return [st === 'r0' ? 'rank 0' : 'home', G.DEFS[k].name, v.home, v.cost, v.pack ? v.pack.join('-') : '-', v.hp, v.dmg, v.atkCd, f1(v.dps), v.speed]; });
  out.push(`## 8. Rats against a wolf\n\n${rw.fights} fights, ${rw.seeds} seeds each, in the Wildwood's arena.\n\n` + table(['strength', 'rats', 'rats (cost)', 'wolves (cost)', 'rats win', 'wolves win', 'time', 'rats left', 'wolves left'], rows) + '\n\nAs battle mode builds them:\n\n' + table(['strength', 'kind', 'home', 'cost', 'pack', 'health', 'blow', 'attack every (s)', 'damage a second', 'speed'], look) + '\n');
}

// ---------------------------------------------------------------- write
const doc = resolve(ROOT, 'docs/audit/foes.md');
const head = existsSync(doc) ? readFileSync(doc, 'utf8').split('<!-- tables -->')[0] : '# Foes audit\n\n';
writeFileSync(doc, head + '<!-- tables -->\n\n' + out.join('\n') + '\n');
writeFileSync(resolve(DATA, 'summary.json'), JSON.stringify(SUM, null, 1));
if (flag('print')) console.log(out.join('\n'));
console.log('wrote docs/audit/foes.md and docs/audit/data/foes/summary.json');
