// Headless convoy checks in Node (no browser): js/convoy.js, the wagon mode.
//   node tools/convoys.mjs [--n 20] [--level 4] [--party paladin,archer,cleric] [--seed 1] [--v] [--spend none] [--lands wildwood,warren]
// Plays the whole trip N times with a party at that level (points spent with progress.js autoSpend), shopping at each
// roadside camp like a player might (convoy.js autoShop: mend a wagon under 60%, a draught for an empty pack; --spend
// none keeps every coin). --lands: the countries the road may run through (default: a fresh save's, the Wildwood). Reports errors, stuck trips (the wagon not moving and nothing dying for 120 s), how often it's delivered,
// the wagon's health at the end, how far lost trips got, and the gold picked up against the gold dropped.
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 20), level = +opt('level', 4), seed0 = +opt('seed', 1), verbose = args.includes('--v'), spend = opt('spend', 'auto'), lands = opt('lands') ? opt('lands').split(',') : null;
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const DT = 1 / 60;
const C = await import('../js/convoy.js');
const { setSeed } = await import('../js/util.js');
const { freshSave } = await import('../js/save.js');
const P = await import('../js/progress.js');
const { HERO_IDS, STARTERS } = await import('../js/heroes.js');

const pool = HERO_IDS.slice();
function partyFor(i) {
  if (opt('party')) return opt('party').split(',');
  let s = 7919 * (i + seed0); const r = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const out = []; while (out.length < 3) { const k = pool[Math.floor(r() * pool.length)]; if (!out.includes(k)) out.push(k); }
  return out;
}
function saveFor(party) {
  const save = freshSave();
  for (const k of party) { const h = save.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(save, k); }
  save.party = party.slice();
  return save;
}

