// The round 8 effects kit (lane V): one look for every attack and ability (docs/FX-STYLE.md).
//   - melee arcs shaped to the weapon (a sweeping crescent, a stab, a heavy blow, a scythe, claws, a bite)
//   - each hero ability's signature (fxtag.js tags what an ability makes; 'sig' fx carry the cast itself)
//   - body effects read off a unit's state (Rage's steam, Whirl's flail, Guard's tether, leeches, leaves...)
//   - impacts where shots stop, the burst when an enemy's danger zone strikes, blasts
// Everything here is drawn by the renderer from what the sim leaves in the world; nothing here changes the game.
import { INK, TAU, clamp } from './util.js';
import { OUTLINE, view } from './render.js';
import { hash, rgba, upright, upVec, inked, inkLine, flame, blob, star, glowDisc, bolt, easeOut, leaf } from './fx.js';

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
function bandPath(ctx, cx, cy, R, aT, aH, th) {
  const span = aH - aT, n = Math.max(6, Math.ceil(Math.abs(span) * 9)), dir = span >= 0 ? 1 : -1;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = aT + span * i / n; ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
  const rm = R - th / 2; ctx.arc(cx + Math.cos(aH) * rm, cy + Math.sin(aH) * rm, th / 2, aH, aH + Math.PI * dir, dir < 0);
  for (let i = n; i >= 0; i--) { const s = i / n, a = aT + span * s; const r = R - th * Math.pow(s, 0.85); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  ctx.closePath();
}
function slashBand(ctx, cx, cy, R, aT, aH, th, main, core) {
  if (Math.abs(aH - aT) < 0.02 || th < 0.6) return;
  inked(ctx, () => bandPath(ctx, cx, cy, R, aT, aH, th), main);
  ctx.fillStyle = core; bandPath(ctx, cx, cy, R - th * 0.1, aT + (aH - aT) * 0.3, aH, th * 0.36); ctx.fill();
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
function dustPuffs(ctx, x, y, r, k, seed, n = 7, col = '#E9DDC2') {
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
      const odd = u ? (u._n || 0) % 2 : 0;
      const team = u && u.team === 'hero' ? 'hero' : 'enemy';
      let col = SLASH_COL[team];
      if (shape === 'scythe') col = SLASH_COL.scythe; else if (shape === 'smack') col = u && u.kind === 'fireSlime' ? SLASH_COL.fire : SLASH_COL.smack; else if (u && u.kind === 'ghost') col = SLASH_COL.ghost;
      push({ type: 'slash', u, x: t.x, y: t.y, R: t.r, a: t.a, arc: t.arc, shape, dir: (shape === 'twin' || shape === 'twinBlade') && odd ? -1 : 1, side: odd ? -1 : 1, col, max: shape === 'heavy' || shape === 'great' ? 0.34 : 0.28, seed: Math.round(t.x * 7 + t.y) });
    } else if (t.type === 'blast') {
      push({ type: 'blast', x: t.x, y: t.y, r: t.r, color: t.color || '#FFB347', ab: t.ab, max: t.ab === 'fireball' ? 0.6 : 0.45, seed: Math.round(t.x + t.y * 3) });
    }
  }
  // shots that are gone burst where they stopped
  const now = new Set(w.projectiles);
  if (w._proj) for (const p of w._proj) if (!now.has(p) && !p.lab) {
    if (p.noHit) continue; // a lobbed thing: its landing is the danger zone's strike
    push({ type: 'impact', kind: p.kind, ab: p.ab, x: p.x, y: p.y, a: Math.atan2(p.vy, p.vx), col: p.color, max: p.ab ? 0.45 : 0.32, seed: Math.round(p.x * 3 + p.y) });
  }
  w._proj = now;
  // a danger zone striking: a burst shaped to its kind
  for (const z of w.danger || []) if (z.t <= 0 && !z._struck) { z._struck = true; if (!z.cancelled) push({ type: 'strike', z, kind: z.kind, max: 0.55, seed: Math.round((z.x ?? z.x1) * 5 + (z.y ?? z.y1)) }); }
  for (const u of w.units) {
    // an enemy's ground slam (sim.js 'slam' act) lands
    const slam = u.act && u.act.type === 'slam';
    if (u._slam && !slam && !u.downed) push({ type: 'quake', x: u.x, y: u.y, r: 125, max: 0.8, seed: u.id, col: EL.earth });
    u._slam = slam;
    // Granny's Old Bones saved her
    if (u.kit && u.kit.oldBonesUsed && !u._oldBones) push({ type: 'oldBones', u, x: u.x, y: u.y, max: 0.9, seed: u.id });
    if (u.kit) u._oldBones = !!u.kit.oldBonesUsed;
  }
}

