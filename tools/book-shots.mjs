// Round 14 (lane U): the Book became grids and the unit page, and its stills moved to tools/unit-shots.mjs (the Book's
// five grids, a hero's four pages, a monster's three at each rank, a trinket, a status, a dungeon). This name is kept
// so older notes still work: it runs that tool with the same arguments.
//   node tools/book-shots.mjs <outDir> [--port 8961] [--clips] [--traits] [--only name,name]
await import('./unit-shots.mjs');
