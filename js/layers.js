// Collision layers, soft separation and the draw order, in one place (round 19, lane physics19).
// The designer: "Work on the physics overall. I see a lot of jarring jumping of units or segments of entities like the
// spider and drake. If a spider puts its foot down on an entity either the spider jumps in a spit second or the entity
// does and it's jarring. Many times when things are on layers where they shouldn't collide they do. Work on collision
// layers and render order (spikes shouldn't ever render onto of an entity)". The audit, the numbers and the films:
// docs/physics19.md.
//
// ---------------------------------------------------------------- 1. what a body is
// Every unit is one of these (bodyKind). The first that fits:
//   corpse     dead or downed. Touches nothing (lane corpses19 draws it under everything).
//   ghost      out of the world for now: ethereal (burrowed, in smoke, a shade), going through bodies (u.passUntil: a
//              dash, the Witch's broom, Incorporeal), or a kind that rolls through (def.pass: gear sprites, the saw).
//              Walls, the room's edge and rocks still stop it; no body does.
//   part       a piece of a bigger animal that its boss puts where it goes every step (def.part and no pace of its
//              own: a spider's foot, an idol's hoof, the drake's and the wurm's body, an engine's hand, a drum, a horn).
//   link       a chain's link (u.linkTo: the sand serpent's coils, the chain crawler's plates, the wagon's rig).
//   structure  stood where it was put (u.fixed: turrets, totems, barricades, hives, the wagon).
//   body       everyone else: heroes, foes, bosses, summons that walk, the Great Ooze's other half.
// part, link and structure are ANCHORS: no push ever moves them (their brain or their maker put them there), and two
// anchors never push each other. A boss with placed parts is an anchor too while it is stunned, frozen or asleep
// (heldFast): its brain is not there to bring its body after it.
//
// ---------------------------------------------------------------- 2. how high it is
// heightOf(u): 0 on the floor, 1 hovering, 2 flying (height.js airTier, the same answer the renderer draws by: a leap,
// a toss, a pounce's hang, a hop, a swoop, a lifted foot, the imps, and the kinds that always fly: bats, ghosts,
// wisps, spirits, angels, drones, bees). Before this lane a body's height for touching was a different rule from its
// height for drawing: everything off the floor was one height (a boss's flying head pushed its own lifted feet and its
// spiderlings on their threads), and the kinds that always fly were on the floor (a bat drawn over a hero shoved him).
//
// ---------------------------------------------------------------- 3. what touches what (bodiesCollide; the matrix)
//                  floor   hover   fly     part    link    struct  ghost   corpse  rock    boulder wall/edge
//   floor body     push    -       -       h       h       h       -       -       stop    mass    stop
//   hovering body  -       push    -       h       h       h       -       -       stop    mass    stop
//   flying body    -       -       push    h       h       h       -       -       stop    mass    stop
//   part           h       h       h       -       -       -       -       -       -       mass    -
//   link           h       h       h       -       -       -       -       -       -       mass    -
//   structure      h       h       h       -       -       -       -       -       -       stops it -
//   ghost          -       -       -       -       -       -       -       -       stop    mass    stop
//   corpse         -       -       -       -       -       -       -       -       (*)     -       (*)
//  push: the two ease apart, each by its share of their masses.   h: only when the two are at the same height, and
//  then the body gives way, never the anchor (a lifted foot is off the floor: it touches no one until it is down).
//  -: never.   stop: the body is kept out (rocks, pillars, crates, walls and the room's edge stop every height: a
//  room's walls go to the roof, and nothing in this game goes over a rock).   mass: js/boulders.js.
//  (*) lane corpses19: nothing moves a body lying still; one still flying from its killing blow stops at what stands.
//  And always: a body never touches its own animal (a boss and its parts, a part and its boss's other parts, a chain's
//  head and its links, a link and its chain's other links).
//  Shots, zones, pools, spikes and traps are not bodies: what they reach is tags.js layerOf / reaches (unchanged).
//
// ---------------------------------------------------------------- 4. how bodies come apart (softPush)
// Two bodies found inside each other used to be put exactly apart in that one step, however deep: a foot set down on
// a hero threw him 20 to 60 room units in a sixtieth of a second. Now:
//   - what the two walked (or were carried) INTO each other this step is taken out at once, up to SOFT.rigid a second:
//     nobody walks through anybody, and a body pushes another along at its own pace;
//   - the rest (they were already inside each other: one landed, was set down, came out of a dash or the sand, a foot
//     came down on it) eases out on top of that, at SOFT.v a second plus SOFT.rate of what is left, never faster
//     than SOFT.max: two bodies walking into each other still come apart;
//   - all the pushes on one body in a step never come to more than SOFT.cap a second (a hero inside two of a drake's
//     hit boxes was pushed by each, one after the other);
//   - a body between two anchors, whose pushes cancel, slips out sideways (sim.js pinch).
// The same for a body found inside a rock. Walls and the room's edge are as they were: at once (lane troll19's rule:
// nobody is ever left in a wall).
//
// ---------------------------------------------------------------- 5. the draw order (render.js drawScene; ORDER)
// One list. Nothing earlier in it is ever drawn over something later:
//   floor > bodies lying (corpses, the downed and their rings: lane corpses19) > doors > raised walls > floor hazards
//   (spike plates, pools, snares, webs, fire) > a boss arena's floor > danger zones > ground effects (zones, cracks,
//   EVERY spike, thorn, vine and crystal that stands out of the floor) > a boss's things that stand out of the floor
//   (BFX[type].low) > tracks, mounds, scuffs > puddles > shadows > pickups > dust > rocks, crates > side rings > floor
//   bodies (by depth) > hovering bodies > flying bodies > a body still flying from its killing blow > the wagon
//   road's canopy > shots > sparks and dust > a boss arena's air > air effects > swings and bursts > the room's light.
// "Spikes shouldn't ever render on top of an entity": whatever comes up out of the floor is a ground effect, under
// every body, whatever made it (docs/physics19.md lists each one and where it was drawn before).
import { airTier } from './height.js';

