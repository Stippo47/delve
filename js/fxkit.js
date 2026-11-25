// The round 8 effects kit (lane V): one look for every attack and ability (docs/FX-STYLE.md).
//   - melee arcs shaped to the weapon (a sweeping crescent, a stab, a heavy blow, a scythe, claws, a bite)
//   - each hero ability's signature (fxtag.js tags what an ability makes; 'sig' fx carry the cast itself)
//   - body effects read off a unit's state (Rage's steam, Whirl's flail, Guard's tether, leeches, leaves...)
//   - impacts where shots stop, the burst when an enemy's danger zone strikes, blasts
// Everything here is drawn by the renderer from what the sim leaves in the world; nothing here changes the game.
import { INK, TAU, clamp } from './util.js';
import { OUTLINE, view } from './render.js';
import { hash, rgba, upright, upVec, inked, inkLine, flame, blob, star, glowDisc, bolt, easeOut, leaf, snowBurst } from './fx.js';
import { drawPuddle } from './puddles.js';
import { installFx3 } from './fx3.js'; // round 15 (lane N): the six newer heroes' looks
import { installFxWater } from './fx-water.js'; // round 17 (lane water17): the Water Mage's looks
import { SIG2, installFx2, SLAM2, IMPACT2D } from './fx2.js'; // (lane H2, round 13: SLAM2 / IMPACT2D, a hero's own slam and shot-burst looks)
import { variant } from './fxvar.js';

// ---------------------------------------------------------------- palette (FX-STYLE.md): dark, main, light, core
export const EL = {
  steel: ['#8A94A6', '#C9D2DE', '#EEF3F8', '#FFFFFF'], earth: ['#7A6A58', '#A99C8B', '#E9DDC2', '#FFF8E6'],
  fire: ['#C8401F', '#FF8A3D', '#FFC85A', '#FFF0B0'], frost: ['#4A9CC8', '#9FDDF6', '#DDF6FF', '#FFFFFF'],
  storm: ['#5B6C9A', '#FFE66B', '#FFF7C2', '#FFFFFF'], holy: ['#C9A44A', '#F2C14E', '#FFE7A0', '#FFFBEA'],
  nature: ['#3F7A2E', '#6FA046', '#A9D47A', '#E4F5C8'], poison: ['#4F7A22', '#7DB83A', '#B5DE5E', '#E6F7B0'],
  shadow: ['#2E2440', '#5A4A7A', '#9B86C9', '#E2D8FF'], necro: ['#4E3A78', '#9B7BD6', '#D9C8FF', '#F4EEFF'],
  blood: ['#7A2C40', '#C8453D', '#FF8A7A', '#FFE0DA'], water: ['#2F7FB8', '#5DB7E0', '#BFE9F8', '#F2FBFF'],
  song: ['#C88A20', '#FFD45A', '#FFF0B0', '#FFFFFF'], bone: ['#A99C8B', '#EDE4CD', '#FFF8EA', '#FFFFFF'],
};
const sm = (k) => k * k * (3 - 2 * k);
const k01 = (v) => clamp(v, 0, 1);
function lit(ctx, fn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }
function disc(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill(); }
function inkDisc(ctx, x, y, r, col) { inked(ctx, () => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); }, col); }

// A crescent band from angle aT (its pointed tail) to aH (its rounded head), outer radius R, thickest (th) at the head.
// pointed: the head ends in a point instead of a round cap (round 9: the greatsword's end was "too round").
function bandPath(ctx, cx, cy, R, aT, aH, th, pointed = false) {
  const span = aH - aT, n = Math.max(6, Math.ceil(Math.abs(span) * 9)), dir = span >= 0 ? 1 : -1;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = aT + span * i / n; ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
  const rm = R - th / 2;
  if (pointed) { const b = aH + dir * Math.min(0.22, th / R * 0.9); ctx.lineTo(cx + Math.cos(b) * (R - th * 0.35), cy + Math.sin(b) * (R - th * 0.35)); }
  else ctx.arc(cx + Math.cos(aH) * rm, cy + Math.sin(aH) * rm, th / 2, aH, aH + Math.PI * dir, dir < 0);
  for (let i = n; i >= 0; i--) { const s = i / n, a = aT + span * s; const r = R - th * Math.pow(s, 0.85); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  ctx.closePath();
}
function slashBand(ctx, cx, cy, R, aT, aH, th, main, core, pointed = false) {
  if (Math.abs(aH - aT) < 0.02 || th < 0.6) return;
  inked(ctx, () => bandPath(ctx, cx, cy, R, aT, aH, th, pointed), main);
  ctx.fillStyle = core; bandPath(ctx, cx, cy, R - th * 0.1, aT + (aH - aT) * 0.3, aH, th * 0.36, pointed); ctx.fill();
}
// A pointed streak from (x,y) along a: base at r0, tip at r1, wd wide at its fattest (near the tip).
function streakPath(ctx, x, y, a, r0, r1, wd) {
  const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c, L = r1 - r0;
  const bx = x + c * r0, by = y + s * r0, tx = x + c * r1, ty = y + s * r1, mx = x + c * (r0 + L * 0.72), my = y + s * (r0 + L * 0.72);
  ctx.beginPath(); ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(mx + nx * wd * 1.25, my + ny * wd * 1.25, tx, ty);
  ctx.quadraticCurveTo(mx - nx * wd * 1.25, my - ny * wd * 1.25, bx, by); ctx.closePath();
}
function streak(ctx, x, y, a, r0, r1, wd, main, core) {
  if (r1 - r0 < 1) return;
  inked(ctx, () => streakPath(ctx, x, y, a, r0, r1, wd), main);
  ctx.fillStyle = core; streakPath(ctx, x, y, a, r0 + (r1 - r0) * 0.35, r1 - 1, wd * 0.38); ctx.fill();
}
// a vertical thing on the floor seen from above leans up the screen: a spike, a post, a flame
function spike(ctx, x, y, h, wd, col, hi) {
  upright(ctx, x, y, () => {
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-wd, 0); ctx.lineTo(0, -h); ctx.lineTo(wd, 0); ctx.quadraticCurveTo(0, wd * 0.6, -wd, 0); ctx.closePath(); }, col);
    if (hi) { ctx.fillStyle = hi; ctx.beginPath(); ctx.moveTo(-wd * 0.7, -1); ctx.lineTo(0, -h + 2); ctx.lineTo(-wd * 0.05, -1); ctx.closePath(); ctx.fill(); }
  });
}
function crack(ctx, x, y, a, len, seed, wd = 3, col = 'rgba(43,34,48,0.55)') {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); let px = x, py = y, b = a;
  for (let i = 1; i <= 4; i++) { b += (hash(seed, i) - 0.5) * 0.9; const d = len / 4; px += Math.cos(b) * d; py += Math.sin(b) * d; ctx.lineTo(px, py); }
  ctx.stroke(); ctx.restore();
}
export function dustPuffs(ctx, x, y, r, k, seed, n = 7, col = '#E9DDC2') {
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < n; i++) { const a = (i + hash(seed, i)) / n * TAU, d = r * (0.4 + 0.75 * easeOut(k)) * (0.8 + 0.4 * hash(i, seed)), pr = r * 0.22 * (1 - 0.6 * k) + 2;
    inkDisc(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, pr, i % 3 ? col : '#FFF8E6'); }
  ctx.restore();
}
function noteShape(ctx, s) {
  ctx.beginPath(); ctx.ellipse(-2 * s, 5 * s, 5 * s, 3.8 * s, -0.4, 0, TAU); ctx.rect(1.4 * s, -10 * s, 3 * s, 15 * s);
  ctx.moveTo(4.4 * s, -10 * s); ctx.quadraticCurveTo(12 * s, -7 * s, 9 * s, 0); ctx.quadraticCurveTo(9 * s, -5 * s, 4.4 * s, -5 * s); ctx.closePath();
}
function boneShape(ctx, L, wdt) {
  ctx.beginPath(); ctx.rect(-L / 2, -wdt / 2, L, wdt);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const cx = sx * L / 2, cy = sy * wdt * 0.62, r = wdt * 0.75; ctx.moveTo(cx + r, cy); ctx.arc(cx, cy, r, 0, TAU); }
}
function shieldShape(ctx, s) {
  ctx.beginPath(); ctx.moveTo(0, -12 * s); ctx.quadraticCurveTo(9 * s, -11 * s, 11 * s, -8 * s); ctx.quadraticCurveTo(11 * s, 6 * s, 0, 13 * s);
  ctx.quadraticCurveTo(-11 * s, 6 * s, -11 * s, -8 * s); ctx.quadraticCurveTo(-9 * s, -11 * s, 0, -12 * s); ctx.closePath();
}

// ---------------------------------------------------------------- weapons
const WEAPON = {
  paladin: 'blade', tower: 'heavy', wildmane: 'great', berserker: 'flail', granny: 'scythe', twinfang: 'twin',
  wolf: 'bite', rat: 'bite', bat: 'bite', spiderHunter: 'bite', slime: 'smack', slimeSmall: 'smack', fireSlime: 'smack',
  ghost: 'claw', gaper: 'twinBlade', boss: 'heavy', boneKing: 'heavy', troll: 'heavy',
};
export function weaponOf(u) {
  const d = u.def; if (WEAPON[u.kind]) return WEAPON[u.kind];
  if (d.weapon) return d.weapon; // heroes2.js says its own
  if (d.attackAnim === 'thrust') return 'thrust';
  if (!d.art || !d.attackAnim) return 'claw';
  if (d.heavy || d.mass >= 2.8) return 'heavy';
  return 'blade';
}
const SLASH_COL = { hero: ['#DCE3EC', '#FFFFFF'], enemy: ['#FFCDBD', '#FFF6F2'], scythe: ['#EDE4CD', '#FFFFFF'], smack: ['#8FD8C0', '#E8FFF6'], fire: ['#FF8A3D', '#FFF0B0'], ghost: ['#BFE6FF', '#FFFFFF'] };

// ---------------------------------------------------------------- the renderer-side marks (impacts, arcs, strikes)
const marks = [];
const push = (m) => { m.t = 0; marks.push(m); if (marks.length > 160) marks.splice(0, marks.length - 160); };

// Called once a frame before drawing: turns what changed in the world into marks.
export function noteWorld(w) {
  // melee swings (sim.js meleeSwing's 'swing' telegraph) become weapon arcs
  for (const t of w.telegraphs) {
    if (t._seen) continue; t._seen = true;
    if (t.type === 'swing') {
      const u = t.src, shape = u ? weaponOf(u) : 'blade';
      // which hand: parts.js counts a blow when it first draws the new anim, which is after this, so look one ahead
      // (round 9: Twinfang's stabs came from the wrong dagger)
      const n = u ? (u._n || 0) + (u.anim && u.anim !== u._lastAnim ? 1 : 0) : 0, odd = n % 2;
      const team = u && u.team === 'hero' ? 'hero' : 'enemy';
      let col = SLASH_COL[team];
      if (shape === 'scythe') col = SLASH_COL.scythe; else if (shape === 'smack') col = u && u.kind === 'fireSlime' ? SLASH_COL.fire : SLASH_COL.smack; else if (u && u.kind === 'ghost') col = SLASH_COL.ghost;
      if (t.aoe) { push({ type: 'slam', u, x: t.aoe.x, y: t.aoe.y, r: t.aoe.r, a: t.a, max: 0.42, seed: Math.round(t.x * 7 + t.y), look: t.aoe.look || (u && u.def.style && u.def.style.slam) }); continue; } // (lane H2: look, a hero's own slam: fx2 SLAM2)
      // arm-l is on the +normal side of the facing, arm-r on the -normal side (the art's left/right, front = +y)
      const sty = (u && u.def.style) || {}, back = sty.backhand || sty.flip ? -1 : 1; // lane H2 (round 13): a backhand swing (Dame, Pirate), a mirrored sprite (Griffon)
      push({ type: 'slash', u, x: t.x, y: t.y, R: t.r, a: t.a, arc: t.arc, shape, dir: ((shape === 'twin' || shape === 'twinBlade') && odd ? -1 : 1) * back, side: odd ? 1 : -1, col, r0k: sty.reach0,
        max: shape === 'bite' && u && u.kind === 'wolf' ? 0.5 : shape === 'bite' ? 0.42 /* round 14: open, then the snap */ : shape === 'great' ? 0.22 : shape === 'heavy' ? 0.24 : 0.28, seed: Math.round(t.x * 7 + t.y) });
    } else if (t.type === 'blast') {
      push({ type: 'blast', x: t.x, y: t.y, r: t.r, color: t.color || '#FFB347', ab: t.ab, max: t.ab === 'fireball' ? 0.6 : 0.45, seed: Math.round(t.x + t.y * 3) });
    }
  }
  // shots that are gone burst where they stopped
  const now = new Set(w.projectiles);
  if (w._proj) for (const p of w._proj) if (!now.has(p) && !p.lab) {
    if (p.noHit) continue; // a lobbed thing: its landing is the danger zone's strike
    push({ type: 'impact', kind: p.necro ? 'soulFlame' : p.kind, ab: p.ab, x: p.x, y: p.y, a: Math.atan2(p.vy, p.vx), col: p.color, max: p.ab ? 0.45 : 0.32, seed: Math.round(p.x * 3 + p.y) });
    if (p.ab === 'frostArrow') snowBurst(p.x, p.y, 44, 18); // round 13: snow thrown out where it bursts, hanging a moment
  }
  w._proj = now;
  // a danger zone striking: a burst shaped to its kind (lane B, bosses3: z.quiet: the boss draws its own blow)
  for (const z of w.danger || []) if (z.t <= 0 && !z._struck) { z._struck = true; if (!z.cancelled && !z.quiet) push({ type: 'strike', z, kind: z.kind, max: 0.55, seed: Math.round((z.x ?? z.x1) * 5 + (z.y ?? z.y1)) }); }
  for (const u of w.units) {
    // an enemy's ground slam (sim.js 'slam' act) lands
    const slam = u.act && u.act.type === 'slam';
    if (u._slam && !slam && !u.downed) push({ type: 'quake', x: u.x, y: u.y, r: 125, max: 0.8, seed: u.id, col: EL.earth });
    u._slam = slam;
    // Granny's Old Bones saved her
    if (u.kit && u.kit.oldBonesUsed && !u._oldBones) push({ type: 'oldBones', u, x: u.x, y: u.y, max: 1.1, seed: u.id, ha: u.hitA });
    if (u.kit) u._oldBones = !!u.kit.oldBonesUsed;
  }
}

export function drawMarks(ctx, dt, layer) {
  for (const m of marks) {
    if (layer === 'air') m.t += dt;
    const k = k01(m.t / m.max);
    ctx.save();
    if (layer === 'ground') { if (m.type === 'quake') quake(ctx, m.x, m.y, m.r, k, m.seed, m.col); else if (m.type === 'strike') strikeGround(ctx, m, k); else if (m.type === 'slam') slamGround(ctx, m, k); else if (m.type === 'oldBones') oldBonesGround(ctx, m, k); }
    else switch (m.type) {
      case 'slash': slash(ctx, m, k); break;
      case 'slam': slamAir(ctx, m, k); break;
      case 'impact': impact(ctx, m, k); break;
      case 'strike': strike(ctx, m, k); break;
      case 'blast': blast(ctx, m, k); break;
      case 'oldBones': oldBones(ctx, m, k); break;
    }
    ctx.restore();
  }
  if (layer === 'air') for (let i = marks.length - 1; i >= 0; i--) if (marks[i].t >= marks[i].max) marks.splice(i, 1);
}

