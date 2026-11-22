// Round 15 (lane N): one hero against others of its role in the same parties and seeds (a quick read before the full
// balance batch).  node tools/test/hero-vs.mjs mob,haymaker,werewolf [--tier 1] [--with archer,cleric] [--seeds 4]
// Prints rooms cleared, the hero's damage and damage taken per second of fighting, downs a run, and where its damage came from.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const { newRun, update, summarize } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { HEROES } = await import('../../js/heroes.js');
const { freshSave } = await import('../../js/save.js');
const tier = +opt('tier', 1), mates = opt('with', 'archer,cleric').split(','), nSeeds = +opt('seeds', 4), ths = opt('themes', 'wildwood,crypt,warren,sewers').split(',');
function go(party, theme, seed) {
  const s = freshSave();
  for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = 1; h.trinkets = []; h.nodes = {}; for (const ab of HEROES[k].abilities) for (let i = 1; i <= tier; i++) h.nodes[ab.id + i] = 1; }
  s.party = party.slice(); s.trinkets = []; s.potions = 0; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true };
  setSeed(seed); const run = newRun(s, { theme, party, asRank: tier >= 3 ? 1 : 0, bare: true });
  let t = 0, fight = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < 900) { update(run, 1 / 60); t += 1 / 60;
    const w = run.world, me = w.units.find((u) => u.kind === party[0] && !u.summon);
    if (me && !me.downed && w.units.some((u) => u.team === 'enemy' && u.aggro && !u.dead)) fight += 1 / 60; }
  const S = summarize(run).stats, m = S.heroes[party[0]], all = party.reduce((a, k) => a + S.heroes[k].dmg, 0);
  return { rooms: run.rooms, dps: m.dmg / Math.max(1, fight), tps: m.taken / Math.max(1, fight), downs: m.downs, share: m.dmg / Math.max(1, all), heal: m.heal / Math.max(1, t), src: m.src.dmg };
}
console.log('hero          rooms  dmg/s  share  taken/s  downs  heal/s  sources');
for (const hero of args[0].split(',')) {
  const R = []; for (const th of ths) for (let i = 0; i < nSeeds; i++) R.push(go([hero, ...mates.filter((m) => m !== hero)], th, 11 + i));
  const av = (k) => R.reduce((a, r) => a + r[k], 0) / R.length, src = {}; let tot = 0;
  for (const r of R) for (const [k, v] of Object.entries(r.src)) { src[k] = (src[k] || 0) + v; tot += v; }
  console.log(hero.padEnd(13), av('rooms').toFixed(2).padStart(5), av('dps').toFixed(2).padStart(6), (100 * av('share')).toFixed(0).padStart(5) + '%', av('tps').toFixed(2).padStart(7), av('downs').toFixed(2).padStart(6), av('heal').toFixed(2).padStart(6), ' ',
    Object.entries(src).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k.replace('ab:', '') + ' ' + Math.round(100 * v / tot) + '%').join(', '));
}
