// Round 19 (lane art-hitfx): trial looks for the general combat effects, only with ?hitfx= in the address. Nothing here
// runs otherwise: the live looks stay as they are (fx.js drawLocal's white star, render.js's pale wash, fxkit.js blast).
// The designer: "Make a bunch of art ... effects ... go crazy", after "weird star on target hit. Don't know why", "white
// star blocks most of its unique hit effect", "big white puffs hiding the hero", "better visual effects".
//
// The switch:  ?hitfx=N        every effect below in its option N (1, 2 or 3; 0 = that effect as it is live)
//              ?hitfx_<key>=N  one effect's option (?hitfx=0&hitfx_death=2: only the deaths change)
//              ?hitfx=mark:2,death:3   the same, in one parameter
// Keys and options (docs: the deck tools/riffle/decks/r19-art-hitfx.json; clips design/r19-art/hitfx/):
//   mark    the hit mark by the blow's damage type (tags.js hitType: sharp | blunt | magic, magic in its element)
//           1 Marks (a cut, impact lines and dust, an element pop)  2 Edge (the struck edge of the body lights up)
//           3 Spray (bits thrown back off the blow)
//   struck  the body's own reaction   1 Rim (a bright rim round its outline, no wash)  2 Tint (a short wash in the
//           blow's colour)  3 Jolt (a harder shove and shake, a red flinch)
//   crit    1 Burst (a gold comic burst beside it)  2 Rays (gold rays out from its edge)  3 Shards (gold shards and a ring)
//   block   a blow on a shield  1 Clang (the face rings, sparks)  2 Ward (a shield of light pops on its face)
//           3 Deflect (the blow glances off)
//   miss    a dodge or a miss (sim.js says 'dodge' / 'miss'; the words are not drawn)  1 Swoosh (the blow sweeps past)
//           2 Sidestep (speed lines and a dust kick)  3 Air (a puff where the blow fell on nothing)
//   blast   sim.js explode  1 Cloud (a ring of puffs, smoke rising)  2 Burst (a layered cartoon starburst, debris)
//           3 Shock (a shock ring on the floor, sparks to the edge)
//   heal    health coming back  1 Lift (light climbing the body)  2 Swirl (motes winding up round it)  3 Glow (a green
//           wash and one big cross)
//   buff    a helpful buff landing  1 Chevrons  2 Glints (four glints dropping in)  3 Spiral (a ribbon of light)
//   death   by family (tags.js: undead -> bone, slime, beast, construct, spirit; the rest as beasts in dust)
//           1 Bits (its own bits flung)  2 Poof (a cloud in its own colours)  3 Soul (something rising off it)
//   coin    a coin picked up  1 Flip  2 Hop (over the head)  3 Ring
//   xp      a kill's xp going to the party  1 Motes (to each hero)  2 Orb (one orb, splitting)  3 Rise (up and away)
//   level   a level-up  1 Pillar (a column of gold light)  2 Burst (rays and confetti)  3 Crest (a gold arrow over the head)
// The rules kept (docs/FX-STYLE.md): solid things inked with the one OUTLINE, light additive and never outlined, ground
// marks soft-edged with no outline, nothing over the middle of a body for longer than a blink, hashed noise, no blur,
// gradients only on the few glows. sim.js fills u.hitTy / hitEl / hitCrit / hitShot / hitBig / hitSide while w.ownHits
// (set here) and leaves its own spark and puff particles out (the dice still roll the same).
import { TAU, clamp, INK } from './util.js';
import { inked, inkLine, glowDisc, star, hash, easeOut, upright, upVec, flame, leaf } from './fx.js';
import { EL, HIT_OWN } from './fxkit.js';
import { hasTag } from './tags.js';
import { view } from './render.js';

export const HITFX_KEYS = ['mark', 'struck', 'crit', 'block', 'miss', 'blast', 'heal', 'buff', 'death', 'coin', 'xp', 'level'];
export const HITFX = {};
const Q = typeof location !== 'undefined' && location.search ? new URLSearchParams(location.search) : null;
const RAW = Q ? Q.get('hitfx') : null;
if (RAW != null) {
  const base = /^\d$/.test(RAW) ? +RAW : 1;
  for (const k of HITFX_KEYS) HITFX[k] = base;
  for (const part of RAW.split(',')) { const m = part.match(/^([a-z]+):(\d)$/); if (m && HITFX_KEYS.includes(m[1])) HITFX[m[1]] = +m[2]; }
  for (const k of HITFX_KEYS) { const v = Q.get('hitfx_' + k); if (v != null && /^\d$/.test(v)) HITFX[k] = +v; }
}
const ON = RAW != null;
const O = HITFX;

// ---------------------------------------------------------------- small tools
const k01 = (v) => clamp(v, 0, 1);
const sm = (k) => k * k * (3 - 2 * k);
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const inkDisc = (ctx, x, y, r, col) => inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); }, col);
const alive = (u) => u && !u.dead && !u.downed && u.hp > 0;
// a pointed streak from (x,y) along a: base at r0, tip at r1, wd wide near the tip (as fxkit.js streak)
function streakPath(ctx, x, y, a, r0, r1, wd) {
  const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c, L = r1 - r0;
  const bx = x + c * r0, by = y + s * r0, tx = x + c * r1, ty = y + s * r1, mx = x + c * (r0 + L * 0.6), my = y + s * (r0 + L * 0.6);
  ctx.beginPath(); ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(mx + nx * wd * 1.25, my + ny * wd * 1.25, tx, ty);
  ctx.quadraticCurveTo(mx - nx * wd * 1.25, my - ny * wd * 1.25, bx, by); ctx.closePath();
}
function streak(ctx, x, y, a, r0, r1, wd, main, core) {
  if (r1 - r0 < 1 || wd < 0.4) return;
  inked(ctx, () => streakPath(ctx, x, y, a, r0, r1, wd), main);
  if (core) { ctx.fillStyle = core; streakPath(ctx, x, y, a, r0 + (r1 - r0) * 0.3, r1 - 1, wd * 0.38); ctx.fill(); }
}
// a wedge: fat at r0, pointed at r1 (a comic impact line)
function wedgePath(ctx, x, y, a, r0, r1, wd) {
  const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c;
  ctx.beginPath(); ctx.moveTo(x + c * r0 + nx * wd / 2, y + s * r0 + ny * wd / 2); ctx.lineTo(x + c * r1, y + s * r1); ctx.lineTo(x + c * r0 - nx * wd / 2, y + s * r0 - ny * wd / 2);
  ctx.arc(x + c * r0, y + s * r0, wd / 2, a + Math.PI / 2, a - Math.PI / 2); ctx.closePath();
}
// a crescent hugging a circle: radius R, from a0 to a1, thickest (th) in the middle, both ends pointed
function arcBandPath(ctx, cx, cy, R, a0, a1, th) {
  const n = 16; ctx.beginPath();
  for (let i = 0; i <= n; i++) { const q = i / n, a = a0 + (a1 - a0) * q, r = R + th / 2 * Math.sin(Math.PI * q); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  for (let i = n; i >= 0; i--) { const q = i / n, a = a0 + (a1 - a0) * q, r = R - th / 2 * Math.sin(Math.PI * q); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  ctx.closePath();
}
function arcBand(ctx, cx, cy, R, a0, a1, th, main, core) {
  if (th < 0.6 || Math.abs(a1 - a0) < 0.03) return;
  inked(ctx, () => arcBandPath(ctx, cx, cy, R, a0, a1, th), main);
  if (core) { ctx.fillStyle = core; const m = (a1 - a0) * 0.2; arcBandPath(ctx, cx, cy, R, a0 + m, a1 - m, th * 0.38); ctx.fill(); }
}
// fan angles that go out the SIDES of the struck body (in melee the attacker stands on the near side: nothing drawn over it)
const side = (a, i, n, lo = 1.0, hi = 2.0, seed = 0) => { const s = i % 2 ? 1 : -1, j = Math.floor(i / 2), m = Math.max(1, Math.ceil(n / 2) - 1); return a + s * (lo + (hi - lo) * (j / m) + (hash(seed, i) - 0.5) * 0.25); };
const glint = (ctx, x, y, s, rot, col) => inked(ctx, () => star(ctx, x, y, s, 4, 0.3, rot), col);
// a jagged burst (a comic "pow"): n points, radii jittered by the seed
function burstPath(ctx, x, y, R, n, seed, inner = 0.55, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU, rr = (i % 2 ? R * inner : R) * (0.85 + 0.3 * hash(seed, i)); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath();
}
function cloudPuff(ctx, x, y, r, col, seed) { // a lumpy round puff (three bumps)
  inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = seed + i * 2.1; ctx.moveTo(x + Math.cos(a) * r * 0.45 + r * 0.62, y + Math.sin(a) * r * 0.45); ctx.arc(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.62, 0, TAU); } }, col);
}
function boneShape(ctx, L, wd) { // a little bone along x, centred
  const h = L / 2, k = wd * 0.95;
  ctx.beginPath(); ctx.rect(-h + k * 0.6, -wd / 2, L - k * 1.2, wd);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.moveTo(sx * (h - k * 0.55) + k * 0.55, sy * wd * 0.42); ctx.arc(sx * (h - k * 0.55), sy * wd * 0.42, k * 0.55, 0, TAU); }
}
function skull(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  inked(ctx, () => { ctx.beginPath(); ctx.arc(0, -s * 0.15, s, 0, TAU); ctx.rect(-s * 0.55, s * 0.4, s * 1.1, s * 0.6); }, '#EDE4CD');
  ctx.fillStyle = INK; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * s * 0.38, -s * 0.1, s * 0.26, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function cog(ctx, x, y, s, rot, col = '#8A94A6') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 4 < 2 ? s : s * 0.74; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }, col);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, TAU); ctx.fill();
  ctx.restore();
}
function tuft(ctx, x, y, s, rot, col) { // a little curl of fur: three pointed strands
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, s * 0.3); ctx.quadraticCurveTo(-s * 0.4, -s * 0.9, s * 0.2, -s * 1.1); ctx.quadraticCurveTo(0, -s * 0.4, s * 0.5, -s * 0.6); ctx.quadraticCurveTo(s * 0.4, 0, s * 1.05, -s * 0.05); ctx.quadraticCurveTo(s * 0.4, s * 0.6, -s, s * 0.3); ctx.closePath(); }, col);
  ctx.restore();
}
function drop(ctx, x, y, s, rot, col) { // a teardrop pointing along rot
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s * 1.6, 0); ctx.quadraticCurveTo(s * 0.4, -s * 0.95, -s * 0.2, -s * 0.8); ctx.arc(-s * 0.2, 0, s * 0.8, -Math.PI / 2, Math.PI / 2, true); ctx.quadraticCurveTo(s * 0.4, s * 0.95, s * 1.6, 0); ctx.closePath(); }, col);
  ctx.restore();
}
function chevron(ctx, x, y, s, col) { // an upward chevron, upright on screen
  upright(ctx, x, y, () => inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, s * 0.35); ctx.lineTo(0, -s * 0.65); ctx.lineTo(s, s * 0.35); ctx.lineTo(s * 0.62, s * 0.72); ctx.lineTo(0, 0); ctx.lineTo(-s * 0.62, s * 0.72); ctx.closePath(); }, col));
}
function cross(ctx, x, y, s, col) { // the healing cross, upright
  upright(ctx, x, y, () => { const t = s * 0.36; inked(ctx, () => { ctx.beginPath(); ctx.rect(-s, -t, s * 2, t * 2); ctx.rect(-t, -s, t * 2, s * 2); }, col); });
}
const U = () => upVec(); // up the screen
const upP = (x, y, h) => { const [ux, uy] = upVec(); return [x + ux * h, y + uy * h]; };

