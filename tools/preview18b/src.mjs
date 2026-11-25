// print a kind's brain and elite move source: node tools/preview18b/src.mjs kind [kind...]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../../js/preview-sim.js');
const { DEFS } = await import('../../js/units.js');
const { ELITES } = await import('../../js/elites.js');
const { ELITE_MOVE } = await import('../../js/movetext.js');
for (const k of process.argv.slice(2)) {
  const d = DEFS[k]; if (!d) { console.log('no', k); continue; }
  console.log('=====', k, 'role', d.role, 'ability', d.ability, 'dmg', d.dmg, 'atkCd', d.atkCd, 'range', d.range, 'elite:', ELITE_MOVE[k]);
  const cut = (f) => String(f).split('\n').slice(0, 22).map((l) => l.slice(0, 200)).join('\n');
  if (d.brain) console.log('brain:', cut(d.brain));
  const E = ELITES[k] || ELITES[d.eliteAs]; if (E && E.tick) console.log('elite:', cut(E.tick));
}
