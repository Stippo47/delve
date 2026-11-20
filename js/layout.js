// Room layout on a grid (designer, round 7: "obstacles aligned to the grid, about the size of a unit's max sprite
// area: that will be the size of 1 cell. Rooms will generate with walls and various obstacles in the way. The spikes
// will also be sized accordingly"). A cell is G room units square, a little wider than the biggest hero's body, so
// one unit can almost stand inside the space an obstacle takes. Chunks are whole cells wide (dungeon.js snaps them),
// so the grid lines up with the room's own walls.
//   - inner walls: straight runs of whole cells (rectangles in w.walls),
//   - obstacles: one cell each: crates (square: a wall rectangle with prop 'crate'), barrels and boulders (round:
//     pillars with prop 'barrel' / 'rock'), in small clumps of touching cells,
//   - spikes: a plate one cell across, on a cell.
// Clumps keep two empty cells from each other and from the walls, so the way between them is wide enough for the
// widest hero (the A* grid keeps 46 from anything solid). The way in (the first columns) and the way out (the last
// two) stay clear.
import { rand, rint, chance, pick } from './util.js';

export const G = 80;            // one cell, room units
export const OB_R = 33;         // a round obstacle's collider (its art fills most of the cell)
export const SPIKE_R = 40;      // a spike plate one cell across (hurts within r + a bit of the body)
const FREE = 0, ROCK = 1, WALL = 2, OB = 3, KEEP = 4, HAZ = 5;

export function makeGrid(w) {
  const gw = Math.round(w.W / G), gh = Math.round(w.H / G);
  const m = new Uint8Array(gw * gh).fill(ROCK);
  for (const c of w.cells) {
    for (let j = Math.round(c.y / G); j < Math.round((c.y + c.h) / G); j++) for (let i = Math.round(c.x / G); i < Math.round((c.x + c.w) / G); i++) m[j * gw + i] = FREE;
  }
  // the way in and the way out stay open
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if ((i < 3 || i >= gw - 2) && m[j * gw + i] === FREE) m[j * gw + i] = KEEP;
  const g = { gw, gh, m, at: (i, j) => (i < 0 || j < 0 || i >= gw || j >= gh ? ROCK : m[j * gw + i]) };
  w.lay = g;
  return g;
}
const centre = (i, j) => ({ x: (i + 0.5) * G, y: (j + 0.5) * G });
// Nothing but open floor within `pad` cells of the box (i0..i1, j0..j1); room edges and rock count as fine.
function clearAround(g, i0, j0, i1, j1, pad) {
  for (let j = j0 - pad; j <= j1 + pad; j++) for (let i = i0 - pad; i <= i1 + pad; i++) {
    const v = g.at(i, j);
    const inside = i >= i0 && i <= i1 && j >= j0 && j <= j1;
    if (inside && v !== FREE) return false;
    if (!inside && (v === WALL || v === OB)) return false;
  }
  return true;
}
function mark(g, i0, j0, i1, j1, v) { for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g.m[j * g.gw + i] = v; }

// Inner walls: a few straight runs, mostly across the room (so the party goes round them), some along it.
// A run starting at a wall edge reads as a buttress; a free one as a wall standing in the room.
export function gridWalls(w, n) {
  const g = w.lay;
  for (let k = 0, tries = 0; k < n && tries < 60; tries++) {
    const across = chance(0.7);
    const len = across ? rint(2, Math.max(2, Math.min(4, g.gh - 2))) : rint(2, 4);
    const i0 = rint(3, g.gw - 3), j0 = rint(0, g.gh - 1);
    const i1 = across ? i0 : i0 + len - 1, j1 = across ? j0 + len - 1 : j0;
    if (i1 >= g.gw - 2 || j1 >= g.gh) continue;
    if (!clearAround(g, i0, j0, i1, j1, 2)) continue;
    // a run across must leave at least two open cells beside it in its column, or it seals the room
    if (across) { let open = 0; for (let j = 0; j < g.gh; j++) if (g.at(i0, j) === FREE && (j < j0 || j > j1)) open++; if (open < 2) continue; }
    mark(g, i0, j0, i1, j1, WALL);
    w.walls.push({ x: i0 * G, y: j0 * G, w: (i1 - i0 + 1) * G, h: (j1 - j0 + 1) * G, grid: true });
    k++;
  }
}

// Obstacles: clumps of 1-3 touching cells, each cell a crate, a barrel or a boulder (the theme's mix).
export function gridObstacles(w, n, mix) {
  const g = w.lay;
  for (let k = 0, tries = 0; k < n && tries < 80; tries++) {
    const i = rint(3, g.gw - 3), j = rint(0, g.gh - 1);
    const size = pick([1, 1, 2, 2, 3]);
    const cells = [[i, j]];
    for (let s = 1; s < size; s++) { const [pi, pj] = cells[cells.length - 1]; const d = pick([[1, 0], [0, 1], [-1, 0], [0, -1]]); cells.push([pi + d[0], pj + d[1]]); }
    let i0 = Infinity, j0 = Infinity, i1 = -Infinity, j1 = -Infinity;
    for (const [a, b] of cells) { i0 = Math.min(i0, a); j0 = Math.min(j0, b); i1 = Math.max(i1, a); j1 = Math.max(j1, b); }
    if (i0 < 3 || i1 >= g.gw - 2 || j0 < 0 || j1 >= g.gh) continue;
    if (cells.some(([a, b]) => g.at(a, b) !== FREE) || !clearAround(g, i0, j0, i1, j1, 2)) continue;
    // a clump touching nothing must leave two open cells in its column, like the walls
    const type = weighted(mix);
    for (const [a, b] of cells) {
      g.m[b * g.gw + a] = OB;
      const c = centre(a, b), t = type === 'mixed' ? pick(['crate', 'barrel']) : type;
      if (t === 'crate') w.walls.push({ x: a * G + 4, y: b * G + 4, w: G - 8, h: G - 8, prop: 'crate', grid: true });
      else w.pillars.push({ x: c.x, y: c.y, r: OB_R, prop: t, grid: true });
    }
    k++;
  }
}

// A free cell for a hazard (spikes), kept off the obstacles' sides; null if there isn't one.
export function hazardCell(w, x0 = 0, x1 = Infinity) {
  const g = w.lay; if (!g) return null;
  for (let tries = 0; tries < 50; tries++) {
    const i = rint(3, g.gw - 3), j = rint(0, g.gh - 1);
    const c = centre(i, j); if (c.x < x0 || c.x > x1) continue;
    if (g.at(i, j) !== FREE || !clearAround(g, i, j, i, j, 1)) continue;
    g.m[j * g.gw + i] = HAZ;
    return c;
  }
  return null;
}

// Undo what the layout added (dungeon.js falls back to this if a room can't be crossed).
export function dropObstacles(w) {
  w.pillars = w.pillars.filter((p) => !p.grid || !p.prop);
  w.walls = w.walls.filter((r) => !r.prop);
}
export function dropGridWalls(w) { w.walls = w.walls.filter((r) => !r.grid || r.prop); }

function weighted(list) {
  let tot = 0; for (const [, wt] of list) tot += wt;
  let r = rand() * tot;
  for (const [x, wt] of list) { r -= wt; if (r <= 0) return x; }
  return list[list.length - 1][0];
}
