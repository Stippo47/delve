// Checks every hero's skill web: links point at real nodes and go both ways, every node can be reached from the root,
// ids are unique. node tools/test/tree-check.mjs
const { HERO_IDS, treeFor } = await import('../../js/heroes.js');
let bad = 0;
for (const id of HERO_IDS) {
  const t = treeFor(id), by = Object.fromEntries(t.map((n) => [n.id, n]));
  if (Object.keys(by).length !== t.length) { console.log(id, 'duplicate ids'); bad++; }
  for (const n of t) for (const l of n.links) if (!by[l] || !by[l].links.includes(n.id)) { console.log(id, n.id, 'bad link', l); bad++; }
  const seen = new Set(['root']), q = ['root'];
  while (q.length) for (const l of by[q.shift()].links) if (!seen.has(l)) { seen.add(l); q.push(l); }
  if (seen.size !== t.length) { console.log(id, 'unreachable', t.filter((n) => !seen.has(n.id)).map((n) => n.id)); bad++; }
  const points = t.reduce((a, n) => a + n.max * n.cost, 0);
  console.log(id.padEnd(12), t.length, 'nodes', points, 'points to max');
}
process.exit(bad ? 1 : 0);
