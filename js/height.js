// Height off the floor, and the one shadow system (round 19, lane sys19). The designer, on 0.19's heroes:
//   "MAKE SURE YOU USE 1 SHADOW SYSTEM FOR EVERYTHING. Neither of them look like the entity shadows." (Bread Toss, which
//   had two shadows; the Healing Totem "has 2 shadows too")
//   "When entities are in the air they should not collide with things on the ground. Until they are landed. Should also
//   always render in front of everything on the ground until landed." (Skull Splitter); the Warlock's imp "should always
//   be hovering therefore always render on top of ground entities"; the Shaman's eagle "isn't always rendered above
//   entities on the ground".
//
// Three things live here, so the sim, the renderer and the effects all ask the same place:
//   airTier(u)      how high a unit is for drawing and for bodies: 0 on the floor, 1 hovering, 2 flying. Drawn floor
//                   first, then hovering, then flying (render.js); bodies on different tiers never push or block each
//                   other (sim.js physics; js/layers.js has the whole table of what touches what). Anything with u.hop (a leap, a pounce's hang, Toss's flung foe, a sky dive)
//                   is up while it is AIR_HOP or more off the floor; u.flyT (tags.js layerOf: flying) and u.airborne (a
//                   slime mid-hop: hovering) count too; kinds that always hover (the imps) are tier 1, kinds that always
//                   fly (tags.js flier: bats, spirits, drones; not the winged heroes, who walk) tier 2 for drawing.
//   projZ(p)        how high a lobbed thing is (kits2.js lob, or any shot marked noHit that arcs): one arc for all of them.
//   castShadow()    a shadow cast by something drawn in code (an effect, a thing falling out of the sky): it goes into the
//                   same merged layer as every unit's (render.js drawShadows), the same colour, softness and strength,
//                   sized and faded by its height. Call it from an effect's 'ground' layer (drawn before the shadows
//                   go down in the frame).
import { clamp } from './util.js';
import { hasTag } from './tags.js';

export const AIR_HOP = 10; // a body this far up (u.hop, room units) has left the floor
const FLY_HOP = 34;        // and this far up it is over the hovering too

// kinds that are never on the floor (drawing; tags.js layerOf keeps its own rules for what reaches them)
const isHover = (u) => hasTag(u, 'hover');
const WALKS = new Set(['griffon', 'valkyrie']); // (winged heroes: tagged fliers, but they walk; up only while they fly)
const isFlier = (u) => hasTag(u, 'flier') && !WALKS.has(u.kind);
// a unit off the floor right now because it leapt, was thrown, swoops or hops: 1 low, 2 high
function upNow(u) { const h = u.hop || 0; return u.flyT > 0 || h >= FLY_HOP ? 2 : u.airborne || h >= AIR_HOP ? 1 : 0; }

export function airTier(u) {
  if (!u || u.dead || u.downed) return 0;
  return Math.max(upNow(u), isFlier(u) ? 2 : isHover(u) ? 1 : 0);
}
// The height a body is at for touching other bodies (sim.js physics): the same three heights it is drawn at.
// (round 19, lane physics19: it was a rule of its own. Everything off the floor was one height, so a boss's flying head
// shoved its own lifted feet about; and the kinds that always fly (bats, ghosts, spirits) were on the floor, so a bat
// drawn over a hero pushed him. The designer: "Many times when things are on layers where they shouldn't collide they
// do." Who touches whom is js/layers.js now; what a blow or a zone reaches is still tags.js layerOf, unchanged: a
// blade reaches a bat as before.)
export const bodyTier = airTier;
export const bodiesMeet = (a, b) => airTier(a) === airTier(b);

// ---------------------------------------------------------------- lobs
// How high each lobbed kind arcs (what fx2.js lobUp was handed per kind; a lob's peak is also capped by how long it
// flies, as before). A lob's drawing is lifted by projZ once (fx.js drawProjectile); its shadow stays on the floor.
const LOB_H = { flask: 44, bread: 60, cauldron: 44, totemFly: 60, hexBomb: 30, food: 24, hiveFly: 50, honeyJar: 40, crateFly: 50, potFly: 46,
  kitFly: 40, grogFly: 40, bigStone: 70, turretFly: 50, droneFly: 30, snowball: 70, trapThrown: 40 };
export function projZ(p) {
  if (p.lob) {
    const k = clamp(1 - p.life / (p.life0 || 1), 0, 1), H = p.lob.H ?? (p.kind === 'bomb' && p.color === 'big' ? 56 : LOB_H[p.kind] ?? 44);
    return Math.sin(Math.PI * k) * Math.min(H, 20 + (p.life0 || 0) * 60);
  }
  // an older lobbed shot (an elite's, elites.js): no hit on the way, slow enough to be thrown, not on its way home
  if (p.noHit && !p.home && !p.back) {
    const sp = Math.hypot(p.vx, p.vy); if (sp >= 700) return 0;
    if (p._life0 == null) p._life0 = p.life;
    const q = 1 - clamp(p.life / (p._life0 || 1), 0, 1);
    return Math.sin(q * Math.PI) * Math.min(80, sp * p._life0 * 0.22);
  }
  return p.z || 0;
}
// a lobbed thing's shadow: the size of the thing (r, room units), shrinking and fading as it rises
export const LOB_SHADOW_R = 10;

// ---------------------------------------------------------------- shadows cast by code-drawn things
// [x, y, r, a]: r is the radius of the thing casting it, a how strong (0-1). Height h shrinks and fades it the way a
// unit's does as it leaps (render.js shadowSize).
const Q = [];
export function castShadow(x, y, r, a = 1, h = 0) {
  if (!(r > 0) || !(a > 0) || Q.length > 4000) return;
  const s = 1 - Math.min(0.5, h / 120);
  Q.push(x, y, r * s, a * (1 - Math.min(0.55, h / 160)));
}
export function takeShadows(f) { for (let i = 0; i < Q.length; i += 4) f(Q[i], Q[i + 1], Q[i + 2], Q[i + 3]); Q.length = 0; }
// the same sizing for a lifted thing as a unit's shadow (a unit: vr * 1.75 for its art; the disc is solid to 60%)
export const shadowOfH = (r, h) => r * (1 - Math.min(0.5, h / 120));
