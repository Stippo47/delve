// Reads the battle and dungeon batches (shards merged), works out every ability's worth in every build and setting with
// its noise, and writes the summary JSON and docs/audit/worth.md.
//   node tools/audit/worth/analyze.mjs --battle a.json,b.json,c.json --dungeon a.json,b.json,c.json [--summary out.json] [--md out.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { HEROES, HERO_IDS, ABILITIES, PANEL, STEP_CHECK, allyOf } from './lib.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const load = (list) => { const out = { heroes: {}, problems: 0 }; for (const f of (list || '').split(',').filter(Boolean)) { const d = JSON.parse(readFileSync(f, 'utf8')); out.problems += d.problems || 0; Object.assign(out.heroes, d.heroes); for (const k of ['seeds', 'n', 'panel', 'seed0']) if (d[k] != null) out[k] = d[k]; } return out; };
const BT = load(opt('battle')), DG = load(opt('dungeon'));
const PANEL4 = ['melee', 'ranged', 'caster', 'tank'];

// ---------------------------------------------------------------- stats helpers
const mean = (a) => { const v = a.filter((x) => x != null && !Number.isNaN(x)); return v.length ? v.reduce((p, q) => p + q, 0) / v.length : NaN; };
// a list of per-seed values -> { m, se, n }
function est(vals) { const v = vals.filter((x) => x != null && !Number.isNaN(x)); const n = v.length; if (!n) return { m: NaN, se: NaN, n: 0 }; const m = v.reduce((a, b) => a + b, 0) / n; const sd = n > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) : NaN; return { m, se: sd / Math.sqrt(n), n }; }
// per-seed combination of builds: terms [[sign, build]...]; get(build) -> per-seed array
function combo(get, terms) { const arrs = terms.map(([, b]) => get(b)); if (arrs.some((a) => !a)) return null; const n = Math.min(...arrs.map((a) => a.length)); const out = []; for (let i = 0; i < n; i++) { let s = 0, bad = false; terms.forEach(([sg], j) => { const x = arrs[j][i]; if (x == null) bad = true; else s += sg * x; }); out.push(bad ? null : s); } return est(out); }

const perRun = (h, b, f) => { const r = DG.heroes[h] && DG.heroes[h][b]; if (!r || !Array.isArray(r.secs)) return null; return r.rooms.map((x, i) => (x == null || !r.secs[i] ? null : f(r, i))); };
// per-seed series for a hero and build in each measure
const series = {
  rooms: (h, b) => DG.heroes[h] && DG.heroes[h][b] ? DG.heroes[h][b].rooms : null,
  // dungeon rates over the whole run (every room counts, so steadier than rooms): signed so that bigger is better
  dDps: (h, b) => perRun(h, b, (r, i) => r.dmg[i] / r.secs[i]),
  dSaved: (h, b) => perRun(h, b, (r, i) => -r.taken[i] / r.secs[i]),
  dHeal: (h, b) => perRun(h, b, (r, i) => r.heal[i] / r.secs[i]),
  dDowns: (h, b) => perRun(h, b, (r, i) => -r.downs[i]),
  dWon: (h, b) => DG.heroes[h] && DG.heroes[h][b] ? DG.heroes[h][b].won : null,
  duel: (h, b) => { const B = BT.heroes[h] && BT.heroes[h][b]; if (!B) return null; const n = B.melee.margin.length; return Array.from({ length: n }, (_, i) => mean(PANEL4.map((s) => B[s].margin[i]))); },
  duelWin: (h, b) => { const B = BT.heroes[h] && BT.heroes[h][b]; if (!B) return null; const n = B.melee.win.length; return Array.from({ length: n }, (_, i) => mean(PANEL4.map((s) => B[s].win[i]))); },
  group: (h, b) => BT.heroes[h] && BT.heroes[h][b] ? BT.heroes[h][b].group.margin : null,
  groupWin: (h, b) => BT.heroes[h] && BT.heroes[h][b] ? BT.heroes[h][b].group.win : null,
  battle: (h, b) => { const d = series.duel(h, b), g = series.group(h, b); if (!d || !g) return null; return d.map((x, i) => (x == null || g[i] == null ? null : (x + g[i]) / 2)); },
};
for (const s of PANEL4) { series[s] = (h, b) => BT.heroes[h] && BT.heroes[h][b] ? BT.heroes[h][b][s].margin : null; series[s + 'Win'] = (h, b) => BT.heroes[h] && BT.heroes[h][b] ? BT.heroes[h][b][s].win : null; }
const MEASURES = ['rooms', 'dDps', 'dSaved', 'dHeal', 'dDowns', 'dWon', 'duel', 'duelWin', 'group', 'groupWin', 'battle', ...PANEL4, ...PANEL4.map((s) => s + 'Win')];