// The element looks: dark, main, light, core (FX-STYLE.md), keyed by tags.js's element names.
const ARCANE = ['#5A3E9A', '#B58CFF', '#E2D0FF', '#F6EEFF'];
const ELC = { fire: EL.fire, water: EL.water, frost: EL.frost, shock: EL.storm, poison: EL.poison, holy: EL.holy, curse: EL.necro, nature: EL.nature, arcane: ARCANE };
// the blow's own colours: a party's steel or a foe's warm edge (as their weapon arcs), blunt a paler cream, magic its element
const STEEL = ['#8A94A6', '#DCE3EC', '#FFFFFF'], WARM = ['#C07A68', '#FFCDBD', '#FFF6F2'], CREAM = ['#A99C8B', '#F3E9D2', '#FFFBEF'];
function colsOf(f) {
  if (f.ty === 'magic') return ELC[f.el] || ARCANE;
  if (f.ty === 'blunt') return CREAM;
  return f.side === 'hero' ? STEEL : WARM;
}
// one small bit of an element (a flame lick, an ice chip, a bubble...): s about its radius
function motif(ctx, el, x, y, s, rot) {
  const C = ELC[el] || ARCANE;
  switch (el) {
    case 'fire': upright(ctx, x, y, () => flame(ctx, 0, 0, s, C[1], C[2])); return;
    case 'frost': ctx.save(); ctx.translate(x, y); ctx.rotate(rot); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s * 1.4, 0); ctx.lineTo(0, -s * 0.55); ctx.lineTo(-s * 0.9, 0); ctx.lineTo(0, s * 0.55); ctx.closePath(); }, C[2]); ctx.restore(); return;
    case 'shock': inkLine(ctx, () => { ctx.beginPath(); const c = Math.cos(rot), d = Math.sin(rot); ctx.moveTo(x - c * s, y - d * s); ctx.lineTo(x - d * s * 0.5, y + c * s * 0.5); ctx.lineTo(x + d * s * 0.5, y - c * s * 0.5); ctx.lineTo(x + c * s, y + d * s); }, C[1], 2.6); return;
    case 'poison': inkDisc(ctx, x, y, s * 0.85, C[2]); ctx.fillStyle = C[3]; ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.3, s * 0.28, 0, TAU); ctx.fill(); return;
    case 'holy': glint(ctx, x, y, s * 1.25, rot * 0.2, C[2]); return;
    case 'curse': drop(ctx, x, y, s * 0.8, rot, C[1]); return;
    case 'nature': leaf(ctx, x, y, rot, s); return;
    case 'water': drop(ctx, x, y, s * 0.75, rot, C[2]); return;
    default: ctx.save(); ctx.translate(x, y); ctx.rotate(rot + Math.PI / 4); inked(ctx, () => { ctx.beginPath(); ctx.rect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2); }, C[2]); ctx.restore();
  }
}

// ---------------------------------------------------------------- what happened this frame (fx.js noteHits calls it first)
const fxl = []; // { type, t, max, ... }
const add = (type, f, max) => { f.type = type; f.t = 0; f.max = max; fxl.push(f); if (fxl.length > 240) fxl.splice(0, fxl.length - 240); return f; };
const seenT = new WeakSet(), seenB = new WeakSet();
const isDebuff = (b) => !!(b.blind || (b.dealt && b.dealt < 1) || (b.taken && b.taken > 1) || (b.move && b.move < 1 && !b.atkSpeed && !b.taken) || (b.atkSpeed && b.atkSpeed < 1));
const isBuff = (b) => !isDebuff(b) && (b.dur == null || b.dur >= 0.8) && !!((b.move && b.move > 1) || (b.atkSpeed && b.atkSpeed > 1) || (b.dealt && b.dealt > 1) || (b.taken && b.taken < 1) || b.glow || b.border || b.statusImmune || b.lifesteal || b.knockImmune);
const buffCol = (b) => b.border || (typeof b.glow === 'string' && b.glow !== '#FFFFFF' ? b.glow : null) || ((b.move > 1 || b.atkSpeed > 1) && !b.dealt ? '#9FE3FF' : b.dealt > 1 ? '#FF8A6A' : b.taken < 1 ? '#FFE7A0' : '#FFE7A0');
export function familyOf(u) {
  if (hasTag(u, 'spirit')) return 'spirit';
  if (hasTag(u, 'undead')) return 'bone';
  if (hasTag(u, 'slime')) return 'slime';
  if (hasTag(u, 'construct')) return 'construct';
  if (hasTag(u, 'beast')) return 'beast';
  return 'folk';
}
function famCols(u, fam) {
  switch (fam) {
    case 'bone': return ['#A99C8B', '#EDE4CD', '#FFF8EA'];
    case 'slime': { const g = u.def.goo || (u.kind === 'fireSlime' ? '#FF8A3D' : /poison/i.test(u.kind) ? '#7DB83A' : '#6FA6E6'); return [g, g, '#FFFFFF']; }
    case 'construct': return ['#4E5564', '#8A94A6', '#DEAF59'];
    case 'spirit': return /fire/i.test(u.kind) ? EL.fire : /poison|wisp/i.test(u.kind) ? ['#5FA040', '#B8F07A', '#E8FFD0'] : ['#5FB8E8', '#9FE4FF', '#E6F8FF'];
    case 'beast': return /rat|mouse/i.test(u.kind) ? ['#6E5A4E', '#9C8676', '#C9B6A4'] : /wolf|hound/i.test(u.kind) ? ['#5E6470', '#8A8F99', '#C9CED6'] : /spider|scarab|crab/i.test(u.kind) ? ['#3E3348', '#6A5A78', '#A898B8'] : ['#6A5038', '#9A7A58', '#CDB08C'];
    default: return ['#7A6A58', '#A99C8B', '#E9DDC2'];
  }
}
let lastW = null;
function note(w) {
  w.ownHits = true; // sim.js: fill the blow's kind, leave its sparks and puffs to us
  const fresh = lastW !== w; lastW = w;
  for (const u of w.units) {
    if (!fresh && u.hitT > (u._hfSeen || 0) + 0.02 && !u.downed && !u.hitZap) {
      const r = u.r * 0.85, x = u.hitX ?? u.x - Math.cos(u.hitA) * r, y = u.hitY ?? u.y - Math.sin(u.hitA) * r, ty = u.hitTy || 'sharp';
      const el = ty === 'magic' ? ((u.hitEl || []).find((e) => ELC[e]) || 'arcane') : null;
      const h = { u, x, y, ox: x - u.x, oy: y - u.y, a: u.hitA, ty, el, big: !!u.hitBig, crit: !!u.hitCrit, block: !!u.hitBlock, omni: !!u.hitOmni, shot: !!u.hitShot, side: u.hitSide, seed: (u.id * 31 + Math.round(w.time * 60)) | 0 };
      u._hfTy = ty; u._hfEl = el; u._hfSide = u.hitSide;
      if (h.block && O.block) add('block', h, 0.34);
      else if (O.mark) add('mark', h, h.ty === 'magic' ? 0.36 : 0.3);
      if (h.crit && O.crit) add('crit', { ...h }, 0.36);
    }
    u._hfSeen = u.hitT;
  }
  // a dodge or a miss: sim.js leaves a word on the unit (not drawn)
  for (const t of w.texts) if (!seenT.has(t)) {
    seenT.add(t);
    if (fresh || !O.miss || (t.s !== 'dodge' && t.s !== 'miss')) continue;
    let u = null, ud = 4; for (const o of w.units) { const d = Math.hypot(o.x - t.x, o.y - t.y); if (d < ud) { ud = d; u = o; } }
    if (!u) continue;
    let foe = null, fd = 1e9; for (const o of w.units) if (o.team !== u.team && alive(o) && o.team !== 'neutral') { const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < fd) { fd = d; foe = o; } }
    const a = foe ? Math.atan2(u.y - foe.y, u.x - foe.x) : u.facing + Math.PI;
    const sd = hash(u.id, Math.round(w.time * 10)) < 0.5 ? -1 : 1;
    add('miss', { u, x: u.x, y: u.y, r: u.vr || u.r, a, side: sd, seed: u.id + Math.round(w.time * 60) }, 0.42);
    u._hfDodgeT = w.time; u._hfDodgeA = a + sd * Math.PI / 2; u._hfDodgeS = sd; // the body leans aside out of the blow's line (render.js frame hook)
  }
  // deaths (as fx.js does: in the list last frame, gone now with no health left)
  const here = new Set(); for (const u of w.units) if (!u.ethereal) here.add(u);
  if (w._hfHere && !fresh) for (const u of w._hfHere) if (!here.has(u) && u.hp <= 0) {
    const fam = familyOf(u), big = !!u.def.boss;
    if (O.death) add('death', { x: u.x, y: u.y, r: Math.max(14, u.vr), fam, col: famCols(u, fam), seed: u.id, a: Math.atan2(u.ky || 0, u.kx || 0.0001), kick: Math.hypot(u.kx || 0, u.ky || 0) > 30, big }, big ? 1.1 : fam === 'spirit' ? 1 : 0.85);
    if (O.xp && u.team === 'enemy' && !u.summon && !w.battle) { const hs = w.units.filter((o) => o.team === 'hero' && alive(o) && !o.summon && !o.def.cargo); if (hs.length) add('xp', { x: u.x, y: u.y, hs, seed: u.id }, 0.95); }
  }
  w._hfHere = here;
  // coins that vanished while still fresh were picked up (as fx.js), by whoever stood nearest
  const now = new Set(); for (const p of w.pickups) if (p.type === 'coin') now.add(p);
  if (w._hfCoins && O.coin) for (const p of w._hfCoins) if (!now.has(p) && (p.life == null || p.life > 0.05)) {
    let h = null, hd = 1e9; for (const o of w.units) if (o.team === 'hero' && alive(o)) { const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < hd) { hd = d; h = o; } }
    add('coin', { x: p.x, y: p.y, u: h, seed: (p.x * 7 + p.y) | 0 }, 0.5);
  }
  w._hfCoins = now;
  // health coming back, buffs landing
  for (const u of w.units) {
    const hp0 = u._hfHp; u._hfHp = u.hp; const wasDown = u._hfDown; u._hfDown = u.downed;
    if (O.heal && !fresh && hp0 != null && !wasDown && !u.downed && u.hp > hp0 + 0.01 && u.maxHp) {
      const d = u.hp - hp0, big = d >= Math.max(8, u.maxHp * 0.08);
      if (w.time - (u._hfHealAt || -9) > 2) u._hfAcc = 0;
      u._hfAcc = (u._hfAcc || 0) + d; u._hfHealAt = w.time;
      if (big || u._hfAcc >= u.maxHp * 0.12) { add('heal', { u, x: u.x, y: u.y, big, seed: u.id + Math.round(w.time * 60) }, big ? 0.9 : 0.7); u._hfAcc = 0; u._hfGlowT = w.time; u._hfGlowBig = big; }
    }
    if (u.buffs) for (const b of u.buffs) if (!seenB.has(b)) {
      seenB.add(b);
      if (!fresh && O.buff && isBuff(b) && !u.downed && !b.hf) { const col = buffCol(b); add('buff', { u, x: u.x, y: u.y, col, seed: u.id + Math.round(w.time * 60) }, 0.75); u._hfBuffT = w.time; u._hfBuffCol = col; }
    }
  }
  // level-ups (the run's heroes)
  const R = typeof globalThis !== 'undefined' && globalThis.GAME && globalThis.GAME.run;
  if (O.level && R && R.heroes && R.world === w) {
    const L = w._hfLvl || (w._hfLvl = {});
    for (const k in R.heroes) { const lv = R.heroes[k].level; if (L[k] != null && lv > L[k] && !fresh) { const u = w.units.find((o) => o.kind === k && o.team === 'hero' && !o.summon); if (u) add('level', { u, x: u.x, y: u.y, seed: u.id + lv }, 1.35); } L[k] = lv; }
  }
}
// where a thing that follows its unit is now
const at = (f) => { if (f.u && !f.u.dead && f.u.hp > 0) { f.x = f.u.x; f.y = f.u.y; } return f; };
const cen = (f) => (f.u && !f.u.dead ? [f.u.x, f.u.y] : [f.x - (f.ox || 0), f.y - (f.oy || 0)]); // a mark's body centre, following it
const rOf = (f) => (f.u ? f.u.vr || f.u.r : f.r || 20);

