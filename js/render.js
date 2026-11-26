// Canvas renderer for one room. Everything is drawn in room units, scaled and (in portrait) turned so the
// way out is at the top. One screen shows one chunk across (ACROSS units); a camera follows the party both ways.
import { getSprite, headR, tinted, getProp } from './sprites.js';
import { getRig, drawRig, poseFor, LIMP, composeRig, drawComposed, bowNock } from './parts.js';
import { DEFS } from './units.js';
import { drawGroundFx, drawAirFx, drawProjectile as projectile, drawStatusFx, noteHits, drawLocal, drawBeam, hash } from './fx.js';
import { INK, TAU, clamp, OUTLINE, OUTLINES } from './util.js';
import { envId, obstacleFor } from './env.js';
import { drawBodyFx, drawBodyGround, drawIceWall, HIT_OWN } from './fxkit.js';
import { drawHazardPuddle, flushPuddles, drawPuddle } from './puddles.js';
import { drawEnemyHp, hpWash, setHpSides } from './hpstyle.js';
import { icon } from './icons.js';
import { heartPath, drawStatusMarks, bleedFlash, bleedLook } from './fx-status.js'; // round 13 (lane S): the new statuses' marks
import { drawMarks3 } from './fx3.js'; // round 15 (lane N): Shackled's irons
import './fx-dash.js'; // round 18 (lane dash18): the six dashes' looks (it fills fx2.js's table)
import './fx-melee.js'; // round 19 (lane melee19): the knights' and brutes' looks (it fills fx2.js's tables)
import './fx-rogue19.js'; // round 19 (lane rogue19): the Bandit's, Shade's, Monk's and Cultist's looks, Disarmed and Anti-heal
import './fx-hit-r19.js'; // round 19 (lane art-hitfx): trial looks for hits, deaths, heals, pickups... (only with ?hitfx=; it fills fxkit.js HIT_OWN)
import { WALL2, ART2 } from './looks2.js';
import { HEROES } from './heroes.js';
import { paintFloor, drawWallThemed, drawPillarThemed, drawThemeHazard, drawArena, drawDanger, drawSpikeFx, drawMood, voidColor } from './scenery.js';
import { drawFoeGround, snowRoll, drawFoe } from './foe-draw.js';
import { drawRolled, noteRoll, drawSoilGround, drawSoil } from './boulder-roll.js'; // (round 19, lane boulder19: boulders and snowballs drawn rolling, and their dirt trail)
import { airTier, projZ, takeShadows, shadowOfH, LOB_SHADOW_R } from './height.js'; // round 19 (lane sys19): heights, one shadow system // round 13 (lane E): the newer enemies' extra drawing

// One outline thickness for everything drawn here, in room units (util.js; round 19, lane outline19: the parts' and the
// props' outlines are drawn at it too, whatever their size).
export { OUTLINE };

export const view = { scale: 1, base: 1, zoom: 0.8, dpr: 1, cw: 0, ch: 0, rot: false, camX: null, camY: null, m: [1, 0, 0, 1, 0, 0] };
try { const z = +localStorage.getItem('delve.zoom'); if (z) view.zoom = z; } catch {}
export const ZOOM_MIN = 0.5, ZOOM_MAX = 1.5;
export function setZoom(z) { view.zoom = clamp(z, ZOOM_MIN, ZOOM_MAX); try { localStorage.setItem('delve.zoom', String(view.zoom)); } catch {} }
const ACROSS = 480; // one room chunk across = the screen's width in portrait

// topPad/bottomPad: screen space taken by the HUD. Portrait turns the room a quarter turn.
export function layout(canvas, w, topPad, bottomPad = 10, sidePad = 10) {
  const dpr = Math.min(window.devicePixelRatio || 1, view.dprCap || 3); // (round 13, the Book's preview caps its own)
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
  view.dpr = dpr; view.cw = cw; view.ch = ch; view.padT = topPad; view.padB = bottomPad; // (lane W: convoy.js's off-screen arrows keep clear of the HUD)
  view.rot = ch > cw;
  const pad = 26; // the wall frame around the floor
  const edge = 7; // how much of the side walls stays on screen
  const availW = cw - sidePad * 2, availH = ch - topPad - bottomPad;
  // one chunk across fills the screen's short side; anything bigger scrolls, both ways
  const across = view.rot ? availW : availH, along = view.rot ? availH : availW;
  // zoom 1 = one chunk across fills the screen's short side; the default shows a bit more
  const base = view.rot ? cw / (ACROSS + edge * 2) : Math.min(across / (ACROSS + edge * 2), along / 900);
  const baseW = w.across ? across / (w.across * 0.8) : base; // lane W (convoy.js): the wagon road shows w.across units across at the default zoom
  const s = baseW * view.zoom;
  view.scale = s; view.base = baseW;
  // the camera follows the party's middle, never further than the walls
  // (a battle: the middle of everyone still standing, both sides)
  const heroes = w.battle ? w.units.filter((u) => !u.dead && !u.ethereal && u.team !== 'neutral') : w.units.filter((u) => u.team === 'hero' && !u.downed);
  let tx = w.W / 2, ty = w.H / 2;
  if (heroes.length) { tx = ty = 0; for (const h of heroes) { tx += h.x; ty += h.y; } tx /= heroes.length; ty /= heroes.length; }
  const halfX = along / (2 * s), halfY = across / (2 * s);
  const fit = (v, half, size) => { const lo = half - pad, hi = size - half + pad; return lo > hi ? size / 2 : clamp(v, lo, hi); };
  if (w.camAt) { tx = w.camAt.x; ty = w.camAt.y; } // lane C (convoy.js): the camera rides with the wagon
  tx = fit(tx, halfX, w.W); ty = fit(ty, halfY, w.H);
  // the player's drag wins for a while, then the camera eases back to the party
  const now = performance.now(), fdt = Math.min(0.1, (now - (view.lastT || now)) / 1000); view.lastT = now;
  if (view.manualT > 0) {
    view.manualT -= fdt;
    // a drag can take the camera past the room's edge by up to a third of the room's size (designer, round 6)
    const loose = (v, half, size) => { const m = size / 3, lo = half - pad - m, hi = size - half + pad + m; return lo > hi ? clamp(v, size / 2 - m, size / 2 + m) : clamp(v, lo, hi); };
    if (view.manual != null) { view.manual = loose(view.manual, halfX, w.W); tx = view.manual; }
    if (view.manualY != null) { view.manualY = loose(view.manualY, halfY, w.H); ty = view.manualY; }
  } else { view.manual = null; view.manualY = null; }
  const ease = view.manualT > 0 ? 0.35 : 0.06;
  const snap = view.camX == null || view.camY == null || view.snap;
  view.camX = snap ? tx : view.camX + (tx - view.camX) * ease;
  view.camY = snap ? ty : view.camY + (ty - view.camY) * ease;
  view.snap = false;
  const midAcross = view.rot ? cw / 2 : topPad + availH / 2;
  const midAlong = view.rot ? topPad + availH / 2 : sidePad + availW / 2;
  if (view.rot) view.m = [0, -s, s, 0, midAcross - view.camY * s, midAlong + view.camX * s];  // world +x = screen up
  else view.m = [s, 0, 0, s, midAlong - view.camX * s, midAcross - view.camY * s];
}
export function snapCamera() { view.snap = true; view.manual = null; view.manualY = null; view.manualT = 0; }

// Draw fn in a frame centred on (x,y) that stays upright on screen (texts, bars, shadows).
function upright(ctx, x, y, fn) { ctx.save(); ctx.translate(x, y); if (view.rot) ctx.rotate(Math.PI / 2); fn(); ctx.restore(); }
// Which way "up the screen" points in room units.
function upVec() { return view.rot ? [1, 0] : [0, -1]; }

let floorCache = null;
// The room's floor, rock and dressing, drawn once into a canvas (scenery.js paints it in the dungeon type's look).
function floor(w) {
  const key = w.W + 'x' + w.H + ':' + view.base.toFixed(3) + ':' + view.dpr + ':' + view.rot + ':env' + envId() + ':ol' + OUTLINES; // (lane toggles19: the walls' ink is in it)
  if (floorCache && floorCache.key === key && floorCache.w === w) return floorCache.c;
  const pad = 48; // the walls round the room and a little rock past them
  const c = document.createElement('canvas');
  let s = view.base * view.dpr;
  const area = (w.W + pad * 2) * (w.H + pad * 2);
  const cap = w.cacheMax || 12e6; // lane W (convoy.js): the wide road's ground is cached smaller (a phone's memory)
  if (area * s * s > cap) s = Math.sqrt(cap / area); // a big room's floor is cached a little softer
  c.width = Math.ceil((w.W + pad * 2) * s); c.height = Math.ceil((w.H + pad * 2) * s);
  const g = c.getContext('2d');
  g.scale(s, s); g.translate(pad, pad);
  paintFloor(g, w, pad);
  if (w.paintGround) w.paintGround(g, w); // lane C (convoy.js): the road, painted into the cache
  floorCache = { key, c, w, pad, s };
  return c;
}