// ---------------------------------------------------------------- melee arcs
function slash(ctx, m, k) {
  const u = m.u, live = u && !u.dead;
  const x = live ? u.x : m.x, y = live ? u.y : m.y;
  const [main, core] = m.col;
  const sh = m.shape;
  if (sh === 'palm') { const px = x + Math.cos(m.a) * (m.R - 4), py = y + Math.sin(m.a) * (m.R - 4), e = easeOut(k01(k / 0.5)); if (k < 0.25) lit(ctx, () => glowDisc(ctx, px, py, 22, '#FFFFFF', 0.6 * (1 - k / 0.25))); ctx.save(); ctx.globalAlpha *= 1 - k * k; for (let i = 0; i < 5; i++) { const b = m.a + (i - 2) * 0.55, d = 4 + 16 * e; inkDisc(ctx, px + Math.cos(b) * d, py + Math.sin(b) * d, 5 * (1 - 0.6 * k) + 1.5, i % 2 ? m.col[0] : m.col[1]); } ctx.restore(); return; } // lane H2 (round 13): the Monk's fists, soft bursts of force
  if (sh === 'fork') { const vr = u ? u.vr : 20; for (let i = -1; i <= 1; i++) { const r0 = (u ? u.r : 20) * 0.7, r1 = m.R + 16, tip = r0 + (r1 - r0) * easeOut(k01(k / 0.3)), base = r0 + (tip - r0) * sm(k01((k - 0.2) / 0.8)), nx = -Math.sin(m.a) * i * 7, ny = Math.cos(m.a) * i * 7; streak(ctx, x + nx, y + ny, m.a, base, tip, 6 * (1 - 0.35 * k), m.col[0], m.col[1]); } return; } // lane H2 (round 13): the Haymaker's pitchfork, three tines
  if (sh === 'thrust' || sh === 'twin') {
    // round 9: the stab starts at the dagger's point, in the hand that strikes, and runs on along the line of it
    const vr = u ? u.vr : 20, twin = sh === 'twin';
    const r0 = twin ? vr * 1.25 : (u ? u.r : 20) * (m.r0k || 0.55), r1 = m.R + (twin ? 22 : 16); // (lane H2: style.reach0, the stab starts further out: Bulwark)
    const tip = r0 + (r1 - r0) * easeOut(k01(k / 0.3)), base = r0 + (tip - r0) * sm(k01((k - 0.2) / 0.8));
    const off = twin ? m.side * vr * 0.62 : 0, nx = -Math.sin(m.a) * off, ny = Math.cos(m.a) * off;
    const a = twin ? m.a - m.side * 0.12 : m.a; // a hooked dagger stabs a little inward
    if (twin && k < 0.3) lit(ctx, () => glowDisc(ctx, x + nx + Math.cos(a) * r0, y + ny + Math.sin(a) * r0, 12, '#FFFFFF', 0.5 * (1 - k / 0.3)));
    streak(ctx, x + nx, y + ny, a, base, tip, (twin ? 5.5 : 9) * (1 - 0.35 * k), main, core);
    return;
  }
  if (sh === 'bite' || sh === 'claw') {
    const reach = m.R * 0.85, px = x + Math.cos(m.a) * reach, py = y + Math.sin(m.a) * reach, s = clamp(m.R / 40, 0.6, 1.4);
    if (sh === 'bite' && u && u.kind === 'wolf') { wolfBite(ctx, m, k, x, y); return; } // round 13: the wolf's own bite (three takes, fxvar.js)
    if (sh === 'bite') { // round 9: two jaws of fangs snapping shut on the target
      // round 14 (the designer: "Have the chomp effect of bites start open, and rotate 90 degrees"): the jaws show wide
      // open first (they open a touch wider for a beat), then snap; and the whole chomp is turned a quarter round, so
      // the jaws close along the line of the bite (one on the biter's side, one beyond), not across it
      const open = easeOut(k01(k / 0.22)), shut = k < 0.36 ? 0 : easeOut(k01((k - 0.36) / 0.14)), gap = (1 - shut) * (13 + 6 * open) * s + 1.5, fade = k01((1 - k) / 0.4);
      const b = m.a + Math.PI / 2; // (the old chomp's angle, turned 90 degrees)
      ctx.globalAlpha *= fade * Math.min(1, 0.35 + open);
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.translate(px - Math.sin(b) * gap * sd, py + Math.cos(b) * gap * sd); ctx.rotate(b + (sd > 0 ? Math.PI : 0)); // fangs (+y) towards the other jaw
        // a jaw: a curved gum line with four fangs pointing at the other jaw
        inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-14 * s, -2 * s); ctx.quadraticCurveTo(0, 6 * s * -sd * 0 - 5 * s, 14 * s, -2 * s);
          for (let i = 3; i >= 0; i--) { const fx0 = -11 * s + i * 7.4 * s; ctx.lineTo(fx0 + 3 * s, -1 * s); ctx.lineTo(fx0, 6 * s); ctx.lineTo(fx0 - 3 * s, -1 * s); }
          ctx.closePath(); }, '#FFF8F0');
        ctx.restore();
      }
      if (shut > 0.95 && k < 0.66) inked(ctx, () => star(ctx, px, py, 10 * (1.3 - k), 4, 0.3, m.a), '#FFFFFF');
    } else { // three claw rakes across the front
      const fade = k01((1 - k) / 0.45);
      ctx.globalAlpha *= fade;
      for (let i = -1; i <= 1; i++) {
        const g = easeOut(k01((k - (i + 1) * 0.06) / 0.3)), b = m.a + 1.15 * m.dir, len = 26 * s;
        const ox = px + Math.cos(m.a) * i * 9 * s - Math.cos(b) * len / 2, oy = py + Math.sin(m.a) * i * 9 * s - Math.sin(b) * len / 2;
        if (g > 0.05) streak(ctx, ox, oy, b, 0, len * g, 3.4 * s, main, core);
      }
    }
    return;
  }
  // a crescent sweeping across the weapon's arc, in the way the arm moves
  let th = 18, R = m.R, extra = 0.4, span0 = m.arc, pointed = false;
  if (sh === 'heavy') { th = 26; R *= 0.96; extra = 0.15; }
  else if (sh === 'great') { th = 22; R *= 1.04; extra = 0; span0 = m.arc * 0.72; pointed = true; } // round 9: narrower, ends in a point
  else if (sh === 'flail') { th = 18; R *= 1.04; extra = 0.45; }
  else if (sh === 'scythe') { th = 20; R *= 1.12; extra = 0.7; } // round 9: a wider line
  else if (sh === 'smack') { th = 20; R *= 0.9; extra = 0; }
  else if (sh === 'twinBlade') { th = 16; extra = 0.3; }
  const span = span0 + extra, a0 = m.a - m.dir * span / 2;
  // the heavy blow: round 9 "remove that last frame": the tail catches the head sooner and nothing lingers after
  const hk = sh === 'heavy' ? 0.36 : 0.42, tk = sh === 'heavy' ? 0.12 : 0.18;
  const head = a0 + m.dir * span * easeOut(k01(k / hk)), tail = a0 + m.dir * span * sm(k01((k - tk) / (1 - tk)));
  slashBand(ctx, x, y, R, tail, head, th * (1 - 0.3 * k), main, core, pointed);
  const hx = x + Math.cos(head) * (R - th * 0.4), hy = y + Math.sin(head) * (R - th * 0.4);
  if (sh === 'flail') inked(ctx, () => { star(ctx, hx, hy, 11, 8, 0.62, k * 9); }, '#8D949C');
}
// The wolf's bite (Call Wolf). Round 9: "The bite visual also looks bad"; round 10, of two rows of fangs: "Work on the
// bite effect... U are close"; round 13, of Jaws, Chomp, Rake and Snap: "none of them". All four were a small tooth
// glyph, turned to the wolf's heading and laid over its own head, there for three frames: they read as a scrap of white.
// These are drawn on the one bitten (not on the wolf), as big as it is, and they take their time (noteWorld gives a
// wolf's bite 0.5 s). Three takes that differ in kind (js/fxvar.js, ?v_wolfBite=N):
//   1 Fangs  the "close" one done properly: two jaws, gums and white teeth with long canines, open wide either side of
//            the foe, snap shut on it, hold with a shake, and go
//   2 Crunch no teeth at all: the bite is its mark: the foe is pinched (a white burst squeezed flat along the wolf's
//            heading) and two rows of red tooth holes are left on it
//   3 Clamp  two great curved fangs swing shut on it from either side like pincers and cross
function wolfBite(ctx, m, k, x, y) {
  const u = m.u, tg = u && u.target && !u.target.dead && Math.hypot(u.target.x - x, u.target.y - y) < m.R + 60 ? u.target : null;
  const px = tg ? tg.x : x + Math.cos(m.a) * (m.R + 8), py = tg ? tg.y : y + Math.sin(m.a) * (m.R + 8), S = clamp(tg ? tg.vr : 20, 16, 30), v = variant('wolfBite');
  const shut = k < 0.18 ? 0 : easeOut(k01((k - 0.18) / 0.12)), fade = k01((1 - k) / 0.3), inn = k01(k / 0.1), bit = k01((k - 0.3) / 0.7);
  ctx.save(); ctx.translate(px, py); ctx.rotate(m.a);
  if (v === 2) { // Crunch
    if (k > 0.18) { const q = k01((k - 0.18) / 0.3);
      if (q < 1) { lit(ctx, () => { ctx.save(); ctx.scale(1.5, 0.55); glowDisc(ctx, 0, 0, S * 1.6, '#FFFFFF', 0.9 * (1 - q)); ctx.restore(); });
        ctx.save(); ctx.globalAlpha *= 1 - q;
        for (const sd of [-1, 1]) for (let i = -1; i <= 1; i++) { const b = sd > 0 ? i * 0.5 : Math.PI + i * 0.5, d = S * (0.7 + 0.9 * easeOut(q)); streak(ctx, Math.cos(b) * d, Math.sin(b) * d * 0.5, b, 0, S * 0.5 * (1 - q) + 4, 3, '#FFFFFF', '#FFF4E8'); }
        ctx.restore(); }
      ctx.save(); ctx.globalAlpha *= fade; // the holes it leaves: a row either side of the bite's line
      for (const sd of [-1, 1]) for (let i = -2; i <= 2; i++) inkDisc(ctx, i * S * 0.24, sd * S * (0.34 - 0.04 * i * i), (i === -2 || i === 2 ? 3 : 2.3) * (1 - 0.3 * bit), '#C8453D');
      ctx.restore(); }
    ctx.restore(); return;
  }
  if (v === 3) { // Clamp
    ctx.globalAlpha *= inn * fade;
    for (const sd of [-1, 1]) { ctx.save(); ctx.scale(1, sd); ctx.translate(-S * 0.95, -S * 1.05); ctx.rotate(-0.95 * (1 - shut) + 0.12 * shut);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-S * 0.1, -S * 0.34); ctx.quadraticCurveTo(S * 1.1, -S * 0.5, S * 1.5, S * 1.2); ctx.quadraticCurveTo(S * 0.75, S * 0.2, -S * 0.2, S * 0.22); ctx.closePath(); }, '#FFFDF6');
      ctx.fillStyle = '#E6DCC6'; ctx.beginPath(); ctx.moveTo(S * 1.42, S * 1.05); ctx.quadraticCurveTo(S * 0.75, S * 0.1, -S * 0.1, S * 0.12); ctx.quadraticCurveTo(S * 0.7, S * 0.36, S * 1.42, S * 1.05); ctx.closePath(); ctx.fill();
      ctx.restore(); }
    if (shut > 0.9 && k < 0.5) { const q = k01((k - 0.3) / 0.2); lit(ctx, () => glowDisc(ctx, S * 0.4, 0, S * 1.5, '#FFFFFF', 0.8 * (1 - q))); }
    ctx.restore(); return;
  }
  // 1 Fangs
  const shake = shut >= 1 && k < 0.6 ? Math.sin(k * 90) * 1.6 : 0, gap = (1 - shut) * S * 0.95 + S * 0.1;
  ctx.globalAlpha *= inn * fade; ctx.translate(0, shake);
  for (const sd of [-1, 1]) { ctx.save(); ctx.scale(1, sd); ctx.translate(0, -gap - S * 0.42);
    // the gum: a curved bar bowed away from the bite; the teeth hang from it towards the other jaw
    const teeth = () => { ctx.beginPath(); ctx.moveTo(-S, S * 0.1);
      for (let i = 0; i < 5; i++) { const x0 = -S + i * S * 0.4, big = i === 0 || i === 4, L = big ? S * 0.62 : S * 0.36; ctx.lineTo(x0 + S * 0.05, S * 0.1); ctx.lineTo(x0 + S * 0.2, S * 0.1 + L); ctx.lineTo(x0 + S * 0.35, S * 0.1); }
      ctx.lineTo(S, S * 0.1); ctx.lineTo(S, -S * 0.02); ctx.lineTo(-S, -S * 0.02); ctx.closePath(); };
    inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-S * 1.1, S * 0.14); ctx.quadraticCurveTo(0, -S * 0.42, S * 1.1, S * 0.14); ctx.lineTo(S * 1.02, -S * 0.1); ctx.quadraticCurveTo(0, -S * 0.66, -S * 1.02, -S * 0.1); ctx.closePath(); }, '#B8453F');
    inked(ctx, teeth, '#FFFDF6');
    ctx.restore(); }
  ctx.restore();
  if (shut >= 1 && k < 0.5) { const q = k01((k - 0.3) / 0.2); lit(ctx, () => glowDisc(ctx, px, py, S * 1.8, '#FFFFFF', 0.75 * (1 - q)));
    ctx.save(); ctx.globalAlpha *= 1 - q; for (const sd of [-1, 1]) inked(ctx, () => star(ctx, px + Math.cos(m.a) * sd * S * 1.15, py + Math.sin(m.a) * sd * S * 1.15, 7 * (1 - q) + 2, 4, 0.3, m.a), '#FFFFFF'); ctx.restore(); }
}
// The Berserker's flail (round 9): "his attack should be a radius on the ground in front of him. Can have spikey rings
// around it. Is an aoe attack. Small radius". The spiked head slams down; a ring of spikes and dust bursts round it.
function slamGround(ctx, m, k) {
  if (m.look && SLAM2[m.look]) { SLAM2[m.look](ctx, m, k, 'ground'); return; } // lane H2 (round 13)
  const e = easeOut(k01(k / 0.5)), R = m.r * (0.5 + 0.55 * e);
  // round 10 ("Simpler"): no spiky ring; a soft dent where the head lands, the blow's reach a faint dust edge
  ctx.save(); ctx.globalAlpha *= 1 - k;
  ctx.fillStyle = 'rgba(70,56,44,0.28)'; ctx.beginPath(); ctx.arc(m.x, m.y, R * 0.85, 0, TAU); ctx.fill();
  ctx.restore();
}
function slamAir(ctx, m, k) {
  if (m.look && SLAM2[m.look]) { SLAM2[m.look](ctx, m, k, 'air'); return; } // lane H2 (round 13)
  const e = easeOut(k01((k - 0.12) / 0.6));
  // round 10 ("Simpler"): a small flash and a ring of dust; no spikes thrown up. Round 13 ("Don't show spike ball on the
  // ground"): no second flail head drawn where the blow lands; the one in his hand is the only one.
  if (k < 0.14) return; // the arm is still coming down
  if (k < 0.26) lit(ctx, () => glowDisc(ctx, m.x, m.y, m.r * 1.1, '#FFF4DC', 0.5 * (1 - (k - 0.14) / 0.12)));
  ctx.save(); ctx.globalAlpha *= 1 - k * k;
  dustPuffs(ctx, m.x, m.y, m.r, e, m.seed, 6);
  ctx.restore();
}