// ---------------------------------------------------------------- the hit mark
const MARK = {
  // 1 Marks: each type its own sign at the struck edge. Sharp: a cut drawn across the edge, two slivers flicked back.
  // Blunt: three comic impact lines and a little dust. Magic: an element pop, its bits thrown back the way it came.
  1(ctx, f, k) {
    const { x, y, a } = f, out = a + Math.PI, S = (f.big ? 1.3 : 1) * (f.shot ? 0.8 : 1), C = colsOf(f), e = easeOut(k01(k / 0.6));
    if (f.omni) return omni(ctx, f, k, S, C);
    if (f.ty === 'sharp') {
      // two short gashes across the body's edge, at a slant to the blade's line, their cores a raw pink; two slivers out the sides
      const ix = x + Math.cos(a) * rOf(f) * 0.42, iy = y + Math.sin(a) * rOf(f) * 0.42, b = a + Math.PI / 2 + (hash(f.seed) < 0.5 ? 0.55 : -0.55), L = 30 * S, head = easeOut(k01(k / 0.2)), tail = sm(k01((k - 0.3) / 0.7));
      for (const o of [-1, 1]) { const ox = ix + Math.cos(a) * o * 5 * S, oy = iy + Math.sin(a) * o * 5 * S, Lo = L * (o > 0 ? 0.8 : 1);
        streak(ctx, ox - Math.cos(b) * Lo / 2, oy - Math.sin(b) * Lo / 2, b, Lo * tail, Lo * head, 3.4 * S * (1 - 0.4 * k), C[1], '#FF8A7A'); }
      ctx.save(); ctx.globalAlpha *= 1 - k * k;
      for (let i = 0; i < 2; i++) { const c = side(a, i, 2, 1.2, 1.2, f.seed), d = 8 + 20 * e; streak(ctx, ix + Math.cos(c) * d, iy + Math.sin(c) * d, c, 0, 8 * (1 - k) + 3, 2.2, C[1], null); }
      ctx.restore(); return;
    }
    if (f.ty === 'blunt') {
      ctx.save(); ctx.globalAlpha *= 1 - k * k * k;
      // comic impact lines out both sides of where it landed, a dust puff past each
      for (let i = 0; i < 4; i++) { const c = side(a, i, 4, 1.25, 1.85, f.seed), r0 = 8 + 10 * e, r1 = r0 + (15 - 8 * k) * S * (i < 2 ? 1 : 0.8); inked(ctx, () => wedgePath(ctx, x, y, c, r0, r1, 5.6 * S * (1 - 0.55 * k)), C[1]); }
      for (let i = 0; i < 2; i++) { const c = side(a, i, 2, 1.55, 1.55, f.seed), d = 22 + 12 * e; cloudPuff(ctx, x + Math.cos(c) * d, y + Math.sin(c) * d, (5 * S) * (1 - 0.6 * k) + 1, EL.earth[2], f.seed + i); }
      ctx.restore(); return;
    }
    // magic
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, x, y, 18 * S, C[1], 0.55 * (1 - k / 0.3)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    if (k < 0.28) inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 7 * S * (1 - k / 0.28) + 1, 0, TAU); }, C[2]);
    for (let i = 0; i < 4; i++) { const c = side(a, i, 4, 1.1, 1.9, f.seed), d = 6 + 22 * e; motif(ctx, f.el, x + Math.cos(c) * d, y + Math.sin(c) * d, 6.2 * S * (1 - 0.45 * k), c + k * 3); }
    ctx.restore();
  },
  // 2 Edge: the side of the body that took it lights up: a crescent hugging the body's edge, never over its middle.
  // Sharp: a thin bright crescent and a short cut across it. Blunt: a fat dented crescent, two echoes rippling out.
  // Magic: a crescent in the element, its bits spilling off the ends.
  2(ctx, f, k) {
    const [cx, cy] = cen(f), R = rOf(f) + 3, ca = Math.atan2(f.oy, f.ox), S = (f.big ? 1.25 : 1) * (f.shot ? 0.85 : 1), C = colsOf(f), e = easeOut(k01(k / 0.5));
    if (f.omni) return omni(ctx, f, k, S, C);
    const fade = 1 - k * k;
    if (f.ty === 'sharp') {
      const sp = (0.55 + 0.25 * e) * S;
      arcBand(ctx, cx, cy, R + 2, ca - sp, ca + sp, 5.5 * S * fade, C[1], C[2]);
      const b = ca + Math.PI / 2 + 0.5, px = cx + Math.cos(ca) * (R + 2), py = cy + Math.sin(ca) * (R + 2), L = 26 * S, head = easeOut(k01(k / 0.2)), tail = sm(k01((k - 0.3) / 0.7));
      streak(ctx, px - Math.cos(b) * L / 2, py - Math.sin(b) * L / 2, b, L * tail, L * head, 3.4 * S, C[1], C[2]);
      return;
    }
    if (f.ty === 'blunt') {
      const dent = 1 - 0.18 * Math.sin(Math.PI * k01(k / 0.4));
      arcBand(ctx, cx, cy, R * dent + 1, ca - 0.6 * S, ca + 0.6 * S, 9 * S * fade, C[1], C[2]);
      ctx.save(); ctx.globalAlpha *= fade;
      for (let i = 0; i < 2; i++) { const q = k01((k - i * 0.12) / 0.7); if (q <= 0) continue; const rr = R + 5 + (6 + 5 * i) * easeOut(q); inkLine(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, rr, ca - 0.5 - 0.3 * q, ca + 0.5 + 0.3 * q); }, C[1], 3.2 * (1 - q) + 0.8); }
      ctx.restore(); return;
    }
    const sp = 0.75 * S;
    arcBand(ctx, cx, cy, R + 1, ca - sp, ca + sp, 7 * S * fade, C[1], C[2]);
    if (k < 0.25) lit(ctx, () => glowDisc(ctx, cx + Math.cos(ca) * R, cy + Math.sin(ca) * R, 20 * S, C[1], 0.5 * (1 - k / 0.25)));
    ctx.save(); ctx.globalAlpha *= fade;
    for (let i = 0; i < 3; i++) { const c = ca + (i - 1) * sp * 0.9, d = R + 4 + 16 * e; motif(ctx, f.el, cx + Math.cos(c) * d, cy + Math.sin(c) * d, 4.6 * S * (1 - 0.4 * k), c + k * 2); }
    ctx.restore();
  },
  // 3 Spray: no shape on the body at all: what the blow knocks loose flies back out of it. Sharp: a fan of fine
  // slivers. Blunt: chunky grit thrown out to the sides. Magic: the element's bits sprayed in a fan.
  3(ctx, f, k) {
    const { x, y, a } = f, out = a + Math.PI, S = (f.big ? 1.3 : 1) * (f.shot ? 0.85 : 1), C = colsOf(f);
    if (f.omni) return omni(ctx, f, k, S, C);
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    if (f.ty === 'sharp') {
      for (let i = 0; i < 6; i++) { const c = side(a, i, 6, 0.9, 1.9, f.seed), v = 0.6 + 0.6 * hash(i, f.seed), d = (6 + 34 * easeOut(k01(k / 0.7)) * v) * S, L = (16 * v + 6) * (1 - 0.5 * k);
        streak(ctx, x + Math.cos(c) * d, y + Math.sin(c) * d, c, 0, L, 3, i % 2 ? C[1] : C[2], null); }
    } else if (f.ty === 'blunt') {
      for (let i = 0; i < 6; i++) { const c = side(a, i, 6, 1.2, 2.1, f.seed), v = 0.6 + 0.5 * hash(i, f.seed), d = (5 + 30 * easeOut(k01(k / 0.75)) * v) * S, hop = Math.sin(Math.PI * k01(k / 0.8)) * 8 * v;
        const [px, py] = upP(x + Math.cos(c) * d, y + Math.sin(c) * d, hop);
        inked(ctx, () => { ctx.beginPath(); ctx.arc(px, py, (3.6 + 1.6 * v) * S * (1 - 0.4 * k), 0, TAU); }, i % 3 ? EL.earth[2] : EL.earth[1]); }
      for (let i = 0; i < 2; i++) { const c = side(a, i, 2, 1.5, 1.5, f.seed); cloudPuff(ctx, x + Math.cos(c) * 8, y + Math.sin(c) * 8, 6 * S * (1 - 0.7 * k) + 1, CREAM[1], f.seed + i); }
    } else {
      if (k < 0.25) lit(ctx, () => glowDisc(ctx, x, y, 16 * S, C[1], 0.5 * (1 - k / 0.25)));
      for (let i = 0; i < 7; i++) { const c = side(a, i, 7, 0.8, 2.0, f.seed), v = 0.6 + 0.6 * hash(i, f.seed), d = (5 + 32 * easeOut(k01(k / 0.75)) * v) * S;
        motif(ctx, f.el, x + Math.cos(c) * d, y + Math.sin(c) * d, (3.4 + 1.6 * v) * S * (1 - 0.4 * k), c + k * 4); }
    }
    ctx.restore();
  },
};
// a blow from everywhere at once (Smite): the element's bits all round the body's edge, rising
function omni(ctx, f, k, S, C) {
  at(f); const R = rOf(f), e = easeOut(k);
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, R * 1.6, C[1], 0.45 * (1 - k / 0.3)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 7; i++) { const c = i / 7 * TAU + hash(f.seed, i), d = R + 2 + 10 * e, [px, py] = upP(f.x + Math.cos(c) * d, f.y + Math.sin(c) * d, 12 * e);
    if (f.ty === 'magic') motif(ctx, f.el, px, py, 4.5 * S * (1 - 0.4 * k), c); else glint(ctx, px, py, 5 * (1 - k) + 1.5, c, C[2]); }
  ctx.restore();
}

