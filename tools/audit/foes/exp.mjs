// The foes audit's batches (measuring only: no game numbers change). Each writes docs/audit/data/foes/<name>.json.
//   node tools/audit/foes/exp.mjs rr     [--seeds 6] [--dungeons wildwood,warren]   1v1 round robin in each dungeon, rank 0 and home strength
//   node tools/audit/foes/exp.mjs cm     [--seeds 4]                                 cost-matched groups, in each dungeon and against the next one (rank 0)
//   node tools/audit/foes/exp.mjs panel  [--seeds 3]                                 each kind, alone and as a pack of 16 cost, against four heroes at tier I and II
//   node tools/audit/foes/exp.mjs swarm  [--seeds 4]                                 each kind alone against eight goblins (its moves against a crowd)
//   node tools/audit/foes/exp.mjs boss   [--seeds 4]                                 each boss against a standard party at tier I and II, home strength
//   node tools/audit/foes/exp.mjs ratswolf [--seeds 30]                              the designer's example: rats against a wolf
// --limit N: only the first N kinds of each dungeon (a quick try). --out name: another file name.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { boot, opt, flag, ROOT } from './lib.mjs';
import { instrument } from './instrument.mjs';

const G = await boot();
const I = instrument(G);
const R = G.B.battleRoster(G.save);
const OLD_COST = { rat: 1, slime: 2, slimeSmall: 1, skeleton: 3 }, OLD_PACK = { rat: [2, 4] };
export const costOf = (k) => G.DEFS[k].cost ?? OLD_COST[k] ?? 3;
const packOf = (k) => G.DEFS[k].pack || OLD_PACK[k] || null;
const homeOf = (k) => G.B.homeOf(k);
const only = opt('dungeons') ? opt('dungeons').split(',') : null;
const limit = +opt('limit', 0);
const DUNG = R.dungeons.filter((d) => !only || only.includes(d.id)).map((d) => ({ ...d, kinds: limit ? d.kinds.slice(0, limit) : d.kinds }));
const mode = process.argv[2];
const OUT = resolve(ROOT, 'docs/audit/data/foes');
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
let nFights = 0, gameT = 0;
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s, ${nFights} fights]`, ...a);
const kindOf = (key) => key.split(':')[1];
const sideKey = (key) => key[0];

// ---- per kind, per scenario: what its moves did
const MOVES = {};
function addMoves(scen, row, key) {
  const k = kindOf(key);
  const M = (MOVES[k] || (MOVES[k] = {}))[scen] || (MOVES[k][scen] = { fights: 0, units: 0, up: 0, fires: {}, armed: {}, dmg: {}, heal: {}, st: {}, bursts: {}, taken: 0, blocked: 0 });
  const add = (m, o) => { for (const [a, b] of Object.entries(o)) m[a] = (m[a] || 0) + b; };
  M.fights++; M.units += row.n; M.up += row.up || 0; M.taken += row.taken; M.blocked += row.blocked;
  add(M.fires, row.fires); add(M.armed, row.armed); add(M.dmg, row.dmg); add(M.heal, row.heal); add(M.bursts, row.bursts);
  for (const [t, s] of Object.entries(row.st)) { const m = M.st[t] || (M.st[t] = { amt: 0, n: 0 }); m.amt += s.amt; m.n += s.n; }
}
const isHero = (k) => G.DEFS[k] && G.DEFS[k].team === 'hero';
function fight(setup, seed, o) {
  const r = I.fight({ size: 'l', scaled: false, ...setup }, seed, o);
  nFights++; gameT += r.time;
  return r;
}
const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
const stacks = (k, n, rank = 0) => { const out = []; while (n > 0) { const m = Math.min(12, n); out.push({ k, n: m, rank }); n -= m; } return out; };
function save(name, data) {
  const f = resolve(OUT, (opt('out') || name) + '.json');
  writeFileSync(f, JSON.stringify({ made: new Date().toISOString().slice(0, 10), fights: nFights, gameSeconds: Math.round(gameT), wallSeconds: Math.round((Date.now() - t0) / 1000), ...data }));
  log('wrote', f.replace(ROOT, '.'));
}
const r1 = (x) => Math.round(x * 10) / 10;

// ---------------------------------------------------------------- 1v1 round robin
if (mode === 'rr') {
  const S = +opt('seeds', 6), pairs = [];
  for (const d of DUNG) {
    for (const strength of ['r0', 'home']) {
      for (let i = 0; i < d.kinds.length; i++) for (let j = i + 1; j < d.kinds.length; j++) {
        const A = d.kinds[i], B = d.kinds[j], p = { d: d.id, strength, A, B, wA: 0, wB: 0, draw: 0, time: 0, timeUps: 0, hpA: 0, hpB: 0, dmgA: 0, dmgB: 0 };
        for (let s = 0; s < S; s++) {
          const flip = s % 2 === 1, sa = flip ? B : A, sb = flip ? A : B;
          const r = fight({ arena: d.id, scaled: strength === 'home', a: [{ k: sa, n: 1, rank: 0 }], b: [{ k: sb, n: 1, rank: 0 }] }, 5000 + s * 7919 + i * 31 + j);
          const wk = r.winner === 'draw' ? null : r.winner === 'a' ? sa : sb;
          if (wk === A) p.wA++; else if (wk === B) p.wB++; else p.draw++;
          p.time += r.time; if (r.timeUp) p.timeUps++;
          const sm = r.run.summary || G.B.summarizeBattle(r.run), hA = sm.sides[flip ? 'b' : 'a'].health, hB = sm.sides[flip ? 'a' : 'b'].health;
          p.hpA += hA; p.hpB += hB;
          for (const [key, row] of Object.entries(r.rows)) { if (kindOf(key) === A && sideKey(key) === (flip ? 'b' : 'a')) p.dmgA += row.dmgTo; else p.dmgB += row.dmgTo; if (strength === 'r0') addMoves('1v1', row, key); }
        }
        for (const k of ['time', 'hpA', 'hpB', 'dmgA', 'dmgB']) p[k] = r1(p[k] / S);
        pairs.push(p);
      }
      log(d.id, strength, 'done');
    }
  }
  save('rr', { seeds: S, pairs, moves: MOVES });
}

// ---------------------------------------------------------------- cost-matched groups
// n of A against m of B with n*cost(A) within 10% of m*cost(B), each side's cost as near 8 as that allows (12 a stack at most).
export function match(cA, cB, target = 8) {
  let best = null;
  for (let n = 1; n <= 12; n++) for (let m = 1; m <= 12; m++) {
    const a = n * cA, b = m * cB, mis = Math.abs(a - b) / Math.max(a, b), tot = (a + b) / 2;
    const score = (mis > 0.1 ? 10 + mis * 10 : 0) + Math.abs(tot - target) / target;
    if (!best || score < best.score) best = { n, m, a, b, mis, score };
  }
  return best;
}
if (mode === 'cm') {
  const S = +opt('seeds', 4), pairs = [];
  const runPair = (d, A, B, tag) => {
    const mt = match(costOf(A), costOf(B)), p = { d, tag, A, B, nA: mt.n, nB: mt.m, costA: r1(mt.a), costB: r1(mt.b), mismatch: Math.round(mt.mis * 100), wA: 0, wB: 0, draw: 0, time: 0, timeUps: 0, hpA: 0, hpB: 0 };
    for (let s = 0; s < S; s++) {
      const flip = s % 2 === 1, la = stacks(A, mt.n), lb = stacks(B, mt.m);
      const r = fight({ arena: d, a: flip ? lb : la, b: flip ? la : lb }, 9000 + s * 7919 + pairs.length * 13);
      const sideA = flip ? 'b' : 'a';
      if (r.winner === 'draw') p.draw++; else if (r.winner === sideA) p.wA++; else p.wB++;
      p.time += r.time; if (r.timeUp) p.timeUps++;
      const sm = r.run.summary || G.B.summarizeBattle(r.run); p.hpA += sm.sides[sideA].health; p.hpB += sm.sides[flip ? 'a' : 'b'].health;
      if (tag === 'in') for (const [key, row] of Object.entries(r.rows)) addMoves('group', row, key);
    }
    for (const k of ['time', 'hpA', 'hpB']) p[k] = r1(p[k] / S);
    pairs.push(p);
  };
  for (let di = 0; di < DUNG.length; di++) {
    const d = DUNG[di];
    for (let i = 0; i < d.kinds.length; i++) for (let j = i + 1; j < d.kinds.length; j++) runPair(d.id, d.kinds[i], d.kinds[j], 'in');
    log(d.id, 'in-dungeon done');
    const nx = DUNG[di + 1];
    if (nx && !flag('noCross')) { for (const A of d.kinds) for (const B of nx.kinds) runPair(nx.id, A, B, 'next'); log(d.id, 'vs', nx.id, 'done'); }
  }
  save('cm', { seeds: S, pairs, moves: MOVES });
}

// ---------------------------------------------------------------- against a hero panel
// The hero is kept on its feet (its health is topped back up every frame), so each fight runs until the hero has killed
// the lot: what they dealt is the toll they take before they die; the hero "would have died" when that passed its health.
export const PANEL = ['paladin', 'berserker', 'archer', 'pyromancer'];
const PACK_COST = 16;
export const packN = (k) => Math.max(1, Math.min(20, Math.round(PACK_COST / costOf(k))));
if (mode === 'panel') {
  const S = +opt('seeds', 3), recs = [];
  for (const d of DUNG) {
    for (const k of d.kinds) {
      for (const size of ['one', 'pack']) {
        const n = size === 'one' ? 1 : packN(k);
        for (const hero of PANEL) for (const tier of [1, 2]) {
          const rec = { d: d.id, k, size, n, cost: r1(n * costOf(k)), hero, tier, toll: 0, ttk: 0, died: 0, clear: 0, cleared: 0, taken: 0, blocked: 0, heroDmg: 0, timeUps: 0, heroMax: 0 };
          for (let s = 0; s < S; s++) {
            let hero0 = null, cum = 0, ttk = null;
            const r = fight({ arena: d.id, a: [{ k: hero, n: 1, tier }], b: stacks(k, n) }, 20000 + s * 7919 + recs.length * 17, {
              prep: (run) => { hero0 = run.sides.a[0]; },
              onDmg: (key, u, amt, t) => { if (u === hero0) { cum += amt; if (ttk == null && cum >= hero0.maxHp) ttk = t; } },
              onFrame: () => { if (hero0 && !hero0.dead && !hero0.downed) hero0.hp = hero0.maxHp; },
            });
            rec.heroMax = hero0.maxHp;
            const heroWon = r.winner === 'a';
            rec.toll += cum; rec.ttk += ttk == null ? 0 : ttk; rec.died += ttk == null ? 0 : 1;
            if (heroWon && !r.timeUp) { rec.cleared++; rec.clear += r.time; }
            if (r.timeUp) rec.timeUps++;
            for (const [key, row] of Object.entries(r.rows)) {
              if (sideKey(key) === 'b') { rec.taken += row.taken; rec.blocked += row.blocked; addMoves(hero === 'archer' ? 'vsRanged' : 'vsHero', row, key); }
              else rec.heroDmg += row.dmgTo;
            }
          }
          rec.ttk = rec.died ? r1(rec.ttk / rec.died) : null; rec.clear = rec.cleared ? r1(rec.clear / rec.cleared) : null;
          for (const x of ['toll', 'taken', 'blocked', 'heroDmg']) rec[x] = r1(rec[x] / S);
          rec.seeds = S;
          recs.push(rec);
        }
      }
    }
    log(d.id, 'done');
    save('panel', { seeds: S, panel: PANEL, packCost: PACK_COST, recs, moves: MOVES }); // (a checkpoint each dungeon)
  }
}

// ---------------------------------------------------------------- in a mixed group
// What a kind adds to a plain group of its dungeon: a partner pack of about 12 cost points, with and without about 4
// points of the kind (at least one), against the paladin and the archer at tier I (kept on their feet as in the panel).
// Added threat per cost = (toll with it - toll without) / its cost. The partner's own extra 4 points are the yardstick.
export const PARTNER = { wildwood: 'bandit', warren: 'hobgoblin', sewers: 'lizardBlade', crypt: 'rattler', frost: 'spiderFrost', ember: 'hellhound', spire: 'angel', dunes: 'jackal', foundry: 'automaton' };
if (mode === 'mix') {
  const S = +opt('seeds', 12), HEROES = ['paladin', 'archer'], recs = [];
  const toll = (d, list, hero, seed) => {
    let h0 = null, cum = 0;
    const r = fight({ arena: d, a: [{ k: hero, n: 1, tier: 1 }], b: list }, seed, {
      prep: (run) => { h0 = run.sides.a[0]; }, onDmg: (key, u, amt) => { if (u === h0) cum += amt; },
      onFrame: () => { if (h0 && !h0.dead && !h0.downed) h0.hp = h0.maxHp; } });
    for (const [key, row] of Object.entries(r.rows)) if (sideKey(key) === 'b') addMoves('mix', row, key);
    return cum;
  };
  for (const d of DUNG) {
    const P = PARTNER[d.id], cP = costOf(P), nP = Math.max(1, Math.round(12 / cP)), nP2 = Math.max(nP + 1, Math.round(16 / cP));
    const base = {}, more = {};
    for (const hero of HEROES) { base[hero] = 0; more[hero] = 0; for (let s = 0; s < S; s++) { base[hero] += toll(d.id, [{ k: P, n: nP }], hero, 60000 + s * 7919) / S; more[hero] += toll(d.id, [{ k: P, n: nP2 }], hero, 60000 + s * 7919) / S; } } // (the same seeds throughout: a paired comparison)
    const yard = HEROES.reduce((a, h) => a + (more[h] - base[h]) / ((nP2 - nP) * cP), 0) / HEROES.length;
    for (const k of d.kinds) {
      const m = Math.max(1, Math.round(4 / costOf(k))), rec = { d: d.id, k, partner: P, nPartner: nP, n: m, cost: r1(m * costOf(k)), added: {}, yard: r1(yard) };
      let a = 0;
      for (const hero of HEROES) { let t = 0; for (let s = 0; s < S; s++) t += toll(d.id, [{ k: P, n: nP }, ...stacks(k, m)], hero, 60000 + s * 7919) / S; rec.added[hero] = r1((t - base[hero]) / rec.cost); a += rec.added[hero] / HEROES.length; }
      rec.addedPerCost = r1(a);
      recs.push(rec);
    }
    log(d.id, 'done, yardstick', yard.toFixed(2));
  }
  save('mix', { seeds: S, heroes: HEROES, partner: PARTNER, recs, moves: MOVES });
}

// ---------------------------------------------------------------- against a swarm
if (mode === 'swarm') {
  const S = +opt('seeds', 4), recs = [];
  for (const d of DUNG) {
    for (const k of d.kinds) {
      const rec = { d: d.id, k, wins: 0, time: 0, kills: 0 };
      for (let s = 0; s < S; s++) {
        const flip = s % 2 === 1, me = [{ k, n: 1, rank: 0 }], them = [{ k: 'goblin', n: 8, rank: 0 }];
        const r = fight({ arena: d.id, a: flip ? them : me, b: flip ? me : them }, 30000 + s * 7919 + recs.length * 11);
        const side = flip ? 'b' : 'a';
        if (r.winner === side) rec.wins++;
        rec.time += r.time;
        for (const [key, row] of Object.entries(r.rows)) if (sideKey(key) === side) { addMoves('vsSwarm', row, key); rec.kills += row.kills; }
      }
      rec.time = r1(rec.time / S); rec.kills = r1(rec.kills / S);
      recs.push(rec);
    }
    log(d.id, 'done');
  }
  save('swarm', { seeds: S, swarm: 'goblin x8', recs, moves: MOVES });
}

// ---------------------------------------------------------------- bosses
export const PARTY = ['paladin', 'berserker', 'archer', 'cleric'];
if (mode === 'boss') {
  const S = +opt('seeds', 4), recs = [];
  for (const d of DUNG) for (const k of d.bosses) for (const tier of [1, 2]) {
    const rec = { d: d.id, k, tier, wins: 0, time: 0, timeUps: 0, heroesLost: 0, bossHpLeft: 0, dmgToParty: 0 };
    for (let s = 0; s < S; s++) {
      const r = fight({ arena: d.id, size: 'l', scaled: true, a: PARTY.map((h) => ({ k: h, n: 1, tier })), b: [{ k, n: 1 }] }, 40000 + s * 7919 + recs.length * 7);
      if (r.winner === 'b') rec.wins++;
      rec.time += r.time; if (r.timeUp) rec.timeUps++;
      const sm = r.run.summary || G.B.summarizeBattle(r.run);
      rec.heroesLost += sm.sides.a.start - sm.sides.a.left; rec.bossHpLeft += sm.sides.b.health;
      for (const [key, row] of Object.entries(r.rows)) if (sideKey(key) === 'b') { addMoves('boss', row, key); rec.dmgToParty += row.dmgTo; }
    }
    for (const x of ['time', 'heroesLost', 'bossHpLeft', 'dmgToParty']) rec[x] = r1(rec[x] / S);
    recs.push(rec);
    log(k, 'tier', tier, JSON.stringify(rec));
  }
  save('boss', { seeds: S, party: PARTY, recs, moves: MOVES });
}

// ---------------------------------------------------------------- rats and a wolf
if (mode === 'ratswolf') {
  const S = +opt('seeds', 30), recs = [];
  const SET = [[1, 1], [2, 1], [3, 1], [4, 2], [6, 3]];
  for (const strength of ['r0', 'home']) for (const ratKind of ['rat', 'ratPlague']) for (const [nr, nw] of SET) {
    const rec = { strength, rats: ratKind, nRats: nr, nWolves: nw, ratCost: r1(nr * costOf(ratKind)), wolfCost: nw * costOf('wolf'), ratWins: 0, wolfWins: 0, draw: 0, time: 0, ratsLeft: 0, wolvesLeft: 0, ratDmg: 0, wolfDmg: 0 };
    for (let s = 0; s < S; s++) {
      const flip = s % 2 === 1, rs = [{ k: ratKind, n: nr, rank: 0 }], ws = [{ k: 'wolf', n: nw, rank: 0 }];
      const r = fight({ arena: 'wildwood', scaled: strength === 'home', a: flip ? ws : rs, b: flip ? rs : ws }, 50000 + s * 7919 + recs.length);
      const rSide = flip ? 'b' : 'a', wSide = flip ? 'a' : 'b';
      if (r.winner === 'draw') rec.draw++; else if (r.winner === rSide) rec.ratWins++; else rec.wolfWins++;
      const sm = r.run.summary || G.B.summarizeBattle(r.run);
      rec.time += r.time; rec.ratsLeft += sm.sides[rSide].left; rec.wolvesLeft += sm.sides[wSide].left;
      for (const [key, row] of Object.entries(r.rows)) if (sideKey(key) === rSide) rec.ratDmg += row.dmgTo; else rec.wolfDmg += row.dmgTo;
    }
    for (const x of ['time', 'ratsLeft', 'wolvesLeft', 'ratDmg', 'wolfDmg']) rec[x] = r1(rec[x] / S);
    recs.push(rec);
    log(JSON.stringify(rec));
  }
  // the two kinds side by side, as battle mode builds them
  const look = {};
  for (const strength of ['r0', 'home']) for (const k of ['rat', 'ratPlague', 'wolf']) {
    G.setSeed(1);
    const run = G.B.newBattle(G.save, { arena: 'wildwood', scaled: strength === 'home', a: [{ k, n: 1 }], b: [{ k: 'wolf', n: 1 }] }), u = run.sides.a[0];
    look[strength + ':' + k] = { home: homeOf(k), cost: costOf(k), pack: packOf(k), hp: u.maxHp, dmg: r1(G.DEFS[k].dmg * u.dmgMul), atkCd: G.DEFS[k].atkCd, speed: Math.round(G.DEFS[k].speed), dps: r1(G.DEFS[k].dmg * u.dmgMul / G.DEFS[k].atkCd) };
  }
  save('ratswolf', { seeds: S, recs, look });
}
if (!['rr', 'cm', 'panel', 'mix', 'swarm', 'boss', 'ratswolf'].includes(mode)) console.log('mode? rr | cm | panel | swarm | boss | ratswolf');