// ---------------------------------------------------------------- impacts where shots stop
export const IMPACT_ALIAS = {}; // kinds2: new shots that burst like an older kind (a crossbow bolt like an arrow)
export const IMPACT_EL = { arrow: 'steel', fireArrow: 'fire', fireball: 'fire', shard: 'frost', icicle: 'frost', dagger: 'steel', vial: 'poison', thorn: 'nature', note: 'song', bone: 'bone', water: 'water',
  spark: 'fire', frostbolt: 'frost', orb: 'holy', zeus: 'storm', cluster: 'poison', soulFlame: 'poison' };
function impact(ctx, m, k) {
  const big = !!m.ab, kind = IMPACT_ALIAS[m.kind] || m.kind, e = easeOut(k), x = m.x, y = m.y, a = m.a;
  if (IMPACT2D[m.kind]) { IMPACT2D[m.kind](ctx, m, k); return; } // lane H2 (round 13): a new shot's own burst (fx2.js)
  const el = EL[kind === 'bolt' ? null : IMPACT_EL[kind]] || null;
  const col = m.col || (el ? el[1] : '#C9A7FF'), light = el ? el[2] : '#FFFFFF';
  const S = big ? 1.7 : 1;
  if (kind === 'cluster') return; // its pop is its own fx (fx.js 'pop')
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, x, y, (16 + 12 * e) * S, kind === 'arrow' || kind === 'dagger' ? '#FFF4DC' : col, 0.45 * (1 - k / 0.3)));
  ctx.globalAlpha *= 1 - k * k;
  if (kind === 'spark') { // round 9: a small fire pop, no white star over it
    for (let i = 0; i < 5; i++) { const b = a + Math.PI + (i - 2) * 0.55 + hash(m.seed, i) * 0.3, d = 6 + 18 * e;
      upright(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, () => flame(ctx, 0, 0, 5.5 * (1 - 0.7 * k))); }
    return;
  }
  if (kind === 'frostbolt') { // a puff of snow (the shards bursting out behind are real shots)
    for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + m.seed, d = 4 + 16 * e; inkDisc(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, 4.5 * (1 - 0.6 * k), i % 2 ? '#FFFFFF' : '#DDF6FF'); }
    return;
  }
  if (kind === 'soulFlame') { // round 10: the Necromancer's flame (no bone): a puff of green flame licks
    for (let i = 0; i < 5; i++) { const b = a + Math.PI + (i - 2) * 0.6 + hash(m.seed, i) * 0.3, d = 5 + 16 * e;
      upright(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, () => flame(ctx, 0, 0, 6 * (1 - 0.7 * k), '#4FB02A', '#C8F59A')); }
    return;
  }
  if (kind === 'orb') { // a little holy sparkle
    for (let i = 0; i < 4; i++) { const b = i / 4 * TAU + 0.4, d = 3 + 12 * e; inked(ctx, () => star(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, 4 * (1 - k) + 1, 4, 0.35, b), EL.holy[2]); }
    return;
  }
  if (kind === 'zeus') { // round 10 ("I don't like the X hit effect of lightning"): a flash and a few sparks flying off
    for (let i = 0; i < 3; i++) { const b = a + Math.PI + (i - 1) * 0.9 + (hash(m.seed, i) - 0.5) * 0.5, d = 8 + 16 * e;
      inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(x + Math.cos(b) * d, y + Math.sin(b) * d); ctx.lineTo(x + Math.cos(b) * (d + 7 * (1 - k) + 2), y + Math.sin(b) * (d + 7 * (1 - k) + 2)); }, '#FFE66B', 2.2); }
    return;
  }
  if (kind === 'arrow' || kind === 'dagger') {
    for (let i = 0; i < 4; i++) { const b = a + Math.PI + (hash(m.seed, i) - 0.5) * 2.2, d = (6 + 20 * e) * S; streak(ctx, x + Math.cos(b) * d * 0.3, y + Math.sin(b) * d * 0.3, b, 0, 4 + 8 * (1 - k), 2.2, i % 2 ? '#C99A6A' : '#EEF3F8', '#FFFFFF'); }
    if (k < 0.5) inked(ctx, () => star(ctx, x, y, (12 + 6 * e) * S * (1 - k), 4, 0.3, a), '#FFFFFF');
  } else if (kind === 'fireArrow' || kind === 'fireball') {
    const n = big ? 9 : 6, R = (12 + 22 * e) * S;
    for (let i = 0; i < n; i++) { const b = i / n * TAU + hash(m.seed, i), fr = (5 + 4 * hash(i, m.seed)) * S * (1 - k * 0.8);
      upright(ctx, x + Math.cos(b) * R, y + Math.sin(b) * R, () => flame(ctx, 0, 0, fr)); }
    if (k < 0.4) inkDisc(ctx, x, y, 10 * S * (1 - k / 0.4), '#FFF0B0');
  } else if (kind === 'shard' || kind === 'icicle') {
    for (let i = 0; i < 6; i++) { const b = a + Math.PI + (i / 5 - 0.5) * 2.6 + (hash(m.seed, i) - 0.5) * 0.3, d = (4 + 26 * e) * S, s = (6 - 3 * k) * S;
      ctx.save(); ctx.translate(x + Math.cos(b) * d, y + Math.sin(b) * d); ctx.rotate(b + k * 3);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s * 1.3, 0); ctx.lineTo(0, -s * 0.5); ctx.lineTo(-s * 0.8, 0); ctx.lineTo(0, s * 0.5); ctx.closePath(); }, i % 2 ? '#DDF6FF' : '#9FDDF6');
      ctx.restore(); }
    if (k < 0.45) inked(ctx, () => star(ctx, x, y, (14 + 8 * e) * S * (1 - k), 6, 0.35, 0.3), '#FFFFFF');
  } else if (kind === 'vial' || kind === 'water') {
    const R = (8 + 22 * e) * S;
    for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + hash(m.seed, i), d = R * (0.7 + 0.4 * hash(i, m.seed)); inkDisc(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, (4 - 2.5 * k) * S, i % 2 ? col : light); }
    inked(ctx, () => blob(ctx, x, y, (10 - 6 * k) * S, 6, m.seed, 1), col);
  } else if (kind === 'note') {
    for (let i = 0; i < 3; i++) { const b = -Math.PI / 2 + (i - 1) * 0.9, d = 6 + 22 * e;
      upright(ctx, x + Math.cos(b) * d * (view.rot ? 0 : 1), y + Math.sin(b) * d, () => { ctx.globalAlpha *= 1; inked(ctx, () => noteShape(ctx, 0.8 * (1 - 0.4 * k)), EL.song[1]); }); }
    inked(ctx, () => star(ctx, x, y, 12 * (1 - k), 5, 0.4, 0), '#FFF0B0');
  } else if (kind === 'bone') {
    for (let i = 0; i < (big ? 7 : 4); i++) { const b = a + Math.PI + (hash(m.seed, i) - 0.5) * 2.6, d = (6 + 26 * e) * S;
      ctx.save(); ctx.translate(x + Math.cos(b) * d, y + Math.sin(b) * d); ctx.rotate(b + k * 6 + i); inked(ctx, () => boneShape(ctx, 9 * S, 3.2 * S), EL.bone[1]); ctx.restore(); }
    if (big) lit(ctx, () => glowDisc(ctx, x, y, 40 * (1 - k) + 10, EL.necro[1], 0.6 * (1 - k)));
    if (k < 0.45) inked(ctx, () => star(ctx, x, y, (12 + 6 * e) * S * (1 - k), 4, 0.3, a), '#FFFFFF');
  } else if (kind === 'thorn') {
    for (let i = 0; i < 4; i++) { const b = a + Math.PI + (hash(m.seed, i) - 0.5) * 2.4, d = 6 + 20 * e; leaf(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, b + k * 4, 5 * (1 - 0.4 * k)); }
    inked(ctx, () => star(ctx, x, y, 11 * (1 - k), 4, 0.3, a), '#E4F5C8');
  } else { // a magic bolt: a star of its own colour bursting (round 9: no big white star over it)
    inked(ctx, () => star(ctx, x, y, (10 + 14 * e) * S * (1 - 0.5 * k), 6, 0.42, k * 2), col);
    ctx.fillStyle = light; star(ctx, x, y, (3 + 3 * e) * S * (1 - k), 6, 0.42, k * 2); ctx.fill();
    for (let i = 0; i < 5; i++) { const b = i / 5 * TAU + m.seed, d = (10 + 24 * e) * S; inkDisc(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, 3 * (1 - k) + 0.5, col); }
  }
}

// ---------------------------------------------------------------- blasts (sim.js explode)
function blast(ctx, m, k) {
  const e = easeOut(k), x = m.x, y = m.y, R = m.r;
  const fire = /^#F[F-F][789AB]/i.test(m.color) || m.ab === 'fireball';
  const col = fire ? EL.fire : m.color === '#9BE07A' ? EL.necro : [m.color, m.color, '#FFFFFF', '#FFFFFF'];
  if (k < 0.18) lit(ctx, () => glowDisc(ctx, x, y, R * 1.5, '#FFF4DC', 1 - k / 0.18));
  lit(ctx, () => glowDisc(ctx, x, y, R * (0.8 + 0.6 * e), col[1], 0.6 * (1 - k)));
  ctx.globalAlpha *= 1 - k * k;
  // a fat ring of the burst rolling out to the blast's edge
  ctx.save(); ctx.globalAlpha *= 0.85;
  inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y, R * (0.35 + 0.65 * e), 0, TAU); }, col[2], 10 * (1 - k) + 1.5);
  ctx.restore();
  const n = Math.max(8, Math.round(R / 8));
  for (let i = 0; i < n; i++) {
    const b = (i + hash(m.seed, i) * 0.5) / n * TAU, d = R * (0.25 + 0.75 * e) * (0.75 + 0.3 * hash(i, m.seed)), s = (R * 0.16 + 4) * (1 - 0.7 * k);
    if (fire) upright(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, () => flame(ctx, 0, 0, s * 0.8));
    else inkDisc(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, s * 0.6, i % 2 ? col[1] : col[2]);
  }
  if (k < 0.35) inkDisc(ctx, x, y, R * 0.4 * (1 - k / 0.35), col[3]);
}

