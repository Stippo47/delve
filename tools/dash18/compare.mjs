// Round 18 (lane dash18): before against after, from the files tools/ability-worth.mjs and tools/audit/foes16/worth.mjs
// write.   node tools/dash18/compare.mjs <base dir> <after dir> [foes-base.json foes-after.json]
// Heroes: for each changed ability, its damage per second of the run (the ability's own share of what the hero dealt),
// the hero's damage a second and the rooms the party cleared, all on, at tiers I and III. Foes: worth per cost point.
import fs from 'node:fs';
import path from 'node:path';
const [base, after, fb, fa] = process.argv.slice(2);
const ABS = { tower: ['charge'], paladin: ['shieldBash'], twinfang: ['backstab', 'dash'], shade: ['shadowWalk'], samurai: ['iaido', 'crescentCut'], huntress: ['runningThrow'], marksman: ['bayonet'],
  gladiator: ['shieldRush'], warhelm: ['thunderBlow'], bearskin: ['bearRoar'], werewolf: ['pounce'], valkyrie: ['spearThrow'], cultist: ['soulCandle'] };
const load = (dir, h, t) => { try { return JSON.parse(fs.readFileSync(path.join(dir, `${h}-t${t}.json`), 'utf8')).heroes[h]; } catch { return null; } };
const pct = (a, b) => (b ? ((a / b - 1) * 100 >= 0 ? '+' : '') + ((a / b - 1) * 100).toFixed(0) + '%' : '  n/a');
const rows = [];
console.log('hero       ability        tier  ability dmg/s      share of dmg    hero dmg/s          rooms         party taken/s');
for (const [h, abs] of Object.entries(ABS)) for (const t of [1, 3]) {
  const B = load(base, h, t), A = load(after, h, t); if (!B || !A) continue;
  for (const ab of abs) {
    const f = (R) => { const all = R.all, tot = Object.values(all.src).reduce((a, b) => a + b, 0) || 1, mine = (all.src['ab:' + ab] || 0) + (all.src[ab] || 0);
      return { ab: mine / all.secs, share: mine / tot, dps: all.dmg / all.secs, rooms: all.rooms / all.n, taken: all.taken / all.secs }; };
    const b = f(B), a = f(A);
    console.log(`${h.padEnd(10)} ${ab.padEnd(14)} ${t === 1 ? 'I  ' : 'III'}   ${b.ab.toFixed(2).padStart(5)} -> ${a.ab.toFixed(2).padStart(5)} ${pct(a.ab, b.ab).padStart(5)}   ${(b.share * 100).toFixed(0).padStart(3)}% -> ${(a.share * 100).toFixed(0).padStart(3)}%   ${b.dps.toFixed(2).padStart(6)} -> ${a.dps.toFixed(2).padStart(6)} ${pct(a.dps, b.dps).padStart(5)}   ${b.rooms.toFixed(2).padStart(5)} -> ${a.rooms.toFixed(2).padStart(5)}   ${b.taken.toFixed(2)} -> ${a.taken.toFixed(2)}`);
    rows.push({ h, ab, t, b, a });
  }
}
if (fb && fa) {
  const B = Object.fromEntries(JSON.parse(fs.readFileSync(fb, 'utf8')).rows.map((r) => [r.k, r])), A = JSON.parse(fs.readFileSync(fa, 'utf8')).rows;
  const KINDS = (process.argv[6] || 'wolf,wolfDire,wolfAlpha,rat,goblin,lizardBlade,rattlerSpear,bat,spiderHunter,devil,succubus,angel,banditDagger,banditSpear,orc,dragonborn,wolfRider,crab,bee,wasp,jackal,sproutling').split(',');
  console.log('\nfoe            worth per cost point (panel / duel)');
  for (const r of A) { const b = B[r.k]; if (!b) continue; const d = b.worth ? (r.worth / b.worth - 1) * 100 : 0;
    if (KINDS.includes(r.k) || Math.abs(d) >= 10) console.log(`${r.k.padEnd(14)} ${b.worth.toFixed(2)} -> ${r.worth.toFixed(2)} ${pct(r.worth, b.worth).padStart(5)}   (${b.panel} / ${b.duel} -> ${r.panel} / ${r.duel})${KINDS.includes(r.k) ? '' : '   (not one of the dashers)'}`); }
}
