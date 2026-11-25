// Round 17, lane foes16: shared set-up for the enemy price tools (tools/audit/foes16/*.mjs). Node only, no browser.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
export const B = await imp('js/battle.js');
export const D = await imp('js/dungeon.js');
export const { setSeed } = await imp('js/util.js');
export const { freshSave } = await imp('js/save.js');
export const { DEFS } = await imp('js/units.js');
export const { step, alive } = await imp('js/sim.js');
export const { AUDIT } = await imp('js/stats.js');
export const { THEME_IDS } = await imp('js/themes.js');
export const DT = 1 / 60;
export const opt = (k, d) => { const a = process.argv, i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
export const flag = (k) => process.argv.includes('--' + k);
export const SAVE = freshSave(); SAVE.cheat = true;
export const ROSTER = B.battleRoster(SAVE);
const OLD_COST = { rat: 1, slime: 2, slimeSmall: 1, skeleton: 3 }; // (dungeon.js's fallback before this lane: the 'before' numbers)
export const costOf = (k) => DEFS[k].cost ?? OLD_COST[k] ?? 3;
export const homeOf = (k) => B.homeOf(k);

// Battle mode's step with one change, as tools/audit/worth does: a unit that is ethereal for a moment (a ghost fading,
// a hero burrowing) still counts as in the fight; only traps (def.trap) never do. (The game's battle.js fighting() drops
// any ethereal unit, so a lone fading ghost lost on the spot: one of the round 16 bugs, fixed in its own lane.)
const TIME_LIMIT = 240;
export const fights = (u) => alive(u) && !(u.linkTo && u.def.segment) && !(u.partOf && u.partOf.bodies) && (!u.ethereal || !u.def.trap || (u.bur && u.bur.state === 'under'));
const sideOf = (w, u) => B.sideOf(w, u);
export const standingOf = (run, side) => run.world.units.filter((u) => fights(u) && sideOf(run.world, u) === side);
// What's left of a side: every unit of it still fighting (what it made mid-fight too: split slimes, called help), against
// what it started with, capped at 1.
export function leftOf(run, side) {
  let max = 0, hp = 0;
  for (const u of run.sides[side]) max += u.maxHp;
  for (const u of standingOf(run, side)) hp += Math.max(0, u.hp);
  return max ? Math.min(1, hp / max) : 0;
}
// One battle. setup: newBattle's. o.onFrame(run) each frame; o.tMax.
const SEED_OFF = +opt('seedoff', 0); // (--seedoff N: the same batches on other dice, to check a result isn't the seeds')
export function fight(setup, seed, o = {}) {
  setSeed(seed + SEED_OFF); AUDIT.idFrom = 1;
  const run = B.newBattle(SAVE, { size: 'l', scaled: false, ...setup });
  if (o.prep) o.prep(run);
  const tMax = o.tMax || TIME_LIMIT, w = run.world;
  while (run.t < tMax) {
    if (o.before) o.before(run);
    if (w.hitstop > 0) w.hitstop -= DT;
    else { run.t += DT; step(w, DT); }
    w.pickups.length = 0; w.stale = run.t > 75;
    if (o.after) o.after(run);
    const a = standingOf(run, 'a').length, b = standingOf(run, 'b').length;
    const coming = w.danger.some((z) => z.spawns && !z.done) || w.fx.some((f) => f.spawns && !f.done);
    if ((!a || !b) && !coming) { run.winner = a ? 'a' : b ? 'b' : 'draw'; break; }
  }
  if (!run.winner) { const ha = leftOf(run, 'a'), hb = leftOf(run, 'b'); run.winner = Math.abs(ha - hb) < 0.02 ? 'draw' : ha > hb ? 'a' : 'b'; run.timeUp = true; }
  return run;
}
export const stacks = (k, n, rank = 0) => { const out = []; while (n > 0) { const m = Math.min(12, n); out.push({ k, n: m, rank }); n -= m; } return out; };
export const r2 = (x) => Math.round(x * 100) / 100;
export const gmean = (xs) => Math.exp(xs.reduce((a, x) => a + Math.log(Math.max(1e-3, x)), 0) / xs.length);
