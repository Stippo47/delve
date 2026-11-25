// Import every game module in Node (round 19, lane caster19: a syntax slip inside a string can pass node --check and
// still break the page). Modules that need a browser are reported, not failed.
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import fs from 'node:fs';
const bad = [];
for (const f of fs.readdirSync('js').filter((f) => f.endsWith('.js'))) {
  try { await import('../../js/' + f); } catch (e) { const m = String(e && e.message || e); if (!/document|window|navigator|Image|requestAnimationFrame|HTMLCanvas|matchMedia|self is not|addEventListener/.test(m)) bad.push(f + ': ' + m); }
}
console.log(bad.length ? bad.join('\n') : 'all modules import');