// ---------------------------------------------------------------- a critical blow (drawn with the mark)
const GOLD = ['#C88A20', '#FFD45A', '#FFF0B0', '#FFFFFF'];
const CRIT = {
  // 1 Burst: a gold comic burst beside the struck edge (pushed out of the body), with three speed lines past it
  1(ctx, f, k) {
    const out = f.a + Math.PI, R = rOf(f), pop = k < 0.12 ? easeOut(k / 0.12) * 1.15 : 1.15 - 0.15 * k01((k - 0.12) / 0.15) - 0.6 * k01((k - 0.5) / 0.5);
    const sa = side(f.a, f.seed & 1, 2, 1.45, 1.45), cx = f.x + Math.cos(sa) * (14 + R * 0.3), cy = f.y + Math.sin(sa) * (14 + R * 0.3), Rb = 17 * pop;
    if (Rb < 1) return;
    if (k < 0.2) lit(ctx, () => glowDisc(ctx, cx, cy, 34, GOLD[1], 0.6 * (1 - k / 0.2)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    inked(ctx, () => burstPath(ctx, cx, cy, Rb, 9, f.seed, 0.56, sa), GOLD[1]);
    ctx.fillStyle = GOLD[2]; burstPath(ctx, cx, cy, Rb * 0.55, 9, f.seed + 1, 0.6, sa + 0.3); ctx.fill();
    for (let i = -1; i <= 1; i++) { const c = sa + i * 0.5, r0 = Rb + 4 + 10 * easeOut(k), r1 = r0 + 12 * (1 - k); if (r1 - r0 > 1.5) inked(ctx, () => wedgePath(ctx, cx, cy, c, r0, r1, 4.2 * (1 - k) + 1), GOLD[2]); }
    ctx.restore();
  },
  // 2 Rays: thick gold rays shoot out from all round the body's edge (they start outside it)
  2(ctx, f, k) {
    at(f); const R = rOf(f), e = easeOut(k01(k / 0.45)), n = 10;
    if (k < 0.18) lit(ctx, () => glowDisc(ctx, f.x, f.y, R * 2.2, GOLD[1], 0.45 * (1 - k / 0.18)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < n; i++) { const c = i / n * TAU + hash(f.seed, i) * 0.3, v = 0.7 + 0.5 * hash(i, f.seed), r0 = R + 6 + 14 * e, r1 = r0 + (16 + 10 * v) * (1 - 0.7 * k);
      inked(ctx, () => wedgePath(ctx, f.x, f.y, c, r0, r1, (5.5 * v) * (1 - 0.5 * k) + 1.2), i % 2 ? GOLD[1] : GOLD[2]); }
    ctx.restore();
  },
  // 3 Shards: gold shards thrown back the way the blow came, and a thin gold ring snapping out from where it landed
  3(ctx, f, k) {
    const out = f.a + Math.PI, e = easeOut(k01(k / 0.7));
    if (k < 0.18) lit(ctx, () => glowDisc(ctx, f.x, f.y, 30, GOLD[1], 0.6 * (1 - k / 0.18)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, 5 + 26 * easeOut(k01(k / 0.5)), 0, TAU); }, GOLD[2], 3.4 * (1 - k) + 0.6);
    for (let i = 0; i < 6; i++) { const c = side(f.a, i, 6, 0.9, 1.9, f.seed), d = 8 + 34 * e * (0.7 + 0.4 * hash(i, f.seed)), s = 6.5 * (1 - 0.5 * k);
      ctx.save(); ctx.translate(f.x + Math.cos(c) * d, f.y + Math.sin(c) * d); ctx.rotate(c + k * 5);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s * 1.5, 0); ctx.lineTo(-s * 0.6, -s * 0.55); ctx.lineTo(-s * 0.3, s * 0.6); ctx.closePath(); }, i % 2 ? GOLD[1] : GOLD[2]);
      ctx.restore(); }
    ctx.restore();
  },
};

// ---------------------------------------------------------------- a blow on a shield
const SH = ['#C9A44A', '#FFE7A0', '#FFFBEA'];
const BLOCK = {
  // 1 Clang: the shield's face rings (a bright band along it) and sparks fly back off it
  1(ctx, f, k) {
    const [cx, cy] = cen(f), sa = Math.atan2(f.oy, f.ox), R = Math.hypot(f.ox, f.oy) + 1, px = cx + Math.cos(sa) * R, py = cy + Math.sin(sa) * R;
    if (k < 0.2) lit(ctx, () => glowDisc(ctx, px, py, 26, '#FFF4C8', 0.7 * (1 - k / 0.2)));
    arcBand(ctx, cx, cy, R + 2, sa - 0.85, sa + 0.85, 9 * (1 - k * k), SH[1], SH[2]);
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < 6; i++) { const c = side(sa, i, 6, 0.9, 1.6, f.seed), d = 4 + 24 * easeOut(k) * (0.7 + 0.4 * hash(i, f.seed)); streak(ctx, px + Math.cos(c) * d, py + Math.sin(c) * d, c, 0, 12 * (1 - k) + 3, 2.8, i % 2 ? SH[1] : SH[2], null); }
    ctx.restore();
  },
  // 2 Ward: a shield of pale light pops up on the shield's face (inked, see-through) and rings out twice
  2(ctx, f, k) {
    const [cx, cy] = cen(f), sa = Math.atan2(f.oy, f.ox), R = Math.max(8, Math.hypot(f.ox, f.oy) - 8); // (on his own shield, not over the one striking)
    const pop = k < 0.15 ? easeOut(k / 0.15) * 1.15 : 1.15 - 0.15 * k01((k - 0.15) / 0.2), s = 12 * pop;
    ctx.save(); ctx.translate(cx + Math.cos(sa) * R, cy + Math.sin(sa) * R); ctx.rotate(sa + Math.PI / 2);
    ctx.globalAlpha *= (1 - k * k) * 0.92;
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-s, -s * 0.75); ctx.lineTo(s, -s * 0.75); ctx.lineTo(s, -s * 0.1); ctx.quadraticCurveTo(s * 0.9, s * 0.75, 0, s * 1.1); ctx.quadraticCurveTo(-s * 0.9, s * 0.75, -s, -s * 0.1); ctx.closePath(); }, SH[1]);
    ctx.fillStyle = SH[2]; ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.45); ctx.lineTo(s * 0.45, -s * 0.45); ctx.lineTo(s * 0.45, 0); ctx.quadraticCurveTo(s * 0.4, s * 0.4, 0, s * 0.6); ctx.quadraticCurveTo(-s * 0.4, s * 0.4, -s * 0.45, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= 1 - k;
    for (let i = 0; i < 2; i++) { const q = k01((k - i * 0.15) / 0.7); if (q <= 0) continue; inkLine(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, R + 10 + 6 * easeOut(q), sa - 0.5 - 0.9 * easeOut(q), sa + 0.5 + 0.9 * easeOut(q)); }, SH[1], 3 * (1 - q) + 0.6); }
    ctx.restore();
  },
  // 3 Deflect: the blow comes in and glances off the shield's face at an angle; the bearer's feet skid (dust behind)
  3(ctx, f, k) {
    const [cx, cy] = cen(f), sa = Math.atan2(f.oy, f.ox), R = Math.hypot(f.ox, f.oy) + 2, px = cx + Math.cos(sa) * R, py = cy + Math.sin(sa) * R;
    const rf = sa + (hash(f.seed) < 0.5 ? 1 : -1) * 1.05, C = SH; // the blow glances off along the shield's face, out to one side
    if (k < 0.15) lit(ctx, () => glowDisc(ctx, px, py, 22, '#FFF4C8', 0.75 * (1 - k / 0.15)));
    const q = easeOut(k01(k / 0.6)), L = 30;
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    streak(ctx, px, py, rf, 6 + 44 * q, 6 + 44 * q + (L + 10) * (1 - 0.6 * k), 5 * (1 - 0.5 * k), C[1], C[2]);
    for (const o of [-0.35, 0.35]) streak(ctx, px, py, rf + o, 4 + 30 * q, 4 + 30 * q + 12 * (1 - k), 2.4, C[1], null);
    const bx = cx - Math.cos(sa) * rOf(f) * 0.9, by = cy - Math.sin(sa) * rOf(f) * 0.9;
    for (let i = -1; i <= 1; i++) { const c = sa + Math.PI + i * 0.7, d = 4 + 12 * q; cloudPuff(ctx, bx + Math.cos(c) * d, by + Math.sin(c) * d, 5 * (1 - 0.6 * k) + 1, EL.earth[2], f.seed + i); }
    ctx.restore();
  },
};