// ---------------------------------------------------------------- per ability
const ABS = [], HERO = {};
for (const h of HERO_IDS) {
  if (!BT.heroes[h] && !DG.heroes[h]) continue;
  const ids = HEROES[h].abilities.map((a) => a.id);
  const lvl = {}; for (const m of MEASURES) { const g = (b) => series[m](h, b); lvl[m] = { full: est(g('full') || []), bare: est(g('bare') || []), span: combo(g, [[1, 'full'], [-1, 'bare']]) }; }
  HERO[h] = { name: HEROES[h].name, lvl, abilities: ids };
  for (const id of ids) {
    const A = { hero: h, heroName: HEROES[h].name, id, name: HEROES[h].abilities.find((a) => a.id === id).name, passive: !!(ABILITIES[id] && ABILITIES[id].passiveTier) || id === 'oldBones' /* (Old Bones works through a hook in kits.js; its score is always 0) */, hook: !!(ABILITIES[id] && ABILITIES[id].hook), m: {} };
    const [o1, o2] = ids.filter((x) => x !== id);
    for (const m of MEASURES) {
      const g = (b) => series[m](h, b);
      A.m[m] = {
        kit: combo(g, [[1, 'full'], [-1, 'off:' + id]]),         // minus one
        alone: combo(g, [[1, 'only:' + id], [-1, 'bare']]),      // only one
        upg: combo(g, [[1, 'full'], [-1, 'one:' + id]]),         // tier I -> III with the others at III
        gap: combo(g, [[1, 'full'], [-1, 'off:' + id], [-1, 'only:' + id], [1, 'bare']]), // kit - alone
        offLvl: est(g('off:' + id) || []), onlyLvl: est(g('only:' + id) || []), oneLvl: est(g('one:' + id) || []),
      };
      if (STEP_CHECK.includes(id)) { A.m[m].s12 = combo(g, [[1, 'two:' + id], [-1, 'one:' + id]]); A.m[m].s23 = combo(g, [[1, 'full'], [-1, 'two:' + id]]); }
    }
    // casts and sources: per run (dungeon) / per fight (battle)
    const castOf = (b) => { const d = DG.heroes[h] && DG.heroes[h][b], B = BT.heroes[h] && BT.heroes[h][b];
      const dn = d ? d.rooms.length : 0, dc = d ? d.casts[id] || 0 : 0, dm = d ? d.secs / 60 : 0;
      let bc = 0, bn = 0, bm = 0; if (B) for (const s of Object.keys(B)) { bc += B[s].casts[id] || 0; bn += B[s].win.length; bm += B[s].t / 60; }
      return { dPerRun: dn ? dc / dn : NaN, dPerMin: dm ? dc / dm : NaN, bPerFight: bn ? bc / bn : NaN, bPerMin: bm ? bc / bm : NaN }; };
    A.casts = { full: castOf('full'), only: castOf('only:' + id), one: castOf('one:' + id) };
    const share = (b) => { const d = DG.heroes[h] && DG.heroes[h][b]; let tot = 0, mine = 0, ht = 0, hm = 0;
      if (d) { for (const [k, v] of Object.entries(d.src)) { tot += v; if (k === 'ab:' + id) mine += v; } for (const [k, v] of Object.entries(d.hsrc)) { ht += v; if (k === 'ab:' + id) hm += v; } }
      const B = BT.heroes[h] && BT.heroes[h][b]; let bt = 0, bmn = 0; if (B) for (const s of Object.keys(B)) for (const [k, v] of Object.entries(B[s].src)) { bt += v; if (k === 'ab:' + id) bmn += v; }
      return { dDmg: tot ? mine / tot : 0, dHeal: ht ? hm / ht : 0, bDmg: bt ? bmn / bt : 0 }; };
    A.share = share('full');
    // the switched-off check: no cast and no 'ab:id' damage/heal in any build where it is off
    A.leaks = [];
    for (const b of ['bare', 'off:' + id, 'only:' + o1, 'only:' + o2]) {
      const d = DG.heroes[h] && DG.heroes[h][b], B = BT.heroes[h] && BT.heroes[h][b];
      let c = 0, s = 0; if (d) { c += d.casts[id] || 0; s += (d.src['ab:' + id] || 0) + (d.hsrc['ab:' + id] || 0); }
      if (B) for (const sc of Object.keys(B)) { c += B[sc].casts[id] || 0; s += B[sc].src['ab:' + id] || 0; }
      if (c || s > 0.5) A.leaks.push({ build: b, casts: c, amount: +s.toFixed(1) });
    }
    ABS.push(A);
  }
}

