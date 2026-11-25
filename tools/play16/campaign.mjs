// Round 16, lane play16 (measurement only): a fresh save played run after run the way a player would, with one of the
// strategies in strategies.mjs, recording the camp (levels, points and what they bought, gold in and out, trinkets,
// seats, draughts), every room (strength, foes, elites and majors, damage taken, health, time, downs) and the floors'
// last foes (time to kill, how close the party came to falling).
//   node tools/play16/campaign.mjs --strategy archer-fill [--seed 1] [--runs 160] [--until 4] [--out file.json] [--v]
// until: stop once that many dungeons have had their boss beaten (4: the Wildwood, the Warren, the Sewers, the Crypt).
import './env.mjs';
import fs from 'node:fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const NAME = opt('strategy', 'archer-fill'), SEED = +opt('seed', 1), RUNS = +opt('runs', 160), UNTIL = +opt('until', 4), V = args.includes('--v');
const OUT = opt('out', `docs/audit/data/play16/${NAME}-s${SEED}.json`);

const { newRun, update, retreat, summarize, LAYERS } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { HEROES } = await import('../../js/heroes.js');
const { freshSave } = await import('../../js/save.js');
const { alive } = await import('../../js/sim.js');
const P = await import('../../js/progress.js');
const { STRATS, JOIN, HERO_BUY, TRINKET_PREF } = await import('./strategies.mjs');
const { probe, PROBE_ERRORS } = await import('./probe.mjs');
const S = STRATS[NAME]; if (!S) { console.error('no strategy ' + NAME); process.exit(2); }
const DT = 1 / 60;
const errors = [];

