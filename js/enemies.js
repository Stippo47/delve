// Extra enemy kinds (merged into DEFS by units.js). Same fields as the enemies in units.js, plus `art` (the
// sprite file, built in parts) and optionally `brain(w, u, dt)` for behaviour of their own (return true to skip the
// usual brain that tick). Dungeon themes pick from these (see js/themes.js).
export const ENEMIES = {};