export function drawMarks(ctx, dt, layer) {
  for (const m of marks) {
    if (layer === 'air') m.t += dt;
    const k = k01(m.t / m.max);
    ctx.save();
    if (layer === 'ground') { if (m.type === 'quake') quake(ctx, m.x, m.y, m.r, k, m.seed, m.col); else if (m.type === 'strike') strikeGround(ctx, m, k); }
    else switch (m.type) {
      case 'slash': slash(ctx, m, k); break;
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
  if (sh === 'thrust' || sh === 'twin') {
    const r0 = (u ? u.r : 20) * 0.55, r1 = m.R + 16;
    const tip = r0 + (r1 - r0) * easeOut(k01(k / 0.32)), base = r0 + (tip - r0) * sm(k01((k - 0.22) / 0.78));
    const off = sh === 'twin' ? m.side * 9 : 0, nx = -Math.sin(m.a) * off, ny = Math.cos(m.a) * off;
    streak(ctx, x + nx, y + ny, m.a, base, tip, (sh === 'twin' ? 7 : 9) * (1 - 0.35 * k), main, core);
    return;
  }
  if (sh === 'bite' || sh === 'claw') {
    const reach = m.R * 0.85, px = x + Math.cos(m.a) * reach, py = y + Math.sin(m.a) * reach, s = clamp(m.R / 40, 0.6, 1.4);
    if (sh === 'bite') { // two curved jaws snapping shut
      const shut = easeOut(k01(k / 0.35)), gap = (1 - shut) * 12 * s + 2, fade = k01((1 - k) / 0.5);
      ctx.globalAlpha *= fade;
      for (const sd of [-1, 1]) {
        const cx = px - Math.sin(m.a) * gap * sd, cy = py + Math.cos(m.a) * gap * sd, aa = m.a + Math.PI / 2 * sd;
        slashBand(ctx, cx, cy, 13 * s, aa - 1.2, aa + 1.2, 6 * s, main, core);
      }
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
  let th = 18, R = m.R, extra = 0.4;
  if (sh === 'heavy') { th = 26; R *= 0.96; extra = 0.15; }
  else if (sh === 'great') { th = 24; R *= 1.06; extra = 0.5; }
  else if (sh === 'flail') { th = 18; R *= 1.04; extra = 0.45; }
  else if (sh === 'scythe') { th = 13; R *= 1.12; extra = 0.7; }
  else if (sh === 'smack') { th = 20; R *= 0.9; extra = 0; }
  else if (sh === 'twinBlade') { th = 16; extra = 0.3; }
  const span = m.arc + extra, a0 = m.a - m.dir * span / 2;
  const head = a0 + m.dir * span * easeOut(k01(k / 0.42)), tail = a0 + m.dir * span * sm(k01((k - 0.18) / 0.82));
  slashBand(ctx, x, y, R, tail, head, th * (1 - 0.3 * k), main, core);
  const hx = x + Math.cos(head) * (R - th * 0.4), hy = y + Math.sin(head) * (R - th * 0.4);
  if (sh === 'flail') inked(ctx, () => { star(ctx, hx, hy, 11, 8, 0.62, k * 9); }, '#8D949C');
  if (sh === 'heavy' && k > 0.38) { // the blow lands: dust thrown up and the floor cracks where it ends
    const kk = k01((k - 0.38) / 0.62);
    dustPuffs(ctx, hx, hy, 22, kk, m.seed, 6);
  }
}

// ---------------------------------------------------------------- impacts where shots stop
const IMPACT_EL = { arrow: 'steel', fireArrow: 'fire', fireball: 'fire', shard: 'frost', icicle: 'frost', dagger: 'steel', vial: 'poison', thorn: 'nature', note: 'song', bone: 'bone', water: 'water' };
function impact(ctx, m, k) {
  const big = !!m.ab, kind = m.kind, e = easeOut(k), x = m.x, y = m.y, a = m.a;
  const el = EL[kind === 'bolt' ? null : IMPACT_EL[kind]] || null;
  const col = m.col || (el ? el[1] : '#C9A7FF'), light = el ? el[2] : '#FFFFFF';
  const S = big ? 1.7 : 1;
  if (k < 0.3) lit(ctx, () => glowDisc(ctx, x, y, (16 + 12 * e) * S, kind === 'arrow' || kind === 'dagger' ? '#FFF4DC' : col, 0.45 * (1 - k / 0.3)));
  ctx.globalAlpha *= 1 - k * k;
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
  } else { // a magic bolt: a star of its own colour bursting
    inked(ctx, () => star(ctx, x, y, (10 + 14 * e) * S * (1 - 0.5 * k), 6, 0.42, k * 2), col);
    ctx.fillStyle = '#FFFFFF'; star(ctx, x, y, (5 + 6 * e) * S * (1 - k), 6, 0.42, k * 2); ctx.fill();
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
function strikeGround(ctx, m, k) {
  const z = m.z;
  if (m.kind === 'bone' || m.kind === 'blade' || m.kind === 'ice') { // the floor cracks under it
    ctx.globalAlpha *= 1 - k;
    const pts = zonePoints(z, 70);
    for (let i = 0; i < pts.length; i++) crack(ctx, pts[i][0], pts[i][1], hash(m.seed, i) * TAU, 22, m.seed + i, 2.6);
  }
}
function strike(ctx, m, k) {
  const z = m.z, el = EL[STRIKE_EL[m.kind]] || EL.bone, e = easeOut(k), seed = m.seed;
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
  const pts = zonePoints(z, m.kind === 'web' ? 999 : 44);
  const up = k < 0.2 ? easeOut(k / 0.2) : 1 - sm(k01((k - 0.55) / 0.45));
  pts.forEach(([x, y, a], i) => {
    const h = hash(seed, i);
    if (m.kind === 'bone' || m.kind === 'blade') spike(ctx, x, y, (18 + 14 * h) * up, 6 + 3 * h, EL.bone[1], EL.bone[2]);
    else if (m.kind === 'ice') spike(ctx, x, y, (20 + 14 * h) * up, 7 + 3 * h, '#BFE9F8', '#FFFFFF');
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
function quake(ctx, x, y, R, k, seed, col = EL.earth) {
  const e = easeOut(k01(k / 0.6));
  ctx.save(); ctx.globalAlpha *= 1 - k;
  const n = 7;
  for (let i = 0; i < n; i++) crack(ctx, x, y, (i + hash(seed, i) * 0.6) / n * TAU, R * 0.55 * easeOut(k01(k / 0.25)), seed * 3 + i, 3.2);
  ctx.restore();
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
function oldBones(ctx, m, k) {
  const u = m.u, x = u && !u.dead ? u.x : m.x, y = u && !u.dead ? u.y : m.y, e = easeOut(k);
  if (k < 0.25) lit(ctx, () => glowDisc(ctx, x, y, 90, '#FFF8EA', 1 - k / 0.25));
  ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + 0.2, d = 20 + 60 * e;
    ctx.save(); ctx.translate(x + Math.cos(b) * d, y + Math.sin(b) * d); ctx.rotate(b + k * 5); inked(ctx, () => boneShape(ctx, 12, 4), EL.bone[1]); ctx.restore(); }
  const [ux, uy] = upVec();
  for (let i = 0; i < 4; i++) { const ph = k01(k * 1.3 - i * 0.08); inkDisc(ctx, x + (i - 1.5) * 10 + ux * ph * 50, y + uy * ph * 50 + (view.rot ? (i - 1.5) * 10 : 0), 5 * (1 - ph) + 1, '#FFF8EA'); }
}

// ---------------------------------------------------------------- ability signatures ('sig' fx, fxtag.js)
// How long each one plays (the fx lives 1.4s; a sig draws nothing after its own time).
const SIG_T = { shieldBash: 0.4, guard: 0.8, consecrate: 0.5, holdTheLine: 0.7, charge: 0.4, groundPound: 0.2, barrage: 0.3, frostArrow: 0.3,
  roll: 0.45, backstab: 0.55, dash: 0.35, fanOfKnives: 0.35, rage: 0.6, leap: 0.4, cleave: 0.2, shockwave: 0.3, whirl: 0.4,
  unstoppable: 0.7, reap: 0.2, hook: 0.3, fireball: 0.35, flameWall: 0.4, inferno: 0.3, iceShard: 0.3, frostNova: 0.3, iceWall: 0.6,
  chainLightning: 0.3, thunderclap: 0.25, stormCloud: 0.5, mend: 0.4, sanctuary: 0.6, smite: 0.3, warSong: 0.9, lullaby: 0.3,
  encore: 0.35, entangle: 0.5, rejuvenate: 0.4, callWolf: 0.8, raiseDead: 0.5, lifeDrain: 0.3, boneSpear: 0.3, miasma: 0.3,
  cure: 0.5, leeches: 0.45 };
const CAST_EL = { shieldBash: 'holy', guard: 'holy', consecrate: 'holy', holdTheLine: 'earth', charge: 'earth', groundPound: 'earth', barrage: 'steel',
  frostArrow: 'frost', roll: 'earth', backstab: 'shadow', dash: 'shadow', fanOfKnives: 'steel', rage: 'blood', leap: 'earth', cleave: 'steel',
  shockwave: 'earth', whirl: 'steel', unstoppable: 'holy', reap: 'bone', hook: 'steel', fireball: 'fire', flameWall: 'fire', inferno: 'fire',
  iceShard: 'frost', frostNova: 'frost', iceWall: 'frost', chainLightning: 'storm', thunderclap: 'storm', stormCloud: 'storm', mend: 'holy',
  sanctuary: 'holy', smite: 'holy', warSong: 'song', lullaby: 'song', encore: 'song', entangle: 'nature', rejuvenate: 'nature', callWolf: 'nature',
  raiseDead: 'necro', lifeDrain: 'blood', boneSpear: 'necro', miasma: 'poison', cure: 'water', leeches: 'blood' };
export const abilityEl = (id) => EL[CAST_EL[id]] || EL.steel;

// A burst of light in front of the caster's hands as an ability goes off (every cast gets one: the tell's end).
function castFlash(ctx, f, k, el) {
  if (k > 0.35) return;
  const u = f.u, x = (u && !u.dead ? u.x : f.x) + Math.cos(f.a) * 30, y = (u && !u.dead ? u.y : f.y) + Math.sin(f.a) * 30, q = 1 - k / 0.35;
  lit(ctx, () => glowDisc(ctx, x, y, 34 * (0.6 + 0.4 * q), el[1], 0.7 * q));
  inked(ctx, () => star(ctx, x, y, 13 * q + 2, 4, 0.32, f.a), el[3]);
}
export function drawSigGround(ctx, f, w) {
  const T = SIG_T[f.ab] || 0.4; if (f.t > T) return;
  const k = f.t / T, el = abilityEl(f.ab), e = easeOut(k);
  ctx.save();
  switch (f.ab) {
    case 'holdTheLine': { // the shield planted: the floor cracks in front of him
      const x = f.x + Math.cos(f.a) * 34, y = f.y + Math.sin(f.a) * 34;
      ctx.globalAlpha *= 1 - k * k;
      for (let i = 0; i < 5; i++) crack(ctx, x, y, f.a + (i - 2) * 0.45, 40 * easeOut(k01(k / 0.2)), i + 9, 3.4);
      dustPuffs(ctx, x, y, 34, k, 5, 8);
      break;
    }
    case 'charge': case 'roll': case 'leap': case 'dash': { // a kick of dust where it set off
      dustPuffs(ctx, f.x, f.y, f.ab === 'dash' ? 20 : 30, k, Math.round(f.x), 7, f.ab === 'dash' && f.u && f.u.kind === 'twinfang' ? '#9B86C9' : '#E9DDC2');
      break;
    }
    case 'raiseDead': case 'callWolf': {
      ctx.globalAlpha *= 1 - k;
      lit(ctx, () => glowDisc(ctx, f.x, f.y, 70, el[1], 0.45));
      break;
    }
  }
  ctx.restore();
}
export function drawSigAir(ctx, f, w) {
  const T = SIG_T[f.ab] || 0.4; if (f.t > T) return;
  const k = f.t / T, el = abilityEl(f.ab), e = easeOut(k), u = f.u, live = u && !u.dead && !u.downed;
  const ux0 = live ? u.x : f.x, uy0 = live ? u.y : f.y, seed = Math.round(f.x * 3 + f.y);
  ctx.save();
  switch (f.ab) {
    case 'shieldBash': { // a gold shove the shape of the shield's face
      const R = u.r + 14 + 34 * e;
      ctx.globalAlpha *= 1 - k * k;
      slashBand(ctx, ux0, uy0, R, f.a - 0.75, f.a + 0.75, 22 * (1 - 0.5 * k), el[2], el[3]);
      for (let i = -1; i <= 1; i++) streak(ctx, ux0 + Math.cos(f.a + i * 0.5) * (R - 8), uy0 + Math.sin(f.a + i * 0.5) * (R - 8), f.a, 4, 4 + 22 * e, 2.6, el[2], '#FFFFFF');
      break;
    }
    case 'guard': { // a shield glint pops on the guarded ally
      const a = u && u.guardOf; if (!a || a.dead) break;
      const s = k < 0.25 ? easeOut(k / 0.25) * 1.25 : 1.25 - 0.25 * k01((k - 0.25) / 0.2);
      ctx.globalAlpha *= k01((1 - k) / 0.3);
      lit(ctx, () => glowDisc(ctx, a.x, a.y, 40, el[2], 0.5));
      upright(ctx, a.x, a.y - 0, () => { ctx.translate(0, -a.vr - 16); inked(ctx, () => shieldShape(ctx, 1.25 * s), el[1]); ctx.fillStyle = '#FFFBEA'; ctx.fillRect(-1.6 * s, -9 * s, 3.2 * s, 17 * s); ctx.fillRect(-8 * s, -3 * s, 16 * s, 3.2 * s); });
      break;
    }
    case 'consecrate': case 'sanctuary': case 'smite': case 'mend': case 'unstoppable': case 'encore':
      castFlash(ctx, f, k, el);
      if (f.ab === 'unstoppable') { // gold shards break away from the body
        ctx.globalAlpha *= 1 - k;
        for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.3, d = u.vr + 8 + 46 * e, s = 7 * (1 - 0.5 * k);
          ctx.save(); ctx.translate(ux0 + Math.cos(b) * d, uy0 + Math.sin(b) * d); ctx.rotate(b + k * 6);
          inked(ctx, () => { ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.6, -s * 0.7); ctx.lineTo(-s * 0.4, s * 0.6); ctx.closePath(); }, i % 2 ? el[1] : el[2]); ctx.restore(); }
      }
      break;
    case 'holdTheLine': { // a flash of the shield face, and red streaks to everything it taunts
      for (const e2 of w.units) if (e2.tauntBy === u && !e2.dead && k < 0.6) {
        ctx.save(); ctx.globalAlpha *= 1 - k / 0.6;
        const tip = easeOut(k01(k / 0.35));
        inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(ux0, uy0); ctx.lineTo(ux0 + (e2.x - ux0) * tip, uy0 + (e2.y - uy0) * tip); }, '#FF8A7A', 3);
        upright(ctx, e2.x, e2.y, () => inked(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, -e2.vr - 22); ctx.lineTo(0, -e2.vr - 12); ctx.lineTo(6, -e2.vr - 22); }, '#FF6B5A'));
        ctx.restore();
      }
      ctx.globalAlpha *= 1 - k;
      slashBand(ctx, ux0, uy0, u.r + 22, f.a - 0.8, f.a + 0.8, 14 * (1 - k), el[2], '#FFFFFF');
      break;
    }
    case 'barrage': case 'frostArrow': case 'iceShard': case 'boneSpear': case 'fireball': case 'chainLightning': case 'miasma': case 'leeches': {
      castFlash(ctx, f, k, el);
      if (f.ab === 'leeches' && f.tgt) { // three leeches flung at the target
        for (let i = 0; i < 3; i++) { const q = k01(k * 1.4 - i * 0.12); if (q <= 0 || q >= 1) continue;
          const x = ux0 + (f.tgt.x - ux0) * q, y = uy0 + (f.tgt.y - uy0) * q, [vx, vy] = upVec(), hop = Math.sin(q * Math.PI) * 30;
          ctx.save(); ctx.translate(x + vx * hop + (i - 1) * 6, y + vy * hop); ctx.rotate(q * 10 + i); inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, 0, 0, TAU); }, '#7A2C40'); ctx.restore(); }
      }
      break;
    }
    case 'backstab': { // smoke where she steps out, and a cross of two cuts on the target
      ctx.save(); ctx.globalAlpha *= 1 - k;
      for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + seed, d = 10 + 26 * e; inkDisc(ctx, ux0 + Math.cos(b) * d, uy0 + Math.sin(b) * d, 10 * (1 - k) + 2, i % 2 ? '#5A4A7A' : '#3A2E50'); }
      ctx.restore();
      const t = f.tgt; if (!t) break;
      const tx = t.dead ? f.tx : t.x, ty = t.dead ? f.ty : t.y;
      for (const sd of [-1, 1]) { const a = f.a + sd * 0.8, q = easeOut(k01((k - (sd > 0 ? 0.08 : 0)) / 0.3)), fade = k01((1 - k) / 0.5);
        ctx.save(); ctx.globalAlpha *= fade; streak(ctx, tx - Math.cos(a) * 34, ty - Math.sin(a) * 34, a, 0, 68 * q, 6, el[2], '#FFFFFF'); ctx.restore(); }
      if (k < 0.3) lit(ctx, () => glowDisc(ctx, tx, ty, 46, el[2], 0.8 * (1 - k / 0.3)));
      break;
    }
    case 'fanOfKnives': { // a glint of blades all round her
      ctx.globalAlpha *= 1 - k;
      for (let i = 0; i < 12; i++) { const b = i / 12 * TAU, r0 = u.r + 2 + 30 * e; streak(ctx, ux0 + Math.cos(b) * r0, uy0 + Math.sin(b) * r0, b, 0, 16 * (1 - k) + 2, 3, el[2], '#FFFFFF'); }
      if (k < 0.3) lit(ctx, () => glowDisc(ctx, ux0, uy0, 60, '#FFFFFF', 0.5 * (1 - k / 0.3)));
      break;
    }
    case 'rage': { // a roar: red lines bursting out from her
      ctx.globalAlpha *= 1 - k;
      for (let i = 0; i < 14; i++) { const b = i / 14 * TAU + 0.1, r0 = u.vr + 6 + 30 * e; streak(ctx, ux0 + Math.cos(b) * r0, uy0 + Math.sin(b) * r0, b, 0, 22 * (1 - k) + 4, 3.4, i % 2 ? el[1] : el[2], '#FFF0E8'); }
      if (k < 0.3) lit(ctx, () => glowDisc(ctx, ux0, uy0, 70, '#FF5A3D', 0.6 * (1 - k / 0.3)));
      break;
    }
    case 'whirl': castFlash(ctx, f, k, el); break;
    case 'flameWall': case 'inferno': case 'frostNova': case 'iceWall': case 'thunderclap': case 'stormCloud': case 'lullaby': case 'entangle': case 'rejuvenate': case 'cure': case 'lifeDrain': case 'hook':
      castFlash(ctx, f, k, el); break;
    case 'warSong': { // notes fly from the lute to each ally it reaches
      castFlash(ctx, f, k, el);
      const list = w.units.filter((a) => a.team === u.team && a !== u && !a.dead && !a.downed && Math.hypot(a.x - f.x, a.y - f.y) < 230);
      list.forEach((a, i) => {
        for (let j = 0; j < 2; j++) { const q = k01(k * 1.5 - j * 0.18 - i * 0.05); if (q <= 0) continue;
          const [vx, vy] = upVec(), hop = Math.sin(q * Math.PI) * 26, x = f.x + (a.x - f.x) * easeOut(q) + vx * hop, y = f.y + (a.y - f.y) * easeOut(q) + vy * hop;
          if (q >= 1) continue;
          upright(ctx, x, y, () => { ctx.rotate(Math.sin(q * 9) * 0.3); inked(ctx, () => noteShape(ctx, 1.1), j ? el[2] : el[1]); });
        }
        const land = k01(k * 1.5 - 0.95 - i * 0.05);
        if (land > 0 && land < 1) { ctx.save(); ctx.globalAlpha *= 1 - land; inked(ctx, () => star(ctx, a.x, a.y, 16 * easeOut(land) + 4, 5, 0.4, 0), el[2]); ctx.restore(); }
      });
      break;
    }
    case 'callWolf': case 'raiseDead': { // a swirl of leaves (the wolf) / of spirit (the dead) where they come
      const spots = f.ab === 'raiseDead' ? w.units.filter((s) => s.summonBy === u && s.kind === 'skeleton' && !s.dead) : w.units.filter((s) => s.summonBy === u && !s.dead);
      for (const s of spots.slice(0, 2)) {
        ctx.save(); ctx.globalAlpha *= 1 - k;
        for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + k * 7, d = 14 + 34 * (1 - e), [vx, vy] = upVec(), up = e * 30;
          const x = s.x + Math.cos(b) * d + vx * up, y = s.y + Math.sin(b) * d * 0.7 + vy * up;
          if (f.ab === 'callWolf') leaf(ctx, x, y, b + 1.6, 7); else inkDisc(ctx, x, y, 4.5 * (1 - k) + 1, i % 2 ? EL.necro[2] : '#B8C8DA'); }
        if (k < 0.3) lit(ctx, () => glowDisc(ctx, s.x, s.y, 56, f.ab === 'callWolf' ? EL.nature[2] : '#B8C8DA', 0.6 * (1 - k / 0.3)));
        ctx.restore();
      }
      castFlash(ctx, f, k, el);
      break;
    }
    default: castFlash(ctx, f, k, el);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- body effects (read off a unit each frame)
