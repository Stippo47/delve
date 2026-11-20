// Potions bought in the camp's shop and handed to heroes before a run.
// - heal: the old healing draught. Counted in save.potions and run.heroes[id].potions; sim.js drinks it when the hero
//   is low and nobody is close (unchanged).
// - the rest are elixirs: drunk the moment the hero's first real fight starts, and they last for that room. They ride
//   on the hooks system (kits.js / trinkets.js): main.js puts 'pot:<id>' into the hero's run trinket list, the hook
//   drinks it, takes it off the list (so the next room doesn't drink it again) and stays on this unit until the room
//   ends. What they do is shown: a cast, a ring and a puff in the potion's colour, and a soft trail while it lasts.
import { TRINKETS, trinketHooks } from './trinkets.js';
import { addBuff, fx, puff, setAnim, alive, heal } from './sim.js';
import { dist, rand, rrange } from './util.js';

export const POTIONS = {
  heal: { name: 'Healing Draught', price: 30, color: '#E0604B',
    desc: 'Drunk when the hero is badly hurt and nobody is close: heals almost half their health.' },
  haste: { name: 'Quicksilver Tonic', price: 45, color: '#E8D84A',
    desc: 'For one room: moves 40% faster and attacks 25% faster.', buff: { move: 1.4, atkSpeed: 1.25 } },
  quick: { name: 'Clockwork Elixir', price: 55, color: '#5FA8F0',
    desc: 'For one room: abilities come back twice as fast.', cdRate: 1 },
  fireproof: { name: 'Salamander Oil', price: 35, color: '#3E8FC7',
    desc: 'For one room: fire can\'t burn them. Walk through the flames.', buff: { immune: ['burn'] } },
  ironskin: { name: 'Iron Skin Brew', price: 50, color: '#8F97A3',
    desc: 'For one room: takes 35% less damage and can\'t be knocked about.', buff: { taken: 0.65, knockImmune: true } },
  regen: { name: 'Troll Draught', price: 45, color: '#5FB55A',
    desc: 'For one room: wounds close by themselves, 3% of their health a second.', regen: 0.03 },
};
export const POTION_IDS = Object.keys(POTIONS);
export const ELIXIR_IDS = POTION_IDS.filter((id) => id !== 'heal');
export const POTION_MAX = 9;      // of each kind in the bag
export const CARRY_MAX = 2;       // potions a hero can carry in (any kinds, one of each)
export const elixirKey = (id) => 'pot:' + id;
export const elixirOf = (key) => (typeof key === 'string' && key.startsWith('pot:') ? key.slice(4) : null);

// a fight worth drinking for: two awake enemies close, or any boss
const fightOn = (w, u) => {
  let n = 0;
  for (const o of w.units) {
    if (!alive(o) || o.team === u.team || o.ethereal || o.team === 'neutral' || !o.aggro) continue;
    if (dist(u.x, u.y, o.x, o.y) > 460) continue;
    if (o.def.boss) return true;
    if (++n >= 2) return true;
  }
  return false;
};

function elixirHooks(id) {
  const p = POTIONS[id];
  return {
    tick(w, u, dt) {
      const s = u.elixirs || (u.elixirs = {});
      if (!s[id]) {
        if (u.summon || !fightOn(w, u)) return;
        s[id] = true;
        // off the run's list: the next room's spawn won't have it (this unit keeps the hook till the room ends)
        const i = (u.trinkets || []).indexOf(elixirKey(id)); if (i >= 0) u.trinkets.splice(i, 1);
        setAnim(u, 'cast', 0.4);
        fx(w, { type: 'ring', x: u.x, y: u.y, r: 46, color: p.color, max: 0.45 });
        puff(w, u.x, u.y, p.color, 12, 80, 5, 0.6);
        if (p.buff) addBuff(u, { id: elixirKey(id), dur: 1e4, potion: id, ...p.buff });
        else addBuff(u, { id: elixirKey(id), dur: 1e4, potion: id });
        return;
      }
      if (p.cdRate && u.kit) for (const k in u.kit.cd) u.kit.cd[k] -= dt * p.cdRate;
      if (p.regen) heal(w, u, u.maxHp * p.regen * dt, u);
      if (rand() < dt * 4) w.particles.push({ x: u.x + rrange(-u.r, u.r) * 0.6, y: u.y + rrange(-u.r, u.r) * 0.6, vx: 0, vy: 0, rise: 26, up: 0,
        life: 0.5, max: 0.5, size: 3.5, color: p.color });
    },
  };
}

// Registered as trinket entries so trinketHooks() finds them; `potion: true` keeps them out of the shop's trinkets
// and they were never in TRINKET_IDS, so they never turn up as found trinkets.
for (const id of ELIXIR_IDS) {
  const p = POTIONS[id];
  TRINKETS[elixirKey(id)] = { id: elixirKey(id), name: p.name, desc: p.desc, color: p.color, potion: id, hooks: elixirHooks(id) };
}
export { trinketHooks };