// ---------------------------------------------------------------- camp: points
// (abilities: a node on the way to the next tier, its first rank only: one rank of Barrage cooldown opens Barrage II)
const ORDER = {
  abilities: (n, r) => (n.kind === 'ability' ? 0 : n.kind === 'tier' ? 1 : n.ability && !r && (n.id === n.ability + 'Cd' || n.id === n.ability + 'Pow') ? 1.5 : n.kind === 'slot' ? 2 : n.kind === 'keystone' ? 3 : 4),
  stats: (n) => (n.kind === 'stat' && !n.ability ? 0 : n.kind === 'slot' || n.kind === 'keystone' ? 1 : n.kind === 'ability' ? 2 : n.kind === 'tier' ? 3 : 4),
};
function spend(save, k) {
  if (S.spend === 'auto') return P.autoSpend(save, k);
  const bought = [];
  for (let guard = 0; guard < 400; guard++) {
    // what it could buy if it had the points: the best of those, or wait and save for it (a tier III costs two)
    const can = P.tree(k).filter((n) => { const st = P.nodeState(save, k, n); return st.met && !st.maxed; });
    if (!can.length) break;
    const o = (n) => ORDER[S.spend](n, P.rank(save, k, n.id));
    can.sort((a, b) => o(a) - o(b) || Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
    if (!P.buyNode(save, k, can[0].id)) break;
    bought.push(can[0].id);
  }
  return bought;
}
// ---------------------------------------------------------------- camp: party and gold
const roleOf = (k) => { const r = HEROES[k].role; return r === 'tank' || r === 'support' || r === 'ranged' ? r : 'dps'; };
function pickParty(save) {
  const n = P.slotCount(save);
  if (S.party === 'solo') return [S.starter];
  const owned = Object.keys(save.heroes).filter((k) => save.heroes[k].owned && k !== S.starter);
  const rank = (k) => (JOIN.indexOf(k) < 0 ? 99 : JOIN.indexOf(k));
  owned.sort(S.party === 'bought'
    ? (a, b) => (!!HEROES[b].starter === !!HEROES[a].starter ? 0 : HEROES[a].starter ? 1 : -1) || (save.boughtAt[b] || 0) - (save.boughtAt[a] || 0) || rank(a) - rank(b)
    : (a, b) => save.heroes[b].level - save.heroes[a].level || rank(a) - rank(b));
  return [S.starter, ...owned].slice(0, n);
}
function buyTrinketFor(save, k, id, slot, cs) {
  const t = P.trinketInfo(id);
  if (!P.buyTrinket(save, id)) return false;
  P.equip(save, k, id, slot); cs.spent.trinkets += t.price; cs.bought.push(`${k}:${id}`);
  return true;
}
function upgradeAll(save, party, keep, cs) {
  for (let pass = 0; pass < 6; pass++) {
    let any = false;
    for (const k of party) for (const id of save.heroes[k].trinkets) {
      const c = P.upgradePrice(save, id); if (c == null || save.gold - c < keep) continue;
      if (P.upgradeTrinket(save, id)) { cs.spent.upgrades += c; cs.bought.push(`lv${P.trinketLevel(save, id)}:${id}`); any = true; }
    }
    if (!any) break;
  }
}
function camp(save, i, cs) {
  // heroes first (a bought hero changes the party)
  const ownedN = () => Object.values(save.heroes).filter((h) => h.owned).length;
  const buyHero = (id) => { const p = P.heroPrice(id); if (P.unlockHero(save, id)) { cs.spent.heroes += p; cs.bought.push('hero:' + id); save.boughtAt[id] = i + 1; return true; } return false; };
  if (S.gold === 'heroes') { for (const id of HERO_BUY) if (!save.heroes[id].owned) { if (save.gold >= P.heroPrice(id)) buyHero(id); break; } }
  if (S.gold === 'balanced' && S.party !== 'solo' && ownedN() < P.slotCount(save)) { const id = HERO_BUY.find((x) => !save.heroes[x].owned); if (id && save.gold >= P.heroPrice(id) + 150) buyHero(id); }
  const party = pickParty(save);
  for (const k of party) cs.points[k] = spend(save, k);
  if (S.gold === 'balanced') {
    if (save.gold >= 30) while (save.potions < party.length && save.gold >= 30) { P.buyPotion(save, 'heal'); cs.spent.potions += 30; }
    for (const k of party) if (!save.heroes[k].trinkets.length) { const id = TRINKET_PREF[roleOf(k)][0]; if (save.gold >= P.trinketInfo(id).price) buyTrinketFor(save, k, id, 0, cs); }
    if (save.gold > 500) upgradeAll(save, party, 300, cs);
  } else if (S.gold === 'trinkets') {
    for (const k of party) {
      const pref = TRINKET_PREF[roleOf(k)], h = save.heroes[k];
      const slots = P.trinketSlots(save, k);
      for (let slot = 0; slot < slots; slot++) {
        const cur = h.trinkets[slot], curI = cur ? pref.indexOf(cur) : -1;
        // the best one it can afford that's better than what it wears in that slot (and not worn in the other)
        const can = pref.map((id, j) => ({ id, j })).filter(({ id, j }) => j > curI && !h.trinkets.includes(id) && P.trinketInfo(id).price <= save.gold);
        if (can.length) buyTrinketFor(save, k, can[can.length - 1].id, slot, cs);
      }
    }
    upgradeAll(save, party, 0, cs);
  } else if (S.gold === 'potions') {
    while (save.potions < Math.min(P.POTION_MAX, party.length * P.CARRY_MAX) && save.gold >= 30) { P.buyPotion(save, 'heal'); cs.spent.potions += 30; }
  }
  return party;
}

// ---------------------------------------------------------------- a hero, as it goes in
const probeCache = new Map();
function heroSnap(save, k) {
  const h = save.heroes[k];
  const tiers = Object.fromEntries(HEROES[k].abilities.map((ab) => [ab.id, P.abilityTiers(save, k, ab.id)]));
  const worn = h.trinkets.map((id) => { const lv = P.trinketLevel(save, id); return lv > 1 ? { id, lv } : id; });
  const key = k + JSON.stringify(h.nodes) + JSON.stringify(worn);
  if (!probeCache.has(key)) probeCache.set(key, probe(save, k, worn));
  const st = P.heroStats(save, k);
  return { k, lv: h.level, xp: h.xp, pts: h.points, spent: P.spentPoints(save, k), tiers, trinkets: worn, probe: probeCache.get(key),
    st: { dmg: +st.dmg.toFixed(2), hp: +st.hp.toFixed(2), atk: +st.atkSpeed.toFixed(2), armor: +st.armor.toFixed(2), haste: +st.haste.toFixed(2) } };
}

// ---------------------------------------------------------------- one run, watched room by room
const enemyOf = (u) => (u.trueTeam || u.team) === 'enemy' && !u.def.trap;
function partyHp(run) {
  const w = run.world; let hp = 0, max = 0;
  for (const k of run.party) {
    const hs = run.heroes[k], u = w.units.find((x) => x.kind === k && (x.trueTeam || x.team) === 'hero' && !x.summon && !x.gone && !x.dead);
    const m = (u && u.maxHp) || hs.maxHp || 1; max += m;
    if (u) hp += u.downed ? 0 : Math.max(0, u.hp); else if (!hs.down && hs.hp != null) hp += hs.hp; else if (!hs.down && hs.hp == null) hp += m;
  }
  return max ? hp / max : 0;
}
const sumStat = (run, f) => run.party.reduce((a, k) => a + ((run.stats.heroes[k] && run.stats.heroes[k][f]) || 0), 0);
function playRun(save, opts, runIdx) {
  const run = newRun(save, opts);
  P.applyLoadout(run, opts);
  const rooms = []; let cur = null, t = 0;
  const potions0 = run.party.reduce((a, k) => a + (run.heroes[k].potions || 0), 0);
  const open = () => {
    const w = run.world;
    cur = { n: run.rooms, f: run.floor, L: run.node.L, kind: run.node.kind, shape: w.shape, cells: w.cells.length, m: +w.mult.toFixed(3),
      waves: w.waves ? w.waves.left : 0, t0: t, fightT: null, hp0: +partyHp(run).toFixed(3), minHp: 1, taken0: sumStat(run, 'taken'), dmg0: sumStat(run, 'dmg'),
      heal0: sumStat(run, 'heal'), downs0: sumStat(run, 'downs'), coins0: run.coins, lv0: run.party.map((k) => run.heroes[k].level), seen: new Map(), boss: null };
  };
  const close = (how) => {
    if (!cur) return;
    const foes = [...cur.seen.values()];
    const main = foes.filter((f) => !f.minion && !f.floorFoe);
    const r = { n: cur.n, f: cur.f, L: cur.L, kind: cur.kind, shape: cur.shape, cells: cur.cells, m: cur.m, waves: cur.waves,
      foes: main.length, minions: foes.length - main.length - (cur.boss ? 1 : 0), elites: main.filter((f) => f.elite && !f.major).length, majors: main.filter((f) => f.major).length,
      majorsAt0: main.filter((f) => f.major && f.at < 1).length, foeHp: Math.round(main.reduce((a, f) => a + f.hp, 0)),
      fightT: +(cur.fightT ?? (t - cur.t0)).toFixed(1), roomT: +(t - cur.t0).toFixed(1), hp0: cur.hp0, hp1: +partyHp(run).toFixed(3), minHp: +cur.minHp.toFixed(3),
      taken: Math.round(sumStat(run, 'taken') - cur.taken0), dmg: Math.round(sumStat(run, 'dmg') - cur.dmg0), heal: Math.round(sumStat(run, 'heal') - cur.heal0),
      downs: sumStat(run, 'downs') - cur.downs0, coins: run.coins - cur.coins0, lvUp: run.party.reduce((a, k, j) => a + run.heroes[k].level - cur.lv0[j], 0), end: how };
    const maxHp = run.party.reduce((a, k) => a + (run.heroes[k].maxHp || 0), 0); r.takenPct = maxHp ? +(r.taken / maxHp).toFixed(3) : null;
    if (cur.boss) { const b = cur.boss; r.boss = { kind: b.kind, hp: b.hp, killed: b.killT != null, ttk: b.killT != null ? +(b.killT - b.t0).toFixed(1) : null, minHp: +b.minHp.toFixed(3), downs: sumStat(run, 'downs') - b.downs0, taken: Math.round(sumStat(run, 'taken') - b.taken0), left: b.killT != null ? 0 : +(Math.max(0, b.u.hp) / b.u.maxHp).toFixed(3) }; }
    rooms.push(r); cur = null;
  };
  open();
  let leftEarly = false;
  while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < 6000) {
    // leaving: between rooms (the fade), as a player taps Leave there
    if (run.phase === 'transition' && !run._asked) {
      run._asked = true;
      if (S.depth === 'floor' && run.newFloor) { close('left'); retreat(run, true); break; }
      if (S.depth === 'cautious' && !run.newFloor) {
        let hp = 0, max = 0, pots = 0; for (const k of run.party) { const hs = run.heroes[k]; max += hs.maxHp || 1; hp += hs.down ? 0 : (hs.hp ?? hs.maxHp ?? 1); pots += hs.potions || 0; }
        if (hp / max < 0.3 && !pots) { close('left'); retreat(run, true); leftEarly = true; break; }
      }
    }
    try { update(run, DT); } catch (e) { // (a game error mid-run: logged, and the run counted as a wipe)
      errors.push({ run: runIdx + 1, room: run.rooms, msg: String(e && e.message), at: String(e && e.stack).split(/\n/).slice(1, 9).map((x) => x.trim()).join(' < ') });
      console.error(`run ${runIdx + 1} room ${run.rooms}: ${e && e.message}`); run.phase = 'lost'; summarize(run); break; }
    t += DT;
    if (run.phase !== 'transition') run._asked = false;
    if (run.rooms !== (cur ? cur.n : -1) && run.world) { close('won'); open(); }
    const w = run.world;
    for (const u of w.units) if (enemyOf(u) && !cur.seen.has(u.id)) {
      cur.seen.set(u.id, { kind: u.kind, elite: !!u.elite, major: !!u.major, minion: !!(u.minion || u.summon || u.calledBy || u.gen), floorFoe: !!u.floorFoe, hp: u.maxHp, at: t - cur.t0 });
      if (u.floorFoe && !cur.boss) cur.boss = { kind: u.kind, hp: u.maxHp, u, t0: t, killT: null, minHp: 1, downs0: sumStat(run, 'downs'), taken0: sumStat(run, 'taken') };
    }
    const hp = partyHp(run); if (hp < cur.minHp) cur.minHp = hp;
    if (cur.boss && cur.boss.killT == null) { if (hp < cur.boss.minHp) cur.boss.minHp = hp; if (!alive(cur.boss.u) || cur.boss.u.dead) cur.boss.killT = t; }
    if (cur.fightT == null && run.phase !== 'fight') cur.fightT = t - cur.t0;
  }
  if (run.phase === 'transition' || run.phase === 'fight' || run.phase === 'choose' || run.phase === 'loot') { run.phase = 'lost'; summarize(run); } // (the 6000 s cap: counted as a wipe)
  if (cur) close(run.phase);
  const potions1 = run.party.reduce((a, k) => a + (run.heroes[k].potions || 0), 0);
  return { run, rooms, t, drank: potions0 - potions1, leftEarly };
}

