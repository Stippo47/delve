// every hero-side stage that isn't an ability at a tier: attacks, traits, trinkets, potions; blows from nothing seen
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const { unseenBlows } = await import('../preview-measure.mjs');
const specs = PS.allSpecs([]).filter((s) => (s.t === 'hero' && (s.move === 'attack' || s.move === 'trait') && s.tier === 3) || s.t === 'trinket' || s.t === 'potion');
const bad = {};
for (const s of specs) { const r = unseenBlows(s); if (r.blows) { const k = s.t + (s.move === 'trait' ? ':trait' : s.move === 'attack' ? ':attack' : ''); (bad[k] = bad[k] || []).push(PS.specKey(s) + ' ' + r.blows + ' ' + r.why.join(' ')); } }
for (const [k, v] of Object.entries(bad)) { console.log(k + ': ' + v.length); for (const x of v) console.log('  ' + x); }
console.log(specs.length + ' stages');
