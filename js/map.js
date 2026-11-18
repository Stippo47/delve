// A floor is a tree of rooms you only ever go forward through: an entrance, layers of 2-3 rooms joined to the
// next layer by doors, and a boss room at the end. Each room shows on its door what kind it is.
import { rand, rint, chance, pick } from './util.js';

export const LAYERS = 9; // room layers before the boss room

const KINDS = [['fight', 46], ['hazard', 14], ['treasure', 13], ['fountain', 10], ['decision', 13], ['elite', 4]];
function rollKind(L) {
  const list = KINDS.map(([k, wt]) => [k, k === 'fountain' && L < 3 ? wt * 0.3 : k === 'elite' && L < 4 ? 0 : wt]);
  let tot = 0; for (const [, wt] of list) tot += wt;
  let r = rand() * tot;
  for (const [k, wt] of list) { r -= wt; if (r <= 0) return k; }
  return 'fight';
}

export function makeFloor() {
  const layers = [[{ L: 0, i: 0, pos: 0.5, kind: 'fight', next: [] }]];
  for (let L = 1; L < LAYERS; L++) {
    const n = L === LAYERS - 1 ? rint(2, 3) : rint(2, 3);
    const row = [];
    for (let i = 0; i < n; i++) row.push({ L, i, pos: (i + 0.5) / n + (rand() - 0.5) * 0.12, kind: rollKind(L), next: [] });
    // the last layer before the boss leans towards a breather
    if (L === LAYERS - 1 && !row.some((r) => r.kind === 'fountain' || r.kind === 'decision')) pick(row).kind = chance(0.6) ? 'fountain' : 'decision';
    layers.push(row);
  }
  layers.push([{ L: LAYERS, i: 0, pos: 0.5, kind: 'boss', next: [] }]);
  // doors: each room leads to the nearest room(s) ahead; every room ahead is reachable
  for (let L = 0; L < layers.length - 1; L++) {
    const a = layers[L], b = layers[L + 1];
    for (const n of a) {
      const order = b.map((m, j) => [Math.abs(m.pos - n.pos), j]).sort((x, y) => x[0] - y[0]);
      n.next.push(order[0][1]);
      if (order[1] && order[1][0] < 0.55 && chance(a.length === 1 ? 1 : 0.45)) n.next.push(order[1][1]);
    }
    b.forEach((m, j) => {
      if (a.some((n) => n.next.includes(j))) return;
      let best = a[0]; for (const n of a) if (Math.abs(n.pos - m.pos) < Math.abs(best.pos - m.pos)) best = n;
      best.next.push(j);
    });
    for (const n of a) n.next.sort((x, y) => b[x].pos - b[y].pos);
  }
  return { layers, L: 0, i: 0, path: [[0, 0]] };
}

export const nodeAt = (map) => map.layers[map.L][map.i];
export const nextNodes = (map) => nodeAt(map).next.map((j) => map.layers[map.L + 1][j]);

// The party picks a door: mostly at random, a fountain much likelier when hurt, treasure when holding keys.
export function chooseDoor(map, partyHp, keys) {
  const opts = nextNodes(map);
  const wt = opts.map((n) => ({ fight: 1, hazard: 0.9, elite: 0.8, treasure: 1.1 + (keys > 0 ? 0.6 : 0), fountain: 0.5 + 3 * (1 - partyHp) ** 2, decision: 1.2, boss: 1 }[n.kind] || 1));
  let tot = 0; for (const x of wt) tot += x;
  let r = rand() * tot;
  for (let k = 0; k < opts.length; k++) { r -= wt[k]; if (r <= 0) return k; }
  return opts.length - 1;
}

export function advance(map, k) {
  const j = nodeAt(map).next[k];
  map.L++; map.i = j; map.path.push([map.L, j]);
}