// ---------------------------------------------------------------- a dodge or a miss
const MISS = {
  // 1 Swoosh: the blow's sweep goes on past the body, a pale crescent clear of its edge, and two speed lines
  1(ctx, f, k) {
    at(f); const R = f.r + 14, back = f.a + f.side * 0.5, s = f.side, span = 2.2, a0 = back - s * span * 0.5, head = a0 + s * span * easeOut(k01(k / 0.45)), tail = a0 + s * span * sm(k01((k - 0.15) / 0.85));
    const lo = Math.min(head, tail), hi = Math.max(head, tail);
    ctx.save(); ctx.globalAlpha *= 0.95;
    arcBand(ctx, f.x, f.y, R, lo, hi, 10 * (1 - 0.5 * k), '#EEF3F8', '#FFFFFF');
    ctx.globalAlpha *= 1 - k;
    const side = f.a + s * Math.PI / 2;
    for (let i = -1; i <= 1; i += 2) { const ox = f.x + Math.cos(side) * (f.r + 8) + Math.cos(f.a) * i * 7, oy = f.y + Math.sin(side) * (f.r + 8) + Math.sin(f.a) * i * 7; streak(ctx, ox, oy, side, 2 + 12 * k, 28 + 12 * k, 3.2, '#DDE6F0', null); }
    ctx.restore();
  },
  // 2 Sidestep: speed lines on the side it slipped away from and a little dust kicked from its feet
  2(ctx, f, k) {
    at(f); const side = f.a + f.side * Math.PI / 2, away = side + Math.PI, e = easeOut(k01(k / 0.5));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = -1; i <= 1; i++) { const ox = f.x + Math.cos(away) * (f.r + 6) + Math.cos(f.a) * i * 9, oy = f.y + Math.sin(away) * (f.r + 6) + Math.sin(f.a) * i * 9; streak(ctx, ox, oy, away, 4 + 6 * e, 4 + 6 * e + (i ? 22 : 30) * (1 - 0.5 * k), 3.4, '#E6EDF5', null); }
    for (let i = 0; i < 3; i++) { const c = away + (i - 1) * 0.6, d = f.r * 0.6 + 12 * e; cloudPuff(ctx, f.x + Math.cos(c) * d, f.y + Math.sin(c) * d, 5 * (1 - 0.6 * k) + 1.2, EL.earth[2], f.seed + i); }
    ctx.restore();
  },
  // 3 Air: the blow falls on nothing beside it: an empty pale puff and two curls where it would have landed
  3(ctx, f, k) {
    at(f); const back = f.a + Math.PI + f.side * 0.9, px = f.x + Math.cos(back) * (f.r + 10), py = f.y + Math.sin(back) * (f.r + 10), e = easeOut(k01(k / 0.6));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < 3; i++) { const c = back + (i - 1) * 1.3, d = 3 + 9 * e; cloudPuff(ctx, px + Math.cos(c) * d, py + Math.sin(c) * d, 6.5 * (1 - 0.5 * k) + 1, '#EDEAF0', f.seed + i); }
    for (const s of [-1, 1]) inkLine(ctx, () => { const cx = px + Math.cos(back + s * 1.4) * (10 + 8 * e), cy = py + Math.sin(back + s * 1.4) * (10 + 8 * e); ctx.beginPath(); ctx.arc(cx, cy, 5 + 2 * e, back + s * 0.5, back + s * 0.5 + s * 3.6, s < 0); }, '#F4F1F6', 2.6);
    ctx.restore();
  },
};