// ---------------------------------------------------------------- an enemy's danger zone striking
const STRIKE_EL = { bone: 'bone', blade: 'steel', soul: 'frost', water: 'water', fire: 'fire', holy: 'holy', ice: 'frost', web: 'shadow', poison: 'poison' };
function zonePoints(z, step) {
  const out = [];
  if (z.shape === 'circle') {
    out.push([z.x, z.y, 0]);
    for (const f of [0.45, 0.85]) { const n = Math.max(4, Math.round(TAU * z.r * f / step)); for (let i = 0; i < n; i++) { const a = (i + f) / n * TAU; out.push([z.x + Math.cos(a) * z.r * f, z.y + Math.sin(a) * z.r * f, a]); } }
  } else if (z.shape === 'ring') {
    const rm = (z.r0 + z.r1) / 2, n = Math.max(6, Math.round(TAU * rm / step)); for (let i = 0; i < n; i++) { const a = i / n * TAU; out.push([z.x + Math.cos(a) * rm, z.y + Math.sin(a) * rm, a]); }
  } else if (z.shape === 'cone') {
    for (const f of [0.35, 0.65, 0.92]) { const n = Math.max(2, Math.round(z.arc * z.r * f / step)); for (let i = 0; i <= n; i++) { const a = z.a - z.arc / 2 + z.arc * i / n; out.push([z.x + Math.cos(a) * z.r * f, z.y + Math.sin(a) * z.r * f, a]); } }
  } else if (z.shape === 'line') {
    const L = Math.hypot(z.x2 - z.x1, z.y2 - z.y1), n = Math.max(2, Math.round(L / step)), a = Math.atan2(z.y2 - z.y1, z.x2 - z.x1);
    for (let i = 0; i <= n; i++) { const f = i / n; out.push([z.x1 + (z.x2 - z.x1) * f, z.y1 + (z.y2 - z.y1) * f, a]); }
  }
  return out;
}
// round 9: no cracks in the floor (the designer disliked them everywhere); a soft scorch of dust where a blow landed
function strikeGround(ctx, m, k) {
  const z = m.z;
  if (m.kind === 'bone' || m.kind === 'blade' || m.kind === 'ice') {
    ctx.globalAlpha *= (1 - k) * 0.5; ctx.fillStyle = 'rgba(70,56,44,0.5)';
    if (z.shape === 'line') { ctx.lineCap = 'round'; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = z.hw * 1.1; ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke(); }
    else if (z.shape === 'circle') { ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.8, 0, TAU); ctx.fill(); }
  }
  if (m.kind === 'soul') { // the soul fire's cold glow on the floor
    const rr = z.shape === 'ring' ? (z.r0 + z.r1) / 2 : z.r;
    lit(ctx, () => glowDisc(ctx, z.x, z.y, rr * 1.1, '#6FC8FF', 0.4 * (1 - k)));
  }
}
// ---- the Bone King in the effects style (round 9: "needs a visual overhaul for some abilities")
const SOUL = ['#3E7FC0', '#6FC8FF', '#BFEFFF', '#F2FCFF'];
function soulFlame(ctx, x, y, r) { flame(ctx, x, y, r, SOUL[1], SOUL[3]); }
function kingStrike(ctx, m, k) {
  const z = m.z, e = easeOut(k), seed = m.seed, [ux, uy] = upVec();
  if (m.kind === 'bone' && z.shape === 'cone') { // the great cleave: one huge bone-white crescent sweeping the cone
    const span = z.arc, a0 = z.a - span / 2;
    const head = a0 + span * easeOut(k01(k / 0.3)), tail = a0 + span * sm(k01((k - 0.12) / 0.6));
    slashBand(ctx, z.x, z.y, z.r * 0.95, tail, head, 40 * (1 - 0.4 * k), '#EDE4CD', '#FFFFFF', true);
    if (k > 0.2) dustPuffs(ctx, z.x + Math.cos(z.a) * z.r * 0.8, z.y + Math.sin(z.a) * z.r * 0.8, 46, k01((k - 0.2) / 0.8), seed, 9);
    return true;
  }
  if (m.kind === 'bone' && z.shape === 'line') { // the grave lance: a long thrust, then bone spikes bursting up along it
    const a = Math.atan2(z.y2 - z.y1, z.x2 - z.x1), L = Math.hypot(z.x2 - z.x1, z.y2 - z.y1);
    const tip = L * easeOut(k01(k / 0.2)), base = L * sm(k01((k - 0.15) / 0.5));
    if (tip - base > 2) streak(ctx, z.x1, z.y1, a, base, tip + 12, z.hw * 0.5, '#EDE4CD', '#FFFFFF');
    const n = Math.max(3, Math.round(L / 46));
    for (let i = 0; i < n; i++) { const q = (i + 0.5) / n, kk = k01((k - q * 0.25) / 0.6); if (kk <= 0) continue;
      const up = kk < 0.25 ? easeOut(kk / 0.25) : 1 - sm(k01((kk - 0.45) / 0.55)), px = z.x1 + Math.cos(a) * L * q, py = z.y1 + Math.sin(a) * L * q;
      for (const sd of [-1, 0, 1]) { const o = sd * z.hw * 0.55, h = hash(seed, i, sd + 2);
        spike(ctx, px - Math.sin(a) * o, py + Math.cos(a) * o, (30 + 16 * h) * up * (sd ? 0.7 : 1), 7 + 3 * h, EL.bone[1], EL.bone[2]); } }
    return true;
  }
  if (m.kind === 'bone' && z.shape === 'circle') { // a row's step or a grave bursting: a knot of bone spikes and dust
    const up = k < 0.18 ? easeOut(k / 0.18) : 1 - sm(k01((k - 0.45) / 0.55)), n = z.r > 50 ? 7 : 4;
    if (k < 0.2) lit(ctx, () => glowDisc(ctx, z.x, z.y, z.r * 1.2, '#FFF8EA', 0.5 * (1 - k / 0.2)));
    dustPuffs(ctx, z.x, z.y, z.r * 0.9, k, seed, 6);
    for (let i = 0; i < n; i++) { const b = i / n * TAU + seed, d = i ? z.r * 0.45 : 0, h = hash(seed, i);
      spike(ctx, z.x + Math.cos(b) * d, z.y + Math.sin(b) * d, (i ? 26 : 40) * (0.8 + 0.4 * h) * up, i ? 7 : 10, EL.bone[1], EL.bone[2]); }
    return true;
  }
  if (m.kind === 'soul') { // soul fire: a wave of blue flame rolling out over the shape, souls rising off it
    const ring = z.shape === 'ring', rr = ring ? z.r0 + (z.r1 - z.r0) * e : z.r * (0.25 + 0.75 * e);
    if (k < 0.18) lit(ctx, () => glowDisc(ctx, z.x, z.y, (ring ? z.r1 : z.r) * 1.1, SOUL[2], 0.7 * (1 - k / 0.18)));
    lit(ctx, () => { ctx.strokeStyle = rgba(SOUL[1], 0.5 * (1 - k)); ctx.lineWidth = 30 * (1 - k) + 4; ctx.beginPath(); ctx.arc(z.x, z.y, rr, 0, TAU); ctx.stroke(); });
    ctx.save(); ctx.globalAlpha *= 1 - k * k;
    const n = Math.max(14, Math.round(rr / 12));
    for (let i = 0; i < n; i++) { const b = i / n * TAU + seed * 0.1, h = hash(seed, i); upright(ctx, z.x + Math.cos(b) * rr, z.y + Math.sin(b) * rr, () => soulFlame(ctx, 0, 0, (10 + 5 * h) * (1 - 0.6 * k))); }
    for (let i = 0; i < 8; i++) { const b = hash(i, seed) * TAU, d = (ring ? z.r0 + (z.r1 - z.r0) * hash(seed, i, 2) : z.r * hash(seed, i, 2)), ph = k01(k * 1.4 - hash(i, seed, 3) * 0.3);
      ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI); inkDisc(ctx, z.x + Math.cos(b) * d + ux * ph * 50, z.y + Math.sin(b) * d + uy * ph * 50, 6 * (1 - ph) + 2, i % 2 ? SOUL[2] : SOUL[3]); ctx.restore(); }
    ctx.restore();
    return true;
  }
  return false;
}
function strike(ctx, m, k) {
  const z = m.z, el = EL[STRIKE_EL[m.kind]] || EL.bone, e = easeOut(k), seed = m.seed;
  if ((m.kind === 'bone' || m.kind === 'soul') && kingStrike(ctx, m, k)) return;
  if (m.kind === 'blade' && z.shape === 'circle') { // round 10 (the boss lane: bone spikes looked wrong on the Goblin
    // Chieftain's cleaver spin and the Great Engine's head spin): a circle of blade is a spin: two blade crescents sweep
    // once round it, warm steel like every enemy arc, and are gone
    const a0 = seed * 0.7, R = z.r * 0.95, th = Math.max(14, Math.min(26, z.r * 0.22)) * (1 - 0.35 * k);
    if (k < 0.18) lit(ctx, () => glowDisc(ctx, z.x, z.y, z.r, '#FFF4E8', 0.35 * (1 - k / 0.18)));
    for (const off of [0, Math.PI]) { const h = a0 + off + TAU * 0.75 * easeOut(k01(k / 0.6)), t = a0 + off + TAU * 0.75 * sm(k01((k - 0.15) / 0.85));
      slashBand(ctx, z.x, z.y, R, Math.min(t, h - 0.05), h, th, '#FFCDBD', '#FFF6F2', true); }
    return;
  }
  if (m.kind === 'blade' && z.shape === 'cone') { // and a blade cone is a chop: one warm crescent sweeping it (no bone spikes)
    const span = z.arc, a0 = z.a - span / 2, head = a0 + span * easeOut(k01(k / 0.3)), tail = a0 + span * sm(k01((k - 0.12) / 0.6));
    slashBand(ctx, z.x, z.y, z.r * 0.92, tail, head, Math.max(16, Math.min(34, z.r * 0.25)) * (1 - 0.4 * k), '#FFCDBD', '#FFF6F2', true);
    return;
  }
  if (m.kind === 'blade' && z.shape === 'line') { // a blade streak along the line
    const a = Math.atan2(z.y2 - z.y1, z.x2 - z.x1), L = Math.hypot(z.x2 - z.x1, z.y2 - z.y1);
    const tip = L * easeOut(k01(k / 0.3)), base = L * sm(k01((k - 0.2) / 0.8));
    streak(ctx, z.x1, z.y1, a, base, tip + 10, z.hw * 0.55, '#FFCDBD', '#FFFFFF');
    return;
  }
  if (m.kind === 'soul' || m.kind === 'holy') { // a wave of light rolling out over the shape
    const rr = z.shape === 'ring' ? z.r0 + (z.r1 - z.r0) * e : (z.r || 60) * e;
    lit(ctx, () => { ctx.strokeStyle = rgba(el[2], 0.75 * (1 - k)); ctx.lineWidth = 18 * (1 - k) + 2; ctx.beginPath();
      if (z.shape === 'cone') ctx.arc(z.x, z.y, z.r * e, z.a - z.arc / 2, z.a + z.arc / 2); else if (z.shape === 'line') { ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); } else ctx.arc(z.x, z.y, rr, 0, TAU); ctx.stroke(); });
    const pts = zonePoints(z, 60);
    ctx.globalAlpha *= 1 - k;
    pts.forEach(([x, y], i) => { if (m.kind === 'holy') { inked(ctx, () => star(ctx, x, y, 9 * (1 - k) + 2, 4, 0.3, i), el[3]); }
      else { const [ux, uy] = upVec(); inkDisc(ctx, x + ux * e * 26, y + uy * e * 26, 5 * (1 - k) + 1, i % 2 ? el[2] : '#FFFFFF'); } });
    return;
  }
  const pts = zonePoints(z, m.kind === 'web' ? 999 : 50);
  const up = k < 0.2 ? easeOut(k / 0.2) : 1 - sm(k01((k - 0.55) / 0.45));
  pts.forEach(([x, y, a], i) => {
    const h = hash(seed, i);
    if (m.kind === 'bone' || m.kind === 'blade') spike(ctx, x, y, (28 + 18 * h) * up, 8 + 4 * h, EL.bone[1], EL.bone[2]);
    else if (m.kind === 'ice') spike(ctx, x, y, (28 + 18 * h) * up, 9 + 4 * h, '#BFE9F8', '#FFFFFF');
    else if (m.kind === 'fire') upright(ctx, x, y, () => flame(ctx, 0, 0, (9 + 5 * h) * up));
    else if (m.kind === 'water' || m.kind === 'poison') {
      ctx.save(); ctx.globalAlpha *= 1 - k;
      const [ux, uy] = upVec(), hop = Math.sin(k * Math.PI) * 22 * h;
      for (let j = 0; j < 3; j++) { const b = a + (j - 1) * 0.9 + h, d = 6 + 18 * e; inkDisc(ctx, x + Math.cos(b) * d + ux * hop, y + Math.sin(b) * d + uy * hop, 4 * (1 - k) + 1, j % 2 ? el[1] : el[2]); }
      ctx.restore();
    } else if (m.kind === 'web') {
      ctx.save(); ctx.globalAlpha *= 1 - k * k; ctx.strokeStyle = '#F2EEF8'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      const R = (z.r || 46) * (0.5 + 0.5 * easeOut(k01(k / 0.3)));
      for (let j = 0; j < 9; j++) { const b = j / 9 * TAU + h; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(b + 0.3) * R * 0.5, y + Math.sin(b + 0.3) * R * 0.5, x + Math.cos(b) * R, y + Math.sin(b) * R); ctx.stroke(); }
      ctx.restore();
    }
  });
  if (k < 0.2) lit(ctx, () => { const x = z.x ?? (z.x1 + z.x2) / 2, y = z.y ?? (z.y1 + z.y2) / 2; glowDisc(ctx, x, y, (z.r || z.r1 || 60) * 0.9, el[2], 0.6 * (1 - k / 0.2)); });
}

// ---------------------------------------------------------------- a quake (ground slams, Ground Pound, Leap's landing)
// round 9: no cracks, and it lies under the units (drawn on the ground layer); a dark dent where the blow landed
export function quake(ctx, x, y, R, k, seed, col = EL.earth) {
  const e = easeOut(k01(k / 0.6));
  ctx.save(); ctx.globalAlpha *= (1 - k) * 0.5; ctx.fillStyle = 'rgba(70,56,44,0.55)'; ctx.beginPath(); ctx.arc(x, y, R * 0.3 * (0.6 + 0.4 * e), 0, TAU); ctx.fill(); ctx.restore();
  // the dust wave rolling out to the edge
  const r = R * (0.3 + 0.7 * e), th = 16 * (1 - k) + 3;
  ctx.save(); ctx.globalAlpha *= (1 - k) * 0.9;
  const g = ctx.createRadialGradient(x, y, Math.max(0, r - th), x, y, r);
  g.addColorStop(0, rgba(col[2], 0)); g.addColorStop(0.7, rgba(col[2], 0.8)); g.addColorStop(1, rgba(col[3], 0.95));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.arc(x, y, Math.max(0, r - th), 0, TAU, true); ctx.fill();
  ctx.restore();
  // stones kicked up
  const [ux, uy] = upVec();
  for (let i = 0; i < 9; i++) { const b = (i + 0.5) / 9 * TAU + seed, d = r - th * 0.6, hop = Math.sin(k01(k * 1.6 - hash(i, seed) * 0.3) * Math.PI) * 16;
    ctx.save(); ctx.globalAlpha *= 1 - k; inkDisc(ctx, x + Math.cos(b) * d + ux * hop, y + Math.sin(b) * d + uy * hop, 3.4 * (1 - k) + 1, i % 2 ? col[1] : col[0]); ctx.restore(); }
}
// Old Bones. Round 9: "Don't like the bones or the ball particle effect"; round 10: "Don't like the skull effect";
// round 13: the soul leaving and coming back was not ticked either. Three things floating over her, three noes: so
// nothing floats over her now. While it holds she is untouchable, and the designer's own rule is that a border round the
// outline means protection: she wears a bone-white border for that second (kits.js: a buff with `border`; render.js
// borderOf). What happens in the moment is one of three (js/fxvar.js, ?v_oldBones=N):
//   1 Stand   she plants her feet: a white flash off her, a ring of dust stamped out from under her, bone-white chips
//             of the blow thrown off
//   2 Creak   the joke in the name: comic crack marks snap out round her, the way the Rage's curses do
//   3 Glance  the blow that should have felled her glances off: a hard clang on the side it came from, sparks thrown
//             back along it
// The same at every tier; at III the shove round her (a wave of dust on the ground) comes with it.
function oldBones(ctx, m, k) {
  const u = m.u, x = u && !u.dead ? u.x : m.x, y = u && !u.dead ? u.y : m.y, vr = u ? u.vr : 22, v = variant('oldBones'), e = easeOut(k01(k / 0.6));
  if (v === 2) {
    for (let i = 0; i < 4; i++) { const t0 = i * 0.09, q = k01((k - t0) / 0.42); if (q <= 0 || q >= 1) continue;
      const b = [-2.5, -0.6, 2.4, 0.75][i] + (hash(m.seed, i) - 0.5) * 0.3, d = vr * 1.12, s = (0.6 + 0.6 * easeOut(k01(q / 0.2))) * (i % 2 ? 0.9 : 1.15);
      ctx.save(); ctx.globalAlpha *= q < 0.6 ? 1 : 1 - (q - 0.6) / 0.4;
      for (let j = -1; j <= 1; j++) { const c = b + j * 0.5; streak(ctx, x + Math.cos(b) * d, y + Math.sin(b) * d, c, 5 * s, (j ? 15 : 19) * s, 3.2 * s, '#FFFFFF', '#FFF8EA'); }
      ctx.restore(); }
    if (k < 0.2) lit(ctx, () => glowDisc(ctx, x, y, vr * 2.4, '#FFF8EA', 0.6 * (1 - k / 0.2)));
    return;
  }
  if (v === 3) {
    const back = (m.ha ?? 0) + Math.PI, px = x + Math.cos(back) * vr * 1.1, py = y + Math.sin(back) * vr * 1.1, q = k01(k / 0.45);
    if (q >= 1) return;
    if (q < 0.4) lit(ctx, () => glowDisc(ctx, px, py, 46, '#FFFBEA', 0.9 * (1 - q / 0.4)));
    ctx.save(); ctx.globalAlpha *= 1 - q * q;
    inkLine(ctx, () => { ctx.beginPath(); ctx.arc(x, y, vr * 1.2 + 6 * easeOut(q), back - 0.95, back + 0.95); }, '#FFF8EA', 5 * (1 - q) + 1.5);
    for (let i = -3; i <= 3; i++) { const b = back + i * 0.3, d = 10 + 34 * easeOut(q); streak(ctx, px + Math.cos(b) * d, py + Math.sin(b) * d, b, 0, 16 * (1 - q) + 4, 3, '#FFFFFF', '#FFF8EA'); }
    inked(ctx, () => star(ctx, px, py, 15 * (1 - q) + 3, 4, 0.3, back), '#FFFFFF');
    ctx.restore();
    return;
  }
  // 1 Stand
  if (k < 0.22) lit(ctx, () => glowDisc(ctx, x, y, vr * 2.8, '#FFF8EA', 0.9 * (1 - k / 0.22)));
  if (k < 0.75) { ctx.save(); ctx.globalAlpha *= 1 - k / 0.75;
    for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.3 + hash(m.seed, i) * 0.4, d = vr + 6 + 44 * e, s = 6.5 * (1 - 0.5 * k);
      ctx.save(); ctx.translate(x + Math.cos(b) * d, y + Math.sin(b) * d); ctx.rotate(b + k * 7);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.5, -s * 0.6); ctx.lineTo(-s * 0.3, s * 0.55); ctx.closePath(); }, i % 2 ? '#EDE4CD' : '#FFF8EA'); ctx.restore(); }
    ctx.restore(); }
}
// (the dust she stamps out, under the units: variant 1)
function oldBonesGround(ctx, m, k) {
  if (variant('oldBones') !== 1) return;
  const u = m.u, x = u && !u.dead ? u.x : m.x, y = u && !u.dead ? u.y : m.y, vr = u ? u.vr : 22, q = k01(k / 0.6);
  ctx.save(); ctx.globalAlpha *= 1 - q; dustPuffs(ctx, x, y, vr * 2.1, q, m.seed, 10, '#EDE4CD'); ctx.restore();
}