function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
// Fill a path twice: ink grown by the outline, then the colour. Keeps every outline the same thickness.
// (round 19, lane toggles19: outlines off, the colour alone)
function inked(ctx, pathFn, fill) {
  if (OUTLINES) { ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round';
  pathFn(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = fill; pathFn(); ctx.fill();
}

// The circle shadow under a unit (round 6), smaller in round 7 and merged: where shadows overlap they make one shape
// (their union), never a darker patch. Every disc goes at full strength into one layer at half the canvas's
// resolution, and that layer goes onto the floor once, see-through (SHADOW_A). Only the part of the layer the discs
// cover is cleared and copied each frame.
const SHADOW_A = 0.36;
let unitShadowImg = null;
function unitShadow() { // solid to 60% of the radius, then a short soft rim
  if (unitShadowImg) return unitShadowImg;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgb(43,34,48)'); gr.addColorStop(0.6, 'rgb(43,34,48)'); gr.addColorStop(1, 'rgba(43,34,48,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (unitShadowImg = c);
}
// The old single-image sprites (the hired Knight and Rogue) are drawn bigger than their vr: their shadow is sized to
// the sprite, else it hides under it (round 9: "you can't see the knight's shadow").
// round 19 (lane sys19): a thing that stands upright, foot down the screen (def.upright), casts its shadow at its foot:
// def.foot [how far down from its middle, the foot's half-width], in its art's SVG units (the totem's carved foot, an
// ellipse 72 wide at 88 below its middle). Without one an upright thing's shadow is under its middle, as any unit's.
const FOOT = { totem: [88, 36] };
function footOf(u) {
  const f = u.def.upright && (u.def.foot || FOOT[u.kind]); if (!f) return null;
  const k = u.vr / (u.def.headR || headR(u.kind)), [ux, uy] = upVec();
  return { x: -ux * f[0] * k, y: -uy * f[0] * k, r: f[1] * k * 1.45 * bigOf(u) };
}
const shadowSize = (u) => (u.downed ? u.vr * 1.35 : u.vr * (u.def.art ? 1.75 : 2.2)) * (1 - Math.min(u.def.hops ? 0.5 : 0.35, (u.hop || 0) / 120)) * bigOf(u);
// Elites and majors are just bigger versions of themselves (round 9: no gold outline).
const bigOf = (u) => (u.major || u.mini ? 1.16 : u.elite ? 1.08 : 1);
const SH = { c: null, box: null, half: 0.5 };
function drawShadows(ctx, w, tf) {
  const cv = ctx.canvas, h = SH.half;
  if (!SH.c) SH.c = document.createElement('canvas');
  const lw = Math.ceil(cv.width * h), lh = Math.ceil(cv.height * h);
  if (SH.c.width !== lw || SH.c.height !== lh) { SH.c.width = lw; SH.c.height = lh; SH.box = null; }
  const g = SH.c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (SH.box) g.clearRect(SH.box[0], SH.box[1], SH.box[2] - SH.box[0], SH.box[3] - SH.box[1]);
  const [a, b, c, d, e, f] = tf.map((v) => v * h), k = Math.hypot(a, b), img = unitShadow();
  g.setTransform(a, b, c, d, e, f);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const disc = (x, y, r, al) => {
    g.globalAlpha = al; g.drawImage(img, x - r, y - r, r * 2, r * 2);
    const sx = a * x + c * y + e, sy = b * x + d * y + f, sr = r * k + 2;
    if (sx - sr < x0) x0 = sx - sr; if (sy - sr < y0) y0 = sy - sr; if (sx + sr > x1) x1 = sx + sr; if (sy + sr > y1) y1 = sy + sr;
  };
  // (round 13, lane E: def.shadows, a body that isn't round; lane B, bosses3: u.shadowK sizes a code-drawn boss's shadow (0: none: a wurm under the sand))
  for (const u of w.units) if ((!u.ethereal || u.hiddenIn) && u.shadowK !== 0 && !u.hidden) {
    if (u.def.shadows) { for (const [x, y, r] of u.def.shadows(u)) disc(x, y, r * 1.75, 1); continue; }
    const ft = footOf(u); // a thing that stands (the totem): its shadow at its foot, the size of its foot
    if (ft) disc(u.x + ft.x, u.y + ft.y, ft.r, 1); else disc(u.x, u.y, shadowSize(u) * (u.shadowK ?? 1), 1);
  }
  // a body in the air leaves its shadow on the floor
  for (const cp of w.corpses) if (cp.z > 2) disc(cp.x, cp.y, cp.vr * 1.3, clamp(cp.t / 4, 0, 1) * 0.8);
  // round 19 (lane sys19): the rest of the room's shadows, in the same layer. Obstacles and crates (they had a softer
  // shadow of their own), the chest and the pedestal; a lobbed thing (kits2.js lob: bread, flasks, bombs, a totem or a
  // hive on its way) on the floor under it, shrinking and fading as it rises (height.js projZ; it drew two of its own);
  // and whatever an effect cast this frame (height.js castShadow: a cannonball falling, a hurled rock, a javelin from the
  // sky, a hammer circling).
  for (const p of w.pillars) if (!p.painted) disc(p.x, p.y, p.r * 1.45, 1);
  for (const r of w.walls) if (r.prop) disc(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.8, 1);
  for (const p of w.pickups) if (p.type === 'chest') disc(p.x, p.y, 34, p.drop > 0 ? 1 - p.drop / 0.45 : 1); else if (p.type === 'pedestal') disc(p.x, p.y, 26, 1);
  for (const p of w.projectiles) if (p.life > 0 && (p.lob || p.noHit)) { const h = projZ(p); if (h > 0 || p.lob) disc(p.x, p.y, shadowOfH(p.shadowR || LOB_SHADOW_R, h) * 1.75, 1 - Math.min(0.55, h / 160)); }
  takeShadows((x, y, r, a) => disc(x, y, r * 1.75, a));
  g.globalAlpha = 1;
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(lw, Math.ceil(x1)); y1 = Math.min(lh, Math.ceil(y1));
  SH.box = x1 > x0 && y1 > y0 ? [x0, y0, x1, y1] : null;
  if (!SH.box) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = SHADOW_A;
  ctx.drawImage(SH.c, x0, y0, x1 - x0, y1 - y0, x0 / h, y0 / h, (x1 - x0) / h, (y1 - y0) / h);
  ctx.restore();
}

const SPRITE_KIND = { boss: 'boss', slimeSmall: 'slimeSmall' };

let w_battle = false; // battle mode (battle.js): both sides carry bars and a ring in their colour
const SIDE_RING = { a: 'rgba(95,168,255,0.85)', b: 'rgba(255,107,90,0.85)' };
export function draw(ctx, w) {
  const d = view.dpr, m = view.m;
  w_battle = !!w.battle; setHpSides(w.battle ? w.battle.side : null);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.fillStyle = voidColor(w); ctx.fillRect(0, 0, view.cw, view.ch);
  // screen shake, kept small (round 6: punchy hits without heavy shake)
  const sk = Math.min(w.shake, 8) * 0.45;
  const sh = sk > 0 ? (Math.random() - 0.5) * sk : 0, sv = sk > 0 ? (Math.random() - 0.5) * sk : 0;
  const tf = [d * m[0], d * m[1], d * m[2], d * m[3], d * (m[4] + sh), d * (m[5] + sv)];
  ctx.setTransform(...tf);
  const fl = floor(w);
  const s = view.scale;
  ctx.drawImage(fl, -floorCache.pad, -floorCache.pad, fl.width / floorCache.s, fl.height / floorCache.s);
  drawDoors(ctx, w);
  for (const r of w.walls) if (r.temp != null) { if (r.kind === 'ice') drawIceWall(ctx, r, w.time); else if (WALL2[r.kind]) WALL2[r.kind](ctx, r, w.time); /* round 15 (lane N): a wall with its own look (the Earth Mage's stone) */ else drawWallThemed(ctx, r, w); } // the rest are in the floor cache
  for (const h of w.hazards) if (!drawHazardPuddle(ctx, h, w.time) && !drawThemeHazard(ctx, h, w.time)) drawHazard(ctx, h, w.time); // puddles.js: the player's puddle style
  drawArena(ctx, w);
  drawDanger(ctx, w);
  drawGroundFx(ctx, w);
  drawFoeGround(ctx, w); // round 13 (lane E): snow tracks, burrow mounds
  drawSoilGround(ctx, w); // (round 19, lane boulder19: a rolling boulder's scuffs in the floor)
  flushPuddles(ctx, tf); // puddles.js: every ground body queued above; bodies of a kind merge into one (round 9)
  // one shadow system (round 19, lane sys19: "MAKE SURE YOU USE 1 SHADOW SYSTEM FOR EVERYTHING"): a round shadow
  // straight under every unit, obstacle, crate, chest, lobbed thing and code-drawn thing in the air (top-down: no side
  // cast), all of them merged into one layer; a thing up in the air leaves its shadow on the floor under it, smaller and
  // fainter the higher it is. Laid before the obstacles and pickups, so a shadow passes under a pillar, not over it.
  drawShadows(ctx, w, tf);
  for (const p of w.pickups) drawPickup(ctx, p, w.time);
  drawSoil(ctx, w); // (round 19, lane boulder19: the dust and clods a rolling boulder kicks up, under the balls)
  for (const p of w.pillars) if (!p.painted) drawPillar(ctx, p, w); // (lane W: p.painted = already in the ground's picture, convoy.js)
  // crates on the grid (layout.js): square obstacles, colliding as the wall rectangle they are (48 across at sc 1)
  for (const r of w.walls) if (r.prop) { const x = r.x + r.w / 2, y = r.y + r.h / 2; prop(ctx, r.prop, x, y, PROP_BOX, { sc: r.w / 48 }); }
  if (w.battle) { // whose side: a thin ring on the floor round each unit's feet (an outline round the body is kept for protection)
    ctx.lineWidth = 2.4;
    for (const u of w.units) { const c = SIDE_RING[w.battle.side[u.team]]; if (!c || u.dead || u.ethereal || (u.linkTo && u.def.segment)) continue; ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(u.x, u.y, u.vr * 1.12 + 3, 0, TAU); ctx.stroke(); } // (round 13, lane E: one ring for a chain, its head's)
  }
  for (const t of w.telegraphs) if (t.type === 'ring') drawRing(ctx, t);
  for (const c of w.corpses) drawCorpse(ctx, c);
  // round 19 (lane sys19, the designer: in the air, "always render in front of everything on the ground until landed"):
  // the downed first, then everything on the floor, then what hovers, then what flies (height.js airTier: a leap, a
  // thrown foe, a pounce's hang, a hop, a swoop, the imps, the spirit eagle, bats), each by its depth on screen
  const order = [...w.units].map((u) => (u._tier = airTier(u), u)).sort((a, b) => (a.downed ? -1 : 0) - (b.downed ? -1 : 0) || a._tier - b._tier || screenDepth(a) - screenDepth(b));
  const dt = Math.min(0.05, Math.max(0, w.time - (w._lastDraw ?? w.time))); w._lastDraw = w.time; w._dt = dt;
  noteHits(w);
  for (const u of order) drawBodyGround(ctx, u, w); // chains, rays and rings that lie under the units (round 9)
  // a rat drawn by hand gets its springy tail; the rat king's art (art round 8) has its own tails knotted in it
  for (const u of order) { if ((u.kind === 'rat' || u.def.spriteOf === 'rat') && !u.def.art && !u.downed) drawTail(ctx, u, dt); if (!drawFoe(ctx, u, w, dt, RH)) drawUnit(ctx, u, w); drawStatusFx(ctx, u, w.time); drawStatusMarks(ctx, u, w.time, w); drawMarks3(ctx, u, w); /* round 15 (lane N): Shackled's irons */ drawBodyFx(ctx, u, w); }
  if (w.drawOver) w.drawOver(ctx, w, view); // lane W (convoy.js): the forest's canopy, over the units at the edge (a cached picture)
  for (const p of w.projectiles) projectile(ctx, p, w.time);
  for (const p of w.particles) drawParticle(ctx, p);
  ctx.globalAlpha = 1;
  if (w.arenaAir) w.arenaAir(ctx, w); // lane B (bosses2): a boss arena's things in the air (falling fire, snow)
  drawAirFx(ctx, w);
  // a ray a caster holds on its target (Life Drain, round 9): over the target, under the caster
  for (const f of w.fx) if (f.type === 'beam' && f.over && !f.over.dead && w.units.includes(f.over)) { drawBeam(ctx, f, w.time); drawUnit(ctx, f.over, w); }
  drawLocal(ctx, dt);
  // melee swings and blasts are drawn as weapon arcs and bursts by fxkit.js (drawLocal), round 8
  for (const f of w.fx) drawSpikeFx(ctx, f);
  drawMood(ctx, w, view.cw, view.ch, view.dpr);
  ctx.setTransform(d * m[0], d * m[1], d * m[2], d * m[3], d * m[4], d * m[5]);
  for (const u of order) drawOverlay(ctx, u, dt);
  // Words over the arena (damage numbers, ability names) are off: show, don't tell. drawText stays for later use.
}
const screenDepth = (u) => (view.rot ? -u.x : u.y);

// The way in (behind the party) and the doors ahead, each marked with what kind of room it leads to.
const DOOR_COL = { fight: '#C8553D', hazard: '#E0884B', elite: '#8E3B5B', treasure: '#F2B53A', fountain: '#5DB7E0', decision: '#9B7BD6', boss: '#2B2230' };
function drawDoors(ctx, w) {
  arch(ctx, 0, w.doorIn.y, -1, true, false, w.time);
  // shut while the fight is on; open and lit in the colour of the room behind once it's won; when the party picks
  // one, the others swing shut again so the way it takes stands out
  const picked = (w.doors || []).some((d) => d.chosen);
  for (const d of w.doors || []) {
    const open = w.cleared && (!picked || d.chosen);
    arch(ctx, w.W, d.y, 1, open, d.chosen, w.time, DOOR_COL[d.kind], d.kind);
    // what's behind it: its sign set in the doorway (on the shut doors, or hanging in the lit passage)
    upright(ctx, w.W + 17, d.y, () => {
      const k = d.chosen ? 1 + 0.08 * Math.sin(w.time * 5) : 1;
      ctx.globalAlpha = picked && !d.chosen ? 0.5 : 1; ctx.scale(k, k);
      roomIcon(ctx, d.kind, 12.5);
      ctx.globalAlpha = 1;
    });
  }
}
// A doorway in the wall band at x (the room's edge), facing into the room (dir -1: the way in, +1: a way out).
function arch(ctx, x, y, dir, open, chosen, t, col, kind) {
  // the door art: +y in the file points into the room
  const name = dir < 0 ? 'door-open' : !open ? 'door-shut' : DOOR_ART[kind] || 'door-open';
  const pulse = (chosen ? 1 : 0.6) * (0.75 + 0.25 * Math.sin(t * 3 + y));
  if (prop(ctx, name, x, y, 141.4, { rot: dir > 0 ? Math.PI / 2 : -Math.PI / 2, extraA: pulse })) {
    if (open && col && dir > 0 && chosen) { // the way the party takes glows a little more
      const g = ctx.createRadialGradient(x, y, 4, x, y, 120); g.addColorStop(0, hexA(col, 0.3 * pulse)); g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 120, 0, TAU); ctx.fill();
    }
    return;
  }
  const half = 44, band = 26, o = dir > 0 ? x : x - band;
  // stone jambs either side
  for (const sy of [-1, 1]) inked(ctx, () => roundRect(ctx, o - 2, y + sy * (half + 6) - 7, band + 4, 14, 5), '#9A8C7C');
  // the opening
  ctx.fillStyle = INK; ctx.fillRect(o, y - half, band, half * 2);
  if (!open) {
    // a shut wooden door: planks and two iron bands
    const g = ctx.createLinearGradient(o, y - half, o, y + half); g.addColorStop(0, '#9A6A3E'); g.addColorStop(1, '#7A5130');
    ctx.fillStyle = g; ctx.fillRect(o + 3, y - half + 3, band - 6, half * 2 - 6);
    ctx.fillStyle = 'rgba(43,34,48,0.35)'; for (let i = 1; i < 4; i++) ctx.fillRect(o + 3, y - half + 3 + i * (half * 2 - 6) / 4 - 1, band - 6, 2);
    ctx.fillStyle = '#4A4247'; for (const k of [-0.55, 0.55]) ctx.fillRect(o + 3, y + k * half - 3, band - 6, 6);
  } else if (col) {
    // the opening glows in the colour of the room behind it; the one the party takes glows strongest
    const k = (chosen ? 1 : 0.55) * (0.8 + 0.2 * Math.sin(t * 3 + y));
    const R = chosen ? 130 : 95;
    const g = ctx.createRadialGradient(x, y, 4, x, y, R);
    g.addColorStop(0, hexA(col, 0.6 * k)); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fillRect(o + 4, y - half + 4, band - 8, half * 2 - 8);
    ctx.fillStyle = '#FFF4DC'; ctx.globalAlpha = 0.35 * k; ctx.fillRect(o + 8, y - half + 10, band - 16, half * 2 - 20); ctx.globalAlpha = 1;
  }
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function roomIcon(ctx, kind, r) {
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); }, DOOR_COL[kind] || '#999');
  ctx.fillStyle = '#FFF4DC'; ctx.strokeStyle = '#FFF4DC'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  const k = r / 11;
  ctx.beginPath();
  // a sword point up (a plain X read as "no way" on a shut door); the elite's two swords crossed, hilts down
  if (kind === 'fight') { ctx.moveTo(0, -6.5 * k); ctx.lineTo(0, 3 * k); ctx.moveTo(-4 * k, 2.6 * k); ctx.lineTo(4 * k, 2.6 * k); ctx.moveTo(0, 3 * k); ctx.lineTo(0, 6 * k); ctx.stroke(); }
  else if (kind === 'elite') { for (const sx of [-1, 1]) { ctx.moveTo(sx * 5.5 * k, -6 * k); ctx.lineTo(-sx * 3 * k, 3.5 * k); ctx.moveTo(-sx * 4.6 * k, 0.8 * k); ctx.lineTo(-sx * 0.4 * k, 4.8 * k); ctx.moveTo(-sx * 3 * k, 3.5 * k); ctx.lineTo(-sx * 5 * k, 5.6 * k); } ctx.stroke(); }
  else if (kind === 'hazard') { ctx.moveTo(0, -6 * k); ctx.lineTo(5.5 * k, 4.5 * k); ctx.lineTo(-5.5 * k, 4.5 * k); ctx.closePath(); ctx.stroke(); }
  else if (kind === 'treasure') { ctx.rect(-5.5 * k, -3.5 * k, 11 * k, 8 * k); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5.5 * k, 0); ctx.lineTo(5.5 * k, 0); ctx.stroke(); }
  else if (kind === 'fountain') { ctx.moveTo(0, -6 * k); ctx.bezierCurveTo(5 * k, 0, 4 * k, 5 * k, 0, 5 * k); ctx.bezierCurveTo(-4 * k, 5 * k, -5 * k, 0, 0, -6 * k); ctx.fill(); }
  else if (kind === 'decision') { for (const x of [-4.5, 0, 4.5]) { ctx.moveTo(x * k + 1.6 * k, 0); ctx.arc(x * k, 0, 1.6 * k, 0, TAU); } ctx.fill(); }
  else if (kind === 'boss') { ctx.moveTo(-6 * k, 4 * k); ctx.lineTo(-6 * k, -4 * k); ctx.lineTo(-3 * k, 0); ctx.lineTo(0, -5 * k); ctx.lineTo(3 * k, 0); ctx.lineTo(6 * k, -4 * k); ctx.lineTo(6 * k, 4 * k); ctx.closePath(); ctx.fill(); }
}