const tot = { waveFoes: 0, popped: 0, madeInFight: 0, spent: 0, leftBehind: 0, n: 0, delivered: 0, wagon: 0, party: 0, err: 0, stuck: 0, health: 0, picked: 0, dropped: 0, behind: 0, gold: 0, time: 0, xp: 0, reached: [0, 0, 0], picks: {} };
for (let i = 0; i < n; i++) {
  setSeed(seed0 * 1000 + i);
  const party = partyFor(i), save = saveFor(party);
  let run, err = null, t = 0, stuck = false;
  try {
    run = C.newConvoy(save, { party, lands });
    let lastX = 0, lastKills = 0, still = 0;
    while (!run.summary && t < 3600) {
      if (run.phase === 'roadside') {
        const before = run.picks.length;
        if (spend !== 'none') C.autoShop(run);
        for (const p of run.picks.slice(before)) tot.picks[p.choice] = (tot.picks[p.choice] || 0) + 1;
        C.setOff(run);
      }
      C.updateConvoy(run, DT); t += DT;
      const wg = run.wagon;
      if (Math.abs(wg.x - lastX) > 2 || run.kills !== lastKills || run.phase !== 'road') { still = 0; lastX = wg.x; lastKills = run.kills; } else still += DT;
      if (still > 120) { stuck = true; break; }
      for (const u of run.world.units) if (!u.dead && (!isFinite(u.x) || !isFinite(u.y))) throw new Error(`${u.kind} at NaN`);
      // pop-in check: where each foe is first seen (not hidden under the trees). A wave's foe first seen out on open
      // ground inside the screen (at the default zoom) popped into view; one made mid-fight (a split, a summon) is counted apart.
      if (run.phase === 'road') for (const u of run.world.units) {
        if (u.seenAt || u.dead || u.downed || u.ethereal || u.team === run.wagon.team || u.team === 'neutral') continue;
        u.seenAt = true; const wg = run.wagon, w = run.world;
        const open = u.y > C.EDGE + 30 && u.y < w.H - C.EDGE - 30, onScreen = u.x > wg.x - C.BEHIND && u.x < wg.x + 1800;
        if (u.hideT != null) { tot.waveFoes++; if (open && onScreen) tot.popped++; } else if (open && onScreen && run.t > 0.5 && !u.chief && !u.floorFoe) { tot.madeInFight++; (tot.made || (tot.made = {}))[u.kind] = (tot.made[u.kind] || 0) + 1; }
      }
    }
    if (!run.summary && !stuck) stuck = true;
  } catch (e) { err = e; }
  tot.n++;
  if (err) { tot.err++; console.log(`  #${i} ERROR (${party}):`, err.stack.split('\n').slice(0, 5).join('\n')); continue; }
  if (stuck) { tot.stuck++; const wg = run.wagon; console.log(`  #${i} STUCK (${party}) stretch ${run.stretch + 1} wagon x ${Math.round(wg.x)} phase ${run.phase} foes ${run.world.units.filter((u) => u.team !== wg.team && !u.dead && !u.downed).map((u) => u.kind + '@' + Math.round(u.x) + ',' + Math.round(u.y)).join(' ')}`); continue; }
  const s = run.summary, before = party.map((k) => save.heroes[k].level);
  const rep = C.applyConvoy(save, run);
  tot[s.result] = (tot[s.result] || 0) + 1; tot.reached[s.stretch - 1]++;
  if (s.delivered) tot.health += s.health;
  tot.picked += s.picked; tot.spent += s.spent; tot.leftBehind += run.leftBehind || 0; tot.dropped += s.dropped; tot.behind += s.behind; tot.gold += s.gold; tot.time += s.time;
  tot.xp += rep.heroes.reduce((a, h, j) => a + h.level - before[j], 0) / party.length;
  if (verbose) console.log(`  #${i} ${s.result.padEnd(9)} wagon by stretch ${(run.hpLog || []).map((x) => Math.round(100 * x)).join('/')} stretch ${s.stretch} wagon ${Math.round(s.health * 100)}% picked ${s.picked}/${s.dropped} (behind ${s.behind}) pay ${s.pay} gold ${s.gold} ${Math.round(s.time)}s ${party.join(',')} lv ${before.join('/')}→${rep.heroes.map((h) => h.level).join('/')} ${s.picks.map((p) => p.choice).join(',')}`);
}
const ok = tot.n - tot.err - tot.stuck, pc = (x) => Math.round(100 * x / Math.max(1, ok)) + '%';
console.log(`${tot.n} trips at level ${level}: delivered ${tot.delivered} (${pc(tot.delivered)}), wagon broke ${tot.wagon}, party fell ${tot.party}, errors ${tot.err}, stuck ${tot.stuck}`);
console.log(`  ended on stretch 1/2/3: ${tot.reached.join('/')} | wagon health when delivered ${Math.round(100 * tot.health / Math.max(1, tot.delivered))}%`);
console.log(`  gold picked up ${Math.round(tot.picked / Math.max(1, ok))} of ${Math.round(tot.dropped / Math.max(1, ok))} dropped a trip (${Math.round(100 * tot.picked / Math.max(1, tot.dropped))}%), left behind ${Math.round(tot.behind / Math.max(1, ok))} | paid ${Math.round(tot.gold / Math.max(1, ok))} gold | +${(tot.xp / Math.max(1, ok)).toFixed(1)} levels a hero | ${Math.round(tot.time / Math.max(1, ok))}s a trip`);
console.log(`  foes that walked in from the trees: ${tot.waveFoes}, popped into view on open ground: ${tot.popped}; made mid-fight by another (splits, summons): ${tot.madeInFight} ${JSON.stringify(tot.made || {})}`);
console.log(`  roadside buys: ${JSON.stringify(tot.picks)} | spent ${Math.round(tot.spent / Math.max(1, ok))} a trip | kept ${Math.round((tot.picked - tot.spent) / Math.max(1, ok))} | heroes left behind on the road ${(tot.leftBehind / Math.max(1, ok)).toFixed(2)} a trip`);
process.exit(tot.err || tot.stuck ? 1 : 0);
