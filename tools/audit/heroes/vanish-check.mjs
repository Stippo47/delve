// Round 16 (the balance audit): battles that end while the losing side still has someone alive who has only gone out
// of the fight for a moment (underground, a flock of birds, a broom, a shadow, buried by a foe). battle.js counts a
// side as beaten when nobody on it is "fighting", and its fighting() leaves out ethereal units (bar a sand burrower
// under the sand), so a hero alone that ducks out ends its own fight as a loss, and a foe buried alone ends it as a win.
//   node tools/audit/heroes/vanish-check.mjs [--heroes all|a,b] [--seeds 6] [--out docs/audit/data/heroes-vanish.json]
// The same battles as run.mjs (its seeds, its scenarios), no recorder. Per hero, tier and scenario: the fights that
// ended that way, who was out of it (and how: ethereal, hidden, buried), and the last ability the one out had used.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url');
const repo = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const { HERO_IDS } = await import('../../../js/heroes.js');
const { AUDIT } = await import('../../../js/stats.js');
const B = await import('../../../js/battle.js');
const SC = await import('./scenarios.mjs');
const { battle } = await import('./fights.mjs');
const heroes = opt('heroes', 'all') === 'all' ? HERO_IDS : opt('heroes').split(','), n = +opt('seeds', 6);
const alive = (u) => !!u && !u.dead && !u.downed;
const last = new WeakMap();
const out = {}; let fights = 0, ended = 0;
for (const hero of heroes) for (const tier of [1, 2, 3]) for (const sc of SC.SCENARIOS) {
  if (sc.dungeon) continue;
  for (let i = 0; i < n; i++) {
    AUDIT.on = (ev, w, u, s, a, o) => { if (ev === 'cast') last.set(u, o.ab); };
    const r = battle(hero, tier, sc, 1000 + i * 17 + SC.SCENARIOS.indexOf(sc), false); fights++;
    AUDIT.on = null;
    const run = r.run; if (r.outcome === 'timeout') continue;
    const lost = run.winner === 'a' ? ['b'] : run.winner === 'b' ? ['a'] : ['a', 'b'];
    for (const side of lost) {
      const st = new Set(B.standing(run, side));
      const out1 = run.world.units.filter((u) => alive(u) && !st.has(u) && B.sideOf(run.world, u) === side && !u.partOf && !(u.def && u.def.trap));
      if (!out1.length) continue;
      ended++;
      const k = `${hero}|${tier}|${sc.id}`, o = out[k] || (out[k] = { hero, tier, scen: sc.id, fights: n, ended: 0, side: {}, who: {} });
      o.ended++; o.side[side === 'a' ? 'hero side lost' : 'foe side lost'] = (o.side[side === 'a' ? 'hero side lost' : 'foe side lost'] || 0) + 1;
      for (const u of out1) { const how = [u.buried ? 'buried' : '', u.ethereal ? 'ethereal' : '', u.hidden ? 'hidden' : ''].filter(Boolean).join('+') || 'other';
        const w = `${u.kind} (${how}${last.get(u) ? ', last cast ' + last.get(u) : ''})`; o.who[w] = (o.who[w] || 0) + 1; }
    }
  }
}
const rows = Object.values(out).sort((a, b) => b.ended - a.ended);
for (const o of rows) console.log(o.hero.padEnd(12), 'tier', o.tier, o.scen.padEnd(11), `${o.ended}/${o.fights}`, JSON.stringify(o.side), JSON.stringify(o.who));
console.log(`${fights} battles, ${ended} ended with someone on the losing side alive but out of the fight`);
if (opt('out')) fs.writeFileSync(path.resolve(repo, opt('out')), JSON.stringify({ seeds: n, fights, ended, rows }));
