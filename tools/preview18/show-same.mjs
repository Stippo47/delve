// prints the tier pairs measure.mjs found alike, with each tier's words and what each tier's loop made
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const fs = await import('node:fs');
const { HEROES } = await import('../../js/heroes.js');
const J = JSON.parse(fs.readFileSync(process.argv[2] || 'tools/preview18/after.json', 'utf8'));
for (const line of [...J.lists.same, ...J.lists.sameSig]) {
  const k = line.split(' ')[0], [id, ab] = k.split(':'), a = HEROES[id].abilities.find((x) => x.id === ab);
  console.log(line, '  |', a.tiers.join(' | '));
  for (const t of J.out[k]) { const s = { ...t[0].sig }; console.log('     ', JSON.stringify(s), 'cast', t[0].cast != null ? t[0].cast.toFixed(2) : '-', 'x' + t[0].casts); }
}