// ---------------------------------------------------------------- ability signatures ('sig' fx, fxtag.js)
// How long each one plays (the fx lives 1.4s; a sig draws nothing after its own time). Round 9: some abilities have a
// charge before they go off (Barrage, Frost Arrow, Fireball, Frost Nova): CHARGE is how long, the sig shows it.
export const SIG_T = { shieldBash: 0.45, guard: 1.1, consecrate: 0.5, holdTheLine: 0.7, charge: 0.4, groundPound: 0.2, barrage: 0.7, frostArrow: 0.75,
  roll: 0.45, backstab: 0.7, dash: 0.35, fanOfKnives: 0.3, rage: 0.6, leap: 0.4, cleave: 0.2, shockwave: 0.3, whirl: 0.4,
  unstoppable: 0.7, reap: 0.2, hook: 0.3, fireball: 0.7, flameWall: 0.4, inferno: 0.3, iceShard: 0.3, frostNova: 0.65, iceWall: 0.6,
  chainLightning: 0.3, thunderclap: 0.25, stormCloud: 0.5, mend: 0.4, sanctuary: 0.6, smite: 0.3, warSong: 0.9, lullaby: 0.3,
  encore: 0.35, entangle: 0.5, rejuvenate: 0.4, callWolf: 0.4, raiseDead: 0.5, lifeDrain: 0.3, boneSpear: 0.3, miasma: 0.3,
  cure: 0.3, leeches: 0.5 };
const CHARGE = { barrage: 0.4, frostArrow: 0.45, fireball: 0.4, frostNova: 0.35 };
export const CAST_EL = { shieldBash: 'holy', guard: 'holy', consecrate: 'holy', holdTheLine: 'earth', charge: 'earth', groundPound: 'earth', barrage: 'steel',
  frostArrow: 'frost', roll: 'earth', backstab: 'shadow', dash: 'shadow', fanOfKnives: 'steel', rage: 'blood', leap: 'earth', cleave: 'steel',
  shockwave: 'earth', whirl: 'steel', unstoppable: 'holy', reap: 'bone', hook: 'steel', fireball: 'fire', flameWall: 'fire', inferno: 'fire',
  iceShard: 'frost', frostNova: 'frost', iceWall: 'frost', chainLightning: 'storm', thunderclap: 'storm', stormCloud: 'storm', mend: 'holy',
  sanctuary: 'holy', smite: 'holy', warSong: 'song', lullaby: 'song', encore: 'song', entangle: 'nature', rejuvenate: 'nature', callWolf: 'nature',
  raiseDead: 'cold', lifeDrain: 'blood', boneSpear: 'necro', miasma: 'poison', cure: 'water', leeches: 'poison' };
EL.cold = ['#6E7680', '#A8B0BA', '#D8DEE4', '#F2F5F8']; // Raise Dead (round 9: "more of an unsaturated cold grey")
export const abilityEl = (id) => EL[CAST_EL[id]] || EL.steel;
installFx2({ SIG_T, CAST_EL, IMPACT_EL, IMPACT_ALIAS, EL, castFlash, streak, dustPuffs, drawIn });
installFx3({ SIG_T, CAST_EL, IMPACT_EL, IMPACT_ALIAS, EL, castFlash, streak, dustPuffs, drawIn }); // round 15 (lane N)
installFxWater({ CAST_EL }); // round 17 (lane water17)