// Props from art/props: a 220 box is 86.4 room units (the doors' 360 box 141.4), centred on the prop.
const PROP_BOX = 86.4;
function prop(ctx, name, x, y, box, opts = {}) {
  const e = getProp(name, box * view.scale * view.dpr * (opts.sc || 1), OUTLINE * view.scale * view.dpr); if (!e) return false; // (round 19, lane outline19: the outline in pixels, so it is OUTLINE whatever the prop's size)
  ctx.save(); ctx.translate(x, y);
  if (opts.rot != null) ctx.rotate(opts.rot); else if (opts.upright !== false && view.rot) ctx.rotate(Math.PI / 2);
  if (opts.sc) ctx.scale(opts.sc, opts.sc);
  const light = () => { if (opts.extraA && e.extra) { ctx.globalAlpha = opts.extraA; ctx.drawImage(e.extra, -box / 2, -box / 2, box, box); ctx.globalAlpha = 1; } };
  if (!e.over) light();
  const pu = (e.pad || 0) / (e.size || 1) * box; // the outline's room round the box (sprites.js getProp)
  ctx.drawImage(e.img, -box / 2 - pu, -box / 2 - pu, box + pu * 2, box + pu * 2);
  if (e.over) light();
  ctx.restore();
  return true;
}
const DOOR_ART = { fight: 'door-open-fight', hazard: 'door-open-hazard', elite: 'door-open-elite', treasure: 'door-open-treasure', fountain: 'door-open-fountain', decision: 'door-open-choice', boss: 'door-open-boss' };

function drawWall(ctx, r) {
  // stone blocks seen from above: outlined, lit from the left, a lighter top face
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, '#8C7E70'); g.addColorStop(1, '#6E6157');
  inked(ctx, () => roundRect(ctx, r.x, r.y, r.w, r.h, 6), g);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, r.x + 5, r.y + 5, Math.max(0, r.w - 10), Math.max(0, r.h - 10), 4); ctx.fill();
}

