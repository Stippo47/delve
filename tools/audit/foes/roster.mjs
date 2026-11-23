// The foes audit's roster: every enemy kind battle mode lists, by dungeon, with the numbers the audit compares.
//   node tools/audit/foes/roster.mjs [--json]
import { boot } from './lib.mjs';
const { B, DEFS, save, names } = await boot();
const R = B.battleRoster(save);
const out = [];
for (const d of R.dungeons) {
  for (const k of d.kinds) {
    const D = DEFS[k];
    out.push({ dungeon: d.id, k, name: names(k), cost: D.cost, pack: D.pack || null, hp: D.hp, dmg: D.dmg, atkCd: D.atkCd, range: Math.round(D.range), speed: Math.round(D.speed),
      role: D.role, armor: D.armor || 0, brain: !!D.brain, ability: D.ability || null, summon: !!D.summon, noElite: !!D.noElite });
  }
  for (const k of d.bosses) out.push({ dungeon: d.id, k, name: names(k), boss: true, hp: DEFS[k].hp, dmg: DEFS[k].dmg });
}
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
else for (const r of out) console.log([r.dungeon, r.k, r.name, r.boss ? 'BOSS' : '', r.cost, JSON.stringify(r.pack), r.hp, r.dmg, r.atkCd, r.range, r.speed, r.role, r.brain ? 'brain' : '', r.ability || ''].join('\t'));