// A burst of light in front of the caster's hands as an ability goes off (every cast gets one: the tell's end).
function castFlash(ctx, f, k, el, at = 0) {
  const dur = 0.35 * (SIG_T[f.ab] || 0.4), t = f.t - at; if (t < 0 || t > dur) return;
  const q = 1 - t / dur;
  const u = f.u, x = (u && !u.dead ? u.x : f.x) + Math.cos(f.a) * 30, y = (u && !u.dead ? u.y : f.y) + Math.sin(f.a) * 30;
  lit(ctx, () => glowDisc(ctx, x, y, 34 * (0.6 + 0.4 * q), el[1], 0.7 * q));
  inked(ctx, () => star(ctx, x, y, 13 * q + 2, 4, 0.32, f.a), el[3]);
}
// motes drawn in from all round onto a point (the charges: frost into the bow, cold into the mage)
function drawIn(ctx, x, y, R, q, n, seed, cols, s = 3.2) {
  for (let i = 0; i < n; i++) { const ph = (q * 1.6 + hash(seed, i)) % 1, b = hash(i, seed) * TAU + ph * 1.2, d = R * (1 - easeOut(ph)), px = x + Math.cos(b) * d, py = y + Math.sin(b) * d;
    ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI) * clamp(q * 3, 0, 1);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(b) * 9 * (1 - ph), py + Math.sin(b) * 9 * (1 - ph)); }, cols[i % cols.length], s * (1 - 0.5 * ph));
    ctx.restore(); }
}
export function drawSigGround(ctx, f, w) {
  const T = SIG_T[f.ab] || 0.4; if (f.t > T) return;
  const k = f.t / T, el = abilityEl(f.ab), e = easeOut(k);
  ctx.save();
  switch (f.ab) {
    case 'charge': case 'roll': case 'leap': case 'dash': { // a kick of dust where it set off
      dustPuffs(ctx, f.x, f.y, f.ab === 'dash' ? 20 : 30, k, Math.round(f.x), 7, f.ab === 'dash' && f.u && f.u.kind === 'twinfang' ? '#9B86C9' : '#E9DDC2');
      break;
    }
    case 'rage': { // the roar: red lines bursting out along the floor, under everyone (round 9)
      const u = f.u, x = u && !u.dead ? u.x : f.x, y = u && !u.dead ? u.y : f.y;
      ctx.globalAlpha *= 1 - k;
      for (let i = 0; i < 14; i++) { const b = i / 14 * TAU + 0.1, r0 = (u ? u.vr : 22) + 6 + 34 * e; streak(ctx, x + Math.cos(b) * r0, y + Math.sin(b) * r0, b, 0, 22 * (1 - k) + 4, 3.4, i % 2 ? el[1] : el[2], '#FFF0E8'); }
      if (k < 0.3) lit(ctx, () => glowDisc(ctx, x, y, 70, '#FF5A3D', 0.6 * (1 - k / 0.3)));
      break;
    }
    case 'raiseDead': {
      ctx.globalAlpha *= 1 - k;
      lit(ctx, () => glowDisc(ctx, f.x, f.y, 70, el[1], 0.3));
      break;
    }
  }
  ctx.restore();
}
export function drawSigAir(ctx, f, w) {
  const T = SIG_T[f.ab] || 0.4; if (f.t > T) return;
  const k = f.t / T, el = abilityEl(f.ab), e = easeOut(k), u = f.u, live = u && !u.dead && !u.downed;
  const ux0 = live ? u.x : f.x, uy0 = live ? u.y : f.y, seed = Math.round(f.x * 3 + f.y), [vx, vy] = upVec();
  const fa = live ? u.facing : f.a;
  ctx.save();
  switch (f.ab) {
    case 'shieldBash': { // round 9: "doesn't look like a bash": the shield itself rams forward and stops dead on the foe
      const reach = (u ? u.r : 30) + 22, q = easeOut(k01(k / 0.25)), hit = k01((k - 0.22) / 0.78);
      const d = (u ? u.vr * 0.6 : 14) + reach * q, x = ux0 + Math.cos(fa) * d, y = uy0 + Math.sin(fa) * d;
      ctx.save(); ctx.globalAlpha *= 1 - hit * hit;
      for (let i = 1; i <= 3; i++) { ctx.save(); ctx.globalAlpha *= 0.25 * (1 - i / 4) * (1 - hit); ctx.translate(x - Math.cos(fa) * i * 9, y - Math.sin(fa) * i * 9); ctx.rotate(fa - Math.PI / 2); inked(ctx, () => shieldShape(ctx, 1.9), el[2]); ctx.restore(); }
      ctx.translate(x, y); ctx.rotate(fa - Math.PI / 2);
      inked(ctx, () => shieldShape(ctx, 1.9 * (1 + 0.15 * Math.sin(hit * Math.PI))), el[1]);
      ctx.fillStyle = el[3]; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      ctx.restore();
      if (hit > 0 && hit < 0.8) { // the bonk: a white flash on the face and impact lines thrown out in front
        const p = hit / 0.8, cx = x + Math.cos(fa) * 20, cy = y + Math.sin(fa) * 20;
        if (p < 0.4) lit(ctx, () => glowDisc(ctx, cx, cy, 50, '#FFFFFF', 0.8 * (1 - p / 0.4)));
        ctx.save(); ctx.globalAlpha *= 1 - p;
        for (let i = -3; i <= 3; i++) { const b = fa + i * 0.32; streak(ctx, cx + Math.cos(b) * (8 + 26 * easeOut(p)), cy + Math.sin(b) * (8 + 26 * easeOut(p)), b, 0, 16 * (1 - p) + 4, 3, '#FFFFFF', el[3]); }
        ctx.restore();
      }
      break;
    }
    case 'guard': { // round 9: the shield, no "+", directly over the one guarded: fades in and grows, then fades out
      const a = u && u.guardOf; if (!a || a.dead) break;
      const s = 0.7 + 0.85 * easeOut(k01(k / 0.55)), al = k < 0.2 ? k / 0.2 : 1 - sm(k01((k - 0.45) / 0.55));
      ctx.globalAlpha *= al * 0.9;
      if (k < 0.35) lit(ctx, () => glowDisc(ctx, a.x, a.y, 46, el[2], 0.5 * (1 - k / 0.35)));
      upright(ctx, a.x, a.y, () => { inked(ctx, () => shieldShape(ctx, 1.5 * s), el[1]); ctx.fillStyle = el[2]; shieldShape(ctx, 1.05 * s); ctx.fill(); ctx.fillStyle = '#FFFBEA'; ctx.beginPath(); ctx.ellipse(-4 * s, -6 * s, 3 * s, 5 * s, -0.3, 0, TAU); ctx.fill(); });
      break;
    }
    case 'consecrate': case 'sanctuary': case 'smite': case 'mend': case 'unstoppable':
      castFlash(ctx, f, k, el);
      if (f.ab === 'unstoppable') { // gold shards break away from the body
        ctx.globalAlpha *= 1 - k;
        for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.3, d = u.vr + 8 + 46 * e, s = 7 * (1 - 0.5 * k);
          ctx.save(); ctx.translate(ux0 + Math.cos(b) * d, uy0 + Math.sin(b) * d); ctx.rotate(b + k * 6);
          inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.6, -s * 0.7); ctx.lineTo(-s * 0.4, s * 0.6); ctx.closePath(); }, i % 2 ? el[1] : el[2]); ctx.restore(); }
      }
      break;
    case 'holdTheLine': { // a flash off the raised shield (the red mark over each one it taunts is drawBodyFx's now: round 13)
      if (k < 0.3) lit(ctx, () => glowDisc(ctx, ux0 + Math.cos(fa) * (u.r + 10), uy0 + Math.sin(fa) * (u.r + 10), 40, '#FFF4C8', 0.7 * (1 - k / 0.3)));
      break;
    }
    case 'barrage': { // round 9: the charge: arrows gather one by one in a fan on the bow, glowing; then they fly
      const c = CHARGE.barrage, tier = f.tier || 1, n = tier >= 2 ? 7 : 5;
      if (f.t < c) { const q = f.t / c, bx = ux0 + Math.cos(fa) * (u.r + 4), by = uy0 + Math.sin(fa) * (u.r + 4);
        lit(ctx, () => glowDisc(ctx, bx, by, 26 + 16 * q, tier >= 2 ? '#FF9A3D' : '#FFF4DC', 0.25 + 0.35 * q));
        for (let i = 0; i < n; i++) { const on = k01(q * (n + 1) - i); if (on <= 0) continue; const b = fa + (i - (n - 1) / 2) * 0.16, L = 22 + 8 * on, x = bx + Math.cos(b) * L, y = by + Math.sin(b) * L;
          ctx.save(); ctx.globalAlpha *= on; ctx.translate(x, y); ctx.rotate(b); inked(ctx, () => { ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-2, -4.5); ctx.lineTo(-2, 4.5); ctx.closePath(); }, tier >= 2 ? '#FFD45A' : '#EEF3F8');
          lit(ctx, () => glowDisc(ctx, 2, 0, 10, tier >= 2 ? '#FF9A3D' : '#FFFFFF', 0.5 * Math.sin(on * Math.PI))); ctx.restore(); }
      }
      castFlash(ctx, f, k, el, c);
      break;
    }
    case 'frostArrow': { // round 9: a readable charge: cold drawn into the top of the bow from all round her
      const c = CHARGE.frostArrow;
      if (f.t < c) { const q = f.t / c, bx = ux0 + Math.cos(fa) * (u.r + 2), by = uy0 + Math.sin(fa) * (u.r + 2);
        drawIn(ctx, bx, by, 80, q, 14, seed, ['#DDF6FF', '#FFFFFF', '#9FDDF6']);
        lit(ctx, () => glowDisc(ctx, bx, by, 18 + 22 * q, '#DDF6FF', 0.3 + 0.5 * q));
        for (let i = 0; i < 3; i++) { const b = q * 4 + i / 3 * TAU, d = 16 * (1 - q) + 6; ctx.save(); ctx.globalAlpha *= q; snowflakeK(ctx, bx + Math.cos(b) * d, by + Math.sin(b) * d, 3.5, b); ctx.restore(); }
      }
      castFlash(ctx, f, k, el, c);
      break;
    }
    case 'fireball': { // round 9: a slight charge up: fire gathering into a ball in front of her hands
      const c = CHARGE.fireball;
      if (f.t < c) { const q = f.t / c, bx = ux0 + Math.cos(fa) * (u.r + 8), by = uy0 + Math.sin(fa) * (u.r + 8), r = 4 + 9 * easeOut(q);
        lit(ctx, () => glowDisc(ctx, bx, by, r * 3, '#FF9A3D', 0.6 * q));
        for (let i = 0; i < 5; i++) { const b = q * 9 + i / 5 * TAU, d = r + 18 * (1 - q); upright(ctx, bx + Math.cos(b) * d, by + Math.sin(b) * d, () => flame(ctx, 0, 0, 4 + 2 * q)); }
        inked(ctx, () => blob(ctx, bx, by, r, 6, q * 20, 1), '#E8582A'); ctx.fillStyle = '#FFC85A'; ctx.beginPath(); ctx.arc(bx + 1, by - 1, r * 0.55, 0, TAU); ctx.fill();
      }
      castFlash(ctx, f, k, el, c);
      break;
    }
    case 'frostNova': { // round 9: charge up: the cold drawn into her from all round, ice forming in a closing ring
      const c = CHARGE.frostNova;
      if (f.t < c) { const q = f.t / c;
        drawIn(ctx, ux0, uy0, 140, q, 20, seed, ['#DDF6FF', '#FFFFFF', '#9FDDF6'], 3.6);
        lit(ctx, () => glowDisc(ctx, ux0, uy0, 40 + 40 * q, '#DDF6FF', 0.25 + 0.4 * q));
        for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + q, d = (u.vr + 10) + 50 * (1 - easeOut(q)), s = 5 + 3 * q;
          ctx.save(); ctx.globalAlpha *= q; ctx.translate(ux0 + Math.cos(b) * d, uy0 + Math.sin(b) * d); ctx.rotate(b);
          inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-s * 1.4, 0); ctx.lineTo(0, -s * 0.5); ctx.lineTo(s * 0.6, 0); ctx.lineTo(0, s * 0.5); ctx.closePath(); }, '#BFE9F8'); ctx.restore(); }
      }
      break;
    }
    case 'iceShard': case 'boneSpear': case 'chainLightning': case 'miasma': case 'stormCloud':
      castFlash(ctx, f, k, el); break;
    case 'backstab': { // round 9: she goes in the smoke left behind (a body, puddles.js) and comes out of a different
      // shadow: wisps of dark violet pulled in to the spot behind the target, then a sharp pop, and the cross of two cuts
      // (round 18, lane dash18: she runs round it now, dashes.js hook: the wisps as she goes in; the cross is drawn when
      // her cut lands, fx-dash.js dashCross)
      if (f._hook == null) f._hook = !!(u && u.act && u.act.dv);
      if (f._hook && k >= 0.3) break;
      if (k < 0.3) { const q = k / 0.3;
        for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + seed, d = 50 * (1 - easeOut(q)) + 6;
          ctx.save(); ctx.globalAlpha *= 1 - q * 0.5; streak(ctx, ux0 + Math.cos(b) * (d + 18), uy0 + Math.sin(b) * (d + 18), b + Math.PI, 0, 18, 3.2, i % 2 ? '#5A4A7A' : '#2E2440', '#9B86C9'); ctx.restore(); } }
      else if (k < 0.55) { const q = (k - 0.3) / 0.25; ctx.save(); ctx.globalAlpha *= 1 - q;
        for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + seed, d = 10 + 30 * easeOut(q); inked(ctx, () => star(ctx, ux0 + Math.cos(b) * d, uy0 + Math.sin(b) * d, 5 * (1 - q) + 1, 4, 0.3, b), '#C9B8F0'); }
        ctx.restore(); }
      const t = f.tgt; if (!t) break;
      const tx = t.dead ? f.tx : t.x, ty = t.dead ? f.ty : t.y;
      for (const sd of [-1, 1]) { const a = f.a + sd * 0.8, q = easeOut(k01((k - 0.25 - (sd > 0 ? 0.06 : 0)) / 0.3)), fade = k01((1 - k) / 0.45);
        if (q <= 0) continue; ctx.save(); ctx.globalAlpha *= fade; streak(ctx, tx - Math.cos(a) * 34, ty - Math.sin(a) * 34, a, 0, 68 * q, 6, el[2], '#FFFFFF'); ctx.restore(); }
      if (k > 0.25 && k < 0.5) lit(ctx, () => glowDisc(ctx, tx, ty, 46, el[2], 0.8 * (1 - (k - 0.25) / 0.25)));
      break;
    }
    case 'fanOfKnives': { // a glint off the first knife (the rest come out one by one as she spins)
      if (k < 0.4) lit(ctx, () => glowDisc(ctx, ux0, uy0, 50, '#FFFFFF', 0.4 * (1 - k / 0.4)));
      break;
    }
    case 'whirl': castFlash(ctx, f, k, el); break;
    case 'shockwave': { // the slam the waves run out from: a flash and a kick of dust where the flail comes down
      const x = f.x + Math.cos(f.a) * ((u ? u.r : 30) + 12), y = f.y + Math.sin(f.a) * ((u ? u.r : 30) + 12);
      if (k < 0.4) lit(ctx, () => glowDisc(ctx, x, y, 44, '#FFF4DC', 0.7 * (1 - k / 0.4)));
      ctx.save(); ctx.globalAlpha *= 1 - k * k; dustPuffs(ctx, x, y, 30, e, seed, 7); ctx.restore();
      break;
    }
    case 'flameWall': case 'inferno': case 'iceWall': case 'thunderclap': case 'lullaby': case 'entangle': case 'rejuvenate': case 'lifeDrain': case 'hook':
      castFlash(ctx, f, k, el); break;
    case 'warSong': { // notes fly from the lute to each ally it reaches
      castFlash(ctx, f, k, el);
      const list = w.units.filter((a) => a.team === u.team && a !== u && !a.dead && !a.downed && Math.hypot(a.x - f.x, a.y - f.y) < 230);
      list.forEach((a, i) => {
        for (let j = 0; j < 3; j++) { const q = k01(k * 1.5 - j * 0.14 - i * 0.05); if (q <= 0) continue;
          const hop = Math.sin(q * Math.PI) * (20 + j * 8), x = f.x + (a.x - f.x) * easeOut(q) + vx * hop, y = f.y + (a.y - f.y) * easeOut(q) + vy * hop;
          if (q >= 1) continue;
          upright(ctx, x, y, () => { ctx.rotate(Math.sin(q * 9) * 0.3); inked(ctx, () => noteShape(ctx, 1.1), j % 2 ? el[2] : el[1]); });
        }
        const land = k01(k * 1.5 - 0.95 - i * 0.05);
        if (land > 0 && land < 1) { ctx.save(); ctx.globalAlpha *= 1 - land; inked(ctx, () => star(ctx, a.x, a.y, 16 * easeOut(land) + 4, 5, 0.4, 0), el[2]); ctx.restore(); }
      });
      break;
    }
    case 'raiseDead': {
      const spots = w.units.filter((s) => s.summonBy === u && s.kind === 'minion' && !s.dead);
      for (const s of spots.slice(0, 6)) {
        ctx.save(); ctx.globalAlpha *= 1 - k;
        for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + k * 7, d = 10 + 24 * (1 - e), up = e * 26;
          inkDisc(ctx, s.x + Math.cos(b) * d + vx * up, s.y + Math.sin(b) * d * 0.7 + vy * up, 3.5 * (1 - k) + 1, i % 2 ? EL.cold[2] : EL.cold[1]); }
        ctx.restore();
      }
      castFlash(ctx, f, k, el);
      break;
    }
    case 'leeches': { // Gas Form: a pop of gas as he comes apart
      ctx.globalAlpha *= 1 - k;
      for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + seed, d = 10 + 40 * e; inkDisc(ctx, f.x + Math.cos(b) * d, f.y + Math.sin(b) * d, 6 * (1 - k) + 1.5, i % 2 ? EL.poison[2] : EL.poison[1]); }
      break;
    }
    case 'callWolf': case 'encore': case 'cure': castFlash(ctx, f, k, el); break;
    default: if (!(SIG2[f.ab] && SIG2[f.ab](ctx, f, k, el, w) === false)) castFlash(ctx, f, k, el);
  }
  ctx.restore();
}
function snowflakeK(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round';
  const arms = () => { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s); ctx.lineTo(-Math.cos(a) * s, -Math.sin(a) * s); } };
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4 + OUTLINE * 1.2; arms(); ctx.stroke(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.6; arms(); ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- body effects (read off a unit each frame)
// No rings or auras round a hero (designer, round 6): buffs show as things coming off the body, or on the sprite.
const GRAWLIX = ['#', '%', '?', '!', '$', '@'];
export function drawBodyFx(ctx, u, w) {
  if (u.downed || u.dead) return;
  const T = w.time, [ux, uy] = upVec();
  for (const b of u.buffs || []) {
    if (b.id === 'rage') { // round 9: the steam became cursing: "#%?!$" signs rising off her
      for (let i = 0; i < 3; i++) { const ph = (T * 1.2 + i / 3 + u.id * 0.3) % 1, cyc = Math.floor(T * 1.2 + i / 3 + u.id * 0.3), an = hash(cyc, i, u.id) * TAU, rr = u.vr * 0.55;
        const ch = GRAWLIX[Math.floor(hash(i, cyc, u.id) * GRAWLIX.length)];
        ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
        upright(ctx, u.x + Math.cos(an) * rr + ux * ph * 34, u.y + Math.sin(an) * rr + uy * ph * 34, () => {
          ctx.rotate(Math.sin(ph * 8 + i) * 0.35); ctx.scale(0.7 + 0.5 * Math.sin(ph * Math.PI), 0.7 + 0.5 * Math.sin(ph * Math.PI));
          ctx.font = '900 21px system-ui, -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
          ctx.lineWidth = OUTLINE * 2; ctx.strokeStyle = INK; ctx.strokeText(ch, 0, 0); ctx.fillStyle = i % 2 ? '#FF8A3D' : '#E0604B'; ctx.fillText(ch, 0, 0); });
        ctx.restore(); }
    } else if (b.id === 'unstoppable') { // round 9: a better sparkle: star glints that grow and shrink all over the body
      for (let i = 0; i < 4; i++) { const per = 0.5, ph = (T / per + i / 4 + u.id * 0.17) % 1, cyc = Math.floor(T / per + i / 4 + u.id * 0.17);
        const an = hash(cyc, i, u.id) * TAU, rr = u.vr * (0.3 + 0.8 * hash(i, cyc, u.id)), s = Math.sin(ph * Math.PI);
        const x = u.x + Math.cos(an) * rr, y = u.y + Math.sin(an) * rr;
        lit(ctx, () => glowDisc(ctx, x, y, 12 * s + 2, '#FFF4B8', 0.6 * s));
        ctx.save(); ctx.globalAlpha = s; inked(ctx, () => star(ctx, x, y, 9 * s + 1, 4, 0.18, 0), i % 2 ? '#FFFFFF' : '#FFF4B8'); ctx.restore(); }
      { const ph = (T * 1.1 + u.id * 0.3) % 1; ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.9; inkDisc(ctx, u.x + Math.sin(T * 5 + u.id) * u.vr * 0.4 + ux * ph * 32, u.y + uy * ph * 32, 2.6, '#FFE7A0'); ctx.restore(); }
    } else if (b.id === 'warSong') { // more of it (round 9): notes rising and sparkles off the body
      for (let i = 0; i < 2; i++) { const ph = (T * 0.8 + i * 0.5 + u.id * 0.37) % 1;
        if (ph < 0.8) { ctx.save(); ctx.globalAlpha = Math.sin(ph / 0.8 * Math.PI); upright(ctx, u.x, u.y, () => { ctx.translate((i ? -1 : 1) * u.vr * 0.7 + Math.sin(ph * 6) * 3, -u.vr - 4 - ph * 26); inked(ctx, () => noteShape(ctx, 0.75), i ? EL.song[2] : EL.song[1]); }); ctx.restore(); } }
      if (Math.floor(T * 6 + u.id) % 2 === 0) { const an = hash(Math.floor(T * 6), u.id) * TAU; inked(ctx, () => star(ctx, u.x + Math.cos(an) * u.vr, u.y + Math.sin(an) * u.vr, 3.5, 4, 0.35, an), '#FFF0B0'); }
    } else if (b.id === 'lullaby') {
      const ph = (T * 0.6 + u.id * 0.29) % 1;
      ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.9; upright(ctx, u.x, u.y, () => { ctx.translate(-u.vr * 0.6 + Math.sin(ph * 6) * 4, -u.vr - 4 - ph * 20); inked(ctx, () => noteShape(ctx, 0.65), '#BFC8FF'); }); ctx.restore();
    } else if (b.whirling) whirlArcs(ctx, u, T);
  }
  // Hold the Line's mark (round 10: it pops in over the head; round 13, "The v should remain over them"): the red V stays
  // over everything he holds for as long as he holds it, bobbing a little, and fades as the taunt runs out. Round 19 (lane
  // sys19): every taunt's mark (sim.js taunt: Challenge, Showboat, the Warden's chains, the trinket), not only his
  if (u.vMarkT > T && u.tauntBy && u.tauntBy === u.vMarkBy && !u.tauntBy.dead && !u.tauntBy.downed) {
    const age = T - u.vMarkT0, left = u.vMarkT - T, q = k01(age / 0.15), s = 0.6 + 0.6 * easeOut(q) - 0.2 * k01((age - 0.15) / 0.3);
    ctx.save(); ctx.globalAlpha = q * k01(left / 0.35);
    upright(ctx, u.x, u.y, () => { ctx.translate(0, -u.vr * (u.major || u.mini ? 1.16 : u.elite ? 1.08 : 1) - 31 + Math.sin(T * 5 + u.id) * 1.6); ctx.scale(s, s); // (round 19, lane sys19: over the health bar, which hid it)
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(0, 4); ctx.lineTo(8, -8); ctx.lineTo(0, -2); ctx.closePath(); }, '#FF6B5A'); });
    ctx.restore();
  }
  // Leeches clinging to the edge of the body, pulsing
  if (u.leechT > 0) for (let i = 0; i < 3; i++) {
    const an = i / 3 * TAU + u.id + Math.sin(T * 3 + i) * 0.15, rr = u.vr * 0.92, s = 1 + 0.15 * Math.sin(T * 9 + i * 2);
    ctx.save(); ctx.translate(u.x + Math.cos(an) * rr, u.y + Math.sin(an) * rr); ctx.rotate(an + Math.PI / 2);
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 7.5 * s, 4.2, 0, 0, TAU); }, '#7A2C40');
    ctx.fillStyle = '#B0505A'; ctx.beginPath(); ctx.ellipse(-1.5, -1.2, 3.5, 1.4, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  // Rejuvenate (round 9): more leaves, coming off any part of the body, not a line through its middle
  if (u.regenT > 0) for (let i = 0; i < 4; i++) {
    const per = 1.1, ph = (T / per + i / 4 + u.id * 0.21) % 1, cyc = Math.floor(T / per + i / 4 + u.id * 0.21);
    const an = hash(cyc, i, u.id) * TAU, rr = u.vr * 1.05 * Math.sqrt(hash(i, cyc, u.id + 3));
    ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
    leaf(ctx, u.x + Math.cos(an) * rr + ux * ph * 30 + Math.sin(ph * 6 + i) * 4, u.y + Math.sin(an) * rr + uy * ph * 30, an + ph * 5, 6); ctx.restore();
  }
  // a charge or a dash: speed lines streaming off behind
  const act = u.act;
  if (act && (act.type === 'charge' || act.type === 'dash') && !act.roll && !act.slide && !act.gas && (!act.dv || act.dv.lines)) { // (round 18, lane dash18: one of the six dashes only while it travels)
    const a = act.a + Math.PI, shadow = u.kind === 'twinfang';
    for (let i = 0; i < 4; i++) { const off = (i - 1.5) * u.vr * 0.5, ph = (T * 7 + i * 0.37) % 1, d = u.vr * 0.8 + ph * 34;
      const x = u.x + Math.cos(a) * d - Math.sin(a) * off, y = u.y + Math.sin(a) * d + Math.cos(a) * off;
      ctx.save(); ctx.globalAlpha = 0.85 * (1 - ph); streak(ctx, x, y, a, 0, 26, 3.2, shadow ? '#9B86C9' : '#EEF3F8', '#FFFFFF'); ctx.restore(); }
  }
  // Cold (chill building, or frozen): round 10 (Ice Shard: "When cold units should create the snow flake particles
  // slowly"): a few snowflakes drift slowly down off the body, swaying, more the colder it is
  const cold = u.frozenT > 0 ? 1 : clamp(((u.st && u.st.chill) || 0) / 60, 0, 1);
  if (cold > 0.08) { const n = 1 + Math.round(cold * 3);
    for (let i = 0; i < n; i++) { const per = 2.4, ph = (T / per + i / n + u.id * 0.19) % 1, cyc = Math.floor(T / per + i / n + u.id * 0.19);
      const an = hash(cyc, i, u.id + 7) * TAU, rr = u.vr * (0.4 + 0.7 * hash(i, cyc, u.id)), sway = Math.sin(ph * 5 + i) * 6;
      const x = u.x + Math.cos(an) * rr - ux * ph * 26 + (view.rot ? 0 : sway), y = u.y + Math.sin(an) * rr * 0.6 - uy * (ph * 26 - u.vr * 0.5) + (view.rot ? sway : 0);
      ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * clamp(cold * 1.5, 0, 1); snowflakeK(ctx, x, y, 4.2, ph * 2 + i); ctx.restore(); } }
  // Zeus Bolt's mark: a little lightning bolt over the head, flickering
  if (u.stormMark > T) {
    const fl = Math.sin(T * 22 + u.id) > -0.6 ? 1 : 0.4;
    upright(ctx, u.x, u.y, () => { ctx.translate(0, -u.vr - 16); ctx.globalAlpha = fl; lit(ctx, () => glowDisc(ctx, 0, 0, 16, '#FFF3A0', 0.5));
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(3, -10); ctx.lineTo(-5, 1); ctx.lineTo(0, 1); ctx.lineTo(-3, 10); ctx.lineTo(6, -2); ctx.lineTo(1, -2); ctx.closePath(); }, '#FFE66B'); });
  }
  // an elite or a major: now and then a twinkle on its edge (round 9: no gold outline)
  if (u.elite && u.team === 'enemy') {
    const per = u.major || u.mini ? 1.1 : 1.7, ph = (T / per + u.id * 0.13) % 1, cyc = Math.floor(T / per + u.id * 0.13);
    if (ph < 0.3) { const q = Math.sin(ph / 0.3 * Math.PI), an = hash(cyc, u.id) * TAU, x = u.x + Math.cos(an) * u.vr * 0.85, y = u.y + Math.sin(an) * u.vr * 0.85;
      lit(ctx, () => glowDisc(ctx, x, y, 14 * q, '#FFF4C8', 0.7 * q));
      ctx.save(); ctx.globalAlpha = q; inked(ctx, () => star(ctx, x, y, 8 * q + 1, 4, 0.16, 0.2), '#FFFFFF'); ctx.restore(); }
  }
}
// Under the units (render.js, round 9): Guard's chain, War Song's ring.
export function drawBodyGround(ctx, u, w) {
  if (u.downed || u.dead) return;
  const T = w.time;
  // Guard: a chain of gold loops from the paladin to the one he guards, lying under them (round 9: "each dash a chain
  // loop", wider)
  if (u.guardBy && u.guardT > 0 && !u.guardBy.dead && !u.guardBy.downed) {
    const g = u.guardBy, L = Math.hypot(u.x - g.x, u.y - g.y), a = Math.atan2(u.y - g.y, u.x - g.x), n = Math.max(2, Math.floor(L / 15));
    ctx.save(); ctx.globalAlpha = 0.85 * clamp(u.guardT / 0.4, 0, 1);
    for (let i = 0; i < n; i++) { const q = (i + 0.5) / n, sag = Math.sin(q * Math.PI) * 6 * Math.sin(T * 2);
      ctx.save(); ctx.translate(g.x + (u.x - g.x) * q - Math.sin(a) * sag, g.y + (u.y - g.y) * q + Math.cos(a) * sag); ctx.rotate(a);
      if (i % 2) inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); }, '#E8C46A', 3.4);
      else inkLine(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 9, 5.5, 0, 0, TAU); }, '#F2C14E', 3.4);
      ctx.restore(); }
    ctx.restore();
  }
  if (u.act && u.act.slide) { // round 10: the archer's slide: dust kicked up off her feet, thinning as she slows
    const act = u.act, q = act.t / act.max, a = act.a + Math.PI;
    for (let i = 0; i < 3; i++) { const ph = (w.time * 9 + i / 3) % 1, off = (i - 1) * u.vr * 0.45, d = u.vr * 0.5 + ph * 26;
      ctx.save(); ctx.globalAlpha = (1 - ph) * clamp(q * 2, 0, 1);
      inkDisc(ctx, u.x + Math.cos(a) * d - Math.sin(a) * off, u.y + Math.sin(a) * d + Math.cos(a) * off, (4 + 5 * ph) * (0.5 + q), i % 2 ? '#E9DDC2' : '#FFF8E6'); ctx.restore(); }
  }
  // War Song: a gold ring of notes turning under anyone it lifts
  if (u.buffs && u.buffs.some((b) => b.id === 'warSong')) {
    const R = u.vr * 1.35;
    ctx.save(); ctx.globalAlpha = 0.55 + 0.15 * Math.sin(T * 4 + u.id);
    lit(ctx, () => { ctx.strokeStyle = rgba(EL.song[1], 0.5); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, TAU); ctx.stroke(); });
    ctx.strokeStyle = rgba(EL.song[2], 0.9); ctx.lineWidth = 2; ctx.setLineDash([10, 9]); ctx.lineDashOffset = -T * 30; ctx.beginPath(); ctx.arc(u.x, u.y, R, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}