function drawHazard(ctx, h, t) {
  if (h.type === 'oil' && prop(ctx, 'hazard-oil', h.x, h.y, PROP_BOX, { sc: h.r / 38 })) return;
  if (h.type === 'spikes' && prop(ctx, h.up === false ? 'trap-spikes-down' : 'trap-spikes-up', h.x, h.y, PROP_BOX, { sc: h.r / 30 })) return;
  ctx.save();
  if (h.type === 'oil') {
    inked(ctx, () => blob(ctx, h.x, h.y, h.r, 7, h.x * 0.1), '#3B3330');
    ctx.fillStyle = 'rgba(160,140,200,0.35)'; ctx.beginPath(); ctx.ellipse(h.x - h.r * 0.3, h.y - h.r * 0.35, h.r * 0.35, h.r * 0.14, -0.4, 0, TAU); ctx.fill();
  } else if (h.type === 'fire') {
    const k = 1 + Math.sin(t * 14 + h.x) * 0.05;
    inked(ctx, () => blob(ctx, h.x, h.y, h.r * k, 7, h.x * 0.1 + t), '#E8582A');
    ctx.fillStyle = '#FFB347'; blob(ctx, h.x, h.y, h.r * 0.62 * k, 6, -t * 1.3); ctx.fill();
    ctx.fillStyle = '#FFE58A'; blob(ctx, h.x, h.y, h.r * 0.28, 5, t * 2); ctx.fill();
    // a few standing flames on the patch
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + h.x, rr = h.r * 0.45, f = 0.75 + 0.25 * Math.sin(t * 9 + i * 2);
      upright(ctx, h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr, () => flameShape(ctx, 0, 0, 9 * f, '#FF8A3D', '#FFE08A'));
    }
  } else if (h.type === 'gas') {
    const a = h.max ? clamp(h.t / h.max, 0, 1) : 1;
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * TAU + t * 0.6, x = h.x + Math.cos(ang) * h.r * 0.45, y = h.y + Math.sin(ang) * h.r * 0.45;
      ctx.globalAlpha = 0.5 * a; ctx.fillStyle = '#5E8A2A'; ctx.beginPath(); ctx.arc(x, y, h.r * 0.55 + OUTLINE, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * TAU + t * 0.6, x = h.x + Math.cos(ang) * h.r * 0.45, y = h.y + Math.sin(ang) * h.r * 0.45;
      ctx.globalAlpha = 0.55 * a; ctx.fillStyle = '#A9D44A'; ctx.beginPath(); ctx.arc(x, y, h.r * 0.55, 0, TAU); ctx.fill();
    }
  } else if (h.type === 'spikes') {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); }, '#57534F');
    ctx.fillStyle = '#6E6965'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r - 4, 0, TAU); ctx.fill();
    const tips = [[0, 0]];
    const ring = Math.max(5, Math.round(h.r / 4.6));
    for (let i = 0; i < ring; i++) { const a = i / ring * TAU + 0.3; tips.push([Math.cos(a) * h.r * 0.58, Math.sin(a) * h.r * 0.58]); }
    if (h.up !== false) for (const [dx, dy] of tips) { // sunk (no tips) once the room is won
      const x = h.x + dx, y = h.y + dy, r = 4.6;
      if (OUTLINES) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 0.8, y + 0.8, r + 1.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#8D949C'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#D9DEE4'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, Math.PI * 0.55, Math.PI * 1.55); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x - 0.4, y - 0.4, 1.1, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

function drawPillar(ctx, p, w) {
  if (p.snowball) { // round 10: a yeti's snowball (foes10.js): packed snow, a blue shade and a few clumps
    noteRoll(p, w, 'yeti-snowball'); // (round 19, lane boulder19: its turn and its trail, from how far it moved)
    if (drawRolled(ctx, p, w, 'yeti-snowball')) return; // (round 19, lane boulder19: ?boulder=a|b, the ball drawn rolling, its picture's two bands gone)
    if (prop(ctx, 'yeti-snowball', p.x, p.y, PROP_BOX, { sc: p.r / 30 })) { snowRoll(ctx, p); return; } // art round 9: its own prop, like the troll's boulder; round 13 (lane E): it turns as it rolls
    inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); }, '#F4FAFF');
    ctx.fillStyle = 'rgba(150,190,225,0.45)'; ctx.beginPath(); ctx.arc(p.x + p.r * 0.18, p.y + p.r * 0.2, p.r * 0.78, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(p.x - p.r * 0.25, p.y - p.r * 0.28, p.r * 0.42, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(170,200,230,0.7)'; for (let i = 0; i < 5; i++) { const a = (p.spin || 0) + i * 1.3; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * p.r * 0.6, p.y + Math.sin(a) * p.r * 0.6, p.r * 0.1, 0, TAU); ctx.fill(); }
    return;
  }
  if (p.fountain) {
    if (prop(ctx, p.used ? 'fountain-used' : 'fountain', p.x, p.y, PROP_BOX, { sc: p.r / 38 })) return;
    inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); }, '#A99C8B');
    ctx.fillStyle = p.used ? '#7FA9BC' : '#5DB7E0'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.72, 0, TAU); ctx.fill();
    return;
  }
  // obstacles from the prop art: crates (two path cells square) and barrels at their own size, rocks and braziers
  // scaled to the collider; the Sewers' pipes are drawn by the theme (env.js obstacleFor picks)
  let name = p.prop || obstacleFor(p, w);
  if (name === 'rock') name = obstacleFor({ x: p.x, y: p.y, r: 99 }, w); // the style's boulder
  // grid obstacles (layout.js) fill their cell: a barrel 47 across at sc 1, a boulder ~60 at r 30
  const sc = p.grid ? (name === 'barrel' ? 1.5 : name === 'brazier' ? 1.25 : 1.2) : name === 'crate' || name === 'barrel' ? 1 : p.r / 30;
  if (p.boulder) { noteRoll(p, w, name); if (drawRolled(ctx, p, w, name)) return; } // (round 19, lane boulder19: a troll's boulder drawn rolling, ?boulder=a|b, and its dirt trail)
  if (name !== 'pipe' && prop(ctx, name, p.x, p.y, PROP_BOX, { sc })) return;
  drawPillarThemed(ctx, p, w);
}

function blob(ctx, x, y, r, n, ph) {
  ctx.beginPath();
  for (let i = 0; i <= n * 2; i++) {
    const a = i / (n * 2) * TAU;
    const rr = r * (1 + 0.08 * Math.sin(a * 3 + ph));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.82;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function tri(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.87, y + r * 0.5); ctx.lineTo(x - r * 0.87, y + r * 0.5); ctx.closePath(); }
// A lick of flame, tip up, base at (x,y). Outlined like everything else.
function flamePath(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 1.9);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r * 1.05, y - r * 0.4, x + r * 0.85, y + r * 0.25);
  ctx.arc(x, y + r * 0.1, r * 0.87, 0.2, Math.PI - 0.2);
  ctx.bezierCurveTo(x - r * 1.05, y - r * 0.4, x - r * 0.5, y - r * 1.1, x, y - r * 1.9); ctx.closePath();
}
function flameShape(ctx, x, y, r, outer, inner) {
  inked(ctx, () => flamePath(ctx, x, y, r), outer);
  ctx.fillStyle = inner; flamePath(ctx, x, y + r * 0.25, r * 0.5); ctx.fill();
}

function drawPickup(ctx, p, t) {
  if (p.type === 'coin') {
    // blinks out over its last second and a half
    if (p.life != null && p.life < 1.5 && Math.sin(t * 22) < 0) return;
    if (p.hop > 0) { // still flying out of the burst: lifted up the screen in an arc
      const [ux, uy] = upVec(), h = Math.sin(Math.PI * clamp(p.hop / 0.45, 0, 1)) * 16;
      ctx.save(); ctx.translate(ux * h, uy * h); drawCoin(ctx, p, t); ctx.restore(); return;
    }
    drawCoin(ctx, p, t);
  } else if (p.type === 'key') {
    const b = Math.sin(t * 5) * 2;
    upright(ctx, p.x, p.y, () => {
      ctx.translate(0, b);
      inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -6, 6, 0, TAU); ctx.rect(-2, -2, 4, 16); ctx.rect(0, 9, 7, 3.5); }, '#FFD45A');
    });
  } else if (p.type === 'trinket') {
    // a found trinket lying on the floor (round 7: a hero with a free slot walks over and takes it; a full one leaves
    // it for an ally): its own sprite (icons.js, round 8) on a soft glow, bobbing; flying out of the chest first
    const hop = p.hop > 0 ? Math.sin(Math.PI * clamp(p.hop / 0.5, 0, 1)) * 22 : 0, b = Math.sin(t * 4 + p.x) * 2 + hop;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + 0.12 * Math.sin(t * 3);
    const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 30); gl.addColorStop(0, '#FFF1C8'); gl.addColorStop(1, 'rgba(255,241,200,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, TAU); ctx.fill(); ctx.restore();
    const img = trinketImg(p.id);
    upright(ctx, p.x, p.y, () => {
      ctx.translate(0, -b);
      if (img) { const S = 40; ctx.drawImage(img, -S / 2, -S / 2, S, S); return; }
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, -2); ctx.lineTo(0, 9); ctx.lineTo(-8, -2); ctx.closePath(); }, '#B48CFF');
    });
  } else if (p.type === 'pedestal') {
    upright(ctx, p.x, p.y, () => {
      // the plinth seen from straight above (a soft shadow right under it); the reward floats over the cushion's middle
      if (prop(ctx, 'pedestal', 0, 0, PROP_BOX, { upright: false })) ctx.scale(0.9, 0.9);
      else inked(ctx, () => roundRect(ctx, -18, -14, 36, 28, 6), '#A99C8B');
      const col = { potion: '#E0604B', xp: '#FFE14D', coins: '#F2B53A', trinket: '#C9A7FF' }[p.reward];
      const bob = Math.sin(t * 3 + p.y) * 2;
      if (p.reward === 'potion') inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -4 + bob, 7, 0, TAU); ctx.rect(-2.5, -15 + bob, 5, 6); }, col);
      else if (p.reward === 'coins') { for (const [x, y] of [[-5, 0], [5, 0], [0, -6]]) inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y - 3 + bob, 5, 0, TAU); }, col); }
      else if (p.reward === 'xp') inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr = i % 2 ? 4 : 9; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr - 3 + bob); } ctx.closePath(); }, col);
      else inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -12 + bob); ctx.lineTo(7, -3 + bob); ctx.lineTo(0, 6 + bob); ctx.lineTo(-7, -3 + bob); ctx.closePath(); }, col);
    });
  } else if (p.type === 'chest') {
    // dropping in by the party when a room is won: it falls from above the screen (drawn big, shrinking to its size)
    const fall = p.drop > 0 ? p.drop / 0.45 : 0;
    if (fall > 0) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1 + fall * 1.2, 1 + fall * 1.2); ctx.translate(-p.x, -p.y); ctx.globalAlpha = 1 - fall * 0.6; }
    drawChest(ctx, p, t);
    if (fall > 0) { ctx.restore(); ctx.globalAlpha = 1; }
  }
}
// A trinket's UI sprite (icons.js SVG) as an image for the floor, made once per trinket.
const trinketImgs = new Map();
function trinketImg(id) {
  if (!id) return null;
  let e = trinketImgs.get(id);
  if (!e) {
    e = { img: new Image(), ok: false }; trinketImgs.set(id, e);
    const svg = icon('trinket', id).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" ');
    e.img.onload = () => { e.ok = true; };
    e.img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  return e.ok ? e.img : null;
}
function drawCoin(ctx, p, t) {
  inked(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, TAU); }, '#F2B53A');
  ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(p.x - 1.6, p.y - 1.6, 2, 0, TAU); ctx.fill();
  // now and then a glint runs over it
  const g = (t * 0.7 + (p.x * 0.013 + p.y * 0.007)) % 2.2;
  if (g < 0.25) { const k = Math.sin(g / 0.25 * Math.PI); ctx.fillStyle = '#FFFFFF'; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? 1.3 * k : 6 * k; ctx.lineTo(p.x + 2 + Math.cos(a) * rr, p.y - 2 + Math.sin(a) * rr); } ctx.fill(); }
}
// The chest opens empty (round 6): its coins spill out onto the floor, so no glow or gold inside once it's open.
function drawChest(ctx, p, t) {
  // (its shadow, straight down under it: render.js drawShadows, round 19)
  if (prop(ctx, p.open ? 'chest-open' : p.free ? 'chest-closed' : 'chest-locked', p.x, p.y, PROP_BOX, { extraA: 0 })) return;
  upright(ctx, p.x, p.y, () => {
    inked(ctx, () => roundRect(ctx, -21, -15, 42, 30, 6), p.open ? '#7A4A26' : '#A0683A');
    if (p.open) { ctx.fillStyle = '#2E2220'; roundRect(ctx, -16, -10, 32, 20, 4); ctx.fill(); }
    else { ctx.fillStyle = '#F2B53A'; ctx.fillRect(-21, -3, 42, 6); inked(ctx, () => roundRect(ctx, -5, -5, 10, 10, 2.5), '#FFE08A'); }
  });
}