// ---------------------------------------------------------------- pair interactions (combos)
// For a pair (a, b) and the third ability c: with c off, AB - A - B + bare (only:c is "off:a and off:b"... see below);
// with c on, ABC - BC - AC + C. Builds: AB = off:c, A = only:a, BC = off:a, C = only:c.
const PAIRS = [];
for (const h of Object.keys(HERO)) {
  const ids = HERO[h].abilities;
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const a = ids[i], b = ids[j], c = ids[3 - i - j];
    const P = { hero: h, a, b, c, m: {} };
    for (const m of ['rooms', 'duel', 'group', 'battle']) {
      const g = (x) => series[m](h, x);
      P.m[m] = { off: combo(g, [[1, 'off:' + c], [-1, 'only:' + a], [-1, 'only:' + b], [1, 'bare']]), on: combo(g, [[1, 'full'], [-1, 'off:' + a], [-1, 'off:' + b], [1, 'only:' + c]]) };
    }
    PAIRS.push(P);
  }
}

// ---------------------------------------------------------------- scores and noise
const sdOf = (xs) => { const v = xs.filter((x) => Number.isFinite(x)); const m = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length); };
const median = (xs) => { const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : NaN; };
// The spread of the abilities' TRUE worths in a measure: the spread of the estimates less the part the noise makes.
const trueSd = (m) => { const es = ABS.map((A) => A.m[m].kit).filter((e) => e && Number.isFinite(e.m)); const obs = sdOf(es.map((e) => e.m)); const nv = es.reduce((a, e) => a + e.se ** 2, 0) / es.length; return Math.sqrt(Math.max(obs ** 2 - nv, 0.25 * obs ** 2)); };
const SD = { rooms: trueSd('rooms'), battle: trueSd('battle') };
// Combined score: each setting's worth over that spread, weighted by how sure it is (1 / standard error squared).
const zw = (list) => { let sw = 0, sz = 0; for (const [e, sd] of list) if (e && Number.isFinite(e.m) && e.se > 0) { const w = (sd / e.se) ** 2; sw += w; sz += w * e.m / sd; } return sw ? sz / sw : NaN; };
const zOf = (A, k = 'kit') => zw([[A.m.rooms[k], SD.rooms], [A.m.battle[k], SD.battle]]);
for (const A of ABS) { A.score = zOf(A, 'kit'); A.scoreAlone = zOf(A, 'alone'); A.scoreUpg = zOf(A, 'upg'); }
const clear = (e) => e && Number.isFinite(e.m) && Math.abs(e.m) > 2 * e.se;
const NOISE = {};
for (const m of ['rooms', 'dDps', 'dSaved', 'dHeal', 'dDowns', 'duel', 'duelWin', 'group', 'groupWin', 'battle']) NOISE[m] = { kitSE: median(ABS.map((A) => A.m[m].kit && A.m[m].kit.se)), aloneSE: median(ABS.map((A) => A.m[m].alone && A.m[m].alone.se)), upgSE: median(ABS.map((A) => A.m[m].upg && A.m[m].upg.se)), levelSE: median(Object.values(HERO).map((H) => H.lvl[m].full.se)) };