// No rings or auras round a hero (designer, round 6): buffs show as things coming off the body, or on the sprite.
export function drawBodyFx(ctx, u, w) {
  if (u.downed || u.dead) return;
  const T = w.time, [ux, uy] = upVec();
  for (const b of u.buffs || []) {
    if (b.id === 'rage') { // red steam rising off her
      for (let i = 0; i < 3; i++) { const ph = (T * 1.4 + i / 3 + u.id * 0.3) % 1, an = (i * 2.1 + u.id) % TAU, rr = u.vr * 0.6;
        ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.85;
        inkDisc(ctx, u.x + Math.cos(an) * rr + ux * ph * 30, u.y + Math.sin(an) * rr + uy * ph * 30, 3 + 5 * ph, i % 2 ? '#FF8A7A' : '#E0604B'); ctx.restore(); }
    } else if (b.id === 'unstoppable') {
      if (Math.floor(T * 8 + u.id) % 3 === 0) { const an = hash(Math.floor(T * 8), u.id) * TAU, rr = u.vr + 4; inked(ctx, () => star(ctx, u.x + Math.cos(an) * rr, u.y + Math.sin(an) * rr, 6, 4, 0.3, an), '#FFE7A0'); }
    } else if (b.id === 'warSong') {
      const ph = (T * 0.8 + u.id * 0.37) % 1;
      if (ph < 0.7) { ctx.save(); ctx.globalAlpha = Math.sin(ph / 0.7 * Math.PI); upright(ctx, u.x, u.y, () => { ctx.translate(u.vr * 0.7, -u.vr - 6 - ph * 22); inked(ctx, () => noteShape(ctx, 0.75), EL.song[1]); }); ctx.restore(); }
    } else if (b.id === 'lullaby') {
      const ph = (T * 0.6 + u.id * 0.29) % 1;
      ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.9; upright(ctx, u.x, u.y, () => { ctx.translate(-u.vr * 0.6 + Math.sin(ph * 6) * 4, -u.vr - 4 - ph * 20); inked(ctx, () => noteShape(ctx, 0.65), '#BFC8FF'); }); ctx.restore();
    } else if (b.id === 'holdTheLine') { // the planted shield's face glints now and then (in front only)
      const g = 0.5 + 0.5 * Math.sin(T * 6 + u.id);
      ctx.save(); ctx.globalAlpha = 0.35 + 0.4 * g;
      slashBand(ctx, u.x, u.y, u.r + 16, u.facing - 0.7, u.facing + 0.7, 7, '#FFE7A0', '#FFFFFF'); ctx.restore();
    } else if (b.spinning) whirlArcs(ctx, u, T);
  }
  // Guard: a thin gold tether from the paladin to the one he guards
  if (u.guardBy && u.guardT > 0 && !u.guardBy.dead && !u.guardBy.downed) {
    const g = u.guardBy, q = 0.55 + 0.25 * Math.sin(T * 7);
    ctx.save(); ctx.globalAlpha = q; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -T * 40;
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(u.x, u.y); }, '#FFE7A0', 2.6); ctx.restore();
  }
  // Leeches clinging to the edge of the body, pulsing
  if (u.leechT > 0) for (let i = 0; i < 3; i++) {
    const an = i / 3 * TAU + u.id + Math.sin(T * 3 + i) * 0.15, rr = u.vr * 0.92, s = 1 + 0.15 * Math.sin(T * 9 + i * 2);
    ctx.save(); ctx.translate(u.x + Math.cos(an) * rr, u.y + Math.sin(an) * rr); ctx.rotate(an + Math.PI / 2);
    inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 7.5 * s, 4.2, 0, 0, TAU); }, '#7A2C40');
    ctx.fillStyle = '#B0505A'; ctx.beginPath(); ctx.ellipse(-1.5, -1.2, 3.5, 1.4, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  // Rejuvenate: leaves drifting up off the one being mended
  if (u.regenT > 0) for (let i = 0; i < 2; i++) {
    const ph = (T * 0.9 + i * 0.5 + u.id * 0.21) % 1, an = (i * 3.1 + u.id + T * 0.5) % TAU, rr = u.vr * (0.5 + 0.5 * ph);
    ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
    leaf(ctx, u.x + Math.cos(an) * rr + ux * ph * 28, u.y + Math.sin(an) * rr + uy * ph * 28, an + ph * 4, 6.5); ctx.restore();
  }
  // a charge or a dash: speed lines streaming off behind
  const act = u.act;
  if (act && (act.type === 'charge' || act.type === 'dash')) {
    const a = act.a + Math.PI, shadow = u.kind === 'twinfang';
    for (let i = 0; i < 4; i++) { const off = (i - 1.5) * u.vr * 0.5, ph = (T * 7 + i * 0.37) % 1, d = u.vr * 0.8 + ph * 34;
      const x = u.x + Math.cos(a) * d - Math.sin(a) * off, y = u.y + Math.sin(a) * d + Math.cos(a) * off;
      ctx.save(); ctx.globalAlpha = 0.85 * (1 - ph); streak(ctx, x, y, a, 0, 26, 3.2, shadow ? '#9B86C9' : '#EEF3F8', '#FFFFFF'); ctx.restore(); }
  }
}
function whirlArcs(ctx, u, T) {
  const R = u.r + 46, a = T * 13;
  for (let i = 0; i < 2; i++) { const b = a + i * Math.PI; slashBand(ctx, u.x, u.y, R, b - 1.6, b, 16, '#DCE3EC', '#FFFFFF');
    inked(ctx, () => star(ctx, u.x + Math.cos(b) * (R - 7), u.y + Math.sin(b) * (R - 7), 10, 8, 0.62, T * 9), '#8D949C'); }
}