// ---------------------------------------------------------------- units
const ease = (k) => Math.sin(k * Math.PI);

// The motion every unit shares, in its own frame: the hit squash, the turn to its facing, lunges and recoils.
function unitFrame(ctx, u, w) {
  ctx.translate(u.x, u.y);
  const T = w.time;
  // off the ground (a leap): the body lifts up the screen, its shadow stays where it really is (round 9)
  if (u.hop > 0) { const [ux, uy] = upVec(); ctx.translate(ux * u.hop * 0.9, uy * u.hop * 0.9); }
  // round 18 (lane dash18): one of the six dashes poses the body itself (dashes.js D.body: lean, squash and stretch along
  // its facing, a bank into a turn, a small hop)
  const dvb = u.act && u.act.dv && !u.downed ? u.act.dv.body : null;
  if (dvb && dvb.hop) { const [ux, uy] = upVec(); ctx.translate(ux * dvb.hop * 0.9, uy * dvb.hop * 0.9); }
  // a slime's hop (round 16, sim.js slime hops): squashed flat and wide on the floor (u.squish > 0: the crouch, the
  // landing), stretched tall in the air (< 0); up and down the screen whatever it faces, its foot kept where it was
  if (u.squish) {
    const [ux, uy] = upVec(), q = clamp(u.squish, -0.6, 0.9) * 0.36, a = Math.atan2(uy, ux);
    ctx.translate(-ux * u.vr * q, -uy * u.vr * q); ctx.rotate(a); ctx.scale(1 - q, 1 + q * 0.85); ctx.rotate(-a);
  }
  // knocked out: a hard shake for a moment as the stagger bursts (round 9)
  if (u.koT > 0 && u.bursts && T - (u.bursts.stagger ?? -9) < 0.6) { const q = 1 - (T - u.bursts.stagger) / 0.6, f = Math.floor(T * 40); ctx.translate((hash(f, u.id) - 0.5) * 8 * q, (hash(u.id, f) - 0.5) * 8 * q); }
  // a full turn: Cleave, Reap, Fan of Knives (u.spin); the archer's Roll (round 9)
  if (u.spin) { const k = (T - u.spin.t0) / u.spin.dur; if (k >= 0 && k < 1) ctx.rotate((u.spin.dir || 1) * TAU * k * k * (3 - 2 * k)); else if (k >= 1) u.spin = null; }
  if (u.act && u.act.type === 'dash' && u.act.roll) { const k = 1 - u.act.t / u.act.max; ctx.rotate(TAU * k * k * (3 - 2 * k) * (u.act.dir || 1)); }
  // hit: squashed and shoved along the blow
  if (HIT_OWN.frame && !u.downed && HIT_OWN.frame(ctx, u, w)) { /* (round 19, lane art-hitfx: ?hitfx=, the blow's shove and a dodge's sidestep) */ }
  else if (u.hitT > 0 && !u.downed) {
    const k = u.hitT / 0.16;
    ctx.rotate(u.hitA); ctx.translate((u.hitBlock ? 3 : 8) * k, 0); ctx.scale(1 - 0.2 * k, 1 + 0.12 * k); ctx.rotate(-u.hitA);
  }
  // (round 15, lane E: def.upright, a thing that stands, drawn as its file is, foot down the screen, whatever it faces:
  // the totem, the cauldron, the hive; the code drew them upright() and never turned them)
  ctx.rotate(u.downed ? u.facing - Math.PI / 2 + 0.6 : u.def.upright ? (view.rot ? Math.PI / 2 : 0) : u.facing - Math.PI / 2);
  // in the sprite's own frame forward is +y
  let fx = 0, fy = 0, sc = 1, tilt = 0;
  const flat = u.def.flat; // (round 17, lane foes17: a snake or a centipede lies flat on the floor: no step bounce, no breathing)
  if (!u.downed && u.spd > 6 && !flat) { // a small step bounce, no side-to-side wobble; the arms swing (parts.js)
    const k = clamp(u.spd / (u.def.speed || 60), 0, 1.3);
    sc = 1 + Math.abs(Math.cos(u.bob)) * 0.025 * k;
  }
  if (u.lungeT > 0) { const k = ease(1 - u.lungeT / 0.18); fy += u.vr * 0.5 * k; sc *= 1 + 0.08 * k; }
  if (u.recoilT > 0) { fy -= u.vr * 0.22 * (u.recoilT / 0.14); }
  if (u.lean) fy += u.vr * u.lean; // round 13 (lane E): leaning into something (a yeti pushing its snowball)
  if (u.act && (u.act.type === 'windup' || u.act.type === 'slam' || u.act.type === 'chargeTell')) {
    const k = 1 - u.act.t / u.act.max; fy -= u.vr * 0.3 * k; sc *= 1 + 0.1 * k; tilt += Math.sin(w.time * 40) * 0.03 * k;
  }
  if (u.act && u.act.type === 'charge') { fy += u.vr * 0.15; sc *= 1.04; }
  if (dvb) { fy += u.vr * (dvb.lean || 0); tilt += dvb.tilt || 0; }
  if (u.sleepT > 0) sc *= 1 + Math.sin(w.time * 2.4 + u.id) * 0.02;
  // round 13 (lane S): how the new statuses move the body. Sleepy: its head nods (a slow droop forward, then a jerk
  // back up). Fear: it trembles, harder as it builds; terrified, it shakes. Confused: it sways off balance.
  const sti = u.st || {};
  if (!u.downed && sti.sleepy > 8 && !(u.sleepT > 0)) { const f = clamp(sti.sleepy / 100, 0, 1), ph = (T * 0.55 + u.id * 0.3) % 1, nod = ph < 0.8 ? ph / 0.8 : 1 - (ph - 0.8) / 0.2; tilt += 0.26 * f * nod * nod; fy += u.vr * 0.12 * f * nod; }
  if (!u.downed && (sti.fear > 8 || u.fearT > 0)) { const f = u.fearT > 0 ? 1 : clamp(sti.fear / 100, 0, 1), q = Math.floor(T * 30); fx += (hash(q, u.id) - 0.5) * 5 * f; fy += (hash(u.id, q) - 0.5) * 3 * f; }
  if (!u.downed && (sti.confuse > 8 || u.addledT > 0)) { const f = u.addledT > 0 ? 1 : clamp(sti.confuse / 100, 0, 1); tilt += Math.sin(T * 3.1 + u.id) * 0.2 * f; }
  else if (!u.downed && u.spd <= 6 && !u.act && !flat) sc *= 1 + Math.sin(T * 2.6 + u.id) * 0.016; // breathing while it stands: nobody freezes stiff (round 9)
  // Granny leans her whole body into the scythe's sweep (round 9: "better animation of body too")
  if (u.kind === 'granny' && u.anim && u.anim.kind === 'swing') { const k = u.anim.t / u.anim.dur; tilt += k < 0.25 ? -0.3 * (k / 0.25) : -0.3 + 0.75 * Math.min(1, (k - 0.25) / 0.3) - 0.45 * Math.max(0, (k - 0.55) / 0.45); }
  sc *= bigOf(u);
  if (u.hop > 0) sc *= 1 + u.hop / (u.def.hops ? 240 : 110); // a leap: off the ground, so drawn bigger (its shadow shrinks below) (round 16: a slime's hop goes higher, so it grows less with it)
  if (u.exiting) { const k = clamp(u.exiting.t / u.exiting.dur, 0, 1); sc *= 1 + 0.12 * Math.sin(Math.min(1, k * 3) * Math.PI) - 0.85 * k * k; } // through the door: a lift, then shrinking into the light
  ctx.translate(fx, fy); ctx.rotate(tilt); ctx.scale(sc, sc);
  if (dvb) ctx.scale(dvb.sx || 1, dvb.sy || 1);
  if (u.squash) ctx.scale(1, u.squash); // round 13 (lane E): foreshortened along its facing (the sun blade's point down in the floor)
}

// Status washes over the sprite: [colour, strength] pairs.
function washesOf(u, w) {
  if (u.exiting) return [['#FFF6D8', clamp(u.exiting.t / u.exiting.dur * 1.6, 0, 0.95)]]; // glowing into the light
  if (u.downed || u.flashT > (u.def.flashAt ?? 0.06)) return []; // (lane B, bosses3: def.flashAt: a boss struck many times a second shows white for a frame, not a third of the time)
  const st = u.st || {}, out = [];
  const chill = u.frozenT > 0 ? 1 : clamp((st.chill || 0) / 100, 0, 1), poison = clamp((st.poison || 0) / 100, 0, 1), burn = clamp((st.burn || 0) / 100, 0, 1);
  const wet = clamp((st.wet || 0) / 100, 0, 1), shock = clamp((st.shock || 0) / 100, 0, 1);
  if (chill > 0.05) out.push(['#9FDDF6', 0.25 + 0.4 * chill]);
  if (poison > 0.05) out.push(['#9BCB3C', 0.2 + 0.35 * poison]);
  if (burn > 0.05) out.push(['#FF7A2F', (0.12 + 0.2 * burn) * (0.7 + 0.3 * Math.sin(w.time * 25 + u.id))]);
  const rad = u.radiantT > 0 ? 1 : clamp((st.radiance || 0) / 100, 0, 1), curse = u.hexed ? 1 : clamp((st.curse || 0) / 100, 0, 1); // round 8
  if (rad > 0.03) out.push(['#FFF1B0', (0.15 + 0.35 * rad) * (u.radiantT > 0 ? 0.85 + 0.15 * Math.sin(w.time * 9) : 1)]);
  if (curse > 0.03) out.push(['#5A2A80', 0.15 + 0.3 * curse]);
  // round 13 (lane S): the new five's washes (each its own colour; enthralled and terrified pulse)
  const charm = u.flipKind === 'charm' ? 1 : clamp((st.charm || 0) / 100, 0, 1), conf = u.addledT > 0 ? 1 : clamp((st.confuse || 0) / 100, 0, 1);
  const sleepy = clamp((st.sleepy || 0) / 100, 0, 1), bleed = clamp((st.bleed || 0) / 100, 0, 1), fear = u.fearT > 0 ? 1 : clamp((st.fear || 0) / 100, 0, 1);
  if (charm > 0.03) out.push(['#FF6EB8', (0.12 + 0.3 * charm) * (u.flipKind === 'charm' ? 0.8 + 0.2 * Math.sin(w.time * 7) : 1)]);
  if (conf > 0.03) out.push(['#B48AE8', (0.1 + 0.25 * conf) * (u.addledT > 0 ? 0.75 + 0.25 * Math.sin(w.time * 13) : 1)]);
  if (sleepy > 0.03) out.push(['#6A5AA8', 0.1 + 0.25 * sleepy]);
  // round 14 ("Don't like visual at all"): no dark red wash; the Spurts look flushes it red for a blink on each heartbeat
  // and at its burst (fx-status.js bleedFlash); Trail and Drop leave the body alone
  { const bf = bleedFlash(u); if (bf > 0) out.push(['#E0303A', bf]); }
  if (u.bursts && u.bursts.bleed != null && w.time - u.bursts.bleed < 0.35 && bleedLook() === 1) out.push(['#FF2A2A', 0.7 * (1 - (w.time - u.bursts.bleed) / 0.35)]); // haemorrhage (Spurts): a red flash
  if (fear > 0.03) out.push(['#E8F0E0', (0.12 + 0.35 * fear) * (u.fearT > 0 ? 0.8 + 0.2 * Math.sin(w.time * 17) : 1)]);
  if (wet > 0.05) out.push(['#3F8FD8', 0.1 + 0.22 * wet]);
  if (shock > 0.05 && Math.sin(w.time * 31 + u.id * 3) > 0.55) out.push(['#FFF3A0', 0.35 + 0.4 * shock]);
  if (u.ethereal && !u.hiddenIn) out.push(['#BFE6FF', 0.45]);
  { const dv = u.act && u.act.dv; if (dv && dv.body && dv.body.wash) out.push(dv.body.wash); } // round 18 (lane dash18): a dash's own wash (the Shade's blinks: a shadow)
  // buffs show on the body itself, never as a ring round it (round 8)
  for (const b of u.buffs || []) {
    if (b.id === 'rage') out.push(['#FF3A2A', 0.18 + 0.12 * Math.sin(w.time * 10 + u.id)]);
    else if (b.id === 'unstoppable') out.push(['#FFE7A0', 0.2 + 0.12 * Math.sin(w.time * 12)]);
    else if (b.id === 'warSong') out.push(['#FFD45A', 0.1]);
    else if (b.id === 'whirl') out.push(['#FFFFFF', 0.08]);
    if (b.wash) out.push(typeof b.wash === 'function' ? b.wash(w.time) : b.wash); // lane H2 (round 13): a buff's own wash (kits2.js: Shade's shadow, weakened)
  }
  if (u.def.wash) out.push(u.def.wash); // lane H2: a summon's own wash (the Shade's shadow clones, the Shaman's spirits)
  if (u.leechT > 0) out.push(['#C8453D', 0.12 + 0.08 * Math.sin(w.time * 8)]);
  // being mended (the Cleric's ray, Sanctuary): the whole figure flashes a soft yellow-white, smoothly, on repeat
  if (u.mendGlow > w.time) out.push(['#FFF6C8', 0.1 + 0.32 * (0.5 + 0.5 * Math.sin(w.time * 5))]);
  // elites and majors: a faint warm tint (round 9; a major's a touch stronger)
  if (u.elite && u.team === 'enemy') out.push(['#FFD27A', u.major || u.mini ? 0.16 : 0.09]);
  const hw = hpWash(u, w.time); if (hw) out.push(hw);
  return out;
}

