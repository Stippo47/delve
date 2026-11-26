// An enemy's health in the arena (round 8, lane V): shown only once it has taken damage, in one of five styles the
// player picks in the settings, or ?ehp=1..5 for testing. Bosses keep their bar in the HUD; heroes show theirs there.
// Round 9, the designer picked Bar and Arc: "Show on top of them" (the bar), and the arc "maybe tankier enemies could
// get these versions. Also flipped to be on top. Also moved a bit away from them so they aren't so close". So both now
// sit over the head, and the default (5) gives the bar to most enemies and the arc to the tanky ones.
//   1 Bar        a short slim bar over the head; the part just lost shows pale for a moment before it drains
//   2 Arc        a curved gauge over the head, a little off the body
//   3 Pips       a row of little pips over the head; each is a share of its health, the last one partly full
//   4 Wash       no gauge at all: the figure darkens and reddens as it is hurt, and pulses when nearly dead
//   5 Bar + Arc  the bar for most, the arc for tanky enemies (elites, majors, big bodies)
import { INK, TAU, clamp, OUTLINES, readFlag } from './util.js';
import { OUTLINE } from './render.js';

export const EHP_STYLES = [
  { id: 1, name: 'Bar', blurb: 'A short slim bar over the head; what was just lost shows pale for a moment.' },
  { id: 2, name: 'Arc', blurb: 'A curved gauge over the head.' },
  { id: 3, name: 'Pips', blurb: 'A row of little pips over the head, each a share of its health.' },
  { id: 4, name: 'Wash', blurb: 'No gauge: the figure darkens and reddens as it is hurt.' },
  { id: 5, name: 'Bar + Arc', blurb: 'The bar over most enemies, the arc over the tanky ones.' },
];
const N = EHP_STYLES.length, DEFAULT = 1; // round 10: "Just the straight bar" for every enemy, tanky ones too
const KEY = 'delve.ehp';
let cur = 0;
export function ehpStyle() {
  if (cur) return cur;
  let n = 0;
  try { n = +new URLSearchParams(location.search).get('ehp'); } catch {}
  if (!(n >= 1 && n <= N)) { try { n = +localStorage.getItem(KEY); } catch {} }
  return (cur = n >= 1 && n <= N ? Math.round(n) : DEFAULT);
}
export function setEhpStyle(n) { cur = clamp(Math.round(+n) || DEFAULT, 1, N); try { localStorage.setItem(KEY, String(cur)); } catch {} return cur; }
// Round 19 (lane toggles19): health bars over the fight on or off (Settings, Health bars; ?hpbars=0 / 1 for testing).
// Off: no bar over any unit in any style (style 4's red wash too), none in battle mode, none on a boss's parts, and the
// boss's bar at the top of the arena hides (main.js). The hero cards' bars in the bottom HUD stay: that's the party panel.
const BARS_KEY = 'delve.hpbars';
export let HPBARS = readFlag('hpbars', BARS_KEY);
export function setHpBars(on) { HPBARS = !!on; try { localStorage.setItem(BARS_KEY, HPBARS ? '1' : '0'); } catch {} return HPBARS; }

const GREEN = '#6CCB5F', RED = '#E0604B', LOST = '#FFE7D6', BACK = '#3A2F3E';
// Battle mode (battle.js): every unit on both sides carries a straight bar in its side's colour, hurt or not.
let SIDES = null; const BLUE = '#5FA8FF';
export function setHpSides(s) { SIDES = s || null; }
// (round 14, lane U: u.barAlways, set by the Book's previews: this unit's bar shows whatever its side, hurt or not)
// (round 19, lane wurm19: a hidden unit shows no bar: the Sand Wurm's hung over its mound in the Book and in battles;
// nor does a kind with def.noBar: a ring of its body, which keeps no health of its own but flickered a bar when struck)
const shows = (u) => !u.hidden && !u.def.noBar && (u.barAlways ? !u.downed && !u.dead && !u.ethereal : SIDES ? !u.downed && !u.dead && !u.ethereal && u.team !== 'neutral' : u.team === 'enemy' && !u.def.boss && !u.downed && !u.dead && u.hp < u.maxHp - 0.01 && !u.ethereal);
// tanky: an elite or a major, or a big, heavy body
export const tanky = (u) => !!(u.elite || u.major || u.mini || u.maxHp >= 170 || (u.def.mass || 1) >= 2.8);
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

