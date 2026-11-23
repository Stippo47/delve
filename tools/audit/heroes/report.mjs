// Round 16 (the balance audit, lane audit-heroes): docs/audit/heroes.md from the JSON that run.mjs wrote.
//   node tools/audit/heroes/report.mjs            write the report
//   node tools/audit/heroes/report.mjs --list     print the abilities that (nearly) never fire, with their score code
// The hand-written parts are in notes.mjs (the findings at the top) and why.mjs (why each quiet ability stays quiet).
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url');
const here = path.dirname(url.fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const { HEROES, HERO_IDS } = await import('../../../js/heroes.js');
const { ABILITIES } = await import('../../../js/kits.js');
const SC = await import('./scenarios.mjs');
const { WHY: WHY0, KINDS } = await import('./why.mjs');
// why.mjs: { id: [kind, text] } (kind: one of KINDS), or a plain string
const WHY = {}, WHYK = {}; for (const [k, v] of Object.entries(WHY0)) { if (Array.isArray(v)) { WHYK[k] = v[0]; WHY[k] = v[1]; } else WHY[k] = v; }
const dataDir = path.join(repo, 'docs/audit/data/heroes');
const D = {}; for (const h of HERO_IDS) { const f = path.join(dataDir, h + '.json'); if (fs.existsSync(f)) D[h] = JSON.parse(fs.readFileSync(f, 'utf8')); }
const TIERS = [1, 2, 3], TN = { 1: 'I', 2: 'II', 3: 'III' }, SCS = SC.SCENARIOS, SHORT = { duelMelee: '1v1 melee', duelRanged: '1v1 ranged', duelCaster: '1v1 caster', duelTank: '1v1 tank', ogre: 'Ogre', boar: 'Boars', swarm: 'Swarm', duo: 'Duo', allyTank: '+tank ally', allyHealer: '+healer ally', dungeon: 'Dungeon' };
const abName = (h, id) => { const a = HEROES[h].abilities.find((x) => x.id === id); return a ? a.name : id; };
const nm = (h) => HEROES[h].name;
const cellOf = (h, t, s) => (D[h] && D[h].tiers[t] && D[h].tiers[t][s]) || null;
const r0 = (x) => (x == null || !isFinite(x) ? '-' : Math.round(x).toLocaleString('en-GB'));
const r1 = (x) => (x == null || !isFinite(x) ? '-' : (Math.round(x * 10) / 10).toString());
const pct = (x) => (x == null || !isFinite(x) ? '-' : Math.round(100 * x) + '%');
const med = (a) => { if (!a || !a.length) return null; const s = a.slice().sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
// what one source did in a cell: per minute of fighting
const VAL = ['dmg', 'heal', 'block', 'guard', 'amp', 'bonus', 'prevented'];
function srcRate(c, s) { const r = (c && c.data.src && c.data.src[s]) || {}, m = Math.max(1e-9, c.t / 60); const o = {}; for (const k of [...VAL, 'kills', 'dmgPet', 'healSelf', 'blockSelf', 'selfHurt']) o[k] = (r[k] || 0) / m; o.value = VAL.reduce((a, k) => a + o[k], 0);
  o.ctl = Object.values((c && c.data.ctl && c.data.ctl[s]) || {}).reduce((a, x) => a + x, 0) / m; return o; }
// the scenario-average of a per-minute rate (each scenario counts the same)
function avgRate(h, t, s, scens = SCS) { const o = {}; let n = 0; for (const sc of scens) { const c = cellOf(h, t, sc.id); if (!c || !c.n) continue; n++; const r = srcRate(c, s); for (const [k, v] of Object.entries(r)) o[k] = (o[k] || 0) + v; } for (const k of Object.keys(o)) o[k] /= Math.max(1, n); return o; }
const isPassive = (id) => !!(ABILITIES[id] && ABILITIES[id].passiveTier);
const ALWAYS_ON = new Set(['frenzy']); // a passive tier with no trigger to count: it works on every blow (its value is below)
const fireRate = (c, id) => (c && c.n ? ((c.firedIn && c.firedIn[id]) || 0) / c.n : null);
const abData = (c, id) => (c && c.data.ab && c.data.ab[id]) || null;
const castsOf = (A) => (A ? (A.casts || 0) + (A.triggers || 0) : 0);

// ---------------------------------------------------------------- the quiet list
// every (hero, ability, tier, scenario) where the ability went off in at most 10% of the fights
function quiet() {
  const out = [];
  for (const h of HERO_IDS) for (const ab of HEROES[h].abilities) {
    if (ALWAYS_ON.has(ab.id)) continue;
    const rows = [];
    for (const t of TIERS) for (const sc of SCS) { const c = cellOf(h, t, sc.id); const f = fireRate(c, ab.id); if (f != null && f <= 0.1) rows.push({ t, sc: sc.id, c, A: abData(c, ab.id), f }); }
    if (rows.length) out.push({ h, id: ab.id, rows });
  }
  return out;
}
if (process.argv.includes('--list')) {
  for (const q of quiet()) {
    const cells = q.rows.length, all = TIERS.length * SCS.length;
    const sum = (k) => q.rows.reduce((a, r) => a + ((r.A && r.A[k]) || 0), 0);
    const ctx = q.rows.reduce((a, r) => { const L = r.A && r.A.lowCtx; if (L) for (const [k, v] of Object.entries(L)) a[k] = (a[k] || 0) + v; return a; }, {});
    const n = ctx.n || 1;
    console.log(`\n=== ${q.h} ${q.id} (${abName(q.h, q.id)}): quiet in ${cells}/${all} cells: ${q.rows.map((r) => TN[r.t] + ':' + r.sc).join(' ')}`);
    console.log(`  thinks ${sum('thinks')} hi ${sum('hi')} max ${Math.max(...q.rows.map((r) => (r.A && r.A.max) || 0)).toFixed(2)} ready ${r0(sum('ready'))}s busy-free ${r0(q.rows.reduce((a, r) => a + ((r.A && r.A.busy && r.A.busy.free) || 0), 0))}s` +
      `  low ctx: tgt ${(ctx.tgt / n).toFixed(2)} gap ${(ctx.gap / n).toFixed(0)} foes ${(ctx.foes / n).toFixed(1)} near150 ${(ctx.near / n).toFixed(1)} allies ${(ctx.allies / n).toFixed(1)} allyLow ${(ctx.allyLow / n).toFixed(2)} allyHurt<65% ${(ctx.allyHurt / n).toFixed(2)} hp ${(ctx.hp / n).toFixed(2)} tHp ${(ctx.tHp / n).toFixed(2)}`);
    const A = ABILITIES[q.id]; if (A && A.score) console.log('  score: ' + A.score.toString().replace(/\s+/g, ' ').slice(0, 700));
    if (WHY[q.id]) console.log('  WHY: ' + WHY[q.id]);
  }
  process.exit(0);
}

// ---------------------------------------------------------------- writing
const L = [];
const P = (...s) => L.push(...s);
const numeric = (v) => /^[-+]?[\d.,]+(%|s|x|\/m)?( [\d.,]+(%|s|x|\/m)?)*$|^-$/.test(String(v).replace(/\*\*/g, '').replace(/ \/ /g, ' ').trim());
const table = (head, rows) => {
  if (!rows.length) { P('(none)', ''); return; }
  const right = head.map((_, i) => i > 0 && rows.every((r) => numeric(r[i])));
  P('| ' + head.join(' | ') + ' |', '|' + head.map((_, i) => (right[i] ? ' ---: ' : ' --- ')).join('|') + '|'); for (const r of rows) P('| ' + r.map((x) => String(x).replace(/\|/g, '/')).join(' | ') + ' |'); P('');
};
const nFights = Object.values(D).reduce((a, d) => a + Object.values(d.tiers).reduce((b, T) => b + Object.values(T).reduce((c, x) => c + (x.n || 0), 0), 0), 0);
const fightSecs = Object.values(D).reduce((a, d) => a + Object.values(d.tiers).reduce((b, T) => b + Object.values(T).reduce((c, x) => c + (x.t || 0), 0), 0), 0);
const anyD = Object.values(D)[0] || { seeds: '?', dseeds: '?' };

P('# Hero ability audit', '');
P('Round 16, lane audit-heroes. Every hero, every ability, at tiers I, II and III, put through the same eleven fights, with a recorder counting what each part of the kit did. **Measured only: no numbers, rules or cooldowns were changed.** No tournament has been run yet.', '');
P(`${Object.keys(D).length} heroes, ${nFights.toLocaleString('en-GB')} fights, ${Math.round(fightSecs / 3600)} hours of fighting in the sim. Raw numbers: \`docs/audit/data/heroes/<hero>.json\`. Tools: \`tools/audit/heroes/\` (README at the top of each file).`, '');
const { FINDINGS } = await import('./notes.mjs');
if (FINDINGS) P(FINDINGS.trim(), '');

P('## How it was measured', '');
P(`- **Tiers** are the battle page's tiers (the same as the Book): tier I is the first shell of the skill web, every ability at tier I and the stat nodes beside them; tier II the second shell; tier III the whole web. No trinkets, no potions. The same build in the dungeon.`);
P(`- **Fights**: ${anyD.seeds} seeds per battle cell, ${anyD.dseeds} per dungeon cell (the dungeon rotates the Wildwood, the Warren, the Crypt and the Sewers). Battles stop at ${SC.BATTLE_CAP} s (counted as a timeout), the dungeon at ${SC.DUNGEON_CAP} s or when the first floor is cleared.`);
P(`- **Enemy strength**: battle mode with "scaled" off, then every monster made again as a stronger place makes them (the dungeon's own rule: health grows a little slower than the multiplier, blows a little faster). Multiplier ${TIERS.map((t) => `${SC.FOE_MULT[t]} at tier ${TN[t]}`).join(', ')}, times the scenario's own factor below. The reference heroes in the 1v1s are at the same tier as the hero. The dungeon uses its own strength (the Wildwood's at tiers I-II, the Warren's at tier III, as tools/test/hero-vs.mjs does).`);
P(`- **When an ability can fire**: every 0.35 s a hero that is free (not stunned, frozen or asleep, not in the middle of a move, not forced to walk somewhere, not terrified or radiant) scores each ready ability. The best one goes if it scores at least 0.3 after a ±15% dice roll, and then only on a second roll (25% + 60% of the score; always when it faces its last foe). The recorder logs every score, so it can say whether an ability that never fired was busy, below the bar, or beaten by another.`, '');
table(['Scenario', 'What', 'Strength factor'], SCS.map((s) => [SHORT[s.id], s.name, s.dungeon ? 'dungeon' : typeof s.mul === 'object' ? TIERS.map((t) => TN[t] + ' x' + s.mul[t]).join(', ') : 'x' + (s.mul || 1)]));
P('Words used below:', '');
P('- **fires** / **fired in**: the share of fights in which the ability went off at least once. "Quiet" means it went off in 10% of the fights or fewer.');
P('- **casts/min**: casts per minute of fighting. **ready**: seconds a fight it sat off cooldown. **scored ≥ bar**: the share of the times the hero thought about it (while ready and free) that it scored 0.3 or more. **busy**: the share of its ready time the hero was stunned, mid-move, forced to walk, terrified or radiant.');
P('- **value** per minute = damage + healing + damage blocked (kept off the hero or a friend by a shield, ward, buff, block, armour or untouchability) + damage taken over for a friend (Guard) + extra damage foes took from its debuffs + extra damage its buffs added + damage foes did not deal because of its debuffs. The last three are measured before the target\'s armour, so they are a little high. **weapon** is the hero\'s plain attack.');
P('- Status damage is credited to whoever put the status on last (the game\'s own rule), and shared back to the abilities that built it up, in proportion to what each applied.', '');

// ---------------------------------------------------------------- 1. ranking
P('## 1. How much of each kit fires', '');
P('The average, over its three abilities and the eleven scenarios, of the share of fights each ability went off in. 100% would be every ability in every fight. Sorted by the average of the three tiers. **Abilities that work in a 1v1**: how many of its three went off in at least half of the fights across the four 1v1s, at tier II.', '');
const rank = HERO_IDS.filter((h) => D[h]).map((h) => {
  const per = {}; for (const t of TIERS) { let s = 0, n = 0; for (const ab of HEROES[h].abilities) for (const sc of SCS) { const c = cellOf(h, t, sc.id); if (!c || !c.n) continue; n++; s += ALWAYS_ON.has(ab.id) ? 1 : fireRate(c, ab.id); } per[t] = n ? s / n : 0; }
  const quietAbs = HEROES[h].abilities.filter((ab) => !ALWAYS_ON.has(ab.id)).map((ab) => [ab.name, SCS.filter((sc) => { const f = fireRate(cellOf(h, 2, sc.id), ab.id); return f != null && f <= 0.1; }).length]).filter(([, n]) => n >= 5).map(([a, n]) => `${a} (${n})`);
  const DUELS = ['duelMelee', 'duelRanged', 'duelCaster', 'duelTank'], inDuels = HEROES[h].abilities.filter((ab) => ALWAYS_ON.has(ab.id) || DUELS.reduce((a, d) => a + (fireRate(cellOf(h, 2, d), ab.id) || 0), 0) / DUELS.length >= 0.5).length;
  return { h, per, avg: (per[1] + per[2] + per[3]) / 3, quietAbs, inDuels };
}).sort((a, b) => b.avg - a.avg);
table(['#', 'Hero', 'Role', 'Tier I', 'Tier II', 'Tier III', 'Average', 'Abilities that work in a 1v1 (II)', 'Quiet in 5+ of the 11 scenarios at tier II (how many)'], rank.map((r, i) => [i + 1, `${nm(r.h)} (${r.h})`, HEROES[r.h].role, pct(r.per[1]), pct(r.per[2]), pct(r.per[3]), '**' + pct(r.avg) + '**', r.inDuels + ' of 3', r.quietAbs.join(', ') || '-']));

// ---------------------------------------------------------------- 2. quiet abilities
P('## 2. Abilities that fire 0 or nearly 0 times', '');
P('Every ability that went off in 10% of the fights or fewer in at least one scenario at some tier. "Where" lists those scenarios by tier. The numbers are over those quiet cells only: seconds a fight it sat ready, how much of that the hero was busy, the share of its thinks that reached the bar, and its best score. **Why** names what its score waits for (read from its score code, kits.js / kits2.js / kits3.js) and what the fights showed.', '');
const Q = quiet();
const qRows = Q.map((q) => {
  const by = {}; for (const r of q.rows) (by[r.t] || (by[r.t] = [])).push(SHORT[r.sc]);
  const where = TIERS.filter((t) => by[t]).map((t) => `${TN[t]}: ${by[t].length === SCS.length ? 'all' : by[t].join(', ')}`).join('; ');
  const sum = (k) => q.rows.reduce((a, r) => a + ((r.A && r.A[k]) || 0), 0), n = q.rows.reduce((a, r) => a + r.c.n, 0);
  const ready = sum('ready'), free = q.rows.reduce((a, r) => a + ((r.A && r.A.busy && r.A.busy.free) || 0), 0), th = sum('thinks');
  const mx = Math.max(0, ...q.rows.map((r) => (r.A && r.A.max) || 0));
  return { q, cells: q.rows.length, row: [`${nm(q.h)}`, `**${abName(q.h, q.id)}** (${q.id})${isPassive(q.id) ? ' *passive*' : ''}`, `${q.rows.length}/${TIERS.length * SCS.length}`, where, r0(ready / n), pct(ready ? 1 - free / ready : null), pct(th ? sum('hi') / th : null), r1(mx), WHY[q.id] || '(not yet read)'] };
}).sort((a, b) => b.cells - a.cells);
const byKind = {}; for (const x of qRows) { const k = WHYK[x.q.id] || 'other'; (byKind[k] || (byKind[k] = [])).push(x); }
P('What keeps them quiet, in kinds (what the score of each waits for):', '');
table(['Kind', 'Abilities', 'Which'], Object.keys(KINDS).filter((k) => byKind[k]).map((k) => [KINDS[k], byKind[k].length, byKind[k].map((x) => abName(x.q.h, x.q.id)).join(', ')]));
for (const k of Object.keys(KINDS).filter((k2) => byKind[k2])) {
  P('### ' + KINDS[k], '');
  table(['Hero', 'Ability', 'Quiet cells', 'Where (tier: scenarios)', 'Ready s/fight', 'Busy', 'Scored ≥ bar', 'Best score', 'Why'], byKind[k].map((x) => x.row));
}

// ---------------------------------------------------------------- 3. value vs weapon
P('## 3. What each ability is worth next to the weapon', '');
P('Value per minute of fighting (see "value" above), each scenario counted the same, at each tier. The percentage is the ability\'s value over the weapon\'s damage. **tiny**: under 5% of the weapon while it does fire. **big**: more than the weapon. Status damage is shown on its own and also shared into the abilities and the weapon that built it (the "+st" part).', '');
const SMALL = 0.05;
const valueRows = [], flagsTiny = [], flagsBig = [];
for (const h of HERO_IDS) {
  if (!D[h]) continue;
  for (const t of TIERS) {
    const wp = avgRate(h, t, 'attack');
    const stTrace = {}; let nsc = 0;
    for (const sc of SCS) { const c = cellOf(h, t, sc.id); if (!c || !c.n) continue; nsc++; const m = c.t / 60; for (const [s, ty] of Object.entries((c.data.st && c.data.st.trace) || {})) for (const v of Object.values(ty)) stTrace[s] = (stTrace[s] || 0) + v / m; }
    for (const k of Object.keys(stTrace)) stTrace[k] /= Math.max(1, nsc);
    const wpv = wp.dmg + (stTrace.attack || 0);
    for (const ab of HEROES[h].abilities) {
      const s = 'ab:' + ab.id, v = avgRate(h, t, s), st = stTrace[s] || 0, tot = v.value + st;
      // what it does that value doesn't count: status build-up put on foes, and buffs or states kept on foes, friends and itself (unit-seconds), a minute
      let ctl = 0, keep = 0, saves = 0, nn = 0;
      for (const sc of SCS) { const c = cellOf(h, t, sc.id); if (!c || !c.n) continue; nn++; const m = c.t / 60;
        for (const mm of Object.values((c.data.st && c.data.st.applied) || {})) ctl += (mm[s] || 0) / m;
        for (const T of [c.data.foeT, c.data.allyT, c.data.selfT]) { const bs = T && T.bySrc && T.bySrc[s]; if (bs) for (const x of Object.values(bs)) keep += x / m; }
        saves += ((c.data.saves && c.data.saves[s]) || 0) / m; }
      ctl /= Math.max(1, nn); keep /= Math.max(1, nn); saves /= Math.max(1, nn);
      const cpm = SCS.reduce((a, sc) => { const c = cellOf(h, t, sc.id); const A = abData(c, ab.id); return a + (c && c.t ? castsOf(A) / (c.t / 60) : 0); }, 0) / SCS.length;
      const r = wpv ? tot / wpv : null;
      valueRows.push({ h, t, ab, v, st, tot, cpm, r, ctl, keep, saves, wpv });
      if (cpm > 0.05 && r != null && r < SMALL) flagsTiny.push({ h, t, ab, tot, r, cpm, v, ctl, keep, saves });
      if (r != null && r > 1) flagsBig.push({ h, t, ab, tot, r, cpm, v, wpv });
    }
  }
}
P('### Abilities worth very little next to the weapon (while they do fire)', '');
P('Split in two: those where the recorder sees next to nothing at all, and those that at least put statuses on foes or keep a buff or state going (their worth is control or support the value can\'t count: section 7). Columns per tier, I / II / III. **Build-up/min**: status build-up it put on foes a minute. **Control s/min**: seconds a minute it added to the stun, root, sleep, freeze, knock-out, fear, shackle, addled, sickness or radiant timers of foes (foe-seconds: two foes held for a second count two). **Kept/min**: unit-seconds a minute of the buffs and timed states it kept on foes, friends or the hero.', '');
const tinyBy = {}; for (const f of flagsTiny) { const k = f.h + ':' + f.ab.id; (tinyBy[k] || (tinyBy[k] = [])).push(f); }
const tinyRow = (fs2) => { const f = fs2[0]; return [nm(f.h), `${f.ab.name} (${f.ab.id})`, fs2.map((x) => TN[x.t]).join(', '), fs2.map((x) => r1(x.cpm)).join(' / '), fs2.map((x) => r1(x.tot)).join(' / '), fs2.map((x) => pct(x.r)).join(' / '), fs2.map((x) => r0(x.ctl)).join(' / '), fs2.map((x) => r1(x.v.ctl)).join(' / '), fs2.map((x) => r0(x.keep)).join(' / '), WHY['empty:' + f.ab.id] || '']; };
const tinyHead = ['Hero', 'Ability', 'Tiers', 'Casts/min', 'Value/min', '% of weapon', 'Build-up/min', 'Control s/min', 'Kept/min', 'Note'];
const doesSomething = (fs2) => fs2.some((x) => x.ctl >= 10 || x.keep >= 3 || x.saves > 0 || x.v.ctl >= 1);
P('**Next to nothing measured:**', ''); table(tinyHead, Object.values(tinyBy).filter((x) => !doesSomething(x)).map(tinyRow));
P('**Control or support instead (value low, but it does something):**', ''); table(tinyHead, Object.values(tinyBy).filter(doesSomething).map(tinyRow));
P('### How much of each hero\'s measured worth is its abilities (tier II)', '');
P('Value a minute at tier II (each scenario counted the same): the weapon (with the status damage it built), the three abilities together (with theirs), and the trait (its own blows, blocks and heals). **Abilities\' share** is the abilities over all three. Low means the hero is mostly its weapon; high means its abilities carry it. Control, cooldown cuts, walls and speed are not in it (see section 7).', '');
const share = HERO_IDS.filter((h) => D[h]).map((h) => {
  const rows = valueRows.filter((x) => x.h === h && x.t === 2), wp = rows.length ? rows[0].wpv : 0, ab = rows.reduce((a, x) => a + x.tot, 0);
  const tr = avgRate(h, 2, 'trait:' + HEROES[h].trait.id).value, tot = wp + ab + tr;
  const best = rows.slice().sort((p, q) => q.tot - p.tot)[0];
  return { h, wp, ab, tr, s: tot ? ab / tot : 0, best };
}).sort((p, q) => q.s - p.s);
table(['Hero', 'Role', 'Weapon/min', 'Abilities/min', 'Trait/min', "Abilities' share", 'Its biggest ability'], share.map((x) => [nm(x.h), HEROES[x.h].role, r0(x.wp), r0(x.ab), r0(x.tr), pct(x.s), x.best ? `${x.best.ab.name} (${r0(x.best.tot)})` : '-']));
P('### Abilities worth more than the weapon', '');
const bigBy = {}; for (const f of flagsBig) { const k = f.h + ':' + f.ab.id; (bigBy[k] || (bigBy[k] = [])).push(f); }
table(['Hero', 'Ability', 'Tiers', 'Casts/min', 'Value/min', 'Mostly', 'Weapon dmg/min', 'x weapon'], Object.values(bigBy).sort((a, b) => Math.max(...b.map((x) => x.r)) - Math.max(...a.map((x) => x.r))).map((fs2) => { const f = fs2[0]; const main = VAL.map((k) => [k, f.v[k]]).sort((a, b) => b[1] - a[1])[0][0]; return [nm(f.h), `${f.ab.name} (${f.ab.id})`, fs2.map((x) => TN[x.t]).join(', '), fs2.map((x) => r1(x.cpm)).join(' / '), fs2.map((x) => r0(x.tot)).join(' / '), main, fs2.map((x) => r0(x.wpv)).join(' / '), fs2.map((x) => r1(x.r) + 'x').join(' / ')]; }));

// ---------------------------------------------------------------- 4. odd things
P('## 4. Things that look broken or odd', '');
// battles that end while the losing side still has someone alive but out of the fight (vanish-check.mjs)
const VF = path.join(repo, 'docs/audit/data/heroes-vanish.json');
if (fs.existsSync(VF)) {
  const V = JSON.parse(fs.readFileSync(VF, 'utf8'));
  P('### Battles that end while a fighter is only out of sight', '');
  P(`Battle mode (battle.js) calls a side beaten when nobody on it is "fighting", and it does not count a unit that is ethereal (bar a sand burrower under the sand). Several heroes go ethereal for a moment as part of an ability (underground, a flock of birds, a broom, a shadow dash, a bush), and the Digger's Bury makes a foe ethereal. When that unit is the last one standing on its side, the battle ends on the spot: a hero alone that ducks out loses, and a lone foe that gets buried counts as beaten. The dungeon is not affected (its room check counts every living enemy). Checked with tools/audit/heroes/vanish-check.mjs: the same battles as the audit, ${V.seeds} seeds each, ${V.fights.toLocaleString('en-GB')} battles, ${V.ended} of them ended this way. **These fights are in the numbers above as they happened**, so these heroes' 1v1 results (and some others) are not real wins or losses; read their win rates and cast counts with that in mind.`, '');
  const by = {}; for (const o of V.rows) { const k = o.hero; const b = by[k] || (by[k] = { hero: o.hero, ended: 0, fights: 0, cells: [], who: {} }); b.ended += o.ended; b.cells.push(`${TN[o.tier]} ${SHORT[o.scen]} ${o.ended}/${o.fights}`); for (const [w2, n2] of Object.entries(o.who)) b.who[w2.replace(/ \(.*/, '') + ' ' + (w2.match(/\((.*)\)/) || ['', ''])[1]] = (b.who[w2.replace(/ \(.*/, '') + ' ' + (w2.match(/\((.*)\)/) || ['', ''])[1]] || 0) + n2; }
  table(['Hero', 'Battles ended so', 'Where (tier, scenario, how many of the seeds)', 'Who was out of it (how, and the last ability they had used)'], Object.values(by).sort((p, q) => q.ended - p.ended).map((b) => [nm(b.hero), b.ended, b.cells.join('; '), Object.entries(b.who).sort((p, q) => q[1] - p[1]).slice(0, 4).map(([w2, n2]) => `${w2} (${n2})`).join(', ')]));
  // the same heroes again with the test runner's battle not ending while someone is only out of sight (fights.mjs fairEnd)
  const FD = path.join(repo, 'docs/audit/data/heroes-fairend');
  if (fs.existsSync(FD)) {
    P('**What these heroes look like when the fight is allowed to go on** (a what-if in the test runner only, fights.mjs \'fairEnd\': the battle does not end while a side\'s last fighter is only out of sight; the game is unchanged). Tier II, the ten battle scenarios, 12 seeds each, the same fights as above. Each cell: as measured above → with the fight allowed to go on.', '');
    const rowsF = [];
    for (const f of fs.readdirSync(FD).filter((x) => x.endsWith('.json'))) {
      const X = JSON.parse(fs.readFileSync(path.join(FD, f), 'utf8')), h = X.hero, T2 = X.tiers[2] || {};
      const g = (src, ids) => { let n = 0, w2 = 0, t = 0; for (const id of ids) { const c = src[id]; if (!c) continue; n += c.n; w2 += c.win || 0; t += c.t; } return { win: n ? w2 / n : 0, len: n ? t / n : 0 }; };
      const duels = ['duelMelee', 'duelRanged', 'duelCaster', 'duelTank'], rest = SCS.filter((s) => !s.dungeon && !duels.includes(s.id)).map((s) => s.id);
      const real = D[h].tiers[2], a1 = g(real, duels), b1 = g(T2, duels), a2 = g(real, rest), b2 = g(T2, rest);
      const cpm = (src, id) => { let c0 = 0, m = 0; for (const s of [...duels, ...rest]) { const c = src[s]; if (!c) continue; m += c.t / 60; c0 += castsOf(c.data.ab[id]); } return m ? c0 / m : 0; };
      rowsF.push([nm(h), `${pct(a1.win)} → ${pct(b1.win)}`, `${r0(a1.len)}s → ${r0(b1.len)}s`, `${pct(a2.win)} → ${pct(b2.win)}`, `${r0(a2.len)}s → ${r0(b2.len)}s`, HEROES[h].abilities.map((ab) => `${ab.name} ${r1(cpm(real, ab.id))} → ${r1(cpm(T2, ab.id))}`).join('; ')]);
    }
    table(['Hero', '1v1 win rate', '1v1 fight length', 'Other battles win rate', 'Other battles length', 'Casts a minute, all ten battles'], rowsF);
  }
}
P('### Casts that leave nothing measurable', '');
P('Casts after which nothing the recorder can see was credited to the ability before its next cast (no damage, heal, block, status, buff, timed state on anyone, or summon). Some of these do things it cannot count (moving the hero, pulling a foe, taunting, walls that stop shots): see the notes.', '');
const empty = [];
for (const h of HERO_IDS) { if (!D[h]) continue; for (const ab of HEROES[h].abilities) { let c0 = 0, p0 = 0; for (const t of TIERS) for (const sc of SCS) { const A = abData(cellOf(h, t, sc.id), ab.id); if (A) { c0 += A.casts || 0; p0 += A.productive || 0; } } if (c0 >= 10 && p0 / c0 < 0.6) empty.push([nm(h), `${ab.name} (${ab.id})`, c0, pct(1 - p0 / c0), WHY['empty:' + ab.id] || '']); } }
table(['Hero', 'Ability', 'Casts (all fights)', 'Casts with nothing measured', 'Note'], empty);
P('### Queued blows thrown away', '');
P('Some abilities queue their blow to land a moment after the cast (an arrow loosed after the draw, a fireball after the gather). In kits.js several of them replace the hero\'s whole queue (u.later = [...]) instead of adding to it, so a second ability cast inside that moment throws the first one\'s blow away: the cooldown is spent and nothing happens. Counted over every fight:', '');
const wipes = [];
for (const h of HERO_IDS) { if (!D[h]) continue; for (const ab of HEROES[h].abilities) { let c0 = 0, wp = 0; const by = {}; for (const t of TIERS) for (const sc of SCS) { const A = abData(cellOf(h, t, sc.id), ab.id); if (A) { c0 += A.casts || 0; wp += A.wiped || 0; for (const [k, v] of Object.entries(A.wipedBy || {})) by[k] = (by[k] || 0) + v; } } if (wp >= 3) wipes.push([nm(h), `${ab.name} (${ab.id})`, c0, wp, pct(wp / Math.max(1, c0)), Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k.split('+').map((x) => (HEROES[h].abilities.some((a) => a.id === x) ? abName(h, x) : x)).join(' + ')} (${v})`).join(', ')]); } }
table(['Hero', 'Ability', 'Casts', 'Blows thrown away', 'Share of casts', 'Thrown away by'], wipes.sort((a, b) => b[3] - a[3]));
P('### Still going when it comes off cooldown', '');
P('How often the ability came off cooldown while something it started last time was still running (its buff, a timed state, a summon, a zone, a timer). The cooldowns lane covers this in depth; this is a flag only.', '');
const mids = [];
for (const h of HERO_IDS) { if (!D[h]) continue; for (const ab of HEROES[h].abilities) { let rd = 0, mi = 0; const what = {}; for (const t of TIERS) for (const sc of SCS) { const A = abData(cellOf(h, t, sc.id), ab.id); if (A) { rd += A.readies || 0; mi += A.midEffect || 0; for (const [k, v] of Object.entries(A.midWhat || {})) what[k] = (what[k] || 0) + v; } } if (mi >= 5 && mi / rd >= 0.2) mids.push([nm(h), `${ab.name} (${ab.id})`, rd, pct(mi / rd), Object.entries(what).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ')]); } }
table(['Hero', 'Ability', 'Times off cooldown', 'Still going', 'What was still going'], mids.sort((a, b) => parseInt(b[3]) - parseInt(a[3])));

// ---------------------------------------------------------------- 5. outcomes
P('## 5. Fight results', '');
P('Win rate and average fight length (s) per scenario. A timeout counts as not a win. In the dungeon a win is clearing the first floor.', '');
for (const t of TIERS) {
  P(`### Tier ${TN[t]}`, '');
  table(['Hero', ...SCS.map((s) => SHORT[s.id])], HERO_IDS.filter((h) => D[h]).map((h) => [nm(h), ...SCS.map((sc) => { const c = cellOf(h, t, sc.id); if (!c || !c.n) return '-'; return `${pct((c.win || 0) / c.n)} ${r0(c.t / c.n)}s${c.timeout ? ' (' + c.timeout + ' t/o)' : ''}`; })]));
}

// ---------------------------------------------------------------- 6. each hero
P('## 6. Each hero', '');
P('For each hero: how often each ability fires (the share of fights it went off in · casts per minute of fighting · the median second of its first cast), and what each part of the kit is worth per minute, at each tier (each scenario counted the same). Then statuses and states, summed over the battle scenarios (not the dungeon) and given per minute of fighting: the build-up applied, bursts, the damage the statuses did, the foe-seconds foes spent built up or in a state (several foes at once count several times), and the seconds the hero spent in its own buffs and in foes\' statuses.', '');
const stPer = (h, t, f) => { const o = {}; let m = 0; for (const sc of SCS) { if (sc.dungeon) continue; const c = cellOf(h, t, sc.id); if (!c || !c.n) continue; m += c.t / 60; f(c, o); } for (const k of Object.keys(o)) o[k] /= Math.max(1e-9, m); return o; };
const fmtMap = (o, k = r0, n = 8) => Object.entries(o).filter(([, v]) => v >= 0.5).sort((a, b) => b[1] - a[1]).slice(0, n).map(([x, v]) => `${x} ${k(v)}`).join(', ') || '-';
const srcName = (h, s) => s === 'attack' ? 'weapon' : s.startsWith('ab:') ? (HEROES[h].abilities.some((a) => a.id === s.slice(3)) ? abName(h, s.slice(3)) : s.slice(3) + ' (a foe\'s, sent back)') : s.startsWith('trait:') ? HEROES[h].trait.name + ' (trait)' : s.startsWith('st:') ? s.slice(3) + ' (status)' : s === 'stat:armour' ? 'armour' : s === 'stat:dodge' ? 'dodge' : s;
for (const h of HERO_IDS) {
  if (!D[h]) continue;
  const H = HEROES[h];
  P(`### ${H.name} (${h}): ${H.role}`, '');
  P(`Trait: ${H.trait.name}: ${H.trait.desc}`, '');
  // firing
  table(['Ability', 'Tier', ...SCS.map((s) => SHORT[s.id])], H.abilities.flatMap((ab) => TIERS.map((t) => [t === 1 ? `**${ab.name}** (${ab.id}, cd ${ab.cd}s)` : '', TN[t], ...SCS.map((sc) => {
    const c = cellOf(h, t, sc.id), A = abData(c, ab.id); if (!c || !c.n) return '-';
    if (ALWAYS_ON.has(ab.id)) return 'always on';
    const f = fireRate(c, ab.id), cpm = castsOf(A) / Math.max(1e-9, c.t / 60);
    const fst = med(A && A.firsts); return f <= 0.1 ? `**${pct(f)}**` : `${pct(f)} · ${cpm < 0.1 ? "<0.1" : r1(cpm)}/m · ${fst == null ? "-" : r0(fst) + "s"}`;
  })])));
  // value
  const srcs = new Set(); for (const t of TIERS) for (const sc of SCS) { const c = cellOf(h, t, sc.id); if (c) for (const s of Object.keys(c.data.src || {})) srcs.add(s); }
  const order = ['attack', ...H.abilities.map((a) => 'ab:' + a.id), 'trait:' + H.trait.id];
  const rest = [...srcs].filter((s) => !order.includes(s)).sort();
  const vcell = (v) => { const parts = []; if (v.dmg >= 0.5) parts.push(r0(v.dmg) + ' dmg'); if (v.heal >= 0.5) parts.push(r0(v.heal) + ' heal'); if (v.block >= 0.5) parts.push(r0(v.block) + ' block'); if (v.guard >= 0.5) parts.push(r0(v.guard) + ' guard'); const x = v.amp + v.bonus + v.prevented; if (x >= 0.5) parts.push(r0(x) + ' via others'); if (v.ctl >= 0.1) parts.push(r1(v.ctl) + ' s control'); if (v.kills >= 0.05) parts.push(r1(v.kills) + ' kills'); return parts.join(', ') || '-'; };
  table(['Source (per minute)', ...TIERS.map((t) => 'Tier ' + TN[t])], [...order, ...rest].filter((s) => srcs.has(s)).map((s) => [srcName(h, s), ...TIERS.map((t) => vcell(avgRate(h, t, s)))]));
  for (const t of TIERS) {
    const ap = stPer(h, t, (c, o) => { for (const [ty, m] of Object.entries((c.data.st && c.data.st.applied) || {})) for (const v of Object.values(m)) o[ty] = (o[ty] || 0) + v; });
    const bu = stPer(h, t, (c, o) => { for (const [ty, m] of Object.entries((c.data.st && c.data.st.bursts) || {})) for (const v of Object.values(m)) o[ty] = (o[ty] || 0) + v; });
    const sd = stPer(h, t, (c, o) => { for (const [ty, v] of Object.entries((c.data.st && c.data.st.dmg) || {})) o[ty] = (o[ty] || 0) + v; });
    const fs1 = stPer(h, t, (c, o) => { const F = c.data.foeT || {}; for (const [k, v] of Object.entries(F.stMine || {})) o[k] = (o[k] || 0) + v; for (const [k, v] of Object.entries(F.stateMine || {})) o[k] = (o[k] || 0) + v; for (const [k, v] of Object.entries(F.hookMine || {})) o[k] = (o[k] || 0) + v; for (const [k, v] of Object.entries(F.buffMine || {})) o[k] = (o[k] || 0) + v; });
    const fsAll = stPer(h, t, (c, o) => { const F = c.data.foeT || {}; for (const [k, v] of Object.entries(F.state || {})) o[k] = (o[k] || 0) + v; });
    const sb = stPer(h, t, (c, o) => { const S = c.data.selfT || {}; for (const [k, v] of Object.entries(S.buffMine || {})) o[k] = (o[k] || 0) + v; for (const [k, v] of Object.entries(S.state || {})) if (['untouchable', 'ethereal', 'hidden'].includes(k)) o[k] = (o[k] || 0) + v; });
    const sf = stPer(h, t, (c, o) => { const S = c.data.selfT || {}; for (const [k, v] of Object.entries(S.st || {})) o[k] = (o[k] || 0) + v; for (const [k, v] of Object.entries(S.state || {})) if (!['untouchable', 'ethereal', 'hidden'].includes(k) && !k.startsWith('busy:')) o[k] = (o[k] || 0) + v; });
    P(`- Tier ${TN[t]}: applied ${fmtMap(ap)}; bursts ${fmtMap(bu, r1)}; status damage ${fmtMap(sd)}. Foe-seconds a minute traced to it: ${fmtMap(fs1)}; all foe states (any cause): ${fmtMap(fsAll)}. Its own buffs and states (s a minute): ${fmtMap(sb)}. Under foes' statuses and states: ${fmtMap(sf)}.`);
  }
  P('');
}

// ---------------------------------------------------------------- 7. what it can't see
P('## 7. What this does not measure', '');
P(fs.existsSync(path.join(here, 'limits.md')) ? fs.readFileSync(path.join(here, 'limits.md'), 'utf8').trim() : '-', '');
fs.writeFileSync(path.join(repo, 'docs/audit/heroes.md'), L.join('\n') + '\n');
console.log(`docs/audit/heroes.md: ${L.length} lines; ${Q.length} quiet abilities, ${Object.keys(tinyBy).length} tiny, ${Object.keys(bigBy).length} big`);
