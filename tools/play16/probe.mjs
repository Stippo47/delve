// Round 16, lane play16: a hero's strength as one number, measured, not added up from the sheet.
// Two short fights in an empty Wildwood room against a standard pack at strength 1 (three goblins and two wolves, as
// sim.js spawn makes them at mult 1, no elites):
//   offence: the pack can't hurt and can't die (hp 1e5, blows x0): the hero's damage a second over 30 s (weapon,
//            abilities, trinkets, pets, statuses it put on), so area moves count for hitting several;
//   toughness: the same pack at strength 3 (so the sturdiest heroes still fall inside the cap), hitting as normal and
//            unkillable: seconds until the hero goes down (capped at 240 s), three seeds averaged (offence too).
// power = sqrt(offence x toughness), so a hero twice as deadly and twice as hard to kill is 2x. Divided by a fresh
// starter's (level 1, its one starting point on tier I of its first ability) it reads "x as strong as at the start".
// An enemy at strength m (dungeon.js enemyMult) is sqrt(hp(m) x blows(m)) on the same footing, so enemy / hero is how
// hard a room is for that hero: what the game's own scaling does, room by room.
import './env.mjs';
const { makeWorld, step, alive } = await import('../../js/sim.js');
const { battleRoom, battleFoe, spawnHero, HP_POW, HIT_STEP, BOSS_HP_POW, BOSS_HIT_STEP } = await import('../../js/dungeon.js');
const { newStats } = await import('../../js/stats.js');
const { setSeed } = await import('../../js/util.js');

const DT = 1 / 60;
const PACK = ['goblin', 'goblin', 'goblin', 'wolf', 'wolf'];
function fight(save, k, trinkets, harmless, secs, mult = 1) {
  const w = battleRoom('wildwood', { W: 1280, H: 960, obstacles: 0 });
  w.stats = newStats([k]);
  const lv = Math.max(1, (save.heroes[k] && save.heroes[k].level) || 1);
  const h = spawnHero(w, save, k, { level: lv, potions: 0, trinkets }, 420, 480, 'wildwood');
  h.facing = h.mvA = 0;
  const foes = PACK.map((kind, i) => {
    const u = battleFoe(w, kind, 900 + (i % 2) * 60, 300 + i * 90, mult, 0);
    u.maxHp = u.hp = 1e5; u.aggro = true; u.carried = null;
    if (harmless) u.dmgMul = 0;
    return u;
  });
  let t = 0;
  while (t < secs) {
    step(w, DT); t += DT;
    if (!alive(h) || h.downed) break;
  }
  const dealt = foes.reduce((a, u) => a + (u.maxHp - Math.max(0, u.hp)), 0);
  return { t, dealt, maxHp: h.maxHp };
}
// trinkets: the hero's worn list as the run gets it (ids, levelled ones { id, lv })
export function probe(save, k, trinkets = [], seed = 77) {
  let dealt = 0, secs = 0, tough = 0;
  for (let i = 0; i < 3; i++) {
    setSeed(seed + i); const a = fight(save, k, trinkets, true, 30); dealt += a.dealt; secs += a.t;
    setSeed(seed + 10 + i); tough += fight(save, k, trinkets, false, 240, 3).t / 3;
  }
  const off = dealt / secs;
  return { off: +off.toFixed(2), tough: +tough.toFixed(1), power: +Math.sqrt(off * tough).toFixed(2) };
}
// The game's enemy scaling (sim.js spawn + dungeon.js hardHitting) as factors on a strength-1 foe.
export function enemyFactors(m, boss = false) {
  const hpPow = boss ? BOSS_HP_POW : HP_POW, step = boss ? BOSS_HIT_STEP : HIT_STEP;
  const hp = m > 1 ? Math.pow(m, hpPow) : m;
  const dmg = (0.65 + 0.35 * m) * (m > 1 ? 1 + step * (m - 1) : 1);
  return { hp, dmg, power: Math.sqrt(hp * dmg) };
}