export const SOFT = { v: 90, rate: 6, max: 330, rigid: 270, cap: 330, rockRigid: 840 };
// ?push=hard in the address: bodies put apart in the one step again, as before this lane, to see the difference (the
// layers, the anchors and the draw order stay as they are now)
const HARD = (() => { try { return typeof location !== 'undefined' && new URLSearchParams(location.search).get('push') === 'hard'; } catch { return false; } })();
export const pushCap = (dt) => (HARD ? Infinity : SOFT.cap * dt);
export const ORDER = ['floor', 'bodies lying', 'doors', 'raised walls', 'floor hazards', 'arena floor', 'danger zones', 'ground effects',
  'boss things out of the floor', 'tracks', 'puddles', 'shadows', 'pickups', 'dust', 'rocks and crates', 'side rings', 'floor bodies',
  'hovering bodies', 'flying bodies', 'bodies in the air', 'canopy', 'shots', 'particles', 'arena air', 'air effects', 'swings and bursts', 'light'];

export const heightOf = airTier;
// whose animal a unit is a piece of (itself, if it is nobody's). The Mob's bodies are four people, not one animal.
export const ownerOf = (u) => (u.partOf && !u.partOf.bodies ? u.partOf : u.linkTo || u);
// never moved by a push: a boss's placed part, a chain's link, a thing stood where it was put
export const anchored = (u) => !!(u.fixed || (u.def.part && !(u.def.speed > 0)));
// a body with placed parts hung on it (boss-kit.js part) whose brain is held (stunned, frozen, asleep): for as long, it
// is an anchor too. Its parts stay where they were while its brain sleeps, so a head the party could shove about
// drifted away from its own body, and the body caught up in one step when it woke (the drake: 12 in a step).
export const heldFast = (u) => !!(u.hasParts && (u.stunT > 0 || u.frozenT > 0 || u.sleepT > 0));
export const isGhost = (u, time) => !!(u.ethereal || u.passUntil > time || u.def.pass);
export function bodyKind(u, time = 0) {
  if (u.dead || u.downed) return 'corpse';
  if (isGhost(u, time)) return 'ghost';
  if (u.def.part && !(u.def.speed > 0)) return 'part';
  if (u.linkTo) return 'link';
  if (u.fixed) return 'structure';
  return 'body';
}
// Do these two bodies push each other? (both alive and not ghosts: the caller has skipped those)
export function bodiesCollide(a, b) {
  const fa = anchored(a), fb = anchored(b);
  if (fa && fb) return false;
  if (ownerOf(a) === ownerOf(b)) return false;
  return airTier(a) === airTier(b);
}
// How far two bodies `over` deep in each other come apart this step. `fresh`: how much of that depth is new this
// step (0 if they were as deep the step before).
export function softPush(over, fresh, dt) {
  if (HARD) return over;
  const f = fresh > 0 ? Math.min(fresh, SOFT.rigid * dt) : 0;
  return Math.min(over, f + Math.min(SOFT.max, SOFT.v + SOFT.rate * (over - f)) * dt);
}
// The same out of a rock: what its own walk or a knock carried it in this step, at once (nothing gets through a
// rock); the rest eased.
export function softRock(over, fresh, dt) {
  if (HARD) return over;
  const f = fresh > 0 ? Math.min(fresh, SOFT.rockRigid * dt) : 0;
  return Math.min(over, f + Math.min(SOFT.max, SOFT.v + SOFT.rate * (over - f)) * dt);
}
