// Round 13 (lane H2): how the newer heroes' summons are drawn, when they are drawn in code (no art file). fx2.js fills
// this table (kind -> draw(ctx, u, w), world units); kits2.js hangs the draw on the summon's def the first time one is
// made (render.js drawUnit uses def.draw). In Node (the batches) fx2.js isn't loaded and nothing is drawn.
export const LOOK2 = {};
// Round 15 (lane N): how a timed wall of a kind is drawn (kind -> draw(ctx, wall, T)); fx3.js fills it (the Earth Mage's
// stone wall), render.js reads it for walls that come and go.
export const WALL2 = {};