// ---------------------------------------------------------------- blasts (fxkit.js blast hands them over)
const BL_EL = [['fire', '#FFB347'], ['fire', '#FF8A3D'], ['frost', '#9FDDF6'], ['poison', '#7DB83A'], ['poison', '#9BE07A'], ['holy', '#F2C14E'], ['curse', '#9B7BD6'], ['shock', '#FFE66B'], ['water', '#5DB7E0'], ['nature', '#6FA046']];
function blastEl(m) {
  if (m._el) return m._el;
  if (m.burn || m.ab === 'fireball') return (m._el = 'fire');
  const n = parseInt((m.color || '#FFB347').slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  let best = 'fire', bd = 1e9; for (const [el, h] of BL_EL) { const q = parseInt(h.slice(1), 16), d = (r - (q >> 16)) ** 2 + (g - ((q >> 8) & 255)) ** 2 + (b - (q & 255)) ** 2; if (d < bd) { bd = d; best = el; } }
  return (m._el = best);
}
const SMOKE = ['#5E5868', '#8E8696', '#B9B2C2'];
const BLAST = {
  // 1 Cloud: a ring of inked puffs in the element rolling out to the blast's edge, a quick core, smoke rising after
  1(ctx, m, k) {
    const el = blastEl(m), C = ELC[el], R = m.r, e = easeOut(k01(k / 0.55)), n = Math.max(8, Math.round(R / 8));
    if (k < 0.12) lit(ctx, () => glowDisc(ctx, m.x, m.y, R * 1.3, C[3], 0.8 * (1 - k / 0.12)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k * k;
    for (let i = 0; i < n; i++) { const b = (i + hash(m.seed, i) * 0.5) / n * TAU, d = R * (0.3 + 0.65 * e) * (0.85 + 0.25 * hash(i, m.seed)), s = (R * 0.2 + 4) * (1 - 0.65 * e) + 1.5;
      const smoke = k > 0.45, col = smoke ? (i % 2 ? SMOKE[2] : SMOKE[1]) : i % 3 === 0 ? C[2] : C[1];
      cloudPuff(ctx, m.x + Math.cos(b) * d, m.y + Math.sin(b) * d, s, col, m.seed + i);
      if (i % 3 === 1 && k < 0.6) motif(ctx, el, m.x + Math.cos(b) * d * 1.08, m.y + Math.sin(b) * d * 1.08, s * 0.7, b); }
    if (k < 0.3) inked(ctx, () => { ctx.beginPath(); ctx.arc(m.x, m.y, R * 0.32 * (1 - k / 0.3) + 1, 0, TAU); }, C[3]);
    for (let i = 0; i < 3; i++) { const q = k01((k - 0.35 - i * 0.08) / 0.6); if (q <= 0 || q >= 1) continue; const [px, py] = upP(m.x + (hash(m.seed, i + 9) - 0.5) * R * 0.5, m.y, 10 + 40 * q); cloudPuff(ctx, px, py, (R * 0.16 + 4) * (1 - 0.5 * q), SMOKE[1 + (i % 2)], m.seed + i * 3); }
    ctx.restore();
  },
  // 2 Burst: a layered cartoon starburst (dark, main, light, core) that blooms fast and folds in from the middle,
  // chunks of the element flung past its edge
  2(ctx, m, k) {
    const el = blastEl(m), C = ELC[el], R = m.r * 0.95;
    const g = (k0) => { const q = k - k0; return q < 0 ? 0 : q < 0.14 ? easeOut(q / 0.14) : Math.max(0, 1 - sm(k01((q - 0.14) / 0.3))); };
    const L = [[C[0], 1, 0.1], [C[1], 0.8, 0.06], [C[2], 0.58, 0.03], [C[3], 0.36, 0]];
    for (let j = 0; j < 4; j++) { const [col, s, k0] = L[j], rr = R * s * g(0) * (j === 0 ? 1 : 1 - 0.6 * k01((k - 0.12 - (3 - j) * 0.05) / 0.25)); if (rr < 1) continue;
      if (j === 0) inked(ctx, () => burstPath(ctx, m.x, m.y, rr, 11, m.seed, 0.72, 0.1), col); else { ctx.fillStyle = col; burstPath(ctx, m.x, m.y, rr, 11, m.seed + j, 0.72, 0.1 + j * 0.15); ctx.fill(); } }
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    const n = Math.max(6, Math.round(R / 14));
    for (let i = 0; i < n; i++) { const b = (i + hash(m.seed, i)) / n * TAU, q = k01(k / 0.85), d = R * (0.5 + 0.75 * easeOut(q)), hop = Math.sin(Math.PI * q) * R * 0.25, [px, py] = upP(m.x + Math.cos(b) * d, m.y + Math.sin(b) * d, hop);
      motif(ctx, el, px, py, (R * 0.09 + 3.5) * (1 - 0.4 * q), b + q * 6); }
    ctx.restore();
  },
  // 3 Shock: a shock ring runs out along the floor (under the units: blastGround), sparks shoot to the edge, and the
  // element boils up in the middle
  3(ctx, m, k) {
    const el = blastEl(m), C = ELC[el], R = m.r, e = easeOut(k01(k / 0.4));
    if (k < 0.1) lit(ctx, () => glowDisc(ctx, m.x, m.y, R * 0.9, C[3], 0.9 * (1 - k / 0.1)));
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    const n = Math.max(8, Math.round(R / 7));
    for (let i = 0; i < n; i++) { const b = (i + hash(m.seed, i) * 0.6) / n * TAU, d = R * (0.15 + 0.85 * e), L = (R * 0.24 + 9) * (1 - 0.7 * k); streak(ctx, m.x + Math.cos(b) * (d - L), m.y + Math.sin(b) * (d - L), b, 0, L, 3.4, i % 2 ? C[1] : C[2], null); }
    for (let i = 0; i < 5; i++) { const q = k01((k - i * 0.06) / 0.7); if (q <= 0 || q >= 1) continue; const b = i / 5 * TAU + m.seed, [px, py] = upP(m.x + Math.cos(b) * R * 0.15, m.y + Math.sin(b) * R * 0.15, R * 0.5 * q); motif(ctx, el, px, py, (R * 0.08 + 4) * (1 - 0.5 * q), b + q * 4); }
    ctx.restore();
  },
};
const BLAST_G = {
  2(ctx, m, k) { ctx.save(); ctx.globalAlpha *= 0.32 * (1 - k); ctx.fillStyle = '#2B2230'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.55, 0, TAU); ctx.fill(); ctx.restore(); },
  3(ctx, m, k) {
    const el = blastEl(m), C = ELC[el], e = easeOut(k01(k / 0.55)), R = m.r * (0.2 + 0.85 * e), th = m.r * 0.22 * (1 - 0.6 * k) + 3;
    ctx.save(); ctx.globalAlpha *= 0.5 * (1 - k);
    ctx.fillStyle = C[1]; ctx.beginPath(); ctx.arc(m.x, m.y, R + th / 2, 0, TAU); ctx.arc(m.x, m.y, Math.max(0, R - th / 2), 0, TAU, true); ctx.fill();
    ctx.globalAlpha = 0.28 * (1 - k); ctx.fillStyle = '#2B2230'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.4, 0, TAU); ctx.fill();
    ctx.restore();
  },
};

// ---------------------------------------------------------------- health coming back
const HEAL = ['#3F7A2E', '#9BE07A', '#D8F5B8', '#F4FFE8'];
const HEALS = {
  // 1 Lift: soft green light climbing up through the body (light: additive, no outline) and crosses popping at its edge
  1(ctx, f, k) {
    at(f); const R = rOf(f), [ux, uy] = U();
    lit(ctx, () => { for (let i = 0; i < 3; i++) { const q = k01((k - i * 0.12) / 0.6); if (q <= 0 || q >= 1) continue; const h = -R + 2.6 * R * q, ox = (i - 1) * R * 0.5;
      const px = f.x + ux * h - uy * ox, py = f.y + uy * h + ux * ox; glowDisc(ctx, px, py, R * 0.7, HEAL[1], 0.42 * Math.sin(Math.PI * q)); } });
    const n = f.big ? 4 : 2;
    for (let i = 0; i < n; i++) { const q = k01((k - 0.1 - i * 0.12) / 0.6); if (q <= 0 || q >= 1) continue; const c = i / n * TAU + hash(f.seed, i) * 2, [px, py] = upP(f.x + Math.cos(c) * (R + 4), f.y + Math.sin(c) * (R + 4) * 0.8, 6 + 22 * q);
      ctx.save(); ctx.globalAlpha *= Math.min(1, (1 - q) * 2.5); cross(ctx, px, py, (f.big ? 6 : 5) * (q < 0.2 ? easeOut(q / 0.2) : 1), HEAL[1]); ctx.restore(); }
  },
  // 2 Swirl: green-white motes wind up round the body from its feet and wink out over its head
  2(ctx, f, k) {
    at(f); const R = rOf(f), n = f.big ? 7 : 5;
    for (let i = 0; i < n; i++) { const q = k01((k - i * 0.05) / 0.75); if (q <= 0 || q >= 1) continue; const c = i / n * TAU + q * 5, rr = (R + 8) * (1 - 0.45 * q), [px, py] = upP(f.x + Math.cos(c) * rr, f.y + Math.sin(c) * rr * 0.7, -R * 0.3 + R * 1.9 * q);
      ctx.save(); ctx.globalAlpha *= Math.min(1, (1 - q) * 3, q * 6); inkDisc(ctx, px, py, 3.6 * (1 - 0.4 * q) + 0.6, i % 2 ? HEAL[2] : HEAL[1]); ctx.restore(); }
    if (k > 0.7) { const q = (k - 0.7) / 0.3, [px, py] = upP(f.x, f.y, R * 1.7); ctx.save(); ctx.globalAlpha *= 1 - q; cross(ctx, px, py, 6 * easeOut(Math.min(1, q * 3)), HEAL[1]); ctx.restore(); }
  },
  // 3 Glow: the body takes a green wash (render.js, through the wash hook) and one big cross pops over its head
  3(ctx, f, k) {
    at(f); const R = rOf(f), pop = k < 0.18 ? easeOut(k / 0.18) * 1.2 : 1.2 - 0.2 * k01((k - 0.18) / 0.2), [px, py] = upP(f.x, f.y, R + 14 + 10 * k);
    ctx.save(); ctx.globalAlpha *= k01((1 - k) / 0.3); cross(ctx, px, py, (f.big ? 9 : 7) * pop, HEAL[1]); ctx.restore();
    if (f.big) for (const s of [-1, 1]) { const q = k01((k - 0.15) / 0.7); if (q <= 0 || q >= 1) continue; const [qx, qy] = upP(f.x + s * (R + 6), f.y, 4 + 16 * q); ctx.save(); ctx.globalAlpha *= 1 - q; cross(ctx, qx, qy, 4.5, HEAL[2]); ctx.restore(); }
  },
};

// ---------------------------------------------------------------- a buff landing
const BUFFS = {
  // 1 Chevrons: three chevrons in the buff's colour rise beside it, one after another
  1(ctx, f, k) {
    at(f); const R = rOf(f);
    for (let i = 0; i < 3; i++) { const q = k01((k - i * 0.12) / 0.65); if (q <= 0 || q >= 1) continue; const ox = (i - 1) * (R + 6), [px, py] = upP(f.x + (view.rot ? 0 : ox), f.y + (view.rot ? ox : 0), (i === 1 ? R + 6 : R * 0.2) + 26 * q);
      ctx.save(); ctx.globalAlpha *= Math.min(1, (1 - q) * 2.5); chevron(ctx, px, py, 10 * (q < 0.2 ? easeOut(q / 0.2) : 1), f.col); ctx.restore(); }
  },
  // 2 Glints: four glints drop in onto the body's edge from outside and flash it (the wash hook)
  2(ctx, f, k) {
    at(f); const R = rOf(f);
    for (let i = 0; i < 4; i++) { const q = k01((k - i * 0.05) / 0.45), c = i / 4 * TAU + 0.6; if (q >= 1) continue; const d = R + 4 + 34 * (1 - easeOut(q));
      ctx.save(); ctx.globalAlpha *= q < 0.85 ? 1 : (1 - q) / 0.15; glint(ctx, f.x + Math.cos(c) * d, f.y + Math.sin(c) * d, 8.5 * (0.6 + 0.4 * q), c, f.col); ctx.restore(); }
    if (k > 0.4 && k < 0.7) lit(ctx, () => glowDisc(ctx, f.x, f.y, R * 1.6, f.col, 0.3 * (1 - (k - 0.4) / 0.3)));
  },
  // 3 Spiral: a ribbon of the buff's light winds up round the body once (light only), a glint at its top
  3(ctx, f, k) {
    at(f); const R = rOf(f) + 6, head = k01(k / 0.6), tail = k01((k - 0.25) / 0.6);
    if (head - tail > 0.02) lit(ctx, () => { ctx.lineCap = 'round'; ctx.strokeStyle = f.col; ctx.globalAlpha = 0.8; ctx.lineWidth = 4.5;
      ctx.beginPath(); for (let i = 0; i <= 20; i++) { const q = tail + (head - tail) * i / 20, c = q * TAU * 1.1 + 1, [px, py] = upP(f.x + Math.cos(c) * R, f.y + Math.sin(c) * R * 0.55, -R * 0.4 + R * 1.8 * q); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); });
    if (k > 0.5) { const q = (k - 0.5) / 0.5, [px, py] = upP(f.x, f.y, R * 1.5); ctx.save(); ctx.globalAlpha *= 1 - q; glint(ctx, px, py, 8 * Math.sin(Math.PI * Math.min(1, q * 1.6)) + 1, q * 2, f.col); ctx.restore(); }
  },
};

// ---------------------------------------------------------------- deaths, by family
// a piece of the body: by family, s about its size
function piece(ctx, fam, C, x, y, s, rot, i) {
  switch (fam) {
    case 'bone': if (i === 0) skull(ctx, x, y, s * 0.9, rot * 0.3); else { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); inked(ctx, () => boneShape(ctx, s * 2.4, s * 0.8), i % 2 ? C[1] : C[2]); ctx.restore(); } return;
    case 'slime': inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, s * (i % 2 ? 0.8 : 1), 0, TAU); }, C[1]); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.3, s * 0.28, 0, TAU); ctx.fill(); return;
    case 'construct': if (i % 3 === 0) cog(ctx, x, y, s, rot, i % 2 ? C[2] : C[1]); else { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); inked(ctx, () => { ctx.beginPath(); ctx.rect(-s * 0.9, -s * 0.45, s * 1.8, s * 0.9); }, i % 2 ? C[1] : C[0]); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-s * 0.45, 0, s * 0.16, 0, TAU); ctx.arc(s * 0.45, 0, s * 0.16, 0, TAU); ctx.fill(); ctx.restore(); } return;
    case 'spirit': drop(ctx, x, y, s * 0.8, rot, i % 2 ? C[1] : C[2]); return;
    case 'beast': tuft(ctx, x, y, s, rot, i % 2 ? C[1] : C[2]); return;
    default: cloudPuff(ctx, x, y, s, i % 2 ? C[1] : C[2], i);
  }
}
const DEATH = {
  // 1 Bits: its own bits flung out the way it was knocked, hopping and tumbling (bones and a skull, goo, fur, cogs
  // and plates, wisps); a quick glow in its own colour, no white
  1(ctx, f, k) {
    const C = f.col, R = f.r, n = f.big ? 11 : f.fam === 'slime' ? 8 : 6, q = k01(k / 0.75);
    if (k < 0.15) lit(ctx, () => glowDisc(ctx, f.x, f.y, R * 1.6, C[2], 0.55 * (1 - k / 0.15)));
    ctx.save(); ctx.globalAlpha *= k01((1 - k) / 0.3);
    for (let i = 0; i < n; i++) { const spread = f.kick ? 3.6 : TAU, b = (f.kick ? f.a - spread / 2 : 0) + (i + hash(f.seed, i) * 0.7) / n * spread, v = 0.45 + 0.8 * hash(i, f.seed);
      const d = R * (0.2 + 1.5 * easeOut(q) * v), hop = f.fam === 'spirit' ? R * 1.2 * q : Math.abs(Math.sin(Math.PI * q * (1.3 - 0.3 * v))) * R * 0.7 * (1 - q * 0.5) * v, [px, py] = upP(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, hop);
      piece(ctx, f.fam, C, px, py, (R * 0.28 + 4) * (f.fam === 'slime' ? 1 - 0.4 * q : 1), b + q * 7 * (v - 0.8), i); }
    ctx.restore();
  },
  // 2 Poof: a cloud in its own colours (dust for bone and beasts, goo for slimes, soot for machines, mist for spirits)
  // and a few bits
  2(ctx, f, k) {
    const C = f.col, R = f.r * 1.2, e = easeOut(k01(k / 0.6)), n = f.big ? 10 : 7;
    const cc = f.fam === 'construct' ? SMOKE : f.fam === 'bone' ? ['#8E8270', '#CFC3AA', '#E9DDC2'] : C;
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < n; i++) { const b = (i + hash(f.seed, i) * 0.5) / n * TAU, d = R * (0.2 + 0.9 * e), s = R * 0.42 * (1 - 0.75 * e) + 2; cloudPuff(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, s, i % 3 === 2 ? cc[2] : cc[1], f.seed + i); }
    for (let i = 0; i < 3; i++) { const b = (i + 0.3) / 3 * TAU + f.seed, d = R * (0.4 + 1.1 * e), [px, py] = upP(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, Math.sin(Math.PI * k01(k / 0.8)) * R * 0.5); piece(ctx, f.fam, C, px, py, R * 0.17 + 2, b + k * 5, i + 1); }
    ctx.restore();
  },
  // 3 Soul: something rises off it: a pale wisp (bone, beast, the rest), bubbles that pop (slime), steam and a cog
  // sprung loose (construct), the spirit itself spiralling away
  3(ctx, f, k) {
    const C = f.col, R = f.r, q = k01(k / 0.9);
    ctx.save(); ctx.globalAlpha *= k01((1 - k) / 0.35);
    if (f.fam === 'slime') {
      for (let i = 0; i < 6; i++) { const p = k01((k - i * 0.07) / 0.6); if (p <= 0 || p >= 1) continue; const b = i / 6 * TAU + f.seed, [px, py] = upP(f.x + Math.cos(b) * R * 0.6 * (1 + p), f.y + Math.sin(b) * R * 0.4, R * 1.2 * p);
        if (p < 0.85) piece(ctx, 'slime', C, px, py, (R * 0.2 + 2) * (0.6 + 0.6 * p), 0, i); else inkLine(ctx, () => { ctx.beginPath(); ctx.arc(px, py, R * 0.3, 0, TAU); }, C[1], 1.6); }
    } else if (f.fam === 'construct') {
      for (let i = 0; i < 4; i++) { const p = k01((k - i * 0.08) / 0.7); if (p <= 0 || p >= 1) continue; const [px, py] = upP(f.x + (i - 1.5) * R * 0.3, f.y, R * 0.3 + R * 1.6 * p); cloudPuff(ctx, px, py, (R * 0.25 + 3) * (0.6 + 0.6 * p), i % 2 ? SMOKE[2] : '#E6E2EA', f.seed + i); }
      const [cx, cy] = upP(f.x + R * 0.5, f.y, Math.sin(Math.PI * k01(k / 0.7)) * R * 1.4); if (k < 0.7) cog(ctx, cx, cy, R * 0.3 + 2, k * 9, C[2]);
      for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + 0.5, d = R * 0.5 + R * 1.2 * easeOut(k01(k / 0.4)); if (k < 0.45) streak(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, b, 0, 9 * (1 - k / 0.45) + 1, 2.2, '#FFE66B', null); }
    } else {
      const wis = f.fam === 'spirit' ? C : ['#8FB8D8', '#DDEEFF', '#F6FBFF'], turns = f.fam === 'spirit' ? 2 : 0.8;
      for (let j = 0; j < (f.fam === 'spirit' ? 3 : 1); j++) { const off = j / 3 * TAU, sx = Math.cos(q * TAU * turns + off) * R * 0.5 * (j ? 1 : 0.4), [px, py] = upP(f.x + sx, f.y, R * 0.3 + R * 3.2 * sm(q) * (1 - j * 0.15));
        ctx.save(); ctx.globalAlpha *= (j ? 0.75 : 1) * Math.min(1, q * 5); upright(ctx, px, py, () => { const s = (R * 0.45 + 4) * (j ? 0.6 : 1) * (1 - 0.3 * q), sway = Math.sin(q * 14 + j) * 0.3;
          inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(-s * 0.6 + sway * s, s * 1.6, sway * s * 1.4, s * 2.6); ctx.quadraticCurveTo(s * 0.6 + sway * s, s * 1.6, s, 0); }, wis[2]);
          if (!j) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.1, s * 0.16, 0, TAU); ctx.arc(s * 0.35, -s * 0.1, s * 0.16, 0, TAU); ctx.fill(); } }); ctx.restore(); }
      if (f.fam !== 'spirit') for (let i = 0; i < 3; i++) { const b = (i + 0.4) / 3 * TAU + f.seed, d = R * (0.4 + 0.9 * easeOut(k01(k / 0.5))), [px, py] = upP(f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, Math.sin(Math.PI * k01(k / 0.6)) * R * 0.4); if (k < 0.65) piece(ctx, f.fam, C, px, py, R * 0.16 + 2, b + k * 6, i + 1); }
    }
    ctx.restore();
  },
};
// what a death leaves on the floor a moment: a slime's splat, a machine's soot (soft-edged, no outline)
function deathGround(ctx, f, k) {
  if (f.fam !== 'slime' && f.fam !== 'construct') return;
  const e = easeOut(k01(k / 0.25)), R = f.r * (f.fam === 'slime' ? 1.3 : 0.9) * (0.4 + 0.6 * e);
  ctx.save(); ctx.globalAlpha *= (f.fam === 'slime' ? 0.55 : 0.3) * k01((1 - k) / 0.5); ctx.fillStyle = f.fam === 'slime' ? f.col[1] : '#2B2230';
  ctx.beginPath(); for (let i = 0; i <= 18; i++) { const a = i / 18 * TAU, rr = R * (0.8 + 0.35 * hash(f.seed, i % 18)); i ? ctx.lineTo(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr) : ctx.moveTo(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
  if (f.fam === 'slime') for (let i = 0; i < 5; i++) { const a = hash(f.seed, i + 30) * TAU, d = R * (1.3 + 0.5 * hash(i, f.seed)); ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, R * 0.12 + 1.5, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- pickups, xp, level-ups
const COIN = ['#B07A18', '#F2B53A', '#FFE08A'];
function coinShape(ctx, x, y, s, flip) { ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.12, Math.abs(flip)), 1); inked(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); }, flip < 0 ? COIN[0] : COIN[1]); ctx.fillStyle = COIN[2]; ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.25, s * 0.35, 0, TAU); ctx.fill(); ctx.restore(); }
const COINS = {
  // 1 Flip: the coin pops up spinning and winks out as a glint
  1(ctx, f, k) {
    const q = k01(k / 0.6), [px, py] = upP(f.x, f.y, 26 * easeOut(q));
    if (k < 0.6) coinShape(ctx, px, py, 6, Math.cos(k * 40));
    else { const p = (k - 0.6) / 0.4; glint(ctx, px, py, 8 * Math.sin(Math.PI * Math.min(1, p * 1.5)) + 1, p * 2, COIN[2]); }
  },
  // 2 Hop: the coin hops up over the collector's head into its pocket (shrinking), a twinkle where it went
  2(ctx, f, k) {
    if (f.u && !f.u.dead) at(f); const R = rOf(f), q = k01(k / 0.7), [px, py] = upP(f.x, f.y, R + 6 + Math.sin(Math.PI * q) * 26 - 10 * q);
    if (k < 0.7) coinShape(ctx, px, py, 6 * (1 - 0.5 * q), Math.cos(k * 30));
    else { const p = (k - 0.7) / 0.3, [gx, gy] = upP(f.x, f.y, R + 2); glint(ctx, gx, gy, 6 * Math.sin(Math.PI * p) + 1, 0.4, COIN[2]); }
  },
  // 3 Ring: a thin gold ring snaps out and four glints fly off it
  3(ctx, f, k) {
    const e = easeOut(k);
    if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, 18, COIN[1], 0.7 * (1 - k / 0.25)));
    ctx.save(); ctx.globalAlpha *= 1 - k;
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x, f.y, 4 + 16 * e, 0, TAU); }, COIN[2], 3 * (1 - k) + 0.6);
    for (let i = 0; i < 4; i++) { const c = i / 4 * TAU + 0.4, d = 6 + 20 * e; glint(ctx, f.x + Math.cos(c) * d, f.y + Math.sin(c) * d, 5 * (1 - k) + 1.2, c, COIN[2]); }
    ctx.restore();
  },
};
const XPC = ['#4E3FB0', '#A89CFF', '#E4DEFF'];
const XPS = {
  // 1 Motes: small violet motes (the xp bar's colour) curve from the kill into each hero
  1(ctx, f, k) {
    for (let j = 0; j < f.hs.length; j++) { const h = f.hs[j]; if (!h || h.dead) continue;
      for (let i = 0; i < 3; i++) { const q = k01((k - 0.1 - i * 0.08 - j * 0.04) / 0.6); if (q <= 0 || q >= 1) continue; const e = q * q * (3 - 2 * q), bend = (hash(f.seed, j * 3 + i) - 0.5) * 120 * Math.sin(Math.PI * q);
        const dx = h.x - f.x, dy = h.y - f.y, L = Math.hypot(dx, dy) || 1, px = f.x + dx * e - dy / L * bend, py = f.y + dy * e + dx / L * bend;
        inkDisc(ctx, px, py, 5 * (1 - 0.3 * q), i ? XPC[2] : XPC[1]); }
      const p = k01((k - 0.62 - j * 0.04) / 0.25); if (p > 0 && p < 1) lit(ctx, () => glowDisc(ctx, h.x, h.y, rOf({ u: h }) * 1.3, XPC[1], 0.4 * (1 - p))); }
  },
  // 2 Orb: one orb rises off the kill, hangs, and splits into a streak to each hero
  2(ctx, f, k) {
    const [ox, oy] = upP(f.x, f.y, 22 * easeOut(k01(k / 0.3)));
    if (k < 0.45) { lit(ctx, () => glowDisc(ctx, ox, oy, 16, XPC[1], 0.6)); inkDisc(ctx, ox, oy, 6 * easeOut(k01(k / 0.15)), XPC[1]); ctx.fillStyle = XPC[2]; ctx.beginPath(); ctx.arc(ox - 1.5, oy - 1.5, 2.2, 0, TAU); ctx.fill(); return; }
    const q = k01((k - 0.45) / 0.45);
    for (const h of f.hs) { if (!h || h.dead) continue; const e = q * q, hx = ox + (h.x - ox) * e, hy = oy + (h.y - oy) * e, tx = ox + (h.x - ox) * Math.max(0, e - 0.25), ty = oy + (h.y - oy) * Math.max(0, e - 0.25);
      if (q < 1) inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); }, XPC[1], 3.2); }
  },
  // 3 Rise: a few motes drift straight up off the kill, twinkling, towards the bar at the top
  3(ctx, f, k) {
    for (let i = 0; i < 5; i++) { const q = k01((k - i * 0.06) / 0.8); if (q <= 0 || q >= 1) continue; const [px, py] = upP(f.x + (hash(f.seed, i) - 0.5) * 30, f.y + (hash(i, f.seed) - 0.5) * 16, 8 + 70 * q * q);
      ctx.save(); ctx.globalAlpha *= Math.min(1, (1 - q) * 3); if (Math.sin(q * 30 + i) > -0.3) glint(ctx, px, py, 4.5 * (1 - 0.3 * q), q * 3, i % 2 ? XPC[2] : XPC[1]); else inkDisc(ctx, px, py, 2.4, XPC[1]); ctx.restore(); }
  },
};
const LEVEL = {
  // 1 Pillar: a column of gold light rises out of the hero, chevrons climbing it, gold sparks falling after
  1(ctx, f, k) {
    at(f); const R = rOf(f), H = 150 * easeOut(k01(k / 0.25)), fade = k01((1 - k) / 0.4);
    lit(ctx, () => { for (let i = 0; i < 6; i++) { const [px, py] = upP(f.x, f.y, R * 0.9 + H * i / 5); glowDisc(ctx, px, py, R * (1.3 - 0.12 * i), GOLD[1], 0.6 * fade); } });
    for (let i = 0; i < 3; i++) { const q = ((k * 1.6 + i / 3) % 1); if (k > 0.75) continue; const [px, py] = upP(f.x, f.y, R * 0.3 + H * q); ctx.save(); ctx.globalAlpha *= Math.min(1, Math.sin(Math.PI * q) * 1.6); chevron(ctx, px, py, 12, GOLD[1]); ctx.restore(); }
    for (let i = 0; i < 8; i++) { const q = k01((k - 0.3 - hash(f.seed, i) * 0.3) / 0.5); if (q <= 0 || q >= 1) continue; const ox = (hash(i, f.seed) - 0.5) * R * 3, [px, py] = upP(f.x + (view.rot ? 0 : ox), f.y + (view.rot ? ox : 0), H * (0.9 - 0.8 * q)); ctx.save(); ctx.globalAlpha *= 1 - q; glint(ctx, px, py, 6.5, q * 4 + i, GOLD[2]); ctx.restore(); }
  },
  // 2 Burst: gold rays shoot out from the hero's edge, then confetti flutters down round it
  2(ctx, f, k) {
    at(f); const R = rOf(f), e = easeOut(k01(k / 0.35));
    if (k < 0.45) { ctx.save(); ctx.globalAlpha *= 1 - k / 0.45; for (let i = 0; i < 12; i++) { const c = i / 12 * TAU, r0 = R + 8 + 20 * e, r1 = r0 + 26 * (1 - k / 0.45); inked(ctx, () => wedgePath(ctx, f.x, f.y, c, r0, r1, 6 * (1 - k / 0.45) + 1), i % 2 ? GOLD[1] : GOLD[2]); } ctx.restore(); }
    const CF = ['#FFD45A', '#FFFFFF', '#9FE3FF', '#FF8AB8', '#A9D47A'];
    for (let i = 0; i < 16; i++) { const q = k01((k - 0.15) / 0.85); if (q <= 0 || q >= 1) continue; const c = hash(f.seed, i) * TAU, d = R * (1 + 1.6 * hash(i, f.seed)), [px, py] = upP(f.x + Math.cos(c) * d, f.y + Math.sin(c) * d * 0.6, R * 2.4 * (1 - q) - R * 0.4 * q);
      ctx.save(); ctx.globalAlpha *= Math.min(1, (1 - q) * 3); ctx.translate(px, py); ctx.rotate(q * 9 + i); ctx.scale(1, Math.cos(q * 14 + i)); inked(ctx, () => { ctx.beginPath(); ctx.rect(-3.5, -2.2, 7, 4.4); }, CF[i % CF.length]); ctx.restore(); }
  },
  // 3 Crest: a gold up-arrow pops over the hero's head and bobs, glints twinkling round it
  3(ctx, f, k) {
    at(f); const R = rOf(f), pop = k < 0.15 ? easeOut(k / 0.15) * 1.25 : 1.25 - 0.25 * k01((k - 0.15) / 0.2), [px, py] = upP(f.x, f.y, R + 30 + 6 * Math.sin(k * 9)), fade = k01((1 - k) / 0.3), s = 15 * pop;
    ctx.save(); ctx.globalAlpha *= fade;
    upright(ctx, px, py, () => inked(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -s * 1.2); ctx.lineTo(s, 0); ctx.lineTo(s * 0.42, 0); ctx.lineTo(s * 0.42, s * 1.1); ctx.lineTo(-s * 0.42, s * 1.1); ctx.lineTo(-s * 0.42, 0); ctx.lineTo(-s, 0); ctx.closePath(); }, GOLD[1]));
    for (let i = 0; i < 6; i++) { const c = i / 6 * TAU + k * 2, tw = Math.max(0, Math.sin(k * 18 + i * 2)); if (tw < 0.1) continue; glint(ctx, px + Math.cos(c) * s * 2.1, py + Math.sin(c) * s * 1.6, 4 * tw + 1, c, GOLD[2]); }
    ctx.restore();
  },
};
function levelGround(ctx, f, k) { // the floor under a levelling hero lit gold (soft, no edge)
  at(f); const R = rOf(f) * 1.8 * easeOut(k01(k / 0.2)); ctx.save(); ctx.globalAlpha *= 0.5 * k01((1 - k) / 0.4); glowDisc(ctx, f.x, f.y, R, GOLD[1], 0.8); ctx.restore();
}

