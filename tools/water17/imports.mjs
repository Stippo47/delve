// round 17 (lane water17): import every module once in Node (node --check misses some syntax slips); a module that
// needs the DOM is let off, a syntax error is not
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const fs = await import('node:fs');
let bad = 0;
for (const f of fs.readdirSync('js').filter((f) => f.endsWith('.js'))) {
  try { await import('../../js/' + f); } catch (e) { if (e instanceof SyntaxError || /SyntaxError/.test(String(e))) { bad++; console.log('BAD', f, e.message); } }
}
console.log(bad ? bad + ' bad' : 'all modules parse');
