// An enemy's health in the arena (round 8, lane V): shown only once it has taken damage, in one of four styles the
// player picks in the settings, or ?ehp=1..4 for testing. Bosses keep their bar in the HUD; heroes show theirs there.
//   1 Bar    a short slim bar under the feet; the part just lost shows pale for a moment before it drains
//   2 Arc    a curved gauge hugging the bottom of the body, like a smile under its shadow
//   3 Pips   a row of little pips over the head; each is a share of its health, the last one partly full
//   4 Wash   no gauge at all: the figure darkens and reddens as it is hurt, and pulses when nearly dead
import { INK, TAU, clamp } from './util.js';
import { OUTLINE } from './render.js';

export const EHP_STYLES = [
  { id: 1, name: 'Bar', blurb: 'A short slim bar under the feet; what was just lost shows pale for a moment.' },
  { id: 2, name: 'Arc', blurb: 'A curved gauge hugging the bottom of the body.' },
  { id: 3, name: 'Pips', blurb: 'A row of little pips over the head, each a share of its health.' },
  { id: 4, name: 'Wash', blurb: 'No gauge: the figure darkens and reddens as it is hurt.' },
];
const KEY = 'delve.ehp';
let cur = 0;
export function ehpStyle() {
  if (cur) return cur;
  let n = 0;
  try { n = +new URLSearchParams(location.search).get('ehp'); } catch {}
  if (!(n >= 1 && n <= 4)) { try { n = +localStorage.getItem(KEY); } catch {} }
  return (cur = n >= 1 && n <= 4 ? Math.round(n) : 1);
}
export function setEhpStyle(n) { cur = clamp(Math.round(+n) || 1, 1, 4); try { localStorage.setItem(KEY, String(cur)); } catch {} return cur; }

const RED = '#E0604B', LOST = '#FFE7D6', BACK = '#3A2F3E';
const shows = (u) => u.team === 'enemy' && !u.def.boss && !u.downed && !u.dead && u.hp < u.maxHp - 0.01 && !u.ethereal;
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

// Style 4 is a wash over the sprite: render.js's washesOf asks for it.
export function hpWash(u, T) {
  if (ehpStyle() !== 4 || !shows(u)) return null;
  const f = clamp(1 - u.hp / u.maxHp, 0, 1);
  const pulse = u.hp / u.maxHp < 0.3 ? 0.12 * (0.5 + 0.5 * Math.sin(T * 9 + u.id)) : 0;
  return ['#6A1424', 0.12 + 0.48 * f + pulse];
}

// Drawn in the unit's upright frame (render.js drawOverlay): +y is down the screen, the unit's centre at 0,0.
export function drawEnemyHp(ctx, u, dt) {
  const st = ehpStyle();
  // the pale "just lost" part catches up after a short wait
  if (u._hpLag == null || u._hpLag < u.hp) u._hpLag = u.hp;
  if (u._hpSeen != null && u.hp < u._hpSeen) u._hpWait = 0.35;
  u._hpSeen = u.hp;
  if ((u._hpWait = (u._hpWait || 0) - dt) <= 0) u._hpLag = Math.max(u.hp, u._hpLag - u.maxHp * 1.2 * dt);
  if (!shows(u) || st === 4) return;
  const f = clamp(u.hp / u.maxHp, 0, 1), lag = clamp(u._hpLag / u.maxHp, 0, 1), vr = u.vr;
  if (st === 1) {
    const bw = clamp(vr * 1.6, 24, 64), bh = 4.5, y = vr + 9;
    ctx.fillStyle = INK; rr(ctx, -bw / 2 - OUTLINE, y - OUTLINE, bw + OUTLINE * 2, bh + OUTLINE * 2, bh); ctx.fill();
    ctx.fillStyle = BACK; rr(ctx, -bw / 2, y, bw, bh, bh / 2); ctx.fill();
    if (lag > f) { ctx.fillStyle = LOST; rr(ctx, -bw / 2, y, bw * lag, bh, bh / 2); ctx.fill(); }
    ctx.fillStyle = RED; rr(ctx, -bw / 2, y, Math.max(bh * 0.6, bw * f), bh, bh / 2); ctx.fill();
  } else if (st === 2) {
    const R = vr + 7, a0 = Math.PI / 2 + 0.95, a1 = Math.PI / 2 - 0.95, span = a0 - a1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 5 + OUTLINE * 2; ctx.beginPath(); ctx.arc(0, 0, R, a1, a0); ctx.stroke();
    ctx.strokeStyle = BACK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, R, a1, a0); ctx.stroke();
    if (lag > f) { ctx.strokeStyle = LOST; ctx.beginPath(); ctx.arc(0, 0, R, a0 - span * lag, a0); ctx.stroke(); }
    ctx.strokeStyle = RED; ctx.beginPath(); ctx.arc(0, 0, R, a0 - span * Math.max(0.04, f), a0); ctx.stroke();
  } else if (st === 3) {
    const n = clamp(Math.round(u.maxHp / 25), 3, 8), s = 4.2, gap = 3, tot = n * s * 2 + (n - 1) * gap, y = -vr - 10;
    const fullPips = f * n;
    for (let i = 0; i < n; i++) {
      const x = -tot / 2 + s + i * (s * 2 + gap);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, s + OUTLINE, 0, TAU); ctx.fill();
      ctx.fillStyle = BACK; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
      const fill = clamp(fullPips - i, 0, 1);
      if (fill > 0) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.clip(); ctx.fillStyle = RED; ctx.fillRect(x - s, y + s - s * 2 * fill, s * 2, s * 2 * fill); ctx.restore(); }
    }
  }
}
