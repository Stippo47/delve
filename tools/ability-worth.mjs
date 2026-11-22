// What each ability is worth, by switching it off (round 13, the designer: "I could maybe test based off turning a skill
// on and off to see its impact?"). Node, no browser; the same bare runs as tools/balance.mjs.
//   node tools/ability-worth.mjs --heroes tower,paladin --tier 1 [--rank 0] [--n 40] [--seed 1] [--out file.json]
//   node tools/ability-worth.mjs --merge a.json,b.json        add up batches run side by side and print the one table
// For every hero: n parties (the hero and two random others, every dungeon in turn), each played four times from the
// same seed: with all three of the hero's abilities at --tier, and with each one in turn switched off (the others in
// the party keep theirs). Per ability it prints:
//   rooms   how many more rooms the party clears with it than without it (the whole of its worth, noisy: +-0.5)
//   dmg     its share of the hero's damage with everything on, and what the hero's damage a second loses without it
//   taken   how much more the PARTY is hurt a second without it (damage it prevents: control, taunts, guards)
//   heal    how much less the party is healed a second without it
//   downs   how many more times the party's heroes go down a run without it
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const tier = +opt('tier', 1), n = +opt('n', 40), rank = +opt('rank', tier >= 3 ? 1 : 0), seed0 = +opt('seed', 1), cap = +opt('cap', 900);
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const fs = await import('node:fs');
const { newRun, update, summarize } = await import('../js/dungeon.js');
const { setSeed } = await import('../js/util.js');
const { THEME_IDS } = await import('../js/themes.js');
const { HEROES, HERO_IDS } = await import('../js/heroes.js');
const { freshSave } = await import('../js/save.js');
const DT = 1 / 60;
const themes = opt('themes', 'all') === 'all' ? THEME_IDS : opt('themes').split(',');
const leads = opt('heroes', '') ? opt('heroes').split(',') : HERO_IDS.slice(0, 15);

function buildSave(party, lead, off) {
  const s = freshSave();
  for (const k of party) {
    const h = s.heroes[k]; h.owned = true; h.level = 1; h.trinkets = []; h.nodes = {};
    for (const ab of HEROES[k].abilities) if (!(k === lead && ab.id === off)) for (let i = 1; i <= tier; i++) h.nodes[ab.id + i] = 1;
  }
  s.party = party.slice(); s.trinkets = []; s.potions = 0; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true };
  return s;
}
const blank = () => ({ n: 0, rooms: 0, secs: 0, dmg: 0, taken: 0, heal: 0, downs: 0, hdowns: 0, src: {} });
const OUT = {}; let bad = 0;
if (opt('merge')) {
  for (const f of opt('merge').split(',')) { const d = JSON.parse(fs.readFileSync(f, 'utf8')); bad += d.bad || 0;
    for (const [k, conds] of Object.entries(d.heroes)) { const o = OUT[k] || (OUT[k] = {});
      for (const [c, v] of Object.entries(conds)) { const t = o[c] || (o[c] = blank()); for (const m of ['n', 'rooms', 'secs', 'dmg', 'taken', 'heal', 'downs', 'hdowns']) t[m] += v[m]; for (const [s, x] of Object.entries(v.src)) t.src[s] = (t.src[s] || 0) + x; } } }
} else
for (const lead of leads) {
  const H = HEROES[lead]; if (!H) { console.log('no hero', lead); continue; }
  const conds = ['all', ...H.abilities.map((a) => a.id)], R = OUT[lead] = Object.fromEntries(conds.map((c) => [c, blank()]));
  let rs = (seed0 * 7919 + tier * 31 + HERO_IDS.indexOf(lead) * 104729) & 0x7fffffff; const rnd = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < n; i++) {
    const others = HERO_IDS.filter((k) => k !== lead), party = [lead];
    while (party.length < 3) party.push(others.splice(Math.floor(rnd() * others.length), 1)[0]);
    const theme = themes[(i + seed0) % themes.length], sd = seed0 * 1000003 + i * 7919 + HERO_IDS.indexOf(lead) * 131;
    for (const c of conds) {
      setSeed(sd);
      let run, t = 0, err = null;
      try { run = newRun(buildSave(party, lead, c), { theme, party, asRank: rank, bare: true });
        while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < cap) { update(run, DT); t += DT; }
      } catch (e) { err = e; }
      if (err || !run) { bad++; console.log(`  ERROR ${theme} ${party.join(',')} (${c}): ${err && err.stack.split('\n').slice(0, 3).join(' | ')}`); continue; }
      const S = summarize(run).stats, r = R[c], me = S.heroes[lead];
      r.n++; r.rooms += Math.max(0, run.rooms - (run.phase === 'lost' ? 1 : 0)); r.secs += t; r.dmg += me.dmg; r.hdowns += me.downs;
      for (const k of party) { r.taken += S.heroes[k].taken; r.heal += S.heroes[k].heal; r.downs += S.heroes[k].downs; }
      for (const [s, v] of Object.entries(me.src.dmg)) r.src[s] = (r.src[s] || 0) + v;
    }
  }
}
const f1 = (x, w = 6) => ((x >= 0 ? '+' : '') + x.toFixed(2)).padStart(w);
console.log(`tier ${tier}, rank ${rank}: each ability switched off in turn (the same parties and seeds), ${bad} errors`);
console.log('hero          ability           rooms with  worth   share of dmg  hero dmg/s  party taken/s  party heal/s  party downs');
for (const [k, R] of Object.entries(OUT)) {
  const A = R.all; if (!A || !A.n) continue;
  const tot = Object.values(A.src).reduce((a, b) => a + b, 0) || 1;
  console.log(`${k.padEnd(13)} ${'(all on)'.padEnd(16)} ${(A.rooms / A.n).toFixed(2).padStart(6)}  ${''.padStart(6)}   attack ${String(Math.round(100 * (A.src.attack || 0) / tot)).padStart(3)}%   ${(A.dmg / A.secs).toFixed(2).padStart(6)}       ${(A.taken / A.secs).toFixed(2).padStart(6)}        ${(A.heal / A.secs).toFixed(2).padStart(6)}       ${(A.downs / A.n).toFixed(2)}   (${A.n} runs)`);
  for (const ab of HEROES[k].abilities) { const O = R[ab.id]; if (!O || !O.n) continue;
    const share = Object.entries(A.src).filter(([s]) => s === 'ab:' + ab.id || s === ab.id).reduce((a, [, v]) => a + v, 0) / tot;
    console.log(`${''.padEnd(13)} ${ab.id.padEnd(16)} ${''.padStart(6)}  ${f1(A.rooms / A.n - O.rooms / O.n)}          ${String(Math.round(100 * share)).padStart(3)}%   ${f1(A.dmg / A.secs - O.dmg / O.secs)}       ${f1(O.taken / O.secs - A.taken / A.secs)}        ${f1(A.heal / A.secs - O.heal / O.secs)}      ${f1(O.downs / O.n - A.downs / A.n)}`);
  }
}
if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify({ tier, rank, bad, heroes: OUT }));
process.exit(bad ? 1 : 0);