// ---------------------------------------------------------------- the body's reaction (render.js hooks)
const typeCol = (u) => (u._hfTy === 'magic' ? (ELC[u._hfEl] || ARCANE)[1] : u._hfTy === 'blunt' ? '#FFF6E6' : u._hfSide === 'hero' ? '#E8F0FA' : '#FFC8B8');
function frame(ctx, u, w) { // squashed and shoved along the blow (render.js unitFrame); Jolt shoves harder and shakes; a dodge leans aside
  let done = false;
  if (O.miss && u._hfDodgeT != null) { const q = (w.time - u._hfDodgeT) / 0.38; if (q >= 0 && q < 1) { const d = Math.sin(Math.PI * Math.min(1, q * 1.6)) * (1 - q * 0.3) * (u.vr || 20) * 0.8, b = u._hfDodgeA; ctx.translate(Math.cos(b) * d, Math.sin(b) * d); ctx.rotate(Math.sin(Math.PI * q) * 0.18 * u._hfDodgeS); done = true; } }
  if (!(u.hitT > 0) || !O.struck) return done;
  const k = u.hitT / 0.16, jolt = O.struck === 3;
  ctx.rotate(u.hitA);
  if (jolt) { const sh = Math.sin(u.hitT * 140) * 2.6 * k; ctx.translate((u.hitBlock ? 4 : 13) * Math.pow(k, 0.7), sh); ctx.scale(1 - 0.28 * k, 1 + 0.17 * k); }
  else { ctx.translate((u.hitBlock ? 3 : 8) * k, 0); ctx.scale(1 - 0.2 * k, 1 + 0.12 * k); }
  ctx.rotate(-u.hitA);
  return true;
}
function wash(u, w, struck, washesOf) {
  let out;
  if (struck) {
    const q = Math.min(1, u.flashT / 0.12);
    out = O.struck === 1 ? [] : O.struck === 2 ? [[typeCol(u), 0.42 * q]] : O.struck === 3 ? [['#FF5A4A', 0.3 * q]] : [['#FFFFFF', 0.55 * q]];
  } else out = washesOf(u, w);
  if (O.heal === 3 && u._hfGlowT != null) { const q = (w.time - u._hfGlowT) / 0.7; if (q >= 0 && q < 1) out = [...out, ['#9BE07A', (u._hfGlowBig ? 0.45 : 0.32) * Math.sin(Math.PI * Math.min(1, q * 1.4))]]; }
  if (O.buff === 2 && u._hfBuffT != null) { const q = (w.time - u._hfBuffT - 0.3) / 0.35; if (q >= 0 && q < 1) out = [...out, [u._hfBuffCol, 0.4 * (1 - q)]]; }
  return out;
}
function rim(u, w, struck) {
  if (O.struck !== 1 || u.downed || !(u.hitT > 0.05)) return null;
  return { color: typeCol(u) === '#FFF6E6' ? '#FFFFFF' : typeCol(u), a: Math.min(1, (u.hitT - 0.05) / 0.06) };
}

