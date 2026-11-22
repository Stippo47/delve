// Round 13 (lane H2): how the newer heroes' summons are drawn, when they are drawn in code (no art file). fx2.js fills
// this table (kind -> draw(ctx, u, w), world units); kits2.js hangs the draw on the summon's def the first time one is
// made (render.js drawUnit uses def.draw). In Node (the batches) fx2.js isn't loaded and nothing is drawn.
export const LOOK2 = {};