// ---------------------------------------------------------------- the campaign
const save = freshSave(); save.boughtAt = {};
const out = { strategy: NAME, ...S, seed: SEED, runs: [], events: [] };
const walls = {};
for (let i = 0; i < RUNS; i++) {
  const cs = { goldIn: save.gold, spent: { trinkets: 0, upgrades: 0, heroes: 0, potions: 0 }, bought: [], points: {} };
  const party = camp(save, i, cs);
  const snaps = party.map((k) => heroSnap(save, k));
  const theme = P.openDungeons(save).slice(-1)[0], st = P.dungeonState(save, theme);
  const key = theme + st.checkpoint, wall = S.depth !== 'floor' && (walls[key] || 0) >= 3;
  const floor = wall ? Math.max(1, st.checkpoint - 1) : st.checkpoint;
  if (wall) walls[key] = 0;
  save.party = party;
  const potionFor = {}; let left = save.potions;
  for (const k of party) { const n = Math.min(P.CARRY_MAX, left); if (n) { potionFor[k] = Array(n).fill('heal'); left -= n; } }
  if (S.gold !== 'potions') for (const k of party) if (potionFor[k] && potionFor[k].length > 1) { left += potionFor[k].length - 1; potionFor[k] = ['heal']; }
  const opts = P.runOptions(save, theme, potionFor, floor);
  P.payForRun(save, opts); opts.party = party;
  setSeed(SEED * 100003 + i * 7919);
  const slotsIn = P.slotCount(save);
  const { run, rooms, t, drank, leftEarly } = playRun(save, opts, i);
  const res = run.phase === 'won' ? 'won' : run.phase;
  if (opts.floor === st.checkpoint && run.floor === opts.floor && run.map.L < 2 && res === 'lost') walls[key] = (walls[key] || 0) + 1;
  else if (run.floor > opts.floor || run.map.L >= 2) walls[key] = 0;
  const rep = P.applySummary(save, run, res, 0);
  for (const h of Object.values(save.heroes)) h.recoverUntil = 0;
  const rec = { i: i + 1, theme, from: opts.floor, res, leftEarly, endF: run.floor, endL: run.map.L, nRooms: rooms.length, simT: Math.round(t), party, slots: slotsIn,
    heroes: snaps, lvOut: party.map((k) => save.heroes[k].level), camp: cs, potionsIn: Object.values(opts.potions).reduce((a, b) => a + b, 0), drank,
    gold: { raw: rep.raw, lost: rep.lost, kept: rep.gold, bank: save.gold }, minis: rep.minis, boss: rep.bossKilled, slotsOut: save.slots, opened: rep.opened, rooms: rooms };
  out.runs.push(rec);
  const ev = (s) => out.events.push({ run: i + 1, s });
  if (rep.slots.unlocked.length) ev(`seat ${rep.slots.after} (${rep.slots.unlocked.join(',')})`);
  rep.minis.forEach((m, j) => { if (m) ev(`${theme} mini ${j + 1}`); });
  if (rep.bossKilled) ev(`${theme} boss`);
  if (rep.opened.length) ev(`opened ${rep.opened.join(',')}`);
  if (V) console.log(`#${String(i + 1).padStart(3)} ${theme.padEnd(8)} f${opts.floor} ${res.padEnd(9)} f${run.floor}.${run.map.L + 1} ${party.map((k, j) => k.slice(0, 4) + snaps[j].lv + '>' + save.heroes[k].level).join(' ')} gold +${rep.gold} -${rep.lost} bank ${save.gold} spent ${Object.values(cs.spent).reduce((a, b) => a + b, 0)} ${Math.round(t)}s`);
  const cleared = Object.values(save.dungeons).filter((d) => d.cleared > 0).length;
  if (cleared >= UNTIL) break;
}
out.errors = errors; out.probeErrors = PROBE_ERRORS;
out.final = { gold: save.gold, slots: save.slots, heroes: Object.fromEntries(Object.entries(save.heroes).filter(([, h]) => h.owned).map(([k, h]) => [k, { lv: h.level, nodes: h.nodes, trinkets: h.trinkets }])),
  dungeons: save.dungeons, tlv: save.tlv, bag: save.trinkets };
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`${NAME} seed ${SEED}: ${out.runs.length} runs, dungeons ${Object.entries(save.dungeons).map(([k, d]) => `${k} cp${d.checkpoint} x${d.cleared}`).join(' | ')}; ${out.events.map((e) => `r${e.run} ${e.s}`).join('; ')}`);