// ---------------------------------------------------------------- drawing
const DRAWS = { mark: MARK, crit: CRIT, block: BLOCK, miss: MISS, heal: HEALS, buff: BUFFS, death: DEATH, coin: COINS, xp: XPS, level: LEVEL };
function draw(ctx, dt) {
  for (const f of fxl) {
    f.t += dt; const k = k01(f.t / f.max), set = DRAWS[f.type], fn = set && set[O[f.type]];
    if (!fn) continue;
    ctx.save(); try { fn(ctx, f, k); } finally { ctx.restore(); }
  }
  for (let i = fxl.length - 1; i >= 0; i--) if (fxl[i].t >= fxl[i].max) fxl.splice(i, 1);
}
function ground(ctx) {
  for (const f of fxl) {
    const k = k01(f.t / f.max);
    ctx.save();
    if (f.type === 'death') deathGround(ctx, f, k);
    else if (f.type === 'level' && O.level !== 2) levelGround(ctx, f, k);
    ctx.restore();
  }
}

if (ON) {
  HIT_OWN.note = note; HIT_OWN.draw = draw; HIT_OWN.ground = ground;
  if (O.mark) HIT_OWN.mark = true;
  if (O.death) HIT_OWN.death = true;
  if (O.coin) HIT_OWN.coin = true;
  if (O.struck || O.miss) HIT_OWN.frame = frame;
  if (O.struck) HIT_OWN.rim = rim;
  HIT_OWN.wash = wash;
  if (O.blast) {
    HIT_OWN.blast = (ctx, m, k) => { const fn = BLAST[O.blast]; if (!fn) return false; ctx.save(); try { fn(ctx, m, k); } finally { ctx.restore(); } return true; };
    HIT_OWN.blastGround = (ctx, m, k) => { const fn = BLAST_G[O.blast]; if (fn) fn(ctx, m, k); };
    HIT_OWN.blastT = (t) => (t.r >= 90 ? 0.75 : 0.55) * (t.ab === 'fireball' ? 1.1 : 1);
  }
}