// Style 4 is a wash over the sprite: render.js's washesOf asks for it.
export function hpWash(u, T) {
  if (!HPBARS || SIDES || ehpStyle() !== 4 || !shows(u)) return null;
  const f = clamp(1 - u.hp / u.maxHp, 0, 1);
  const pulse = u.hp / u.maxHp < 0.3 ? 0.12 * (0.5 + 0.5 * Math.sin(T * 9 + u.id)) : 0;
  return ['#6A1424', 0.12 + 0.48 * f + pulse];
}

// Drawn in the unit's upright frame (render.js drawOverlay): +y is down the screen, the unit's centre at 0,0.
export function drawEnemyHp(ctx, u, dt) {
  let st = ehpStyle();
  // the pale "just lost" part catches up after a short wait
  if (u._hpLag == null || u._hpLag < u.hp) u._hpLag = u.hp;
  if (u._hpSeen != null && u.hp < u._hpSeen) u._hpWait = 0.35;
  u._hpSeen = u.hp;
  if ((u._hpWait = (u._hpWait || 0) - dt) <= 0) u._hpLag = Math.max(u.hp, u._hpLag - u.maxHp * 1.2 * dt);
  if (!HPBARS || !shows(u) || (st === 4 && !SIDES && !u.barAlways)) return;
  if (SIDES || u.barAlways) st = 1;
  if (st === 5) st = tanky(u) ? 2 : 1;
  const f = clamp(u.hp / u.maxHp, 0, 1), lag = clamp(u._hpLag / u.maxHp, 0, 1), vr = u.vr * (u.major || u.mini ? 1.16 : u.elite ? 1.08 : 1);
  if (st === 1) { // over the head
    const bw = clamp(vr * 1.6, 24, 64), bh = 4.5, y = -vr - 14 - bh;
    if (OUTLINES) { ctx.fillStyle = INK; rr(ctx, -bw / 2 - OUTLINE, y - OUTLINE, bw + OUTLINE * 2, bh + OUTLINE * 2, bh); ctx.fill(); }
    ctx.fillStyle = BACK; rr(ctx, -bw / 2, y, bw, bh, bh / 2); ctx.fill();
    if (lag > f) { ctx.fillStyle = LOST; rr(ctx, -bw / 2, y, bw * lag, bh, bh / 2); ctx.fill(); }
    ctx.fillStyle = SIDES && SIDES[u.team] === 'a' ? BLUE : u.barAlways && u.team === 'hero' ? GREEN : RED; rr(ctx, -bw / 2, y, Math.max(bh * 0.6, bw * f), bh, bh / 2); ctx.fill();
  } else if (st === 2) { // a curve over the head, a little away from the body; it empties from its right end
    const R = vr + 15, a0 = -Math.PI / 2 - 0.9, a1 = -Math.PI / 2 + 0.9, span = a1 - a0;
    ctx.lineCap = 'round';
    if (OUTLINES) { ctx.strokeStyle = INK; ctx.lineWidth = 5.5 + OUTLINE * 2; ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.stroke(); }
    ctx.strokeStyle = BACK; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.stroke();
    if (lag > f) { ctx.strokeStyle = LOST; ctx.beginPath(); ctx.arc(0, 0, R, a0, a0 + span * lag); ctx.stroke(); }
    ctx.strokeStyle = RED; ctx.beginPath(); ctx.arc(0, 0, R, a0, a0 + span * Math.max(0.04, f)); ctx.stroke();
  } else if (st === 3) {
    const n = clamp(Math.round(u.maxHp / 25), 3, 8), s = 4.2, gap = 3, tot = n * s * 2 + (n - 1) * gap, y = -vr - 12;
    const fullPips = f * n;
    for (let i = 0; i < n; i++) {
      const x = -tot / 2 + s + i * (s * 2 + gap);
      if (OUTLINES) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, s + OUTLINE, 0, TAU); ctx.fill(); }
      ctx.fillStyle = BACK; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
      const fill = clamp(fullPips - i, 0, 1);
      if (fill > 0) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.clip(); ctx.fillStyle = RED; ctx.fillRect(x - s, y + s - s * 2 * fill, s * 2, s * 2 * fill); ctx.restore(); }
    }
  }
}