// Whirl (round 9): bigger balls, the shape of his flail's head. Round 10: "Remove strings. They also look like they are
// in a different style than what he's holding": no chains, and the head drawn like the one in his hand (art/heroes/
// berserker.svg): a pale steel ball, six fat cone spikes round it, a four-faced spike on top lit from the top left.
export function flailHead(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  // (round 13: this path never began anew, so it took in whatever was drawn last: Whirl's white crescent came out inked
  // over and striped, which is the "changed more than what I asked")
  inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, c = Math.cos(a), s2 = Math.sin(a), w2 = 0.42;
    ctx.moveTo(Math.cos(a - w2) * r * 0.86, Math.sin(a - w2) * r * 0.86); ctx.lineTo(c * r * 1.62, s2 * r * 1.62); ctx.lineTo(Math.cos(a + w2) * r * 0.86, Math.sin(a + w2) * r * 0.86); ctx.closePath(); }
    ctx.moveTo(r, 0); ctx.arc(0, 0, r, 0, TAU); }, '#A9B2C1');
  ctx.restore();
  // lit faces of the spikes and the top pyramid stay lit from the top left whatever the spin
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#7F8898'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#C3CAD4'; ctx.beginPath(); ctx.arc(-r * 0.08, -r * 0.08, r * 0.88, 0, TAU); ctx.fill();
  const p = r * 0.7;
  ctx.fillStyle = '#F6F8FB'; ctx.beginPath(); ctx.moveTo(-p, 0); ctx.lineTo(0, -p); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#D9DEE6'; ctx.beginPath(); ctx.moveTo(0, -p); ctx.lineTo(p, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#A4ACB9'; ctx.beginPath(); ctx.moveTo(-p, 0); ctx.lineTo(0, p); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8D96A6'; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(0, p); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function whirlArcs(ctx, u, T) {
  const R = u.r + 46, a = T * 13;
  for (let i = 0; i < 2; i++) { const b = a + i * Math.PI, hx = u.x + Math.cos(b) * (R - 9), hy = u.y + Math.sin(b) * (R - 9);
    slashBand(ctx, u.x, u.y, R, b - 1.6, b, 16, '#DCE3EC', '#FFFFFF');
    flailHead(ctx, hx, hy, 10.5, T * 9); } // (round 13: as big as the round 9 balls were, and turning as they did)
}