// A coloured border round a unit's outline is kept for protection (round 9): Guard's gold, Unstoppable's white-gold.
// Elites and majors no longer wear one: they are bigger (bigOf), with a faint tint (washesOf) and a twinkle (fxkit).
function borderOf(u, w) {
  if (u.downed) return null;
  if (u.buffs && u.buffs.some((b) => b.id === 'unstoppable')) return { color: '#FFF4B8', a: 0.85 + 0.15 * Math.sin(w.time * 9) };
  if (u.guardBy && u.guardT > 0 && !u.guardBy.dead && !u.guardBy.downed) return { color: '#F2C14E', a: 0.8 + 0.2 * Math.sin(w.time * 5) };
  { const b = u.buffs && u.buffs.find((x) => x.border); if (b) return { color: b.border, a: 0.85 + 0.15 * Math.sin(w.time * 9) }; } // lane H1 (round 13) hook: any buff can say it protects, with its border's colour (Old Bones; lane H2's Warded)
  return null;
}
function drawUnit(ctx, u, w) {
  if (u.hidden) return; // round 9: gone in a smoke bomb (the Bandit Chief), not just see-through
  if (u.def.draw) { u.def.draw(ctx, u, w); return; } // lane B (bosses2): a boss part drawn in code (js/fx-boss.js)
  if (u.gasT > 0) { drawPuddle(ctx, 'gas', u.x, u.y, u.vr * 1.5, w.time, 1, u.id * 7 + 1); return; } // Gas Form: he is a cloud (round 9)
  if (u.def.art) { drawPartsUnit(ctx, u, w); if (u.frozenT > 0) drawIce(ctx, u, w); return; }
  const s = view.scale * view.dpr;
  const kind = SPRITE_KIND[u.kind] || u.kind;
  const sizeU = u.vr * 220 / headR(kind);
  const spr = getSprite(kind, sizeU * s, sizeU * bigOf(u));
  ctx.save();
  unitFrame(ctx, u, w);
  if (u.invulnT > 0 && !u.act) ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(w.time * 18));
  if (u.downed) ctx.globalAlpha = 0.62;
  if (u.ethereal && !u.exiting && !u.hiddenIn) ctx.globalAlpha = 0.45; // (lane W: a foe still under the trees, convoy.js, is drawn solid)
  if (spr) {
    const bd = borderOf(u, w); if (bd) { const ga = ctx.globalAlpha, r = sizeU * 1.1; ctx.globalAlpha = ga * bd.a; ctx.drawImage(tinted(spr, bd.color), -r / 2, -r / 2, r, r); ctx.globalAlpha = ga; }
    let img = u.downed ? spr.grey : u.flashT > 0.06 ? spr.flash : spr.img;
    ctx.drawImage(img, -sizeU / 2, -sizeU / 2, sizeU, sizeU);
    // status washes over the sprite itself rather than rings around it
    const ga = ctx.globalAlpha;
    for (const [col, a] of washesOf(u, w)) { ctx.globalAlpha = ga * a; ctx.drawImage(tinted(spr, col), -sizeU / 2, -sizeU / 2, sizeU, sizeU); }
  } else {
    inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, u.vr, 0, TAU); }, u.team === 'hero' ? '#5FA35A' : '#C8553D');
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  if (u.frozenT > 0) drawIce(ctx, u, w);
}

// Round 19 (lane sys19; the designer: "Thrown hammer looks different than held hammer", Warhelm "Throws a different
// hammer than what he holds"): a weapon of the hero's own that leaves the hand (thrown, flung, circling, lying where it
// fell) is drawn as the very part he holds it with: his art's weapon part (def.style.weaponPart, or a part named
// arm-l-hammer, arm-r-club, ...: the weapon as its own part, hidden in his hand while it is out, parts.js), at his own
// scale x k, centred on the weapon's middle (ctx's origin), turned by ctx. false when there is no such part or its
// picture isn't ready yet (the caller draws its own then).
const WEAPON_PART = /^arm-[lr]-(hammer|club|axe|sword|spear|blade|weapon)$/;
export function drawHeldWeapon(ctx, u, k = 1) {
  if (!u || !u.def || !u.def.art) return false;
  const sizeU = u.vr * 220 / (u.def.headR || headR(u.kind)), set = getRig(u.def.art, sizeU * view.scale * view.dpr * 1.04 * k, sizeU * k * bigOf(u));
  if (!set) return false;
  const want = u.def.style && u.def.style.weaponPart, L = set.layers.find((l) => (want ? l.id === want : WEAPON_PART.test(l.id)));
  if (!L) return false;
  const s = sizeU / 220 * k * bigOf(u);
  ctx.save(); ctx.scale(s, s); ctx.translate(-(L.x + L.w / 2), -(L.y + L.h / 2));
  if (OUTLINES) ctx.drawImage(L.ink, L.x, L.y, L.w, L.h); ctx.drawImage(L.img, L.x, L.y, L.w, L.h);
  ctx.restore();
  return true;
}

// Round 13 (lane E): what foe-draw.js drawFoe needs from here (a spirit's tail, a chain drawn as one body, a blade stuck in a wall).
const RH = { drawUnit, unitFrame: (ctx, u, w) => unitFrame(ctx, u, w), washesOf: (u, w) => washesOf(u, w) };
// Ask for every unit's art at its current size, so it's ready by the time the room fades in.
export function warmArt(w) {
  for (const u of w.units) if (u.def.art) { const sizeU = u.vr * 220 / (u.def.headR || headR(u.kind)); getRig(u.def.art, sizeU * view.scale * view.dpr * 1.04, sizeU * bigOf(u)); }
  // round 15 (lane E): and what the party's heroes can call up or put down (their summons are art now), so a totem's
  // rise out of the floor isn't missed while its picture renders
  for (const u of w.units) { const F = HEROES[u.kind] && HEROES[u.kind].forms; if (F) for (const a of F) getRig(a, u.vr * 220 / 56 * view.scale * view.dpr * 1.04, u.vr * 220 / 56); } // (a form he can take: the Warlock's demon)
  for (const u of w.units) { const S = HEROES[u.kind] && HEROES[u.kind].summons; if (S) for (const k in S) { const d = DEFS[k]; if (!d || !d.art) continue; const sz = d.vr * 220 / (d.headR || headR(k)), px = sz * view.scale * view.dpr * 1.04; getRig(d.art, px, sz); if (ART2[k] && ART2[k].arts) for (const a of ART2[k].arts) getRig(a, px, sz); } }
}