// ---------------------------------------------------------------- summary JSON
const r3 = (x) => (Number.isFinite(x) ? +x.toFixed(3) : null);
const slim = (e) => (e ? { m: r3(e.m), se: r3(e.se), n: e.n } : null);
const summary = {
  note: 'Balance audit round 16, lane worth. Worth = difference in outcome between builds, the same seeds per build (paired). rooms: dungeon rooms cleared; duel: mean health margin over the four 1v1 panel fights (-1..1); group: health margin in the group fight; battle: (duel + group) / 2; *Win: win rate (draw = 0.5). kit = full - off, alone = only - bare, upg = full - tier I, gap = kit - alone, s12/s23 = the tier steps.',
  runs: { dungeonN: DG.n, battleSeeds: BT.seeds, panel: BT.panel, problems: { battle: BT.problems, dungeon: DG.problems } }, noise: NOISE, sd: SD,
  heroes: Object.fromEntries(Object.entries(HERO).map(([h, H]) => [h, { name: H.name, levels: Object.fromEntries(Object.entries(H.lvl).map(([m, L]) => [m, { full: slim(L.full), bare: slim(L.bare), span: slim(L.span) }])) }])),
  abilities: ABS.map((A) => ({ hero: A.hero, id: A.id, name: A.name, passive: A.passive, score: r3(A.score), scoreAlone: r3(A.scoreAlone), scoreUpg: r3(A.scoreUpg), casts: A.casts, share: A.share, leaks: A.leaks,
    m: Object.fromEntries(Object.entries(A.m).map(([m, E]) => [m, Object.fromEntries(Object.entries(E).map(([k, e]) => [k, slim(e)]))])) })),
  pairs: PAIRS.map((P) => ({ hero: P.hero, a: P.a, b: P.b, c: P.c, m: Object.fromEntries(Object.entries(P.m).map(([m, E]) => [m, { off: slim(E.off), on: slim(E.on) }])) })),
};
if (opt('summary')) writeFileSync(opt('summary'), JSON.stringify(summary, null, 1));

// ---------------------------------------------------------------- the report
const nm = (A) => `${A.name} (${A.id})`, hn = (h) => `${HEROES[h].name} (${h})`;
const abName = (h, id) => HEROES[h].abilities.find((a) => a.id === id).name;
const sg = (x, d = 2) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(d) : 'n/a');
const pc = (x) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + Math.round(100 * x) : 'n/a');
const it = (e, f) => (!e || !Number.isFinite(e.m) ? 'n/a' : clear(e) ? f(e.m) : `*${f(e.m)}*`); // italics = inside the noise (under 2 standard errors)
const castTxt = (c) => `${Number.isFinite(c.dPerRun) ? c.dPerRun.toFixed(1) : '-'} / ${Number.isFinite(c.bPerFight) ? c.bPerFight.toFixed(1) : '-'}`;
const L = [];
const P = (s = '') => L.push(s);
const raw = { zw, L, P, ABS, PAIRS, HERO, NOISE, SD, summary, it, sg, pc, nm, hn, abName, clear, castTxt, BT, DG, PANEL4, allyOf };
if (opt('md')) {
  const { write } = await import('./report.mjs');
  writeFileSync(opt('md'), write(raw));
}
console.log(`abilities ${ABS.length}, pairs ${PAIRS.length}; noise`, JSON.stringify(NOISE));
console.log('leaks', ABS.filter((A) => A.leaks.length).map((A) => `${A.hero}.${A.id} ${JSON.stringify(A.leaks)}`).join('\n') || 'none');