// where a weapon held out for a full turn points, from the way its holder faces (parts.js: arm-r turned out to the side)
const SPIN_AT = { cleave: -1.1, reap: -1.1 };
// ---------------------------------------------------------------- ability-shaped versions of the plain fx
// fx.js asks here first for anything an ability made (f.ab); true = drawn.
export function abilityRing(ctx, f) {
  const k = k01(f.t / f.max), e = easeOut(k), seed = Math.round(f.x * 3 + f.y);
  switch (f.ab) {
    case 'cleave': case 'reap': { // round 9: the blade's circle follows her as she spins (render.js u.spin), the scythe's in bone
      // round 13 (Cleave: "Slash is too far ahead from sword"): the crescent's head is where the blade is: it turns with
      // the sprite (the same easing as render.js's spin) from where the weapon is held out (SPIN_AT, measured off the
      // art), and its tail trails behind by at most a third of a turn
      const scy = f.ab === 'reap', a0 = f.a != null ? f.a : hash(seed) * TAU, turn = TAU * sm(k), at = scy ? SPIN_AT.reap : SPIN_AT.cleave;
      const x = f.unit && !f.unit.dead ? f.unit.x : f.x, y = f.unit && !f.unit.dead ? f.unit.y : f.y;
      const h = a0 + at + turn, len = Math.min(turn, 2.1) * (1 - sm(k01((k - 0.8) / 0.2)));
      // (and it starts at the blade's tip, not far out past it: kits.js brought the reach in to what a blade that long sweeps)
      slashBand(ctx, x, y, f.r, h - Math.max(0.05, len), h, ((f.tier || 1) >= 2 ? 34 : 24) * (1 - 0.2 * k), scy ? EL.bone[1] : '#DCE3EC', '#FFFFFF', !scy);
      return true;
    }
    case 'groundPound': case 'leap': case 'oldBones': return true; // on the ground layer (abilityRingGround)
    case 'inferno': { // a nova of flame tongues rolling out
      if (k < 0.2) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r, '#FFF0B0', 0.8 * (1 - k / 0.2)));
      const r = f.r * (0.25 + 0.75 * e), n = Math.max(12, Math.round(f.r / 9));
      lit(ctx, () => { ctx.strokeStyle = rgba('#FF8A3D', 0.5 * (1 - k)); ctx.lineWidth = 26 * (1 - k) + 2; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.stroke(); });
      ctx.save(); ctx.globalAlpha *= 1 - k * k;
      for (let i = 0; i < n; i++) { const b = i / n * TAU; upright(ctx, f.x + Math.cos(b) * r, f.y + Math.sin(b) * r, () => flame(ctx, 0, 0, (9 + 4 * hash(i, seed)) * (1 - 0.6 * k))); }
      ctx.restore(); return true;
    }
    case 'frostNova': case 'frostArrow': { // ice spikes bursting outward along the floor
      const r = f.r * (0.2 + 0.8 * easeOut(k01(k / 0.5))), n = Math.max(10, Math.round(f.r / 11));
      if (k < 0.25) lit(ctx, () => glowDisc(ctx, f.x, f.y, f.r * 1.1, '#DDF6FF', 0.75 * (1 - k / 0.25)));
      ctx.save(); ctx.globalAlpha *= 1 - sm(k01((k - 0.5) / 0.5));
      for (let i = 0; i < n; i++) { const b = (i + 0.5 * (i % 2)) / n * TAU, rr = r * (i % 2 ? 0.72 : 1), s = 9 + 4 * hash(i, seed);
        ctx.save(); ctx.translate(f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr); ctx.rotate(b);
        inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s * 1.6, 0); ctx.lineTo(0, -s * 0.5); ctx.lineTo(-s * 0.7, 0); ctx.lineTo(0, s * 0.5); ctx.closePath(); }, '#BFE9F8');
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(s * 1.4, 0); ctx.lineTo(0, -s * 0.38); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.restore(); return true;
    }
    case 'thunderclap': { // a jagged ring of lightning rolling out
      const r = f.r * (0.3 + 0.7 * e), n = 8;
      ctx.save(); ctx.globalAlpha *= 1 - k;
      for (let i = 0; i < n; i++) { const b0 = i / n * TAU, b1 = (i + 1) / n * TAU; bolt(ctx, f.x + Math.cos(b0) * r, f.y + Math.sin(b0) * r, f.x + Math.cos(b1) * r, f.y + Math.sin(b1) * r, f.t, seed + i, 3); }
      ctx.restore(); return true;
    }
  }
  return false;
}
// The ground-layer half: Ground Pound, Leap's landing, Old Bones III (round 9: under the units, no cracks)
export function abilityRingGround(ctx, f) {
  if (f.ab !== 'groundPound' && f.ab !== 'leap' && f.ab !== 'oldBones') return false;
  quake(ctx, f.x, f.y, f.r, k01(f.t / f.max), Math.round(f.x * 3 + f.y));
  return true;
}
// Hook (round 9): the chain lies under her, the hook is a scythe blade, it flies out slower and reels the foe in
export function hookGround(ctx, f, T) {
  const k = k01(f.t / f.max), outK = k01(f.t / 0.3), back = sm(k01((f.t - 0.3) / 0.45));
  const s = f.hookFrom && !f.hookFrom.dead ? f.hookFrom : { x: f.x1, y: f.y1 }, tg = f.hookTo && !f.hookTo.dead ? f.hookTo : { x: f.x2, y: f.y2 };
  const tx = f.t < 0.3 ? f.x1 + (f.x2 - f.x1) * easeOut(outK) : tg.x, ty = f.t < 0.3 ? f.y1 + (f.y2 - f.y1) * easeOut(outK) : tg.y;
  const x2 = s.x + (tx - s.x) * (1 - back * 0.9), y2 = s.y + (ty - s.y) * (1 - back * 0.9);
  const L = Math.hypot(x2 - s.x, y2 - s.y), a = Math.atan2(y2 - s.y, x2 - s.x), n = Math.max(1, Math.floor(L / 11));
  ctx.save(); ctx.globalAlpha *= 1 - sm(k01((k - 0.85) / 0.15));
  for (let i = 0; i < n; i++) { const q = (i + 0.5) / n; ctx.save(); ctx.translate(s.x + (x2 - s.x) * q, s.y + (y2 - s.y) * q); ctx.rotate(a);
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 6, i % 2 ? 2 : 3.6, 0, 0, TAU); }, '#9AA3AE'); ctx.restore(); }
  // the scythe blade on the end, hooked back towards her
  ctx.translate(x2, y2); ctx.rotate(a);
  inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(14, -4, 18, 14); ctx.quadraticCurveTo(8, 2, -6, 4); ctx.closePath(); }, EL.bone[1]);
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(0, 0.5); ctx.quadraticCurveTo(12, -2, 16, 11); ctx.quadraticCurveTo(9, 1, 0, 2); ctx.closePath(); ctx.fill();
  ctx.restore();
  return true;
}
export function abilityBeam(ctx, f, T) {
  const k = k01(f.t / f.max);
  if (f.ab === 'hook') return true; // on the ground (hookGround)
  if (f.ab === 'encore') { // round 9: a shooting star arcing from the lute to the ally, a trail of little stars, a burst round them
    const fly = 0.62, q = easeOut(k01(k / fly)), [ux, uy] = upVec(), L = Math.hypot(f.x2 - f.x1, f.y2 - f.y1);
    const pt = (t) => { const h = Math.sin(t * Math.PI) * L * 0.35; return [f.x1 + (f.x2 - f.x1) * t + ux * h, f.y1 + (f.y2 - f.y1) * t + uy * h]; };
    if (k < fly) {
      for (let i = 1; i <= 7; i++) { const t2 = q - i * 0.045; if (t2 <= 0) break; const [x, y] = pt(t2); ctx.save(); ctx.globalAlpha *= 1 - i / 8; inked(ctx, () => star(ctx, x, y, 5 - i * 0.5, 4, 0.4, T * 6 + i), i % 2 ? EL.song[2] : '#FFFFFF'); ctx.restore(); }
      const [x, y] = pt(q), s = 1 + 0.25 * Math.sin(T * 30);
      lit(ctx, () => glowDisc(ctx, x, y, 26, EL.song[1], 0.7));
      inked(ctx, () => star(ctx, x, y, 12 * s, 5, 0.45, T * 9), EL.song[1]); ctx.fillStyle = '#FFFFFF'; star(ctx, x, y, 5 * s, 5, 0.45, T * 9); ctx.fill();
    } else { const g = k01((k - fly) / (1 - fly)), e = easeOut(g);
      ctx.save(); ctx.globalAlpha *= 1 - g;
      for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + g * 2, d = 10 + 34 * e; inked(ctx, () => star(ctx, f.x2 + Math.cos(b) * d, f.y2 + Math.sin(b) * d, 6 * (1 - g) + 2, 5, 0.42, b + g * 4), i % 2 ? EL.song[2] : EL.song[1]); }
      // a turning arrow of light round them: their ability is ready again
      inkLine(ctx, () => { ctx.beginPath(); ctx.arc(f.x2, f.y2, 28 + 6 * e, g * 6, g * 6 + 4.2); }, '#FFF0B0', 3.4);
      const ea = g * 6 + 4.2, ex = f.x2 + Math.cos(ea) * (28 + 6 * e), ey = f.y2 + Math.sin(ea) * (28 + 6 * e);
      inked(ctx, () => { ctx.beginPath(); ctx.moveTo(ex + Math.cos(ea + Math.PI / 2) * 7, ey + Math.sin(ea + Math.PI / 2) * 7); ctx.lineTo(ex + Math.cos(ea) * 5, ey + Math.sin(ea) * 5); ctx.lineTo(ex - Math.cos(ea) * 5, ey - Math.sin(ea) * 5); ctx.closePath(); }, '#FFF0B0');
      ctx.restore(); }
    return true;
  }
  if (f.ab === 'guard') return true; // the chain and the shield show it (drawBodyGround, the sig)
  return false;
}
// zones an ability made that want their own look
export function abilityZone(ctx, f, T) {
  if (f.ab === 'rejuvenate' || f.ab === 'cure') return true; // drawn over the units (abilityZoneAir, round 9)
  if (f.smoke || f.kind === 'smoke') { // Twinfang's smoke: a body like the puddles (puddles.js), merging with any other
    const a = clamp(Math.min(f.t / 0.15, (f.max - f.t) / 0.7), 0, 1);
    drawPuddle(ctx, 'smoke', f.x, f.y, f.r * (0.7 + 0.3 * easeOut(clamp(f.t / 0.25, 0, 1))), T, a, Math.round(f.x * 3 + f.y));
    return true;
  }
  if (f.ab === 'roll' && f.kind === 'vines') { // the Archer's caltrops (Roll III)
    // round 13 ("They should slide out"): each one leaves her as she rolls, one after another, and skids along the floor
    // to its place, turning, slowing, a scuff of dust behind it; it settles with a glint. Drawn as a caltrop from above:
    // three steel spikes on the floor and the fourth standing up at you.
    const a = clamp((f.max - f.t) / 0.5, 0, 1), seed = Math.round(f.x * 3 + f.y), N = 8;
    if (!f._from) f._from = [];
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < N; i++) { const b = (i + 0.5 * hash(seed, i)) / N * TAU, rr = f.r * (0.22 + 0.72 * hash(i, seed)), lx = f.x + Math.cos(b) * rr, ly = f.y + Math.sin(b) * rr;
      const t0 = 0.02 + i * 0.03, q = k01((f.t - t0) / 0.3); if (q <= 0) continue;
      const src = f.from && !f.from.dead ? f.from : f;
      if (!f._from[i]) f._from[i] = [src.x, src.y];
      const [sx, sy] = f._from[i], e = easeOut(q), x = sx + (lx - sx) * e, y = sy + (ly - sy) * e, rot = b + (1 - e) * 7;
      if (q < 1) { const ta = Math.atan2(ly - sy, lx - sx); // the scuff it leaves while it skids
        for (let j = 1; j <= 3; j++) { ctx.save(); ctx.globalAlpha *= (1 - q) * (1 - j / 4); inkDisc(ctx, x - Math.cos(ta) * j * 7, y - Math.sin(ta) * j * 7, 3.4 - j * 0.6, '#E9DDC2'); ctx.restore(); } }
      caltrop(ctx, x, y, 9, rot);
      const g = (f.t - t0 - 0.3) / 0.22; if (g > 0 && g < 1) { ctx.save(); ctx.globalAlpha *= Math.sin(g * Math.PI); lit(ctx, () => glowDisc(ctx, x, y, 12, '#FFFFFF', 0.7)); inked(ctx, () => star(ctx, x - 2, y - 2, 4.5, 4, 0.22, 0.4), '#FFFFFF'); ctx.restore(); } }
    ctx.restore(); return true;
  }
  return false;
}
function caltrop(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  inked(ctx, () => { ctx.beginPath(); for (let i = 0; i < 3; i++) { const b = i / 3 * TAU; ctx.moveTo(Math.cos(b - 1.25) * s * 0.34, Math.sin(b - 1.25) * s * 0.34); ctx.lineTo(Math.cos(b) * s, Math.sin(b) * s); ctx.lineTo(Math.cos(b + 1.25) * s * 0.34, Math.sin(b + 1.25) * s * 0.34); ctx.closePath(); } }, '#A9B2C1');
  ctx.fillStyle = '#DCE3EC'; ctx.beginPath(); for (let i = 0; i < 3; i++) { const b = i / 3 * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(b) * s * 0.92, Math.sin(b) * s * 0.92); ctx.lineTo(Math.cos(b - 1.25) * s * 0.3, Math.sin(b - 1.25) * s * 0.3); ctx.closePath(); } ctx.fill();
  ctx.restore();
  inkDisc(ctx, x, y, s * 0.3, '#EEF3F8'); disc(ctx, x - s * 0.08, y - s * 0.08, s * 0.13, '#FFFFFF'); // the spike standing up
}
// a quick swirl at the ally, over everything (round 9: Rejuvenate's ring "show above entities")
export function abilityZoneAir(ctx, f, T) {
  if (f.ab !== 'rejuvenate' && f.ab !== 'cure') return;
  const k = k01(f.t / f.max), e = easeOut(k), [ux, uy] = upVec();
  ctx.save(); ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + k * 4, d = 12 + 26 * e, up = e * 24, x = f.x + Math.cos(b) * d + ux * up, y = f.y + Math.sin(b) * d + uy * up;
    if (f.ab === 'rejuvenate') leaf(ctx, x, y, b + 1.5, 7); else { inkDisc(ctx, x, y, 5 * (1 - 0.5 * k), i % 2 ? '#BFE9F8' : '#E6FFF4'); disc(ctx, x - 1.5, y - 1.5, 1.6, '#FFFFFF'); } }
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 50, f.ab === 'rejuvenate' ? EL.nature[2] : EL.water[2], 0.6 * (1 - k / 0.3)));
  ctx.restore();
}

// Reap's red orbs (round 9): one pops off each foe hit and homes into her. Round 10: "Blood orbs should pop when they get
// to her. Also 'drip' as they travel": drops fall off behind them on the way, and each bursts in a splash on arrival.
export function soulOrb(ctx, f) {
  const t = f.t - (f.delay || 0); if (t < 0) return;
  const k = k01(t / (f.max - (f.delay || 0))), to = f.to && !f.to.dead ? f.to : null; if (!to) return;
  const ARR = 0.8, pop = k01(k / 0.2), q = sm(k01((k - 0.12) / (ARR - 0.12))), [ux, uy] = upVec(), seed = Math.round(f.x + f.y);
  const side = hash(seed) < 0.5 ? -1 : 1, a = Math.atan2(to.y - f.y, to.x - f.x), L = Math.hypot(to.x - f.x, to.y - f.y);
  const at = (qq) => { const hop = Math.sin(qq * Math.PI) * (26 + L * 0.2), sw = side * Math.sin(qq * Math.PI) * L * 0.25;
    return [f.x + (to.x - f.x) * qq + ux * hop * 0.5 - Math.sin(a) * sw, f.y + (to.y - f.y) * qq + uy * hop * 0.5 + Math.cos(a) * sw]; };
  // the drips: each leaves the orb at its moment and falls (down the screen), shrinking
  for (let i = 0; i < 6; i++) { const qi = 0.08 + i * 0.14, da = (q >= 1 ? 1 + (k - ARR) * 3 : q) - qi; if (da <= 0 || da > 0.32) continue;
    const g = da / 0.32, [dx, dy] = at(qi), fall = 24 * g * g + 4 * g;
    ctx.save(); ctx.globalAlpha *= 1 - g * g;
    inked(ctx, () => { const x = dx - ux * fall + (hash(seed, i) - 0.5) * 6, y = dy - uy * fall, r = 3.4 * (1 - 0.45 * g) + 0.6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.moveTo(x - r * 0.8, y + uy * r * 0.4 + ux * 0); ctx.lineTo(x + ux * r * 2.2, y + uy * r * 2.2); ctx.lineTo(x + r * 0.8, y); }, '#C8302E');
    ctx.restore(); }
  if (k >= ARR) { // the pop: a flash on her, a ring of droplets flung out, gone
    const p = k01((k - ARR) / (1 - ARR)), e = easeOut(p);
    if (p < 0.4) lit(ctx, () => glowDisc(ctx, to.x, to.y, 24 + 16 * e, '#FF5A4A', 0.7 * (1 - p / 0.4)));
    ctx.save(); ctx.globalAlpha *= 1 - p * p;
    // (round 13: thrown out past her edge, on the side the orb came in from, and few: four orbs' worth made a ring of beads on her face)
    for (let i = 0; i < 4; i++) { const b = a + Math.PI + (i - 1.5) * 0.5 + (hash(seed, i) - 0.5) * 0.3, d = (to.vr || 22) * 0.95 + 20 * e; inkDisc(ctx, to.x + Math.cos(b) * d, to.y + Math.sin(b) * d, 2.8 * (1 - 0.6 * p) + 0.5, i % 2 ? '#E0403A' : '#FF8A7A'); }
    ctx.restore(); return;
  }
  const [x, y] = at(q);
  lit(ctx, () => glowDisc(ctx, x, y, 16, '#FF5A4A', 0.6));
  inkDisc(ctx, x, y, 5.5 * (0.6 + 0.4 * pop), '#E0403A'); disc(ctx, x - 1.6, y - 1.6, 2, '#FFB0A0');
}

// Ice Wall (round 9): about five ragged ice chunks, like boulders, thrown out from her into a line; melting at the end.
export function drawIceWall(ctx, r, T) {
  if (r._t0 == null) r._t0 = r.temp;
  const age = r._t0 - r.temp, melt = k01(r.temp / 0.6);
  const horiz = r.w >= r.h, L = horiz ? r.w : r.h, n = 5, seed = Math.round(r.x + r.y * 3);
  const fx0 = r.fromX ?? r.x + r.w / 2, fy0 = r.fromY ?? r.y + r.h / 2, [ux, uy] = upVec();
  ctx.save(); ctx.globalAlpha *= melt;
  for (let i = 0; i < n; i++) {
    const q = (i + 0.5) / n, tx = horiz ? r.x + r.w * q : r.x + r.w / 2 + (hash(i, seed) - 0.5) * 8, ty = horiz ? r.y + r.h / 2 + (hash(i, seed) - 0.5) * 8 : r.y + r.h * q;
    const fly = easeOut(k01((age - Math.abs(i - 2) * 0.05) / 0.28)); if (fly <= 0) continue;
    const hop = Math.sin(fly * Math.PI) * 28, x = fx0 + (tx - fx0) * fly + ux * hop, y = fy0 + (ty - fy0) * fly + uy * hop;
    const s = (L / n) * 0.62 * (0.85 + 0.25 * hash(seed, i)) * (0.6 + 0.4 * fly), rot = hash(i, seed, 3) * TAU + (1 - fly) * 4;
    if (fly >= 1 && age < 0.45) { ctx.save(); ctx.globalAlpha *= 1 - (age - 0.3) / 0.15; dustPuffs(ctx, x, y, s, k01((age - 0.28) / 0.17), seed + i, 4, '#DDF6FF'); ctx.restore(); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const m = 7, pts = []; for (let j = 0; j < m; j++) { const a = j / m * TAU, rr = s * (0.72 + 0.38 * hash(seed, i, j)); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    inked(ctx, () => { ctx.beginPath(); pts.forEach(([px, py], j) => (j ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); }, '#9FDDF6');
    ctx.fillStyle = '#BFE9F8'; ctx.beginPath(); ctx.moveTo(0, 0); for (let j = 3; j <= 6; j++) ctx.lineTo(pts[j % m][0] * 0.95, pts[j % m][1] * 0.95); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#EAF9FF'; ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.15); ctx.lineTo(pts[4][0] * 0.7, pts[4][1] * 0.7); ctx.lineTo(pts[5][0] * 0.7, pts[5][1] * 0.7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