// A unit drawn from its SVG parts, arms moving with what it is doing (parts.js).
// Our summons keep the black outline and are hue-shifted towards blue-grey (round 8; round 7's purple outline is gone),
// so a raised skeleton or a called wolf reads as ours, not the enemy's.
const isOurs = (u) => !!(u.summon && u.team === 'hero' && !u.ethereal && !u.partOf); // (round 15, the Mob: its other bodies are the hero, not summons: no blue-grey shift)
function drawPartsUnit(ctx, u, w) {
  const X = ART2[u.kind]; // round 15 (lane E): what a summon's code drawing did that its picture doesn't (looks2.js, fx2.js)
  if (X && u.bornT == null) u.bornT = w.time; // (when it was first drawn, whether or not its picture is ready yet: the totem rises from then)
  const url = (X && X.art && X.art(u)) || u.def.art;
  const sizeU = u.vr * 220 / (u.def.headR || headR(u.kind)); // def.headR: the head's radius in the art's SVG units
  const set = getRig(url, sizeU * view.scale * view.dpr * 1.04, sizeU * bigOf(u)); // (round 19, lane outline19: sizeU, so the outline is OUTLINE whatever its size)
  if (set && X && X.under) X.under(ctx, u, w);
  const DV = u.act && u.act.dv ? u.act.dv : null; // round 18 (lane dash18): one of the six dashes (dashes.js)
  if (set && (DV || u._dvTrail || (u.dvStamps && u.dvStamps.length))) dashGhosts(ctx, u, w, set, sizeU, DV);
  ctx.save();
  unitFrame(ctx, u, w);
  if (!set) { ctx.restore(); return; } // still rendering (a fraction of a second): draw nothing rather than a placeholder
  const pose = u.downed ? LIMP : poseFor(u, w, w._dt ?? 1 / 60);
  if (X && X.pose && !u.downed) X.pose(u, w, pose);
  if (X && X.frame) X.frame(ctx, u, w);
  const k = sizeU / 220 * (1 + 0.05 * (pose.pop || 0));
  ctx.scale(k, k); if (u.def.style && u.def.style.flip) ctx.scale(-1, 1); ctx.translate(-100, -100); // lane H2 (round 13): style.flip mirrors the sprite (the Griffon)
  let alpha = 1;
  if (u.invulnT > 0 && !u.act && !u.spin) alpha = 0.55 + 0.45 * Math.abs(Math.sin(w.time * 18)); // no flicker mid-leap or roll (round 9)
  if (u.downed) alpha = 0.62; // a hero who is down lies faint too (round 7)
  if (u.ethereal && !u.exiting && !u.hiddenIn) alpha *= 0.5;
  else if (u.incorpT > 0) alpha *= u.incorpLook === 'mist' ? 0.55 : 0.78; // round 19 (lane rogue19): incorporeal (sim.js), see-through
  if (X && X.alpha) alpha *= X.alpha(u, w);
  if (DV && DV.body && DV.body.alpha) alpha *= DV.body.alpha;
  const struck = !u.downed && u.flashT > (u.def.flashAt ?? 0.06);
  // round 19 (lane melee19, "big white puffs hiding the hero on impact"): a body struck flashes a pale wash, its picture
  // still readable through it (it went solid white, a blob over whatever stood beside it) (lane B, bosses3: def.flashAt)
  const mode = u.downed ? 'grey' : 'normal';
  if (u.act && u.act.type === 'dash' && !u.act.dv && u.kind === 'twinfang') afterimages(ctx, u, w, set, pose, sizeU); // (round 18: her Dash is one of dashes.js's now: dashGhosts above)
  else u._trail = null;
  // (round 15, lane E: def.ownLook, a summon drawn in its own colours: the code drawings it replaces were never turned blue-grey)
  drawRig(ctx, set, pose, { mode, alpha, washes: HIT_OWN.wash ? HIT_OWN.wash(u, w, struck, washesOf) : struck ? [['#FFFFFF', 0.55 * Math.min(1, u.flashT / 0.12)]] : washesOf(u, w), /* (round 19, lane art-hitfx: ?hitfx=) */ shift: isOurs(u) && u.kind !== 'minion' && !u.def.ownLook, /* round 10: the raised dead stay plain grey */ border: mode === 'normal' ? (HIT_OWN.rim && HIT_OWN.rim(u, w, struck)) || borderOf(u, w) : null });
  if (pose.glow && mode === 'normal') castGlow(ctx, pose.glow, w.time);
  if (u.kind === 'archer' && mode === 'normal') nockedArrow(ctx, u, set, pose, sizeU);
  if (X && X.top && mode !== 'grey') X.top(ctx, u, w);
  ctx.restore();
  if (X && X.over) X.over(ctx, u, w);
}