// ---------------------------------------------------------------- ability-shaped versions of the plain fx
// fx.js asks here first for anything an ability made (f.ab); true = drawn.
export function abilityRing(ctx, f) {
  const k = k01(f.t / f.max), e = easeOut(k), seed = Math.round(f.x * 3 + f.y);
  switch (f.ab) {
    case 'cleave': case 'reap': { // a full circle of the blade (the scythe's thinner, bone white)
      const scy = f.ab === 'reap', q = k;
      const head = hash(seed) * TAU, span = TAU + 0.4;
      const h = head + span * easeOut(k01(q / 0.5)), t = head + span * sm(k01((q - 0.2) / 0.8));
      slashBand(ctx, f.x, f.y, f.r + (scy ? 6 : 0), t, h, (scy ? 14 : 22) * (1 - 0.3 * q), scy ? EL.bone[1] : '#DCE3EC', '#FFFFFF');
      return true;
    }
    case 'groundPound': case 'leap': case 'oldBones': quake(ctx, f.x, f.y, f.r, k, seed); return true;
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
export function abilityBeam(ctx, f, T) {
  const k = k01(f.t / f.max);
  if (f.ab === 'hook') { // a chain thrown out, the hook biting, then reeled in
    const out = easeOut(k01(k / 0.35)), back = sm(k01((k - 0.45) / 0.55)), reach = out * (1 - back * 0.85);
    const x2 = f.x1 + (f.x2 - f.x1) * reach, y2 = f.y1 + (f.y2 - f.y1) * reach, L = Math.hypot(x2 - f.x1, y2 - f.y1), a = Math.atan2(y2 - f.y1, x2 - f.x1);
    const n = Math.max(1, Math.floor(L / 11));
    for (let i = 0; i < n; i++) { const q = (i + 0.5) / n; ctx.save(); ctx.translate(f.x1 + (x2 - f.x1) * q, f.y1 + (y2 - f.y1) * q); ctx.rotate(a);
      inked(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 6, i % 2 ? 2 : 3.6, 0, 0, TAU); }, '#9AA3AE'); ctx.restore(); }
    ctx.save(); ctx.translate(x2, y2); ctx.rotate(a);
    inkLine(ctx, () => { ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(6, 0); ctx.arc(6, 8, 8, -Math.PI / 2, Math.PI * 0.6); }, '#D9DEE4', 3.6);
    ctx.restore(); return true;
  }
  if (f.ab === 'encore') { // a shooting star from the lute to the ally
    const q = easeOut(k01(k / 0.6)), x = f.x1 + (f.x2 - f.x1) * q, y = f.y1 + (f.y2 - f.y1) * q, a = Math.atan2(f.y2 - f.y1, f.x2 - f.x1);
    lit(ctx, () => { const g = ctx.createLinearGradient(x - Math.cos(a) * 80, y - Math.sin(a) * 80, x, y); g.addColorStop(0, rgba(EL.song[1], 0)); g.addColorStop(1, rgba(EL.song[2], 0.8)); ctx.strokeStyle = g; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 80 * q, y - Math.sin(a) * 80 * q); ctx.lineTo(x, y); ctx.stroke(); });
    inked(ctx, () => star(ctx, x, y, 11, 5, 0.45, T * 5), EL.song[1]);
    if (k > 0.6) { const g = k01((k - 0.6) / 0.4); ctx.save(); ctx.globalAlpha *= 1 - g; inked(ctx, () => star(ctx, f.x2, f.y2, 8 + 22 * easeOut(g), 5, 0.4, 0.3), EL.song[2]); ctx.restore(); }
    return true;
  }
  if (f.ab === 'guard') return true; // the tether and the shield glint show it (drawBodyFx, the sig)
  return false;
}
// zones an ability made that want their own look
export function abilityZone(ctx, f, T) {
  const k = k01(f.t / f.max);
  if (f.ab === 'rejuvenate' || f.ab === 'cure') { // a quick swirl at the ally: leaves, or clean bubbles
    const e = easeOut(k), [ux, uy] = upVec();
    ctx.save(); ctx.globalAlpha *= 1 - k;
    for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + k * 4, d = 10 + 26 * e, up = e * 24, x = f.x + Math.cos(b) * d + ux * up, y = f.y + Math.sin(b) * d + uy * up;
      if (f.ab === 'rejuvenate') leaf(ctx, x, y, b + 1.5, 7); else { inkDisc(ctx, x, y, 5 * (1 - 0.5 * k), i % 2 ? '#BFE9F8' : '#E6FFF4'); ctx.fillStyle = '#FFFFFF'; disc(ctx, x - 1.5, y - 1.5, 1.6, '#FFFFFF'); } }
    if (k < 0.3) lit(ctx, () => glowDisc(ctx, f.x, f.y, 50, f.ab === 'rejuvenate' ? EL.nature[2] : EL.water[2], 0.6 * (1 - k / 0.3)));
    ctx.restore(); return true;
  }
  if (f.smoke) { // Dash II's smoke: grey-violet puffs, enemies lose her in it
    const a = clamp(Math.min(f.t / 0.2, (f.max - f.t) / 0.6), 0, 1), seed = Math.round(f.x * 3 + f.y);
    ctx.save(); ctx.globalAlpha *= a * 0.85;
    for (let i = 0; i < 9; i++) { const b = i / 9 * TAU + T * 0.4 + seed, rr = f.r * (0.35 + 0.3 * hash(i, seed)), pr = f.r * (0.42 + 0.1 * Math.sin(T * 1.3 + i));
      disc(ctx, f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr, pr, i % 2 ? 'rgba(90,74,122,0.55)' : 'rgba(58,46,80,0.55)'); }
    ctx.restore(); return true;
  }
  if (f.ab === 'roll' && f.kind === 'vines') { // caltrops scattered where she rolled
    const a = clamp(Math.min(f.t / 0.15, (f.max - f.t) / 0.5), 0, 1), seed = Math.round(f.x * 3 + f.y);
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 9; i++) { const b = hash(seed, i) * TAU, rr = f.r * Math.sqrt(hash(i, seed)); inked(ctx, () => star(ctx, f.x + Math.cos(b) * rr, f.y + Math.sin(b) * rr, 6, 4, 0.3, b), '#9AA3AE'); }
    ctx.restore(); return true;
  }
  return false;
}

