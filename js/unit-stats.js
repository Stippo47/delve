// The numbers the unit page shows (round 14, lane U), read from the game's own functions so they are never a copy:
//   a hero      dungeon.js heroProbe (the hero from the save as it walks into a room: level, web, trinkets and their
//               levels), sim.js unitNumbers through numbers.js, kits.js cooldownOf, heroes.js statsFor
//   a monster   dungeon.js enemyMult for a dungeon's floor and battleFoe for the body at that strength and rank
//               (elites.js makeElite / makeMajor), armour.js through sim.js spawn
// No DOM here.
import { HEROES, statsFor } from './heroes.js';
import { DEFS } from './units.js';
import { makeWorld, immuneTo, charmProof } from './sim.js';
import { BUILD_IDS } from './statuses.js';
import { tagRes } from './tags.js';
import { cooldownOf, hooksOf } from './kits.js';
import { numbersOf, quietly } from './numbers.js';
import { heroProbe, battleFoe, enemyMult, FLOORS, BOSS_HP, LAYERS, placeLevel, DUNGEON_RANK } from './dungeon.js';
import { THEMES, DUNGEON_ORDER } from './themes.js';
import { trinketLevel } from './progress.js';

// ---------------------------------------------------------------- heroes
// { n: { hit, aps, hp, speed, range, armor }, base (the same with nothing learned or worn), abilities: [{ id, name, tier,
//   cd, baseCd, mods }], mods (the web's sums), immune: [status ids], knockImmune }
export function heroSheet(save, id) {
  const h = HEROES[id], sv = save.heroes[id];
  return quietly(() => {
    const list = (sv.trinkets || []).map((t) => { const lv = trinketLevel(save, t); return lv > 1 ? { id: t, lv } : t; });
    const u = heroProbe(save, id, list), n = numbersOf(u);
    const bare = heroProbe({ heroes: { [id]: { level: sv.level || 1, nodes: {}, trinkets: [] } } }, id, []), base = numbersOf(bare);
    const mods = statsFor(id, sv.nodes || {});
    const abilities = h.abilities.map((ab) => {
      const tier = u.kit.tiers[ab.id] || 0;
      return { id: ab.id, name: ab.name, tier, cd: cooldownOf(u, ab), baseCd: ab.cd, mods: mods.ab[ab.id] || { abDmg: 0, abCd: 0, abHeal: 0, abStatus: 0 } };
    });
    const hooks = hooksOf(u), immune = [...new Set(hooks.flatMap((x) => (x && Array.isArray(x.immune) ? x.immune : [])))];
    return { n, base, abilities, mods, immune, knockImmune: hooks.some((x) => x && x.knockImmune === true), level: sv.level || 1 };
  });
}

// ---------------------------------------------------------------- where a kind is found
// Every place a kind turns up: [{ theme, floor, as: 'roster' | 'mini' | 'boss' | 'adds' }], in the dungeons' order.
let placeCache = null;
function allPlaces() {
  if (placeCache) return placeCache;
  const by = {};
  const add = (k, theme, floor, as) => { if (!k || !DEFS[k]) return; const l = by[k] || (by[k] = []); if (!l.some((p) => p.theme === theme && p.floor === floor)) l.push({ theme, floor, as }); };
  for (const theme of DUNGEON_ORDER) {
    const T = THEMES[theme]; if (!T) continue;
    (T.floors || []).forEach((F, i) => {
      const floor = i + 1;
      for (const [k] of F.enemies || []) add(k, theme, floor, 'roster');
      add(F.elite, theme, floor, 'roster');
      if (floor < FLOORS) add(F.mini || T.mini || T.warden, theme, floor, 'mini');
      for (const k of F.bossAdds || T.bossAdds || []) add(k, theme, floor, 'adds');
    });
    add(T.elite, theme, 1, 'roster');
    add(T.bossKind && DEFS[T.bossKind] ? T.bossKind : T.boss, theme, FLOORS, 'boss');
    add(T.boss, theme, FLOORS, 'boss'); add(T.warden, theme, 1, 'mini');
  }
  return (placeCache = by);
}
export const placesOf = (k) => allPlaces()[k] || [];
// Every dungeon floor there is, in order: the stats stepper walks these.
export const PLACES = () => DUNGEON_ORDER.filter((t) => THEMES[t]).flatMap((theme) => (THEMES[theme].floors || []).map((F, i) => ({ theme, floor: i + 1 })));
export const placeName = (p) => `${THEMES[p.theme].name} · floor ${p.floor}`;
export const floorName = (p) => (THEMES[p.theme].floors[p.floor - 1] || {}).name || '';

// ---------------------------------------------------------------- monsters
// A kind as it stands on a dungeon's floor (place: { theme, floor }) at a rank (0 plain, 1 elite, 2 major), for a party
// of `party` (a boss's health follows the party's size). Ordinary kinds are taken at the middle room of the floor: the
// rooms of a floor climb 3.5% each, so that is the floor's average. A boss or a floor's mini-boss is taken in its own
// room, the floor's last. No trinkets: an elite's are picked by the dice each time.
export function foeSheet(k, rank, place, party = 4) {
  const d = DEFS[k]; if (!d) return null;
  return quietly(() => {
    const boss = !!d.boss, here = placesOf(k).find((p) => p.theme === place.theme && p.floor === place.floor);
    const last = boss || (here && (here.as === 'mini' || here.as === 'boss'));
    const L = last ? LAYERS : (LAYERS - 1) / 2;
    let mult = enemyMult({ theme: place.theme, floor: place.floor, depth: 1 }, L);
    if (boss && place.floor < FLOORS) mult *= 0.8;
    const w = makeWorld(400, 400);
    const u = battleFoe(w, k, 200, 200, mult, boss || d.noElite ? 0 : rank);
    u.trinkets = []; u.trinketHooks = [];
    if (last) { const m = BOSS_HP[Math.max(1, Math.min(4, party)) - 1] || 1; u.maxHp = Math.max(1, Math.round(u.maxHp * m)); u.hp = u.maxHp; }
    const n = numbersOf(u);
    if (!((d.dmg || 0) > 0)) { n.hit = 0; n.aps = 0; } // nothing of its own to hit with
    else if ((d.atkCd || 0) >= 99) n.aps = 0;      // it hits only through how it fights: no steady pace to give
    // round 18 (the resistance audit): what really lands, not only the kind's own list: a shell's or a hook's immunities,
    // the bosses' charm rule, the tags' rules (constructs don't bleed or sicken)
    const effRes = (id) => (immuneTo(u, id) || (id === 'charm' && charmProof(u)) ? 0 : (d.res && d.res[id]) ?? tagRes(u, id) ?? 1);
    const res = BUILD_IDS.map((id) => ({ id, v: effRes(id) })).filter((r) => r.v !== 1);
    return { n, res, mult, level: Math.round(placeLevel(DUNGEON_RANK[place.theme] ?? 0, (place.floor - 0.5) / FLOORS)), last, here: !!here, party: last ? Math.max(1, Math.min(4, party)) : 0 };
  });
}