// Round 18 (lane dash18): the copies of the body a dash leaves behind it (dashes.js), drawn in the room's own frame under
// the body: a trail of fading silhouettes while it travels (D.ghost: their colour), and the copies left standing where a
// blink set off or sliding on where a feint pretended to go (u.dvStamps).
function dashGhosts(ctx, u, w, set, sizeU, DV) {
  const T = w.time, flip = u.def.style && u.def.style.flip, sc = sizeU / 220 * bigOf(u);
  let kc = null, kcol = null; // (one silhouette painted per colour, drawn for every copy)
  const one = (x, y, f, a, col) => { if (a <= 0.02) return; if (col !== kcol) { kc = composeRig(set, u._pose || LIMP, 'sil', col); kcol = col; } const k = kc;
    ctx.save(); ctx.translate(x, y); ctx.rotate(f - Math.PI / 2); ctx.scale(sc, sc); if (flip) ctx.scale(-1, 1); ctx.translate(-100, -100); ctx.globalAlpha = a; drawComposed(ctx, k); ctx.restore(); };
  if (DV && DV.ghost) { const tr = u._dvTrail || (u._dvTrail = []);
    if (DV.lines && (!tr.length || T - tr[tr.length - 1].t > 0.022)) tr.push({ x: u.x, y: u.y, f: u.facing, t: T, col: DV.ghost });
  }
  const tr = u._dvTrail;
  if (tr) { while (tr.length && T - tr[0].t > 0.3) tr.shift(); if (!tr.length) u._dvTrail = null;
    for (const p of tr) { const age = (T - p.t) / 0.3; if (age < 0.06) continue; one(p.x, p.y, p.f, 0.72 * (1 - age), p.col); } }
  if (u.dvStamps) { u.dvStamps = u.dvStamps.filter((s) => T - s.t0 < s.life);
    for (const s of u.dvStamps) { const age = T - s.t0, q = age / s.life; one(s.x + s.vx * age * (1 - q * 0.5), s.y + s.vy * age * (1 - q * 0.5), s.f, s.a * (1 - q) * (1 - q), s.col); } }
}
// Twinfang's Dash (round 9): shadow copies of her left behind along the way, fading. Drawn from inside her own frame
// (SVG units), so each copy undoes her frame and sets up its own.
function afterimages(ctx, u, w, set, pose, sizeU) {
  const T = w.time, tr = u._trail || (u._trail = []);
  if (!tr.length || T - tr[tr.length - 1].t > 0.035) tr.push({ x: u.x, y: u.y, f: u.facing, t: T });
  while (tr.length && T - tr[0].t > 0.24) tr.shift();
  const k = composeRig(set, pose, 'sil', '#6E5E8E');
  const m = ctx.getTransform();
  for (const p of tr) { const age = (T - p.t) / 0.24; if (age < 0.12) continue;
    ctx.save(); ctx.setTransform(m); ctx.translate(100, 100); ctx.scale(220 / sizeU, 220 / sizeU); ctx.rotate(-(u.facing - Math.PI / 2)); ctx.translate(p.x - u.x, p.y - u.y);
    ctx.rotate(p.f - Math.PI / 2); ctx.scale(sizeU / 220, sizeU / 220); ctx.translate(-100, -100);
    ctx.globalAlpha = 0.55 * (1 - age); drawComposed(ctx, k); ctx.restore(); }
}
// The archer's arrow on the string while she draws (round 9: "I want to see what the arrow drawn to scale looks
// like"): the same size as the arrow that flies (44 room units), pointing forward (+y in the sprite's frame).
function nockedArrow(ctx, u, set, pose, sizeU) {
  if (!((!u.anim && (u._ready || 0) > 0.12) || u.aimT > 0)) return;
  const n = bowNock(set, pose); if (!n) return;
  const s = 220 / sizeU, L = 44 * s, x = n[0], y = n[1], wd = 2.4 * s, O = set.line || OUTLINE * s; // (O: the figure's own outline, round 19, lane outline19; it was 6 SVG units)
  const shaft = () => { ctx.beginPath(); ctx.moveTo(x, y - 2 * s); ctx.lineTo(x, y + L - 9 * s); };
  const head = () => { ctx.beginPath(); ctx.moveTo(x, y + L); ctx.lineTo(x - 4.5 * s, y + L - 10 * s); ctx.lineTo(x + 4.5 * s, y + L - 10 * s); ctx.closePath(); };
  const fl = () => { ctx.beginPath(); for (const sd of [-1, 1]) { ctx.moveTo(x, y + 7 * s); ctx.lineTo(x + sd * 4.5 * s, y - 1 * s); ctx.lineTo(x + sd * 3 * s, y + 9 * s); ctx.closePath(); } };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.fillStyle = INK;
  if (OUTLINES) { ctx.lineWidth = wd + O * 2; shaft(); ctx.stroke(); ctx.lineWidth = O * 2; head(); ctx.fill(); ctx.stroke(); fl(); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = u.aimCol || '#C99A6A'; ctx.lineWidth = wd; shaft(); ctx.stroke();
  ctx.fillStyle = u.aimHead || '#DCE0E6'; head(); ctx.fill(); ctx.fillStyle = '#F1E8DA'; fl(); ctx.fill();
  ctx.restore();
}

// The light a caster gathers in front of its hands (sprite frame, SVG units).
function castGlow(ctx, gl, t) {
  const a = clamp(gl.a, 0, 1), r = 18 + 22 * a;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(100, 182, 0, 100, 182, r);
  g.addColorStop(0, hexA(gl.color, 0.85 * a)); g.addColorStop(0.45, hexA(gl.color, 0.35 * a)); g.addColorStop(1, hexA(gl.color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(100, 182, r, 0, TAU); ctx.fill();
  ctx.fillStyle = hexA('#FFFFFF', 0.8 * a);
  for (let i = 0; i < 3; i++) { const b = t * 5 + i * 2.1; ctx.beginPath(); ctx.arc(100 + Math.cos(b) * r * 0.55, 182 + Math.sin(b) * r * 0.45, 2.6 * a + 0.5, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// A tail as a short chain of points that trails the body on springs, so it whips round on turns.
function drawTail(ctx, u, dt) {
  const back = u.facing + Math.PI, seg = u.vr * 0.42, n = 4;
  const ax = u.x + Math.cos(back) * u.vr * 0.85, ay = u.y + Math.sin(back) * u.vr * 0.85;
  if (!u.tail) { u.tail = []; for (let i = 1; i <= n; i++) u.tail.push({ x: ax + Math.cos(back) * seg * i, y: ay + Math.sin(back) * seg * i, vx: 0, vy: 0 }); }
  let px = ax, py = ay, pa = back;
  for (let i = 0; i < n; i++) {
    const p = u.tail[i];
    // where this point would rest: one segment straight back from the one before it
    const rx = px + Math.cos(pa) * seg, ry = py + Math.sin(pa) * seg;
    p.vx += (rx - p.x) * 60 * dt; p.vy += (ry - p.y) * 60 * dt;
    const damp = Math.exp(-dt * 9); p.vx *= damp; p.vy *= damp;
    p.x += p.vx * dt; p.y += p.vy * dt;
    // keep the segment length
    const dx = p.x - px, dy = p.y - py, L = Math.hypot(dx, dy) || 1;
    p.x = px + dx / L * seg; p.y = py + dy / L * seg;
    pa = Math.atan2(p.y - py, p.x - px); px = p.x; py = p.y;
  }
  const path = () => { ctx.beginPath(); ctx.moveTo(ax, ay); for (const p of u.tail) ctx.lineTo(p.x, p.y); };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (OUTLINES) { ctx.strokeStyle = INK; ctx.lineWidth = 2.2 + OUTLINE * 2; path(); ctx.stroke(); }
  ctx.strokeStyle = '#D8A39A'; ctx.lineWidth = 2.2; path(); ctx.stroke();
  ctx.restore();
}

function drawIce(ctx, u, w) {
  // a block of ice around the unit, seen from above: an outlined, see-through crystal
  const r = u.vr * 1.35;
  ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(u.id);
  const path = () => { ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, rr = r * (i % 2 ? 0.92 : 1.05); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); };
  if (OUTLINES) { ctx.globalAlpha = 0.85; ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round'; path(); ctx.stroke(); }
  ctx.globalAlpha = 0.45; ctx.fillStyle = '#CFF3FF'; path(); ctx.fill();
  ctx.globalAlpha = 0.7; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.2, -r * 0.65); ctx.lineTo(-r * 0.05, -r * 0.5); ctx.lineTo(-r * 0.45, -r * 0.05); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// A body thrown by the killing blow (sim.js corpses): white for an instant, then limp, spinning while in the air
// (lifted: drawn a little bigger, its shadow left on the floor, render's shadow layer). Dead things lie faint (round
// 7): from just before it lands the body greys and fades to DEAD_A, and over its last seconds it goes altogether.
// A body lies in one pose, so its look is composed once per art and size and then drawn as one image.
const DEAD_A = 0.42, DEAD_WASH = 'rgba(96,90,106,0.6)';
function bodyLook(set, dead) {
  const key = (dead ? '_deadLook' : '_bodyLook') + (OUTLINES ? '' : '0'); // (lane toggles19: composed with or without its ink)
  if (set[key]) return set[key];
  const k = composeRig(set, LIMP, 'normal');
  const c = document.createElement('canvas'); c.width = c.height = k.sx;
  const g = c.getContext('2d'); g.drawImage(k.c, 0, 0, k.sx, k.sx, 0, 0, k.sx, k.sx);
  if (dead) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = DEAD_WASH; g.fillRect(0, 0, k.sx, k.sx); }
  return (set[key] = { c, sx: k.sx, x: k.x, s: k.s });
}
function drawCorpse(ctx, c) {
  const kind = SPRITE_KIND[c.kind] || c.kind, def = DEFS[c.kind], art = def && def.art;
  const sizeU = c.vr * 220 / ((art && def.headR) || headR(kind));
  const lift = 1 + Math.min(0.35, (c.z || 0) / 160);
  const fade = clamp(c.t / 4, 0, 1);
  const m = c.z > 2 ? 0 : clamp(((c.age ?? 1) - 0.25) / 0.6, 0, 1); // 0 flying, 1 lying dead
  const flash = !HIT_OWN.death && (c.age ?? 1) < 0.07; // (round 19, lane art-hitfx: ?hitfx= deaths draw no white flash)
  const live = fade * (1 - m), dead = fade * m * DEAD_A; // the two looks cross-fade
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.facing - Math.PI / 2); ctx.scale(lift, lift);
  if (art) {
    const set = getRig(art, sizeU * view.scale * view.dpr, sizeU); if (set) {
      ctx.scale(sizeU / 220, sizeU / 220); ctx.translate(-100, -100);
      if (flash) drawRig(ctx, set, LIMP, { mode: 'flash' });
      else {
        const ga = ctx.globalAlpha;
        if (live > 0.01) { ctx.globalAlpha = ga * live; drawComposed(ctx, bodyLook(set, false)); }
        if (dead > 0.01) { ctx.globalAlpha = ga * dead; drawComposed(ctx, bodyLook(set, true)); }
        ctx.globalAlpha = ga;
      }
    }
    ctx.restore(); return;
  }
  const spr = getSprite(kind, sizeU * view.scale * view.dpr, sizeU);
  if (spr) {
    if (flash) ctx.drawImage(spr.flash, -sizeU / 2, -sizeU / 2, sizeU, sizeU);
    else {
      if (live > 0.01) { ctx.globalAlpha = live; ctx.drawImage(spr.img, -sizeU / 2, -sizeU / 2, sizeU, sizeU); }
      if (dead > 0.01) { ctx.globalAlpha = dead; ctx.drawImage(tinted(spr, DEAD_WASH), -sizeU / 2, -sizeU / 2, sizeU, sizeU); }
    }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

// Bars, marks and status meters, upright above or below each unit.
const STATUS = [['burn', '#FF7A2F'], ['chill', '#7FD6F5'], ['poison', '#9BCB3C']];
const SHOW_BARS = false; // health and status bars live in the HUD now (designer, round 2)
function drawOverlay(ctx, u, dt = 0) {
  if (u.downed || (u.linkTo && u.def.segment) || (u.partOf && u.partOf.bodies)) return; // (round 13, lane E: a chain's links carry no bar: its health is its head's; round 15, the Mob: one bar, on its lead)
  upright(ctx, u.x, u.y, () => {
    if (u.team === 'enemy' || w_battle || u.barAlways) drawEnemyHp(ctx, u, dt); // hpstyle.js: only once it's hurt, in the player's chosen style
    if (u.team !== 'hero' && u.act && (u.act.type === 'windup' || u.act.type === 'slam')) {
      const k = 1 - u.act.t / u.act.max;
      // a warning mark drawn as a shape (no text in the arena): a bar and a dot over the head. Only on the enemy's
      // side: a raised skeleton of ours winds up the same way, but the red mark read as a threat (round 7)
      const s = 1 + 0.35 * k, y0 = -u.vr - (u.hp < u.maxHp ? 34 : 14); // over the health bar (round 9: it sits over the head now)
      inked(ctx, () => { ctx.beginPath(); roundRect(ctx, -2.6 * s, y0 - 15 * s, 5.2 * s, 10.5 * s, 2.4 * s); ctx.moveTo(2.8 * s, y0); ctx.arc(0, y0, 2.8 * s, 0, TAU); }, '#FF6B5A');
    }
    if (u.hasKey) inked(ctx, () => { ctx.beginPath(); ctx.arc(u.vr * 0.8, -u.vr * 0.8, 4.5, 0, TAU); }, '#FFD45A');
    let by = u.vr + 8;
    if (SHOW_BARS && (u.team === 'hero' || u.hp < u.maxHp)) {
      const bw = Math.max(26, u.vr * 1.8);
      inked(ctx, () => roundRect(ctx, -bw / 2, by, bw, 3.5, 1.75), '#3A2F3E');
      ctx.fillStyle = u.team === 'hero' ? '#7CC06F' : '#E0604B'; roundRect(ctx, -bw / 2, by, bw * clamp(u.hp / u.maxHp, 0, 1), 3.5, 1.75); ctx.fill();
      by += 3.5 + OUTLINE * 2 + 1;
    }
    // status build-up: a short meter per status, filling to the threshold
    const list = SHOW_BARS ? STATUS.filter(([k]) => u.st[k] >= 3) : [];
    if (list.length) {
      const pw = 14, gap = 4, tot = list.length * pw + (list.length - 1) * gap;
      list.forEach(([k, col], i) => {
        const x = -tot / 2 + i * (pw + gap), max = k === 'chill' ? 100 + u.freezeImmune : 100, f = clamp(u.st[k] / max, 0, 1);
        inked(ctx, () => roundRect(ctx, x, by, pw, 3, 1.5), '#3A2F3E');
        ctx.fillStyle = col; roundRect(ctx, x, by, pw * f, 3, 1.5); ctx.fill();
      });
    }
  });
}

function drawParticle(ctx, p) {
  const k = clamp(p.life / p.max, 0, 1);
  if (p.shape === 'flame') {
    const [ux, uy] = upVec();
    upright(ctx, p.x + ux * (p.up || 0), p.y + uy * (p.up || 0), () => flameShape(ctx, 0, 0, p.size * (0.35 + 0.65 * k), k > 0.5 ? '#FF8A3D' : '#E8582A', '#FFE08A'));
  } else if (p.shape === 'plus') { // a healing cross, inked, rising (round 10)
    const [ux, uy] = upVec(), s = p.size * (0.6 + 0.4 * Math.min(1, (1 - k) * 5)), t = s * 0.36;
    ctx.save(); ctx.globalAlpha = Math.min(1, k * 2.2); ctx.translate(p.x + ux * (p.up || 0), p.y + uy * (p.up || 0));
    const cross = () => { ctx.beginPath(); ctx.rect(-s, -t, s * 2, t * 2); ctx.rect(-t, -s, t * 2, s * 2); };
    if (OUTLINES) { ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round'; cross(); ctx.stroke(); }
    ctx.fillStyle = p.color; cross(); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
  } else if (p.shape === 'heart') { // round 13: a little inked heart rising (charm)
    const [ux, uy] = upVec(), s = p.size * (0.7 + 0.3 * Math.min(1, (1 - k) * 5));
    upright(ctx, p.x + ux * (p.up || 0), p.y + uy * (p.up || 0), () => { ctx.globalAlpha = Math.min(1, k * 2.2); heartPath(ctx, s);
      if (OUTLINES) { ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 2; ctx.lineJoin = 'round'; ctx.stroke(); } ctx.fillStyle = p.color; ctx.fill(); });
    ctx.globalAlpha = 1;
  } else if (p.shape === 'drip') { // round 13: a drop of blood falling off the body (bleeding)
    const [ux, uy] = upVec();
    upright(ctx, p.x + ux * (p.up || 0), p.y + uy * (p.up || 0), () => { ctx.globalAlpha = Math.min(1, k * 2);
      const s = p.size; ctx.beginPath(); ctx.moveTo(0, -s * 1.5); ctx.quadraticCurveTo(s, 0, s * 0.9, s * 0.5); ctx.arc(0, s * 0.5, s * 0.9, 0, Math.PI); ctx.quadraticCurveTo(-s, 0, 0, -s * 1.5); ctx.closePath();
      if (OUTLINES) { ctx.strokeStyle = INK; ctx.lineWidth = OUTLINE * 1.6; ctx.lineJoin = 'round'; ctx.stroke(); } ctx.fillStyle = p.color; ctx.fill(); });
    ctx.globalAlpha = 1;
  } else if (p.shape === 'spark') {
    const a = Math.atan2(p.vy, p.vx), len = 6 + 10 * k;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.lineCap = 'round'; if (OUTLINES) { ctx.strokeStyle = INK; ctx.lineWidth = p.size + OUTLINE * 2; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke(); }
    ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.restore(); ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = k; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * k), 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
}

function drawRing(ctx, t) {
  const k = 1 - t.t / t.max;
  ctx.save(); ctx.globalAlpha = 0.25 + 0.3 * k; ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * k, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.8; ctx.strokeStyle = t.color; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, TAU); ctx.stroke(); ctx.restore();
}
function drawText(ctx, t) {
  const a = clamp(t.life / t.max * 1.6, 0, 1);
  const age = t.max - t.life;
  const pop = t.pop ? 1 + 0.6 * Math.max(0, 1 - age / 0.12) : 1;   // damage numbers land big, then settle
  const [ux, uy] = upVec();
  upright(ctx, t.x + ux * (t.up || 0), t.y + uy * (t.up || 0), () => {
    ctx.globalAlpha = a;
    ctx.font = `800 ${Math.round(15 * (t.size || 1) * pop)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.lineWidth = OUTLINE * 2; ctx.strokeStyle = INK; ctx.strokeText(t.s, 0, 0);
    ctx.fillStyle = t.color; ctx.fillText(t.s, 0, 0);
  });
  ctx.globalAlpha = 1;
}
