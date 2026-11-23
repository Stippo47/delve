// Round 16 (the designer: "stagger was quite good against bosses... watching Warhelm, maybe a mix of stagger and shock?").
// A party with Warhelm at tier III against every boss in battle mode, four ways: as it is, bosses immune to Stagger,
// immune to Shock, immune to both. Prints how long the boss lasts, wins, and what each status did to it.
//   node tools/audit/boss-stagger.mjs [--seeds 6] [--hero warhelm] [--mates paladin,archer,cleric] [--tier 2]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { pathToFileURL } = await import('node:url');
const u = (p) => pathToFileURL(p).href;
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const { newBattle, updateBattle, battleRoster } = await import(u('js/battle.js'));
const { AUDIT } = await import(u('js/stats.js'));
const { freshSave } = await import(u('js/save.js'));
const { setSeed } = await import(u('js/util.js'));
const seeds = +opt('seeds', 6), hero = opt('hero', 'warhelm'), mates = opt('mates', 'paladin,archer,cleric').split(','), mt = +opt('tier', 2);
const save = freshSave(); save.cheat = true;
const bosses = battleRoster(save).dungeons.flatMap((d) => d.bosses);
const CONDS = { asIs: [], noStagger: ['stagger'], noShock: ['shock'], neither: ['stagger', 'shock'] };
const out = {};
for (const [cond, imm] of Object.entries(CONDS)) {
  const R = out[cond] = { fights: 0, wins: 0, t: 0, ko: 0, overload: 0, stunned: 0, staggerAmt: 0, shockAmt: 0, dmgOnKo: 0 };
  for (const b of bosses) for (let s = 0; s < seeds; s++) {
    setSeed(100 + s);
    const run = newBattle(save, { arena: 'crypt', a: [{ k: hero, n: 1, tier: 3 }, ...mates.map((k) => ({ k, n: 1, tier: mt }))], b: [{ k: b, n: 1 }] });
    const boss = run.sides.b.find((x) => x.kind === b) || run.sides.b[0];
    if (imm.length) boss.h2 = [...(boss.h2 || []), { id: 'auditImmune', immune: imm }];
    AUDIT.on = (e, w, x, src, amt, o) => {
      if (x !== boss) return;
      if (e === 'burst' && o.type === 'stagger') R.ko++;
      if (e === 'burst' && o.type === 'shock') R.overload++;
      if (e === 'status' && o.type === 'stagger') R.staggerAmt += amt;
      if (e === 'status' && o.type === 'shock') R.shockAmt += amt;
      if (e === 'hurt' && boss.koT > 0) R.dmgOnKo += amt;
    };
    let t = 0;
    while (run.phase === 'fight' && t < 240) { updateBattle(run, 1 / 60); t += 1 / 60; if (boss.stunT > 0) R.stunned += 1 / 60; }
    AUDIT.on = null;
    R.fights++; R.t += t; if (run.winner === 'a') R.wins++;
  }
}
console.log(`${hero} III + ${mates.join(', ')} at tier ${mt}, against ${bosses.length} bosses x ${seeds} seeds`);
console.log('condition    wins   fight s   KOs/fight  overloads/fight  boss stunned s  dmg while KO');
for (const [c, R] of Object.entries(out)) console.log(c.padEnd(11), `${(100 * R.wins / R.fights).toFixed(0)}%`.padStart(5), (R.t / R.fights).toFixed(1).padStart(8), (R.ko / R.fights).toFixed(2).padStart(10), (R.overload / R.fights).toFixed(2).padStart(15), (R.stunned / R.fights).toFixed(1).padStart(14), Math.round(R.dmgOnKo / R.fights).toString().padStart(13));
process.exit(0);
