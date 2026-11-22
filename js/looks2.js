// Round 13 (lane H2): how the newer heroes' summons are drawn, when they are drawn in code (no art file). fx2.js fills
// this table (kind -> draw(ctx, u, w), world units); kits2.js hangs the draw on the summon's def the first time one is
// made (render.js drawUnit uses def.draw). In Node (the batches) fx2.js isn't loaded and nothing is drawn.
export const LOOK2 = {};
// Round 15 (lane E): art round 12 drew most of those summons (art/summons/); a kind with art is drawn from its parts
// (render.js drawPartsUnit), and what its code drawing also did that a picture can't (a glow, flames, a bale's rolling
// straw, a rise out of the floor, a see-through spirit) is kept here, kind -> { art(u): another file for this one (the
// spiked barricade), under(ctx, u, w): world units, before the body; frame(ctx, u, w): in the body's own frame, room
// units, +y its front, before the body is drawn (rock, swell, a glow under it); pose(u, w, pose): its parts moved (a key
// turned, a barrel's recoil); alpha(u, w): how solid it is; top(ctx, u, w): over the body, in its SVG units; over(ctx, u,
// w): world units, after }. fx2.js fills it; in Node (the batches) nothing is drawn.
export const ART2 = {};
// Round 15 (lane N): how a timed wall of a kind is drawn (kind -> draw(ctx, wall, T)); fx3.js fills it (the Earth Mage's
// stone wall), render.js reads it for walls that come and go.
export const WALL2 = {};