// Ice Wall (Frost Mage): a ridge of ice crystals along the wall's rectangle, rising fast, melting at the end.
export function drawIceWall(ctx, r, T) {
  if (r._t0 == null) r._t0 = r.temp;
  const age = r._t0 - r.temp, rise = easeOut(k01(age / 0.3)), melt = k01(r.temp / 0.6);
  const horiz = r.w >= r.h, L = horiz ? r.w : r.h, n = Math.max(3, Math.round(L / 24)), seed = Math.round(r.x + r.y * 3);
  ctx.save(); ctx.globalAlpha *= melt;
  ctx.fillStyle = 'rgba(191,233,248,0.35)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 10) : ctx.rect(r.x, r.y, r.w, r.h); ctx.fill();
  for (let i = 0; i < n; i++) {
    const q = (i + 0.5) / n, x = horiz ? r.x + r.w * q : r.x + r.w / 2 + (hash(i, seed) - 0.5) * 6, y = horiz ? r.y + r.h / 2 + (hash(i, seed) - 0.5) * 6 : r.y + r.h * q;
    const h = (24 + 12 * hash(seed, i)) * rise, wd = 10 + 3 * hash(i, seed, 2);
    spike(ctx, x, y + 4, h, wd, i % 2 ? '#BFE9F8' : '#9FDDF6', '#FFFFFF');
  }
  ctx.restore();
}
